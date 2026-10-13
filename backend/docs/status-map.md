# 状态页城市地图

## 现状（结论先行）

- 状态页 `/status` 有两张地图卡片：**常住城市**与**当前所在城市**，目前都是杭州（`330100`）。
- 数据来自 `GET /api/status` 的 `cities` 字段，值是 `backend/src/router/status.ts` 顶部的**固定常量** `CITY_MAPS`，结构 `{ resident: { name, adcode, map }, current: {...} }`。
- **Worker 侧完全不出图**：没有 `@kuriyona/amap-box` 依赖、不需要 `AMAP_KEY`、不写任何 KV 键。地图只是一张静态 R2 对象，出图是离线的。
- 前端：`app/components/card/CardCityMap.vue`（`ClientOnly` + `<img>` + `object-cover`）。容器比例 ≥600px 是 `2:1`、窄屏 `1:1`；出图画幅是 1:1 且目标居中，所以裁到 **2:1 ~ 1:2** 之间目标都不会跑出画面。图拿不到就是 404，前端不做任何探测。

## 资源位置

| 项       | 值                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| 桶       | `kuriyona-r2`（`BUCKET_NAME`）                                                                                    |
| 对象键   | `img/site/map/<adcode>.svg` —— **注意不在 `static/` 前缀下**，所以 `/admin/r2` 的浏览根（固定 `static/`）看不到它 |
| 公开地址 | `https://r2.kuriyona.com/img/site/map/330100.svg`                                                                 |
| 当前产物 | 杭州，约 316 KB，`viewBox 0 0 1048 1048`                                                                          |

地址由 `CITY_MAPS` 里的 `map` 字段写死（`https://r2.kuriyona.com/img/site/map/${adcode}.svg`），改城市时要和对象键一起对齐。

## 重新出图

出图参数（与当时生成 `330100.svg` 完全一致，等价 CLI）：

```
--up 1 --down 0 --ratio 1 --outside-same-level --no-title --no-context-labels --no-target-label --center target
```

高德 key 用 `<AMAP_KEY>`（Web 服务 key；本机 `.dev.vars` 里曾经存在，现在已删）。

```bash
cd /home/kuriyona/Dev/@Kuriyona/Kuriyona.com

# 1) 出图（第一次会先拉一次全国索引，然后逐个边界，约 50~90s；缓存落在 temp/map-cache 可复用）
AMAP_KEY=<key> pnpm dlx @kuriyona/amap-box@0.2.0 杭州 \
  --up 1 --down 0 --ratio 1 --outside-same-level \
  --no-title --no-context-labels --no-target-label --center target \
  --out temp/map --cache temp/map-cache
# 产物：temp/map/杭州市-330100-u1d0.svg

# 2) 上传（Bun 自动读根目录 .env 里的 ENDPOINT / ACCESS_KEY_ID / SECRET_ACCESS_KEY / BUCKET_NAME）
bun - <<'EOF'
import { S3Client } from 'bun';
const s3 = new S3Client({
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.ACCESS_KEY_ID!,
  secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  bucket: process.env.BUCKET_NAME!,
});
await s3.file('img/site/map/330100.svg').write(Bun.file('temp/map/杭州市-330100-u1d0.svg'));
console.log('uploaded');
EOF
```

换城市时：把 `杭州` 改成目标城市名（或 adcode），上传时改对象键的 `<adcode>`，并同步改 `backend/src/router/status.ts` 里的 `CITY`。**三处必须一致。**

参数含义（来自 `@kuriyona/amap-box`）：`--up 1` 往上带一级祖先（杭州 → 浙江省），`--down 0` 不再细分，`--outside-same-level` 把视图内与目标同级（浙江其他地级市）和最外层（相邻省份）的轮廓一并画出，`--no-title/--no-context-labels/--no-target-label` 去掉所有文字（标题与城市名由前端卡片负责），`--center target` 让杭州居中并占画幅长边的 0.5 —— 正是这一条保证裁切到 2:1 或 1:2 时目标仍在画面里。

## 为什么出图不在 Worker 里（决策记录）

最初实现过一版「Worker 里用 `@kuriyona/amap-box` 出图 → 写 R2 → KV 存城市配置 + 出图状态」，验证可用（本地 `wrangler dev` 端到端跑通），但被两个平台事实否掉了：

1. **wall time**：一次出图 ≈ **54 秒**（库内部每个边界 `await sleep(350)`，杭州这组要拉约 96 个边界）。而 `waitUntil()` 只给「响应发出/客户端断开后 +30 秒」——[Workers Limits · Duration](https://developers.cloudflare.com/workers/platform/limits/#duration)。所以一次触发跑不完，必须有一个能跨多次调用续跑的机制。
   （顺带纠正一个常见误读：那张表里 HTTP 请求的 duration 是「No limit」，但那是有条件的——_"As long as the client remains connected... When the client disconnects or the response is complete, tasks associated with that request **may be canceled**"_。它不是「任务一定跑完」的保证。）
2. **CPU**：这次改动顺手实测了一次完整出图 ——
   ```
   real 54.048   user 2.566   sys 0.436
   ```
   即 **CPU ≈ 3.0 秒**，几乎全在 `JSON.parse` 约 24 MB 边界数据 + 对国/省界折线做 Douglas-Peucker 抽稀上（等网络的 `sleep` 不计 CPU，解析和渲染计）。而 Workers 的 CPU 上限是 **Free 10 ms / Paid 5 min（默认 30 s）** —— [Workers Limits · CPU time](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)。**Free 计划下 3 秒 CPU 直接 300 倍超限**（Error 1102 `Worker exceeded resource limits`），`waitUntil`、同步 POST、DO 都一样，因为都继承计划的 CPU 上限。

当时的账户计划无法确认：OAuth token 查 `GET /accounts/{id}/subscriptions` 被拒（权限不足），`wrangler whoami` 也不显示计划。

既然城市固定是杭州、图已经在 R2 上，就没有理由把一段 3 秒 CPU、54 秒 wall 的逻辑挂在请求路径上 —— 于是全部移出，只留静态资源和前端展示。**Free 计划下这是唯一可行的形态。**

## 如果将来要搬回 Worker

前提：Workers Paid（否则 3s CPU 无解）。三条路：

| 方案                       | 做法                                                                                                      | 代价                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 同步 POST                  | 管理端一次请求里 `await` 跑完；必须给那一次调用关掉 ky 超时（默认 10s）                                   | 60~90s 的挂起请求；客户端一断就前功尽弃（只留下缓存里的半成品）                           |
| **Durable Object（推荐）** | 一个 DO 实例（`idFromName('amap')`）同时持有「边界缓存 + 出图队列」；`alarm()` 里跑一段、没跑完就自己重挂 | 要加 DO binding + `migrations`（`new_sqlite_classes`，一次性、不可回退）；约 100 行状态机 |
| Workflows                  | 每个 step wall time 无限，天然带重试                                                                      | 要 Paid + 多一个 binding，对这种单次 60s 的活儿偏重                                       |

DO 值得记下来的平台数字（[DO Limits](https://developers.cloudflare.com/durable-objects/platform/limits/) / [DO Pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)）：

- alarm handler wall time **15 分钟**（可重挂 → 天然的分片续跑）；DO 的 RPC/HTTP 调用 wall time 无限。
- DO 默认 CPU 30 秒，`limits.cpu_ms` 可调到 5 分钟。
- 免费计划就有 SQLite-backed DO：100k 请求/天、13,000 GB-s/天、5 GB 存储、500 万行读/天、10 万行写/天。
- **单行 key+value ≤ 2 MB**：现有缓存里最大的一条边界是内蒙古 `150000`，实测约 1.0 MB，恰好够；整套缓存约 24 MB / 97 个键。
- DO 是否豁免 Free 的 10ms CPU 上限，文档口径不一致（Limits 页通用表写 30s 不分计划，同页开头又说 "as a special kind of Worker, Workers Limits apply according to your Workers plan"）—— 若真要用，只能实测。

搬回去时，DO 版理想形态是：DO storage 存 `amap:index` / `amap:<adcode>`，出图成功后把 `{ name, adcode }` 写回 KV（或直接写进响应），公开 `GET /status` 依旧只吐 `{ name, adcode, map }`，前端完全不改。

## 其他已知坑

- **KV 互斥锁不可靠**：KV 是最终一致的（跨 colo 最长约 60s），用 `amap:lock:<adcode>` 防并发出图在不同地区可能同时判空。DO 单线程天然串行，这也是它更合适的原因之一。
- **ky 默认超时 10s**：任何「让请求挂几十秒」的方案都必须显式关掉。
- **`r2.kuriyona.com` 与桶 `kuriyona-r2` 一一对应**：域名后的路径 = 对象键，所以对象键里带 `static/` 的（博客 OG 图等）在 URL 里也带 `static/`；地图这条故意放在 `static/` 之外。
- 历史实现留在 commit `657bdb4`（含 KV 城市配置、`/admin/status`、`useCityMaps` 轮询、`amap:*` 缓存与互斥锁），需要参考时 `git show 657bdb4`。
- 生产 `GET /api/status` 目前返回 **500**（与本功能无关，尚未追查）；注意当时线上跑的是更早的构建（`/admin/status` 返回 404），这个 500 不是本次改动引入的。

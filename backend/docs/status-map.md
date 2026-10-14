# 状态页城市地图

## 现状（结论先行）

- 状态页 `/status` 有两张地图卡片：**常住城市**与**当前所在城市**，默认都是杭州（`330100`）。
- 数据来自 `GET /api/status` 的 `cities` 字段：读 KV 键 `city:maps`（`backend/src/city-map.ts` 的 `readCityMaps`），缺失或坏值时回退默认杭州；结构 `{ resident: { name, adcode, map }, current: {...} }`。
- **出图跑在管理端浏览器里**：`/admin/status`（`app/pages/admin/status.vue`）动态 `import('@kuriyona/amap-box')`，浏览器拉边界 + 渲染 SVG，然后直传 R2、写 KV 城市配置。Worker 侧只做三件薄事（`backend/src/router/map.ts`），CPU ≈ 0：**不**在请求路径上出图，也**不**搬运 SVG 字节。
- 前端：`app/components/card/CardCityMap.vue`（`ClientOnly` + `<img>` + `object-cover`）。容器比例 ≥600px 是 `2:1`、窄屏 `1:1`；出图画幅是 1:1 且目标居中，所以裁到 **2:1 ~ 1:2** 之间目标都不会跑出画面。图拿不到就是 404，前端不做任何探测。

## 线上链路

| 步骤     | 位置                                                                                        | 说明                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1 出图   | 浏览器 `/admin/status`                                                                      | 参数与离线脚本逐字一致（见下）；高德 key 由 Worker 注入，前端拿不到                                                                 |
| 2 取边界 | `GET /api/status/amap`（`requireAuthKey`）                                                  | 转发高德并注入 `AMAP_KEY`；KV 缓存 30 天，键 `amap:<排序后的查询串>`，只缓存 `status==="1"` 的响应；`?nocache=1` 只绕过读、不绕过写 |
| 3 渲染   | 浏览器                                                                                      | `JSON.parse` + 道格拉斯-普克抽稀 + SVG 拼接，CPU 全在管理员机器上                                                                   |
| 4 上传   | `GET /api/status/map/upload-url?adcode=` → 浏览器 `PUT` 到 R2                               | `presignR2Put(key, 'image/svg+xml')`；**签名包含 Content-Type**，PUT 必须原样带同一个值                                             |
| 5 写配置 | `PUT /api/status/cities`（`requireAuthKey`），体 `{ resident: { name, adcode }, current? }` | 省略 `current` 时跟随 `resident`；写 KV `city:maps`，`map` 由 Worker 按 adcode 拼                                                   |
| 6 读取   | `GET /api/status`（公开）                                                                   | `cities` 读 KV `city:maps`、缺失时回退默认杭州；响应带 `cache-control: max-age=1800`，改城市后 CDN 最长 30 分钟才跟上               |

浏览器侧缓存：边界按 adcode 存 IndexedDB（`app/utils/idbCache.ts`）。一组实测 41 个键 / 约 6 MB —— localStorage 的 5 MB 配额装不下，也不适合同步 IO，所以用它。页面上的「忽略缓存重新取数」会清掉这层并让代理绕过 KV。

## 资源位置

| 项       | 值                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| 桶       | `kuriyona-r2`（`BUCKET_NAME`）                                                                                    |
| 对象键   | `img/site/map/<adcode>.svg` —— **注意不在 `static/` 前缀下**，所以 `/admin/r2` 的浏览根（固定 `static/`）看不到它 |
| 公开地址 | `https://r2.kuriyona.com/img/site/map/330100.svg`                                                                 |
| 当前产物 | 杭州，约 316 KB，`viewBox 0 0 1048 1048`                                                                          |

地址由 `backend/src/city-map.ts` 的 `cityMapUrl` 拼（`https://r2.kuriyona.com/img/site/map/${adcode}.svg`），改城市时要和对象键一起对齐。

## 出图参数（两条路共用）

```
up: 1 · down: 0 · ratio: 1 · outsideSameLevel: true
title: false · contextLabels: false · targetLabels: false · center: 'target'
```

即 CLI 的 `--up 1 --down 0 --ratio 1 --outside-same-level --no-title --no-context-labels --no-target-label --center target`：

- `--up 1` 往上带一级祖先（杭州 → 浙江省），`--down 0` 不再细分；
- `--outside-same-level` 把视图内与目标同级（浙江其他地级市）和最外层（相邻省份）的轮廓一并画出；
- `--no-title/--no-context-labels/--no-target-label` 去掉所有文字（标题与城市名由前端卡片负责）；
- `--center target` 让杭州居中并占画幅长边的 0.5 —— 正是这一条保证裁切到 2:1 或 1:2 时目标仍在画面里。

**版本对照（0.4.0 vs 0.2.0）**：同一组参数下两版出图**逐字节相同**（`sed 's|<metadata>.*</metadata>||'` 后 sha256 一致，均为 316477 B / `viewBox 0 0 1048 1048`），唯一差别是 SVG 内嵌 `<metadata>` 里的 `generator` 版本号与这轮取数统计。也就是说 0.4.0 只改了取数路径（内置索引、bbox 预筛、分片）与 API 表面，渲染结果没动。

## 重新出图

### 线上（推荐）：`/admin/status`

管理页填城市名或 adcode → 「出图」→ 核对预览 → 「上传并应用」。冷缓存（本机 IndexedDB 与 KV 都没有）约 25 秒、41 次取数；热缓存不到 1 秒、0 次取数。

### 离线（备选）：CLI

同样参数下产物与线上一致，适合批量 / 换城市前先看效果：

```bash
cd /home/kuriyona/Dev/@Kuriyona/Kuriyona.com

# 0.4.0：全国索引随包内置，首次运行零索引请求；同级候选先按内置 bbox 预筛。
# 冷缓存实测 41 次取数 / wall 21s / CPU 0.9s（0.2.0 同参数是 96 次 / 54s / 3.0s）；
# 热缓存 0 取数 / wall 0.3s。缓存落在 temp/map-cache 可复用，中断也是安全的——已拉到的边界立刻落盘。
AMAP_KEY=<key> pnpm dlx @kuriyona/amap-box@0.4.0 杭州 \
  --up 1 --down 0 --ratio 1 --outside-same-level \
  --no-title --no-context-labels --no-target-label --center target \
  --out temp/map --cache temp/map-cache
# 产物：temp/map/杭州市-330100-u1d0.svg

# 上传（Bun 自动读根目录 .env 里的 ENDPOINT / ACCESS_KEY_ID / SECRET_ACCESS_KEY / BUCKET_NAME）
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

换城市时：把 `杭州` 改成目标城市名（或 adcode），上传时改对象键的 `<adcode>`，并把 KV `city:maps` 一起改（管理端「上传并应用」会做这一步；离线跑就 `PUT /api/status/cities`）。**三处必须一致。**

## 为什么不把出图放进 Worker（决策记录）

最初实现过一版「Worker 里用 `@kuriyona/amap-box` 出图 → 写 R2 → KV 存城市配置 + 出图状态」，验证可用（本地 `wrangler dev` 端到端跑通），但被两个平台事实否掉了：

1. **wall time**：0.2.0 一次出图 ≈ **54 秒**（库内部每个边界 `await sleep(350)`，杭州这组要拉约 96 个边界）。而 `waitUntil()` 只给「响应发出/客户端断开后 +30 秒」——[Workers Limits · Duration](https://developers.cloudflare.com/workers/platform/limits/#duration)。所以一次触发跑不完，必须有一个能跨多次调用续跑的机制。
   （顺带纠正一个常见误读：那张表里 HTTP 请求的 duration 是「No limit」，但那是有条件的——_"As long as the client remains connected... When the client disconnects or the response is complete, tasks associated with that request **may be canceled**"_。它不是「任务一定跑完」的保证。）
   **0.4.0 这一侧有解**：杭州这组降到 41 次 / 21s，并给了分片原语 —— `maxFetches`（跑满即正常返回，未跑完的图 `svg: null` + warn）配 `signal`（保证不再发下一次请求），缓存是唯一进度记录，`perf.cacheMisses` 为空即跑完。
2. **CPU**（这条没被 0.4.0 解决）：
   ```
   0.2.0  real 54.048   user 2.566   sys 0.436   # 96 条边界
   0.4.0  real 21.1     user 0.907   sys 0.170   # 41 条边界（冷缓存；热缓存 user 0.38）
   ```
   **CPU ≈ 0.9 秒**（0.2.0 是 3.0 秒），几乎全在 `JSON.parse` 边界数据 + 对国/省界折线做 Douglas-Peucker 抽稀上（等网络的 `sleep` 不计 CPU，解析和渲染计）。Workers 的 CPU 上限是 **Free 10 ms / Paid 5 min（默认 30 s）** —— [Workers Limits · CPU time](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)。**Free 计划下 0.9 秒仍是 10 ms 的近百倍**（Error 1102 `Worker exceeded resource limits`），`waitUntil`、同步 POST、DO 都一样，因为都继承计划的 CPU 上限。分片能切 wall time，但切不动单条大边界（内蒙古 `150000` 约 1.0 MB）的解析 + 抽稀成本。

当时的账户计划无法确认：OAuth token 查 `GET /accounts/{id}/subscriptions` 被拒（权限不足），`wrangler whoami` 也不显示计划（本机现在连 Cloudflare API 都因代理不通）。

既然城市基本不变、图已经在 R2 上，就没有理由把一段 0.9 秒 CPU、21 秒 wall 的逻辑挂在请求路径上。**Free 计划下「CPU 不进请求路径」是唯一可行的形态**，于是最终选了把出图放到管理员浏览器里（见上）。

## 方案对照（万一以后想改到别处）

| 方案                   | 做法                                                                                               | 门槛与代价                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **客户端出图（现用）** | 管理页 `import('@kuriyona/amap-box')`，浏览器出图，Worker 只代理取数 + 签发上传地址 + 写配置       | 免 Paid、无需新 binding；出图绑在管理端页签上（关页签中断，重开接着跑）             |
| 同步 POST              | 管理端一次请求里 `await` 跑完；必须给那一次调用关掉 ky 超时（默认 10s）                            | 要 Paid；冷缓存 ~21s 挂起请求；客户端一断就前功尽弃（只留下缓存里的半成品）         |
| Durable Object         | DO 实例（`idFromName('amap')`）同时持有「边界缓存 + 出图队列」，`alarm()` 里跑一段、没跑完自己重挂 | 要加 DO binding + `migrations`（`new_sqlite_classes`，不可回退）；约 100 行状态机   |
| Workflows              | 每个 step wall time 无限，天然带重试                                                               | Free 也有 Workflows，但每 step CPU 同为 10 ms → 一样不成立；对单次 21s 的活儿也偏重 |

**计划门槛（2026-10 的文档口径）**：

- 普通 Worker 请求的 CPU：Free **10 ms** / Paid 30 s（可调 5 min）—— 同步 POST 这条路必须 Paid。
- **subrequest 不是障碍**：对外 `fetch` 41 次 < Free 的 50/请求；KV / R2 等 Cloudflare 服务另算一档「内部服务」预算（Free 1,000/调用），不占那 50。
- **DO 是 Worker 侧唯一可能免 Paid 的路**：DO 在 Free 上就有（SQLite-backed），其调用 CPU 上限文档写的是「30 s 默认 / 可调 5 min」且不分计划；但同页开头与 FAQ 又说 DO「作为特殊 Worker，按你的 Workers 计划继承限制」。Workers Limits 页在「CPU 超限怎么办」里建议 _"Offload work — Move expensive computation to Durable Objects"_，暗示 Free 下的 DO 调用不受 10 ms 约束，但**没有明文**，只能实测。
- Free 的其他配额够用：KV 1,000 写/天（冷缓存一轮 41 写）、100k 读/天；DO Free 5 GB 存储（单对象 1 GB）。

DO 值得记下来的平台数字（[DO Limits](https://developers.cloudflare.com/durable-objects/platform/limits/) / [DO Pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)）：

- alarm handler wall time **15 分钟**（可重挂 → 天然的分片续跑）；DO 的 RPC/HTTP 调用 wall time 无限。
- DO 默认 CPU 30 秒，`limits.cpu_ms` 可调到 5 分钟。
- 免费计划就有 SQLite-backed DO：100k 请求/天、13,000 GB-s/天、5 GB 存储、500 万行读/天、10 万行写/天。
- **单行 key+value ≤ 2 MB**：现有缓存里最大的一条边界是内蒙古 `150000`，实测约 1.0 MB，恰好够（杭州 `u1d0` 这一组实测 41 个键 / 6.3 MB；0.2.0 那版整轮缓存约 24 MB / 97 个键）。
- **索引不是必须存的**：0.4.0 起全国行政区划索引随包内置（发版时冻结，约 0.5 MB），`cache.read('index')` 返回空就用内置那份。

## 前提与已实测事实（客户端方案）

- **高德接口允许浏览器直连**：`restapi.amap.com/v3/config/district` 带 `Origin` 请求返回 `Access-Control-Allow-Origin: *`，预检 OPTIONS 亦通。所以理论上可以直连；这里仍走 Worker 代理，只是为了**不让 key 进浏览器**（并顺带把边界缓存在 KV）。
- **库能在浏览器跑**：`dist` 核心 462 KB raw / **105 KB gzip**，无 `node:` 内置模块、无 `Buffer`/`process`，只用 `globalThis.crypto`（WebCrypto，https/localhost 下可用）。`pnpm optimizeDeps.include` 里加了它，且只在 `/admin/status` 的路由 chunk 里按需加载。
- **presign 的 Content-Type 是签名的一部分**：上传时 PUT 必须带与签发时一致的 `image/svg+xml`，否则 R2 报签名不匹配（实测不带 → 403）。`image/svg+xml` 不是 CORS safelisted 类型，所以浏览器会先发预检 —— 桶的 CORS 策略已放行 `PUT` + `content-type` + `Origin: https://kuriyona.com`（实测预检 204 且带 `Access-Control-Allow-Origin`）。**副作用**：本地 origin（`http://127.0.0.1:62802`、`https://kuriyona.localhost`）不在放行名单里，本地直传会被预检拦下（`/admin/r2` 同理）；离线脚本走 S3 签名，不受 CORS 约束。

## 实测记录（2026-10-14，本地 wrangler dev + dist）

- 页面（`/admin/status`，headless Chromium）：预填线上城市 → 出图 → 预览 `1048×1048` → `出图完成：新增取数 41 条 · 15.4s`（KV 已热的路径；冷缓存是 41 次回源 ≈ 23s，Bun 脚本实测 22.7s）。墙钟几乎全被库内每边界 `sleep(350)` 占掉：41 × 350ms ≈ 14.4s。
- 生成结果与 CLI 出的 `杭州市-330100-u1d0.svg` **逐字节相同**。
- 「上传并应用」：常住与当前同城 → 只发 **1** 次预签名 PUT（`img/site/map/330100.svg`，`content-type: image/svg+xml`，`X-Amz-SignedHeaders=content-type;host`），随后 `PUT /api/status/cities` 写入 KV 成功、页面提示 `完成：常住 杭州市 / 当前 杭州市`。验证时把 R2 PUT 打桩（返回 200 + CORS 头），未写任何生产对象。
- 代理端点：无 `auth` → 401、非法 adcode → 400、非法 body → 400；回源 212ms vs KV 命中 37ms；参数顺序打乱命中同一条缓存；`nocache=1` 回源。

## 其他已知坑

- **`AMAP_KEY` 只在 Worker 侧**：`backend/src/env.ts` 里是可选项（`REQUIRED_ENV` 不含它，其他路由不受影响），缺失时只有 `/api/status/amap` 返回 500 `[config] 缺少必需的环境变量: AMAP_KEY`。本地放 `.dev.vars`，生产 `wrangler secret put AMAP_KEY`。
- **ky 默认超时 10s**：代理取数是单次请求，不受影响；但任何「让一次请求挂几十秒」的方案都必须显式关掉。
- **`r2.kuriyona.com` 与桶 `kuriyona-r2` 一一对应**：域名后的路径 = 对象键，所以对象键里带 `static/` 的（博客 OG 图等）在 URL 里也带 `static/`；地图这条故意放在 `static/` 之外。
- **`/admin/status` 的 `results` 用 adcode 去重**：常住与当前相同时只出一张图、只上传一次。
- 历史实现留在 commit `657bdb4`（含 KV 城市配置、`/admin/status`、`useCityMaps` 轮询、`amap:*` 缓存与互斥锁），需要参考时 `git show 657bdb4`。
- 生产 `GET /api/status` 曾返回 **500**（2026-10-14 复现：`status=500`、body `Internal Server Error`，同期 `/api/ask-box` 200），与本功能无关，尚未追查。

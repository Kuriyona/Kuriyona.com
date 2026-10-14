# 缓存清除（管理端）

## 现状（结论先行）

- 管理页 `/admin/cache`（`app/pages/admin/cache.vue`）：选域名 → 选清除方式（URL / 主机名 / 标签 / 前缀）→ 填条目 → 清除；最近清除的记录存在本机 localStorage，点一下可以填回输入框。
- Worker 只做两件薄事（`backend/src/router/cache.ts`）：列 token 可见的 zone、把清除请求转发给 Cloudflare。**token 只存在 Worker 侧**（`CF_API_TOKEN`，浏览器拿不到），所以前端不直连 Cloudflare API。
- 起因：地图 SVG 换新后边缘缓存最长 24 小时才自然过期（对象带 `cache-control: max-age=86400`），需要能在管理面板里手动清。

## 需要的 API Token 权限

在 [Cloudflare Dashboard → My Profile → API Tokens → Create Token（Custom token）](https://dash.cloudflare.com/profile/api-tokens) 建一个自定义 token：

| 区块 | 权限                           | 为什么需要                                                                              |
| ---- | ------------------------------ | --------------------------------------------------------------------------------------- |
| Zone | **Zone → Zone → Read**         | `GET /zones` 列域名下拉；传域名时用 `/zones?name=` 换 zone id                           |
| Zone | **Zone → Cache Purge → Purge** | `POST /zones/{zone_id}/purge_cache`（URL / 主机名 / 标签 / 前缀四种方式共用这一条权限） |

- **Zone Resources** 选 `Include → All zones`（或具体几个域名）。只 Include 一个域名时，那个域名之外的清除会被 Cloudflare 拒（502 + Cloudflare 的错误信息）。要清「名下其他域名」就必须覆盖到它们。
- 不需要 **Account** 级任何权限，也不需要 Zone Settings / Cache Rules / Workers 的权限（那是给 `wrangler deploy` 的 token 用的，两者互不替代）。
- 内部权限名分别是 `zone:read` 与 `cache_purge:edit`；`purge_everything` 同样是 `cache_purge:edit`。

写入方式（生产）：

```bash
printf '%s' '<token>' | pnpm exec wrangler secret put CF_API_TOKEN
```

本地开发放进根 `.dev.vars` 的 `CF_API_TOKEN=`（见 `.dev.vars.example`）。

## 端点

| 端点                                        | 说明                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `GET /api/cache/zones`（`requireAuthKey`）  | 返回 `{ zones: [{ id, name, status, plan }] }`。翻页最多 5 页 × 50；token 缺 `Zone:Read` 时 502 + Cloudflare 原文 |
| `POST /api/cache/purge`（`requireAuthKey`） | body `{ zone, type, targets }`，成功返回 `{ success, zone, type, purged }`                                        |

`zone` 既接受 32 位 zone id（如 `d9a70ef0a143cb0897a16d6779edd1ae`），也接受域名（内部按 `/zones?name=` 查一次）。`type` 与 `purge_cache` 字段的对应：

| `type`     | 页面上的名字 | `purge_cache` 字段 | 条目格式                                                          |
| ---------- | ------------ | ------------------ | ----------------------------------------------------------------- |
| `url`      | URL          | `files`            | 完整 URL，含 `https://`                                           |
| `hostname` | 主机名       | `hosts`            | 裸主机名（`r2.kuriyona.com`），不带协议与路径                     |
| `tag`      | 标签         | `tags`             | 源站 `Cache-Tag` 响应头里的标签，不含空白                         |
| `prefix`   | 前缀         | `prefixes`         | `主机名/路径`（`r2.kuriyona.com/img/`），不带协议 / 查询串 / 锚点 |

状态码：参数不合法 400（逐条给出是哪一个值不对）、zone 找不到 400、Cloudflare 拒绝或网络失败 502（`message` 是 Cloudflare 原文 + 错误码）、成功 200。

## 限制与注意

- **单次最多 100 条**（Free/Pro/Business 的「Max operations per request」都是 100；面板 UI 自己限制 30 条，我们的页面按 API 的 100 校验）。超出直接 400，不截断。
- 速率：Hostname / Tag / Prefix / 全部清除 是 **5 次/分钟**（Free，桶容量 25）；单 URL 清除是 800 URL/秒。密集调用会拿到 Cloudflare 的限流错误（这里会以 502 + 原文透传）。
- **200 只代表 Cloudflare 收下了请求**，不代表真的有内容被清掉。验证方式是再请求一次该资源，看 `CF-Cache-Status` 是否不再是 `HIT`：
  ```bash
  curl -sD - -o /dev/null https://r2.kuriyona.com/img/site/map/330100.svg | grep -i cf-cache-status
  ```
- `r2.kuriyona.com` 是 `kuriyona.com` 这个 zone 下的 R2 自定义域，**属于同一个 zone**：清 `https://r2.kuriyona.com/img/site/map/330100.svg` 用 zone `d9a70ef0a143cb0897a16d6779edd1ae` 即可。
- 用 wrangler 的 **OAuth 登录凭证不能替代**这个 token：调 purge 会返回 `Authentication error（10000）`（OAuth token 没有 `cache_purge` 权限，只有 `zone:read` 之类）。实测记录见下。

## 实测记录

- 2026-10-15：用 `~/.wrangler/config/default.toml` 的 OAuth token 手工调 `POST /zones/d9a70ef0a143cb0897a16d6779edd1ae/purge_cache` → `{"success":false,"errors":[{"code":10000,"message":"Authentication error"}]}`；同一 token 调 `GET /zones?name=kuriyona.com` 正常返回区域 ID `d9a70ef0a143cb0897a16d6779edd1ae`。即：能读、不能清 —— 印证上面的权限清单。
- 对象与边缘缓存的对照：R2 对象更新后（`?cb=<随机>` 绕过边缘缓存）读到的 `content-length`/`sha256` 已是新值，裸 URL 仍是旧值（`cf-cache-status: HIT`、`age` 近 20 小时、`max-age=86400`）。

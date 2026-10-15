# AGENTS.md

Cloudflare Workers + Hono + Drizzle + D1 的个人 API 服务，作为 [Kuriyona.com](https://github.com/Kuriyona/Kuriyona.com) 根仓库的**独立子包**保留自己的 `pnpm-lock.yaml`（非根 pnpm workspace 成员）。入口 `backend/index.ts` 导出 Hono app（无 `listen`），与 Nuxt 静态产物同属一个根 Worker（根 `wrangler.jsonc`，`name = "kuriyona-web"`，`main = "backend/index.ts"`，`assets.directory = "./dist"`）。

## Commands

> 在**仓库根目录**用 `pnpm api:*` 转发到本目录 / wrangler：
>
> - `pnpm api:install` = `pnpm --dir backend install`
> - `pnpm api:dev` = `PORTLESS_TLD=localhost portless run --name kuriyona-api --app-port 62802 wrangler dev --port 62802`（portless 域名 `https://kuriyona-api.localhost`）
> - `pnpm api:run` = `wrangler dev --port 62802`（不经 portless，`http://localhost:62802`）
> - `pnpm api:orm-generate` = `pnpm --dir backend run orm-generate`
> - `pnpm api:d1:migrate:local` / `pnpm api:d1:migrate:remote` = `wrangler d1 migrations apply kuriyona-db --local|--remote`
> - `pnpm run deploy` = `pnpm run build`（generate + pagefind index）+ `wrangler deploy`

- Install deps: 根 `pnpm install` + `pnpm api:install`（或 `pnpm --dir backend install`）。包管理与运行时统一 pnpm，**不用 npm/Bun**。
- Run: `pnpm api:dev`（仓库根；需根目录 `dist/` 存在，否则先 `pnpm generate`）。本地 env 来自根 `.dev.vars`。两个 62802（`--app-port` 与 `wrangler dev --port`）成对：wrangler 不读 portless 注入的 `PORT`；细节见根 `AGENTS.md`。
- Type/sanity check: 无 `tsc`、无 test、无 lint。用 `pnpm exec wrangler deploy --dry-run`（仓库根）做构建校验。
- Migrations: 改 `src/db/schema.ts` → `pnpm api:orm-generate` → `pnpm api:d1:migrate:local`（部署时 `:remote`）。
- Deploy: 见 `docs/deployment.md`。

## Non-obvious architecture

- **DB 是 D1**（SQLite）。`src/utils.ts` 的 `getDb(env)` = `drizzle(env.DB)`，用 `drizzle-orm/d1`；schema 用 `drizzle-orm/sqlite-core`。
- **迁移由 wrangler 应用，不是运行时**。`wrangler.jsonc` 的 `d1_databases[0]` 配 `migrations_dir: backend/drizzle` + `migrations_pattern: backend/drizzle/*/migration.sql` 消费 drizzle 生成的嵌套目录。`index.ts` 不做 migrate。
- **Env 从 `c.env` 读**（`Env` 接口见 `src/env.ts`）。API 根 app 上的中间件逐项校验 `REQUIRED_ENV`（7 项），缺失返回 500 `[config] 缺少必需的环境变量: <KEY>`；`DB`（D1）与 `STATUS_KV`（KV）由 binding 提供；`AMAP_KEY` 可选（`/city/amap` 代理与 `/api/city` 的常住城市天气中心点用它，缺失时前者自己 500、后者回退默认城市中心点，其余路由不受影响）。`CF_API_TOKEN` 可选（管理端清缓存 `/cache/*` 用它，需要 Cloudflare 的 **Zone:Read + Cache Purge** 权限，见 `docs/cache-purge.md`；缺失时只有 `/cache/*` 报 500）。本地 `.dev.vars`，生产 `wrangler secret put`。
- **API 全部挂在 `/api/*`**：根 app 显式注册 `/api`、`/api/`，其余用 `app.route("/api", api)`。`wrangler.jsonc` 的 `run_worker_first: ["/api", "/api/*"]` 保证这些路径交给 Worker 而非静态资产。
- **Auth 两个中间件**（`src/plugin/auth.ts`）：`requireAuthKey` 校验 `?auth=AUTH_KEY`（admin/r2/city/cache 写接口）；`requireJwt` 校验 `Authorization`（裸 token 或 `Bearer ` 前缀均兼容，公开 ask-box POST 用）。JWT 由 `hono/jwt` HS256 签发，`exp = now/1000 + 7200`。
- **`/turnstile` 成功返回 `c.text(jwt)`（纯文本），失败 `c.json(null)`**——前端用 `.text()` 读取，勿改成 `c.json`。
- **R2 用 aws4fetch（S3 API），无 R2 binding**：`utils.ts` 的 `presignR2Put` 用 `signQuery` 预签名 PUT（`X-Amz-Expires=86400`），`router/r2.ts` 的 `listR2` 走 `ListObjectsV2` 并手写 XML 解析（无第三方 XML 库）。四变量：`ENDPOINT`/`ACCESS_KEY_ID`/`SECRET_ACCESS_KEY`/`BUCKET_NAME`。
- **城市地图与天气：出图在管理端浏览器，Worker 只做代理/签名/写配置**。`GET /city` 的 `resident`/`current` 读 KV `city:maps`（`src/city-map.ts` 的 `readCityMaps`，缺失/坏值回退默认杭州，KV 只存 `{ name, adcode }`），`map` 指向 R2 静态对象 `img/site/map/<adcode>.svg`。`src/router/city.ts` 三个端点（都要 `requireAuthKey`）：`GET /city/amap` 转发高德并注入 `AMAP_KEY` + KV 缓存 30 天（`amap:*`，`?nocache=1` 只绕过读）、`GET /city/map/upload-url?adcode=` 签发 R2 直传地址（签名**含** `Content-Type`，PUT 必须原样带）、`PUT /city` 写 KV 城市配置。出图本身在前端 `app/pages/admin/city.vue`（动态 `import('@kuriyona/amap-box')`，边界缓存走 IndexedDB）。`GET /city` 的 `resident.weather` 也依赖常住城市：`src/amap.ts` 的 `cityCenter` 用 `resident.adcode` 查高德中心点（KV `amap:center:<adcode>`，30 天）→ 交给 QWeather `location=<经度>,<纬度>`，缓存 `cache:weather:<adcode>`；`AMAP_KEY` 缺失时回退默认城市中心点。**不要**把出图搬进 Worker 请求路径：一次出图 CPU 实测 ~0.9s、wall 21s，Free 上限 10ms / Paid 30s，分片切得动 wall、切不动 CPU —— 完整理由与备选方案见 `docs/city-map.md`。
- **缓存清除：Worker 只做转发**（`src/router/cache.ts`，都要 `requireAuthKey`）：`GET /cache/zones` 列 `CF_API_TOKEN` 可见的 zone（管理页域名下拉，最多 5 页 × 50），`POST /cache/purge` 把 `{ zone, type, targets[] }` 转成 `POST /zones/{id}/purge_cache` 的 `files|hosts|tags|prefixes`（`zone` 接受 zone id 或域名，域名走 `/zones?name=` 现查）。单次上限 100 条（Cloudflare 的 Max operations per request，Free/Pro/Business 同），超限 400 不截断；Cloudflare 的拒绝/网络失败以 502 + 上游原文（含错误码）返回。token 权限与限流见 `docs/cache-purge.md`；管理页 `app/pages/admin/cache.vue`，最近清除记录只存本机 localStorage。
- **音乐：用 `@kuriyona/cecilia` 取网易云歌单，一个公开只读端点**（`src/router/music.ts`，无 auth）：`GET /music/playlist` 取固定歌单（`PLAYLIST_ID = 18488781852`「JW」）的曲目列表，上游结果原样存 KV `cache:music:playlist:<id>`（TTL 6h，浏览器再缓存 1h）。**播放地址不经过 Worker**：前端（`app/composables/useMusic.ts` 的 `outerUrl()`）直接拼 `https://music.163.com/song/media/outer/url?id=<id>.mp3`，由浏览器跟随 302 到 CDN 直链 —— 因此没有音频代理，也不占 Worker 带宽，Range/seek 全交给 CDN。注意该 302 的 `Location` 是 `http://`（CDN 同 host+path 支持 https，实测 206），站点是 https，靠浏览器把 http 媒体子资源升级到 https 的方式播放（Chrome 与 Safari 实测均正常）；调用点必须写 https，写 `http://` 会被直接拦掉。封面同理加 `?param=96y96`（375 KB → 3.4 KB）并由 `toHttps` 升级协议。上游失败 = 502 + `[netease] <原文>`。
- **`@kuriyona/cecilia` 需两个 pnpm patch 才能在 workerd 里跑**（`patches/@kuriyona__cecilia@1.0.0.patch`，注册在 `pnpm-workspace.yaml` 的 `patchedDependencies`）：workerd 的 `node:crypto` 与 Node 有两处差异 —— ① `createCipheriv("aes-128-ecb", key, null)` 被拒（Node 允许 ECB 用 null iv），改为 `Buffer.alloc(0)`；② `publicEncrypt` 不接受 `PublicKeyObject`（Node 接受），改为直接把 PEM 字符串传进去。cecilia 的 eapi 走 ①、weapi 走 ②（`getPlaylistTracks` 会经 weapi 的 `getSongsDetail`），不 patch 则 `GET /music/playlist` 直接 502。上游修好（改这两行并发版）后即可删掉 patch 并去掉 `patchedDependencies`。
- **城市数据全在 Workers KV**（binding `STATUS_KV`，命名空间 `kuriyona-kv`，配在根 `wrangler.jsonc` 的 `kv_namespaces`）。四类键：`city:maps`（城市地图配置，管理端出图后写入，value 只存 `{ name, adcode }`，`map` 由 adcode 推导）、`cache:weather:<adcode>`（天气上游缓存，value 为 `{ at, data }`，KV TTL = 新鲜期×2 = 1 小时，未到期前可作上游失败时的回退值）、`amap:*`（高德缓存：`amap:<排序后的查询串>` 边界响应原文，与 `amap:center:<adcode>` 城市中心点 `经度,纬度` 字符串，TTL 均 30 天；后者供 QWeather 按坐标查天气）、`cache:music:playlist:18488781852`（`/music/playlist` 的上游结果原文缓存，TTL 6 小时）。

## Schema conventions

- Snake_case 列名显式传入：`sqliteTable("ask_table", { showName: integer("show_name"), ... })`。
- 时间戳是 `integer(...)`，存 epoch **ms**；`asked_at`/`answered_at` 可为 null（旧 MySQL 的 `bigint` 语义）。
- `ask_table.id` 是 `text` 主键，UUID v4 由 `$defaultFn(() => crypto.randomUUID())` 在 app 侧生成（SQL 无默认值）。
- `public` 是列名（int 0/1）；不要改名。

## Migration / cleanup state

迁移历史在从 MySQL 切到 D1 时重置：旧的 MySQL / SQLite 迁移与空的 `20261008053904_worthless_kabuki/` 已删除，当前为 `backend/drizzle/<timestamp>_init/migration.sql`（`ask_table` + 已废弃的 `status_data`）与后续删除 `status_data` 的迁移（Status 数据迁到 Workers KV 后 D1 不再有该表）。Docker/镜像相关文件（`Dockerfile`、`.dockerignore`、`scripts/image.sh`、`docs/image.md`、`.env.example`）已移除。不要「恢复」这些已删除的文件。

## Style

- Code comments and docs are in Chinese; match that when adding docs.
- Formatter `oxfmt` 在 devDeps；根 `pnpm fmt` 会跑（含 i18n 排序）。

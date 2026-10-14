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
- **Env 从 `c.env` 读**（`Env` 接口见 `src/env.ts`）。API 根 app 上的中间件逐项校验 `REQUIRED_ENV`（7 项），缺失返回 500 `[config] 缺少必需的环境变量: <KEY>`；`DB`（D1）与 `STATUS_KV`（KV）由 binding 提供；`AMAP_KEY` 可选（只有 `/status/amap` 代理用它，缺失时那个端点自己 500，其余路由不受影响）。本地 `.dev.vars`，生产 `wrangler secret put`。
- **API 全部挂在 `/api/*`**：根 app 显式注册 `/api`、`/api/`，其余用 `app.route("/api", api)`。`wrangler.jsonc` 的 `run_worker_first: ["/api", "/api/*"]` 保证这些路径交给 Worker 而非静态资产。
- **Auth 两个中间件**（`src/plugin/auth.ts`）：`requireAuthKey` 校验 `?auth=AUTH_KEY`（admin/r2/status 写接口）；`requireJwt` 校验 `Authorization`（裸 token 或 `Bearer ` 前缀均兼容，公开 ask-box POST 用）。JWT 由 `hono/jwt` HS256 签发，`exp = now/1000 + 7200`。
- **`/turnstile` 成功返回 `c.text(jwt)`（纯文本），失败 `c.json(null)`**——前端用 `.text()` 读取，勿改成 `c.json`。
- **R2 用 aws4fetch（S3 API），无 R2 binding**：`utils.ts` 的 `presignR2Put` 用 `signQuery` 预签名 PUT（`X-Amz-Expires=86400`），`router/r2.ts` 的 `listR2` 走 `ListObjectsV2` 并手写 XML 解析（无第三方 XML 库）。四变量：`ENDPOINT`/`ACCESS_KEY_ID`/`SECRET_ACCESS_KEY`/`BUCKET_NAME`。
- **状态页城市地图：出图在管理端浏览器，Worker 只做代理/签名/写配置**。`GET /status` 的 `cities` 读 KV `city:maps`（`src/city-map.ts` 的 `readCityMaps`，缺失/坏值回退默认杭州），`map` 指向 R2 静态对象 `img/site/map/<adcode>.svg`。`src/router/map.ts` 三个端点（都要 `requireAuthKey`）：`GET /status/amap` 转发高德并注入 `AMAP_KEY` + KV 缓存 30 天（`amap:*`，`?nocache=1` 只绕过读）、`GET /status/map/upload-url?adcode=` 签发 R2 直传地址（签名**含** `Content-Type`，PUT 必须原样带）、`PUT /status/cities` 写 KV 城市配置。出图本身在前端 `app/pages/admin/status.vue`（动态 `import('@kuriyona/amap-box')`，边界缓存走 IndexedDB）。**不要**把出图搬进 Worker 请求路径：一次出图 CPU 实测 ~0.9s、wall 21s，Free 上限 10ms / Paid 30s，分片切得动 wall、切不动 CPU —— 完整理由与备选方案见 `docs/status-map.md`。
- **Status 数据全在 Workers KV**（binding `STATUS_KV`，命名空间 `kuriyona-kv`，配在根 `wrangler.jsonc` 的 `kv_namespaces`）。四类键：`dynamic:*`（`POST /status` 写入的动态数据，value 为 JSON 字符串，无 TTL）、`cache:*`（上游天气/GitHub/Steam 缓存，value 为 `{ at, data }`，KV TTL = 新鲜期×2 —— 新鲜期 1800s/60s/60s，未到期前可作上游失败时的回退值）、`city:maps`（城市地图配置，管理端出图后写入）、`amap:*`（高德边界缓存，键为排序后的查询串，TTL 30 天）。`GET /status` 把前三类与动态数据合并后返回；`DELETE /status` 只清 `dynamic:*`。KV 的 `list` 是最终一致（最长约 60s 延迟）。

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

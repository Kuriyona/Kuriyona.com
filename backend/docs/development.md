# 本地开发

后端现在是跑在 **Cloudflare Workers + D1 + KV** 上的 Hono 应用，前端是 Nuxt 静态站点。`wrangler dev` 会在本地模拟 Worker + D1 + KV（本地状态存在根目录 `.wrangler/state`，D1 在 `v3/d1`、KV 在 `v3/kv`）。

## 1. 环境准备

需要 [Node](https://nodejs.org) ≥ 24 与 pnpm（wrangler 4 要求 Node ≥ 22，portless 要求 Node ≥ 24）。

```bash
pnpm install                    # 根目录（Nuxt 前端 + wrangler）
pnpm api:install                # backend/ 子包依赖
pnpm add -g portless            # 本地 HTTPS 域名映射，见 §5；首次需 `portless trust`
```

## 2. 环境变量

后端从 `c.env` 读取环境变量。本地开发由根目录 `.dev.vars` 提供：

```bash
cp backend/.env .dev.vars
# 删除 .dev.vars 里的 DATABASE_URL 与 PORT 行（Workers 不需要）
```

必需键（缺任一项 API 请求返回 500）：`JWT_SECRET`、`AUTH_KEY`、`TURNSTILE_SECRET_KEY`、`ENDPOINT`、`ACCESS_KEY_ID`、`SECRET_ACCESS_KEY`、`BUCKET_NAME`。可选：`TURNSTILE_DEV_SECRET_KEY`（本地覆盖 Turnstile 密钥，生产不要设置）、`WEATHER_API_KEY`、`AMAP_KEY`（出图边界 + 常住城市天气中心点）、`CF_API_TOKEN`（管理端清缓存 `/api/cache/*`，需要 `Zone:Read` + `Cache Purge` 权限，见 `docs/cache-purge.md`）。

键名清单见根目录 `.dev.vars.example`。

## 3. 本地 D1 建表与 KV

D1 是本地 SQLite，schema 由 `backend/drizzle/` 下的 drizzle 迁移文件（提交到 Git）定义：

```bash
pnpm api:d1:migrate:local       # wrangler d1 migrations apply kuriyona-db --local
```

本地数据库文件与状态在根目录 `.wrangler/state`，**两台设备各自独立**；schema 仍靠 git 里的迁移文件同步（取代原先 MySQL 的多设备建库章节）。

**KV**（`/api/city` 的实时天气与上游缓存）**不需要建表**：命名空间与 id 已写在根 `wrangler.jsonc` 的 `kv_namespaces`（binding `STATUS_KV`，命名空间 `kuriyona-kv`）。`wrangler dev` 会自动按该绑定额模拟 KV，数据落在 `.wrangler/state/v3/kv`。

只在**新建**命名空间时才需要：

```bash
pnpm exec wrangler kv namespace create kuriyona-kv   # 输出 id 填回 wrangler.jsonc 的 kv_namespaces[0].id
```

## 4. 运行

```bash
# API + 静态站点（单 Worker）。要求根目录 dist/ 存在，否则先 `pnpm generate`
pnpm api:dev                    # portless → https://kuriyona-api.localhost（wrangler dev --port 62802）
pnpm api:run                    # 不经 portless → http://localhost:62802
```

- API 全部挂在 `/api/*`，例如 `http://localhost:62802/api`、`http://localhost:62802/api/city`；经 portless 时同一路径在 `https://kuriyona-api.localhost/api`。
- 同 Worker 也会从 `./dist` 提供 Nuxt 静态产物。

前端 dev（另开终端）：

```bash
pnpm generate && pnpm index && pnpm dev
```

`pnpm dev` 的 DEV API host 为 `https://kuriyona-api.localhost/api`，因此 `api:dev` 必须经 portless 跑（前端与 API 是两个来源，跨域由 Worker 的 `cors({ origin: '*' })` 兜住）。

## 5. portless

`pnpm dev` / `pnpm api:dev` 用 [portless](https://www.npmjs.com/package/portless) 把本地端口映射成 HTTPS 域名（`pnpm add -g portless`，需 Node ≥ 24）。首次使用需要信任本地 CA（需 sudo）：

```bash
portless trust
```

本地域名不用命令行参数拼，全部来自仓库内的配置文件：

| 项          | 位置                                                                         | 值             |
| ----------- | ---------------------------------------------------------------------------- | -------------- |
| 前端 app 名 | 根 `package.json` 的 `"portless"` 键                                         | `kuriyona`     |
| API app 名  | 根 `package.json` 的 `api:dev` 脚本里的 `--name`                             | `kuriyona-api` |
| 代理 TLD    | 根 `package.json` 的 `dev` / `api:dev` 脚本内联的 `PORTLESS_TLD`（两处成对） | `localhost`    |

即 `https://<app 名>.localhost`，域名自动解析到 `127.0.0.1`，无需改 hosts。`PORTLESS_TLD` 不能放 `.env`（`pnpm run` 的脚本执行不加载 `.env`，portless 读不到），所以内联在脚本首部。

代理默认在 443 起 HTTPS（需要 sudo）。只能跑非特权端口时：

```bash
portless proxy start --port 1355 --https   # URL 会变成 https://<name>.localhost:1355
```

**`api:dev` 里 `--app-port 62802` 与 `wrangler dev --port 62802` 成对**：Nuxt 会读 portless 注入的 `PORT`，但 wrangler 不读，必须显式写死并让 portless 指向同一端口。

## 6. 修改 schema 的流程

1. 修改 `backend/src/db/schema.ts`
2. `pnpm api:orm-generate`（= `drizzle-kit generate`，在 `backend/drizzle/` 下产出新迁移目录）
3. `pnpm api:d1:migrate:local` 应用到本地 D1
4. 提交生成的 `backend/drizzle/` 目录；部署时执行 `pnpm api:d1:migrate:remote`

不要在未生成迁移的情况下直接改表结构。

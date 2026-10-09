# 本地开发

后端现在是跑在 **Cloudflare Workers + D1** 上的 Hono 应用，前端是 Nuxt 静态站点。`wrangler dev` 会在本地模拟 Worker + D1（本地 D1 状态存在根目录 `.wrangler/state`）。

## 1. 环境准备

需要 [Node](https://nodejs.org) ≥ 22 与 pnpm（wrangler 4 要求 Node ≥ 22）。

```bash
pnpm install                    # 根目录（Nuxt 前端 + wrangler）
pnpm api:install                # backend/ 子包依赖
```

## 2. 环境变量

后端从 `c.env` 读取环境变量。本地开发由根目录 `.dev.vars` 提供：

```bash
cp backend/.env .dev.vars
# 删除 .dev.vars 里的 DATABASE_URL 与 PORT 行（Workers 不需要）
```

必需键（缺任一项 API 请求返回 500）：`JWT_SECRET`、`AUTH_KEY`、`TURNSTILE_SECRET_KEY`、`ENDPOINT`、`ACCESS_KEY_ID`、`SECRET_ACCESS_KEY`、`BUCKET_NAME`。可选：`TURNSTILE_DEV_SECRET_KEY`（本地覆盖 Turnstile 密钥，生产不要设置）、`WEATHER_API_KEY`、`GITHUB_API_TOKEN`、`STEAM_API_KEY`。

键名清单见根目录 `.dev.vars.example`。

## 3. 本地 D1 建表

D1 是本地 SQLite，schema 由 `backend/drizzle/` 下的 drizzle 迁移文件（提交到 Git）定义：

```bash
pnpm api:d1:migrate:local       # wrangler d1 migrations apply kuriyona-db --local
```

本地数据库文件与状态在根目录 `.wrangler/state`，**两台设备各自独立**；schema 仍靠 git 里的迁移文件同步（取代原先 MySQL 的多设备建库章节）。

## 4. 运行

```bash
# API + 静态站点（单 Worker）。要求根目录 dist/ 存在，否则先 `pnpm generate`
pnpm api:dev                    # wrangler dev --port 62802
```

- API 全部挂在 `/api/*`，例如 `http://localhost:62802/api`、`http://localhost:62802/api/status`。
- 同 Worker 也会从 `./dist` 提供 Nuxt 静态产物。

前端 dev（另开终端）：

```bash
pnpm generate && pnpm index && pnpm dev
```

`pnpm dev` 的 DEV API host 为 `https://api-kuriyona-com.localhost/api`（仓库外的 TLS 代理转发到 `127.0.0.1:62802`），因此需要该代理在跑。

## 5. 修改 schema 的流程

1. 修改 `backend/src/db/schema.ts`
2. `pnpm api:orm-generate`（= `drizzle-kit generate`，在 `backend/drizzle/` 下产出新迁移目录）
3. `pnpm api:d1:migrate:local` 应用到本地 D1
4. 提交生成的 `backend/drizzle/` 目录；部署时执行 `pnpm api:d1:migrate:remote`

不要在未生成迁移的情况下直接改表结构。

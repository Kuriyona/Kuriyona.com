# kuriyona-web（后端）

Kuriyona 个人站点的 API 服务。基于 [Cloudflare Workers](https://workers.cloudflare.com) + [Hono](https://hono.dev) + [Drizzle ORM](https://orm.drizzle.team) + [D1](https://developers.cloudflare.com/d1/)。本目录是 [Kuriyona.com](https://github.com/Kuriyona/Kuriyona.com) 根仓库的**独立子包**（自带 `pnpm-lock.yaml`，非根 workspace 成员），入口 `index.ts` 导出 Hono app，由根目录 `wrangler.jsonc` 部署为单 Worker（同时托管前端静态产物与 `/api/*`）。

## 功能

- **Ask Box** — 匿名提问箱，支持公开/隐藏、回答、管理端审核（id 为 UUID）
- **R2 文件** — Cloudflare R2 对象存储的列表与预签名上传（aws4fetch，S3 API）
- **Status 状态页** — 天气、GitHub 活动、Steam 在线状态与动态数据（D1 `status_data` 表）
- **Turnstile** — Cloudflare Turnstile 人机验证，签发 JWT

## 技术栈

| 层       | 技术                                                  |
| -------- | ----------------------------------------------------- |
| 运行时   | Cloudflare Workers                                    |
| Web 框架 | Hono                                                  |
| 数据库   | D1（`drizzle-orm/d1` + `drizzle-orm/sqlite-core`）    |
| 迁移     | Drizzle Kit 生成，`wrangler d1 migrations apply` 应用 |
| R2       | aws4fetch（S3 API 预签名，无 binding）                |

## 目录结构

```
├── index.ts                # Worker 入口（Hono app，导出 default）
├── src/
│   ├── env.ts              # Env 接口 + REQUIRED_ENV
│   ├── db/schema.ts        # D1 表结构（sqlite-core）
│   ├── plugin/auth.ts      # 鉴权中间件（AUTH_KEY query / JWT）
│   ├── router/             # 路由：ask-box / r2 / status
│   └── utils.ts            # D1、R2 预签名、Turnstile 等工具
├── drizzle/                # 迁移文件（提交到 Git，wrangler 消费）
└── docs/                   # 文档
```

## 快速开始

见 [docs/development.md](./docs/development.md)。要点：

```bash
cp backend/.env .dev.vars       # 在仓库根（去掉 DATABASE_URL / PORT）
pnpm api:d1:migrate:local       # 本地 D1 建表
pnpm api:dev                    # wrangler dev --port 62802（在仓库根执行）
```

接口在 `http://localhost:62802/api`。

## 环境变量

从 `c.env` 读取，缺任一必需项则每个请求返回 500（`[config] 缺少必需的环境变量: <KEY>`）。必需 7 项：`JWT_SECRET`、`AUTH_KEY`、`TURNSTILE_SECRET_KEY`、`ENDPOINT`、`ACCESS_KEY_ID`、`SECRET_ACCESS_KEY`、`BUCKET_NAME`。完整说明见 [docs/deployment.md](./docs/deployment.md)。

## 常用命令

在**仓库根目录**执行：

```bash
pnpm api:install              # 安装本子包依赖
pnpm api:dev                  # wrangler dev --port 62802
pnpm api:orm-generate         # 改 schema 后生成迁移
pnpm api:d1:migrate:local     # 本地 D1 应用迁移
pnpm api:d1:migrate:remote    # 远程 D1 应用迁移
pnpm run deploy               # 构建前端 + wrangler deploy
```

## 文档

- [本地开发](./docs/development.md)
- [生产部署](./docs/deployment.md)

## 许可证

本仓库未指定许可证。

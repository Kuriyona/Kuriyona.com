# api.kuriyona.com

Kuriyona 的个人 API 服务。基于 [Bun](https://bun.sh) + [Elysia](https://elysiajs.com) + [Drizzle ORM](https://orm.drizzle.team) + MySQL。

## 功能

- **Ask Box** — 匿名提问箱，支持公开/隐藏、回答、管理端审核
- **R2 文件** — Cloudflare R2 对象存储的列表与预签名上传
- **Status 状态页** — 天气、GitHub 活动、Steam 在线状态与动态数据
- **Turnstile** — Cloudflare Turnstile 人机验证，签发 JWT

## 技术栈

| 层 | 技术 |
|---|---|
| 运行时 | Bun |
| Web 框架 | Elysia |
| 数据库 | MySQL（`mysql2` + `drizzle-orm/mysql2`） |
| 迁移 | Drizzle Kit（启动时自动执行 `migrate()`） |
| 部署 | Docker 多阶段构建（`oven/bun`） |

## 目录结构

```
├── src/
│   ├── db/schema.ts        # 数据库表结构
│   ├── plugin/auth.ts      # 鉴权插件（AUTH_KEY / JWT）
│   ├── router/             # 路由：ask-box / r2 / status
│   └── utils.ts            # 数据库、R2、Turnstile 等工具
├── drizzle/                # 迁移文件（提交到 Git）
├── scripts/image.sh        # 镜像构建/导出/加载脚本
├── docs/                   # 文档
├── Dockerfile              # 多阶段构建
└── .env.example            # 环境变量模板
```

## 快速开始

```bash
pnpm install
cp .env.example .env        # 填写 DATABASE_URL 等变量
bun run dev                 # 开发模式（热重载，启动时自动建表）
```

接口在 `http://localhost:62802`。

> 多设备本地开发（Windows WSL2 / MacBook 各自独立数据库）见 [docs/development.md](./docs/development.md)。

> 本地开发需先启动 MySQL 实例，连接串见 `.env.example`（`mysql://...:3306/...`）。

## 环境变量

必需 8 项：`DATABASE_URL`、`JWT_SECRET`、`AUTH_KEY`、`ENDPOINT`、`ACCESS_KEY_ID`、`SECRET_ACCESS_KEY`、`BUCKET_NAME`、`TURNSTILE_SECRET_KEY`。完整说明见 [docs/deployment.md](./docs/deployment.md)。

## 常用命令

```bash
bun run dev             # 开发
bun run build           # 构建 dist（含迁移文件）
bun run orm-generate    # 改 schema 后生成迁移
bun run image:all       # 构建并导出镜像到 ./output
```

## 文档

- [多设备本地开发](./docs/development.md)
- [生产环境 Docker 部署](./docs/deployment.md)
- [镜像脚本使用指南](./docs/image.md)

## 许可证

本仓库未指定许可证。
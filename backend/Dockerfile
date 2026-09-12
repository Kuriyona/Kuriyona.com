# syntax=docker/dockerfile:1

# ── Stage 1: 构建 ──
FROM oven/bun:1.4.2 AS builder
WORKDIR /app

# 先拷贝依赖清单，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml ./
RUN bun install --frozen-lockfile

# 拷贝源码与迁移文件
COPY index.ts drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle

# 产出 dist/backend.js + dist/drizzle/
RUN bun run build

# ── Stage 2: 运行 ──
FROM oven/bun:1.4.2-slim AS runner
WORKDIR /app

# 仅拷贝构建产物与迁移文件
COPY --from=builder /app/dist ./dist

# 非 root 用户运行
USER bun

ENV PORT=62802
EXPOSE 62802

CMD ["bun", "dist/backend.js"]
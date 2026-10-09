# 生产部署（Cloudflare Workers + D1）

单 Worker `kuriyona-web` 同时提供 Nuxt 静态站点（`assets.directory = ./dist`）与 API（`/api/*`，`run_worker_first`）。数据库为 D1，R2 通过 S3 API（aws4fetch）访问，不使用 R2 binding。

## 0. 前置

- Cloudflare 账号。认证二选一（`wrangler` 在仓库根目录运行）：
  - `wrangler login`（OAuth，权限足够）；
  - 或在使用环境变量 `CLOUDFLARE_API_TOKEN` 时，确保该 Token 具备 **Workers Scripts:Edit** 与 **D1:Edit** 权限。
- ⚠️ 仓库根 `.env` 若包含 `CLOUDFLARE_API_TOKEN`，wrangler 会自动加载它，**会覆盖 OAuth 登录**。若该 Token 权限不足，`pnpm deploy` 会报 `Authentication error [code: 10000]` / `No access to the specified resource`。此时要么给该 Token 补齐权限，要么从根 `.env` 移除该行（改用 OAuth 登录）。
- 本机 Node ≥ 22、已 `pnpm install`。

> 开发机的 `~/.wrangler/config/default.toml` 保存 OAuth 凭证；仅当工作目录不在仓库根（避免加载根 `.env` 的 Token）时才走 OAuth。本次部署即从 `backend/` 目录用 `wrangler -c ../wrangler.jsonc …` 完成。

## 1. 创建 D1 数据库

```bash
pnpm exec wrangler d1 create kuriyona-db
```

把输出的 `database_id` 填入仓库根 `wrangler.jsonc` 的 `d1_databases[0].database_id`（替换占位值 `00000000-0000-0000-0000-000000000000`）。

## 2. 写入生产密钥

生产环境变量用 `wrangler secret put` 写入（值取自 `backend/.env`，**不要**提交任何密钥）：

```bash
for K in JWT_SECRET AUTH_KEY TURNSTILE_SECRET_KEY ENDPOINT ACCESS_KEY_ID SECRET_ACCESS_KEY BUCKET_NAME WEATHER_API_KEY GITHUB_API_TOKEN STEAM_API_KEY; do
  printf '%s' "$(grep -m1 "^$K=" backend/.env | cut -d= -f2-)" | pnpm exec wrangler secret put "$K"
done
```

必需 7 项：`JWT_SECRET`、`AUTH_KEY`、`TURNSTILE_SECRET_KEY`、`ENDPOINT`、`ACCESS_KEY_ID`、`SECRET_ACCESS_KEY`、`BUCKET_NAME`。**不要设置 `TURNSTILE_DEV_SECRET_KEY`**（那是本地测试用）。

## 3. 应用迁移

```bash
pnpm exec wrangler d1 migrations apply kuriyona-db --remote
```

## 4. 部署

```bash
pnpm run deploy                 # = pnpm build（generate + pagefind index）+ wrangler deploy
```

验证：

```bash
curl -s https://kuriyona-web.<sub>.workers.dev/api          # This API site of Kuriyona.com
curl -s https://kuriyona-web.<sub>.workers.dev/api/ask-box   # []
curl -s -o /dev/null -w '%{http_code}\n' https://kuriyona-web.<sub>.workers.dev/          # 200
curl -s -o /dev/null -w '%{http_code}\n' https://kuriyona-web.<sub>.workers.dev/pagefind/pagefind.js  # 200
```

## 5. 自定义域（本次未执行）

当前 `kuriyona.com` 仍指向 Cloudflare Pages，未绑定到 Worker。切换步骤：

1. 在 Cloudflare Pages 项目里移除 `kuriyona.com` 自定义域。
2. 打开 `wrangler.jsonc` 中的 `routes` 注释：
   ```jsonc
   "routes": [{ "pattern": "kuriyona.com", "custom_domain": true }]
   ```
3. `pnpm run deploy`。若报 DNS 记录冲突，先在 DNS 面板删除/调整旧记录。

回滚：移除 `wrangler.jsonc` 的 `routes` 后重新 deploy，并在 Pages 项目重新加回 `kuriyona.com` 自定义域。

## 附：旧数据

本次未迁移旧的 MySQL 数据（D1 从空库开始），旧数据仍留在原服务器的 MySQL 中。

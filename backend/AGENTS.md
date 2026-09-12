# AGENTS.md

Bun + Elysia + Drizzle personal API service. Entrypoint: `index.ts` (top-level `await migrate(...)` then starts Elysia on `PORT`/62802). 本目录已并入 [Kuriyona.com](https://github.com/Kuriyona/Kuriyona.com) 根仓库（原先独立仓库 `api.kuriyona.com`），作为**独立子包**保留自己的 `pnpm-lock.yaml`，不是根 pnpm workspace 成员。

## Commands

> 可在仓库根目录用 `pnpm api:install` / `pnpm api:dev` / `pnpm api:build` / `pnpm api:orm-generate` / `pnpm api:orm-migrate` / `pnpm api:image:all` 转发到本目录，等价于在此目录直接执行下述命令。

- Install deps: `pnpm install` (包管理用 pnpm，读 `pnpm-lock.yaml`；运行时/构建脚本全部是 Bun：`bun run dev` / `bun run build` / `bun index.ts`，不要用 npm).
- Run: `bun run dev` (watch) / `bun index.ts`. Needs a valid `.env` first — see below.
- Build: `bun run build` → `dist/backend.js` + `dist/drizzle/`. **This is the de-facto type/sanity check**; there is no `tsc`, no test, no lint script.
- Migrations: edit `src/db/schema.ts`, then `bun run orm-generate`; apply via `pnpm exec drizzle-kit migrate` (or just start the server — it auto-migrates on boot).
- Docker image: `./scripts/image.sh {build|save|load|all|clean}`. No docker-group access on dev box → `DOCKER="sudo docker" ./scripts/image.sh save`.

## Non-obvious architecture

- **DB is MySQL via `mysql2`.** `drizzle(process.env.DATABASE_URL!)` from `drizzle-orm/mysql2`; schema uses `drizzle-orm/mysql-core`. `DATABASE_URL` uses the `mysql://` scheme (default port 3306).
- **Migrations read `.sql` files from disk at runtime** (`readdirSync`/`readFileSync`), not from the bundle. `index.ts` uses `import.meta.dir + "/drizzle"`, so the folder must sit next to the entrypoint: repo root `/drizzle` in dev, `dist/drizzle` in Docker. Never bundle migrations as strings.
- **Env is validated at startup** (`src/utils.ts` `REQUIRED_ENV`): missing any of 8 vars → `process.exit(1)`. Copy `.env.example` → `.env` before running. `.env`/`.env.production` are gitignored.
- **Auth has two separate plugins** in `src/plugin/auth.ts`: `validateAuth` checks `?auth=AUTH_KEY` query param (admin routes); `validateJWT` checks `Authorization: Bearer` JWT (public routes). Public ask-box POST uses JWT; admin/ask-box and r2/status use query auth.

## Schema conventions

- Snake_case column names passed explicitly: `mysqlTable("ask_table", { showName: int("show_name"), ... })`.
- Timestamps are `bigint(..., { mode: "number" })` storing epoch **ms**.
- `public` is a column name (int 0/1); don't rename.

## Migration / cleanup state

Migration history was deliberately reset when moving from SQLite to MySQL：旧 SQLite 迁移（`20260816122705_clear_kid_colt`、`20260816123748_sweet_earthquake`）已删除，当前仅保留一条 MySQL 迁移 `20260912131401_lyrical_scalphunter`。`src/router/neko.ts`（AI 聊天）已移除。不要「恢复」这些已删除的文件。

## Style

- Code comments and docs are in Chinese; match that when adding docs.
- Formatter `oxfmt` is in devDeps but has no script/config; don't rely on it being run.
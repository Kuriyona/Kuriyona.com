# Kuriyona.com

Personal website — **Nuxt 4** (SSR) + **Elysia** (Bun backend).

## Stack

| Layer           | Choice                                                      |
| --------------- | ----------------------------------------------------------- |
| Runtime         | **Bun** (not Node.js)                                       |
| Package manager | **pnpm**                                                    |
| Frontend        | Nuxt 4 + Vue 3 + Tailwind CSS v4                            |
| UI library      | Varlet UI (`<var-input>`, `<var-card>`, etc.)               |
| Animations      | GSAP                                                        |
| I18n            | `@nuxtjs/i18n` (`prefix_and_default` strategy, 4 locales)   |
| Backend         | Elysia on Bun, port 62802                                   |
| Storage         | Cloudflare R2 via `bun`'s built-in `S3Client` (not AWS SDK) |
| Formatter       | `oxfmt` (not Prettier)                                      |

## Commands

```
pnpm dev          Nuxt dev server (hot reload)
pnpm build        Nuxt production build
pnpm generate     Nuxt static generation
pnpm preview      Nuxt preview build output
pnpm fmt          Format with oxfmt
pnpm server       Run Elysia backend (Bun)
pnpm server-dev   Run Elysia backend with hot reload
pnpm server-dist  Bundle Elysia backend to server-dist/server.js
```

`postinstall` auto-runs `nuxt prepare`. No lint, typecheck, or test commands.

## Architecture

- `app/` — Nuxt app (pages, components, stores, utils, assets)
- `app/pages/admin/` — **3** protected pages: `/admin` (API key input), `/admin/r2` (R2 upload), `/admin/neko` (system prompt editor). All require `API_KEY` in `localStorage`.
- `server/` — Standalone Elysia API server (`server/index.ts`). Routes: R2 signed URLs (`/r2/*`), weather proxy (`/weather/`), neko chat SSE (`/neko/chat/stream`), push notification (`/push`), Turnstile verify (`/turnstile`).
- `i18n/locales/` — 4 locale files: `zh.json` (default), `zh-Hant.json`, `en.json`, `ja.json`
- `app/config.json` — Friend links (the only "content" source; `@nuxt/content` is unused beyond blog MD)
- `app/content/` — Blog markdown files (collected by `content.config.ts`)

## Key Conventions

- **Path aliases**: `@/` and `~/` both work, used interchangeably.
- **I18n**: `app/scripts/i18n.ts` re-exports `{ useI18n }` from `vue-i18n`. Templates can also use `$t()`.
- **API client**: `app/utils/api.ts` exports a `ky`-based `fetchApi` that auto-injects `auth` param from `localStorage.API_KEY`. Use this for new code.
- **Admin auth**: Pages read `API_KEY` from `localStorage` via `useStorage('API_KEY', '')`. Passed as `?auth=` on every admin request.
- **Styling**: Tailwind CSS v4 via `@import 'tailwindcss'` in `main.css`. No `tailwind.config.*`.
- **Varlet UI**: Components use `var-*` prefix in templates. Dark theme applied in plugin via `StyleProvider(Themes.md3Dark)`.
- **Env vars**: Loaded via `dotenv/config` in server. `.env` is gitignored. Required vars: `AUTH_KEY`, `JWT_SECRET`, `WEATHER_API_KEY`, `LLM_API_KEY`, `TURNSTILE_SECRET_KEY`, `PUSHPLUS_API_KEY`, `ENDPOINT`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `BUCKET_NAME`.
- **API host**: `import.meta.env.DEV` — `http://localhost:62802` (dev) vs `https://api.kuriyona.com` (prod).
- **Compile-time globals**: `GIT_HASH` and `BUILD_TIME` are `define`'d in `nuxt.config.ts` (declared in `vite-env.d.ts`).
- **Neko chat**: SSE endpoint (`/neko/chat/stream`) proxies to SiliconFlow API (`Qwen/Qwen3-8B`). Requires JWT obtained via `/turnstile` (Cloudflare Turnstile verification). Rate-limited to 1 request per 2 seconds.
- **Weather**: Cached for 30 min. Location hardcoded to `101210107`.
- **Formatting**: `pnpm fmt` (oxfmt) only — no linter or typecheck.
- **No tests or CI**.

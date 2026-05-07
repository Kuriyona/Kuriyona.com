# Kuriyona.com

Personal website built with **Nuxt 4** (SSR) + **Elysia** (Bun backend).

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | **Bun** (not Node.js) |
| Package manager | **pnpm** |
| Frontend | Nuxt 4 + Vue 3 + Tailwind CSS v4 |
| UI library | Varlet UI (`<var-input>`, `<VarCard>`, etc.) |
| Animations | GSAP |
| I18n | `@nuxtjs/i18n` (no_prefix strategy, zh/en) |
| Backend | Elysia on Bun, port 62802 |
| Storage | Cloudflare R2 (S3-compatible) via AWS SDK |
| Formatter | `oxfmt` (not Prettier) |

## Commands

```bash
pnpm dev          # Nuxt dev server (hot reload)
pnpm build        # Nuxt production build
pnpm generate     # Nuxt static generation
pnpm preview      # Nuxt preview build output
pnpm fmt          # Format with oxfmt
pnpm server       # Run Elysia backend (Bun)
pnpm server-dev   # Run Elysia backend with hot reload
pnpm server-dist  # Bundle Elysia backend to server-dist/server.js
```

`postinstall` automatically runs `nuxt prepare`.

No lint, typecheck, or test commands exist.

## Architecture

- `app/` — Nuxt app directory (pages, components, stores, utils, assets)
- `app/pages/admin/` — Protected admin pages (`/admin`, `/admin/image`), require API key in `localStorage`
- `server/` — Standalone Elysia API server (`server/index.ts`), handles image upload (R2 signed URLs) and weather proxy
- `i18n/locales/` — Translation JSON files (en.json, zh.json)
- `app/config.json` — Contact info and friend links (the "content" source)

## Key Conventions

- **Path aliases**: Both `@/` and `~/` work (standard Nuxt). Used interchangeably.
- **I18n imports**: Most files use `useI18n` from `@/scripts/i18n` (a re-export of `vue-i18n`). Templates can also use `$t()`. Some stores import `vue-i18n` directly — either works.
- **API client**: `app/utils/api.ts` exports a `ky`-based `fetchApi`. The Pinia store in `app/stores/main.ts` has its own `fetchApi` using raw `fetch` — use the `ky` one for new code unless inside the store.
- **Styling**: Tailwind CSS v4 (`@import 'tailwindcss'` in `main.css`). No `tailwind.config.*`.
- **Varlet UI**: Components use `var-*` prefix (kebab-case in templates, e.g. `<var-input>`, `<var-button>`). Dark theme applied in plugin via `StyleProvider(Themes.md3Dark)`.
- **Env vars**: Loaded via `dotenv/config` in the server. `.env` is gitignored — no `.env.example` in repo.
- **API host**: Auto-switches based on `import.meta.env.DEV`: `http://localhost:62802` (dev) vs `https://api.kuriyona.com` (prod).
- **Formatting**: Only `pnpm fmt` (oxfmt) — no linter or typecheck.
- **No tests or CI** configured.

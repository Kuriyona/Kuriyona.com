# Kuriyona.com — agent guide

## Quick start

```bash
pnpm install        # install deps + runs `nuxt prepare`
pnpm dev            # nuxt dev — SPA frontend on localhost:3000
pnpm fmt            # oxfmt (not prettier)
```

Server runs separately on port **62802**:

```bash
bun run server/index.ts
```

## Architecture

- **Monorepo, single package.** Two runtimes coexist:
  - `app/` — Nuxt 4 SPA (`ssr: false`), Vue 3, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Varlet UI (MD3 Dark), custom i18n
  - `server/` — Elysia (Bun) API server, S3-backed image upload, status endpoint
- API host auto-switches via `import.meta.env.DEV`: `localhost:62802` dev → `https://api.kuriyona.com` prod
- `app/config.json` — single source of truth for contacts, friend links
- `app/utils/api.ts` — preconfigured `ky` client; components import `fetchApi` from there
- `app/scripts/i18n.ts` — custom i18n (not vue-i18n); each call receives `[en, zh]` tuple

## Key conventions

- **i18n:** `const { t } = useI18n();` then `t(['English text', '中文文本'])`. The `locale` ref toggles index 0/1.
- **Styling:** Tailwind CSS v4 utility classes. `@apply` in CSS files. Fonts: LXGW WenKai (zeoseven CDN).
- **State:** Pinia stores in `app/stores/`. `@vueuse/core` utilities used throughout.
- **Env (server):** `.env` — `ENDPOINT`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `BUCKET_NAME`, `AUTH_KEY`
- **No SSR, no tests, no linter.** Only formatter (`oxfmt`).
- **Package manager:** pnpm only. Lockfile: `pnpm-lock.yaml`.

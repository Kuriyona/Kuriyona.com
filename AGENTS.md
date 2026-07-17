# Kuriyona.com

Personal website — **Nuxt 4** (SSR) + Vue 3 + Tailwind CSS v4.

## Stack

| Layer           | Choice                                           |
| --------------- | ------------------------------------------------ |
| Runtime         | **Bun** (not Node)                               |
| Package manager | **pnpm** (v11.4.0)                               |
| Frontend        | Nuxt 4 + Vue 3 + Tailwind CSS v4                 |
| UI library      | Varlet UI (`<var-input>`, `<var-card>`, etc.)    |
| Animation       | GSAP                                             |
| I18n            | `@nuxtjs/i18n` (`prefix_and_default`, 4 locales) |
| Formatter       | `oxfmt` (not Prettier)                           |

**Backend is NOT in this repo.** See [Kuriyona/api.kuriyona.com](https://github.com/Kuriyona/api.kuriyona.com) (Elysia on Bun).

## Commands

```
pnpm dev             Nuxt dev server (hot reload)
pnpm generate        Nuxt static generation
pnpm index           PageFind search indexing (requires `generate` first)
pnpm preview         Nuxt preview build output
pnpm build           submodule init + pnpm generate + pnpm index
pnpm fmt             Format with oxfmt
```

`postinstall` auto-runs `nuxt prepare`. No lint, typecheck, or test commands.

## Search (PageFind)

Full-text search powered by [PageFind](https://pagefind.app/) (Component UI). Search triggers via `Ctrl+K` or the search button in the AppBar.

### Workflow

- **Dev mode**: `pnpm generate && pnpm index && pnpm dev`
  The Vite dev server serves `/pagefind/*` from `.output/public/pagefind/` via a custom plugin (`pagefind-dev` in `nuxt.config.ts`).
  Changes to `--pf-*` CSS variables in `main.css` are hot-reloaded.
- **Production**: `pnpm build` automatically runs `generate` + `index` in sequence.

### Style customization

PageFind uses Shadow DOM. Theme via `--pf-*` CSS variables on `:root` (defined in `main.css`). Key variables:

```
--pf-background / --pf-text / --pf-text-secondary / --pf-border
--pf-border-focus / --pf-hover / --pf-mark / --pf-skeleton
--pf-modal-backdrop / --pf-modal-max-width / --pf-input-height
--pf-border-radius / --pf-font
```

For deeper customization (result layout, etc.), see [PageFind Component UI custom templates](https://pagefind.app/docs/ui/#custom-templates).

### How it works

1. `nuxt generate` builds static HTML to `.output/public/`
2. `pagefind --site .output/public` crawls the output, builds language-separated search indexes, and outputs to `.output/public/pagefind/`
3. `app/plugins/pagefind.client.ts` registers the Component UI web components (client-side only)
4. `app/components/AppBar.vue` contains `<pagefind-modal-trigger>` + `<pagefind-modal>`
5. Blog articles have `data-pagefind-body` so PageFind indexes only content (not nav, footer)
6. Language switching re-initializes PageFind via `new Function('return import("/pagefind/pagefind.js")')()` (bypasses Vite bundler resolution)

### Index scope

Only pages with `data-pagefind-body` are indexed. Currently applied to:
- Blog article content (`app/pages/blog/[slug].vue`)

Add `data-pagefind-body` to `<AppPage>` or individual pages to include them in search results.

## Architecture

- `app/` — Nuxt app (pages, components, stores, utils, assets)
- `server/` — Nitro API routes (`/api/articles`, `/api/articles/[slug]`). Reads markdown from `app/content/blog/` via `gray-matter` + custom `markdown-exit` renderer (not `@nuxt/content`).
- `scripts/` — Standalone Bun scripts: OG image generation (`generate-blog-og.ts`) and upload (`upload-blog-og.ts`). Import from `server/utils.ts`.
- `Kuriyona/` — Git submodule (`config.json`, intros, assets). Imported by `app/app.config.ts` and `app.config.ts` (friend links, profile data). Must be initialized via `git submodule update --init`.
- `i18n/locales/` — 4 files: `zh-Hans.json` (default), `zh-Hant.json`, `en.json`, `ja.json`.
- `app/pages/admin/` — 3 protected pages: `/admin`, `/admin/r2`, `/admin/neko`. Auth via `API_KEY` in `localStorage`, passed as `?auth=` param.

## Key Conventions

- **Path aliases**: `@/` and `~/` both work, used interchangeably.
- **I18n**: `app/scripts/i18n.ts` re-exports `useI18n` from `vue-i18n`. Templates also use `$t()` directly.
- **API client**: `app/utils/api.ts` exports a `ky`-based `fetchApi` that auto-injects `auth` from `localStorage.API_KEY`. Dev host: `http://api-kuriyona-com.localhost/` (not `localhost:62802`).
- **Admin auth**: `useStorage('API_KEY', '')`. Passed as `?auth=` on every admin request.
- **Styling**: Tailwind CSS v4 via `@import 'tailwindcss'` in `main.css`. No `tailwind.config.*`.
- **Varlet UI** (`var-*` prefix): Dark theme applied in plugin via `StyleProvider(Themes.md3Dark)`.
- **Env vars**: Loaded via `dotenv/config` in backend only. Required: `AUTH_KEY`, `JWT_SECRET`, `WEATHER_API_KEY`, `LLM_API_KEY`, `TURNSTILE_SECRET_KEY`, `PUSHPLUS_API_KEY`, `ENDPOINT`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `BUCKET_NAME`.
- **Compile-time globals**: `GIT_HASH` and `BUILD_TIME` `define`'d in `nuxt.config.ts` (declared in `vite-env.d.ts`).
- **Dayjs locale sync**: `app/utils/time.ts` exports `setLocale(locale)` — must be called when i18n locale changes (done in `app.vue` watcher). Provides `formatRelativeTime(time)` for relative timestamps.
- **No tests or CI**.

# Kuriyona.com

Personal website — **Nuxt 4** (SSR) + Vue 3 + Tailwind CSS v4.

## Stack

| Layer           | Choice                                              |
| --------------- | --------------------------------------------------- |
| Runtime         | **Bun** (not Node)                                  |
| Package manager | **pnpm** (v11.4.0)                                  |
| Frontend        | Nuxt 4 + Vue 3 + Tailwind CSS v4                    |
| UI components   | Custom `K*` components (Tailwind, no UI library)    |
| Animation       | GSAP                                                |
| I18n            | `@nuxtjs/i18n` (`prefix_except_default`, 4 locales) |
| Formatter       | `oxfmt` (not Prettier)                              |

**Backend is NOT in this repo.** See [Kuriyona/api.kuriyona.com](https://github.com/Kuriyona/api.kuriyona.com) (Elysia on Bun).

## Commands

```
pnpm dev             Nuxt dev server (hot reload)
pnpm generate        Nuxt static generation
pnpm index           PageFind search indexing (requires `generate` first)
pnpm preview         Nuxt preview build output
pnpm build           pnpm generate + pnpm index
pnpm fmt             Format with oxfmt
```

`postinstall` auto-runs `nuxt prepare`. No lint, typecheck, or test commands.

## Git Commit Convention

Conventional Commits (CC 规范)，描述使用中文。

```
<type>: <中文描述>

<可选：正文说明>
```

常用 type：

| Type       | 用途                        |
| ---------- | --------------------------- |
| `feat`     | 新功能 / 新组件             |
| `fix`      | 修复 bug                    |
| `refactor` | 重构（不改行为）            |
| `style`    | 样式 / 格式调整（不改逻辑） |
| `chore`    | 构建、依赖、配置等杂项      |
| `docs`     | 文档（含 AGENTS.md）        |
| `perf`     | 性能优化                    |

示例：`refactor: 移除 Varlet 组件替换为原生实现`、`feat: 新增 KInput 组件替换 var-input`。

### 提交前必须更新 AGENTS.md

**每次提交前**都必须检查并更新 `AGENTS.md`，确保其内容（项目结构、组件、路由、命令、约定等）与当前代码一致。若本次改动涉及新增/删除/修改文件、目录、组件、路由、配置或约定，应在提交前同步更新到 AGENTS.md 中。

## Search (PageFind)

Full-text search powered by [PageFind](https://pagefind.app/) (custom Vue components via JS API). Search triggers via `Ctrl+K` or the search button in the AppBar.

### Workflow

- **Dev mode**: `pnpm generate && pnpm index && pnpm dev`
  The Vite dev server serves `/pagefind/*` from `dist/pagefind/` via a custom plugin (`pagefind-dev` in `nuxt.config.ts`).
  Modify styles in `app/components/SearchModal.vue` (Tailwind classes / scoped CSS).
- **Production**: `pnpm build` automatically runs `generate` + `index` in sequence.

### How it works

1. `nuxt generate` builds static HTML to `dist/`
2. `pagefind --site dist` crawls the output, builds language-separated search indexes, and outputs to `dist/pagefind/`
3. `app/composables/useSearch.ts` — singleton composable managing search state (query, results, loading, activeIndex)
4. `app/utils/pagefind.ts` — wraps PageFind JS API with `new Function()` to bypass Vite bundler
5. `app/components/SearchModal.vue` — custom search UI (Teleport to body, no Shadow DOM)
6. `app/components/AppBar.vue` — search button trigger + global `Ctrl+K` listener
7. Blog articles have `data-pagefind-body` so PageFind indexes only content (not nav, footer)
8. Language switching calls `pagefindReinit()` to destroy & re-init the search index

### Customizing the search UI

Edit `app/components/SearchModal.vue`. The component has minimal built-in styles — add Tailwind classes or scoped CSS as needed. Key states:

| State   | Template condition                                          | Description                   |
| ------- | ----------------------------------------------------------- | ----------------------------- |
| Hidden  | `v-if="s.visible"`                                          | Modal teleported to body      |
| Loading | `v-if="s.loading"`                                          | Searching...                  |
| Error   | `v-else-if="s.error"`                                       | Error message                 |
| Empty   | `v-else-if="s.query.length >= 2 && s.results.length === 0"` | No results                    |
| Results | `v-else-if="s.results.length"`                              | Result list with keyboard nav |

Available via the composable: `s.query`, `s.results`, `s.loading`, `s.error`, `s.activeIndex`, `s.open()`, `s.close()`, `s.toggle()`, `s.clear()`.

### Index scope

Only pages with `data-pagefind-body` are indexed. Currently applied to:

- Blog article content (`app/pages/blog/[slug].vue`)
- `/` (首页：全屏欢迎首屏 + 关于内容，`app/pages/index.vue`)
- `/about/as-mtf` (`app/pages/about/as-mtf/index.vue`)
- `/about/devices` (`app/pages/about/devices/index.vue`)
- `/links` (`app/pages/links/index.vue`)

Add `data-pagefind-body` to `<AppPage>` or individual pages to include them in search results.

## Project Structure

```
Kuriyona.com/
├── app/                        Nuxt 应用（核心代码）
│   ├── app.vue                 根组件：背景、NuxtPage、AppBar、ToastHost；i18n locale watcher
│   ├── app.config.ts           defineAppConfig：导航（nav + aboutNav）+ 友链（main/others/links），合并 app/config.json
│   ├── config.json             个人信息配置（tech_stack/languages/info/contact/games…）
│   ├── assets/
│   │   └── css/                main.css（@import 汇总）· base.css（主题变量/滚动条/光标）· utilities.css（.link/.trans-text 等）
│   ├── components/             自动导入组件
│   │   ├── AppPage.vue         页面布局容器（居中、max-w、底部 AppFooter）
│   │   ├── AppBar.vue          顶部导航栏 + 搜索按钮 + Ctrl+K 全局监听
│   │   ├── AppBar/             AppMenu.vue（移动端抽屉：音乐/导航/语言/背景）+ BackgroundSelector.vue
│   │   ├── AppFooter.vue       版权 + GIT_HASH 链接 + Cloudflare 节点
│   │   ├── AppBackground.vue   全屏背景（视频/必应图片，useBackgroundStore）
│   │   ├── MusicBar.vue        音乐播放条（歌词滚动、播放控制）
│   │   ├── SearchModal.vue     PageFind 搜索弹窗（Teleport 到 body）
│   │   ├── ToastHost.vue       全局 toast 宿主（Teleport，配合 useToast）
│   │   ├── KTurnstile.vue      Cloudflare Turnstile 人机验证（换取 JWT）
│   │   ├── K*.vue              自研 UI 组件（见下表）
│   │   ├── card/               About/Status 页卡片：CardInfo/CardGithub/CardWeather/CardSteam/CardGames/CardContact
│   │   └── 
│   ├── composables/            自动导入组合式函数
│   │   ├── useSearch.ts        PageFind 搜索单例状态（查询/结果/键盘导航）
│   │   ├── useToast.ts         轻量 toast（模块级单例，success/error）
│   │   ├── useNav.ts           导航项（读取 app.config nav/aboutNav + i18n 标题）
│   │   ├── useCodeCopy.ts      博客代码块复制按钮 + toast 提示
│   │   ├── useHeadingAnchor.ts 博客标题锚点跳转
│   │   ├── useCloudflareStatus.ts  CF 节点状态 + /cdn-cgi/trace 定位
│   │   └── cfn.ts              cloudflarestatus API 类型定义
│   ├── pages/                   路由页面（Nuxt 文件路由）
│   │   ├── index.vue            首页（全屏欢迎首屏 + 关于内容、导航卡、技能、联系方式）
│   │   ├── about/as-mtf/        MtF 相关页面（pride 主题卡）
│   │   ├── blog/index.vue       博客列表（按语言过滤）
│   │   ├── blog/[slug].vue      博客详情（TOC、多语言切换、代码复制、搜索索引）
│   │   ├── links/index.vue      友链页（申请友链链接到 GitHub Issue 模板）
│   │   ├── timeline/index.vue   时间线页（倒序展示，条目可选 link 跳转按钮）
│   │   ├── ask-box/             提问箱（index 列表 / ask 提交表单，Turnstile 验证）
│   │   ├── status/index.vue     状态页（Steam/天气/GitHub 活动）
│   │   ├── neko/index.vue       Neko AI 聊天（SSE 流式，KMarkdown 渲染）
│   │   └── admin/               管理页（/admin API key、/admin/r2 上传、/admin/neko 提示词、/admin/ask-box 审核）
│   ├── stores/                  Pinia stores
│   │   ├── main.ts              JWT（Turnstile 验证后存储）
│   │   ├── music.ts             Neko 音乐播放（Howl + Meting API + 歌词）
│   │   └── background.ts        背景预设（视频/必应）
│   ├── utils/                   @/ 别名工具函数
│   │   ├── api.ts               ky 实例 fetchApi（自动注入 auth，开发环境用本地 host）
│   │   ├── time.ts              dayjs 封装：formatDate/formatTime/formatDuration/formatRelativeTime/setLocale
│   │   ├── i18n.ts              uniLocale（移除 -TW/-HK 后缀）
│   │   ├── emoji.ts             国家码 → 国旗 emoji
│   │   ├── console.ts           console 欢迎信息（greet.txt）
│   │   ├── pagefind.ts          PageFind JS API 封装（new Function 绕过打包器）
│   │   └── types/music.ts       网易云歌曲/歌词类型
│   ├── scripts/                 客户端共享脚本/类型
│   │   ├── i18n.ts              重导出 vue-i18n 的 useI18n
│   │   └── statusTypes.ts       /status 接口类型（Weather/GithubActivity/Steam）
│   ├── content/blog/            博客 Markdown 源文件（按语言分目录：zh-Hans/zh-Hant/en/ja）
│   └── data/devices.json        设备配置数据（/about/devices 页面读取）
├── server/                      Nitro API 路由
│   ├── utils.ts                 Markdown 渲染核心（markdown-exit + Shiki 高亮 + TOC + 外链图标 + 缓存/热重载）
│   └── api/articles.ts          GET /api/articles（不含 content）
│   └── api/articles/[slug].ts   GET /api/articles/:slug（按 slug 过滤，返回所有语言版本）
├── scripts/                     Bun 独立脚本（非打包进应用）
│   ├── generate-blog-og.ts      OG 图生成（yona-svg + sharp，输出到 temp/）
│   ├── upload-blog-og.ts        OG 图上传到 R2（Bun S3Client，需 ENDPOINT 等环境变量）
│   └── sort-i18n.ts             i18n JSON 按键名排序（pnpm fmt 时自动执行）
├── i18n/locales/                4 个语言文件：zh-Hans.json（默认）/ zh-Hant.json / en.json / ja.json
├── public/                      robots.txt（静态资源实际托管在 R2）
├── temp/                        OG 图生成中间产物（gitignored）
├── nuxt.config.ts               Nuxt 配置（模块、i18n、nitro 输出到 dist、pagefind-dev 插件、GIT_HASH/BUILD_TIME define）
├── package.json                 依赖与脚本（无 lint/typecheck/test）
├── pnpm-workspace.yaml          pnpm 构建白名单
├── vite-env.d.ts                GIT_HASH / BUILD_TIME 全局声明
└── .oxfmtrc.json                oxfmt 配置（singleQuote、bracketSameLine）
```

### 自定义 UI 组件（K\*）

| 组件        | 用途                                                    |
| ----------- | ------------------------------------------------------- |
| `KCard`     | 毛玻璃卡片容器（可选 title）                            |
| `KButton`   | 毛玻璃按钮（支持 round/text/block）                     |
| `KCardLink` | 链接卡片（可选 img/desc/icon/new，含 open_in_new 图标） |
| `KNavCard`  | 导航/友链矩形卡片（title/desc/trans，首页 aboutNav 与友链共用） |
| `KInput`    | 输入框/textarea（支持 clearable/disabled/maxlength）    |
| `KSwitch`   | 开关                                                    |
| `KDivider`  | 分隔线（horizontal/vertical）                           |
| `KBadge`    | 主题色半透明小徽标（text-xs 胶囊，用于关系/标签/主要设备） |
| `KMarkdown` | Markdown 渲染（markdown-exit + github-markdown-css）    |
| `KTable`    | 表格布局（th 左对齐/td 右对齐）                         |
| `KMenu`     | 下拉菜单（direction/align，点击外部关闭）               |

### 页面路由总览

| 路由             | 文件                            | 说明                              |
| ---------------- | ------------------------------- | --------------------------------- |
| `/`              | `pages/index.vue`               | 全屏欢迎首屏 + 关于内容（含 data-pagefind-body） |
| `/about/as-mtf`  | `pages/about/as-mtf/index.vue`  | MtF 页面                          |
| `/about/devices` | `pages/about/devices/index.vue` | 设备配置（含 data-pagefind-body） |
| `/blog`          | `pages/blog/index.vue`          | 文章列表                          |
| `/blog/:slug`    | `pages/blog/[slug].vue`         | 文章详情（多语言）                |
| `/timeline`      | `pages/timeline/index.vue`      | 时间线（条目描述保持中文）        |
| `/links`         | `pages/links/index.vue`         | 友链页                            |
| `/ask-box`       | `pages/ask-box/index.vue`       | 提问箱列表                        |
| `/ask-box/ask`   | `pages/ask-box/ask.vue`         | 提交提问                          |
| `/status`        | `pages/status/index.vue`        | 状态页（Steam/天气/GitHub）       |
| `/neko`          | `pages/neko/index.vue`          | Neko AI 聊天                      |
| `/admin`         | `pages/admin/index.vue`         | API key 管理                      |
| `/admin/r2`      | `pages/admin/r2.vue`            | R2 文件上传                       |
| `/admin/neko`    | `pages/admin/neko.vue`          | Neko 提示词管理                   |
| `/admin/ask-box` | `pages/admin/ask-box.vue`       | 提问审核                          |

### API 概览

| 端点                                                     | 来源                  | 说明                         |
| -------------------------------------------------------- | --------------------- | ---------------------------- |
| `GET /api/articles`                                      | server/               | 文章元信息列表（无 content） |
| `GET /api/articles/:slug`                                | server/               | 指定文章（所有语言版本）     |
| 其余 `/status`、`/ask-box`、`/r2`、`/neko`、`/turnstile` | 后端 api.kuriyona.com | 通过 `fetchApi` 调用         |

## Architecture

- `app/` — Nuxt app (pages, components, stores, utils, assets)
- `server/` — Nitro API routes (`/api/articles`, `/api/articles/[slug]`). Reads markdown from `app/content/blog/` via `gray-matter` + custom `markdown-exit` renderer (not `@nuxt/content`).
- `scripts/` — Standalone Bun scripts: OG image generation (`generate-blog-og.ts`) and upload (`upload-blog-og.ts`). Import from `server/utils.ts`.
- `app/config.json` — 个人信息配置（tech_stack/languages/info/contact/games/device），由 `app/app.config.ts` 导入并合并进 `useAppConfig()`。
- `app/app.config.ts` — 导航项 `nav` 支持 `enabled`（顶栏过滤）与 `onAbout`（关于页矩形卡片过滤）两个独立开关；`aboutNav` 为 `onAbout` 的过滤结果，供关于页 `useAboutNav()` 使用；`timeline` 条目支持可选 `link` 字段（内部路径或外部 URL，时间线页渲染跳转按钮）。
- `i18n/locales/` — 4 files: `zh-Hans.json` (default), `zh-Hant.json`, `en.json`, `ja.json`.
- `app/pages/admin/` — 4 protected pages: `/admin`, `/admin/r2`, `/admin/neko`, `/admin/ask-box`. Auth via `API_KEY` in `localStorage`, passed as `?auth=` param.

## Key Conventions

- **Path aliases**: `@/` and `~/` both work, used interchangeably.
- **I18n**: `app/scripts/i18n.ts` re-exports `useI18n` from `vue-i18n`. Templates also use `$t()` directly.
- **API client**: `app/utils/api.ts` exports a `ky`-based `fetchApi` that auto-injects `auth` from `localStorage.API_KEY`. Dev host: `https://api-kuriyona-com.localhost/` (not `localhost:62802`).
- **Admin auth**: `useStorage('API_KEY', '')`. Passed as `?auth=` on every admin request.
- **Styling**: Tailwind CSS v4 via `@import 'tailwindcss'` in `main.css`. No `tailwind.config.*`.
- **UI components**: Custom `K*` components in `app/components/` (KCard, KButton, KCardLink, KInput, KSwitch, KDivider, KMarkdown, KTable, KMenu, etc.) styled with Tailwind — no UI library. Toast feedback via `useToast` composable + `ToastHost` (replaces Varlet `Snackbar`).
- **Env vars**: Loaded via `dotenv/config` in backend only. Required: `AUTH_KEY`, `JWT_SECRET`, `WEATHER_API_KEY`, `LLM_API_KEY`, `TURNSTILE_SECRET_KEY`, `PUSHPLUS_API_KEY`, `ENDPOINT`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `BUCKET_NAME`.
- **Compile-time globals**: `GIT_HASH` and `BUILD_TIME` `define`'d in `nuxt.config.ts` (declared in `vite-env.d.ts`).
- **Dayjs locale sync**: `app/utils/time.ts` exports `setLocale(locale)` — must be called when i18n locale changes (done in `app.vue` watcher). Provides `formatRelativeTime(time)` for relative timestamps.
- **I18n key 约定**: 全部使用 kebab-case（如 `blog.not-found`），全局通用文本归入 `global.*` 命名空间；4 个语言文件 key 集合必须一致，新增/修改后需 `pnpm fmt` 触发 `sort-i18n.ts` 自动排序。
- **No tests or CI**.

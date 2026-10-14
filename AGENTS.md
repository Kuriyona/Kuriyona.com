# Kuriyona.com

个人网站 monorepo：根目录为 **Nuxt 4**（SSG）前端，`backend/` 为 **Cloudflare Workers + Hono + Drizzle + D1** API（单 Worker 同托管静态站点与 `/api/*`；原 [Kuriyona/api.kuriyona.com](https://github.com/Kuriyona/api.kuriyona.com) 仓库）。

## Stack

| Layer           | Choice                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime         | **Bun** (not Node)                                                                                       |
| Package manager | **pnpm** (v11.4.0)                                                                                       |
| Frontend        | Nuxt 4 + Vue 3 + Tailwind CSS v4                                                                         |
| UI components   | Custom `K*` components (Tailwind)                                                                        |
| Icons           | **Iconify**（`@iconify/vue` + 本地 `@iconify-json/material-symbols` / `simple-icons`，构建期按用量生成） |
| Headless UI     | **Reka UI**（unstyled primitives，驱动 K\* 交互组件）                                                    |
| Animation       | GSAP                                                                                                     |
| I18n            | `@nuxtjs/i18n` (`prefix_except_default`, 4 locales)                                                      |
| Backend         | Cloudflare Workers + Hono + Drizzle + D1 (`backend/`)                                                    |
| Formatter       | `oxfmt` (not Prettier)                                                                                   |

## Commands

```
# 前端（根目录）
pnpm dev             Nuxt dev server，portless → https://kuriyona.localhost
pnpm dev:plain       Nuxt dev server，不映射域名（默认 3000）
pnpm generate        Nuxt static generation
pnpm gen:icons       扫描图标名 → 生成 app/utils/icons.gen.ts（pnpm dev / pnpm generate 已自动前置执行）
pnpm index           PageFind search indexing (requires `generate` first)
pnpm preview         Nuxt preview build output
pnpm build           pnpm generate + pnpm index
pnpm fmt             Format with oxfmt

# 后端（backend/ 独立子包，通过 api:* 转发；wrangler 装在根目录）
pnpm api:install     安装后端依赖
pnpm api:dev         wrangler dev --port 62802，portless → https://kuriyona-api.localhost（需根 .dev.vars 与 dist/）
pnpm api:run         wrangler dev --port 62802，不映射域名
pnpm api:orm-generate  改 schema 后生成 Drizzle 迁移
pnpm api:d1:migrate:local   应用迁移到本地 D1
pnpm api:d1:migrate:remote  应用迁移到远程 D1
pnpm deploy          构建前端 + wrangler deploy（= pnpm build && wrangler deploy）
```

`postinstall` auto-runs `nuxt prepare`. No lint, typecheck, or test commands；`pnpm build`/`pnpm generate`（含 prerender 全部路由）与 `pnpm deploy`（wrangler）即构建验证手段。

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
  `pnpm index` 把索引写到 `temp/pagefind`，再复制一份到 `dist/pagefind`（部署用）。索引**不能**只放 `dist/`：Nitro 的 `prepare()` 在每次 dev 启动时 `rm -rf nitro.output.publicDir`（本仓 = `dist`），`dist/pagefind` 会被删光，`/pagefind/*` 全 404。
  The Vite dev server serves `/pagefind/*` from `temp/pagefind/` via a custom plugin (`pagefind-dev` in `nuxt.config.ts`).
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
- `/` (首页：半屏 Hero + 关于内容与右侧常驻城市卡片、生日/MBTI、技能、导航卡、社交与联系方式，`app/pages/index.vue`)
- `/about/trans` (`app/pages/about/trans/index.vue`)
- `/about/devices` (`app/pages/about/devices/index.vue`)
- `/friends-and-links` (`app/pages/friends-and-links/index.vue`)

Add `data-pagefind-body` to `<AppPage>` or individual pages to include them in search results.

## Project Structure

```
Kuriyona.com/
├── app/                        Nuxt 应用（核心代码）
│   ├── app.vue                 根组件：背景、NuxtLayout、NuxtPage、AppBar、ToastHost；i18n locale watcher
│   ├── app.config.ts           defineAppConfig：导航（nav + aboutNav）+ 友链（main 最重要的人（每人多平台链接）/ others / links），合并 app/config.json
│   ├── config.json             个人信息配置（tech_stack/languages/info/contact/games…）
│   ├── assets/
│   │   ├── css/                main.css（@import 汇总）· fonts.css（Google Fonts 文本字体 @import；**不含图标字体**）· base.css（设计令牌/主题变量/滚动条/光标）· surface.css（.k-surface/.k-glass/.k-interactive/.k-scrim 表面体系）· utilities.css（.link/.trans-text/.trans-ribbon/.trans-aura 等跨性别旗装饰）
│   │   └── icons/              背景平铺图案用的图标 SVG（code/lambda/narutomaki/terminal，白色填充；勿再用 CSS filter 染色：iOS WebKit 下 <pattern> 内的 <image> 带滤镜会整层不渲染）
│   ├── components/             自动导入组件
│   │   ├── AppPage.vue         页面布局容器（居中、max-w、底部 AppFooter）
│   │   ├── AppBar.vue          顶部导航栏 + 搜索按钮 + Ctrl+K 全局监听（右侧为一个「语言 + 菜单」合并长条按钮，点击打开抽屉 AppBar/AppMenu；抽屉用带小字标签的分隔线分三段：语言设置（KSelect）/ 页面（导航卡片）/ 关于（GIT_HASH/构建时间/Cloudflare 节点，mt-auto 沉底））
│   │   ├── AppFooter.vue       版权声明 + 萌 ICP 备
│   │   ├── AppBackground.vue   全屏背景（图标 SVG 错位平铺 + 加亮层；两种模式：鼠标模式跟随光标、触摸屏模式高亮点移动并触边反弹，模式按真实输入切换（指针移动 / 触摸按下 / 光标移出视口后从最后位置继续）且触摸状态保留；运动学纯函数在 app/utils/highlightMotion.ts）
│   │   ├── BlogTopBar.vue      博客详情浮动顶栏（标题滚出顶栏可视区后被 IntersectionObserver 触发的 fixed 卡片：左侧返回按钮 + 右侧单行标题 / 单行描述，超出省略；`top` 由页面传入的 `floatingTop` 常量决定；`actions` 具名插槽用于在右侧追加控件，如窄屏的目录按钮）
│   │   ├── BlogToc.vue         博客目录列表（正文顶部内联卡片 / 宽屏左侧悬浮 / 窄屏顶栏展开共用；按 level 缩进、超长截断，`active` 为当前阅读位置 slug 时高亮 `bg-(--color-hover)` + 加粗）
│   │   ├── SearchModal.vue     PageFind 搜索弹窗（Teleport 到 body）
│   │   ├── ToastHost.vue       全局 toast 宿主（Teleport，配合 useToast）
│   │   ├── KTurnstile.vue      Cloudflare Turnstile 人机验证（换取 JWT）
│   │   ├── KSurface.vue        表面原语（as/level/glass；层级由组件树嵌套自动推导、上限 3、可手动覆盖）
│   │   ├── KIcon.vue          图标（Iconify；name 为 `prefix:name` 全名，尺寸用字号类）
│   │   ├── K*.vue              自研 UI 组件（见下表）
│   │   ├── card/               About 页卡片：CardGames/CardContact/CardCityMap（城市地图，ClientOnly；`city` 为 `City`（含可选 `weather`，在地图右下角叠加天气图标 + 温度），首页常驻城市卡片用）
│   │   └──
│   ├── composables/            自动导入组合式函数
│   │   ├── useSearch.ts        PageFind 搜索单例状态（查询/结果/键盘导航）
│   │   ├── useToast.ts         轻量 toast（模块级单例，success/error）
│   │   ├── useNav.ts           导航项（读取 app.config nav/aboutNav + i18n 标题）
│   │   ├── useCity.ts           `/api/city` 数据（useAsyncData key `city`，server: false；首页常驻城市卡片）
│   │   ├── useCodeCopy.ts      博客代码块复制按钮 + toast 提示
│   │   ├── useHeadingAnchor.ts 博客标题锚点跳转
│   │   ├── useSurfaceLevel.ts  表面层级推导（provide/inject，上限 3，供 KSurface/KCard 使用）
│   │   ├── useCloudflareStatus.ts  CF 节点状态 + /cdn-cgi/trace 定位
│   │   ├── idbCache.ts         管理端出图用的 IndexedDB 边界缓存（配 @kuriyona/amap-box）
│   │   └── cfn.ts              cloudflarestatus API 类型定义
│   ├── layouts/                 页面布局（Nuxt 自动发现；由 app.vue 的 <NuxtLayout> 应用）
│   │   ├── default.vue          透传 slot（无自定义布局页面走此布局）
│   │   └── admin.vue            管理面板共享导航壳（五个 admin 页面 definePageMeta({ layout: 'admin' })）
│   ├── pages/                   路由页面（Nuxt 文件路由）
│   │   ├── index.vue            首页（半屏 Hero：无头像，仅两行标题「你好，欢迎来到 / Kuriyona's Space」；+ 关于内容、生日/MBTI、技能、导航卡、社交与联系方式；「关于我」右侧为常驻城市卡片 CardCityMap（地图右下角叠加天气图标 + 温度），窄屏两行，城市与天气数据来自 /api/city，见 app/pages/index.vue）
│   │   ├── about/trans/        MtF 相关页面（欢迎文字（MtF 短语用旗面渐变）+ 关于我（trans 旗 hero 外观 + 自我介绍）+ 性别探索过程里程碑计数（GSAP）+ 跨性别资源链接）
│   │   ├── blog/index.vue       博客列表（按语言过滤；卡片用「标题链接 + before 铺满卡片」整体可点，左下角 translate 图标 + 每种语言一个 KBadge，标签本身是切到该语言版本的链接；宽度不足时语言组与属性组自动分成两行，各自保持左 / 右对齐）
│   │   ├── blog/[slug].vue      博客详情（TOC 卡片、多语言切换（其他语言版本每条为「大字标题 + 小字描述」两行、均截断）、代码复制、搜索索引、滚动后的浮动顶栏 BlogTopBar 与浮动目录、阅读进度高亮）
│   │   ├── friends-and-links/index.vue 友链页（最重要的人（KPersonCard 多平台链接）/ 朋友们 / 友链 / 申请交换）
│   │   ├── timeline/index.vue   时间线页（倒序展示，条目可选 link 跳转按钮）
│   │   ├── ask-box/             提问箱（index 列表 / ask 提交表单，Turnstile 验证）
│   │   ├── admin/               管理页（/admin API key、/admin/r2 上传、/admin/ask-box 审核、/admin/city 城市地图出图、/admin/cache 缓存清除）
│   ├── stores/                  Pinia stores
│   │   └── main.ts              JWT（Turnstile 验证后存储）
│   ├── utils/                   @/ 别名工具函数
│   │   ├── api.ts               ky 实例 fetchApi（自动注入 auth，开发环境用本地 host）
│   │   ├── time.ts              dayjs 封装：formatDate/formatTime/formatDuration/formatRelativeTime/setLocale
│   │   ├── i18n.ts              uniLocale（移除 -TW/-HK 后缀）
│   │   ├── emoji.ts             国家码 → 国旗 emoji
│   │   ├── console.ts           console 欢迎信息（greet.txt）
│   │   ├── pagefind.ts          PageFind JS API 封装（new Function 绕过打包器）
│   │   ├── icons.gen.ts         图标注册（由 scripts/gen-icons.ts 生成，勿手改）
│   │   ├── weatherIcon.ts       QWeather 天气图标码 → Material Symbols 图标名（weatherIcon()，未收录回退 help）
│   │   ├── highlightMotion.ts   背景高亮点运动学纯函数（随机起点/对角方向、触边反弹、视口变化夹回）
│   ├── scripts/                 客户端共享脚本/类型
│   │   ├── i18n.ts              重导出 vue-i18n 的 useI18n
│   │   └── cityTypes.ts         /api/city 接口类型（City/Weather）
│   ├── content/blog/            博客 Markdown 源文件（按语言分目录：zh-Hans/zh-Hant/en/ja）
│   └── data/devices.json        设备配置数据（/about/devices 页面读取）
├── server/                      Nitro API 路由
│   ├── utils.ts                 Markdown 渲染核心（markdown-exit + Shiki 高亮 + TOC + 外链图标 + 缓存/热重载）
│   └── api/articles.ts          GET /api/articles（不含 content）
│   └── api/articles/[slug].ts   GET /api/articles/:slug（按 slug 过滤，返回所有语言版本）
├── scripts/                     Bun 独立脚本（非打包进应用）
│   ├── generate-blog-og.ts      OG 图生成（yona-svg + sharp，输出到 temp/）
│   ├── upload-blog-og.ts        OG 图上传到 R2（Bun S3Client，需 ENDPOINT 等环境变量）
│   ├── check-contrast.ts        视觉令牌对比度校验（bun scripts/check-contrast.ts）
│   ├── gen-icons.ts             扫描源码/数据里的图标名 → app/utils/icons.gen.ts（校验不存在/动态拼接的名字）
│   └── sort-i18n.ts             i18n JSON 按键名排序（pnpm fmt 时自动执行）
├── backend/                     后端 API（独立子包，自带 lockfile，非 pnpm workspace 成员）
│   ├── index.ts                 Worker 入口（Hono app，导出 default；不做 listen/migrate）
│   ├── src/
│   │   ├── env.ts               Env 接口 + REQUIRED_ENV
│   │   ├── city-map.ts          城市地图：KV 键/默认城市/R2 公开地址/读配置
│   │   ├── amap.ts              高德：行政区划接口常量 + 城市中心点（amap:center:<adcode>，供天气按坐标查）
│   │   ├── db/schema.ts         Drizzle sqlite-core 表结构（ask_table，UUID 主键）
│   │   ├── plugin/auth.ts       鉴权中间件（AUTH_KEY query / JWT Bare 或 Bearer）
│   │   ├── router/              路由：ask-box / r2 / city（高德代理 + 出图上传签名 + 写城市配置）/ cache（Cloudflare 清缓存转发）
│   │   └── utils.ts             D1/R2 预签名/Turnstile 工具
│   ├── drizzle/                 Drizzle SQLite 迁移（提交到 Git，wrangler 消费）
│   └── docs/                    后端文档（development / deployment / city-map / cache-purge）
├── i18n/locales/                4 个语言文件：zh-Hans.json（默认）/ zh-Hant.json / en.json / ja.json
├── public/                      robots.txt + _headers（Workers 静态响应头，含 nosniff/Cache-Control）+ _redirects（`/links` → `/friends-and-links` 301、`/about/as-mtf` → `/about/trans` 301 含 en/ja/zh-Hant 前缀版本）
├── temp/                        OG 图生成中间产物 + PageFind 索引（temp/pagefind，gitignored）
├── nuxt.config.ts               Nuxt 配置（模块、i18n、nitro 输出到 dist、pagefind-dev 插件、build.transpile: ['reka-ui']、vite.optimizeDeps.include（客户端依赖预打包，含 @iconify/vue）、GIT_HASH/BUILD_TIME define）
├── wrangler.jsonc               根 Worker 配置（name=kuriyona-web，assets=./dist，D1 binding DB，KV binding STATUS_KV，main=backend/index.ts）
├── .dev.vars.example            本地开发环境变量模板（复制为 .dev.vars，gitignored）
├── package.json                 依赖与脚本（无 lint/typecheck/test；含 api:* 与 deploy）
├── pnpm-workspace.yaml          pnpm 构建白名单（含 workerd）
├── vite-env.d.ts                GIT_HASH / BUILD_TIME 全局声明
└── .oxfmtrc.json                oxfmt 配置（singleQuote、bracketSameLine）
```

### 自定义 UI 组件（K\*）

| 组件          | 用途                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KCard`       | 表面卡片容器（可选 title；`level`/`glass` 透传给 KSurface）                                                                                        |
| `KSurface`    | 表面原语（`as`/`level`/`glass`；层级由组件树嵌套自动推导、上限 3、可手动覆盖；输出 `.k-surface` + `data-level`）                                   |
| `KButton`     | 控件按钮（半透明底色 `--color-control-bg` + 描边，支持 round/text/block）                                                                          |
| `KIcon`       | 图标（Iconify；`name` 为 `prefix:name` 全名，尺寸用字号类，单色 currentColor；无 `label` 时按装饰性处理）                                          |
| `KIconButton` | 圆形图标按钮（icon 为 `prefix:name` 全名、size sm/base/md/lg/xl；无 label 时用图标名末段做 aria-label）                                            |
| `KCardLink`   | 链接卡片（可选 img/desc/icon/new，默认图标为 `material-symbols:open-in-new` / `arrow-forward`）                                                    |
| `KPersonCard` | 重要的人卡片（relationKey 关系徽标 + name/desc；links 为轻量控件胶囊：`--color-control-*` 底色/描边 + `.k-interactive`，simple-icons 图标 + 名称） |
| `KNavCard`    | 导航/友链矩形卡片（title/desc/trans，首页 aboutNav 与友链共用）                                                                                    |
| `KInput`      | 输入框/textarea（支持 clearable/disabled/maxlength）                                                                                               |
| `KSelect`     | 下拉选择（封装 Reka `Select`；modelValue/options/placeholder，触发器对齐 KInput、弹层对齐 KMenu 风格）                                             |
| `KSwitch`     | 开关（封装 Reka `SwitchRoot`/`SwitchThumb`）                                                                                                       |
| `KDivider`    | 分隔线（封装 Reka `Separator`，horizontal/vertical，decorative；`label` 传入时在左端渲染一行小字标签（仅 horizontal））                            |
| `KBadge`      | 主题色半透明小徽标（text-xs 胶囊，用于关系/标签/主要设备）                                                                                         |
| `KMarkdown`   | Markdown 渲染（markdown-exit + github-markdown-css）                                                                                               |
| `KTable`      | 表格布局（th 左对齐/td 右对齐）                                                                                                                    |
| `KMenu`       | 下拉菜单（封装 Reka `DropdownMenu`；direction/align → side/align，v-model、trigger/default 槽；当前无使用处）                                      |
| `KDialog`     | 弹窗（封装 Reka `Dialog`；v-model 开关、title 槽/prop、width、closeOnBackdrop、teleport；遮罩/Esc/关闭按钮，KCard+KIconButton 组合）               |

### 页面路由总览

| 路由                 | 文件                                | 说明                                                                                                                         |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | `pages/index.vue`                   | 半屏 Hero + 关于内容（右侧常驻城市卡片，窄屏两行）+ 生日/MBTI、技能、导航卡、社交与联系方式（含 data-pagefind-body）         |
| `/about/trans`       | `pages/about/trans/index.vue`       | 作为一个 MtF（关于我 hero + 性别探索过程计数/占比条 + 资源链接，含 data-pagefind-body）                                      |
| `/about/devices`     | `pages/about/devices/index.vue`     | 设备配置（含 data-pagefind-body）                                                                                            |
| `/blog`              | `pages/blog/index.vue`              | 文章列表（卡片显示支持的语言编码）                                                                                           |
| `/blog/:slug`        | `pages/blog/[slug].vue`             | 文章详情（多语言，浮动顶栏 + 浮动目录 + 其它语言两行截断）                                                                   |
| `/timeline`          | `pages/timeline/index.vue`          | 时间线（条目描述保持中文）                                                                                                   |
| `/friends-and-links` | `pages/friends-and-links/index.vue` | 友链页（最重要的人 / 朋友们 / 友链 / 交换）                                                                                  |
| `/ask-box`           | `pages/ask-box/index.vue`           | 提问箱列表                                                                                                                   |
| `/ask-box/ask`       | `pages/ask-box/ask.vue`             | 提交提问                                                                                                                     |
| `/admin`             | `pages/admin/index.vue`             | 密钥校验 + 管理入口                                                                                                          |
| `/admin/r2`          | `pages/admin/r2.vue`                | 文件上传（拖拽/粘贴）+ 前缀/虚拟目录浏览                                                                                     |
| `/admin/ask-box`     | `pages/admin/ask-box.vue`           | 提问箱审核（回答/公开/删除）                                                                                                 |
| `/admin/city`        | `pages/admin/city.vue`              | 城市地图：浏览器出图 → 直传 R2 → 写 KV 城市配置（配 `@kuriyona/amap-box`；目标区域高亮取 `--color-theme`，改主题色需重出图） |
| `/admin/cache`       | `pages/admin/cache.vue`             | 缓存清除：选 zone（域名）+ URL / 主机名 / 标签 / 前缀四种方式清 Cloudflare 边缘缓存；最近清除存本机 localStorage             |

### API 概览

| 端点                                                       | 来源     | 说明                                                                                                                                                                                                  |
| ---------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/articles`                                        | server/  | 文章元信息列表（无 content）                                                                                                                                                                          |
| `GET /api/articles/:slug`                                  | server/  | 指定文章（所有语言版本）                                                                                                                                                                              |
| `/api/city`、`/api/ask-box`、`/api/r2/*`、`/api/turnstile` | backend/ | Worker（Hono），通过 `fetchApi`（前缀 `/api`）调用                                                                                                                                                    |
| `PUT /api/ask-box/admin/:id/answer`                        | backend/ | 接收 JSON body `{ answer }`（回答不再放在 URL path）                                                                                                                                                  |
| `GET /api/r2/list?prefix=&delimiter=`                      | backend/ | 返回 `{ prefix, folders, files, truncated }`，浏览根固定 `static/`（`folders` 来自 `CommonPrefixes`，`files[].key` 为含 `static/` 的完整键）                                                          |
| `GET /api/city/amap?<参数>`                                | backend/ | 高德代理（管理端出图用，需 `auth`）：转发查询并注入 `AMAP_KEY`，KV 缓存 30 天；`?nocache=1` 只绕过读取                                                                                                |
| `GET /api/city/map/upload-url?adcode=`                     | backend/ | 返回 R2 预签名 PUT 地址，键 `img/site/map/<adcode>.svg`（签名含 `Content-Type: image/svg+xml`）                                                                                                       |
| `PUT /api/city`                                            | backend/ | 写 KV `city:maps`（只存 `{ name, adcode }`，`map` 由 adcode 推导）：`GET /api/city` 的 `resident`/`current` 读它，缺失/坏值回退杭州                                                                   |
| `GET /api/city` 的 `resident`/`current`                    | backend/ | `{ resident: { name, adcode, map, weather }, current: { name, adcode, map } }`，读 KV `city:maps`、缺失时回退杭州，`map` 指向 R2 静态 SVG（见 `backend/docs/city-map.md`）                            |
| `GET /api/cache/zones`                                     | backend/ | 列出 `CF_API_TOKEN` 可见的 zone（`{ zones: [{ id, name, status, plan }] }`，最多 5 页 × 50），管理端清缓存的域名下拉用                                                                                |
| `POST /api/cache/purge`                                    | backend/ | body `{ zone, type, targets[] }` → `POST /zones/{id}/purge_cache`；`type` 为 `url`/`hostname`/`tag`/`prefix`，`zone` 接受 zone id 或域名；单次上限 100 条，成功返回 `{ success, zone, type, purged }` |
| `GET /api/city` 的 `resident.weather`                      | backend/ | 按 `city:maps` 的 `resident.adcode` 取高德中心点（KV `amap:center:<adcode>`）后以 `location=经度,纬度` 查 QWeather，缓存 `cache:weather:<adcode>` 30 分钟                                             |

## Architecture

- `app/` — Nuxt app (pages, components, stores, utils, assets)
- `server/` — Nitro API routes (`/api/articles`, `/api/articles/[slug]`). Reads markdown from `app/content/blog/` via `gray-matter` + custom `markdown-exit` renderer (not `@nuxt/content`).
- `scripts/` — Standalone Bun scripts: OG image generation (`generate-blog-og.ts`)、上传 (`upload-blog-og.ts`)、设计令牌对比度校验 (`check-contrast.ts`，改颜色令牌后运行 `bun scripts/check-contrast.ts`)、图标注册生成 (`gen-icons.ts`，扫源码与数据里的 `prefix:name` 图标名 → `app/utils/icons.gen.ts`)。Import from `server/utils.ts`.
- `backend/` — 后端 API 独立子包（自带 `pnpm-lock.yaml`/`pnpm-workspace.yaml`，非根 workspace 成员）：Cloudflare Workers + Hono + Drizzle + D1，入口 `backend/index.ts` 导出 Hono app（挂在 `/api/*`），迁移由 `wrangler d1 migrations apply` 应用；部署由根 `wrangler.jsonc`（单 Worker `kuriyona-web`，同托管 `dist/` 静态站点）驱动。详见 `backend/AGENTS.md` 与 `backend/docs/`。
- **城市地图与天气**：`GET /api/city` 的 `resident`/`current` 读 KV 键 `city:maps`（`backend/src/city-map.ts`），缺失/坏值回退默认杭州 `330100`，`map` 指向 R2 静态 SVG `img/site/map/<adcode>.svg`（KV 只存 `{ name, adcode }`）。**出图跑在管理端浏览器里**（`/admin/city` 动态 `import('@kuriyona/amap-box')`）：Worker 只做高德代理（注入 `AMAP_KEY` + KV 缓存 30 天）、签发 R2 上传地址、写 KV 城市配置（`backend/src/router/city.ts`），CPU ≈ 0。首页「关于我」右侧的常驻城市卡片复用同一份 `resident`（`app/pages/index.vue` 里 `useCity()`），预渲染阶段拿不到数据、只有「关于我」单卡。`resident` 也带 **`weather`**：`backend/src/amap.ts` 的 `cityCenter(env, adcode)` 向高德行政区划接口取中心点（KV `amap:center:<adcode>`，30 天），再以 `location=<经度>,<纬度>` 调 QWeather（缓存 `cache:weather:<adcode>`，30 分钟）；`AMAP_KEY` 缺失时回退默认城市（杭州）中心点。原因（Worker 里一次出图 CPU 实测 ~0.9s / wall 21s，Free 上限 10ms 差两个数量级）× 重新出图步骤 × 各备选方案取舍，见 `backend/docs/city-map.md`。
- **缓存清除（Cloudflare）**：管理端 `/admin/cache` → Worker 两个薄端点（`backend/src/router/cache.ts`，都要 `auth`）：`GET /api/cache/zones` 用 `CF_API_TOKEN` 列域名，`POST /api/cache/purge` 转发 `purge_cache`（`files`/`hosts`/`tags`/`prefixes`）。token 只存 Worker 侧（`CF_API_TOKEN`），需要 **Zone:Read + Cache Purge**、Zone Resources 覆盖目标域名；单次上限 100 条（Cloudflare 的 Max operations per request），返回 200 只代表请求被收下，是否真清掉要看 `CF-Cache-Status` 是否 MISS。起因：R2 对象带 `cache-control: max-age=86400`，换图后边缘缓存最长 24h 才过期。
- `wrangler.jsonc` — 根 Worker 配置：`main = backend/index.ts`、`assets.directory = ./dist`、`run_worker_first: ["/api", "/api/*"]`、D1 binding `DB`（`kuriyona-db`）、KV binding `STATUS_KV`（命名空间 `kuriyona-kv`，存 `cache:weather:<adcode>` 天气缓存、`city:maps` 城市配置与 `amap:*` 缓存（边界响应原文 + `amap:center:<adcode>` 城市中心点））。`pnpm deploy` 部署。
- `app/config.json` — 个人信息配置（tech_stack/languages/info/contact/games/device），由 `app/app.config.ts` 导入并合并进 `useAppConfig()`。
- `app/app.config.ts` — 导航项 `nav` 支持 `enabled`（顶栏过滤）与 `onAbout`（关于页矩形卡片过滤）两个独立开关；`aboutNav` 为 `onAbout` 的过滤结果，供关于页 `useAboutNav()` 使用；`timeline` 条目支持可选 `link` 字段（内部路径或外部 URL，时间线页渲染跳转按钮）。
- `i18n/locales/` — 4 files: `zh-Hans.json` (default), `zh-Hant.json`, `en.json`, `ja.json`.
- `app/pages/admin/` — 5 protected pages: `/admin`, `/admin/r2`, `/admin/ask-box`, `/admin/city`, `/admin/cache`；共用 `app/layouts/admin.vue`（导航壳，`definePageMeta({ layout: 'admin' })`）。Auth via `API_KEY` in `localStorage`, passed as `?auth=` param（`fetchApi` 每请求现读，改密钥即时生效）；失败文案统一经 `app/utils/adminError.ts` 的 `adminErrorText`（`adminErrorMessage` 同源但优先用响应体里的 `message`，清缓存页用它显示 Cloudflare 原文）。

## Key Conventions

- **Path aliases**: `@/` and `~/` both work, used interchangeably.
- **I18n**: `app/scripts/i18n.ts` re-exports `useI18n` from `vue-i18n`. Templates also use `$t()` directly.
- **API client**: `app/utils/api.ts` exports a `ky`-based `fetchApi` that auto-injects `auth` from `localStorage.API_KEY`. Dev host: `https://kuriyona-api.localhost/api`（portless 把 `wrangler dev` 的 62802 映射到该域名，见下条）；生产同源相对路径 `/api`（无需 CORS）。
- **本地开发（portless）**: `pnpm dev` / `pnpm api:dev` 经 [portless](https://www.npmjs.com/package/portless)（`pnpm add -g portless`，需 Node ≥ 24）提供本地 HTTPS 域名：前端 `https://kuriyona.localhost`、API `https://kuriyona-api.localhost`。首次需 `portless trust` 信任本地 CA；代理默认在 443 起（要 sudo，无 sudo 时 `portless proxy start --port 1355 --https`，URL 会带 `:1355`）。配置全部写在文件里：前端 app 名 = 根 `package.json` 的 `"portless": "kuriyona"`，API app 名 = `api:dev` 脚本里的 `--name kuriyona-api`，TLD = 两个脚本首部内联的 `PORTLESS_TLD=localhost`（**两处成对，改一处必须改另一处**；内联是为了不受环境变量影响，`.env` 不行——`pnpm run` 不加载 `.env`）。`api:dev` 里 `--app-port 62802` 与 `wrangler dev --port 62802` 也是成对的：Nuxt 会读 portless 注入的 `PORT` 所以 `dev` 不写端口，wrangler 不读，必须显式指定并让 portless 指向同一端口。不经 portless 时用 `pnpm dev:plain`（3000）与 `pnpm api:run`（62802），或 `PORTLESS=0 pnpm dev`。
- **Admin auth**: `useStorage('API_KEY', '')`. Passed as `?auth=` on every admin request.
- **Styling**: Tailwind CSS v4 via `@import 'tailwindcss'` in `main.css`. No `tailwind.config.*`. `nuxt.config.ts` 的 `vite.ssr.noExternal: ['tailwindcss']` 是 Vite 8 回归的 workaround，**必须保留**：否则 SSR build 会把 CSS 里的裸 `@import 'tailwindcss'` 当外部依赖返回原 specifier，postcss-import 转而打开 `<root>/tailwindcss` 并报 `ENOENT`（`pnpm generate` 在 server bundle 阶段失败）。上游 vitejs/vite#23096（修复 PR #23099），修复发布后可移除。
- **视觉令牌（颜色/层级/毛玻璃）**: 颜色/层级只能用 `app/assets/css/base.css` 的 `--color-*`/`--card-*`/`--shadow-*` 令牌 + `app/assets/css/surface.css` 的 4 个类（`.k-surface`/`.k-glass`/`.k-interactive`/`.k-scrim`）；卡片层级由 `KSurface`/`KCard` 的 `level`（或嵌套自动推导，上限 3）落到 `data-level`。禁止再写 `bg-black/*`、`bg-white/*`、`text-white/*`、`backdrop-*` 之类的一次性透明度/模糊类（`.k-glass`/`.k-scrim` 是唯一允许 `backdrop-filter` 的地方）。按钮等控件用 `--color-control-bg`/`--color-control-border`（半透明，叠在任何表面/玻璃上都成立）；该底色会抬升表面亮度，控件内文本只用 `--color-text-1`/`--color-text-2`，不要用 `text-3`/`text-4`。改任何颜色令牌后跑 `bun scripts/check-contrast.ts` 复核对比度。跨性别旗配色（`--color-trans-sky/pink/white`）与 `utilities.css` 的 `.trans-text`/`.trans-text-flow`/`.trans-ribbon`/`.trans-aura` 只用于旗帜装饰（渐变字 / 彩带 / 光晕），不承载正文、不参与表面与文本层级，也不纳入对比度校验；需要旗面配色时从这里取，不要另写 hex。
- **动画（GSAP）**: 目前唯一使用处是 `pages/about/trans/index.vue`。约定：`gsap` 与 `gsap/ScrollTrigger` **静态 import**（编译进该页 chunk，随路由一起到达，不额外等一个动态 chunk），`registerPlugin` 与 `gsap.matchMedia(...)` 都放在 `onMounted` 里；**`onUnmounted` 必须在 setup 同步阶段注册** —— 放进 `onMounted` 的 async 回调里会因为失去活动组件实例而直接失效（Vue 只会打一条 warn），GC 掉的就是整个 MatchMedia 上下文。补间的初值取「最终值」而非 0，这样 SSR / 无 JS 时渲染的就是真实数值（不需要 `ClientOnly`）；代价是 JS 接管前会先显示最终值，随后才从 0 滚上去。
- **图标（Iconify）**: 全站图标只用 Iconify 的 `material-symbols`（Material Symbols Outlined）与 `simple-icons` 两个集合，**访客不加载任何第三方图标资源**（已移除 Google Fonts 的 Material Symbols 字体与 `cdn.simpleicons.org`）。用法：`<KIcon name="material-symbols:close" class="text-lg" />`，尺寸统一用字号类（svg 是 1em×1em，不要写 `w-5 h-5`）、单色跟随 `currentColor`；`KIconButton` 的 `icon` prop 同样要求完整名。图标名必须是 `prefix:name` 的**完整字面量**（小写 kebab-case，下划线→短横线），数据层（`app/config.json`、`app/app.config.ts`）也直接存全名，禁止拼接。`scripts/gen-icons.ts` 扫描源码与数据 → 生成 `app/utils/icons.gen.ts`（只注册用到的图标），由 `pnpm dev` / `pnpm gen:icons` / `pnpm generate` 前置执行；名字拼错、集合里不存在、或写成动态拼接都会**让构建失败**；生成文件把 `@iconify/vue` 的远程下载通路替换为 reject，所以即使漏注册也不会去请求 Iconify API。加图标 = 在调用点写出来即可，无需维护白名单。天气图标同理：QWeather 的图标码经 `app/utils/weatherIcon.ts` 映射成 Material Symbols（**不再引入 `qweather-icons` 字体**，`CardCityMap` 用 `KIcon`）。
- **UI components**: Custom `K*` components in `app/components/` styled with Tailwind. 交互组件（KDialog/KSwitch/KDivider/KMenu）基于 **Reka UI** unstyled primitives 实现，保留原 `K*` 公共 API。Toast feedback via `useToast` composable + `ToastHost` (replaces Varlet `Snackbar`). `KCardLink` 根 `<a>` 的 `block` 类**必须保留**：内层 `KCard` 带 `h-full`（`height:100%`），若 `<a>` 退回 `display:inline`，在「普通卡片内部」（非 flex/grid 子项）会触发 block-in-inline 拆分 —— 百分比高度形成循环依赖，Chrome 用子元素内容高度算父卡片高度、却按百分比画子元素，导致内层卡溢出父卡底边并压住边框。
- **Reka UI (SSR)**: `nuxt.config.ts` 的 `build.transpile: ['reka-ui']` **必须保留**。否则生产 SSR 下 reka-ui 被 external，与 Nuxt 打包的 Vue 形成两份 `@vue/runtime-core`，其模块级 `currentRenderingInstance` 不一致，async/Suspense 页面渲染 `renderSlot` 时会抛 `Cannot read properties of null (reading 'ce')`（`pnpm generate` 报 blog 详情页 500）。
- **Env vars**: 后端 Worker 从 `c.env` 读取，每个请求校验必需项（缺失返回 500 `[config] 缺少必需的环境变量: <KEY>`）。本地模板 `.dev.vars.example`（复制为 `.dev.vars`，gitignored）；生产 `wrangler secret put`。必需 7 项：`JWT_SECRET`、`AUTH_KEY`、`TURNSTILE_SECRET_KEY`、`ENDPOINT`、`ACCESS_KEY_ID`、`SECRET_ACCESS_KEY`、`BUCKET_NAME`（`DB` 由 D1 binding、`STATUS_KV` 由 KV binding 提供）；可选 `AMAP_KEY`（城市地图出图取边界走 `/api/city/amap` 代理，以及 `/api/city` 按常住城市查天气中心点；缺失时前者端点 500、后者回退默认城市中心点，其余不受影响）、`CF_API_TOKEN`（管理端 `/admin/cache` 清 Cloudflare 缓存走 `/api/cache/*`，需要 **Zone:Read + Cache Purge** 权限、Zone Resources 覆盖目标域名；缺失时只有 `/cache/*` 报 500，权限清单见 `backend/docs/cache-purge.md`）。
- **`dist/` 会被 dev 启动清空**: `nuxt.config.ts` 的 `nitro.output.publicDir = 'dist'`（同时是 wrangler 的 `assets.directory`，也是 SSG 输出）；Nitro 的 `prepare()` 每次 dev 启动执行 `rm -rf` 该目录（`nitropack/dist/core/index.mjs` 的 `prepareDir`）。所以**不要**把需要跨 dev 重启保留的产物放 `dist/`：PageFind 索引因此落在 `temp/pagefind`（见 Search 一节），`pnpm index` 另外复制一份到 `dist/pagefind` 供部署。
- **`package.json` 的 `"type": "module"`**: 用于消除 `nuxt.config.ts` 触发的 `MODULE_TYPELESS_PACKAGE_JSON` 警告——Nuxt dev 会把该 stderr 警告计入 `✕ 1 error`。`scripts/index-pagefind.cjs` 显式 `.cjs`，不受影响。
- **Compile-time globals**: `GIT_HASH` and `BUILD_TIME` `define`'d in `nuxt.config.ts` (declared in `vite-env.d.ts`).
- **Dayjs locale sync**: `app/utils/time.ts` exports `setLocale(locale)` — must be called when i18n locale changes (done in `app.vue` watcher). Provides `formatRelativeTime(time)` for relative timestamps.
- **I18n key 约定**: 全部使用 kebab-case（如 `blog.not-found`），全局通用文本归入 `global.*` 命名空间；4 个语言文件 key 集合必须一致，新增/修改后需 `pnpm fmt` 触发 `sort-i18n.ts` 自动排序。
- **No tests or CI**.

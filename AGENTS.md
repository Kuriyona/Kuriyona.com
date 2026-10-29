# Kuriyona.com

个人网站 monorepo：根目录为 **Nuxt 4**（SSG）前端，`backend/` 为 **Cloudflare Workers + Hono + Drizzle + D1** API（单 Worker 同托管静态站点与 `/api/*`；原 [Kuriyona/api.kuriyona.com](https://github.com/Kuriyona/api.kuriyona.com) 仓库）。

## Stack

| Layer     | Choice                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------- |
| Runtime   | **Bun**（非 Node）+ **pnpm** (v11.4.0)                                                                   |
| Frontend  | Nuxt 4 + Vue 3 + Tailwind CSS v4                                                                         |
| UI        | 自研 `K*` 组件（Tailwind）+ **Reka UI**（unstyled primitives，驱动 K\* 交互组件）                        |
| Icons     | **Iconify**（`@iconify/vue` + 本地 `@iconify-json/material-symbols` / `simple-icons`，构建期按用量生成） |
| Animation | GSAP                                                                                                     |
| I18n      | `@nuxtjs/i18n`（`prefix_except_default`，4 locales）                                                     |
| Backend   | Cloudflare Workers + Hono + Drizzle + D1（`backend/`）                                                   |
| Formatter | `oxfmt`（非 Prettier）                                                                                   |

## Commands

```
# 前端（根目录）
pnpm dev             Nuxt dev server，portless → https://kuriyona.localhost
pnpm dev:plain       Nuxt dev server，不映射域名（默认 3000）
pnpm generate        Nuxt static generation
pnpm gen:icons       扫描图标名 → 生成 app/utils/icons.gen.ts（dev / generate 已自动前置执行）
pnpm gen:zh-hant     由 zh-Hans 文章转换生成 zh-Hant（OpenCC；可传 slug，输出需提交）
pnpm index           PageFind 搜索索引（需先 `generate`）
pnpm preview         Nuxt preview build output
pnpm build           pnpm generate + pnpm index
pnpm fmt             oxfmt（并触发 sort-i18n）

# 后端（backend/ 独立子包，通过 api:* 转发；wrangler 装在根目录）
pnpm api:install     安装后端依赖
pnpm api:dev         wrangler dev --port 62802，portless → https://kuriyona-api.localhost（需根 .dev.vars 与 dist/）
pnpm api:run         wrangler dev --port 62802，不映射域名
pnpm api:orm-generate  改 schema 后生成 Drizzle 迁移
pnpm api:d1:migrate:local   应用迁移到本地 D1
pnpm api:d1:migrate:remote  应用迁移到远程 D1
pnpm deploy          构建前端 + wrangler deploy（= pnpm build && wrangler deploy）
```

`postinstall` 自动 `nuxt prepare`。**无 lint / typecheck / test 命令**：`pnpm build`（含 prerender 全部路由）与 `pnpm deploy`（wrangler）即构建验证手段。

## Git Commit Convention

Conventional Commits（CC 规范），描述用中文：`<type>: <中文描述>`（正文可选）。常用 type：

| Type                      | 用途                                            |
| ------------------------- | ----------------------------------------------- |
| `feat` / `fix`            | 新功能 / 新组件 · 修 bug                        |
| `refactor` / `style`      | 重构（不改行为）· 样式 / 格式（不改逻辑）       |
| `chore` / `docs` / `perf` | 构建 / 依赖 / 配置 · 文档（含本文件）· 性能优化 |

示例：`refactor: 移除 Varlet 组件替换为原生实现`、`feat: 新增 KInput 组件替换 var-input`。

### 文章与友链

这两类变更固定用 `blog` / `links` scope，标题取 frontmatter `title` 或友链 `name` 原文，放在 `「」` 里：

| 变更 | 格式 |
| --- | --- |
| 新增文章 | `feat(blog): 添加文章「<标题>」` |
| 修改文章正文 / 元信息 / 翻译 | `docs(blog): 更新文章「<标题>」` |
| 删除文章 | `chore(blog): 删除文章「<标题>」` |
| 只改单个语言版本 | `docs(blog): 文章「<标题>」更新 <语言> 版本`（如 `zh-Hant`、`ja`） |
| 新增友链 | `feat(links): 添加「<名称>」友链` |
| 修改友链信息 / 分组 / 排序 | `docs(links): 更新「<名称>」友链` |
| 删除友链 | `chore(links): 删除「<名称>」友链` |

一次提交涉及多篇文章或多个友链时，标题可概括为「更新 N 篇文章」/「批量整理友链」，正文逐条列出 slug 或名称。

**每次提交前必须更新 `AGENTS.md`**：确保项目结构、组件、路由、命令、约定等与当前代码一致（涉及新增 / 删除 / 修改时同步）。

## Search (PageFind)

[PageFind](https://pagefind.app/) 全文搜索。`app/utils/pagefind.ts` 用 `new Function()` 包 JS API 绕过打包器；`app/composables/useSearch.ts` 为单例状态；UI 在 `app/components/SearchModal.vue`（Teleport 到 body），`Ctrl+K` 或顶栏按钮触发，切语言时 `pagefindReinit()` 重建索引。

- **开发**：先 `pnpm generate && pnpm index` 再 `pnpm dev`。`pnpm index` 出索引到 `.cache/pagefind` 并复制一份到 `dist/pagefind`（部署用）。**索引不能只放 `dist/`**：Nitro `prepare()` 每次 dev 启动 `rm -rf nitro.output.publicDir`（= `dist`），`dist/pagefind` 会被删光、`/pagefind/*` 全 404；dev server 靠 `nuxt.config.ts` 的 `pagefind-dev` 插件从 `.cache/pagefind/` 提供。
- **生产**：`pnpm build` = `generate` + `index`。
- **索引范围**（Pagefind 只读 SSG 产物，不看 CSS：`hidden` 的元素照样会被索引）：
  - 整列入索引：`/`、`/about/trans`、`/about/devices`、`/friends-and-links`、`/timeline` —— `<AppPage data-pagefind-body>`，属性透传到根节点，覆盖正文列。
  - 只索引正文：`/blog/:slug` —— 仅 `div.markdown-body` 带 `data-pagefind-body`；标题不在 body 内，但 Pagefind 自动取页面第一个 `<h1>` 作为 `title` metadata，metadata 参与检索且有加权（默认 5x），所以标题可搜；语言切换器、阅读时长、AI 徽标、目录都不进索引。
  - 不索引：`/blog`（同语言全部文章标题/摘要的聚合页，收进来会让几乎所有文章查询都命中它）、`/ask-box`（`useAsyncData(..., { server: false })`，SSG 产物里没有问答内容，无可索引正文）、`/admin/*`、`404.html`/`200.html`。
  - `AppPage` 两侧 `aside.reserve` 固定 `data-pagefind-ignore="all"`：时钟、导航、最近文章、播放器与所有 `reserve-*` 插槽内容都不入索引（曾因这些内容随每页重复收录，搜文章标题会命中全站）。
- **新页面怎么接索引**：
  1. 内容型页面：在根 `<AppPage>` 上加 `data-pagefind-body`，索引整个正文列。
  2. 页面内重复/装饰性内容（导航卡、聚合列表、浮动 UI、控件）包一层 `data-pagefind-ignore="all"`。**别用默认的 `="index"`**：它仍会处理内部 metadata 并允许被当作页面标题，只有 `all` 是彻底跳过。
  3. 需要被搜到的正文**不要**放进 `reserve-*` 插槽（那是已忽略区）；保留区内新增组件不必再逐个标注。
  4. 客户端取数的页面（`server: false`，或 `onMounted` 后才渲染的内容）无法被索引；要么保持不索引，要么改成构建期可取的数据。
  5. 需要自定义搜索结果标题时，给标题元素加 `data-pagefind-meta="title"`；文章详情沿用「只有正文是 body」的模式，不要为了搜 `desc` 把整列改成 body。
- **构建**：`pnpm index` 先 `rm -rf .cache/pagefind` 再出索引 —— Pagefind 不清理输出目录，重跑会在 content-hash 文件名下累积旧 fragment / `pf_meta`（曾在 34 页的站上堆到 216 个 fragment）。索引落 `.cache/pagefind` 并复制到 `dist/pagefind`；dev 由 `pagefind-dev` 插件服务 `.cache/pagefind`。切语言时 `app.vue` 会 `await nextTick()` 等 `<html lang>` 更新后再 `pagefindReinit()`（Pagefind 按该属性选语言索引）。
- **验证索引内容**：`pagefind-entry.json` 的 `languages.*.page_count` 应为该语言实际索引页数；`fragment/*.pf_fragment` 是 gzip + `pagefind_dcd` JSON，可直接解包检查正文有没有混入保留区/导航文本（如 `Navigation.`、`Recent posts`、`--:--:--`）。
- 改样式只动 `app/components/SearchModal.vue`。状态经 `useSearch()` 取：`s.query`/`s.results`/`s.loading`/`s.error`/`s.activeIndex`/`s.open()`/`s.close()`/`s.toggle()`/`s.clear()`。

## OG 图（站点与博客预览图）

两张，都指向 R2 静态对象（`r2.kuriyona.com` 后的路径即对象键）：**站点默认图** `img/site/og/default.png`（`app/app.vue` 的 `ogImage`，除博客详情页外全站）与**博客详情页图** `img/site/og/<slug>/<lang>.png`（`app/pages/blog/[slug].vue` 按 slug + 语言覆盖）。

```bash
bun scripts/download-fonts.ts           # 一次性：字体 → .cache/fonts（--force 重下）
bun scripts/generate-blog-og.ts         # 站点默认图 → .cache/og/default.{svg,png}
bun scripts/generate-blog-og.ts <slug>  # 文章图 → .cache/og/<slug>/<lang>.{svg,png}
bun scripts/upload-blog-og.ts           # 上传 → img/site/og/...（--dry-run 只打印键）
```

- **渲染**：`@kuriyona/svg-toolkit` 排版成 SVG，`@resvg/resvg-js` 光栅化（不再用 sharp）；`loadSystemFonts: false`，只加载 `.cache/fonts` 里显式列出的字体，出图结果与本机装了哪些字体无关。
- **字体**：文本优先 `Maple Mono`（拉丁），非英文再挂 `Noto Sans SC/TC/JP` 其一（resvg 逐字回退）；Regular 与 Bold 都要（版式用 `font-weight: bold`，缺 Bold 会变细）。字体只放 `.cache/fonts`（gitignored）。
- 默认图两行居中：svg-toolkit 不做文本测量（文本节点宽度算 0），靠 `alignItems: center` + `textAnchor: 'middle'` 落在中轴。
- **meta 约定**（`app/app.vue` 站点级 + `app/pages/blog/[slug].vue` 覆盖）：`og:url` 必须绝对地址；`twitter:*` 与 `og:*` 显式写同一组值（不依赖爬虫的 og 回退）；站点描述取自 i18n `about.description`（四语都要填，空串会让 `og:description` 为空）。
- 改版式或字体后要**重新出图并上传**；R2 上旧的 `static/og/blog/**`、`static/intro/intro-*.png` 是历史路径，站点已不再引用。

## Project Structure

```
Kuriyona.com/
├── app/                        Nuxt 应用（核心代码）
│   ├── app.vue                 根组件：背景 + NuxtLayout/NuxtPage + AppBar + ToastHost + i18n locale watcher
│   ├── app.config.ts           defineAppConfig：导航（nav + aboutNav）+ 友链（main/others/links），合并 config.json
│   ├── config.json             个人信息（tech_stack/languages/info/contact/games/device…）
│   ├── assets/css/             main.css（@import 汇总）· fonts.css（字体变量：Inter + Source Han Sans CN/TW/JP + Maple Mono + Resource Han Rounded CN/TW/JP，不含图标字体）· base.css（设计令牌/主题/版式宽度令牌/滚动条/光标）· surface.css（.k-surface/.k-glass/.k-interactive/.k-scrim）· utilities.css（.link/.trans-*）
│   ├── assets/icons/           背景平铺图案 SVG（白色填充；勿再给 <pattern> 内 <image> 加 CSS filter，iOS WebKit 下整层不渲染）
│   ├── components/             自动导入：AppPage（页面容器 + 两侧保留区）· AppBar（顶栏 + 搜索 + 复合音乐按钮 + AppMenu）· AppBackground（图标平铺 + 高亮点）· BlogTopBar / BlogToc（博客浮动顶栏 / 目录）· MusicPlayer / MusicControls / MusicPanel · SearchModal · TimelineList · ToastHost · KTurnstile · KSurface · KIcon · card/（About 卡片，含 CardCityMap）· reserve/（ReserveClock/ReserveNav/ReserveArticles）· K* 组件（见下表）
│   ├── composables/            自动导入：useSearch · useToast · useNav · useCity · useMusic（播放器单例，跨路由不中断；播放地址直连网易 outer，不走后端）· useCodeCopy · useHeadingAnchor · useTimelineLink · useSurfaceLevel · usePageScrollLock · useCloudflareStatus · idbCache · cfn
│   ├── layouts/                default.vue（透传）/ admin.vue（管理页共用壳：宽屏左侧 sticky 竖导航，窄屏顶部 KSelect）
│   ├── pages/                  路由页面（见下表）：index · about/trans · about/devices · blog/{index,[slug]} · timeline · friends-and-links · ask-box/{index,ask} · admin/*
│   ├── stores/main.ts          Pinia：JWT（Turnstile 验证后存）
│   ├── utils/                  api.ts（ky 的 fetchApi，`beforeRequest` 每请求注入 X-Auth-Key）· time.ts（dayjs 封装 + setLocale）· i18n.ts · emoji.ts · console.ts · pagefind.ts · icons.gen.ts（生成，勿手改）· weatherIcon.ts · highlightMotion.ts
│   ├── scripts/                客户端共享类型：i18n.ts（重导出 useI18n）· cityTypes.ts · musicTypes.ts
│   ├── content/blog/<lang>/    博客 Markdown 源（zh-Hans/zh-Hant/en/ja）
│   └── data/devices.json       设备配置数据（/about/devices；`primary` 主设备光晕 + 「主要设备」徽标，`retired` 卡片降不透明度 + 「不再使用」徽标）
├── server/                     Nitro API：utils.ts（markdown-exit + Shiki 高亮 + TOC + 外链图标；读 app/content/blog/，非 @nuxt/content）· api/articles.ts · api/articles/[slug].ts
├── scripts/                    Bun 独立脚本：generate-blog-og.ts · upload-blog-og.ts · download-fonts.ts · check-contrast.ts（改颜色令牌后跑）· gen-icons.ts · generate-zh-hant.ts · sort-i18n.ts
├── backend/                    后端子包（自带 lockfile，非 workspace 成员）：Cloudflare Workers + Hono + D1
│   ├── index.ts                Worker 入口（导出 Hono app，挂 /api/*；不做 listen/migrate）
│   ├── src/                    env.ts · city-map.ts · amap.ts · db/schema.ts（ask_table）· plugin/auth.ts · router/{ask-box,r2,city,cache,music} · utils.ts
│   ├── drizzle/                SQLite 迁移（入库，wrangler 消费）
│   └── docs/                   后端文档（development/deployment/city-map/cache-purge）
├── i18n/locales/               zh-Hans.json（默认）/ zh-Hant.json / en.json / ja.json
├── public/                     robots.txt · _headers（Workers 静态响应头）· _redirects（`/links`→`/friends-and-links` 301、`/about/as-mtf`→`/about/trans` 301，各含语言前缀）
├── .cache/                     gitignored 产物：og/ · pagefind/ · fonts/ · map{,-cache}/
├── nuxt.config.ts              模块 · i18n · nitro 输出 dist · pagefind-dev 插件 · build.transpile:['reka-ui'] · vite.optimizeDeps.include · GIT_HASH/BUILD_TIME
├── wrangler.jsonc              根 Worker：main=backend/index.ts · assets=./dist · run_worker_first:["/api","/api/*"] · D1 binding DB · KV binding STATUS_KV
├── package.json                依赖与脚本（无 lint/typecheck/test；含 api:* 与 deploy）
└── .dev.vars.example · pnpm-workspace.yaml · vite-env.d.ts · .oxfmtrc.json
```

### 自定义 UI 组件（K\*）

| 组件            | 用途                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `KCard`         | 表面卡片容器（可选 title；`level`/`glass` 透传 KSurface）                                                             |
| `KSurface`      | 表面原语（`as`/`level`/`glass`；层级由嵌套自动推导、上限 3、可手动覆盖；输出 `.k-surface` + `data-level`）            |
| `KButton`       | 控件按钮（半透明 `--color-control-bg` + 描边，round/text/block）                                                      |
| `KIcon`         | 图标（Iconify；`name` 为 `prefix:name` 全名，尺寸用字号类，单色 currentColor；无 `label` 时按装饰性处理）             |
| `KIconButton`   | 圆形图标按钮（icon 全名、size sm/base/md/lg/xl；无 label 时用图标名末段做 aria-label）                                |
| `KCardLink`     | 链接卡片（可选 img/desc/icon/new，默认图标 `material-symbols:open-in-new` / `arrow-forward`）                         |
| `KPersonCard`   | 重要的人卡片（relationKey 关系徽标 + name/desc；links 为控件胶囊 + simple-icons 图标）                                |
| `KNavCard`      | 导航 / 友链矩形卡片（title/desc/trans，首页 aboutNav 与友链共用）                                                     |
| `KInput`        | 输入框 / textarea（clearable/disabled/maxlength）                                                                     |
| `KSelect`       | 下拉选择（封装 Reka `Select`；触发器对齐 KInput、弹层对齐 KMenu）                                                     |
| `KSwitch`       | 开关（封装 Reka `SwitchRoot`/`SwitchThumb`）                                                                          |
| `KDivider`      | 分隔线（封装 Reka `Separator`，horizontal/vertical；`label` 在左端渲染小字标签，仅 horizontal）                       |
| `KBadge`        | 半透明小徽标（text-xs 胶囊；`variant="muted"` 灰色）；关系 / 标签 / 主要设备 / 不再使用                               |
| `MusicPlayer`   | 左保留区常驻播放器（`KCard` + `MusicControls`，宽视口才出现）                                                         |
| `MusicControls` | 播放器主体（封面/歌名/当前歌词行含翻译/进度条/上下首/曲目列表）；`MusicPlayer`（保留区）与 `MusicPanel`（窄视口）共用 |
| `MusicPanel`    | 悬浮音乐面板（`KDialog` + `MusicControls`，顶栏复合音乐按钮打开，仅 `reserve:` 断点以下）                             |
| `KMarkdown`     | Markdown 渲染（markdown-exit + github-markdown-css）                                                                  |
| `KTable`        | 表格布局（th 左对齐 / td 右对齐）                                                                                     |
| `KMenu`         | 下拉菜单（封装 Reka `DropdownMenu`；当前无使用处）                                                                    |
| `KDialog`       | 弹窗（封装 Reka `Dialog`；遮罩/Esc/关闭按钮，KCard + KIconButton 组合）                                               |

### 页面路由总览

| 路由                        | 文件                                | 说明                                                                                                                               |
| --------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/`                         | `pages/index.vue`                   | 半屏 Hero + 关于内容（右侧常驻城市卡片，窄屏两行）+ 生日/MBTI/最爱的颜色、技能、导航卡、社交与联系方式（含 data-pagefind-body）               |
| `/about/trans`              | `pages/about/trans/index.vue`       | 作为一个 MtF（半屏 hero + 关于我卡片 + 跨性别科普问答（流式输出）+ 性别探索计数 + 性别认同历程 + 资源链接，含 data-pagefind-body） |
| `/about/devices`            | `pages/about/devices/index.vue`     | 设备配置（在役设备在前，`retired` 的旧设备灰度置后；含 data-pagefind-body）                                                         |
| `/blog`                     | `pages/blog/index.vue`              | 文章列表（按语言过滤；卡片整体可点，各语言标签是 button，只切换文章正文语言、不切换站点语言，也不产生可爬的 `?lang` 链接）          |
| `/blog/:slug`               | `pages/blog/[slug].vue`             | 文章详情（多语言 + 浮动顶栏 + 宽屏左侧保留区目录 + 阅读进度高亮；`?lang=` 只切换文章版本，站点 UI 语言不变）                          |
| `/timeline`                 | `pages/timeline/index.vue`          | 时间线（倒序，条目描述保持中文，可选 link 跳转，含 data-pagefind-body）                                                              |
| `/friends-and-links`        | `pages/friends-and-links/index.vue` | 友链页（最重要的人 / 朋友们 / 友链 / 交换）                                                                                        |
| `/ask-box` · `/ask-box/ask` | `pages/ask-box/*`                   | 提问箱列表 · 提交提问（Turnstile 验证）                                                                                            |
| `/admin`                    | `pages/admin/index.vue`             | 面板主页：密钥校验 + 管理入口                                                                                                      |
| `/admin/r2`                 | `pages/admin/r2.vue`                | 文件上传（拖拽/粘贴）+ 前缀/虚拟目录浏览                                                                                           |
| `/admin/ask-box`            | `pages/admin/ask-box.vue`           | 提问箱审核（回答/公开/删除）                                                                                                       |
| `/admin/city`               | `pages/admin/city.vue`              | 城市地图：浏览器出图 → 直传 R2 → 写 KV 城市配置（配 `@kuriyona/amap-box`；高亮取 `--color-theme`，改主题色需重出图）               |
| `/admin/cache`              | `pages/admin/cache.vue`             | 缓存清除：选 zone + URL / 主机名 / 标签 / 前缀四种方式清 Cloudflare 边缘缓存                                                       |
| `/admin/music`              | `pages/admin/music.vue`             | 音乐缓存：刷新歌单 / 全部歌词的 Worker 侧 KV 缓存                                                                                  |

### API 概览

| 端点                                          | 来源     | 说明                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/articles`                           | server/  | 文章元信息列表（无 content）                                                                                                                                                                                                                                                                                                                                                  |
| `GET /api/articles/:slug`                     | server/  | 指定文章（所有语言版本）                                                                                                                                                                                                                                                                                                                                                      |
| `GET /api/city`                               | backend/ | `{ resident: { name, adcode, map, weather }, current: { name, adcode, map } }`，读 KV `city:maps`，缺失/坏值回退杭州；`map` 指向 R2 静态 SVG                                                                                                                                                                                                                                  |
| `GET /api/city/amap?<参数>`                   | backend/ | 高德代理（管理端出图用，需 `X-Auth-Key`）：注入 `AMAP_KEY`，KV 缓存 30 天；`?nocache=1` 只绕过读取                                                                                                                                                                                                                                                                            |
| `GET /api/city/map/upload-url?adcode=`        | backend/ | 返回 R2 预签名 PUT 地址，键 `img/site/map/<adcode>.svg`                                                                                                                                                                                                                                                                                                                       |
| `PUT /api/city`                               | backend/ | 写 KV `city:maps`（只存 `{ name, adcode }`）                                                                                                                                                                                                                                                                                                                                  |
| `/api/ask-box`、`/api/r2/*`、`/api/turnstile` | backend/ | Worker（Hono），经 `fetchApi`（前缀 `/api`）调用                                                                                                                                                                                                                                                                                                                              |
| `PUT /api/ask-box/admin/:id/answer`           | backend/ | body `{ answer }`                                                                                                                                                                                                                                                                                                                                                             |
| `GET /api/r2/list?prefix=&delimiter=`         | backend/ | `{ prefix, folders, files, truncated }`，浏览根固定 `static/`（`files[].key` 为含 `static/` 的完整键）                                                                                                                                                                                                                                                                        |
| `GET /api/music/playlist`                     | backend/ | `{ tracks: [{ id, name, artists[], coverUrl, duration }] }`；缓存 KV 6h + 浏览器 1h（**播放地址不经后端**，前端直接拼 `https://music.163.com/song/media/outer/url?id=<id>.mp3`）                                                                                                                                                                                              |
| `GET /api/music/lyric?id=`                    | backend/ | `{ lines: [{ time, text, translation? }] }`（`time` 毫秒，`translation` 逐行翻译）；KV **永久**缓存 `cache:music:lyric:<id>`，响应 `immutable`；无歌词也缓存空数组；缺 `id` 返回 400。**已知上游解析 bug**（未修）：部分歌曲上游用 `[mm:ss:ff]` 时间戳、cecilia 不认，本仓歌单 4 首有 2 首只剩署名两行，见 [Kuriyona/Cecilia#2](https://github.com/Kuriyona/Cecilia/issues/2) |
| `POST /api/music/cache/purge`                 | backend/ | body `{ target: 'playlist'\|'lyric' }` → 删对应 KV，返回 `{ success, target, deleted }`（只清 Worker 侧；浏览器/边缘旧响应另走 `/cache/purge`）                                                                                                                                                                                                                               |
| `GET /api/cache/zones`                        | backend/ | 列出 `CF_API_TOKEN` 可见的 zone（管理端清缓存下拉用）                                                                                                                                                                                                                                                                                                                         |
| `POST /api/cache/purge`                       | backend/ | body `{ zone, type, targets[] }` → `POST /zones/{id}/purge_cache`；`type` = url/hostname/tag/prefix；单次上限 100 条                                                                                                                                                                                                                                                          |

## Key Conventions

- **Path aliases**: `@/` 与 `~/` 均可用，混用无碍。
- **I18n**: `app/scripts/i18n.ts` 重导出 vue-i18n 的 `useI18n`；模板也直接用 `$t()`。
- **API client**: `app/utils/api.ts` 导出 ky 的 `fetchApi`，自动注入 `X-Auth-Key`（来自 `localStorage.API_KEY`）。开发 host `https://kuriyona-api.localhost/api`，生产同源 `/api`。
- **Admin auth**: `useStorage('API_KEY')`，`fetchApi` 的 `beforeRequest` 每请求现读（改密钥即时生效）。**必须用 `X-Auth-Key` 头，不能用 `Authorization`** —— 后者是 JWT 通道，而公开接口也走同一个客户端。
- **本地开发（portless）**: `pnpm dev` / `pnpm api:dev` 经 [portless](https://www.npmjs.com/package/portless)（全局安装，需 Node ≥ 24）提供 HTTPS 域名：前端 `https://kuriyona.localhost`、API `https://kuriyona-api.localhost`。首次 `portless trust`；代理默认 443（需 sudo，否则 `portless proxy start --port 1355 --https`，URL 带 `:1355`）。配置全在文件里：前端 app 名 = 根 `package.json` 的 `"portless": "kuriyona"`，API 名 = `api:dev` 里的 `--name kuriyona-api`，TLD = 两脚本首部内联的 `PORTLESS_TLD=localhost`（**两处成对，改一处必须改另一处**；内联是为不受环境变量影响，`pnpm run` 不加载 `.env`）。`api:dev` 里 `--app-port 62802` 与 `wrangler dev --port 62802` 也成对（Nuxt 读 portless 注入的 `PORT` 所以 `dev` 不写端口，wrangler 不读，必须显式指定）。不经 portless：`pnpm dev:plain`（3000）/ `pnpm api:run`（62802）/ `PORTLESS=0 pnpm dev`。
- **Styling**: Tailwind CSS v4 via `@import 'tailwindcss'` in `main.css`，无 `tailwind.config.*`。`nuxt.config.ts` 的 `vite.ssr.noExternal: ['tailwindcss']` 是 Vite 8 回归的 workaround，**必须保留**（否则 SSR build 把裸 `@import 'tailwindcss'` 当外部依赖返回原 specifier，postcss-import 打开 `<root>/tailwindcss` 报 `ENOENT`）。上游 vitejs/vite#23096（修复 PR #23099），修复发布后可移除。
- **字体（fonts-cdn）**: 文本字体全部来自 `fonts-cdn.sharpdotnut.com`，**不再用 Google Fonts CDN**。`app/assets/css/fonts.css` 定义 `--font-family`（`Inter` + `Source Han Sans CN/TW/JP`，按 `:lang()` 切地区字形）与 `--font-family-monos`（`Maple Mono` + `Resource Han Rounded CN/TW/JP` 作 CJK 回退）；`app/app.vue` 用 `useHead` 按当前 locale 只注入 Inter、MapleMono 与该地区的 Source Han Sans / Resource Han Rounded CSS（一个家族一个 CSS，分片由 `unicode-range` 自动按需加载）。博客正文另带 `:lang="article.lang"`，正文语言与站点语言不一致时仍用正确的地区字形。新增字体家族需同时确认该 CDN 的 `.woff2` 带 CORS 头。
- **视觉令牌（颜色 / 层级 / 毛玻璃）**: 颜色 / 层级只能用 `app/assets/css/base.css` 的 `--color-*`/`--card-*`/`--shadow-*` 令牌 + `surface.css` 的 4 个类（`.k-surface`/`.k-glass`/`.k-interactive`/`.k-scrim`）；卡片层级由 `KSurface`/`KCard` 的 `level`（或嵌套自动推导，上限 3）落到 `data-level`。禁止 `bg-black/*`、`bg-white/*`、`text-white/*`、`backdrop-*` 等一次性透明度 / 模糊类（`.k-glass`/`.k-scrim` 是唯一允许 `backdrop-filter` 处）。控件用 `--color-control-bg`/`--color-control-border`（半透明，叠任何表面都成立；会抬亮表面，控件内文本只用 `--color-text-1`/`-2`，不用 `text-3`/`-4`）。改颜色令牌后跑 `bun scripts/check-contrast.ts`。**别在组件里写 `cursor-*`**：全站光标在 `base.css` 用**未分层**规则给（`*` 箭头、`a`/`button`/`[role=slider]` 手型），优先级高于 Tailwind 的 `@layer utilities`，写了也是死代码 —— 要手型就把选择器加进那条规则。跨性别旗配色（`--color-trans-*`）与 `utilities.css` 的 `.trans-*` 只做旗面装饰，不承载正文、不参与层级、不纳入对比度校验。
- **最外层容器只用 `overflow-x: clip`（`app.vue`）**: 不要写 `overflow-x: hidden` —— 单轴 `hidden` 会把另一轴的 `visible` 算成 `auto`，这层就变成「自己不滚动却当了所有后代的滚动容器」，其内 `position: sticky`（保留区栏位、管理端侧栏导航）全部失效。`clip` 同样裁切、同样不传播溢出，但不建滚动容器。
- **版式宽度（正文 / 保留区）**: 正文列 `--content-width`（960px）、两侧保留区 `--reserve-width`（240px），定义在 `base.css` 的 `body`。保留区由 `AppPage.vue` 渲染，仅在视口容得下（960 + 240×2 = 1440，留余量取 1500px）时出现，断点写成 Tailwind 自定义变体 `reserve:`（`@custom-variant`，定义在 `main.css`）—— 改宽度令牌必须同步重算该断点。相关处（AppPage 两侧 aside、博客内联目录卡片、BlogTopBar 目录按钮）都用 `reserve:`，别写 `min-[...px]:` 字面量。`--app-bar-height` 定义在 `base.css` 的 `:root`，同时用于正文 `mt-`、保留区 sticky `top` 与 `html` 的 `scroll-padding-top`（锚点目标停在顶栏下方并留 4rem）。
- **半屏 hero（`--hero-height` / `--reserve-hero-offset`）**: 页面首块为半屏 hero 时用 `min-h-(--hero-height)`（令牌在 `base.css`，当前 50svh）并给 `<AppPage hero>`。**两侧保留区**随之 `mt-(--reserve-hero-offset)`（= `--hero-height` + `1rem`），使栏内首卡跟在 hero 下方、滚过后再吸顶；**两栏 `:class` 写法必须一致**（只加一侧会让另一侧压在 hero 上）。那 `1rem` 是正文列的 `gap-4`：hero 与下一块之间**只允许这一个列间距**，所以 **hero 块别写 `mb-*`、紧随其后那块别写 `mt-*`**（写了偏移失准）。实现是给 sticky 元素加 `margin-top`，**不要**用滚动监听改 `top`，也**不要**把偏移加到 aside 内部 div（会把卡片推进栏内固定高、`overflow-y: auto` 的滚动区）。`.reserve` 的 `padding-top: 6rem` = 正文列 `my-20`(5rem) + `p-4`(1rem)，保证两栏首卡齐平。前提：hero 是内容首块且高度就是该令牌（`min-h` 是下限）。
- **动画（GSAP）**: 唯一使用处 `pages/about/trans/index.vue`。`gsap` 与 `gsap/ScrollTrigger` **静态 import**（编译进该页 chunk），`registerPlugin` 与 `gsap.matchMedia(...)` 放 `onMounted`；**`onUnmounted` 必须在 setup 同步阶段注册**（放进 `onMounted` 的 async 回调会因失去活动组件实例而失效，GC 掉整个 MatchMedia 上下文）。补间初值取「最终值」而非 0，SSR / 无 JS 时渲染真实数值（无需 `ClientOnly`）；代价是 JS 接管前先显示最终值再滚上去。
- **图标（Iconify）**: 只用 `material-symbols`（Material Symbols Outlined）与 `simple-icons` 两个集合，**访客不加载任何第三方图标资源**（已移除 Google Fonts 图标字体与 `cdn.simpleicons.org`）。用 `<KIcon name="material-symbols:close" class="text-lg" />`，尺寸一律用字号类（svg 为 1em×1em，别写 `w-5 h-5`）、单色随 `currentColor`；`KIconButton` 的 `icon` 也是完整名。图标名必须是 `prefix:name` 的**完整字面量**（小写 kebab-case），数据层（`config.json`/`app.config.ts`）也存全名，禁止拼接。`scripts/gen-icons.ts` 扫源码与数据 → `app/utils/icons.gen.ts`（只注册用到的图标），由 `dev`/`gen:icons`/`generate` 前置执行；名字拼错 / 不存在 / 动态拼接都会**构建失败**；生成文件把 `@iconify/vue` 的远程下载通路替换为 reject，漏注册也不会打 Iconify API。加图标 = 在调用点写出即可。天气图标同理经 `app/utils/weatherIcon.ts` 映射（不再引入 `qweather-icons` 字体）。
- **UI components**: `K*` 组件在 `app/components/`，Tailwind 样式；交互组件（KDialog/KSwitch/KDivider/KMenu）基于 Reka UI，保留 `K*` 公共 API。Toast 用 `useToast` + `ToastHost`（替代 Varlet Snackbar）。`KCardLink` 根 `<a>` 的 `block` 类**必须保留**：内层 `KCard` 带 `h-full`，`<a>` 退回 `display:inline` 会在普通卡片内部触发 block-in-inline 拆分，百分比高度形成循环依赖 → 内层卡溢出父卡底边并压住边框。
- **Reka UI (SSR)**: `nuxt.config.ts` 的 `build.transpile: ['reka-ui']` **必须保留**。否则生产 SSR 下 reka-ui 被 external，与 Nuxt 打包的 Vue 形成两份 `@vue/runtime-core`，async/Suspense 页面渲染 `renderSlot` 时抛 `Cannot read properties of null (reading 'ce')`（`pnpm generate` 报 blog 详情页 500）。
- **Env vars**: Worker 从 `c.env` 读，每请求校验必需项（缺失返回 500 `[config] 缺少必需的环境变量: <KEY>`）。本地模板 `.dev.vars.example`（复制为 `.dev.vars`，gitignored），生产 `wrangler secret put`。必需 7 项：`JWT_SECRET`、`AUTH_KEY`、`TURNSTILE_SECRET_KEY`、`ENDPOINT`、`ACCESS_KEY_ID`、`SECRET_ACCESS_KEY`、`BUCKET_NAME`（`DB`/`STATUS_KV` 由 binding 提供）。可选：`AMAP_KEY`（城市地图出图取边界 + 查天气中心点；缺失时相关端点 500 / 回退默认城市中心点）、`CF_API_TOKEN`（`/admin/cache`，需 **Zone:Read + Cache Purge**；缺失时 `/cache/*` 报 500）。
- **`dist/` 会被 dev 启动清空**: `nitro.output.publicDir = 'dist'`（同时是 wrangler 的 `assets.directory` 与 SSG 输出），Nitro `prepare()` 每次 dev 启动 `rm -rf` 它。所以**别把需跨 dev 重启保留的产物放 `dist/`**（PageFind 索引因此落 `.cache/pagefind`）。
- **`package.json` 的 `"type": "module"`**: 消除 `nuxt.config.ts` 触发的 `MODULE_TYPELESS_PACKAGE_JSON` 警告（Nuxt dev 会把它计入 `✕ 1 error`）。
- **Compile-time globals**: `GIT_HASH` / `BUILD_TIME` 在 `nuxt.config.ts` `define`（声明于 `vite-env.d.ts`）。
- **Dayjs locale sync**: `app/utils/time.ts` 的 `setLocale(locale)` 需在 i18n locale 变化时调用（`app.vue` watcher 已做）；另提供 `formatRelativeTime(time)`。
- **I18n key 约定**: 全部 kebab-case（如 `blog.not-found`），全局通用文本归 `global.*`；4 个语言文件 key 集合必须一致，改动后 `pnpm fmt` 触发 `sort-i18n.ts` 排序。
- **博客 AI 标注（frontmatter）**: `aiGenerated: true` 表示含 AI 生成内容；`aiReview` 仅在含 AI 内容时填写，取值 `粗略核对` / `基本核对` / `充分核对`；`aiTranslated: true` 表示该语言版本为 AI 翻译。字段经 `server/utils.ts` 白名单校验后透传，缺省为 `false` / 空；博客列表与详情页按需显示对应徽标。
- **文章语言与站点语言解耦**: 博客详情用 `?lang=<code>` 选择正文版本，**不调用 `setLocale`**；列表页与详情页的语言切换都用 `<button>`（不是链接），路径固定为当前站点 locale、推送 `?lang` query，**静态 HTML 里不能出现带 `?lang` 的 `<a>`** —— 否则搜索引擎会把这些副本 URL 一并抓取（sitemap 只列正式 locale 路由，并已带 hreflang）。详情页语言选择器只列出该文章实际存在的版本，canonical 指向所选语言版本的正式路由；切换语言后需重新初始化代码块复制、标题锚点与目录滚动监听。
- **zh-Hant 文章由 zh-Hans 生成**: `zh-Hant/` 由 `pnpm gen:zh-hant [slug...]` 从 `zh-Hans/` 用 OpenCC（`cn` → `t`）转换生成，生成结果直接提交；不要手改 `zh-Hant/`（会被覆盖）。行内代码原样保留；frontmatter 的 `date` / `edit` / `aiGenerated` / `aiReview` 保持原值（`aiReview` 是枚举标识，不能转成繁體）。
- **`app/config.json`**: 个人信息（tech_stack/languages/info/contact/games/device），由 `app/app.config.ts` 合并进 `useAppConfig()`；`languages[].name` 是硬编码标签（首页技能卡不随语言切换，另配 `icon` 缩写徽标）。
- **`app/app.config.ts`**: `nav`（抽屉/右栏 ReserveNav/关于页数据源）+ `aboutNav`（`onAbout` 过滤结果）。**`nav` 顺序即各处展示顺序**；`shortTitleKey`（如 `blog.short-title`）供单行位置，缺省回退 `titleKey`；`timeline` 条目可带 `link`（跳转）与 `tag`（展示徽标）—— `/about/trans` 的「性别认同历程」按 `tag === '性别认同'` 过滤同一份数据（改文案会同时改该区块，属有意耦合）。
- **城市地图与天气**: `GET /api/city` 的 `resident`/`current` 读 KV `city:maps`，缺失/坏值回退杭州 `330100`；`map` 指向 R2 静态 SVG `img/site/map/<adcode>.svg`（KV 只存 `{ name, adcode }`）。**出图跑在管理端浏览器**（`/admin/city` 动态 `import('@kuriyona/amap-box')`）：Worker 只做高德代理（注入 `AMAP_KEY` + KV 缓存 30 天）、签发 R2 上传地址、写 KV 城市配置，CPU ≈ 0（Worker 内出图 CPU ~0.9s，超 Free 10ms 上限两个数量级）。首页「关于我」右侧常驻城市卡片复用同一份 `resident`（`useCity()`），预渲染阶段拿不到数据。`resident.weather`：`cityCenter()` 取高德中心点（KV `amap:center:<adcode>`，30 天）→ 以 `location=经度,纬度` 查 QWeather（`cache:weather:<adcode>`，30 分钟）。详见 `backend/docs/city-map.md`。
- **缓存清除（Cloudflare）**: `/admin/cache` → `backend/src/router/cache.ts` 两个端点（需 `X-Auth-Key`）：`GET /api/cache/zones`（`CF_API_TOKEN` 列 zone）、`POST /api/cache/purge`（转发 `purge_cache`，type = url/hostname/tag/prefix，单次上限 100 条）。token 只存 Worker（需 **Zone:Read + Cache Purge**）。返回 200 只代表请求被收下，是否真清掉看 `CF-Cache-Status`。起因：R2 对象带 `cache-control: max-age=86400`，换图后边缘最长 24h 才过期。详见 `backend/docs/cache-purge.md`。
- **管理页**: 6 个受保护页（`/admin` 及 `r2`/`ask-box`/`city`/`cache`/`music`）共用 `layouts/admin.vue`；失败文案统一经 `app/utils/adminError.ts`（`adminErrorText`，`adminErrorMessage` 优先用响应体 `message`）。
- **No tests or CI**.

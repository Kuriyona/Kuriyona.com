# Kuriyona.com

（本 README.md 由 AI Agent 生成）

Kuriyona 的个人网站，基于 **Nuxt 4**（SSR）+ **Elysia**（Bun 后端）。

## 技术栈

| 层 | 选型 |
|---|---|
| 运行环境 | **Bun**（非 Node.js） |
| 包管理 | **pnpm** |
| 前端 | Nuxt 4 + Vue 3 + Tailwind CSS v4 |
| UI 组件库 | Varlet UI |
| 动画 | GSAP |
| 国际化 | `@nuxtjs/i18n`（zh / en，no_prefix 策略） |
| 后端 | Elysia，端口 62802 |
| 存储 | Cloudflare R2（S3 兼容，AWS SDK） |
| 格式化 | oxfmt |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动 Nuxt 前端开发服务器（热重载）
pnpm dev

# 启动后端 API 服务器
pnpm server        # 普通模式
pnpm server-dev    # 热重载模式

# 构建
pnpm build         # 生产构建
pnpm server-dist   # 后端打包为独立文件

# 格式化代码
pnpm fmt
```

## 项目结构

```
kuriyona.com/
├── app/                    # Nuxt 前端（页面、组件、状态管理）
│   ├── components/         # 公共组件
│   ├── pages/              # 路由页面
│   │   └── admin/          # 管理后台（需 API Key 验证）
│   ├── stores/             # Pinia 状态管理
│   ├── utils/              # 工具函数
│   ├── scripts/            # 脚本（i18n 导出）
│   ├── assets/             # 静态资源
│   └── config.json         # 联系信息与友链（内容源）
├── server/                 # Elysia 后端 API
│   ├── index.ts            # 入口
│   ├── image.ts            # 图片上传（R2 预签名 URL）
│   └── weather.ts          # 天气代理
├── i18n/locales/           # 多语言翻译文件
└── nuxt.config.ts          # Nuxt 配置
```

## 功能

- 个人主页与联系信息展示
- 中英文双语支持
- 实时天气显示（通过后端代理）
- 友链页面
- 后台图片上传管理（R2 存储，需 API Key）
- 深色主题

## 许可证

MIT

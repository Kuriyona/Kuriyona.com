import tailwindcss from '@tailwindcss/vite';
import child_process from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, extname } from 'path';

const gitHash = child_process.execSync('git rev-parse --short HEAD').toString().trim();

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  build: {
    transpile: ['reka-ui'],
  },
  ssr: true,
  modules: ['@vueuse/nuxt', '@nuxtjs/i18n', '@nuxtjs/sitemap', '@pinia/nuxt'],
  nitro: {
    output: {
      dir: '.output',
      publicDir: 'dist',
    },
    prerender: {
      ignore: ['/admin/**'],
    },
  },
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: [
      { code: 'zh-Hans', name: '简体中文', file: 'zh-Hans.json' },
      { code: 'zh-Hant', name: '繁体中文', file: 'zh-Hant.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'ja', name: '日本語', file: 'ja.json' },
    ],
    strategy: 'prefix_except_default',
  },
  vite: {
    // Vite 8 回归：SSR build 会把裸 CSS `@import 'tailwindcss'` 当外部依赖返回原
    // specifier，postcss-import 于是尝试打开 <root>/tailwindcss 并 ENOENT。
    // 上游：vitejs/vite#23096（修复 PR vitejs/vite#23099）。修复发布后可移除。
    ssr: {
      noExternal: ['tailwindcss'],
    },
    plugins: [
      tailwindcss(),
      {
        name: 'pagefind-dev',
        configureServer(server) {
          // dist/ 不能放索引：Nitro 的 prepare() 在每次 dev 启动时 rm -rf output.publicDir
          // （本仓 publicDir = dist），索引会被删掉、/pagefind/* 全 404。
          // `pnpm index` 把索引写到 temp/pagefind，再复制一份到 dist/pagefind 供部署。
          const pagefindDir = resolve('temp/pagefind');
          const mimeMap: Record<string, string> = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.wasm': 'application/wasm',
            '.json': 'application/json',
            '.html': 'text/html',
            '.pf_meta': 'application/octet-stream',
            '.pf_fragment': 'application/octet-stream',
          };
          server.middlewares.use((req, res, next) => {
            const url = new URL(req.url || '/', 'http://localhost');
            if (!url.pathname.startsWith('/pagefind/')) return next();
            const filePath = resolve(pagefindDir, '.' + url.pathname.replace('/pagefind/', '/'));
            if (!filePath.startsWith(pagefindDir)) return next();
            if (!existsSync(filePath)) return next();
            const ext = extname(filePath);
            if (mimeMap[ext]) res.setHeader('Content-Type', mimeMap[ext]);
            res.statusCode = 200;
            res.end(readFileSync(filePath));
          });
        },
      },
    ],
    define: {
      GIT_HASH: JSON.stringify(gitHash),
      BUILD_TIME: JSON.stringify(new Date().toISOString()),
    },
    optimizeDeps: {
      include: [
        '@iconify/vue',
        'dayjs',
        'dayjs/plugin/duration',
        'dayjs/plugin/relativeTime',
        'dayjs/locale/zh-cn',
        'dayjs/locale/zh-tw',
        'dayjs/locale/ja',
        'ky',
        'es-toolkit',
        'markdown-exit',
        'vue-turnstile',
        'qrcode.vue',
        'gsap',
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  site: {
    url: 'https://kuriyona.com',
    name: "Kuriyona's Space",
  },
  sitemap: {
    exclude: ['/admin/**'],
  },
});

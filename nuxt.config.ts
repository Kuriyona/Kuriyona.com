import tailwindcss from '@tailwindcss/vite';
import child_process from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, extname } from 'path';

const gitHash = child_process.execSync('git rev-parse --short HEAD').toString().trim();

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  modules: ['@varlet/nuxt', '@vueuse/nuxt', '@nuxtjs/i18n', '@nuxtjs/sitemap', '@pinia/nuxt'],
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
    strategy: 'prefix_and_default',
  },
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'pagefind-dev',
        configureServer(server) {
          const pagefindDir = resolve('dist/pagefind');
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
        'dayjs',
        '@varlet/touch-emulator',
        'ky',
        'dayjs/plugin/duration',
        'vue-turnstile',
        'qrcode.vue',
        'gsap',
      ],
    },
  },
  css: ['./app/assets/css/main.css'],
  devtools: { enabled: true },
  site: {
    url: 'https://kuriyona.com',
    name: "Kuriyona's Space",
  },
  sitemap: {
    exclude: ['/admin/**'],
  },
});

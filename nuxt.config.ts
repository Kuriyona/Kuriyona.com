import tailwindcss from '@tailwindcss/vite';
import child_process from 'child_process';

const gitHash = child_process.execSync('git rev-parse --short HEAD').toString().trim();

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  modules: ['@varlet/nuxt', '@vueuse/nuxt', '@nuxtjs/i18n', '@nuxtjs/sitemap', '@pinia/nuxt'],
  nitro: {
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
    plugins: [tailwindcss()],
    define: {
      GIT_HASH: JSON.stringify(gitHash),
      BUILD_TIME: JSON.stringify(new Date().toISOString()),
    },
    optimizeDeps: {
      include: ['dayjs', '@varlet/touch-emulator', 'ky'],
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

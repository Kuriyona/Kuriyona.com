import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  modules: ['@varlet/nuxt', '@vueuse/nuxt', '@nuxtjs/i18n'],
  nitro: {
    prerender: {
      ignore: [],
    },
  },
  i18n: {
    defaultLocale: 'zh',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'zh', name: '中文', file: 'zh.json' },
    ],
    strategy: 'no_prefix',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  css: ['./app/assets/css/main.css'],
  devtools: { enabled: true },
});

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
    defaultLocale: 'zh-Hans',
    locales: [
      { code: 'zh-Hans', name: '简体中文', file: 'zh.json' },
      { code: 'zh-Hant', name: '繁体中文', file: 'zh-Hant.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'ja', name: '日本語', file: 'ja.json' },
    ],
    strategy: 'no_prefix',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  css: ['./app/assets/css/main.css'],
  devtools: { enabled: true },
  app: {
    head: {
      title: "Kuriyona's Space",
      htmlAttrs: {
        lang: 'zh',
      },
      meta: [{ name: 'description', content: 'Kuriyona 的个人网站' }],
      link: [{ rel: 'icon', href: 'https://r2.kuriyona.com/img/avatar/Avatar_256.png' }],
    },
  },
});

import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  modules: ['@varlet/nuxt', 'nuxt-elysia', '@vueuse/nuxt'],
  vite: {
    plugins: [tailwindcss()]
  },
  css: ['./app/assets/css/main.css'],
  devtools: { enabled: true },
  nitro: {
    preset: 'bun'
  }
});
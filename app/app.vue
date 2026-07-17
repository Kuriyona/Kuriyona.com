<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import { greet } from './utils/console.js';
import { reinitPagefind } from './utils/pagefind.ts';
const { locale } = useI18n();
const route = useRoute();
setLocale(locale.value);
watch(
  () => locale.value,
  async (newLocale) => {
    useHead({
      htmlAttrs: {
        lang: newLocale,
      },
    });
    setLocale(newLocale);
    if (import.meta.client) {
      await reinitPagefind();
    }
  },
);
useHead({
  htmlAttrs: {
    lang: locale.value,
  },
  meta: [{ name: 'description', content: $t('about.description') }],
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Kuriyona' Space` : "Kuriyona' Space";
  },
  link: [
    { rel: 'icon', type: 'image/png', href: 'https://r2.kuriyona.com/img/avatar/Avatar_256.png' },
  ],
});
useSeoMeta({
  ogImage: `https://r2.kuriyona.com/static/intro/intro-${locale.value.slice(0, 2) || 'en'}.png`,
  ogUrl: route.path,
  ogTitle: "Kuriyona' Space",
  ogDescription: $t('about.description'),
  twitterCard: 'summary_large_image',
});
onMounted(() => {
  greet();
});
</script>

<template>
  <div class="overflow-x-hidden">
    <AppBackground />
    <NuxtPage id="main" class="z-0" />
    <AppBar class="z-100" />
  </div>
</template>

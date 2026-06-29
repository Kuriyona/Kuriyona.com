<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import { greet } from './utils/console.js';
const { locale } = useI18n();
watch(
  () => locale.value,
  (newLocale) => {
    useHead({
      htmlAttrs: {
        lang: newLocale,
      },
    });
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
  ogTitle: "Kuriyona' Space",
  ogDescription: $t('about.description'),
  ogImage: `https://r2.kuriyona.com/static/intro/intro-${locale.value.slice(0, 2) || 'en'}.png`,
  ogUrl: 'https://kuriyona.com',
  twitterTitle: "Kuriyona' Space",
  twitterDescription: $t('about.description'),
  twitterImage: `https://r2.kuriyona.com/static/intro/intro-${locale.value.slice(0, 2) || 'en'}.png`,
  twitterCard: 'summary',
});
onMounted(() => {
  greet();
});
</script>

<template>
  <div class="overflow-x-hidden">
    <AppBar class="z-100" />
    <AppBackground />
    <NuxtPage id="main" class="z-0" />
  </div>
</template>

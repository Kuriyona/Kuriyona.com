<script setup lang="ts">
import AppBar from './components/AppBar.vue';
const { locale } = useI18n();
useHead({
  htmlAttrs: {
    lang: locale.value,
  },
  meta: [{ name: 'description', content: $t('about.description') }],
});
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Kuriyona' Space` : "Kuriyona' Space";
  },
});
</script>

<template>
  <div class="relative h-screen scroll-hidden">
    <div class="z-100 fixed top-0 w-screen px-4 py-2">
      <AppBar />
    </div>
    <Background />
    <main>
      <NuxtPage id="main" class="z-0 pt-[68px]" />
    </main>
  </div>
</template>

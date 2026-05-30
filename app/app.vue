<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import { greet } from './utils/console.js';
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
onMounted(() => {
  greet();
});
</script>

<template>
  <div>
    <AppBar class="z-100" />
    <AppBackground />
    <NuxtPage id="main" class="z-0" />
  </div>
</template>

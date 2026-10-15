<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import { greet } from './utils/console.js';
import { useSearch } from './composables/useSearch';
const { locale } = useI18n();
const route = useRoute();
setLocale(locale.value);
const { reinit } = useSearch();
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
      await reinit();
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
    {
      rel: 'icon',
      type: 'image/png',
      href: 'https://r2.kuriyona.com/img/avatar/Avatar_OLI_256.png',
    },
  ],
});
useSeoMeta({
  // 站点默认 OG 图（除博客详情页，那里按 slug/语言覆盖）；由 `bun scripts/generate-blog-og.ts` 出图
  ogImage: 'https://r2.kuriyona.com/img/site/og/default.png',
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
  <!-- overflow-x 用 clip 而非 hidden：hidden 会把 overflow-y 计算成 auto，
       这层就变成「永不滚动的滚动容器」，其内所有 position: sticky 全部失效
       （保留区栏位、管理端侧栏导航）。clip 只裁切、不建滚动容器。 -->
  <div class="overflow-x-clip">
    <AppBackground />
    <NuxtLayout>
      <NuxtPage id="main" class="z-0" />
    </NuxtLayout>
    <AppBar />
    <ToastHost />
  </div>
</template>

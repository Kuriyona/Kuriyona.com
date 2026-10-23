<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import { greet } from './utils/console.js';
import { useSearch } from './composables/useSearch';
const { locale } = useI18n();
const route = useRoute();
// 站点自身的绝对地址与分享卡片用图：og:url 要求绝对 URL，og/twitter 共用同一张图
const SITE_URL = 'https://kuriyona.com';
const SITE_TITLE = "Kuriyona' Space";
const SITE_OG_IMAGE = 'https://r2.kuriyona.com/img/site/og/default.png';
// 字体按语言按需加载：Inter 管拉丁，Source Han Sans 管正文 CJK，
// Resource Han Rounded 只作为 Maple Mono 的 CJK 回退
const FONT_CDN = 'https://fonts-cdn.sharpdotnut.com';
const FONT_BY_LOCALE: Record<string, { sans: string; rounded: string }> = {
  'zh-Hans': { sans: 'SourceHanSansCN', rounded: 'ResourceHanRoundedCN' },
  'zh-Hant': { sans: 'SourceHanSansTW', rounded: 'ResourceHanRoundedTW' },
  ja: { sans: 'SourceHanSansJP', rounded: 'ResourceHanRoundedJP' },
};
const fontFamilies = computed(() => {
  const cjk = FONT_BY_LOCALE[locale.value] ?? FONT_BY_LOCALE['zh-Hans'];
  return ['Inter', 'MapleMono', cjk.sans, cjk.rounded];
});
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
      href: 'https://r2.kuriyona.com/img/avatar/Avatar_256.png',
    },
  ],
});
// 每个家族一个 CSS，分片由 unicode-range 自动按需请求；切语言时只换 CJK 家族
useHead(
  computed(() => ({
    link: [
      { rel: 'preconnect', href: FONT_CDN, crossorigin: 'anonymous' },
      ...fontFamilies.value.map((family) => ({
        rel: 'stylesheet',
        href: `${FONT_CDN}/${family}/${family}.css`,
      })),
    ],
  })),
);
useSeoMeta({
  // 站点默认 OG 图（除博客详情页，那里按 slug/语言覆盖）；由 `bun scripts/generate-blog-og.ts` 出图
  ogImage: SITE_OG_IMAGE,
  // og:url 必须是绝对地址（OG 规范），不能只给 route.path
  ogUrl: `${SITE_URL}${route.path}`,
  ogTitle: SITE_TITLE,
  ogDescription: $t('about.description'),
  twitterCard: 'summary_large_image',
  // X 缺 twitter:* 时会回退 og:*，但各家爬虫回退规则不完全一致，显式写出更稳
  twitterImage: SITE_OG_IMAGE,
  twitterTitle: SITE_TITLE,
  twitterDescription: $t('about.description'),
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

<script setup lang="ts">
import type { ArticleMeta } from '~~/server/utils';

const { locale } = useI18n();

const { data: articlesData } = await useFetch(`/api/articles`);
const articles = computed(() =>
  (articlesData.value as ArticleMeta[]).filter((post) => {
    return post.lang.toLowerCase() == locale.value.toLowerCase();
  }),
);

// 同一 slug 的各语言版本；展示顺序按站内语言顺序（每种语言一个标签，标签即该语言版本的链接）
const LANG_ORDER = ['zh-Hans', 'zh-Hant', 'en', 'ja'];
const variantsBySlug = computed(() => {
  const map = new Map<string, ArticleMeta[]>();
  for (const post of (articlesData.value as ArticleMeta[]) ?? []) {
    const variants = map.get(post.slug) ?? [];
    if (!variants.some((variant) => variant.lang == post.lang)) variants.push(post);
    map.set(post.slug, variants);
  }
  return map;
});

function variantsOf(slug: string) {
  const rank = (lang: string) => {
    const index = LANG_ORDER.indexOf(lang);
    return index === -1 ? LANG_ORDER.length : index;
  };
  return (variantsBySlug.value.get(slug) ?? []).slice().sort((a, b) => rank(a.lang) - rank(b.lang));
}

useSeoMeta({ title: $t('blog.title') });
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/">
      <KIconButton icon="material-symbols:arrow-back" />
    </NuxtLinkLocale>
    <h1 class="text-2xl">{{ $t('blog.title') }}</h1>
    <p v-if="$t('blog.desc')" class="text-(--color-text-2)">{{ $t('blog.desc') }}</p>
    <KCard
      v-for="post in articles"
      :key="post.slug"
      class="k-interactive relative">
      <!-- 标题的伪元素铺满整张卡片，使卡片整体可点；语言标签是独立链接，需盖在其上 -->
      <h2 class="text-lg">
        <NuxtLinkLocale :to="`/blog/${post.slug}`" class="before:absolute before:inset-0">
          {{ post.title }}
        </NuxtLinkLocale>
      </h2>
      <p class="text-sm">{{ post.desc }}</p>
      <br />
      <p class="flex flex-wrap justify-between items-center gap-x-2 gap-y-1">
        <span class="flex max-w-full flex-none flex-wrap items-center gap-1">
          <KIcon name="material-symbols:translate" class="shrink-0" />
          <NuxtLinkLocale
            v-for="variant in variantsOf(post.slug)"
            :key="variant.lang"
            :locale="variant.lang"
            :to="`/blog/${variant.slug}`"
            class="relative z-1">
            <KBadge>{{ variant.lang.toUpperCase() }}</KBadge>
          </NuxtLinkLocale>
        </span>
        <span class="ml-auto flex max-w-full flex-none flex-wrap justify-end gap-2">
          <span class="flex items-center gap-1">
            <KIcon name="material-symbols:schedule" class="text-sm" />
            <span class="text-sm">{{
              $t('blog.reading-time', [Math.ceil(post.readingTime.minutes), post.readingTime.words])
            }}</span>
          </span>
          <span class="inline-flex items-center gap-1">
            <KIcon name="material-symbols:event" class="text-sm" />
            <span class="text-sm"> {{ formatDate(post.date) }}</span>
          </span>
          <span v-if="post.edit && post.edit != post.date" class="inline-flex items-center gap-1">
            <KIcon name="material-symbols:edit" class="text-sm" />
            <span class="text-sm"> {{ formatDate(post.date) }}</span>
          </span>
        </span>
      </p>
    </KCard>
  </AppPage>
</template>

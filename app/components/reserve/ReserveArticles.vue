<script setup lang="ts">
import type { ArticleMeta } from '~~/server/utils';

const { locale } = useI18n();

// 与博客列表页同 URL 的 useFetch（key 相同）会复用同一份数据，不额外发起请求
const { data: articlesData } = await useFetch('/api/articles');

// /api/articles 已按日期倒序，这里只按当前语言过滤后取前三条
const posts = computed(() =>
  ((articlesData.value as ArticleMeta[]) ?? [])
    .filter((post) => post.lang.toLowerCase() === locale.value.toLowerCase())
    .slice(0, 3),
);
</script>

<template>
  <KCard :title="$t('reserve.articles')">
    <ul class="flex flex-col gap-1">
      <li v-for="post in posts" :key="post.slug">
        <NuxtLinkLocale
          :to="`/blog/${post.slug}`"
          class="k-interactive block rounded-lg px-2 py-1.5">
          <p class="line-clamp-2 leading-snug">{{ post.title }}</p>
          <p class="mt-0.5 flex items-center gap-1 text-xs text-(--color-text-3)">
            <KIcon name="material-symbols:event" class="shrink-0 text-xs" />
            {{ formatDate(post.date) }}
          </p>
        </NuxtLinkLocale>
      </li>
      <li v-if="!posts.length" class="px-2 py-1.5 text-(--color-text-3)">
        {{ $t('reserve.articles-empty') }}
      </li>
    </ul>
  </KCard>
</template>

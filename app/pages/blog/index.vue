<script setup lang="ts">
import type { ArticleMeta } from '~~/server/utils';

const { locale } = useI18n();

const { data: articlesData } = await useFetch(`/api/articles`);
const articles = computed(() =>
  (articlesData.value as ArticleMeta[]).filter((post) => {
    return post.lang.toLowerCase() == locale.value.toLowerCase();
  }),
);
useSeoMeta({ title: $t('blog.title') });
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/about">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl">{{ $t('blog.title') }}</h1>
    <KCardLink v-for="post in articles" :key="post.slug" :href="`/blog/${post.slug}`">
      <h2 class="text-lg">{{ post.title }}</h2>
      <p class="text-sm">{{ post.desc }}</p>
      <br />
      <p class="justify-end flex gap-2 flex-wrap">
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> schedule </span>
          <span class="text-sm">{{
            $t('blog.reading-time', [Math.ceil(post.readingTime.minutes), post.readingTime.words])
          }}</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> event </span>
          <span class="text-sm"> {{ formatDate(post.date) }}</span>
        </span>
        <span v-if="post.edit && post.edit != post.date" class="inline-flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> edit </span>
          <span class="text-sm"> {{ formatDate(post.date) }}</span>
        </span>
      </p>
    </KCardLink>
  </AppPage>
</template>

<script setup lang="ts">
import 'github-markdown-css/github-markdown-dark.css';
import type { ArticleMeta } from '~~/server/utils';

const route = useRoute();

const slug = route.params.slug;
const { locale } = useI18n();

const { data: articlesData } = await useFetch(`/api/articles/${slug}`);
const article = computed(() =>
  (articlesData.value as ArticleMeta[]).find(
    (post) => post.lang.toLowerCase() == locale.value.toLowerCase(),
  ),
);

useSeoMeta({
  title: `${article.value?.title || $t('global.notFound')}  - ${$t('blog.title')}`,
  description: article.value?.desc as string,
});
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/blog">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl">{{ article?.title || $t('global.notFound') }}</h1>
    <p class="text-sm">{{ article?.desc || $t('blog.notFound') }}</p>
    <template v-if="!article">
      <var-divider />
      <KCardLink to="/blog" :text="$t('blog.title')" icon="arrow_back" />
    </template>
    <template v-else>
      <div class="flex justify-between items-center gap-1">
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> schedule </span>
          <span class="text-sm"> {{ article.date }}</span>
        </span>
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> edit </span>
          <span class="text-sm"> {{ article.edit }}</span>
        </span>
      </div>
      <var-divider />
      <div class="markdown-body bg-transparent!">
        <div v-html="article.content"></div>
      </div>
    </template>
  </AppPage>
</template>

<style lang="css">
p:has(img) {
  display: flex;
  justify-content: center;
  align-items: center;
}
.markdown-body {
  font-family: inherit !important;
}
</style>

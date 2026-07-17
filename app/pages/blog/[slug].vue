<script setup lang="ts">
import 'github-markdown-css/github-markdown-dark.css';
import type { ArticleMeta } from '~~/server/utils';

const route = useRoute();

const slug = route.params.slug;
const { locale } = useI18n();

useCodeCopy();
useHeadingAnchor();

const { data: articlesData } = await useFetch(`/api/articles/${slug}`);
const article = computed(() =>
  (articlesData.value as ArticleMeta[]).find(
    (post) => post.lang.toLowerCase() == locale.value.toLowerCase(),
  ),
);
const otherLangs = computed(() =>
  (articlesData.value as ArticleMeta[]).filter(
    (post) => post.lang.toLowerCase() != locale.value.toLowerCase(),
  ),
);

useSeoMeta({
  title: `${article.value?.title || $t('global.notFound')}  - ${$t('blog.title')}`,
  description: article.value?.desc as string,
});
useSeoMeta({
  ogImage: `https://r2.kuriyona.com/static/og/blog/${slug}/${locale.value}.png`,
  ogTitle: article.value?.title || $t('global.notFound'),
  ogDescription: article.value?.desc as string,
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
      <div class="flex justify-between items-center gap-2 flex-wrap">
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> schedule </span>
          <span class="text-sm">{{
            $t('blog.reading-time', [
              Math.ceil(article.readingTime.minutes),
              article.readingTime.words,
            ])
          }}</span>
        </span>
        <div class="flex justify-between items-center gap-2 flex-wrap">
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-sm!"> event </span>
            <span class="text-sm"> {{ formatDate(article.date) }}</span>
          </span>
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-sm!"> edit </span>
            <span class="text-sm"> {{ formatDate(article.edit) }}</span>
          </span>
        </div>
      </div>
      <var-divider />
      <template v-if="article.toc?.length">
        <ul class="toc">
          <li
            v-for="item in article.toc"
            :key="item.slug"
            :style="{ paddingLeft: (item.level - 2) * 16 + 'px' }">
            <a :href="`#${item.slug}`">· {{ item.text }}</a>
          </li>
        </ul>
        <var-divider />
      </template>
      <div class="markdown-body bg-transparent!" data-pagefind-body>
        <div v-html="article.content"></div>
      </div>
    </template>
    <template v-if="otherLangs?.length">
      <var-divider />
      <KCard :title="$t('blog.other-lang')">
        <div class="flex flex-col gap-2">
          <KCardLink
            shadow
            v-for="lang in otherLangs"
            :key="lang.lang"
            :locale="lang.lang"
            :to="`/blog/${lang.slug}`"
            :text="lang.title" />
        </div>
      </KCard>
    </template>
  </AppPage>
</template>

<style lang="css">
p:has(img) {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

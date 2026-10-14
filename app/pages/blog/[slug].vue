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
  title: `${article.value?.title || $t('global.not-found')}  - ${$t('blog.title')}`,
  description: article.value?.desc as string,
});
useSeoMeta({
  ogImage: `https://r2.kuriyona.com/static/og/blog/${slug}/${locale.value}.png`,
  ogTitle: article.value?.title || $t('global.not-found'),
  ogDescription: article.value?.desc as string,
});

// 标题滚出顶栏可视区（含被固定菜单栏与浮动顶栏遮住的部分）时显示浮动顶栏
// 浮动顶栏上边距：菜单栏底边（64px 内容 + 2px 描边）+ 6px 留白
const topBarTop = 72;
const titleEl = useTemplateRef<HTMLElement>('titleEl');
const showTopBar = ref(false);
let titleObserver: IntersectionObserver | undefined;

onMounted(() => {
  if (!titleEl.value) return;
  titleObserver = new IntersectionObserver(
    ([entry]) => (showTopBar.value = !entry.isIntersecting),
    { rootMargin: `-${topBarTop}px 0px 0px 0px` },
  );
  titleObserver.observe(titleEl.value);
});

onBeforeUnmount(() => titleObserver?.disconnect());
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/blog">
      <KIconButton icon="material-symbols:arrow-back" />
    </NuxtLinkLocale>
    <h1 ref="titleEl" class="text-2xl">{{ article?.title || $t('global.not-found') }}</h1>
    <p class="text-sm">{{ article?.desc || $t('blog.not-found') }}</p>
    <template v-if="!article">
      <KDivider />
      <KCardLink to="/blog" :text="$t('blog.title')" icon="material-symbols:arrow-back" />
    </template>
    <template v-else>
      <div class="flex justify-between items-center gap-2 flex-wrap">
        <span class="flex items-center gap-1">
          <KIcon name="material-symbols:schedule" class="text-sm" />
          <span class="text-sm">{{
            $t('blog.reading-time', [
              Math.ceil(article.readingTime.minutes),
              article.readingTime.words,
            ])
          }}</span>
        </span>
        <div class="flex justify-between items-center gap-2 flex-wrap">
          <span class="flex items-center gap-1">
            <KIcon name="material-symbols:event" class="text-sm" />
            <span class="text-sm"> {{ formatDate(article.date) }}</span>
          </span>
          <span class="flex items-center gap-1">
            <KIcon name="material-symbols:edit" class="text-sm" />
            <span class="text-sm"> {{ formatDate(article.edit) }}</span>
          </span>
        </div>
      </div>
      <KDivider />
      <template v-if="article.toc?.length">
        <ul class="toc">
          <li
            v-for="item in article.toc"
            :key="item.slug"
            :style="{ paddingLeft: (item.level - 2) * 16 + 'px' }">
            <a :href="`#${item.slug}`">· {{ item.text }}</a>
          </li>
        </ul>
        <KDivider />
      </template>
      <div class="markdown-body bg-transparent!" data-pagefind-body>
        <div v-html="article.content"></div>
      </div>
    </template>
    <template v-if="otherLangs?.length">
      <KDivider />
      <KCard :title="$t('blog.other-lang')">
        <div class="flex flex-col gap-2">
          <KCardLink
            v-for="lang in otherLangs"
            :key="lang.lang"
            :locale="lang.lang"
            :to="`/blog/${lang.slug}`"
            :text="lang.title" />
        </div>
      </KCard>
    </template>
    <BlogTopBar
      :show="showTopBar"
      :title="article?.title || $t('global.not-found')"
      :desc="article?.desc"
      :top="topBarTop" />
  </AppPage>
</template>

<style lang="css">
p:has(img) {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

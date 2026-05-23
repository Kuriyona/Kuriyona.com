<script setup lang="ts">
import 'github-markdown-css/github-markdown-dark.css';

const route = useRoute();

const id = route.params.id;
const { locale } = useI18n();

const { data: post } = await useAsyncData(`post-${id}-${locale.value.toLowerCase()}`, () =>
  queryCollection('blog').path(`/blog/${locale.value.toLowerCase()}/${id}`).first(),
);
useSeoMeta({
  title: `${post.value?.title || $t('global.notFound')}  - ${$t('blog.title')}`,
  description: post.value?.meta.desc as string,
});
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/blog">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl">{{ post?.title || $t('global.notFound') }}</h1>
    <p class="text-sm">{{ post?.desc || $t('blog.notFound') }}</p>
    <template v-if="!post">
      <var-divider />
      <KCardLink to="/blog" :text="$t('blog.title')" icon="arrow_back" />
    </template>
    <template v-else>
      <div class="flex justify-between items-center gap-1">
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> schedule </span>
          <span class="text-sm"> {{ post.date }}</span>
        </span>
        <span class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> edit </span>
          <span class="text-sm"> {{ post.edit }}</span>
        </span>
      </div>
      <var-divider />
      <ContentRenderer :value="post!" class="markdown-body bg-transparent! my-10!" />
    </template>
  </AppPage>
</template>

<style lang="css">
p:has(img) {
  display: flex;
  justify-content: center;
  align-items: center;
}
html {
}
</style>

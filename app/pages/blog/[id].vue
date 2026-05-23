<script setup lang="ts">
import 'github-markdown-css/github-markdown-dark.css';

const route = useRoute();

const id = route.params.id;
const { locale, locales } = useI18n();

const { data: posts } = await useAsyncData(`post-${id}`, async () => {
  return await Promise.all(
    locales.value.map(async (locale) => ({
      locale: locale.code,
      post: await queryCollection('blog')
        .path(`/blog/${locale.code.toLocaleLowerCase()}/${id}`)
        .first(),
    })),
  );
});
const post = computed(() => posts.value?.find((item) => item.locale == locale.value)?.post);
const otherPosts = computed(() => posts.value?.filter((item) => item.locale != locale.value));
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
    <KCard :title="$t('blog.other-lang')">
      <KCardLink level v-for="item in otherPosts" :to="`/blog/${id}`" :lang="item.locale">
        <template #content>
          {{ item?.post?.title || $t('global.notFound') }}
        </template>
      </KCardLink>
    </KCard>
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

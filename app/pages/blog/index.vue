<script setup lang="ts">
const { locale } = useI18n();
console.log(locale.value.toLowerCase());
const { data: posts } = await useAsyncData(`posts-${locale.value}`, () =>
  queryCollection('blog')
    .all()
    .then((res) =>
      res.filter((post) => post.path.startsWith(`/blog/${locale.value.toLowerCase()}`)),
    ),
);

useSeoMeta({ title: $t('blog.title') });
watchEffect(() => {
  console.log(posts.value);
});
</script>

<template>
  <Page>
    <h1 class="text-2xl">{{ $t('blog.title') }}</h1>
    <CardLink v-for="post in posts" :key="post.id" :href="`/blog/${post.path.split('/')[3]}`">
      <h2 class="text-lg">{{ post.title }}</h2>
      <p class="text-sm">{{ post.meta.desc }}</p>
      <p class="justify-end flex gap-2">
        <span class="inline-flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> schedule </span>
          <span class="text-sm"> {{ post.meta.date }}</span>
        </span>
        <span
          v-if="post.meta.edit && post.meta.edit != post.meta.date"
          class="inline-flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> edit </span>
          <span class="text-sm"> {{ post.meta.edit }}</span>
        </span>
      </p>
    </CardLink>
  </Page>
</template>

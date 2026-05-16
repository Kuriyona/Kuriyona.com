<script setup lang="ts">
const { data: posts } = await useAsyncData('posts', () => queryCollection('blog').all());

watchEffect(() => {
  console.log(posts.value);
});
</script>

<template>
  <Page>
    <h1 class="text-2xl">{{ $t('blog.title') }}</h1>
    <CardLink v-for="post in posts" :key="post.id" :href="post.path">
      <h2 class="text-lg">{{ post.title }}</h2>
      <p class="text-sm">{{ post.meta.desc }}</p>
      <p class="justify-end flex items-center gap-1">
        <span class="material-symbols-outlined text-sm!"> schedule </span>
        <span class="text-sm"> {{ post.meta.date }}</span>
      </p>
      <p
        v-if="post.meta.edit && post.meta.edit != post.meta.date"
        class="justify-end flex items-center gap-1">
        <span class="material-symbols-outlined text-sm!"> edit </span>
        <span class="text-sm"> {{ post.meta.edit }}</span>
      </p>
    </CardLink>
  </Page>
</template>

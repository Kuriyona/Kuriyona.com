<script setup lang="ts">
import 'github-markdown-css/github-markdown-dark.css';

const route = useRoute();

const id = route.params.id;

const { data: post } = await useAsyncData('post', () =>
  queryCollection('blog').path(`/blog/${id}`).first(),
);
</script>

<template>
  <Page>
    <h1 class="text-2xl">{{ post!.title }}</h1>
    <p class="text-sm">{{ post!.meta.desc }}</p>
    <div class="flex justify-between items-center gap-1">
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm!"> schedule </span>
        <span class="text-sm"> {{ post!.meta.date }}</span>
      </span>
      <span v-if="post!.meta.edit" class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm!"> edit </span>
        <span class="text-sm"> {{ post!.meta.edit }}</span>
      </span>
    </div>
    <var-divider />
    <ContentRenderer :value="post!" class="markdown-body bg-transparent!" />
  </Page>
</template>

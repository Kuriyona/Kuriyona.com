<script setup lang="ts">
const { locale } = useI18n();
const { data: posts } = await useAsyncData(`posts-${locale.value}`, () =>
  queryCollection('blog')
    .order('date', 'DESC')
    .all()
    .then((res) =>
      res.filter((post) => post.path.startsWith(`/blog/${uniLocale(locale.value).toLowerCase()}`)),
    ),
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
    <KCardLink v-for="post in posts" :key="post.id" :href="`/blog/${post.path.split('/')[3]}`">
      <h2 class="text-lg">{{ post.title }}</h2>
      <p class="text-sm">{{ post.desc }}</p>
      <br />
      <p class="justify-end flex gap-2">
        <span class="inline-flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> schedule </span>
          <span class="text-sm"> {{ post.date }}</span>
        </span>
        <span v-if="post.edit && post.edit != post.date" class="inline-flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> edit </span>
          <span class="text-sm"> {{ post.edit }}</span>
        </span>
      </p>
    </KCardLink>
  </AppPage>
</template>

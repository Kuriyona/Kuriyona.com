<script setup lang="ts">
const config = useAppConfig();
const { locale } = useI18n();
console.log(locale.value.toLowerCase());
const { data: posts } = await useAsyncData(`posts-${locale.value}`, () =>
  queryCollection('blog')
    .all()
    .then((res) =>
      res.filter((post) => post.path.startsWith(`/blog/${locale.value.toLowerCase()}`)),
    ),
);
</script>

<template>
  <div class="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center">
    <div class="relative max-w-100 flex flex-col gap-4 mx-4">
      <div class="py-4 flex flex-col items-center justify-center gap-4 text-center px-10">
        <h1 class="text-2xl font-bold">
          <span>你好，欢迎来到</span>
          <br />
          <span>Kuriyona's Space</span>
        </h1>
        <p class="font-bold">{{ $t('about.description') }}</p>
      </div>
      <NuxtLinkLocale to="/about">
        <KButton block text>
          <div class="flex items-center gap-2">
            <span>{{ $t('about.about-me') }}</span>
            <span class="material-symbols-outlined text-sm!"> arrow_forward </span>
          </div>
        </KButton>
      </NuxtLinkLocale>
      <NuxtLinkLocale to="/blog">
        <KButton block text>
          <div class="flex items-center gap-2">
            <span>{{ $t('blog.title') }}</span>
            <span class="material-symbols-outlined text-sm!"> arrow_forward </span>
          </div>
        </KButton>
      </NuxtLinkLocale>
      <p class="absolute text-center text-sm text-white/20 top-full w-full pt-4">
        <a href="https://icp.gov.moe/?keyword=20266280" target="_blank" class="underline">
          萌 ICP 备 20266280 号
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

const data = [
  {
    title: 'MtF.Wiki',
    href: 'https://mtf.wiki/',
  },
  {
    title: '跨性别 - 百度百科',
    href: 'https://baike.baidu.com/item/%E8%B7%A8%E6%80%A7%E5%88%AB',
    lang: 'zh',
  },
  {
    title: '跨性别 - 维基百科',
    href: 'https://zh.wikipedia.org/wiki/%E8%B7%A8%E6%80%A7%E5%88%A5',
  },
  {
    title: 'Transgender - Wikipedia',
    href: 'https://en.wikipedia.org/wiki/Transgender',
  },
  {
    title: 'Bing',
    href: 'https://www.bing.com/search?q=Transgender',
  },
  {
    title: 'Google',
    href: 'https://www.google.com/search?q=Transgender',
  },
  {
    title: '这就是性别烦躁，供参考',
    href: 'https://genderdysphoria.fyi/zh',
  },
  {
    title: "That's Gender Dysphoria, FYI",
    href: 'https://genderdysphoria.fyi/en',
  },
];
</script>

<template>
  <Page>
    <div class="flex flex-col gap-8">
      <IAm />
      <div>
        <p class="trans-text">{{ $t('about.im-mtf') }}</p>
        <ClientOnly>
          <p class="trans-text">
            {{ $t('hrt_days', [dayjs().diff('2026/01/17', 'day') + 1]) }}
          </p>
        </ClientOnly>
      </div>
      <NuxtLinkLocale to="/">
        <var-card> {{ $t('about.my-site-home') }} </var-card>
      </NuxtLinkLocale>
      <div class="flex flex-col gap-4">
        <a v-for="item in data" :key="item.href" :href="item.href" target="_blank">
          <var-card>{{ item.title }}</var-card>
        </a>
      </div>
    </div>
  </Page>
</template>

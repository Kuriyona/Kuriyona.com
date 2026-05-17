<script setup lang="ts">
import dayjs from 'dayjs';

const { t } = useI18n();

const data = computed(() => [
  {
    title: 'MtF.Wiki',
    href: t('urls.mtf_wiki'),
  },
  {
    title: '2345.lgbt',
    href: t('urls.2345-lgbt'),
  },
  {
    title: '跨性别 - 百度百科',
    href: 'https://baike.baidu.com/item/%E8%B7%A8%E6%80%A7%E5%88%AB',
  },
  {
    title: `${t('trans')} - Wikipedia`,
    href: t('urls.trans_wikipedia'),
  },
  {
    title: `${t('trans')} - Bing`,
    href: `https://www.bing.com/search?q=${t('trans')}`,
  },
  {
    title: `${t('trans')} - Google`,
    href: `https://www.google.com/search?q=${t('trans')}`,
  },
  {
    title: t('about.mtf.sites.title.gd-fyi'),
    href: t('urls.gd_fyi'),
  },
]);
useSeoMeta({ title: $t('about.mtf.as-mtf') });
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <IAm />
      <div class="flex gap-2 justify-between items-center">
        <div class="flex flex-col items-start trans-text">
          <p>{{ $t('about.mtf.im-mtf') }}</p>
          <p>
            {{ $t('about.mtf.be-a-girl', [dayjs().diff('2020', 'year')]) }}
          </p>
          <p>
            {{ $t('about.mtf.comfrim_days', [dayjs().diff('2025/11/17', 'month')]) }}
          </p>
          <ClientOnly>
            <p>
              {{ $t('about.mtf.hrt_days', [dayjs().diff('2026/01/17', 'day') + 1]) }}
            </p>
          </ClientOnly>
        </div>
        <div class="text-4xl large:text-nowrap">🏳️‍⚧️<br />🍥</div>
      </div>
      <var-divider :description="$t('about.about-me')" />
      <CardLink to="/about" :text="$t('about.my-site-home')" />
      <var-divider :description="$t('about.mtf.about-trans')" />
      <div class="flex flex-col gap-4">
        <CardLink
          v-for="item in data"
          :key="item.href"
          :to="item.href"
          :text="item.title"
          :new="true" />
      </div>
    </div>
  </Page>
</template>

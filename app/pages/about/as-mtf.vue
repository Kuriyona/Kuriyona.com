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
    title: t('about.as-mtf.sites.title.gd-fyi'),
    href: t('urls.gd_fyi'),
  },
]);
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <IAm />
      <div>
        <p class="trans-text">{{ $t('about.im-mtf') }}</p>
        <ClientOnly>
          <p class="trans-text">
            {{ $t('hrt_days', [dayjs().diff('2026/01/17', 'day') + 1]) }}
          </p>
        </ClientOnly>
      </div>
      <var-divider />
      <NuxtLinkLocale to="/">
        <var-card>
          <div class="flex justify-between items-center">
            <div>
              {{ $t('about.my-site-home') }}
            </div>
            <span class="material-symbols-outlined"> arrow_forward </span>
          </div>
        </var-card>
      </NuxtLinkLocale>
      <var-divider />
      <div class="flex flex-col gap-4">
        <a v-for="item in data" :key="item.href" :href="item.href" target="_blank">
          <var-card>
            <div class="flex justify-between items-center">
              <div>
                {{ item.title }}
              </div>
              <div>
                <span class="material-symbols-outlined"> open_in_new </span>
              </div>
            </div>
          </var-card>
        </a>
      </div>
    </div>
  </Page>
</template>

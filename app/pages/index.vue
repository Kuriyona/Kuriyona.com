<script setup lang="ts">
import { shallowRef } from 'vue';
import dayjs from 'dayjs';
import { useI18n } from '@/scripts/i18n';
import Config from '../config.json';
import IAm from '~/components/IAm.vue';

const { t, locale } = useI18n();
const localePath = useLocalePath();

const Contact = shallowRef(Config.contact);
</script>

<template>
  <div class="fixed top-0 left-0 bottom-0 w-screen flex justify-center items-center">
    <main class="w-80 my-20 p-4 flex flex-col items-center justify-center gap-4">
      <img class="w-10 rounded-sm" src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
      <h1 class="text-2xl">I'm Kuriyona</h1>
      <p class="text-center">{{ $t('about.description') }}</p>
      <NuxtLinkLocale to="/about/" class="w-full">
        <var-button block>
          <div class="flex justify-center items-center gap-2">
            <span class="text-sm!">{{ $t('about.about-me') }}</span>
            <span class="material-symbols-outlined text-sm!"> arrow_forward </span>
          </div>
        </var-button>
      </NuxtLinkLocale>
      <var-link href="https://icp.gov.moe/?keyword=20266280" target="_blank">
        萌 ICP 备 20266280 号
      </var-link>
    </main>
  </div>
</template>

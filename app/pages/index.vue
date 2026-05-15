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
  <div class="flex justify-center h-full">
    <main class="w-160 my-20 p-4 flex flex-col gap-4">
      <IAm />
      <p class="text-center">{{ $t('about.description') }}</p>
      <div class="mb-20">
        <CardLink to="/about/" :text="$t('global.read_more')" />
      </div>
      <var-divider />
      <Footer />
    </main>
  </div>
</template>

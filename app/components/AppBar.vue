<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
import NekoChat from './NekoChat.vue';
const { setLocale } = useI18n();
const selecting = ref(false);
const popup = ref(false);
</script>

<template>
  <div class="sticky top-0 flex justify-center p-2">
    <div
      class="w-200 font-mono py-2 px-3 flex justify-between items-center rounded-xl backdrop-brightness-75 backdrop-blur-3xl">
      <NuxtLinkLocale to="/">
        <span class="hover:text-shadow-lg text-shadow-white/20">Kuriyona's Space</span>
      </NuxtLinkLocale>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
const { locale, t } = useI18n();
</script>

<template>
  <div class="font-mono py-2 px-3 flex justify-between items-center">
    <RouterLink to="/" class="text">
      <span class="hover">Kuriyona's Space</span>
    </RouterLink>
    <div class="flex gap-2">
      <span class="hover" @click="locale = 1 - locale">{{
        t(['中', 'EN'])
      }}</span>
      <RouterLink to="time">
        <span class="hover">{{ t(['Time', '时间']) }}</span></RouterLink
      >
      <span class="hover">{{ t(['Menu', '菜单']) }}</span>
    </div>
  </div>
</template>

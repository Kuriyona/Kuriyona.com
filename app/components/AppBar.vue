<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
const { locale, setLocale } = useI18n();
</script>

<template>
  <div class="container-bar font-mono py-2 px-3 flex justify-between items-center">
    <RouterLink to="/" class="link-style-uu">
      <span>Kuriyona's Space</span>
    </RouterLink>
    <div id="actions" class="flex gap-2">
      <span class="link-style-uu" @click="setLocale(locale === 'zh' ? 'en' : 'zh')">{{
        locale === 'zh' ? 'EN' : '中'
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.container-bar {
  box-shadow: 0 0 50px #fff2;
}
</style>

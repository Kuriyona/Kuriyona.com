<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
const { locale, t } = useI18n();
</script>

<template>
  <div
    class="container-bar font-mono py-2 px-3 flex justify-between items-center">
    <RouterLink to="/" class="link-style-uu">
      <span>Kuriyona's Space</span>
    </RouterLink>
    <div id="actions" class="flex gap-2">
      <span class="link-style-uu" @click="locale = 1 - locale">{{
        t(['中', 'EN'])
      }}</span>
      <RouterLink to="time" class="link-style-uu">
        <span>{{ t(['Time', '时间']) }}</span>
      </RouterLink>
      <span class="link-style-uu">{{ t(['Menu', '菜单']) }}</span>
    </div>
  </div>
</template>

<style scoped>
.container-bar {
  box-shadow: 0 0 50px #fff2;
}
</style>

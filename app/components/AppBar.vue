<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
const { setLocale } = useI18n();
const selecting = ref(false);
</script>

<template>
  <div class="container-bar font-mono py-2 px-3 flex justify-between items-center">
    <RouterLink to="/" class="link-style-uu">
      <span>Kuriyona's Space</span>
    </RouterLink>
    <div id="actions" class="flex gap-2">
      <VarMenuSelect v-model="selecting" variant="standard" placement="bottom-end">
        <VarButton round text>
          <span class="material-symbols-outlined"> translate </span>
        </VarButton>
        <template #options>
          <VarMenuOption @click="setLocale('zh-Hans')" label="中文(简体)"></VarMenuOption>
          <VarMenuOption @click="setLocale('zh-Hant')" label="中文(繁体)"></VarMenuOption>
          <VarMenuOption @click="setLocale('en')" label="English"></VarMenuOption>
          <VarMenuOption @click="setLocale('ja')" label="日本語"></VarMenuOption>
        </template>
      </VarMenuSelect>
    </div>
  </div>
</template>

<style scoped>
.container-bar {
  box-shadow: 0 0 50px #fff2;
}
</style>

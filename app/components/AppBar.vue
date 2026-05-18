<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
const { setLocale } = useI18n();
const selecting = ref(false);
const popup = ref(false);
</script>

<template>
  <div
    class="container-bar font-mono py-2 px-3 flex justify-between items-center rounded-xl backdrop-brightness-75 backdrop-blur-3xl">
    <NuxtLinkLocale to="/">
      <span class="hover:text-shadow-lg text-shadow-white/20">Kuriyona's Space</span>
    </NuxtLinkLocale>
    <div id="actions" class="flex gap-2">
      <VarButton round text @click="popup = true">
        <span class="material-symbols-outlined"> chat </span>
      </VarButton>
      <VarPopup v-model:show="popup" class="rounded-l-xl" position="right">
        <div class="relative flex flex-col h-full w-120 max-w-[80vw] overflow-hidden">
          <div class="flex justify-between items-center px-6 py-2">
            <span>{{ $t('neko.title') }}</span>
            <VarButton round text @click="popup = false">
              <span class="material-symbols-outlined"> close </span>
            </VarButton>
          </div>
          <Neko />
        </div>
      </VarPopup>
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

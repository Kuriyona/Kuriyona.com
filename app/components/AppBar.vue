<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
import NekoChat from './NekoChat.vue';
const { setLocale } = useI18n();
const selecting = ref(false);
const popup = ref(false);
</script>

<template>
  <div class="sticky top-0 flex justify-center backdrop-brightness-75 backdrop-blur-3xl">
    <div class="w-200 px-4">
      <div class="relative font-mono h-12 py-2 px-3 flex justify-between items-center rounded-xl">
        <div class="h-full flex items-center gap-4">
          <img class="h-3/4 rounded-md" src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
          <NuxtLinkLocale to="/about">
            <span class="hover:underline">Kuriyona's Space</span>
          </NuxtLinkLocale>
        </div>
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
              <NekoChat />
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
    </div>
  </div>
</template>

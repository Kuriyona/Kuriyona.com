<script setup lang="ts">
import AppMenu from './AppBar/AppMenu.vue';
import KButton from './KButton.vue';
import { useSearch } from '~/composables/useSearch';
const popup = ref(false);
const mobileMenu = ref(false);

const search = useSearch();

onMounted(() => {
  function globalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      search.toggle();
    }
  }
  document.addEventListener('keydown', globalKeydown);
});
</script>

<template>
  <div class="fixed w-screen top-0 flex justify-center backdrop-brightness-75 backdrop-blur-3xl">
    <div class="w-200 max-w-screen px-4 *:px-2 *:font-monos">
      <div class="relative min-h-12 py-2 px-3 flex justify-between items-center rounded-xl">
        <div class="h-full flex items-center gap-4">
          <img
            class="h-6 rounded-md hidden sm:inline-block"
            src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
          <NuxtLinkLocale to="/about">
            <span class="hover:underline">Kuriyona's Space</span>
          </NuxtLinkLocale>
        </div>
        <div id="actions" class="flex items-center gap-2">
          <NuxtLinkLocale to="/blog" class="hidden sm:inline-block">
            <VarButton text size="small">
              <span class="text-sm!"> Blog </span>
            </VarButton>
          </NuxtLinkLocale>
          <NuxtLinkLocale to="/neko" class="hidden sm:inline-block">
            <VarButton text size="small">
              <span class="text-sm!"> Neko </span>
            </VarButton>
          </NuxtLinkLocale>
          <NuxtLinkLocale to="/status" class="hidden sm:inline-block">
            <VarButton text size="small">
              <span class="text-sm!"> {{ $t('status.title') }} </span>
            </VarButton>
          </NuxtLinkLocale>
          <NuxtLinkLocale to="/ask-box" class="hidden sm:inline-block">
            <VarButton text size="small">
              <span class="text-sm!"> {{ $t('ask-box.title') }} </span>
            </VarButton>
          </NuxtLinkLocale>
          <KButton round @click="search.toggle()">
            <span class="material-symbols-outlined text-lg! leading-none"> search </span>
          </KButton>
          <KButton round @click="mobileMenu = true">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-lg! leading-none"> translate </span>
              <span class="material-symbols-outlined text-lg! leading-none"> music_note </span>
              <span class="material-symbols-outlined text-lg! leading-none"> menu </span>
            </div>
          </KButton>
        </div>
      </div>
      <MusicBar />
      <AppBarTips />
    </div>
  </div>
  <AppMenu v-model="mobileMenu" @open-neko="popup = true" />
  <SearchModal />
</template>

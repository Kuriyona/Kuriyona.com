<script setup lang="ts">
import AppMenu from './AppBar/AppMenu.vue';
import KButton from './KButton.vue';
import { useSearch } from '~/composables/useSearch';
const mobileMenu = ref(false);

const search = useSearch();
const nav = useNav();

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
  <div class="k-surface k-glass fixed w-screen top-0 z-100 flex justify-center">
    <div class="w-(--content-width) max-w-screen px-4 *:px-2 *:font-monos">
      <div class="relative min-h-12 py-2 px-3 flex justify-between items-center rounded-xl">
        <div class="h-full flex items-center gap-4">
          <img
            class="h-6 rounded-md hidden sm:inline-block"
            src="https://r2.kuriyona.com/img/avatar/Avatar_OLI_256.png" />
          <NuxtLinkLocale to="/">
            <span class="hover:underline">Kuriyona's Space</span>
          </NuxtLinkLocale>
        </div>
        <div id="actions" class="flex items-center gap-2">
          <NuxtLinkLocale
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="hidden sm:inline-block">
            <KButton round>
              {{ item.shortTitle || item.title }}
            </KButton>
          </NuxtLinkLocale>
          <KIconButton icon="material-symbols:search" @click="search.toggle()" />
          <KButton round class="gap-2" :aria-label="$t('global.more')" @click="mobileMenu = true">
            <KIcon name="material-symbols:translate" class="text-lg" />
            <KIcon name="material-symbols:menu" class="text-lg" />
          </KButton>
        </div>
      </div>
    </div>
  </div>
  <AppMenu v-model="mobileMenu" />
  <SearchModal />
</template>

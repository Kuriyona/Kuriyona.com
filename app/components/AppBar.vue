<script setup lang="ts">
const popup = ref(false);
const mobileMenu = ref(false);
import { useI18n } from '@/scripts/i18n';
import KButton from './KButton.vue';
const { setLocale, locales } = useI18n();
const selecting = ref(false);
</script>

<template>
  <div class="sticky top-0 flex justify-center backdrop-brightness-75 backdrop-blur-3xl">
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
          <VarButton text @click="popup = true" size="small" class="hidden! sm:block!">
            <span class="text-sm!"> Neko </span>
          </VarButton>
          <NuxtLinkLocale to="/ask-box" class="hidden sm:inline-block">
            <VarButton text size="small">
              <span class="text-sm!"> Ask Box </span>
            </VarButton>
          </NuxtLinkLocale>
          <KButton round @click="mobileMenu = true">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-lg! leading-none"> translate </span>
              <span class="material-symbols-outlined text-lg! leading-none"> menu </span>
            </div>
          </KButton>
        </div>
      </div>
      <MusicBar />
      <AppBarTips />
      <NekoCatPopup v-model:show="popup" />
    </div>

    <Transition name="menu">
      <div v-if="mobileMenu">
        <div class="fixed right-0 w-screen h-screen bg-black/50" @click="mobileMenu = false" />
        <div
          class="fixed w-64 right-0 h-screen bg-black border-l border-white/5 flex flex-col gap-4 p-4 overflow-visible">
          <div class="flex justify-end">
            <KButton round @click="mobileMenu = false">
              <span class="material-symbols-outlined text-lg! leading-none"> close </span>
            </KButton>
          </div>
          <KCardLink to="/blog" @click="mobileMenu = false" text="Blog" />
          <KCardLink
            @click="
              popup = true;
              mobileMenu = false;
            "
            text="Neko" />
          <KCardLink to="/ask-box" @click="mobileMenu = false" text="Ask Box" />
          <KCard>
            <KButton
              v-for="locale in locales"
              :key="locale.code"
              block
              @click="
                setLocale(locale.code);
                selecting = false;
              "
              class="text-xs"
              >{{ locale.name }}
            </KButton>
          </KCard>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.25s ease;
}
.menu-enter-active > div:last-child,
.menu-leave-active > div:last-child {
  transition: transform 0.25s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
.menu-enter-from > div:last-child,
.menu-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>

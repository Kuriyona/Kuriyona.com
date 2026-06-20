<script setup lang="ts">
const popup = ref(false);
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
        <div id="actions" class="flex gap-2">
          <NuxtLinkLocale to="/blog">
            <VarButton text size="small">
              <span class="text-sm!"> Blog </span>
            </VarButton>
          </NuxtLinkLocale>
          <VarButton text @click="popup = true" size="small">
            <span class="text-sm!"> Neko </span>
          </VarButton>
          <LanguageSelector />
        </div>
      </div>
      <MusicBar />
      <AppBarTips />
      <NekoCatPopup v-model:show="popup" />
    </div>
  </div>
</template>

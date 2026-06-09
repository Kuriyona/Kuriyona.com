<script setup lang="ts">
const popup = ref(false);
</script>

<template>
  <div class="sticky top-0 flex justify-center backdrop-brightness-75 backdrop-blur-3xl">
    <div class="w-200 px-4 *:px-2 *:font-mono">
      <div class="relative h-12 py-2 px-3 flex justify-between items-center rounded-xl">
        <div class="h-full flex items-center gap-4">
          <img class="h-3/4 rounded-md" src="https://r2.kuriyona.com/img/avatar/Avatar_256.png" />
          <NuxtLinkLocale to="/about">
            <span class="hover:underline">Kuriyona's Space</span>
          </NuxtLinkLocale>
        </div>
        <div id="actions" class="flex gap-2">
          <VarButton text @click="popup = true" size="small">
            <span class="text-sm!"> Neko </span>
          </VarButton>
          <LanguageSelector />
        </div>
      </div>
      <AppBarTips />
      <NekoCatPopup v-model:show="popup" />
      <MusicBar />
    </div>
  </div>
</template>

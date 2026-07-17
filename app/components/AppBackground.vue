<script setup lang="ts">
import { useBackgroundStore } from '@/stores/background';

const backgroundStore = useBackgroundStore();
</script>

<template>
  <div
    class="fixed w-full h-full top-0 left-0 z-[-1] select-none"
    :style="{ filter: `brightness(${backgroundStore.preset.brightness})` }">
    <video
      v-if="backgroundStore.backgroundFileType === 'video'"
      class="w-full h-full object-cover object-[27%]"
      :src="backgroundStore.backgroundFileUrl"
      autoplay
      muted
      loop
      playsinline></video>
    <img
      v-else
      class="w-full h-full object-cover object-[27%]"
      :src="backgroundStore.backgroundFileUrl"
      alt="Background" />
    <div class="fixed top-0 w-full h-full bg-white/10" />
  </div>
</template>

<script setup lang="ts">
import { useBackgroundStore } from '@/stores/background';

const backgroundStore = useBackgroundStore();
</script>

<template>
  <KCard title="背景">
    <div class="flex flex-col gap-2">
      <KCard
        v-for="preset in BackgroundPresets"
        :key="preset.type"
        class="w-full cursor-pointer"
        @click="backgroundStore.preset = preset">
        {{ preset.name }}
      </KCard>
    </div>
  </KCard>
</template>

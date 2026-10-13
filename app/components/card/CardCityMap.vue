<script setup lang="ts">
import type { CityMap } from '~/scripts/statusTypes';

defineProps<{
  title: string;
  city: CityMap;
}>();
</script>

<template>
  <KCard :title="title">
    <!-- 地图由后端出图写 R2、地址要等 /status 回来，SSR/预渲染阶段没有内容 -->
    <ClientOnly>
      <!-- 出图是 1:1 且目标居中，这里按容器比例裁切：2:1 ~ 1:2 之间目标都还在画面里 -->
      <div class="relative overflow-hidden rounded-lg aspect-2/1 max-[600px]:aspect-square">
        <img
          v-if="city.ready"
          class="h-full w-full object-cover"
          :src="city.map"
          :alt="city.name" />
        <div v-else class="grid h-full w-full place-items-center text-xs text-(--color-text-3)">
          {{ $t('about.map-generating') }}
        </div>
        <p
          class="absolute bottom-0 left-0 rounded-tr-md bg-(--color-surface-1) px-1 text-sm text-(--color-text-1)">
          {{ city.name }}
        </p>
      </div>
    </ClientOnly>
  </KCard>
</template>

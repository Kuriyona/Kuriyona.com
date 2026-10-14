<script setup lang="ts">
import type { CityMap, Weather } from '~/scripts/statusTypes';

defineProps<{
  title: string;
  city: CityMap;
  /** 传入时在地图右下角叠加天气图标 + 温度（图标由 QWeather 图标码经 weatherIcon 映射到 Material Symbols） */
  weather?: Weather;
}>();
</script>

<template>
  <KCard :title="title">
    <!-- 地址来自 /api/status，SSR 阶段还没有；图不存在就是 404，不做任何额外处理 -->
    <ClientOnly>
      <!-- 出图是 1:1 且目标居中，这里按容器比例裁切：2:1 ~ 1:2 之间目标都还在画面里 -->
      <div class="relative overflow-hidden rounded-lg aspect-2/1 max-[600px]:aspect-square">
        <img class="h-full w-full object-cover" :src="city.map" :alt="city.name" />
        <p
          class="absolute bottom-0 left-0 rounded-tr-md bg-(--color-surface-1) px-1 text-sm text-(--color-text-1)">
          {{ city.name }}
        </p>
        <p
          v-if="weather?.now"
          class="absolute bottom-0 right-0 rounded-tl-md bg-(--color-surface-1) px-1 text-sm text-(--color-text-1) flex items-center gap-1">
          <KIcon :name="weatherIcon(weather.now.icon)" class="text-base" />
          <span>{{ weather.now.temp }}℃</span>
        </p>
      </div>
    </ClientOnly>
  </KCard>
</template>

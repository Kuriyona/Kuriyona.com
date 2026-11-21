<script setup lang="ts">
import devicesData from '~/data/devices.json';

useSeoMeta({ title: $t('devices.title') });
</script>

<template>
  <AppPage data-pagefind-body>
    <!-- 标题已在固定顶栏：保留一份不可见 h1 供 Pagefind 取页面标题与 SEO -->
    <h1 class="hidden">{{ $t('devices.title') }}</h1>
    <p class="text-(--color-text-2)">{{ $t('devices.desc') }}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <KCard
        v-for="device in devicesData.devices"
        :key="device.name"
        class="flex flex-col gap-2"
        :class="{ 'opacity-60': device.retired }"
        :style="device.primary ? { boxShadow: 'var(--card-glow)' } : {}">
        <div>
          <h2 class="text-lg font-bold text-(--color-text-1)">
            {{ device.nameKey ? $t(device.nameKey) : device.name }}
          </h2>
          <p class="text-(--color-text-2) text-sm leading-6 min-h-6 flex items-center gap-2">
            <span v-if="device.subtitle">{{ device.subtitle }}</span>
            <KBadge v-if="device.primary" class="shrink-0">
              {{ $t('devices.primary') }}
            </KBadge>
            <KBadge v-else-if="device.retired" variant="muted" class="shrink-0">
              {{ $t('devices.retired') }}
            </KBadge>
          </p>
        </div>
        <KDivider />
        <div class="flex flex-col gap-1.5">
          <div v-for="spec in device.specs" :key="spec.labelKey" class="flex justify-between gap-4">
            <span class="text-(--color-text-2) shrink-0">{{ $t(spec.labelKey) }}</span>
            <span class="text-(--color-text-1) text-right">{{ spec.value }}</span>
          </div>
        </div>
      </KCard>
    </div>
  </AppPage>
</template>

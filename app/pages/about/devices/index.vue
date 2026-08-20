<script setup lang="ts">
import devicesData from '~/data/devices.json';

useSeoMeta({ title: $t('about.devices.title') });
</script>

<template>
  <AppPage data-pagefind-body>
    <NuxtLinkLocale to="/about">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl font-bold">{{ $t('about.devices.title') }}</h1>
    <p class="text-white/60">{{ $t('about.devices.desc') }}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <KCard
        v-for="device in devicesData.devices"
        :key="device.name"
        class="flex flex-col gap-2"
        :style="device.primary ? { boxShadow: '0 0 24px rgba(255,255,255,0.18)' } : {}">
        <div>
          <h2 class="text-lg font-bold text-white">
            {{ device.nameKey ? $t(device.nameKey) : device.name }}
          </h2>
          <p class="text-white/60 text-sm leading-6 min-h-6 flex items-center gap-2">
            <span>{{ device.subtitleKey ? $t(device.subtitleKey) : device.subtitle }}</span>
            <span
              v-if="device.primary"
              class="shrink-0 bg-[var(--color-theme)]/20 text-[var(--color-theme)] text-xs px-2 py-0.5 rounded-full">
              {{ $t('about.devices.primary') }}
            </span>
          </p>
        </div>
        <KDivider />
        <div class="flex flex-col gap-1.5">
          <div v-for="spec in device.specs" :key="spec.labelKey" class="flex justify-between gap-4">
            <span class="text-white/60 shrink-0">{{ $t(spec.labelKey) }}</span>
            <span class="text-white/90 text-right">{{ spec.value }}</span>
          </div>
        </div>
      </KCard>
    </div>
  </AppPage>
</template>

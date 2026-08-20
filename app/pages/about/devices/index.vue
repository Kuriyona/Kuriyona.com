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
      <KCard v-for="device in devicesData.devices" :key="device.name" class="flex flex-col gap-2">
        <div>
          <h2 class="text-lg font-bold text-white">{{ device.name }}</h2>
          <p v-if="device.subtitle" class="text-white/60 text-sm">{{ device.subtitle }}</p>
        </div>
        <KDivider />
        <div class="flex flex-col gap-1.5">
          <div v-for="spec in device.specs" :key="spec.label" class="flex justify-between gap-4">
            <span class="text-white/60 shrink-0">{{ spec.label }}</span>
            <span class="text-white/90 text-right">{{ spec.value }}</span>
          </div>
        </div>
      </KCard>
    </div>
  </AppPage>
</template>
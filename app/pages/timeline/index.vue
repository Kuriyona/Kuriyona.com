<script setup lang="ts">
import { useAppConfig } from '#app';

const { timeline } = useAppConfig();

type TimelineItem = (typeof timeline)[number];

interface TimelineNode {
  type: 'year' | 'item';
  year?: string;
  item?: TimelineItem;
}

const nodes = computed<TimelineNode[]>(() => {
  const result: TimelineNode[] = [];
  let prevYear = '';
  for (const item of timeline) {
    const year = item.date.slice(0, 4);
    if (year !== prevYear) {
      result.push({ type: 'year', year });
      prevYear = year;
    }
    result.push({ type: 'item', item });
  }
  return result;
});

useSeoMeta({ title: $t('timeline.title') });
</script>

<template>
  <AppPage>
    <NuxtLinkLocale to="/">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl font-bold">{{ $t('timeline.title') }}</h1>
    <p class="text-white/60">{{ $t('timeline.desc') }}</p>
    <div class="relative flex flex-col gap-8 py-6">
      <div class="absolute inset-y-0 left-4 w-px -translate-x-1/2 bg-white/15"></div>
      <template v-for="node in nodes" :key="node.type === 'year' ? node.year : node.item?.date">
        <div v-if="node.type === 'year'" class="relative py-1.5">
          <span
            class="absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-theme)] text-black text-sm font-bold px-3 py-0.5 rounded-full">
            {{ node.year }}
          </span>
        </div>
        <div v-else class="relative ml-8" :key="node.item!.date">
          <KCard>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <p class="font-monos font-bold text-[var(--color-theme)]">
                  {{ node.item!.date }}
                </p>
                <span
                  v-if="node.item!.tag"
                  class="bg-[var(--color-theme)]/20 text-[var(--color-theme)] text-xs px-2 py-0.5 rounded-full">
                  {{ node.item!.tag }}
                </span>
              </div>
              <p class="text-white/80">{{ node.item!.text }}</p>
            </div>
          </KCard>
        </div>
      </template>
    </div>
  </AppPage>
</template>

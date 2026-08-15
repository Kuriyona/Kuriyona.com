<script setup lang="ts">
interface TimelineItem {
  date: string;
  text: string;
}

interface TimelineNode {
  type: 'year' | 'item';
  year?: string;
  item?: TimelineItem;
}

const timeline: TimelineItem[] = [
  { date: '2008/06/28', text: '出生' },
  { date: '2024/07/04', text: '与第一任相识' },
  { date: '2025/11/22', text: '性别认同的初步确定' },
  { date: '2025/11/27', text: '取名「未晞」' },
  { date: '2025/12/17', text: '第一段感情开始' },
  { date: '2026/01/14', text: '开始 GAHT' },
  { date: '2026/03/22', text: '与家人出柜' },
  { date: '2026/03/29', text: '离死亡/自杀最近的一次？' },
  { date: '2026/04/18', text: '第一段感情结束' },
  { date: '2026/06/10', text: '高考结束' },
  { date: '2026/06/11', text: '与第二任相识' },
  { date: '2026/06/28', text: '成年' },
  { date: '2026/06/30', text: '放下第一任' },
  { date: '2026/07/22', text: '开到「小证」' },
  { date: '2026/07/25', text: '第二段感情开始' },
];

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
    <NuxtLinkLocale to="/about">
      <KButton round text>
        <span class="material-symbols-outlined"> arrow_back </span>
      </KButton>
    </NuxtLinkLocale>
    <h1 class="text-2xl font-bold">{{ $t('timeline.title') }}</h1>
    <p class="text-white/60">{{ $t('timeline.description') }}</p>
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
              <p class="font-monos font-bold text-[var(--color-theme)]">
                {{ node.item!.date }}
              </p>
              <p class="text-white/80">{{ node.item!.text }}</p>
            </div>
          </KCard>
        </div>
      </template>
    </div>
  </AppPage>
</template>

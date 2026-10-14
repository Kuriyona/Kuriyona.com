<script setup lang="ts">
interface TimelineItem {
  date: string;
  text: string;
  link?: string;
}

const props = defineProps<{ items: TimelineItem[] }>();

const { isCurrent, openLink, linkIcon } = useTimelineLink();

/** <time> 的 datetime 需要 YYYY-MM-DD，数据里的日期是 YYYY/MM/DD */
const isoDate = (date: string) => date.replace(/\//g, '-');
</script>

<template>
  <ul class="flex flex-col">
    <li v-for="(item, index) in props.items" :key="`${item.date}-${item.text}`">
      <KDivider v-if="index > 0" />
      <div class="flex items-center gap-3 py-2">
        <time
          :datetime="isoDate(item.date)"
          class="shrink-0 font-monos text-xs text-(--color-text-3)">
          {{ item.date }}
        </time>
        <span class="min-w-0 flex-1 text-sm text-(--color-text-1)">{{ item.text }}</span>
        <KIconButton
          v-if="item.link && !isCurrent(item.link)"
          :icon="linkIcon(item.link)"
          size="sm"
          @click="openLink(item.link)" />
      </div>
    </li>
  </ul>
</template>

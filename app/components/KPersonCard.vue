<script setup lang="ts">
export type PersonLink = {
  url: string;
  /** iconify 全名（simple-icons:<slug>） */
  icon: string;
  /** 平台名称 i18n key */
  i18nKey: string;
};

defineProps<{
  name: string;
  /** 关系 i18n key（link-relation.*） */
  relationKey?: string;
  desc?: string;
  links?: PersonLink[];
}>();
</script>

<template>
  <KCard>
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-baseline gap-2">
        <KBadge v-if="relationKey">{{ $t(relationKey) }}</KBadge>
        <span class="text-lg font-semibold">{{ name }}</span>
        <span v-if="desc" class="text-sm text-(--color-text-3)">{{ desc }}</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="link in links"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${name} · ${$t(link.i18nKey)}`"
          :title="$t(link.i18nKey)"
          class="k-interactive flex items-center gap-1.5 rounded-full border border-(--color-control-border) bg-(--color-control-bg) px-3 py-1 text-sm text-(--color-text-2) hover:text-(--color-text-1)">
          <KIcon :name="link.icon" class="text-base" />
          <span>{{ $t(link.i18nKey) }}</span>
        </a>
      </div>
    </div>
  </KCard>
</template>

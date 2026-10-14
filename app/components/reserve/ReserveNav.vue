<script setup lang="ts">
const nav = useNav();
const route = useRoute();
const localePath = useLocalePath();

// route.path 带语言前缀（prefix_except_default），先经 localePath 归一化再比较
const isActive = (to: string) => {
  const path = localePath(to);
  return route.path === path || route.path.startsWith(`${path}/`);
};
</script>

<template>
  <KCard :title="$t('reserve.nav')">
    <ul class="flex flex-col gap-1">
      <li v-for="item in nav" :key="item.to">
        <NuxtLinkLocale
          :to="item.to"
          class="k-interactive flex items-center gap-2 rounded-lg px-2 py-1.5"
          :class="isActive(item.to) ? 'bg-(--color-hover) font-bold' : 'text-(--color-text-2)'">
          <span class="min-w-0 flex-1 truncate">{{ item.shortTitle || item.title }}</span>
          <KIcon
            name="material-symbols:arrow-forward"
            class="shrink-0 text-sm text-(--color-text-4)" />
        </NuxtLinkLocale>
      </li>
    </ul>
  </KCard>
</template>

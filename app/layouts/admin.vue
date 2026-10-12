<script setup lang="ts">
const route = useRoute();

const items = [
  { to: '/admin', icon: 'key', label: '密钥' },
  { to: '/admin/r2', icon: 'upload', label: '文件上传' },
  { to: '/admin/ask-box', icon: 'forum', label: '提问箱审核' },
];
</script>

<template>
  <AppPage>
    <nav class="flex gap-2">
      <NuxtLinkLocale v-for="item in items" :key="item.to" :to="item.to" class="flex-1">
        <KButton
          block
          class="flex! items-center justify-center gap-2"
          :class="
            route.path.endsWith(item.to) ? 'text-(--color-theme)! border-(--color-theme)!' : ''
          ">
          <span class="material-symbols-outlined text-base! leading-none">{{ item.icon }}</span>
          {{ item.label }}
        </KButton>
      </NuxtLinkLocale>
    </nav>
    <slot />
  </AppPage>
</template>

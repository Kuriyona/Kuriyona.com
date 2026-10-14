<script setup lang="ts">
const route = useRoute();

const items = [
  { to: '/admin', icon: 'material-symbols:key', label: '密钥' },
  { to: '/admin/r2', icon: 'material-symbols:upload', label: '文件上传' },
  { to: '/admin/ask-box', icon: 'material-symbols:forum', label: '提问箱审核' },
  { to: '/admin/status', icon: 'material-symbols:map', label: '城市地图' },
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
          <KIcon :name="item.icon" class="text-base" />
          {{ item.label }}
        </KButton>
      </NuxtLinkLocale>
    </nav>
    <slot />
  </AppPage>
</template>

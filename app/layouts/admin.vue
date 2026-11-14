<script setup lang="ts">
import { adminNav } from '~/data/adminNav';

const route = useRoute();
const localePath = useLocalePath();

// 与顶栏标题共用同一份条目，改文案只改 app/data/adminNav.ts
const items = adminNav;

// 带语言前缀的路径也匹配（`/en/admin/r2`.endsWith('/admin/r2')）
const active = computed(() => items.find((item) => route.path.endsWith(item.to))?.to ?? '');

// 窄屏（< lg）顶部菜单：选中即跳转
const selected = ref(active.value || items[0]!.to);
watch(active, (value) => (selected.value = value || items[0]!.to));
watch(selected, (value) => {
  if (value && value !== active.value) navigateTo(localePath(value));
});
</script>

<template>
  <AppPage>
    <div class="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <!-- 窄屏：顶部菜单切换页面 -->
      <KSelect
        v-model="selected"
        :options="items.map((item) => ({ value: item.to, label: item.label }))"
        class="lg:hidden"
        aria-label="切换页面" />

      <!-- 宽屏：内容左侧的竖向导航（仍在内容容器内，不额外占宽） -->
      <nav class="hidden shrink-0 flex-col gap-2 self-start lg:sticky lg:top-28 lg:flex lg:w-36">
        <NuxtLinkLocale v-for="item in items" :key="item.to" :to="item.to">
          <KButton
            block
            class="flex! items-center justify-start! gap-2 whitespace-nowrap"
            :class="active === item.to ? 'text-(--color-theme)! border-(--color-theme)!' : ''">
            <KIcon :name="item.icon" class="text-base" />
            {{ item.label }}
          </KButton>
        </NuxtLinkLocale>
      </nav>

      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <slot />
      </div>
    </div>
  </AppPage>
</template>

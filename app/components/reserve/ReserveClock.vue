<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs';

// 语言参与依赖：切换语言后星期名要跟着变（dayjs 的 locale 由 app.vue 的 setLocale 维护）
const { locale } = useI18n();

// 时间只可能在客户端推进：SSR / 预渲染先渲染占位符，onMounted 后再赋值，
// 服务端产物与客户端首帧一致，不会触发 hydration 不匹配。
const now = ref<Dayjs | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  now.value = dayjs();
  timer = setInterval(() => {
    now.value = dayjs();
  }, 1000);
});

onUnmounted(() => clearInterval(timer));

const clock = computed(() => {
  void locale.value;
  if (!now.value) return null;
  return {
    time: now.value.format('HH:mm:ss'),
    date: now.value.format('YYYY-MM-DD dddd'),
  };
});
</script>

<template>
  <KCard>
    <div class="flex flex-col items-center gap-1 py-1">
      <p class="font-mono text-3xl tabular-nums">{{ clock?.time ?? '--:--:--' }}</p>
      <p class="text-xs text-(--color-text-3)">{{ clock?.date || '----------' }}</p>
    </div>
  </KCard>
</template>

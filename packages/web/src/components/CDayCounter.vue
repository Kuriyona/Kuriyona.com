<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
import dayjs from 'dayjs';

const { t } = useI18n();
const props = defineProps({
  title: String,
  up: {
    type: Boolean,
    default: true
  },
  date: String
});

// 计算天数差
const calculateDays = () => {
  const targetDate = dayjs(props.date);
  const currentDate = dayjs();

  if (props.up) {
    // 如果是向上计数（已开始天数）
    return Math.max(0, currentDate.diff(targetDate, 'day'));
  } else {
    // 如果是向下计数（剩余天数）
    return Math.max(0, targetDate.diff(currentDate, 'day'));
  }
};

const daysCount = calculateDays();
</script>

<template>
  <div class="border-2 border-white p-6 rounded-lg shadow-md text-center">
    <h3 class="text-2xl font-semibold mb-3 leading-none">
      {{ props.title }}
      <br />
      <span class="text-sm font-mono">
        ({{ dayjs(props.date).format('YYYY/MM/DD') }})
      </span>
    </h3>
    <div class="text-5xl font-bold text-shadow">
      <span class="font-mono">{{ daysCount }}</span>
      <span class="text-base text-gray-400 mb-2">{{
        t([' days', ' 天'])
      }}</span>
    </div>
    <br />
    <div class="text-sm">
      <span v-if="up">{{ t(['Started for', '已开始天数']) }}</span>
      <span v-else>{{ t(['Days remaining', '还剩天数']) }}</span>
    </div>
  </div>
</template>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}
</style>

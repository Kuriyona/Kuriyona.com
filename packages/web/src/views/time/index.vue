<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
import dayjs from 'dayjs';

const { t } = useI18n();
</script>

<template>
  <div class="container-time">
    <div class="card">
      <h2 class="text-2xl">HRT</h2>
      <p>
        {{ t(['started for', '第']) }}
        <span class="text-2xl">{{ dayjs().diff('2026/1/17', 'day') + 1 }}</span>
        {{ t(['days', '天']) }}
      </p>
    </div>
  </div>
</template>

<style lang="css" scoped>
.container-time {
  display: grid;
  place-items: center;
  padding: 20px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 20px;
  gap: 10px;
  background-color: #333;
}
</style>

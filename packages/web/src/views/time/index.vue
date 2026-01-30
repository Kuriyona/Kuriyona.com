<script setup lang="ts">
import CDayCounter from '@/components/CDayCounter.vue';
import { useI18n } from '@/scripts/i18n';
import dayjs from 'dayjs';

const { t } = useI18n();
</script>

<template>
  <div class="flex justify-center h-full p-4">
    <div class="w-160 grid gap-4">
      <CDayCounter title="HRT" date="2026-01-17" />
      <CDayCounter title="高考" date="2026-06-07" :up="false" />
      <CDayCounter title="生日" date="2026-06-28" :up="false" />
    </div>
  </div>
</template>

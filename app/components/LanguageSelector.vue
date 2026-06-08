<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
const { setLocale, locales, locale } = useI18n();
const currentLocale = computed(() => locales.value.find((l) => l.code == locale.value)?.name);
const selecting = ref(false);
</script>

<template>
  <VarMenuSelect v-model="selecting" variant="standard" placement="bottom-end">
    <VarButton text size="small">
      <div class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm!"> translate </span>
        <span class="text-sm!"> {{ currentLocale }} </span>
      </div>
    </VarButton>
    <template #options>
      <VarMenuOption
        v-for="locale in locales"
        :key="locale.code"
        @click="setLocale(locale.code)"
        :label="locale.name" />
    </template>
  </VarMenuSelect>
</template>

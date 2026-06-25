<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
const { setLocale, locales, locale } = useI18n();
const currentLocale = computed(() => locales.value.find((l) => l.code == locale.value)?.name);
const selecting = ref(false);
</script>

<template>
  <KMenu v-model="selecting" direction="bottom" align="end">
    <template #trigger>
      <VarButton text size="small">
        <div class="flex items-center gap-1">
          <span class="material-symbols-outlined text-sm!"> translate </span>
          <span class="text-sm! hidden sm:inline-block"> {{ currentLocale }} </span>
          <span
            class="material-symbols-outlined text-sm! transition-all duration-300"
            :class="{ 'rotate-180': selecting }">
            keyboard_arrow_down
          </span>
        </div>
      </VarButton>
    </template>
    <KButton
      v-for="locale in locales"
      :key="locale.code"
      block
      @click="
        setLocale(locale.code);
        selecting = false;
      "
      class="text-xs"
      >{{ locale.name }}
    </KButton>
  </KMenu>
</template>

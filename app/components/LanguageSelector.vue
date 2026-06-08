<script setup lang="ts">
import { useI18n } from '@/scripts/i18n';
const { setLocale, locales, locale } = useI18n();
const currentLocale = computed(() => locales.value.find((l) => l.code == locale.value)?.name);
const selecting = ref(false);
</script>

<template>
  <div class="relative z-10">
    <VarButton text size="small" @click="selecting = !selecting">
      <div class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm!"> translate </span>
        <span class="text-sm!"> {{ currentLocale }} </span>
        <span
          class="material-symbols-outlined text-sm! transition-all duration-300"
          :class="{ 'rotate-180': selecting }">
          keyboard_arrow_down
        </span>
      </div>
    </VarButton>
    <KCard v-if="selecting" class="absolute top-8 right-0 bg-black">
      <a>
        <p
          v-for="locale in locales"
          :key="locale.code"
          @click="
            setLocale(locale.code);
            selecting = false;
          "
          class="text-right text-nowrap">
          {{ locale.name }}
        </p>
      </a>
    </KCard>
  </div>
</template>

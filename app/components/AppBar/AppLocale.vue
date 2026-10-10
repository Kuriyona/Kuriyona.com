<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui';

const { locale, locales, setLocale } = useI18n();

const open = ref(false);

function isSelectTarget(event: any) {
  const original = event?.detail?.originalEvent ?? event;
  const target = original?.target as HTMLElement | null;
  return !!target?.closest?.('.k-select-content, [data-reka-select-viewport]');
}

// Keep the popover open while the nested Select popup is in use.
function guardOutside(event: any) {
  if (isSelectTarget(event)) event.preventDefault();
}

const currentLocale = computed({
  get: () => locale.value,
  set: (code: string) => {
    setLocale(code);
    open.value = false;
  },
});

const options = computed(() => locales.value.map((l) => ({ value: l.code, label: l.name })));
</script>

<template>
  <PopoverRoot v-model:open="open" :modal="false">
    <PopoverTrigger as-child>
      <KButton round :aria-label="$t('global.language')">
        <span class="material-symbols-outlined text-lg! leading-none"> translate </span>
      </KButton>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="end"
        side="bottom"
        :side-offset="8"
        class="z-600 rounded-lg border border-white/5 bg-black p-2 outline-none"
        @interact-outside="guardOutside"
        @pointer-down-outside="guardOutside"
        @focus-outside="guardOutside">
        <KSelect v-model="currentLocale" :options="options" :placeholder="$t('global.language')" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

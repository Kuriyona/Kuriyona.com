<script setup lang="ts">
const props = defineProps<{
  to?: string;
  text?: string;
  desc?: string;
  img?: string;
  new?: boolean;
  icon?: string;
  lang?: string;
}>();

const imgError = ref(false);
</script>

<template>
  <NuxtLinkLocale
    :to="props.to"
    :locale="props.lang as any"
    :target="props.new ? '_blank' : '_self'">
    <KCard
      class="hover:bg-white/5 transition-bg duration-300 h-full flex flex-col justify-center"
      v-bind="$attrs">
      <slot />
      <div v-if="!$slots.default" class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <template v-if="img">
            <img v-if="!imgError" @error="imgError = true" :src="img" class="w-8 h-8 rounded-2xl" />
            <span v-else class="material-symbols-outlined"> block </span>
          </template>
          <div v-if="!$slots.content">
            <p>{{ props.text }}</p>
            <p v-if="props.desc" class="text-sm text-white/50">{{ props.desc }}</p>
            <p v-if="props.to && props.new" class="text-xs text-white/50">{{ props.to }}</p>
          </div>
          <slot name="content" />
        </div>
        <span v-if="props.icon" class="material-symbols-outlined">{{ props.icon }}</span>
        <span v-else-if="!props.new" class="material-symbols-outlined"> arrow_forward </span>
        <span v-else class="material-symbols-outlined"> open_in_new </span>
      </div>
    </KCard>
  </NuxtLinkLocale>
</template>

<script setup lang="ts">
const props = defineProps({
  to: {
    type: String,
  },
  text: {
    type: String,
  },
  new: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <NuxtLinkLocale :to="props.to" :target="props.new ? '_blank' : '_self'">
    <slot />
    <var-card v-if="!$slots.default">
      <div class="flex justify-between items-center">
        <span>{{ props.text }}</span>
        <span v-if="!props.new" class="material-symbols-outlined"> arrow_forward </span>
        <span v-else class="material-symbols-outlined"> open_in_new </span>
      </div>
      <template #subtitle></template>
    </var-card>
  </NuxtLinkLocale>
</template>

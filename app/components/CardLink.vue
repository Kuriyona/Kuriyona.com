<script setup lang="ts">
const props = defineProps({
  to: {
    type: String,
  },
  text: {
    type: String,
  },
  img: {
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
    <var-card>
      <slot />
      <div v-if="!$slots.default" class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <img v-if="img" :src="img" class="w-8 h-8 rounded-2xl" />
          <span v-if="!$slots.content">{{ props.text }}</span>
          <slot name="content" />
        </div>
        <span v-if="!props.new" class="material-symbols-outlined"> arrow_forward </span>
        <span v-else class="material-symbols-outlined"> open_in_new </span>
      </div>
    </var-card>
  </NuxtLinkLocale>
</template>

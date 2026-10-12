<script setup lang="ts">
defineProps<{
  to: string;
  title: string;
  desc?: string;
  trans?: boolean;
}>();
</script>

<template>
  <KCardLink v-slot="{ LinkIcon }" :to="to" class="min-h-28">
    <div class="w-full h-full flex flex-col gap-2">
      <div>
        <p :class="trans ? 'trans-text text-xl font-bold' : 'text-xl font-bold'">
          {{ title }}
        </p>
        <p v-if="desc" class="text-sm text-(--color-text-3)">{{ desc }}</p>
      </div>
      <div class="mt-auto flex justify-end">
        <component :is="LinkIcon" class="text-(--color-text-4)" />
      </div>
    </div>
  </KCardLink>
</template>

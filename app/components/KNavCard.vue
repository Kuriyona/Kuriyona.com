<script setup lang="ts">
defineProps<{
  to: string;
  title: string;
  desc?: string;
  trans?: boolean;
}>();
</script>

<template>
  <KCardLink :to="to" class="min-h-28">
    <div class="w-full h-full flex flex-col gap-2">
      <div>
        <p :class="trans ? 'trans-text text-xl font-bold' : 'text-xl font-bold'">
          {{ title }}
        </p>
        <p v-if="desc" class="text-sm text-white/50">{{ desc }}</p>
      </div>
      <div class="mt-auto flex justify-end">
        <span
          class="icon material-symbols-outlined text-white/40 transition-transform duration-300 group-hover:[&_.icon]:scale-100 [&_.icon]:scale-90">
          arrow_forward
        </span>
      </div>
    </div>
  </KCardLink>
</template>

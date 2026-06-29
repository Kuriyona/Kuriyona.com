<script setup lang="ts">
import gsap from 'gsap';

const pageRef = useTemplateRef<HTMLDivElement>('pageRef');

onMounted(() => {
  const elements = pageRef.value?.querySelectorAll(':scope > *') || [];
  gsap.from(elements, {
    y: 100,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: 'power1.outOut',
  });
});
</script>

<template>
  <div class="flex justify-center min-h-[calc(100vh)] mt-25">
    <div class="w-200 max-w-full my-20 p-4 flex flex-col gap-4" ref="pageRef">
      <slot />
      <div class="flex-1"></div>
      <AppFooter />
    </div>
  </div>
</template>

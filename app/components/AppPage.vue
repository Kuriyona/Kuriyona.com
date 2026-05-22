<template>
  <div class="flex justify-center min-h-[calc(100vh)]">
    <div class="w-200 my-20 p-4 flex flex-col gap-4">
      <slot />
      <div class="flex-1"></div>
      <AppFooter />
    </div>
  </div>
</template>

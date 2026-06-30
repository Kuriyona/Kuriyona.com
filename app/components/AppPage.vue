<template>
  <div class="flex justify-center min-h-[calc(100vh)] mt-(--app-bar-height)">
    <div class="w-200 max-w-full my-20 p-4 flex flex-col gap-4">
      <slot />
      <div class="flex-1"></div>
      <AppFooter />
    </div>
  </div>
</template>

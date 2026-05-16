<template>
  <div class="flex justify-center min-h-[calc(100vh)]">
    <div class="w-160 my-20 p-4 flex flex-col gap-6">
      <slot />
      <div class="flex-1"></div>
      <var-divider :description="$t('global.about-site')" />
      <Footer />
    </div>
  </div>
</template>

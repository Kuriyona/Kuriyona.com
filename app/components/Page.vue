<template>
  <div class="flex justify-center h-full mt-[68px]">
    <div class="w-160 my-20 p-4 flex flex-col gap-4">
      <slot />
      <var-divider :description="$t('global.about-site')" />
      <Footer />
    </div>
  </div>
</template>

<template>
  <table class="k-table w-full">
    <slot />
  </table>
</template>

<style lang="css">
@reference "tailwindcss";

.k-table {
  @apply w-full;

  th {
    @apply pr-2 text-left text-nowrap;
  }

  td {
    @apply pl-2 text-right text-nowrap;
  }
}
</style>

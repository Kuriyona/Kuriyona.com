<template>
  <button
    class="k-interactive bg-(--color-control-bg) border border-(--color-control-border) rounded-md p-2 flex justify-center text-sm"
    :class="{
      'w-full': $attrs.block !== undefined,
      'rounded-full!': $attrs.round !== undefined,
    }">
    <slot></slot>
  </button>
</template>

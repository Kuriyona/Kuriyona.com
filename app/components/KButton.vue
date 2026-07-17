<template>
  <button
    class="backdrop-brightness-75 bg-black/10 backdrop-blur-xs rounded-md p-2 flex justify-center hover:bg-white/5 transition-bg duration-300 text-sm"
    :class="{
      'w-full': $attrs.block !== undefined,
      'rounded-full!': $attrs.round !== undefined,
    }">
    <slot></slot>
  </button>
</template>

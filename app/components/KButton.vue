<template>
  <button
    class="backdrop-brightness-75 bg-transparent backdrop-blur-lg rounded-md p-2 flex justify-center cursor-pointer hover:bg-white/5 transition-bg duration-300 text-sm"
    :class="{
      'w-full': $attrs.block !== undefined,
      'rounded-full!': $attrs.round !== undefined,
      'shadow-md shadow-white/2': $attrs.shadow !== undefined,
    }">
    <slot></slot>
  </button>
</template>

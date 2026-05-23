<template>
  <button
    class="backdrop-brightness-75 bg-transparent backdrop-blur-lg rounded-full p-2 flex justify-center cursor-pointer hover:bg-white/5 transition-bg duration-300 text-sm"
    :class="{
      'w-full': $attrs.block !== undefined,
      'rounded-[50%]': $attrs.round !== undefined,
    }">
    <slot></slot>
  </button>
</template>

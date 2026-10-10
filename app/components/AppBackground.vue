<script setup lang="ts">
import code from '@/assets/icons/code.svg';
import lambda from '@/assets/icons/lambda.svg';
import narutomaki from '@/assets/icons/narutomaki.svg';
import terminal from '@/assets/icons/terminal.svg';

// 两列错位平铺：列间距 / 行间距均为 GAP，tile = 2 × GAP
const GAP = 100;
const SIZE = 20;

// 第一列纵向排列两个；第二列整体下移 50% 间距（GAP / 2），同样排列两个
const icons = [
  { href: code, x: 20, y: 20, size: SIZE },
  { href: terminal, x: 20, y: 20 + GAP, size: SIZE },
  { href: lambda, x: 20 + GAP, y: 20 + GAP / 2, size: SIZE },
  { href: narutomaki, x: 20 + GAP, y: 20 + GAP + GAP / 2, size: SIZE },
];

const TILE = 2 * GAP;
</script>

<template>
  <div class="fixed top-0 left-0 w-full h-full z-[-1] select-none">
    <svg class="w-full h-full" aria-hidden="true">
      <defs>
        <pattern
          id="app-background-pattern"
          patternUnits="userSpaceOnUse"
          :width="TILE"
          :height="TILE">
          <image
            v-for="(icon, i) in icons"
            :key="i"
            :href="icon.href"
            :x="icon.x"
            :y="icon.y"
            :width="icon.size"
            :height="icon.size"
            class="app-background-icon" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#app-background-pattern)" />
    </svg>
  </div>
</template>

<style scoped>
.app-background-icon {
  filter: invert(1);
  opacity: 0.22;
}
</style>

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

// 光标光晕半径（视口像素），图标加亮范围与之一致
const GLOW_RADIUS = 300;

const { x, y } = useMouse({ type: 'client' });
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
        <!-- 光标处透明度 1，随距离线性衰减至半径处 0 -->
        <radialGradient
          id="app-background-glow-gradient"
          gradientUnits="userSpaceOnUse"
          :cx="x"
          :cy="y"
          :r="GLOW_RADIUS">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
        <mask
          id="app-background-glow-mask"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100%"
          height="100%">
          <rect width="100%" height="100%" fill="url(#app-background-glow-gradient)" />
        </mask>
      </defs>
      <!-- 基础灰：整体降透明度 -->
      <rect width="100%" height="100%" fill="url(#app-background-pattern)" class="app-background-base" />
      <!-- 加亮层：按距光标的距离百分比叠加白光 -->
      <rect
        width="100%"
        height="100%"
        fill="url(#app-background-pattern)"
        mask="url(#app-background-glow-mask)" />
    </svg>
    <div
      class="app-background-glow absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none"
      :style="{ transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)` }" />
  </div>
</template>

<style scoped>
.app-background-icon {
  filter: invert(1);
}

.app-background-base {
  opacity: 0.22;
}

.app-background-glow {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.06), transparent 70%);
}
</style>

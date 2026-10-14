<script setup lang="ts">
import code from '@/assets/icons/code.svg';
import lambda from '@/assets/icons/lambda.svg';
import narutomaki from '@/assets/icons/narutomaki.svg';
import terminal from '@/assets/icons/terminal.svg';
import {
  clampMotion,
  motionAt,
  randomMotion,
  stepMotion,
  type Motion,
} from '@/utils/highlightMotion';

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

// 背景亮度（改这几个常量即可调节）
const BASE_OPACITY = 0.1; // 图标默认亮度（整体降透明度）
const HIGHLIGHT_OPACITY = 0.4; // 鼠标模式加亮峰值亮度
// 触摸屏模式没有光标指路，加亮提升 50%（常量 = HIGHLIGHT_OPACITY × 1.5，写死避免浮点尾数）
const TOUCH_HIGHLIGHT_OPACITY = 0.6;
const HIGHLIGHT_RADIUS = 300; // 加亮衰减半径（视口像素）

// 触摸屏模式：高亮点移动速度（视口像素 / 秒）
const TOUCH_SPEED = 300;

type HighlightMode = 'touch' | 'mouse';

// 两种模式：
// - mouse：高亮点跟随光标（指针设备，原有行为）
// - touch：高亮点自视口随机位置沿 45/135/225/315° 移动，触边反弹（无光标的触摸屏）
// 初始按设备指针能力判定，之后由真实输入接管：非触摸指针移动 → mouse，触摸按下 → touch，
// 光标移出视口 → touch（从光标最后位置开始）。
const mode = ref<HighlightMode>('mouse');

// 触摸屏模式的运动状态。切到 mouse 时原样保留（= 保存状态），切回 touch 时继续用（= 恢复状态）。
const motion = ref<Motion | null>(null);

const { x: mouseX, y: mouseY } = useMouse({ type: 'client', touch: false });
const { width: viewportWidth, height: viewportHeight } = useWindowSize();

const highlightX = computed(() => (mode.value === 'mouse' ? mouseX.value : (motion.value?.x ?? 0)));
const highlightY = computed(() => (mode.value === 'mouse' ? mouseY.value : (motion.value?.y ?? 0)));
const highlightOpacity = computed(() =>
  mode.value === 'mouse' ? HIGHLIGHT_OPACITY : TOUCH_HIGHLIGHT_OPACITY,
);

let frameId = 0;
let lastTime = 0;

/** 首次进入触摸屏模式时创建随机起点 + 随机方向（视口尺寸未知时留到首帧） */
function ensureMotion() {
  if (motion.value) return;
  const width = viewportWidth.value;
  const height = viewportHeight.value;
  if (width > 0 && height > 0) motion.value = randomMotion(width, height);
}

function frame(time: number) {
  // 暂停后首帧 dt = 0，避免把停顿时间一次性算进位移
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
  lastTime = time;
  const width = viewportWidth.value;
  const height = viewportHeight.value;
  if (width > 0 && height > 0) {
    ensureMotion();
    if (motion.value) {
      // 就地推进（motion 是 ref 包裹的响应式对象，属性写入即触发重算）
      stepMotion(motion.value, dt, TOUCH_SPEED, width, height);
    }
  }
  frameId = requestAnimationFrame(frame);
}

function startLoop() {
  if (frameId) return;
  lastTime = 0;
  frameId = requestAnimationFrame(frame);
}

function stopLoop() {
  if (!frameId) return;
  cancelAnimationFrame(frameId);
  frameId = 0;
}

watch(mode, (value) => {
  if (value === 'mouse') {
    stopLoop();
    return;
  }
  // 没有历史状态（首次进入触摸屏模式）时才新建随机起点与方向
  ensureMotion();
  startLoop();
});

// 视口尺寸变化（移动端旋转 / 地址栏伸缩）后把高亮点夹回视口内
watch([viewportWidth, viewportHeight], ([width, height]) => {
  if (motion.value && width > 0 && height > 0) {
    clampMotion(motion.value, width, height);
  }
});

// 触摸输入（无光标）与指针输入（鼠标 / 触控笔）互相切换模式
function onPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'touch') mode.value = 'mouse';
}

function onPointerDown(event: PointerEvent) {
  if (event.pointerType === 'touch') mode.value = 'touch';
}

// 光标移出视口：没有光标可跟随了，从它最后所在位置接着走（随机对角方向），切到触摸屏模式
function onMouseLeaveDocument() {
  motion.value = motionAt(mouseX.value, mouseY.value);
  clampMotion(motion.value, viewportWidth.value, viewportHeight.value);
  mode.value = 'touch';
}

onMounted(() => {
  mode.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches ? 'mouse' : 'touch';
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('mouseleave', onMouseLeaveDocument);
});

onBeforeUnmount(() => {
  stopLoop();
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('mouseleave', onMouseLeaveDocument);
});
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
            :height="icon.size" />
        </pattern>
        <!-- 高亮处透明度 1，随距离线性衰减至半径处 0 -->
        <radialGradient
          id="app-background-highlight-gradient"
          gradientUnits="userSpaceOnUse"
          :cx="highlightX"
          :cy="highlightY"
          :r="HIGHLIGHT_RADIUS">
          <stop offset="0%" stop-color="#fff" :stop-opacity="highlightOpacity" />
          <stop offset="100%" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
        <mask
          id="app-background-highlight-mask"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100%"
          height="100%">
          <rect width="100%" height="100%" fill="url(#app-background-highlight-gradient)" />
        </mask>
      </defs>
      <!-- 基础灰：整体降透明度 -->
      <rect
        width="100%"
        height="100%"
        fill="url(#app-background-pattern)"
        :opacity="BASE_OPACITY" />
      <!-- 加亮层：按距高亮点的距离百分比叠加白光 -->
      <rect
        width="100%"
        height="100%"
        fill="url(#app-background-pattern)"
        mask="url(#app-background-highlight-mask)" />
    </svg>
  </div>
</template>

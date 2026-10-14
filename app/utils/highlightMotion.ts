/** 高亮点运动学（无 DOM 依赖，便于单独冒烟验证） */

export type Vector = { x: number; y: number };

/** 四个对角方向（屏幕坐标，y 轴向下）：45° / 135° / 225° / 315°，均为单位向量 */
export const DIAGONAL_DIRECTIONS: readonly Vector[] = [
  { x: Math.SQRT1_2, y: Math.SQRT1_2 }, // 45°：右下
  { x: -Math.SQRT1_2, y: Math.SQRT1_2 }, // 135°：左下
  { x: -Math.SQRT1_2, y: -Math.SQRT1_2 }, // 225°：左上
  { x: Math.SQRT1_2, y: -Math.SQRT1_2 }, // 315°：右上
];

/** 运动状态：位置 + 单位方向 */
export type Motion = Vector & { vx: number; vy: number };

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

/** 把位置夹回视口内（视口尺寸变化后调用；方向不变）。就地修改，避免每帧分配。 */
export function clampMotion(motion: Motion, width: number, height: number): Motion {
  motion.x = clamp(motion.x, 0, width);
  motion.y = clamp(motion.y, 0, height);
  return motion;
}

export function randomDirection(random: () => number = Math.random): Vector {
  return DIAGONAL_DIRECTIONS[Math.floor(random() * DIAGONAL_DIRECTIONS.length)]!;
}

/** 视口内随机起点（[0, width) × [0, height)） */
export function randomPosition(
  width: number,
  height: number,
  random: () => number = Math.random,
): Vector {
  return { x: random() * width, y: random() * height };
}

/** 视口内随机起点 + 随机对角方向 */
export function randomMotion(
  width: number,
  height: number,
  random: () => number = Math.random,
): Motion {
  const position = randomPosition(width, height, random);
  const direction = randomDirection(random);
  return { x: position.x, y: position.y, vx: direction.x, vy: direction.y };
}

/** 从指定位置以随机对角方向开始运动（例如光标移出视口后从最后位置接着走） */
export function motionAt(x: number, y: number, random: () => number = Math.random): Motion {
  const direction = randomDirection(random);
  return { x, y, vx: direction.x, vy: direction.y };
}

/**
 * 沿当前方向前进 speed × dt 像素，触及视口边缘（0 / width / height）时按轴翻转方向返回。
 * 结果夹在视口内：即使 dt 异常大（例如切后台回来）也不会跑出屏幕。
 * 就地修改传入的状态并返回它（每帧调用，不分配对象）。
 */
export function stepMotion(
  motion: Motion,
  dt: number,
  speed: number,
  width: number,
  height: number,
): Motion {
  const distance = speed * dt;
  let x = motion.x + motion.vx * distance;
  let y = motion.y + motion.vy * distance;

  if (x < 0 || x > width) {
    x = x < 0 ? -x : 2 * width - x;
    motion.vx = -motion.vx;
  }
  if (y < 0 || y > height) {
    y = y < 0 ? -y : 2 * height - y;
    motion.vy = -motion.vy;
  }

  motion.x = clamp(x, 0, width);
  motion.y = clamp(y, 0, height);
  return motion;
}

/**
 * 视觉令牌校验：对比度实测（WCAG 相对亮度公式）
 *
 * 直接从 app/assets/css/base.css 读取令牌，检查「已锁定的不变量」：
 *   1. 正文（--color-text-1）对 bg / surface-1..3 / inset 五个表面全部落在 7–12:1；
 *   2. 正文在控件（--color-control-bg 叠在各表面上）内 ≥7:1；
 *   3. 按钮上的正文在悬停 / 按下态仍满足 AA 4.5:1，控件描边与控件底面差 2–8 级；
 *   4. 毛玻璃最坏情况（背景纯白 + brightness）正文仍 ≥7:1。
 *
 * 改任何颜色令牌后跑一次：`bun scripts/check-contrast.ts`
 */
const CSS_PATH = new URL('../app/assets/css/base.css', import.meta.url).pathname;
const src = await Bun.file(CSS_PATH).text();

const token = (name: string) => {
  const m = src.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`令牌不存在: --${name}`);
  return m[1].trim();
};

const parseColor = (v: string): [number, number, number, number] => {
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = v.match(/^rgb\(([^)]+)\)$/);
  if (!rgb) throw new Error(`无法解析的颜色: ${v}`);
  const parts = rgb[1].split('/').map((s) => s.trim());
  const [r, g, b] = parts[0].split(/\s+/).map(Number);
  return [r, g, b, parts[1] ? Number(parts[1].replace('%', '')) / 100 : 1];
};

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const contrast = (a: number[], b: number[]) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
// fg 叠在 bg 上（bg 自身的 alpha 已由调用方保证为 1）
const over = (fg: number[], bg: number[]): number[] => {
  const a = fg[3];
  return [a * fg[0] + (1 - a) * bg[0], a * fg[1] + (1 - a) * bg[1], a * fg[2] + (1 - a) * bg[2], 1];
};
const rgbLabel = (c: number[]) =>
  `rgb(${c
    .slice(0, 3)
    .map((x) => Math.round(x))
    .join(' ')})`;

const failures: string[] = [];
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg);
};

const text = {
  1: parseColor(token('color-text-1')),
  2: parseColor(token('color-text-2')),
  3: parseColor(token('color-text-3')),
  4: parseColor(token('color-text-4')),
};
const surfaces: Record<string, number[]> = {
  bg: parseColor(token('color-bg')),
  L1: parseColor(token('color-surface-1')),
  L2: parseColor(token('color-surface-2')),
  L3: parseColor(token('color-surface-3')),
  inset: parseColor(token('color-surface-inset')),
};

// 毛玻璃：底色叠在「背景经 brightness 过滤」之上
const glass = parseColor(token('color-glass-bg'));
const brightness = Number(token('glass-filter').match(/brightness\(([\d.]+)\)/)![1]);
const glassOn = (backdrop: number[]) =>
  over(
    glass,
    backdrop.map((c) => c * brightness),
  );

console.log('# 表面上的正文对比度（契约：text-1 ∈ [7,12]，text-2/3 ≥ 4.5，text-4 ≥ 3）');
for (const [name, surface] of Object.entries(surfaces)) {
  const row = ([1, 2, 3, 4] as const).map(
    (t) => `text-${t} ${contrast(text[t], surface).toFixed(2)}`,
  );
  console.log(`  ${name.padEnd(6)} ${rgbLabel(surface).padEnd(16)} ${row.join('  ')}`);
  const c1 = contrast(text[1], surface);
  check(c1 >= 7 && c1 <= 12, `text-1 vs ${name} = ${c1.toFixed(2)} 不在 [7,12]`);
  for (const t of [2, 3] as const) {
    const c = contrast(text[t], surface);
    check(c >= 4.5, `text-${t} vs ${name} = ${c.toFixed(2)} < 4.5`);
  }
  check(contrast(text[4], surface) >= 3, `text-4 vs ${name} < 3`);
}

// 卡片层级必须可分辨：bg→L1 与 L2→L3 的通道差
const channelGap = (a: number[], b: number[]) => Math.round(b[0] - a[0]);
const bgToL1 = channelGap(surfaces.bg, surfaces.L1);
console.log(
  `\n# 层级分离：bg→L1 ${bgToL1} 级，L1→L2 ${channelGap(surfaces.L1, surfaces.L2)} 级，L2→L3 ${channelGap(surfaces.L2, surfaces.L3)} 级`,
);
check(bgToL1 >= 9, `bg→L1 分离不足: ${bgToL1} 级`);

// 控件：半透明底色必须在任何表面（含玻璃）上都让正文 ≥7:1
const control = parseColor(token('color-control-bg'));
const controlSurfaces: Record<string, number[]> = {
  ...surfaces,
  'glass(白底)': glassOn([255, 255, 255]),
  'glass(页底)': glassOn(surfaces.bg),
};
// .k-interactive 用 color-mix(base 94%/88%, white) —— 只提升 alpha
const lighten = (base: number[], keep: number) => [
  base[0],
  base[1],
  base[2],
  keep * base[3] + (1 - keep),
];

console.log('\n# 控件（静止 / hover / active）上的正文对比度');
for (const [name, surface] of Object.entries(controlSurfaces)) {
  const rest = over(control, surface);
  const hover = over(lighten(control, 0.94), surface);
  const active = over(lighten(control, 0.88), surface);
  const c = (bg: number[]) => contrast(text[1], bg).toFixed(2);
  console.log(
    `  over ${name.padEnd(11)} ${rgbLabel(rest).padEnd(15)} ${c(rest)} / ${c(hover)} / ${c(active)}`,
  );
  check(contrast(text[1], rest) >= 7, `text-1 on control over ${name} = ${c(rest)} < 7`);
  check(contrast(text[1], hover) >= 4.5, `text-1 hover over ${name} = ${c(hover)} < 4.5`);
  check(contrast(text[1], active) >= 4.5, `text-1 active over ${name} = ${c(active)} < 4.5`);
}

// 控件描边：与控件底面的亮度差（1px 细线，只需「有感但不抢眼」）
const border = parseColor(token('color-control-border'));
const controlOnBg = over(control, surfaces.bg);
const delta = over(border, surfaces.bg)[0] - controlOnBg[0];
console.log(`\n# 控件描边与控件底面差 ${delta.toFixed(1)} 级（期望 2–8）`);
check(delta >= 2 && delta <= 8, `控件描边差 ${delta.toFixed(1)} 级不在 [2,8]`);

// 毛玻璃最坏情况：内容为纯白时正文仍需 ≥7:1
const worst = glassOn([255, 255, 255]);
const worstContrast = contrast(text[1], worst);
console.log(
  `\n# 毛玻璃最坏情况（背景纯白）合成 ${rgbLabel(worst)}，text-1 ${worstContrast.toFixed(2)}`,
);
check(worstContrast >= 7, `玻璃上 text-1 = ${worstContrast.toFixed(2)} < 7`);

console.log(failures.length ? '\nFAIL' : '\nPASS');
for (const f of failures) console.log(' -', f);
if (failures.length) process.exit(1);

/**
 * 下载 OG 图渲染所需的字体到 `.cache/fonts/`（gitignored，不随仓库分发）。
 *
 * 渲染端（`generate-blog-og.ts`）用 resvg 的 `loadSystemFonts: false`，只认这批文件里的字体，
 * 所以本机装没装字体、装的是哪一版，都不影响出图结果。
 *
 * - `MapleMono-*`：拉丁字形（含西里尔 / 希腊 / 常见符号），也是默认字体
 * - `NotoSansSC/TC/JP-*`：中日韩字形（Maple Mono 不含 CJK），按文章语言各取一份
 * - Regular 与 Bold 都要：版式（svg-toolkit 生成的 SVG）里文本是 `font-weight: bold`，
 *   缺 Bold 时 resvg 只会退到 Regular（它不做合成加粗），字重会整体变细
 *
 * 用法：`bun scripts/download-fonts.ts [--force]`（默认跳过已存在的文件）
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { unzipSync } from 'fflate';

const FONTS_DIR = path.resolve(import.meta.dirname, '../.cache/fonts');
const force = process.argv.includes('--force');

const WEIGHTS = ['Regular', 'Bold'] as const;
const CJK_VARIANTS = ['SC', 'TC', 'JP'] as const;

// Maple Mono 只发 zip，没有单个字重的直链（release 里的 `MapleMono-TTF.zip` 约 1.8 MB，一次取回再挑）
const MAPLE_ZIP =
  'https://github.com/subframe7536/maple-font/releases/download/v7.9/MapleMono-TTF.zip';
// Noto Sans CJK 的官方地区子集（SC/TC/JP 各自一份，字形按当地写法，不是同一份换标签）
const NOTO_BASE = 'https://raw.githubusercontent.com/notofonts/noto-cjk/Sans2.004/Sans/SubsetOTF';

const ZIP_ENTRIES = WEIGHTS.map((weight) => `MapleMono-${weight}.ttf`);
const DIRECT_FILES = CJK_VARIANTS.flatMap((variant) =>
  WEIGHTS.map((weight) => {
    const name = `NotoSans${variant}-${weight}`;
    return { file: `${name}.otf`, url: `${NOTO_BASE}/${variant}/${name}.otf` };
  }),
);

async function download(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`下载失败 ${res.status} ${res.statusText}：${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function save(file: string, data: Uint8Array | undefined) {
  if (!data?.length) throw new Error(`字体数据为空：${file}`);
  await fs.writeFile(path.join(FONTS_DIR, file), data);
  console.log(`✓ ${file} (${(data.length / 1024 / 1024).toFixed(1)} MB)`);
}

await fs.mkdir(FONTS_DIR, { recursive: true });

const exists = async (file: string) => !force && (await fs.exists(path.join(FONTS_DIR, file)));

// Maple Mono：一个 zip 里挑出需要的字重
const missingEntries: string[] = [];
for (const file of ZIP_ENTRIES) {
  if (await exists(file)) console.log(`· 已存在 ${file}`);
  else missingEntries.push(file);
}
if (missingEntries.length > 0) {
  const archive = unzipSync(await download(MAPLE_ZIP), {
    filter: (entry) => missingEntries.includes(entry.name),
  });
  for (const file of missingEntries) await save(file, archive[file]);
}

// Noto Sans CJK：逐个直链下载
for (const { file, url } of DIRECT_FILES) {
  if (await exists(file)) {
    console.log(`· 已存在 ${file}`);
    continue;
  }
  await save(file, await download(url));
}

console.log(`字体目录：${FONTS_DIR}`);

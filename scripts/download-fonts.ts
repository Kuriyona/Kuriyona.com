/**
 * 下载 OG 图渲染所需的字体到 `.cache/fonts/`（gitignored，不随仓库分发）。
 *
 * 渲染端（`generate-blog-og.ts`）用 resvg 的 `loadSystemFonts: false`，只认这批文件里的字体，
 * 所以本机装没装字体、装的是哪一版，都不影响出图结果。
 *
 * - `MapleMono-NF-CN-*`：中英文字形统一用这一款（CN 变体自带中日韩字形），也是默认字体
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

// Maple Mono 只发 zip，没有单个字重的直链（`MapleMono-NF-CN.zip` 约 160 MB，一次取回再挑）
const MAPLE_ZIP =
  'https://github.com/subframe7536/maple-font/releases/download/v7.9/MapleMono-NF-CN.zip';

const ZIP_ENTRIES = WEIGHTS.map((weight) => `MapleMono-NF-CN-${weight}.ttf`);

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

console.log(`字体目录：${FONTS_DIR}`);

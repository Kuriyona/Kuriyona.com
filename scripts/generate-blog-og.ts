/**
 * 生成 OG 图到 `.cache/og/`（gitignored）：
 *   bun scripts/generate-blog-og.ts          → 站点默认图（除博客详情页外的所有页面）
 *   bun scripts/generate-blog-og.ts <slug>   → 该文章各语言版本的详情页图
 * 首次先跑 `bun scripts/download-fonts.ts` 取字体。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { compileLayout, renderPNG, renderSVG } from '@kuriyona/svg-toolkit';
import type { FontConfig, LayoutDefinition } from '@kuriyona/svg-toolkit';
import { getArticles } from '../server/utils';
import type { Article } from '../server/utils';
import dayjs from 'dayjs';

const WIDTH = 1200;
const HEIGHT = 630;
const BG = '#f0f0f0';
const CONTENT_W = WIDTH - 60 * 2;

const FONTS_DIR = path.resolve(import.meta.dirname, '../.cache/fonts');
const OG_DIR = path.resolve(import.meta.dirname, '../.cache/og');

// 中英文统一用 Maple Mono NF CN（CN 变体自带中日韩字形，不再额外挂 Noto Sans）
const MAPLE_MONO = 'Maple Mono NF CN';

const L10N: Record<string, { langPrefix: string; wordLabel: string }> = {
  en: { langPrefix: 'Languages:', wordLabel: 'words' },
  ja: { langPrefix: '記事の言語：', wordLabel: '字' },
  'zh-Hans': { langPrefix: '文章语言：', wordLabel: '字' },
  'zh-Hant': { langPrefix: '文章語言：', wordLabel: '字' },
};

// 根字体配置随 layout 下传：文本节点的 font 逐键覆盖，字体文件与光栅器选项只在这里给一次
const rootFont = (fontFiles: string[], defaultFontFamily = MAPLE_MONO): FontConfig => ({
  loadSystemFonts: false,
  fontFiles,
  defaultFontFamily,
  serifFamily: MAPLE_MONO,
  sansSerifFamily: MAPLE_MONO,
  cursiveFamily: MAPLE_MONO,
  fantasyFamily: MAPLE_MONO,
  monospaceFamily: MAPLE_MONO,
});

function isWide(c: string): boolean {
  const code = c.charCodeAt(0);
  return (
    (code >= 0x1100 && code <= 0x11ff) ||
    (code >= 0x2e80 && code <= 0x2fff) ||
    (code >= 0x3000 && code <= 0x30ff) ||
    (code >= 0x3130 && code <= 0x318f) ||
    (code >= 0x3400 && code <= 0x9fff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff01 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x1b000 && code <= 0x1b0ff) ||
    (code >= 0x20000 && code <= 0x2fa1f)
  );
}

// Maple Mono NF CN 是等宽字体：拉丁 / 半角 0.6em，CJK / 全角 1.2em（含全角标点）。
// 这里只是估算换行宽度，按字体实际 advance 取，写小了中日文行会超出正文列
const LATIN_RATIO = 0.6;
const WIDE_RATIO = 1.2;

function splitText(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = [];
  let rest = text;

  while (rest.length > 0) {
    if (lines.length >= 3 && rest) {
      const ellipsisW = fontSize * LATIN_RATIO;
      let width = 0;
      let cut = 0;
      while (cut < rest.length) {
        const w = fontSize * (isWide(rest[cut]) ? WIDE_RATIO : LATIN_RATIO);
        if (width + w + ellipsisW > maxWidth) break;
        width += w;
        cut++;
      }
      lines[2] = rest.slice(0, Math.max(1, cut)) + '…';
      break;
    }

    let width = 0;
    let lastSpace = -1;
    let brk = -1;

    for (let i = 0; i < rest.length; i++) {
      width += fontSize * (isWide(rest[i]) ? WIDE_RATIO : LATIN_RATIO);
      if (rest[i] === ' ') lastSpace = i;
      if (width > maxWidth) {
        brk = lastSpace > 0 ? lastSpace : Math.max(1, i);
        break;
      }
    }

    if (brk < 0) {
      lines.push(rest);
      break;
    }
    lines.push(rest.slice(0, brk));
    rest = rest.slice(brk).trimStart();
  }

  return lines;
}

function buildLayout(article: Article, fontFiles: string[]): LayoutDefinition {
  const cfg = L10N[article.lang] ?? L10N.en;
  const titleLines = splitText(article.title, CONTENT_W, 64);
  const descLines = splitText(article.desc, CONTENT_W, 48);

  const dateStr = dayjs(article.date).format('YYYY-MM-DD');
  const readingTime = `${Math.ceil(article.readingTime.minutes)} mins · ${article.readingTime.words} ${cfg.wordLabel}`;
  const info = `${dateStr} · ${readingTime}`;

  return {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: BG,
    font: rootFont(fontFiles),
    flexDirection: 'column',
    padding: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [
      {
        type: 'container',
        flexDirection: 'column',
        children: [
          {
            type: 'text' as const,
            content: `Kuriyona\'s Space / 文章`,
            fontSize: 32,
            height: 40,
            color: 'black',
          },
          {
            type: 'container' as const,
            height: 20,
          },
          ...titleLines.map((line) => ({
            type: 'text' as const,
            content: line,
            fontSize: 64,
            height: 68,
            color: 'black',
          })),
          {
            type: 'container' as const,
            height: 20,
          },
          ...descLines.map((line) => ({
            type: 'text' as const,
            content: line,
            fontSize: 48,
            height: 52,
            color: 'black',
          })),
        ],
      },
      {
        type: 'container' as const,
        flexGrow: 1,
      },
      {
        type: 'container' as const,
        flexDirection: 'column' as const,
        gap: 8,
        children: [
          {
            type: 'text' as const,
            content: info,
            fontSize: 32,
            height: 40,
            color: 'black',
          },
          {
            type: 'text' as const,
            content: `-> https://Kuriyona.com/blog/${article.slug}`,
            fontSize: 32,
            height: 40,
            color: 'black',
          },
        ],
      },
    ],
  };
}

// 站点默认 OG 图（除博客详情页外的所有页面）：居中两行
function buildDefaultLayout(fontFiles: string[]): LayoutDefinition {
  return {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: BG,
    font: rootFont(fontFiles),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    children: [
      // 文本节点没有文本测量，宽度算 0：靠 alignItems: center 把它摆到画布中点，
      // 再用 textAnchor: 'middle' 让文字以该点为中轴对称（否则 x 是左端、文字会溢出右边界）
      {
        type: 'text',
        content: "Kuriyona's Space",
        fontSize: 104,
        height: 120,
        color: 'black',
        textAnchor: 'middle',
      },
      {
        type: 'text',
        content: 'https://Kuriyona.com ->',
        fontSize: 48,
        height: 56,
        color: 'black',
        textAnchor: 'middle',
      },
    ],
  };
}

// 版式（svg-toolkit 生成的 SVG）里文本一律 `font-weight: bold`，Regular/Bold 都要给：
// 缺 Bold 时 resvg 会退到 Regular（它不做合成加粗），整张图字重会变细
const WEIGHTS = ['Regular', 'Bold'];

async function resolveFontFiles(): Promise<string[]> {
  const files = WEIGHTS.map((weight) =>
    path.join(FONTS_DIR, `MapleMono-NF-CN-${weight}.ttf`),
  );

  for (const file of files) {
    if (await fs.exists(file)) continue;
    console.error(`缺少字体：${file}\n先运行：bun scripts/download-fonts.ts`);
    process.exit(1);
  }
  return files;
}

/** 出图到 `<basePath>.svg` 与 `<basePath>.jpg`（JPEG 质量 80） */
async function renderTo(basePath: string, layout: LayoutDefinition) {
  const doc = compileLayout(layout);
  const svgString = renderSVG(doc);
  await fs.mkdir(path.dirname(basePath), { recursive: true });

  const svgPath = `${basePath}.svg`;
  await fs.writeFile(svgPath, svgString, 'utf-8');
  console.log(`✓ ${svgPath}`);

  // resvg 只能出 PNG，再交给 Bun.Image 编码 JPEG（质量 80）；PNG 不落盘。
  // OG 图用 JPEG 而不是 WebP：部分社交平台爬虫不渲染 WebP 预览卡片
  const png = await renderPNG(svgString, doc.font);
  const bytes = await new Bun.Image(png).jpeg({ quality: 80 }).bytes();
  const jpgPath = `${basePath}.jpg`;
  await fs.writeFile(jpgPath, bytes);
  console.log(`✓ ${jpgPath} (${(bytes.byteLength / 1024).toFixed(1)} KiB)`);
}

const slug = process.argv[2];

if (!slug) {
  await renderTo(path.join(OG_DIR, 'default'), buildDefaultLayout(await resolveFontFiles()));
} else {
  const articles = await getArticles();
  const filtered = articles.filter((a) => a.slug === slug);

  if (filtered.length === 0) {
    console.error(`Article not found: ${slug}`);
    process.exit(1);
  }

  for (const article of filtered) {
    const fontFiles = await resolveFontFiles();
    await renderTo(path.join(OG_DIR, slug, article.lang), buildLayout(article, fontFiles));
  }
}

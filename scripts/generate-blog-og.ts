/**
 * 生成 OG 图到 `.cache/og/`（gitignored）：
 *   bun scripts/generate-blog-og.ts          → 站点默认图（除博客详情页外的所有页面）
 *   bun scripts/generate-blog-og.ts <slug>   → 该文章各语言版本的详情页图
 * 首次先跑 `bun scripts/download-fonts.ts` 取字体。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { compileLayout, renderSVG } from '@kuriyona/yona-svg';
import type { LayoutDefinition } from '@kuriyona/yona-svg';
import { Article, getArticles } from '../server/utils';
import dayjs from 'dayjs';

const WIDTH = 1200;
const HEIGHT = 630;
const BG = '#f0f0f0';
const CONTENT_W = WIDTH - 60 * 2;

const FONTS_DIR = path.resolve(import.meta.dirname, '../.cache/fonts');
const OG_DIR = path.resolve(import.meta.dirname, '../.cache/og');

// 所有文本默认优先 Maple Mono；它不含中日韩字形，非英文文章再挂一份对应地区的 Noto Sans CJK
// （resvg 逐字回退：Maple Mono 有的字形用它，没有的落到列表里下一个字体）
const MAPLE_MONO = 'Maple Mono';
const CJK_VARIANT: Record<string, string> = { ja: 'JP', 'zh-Hans': 'SC', 'zh-Hant': 'TC' };

const L10N: Record<string, { langPrefix: string; wordLabel: string }> = {
  en: { langPrefix: 'Languages:', wordLabel: 'words' },
  ja: { langPrefix: '記事の言語：', wordLabel: '字' },
  'zh-Hans': { langPrefix: '文章语言：', wordLabel: '字' },
  'zh-Hant': { langPrefix: '文章語言：', wordLabel: '字' },
};

const fontStack = (lang: string) => {
  const variant = CJK_VARIANT[lang];
  return variant ? `${MAPLE_MONO}, Noto Sans ${variant}` : MAPLE_MONO;
};

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

function splitText(text: string, maxWidth: number, fontSize: number): string[] {
  const cw = (c: string) => (isWide(c) ? fontSize : fontSize * 0.6);
  const lines: string[] = [];
  let rest = text;

  while (rest.length > 0) {
    if (lines.length >= 3 && rest) {
      const last = rest.slice(0, Math.max(1, Math.floor((maxWidth - cw('…')) / cw(rest[0])))) + '…';
      lines[2] = last;
      break;
    }

    let width = 0;
    let lastSpace = -1;
    let brk = -1;

    for (let i = 0; i < rest.length; i++) {
      width += cw(rest[i]);
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

function buildLayout(article: Article): LayoutDefinition {
  const cfg = L10N[article.lang] ?? L10N.en;
  const font = fontStack(article.lang);
  const titleLines = splitText(article.title, CONTENT_W, 64);
  const descLines = splitText(article.desc, CONTENT_W, 48);

  const dateStr = dayjs(article.date).format('YYYY-MM-DD');
  const readingTime = `${Math.ceil(article.readingTime.minutes)} mins · ${article.readingTime.words} ${cfg.wordLabel}`;
  const info = `${dateStr} · ${readingTime}`;

  return {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: BG,
    flexDirection: 'column',
    padding: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [
      {
        type: 'container',
        flexDirection: 'column',
        children: [
          {
            type: 'text' as const,
            content: `Kuriyona\'s Space / Blog`,
            fontSize: 32,
            height: 40,
            fontFamily: MAPLE_MONO,
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
            fontFamily: font,
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
            fontFamily: font,
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
            fontFamily: font,
            color: 'black',
          },
          {
            type: 'text' as const,
            content: `-> https://Kuriyona.com/blog/${article.slug}`,
            fontSize: 32,
            height: 40,
            fontFamily: MAPLE_MONO,
            color: 'black',
          },
        ],
      },
    ],
  };
}

// 站点默认 OG 图（除博客详情页外的所有页面）：居中两行
function buildDefaultLayout(): LayoutDefinition {
  return {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: BG,
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
        fontFamily: MAPLE_MONO,
        color: 'black',
        textAnchor: 'middle',
      },
      {
        type: 'text',
        content: 'https://Kuriyona.com ->',
        fontSize: 48,
        height: 56,
        fontFamily: MAPLE_MONO,
        color: 'black',
        textAnchor: 'middle',
      },
    ],
  };
}

// 版式（yona-svg 生成的 SVG）里文本一律 `font-weight: bold`，Regular/Bold 都要给：
// 缺 Bold 时 resvg 会退到 Regular（它不做合成加粗），整张图字重会变细
const WEIGHTS = ['Regular', 'Bold'];

async function resolveFontFiles(lang: string): Promise<string[]> {
  const variant = CJK_VARIANT[lang];
  const files = WEIGHTS.map((weight) => path.join(FONTS_DIR, `MapleMono-${weight}.ttf`));
  if (variant)
    files.push(
      ...WEIGHTS.map((weight) => path.join(FONTS_DIR, `NotoSans${variant}-${weight}.otf`)),
    );

  for (const file of files) {
    if (await fs.exists(file)) continue;
    console.error(`缺少字体：${file}\n先运行：bun scripts/download-fonts.ts`);
    process.exit(1);
  }
  return files;
}

/** 出图到 `<basePath>.svg` 与 `<basePath>.png` */
async function renderTo(basePath: string, fontFiles: string[], layout: LayoutDefinition) {
  const svgString = renderSVG(compileLayout(layout));
  await fs.mkdir(path.dirname(basePath), { recursive: true });

  const svgPath = `${basePath}.svg`;
  await fs.writeFile(svgPath, svgString, 'utf-8');
  console.log(`✓ ${svgPath}`);

  const resvg = new Resvg(svgString, {
    font: {
      // 不读系统字体：出图结果只取决于 .cache/fonts 里那几份文件
      loadSystemFonts: false,
      fontFiles,
      defaultFontFamily: MAPLE_MONO,
      serifFamily: MAPLE_MONO,
      sansSerifFamily: MAPLE_MONO,
      cursiveFamily: MAPLE_MONO,
      fantasyFamily: MAPLE_MONO,
      monospaceFamily: MAPLE_MONO,
    },
  });

  const pngPath = `${basePath}.png`;
  await fs.writeFile(pngPath, resvg.render().asPng());
  console.log(`✓ ${pngPath}`);
}

const slug = process.argv[2];

if (!slug) {
  // 默认 OG 图只有拉丁字符，给 Maple Mono 即可
  await renderTo(path.join(OG_DIR, 'default'), await resolveFontFiles('en'), buildDefaultLayout());
} else {
  const articles = await getArticles();
  const filtered = articles.filter((a) => a.slug === slug);

  if (filtered.length === 0) {
    console.error(`Article not found: ${slug}`);
    process.exit(1);
  }

  for (const article of filtered) {
    const fontFiles = await resolveFontFiles(article.lang);
    await renderTo(path.join(OG_DIR, slug, article.lang), fontFiles, buildLayout(article));
  }
}

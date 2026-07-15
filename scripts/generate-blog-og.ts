import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { compileLayout, renderSVG } from '@kuriyona/yona-svg';
import type { LayoutDefinition } from '@kuriyona/yona-svg';
import { Article, getArticles } from '../server/utils';
import dayjs from 'dayjs';

const WIDTH = 1200;
const HEIGHT = 630;
const BG = '#f0f0f0';

const L10N: Record<string, { label: string; font: string; langPrefix: string; wordLabel: string }> =
  {
    en: {
      label: 'English',
      font: 'Outfit, Georgia, serif',
      langPrefix: 'Languages:',
      wordLabel: 'words',
    },
    ja: {
      label: '日本語',
      font: "'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif",
      langPrefix: '記事の言語：',
      wordLabel: '字',
    },
    'zh-Hans': {
      label: '简体中文',
      font: "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif",
      langPrefix: '文章语言：',
      wordLabel: '字',
    },
    'zh-Hant': {
      label: '繁體中文',
      font: "'Noto Sans SC','PingFang TC','Microsoft JhengHei',sans-serif",
      langPrefix: '文章語言：',
      wordLabel: '字',
    },
  };

const CONTENT_W = WIDTH - 60 * 2;

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

function buildLayout(article: Article, availableLangs: string[]): LayoutDefinition {
  const cfg = L10N[article.lang] ?? L10N.en;
  const font = cfg.font;
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
            fontFamily: 'JetBrains Mono',
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
            content: `-> https://Kuriyona.com/blog/${slug}`,
            fontSize: 32,
            height: 40,
            fontFamily: 'JetBrains Mono',
            color: 'black',
          },
        ],
      },
    ],
  };
}

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: bun run scripts/generate-blog-og.ts <slug>');
  process.exit(1);
}

const articles = await getArticles();
const filtered = articles.filter((a) => a.slug === slug);

if (filtered.length === 0) {
  console.error(`Article not found: ${slug}`);
  process.exit(1);
}

const availableLangs = filtered.map((a) => a.lang);

const outDir = path.resolve(process.cwd(), 'temp');
await fs.mkdir(outDir, { recursive: true });

for (const article of filtered) {
  const layout = buildLayout(article, availableLangs);
  const doc = compileLayout(layout);
  const svgString = renderSVG(doc);

  const svgPath = path.join(outDir, `og-${slug}-${article.lang}.svg`);
  await fs.writeFile(svgPath, svgString, 'utf-8');
  console.log(`✓ ${svgPath}`);

  const pngBuffer = await sharp(Buffer.from(svgString)).png().toBuffer();
  const pngPath = path.join(outDir, `og-${slug}-${article.lang}.png`);
  await fs.writeFile(pngPath, pngBuffer);
  console.log(`✓ ${pngPath}`);
}

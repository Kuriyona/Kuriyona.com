import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);
import { create } from 'xmlbuilder2';
import sharp from 'sharp';

// 定义卡片尺寸和样式常量
const WIDTH = 1280;
const HEIGHT = 640;
const BG_COLOR = '#f0f0f0';
const TEXT_COLOR = 'black';
const FONT_FAMILY = "'JetBrains Mono', 'Noto Sans SC', 'Noto Sans JP', sans-serif";

const MARGIN_Y = 40;
const MARGIN_LEFT = 60; // 统一的左侧边距;
const TITLE_SIZE = 64;
const TITLE_LINE_HEIGHT = 80;
const SUBTITLE_SIZE = 32;
const SUBTITLE_LINE_HEIGHT = 40;
const DESCRIPTION_SIZE = 48;
const DESCRIPTION_LINE_HEIGHT = 60;
const EXTRA_SIZE = 32;
const EXTRA_LINE_HEIGHT = 40;

const START_Y = MARGIN_Y + TITLE_LINE_HEIGHT; // 顶部边距（标题高度底部）
const END_Y = HEIGHT - MARGIN_Y; // 底部边距（描述高度顶部）

const texts = {
  title: "I'm Kuriyona",
  subtitle: [
    "Lin'an, Hangzhou, China",
    'Kuriyona reads as クリヨナ/[kɯ̹ɾʲijona]',
    'Just call me Kuriyona or 未晞(Weixi/ウェイシー).',
  ],
  description: [
    'A cute girl who is a 17-year-old',
    'Chinese senior high school student,',
    'otaku, casual anime fan, MtF',
    'and an interest-driven developer.',
  ],
  extra: ['more on my website', '-> https://Kuriyona.com'],
};

const textLines = [] as {
  text: string;
  fontSize: number;
  x: number;
  y: number;
  textAnchor: string;
  dominantBaseline: string;
}[];

const SUBTITLE_HEIGHT = SUBTITLE_LINE_HEIGHT * texts.subtitle.length;
const DESCRIPTION_HEIGHT = DESCRIPTION_LINE_HEIGHT * texts.description.length;
const EXTRA_HEIGHT = EXTRA_LINE_HEIGHT * 1;

const GAP = (END_Y - START_Y - SUBTITLE_HEIGHT - DESCRIPTION_HEIGHT - EXTRA_HEIGHT) / 3;
console.log('GAP', GAP);

const push = (text: string, fontSize: number, y: number, x?: number, textAnchor?: string) => {
  textLines.push({
    text,
    fontSize,
    x: x || MARGIN_LEFT,
    y,
    textAnchor: textAnchor || 'start',
    dominantBaseline: 'ideographic',
  });
};

let position = START_Y;
push(texts.title, TITLE_SIZE, position);
position += GAP;
for (const text of texts.subtitle) {
  position += SUBTITLE_LINE_HEIGHT;
  push(text, SUBTITLE_SIZE, position);
}
position += GAP;
for (const text of texts.description) {
  position += DESCRIPTION_LINE_HEIGHT;
  push(text, DESCRIPTION_SIZE, position);
}
position += GAP + EXTRA_LINE_HEIGHT;
push(texts.extra[0], EXTRA_SIZE, position);
push(texts.extra[1], EXTRA_SIZE, position, 1200, 'end');

const generateSVGCard = () => {
  const svg = create().ele('svg', {
    width: WIDTH,
    height: HEIGHT,
    xmlns: 'http://www.w3.org/2000/svg',
  });

  svg.ele('rect', {
    width: WIDTH,
    height: HEIGHT,
    fill: BG_COLOR,
  });

  const style = svg.ele('style');
  style.txt(`
    text {
      font-family: ${FONT_FAMILY};
      font-weight: bold;
      fill: ${TEXT_COLOR};
    }
  `);

  // 循环添加文本元素
  for (const line of textLines) {
    const textElem = svg.ele('text', {
      x: line.x,
      y: line.y,
      'font-size': line.fontSize,
      'text-anchor': line.textAnchor,
      'dominant-baseline': line.dominantBaseline,
    });
    textElem.txt(line.text);
  }

  return svg.end({ prettyPrint: true });
};

const saveSVGToFile = async (filePath: string) => {
  const svgString = generateSVGCard();
  await fs.writeFile(filePath, svgString, 'utf8');
};

const temp = path.join(dirname, '../temp');

const outputPath = path.join(temp, 'intro.svg');
saveSVGToFile(outputPath);
console.log(`SVG 卡片已成功生成`);

const fileIntro = await sharp(path.join(temp, 'intro.svg')).toBuffer();
await fs.writeFile(path.join(temp, 'intro.png'), fileIntro);
console.log(`PNG 图片已成功生成`);

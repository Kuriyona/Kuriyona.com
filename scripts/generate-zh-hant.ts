import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Converter } from 'opencc-js';

const convert = Converter({ from: 'cn', to: 't' });

const blogRoot = join(import.meta.dirname, '..', 'app', 'content', 'blog');
const sourceDir = join(blogRoot, 'zh-Hans');
const targetDir = join(blogRoot, 'zh-Hant');

// 这些字段是数据而非文案，保持简体原值（aiReview 必须与 server/utils.ts 的枚举白名单一致）
const RAW_FRONTMATTER_KEYS: Record<string, true> = {
  date: true,
  edit: true,
  aiGenerated: true,
  aiReview: true,
};

// 行内代码原样保留，避免把代码里的中文一起转换
function convertText(text: string) {
  const codes: string[] = [];
  const masked = text.replace(/(`+)([^`]*?)\1/g, (code) => `\uE000${codes.push(code) - 1}\uE001`);
  return convert(masked).replace(/\uE000(\d+)\uE001/g, (_, index: string) => codes[Number(index)]);
}

function convertFrontmatter(frontmatter: string) {
  return frontmatter
    .split('\n')
    .map((line) => {
      const match = line.match(/^([A-Za-z][\w-]*):(\s*)(.*)$/);
      if (!match) return line;
      const [, key, space, value] = match;
      if (RAW_FRONTMATTER_KEYS[key]) return line;
      return `${key}:${space}${convertText(value)}`;
    })
    .join('\n');
}

function convertBody(body: string) {
  return body.split('\n').map(convertText).join('\n');
}

function convertMarkdown(source: string) {
  const header = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!header) return convertBody(source);
  return `---\n${convertFrontmatter(header[1])}\n---\n${convertBody(source.slice(header[0].length))}`;
}

const slugs = process.argv.slice(2);
const files = (await readdir(sourceDir)).filter(
  (file) => file.endsWith('.md') && (slugs.length === 0 || slugs.includes(file.slice(0, -3))),
);

await mkdir(targetDir, { recursive: true });

for (const file of files) {
  const source = await readFile(join(sourceDir, file), 'utf-8');
  await writeFile(join(targetDir, file), convertMarkdown(source), 'utf-8');
  console.log(`✓ zh-Hant/${file}`);
}

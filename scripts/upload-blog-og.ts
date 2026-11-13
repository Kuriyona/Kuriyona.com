/**
 * 把 `generate-blog-og.ts` 生成的 OG 图上传到 R2。
 *
 * 本地目录与对象键一一对应（前缀与城市地图同一个 `img/site/` 命名空间）：
 * `.cache/og/default.jpg` → `img/site/og/default.jpg`（站点默认图）
 * `.cache/og/<slug>/<lang>.jpg` → `img/site/og/<slug>/<lang>.jpg`（博客详情页）
 *
 * 用法：`bun scripts/upload-blog-og.ts [--dry-run]`
 * 需要根目录 `.env`（Bun 自动加载）里的 ENDPOINT / ACCESS_KEY_ID / SECRET_ACCESS_KEY / BUCKET_NAME。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { S3Client } from 'bun';

const OG_DIR = path.resolve(import.meta.dirname, '../.cache/og');
const KEY_PREFIX = 'img/site/og';
const DEFAULT_FILE = 'default.jpg';
const LANGS = ['en', 'ja', 'zh-Hans', 'zh-Hant'];
const dryRun = process.argv.includes('--dry-run');

if (!(await fs.exists(OG_DIR))) {
  console.error(`找不到 ${OG_DIR}\n先运行：bun scripts/generate-blog-og.ts`);
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.ACCESS_KEY_ID!,
  secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  bucket: process.env.BUCKET_NAME!,
});

let uploaded = 0;

async function upload(key: string, filePath: string) {
  uploaded++;

  if (dryRun) {
    console.log(`· ${key}`);
    return;
  }

  // 显式写 Content-Type：R2 不按扩展名猜，缺省会变成 application/octet-stream
  await s3.file(key, { type: 'image/jpeg' }).write(await fs.readFile(filePath));
  console.log(`✓ ${key}`);
}

const defaultPath = path.join(OG_DIR, DEFAULT_FILE);
if (await fs.exists(defaultPath)) await upload(`${KEY_PREFIX}/${DEFAULT_FILE}`, defaultPath);

for (const entry of await fs.readdir(OG_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  for (const lang of LANGS) {
    const filePath = path.join(OG_DIR, entry.name, `${lang}.jpg`);
    if (!(await fs.exists(filePath))) continue;

    await upload(`${KEY_PREFIX}/${entry.name}/${lang}.jpg`, filePath);
  }
}

console.log(`${dryRun ? '待上传' : '已上传'} ${uploaded} 个文件`);

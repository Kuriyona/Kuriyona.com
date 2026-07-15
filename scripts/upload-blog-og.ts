import fs from 'node:fs/promises';
import path from 'node:path';
import { S3Client } from 'bun';

const s3 = new S3Client({
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.ACCESS_KEY_ID!,
  secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  bucket: process.env.BUCKET_NAME!,
});

const temp = path.resolve(import.meta.dirname!, '../temp');

const files = await fs.readdir(temp);

const LANGS = ['en', 'ja', 'zh-Hans', 'zh-Hant'];

for (const file of files) {
  if (!file.startsWith('og-') || !file.endsWith('.png')) continue;

  const base = file.slice(3, -4);
  const lang = LANGS.find((l) => base.endsWith(`-${l}`));
  if (!lang) continue;
  const slug = base.slice(0, -lang.length - 1);

  const key = `static/og/blog/${slug}/${lang}.png`;
  const filePath = path.join(temp, file);
  const fileContent = await fs.readFile(filePath);
  await s3.file(key).write(fileContent);
  console.log(`✓ ${key}`);
}

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const localesDir = join(import.meta.dirname, '..', 'i18n', 'locales');

const files = await readdir(localesDir);

for (const file of files) {
  if (!file.endsWith('.json')) continue;

  const content = await readFile(join(localesDir, file), 'utf-8');
  const obj = JSON.parse(content.replace(/^\uFEFF/, ''));
  const sorted: Record<string, unknown> = {};

  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }

  await writeFile(join(localesDir, file), JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
  console.log(`✓ ${file}`);
}

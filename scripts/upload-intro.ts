import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);
import { upload } from '../server/utils';

const temp = path.join(dirname, '../temp');

const files = await fs.readdir(temp);

for (const file of files) {
  if (file) {
    const filePath = path.join(temp, file);
    const fileContent = await fs.readFile(filePath);
    await upload(fileContent, `static/intro/${file}`);
    console.log(`已上传：${file}`);
  }
}

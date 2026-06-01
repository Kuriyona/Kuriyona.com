import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);
import { download, upload } from '../server/utils';

import sharp from 'sharp';

// const fileAvatar = await download('img/avatar/Avatar_256.png');
// await fs.writeFile(path.join(dirname, '../temp/avatar.png'), Buffer.from(fileAvatar));

const fileIntro = await sharp(path.join(dirname, '../public/intro.svg')).toBuffer();
await fs.writeFile(path.join(dirname, '../temp/intro.png'), fileIntro);
await upload(fileIntro, 'static/intro/intro.png');

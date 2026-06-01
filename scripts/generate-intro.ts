import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);
import { upload } from '../server/utils';

import sharp from 'sharp';

const file = await sharp(path.join(dirname, '../public/intro.svg')).toBuffer();
await upload(file, 'static/intro/intro.png');

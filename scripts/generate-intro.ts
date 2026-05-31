import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);

import sharp from 'sharp';

sharp(path.join(dirname, '../public/intro.svg')).toFile(path.join(dirname, '../public/intro.png'));

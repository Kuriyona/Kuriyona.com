import Elysia from 'elysia';
import dayjs from 'dayjs';

import { S3Client } from 'bun';

const s3 = new S3Client({
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.ACCESS_KEY_ID!,
  secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  bucket: process.env.BUCKET_NAME!,
});

const app = new Elysia({ prefix: '/image' })
  .get('/list', async ({ params }) => {
    const list = await s3.list({
      prefix: 'image',
    });
    return list.contents;
  })
  .get('/upload-signed-url', async ({ query: { filename, mime, auth }, set }) => {
    if (auth !== process.env.AUTH_KEY) {
      set.status = 401;
      return null;
    }
    const key = `image/${dayjs().format('YYYY-MM')}/${dayjs().format('HH-mm-ss')}-${filename}`;
    const url = s3.presign(key, {
      type: mime,
      method: 'PUT',
    });
    return {
      url,
      key,
    };
  });

export { app as RouteImage };

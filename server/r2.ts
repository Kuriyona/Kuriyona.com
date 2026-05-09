import Elysia from 'elysia';
import dayjs from 'dayjs';

import { S3Client } from 'bun';

const s3 = new S3Client({
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.ACCESS_KEY_ID!,
  secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  bucket: process.env.BUCKET_NAME!,
});

const app = new Elysia({ prefix: '/r2' })
  .get('/list', async ({ params }) => {
    const list = await s3.list({
      prefix: 'static',
    });
    return list.contents;
  })
  .get('/upload-signed-url', async ({ query: { key, mime, auth }, set }) => {
    if (auth !== process.env.AUTH_KEY) {
      set.status = 401;
      return null;
    }
    const _key = `static/${key}`;
    const url = s3.presign(_key, {
      type: mime,
      method: 'PUT',
    });
    return {
      url,
      key,
    };
  });

export { app as RouterR2 };

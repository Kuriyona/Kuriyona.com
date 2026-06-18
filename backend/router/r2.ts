import Elysia from 'elysia';
import { validateAuth } from '../plugin/auth';
import { s3 } from '../utils';

const app = new Elysia({ prefix: '/r2' })
  .use(validateAuth)
  .get('/list', async () => {
    const list = await s3.list({
      prefix: 'static',
    });
    return list.contents;
  })
  .get('/upload-signed-url', async ({ query: { key, mime } }) => {
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

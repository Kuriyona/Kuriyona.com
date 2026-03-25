import { Elysia, t } from 'elysia';
import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);
import cors from '@elysiajs/cors';
import { RouteImage } from './image';
const Status = {
  awake: 'UNKNOWN',
  updateAt: new Date().getTime()
};

import { config } from 'dotenv';
config({ path: path.join(dirname, '.env') });

const app = new Elysia()
  .use(cors())
  .get('/', () => 'This API site of Kuriyona.com')
  .listen(62802);

app.use(RouteImage);

app.get('/status', () => Status);
app.get(
  '/status/update',
  async ({ query, set }) => {
    if (query.auth !== Bun.env.AUTH_KEY) {
      set.status = 401;
      return 'Unauthorized';
    }
    switch (query.status) {
      case 'awake':
        Status.awake = 'AWAKE';
        break;
      case 'sleep':
        Status.awake = 'SLEEP';
        break;
      default:
        Status.awake = 'UNKNOWN';
    }
    Status.updateAt = new Date().getTime();
    return 'OK';
  },
  {
    query: t.Object({
      auth: t.String(),
      status: t.String()
    })
  }
);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

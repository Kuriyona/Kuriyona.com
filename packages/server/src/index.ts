import { Elysia, t } from 'elysia';
import path from 'node:path';
import 'dotenv/config';
import cors from '@elysiajs/cors';
const Status = {
  awake: 'UNKNOWN',
  updateAt: new Date().getTime()
};
const AUTH_KEY = process.env.AUTH_KEY;
if (!AUTH_KEY) {
  throw new Error('AUTH_KEY is not set');
}

const app = new Elysia()
  .use(cors())
  .get('/', () => 'This API site of Kuriyota.com')
  .listen(62801);

app.get('/status', () => Status);
app.get(
  '/status/update',
  async ({ query, set }) => {
    if (query.auth !== AUTH_KEY) {
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

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

import { Elysia, t } from 'elysia';
import { RouteImage } from './image';
import { cors } from '@elysiajs/cors';

import 'dotenv/config';

const Status = {
  awake: 'UNKNOWN',
  updateAt: new Date().getTime(),
};

const app = new Elysia()
  .use(
    cors({
      origin: '*',
    }),
  )
  .get('/', () => 'This API site of Kuriyona.com')
  .get('/status', () => Status)
  .use(RouteImage)
  .get(
    '/status/update',
    async ({ query, set }) => {
      if (query.auth !== process.env.AUTH_KEY) {
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
        status: t.String(),
      }),
    },
  );

app.listen(62802);
console.log('Server is running on port 62802');

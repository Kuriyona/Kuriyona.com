import { Elysia, t } from 'elysia';
import { RouterR2 } from './r2';
import { RouteWeather } from './weather';
import { cors } from '@elysiajs/cors';

import 'dotenv/config';
import { RouteNekoApi } from './neko';
import { push } from './utils';

const app = new Elysia()
  .use(
    cors({
      origin: '*',
    }),
  )
  .get('/', () => 'This API site of Kuriyona.com')
  .use(RouterR2)
  .use(RouteWeather)
  .use(RouteNekoApi)
  .post(
    '/push',
    async ({ set, query: { auth }, body }) => {
      if (auth !== process.env.AUTH_KEY) {
        set.status = 401;
        return null;
      }
      return await push(body);
    },
    {
      body: t.Object({
        title: t.String(),
        message: t.String(),
        priority: t.Optional(t.Number()),
      }),
    },
  );

app.listen(62802);
console.log('Server is running on port 62802');

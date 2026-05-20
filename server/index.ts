import { Elysia, t } from 'elysia';
import { RouterR2 } from './r2';
import { RouteWeather } from './weather';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysia/jwt';

import 'dotenv/config';
import { RouteNekoApi } from './neko';
import { push, verifyTurnstile } from './utils';

const app = new Elysia()
  .use(
    cors({
      origin: '*',
    }),
  )
  .use(
    jwt({
      name: 'jwt',
      secret: Math.random().toString(36),
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
        content: t.String(),
      }),
    },
  )
  .get(
    '/turnstile',
    async ({ jwt, query: { token } }) => {
      const result = await verifyTurnstile(token);
      if (result) {
        const value = await jwt.sign({
          pass: true,
        });
        return value;
      }
      return null;
    },
    {
      query: t.Object({
        token: t.String(),
      }),
    },
  );

app.listen(62802);
console.log('Server is running on port 62802');

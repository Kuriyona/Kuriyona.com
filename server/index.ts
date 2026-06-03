import { Elysia, t } from 'elysia';
import { RouterR2 } from './router/r2';
import { RouteWeather } from './router/weather';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysia/jwt';
import { RouteNekoApi } from './router/neko';
import { verifyTurnstile } from './utils';

const app = new Elysia()
  .use(
    cors({
      origin: '*',
    }),
  )
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET!,
    }),
  )
  .get('/', () => 'This API site of Kuriyona.com')
  .use(RouterR2)
  .use(RouteWeather)
  .use(RouteNekoApi)
  .get(
    '/turnstile',
    async ({ jwt, query: { token } }) => {
      const result = await verifyTurnstile(token);
      if (result) {
        const value = await jwt.sign({
          pass: true,
          exp: '2h',
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

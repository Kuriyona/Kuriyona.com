import { Elysia, t } from 'elysia';
import { RouterR2 } from './r2';
import { RouteWeather } from './weather';
import { cors } from '@elysiajs/cors';

import 'dotenv/config';
import { RouteNekoApi } from './neko';

const app = new Elysia()
  .use(
    cors({
      origin: '*',
    }),
  )
  .get('/', () => 'This API site of Kuriyona.com')
  .use(RouterR2)
  .use(RouteWeather)
  .use(RouteNekoApi);

app.listen(62802);
console.log('Server is running on port 62802');

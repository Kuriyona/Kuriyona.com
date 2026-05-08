import { Elysia, t } from 'elysia';
import { RouteImage } from './image';
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
  .use(RouteImage)
  .use(RouteWeather)
  .use(RouteNekoApi);

app.listen(62802);
console.log('Server is running on port 62802');

import { Elysia, t } from 'elysia';
import { RouteImage } from './image';
import { cors } from '@elysiajs/cors';

import 'dotenv/config';

const app = new Elysia()
  .use(
    cors({
      origin: '*',
    }),
  )
  .get('/', () => 'This API site of Kuriyona.com')
  .use(RouteImage);

app.listen(62802);
console.log('Server is running on port 62802');

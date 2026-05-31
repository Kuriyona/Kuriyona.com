import Elysia, { t } from 'elysia';

const app = new Elysia({ prefix: '/links' });

app.post(
  '/request',
  async function ({ body, set }) {
    console.log('send request success');
  },
  {
    body: t.Object({
      jwt: t.String(),
    }),
  },
);

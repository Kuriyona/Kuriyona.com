import Elysia, { t } from 'elysia';
import { validateJWT } from '../plugin/auth';
import { push } from '../bot';

const app = new Elysia({ prefix: '/links' });
export { app as RouteLinks };

app.use(validateJWT).post(
  '/request',
  async function ({ body }) {
    const message = `
新的友链申请喵
title: ${body.title}
url: ${body.url}
desc: ${body.desc}
avatar: ${body.avatar}
contact: ${body.contact}
`.trim();
    push(message);
  },
  {
    body: t.Object({
      url: t.String(),
      title: t.String(),
      desc: t.String(),
      avatar: t.String(),
      contact: t.String(),
    }),
  },
);

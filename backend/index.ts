import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import type { Handler } from 'hono';
import { REQUIRED_ENV, type Env } from './src/env';
import { requireAuthKey, requireJwt } from './src/plugin/auth';
import {
  answerAsk,
  createAsk,
  deleteAsk,
  listAllAsks,
  listPublicAsks,
  setAskPublic,
} from './src/router/ask-box';
import { listR2, signedUrl } from './src/router/r2';
import { deleteStatus, getStatus, postStatus } from './src/router/status';
import { verifyTurnstile } from './src/utils';

const api = new Hono<{ Bindings: Env }>()
  .use('*', cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization'] }))
  .use('*', async (c, next) => {
    for (const key of REQUIRED_ENV) {
      if (!(c.env as Record<string, unknown>)[key]) {
        return c.json({ message: `[config] 缺少必需的环境变量: ${key}` }, 500);
      }
    }
    await next();
  })
  .get('/', (c) => c.text('This API site of Kuriyona.com'))
  .get('/turnstile', async (c) => {
    const ok = await verifyTurnstile(c.env, c.req.query('token') ?? '');
    if (!ok) return c.json(null);
    const token = await sign(
      { pass: true, exp: Math.floor(Date.now() / 1000) + 7200 },
      c.env.JWT_SECRET,
    );
    return c.text(token);
  })
  .post('/ask-box', requireJwt, createAsk)
  .get('/ask-box', listPublicAsks)
  .get('/ask-box/admin', requireAuthKey, listAllAsks)
  .delete('/ask-box/admin/:id', requireAuthKey, deleteAsk)
  .put('/ask-box/admin/:id/public/:isPublic', requireAuthKey, setAskPublic)
  .put('/ask-box/admin/:id/answer/:answer', requireAuthKey, answerAsk)
  .get('/status', getStatus)
  .post('/status', requireAuthKey, postStatus)
  .delete('/status', requireAuthKey, deleteStatus)
  .get('/r2/list', requireAuthKey, listR2)
  .get('/r2/upload-signed-url', requireAuthKey, signedUrl);

const text: Handler<{ Bindings: Env }> = (c) => c.text('This API site of Kuriyona.com');

const app = new Hono<{ Bindings: Env }>().get('/api', text).get('/api/', text).route('/api', api);

export default app;

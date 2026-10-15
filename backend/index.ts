import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import type { Handler } from 'hono';
import { REQUIRED_ENV, type Env } from './src/env';
import { AUTH_KEY_HEADER, requireAuthKey, requireJwt } from './src/plugin/auth';
import {
  answerAsk,
  createAsk,
  deleteAsk,
  listAllAsks,
  listPublicAsks,
  setAskPublic,
} from './src/router/ask-box';
import { listZones, purgeCache } from './src/router/cache';
import { amapProxy, cityMapUploadUrl, getCity, putCity } from './src/router/city';
import { getMusicLyric, getMusicPlaylist, purgeMusicCache } from './src/router/music';
import { listR2, signedUrl } from './src/router/r2';
import { verifyTurnstile } from './src/utils';

const api = new Hono<{ Bindings: Env }>()
  // 前端统一在请求头带 AUTH_KEY（跨域开发时自定义头会触发预检，故 allowHeaders 必须列全 + 缓存预检结果）
  .use(
    '*',
    cors({
      origin: '*',
      allowHeaders: ['Content-Type', 'Authorization', AUTH_KEY_HEADER],
      maxAge: 86400,
    }),
  )
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
  .put('/ask-box/admin/:id/answer', requireAuthKey, answerAsk)
  .get('/city', getCity)
  .get('/city/amap', requireAuthKey, amapProxy)
  .get('/city/map/upload-url', requireAuthKey, cityMapUploadUrl)
  .put('/city', requireAuthKey, putCity)
  .get('/music/playlist', getMusicPlaylist)
  .get('/music/lyric', getMusicLyric)
  .post('/music/cache/purge', requireAuthKey, purgeMusicCache)
  .get('/r2/list', requireAuthKey, listR2)
  .get('/r2/upload-signed-url', requireAuthKey, signedUrl)
  .get('/cache/zones', requireAuthKey, listZones)
  .post('/cache/purge', requireAuthKey, purgeCache);

const text: Handler<{ Bindings: Env }> = (c) => c.text('This API site of Kuriyona.com');

const app = new Hono<{ Bindings: Env }>().get('/api', text).get('/api/', text).route('/api', api);

export default app;

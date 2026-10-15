import type { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import type { Env } from '../env';

/**
 * 管理端密钥的请求头。**不能复用 `Authorization`**：那条是 `requireJwt` 的通道，而公开接口（如 `POST /ask-box`）
 * 也走同一个前端客户端，若把 AUTH_KEY 塞进 `Authorization` 会被 JWT 校验判 401。
 * 名字由 CORS 的 `allowHeaders` 共用（见 `backend/index.ts`），改这里就够。
 */
export const AUTH_KEY_HEADER = 'X-Auth-Key';

export const requireAuthKey: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (c.req.header(AUTH_KEY_HEADER) !== c.env.AUTH_KEY) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  await next();
};

export const requireJwt: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  try {
    await verify(token, c.env.JWT_SECRET, 'HS256');
  } catch {
    return c.body(null, 401);
  }
  await next();
};

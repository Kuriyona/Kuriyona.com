import type { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import type { Env } from '../env';

export const requireAuthKey: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (c.req.query('auth') !== c.env.AUTH_KEY) {
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

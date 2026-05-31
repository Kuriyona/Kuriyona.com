import jwt from '@elysia/jwt';
import { Elysia, t } from 'elysia';

export const validateAuth = (app: Elysia) => {
  return app.onBeforeHandle(async ({ query, set }) => {
    if (query.auth !== '20080628Wx') {
      set.status = 401;
      return;
    }
  });
};

export const validateJWT = (app: Elysia) => {
  return app
    .use(
      jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!,
      }),
    )
    .onBeforeHandle(async ({ headers, jwt, set }) => {
      const payload = await jwt.verify(headers['authorization']);
      if (!payload) {
        set.status = 401;
        return;
      }
    });
};

import { AwsClient } from 'aws4fetch';
import { drizzle } from 'drizzle-orm/d1';
import type { Env } from './env';

export const getDb = (env: Env) => drizzle(env.DB);

export const r2ObjectUrl = (env: Env, key: string) => `${env.ENDPOINT}/${env.BUCKET_NAME}/${key}`;

export const getR2 = (env: Env) =>
  new AwsClient({
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });

export const presignR2Put = async (env: Env, key: string, mime?: string) => {
  const request = new Request(`${r2ObjectUrl(env, key)}?X-Amz-Expires=86400`, {
    method: 'PUT',
    headers: mime ? { 'Content-Type': mime } : undefined,
  });
  const signed = await getR2(env).sign(request, {
    aws: { signQuery: true, allHeaders: true },
  });
  return signed.url;
};

export const verifyTurnstile = async (env: Env, token: string) => {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_DEV_SECRET_KEY || env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
};

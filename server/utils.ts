import ky from 'ky';
import { S3Client } from 'bun';
import Cloudflare from 'cloudflare';
const secretKey = process.env.TURNSTILE_SECRET_KEY;

export const s3 = new S3Client({
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.ACCESS_KEY_ID!,
  secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  bucket: process.env.BUCKET_NAME!,
});

const client = new Cloudflare({
  apiToken: process.env['CLOUDFLARE_API_TOKEN'],
});

export const download = async (key: string) => {
  const s3File = s3.file(key);
  return await s3File.arrayBuffer();
};

export const upload = async (file: Buffer | string, key: string) => {
  if (typeof file === 'string') {
    file = Buffer.from(file);
  }
  const s3File = s3.file(key);
  await s3File.write(file);
};

export const purgeCache = async (params: Cloudflare.Cache.CachePurgeParams) => {
  await client.cache.purge({
    ...params,
    zone_id: 'd9a70ef0a143cb0897a16d6779edd1ae',
  });
};

export const verifyTurnstile = async (token: string) => {
  const data = await ky
    .post(`https://challenges.cloudflare.com/turnstile/v0/siteverify`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    })
    .json<{ success: boolean }>();
  return data.success;
};

import ky from 'ky';
import { S3Client } from 'bun';
const secretKey = process.env.TURNSTILE_SECRET_KEY;

export const s3 = new S3Client({
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.ACCESS_KEY_ID!,
  secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  bucket: process.env.BUCKET_NAME!,
});

export const upload = async (file: Buffer, key: string) => {
  const s3File = s3.file(key);
  await s3File.write(file);
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

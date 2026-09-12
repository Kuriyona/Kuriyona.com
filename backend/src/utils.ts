import ky from "ky";
import { S3Client } from "bun";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "JWT_SECRET",
  "AUTH_KEY",
  "ENDPOINT",
  "ACCESS_KEY_ID",
  "SECRET_ACCESS_KEY",
  "BUCKET_NAME",
  "TURNSTILE_SECRET_KEY",
] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[config] 缺少必需的环境变量: ${key}`);
    process.exit(1);
  }
}

const devSecretKey = process.env.TURNSTILE_DEV_SECRET_KEY!;
const secretKey = devSecretKey || process.env.TURNSTILE_SECRET_KEY!;

export const db = drizzle({ client: createPool(process.env.DATABASE_URL!) });

export const s3 = new S3Client({
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.ACCESS_KEY_ID!,
  secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  bucket: process.env.BUCKET_NAME!,
});

export const verifyTurnstile = async (token: string) => {
  const data = await ky
    .post(`https://challenges.cloudflare.com/turnstile/v0/siteverify`, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    })
    .json<{ success: boolean }>();
  return data.success;
};

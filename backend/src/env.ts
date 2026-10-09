/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AUTH_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_DEV_SECRET_KEY?: string;
  ENDPOINT: string;
  ACCESS_KEY_ID: string;
  SECRET_ACCESS_KEY: string;
  BUCKET_NAME: string;
  WEATHER_API_KEY?: string;
  GITHUB_API_TOKEN?: string;
  STEAM_API_KEY?: string;
}

export const REQUIRED_ENV = [
  'JWT_SECRET',
  'AUTH_KEY',
  'TURNSTILE_SECRET_KEY',
  'ENDPOINT',
  'ACCESS_KEY_ID',
  'SECRET_ACCESS_KEY',
  'BUCKET_NAME',
] as const;

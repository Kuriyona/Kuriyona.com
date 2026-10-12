import ky from 'ky';
import { useStorage } from '@vueuse/core';
const key = useStorage('API_KEY', '');

// 开发：portless（pnpm api:dev）把 wrangler dev 的 62802 映射成该域名，见根 AGENTS.md
export const HOST = import.meta.env.DEV ? 'https://kuriyona-api.localhost/api' : '/api';

export const fetchApi = ky.create({
  prefix: HOST,
  searchParams: {
    auth: key.value,
  },
});

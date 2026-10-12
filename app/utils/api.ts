import ky, { type Options } from 'ky';
import { useStorage } from '@vueuse/core';

const key = useStorage('API_KEY', '');

// 开发：portless（pnpm api:dev）把 wrangler dev 的 62802 映射成该域名，见根 AGENTS.md
export const HOST = import.meta.env.DEV ? 'https://kuriyona-api.localhost/api' : '/api';

const client = ky.create({ prefix: HOST });

// auth 必须每请求现读：ky.create 的 options 在创建时就固定（searchParams 被 clone），
// 写死会在改密钥后一直 401，直到整页刷新。调用点只允许传纯对象形式的 searchParams。
const withAuth = (options?: Options): Options => ({
  ...options,
  searchParams: new URLSearchParams({
    ...(options?.searchParams as Record<string, string> | undefined),
    auth: key.value,
  }),
});

export const fetchApi = Object.assign(
  (input: string, options?: Options) => client(input, withAuth(options)),
  {
    get: (input: string, options?: Options) => client.get(input, withAuth(options)),
    post: (input: string, options?: Options) => client.post(input, withAuth(options)),
    put: (input: string, options?: Options) => client.put(input, withAuth(options)),
    delete: (input: string, options?: Options) => client.delete(input, withAuth(options)),
  },
);

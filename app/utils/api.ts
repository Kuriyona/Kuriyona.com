import ky, { type Options } from 'ky';
import { useStorage } from '@vueuse/core';

const key = useStorage('API_KEY', '');

/** 与后端 `backend/src/plugin/auth.ts` 的 `AUTH_KEY_HEADER` 对应 */
const AUTH_KEY_HEADER = 'X-Auth-Key';

// 开发：portless（pnpm api:dev）把 wrangler dev 的 62802 映射成该域名，见根 AGENTS.md
export const HOST = import.meta.env.DEV ? 'https://kuriyona-api.localhost/api' : '/api';

const client = ky.create({
  prefix: HOST,
  hooks: {
    // auth 必须每请求现读（改密钥后即时生效，不用整页刷新）：写成 ky.create 的固定 header 会在创建时就取值。
    // 只在有值时设置：空值会让后端照旧判 401，但没必要真发一个空的自定义头。
    beforeRequest: [
      ({ request }) => {
        if (key.value) request.headers.set(AUTH_KEY_HEADER, key.value);
      },
    ],
  },
});

export const fetchApi = Object.assign(
  (input: string, options?: Options) => client(input, options),
  {
    get: (input: string, options?: Options) => client.get(input, options),
    post: (input: string, options?: Options) => client.post(input, options),
    put: (input: string, options?: Options) => client.put(input, options),
    delete: (input: string, options?: Options) => client.delete(input, options),
  },
);

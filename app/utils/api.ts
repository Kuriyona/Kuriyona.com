import ky from 'ky';
import { useStorage } from '@vueuse/core';
const key = useStorage('API_KEY', '');

export const HOST = import.meta.env.DEV ? 'http://localhost:62802' : 'https://api.kuriyona.com';

export const fetchApi = ky.create({
  prefix: HOST,
  searchParams: {
    auth: key.value,
  },
});

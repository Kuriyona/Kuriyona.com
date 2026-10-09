import ky from 'ky';
import { useStorage } from '@vueuse/core';
const key = useStorage('API_KEY', '');

export const HOST = import.meta.env.DEV ? 'https://api-kuriyona-com.localhost/api' : '/api';

export const fetchApi = ky.create({
  prefix: HOST,
  searchParams: {
    auth: key.value,
  },
});

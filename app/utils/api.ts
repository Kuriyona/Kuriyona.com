import ky from 'ky';

export const HOST = import.meta.env.DEV ? 'http://localhost:62802' : 'https://api.kuriyona.com';

export const fetchApi = ky.create({
  prefix: HOST,
});

import Elysia from 'elysia';

const host = 'https://nb2mt9vk5n.re.qweatherapi.com';

const key = process.env.WEATHER_API_KEY!;

export let data: any = {};
let lastUpdateTime: number = -1;

export const updateWeather = async () => {
  if (Date.now() - lastUpdateTime < 1800 * 1000) {
    return;
  }
  lastUpdateTime = Date.now();
  const res = await fetch(`${host}/v7/weather/now?location=101210107`, {
    headers: {
      'X-QW-Api-Key': key,
    },
  });
  data = await res.json();
};

const app = new Elysia({ prefix: '/weather' }).get('/', async ({ set }) => {
  await updateWeather();
  set.headers['cache-control'] = 'public, max-age=1800';
  return data;
});
export { app as RouteWeather };

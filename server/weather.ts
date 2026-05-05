import Elysia from 'elysia';

const host = 'https://nb2mt9vk5n.re.qweatherapi.com';

const key = process.env.WEATHER_API_KEY!;

let data: any = {};
let lastUpdateTime: number = -1;

const app = new Elysia({ prefix: '/weather' }).get('/', async ({ set }) => {
  if (Date.now() - lastUpdateTime > 1000 * 300) {
    lastUpdateTime = Date.now();
    const res = await fetch(`${host}/v7/weather/now?location=101210107`, {
      headers: {
        'X-QW-Api-Key': key,
      },
    });
    data = await res.json();
  }
  set.headers['cache-control'] = 'public, max-age=300';
  return data;
});
export { app as RouteWeather };

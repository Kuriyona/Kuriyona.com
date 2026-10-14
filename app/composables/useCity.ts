import type { Cities } from '@/scripts/cityTypes';

/** `GET /api/city`（常住/当前城市地图 + 常住城市天气）。预渲染阶段拿不到，挂载后由客户端拉取。 */
export const useCity = () =>
  useAsyncData('city', () => fetchApi.get('/city').then(async (res) => await res.json<Cities>()), {
    server: false,
  });

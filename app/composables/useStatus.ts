import type { Status } from '@/scripts/statusTypes';

/** `/api/status`（Steam / 天气 / GitHub / 城市地图）。预渲染阶段拿不到，挂载后由客户端拉取。 */
export const useStatus = () =>
  useAsyncData(
    'status',
    () => fetchApi.get('/status').then(async (res) => await res.json<Status>()),
    {
      server: false,
    },
  );

import type { Status } from '~/scripts/statusTypes';

/** 未就绪时的重拉间隔与次数上限（`waitUntil` 每次最多续命 30s，首次出图往往要好几个来回） */
const POLL_INTERVAL = 5000;
const POLL_LIMIT = 24;

/**
 * 拉取 `/status` 并盯住城市地图：出图由后端按需写进 R2，未就绪期间按固定间隔绕过 HTTP
 * 缓存重拉，直到常住城市与当前所在城市都有图。
 */
export const useCityMaps = (key: string) => {
  const fresh = ref(false);
  const { data: status, refresh } = useAsyncData(
    key,
    () =>
      fetchApi
        .get('/status', fresh.value ? { cache: 'no-store' } : {})
        .then((res) => res.json<Status>()),
    { server: false },
  );

  const cities = computed(() => status.value?.cities);
  const { start, stop } = useTimeoutFn(refresh, POLL_INTERVAL, { immediate: false });
  let polls = 0;

  /** 改完城市先用它刷新：绕过缓存，立刻看到新的 adcode 与出图状态 */
  const refreshFresh = async () => {
    fresh.value = true;
    await refresh();
  };

  watch(status, () => {
    stop();
    if (cities.value?.resident.ready && cities.value.current.ready) return;
    if (polls++ >= POLL_LIMIT) return;
    fresh.value = true;
    start();
  });

  return { status, cities, refreshFresh };
};

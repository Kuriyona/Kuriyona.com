import ky from 'ky';
import type { CloudflareSummary } from '@/types/cloudflare';

/** 节点名形如 `Hong Kong, China - (HKG)`，括号里是 colo 码 */
const NODE_NAME_RE = /^[A-Za-z\s,]+-\s*\(([A-Z]{3})\)$/;

export function useCloudflareStatus() {
  const { data: nodesData } = useAsyncData('cloudflare-nodes', async () => {
    const res = await ky
      .get('https://www.cloudflarestatus.com/api/v2/summary.json')
      .json<CloudflareSummary>();
    return res.components
      .filter((c) => NODE_NAME_RE.test(c.name))
      .map((n) => ({
        name: n.name,
        code: n.name.match(NODE_NAME_RE)?.[1],
      }));
  });

  const { data: traceData } = useAsyncData(
    'trace',
    async () => {
      const res = await ky.get('https://kuriyona.com/cdn-cgi/trace').text();
      const result = Object.fromEntries(res.split('\n').map((line) => line.split('=')));
      return result;
    },
    {
      server: false,
    },
  );

  const currentNodeName = computed(
    () => nodesData.value?.find((n) => n.code === traceData.value?.colo)?.name || undefined,
  );

  const location = computed(() => traceData.value?.loc);

  return {
    nodesData,
    traceData,
    currentNodeName,
    location,
  };
}

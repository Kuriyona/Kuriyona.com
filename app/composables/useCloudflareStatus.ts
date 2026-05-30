import ky from 'ky';
import type { CF } from './cfn';

const REGEX = /^[A-Za-z\s,]+-\s*\(([A-Z]{3})\)$/;

export function useCloudflareStatus() {
  const { data: nodesData } = useAsyncData('cfn', async () => {
    const res = await ky.get('https://www.cloudflarestatus.com/api/v2/summary.json').json<CF>();
    const result = res.components
      .filter((c) => REGEX.test(c.name))
      .map((n) => ({
        name: n.name,
        code: n.name.match(REGEX)?.[1],
      }));
    return result;
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

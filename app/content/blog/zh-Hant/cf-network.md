---
title: 如何在網站顯示當前使用的 Cloudflare 網絡
desc: 通過解析 Cloudflare 的 /cdn-cgi/trace 接口獲取當前網絡節點 ID，再結合 Cloudflare Status 的公共 API 匹配出節點名稱，從而在網站上動態顯示訪客正在使用的 Cloudflare 網絡名稱。
date: 2025-05-24
edit: 2025-05-24
---

今天凌晨給我的個人網站加了一個小功能，就是在網站顯示當前使用的 Cloudflare 網絡。

![](https://r2.kuriyona.com/static/2026/05/24/cf-network-preview.png)

> 翻到本網站的最底下，您應該就能看見實際顯示的樣式。

### 實現方式

由 Cloudflare 代理的網站，通過訪問 `{domain}/cdn-cgi/trace` 可以獲取當前使用的 Cloudflare 網絡信息。樣例如下：

```plaintext
fl=582f239
h=kuriyona.com
ip=64.90.0.218
ts=1779555940.000
visit_scheme=https
uag=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0
colo=HKG
sliver=none
http=http/3
loc=HK
tls=TLSv1.3
sni=plaintext
warp=off
gateway=off
rbi=off
kex=X25519MLKEM768
```

通過解析其中的 `colo` 參數，我們可以獲取當前使用的 Cloudflare 網絡 ID，比如這裏是 `HKG`。

那麼網絡 ID 有了，我們就可以根據網絡 ID 來顯示當前使用的 Cloudflare 網絡了。

Cloudflare Status 提供了一個文件，列出了當前所有的 Cloudflare 網絡狀態信息。

> `https://www.cloudflarestatus.com/api/v2/summary.json`

![](https://r2.kuriyona.com/static/2026/05/24/cf-network-status-api.png)

文件的內容很雜，我們需要通過一個簡單的腳本來獲得我們需要的格式化信息。

首先通過一個簡單的正則表達式(`^[A-Za-z\s,]+-\s*\(([A-Z]{3})\)$`)來篩選複合網絡節點的 `name` 字段，再對數據結構進行簡化處理。（這裏使用 ky 庫來獲取數據）

```ts
const res = await ky.get('https://www.cloudflarestatus.com/api/v2/summary.json').json();
const result = res.components
  .filter((c) => REGEX.test(c.name))
  .map((n) => ({
    name: n.name,
    code: n.name.match(/^[A-Za-z\s,]+-\s*\(([A-Z]{3})\)$/)?.[1],
  }));
```

結合前文中獲得的網絡 ID，我們就可以獲得實際的網絡節點名稱了。

### 代碼實現

本站實際使用的代碼可以查看 [useCloudflareStatus.ts](https://github.com/Kuriyona/Kuriyona.com/blob/main/app/composables/useCloudflareStatus.ts)

以下是通用的 TypeScript 完整代碼實現：

```ts
import ky from 'ky';

const REGEX = /^[A-Za-z\s,]+-\s*\(([A-Z]{3})\)$/;

interface NodeInfo {
  name: string;
  code: string | undefined;
}

interface TraceData {
  colo?: string;
  loc?: string;
  [key: string]: string | undefined;
}

interface CloudflareStatusResult {
  nodesData: NodeInfo[] | undefined;
  traceData: TraceData | undefined;
  currentNodeName: string | undefined;
  location: string | undefined;
}

export async function getCloudflareStatus(): Promise<CloudflareStatusResult> {
  // 獲取節點數據
  const nodesResponse = await ky.get('https://www.cloudflarestatus.com/api/v2/summary.json').json();
  const nodesData = nodesResponse.components
    .filter((c) => REGEX.test(c.name))
    .map((n) => ({
      name: n.name,
      code: n.name.match(REGEX)?.[1],
    }));

  // 獲取 trace 數據
  const traceText = await ky.get('https://kuriyona.com/cdn-cgi/trace').text();
  const traceData = Object.fromEntries(
    traceText
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => line.split('=')),
  ) as TraceData;

  console.log(traceData);

  // 計算當前節點名稱
  const currentNodeName = nodesData.find((n) => n.code === traceData?.colo)?.name;

  const location = traceData?.loc;

  return {
    nodesData,
    traceData,
    currentNodeName,
    location,
  };
}
```

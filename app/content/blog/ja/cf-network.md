---
title: ウェブサイトに現在使用中の Cloudflare ネットワークを表示する方法
desc: Cloudflare の /cdn-cgi/trace エンドポイントを解析して現在のネットワークノード ID を取得し、Cloudflare Status の公開 API でノード名を照合することで、訪問者が使用中の Cloudflare ネットワーク名をウェブサイトに動的に表示します。
date: 2026-05-24
edit: 2026-05-24
---

今日の未明、個人サイトに小さな機能を追加した。サイト上に現在使用中の Cloudflare ネットワークを表示するものだ。

![](https://r2.kuriyona.com/static/2026/05/24/cf-network-preview.png)

> このサイトの一番下までスクロールすると、実際の表示を確認できるはずだ。

### 実装方法

Cloudflare 経由でプロキシされるサイトでは、`{domain}/cdn-cgi/trace` にアクセスすると、現在使用中の Cloudflare ネットワーク情報を取得できる。例は以下の通り：

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

`colo` パラメータを解析すると、現在使用中の Cloudflare ネットワーク ID を取得できる。ここでは `HKG` だ。

ネットワーク ID が手に入ったので、それに対応する Cloudflare ネットワーク名を表示できる。

Cloudflare Status は、すべての Cloudflare ネットワークの現在のステータス情報を一覧にしたファイルを提供している。

> `https://www.cloudflarestatus.com/api/v2/summary.json`

![](https://r2.kuriyona.com/static/2026/05/24/cf-network-status-api.png)

ファイルの中身はかなり雑然としているので、必要な整形済み情報を抽出する簡単なスクリプトが要る。

まず、単純な正規表現（`^[A-Za-z\s,]+-\s*\(([A-Z]{3})\)$`）でネットワークコンポーネントの `name` フィールドを絞り込み、データ構造を簡略化する。（ここではデータ取得に `ky` ライブラリを使う。）

```ts
const res = await ky.get('https://www.cloudflarestatus.com/api/v2/summary.json').json();
const result = res.components
  .filter((c) => REGEX.test(c.name))
  .map((n) => ({
    name: n.name,
    code: n.name.match(/^[A-Za-z\s,]+-\s*\(([A-Z]{3})\)$/)?.[1],
  }));
```

先ほど取得したネットワーク ID と組み合わせれば、実際のネットワークノード名が得られる。

### コード実装

このサイトで実際に使っているコードは [useCloudflareStatus.ts](https://github.com/Kuriyona/Kuriyona.com/blob/main/app/composables/useCloudflareStatus.ts) で確認できる。

以下は完全な TypeScript 実装：

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
  // ノードデータを取得
  const nodesResponse = await ky.get('https://www.cloudflarestatus.com/api/v2/summary.json').json();
  const nodesData = nodesResponse.components
    .filter((c) => REGEX.test(c.name))
    .map((n) => ({
      name: n.name,
      code: n.name.match(REGEX)?.[1],
    }));

  // trace データを取得
  const traceText = await ky.get('https://kuriyona.com/cdn-cgi/trace').text();
  const traceData = Object.fromEntries(
    traceText
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => line.split('=')),
  ) as TraceData;

  // 現在のノード名を判定
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

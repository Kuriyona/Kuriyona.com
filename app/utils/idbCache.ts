// `@kuriyona/amap-box` 的 cache 注入点（管理端出图用，见 backend/docs/city-map.md）。
//
// 为什么是 IndexedDB 而不是 localStorage：一组边界实测 41 个键 / 约 6 MB，既超过 localStorage 的 5 MB
// 配额，也不适合同步 IO。键值与库的约定一致（`index` 与各 `<adcode>`，值一律是字符串）。
const DB_NAME = 'kuriyona-amap';
const STORE = 'boundaries';

let connection: Promise<IDBDatabase> | null = null;

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const run = <T>(mode: IDBTransactionMode, request: (store: IDBObjectStore) => IDBRequest<T>) =>
  (connection ??= open()).then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const tx = database.transaction(STORE, mode);
        const result = request(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(result.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );

export const boundaryCache = {
  read: (key: string) =>
    run<string | undefined>('readonly', (store) => store.get(key) as IDBRequest<string | undefined>)
      .then((value) => value ?? null)
      // 存储不可用（隐私模式等）时当作没有缓存：出图仍能走网络完成
      .catch(() => null),
  write: (key: string, value: string) =>
    run<IDBValidKey>('readwrite', (store) => store.put(value, key)).then(() => undefined),
  clear: () => run<undefined>('readwrite', (store) => store.clear()),
};

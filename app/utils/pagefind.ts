export type PagefindResultData = {
  url: string;
  excerpt: string;
  meta: {
    title: string;
    image?: string;
  };
  sub_results: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
};

let pagefindModule: any = null;

async function getPagefind() {
  if (pagefindModule) return pagefindModule;
  const imp = new Function('return import("/pagefind/pagefind.js")');
  pagefindModule = await imp();
  await pagefindModule.init();
  return pagefindModule;
}

export async function pagefindSearch(term: string): Promise<PagefindResultData[]> {
  const pf = await getPagefind();
  const search = await pf.debouncedSearch(term);
  if (search === null) return [];
  const results = await Promise.all(search.results.slice(0, 10).map((r: any) => r.data()));
  return results as PagefindResultData[];
}

export async function pagefindReinit() {
  try {
    pagefindModule = null;
    const imp = new Function('return import("/pagefind/pagefind.js")');
    const pf = await imp();
    await pf.destroy();
    await pf.init();
    pagefindModule = pf;
  } catch {
    // PageFind index not yet available (dev mode)
  }
}

import { pagefindSearch, pagefindReinit, type PagefindResultData } from '~/utils/pagefind';

const query = ref('');
const results = ref<PagefindResultData[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const activeIndex = ref(-1);
const visible = ref(false);

let latestTerm = '';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function search() {
  const term = query.value.trim();
  if (term.length < 1) return;
  latestTerm = term;
  loading.value = true;
  error.value = null;
  try {
    const data = await pagefindSearch(term);
    if (latestTerm !== query.value.trim()) return;
    results.value = data;
    activeIndex.value = -1;
  } catch (e: any) {
    if (latestTerm !== query.value.trim()) return;
    error.value = e?.message || 'Search failed';
    results.value = [];
  } finally {
    loading.value = false;
  }
}

type FlatResult = { title: string; url: string; excerpt: string; depth: number };

const flatResults = computed<FlatResult[]>(() =>
  results.value.flatMap((r) => [
    { title: r.meta?.title ?? '', url: r.url, excerpt: r.excerpt, depth: 0 },
    ...(r.sub_results?.length
      ? r.sub_results.map((s) => ({ title: s.title, url: s.url, excerpt: s.excerpt, depth: 1 }))
      : []),
  ]),
);

export function useSearch() {
  function onInput() {
    if (query.value.length < 1) {
      if (debounceTimer) clearTimeout(debounceTimer);
      results.value = [];
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(search, 300);
  }

  function clear() {
    query.value = '';
    results.value = [];
    activeIndex.value = -1;
    error.value = null;
  }

  function close() {
    visible.value = false;
    clear();
  }

  function open() {
    visible.value = true;
  }

  function toggle() {
    if (visible.value) close();
    else open();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const len = flatResults.value.length;
      if (len === 0) return;
      activeIndex.value = (activeIndex.value + 1) % len;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const len = flatResults.value.length;
      if (len === 0) return;
      activeIndex.value = activeIndex.value <= 0 ? len - 1 : activeIndex.value - 1;
    } else if (e.key === 'Enter' && activeIndex.value >= 0) {
      e.preventDefault();
      const item = flatResults.value[activeIndex.value];
      if (item) navigateTo(item.url);
      close();
    } else if (e.key === 'Escape') {
      close();
    }
  }

  return {
    query,
    results,
    flatResults,
    loading,
    error,
    activeIndex,
    visible,
    onInput,
    clear,
    close,
    open,
    toggle,
    onKeydown,
    reinit: pagefindReinit,
  };
}

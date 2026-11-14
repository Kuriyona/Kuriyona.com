import type { TocItem } from '~~/server/utils';

/** 固定顶栏在文章详情页的可替换内容（AppBar 读、文章详情页写）。
 *
 * 文章详情页不再叠一条独立的浮动标题栏，而是直接把固定顶栏换成
 * 「面包屑 + 文章标题」两行版式，并把目录按钮放进顶栏右侧
 * （见 AppBar.vue 的 isArticleRoute 分支）。
 *
 * 页面只在 setup 里写入，不做卸载清理：AppBar 按路由名判断是否采用，
 * 离开文章页后残留的数据不会再被渲染；反过来清理会与新页面 setup 的时序竞争，
 * 容易把刚写入的新值清掉。
 */
export interface AppBarArticle {
  /** 大字：文章标题 */
  title: string;
  /** 目录条目（空数组则不显示顶栏目录按钮） */
  toc: TocItem[];
  /** 当前阅读位置的标题 slug，目录高亮用 */
  active: string;
}

export function useAppBar() {
  // 必须在 composable 内调用：模块作用域下 useState 拿不到 Nuxt 上下文（SSR 报 NUXT_E1001）
  const article = useState<AppBarArticle | null>('app-bar-article', () => null);
  return { article };
}

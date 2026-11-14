/**
 * 导航条目（原始数据）：文案是 i18n key，由 `useNav` / `useAboutNav` 解析成当前语言。
 * 类型定义放在数据层，避免 `app/data/` 反过来依赖 `app/composables/`。
 */
export interface NavEntry {
  to: string;
  title?: string;
  titleKey?: string;
  shortTitleKey?: string;
  descKey?: string;
  /** `true` 时同时进入 `aboutNav`（首页「关于」区的导航卡） */
  onAbout?: boolean;
}

/** 顺序即抽屉 / ReserveNav / 关于页的展示顺序 */
export const nav: NavEntry[] = [
  {
    to: '/blog',
    shortTitleKey: 'blog.short-title',
    titleKey: 'blog.title',
    descKey: 'blog.desc',
    onAbout: true,
  },
  {
    to: '/trans',
    titleKey: 'trans.title',
    descKey: 'trans.desc',
    onAbout: true,
  },
  { to: '/timeline', titleKey: 'timeline.title', descKey: 'timeline.desc', onAbout: true },
  {
    to: '/devices',
    titleKey: 'devices.title',
    descKey: 'devices.desc',
    onAbout: true,
  },
  { to: '/ask-box', titleKey: 'ask-box.title', descKey: 'ask-box.desc' },
];

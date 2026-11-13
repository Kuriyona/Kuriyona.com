import type { NavItem } from '~/composables/useNav';

/** 导航条目；`onAbout: true` 的会同时进入 `aboutNav`（首页「关于」区的导航卡） */
export interface NavEntry extends NavItem {
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
    to: '/about/trans',
    titleKey: 'about.mtf.as-mtf',
    descKey: 'about.mtf.desc',
    onAbout: true,
  },
  { to: '/timeline', titleKey: 'timeline.title', descKey: 'timeline.desc', onAbout: true },
  {
    to: '/about/devices',
    titleKey: 'about.devices.title',
    descKey: 'about.devices.desc',
    onAbout: true,
  },
  { to: '/ask-box', titleKey: 'ask-box.title', descKey: 'ask-box.desc' },
];

import type { NavEntry } from '~/data/nav';

/** 解析 i18n key 后的导航条目：文案已是当前语言 */
export interface ResolvedNavEntry {
  to: string;
  shortTitle: string;
  title: string;
  desc: string;
}

const resolveNavEntry = (item: NavEntry, t: (key: string) => string): ResolvedNavEntry => ({
  to: item.to,
  shortTitle: item.shortTitleKey ? t(item.shortTitleKey) : '',
  title: item.titleKey ? t(item.titleKey) : (item.title ?? ''),
  desc: item.descKey ? t(item.descKey) : '',
});

export const useNav = () => {
  const config = useAppConfig();
  const { t } = useI18n();
  return computed(() => (config.nav as NavEntry[]).map((item) => resolveNavEntry(item, t)));
};

export const useAboutNav = () => {
  const config = useAppConfig();
  const { t } = useI18n();
  return computed(() => (config.aboutNav as NavEntry[]).map((item) => resolveNavEntry(item, t)));
};

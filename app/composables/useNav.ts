export interface NavItem {
  to: string;
  title?: string;
  titleKey?: string;
  shortTitleKey?: string;
  descKey?: string;
}

export const useNav = () => {
  const config = useAppConfig();
  const { t } = useI18n();
  const resolve = (item: NavItem) => ({
    to: item.to,
    shortTitle: item.shortTitleKey ? t(item.shortTitleKey) : '',
    title: item.titleKey ? t(item.titleKey) : (item.title ?? ''),
    desc: item.descKey ? t(item.descKey) : '',
  });
  return computed(() => (config.nav as NavItem[]).map(resolve));
};

export const useAboutNav = () => {
  const config = useAppConfig();
  const { t } = useI18n();
  return computed(() =>
    (config.aboutNav as NavItem[]).map((item) => ({
      to: item.to,
      title: item.titleKey ? t(item.titleKey) : (item.title ?? ''),
      desc: item.descKey ? t(item.descKey) : '',
    })),
  );
};

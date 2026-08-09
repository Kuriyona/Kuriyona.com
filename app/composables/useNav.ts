export interface NavItem {
  to: string;
  title?: string;
  titleKey?: string;
}

export const useNav = () => {
  const config = useAppConfig();
  const { t } = useI18n();
  return computed(() =>
    (config.nav as NavItem[]).map((item) => ({
      to: item.to,
      title: item.titleKey ? t(item.titleKey) : item.title ?? '',
    })),
  );
};

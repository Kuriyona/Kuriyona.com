const { t } = useI18n();

export const useSeo = (input: Parameters<typeof useSeoMeta>[0]) => {
  useSeoMeta({
    ...input,
    title: `${input.title} - Kuriyona's Space`,
    ogDescription: input.description || t('about.description'),
  });
};

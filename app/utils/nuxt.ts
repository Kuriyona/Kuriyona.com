export const useSeo = (input: Parameters<typeof useSeoMeta>[0]) => {
  useSeoMeta({
    ...input,
    title: `${input.title} - Kuriyona's Space`,
  });
};

export const useHeadingAnchor = () => {
  const cleanup: (() => void)[] = [];

  onMounted(() => {
    const headings = document.querySelectorAll<HTMLHeadingElement>(
      '.markdown-body h2, .markdown-body h3, .markdown-body h4',
    );
    if (!headings.length) return;

    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id = heading.textContent
          ?.toLowerCase()
          .replace(/[^\w\u4e00-\u9fff]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/-+/g, '-') ?? '';
      }

      heading.style.cursor = 'pointer';

      const onClick = () => {
        history.pushState(null, '', `#${heading.id}`);
        heading.scrollIntoView({ behavior: 'smooth' });
      };

      heading.addEventListener('click', onClick);
      cleanup.push(() => heading.removeEventListener('click', onClick));
    });
  });

  onUnmounted(() => {
    cleanup.forEach((fn) => fn());
  });
};

export const useHeadingAnchor = () => {
  const cleanup: (() => void)[] = [];

  const removeListeners = () => {
    cleanup.forEach((fn) => fn());
    cleanup.length = 0;
  };

  // 文章正文切换语言后需要重新绑定新标题
  const init = () => {
    removeListeners();
    const headings = document.querySelectorAll<HTMLHeadingElement>(
      '.markdown-body h2, .markdown-body h3, .markdown-body h4',
    );
    if (!headings.length) return;

    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id =
          heading.textContent
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
  };

  onMounted(init);
  onUnmounted(removeListeners);

  return { init };
};

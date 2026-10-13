/** Material Symbols 图标（几何数据取自 @iconify-json/material-symbols） */
const iconSvg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="${body}"/></svg>`;

const ICON_COPY = iconSvg(
  'M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm-4 4q-.825 0-1.412-.587T3 20V6h2v14h11v2z',
);
const ICON_CHECK = iconSvg('m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z');
const ICON_CLOSE = iconSvg(
  'M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z',
);

export const useCodeCopy = () => {
  let buttons: HTMLButtonElement[] = [];
  const { t } = useI18n();

  onMounted(() => {
    const pres = document.querySelectorAll<HTMLPreElement>('.markdown-body pre');
    if (!pres.length) return;

    pres.forEach((pre) => {
      pre.style.position = 'relative';

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.innerHTML = ICON_COPY;
      btn.setAttribute('aria-label', 'Copy code');

      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code.textContent || '');
          toast.success(t('global.copy-success'));
          btn.innerHTML = ICON_CHECK;
          setTimeout(() => {
            btn.innerHTML = ICON_COPY;
          }, 2000);
        } catch {
          btn.innerHTML = ICON_CLOSE;
        }
      });

      pre.appendChild(btn);
      buttons.push(btn);
    });
  });

  onUnmounted(() => {
    buttons.forEach((btn) => btn.remove());
    buttons = [];
  });
};

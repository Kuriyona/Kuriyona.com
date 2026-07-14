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
      btn.innerHTML =
        '<span class="material-symbols-outlined" style="font-size:18px">content_copy</span>';
      btn.setAttribute('aria-label', 'Copy code');

      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code.textContent || '');
          Snackbar.success(t('global.copy-success'));
          btn.innerHTML =
            '<span class="material-symbols-outlined" style="font-size:18px">check</span>';
          setTimeout(() => {
            btn.innerHTML =
              '<span class="material-symbols-outlined" style="font-size:18px">content_copy</span>';
          }, 2000);
        } catch {
          btn.innerHTML =
            '<span class="material-symbols-outlined" style="font-size:18px">close</span>';
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

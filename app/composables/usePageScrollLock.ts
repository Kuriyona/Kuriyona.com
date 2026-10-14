import type { Ref } from 'vue';

/**
 * 锁页面滚动，只动 body 的 overflow / padding-right。
 *
 * 不用 reka-ui 的 `useBodyScrollLock`：它在锁滚动之余会把 body 的 pointer-events 设成
 * none（只给它自己的浮层留 `pointer-events: auto` 例外）。我们没用 reka 的浮层，
 * 于是整页点不动、拖拽还能选中遮罩底下的文字。
 *
 * padding-right 补上滚动条宽度，避免锁定 / 解锁瞬间整页横向抖一下；
 * 解锁时原样还原 body 的内联样式。
 */
export function usePageScrollLock(locked: Ref<boolean>) {
  let prev: { overflow: string; paddingRight: string } | null = null;

  function lock() {
    if (prev) return;
    prev = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    document.body.style.overflow = 'hidden';
  }

  function unlock() {
    if (!prev) return;
    document.body.style.overflow = prev.overflow;
    document.body.style.paddingRight = prev.paddingRight;
    prev = null;
  }

  if (import.meta.client) watch(locked, (v) => (v ? lock() : unlock()), { immediate: true });
  onBeforeUnmount(unlock);
}

export interface ToastItem {
  id: number;
  type: 'success' | 'error';
  text: string;
}

let toastId = 0;

const toasts = ref<ToastItem[]>([]);

const remove = (id: number) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) toasts.value.splice(index, 1);
};

const show = (type: ToastItem['type'], text: string) => {
  const item: ToastItem = { id: ++toastId, type, text };
  toasts.value.push(item);
  setTimeout(() => remove(item.id), 3000);
};

export const toast = {
  success: (text: string) => show('success', text),
  error: (text: string) => show('error', text),
  dismiss: remove,
  list: toasts,
};

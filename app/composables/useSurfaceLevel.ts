import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from 'vue';

export const MAX_SURFACE_LEVEL = 3;
export const SURFACE_LEVEL: InjectionKey<ComputedRef<number>> = Symbol('k-surface-level');

/** 表面层级：显式 level 优先；否则父级 + 1，上限 3；同时向子树提供自身层级。 */
export function useSurfaceLevel(level?: MaybeRefOrGetter<1 | 2 | 3 | undefined>) {
  const parent = inject(SURFACE_LEVEL, undefined);
  const current = computed(() => {
    const explicit = toValue(level);
    if (explicit) return explicit;
    return Math.min((parent?.value ?? 0) + 1, MAX_SURFACE_LEVEL);
  });
  provide(SURFACE_LEVEL, current);
  return current;
}

/** 浮层（弹窗等）重置计数：其内容重新从 L1 开始，且内部嵌套不继承外部深度。 */
export function resetSurfaceLevel() {
  provide(
    SURFACE_LEVEL,
    computed(() => 0),
  );
}

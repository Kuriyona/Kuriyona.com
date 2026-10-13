<script setup lang="ts">
import { Icon } from '@iconify/vue';
// 副作用导入：注册图标数据，并把 Iconify 的远程下载通路掐掉（见生成文件与 scripts/gen-icons.ts）
import '~/utils/icons.gen';

const props = withDefaults(
  defineProps<{
    /** Iconify 全名，如 `material-symbols:close`、`simple-icons:github` */
    name: string;
    /** 图标独立承载语义时传入（无相邻文本）；留空按装饰性图标处理 */
    label?: string;
  }>(),
  { label: '' },
);
</script>

<template>
  <Icon
    :icon="props.name"
    ssr
    :aria-label="props.label || undefined"
    :aria-hidden="props.label ? undefined : 'true'"
    :role="props.label ? 'img' : undefined"
    class="inline-block shrink-0 leading-none" />
</template>

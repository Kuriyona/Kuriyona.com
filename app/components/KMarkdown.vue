<script lang="ts" setup>
import 'github-markdown-css/github-markdown-dark.css';
import { createMarkdownExit } from 'markdown-exit';

const md = createMarkdownExit({
  breaks: true,
  linkify: true,
});

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
});

const html = computed(() => md.render(props.content));
</script>

<template>
  <div class="markdown-body" v-html="html"></div>
</template>

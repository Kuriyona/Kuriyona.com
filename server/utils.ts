import fs from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { createMarkdownExit } from 'markdown-exit';
import Shiki from '@shikijs/markdown-exit';
import readingTime from 'reading-time';

export type ArticleMeta = {
  slug: string;
  lang: string;
  title: string;
  desc: string;
  date: string;
  readingTime: any;
  [key: string]: any;
};

export type Article = ArticleMeta & {
  content: string;
};

const MARKDOWN_ROOT = path.resolve(process.cwd(), './app/content/blog');
const md = createMarkdownExit({
  html: true,
  breaks: true,
  linkify: true,
});
md.use(
  Shiki({
    theme: 'one-dark-pro',
  }),
);
md.renderer.rules.heading_open = (tokens, idx, _options, _env, slf) => {
  const token = tokens[idx];
  const next = tokens[idx + 1];
  if (next?.type === 'inline' && next.content) {
    const slug = next.content
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    token.attrSet('id', slug);
  }
  return slf.renderToken(tokens, idx, _options);
};

async function getAllMarkdownFiles() {
  try {
    await fs.access(MARKDOWN_ROOT);
  } catch (error) {
    console.error('目录不存在：', error);
    return [];
  }
  const files: string[] = [];
  const entries = fs.glob(path.join(MARKDOWN_ROOT, '**/*.md'), { withFileTypes: true });
  for await (const entry of entries) {
    const fullPath = path.join(entry.parentPath, entry.name);
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function parseMarkdownFile(filePath: string) {
  const fullPath = filePath;
  const fileContent = await fs.readFile(fullPath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);
  return {
    frontmatter,
    content: await md.renderAsync(content),
    readingTime: readingTime(content),
  };
}

async function getAllArticles() {
  const markdownFiles = await getAllMarkdownFiles();
  const articles: Article[] = [];
  for (const filePath of markdownFiles) {
    const dirs = filePath.split(path.sep);
    const slug = dirs.pop()!.replace('.md', '');
    const lang = dirs.pop()!;
    const result = await parseMarkdownFile(filePath);
    const { frontmatter, content } = result;
    articles.push({
      slug,
      title: frontmatter.title || slug,
      lang,
      desc: frontmatter.desc || '',
      date: frontmatter.date || '',
      tags: frontmatter.tags || [],
      edit: frontmatter.edit || '',
      readingTime: result.readingTime,
      content,
    });
  }
  return articles.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

let Articles = undefined as Article[] | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

if (existsSync(MARKDOWN_ROOT)) {
  const watcher = watch(MARKDOWN_ROOT, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.md')) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        Articles = undefined;
      }, 100);
    }
  });

  process.on('exit', () => watcher.close());
}

export const getArticles = async () => {
  if (!Articles) {
    Articles = await getAllArticles();
  }
  return structuredClone(Articles);
};

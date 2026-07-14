import fs from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { createMarkdownExit } from 'markdown-exit';
import Shiki from '@shikijs/markdown-exit';
import readingTime from 'reading-time';

export type TocItem = { level: number; text: string; slug: string };

export type ArticleMeta = {
  slug: string;
  lang: string;
  title: string;
  desc: string;
  date: string;
  readingTime: any;
  toc: TocItem[];
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
let currentTOC: TocItem[] = [];
let externalLinkDepth = 0;

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

md.renderer.rules.heading_open = (tokens, idx, _options, _env, slf) => {
  const token = tokens[idx];
  const next = tokens[idx + 1];
  if (next?.type === 'inline' && next.content) {
    const text = next.content;
    const slug = slugifyHeading(text);
    const level = Number(token.tag.slice(1));
    token.attrSet('id', slug);
    if (level <= 3) {
      currentTOC.push({ level, text, slug });
    }
  }
  return slf.renderToken(tokens, idx, _options);
};

const isExternal = (href: string) => /^https?:\/\//i.test(href) && !href.includes('kuriyona.com');

md.renderer.rules.link_open = (tokens, idx, _options, _env, slf) => {
  const token = tokens[idx];
  const href = token.attrGet('href');
  if (href && isExternal(href)) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
    externalLinkDepth++;
  }
  return slf.renderToken(tokens, idx, _options);
};

md.renderer.rules.link_close = (_tokens, _idx, _options, _env, _slf) => {
  if (externalLinkDepth > 0) {
    externalLinkDepth--;
    return '<span class="material-symbols-outlined" style="font-size:1em;vertical-align:middle;margin-left:2px;">open_in_new</span></a>';
  }
  return '</a>';
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
  currentTOC = [];
  externalLinkDepth = 0;
  const html = await md.renderAsync(content);
  return {
    frontmatter,
    content: html,
    toc: [...currentTOC],
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
      toc: result.toc,
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
  const watcher = watch(MARKDOWN_ROOT, { recursive: true, persistent: false }, (eventType, filename) => {
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

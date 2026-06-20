import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { createMarkdownExit } from 'markdown-exit';

export type ArticleMeta = {
  slug: string;
  lang: string;
  title: string;
  desc?: string;
  date: string;
  [key: string]: any;
};

export type Article = ArticleMeta & {
  content: string;
};

const MARKDOWN_ROOT = path.resolve(process.cwd(), './app/content/blog');
const md = createMarkdownExit();

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
    content: md.render(content),
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
      ...frontmatter,
      title: frontmatter.title || slug,
      lang,
      date: frontmatter.date || '',
      tags: frontmatter.tags || [],
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

export const getArticles = async () => {
  if (!Articles) {
    Articles = await getAllArticles();
  }
  return structuredClone(Articles);
};

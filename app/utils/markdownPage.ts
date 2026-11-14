import { createMarkdownExit } from 'markdown-exit';

/** 渲染成 HTML 的一段 Markdown（块级组件之间的正文） */
export type MarkdownPageHtmlBlock = { type: 'html'; html: string };

/** 块级组件：`<Chips …>…</Chips>`，由 KMarkdownPage 映射到真实 Vue 组件 */
export type MarkdownPageComponentBlock = {
  type: 'component';
  name: string;
  attrs: Record<string, string>;
  content: string;
};

export type MarkdownPageBlock = MarkdownPageHtmlBlock | MarkdownPageComponentBlock;

export type MarkdownPageEnv = {
  /** 内链（以 `/` 开头）改写，通常是 localePath —— 让 Markdown 里只写不带语言前缀的路径 */
  resolveLink?: (href: string) => string;
};

const md = createMarkdownExit({
  html: true,
  breaks: true,
  linkify: true,
});

// 所有链接统一用 utilities.css 的 .link（站内链接同样吃主题色）；
// 内链补语言前缀，外链新窗口打开。
md.renderer.rules.link_open = (tokens, idx, options, env, slf) => {
  const token = tokens[idx];
  const href = token.attrGet('href') ?? '';
  const resolveLink = (env as MarkdownPageEnv | undefined)?.resolveLink;
  const resolved = href.startsWith('/') && resolveLink ? resolveLink(href) : href;
  token.attrSet('href', resolved);
  token.attrJoin('class', 'link');
  if (/^https?:\/\//i.test(resolved)) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
  }
  return slf.renderToken(tokens, idx, options);
};

/** 开标签独占一行：`<Chips variant="outline">`（组件名首字母大写，避免和正文里的尖括号混淆） */
const OPEN_TAG = /^[ \t]*<([A-Z][A-Za-z0-9]*)((?:[ \t]+[A-Za-z][\w-]*(?:="[^"]*")?)*)[ \t]*>[ \t]*$/;
const ATTR = /([A-Za-z][\w-]*)="([^"]*)"/g;

/**
 * 把页面 Markdown 切成「HTML 块」与「组件块」：
 * 组件标签（开、闭标签各自独占一行）以外的内容照常交给 markdown-exit 渲染，
 * 组件块保留标签名 / 属性 / 块内文本，由 KMarkdownPage 用真实 Vue 组件渲染
 * （v-html 里塞不了组件，所以必须切开）。
 *
 * 未闭合的标签当普通正文处理，不中断整页渲染。
 */
export function parseMarkdownPage(source: string, env?: MarkdownPageEnv): MarkdownPageBlock[] {
  const lines = source.split(/\r?\n/);
  const blocks: MarkdownPageBlock[] = [];
  let prose: string[] = [];

  const flushProse = () => {
    const text = prose.join('\n').trim();
    prose = [];
    if (!text) return;
    const html = md.render(text, env).trim();
    if (html) blocks.push({ type: 'html', html });
  };

  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(OPEN_TAG);
    if (!open) {
      prose.push(lines[i]);
      continue;
    }

    const name = open[1];
    const close = `</${name}>`;
    let end = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === close) {
        end = j;
        break;
      }
    }
    if (end === -1) {
      prose.push(lines[i]);
      continue;
    }

    flushProse();
    const attrs: Record<string, string> = {};
    for (const [, key, value] of open[2].matchAll(ATTR)) attrs[key] = value;
    blocks.push({
      type: 'component',
      name,
      attrs,
      content: lines.slice(i + 1, end).join('\n').trim(),
    });
    i = end;
  }

  flushProse();
  return blocks;
}

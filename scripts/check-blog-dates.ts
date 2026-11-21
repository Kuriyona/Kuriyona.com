/**
 * 检查博客 frontmatter 的 date / edit 与 git 历史是否一致。
 *
 * 检查项：
 *   1. 缺少 date（包括只写了 edit 没写 date）
 *   2. edit 早于 date
 *   3. edit（缺省取 date）不等于该文件最后一次 git 提交日期
 *   4. date 不等于该文件第一次出现在 git 里的日期
 *
 * git 日期一律取作者日期（`%ad --date=short`，本地时区），只比到天。
 * 重命名过的文件用 `--follow` 追溯原始路径。
 *
 * 用法：`bun scripts/check-blog-dates.ts`；有问题时退出码为 1。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import dayjs from 'dayjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const BLOG_DIR = path.join(ROOT, 'app/content/blog');

// 只动图片引用 / 全局改名 / 目录合并 / 纯 frontmatter（日期、AI 标注）/ 自动生成译文的提交
// 不算文章内容编辑，判断“最后一次编辑”时跳过；按提交标题匹配。
// 新增同类机械性提交时在这里补一条。
const IGNORED_COMMIT_PATTERNS = [
  /^perf:/,
  /^refactor:/,
  /^fix: 合并重复的博客内容目录/,
  /^修正文章时间$/,
  /^格式化$/,
  /^feat\(blog\): (新增 AI 翻译标签|添加 AI 生成与人工核对标注)/,
  /^feat\(blog\): 使用 OpenCC 自动生成繁体文章/,
  /^实现多语言博客$/, // 纯目录迁移（文件 0 改动）
  /^docs\(blog\): 修正文章日期与编辑日期$/, // 本脚本配套的日期修正提交
];

function git(args: string[]): string {
  const proc = Bun.spawnSync(['git', ...args], {
    cwd: ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (proc.exitCode !== 0) {
    throw new Error(`git ${args.join(' ')} 失败：${proc.stderr.toString().trim()}`);
  }
  return proc.stdout.toString().trim();
}

/** `date` / `edit` 统一成 YYYY-MM-DD；空值或无法解析返回 '' */
function normalize(value: string): string {
  const parsed = dayjs(value);
  return value && parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
}

function frontmatterField(source: string, name: 'date' | 'edit'): string {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const raw = block.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
  return raw.replace(/^['"]|['"]$/g, '');
}

async function collectArticles(): Promise<string[]> {
  const files: string[] = [];
  for (const lang of await fs.readdir(BLOG_DIR, { withFileTypes: true })) {
    if (!lang.isDirectory()) continue;
    for (const file of await fs.readdir(path.join(BLOG_DIR, lang.name), { withFileTypes: true })) {
      if (file.isFile() && file.name.endsWith('.md')) {
        files.push(path.join(BLOG_DIR, lang.name, file.name));
      }
    }
  }
  return files.sort();
}

const files = await collectArticles();
let problemCount = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const source = await fs.readFile(file, 'utf-8');
  const rawDate = frontmatterField(source, 'date');
  const rawEdit = frontmatterField(source, 'edit');
  const date = normalize(rawDate);
  const edit = normalize(rawEdit);
  // 取完整历史（含改名前的路径），按标题跳过机械性提交后取最新一条
  const history = git(['log', '--follow', '--format=%ad%x09%s', '--date=short', '--', rel])
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [date, subject = ''] = line.split('\t');
      return { date, subject };
    });
  const meaningful = history.filter(
    (commit) => !IGNORED_COMMIT_PATTERNS.some((re) => re.test(commit.subject)),
  );
  const last = meaningful[0]?.date ?? '';
  const skipped = meaningful[0] ? history.indexOf(meaningful[0]) : 0;
  // --follow 与 --reverse 同用会返回空结果，所以取“新增提交”列表的最后一条
  const first =
    git(['log', '--follow', '--diff-filter=A', '--format=%ad', '--date=short', '--', rel])
      .split('\n')
      .filter(Boolean)
      .at(-1) ?? '';

  const problems: string[] = [];
  if (rawDate && !date) problems.push(`date 不是有效日期：${rawDate}`);
  if (rawEdit && !edit) problems.push(`edit 不是有效日期：${rawEdit}`);
  if (!rawDate) problems.push('缺少 date');
  if (!last) problems.push('文件没有 git 提交历史（未提交？）');

  if (date && edit) {
    if (edit < date) problems.push(`edit（${edit}）早于 date（${date}）`);
    if (last && edit !== last) {
      problems.push(`编辑日期（${edit}）与最后一次提交日期（${last}）不一致`);
    }
  } else if (date && last && date !== last) {
    problems.push(`date（${date}）与最后一次提交日期（${last}）不一致`);
  }

  if (date && first && date !== first) {
    problems.push(`date（${date}）与首次提交日期（${first}）不一致`);
  }

  const details = `date=${date || rawDate || '—'} edit=${edit || rawEdit || '—'} first=${first || '—'} last=${last || '—'}${skipped > 0 ? `（已跳过 ${skipped} 条机械性提交）` : ''}`;
  if (problems.length === 0) {
    console.log(`✓ ${rel}\n  ${details}`);
  } else {
    problemCount++;
    console.log(`✗ ${rel}\n  ${details}`);
    for (const problem of problems) console.log(`  - ${problem}`);
  }
}

console.log(`\n共检查 ${files.length} 个文件，${problemCount} 个有问题。`);
process.exit(problemCount > 0 ? 1 : 0);

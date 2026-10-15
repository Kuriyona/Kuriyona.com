#!/usr/bin/env bun
/**
 * 扫描源码与数据里的 `prefix:name` 图标全名，生成 `app/utils/icons.gen.ts`。
 *
 * 为什么生成而不是手写：图标白名单若手工维护，漏一个就是运行时空白且没人发现。
 * 这里把「声明」交给调用点本身（`<KIcon name="material-symbols:close" />`），
 * 脚本负责校验与注册，于是：
 *   - 只有用到的图标进客户端包（不整包引入 @iconify-json）；
 *   - 名字拼错、或本地集合里不存在 → 立即失败，构建中止；
 *   - 动态拼接（`material-symbols:${x}`）→ 立即失败，而不是静默丢图标。
 *
 * 运行：`bun scripts/gen-icons.ts`（dev / generate 前置脚本，已串联在 package.json）。
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const OUT_FILE = join(ROOT, 'app/utils/icons.gen.ts');
const SCAN_DIRS = ['app', 'server'];
const SCAN_EXT = new Set(['.vue', '.ts', '.js', '.json']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.nuxt', '.output', '.cache']);
const PREFIXES = ['material-symbols', 'simple-icons'];
const NAME_RE = /(material-symbols|simple-icons):([A-Za-z0-9-]*)/g;

type IconifyEntry = { body: string } & Record<string, unknown>;
type IconifySet = {
  prefix: string;
  width?: number;
  height?: number;
  icons: Record<string, IconifyEntry>;
  aliases?: Record<string, { parent: string } & Record<string, unknown>>;
};

/** 收集到的图标名：prefix -> name -> 首个出现位置（用于报错定位） */
const used = new Map<string, Map<string, string>>();
const problems: string[] = [];

/** 注释不参与渲染，里面的图标名不该注册、也不该被当成动态拼接 —— 剥掉但保留换行以维持行号 */
const stripComments = (source: string) =>
  source
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, onFile: (file: string) => void) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile);
    else if (SCAN_EXT.has(entry.name.slice(entry.name.lastIndexOf('.')))) onFile(full);
  }
}

function add(prefix: string, name: string, where: string) {
  if (!used.has(prefix)) used.set(prefix, new Map());
  const names = used.get(prefix)!;
  if (!names.has(name)) names.set(name, where);
}

for (const dir of SCAN_DIRS)
  walk(join(ROOT, dir), (file) => {
    if (resolve(file) === OUT_FILE) return;
    const source = stripComments(readFileSync(file, 'utf8'));
    const where = relative(ROOT, file);
    for (const line of source.split('\n').entries()) {
      const [index, text] = line;
      NAME_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = NAME_RE.exec(text))) {
        const [prefix, name] = [match[1], match[2]];
        const at = `${where}:${index + 1}`;
        if (!name) {
          problems.push(`${at} 图标名是动态拼接的（${prefix}: + 变量）；图标名必须是完整字面量`);
          continue;
        }
        if (name !== name.toLowerCase()) {
          problems.push(`${at} 图标名必须全小写 kebab-case：${prefix}:${name}`);
          continue;
        }
        add(prefix, name, at);
      }
    }
  });

const iconSets = new Map<string, IconifySet>();
for (const prefix of PREFIXES) {
  const path = join(ROOT, 'node_modules/@iconify-json', prefix, 'icons.json');
  try {
    iconSets.set(prefix, JSON.parse(readFileSync(path, 'utf8')) as IconifySet);
  } catch {
    problems.push(`缺少本地图标集 @iconify-json/${prefix}，请先 pnpm install`);
  }
}

/** 解析别名（follow parent）；带形变的别名不自动展开，直接报错让人改用正名 */
function resolveEntry(set: IconifySet, name: string): IconifyEntry | undefined {
  const direct = set.icons[name];
  if (direct) return direct;
  const alias = set.aliases?.[name];
  if (!alias) return undefined;
  if (alias.rotate || alias.hFlip || alias.vFlip) {
    problems.push(
      `图标 ${set.prefix}:${name} 是带形变的别名，请改用正名 ${set.prefix}:${alias.parent}`,
    );
    return undefined;
  }
  return set.icons[alias.parent];
}

const collections: string[] = [];
for (const prefix of PREFIXES) {
  const set = iconSets.get(prefix);
  if (!set) continue;
  const names = [...(used.get(prefix) ?? new Map()).keys()].sort();
  const icons: Record<string, IconifyEntry> = {};
  for (const name of names) {
    const entry = resolveEntry(set, name);
    if (!entry) {
      problems.push(`${used.get(prefix)!.get(name)} 图标不存在于本地集合：${prefix}:${name}`);
      continue;
    }
    icons[name] = entry;
  }
  const payload: Record<string, unknown> = { prefix, width: set.width, height: set.height, icons };
  if (set.aliases) payload.aliases = {};
  collections.push(
    `addCollection(${JSON.stringify(payload, null, 2).replace(/\n/g, '\n')} as IconifyJSON);`,
  );
}

if (problems.length) {
  console.error(`✕ 图标校验失败（${problems.length}）：`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const output = `// 本文件由 scripts/gen-icons.ts 生成，请勿手动编辑（pnpm dev / pnpm generate 会自动重跑）。
// 图标名写在调用点（<KIcon name="material-symbols:close" />）与 app/config.json 里，
// 脚本扫描后只把用到的图标注册进 @iconify/vue。
import { _api, addCollection, type IconifyJSON } from '@iconify/vue';

${collections.join('\n\n')}

// 图标数据只来自本地 @iconify-json，不存在按需下载的场景；而 @iconify/vue 的默认 provider
// 指向 api.iconify.design —— 一旦有名字漏注册（拼错、动态拼接、集合外的名字），它会在运行时
// 去拉第三方 CDN。这里把下载通路替换掉，让「访客不加载任何第三方资源」成为结构性保证，
// 而不是依赖人不犯错。
_api.setFetch(() =>
  Promise.reject(new Error('图标未注册：图标名必须由 scripts/gen-icons.ts 扫描到')),
);
`;

const previous = (() => {
  try {
    return readFileSync(OUT_FILE, 'utf8');
  } catch {
    return '';
  }
})();
if (previous !== output) writeFileSync(OUT_FILE, output);

const total = [...used.values()].reduce((sum, names) => sum + names.size, 0);
const detail = PREFIXES.map((prefix) => `${prefix} ${used.get(prefix)?.size ?? 0}`).join(' / ');
console.log(
  `✓ 图标已注册：${total} 个（${detail}）→ ${relative(ROOT, OUT_FILE)}${previous === output ? '（无变化）' : ''}`,
);

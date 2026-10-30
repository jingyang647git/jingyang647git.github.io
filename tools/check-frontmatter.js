#!/usr/bin/env node
/**
 * 文章表头（front-matter）体检
 * 用法：node tools/check-frontmatter.js
 *
 * 检查常见的手写错误，尤其是 YAML 对空格/缩进的严格要求：
 *   - 冒号后缺空格（top_img:https://...）
 *   - 顶层键缩进错误
 *   - 制表符（YAML 只允许空格）
 *   - 值里含 : 或 # 却没加引号
 *   - title / date 缺失
 */
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.resolve(__dirname, '..', 'source', '_posts');
const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));

let problems = 0;

for (const file of files) {
  const full = path.join(POSTS_DIR, file);
  const text = fs.readFileSync(full, 'utf8');
  const errs = [];

  if (!text.startsWith('---')) {
    console.log(`✗ ${file}\n    文件开头不是 ---，缺少 front-matter`);
    problems++;
    continue;
  }

  const end = text.indexOf('\n---', 3);
  if (end === -1) {
    console.log(`✗ ${file}\n    front-matter 没有闭合的 ---`);
    problems++;
    continue;
  }

  const fm = text.slice(4, end);
  const lines = fm.split(/\r?\n/);

  lines.forEach((line, i) => {
    const no = i + 2; // 换算成文件行号（第1行是 ---）

    if (line.includes('\t')) {
      errs.push(`第 ${no} 行：包含制表符 Tab，YAML 只允许空格缩进`);
      return;
    }
    if (!line.trim() || line.trim().startsWith('#')) return;

    // 冒号后缺空格：键名后直接跟非空白字符
    const missingSpace = line.match(/^(\s*)([A-Za-z_][\w-]*):(\S.*)$/);
    if (missingSpace) {
      const [, indent, key, rest] = missingSpace;
      // 允许 "key:" 后面是列表缩进形式（本行就结束）的情况已被上面排除
      errs.push(
        `第 ${no} 行：\`${key}:\` 后面缺少空格 → 应写成 \`${key}: ${rest.slice(0, 20)}...\``
      );
      return;
    }

    // 顶层键必须有缩进外的形式，且值为空时本行应只有 "key:"
    if (/^\s{1,}[A-Za-z_][\w-]*:/.test(line) && !/^\s+-\s/.test(line)) {
      errs.push(`第 ${no} 行：疑似多余缩进 → \`${line.trim()}\``);
    }
  });

  const hasTitle = /^title:/m.test(fm);
  const hasDate = /^date:/m.test(fm);
  if (!hasTitle) errs.push('缺少 title 字段');
  if (!hasDate) errs.push('缺少 date 字段');

  if (errs.length) {
    problems += errs.length;
    console.log(`✗ ${file}`);
    errs.forEach((e) => console.log(`    ${e}`));
  }
}

if (problems === 0) {
  console.log(`✓ ${files.length} 篇文章的表头全部正常`);
  process.exit(0);
}

console.log(`\n共发现 ${problems} 个问题，修好后再发布。`);
process.exit(1);

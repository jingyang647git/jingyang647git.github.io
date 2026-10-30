#!/usr/bin/env node
/**
 * 生成文章表头（front-matter），并自动复制到剪贴板。
 *
 * 用法：
 *   node tools/front-matter.js "文章标题"
 *   node tools/front-matter.js "文章标题" 音乐
 *
 * 然后把光标放到 Typora 第一行，Ctrl+V 粘贴即可。
 */
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const title = (args[0] || '未命名文章').trim();
const category = (args[1] || '').trim();

const d = new Date();
const p = (n) => String(n).padStart(2, '0');
const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;

const fm = `---
title: ${title}
date: ${date}
categories: ${category}
tags:
top_img:
description:
---`;

// 复制到剪贴板（Windows 用 clip，macOS 用 pbcopy）
try {
  if (process.platform === 'win32') execSync('clip', { input: fm });
  else if (process.platform === 'darwin') execSync('pbcopy', { input: fm });
  console.error('✓ 已复制到剪贴板，回到 Typora 按 Ctrl+V');
} catch (e) {
  console.error('（剪贴板复制失败，请手动复制下面的内容）');
}

console.log(fm);

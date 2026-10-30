#!/usr/bin/env node
/**
 * 7bu 图床上传脚本（配合 Typora / VS Code 使用）
 *
 * 用法：
 *   node tools/7bu-upload.js <图片路径> [更多图片...]      → 输出图片 URL（每行一个）
 *   node tools/7bu-upload.js --markdown <图片路径>         → 输出 Markdown 语法
 *   node tools/7bu-upload.js --no-compress <图片路径>      → 不压缩，原图直传
 *
 * 出错时打印原因并以退出码 1 结束，编辑器据此提示"上传失败"而不是插入坏链接。
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const API = 'https://7bu.top/api/v1/upload';
const ROOT = path.resolve(__dirname, '..');            // blog/ 目录
const ENV_FILE = path.join(ROOT, '.env');
const BACKUP_DIR = path.join(ROOT, '_img_backup');
const MAX_BYTES = 20 * 1024 * 1024;                    // 原图上限 20MB

const COMPRESSIBLE = /\.(png|jpe?g|webp|bmp|tiff?)$/i;
const ACCEPTED = /\.(png|jpe?g|gif|webp|bmp|tiff?|svg)$/i;

// ---------- 配置 ----------
function readToken() {
  if (process.env.IMG_TOKEN) return process.env.IMG_TOKEN.trim();
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error('缺少 blog/.env 文件，请在其中写入一行：IMG_TOKEN=你的token');
  }
  const line = fs.readFileSync(ENV_FILE, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith('IMG_TOKEN='));
  if (!line) throw new Error('blog/.env 中没有 IMG_TOKEN');
  return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
}

// ---------- 压缩 ----------
async function prepare(file, compress) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file, ext);

  // gif（可能是动图）/ svg / 关闭压缩时：原样上传
  if (!compress || !COMPRESSIBLE.test(file)) {
    return {
      buf: fs.readFileSync(file),
      name: path.basename(file),
      type: ext === '.svg' ? 'image/svg+xml' : ext === '.gif' ? 'image/gif' : `image/${ext.slice(1)}`,
    };
  }

  const raw = fs.readFileSync(file);
  const buf = await sharp(file)
    .rotate()                                   // 按 EXIF 摆正手机照片
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toBuffer();

  // 原图本来就小/已是压缩格式时，压缩可能反而变大 —— 那就用原图
  if (buf.length >= raw.length) {
    return { buf: raw, name: path.basename(file), type: `image/${ext.slice(1)}` };
  }
  return { buf, name: `${base}.webp`, type: 'image/webp' };
}

// ---------- 上传 ----------
async function upload({ buf, name, type }, token, attempt = 1) {
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type }), name);

  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: fd,
  });

  const remaining = res.headers.get('x-ratelimit-remaining');
  const json = await res.json().catch(() => null);

  // 429：撞限流，退避后重试一次
  if (res.status === 429 && attempt === 1) {
    console.error('  触发限流，等待 5 秒后重试...');
    await new Promise((r) => setTimeout(r, 5000));
    return upload({ buf, name, type }, token, 2);
  }

  if (!res.ok || !json || !json.status) {
    const reason = (json && json.message) || `HTTP ${res.status}`;
    if (res.status === 401) throw new Error(`授权失败（401）：token 无效或已重置，请更新 blog/.env`);
    if (res.status === 429) throw new Error(`请求过于频繁（429），额度剩余 ${remaining ?? '未知'}`);
    throw new Error(`上传失败：${reason}`);
  }

  if (remaining !== null && Number(remaining) <= 5) {
    console.error(`  注意：本分钟剩余配额 ${remaining}`);
  }
  return json.data;
}

// ---------- 本地留档 ----------
function backup(file) {
  const d = new Date();
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(BACKUP_DIR, ym);
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  fs.copyFileSync(file, path.join(dir, `${stamp}-${path.basename(file)}`));
}

// ---------- 主流程 ----------
(async () => {
  const argv = process.argv.slice(2);
  const asMarkdown = argv.includes('--markdown');
  const compress = !argv.includes('--no-compress');
  const files = argv.filter((a) => !a.startsWith('--'));

  if (files.length === 0) throw new Error('用法：node tools/7bu-upload.js <图片路径>');

  const token = readToken();

  for (const file of files) {
    if (!fs.existsSync(file)) throw new Error(`文件不存在：${file}`);
    if (!ACCEPTED.test(file)) throw new Error(`不支持的格式：${path.basename(file)}`);
    const stat = fs.statSync(file);
    if (stat.size > MAX_BYTES) throw new Error(`文件过大（${(stat.size / 1048576).toFixed(1)}MB）：${path.basename(file)}`);

    const payload = await prepare(file, compress);
    const saved = ((stat.size - payload.buf.length) / stat.size) * 100;
    if (compress && COMPRESSIBLE.test(file)) {
      console.error(`  ${path.basename(file)}：${(stat.size / 1024).toFixed(0)}KB → ${(payload.buf.length / 1024).toFixed(0)}KB（省 ${saved.toFixed(0)}%）`);
    }

    const data = await upload(payload, token);
    backup(file);

    const url = String(data.links?.url || '').replace(/^http:\/\//, 'https://');
    if (!url) throw new Error('接口未返回图片地址');

    // 编辑器只认标准输出的第一行
    console.log(asMarkdown ? `![](${url})` : url);
  }
})().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});

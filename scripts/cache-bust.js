'use strict'
/**
 * 给自维护的 CSS 加内容指纹，绕过 Vercel 的强缓存
 *
 * 原因：Vercel 对静态资源返回 Cache-Control: public, max-age=31536000, immutable，
 * 同一个 URL 会被浏览器缓存一年。改了 custom.css 后访客（包括自己）看不到变化。
 * 这里在生成时按文件内容算一个短 hash 拼到 URL 上：
 *   /css/custom.css  ->  /css/custom.css?v=8f3c1a2b
 * 内容一变地址就变，浏览器自然重新下载；内容不变则继续命中缓存。
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// 需要指纹化的文件：站点根目录相对路径
const ASSETS = ['css/custom.css']

const versions = {}

hexo.on('generateBefore', function () {
  ASSETS.forEach(function (rel) {
    const file = path.join(hexo.base_dir, 'source', rel)
    if (!fs.existsSync(file)) return
    versions[rel] = crypto
      .createHash('md5')
      .update(fs.readFileSync(file))
      .digest('hex')
      .slice(0, 8)
  })
})

hexo.extend.filter.register('after_render:html', function (str) {
  Object.keys(versions).forEach(function (rel) {
    const v = versions[rel]
    // 同时兼容绝对路径和带域名的写法，双引号/单引号
    const pattern = new RegExp('(["\'])((?:https?:\\/\\/[^"\']*?)?/' + rel + ')\\1', 'g')
    str = str.replace(pattern, function (m, quote, url) {
      return quote + url + '?v=' + v + quote
    })
  })
  return str
}, 6)

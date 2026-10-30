'use strict'
/**
 * 首页分类卡片（自渲染，替代 hexo-butterfly-categories-card）
 *
 * 为什么不用插件：
 *   插件用 categories_list[i] 与 config.message[i] 按「索引」强行配对，
 *   分类顺序一旦变化（新增文章、改分类），封面和描述就会整体错位。
 *   这里改成按「分类名」配对，配置顺序即展示顺序，永久稳定。
 *
 * 配置位置：_config.butterfly.yml 里的 category_cards 段
 *   category_cards:
 *     enable: true
 *     show_count: true
 *     cards:
 *       - name: 建站手记
 *         cover: https://...
 *         descr: 一句话描述
 *
 * 实现方式：渲染完成后把卡片 HTML 静态插入 #recent-posts 开头，
 * 不依赖前端 JS 注入，和 pjax 天然兼容（HTML 随页面一起被替换）。
 */

const escapeHtml = function (str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

hexo.extend.filter.register('after_render:html', function (str, data) {
  const conf = hexo.theme.config.category_cards || hexo.config.category_cards
  if (!conf || !conf.enable) return str
  if (!data || data.path !== 'index.html') return str
  if (!conf.cards || !conf.cards.length) return str

  // 取真实分类数据：用 name 建索引，顺带拿到文章数和真实链接
  const categories = hexo.locals.get('categories')
  const byName = {}
  categories.forEach(function (cat) {
    byName[cat.name] = cat
  })

  let html = ''
  conf.cards.forEach(function (card) {
    const cat = byName[card.name]
    if (!cat) return // 分类还不存在（还没有文章归入），直接跳过
    const href = encodeURI('/' + cat.path)
    const count = cat.length
    const countHtml = conf.show_count === false
      ? ''
      : `<span class="category-card-count">${count} 篇</span>`

    html += `
      <a class="category-card" href="${escapeHtml(href)}" title="${escapeHtml(card.name)}">
        <span class="category-card-cover" style="background-image:url('${escapeHtml(card.cover)}')"></span>
        <span class="category-card-mask"></span>
        <span class="category-card-body">
          ${countHtml}
          <span class="category-card-name">${escapeHtml(card.name)}</span>
          <span class="category-card-descr">${escapeHtml(card.descr || '')}</span>
        </span>
      </a>`
  })

  if (!html) return str

  const block = `<div class="category-cards-panel"><div class="category-cards">${html}\n</div></div>`

  // 插到首页文章列表最前面
  return str.replace(/(<div[^>]*id="recent-posts"[^>]*>)/, '$1' + block)
}, 5)

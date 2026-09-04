/**
 * 自定义页脚计时器脚本
 * 替换 hexo-butterfly-footer-beautify 插件的硬编码格式
 * 直接从页面全局变量 window.SITE_CREATE_TIME 读取建站时间
 * 全局变量通过 Pug 模板注入（在 layout/_partial/footer.pug 等位置）
 */

// 从全局变量读取建站时间（在主题配置中设置）
function getCreateTime() {
  // 优先从 window 全局变量读取（推荐方式，主题注入）
  if (typeof window.SITE_CREATE_TIME !== 'undefined' && window.SITE_CREATE_TIME) {
    return window.SITE_CREATE_TIME;
  }
  // 兜底：从 data 属性读取（兼容旧版插件）
  const workboard = document.getElementById('workboard');
  if (workboard && workboard.dataset.createTime) {
    return workboard.dataset.createTime;
  }
  // 最后兜底：2026-09-03 00:00:00（与 _config.butterfly.yml 中 footer_beautify.runtime.start_date 一致）
  return '2026-09-03 00:00:00';
}

setInterval(() => {
  const createTimeStr = getCreateTime();
  let create_time = Math.round(new Date(createTimeStr).getTime() / 1000);
  let timestamp = Math.round((new Date().getTime()) / 1000);
  let second = timestamp - create_time;

  // 计算天、时、分、秒
  let days = parseInt(second / (24 * 3600));
  let hours = parseInt((second % (24 * 3600)) / 3600);
  let minutes = parseInt((second % 3600) / 60);
  let seconds = second % 60;

  // 格式化显示，补零
  const pad = (n) => n < 10 ? '0' + n : n;
  const daysStr = days > 0 ? days + ' 天 ' : '';
  const hoursStr = pad(hours);
  const minutesStr = pad(minutes);
  const secondsStr = pad(seconds);

  // 显示格式：已运行 X 天 X 时 X 分 X 秒
  let currentTimeHtml = '已运行 ' + daysStr + hoursStr + ' 时 ' + minutesStr + ' 分 ' + secondsStr + ' 秒';

  const workboard = document.getElementById("workboard");
  if (workboard) {
    workboard.innerHTML = '<div id="runtime">' + currentTimeHtml + '</div>';
  }
}, 1000);

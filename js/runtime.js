/**
 * 自定义页脚计时器脚本
 * 替换 hexo-butterfly-footer-beautify 插件的硬编码格式
 * 支持从配置读取建站时间和显示格式
 */

// 从页面 data 属性读取建站时间（由插件注入）
function getCreateTime() {
  const workboard = document.getElementById('workboard');
  if (workboard && workboard.dataset.createTime) {
    return workboard.dataset.createTime;
  }
  // 默认值：2025-01-01 00:00:00
  return '2025-01-01 00:00:00';
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

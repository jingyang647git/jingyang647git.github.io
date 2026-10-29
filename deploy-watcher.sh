#!/bin/bash
# 网络恢复自动部署监视器：每 20 秒检测一次，最多 30 次（约 10 分钟）
cd "/d/down/jingyang647git.github.io-main/blog"

check() { curl -s -o /dev/null -w "%{http_code}" --max-time 6 "$@" https://github.com 2>/dev/null; }

for i in $(seq 1 30); do
  # 1) 直连
  if [ "$(check --noproxy '*')" = "200" ]; then
    echo "[第${i}轮] 直连可用，清除代理配置并部署..."
    git --git-dir=.deploy_git/.git config --unset http.proxy 2>/dev/null
    git --git-dir=.deploy_git/.git config --unset https.proxy 2>/dev/null
    GIT_TERMINAL_PROMPT=0 npx hexo deploy 2>&1 | tail -3
    exit 0
  fi
  # 2) 常见代理端口
  for port in 7890 7897 13764 10809 2080; do
    if [ "$(check -x http://127.0.0.1:$port)" = "200" ]; then
      echo "[第${i}轮] 代理 127.0.0.1:$port 可用，配置并部署..."
      git --git-dir=.deploy_git/.git config http.proxy "http://127.0.0.1:$port"
      git --git-dir=.deploy_git/.git config https.proxy "http://127.0.0.1:$port"
      GIT_TERMINAL_PROMPT=0 npx hexo deploy 2>&1 | tail -3
      exit 0
    fi
  done
  echo "[第${i}轮] 尚不可达，20 秒后重试..."
  sleep 20
done
echo "10 分钟内网络未恢复，监视器退出。网络恢复后手动执行: npm run publish"
exit 1

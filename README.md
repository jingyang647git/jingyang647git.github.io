# jingyang647git-blog

Hexo 8.1.2 + Butterfly 5.7.0 博客源码工程。
生成产物推送到 GitHub 仓库 `jingyang647git/jingyang647git.github.io`，
由 **Vercel** 托管并绑定自定义域名 **sovely.cn**。

---

## 一、日常命令

```bash
cd /d/down/jingyang647git.github.io-main/blog

npm run server        # 本地预览 http://localhost:4000 （改文件会自动刷新）
npm run clean         # 清缓存 + 删 public
npm run build         # 生成静态文件到 public/
npm run deploy        # 生成并推送到 GitHub（Vercel 自动更新）
```

也可以直接用 npx：

```bash
npx hexo new "文章标题"     # 新建文章 → source/_posts/
npx hexo clean && npx hexo generate && npx hexo deploy
```

首次 `deploy` 会要求输入 GitHub 用户名 + **Personal Access Token**（勾 `repo` 权限），
不是账号登录密码。想免输入可把 `_config.yml` 的 repo 写成：
`https://<你的token>@github.com/jingyang647git/jingyang647git.github.io.git`（注意别把带 token 的文件提交到公开仓库）。

---

## 二、目录结构

```
blog/
├─ _config.yml              # 站点配置（标题、URL、部署、看板娘）
├─ _config.butterfly.yml    # 主题配置（只写覆盖项，默认值见主题包内 _config.yml）
├─ package.json             # 依赖清单
├─ scaffolds/               # 新建文章的模板
├─ source/
│   ├─ _posts/              # 文章（Markdown）
│   │   └─ tingshu面试深挖.md
│   ├─ about/ music/ movies/ comments/ link/     # 独立页面（index.md）
│   ├─ archives/ tags/ categories/               # 归档 / 标签 / 分类页
│   ├─ css/custom.css       # 自定义样式（从旧站原样回收）
│   ├─ css/runtime.css      # 自定义样式 2
│   ├─ js/runtime.js        # 页脚运行时长脚本
│   ├─ img/                 # 背景图、favicon、404 图等
│   └─ vercel.json          # 会被复制到 public/，供 Vercel 读缓存头配置
└─ public/                  # 生成结果（已 gitignore，不提交）
```

---

## 三、已还原的功能清单

| 功能 | 实现方式 | 配置位置 |
|---|---|---|
| 主题 Butterfly 5.7.0 | npm 依赖 `hexo-theme-butterfly` | `_config.yml: theme: butterfly` |
| 首页透明头图 + 全屏背景 | `index_img: transparent` + `background` | `_config.butterfly.yml` |
| 内页无头图 | `default_top_img: false` | 同上 |
| 导航（含「列表」二级菜单） | `menu` | 同上 |
| 侧栏：作者卡 / 公告 / 归档 / 网站信息 | `aside` 各卡片开关 | 同上 |
| 看板娘 koharu | `hexo-helper-live2d` + `live2d-widget-model-koharu` | `_config.yml: live2d` |
| 评论 Twikoo | 自建服务 `https://comments.sovely.cn/` | `_config.butterfly.yml: twikoo` |
| 本地搜索 | `hexo-generator-searchdb` + `search.xml` | `_config.yml: search` |
| 字数 / 阅读时长 / 全站字数 | `hexo-wordcount` | `wordcount: enable: true` |
| 简繁转换 | `translate: enable: true` | `_config.butterfly.yml` |
| 首页分类卡片 | `hexo-butterfly-categories-card` | `categoryBar` |
| 页脚运行时 + 徽标 | `hexo-butterfly-footer-beautify` + `js/runtime.js` | `footer_beautify` |
| 双排文章卡片 | 注入 `cardlistpost.min.css` | `inject.head` |
| 音乐播放器 APlayer / Meting | 全局注入 CDN 脚本 | `inject` |
| 字体霞鹜文楷 | 注入 lxgw-wenkai webfont | `inject.head` |
| 文章目录 TOC | `toc.post: true` | `_config.butterfly.yml` |
| 代码块 Mac 按钮 + 高度折叠 | `code_blocks.macStyle` / `height_limit: 300` | 同上 |
| 标题美化 / 相对时间 | `beautify` / `post_meta.date_format: relative` | 同上 |
| 404 页 | `error_404: enable: true` | 同上 |

---

## 四、注意事项

1. **时区**：`_config.yml` 里 `timezone: 'Asia/Shanghai'`，Windows 上不要删，否则文章时间会偏 8 小时。
2. **中文永久链接**：`permalink: :year/:month/:day/:title/`，中文标题会生成中文目录名
   （现有文章路径就是 `/2026/09/15/tingshu面试深挖/`）。想改成英文短链可加 `hexo-abbrlink` 插件，
   但**会改变已有文章 URL**，需要配 301 或接受旧链接失效。
3. **部署方向**：`hexo deploy` 会 force push 覆盖仓库 `main` 分支内容，
   仓库里只放生成结果（Vercel 直接当静态站点托管）。源码不要提交到这个仓库。
4. **Vercel 不用改**：项目仍是「无构建、直接托管静态文件」模式，域名绑定也不受影响。
5. **更换看板娘**：`_config.yml: live2d.model.use` 改成别的 `live2d-widget-model-*` 包，
   并 `npm i` 对应模型包。
6. **改主题配置**：`_config.butterfly.yml` 只写需要覆盖的项，主题升级不会覆盖你的修改。

---

## 五、验证过的命令

```bash
npx hexo version      # hexo-cli 4.3.2 / hexo 8.1.2 / node 22.22.2
npx hexo generate     # 50 个文件，无报错
```

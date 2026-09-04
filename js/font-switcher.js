/**
 * 字体切换脚本
 * 支持5种字体：默认系统字体、思源黑体、霞鹜文楷、鸿蒙黑体、阿里巴巴普惠体
 * 默认字体：霞鹜文楷
 * 选择会保存到 localStorage，下次访问自动应用
 */

(function() {
  'use strict';

  // 字体配置 - 默认字体改为霞鹜文楷
  const FONTS = {
    default: {
      name: '霞鹜文楷',
      family: "'LXGW WenKai', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    noto: {
      name: '思源黑体',
      family: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    wenkai: {
      name: '霞鹜文楷',
      family: "'LXGW WenKai', sans-serif"
    },
    harmonyos: {
      name: '鸿蒙黑体',
      family: "'HarmonyOS Sans SC', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    alibaba: {
      name: '阿里巴巴普惠体',
      family: "'Alibaba PuHuiTi', -apple-system, BlinkMacSystemFont, sans-serif"
    }
  };

  const STORAGE_KEY = 'blog-font-preference';
  const DEFAULT_FONT = 'default'; // 默认使用霞鹜文楷

  /**
   * 应用字体到整个页面
   */
  function applyFont(fontKey) {
    const font = FONTS[fontKey] || FONTS[DEFAULT_FONT];
    document.documentElement.style.setProperty('--global-font', font.family);
    document.documentElement.style.setProperty('--font-family', font.family);
    document.body.style.fontFamily = font.family;

    // 创建/更新全局字体样式
    const styleId = 'blog-global-font-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    // 排除 FontAwesome 图标元素，避免图标被中文字体覆盖
    styleEl.innerHTML = `
      body, div, p, span, a, li, article, section, header, footer, main, nav, aside,
      h1, h2, h3, h4, h5, h6, .article-content, .article-text, .post-content {
        font-family: ${font.family} !important;
      }
    `;

    window.currentFontKey = fontKey;
  }

  /**
   * 保存字体选择到 localStorage
   */
  function saveFont(fontKey) {
    try {
      localStorage.setItem(STORAGE_KEY, fontKey);
    } catch (e) {
      console.warn('localStorage 不可用', e);
    }
  }

  /**
   * 从 localStorage 读取字体选择
   */
  function loadFont() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_FONT;
    } catch (e) {
      return DEFAULT_FONT;
    }
  }

  /**
   * 创建切换按钮 UI
   */
  function createUI() {
    const btn = document.createElement('button');
    btn.className = 'font-switcher-btn';
    btn.setAttribute('aria-label', '切换字体');
    btn.title = '切换字体';
    btn.innerHTML = '<i class="fas fa-font"></i>';

    const panel = document.createElement('div');
    panel.className = 'font-switcher-panel';

    Object.keys(FONTS).forEach(key => {
      const option = document.createElement('div');
      option.className = 'font-option';
      option.setAttribute('data-font', key);
      option.innerHTML = `
        <span>${FONTS[key].name}</span>
        <span class="check-icon">✓</span>
      `;
      option.addEventListener('click', () => {
        selectFont(key);
        panel.classList.remove('active');
      });
      panel.appendChild(option);
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.remove('active');
      }
    });

    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  /**
   * 选择字体并更新 UI 状态
   */
  function selectFont(fontKey) {
    if (!FONTS[fontKey]) return;
    applyFont(fontKey);
    saveFont(fontKey);
    updateOptionUI(fontKey);
  }

  /**
   * 更新选项 UI 的 active 状态
   */
  function updateOptionUI(activeKey) {
    document.querySelectorAll('.font-option').forEach(opt => {
      if (opt.getAttribute('data-font') === activeKey) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  /**
   * 初始化
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    createUI();

    const savedFont = loadFont();
    applyFont(savedFont);
    updateOptionUI(savedFont);
  }

  init();
})();

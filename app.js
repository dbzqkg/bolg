// ========== 个人博客 3D 环绕菜单 ==========
// 核心方案：CSS 3D transforms（preserve-3d）布局 + GSAP 动画驱动

(function () {
  'use strict';

  // ---------- 开始页面动画 ----------
  (function () {
    var landing = document.getElementById('landing');
    if (!landing) return;
    var entered = false;

    function doEnter() {
      if (entered) return;
      entered = true;

      gsap.to(landing, {
        yPercent: -100,
        opacity: 0,
        duration: 0.8,
        ease: 'power4.inOut',
        onComplete: function () {
          landing.style.display = 'none';
        }
      });

      // 主场景渐入
      gsap.to('#scene', {
        opacity: 1,
        duration: 0.8,
        delay: 0.2
      });

      // 中心图片弹入
      gsap.to('#center-image', {
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
        delay: 0.3
      });

      // 小图标弹入
      gsap.to('#info-toggle', {
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
        delay: 0.5
      });

      // 选项卡片依次弹入
      function animateCards() {
        var cards = document.querySelectorAll('.ring-item .card');
        if (cards.length === 0) {
          // 卡片还没创建，延迟重试
          requestAnimationFrame(animateCards);
          return;
        }
        gsap.to(cards, {
          opacity: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: 'back.out(2)',
          delay: 0.4
        });
      }
      animateCards();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        doEnter();
      }
    });
  })();

  // ---------- 禁止浏览器缩放 ----------
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '0' || e.key === '+' || e.key === 'NumpadAdd' || e.key === 'NumpadSubtract')) {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('wheel', function(e) {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  }, { passive: false });

  // ---------- 读取配置 ----------
  const cfg = typeof BLOG_CONFIG !== 'undefined' ? BLOG_CONFIG : {};
  const bgCfg = cfg.background || { type: 'none', value: '' };
  const centerImgCfg = cfg.centerImage || { path: '', alt: '' };
  const rawItems = cfg.menuItems || [];
  const styleCfg = cfg.style || {};
  const ringCfg = styleCfg.ring || {};

  const DEFAULT_LABELS = ['选项一', '选项二', '选项三', '选项四'];
  const DEFAULT_LINK = './pages/hello.html';
  const ASSETS_BASE = 'assets/';

  // 资源路径解析：所有路径默认以 assets/ 为根目录
  function resolvePath(path) {
    if (!path) return '';
    // 已经是完整 URL 或以 / 开头，不处理
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
    return ASSETS_BASE + path;
  }

  const tiltAngle = ringCfg.tiltAngle != null ? ringCfg.tiltAngle : 25;
  const radiusXPct = ringCfg.radiusX != null ? ringCfg.radiusX : 25;
  const radiusYPct = ringCfg.radiusY != null ? ringCfg.radiusY : 25;
  const itemW = ringCfg.itemWidth != null ? ringCfg.itemWidth : 210;
  const itemH = ringCfg.itemHeight != null ? ringCfg.itemHeight : 63;
  const scrollSens = styleCfg.scrollSensitivity != null ? styleCfg.scrollSensitivity : 30;

  // 确保 4 个选项
  const menuItems = [];
  for (let i = 0; i < 4; i++) {
    const r = rawItems[i] || {};
    menuItems.push({
      label: r.label || DEFAULT_LABELS[i],
      link: r.link || '',
      image: r.image || '',
      angle: r.angle != null ? r.angle : i * 90,
      page: r.page || ''
    });
  }

  // ---------- CSS 变量 ----------
  document.documentElement.style.setProperty('--tilt', tiltAngle + 'deg');
  document.documentElement.style.setProperty('--item-w', itemW + 'px');
  document.documentElement.style.setProperty('--item-h', itemH + 'px');

  // ---------- 背景 ----------
  const bgEl = document.getElementById('bg');
  (function () {
    const t = bgCfg.type, v = bgCfg.value;
    if (!t || t === 'none' || !v) { bgEl.style.background = '#f0f0eb'; }
    else if (t === 'color') { bgEl.style.background = v; }
    else if (t === 'image') { bgEl.style.background = `url('${resolvePath(v)}') center/cover no-repeat`; }
    else if (t === 'gradient') { bgEl.style.background = v; }
  })();

  // ---------- 中心图片 ----------
  const centerEl = document.getElementById('center-image');
  (function () {
    if (centerImgCfg.path) {
      const img = document.createElement('img');
      img.src = resolvePath(centerImgCfg.path);
      img.alt = centerImgCfg.alt || '';
      img.onerror = function () {
        centerEl.innerHTML = '<div class="placeholder">图片加载失败</div>';
      };
      centerEl.appendChild(img);
    } else {
      centerEl.innerHTML = '<div class="placeholder">中心图片<br/>（配置中设置路径）</div>';
    }
  })();

  // ---------- 构建 3D 环 ----------
  const ringEl = document.getElementById('ring');
  const sceneEl = document.getElementById('scene');

  let rx, ry;
  function calcRadius() {
    rx = (window.innerWidth * radiusXPct) / 100;
    ry = (window.innerHeight * radiusYPct) / 100;
  }
  calcRadius();
  window.addEventListener('resize', calcRadius);

  // 当前旋转角度（0/90/180/270 四档）
  let currentRotation = 0;

  // 创建选项 DOM
  const itemEls = [];
  menuItems.forEach(function (item, idx) {
    const el = document.createElement('div');
    el.className = 'ring-item';
    el.dataset.index = idx;

    const card = document.createElement('div');
    card.className = 'card';

    if (item.image) {
      const img = document.createElement('img');
      img.src = resolvePath(item.image);
      img.alt = item.label;
      card.appendChild(img);
    }

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = item.label;
    card.appendChild(label);

    el.appendChild(card);
    ringEl.appendChild(el);
    itemEls.push(el);

    // hover/click 绑定在 card 上（pointer-events: auto）
    card.addEventListener('mouseenter', function () {
      card.style.transform = 'skewX(-12deg) scale(1.15)';
      card.style.boxShadow = '20px 20px 0 #000';
      card.style.backgroundColor = '#ddd';
      card.style.filter = 'brightness(0.85)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = 'skewX(-12deg)';
      card.style.boxShadow = '10px 10px 0 #000';
      card.style.backgroundColor = '#fff';
      card.style.filter = 'grayscale(1) contrast(1.6)';
    });
    card.addEventListener('click', function (e) {
      e.stopPropagation();
      if (item.page) {
        window.openPage(item.page);
      } else if (item.link) {
        window.open(item.link, '_blank');
      }
    });
  });

  // ---------- 位置更新（CSS 3D） ----------
  function updatePositions() {
    const tiltRad = tiltAngle * Math.PI / 180;

    menuItems.forEach(function (item, idx) {
      const angleDeg = item.angle + currentRotation;
      const angleRad = angleDeg * Math.PI / 180;

      // 在 XY 平面上的环形位置，整体左移 5%
      var offsetX = -window.innerWidth * 0.03;
      const x = rx * Math.cos(angleRad) + offsetX;
      const y = ry * Math.sin(angleRad);

      // 应用倾斜（绕 X 轴旋转 tiltAngle）→ 产生 Z 深度
      const z = y * Math.sin(tiltRad);
      const yTilted = y * Math.cos(tiltRad);

      const el = itemEls[idx];

      // CSS 3D 定位
      el.style.transform =
        `translate3d(${x}px, ${yTilted}px, ${z}px)`;

      // Z 深度排序
      const isFront = z > 0;
      el.style.zIndex = isFront ? 100 + Math.round(z) : 10 - Math.round(Math.abs(z));
      el.dataset.side = isFront ? 'front' : 'back';

      // 卡片：不反向抵消，跟随环面倾斜（左上到右下）
      const card = el.querySelector('.card');
      card.style.transform = '';
    });
  }

  updatePositions();

  // ---------- GSAP 快速切换（snap） ----------
  let isSwitching = false;

  function snapRotate(targetRotation) {
    if (isSwitching) return;
    isSwitching = true;

    gsap.to({ val: currentRotation }, {
      val: targetRotation,
      duration: 0.25,
      ease: 'back.out(1.2)',
      onUpdate: function () {
        currentRotation = this.targets()[0].val;
        updatePositions();
      },
      onComplete: function () {
        // 吸附到最近的 90° 档位
        currentRotation = Math.round(currentRotation / 90) * 90;
        updatePositions();
        isSwitching = false;
      }
    });
  }

  // ---------- 鼠标判定 + 滚轮 ----------
  let isOnRing = false;

  function isMouseOnRing(mx, my) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = mx - cx, dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const innerR = Math.min(rx, ry) * 0.3;
    const outerR = Math.max(rx, ry) * 1.3 + Math.max(itemW, itemH) * 0.6;
    return dist >= innerR && dist <= outerR;
  }

  sceneEl.addEventListener('mousemove', function (e) {
    isOnRing = isMouseOnRing(e.clientX, e.clientY);
    sceneEl.classList.toggle('on-ring', isOnRing);
    sceneEl.style.cursor = isOnRing ? 'grab' : 'default';
  });

  sceneEl.addEventListener('mouseleave', function () {
    isOnRing = false;
    sceneEl.classList.remove('on-ring');
  });

  // 滚轮切换——快速 snap 到下一档
  sceneEl.addEventListener('wheel', function (e) {
    if (!isOnRing) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? 90 : -90;
    snapRotate(currentRotation + dir);
  }, { passive: false });

  // ---------- 键盘操作 ----------
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      snapRotate(currentRotation - 90);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      snapRotate(currentRotation + 90);
    } else if (e.key === 'Escape') {
      if (window.closePage) window.closePage();
      var panelEl = document.getElementById('info-panel');
      if (panelEl && panelEl.classList.contains('open')) {
        panelEl.classList.remove('open');
        setTimeout(function () { if (!panelEl.classList.contains('open')) panelEl.style.display = 'none'; }, 300);
      }
    }
  });

  // ---------- 触屏滑动切换环（手机端） ----------
  (function () {
    var touchStartX = 0;
    var touchStartY = 0;
    var isSwiping = false;

    document.addEventListener('touchstart', function (e) {
      if (e.target.closest('#info-panel') || e.target.closest('.overlay-close') || e.target.closest('#info-toggle')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!isSwiping) return;
      isSwiping = false;

      var touch = e.changedTouches[0];
      var dx = touch.clientX - touchStartX;
      var dy = touch.clientY - touchStartY;

      if (Math.abs(dx) < 30) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.5) return;

      var dir = dx < 0 ? 90 : -90;
      snapRotate(currentRotation + dir);
    }, { passive: true });
  })();

  // ---------- 触屏卡片 touch-active 效果 ----------
  (function () {
    document.addEventListener('touchstart', function (e) {
      var card = e.target.closest('.ring-item .card');
      if (!card) return;
      card.classList.add('touch-active');
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      var card = e.target.closest('.ring-item .card');
      if (!card) return;
      setTimeout(function () {
        card.classList.remove('touch-active');
      }, 150);
    }, { passive: true });
  })();

  // ---------- 窗口缩放 ----------
  window.addEventListener('resize', function () {
    calcRadius();
    updatePositions();
  });

  // ---------- 页面覆盖层 ----------
  (function () {
    var overlay = document.getElementById('page-overlay');
    if (!overlay) return;
    var closeBtn = overlay.querySelector('.overlay-close');
    var titleEl = overlay.querySelector('.overlay-title');
    var subtitleEl = overlay.querySelector('.overlay-subtitle');
    var imgWrap = overlay.querySelector('.overlay-img');
    var imgEl = imgWrap.querySelector('img');
    var pagesCfg = cfg.pages || {};

    function openPage(pageKey) {
      var pageData = pagesCfg[pageKey];
      if (!pageData) return;

      titleEl.textContent = pageData.title;
      subtitleEl.textContent = pageData.subtitle || '';

      if (pageData.image) {
        imgEl.src = resolvePath(pageData.image);
        imgEl.alt = pageData.title;
        imgWrap.style.display = 'block';
        var scale = pageData.scale || 1.2;
        var ox = pageData.offsetX || 0;
        var oy = pageData.offsetY || 0;
        imgWrap.style.transform = 'translateY(-50%) scale(' + scale + ') translate(' + ox + 'px,' + oy + 'px)';
      } else {
        imgWrap.style.display = 'none';
      }

      overlay.style.display = 'block';
      localStorage.setItem('blog-current-page', pageKey);
      requestAnimationFrame(function () {
        overlay.classList.add('open');
      });
    }

    function closePage() {
      overlay.classList.remove('open');
      localStorage.removeItem('blog-current-page');
      setTimeout(function () { overlay.style.display = 'none'; }, 300);
    }

    closeBtn.addEventListener('click', closePage);

    // 刷新恢复上次页面
    var savedPage = localStorage.getItem('blog-current-page');
    if (savedPage && pagesCfg[savedPage]) {
      // 跳过开始页面动画，直接进入
      var landing = document.getElementById('landing');
      if (landing) {
        landing.style.display = 'none';
        gsap.set('#scene', { opacity: 1 });
        gsap.set('#center-image', { opacity: 1 });
        gsap.set('#info-toggle', { opacity: 1 });
        gsap.set('.ring-item .card', { opacity: 1 });
      }
      openPage(savedPage);
    }

    // 暴露给外部调用
    window.openPage = openPage;
    window.closePage = closePage;
  })();

  // ---------- 右下角信息面板 ----------
  (function () {
    var infoCfg = cfg.infoPanel || {};
    if (!infoCfg.enabled) return;

    var toggleEl = document.getElementById('info-toggle');
    var panelEl = document.getElementById('info-panel');
    var isOpen = false;
    var moved = false;
    var panelGap = 12;

    // 填充内容
    if (infoCfg.icon) {
      var iconDiv = panelEl.querySelector('.panel-icon');
      var img = document.createElement('img');
      img.src = resolvePath(infoCfg.icon);
      img.alt = '';
      iconDiv.appendChild(img);
    }
    if (infoCfg.title) {
      panelEl.querySelector('.panel-title').textContent = infoCfg.title;
    }
    if (infoCfg.content) {
      panelEl.querySelector('.panel-content').textContent = infoCfg.content;
    }

    // 按钮图标
    if (infoCfg.icon) {
      var toggleImg = document.createElement('img');
      toggleImg.className = 'toggle-icon';
      toggleImg.src = resolvePath(infoCfg.icon);
      toggleImg.alt = '';
      toggleEl.appendChild(toggleImg);
    } else {
      var plus = document.createElement('span');
      plus.className = 'toggle-plus';
      plus.textContent = '+';
      toggleEl.appendChild(plus);
    }

    // 根据按钮位置自动调整面板位置
    function updatePanelPosition() {
      var rect = toggleEl.getBoundingClientRect();
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var pw = panelEl.offsetWidth || 320;
      var ph = panelEl.offsetHeight || 200;

      var isRight = (rect.left + rect.width / 2) > vw / 2;
      var isTop = (rect.top + rect.height / 2) < vh / 2;

      panelEl.style.left = '';
      panelEl.style.top = '';
      panelEl.style.right = '';
      panelEl.style.bottom = '';

      // 左右方向
      if (isRight) {
        if (rect.left - panelGap >= pw) {
          panelEl.style.right = (vw - rect.left + panelGap) + 'px';
        } else {
          panelEl.style.left = (rect.right + panelGap) + 'px';
        }
      } else {
        if (vw - rect.right - panelGap >= pw) {
          panelEl.style.left = (rect.right + panelGap) + 'px';
        } else {
          panelEl.style.right = (vw - rect.left + panelGap) + 'px';
        }
      }

      // 上下方向
      if (isTop) {
        if (vh - rect.bottom - panelGap >= ph) {
          panelEl.style.top = (rect.bottom + panelGap) + 'px';
        } else {
          panelEl.style.bottom = (vh - rect.top + panelGap) + 'px';
        }
      } else {
        if (rect.top - panelGap >= ph) {
          panelEl.style.bottom = (vh - rect.top + panelGap) + 'px';
        } else {
          panelEl.style.top = (rect.bottom + panelGap) + 'px';
        }
      }
    }

    function toggle() {
      if (moved) { moved = false; return; }
      isOpen = !isOpen;
      if (isOpen) {
        panelEl.style.display = 'block';
        requestAnimationFrame(function () {
          updatePanelPosition();
          panelEl.classList.add('open');
        });
      } else {
        panelEl.classList.remove('open');
        setTimeout(function () {
          if (!isOpen) panelEl.style.display = 'none';
        }, 300);
      }
    }

    toggleEl.addEventListener('click', toggle);

    // ---- 拖动 ----
    (function () {
      var dragging = false;
      var startX, startY, startLeft, startBottom;
      var SIZE = 48;

      function onStart(e) {
        dragging = true;
        moved = false;
        var pt = e.touches ? e.touches[0] : e;
        startX = pt.clientX;
        startY = pt.clientY;
        var rect = toggleEl.getBoundingClientRect();
        startLeft = rect.left;
        startBottom = window.innerHeight - rect.bottom;
        toggleEl.style.transition = 'none';
        if (e.touches) e.preventDefault();
      }

      function onMove(e) {
        if (!dragging) return;
        var pt = e.touches ? e.touches[0] : e;
        var dx = pt.clientX - startX;
        var dy = pt.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        var newLeft = startLeft + dx;
        var newBottom = startBottom - dy;
        newLeft = Math.max(0, Math.min(window.innerWidth - SIZE, newLeft));
        newBottom = Math.max(0, Math.min(window.innerHeight - SIZE, newBottom));
        toggleEl.style.left = newLeft + 'px';
        toggleEl.style.bottom = newBottom + 'px';
        toggleEl.style.right = 'auto';
        // 面板跟随
        if (isOpen) updatePanelPosition();
        if (e.touches) e.preventDefault();
      }

      function onEnd() {
        dragging = false;
        toggleEl.style.transition = 'box-shadow 0.15s ease';
        setTimeout(function () { moved = false; }, 100);
      }

      toggleEl.addEventListener('mousedown', onStart);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      toggleEl.addEventListener('touchstart', onStart, { passive: false });
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    })();

    panelEl.querySelector('.panel-close').addEventListener('click', function () {
      isOpen = false;
      panelEl.classList.remove('open');
      setTimeout(function () { panelEl.style.display = 'none'; }, 300);
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !panelEl.contains(e.target) && e.target !== toggleEl && !toggleEl.contains(e.target)) {
        isOpen = false;
        panelEl.classList.remove('open');
        setTimeout(function () { panelEl.style.display = 'none'; }, 300);
      }
    });
  })();

})();

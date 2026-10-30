/*
 * 光筆工具列（全站共用，只加在最外層，不碰教材本體）
 * 用法：課程頁 </body> 前加一行
 *   <script src="assets/pen_tool_1031_v1.js?v=20261031-p1" defer></script>
 *
 * 左上角「房子、回單元總覽」右邊多一顆筆形小圓鈕，點它才展開 7 個圖示工具：
 *   光點、螢光筆、原子筆、直線、虛線、圓、橡皮擦  ＋  4 個顏色點
 * 規則（老師 2026-10-31 定）：
 *   - 光點：按著一直亮、可寫字；放開後約 1 秒淡掉
 *   - 其他筆跡留到收回；收回（再點筆形鈕，或再點一次目前的工具）＝擦掉全部
 *   - 選了工具後畫面只畫不操作頁面；收回後頁面恢復原本操作
 *   - 手指、Apple Pencil、滑鼠、觸控電視都能用（Pointer Events）
 *   - 捲動頁面時自動清掉筆跡（避免舊筆跡蓋在新內容上）
 * 介面全用圖示，不放文字。
 */
(function () {
  'use strict';
  if (window.__physicalBoysPen) return;
  window.__physicalBoysPen = true;

  var Z_LAYER = 19000;
  var COLORS = ['#ffe066', '#ff6b6b', '#5eead4', '#f6f3ea']; // 黃、紅、青、白（配合黑板底色）
  var WIDTH = { pen: 4, highlighter: 24, line: 4, dash: 4, circle: 4, eraser: 44, laser: 6 };
  var LASER_HOLD_MS = 700;   // 放開後完整顯示的時間
  var LASER_FADE_MS = 300;   // 之後淡出的時間（合計約 1 秒）

  var SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var SVG_CLOSE = '</svg>';

  var TOOLS = [
    { id: 'laser', label: '光點',
      icon: '<circle cx="12" cy="12" r="3.4" fill="#ff3b3b" stroke="none"/><circle cx="12" cy="12" r="7.2" stroke="#ff3b3b" opacity=".6"/><path d="M12 2.2v2.2M12 19.6v2.2M2.2 12h2.2M19.6 12h2.2" stroke="#ff3b3b" opacity=".8"/>' },
    { id: 'highlighter', label: '螢光筆',
      icon: '<path d="M14.6 3.8l5.6 5.6-8.4 8.4H6.2v-5.6z"/><path d="M12.4 6l5.6 5.6"/><path d="M3.5 21h8.5" stroke-width="3.2" opacity=".55"/>' },
    { id: 'pen', label: '原子筆',
      icon: '<path d="M15.6 4.4l4 4L9.4 18.6 4.2 19.8l1.2-5.2z"/><path d="M13 7l4 4"/>' },
    { id: 'line', label: '直線',
      icon: '<path d="M5 19L19 5"/>' },
    { id: 'dash', label: '虛線',
      icon: '<path d="M5 19L19 5" stroke-dasharray="2.4 3.6"/>' },
    { id: 'circle', label: '圓',
      icon: '<circle cx="12" cy="12" r="7.6"/>' },
    { id: 'eraser', label: '橡皮擦',
      icon: '<path d="M8.6 19.6L4.3 15.3a1.9 1.9 0 0 1 0-2.7l8.3-8.3a1.9 1.9 0 0 1 2.7 0l4.4 4.4a1.9 1.9 0 0 1 0 2.7l-7.2 7.2z"/><path d="M9.4 7.6l7 7"/><path d="M8.6 19.6H20"/>' }
  ];
  var FAB_ICON = '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>';

  var CSS = [
    '#pt-layer{position:fixed;top:0;left:0;width:100%;height:100%;z-index:' + Z_LAYER + ';pointer-events:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    '#pt-layer canvas{position:absolute;top:0;left:0;pointer-events:none;-webkit-tap-highlight-color:transparent}',
    '#pt-live.on{pointer-events:auto;touch-action:none;cursor:crosshair}',
    '#pt-fab,#pt-bar button{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}',
    '#pt-fab{position:fixed;top:16px;left:140px;z-index:' + (Z_LAYER + 1) + ';width:48px;height:48px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0;margin:0;border-radius:50%;cursor:pointer;',
    'background:rgba(17,38,31,.92);border:2px solid #ffe066;color:#f6f3ea;box-shadow:0 8px 24px rgba(0,0,0,.6),0 0 14px rgba(255,224,102,.25);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);',
    'transition:transform .15s ease,box-shadow .15s ease,background .15s ease,color .15s ease}',
    '#pt-fab svg{width:24px;height:24px;display:block;pointer-events:none}',
    '#pt-fab:hover,#pt-fab:focus-visible{background:#ffe066;color:#11261f;box-shadow:0 8px 24px rgba(0,0,0,.6),0 0 20px rgba(255,224,102,.55);transform:translateY(-2px)}',
    '#pt-fab.on{background:#ffe066;color:#11261f}',
    '#pt-bar{position:fixed;top:16px;left:198px;z-index:' + (Z_LAYER + 1) + ';height:48px;box-sizing:border-box;display:none;align-items:center;gap:2px;padding:0 10px 0 6px;border-radius:26px;',
    'background:rgba(17,38,31,.94);border:2px solid rgba(255,224,102,.55);box-shadow:0 8px 24px rgba(0,0,0,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#pt-bar.open{display:flex;animation:pt-in .16s ease-out}',
    '@keyframes pt-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}',
    '#pt-bar .pt-tool{width:40px;height:40px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0;margin:0;border:0;border-radius:50%;background:transparent;color:#f6f3ea;cursor:pointer;transition:background .12s ease,color .12s ease}',
    '#pt-bar .pt-tool svg{width:24px;height:24px;display:block;pointer-events:none}',
    '#pt-bar .pt-tool:hover{background:rgba(255,224,102,.22)}',
    '#pt-bar .pt-tool.on{background:#ffe066;color:#11261f}',
    '#pt-bar .pt-sep{width:2px;height:24px;margin:0 6px;border-radius:2px;background:rgba(246,243,234,.28)}',
    '#pt-bar .pt-colors{display:flex;align-items:center;gap:4px;transition:opacity .15s ease}',
    '#pt-bar .pt-colors.dim{opacity:.3}',
    '#pt-bar .pt-color{width:32px;height:32px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0;margin:0;border:0;border-radius:50%;background:transparent;cursor:pointer}',
    '#pt-bar .pt-color i{display:block;width:20px;height:20px;box-sizing:border-box;border-radius:50%;border:2px solid rgba(0,0,0,.35);pointer-events:none}',
    '#pt-bar .pt-color.on{box-shadow:0 0 0 2px #f6f3ea}',
    '@media (max-width:820px){#pt-bar{top:72px;left:12px}}',
    '@media (max-width:520px){#pt-fab{top:8px;left:112px;width:44px;height:44px}#pt-fab svg{width:22px;height:22px}',
    '#pt-bar{top:60px;left:8px;width:calc(100vw - 16px);height:auto;flex-wrap:wrap;justify-content:center;row-gap:2px;padding:4px 6px;border-radius:24px}',
    '#pt-bar .pt-sep{display:none}#pt-bar .pt-colors{width:100%;justify-content:center}}',
    '@media print{#pt-layer,#pt-fab,#pt-bar{display:none!important}}'
  ].join('\n');

  function el(tag, id, cls) {
    var e = document.createElement(tag);
    if (id) e.id = id;
    if (cls) e.className = cls;
    return e;
  }

  function init() {
    if (!document.body || document.getElementById('pt-fab')) return;

    var style = document.createElement('style');
    style.id = 'pt-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));

    var layer = el('div', 'pt-layer');
    var cDraw = el('canvas', 'pt-draw');   // 已完成的筆跡（橡皮擦直接擦這層）
    var cLive = el('canvas', 'pt-live');   // 正在畫的這一筆＋橡皮擦圈圈；接收所有觸控
    var cLaser = el('canvas', 'pt-laser'); // 光點（獨立淡出）
    layer.appendChild(cDraw);
    layer.appendChild(cLive);
    layer.appendChild(cLaser);
    document.body.appendChild(layer);
    var xDraw = cDraw.getContext('2d');
    var xLive = cLive.getContext('2d');
    var xLaser = cLaser.getContext('2d');

    // ---------- 工具列 ----------
    var fab = el('button', 'pt-fab');
    fab.type = 'button';
    fab.setAttribute('aria-label', '畫筆工具');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = SVG_OPEN + FAB_ICON + SVG_CLOSE;

    var bar = el('div', 'pt-bar');
    bar.setAttribute('role', 'toolbar');
    var toolBtns = {};
    TOOLS.forEach(function (t) {
      var b = el('button', null, 'pt-tool');
      b.type = 'button';
      b.setAttribute('aria-label', t.label);
      b.setAttribute('data-tool', t.id);
      b.innerHTML = SVG_OPEN + t.icon + SVG_CLOSE;
      b.addEventListener('click', function () {
        if (tool === t.id) closeAll(); else { lastTool = t.id; setTool(t.id); }
      });
      bar.appendChild(b);
      toolBtns[t.id] = b;
    });
    bar.appendChild(el('span', null, 'pt-sep'));
    var colorWrap = el('div', null, 'pt-colors');
    var colorBtns = [];
    COLORS.forEach(function (c, i) {
      var b = el('button', null, 'pt-color');
      b.type = 'button';
      b.setAttribute('aria-label', '顏色 ' + (i + 1));
      b.innerHTML = '<i style="background:' + c + '"></i>';
      b.addEventListener('click', function () { setColor(i); });
      colorWrap.appendChild(b);
      colorBtns.push(b);
    });
    bar.appendChild(colorWrap);
    document.body.appendChild(fab);
    document.body.appendChild(bar);

    // ---------- 狀態 ----------
    var tool = null;
    var lastTool = 'laser';
    var colorIdx = 0;
    var open = false;
    var active = null;       // 目前正在畫的指標 {id,type}
    var penDown = false;
    var cur = null;          // 目前這一筆
    var laserStrokes = [];
    var raf = 0;
    var lastEraser = null;

    function setColor(i) {
      colorIdx = i;
      colorBtns.forEach(function (b, k) { b.classList.toggle('on', k === i); });
    }
    setColor(0);

    function setTool(id) {
      abortStroke();
      tool = id;
      Object.keys(toolBtns).forEach(function (k) { toolBtns[k].classList.toggle('on', k === id); });
      cLive.classList.toggle('on', !!id);
      colorWrap.classList.toggle('dim', id === 'laser' || id === 'eraser');
      clearLive();
    }

    function clearLive() { xLive.clearRect(0, 0, cLive.width, cLive.height); }
    function clearAll() {
      xDraw.clearRect(0, 0, window.innerWidth, window.innerHeight);
      clearLive();
      xLaser.clearRect(0, 0, window.innerWidth, window.innerHeight);
      laserStrokes = [];
    }

    function toggleOpen() {
      if (open) { closeAll(); return; }
      open = true;
      bar.classList.add('open');
      fab.classList.add('on');
      fab.setAttribute('aria-expanded', 'true');
      setTool(lastTool);
    }

    // 收回＝擦掉全部、恢復頁面操作
    function closeAll() {
      abortStroke();
      open = false;
      tool = null;
      Object.keys(toolBtns).forEach(function (k) { toolBtns[k].classList.remove('on'); });
      cLive.classList.remove('on');
      bar.classList.remove('open');
      fab.classList.remove('on');
      fab.setAttribute('aria-expanded', 'false');
      clearAll();
    }
    fab.addEventListener('click', toggleOpen);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) closeAll(); });

    // ---------- 畫布尺寸 ----------
    function sizeCanvas(c, w, h) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    var curW = 0, curH = 0;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      if (w === curW && h === curH) return;
      var keep = null;
      if (curW && cDraw.width) {      // 保留已畫好的筆跡（手機網址列伸縮也會觸發 resize）
        keep = document.createElement('canvas');
        keep.width = cDraw.width; keep.height = cDraw.height;
        keep.getContext('2d').drawImage(cDraw, 0, 0);
      }
      curW = w; curH = h;
      sizeCanvas(cDraw, w, h);
      sizeCanvas(cLive, w, h);
      sizeCanvas(cLaser, w, h);
      if (keep) {
        xDraw.save(); xDraw.setTransform(1, 0, 0, 1, 0, 0);
        xDraw.drawImage(keep, 0, 0);
        xDraw.restore();
      }
    }
    resize();
    window.addEventListener('resize', resize);

    // 頁面捲動時清掉筆跡（舊筆跡不該蓋在新內容上）
    var lastY = window.pageYOffset || 0;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset || 0;
      if (open && Math.abs(y - lastY) > 6) clearAll();
      lastY = y;
    }, true);

    // ---------- 繪製 ----------
    function pathSmooth(ctx, pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 1) { ctx.lineTo(pts[0].x + 0.01, pts[0].y); return; }
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }

    function renderStroke(ctx, s) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.w;
      if (s.tool === 'highlighter') ctx.globalAlpha = 0.4;
      if (s.tool === 'pen' || s.tool === 'highlighter') {
        pathSmooth(ctx, s.pts);
      } else if (s.tool === 'line' || s.tool === 'dash') {
        if (s.tool === 'dash') { ctx.lineCap = 'butt'; ctx.setLineDash([s.w * 2.6, s.w * 2.4]); }
        ctx.beginPath(); ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x1, s.y1);
      } else if (s.tool === 'circle') {
        var r = Math.sqrt(Math.pow(s.x1 - s.x0, 2) + Math.pow(s.y1 - s.y0, 2));
        ctx.beginPath(); ctx.arc(s.x0, s.y0, Math.max(r, 0.5), 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawRing(p) {
      clearLive();
      xLive.save();
      xLive.lineWidth = 2;
      xLive.strokeStyle = 'rgba(246,243,234,.9)';
      xLive.fillStyle = 'rgba(17,38,31,.25)';
      xLive.beginPath(); xLive.arc(p.x, p.y, WIDTH.eraser / 2, 0, Math.PI * 2);
      xLive.fill(); xLive.stroke();
      xLive.restore();
    }

    function eraseSeg(a, b) {
      xDraw.save();
      xDraw.globalCompositeOperation = 'destination-out';
      xDraw.lineCap = 'round'; xDraw.lineJoin = 'round';
      xDraw.lineWidth = WIDTH.eraser;
      xDraw.beginPath(); xDraw.moveTo(a.x, a.y); xDraw.lineTo(b.x + 0.01, b.y);
      xDraw.stroke();
      xDraw.restore();
    }

    // 光點：按著一直亮，放開後 700ms 完整、再 300ms 淡出
    function laserFrame() {
      var now = performance.now();
      xLaser.clearRect(0, 0, curW, curH);
      var alive = [];
      for (var i = 0; i < laserStrokes.length; i++) {
        var s = laserStrokes[i], a = 1;
        if (!s.down) {
          var t = now - s.upAt;
          if (t >= LASER_HOLD_MS + LASER_FADE_MS) continue;
          if (t > LASER_HOLD_MS) a = 1 - (t - LASER_HOLD_MS) / LASER_FADE_MS;
        }
        alive.push(s);
        drawLaser(s, a);
      }
      laserStrokes = alive;
      raf = alive.length ? requestAnimationFrame(laserFrame) : 0;
    }
    function drawLaser(s, a) {
      var ctx = xLaser;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255,40,40,.95)';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#ff3030';
      ctx.lineWidth = WIDTH.laser;
      pathSmooth(ctx, s.pts);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffd6d6';
      ctx.lineWidth = 2.2;
      pathSmooth(ctx, s.pts);
      ctx.stroke();
      var last = s.pts[s.pts.length - 1];
      ctx.shadowColor = 'rgba(255,40,40,.95)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff3030';
      ctx.beginPath(); ctx.arc(last.x, last.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(last.x, last.y, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function startLaserLoop() { if (!raf) raf = requestAnimationFrame(laserFrame); }

    // ---------- 一筆的開始／移動／結束 ----------
    function startStroke(p) {
      if (tool === 'laser') {
        cur = { down: true, upAt: 0, pts: [p] };
        laserStrokes.push(cur);
        startLaserLoop();
      } else if (tool === 'eraser') {
        lastEraser = p;
        eraseSeg(p, p);
        drawRing(p);
      } else if (tool === 'pen' || tool === 'highlighter') {
        cur = { tool: tool, color: COLORS[colorIdx], w: WIDTH[tool], pts: [p] };
        clearLive(); renderStroke(xLive, cur);
      } else {
        cur = { tool: tool, color: COLORS[colorIdx], w: WIDTH[tool], x0: p.x, y0: p.y, x1: p.x, y1: p.y };
      }
    }
    function moveStroke(p) {
      if (tool === 'laser') {
        if (cur) cur.pts.push(p);
      } else if (tool === 'eraser') {
        eraseSeg(lastEraser, p); lastEraser = p; drawRing(p);
      } else if (cur && (tool === 'pen' || tool === 'highlighter')) {
        cur.pts.push(p);
        clearLive(); renderStroke(xLive, cur);
      } else if (cur) {
        cur.x1 = p.x; cur.y1 = p.y;
        clearLive(); renderStroke(xLive, cur);
      }
    }
    function endStroke() {
      if (tool === 'laser') {
        if (cur) { cur.down = false; cur.upAt = performance.now(); startLaserLoop(); }
      } else if (tool === 'eraser') {
        clearLive();
      } else if (cur) {
        var tiny = (cur.tool === 'line' || cur.tool === 'dash' || cur.tool === 'circle') &&
          Math.abs(cur.x1 - cur.x0) + Math.abs(cur.y1 - cur.y0) < 3;
        if (!tiny) renderStroke(xDraw, cur);
        clearLive();
      }
      cur = null;
    }
    function abortStroke() {
      if (!active && !cur) return;
      if (tool === 'laser') { if (cur) { cur.down = false; cur.upAt = performance.now(); } }
      cur = null; active = null;
      clearLive();
    }

    // ---------- 指標事件（手指／Apple Pencil／滑鼠／觸控電視） ----------
    function pt(e) { return { x: e.clientX, y: e.clientY }; }

    cLive.addEventListener('pointerdown', function (e) {
      if (!tool) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'pen') {
        penDown = true;
        if (active && active.type === 'touch') abortStroke();   // 手掌誤觸先開始，Pencil 來了就讓給 Pencil
      } else if (e.pointerType === 'touch' && penDown) {
        return;                                                  // Pencil 正在畫，忽略手掌
      }
      if (active) return;
      e.preventDefault();
      try { cLive.setPointerCapture(e.pointerId); } catch (_) {}
      active = { id: e.pointerId, type: e.pointerType };
      startStroke(pt(e));
    });
    cLive.addEventListener('pointermove', function (e) {
      if (tool === 'eraser' && !active && e.pointerType !== 'touch') { drawRing(pt(e)); return; }
      if (!active || e.pointerId !== active.id) return;
      e.preventDefault();
      var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (list.length) { for (var i = 0; i < list.length; i++) moveStroke(pt(list[i])); }
      else moveStroke(pt(e));
    });
    function up(e) {
      if (e.pointerType === 'pen') penDown = false;
      if (!active || e.pointerId !== active.id) return;
      active = null;
      endStroke();
    }
    cLive.addEventListener('pointerup', up);
    cLive.addEventListener('pointercancel', up);
    cLive.addEventListener('pointerleave', function (e) {
      if (tool === 'eraser' && !active) clearLive();
    });
    // iOS 保險：畫畫時不要讓頁面捲動／橡皮筋回彈
    cLive.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    cLive.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

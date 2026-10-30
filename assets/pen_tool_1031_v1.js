/*
 * 光筆工具列（全站共用，只加在最外層，不碰教材本體）
 * 用法：課程頁 </body> 前加一行
 *   <script src="assets/pen_tool_1031_v1.js?v=20261031-p2" defer></script>
 *
 * 左上角「房子、回單元總覽」右邊多一顆筆形小圓鈕，點它才展開 8 個圖示工具：
 *   光點、螢光筆、原子筆、直線、虛線、圓、橡皮擦、選取  ＋  4 個顏色點（白、紅、黃、藍）
 * 規則（老師 2026-10-31 定）：
 *   - 光點：按著一直亮、可寫字；放開後約 1 秒淡掉
 *   - 其他筆跡一筆一筆獨立保存，留到收回；收回（再點筆形鈕，或再點一次目前的工具）＝擦掉全部
 *   - 選取（像 GoodNotes 套索）：圈起來或點一下筆跡 → 拖著移動；點空白處取消選取
 *   - 橡皮擦：預設「只擦一點點」（所有筆跡都只拿掉碰到的那一小段，含直線、虛線、圓）；
 *     長按橡皮擦圖示跳出圖示選單，可改成「擦整條」（碰到就整筆擦掉）；整條模式時橡皮擦鈕右下角有紅點
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
  var COLORS = ['#f6f3ea', '#ff6b6b', '#ffe066', '#4aa8ff']; // 白、紅、黃、藍（黑板專用四色）
  var WIDTH = { pen: 4, highlighter: 24, line: 4, dash: 4, circle: 4, eraser: 44, laser: 6 };
  var ERASER_R = WIDTH.eraser / 2;
  var LASER_HOLD_MS = 700;   // 放開後完整顯示的時間
  var LASER_FADE_MS = 300;   // 之後淡出的時間（合計約 1 秒）
  var SEL_COLOR = '#8cc8ff'; // 選取框顏色

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
      icon: '<path d="M8.6 19.6L4.3 15.3a1.9 1.9 0 0 1 0-2.7l8.3-8.3a1.9 1.9 0 0 1 2.7 0l4.4 4.4a1.9 1.9 0 0 1 0 2.7l-7.2 7.2z"/><path d="M9.4 7.6l7 7"/><path d="M8.6 19.6H20"/>' },
    { id: 'select', label: '選取',
      icon: '<path d="M7.2 16.2C4.6 15 3.2 13 3.2 10.6 3.2 7.2 7 4.4 12 4.4s8.8 2.8 8.8 6.2-3.8 6.2-8.8 6.2c-1 0-1.9-.1-2.8-.3" stroke-dasharray="2.6 3.2"/><path d="M7.2 16.2c-1.6.7-2.2 2.2-1.6 3.6"/><circle cx="5.7" cy="20" r="1.1" fill="currentColor" stroke="none"/>' }
  ];
  // 橡皮擦長按選單的兩個圖示
  var ERASER_MODES = [
    { id: 'part', label: '只擦一點點',
      icon: '<path d="M3.5 12h4.2"/><path d="M16.3 12h4.2"/><circle cx="12" cy="12" r="3.6" stroke-dasharray="2 2.2"/>' },
    { id: 'whole', label: '擦整條',
      icon: '<path d="M3 12.5c2-5.5 4-5.5 6-2.5s4 3 6-1.5"/><path d="M15.2 14.6l5.4 5.4M20.6 14.6l-5.4 5.4"/>' }
  ];
  var LONG_PRESS_MS = 450;
  var FAB_ICON ='<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>';

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
    '#pt-bar .pt-tool{position:relative}',
    '#pt-bar .pt-tool[data-mode="whole"]::after{content:"";position:absolute;right:4px;bottom:4px;width:9px;height:9px;box-sizing:border-box;border-radius:50%;background:#ff6b6b;border:2px solid rgba(17,38,31,.95)}',
    '#pt-menu{position:fixed;z-index:' + (Z_LAYER + 2) + ';display:none;align-items:center;gap:4px;padding:5px;border-radius:26px;background:rgba(17,38,31,.97);border:2px solid rgba(255,224,102,.7);box-shadow:0 10px 28px rgba(0,0,0,.65);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    '#pt-menu.open{display:flex;animation:pt-pop .14s ease-out}',
    '@keyframes pt-pop{from{opacity:0;transform:translateY(-6px) scale(.96)}to{opacity:1;transform:none}}',
    '#pt-menu button{width:44px;height:44px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0;margin:0;border:0;border-radius:50%;background:transparent;color:#f6f3ea;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
    '#pt-menu button svg{width:26px;height:26px;display:block;pointer-events:none}',
    '#pt-menu button:hover{background:rgba(255,224,102,.22)}',
    '#pt-menu button.on{background:#ffe066;color:#11261f}',
    '#pt-bar .pt-tool:hover{background:rgba(255,224,102,.22)}',
    '#pt-bar .pt-tool.on{background:#ffe066;color:#11261f}',
    '#pt-bar .pt-sep{width:2px;height:24px;margin:0 6px;border-radius:2px;background:rgba(246,243,234,.28)}',
    '#pt-bar .pt-colors{display:flex;align-items:center;gap:4px;transition:opacity .15s ease}',
    '#pt-bar .pt-colors.dim{opacity:.3}',
    '#pt-bar .pt-color{width:32px;height:32px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0;margin:0;border:0;border-radius:50%;background:transparent;cursor:pointer}',
    '#pt-bar .pt-color i{display:block;width:20px;height:20px;box-sizing:border-box;border-radius:50%;border:2px solid rgba(0,0,0,.35);pointer-events:none}',
    '#pt-bar .pt-color.on{box-shadow:0 0 0 2px #f6f3ea}',
    '@media (max-width:900px){#pt-bar{top:72px;left:12px}}',
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

  // ---------- 幾何小工具 ----------
  function distPtSeg(px, py, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
    var t = l2 ? ((px - x0) * dx + (py - y0) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
  }
  function isFree(s) { return !!s.pts; }   // 由一串點組成的筆跡（原子筆、螢光筆，以及被擦過的直線／虛線／圓）

  // 把畫到一半的原始點，轉成「平滑又密」的折線（間距約 3px），之後擦除、選取都靠這些點
  function densify(pts) {
    var n = pts.length;
    if (n < 2) return pts.slice();
    var out = [{ x: pts[0].x, y: pts[0].y }];
    var cx = pts[0].x, cy = pts[0].y;
    function quad(x1, y1, qx, qy) {
      var len = Math.hypot(qx - cx, qy - cy) + Math.hypot(x1 - qx, y1 - qy);
      var k = Math.max(2, Math.ceil(len / 3));
      for (var i = 1; i <= k; i++) {
        var t = i / k, u = 1 - t;
        out.push({ x: u * u * cx + 2 * u * t * qx + t * t * x1, y: u * u * cy + 2 * u * t * qy + t * t * y1 });
      }
    }
    for (var i = 1; i < n - 1; i++) {
      var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      quad(mx, my, pts[i].x, pts[i].y);
      cx = mx; cy = my;
    }
    var last = pts[n - 1], len = Math.hypot(last.x - cx, last.y - cy), k = Math.max(1, Math.ceil(len / 3));
    for (var j = 1; j <= k; j++) out.push({ x: cx + (last.x - cx) * j / k, y: cy + (last.y - cy) * j / k });
    return out;
  }

  function itemDist(s, px, py) {            // 點到這一筆中心線的距離
    if (s.tool === 'circle') return Math.abs(Math.hypot(px - s.x0, py - s.y0) - Math.hypot(s.x1 - s.x0, s.y1 - s.y0));
    if (s.tool === 'line' || s.tool === 'dash') return distPtSeg(px, py, s.x0, s.y0, s.x1, s.y1);
    var d = 1e9;
    for (var i = 0; i < s.pts.length; i++) {
      var q = Math.hypot(px - s.pts[i].x, py - s.pts[i].y);
      if (q < d) d = q;
    }
    return d;
  }
  function itemBounds(s) {
    var x0, y0, x1, y1, h = s.w / 2;
    if (s.tool === 'circle') {
      var r = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
      x0 = s.x0 - r; x1 = s.x0 + r; y0 = s.y0 - r; y1 = s.y0 + r;
    } else if (s.tool === 'line' || s.tool === 'dash') {
      x0 = Math.min(s.x0, s.x1); x1 = Math.max(s.x0, s.x1); y0 = Math.min(s.y0, s.y1); y1 = Math.max(s.y0, s.y1);
    } else {
      x0 = y0 = 1e9; x1 = y1 = -1e9;
      for (var i = 0; i < s.pts.length; i++) {
        var p = s.pts[i];
        if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
        if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
      }
    }
    return { x0: x0 - h, y0: y0 - h, x1: x1 + h, y1: y1 + h };
  }
  function itemSamples(s) {                 // 套索判斷用的取樣點
    var out = [], i;
    if (s.tool === 'circle') {
      var r = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
      for (i = 0; i < 24; i++) out.push({ x: s.x0 + r * Math.cos(i / 24 * 6.2832), y: s.y0 + r * Math.sin(i / 24 * 6.2832) });
    } else if (s.tool === 'line' || s.tool === 'dash') {
      for (i = 0; i <= 12; i++) out.push({ x: s.x0 + (s.x1 - s.x0) * i / 12, y: s.y0 + (s.y1 - s.y0) * i / 12 });
    } else {
      var step = Math.max(1, Math.ceil(s.pts.length / 60));
      for (i = 0; i < s.pts.length; i += step) out.push(s.pts[i]);
    }
    return out;
  }
  function inPoly(x, y, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if (((a.y > y) !== (b.y > y)) && (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)) c = !c;
    }
    return c;
  }
  function translateItem(s, dx, dy) {
    if (s.pts) { for (var i = 0; i < s.pts.length; i++) { s.pts[i].x += dx; s.pts[i].y += dy; } }
    else { s.x0 += dx; s.x1 += dx; s.y0 += dy; s.y1 += dy; }
  }

  function init() {
    if (!document.body || document.getElementById('pt-fab')) return;

    var style = document.createElement('style');
    style.id = 'pt-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));

    var layer = el('div', 'pt-layer');
    var cDraw = el('canvas', 'pt-draw');   // 沒被選取的筆跡
    var cSel = el('canvas', 'pt-sel');     // 被選取的筆跡＋選取框
    var cLive = el('canvas', 'pt-live');   // 正在畫的這一筆、套索、橡皮擦圈圈；接收所有觸控
    var cLaser = el('canvas', 'pt-laser'); // 光點（獨立淡出）
    layer.appendChild(cDraw);
    layer.appendChild(cSel);
    layer.appendChild(cLive);
    layer.appendChild(cLaser);
    document.body.appendChild(layer);
    var xDraw = cDraw.getContext('2d');
    var xSel = cSel.getContext('2d');
    var xLive = cLive.getContext('2d');
    var xLaser = cLaser.getContext('2d');

    // ---------- 狀態 ----------
    var tool = null;
    var lastTool = 'laser';
    var open = false;
    var colorIdx = { ink: 0, hl: 2 };   // 螢光筆自己記一個顏色（預設黃），其他筆共用（預設白）
    var items = [];                     // 所有已完成的筆跡（一筆一個物件）
    var nextId = 1;
    var sel = [];                       // 被選取的筆跡
    var selDX = 0, selDY = 0;           // 移動中的位移
    var active = null;                  // 目前正在畫的指標 {id,type}
    var penDown = false;
    var cur = null;                     // 目前這一筆
    var laserStrokes = [];
    var raf = 0;
    var lastEraser = null;
    var eraserMode = 'part';            // 橡皮擦模式：part＝只擦一點點（預設）、whole＝擦整條
    var curW = 0, curH = 0;

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
      var longFired = false, lpTimer = 0;
      if (t.id === 'eraser') {               // 橡皮擦：長按跳出模式選單
        b.setAttribute('data-mode', 'part');
        b.addEventListener('pointerdown', function () {
          longFired = false;
          clearTimeout(lpTimer);
          lpTimer = setTimeout(function () {
            longFired = true;
            if (tool !== 'eraser') { lastTool = 'eraser'; setTool('eraser'); }
            showMenu();
          }, LONG_PRESS_MS);
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
          b.addEventListener(ev, function () { clearTimeout(lpTimer); });
        });
        b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      }
      b.addEventListener('click', function () {
        if (longFired) { longFired = false; return; }    // 長按觸發過選單，放開時不要當成點擊
        if (tool === t.id) closeAll(); else { lastTool = t.id; setTool(t.id); }
      });
      bar.appendChild(b);
      toolBtns[t.id] = b;
    });

    // 橡皮擦模式選單（長按橡皮擦才出現；只有圖示）
    var menu = el('div', 'pt-menu');
    menu.setAttribute('role', 'menu');
    var modeBtns = {};
    ERASER_MODES.forEach(function (m) {
      var b = el('button');
      b.type = 'button';
      b.setAttribute('aria-label', m.label);
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + m.icon + SVG_CLOSE;
      b.addEventListener('click', function () { setEraserMode(m.id); hideMenu(); });
      menu.appendChild(b);
      modeBtns[m.id] = b;
    });
    document.body.appendChild(menu);
    function setEraserMode(id) {
      eraserMode = id;
      toolBtns.eraser.setAttribute('data-mode', id);
      Object.keys(modeBtns).forEach(function (k) { modeBtns[k].classList.toggle('on', k === id); });
    }
    function showMenu() {
      setEraserMode(eraserMode);
      menu.classList.add('open');
      var r = toolBtns.eraser.getBoundingClientRect(), mw = menu.offsetWidth;
      var left = Math.max(8, Math.min(window.innerWidth - mw - 8, r.left + r.width / 2 - mw / 2));
      menu.style.left = left + 'px';
      menu.style.top = (r.bottom + 10) + 'px';
    }
    function hideMenu() { menu.classList.remove('open'); }
    // 選單開著時，點旁邊任何地方只是把選單收起來，不會畫到東西
    document.addEventListener('pointerdown', function (e) {
      if (!menu.classList.contains('open') || menu.contains(e.target) || toolBtns.eraser.contains(e.target)) return;
      hideMenu();
      if (e.target === cLive) { e.preventDefault(); e.stopPropagation(); }
    }, true);
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

    function group() { return tool === 'highlighter' ? 'hl' : 'ink'; }
    function curColor() { return COLORS[colorIdx[group()]]; }
    function refreshColorUI() {
      var i = colorIdx[group()];
      colorBtns.forEach(function (b, k) { b.classList.toggle('on', k === i); });
    }
    function setColor(i) { colorIdx[group()] = i; refreshColorUI(); }
    refreshColorUI();

    function setTool(id) {
      abortStroke();
      clearSelection();
      hideMenu();
      tool = id;
      Object.keys(toolBtns).forEach(function (k) { toolBtns[k].classList.toggle('on', k === id); });
      cLive.classList.toggle('on', !!id);
      colorWrap.classList.toggle('dim', id === 'laser' || id === 'eraser' || id === 'select');
      refreshColorUI();
      clearLive();
    }

    function clearLive() { xLive.clearRect(0, 0, curW, curH); }
    function clearAll() {
      items = []; sel = []; selDX = selDY = 0;
      xDraw.clearRect(0, 0, curW, curH);
      xSel.clearRect(0, 0, curW, curH);
      clearLive();
      xLaser.clearRect(0, 0, curW, curH);
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
      hideMenu();
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
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      if (w === curW && h === curH) return;
      curW = w; curH = h;
      [cDraw, cSel, cLive, cLaser].forEach(function (c) { sizeCanvas(c, w, h); });
      renderAll(); renderSel();            // 筆跡是一筆一筆存的，尺寸變了直接重畫
    }

    // 頁面捲動時清掉筆跡（舊筆跡不該蓋在新內容上）
    var lastY = window.pageYOffset || 0;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset || 0;
      if (open && Math.abs(y - lastY) > 6) clearAll();
      lastY = y;
    }, true);

    // ---------- 繪製 ----------
    function pathSmooth(ctx, pts) {          // 畫到一半的原始點（光點、正在畫的筆）用
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 1) { ctx.lineTo(pts[0].x + 0.01, pts[0].y); return; }
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    function pathPoly(ctx, pts) {            // 已完成的筆（點已經很密）用
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 1) { ctx.lineTo(pts[0].x + 0.01, pts[0].y); return; }
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    }

    function renderStroke(ctx, s) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.w;
      if (s.tool === 'highlighter') ctx.globalAlpha = 0.4;
      if (s.tool === 'dash' || s.dash) { ctx.lineCap = 'butt'; ctx.setLineDash([s.w * 2.6, s.w * 2.4]); }
      if (isFree(s)) {
        if (s.dense) pathPoly(ctx, s.pts); else pathSmooth(ctx, s.pts);
      } else if (s.tool === 'line' || s.tool === 'dash') {
        ctx.beginPath(); ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x1, s.y1);
      } else if (s.tool === 'circle') {
        var r = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
        ctx.beginPath(); ctx.arc(s.x0, s.y0, Math.max(r, 0.5), 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    function renderAll() {                   // 重畫「沒被選取」的所有筆跡
      xDraw.clearRect(0, 0, curW, curH);
      for (var i = 0; i < items.length; i++) if (sel.indexOf(items[i]) < 0) renderStroke(xDraw, items[i]);
    }

    function selBounds() {
      var b = null;
      sel.forEach(function (s) {
        var q = itemBounds(s);
        if (!b) b = q;
        else { b.x0 = Math.min(b.x0, q.x0); b.y0 = Math.min(b.y0, q.y0); b.x1 = Math.max(b.x1, q.x1); b.y1 = Math.max(b.y1, q.y1); }
      });
      return b;
    }
    function renderSel() {                   // 被選取的筆跡（含移動中的位移）＋虛線選取框
      xSel.clearRect(0, 0, curW, curH);
      if (!sel.length) return;
      xSel.save();
      xSel.translate(selDX, selDY);
      sel.forEach(function (s) { renderStroke(xSel, s); });
      var b = selBounds(), pad = 8;
      xSel.lineWidth = 2;
      xSel.setLineDash([8, 6]);
      xSel.strokeStyle = SEL_COLOR;
      xSel.fillStyle = 'rgba(140,200,255,.08)';
      var x = b.x0 - pad, y = b.y0 - pad, w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2, r = 10;
      xSel.beginPath();
      xSel.moveTo(x + r, y); xSel.lineTo(x + w - r, y); xSel.quadraticCurveTo(x + w, y, x + w, y + r);
      xSel.lineTo(x + w, y + h - r); xSel.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      xSel.lineTo(x + r, y + h); xSel.quadraticCurveTo(x, y + h, x, y + h - r);
      xSel.lineTo(x, y + r); xSel.quadraticCurveTo(x, y, x + r, y);
      xSel.closePath();
      xSel.fill(); xSel.stroke();
      xSel.restore();
    }
    function inSelBox(p) {
      if (!sel.length) return false;
      var b = selBounds(), pad = 16;
      return p.x >= b.x0 - pad + selDX && p.x <= b.x1 + pad + selDX && p.y >= b.y0 - pad + selDY && p.y <= b.y1 + pad + selDY;
    }
    function setSelection(list) {
      sel = list; selDX = selDY = 0;
      renderAll(); renderSel();
    }
    function clearSelection() {
      if (!sel.length) return;
      // 取消選取後，剛移動過的筆跡放回最上層，免得被別的筆跡蓋住
      items = items.filter(function (s) { return sel.indexOf(s) < 0; }).concat(sel);
      sel = []; selDX = selDY = 0;
      renderAll(); renderSel();
    }

    // ---------- 橡皮擦 ----------
    function drawRing(p) {
      clearLive();
      xLive.save();
      xLive.lineWidth = 2;
      xLive.strokeStyle = 'rgba(246,243,234,.9)';
      xLive.fillStyle = 'rgba(17,38,31,.25)';
      if (eraserMode === 'whole') xLive.setLineDash([6, 5]);   // 擦整條：圈圈是虛線
      xLive.beginPath(); xLive.arc(p.x, p.y, ERASER_R, 0, Math.PI * 2);
      xLive.fill(); xLive.stroke();
      xLive.restore();
    }
    function toPoly(s) {                     // 直線／虛線／圓 → 一串密點，才能只擦掉一小段
      var pts = [], i, n;
      if (s.tool === 'circle') {
        var r = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
        n = Math.max(24, Math.ceil(2 * Math.PI * r / 3));
        for (i = 0; i <= n; i++) { var a = i / n * Math.PI * 2; pts.push({ x: s.x0 + r * Math.cos(a), y: s.y0 + r * Math.sin(a) }); }
      } else {
        n = Math.max(1, Math.ceil(Math.hypot(s.x1 - s.x0, s.y1 - s.y0) / 3));
        for (i = 0; i <= n; i++) pts.push({ x: s.x0 + (s.x1 - s.x0) * i / n, y: s.y0 + (s.y1 - s.y0) * i / n });
      }
      return { id: s.id, tool: 'pen', color: s.color, w: s.w, pts: pts, dense: true, dash: s.tool === 'dash' };
    }
    function eraseAt(p) {
      if (eraserMode === 'whole') {            // 擦整條：碰到的那一筆（或被擦開後分出來的那一段）整個拿掉，其他段不動
        var kept = items.filter(function (s) { return itemDist(s, p.x, p.y) > ERASER_R + s.w / 2; });
        if (kept.length !== items.length) { items = kept; renderAll(); }
        return;
      }
      var out = [], changed = false;
      items.forEach(function (s) {
        if (itemDist(s, p.x, p.y) > ERASER_R + s.w / 2) { out.push(s); return; }   // 沒碰到
        var t = isFree(s) ? s : toPoly(s);                                        // 只擦一點點：只拿掉被碰到的那一段
        var rr = ERASER_R + s.w / 4, runs = [], run = [], hit = false;
        for (var i = 0; i < t.pts.length; i++) {
          var q = t.pts[i];
          if (Math.hypot(q.x - p.x, q.y - p.y) <= rr) { hit = true; if (run.length) { runs.push(run); run = []; } }
          else run.push(q);
        }
        if (!hit) { out.push(s); return; }
        changed = true;
        if (run.length) runs.push(run);
        runs.forEach(function (r) {
          if (r.length >= 2) out.push({ id: nextId++, tool: t.tool, color: t.color, w: t.w, pts: r, dense: true, dash: t.dash });
        });
      });
      if (changed) { items = out; renderAll(); }
    }
    function eraseSeg(a, b) {
      var len = Math.hypot(b.x - a.x, b.y - a.y), k = Math.max(1, Math.ceil(len / 6));
      for (var i = 1; i <= k; i++) eraseAt({ x: a.x + (b.x - a.x) * i / k, y: a.y + (b.y - a.y) * i / k });
    }

    // ---------- 光點：按著一直亮，放開後 700ms 完整、再 300ms 淡出 ----------
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

    // ---------- 選取（套索） ----------
    function drawLasso(pts) {
      clearLive();
      if (pts.length < 2) return;
      xLive.save();
      xLive.lineWidth = 2;
      xLive.setLineDash([7, 6]);
      xLive.strokeStyle = SEL_COLOR;
      xLive.fillStyle = 'rgba(140,200,255,.10)';
      xLive.beginPath();
      xLive.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) xLive.lineTo(pts[i].x, pts[i].y);
      xLive.closePath();
      xLive.fill(); xLive.stroke();
      xLive.restore();
    }
    function finishLasso(c) {
      var len = 0;
      for (var i = 1; i < c.pts.length; i++) len += Math.hypot(c.pts[i].x - c.pts[i - 1].x, c.pts[i].y - c.pts[i - 1].y);
      var picked = [];
      if (len < 12) {                        // 只是點一下：選最靠近的那一筆
        var p = c.pts[0], best = null, bd = 1e9;
        items.forEach(function (s) {
          var d = itemDist(s, p.x, p.y) - s.w / 2;
          if (d <= 12 && d <= bd) { bd = d; best = s; }
        });
        if (best) picked = [best];
      } else if (c.pts.length >= 3) {        // 圈起來：多數取樣點在圈內的筆跡被選取
        items.forEach(function (s) {
          var smp = itemSamples(s), n = 0;
          for (var j = 0; j < smp.length; j++) if (inPoly(smp[j].x, smp[j].y, c.pts)) n++;
          if (smp.length && n / smp.length >= 0.5) picked.push(s);
        });
      }
      setSelection(picked);
    }

    // ---------- 一筆的開始／移動／結束 ----------
    function startStroke(p) {
      if (tool === 'laser') {
        cur = { down: true, upAt: 0, pts: [p] };
        laserStrokes.push(cur);
        startLaserLoop();
      } else if (tool === 'eraser') {
        lastEraser = p;
        eraseAt(p);
        drawRing(p);
      } else if (tool === 'select') {
        if (inSelBox(p)) cur = { mode: 'move', sx: p.x, sy: p.y };      // 在選取框裡按下去＝移動
        else { clearSelection(); cur = { mode: 'lasso', pts: [p] }; }   // 框外＝取消選取並開始圈
      } else if (tool === 'pen' || tool === 'highlighter') {
        cur = { tool: tool, color: curColor(), w: WIDTH[tool], pts: [p] };
        clearLive(); renderStroke(xLive, cur);
      } else {
        cur = { tool: tool, color: curColor(), w: WIDTH[tool], x0: p.x, y0: p.y, x1: p.x, y1: p.y };
      }
    }
    function moveStroke(p) {
      if (tool === 'laser') {
        if (cur) cur.pts.push(p);
      } else if (tool === 'eraser') {
        eraseSeg(lastEraser, p); lastEraser = p; drawRing(p);
      } else if (tool === 'select') {
        if (!cur) return;
        if (cur.mode === 'move') { selDX = p.x - cur.sx; selDY = p.y - cur.sy; renderSel(); }
        else { cur.pts.push(p); drawLasso(cur.pts); }
      } else if (cur && isFree(cur)) {
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
      } else if (tool === 'select') {
        if (cur) {
          if (cur.mode === 'move') {
            sel.forEach(function (s) { translateItem(s, selDX, selDY); });
            selDX = selDY = 0;
            renderSel();
          } else {
            finishLasso(cur);
          }
        }
        clearLive();
      } else if (cur) {
        var tiny = !isFree(cur) && Math.abs(cur.x1 - cur.x0) + Math.abs(cur.y1 - cur.y0) < 3;
        if (!tiny) {
          var s = { id: nextId++, tool: cur.tool, color: cur.color, w: cur.w };
          if (isFree(cur)) { s.pts = densify(cur.pts); s.dense = true; }
          else { s.x0 = cur.x0; s.y0 = cur.y0; s.x1 = cur.x1; s.y1 = cur.y1; }
          items.push(s);
          renderStroke(xDraw, s);
        }
        clearLive();
      }
      cur = null;
    }
    function abortStroke() {
      if (!active && !cur) return;
      if (tool === 'laser') { if (cur) { cur.down = false; cur.upAt = performance.now(); } }
      if (tool === 'select' && cur && cur.mode === 'move') { selDX = selDY = 0; renderSel(); }
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
    cLive.addEventListener('pointerleave', function () {
      if (tool === 'eraser' && !active) clearLive();
    });
    // iOS 保險：畫畫時不要讓頁面捲動／橡皮筋回彈
    cLive.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    cLive.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    resize();
    window.addEventListener('resize', resize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

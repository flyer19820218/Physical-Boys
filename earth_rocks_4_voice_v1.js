/* earth_rocks_4 有聲講解（外層加法；以 biology_plant_transport／optics_1 的播放器為範本）
 * 只做三件事：載入 manifest.json / stage.json、依序播放 manifest 裡的每一句音檔、依每句內容照頁面老師講解的做法（按原本就有的按鈕）切換畫面。
 * 不碰 Canvas/SVG、動畫、題庫；不改任何既有 js。載入失敗時整個功能隱藏，原頁面完全不受影響。
 * 音檔與網頁同一個網域（audio/earth_rocks_4/mp3/）。
 */
(function () {
  'use strict';
  var MANIFEST_URL = 'audio/earth_rocks_4/manifest.json';
  var STAGE_URL = 'audio/earth_rocks_4/stage.json';
  // 音檔與網頁同一個網域（audio/earth_rocks_4/mp3/）：iPad Safari 對 GitHub Release 的下載網址（octet-stream＋attachment）常常無法播放。
  var AUDIO_BASE = 'audio/earth_rocks_4/mp3/';
  var AUDIO_VER = '?v=20261121-ke2'; // 重錄音檔時改這個版本號，避免瀏覽器播到舊的快取音檔
  var AUDIO_FALLBACK = AUDIO_BASE; // 本課沒有 GitHub Release 備援：載入失敗就直接改用字數估時，講解不中斷
  var player = null; // 全程只用同一個 Audio 元素：iOS 只在「使用者點擊」那一刻解鎖，新建的 Audio 之後自動播放會被擋
  var SEC_PER_CHAR = 0.3; // 音檔載入失敗時，依字數估一個等待秒數，讓講解不中斷

  var items = [], stage = { cuts: {}, at: {}, subs: {} }, total = 0;
  var idx = 0, state = 'idle', token = 0;
  var audio = null, timer = null, waitLeft = 0, waitStart = 0, waitDone = null, cache = {};
  var ui = {};

  var AV = { '彥君': 'assets/characters/yanjun/pointer_board.png', '曉臻': 'assets/characters/xiaozhen/normal.png' };
  var WHO = { '彥君': '彥君老師', '曉臻': '曉臻助教', '合聲': '兩人' };
  var COLOR = { '彥君': '#6db3ff', '曉臻': '#ff8fbf', '合聲': '#c9a8ff' };
  var PACE = 1.15; // 逐字變色的節奏（與試聽播放器相同）
  var raf = 0;

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.vx-open{min-height:52px;padding:8px 26px;border-radius:999px;cursor:pointer;font-size:21px;font-weight:700;font-family:inherit;line-height:1.3;background:transparent;color:#55e9ff;border:2px solid #55e9ff;touch-action:manipulation;transition:all .2s}',
      '.vx-open:hover,.vx-open.on{background:#55e9ff;color:#11261f}',
      '.vx-panel{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:9000;width:min(900px,100vw);box-sizing:border-box;padding:0 8px;pointer-events:none;display:none}',
      '.vx-panel.show{display:block}',
      '.vx-cap{position:relative;display:flex;align-items:flex-end;justify-content:space-between;gap:6px}',
      '.vx-av{flex:0 0 auto;height:130px;width:auto;transition:opacity .25s,filter .25s;opacity:.35;filter:grayscale(.6);pointer-events:none}',
      '.vx-av.on{opacity:1;filter:none}',
      '.vx-bub{pointer-events:auto;flex:1 1 auto;min-width:0;margin-bottom:14px;padding:10px 14px 20px;border-radius:14px;background:rgba(17,38,31,.94);border:2px solid #55e9ff;color:#f2ecd9;box-shadow:0 6px 18px rgba(0,0,0,.55);font-family:inherit;position:relative}',
      '.vx-who{display:inline-block;margin-bottom:4px;padding:0 10px;border-radius:999px;font-size:14px;font-weight:700;color:#11261f;background:#6db3ff}',
      '.vx-txt{font-size:21px;line-height:1.55;min-height:2.4em;padding-top:2px}',
      '.vx-txt span{color:rgba(242,236,217,.55);transition:color .12s}',
      '.vx-txt span.on{color:#fff}',
      '.vx-ctl{position:absolute;top:2px;right:4px;display:flex;gap:0}',
      '.vx-ic{width:32px;height:32px;display:flex;align-items:center;justify-content:center;padding:0;border-radius:50%;border:0;background:transparent;color:#9af06f;font-size:18px;line-height:1;cursor:pointer;touch-action:manipulation;font-family:inherit}',
      '.vx-ic:hover:not(:disabled){background:rgba(154,240,111,.2)}.vx-ic:disabled{opacity:.3;cursor:default}',
      '.vx-line{position:absolute;left:10px;right:10px;bottom:0;height:18px;cursor:pointer;touch-action:none;user-select:none}',
      '.vx-track{position:absolute;left:0;right:0;bottom:7px;height:4px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}',
      '.vx-fill{height:100%;width:0;background:#fde047}',
      '.vx-pin{pointer-events:none;position:relative;margin:0 auto 10px;max-width:min(560px,100%);box-sizing:border-box;padding:8px 14px;border-radius:12px;background:#fde047;color:#11261f;font-size:19px;font-weight:700;line-height:1.4;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.5);display:none}',
      '.vx-pin.show{display:block}',
      'body.vx-show{padding-bottom:280px}',
      'section.lesson canvas,.ps-hook-slot{scroll-margin-top:60px}',
      '@media (max-width:620px){.vx-av{height:78px}.vx-txt{font-size:17px}.vx-bub{padding:8px 10px 12px}body.vx-show{padding-bottom:240px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function buildUI() {
    css();
    var host = document.querySelector('#modeBar .mode-row') || document.querySelector('#modeBar');
    ui.open = el('button', 'vx-open', '🔊 有聲講解');
    ui.open.type = 'button';
    ui.open.setAttribute('aria-pressed', 'false');
    if (host) host.appendChild(ui.open); else document.body.appendChild(ui.open);

    ui.panel = el('div', 'vx-panel', null, document.body);
    ui.pin = el('div', 'vx-pin', '', ui.panel);
    ui.panel.setAttribute('role', 'region');
    ui.panel.setAttribute('aria-label', '有聲講解');
    var cap = el('div', 'vx-cap', null, ui.panel);
    ui.avL = el('img', 'vx-av', null, cap); ui.avL.src = AV['彥君']; ui.avL.alt = '彥君老師';
    var bub = el('div', 'vx-bub', null, cap);
    ui.who = el('span', 'vx-who', '', bub);
    ui.sub = el('div', 'vx-txt', '按 ▶ 聽彥君老師與曉臻助教講解。', bub);
    ui.sub.setAttribute('aria-live', 'polite');
    var ctl = el('div', 'vx-ctl', null, bub);
    var IC = {
      back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/><text x="12" y="16.5" font-size="7.5" font-weight="700" text-anchor="middle" font-family="sans-serif">5</text></svg>',
      fwd: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 5V2l5 4-5 4V7a5 5 0 1 0 5 5h2a7 7 0 1 1-7-7z"/><text x="12" y="16.5" font-size="7.5" font-weight="700" text-anchor="middle" font-family="sans-serif">5</text></svg>',
      play: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
      pause: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
      stop: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>'
    };
    function mk(ic, title) { var b = el('button', 'vx-ic', null, ctl); b.innerHTML = IC[ic]; b.title = title; b.setAttribute('aria-label', title); b.type = 'button'; return b; }
    ui.back = mk('back', '倒退 5 秒');
    ui.start = mk('play', '開始／繼續');
    ui.pause = mk('pause', '暫停');
    ui.fwd = mk('fwd', '快轉 5 秒');
    ui.stop = mk('stop', '停止');
    var tr = el('div', 'vx-line', null, bub);
    tr.setAttribute('role', 'slider'); tr.setAttribute('aria-label', '拖曳或點選，跳到某一句');
    var track = el('div', 'vx-track', null, tr);
    ui.fill = el('div', 'vx-fill', null, track);
    bindBar(tr);
    ui.count = { textContent: '' };
    ui.avR = el('img', 'vx-av', null, cap); ui.avR.src = AV['曉臻']; ui.avR.alt = '曉臻助教';
    ui.who.style.display = 'none';

    ui.open.addEventListener('click', function () {
      var show = !ui.panel.classList.contains('show');
      if (!show) stop();
      ui.panel.classList.toggle('show', show);
      document.body.classList.toggle('vx-show', show); // 面板打開時頁尾留白，讓底部的按鈕（例如接線練習）捲得上來
      ui.open.classList.toggle('on', show);
      ui.open.setAttribute('aria-pressed', String(show));
      if (show && state === 'idle') start();   // 打開面板就自動開始播（這一下點擊就是瀏覽器要的「使用者操作」，不必再按 ▶）
    });
    // 老師講解模式的自動導覽會自己換分頁，和語音同時跑就會對不上：語音播放中一律留在學生操作。
    // 播放中若有人按了「老師講解」，就切回學生操作，並把目前這一句的畫面重新套上。
    new MutationObserver(function () {
      if (state === 'idle' || !document.body.classList.contains('mode-teacher')) return;
      var sb = document.getElementById('mode-student'); if (sb) sb.click();
      if (cur.tab) {
        goto(cur.tab, cur.sub, cur.step, false, cur.seg);
        var pv0 = viewOf(cur.tab, cur.sub, cur.step);   // 頁面老師模式啟動時會自己捲動：再把這一句的畫面對回字幕框上方
        if (pv0) { bringIntoView(pv0); setTimeout(function () { if (state !== 'idle') bringIntoView(pv0); }, 700); }
      }
      if (state === 'paused') { pauseSaved = null; freezeRun(); }   // 頁面切模式會把動畫重設成播放；暫停中就再凍住
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    ui.start.addEventListener('click', start);
    ui.pause.addEventListener('click', pause);
    ui.stop.addEventListener('click', stop);
    ui.back.addEventListener('click', function () { seek(-5); });
    ui.fwd.addEventListener('click', function () { seek(5); });
    refresh();
  }

  // 進度條：點一下或拖曳，就從該句開始播（畫面會依前面的切頁、動畫、釘選還原）
  function bindBar(bar) {
    var dragging = false;
    function valueAt(ev) {
      var r = bar.getBoundingClientRect();
      var f = Math.max(0, Math.min(1, (ev.clientX - r.left) / (r.width || 1)));
      return { n: Math.min(total - 1, Math.floor(f * total)), f: f };
    }
    bar.addEventListener('pointerdown', function (ev) {
      if (!total) return;
      dragging = true;
      try { bar.setPointerCapture(ev.pointerId); } catch (e) {}
      var v = valueAt(ev); ui.fill.style.width = (v.f * 100) + '%';
      ev.preventDefault();
    });
    bar.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      var v = valueAt(ev); ui.fill.style.width = (v.f * 100) + '%';
    });
    bar.addEventListener('pointerup', function (ev) {
      if (!dragging) return;
      dragging = false;
      jumpToLine(valueAt(ev).n);
    });
    bar.addEventListener('pointercancel', function () { dragging = false; progress(lineNo()); });
  }

  // 從第 n 句（0 起算）開始播：先停掉目前的音檔，再把前面的設定還原，然後接著播
  function jumpToLine(n) {
    var k = -1, cnt = 0;
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'line') { if (cnt === n) { k = i; break; } cnt++; }
    }
    if (k < 0) return;
    halt();
    state = 'playing'; idx = k; progress(n); refresh();
    syncTo(k);
    step();
  }

  function refresh() {
    ui.start.disabled = state === 'playing';
    ui.pause.disabled = state !== 'playing';
    ui.stop.disabled = state === 'idle';
    ui.back.disabled = ui.fwd.disabled = state === 'idle';
  }

  function lineNo() { // 目前播到第幾句說話行
    var n = 0;
    for (var i = 0; i < idx && i < items.length; i++) if (items[i].kind === 'line') n++;
    return n;
  }

  function progress(doneLines) {
    ui.fill.style.width = (total ? (doneLines / total) * 100 : 0) + '%';
  }

  // ─── 切頁與畫面場景（岩石家族與循環：4 個分頁，5 個舞台）───
  // 分頁：#btn-tab-0～3（switchTab）；每一站照頁面老師講解的做法，按原本就有的按鈕（clk）。
  // 播放中一律學生操作：每句只換到該句的步驟，不連播到底（老師講解模式由上方的觀察者擋住）。
  var cur = { tab: null, sub: null, step: 0, seg: 0 };
  var saved = null;   // 開始播放前的執行狀態，停止時還原
  var pauseSaved = null;
  function $(id) { return document.getElementById(id); }
  function clearTimers() {}
  function unfitWire() {}
  function clk(sel) { var e = document.querySelector(sel); if (e) e.click(); }
  function tabIdx(tab) { return +String(tab).replace('btn-tab-', ''); }

  // ─── 場景：4 個分頁、5 個舞台（mn／cr／sd／mt 四個實驗台＋cy 岩石循環圖）；步驟編號 n＝該分頁動作表的第 n 個動作 ───
  // fresh＝剛開始；go i＝按下第 i 步（動畫現場播放）；show i＝停在「先猜猜看」題目；pick i＝選正確答案；
  // cy：do k＝按下「作用」k（岩石沿箭頭走）；try k＝故意按走不通的作用，畫面顯示原因
  var LABIDS = ['mn', 'cr', 'sd', 'mt'];
  var GUESSKEY = { mn: 'one', cr: 'warm', sd: 'gravel', mt: 'perp' };
  var ACTS = [
    [['mn', 'fresh'], ['mn', 'go', 0], ['mn', 'show', 1], ['mn', 'pick', 1], ['mn', 'go', 2], ['mn', 'go', 3]],
    [['cr', 'fresh'], ['cr', 'go', 0], ['cr', 'show', 1], ['cr', 'pick', 1], ['cr', 'go', 2], ['cr', 'go', 3]],
    [['sd', 'show', 0], ['sd', 'pick', 0], ['sd', 'go', 1], ['sd', 'go', 2], ['sd', 'go', 3], ['sd', 'go', 4],
     ['mt', 'fresh'], ['mt', 'go', 0], ['mt', 'show', 1], ['mt', 'pick', 1], ['mt', 'go', 2], ['mt', 'go', 3]],
    [['cy', 'fresh'], ['cy', 'do', 'cool'], ['cy', 'try', 'cmp'], ['cy', 'do', 'wea'], ['cy', 'do', 'cmp'], ['cy', 'do', 'met'], ['cy', 'do', 'met'], ['cy', 'do', 'melt']]
  ];
  var CYMOVES = ['cool', 'try:cmp', 'wea', 'cmp', 'met', 'met', 'melt'];   // 循環圖步驟 2～8 依序做的事
  var CVID = { mn: 'mnCanvas', cr: 'crCanvas', sd: 'sdCanvas', mt: 'mtCanvas', cy: 'cyCanvas' };
  var CY_BASE = (typeof CY !== 'undefined') ? CY.MOVE : 1.25;
  function labOf(id) { try { return LABS[id]; } catch (e) { return null; } }
  function actOf(ti, n) { return (ACTS[ti] || [])[(n || 1) - 1] || []; }
  function hardReset(L) { L.cur = null; L.q = []; L.done = null; labReset(L.id); }
  // 同頁面老師講解的 labJump：把前面的步驟「瞬間跑完」，狀態跟真的播過一樣（猜猜看步驟順便選好正確答案）
  function jumpTo(L, target) {
    hardReset(L);
    var F = L.cfg.flow;
    for (var i = 0; i < target && i < F.length; i++) {
      var s = F[i];
      if (s.guess) { L.guess = GUESSKEY[L.id]; L.i++; continue; }
      (s.run ? s.run(L) : []).forEach(function (q) { if (q.s) q.s(q); if (q.u) q.u(1, q); if (q.e) q.e(q); });
      if (s.after) s.after(L);
      L.i++;
    }
    L.key = ''; labNote(L); labUI(L);
  }
  var pend = 0;
  function clearPend() { if (pend) { clearInterval(pend); pend = 0; } }
  // 實驗台要在第 idx 步、而且手上沒有動畫在跑：還在跑上一步就等它跑完（最多 12 秒），否則直接瞬間跳到那一步
  function whenReady(L, idx, fn) {
    clearPend();
    if (L.i === idx && !L.cur) { fn(); return; }
    if (L.cur && L.i === idx - 1) {
      var n = 0;
      pend = setInterval(function () {
        if (L.i === idx && !L.cur) { clearPend(); fn(); }
        else if (++n > 120) { clearPend(); jumpTo(L, idx); fn(); }
      }, 100);
      return;
    }
    jumpTo(L, idx); fn();
  }
  // 岩石循環圖：從岩漿重新走一遍到第 n 步（前面的瞬間走完，最後一步 anim 為真時讓岩石沿箭頭走）
  function cySet(n, anim) {
    CY.MOVE = CY_BASE; cyClear(); CYS.auto = false; CYS.touched = true;
    var mv = CYMOVES.slice(0, Math.max(0, n - 1));
    mv.forEach(function (k, i) {
      if (k.indexOf('try:') === 0) { cyDo(k.slice(4), true); return; }   // 走不通：只顯示原因
      cyDo(k, !(anim && i === mv.length - 1));
    });
    cyUI();
  }
  function runAct(ti, n, anim) {
    var a = actOf(ti, n); if (!a.length) return;
    clearPend();
    if (a[0] === 'cy') { cySet(n, anim); return; }
    var L = labOf(a[0]); if (!L) return;
    if (ti === 2) {   // 同一頁兩個實驗台：播沉積岩時變質岩回到剛開始；播變質岩時沉積岩已經全部做完
      var sd = labOf('sd'), mt = labOf('mt');
      if (a[0] === 'sd') { if (mt && (mt.i || mt.cur)) hardReset(mt); }
      else if (sd && !(sd.i >= sd.cfg.flow.length && !sd.cur)) jumpTo(sd, sd.cfg.flow.length);
    }
    if (a[1] === 'fresh') hardReset(L);
    else if (a[1] === 'go') { if (anim) whenReady(L, a[2], function () { labGo(L.id); }); else jumpTo(L, a[2] + 1); }
    else if (a[1] === 'show') {
      whenReady(L, a[2], function () { if (cur.tab != null) { var v = viewOf(cur.tab, cur.sub, cur.step); if (v) bringIntoView(v); } });
    }
    else if (a[1] === 'pick') { whenReady(L, a[2], function () { labGuess(L.id, GUESSKEY[L.id]); }); }
  }
  // 字幕框要對齊的畫面：目前這個舞台的畫布（整張畫布要在字幕框上方）
  function viewOf(tab, sub, step) {
    if (tab == null) return null;
    var a = actOf(tabIdx(tab), step), id = a[0];
    if (!id) return null;
    var c = $(CVID[id]);
    if (id === 'cy') { var st = $('cy-status'); return c ? { k: tab + ':cy', topEl: c, botEl: (a[1] === 'try' && st) ? st : c, anchor: 'top' } : null; }
    // 「先猜猜看」：畫布＋下方的題目與選項一起放到字幕框上方；放不下時對齊下緣（選項優先，畫布上緣的空白可以被切掉）
    var g = a[1] === 'show' && $(id + '-guess');
    if (c && g && g.offsetHeight) return { k: tab + ':' + id + ':guess', topEl: c, botEl: g, anchor: 'bottom' };
    return c ? { k: tab + ':' + id, topEl: c, botEl: c, anchor: 'top' } : null;
  }
  function sceneOf(tab, sub, stepNo, anim, seg) {
    stepNo = stepNo || 1;
    var ti = tabIdx(tab), btn = $(tab);
    var changedTab = !!(btn && !btn.classList.contains('active'));
    var prev = cur;
    try {
      if (changedTab) btn.click();
      runAct(ti, stepNo, anim);
    } catch (e) { if (window.console) console.warn('[有聲講解] 場景失敗', tab, stepNo, e); }
    cur = { tab: tab, sub: sub, step: stepNo, seg: 0 };
    if (prev.tab !== tab || prev.step !== stepNo) hlClear(); // 換畫面：上一個畫面的標記線收掉
    var nv = viewOf(tab, sub, stepNo), pv = viewOf(prev.tab, prev.sub, prev.step);
    if (nv && (changedTab || !pv || pv.k !== nv.k || prev.step !== stepNo)) bringIntoView(nv);
  }
  var goto = sceneOf;
  // 動畫的執行狀態：暫停時凍住（同頁面老師講解的做法：把正在播的那一段的起點一起往後推；循環圖把移動時間調到很大），停止時還原成開始前的樣子
  var frozen = 0, frozenLast = 0;
  function freezeRun() {
    if (frozen) return;
    frozenLast = kNow();
    try { CY.MOVE = 1e9; } catch (e) {}
    frozen = setInterval(function () {
      var now = kNow(), d = now - frozenLast; frozenLast = now;
      LABIDS.forEach(function (id) { var L = LABS[id]; if (L && L.cur) L.cur.t0 += d; });
    }, 16);
  }
  function thawRun() { if (frozen) { clearInterval(frozen); frozen = 0; try { CY.MOVE = CY_BASE; } catch (e) {} } }
  function snapshotLive() {
    var m = {};
    try { LABIDS.forEach(function (id) { m[id] = { i: LABS[id].i, g: LABS[id].guess }; }); } catch (e) {}
    saved = m; pauseSaved = null;
  }
  function restoreLive() { // 停止時交還給學生操作：每個實驗台回到開始前的那一步（不強制換分頁），循環圖回到原本一進來的樣子
    pauseSaved = null; thawRun(); clearPend();
    if (!saved) return;
    var m = saved; saved = null;
    try {
      LABIDS.forEach(function (id) { var L = LABS[id], s = m[id]; if (!L || !s) return; jumpTo(L, s.i); L.guess = s.g; L.key = ''; labUI(L); });
      CY.MOVE = CY_BASE; cyClear(); CYS.auto = false; CYS.touched = false;
      var act = Array.prototype.findIndex.call(document.querySelectorAll('.panel'), function (p) { return p.classList.contains('active'); });
      if (act === 3) cyEnter(); else cyUI();
    } catch (e) {}
  }
  // 把一段範圍（頭 top～尾 bot）捲到字幕框上方：放得下就置中；放不下就依 anchor 對齊上緣或下緣
  function visBottom() { // 字幕框（有釘選黃條時用黃條）的上緣
    var t = ui.panel.querySelector('.vx-bub').getBoundingClientRect().top;
    if (ui.pin.classList.contains('show')) t = Math.min(t, ui.pin.getBoundingClientRect().top);
    return t;
  }
  // 平滑捲動還在半路時（例如拖進度條跨分頁：先捲到開場框、馬上又要捲到畫面），要用「捲動的目的地」來判斷，
  // 不能用半路上的瞬間位置，否則會誤判「已在畫面內」而停在上一個目的地（畫面被字幕框擋住）。
  var goalY = null, goalT = 0;
  function scrollGoal(y) {
    goalY = Math.max(0, y); goalT = Date.now();
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
  }
  function bringIntoView(v) {
    var a = v && (v.topEl || $(v.top)), b = v && (v.botEl || (v.bot ? $(v.bot) : a));
    if (!a || !b || !a.getBoundingClientRect) return;
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var base = (goalY != null && Date.now() - goalT < 900) ? goalY : window.pageYOffset;
    var dy = base - window.pageYOffset; // 捲動完成後，元素會再往上移 dy
    var top = ra.top - dy, bot = Math.max(ra.bottom, rb.bottom) - dy;
    var panelTop = visBottom();
    if (top >= 56 && bot <= panelTop - 8) return; // 已完整在畫面內（以捲動目的地計），不動
    var room = panelTop - 8 - 56 - (bot - top);
    var y;
    if (room >= 0) y = base + top - 56 - room / 2;
    else if (bot - top <= panelTop - 8) y = base + bot - (panelTop - 8); // 上方留白不夠 56 但整段放得下：貼齊字幕框上緣（上方按鈕列可以蓋在畫布頂端的空白）
    else if (v.anchor === 'bottom') y = base + bot - (panelTop - 8);
    else y = base + top - 56;
    scrollGoal(y);
  }

  // ─── 自動螢光筆：唸到哪裡，就依語音進度在畫面上一筆筆畫出黃色螢光線（外加一層，pointer-events:none，不碰頁面原有內容與畫布）───
  function unionRect(els) {
    var L = 1e9, T = 1e9, R = -1e9, B = -1e9, n = 0;
    els.forEach(function (e) {
      if (!e || !e.getBoundingClientRect) return;
      var r = e.getBoundingClientRect(); if (!r.width && !r.height) return;
      L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); n++;
    });
    return n ? { left: L, top: T, width: R - L, height: B - T } : null;
  }
  function R_(f) { return function () { return unionRect(f()); }; }
  // 頁面文字裡符合 regex 的那一段（用 Range 量出它佔的方框；跨 <b> 也可以）
  function textRect(root, re) {
    return function () {
      if (!root) return null;
      var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [], full = '', n;
      while ((n = tw.nextNode())) { nodes.push({ n: n, s: full.length }); full += n.nodeValue; }
      var m = re.exec(full); if (!m) return null;
      var a = m.index, b = m.index + m[0].length, rg = document.createRange(), started = false;
      for (var i = 0; i < nodes.length; i++) {
        var nd = nodes[i], len = nd.n.nodeValue.length;
        if (!started && a < nd.s + len) { rg.setStart(nd.n, Math.max(0, a - nd.s)); started = true; }
        if (started && b <= nd.s + len) { rg.setEnd(nd.n, Math.max(0, b - nd.s)); break; }
      }
      var rs = rg.getClientRects(); if (!rs.length) return null;
      var lines = [];   // 同一行的小框併成一個，跨行文字就是每行各一個框
      Array.prototype.slice.call(rs).forEach(function (q) {
        if (q.width < 1) return;
        var L = lines[lines.length - 1];
        if (L && Math.abs(q.top - L.top) < q.height * 0.5) { L.left = Math.min(L.left, q.left); L.right = Math.max(L.right, q.right); L.bottom = Math.max(L.bottom, q.bottom); L.top = Math.min(L.top, q.top); }
        else lines.push({ left: q.left, right: q.right, top: q.top, bottom: q.bottom });
      });
      return lines.map(function (L) { return { left: L.left, top: L.top, width: L.right - L.left, height: L.bottom - L.top }; });
    };
  }

  function txt(root, re) { return function () { var r = typeof root === 'function' ? root() : document.querySelector(root); return textRect(r, re)(); }; }
  // 螢光筆只框「字」本身（用文字範圍量）；五處標記都在各分頁的講解文字（.lesson-step）裡
  function stepTxt(sel, re) { return txt(function () { return document.querySelector(sel); }, re); }
  var RECT = {};
  // 每句要畫的標記：{ 句號: [{ s, e, k }] }；s、e 是這句台詞裡的位置，唸到那裡才畫
  var HLSPEC = {};   // 本課沒有可畫線的 DOM 公式（算式都在 canvas 裡）：不畫螢光筆

  var HL = {};
  var LINE_TEXT = {};   // 句號 → 台詞（init 時填入），用來換算 s、e 的位置
  function hlOf(id) {
    if (HL[id] !== undefined) return HL[id];
    var spec = HLSPEC[id], t = LINE_TEXT[id];
    if (!spec || !t) return (HL[id] = null);
    HL[id] = spec.map(function (g) {
      var i = t.indexOf(g.s), j = t.indexOf(g.e, Math.max(0, i)); if (i < 0) i = 0; if (j < 0) j = t.length - g.e.length;
      return { a: Math.max(0, i / t.length - 0.02), b: Math.min(1, (j + g.e.length) / t.length + 0.02), r: RECT[g.k] };
    });
    return HL[id];
  }

  var hlTimer = 0, hlSegs = [], hlLayer = null;
  function hlClear() {
    if (hlTimer) { clearInterval(hlTimer); hlTimer = 0; }
    hlSegs.forEach(function (g) { g.els.forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); }); });
    hlSegs = [];
  }
  var hlExpire = 0;   // 標記線留在畫面上的期限（毫秒時間）；唸完之後再留約十四秒
  function hlStart(it, a, my) {
    var spec = hlOf(it.id); if (!spec) return;   // 這句沒有標記：上一句畫的線繼續留著（直到換畫面或期限到）
    hlClear(); hlExpire = 0;
    if (!hlLayer) {
      hlLayer = document.createElement('div'); hlLayer.id = 'vx-hl-layer';
      hlLayer.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:60';
      document.body.appendChild(hlLayer);
    }
    hlSegs = spec.map(function (sg) { return { els: [], sg: sg }; });
    function mkEl(g) {
      var e = document.createElement('div'); e.className = 'vx-hl'; e.dataset.seg = hlSegs.indexOf(g);
      e.style.cssText = 'position:absolute;display:none;border-radius:9px;background:rgba(255,224,102,.45);box-shadow:0 0 8px rgba(255,224,102,.35);transform:rotate(-.6deg);transform-origin:left center';
      hlLayer.appendChild(e); g.els.push(e); return e;
    }
    var mySrc = a.src;   // 這一句的音檔；播放器只有一個 Audio，下一句會換 src
    hlTimer = setInterval(function () {
      // 「這一句還在唸」＝同一次播放（token）而且 Audio 還是這一句的音檔、還沒播完。
      // 只看 token 是錯的：下一句沿用同一個 Audio，舊的線會跟著下一句的進度從頭再畫一次（2026-11-17 老師抓到：維生素 A 畫兩次、C 只畫一點點）。
      var live = (my === token) && a.src === mySrc && !a.ended;
      if (!live && !hlExpire) hlExpire = Date.now() + 14000;
      if (hlExpire && Date.now() > hlExpire) { hlClear(); return; }
      var d = a.duration, ct = a.currentTime || 0;
      var f = !live ? 1 : ((d && isFinite(d) && d > 0) ? ct / d : ct / Math.max(1.5, it.text.length * SEC_PER_CHAR));
      hlSegs.forEach(function (g) {
        var r = null; try { r = g.sg.r(); } catch (e) {}
        var rs = !r ? [] : (Array.isArray(r) ? r : [r]);
        if (!live && rs.length) { var vb0 = visBottom(); if (rs.every(function (q) { return q.top + q.height < 40 || q.top > vb0; })) rs = []; }   // 唸完後沿用的標記，若畫面已捲走就先收起來
        var p = Math.max(0, Math.min(1, (f - g.sg.a) / (g.sg.b - g.sg.a)));
        if (!rs.length || p <= 0) { g.els.forEach(function (e) { e.style.display = 'none'; }); return; }
        if (!g.seen) { // 標記處若被字幕框擋住或在畫面外，先把它捲到字幕框上方
          g.seen = 1;
          var pt = visBottom(), r0 = rs[0], rl = rs[rs.length - 1];
          if (rl.top + rl.height > pt - 12) { scrollGoal(window.pageYOffset + (rl.top + rl.height) - (pt - 12)); g.moved = 1; }   // 只捲到剛好露出（不置中）
          else if (r0.top < 56) { scrollGoal(window.pageYOffset + r0.top - 70); g.moved = 1; }
        }
        if (g.moved && !g.back && p >= 1) {   // 畫完這一條：馬上把畫面拉回動畫（重點是動畫不是文字）
          g.back = 1;
          setTimeout(function () { if (my === token && cur.tab != null) bringIntoView(viewOf(cur.tab)); }, 700);
        }
        var tot = 0; rs.forEach(function (q) { tot += q.width + 16; });
        var done = tot * p;   // 依各行長度一行接一行畫
        rs.forEach(function (q, k) {
          var e = g.els[k] || mkEl(g), w = Math.min(q.width + 16, Math.max(0, done));
          done -= q.width + 16;
          if (w <= 0) { e.style.display = 'none'; return; }
          e.style.display = 'block';
          e.style.left = (q.left + window.pageXOffset - 8) + 'px';
          e.style.top = (q.top + window.pageYOffset + q.height * 0.06) + 'px';
          e.style.width = w + 'px';
          e.style.height = (q.height * 0.88) + 'px';
        });
      });
    }, 40);
  }

  // 句中換畫面：依音檔播放比例（0～1）觸發，例如「電量越大…距離越遠…」說到哪就換到哪
  var actTimer = 0;
  function stopActs() { if (actTimer) { clearInterval(actTimer); actTimer = 0; } }
  function runActs(it, a, my) {
    stopActs();
    var acts = stage.acts && stage.acts[it.id];
    if (!acts || !acts.length) return;
    var fired = [];
    actTimer = setInterval(function () {
      if (my !== token) { stopActs(); return; }
      var d = a.duration, ct = a.currentTime || 0;
      var f = (d && isFinite(d) && d > 0) ? ct / d : ct / Math.max(1.5, it.text.length * SEC_PER_CHAR);
      var left = 0;
      for (var i = 0; i < acts.length; i++) {
        if (fired[i]) continue;
        if (f >= acts[i][0]) { fired[i] = 1; goto(acts[i][1], acts[i][2], acts[i][3], true); if (hlOf(it.id)) hlStart(it, a, my); }
        else left++;
      }
      if (!left) stopActs();
    }, 50);
  }

  // 字幕：逐字包 span，播放時依音檔進度逐字變色
  var chars = [];
  function showSub(item) {
    var text = displayText(stage.subs[item.id] || item.text);
    ui.sub.textContent = '';
    chars = [];
    for (var i = 0; i < text.length; i++) chars.push(el('span', '', text[i], ui.sub));
    var who = item.speaker;
    ui.who.style.display = '';
    ui.who.textContent = WHO[who] || who;
    ui.who.style.background = COLOR[who] || '#6db3ff';
    var avs = stage.avatars && stage.avatars[item.id];  // 頭像圖庫：每句各顯示哪一張（AGENTS_VOICE 2-1）
    if (avs) { if (avs['彥君']) ui.avL.src = avs['彥君']; if (avs['曉臻']) ui.avR.src = avs['曉臻']; }
    ui.avL.classList.toggle('on', who === '彥君' || who === '合聲');
    ui.avR.classList.toggle('on', who === '曉臻' || who === '合聲');
  }

  function trackChars(a) {
    cancelAnimationFrame(raf);
    (function tick() { // 只依音檔的實際播放位置變色；長度未知或還沒開始播時不動，避免先跑快再回彈
      var d = a.duration, p = 0;
      if (d && isFinite(d) && a.currentTime > 0) p = Math.min(1, a.currentTime * PACE / d);
      var n = p > 0 ? Math.min(chars.length, Math.floor(p * chars.length) + 1) : 0;
      for (var i = 0; i < chars.length; i++) chars[i].className = i < n ? 'on' : '';
      raf = requestAnimationFrame(tick);
    })();
  }

  // 讀音稿的「恩極／艾斯極」螢幕上顯示成 N極／S極（念的字不變）
  function displayText(t) {
    return String(t || '').replace(/恩極/g, 'N極').replace(/艾斯極/g, 'S極').replace(/批波/g, 'P 波').replace(/艾斯波/g, 'S 波');
  }

  function setPin(text) {
    text = (stage.pins && stage.pins[text]) || displayText(text);   // 釘選黃條的數字也轉阿拉伯數字（stage.pins）
    ui.pin.textContent = text || '';
    ui.pin.classList.toggle('show', !!text);
    if (text && cur.tab) { var pv = viewOf(cur.tab, cur.sub, cur.step); if (pv) bringIntoView(pv); } // 黃條出現後，把目前畫面重新對齊到黃條上方
  }

  // ─── 計時（＊停）可暫停 ───
  function wait(sec, done) {
    waitLeft = sec * 1000; waitDone = done; waitStart = Date.now();
    timer = setTimeout(function () { timer = null; waitDone = null; done(); }, waitLeft);
  }
  function clearWait() { if (timer) { clearTimeout(timer); timer = null; } }

  // ─── 主迴圈 ───
  function step() {
    if (state !== 'playing') return;
    if (idx >= items.length) { finish(); return; }
    var it = items[idx], my = token;
    if (it.kind === 'marker') {
      var m = /^[＊*]\s*(切頁|停|釘選)\s*[：:]\s*(.+)$/.exec(it.text || '');
      idx++;
      if (m && m[1] === '切頁') {
        var c = stage.cuts[m[2].trim()];
        setPin('');
        if (c) goto(c.tab, c.sub, c.step, false, c.seg);
      } else if (m && m[1] === '釘選') {
        setPin(m[2].trim());
      } else if (m && m[1] === '停') {
        var sec = parseFloat(m[2]);
        if (sec > 0) { wait(sec, function () { if (my === token) step(); }); return; }
      }
      step();
      return;
    }
    playLine(it, my);
  }

  function getAudio(it) {
    if (!player) { player = new Audio(); player.preload = 'auto'; }
    var a = player;
    a.onended = a.onerror = null;
    a.dataset.tried = '';
    a.src = AUDIO_BASE + encodeURIComponent(it.file) + AUDIO_VER;
    return a;
  }

  function preloadNext() { // 先把下一句抓進瀏覽器快取
    for (var i = idx + 1; i < items.length; i++) {
      if (items[i].kind === 'line') {
        try { fetch(AUDIO_BASE + encodeURIComponent(items[i].file) + AUDIO_VER, { cache: 'force-cache' }).catch(function () {}); } catch (e) {}
        return;
      }
    }
  }

  function playLine(it, my) {
    var at = stage.at[it.id];
    stopActs();
    if (at) goto(at.tab, at.sub, at.step, true, at.seg);
    showSub(it);
    if (cur.tab != null) { var lv = viewOf(cur.tab, cur.sub, cur.step); if (lv) bringIntoView(lv); } // 字幕變成兩行時字幕框會長高：重新確認畫面仍在字幕框上方
    var n = lineNo() + 1;
    progress(n - 1);
    var a = audio = getAudio(it);
    var advanced = false;
    function next() {
      if (advanced || my !== token) return;
      advanced = true;
      a.onended = a.onerror = null;
      for (var k = 0; k < chars.length; k++) chars[k].className = 'on';
      if (audio === a) audio = null;
      idx++;
      progress(n);
      step();
    }
    function fallback() { // 音檔讀不到：先改試 Release 備援，還是不行就照字數等一下再繼續
      if (advanced || my !== token) return;
      if (!a.dataset.tried) {
        a.dataset.tried = '1';
        a.src = AUDIO_FALLBACK + encodeURIComponent(it.file);
        var q = a.play(); if (q && q.catch) q.catch(function () {});
        return;
      }
      ui.sub.appendChild(document.createTextNode('（音檔載入失敗）'));
      audio = null;
      wait(Math.max(1.5, it.text.length * SEC_PER_CHAR), next);
    }
    a.onended = next;
    a.onerror = fallback;
    runActs(it, a, my);
    hlStart(it, a, my);
    try { a.currentTime = 0; } catch (e) { /* 尚未載入，忽略 */ }
    var p = a.play();
    trackChars(a);
    if (p && p.catch) p.catch(function (err) {
      if (my !== token) return;
      if (err && err.name === 'NotAllowedError') { pause(); ui.sub.textContent = '瀏覽器擋住自動播放，請再按 ▶。'; }
      else fallback();
    });
    preloadNext();
  }

  // ─── 控制 ───
  function start() {
    if (state === 'playing') return;
    if (state === 'paused') {
      state = 'playing'; refresh(); thawRun();
      if (audio && audio.paused) {
        var p = audio.play(); if (p && p.catch) p.catch(function () {});
      } else if (waitDone) {
        var d = waitDone; wait(waitLeft / 1000, d);
      } else { step(); }
      return;
    }
    // 老師講解模式若開著，先切回學生操作，避免兩邊同時自動換頁
    if (document.body.classList.contains('mode-teacher')) {
      var sb = document.getElementById('mode-student'); if (sb) sb.click();
    }
    snapshotLive();
    idx = 0; token++; state = 'playing'; setPin(''); progress(0); refresh();
    cur = { tab: null, sub: null, step: 0 }; // 從頭播：第一個畫面一定要捲到位，不管上次停在哪
    step();
  }

  // 跳句子（快轉／倒退）後，把畫面還原成「這一句之前最後一次的設定」：切頁、動畫步驟、釘選
  function syncTo(upto) {
    var want = null, pin = '';
    for (var i = 0; i < upto && i < items.length; i++) {
      var it = items[i];
      if (it.kind === 'marker') {
        var m = /^[＊*]\s*(切頁|停|釘選)\s*[：:]\s*(.+)$/.exec(it.text || '');
        if (m && m[1] === '切頁') { var c = stage.cuts[m[2].trim()]; if (c) want = { tab: c.tab, sub: c.sub, step: 1 }; pin = ''; }
        else if (m && m[1] === '釘選') pin = m[2].trim();
      } else if (it.kind === 'line') {
        var a = stage.at[it.id];
        if (a) want = { tab: a.tab, sub: a.sub, step: a.step };
        var ac = stage.acts && stage.acts[it.id]; // 前面的句子已經播完，句中換的畫面也都換過了
        if (ac && ac.length) { var z = ac[ac.length - 1]; want = { tab: z[1], sub: z[2], step: z[3] }; }
      }
    }
    setPin(pin);
    stopActs();
    if (want) goto(want.tab, want.sub, want.step, false, want.seg);
  }

  // 快轉／倒退：同一句內移動；超出範圍就跳到下一句／上一句開頭
  function seek(sec) {
    if (state === 'idle') return;
    var a = audio;
    if (!a) { return; } // ＊停 計時中不處理
    var ct = a.currentTime || 0, d = a.duration;
    if (sec > 0) {
      if (d && isFinite(d) && ct + sec < d - 0.2) { a.currentTime = ct + sec; return; }
      var was = state; halt(); idx++; progress(lineNo()); state = 'playing'; refresh(); syncTo(idx); step();
    } else {
      if (ct + sec > 0) { a.currentTime = ct + sec; return; }
      var j = idx - 1;
      while (j >= 0 && items[j].kind !== 'line') j--;
      if (ct > 1.5 || j < 0) { a.currentTime = 0; return; }
      halt(); idx = j; progress(lineNo()); state = 'playing'; refresh(); syncTo(idx); step();
    }
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused'; freezeRun();
    if (audio && !audio.paused) audio.pause();
    if (timer) { waitLeft = Math.max(0, waitLeft - (Date.now() - waitStart)); clearWait(); }
    refresh();
  }

  function halt() {
    cancelAnimationFrame(raf);
    token++; clearWait(); waitDone = null; stopActs(); hlClear(); clearTimers();
    if (audio) { audio.onended = audio.onerror = null; try { audio.pause(); } catch (e) {} }
    audio = null;
  }

  function stop() {
    halt(); state = 'idle'; idx = 0; unfitWire(); restoreLive();
    setPin(''); progress(0);
    if (ui.sub) ui.sub.textContent = '按 ▶ 聽彥君老師與曉臻助教講解。';
    refresh();
  }

  function finish() {
    halt(); state = 'idle'; idx = 0; setPin(''); unfitWire(); restoreLive();
    progress(total);
    ui.sub.textContent = '講解結束，可以按 ▶ 重聽。';
    refresh();
  }

  // ─── 載入：任何一步失敗就不顯示按鈕 ───
  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }

  function init() {
    Promise.all([getJSON(MANIFEST_URL), getJSON(STAGE_URL)]).then(function (r) {
      items = (r[0].items || []).filter(function (i) {
        return i.kind === 'marker' || (i.kind === 'line' && i.file);
      });
      stage = r[1] || stage;
      stage.cuts = stage.cuts || {}; stage.at = stage.at || {}; stage.subs = stage.subs || {};
      total = items.filter(function (i) { return i.kind === 'line'; }).length;
      items.forEach(function (i) { if (i.kind === 'line') LINE_TEXT[i.id] = i.text; });
      if (!total) return;
      buildUI();
    }).catch(function (e) {
      if (window.console) console.info('[有聲講解] 未啟用：', e && e.message);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

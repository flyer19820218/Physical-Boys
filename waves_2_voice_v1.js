/* waves_2 有聲講解（外層加法）
 * 只做三件事：載入 manifest.json / stage.json、依序播放 manifest 裡的每一句音檔、依每句內容呼叫頁面原本的函式切換畫面。
 * 不碰 Canvas/SVG、動畫、題庫；不改任何既有 js。載入失敗時整個功能隱藏，原頁面完全不受影響。
 * 音檔與網頁同一個網域（audio/waves_2/mp3/）。
 */
(function () {
  'use strict';
  var MANIFEST_URL = 'audio/waves_2/manifest.json';
  var STAGE_URL = 'audio/waves_2/stage.json';
  // 音檔與網頁同一個網域（audio/waves_2/mp3/）：iPad Safari 對 GitHub Release 的下載網址（octet-stream＋attachment）常常無法播放。
  var AUDIO_BASE = 'audio/waves_2/mp3/';
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
      '.tl-g{transition:opacity .3s ease,box-shadow .25s ease}.tl-dim{opacity:.28}.tl-cur{box-shadow:0 0 0 4px rgba(255,224,102,.35)}',
      '#stage-container,#note-text,.card-grid,#hookBox{scroll-margin-top:60px}',
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
    });
    // 老師講解模式的自動導覽會自己換分頁，和語音同時跑就會對不上：語音播放中一律留在學生操作。
    // 播放中若有人按了「老師講解」，就切回學生操作，並把目前這一句的畫面重新套上。
    new MutationObserver(function () {
      if (state === 'idle' || !document.body.classList.contains('mode-teacher')) return;
      var sb = document.getElementById('mode-student'); if (sb) sb.click();
      if (cur.tab) goto(cur.tab, cur.sub, cur.step, false);
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

  // ─── 切頁與畫面場景（本課專用）───
  // 本課（waves_2）頁面用 switchTab('tab1'|'tab2'|'tab3') 切分頁，沒有子頁；畫面全靠頁面原有的全域函式／滑桿（不改任何既有程式）。
  // 步驟對照（與 lessons/waves_2.json 的 _note 相同）：
  //   tab1：1＝開場框＋畫面、2＝頻率3／波長4、3＝頻率5、4＝頻率3／波長8、5＝頻率5／波長8、6＝捲到選擇題（滑桿回3／4）、7＝公布第1題、8＝第2題、9＝公布第2題、10＝捲到黑板重點
  //   tab2：1＝開場框、2＝縱波模擬、3＝按下發射、4＝賽跑結束、5＝捲到黑板重點
  //   tab3：1＝開場框、2＝15度、3＝0度、4＝40度、5＝25度、6＝捲到選擇題（滑桿回15）、7＝公布答案、8＝捲到黑板重點
  var cur = { tab: null, sub: null, step: 0 };
  var saved = null;   // 開始播放前的分頁與滑桿，停止時還原
  function $(id) { return document.getElementById(id); }
  function clearTimers() {}
  function unfitWire() {}
  function setT1(f, lam) { rngFreq.value = String(f); rngWave.value = String(lam); updateTab1Stats(); }
  function setT3(t) { rngTemp.value = String(t); updateTab3Stats(); }
  function raceDone() { return raceProgress.air >= 500 && raceProgress.water >= 500 && raceProgress.steel >= 500; }
  function qBox(sec, i) { var s = $(sec); return s ? s.querySelectorAll('.quiz-q')[i] : null; }
  // 公布答案＝點正確選項（題庫轉接器沒有「取消作答」，所以公布後會留著）
  function reveal(sec, i, re) {
    var q = qBox(sec, i); if (!q) return;
    var bs = q.querySelectorAll('.quiz-options button');
    for (var k = 0; k < bs.length; k++) {
      if (re.test(bs[k].textContent)) { if (!bs[k].classList.contains('right')) bs[k].click(); return; }
    }
  }
  var T1S = [[3, 4], [3, 4], [5, 4], [3, 8], [5, 8], [3, 4], [3, 4], [3, 4], [3, 4], [3, 4]];
  var T3S = [15, 15, 0, 40, 25, 15, 15, 15];
  var SCENES = {
    tab1: function (step) {
      var s = T1S[Math.min(step, 10) - 1]; setT1(s[0], s[1]);
      if (step >= 7) reveal('quiz-section-tab1', 0, /\. 144 cm\/s$/);
      if (step >= 9) reveal('quiz-section-tab1', 1, /\. 30 cm$/);
    },
    tab2: function (step) {
      if (step <= 2) resetRace();
      else if (step === 3) { if (!isRacing || raceDone()) { resetRace(); startRace(); } }
      else { isRacing = true; raceProgress = { air: 500, water: 500, steel: 500 }; }
    },
    tab3: function (step) {
      setT3(T3S[Math.min(step, 8) - 1]);
      if (step >= 7) reveal('quiz-section-tab3', 0, /\. 340 m\/s$/);
    }
  };
  // 每個畫面要讓學生看到哪一段：{ k: 比對用的名稱, topEl/botEl: 範圍的頭與尾, anchor: 放不下時對齊上緣（top）或下緣（bottom） }
  function hookView() { return { k: 'hook', topEl: $('hookBox'), botEl: $('stage-container') }; }
  function stageView(tab) { return { k: 'stage:' + tab, topEl: $('controls-' + tab), botEl: tab === 'tab1' ? $('stats-box') : $('stage-container') }; }
  function noteView() { return { k: 'note', topEl: $('stage-container'), botEl: $('note-text'), anchor: 'bottom' }; }
  function quizView(sec, i) { var q = qBox(sec, i); return { k: 'quiz:' + sec + i, topEl: q, botEl: q }; }
  function viewOf(key, step) {
    if (!key) return null;
    if (key === 'tab1') {
      if (step === 1) return hookView();
      if (step === 6 || step === 7) return quizView('quiz-section-tab1', 0);
      if (step === 8 || step === 9) return quizView('quiz-section-tab1', 1);
      return step === 10 ? noteView() : stageView('tab1');
    }
    if (key === 'tab2') return step === 1 ? hookView() : (step === 5 ? noteView() : stageView('tab2'));
    if (key === 'tab3') {
      if (step === 1) return hookView();
      if (step === 6 || step === 7) return quizView('quiz-section-tab3', 0);
      return step === 8 ? noteView() : stageView('tab3');
    }
    return null;
  }

  function sceneOf(tab, sub, stepNo, anim) {
    stepNo = stepNo || 1;
    var key = sub || tab;
    var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
    var changedTab = false;
    if (btn && !btn.classList.contains('active')) { btn.click(); changedTab = true; }
    try {
      if (SCENES[key]) SCENES[key](stepNo, anim, changedTab);
    } catch (e) { if (window.console) console.warn('[有聲講解] 場景失敗', key, e); }
    var prev = cur;
    var prevKey = prev.sub || prev.tab;
    cur = { tab: tab, sub: sub, step: stepNo };
    var nv = viewOf(key, stepNo), pv = viewOf(prevKey, prev.step);
    if (nv && nv.topEl && (changedTab || !pv || pv.k !== nv.k)) bringIntoView(nv);
  }
  var goto = sceneOf;

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
  // 畫布上的一塊區域：用畫布邏輯座標（1000×350）換算成螢幕位置
  function cv(x, y, w, h) {
    return function () {
      var c = $('stage'); if (!c) return null;
      var r = c.getBoundingClientRect(); if (!r.width) return null;
      var sx = r.width / 1000, sy = r.height / 350;
      return { left: r.left + x * sx, top: r.top + y * sy, width: w * sx, height: h * sy };
    };
  }
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
      return unionRect(Array.prototype.slice.call(rs).map(function (q) { return { getBoundingClientRect: function () { return q; } }; }));
    };
  }
  function stat(n) { return R_(function () { return [$('stat' + n)]; }); }
  function ctl(n) { return R_(function () { return [document.querySelectorAll('#controls-tab1 .control-group')[n]]; }); }
  function fb(q, re) { // 選擇題的解答文字（公布後才有）
    return function () { var sec = currentTab === 'tab3' ? 'quiz-section-tab3' : 'quiz-section-tab1'; var qb = qBox(sec, q); return qb ? textRect(qb.querySelector('.quiz-feedback'), re)() : null; };
  }
  var noteB = R_(function () { return [document.querySelector('#note-text b[style*="monospace"]')]; });
  function noteTxt(re) { return function () { return textRect($('note-text'), re)(); }; }
  var noteTeal = R_(function () { return [document.querySelector('#note-text .highlight-teal')]; });
  var topLbl = cv(340, 8, 320, 36), vLbl = cv(300, 282, 400, 36);
  var freqLbl = ctl(0), waveLbl = ctl(1);
  var fork = cv(820, 150, 45, 60), orange = cv(893, 153, 48, 48);
  function trk(y) { return cv(15, y - 17, 140, 46); }
  var tForm = cv(0, 212, 1000, 60), thermo = cv(318, 98, 356, 62);
  var longLbl = cv(738, 22, 224, 32); // 畫布右上「縱波模擬 (分子推擠)」
  var fireBtn = R_(function () { return [document.querySelector('#controls-tab2 .action-btn')]; }); // 「點擊發射聲波測試」按鈕
  var hotNote = noteTxt(/溫度愈高，聲速愈快。/);
  var loudNote = noteTxt(/注意：聲音的大小\(響度\)和高低\(音調\)\s*不會\s*影響聲音的傳播速度喔！/);
  var HL = {
    '09': [{ a: 0.17, b: 0.94, r: topLbl }],
    '11': [{ a: 0.16, b: 0.51, r: freqLbl }, { a: 0.66, b: 0.98, r: stat(1) }],
    '12': [{ a: 0.00, b: 0.56, r: waveLbl }, { a: 0.61, b: 0.95, r: stat(2) }],
    '13': [{ a: 0.04, b: 0.18, r: stat(1) }, { a: 0.22, b: 0.41, r: stat(2) }, { a: 0.46, b: 0.84, r: vLbl }],
    '14': [{ a: 0.31, b: 0.54, r: vLbl }, { a: 0.79, b: 0.98, r: stat(3) }],
    '15': [{ a: 0.37, b: 0.50, r: vLbl }, { a: 0.52, b: 0.66, r: stat(1) }, { a: 0.70, b: 0.86, r: stat(2) }],
    '16': [{ a: 0.06, b: 0.65, r: vLbl }],
    '18': [{ a: 0.00, b: 0.21, r: stat(1) }, { a: 0.24, b: 0.41, r: stat(2) }, { a: 0.46, b: 0.69, r: vLbl }, { a: 0.71, b: 0.97, r: stat(3) }],
    '20': [{ a: 0.49, b: 0.57, r: stat(1) }, { a: 0.59, b: 0.70, r: stat(2) }, { a: 0.72, b: 0.92, r: vLbl }],
    '22': [{ a: 0.13, b: 0.28, r: stat(1) }, { a: 0.32, b: 0.46, r: stat(2) }, { a: 0.50, b: 0.86, r: vLbl }],
    '31': [{ a: 0.12, b: 0.54, r: fb(0, /v = f × λ = 12 × 12 = 144 cm\/s/) }],
    '35': [{ a: 0.64, b: 0.92, r: fb(1, /f = 1 ÷ \(1\/4\) = 4 Hz/) }],
    '36': [{ a: 0.26, b: 0.88, r: fb(1, /λ = v ÷ f = 120 ÷ 4 = 30 cm/) }],
    '38': [{ a: 0.04, b: 0.33, r: fb(1, /f = 1 ÷ \(1\/4\) = 4 Hz/) }, { a: 0.38, b: 0.77, r: fb(1, /λ = v ÷ f = 120 ÷ 4 = 30 cm/) }],
    '39': [{ a: 0.40, b: 0.68, r: noteB }, { a: 0.66, b: 0.88, r: noteTxt(/波速只和「介質」有關/) }],
    '45': [{ a: 0.32, b: 0.46, r: longLbl }, { a: 0.55, b: 0.66, r: fork }],
    '47': [{ a: 0.09, b: 0.95, r: orange }],
    '50': [{ a: 0.36, b: 0.46, r: trk(100) }, { a: 0.49, b: 0.58, r: trk(200) }, { a: 0.61, b: 0.70, r: trk(300) }],
    '52': [{ a: 0.40, b: 0.57, r: fireBtn }],
    '53': [{ a: 0.14, b: 0.37, r: trk(300) }, { a: 0.42, b: 0.55, r: trk(200) }, { a: 0.60, b: 0.83, r: trk(100) }],
    '54': [{ a: 0.00, b: 0.39, r: trk(100) }, { a: 0.41, b: 0.70, r: trk(200) }, { a: 0.72, b: 0.97, r: trk(300) }],
    '57': [{ a: 0.53, b: 0.87, r: noteTeal }],
    '58': [{ a: 0.10, b: 0.78, r: noteTeal }],
    '60': [{ a: 0.53, b: 0.97, r: tForm }],
    '62': [{ a: 0.12, b: 0.41, r: thermo }],
    '63': [{ a: 0.22, b: 0.97, r: tForm }],
    '65': [{ a: 0.50, b: 0.95, r: tForm }],
    '67': [{ a: 0.00, b: 0.96, r: tForm }],
    '70': [{ a: 0.43, b: 0.96, r: tForm }],
    '74': [{ a: 0.37, b: 0.90, r: fb(0, /v = 331 \+ 0\.6 × 15 = 331 \+ 9 = 340 m\/s/) }],
    '76': [{ a: 0.00, b: 0.92, r: noteB }],
    '77': [{ a: 0.41, b: 0.87, r: noteTxt(/濕度：濕度愈大波速愈快。/) }],
    '79': [{ a: 0.00, b: 0.84, r: noteTxt(/風向：順風會加速聲音傳遞。/) }],
    '81': [{ a: 0.22, b: 0.90, r: loudNote }],
    '82': [{ a: 0.05, b: 0.71, r: loudNote }],
    '83': [{ a: 0.75, b: 0.92, r: hotNote }]
  };
  var hlTimer = 0, hlSegs = [], hlLayer = null;
  function hlClear() {
    if (hlTimer) { clearInterval(hlTimer); hlTimer = 0; }
    hlSegs.forEach(function (g) { if (g.el.parentNode) g.el.parentNode.removeChild(g.el); });
    hlSegs = [];
  }
  function hlStart(it, a, my) {
    hlClear();
    var spec = HL[it.id]; if (!spec) return;
    if (!hlLayer) {
      hlLayer = document.createElement('div'); hlLayer.id = 'vx-hl-layer';
      hlLayer.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:60';
      document.body.appendChild(hlLayer);
    }
    hlSegs = spec.map(function (sg) {
      var e = document.createElement('div'); e.className = 'vx-hl';
      e.style.cssText = 'position:absolute;display:none;border-radius:9px;background:rgba(255,224,102,.45);box-shadow:0 0 8px rgba(255,224,102,.35);transform:rotate(-.6deg);transform-origin:left center';
      hlLayer.appendChild(e); return { el: e, sg: sg };
    });
    hlTimer = setInterval(function () {
      if (my !== token) { hlClear(); return; }
      var d = a.duration, ct = a.currentTime || 0;
      var f = (d && isFinite(d) && d > 0) ? ct / d : ct / Math.max(1.5, it.text.length * SEC_PER_CHAR);
      hlSegs.forEach(function (g) {
        var r = null; try { r = g.sg.r(); } catch (e) {}
        var p = Math.max(0, Math.min(1, (f - g.sg.a) / (g.sg.b - g.sg.a)));
        if (!r || p <= 0) { g.el.style.display = 'none'; return; }
        g.el.style.display = 'block';
        if (!g.seen) { // 標記處若被字幕框擋住或在畫面外，先把它捲到字幕框上方
          g.seen = 1;
          var pt = visBottom();
          if (r.top + r.height > pt - 12 || r.top < 56) {
            scrollGoal(window.pageYOffset + r.top - Math.max(70, (pt - r.height) / 2 - 20));
          }
        }
        g.el.style.left = (r.left + window.pageXOffset - 8) + 'px';
        g.el.style.top = (r.top + window.pageYOffset + r.height * 0.06) + 'px';
        g.el.style.width = ((r.width + 16) * p) + 'px';
        g.el.style.height = (r.height * 0.88) + 'px';
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
        if (f >= acts[i][0]) { fired[i] = 1; goto(acts[i][1], acts[i][2], acts[i][3], true); }
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
    return String(t || '').replace(/恩極/g, 'N極').replace(/艾斯極/g, 'S極');
  }

  function setPin(text) {
    text = (stage.pins && stage.pins[text]) || displayText(text);   // 釘選黃條的數字也轉阿拉伯數字（stage.pins）
    ui.pin.textContent = text || '';
    ui.pin.classList.toggle('show', !!text);
    if (text && cur.tab) { var pv = viewOf(cur.sub || cur.tab, cur.step); if (pv) bringIntoView(pv); } // 黃條出現後，把目前畫面重新對齊到黃條上方
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
        if (c) goto(c.tab, c.sub, c.step);
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
    a.src = AUDIO_BASE + encodeURIComponent(it.file);
    return a;
  }

  function preloadNext() { // 先把下一句抓進瀏覽器快取
    for (var i = idx + 1; i < items.length; i++) {
      if (items[i].kind === 'line') {
        try { fetch(AUDIO_BASE + encodeURIComponent(items[i].file), { cache: 'force-cache' }).catch(function () {}); } catch (e) {}
        return;
      }
    }
  }

  function playLine(it, my) {
    var at = stage.at[it.id];
    stopActs(); hlClear();
    if (at) goto(at.tab, at.sub, at.step, true);
    showSub(it);
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
      state = 'playing'; refresh();
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
    saved = { tab: currentTab, f: rngFreq.value, lam: rngWave.value, temp: rngTemp.value };
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
    if (want) goto(want.tab, want.sub, want.step, false);
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
    state = 'paused';
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

  function restoreLive() { // 把分頁與滑桿還原成按下「有聲講解」之前的樣子
    if (!saved) return;
    try {
      rngFreq.value = saved.f; rngWave.value = saved.lam; rngTemp.value = saved.temp;
      var tb = document.querySelector('.tab-btn[data-tab="' + saved.tab + '"]');
      if (currentTab !== saved.tab && tb) tb.click(); else renderUIForTab();
    } catch (e) {}
    saved = null;
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
      if (!total) return;
      buildUI();
    }).catch(function (e) {
      if (window.console) console.info('[有聲講解] 未啟用：', e && e.message);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

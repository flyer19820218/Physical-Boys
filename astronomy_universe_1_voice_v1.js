/* astronomy_universe_1 有聲講解（外層加法）
 * 只做三件事：載入 manifest.json / stage.json、依序播放 manifest 裡的每一句音檔、依每句內容呼叫頁面原本的函式切換畫面。
 * 各分頁動畫在播放中是「受控」的：該站需要運轉的才運轉、需要定格的才定格；暫停時一起凍住；停止／結束時還原成開始前的播放狀態。
 * 不碰 Canvas/SVG、動畫、題庫；不改任何既有 js。載入失敗時整個功能隱藏，原頁面完全不受影響。
 * 音檔與網頁同一個網域（audio/astronomy_universe_1/mp3/）。
 */
(function () {
  'use strict';
  var MANIFEST_URL = 'audio/astronomy_universe_1/manifest.json';
  var STAGE_URL = 'audio/astronomy_universe_1/stage.json';
  // 音檔與網頁同一個網域（audio/astronomy_universe_1/mp3/）：iPad Safari 對 GitHub Release 的下載網址（octet-stream＋attachment）常常無法播放。
  var AUDIO_BASE = 'audio/astronomy_universe_1/mp3/';
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
      if (state === 'paused') freezeRun();      // 頁面切模式時會把動畫全部重設成播放；暫停中就再凍住
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
  // 本課（astronomy_universe_1）頁面的分頁用 switchTab(idx)（按鈕 .tab-btn[data-tab=tab1…tab5]）；各畫面的狀態直接照頁面「老師講解模式」
  // 每一站的做法設定（呼叫頁面原本的全域狀態與函式：zoomState/zmUI、lightState/lyPick/lyPlay、gxView、solarState/soUI、MB/mbPick、rsMode/habitPick），不改任何畫法與節奏。
  // 步驟對照（與 lessons/astronomy_universe_1.json 的 _note 相同）：
  //   tab1：1～5＝宇宙縮放飛行 z＝0～4（換步時鏡頭 2 秒飛過去）、6＝層級圖、7＝四張卡片、8＝資優筆記
  //   tab2：1＝文字、2＝選比鄰星（未出發）、3～5＝比鄰星／織女星／參宿四光出發、6＝抵達參宿四、7＝兩把尺卡片、8＝資優筆記
  //   tab3：1＝文字、2＝俯視、3＝側視、4＝俯視（十萬光年）、5＝星系三種外觀、6＝資優筆記
  //   tab4：1＝文字、2＝太陽系動起來（全部）、3＝類地、4＝類木、5＝全部、6＝成員文字與表、7～11＝其他成員圖（先不選／行星／矮行星／小天體／衛星）、12＝觀念速記表、13＝資優筆記
  //   tab5：1＝文字、2＝距離比例、3＝行星大小、4＝實驗、5～8＝適居卡片（水星、金星、火星、地球）、9＝資優鄰居、10＝實驗結果與討論
  var cur = { tab: null, sub: null, step: 0 };
  function $(id) { return document.getElementById(id); }
  var drive = null;                       // 播放器自己推動的動畫（鏡頭飛行）；暫停時不推
  function clearTimers() { drive = null; }
  function unfitWire() {}
  function panelEl(i) { return document.querySelectorAll('.panel')[i] || null; }
  function PT(tab) { return panelEl(parseInt(String(tab).replace('tab', ''), 10) - 1); }
  function q1(p, sel) { return p ? p.querySelector(sel) : null; }
  function qs(p, sel) { return p ? p.querySelectorAll(sel) : []; }
  // 步驟對應頁面上方的「任務步驟」亮框（同老師講解模式的 mark）
  var MS = { tab1: [0, 0, 1, 2, 3, 4, 4, 4, 4], tab2: [0, 0, 3, 3, 3, 3, 2, 2, 1], tab3: [0, 0, 0, 1, 3, 3, 3], tab4: [0, 0, 1, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1], tab5: [0, 2, 0, 1, 2, 3, 3, 3, 3, 3, 3] };
  function markMs(tab, step) {
    var p = PT(tab), ms = qs(p, '.mission-step'), n = (MS[tab] || [])[step] || 0;
    for (var i = 0; i < ms.length; i++) ms[i].classList.toggle('scale-active', i === Math.min(n, ms.length - 1));
  }
  // 每個畫面要讓學生看到哪一段：{ k: 比對用的名稱, a/b: 範圍的頭尾元素, anchor: 放不下時對齊上緣（top）或下緣（bottom） }
  function viewOf(key, step) {
    if (!key) return null;
    var p = PT(key), H2 = qs(p, ':scope > h2'), NB = qs(p, ':scope > .note-box'), TW = qs(p, ':scope > .table-wrap'), notes = q1(p, '.v5-notes');
    function stg(id) {   // 重點是動畫：露出的範圍從畫布上緣開始（放不下時畫布一定整個在主屏內，狀態文字才被捨棄）
      var e = $(id); if (!e) return null;
      var cv = q1(e, '.v5-cv') || e, st = $(id.replace('-stage', '-status'));
      return { k: id, a: cv, b: st || cv, anchor: 'top' };
    }
    function rng(k, a, b) { return a ? { k: k, a: a, b: b || a, anchor: 'top' } : null; }
    if (key === 'tab1') {
      if (step <= 5) return stg('zm-stage');
      if (step === 6) return rng('t1-levels', H2[0], q1(p, '.levels'));
      if (step === 7) return rng('t1-cards', q1(p, '.grid-2c'));
      return rng('t1-notes', notes);
    }
    if (key === 'tab2') {
      if (step === 1) return rng('t2-text', H2[0], NB[0]);
      if (step <= 6) return stg('ly-stage');
      if (step === 7) return rng('t2-cards', H2[1], NB[NB.length - 1]);
      return rng('t2-notes', notes);
    }
    if (key === 'tab3') {
      if (step === 1) return rng('t3-text', H2[0], NB[0]);
      if (step <= 4) return stg('gx-stage');
      if (step === 5) return stg('gt-stage');
      return rng('t3-notes', notes);
    }
    if (key === 'tab4') {
      if (step <= 5) return stg('so-stage');   // 第 1 步也直接露出太陽系動畫（老師 2026-11-19：重點是動畫，不是文字）
      if (step === 6) return rng('t4-members', H2[1], TW[0]);
      if (step <= 11) return stg('mb-stage');
      if (step === 12) return rng('t4-table', q1(p, ':scope > h3'), TW[TW.length - 1]);
      return rng('t4-notes', notes);
    }
    if (key === 'tab5') {
      if (step === 1) return rng('t5-text', H2[0], NB[0]);
      if (step <= 3) return stg('rs-stage');
      if (step === 4) return rng('t5-lab', H2[1], q1(p, ':scope > .grid-2c') || TW[0]);
      if (step <= 8) return rng('t5-habit', H2[2], $('habit-status'));
      return rng('t5-notes', notes);
    }
    return null;
  }

  // 宇宙縮放：鏡頭 2 秒平滑飛到第 z 層（同頁面老師模式的 zmSet + zmGlide）
  function zmTo(z, anim) {
    var S = zoomState, z0 = S.z, t = 0;
    S.running = false; S.mode = 'forward'; S.teach = 'start'; S.teachOn = false; S.lastIdx = -1;
    function setZ(v) { S.z = v; S.play = v ? 'here' : 'start'; var r = $('zm-range'); if (r) r.value = Math.round(v * 100); }
    if (!anim || Math.abs(z0 - z) < 0.01) { drive = null; setZ(z); zmUI(); return; }
    setZ(z0); zmUI();
    drive = function (dt) { t += dt; var u = Math.min(1, t / 2); setZ(z0 + (z - z0) * zmSmooth(u)); if (u >= 1) { drive = null; zmUI(); } };
  }
  function lyShow(i, arrived) { lyPick(i); if (arrived) { lightState.p = 1; lightState.btn = 'again'; lyUI(); } else lyPlay(); }
  function soSt(f) { solarState.filter = f; solarState.running = true; solarState.last = 0; soUI(); }
  function mbSel(k) { MB.sel = k || null; mbUI(); }
  var MBK = { 7: null, 8: 'planet', 9: 'dwarf', 10: 'small', 11: 'moon' };
  var HABS = { 5: 0, 6: 1, 7: 3, 8: 2 };
  var SCENES = {
    tab1: function (step, anim, changedTab) {
      var z = step <= 5 ? step - 1 : 4;
      zmTo(z, anim && !changedTab && cur.tab === 'tab1');
    },
    tab2: function (step) {
      if (step === 1) lyPick(2);
      else if (step === 2) lyPick(0);
      else if (step === 3) lyShow(0, false);
      else if (step === 4) lyShow(1, false);
      else if (step === 5) lyShow(2, false);
      else lyShow(2, true);
    },
    tab3: function (step) { gxView(step === 3 ? 'side' : 'top'); },
    tab4: function (step) {
      if (step <= 2 || step === 5 || step === 6) { soSt('all'); mbSel(null); }
      else if (step === 3) { soSt('terrestrial'); mbSel(null); }
      else if (step === 4) { soSt('giant'); mbSel(null); }
      else if (step >= 7 && step <= 11) { soSt('all'); mbSel(MBK[step]); }
    },
    tab5: function (step) {
      if (step === 1) { rsMode('distance'); habitPick(2); }
      else if (step === 2) { rsMode('distance'); habitPick(2); }
      else if (step === 3 || step === 4) { rsMode('size'); habitPick(2); }
      else if (step <= 8) { rsMode('size'); habitPick(HABS[step]); }
      else { rsMode('size'); habitPick(2); }
    }
  };

  function sceneOf(tab, sub, stepNo, anim) {
    stepNo = stepNo || 1;
    if (anim === undefined) anim = true;
    var key = tab;
    var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
    var changedTab = false;
    if (btn && !btn.classList.contains('active')) { btn.click(); changedTab = true; }
    var prev = cur;                                            // 先記下「原本的畫面」，再比較：換了分頁或要露出的範圍，就捲過去
    var same = prev.tab === tab && prev.step === stepNo;
    drive = null;
    try {
      if (SCENES[key]) SCENES[key](stepNo, anim, changedTab, same);
    } catch (e) { if (window.console) console.warn('[有聲講解] 場景失敗', key, e); }
    markMs(tab, stepNo);
    cur = { tab: tab, sub: sub, step: stepNo };
    var nv = viewOf(key, stepNo), pv = prev.tab ? viewOf(prev.tab, prev.step) : null;
    if (prev.tab !== tab || prev.step !== stepNo) hlClear();   // 換畫面：上一個畫面的標記線收掉
    if (nv && (changedTab || !pv || pv.k !== nv.k)) bringIntoView(nv);
  }
  var goto = sceneOf;

  // 播放器自己推的動畫：只在播放中、而且本課第 5 分頁打開時推
  var lastMs = 0;
  function loop(ms) {
    var dt = lastMs ? Math.min(0.05, (ms - lastMs) / 1000) : 0; lastMs = ms;
    if (state === 'playing' && drive) { try { drive(dt); } catch (e) {} }
    requestAnimationFrame(loop);
  }

  // 語音開始時記下頁面原本各動畫的播放狀態；停止／結束時還原成頁面一進來的樣子（同老師講解模式的 RESET，學生操作不受影響）
  var runSaved = null, pauseSaved = null;
  function snapRun() { try { return { ly: lightState.running, lp: lightState.p, so: solarState.running }; } catch (e) { return null; } }
  function putRun(s) { // 同頁面老師模式的 THAW
    if (!s) return;
    try {
      if (s.ly) { lightState.p = s.lp; lightState.t0 = kNow() - s.lp * 2.5; lightState.running = true; }
      solarState.running = s.so; solarState.last = 0; lyUI(); soUI();
    } catch (e) {}
  }
  function freezeRun() { // 暫停：連畫面上的動畫一起凍住（同頁面老師模式的 FREEZE）
    pauseSaved = snapRun();
    try { lightState.running = false; solarState.running = false; lyUI(); soUI(); } catch (e) {}
  }
  function thawRun() { if (!pauseSaved) return; var s = pauseSaved; pauseSaved = null; putRun(s); }
  function restoreRun() {
    pauseSaved = null; drive = null; document.body.dataset.vxAway = '';
    if (runSaved) {
      runSaved = null;
      try { zmReset(); lyPick(2); soSt('all'); MB.sel = null; mbUI(); rsMode('distance'); habitPick(2); } catch (e) {}
      document.querySelectorAll('.panel').forEach(function (p) { p.querySelectorAll('.mission-step').forEach(function (s) { s.classList.remove('scale-active'); }); });
    }
  }

  // 把一段範圍（頭 top～尾 bot）捲到字幕框上方：放得下就置中；放不下就依 anchor 對齊上緣或下緣
  function visBottom() { // 字幕框（有釘選黃條時用黃條）的上緣
    var t = ui.panel.querySelector('.vx-bub').getBoundingClientRect().top;
    if (ui.pin.classList.contains('show')) t = Math.min(t, ui.pin.getBoundingClientRect().top);
    return t;
  }
  // 平滑捲動還在半路時，要用「捲動的目的地」判斷，不能用半路上的瞬間位置
  var goalY = null, goalT = 0;
  function scrollGoal(y) {
    goalY = Math.max(0, y); goalT = Date.now();
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
  }
  function bringIntoView(v) {
    var a = v && v.a, b = v && (v.b || a);
    if (!a || !b || !a.getBoundingClientRect) return;
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var base = (goalY != null && Date.now() - goalT < 900) ? goalY : window.pageYOffset;
    var dy = base - window.pageYOffset;
    var top = ra.top - dy, bot = Math.max(ra.bottom, rb.bottom) - dy;
    var panelTop = visBottom();
    if (top >= 56 && bot <= panelTop - 8) return;
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
  function textRect(root, re) { // 頁面文字裡符合 regex 的那一段（用 Range 量出它佔的方框；跨 <b> 也可以）
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
      var lines = [];
      Array.prototype.slice.call(rs).forEach(function (q) {
        if (q.width < 1) return;
        var L = lines[lines.length - 1];
        if (L && Math.abs(q.top - L.top) < q.height * 0.5) { L.left = Math.min(L.left, q.left); L.right = Math.max(L.right, q.right); L.bottom = Math.max(L.bottom, q.bottom); L.top = Math.min(L.top, q.top); }
        else lines.push({ left: q.left, right: q.right, top: q.top, bottom: q.bottom });
      });
      return lines.map(function (L) { return { left: L.left, top: L.top, width: L.right - L.left, height: L.bottom - L.top }; });
    };
  }
  // 螢光筆只框「字」本身：用文字範圍量（每行一個框、貼著字），不用整個區塊元素的外框（老師 2026-11-17：「只畫重點」）
  function ink(sel) { return function () { var r = typeof sel === 'function' ? sel() : document.querySelector(sel); return r ? textRect(r, /\S[\s\S]*\S|\S/)() : null; }; }
  function txt(root, re) { return function () { var r = typeof root === 'function' ? root() : document.querySelector(root); return textRect(r, re)(); }; }
  // 一列表格：每一格各框自己的字（不跨過格子之間的空白）
  function cells(rowFn) { return function () { var r = rowFn(), out = []; if (!r) return null; r.querySelectorAll('th,td').forEach(function (c) { var q = textRect(c, /\S[\s\S]*\S|\S/)(); if (q) out = out.concat(q); }); return out.length ? out : null; }; }
  function pn(i) { return function () { return panelEl(i); }; }
  function pq(i, sel, n) { return function () { var p = panelEl(i); return p ? (n == null ? p.querySelector(sel) : p.querySelectorAll(sel)[n]) : null; }; }
  var RECT = {
    // 分頁 1
    lv0: ink(pq(0, '.levels .lv', 0)), lv1: function () { var a = ink(pq(0, '.levels .ex', 1))(), b = ink(pq(0, '.levels .lv', 1))(); return [].concat(a || [], b || []); }, lv2: ink(pq(0, '.levels .lv', 2)),
    lv3: ink(pq(0, '.levels .lv', 3)), lv4: ink(pq(0, '.levels .lv', 4)),
    t1Star: txt(pq(0, '.grid-2c .card', 1), /可以自行發光、發熱/),
    t1Moon: txt(pq(0, '.grid-2c .card', 3), /月球本身不會發光，月光是反射的太陽光/),
    t1Gx: txt(pq(0, '.grid-2c .card', 0), /直徑約 ?10 ?萬光年，有超過千億顆像太陽一樣的恆星/),
    t1Band: txt(pq(0, '.v5-notes'), /橫跨天際的銀白色河流，正是我們身處的銀河系盤面/),
    t1Spot: txt(pq(0, '.v5-notes'), /黑子溫度較低，卻是太陽磁場較強的地方/),
    // 分頁 2
    lyDef: txt(pn(1), /光以光速行走一年的距離/), ly10: txt(pn(1), /約為 ?10 ?兆公里/),
    ly1: ink(pq(1, 'ul.plain li', 0)), ly2: ink(pq(1, 'ul.plain li', 1)), ly3: ink(pq(1, 'ul.plain li', 2)),
    ly640: txt(pq(1, ':scope > .note-box', 0), /約 ?640 ?年前發出的/),
    au1: txt(pq(1, '.grid-2c .card', 0), /地球到太陽的平均距離＝1 ?au/), au15: txt(pq(1, '.grid-2c .card', 0), /約 ?1\.5 ?億公里/),
    au30: txt(pq(1, '.grid-2c .card', 0), /海王星約 ?30 ?au/), lyUse: txt(pq(1, '.grid-2c .card', 1), /恆星之間更遙遠，所以用光年/), lyNear: txt(pq(1, '.grid-2c .card', 1), /離太陽最近的恆星比鄰星/),
    c30: txt(pq(1, '.v5-notes'), /光速約每秒 ?30 ?萬公里，是宇宙中最快的速度/), sun8: txt(pq(1, '.v5-notes'), /約 ?8 ?分 ?20 ?秒/),
    andro: txt(pq(1, '.v5-notes'), /約 ?250 ?萬光年：今晚看到它的光，是 ?250 ?萬年前出發的/),
    // 分頁 3
    t3Model: txt(pn(2), /俯視與側視圖，是根據觀測資料建立的科學模型/),
    gxArms: txt('#gx-status', /旋臂向內盤繞/), gxSun: txt('#gx-status', /距銀河系中心約 ?27,000 ?光年/),
    gxFlat: txt('#gx-status', /中央凸起的扁平盤狀/), gxWarp: txt('#gx-status', /外圍略為翹起扭曲/), gxBand: txt('#gx-status', /視線穿過大量恆星，就看到一條銀河光帶/),
    t3Types: txt(pn(2), /依照外觀，可以分成橢圓星系、螺旋星系和不規則星系/),
    t3Spiral: txt(pn(2), /銀河系和仙女座大星系都是螺旋星系；大麥哲倫星系是不規則星系/),
    t3Gaia: txt(pq(2, '.v5-notes'), /像一個被扭曲且不斷振動的洋芋片/), t3Bar: txt(pq(2, '.v5-notes'), /中央核球呈棒狀，是恆星與雲氣最密集處/),
    t3Orion: txt(pq(2, '.v5-notes'), /太陽系位於獵戶座臂上/),
    // 分頁 4
    t4Free: txt(pn(3), /不是整齊排隊，而是在廣闊空間中繞日運行/), t4Plane: txt(pn(3), /近乎相同的軌道面上繞太陽運行/),
    t4Ccw: txt('#so-stage', /八大行星一起逆時鐘公轉/),
    t4Born: txt(pn(3), /大約是在 ?46 ?億年前，由一團不斷旋轉的扁平狀雲氣所形成/),
    mbNotReal: txt('#mb-stage', /大小、距離都不是真實比例/),
    t4Form: txt(pn(3), /密度較大的物質在內圈形成類地行星，密度較小的物質則在外圍形成類木行星/),
    tbT: cells(function () { var t = qs(panelEl(3), ':scope > .table-wrap'); return t.length ? t[t.length - 1].querySelectorAll('tr')[1] : null; }),
    tbG: cells(function () { var t = qs(panelEl(3), ':scope > .table-wrap'); return t.length ? t[t.length - 1].querySelectorAll('tr')[2] : null; }),
    t4Eight: txt(pq(3, '.v5-notes'), /行星：僅有 ?8 ?顆/), t4Saturn: txt(pq(3, '.v5-notes'), /土星的密度只有水的 ?70%/),
    // 分頁 5
    t5NotReal: txt(pn(4), /一般太陽系圖片的行星大小與彼此距離並未依實際比例/),
    t5Ruler: txt(pn(4), /以 ?10 ?公分代表 ?1 ?au/), t5Circle: txt(pn(4), /直徑 ?1 ?公分的圓代表地球/),
    h0: txt('#habit-status', /水星距太陽最近，但氣體極稀薄，保溫能力差，因此晝夜溫差非常大/), h1: txt('#habit-status', /濃厚二氧化碳大氣造成強烈溫室效應/),
    h2: txt('#habit-status', /距太陽遠近適中，地表有大量液態水/), h2b: txt('#habit-status', /大氣層也能供應生命所需氣體/),
    h2c: txt('#habit-status', /地殼提供多樣棲地/), h2d: txt('#habit-status', /減少太空碎屑與輻射的威脅/), h3: txt('#habit-status', /大氣非常稀薄，平均表面溫度低/),
    rs30: txt('#rs-status', /30\.07 ?au/), rsJ: txt('#rs-status', /10\.97 ?倍/), rsS: txt('#rs-status', /9\.14 ?倍/), rsM: txt('#rs-status', /0\.38 ?倍/),
    zm0a: txt('#zm-status', /主要亮斑是許多不同距離的遙遠星系/), zm0: txt('#zm-status', /不是星系之間灑滿恆星/), zm0b: txt('#zm-status', /青色定位圈指出接下來要進入的銀河系/), zm1: txt('#zm-status', /扁平、中央較凸起的盤狀星系/),
    zm1b: txt('#zm-status', /定位圈標出太陽系所在區域/), zm2: txt('#zm-status', /八大行星繞它公轉/), zm3: txt('#zm-status', /旁邊繞行的月球是它的衛星/),
    zm4: txt('#zm-status', /宇宙 → 星系 → 恆星系統 → 行星 → 衛星/),
    ly1s: txt('#ly-status', /4\.3 ?年前/), ly2s: txt('#ly-status', /26 ?年前/), ly3s: txt('#ly-status', /640 ?年前/),
    soT: txt('#so-status', /主要由岩石與金屬構成，體積、質量較小，平均密度較大/), soG: txt('#so-status', /主要由氣體與液體構成，體積、質量較大，平均密度較小/),
    mb1: txt('#mb-status', /八大行星，呈圓球狀、以固定的軌道繞恆星/), mb2: txt('#mb-status', /質量較小。它也繞太陽運行，軌道比較扁、比較斜/),
    mb3: txt('#mb-status', /主要分布在火星與木星軌道間的小行星帶/), mb3b: txt('#mb-status', /彗尾總是背向太陽/), mb4: txt('#mb-status', /只有衛星是繞行星運行/),
    t5Mer: txt(pq(4, '.v5-notes'), /不到 ?88 ?天就繞太陽一周/), t5VenP: txt(pq(4, '.v5-notes'), /大氣壓力約為地球的 ?90 ?倍/),
    t5Olym: txt(pq(4, '.v5-notes'), /奧林帕斯山高約 ?27 ?公里/), t5Think: txt(pq(4, '.v5-notes'), /行星不會排成一直線、類木行星是流體、行星也不是完美的圓球/)
  };

  // 每句要畫的標記：{ 句號: [{ s: 從句子裡的哪幾個字開始, e: 到哪幾個字結束, k: RECT 的名稱 }] }；
  // 播放時用 s、e 在這句台詞裡的位置換算成音檔播放比例（0～1），唸到那裡才畫。
  var HLSPEC = {
    "09": [{ s: "每一個亮斑", e: "一整個星系", k: "zm0a" }, { s: "星系之間其實很空曠", e: "很空曠", k: "zm0" }],
    "11": [{ s: "定位圈", e: "我們的銀河系", k: "zm0b" }],
    "12": [{ s: "扁扁的盤狀", e: "不是一顆大圓球", k: "zm1" }],
    "14": [{ s: "定位圈標出來的", e: "太陽系所在的區域", k: "zm1b" }],
    "15": [{ s: "八大行星繞著它公轉", e: "公轉", k: "zm2" }],
    "18": [{ s: "旁邊繞著它轉的月球", e: "是它的衛星", k: "zm3" }],
    "20": [{ s: "宇宙、星系、恆星系統", e: "衛星", k: "zm4" }],
    "22": [{ s: "宇宙裡有許多星系", e: "許多星系", k: "lv0" }, { s: "銀河系只是", e: "其中一個", k: "lv1" }],
    "23": [{ s: "星系裡有很多恆星", e: "其中一顆", k: "lv2" }, { s: "繞著太陽轉的", e: "像地球", k: "lv3" }],
    "24": [{ s: "繞著行星轉的", e: "月球繞著地球", k: "lv4" }],
    "26": [{ s: "月球本身不會發光", e: "反射太陽的光", k: "t1Moon" }, { s: "能自己發光發熱", e: "才是恆星", k: "t1Star" }],
    "28": [{ s: "直徑大約十萬光年", e: "太陽一樣的恆星", k: "t1Gx" }],
    "29": [{ s: "銀白色的河", e: "銀河系盤面", k: "t1Band" }],
    "31": [{ s: "太陽黑子溫度比較低", e: "磁場比較強的地方", k: "t1Spot" }],
    "34": [{ s: "光年是距離", e: "那麼遠", k: "lyDef" }],
    "35": [{ s: "大約是十兆公里", e: "十兆公里", k: "ly10" }],
    "37": [{ s: "比鄰星約四點三光年", e: "比鄰星約四點三光年", k: "ly1" }, { s: "織女星約二十六光年", e: "織女星約二十六光年", k: "ly2" }],
    "38": [{ s: "參宿四更遠", e: "六百四十光年", k: "ly3" }, { s: "約六百四十年前", e: "發出的", k: "ly640" }],
    "42": [{ s: "要走約四點三年", e: "四點三年", k: "ly1s" }],
    "43": [{ s: "約二十六年", e: "二十六年", k: "ly2s" }],
    "44": [{ s: "約六百四十年", e: "六百四十年", k: "ly3s" }],
    "48": [{ s: "地球到太陽的平均距離", e: "一個天文單位", k: "au1" }],
    "49": [{ s: "大約是一點五億公里", e: "一點五億公里", k: "au15" }, { s: "海王星約在三十個天文單位", e: "三十個天文單位", k: "au30" }],
    "50": [{ s: "恆星之間更遙遠", e: "才改用光年", k: "lyUse" }, { s: "離太陽最近的恆星", e: "是比鄰星", k: "lyNear" }],
    "52": [{ s: "光速約每秒三十萬公里", e: "最快的速度", k: "c30" }],
    "53": [{ s: "約要八分二十秒", e: "八分二十秒", k: "sun8" }],
    "55": [{ s: "約兩百五十萬光年", e: "兩百五十萬年前出發的", k: "andro" }],
    "58": [{ s: "科學模型", e: "科學模型", k: "t3Model" }],
    "59": [{ s: "發亮的旋臂", e: "向內盤繞", k: "gxArms" }],
    "61": [{ s: "離銀河系中心約兩萬七千光年", e: "兩萬七千光年", k: "gxSun" }],
    "62": [{ s: "整體扁扁的", e: "像一個盤子", k: "gxFlat" }],
    "64": [{ s: "核球，比較凸起", e: "扭曲", k: "gxWarp" }],
    "66": [{ s: "視線穿過大量恆星", e: "一條光帶", k: "gxBand" }],
    "70": [{ s: "橢圓星系", e: "不規則星系", k: "t3Types" }],
    "71": [{ s: "銀河系和仙女座大星系", e: "不規則星系", k: "t3Spiral" }],
    "72": [{ s: "像一片被扭曲的洋芋片", e: "洋芋片", k: "t3Gaia" }],
    "74": [{ s: "是棒狀的", e: "最密集", k: "t3Bar" }, { s: "獵戶座臂", e: "獵戶座臂上", k: "t3Orion" }],
    "77": [{ s: "不是排隊", e: "繞著太陽跑", k: "t4Free" }],
    "78": [{ s: "差不多相同的軌道面上", e: "同一個方向公轉", k: "t4Plane" }],
    "79": [{ s: "八大行星都是逆時鐘公轉", e: "逆時鐘公轉", k: "t4Ccw" }],
    "82": [{ s: "岩石和金屬為主", e: "密度比較大", k: "soT" }],
    "84": [{ s: "氣體和液體為主", e: "密度比較小", k: "soG" }],
    "92": [{ s: "八大行星，呈圓球狀", e: "繞太陽", k: "mb1" }],
    "93": [{ s: "質量比較小", e: "也比較斜", k: "mb2" }],
    "94": [{ s: "小行星主要在火星與木星之間", e: "火星與木星之間", k: "mb3" }],
    "96": [{ s: "總是背向太陽", e: "背向太陽", k: "mb3b" }],
    "98": [{ s: "只有衛星是繞著行星", e: "繞著行星", k: "mb4" }],
    "87": [{ s: "大約四十六億年前", e: "扁平雲氣形成", k: "t4Born" }],
    "88": [{ s: "密度大的物質", e: "形成類木行星", k: "t4Form" }],
    "100": [{ s: "類地行星", e: "密度比較大", k: "tbT" }],
    "101": [{ s: "類木行星", e: "密度比較小", k: "tbG" }],
    "91": [{ s: "大小和距離都不是真實比例", e: "不是真實比例", k: "mbNotReal" }],
    "102": [{ s: "行星只有八顆", e: "只有八顆", k: "t4Eight" }],
    "104": [{ s: "土星的密度只有水的百分之七十", e: "百分之七十", k: "t4Saturn" }],
    "109": [{ s: "三十點零七個天文單位", e: "三十點零七個天文單位", k: "rs30" }],
    "113": [{ s: "十點九七倍", e: "十點九七倍", k: "rsJ" }, { s: "九點一四倍", e: "九點一四倍", k: "rsS" }, { s: "零點三八倍", e: "零點三八倍", k: "rsM" }],
    "107": [{ s: "把行星畫大、距離畫近", e: "距離畫近了", k: "t5NotReal" }],
    "117": [{ s: "十公分代表一個天文單位", e: "一個天文單位", k: "t5Ruler" }],
    "118": [{ s: "直徑一公分代表地球", e: "代表地球", k: "t5Circle" }],
    "121": [{ s: "水星離太陽最近", e: "晝夜溫差非常大", k: "h0" }],
    "122": [{ s: "濃厚的二氧化碳大氣", e: "強烈的溫室效應", k: "h1" }],
    "123": [{ s: "大氣又非常稀薄", e: "平均表面溫度很低", k: "h3" }],
    "124": [{ s: "距離適中", e: "有大量液態水", k: "h2" }, { s: "大氣也能供應", e: "生命需要的氣體", k: "h2b" }],
    "125": [{ s: "地殼還提供", e: "棲息環境", k: "h2c" }, { s: "大氣層也擋住", e: "碎屑和輻射", k: "h2d" }],
    "126": [{ s: "不到八十八天", e: "繞太陽一周", k: "t5Mer" }],
    "127": [{ s: "約是地球的九十倍", e: "九十倍", k: "t5VenP" }, { s: "奧林帕斯山高約二十七公里", e: "二十七公里", k: "t5Olym" }],
    "128": [{ s: "行星不會排成一直線", e: "完美的圓球", k: "t5Think" }]
  };
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
      // 「這一句還在唸」＝同一次播放（token）而且 Audio 還是這一句的音檔、還沒播完（只看 token 會讓下一句沿用同一個 Audio 時舊線重畫一次）
      var live = (my === token) && a.src === mySrc && !a.ended;
      if (!live && !hlExpire) hlExpire = Date.now() + 14000;
      if (hlExpire && Date.now() > hlExpire) { hlClear(); return; }
      var d = a.duration, ct = a.currentTime || 0;
      var f = !live ? 1 : ((d && isFinite(d) && d > 0) ? ct / d : ct / Math.max(1.5, it.text.length * SEC_PER_CHAR));
      hlSegs.forEach(function (g) {
        var r = null; try { r = g.sg.r(); } catch (e) {}
        var rs = !r ? [] : (Array.isArray(r) ? r : [r]);
        var p = Math.max(0, Math.min(1, (f - g.sg.a) / (g.sg.b - g.sg.a)));
        if (!rs.length || p <= 0) { g.els.forEach(function (e) { e.style.display = 'none'; }); return; }
        if (!g.seen) { // 標記處若被字幕框擋住或在畫面外，先把它捲到字幕框上方
          g.seen = 1;
          var pt = visBottom(), r0 = rs[0], rl = rs[rs.length - 1];
          if (rl.top + rl.height > pt - 12) { g.away = 1; scrollGoal(window.pageYOffset + (rl.top + rl.height) - (pt - 12)); }
          else if (r0.top < 56) { g.away = 1; scrollGoal(window.pageYOffset + r0.top - 70); }
          if (g.away) document.body.dataset.vxAway = '1';
        }
        // 切去畫完線，馬上拉回主畫面（老師 2026-11-19）：這一條畫完後 0.5 秒，若沒有別條正在畫，就把目前的主畫面（動畫）整個捲回來
        if (g.away && !g.back && p >= 0.98) {
          g.back = 1;
          setTimeout(function () {
            if (hlSegs.some(function (o) { return o.seen && o.p > 0 && o.p < 0.98; })) return;
            document.body.dataset.vxAway = '';
            var v = cur.tab ? viewOf(cur.tab, cur.step) : null; if (v) bringIntoView(v);
          }, 500);
        }
        g.p = p;
        var tot = 0; rs.forEach(function (q) { tot += q.width + 16; });
        var done = tot * p;
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
    return String(t || '').replace(/恩極/g, 'N極').replace(/艾斯極/g, 'S極');
  }

  function setPin(text) {
    text = (stage.pins && stage.pins[text]) || displayText(text);   // 釘選黃條的數字也轉阿拉伯數字（stage.pins）
    ui.pin.textContent = text || '';
    ui.pin.classList.toggle('show', !!text);
    if (text && cur.tab) bringIntoView(viewOf(cur.sub || cur.tab, cur.step));   // 釘選條出現後，畫面若被它擋到就再往上捲
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
        a.src = AUDIO_FALLBACK + encodeURIComponent(it.file) + AUDIO_VER;
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
    if ($('introScreen') && typeof dismissIntro === 'function') { try { dismissIntro(); } catch (e) {} }   // 開場封面還在就先收起
    if (!runSaved) runSaved = snapRun();
    pauseSaved = null;
    idx = 0; token++; state = 'playing'; setPin(''); progress(0); refresh();
    cur = { tab: null, sub: null, step: 0 }; // 從頭播：第一個畫面一定要捲到電路圖，不管上次停在哪
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
    freezeRun();
    if (audio && !audio.paused) audio.pause();
    if (timer) { waitLeft = Math.max(0, waitLeft - (Date.now() - waitStart)); clearWait(); }
    refresh();
  }

  function halt() {
    cancelAnimationFrame(raf);
    token++; clearWait(); waitDone = null; stopActs(); hlClear(); clearTimers(); pauseSaved = null;
    if (audio) { audio.onended = audio.onerror = null; try { audio.pause(); } catch (e) {} }
    audio = null;
  }

  function stop() {
    halt(); state = 'idle'; idx = 0; unfitWire(); restoreRun();
    setPin(''); progress(0);
    if (ui.sub) ui.sub.textContent = '按 ▶ 聽彥君老師與曉臻助教講解。';
    refresh();
  }

  function finish() {
    halt(); state = 'idle'; idx = 0; setPin(''); unfitWire(); restoreRun();
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
      items.forEach(function (i) { if (i.kind === 'line') LINE_TEXT[i.id] = i.text; });
      total = items.filter(function (i) { return i.kind === 'line'; }).length;
      if (!total) return;
      buildUI();
      requestAnimationFrame(loop);
    }).catch(function (e) {
      if (window.console) console.info('[有聲講解] 未啟用：', e && e.message);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

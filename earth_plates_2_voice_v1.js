/* earth_plates_2 有聲講解（外層加法）
 * 只做三件事：載入 manifest.json / stage.json、依序播放 manifest 裡的每一句音檔、依每句內容呼叫頁面原本的函式切換畫面。
 * 各分頁動畫在播放中是「受控」的：該站需要運轉的才運轉、需要定格的才定格；暫停時一起凍住；停止／結束時還原成開始前的播放狀態。
 * 不碰 Canvas/SVG、動畫、題庫；不改任何既有 js。載入失敗時整個功能隱藏，原頁面完全不受影響。
 * 音檔與網頁同一個網域（audio/earth_plates_2/mp3/）。
 */
(function () {
  'use strict';
  var MANIFEST_URL = 'audio/earth_plates_2/manifest.json';
  var STAGE_URL = 'audio/earth_plates_2/stage.json';
  // 音檔與網頁同一個網域（audio/earth_plates_2/mp3/）：iPad Safari 對 GitHub Release 的下載網址（octet-stream＋attachment）常常無法播放。
  var AUDIO_BASE = 'audio/earth_plates_2/mp3/';
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
      if (show && state === 'idle') start();   // 打開面板就自動開始播（這一下點擊就是瀏覽器要的「使用者操作」，不必再按 ▶）
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
  // 本課（earth_plates_2）頁面的分頁用 switchTab(idx)（按鈕 .tab-btn[data-tab=tab1…tab5]）。各畫面的狀態都呼叫頁面原本的全域函式與狀態
  // （glMode／glTaiwan、dvMode／DVS、sbMode／SBS、clSet／CLS、evMode），不改任何畫法與節奏。步驟對照（與 lessons/earth_plates_2.json 的 _note 相同）：
  //   tab1：步驟＝「圖層＋地球儀角度」（GL1 表）：1＝海陸・開場角度、2＝海陸・夏威夷、3＝海陸・大西洋、4＝板塊交界・大西洋（中洋脊）、
  //         5＝板塊交界・喜馬拉雅、6＝地震火山・喜馬拉雅、7＝地震火山・太平洋（環太平洋＋夏威夷）、8＝找臺灣（頁面 glTaiwan）
  //   tab2：1＝分離程度 0、2＝50、3＝100（皆海底擴張）、4＝冰島案例
  //   tab3：1～5＝隱沒帶 比密度、熱對流與靠近、看地震、看火山、實例安地斯（頁面會自己依時間換下一步，播放期間由播放器壓住，停在該步結尾）
  //   tab4：1＝擠壓 0、2＝35、3＝100、4＝100＋原始地表虛線
  //   tab5：1＝綜合圖、2＝聚焦地震、3＝聚焦火山、4＝聚焦交界
  var cur = { tab: null, sub: null, step: 0 };
  function $(id) { return document.getElementById(id); }
  var CVS = { tab1: 'glCanvas', tab2: 'dvCanvas', tab3: 'sbCanvas', tab4: 'clCanvas', tab5: 'evCanvas' };
  var drive = null;                       // 播放器自己推動的動畫（分離程度、擠壓程度慢慢變）；暫停時不推
  var sbVoice = false, sbFrozen = -1;     // 隱沒帶：播放期間壓住「自動換下一步」
  var SBN = ['dens', 'move', 'quake', 'volc', 'andes'];

  // 地球儀的鏡頭表（GLS.lon／lat＝畫面正中央的經緯度；d＝飛行秒數）。座標只選角度，不改頁面的畫法
  var HOME = [60, 12], HAWAII = [-157, 18], ATLANTIC = [-28, 10], HIMALAYA = [82, 28], PACIFIC = [-160, 10];
  var GL1 = [
    { mode: 'coast', to: HOME, d: 2.4 },        // 1 開場
    { mode: 'coast', to: HAWAII, d: 2.6 },      // 2 夏威夷（封面）
    { mode: 'coast', to: ATLANTIC, d: 2.4 },    // 3 真實的海陸：大西洋兩岸
    { mode: 'plates', to: ATLANTIC, d: 2.2 },   // 4 板塊交界：大西洋中洋脊在正中間
    { mode: 'plates', to: HIMALAYA, d: 2.2 },   // 5 喜馬拉雅那一條
    { mode: 'act', to: HIMALAYA, d: 2.2 },      // 6 打開地震與火山
    { mode: 'act', to: PACIFIC, d: 2.4 },       // 7 環太平洋一整圈＋夏威夷在正中間
    { mode: 'act', tw: true }                   // 8 找臺灣
  ];
  var glTo = HOME, glHold = null;               // glTo：目前要對準的角度；glHold：暫停時先收起的飛行
  function glAt(to) { var f = GLS.fly; if (f) return Math.abs(glNormLon(f.l0 + f.dl - to[0])) < 0.5 && Math.abs(f.p0 + f.dp - to[1]) < 0.5; return Math.abs(glNormLon(GLS.lon - to[0])) < 0.5 && Math.abs(GLS.lat - to[1]) < 0.5; }
  function glAim(to, d) { glTo = to; if (!glAt(to)) glFly(to, d); }   // 已經在那裡（或正飛往那裡）就不重飛
  function glFreeze() { if (GLS.fly) { glHold = { to: glTo, left: Math.max(0.5, (1 - GLS.fly.p) * GLS.fly.d) }; GLS.fly = null; } }
  function glThaw() { var h = glHold; glHold = null; if (h && !GLS.drag && cur.tab === 'tab1') glFly(h.to, h.left); }

  function chase(get, set, target, up, down) {   // 讓數值每秒以 up／down 的速度走向目標
    return function (dt) {
      var v = get();
      if (v < target) set(Math.min(target, v + up * dt)); else if (v > target) set(Math.max(target, v - down * dt));
    };
  }

  var SCENES = {
    tab1: function (step, anim) {
      var V = GL1[step - 1] || GL1[0];
      glTouch(); GLS.vl = GLS.vp = 0;
      if (V.tw) {                                                   // 找臺灣：照頁面的按鈕（glTaiwan 自己會飛 2.2 秒）
        if (!GLS.tw || !glAt(GL.TW)) { GLS.mode = V.mode; glTaiwan(); }
        glSetMode(V.mode); glUI();
        glTo = GL.TW;
      } else {
        GLS.tw = false; glMode(V.mode);
        glAim(V.to, V.d);
      }
      if (!anim) { GLS.fly = null; GLS.lon = glTo[0]; GLS.lat = glTo[1]; }   // 跳句／快轉：直接停在那句該有的角度，不從頭飛
    },
    tab2: function (step) {
      dvTouch();
      if (step === 4) { dvMode('ice'); return; }
      dvMode('ocean');
      var T = [0, 50, 100][step - 1];
      drive = chase(function () { return DVS.amt; }, function (v) { DVS.amt = v; dvUI(); }, T, 30, 60);
    },
    tab3: function (step) {
      sbMode(SBN[step - 1] || 'dens');
      sbVoice = true; sbFrozen = -1;
      drive = function () { var cap = SB_DUR[SBS.step] - 0.25; if (SBS.age > cap) SBS.age = cap; };
    },
    tab4: function (step) {
      clTouch(); CLS.ghost = step === 4; clUI();
      var T = [0, 35, 100, 100][step - 1];
      drive = chase(function () { return CLS.s; }, function (v) { clSet(v); }, T, 14, 40);
    },
    tab5: function (step) {
      evMode(['all', 'quake', 'volc', 'bound'][step - 1] || 'all');
    }
  };

  function viewOf(key, step) {
    if (!key) return null;
    var e = CVS[key] && $(CVS[key]);
    return e ? { k: CVS[key], a: e, b: e, anchor: 'top' } : null;
  }
  function clearTimers() { drive = null; }
  function unfitWire() {}

  function sceneOf(tab, sub, stepNo, anim) {
    stepNo = stepNo || 1;
    if (anim === undefined) anim = true;
    var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
    var changedTab = false;
    if (btn && !btn.classList.contains('active')) { btn.click(); changedTab = true; }
    var prev = cur;                                            // 先記下「原本的畫面」，再比較：換了分頁或要露出的範圍，就捲過去
    drive = null; sbVoice = false;
    try {
      if (SCENES[tab]) SCENES[tab](stepNo, anim, changedTab);
    } catch (e) { if (window.console) console.warn('[有聲講解] 場景失敗', tab, e); }
    cur = { tab: tab, sub: null, step: stepNo };
    var nv = viewOf(tab, stepNo), pv = viewOf(prev.tab, prev.step);
    if (nv && (changedTab || !pv || pv.k !== nv.k)) bringIntoView(nv);
  }
  var goto = sceneOf;

  // 播放器自己推的動畫：只在播放中推；隱沒帶的「自動換步驟」播放中壓住、暫停時整個凍住
  var lastMs = 0;
  function loop(ms) {
    var dt = lastMs ? Math.min(0.05, (ms - lastMs) / 1000) : 0; lastMs = ms;
    if (state === 'playing' && drive) { try { drive(dt); } catch (e) {} }
    if (sbVoice && state === 'paused') { if (sbFrozen < 0) sbFrozen = SBS.age; SBS.age = sbFrozen; }
    else sbFrozen = -1;
    requestAnimationFrame(loop);
  }

  // 還原成「剛進頁面」的樣子；暫停時凍住、繼續時還原
  var runSaved = null, pauseSaved = null;
  function snapRun() { return { on: 1 }; }
  function resetAll() {
    sbVoice = false;
    GLS.touched = false; GLS.auto = false; GLS.tw = false; GLS.fly = null; GLS.lon = 60; GLS.lat = 12; GLS.vl = GLS.vp = 0; glSetMode('coast'); glUI();
    DVS.touched = false; DVS.auto = false; DVS.play = false; DVS.mode = 'ocean'; DVS.amt = 45; dvUI();
    SBS.step = 0; SBS.age = 0; sbUI();
    CLS.touched = false; CLS.auto = false; CLS.ghost = false; CLS.s = 0; clUI();
    EVS.touched = false; EVS.auto = false; EVS.mode = 'all'; EVS.from = 'all'; EVS.p = 1; evUI();
    var ps = document.querySelectorAll('.panel');                          // 目前分頁照剛打開的樣子重新示範
    for (var i = 0; i < ps.length; i++) if (ps[i].classList.contains('active')) { var f = window[V5_PFX[i] + 'Enter']; if (typeof f === 'function') f(); }
  }
  function freezeRun() { pauseSaved = { on: 1 }; glFreeze(); }              // 暫停：地球儀的飛行也停在半路
  function thawRun() { pauseSaved = null; glThaw(); }
  function restoreRun() { pauseSaved = null; drive = null; runSaved = null; glHold = null; glTo = HOME; resetAll(); }

  // 把一段範圍（頭 top～尾 bot）捲到字幕框上方：放得下就置中；放不下就依 anchor 對齊上緣或下緣
  function bringIntoView(v) {
    var a = v && v.a, b = v && (v.b || a);
    if (!a || !b || !a.getBoundingClientRect) return;
    if (v.fit) v.fit();
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var top = ra.top, bot = Math.max(ra.bottom, rb.bottom);
    var panelTop = ui.panel.querySelector('.vx-bub').getBoundingClientRect().top;
    if (ui.pin.classList.contains('show')) panelTop = Math.min(panelTop, ui.pin.getBoundingClientRect().top);   // 黃色釘選條也算字幕框（十二宮晶片在畫布最下面，不能被它蓋住）
    if (top >= 56 && bot <= panelTop - 8) return; // 已完整在畫面內，不動
    var room = panelTop - 8 - 56 - (bot - top);
    var y;
    if (room >= 0) y = window.pageYOffset + top - 56 - room / 2;          // 放得下：置中於字幕框上方
    else if (v.anchor === 'bottom') y = window.pageYOffset + bot - (panelTop - 8); // 放不下：尾端貼齊字幕框
    else y = window.pageYOffset + top - 56;                                 // 放不下：頭端貼齊上緣
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
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
        if (c && c.tab !== cur.tab) goto(c.tab, c.sub, c.step);   // 已經在同一個分頁（本課第 1 句起就在 tab1）：不把畫面拉回第 1 步
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
    if (cur.tab && ui.pin.classList.contains('show')) bringIntoView(viewOf(cur.tab, cur.step));   // 字幕變兩行時字幕框會長高、黃條跟著往上：畫布被蓋到就再捲一次
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
        if (m && m[1] === '切頁') { var c = stage.cuts[m[2].trim()]; if (c && !(want && want.tab === c.tab)) want = { tab: c.tab, sub: c.sub, step: 1 }; pin = ''; }
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
    token++; clearWait(); waitDone = null; stopActs(); clearTimers(); pauseSaved = null; glHold = null;
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

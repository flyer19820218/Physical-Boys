/* organics_1 有聲講解（外層加法）
 * 只做三件事：載入 manifest.json / stage.json、依序播放 manifest 裡的每一句音檔、依每句內容呼叫頁面原本的函式切換畫面。
 * 不碰 Canvas/SVG、動畫、題庫；不改任何既有 js。載入失敗時整個功能隱藏，原頁面完全不受影響。
 * 音檔與網頁同一個網域（audio/organics_1/mp3/）。
 */
(function () {
  'use strict';
  var MANIFEST_URL = 'audio/organics_1/manifest.json';
  var STAGE_URL = 'audio/organics_1/stage.json';
  // 音檔與網頁同一個網域（audio/organics_1/mp3/）：iPad Safari 對 GitHub Release 的下載網址（octet-stream＋attachment）常常無法播放。
  var AUDIO_BASE = 'audio/organics_1/mp3/';
  var AUDIO_VER = '?v=20261127-v1'; // 重錄音檔時改這個版本號，避免瀏覽器播到舊的快取音檔
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
      if ((state === 'idle' && !(ui.panel && ui.panel.classList.contains('show'))) || !document.body.classList.contains('mode-teacher')) return;
      var sb = document.getElementById('mode-student'); if (sb) sb.click();
      if (cur.tab) goto(cur.tab, cur.sub, cur.step, false);
      var v = viewOf(cur.tab, cur.sub, cur.step); if (v) bringIntoView(v);   // 老師模式會自己捲動頁面，切回後再把畫面放回字幕框上方
      if (state === 'paused') { thaw(); freeze(); }   // 切回學生模式會重新開始動畫：暫停中要再凍一次
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // 換句時頭像圖片晚一點才載入、寬度改變，字幕會從兩行變三行，字幕框與黃條跟著長高（iPad 橫式就會蓋到畫布下緣）：
    // 面板大小一變就重新檢查畫面位置。
    if (window.ResizeObserver) new ResizeObserver(function () { if (state === 'playing') reView(); }).observe(ui.panel);
    else [ui.avL, ui.avR].forEach(function (im) { im.addEventListener('load', function () { if (state === 'playing') reView(); }); });
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
  // 本課（organics_1 有機物基礎與木材乾餾）：.tab-btn[data-tab] 切分頁、setSub(tab, sub) 切子頁、W5.go(子頁名, 步驟) 播某一步。
  // 播放中一律是學生模式（W5.mode='step'：播完一步就停），不改任何既有動畫、實驗台或題庫。
  // 12 個子頁各一支 W5 動畫（子頁名＝W5 動畫名），步驟 1～4＝動畫步驟鈕。
  // 動手做（W5Lab）：步驟編號 5 起＝實驗台的「絕對狀態」（掛在該分頁最後一個子頁），由 LABS 表照頁面原本的按鈕／滑桿操作；
  // 跳句（syncTo）時直接設到該狀態，自然播放時才「慢慢拉滑桿」（ramp）。
  var cur = { tab: null, sub: null, step: 0 };
  var ANIM = { urea: 1, except: 1, char: 1, distill: 1, products: 1, testc: 1, testh: 1, iso: 1, props: 1, smoke: 1, cuo: 1, cuso4: 1 };
  function $(id) { return document.getElementById(id); }
  function labRoot(key) { return $('lab-' + key); }
  function clickIn(key, sel) {   // 按實驗台裡的按鈕（找不到或停用就略過）
    var r = labRoot(key), b = r && r.querySelector(sel);
    if (b && !b.disabled) { b.click(); return true; }
    return false;
  }
  function slider(id) { return $(id); }
  function setSlider(el, v) {   // 改滑桿並送 input 事件（等同學生拖滑桿）
    if (!el || el.disabled) return;
    el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  // 慢慢拉滑桿：每 50 ms 走一點，暫停時停住；換句／跳句／停止時取消（token 改變）
  var ramps = [];
  function stopRamps() { ramps.forEach(function (r) { clearInterval(r); }); ramps = []; }
  function rampSlider(id, from, to, ms, done) {
    var el = slider(id); if (!el) return;
    var my = token, t = 0, n = Math.max(1, Math.round(ms / 50));
    setSlider(el, from);
    var h = setInterval(function () {
      if (my !== token) { clearInterval(h); return; }
      if (state === 'paused') return;
      t++;
      setSlider(el, Math.round(from + (to - from) * Math.min(1, t / n)));
      if (t >= n) { clearInterval(h); if (done) done(); }
    }, 50);
    ramps.push(h);
  }
  function W5L(key) { return window.W5Lab && W5Lab[key]; }

  // 本課 5 個實驗台都用 window.W5Lab[key] 的 set／addTo／press 直接設「絕對狀態」（跳句也得到同樣畫面）；自然播放時 ramp 才慢慢變化。
  function rampFn(from, to, ms, fn) {   // 每 50 ms 走一點；暫停時停住；換句／跳句／停止時取消（token 改變）
    var my = token, t = 0, n = Math.max(1, Math.round(ms / 50));
    fn(from);
    var h = setInterval(function () {
      if (my !== token) { clearInterval(h); return; }
      if (state === 'paused') return;
      t++;
      fn(from + (to - from) * Math.min(1, t / n));
      if (t >= n) clearInterval(h);
    }, 50);
    ramps.push(h);
  }
  function later(ms, fn) {   // 自然播放時延遲做；暫停時不倒數；換句／跳句／停止時取消
    var my = token, t = 0, n = Math.max(1, Math.round(ms / 50));
    var h = setInterval(function () {
      if (my !== token) { clearInterval(h); return; }
      if (state === 'paused') return;
      t++;
      if (t >= n) { clearInterval(h); fn(); }
    }, 50);
    ramps.push(h);
  }
  // 本課 5 個實驗台（每個掛在該分頁「講到它的那個子頁」，步驟 5 起＝實驗台的絕對狀態）；LABS 以「掛載子頁名」為鍵。
  // 實驗台檔都有 S.run(動作名, instant)：一個動作＝一段 seq 動畫（seq.busy＝還在播）。播放器用 drive() 把實驗台「往目標狀態推」：
  //   自然播放（live）＝每 50 ms 看一次，實驗台忙就等、不忙就現場做下一個還沒做的動作（一個接一個，可以跨句、跨＊停）；
  //   跳句（live=false）＝把正在播的那一段與其餘動作都瞬間做完。目標比現在「少」（倒退）就先重來再做。
  //   「現在做到第幾個」一律由實驗台自己的旗標算（haveFn），不靠播放器記帳，所以跳句、學生自己按過都不會亂。
  // sort（tab1，掛 except）：5＝全部在桌上；6＝尿素放進有機物；7＝再放二氧化碳進無機物；8＝示範拖錯：甲烷拖進無機物 → 彈回並說明
  // heat（tab2，掛 char）：5＝預設；6＝戴護目鏡＋點燃酒精燈；7＝按「我猜：砂糖、麵粉變黑」；8＝加熱砂糖（麵粉、食鹽留給學生）
  // wood（tab2，掛 products；鋁箔包竹筷乾餾）：5＝預設；6＝戴護目鏡；7＝鋁箔包覆→點燈加熱→點燃氣體→打開看產物（一個接一個現場播，約 24 秒）
  // candle（tab3，掛 testh；酒精在蒸發皿裡燃燒）：照旁白「點燃酒精，先倒扣冷燒杯…」的順序：5＝預設；6＝點燃酒精；7＝倒扣冷燒杯（起霧、水珠）；8＝試紙碰水珠
  //   （之後「拿開燒杯」「倒扣石灰水燒杯」留給學生：＊停 10 秒放不下，見回報）
  // model（tab4，掛 props）：5＝原子散開；6＝乙醇；7＝甲醚；8＝甲醚＋示範拖曳轉動
  function labBtn(key, id) { return clickIn(key, '#' + key + 'Btn_' + id); }
  function drive(key, order, haveFn, k, live) {
    var Lb = W5L(key); if (!Lb) return;
    var S = Lb.S;
    if (haveFn(S) > k) { S.seq.run([]); S.reset(); }
    if (!live) {
      for (var g = 0; g < 24 && (S.seq.busy || haveFn(S) < k); g++) S.run(order[Math.min(order.length - 1, haveFn(S))], true);
      Lb.request(); return;
    }
    var my = token, last = -1, tries = 0;
    var h = setInterval(function () {
      if (my !== token) { clearInterval(h); return; }
      if (state === 'paused' || S.seq.busy) return;
      var have = haveFn(S);
      if (have >= k) { clearInterval(h); return; }
      if (have === last && ++tries > 3) { clearInterval(h); return; }   // 動作沒被接受（前置條件不符）：不要一直試
      if (have !== last) tries = 0;
      last = have;
      S.run(order[have], false); Lb.request();
    }, 50);
    ramps.push(h);
  }
  var HEAT_ORDER = ['gog', 'light', 'sugar', 'flour', 'salt', 'cmp'];
  function heatHave(S) { return S.cmpDone ? 6 : S.done[2] ? 5 : S.done[1] ? 4 : S.done[0] ? 3 : S.lampOn ? 2 : S.gogOn ? 1 : 0; }
  var WOOD_ORDER = ['gog', 'wrap', 'heat', 'ignite', 'open'];
  function woodHave(S) { return S.openDone ? 5 : S.ignDone ? 4 : S.heatDone ? 3 : S.wrapDone ? 2 : S.gogOn ? 1 : 0; }
  var CANDLE_ORDER = ['light', 'cold', 'strip', 'away', 'lime'];
  function candleHave(S) { return S.limeDone ? 5 : S.awayDone ? 4 : S.stripDone ? 3 : S.coldDone ? 2 : S.lit_on ? 1 : 0; }
  window.__vxLabHave = { heat: heatHave, wood: woodHave, candle: candleHave };   // 逐句模擬用（同一套算法）
  var SORT_HOME = { urea: [190, 128], ch4: [480, 128], etoh: [770, 128], co2: [190, 208], caco3: [480, 208], kcn: [770, 208] };
  function sortWrong(S, Lb, id, live) {   // 示範拖錯：把一個有機物拖進「無機物」框 → 實驗台自己判斷、彈回、結果框寫原因
    var ch = S.chips.filter(function (c) { return c.it.id === id && c.st === 'home'; })[0]; if (!ch) return;
    if (!live) { S.wrong = Math.max(S.wrong, 1); S.tries++; S.msg = { ok: false, id: id, bin: 'inorg' }; Lb.request(); return; }
    var x0 = ch.x, y0 = ch.y, x1 = 700, y1 = 392;
    ch.st = 'drag'; S.drag = { ch: ch, dx: 0, dy: 0 };
    rampFn(0, 1, 1100, function (k) {
      if (S.drag && S.drag.ch === ch) { var e = k * k * (3 - 2 * k); ch.x = x0 + (x1 - x0) * e; ch.y = y0 + (y1 - y0) * e - Math.sin(Math.PI * e) * 40; Lb.request(); }
      if (k >= 1 && S.drag && S.drag.ch === ch) {   // 放開：送一個 pointerup 給畫布，讓實驗台自己的程式判斷對錯（不改實驗台）
        var cv = $('sortLabCanvas'), ev;
        try { ev = new PointerEvent('pointerup', { bubbles: true, clientX: 0, clientY: 0, pointerId: 1 }); } catch (e) { ev = new Event('pointerup', { bubbles: true }); }
        if (cv) cv.dispatchEvent(ev);
        Lb.request();
      }
    });
  }
  var LABS = {
    except: { tab: 'tab1', key: 'sort', states: { 5: { ids: [] }, 6: { ids: ['urea'] }, 7: { ids: ['urea', 'co2'] }, 8: { ids: ['urea', 'co2'], wrong: 'ch4' } },
      reset: function () { var Lb = W5L('sort'); if (Lb) { Lb.S.reset(); Lb.request(); } },
      apply: function (st, live) {
        var Lb = W5L('sort'); if (!Lb) return;
        var S = Lb.S, placed = S.chips.filter(function (c) { return c.st === 'placed'; }).map(function (c) { return c.it.id; });
        if (placed.length > st.ids.length || placed.some(function (id) { return st.ids.indexOf(id) < 0; }) || (!st.wrong && S.wrong)) { S.reset(); placed = []; }
        st.ids.forEach(function (id) { if (placed.indexOf(id) < 0) S.place(id); });   // 放好的那一個會自己滑進格子（實驗台的動畫）
        if (st.wrong && !S.wrong) sortWrong(S, Lb, st.wrong, live);
        Lb.request();
      } },
    char: { tab: 'tab2', key: 'heat', states: { 5: { k: 0 }, 6: { k: 2 }, 7: { k: 2, guess: 'two' }, 8: { k: 3, guess: 'two' } },
      reset: function () { var Lb = W5L('heat'); if (Lb) { Lb.S.seq.run([]); Lb.S.reset(); Lb.request(); } },
      apply: function (st, live) {
        var Lb = W5L('heat'); if (!Lb) return;
        drive('heat', HEAT_ORDER, heatHave, st.k, live);
        var S = Lb.S;
        if (st.guess && S.guess !== st.guess) { if (!(live && labBtn('heat', 'g_' + st.guess))) S.guess = st.guess; }
        else if (!st.guess && S.guess) S.guess = null;
        Lb.request();
      } },
    products: { tab: 'tab2', key: 'wood', states: { 5: { k: 0 }, 6: { k: 1 }, 7: { k: 5 } },
      reset: function () { var Lb = W5L('wood'); if (Lb) { Lb.S.seq.run([]); Lb.S.reset(); Lb.request(); } },
      apply: function (st, live) { drive('wood', WOOD_ORDER, woodHave, st.k, live); } },
    testh: { tab: 'tab3', key: 'candle', states: { 5: { k: 0 }, 6: { k: 1 }, 7: { k: 2 }, 8: { k: 3 } },
      reset: function () { var Lb = W5L('candle'); if (Lb) { Lb.S.seq.run([]); Lb.S.reset(); Lb.request(); } },
      apply: function (st, live) { drive('candle', CANDLE_ORDER, candleHave, st.k, live); } },
    props: { tab: 'tab4', key: 'model', states: { 5: { m: 'apart' }, 6: { m: 'eth' }, 7: { m: 'dme' }, 8: { m: 'dme', spin: true } },
      reset: function () { var Lb = W5L('model'); if (Lb) { var S = Lb.S; S.mode = 'apart'; S.from = 'apart'; S.p = 1; S.cur = null; S.drag = null; Lb.request(); } },
      apply: function (st, live) {
        var Lb = W5L('model'); if (!Lb) return; var S = Lb.S;
        function spin() {   // 示範「用手指拖曳轉動」：慢慢轉 1.6 弧度（等同學生拖動畫布）
          if (!st.spin) return;
          var y0 = S.yaw, p0 = S.pitch;
          if (live) rampFn(0, 1, 2600, function (k) { var e = k * k * (3 - 2 * k); S.yaw = y0 + 1.6 * e; S.pitch = p0 + Math.sin(Math.PI * e) * 0.35; S.idle = 0; Lb.request(); });
        }
        if (!live || S.mode === st.m && S.p >= 1) {
          if (S.mode !== st.m) { S.mode = st.m; S.from = st.m; S.p = 1; S.cur = null; }
          Lb.request(); spin(); return;
        }
        var my = token, h = setInterval(function () {   // 上一個分子還在飛：等它接好再按下一個
          if (my !== token) { clearInterval(h); return; }
          if (state === 'paused' || S.p < 1) return;
          clearInterval(h);
          if (S.mode !== st.m && !labBtn('model', st.m)) { S.mode = st.m; S.from = st.m; S.p = 1; S.cur = null; }
          Lb.request(); spin();
        }, 50);
        ramps.push(h);
      } }
  };
  var labCur = {};   // 掛載子頁 → 目前套用的動手做步驟編號；沒有＝預設狀態
  function isLabStep(tab, sub, stepNo) { var L = LABS[sub]; return !!(L && L.tab === tab && stepNo >= 5 && L.states[stepNo] != null); }
  function labTo(sub, stepNo, live) {
    var L = LABS[sub], prev = labCur[sub];
    if (prev === stepNo) return;
    stopRamps();
    try { L.apply(L.states[stepNo], live, prev); } catch (e) { if (window.console) console.warn('[有聲講解] 動手做失敗', sub, stepNo, e); }
    labCur[sub] = stepNo;
  }
  function labResetAll() {   // 停止／結束／重新開始：全部動手做還原成預設（學生玩過的也還原）
    stopRamps();
    Object.keys(LABS).forEach(function (sub) {
      if (!W5L(LABS[sub].key)) return;
      try { LABS[sub].reset(); } catch (e) {}
    });
    labCur = {};
  }
  // 每個畫面要讓學生看到哪一段：動畫畫布（整個 .stage-container）；動手做＝畫布＋結果框
  function viewOf(tab, sub, step) {
    if (!tab) return null;
    if (isLabStep(tab, sub, step || 1)) {
      var key = LABS[sub].key, lab = labRoot(key);
      if (lab) { var cw = lab.querySelector('.canvas-wrap') || lab.querySelector('.friction-canvas-shell') || lab; return { k: 'lab-' + key, topEl: cw, botEl: null, fit: cw, pad: FIX_PAD, anchor: 'top' }; }   // 老師 2026-11-26：重點是畫布，結果框、按鈕、說明被字幕框蓋掉沒關係；畫布放不下就整張縮小
    }
    if (!sub) return null;
    var cv = $('cvs-' + sub);
    if (cv) { var p = cv.parentElement, ce = p && /stage-container/.test(p.className) ? p : cv; return { k: sub, topEl: ce, fit: ce, pad: FIX_PAD, anchor: 'top' }; }
    return null;
  }
  var sceneTimer = 0;
  function sceneOf(tab, sub, stepNo, anim) {
    stepNo = stepNo || 1;
    if (anim === undefined) anim = true;
    if (window.W5) W5.mode = 'step';
    var changedTab = false;
    var intro = $('introScreen'); if (intro && window.dismissIntro) { try { dismissIntro(); } catch (e) {} }
    var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
    if (btn && !btn.classList.contains('active')) { btn.click(); changedTab = true; }
    try {
      var subChanged = false;
      if (sub && typeof CUR_SUB !== 'undefined' && (CUR_SUB[tab] !== sub)) { window.setSub(tab, sub); subChanged = true; }
      else if (sub && changedTab) { window.setSub(tab, sub); subChanged = true; }
      if (isLabStep(tab, sub, stepNo)) labTo(sub, stepNo, anim);
      else if (sub && ANIM[sub] && window.W5 && (stepNo > 1 || (!subChanged && !changedTab))) W5.go(sub, stepNo);
    } catch (e) { if (window.console) console.warn('[有聲講解] 場景失敗', tab, sub, stepNo, e); }
    var prev = cur;
    cur = { tab: tab, sub: sub, step: stepNo };
    var nv = viewOf(tab, sub, stepNo), pv = viewOf(prev.tab, prev.sub, prev.step);
    if (nv && (changedTab || !pv || pv.k !== nv.k)) {
      bringIntoView(nv);
      // 換分頁後版面（實驗台結果框高度、字型）稍晚才定：0.45 秒後再確認一次（新的一次會取消舊的，避免蓋掉後來的捲動）
      clearTimeout(sceneTimer);
      sceneTimer = setTimeout(function () { if (state !== 'idle' && cur.tab === tab && cur.step === stepNo) reView(); }, 450);
    }
  }

  var goto = sceneOf;

  // 把一段範圍（頭 topEl～尾 botEl）捲到字幕框上方：放得下就置中；放不下就依 anchor 對齊上緣或下緣
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
  // 捲動規則（2026-11-25 依 iPad 橫式 1180×820、桌機 1280×900 截圖調整）：
  // ① 動畫畫布（578 px 高，最上面 32 px 是進度條）：放得下就置中於「上緣 56」與「字幕框／黃條」之間；
  //    iPad 橫式字幕三行＋黃條時黃條上緣約 616 px，留 56 放不下 → 改成畫布下緣貼齊黃條（上緣讓到 30 左右，
  //    左上／右上的固定按鈕只蓋到進度條）。
  // ② 動手做（畫布 552＋結果框 100～140）：畫布最上面就是標題列（例：「兩條並聯」「③磁鐵｜超距力」），
  //    上緣要讓開右上角固定的「Language」切換鈕（底在 85 px）→ 上緣至少 88（pad）。畫布＋結果框放得下就置中；
  //    放不下就只保住畫布（core）：畫布上緣對齊 88，結果框露出多少算多少；連畫布都放不下（iPad）就畫布下緣貼齊黃條。
  var TOP_PAD = 56, BOT_PAD = 6;
  // 左上「首頁／返回」、右上「Language」固定鈕的底約在 85 px（organics_1 2026-11-28 iPad 1180×820 實測）：畫布上緣一律讓到 FIX_PAD 之下，放不下就縮畫布
  var FIX_PAD = 92;
  // 畫布整張必須在字幕框上方的主畫面裡（老師 2026-11-26 第 N 次強調）：放不下就用 CSS 把畫布外框縮小（置中），播完／停止還原。
  var fitted = [];
  function unfitAll(except) {
    fitted = fitted.filter(function (e) {
      if (e === except) return true;
      e.style.maxWidth = ''; e.style.marginLeft = ''; e.style.marginRight = ''; return false;
    });
  }
  function fitView(v) {
    var e = v && v.fit; unfitAll(e);
    if (!e || !e.getBoundingClientRect) return;
    e.style.maxWidth = ''; e.style.marginLeft = ''; e.style.marginRight = '';   // 先量自然大小（同一個執行回合內還原再縮，不會閃）
    var avail = visBottom() - BOT_PAD - (v.pad || TOP_PAD), r = e.getBoundingClientRect();
    if (avail < 200 || r.height <= avail) return;
    e.style.maxWidth = Math.floor(r.width * avail / r.height) + 'px'; e.style.marginLeft = 'auto'; e.style.marginRight = 'auto';
    if (fitted.indexOf(e) < 0) fitted.push(e);
  }
  function bringIntoView(v) {
    fitView(v);
    var a = v && v.topEl, b = v && (v.botEl || a);
    if (!a || !b || !a.getBoundingClientRect) return;
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var base = (goalY != null && Date.now() - goalT < 900) ? goalY : window.pageYOffset;
    var dy = base - window.pageYOffset;
    var top = ra.top - dy, bot = Math.max(ra.bottom, rb.bottom) - dy;
    var limit = visBottom() - BOT_PAD, pad = v.pad || TOP_PAD;
    var y = null, okTop, okBot;
    if (bot - top <= limit - pad) {                       // 整段放得下：置中
      okTop = pad; okBot = limit;
      if (!(top >= okTop && bot <= okBot)) y = base + top - pad - (limit - pad - (bot - top)) / 2;
    } else if (v.core && v.core.getBoundingClientRect) {   // 動手做：整段放不下，只保住畫布
      var rc = v.core.getBoundingClientRect(), ct = rc.top - dy, cb = rc.bottom - dy;
      if (cb - ct <= limit - pad) { if (Math.abs(ct - pad) > 3) y = base + ct - pad; }          // 畫布上緣對齊 pad，結果框露出一部分
      else if (!(ct >= Math.max(0, limit - (cb - ct) - 24) && cb <= limit)) y = base + cb - limit; // 畫布下緣貼齊黃條
    } else if (bot - top <= limit) {                      // 動畫畫布：上緣留 56 放不下 → 下緣貼齊黃條／字幕框
      if (!(top >= Math.max(0, limit - (bot - top) - 24) && bot <= limit)) y = base + bot - limit;
    } else {                                               // 怎樣都放不下
      y = v.anchor === 'bottom' ? base + bot - limit : base + top - 8;
      if (Math.abs(y - base) < 4) y = null;
    }
    if (y != null) scrollGoal(y);
  }
  function reView() {   // 字幕換句（行數變了）或黃條出現後，畫面若被蓋到就再捲一點
    if (!cur.tab || state === 'idle') return;
    var v = viewOf(cur.tab, cur.sub, cur.step); if (v) bringIntoView(v);
  }

  // ─── 暫停：把 W5 動畫與動手做實驗台一起凍住（W5.pause；實驗台沒有暫停旗標，用 deactivate 停掉它的 RAF，繼續時 activate）───
  // 例外：推箱子實戰的 deactivate 會把「自動加推力」關掉（繼續時接不回去），所以暫停時讓它繼續跑；
  // 三維實驗室沒有 RAF（靜止時不畫），示範拉動由播放器自己的計時器做，暫停時計時器會停住（rampSlider／pull3d）。
  var frozen = null;   // { w5: 動畫名或 null, lab: 實驗台名或 null }
  function freeze() {
    if (frozen) return;
    frozen = { w5: null, lab: null };
    try {
      var a = cur.sub && ANIM[cur.sub] ? cur.sub : null;
      if (a && window.W5 && W5.info(a) && W5.info(a).running && !W5.isPaused(a)) { W5.pause(a); frozen.w5 = a; }   // 這一步已經播完（本來就停住）的不碰
      var L = cur.sub && cur.step >= 5 && LABS[cur.sub];
      if (L && window.W5Lab && W5Lab[L.key] && W5Lab[L.key]._state().on) { W5Lab[L.key].deactivate(); frozen.lab = L.key; }
    } catch (e) { if (window.console) console.warn('[有聲講解] 凍結失敗', e); }
  }
  function thaw() {
    var f = frozen; frozen = null;
    if (!f) return;
    try {
      if (f.w5 && window.W5) W5.resume(f.w5);
      if (f.lab && window.W5Lab && W5Lab[f.lab]) W5Lab[f.lab].activate();
    } catch (e) { if (window.console) console.warn('[有聲講解] 解凍失敗', e); }
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
    if (text) reView();   // 黃條出現會擋住畫面下緣：需要時再往上捲一點
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
    reView();   // 字幕由兩行變三行時字幕框會長高（iPad 橫式），畫布下緣可能被蓋住
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
      state = 'playing'; refresh(); thaw();
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
    idx = 0; token++; state = 'playing'; setPin(''); progress(0); refresh();
    labResetAll();                           // 動手做先還原成預設（學生可能玩過）
    cur = { tab: null, sub: null, step: 0 }; // 從頭播：第一個畫面一定要捲到動畫，不管上次停在哪
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
        else if (m && m[1] === '釘選') pin = (stage.pins && stage.pins[m[2].trim()]) || m[2].trim();
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
    freeze();
    if (timer) { waitLeft = Math.max(0, waitLeft - (Date.now() - waitStart)); clearWait(); }
    refresh();
  }

  function halt() {
    cancelAnimationFrame(raf);
    token++; clearWait(); waitDone = null; stopActs(); stopRamps(); thaw();
    if (audio) { audio.onended = audio.onerror = null; try { audio.pause(); } catch (e) {} }
    audio = null;
  }

  function stop() {
    halt(); state = 'idle'; idx = 0;
    labResetAll();   // 停止：動手做還原成預設
    unfitAll();      // 畫布縮小的還原
    setPin(''); progress(0);
    if (ui.sub) ui.sub.textContent = '按 ▶ 聽彥君老師與曉臻助教講解。';
    refresh();
  }

  function finish() {
    halt(); state = 'idle'; idx = 0; setPin('');
    labResetAll();
    unfitAll();
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

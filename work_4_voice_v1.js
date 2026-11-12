/* work_4 有聲講解（外層加法）
 * 只做三件事：載入 manifest.json / stage.json、依序播放 manifest 裡的每一句音檔、依每句內容呼叫頁面原本的函式切換畫面。
 * 不碰 Canvas/SVG、動畫、題庫；不改任何既有 js。載入失敗時整個功能隱藏，原頁面完全不受影響。
 * 音檔與網頁同一個網域（audio/work_4/mp3/）。
 */
(function () {
  'use strict';
  var MANIFEST_URL = 'audio/work_4/manifest.json';
  var STAGE_URL = 'audio/work_4/stage.json';
  // 音檔與網頁同一個網域（audio/work_4/mp3/）：iPad Safari 對 GitHub Release 的下載網址（octet-stream＋attachment）常常無法播放。
  var AUDIO_BASE = 'audio/work_4/mp3/';
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
  // 本課（work_4）用 switchTab(tab, btn)＋data-tab 控制分頁，沒有子頁；畫面全靠「設滑桿＋點原本按鈕」，不改任何既有程式。
  // 步驟對照（與 lessons/work_4.json 的 _note 相同）：
  //   tab1：1＝五十牛頓四公尺，2＝一百牛頓兩公尺，3＝二十牛頓十公尺，4＝黑板重點（捲到 note-text）
  //   tab2：1＝預設，2＝施力臂四十五，3＝施力臂十五，4＝抗力臂三，5＝三類槓桿表（捲到 note-text）
  //   tab3：1＝輪上施力，2＝軸上施力，3～8＝削鉛筆機／水龍頭／門把／螺絲起子／方向盤／擀麵棍竹蜻蜓，9＝滑輪
  //   tab4：1＝斜面靜態，2＝沿斜面推，3＝直接抬，4＝緩斜面推，5＝螺旋靜態，6＝螺旋捲動，7＝樓梯與盤山公路
  //   tab5：1～5＝第 n 題先猜（前面已公布），6～10＝公布第 n 題
  var cur = { tab: null, sub: null, step: 0 };
  function $(id) { return document.getElementById(id); }
  function sl(id, v) { var e = $(id); if (!e) return; e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }
  function pb(prefix) { var b = document.querySelector('button[onclick^="' + prefix + '"]'); if (b) b.click(); }
  function clearTimers() {}
  function unfitWire() {}
  function lever(eff, res, f) { sl('rng-eff', eff); sl('rng-res', res); sl('rng-res-f', f); try { animTime = 0; } catch (e) {} }
  function wheel(fp, item) { pb("setTab3Mode('wheel'"); pb("setForcePoint('" + fp + "'"); pb("setWheelItem('" + item + "'"); try { animTime = 0; } catch (e) {} }
  function incline(L, h) { pb("setTab4Mode('inclined'"); sl('rng-inc-l', L); sl('rng-inc-h', h); pb("startInclineAction('reset')"); }
  function revealQ4(n) {
    var q = QUIZ4[n - 1], fb = $(q.id + 'fb'); if (!fb) return;
    fb.className = 'quiz-fb show ok';
    fb.innerHTML = tr('✔ 正確答案是 <b>' + 'ABCD'[q.ans] + '</b>', '✔ The answer is <b>' + 'ABCD'[q.ans] + '</b>') + '<br>' + tr(q.fzh, q.fen);
  }
  function hideQ4(n) { var fb = $(QUIZ4[n - 1].id + 'fb'); if (!fb) return; fb.className = 'quiz-fb'; fb.innerHTML = ''; }
  function quizItem(n) { return document.querySelectorAll('.quiz-item')[n - 1] || null; }
  var ITEM = ['pencil', 'pencil', 'pencil', 'faucet', 'doorknob', 'screwdriver', 'wheel', 'copter'];
  // 每個畫面要讓學生看到哪一段：{ k: 比對用的名稱, top/topEl: 範圍的頭, anchor: 放不下時對齊上緣（top）或下緣（bottom） }
  function viewOf(key, step) {
    if (!key) return null;
    var stage = document.querySelector('.stage-container');
    if (key === 'tab1') return step === 4 ? { k: 'note', topEl: $('note-text') } : { k: 'stage', topEl: stage };
    if (key === 'tab2') return step === 5 ? { k: 'note', topEl: $('note-text') } : { k: 'stage', topEl: stage };
    if (key === 'tab3' || key === 'tab4') return { k: 'stage', topEl: stage };
    if (key === 'tab5') {
      var n = step > 5 ? step - 5 : step;
      return { k: 'q' + n + (step > 5 ? ':ans' : ''), topEl: quizItem(n), anchor: step > 5 ? 'bottom' : 'top' };
    }
    return null;
  }
  var SCENES = {
    tab1: function (step) { var fs = [[50, 4], [50, 4], [100, 2], [20, 10], [50, 4]][step] || [50, 4]; sl('rng-t1-f', fs[0]); sl('rng-t1-s', fs[1]); try { animTime = 0; } catch (e) {} },
    tab2: function (step) { var p = [[30, 5], [30, 5], [45, 5], [15, 5], [30, 3], [30, 5]][step] || [30, 5]; lever(p[0], p[1], 600); },
    tab3: function (step) {
      if (step === 9) { pb("setTab3Mode('pulley'"); try { animTime = 0; } catch (e) {} return; }
      wheel(step === 2 || step === 8 ? 'axle' : 'wheel', ITEM[step - 1] || 'pencil');
    },
    tab4: function (step) {
      if (step === 5 || step === 6) { pb("setTab4Mode('screw'"); if (step === 6) pb('startScrewWinding()'); return; }
      if (step === 7) { pb("setTab4Mode('apps'"); try { animTime = 0; } catch (e) {} return; }
      incline(step === 4 ? 10 : 6, 2);
      if (step === 2 || step === 4) pb("startInclineAction('push')");
      if (step === 3) pb("startInclineAction('lift')");
    },
    tab5: function (step) {
      var n = step > 5 ? step - 5 : step;
      for (var k = 1; k <= 5; k++) { if (k < n || (k === n && step > 5)) revealQ4(k); else hideQ4(k); }
    }
  };

  function sceneOf(tab, sub, stepNo, anim) {
    stepNo = stepNo || 1;
    if (anim === undefined) anim = true;
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
    if (nv && (changedTab || !pv || pv.k !== nv.k)) bringIntoView(nv);
    if (nv && key === 'tab5' && stepNo > 5) setTimeout(function () { if (cur.step === stepNo && cur.tab === tab) bringIntoView(viewOf(key, stepNo)); }, 600);
  }

  var goto = sceneOf;

  // 把一段範圍（頭 top～尾 bot）捲到字幕框上方：放得下就置中；放不下就依 anchor 對齊上緣或下緣
  function bringIntoView(v) {
    var a = v && (v.topEl || $(v.top)), b = v && (v.botEl || (v.bot ? $(v.bot) : a));
    if (!a || !b || !a.getBoundingClientRect) return;
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var top = ra.top, bot = Math.max(ra.bottom, rb.bottom);
    var panelTop = ui.panel.querySelector('.vx-bub').getBoundingClientRect().top;
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
    text = displayText(text);
    ui.pin.textContent = text || '';
    ui.pin.classList.toggle('show', !!text);
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
    if (audio && !audio.paused) audio.pause();
    if (timer) { waitLeft = Math.max(0, waitLeft - (Date.now() - waitStart)); clearWait(); }
    refresh();
  }

  function halt() {
    cancelAnimationFrame(raf);
    token++; clearWait(); waitDone = null; stopActs(); clearTimers();
    if (audio) { audio.onended = audio.onerror = null; try { audio.pause(); } catch (e) {} }
    audio = null;
  }

  function stop() {
    halt(); state = 'idle'; idx = 0; unfitWire();
    setPin(''); progress(0);
    if (ui.sub) ui.sub.textContent = '按 ▶ 聽彥君老師與曉臻助教講解。';
    refresh();
  }

  function finish() {
    halt(); state = 'idle'; idx = 0; setPin(''); unfitWire();
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

/* biology_plant_structure：✋ 學生操作／👩‍🏫 老師講解 雙模式（外層加法，AGENTS 10.6／10.7）
 * - 不改繪圖與模型（plant_structure_models）：畫面全是「狀態＋時間」的函式，這支檔自己推進時間、改狀態、呼叫 PlantStructure.drawCurrent()。
 * - 學生操作：每個分頁最多 5 個步驟鈕；進分頁自動播第 1 步，播完停住；按編號＝從那一步開頭播、播完停住。
 *   下面原本的控制鈕（木質部／韌皮部、葉／莖／根、向日葵／玉米、下一季、完整樹幹／中空／環剝…）就是「動手做」：按了會把目前設定播一輪再停。
 *   原本會一直循環的「播放」鈕收起來（改由步驟鈕負責）。
 * - 老師講解：按一下從目前分頁第 1 步連播到最後一步（步驟之間不停）；可暫停、從頭重播、點編號跳；分頁之間不自動跳。
 * - 曉臻 Hook 搬到分頁卡片下面、畫布框上面（與 electronics_4 一致）。
 */
(function () {
  'use strict';
  var PS = window.PlantStructure;
  if (!PS) return;
  var $ = function (id) { return document.getElementById(id); };
  var tr = function (zh, en) { return document.documentElement.lang === 'en' ? en : zh; };
  var L = function (key) { return PS.state.labs[key]; };
  var setT = function (sec) { PS.state.time = sec; };
  var UNIT = 1700;    // 年輪動畫：每「半年」的毫秒數（與原本 .65 單位／秒相近）
  var FAST = 1100;    // 再長四年：加快

  function calm(key) { var s = L(key); s.playing = false; s.auto = false; s.zoom = 1; s.dx = 0; s.dy = 0; }

  /* ── 五個分頁的舞台：steps = [{ zh, en, d（毫秒）, enter(), tick(局部毫秒) }] ── */
  var STAGE = {
    0: { key: 'network', steps: [
      { zh: '根莖相連', en: 'Root–stem', d: 5000, enter: function () { var s = L('network'); calm('network'); s.part = 'root'; s.focus = 'xylem'; s.sink = 'root'; setT(0); } },
      { zh: '木質部送水', en: 'Xylem: water', d: 8400, enter: function () { var s = L('network'); calm('network'); s.part = 'stem'; s.focus = 'xylem'; s.sink = 'root'; setT(0); }, tick: function (l) { setT(l / 1000); } },
      { zh: '葉送出糖', en: 'Leaf sends sugar', d: 8400, enter: function () { var s = L('network'); calm('network'); s.part = 'leaf'; s.focus = 'phloem'; s.sink = 'root'; setT(0); }, tick: function (l) { setT(l / 1000); } },
      { zh: '糖往根部', en: 'Sugar to roots', d: 8400, enter: function () { var s = L('network'); calm('network'); s.part = 'stem'; s.focus = 'phloem'; s.sink = 'root'; setT(0); }, tick: function (l) { setT(l / 1000); } },
      { zh: '糖往嫩芽', en: 'Sugar to shoots', d: 8400, enter: function () { var s = L('network'); calm('network'); s.part = 'stem'; s.focus = 'phloem'; s.sink = 'shoot'; setT(0); }, tick: function (l) { setT(l / 1000); } }
    ] },
    1: { key: 'positions', steps: [
      { zh: '葉的剖面', en: 'Leaf', d: 5000, enter: function () { var s = L('positions'); calm('positions'); s.part = 'leaf'; s.focus = 'none'; } },
      { zh: '木質部在上', en: 'Xylem: upper', d: 5500, enter: function () { var s = L('positions'); calm('positions'); s.part = 'leaf'; s.focus = 'xylem'; } },
      { zh: '韌皮部在下', en: 'Phloem: lower', d: 5500, enter: function () { var s = L('positions'); calm('positions'); s.part = 'leaf'; s.focus = 'phloem'; } },
      { zh: '莖：木質部靠內', en: 'Stem: xylem inner', d: 5500, enter: function () { var s = L('positions'); calm('positions'); s.part = 'stem'; s.focus = 'xylem'; } },
      { zh: '莖：韌皮部靠外', en: 'Stem: phloem outer', d: 5500, enter: function () { var s = L('positions'); calm('positions'); s.part = 'stem'; s.focus = 'phloem'; } }
    ] },
    2: { key: 'microscopy', steps: [
      { zh: '向日葵：一圈', en: 'Sunflower: ring', d: 5500, enter: function () { var s = L('microscopy'); calm('microscopy'); s.kind = 'sunflower'; s.detail = 'whole'; s.focus = 'none'; s.answer = null; } },
      { zh: '木質部', en: 'Xylem', d: 5500, enter: function () { var s = L('microscopy'); calm('microscopy'); s.kind = 'sunflower'; s.detail = 'bundle'; s.focus = 'xylem'; s.answer = null; } },
      { zh: '韌皮部', en: 'Phloem', d: 5500, enter: function () { var s = L('microscopy'); calm('microscopy'); s.kind = 'sunflower'; s.detail = 'bundle'; s.focus = 'phloem'; s.answer = null; } },
      { zh: '形成層', en: 'Cambium', d: 5500, enter: function () { var s = L('microscopy'); calm('microscopy'); s.kind = 'sunflower'; s.detail = 'bundle'; s.focus = 'cambium'; s.answer = null; } },
      { zh: '玉米：散開', en: 'Maize: scattered', d: 5500, enter: function () { var s = L('microscopy'); calm('microscopy'); s.kind = 'corn'; s.detail = 'whole'; s.focus = 'none'; s.answer = null; } }
    ] },
    3: { key: 'growth', steps: [
      { zh: '春夏：淺色', en: 'Spring/summer', d: 3800, enter: function () { var s = L('growth'); calm('growth'); s.detail = 'model'; s.focus = 'none'; s.phase = 0; s.targetPhase = 0; s.selectedYear = 0; s.hold = 0; },
        tick: function (l) { var s = L('growth'); s.phase = Math.min(1, l / UNIT); s.targetPhase = s.phase; } },
      { zh: '秋冬：深色', en: 'Autumn/winter', d: 3800, enter: function () { var s = L('growth'); calm('growth'); s.detail = 'model'; s.focus = 'none'; s.phase = 1; s.targetPhase = 1; s.selectedYear = 0; s.hold = 0; },
        tick: function (l) { var s = L('growth'); s.phase = 1 + Math.min(1, l / UNIT); s.targetPhase = s.phase; } },
      { zh: '再長四年', en: 'Four more years', d: 11500, enter: function () { var s = L('growth'); calm('growth'); s.detail = 'model'; s.focus = 'none'; s.phase = 2; s.targetPhase = 2; s.selectedYear = 0; s.hold = 0; },
        tick: function (l) { var s = L('growth'); s.phase = Math.min(10, 2 + l / FAST); s.targetPhase = s.phase; s.selectedYear = l >= 9800 ? 3 : 0; } },
      { zh: '樹幹原圖', en: 'Trunk photo', d: 10500, enter: function () { var s = L('growth'); calm('growth'); s.detail = 'trunk'; s.focus = 'bark'; s.selectedYear = 0; },
        tick: function (l) { L('growth').focus = ['bark', 'phloem', 'cambium', 'xylem'][Math.min(3, Math.floor(l / 2500))]; } },
      { zh: '木材細胞', en: 'Wood cells', d: 5500, enter: function () { var s = L('growth'); calm('growth'); s.detail = 'wood'; s.focus = 'none'; s.selectedYear = 0; } }
    ] },
    4: { key: 'cases', steps: [
      { zh: '完整樹幹', en: 'Intact trunk', d: 7000, enter: function () { caseSet('normal', 0, 1); }, tick: function (l) { setT(l / 1000); } },
      { zh: '中心中空', en: 'Hollow centre', d: 8500, enter: function () { caseSet('hollow', 0, 0); L('cases').hollowStarted = true; },
        tick: function (l) { setT(l / 1000); L('cases').hollowProgress = Math.min(1, l / 3000); } },
      { zh: '環剝：韌皮部斷', en: 'Girdling: phloem cut', d: 6500, enter: function () { caseSet('girdled', 0, 1); }, tick: function (l) { setT(l / 1000); } },
      { zh: '根缺養分', en: 'Roots starve', d: 6500, enter: function () { caseSet('girdled', 1, 1); }, tick: function (l) { setT(l / 1000); } },
      { zh: '吸水受影響', en: 'Water uptake hit', d: 6500, enter: function () { caseSet('girdled', 2, 1); }, tick: function (l) { setT(l / 1000); } }
    ] }
  };
  function caseSet(kind, stage, hollow) {
    var s = L('cases'); calm('cases');
    s.kind = kind; s.focus = 'none'; s.stage = stage; s.elapsed = 0; s.prediction = null; s.hollowProgress = hollow; s.hollowStarted = false;
    setT(0);
  }

  /* ── 引擎 ── */
  var T = { mode: 'student', tab: 0, si: 0, local: 0, done: true, paused: false, last: 0, raf: 0, free: null, gap: 0, nextAfterGap: -1, waitStart: true, upd: 0 };
  var SNAP = null;
  function stageOf(tab) { return STAGE[tab]; }
  function begin(tab, i) {
    var st = stageOf(tab); if (!st || !st.steps[i]) return;
    PS.stopLoop(); PS.keys.forEach(function (k) { L(k).playing = false; L(k).auto = false; });
    T.tab = tab; T.si = i; T.local = 0; T.done = false; T.free = null; T.gap = 0; T.nextAfterGap = -1; T.paused = false;
    var s = st.steps[i];
    s.enter(); if (s.tick) s.tick(0);
    PS.update(); T.upd = performance.now();
    paint(true);
  }
  function endStep() {
    var st = stageOf(T.tab), s = st.steps[T.si];
    if (s.tick) s.tick(s.d);
    PS.update();
    if (T.mode === 'teacher' && T.si + 1 < st.steps.length) { T.gap = 650; T.nextAfterGap = T.si + 1; }
    else T.done = true;
  }
  function tick(now) {
    T.raf = requestAnimationFrame(tick);
    var dt = Math.min(100, Math.max(0, now - (T.last || now))); T.last = now;
    if (T.waitStart) {
      var intro = $('introScreen');
      if (PS.state.loaded && intro && intro.hidden) { T.waitStart = false; begin(PS.state.tab, 0); }
      return;
    }
    if (document.hidden) return;
    if (T.paused) dt = 0;
    var changed = false;
    if (T.free) {
      T.free.local += dt;
      T.free.tick(Math.min(T.free.local, T.free.d)); changed = true;
      if (T.free.local >= T.free.d) T.free = null;
    } else if (T.gap > 0) {
      T.gap -= dt;
      if (T.gap <= 0) { var n = T.nextAfterGap; T.gap = 0; T.nextAfterGap = -1; begin(T.tab, n); return; }
    } else if (!T.done && dt > 0) {
      var st = stageOf(T.tab), s = st && st.steps[T.si];
      if (s) {
        T.local += dt;
        if (T.local >= s.d) endStep();
        else if (s.tick) { s.tick(T.local); changed = true; }
      }
    }
    if (changed) {
      if (now - T.upd > 250) { PS.update(); T.upd = now; } else PS.drawCurrent();
    }
    paint(false);
  }

  /* ── 步驟列（放在每個實驗台控制區的最上面） ── */
  function barHTML(st) {
    return '<span class="ps-anim-k" data-zh="▶ 動畫步驟（播完就停）" data-en="▶ Animation steps (plays once, then stops)">' + '▶ 動畫步驟（播完就停）' + '</span>' +
      '<div class="teach-chips">' + st.steps.map(function (s, i) {
        return '<button type="button" class="teach-chip" data-i="' + i + '"><span class="teach-n">' + (i + 1) + '</span><span data-zh="' + s.zh + '" data-en="' + s.en + '">' + s.zh + '</span></button>';
      }).join('') + '</div>' +
      '<div class="t-only teach-ctl"><button type="button" class="teach-btn" data-act="pause"></button>' +
      '<button type="button" class="teach-btn" data-act="replay"></button>' +
      '<div class="teach-track"><div class="teach-fill"></div></div></div>' +
      '<div class="teach-note"></div>';
  }
  function installBars() {
    document.querySelectorAll('.ps-anim').forEach(function (e) { e.remove(); });
    Object.keys(STAGE).forEach(function (k) {
      var tab = +k, st = STAGE[k], lab = $('lab-' + st.key); if (!lab) return;
      var bar = document.createElement('div');
      bar.className = 'ps-anim'; bar.dataset.ts = String(tab);
      bar.innerHTML = barHTML(st);
      bar.addEventListener('click', onBar);
      var controls = lab.querySelector('.ps-controls'), head = controls && controls.querySelector('.ps-control-header');
      if (head) head.after(bar); else if (controls) controls.prepend(bar); else lab.before(bar);
    });
    document.querySelectorAll('.ps-control-group[data-control-group="play"]').forEach(function (g) { g.hidden = true; });
    paint(true);
  }
  function paint(force) {
    document.querySelectorAll('.ps-anim').forEach(function (bar) {
      var tab = +bar.dataset.ts, live = !T.waitStart && T.tab === tab, st = STAGE[tab];
      var teacher = T.mode === 'teacher';
      var note = '';
      if (live && teacher && T.paused) note = tr('⏸ 已暫停', '⏸ Paused');
      else if (live && T.done && teacher) note = tr('✔ 講解完畢；可按「從頭重播」，或點編號回到任一步', '✔ Done. Press Replay, or tap a number to revisit a step');
      else if (live && T.done) note = tr('這一步播完了：按別的編號看下一步，或用下面的按鈕自己動手做。', 'Step finished. Pick another number, or use the buttons below to try it yourself.');
      var p = 0;
      if (live && teacher) {
        var n = st.steps.length, s = st.steps[T.si], frac = T.done ? 1 : Math.min(1, T.local / s.d);
        p = Math.round(((T.done ? n : T.si) + (T.done ? 0 : frac)) / n * 100);
        if (T.done) p = 100;
      }
      var pauseTxt = T.paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause');
      var sig = [note, p, pauseTxt, live, T.si, T.done, teacher, document.documentElement.lang].join('|');
      if (!force && bar._sig === sig) return;
      bar._sig = sig;
      var pb = bar.querySelector('[data-act="pause"]'), rb = bar.querySelector('[data-act="replay"]');
      pb.textContent = pauseTxt; pb.disabled = !live || T.done;
      rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', !!(live && T.done && teacher));
      bar.querySelector('.teach-fill').style.width = p + '%';
      bar.querySelector('.teach-note').textContent = note;
      bar.querySelectorAll('.teach-chip').forEach(function (c) {
        var i = +c.dataset.i;
        c.classList.toggle('on', !!(live && i === T.si && (!T.done || !teacher)));
        c.classList.toggle('past', !!(live && teacher && (i < T.si || (T.done && i === T.si))));
      });
    });
  }
  function onBar(e) {
    var tab = +e.currentTarget.dataset.ts;
    var chip = e.target.closest('.teach-chip');
    if (chip) { begin(tab, +chip.dataset.i); return; }
    var b = e.target.closest('.teach-btn'); if (!b || T.tab !== tab) return;
    if (b.dataset.act === 'pause') { if (!T.done) T.paused = !T.paused; }
    else begin(tab, 0);
    paint(true);
  }

  /* ── 動手做：原本的控制鈕按下去，把目前設定播一輪再停 ── */
  function onLabClick(e) {
    var b = e.target.closest && e.target.closest('.ps-lab [data-action]'); if (!b) return;
    var a = b.dataset.action;
    if (a === 'expand' || a === 'reset-view' || a === 'play') return;
    var key = PS.keys[PS.state.tab], s = L(key);
    if (key === 'growth' && a === 'season') { T.done = true; T.free = null; return; }   // 「下一季」本來就是播一季就停：照原本的
    T.done = true; T.free = null; T.gap = 0; T.nextAfterGap = -1;
    if (T.mode === 'teacher') T.paused = true;
    if (key === 'network') {
      s.playing = false; PS.stopLoop();
      if (s.part !== 'root') { setT(0); T.free = { local: 0, d: 8400, tick: function (l) { setT(l / 1000); } }; }
    } else if (key === 'cases' && a !== 'answer' && a !== 'predict') {
      PS.stopLoop(); s.playing = false;
      var hollowRun = s.kind === 'hollow' && a === 'kind';
      if (hollowRun) { s.hollowProgress = 0; s.hollowStarted = true; }
      setT(0);
      T.free = { local: 0, d: hollowRun ? 8000 : 6000, tick: function (l) { setT(l / 1000); if (hollowRun) L('cases').hollowProgress = Math.min(1, l / 3000); } };
    }
    PS.update();
    paint(true);
  }

  /* ── 進出老師模式：記下／還原原本的樣子 ── */
  function snapshot() { SNAP = { labs: JSON.parse(JSON.stringify(PS.state.labs)), time: PS.state.time }; }
  function restore() {
    if (!SNAP) return;
    PS.keys.forEach(function (k) { Object.assign(L(k), SNAP.labs[k], { playing: false, auto: false }); });
    setT(SNAP.time); PS.update();
  }
  window.setMode = function (m) {
    var teacher = m === 'teacher';
    if ((T.mode === 'teacher') === teacher) return;
    $('mode-student').classList.toggle('active', !teacher); $('mode-student').setAttribute('aria-pressed', String(!teacher));
    $('mode-teacher').classList.toggle('active', teacher); $('mode-teacher').setAttribute('aria-pressed', String(teacher));
    document.body.classList.toggle('mode-teacher', teacher);
    if (teacher) { snapshot(); T.mode = 'teacher'; begin(PS.state.tab, 0); }
    else { T.mode = 'student'; T.done = true; T.free = null; T.gap = 0; T.paused = false; restore(); paint(true); }
  };

  /* ── 頁面外殼：Hook 搬到分頁卡片下面（畫布框外面）、收起「播放」鈕 ── */
  function moveHooks() {
    document.querySelectorAll('#lessons > section.lesson[data-page]').forEach(function (sec) {
      var hook = sec.querySelector('.hook-box'); if (!hook || sec.previousElementSibling && sec.previousElementSibling.classList.contains('ps-hook-slot') && sec.previousElementSibling.dataset.page === sec.dataset.page) return;
      var slot = document.createElement('div');
      slot.className = 'ps-hook-slot'; slot.dataset.page = sec.dataset.page;
      if (sec.hidden) slot.hidden = true;
      slot.appendChild(hook);
      sec.parentNode.insertBefore(slot, sec);
    });
  }

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.mode-bar{display:flex;flex-direction:column;align-items:center;gap:8px;margin:0 0 18px}',
      '.mode-bar .mode-row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}',
      '.mode-pill{min-height:52px;padding:8px 26px;border-radius:999px;cursor:pointer;font-size:21px;font-weight:700;font-family:inherit;line-height:1.3;background:transparent;color:#cfd8cf;border:2px dashed rgba(242,236,217,.35);touch-action:manipulation}',
      '.mode-pill:hover:not(.active){background:rgba(255,255,255,.08);color:#f2ecd9}',
      '.mode-pill.active{background:#fde047;color:#11261f;border:2px solid #fde047;box-shadow:0 0 14px rgba(253,224,71,.35)}',
      '.mode-hint{font-size:17px;color:#cfd8cf;text-align:center;line-height:1.5;max-width:900px}',
      '.ps-hook-slot{margin:22px 0 0}.ps-hook-slot .hook-box{margin:0}',
      '.ps-hook-slot + .lesson{margin-top:22px}',
      '.ps-control-group[data-control-group="play"]{display:none!important}',
      '.ps-anim{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 10px;margin:8px 0 10px;padding:8px 12px;border:2px dashed rgba(85,233,255,.45);border-radius:12px;background:rgba(85,233,255,.06)}',
      '.ps-anim-k{flex:0 1 auto;min-width:0;max-width:100%;text-align:center;font-size:17px;font-weight:700;color:#55e9ff}',
      '.ps-anim .teach-chips{flex:1 1 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
      '.ps-anim .teach-chip{min-height:38px;padding:3px 12px;border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;font-family:inherit;line-height:1.25;background:transparent!important;color:#cfd8cf!important;border:2px dashed rgba(242,236,217,.3)!important;box-shadow:none;touch-action:manipulation}',
      '.ps-anim .teach-chip .teach-n{display:inline-block;min-width:1.2em;margin-right:2px}',
      '.ps-anim .teach-chip.past{color:#4ade80!important;border-color:rgba(74,222,128,.55)!important}',
      '.ps-anim .teach-chip.on{background:#fde047!important;color:#11261f!important;border:2px solid #fde047!important;box-shadow:0 0 12px rgba(253,224,71,.4)}',
      '.t-only{display:none!important}',
      'body.mode-teacher .t-only{display:flex!important}',
      'body.mode-teacher .ps-anim{border-style:solid;background:rgba(13,32,26,.72);border-color:rgba(242,236,217,.25)}',
      '.ps-anim .teach-ctl{flex:1 1 100%;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}',
      '.ps-anim .teach-btn{min-height:40px;padding:5px 16px;border-radius:8px;cursor:pointer;font-size:17px;font-weight:700;font-family:inherit;background:transparent!important;color:#4ade80!important;border:2px solid #4ade80!important;touch-action:manipulation}',
      '.ps-anim .teach-btn:hover:not(:disabled){background:#4ade80!important;color:#11261f!important}.ps-anim .teach-btn:disabled{opacity:.4;cursor:not-allowed}',
      '.ps-anim .teach-btn.hot{background:#fde047!important;color:#11261f!important;border-color:#fde047!important}',
      '.teach-track{flex:1 1 180px;min-width:120px;height:10px;border-radius:6px;background:rgba(255,255,255,.14);overflow:hidden}',
      '.teach-fill{height:100%;width:0;background:#fde047;border-radius:6px;transition:width .35s linear}',
      '.ps-anim .teach-note{flex:1 1 100%;text-align:center;font-size:17px;color:#fde047;min-height:1.4em}',
      '.ps-anim .teach-note:empty{display:none}',
      '@media (max-width:520px){.mode-pill{padding:8px 16px;font-size:18px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function init() {
    css();
    moveHooks();
    installBars();
    // 左側控制區若之後被重排（V4 版面已先做完），補一次
    document.addEventListener('click', onLabClick);
    document.addEventListener('ps:tab', function (e) {
      var tab = e.detail;
      if (T.waitStart) return;
      begin(tab, 0);
    });
    new MutationObserver(function () { paint(true); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    PS.keys.forEach(function (k) { L(k).auto = false; L(k).playing = false; });
    T.raf = requestAnimationFrame(tick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  /* 給有聲講解播放器用：切分頁、播某一步、直接改某個實驗台的狀態 */
  window.PSLesson = {
    PS: PS, STAGE: STAGE, T: T,
    goTab: function (i) { if (PS.state.tab !== i) PS.switchTab(i); },
    playStep: function (tab, i) { if (PS.state.tab !== tab) { T.waitStart = false; PS.switchTab(tab); } T.waitStart = false; begin(tab, i); },
    patch: function (key, obj, ambientMs) {
      T.done = true; T.free = null; T.gap = 0;
      var s = L(key); calm(key); Object.assign(s, obj); PS.update();
      if (ambientMs) { setT(0); T.free = { local: 0, d: ambientMs, tick: function (l) { setT(l / 1000); } }; }
    },
    begin: begin
  };
})();

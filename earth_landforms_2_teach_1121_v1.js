/* earth_landforms_2｜老師講解（連播）＋學生操作 切換
   只做頁面層（外層加法）：不改任何動畫、座標、物理、題目；每一站都是「呼叫頁面原本的函式」。
   同時提供 window.LF 給有聲講解播放器用（LF.show(tab, idx) 切到某一站；LF.freeze()/thaw() 把動畫一起凍住）。
   分頁 0～3：
     0 up（地貌拉鋸）：抬升比侵蝕快／一樣快（動態平衡）／抬升停了
     1 fw（石膏塊的一個星期）：A 泡水冷凍／先猜／過一星期／看 A／看 B／看鋼絲絨
     2 st（流水槽：先猜／放水／看上端／看下端）＋ sg（方糖：先猜／搖100下／搖300下／比一比）
     3 gl（冰塊刮黏土：先猜／推 A／推 B／看剖面／等冰融化）
*/
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const tr = (zh, en) => (typeof currentLang !== 'undefined' && currentLang === 'en') ? en : zh;
  const RIGHT = { fw: 'ab', st: 'up', sg: 'round', gl: 'b' };
  const STAGE = { up: 'up-stage', fw: 'fw-stage', st: 'st-stage', sg: 'sg-stage', gl: 'gl-stage' };

  /* ---------- 可凍結的時鐘：頁面所有動畫都用 kNow()，凍住它＝全部動畫停住 ---------- */
  const CLK = { off: 0, frozen: null };
  const realNow = () => performance.now() / 1000;
  window.kNow = function () { return (CLK.frozen !== null ? CLK.frozen : realNow()) - CLK.off; };
  function freeze() { if (CLK.frozen === null) CLK.frozen = realNow(); }
  function thaw() { if (CLK.frozen !== null) { CLK.off += realNow() - CLK.frozen; CLK.frozen = null; } }

  /* ---------- 實驗台小工具 ---------- */
  function fin(L) { let n = 0; while (L.cur && n++ < 600) kTick(L, L.cur.t0 + L.cur.d + 1, () => labUI(L)); }
  function labStep(id, i) {          // 第 i 個 flow 步驟：做完（用在快轉）
    const L = LABS[id]; fin(L);
    const s = L.cfg.flow[i]; if (!s) return;
    if (s.guess) labGuess(id, RIGHT[id]); else { labGo(id); fin(L); }
  }
  function labStart(id, i) {         // 開始第 i 步（有動畫，不快轉）
    const L = LABS[id], s = L.cfg.flow[i]; if (!s) return;
    if (s.guess) labGuess(id, RIGHT[id]); else labGo(id);
  }
  const labIdle = id => { const L = LABS[id]; return !L.cur; };
  function labResetAll(id) { const L = LABS[id]; fin(L); labReset(id); }

  function mkLab(id) {
    const F = LABS[id].cfg.flow;
    return F.map((f, i) => ({
      lab: id, step: i, stage: STAGE[id], label: f.step,
      pre: f.guess ? 4 : 0, hold: f.guess ? 3 : 3.5,
      go: () => labStart(id, i), fast: () => labStep(id, i), done: () => labIdle(id)
    }));
  }

  /* 分頁一：地貌拉鋸（三種情況，各自從頭播 10 秒） */
  function upFast(m) { upReset(m); UPS.play = true; let n = 0; while (UPS.play && n++ < 1000) upTick(0.05); upUI(); }
  const UPL = { up: ['抬升比侵蝕快', 'Uplift faster'], eq: ['一樣快（動態平衡）', 'Equal (dynamic equilibrium)'], down: ['抬升停了', 'Uplift stops'] };
  const mkUp = m => ({ lab: 'up', step: m, stage: STAGE.up, label: UPL[m], pre: 0, hold: 7, go: () => { upReset(m); upPlay(); }, fast: () => upFast(m), done: () => !UPS.play });

  /* 各分頁的站（label、pre＝動作前先停幾秒讓學生看題目、go、done、hold＝做完停幾秒、fast＝快轉做完） */
  const TABS = [
    () => ['up', 'eq', 'down'].map(mkUp),
    () => mkLab('fw'),
    () => mkLab('st').concat(mkLab('sg')),
    () => mkLab('gl')
  ];
  let STOPS = null;
  function stops(tab) { if (!STOPS) STOPS = TABS.map(f => f()); return STOPS[tab]; }

  /* 把整個分頁退回剛進來的樣子 */
  const LABS_OF = [[], ['fw'], ['st', 'sg'], ['gl']];
  function resetTab(tab) {
    (LABS_OF[tab] || []).forEach(labResetAll);
    if (tab === 0) upReset('up');
  }
  const NT = 4;
  function resetAll() { for (let i = 0; i < NT; i++) resetTab(i); }

  /* LF.cur[tab]：這個分頁目前已經「開始」到第幾站（-1＝還沒開始） */
  const CUR = [-1, -1, -1, -1];

  /* 切到第 idx 站：前面的站快轉做完，這一站照原本的動畫演出（animate=false 就連這一站也快轉做完） */
  function show(tab, idx, animate) {
    const S = stops(tab); idx = Math.max(0, Math.min(idx, S.length - 1));
    if (idx <= CUR[tab]) { resetTab(tab); CUR[tab] = -1; }
    for (let i = CUR[tab] + 1; i < idx; i++) S[i].fast();
    if (animate === false) S[idx].fast(); else S[idx].go();
    CUR[tab] = idx;
    return S[idx];
  }
  function showReset(tab) { resetTab(tab); CUR[tab] = -1; }

  /* ---------- 老師講解（連播） ---------- */
  const T = { on: false, tab: 0, idx: -1, phase: 'pre', wait: 0, paused: false, done: false, last: 0, raf: 0 };

  function scrollToStage(stage) {
    const el = $(stage);
    if (el && !el.classList.contains('fs-on') && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function begin(i, scroll) {
    const S = stops(T.tab), prev = T.idx >= 0 ? S[T.idx] : null;
    if (i <= CUR[T.tab]) { resetTab(T.tab); CUR[T.tab] = -1; }
    for (let k = CUR[T.tab] + 1; k < i; k++) S[k].fast();
    CUR[T.tab] = i - 1;
    T.idx = i; T.done = false; T.paused = false;
    const st = S[i];
    if (scroll || !prev || prev.stage !== st.stage) scrollToStage(st.stage);
    if (st.pre > 0) { T.phase = 'pre'; T.wait = st.pre; }
    else { st.go(); CUR[T.tab] = i; T.phase = 'run'; }
  }
  function startTab(scroll) { thaw(); showReset(T.tab); T.idx = -1; begin(0, scroll); paint(); }
  function enterTab(tab) { T.tab = tab; resetAll(); for (let i = 0; i < NT; i++) CUR[i] = -1; startTab(true); }

  function tick() {
    if (!T.on) return;
    T.raf = requestAnimationFrame(tick);
    const now = realNow(), dt = Math.min(0.1, Math.max(0, now - (T.last || now))); T.last = now;
    if (!T.paused && !T.done) {
      const S = stops(T.tab), st = S[T.idx];
      if (T.phase === 'pre') {
        T.wait -= dt;
        if (T.wait <= 0) { st.go(); CUR[T.tab] = T.idx; T.phase = 'run'; }
      } else if (T.phase === 'run') {
        if (st.done()) { T.phase = 'hold'; T.wait = st.hold; }
      } else {
        T.wait -= dt;
        if (T.wait <= 0) { if (T.idx + 1 >= S.length) T.done = true; else begin(T.idx + 1, false); }
      }
    }
    paint();
  }
  function frac() {
    const S = stops(T.tab), st = S[T.idx]; if (!st) return 0;
    if (T.done) return 1;
    let f = 0;
    if (T.phase === 'pre') f = 0.05; else if (T.phase === 'run') f = 0.4; else f = 0.4 + 0.6 * (1 - Math.max(0, T.wait) / (st.hold || 1));
    return (T.idx + f) / S.length;
  }
  function paint() {
    document.querySelectorAll('.teach-bar').forEach(bar => {
      const S = stops(T.tab), cur = S[T.idx];
      const mine = S.some(s => s.stage === bar.dataset.stage); if (!mine || !cur) return;
      let note;
      if (T.paused) note = tr('⏸ 已暫停', '⏸ Paused');
      else if (T.done) note = tr('✔ 講解完畢；可按「從頭重播」，或點上方的步驟編號回到任一步', '✔ Done. Press Replay, or tap a step number to revisit it');
      else note = tr('▶ 正在講：', '▶ Now: ') + tr(cur.label[0], cur.label[1]);
      const pct = Math.round(Math.max(0, Math.min(1, frac())) * 100);
      const pauseTxt = T.paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause');
      const sig = [note, pct, pauseTxt, T.done].join('|');
      if (bar._sig === sig) return; bar._sig = sig;
      const pb = bar.querySelector('[data-act="pause"]'), rb = bar.querySelector('[data-act="replay"]');
      pb.textContent = pauseTxt; pb.disabled = T.done;
      rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', T.done);
      bar.querySelector('.teach-fill').style.width = pct + '%';
      bar.querySelector('.teach-note').textContent = note;
    });
  }
  function onBar(e) {
    const b = e.target.closest('.teach-btn'); if (!b || !T.on) return;
    if (b.dataset.act === 'pause') { if (T.paused) { T.paused = false; thaw(); } else { T.paused = true; freeze(); } }
    else startTab(false);
    paint();
  }
  /* 點實驗台的步驟編號：跳到那一步 */
  function onStepClick(id) {
    return function (e) {
      if (!T.on) return;
      const li = e.target.closest('li'); if (!li) return;
      const k = Array.prototype.indexOf.call(li.parentNode.children, li);
      const S = stops(T.tab); const idx = S.findIndex(s => s.lab === id && s.step === k);
      if (idx < 0) return;
      thaw(); T.paused = false; begin(idx, true); paint();
    };
  }

  window.setMode = function (m) {
    const teacher = m === 'teacher';
    if (teacher === T.on) return;
    if (window.__voiceBlockTeacher && teacher) return;     // 有聲講解播放中，不讓老師講解搶畫面
    $('mode-student').classList.toggle('active', !teacher); $('mode-student').setAttribute('aria-pressed', String(!teacher));
    $('mode-teacher').classList.toggle('active', teacher); $('mode-teacher').setAttribute('aria-pressed', String(teacher));
    document.body.classList.toggle('mode-teacher', teacher);
    T.on = teacher;
    if (teacher) {
      const idx = Array.prototype.findIndex.call(document.querySelectorAll('.panel'), p => p.classList.contains('active'));
      T.last = 0; enterTab(Math.max(0, idx));
      cancelAnimationFrame(T.raf); T.raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(T.raf); thaw(); T.paused = false; resetAll(); for (let i = 0; i < NT; i++) CUR[i] = -1;
    }
  };

  /* 換分頁：老師模式就從那一頁的第一站開始 */
  const _switch = window.switchTab;
  window.switchTab = function (idx) { _switch(idx); if (T.on) enterTab(idx); };

  /* 老師模式下，畫布上「點一下」不要再觸發原本的實驗台（連播由程式控制） */
  document.querySelectorAll('canvas').forEach(cv => cv.addEventListener('pointerdown', e => { if (T.on) e.stopImmediatePropagation(); }, true));

  /* 控制列：每個舞台一條；原本的按鈕列（.ctrl-row）老師模式收起來 */
  Object.keys(STAGE).forEach(k => {
    const stage = $(STAGE[k]), ctrls = stage && stage.querySelector('.controls'); if (!ctrls) return;
    const bar = document.createElement('div');
    bar.className = 'teach-bar'; bar.dataset.stage = STAGE[k];
    bar.innerHTML = '<button type="button" class="teach-btn" data-act="pause"></button><button type="button" class="teach-btn" data-act="replay"></button><div class="teach-track"><div class="teach-fill"></div></div><div class="teach-note"></div>';
    bar.addEventListener('click', onBar);
    ctrls.insertBefore(bar, ctrls.firstChild);
    ctrls.querySelectorAll('.ctrl-row').forEach(r => r.classList.add('std-only'));
    const ol = $(k + '-steps'); if (ol) ol.addEventListener('click', onStepClick(k));
  });

  window.LF = {
    stops, show, showReset, freeze, thaw, resetAll,
    reset: () => { resetAll(); for (let i = 0; i < NT; i++) CUR[i] = -1; },
    tabOf: () => T.tab, teacherOn: () => T.on,
    cur: tab => CUR[tab],
    idle: tab => tab === 0 ? !UPS.play : (LABS_OF[tab] || []).every(labIdle),
    stageOf: (tab, idx) => stops(tab)[idx].stage
  };
})();

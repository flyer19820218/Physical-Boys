/* earth_interior_1｜老師講解（連播）＋學生操作 切換
   只做頁面層（外層加法）：不改任何動畫、座標、物理、題目；每一站都是「按下頁面原本的按鈕」。
   同時提供 window.EI 給有聲講解播放器用（EI.show(tab, idx) 切到某一站；EI.freeze()/thaw() 把動畫一起凍住）。
   分頁 0～4：
     0 sw（地震波）：發 P 波／先猜／發 S 波／找出分層
     1 dc（密度柱）：倒油／先猜／倒水／倒蜂蜜／放三樣東西／跟地球比
     2 rd（岩石密度）：秤質量／先猜／排水法／算密度
     3 ly（兩種分層：組成、物理、兩種一起）＋ pf（瀝青滴漏：敲、先猜、剪開、快轉、跟地球比）
     4 cv（地函熱對流）＋ pg（大陸拼圖）
*/
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const tr = (zh, en) => (typeof currentLang !== 'undefined' && currentLang === 'en') ? en : zh;
  const RIGHT = { sw: 'stop', dc: 'dense', rd: 'b', pf: 'drip' };
  const STAGE = { sw: 'sw-stage', dc: 'dc-stage', rd: 'rd-stage', ly: 'ly-stage', pf: 'pf-stage', cv: 'cv-stage', pg: 'pg-stage' };

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
  const LYL = { comp: ['依組成物質看', 'By composition'], phys: ['依物理性質看', 'By physical properties'], both: ['兩種一起看', 'Both together'] };
  const mkLy = m => ({ lab: 'ly', stage: STAGE.ly, label: LYL[m], pre: 0, hold: 7, go: () => lyMode(m), fast: () => lyMode(m), done: () => true });

  /* 各分頁的站（每一站：label、pre＝動作前先停幾秒讓學生看題目、go、done、hold＝做完停幾秒、fast＝快轉做完） */
  const TABS = [
    () => mkLab('sw'),
    () => mkLab('dc'),
    () => mkLab('rd'),
    () => [mkLy('comp'), mkLy('phys'), mkLy('both')].concat(mkLab('pf')),
    () => [
      { lab: 'cv', stage: STAGE.cv, label: ['開始對流', 'Start convection'], pre: 0, hold: 14, go: () => { CVS.run = true; cvUI(); }, fast: () => { CVS.run = true; CVS.t = 6; CVS.myr = 2; cvUI(); }, done: () => true },
      { lab: 'cv', stage: STAGE.cv, label: ['關掉冷熱顏色，只看流向', 'Hide the heat colours, follow the flow'], pre: 0, hold: 6, go: () => { if (CVS.heat) cvHeat(); }, fast: () => { if (CVS.heat) cvHeat(); }, done: () => true },
      { lab: 'pg', stage: STAGE.pg, label: ['倒轉回約 2 億年前', 'Rewind to ~200 million years ago'], pre: 0, hold: 8, go: () => pgGo(1), fast: () => { PGS.to = null; PGS.k = 1; pgUI(); }, done: () => PGS.to === null },
      { lab: 'pg', stage: STAGE.pg, label: ['回到現在', 'Back to today'], pre: 0, hold: 4, go: () => pgGo(0), fast: () => { PGS.to = null; PGS.k = 0; pgUI(); }, done: () => PGS.to === null }
    ]
  ];
  let STOPS = null;
  function stops(tab) { if (!STOPS) STOPS = TABS.map(f => f()); return STOPS[tab]; }

  /* 把整個分頁（或整頁）退回剛進來的樣子 */
  const LABS_OF = [['sw'], ['dc'], ['rd'], ['pf'], []];
  function resetTab(tab) {
    (LABS_OF[tab] || []).forEach(labResetAll);
    if (tab === 3 && typeof lyMode === 'function') { LYS.mode = 'comp'; LYS.since = 0; lyUI(); }
    if (tab === 4) {
      Object.assign(CVS, { run: false, heat: true, t: 0, myr: 0 }); cvUI();
      PGS.to = null; PGS.k = 0; PGS.fos = true; pgUI();
    }
  }
  function resetAll() { for (let i = 0; i < 5; i++) resetTab(i); }

  /* EI.cur[tab]：這個分頁目前已經「開始」到第幾站（-1＝還沒開始） */
  const CUR = [-1, -1, -1, -1, -1];

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
    /* 前面的站要先「做完」：往回跳就先退回開頭，再把 i 之前的站快轉 */
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
  function enterTab(tab) { T.tab = tab; resetAll(); for (let i = 0; i < 5; i++) CUR[i] = -1; startTab(true); }

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
      cancelAnimationFrame(T.raf); thaw(); T.paused = false; resetAll(); for (let i = 0; i < 5; i++) CUR[i] = -1;
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

  window.EI = {
    stops, show, showReset, freeze, thaw, resetAll,
    reset: () => { resetAll(); for (let i = 0; i < 5; i++) CUR[i] = -1; },
    tabOf: () => T.tab, teacherOn: () => T.on,
    cur: tab => CUR[tab],
    idle: tab => (LABS_OF[tab] || []).every(labIdle) && (tab !== 4 || PGS.to === null),
    stageOf: (tab, idx) => stops(tab)[idx].stage
  };
})();

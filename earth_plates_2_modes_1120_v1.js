/* earth_plates_2 老師講解（連續動畫）——只做頁面層：不改任何動畫檔與畫法，只呼叫頁面原本的全域函式與狀態。
 * 學生操作＝預設（頁面原樣）；老師講解＝按一下從目前分頁的第 1 步連播到最後一步（每步停留若干秒），
 * 可暫停／從頭重播／點編號跳步；切到別的分頁會從那一頁的第 1 步重新連播；回到學生操作時一切還原成剛進頁面的樣子。
 * 步驟對照與有聲講解相同：gl 1～4＝海陸、板塊交界、地震火山、找臺灣；dv 1～4＝分離程度 0／50／100、冰島；
 * sb 1～5＝比密度、熱對流與靠近、看地震、看火山、安地斯；cl 1～4＝擠壓 0／35／100、100＋原始地表；ev 1～4＝綜合、地震、火山、交界。 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const tr = (z, e) => (typeof currentLang !== 'undefined' && currentLang === 'en') ? e : z;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = f => { f = clamp(f, 0, 1); return f * f * (3 - 2 * f); };
  const IDS = ['gl', 'dv', 'sb', 'cl', 'ev'];
  const SBN = ['dens', 'move', 'quake', 'volc', 'andes'];

  const TOUR = {
    gl: {
      names: [['🌎 海陸', '🌎 Land & sea'], ['🧩 板塊交界', '🧩 Plate boundaries'], ['🔥 地震火山', '🔥 Quakes & volcanoes'], ['🇹🇼 找臺灣', '🇹🇼 Find Taiwan']],
      dwell: [9, 11, 13, 13], at: -1,
      go(i) {
        glTouch(); GLS.tw = false; GLS.fly = null;
        if (i < 3 && this.at === 3) { GLS.lon = 60; GLS.lat = 12; GLS.vl = GLS.vp = 0; }
        this.at = i;
        if (i === 0) glMode('coast'); else if (i === 1) glMode('plates'); else if (i === 2) glMode('act'); else glTaiwan();
      },
      reset() { this.at = -1; GLS.touched = false; GLS.auto = false; GLS.tw = false; GLS.fly = null; GLS.lon = 60; GLS.lat = 12; GLS.vl = GLS.vp = 0; glSetMode('coast'); glUI(); }
    },
    dv: {
      names: [['分離程度 0', 'Separation 0'], ['分離程度 50', 'Separation 50'], ['分離程度 100', 'Separation 100'], ['🧊 冰島案例', '🧊 Iceland case']],
      dwell: [9, 10, 11, 13], from: 0, to: 0,
      go(i) {
        dvTouch();
        if (i === 3) { dvMode('ice'); return; }
        dvMode('ocean'); this.from = DVS.amt; this.to = [0, 50, 100][i];
      },
      upd(i, f) { if (i < 3) { DVS.amt = this.from + (this.to - this.from) * ease(f / 0.6); dvUI(); } },
      reset() { DVS.touched = false; DVS.auto = false; DVS.play = false; DVS.mode = 'ocean'; DVS.amt = 45; dvUI(); }
    },
    sb: {
      names: [['1 比密度', '1 Density'], ['2 熱對流與靠近', '2 Convection'], ['3 看地震', '3 Quakes'], ['4 看火山', '4 Volcanoes'], ['5 實例：安地斯', '5 The Andes']],
      dwell: [9, 17, 11, 12, 13],
      go(i) { sbMode(SBN[i]); },
      upd() { const cap = SB_DUR[SBS.step] - 0.25; if (SBS.age > cap) SBS.age = cap; },    // 頁面會自己換下一步；老師講解的換步由這裡控制
      reset() { SBS.step = 0; SBS.age = 0; sbUI(); }
    },
    cl: {
      names: [['擠壓 0', 'Squeeze 0'], ['擠壓 35', 'Squeeze 35'], ['擠壓 100', 'Squeeze 100'], ['原始地表', 'Original surface']],
      dwell: [8, 10, 12, 10], from: 0, to: 0,
      go(i) { clTouch(); CLS.ghost = i === 3; clUI(); this.from = CLS.s; this.to = [0, 35, 100, 100][i]; },
      upd(i, f) { clSet(this.from + (this.to - this.from) * ease(f / 0.7)); },
      reset() { CLS.touched = false; CLS.auto = false; CLS.ghost = false; CLS.s = 0; clUI(); }
    },
    ev: {
      names: [['綜合圖', 'All'], ['聚焦地震', 'Quakes'], ['聚焦火山', 'Volcanoes'], ['聚焦交界', 'Boundaries']],
      dwell: [10, 11, 10, 12],
      go(i) { evMode(['all', 'quake', 'volc', 'bound'][i]); },
      reset() { EVS.touched = false; EVS.auto = false; EVS.mode = 'all'; EVS.from = 'all'; EVS.p = 1; evUI(); }
    }
  };

  const T = { on: false, tab: 0, paused: false, last: 0, wait: 0, raf: 0, st: null, hold: null };
  /* 暫停：把各動畫「依時間往前走」的那個函式換成空函式（畫面照畫，但不再前進）；繼續時換回原本的 */
  const FREEZE = ['glStep', 'dvTick', 'sbTick', 'clTick'];
  function freeze() { if (T.hold) return; T.hold = {}; FREEZE.forEach(n => { T.hold[n] = window[n]; window[n] = function () {}; }); }
  function thaw() { if (!T.hold) return; FREEZE.forEach(n => { window[n] = T.hold[n]; }); T.hold = null; }

  function resetAll() {
    IDS.forEach(id => TOUR[id].reset());
    thaw();
    document.querySelectorAll('.panel').forEach((p, i) => { if (p.classList.contains('active')) { const f = window[IDS[i] + 'Enter']; if (typeof f === 'function') f(); } });   // 目前分頁照剛打開的樣子重新示範
  }
  function tourDo(st, i) {
    const d = TOUR[st.id]; st.idx = i; st.done = false; st.f = 0;
    d.go(i); T.wait = d.dwell[i];
  }
  function startStage() { T.paused = false; thaw(); tourDo(T.st, 0); paint(); }
  function enterTab(idx) {
    IDS.forEach(id => { if (id !== IDS[idx]) TOUR[id].reset(); });
    T.tab = idx; T.paused = false; T.st = { id: IDS[idx] };
    startStage();
  }
  function drive(dt) {
    const st = T.st, d = TOUR[st.id];
    if (T.paused) return;
    if (st.done) { if (d.upd) d.upd(st.idx, 1); return; }
    T.wait -= dt;
    st.f = clamp(1 - Math.max(0, T.wait) / d.dwell[st.idx], 0, 1);
    if (d.upd) d.upd(st.idx, st.f);
    if (T.wait > 0) return;
    if (st.idx + 1 >= d.dwell.length) { st.done = true; st.f = 1; return; }
    tourDo(st, st.idx + 1);
  }
  function tick() {
    if (!T.on) return;
    T.raf = requestAnimationFrame(tick);
    const now = performance.now() / 1000, real = Math.max(0, now - (T.last || now)); T.last = now;
    if (!T.st) return;
    drive(Math.min(real, 0.1));
    paint();
  }

  function paint() {
    document.querySelectorAll('.teach-bar').forEach(bar => {
      const st = T.st; if (!st || bar.dataset.stage !== st.id) return;
      const d = TOUR[st.id], name = d.names[st.idx];
      let note;
      if (T.paused) note = tr('⏸ 已暫停', '⏸ Paused');
      else if (st.done) note = tr('✔ 講解完畢；可按「從頭重播」，或點上方的步驟編號回到任一步', '✔ Done. Press Replay, or tap a step above to revisit it');
      else note = tr('▶ 正在講：', '▶ Now: ') + tr(name[0], name[1]);
      const pct = Math.round(clamp(st.done ? 1 : (st.idx + st.f) / d.dwell.length, 0, 1) * 100);
      const pauseTxt = T.paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause');
      const sig = [note, pct, pauseTxt, st.done, st.idx, currentLang].join('|');
      if (bar._sig === sig) return;
      bar._sig = sig;
      const pb = bar.querySelector('[data-act="pause"]'), rb = bar.querySelector('[data-act="replay"]');
      pb.textContent = pauseTxt; pb.disabled = st.done;
      rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', st.done);
      bar.querySelector('.teach-fill').style.width = pct + '%';
      bar.querySelector('.teach-note').textContent = note;
      bar.querySelectorAll('.teach-step').forEach((b, k) => {
        b.textContent = tr(d.names[k][0], d.names[k][1]);
        b.classList.toggle('on', k === st.idx);
      });
    });
  }

  function onBar(e) {
    if (!T.on || !T.st) return;
    const sbtn = e.target.closest('.teach-step');
    if (sbtn) {                                                  // 點步驟編號：整個狀態重設，跟真的播到那一步一樣
      const k = +sbtn.dataset.k; if (k >= 0 && k < TOUR[T.st.id].dwell.length) { T.paused = false; thaw(); tourDo(T.st, k); paint(); }
      return;
    }
    const b = e.target.closest('.teach-btn'); if (!b) return;
    if (b.dataset.act === 'pause') {
      if (T.paused) { T.paused = false; thaw(); } else { T.paused = true; freeze(); }
    } else startStage();
    paint();
  }

  window.setMode = function (m) {
    const teacher = m === 'teacher';
    if (teacher === T.on) return;
    const ms = $('mode-student'), mt = $('mode-teacher');
    if (ms) { ms.classList.toggle('active', !teacher); ms.setAttribute('aria-pressed', String(!teacher)); }
    if (mt) { mt.classList.toggle('active', teacher); mt.setAttribute('aria-pressed', String(teacher)); }
    document.body.classList.toggle('mode-teacher', teacher);
    T.on = teacher;
    if (teacher) {
      const idx = Array.prototype.findIndex.call(document.querySelectorAll('.panel'), p => p.classList.contains('active'));
      T.last = 0; enterTab(Math.max(0, idx));
      cancelAnimationFrame(T.raf); T.raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(T.raf); T.paused = false; thaw(); T.st = null; resetAll();   // 回到學生操作：一切還原成原本的樣子
    }
  };
  window.teachOnTab = function (idx) { if (T.on) enterTab(idx); };

  /* 一次性準備：每個舞台加一條控制列（暫停／重播／進度條／步驟編號）；學生專用的按鈕與滑桿那幾列在老師模式收起來 */
  IDS.forEach(id => {
    const stage = $(id + '-stage'), ctrls = stage && stage.querySelector('.controls'); if (!ctrls) return;
    const d = TOUR[id], bar = document.createElement('div');
    bar.className = 'teach-bar'; bar.dataset.stage = id;
    bar.innerHTML = '<button type="button" class="teach-btn" data-act="pause"></button><button type="button" class="teach-btn" data-act="replay"></button><div class="teach-track"><div class="teach-fill"></div></div>' +
      '<div class="teach-steps">' + d.names.map((n, k) => '<button type="button" class="teach-step" data-k="' + k + '">' + n[0] + '</button>').join('') + '</div><div class="teach-note"></div>';
    bar.addEventListener('click', onBar);
    ctrls.insertBefore(bar, ctrls.firstChild);
    ctrls.querySelectorAll('.ctrl-row, .pl-hint').forEach(r => r.classList.add('std-only'));
  });
})();

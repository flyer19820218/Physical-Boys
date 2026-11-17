/* biology_nutrients：✋ 學生操作／👩‍🏫 老師講解 雙模式（外層加法，AGENTS 10.6／10.7）
 * - 學生操作：碘液、本氏液動畫一次只播一步、播完停住（nutrients_v2.js 的 ctl.mode='step'）；
 *   每個實驗台下面多一列「動手做：換一個樣本」，學生自己挑樣本再從第 1 步做起。其他互動（養分卡、熱量、標示、餐盤）照原樣。
 * - 老師講解：按一下就從目前分頁的頭連續播到底（不停在步驟之間），分頁之間不自動跳；可暫停、從頭重播、點編號跳到那一步。
 * - 只呼叫 window.NutrientsLesson 公開的函式；不改模型、繪圖、題庫。離開老師模式時把畫面還原成剛按下去那一刻的樣子。
 */
(function () {
  'use strict';
  var NL = null;
  var $ = function (id) { return document.getElementById(id); };
  var tr = function (zh, en) { return document.documentElement.lang === 'en' ? en : zh; };
  var NUTS = [['carb', '醣類', 'Carbs'], ['protein', '蛋白質', 'Protein'], ['fat', '脂質', 'Lipids'],
              ['water', '水', 'Water'], ['mineral', '礦物質', 'Minerals'], ['vitamin', '維生素', 'Vitamins']];
  var FOODS = ['rice', 'egg', 'produce', 'banana', 'oil', 'water'];
  var SAMPLE_NAME = { starch: ['澱粉液', 'Starch'], glucose: ['葡萄糖液', 'Glucose'], sucrose: ['蔗糖液', 'Sucrose'],
                      rice: ['米飯', 'Rice'], banana: ['香蕉', 'Banana'], water: ['清水', 'Water'] };

  function setMacro(c, p, f) {
    [['carb', c], ['protein', p], ['fat', f]].forEach(function (x) { var e = $('macro-' + x[0]); if (e) e.value = x[1]; });
    NL.paintEnergy();
  }
  function setWater(v) { var e = $('water-rise'); if (e) { e.value = String(v); NL.paintWater(); } }
  function setMeals(list) { FOODS.forEach(function (id) { NL.meals[id] = 0; }); (list || []).forEach(function (id) { NL.meals[id]++; }); NL.paintMeal(); }
  function waterDetails() { var r = $('water-rise'); return r && r.closest('details'); }

  /* 每個分頁的舞台：steps = [{ zh, en, d（毫秒；lab:true 的步驟改成「等這個樣本播完」再停 dwell）, enter, acts:[[毫秒, fn]], tick(local) }]
     box：控制列放在哪個元素後面（畫面捲到這裡） */
  var STAGE = {
    0: { box: function () { return $('nutrient-focus'); }, steps: NUTS.map(function (n) {
           return { zh: n[1], en: n[2], d: 6500, enter: function () { NL.setNutrient(n[0]); } };
         }).concat([{ zh: '一份食物', en: 'One food', d: 15000, enter: function () { NL.setFood('rice'); },
           acts: FOODS.slice(1).map(function (id, k) { return [2500 * (k + 1), function () { NL.setFood(id); }]; }),
           scroll: function () { return $('food-insight'); }, how: 'center' }]) },
    1: { box: function () { return $('energy-readout') && $('energy-readout').closest('.energy-view'); }, steps: [
         { zh: '課本例', en: 'Textbook', d: 9000, enter: function () { setMacro(50, 30, 5); } },
         { zh: '三種各十克', en: '10 g each', d: 9000, enter: function () { setMacro(10, 10, 10); } },
         { zh: '燒洋芋片', en: 'Potato chip', d: 12000,
           enter: function () { var d = waterDetails(); if (d) d.open = true; setWater(0); },
           tick: function (l) { setWater(Math.round(Math.min(1, l / 6000) * 20)); },
           scroll: function () { return $('water-energy'); } }
       ] },
    2: { lab: 'iodine' }, 3: { lab: 'benedict' },
    4: { box: function () { return document.querySelector('#lesson-4 .label-lab'); }, steps: [
         { zh: '吃一份', en: 'One serving', d: 8000, enter: function () { NL.paintLabel(50); } },
         { zh: '吃整包', en: 'Whole pack', d: 9000, enter: function () { NL.paintLabel(100); } },
         { zh: '配餐盤', en: 'Build a meal', d: 13000, enter: function () { setMeals([]); },
           acts: ['rice', 'egg', 'produce', 'banana', 'water'].map(function (id, k) {
             return [1600 * (k + 1), function () { NL.meals[id]++; NL.paintMeal(); }];
           }),
           scroll: function () { return $('meal-feedback'); } }
       ] }
  };
  function labStage(kind) {
    return { box: function () { return $('lab-' + kind); }, kind: kind, steps: NL.CYCLE.map(function (id) {
      return { zh: SAMPLE_NAME[id][0], en: SAMPLE_NAME[id][1], lab: true, dwell: 2500,
               enter: function () { NL.setSample(kind, id); } };
    }) };
  }

  var T = { on: false, tab: 0, st: null, si: 0, local: 0, f: [], done: false, paused: false, last: 0, raf: 0, heldAt: null, box: null };
  var SNAP = null;

  function curStage() { return T.st; }
  function startStep(i) {
    var st = T.st; if (!st) return;
    T.si = i; T.local = 0; T.f = []; T.done = false; T.heldAt = null;
    var s = st.steps[i];
    if (s.enter) s.enter();
    if (s.tick) s.tick(0);
    var el = (s.scroll && s.scroll()) || (st.kind ? $('canvas-' + st.kind) : document.querySelector('.teach-bar[data-tab="' + T.tab + '"]'));
    if (el && el !== T.box) { T.box = el; scrollTo(el, s.how || (st.kind ? 'start' : 'end')); }
    paint();
  }
  function scrollTo(el, how) {
    if (!el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    if (r.top >= 60 && r.bottom <= window.innerHeight - 20) return;
    var y = how === 'start' ? r.top - 70 : how === 'end' ? r.bottom - window.innerHeight + 24 : r.top + r.height / 2 - window.innerHeight / 2;
    try { window.scrollTo({ top: window.pageYOffset + y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, window.pageYOffset + y); }
  }
  function enterTab(i) {
    T.tab = i; T.box = null; T.paused = false; NL.ctl.paused = false;
    var def = STAGE[i];
    T.st = def ? (def.lab ? labStage(def.lab) : def) : null;
    if (T.st) startStep(0);
    paint();
  }
  function tick() {
    if (!T.on) return;
    T.raf = requestAnimationFrame(tick);
    var now = performance.now(), dt = Math.min(100, Math.max(0, now - (T.last || now))); T.last = now;
    var intro = $('introScreen'); if (intro && !intro.hidden) dt = 0;   // 封面還在：先不推進
    if (T.paused) dt = 0;
    var st = T.st;
    if (st && !T.done && dt > 0) {
      var s = st.steps[T.si];
      T.local += dt;
      (s.acts || []).forEach(function (a, k) { if (!T.f[k] && T.local >= a[0]) { T.f[k] = 1; a[1](); } });
      if (s.tick) s.tick(T.local);
      var end;
      if (s.lab) {
        if (NL.ctl.held[st.kind] && T.heldAt == null) T.heldAt = T.local;
        end = T.heldAt != null && T.local >= T.heldAt + s.dwell;
      } else end = T.local >= s.d;
      if (end) {
        if (T.si + 1 < st.steps.length) startStep(T.si + 1);
        else { T.done = true; }
      }
    }
    paint();
  }

  /* ── 控制列 ── */
  function barHTML(st) {
    return '<button type="button" class="teach-btn" data-act="pause"></button>' +
      '<button type="button" class="teach-btn" data-act="replay"></button>' +
      '<div class="teach-track"><div class="teach-fill"></div></div>' +
      '<div class="teach-chips">' + st.steps.map(function (s, i) {
        return '<button type="button" class="teach-chip" data-i="' + i + '"><span class="teach-n">' + (i + 1) + '</span>' + tr(s.zh, s.en) + '</button>';
      }).join('') + '</div><div class="teach-note"></div>';
  }
  function stageOf(i) { var d = STAGE[i]; return d ? (d.lab ? labStage(d.lab) : d) : null; }
  function installBars() {
    if (!NL) return;
    document.querySelectorAll('.teach-bar,.lab-try').forEach(function (e) { e.remove(); });
    Object.keys(STAGE).forEach(function (k) {
      var i = +k, st = stageOf(i), sec = $('lesson-' + i); if (!st || !sec) return;
      var bar = document.createElement('div');
      bar.className = 'teach-bar'; bar.dataset.tab = String(i);
      bar.innerHTML = barHTML(st);
      bar.addEventListener('click', onBar);
      var anchor = st.box && st.box();
      if (STAGE[i].lab) {
        var kind = STAGE[i].lab, lab = $('lab-' + kind);
        var tryRow = document.createElement('div');
        tryRow.className = 'lab-try std-only'; tryRow.dataset.kind = kind;
        tryRow.innerHTML = '<span class="lab-try-k">' + tr('🧪 動手做：選一個樣本，從第 1 步做起', '🧪 Try it: pick a sample and start from step 1') + '</span>' +
          NL.CYCLE.map(function (id) { return '<button type="button" class="lab-try-btn" data-sample="' + id + '">' + tr(SAMPLE_NAME[id][0], SAMPLE_NAME[id][1]) + '</button>'; }).join('');
        tryRow.addEventListener('click', function (e) {
          var b = e.target.closest('[data-sample]'); if (!b) return;
          NL.setSample(kind, b.dataset.sample); paintTry();
        });
        lab.after(tryRow); lab.after(bar);
      } else {
        (anchor || sec.querySelector('.hook-box')).after(bar);
      }
    });
    paintTry();
    paint(true);
  }
  function paintTry() {
    document.querySelectorAll('.lab-try').forEach(function (row) {
      var s = NL.labs[row.dataset.kind].sample;
      row.querySelectorAll('[data-sample]').forEach(function (b) { b.classList.toggle('on', b.dataset.sample === s); });
    });
  }
  function paint(force) {
    document.querySelectorAll('.teach-bar').forEach(function (bar) {
      var live = T.on && T.st && String(T.tab) === bar.dataset.tab, st = live ? T.st : null;
      var note = '';
      if (live && T.paused) note = tr('⏸ 已暫停', '⏸ Paused');
      else if (live && T.done) note = tr('✔ 講解完畢；可按「從頭重播」，或點編號回到任一步', '✔ Done. Press Replay, or tap a number to revisit a step');
      var p = 0;
      if (live) {
        var n = st.steps.length, s = st.steps[T.si], frac;
        if (T.done) frac = 1;
        else if (s.lab) { var pl = NL.play[st.kind], ss = NL.STEPS[st.kind]; frac = T.heldAt != null ? 1 : Math.min(0.99, (pl.step + Math.min(1, pl.t / ss[pl.step].dur)) / ss.length); }
        else frac = Math.min(1, T.local / s.d);
        p = Math.round(((T.done ? n : T.si) + (T.done ? 0 : frac)) / n * 100);
      }
      var pauseTxt = T.paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause');
      var sig = [note, p, pauseTxt, live, T.si, T.done, document.documentElement.lang].join('|');
      if (!force && bar._sig === sig) return;
      bar._sig = sig;
      var pb = bar.querySelector('[data-act="pause"]'), rb = bar.querySelector('[data-act="replay"]');
      pb.textContent = pauseTxt; pb.disabled = !live || T.done;
      rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', !!(live && T.done));
      bar.querySelector('.teach-fill').style.width = p + '%';
      bar.querySelector('.teach-note').textContent = note;
      bar.querySelectorAll('.teach-chip').forEach(function (c) {
        var i = +c.dataset.i;
        c.classList.toggle('on', !!(live && i === T.si && !T.done));
        c.classList.toggle('past', !!(live && (i < T.si || (T.done && i === T.si))));
      });
    });
  }
  function onBar(e) {
    if (!T.on || String(T.tab) !== e.currentTarget.dataset.tab) return;
    var chip = e.target.closest('.teach-chip');
    if (chip) { T.paused = false; NL.ctl.paused = false; startStep(+chip.dataset.i); return; }
    var b = e.target.closest('.teach-btn'); if (!b) return;
    if (b.dataset.act === 'pause') { if (!T.done) { T.paused = !T.paused; NL.ctl.paused = T.paused; } }
    else { T.paused = false; NL.ctl.paused = false; T.box = null; startStep(0); }
    paint();
  }

  /* ── 進出老師模式：記下／還原原本的樣子 ── */
  function snapshot() {
    var g = NL.getState(), d = waterDetails();
    SNAP = { nutrient: g.nutrient, food: g.food, serving: g.serving,
             macro: ['carb', 'protein', 'fat'].map(function (id) { return $('macro-' + id).value; }),
             water: $('water-rise').value, open: !!(d && d.open),
             meals: FOODS.reduce(function (o, id) { o[id] = NL.meals[id]; return o; }, {}),
             samples: { iodine: NL.labs.iodine.sample, benedict: NL.labs.benedict.sample } };
  }
  function restore() {
    var s = SNAP; if (!s) return;
    NL.setNutrient(s.nutrient); NL.setFood(s.food); NL.paintLabel(s.serving);
    setMacro(s.macro[0], s.macro[1], s.macro[2]); setWater(s.water);
    var d = waterDetails(); if (d) d.open = s.open;
    FOODS.forEach(function (id) { NL.meals[id] = s.meals[id]; }); NL.paintMeal();
    ['iodine', 'benedict'].forEach(function (k) { NL.labs[k].sample = s.samples[k]; });
    var kind = { 2: 'iodine', 3: 'benedict' }[NL.getState().tab];
    if (kind) NL.jump(kind, 0);
    paintTry();
  }
  window.setMode = function (m) {
    var teacher = m === 'teacher';
    if (teacher === T.on || !NL) return;
    $('mode-student').classList.toggle('active', !teacher); $('mode-student').setAttribute('aria-pressed', String(!teacher));
    $('mode-teacher').classList.toggle('active', teacher); $('mode-teacher').setAttribute('aria-pressed', String(teacher));
    document.body.classList.toggle('mode-teacher', teacher);
    if (teacher) {
      snapshot();
      NL.ctl.mode = 'sample'; NL.ctl.paused = false;
      T.on = true; T.last = 0; enterTab(NL.getState().tab);
      cancelAnimationFrame(T.raf); T.raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(T.raf); T.on = false; T.paused = false; T.st = null;
      NL.ctl.mode = 'step'; NL.ctl.paused = false;
      restore(); paint(true);
    }
  };

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.mode-bar{display:flex;flex-direction:column;align-items:center;gap:8px;margin:0 0 18px}',
      '.mode-bar .mode-row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}',
      '.mode-pill{min-height:52px;padding:8px 26px;border-radius:999px;cursor:pointer;font-size:21px;font-weight:700;font-family:inherit;line-height:1.3;background:transparent;color:#cfd8cf;border:2px dashed rgba(242,236,217,.35);touch-action:manipulation;transition:all .2s}',
      '.mode-pill:hover:not(.active){background:rgba(255,255,255,.08);color:#f2ecd9}',
      '.mode-pill.active{background:#fde047;color:#11261f;border:2px solid #fde047;box-shadow:0 0 14px rgba(253,224,71,.35)}',
      '.mode-hint{font-size:17px;color:#cfd8cf;text-align:center;line-height:1.5;max-width:900px}',
      '.teach-bar{display:none;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;background:rgba(13,32,26,.72);border:2px solid rgba(242,236,217,.25);border-radius:12px;padding:14px 18px 16px;margin:12px 0 16px}',
      'body.mode-teacher .teach-bar{display:flex}',
      'body.mode-teacher .std-only{display:none!important}',
      '.teach-btn{min-height:42px;padding:6px 16px;border-radius:8px;cursor:pointer;font-size:17px;font-weight:700;font-family:inherit;background:transparent;color:#4ade80;border:2px solid #4ade80;touch-action:manipulation}',
      '.teach-btn:hover:not(:disabled){background:#4ade80;color:#11261f}.teach-btn:disabled{opacity:.4;cursor:not-allowed}',
      '.teach-btn.hot{background:#fde047;color:#11261f;border-color:#fde047}',
      '.teach-track{flex:1 1 180px;min-width:120px;height:10px;border-radius:6px;background:rgba(255,255,255,.14);overflow:hidden}',
      '.teach-fill{height:100%;width:0;background:#fde047;border-radius:6px;transition:width .35s linear}',
      '.teach-chips{flex:1 1 100%;display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
      '.teach-chip{min-height:40px;padding:4px 12px;border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;font-family:inherit;background:transparent;color:#cfd8cf;border:2px dashed rgba(242,236,217,.3);touch-action:manipulation}',
      '.teach-chip .teach-n{display:inline-block;min-width:1.2em;margin-right:2px}',
      '.teach-chip.past{color:#4ade80;border-color:rgba(74,222,128,.55)}',
      '.teach-chip.on{background:#fde047;color:#11261f;border:2px solid #fde047;box-shadow:0 0 12px rgba(253,224,71,.4)}',
      '.teach-note{flex:1 1 100%;text-align:center;font-size:17px;color:#fde047;min-height:1.4em}',
      '.lab-try{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin:12px 0 16px;padding:12px 14px;border:2px dashed rgba(85,233,255,.45);border-radius:12px;background:rgba(85,233,255,.06)}',
      '.lab-try-k{flex:1 1 100%;text-align:center;font-size:18px;font-weight:700;color:#55e9ff}',
      '.lab-try-btn{min-height:42px;padding:6px 16px;border-radius:999px;cursor:pointer;font-size:17px;font-weight:700;font-family:inherit;background:transparent;color:#f2ecd9;border:2px solid rgba(242,236,217,.4);touch-action:manipulation}',
      '.lab-try-btn.on{background:#55e9ff;color:#11261f;border-color:#55e9ff}',
      '@media (max-width:520px){.mode-pill{padding:8px 16px;font-size:18px}.teach-bar{padding:12px 10px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function init() {
    NL = window.NutrientsLesson;
    if (!NL || !NL.ctl) return;
    css();
    installBars();
    document.addEventListener('nutrients:built', installBars);
    document.addEventListener('nutrients:tab', function (e) { if (T.on) enterTab(e.detail); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && T.on) { T.last = 0; } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.NutrientsTeach = { T: T, STAGE: STAGE, enterTab: enterTab };
})();

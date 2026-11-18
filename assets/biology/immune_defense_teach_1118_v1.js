/* biology_immune_defense · 老師講解模式＋有聲講解的場景 API（外層加法，2026-11-18）
 * 不改任何繪圖與動畫：只會「點」頁面原本的控制鈕（#controls 裡的 data-key／data-value），
 * 讓學生操作與老師講解、有聲講解共用同一組畫面狀態。學生操作模式完全照原樣。
 *
 * 分頁與子頁對照（給 build_lesson.py 檢查用，請勿刪）：
 *   data-tab="barrier" data-tab="phagocytosis" data-tab="inflammation" data-tab="antibody" data-tab="memory"
 *   data-sub="intact" data-sub="wound" data-sub="mucosa"
 *   data-sub="s0" data-sub="s1" data-sub="s2" data-sub="s3" data-sub="s4" data-sub="s5"
 *   data-sub="base" data-sub="dil" data-sub="perm" data-sub="rec" data-sub="all"
 *   data-sub="sym0" data-sub="sym1" data-sub="sym2" data-sub="sym3"
 *   data-sub="tips" data-sub="ibind" data-sub="bind" data-sub="assist"
 *   data-sub="first" data-sub="recall" data-sub="other"
 */
(function () {
  'use strict';

  // 子頁＝一組控制鈕的設定（key 與 value 必須和 immune_defense_1014_v1.js 的 controls 相同）
  var PRESET = {
    barrier: {
      intact: [['scenario', 'intact'], ['observe', 'auto']],
      wound: [['scenario', 'wound'], ['observe', 'auto']],
      mucosa: [['scenario', 'mucosa'], ['observe', 'auto']]
    },
    phagocytosis: {
      s0: [['stage', 0]], s1: [['stage', 1]], s2: [['stage', 2]],
      s3: [['stage', 3]], s4: [['stage', 4]], s5: [['stage', 5]]
    },
    inflammation: {
      base: [['mechanism', 0]], dil: [['mechanism', 1]], perm: [['mechanism', 2]],
      rec: [['mechanism', 3]], all: [['mechanism', 4]],
      sym0: [['mechanism', 4], ['symptom', 0]], sym1: [['mechanism', 4], ['symptom', 1]],
      sym2: [['mechanism', 4], ['symptom', 2]], sym3: [['mechanism', 4], ['symptom', 3]]
    },
    antibody: {
      tips: [['antigen', 0], ['antibody', 0]],
      ibind: [['antigen', 0], ['antibody', 1], ['dockAction', 'bind']],
      bind: [['antigen', 0], ['antibody', 0], ['dockAction', 'bind']],
      assist: [['antigen', 0], ['antibody', 0], ['dockAction', 'bind'], ['dockAction', 'assist']]
    },
    memory: {
      first: [['memoryCase', 0], ['moment', 'auto']],
      recall: [['memoryCase', 1], ['moment', 'auto']],
      other: [['memoryCase', 2], ['moment', 'auto']]
    }
  };

  // 老師講解：連續播放的順序與每一段停留的毫秒數
  var SEQ = [];
  function add(tab, sub, ms) { SEQ.push({ tab: tab, sub: sub, ms: ms }); }
  ['intact', 'wound', 'mucosa'].forEach(function (s) { add('barrier', s, 9000); });
  ['s0', 's1', 's2', 's3', 's4', 's5'].forEach(function (s) { add('phagocytosis', s, 6500); });
  ['base', 'dil', 'perm', 'rec', 'all'].forEach(function (s) { add('inflammation', s, 6000); });
  ['sym0', 'sym1', 'sym2', 'sym3'].forEach(function (s) { add('inflammation', s, 5000); });
  ['tips', 'ibind', 'bind', 'assist'].forEach(function (s) { add('antibody', s, 7500); });
  ['first', 'recall', 'other'].forEach(function (s) { add('memory', s, 12000); });

  // 步驟列（最多五顆）：每顆跳到該組第一段，之後接著連播
  var STEPBAR = {
    barrier: [['完整皮膚', 'intact'], ['局部破損', 'wound'], ['呼吸道黏膜', 'mucosa']],
    phagocytosis: [['組織', 's0'], ['移出血管', 's1'], ['接近', 's2'], ['包圍', 's3'], ['吞入與分解', 's4']],
    inflammation: [['平常', 'base'], ['血管擴張', 'dil'], ['通透性', 'perm'], ['聚集', 'rec'], ['整合', 'all']],
    antibody: [['不相容', 'ibind'], ['嘗試結合', 'bind'], ['協助清除', 'assist'], ['沒有結合', 'tips']],
    memory: [['初次遇甲', 'first'], ['有記憶再遇甲', 'recall'], ['改遇乙', 'other']]
  };
  var TAB_LABEL = { barrier: '病原體，先擋在外面', phagocytosis: '傷口裡，白血球正在做什麼？', inflammation: '紅腫熱痛，圖上看原因', antibody: '防禦也會認得對手', memory: '疫苗，讓身體先練習' };

  var T = { on: false, paused: false, idx: 0, t: 0, raf: 0, last: 0, total: 0 };
  SEQ.forEach(function (x) { T.total += x.ms; });

  function $(id) { return document.getElementById(id); }
  function lb() { return window.LivingBook; }
  function unit() { return lb() && lb().modules && lb().modules.immune; }
  function tabIndex(id) {
    var u = unit(); if (!u) return -1;
    for (var i = 0; i < u.tabs.length; i++) if (u.tabs[i].id === id) return i;
    return -1;
  }
  function state() { return lb() && lb().getState ? lb().getState() : null; }

  function dismissCover() {
    var intro = $('introScreen');
    if (intro && !intro.hidden) { intro.click(); if (!intro.hidden) intro.hidden = true; }
  }
  function clickCtl(key, value) {
    var want = JSON.stringify(value), btns = document.querySelectorAll('#controls button[data-key]');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].dataset.key === key && btns[i].dataset.value === want) { btns[i].click(); return true; }
    }
    return false;
  }
  // 切到某分頁，再依子頁設定點選控制鈕；畫面與學生自己點的結果一樣
  function goto(tab, sub) {
    var idx = tabIndex(tab), clicks = PRESET[tab] && PRESET[tab][sub];
    if (idx < 0 || !clicks) return false;
    dismissCover();
    if (lb().getTab().id !== tab) lb().setTab(idx);
    clicks.forEach(function (c) { clickCtl(c[0], c[1]); });
    var s = state(); if (s) s.running = true;
    return true;
  }

  // ── 老師講解 ──
  function locate(i) { return SEQ[i]; }
  function firstIndexOf(tab, sub) {
    for (var i = 0; i < SEQ.length; i++) if (SEQ[i].tab === tab && SEQ[i].sub === sub) return i;
    return 0;
  }
  function elapsedBefore(i) { var s = 0; for (var k = 0; k < i; k++) s += SEQ[k].ms; return s; }
  function enter(i) {
    var x = SEQ[i]; goto(x.tab, x.sub); T.idx = i; T.t = 0;
    var s = state(); if (s) s.running = !T.paused;
    paintBar();
  }
  function frame(now) {
    if (!T.on) return;
    if (!T.last) T.last = now;
    var dt = now - T.last; T.last = now;
    if (!T.paused) {
      T.t += dt;
      if (T.t >= SEQ[T.idx].ms) {
        if (T.idx + 1 >= SEQ.length) { T.paused = true; var s = state(); if (s) s.running = false; paintBar(); T.raf = 0; return; }
        enter(T.idx + 1);
      }
    }
    paintBar();
    T.raf = requestAnimationFrame(frame);
  }

  var bar = null;
  function buildBar() {
    bar = document.createElement('div');
    bar.id = 'teachBar'; bar.className = 'teach-bar'; bar.hidden = true;
    bar.innerHTML = '<div class="teach-row"><button type="button" id="teachPlay">⏸ 暫停</button>' +
      '<button type="button" id="teachRestart">↺ 從頭重播</button><span id="teachTab" class="teach-tab"></span></div>' +
      '<div class="teach-steps" id="teachSteps"></div>' +
      '<div class="teach-track"><div id="teachFill" class="teach-fill"></div></div>';
    bar.querySelector('#teachPlay').addEventListener('click', togglePause);
    bar.querySelector('#teachRestart').addEventListener('click', function () { T.paused = false; T.last = 0; enter(0); T.raf = T.raf || requestAnimationFrame(frame); });
    var bench = $('bench');
    if (bench) bench.insertBefore(bar, bench.querySelector('.workspace'));
  }
  function togglePause() {
    T.paused = !T.paused;
    var s = state(); if (s) s.running = !T.paused;
    if (!T.paused) T.last = 0;
    paintBar();
  }
  function paintBar() {
    if (!bar) return;
    var x = SEQ[T.idx], tab = x && x.tab;
    var pb = $('teachPlay'); if (pb) pb.textContent = T.paused ? '▶ 繼續' : '⏸ 暫停';
    var tt = $('teachTab'); if (tt) tt.textContent = tab ? TAB_LABEL[tab] : '';
    var steps = $('teachSteps');
    if (steps && steps.dataset.tab !== tab) {
      steps.dataset.tab = tab; steps.replaceChildren();
      (STEPBAR[tab] || []).forEach(function (pair, k) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'teach-step'; b.textContent = (k + 1) + ' ' + pair[0];
        b.addEventListener('click', function () { T.paused = false; enter(firstIndexOf(tab, pair[1])); T.raf = T.raf || requestAnimationFrame(frame); });
        steps.appendChild(b);
      });
    }
    if (steps) Array.prototype.forEach.call(steps.children, function (b, k) {
      b.classList.toggle('on', STEPBAR[tab][k][1] === x.sub);
    });
    var fill = $('teachFill');
    if (fill) fill.style.width = Math.min(100, (elapsedBefore(T.idx) + T.t) / T.total * 100) + '%';
  }

  function startTeacher() {
    if (window.ImmuneVoiceBusy) return false;
    if (T.on) return true;
    if (!bar) buildBar();
    T.on = true; T.paused = false; T.last = 0;
    document.body.classList.add('mode-teacher');
    bar.hidden = false;
    setModeButtons('teacher');
    enter(0);
    T.raf = requestAnimationFrame(frame);
    return true;
  }
  function stopTeacher() {
    if (!T.on) return;
    T.on = false;
    if (T.raf) cancelAnimationFrame(T.raf); T.raf = 0;
    document.body.classList.remove('mode-teacher');
    if (bar) bar.hidden = true;
    var s = state(); if (s) s.running = true;
    setModeButtons('student');
  }
  function setModeButtons(mode) {
    var st = $('mode-student'), te = $('mode-teacher');
    if (st) { st.classList.toggle('active', mode === 'student'); st.setAttribute('aria-pressed', mode === 'student' ? 'true' : 'false'); }
    if (te) { te.classList.toggle('active', mode === 'teacher'); te.setAttribute('aria-pressed', mode === 'teacher' ? 'true' : 'false'); }
  }

  function init() {
    var st = $('mode-student'), te = $('mode-teacher');
    if (st) st.addEventListener('click', stopTeacher);
    if (te) te.addEventListener('click', startTeacher);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.ImmuneLesson = {
    goto: goto,
    startTeacher: startTeacher,
    stopTeacher: stopTeacher,
    isTeacher: function () { return T.on; },
    preset: PRESET,
    seq: SEQ,
    label: TAB_LABEL
  };
})();

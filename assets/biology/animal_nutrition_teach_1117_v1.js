/* biology_animal_nutrition：✋ 學生操作／👩‍🏫 老師講解 雙模式（外層加法，AGENTS 10.6／10.7）
 * 動畫引擎 animal_nutrition_story_1012_v2.js 的畫面全是「第 k 項、已播 elapsed 秒」的純函式（window.AnimalStory）；本檔只管「什麼時候停」：
 * - 學生操作：一次播一組步驟（一個步驟編號），播完停在最後一幀，不循環、不自己接下一組；
 *   另外每個分頁有「動手做」：自己點一個器官／消化腺／養分，從頭播那一項、播完停住。
 * - 老師講解：按一下就從這一頁的開頭連續播到底（組與組之間不停、不循環）；可暫停、從頭重播，點上面的步驟編號跳到那一組。
 * - 做法：把 AnimalStory.state.elapsed 換成有「停點」的存取器——引擎每一格 `s.elapsed += dt`，走到停點就夾在「結束前 0.04 秒」並把 playing 關掉；
 *   不改任何繪圖、場景、文字、秒數，也不另開動畫迴圈。離開老師模式時畫面還原成按下去那一刻的樣子。
 * - 有聲講解（biology_animal_nutrition_voice_v1.js）用 AnimalModes.show(page, k)：播第 k 項並停在它的最後一幀。
 */
(function () {
  'use strict';
  var AS = null, S = null;
  var C = { mode: 'student', pick: null, snap: null, holdSec: null };
  var $ = function (id) { return document.getElementById(id); };
  var tr = function (zh, en) { return S && S.lang === 'en' ? en : zh; };

  /* 動手做：每個分頁的選項。[SEQ 第幾項, 中文, 英文]；播那一項、播完停住 */
  var PICKS = {
    0: [
      { zh: '🧪 動手做：點一個器官，看食物在那裡做什麼', en: '🧪 Try it: tap an organ to see what happens to food there',
        items: [[8, '口腔', 'Mouth'], [9, '咽', 'Pharynx'], [10, '食道', 'Esophagus'], [11, '胃', 'Stomach'],
                [12, '小腸', 'Small intestine'], [13, '大腸', 'Large intestine'], [14, '直腸', 'Rectum'], [15, '肛門', 'Anus']] },
      { zh: '🧪 動手做：點一個消化腺，看它送出什麼', en: '🧪 Try it: tap a gland to see what it supplies',
        items: [[17, '唾腺', 'Salivary glands'], [18, '肝臟', 'Liver'], [19, '膽囊', 'Gallbladder'], [20, '胰臟', 'Pancreas']] }
    ],
    1: [
      { zh: '🧪 動手做：點一個消化腺，看它在小腸的作用', en: '🧪 Try it: tap a gland to see its job in the small intestine',
        items: [[13, '肝臟', 'Liver'], [14, '膽囊', 'Gallbladder'], [15, '胰臟', 'Pancreas']] },
      { zh: '🧪 動手做：選一種分子，看它能不能穿過腸壁', en: '🧪 Try it: pick a molecule and see if it can cross the gut wall',
        items: [[21, '葡萄糖', 'Glucose'], [22, '胺基酸', 'Amino acid'], [23, '完整澱粉', 'Whole starch'], [24, '完整蛋白質', 'Whole protein']] }
    ]
  };

  function limitK() {            // 目前這一輪最多播到第幾項（播完那一項就停）
    if (C.pick != null) return C.pick;
    if (C.mode === 'teacher') return AS.SEQ[S.page].length - 1;
    var g = AS.GROUPS[S.page].filter(function (g) { return S.k >= g.a && S.k <= g.b; })[0];
    return g ? g.b : S.k;
  }
  function hookElapsed() {
    var el = S.elapsed;
    Object.defineProperty(S, 'elapsed', {
      configurable: true, enumerable: true,
      get: function () { return el; },
      set: function (v) {
        if (v > 0) {
          var it = AS.SEQ[S.page][S.k];
          // 有聲講解：停在指定秒數（playing 維持 true，這樣「真的血球在流動」那段實拍影片停點內仍會播）
          if (C.holdSec != null && S.k === C.pick) { if (v >= C.holdSec) { el = C.holdSec; return; } }
          else if (it && v >= it.sec && S.k === limitK()) { el = Math.max(0, it.sec - 0.04); S.playing = false; return; }
        }
        el = v;
      }
    });
  }
  function atEnd() {  // 這一輪是不是已經播完、停在最後一幀
    var it = AS.SEQ[S.page][S.k];
    return !S.playing && it && S.elapsed >= it.sec - 0.05 && S.k === limitK();
  }

  function playItem(page, k, pick, frac, holdFrac) {     // 播第 k 項（從 frac 處開始，預設從頭）；pick＝只播這一項、播完停住
    if (S.page !== page) AS.switchPage(page);
    C.pick = pick ? k : null;
    C.holdSec = null;
    AS.apply(k);
    if (pick && (frac > 0 || holdFrac != null)) {   // 有聲講解：從一項的中途開始，並停在指定位置（用在「吸收→運送→利用」三段）
      var sec = AS.SEQ[page][k].sec;
      C.holdSec = Math.max(0, (holdFrac == null ? 1 : holdFrac) * sec - 0.04);
      S.elapsed = Math.min(C.holdSec, (frac || 0) * sec);
    }
    AS.render(); AS.schedule();
  }

  /* ── 畫面補件：每次引擎重畫（#lessons 整個重建）後，把控制列與動手做放回去 ── */
  function totalSec() { var t = 0; AS.SEQ[S.page].forEach(function (v) { t += v.sec; }); return t; }
  function nowSec() { var t = 0, i; for (i = 0; i < S.k; i++) t += AS.SEQ[S.page][i].sec; return t + Math.min(S.elapsed, AS.SEQ[S.page][S.k].sec); }

  function install() {
    var lab = $('story-lab'), sec = $('story-lesson');
    if (!lab || !sec) return;
    // 說明文字：依模式改（引擎原本寫「會自動播放並重複」，現在已不重複）
    var hint = lab.querySelector('.story-overview-hint');
    if (hint) hint.textContent = C.mode === 'teacher'
      ? tr('老師講解：從這一頁的開頭連續播放；可暫停、重播，點步驟編號跳到那一步。', 'Teacher tour: plays this tab straight through; pause, replay, or tap a step number to jump.')
      : tr('動畫一次播一步，播完就停；點步驟編號看下一步，想自己挑就用下面的「動手做」。', 'One step plays, then it stops. Tap a step number for the next one, or use "Try it" below.');
    // 老師講解控制列
    var ctl = lab.querySelector('.an-controls');
    if (ctl && !ctl.querySelector('.teach-bar')) {
      var bar = document.createElement('div');
      bar.className = 'teach-bar';
      bar.innerHTML = '<button type="button" class="teach-btn" data-act="pause"></button><button type="button" class="teach-btn" data-act="replay"></button>' +
        '<div class="teach-track"><div class="teach-fill"></div></div><div class="teach-note"></div>';
      bar.addEventListener('click', onBar);
      var sb = ctl.querySelector('.story-bar');
      if (sb) sb.after(bar); else ctl.prepend(bar);
    }
    // 學生「動手做」
    sec.querySelectorAll('.an-try').forEach(function (e) { e.remove(); });
    var anchor = lab, rows = PICKS[S.page] || [];
    rows.forEach(function (row) {
      var d = document.createElement('div');
      d.className = 'lab-try an-try std-only';
      d.innerHTML = '<span class="lab-try-k">' + tr(row.zh, row.en) + '</span>' + row.items.map(function (it) {
        return '<button type="button" class="lab-try-btn' + (C.pick === it[0] && S.k === it[0] ? ' on' : '') + '" data-pick="' + it[0] + '">' + tr(it[1], it[2]) + '</button>';
      }).join('');
      d.addEventListener('click', onPick);
      anchor.after(d); anchor = d;
    });
    paint(true);
  }
  function onPick(e) {
    var b = e.target.closest('[data-pick]'); if (!b || C.mode !== 'student') return;
    playItem(S.page, +b.dataset.pick, true);
    var cv = $('storyScene');
    if (cv) { var r = cv.getBoundingClientRect(); if (r.top < 10 || r.bottom > window.innerHeight - 10) { try { cv.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) { cv.scrollIntoView(); } } }
  }
  function onBar(e) {
    if (C.mode !== 'teacher') return;
    var b = e.target.closest('.teach-btn'); if (!b) return;
    if (b.dataset.act === 'pause') { if (!atEnd()) { S.playing = !S.playing; AS.draw(); } }
    else { C.pick = null; AS.apply(0); AS.render(); AS.schedule(); }
    paint(true);
  }
  var lastSig = '';
  function paint(force) {
    var bar = document.querySelector('.teach-bar'); if (!bar) return;
    var live = C.mode === 'teacher', done = live && atEnd(), paused = live && !S.playing && !done;
    var p = live ? Math.round(Math.min(1, nowSec() / totalSec()) * 100) : 0;
    var sig = [live, done, paused, p, S.lang, S.page].join('|');
    if (!force && sig === lastSig && bar._painted) return;
    lastSig = sig; bar._painted = true;
    var pb = bar.querySelector('[data-act="pause"]'), rb = bar.querySelector('[data-act="replay"]');
    pb.textContent = paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause');
    pb.disabled = !live || done;
    rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', done);
    bar.querySelector('.teach-fill').style.width = p + '%';
    bar.querySelector('.teach-note').textContent = paused ? tr('⏸ 已暫停', '⏸ Paused') : done ? tr('✔ 講解完畢；可按「從頭重播」，或點步驟編號回到任一組', '✔ Done. Press Replay, or tap a step number to revisit a part') : '';
  }
  function loop() { paint(false); requestAnimationFrame(loop); }

  /* ── 進出老師模式 ── */
  window.setMode = function (m) {
    var teacher = m === 'teacher';
    if (!S || teacher === (C.mode === 'teacher')) return;
    $('mode-student').classList.toggle('active', !teacher); $('mode-student').setAttribute('aria-pressed', String(!teacher));
    $('mode-teacher').classList.toggle('active', teacher); $('mode-teacher').setAttribute('aria-pressed', String(teacher));
    document.body.classList.toggle('mode-teacher', teacher);
    if (teacher) {
      C.snap = { page: S.page, k: S.k };
      C.mode = 'teacher'; C.pick = null;
      AS.apply(0); AS.render(); AS.schedule();
    } else {
      C.mode = 'student'; C.pick = null;
      var s = C.snap || { page: S.page, k: 0 }; C.snap = null;
      if (S.page !== s.page) AS.switchPage(s.page);
      AS.apply(s.k); AS.render(); AS.schedule();
    }
  };

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.mode-bar{display:flex;flex-direction:column;align-items:center;gap:8px;margin:18px 0 18px}',
      '.mode-bar .mode-row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}',
      '.mode-pill{min-height:52px;padding:8px 26px;border-radius:999px;cursor:pointer;font-size:21px;font-weight:700;font-family:inherit;line-height:1.3;background:transparent;color:#cfd8cf;border:2px dashed rgba(242,236,217,.35);touch-action:manipulation;transition:all .2s}',
      '.mode-pill:hover:not(.active){background:rgba(255,255,255,.08);color:#f2ecd9}',
      '.mode-pill.active{background:#fde047;color:#11261f;border:2px solid #fde047;box-shadow:0 0 14px rgba(253,224,71,.35)}',
      '.mode-hint{font-size:17px;color:#cfd8cf;text-align:center;line-height:1.5;max-width:900px}',
      '.teach-bar{display:none;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;background:rgba(13,32,26,.72);border:2px solid rgba(242,236,217,.25);border-radius:12px;padding:8px 12px 10px;margin:6px 0 6px}',
      'body.mode-teacher .teach-bar{display:flex}',
      'body.mode-teacher .std-only{display:none!important}',
      '.teach-btn{min-height:38px;padding:3px 14px;border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;font-family:inherit;background:transparent;color:#4ade80;border:2px solid #4ade80;touch-action:manipulation;white-space:nowrap}',
      '.teach-btn:hover:not(:disabled){background:#4ade80;color:#11261f}.teach-btn:disabled{opacity:.4;cursor:not-allowed}',
      '.teach-btn.hot{background:#fde047;color:#11261f;border-color:#fde047}',
      '.teach-track{flex:1 1 140px;min-width:100px;height:10px;border-radius:6px;background:rgba(255,255,255,.14);overflow:hidden}',
      '.teach-fill{height:100%;width:0;background:#fde047;border-radius:6px}',
      '.teach-note{flex:1 1 100%;text-align:center;font-size:16px;color:#fde047;min-height:0}',
      '.teach-note:empty{display:none}',
      '.lab-try{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin:12px 0 8px;padding:12px 14px;border:2px dashed rgba(85,233,255,.45);border-radius:12px;background:rgba(85,233,255,.06)}',
      '.lab-try-k{flex:1 1 100%;text-align:center;font-size:18px;font-weight:700;color:#55e9ff}',
      '.lab-try-btn{min-height:42px;padding:6px 16px;border-radius:999px;cursor:pointer;font-size:17px;font-weight:700;font-family:inherit;background:transparent;color:#f2ecd9;border:2px solid rgba(242,236,217,.4);touch-action:manipulation}',
      '.lab-try-btn:hover:not(.on){background:rgba(255,255,255,.08)}',
      '.lab-try-btn.on{background:#55e9ff;color:#11261f;border-color:#55e9ff}',
      'body.an-expanded .an-try{display:none}',
      '@media (max-width:520px){.mode-pill{padding:8px 16px;font-size:18px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function init() {
    AS = window.AnimalStory;
    if (!AS || !AS.state) return;
    S = AS.state;
    css(); hookElapsed();
    // 換步驟編號／換分頁：不再是「只播這一項」
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-action="jump"],[data-action="page"]')) { C.pick = null; C.holdSec = null; }
    }, true);
    new MutationObserver(install).observe($('lessons'), { childList: true });
    install();
    requestAnimationFrame(loop);
  }
  window.AnimalModes = { C: C,
    show: function (page, k, frac, holdFrac) { if (S) playItem(page, k, true, frac, holdFrac); },
    release: function () { C.pick = null; C.holdSec = null; }, atEnd: function () { return S ? atEnd() : false; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

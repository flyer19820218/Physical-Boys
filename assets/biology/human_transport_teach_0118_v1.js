/* biology_human_transport：✋ 學生操作／👩‍🏫 老師講解（外層加法，AGENTS 10.6／10.7）
 * 只用引擎公開的 window.LivingBook（getTab／getState／setTab／action）；不改繪圖、數值、題目與實驗。
 * - 學生操作：進分頁自動播第 1 步，播完停住；按步驟編號＝播那一步一次後停住；
 *   下面原本的控制鈕（情境、根毛、蒸散條件、染液預測與下一步、整株路線…）仍可動手，按了播一輪再停。
 *   原本的「暫停動畫」鈕在 CSS 隱藏（步驟鈕負責播放）。
 * - 老師講解：進分頁從第 1 步連播到最後一步（步驟之間停 1.5 秒）；可暫停、從頭重播、點編號跳步；分頁之間不自動跳。
 * - 有聲講解：語音用 window.HTLesson.show(分頁, 步驟, 段) 切畫面，動畫循環播放，不自己停。
 * 有聲講解的分頁代號（tools/voice/lesson_studio/lessons/biology_plant_transport.json 的 tab_check 會來這裡找）：
 *   data-tab="sourceSink" data-tab="rootHair" data-tab="transpiration" data-tab="celeryLab" data-tab="wholePlant"
 */
(function () {
  'use strict';
  var SEG = 10;        // 每段動畫的秒數（引擎 elapsed 的單位）
  var GAP = 1.5;       // 老師講解：步驟之間停頓秒數
  var ORDER = ['heart', 'vessels', 'blood', 'circulation', 'lymph', 'experiment'];

  /* 步驟表：每個分頁最多 5 步；每步由一或多段組成（段的 ops 依序呼叫引擎的 action(key, value)） */
  var TABS = {
    heart: [
      { zh: '心臟與四個腔室', en: 'Heart and four chambers', segs: [{ ops: [['view', 'heart'], ['part', 'lv']], dur: SEG }] },
      { zh: '瓣膜醫學動畫', en: 'Two-valve medical animation', segs: [{ ops: [['view', 'medical']], dur: SEG }] },
      { zh: '充血與心房收縮', en: 'Filling and atrial contraction', segs: [
        { ops: [['view', 'heart'], ['phase', 0]], dur: SEG },
        { ops: [['phase', 1]], dur: SEG }
      ] },
      { zh: '心室射血與轉為舒張', en: 'Ejection and early relaxation', segs: [
        { ops: [['phase', 2]], dur: SEG },
        { ops: [['phase', 3]], dur: SEG }
      ] },
      { zh: '房室瓣與半月瓣', en: 'AV and semilunar valves', segs: [
        { ops: [['part', 'av']], dur: SEG },
        { ops: [['part', 'sl']], dur: SEG }
      ] }
    ],
    vessels: [
      { zh: '三種血管構造', en: 'Three vessel anatomies', segs: [{ ops: [['view', 'atlas'], ['vessel', 'artery']], dur: SEG }] },
      { zh: '動脈：離開心臟', en: 'Artery: away from the heart', segs: [{ ops: [['vessel', 'artery'], ['circuit', 'body']], dur: SEG }] },
      { zh: '微血管：單列慢行', en: 'Capillary: single file, slow', segs: [{ ops: [['view', 'capillary'], ['vessel', 'capillary']], dur: SEG }] },
      { zh: '靜脈：瓣膜與肌肉', en: 'Vein: valves and muscles', segs: [
        { ops: [['view', 'atlas'], ['vessel', 'vein'], ['squeeze', false]], dur: SEG },
        { ops: [['squeeze', true]], dur: SEG }
      ] },
      { zh: '動靜脈切片與肺循環', en: 'Vessel sections and pulmonary circuit', segs: [
        { ops: [['view', 'micrograph'], ['circuit', 'lung']], dur: SEG }
      ] }
    ],
    blood: [
      { zh: '原圖血抹片', en: 'Original blood smear', segs: [{ ops: [['view', 'smear'], ['component', 'rbc']], dur: SEG }] },
      { zh: '紅血球與白血球', en: 'Red and white cells', segs: [
        { ops: [['view', 'focus'], ['component', 'rbc']], dur: SEG },
        { ops: [['component', 'wbc']], dur: SEG }
      ] },
      { zh: '血小板：止血的碎片', en: 'Platelets: clotting fragments', segs: [{ ops: [['component', 'platelet']], dur: SEG }] },
      { zh: '離心分層', en: 'Centrifugation', segs: [{ ops: [['component', 'plasma'], ['action', 'separate']], dur: SEG }] },
      { zh: '局部止血', en: 'Local clotting', segs: [{ ops: [['action', 'repair']], dur: SEG }] }
    ],
    circulation: [
      { zh: '完整封閉路線', en: 'Complete closed circuit', segs: [{ ops: [['view', 'loop'], ['station', 0]], dur: SEG }] },
      { zh: '組織交換窗', en: 'Tissue exchange', segs: [{ ops: [['exchange', 'tissue']], dur: SEG }] },
      { zh: '肺部交換', en: 'Lung exchange', segs: [
        { ops: [['exchange', 'lung'], ['lungView', 'gas']], dur: SEG },
        { ops: [['lungView', 'cells']], dur: SEG }
      ] },
      { zh: '心肌、肝臟與腎臟', en: 'Heart, liver and kidney', segs: [
        { ops: [['exchange', 'heart']], dur: SEG },
        { ops: [['exchange', 'liver']], dur: SEG },
        { ops: [['exchange', 'kidney'], ['kidneyView', 'cells']], dur: SEG }
      ] },
      { zh: '小腸絨毛：葡萄糖進血', en: 'Villi: glucose enters blood', segs: [{ ops: [['exchange', 'intestine']], dur: SEG }] }
    ],
    lymph: [
      { zh: '先看全圖', en: 'Full map first', segs: [{ ops: [['lymphStep', 0], ['compartment', 'plasma'], ['movement', 'rest']], dur: SEG }] },
      { zh: '放大微血管', en: 'Enlarged capillary', segs: [{ ops: [['lymphStep', 1], ['compartment', 'tissue']], dur: SEG }] },
      { zh: '進入淋巴管', en: 'Into lymphatic vessels', segs: [{ ops: [['lymphStep', 2], ['compartment', 'lymph']], dur: SEG }] },
      { zh: '淋巴結與回流', en: 'Lymph nodes and return', segs: [
        { ops: [['lymphStep', 3], ['compartment', 'node']], dur: SEG },
        { ops: [['compartment', 'return']], dur: SEG }
      ] },
      { zh: '肌肉活動協助回流', en: 'Muscle movement helps return', segs: [{ ops: [['lymphStep', 3], ['movement', 'active']], dur: SEG }] }
    ],
    experiment: [
      { zh: '脈搏與心搏', en: 'Pulse and heartbeat', segs: [{ ops: [['view', 'pulse'], ['photo', 'pulse']], dur: SEG }] },
      { zh: '聽心音', en: 'Listen to heart sounds', segs: [{ ops: [['photo', 'sound']], dur: SEG }] },
      { zh: '魚尾血流：小動脈', en: 'Fish tail: arteriole', segs: [{ ops: [['view', 'fish'], ['fishVessel', 'artery'], ['fishSpeed', 0.4]], dur: SEG }] },
      { zh: '魚尾血流：微血管', en: 'Fish tail: capillary', segs: [{ ops: [['fishVessel', 'capillary']], dur: SEG }] },
      { zh: '魚尾血流：小靜脈', en: 'Fish tail: venule', segs: [{ ops: [['fishVessel', 'vein']], dur: SEG }] }
    ]
  };

  var $ = function (id) { return document.getElementById(id); };
  var LB = function () { return window.LivingBook; };
  var st = function () { return LB().getState(); };
  var curId = function () { return LB().getTab().id; };
  var introHidden = function () { var i = $('introScreen'); return !i || i.hidden; };
  var isEn = function () { var h = $('hookTitle'); return !!h && h.textContent.indexOf('曉臻') < 0; };
  var segOps = function (seg) { return typeof seg.ops === 'function' ? seg.ops() : seg.ops; };
  var apply = function (ops) { ops.forEach(function (o) { LB().action(o[0], o[1]); }); };

  var mode = 'student', voice = false, paused = false, queue = null;
  var curTab = null, pendingStart = false, langSig = null, snap = null;
  var activeK = -1, pendingK = null;   // 亮框：切分頁後要在新的步驟列上保留

  function setActive(k) {
    activeK = k;
    var host = $('ptSteps'); if (!host) return;
    host.querySelectorAll('.pt-step').forEach(function (b) { b.classList.toggle('on', +b.dataset.k === k); });
  }

  function buildSteps() {
    var host = $('ptSteps'); if (!host) return;
    var list = TABS[curTab] || [];
    host.replaceChildren();
    list.forEach(function (stp, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pt-step'; b.dataset.k = String(i);
      var n = document.createElement('b'); n.textContent = String(i + 1);
      var t = document.createElement('span');
      t.dataset.zh = stp.zh; t.dataset.en = stp.en;
      t.textContent = isEn() ? stp.en : stp.zh;
      b.append(n, t);
      b.addEventListener('click', function () {
        if (voice) return;
        if (mode === 'teacher') playFrom(i); else playStep(i);
      });
      host.append(b);
    });
    setActive(activeK);
    langSig = isEn();
    syncPause();
  }

  function beginSeg(seg) {
    var s = st();
    s.elapsed = 0;
    apply(segOps(seg));
    s = st();
    s.elapsed = 0;                 // 段一律從頭開始（celery 的 restart 會記下 start）
    s.running = !paused;
    queue.t0 = 0; queue.dur = seg.dur;
  }

  function startQueue(items) {
    queue = { tab: curTab, items: items, idx: 0, t0: 0, dur: 0 };
    if (items.length && items[0].k !== undefined) setActive(items[0].k); else setActive(-1);
    beginSeg(items[0]);
  }

  function playStep(k) {
    var t = curId();
    startQueue(TABS[t][k].segs.map(function (sg) { return Object.assign({ k: k }, sg); }));
  }

  function playFrom(k) {
    var t = curId(), list = TABS[t], items = [];
    for (var i = k; i < list.length; i++) {
      list[i].segs.forEach(function (sg) { items.push(Object.assign({ k: i }, sg)); });
      if (i < list.length - 1) items.push({ ops: [], dur: GAP, k: i });
    }
    startQueue(items);
  }

  function autoStart() {
    if (voice) return;
    if (mode === 'teacher') playFrom(0); else playStep(0);
  }

  function syncPause() {
    var b = $('ptPause'); if (!b) return;
    var en = isEn();
    b.textContent = paused ? (en ? '▶ Resume' : '▶ 繼續') : (en ? '⏸ Pause' : '⏸ 暫停');
  }

  function onTab(id) {
    curTab = id;
    queue = null;
    activeK = (pendingK !== null) ? pendingK : -1;
    pendingK = null;
    buildSteps();
    pendingStart = true;
  }

  function tick() {
    requestAnimationFrame(tick);
    if (!LB() || !LB().getTab) return;
    var t = curId();
    if (t !== curTab) onTab(t);
    var en = isEn();
    if (en !== langSig) { langSig = en; buildSteps(); }
    if (!introHidden()) return;                // 封面還沒進入：不推進
    if (pendingStart) { pendingStart = false; autoStart(); }
    if (!queue || paused || voice) return;
    if (queue.tab !== t) { queue = null; return; }
    var s = st();
    if (s.elapsed - queue.t0 < queue.dur) return;
    queue.idx++;
    if (queue.idx < queue.items.length) {
      var nx = queue.items[queue.idx];
      if (nx.k !== undefined) setActive(nx.k);
      beginSeg(nx);
    } else {
      queue = null;
      s.running = false;                       // 播完停住（學生與老師講解一樣）
    }
  }

  /* 學生動手做：按了控制鈕，就把目前設定播一輪再停 */
  function stateKeys() {
    var s = st(), o = {};
    if (!s) return '';
    Object.keys(s).forEach(function (k) { if (k !== 'elapsed' && k !== 'running' && k !== 'start') o[k] = s[k]; });
    return JSON.stringify(o);
  }
  function oneCycle() {
    if (voice || !introHidden()) return;
    queue = null;
    startQueue([{ ops: [], dur: SEG }]);
  }

  window.setMode = function (m) {
    mode = (m === 'teacher') ? 'teacher' : 'student';
    document.body.classList.toggle('mode-teacher', mode === 'teacher');
    var a = $('mode-student'), b = $('mode-teacher');
    if (a) { a.classList.toggle('active', mode === 'student'); a.setAttribute('aria-pressed', String(mode === 'student')); }
    if (b) { b.classList.toggle('active', mode === 'teacher'); b.setAttribute('aria-pressed', String(mode === 'teacher')); }
    paused = false; queue = null; syncPause();
    if (voice) return;
    if (introHidden()) autoStart(); else pendingStart = true;
  };

  function wire() {
    var controls = $('controls');
    if (controls) controls.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('button')) return;
      if (e.target.closest('#playButton')) return;
      oneCycle();
    });
    var cv = $('lessonCanvas');
    if (cv) {
      cv.addEventListener('pointerdown', function () { snap = stateKeys(); });
      cv.addEventListener('pointerup', function () {
        if (snap === null) return;
        var now = stateKeys(); var was = snap; snap = null;
        if (now !== was) oneCycle();           // 點了標記、切換了情境才播
      });
    }
    var pause = $('ptPause'), replay = $('ptReplay');
    if (pause) pause.addEventListener('click', function () {
      if (voice || mode !== 'teacher') return;
      paused = !paused;
      if (st()) st().running = !paused && !!queue;
      syncPause();
    });
    if (replay) replay.addEventListener('click', function () {
      if (voice) return;
      paused = false; syncPause();
      if (mode === 'teacher') playFrom(0); else playStep(0);
    });
    var lessonTabs = $('lessonTabs');
    if (lessonTabs) lessonTabs.addEventListener('click', function () { paused = false; syncPause(); });
  }

  /* 有聲講解用的公開介面 */
  function tabIndex(id) { return ORDER.indexOf(id); }
  function setTabById(id) {
    var i = tabIndex(id);
    if (i >= 0 && curId() !== id) LB().setTab(i);
  }
  window.HTLesson = {
    tabs: ORDER,
    steps: function (id) { return (TABS[id] || []).length; },
    takeover: function (on) { voice = !!on; queue = null; paused = false; syncPause(); },
    // 切到分頁、第 k 步（1 起算）、累積播到第 seg 段（0 起算）；動畫循環播放
    show: function (id, k, seg) {
      voice = true; queue = null; paused = false;
      if (curId() !== id) pendingK = k - 1;   // 換分頁：新的步驟列建好後，亮框要對到這一步
      setTabById(id);
      var stp = (TABS[id] || [])[k - 1];
      if (!stp) return;
      var s = st(); s.elapsed = 0;
      var upto = Math.min(seg || 0, stp.segs.length - 1);
      for (var i = 0; i <= upto; i++) apply(segOps(stp.segs[i]));
      s = st(); s.elapsed = 0; s.running = true;
      setActive(k - 1);
    },
    pause: function () { paused = true; if (st()) st().running = false; },
    resume: function () { paused = false; if (st()) st().running = true; }
  };

  function boot() {
    if (!LB() || !LB().getTab) return setTimeout(boot, 50);
    wire();
    requestAnimationFrame(tick);
  }
  boot();
})();

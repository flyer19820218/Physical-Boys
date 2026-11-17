/* biology_enzymes：✋ 學生操作／👩‍🏫 老師講解（AGENTS 10.6／10.7）＋每個分頁的「動手做」實驗台（2026-11-17，外層加法）
 * ・動畫本體、模型、幾何、繪圖函式一行不改；只透過 enzymes_v3.js 的 EnzymesLesson.ctl 開關控制「播完停住／連播／暫停」。
 * ・學生操作：一進分頁播第 1 組，播完停在最後一格；按步驟編號播那一組。老師講解：從頭連播到最後一步停住，可暫停、從頭重播、點步驟編號跳步。
 * ・動手做：在每個動畫下面多一張畫布，用原本的 EnzymesDraw 畫圖、原本的 EnzymesModel 算活性與實驗流程，學生自己拖曳、按按鈕改條件。
 */
(function () {
  'use strict';
  var L = window.EnzymesLesson, M = window.EnzymesModel, D = window.EnzymesDraw;
  if (!L || !L.ctl || !M || !D) return;
  var CTL = L.ctl, $ = function (id) { return document.getElementById(id); };
  var lang = function () { return L.lang ? L.lang() : 'zh'; };
  var tr = function (z, e) { return lang() === 'zh' ? z : e; };
  var IDS = ['model', 'specificity', 'temperature', 'ph', 'experiment'];
  var teacher = false;

  /* ── 模式列：放在頁首與分頁鈕之間（PROGRESS 2026-11-16 頁首順序） ── */
  function buildModeBar() {
    if ($('modeBar')) return;
    var bar = document.createElement('div');
    bar.className = 'enz-mode-bar'; bar.id = 'modeBar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', '使用模式');
    bar.innerHTML =
      '<div class="mode-row">' +
      '<button class="mode-pill active" id="mode-student" type="button" aria-pressed="true" data-zh="✋ 學生操作" data-en="✋ Student: hands-on">✋ 學生操作</button>' +
      '<button class="mode-pill" id="mode-teacher" type="button" aria-pressed="false" data-zh="👩‍🏫 老師講解" data-en="👩‍🏫 Teacher: guided tour">👩‍🏫 老師講解</button>' +
      '</div>' +
      '<div class="mode-hint" data-zh="學生操作：動畫一次播一步，按步驟編號看下一步；動畫下面的「動手做」可以自己拖曳、改條件。老師講解：按下去就從頭連續播到最後，可暫停、重播，也可以點步驟編號跳到那一步。" data-en="Student: the animation plays one step at a time—tap a step number for the next; try the hands-on bench below it. Teacher: plays straight through; pause, replay, or tap a step number to jump.">學生操作：動畫一次播一步，按步驟編號看下一步；動畫下面的「動手做」可以自己拖曳、改條件。老師講解：按下去就從頭連續播到最後，可暫停、重播，也可以點步驟編號跳到那一步。</div>';
    var tabs = $('lessonTabs');
    tabs.parentNode.insertBefore(bar, tabs);
    $('mode-student').addEventListener('click', function () { setMode('student'); });
    $('mode-teacher').addEventListener('click', function () { setMode('teacher'); });
  }

  function stageEl(tab) { return $('lab-' + IDS[tab]); }
  function scrollToStage(tab) {
    var el = stageEl(tab); if (!el) return;
    var r = el.getBoundingClientRect();
    if (r.top >= 0 && r.top < innerHeight * 0.4) return;
    try { window.scrollTo({ top: window.pageYOffset + r.top - 70, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, window.pageYOffset + r.top - 70); }
  }

  function setMode(m) {
    var t = m === 'teacher';
    if (t === teacher) return;
    teacher = t;
    $('mode-student').classList.toggle('active', !t); $('mode-student').setAttribute('aria-pressed', String(!t));
    $('mode-teacher').classList.toggle('active', t); $('mode-teacher').setAttribute('aria-pressed', String(t));
    document.body.classList.toggle('mode-teacher', t);
    CTL.mode = t ? 'teacher' : 'student'; CTL.paused = false;
    var tab = L.state.tab;
    L.jump(tab, 0);                                   // 兩種模式都從這個分頁的第 1 步重新開始
    if (t) scrollToStage(tab);
    paintBars();
  }
  window.EnzymesModes = { setMode: setMode, isTeacher: function () { return teacher; } };

  /* ── 老師講解控制列：每個動畫下面一條（學生模式 display:none） ── */
  function buildTeachBars() {
    IDS.forEach(function (id, tab) {
      var st = stageEl(tab); if (!st || st.nextElementSibling && st.nextElementSibling.classList.contains('enz-teach-bar')) return;
      var bar = document.createElement('div');
      bar.className = 'enz-teach-bar'; bar.dataset.tab = tab;
      bar.innerHTML = '<button type="button" class="teach-btn" data-act="pause"></button><button type="button" class="teach-btn" data-act="replay"></button>' +
        '<div class="teach-track"><div class="teach-fill"></div></div><div class="teach-note" aria-live="polite"></div>';
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('.teach-btn'); if (!b || !teacher || L.state.tab !== tab) return;
        if (b.dataset.act === 'pause') { if (!CTL.done) CTL.paused = !CTL.paused; }
        else { CTL.paused = false; L.jump(tab, 0); }
        bar._sig = ''; paintBars();
      });
      st.insertAdjacentElement('afterend', bar);
    });
  }
  function paintBars() {
    document.querySelectorAll('.enz-teach-bar').forEach(function (bar) {
      var tab = +bar.dataset.tab, live = teacher && L.state.tab === tab;
      var st = L.getState(), steps = L.STEPS[tab], s = steps[Math.min(st.step, steps.length - 1)];
      var note = '';
      if (live && CTL.done) note = tr('✔ 講解完畢；可按「從頭重播」，或點上方的步驟編號回到任一步', '✔ Done. Press Replay, or tap a step number to revisit a step');
      else if (live && CTL.paused) note = tr('⏸ 已暫停', '⏸ Paused');
      else if (live && s) note = tr('正在播：', 'Now: ') + (st.step + 1) + '／' + steps.length + '　' + tr(s.z, s.e);
      var p = live ? Math.round((CTL.done ? 1 : L.progress()) * 100) : 0;
      var sig = [note, p, CTL.paused, CTL.done, live, lang()].join('|');
      if (bar._sig === sig) return; bar._sig = sig;
      var pb = bar.querySelector('[data-act="pause"]'), rb = bar.querySelector('[data-act="replay"]');
      pb.textContent = CTL.paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause'); pb.disabled = !live || CTL.done;
      rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', live && CTL.done);
      bar.querySelector('.teach-fill').style.width = p + '%';
      bar.querySelector('.teach-note').textContent = note;
    });
  }
  setInterval(function () { if (teacher) paintBars(); }, 200);

  /* ══════════════ 動手做實驗台 ══════════════ */
  var H = [];      // 每個分頁一份：{ s: 自己的狀態, el, cvs, ... }
  function newState(tab) { var s = M.create(); s.tab = tab; s.lab.prediction = 'hands'; return s; }
  var DEF = [
    { // 0 分解與合成：左右拖曳畫面推動反應
      title: ['🧪 動手做：把受質推進活性區', '🧪 Hands-on: push the substrate into the active site'],
      tip: ['先選「分解」或「合成」，再用手指在畫面上往右拖，自己推動反應；做完一次再拖一次，看看酵素是不是還在。', 'Choose breakdown or synthesis, then drag right on the picture to push the reaction. Do it again—is the enzyme still there?'],
      groups: [{ label: ['反應方向', 'Direction'], btns: [['break', '分解作用', 'Breakdown'], ['join', '合成作用', 'Synthesis']] },
               { label: null, btns: [['again', '↺ 再放一個受質', '↺ New substrate']] }],
      kind: 'mol'
    },
    { // 1 專一性
      title: ['🧪 動手做：自己配對酵素與受質', '🧪 Hands-on: pair an enzyme with a substrate'],
      tip: ['選一種酵素、一種受質，再往右拖，把受質推向活性區：形狀對得上才會反應。', 'Pick an enzyme and a substrate, then drag right to push it toward the active site. Only a matching shape reacts.'],
      groups: [{ label: ['酵素', 'Enzyme'], btns: [['e:amylase', '唾液澱粉酶', 'Salivary amylase'], ['e:protease', '蛋白酶', 'Protease'], ['e:lipase', '脂肪酶', 'Lipase']] },
               { label: ['受質', 'Substrate'], btns: [['s:starch', '澱粉', 'Starch'], ['s:protein', '蛋白質', 'Protein'], ['s:fat', '脂質', 'Lipids']] },
               { label: null, btns: [['again', '↺ 重來', '↺ Reset']] }],
      kind: 'mol'
    },
    { // 2 溫度
      title: ['🧪 動手做：自己調溫度', '🧪 Hands-on: set the temperature yourself'],
      tip: ['在圖上左右拖曳，改變溫度。先降溫再回到 37 °C；再試試加熱到 65 °C 之後拉回來，活性還會回來嗎？', 'Drag left or right on the graph to change the temperature. Cool it and return to 37 °C; then heat to 65 °C and come back—does activity return?'],
      groups: [{ label: ['快速設定', 'Quick set'], btns: [['t:5', '5 °C', '5 °C'], ['t:37', '37 °C', '37 °C'], ['t:65', '65 °C', '65 °C']] },
               { label: null, btns: [['fresh', '🧫 換一份新酵素', '🧫 Fresh enzyme']] }],
      kind: 'temp'
    },
    { // 3 酸鹼
      title: ['🧪 動手做：自己調酸鹼值', '🧪 Hands-on: set the pH yourself'],
      tip: ['先選一種酵素，再在圖上左右拖曳改變 pH，找找看它在哪裡活性最高。', 'Choose an enzyme, then drag on the graph to change the pH. Where is its activity highest?'],
      groups: [{ label: ['酵素', 'Enzyme'], btns: [['p:stomach', '胃的蛋白酶', 'Stomach protease'], ['p:saliva', '唾液澱粉酶', 'Salivary amylase'], ['p:intestine', '小腸酵素示例', 'Intestinal enzyme']] },
               { label: ['快速設定', 'Quick set'], btns: [['ph:2', 'pH 2', 'pH 2'], ['ph:7', 'pH 7', 'pH 7'], ['ph:8.5', 'pH 8.5', 'pH 8.5']] }],
      kind: 'ph'
    },
    { // 4 唾液澱粉酶實驗
      title: ['🧪 動手做：自己做一次兩支試管的實驗', '🧪 Hands-on: run the two-tube experiment yourself'],
      tip: ['照順序按按鈕操作；黃框是下一步。按錯順序時，下面會提醒你應該先做什麼。', 'Press the buttons in order; the yellow outline is the next step. If you skip ahead, a reminder appears below.'],
      groups: [{ label: null, btns: [['a:prepare', '① 等量唾液', '① Equal saliva'], ['a:boil', '② 只煮甲組', '② Boil A only'], ['a:cool', '③ 冷卻甲組', '③ Cool A'],
                                     ['a:starchA', '④ 甲加澱粉液', '④ Starch to A'], ['a:starchB', '⑤ 乙加澱粉液', '⑤ Starch to B'], ['a:digest', '⑥ 35–40 °C 作用', '⑥ React at 35–40 °C'],
                                     ['a:benA', '⑦ 甲加本氏液', '⑦ Benedict\'s to A'], ['a:benB', '⑧ 乙加本氏液', '⑧ Benedict\'s to B'], ['a:detect', '⑨ 一起加熱檢驗', '⑨ Heat both to test'],
                                     ['a:reset', '↺ 重做', '↺ Restart']] }],
      kind: 'lab'
    }
  ];
  var ORDER = ['prepare', 'boil', 'cool', 'starchA', 'starchB', 'digest', 'benA', 'benB', 'detect'];
  var ACT_NAME = { prepare: ['等量唾液', 'Equal saliva'], boil: ['只煮甲組', 'Boil A only'], cool: ['冷卻甲組', 'Cool A'], starchA: ['甲加澱粉液', 'Starch to A'], starchB: ['乙加澱粉液', 'Starch to B'], digest: ['35–40 °C 作用', 'React at 35–40 °C'], benA: ['甲加本氏液', 'Benedict\'s to A'], benB: ['乙加本氏液', 'Benedict\'s to B'], detect: ['一起加熱檢驗', 'Heat both to test'] };

  function h(tab) {
    if (!H[tab]) { H[tab] = { s: newState(tab), msg: null, lock: false, resetAt: 0 }; if (tab === 1) { H[tab].s.enzyme = 'amylase'; H[tab].s.substrate = 'starch'; } }
    return H[tab];
  }
  function buildHands() {
    DEF.forEach(function (d, tab) {
      var anchor = stageEl(tab); if (!anchor) return;
      var after = anchor.nextElementSibling && anchor.nextElementSibling.classList.contains('enz-teach-bar') ? anchor.nextElementSibling : anchor;
      if (after.nextElementSibling && after.nextElementSibling.classList.contains('enz-hands')) return;
      var box = document.createElement('div');
      box.className = 'enz-hands'; box.id = 'hands-' + IDS[tab];
      var html = '<div class="enz-hands-head"><h3>' + tr(d.title[0], d.title[1]) + '</h3><p>' + tr(d.tip[0], d.tip[1]) + '</p></div><div class="enz-hands-ctl">';
      d.groups.forEach(function (g) {
        html += '<div class="hg">' + (g.label ? '<span class="hg-label">' + tr(g.label[0], g.label[1]) + '</span>' : '');
        g.btns.forEach(function (b) { html += '<button type="button" data-h="' + b[0] + '">' + tr(b[1], b[2]) + '</button>'; });
        html += '</div>';
      });
      html += '</div><canvas width="960" height="620" aria-label="' + tr('動手做互動畫布', 'Hands-on canvas') + '"></canvas><div class="enz-hands-status" role="status"></div>';
      box.innerHTML = html;
      after.insertAdjacentElement('afterend', box);
      var st = h(tab);
      st.el = box; st.cvs = box.querySelector('canvas'); st.status = box.querySelector('.enz-hands-status');
      box.querySelector('.enz-hands-ctl').addEventListener('click', function (e) { var b = e.target.closest('[data-h]'); if (b) onBtn(tab, b.dataset.h); });
      bindDrag(tab);
      st._sig = '';
    });
  }

  function onBtn(tab, key) {
    var st = h(tab), s = st.s, k = key.split(':');
    st.msg = null;
    if (tab <= 1) {
      if (key === 'break' || key === 'join') { s.mode = key; s.phase = 0; }
      else if (k[0] === 'e') { s.enzyme = k[1]; s.phase = 0; }
      else if (k[0] === 's') { s.substrate = k[1]; s.phase = 0; }
      else if (key === 'again') s.phase = 0;
      st.lock = false; st.resetAt = 0;
    } else if (tab === 2) {
      if (k[0] === 't') { s.temp = +k[1]; if (s.temp >= 65) s.damaged = true; }
      else if (key === 'fresh') { s.damaged = false; s.temp = 37; st.msg = tr('換了一份新的酵素，在 37 °C 又能正常作用。', 'A fresh enzyme works normally again at 37 °C.'); }
    } else if (tab === 3) {
      if (k[0] === 'p') s.phEnzyme = k[1];
      else if (k[0] === 'ph') s.ph = +k[1];
    } else {
      var a = k[1], lab = s.lab;
      if (a === 'reset') { M.act(lab, 'reset'); lab.prediction = 'hands'; lab.records = []; return; }
      if (lab.motion) { st.msg = tr('還在進行中，等這一步做完。', 'Still in progress—wait for this step to finish.'); return; }
      if (!M.act(lab, a)) {
        var nx = ORDER.find(function (x) { return M.can(lab, x); });
        st.msg = nx ? tr('順序不對喔：下一步應該先「' + ACT_NAME[nx][0] + '」。', 'Not yet: next you should “' + ACT_NAME[nx][1] + '”.') : tr('實驗已經做完了；按「↺ 重做」可以再做一次。', 'The experiment is finished; press “↺ Restart” to do it again.');
      }
    }
  }

  function bindDrag(tab) {
    var st = h(tab), c = st.cvs, drag = null;
    function xOf(ev) { var r = c.getBoundingClientRect(); return (ev.clientX - r.left) * 960 / (r.width || 1); }
    function setChart(x) {
      var s = st.s, f = Math.max(0, Math.min(1, (x - 108) / 754));
      if (tab === 2) { s.temp = Math.round(f * 70); if (s.temp >= 65) s.damaged = true; }
      else if (tab === 3) s.ph = Math.round(f * 140) / 10;
      st.msg = null;
    }
    c.addEventListener('pointerdown', function (ev) {
      if (tab === 4) return;
      drag = { x: xOf(ev), p: st.s.phase };
      try { c.setPointerCapture(ev.pointerId); } catch (e) {}
      if (tab >= 2) setChart(drag.x);
      else if (st.lock) { st.s.phase = 0; st.lock = false; st.resetAt = 0; drag.p = 0; }
    });
    c.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      var x = xOf(ev);
      if (tab >= 2) { setChart(x); return; }
      if (st.lock) return;
      var s = st.s;
      s.phase = Math.max(0, Math.min(1, drag.p + (x - drag.x) / 520));
      if (s.phase >= 1) {                                    // 推完一整次：記一次反應，受質離開、酵素留下
        st.lock = true;
        var match = tab === 0 || M.pairs.find(function (p) { return p.id === s.enzyme; }).target === s.substrate;
        if (match) s.cycles++;
      }
    });
    function up() { if (drag && st.lock) st.resetAt = performance.now() + 1600; drag = null; }
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  }

  function statusOf(tab) {
    var st = h(tab), s = st.s;
    if (st.msg) return st.msg;
    if (tab <= 1) {
      var match = tab === 0 || M.pairs.find(function (p) { return p.id === s.enzyme; }).target === s.substrate;
      var p = s.phase;
      var head = tab === 0 ? '' : '<b>' + tr(M.pairs.find(function (q) { return q.id === s.enzyme; }).zh, M.pairs.find(function (q) { return q.id === s.enzyme; }).en) + '＋' +
        tr(M.pairs.find(function (q) { return q.target === s.substrate; }).substrate[0], M.pairs.find(function (q) { return q.target === s.substrate; }).substrate[1]) + '</b>：';
      var cnt = '　' + tr('完成反應：', 'Completed: ') + '<b>' + s.cycles + '</b>';
      if (p <= 0.001) return head + tr('往右拖，把受質推向活性區。', 'Drag right to push the substrate toward the active site.') + cnt;
      if (!match) return head + (p < 0.30 ? tr('受質接近活性區……', 'The substrate approaches…') : tr('形狀對不上：這個酵素不能催化這個受質，受質被推回去了。', 'No fit: this enzyme cannot catalyze this substrate, so it is pushed back.')) + cnt;
      if (p < 0.30) return head + tr('受質接近活性區，還沒反應。', 'Approaching; no reaction yet.') + cnt;
      if (p < 0.50) return head + tr('形狀吻合，受質暫時和酵素結合。', 'The shapes match; the substrate binds temporarily.') + cnt;
      if (p < 0.66) return head + (s.mode === 'join' && tab === 0 ? tr('在活性區把兩個部分接起來。', 'The two parts are joined at the active site.') : tr('在活性區斷開連接，變成較小的產物。', 'The link breaks at the active site, forming smaller products.')) + cnt;
      if (p < 1) return head + tr('產物離開……', 'The products leave…') + cnt;
      return head + tr('完成一次反應！產物離開了，<b>酵素還在</b>，再拖一次可以再用。', 'Reaction done! The products left and <b>the enzyme remains</b>—drag again to reuse it.') + cnt;
    }
    if (tab === 2) {
      var r = Math.round((s.damaged ? 0 : M.tempRate(s.temp)) * 100);
      var line = tr('溫度 ', 'Temperature ') + '<b>' + s.temp + ' °C</b>　' + tr('相對活性 ', 'Relative activity ') + '<b>' + r + '%</b>　';
      if (s.damaged) return line + tr('這份酵素經過高溫處理，構造改變、失活了；拉回 37 °C 也不會恢復。要換一份新酵素。', 'This sample was heat-treated and inactivated; returning to 37 °C will not restore it. Use a fresh enzyme.');
      if (s.temp < 30) return line + tr('低溫：反應變慢，但構造沒有被破壞，回到適合溫度就恢復。', 'Cold: slower, but not damaged; it recovers at a suitable temperature.');
      if (s.temp <= 42) return line + tr('接近適合的溫度，活性最高。', 'Near the suitable temperature: highest activity.');
      return line + tr('超過適合的溫度，活性下降。', 'Above the suitable temperature: activity falls.');
    }
    if (tab === 3) {
      var pe = M.phSpecs.find(function (x) { return x.id === s.phEnzyme; }), rr = Math.round(M.phRate(s.ph, s.phEnzyme) * 100);
      return '<b>' + tr(pe.zh, pe.en) + '</b>　pH <b>' + s.ph.toFixed(1) + '</b>　' + tr('相對活性 ', 'Relative activity ') + '<b>' + rr + '%</b>　' +
        (rr >= 80 ? tr('這裡很適合它。', 'This suits it well.') : rr >= 30 ? tr('有點偏離，活性下降。', 'A bit off—activity falls.') : tr('酸鹼不合適，幾乎沒有活性。', 'Unsuitable pH—almost no activity.'));
    }
    var lab = s.lab;
    if (lab.motion) return tr('操作中：', 'In progress: ') + '<b>' + tr.apply(null, M.labTitles[lab.step]) + '</b>';
    if (lab.step === 7) return tr('<b>甲保持藍色、乙出現沉澱。</b>乙的酵素把澱粉分解成較小的糖；甲的唾液先煮過，酵素失活了。', '<b>A stays blue; B forms a precipitate.</b> B\'s enzyme broke starch into smaller sugars; A\'s boiled saliva enzyme was inactivated.');
    var nx = ORDER.find(function (x) { return M.can(lab, x); });
    return tr('下一步：', 'Next: ') + '<b>' + (nx ? tr(ACT_NAME[nx][0], ACT_NAME[nx][1]) : '') + '</b>';
  }

  function paintBtns(tab) {
    var st = h(tab), s = st.s;
    st.el.querySelectorAll('[data-h]').forEach(function (b) {
      var k = b.dataset.h.split(':'), on = false, nx = false, dn = false;
      if (tab <= 1) on = (b.dataset.h === s.mode) || (k[0] === 'e' && k[1] === s.enzyme) || (k[0] === 's' && k[1] === s.substrate);
      else if (tab === 2) on = k[0] === 't' && +k[1] === s.temp;
      else if (tab === 3) on = (k[0] === 'p' && k[1] === s.phEnzyme) || (k[0] === 'ph' && Math.abs(+k[1] - s.ph) < 0.05);
      else if (k[0] === 'a' && k[1] !== 'reset') {
        var i = ORDER.indexOf(k[1]), lab = s.lab;
        nx = !lab.motion && M.can(lab, k[1]);
        dn = !nx && (lab.step > [0, 1, 2, 3, 3, 4, 5, 5, 6][i] || (k[1] === 'starchA' && lab.starch[0]) || (k[1] === 'starchB' && lab.starch[1]) || (k[1] === 'benA' && lab.benedict[0]) || (k[1] === 'benB' && lab.benedict[1]));
      }
      b.classList.toggle('on', on); b.classList.toggle('next', nx); b.classList.toggle('done', dn);
    });
  }

  var last = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    var dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
    if (document.hidden) return;
    var tab = L.state.tab, st = H[tab];
    if (!st || !st.cvs || !st.cvs.isConnected) return;
    var s = st.s;
    if (tab <= 1 && st.lock && st.resetAt && t >= st.resetAt) { s.phase = 0; st.lock = false; st.resetAt = 0; }
    if (tab === 4) M.advance(s.lab, dt);
    var c = st.cvs.getContext('2d'), l = lang();
    if (tab <= 1) D.molecular(c, s, l); else if (tab <= 3) D.chart(c, s, l, tab === 3); else D.lab(c, s.lab, l);
    var html = statusOf(tab);
    if (st.status._h !== html) { st.status._h = html; st.status.innerHTML = html; }
    paintBtns(tab);
  }

  /* ── 掛勾：build()（換語言會重建分頁內容）、switchTab() ── */
  function mount() { buildModeBar(); buildTeachBars(); buildHands(); paintBars(); }
  CTL.onBuild = mount;
  CTL.onTab = function (tab) { CTL.paused = false; if (teacher) scrollToStage(tab); paintBars(); };
  CTL.onEnd = function () { paintBars(); };
  mount();
  requestAnimationFrame(loop);
})();

/* mechanics_3_modes_1126_v1.js（複製自 mechanics_2_modes，只改實驗台對照表） ｜ 「學生操作／老師講解」雙模式（AGENTS 10.6、10.7；只做頁面層，不改動畫檔）
   學生操作：W5.mode='step'（每步播完停住，按步驟編號才看下一步）。
   老師講解：W5.mode='tour'（連續播到底、不循環）；同分頁的子頁自動接力；無動畫的子頁停 10 秒再接；
            可暫停／繼續、從頭重播、點步驟編號跳轉。 */
(function () {
  'use strict';
  const HOLD_STATIC = 10, GAP = 1.8;          /* 無動畫子頁停留秒數；動畫播完到換下一子頁的間隔 */
  let token = 0, tourOn = false, paused = false, hold = null;   /* hold: {left, total} 倒數中的停頓 */
  let raf = 0, lastTs = 0;

  const $ = id => document.getElementById(id);
  const subsOf = tab => Array.from(document.querySelectorAll('#' + tab + ' .sub-tab-btn')).map(b => b.dataset.sub);
  const lang = () => (typeof LANG !== 'undefined' ? LANG : 'zh');
  const T = (zh, en) => lang() === 'en' ? en : zh;

  function note(zh, en) { const n = $('teach-note'); if (n) { n.setAttribute('data-zh', zh); n.setAttribute('data-en', en); n.textContent = T(zh, en); } }
  function fill(p) { const f = $('teach-fill'); if (f) f.style.width = Math.max(0, Math.min(1, p)) * 100 + '%'; }

  function tabProgress() {
    const subs = subsOf(currentTab), i = Math.max(0, subs.indexOf(CUR_SUB[currentTab]));
    const a = SUB_ANIM[subs[i]];
    let within = 0;
    if (a && window.W5) within = W5.progress(a); else if (hold) within = 1 - hold.left / hold.total;
    return (i + within) / subs.length;
  }
  function loop(ts) {
    raf = 0; if (!tourOn) return;
    const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0; lastTs = ts;
    if (hold && !paused) { hold.left -= dt; if (hold.left <= 0) { const cb = hold.cb; hold = null; cb(); } }
    fill(tabProgress());
    raf = requestAnimationFrame(loop);
  }
  function ensureLoop() { if (!raf && tourOn) { lastTs = 0; raf = requestAnimationFrame(loop); } }

  function after(sec, cb) { hold = { left: sec, total: sec, cb }; ensureLoop(); }

  function nextSub(myToken) {
    if (myToken !== token || !tourOn) return;
    const subs = subsOf(currentTab), i = subs.indexOf(CUR_SUB[currentTab]);
    if (i < 0 || i >= subs.length - 1) { note('這個分頁講完了 ✔', 'This tab is done ✔'); fill(1); return; }
    setSub(currentTab, subs[i + 1]);      /* setSub → startCurrent → 會重新排程 */
  }
  /* 每次 startCurrent 後呼叫：排定「這個子頁播完之後」要做什麼 */
  function schedule() {
    if (!tourOn) return;
    const my = ++token; hold = null;
    const a = SUB_ANIM[CUR_SUB[currentTab]];
    note('老師講解中：連續播放', 'Teacher mode: playing on');
    if (a) { W5.onEnd = name => { if (name === a && my === token) after(GAP, () => nextSub(my)); }; }
    else { W5.onEnd = null; after(HOLD_STATIC, () => nextSub(my)); note('這一頁是整理圖表，停 10 秒再接下一頁', 'Summary page — a 10 s pause, then the next'); }
    ensureLoop();
  }

  /* 外掛到頁面：包一層 startCurrent（學生／老師共用） */
  const origStart = window.startCurrent;
  window.startCurrent = function () { origStart(); if (tourOn) schedule(); };

  function setMode(m) {
    const teacher = m === 'teacher';
    document.body.classList.toggle('mode-teacher', teacher);
    $('mode-student').classList.toggle('active', !teacher); $('mode-student').setAttribute('aria-pressed', String(!teacher));
    $('mode-teacher').classList.toggle('active', teacher); $('mode-teacher').setAttribute('aria-pressed', String(teacher));
    tourOn = teacher; paused = false; token++; hold = null;
    W5.mode = teacher ? 'tour' : 'step';
    if (!teacher) { W5.onEnd = null; fill(0); }
    updatePauseBtn();
    if (teacher) { const subs = subsOf(currentTab); setSub(currentTab, subs[0]); }   /* 從這個分頁的頭開始 */
    else origStart();
  }
  function updatePauseBtn() { const b = $('teach-pause'); if (!b) return; const zh = paused ? '▶ 繼續' : '⏸ 暫停', en = paused ? '▶ Resume' : '⏸ Pause'; b.setAttribute('data-zh', zh); b.setAttribute('data-en', en); b.textContent = T(zh, en); }
  function togglePause() {
    if (!tourOn) return; paused = !paused;
    const a = SUB_ANIM[CUR_SUB[currentTab]];
    if (a) { paused ? W5.pause(a) : W5.resume(a); }
    updatePauseBtn(); ensureLoop();
  }
  function replay() { if (!tourOn) return; paused = false; updatePauseBtn(); const subs = subsOf(currentTab); if (CUR_SUB[currentTab] === subs[0]) origStart(); else setSub(currentTab, subs[0]); schedule(); }

  /* 切分頁：老師模式就從新分頁的頭開始（10.7 的 teachOnTab 掛勾） */
  window.teachOnTab = function (tab) {
    if (!tourOn) return; paused = false; updatePauseBtn(); fill(0);
    const subs = subsOf(tab);
    if (CUR_SUB[tab] !== subs[0]) setSub(tab, subs[0]); else schedule();
    const st = $(tab); if (st) st.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* 點步驟編號：老師模式下從那一步接著連播（kit 的 go 已處理），並解除暫停 */
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.step-btn, [id^="btn-"]'); if (!b || !tourOn) return;
    paused = false; updatePauseBtn(); schedule();
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    $('mode-student').addEventListener('click', () => setMode('student'));
    $('mode-teacher').addEventListener('click', () => setMode('teacher'));
    $('teach-pause').addEventListener('click', togglePause);
    $('teach-replay').addEventListener('click', replay);
  });
  if (document.readyState !== 'loading') { /* 腳本在 body 尾端載入時 DOMContentLoaded 可能已過 */
    $('mode-student') && ($('mode-student').onclick = () => setMode('student'), $('mode-teacher').onclick = () => setMode('teacher'), $('teach-pause').onclick = togglePause, $('teach-replay').onclick = replay);
  }

  /* ── 動手做實驗台：進到該分頁才 activate，離開就 deactivate（各實驗台檔自己把面板加到分頁最後）── */
  const LAB_OF = { tab1: 'probe', tab2: 'push', tab3: 'friction3d', tab4: 'garage', tab5: 'wall' };
  function syncLabs() {
    const L = window.W5Lab || {};
    Object.keys(LAB_OF).forEach(t => {
      const lab = L[LAB_OF[t]]; if (!lab) return;
      try { if (t === currentTab) lab.activate && lab.activate(); else lab.deactivate && lab.deactivate(); } catch (e) { if (window.console) console.warn('[lab]', LAB_OF[t], e); }
    });
  }
  const prevStart = window.startCurrent;
  window.startCurrent = function () { prevStart(); syncLabs(); };
  document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => setTimeout(() => { const L = window.W5Lab || {}; Object.keys(L).forEach(k => { try { L[k].relang && L[k].relang(); } catch (e) {} }); }, 0)));
  window.addEventListener('load', () => setTimeout(syncLabs, 300));
  W5.mode = 'step';                                  /* 預設＝學生操作 */
  document.addEventListener('langchange', () => updatePauseBtn());
})();

/* electrolysis_5_teach_1107_v1.js — 「學生操作／老師講解」雙模式（AGENTS 10.7；外層加法）
 * 學生操作（預設，AGENTS 10.6）：一次只播一個步驟，播完停在最後一幀；按步驟編號＝從該步開頭播。
 *   每個分頁下面另有「🔬 動手做」面板（電鍍分頁是自己裝電鍍的實驗台），學生模式與老師模式都留著。
 * 老師講解＝自動播放：按下去就從目前分頁動畫的第 1 步開始，步驟之間不停（各模組 setStepStop(false)）連播到底，
 *   最後一步播完停住（不循環）。可暫停／繼續、從頭重播、點步驟編號跳到那一步
 *   （畫面是時間 t 的純函式，所以跳步與真的播到那裡完全相同）。切分頁就從新分頁第 1 步播起。
 * 與動畫模組的接口：ElAnim.ctl = { paused, onEnd }；各模組 frame 迴圈讀 ctl.paused 凍結時間，
 *   在 stepStop＝false 且播到整個場景結尾時呼叫 ctl.onEnd() 一次；setStepStop(bool) 由本檔切換。
 * 進度條：讀各模組的 _info()（total）與 _state()（t）。
 * 控制列（暫停／重播／進度條／說明）會被搬到目前「動畫」畫布的正上方（placeBar）；模式切換鈕仍在頁首。
 * 目前分頁對應哪個模組，由頁面接線 script 提供的 ElAnim.currentKey() 回答。
 */
(function () {
  'use strict';
  window.ElAnim = window.ElAnim || {};
  const ctl = ElAnim.ctl = ElAnim.ctl || { paused: false, onEnd: null };
  const MODS = ['intro', 'water', 'cuc', 'cucu', 'plating'];
  const $ = id => document.getElementById(id);
  const T = { on: false, ended: false };
  const tabEl = () => document.querySelector('.tab-content.active');
  const tx = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const keyNow = () => (ElAnim.currentKey ? ElAnim.currentKey() : null);
  const curMod = () => { const k = keyNow(); return k ? window.ElAnim[k] : null; };
  const eachMod = fn => MODS.forEach(k => { const m = window.ElAnim[k]; if (m && m.setStepStop) fn(m); });
  const total = k => { const m = window.ElAnim[k]; if (!m || !m._info) return 0; const i = m._info(), id = Object.keys(i)[0]; return i[id] ? i[id].total : 0; };

  // 把控制列放到目前動畫畫布的正上方（每個分頁第一個 .canvas-wrap 就是教學動畫；動手做在後面）
  function placeBar() {
    const bar = $('teachBar'), s = tabEl(), w = s && s.querySelector('.canvas-wrap');
    if (bar && w && bar.nextElementSibling !== w) w.parentNode.insertBefore(bar, w);
  }
  function clickFirstStep() {
    const s = tabEl(), b = s && s.querySelector('.step-row .step-btn'); if (b) b.click();
  }
  function restartTab() {            // 從該分頁動畫第 1 步開頭連播
    ctl.paused = false; T.ended = false; setPauseLabel();
    clickFirstStep(); placeBar();
    const bar = $('teachBar');
    if (bar && bar.scrollIntoView) bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function onEnd() { T.ended = true; }   // 動畫模組：整個場景播到結尾了（每個分頁只有一段，沒有接力）
  function setMode(m) {
    const teacher = m === 'teacher';
    if (teacher === T.on) return;
    T.on = teacher;
    document.body.classList.toggle('mode-teacher', teacher);
    $('mode-student').classList.toggle('active', !teacher); $('mode-student').setAttribute('aria-pressed', String(!teacher));
    $('mode-teacher').classList.toggle('active', teacher); $('mode-teacher').setAttribute('aria-pressed', String(teacher));
    eachMod(mod => mod.setStepStop(!teacher));
    placeBar();
    if (teacher) { ctl.onEnd = onEnd; restartTab(); }
    else { ctl.onEnd = null; T.ended = false; ctl.paused = false; clickFirstStep(); $('teach-fill').style.width = '0'; }
  }
  function setPauseLabel() {
    const b = $('teach-pause'); if (!b) return;
    b.textContent = ctl.paused ? tx('▶ 繼續', '▶ Resume') : tx('⏸ 暫停', '⏸ Pause');
    b.classList.toggle('hot', ctl.paused);
  }
  function progress() {              // 目前分頁動畫的進度 0..1
    const mod = curMod(), k = keyNow(); if (!mod || !mod._info) return null;
    const st = mod._state(), tot = total(k), t = Math.min(st.t || 0, tot);
    return { k: tot ? t / tot : 0, running: st.running };
  }
  function tick() {
    if (!T.on) return;
    placeBar();
    const p = progress(); if (!p) return;
    if (T.ended && p.running) T.ended = false;               // 老師點步驟編號重播：不再是「播完了」
    $('teach-fill').style.width = (T.ended ? 100 : Math.max(0, Math.min(100, p.k * 100))).toFixed(1) + '%';
    $('teach-note').textContent = T.ended
      ? tx('這個分頁播完了：按「從頭重播」再看一次，或點上方換下一個分頁。', 'This tab is done: press Replay, or pick another tab above.')
      : tx('連續播放中（點步驟編號可跳到那一步）', 'Playing continuously (press a step number to jump)');
  }

  $('mode-student').addEventListener('click', () => setMode('student'));
  $('mode-teacher').addEventListener('click', () => setMode('teacher'));
  $('teach-pause').addEventListener('click', () => { ctl.paused = !ctl.paused; setPauseLabel(); });
  $('teach-replay').addEventListener('click', () => restartTab());
  // 切分頁：老師模式就從新分頁第 1 步播起（頁面本身的分頁處理與模組啟動先跑，這裡後跑）
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { if (T.on) { setTimeout(placeBar, 0); setTimeout(() => restartTab(), 160); } }));
  // 語言切換後更新暫停鍵文字（其餘文字由 data-zh/en 與 tick 更新）
  document.querySelectorAll('.lang-pill').forEach(b => b.addEventListener('click', () => setTimeout(setPauseLabel, 0)));
  setInterval(tick, 200);
  window.setElMode = setMode;
})();

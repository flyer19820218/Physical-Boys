/* electric_energy_power_1_teach_1105_v1.js — 「學生操作／老師講解」雙模式（AGENTS 10.7；外層加法）
 * 學生操作（預設，AGENTS 10.6）：一次只播一個步驟，播完停在最後一幀；按步驟編號＝從該步開頭播。
 *   每個分頁下面另有「🔬 動手做」面板（原有滑桿、按鈕與繪圖），學生模式與老師模式都留著。
 * 老師講解：按下去就從目前分頁動畫的第 1 步開始，步驟之間不停（各模組 setStepStop(false)）連播到底，
 *   最後一步播完停住（不循環）。可暫停／繼續、從頭重播、點步驟編號跳到那一步
 *   （畫面是時間 t 的純函式，所以跳步與真的播到那裡完全相同）。切分頁就從新分頁第 1 步播起。
 * 與動畫模組的接口：EpAnim.ctl = { paused, onEnd }；各模組 frame 迴圈讀 ctl.paused 凍結時間，
 *   在 stepStop＝false 且播到整個場景結尾時呼叫 ctl.onEnd() 一次；setStepStop(bool) 由本檔切換。
 * 進度條：讀各模組的 _info()（total）與 _state()（t）。
 * 控制列（暫停／重播／進度條／說明）會被搬到目前分頁「動畫」畫布的正上方（placeBar）；
 *   模式切換鈕（學生操作／老師講解）仍在頁首。
 * 這頁每個分頁只有一個動畫場景、沒有子分頁，所以沒有「場景接力」。
 */
(function () {
  'use strict';
  window.EpAnim = window.EpAnim || {};
  const ctl = EpAnim.ctl = EpAnim.ctl || { paused: false, onEnd: null };
  const MOD = { 'tab-effects': 'effects', 'tab-voltage': 'voltage', 'tab-energy': 'energy', 'tab-power': 'power', 'tab-label': 'label' };
  const $ = id => document.getElementById(id);
  const T = { on: false, ended: false };
  const tabEl = () => document.querySelector('.tab-content.active');
  const tx = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const curMod = () => { const t = tabEl(); return t ? window.EpAnim[MOD[t.id]] : null; };
  const eachMod = fn => Object.keys(MOD).forEach(t => { const m = window.EpAnim[MOD[t]]; if (m && m.setStepStop) fn(m); });

  // 把控制列放到目前分頁動畫畫布的正上方（每個分頁第一個 .canvas-wrap 就是教學動畫；動手做在後面）
  function placeBar() {
    const bar = $('teachBar'), t = tabEl(), w = t && t.querySelector('.canvas-wrap');
    if (bar && w && bar.nextElementSibling !== w) w.parentNode.insertBefore(bar, w);
  }
  function clickFirstStep() {
    const t = tabEl(), b = t && t.querySelector('.step-row .step-btn'); if (b) b.click();
  }
  function restartTab() {            // 從該分頁動畫第 1 步開頭連播
    ctl.paused = false; T.ended = false; setPauseLabel();
    clickFirstStep();
    placeBar();
    const bar = $('teachBar');
    if (bar && bar.scrollIntoView) bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function onEnd() { T.ended = true; }   // 動畫模組：整個場景播到結尾了
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
    const mod = curMod(); if (!mod || !mod._info) return null;
    const info = mod._info(), st = mod._state(), id = Object.keys(info)[0];
    const total = info[id] ? info[id].total : 0;
    return { k: total ? Math.min(st.t || 0, total) / total : 0, running: st.running };
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
  $('teach-replay').addEventListener('click', restartTab);
  // 切分頁：老師模式就從新分頁第 1 步播起（頁面本身的分頁處理與模組啟動先跑，這裡後跑）
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { if (T.on) { setTimeout(placeBar, 0); setTimeout(restartTab, 160); } }));
  // 語言切換後更新暫停鍵文字（其餘文字由 data-zh/en 與 tick 更新）
  document.querySelectorAll('.lang-pill').forEach(b => b.addEventListener('click', () => setTimeout(setPauseLabel, 0)));
  setInterval(tick, 200);
  window.setEpMode = setMode;
})();

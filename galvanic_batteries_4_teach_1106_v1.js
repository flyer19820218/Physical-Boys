/* galvanic_batteries_4_teach_1106_v1.js — 「學生操作／老師講解」雙模式（AGENTS 10.7；外層加法）
 * 學生操作（預設，AGENTS 10.6）：一次只播一個步驟，播完停在最後一幀；按步驟編號＝從該步開頭播。
 *   每個分頁下面另有「🔬 動手做」面板（原有的畫布、按鈕與互動），學生模式與老師模式都留著。
 * 老師講解：按下去就從目前分頁動畫的第 1 步開始，步驟之間不停（各模組 setStepStop(false)）連播到底，
 *   最後一步播完停住（不循環）。可暫停／繼續、從頭重播、點步驟編號跳到那一步
 *   （畫面是時間 t 的純函式，所以跳步與真的播到那裡完全相同）。切分頁就從新分頁第 1 步播起。
 * 「科學史」分頁有兩段動畫（賈法尼蛙腿 → 伏打電池）：老師講解時第一段播完會自動切到下一個子分頁接著播
 *   （場景接力），兩段都播完才停；進度條是兩段合計。
 * 與動畫模組的接口：GbAnim.ctl = { paused, onEnd }；各模組 frame 迴圈讀 ctl.paused 凍結時間，
 *   在 stepStop＝false 且播到整個場景結尾時呼叫 ctl.onEnd() 一次；setStepStop(bool) 由本檔切換。
 * 進度條：讀各模組的 _info()（total）與 _state()（t）。
 * 控制列（暫停／重播／進度條／說明）會被搬到目前「動畫」畫布的正上方（placeBar）；
 *   模式切換鈕（學生操作／老師講解）仍在頁首。
 * 目前分頁／子分頁對應哪個模組，由頁面接線 script 提供的 GbAnim.currentKey() 回答。
 */
(function () {
  'use strict';
  window.GbAnim = window.GbAnim || {};
  const ctl = GbAnim.ctl = GbAnim.ctl || { paused: false, onEnd: null };
  const MODS = ['galvani', 'volta', 'origin', 'redox', 'cell', 'types'];
  const RELAY = ['galvani', 'volta'];                                // 場景接力（科學史兩個子分頁）
  const $ = id => document.getElementById(id);
  const T = { on: false, ended: false, switching: false };
  const tabEl = () => document.querySelector('.tab-content.active');
  const tx = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const keyNow = () => (GbAnim.currentKey ? GbAnim.currentKey() : null);
  const curMod = () => { const k = keyNow(); return k ? window.GbAnim[k] : null; };
  const eachMod = fn => MODS.forEach(k => { const m = window.GbAnim[k]; if (m && m.setStepStop) fn(m); });
  const total = k => { const m = window.GbAnim[k]; if (!m || !m._info) return 0; const i = m._info(), id = Object.keys(i)[0]; return i[id] ? i[id].total : 0; };

  // 目前「看得到的」教學動畫容器：科學史看目前的子分頁，其他看整個分頁
  function scope() { const t = tabEl(); return (t && t.querySelector('.gb-subpage.active')) || t; }
  // 把控制列放到目前動畫畫布的正上方（每個分頁／子分頁第一個 .canvas-wrap 就是教學動畫；動手做在後面）
  function placeBar() {
    const bar = $('teachBar'), s = scope(), w = s && s.querySelector('.canvas-wrap');
    if (bar && w && bar.nextElementSibling !== w) w.parentNode.insertBefore(bar, w);
  }
  function clickFirstStep() {
    const s = scope(), b = s && s.querySelector('.step-row .step-btn'); if (b) b.click();
  }
  function gotoSub(k) {              // 切到科學史的某個子分頁（走頁面原本的點擊處理）
    const b = document.querySelector('[data-gb-sub="' + k + '"]'); if (b) b.click();
  }
  function restartTab(fromScene) {   // 從該分頁動畫第 1 步開頭連播；科學史從第 1 段（或指定段）開始
    ctl.paused = false; T.ended = false; setPauseLabel();
    const t = tabEl();
    if (t && t.id === 'tab-history') {
      const want = fromScene || 'galvani';
      if (keyNow() !== want) { T.switching = true; gotoSub(want); setTimeout(() => { T.switching = false; clickFirstStep(); placeBar(); }, 200); }
      else clickFirstStep();
    } else clickFirstStep();
    placeBar();
    const bar = $('teachBar');
    if (bar && bar.scrollIntoView) bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function onEnd() {                 // 動畫模組：整個場景播到結尾了
    const k = keyNow(), i = RELAY.indexOf(k);
    if (i >= 0 && i < RELAY.length - 1) {                 // 科學史：接著播下一段
      T.switching = true; gotoSub(RELAY[i + 1]);
      setTimeout(() => { T.switching = false; clickFirstStep(); placeBar(); }, 260);
      return;
    }
    T.ended = true;
  }
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
    else { ctl.onEnd = null; T.ended = false; T.switching = false; ctl.paused = false; clickFirstStep(); $('teach-fill').style.width = '0'; }
  }
  function setPauseLabel() {
    const b = $('teach-pause'); if (!b) return;
    b.textContent = ctl.paused ? tx('▶ 繼續', '▶ Resume') : tx('⏸ 暫停', '⏸ Pause');
    b.classList.toggle('hot', ctl.paused);
  }
  function progress() {              // 目前分頁動畫的進度 0..1（科學史＝兩段合計）與段落資訊
    const mod = curMod(), k = keyNow(); if (!mod || !mod._info) return null;
    const st = mod._state(), i = RELAY.indexOf(k);
    const t = Math.min(st.t || 0, total(k));
    if (i < 0) { const tot = total(k); return { k: tot ? t / tot : 0, running: st.running, part: 0, parts: 1 }; }
    let before = 0, all = 0;
    RELAY.forEach((r, j) => { const tt = total(r); all += tt; if (j < i) before += tt; });
    return { k: all ? (before + t) / all : 0, running: st.running, part: i + 1, parts: RELAY.length };
  }
  function tick() {
    if (!T.on) return;
    placeBar();
    if (T.switching) return;
    const p = progress(); if (!p) return;
    if (T.ended && p.running) T.ended = false;               // 老師點步驟編號重播：不再是「播完了」
    $('teach-fill').style.width = (T.ended ? 100 : Math.max(0, Math.min(100, p.k * 100))).toFixed(1) + '%';
    const where = p.parts > 1 ? tx('（第 ' + p.part + '／' + p.parts + ' 段）', ' (part ' + p.part + ' of ' + p.parts + ')') : '';
    $('teach-note').textContent = T.ended
      ? tx('這個分頁播完了：按「從頭重播」再看一次，或點上方換下一個分頁。', 'This tab is done: press Replay, or pick another tab above.')
      : tx('連續播放中', 'Playing continuously') + where + tx('（點步驟編號可跳到那一步）', ' (press a step number to jump)');
  }

  $('mode-student').addEventListener('click', () => setMode('student'));
  $('mode-teacher').addEventListener('click', () => setMode('teacher'));
  $('teach-pause').addEventListener('click', () => { ctl.paused = !ctl.paused; setPauseLabel(); });
  $('teach-replay').addEventListener('click', () => restartTab());
  // 切分頁：老師模式就從新分頁第 1 步播起（頁面本身的分頁處理與模組啟動先跑，這裡後跑）
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { if (T.on) { setTimeout(placeBar, 0); setTimeout(() => restartTab(), 160); } }));
  // 老師自己點科學史的子分頁：就從那一段第 1 步播起（接力自己切換時 T.switching 為真，不重複處理）
  document.querySelectorAll('[data-gb-sub]').forEach(b => b.addEventListener('click', () => {
    if (T.on && !T.switching) { setTimeout(placeBar, 0); setTimeout(() => { ctl.paused = false; T.ended = false; setPauseLabel(); clickFirstStep(); }, 160); }
  }));
  // 語言切換後更新暫停鍵文字（其餘文字由 data-zh/en 與 tick 更新）
  document.querySelectorAll('.lang-pill').forEach(b => b.addEventListener('click', () => setTimeout(setPauseLabel, 0)));
  setInterval(tick, 200);
  window.setGbMode = setMode;
})();

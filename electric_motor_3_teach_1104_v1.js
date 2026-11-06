/* electric_motor_3_teach_1104_v1.js — 「學生操作／老師講解」雙模式（AGENTS 10.7；外層加法）
 * 學生操作：各分頁動畫循環播放；有練習鈕／滑桿的分頁可自己動手（練習控制在 .practice-only 裡）。
 * 老師講解：按下去就從目前分頁的第一段動畫開始，同一分頁的多段動畫（子分頁）一段接一段自動播完；
 *   可暫停／繼續、從頭重播，點步驟編號可跳到該步；切分頁就從頭播新分頁；播完停在最後一格。
 *   老師模式下 .practice-only 收起來（CSS：body.mode-teacher .practice-only）。
 * 與動畫模組的接口：MotorAnim.ctl = { paused, onEnd }
 *   模組 frame 迴圈讀 ctl.paused；onEnd 有值（＝老師模式）時，場景播到結尾就停住並通知 onEnd 一次。
 * 進度條：讀各模組的 _state()（{t}）與 _info()（{ 場景id: {total} }）。
 * 單場景分頁（struct、power）沒有子分頁鈕：重播走 window.motorRestartScene()（頁面提供）。
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const ctl = MotorAnim.ctl = MotorAnim.ctl || { paused: false, onEnd: null };
  const MOD = { 'tab-palm': 'palm', 'tab-force-examples': 'force', 'tab-gifted': 'gifted', 'tab-motor-struct': 'struct', 'tab-motor-anim': 'anim', 'tab-motor-power': 'power' };
  const $ = id => document.getElementById(id);
  const T = { on: false, due: 0, ended: false };
  const tabEl = () => document.querySelector('.tab-content.active');
  const subBtns = () => { const t = tabEl(); return t ? Array.from(t.querySelectorAll('.sub-tab-btn')) : []; };
  const activeIdx = () => subBtns().findIndex(b => b.classList.contains('active'));
  const tx = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);

  // 2026-11-05 老師指示：暫停／重播／進度條要放在動畫旁邊，不要留在頁首的模式列。
  // 老師模式下把 #teachBar 搬到目前分頁「步驟鈕」正下方（畫布下方），切分頁就跟著搬。
  function placeBar() {
    const bar = $('teachBar'), t = tabEl(); if (!bar || !t) return;
    const row = t.querySelector('.step-row'); if (!row) return;
    if (row.nextElementSibling !== bar) row.insertAdjacentElement('afterend', bar);
  }
  function restartTab() {            // 回到該分頁第一段，從頭播
    ctl.paused = false; T.due = 0; T.ended = false; setPauseLabel();
    const bs = subBtns();
    if (bs.length) { if (bs[0].classList.contains('active') && window.motorRestartScene) window.motorRestartScene(); else bs[0].click(); }
    else if (window.motorRestartScene) window.motorRestartScene();
    const t = tabEl(), cv = t && t.querySelector('canvas');
    if (cv && cv.scrollIntoView) cv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function restartScene() {          // 離開老師模式：目前這段從頭循環
    ctl.paused = false; const bs = subBtns(), i = activeIdx();
    if (bs[i]) bs[i].click(); else if (window.motorRestartScene) window.motorRestartScene();
  }
  function onEnd() {                 // 動畫模組：這一段播完了
    const bs = subBtns(), i = activeIdx();
    if (i >= 0 && i < bs.length - 1) { T.due = performance.now() + 1500; T.ended = false; }
    else { T.ended = true; }
  }
  function setMode(m) {
    const teacher = m === 'teacher';
    if (teacher === T.on) return;
    T.on = teacher;
    document.body.classList.toggle('mode-teacher', teacher);
    $('mode-student').classList.toggle('active', !teacher); $('mode-student').setAttribute('aria-pressed', String(!teacher));
    $('mode-teacher').classList.toggle('active', teacher); $('mode-teacher').setAttribute('aria-pressed', String(teacher));
    if (teacher) { ctl.onEnd = onEnd; placeBar(); restartTab(); }
    else { ctl.onEnd = null; T.due = 0; T.ended = false; restartScene(); $('teach-fill').style.width = '0'; }
  }
  function setPauseLabel() {
    const b = $('teach-pause'); if (!b) return;
    b.textContent = ctl.paused ? tx('▶ 繼續', '▶ Resume') : tx('⏸ 暫停', '⏸ Pause');
    b.classList.toggle('hot', ctl.paused);
  }
  function progress() {              // 整個分頁（所有子場景）的進度 0..1 ＋ 說明文字
    const tid = tabEl() && tabEl().id, mod = MotorAnim[MOD[tid]]; if (!mod || !mod._info) return null;
    const info = mod._info(), st = mod._state(), bs = subBtns();
    let ids, i, names;
    if (bs.length) { i = activeIdx(); if (i < 0) return null; ids = bs.map(b => b.dataset.sub); names = bs.map(b => b.textContent.trim()); }
    else { ids = Object.keys(info); i = 0; names = [tabEl().querySelector('h2') ? tabEl().querySelector('h2').textContent.trim() : '']; }
    let tot = 0, done = 0;
    ids.forEach((id, k) => { const d = info[id] ? info[id].total : 0; tot += d; if (k < i) done += d; });
    const cur = info[ids[i]] ? Math.min(st.t || 0, info[ids[i]].total) : 0;
    return { k: tot ? (done + cur) / tot : 0, i, n: ids.length, name: names[i] };
  }
  function tick() {
    if (!T.on) return;
    if (T.due && !ctl.paused && performance.now() >= T.due) {
      T.due = 0; const bs = subBtns(), i = activeIdx(); if (bs[i + 1]) bs[i + 1].click();
    }
    const p = progress();
    if (p) {
      $('teach-fill').style.width = (T.ended ? 100 : Math.max(0, Math.min(100, p.k * 100))).toFixed(1) + '%';
      $('teach-note').textContent = T.ended
        ? tx('這個分頁播完了：按「從頭重播」再看一次，或點上方換下一個分頁。', 'This tab is done: press Replay, or pick another tab above.')
        : (p.n > 1
          ? tx(`第 ${p.i + 1} / ${p.n} 段：${p.name}（點步驟編號可跳到那一步）`, `Part ${p.i + 1} / ${p.n}: ${p.name} (press a step number to jump)`)
          : tx('自動播放中（點步驟編號可跳到那一步）', 'Playing automatically (press a step number to jump)'));
    }
  }

  $('mode-student').addEventListener('click', () => setMode('student'));
  $('mode-teacher').addEventListener('click', () => setMode('teacher'));
  $('teach-pause').addEventListener('click', () => { ctl.paused = !ctl.paused; setPauseLabel(); });
  $('teach-replay').addEventListener('click', restartTab);
  // 切分頁：老師模式就從新分頁第一段播起（頁面本身的分頁處理先跑，這裡後跑）
  document.querySelectorAll('.tab-button').forEach(b => b.addEventListener('click', () => { if (T.on) setTimeout(() => { placeBar(); restartTab(); }, 90); }));
  // 語言切換後更新暫停鍵文字（其餘文字由 data-zh/en 與 tick 更新）
  document.querySelectorAll('.lang-pill').forEach(b => b.addEventListener('click', () => setTimeout(setPauseLabel, 0)));
  setInterval(tick, 200);
  window.setMotorMode = setMode;
})();

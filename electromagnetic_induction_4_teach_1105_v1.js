/* electromagnetic_induction_4_teach_1105_v1.js — 「學生操作／老師講解」雙模式（AGENTS 10.7；外層加法）
 * 學生操作（預設，AGENTS 10.6）：一次只播一個步驟，播完停在最後一幀；按步驟編號＝從該步開頭播。
 * 老師講解：按下去就從目前分頁的第一個場景開頭開始，步驟之間不停（各模組 setStepStop(false)）連播到底，
 *   同一分頁有多個場景就一個接一個（法拉第→冷次、直流→交流）；最後一步播完停住（不循環）。
 *   可暫停／繼續、從頭重播、點步驟編號跳到那一步（畫面是時間 t 的純函式，所以跳步與真的播到那裡完全相同）。
 *   切分頁就從新分頁第一個場景播起；變壓器分頁的「資優補充」子分頁只有文字，不參與接力。
 * 與動畫模組的接口：EmiAnim.ctl = { paused, onEnd }；各模組 frame 迴圈讀 ctl.paused 凍結時間，
 *   在 stepStop＝false 且播到整個場景結尾時呼叫 ctl.onEnd() 一次；setStepStop(bool) 由本檔切換。
 * 進度條：讀各模組的 _info()（每場景 total）與 _state()（t）。
 */
(function () {
  'use strict';
  window.EmiAnim = window.EmiAnim || {};
  const ctl = EmiAnim.ctl = EmiAnim.ctl || { paused: false, onEnd: null };
  const MOD = { history: 'faraday', generator: 'gen', transformer: 'trans', cooker: 'cooker' };
  const NO_ANIM_SUB = { 'trans-gifted': true };     // 只有文字的子分頁
  const $ = id => document.getElementById(id);
  const T = { on: false, due: 0, ended: false };
  const tabEl = () => document.querySelector('.tab-content.active');
  const tx = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const allSubs = () => { const t = tabEl(); return t ? Array.from(t.querySelectorAll('.sub-tab-btn')) : []; };
  const playSubs = () => allSubs().filter(b => !NO_ANIM_SUB[b.dataset.sub]);   // 參與接力的子分頁
  const curSub = () => allSubs().find(b => b.classList.contains('active'));
  const curMod = () => { const t = tabEl(); return t ? window.EmiAnim[MOD[t.id]] : null; };
  const eachMod = fn => Object.keys(MOD).forEach(t => { const m = window.EmiAnim[MOD[t]]; if (m && m.setStepStop) fn(m); });

  function clickFirstStep() {
    const t = tabEl(), b = t && t.querySelector('.step-row .step-btn'); if (b) b.click();
  }
  function restartTab() {            // 回到該分頁第一個場景，從頭連播
    ctl.paused = false; T.due = 0; T.ended = false; setPauseLabel();
    const ps = playSubs();
    if (ps.length && ps[0] !== curSub()) ps[0].click();      // 換子分頁：模組從 t＝0 重新啟動
    else clickFirstStep();                                   // 已在第一個場景：跳到第 1 步開頭
    const t = tabEl(), cv = t && t.querySelector('canvas');
    if (cv && cv.scrollIntoView) cv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function restartScene() {          // 離開老師模式：目前這個場景回到第 1 步（學生模式會播完第 1 步後停住）
    ctl.paused = false; const s = curSub();
    if (s && !NO_ANIM_SUB[s.dataset.sub]) s.click(); else clickFirstStep();
  }
  function onEnd() {                 // 動畫模組：這個場景播到結尾了
    const ps = playSubs(), i = ps.indexOf(curSub());
    if (i >= 0 && i < ps.length - 1) { T.due = performance.now() + 1500; T.ended = false; }
    else { T.ended = true; }
  }
  function setMode(m) {
    const teacher = m === 'teacher';
    if (teacher === T.on) return;
    T.on = teacher;
    document.body.classList.toggle('mode-teacher', teacher);
    $('mode-student').classList.toggle('active', !teacher); $('mode-student').setAttribute('aria-pressed', String(!teacher));
    $('mode-teacher').classList.toggle('active', teacher); $('mode-teacher').setAttribute('aria-pressed', String(teacher));
    eachMod(mod => mod.setStepStop(!teacher));
    if (teacher) { ctl.onEnd = onEnd; restartTab(); }
    else { ctl.onEnd = null; T.due = 0; T.ended = false; restartScene(); $('teach-fill').style.width = '0'; }
  }
  function setPauseLabel() {
    const b = $('teach-pause'); if (!b) return;
    b.textContent = ctl.paused ? tx('▶ 繼續', '▶ Resume') : tx('⏸ 暫停', '⏸ Pause');
    b.classList.toggle('hot', ctl.paused);
  }
  function progress() {              // 整個分頁（所有場景）的進度 0..1 ＋ 說明文字
    const mod = curMod(); if (!mod || !mod._info) return null;
    const info = mod._info(), st = mod._state(), ps = playSubs(), s = curSub();
    if (s && NO_ANIM_SUB[s.dataset.sub]) return { text: true };
    const keys = Object.keys(info);
    const ids = ps.length ? ps.map(b => (info[b.dataset.sub] ? b.dataset.sub : keys[0])) : keys;
    const i = Math.max(0, ps.indexOf(s)), names = ps.length ? ps.map(b => b.textContent.trim()) : [''];
    let tot = 0, done = 0;
    ids.forEach((id, k) => { const d = info[id] ? info[id].total : 0; tot += d; if (k < i) done += d; });
    const cur = info[ids[i]] ? Math.min(st.t || 0, info[ids[i]].total) : 0;
    return { k: tot ? (done + cur) / tot : 0, i, n: ids.length, name: names[i], running: st.running };
  }
  function tick() {
    if (!T.on) return;
    if (T.due && !ctl.paused && performance.now() >= T.due) {
      T.due = 0; const ps = playSubs(), i = ps.indexOf(curSub()); if (ps[i + 1]) ps[i + 1].click();
    }
    const p = progress(); if (!p) return;
    if (p.text) { $('teach-note').textContent = tx('這個子分頁只有文字，請自己讀；點「變壓原理」回到動畫。', 'This sub-tab is text only. Press "How it works" to return to the animation.'); return; }
    if (T.ended && p.running) T.ended = false;               // 老師點步驟編號重播：不再是「播完了」
    $('teach-fill').style.width = (T.ended ? 100 : Math.max(0, Math.min(100, p.k * 100))).toFixed(1) + '%';
    $('teach-note').textContent = T.ended
      ? tx('這個分頁播完了：按「從頭重播」再看一次，或點上方換下一個分頁。', 'This tab is done: press Replay, or pick another tab above.')
      : (p.n > 1
        ? tx(`第 ${p.i + 1} / ${p.n} 段：${p.name}（點步驟編號可跳到那一步）`, `Part ${p.i + 1} / ${p.n}: ${p.name} (press a step number to jump)`)
        : tx('連續播放中（點步驟編號可跳到那一步）', 'Playing continuously (press a step number to jump)'));
  }

  $('mode-student').addEventListener('click', () => setMode('student'));
  $('mode-teacher').addEventListener('click', () => setMode('teacher'));
  $('teach-pause').addEventListener('click', () => { ctl.paused = !ctl.paused; setPauseLabel(); });
  $('teach-replay').addEventListener('click', restartTab);
  // 切分頁：老師模式就從新分頁第一個場景播起（頁面本身的分頁處理先跑，這裡後跑）
  document.querySelectorAll('.tab-button').forEach(b => b.addEventListener('click', () => { if (T.on) setTimeout(restartTab, 120); }));
  // 老師模式下自己點子分頁（例如直接點「交流發電機」）：從那個場景開頭連播，接力與進度照常
  document.querySelectorAll('.sub-tab-btn').forEach(b => b.addEventListener('click', () => { if (T.on) { T.due = 0; T.ended = false; } }));
  // 語言切換後更新暫停鍵文字（其餘文字由 data-zh/en 與 tick 更新）
  document.querySelectorAll('.lang-pill').forEach(b => b.addEventListener('click', () => setTimeout(setPauseLabel, 0)));
  setInterval(tick, 200);
  window.setEmiMode = setMode;
})();

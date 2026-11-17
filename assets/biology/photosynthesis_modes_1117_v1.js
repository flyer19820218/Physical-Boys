/* biology_photosynthesis：學生操作／老師講解（2026-11-17，外層加法；做法同 enzymes_modes_lab_1117_v1.js）
 * - 學生操作＝每次播一個步驟鈕（一組子步驟）就停住（AGENTS 10.6）；老師講解＝從頭連續播到最後一步停住，可暫停／從頭重播（10.7）。
 * - 只呼叫 photosynthesis_v9.js 開放的 PhotosynthesisLesson.setStop／pause／restart／progress／getState，不改模型、繪圖、秒數。
 * - 老師控制列插在每個分頁的動畫（.ps-lab）正下方；頁面切語言時會重建 #lessons，用 MutationObserver 重新插回。
 * - 本課尚未做「動手做」實驗台（10.7 的實驗台另案，需老師指定）。
 */
(function () {
  'use strict';
  const IDS = ['plant', 'photo', 'reaction', 'guard', 'experiment', 'evidence'];
  const $ = id => document.getElementById(id);
  const L = () => window.PhotosynthesisLesson;
  const lang = () => (L() && L().getState().lang) || 'zh';
  const tr = (z, e) => (lang() === 'zh' ? z : e);
  let teacher = false, sig = '';

  function mount() {
    IDS.forEach(id => {
      const lab = $('lab-' + id);
      if (!lab || $('psteach-' + id)) return;
      lab.insertAdjacentHTML('afterend', `<div class="ps-teach" id="psteach-${id}"><button type="button" class="ps-tbtn" data-tact="pause"></button><button type="button" class="ps-tbtn" data-tact="replay"></button><div class="ps-track"><div class="ps-fill"></div></div><div class="ps-tnote" aria-live="polite"></div></div>`);
      $('psteach-' + id).addEventListener('click', onTeach);
    });
    paint(true);
  }
  function setMode(m) {
    const t = m === 'teacher';
    teacher = t;
    document.body.classList.toggle('mode-teacher', t);
    ['student', 'teacher'].forEach(k => { const b = $('mode-' + k); if (b) { const on = (k === 'teacher') === t; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); } });
    if (!L()) return;
    L().setStop(t ? 'none' : 'group');
    L().pause(false);
    L().restart();             // 兩種模式都從這個分頁的第一步開始
    if (t) { const v = document.querySelector('.lesson:not([hidden]) .ps-lab'); if (v && v.scrollIntoView) v.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    paint(true);
  }
  function onTeach(e) {
    const b = e.target.closest('[data-tact]'); if (!b || !L()) return;
    const g = L().getState();
    if (b.dataset.tact === 'pause') { if (!g.done) L().pause(!g.paused); }
    else { L().pause(false); L().restart(); }
    paint(true);
  }
  function paint(force) {
    if (!L()) return;
    const g = L().getState(), bar = $('psteach-' + IDS[g.tab]); if (!bar) return;
    const p = Math.round(L().progress() * 100);
    const s = [g.tab, p, g.paused, g.done, g.lang, teacher].join('|');
    if (!force && s === sig) return; sig = s;
    const pb = bar.querySelector('[data-tact="pause"]'), rb = bar.querySelector('[data-tact="replay"]');
    pb.textContent = g.paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause'); pb.disabled = g.done;
    rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', g.done);
    bar.querySelector('.ps-fill').style.width = p + '%';
    bar.querySelector('.ps-tnote').textContent = g.done ? tr('✔ 講解完畢；可按「從頭重播」，或點上方的步驟編號重看', '✔ Done. Press Replay, or tap a step number to revisit') : g.paused ? tr('⏸ 已暫停', '⏸ Paused') : '';
  }
  function init() {
    if (!L()) return;
    const box = $('lessons');
    if (box) new MutationObserver(() => { if (IDS.some(id => $('lab-' + id) && !$('psteach-' + id))) mount(); }).observe(box, { childList: true });
    // 切分頁時維持目前模式的播法（switchTab 會重新從第一步開始）
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#tabs [data-tab]')) setTimeout(() => paint(true), 0); });
    mount();
    setInterval(() => paint(false), 250);
  }
  window.PhotosynthesisModes = { setMode, isTeacher: () => teacher, mount };
  window.setMode = setMode;
  if (window.PhotosynthesisLesson) init(); else window.addEventListener('photosynthesis-ready', init, { once: true });
})();

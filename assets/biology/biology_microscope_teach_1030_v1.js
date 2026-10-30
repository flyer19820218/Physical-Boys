/* ==================================================================
   biology_microscope｜老師講解／學生操作（2026-10-30）
   外層加法：不改 microscope.js 與頁面任何原有程式；老師模式＝替老師操作原本的控制項。
     該選哪一種鏡？      依序點開顯微鏡各部位的說明
     放大後，看到更多嗎？ 4 倍對焦 → 10 倍 → 40 倍（粗調鎖住）→ 增加光源
     玻片右移，影像去哪？ 玻片向右／上／左移動，再看電子數字轉半圈
     小生物跑掉了！      低倍找 → 暫停置中 → 換高倍追丟 → 回低倍找回
   ================================================================== */
(function (root) {
  'use strict';
  const doc = root.document, TM = root.TeachMode;
  const $ = id => doc.getElementById(id);
  const q = s => doc.querySelector(s);
  const tabOf = () => { const b = q('.tab-btn.active'); return b ? b.dataset.tab : ''; };

  const press = (sel, n) => { const b = q(sel); for (let i = 0; b && i < (n || 1); i++) b.click(); };
  const setRange = (id, v) => { const n = $(id); if (!n) return; n.value = String(v); n.dispatchEvent(new Event('input', { bubbles: true })); };
  const setObjective = (id, v) => { const n = $(id + 'Objective'); if (!n) return; n.value = String(v); n.dispatchEvent(new Event('change', { bubbles: true })); };
  const resetOf = id => { const b = q('#' + id + 'Workbench .control-row button'); if (b) b.click(); };
  const pressText = (id, re) => { const bs = doc.querySelectorAll('#' + id + 'Workbench .control-row button'); for (const b of bs) if (re.test(b.textContent)) { b.click(); return; } };
  const afterHead = id => b => { b.classList.add('teach-inline'); const h = q('#' + id + 'Workbench .scope-head'); if (h) h.after(b); };

  /* ── 該選哪一種鏡？：依序點開顯微鏡各部位 ── */
  const partBtns = Array.from(doc.querySelectorAll('#partButtons button'));
  const scopeTypes = TM.sequence({
    mount: b => { b.classList.add('teach-inline'); const h = q('#scopeTypes h2'); if (h) h.after(b); },
    reset() { const f = $('partButtons') && $('partButtons').querySelector('button'); if (f) f.click(); },
    doneNote: ['✔ 各部位都看過了；按「從頭重播」可再看一次', '✔ All parts covered. Press Replay to watch again'],
    steps: partBtns.map((btn, i) => ({
      hold: 8,
      run: () => { const b = doc.querySelectorAll('#partButtons button')[i]; if (b) b.click(); },
      note: [btn.dataset.zh || btn.textContent, btn.dataset.en || btn.textContent]
    }))
  });

  /* ── 放大後，看到更多嗎？ ── */
  const scopeLab = TM.sequence({
    mount: afterHead('scopeLab'),
    reset() { resetOf('scopeLab'); },
    doneNote: ['✔ 示範完畢；按「從頭重播」可再看一次', '✔ Done. Press Replay to watch again'],
    steps: [
      { hold: 3, run: () => resetOf('scopeLab'), note: ['先用 4 倍物鏡：影像還有點模糊，需要調焦', 'Start with the 4× objective: the image is a bit blurry and needs focusing'] },
      { hold: 6, run: () => setRange('scopeLabCoarse', 0), note: ['粗調、細調到影像清楚（對焦）', 'Use coarse and fine focus until the image is sharp'] },
      { hold: 7, run: () => setObjective('scopeLab', 10), note: ['換 10 倍：影像變大、看見的範圍變小、也變暗', 'Switch to 10×: bigger image, smaller field of view, and darker'] },
      { hold: 7, run: () => setObjective('scopeLab', 40), note: ['換 40 倍：粗調鎖住，只能用細調；範圍更小、更暗', 'Switch to 40×: coarse focus locks; only fine focus; even smaller and darker'] },
      { hold: 7, run: () => setRange('scopeLabLamp', 100), note: ['增加入射光：變亮了，但看見的範圍沒有變大', 'More light: brighter, but the field of view does not grow'] }
    ]
  });

  /* ── 玻片右移，影像去哪？ ── */
  const scopeInversion = TM.sequence({
    mount: afterHead('scopeInversion'),
    reset() { resetOf('scopeInversion'); },
    doneNote: ['✔ 示範完畢；按「從頭重播」可再看一次', '✔ Done. Press Replay to watch again'],
    steps: [
      { hold: 4, run: () => { resetOf('scopeInversion'); press('#glyphButtons button:nth-child(1)'); }, note: ['💬 先預測：玻片往右移，目鏡裡的影像會往哪裡？', '💬 Predict: slide moves right — where does the image go?'] },
      { hold: 6, run: () => press('#scopeInversionMoves .right', 5), note: ['玻片向右 → 影像向左', 'Slide right → image moves left'] },
      { hold: 6, run: () => press('#scopeInversionMoves .up', 5), note: ['玻片向上 → 影像向下', 'Slide up → image moves down'] },
      { hold: 7, run: () => { resetOf('scopeInversion'); press('#scopeInversionMoves .left', 5); }, note: ['玻片向左 → 影像向右', 'Slide left → image moves right'] },
      { hold: 8, run: () => { resetOf('scopeInversion'); press('#glyphButtons button:nth-child(3)'); }, note: ['整張標本轉半圈：上下、左右都相反（電子數字 2:50 也是）', 'A half turn of the whole specimen: up-down and left-right both reversed'] }
    ]
  });

  /* ── 小生物跑掉了！ ── */
  /* 老師按「暫停」時，連小生物的游動一起凍結（用頁面自己的「暫停游動／繼續游動」鈕） */
  let swimWasPaused = false;
  const swimPaused = () => { const bs = doc.querySelectorAll('#scopeTrackingWorkbench .control-row button'); for (const b of bs) { if (/繼續游動|Resume swimming/.test(b.textContent)) return true; } return false; };
  const scopeTracking = TM.sequence({
    mount: afterHead('scopeTracking'),
    reset() { resetOf('scopeTracking'); },
    setPaused(p) {
      if (p) { swimWasPaused = swimPaused(); if (!swimWasPaused) pressText('scopeTracking', /暫停游動|Pause swimming/); }
      else if (!swimWasPaused) pressText('scopeTracking', /繼續游動|Resume swimming/);
    },
    doneNote: ['✔ 示範完畢；按「從頭重播」可再看一次', '✔ Done. Press Replay to watch again'],
    steps: [
      { hold: 5, run: () => resetOf('scopeTracking'), note: ['低倍：視野大，先找到正在游動的小生物', 'Low power: wide field. Find the swimming organism first'] },
      { hold: 7, run: () => pressText('scopeTracking', /暫停游動|Pause swimming/), note: ['暫停游動，練習把它移到中央（玻片與影像的方向相反）', 'Pause the swimming and practice centering it (slide and image move oppositely)'] },
      { hold: 8, run: () => { pressText('scopeTracking', /繼續游動|Resume swimming/); setObjective('scopeTracking', 40); }, note: ['換高倍：視野變小，小生物很容易游出視野', 'High power: a smaller field, so the organism easily swims out of view'] },
      { hold: 7, run: () => setObjective('scopeTracking', 4), note: ['追丟了：回到低倍找回，不要用粗調亂追', 'Lost it: go back to low power to find it; do not chase with coarse focus'] }
    ]
  });

  TM.create({
    insertBefore: q('nav.tabs'),
    getTab: tabOf,
    tabButtons: Array.from(doc.querySelectorAll('.tab-btn')),
    drivers: { scopeTypes, scopeLab, scopeInversion, scopeTracking }
  });
})(window);

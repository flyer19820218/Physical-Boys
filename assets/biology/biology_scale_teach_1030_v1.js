/* ==================================================================
   biology_scale｜老師講解／學生操作（2026-10-30）
   外層加法：不改 scale_v2.js 與頁面任何原有程式；老師模式＝替老師操作原本的按鈕／輸入。
     一樣大？尺說了算   逐一選七個對象，每個都按「讓兩者都入鏡」
     數字變了，物體沒變  同一個長度：km → m → cm → mm → μm → nm
     好多個零，怎麼讀？  依序輸入 1、100、500、1000、1270、0.000002
     想看什麼，用什麼？  四個觀察任務 × 肉眼／一般光學／電子顯微
   ================================================================== */
(function (root) {
  'use strict';
  const doc = root.document, TM = root.TeachMode;
  const q = s => doc.querySelector(s);
  const qa = s => Array.from(doc.querySelectorAll(s));
  const press = s => { const b = q(s); if (b && !b.disabled) b.click(); };
  const nth = (s, n) => { const b = qa(s)[n]; if (b && !b.disabled) b.click(); };
  const tabOf = () => { const b = q('.tab-btn.active'); return b ? b.dataset.tab : ''; };
  const DONE = ['✔ 示範完畢；按「從頭重播」可再看一次', '✔ Done. Press Replay to watch again'];
  const afterHead = id => b => { b.classList.add('teach-inline'); const h = q('#' + id + ' .bio2-head'); if (h) h.after(b); };
  const label = b => [b.dataset.zh || b.textContent.trim().replace(/\s+/g, ' '), b.dataset.en || b.textContent.trim().replace(/\s+/g, ' ')];
  const setSel = (id, i) => { const s = doc.getElementById(id); if (s && s.options[i]) { s.selectedIndex = i; s.dispatchEvent(new Event('change', { bubbles: true })); s.dispatchEvent(new Event('input', { bubbles: true })); } };

  TM.whenReady(() => q('#lessonTabs .tab-btn') && q('#fitTravel') && q('#unitSample') && q('#scienceInput') && q('#toolsLab [data-tool]'), () => {
    /* ── 一樣大？尺說了算 ── */
    const sSel = '#travelLab [data-sample]';
    const samples = qa(sSel);
    const travel = TM.sequence({
      mount: afterHead('travelLab'),
      reset() { nth(sSel, 2); press('#fitTravel'); press('#travelPhotoReset'); },
      doneNote: DONE,
      steps: samples.map((b, i) => ({
        hold: 8,
        run: () => { nth(sSel, i); press('#fitTravel'); },
        note: [label(b)[0] + '：和另一個對象放在同一把尺上比', label(b)[1] + ': compared on the same ruler']
      }))
    });

    /* ── 數字變了，物體沒變 ── */
    const uSel = '#unitsLab [data-unit]';
    const units = qa(uSel);
    const unitsFlow = TM.sequence({
      mount: afterHead('unitsLab'),
      reset() { setSel('unitSample', 0); nth(uSel, 0); },
      doneNote: DONE,
      steps: units.map((b, i) => ({
        hold: 7,
        run: () => { if (i === 0) setSel('unitSample', 0); nth(uSel, i); },
        note: [(i === 0 ? '同一個長度，先用 ' : '換成 ') + label(b)[0] + '：數字變了，長度沒變', (i === 0 ? 'The same length, first in ' : 'Now in ') + label(b)[1] + ': the number changes, the length does not']
      }))
    });

    /* ── 好多個零，怎麼讀？ ── */
    const sciIds = ['science1', 'science100', 'science500', 'science1000', 'science1270', 'science0_000002'];
    const sciBtns = sciIds.map(id => doc.getElementById(id)).filter(Boolean);
    const science = TM.sequence({
      mount: b => { b.classList.add('teach-inline'); const h = q('#lesson2 h2'); if (h) h.after(b); },
      reset() { press('#science1'); },
      doneNote: DONE,
      steps: sciBtns.map(b => ({
        hold: 8,
        run: () => b.click(),
        note: ['把 ' + b.textContent.trim() + ' 寫成科學記號：看小數點移了幾位', 'Write ' + b.textContent.trim() + ' in scientific notation: count how far the decimal point moves']
      }))
    });

    /* ── 想看什麼，用什麼？ ── */
    const taskSel = '#toolsLab .bio2-controls button:not([data-tool]):not([id])';
    const tasks = qa(taskSel);
    const toolNames = [['肉眼', 'unaided eye'], ['一般光學顯微鏡', 'a light microscope'], ['電子顯微鏡', 'an electron microscope']];
    const toolSteps = [];
    tasks.forEach((tb, i) => toolNames.forEach((tn, j) => toolSteps.push({
      hold: 5,
      run: () => { if (j === 0) nth(taskSel, i); nth('#toolsLab [data-tool]', j); },
      note: [label(tb)[0] + '：用' + tn[0] + '看得到嗎？', label(tb)[1] + ': can you see it with ' + tn[1] + '?']
    })));
    const tools = TM.sequence({
      mount: afterHead('toolsLab'),
      reset() { nth(taskSel, 0); nth('#toolsLab [data-tool]', 0); press('#toolsPhotoReset'); },
      doneNote: DONE, steps: toolSteps
    });

    TM.create({
      insertBefore: q('#lessonTabs'),
      getTab: tabOf,
      tabButtons: qa('#lessonTabs .tab-btn'),
      drivers: { '0': travel, '1': unitsFlow, '2': science, '3': tools }
    });
  });
})(window);

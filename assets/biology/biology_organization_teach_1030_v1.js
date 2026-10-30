/* ==================================================================
   biology_organization｜老師講解／學生操作（2026-10-30）
   外層加法：不改 organization_v3.js 與頁面任何原有程式；老師模式＝替老師點原本的按鈕。
     一個細胞就夠？   草履蟲 → 新月藻 → 眼蟲
     同一個身體，不同工作 肌肉 → 神經 → 紅血球 → 保衛細胞
     合作，就叫組織？  血液組織 → 肌肉組織 → 皮膜組織
     胃不是一種細胞   細胞 → 組織 → 器官 → 器官系統 → 個體（人）
     根與果實，各忙什麼？ 葉：細胞 → 組織 → 器官 → 個體；再看根、莖、葉、花、果實、種子
   ================================================================== */
(function (root) {
  'use strict';
  const doc = root.document, TM = root.TeachMode;
  const q = s => doc.querySelector(s);
  const qa = s => Array.from(doc.querySelectorAll(s));
  const press = s => { const b = q(s); if (b && !b.disabled) b.click(); };
  const tabOf = () => { const b = q('.tab-btn.active'); return b ? b.dataset.tab : ''; };
  const DONE = ['✔ 示範完畢；按「從頭重播」可再看一次', '✔ Done. Press Replay to watch again'];
  const afterHead = id => b => { b.classList.add('teach-inline'); const h = q('#' + id + ' .bio2-head'); if (h) h.after(b); };
  const afterTool = id => b => { b.classList.add('teach-inline'); const h = q('#' + id + ' .org-hierarchy-toolbar'); if (h) h.after(b); };
  const label = b => [b.dataset.zh || b.textContent.trim().replace(/\s+/g, ' '), b.dataset.en || b.textContent.trim().replace(/\s+/g, ' ')];

  /* 照片觀察室：依序點「選擇觀察對象」的每個按鈕 */
  function picks(group, mount, hold) {
    const sel = '[data-group="' + group + '"][data-pick]';
    const btns = qa(sel);
    return TM.sequence({
      mount, reset() { const b = qa(sel)[0]; if (b) b.click(); }, doneNote: DONE,
      steps: btns.map((b, i) => ({ hold: hold || 9, run: () => { const x = qa(sel)[i]; if (x) x.click(); }, note: label(b) }))
    });
  }

  TM.whenReady(() => q('#lessonTabs .tab-btn') && q('#humanLevel0') && q('#plantLevel0') && q('[data-group="plantOrgans"][data-pick]'), () => {
    const single = picks('single', afterHead('singleViewer'));
    const work = picks('work', afterHead('workViewer'));
    const tissues = picks('tissues', afterHead('tissuesViewer'));

    const human = [
      ['細胞：胃皮膜細胞，最小的生命單位', 'Cell: a stomach-lining cell, the smallest unit of life'],
      ['組織：許多相同的細胞合作，成為胃皮膜組織', 'Tissue: many similar cells working together form stomach-lining tissue'],
      ['器官：不同組織合作，構成一個胃', 'Organ: different tissues team up to form the stomach'],
      ['器官系統：多個器官合作，成為消化系統', 'Organ system: several organs work together as the digestive system'],
      ['個體：各系統合作，成為完整的人', 'Organism: all the systems together make a whole person']
    ];
    const humanFlow = TM.sequence({
      mount: afterTool('humanViewer'), reset() { press('#humanReset'); }, doneNote: DONE,
      steps: human.map((n, i) => ({ hold: 9, run: () => press('#humanLevel' + i), note: n }))
        .concat([{ hold: 6, run: () => press('#humanReset'), note: ['看全部層次：細胞 → 組織 → 器官 → 器官系統 → 個體', 'All levels: cell → tissue → organ → organ system → organism'] }])
    });

    const plant = [
      ['細胞：葉肉細胞', 'Cell: a leaf mesophyll cell'],
      ['組織：柵狀葉肉組織', 'Tissue: palisade mesophyll tissue'],
      ['器官：葉', 'Organ: the leaf'],
      ['個體：完整的番茄植株（植物沒有「器官系統」這一層）', 'Organism: a whole tomato plant (plants skip the organ-system level)']
    ];
    const organSel = '[data-group="plantOrgans"][data-pick]';
    const organs = qa(organSel);
    const toOrgans = () => { const v = q('#plantOrgansViewer'); if (v && v.scrollIntoView) v.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
    const toLevels = () => { const v = q('#plantViewer'); if (v && v.scrollIntoView) v.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
    const plantFlow = TM.sequence({
      mount: afterTool('plantViewer'),
      reset() { press('#plantReset'); const b = qa(organSel)[0]; if (b) b.click(); },
      doneNote: DONE,
      steps: plant.map((n, i) => ({ hold: 9, run: () => { if (i === 0) toLevels(); press('#plantLevel' + i); }, note: n }))
        .concat(organs.map((b, i) => ({
          hold: 7,
          run: () => { if (i === 0) { press('#plantReset'); toOrgans(); } const x = qa(organSel)[i]; if (x) x.click(); },
          note: [label(b)[0] + '：這個器官在忙什麼？', label(b)[1] + ': what does this organ do?']
        })))
    });

    TM.create({
      insertBefore: q('#lessonTabs'),
      getTab: tabOf,
      tabButtons: qa('#lessonTabs .tab-btn'),
      drivers: { '0': single, '1': work, '2': tissues, '3': humanFlow, '4': plantFlow }
    });
  });
})(window);

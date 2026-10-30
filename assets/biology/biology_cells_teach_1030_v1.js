/* ==================================================================
   biology_cells｜老師講解／學生操作（2026-10-30）
   外層加法：不改 cells_*.js 與頁面任何原有程式；老師模式＝替老師操作原本的按鈕。
     細胞為什麼長得不一樣？ 神經細胞（本體、細胞核、神經纖維）→ 肌肉細胞 → 紅血球 → 保衛細胞 → 表皮細胞
     細胞裡有什麼？         植物細胞各構造 → 動物細胞各構造
     玻片怎麼做？           選標本 → 滴液 → 放標本 → 斜放蓋玻片 → 吸去多餘液體 → 低倍觀察 → 比較直接平放
     用顯微鏡觀察           裝玻片 → 低倍找標本 → 調焦 → 置中 → 換高倍 → 補光 → 細調
   ================================================================== */
(function (root) {
  'use strict';
  const doc = root.document, TM = root.TeachMode;
  const q = s => doc.querySelector(s);
  const qa = s => Array.from(doc.querySelectorAll(s));
  const tabOf = () => { const b = q('.tab-btn.active'); return b ? b.dataset.tab : ''; };

  const press = sel => { const b = q(sel); if (b && !b.disabled) b.click(); };
  const pressNth = (sel, n) => { const b = qa(sel)[n]; if (b && !b.disabled) b.click(); };
  const label = b => [b.dataset.zh || b.textContent.trim().replace(/\s+/g, ' '), b.dataset.en || b.textContent.trim().replace(/\s+/g, ' ')];
  const setRange = (id, v) => { const n = doc.getElementById(id); if (!n) return; n.value = String(v); n.dispatchEvent(new Event('input', { bubbles: true })); };
  const afterHead = id => b => { b.classList.add('teach-inline'); const h = q('#' + id + ' .scope-head'); if (h) h.after(b); };
  const DONE = ['✔ 示範完畢；按「從頭重播」可再看一次', '✔ Done. Press Replay to watch again'];

  /* ── 細胞為什麼長得不一樣？ ── */
  const typeSel = '#shapeChoices button', partSel = '#cellShapes .neuron-feature-controls button';
  const shapeSteps = [];
  qa(typeSel).forEach((tb, i) => {
    shapeSteps.push({
      hold: i === 0 ? 5 : 8,
      run: () => { if (i === 0) pressNth('#neuronMediaChoices button', 0); pressNth(typeSel, i); },
      note: label(tb)
    });
    if (i === 0) qa(partSel).forEach((pb, j) => shapeSteps.push({ hold: 5, run: () => pressNth(partSel, j), note: [label(tb)[0] + '：' + label(pb)[0], label(tb)[1] + ': ' + label(pb)[1]] }));
  });
  const cellShapes = TM.sequence({
    mount: afterHead('cellShapes'),
    reset() { pressNth('#neuronMediaChoices button', 0); pressNth(typeSel, 0); },
    doneNote: DONE, steps: shapeSteps
  });

  /* ── 細胞裡有什麼？ ── */
  const cellPartSel = '#partChoices button';
  const structSteps = [];
  const plantParts = qa(cellPartSel).map(label);
  plantParts.forEach((lb, j) => structSteps.push({
    hold: 6,
    run: () => { if (j === 0) pressNth('#cellTypeChoices button', 0); pressNth(cellPartSel, j); },
    note: [(j === 0 ? '植物細胞：' : '植物細胞：') + lb[0], 'Plant cell: ' + lb[1]]
  }));
  [0, 1, 2, 3].forEach(j => structSteps.push({
    hold: 5,
    run: () => { if (j === 0) pressNth('#cellTypeChoices button', 1); pressNth(cellPartSel, j); },
    note: ['動物細胞：' + (plantParts[j] ? plantParts[j][0] : ''), 'Animal cell: ' + (plantParts[j] ? plantParts[j][1] : '')]
  }));
  const cellStructures = TM.sequence({
    mount: afterHead('cellStructures'),
    reset() { pressNth('#cellTypeChoices button', 0); pressNth(cellPartSel, 0); },
    doneNote: DONE, steps: structSteps
  });

  /* ── 玻片怎麼做？ ── */
  const mountNames = [['① 滴液', '① Add a drop of liquid'], ['② 放置薄標本', '② Place the thin specimen'], ['③ 斜放蓋玻片', '③ Lower the cover slip at an angle'], ['④ 吸去多餘液體', '④ Blot off extra liquid'], ['⑤ 低倍開始觀察', '⑤ Observe at low power']];
  const cellSlides = TM.sequence({
    mount: afterHead('cellSlides'),
    reset() { press('#mountReset'); pressNth('#mountChoices button', 0); },
    doneNote: DONE,
    steps: [{ hold: 3, run: () => { press('#mountReset'); pressNth('#mountChoices button', 0); }, note: ['先選標本，再依序做出一片玻片', 'Choose a specimen, then make the slide step by step'] }]
      .concat(mountNames.map(n => ({ hold: 7, run: () => press('#mountNext'), note: n })))
      .concat([{ hold: 9, run: () => press('#mountBadCover'), note: ['比較：直接平放蓋玻片，容易產生氣泡', 'Compare: laying the cover slip flat traps air bubbles'] }])
  });

  /* ── 用顯微鏡觀察（虛擬顯微鏡：七個階段，每階段按「確認這一步」） ── */
  const nextBtn = () => qa('#cellObserve .bio-main-actions button').find(b => /裝上玻片|確認這一步|Place slide|Confirm/.test(b.textContent) && !b.disabled);
  const next = () => { const b = nextBtn(); if (b) b.click(); };
  const arrow = (key, n) => { const st = q('#cellObserve .cell-lab-stage'); for (let i = 0; st && i < n; i++) st.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); };
  const objective = n => pressNth('#cellObserve .lab-objectives button', n);
  const cellObserve = TM.sequence({
    mount: afterHead('cellObserve'),
    reset() { pressNth('#cellObserve .lab-mode-tabs button', 0); const r = qa('#cellObserve .bio-main-actions button').find(b => /重新練習|Start again/.test(b.textContent)); if (r) r.click(); pressNth('#observeChoices button', 0); },
    doneNote: ['✔ 完成：低倍找、置中、高倍補光與細調；按「從頭重播」可再看一次', '✔ Done: find at low power, center, then light and fine focus at high power'],
    steps: [
      { hold: 3, run: () => { pressNth('#cellObserve .lab-mode-tabs button', 0); const r = qa('#cellObserve .bio-main-actions button').find(b => /重新練習|Start again/.test(b.textContent)); if (r) r.click(); pressNth('#observeChoices button', 0); }, note: ['先把薄玻片固定在載物臺', 'First fix the thin slide on the stage'] },
      { hold: 5, run: () => next(), note: ['低倍物鏡：找到標本，照明要夠亮', 'Low power: find the specimen with enough light'] },
      { hold: 5, run: () => next(), note: ['低倍：影像還模糊，先粗調', 'Low power: still blurry; start with coarse focus'] },
      { hold: 6, run: () => { setRange('cellLabCoarse', 0); setRange('cellLabFine', 0); next(); }, note: ['粗調、細調到輪廓清楚', 'Coarse then fine focus until the outline is sharp'] },
      { hold: 7, run: () => { arrow('ArrowRight', 20); arrow('ArrowUp', 13); next(); }, note: ['移動玻片，把標本放到中央（影像方向與玻片相反）', 'Move the slide to center the target (image moves the opposite way)'] },
      { hold: 7, run: () => { objective(2); next(); }, note: ['換 40 倍物鏡：視野變小，影像變暗', 'Switch to the 40× objective: smaller field, darker image'] },
      { hold: 7, run: () => { setRange('cellLabLamp', 100); next(); }, note: ['高倍變暗：調亮光源／光圈', 'High power is dim: raise the light'] },
      { hold: 8, run: () => { setRange('cellLabFine', -0.3); next(); }, note: ['高倍只用細調：粗調已鎖定', 'High power: fine focus only; coarse is locked'] }
    ]
  });

  TM.create({
    insertBefore: q('nav.tabs'),
    getTab: tabOf,
    tabButtons: qa('.tab-btn'),
    drivers: { cellShapes, cellStructures, cellSlides, cellObserve }
  });
})(window);

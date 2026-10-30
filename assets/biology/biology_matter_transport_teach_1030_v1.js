/* ==================================================================
   biology_matter_transport｜老師講解／學生操作（2026-10-30）
   外層加法：不改 matter_transport_v5.js 與頁面任何原有程式；老師模式＝替老師點原本的按鈕。
     小的變成大的   分散的葡萄糖 → 連接成長鏈
     是牆，還是門？ 氧氣 → 水 → 葡萄糖 → 澱粉 → 蛋白質
     沒攪拌也散開   清水重置 → 加入一滴色素（正常速度）→ 加速觀察
     蔬菜為什麼出水？ 植物細胞×（清水、等濃度、濃鹽水）→ 紅血球×（清水、等濃度、濃鹽水）
   ================================================================== */
(function (root) {
  'use strict';
  const doc = root.document, TM = root.TeachMode;
  const q = s => doc.querySelector(s);
  const press = s => { const b = q(s); if (b && !b.disabled) b.click(); };
  const DONE = ['✔ 示範完畢；按「從頭重播」可再看一次', '✔ Done. Press Replay to watch again'];
  const afterH3 = id => b => { b.classList.add('teach-inline'); const h = q('#' + id + ' .board h3'); if (h) h.after(b); };
  const afterHead = id => b => { b.classList.add('teach-inline'); const h = q('#' + id + ' .bio2-head'); if (h) h.after(b); };
  const tabOf = () => { const b = q('.tab-btn.active'); return b ? b.dataset.tab : ''; };
  const L = (zh, en) => [zh, en];

  /* 老師按「暫停」時，連頁面自己的模擬（粒子／滲透）一起凍結：用頁面自己的暫停／繼續鈕 */
  function pauseHook(btnSel) {
    let was = false;
    const isP = () => { const b = q(btnSel); return !!b && /繼續|Resume/.test(b.textContent); };
    return p => {
      if (p) { was = isP(); if (!was) press(btnSel); }
      else if (!was && isP()) press(btnSel);
    };
  }

  TM.whenReady(() => q('#lessonTabs .tab-btn') && q('#diffusionLab') && q('#osmosisLab') && q('#chainSeparate'), () => {
    const chain = TM.sequence({
      mount: afterH3('lesson1'), reset() { press('#chainSeparate'); }, doneNote: DONE,
      steps: [
        { hold: 7, run: () => press('#chainSeparate'), note: L('分散的葡萄糖小分子', 'Separate glucose molecules') },
        { hold: 9, run: () => press('#chainJoin'), note: L('連接成長鏈：多個小分子接成大分子', 'Joined into a long chain: small molecules become a large one') }
      ]
    });
    const mem = [['#memOxygen', '氧氣 O₂', 'Oxygen O₂'], ['#memWater', '水', 'Water'], ['#memGlucose', '葡萄糖', 'Glucose'], ['#memStarch', '澱粉', 'Starch'], ['#memProtein', '蛋白質', 'Protein']];
    const membrane = TM.sequence({
      mount: afterH3('lesson2'), reset() { press('#memOxygen'); }, doneNote: DONE,
      steps: mem.map(m => ({ hold: 8, run: () => press(m[0]), note: L(m[1] + '：能不能通過細胞膜？', m[2] + ': can it cross the membrane?') }))
    });
    const diffusion = TM.sequence({
      mount: afterHead('diffusionLab'), setPaused: pauseHook('#diffPause'), reset() { press('#diffReset'); press('#diffNormal'); }, doneNote: DONE,
      steps: [
        { hold: 3, run: () => { press('#diffReset'); press('#diffNormal'); }, note: L('清水中沒有色素', 'Clear water, no dye yet') },
        { hold: 25, run: () => press('#diffAdd'), note: L('滴入色素：粒子不規則運動，慢慢散開', 'Dye added: particles move randomly and slowly spread out') },
        { hold: 15, run: () => press('#diffFast'), note: L('加速觀察：較濃往較稀處淨移動，直到均勻', 'Fast forward: net movement from high to low concentration until even') }
      ]
    });
    const osm = [
      ['#osmPlant', '植物細胞', 'Plant cell'], ['#osmRedCell', '紅血球', 'Red blood cell']
    ], sol = [['#osmPure', '清水', 'pure water'], ['#osmSame', '與細胞內一樣濃的溶液', 'same-concentration solution'], ['#osmSalt', '較濃的溶液', 'concentrated solution']];
    const osmosis = TM.sequence({
      mount: afterHead('osmosisLab'), setPaused: pauseHook('#osmPause'), reset() { press('#osmPlant'); press('#osmPure'); }, doneNote: DONE,
      steps: [].concat.apply([], osm.map(c => sol.map((s, i) => ({
        hold: 14, run: () => { if (i === 0) press(c[0]); press(s[0]); },
        note: L(c[1] + ' 放進' + s[1], c[2] + ' in ' + s[2])
      }))))
    });
    TM.create({
      insertBefore: q('#lessonTabs'),
      getTab: tabOf,
      tabButtons: Array.from(doc.querySelectorAll('#lessonTabs .tab-btn')),
      drivers: { '1': chain, '2': membrane, '3': diffusion, '4': osmosis }
    });
  });
})(window);

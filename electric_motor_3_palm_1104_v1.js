/* electric_motor_3_palm_1104_v1.js — 「右手開掌訓練場」分頁動畫（#palmCanvas，邏輯 1000×600）
 *
 * 契約：window.MotorAnim.palm = { activate(sceneId), deactivate(), relang(), practice(), _info(), _state() }
 * 依賴頁面現成的（直接呼叫，不複製、不改）：tr、C、TAU、clear、label、drawFlatArrow、
 *   drawPalmCanvas（正視圖：磁極、B、導線 ⊙/⊗、F）、drawPalmHandCanvas（右手）、palmState、updatePalmResult。
 * 方向一律由頁面的 drawPalmCanvas／updatePalmResult 決定：
 *   F 向右 ⇔ (bDir=down 且 iDir=out) 或 (bDir=up 且 iDir=in)。本檔只在畫「加強標示」時用同一條判斷式找箭頭位置。
 * 畫布不綁事件；控制只有 #steps-palm 的步驟鈕（每場景 5 顆）＋頁面現成的練習鈕（.practice-only）。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * palm-intro 導線受力原理，共 37 s
 *   1 磁場     7 s  N 在上、B 向下（綠點由 N 流向 S）；導線沒有電流：「沒有電流」「F = 0」
 *   2 通電     7 s  1.6 s 時通電 ⊙ 穿出 → 出現 F 向右（粉點沿 F 推出）
 *   3 互相垂直 8 s  畫面變暗，中央方向架：B ⟂ I → I ⟂ F → F ⟂ B 依序亮起，最後三組一起
 *   4 電流反向 7 s  1.6 s 時 ⊙ → ⊗ → F 改向左
 *   5 磁鐵翻轉 8 s  1.6 s 時磁鐵翻轉（B 向上，電流仍 ⊗）→ F 又變向右（含停留）
 * palm-rule 右手開掌定則，共 41 s
 *   1 拇指 I   7 s  右手（drawPalmHandCanvas）：拇指箭頭發光、青點沿拇指走；左欄「大拇指＝電流方向 (I)」
 *   2 四指 B   7 s  四指箭頭發光、綠點沿四指走；「伸直的四指＝磁場方向 (B)（由 N 指向 S）」
 *   3 掌心 F   7 s  掌心 ⊙ 脈動；「掌心推出的方向＝受力方向 (F)」
 *   4 驗證    10 s  正視圖輪流四種組合，各 2.5 s：⊙N上→右、⊗N上→左、⊗S上→右、⊙S上→左；結果框同 updatePalmResult 的句子
 *   5 換你試試 10 s  學生模式：畫面＝目前 palmState；按練習鈕立即重畫，且本步計時重來（不會被循環打斷）
 *                    老師模式：自動輪流四種組合（暫改 palmState＋呼叫 updatePalmResult 同步），離開即還原 {down,out}
 * 學生模式最後一步播完自動從第 1 步重播；老師模式（MotorAnim.ctl.onEnd 是函式）停在最後一格並通知一次。
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;

  const W = 1000;
  const FONT = "'Noto Sans TC',sans-serif";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const teacher = () => !!(MA.ctl && typeof MA.ctl.onEnd === 'function');
  // 與頁面 drawPalmCanvas / updatePalmResult 同一條判斷式（只用來定位加強標示）
  const fDirOf = (b, i) => ((b === 'down' && i === 'out') || (b === 'up' && i === 'in')) ? 1 : -1;

  // 暫時把 palmState 換成指定組合來呼叫頁面繪圖函式，畫完立刻還原（不影響頁面狀態）
  function withState(b, i, fn) {
    const ob = palmState.bDir, oi = palmState.iDir;
    palmState.bDir = b; palmState.iDir = i;
    try { fn(); } finally { palmState.bDir = ob; palmState.iDir = oi; }
  }

  // ───────── 正視圖的加強標示（畫在 drawPalmCanvas 之上） ─────────
  const WIRE_X = 500, WIRE_Y = 322;
  const B_XS = [168, 278, 388, 612, 722, 832];

  function fieldDots(ctx, b, t) {          // 綠點沿 B 由 N 流向 S
    ctx.save();
    ctx.fillStyle = C.green; ctx.shadowColor = C.green; ctx.shadowBlur = 10;
    const y0 = b === 'down' ? 222 : 404, dir = b === 'down' ? 1 : -1, span = 170;
    B_XS.forEach((x, k) => {
      for (let j = 0; j < 3; j++) {
        const s = ((t * 55 + j * span / 3 + k * 13) % span);
        ctx.globalAlpha = 0.95 * Math.min(1, s / 25, (span - s) / 25);
        ctx.beginPath(); ctx.arc(x, y0 + dir * s, 4.5, 0, TAU); ctx.fill();
      }
    });
    ctx.restore();
  }
  function currentHalo(ctx, t) {           // 通電：導線外圈青色脈動
    ctx.save();
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.shadowColor = C.cyan; ctx.shadowBlur = 14;
    ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 5));
    ctx.beginPath(); ctx.arc(WIRE_X, WIRE_Y, 78, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function forcePulse(ctx, f, t) {         // 粉點沿 F 箭頭推出去
    const a = WIRE_X + f * 96, b = WIRE_X + f * 186, k = (t * 0.9) % 1;
    ctx.save();
    ctx.fillStyle = '#ffd3e8'; ctx.shadowColor = C.pink; ctx.shadowBlur = 16;
    ctx.globalAlpha = Math.min(1, k * 5, (1 - k) * 5);
    ctx.beginPath(); ctx.arc(a + (b - a) * k, WIRE_Y, 7, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function switchFlash(ctx, tl, at) {      // 切換瞬間：導線外一圈白光擴散
    const k = (tl - at) / 0.7; if (k < 0 || k > 1) return;
    ctx.save();
    ctx.strokeStyle = '#f2ecd9'; ctx.lineWidth = 5 * (1 - k); ctx.globalAlpha = 1 - k;
    ctx.beginPath(); ctx.arc(WIRE_X, WIRE_Y, 80 + 60 * k, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function topCaption(ctx, text, color) { label(ctx, text, 500, 54, color || C.yellow, 'center', 24); }

  // 通電前：用 drawPalmCanvas 畫好磁極與 B，再把電流符號、I 標籤、F 箭頭與 F 標籤蓋掉
  function drawNoCurrent(ctx, b) {
    const f = fDirOf(b, 'out');
    withState(b, 'out', () => drawPalmCanvas(ctx));
    ctx.save();
    ctx.fillStyle = C.canvas;
    ctx.beginPath(); ctx.arc(WIRE_X, WIRE_Y, 48, 0, TAU); ctx.fill();            // ⊙
    ctx.fillRect(400, 404, 200, 29);                                              // I 標籤
    const fx0 = f > 0 ? 578 : 274, fRect = [fx0, 270, 148, 71];                   // F 箭頭＋F 標籤
    ctx.fillRect(fRect[0], fRect[1], fRect[2], fRect[3]);
    ctx.beginPath(); ctx.rect(fRect[0], fRect[1], fRect[2], fRect[3]); ctx.clip();
    B_XS.forEach(x => drawFlatArrow(ctx, x, b === 'down' ? 212 : 414, x, b === 'down' ? 414 : 212, 'rgba(154,240,111,.72)', 5, 14));
    ctx.restore();
    label(ctx, tr('沒有電流', 'No current'), WIRE_X, 418, C.muted, 'center', 22);
    label(ctx, 'F = 0', WIRE_X + f * 157, WIRE_Y - 34, 'rgba(255,120,183,.75)', 'center', 25);
  }

  function frontView(ctx, b, i, tl, opts) {
    opts = opts || {};
    withState(b, i, () => drawPalmCanvas(ctx));
    fieldDots(ctx, b, tl);
    currentHalo(ctx, tl);
    forcePulse(ctx, fDirOf(b, i), tl);
    if (opts.flashAt != null) switchFlash(ctx, tl, opts.flashAt);
  }

  // 依序示範的四種組合（每次只改一個條件）
  const COMBOS = [['down', 'out'], ['down', 'in'], ['up', 'in'], ['up', 'out']];
  function comboCaption(b, i) {
    const sym = i === 'out' ? '⊙' : '⊗';
    const nTop = b === 'down' ? tr('N極在上', 'N on top') : tr('S極在上', 'S on top');
    const fz = fDirOf(b, i) > 0 ? tr('向右', 'right') : tr('向左', 'left');
    return `I ${sym}  ·  ${nTop}  →  F ${fz}`;
  }
  // 與頁面 updatePalmResult() 的結果句逐字相同（測試時已比對四種組合）
  function resultSentence(b, i) {
    const right = (b === 'down' && i === 'out') || (b === 'up' && i === 'in');
    const fZh = right ? '右' : '左', fEn = right ? 'right' : 'left';
    const iZh = i === 'out' ? '外' : '內', iEn = i === 'out' ? 'out of the page' : 'into the page';
    const bZh = b === 'down' ? '下' : '上', bEn = b === 'down' ? 'down' : 'up';
    return currentLang === 'en'
      ? `Thumb: <strong class="accent-cyan">${iEn}</strong>; fingers: <strong class="accent-green">${bEn}</strong>; palm: <strong class="accent-pink">${fEn}</strong>. The wire is forced <strong class="accent-pink">${fEn}</strong>.`
      : `拇指朝<strong class="accent-cyan">${iZh}</strong>，四指朝<strong class="accent-green">${bZh}</strong>，掌心朝<strong class="accent-pink">${fZh}</strong>。銅線向<strong class="accent-pink">${fZh}</strong>受力！`;
  }

  // ───────── 第 3 步：B、I、F 兩兩垂直的方向架 ─────────
  function drawTriad(ctx, tl) {
    ctx.save();
    ctx.fillStyle = 'rgba(23,59,49,.94)'; ctx.strokeStyle = 'rgba(85,233,255,.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(150, 96, 700, 440, 22); ctx.fill(); ctx.stroke();
    ctx.restore();
    label(ctx, tr('三個方向兩兩垂直', 'All three are mutually perpendicular'), 500, 140, C.yellow, 'center', 27);

    // 斜投影：F 向右、B 向下、I 穿出紙面（朝左下畫，代表朝向觀察者）
    const O = { x: 470, y: 240 };
    const uF = { x: 1, y: 0 }, uB = { x: 0, y: 1 }, uI = { x: -0.8, y: 0.6 };
    const AX = { F: { u: uF, len: 170, col: C.pink }, B: { u: uB, len: 170, col: C.green }, I: { u: uI, len: 150, col: C.cyan } };
    const PAIRS = [['B', 'I'], ['I', 'F'], ['F', 'B']];
    const ph = tl < 0.8 ? -1 : Math.floor((tl - 0.8) / 1.9);   // 0,1,2 依序；≥3 全亮
    const lit = ph >= 0 && ph <= 2 ? PAIRS[ph] : null;
    const pulse = 0.5 + 0.5 * Math.sin(tl * 6);

    ['I', 'B', 'F'].forEach(k => {
      const a = AX[k], on = !lit || lit.indexOf(k) >= 0;
      ctx.save();
      ctx.globalAlpha = on ? 1 : 0.25;
      if (lit && on) { ctx.shadowColor = a.col; ctx.shadowBlur = 8 + 12 * pulse; }
      drawFlatArrow(ctx, O.x, O.y, O.x + a.u.x * a.len, O.y + a.u.y * a.len, a.col, 8, 20);
      ctx.restore();
    });
    // 原點：導線端視 ⊙
    ctx.save(); ctx.fillStyle = C.canvas; ctx.strokeStyle = C.cyan; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(O.x, O.y, 15, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(O.x, O.y, 4.5, 0, TAU); ctx.fill(); ctx.restore();

    const dimA = k => (!lit || lit.indexOf(k) >= 0) ? 1 : 0.35;
    ctx.save(); ctx.globalAlpha = dimA('F');
    label(ctx, `F ${tr('向右', 'right')}`, O.x + 186, O.y, C.pink, 'left', 26); ctx.restore();
    ctx.save(); ctx.globalAlpha = dimA('B');
    label(ctx, `B ${tr('向下', 'down')}`, O.x + 22, O.y + 160, C.green, 'left', 26); ctx.restore();
    ctx.save(); ctx.globalAlpha = dimA('I');
    label(ctx, `I ⊙ ${tr('穿出紙面', 'out of page')}`, O.x - 134, O.y + 124, C.cyan, 'center', 24); ctx.restore();

    // 直角記號（三組）
    const mark = (pa, pb, on) => {
      const a = AX[pa].u, b = AX[pb].u, s = 36;
      ctx.save(); ctx.strokeStyle = '#f2ecd9'; ctx.lineWidth = 3; ctx.globalAlpha = on ? 1 : 0.25;
      ctx.beginPath();
      ctx.moveTo(O.x + a.x * s, O.y + a.y * s); ctx.lineTo(O.x + (a.x + b.x) * s, O.y + (a.y + b.y) * s); ctx.lineTo(O.x + b.x * s, O.y + b.y * s);
      ctx.stroke(); ctx.restore();
    };
    PAIRS.forEach((p, k) => mark(p[0], p[1], !lit || ph === k));

    // 底下一列：B ⟂ I　I ⟂ F　F ⟂ B，目前這組放大發亮
    const COL = { B: C.green, I: C.cyan, F: C.pink };
    const xs = [330, 500, 670];
    PAIRS.forEach((p, k) => {
      const on = ph >= 3 || ph === k, shown = ph >= k;
      if (!shown) return;
      const sz = on && ph === k ? 34 : 30, x = xs[k], y = 486;
      ctx.save(); ctx.globalAlpha = on ? 1 : 0.55;
      label(ctx, p[0], x - 34, y, COL[p[0]], 'center', sz);
      label(ctx, '⟂', x, y, '#f2ecd9', 'center', sz);
      label(ctx, p[1], x + 34, y, COL[p[1]], 'center', sz);
      ctx.restore();
    });
  }

  // ───────── 右手（drawPalmHandCanvas）上的加強標示 ─────────
  function wrapLines(ctx, text, maxW, size) {
    ctx.save(); ctx.font = `900 ${size}px ${FONT}`;
    const out = []; let line = '';
    const toks = currentLang === 'en' ? text.split(/(\s+)/) : Array.from(text);
    toks.forEach(tk => {
      const test = line + tk;
      if (line && ctx.measureText(test.trim()).width > maxW) { out.push(line.trim()); line = tk.trimStart(); }
      else line = test;
    });
    if (line.trim()) out.push(line.trim());
    ctx.restore();
    return out;
  }
  function sideCaption(ctx, head, body, color) {   // 左欄（x 40–290）：關鍵字＋說明
    const x = 40, maxW = 250;
    const hl = wrapLines(ctx, head, maxW, 30), bl = wrapLines(ctx, body, maxW, 24);
    let y = 196;
    hl.forEach(s => { label(ctx, s, x, y, color, 'left', 30); y += 38; });
    y += 4;
    bl.forEach(s => { label(ctx, s, x, y, '#f2ecd9', 'left', 24); y += 32; });
  }
  function glowArrow(ctx, x1, y1, x2, y2, col, w, h, tl) {
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 10 + 14 * (0.5 + 0.5 * Math.sin(tl * 5));
    drawFlatArrow(ctx, x1, y1, x2, y2, col, w, h); ctx.restore();
  }
  function travelDot(ctx, x1, y1, x2, y2, col, tl) {
    const k = (tl * 0.75) % 1;
    ctx.save(); ctx.fillStyle = '#f2ecd9'; ctx.shadowColor = col; ctx.shadowBlur = 18;
    ctx.globalAlpha = Math.min(1, k * 5, (1 - k) * 5);
    ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, 7, 0, TAU); ctx.fill(); ctx.restore();
  }
  function handStep(ctx, which, tl) {
    drawPalmHandCanvas(ctx);
    if (which === 'I') {        // 拇指 I：頁面箭頭 (506,350)→(742,350)
      glowArrow(ctx, 506, 350, 742, 350, C.cyan, 9, 23, tl);
      travelDot(ctx, 512, 350, 716, 350, C.cyan, tl);
      sideCaption(ctx, tr('大拇指', 'Thumb'), tr('代表電流方向 (I)', 'represents conventional current (I)'), C.cyan);
    } else if (which === 'B') { // 四指 B：頁面箭頭 (472,328)→(472,104)
      glowArrow(ctx, 472, 328, 472, 104, C.green, 9, 23, tl);
      travelDot(ctx, 472, 322, 472, 130, C.green, tl);
      sideCaption(ctx, tr('伸直的四指', 'Straight fingers'), tr('代表磁場方向 (B)（由 N 指向 S）', 'represents magnetic field (B) (from N to S)'), C.green);
    } else {                    // 掌心 F：頁面 ⊙ 在 (463,407)，半徑 43
      const p = 0.5 + 0.5 * Math.sin(tl * 5);
      ctx.save(); ctx.strokeStyle = C.pink; ctx.lineWidth = 8; ctx.shadowColor = C.pink; ctx.shadowBlur = 10 + 18 * p;
      ctx.beginPath(); ctx.arc(463, 407, 43 + 3 * p, 0, TAU); ctx.stroke();
      ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(463, 407, 11 + 5 * p, 0, TAU); ctx.fill(); ctx.restore();
      sideCaption(ctx, tr('掌心推出的方向', 'Palm push direction'), tr('就是導線的受力方向 (F)', 'gives the wire\'s force direction (F)'), C.pink);
    }
  }

  // ───────── 場景 ─────────
  const SW = 1.6;   // 切換發生的時間（步內秒數）
  const SCENES = {
    'palm-intro': {
      steps: [
        { d: 7, b: ['磁場', 'Field'],
          cap: ['磁場 B 由 N 極指向 S 極；導線<strong class="accent-cyan">還沒通電</strong>：沒有電流，就沒有磁力。',
                'Field B points from N to S. The wire has <strong class="accent-cyan">no current</strong> yet: no current, no magnetic force.'],
          draw(ctx, tl) { drawNoCurrent(ctx, 'down'); fieldDots(ctx, 'down', tl); topCaption(ctx, tr('磁場 B：由 N 極指向 S 極', 'Field B: points from N to S'), C.green); } },
        { d: 7, b: ['通電', 'Current'],
          cap: ['通電（<strong class="accent-cyan">⊙ 穿出</strong>）→ 導線受到<strong class="accent-pink">磁力 F</strong>，向右受力！',
                'Turn on the current (<strong class="accent-cyan">⊙ out of page</strong>) → the wire feels a <strong class="accent-pink">magnetic force F</strong> to the right!'],
          draw(ctx, tl) {
            if (tl < SW) { drawNoCurrent(ctx, 'down'); fieldDots(ctx, 'down', tl); }
            else frontView(ctx, 'down', 'out', tl, { flashAt: SW });
            topCaption(ctx, tr('通電導線會受到磁力', 'A current-carrying wire feels a force'), C.cyan);
          } },
        { d: 8, b: ['互相垂直', 'B ⟂ I ⟂ F'],
          cap: ['<strong class="accent-green">B</strong> ⟂ <strong class="accent-cyan">I</strong>、<strong class="accent-cyan">I</strong> ⟂ <strong class="accent-pink">F</strong>、<strong class="accent-pink">F</strong> ⟂ <strong class="accent-green">B</strong>：磁力 F 一定同時垂直於電流與磁場。',
                '<strong class="accent-green">B</strong> ⟂ <strong class="accent-cyan">I</strong>, <strong class="accent-cyan">I</strong> ⟂ <strong class="accent-pink">F</strong>, <strong class="accent-pink">F</strong> ⟂ <strong class="accent-green">B</strong>: magnetic force F is perpendicular to both I and B.'],
          draw(ctx, tl) { drawTriad(ctx, tl); } },
        { d: 7, b: ['電流反向', 'Reverse I'],
          cap: ['電流反向（<strong class="accent-cyan">⊗ 穿入</strong>）→ 磁力 F 跟著反向，改成<strong class="accent-pink">向左</strong>。',
                'Reverse the current (<strong class="accent-cyan">⊗ into page</strong>) → F reverses too: now <strong class="accent-pink">left</strong>.'],
          draw(ctx, tl) {
            if (tl < SW) frontView(ctx, 'down', 'out', tl); else frontView(ctx, 'down', 'in', tl, { flashAt: SW });
            topCaption(ctx, `${tr('切換電流', 'Switch I')}  ⊙ → ⊗`, C.cyan);
          } },
        { d: 8, b: ['磁鐵翻轉', 'Flip B'],
          cap: ['磁鐵翻轉（<strong class="accent-green">B 向上</strong>）→ 磁力 F 也反向，又變成<strong class="accent-pink">向右</strong>。',
                'Flip the magnets (<strong class="accent-green">B up</strong>) → F reverses as well: <strong class="accent-pink">right</strong> again.'],
          draw(ctx, tl) {
            if (tl < SW) frontView(ctx, 'down', 'in', tl); else frontView(ctx, 'up', 'in', tl, { flashAt: SW });
            topCaption(ctx, `${tr('翻轉磁鐵', 'Flip magnets')}  B ${tr('向下', 'down')} → B ${tr('向上', 'up')}`, C.green);
          } }
      ]
    },
    'palm-rule': {
      steps: [
        { d: 7, b: ['拇指 I', 'Thumb I'],
          cap: ['伸出右手：<strong class="accent-cyan">大拇指</strong>代表<strong class="accent-cyan">電流方向 (I)</strong>。',
                'Open your right hand: the <strong class="accent-cyan">thumb</strong> represents <strong class="accent-cyan">conventional current (I)</strong>.'],
          draw(ctx, tl) { handStep(ctx, 'I', tl); } },
        { d: 7, b: ['四指 B', 'Fingers B'],
          cap: ['<strong class="accent-green">伸直的四指</strong>代表<strong class="accent-green">磁場方向 (B)</strong>（由 N 指向 S）。',
                '<strong class="accent-green">Straight fingers</strong> represent the <strong class="accent-green">magnetic field (B)</strong> (from N to S).'],
          draw(ctx, tl) { handStep(ctx, 'B', tl); } },
        { d: 7, b: ['掌心 F', 'Palm F'],
          cap: ['<strong class="accent-pink">掌心推出的方向</strong>就是導線的<strong class="accent-pink">受力方向 (F)</strong>！',
                'The <strong class="accent-pink">palm push direction</strong> gives the wire\'s <strong class="accent-pink">force direction (F)</strong>!'],
          draw(ctx, tl) { handStep(ctx, 'F', tl); } },
        { d: 10, b: ['驗證', 'Check'], combos: true,
          draw(ctx, tl) {
            const k = Math.min(3, Math.floor(tl / 2.5)), c = COMBOS[k], t0 = k * 2.5;
            frontView(ctx, c[0], c[1], tl, { flashAt: k ? t0 : null });
            topCaption(ctx, `${k + 1}/4   ${comboCaption(c[0], c[1])}`, C.yellow);
          } },
        { d: 10, b: ['換你試試', 'Your turn'], practice: true,
          draw(ctx, tl) {
            if (teacher()) {
              const k = Math.min(3, Math.floor(tl / 2.5)), c = COMBOS[k];
              demoSync(k);
              frontView(ctx, c[0], c[1], tl, { flashAt: k ? k * 2.5 : null });
              topCaption(ctx, `${tr('示範', 'Demo')} ${k + 1}/4   ${comboCaption(c[0], c[1])}`, C.yellow);
            } else {
              frontView(ctx, palmState.bDir, palmState.iDir, tl, { flashAt: S.pressAt != null ? S.pressAt : null });
              topCaption(ctx, tr('換你試試：按下方按鈕', 'Your turn: try the buttons below'), C.yellow);
            }
          } }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0, endFired: false,
              combo: -1, demo: -1, syncing: false, userPress: false, pressAt: null };

  function canvasCtx() { const c = document.getElementById('palmCanvas'); return c ? c.getContext('2d') : null; }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }

  // 呼叫頁面 updatePalmResult()（它結尾會回呼 practice()；用旗標防重入）
  function syncPage() {
    if (typeof updatePalmResult !== 'function') return;
    S.syncing = true;
    try { updatePalmResult(); } finally { S.syncing = false; }
  }
  // 老師模式第 5 步：把 palmState 換成第 k 種組合，並同步結果框與練習鈕文字
  function demoSync(k) {
    if (S.demo === k) return;
    S.demo = k; palmState.bDir = COMBOS[k][0]; palmState.iDir = COMBOS[k][1];
    syncPage();
  }
  function demoRestore() {
    if (S.demo < 0) return;
    S.demo = -1; palmState.bDir = 'down'; palmState.iDir = 'out';
    syncPage();
  }

  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.canvas; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }

  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t), st = sc.steps[i], tl = S.t - sc.starts[i];
    if (!(st.practice && teacher())) demoRestore();
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    clear(ctx);
    st.draw(ctx, tl);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; S.combo = -1; S.pressAt = null; updateUI(); }
    if (st.combos) {
      const k = Math.min(3, Math.floor(tl / 2.5));
      if (k !== S.combo) { S.combo = k; setResult(resultSentence(COMBOS[k][0], COMBOS[k][1])); }
    }
  }
  function setResult(html) { const r = document.getElementById('palmResult'); if (r) r.innerHTML = html; }

  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc || S.step < 0) return;
    const st = sc.steps[S.step];
    if (st.cap) setResult(tr(st.cap[0], st.cap[1]));
    else if (st.practice) syncPage();   // 第 5 步：結果框＝頁面依 palmState 產生的句子
    const row = document.getElementById('steps-palm');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function jumpTo(k) {
    const sc = SCENES[S.scene]; if (!sc) return;
    S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; S.endFired = false;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-palm'); if (!row) return;
    row.innerHTML = '';
    const sc = SCENES[S.scene]; if (!sc) return;
    sc.steps.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }

  function visible() { const c = document.getElementById('palmCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last && !(MA.ctl && MA.ctl.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    if (S.t >= sc.total) {
      if (teacher()) { S.t = sc.total - 1e-3; if (!S.endFired) { S.endFired = true; MA.ctl.onEnd(); } }
      else { S.t = 0; }
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.scene || S.raf || S.timer || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (S.scene) start(); });
  // 分辨「學生按了練習鈕」與「頁面換語言時呼叫 updatePalmResult」：捕獲階段先記下來
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest && e.target.closest('#palmCurrentBtn,#palmMagnetBtn');
    if (t) S.userPress = true;
  }, true);

  MA.palm = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'palm-intro';
      stop(); demoRestore();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false; S.combo = -1; S.pressAt = null;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop(); demoRestore();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-palm'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    // 頁面練習鈕（學生模式）改了 palmState 後呼叫；不可在這裡呼叫 updatePalmResult
    practice() {
      const press = S.userPress; S.userPress = false;
      if (S.syncing || !S.scene) return;
      if (press && S.scene === 'palm-rule' && !teacher()) {
        const sc = SCENES['palm-rule'], k = sc.steps.length - 1;
        // 跳到（或重新計時）第 5 步：學生正在操作時不會被循環打斷
        S.t = sc.starts[k] + 1e-4; S.endFired = false; S.last = 0;
        if (S.step !== k) { S.step = -1; render(); }
        S.pressAt = 1e-4; render(); start(); return;
      }
      render();
    },
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _resultSentence: resultSentence,
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf, demo: S.demo }; }
  };
})();

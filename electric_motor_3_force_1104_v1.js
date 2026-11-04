/* electric_motor_3_force_1104_v1.js — 「開掌定則實例」分頁動畫（#forceExamplesCanvas，邏輯 1000×600）
 *
 * 契約：window.MotorAnim.force = { activate(sceneId), deactivate(), relang(), _info(), _state() }
 * 依賴頁面現成的（直接呼叫，不複製、不改）：tr、C、TAU、clear、label、drawFlatArrow、
 *   drawVerticalWire、drawFieldRings、drawWireInteraction、drawUniformField3D、drawElectronOrbit、
 *   forceExampleState、updateForceExampleText。
 * 方向一律以頁面函式為準：
 *   - 導線電流向上；drawFieldRings(…, clockwise=false)＝頁面現用方向。A 的最外圈剛好穿過 B（反之亦然）。
 *     依頁面文字：A 影響 B → B 受力向左；B 影響 A → A 受力向右。本檔的 ⊗／⊙ 標記只標在那圈磁力線穿過另一條導線的位置。
 *   - 電子軌跡、離場方向、F 箭頭由 drawElectronOrbit 畫（以 forceExampleState.phase 控制電子位置：progress = phase×0.27）。
 * 畫布不綁事件；唯一控制是 #steps-force 的步驟鈕（每場景 5 顆）。舊的 toggleBFieldBtn／exampleReplayBtn 不使用。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * example-wires 同向電流導線，共 37 s
 *   1 同向電流  6 s  只有兩條導線 A、B（drawVerticalWire），電流同向流動
 *   2 A→B      8 s  A 的磁力線環（drawFieldRings）；在 B 處標「B ⊗ 穿入」；B 的 F 向左（朝向 A）；右側開掌對照框
 *   3 B→A      8 s  B 的磁力線環；在 A 處標「B ⊙ 穿出」；A 的 F 向右（朝向 B）；左側開掌對照框
 *   4 互相吸引  7 s  drawWireInteraction 全圖（兩組磁力線＋兩個 F）；F 脈動；結果框＝updateForceExampleText()
 *   5 反向相斥  8 s  1.6 s 時 B 的電流反向（同一支 drawVerticalWire 上下翻轉）、B 的磁力線反向 → 兩個 F 都朝外
 * example-electron 電子進入磁場，共 36 s
 *   1 射入磁場  6 s  drawElectronOrbit：電子沿入射段向右，每 3 s 一次
 *   2 判斷受力  7 s  電子停在邊界：① 先當正電荷 F 向上（淡）→ 3.2 s 起 ② 電子帶負電，完全相反 → F 向下
 *   3 圓弧     8 s  磁場內：F（頁面畫的）⟂ v，只改方向；電子走圓弧，每 4 s 一次
 *   4 離場直線  7 s  圓弧後段 → 離場：F = 0，沿切線等速直線向左；結果框＝updateForceExampleText()
 *   5 半徑比較  8 s  同一起點、同一速率：B（r = 122，與 drawElectronOrbit 相同）與 2B（r = 61）兩條軌跡同時跑
 * 學生模式最後一步播完自動從第 1 步重播；老師模式（MotorAnim.ctl.onEnd 是函式）停在最後一格並通知一次。
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;

  const W = 1000;
  const FONT = "'Noto Sans TC',sans-serif";
  const CHALK = '#f2ecd9';
  const CUR_BLUE = '#159dff';                       // drawVerticalWire 的電流色
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const teacher = () => !!(MA.ctl && typeof MA.ctl.onEnd === 'function');
  const pulse = (t, k) => 0.5 + 0.5 * Math.sin(t * (k || 5));

  // ───────── 共用小工具 ─────────
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
  // 說明框：rows = [[文字, 顏色, 字級], …]；自動換行、自動算高度
  function panel(ctx, x, y, w, rows) {
    const pad = 16, lines = [];
    rows.forEach(r => wrapLines(ctx, r[0], w - pad * 2, r[2] || 24).forEach(s => lines.push([s, r[1], r[2] || 24])));
    const h = pad * 2 + lines.reduce((a, l) => a + l[2] * 1.42, 0) - 6;
    ctx.save();
    ctx.fillStyle = 'rgba(23,59,49,.94)'; ctx.strokeStyle = 'rgba(85,233,255,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.stroke();
    ctx.restore();
    let yy = y + pad;
    lines.forEach(l => { label(ctx, l[0], x + pad, yy + l[2] * 0.62, l[1], 'left', l[2]); yy += l[2] * 1.42; });
  }
  function topCaption(ctx, text, color) { label(ctx, text, 500, 50, color || C.yellow, 'center', 24); }
  function glowArrow(ctx, x1, y1, x2, y2, col, w, h, tl, alpha) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.shadowColor = col; ctx.shadowBlur = 8 + 14 * pulse(tl);
    drawFlatArrow(ctx, x1, y1, x2, y2, col, w, h); ctx.restore();
  }
  function fieldMark(ctx, x, y, sym, col) {         // 在磁力線穿過導線處標 ⊗／⊙
    ctx.save();
    ctx.fillStyle = C.canvas; ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    label(ctx, sym, x, y - 1, col, 'center', 26);
  }

  // ═════════ 場景一：同向電流導線 ═════════
  const AX = 410, BX = 690, MIDY = 305;               // 與 drawWireInteraction 相同
  const ringPhase = () => S.t * 1.5;                  // 原 RAF：每格 +0.025（約 1.5 rad/s）

  // F 箭頭座標照抄 drawWireInteraction（吸引）；排斥＝對導線鏡射
  function forceOnB(ctx, tl, dir, glow, noLabel) {    // dir: -1 向左（朝 A），+1 向右
    const x0 = BX + dir * 18, x1 = BX + dir * 102, y = MIDY - 48;
    if (glow) glowArrow(ctx, x0, y, x1, y, C.pink, 9, 22, tl); else drawFlatArrow(ctx, x0, y, x1, y, C.pink, 9, 22);
    if (!noLabel) label(ctx, 'F', BX + dir * 66, MIDY - 83, C.pink, 'center', 24);
  }
  function forceOnA(ctx, tl, dir, glow, noLabel) {    // dir: +1 向右（朝 B），-1 向左
    const x0 = AX + dir * 18, x1 = AX + dir * 102, y = MIDY + 54;
    if (glow) glowArrow(ctx, x0, y, x1, y, C.pink, 9, 22, tl); else drawFlatArrow(ctx, x0, y, x1, y, C.pink, 9, 22);
    if (!noLabel) label(ctx, 'F', AX + dir * 66, MIDY + 91, C.pink, 'center', 24);
  }
  function wireLabels(ctx) { label(ctx, 'A', AX, 522, C.cyan, 'center', 27); label(ctx, 'B', BX, 522, C.orange, 'center', 27); }
  // 電流向下的 B 導線：同一支 drawVerticalWire 上下翻轉，只裁出導線本身（翻轉後的「I」字不畫），再補正向的 I 標籤
  function wireDown(ctx, x, phase) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 16, 100, 32, 420); ctx.clip();
    ctx.translate(0, 610); ctx.scale(1, -1);
    drawVerticalWire(ctx, x, C.orange, phase);
    ctx.restore();
    label(ctx, 'I', x + 24, 226, CUR_BLUE, 'left', 25);
  }
  function flashWire(ctx, x, tl, at) {
    const k = (tl - at) / 0.8; if (k < 0 || k > 1) return;
    ctx.save(); ctx.strokeStyle = CHALK; ctx.globalAlpha = 1 - k; ctx.lineWidth = 4 * (1 - k) + 1;
    ctx.beginPath(); ctx.roundRect(x - 22 - 30 * k, 120 - 10 * k, 44 + 60 * k, 370 + 20 * k, 20); ctx.stroke();
    ctx.restore();
  }
  function ruleBox(ctx, x, iTxt, bTxt, fTxt, ringCol) {
    panel(ctx, x, 96, 226, [
      [tr('右手開掌定則', 'Right-hand rule'), C.yellow, 22],
      [`${tr('拇指', 'Thumb')} I ${iTxt}`, C.cyan, 24],
      [`${tr('四指', 'Fingers')} B ${bTxt}`, ringCol, 24],
      [`${tr('掌心', 'Palm')} F ${fTxt}`, C.pink, 24]
    ]);
  }

  // ═════════ 場景二：電子進入磁場 ═════════
  const EX = 180, EY = 205, R1 = 122;                 // 與 drawElectronOrbit 相同
  function orbitAt(ctx, p) {                          // p＝drawElectronOrbit 的 progress（0–1）
    const ph = forceExampleState.phase;
    forceExampleState.phase = p / 0.27;
    try { drawElectronOrbit(ctx); } finally { forceExampleState.phase = ph; }
  }
  function arcPos(p) {                                // 與 drawElectronOrbit 同一段公式（只用來定位標示）
    const a = -Math.PI / 2 + ((p - 0.18) / 0.58) * Math.PI;
    return { a, x: EX + R1 * Math.cos(a), y: EY + R1 + R1 * Math.sin(a) };
  }
  function exitX(p) { return EX + (64 - EX) * ((p - 0.76) / 0.24); }
  function elecPanel(ctx, rows) { panel(ctx, 372, 104, 520, rows); }

  // 第 5 步：自己的兩條軌跡（r ∝ 1/B），起點、邊界、⊗、電子顏色沿用頁面
  function orbitPath(r) {
    const segs = [116, Math.PI * r, 116], L = segs[0] + segs[1] + segs[2];
    return {
      r, L,
      at(s) {
        s = clamp(s, 0, L);
        if (s <= segs[0]) return { x: 64 + s, y: EY };
        if (s <= segs[0] + segs[1]) { const a = -Math.PI / 2 + (s - segs[0]) / r; return { x: EX + r * Math.cos(a), y: EY + r + r * Math.sin(a), arc: true, a }; }
        return { x: EX - (s - segs[0] - segs[1]), y: EY + 2 * r };
      },
      stroke(ctx, alpha) {
        ctx.save(); ctx.strokeStyle = `rgba(255,111,118,${alpha})`; ctx.lineWidth = 5; ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.moveTo(64, EY); ctx.lineTo(EX, EY);
        ctx.arc(EX, EY + r, r, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(64, EY + 2 * r); ctx.stroke(); ctx.restore();
      }
    };
  }
  const ORB1 = orbitPath(R1), ORB2 = orbitPath(R1 / 2);
  function electronDot(ctx, x, y, withLabel) {        // 與 drawElectronOrbit 的電子同一畫法（字級提到 22）
    const g = ctx.createRadialGradient(x, y, 2, x, y, 20);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.35, C.red); g.addColorStop(1, 'rgba(255,111,118,0)');
    ctx.save();
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    ctx.restore();
    if (withLabel) label(ctx, 'e⁻', x + 19, y - 20, C.red, 'left', 22);
  }

  // ───────── 場景 ─────────
  const SW = 1.6;
  const SCENES = {
    'example-wires': {
      mode: 'wires',
      steps: [
        { d: 6, b: ['同向電流', 'Same I'],
          cap: ['兩條導線 A、B，<strong class="accent-cyan">電流同方向</strong>。',
                'Wires A and B carry currents in the <strong class="accent-cyan">same direction</strong>.'],
          draw(ctx, tl) {
            clear(ctx);
            drawVerticalWire(ctx, AX, C.cyan, ringPhase());
            drawVerticalWire(ctx, BX, C.orange, ringPhase());
            wireLabels(ctx);
            topCaption(ctx, tr('兩條導線 A、B：電流同向', 'Wires A and B: currents in the same direction'), C.cyan);
          } },
        { d: 8, b: ['A 影響 B', 'A acts on B'],
          cap: ['<strong class="accent-cyan">A 導線的磁場</strong>作用在 B 導線，使 B 受力朝向 A：B 受到<strong class="accent-pink">朝左</strong>的磁力。',
                '<strong class="accent-cyan">Wire A\'s magnetic field</strong> acts on wire B and pulls it toward A: B feels a force to the <strong class="accent-pink">left</strong>.'],
          draw(ctx, tl) {
            clear(ctx);
            drawFieldRings(ctx, AX, MIDY, C.cyan, false, ringPhase());
            drawVerticalWire(ctx, AX, C.cyan, ringPhase());
            drawVerticalWire(ctx, BX, C.orange, ringPhase());
            if (tl > 1.2) { fieldMark(ctx, BX, MIDY, '⊗', C.cyan); label(ctx, tr('B ⊗ 穿入', 'B ⊗ into page'), BX + 30, MIDY, C.cyan, 'left', 24); }
            if (tl > 2.6) forceOnB(ctx, tl, -1, true);
            if (tl > 2.6) ruleBox(ctx, 760, '↑', '⊗', '←', C.cyan);
            wireLabels(ctx);
            topCaption(ctx, tr('A 影響 B：B 受到朝左的磁力。', 'A acts on B: B feels a force to the left.'), C.cyan);
          } },
        { d: 8, b: ['B 影響 A', 'B acts on A'],
          cap: ['B 也用相同方式影響 A：A 受到<strong class="accent-pink">朝右</strong>的磁力（朝向 B）。',
                'B affects A in the same way: A feels a force to the <strong class="accent-pink">right</strong> (toward B).'],
          draw(ctx, tl) {
            clear(ctx);
            drawFieldRings(ctx, BX, MIDY, C.orange, false, ringPhase() + .9);
            drawVerticalWire(ctx, AX, C.cyan, ringPhase());
            drawVerticalWire(ctx, BX, C.orange, ringPhase());
            if (tl > 1.2) { fieldMark(ctx, AX, MIDY, '⊙', C.orange); label(ctx, tr('B ⊙ 穿出', 'B ⊙ out of page'), AX - 30, MIDY, C.orange, 'right', 24); }
            if (tl > 2.6) forceOnA(ctx, tl, 1, true);
            if (tl > 2.6) ruleBox(ctx, 16, '↑', '⊙', '→', C.orange);
            wireLabels(ctx);
            topCaption(ctx, tr('B 影響 A：A 受到朝右的磁力。', 'B acts on A: A feels a force to the right.'), C.orange);
          } },
        { d: 7, b: ['互相吸引', 'Attract'], conclusion: true,
          draw(ctx, tl) {
            const ph = forceExampleState.phase, sb = forceExampleState.showBField;
            forceExampleState.phase = ringPhase(); forceExampleState.showBField = true;
            try { drawWireInteraction(ctx); } finally { forceExampleState.phase = ph; forceExampleState.showBField = sb; }
            forceOnB(ctx, tl, -1, true, true); forceOnA(ctx, tl, 1, true, true);   // F 標籤已由 drawWireInteraction 畫
            topCaption(ctx, tr('結論：同方向電流互相吸引。', 'Conclusion: currents in the same direction attract.'), C.pink);
            label(ctx, tr('每一條導線都同時是「磁場來源」，也是「磁力作用對象」。', 'Each wire creates a field and also experiences a force.'), 500, 568, CHALK, 'center', 22);
          } },
        { d: 8, b: ['電流反向', 'Opposite I'],
          cap: ['把其中一條導線的電流翻轉：兩條導線<strong class="accent-pink">互相排斥</strong>。同方向電流相吸；反方向電流相斥。',
                'Reverse one current: the wires <strong class="accent-pink">repel</strong>. Same-direction currents attract; opposite-direction currents repel.'],
          draw(ctx, tl) {
            clear(ctx);
            const flipped = tl >= SW, ph = ringPhase();
            drawFieldRings(ctx, AX, MIDY, C.cyan, false, ph);
            drawFieldRings(ctx, BX, MIDY, C.orange, flipped, ph + .9);
            drawVerticalWire(ctx, AX, C.cyan, ph);
            if (flipped) wireDown(ctx, BX, ph); else drawVerticalWire(ctx, BX, C.orange, ph);
            flashWire(ctx, BX, tl, SW);
            if (flipped) { forceOnB(ctx, tl, 1, true); forceOnA(ctx, tl, -1, true); }
            else { forceOnB(ctx, tl, -1, false); forceOnA(ctx, tl, 1, false); }
            wireLabels(ctx);
            topCaption(ctx, flipped ? tr('反方向電流：互相排斥', 'Opposite-direction currents repel')
                                    : tr('把 B 的電流翻轉…', 'Reverse the current in B…'), C.pink);
          } }
      ]
    },
    'example-electron': {
      mode: 'electron',
      steps: [
        { d: 6, b: ['射入磁場', 'Enter'],
          cap: ['電子向右射入<strong class="accent-green">垂直穿入畫面的均勻磁場（⊗）</strong>。',
                'An electron enters to the right into a <strong class="accent-green">uniform field into the page (⊗)</strong>.'],
          draw(ctx, tl) {
            orbitAt(ctx, 0.175 * clamp((tl % 3) / 2.2, 0, 1));
            topCaption(ctx, tr('電子向右射入均勻磁場 B ⊗', 'Electron enters a uniform field B ⊗'), C.green);
          } },
        { d: 7, b: ['判斷受力', 'Find F'],
          cap: ['先用右手判斷<strong class="accent-cyan">傳統電流（正電荷）</strong>的受力：向上；電子帶負電，實際受力方向要<strong class="accent-pink">完全相反</strong>：向下。',
                'First use the right hand for <strong class="accent-cyan">conventional current (positive charge)</strong>: up. The electron is negative, so reverse it <strong class="accent-pink">completely</strong>: down.'],
          draw(ctx, tl) {
            orbitAt(ctx, 0.175 * clamp(tl / 1.4, 0, 1));
            const x = EX, y = EY;
            if (tl > 1.6) {                                   // ① 正電荷：向上
              const a = tl > 3.2 ? 0.38 : 1;
              glowArrow(ctx, x, y - 16, x, y - 72, C.pink, 7, 18, tl, a);
              ctx.save(); ctx.globalAlpha = a; label(ctx, '①', x - 30, y - 46, C.pink, 'center', 24); ctx.restore();
            }
            if (tl > 3.2) {                                   // ② 電子：完全相反 → 向下
              const k = clamp((tl - 3.2) / 0.8, 0, 1);
              glowArrow(ctx, x, y + 16, x, y + 16 + 44 * k, C.pink, 7, 18, tl);
              label(ctx, '②', x - 30, y + 44, C.pink, 'center', 24);
            }
            const rows = [[tr('① 先當作正電荷（傳統電流）', '① Treat it as positive (conventional current)'), C.cyan, 24],
                          [tr('拇指 →　四指 ⊗　掌心 ↑', 'Thumb →  Fingers ⊗  Palm ↑'), CHALK, 24]];
            if (tl > 3.2) rows.push([tr('② 電子帶負電：受力完全相反 → 向下', '② Electron is negative: force reversed → down'), C.pink, 24]);
            if (tl > 1.6) elecPanel(ctx, rows);
            topCaption(ctx, tr('電子帶負電：受力和正電荷相反', 'Negative electron: force opposite to a positive charge'), C.pink);
          } },
        { d: 8, b: ['圓弧', 'Arc'],
          cap: ['磁力永遠垂直於運動方向，只改變方向，不直接改變速率；磁力持續擔任<strong class="accent-pink">向心力</strong>，軌跡向下彎成<strong class="accent-red">圓弧</strong>。',
                'Magnetic force stays perpendicular to motion, changing direction but not speed. It supplies <strong class="accent-pink">centripetal force</strong>, so the path bends down into an <strong class="accent-red">arc</strong>.'],
          draw(ctx, tl) {
            const p = 0.181 + 0.575 * clamp((tl % 4) / 3.6, 0, 1);
            orbitAt(ctx, p);
            if (p < 0.755) {                                  // v（切線）＋直角記號；F 由頁面函式畫
              const q = arcPos(p), vx = -Math.sin(q.a), vy = Math.cos(q.a), fx = -Math.cos(q.a), fy = -Math.sin(q.a);
              drawFlatArrow(ctx, q.x + vx * 14, q.y + vy * 14, q.x + vx * 70, q.y + vy * 70, CHALK, 5, 15);
              label(ctx, 'v', q.x + vx * 92, q.y + vy * 92, CHALK, 'center', 24);
              ctx.save(); ctx.strokeStyle = CHALK; ctx.lineWidth = 2.5; const s = 13;
              ctx.beginPath(); ctx.moveTo(q.x + vx * s, q.y + vy * s); ctx.lineTo(q.x + (vx + fx) * s, q.y + (vy + fy) * s); ctx.lineTo(q.x + fx * s, q.y + fy * s); ctx.stroke(); ctx.restore();
            }
            elecPanel(ctx, [
              [tr('磁力永遠垂直於運動方向（F ⟂ v）', 'Magnetic force stays perpendicular to motion (F ⟂ v)'), C.pink, 24],
              [tr('只改變方向，不直接改變速率', 'It changes direction but not speed'), CHALK, 24],
              [tr('磁力持續擔任向心力 → 圓弧', 'It supplies centripetal force → arc'), C.red, 24]
            ]);
            topCaption(ctx, tr('磁場內：軌跡向下彎成圓弧', 'Inside the field: the path bends down into an arc'), C.red);
          } },
        { d: 7, b: ['離場直線', 'Exit'], conclusion: true,
          draw(ctx, tl) {
            const p = 0.62 + 0.375 * clamp((tl % 3.5) / 3.1, 0, 1);   // 停在 0.995（progress=1 會繞回起點）
            orbitAt(ctx, p);
            if (p > 0.765) label(ctx, 'F = 0', exitX(p), EY + 2 * R1 + 36, C.pink, 'center', 24);
            elecPanel(ctx, [
              [tr('離開磁場後不再受磁力', 'After exiting, no magnetic force'), C.pink, 24],
              [tr('沿切線等速直線向左', 'Uniform straight-line motion to the left along the tangent'), CHALK, 24]
            ]);
            topCaption(ctx, tr('磁場內圓弧、離場後直線', 'Arc inside, straight line outside'), C.red);
          } },
        { d: 8, b: ['半徑比較', 'Radius'],
          cap: ['資優關鍵：<span class="nowrap">v ⟂ B</span> 時，軌跡是圓；<strong class="accent-green">磁場越強</strong>，軌道半徑越小。',
                'Extension: <span class="nowrap">v ⟂ B</span> gives a circular path; <strong class="accent-green">a stronger field</strong> gives a smaller radius.'],
          draw(ctx, tl) {
            clear(ctx);
            drawUniformField3D(ctx, EX);
            ORB1.stroke(ctx, .48); ORB2.stroke(ctx, .8);
            drawFlatArrow(ctx, 70, EY, 154, EY, C.red, 7, 18);
            // 半徑線
            ctx.save(); ctx.strokeStyle = CHALK; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]);
            ctx.beginPath(); ctx.moveTo(EX, EY + R1); ctx.lineTo(EX + R1, EY + R1);
            ctx.moveTo(EX, EY + R1 / 2); ctx.lineTo(EX + R1 / 2, EY + R1 / 2); ctx.stroke(); ctx.restore();
            label(ctx, 'r', EX + 86, EY + R1 + 20, CHALK, 'center', 24);
            label(ctx, 'r/2', EX + 30, EY + R1 / 2 - 17, CHALK, 'center', 22);
            label(ctx, 'B', 116, EY + 2 * R1 + 30, C.green, 'center', 26);
            label(ctx, '2B', 116, EY + R1 + 30, C.green, 'center', 26);
            // 同一速率的兩顆電子
            const s = 150 * (tl % 4.4);
            const p1 = ORB1.at(s), p2 = ORB2.at(s);
            if (s < ORB2.L) electronDot(ctx, p2.x, p2.y, s > 220);   // 兩顆分開後才標 e⁻
            if (s < ORB1.L) electronDot(ctx, p1.x, p1.y, true);
            elecPanel(ctx, [
              [tr('v ⟂ B 時，軌跡是圓', 'v ⟂ B gives a circular path'), CHALK, 24],
              [tr('同一速率：磁場 B → 半徑 r', 'Same speed: field B → radius r'), C.green, 24],
              [tr('磁場 2B → 半徑 r/2', 'Field 2B → radius r/2'), C.green, 24]
            ]);
            topCaption(ctx, tr('磁場越強，軌道半徑越小', 'A stronger field gives a smaller radius'), C.green);
          } }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0, endFired: false };

  function canvasCtx() { const c = document.getElementById('forceExamplesCanvas'); return c ? c.getContext('2d') : null; }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }

  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.canvas; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }

  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t), st = sc.steps[i], tl = S.t - sc.starts[i];
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    clear(ctx);
    st.draw(ctx, tl);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
  }
  function setResult(html) { const r = document.getElementById('forceExampleResult'); if (r) r.innerHTML = html; }

  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc || S.step < 0) return;
    const st = sc.steps[S.step];
    if (st.conclusion && typeof updateForceExampleText === 'function') {
      forceExampleState.mode = sc.mode;              // 頁面結論句依 mode 產生
      updateForceExampleText();
    } else if (st.cap) setResult(tr(st.cap[0], st.cap[1]));
    const row = document.getElementById('steps-force');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function jumpTo(k) {
    const sc = SCENES[S.scene]; if (!sc) return;
    S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; S.endFired = false;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-force'); if (!row) return;
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

  function visible() { const c = document.getElementById('forceExamplesCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

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

  MA.force = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'example-wires';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false;
      forceExampleState.mode = SCENES[sceneId].mode;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-force'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();

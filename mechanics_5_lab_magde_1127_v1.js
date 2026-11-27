/* mechanics_5_lab_magde_1127_v1.js — 「動手做｜馬德堡拔河賽」（#magdeLabCanvas，960×540，掛在 #tab1）
 * 契約：window.W5Lab.magde = { activate, deactivate, relang, _state }（骨架見 mechanics_4_labkit）。
 * 物理（教學用比例）：
 *   外面大氣壓往內壓的合力 F氣 ＝ (1 − p內) × F0（p內＝球內剩餘氣壓，atm，0～1）。
 *   每匹馬的拉力 f ＝ F0 ÷ 8，所以每邊 n 匹拉力 ＝ n × f。
 *   拉得開：n × f ≥ F氣　⇒　n ≥ 8 × (1 − p內)（無條件進位）。p＝0 要每邊 8 匹；p＝0.5 只要 4 匹。
 * 操作：滑桿設定球內剩餘空氣（抽氣有漸變動畫）；每邊 ±1 匹；按「開始拉」前馬不動；
 *   n ≥ 門檻 → 球「碰！」分開、空氣湧入（p→1）；否則馬用力、球不動，顯示「還差 x 匹」。
 */
(function () {
  'use strict';
  if (!window.M4Lab) return;
  const { T, COL, U } = M4Lab;

  const CX = 480, CY = 190, R = 95, RIN = 78, SEP = 24;
  const GR = [365, 440], LX0 = 330, DX = 64, HS = 0.78;
  const S = { pct: 0, p: 1, n: 4, phase: 'idle', t: 0, willSep: false, pUse: 1, sep: 0, burst: 0, time: 0 };

  const need = p => Math.max(0, Math.ceil(+(8 * (1 - p)).toFixed(6) - 1e-9));
  const pumping = () => S.phase !== 'apart' && Math.abs(S.p - S.pct / 100) > 1e-6;
  const busy = () => S.phase === 'pull' || S.phase === 'apart';

  function setPct(v) { S.pct = v; if (S.phase === 'fail') S.phase = 'idle'; }
  function addN(d) { S.n = Math.max(1, Math.min(10, S.n + d)); if (S.phase === 'fail') S.phase = 'idle'; }
  function pull() {
    if (busy() || pumping()) return;
    S.willSep = S.n >= need(S.p); S.phase = 'pull'; S.t = 0; S.pUse = S.p;
  }
  function vent() { if (S.phase === 'pull') return; S.phase = 'idle'; S.pct = 100; }
  function reset() { S.pct = 0; S.p = 1; S.n = 4; S.phase = 'idle'; S.sep = 0; S.burst = 0; S.t = 0; S.willSep = false; S.pUse = 1; }

  function step(_, dt) {
    S.time += dt;
    if (S.phase === 'pull') {
      S.t += dt;
      if (S.willSep) { if (S.t >= 0.9) { S.phase = 'apart'; S.burst = 1; } }
      else if (S.t >= 2.6) S.phase = 'fail';
    }
    const tgt = S.phase === 'apart' ? 1 : S.pct / 100;
    const rate = S.phase === 'apart' ? 5 : (tgt > S.p ? 1.6 : 0.5);
    if (S.p !== tgt) { const d = rate * dt; S.p = Math.abs(tgt - S.p) <= d ? tgt : S.p + Math.sign(tgt - S.p) * d; }
    const sT = S.phase === 'apart' ? SEP : 0;
    S.sep += (sT - S.sep) * Math.min(1, dt * 8); if (Math.abs(sT - S.sep) < 0.05) S.sep = sT;
    if (S.burst > 0) S.burst = Math.max(0, S.burst - dt / 0.9);
    return S.phase === 'pull' || S.p !== tgt || S.sep !== sT || S.burst > 0 || S.time < 0.3;
  }

  /* ───── 馬（剪影，面向 +x；dir＝-1 時鏡像）───── */
  function horse(c, x, g, dir, ph, amp, lean, col) {
    c.save(); c.translate(x, g); c.scale(dir * HS, HS); c.rotate(lean);
    const dark = '#4a2f1a', far = '#6b4526';
    const leg = (hx, a, cc) => { c.strokeStyle = cc; c.lineWidth = 6.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx, -28); c.lineTo(hx + Math.sin(a) * 30, -28 + Math.cos(a) * 28); c.stroke(); };
    const a1 = Math.sin(ph) * amp, a2 = Math.sin(ph + Math.PI) * amp;
    leg(-13, a2, far); leg(17, a1, far);
    /* 尾 */
    c.strokeStyle = dark; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-22, -42); c.quadraticCurveTo(-38, -40, -35, -20 + Math.sin(ph * 0.5) * 3); c.stroke();
    /* 身體、頸、頭 */
    c.fillStyle = col; c.strokeStyle = dark; c.lineWidth = 2.5; c.lineJoin = 'round';
    c.beginPath(); c.ellipse(0, -36, 24, 12.5, 0, 0, 6.2832); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(13, -42); c.lineTo(26, -63); c.lineTo(34, -58); c.lineTo(24, -32); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(38, -64, 11.5, 6, 0.55, 0, 6.2832); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(29, -68); c.lineTo(31, -79); c.lineTo(36, -68); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = dark; c.lineWidth = 4; c.beginPath(); c.moveTo(14, -46); c.lineTo(25, -64); c.stroke();
    c.fillStyle = '#1c120a'; c.beginPath(); c.arc(40, -66, 1.8, 0, 6.2832); c.fill();
    leg(-18, a1, col === '#c28a52' ? '#9a6a3f' : '#7a5230'); leg(12, a2, col === '#c28a52' ? '#9a6a3f' : '#7a5230');
    c.restore();
  }

  function drawSphere(c, jit, flow) {
    const lx = CX - S.sep + jit, rx = CX + S.sep + jit;
    const gr = (x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#f1d27b'); g.addColorStop(0.55, '#c8993a'); g.addColorStop(1, '#8a5f1c'); return g; };
    /* 底座 */
    c.fillStyle = '#6b7882'; c.fillRect(CX - 10 + jit, CY + R - 4, 20, 22); c.fillStyle = '#8a95a0'; c.fillRect(CX - 42 + jit, CY + R + 16, 84, 10);
    /* 左半球 */
    c.fillStyle = gr(lx - R, lx); c.beginPath(); c.arc(lx, CY, R, Math.PI / 2, Math.PI * 1.5); c.closePath(); c.fill();
    c.strokeStyle = '#5a3d10'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#12302a'; c.beginPath(); c.arc(lx, CY, RIN, Math.PI / 2, Math.PI * 1.5); c.closePath(); c.fill();
    c.fillStyle = '#b8892f'; c.fillRect(lx - 8, CY - R - 6, 8, R - RIN + 6); c.fillRect(lx - 8, CY + RIN, 8, R - RIN + 6);
    /* 右半球 */
    c.fillStyle = gr(rx + R, rx); c.beginPath(); c.arc(rx, CY, R, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fill();
    c.strokeStyle = '#5a3d10'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#12302a'; c.beginPath(); c.arc(rx, CY, RIN, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fill();
    c.fillStyle = '#b8892f'; c.fillRect(rx, CY - R - 6, 8, R - RIN + 6); c.fillRect(rx, CY + RIN, 8, R - RIN + 6);
    /* 球內空氣分子（數量 ∝ p） */
    const N = Math.round(S.p * 36);
    c.fillStyle = 'rgba(246,243,234,0.85)';
    for (let k = 0; k < N; k++) {
      const a = k * 2.39996, r = (RIN - 10) * Math.sqrt((k + 0.5) / 36);
      let ox = Math.cos(a) * r + Math.sin(S.time * 5 + k * 1.7) * 3, oy = Math.sin(a) * r + Math.cos(S.time * 4 + k * 2.3) * 3;
      const bx = ox < 0 ? lx : rx; ox = ox < 0 ? Math.min(ox, -7) : Math.max(ox, 7);
      c.beginPath(); c.arc(bx + ox, CY + oy, 3.4, 0, 6.2832); c.fill();
    }
    /* 兩端的環與繩鉤 */
    c.strokeStyle = '#c8993a'; c.lineWidth = 5;
    c.beginPath(); c.arc(lx - R - 10, CY, 10, 0, 6.2832); c.stroke();
    c.beginPath(); c.arc(rx + R + 10, CY, 10, 0, 6.2832); c.stroke();
    /* 抽氣閥（裝在左半球）與壓力表 */
    c.save(); c.translate(lx - CX, 0);
    c.fillStyle = '#9aa6b0'; c.fillRect(414, 84, 12, 36); c.fillRect(392, 96, 28, 9);
    U.rr(c, 402, 76, 36, 10, 4); c.fillStyle = '#c0c8d0'; c.fill();
    c.fillStyle = '#9aa6b0'; c.fillRect(470, 84, 10, 14);
    c.fillStyle = '#10211b'; c.strokeStyle = '#c0c8d0'; c.lineWidth = 4; c.beginPath(); c.arc(475, 56, 30, 0, 6.2832); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(246,243,234,0.55)'; c.lineWidth = 2;
    for (let k = 0; k <= 5; k++) { const a = (135 + 54 * k) * Math.PI / 180; c.beginPath(); c.moveTo(475 + Math.cos(a) * 21, 56 + Math.sin(a) * 21); c.lineTo(475 + Math.cos(a) * 26, 56 + Math.sin(a) * 26); c.stroke(); }
    const na = (135 + 270 * S.p) * Math.PI / 180;
    c.strokeStyle = COL.coral; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(475, 56); c.lineTo(475 + Math.cos(na) * 22, 56 + Math.sin(na) * 22); c.stroke();
    c.fillStyle = COL.white; c.beginPath(); c.arc(475, 56, 4, 0, 6.2832); c.fill();
    /* 抽氣／進氣的氣流 */
    if (flow) {
      c.strokeStyle = COL.teal; c.lineWidth = 4; c.setLineDash([9, 9]); c.lineDashOffset = flow * S.time * 40;
      c.beginPath(); c.moveTo(392, 100); c.lineTo(346, 100); c.stroke(); c.setLineDash([]);
      if (flow > 0) U.arrow(c, 360, 100, 344, 100, COL.teal, 4); else U.arrow(c, 346, 100, 390, 100, COL.teal, 4);
    }
    c.restore();
    /* 大氣壓往內壓的箭頭（長度 ∝ 1 − p） */
    const len = 54 * (1 - S.p);
    if (len > 8) {
      [[30, -1], [30, 1], [55, 1]].forEach(a => {
        const th = a[0] * Math.PI / 180, sy = a[1];
        [[lx, -1], [rx, 1]].forEach(h => {
          const dx = h[1] * Math.cos(th), dy = sy * Math.sin(th), r0 = R + 5;
          U.arrow(c, h[0] + dx * (r0 + len), CY + dy * (r0 + len), h[0] + dx * r0, CY + dy * r0, COL.coral, 5);
        });
      });
    }
  }

  function draw(c) {
    const strain = S.phase === 'pull' && !(S.willSep && S.t > 0.9);
    const jit = strain ? Math.sin(S.time * 55) * 1.3 : 0;
    const sepMoving = S.phase === 'apart' && S.sep < SEP - 1;
    const gait = strain || sepMoving;
    const ph = S.time * 9, amp = gait ? 0.55 : 0, lean = strain ? 0.16 : 0;
    const flow = S.phase !== 'apart' && pumping() ? (S.p > S.pct / 100 ? 1 : -1) : 0;

    /* 地面線與影子 */
    c.strokeStyle = 'rgba(246,243,234,0.14)'; c.lineWidth = 2;
    GR.forEach(g => { c.beginPath(); c.moveTo(0, g + 2); c.lineTo(960, g + 2); c.stroke(); });

    const rows = [Math.min(S.n, 5), Math.max(0, S.n - 5)];
    const hookL = CX - S.sep - R - 20 + jit, hookR = CX + S.sep + R + 20 + jit;
    const cols = ['#9a6a3f', '#c28a52'];
    rows.forEach((cnt, r) => {
      if (!cnt) return;
      const g = GR[r], ry = g - 28;
      [-1, 1].forEach(side => {
        const hx = side < 0 ? hookL : hookR, off = side * S.sep + jit;
        const xs = []; for (let j = 0; j < cnt; j++) xs.push(side < 0 ? LX0 - j * DX - S.sep + jit : 960 - (LX0 - j * DX) + S.sep + jit);
        const x0 = xs[0] - side * 20, xN = xs[cnt - 1];
        c.strokeStyle = strain ? '#f1e0b0' : '#d9c59a'; c.lineWidth = strain ? 5 : 4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(hx, CY); c.lineTo(x0, ry); c.lineTo(xN, ry); c.stroke();
      });
      [-1, 1].forEach(side => {
        for (let j = 0; j < cnt; j++) {
          const x = side < 0 ? LX0 - j * DX - S.sep + jit : 960 - (LX0 - j * DX) + S.sep + jit;
          c.fillStyle = 'rgba(5,15,12,0.35)'; c.beginPath(); c.ellipse(x, g + 3, 34, 6, 0, 0, 6.2832); c.fill();
          horse(c, x, g, side, ph + j * 0.9 + (side > 0 ? 0.5 : 0), amp, lean, cols[r]);
        }
      });
    });

    drawSphere(c, jit, flow);

    /* 「碰！」與空氣湧入 */
    if (S.burst > 0) {
      const b = S.burst, rr0 = 60 + (1 - b) * 70;
      c.save(); c.globalAlpha = Math.min(1, b * 1.6); c.fillStyle = COL.yellow; c.beginPath();
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, rr = k % 2 ? rr0 * 0.62 : rr0; c.lineTo(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.9); }
      c.closePath(); c.fill(); c.restore();
      U.pill(c, T('碰！', 'BANG!'), CX, CY, COL.coral, 40);
      c.save(); c.globalAlpha = Math.min(1, b * 1.4);
      [[0, -1], [0.7, -0.7], [-0.7, -0.7], [0, 1], [0.7, 0.7], [-0.7, 0.7]].forEach(d => {
        const s0 = 150 - (1 - b) * 40, s1 = 80;
        U.arrow(c, CX + d[0] * s0, CY + d[1] * s0 * 0.85, CX + d[0] * s1, CY + d[1] * s1 * 0.85, COL.coral, 5);
      });
      c.restore();
    }

    /* 抬頭資訊 */
    const nd = need(S.phase === 'apart' ? S.pUse : S.p);
    let st, sc;
    if (S.phase === 'apart') { st = T('碰！拉開了', 'Bang! Pulled apart'); sc = COL.green; }
    else if (S.phase === 'pull') { st = T('用力拉！', 'Pull hard!'); sc = COL.yellow; }
    else if (S.phase === 'fail') { st = T('拉不開！還差 ' + (nd - S.n) + ' 匹', 'Stuck! ' + (nd - S.n) + ' more needed'); sc = COL.coral; }
    else if (pumping()) { st = S.p > S.pct / 100 ? T('抽氣中…', 'Pumping out…') : T('放氣中…', 'Air flowing in…'); sc = COL.teal; }
    else { st = T('準備好了，按「開始拉」', 'Ready: press “Pull”'); sc = COL.white; }
    U.pill(c, st, 20, 46, sc, 22, 'left');
    U.pill(c, T('球內氣壓 p ＝ ', 'Inside p = ') + S.p.toFixed(2) + ' atm', 524, 56, COL.teal, 22, 'left', true);
    U.pill(c, T('外面大氣壓 1 atm', 'Outside air 1 atm'), 940, 106, COL.coral, 22, 'right');

    /* 氣壓力與拉力的長條比較（單位：一匹馬的力） */
    const F = 8 * (1 - S.p), by = 470, k = 11;
    c.strokeStyle = 'rgba(246,243,234,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(392, by); c.lineTo(568, by); c.stroke();
    c.fillStyle = COL.coral; c.fillRect(402, by - F * k, 60, F * k);
    c.fillStyle = S.n >= F - 1e-9 ? COL.teal : COL.dim; c.fillRect(498, by - S.n * k, 60, S.n * k);
    c.save(); c.strokeStyle = COL.yellow; c.lineWidth = 2.5; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(392, by - F * k); c.lineTo(568, by - F * k); c.stroke(); c.restore();
    U.label(c, F.toFixed(1), 432, by - F * k - 16, COL.coral, 22, 'center', true);
    U.label(c, String(S.n), 528, by - S.n * k - 16, COL.teal, 22, 'center', true);
    U.label(c, T('氣壓力', 'Air push'), 432, 497, COL.coral, 22, 'center');
    U.label(c, T('每邊拉力', 'Pull'), 528, 497, COL.teal, 22, 'center');

    /* 馬數 */
    U.label(c, T('左邊 ', 'Left: ') + S.n + T(' 匹', ' horses'), 190, 500, COL.white, 22, 'center');
    U.label(c, T('右邊 ', 'Right: ') + S.n + T(' 匹', ' horses'), 770, 500, COL.white, 22, 'center');
  }

  function result() {
    const pc = S.phase === 'apart' ? S.pUse : S.p, ps = pc.toFixed(2), nd = need(pc), F = 8 * (1 - pc), Fs = F.toFixed(1), n = S.n;
    const ok = n >= nd, miss = nd - n;
    let head;
    if (S.phase === 'apart') head = `<span class="lw-big lw-ok">${T('碰！半球被拉開了，空氣湧進去，p 回到 1 atm', 'Bang! The hemispheres come apart and air rushes in: p back to 1 atm')}</span>`;
    else if (S.phase === 'fail') head = `<span class="lw-big lw-bad">${T('拉不開！球一動也不動，還差 ' + miss + ' 匹', 'Stuck! The ball does not budge: ' + miss + ' more needed per side')}</span>`;
    else if (S.phase === 'pull') head = `<span class="lw-big lw-y">${T('馬正在用力拉…', 'The horses are pulling…')}</span>`;
    else if (pumping()) head = `<span class="lw-big lw-c">${S.p > S.pct / 100 ? T('抽氣中，球內氣壓下降…', 'Pumping out: the inside pressure drops…') : T('放氣中，空氣湧回球內…', 'Air flows back into the ball…')}</span>`;
    else head = `<span class="lw-big lw-c">${T('準備好了：調好空氣與馬匹，按「開始拉」', 'Ready: set the air and the horses, then press “Pull”')}</span>`;
    const inside = S.phase === 'apart'
      ? `${T('內部氣壓：拉開前 p ＝ ', 'Inside pressure before the pull: p = ')}<b class="lw-c">${ps} atm</b>${T('；外部 ＝ ', '; outside = ')}<b class="lw-y">1 atm</b>`
      : `${T('內部氣壓 p ＝ ', 'Inside pressure p = ')}<b class="lw-c">${ps} atm</b>${T('；外部 ＝ ', '; outside = ')}<b class="lw-y">1 atm</b>`;
    const verdict = ok
      ? `<b class="lw-ok">${T('拉得開', 'Can pull apart')}</b>${T('（n ≥ ' + nd + '）', ' (n ≥ ' + nd + ')')}`
      : `<b class="lw-bad">${T('拉不開', 'Cannot pull apart')}</b>${T('（n < ' + nd + '，還差 ' + miss + ' 匹）', ' (n < ' + nd + ', ' + miss + ' short)')}`;
    return `<div>${head}</div>` +
      `<div>${inside}</div>` +
      `<div>${T('往內壓的力 F氣 ＝ (1 − p) × 8 匹馬的力 ＝ (1 − ' + ps + ') × 8 ＝ ', 'Inward push F = (1 − p) × 8 horse-forces = (1 − ' + ps + ') × 8 = ')}<b class="lw-p">${Fs} ${T('匹馬的力', 'horse-forces')}</b></div>` +
      `<div>${T('每邊需要 8 × (1 − p) ＝ ' + Fs + '，無條件進位 ＝ ', 'Each side needs 8 × (1 − p) = ' + Fs + ', rounded up = ')}<b class="lw-y">${nd} ${T('匹', 'horses')}</b></div>` +
      `<div>${T('目前每邊 n ＝ ', 'Now n = ')}<b class="lw-y">${n}</b>${T(' 匹，拉力 ＝ ' + n + ' 匹馬的力 ' + (n >= F - 1e-9 ? '≥' : '<') + ' ' + Fs + '　判斷：', ' per side, pull = ' + n + ' horse-forces ' + (n >= F - 1e-9 ? '≥' : '<') + ' ' + Fs + '. Verdict: ')}${verdict}</div>` +
      `<div style="color:#a3b8b0">${T('馬德堡實驗：左右各 8 匹馬', 'The Magdeburg experiment: 8 horses on each side')}</div>`;
  }

  M4Lab.make({
    key: 'magde', tab: 'tab1',
    titleZh: '動手做｜馬德堡拔河賽', titleEn: 'Try it | Magdeburg Tug-of-War',
    subZh: '先把球內的空氣抽掉，再請馬來拉。先預測：球裡剩多少空氣，每邊要幾匹馬才拉得開？', subEn: 'Pump the air out of the ball, then let the horses pull. Predict first: how many horses per side does it take?',
    tipZh: '每匹馬的力一樣大。球內空氣越少，外面大氣壓往內壓得越用力，需要的馬就越多；完全抽成真空要每邊 8 匹。', tipEn: 'Every horse pulls equally. The less air inside, the harder the outside air squeezes the halves together; a full vacuum needs 8 horses per side.',
    init: () => S,
    controls: () => [
      { kind: 'slider', id: 'air', zh: '球內剩餘空氣', en: 'Air left inside', min: 0, max: 100, step: 5, get: () => S.pct, set: setPct, fmt: v => v + '%', disabled: busy },
      { kind: 'buttons', items: [
        { id: 'plus', zh: '🐎 每邊 ＋1 匹', en: '🐎 +1 horse per side', on: () => addN(1), disabled: () => busy() || S.n >= 10 },
        { id: 'minus', zh: '每邊 －1 匹', en: '−1 horse per side', on: () => addN(-1), disabled: () => busy() || S.n <= 1 },
        { id: 'pull', zh: '💪 開始拉', en: '💪 Pull!', on: pull, disabled: () => busy() || pumping() },
        { id: 'vent', zh: '💨 放氣回復', en: '💨 Let air in', on: vent, disabled: () => S.phase === 'pull' },
        { id: 'reset', zh: '↺ 重來', en: '↺ Restart', on: reset }
      ] }
    ],
    step, draw, result,
    snapshot: s => ({ p: +s.p.toFixed(3), pct: s.pct, n: s.n, phase: s.phase, need: need(s.phase === 'apart' ? s.pUse : s.p), willSep: s.willSep, sep: +s.sep.toFixed(2), pumping: pumping() })
  });
  window.W5Lab.magde.set = function (o) { if (o.pct != null) setPct(o.pct); if (o.n != null) { S.n = o.n; if (S.phase === 'fail') S.phase = 'idle'; } window.W5Lab.magde.request(); };
  window.W5Lab.magde.pull = function () { pull(); window.W5Lab.magde.request(); };
})();

/* organics_1_lab_wood_1128_v1.js ｜ 動手做：鋁箔包竹筷的乾餾（tab2；舊版「虛擬乾餾實驗室」的流程，改用新版畫法）
 * 流程（老師 2026-11-28 指定用舊版）：戴護目鏡 → 1 鋁箔包覆（竹筷包進鋁箔、捲起、斜放夾好）→ 2 酒精燈加熱（點燈、冒白煙）
 *       → 3 點燃氣體（開口處的可燃氣體）→ 4 打開看產物（蓋燈帽；固體木炭、液體焦油、透明醋酸，石蕊試紙變紅）。
 * 契約：window.W5Lab.wood = { activate, deactivate, relang, _state }；S.run(name, instant)：
 *   'gog'／'wrap'／'heat'／'ignite'／'open'；instant＝true 時直接做到完成（跳句用）。S.reset() 重來。
 * 版面（960×540）：左側鐵架＋斜放鋁箔捲（軸心 (430,290)、仰角 20°、長 300、半徑 22）、酒精燈在 x 392；右側 x 500～950 是打開後的鋁箔攤開處。
 * 不畫手：鋁箔、火柴、試紙都是自己移動的器材。
 */
(function () {
  'use strict';
  if (typeof M4Lab === 'undefined' || typeof O1 === 'undefined') return;
  const T = M4Lab.T, COL = M4Lab.COL, U = M4Lab.U, clamp01 = W5.clamp01, mix = W5.mix;
  const GY = 482;                                   // 桌面
  const A = -20 * Math.PI / 180, DX = Math.cos(A), DY = Math.sin(A);
  const ROLL = { cx: 430, cy: 290, len: 300, r: 22 };
  const FLAT = { cx: 650, cy: GY - 26 };             // 包覆前鋁箔平放的位置
  const LAMP = { x: 392, s: 1.15, fh: 70 };
  const OPEN_END = { x: ROLL.cx + DX * ROLL.len / 2, y: ROLL.cy + DY * ROLL.len / 2 };
  const SHEET = { x0: 520, x1: 930, yT: 392, yB: 466 };   // 打開後攤開的鋁箔（梯形，透視）

  function init() {
    const S = { gogOn: false, gog: 0, wrap: 0, wrapDone: false, match: -1, lampOn: false, heat: 0, heatDone: false, ignMatch: -1, ign: 0, ignDone: false,
                cap: 0, unroll: 0, prod: 0, paper: 0, pap: 0, openDone: false, tt: 0, seq: M4Lab.Seq() };
    S.run = function (name, instant) { run(S, name, instant); };
    S.reset = function () { const n = init(); Object.keys(n).forEach(k => { if (k !== 'run' && k !== 'reset') S[k] = n[k]; }); };
    return S;
  }

  function run(S, name, instant) {
    if (S.seq.busy) { if (!instant) return; finish(S); }
    let list = null;
    if (name === 'gog') list = [{ d: 0.8, u: p => { S.gog = p; }, e: () => { S.gogOn = true; S.gog = 1; } }];
    else if (name === 'wrap') {
      if (!S.gogOn || S.wrapDone) return;
      list = [{ d: 3.2, u: p => { S.wrap = p * 0.55; } }, { d: 2.4, u: p => { S.wrap = 0.55 + p * 0.45; }, e: () => { S.wrap = 1; S.wrapDone = true; } }];
    } else if (name === 'heat') {
      if (!S.wrapDone || S.heatDone) return;
      list = [{ d: 1.6, u: p => { S.match = p; if (p > 0.62) S.lampOn = true; }, e: () => { S.match = -1; S.lampOn = true; } },
              { d: 7, u: p => { S.heat = p; }, e: () => { S.heat = 1; S.heatDone = true; } }];
    } else if (name === 'ignite') {
      if (!S.heatDone || S.ignDone) return;
      list = [{ d: 2.2, u: p => { S.ignMatch = p; if (p > 0.55) S.ign = Math.min(1, (p - 0.55) / 0.3); }, e: () => { S.ignMatch = -1; S.ign = 1; S.ignDone = true; } }];
    } else if (name === 'open') {
      if (!S.heatDone || S.openDone) return;
      list = [{ d: 1.4, u: p => { S.cap = p; if (p > 0.6) { S.lampOn = false; S.ign = 0; } }, e: () => { S.cap = 1; S.lampOn = false; S.ign = 0; } },
              { d: 1.8, u: p => { S.unroll = p; } },
              { d: 1.6, u: p => { S.prod = p; } },
              { d: 1.8, u: p => { S.paper = p; }, e: () => { S.unroll = 1; S.prod = 1; S.paper = 1; S.openDone = true; } }];
    }
    if (!list) return;
    S.seq.run(list);
    if (instant) finish(S);
  }
  function finish(S) { let g = 0; while (S.seq.busy && g++ < 600) S.seq.step(0.1); }
  function step(S, dt) {
    S.tt += dt; const mv = S.seq.step(dt);
    return mv || S.lampOn || S.ign > 0;
  }

  /* ── 鋁箔捲（軸心 cx,cy、角度 ang）：左端壓扁封口，右端開口 ── */
  function foilRoll(c, cx, cy, ang, len, r, o) {
    o = o || {}; const a = o.a == null ? 1 : o.a; if (a <= 0.02) return;
    const soot = clamp01(o.soot || 0), glow = clamp01(o.glow || 0), t = o.t || 0;
    c.save(); c.globalAlpha *= a; c.translate(cx, cy); c.rotate(ang);
    const g = c.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#f1f5f6'); g.addColorStop(0.28, '#c7d0d3'); g.addColorStop(0.62, '#8f9ca1'); g.addColorStop(1, '#6a777c');
    /* 主體 */
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, r + 20 + Math.max(0, (cy - 300) * 0.0), len * 0.46, 7, 0, 0, Math.PI * 2); c.restore(); c.save(); c.globalAlpha *= a; c.translate(cx, cy); c.rotate(ang);
    c.fillStyle = g; c.strokeStyle = 'rgba(30,44,50,0.9)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-len / 2 + 14, -r); c.lineTo(len / 2, -r); c.lineTo(len / 2, r); c.lineTo(-len / 2 + 14, r); c.closePath(); c.fill(); c.stroke();
    /* 左端壓扁的封口（鋁箔折起來） */
    c.fillStyle = mix('#b9c3c7', '#8f9ca1', 0.4); c.beginPath(); c.moveTo(-len / 2 + 14, -r); c.lineTo(-len / 2, -r * 0.45); c.lineTo(-len / 2, r * 0.45); c.lineTo(-len / 2 + 14, r); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(40,56,62,0.55)'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-len / 2 + 3 + i * 4, -r * 0.4); c.lineTo(-len / 2 + 3 + i * 4, r * 0.4); c.stroke(); }
    /* 反光與皺摺 */
    c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-len / 2 + 30, -r * 0.55); c.lineTo(len / 2 - 14, -r * 0.55); c.stroke();
    c.strokeStyle = 'rgba(40,56,62,0.35)'; c.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) { const x = -len / 2 + 40 + i * 36; c.beginPath(); c.moveTo(x, -r + 3); c.quadraticCurveTo(x + 6, 0, x - 2, r - 3); c.stroke(); }
    /* 受熱處：煙燻發黑＋橘光 */
    if (soot > 0.02) {
      const sx = -len / 2 + 70, sw = 130; const gg = c.createLinearGradient(0, -r, 0, r);
      gg.addColorStop(0, 'rgba(30,24,20,0)'); gg.addColorStop(0.5, 'rgba(30,24,20,' + (0.45 * soot).toFixed(2) + ')'); gg.addColorStop(1, 'rgba(18,14,12,' + (0.85 * soot).toFixed(2) + ')');
      c.fillStyle = gg; c.fillRect(sx, -r, sw, 2 * r);
    }
    if (glow > 0.02) { const gl = c.createRadialGradient(-len / 2 + 135, r * 0.7, 0, -len / 2 + 135, r * 0.7, 70); gl.addColorStop(0, 'rgba(255,150,60,' + (0.55 * glow).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = gl; c.fillRect(-len / 2, -r, len, 2 * r); }
    /* 右端開口（深色橢圓） */
    c.fillStyle = '#1b2428'; c.beginPath(); c.ellipse(len / 2, 0, 5.5, r * 0.88, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(210,222,226,0.9)'; c.lineWidth = 2; c.stroke();
    c.restore();
  }

  /* 鐵架：底座、立桿、橫臂＋夾環（夾在鋁箔捲左段） */
  function stand(c, clampOn) {
    c.save();
    c.fillStyle = '#4b5559'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2;
    U.rr(c, 150, GY - 14, 150, 14, 4); c.fill(); c.stroke();
    c.fillStyle = '#8a969b'; U.rr(c, 205, 245, 12, GY - 14 - 245, 3); c.fill(); c.stroke();
    c.fillStyle = '#6d787d'; c.beginPath(); c.arc(211, 330, 9, 0, Math.PI * 2); c.fill(); c.stroke();
    /* 橫臂：從立桿到夾環位置（沿鋁箔捲左段 d=45 處） */
    const cxp = ROLL.cx - DX * (ROLL.len / 2 - 45), cyp = ROLL.cy - DY * (ROLL.len / 2 - 45);
    c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(211, 330); c.lineTo(cxp, cyp + 4); c.stroke();
    c.strokeStyle = '#a2adb2'; c.lineWidth = 5; c.beginPath(); c.moveTo(211, 330); c.lineTo(cxp, cyp + 4); c.stroke();
    c.restore();
    return { cx: cxp, cy: cyp };
  }
  function clampRing(c, p) {
    c.save(); c.translate(p.cx, p.cy); c.rotate(A + Math.PI / 2);
    c.fillStyle = '#5f6a6f'; c.strokeStyle = 'rgba(11,26,21,0.85)'; c.lineWidth = 2;
    U.rr(c, -ROLL.r - 6, -5, 2 * ROLL.r + 12, 10, 3); c.fill(); c.stroke();
    c.restore();
  }

  /* 竹筷（包覆前放在鋁箔上） */
  function chopsticks(c, cx, cy, a) {
    if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    [[-70, -10, 130], [-10, 4, 150], [50, -3, 110]].forEach(([dx, dy, L]) => {
      c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 12; c.beginPath(); c.moveTo(cx + dx - L / 2, cy + dy); c.lineTo(cx + dx + L / 2, cy + dy); c.stroke();
      c.strokeStyle = '#d9b873'; c.lineWidth = 8; c.beginPath(); c.moveTo(cx + dx - L / 2, cy + dy); c.lineTo(cx + dx + L / 2, cy + dy); c.stroke();
    });
    c.restore();
  }

  /* 打開後攤開的鋁箔，上面有木炭、焦油、醋酸＋試紙 */
  function openSheet(c, S, t) {
    const a = U.ease(S.unroll); if (a <= 0.02) return;
    c.save(); c.globalAlpha *= a;
    const x0 = SHEET.x0, x1 = SHEET.x1, yT = SHEET.yT, yB = SHEET.yB;
    const g = c.createLinearGradient(0, yT, 0, yB); g.addColorStop(0, '#9aa6ab'); g.addColorStop(1, '#d8e0e2');
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.moveTo(x0 - 4, yB + 8); c.lineTo(x1 + 8, yB + 8); c.lineTo(x1 - 16, yT + 8); c.lineTo(x0 + 24, yT + 8); c.closePath(); c.fill();
    c.fillStyle = g; c.strokeStyle = 'rgba(30,44,50,0.9)'; c.lineWidth = 2.5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x0 - 8, yB); c.lineTo(x1 + 4, yB); c.lineTo(x1 - 24, yT); c.lineTo(x0 + 20, yT); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 40, yT + 8); c.lineTo(x1 - 50, yT + 8); c.stroke();
    c.restore();
    const p = U.ease(S.prod);
    if (p > 0.02) {
      /* 木炭：三條黑色長條 */
      c.save(); c.globalAlpha *= p;
      [[596, 428, 74, 0.04], [650, 436, 80, -0.03], [706, 430, 70, 0.06]].forEach(([x, y, L, r]) => {
        c.save(); c.translate(x, y); c.rotate(r);
        c.fillStyle = '#12161a'; U.rr(c, -L / 2, -8, L, 16, 6); c.fill(); c.strokeStyle = 'rgba(140,152,158,0.5)'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = 'rgba(160,172,178,0.35)'; c.fillRect(-L / 2 + 8, -5, L * 0.5, 2.5); c.restore();
      });
      /* 焦油：深褐色黏稠一灘 */
      c.fillStyle = '#3a2412'; c.strokeStyle = 'rgba(11,26,21,0.7)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(770, 446, 38, 10, 0.05, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,214,150,0.3)'; c.beginPath(); c.ellipse(760, 443, 14, 3, 0, 0, Math.PI * 2); c.fill();
      /* 醋酸：透明的一小灘 */
      c.fillStyle = 'rgba(190,226,250,0.5)'; c.strokeStyle = 'rgba(210,240,255,0.9)'; c.lineWidth = 2; c.beginPath(); c.ellipse(868, 444, 38, 10, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.restore();
      /* 標籤與引線 */
      const lab = (txt, bx, by, tx, ty, col) => {
        c.save(); c.globalAlpha *= p; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by + 17); c.lineTo(tx, ty); c.stroke();
        c.fillStyle = col; c.beginPath(); c.arc(tx, ty, 4, 0, Math.PI * 2); c.fill(); c.restore();
        c.save(); c.globalAlpha *= p; U.pill(c, txt, bx, by, col, 22, 'center'); c.restore();
      };
      lab(T('固體：木炭（含 C）', 'Solid: charcoal (C)'), 575, 346, 648, 430, COL.white);
      lab(T('液體：深色焦油', 'Liquid: dark tar'), 770, 346, 770, 440, COL.coral);
    }
    /* 石蕊試紙：從上方滑進醋酸裡，由藍變紅 */
    if (S.paper > 0.02) {
      const q = U.ease(Math.min(1, S.paper / 0.45)), k = clamp01((S.paper - 0.45) / 0.55);
      const px = 868 - 30, py = U.lerp(330, 428, q);
      O1.litmus(c, px, py, 60, 14, { k: U.ease(k) * 1.15, cx: 868, cy: py + 7, wet: q > 0.9 ? 1 : 0 });
      if (k > 0.5) U.pill(c, T('試紙變紅：酸性', 'Turns red: acidic'), 840, 262, COL.yellow, 22, 'center');
      U.pill(c, T('透明液體：醋酸', 'Clear liquid: acetic acid'), 840, 300, COL.teal, 22, 'center');
      c.save(); c.strokeStyle = COL.teal; c.lineWidth = 2; c.beginPath(); c.moveTo(868, 318); c.lineTo(868, 336); c.stroke(); c.restore();
    }
  }

  function draw(c, S) {
    const t = S.tt, w = S.wrap;
    /* 桌面上的小東西：護目鏡、火柴盒 */
    O1.goggles(c, 100, 58, { s: 0.9, a: 0.35 + 0.65 * S.gog, col: S.gogOn ? COL.yellow : COL.white });
    U.label(c, T(S.gogOn ? '護目鏡：戴好了' : '護目鏡', S.gogOn ? 'Goggles on' : 'Goggles'), 100, 100, S.gogOn ? COL.yellow : COL.dim, 22, 'center');
    c.save(); c.fillStyle = '#c0392b'; U.rr(c, 42, GY - 30, 74, 30, 4); c.fill(); c.fillStyle = '#f6f3ea'; c.fillRect(48, GY - 22, 62, 10); c.restore();

    /* 鐵架 */
    const clampP = stand(c, w > 0.9);
    /* 酒精燈（燈帽蓋上時熄火） */
    const lampOn = S.lampOn ? 1 : 0;
    const flameK = S.cap > 0 ? clamp01(1 - S.cap * 1.6) : 1;
    O1.lamp(c, LAMP.x, GY, { s: LAMP.s, on: lampOn && flameK > 0.02, t, fh: LAMP.fh * flameK });
    if (S.cap > 0) { const k = U.ease(Math.min(1, S.cap)); O1.lampCap(c, LAMP.x, GY - 44 * LAMP.s - (1 - k) * 90, LAMP.s, { a: Math.min(1, S.cap * 4) }); }

    /* 鋁箔：平放 → 捲成筒 → 斜放夾好 */
    const rollA = S.unroll > 0 ? 1 - U.ease(Math.min(1, S.unroll * 1.6)) : 1;
    if (!S.wrapDone) {
      const p1 = clamp01(w / 0.5), p2 = clamp01((w - 0.5) / 0.5);
      if (w <= 0.02) {
        /* 還沒包：一張平放的鋁箔＋三根竹筷 */
        c.save(); const g = c.createLinearGradient(0, FLAT.cy - 14, 0, FLAT.cy + 14); g.addColorStop(0, '#b8c3c7'); g.addColorStop(1, '#8f9ca1');
        c.fillStyle = g; c.strokeStyle = 'rgba(30,44,50,0.9)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(FLAT.cx - 160, FLAT.cy + 12); c.lineTo(FLAT.cx + 160, FLAT.cy + 12); c.lineTo(FLAT.cx + 130, FLAT.cy - 14); c.lineTo(FLAT.cx - 130, FLAT.cy - 14); c.closePath(); c.fill(); c.stroke(); c.restore();
        chopsticks(c, FLAT.cx, FLAT.cy - 8, 1);
        U.label(c, T('竹筷＋鋁箔紙', 'Bamboo + foil'), FLAT.cx, FLAT.cy - 58, COL.white, 22, 'center');
      } else if (w < 0.5) {
        /* 捲起來：鋁箔變成圓筒（半徑長大）、竹筷消失在裡面 */
        const rr = U.lerp(7, ROLL.r, U.ease(p1));
        chopsticks(c, FLAT.cx, FLAT.cy - 8 - rr * 0.3, 1 - U.ease(Math.min(1, p1 * 1.7)));
        foilRoll(c, FLAT.cx, FLAT.cy - rr + 12, 0, ROLL.len, rr, { a: 1, t });
      } else {
        /* 斜放到鐵架上：從平放位置移動、轉到 20° */
        const k = U.ease(p2);
        const cx = U.lerp(FLAT.cx, ROLL.cx, k), cy = U.lerp(FLAT.cy - ROLL.r + 12, ROLL.cy, k);
        foilRoll(c, cx, cy, A * k, ROLL.len, ROLL.r, { a: rollA, t, soot: 0, glow: 0 });
        if (p2 > 0.9) clampRing(c, clampP);
      }
    }
    if (S.wrapDone) {
      const h = S.heat, soot = clamp01(h * 1.2);
      foilRoll(c, ROLL.cx, ROLL.cy, A, ROLL.len, ROLL.r, { a: rollA, t, soot, glow: S.lampOn ? Math.min(1, h * 3) : 0 });
      if (rollA > 0.5) clampRing(c, clampP);
    }

    /* 開口：白煙（水蒸氣）＋可燃氣體 */
    const smoke = S.heat > 0.2 ? Math.min(1, (S.heat - 0.2) * 2.6) : 0, sm = S.cap > 0 ? Math.max(0, 1 - S.cap) : 1;
    if (smoke > 0 && sm > 0.02) O1.smoke(c, OPEN_END.x + 6, OPEN_END.y - 8, t, { n: 18, h: 150, a: smoke * sm * (S.ign > 0.5 ? 0.55 : 1), col: '#f2f6f7', spread: 20, r: 10, drift: 0.05 });
    if (S.ign > 0.02) O1.flame(c, OPEN_END.x + 8, OPEN_END.y - 4, 44 * S.ign, t, { w: 13 * S.ign });
    /* 點火柴（左上方來） */
    if (S.match >= 0) {
      const p = S.match, k = U.ease(Math.min(1, p / 0.6)), lamp = { x: LAMP.x + 6, y: GY - 60 * LAMP.s - 4 };
      const mx = U.lerp(100, lamp.x, k), my = U.lerp(GY - 36, lamp.y, k) - Math.sin(Math.PI * Math.min(1, p / 0.6)) * 34;
      O1.match(c, mx, my, Math.PI * 0.82, { lit: p > 0.15 ? 1 : 0, len: 58, t });
    }
    if (S.ignMatch >= 0) {
      const p = S.ignMatch, k = U.ease(Math.min(1, p / 0.55));
      const mx = U.lerp(OPEN_END.x + 90, OPEN_END.x + 12, k), my = U.lerp(OPEN_END.y - 80, OPEN_END.y - 6, k);
      O1.match(c, mx, my, Math.PI * 0.2, { lit: 1, len: 58, t, burnt: p > 0.8 ? 0.5 : 0 });
    }
    /* 標籤 */
    if (S.wrapDone && S.cap === 0 && !S.openDone) {
      if (S.heat > 0.3 && !S.ign) U.pill(c, T('冒出白煙', 'White smoke'), OPEN_END.x + 44, OPEN_END.y - 128, COL.white, 22, 'left');
      if (S.ign > 0.6) U.pill(c, T('可燃性氣體', 'Flammable gas'), OPEN_END.x + 44, OPEN_END.y - 92, COL.yellow, 22, 'left');
      if (!S.heat) U.pill(c, T('斜放：受熱面積大、液體流向底部', 'Tilted: more heated area, liquid runs down'), 540, 100, COL.yellow, 22, 'left');
    }
    if (S.wrapDone && S.heat > 0 && S.heat < 1 || (S.wrapDone && S.heatDone && !S.openDone && !S.ign)) {
      /* 提示：隔絕空氣加熱（鋁箔裡沒有空氣進得去） */
      if (S.heat > 0.05) U.pill(c, T('鋁箔裡隔絕空氣', 'No air gets into the foil'), 620, 440, COL.teal, 22, 'center');
    }
    openSheet(c, S, t);
    if (!S.gogOn) U.label(c, T('先戴護目鏡，再把竹筷包進鋁箔', 'Goggles first, then wrap the bamboo in foil'), 560, 56, COL.yellow, 24, 'center');
  }

  function result(S) {
    let tip;
    if (!S.gogOn) tip = ['加熱前先<b>戴上護目鏡</b>。', 'Put on your <b>goggles</b> before heating.'];
    else if (!S.wrapDone) tip = ['按「鋁箔包覆」：把竹筷包進鋁箔、捲起，<b>斜著夾在鐵架上</b>。', 'Press “Wrap in foil”: roll the bamboo into foil and <b>clamp it tilted</b>.'];
    else if (!S.heatDone) tip = ['按「酒精燈加熱」：<b>斜放</b>可增加受熱面積，也讓液體流向底部。', 'Press “Heat”: <b>tilting</b> adds heated area and lets liquid run to the bottom.'];
    else if (!S.ignDone) tip = ['隔絕空氣加熱：開口冒出<b>白煙</b>和<b>可燃氣體</b>。按「點燃氣體」。', 'Heated without air: <b>white smoke</b> and <b>flammable gas</b> escape. Press “Light the gas”.'];
    else if (!S.openDone) tip = ['可燃氣體被點燃了——木材裡的有機物正在被熱分解。按「打開看產物」。', 'The gas burns — the organics in the wood are breaking down. Press “Open and look”.'];
    else tip = ['看，三種產物都在這裡！', 'All three products are right here!'];
    let h = '<div>' + T(tip[0], tip[1]) + '</div>';
    if (S.heat > 0.3) h += '<div><span class="lw-y">' + T('鋁箔', 'Foil') + '</span>：' + T('冒出<b>白煙</b>（小水滴）', '<b>White smoke</b> (tiny water droplets)') + '</div>';
    if (S.ignDone) h += '<div><span class="lw-y">' + T('氣體', 'Gas') + '</span>：' + T('開口<b>燒起來</b>了——有<b>可燃性氣體</b>（CO、CH₄、H₂）', 'The opening <b>burns</b> — <b>flammable gas</b> (CO, CH₄, H₂)') + '</div>';
    if (S.openDone) {
      h += '<div><span class="lw-y">' + T('固體', 'Solid') + '</span>：' + T('黑色的<b>木炭</b>，成分就是<b>碳</b>', 'Black <b>charcoal</b> — it is <b>carbon</b>') + '</div>';
      h += '<div><span class="lw-y">' + T('液體', 'Liquid') + '</span>：' + T('深色黏稠的<b>焦油</b>和透明的<b>醋酸</b>；藍色石蕊試紙<b>變紅</b>', 'Dark sticky <b>tar</b> and clear <b>acetic acid</b>; blue litmus <b>turns red</b>') + '</div>';
    }
    return h;
  }

  M4Lab.make({
    key: 'wood', tab: 'tab2',
    titleZh: '🥢 實驗台：竹筷的乾餾', titleEn: '🥢 Lab Bench: Dry Distillation of Bamboo',
    subZh: '把竹筷包進鋁箔、隔絕空氣加熱，看看氣體、液體、固體三種產物。',
    subEn: 'Wrap bamboo in foil, heat it without air, and look for the three products: gas, liquid and solid.',
    tipZh: '依序按：護目鏡、鋁箔包覆、酒精燈加熱、點燃氣體、打開看產物。', tipEn: 'Press in order: goggles, wrap in foil, heat, light the gas, open and look.',
    init, step, draw, result,
    controls: S => {
      const idle = () => !S.seq.busy;
      return [
        { kind: 'buttons', items: [
          { id: 'gog', zh: '🥽 戴上護目鏡', en: '🥽 Goggles on', on: () => run(S, 'gog'), active: () => S.gogOn, disabled: () => S.gogOn || !idle() },
          { id: 'wrap', zh: '1. 鋁箔包覆', en: '1. Wrap in foil', on: () => run(S, 'wrap'), active: () => S.wrapDone, disabled: () => !S.gogOn || S.wrapDone || !idle() },
          { id: 'heat', zh: '2. 酒精燈加熱', en: '2. Heat with the lamp', on: () => run(S, 'heat'), active: () => S.heatDone, disabled: () => !S.wrapDone || S.heatDone || !idle() }] },
        { kind: 'buttons', items: [
          { id: 'ignite', zh: '3. 點燃氣體', en: '3. Light the gas', on: () => run(S, 'ignite'), active: () => S.ignDone, disabled: () => !S.heatDone || S.ignDone || !idle() },
          { id: 'open', zh: '4. 打開看產物', en: '4. Open and look', on: () => run(S, 'open'), active: () => S.openDone, disabled: () => !S.heatDone || S.openDone || !idle() },
          { id: 'reset', zh: '↺ 重來', en: '↺ Again', on: () => { S.seq.run([]); S.reset(); } }] }
      ];
    },
    snapshot: S => ({ gogOn: S.gogOn, wrapDone: S.wrapDone, lampOn: S.lampOn, heatDone: S.heatDone, ignDone: S.ignDone, openDone: S.openDone, busy: S.seq.busy })
  });
})();

/* density_1_anim_t1_1110_v1.js — density_1「實驗室安全」分頁動畫：打翻的酒精燈（畫布邏輯 1000×600）
 *
 * 契約：window.DenAnim.t1 = { start(canvas, lang), stop(), setLang(lang), goStep(i, stopAfter), setStopAfter(b),
 *                             pause(b), info(), onStep, onEnd, _frameAt(t), _texts(), _state() }
 * 畫面是「時間 t 的純函式」；每步播完停在最後一幀（stopAfter＝true），false 則連播到底。進度條用 window.AnimBar。
 * 步驟（各 10 s，共 50 s）：
 *   1 打翻起火  酒精燈倒下 → 酒精流到桌面 → 起火
 *   2 潑水錯誤  燒杯倒水 → 水層上浮著酒精、火跟著液面往外擴
 *   3 濕布蓋住  濕抹布落下蓋住 → 空氣進不去 → 火熄、冒煙
 *   4 試管加熱  試管夾夾住、傾斜約 45°、管口指向無人處
 *   5 小結      燃燒三條件；濕抹布隔絕空氣，少一個火就熄
 * 不畫手；畫布文字 ≥ 22px；文字全部 [zh, en] 配對。
 */
(function () {
  'use strict';
  window.DenAnim = window.DenAnim || {};

  // ───────── 共用小工具（每支檔各帶一份，檔案可獨立載入） ─────────
  const W = 1000, H = 600;
  const FONT = '"Noto Sans TC", "PingFang TC", sans-serif';
  const C = {
    bg: '#1c3d34', deep: '#11261f', white: '#f2ecd9', yel: '#fde047', cyan: '#55e9ff',
    green: '#4ade80', orange: '#fb923c', pink: '#f472b6', dim: 'rgba(242,236,217,0.45)'
  };
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (x) => x * x * (3 - 2 * x);
  const lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1);   // 線性 0→1
  const seg = (t, a, b) => ease(lin(t, a, b));               // 緩動 0→1

  let ctx = null, LANG = 'zh', TEXTS = [];
  const tr = (p) => (typeof p === 'string' ? p : (LANG === 'en' ? p[1] : p[0]));
  const fnt = (size, weight) => `${weight || 700} ${size}px ${FONT}`;

  // 畫一行字並記錄包圍盒（自測用）。o：{ align, a(透明度), w(字重) }。座標一律是畫布邏輯座標，不在旋轉座標系內呼叫。
  function txt(p, x, y, size, color, o) {
    o = o || {};
    const a = o.a === undefined ? 1 : o.a;
    if (a <= 0.02) return 0;
    const s = tr(p), align = o.align || 'center';
    ctx.save();
    ctx.globalAlpha = a; ctx.font = fnt(size, o.w); ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(s, x, y);
    const w = ctx.measureText(s).width;
    ctx.restore();
    const left = align === 'center' ? x - w / 2 : (align === 'right' ? x - w : x);
    TEXTS.push({ s, size, x: left, y: y - size * 0.55, w, h: size * 1.1, a });
    return w;
  }
  function wrap(s, size, maxW, weight) {
    ctx.save(); ctx.font = fnt(size, weight);
    const out = [];
    s.split('\n').forEach((part) => {
      const toks = LANG === 'en' ? part.split(/(?<= )/) : (part.match(/[\x21-\x7e]+ ?|[^\x21-\x7e]/g) || []);
      let line = '';
      toks.forEach((tk) => {
        const noHead = /^[，。；：！？、）」]/.test(tk);
        if (line && !noHead && ctx.measureText((line + tk).trimEnd()).width > maxW) { out.push(line.trimEnd()); line = tk; }
        else line += tk;
      });
      if (line.trim()) out.push(line.trimEnd());
    });
    ctx.restore();
    return out;
  }
  // 多行字：o.align 預設置中；y 為第一行中心；回傳行數
  function para(p, x, y, size, color, maxW, o) {
    const lines = wrap(tr(p), size, maxW, o && o.w);
    lines.forEach((ln, i) => txt(ln, x, y + i * size * 1.4, size, color, o));
    return lines.length;
  }
  function title(p) { txt(p, W / 2, 64, 30, C.yel, { w: 900 }); }
  function caption(p) {
    ctx.save(); ctx.fillStyle = C.deep; ctx.globalAlpha = 0.85; rrect(20, 478, W - 40, 114, 14); ctx.fill(); ctx.restore();
    let lines = wrap(tr(p), 24, 910);
    if (lines.length > 1) {                          // 多行時把各行長度拉平，避免最後一行只剩幾個字
      for (let mw = 880; mw >= 460; mw -= 30) { const l2 = wrap(tr(p), 24, mw); if (l2.length !== lines.length) break; lines = l2; }
    }
    const y0 = 535 - (lines.length - 1) * 17;
    lines.forEach((ln, i) => txt(ln, W / 2, y0 + i * 34, 24, C.white));
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function line(x1, y1, x2, y2, color, lw, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw || 3; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function arrow(x1, y1, x2, y2, color, lw, dash) {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 6 + (lw || 3) * 2.2;
    line(x1, y1, x2 - Math.cos(a) * h * 0.6, y2 - Math.sin(a) * h * 0.6, color, lw, dash);
    ctx.save(); ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * h, y2 - Math.sin(a - 0.45) * h);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * h, y2 - Math.sin(a + 0.45) * h);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // 打叉／打勾（k：0→1 逐筆畫出）
  function cross(x, y, r, k, color, lw) {
    if (k <= 0) return;
    const k1 = clamp(k * 2, 0, 1), k2 = clamp(k * 2 - 1, 0, 1);
    line(x - r, y - r, x - r + 2 * r * k1, y - r + 2 * r * k1, color || C.pink, lw || 7);
    if (k2 > 0) line(x + r, y - r, x + r - 2 * r * k2, y - r + 2 * r * k2, color || C.pink, lw || 7);
  }
  function check(x, y, r, k, color, lw) {
    if (k <= 0) return;
    const k1 = clamp(k * 2.5, 0, 1), k2 = clamp((k * 2.5 - 1) / 1.5, 0, 1);
    line(x - r, y, x - r + r * 0.7 * k1, y + r * 0.7 * k1, color || C.green, lw || 7);
    if (k2 > 0) line(x - r * 0.3, y + r * 0.7, x - r * 0.3 + r * 1.3 * k2, y + r * 0.7 - r * 1.5 * k2, color || C.green, lw || 7);
  }

  // ───────── t1 打翻的酒精燈 ─────────
  const KEY = 't1';
  const TY = 436;                                   // 桌面 y
  const ALC = 'rgba(160,236,255,0.75)', WATER = '#38bdf8', CLOTH = '#8fb4c4', WOOD = '#b0793f';

  function table() {
    ctx.fillStyle = '#16302a'; ctx.fillRect(0, TY, W, 42);
    line(0, TY, W, TY, 'rgba(242,236,217,0.55)', 3);
  }
  function flame(x, y, h, t, seed) {
    if (h < 3) return;
    const hh = h * (1 + 0.12 * Math.sin(t * 13 + seed) + 0.08 * Math.sin(t * 23 + seed * 2));
    const sw = Math.sin(t * 7 + seed) * h * 0.08;
    const shape = (w, hh2, col) => {
      ctx.beginPath(); ctx.moveTo(x - w, y);
      ctx.bezierCurveTo(x - w, y - hh2 * 0.5, x + sw - w * 0.2, y - hh2 * 0.7, x + sw, y - hh2);
      ctx.bezierCurveTo(x + sw + w * 0.2, y - hh2 * 0.7, x + w, y - hh2 * 0.5, x + w, y);
      ctx.quadraticCurveTo(x, y + w * 0.6, x - w, y); ctx.fillStyle = col; ctx.fill();
    };
    ctx.save(); ctx.globalAlpha = 0.92;
    shape(h * 0.28, hh, C.orange); shape(h * 0.15, hh * 0.6, C.yel);
    ctx.restore();
  }
  function fireRow(x1, x2, y, h, t) {
    if (h < 3 || x2 - x1 < 10) return;
    const n = Math.max(1, Math.round((x2 - x1) / 36));
    for (let i = 0; i <= n; i++) flame(x1 + (x2 - x1) * i / n, y, h * (0.72 + 0.28 * Math.sin(i * 2.1 + 1)), t, i * 1.7);
  }
  // 酒精燈：底部中心 (x,y)，繞右下角倒下 ang（順時針）；level 酒精量 0～1。回傳燈芯頂端的畫布座標
  function lamp(x, y, ang, level) {
    const px = x + 55, py = y;
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.translate(-55, 0);
    const body = () => {
      ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0);
      ctx.quadraticCurveTo(62, -4, 56, -26); ctx.quadraticCurveTo(48, -58, 20, -70);
      ctx.lineTo(-20, -70); ctx.quadraticCurveTo(-48, -58, -56, -26); ctx.quadraticCurveTo(-62, -4, -50, 0); ctx.closePath();
    };
    ctx.save(); body(); ctx.clip();
    ctx.translate(0, -35); ctx.rotate(-ang);
    ctx.fillStyle = ALC; ctx.globalAlpha = 0.6; ctx.fillRect(-200, lerp(48, -12, level), 400, 400);
    ctx.restore();
    body(); ctx.fillStyle = 'rgba(242,236,217,0.10)'; ctx.fill(); ctx.strokeStyle = C.white; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.fillStyle = 'rgba(242,236,217,0.25)'; ctx.fillRect(-18, -84, 36, 14); ctx.strokeRect(-18, -84, 36, 14);
    ctx.fillStyle = C.white; ctx.fillRect(-12, -92, 24, 8); ctx.fillRect(-5, -104, 10, 12);
    ctx.restore();
    const rx = -55, ry = -104, c = Math.cos(ang), s = Math.sin(ang);
    return { x: px + rx * c - ry * s, y: py + rx * s + ry * c };
  }
  function layer(x1, x2, yTop, h, col, a) {
    if (h <= 0.5 || x2 <= x1) return;
    ctx.save(); ctx.globalAlpha = a === undefined ? 1 : a; ctx.fillStyle = col;
    rrect(x1, yTop, x2 - x1, h, Math.min(6, h / 2)); ctx.fill(); ctx.restore();
  }
  function mark(ok, x, y, k) { if (ok) check(x, y, 12, k, C.green, 6); else cross(x, y, 11, k, C.pink, 6); }

  function beaker(x, y, tilt, level, a) {         // 原點＝左上杯口（倒水點），逆時針傾斜 tilt
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(-tilt);
    const body = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, 104); ctx.quadraticCurveTo(4, 112, 14, 112); ctx.lineTo(80, 112); ctx.quadraticCurveTo(90, 112, 90, 104); ctx.lineTo(92, 0); };
    ctx.save(); body(); ctx.closePath(); ctx.clip();
    ctx.translate(46, 56); ctx.rotate(tilt);
    ctx.fillStyle = WATER; ctx.globalAlpha = a * 0.7; ctx.fillRect(-200, lerp(70, -30, level), 400, 400);
    ctx.restore();
    body(); ctx.strokeStyle = C.white; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.stroke();
    for (let i = 1; i <= 3; i++) line(60, 112 - i * 24, 78, 112 - i * 24, 'rgba(242,236,217,0.6)', 2);
    ctx.restore();
  }
  function smoke(x, y, age, a) {
    if (age <= 0 || a <= 0) return;
    const rise = (age % 3) * 34, fa = a * (1 - (age % 3) / 3) * 0.5;
    ctx.save(); ctx.strokeStyle = C.white; ctx.globalAlpha = fa; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) { const yy = y - rise - k * 5, xx = x + Math.sin(k * 0.8 + age * 2) * 7; if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
    ctx.stroke(); ctx.restore();
  }
  function clothShape(cx, cy, w, t) {              // 空中的濕抹布（底邊微微飄動）
    ctx.beginPath(); ctx.moveTo(cx - w / 2, cy - 13);
    ctx.lineTo(cx + w / 2, cy - 13); ctx.lineTo(cx + w / 2, cy + 11);
    for (let k = 10; k >= 0; k--) ctx.lineTo(cx - w / 2 + w * k / 10, cy + 11 + Math.sin(k * 1.3 + t * 5) * 4);
    ctx.closePath(); ctx.fillStyle = CLOTH; ctx.fill(); ctx.strokeStyle = C.white; ctx.lineWidth = 2.5; ctx.stroke();
  }

  const STEPS = [
    { b: ['打翻起火', 'Spill'], dur: 10,
      title: ['酒精燈打翻了！', 'The alcohol lamp tips over!'],
      cap: ['酒精燈被碰倒，酒精流到桌面上，一碰到火焰就燒了起來。', 'The lamp is knocked over. Alcohol spills onto the bench and catches fire.'],
      draw(tl) {
        table();
        const fall = seg(tl, 1.6, 2.5);
        const ang = fall * Math.PI / 2 + (tl < 1.6 ? Math.sin(tl * 9) * 0.06 * lin(tl, 0.5, 1.6) : 0);
        const spill = seg(tl, 2.7, 6.0), fire = seg(tl, 4.4, 7.4);
        const xR = lerp(462, 760, spill);
        if (spill > 0) layer(440, xR, TY - 7, 9, ALC);
        if (fall >= 1 && tl < 6.6) { ctx.save(); ctx.strokeStyle = ALC; ctx.lineWidth = 7 * (1 - seg(tl, 5.6, 6.6)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(461, 386); ctx.quadraticCurveTo(470, 400, 468, TY - 4); ctx.stroke(); ctx.restore(); }
        fireRow(455, Math.min(xR - 8, lerp(455, 752, fire)), TY - 6, 78 * fire, tl);
        const wk = lamp(300, TY, ang, lerp(0.6, 0.2, spill));
        flame(wk.x, wk.y + 2, 46, tl, 0.3);
        txt(['酒精燈', 'Alcohol lamp'], 300, 250, 24, C.white, { a: 1 - seg(tl, 1.1, 1.6) });
        const a1 = seg(tl, 3.0, 3.6) * (1 - seg(tl, 4.4, 4.9));
        txt(['酒精流出來', 'Alcohol spills out'], 610, 250, 26, C.cyan, { a: a1 });
        if (a1 > 0.02) { ctx.save(); ctx.globalAlpha = a1; arrow(610, 275, 610, 410, C.cyan, 4); ctx.restore(); }
        txt(['起火燃燒！', 'It catches fire!'], 610, 250, 30, C.orange, { a: seg(tl, 5.2, 5.9), w: 900 });
      } },
    { b: ['潑水錯誤', 'Water ✗'], dur: 10,
      title: ['錯誤：用水潑', 'Wrong: pouring water'],
      cap: ['水把燃燒的酒精沖開，火勢跟著擴散；水流到哪裡，火就燒到哪裡。', 'The water pushes the burning alcohol apart and the fire spreads. Wherever the water flows, the fire follows.'],
      draw(tl) {
        table();
        const spread = seg(tl, 3.0, 8.2), wh = 22 * seg(tl, 3.0, 6.0);
        const xL = lerp(440, 402, spread), xR = lerp(760, 955, spread);
        layer(xL, xR, TY - wh, wh + 2, WATER, 0.85);
        layer(xL, xR, TY - wh - 8, 9, ALC);
        fireRow(xL + 14, xR - 12, TY - wh - 7, 78 + 34 * spread, tl);
        const wk = lamp(300, TY, Math.PI / 2, 0.2);
        flame(wk.x, wk.y + 2, 46, tl, 0.3);
        const inn = seg(tl, 0.4, 1.6), out = seg(tl, 5.9, 7.2);
        const tilt = (seg(tl, 1.6, 2.6) - seg(tl, 5.3, 5.9)) * 1.3;
        const bx = lerp(900, 700, inn) + out * 240, by = lerp(110, 222, inn) - out * 150;
        if (tl > 2.4 && tl < 5.6) { ctx.save(); ctx.strokeStyle = WATER; ctx.lineCap = 'round'; ctx.lineWidth = 9 * seg(tl, 2.4, 2.8) * (1 - seg(tl, 5.2, 5.6)); ctx.beginPath(); ctx.moveTo(bx, by + 2); ctx.quadraticCurveTo(bx - 8, by + 60, bx - 6, TY - wh - 4); ctx.stroke(); ctx.restore(); }
        beaker(bx, by, tilt, lerp(0.75, 0.1, seg(tl, 2.4, 5.4)), 1 - out);
        const a0 = seg(tl, 0.5, 1.2);
        mark(false, 56, 120, a0); txt(['不可以潑水！', 'Do NOT pour water!'], 84, 120, 28, C.pink, { align: 'left', a: a0, w: 900 });
        para(['水把燃燒的酒精沖開', 'Water pushes the burning alcohol apart'], 40, 172, 24, C.white, 520, { align: 'left', a: seg(tl, 5.0, 5.8) });
        txt(['火隨著液面擴散！', 'The fire spreads with it!'], 40, 252, 26, C.orange, { align: 'left', a: seg(tl, 7.0, 7.8), w: 900 });
        const al = seg(tl, 3.6, 4.4);
        if (al > 0.02) {
          ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = ALC; ctx.fillRect(40, 293, 26, 14); ctx.fillStyle = WATER; ctx.fillRect(190, 293, 26, 14); ctx.restore();
          txt(['酒精', 'Alcohol'], 74, 300, 22, C.white, { align: 'left', a: al }); txt(['水', 'Water'], 224, 300, 22, C.white, { align: 'left', a: al });
        }
      } },
    { b: ['濕布蓋住', 'Wet cloth'], dur: 10,
      title: ['正確：濕抹布蓋住', 'Right: cover with a wet cloth'],
      cap: ['用濕抹布整個蓋住，空氣進不去，火缺少氧氣就熄了。', 'Cover it completely with a wet cloth. No air gets in, so the fire runs out of oxygen and goes out.'],
      draw(tl) {
        table();
        const drop = seg(tl, 1.0, 3.3), out = 1 - seg(tl, 3.0, 3.9);
        layer(440, 760, TY - 7, 9, ALC);
        fireRow(455, 752, TY - 6, 78 * out, tl);
        const wk = lamp(300, TY, Math.PI / 2, 0.2);
        flame(wk.x, wk.y + 2, 46 * out, tl, 0.3);
        for (let i = 0; i < 4; i++) smoke(470 + i * 88, 404 - (i === 0 ? 40 : 0), tl - 4.0 - i * 0.4, 1 - seg(tl, 7.6, 9.6));
        if (drop < 1) {
          const cy = lerp(150, 392, drop);
          clothShape(590, cy, 400, tl);
          for (let i = 0; i < 3; i++) { ctx.fillStyle = WATER; ctx.beginPath(); ctx.arc(470 + i * 120, cy + 22 + ((tl * 60 + i * 20) % 40), 3.5, 0, TAU); ctx.fill(); }
          txt(['濕抹布', 'Wet cloth'], 590, cy - 36, 24, C.white, { a: seg(tl, 0.4, 0.9) * (1 - seg(tl, 2.2, 2.8)) });
        } else {
          ctx.beginPath(); ctx.moveTo(384, TY); ctx.quadraticCurveTo(392, 376, 412, 370); ctx.lineTo(474, 364);
          ctx.quadraticCurveTo(500, 366, 516, 404); ctx.lineTo(776, 404); ctx.quadraticCurveTo(796, 408, 802, TY); ctx.closePath();
          ctx.fillStyle = CLOTH; ctx.fill(); ctx.strokeStyle = C.white; ctx.lineWidth = 2.5; ctx.stroke();
          for (let i = 0; i < 5; i++) line(540 + i * 50, 414, 556 + i * 50, 426, 'rgba(17,38,31,0.35)', 3);
        }
        const aa = seg(tl, 5.0, 5.8);
        if (aa > 0.02) {
          ctx.save(); ctx.globalAlpha = aa;
          for (let i = 0; i < 3; i++) { const yy = 392 - 16 * Math.abs(Math.sin(tl * 3 + i)); arrow(600 + i * 80, yy - 70, 600 + i * 80, yy, C.cyan, 4); cross(600 + i * 80, 398, 0, 0); }
          ctx.restore();
          txt(['空氣進不去', 'Air cannot get in'], 680, 270, 24, C.cyan, { a: aa });
        }
        const a0 = seg(tl, 0.5, 1.2);
        mark(true, 56, 120, a0); txt(['用濕抹布蓋住', 'Use a wet cloth'], 84, 120, 28, C.green, { align: 'left', a: a0, w: 900 });
        para(['隔絕空氣 → 火熄滅', 'No air → the fire goes out'], 40, 172, 24, C.white, 330, { align: 'left', a: seg(tl, 4.6, 5.4) });
      } },
    { b: ['試管加熱', 'Test tube'], dur: 10,
      title: ['試管加熱的姿勢', 'How to heat a test tube'],
      cap: ['用試管夾夾住，試管傾斜約 45°，管口朝向沒有人的方向，避免液體噴出傷人。', 'Hold the tube with a holder, tilt it about 45°, and point the mouth away from everyone in case hot liquid spurts out.'],
      draw(tl) {
        table();
        const wk = lamp(300, TY, 0, 0.6);
        flame(wk.x, wk.y + 2, 48, tl, 0.3);
        const ang = seg(tl, 1.2, 3.6) * Math.PI / 4, L = 160;
        const dx = Math.sin(ang), dy = -Math.cos(ang);
        const sw = tl > 6 ? Math.sin((tl - 6) * 2.4) * 9 * seg(tl, 6, 6.8) : 0;
        const bx = 300 + dx * sw, by = 283 + dy * sw;
        const ah = seg(tl, 3.5, 4.1);
        if (ah > 0.02) {
          ctx.save(); ctx.globalAlpha = ah; line(300, 283, 500, 283, C.yel, 3, [8, 8]);
          ctx.strokeStyle = C.yel; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(300, 283, 74, -(Math.PI / 2 - ang), 0); ctx.stroke(); ctx.restore();
          txt(['傾斜約 45°', 'Tilt about 45°'], 520, 246, 26, C.yel, { align: 'left', a: ah, w: 900 });
        }
        ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
        const tube = () => { ctx.beginPath(); ctx.moveTo(-15, -L); ctx.lineTo(-15, -15); ctx.arc(0, -15, 15, Math.PI, 0, true); ctx.lineTo(15, -L); };
        ctx.save(); tube(); ctx.closePath(); ctx.clip(); ctx.rotate(-ang);
        ctx.fillStyle = WATER; ctx.globalAlpha = 0.7; ctx.fillRect(-200, -46, 400, 200); ctx.restore();
        if (tl > 4) for (let i = 0; i < 4; i++) { ctx.fillStyle = C.white; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(Math.sin(i * 2.3) * 7, -8 - ((tl * 26 + i * 11) % 30), 2.6, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
        tube(); ctx.strokeStyle = C.white; ctx.lineWidth = 3.5; ctx.stroke();
        line(-19, -L, 19, -L, C.white, 4);
        ctx.fillStyle = WOOD; rrect(-118, -121, 100, 12, 5); ctx.fill(); rrect(-22, -124, 44, 18, 5); ctx.fill();
        ctx.restore();
        const am = seg(tl, 4.4, 5.2);
        if (am > 0.02) {
          ctx.save(); ctx.globalAlpha = am;
          arrow(bx + dx * (L + 14), by + dy * (L + 14), bx + dx * (L + 14 + 74 * am), by + dy * (L + 14 + 74 * am), C.cyan, 4, [9, 7]); ctx.restore();
          txt(['管口指向無人處', 'Mouth points away from people'], 500, 108, 24, C.cyan, { align: 'left', a: am });
        }
        const a2 = seg(tl, 6.2, 7.0);
        para(['來回移動，受熱才均勻', 'Move it gently so it heats evenly'], 560, 340, 24, C.white, 400, { align: 'left', a: a2 });
      } },
    { b: ['小結', 'Summary'], dur: 10,
      title: ['小結：切斷燃燒條件', 'Summary: break the fire triangle'],
      cap: ['燃燒要可燃物、助燃物、溫度達燃點三者同時具備；濕抹布隔絕空氣，少了一個，火就熄。', 'Burning needs fuel, oxygen and enough heat together. A wet cloth shuts out the air — take one away and the fire goes out.'],
      draw(tl) {
        const P = [[500, 150], [300, 388], [700, 388]];
        const cut = seg(tl, 4.0, 5.0), out = 1 - seg(tl, 5.0, 6.4);
        const edge = (a, b, k, broken) => {
          if (k <= 0) return;
          const x2 = lerp(P[a][0], P[b][0], k), y2 = lerp(P[a][1], P[b][1], k);
          if (broken > 0.5) line(P[a][0], P[a][1], x2, y2, 'rgba(244,114,182,0.6)', 4, [6, 12]); else line(P[a][0], P[a][1], x2, y2, C.white, 5);
        };
        edge(0, 1, seg(tl, 0.6, 1.4), cut); edge(1, 2, seg(tl, 1.2, 2.0), cut); edge(2, 0, seg(tl, 1.8, 2.6), 0);
        const cols = [C.orange, C.cyan, C.pink], t0 = [0.5, 1.2, 1.8];
        const lab = [['可燃物（酒精）', 'Fuel (alcohol)'], ['助燃物（空氣中的氧）', 'Oxygen (in the air)'], ['溫度達燃點', 'Heat (ignition point)']];
        P.forEach((p, i) => {
          const k = seg(tl, t0[i], t0[i] + 0.5); if (k <= 0) return;
          ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(p[0], p[1], 15 * k, 0, TAU); ctx.fill(); ctx.restore();
          if (i === 0) txt(lab[0], 528, 150, 24, cols[0], { align: 'left', a: k }); else txt(lab[i], p[0], 436, 24, cols[i], { a: k });
        });
        flame(500, 345, 96 * seg(tl, 2.4, 3.2) * out, tl, 0.5);
        if (out < 0.2) for (let i = 0; i < 2; i++) smoke(486 + i * 28, 330, tl - 6.2 - i * 0.5, 1 - seg(tl, 8.5, 9.8));
        const cv = seg(tl, 3.2, 4.2);
        if (cv > 0) {
          const cx = lerp(120, 300, cv), cy = lerp(200, 384, cv);
          ctx.beginPath(); ctx.moveTo(cx - 52, cy + 18); ctx.quadraticCurveTo(cx - 46, cy - 24, cx, cy - 26); ctx.quadraticCurveTo(cx + 46, cy - 24, cx + 52, cy + 18); ctx.closePath();
          ctx.fillStyle = CLOTH; ctx.fill(); ctx.strokeStyle = C.white; ctx.lineWidth = 2.5; ctx.stroke();
          para(['濕抹布\n隔絕空氣', 'Wet cloth\nblocks the air'], 40, 300, 24, C.white, 200, { align: 'left', a: seg(tl, 4.2, 4.9) });
        }
        txt(['火熄滅', 'Fire out'], 500, 300, 28, C.green, { a: seg(tl, 6.6, 7.3), w: 900 });
      } }
  ];

  // ───────── 播放引擎（畫面＝時間 t 的純函式；RAF 只有一條） ─────────
  const STARTS = []; let TOTAL = 0;
  STEPS.forEach((s) => { STARTS.push(TOTAL); TOTAL += s.dur; });
  const S = { canvas: null, ctx: null, t: 0, step: -1, raf: 0, last: 0, paused: false, stopAfter: true, ended: false, active: false };
  function stepAt(t) { let i = 0; while (i + 1 < STARTS.length && t >= STARTS[i + 1]) i++; return i; }

  function render() {
    if (!S.ctx) return;
    ctx = S.ctx;
    const cv = S.canvas;
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.globalAlpha = 1; ctx.setLineDash([]);
    TEXTS = [];
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const t = clamp(S.t, 0, TOTAL);
    const i = stepAt(t), st = STEPS[i], tl = t - STARTS[i];
    ctx.save(); st.draw(tl, st.dur); ctx.restore();
    const fade = clamp(1 - tl / 0.35, 0, 1);              // 每步開頭淡入
    if (fade > 0) {
      ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = C.bg; ctx.fillRect(0, 30, W, H - 30); ctx.restore();
      TEXTS = TEXTS.filter(() => fade < 0.5);
    }
    title(st.title);
    caption(typeof st.cap === 'function' ? st.cap(tl) : st.cap);
    if (window.AnimBar) window.AnimBar.draw(ctx, W, STARTS, TOTAL, t);
    if (i !== S.step) { S.step = i; if (typeof api.onStep === 'function') api.onStep(i); }
  }
  function frame(ts) {
    S.raf = 0;
    if (!S.active || S.paused || document.hidden) return;
    const k = stepAt(S.t);
    if (S.last) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const end = S.stopAfter && k + 1 < STARTS.length ? STARTS[k + 1] : TOTAL;
    if (S.t >= end) {                                     // 播完這一步（或整段）：停在最後一幀
      S.t = end - 1e-3; render();
      if (end >= TOTAL && !S.ended) { S.ended = true; if (typeof api.onEnd === 'function') api.onEnd(); }
      return;
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }
  function run() {
    if (!S.active || S.raf || S.paused || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function halt() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) halt(); else run(); });

  const api = {
    onStep: null, onEnd: null,
    start(canvas, lang) {
      halt();
      S.canvas = canvas; S.ctx = canvas.getContext('2d');
      LANG = lang === 'en' ? 'en' : 'zh';
      S.t = 0; S.step = -1; S.ended = false; S.paused = false; S.active = true;
      render(); run();
    },
    stop() { halt(); S.active = false; },
    setLang(lang) { LANG = lang === 'en' ? 'en' : 'zh'; render(); run(); },
    goStep(i, stopAfter) {
      i = clamp(i | 0, 0, STEPS.length - 1);
      if (stopAfter !== undefined) S.stopAfter = !!stopAfter;
      halt();
      S.t = STARTS[i] + 1e-4; S.step = -1; S.ended = false; S.active = !!S.ctx;
      render(); run();
    },
    setStopAfter(b) { S.stopAfter = !!b; run(); },
    pause(b) { S.paused = !!b; if (S.paused) halt(); else run(); },
    info() { return { steps: STEPS.map((s) => ({ zh: s.b[0], en: s.b[1] })), starts: STARTS.slice(), total: TOTAL }; },
    _frameAt(t) { S.t = clamp(t, 0, TOTAL); render(); return TOTAL; },
    _texts() { return TEXTS.map((o) => Object.assign({}, o)); },
    _state() { return { t: S.t, step: S.step, running: !!S.raf, paused: S.paused, stopAfter: S.stopAfter, ended: S.ended, lang: LANG }; }
  };
  window.DenAnim[KEY] = api;
})();

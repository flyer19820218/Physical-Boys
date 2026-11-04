/* magnetism_1_mag_1104_v1.js — 「磁化與保存」分頁動畫（#magCanvas，1000×600）
 *
 * 契約：window.MagAnim.mag = { activate(sceneId), deactivate(), relang() }
 * 依賴頁面現成的：tr、C、TAU、clear、label、line、drawMagnet（直接呼叫，不複製）。
 * 畫布不綁任何事件；唯一控制是 #steps-mag 裡的步驟鈕（每場景 ≤5 個）。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * mag-process 磁性物質與磁化，共 40.0 s
 *   1 凌亂   7.0 s  鐵釘碰迴紋針→吸不起來；放大看：磁疇方向凌亂、互相抵消（現象＋疑問）
 *   2 磁化   9.0 s  磁鐵靠近（外加磁場）→磁疇由近到遠轉成同一方向→鐵釘兩端出現 S、N，吸起迴紋針
 *   3 撞擊   8.0 s  磁鐵移開仍吸著；鐵鎚一敲→磁疇再度凌亂→迴紋針掉下（驗證）
 *   4 加熱   9.0 s  重新磁化後用火加熱→磁疇越抖越亂→迴紋針掉下（驗證）
 *   5 結論   7.0 s  凌亂＝沒磁性 ⇄ 整齊＝有磁性；磁性物質：鐵、鈷、鎳及其合金（含停留）
 * mag-store 磁鐵的保存，共 40.0 s
 *   1 磁化   9.0 s  軟鐵與鋼同時靠近磁鐵：軟鐵一下就磁化，鋼很慢才磁化
 *   2 移開   8.0 s  磁鐵移開：軟鐵磁疇馬上亂掉、迴紋針掉下；鋼仍排列整齊、一直吸著
 *   3 用途   7.0 s  軟鐵→電磁鐵鐵心（通電才有磁性）；鋼→永久磁鐵
 *   4 長條   8.0 s  兩支長條磁鐵 N、S 反向並排，兩端吸上軟鐵片，磁力線形成封閉迴路
 *   5 U形    8.0 s  U 形磁鐵兩極間吸一塊軟鐵片，一樣形成封閉迴路（收束，含停留）
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.MagAnim = window.MagAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const GREEN = C.green, PINK = C.pink, YELLOW = C.yellow, CYAN = C.cyan, ORANGE = C.orange;
  const CHALK = '#f2ecd9';

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const angLerp = (a, b, k) => { const d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * k; };
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function randSet(n, seed) { const r = rng(seed); return Array.from({ length: n }, () => r() * TAU); }

  function font(size) { return `900 ${size}px ${FONT}`; }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function wrapLabel(ctx, s, x, y, maxW, color, size, lh, align = 'left') {
    const isEn = /[A-Za-z]/.test(s) && !/[一-鿿]/.test(s);
    const units = isEn ? s.split(' ') : Array.from(s);
    const lines = []; let cur = '';
    for (const u of units) {
      const test = cur ? (isEn ? cur + ' ' + u : cur + u) : u;
      if (textW(ctx, test, size) > maxW && cur) { lines.push(cur); cur = u; } else cur = test;
    }
    if (cur) lines.push(cur);
    lines.forEach((ln, i) => label(ctx, ln, x, y + i * lh, color, align, size));
    return lines.length;
  }
  function arrow(ctx, x1, y1, x2, y2, color, w = 6, head = 18) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return;
    const h = Math.min(head, L * 0.6);
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.8, y2 - Math.sin(a) * h * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * h, y2 - Math.sin(a - 0.45) * h);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * h, y2 - Math.sin(a + 0.45) * h);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

  // 一個磁疇＝小磁鐵：+x 方向是紅色 N 半、-x 是藍色 S 半
  function domain(ctx, x, y, ang, len = 40, th = 16) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = C.poleS; ctx.fillRect(-len / 2, -th / 2, len / 2, th);
    ctx.fillStyle = C.poleN; ctx.fillRect(0, -th / 2, len / 2, th);
    ctx.beginPath(); ctx.moveTo(len / 2, -th / 2); ctx.lineTo(len / 2 + 7, 0); ctx.lineTo(len / 2, th / 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.7)'; ctx.lineWidth = 1.2; ctx.strokeRect(-len / 2, -th / 2, len, th);
    ctx.restore();
  }
  // 鐵塊＋格狀磁疇
  function ironBlock(ctx, x, y, w, h, cols, rows, angs, fill, tint) {
    ctx.save();
    rrect(ctx, x, y, w, h, 10); ctx.fillStyle = fill; ctx.fill();
    if (tint > 0) { ctx.globalAlpha = tint; ctx.fillStyle = ORANGE; rrect(ctx, x, y, w, h, 10); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = 'rgba(242,236,217,0.12)'; ctx.lineWidth = 1.5;
    for (let c = 1; c < cols; c++) { ctx.beginPath(); ctx.moveTo(x + c * w / cols, y + 4); ctx.lineTo(x + c * w / cols, y + h - 4); ctx.stroke(); }
    for (let r = 1; r < rows; r++) { ctx.beginPath(); ctx.moveTo(x + 4, y + r * h / rows); ctx.lineTo(x + w - 4, y + r * h / rows); ctx.stroke(); }
    ctx.strokeStyle = '#a9b4b0'; ctx.lineWidth = 3; rrect(ctx, x, y, w, h, 10); ctx.stroke();
    ctx.restore();
    const cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      domain(ctx, x + (c + 0.5) * cw, y + (r + 0.5) * ch, angs[r * cols + c], Math.min(40, cw * 0.72), 15);
    }
  }
  // 迴紋針（頂端在 y）
  function clip(ctx, x, y, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(4, 40); ctx.lineTo(4, 10); ctx.arc(-1, 10, 5, 0, Math.PI, true); ctx.lineTo(-6, 44);
    ctx.arc(1, 44, 7, Math.PI, 0, true); ctx.lineTo(8, 6); ctx.arc(0, 6, 8, 0, Math.PI, true); ctx.lineTo(-8, 36);
    ctx.stroke(); ctx.restore();
  }
  // 直立磁鐵：上 S（藍）、下 N（紅）
  function vMagnet(ctx, cx, top, w, h, letters = true) {
    ctx.save();
    ctx.fillStyle = C.poleS; ctx.fillRect(cx - w / 2, top, w, h / 2);
    ctx.fillStyle = C.poleN; ctx.fillRect(cx - w / 2, top + h / 2, w, h / 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(cx - w / 2, top, w, h);
    ctx.restore();
    if (!letters) return;
    label(ctx, 'S', cx, top + h / 4, '#fff', 'center', 30);
    label(ctx, 'N', cx, top + h * 0.75, '#fff', 'center', 30);
  }
  function legendDomain(ctx, x, y) {
    domain(ctx, x + 26, y, 0, 44, 18);
    label(ctx, tr('磁疇＝小磁鐵（紅 N、藍 S）', 'Domain = tiny magnet (red N, blue S)'), x + 66, y, CHALK, 'left', 22);
  }
  function flame(ctx, x, base, hgt, t, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const f = 1 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 29);
    [[ORANGE, 30, 1], [YELLOW, 16, 0.62]].forEach(([col, wd, hk]) => {
      const hh = hgt * hk * f;
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(x - wd, base);
      ctx.bezierCurveTo(x - wd, base - hh * 0.5, x - wd * 0.2, base - hh * 0.7, x + 4 * Math.sin(t * 11), base - hh);
      ctx.bezierCurveTo(x + wd * 0.2, base - hh * 0.7, x + wd, base - hh * 0.5, x + wd, base);
      ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }

  // ═════════ 場景 1：磁化（mag-process） ═════════
  const PB = { x: 330, y: 210, w: 440, h: 140, cols: 8, rows: 3 };
  const ND = PB.cols * PB.rows;
  const RC = randSet(6, 91);
  const R0 = randSet(ND, 11), R1 = randSet(ND, 29), R2 = randSet(ND, 53);
  const CLIPX = [352, 738, 768], TABLE = 500, CLIP_REST = TABLE - 52, CLIP_HANG = PB.y + PB.h + 2;
  const MAG = { w: 220, h: 70, rest: 60, out: -260 };
  const wob = (t, i, amp) => amp * Math.sin(t * 1.7 + i * 1.3) + amp * 0.5 * Math.sin(t * 3.1 + i * 2.1);

  function procState(step, t) {
    const s = { dy: 0, dx: 0, magX: null, angs: [], poles: 0, field: 0, clipK: [0, 0, 0], hammer: null, flame: 0, tint: 0, msg: '', mc: CYAN };
    const col = i => i % PB.cols;
    if (step === 0) {
      s.dy = 94 * easeIO(seg(t, 1.0, 2.2)) * (1 - easeIO(seg(t, 3.0, 4.2)));
      for (let i = 0; i < ND; i++) s.angs.push(R0[i] + wob(t, i, 0.14));
      if (t < 1.0) s.msg = tr('鐵釘能吸起迴紋針嗎？', 'Can the nail pick up paper clips?');
      else if (t < 4.5) { s.msg = t < 2.4 ? tr('碰到迴紋針了……', 'It touches the clips...') : tr('吸不起來！', 'It cannot pick them up!'); s.mc = t < 2.4 ? CYAN : PINK; }
      else { s.msg = tr('磁疇方向凌亂，磁力互相抵消', 'Domains point every way and cancel out'); s.mc = PINK; }
    } else if (step === 1) {
      s.magX = lerp(MAG.out, MAG.rest, easeIO(seg(t, 0, 1.8)));
      s.field = easeIO(seg(t, 1.2, 1.8));
      for (let i = 0; i < ND; i++) {
        const k = easeIO(seg(t, 1.6 + 0.25 * col(i) + 0.07 * Math.floor(i / PB.cols), 2.5 + 0.25 * col(i) + 0.07 * Math.floor(i / PB.cols)));
        s.angs.push(angLerp(R0[i] + wob(t, i, 0.14), wob(t, i, 0.04), k));
      }
      s.poles = easeIO(seg(t, 4.3, 4.9));
      s.clipK = CLIPX.map((_, j) => Math.pow(seg(t, 5.0 + 0.25 * j, 5.4 + 0.25 * j), 2));
      if (t < 1.8) s.msg = tr('拿磁鐵靠近……', 'Bring a magnet close...');
      else if (t < 5.0) s.msg = tr('磁疇一個個轉向外加磁場的方向', 'Domains turn one by one to follow the field');
      else { s.msg = tr('排列整齊：鐵釘變成磁鐵，吸起迴紋針！', 'Lined up: the nail is a magnet and lifts clips!'); s.mc = GREEN; }
    } else if (step === 2) {
      s.magX = lerp(MAG.rest, MAG.out, easeIO(seg(t, 0.3, 1.6)));
      s.field = 1 - easeIO(seg(t, 0.3, 0.9));
      // 鐵鎚：2.0 出現，2.4–3.0 揮下，3.0 敲中，之後彈回
      const sw = t < 3.0 ? Math.pow(seg(t, 2.4, 3.0), 2) : 1 - 0.45 * easeIO(seg(t, 3.0, 3.6));
      s.hammer = { a: easeIO(seg(t, 1.8, 2.2)) * (1 - easeIO(seg(t, 5.6, 6.2))), th: Math.PI + 0.8 * (1 - sw), hit: t >= 3.0 && t < 3.35 ? 1 - seg(t, 3.0, 3.35) : 0 };
      s.dx = t >= 3.0 ? 7 * Math.exp(-(t - 3.0) * 6) * Math.sin((t - 3.0) * 60) : 0;
      for (let i = 0; i < ND; i++) {
        const k = easeIO(seg(t, 3.0 + 0.02 * (i % 7), 3.7 + 0.02 * (i % 7)));
        s.angs.push(angLerp(wob(t, i, 0.04), R1[i] + wob(t, i, 0.14), k));
      }
      s.poles = 1 - easeIO(seg(t, 3.0, 3.6));
      s.clipK = CLIPX.map((_, j) => 1 - Math.pow(seg(t, 3.3 + 0.12 * j, 3.8 + 0.12 * j), 2));
      if (t < 2.0) s.msg = tr('磁鐵移開了，迴紋針還吸著', 'Magnet removed: the clips still hang on');
      else if (t < 3.0) s.msg = tr('用鐵鎚用力一敲……', 'Hit it hard with a hammer...');
      else { s.msg = tr('磁疇又亂了，迴紋針掉下來', 'Domains scramble, and the clips drop'); s.mc = PINK; }
    } else if (step === 3) {
      s.magX = t < 1.5 ? lerp(MAG.out, MAG.rest, easeIO(seg(t, 0, 0.8))) : lerp(MAG.rest, MAG.out, easeIO(seg(t, 2.0, 2.8)));
      s.field = easeIO(seg(t, 0.4, 0.8)) * (1 - easeIO(seg(t, 2.0, 2.4)));
      s.flame = easeIO(seg(t, 3.0, 3.5)) * (1 - easeIO(seg(t, 7.2, 7.8)));
      s.tint = 0.35 * easeIO(seg(t, 3.2, 5.0)) * (1 - easeIO(seg(t, 7.2, 8.6)));
      const amp = 0.04 + 0.5 * seg(t, 3.2, 4.6) * (1 - seg(t, 7.2, 8.6));
      for (let i = 0; i < ND; i++) {
        const kA = easeIO(seg(t, 0.6 + 0.1 * col(i), 1.1 + 0.1 * col(i)));
        const kR = easeIO(seg(t, 4.6 + 0.03 * (i % 9), 5.6 + 0.03 * (i % 9)));
        const a0 = angLerp(R1[i] + wob(t, i, 0.14), 0, kA);
        s.angs.push(angLerp(a0, R2[i], kR) + wob(t * 2.6, i, amp * 0.6));
      }
      s.poles = easeIO(seg(t, 1.3, 1.7)) * (1 - easeIO(seg(t, 4.8, 5.4)));
      s.clipK = CLIPX.map((_, j) => Math.pow(seg(t, 1.5 + 0.1 * j, 1.85 + 0.1 * j), 2) * (1 - Math.pow(seg(t, 5.2 + 0.12 * j, 5.7 + 0.12 * j), 2)));
      if (t < 3.0) s.msg = tr('重新磁化，又吸起迴紋針', 'Magnetize it again: clips lifted');
      else if (t < 4.8) s.msg = tr('用火加熱……磁疇越抖越厲害', 'Heat it... the domains shake harder');
      else { s.msg = tr('排列被破壞，失去磁性', 'Alignment destroyed: magnetism lost'); s.mc = PINK; }
    }
    return s;
  }

  function drawHammer(ctx, hm) {
    if (!hm || hm.a <= 0) return;
    const px = 880, py = 175, L = 170;
    ctx.save(); ctx.globalAlpha = hm.a; ctx.translate(px, py); ctx.rotate(hm.th);
    ctx.strokeStyle = '#b07a45'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(L - 18, 0); ctx.stroke();
    ctx.fillStyle = '#9aa5a8'; ctx.strokeStyle = CHALK; ctx.lineWidth = 2;
    rrect(ctx, L - 18, -35, 36, 70, 6); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.globalAlpha = hm.a; label(ctx, tr('鐵鎚', 'Hammer'), 892, 252, CHALK, 'center', 24); ctx.restore();
    if (hm.hit > 0) {
      ctx.save(); ctx.globalAlpha = hm.hit; ctx.strokeStyle = YELLOW; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let k = 0; k < 7; k++) {
        const a = Math.PI + k * Math.PI / 6, r1 = 24, r2 = 24 + 34 * (1 - hm.hit * 0.5);
        ctx.beginPath(); ctx.moveTo(700 + Math.cos(a) * r1, 205 + Math.sin(a) * r1); ctx.lineTo(700 + Math.cos(a) * r2, 205 + Math.sin(a) * r2); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 迴紋針被磁化：放大右端那根迴紋針的一小段鐵絲，看裡面的磁疇
  function drawClipZoom(ctx, s, t) {
    const a = s.clipK[1];
    if (a <= 0.02) return;
    const cx = 890, cy = 398, R = 72;
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = YELLOW; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(782, 384); ctx.lineTo(cx - R + 2, cy - 14); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#0b1a15'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = YELLOW; ctx.lineWidth = 4; ctx.stroke();
    // 放大的鐵絲：上端貼著鐵釘 N 極 → 上 S、下 N
    ctx.fillStyle = '#4f5a57'; rrect(ctx, cx - 26, cy - 58, 52, 116, 8); ctx.fill();
    ctx.strokeStyle = '#a9b4b0'; ctx.lineWidth = 3; ctx.stroke();
    for (let j = 0; j < 3; j++) {
      const ang = angLerp(RC[j] + wob(t, j + 3, 0.14), Math.PI / 2 + wob(t, j, 0.04), s.poles);
      domain(ctx, cx, cy - 36 + j * 36, ang, 30, 13);
    }
    label(ctx, 'S', cx + 48, cy - 40, C.poleS, 'center', 24);
    label(ctx, 'N', cx + 48, cy + 44, C.poleN, 'center', 24);
    wrapLabel(ctx, tr('迴紋針也被磁化（放大）', 'Clip magnetized too (zoom)'), cx, 500, 200, YELLOW, 22, 28, 'center');
    ctx.restore();
  }

  function drawProcess(ctx, step, t) {
    if (step === 4) return drawProcessSummary(ctx, t);
    const s = procState(step, t);
    label(ctx, tr('鐵釘（放大看內部）', 'Iron nail (zoomed in)'), 34, 50, CHALK, 'left', 24);
    legendDomain(ctx, 34, 96);

    // 桌面與迴紋針
    line(ctx, [[320, TABLE + 2], [790, TABLE + 2]], 'rgba(242,236,217,0.45)', 3);
    CLIPX.forEach((x, j) => {
      const k = s.clipK[j], y = lerp(CLIP_REST, CLIP_HANG + s.dy, k);
      clip(ctx, x + s.dx * k, y, k > 0.98 ? 0.06 * Math.sin(t * 3 + j) : 0);
    });
    label(ctx, tr('迴紋針', 'Paper clips'), 330, 472, CHALK, 'right', 24);

    // 火焰（在鐵釘下方左側）
    if (s.flame > 0) {
      flame(ctx, 550, 470, 100, t, s.flame);
      ctx.save(); ctx.globalAlpha = s.flame; label(ctx, tr('加熱', 'Heat'), 550, 494, ORANGE, 'center', 24); ctx.restore();
    }

    // 外加磁場方向
    if (s.field > 0) {
      ctx.save(); ctx.globalAlpha = s.field;
      arrow(ctx, 340, 182, 760, 182, GREEN, 5, 18);
      label(ctx, tr('外加磁場方向', 'Applied field direction'), 550, 152, GREEN, 'center', 24);
      ctx.restore();
    }
    // 外加磁鐵（N 端朝右面對鐵釘）
    if (s.magX !== null && s.magX > -MAG.w) {
      drawMagnet(ctx, s.magX, 245, MAG.w, MAG.h, false, false);
      if (s.magX >= 10) {  // 整塊進到畫面裡才寫字，避免字被切到畫布外
        label(ctx, 'S', s.magX + MAG.w / 4, 245 + MAG.h / 2, '#fff', 'center', 34);
        label(ctx, 'N', s.magX + MAG.w * 0.75, 245 + MAG.h / 2, '#fff', 'center', 34);
        label(ctx, tr('磁鐵', 'Magnet'), s.magX + MAG.w / 2, 345, CHALK, 'center', 24);
      }
    }

    // 鐵釘
    ironBlock(ctx, PB.x + s.dx, PB.y + s.dy, PB.w, PB.h, PB.cols, PB.rows, s.angs, '#4f5a57', s.tint);
    if (s.poles > 0) {
      ctx.save(); ctx.globalAlpha = s.poles;
      label(ctx, 'S', PB.x - 26 + s.dx, PB.y + PB.h / 2 + s.dy, C.poleS, 'center', 32);
      label(ctx, 'N', PB.x + PB.w + 26 + s.dx, PB.y + PB.h / 2 + s.dy, C.poleN, 'center', 32);
      ctx.restore();
    }
    drawHammer(ctx, s.hammer);
    drawClipZoom(ctx, s, t);
    if (s.msg) label(ctx, s.msg, 500, 556, s.mc, 'center', 26);
  }

  const SUM_R = randSet(12, 77);
  function drawProcessSummary(ctx, t) {
    const a1 = easeIO(seg(t, 0, 0.8)), a2 = easeIO(seg(t, 0.8, 1.6)), a3 = easeIO(seg(t, 1.8, 2.6));
    const bx = [70, 610], by = 190, bw = 320, bh = 110;
    ctx.save(); ctx.globalAlpha = a1;
    label(ctx, tr('排列凌亂', 'Disordered'), bx[0] + bw / 2, 150, PINK, 'center', 28);
    ironBlock(ctx, bx[0], by, bw, bh, 6, 2, SUM_R.map((r, i) => r + wob(t, i, 0.14)), '#4f5a57', 0);
    label(ctx, tr('沒有磁性', 'Not magnetic'), bx[0] + bw / 2, 400, PINK, 'center', 26);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a2;
    label(ctx, tr('排列整齊', 'Lined up'), bx[1] + bw / 2, 150, GREEN, 'center', 28);
    ironBlock(ctx, bx[1], by, bw, bh, 6, 2, SUM_R.map((r, i) => wob(t, i, 0.04)), '#4f5a57', 0);
    [-135, 105, 135].forEach((o, j) => clip(ctx, bx[1] + bw / 2 + o, by + bh + 2, 0.06 * Math.sin(t * 3 + j)));
    label(ctx, tr('有磁性', 'Magnetic'), bx[1] + bw / 2, 400, GREEN, 'center', 26);
    label(ctx, 'S', bx[1] - 20, by + bh / 2, C.poleS, 'center', 30);
    label(ctx, 'N', bx[1] + bw + 20, by + bh / 2, C.poleN, 'center', 30);
    // 兩個方向的箭頭
    arrow(ctx, 410, 222, 568, 222, GREEN, 6, 18);
    label(ctx, tr('靠近磁鐵', 'Near magnet'), 490, 192, GREEN, 'center', 22);
    arrow(ctx, 568, 272, 410, 272, PINK, 6, 18);
    label(ctx, tr('加熱、撞擊', 'Heat, impact'), 490, 304, PINK, 'center', 22);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a3;
    label(ctx, tr('磁性物質：鐵、鈷、鎳及其合金', 'Magnetic materials: iron, cobalt, nickel & their alloys'), 500, 478, YELLOW, 'center', 26);
    ctx.restore();
    legendDomain(ctx, 34, 556);
  }

  // ═════════ 場景 2：保存（mag-store） ═════════
  const SB = [{ x: 90, w: 340, name: ['軟鐵（軟磁性物質）', 'Soft iron (soft magnetic)'], fill: '#5a5f55' },
              { x: 570, w: 340, name: ['鋼（硬磁性物質）', 'Steel (hard magnetic)'], fill: '#4d5864' }];
  const SBY = 215, SBH = 100, SCOLS = 6, SROWS = 2, SN = SCOLS * SROWS;
  const SR = [randSet(SN, 101), randSet(SN, 131)], SR2 = randSet(SN, 151);
  const STABLE = 450, SCLIP_REST = STABLE - 52, SCLIP_HANG = SBY + SBH + 2;
  const DOWN = Math.PI / 2;
  const ROD = { w: 110, h: 150, cols: 2, rows: 3 };   // 步驟 1、2：直立鐵棒（磁極在上下兩端）

  // 回傳兩塊各自的 { angs, clipK, magY(null=無), status, sc }
  function storeState(step, t) {
    const out = [0, 1].map(() => ({ angs: [], clipK: [0, 0, 0], magY: null, status: '', sc: CHALK }));
    const magIn = k => lerp(-150, 91, k);
    if (step === 0) {
      const my = magIn(easeIO(seg(t, 0, 1.4)));
      out.forEach(o => { o.magY = my; });
      for (let i = 0; i < SN; i++) {
        const kS = easeIO(seg(t, 1.5 + 0.05 * i, 2.3 + 0.05 * i));
        out[0].angs.push(angLerp(SR[0][i] + wob(t, i, 0.14), DOWN + wob(t, i, 0.04), kS));
        const kH = easeIO(seg(t, 1.8 + 0.64 * i, 3.4 + 0.64 * i));
        out[1].angs.push(angLerp(SR[1][i] + wob(t, i, 0.14), DOWN + wob(t, i, 0.04), kH));
      }
      out[0].clipK = [0, 1, 2].map(j => Math.pow(seg(t, 3.0 + 0.15 * j, 3.4 + 0.15 * j), 2));
      out[1].clipK = [0, 1, 2].map(j => Math.pow(seg(t, 6.8 + 0.15 * j, 7.2 + 0.15 * j), 2));
      out[0].status = t < 2.6 ? tr('靠近磁鐵……', 'Near the magnet...') : tr('一下子就磁化了', 'Magnetized almost at once');
      out[0].sc = t < 2.6 ? CHALK : GREEN;
      out[1].status = t < 6.6 ? tr('磁疇很難轉動，不易磁化……', 'Domains turn slowly: hard to magnetize...') : tr('終於也磁化了', 'Finally magnetized too');
      out[1].sc = t < 6.6 ? ORANGE : GREEN;
    } else if (step === 1) {
      const my = magIn(1 - easeIO(seg(t, 0, 1.4)));
      out.forEach(o => { o.magY = my; });
      for (let i = 0; i < SN; i++) {
        const k = easeIO(seg(t, 1.4 + 0.04 * i, 2.2 + 0.04 * i));
        out[0].angs.push(angLerp(DOWN + wob(t, i, 0.04), SR2[i] + wob(t, i, 0.14), k));
        out[1].angs.push(DOWN + wob(t, i, 0.04));
      }
      out[0].clipK = [0, 1, 2].map(j => 1 - Math.pow(seg(t, 2.0 + 0.12 * j, 2.5 + 0.12 * j), 2));
      out[1].clipK = [1, 1, 1];
      out[0].status = t < 1.6 ? tr('拿走磁鐵……', 'Take the magnet away...') : tr('磁性馬上消失，迴紋針掉下', 'Magnetism gone at once: clips drop');
      out[0].sc = t < 1.6 ? CHALK : PINK;
      out[1].status = t < 4.0 ? tr('仍然排列整齊', 'Still lined up') : tr('過了很久，還是吸著：磁性長久保存', 'Long after, still holding: it keeps its magnetism');
      out[1].sc = GREEN;
    } else {
      // 用途：軟鐵通電／斷電輪流
      const ph = t < 0.5 ? -1 : (t - 0.5) % 3.2;
      const on = ph >= 0 && ph < 1.6;
      const a = ph < 0 ? 0 : (on ? easeIO(ph / 0.45) : 1 - easeIO((ph - 1.6) / 0.45));
      const kc = ph < 0 ? 0 : (on ? Math.pow(seg(ph, 0.35, 0.75), 2) : 1 - Math.pow(seg(ph, 1.9, 2.3), 2));
      for (let i = 0; i < SN; i++) {
        // 線圈沿鐵心長軸繞 → 磁場沿長軸（左右），磁疇轉成 N 朝右
        out[0].angs.push(angLerp(SR2[i] + wob(t, i, 0.14), 0 + wob(t, i, 0.04), a));
        out[1].angs.push(0 + wob(t, i, 0.04));
      }
      out[0].clipK = [kc, kc, kc]; out[1].clipK = [1, 1, 1];
      out[0].on = on;
      out[0].status = on ? tr('通電：有磁性', 'Current on: magnetic') : tr('斷電：磁性消失', 'Current off: not magnetic');
      out[0].sc = on ? GREEN : PINK;
      out[1].status = tr('磁性一直都在', 'Its magnetism stays');
      out[1].sc = GREEN;
    }
    return out;
  }

  function drawCoil(ctx, b, on, t) {
    const x0 = b.x + 18, x1 = b.x + b.w - 18, n = 7, top = SBY - 10, bot = SBY + SBH + 10;
    const col = on ? '#ff9a4d' : '#b8865a';
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
    if (on) { ctx.shadowColor = '#ff9a4d'; ctx.shadowBlur = 10 + 4 * Math.sin(t * 8); }
    for (let k = 0; k < n; k++) {
      const x = lerp(x0, x1, k / (n - 1));
      ctx.beginPath(); ctx.moveTo(x - 10, bot); ctx.lineTo(x + 10, top); ctx.stroke();
    }
    // 引線到電源
    ctx.lineWidth = 4; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(x0 + 10, top); ctx.lineTo(x0 + 10, 150); ctx.lineTo(b.x + 120, 150); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1 + 10, top); ctx.lineTo(x1 + 10, 150); ctx.lineTo(b.x + 220, 150); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.fillStyle = '#1a332b'; ctx.strokeStyle = on ? GREEN : '#58736a'; ctx.lineWidth = 3;
    rrect(ctx, b.x + 120, 128, 100, 44, 8); ctx.fill(); ctx.stroke(); ctx.restore();
    label(ctx, tr('電源', 'Power'), b.x + 170, 150, on ? GREEN : CHALK, 'center', 22);
    label(ctx, tr('線圈', 'Coil'), b.x + b.w + 20, SBY + SBH / 2, '#ff9a4d', 'left', 22);
  }

  function drawStoreCompare(ctx, step, t) {
    const st = storeState(step, t);
    SB.forEach((b, bi) => {
      const o = st[bi], cx = b.x + b.w / 2;
      const g = step === 2 ? { x: b.x, y: SBY, w: b.w, h: SBH, cols: SCOLS, rows: SROWS }
                           : { x: cx - ROD.w / 2, y: SBY, w: ROD.w, h: ROD.h, cols: ROD.cols, rows: ROD.rows };
      if (o.magY !== null && o.magY > -140) {
        const inView = o.magY >= 60;
        vMagnet(ctx, cx, o.magY, 64, 124, inView);
        if (inView) label(ctx, tr('磁鐵', 'Magnet'), bi === 0 ? cx - 46 : cx + 46, o.magY + 62, CHALK, bi === 0 ? 'right' : 'left', 24);
      }
      line(ctx, [[b.x + 20, STABLE + 2], [b.x + b.w - 20, STABLE + 2]], 'rgba(242,236,217,0.45)', 3);
      // 用途：磁場沿長軸，磁極在左右兩端，迴紋針吸在兩端；其餘步驟磁極在下方，吸在下面
      (step === 2 ? [-150, 150, 118] : [-30, 0, 30]).forEach((off, j) => {
        const k = o.clipK[j];
        clip(ctx, cx + off, lerp(SCLIP_REST, g.y + g.h + 2, k), k > 0.98 ? 0.06 * Math.sin(t * 3 + j + bi) : 0);
      });
      ironBlock(ctx, g.x, g.y, g.w, g.h, g.cols, g.rows, o.angs, b.fill, 0);
      if (step === 2 && bi === 0) drawCoil(ctx, b, o.on, t);
      const name = step === 2 ? (bi === 0 ? tr('軟鐵 → 電磁鐵的鐵心', 'Soft iron → electromagnet core') : tr('鋼 → 永久磁鐵', 'Steel → permanent magnet'))
                              : tr(b.name[0], b.name[1]);
      label(ctx, name, cx, 486, bi === 0 ? YELLOW : ORANGE, 'center', 26);
      wrapLabel(ctx, o.status, cx, 526, 400, o.sc, 24, 32, 'center');
    });
    label(ctx, tr('迴紋針', 'Clips'), 500, 426, CHALK, 'center', 24);
    if (step !== 2) {
      // 圖例放上方正中間（兩塊磁鐵的下降路徑之間）；英文換兩行
      const txt = tr('磁疇＝小磁鐵（紅 N、藍 S）', 'Domain = tiny magnet (red N, blue S)');
      const maxW = 310, tw = Math.min(maxW, textW(ctx, txt, 22)), x0 = 500 - (66 + tw) / 2;
      const n = textW(ctx, txt, 22) > maxW ? 2 : 1, y0 = 40;
      domain(ctx, x0 + 26, y0 + (n - 1) * 15, 0, 44, 18);
      wrapLabel(ctx, txt, x0 + 66, y0, maxW, CHALK, 22, 30);
    }
  }

  // 封閉迴路上流動的點
  function flowDots(ctx, pts, t, a) {
    const segs = []; let tot = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; const L = Math.hypot(q[0] - p[0], q[1] - p[1]); segs.push([p, q, L]); tot += L; }
    ctx.save(); ctx.globalAlpha = a;
    line(ctx, pts.concat([pts[0]]), CYAN, 3, [8, 8]);
    ctx.fillStyle = CYAN; ctx.shadowColor = CYAN; ctx.shadowBlur = 10;
    const n = Math.round(tot / 70);
    for (let k = 0; k < n; k++) {
      let d = ((k / n) * tot + t * 90) % tot;
      for (const [p, q, L] of segs) {
        if (d <= L) {
          const x = lerp(p[0], q[0], d / L), y = lerp(p[1], q[1], d / L), an = Math.atan2(q[1] - p[1], q[0] - p[0]);
          ctx.save(); ctx.translate(x, y); ctx.rotate(an); ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.restore();
          break;
        }
        d -= L;
      }
    }
    ctx.restore();
  }
  function keeper(ctx, x, y, w, h) {
    ctx.save(); ctx.fillStyle = '#7d847c'; ctx.strokeStyle = CHALK; ctx.lineWidth = 2;
    rrect(ctx, x, y, w, h, 6); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function loopLegend(ctx, a) {
    ctx.save(); ctx.globalAlpha = a;
    line(ctx, [[40, 572], [90, 572]], CYAN, 3, [8, 8]);
    label(ctx, tr('磁力線（封閉迴路）', 'Field lines (closed loop)'), 102, 572, CYAN, 'left', 22);
    ctx.restore();
  }

  function drawStoreBar(ctx, t) {
    const k = easeIO(seg(t, 0.4, 1.8)), a = easeIO(seg(t, 2.0, 2.6));
    // 上：N 在左；下：N 在右
    drawMagnet(ctx, 250, 160, 500, 76, true, true);
    drawMagnet(ctx, 250, 344, 500, 76, false, true);
    const lx = lerp(40, 200, k), rx = lerp(910, 750, k);
    keeper(ctx, lx, 160, 50, 260); keeper(ctx, rx, 160, 50, 260);
    label(ctx, tr('軟鐵片', 'Soft iron'), lx + 25, 128, CHALK, 'center', 24);
    label(ctx, tr('軟鐵片', 'Soft iron'), rx + 25, 128, CHALK, 'center', 24);
    label(ctx, tr('磁鐵 1', 'Magnet 1'), 500, 268, CHALK, 'center', 22);
    label(ctx, tr('磁鐵 2', 'Magnet 2'), 500, 312, CHALK, 'center', 22);
    // 磁鐵內部 S→N，外部經軟鐵片 N→S
    if (a > 0) flowDots(ctx, [[720, 198], [280, 198], [225, 198], [225, 382], [280, 382], [720, 382], [775, 382], [775, 198]], t, a);
    loopLegend(ctx, a);
    const msg = t < 2.0 ? tr('N、S 反向並排，兩端吸上軟鐵片', 'Side by side, N next to S; soft iron on both ends')
                        : tr('磁力線形成封閉迴路，磁性不易流失', 'A closed loop: the magnetism lasts longer');
    wrapLabel(ctx, msg, 500, 470, 900, t < 2.0 ? YELLOW : GREEN, 26, 34, 'center');
  }

  function drawStoreU(ctx, t) {
    const k = easeIO(seg(t, 0.4, 1.8)), a = easeIO(seg(t, 2.0, 2.6));
    const cx = 500, cy = 230, R = 120;
    ctx.save(); ctx.lineWidth = 60; ctx.strokeStyle = '#8f9893';
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, TAU); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = '#8f9893'; ctx.fillRect(350, cy, 60, 30); ctx.fillRect(590, cy, 60, 30); ctx.restore();
    ctx.save();
    ctx.fillStyle = C.poleS; ctx.fillRect(350, cy + 30, 60, 120);
    ctx.fillStyle = C.poleN; ctx.fillRect(590, cy + 30, 60, 120);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(350, cy + 30, 60, 120); ctx.strokeRect(590, cy + 30, 60, 120);
    ctx.restore();
    label(ctx, 'S', 380, cy + 90, '#fff', 'center', 34);
    label(ctx, 'N', 620, cy + 90, '#fff', 'center', 34);
    label(ctx, tr('U 形磁鐵', 'U-shaped magnet'), 690, 130, CHALK, 'left', 24);
    const kx = lerp(1010, 340, k);
    keeper(ctx, kx, cy + 150, 320, 40);
    if (k > 0.98) label(ctx, tr('軟鐵片', 'Soft iron'), 680, cy + 170, CHALK, 'left', 24);
    if (a > 0) flowDots(ctx, [[380, cy + 150], [380, cy], [cx - R * Math.cos(Math.PI / 4), cy - R * Math.sin(Math.PI / 4)], [cx, cy - R],
                              [cx + R * Math.cos(Math.PI / 4), cy - R * Math.sin(Math.PI / 4)], [620, cy], [620, cy + 150], [620, cy + 170], [380, cy + 170]], t, a);
    loopLegend(ctx, a);
    if (t > 3.0) {
      ctx.save(); ctx.globalAlpha = easeIO(seg(t, 3.0, 3.6));
      wrapLabel(ctx, tr('兩種保存法都用軟鐵片，讓磁力線形成封閉迴路', 'Both ways use soft iron to close the field-line loop'), 500, 490, 900, GREEN, 26, 34, 'center');
      ctx.restore();
    } else {
      label(ctx, tr('兩極之間吸上一塊軟鐵片', 'Put a soft iron bar across the two poles'), 500, 490, YELLOW, 'center', 26);
    }
  }

  function drawStore(ctx, step, t) {
    if (step <= 2) return drawStoreCompare(ctx, step, t);
    if (step === 3) return drawStoreBar(ctx, t);
    return drawStoreU(ctx, t);
  }

  // ═════════ 場景資料 ═════════
  const SCENES = {
    'mag-process': {
      draw: drawProcess,
      steps: [
        { d: 7.0, b: ['凌亂', 'Random'],
          cap: ['一根普通鐵釘碰到迴紋針，卻<strong class="accent-pink">吸不起來</strong>。放大看：鐵裡面有許多小磁區，叫做<strong class="accent-cyan">磁疇</strong>，每個都是一個小磁鐵，但方向凌亂、磁力互相抵消，所以整體不具磁性。',
                'An ordinary nail touches paper clips but <strong class="accent-pink">cannot lift them</strong>. Zoom in: iron is full of tiny regions called <strong class="accent-cyan">magnetic domains</strong>. Each is a tiny magnet, but they point every way and cancel out, so the nail is not magnetic.'] },
        { d: 9.0, b: ['磁化', 'Magnetize'],
          cap: ['拿磁鐵靠近（外加磁場），磁疇一個個轉向<strong class="accent-green">同一個方向</strong>，排列整齊。鐵釘兩端出現 <strong class="accent-blue">S</strong>、<strong class="accent-red">N</strong> 極，暫時變成磁鐵，吸起迴紋針——這就是<strong class="accent-cyan">磁化</strong>。',
                'Bring a magnet close (an applied field): the domains turn to <strong class="accent-green">the same direction</strong> and line up. The nail gets an <strong class="accent-blue">S</strong> and an <strong class="accent-red">N</strong> end, becomes a temporary magnet and lifts the clips. This is <strong class="accent-cyan">magnetization</strong>.'] },
        { d: 8.0, b: ['撞擊', 'Impact'],
          cap: ['磁性能被破壞嗎？用鐵鎚用力一敲，磁疇被震得<strong class="accent-pink">再度凌亂</strong>，鐵釘失去磁性，迴紋針掉下來。',
                'Can magnetism be destroyed? A hard hit with a hammer shakes the domains <strong class="accent-pink">back into disorder</strong>; the nail loses its magnetism and the clips drop.'] },
        { d: 9.0, b: ['加熱', 'Heat'],
          cap: ['重新磁化後改用火加熱：溫度越高，磁疇抖得越厲害，排列被破壞，迴紋針一樣<strong class="accent-pink">掉下來</strong>。<strong class="accent-orange">高溫或撞擊</strong>都會讓磁鐵失去磁性。',
                'Magnetize it again, then heat it: the hotter it gets, the harder the domains shake, until the alignment breaks and the clips <strong class="accent-pink">drop</strong>. <strong class="accent-orange">Heat or impact</strong> both destroy magnetism.'] },
        { d: 7.0, b: ['結論', 'Summary'],
          cap: ['結論：磁疇<strong class="accent-green">排列整齊＝有磁性</strong>，<strong class="accent-pink">排列凌亂＝沒有磁性</strong>。能被磁鐵吸引、被磁化的<strong class="accent-cyan">磁性物質</strong>有<strong class="accent-yellow">鐵、鈷、鎳</strong>及其合金。',
                'Summary: <strong class="accent-green">aligned domains = magnetic</strong>, <strong class="accent-pink">disordered domains = not magnetic</strong>. <strong class="accent-cyan">Magnetic materials</strong>, which can be attracted and magnetized, are <strong class="accent-yellow">iron, cobalt, nickel</strong> and their alloys.'] }
      ]
    },
    'mag-store': {
      draw: drawStore,
      steps: [
        { d: 9.0, b: ['磁化', 'Magnetize'],
          cap: ['軟鐵和鋼同時靠近磁鐵：<strong class="accent-yellow">軟鐵</strong>的磁疇一下子就轉好，<strong class="accent-orange">鋼</strong>的磁疇很難轉動，<strong class="accent-orange">不容易被磁化</strong>，要比較久才吸起迴紋針。',
                'Soft iron and steel near a magnet: the domains in <strong class="accent-yellow">soft iron</strong> turn at once, while those in <strong class="accent-orange">steel</strong> turn slowly. Steel is <strong class="accent-orange">hard to magnetize</strong> and takes longer to lift the clips.'] },
        { d: 8.0, b: ['移開', 'Remove'],
          cap: ['把磁鐵移開：軟鐵的磁疇馬上亂掉，<strong class="accent-pink">磁性容易消失</strong>；鋼的磁疇仍排列整齊，<strong class="accent-green">磁性可長久保存</strong>。',
                'Remove the magnets: the soft iron domains scramble at once, so it <strong class="accent-pink">loses magnetism easily</strong>; the steel domains stay lined up, so it <strong class="accent-green">keeps its magnetism for a long time</strong>.'] },
        { d: 7.0, b: ['用途', 'Uses'],
          cap: ['所以<strong class="accent-yellow">軟鐵</strong>適合做電磁鐵的鐵心：通電才有磁性、斷電就消失；<strong class="accent-orange">鋼</strong>是硬磁性物質，適合做<strong class="accent-green">永久磁鐵</strong>。',
                'So <strong class="accent-yellow">soft iron</strong> suits an electromagnet core: magnetic only while the current is on. <strong class="accent-orange">Steel</strong>, a hard magnetic material, suits <strong class="accent-green">permanent magnets</strong>.'] },
        { d: 8.0, b: ['長條', 'Bar'],
          cap: ['保存長條形磁鐵：兩支磁鐵 <strong class="accent-orange">N 極與 S 極反向並排</strong>，兩端吸上軟鐵片，讓磁力線形成<strong class="accent-cyan">封閉迴路</strong>，磁性比較不會流失。',
                'Storing bar magnets: lay two magnets <strong class="accent-orange">side by side with N next to S</strong> and put soft iron on both ends, so the field lines form a <strong class="accent-cyan">closed loop</strong> and the magnetism lasts.'] },
        { d: 8.0, b: ['U形', 'U-shape'],
          cap: ['保存 U 形磁鐵：直接在兩極之間吸一塊軟鐵片。兩種方法都是讓磁力線<strong class="accent-cyan">形成封閉迴路</strong>。',
                'Storing a U-shaped magnet: simply put a soft iron bar across its two poles. Both methods make the field lines <strong class="accent-cyan">form a closed loop</strong>.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };

  function canvasCtx() { const c = document.getElementById('magCanvas'); return c ? c.getContext('2d') : null; }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }

  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = YELLOW; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.canvas; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }

  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.scene) return;
    const sc = SCENES[S.scene], i = stepAt(sc, S.t);
    clear(ctx);
    sc.draw(ctx, i, S.t - sc.starts[i]);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
  }

  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc) return;
    const res = document.getElementById('magResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-mag');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function buildButtons() {
    const row = document.getElementById('steps-mag'); if (!row) return;
    row.innerHTML = '';
    const sc = SCENES[S.scene]; if (!sc) return;
    sc.steps.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => { S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0; S.endFired = false; render(); start(); });
      row.appendChild(b);
    });
  }

  function visible() { const c = document.getElementById('magCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last && !(MagAnim.ctl && MagAnim.ctl.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    if (S.t >= sc.total) {
      // 老師講解模式（MagAnim.ctl.onEnd 有設定）：停在最後一格並通知一次；學生模式照舊循環
      if (MagAnim.ctl && MagAnim.ctl.onEnd) { S.t = sc.total - 1e-3; if (!S.endFired) { S.endFired = true; MagAnim.ctl.onEnd(); } } else S.t = 0;
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (S.scene) start();
  });

  MagAnim.mag = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'mag-process';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-mag'); if (row) row.innerHTML = '';
      const ctx = canvasCtx(); if (ctx) clear(ctx);
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    // 測試用：直接畫出某場景第 t 秒的畫面
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();

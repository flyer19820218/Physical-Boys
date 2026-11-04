/* magnetism_1_pole_1104_v1.js — 「磁鐵與磁極」分頁動畫（#poleCanvas，1000×600）
 *
 * 契約：window.MagAnim.pole = { activate(sceneId), deactivate(), relang() }
 * 依賴頁面現成的：tr、C、TAU、clear、label、line、drawMagnet、drawCompass、getBField（直接呼叫，不複製）。
 * 畫布不綁任何事件；唯一控制是 #steps-pole 裡的步驟鈕（每場景 ≤5 個）。
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * pole-suspend 懸吊磁鐵（俯視圖），共 32.5 s
 *   1 撥轉   8.0 s  撥轉後來回擺動，停下時紅端（N）指北（現象）
 *   2 轉到東 8.0 s  用手轉到東西向再放手 → 自己轉回北（疑問：每次都這樣？）
 *   3 反過來 8.5 s  紅端轉向南再放手 → 轉半圈回北（驗證）
 *   4 地磁   8.0 s  畫出地球磁場方向＋指南針同向：指南針原理（收束，含停留）
 * pole-interact 磁極交互作用，共 36.0 s
 *   1 N對S   7.0 s  異名極：吸引力箭頭隨距離變大，吸在一起
 *   2 N對N   7.0 s  同名極：放手後被推開，排斥力隨距離變小
 *   3 S對S   7.0 s  另一組同名極：一樣相斥
 *   4 轉半圈 8.0 s  原本相斥，把 B 轉半圈 → 變成相吸（是磁極決定，不是磁鐵）
 *   5 結論   7.0 s  同名相斥／異名相吸對照（含停留）
 * pole-break 磁鐵的切斷，共 34.0 s
 *   1 整根   6.0 s  一根磁鐵＋下方小指南針；問：切斷會變單極嗎？
 *   2 切斷   7.0 s  切口出現新的 S、N 極
 *   3 檢查   7.0 s  小指南針跟著轉向；切口兩側互相吸引
 *   4 再切   7.0 s  切成四塊，每塊仍有 N、S
 *   5 結論   7.0 s  單極磁鐵不存在（含停留）
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.MagAnim = window.MagAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const GREEN = C.green, PINK = C.pink, YELLOW = C.yellow;

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const angLerp = (a, b, k) => { let d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * k; };

  // 以固定步長預先積分，播放時查表（跳步驟與重播都可重現）
  function simulate(acc, y0, v0, T, lo, hi) {
    const dt = 1 / 240, out = []; let y = y0, v = v0;
    for (let i = 0; i <= Math.ceil(T * 240); i++) {
      if (i % 2 === 0) out.push(y);
      v += acc(y, v) * dt; y += v * dt;
      if (lo !== undefined && y <= lo) { y = lo; v = 0; }
      if (hi !== undefined && y >= hi) { y = hi; v = 0; }
    }
    return out;
  }
  function sample(arr, t) {
    const f = clamp(t, 0, (arr.length - 1) / 120) * 120, i = Math.floor(f), k = f - i;
    return i + 1 < arr.length ? lerp(arr[i], arr[i + 1], k) : arr[arr.length - 1];
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
  function font(size) { return `900 ${size}px ${FONT}`; }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  // 依寬度換行（中文逐字、英文逐詞），回傳行數
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
  function pill(ctx, x, y, w, h, color, alpha = 0.16) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10); else ctx.rect(x, y, w, h); ctx.fill(); ctx.restore();
  }
  // 磁鐵：中心 (cx,cy)，nDir＝N 端指向的角度；字母另外直立寫（不隨磁鐵旋轉）
  function magnetAt(ctx, cx, cy, w, h, nDir, letters = true, scaleX = 1) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(nDir + Math.PI); ctx.scale(scaleX, 1);
    drawMagnet(ctx, -w / 2, -h / 2, w, h, true, false);
    ctx.restore();
    if (letters && Math.abs(scaleX) > 0.35) {
      const s = Math.sign(scaleX) * w / 4, ca = Math.cos(nDir), sa = Math.sin(nDir);
      const sz = Math.min(34, Math.round(h * 0.55));
      label(ctx, 'N', cx + ca * s, cy + sa * s, '#fff', 'center', Math.max(22, sz));
      label(ctx, 'S', cx - ca * s, cy - sa * s, '#fff', 'center', Math.max(22, sz));
    }
  }
  function glowRing(ctx, x, y, r, color, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }

  // ═════════ 場景 1：懸吊磁鐵（俯視） ═════════
  const SUS = { cx: 650, cy: 320, R: 220, ML: 320, MH: 60 };
  const K = 8, CD = 1.2;
  const pend = (y, v) => -K * Math.sin(y) - CD * v;
  const susSim = {
    s1: simulate(pend, 2.6, 8, 8.2),
    s2: simulate(pend, Math.PI / 2, 0, 7),
    s3: simulate(pend, Math.PI - 0.15, 0, 7.2)
  };
  // phi＝偏離北方的角度（順時針為正）；N 端方向 = -π/2 + phi
  function susPhi(step, t) {
    if (step === 0) return { phi: sample(susSim.s1, t) };
    if (step === 1) { if (t < 1.4) return { phi: lerp(0, Math.PI / 2, easeIO(t / 1.4)), hand: [0, Math.PI / 2] }; return { phi: sample(susSim.s2, t - 1.4) }; }
    if (step === 2) { if (t < 1.6) return { phi: lerp(0, Math.PI - 0.15, easeIO(t / 1.6)), hand: [0, Math.PI - 0.15] }; return { phi: sample(susSim.s3, t - 1.6) }; }
    return { phi: 0 };
  }

  function drawSuspend(ctx, step, t) {
    const { cx, cy, R, ML, MH } = SUS;
    // 方位盤
    ctx.save();
    ctx.fillStyle = 'rgba(85,233,255,0.05)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 36; i++) {
      const a = i * TAU / 36, l = i % 9 === 0 ? 18 : 8;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    }
    ctx.restore();
    label(ctx, tr('北', 'North'), cx, cy - R - 26, YELLOW, 'center', 28);
    label(ctx, tr('南', 'South'), cx, cy + R + 28, '#f2ecd9', 'center', 24);
    label(ctx, tr('東', 'East'), cx + R + 36, cy, '#f2ecd9', 'center', 24);
    label(ctx, tr('西', 'West'), cx - R - 36, cy, '#f2ecd9', 'center', 24);

    // 第 4 步：地球磁場方向（綠，向北流動）
    let fieldA = 0;
    if (step === 3) {
      fieldA = easeIO(seg(t, 0, 1.5));
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 4, 0, TAU); ctx.clip();
      ctx.globalAlpha = 0.55 * fieldA; ctx.strokeStyle = GREEN; ctx.fillStyle = GREEN; ctx.lineWidth = 3;
      const off = (t * 60) % 90;
      for (let x = cx - 180; x <= cx + 180; x += 72) {
        ctx.beginPath(); ctx.moveTo(x, cy + R); ctx.lineTo(x, cy - R); ctx.stroke();
        for (let y = cy + R - off; y > cy - R; y -= 90) {
          ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x - 9, y + 4); ctx.lineTo(x + 9, y + 4); ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
    }

    const st = susPhi(step, t);
    const nDir = -Math.PI / 2 + st.phi;
    // 用手轉的黃弧箭頭
    if (st.hand) {
      const r = R - 34, a0 = -Math.PI / 2 + st.hand[0], a1 = nDir;
      ctx.save(); ctx.strokeStyle = YELLOW; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke(); ctx.restore();
      const ex = cx + Math.cos(a1) * r, ey = cy + Math.sin(a1) * r, ta = a1 + Math.PI / 2;
      arrow(ctx, ex - Math.cos(ta) * 6, ey - Math.sin(ta) * 6, ex + Math.cos(ta) * 14, ey + Math.sin(ta) * 14, YELLOW, 5, 20);
    }
    // 磁鐵與吊點
    magnetAt(ctx, cx, cy, ML, MH, nDir);
    ctx.save(); ctx.fillStyle = YELLOW; ctx.strokeStyle = C.canvas; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();

    // 停下來後：N 端朝北的提示光
    const settleAt = [6.0, 6.2, 6.8, 0][step];
    const settled = step === 3 || t > settleAt;
    if (settled) {
      const k = step === 3 ? 1 : easeIO(seg(t, settleAt, settleAt + 0.6));
      glowRing(ctx, cx, cy - ML / 4, 30 + 4 * Math.sin(t * 4), YELLOW, 0.8 * k);
    }

    // 左側圖例
    const LX = 34;
    label(ctx, tr('俯視圖（從上往下看）', 'Top view (from above)'), LX, 56, '#f2ecd9', 'left', 24);
    const items = [
      [C.poleN, tr('N 極（紅）', 'N pole (red)'), 'sq'],
      [C.poleS, tr('S 極（藍）', 'S pole (blue)'), 'sq'],
      [YELLOW, tr('細線吊點', 'Thread pivot'), 'dot']
    ];
    if (st.hand) items.push([YELLOW, tr('用手轉', 'Turned by hand'), 'arc']);
    if (step === 3) items.push([GREEN, tr('地球磁場方向', "Earth's field"), 'arw']);
    items.forEach(([col, txt, kind], i) => {
      const y = 108 + i * 42;
      ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 4;
      if (kind === 'sq') ctx.fillRect(LX, y - 12, 24, 24);
      else if (kind === 'dot') { ctx.beginPath(); ctx.arc(LX + 12, y, 8, 0, TAU); ctx.fill(); }
      else if (kind === 'arc') { ctx.beginPath(); ctx.arc(LX + 12, y + 10, 16, -Math.PI * 0.95, -Math.PI * 0.1); ctx.stroke(); }
      ctx.restore();
      if (kind === 'arw') arrow(ctx, LX + 12, y + 14, LX + 12, y - 14, col, 4, 12);
      label(ctx, txt, LX + 40, y, '#f2ecd9', 'left', 24);
    });

    // 左側說明（停下後才出現）
    const noteY = 108 + items.length * 42 + 36;
    if (settled && step < 3) {
      const msgs = [
        tr('停下來了：紅端（N 極）指北', 'It stops: the red end (N) faces North'),
        tr('自己轉回來，紅端又指北', 'It turns back by itself: red faces North again'),
        tr('轉了半圈，紅端還是指北', 'It turns half a circle: red still faces North')
      ];
      wrapLabel(ctx, msgs[step], LX, noteY, 300, YELLOW, 24, 34);
    } else if (!settled && step === 0) {
      wrapLabel(ctx, tr('撥轉之後來回擺動……', 'Spun by hand, it swings back and forth...'), LX, noteY, 300, C.cyan, 24, 34);
    } else if (!settled && st.hand) {
      wrapLabel(ctx, step === 1 ? tr('把紅端轉到東邊', 'Turn the red end to the East') : tr('把紅端轉到南邊', 'Turn the red end to the South'), LX, noteY, 300, C.cyan, 24, 34);
    } else if (!settled) {
      wrapLabel(ctx, tr('放手！', 'Let go!'), LX, noteY, 300, C.cyan, 24, 34);
    }
    if (step === 3) {
      // 指南針：一根小磁針，跟懸吊磁鐵同向
      const ca = -Math.PI / 2 + 0.9 * Math.exp(-1.1 * t) * Math.cos(5 * t);
      drawCompass(ctx, LX + 52, 470, ca, 50);
      label(ctx, tr('指南針', 'Compass'), LX + 120, 452, '#f2ecd9', 'left', 24);
      label(ctx, tr('也是紅端指北', 'red also → North'), LX + 120, 490, YELLOW, 'left', 22);
    }
  }

  // ═════════ 場景 2：磁極交互作用 ═════════
  const IA = { y: 300, w: 300, h: 80 };
  const ATT = 5e6, REP = 2.5e6;
  const attAcc = g => -ATT / ((g + 60) * (g + 60));
  const repAcc = (g, v) => REP / ((g + 60) * (g + 60)) - 1.5 * v;
  const iaSim = {
    att: simulate(attAcc, 340, 0, 7, 0),
    rep: simulate(repAcc, 14, 0, 7, 0, 330),
    att4: simulate(attAcc, 200, 0, 5, 0)
  };
  const forceLen = g => 34 + 110 * 60 / (g + 60);

  // 每一步：A、B 的 N 端方向（0＝朝右、π＝朝左），間隙 gap，力的種類
  function iaState(step, t) {
    if (step === 0) { const rel = 0.6; return { aN: Math.PI, bN: Math.PI, gap: t < rel ? 340 : sample(iaSim.att, t - rel), kind: 'att', released: t >= rel }; }
    if (step === 1 || step === 2) {
      const rel = 0.8, g = t < rel ? 14 : sample(iaSim.rep, t - rel);
      return step === 1 ? { aN: 0, bN: Math.PI, gap: g, kind: 'rep', released: t >= rel }
                        : { aN: Math.PI, bN: 0, gap: g, kind: 'rep', released: t >= rel };
    }
    if (step === 3) {
      // 0–2 s：N 對 N 被手扶著（相斥）；2–3.8 s：把 B 轉半圈；4.2 s 放手 → 相吸
      if (t < 2) return { aN: 0, bN: Math.PI, gap: 200, kind: 'rep', released: false, held: true };
      if (t < 3.8) { const k = easeIO(seg(t, 2, 3.8)); return { aN: 0, bN: Math.PI, flip: Math.cos(Math.PI * k), gap: 200, kind: null, held: true, turning: true }; }
      if (t < 4.2) return { aN: 0, bN: 0, gap: 200, kind: 'att', released: false, held: true };
      return { aN: 0, bN: 0, gap: sample(iaSim.att4, t - 4.2), kind: 'att', released: true };
    }
    return null;
  }
  function poleNameAt(nDir, side) { // 該磁鐵朝向 side（+1 右、-1 左）那一端的極
    const nRight = Math.cos(nDir) > 0; return (side > 0) === nRight ? 'N' : 'S';
  }

  function drawInteract(ctx, step, t) {
    if (step === 4) return drawInteractSummary(ctx, t);
    const s = iaState(step, t), { y, w, h } = IA;
    const ax = 500 - s.gap / 2 - w / 2, bx = 500 + s.gap / 2 + w / 2;
    // 磁鐵
    magnetAt(ctx, ax, y, w, h, s.aN);
    if (s.turning) magnetAt(ctx, bx, y, w, h, s.bN, true, s.flip);
    else magnetAt(ctx, bx, y, w, h, s.bN);
    label(ctx, tr('磁鐵 A', 'Magnet A'), ax, y + h / 2 + 34, '#f2ecd9', 'center', 24);
    label(ctx, tr('磁鐵 B', 'Magnet B'), bx, y + h / 2 + 34, '#f2ecd9', 'center', 24);

    // 相對的兩個極
    if (!s.turning) {
      const pa = poleNameAt(s.aN, 1), pb = poleNameAt(s.bN, -1);
      const glowA = 0.5 + 0.3 * Math.sin(t * 5);
      ctx.save(); ctx.globalAlpha = glowA; ctx.strokeStyle = YELLOW; ctx.lineWidth = 4; ctx.shadowColor = YELLOW; ctx.shadowBlur = 14;
      ctx.strokeRect(ax, y - h / 2 - 6, w / 2, h + 12);
      ctx.strokeRect(bx - w / 2, y - h / 2 - 6, w / 2, h + 12);
      ctx.restore();
      const same = pa === pb;
      label(ctx, tr(`${pa} 極面對 ${pb} 極`, `${pa} pole faces ${pb} pole`), 500, 462, YELLOW, 'center', 26);
      label(ctx, same ? tr('同名極', 'Like poles') : tr('異名極', 'Opposite poles'), 500, 500, same ? PINK : GREEN, 'center', 26);
    } else {
      label(ctx, tr('把磁鐵 B 轉半圈', 'Turn magnet B around'), 500, 462, C.cyan, 'center', 26);
    }

    // 受力箭頭（在磁鐵上方）
    if (s.kind) {
      const len = forceLen(s.gap), col = s.kind === 'att' ? GREEN : PINK;
      const dirA = s.kind === 'att' ? 1 : -1, ay = y - h / 2 - 54;
      const pulse = s.released ? 1 : 0.75 + 0.25 * Math.sin(t * 6);
      ctx.save(); ctx.globalAlpha = pulse;
      arrow(ctx, ax, ay, ax + dirA * len, ay, col, 7, 22);
      arrow(ctx, bx, ay, bx - dirA * len, ay, col, 7, 22);
      ctx.restore();
      const word = s.kind === 'att' ? tr('吸引力', 'Attraction') : tr('排斥力', 'Repulsion');
      label(ctx, word, ax + dirA * len / 2, ay - 36, col, 'center', 24);
      label(ctx, word, bx - dirA * len / 2, ay - 36, col, 'center', 24);
    }
    // 狀態字
    let msg = '', mc = C.cyan;
    if (s.held && !s.turning && step === 3 && t < 2) { msg = tr('先用手扶著：被推開的感覺', 'Held by hand: feel the push'); mc = PINK; }
    else if (!s.released && !s.turning) msg = tr('準備放手……', 'About to let go...');
    else if (s.kind === 'att' && s.gap <= 0.5) { msg = tr('吸在一起了！', 'Snapped together!'); mc = GREEN; }
    else if (s.kind === 'att') { msg = tr('越近，吸引力越大', 'Closer → stronger pull'); mc = GREEN; }
    else if (s.kind === 'rep') { msg = tr('越遠，排斥力越小', 'Farther → weaker push'); mc = PINK; }
    if (msg) label(ctx, msg, 500, 548, mc, 'center', 26);
    // 圖例
    label(ctx, tr('箭頭＝磁鐵受到的力', 'Arrows = force on each magnet'), 34, 56, '#f2ecd9', 'left', 22);
  }

  function drawInteractSummary(ctx, t) {
    const mw = 170, mh = 54;
    const rows = [
      { y: 190, title: tr('同名極：互相排斥', 'Like poles: REPEL'), col: PINK, kind: 'rep',
        pairs: [[0, Math.PI], [Math.PI, 0]] },
      { y: 420, title: tr('異名極：互相吸引', 'Opposite poles: ATTRACT'), col: GREEN, kind: 'att',
        pairs: [[Math.PI, Math.PI], [0, 0]] }
    ];
    rows.forEach((r, ri) => {
      const a = easeIO(seg(t, ri * 0.8, ri * 0.8 + 0.8));
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      label(ctx, r.title, 500, r.y - 98, r.col, 'center', 30);
      const ph = 0.5 + 0.5 * Math.sin(t * TAU / 1.6);
      const gap = r.kind === 'rep' ? 30 + 34 * ph : 6 + 34 * (1 - ph);
      r.pairs.forEach(([aN, bN], pi) => {
        const mid = pi === 0 ? 260 : 740;
        const ax = mid - gap / 2 - mw / 2, bx = mid + gap / 2 + mw / 2;
        magnetAt(ctx, ax, r.y, mw, mh, aN);
        magnetAt(ctx, bx, r.y, mw, mh, bN);
        const d = r.kind === 'att' ? 1 : -1, ay = r.y - mh / 2 - 26, L = 56;
        arrow(ctx, ax, ay, ax + d * L, ay, r.col, 6, 18);
        arrow(ctx, bx, ay, bx - d * L, ay, r.col, 6, 18);
      });
      ctx.restore();
    });
    // 圖例
    const ly = 556;
    arrow(ctx, 300, ly, 356, ly, PINK, 6, 18); label(ctx, tr('排斥力', 'Repulsion'), 368, ly, PINK, 'left', 24);
    arrow(ctx, 560, ly, 616, ly, GREEN, 6, 18); label(ctx, tr('吸引力', 'Attraction'), 628, ly, GREEN, 'left', 24);
  }

  // ═════════ 場景 3：磁鐵的切斷 ═════════
  const BR = { y: 260, h: 80, cy: 450, cr: 36 };
  const CXS = [180, 340, 500, 660, 820];
  const LAYOUT = {
    whole: [[250, 500]],
    halves: [[205, 250], [545, 250]],
    quarters: [[160, 125], [345, 125], [530, 125], [715, 125]]
  };
  function polesOf(pieces) {
    const p = [];
    for (const [x, w] of pieces) { p.push({ x: x + w * 0.15, y: BR.y, m: 1 }); p.push({ x: x + w * 0.85, y: BR.y, m: -1 }); }
    return p;
  }
  const fieldAng = (layout, x) => { const b = getBField(x, BR.cy, polesOf(LAYOUT[layout])); return Math.atan2(b.by, b.bx); };
  const START_ANG = [2.2, -2.6, 1.1, -0.4, 2.9];

  function compassAngles(step, t) {
    return CXS.map((x, i) => {
      if (step === 0) {
        const tgt = fieldAng('whole', x), k = seg(t, 0.3, 3.3);
        return angLerp(START_ANG[i], tgt, 1 - Math.exp(-4 * k) * Math.cos(9 * k));
      }
      if (step === 1) return fieldAng('whole', x);
      if (step === 2) return angLerp(fieldAng('whole', x), fieldAng('halves', x), easeIO(seg(t, 0.6, 2.6)));
      if (step === 3) return angLerp(fieldAng('halves', x), fieldAng('quarters', x), easeIO(seg(t, 3.6, 5.6)));
      return fieldAng('quarters', x) + 0.04 * Math.sin(t * 3 + i);
    });
  }

  // 一塊磁鐵：最後是 [N 紅 | S 藍]。oldL／oldR＝切開前那半邊原本的顏色（null＝不變），rev 0→1 時換成新磁極
  function piece(ctx, x, w, oldL, oldR, rev) {
    const { y, h } = BR, top = y - h / 2;
    drawMagnet(ctx, x, top, w, h, true, false);
    [[oldL, x], [oldR, x + w / 2]].forEach(([col, hx]) => {
      if (!col || rev >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - rev; ctx.fillStyle = col; ctx.fillRect(hx + 1, top + 1, w / 2 - 2, h - 2); ctx.restore();
    });
    const sz = w >= 200 ? 34 : 30;
    ctx.save(); ctx.globalAlpha = oldL ? rev : 1; label(ctx, 'N', x + w / 4, y, '#fff', 'center', sz); ctx.restore();
    ctx.save(); ctx.globalAlpha = oldR ? rev : 1; label(ctx, 'S', x + w * 0.75, y, '#fff', 'center', sz); ctx.restore();
  }

  function drawBreak(ctx, step, t) {
    const { y, h } = BR, top = y - h / 2;
    if (step === 0) {
      piece(ctx, 250, 500, null, null, 1);
      label(ctx, tr('N 極', 'N pole'), 312, top - 30, C.poleN, 'center', 26);
      label(ctx, tr('S 極', 'S pole'), 688, top - 30, C.poleS, 'center', 26);
      const blink = 0.45 + 0.45 * Math.sin(t * 5);
      line(ctx, [[500, top - 40], [500, top + h + 20]], `rgba(253,224,71,${blink.toFixed(2)})`, 4, [10, 8]);
      label(ctx, tr('從中間切斷？', 'Cut in the middle?'), 500, top - 70, YELLOW, 'center', 26);
    } else if (step === 1) {
      const cut = easeIO(seg(t, 0, 1.2)), sep = easeIO(seg(t, 1.2, 2.8)), rev = easeIO(seg(t, 2.6, 4.2));
      const g = 45 * sep;
      if (sep <= 0) {
        piece(ctx, 250, 500, null, null, 1);
      } else {
        piece(ctx, 205 + (45 - g), 250, null, C.poleN, rev);
        piece(ctx, 545 - (45 - g), 250, C.poleS, null, rev);
      }
      // 切割線（由上往下劃過）
      if (cut > 0 && sep < 1) {
        const yy = lerp(top - 40, top + h + 20, cut);
        line(ctx, [[500, top - 40], [500, yy]], YELLOW, 5);
        label(ctx, tr('切斷', 'Cut'), 500, top - 70, YELLOW, 'center', 26);
      }
      if (rev > 0) {
        glowRing(ctx, 392, y, 50 + 4 * Math.sin(t * 5), YELLOW, rev);
        glowRing(ctx, 608, y, 50 + 4 * Math.sin(t * 5), YELLOW, rev);
        ctx.save(); ctx.globalAlpha = rev;
        label(ctx, tr('新的 S 極', 'New S pole'), 392, top + h + 42, C.poleS, 'center', 24);
        label(ctx, tr('新的 N 極', 'New N pole'), 608, top + h + 42, C.poleN, 'center', 24);
        ctx.restore();
      }
    } else if (step === 2) {
      LAYOUT.halves.forEach(([x, w]) => piece(ctx, x, w, null, null, 1));
      const a = easeIO(seg(t, 3.0, 3.8)), p = 0.5 + 0.5 * Math.sin(t * 5);
      if (a > 0) {
        ctx.save(); ctx.globalAlpha = a;
        const L = 34 + 10 * p, ay = top - 30;
        arrow(ctx, 392, ay, 392 + L + 20, ay, GREEN, 6, 18);
        arrow(ctx, 608, ay, 608 - L - 20, ay, GREEN, 6, 18);
        label(ctx, tr('切口兩側互相吸引', 'The cut faces attract'), 500, top - 76, GREEN, 'center', 26);
        ctx.restore();
      }
      label(ctx, tr('左塊', 'Left piece'), 330, top + h + 34, '#f2ecd9', 'center', 24);
      label(ctx, tr('右塊', 'Right piece'), 670, top + h + 34, '#f2ecd9', 'center', 24);
    } else if (step === 3) {
      const cut = easeIO(seg(t, 0, 1.2)), sep = easeIO(seg(t, 1.2, 2.6)), rev = easeIO(seg(t, 2.4, 3.8));
      if (sep <= 0) {
        LAYOUT.halves.forEach(([x, w]) => piece(ctx, x, w, null, null, 1));
      } else {
        const Q = LAYOUT.quarters, H2 = LAYOUT.halves;
        // 每塊對半的起點 → 終點
        const from = [[H2[0][0], 125], [H2[0][0] + 125, 125], [H2[1][0], 125], [H2[1][0] + 125, 125]];
        Q.forEach(([qx], i) => {
          const x = lerp(from[i][0], qx, sep);
          // 對半時：左小塊原本整塊是紅（N 半邊），右小塊整塊是藍（S 半邊）
          if (i % 2 === 0) piece(ctx, x, 125, null, C.poleN, rev);
          else piece(ctx, x, 125, C.poleS, null, rev);
        });
      }
      if (cut > 0 && sep < 1) {
        [330, 670].forEach(cx => {
          line(ctx, [[cx, top - 40], [cx, lerp(top - 40, top + h + 20, cut)]], YELLOW, 5);
        });
        label(ctx, tr('再切一次', 'Cut again'), 500, top - 70, YELLOW, 'center', 26);
      }
      if (rev > 0) {
        ctx.save(); ctx.globalAlpha = rev;
        const pul = 0.75 + 0.25 * Math.sin(t * 5);
        ctx.strokeStyle = YELLOW; ctx.lineWidth = 4; ctx.shadowColor = YELLOW; ctx.shadowBlur = 14; ctx.globalAlpha = rev * pul;
        // 新磁極＝切口兩側的半塊：第 1 塊右半(S)、第 2 塊左半(N)；第 3 塊右半(S)、第 4 塊左半(N)
        const Q = LAYOUT.quarters;
        [[Q[0][0] + 62.5, Q[1][0]], [Q[2][0] + 62.5, Q[3][0]]].forEach(([sx, nx]) => {
          ctx.strokeRect(sx - 3, top - 5, 65.5, h + 10); ctx.strokeRect(nx - 3, top - 5, 65.5, h + 10);
        });
        ctx.shadowBlur = 0; ctx.globalAlpha = rev;
        [315, 685].forEach(gx => label(ctx, tr('新磁極', 'New poles'), gx, top + h + 42, YELLOW, 'center', 24));
        ctx.restore();
      }
    } else {
      LAYOUT.quarters.forEach(([x, w]) => piece(ctx, x, w, null, null, 1));
      // 輪流框出每一塊
      const k = Math.floor(t / 0.9) % 4, [hx, hw] = LAYOUT.quarters[k];
      ctx.save(); ctx.strokeStyle = YELLOW; ctx.lineWidth = 4; ctx.shadowColor = YELLOW; ctx.shadowBlur = 14;
      ctx.strokeRect(hx - 8, top - 8, hw + 16, h + 16); ctx.restore();
      label(ctx, tr('每一塊都有 N 極和 S 極', 'Every piece has an N and an S pole'), 500, top - 46, YELLOW, 'center', 26);
      // 單極磁鐵：不存在
      const a = easeIO(seg(t, 1.0, 2.0));
      if (a > 0) {
        ctx.save(); ctx.globalAlpha = a;
        const bx = 200, by = 60, bw = 120, bh = 50;
        ctx.fillStyle = C.poleN; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
        label(ctx, 'N', bx + 30, by + bh / 2, '#fff', 'center', 30);
        label(ctx, 'N', bx + 90, by + bh / 2, '#fff', 'center', 30);
        line(ctx, [[bx - 10, by - 10], [bx + bw + 10, by + bh + 10]], PINK, 7);
        line(ctx, [[bx + bw + 10, by - 10], [bx - 10, by + bh + 10]], PINK, 7);
        label(ctx, tr('只有 N 極的磁鐵：不存在', 'N-only magnet: does not exist'), bx + bw + 30, by + bh / 2, PINK, 'left', 26);
        ctx.restore();
      }
    }
    // 小指南針列（紅端順著該點的磁場方向）
    const angs = compassAngles(step, t);
    CXS.forEach((x, i) => drawCompass(ctx, x, BR.cy, angs[i], BR.cr));
    drawCompass(ctx, 52, 556, 0, 22);
    label(ctx, tr('小指南針：紅端指向該處的磁場方向', 'Mini compass: red end points along the field'), 86, 556, '#f2ecd9', 'left', 22);
  }

  // ═════════ 場景資料 ═════════
  const SCENES = {
    'pole-suspend': {
      draw: drawSuspend,
      steps: [
        { d: 8.0, b: ['撥轉', 'Spin'],
          cap: ['用手撥轉<strong class="accent-cyan">用細線吊起來的磁鐵</strong>：它來回擺動，最後停下來。停下時，紅色的 <strong class="accent-red">N 極</strong>朝向哪裡？',
                'Spin a <strong class="accent-cyan">magnet hung on a thread</strong>: it swings back and forth, then stops. Where does the red <strong class="accent-red">N pole</strong> point?'] },
        { d: 8.0, b: ['轉到東', 'To East'],
          cap: ['每次都這樣嗎？把紅端轉到東邊再放手，它自己轉回去，<strong class="accent-red">紅端</strong>又指向<strong class="accent-yellow">北方</strong>。',
                'Every time? Turn the red end East and let go: it turns back by itself, and the <strong class="accent-red">red end</strong> faces <strong class="accent-yellow">North</strong> again.'] },
        { d: 8.5, b: ['反過來', 'Flip'],
          cap: ['再刁難一次：讓紅端朝南再放手，它轉了半圈，<strong class="accent-red">紅端</strong>還是回到<strong class="accent-yellow">北方</strong>。',
                'One more test: point the red end South and let go. It turns half a circle, and the <strong class="accent-red">red end</strong> still returns to <strong class="accent-yellow">North</strong>.'] },
        { d: 8.0, b: ['地磁', 'Earth'],
          cap: ['原因：地球本身有磁場，懸吊的磁鐵順著它停下，<strong class="accent-red">N 極指北</strong>。指南針就是一根小磁針——這就是<strong class="accent-cyan">指南針的原理</strong>。',
                "Why: the Earth has a magnetic field, and the hanging magnet lines up with it, <strong class=\"accent-red\">N pole facing North</strong>. A compass needle is a tiny magnet — this is the <strong class=\"accent-cyan\">compass principle</strong>."] }
      ]
    },
    'pole-interact': {
      draw: drawInteract,
      steps: [
        { d: 7.0, b: ['N對S', 'N–S'],
          cap: ['<strong class="accent-red">N</strong> 對 <strong class="accent-blue">S</strong>（異名極）：放手後兩塊磁鐵互相<strong class="accent-green">吸引</strong>，越靠近吸力越大，最後吸在一起。',
                '<strong class="accent-red">N</strong> facing <strong class="accent-blue">S</strong> (opposite poles): after letting go they <strong class="accent-green">attract</strong>; the closer, the stronger, until they snap together.'] },
        { d: 7.0, b: ['N對N', 'N–N'],
          cap: ['<strong class="accent-red">N</strong> 對 <strong class="accent-red">N</strong>（同名極）：放手後互相<strong class="accent-pink">排斥</strong>，被推開；距離越遠，斥力越小。',
                '<strong class="accent-red">N</strong> facing <strong class="accent-red">N</strong> (like poles): after letting go they <strong class="accent-pink">repel</strong> and push apart; the farther, the weaker.'] },
        { d: 7.0, b: ['S對S', 'S–S'],
          cap: ['<strong class="accent-blue">S</strong> 對 <strong class="accent-blue">S</strong> 也是同名極，一樣互相<strong class="accent-pink">排斥</strong>。',
                '<strong class="accent-blue">S</strong> facing <strong class="accent-blue">S</strong> are also like poles, so they <strong class="accent-pink">repel</strong> too.'] },
        { d: 8.0, b: ['轉半圈', 'Turn B'],
          cap: ['是磁鐵 B 討厭 A 嗎？把 B 轉半圈，改成 <strong class="accent-blue">S</strong> 面對 <strong class="accent-red">N</strong>，立刻變成<strong class="accent-green">吸引</strong>——決定吸或斥的是<strong class="accent-cyan">相對的磁極</strong>。',
                'Does B just dislike A? Turn B around so <strong class="accent-blue">S</strong> faces <strong class="accent-red">N</strong>: now they <strong class="accent-green">attract</strong>. The <strong class="accent-cyan">facing poles</strong> decide.'] },
        { d: 7.0, b: ['結論', 'Summary'],
          cap: ['結論：<strong class="accent-pink">同名極相斥</strong>、<strong class="accent-green">異名極相吸</strong>。',
                'Summary: <strong class="accent-pink">like poles repel</strong>, <strong class="accent-green">opposite poles attract</strong>.'] }
      ]
    },
    'pole-break': {
      draw: drawBreak,
      steps: [
        { d: 6.0, b: ['整根', 'Whole'],
          cap: ['一根長條磁鐵：左端 <strong class="accent-red">N 極</strong>、右端 <strong class="accent-blue">S 極</strong>。從中間切斷，會得到「只有 N」和「只有 S」的兩塊嗎？',
                'A bar magnet: <strong class="accent-red">N pole</strong> on the left, <strong class="accent-blue">S pole</strong> on the right. Cut it in the middle — do we get an "N-only" piece and an "S-only" piece?'] },
        { d: 7.0, b: ['切斷', 'Cut'],
          cap: ['切開了！切口處<strong class="accent-cyan">出現新的磁極</strong>：左塊多了 <strong class="accent-blue">S 極</strong>，右塊多了 <strong class="accent-red">N 極</strong>。',
                'Cut! <strong class="accent-cyan">New poles appear</strong> at the cut: the left piece gains an <strong class="accent-blue">S pole</strong>, the right piece an <strong class="accent-red">N pole</strong>.'] },
        { d: 7.0, b: ['檢查', 'Check'],
          cap: ['驗證：下方小指南針跟著轉向；切口兩側是異名極，所以會<strong class="accent-green">互相吸引</strong>。',
                'Check: the mini compasses below turn around; the two cut faces are opposite poles, so they <strong class="accent-green">attract</strong>.'] },
        { d: 7.0, b: ['再切', 'Cut again'],
          cap: ['再各切一次：切成四小塊，每一塊<strong class="accent-yellow">仍然</strong>有完整的 <strong class="accent-red">N 極</strong>與 <strong class="accent-blue">S 極</strong>。',
                'Cut each piece again: all four small pieces <strong class="accent-yellow">still</strong> have both an <strong class="accent-red">N pole</strong> and an <strong class="accent-blue">S pole</strong>.'] },
        { d: 7.0, b: ['結論', 'Summary'],
          cap: ['結論：磁極永遠成對出現，<strong class="accent-orange">單極磁鐵不存在</strong>。',
                'Summary: poles always come in pairs — <strong class="accent-orange">a single-pole magnet does not exist</strong>.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };

  function canvasCtx() { const c = document.getElementById('poleCanvas'); return c ? c.getContext('2d') : null; }
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
    const res = document.getElementById('poleResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-pole');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }

  function buildButtons() {
    const row = document.getElementById('steps-pole'); if (!row) return;
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

  function visible() { const c = document.getElementById('poleCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

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

  MagAnim.pole = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'pole-suspend';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-pole'); if (row) row.innerHTML = '';
      const ctx = canvasCtx(); if (ctx) clear(ctx);
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    // 測試用：直接畫出某場景第 t 秒的畫面（不影響播放邏輯以外的狀態）
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();

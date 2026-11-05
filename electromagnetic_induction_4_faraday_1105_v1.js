/* electromagnetic_induction_4_faraday_1105_v1.js — 「法拉第與冷次」分頁動畫（#inductionCanvas，邏輯 1000×600）
 *
 * 契約：window.EmiAnim.faraday = { activate(sceneId), deactivate(), relang(), _info(), _state() }
 * 兩個場景（子分頁）：'faraday-story' 磁鐵靠近線圈、'lenz-law' 一條原磁場＋一條反向感應磁場。
 * 依賴頁面現成的（直接呼叫，不複製）：tr、C、TAU。其餘小工具（換行、外框箭頭、緩動）在本檔內。
 * 畫布不綁任何事件；唯一控制是 #steps-faraday 裡的步驟鈕（每場景 5 個）。
 * 畫面是「場景時間 t 的純函式」：磁鐵／線圈位置 x(t) 與速度 x'(t) 都是解析式，
 *   磁通量 Φ 由磁力線扇形幾何算出，感應電流 I ∝ 匝數 × dΦ/dt（鏈鎖律：Φ'(D)·dD/dt），
 *   電流記號的流動位移 ∝ 匝數 × Φ(t)（＝∫I dt），所以跳步驟、重播都和真的播到那裡一模一樣。
 *
 * ── 場景步驟表 faraday-story「磁鐵靠近線圈」，共 40.0 s ─────────────────
 *   1 靜止      6.5 s  磁鐵（N 朝線圈）停在線圈旁，9 條磁力線穿過線圈但不變 → 安培計 0（磁場強 ≠ 有電流）
 *   2 靠近      8.0 s  0.8–4.3 s 磁鐵由遠而近：穿過線圈 1 → 9 條，安培計偏右；停下後回 0
 *   3 遠離      8.0 s  0.8–4.3 s 磁鐵由近而遠：9 → 1 條，安培計偏左；停下後回 0
 *   4 相對運動  8.0 s  磁鐵不動；0.6–3.4 s 線圈（連安培計）靠近（1 → 7 條）→ 偏右，4.4–7.2 s 線圈退回 → 偏左
 *   5 越快越大  9.5 s  慢（3.5 s）→ 快（1.0 s）→ 快＋匝數×2（1.0 s），右下角指針、左下「最大電流」長條比較；
 *                      7.0 s 後停留 2.5 s（停在該步最後一幀）
 * ── 場景步驟表 lenz-law「一條原磁場＋一條反向感應磁場」，共 39.5 s ─────────
 *   1 N 靠近   7.5 s  0.6–6.4 s N 極靠近：B→，Bᵢ←，近端 N，線圈排斥磁鐵
 *   2 N 遠離   7.5 s  N 極遠離：B→，Bᵢ→，近端 S，線圈吸引磁鐵
 *   3 S 靠近   7.5 s  S 極靠近：B←，Bᵢ→，近端 S，排斥
 *   4 S 遠離   7.5 s  S 極遠離：B←，Bᵢ←，近端 N，吸引
 *   5 能量     9.5 s  0.4–3.0 s 手推 N 極進來（費力，線圈排斥）、3.4–6.0 s 手拉出去（費力，線圈吸引），
 *                      6.0 s 後停留 3.5 s：「反抗的是變化，不是永遠排斥；阻力把動能換成電能」
 * 播放規則（AGENTS 10.6，2026-11-05）：進場播第 1 步，每步播完停在最後一幀，不循環、不自動接下一步；
 * 按步驟鈕＝從該步開頭播到該步結束。setStepStop(false)＝步驟間不停、連播到底再停住（老師講解用）。
 *
 * ── 方向表（磁鐵在左、線圈在右、沿中心軸運動；x 軸向右為正）──────────────
 *   情況      穿過線圈的 B   通量變化  Bᵢ（線圈內）  近端極性  從磁鐵側看電流  線圈前側導線  安培計
 *   N 靠近    →（+x）        增加      ←（反向）      N         逆時針          向上          偏右
 *   N 遠離    →（+x）        減少      →（同向）      S         順時針          向下          偏左
 *   S 靠近    ←（−x）        增加      →（反向）      S         順時針          向下          偏左
 *   S 遠離    ←（−x）        減少      ←（同向）      N         逆時針          向上          偏右
 *   線圈靠近不動的 N ＝ N 靠近；線圈退離 ＝ N 遠離（只看相對運動）。
 * 推導（程式內同一套符號 I＝dΦx/dt，Φx＝極性×穿過的磁力線數）：
 *   I>0 ⇔ Bᵢ 指 −x ⇔ Bᵢ 從線圈左端（近端）出來 ⇔ 近端 N ⇔ 從左側看 Bᵢ 朝向觀察者 ⇔ 逆時針。
 *   線圈螺旋參數 θ：y＝R cosθ、z＝R sinθ（z 朝螢幕外），θ 增加＝繞 +x 右手旋轉，起點、終點都在線圈下緣。
 *   I>0 ⇒ 電流沿 θ 減少方向 ⇒ 前側導線（z>0）向上、後側向下；電流從線圈左端流出，
 *   沿左引線往下 → 由左往右通過安培計 → 右引線往上回線圈右端。指針一律偏向電流通過安培計的方向（I>0 偏右）。
 *   磁鐵受力一律與「相對運動」相反（靠近 → 被推開；遠離 → 被拉回）。
 * 畫面（前／後導線紅箭頭、近端色塊、Bᵢ 紫箭頭、左下「從磁鐵這側看」小圖、安培計、受力箭頭）、
 * 畫布頂端說明、結果框三者都由同一個 I 的正負決定，不另外寫死。
 *
 * 字級：畫布文字 20–34px（說明 24、標籤 22、數字 34），Noto Sans TC 900。
 */
(function () {
  'use strict';
  window.EmiAnim = window.EmiAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const AX = 255;                    // 中心軸 y
  const CX0 = 540, CL = 240, CR = 88, KZ = 0.28;   // 線圈左端、長、半徑、斜視係數
  const MW = 210, MH = 90;           // 磁鐵
  const FAR = 230, NEAR = 525;       // 磁鐵近端面 x（遠／近）
  const MY = 505, MRAD = 56;         // 安培計中心 y、半徑；中心 x＝線圈左端＋120
  const NL = 4, DA = 0.27, SP = 10;  // 磁力線 i＝−4…4、扇形張角、極面上間距
  const COPPER = '#d08a4a', COPPER_BACK = '#7a4e2c', WIRE = '#9fb3aa';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const font = s => `900 ${s}px ${FONT}`;

  // 解析式緩動：回傳 {v, d}（位置、速度）
  function move(t, t0, t1, a, b) {
    if (t <= t0) return { v: a, d: 0 };
    if (t >= t1) return { v: b, d: 0 };
    const s = (t - t0) / (t1 - t0);
    return { v: a + (b - a) * (1 - Math.cos(Math.PI * s)) / 2, d: (b - a) * Math.PI / 2 * Math.sin(Math.PI * s) / (t1 - t0) };
  }
  // 依序套用多段移動（後段開始時可瞬移，配合淡出）
  function track(t, init, segs) {
    let r = { v: init, d: 0 };
    for (const s of segs) if (t >= s[0]) r = move(t, s[0], s[1], s[2], s[3]);
    return r;
  }
  const bump = (t, c, w) => clamp(1 - Math.abs(t - c) / w, 0, 1);   // 0→1→0

  // ───────── 磁通量：磁力線扇形幾何 ─────────
  const yAt = (u, D) => u * SP + D * Math.tan(u * DA);   // 第 u 條線到線圈左端時離軸的距離
  function phi(D) {                                       // 連續版「穿過的條數」（3～9）
    if (yAt(NL, D) <= CR) return 2 * NL + 1;
    let lo = 0, hi = NL;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (yAt(m, D) < CR) lo = m; else hi = m; }
    return 2 * lo + 1;
  }
  const dphi = D => (phi(D + 0.5) - phi(D - 0.5));        // dΦ/dD
  function countLines(D) { let n = 0; for (let i = -NL; i <= NL; i++) if (Math.abs(yAt(i, D)) < CR) n++; return n; }

  // ───────── 文字工具（量寬換行，不縮字） ─────────
  function wrap(ctx, s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : Array.from(s);
    const lines = []; let cur = '';
    for (const u of units) {
      const test = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = latin ? u : u.trimStart(); } else cur = test;
    }
    if (cur) lines.push(cur);
    ctx.restore(); return lines;
  }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function text(ctx, s, x, y, color, size, align, alpha) {
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }
  function lines(ctx, arr, x, y, color, size, lh, align, alpha) { arr.forEach((s, k) => text(ctx, s, x, y + k * lh, color, size, align, alpha)); }
  // 置中文字但不超出畫布
  function textC(ctx, s, x, y, color, size, alpha) {
    const w = textW(ctx, s, size); text(ctx, s, clamp(x, 14 + w / 2, W - 14 - w / 2), y, color, size, 'center', alpha);
  }

  // 有深色外框的箭頭（疊在導線上也看得到）
  function arr(ctx, x1, y1, x2, y2, color, w, head, alpha, outline) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return;
    const h = Math.min(head, L * 0.7);
    const path = () => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.7, y2 - Math.sin(a) * h * 0.7);
    };
    const tip = () => {
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h);
      ctx.lineTo(x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h); ctx.closePath();
    };
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (outline !== false) {
      ctx.strokeStyle = C.bg; ctx.lineWidth = w + 5; path(); ctx.stroke(); tip(); ctx.lineWidth = 5; ctx.stroke();
    }
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; path(); ctx.stroke(); tip(); ctx.fill();
    ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ───────── 物件 ─────────
  function drawMagnet(ctx, face, pol, alpha) {
    const x = face - MW, y = AX - MH / 2, near = pol > 0 ? 'N' : 'S', far = pol > 0 ? 'S' : 'N';
    const col = p => p === 'N' ? C.poleN : C.poleS;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = col(far); rrect(ctx, x, y, MW / 2 + 6, MH, 10); ctx.fill();
    ctx.fillStyle = col(near); rrect(ctx, x + MW / 2, y, MW / 2, MH, 10); ctx.fill();
    ctx.fillRect(x + MW / 2, y, 12, MH);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; rrect(ctx, x, y, MW, MH, 10); ctx.stroke();
    ctx.restore();
    text(ctx, far, x + MW / 4, AX, C.white, 34, 'center', alpha);
    text(ctx, near, x + MW * 3 / 4, AX, C.white, 34, 'center', alpha);
  }

  // 線圈螺旋點：θ ∈ [π, π+2πN]
  function helixPt(x0, N, th) {
    const frac = (th - Math.PI) / (TAU * N);
    return { x: x0 + CL * frac + KZ * CR * Math.sin(th), y: AX - CR * Math.cos(th) };
  }
  function drawCoilHalf(ctx, x0, N, front) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const steps = 40 * N;
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath(); let on = false;
      for (let j = 0; j <= steps; j++) {
        const th = Math.PI + TAU * N * j / steps, s = Math.sin(th);
        const p = helixPt(x0, N, th);
        if (front ? s >= -0.02 : s <= 0.02) { if (!on) { ctx.moveTo(p.x, p.y); on = true; } else ctx.lineTo(p.x, p.y); }
        else on = false;
      }
      if (front) { ctx.strokeStyle = pass ? '#ffd29a' : COPPER; ctx.lineWidth = pass ? 2.5 : (N > 10 ? 7 : 9); }
      else { ctx.strokeStyle = COPPER_BACK; ctx.lineWidth = N > 10 ? 6 : 8; if (pass) break; }
      ctx.stroke();
    }
    ctx.restore();
  }
  // 導線上的感應電流箭頭（前側＝亮、後側＝淡）
  function drawCoilCurrent(ctx, x0, N, I, a, front) {
    if (a < 0.04) return;
    const sgn = I > 0 ? -1 : 1;                     // I>0：沿 θ 減少方向
    const c0 = Math.acos(0.55);
    const every = front ? (N > 10 ? 2 : 1) : (N > 10 ? 4 : 2);
    for (let n = 0; n < N; n += every) {
      const th = front ? TAU * (n + 1) + c0 : Math.PI + c0 + TAU * n;
      const p = helixPt(x0, N, th);
      let dx = CL / (TAU * N) + KZ * CR * Math.cos(th), dy = CR * Math.sin(th);
      const L = Math.hypot(dx, dy); dx = dx / L * sgn; dy = dy / L * sgn;
      const hl = 15;
      arr(ctx, p.x - dx * hl, p.y - dy * hl, p.x + dx * hl, p.y + dy * hl, C.current, front ? 5 : 4, 14, a * (front ? 1 : 0.6));
    }
  }

  // 引線＋安培計；回傳路徑供流動記號用
  function circuit(x0) {
    const mx = x0 + 120, x1 = x0 + CL, yb = AX + CR;
    return {
      mx,
      a: [[x0, yb], [x0, MY], [mx - MRAD, MY]],     // 線圈左端 → 安培計左
      b: [[mx + MRAD, MY], [x1, MY], [x1, yb]]      // 安培計右 → 線圈右端
    };
  }
  function drawWires(ctx, x0) {
    const c = circuit(x0);
    ctx.save(); ctx.strokeStyle = WIRE; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    [c.a, c.b].forEach(p => { ctx.beginPath(); p.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); });
    ctx.restore();
  }
  function polyLen(p) { let L = 0; for (let k = 1; k < p.length; k++) L += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]); return L; }
  function polyAt(p, s) {
    for (let k = 1; k < p.length; k++) {
      const l = Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]);
      if (s <= l || k === p.length - 1) { const u = clamp(s / l, 0, 1); return { x: lerp(p[k - 1][0], p[k][0], u), y: lerp(p[k - 1][1], p[k][1], u), dx: (p[k][0] - p[k - 1][0]) / l, dy: (p[k][1] - p[k - 1][1]) / l }; }
      s -= l;
    }
  }
  // 沿引線流動的紅色電流記號（I>0：左引線往下 → 經安培計往右 → 右引線往上）
  function drawFlow(ctx, x0, I, a, offset) {
    if (a < 0.04) return;
    const c = circuit(x0), sgn = I > 0 ? 1 : -1, gap = 46;
    [c.a, c.b].forEach(p => {
      const L = polyLen(p);
      for (let s = ((offset % gap) + gap) % gap; s < L; s += gap) {
        if (s < 14 || s > L - 14) continue;
        const q = polyAt(p, s), dx = q.dx * sgn, dy = q.dy * sgn;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(dy, dx));
        ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -8); ctx.lineTo(-7, 8); ctx.closePath();
        ctx.lineWidth = 3; ctx.strokeStyle = C.bg; ctx.stroke(); ctx.fillStyle = C.current; ctx.fill(); ctx.restore();
      }
    });
  }
  const needle = (I, g) => 1.25 * Math.tanh(I * g / 12);   // 指針偏角：I>0 偏右
  function drawMeter(ctx, x0, I, peak, g) {
    g = g || 1;
    const mx = x0 + 120, ang = needle(I, g);
    ctx.save();
    ctx.fillStyle = '#16302a'; ctx.beginPath(); ctx.arc(mx, MY, MRAD, 0, TAU); ctx.fill();
    ctx.strokeStyle = Math.abs(I) > 0.15 ? C.current : C.muted; ctx.lineWidth = 6; ctx.stroke();
    ctx.translate(mx, MY + 24);
    ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 54, -Math.PI / 2 - 1.25, -Math.PI / 2 + 1.25); ctx.stroke();
    for (let k = -4; k <= 4; k++) {
      const q = -Math.PI / 2 + k * 0.3; ctx.lineWidth = k === 0 ? 4 : 2; ctx.strokeStyle = k === 0 ? C.white : C.muted;
      ctx.beginPath(); ctx.moveTo(Math.cos(q) * 48, Math.sin(q) * 48); ctx.lineTo(Math.cos(q) * 60, Math.sin(q) * 60); ctx.stroke();
    }
    if (peak) {                                       // 最大偏角記號
      peak.forEach(pk => {
        const q = -Math.PI / 2 + needle(pk.v, g);
        ctx.strokeStyle = pk.c; ctx.lineWidth = 4; ctx.globalAlpha = pk.a;
        ctx.beginPath(); ctx.moveTo(Math.cos(q) * 40, Math.sin(q) * 40); ctx.lineTo(Math.cos(q) * 62, Math.sin(q) * 62); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    ctx.rotate(ang);
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -58); ctx.stroke();
    ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
    ctx.restore();
    text(ctx, 'A', mx, MY + 34, C.white, 22);
    const lx = x0 + CL + 22;                          // 放在右引線外側，不壓導線
    text(ctx, tr('安培計', 'Ammeter'), lx, MY - 14, C.white, 22, 'left');
    const z = Math.abs(I) < 0.15;
    text(ctx, z ? 'I＝0' : 'I≠0', lx, MY + 18, z ? C.muted : C.current, 22, 'left');
  }
  // 線圈近端的磁極色塊
  function drawNearPole(ctx, x0, I, a) {
    text(ctx, tr('近端', 'Near end'), x0, 100, C.white, 20, 'center', Math.max(0.6, a));
    if (a < 0.04) {
      ctx.save(); ctx.globalAlpha = 0.6; ctx.setLineDash([6, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
      rrect(ctx, x0 - 20, 122, 40, 40, 8); ctx.stroke(); ctx.restore(); return;
    }
    const n = I > 0;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = n ? C.poleN : C.poleS; rrect(ctx, x0 - 20, 122, 40, 40, 8); ctx.fill();
    ctx.restore();
    text(ctx, n ? 'N' : 'S', x0, 142, C.white, 28, 'center', a);
  }
  function currentLabel(ctx, x0, a) {
    if (a < 0.04) return;
    text(ctx, tr('感應電流 I', 'Induced current I'), x0 + 120, AX + CR + 42, C.current, 22, 'center', a);
  }
  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 950, 24);
    const y0 = ls.length > 1 ? 30 : 40;
    lines(ctx, ls, W / 2, y0, C.yellow, 24, 32, 'center');
  }

  // ───────── 物理狀態：I＝匝數比 × dΦx/dt ─────────
  function physics(st) {
    const D = st.coil - st.face, dD = st.dCoil - st.dFace;
    const P = phi(D), turnsF = st.turns / 8;
    const I = turnsF * st.pol * dphi(D) * dD;
    return { D, P, I, a: clamp(Math.abs(I) / 1.0, 0, 1), flow: turnsF * st.pol * P * 55, count: countLines(D) };
  }

  // ───────── 場景 1：faraday-story ─────────
  // 磁力線扇形：穿過線圈的亮、沒穿過的淡
  function drawFieldLines(ctx, st, ph, through) {
    const D = ph.D, x0 = st.coil;
    for (let i = -NL; i <= NL; i++) {
      const y0 = AX + i * SP, ye = yAt(i, D), inside = Math.abs(ye) < CR;
      if (inside !== through) continue;
      ctx.save(); ctx.globalAlpha = st.mAlpha; ctx.lineCap = 'round';
      if (inside) {
        const xe = x0, yE = AX + ye, xout = x0 + CL + 16, yout = AX + ye * 0.82;
        ctx.strokeStyle = C.green; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(st.face, y0); ctx.lineTo(xe, yE);
        ctx.quadraticCurveTo(x0 + CL * 0.5, AX + ye * 0.95, xout, yout); ctx.stroke();
        ctx.restore();
        arr(ctx, xout - 18, yout, xout + 6, yout, C.green, 3.5, 13, st.mAlpha, false);
      } else {
        const len = 190 - 15 * Math.abs(i), ang = i * DA;
        const g = ctx.createLinearGradient(st.face, y0, st.face + len * Math.cos(ang), y0 + len * Math.sin(ang));
        g.addColorStop(0, 'rgba(154,240,111,.55)'); g.addColorStop(1, 'rgba(154,240,111,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(st.face, y0); ctx.lineTo(st.face + len * Math.cos(ang), y0 + len * Math.sin(ang)); ctx.stroke();
        ctx.restore();
      }
    }
  }
  function drawFluxCounter(ctx, st, ph, dP, tl) {
    const x = st.coil + CL + 44, maxW = W - x - 12;
    let y = 196;
    const head = wrap(ctx, tr('穿過線圈的磁力線', 'Lines through the coil'), maxW, 22);
    lines(ctx, head, x, y, C.green, 22, 28, 'left'); y += head.length * 28 + 14;
    text(ctx, tr(`${ph.count} 條`, `${ph.count}`), x, y, C.green, 34, 'left'); y += 40;
    let s, col;
    if (dP > 0.15) { s = tr('↑ 變多', '↑ more'); col = C.yellow; }
    else if (dP < -0.15) { s = tr('↓ 變少', '↓ fewer'); col = C.yellow; }
    else { s = tr('不變', 'no change'); col = C.muted; }
    const al = Math.abs(dP) > 0.15 ? 1 : 0.65 + 0.35 * Math.sin(tl * 4);
    lines(ctx, wrap(ctx, s, maxW, 22), x, y, col, 22, 28, 'left', al);
  }
  function drawLegendLines(ctx) { text(ctx, tr('綠線＝磁力線', 'Green = field lines'), 24, 104, C.green, 20, 'left'); }

  const FSTEPS = [
    { dur: 6.5, b: ['靜止', 'Still'],
      cap: ['磁鐵不動：穿過線圈的磁力線很多，但數量不變 → I＝0', 'Magnet still: many lines pass through the coil, but none change → I = 0'],
      res: ['磁鐵靜止：磁通量沒有改變，安培計停在 0——<strong class="yellow">磁場強不等於有電流</strong>。', 'Magnet stationary: flux is constant and the ammeter stays at zero — <strong class="yellow">a strong field is not the same as a current</strong>.'],
      st: () => ({ face: NEAR, dFace: 0, coil: CX0, dCoil: 0, idle: true }) },
    { dur: 8, b: ['靠近', 'Approach'],
      cap: ['磁鐵靠近：穿過線圈的磁力線變多 → 安培計偏右；一停下就回到 0', 'Magnet approaches: more lines through the coil → needle swings right; back to 0 when it stops'],
      res: ['磁極靠近：線圈近端形成 <strong class="red">N 極</strong>，動能轉換成電能；停下時磁通量不再改變，安培計回到 0。', 'Pole approaches: the near face becomes <strong class="red">N</strong>; kinetic energy is converted into electrical energy. When it stops, flux is constant and the ammeter returns to zero.'],
      st: t => { const m = move(t, 0.8, 4.3, FAR, NEAR); return { face: m.v, dFace: m.d, coil: CX0, dCoil: 0, vMag: m.d }; } },
    { dur: 8, b: ['遠離', 'Leave'],
      cap: ['磁鐵遠離：穿過線圈的磁力線變少 → 電流反向，安培計偏左', 'Magnet leaves: fewer lines through the coil → current reverses, needle swings left'],
      res: ['磁極遠離：線圈近端形成 <strong class="cyan">S 極</strong>，阻礙磁通量減少；電流方向與靠近時相反。', 'Pole leaves: the near face becomes <strong class="cyan">S</strong> and opposes the flux decrease; the current flows opposite to the approach.'],
      st: t => { const m = move(t, 0.8, 4.3, NEAR, FAR); return { face: m.v, dFace: m.d, coil: CX0, dCoil: 0, vMag: m.d }; } },
    { dur: 8, b: ['相對運動', 'Relative'],
      cap: ['磁鐵不動、改移動線圈：一樣有感應電流——關鍵是相對運動', 'Magnet still, coil moves: still an induced current — relative motion is what matters'],
      res: ['磁鐵不動、線圈移動：磁通量一樣改變，一樣產生感應電流；線圈靠近時偏右、退開時偏左，關鍵是<strong class="cyan">相對運動</strong>。', 'Magnet still, coil moving: the flux still changes, so a current is still induced — right when the coil approaches, left when it backs away. <strong class="cyan">Relative motion</strong> is what matters.'],
      st: t => { const c = track(t, CX0, [[0.6, 3.4, CX0, FAR + 40], [4.4, 7.2, FAR + 40, CX0]]); return { face: FAR, dFace: 0, coil: c.v, dCoil: c.d, vCoil: c.d, magStill: true }; } },
    { dur: 9.5, b: ['越快越大', 'Faster'],
      cap: ['慢慢靠近 → 小電流；快速靠近 → 大電流；匝數加倍 → 更大', 'Slow approach → small current; fast → larger; double the turns → larger still'],
      res: ['相對移動越快：磁場改變越快，感應電流越大；線圈匝數越多：感應電壓越大，感應電流通常也越大。', 'Faster relative motion: faster field change and larger induced current. More coil turns: larger induced voltage and usually a larger current.'],
      st: t => {
        const m = track(t, FAR, [[0.3, 3.8, FAR, NEAR], [4.05, 4.4, FAR, FAR], [4.4, 5.4, FAR, NEAR], [5.75, 6.0, FAR, FAR], [6.0, 7.0, FAR, NEAR]]);
        const fade = Math.max(bump(t, 4.05, 0.3), bump(t, 5.75, 0.3));
        return { face: m.v, dFace: m.d, coil: CX0, dCoil: 0, vMag: m.d, mAlpha: 1 - fade, turns: t >= 5.75 ? 16 : 8, bars: true };
      } }
  ];
  // 第 5 步三次通過的最大電流（純函式取樣，載入時算一次）
  const PASSES = [[0.3, 3.8, ['慢', 'Slow'], C.muted], [4.4, 5.4, ['快', 'Fast'], C.orange], [6.0, 7.0, ['快＋匝數×2', 'Fast, 2× turns'], C.yellow]];
  const PEAKS = PASSES.map(p => { let m = 0; for (let t = p[0]; t <= p[1]; t += 0.01) m = Math.max(m, Math.abs(physics(fillSt(FSTEPS[4].st(t))).I)); return m; });

  function fillSt(s) {
    return Object.assign({ pol: 1, turns: 8, mAlpha: 1, dFace: 0, dCoil: 0 }, s);
  }

  function drawBars(ctx, tl) {
    const x = 24, y0 = 432, maxW = 210;
    text(ctx, tr('最大電流', 'Peak current'), x, y0, C.white, 22, 'left');
    const labW = Math.max(...PASSES.map(p => textW(ctx, tr(p[2][0], p[2][1]), 22)));
    const bx = x + labW + 14, top = Math.max(...PEAKS);
    PASSES.forEach((p, k) => {
      const y = y0 + 40 + k * 40, a = clamp((tl - p[1]) / 0.4, 0, 1);
      text(ctx, tr(p[2][0], p[2][1]), x, y, p[3], 22, 'left', 0.35 + 0.65 * a);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = p[3];
      rrect(ctx, bx, y - 11, Math.max(6, maxW * PEAKS[k] / top * a), 22, 6); ctx.fill(); ctx.restore();
    });
  }

  function drawFaraday(ctx, sc, i, tl) {
    const step = sc.steps[i], st = fillSt(step.st(tl)), ph = physics(st);
    // 磁力線增減指標：用 dΦ/dt（不乘極性與匝數）
    const dP = dphi(ph.D) * (st.dCoil - st.dFace);
    drawLegendLines(ctx);
    drawCoilHalf(ctx, st.coil, st.turns, false);
    drawCoilCurrent(ctx, st.coil, st.turns, ph.I, ph.a, false);
    drawFieldLines(ctx, st, ph, true);
    drawCoilHalf(ctx, st.coil, st.turns, true);
    drawCoilCurrent(ctx, st.coil, st.turns, ph.I, ph.a, true);
    drawFieldLines(ctx, st, ph, false);
    drawMagnet(ctx, st.face, st.pol, st.mAlpha);
    drawWires(ctx, st.coil);
    drawFlow(ctx, st.coil, ph.I, ph.a, ph.flow);
    let peak = null;
    if (st.bars) peak = PASSES.map((p, k) => ({ v: PEAKS[k], c: p[3], a: clamp((tl - p[1]) / 0.4, 0, 1) })).filter(p => p.a > 0);
    drawMeter(ctx, st.coil, ph.I, peak);
    drawNearPole(ctx, st.coil, ph.I, ph.a);
    currentLabel(ctx, st.coil, ph.a);
    text(ctx, tr(`線圈 ${st.turns} 匝`, `Coil: ${st.turns} turns`), st.coil + CL / 2, 142, st.turns > 8 ? C.yellow : COPPER, 22);
    drawFluxCounter(ctx, st, ph, dP, tl);
    // 運動標示
    if (st.vMag && Math.abs(st.vMag) > 8) {
      const cx = st.face - MW / 2, s = Math.sign(st.vMag);
      arr(ctx, cx - 50 * s, AX + MH / 2 + 30, cx + 50 * s, AX + MH / 2 + 30, C.white, 5, 16, st.mAlpha);
    }
    if (st.magStill) textC(ctx, tr('磁鐵不動', 'Magnet still'), st.face - MW / 2, AX + MH / 2 + 32, C.white, 22);
    if (st.vCoil && Math.abs(st.vCoil) > 8) {
      const s = Math.sign(st.vCoil), cx = st.coil + CL / 2;
      arr(ctx, cx - 60 * s, 106, cx + 60 * s, 106, C.white, 5, 16);
    }
    if (st.bars) drawBars(ctx, tl);
    if (st.idle) {                                     // 靜止步：安培計外圈呼吸光暈，提示「指針停在 0」
      ctx.save(); ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(tl * 3.2));
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 5; ctx.setLineDash([10, 9]); ctx.lineDashOffset = -tl * 30;
      ctx.beginPath(); ctx.arc(st.coil + 120, MY, MRAD + 12, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }

  // ───────── 場景 2：lenz-law ─────────
  function drawB(ctx, st) {                          // 一條原磁場（沿軸）
    const xa = st.face + 4, xb = st.coil + CL + 70;
    ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.globalAlpha = st.mAlpha;
    ctx.beginPath(); ctx.moveTo(xa, AX); ctx.lineTo(xb, AX); ctx.stroke(); ctx.restore();
    const s = st.pol, gapMid = (st.face + st.coil) / 2;
    [gapMid, st.coil + CL * 0.5, xb - 14].forEach(x => {
      if (x < xa + 16) return;
      arr(ctx, x - 12 * s, AX, x + 12 * s, AX, C.green, 4, 18, st.mAlpha, false);
    });
    text(ctx, tr('原磁場 B', 'Original B'), st.coil + CL + 40, AX - 30, C.green, 22, 'left');
  }
  function drawBi(ctx, st, ph) {
    const y = AX + 30, cx = st.coil + CL / 2, s = ph.I > 0 ? -1 : 1;
    text(ctx, tr('感應磁場 Bᵢ', 'Induced Bᵢ'), st.coil + CL + 40, AX + 32, C.indPurple, 22, 'left', Math.max(0.7, ph.a));
    if (ph.a < 0.04) return;
    arr(ctx, cx - 92 * s, y, cx + 92 * s, y, C.indPurple, 9, 28, ph.a);
  }
  // 左下「從磁鐵這側看」小圖
  function drawEndView(ctx, ph, tl) {
    const cx = 92, cy = 505, r = 42;
    ctx.save(); ctx.strokeStyle = COPPER; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.restore();
    const lx = 160, maxW = 260;
    const head = wrap(ctx, tr('從磁鐵這側看線圈', 'Coil seen from the magnet'), maxW, 22);
    const hy = cy - 14 - head.length * 14, ry = hy + head.length * 28 + 6;
    lines(ctx, head, lx, hy, C.white, 22, 28, 'left');
    if (ph.a < 0.04) { text(ctx, 'I＝0', lx, ry, C.muted, 22, 'left'); return; }
    const ccw = ph.I > 0, rot = ph.flow * 0.01;   // 隨電流轉動的弧（純函式）
    const a0 = rot, span = 4.4;
    ctx.save(); ctx.globalAlpha = ph.a; ctx.strokeStyle = C.current; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    const aEnd = ccw ? a0 - span : a0 + span;
    ctx.arc(cx, cy, r, a0, aEnd, ccw); ctx.stroke(); ctx.restore();
    const ex = cx + r * Math.cos(aEnd), ey = cy + r * Math.sin(aEnd);
    const tx = ccw ? Math.sin(aEnd) : -Math.sin(aEnd), ty = ccw ? -Math.cos(aEnd) : Math.cos(aEnd);
    arr(ctx, ex - tx * 14, ey - ty * 14, ex + tx * 6, ey + ty * 6, C.current, 5, 18, ph.a);
    // 中心：Bᵢ 朝向觀察者 ⊙（逆時針）／遠離觀察者 ⊗（順時針）
    ctx.save(); ctx.globalAlpha = ph.a; ctx.strokeStyle = C.indPurple; ctx.fillStyle = C.indPurple; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, TAU); ctx.stroke();
    if (ccw) { ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(cx - 9, cy - 9); ctx.lineTo(cx + 9, cy + 9); ctx.moveTo(cx + 9, cy - 9); ctx.lineTo(cx - 9, cy + 9); ctx.stroke(); }
    ctx.restore();
    text(ctx, ccw ? tr('逆時針', 'counterclockwise') : tr('順時針', 'clockwise'), lx, ry, C.current, 24, 'left', ph.a);
  }
  // 磁鐵受線圈的力：與相對運動相反
  function drawForce(ctx, st, ph) {
    if (ph.a < 0.04) return;
    const vrel = st.dFace - st.dCoil, s = -Math.sign(vrel), cx = st.face - MW / 2, y = AX - MH / 2 - 26;
    arr(ctx, cx - 60 * s, y, cx + 60 * s, y, C.orange, 7, 20, ph.a);
    textC(ctx, vrel > 0 ? tr('線圈排斥磁鐵', 'Coil repels magnet') : tr('線圈吸引磁鐵', 'Coil attracts magnet'), cx, y - 32, C.orange, 22, ph.a);
  }
  function drawMotion(ctx, st, hand) {
    const v = st.dFace; if (Math.abs(v) < 8) return;
    const s = Math.sign(v), cx = st.face - MW / 2, y = AX + MH / 2 + 30;
    if (!hand) { arr(ctx, cx - 50 * s, y, cx + 50 * s, y, C.white, 5, 16); textC(ctx, tr('磁鐵移動方向', 'Magnet moves'), cx, y + 32, C.white, 20); return; }
    // 手的力：與運動同向（推進來／拉出去）
    arr(ctx, cx - 60 * s, y, cx + 60 * s, y, C.white, 7, 20);
    textC(ctx, s > 0 ? tr('手用力推', 'Hand pushes') : tr('手用力拉', 'Hand pulls'), cx, y + 34, C.white, 22);
  }

  const lenzStep = (pol, approach, b, cap, res) => ({
    dur: 7.5, b, cap, res,
    st: t => { const m = move(t, 0.6, 6.4, approach ? FAR : NEAR, approach ? NEAR : FAR); return { face: m.v, dFace: m.d, coil: CX0, pol }; }
  });
  const LSTEPS = [
    lenzStep(1, true, ['N 靠近', 'N in'],
      ['N 極靠近：磁通量增加 → Bᵢ 與 B 反向 → 近端成 N，排斥', 'N approaches: flux increases → Bᵢ opposes B → near face becomes N, repels'],
      ['N 極靠近：線圈近端變成 <strong class="red">N 極</strong>，排斥靠近；Bᵢ 與 B 反向。', 'N pole approaches: the coil\'s near face becomes <strong class="red">N</strong> and repels it; Bᵢ opposes B.']),
    lenzStep(1, false, ['N 遠離', 'N out'],
      ['N 極遠離：磁通量減少 → Bᵢ 與 B 同向（補回去）→ 近端成 S，吸引', 'N leaves: flux decreases → Bᵢ points along B (making up the loss) → near face becomes S, attracts'],
      ['N 極遠離：線圈近端變成 <strong class="cyan">S 極</strong>，吸引它回來；Bᵢ 與 B 同向，阻礙磁通量減少。', 'N pole leaves: the near face becomes <strong class="cyan">S</strong> and attracts it back; Bᵢ points along B and opposes the flux decrease.']),
    lenzStep(-1, true, ['S 靠近', 'S in'],
      ['S 極靠近：磁通量增加 → Bᵢ 與 B 反向 → 近端成 S，排斥', 'S approaches: flux increases → Bᵢ opposes B → near face becomes S, repels'],
      ['S 極靠近：線圈近端變成 <strong class="cyan">S 極</strong>，排斥靠近；Bᵢ 與 B 反向。', 'S pole approaches: the near face becomes <strong class="cyan">S</strong> and repels it; Bᵢ opposes B.']),
    lenzStep(-1, false, ['S 遠離', 'S out'],
      ['S 極遠離：磁通量減少 → Bᵢ 與 B 同向 → 近端成 N，吸引', 'S leaves: flux decreases → Bᵢ points along B → near face becomes N, attracts'],
      ['S 極遠離：線圈近端變成 <strong class="red">N 極</strong>，吸引它回來；Bᵢ 與 B 同向，阻礙磁通量減少。', 'S pole leaves: the near face becomes <strong class="red">N</strong> and attracts it back; Bᵢ points along B and opposes the flux decrease.']),
    { dur: 9.5, b: ['能量', 'Energy'], energy: true,
      cap: t => t < 3.2 ? ['推進來：線圈排斥磁鐵，手要用力推', 'Pushing in: the coil repels the magnet, so the hand must push hard']
        : t < 6.0 ? ['拉出去：線圈吸引磁鐵，手要用力拉', 'Pulling out: the coil attracts the magnet, so the hand must pull hard']
          : ['反抗的是「變化」，不是永遠排斥；阻力把動能換成電能', 'It opposes the change, not always repels; the resistance turns kinetic energy into electrical energy'],
      res: ['推進來、拉出去都要費力：線圈的阻力對磁鐵做負功，<strong class="yellow">動能轉換成電能</strong>（安培計有電流）。它反抗的是「變化」，不是永遠排斥磁鐵。', 'Pushing in and pulling out both take effort: the coil\'s resisting force does negative work on the magnet, so <strong class="yellow">kinetic energy is converted into electrical energy</strong> (the ammeter shows a current). It opposes the change; it does not always repel the magnet.'],
      st: t => { const m = track(t, FAR, [[0.4, 3.0, FAR, NEAR], [3.4, 6.0, NEAR, FAR]]); return { face: m.v, dFace: m.d, coil: CX0, pol: 1 }; } }
  ];

  function drawEnergy(ctx, tl, ph) {
    const x = 24, y = 440;
    const done = tl >= 6.0;
    text(ctx, tr('能量轉換', 'Energy'), x, y, C.white, 22, 'left');
    const s1 = tr('手做功 → 動能', 'Hand\'s work → kinetic'), s2 = tr('→ 電能（安培計）', '→ electrical (ammeter)');
    const al = done ? 1 : 0.4 + 0.6 * ph.a;
    text(ctx, s1, x, y + 40, C.yellow, 22, 'left', al);
    text(ctx, s2, x, y + 76, C.yellow, 22, 'left', al);
    if (done) text(ctx, tr('不是永遠排斥！', 'Not always repelling!'), x, y + 120, C.pink, 24, 'left', 0.7 + 0.3 * Math.sin(tl * 4));
  }

  function drawLenz(ctx, sc, i, tl) {
    const step = sc.steps[i], st = fillSt(step.st(tl)), ph = physics(st);
    drawCoilHalf(ctx, st.coil, st.turns, false);
    drawCoilCurrent(ctx, st.coil, st.turns, ph.I, ph.a, false);
    drawB(ctx, st);
    drawBi(ctx, st, ph);
    drawCoilHalf(ctx, st.coil, st.turns, true);
    drawCoilCurrent(ctx, st.coil, st.turns, ph.I, ph.a, true);
    drawMagnet(ctx, st.face, st.pol, 1);
    drawWires(ctx, st.coil);
    drawFlow(ctx, st.coil, ph.I, ph.a, ph.flow);
    drawMeter(ctx, st.coil, ph.I, null, 3);
    drawNearPole(ctx, st.coil, ph.I, ph.a);
    currentLabel(ctx, st.coil, ph.a);
    drawForce(ctx, st, ph);
    drawMotion(ctx, st, !!step.energy);
    if (step.energy) drawEnergy(ctx, tl, ph); else drawEndView(ctx, ph, tl);
  }

  // ───────── 場景表 ─────────
  function mk(steps, draw) { const starts = []; let s = 0; steps.forEach(x => { starts.push(s); s += x.dur; }); return { steps, starts, total: s, draw }; }
  const SCENES = { 'faraday-story': mk(FSTEPS, drawFaraday), 'lenz-law': mk(LSTEPS, drawLenz) };

  // ───────── 播放迴圈（單一 RAF） ─────────
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  let lastResult = '';
  function canvas() { return document.getElementById('inductionCanvas'); }
  function stepAt(sc, t) { let i = 0; while (i + 1 < sc.starts.length && t >= sc.starts[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('inductionResult'); if (el) el.innerHTML = html;
  }
  function drawProgress(ctx, sc, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W * clamp(t / sc.total, 0, 1), 6);
    ctx.fillStyle = C.bg; sc.starts.slice(1).forEach(s => ctx.fillRect(W * s / sc.total - 2, 0, 4, 6));
    ctx.restore();
  }
  function render() {
    const c = canvas(); if (!c || !S.scene) return;
    const ctx = c.getContext('2d'), sc = SCENES[S.scene], i = stepAt(sc, S.t), st = sc.steps[i], tl = S.t - sc.starts[i];
    const k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    sc.draw(ctx, sc, i, tl);
    const fadeIn = clamp(1 - tl / 0.35, 0, 1);       // 每步開頭淡入
    if (fadeIn > 0) { ctx.save(); ctx.globalAlpha = fadeIn; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const cap = typeof st.cap === 'function' ? st.cap(tl) : st.cap;
    drawCaption(ctx, tr(cap[0], cap[1]));
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-faraday');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    const sc = SCENES[S.scene]; if (!sc) return;
    S.t = sc.starts[k] + 1e-4; S.step = -1; S.last = 0;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-faraday'); if (!row) return;
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
  let stepStop = true;
  function visible() { const c = canvas(); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    // AGENTS 10.6（2026-11-05）：學生模式一次只播一個步驟，播完停在該步最後一幀（不循環、不自動接下一步）。
    // setStepStop(false)＝步驟間不停、連播到底再停住（老師講解用；本頁未做老師模式）。
    {
      // 以「上一幀正在播的步驟」為準；剛跳步或重畫（S.step＝-1）時才由 t 推算
      let kk = S.step >= 0 ? S.step : 0;
      if (S.step < 0) while (kk + 1 < sc.starts.length && S.t >= sc.starts[kk + 1]) kk++;
      const end = stepStop ? (sc.starts[kk + 1] !== undefined ? sc.starts[kk + 1] : sc.total) : sc.total;
      if (S.t >= end) { S.t = end - 1e-3; render(); return; }
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

  window.EmiAnim.faraday = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'faraday-story';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.scene = null; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-faraday'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      lastResult = ''; S.step = -1;
      buildButtons(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.scene) start(); },
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();

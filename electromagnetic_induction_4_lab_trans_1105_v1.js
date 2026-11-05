/* electromagnetic_induction_4_lab_trans_1105_v1.js — 「🔬 動手做：調匝數比、拉鐵芯」變壓器實驗台（#transLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.trans = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的：tr、C、TAU（直接呼叫，不複製）。其餘小工具在本檔內（寫法同本課其他實驗台與變壓器動畫）。
 * 控制鈕由本檔建立在 #transLabControls，說明字寫進 #transLabResult（只有文字改變時才寫）。
 *
 * ── 互動 ──────────────────────────────────────────────
 *   拖曳「鐵芯上方橫條」（磁軛）：只有按在橫條上（含 10 px 邊界）才接管並 preventDefault，畫布其他地方垂直捲動照常。
 *     橫條只能水平滑動，往右滑出 0～150 px（OFF_MAX）；方向鍵 ←／→ 每按一下 25 px。放手停在原處。
 *   按鈕：①一次匝數 Nₚ 4／8／12  ②二次匝數 Nₛ 2／4／8／16（畫面圈數照實畫）
 *         ③電源 交流 110 V／直流電池 9 V／按開關（只在直流時出現；每按一下在接通、切斷之間切換）
 *         ④鐵芯放回（橫條平滑滑回；已閉合時停用）
 *   預設：Nₚ＝8、Nₛ＝4、交流、鐵芯閉合（110 → 55 V 降壓）；一進來 B 箭頭呼吸、電流記號流動、示波器捲動。
 *   怎麼玩提示（24px）在第一次拖曳橫條或按方向鍵後淡出。
 *
 * ── 公式與簡化 ─────────────────────────────────────────
 *   耦合 k（傳到二次線圈的磁通量比例）＝ 0.15 ＋ 0.85·(1 − s)^1.5，s ＝ off / 150；閉合 k＝1，完全拉開 k＝0.15（不降到 0）。
 *   交流（慢動作 T＝3.5 s，與動畫同；真實 60 Hz）：Vₚ＝110 V（有效值），Vₛ＝k·(Nₛ/Nₚ)·Vₚ（有效值）。
 *     示波器畫瞬時值：vₚ＝√2·110·sin ph，vₛ＝k·(Nₛ/Nₚ)·vₚ（同相），刻度 ±320 V，超出就頂邊並標「超出刻度」。
 *     磁通量 Φ＝cos ph（鐵芯左柱；右柱／下樑／橫條是 k·Φ）——Φ 與 vₚ、vₛ 差 ¼ 週期（vₛ ∝ −dΦ/dt）。
 *   負載＝額定 110 V 燈泡，當純電阻 R＝110 Ω：Iₛ＝Vₛ/R，Iₚ＝Vₛ·Iₛ/Vₚ（理想變壓器功率守恆；k 變小時兩者都變小，同一式的理想近似）。
 *     燈泡亮度 ∝ (Vₛ/110)²；狀態：<20 V 幾乎不亮、20–95 偏暗、95–130 正常、>130 太亮了會燒壞（只畫很亮＋紅字，不畫爆炸）。
 *     Iₚ、Iₛ 長條粗細＝相對值（較大的一條 26 px，另一條按比例），比值就是 Nₛ：Nₚ。
 *   直流（電池 9 V＋開關）：接通 Φ → 1（τ＝0.35 s）、切斷 Φ → 0（τ＝0.28 s，與動畫同）；
 *     vₛ＝−k·(Nₛ/Nₚ)·9 V·τ_on·dΦ/dt（接通瞬間峰值＝k·(Nₛ/Nₚ)·9 V；切斷峰值再乘 τ_on/τ_off）；穩定時 dΦ/dt＝0 → vₛ＝0。
 *     示波器只畫 vₛ，刻度 ±20 V（直流的脈衝很小，刻度另標）。燈泡亮度用 |vₛ| 瞬時值（最多閃一下）。
 *   不模擬線圈電阻、磁化電流、鐵損、拉鐵芯時 dk/dt 造成的額外感應（準靜態）。一次側在交流時只畫電流帶（不畫流向），
 *   因為有負載時 Iₚ 主要是與 vₚ 同相的負載電流，和動畫第 1 步（無負載、Iₚ 與 Φ 同步）不同，避免互相矛盾。
 *
 * ── 方向表（幾何、繞法、正負號全部沿用 electromagnetic_induction_4_trans_1105_v1.js 檔頭）──
 *   Φ＞0：鐵芯逆時針（左柱向下、下樑向右、右柱向上、上樑向左）。兩線圈同一個螺旋繞法（前側導線沿 +g 向左）。
 *   vₛ＞0：二次線圈上端（接燈泡的上引線）為 ＋，燈泡電流由上引線流進、下引線流回線圈（紅色記號沿這個方向）。
 *   示波器 vₚ 的正向：一次線圈「下端」為 ＋（它和二次線圈上端是同名端：動畫中一次線圈上端電壓＝＋cos ph、vₛ＝−cos ph），
 *     所以畫出來 vₚ、vₛ 同相、vₛ＝k·(Nₛ/Nₚ)·vₚ；電池仍是上端 ＋，直流時示波器不畫 vₚ。
 *   交流 ph       vₚ、vₛ   Φ＝cos ph        Bᵢ           二次電流（燈泡）
 *   0→90°         ＋ 增大   ＋、減少          同向          上引線流進燈泡、上端 ＋
 *   90→180°       ＋ 減小   −、增加（變強）   反向          同上
 *   180→270°      − 增大   −、減少          同向          下引線流進燈泡、上端 −
 *   270→360°      − 減小   ＋、增加          反向          同上
 *   直流 接通：電池上端 ＋、Iₚ 由上引線流進一次線圈 → Φ 由 0 增加（右柱向上變強）→ Bᵢ 向下（反向）→ vₛ 負脈衝、燈泡上端 −、
 *              電流由下引線流進燈泡（記號往回走）。
 *   直流 穩定：Φ 不變 → vₛ＝0、Bᵢ＝0、Iₛ＝0（一次側電流照流）。
 *   直流 切斷：Iₚ＝0、Φ 減少 → Bᵢ 向上（同向）→ vₛ 正脈衝、燈泡上端 ＋、電流由上引線流進燈泡。
 *   畫面的紫 B 箭頭、亮紫 Bᵢ、紅色流動記號、燈泡旁 ＋／−、示波器正負、讀數、畫布頂端字與說明框全由同一組 Φ、vₛ 算出。
 *
 * 字級：畫布文字 20–26px（頂端說明 24、標籤／讀數 22、次要 20），Noto Sans TC 900；量寬換行，不縮字。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const T_AC = 3.5, OM = TAU / T_AC;
  // 鐵芯：橫條（磁軛）y0..y0+th；兩柱 y0+th..y1−th；下樑 y1−th..y1
  const CORE = { x0: 175, x1: 465, y0: 118, y1: 474, th: 54 };
  const LCX = 202, RCX = 438, AXY = 296;
  const COIL_R = 42, COIL_RY = 11, COIL_T = 200, COIL_B = 392;
  const PX = LCX - COIL_R, SX = RCX + COIL_R;                // 一次、二次線圈引線 x
  const SRC_X = 52, SRC_Y = 296, SRC_R = 28;
  const SW_A = 82, SW_B = 128;                               // 開關兩接點（一次側上導線）
  const LX = 548, LGY = 278, LGR = 30;                       // 燈泡玻璃球
  const WIRE_R = 606;                                        // 燈泡上引線的轉角 x
  const OFF_MAX = 150;
  const RX0 = 640, RX1 = 988;                                // 右側讀數欄
  const WX = 668, WW = 320, WT = 376, WB = 520, WY0 = (WT + WB) / 2, AMP = 62, WIN = 4;  // 示波器
  const FS_AC = 320, FS_DC = 20;
  const VP_AC = 110, VP_DC = 9, R_LOAD = 110;
  const DC = { tOn: 0.35, tOff: 0.28 };
  const NP_OPT = [4, 8, 12], NS_OPT = [2, 4, 8, 16];
  const WIRE = '#9fb3aa', CHG_POS = '#ff8040', PANEL = 'rgba(12,30,25,0.92)';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const font = s => `900 ${s}px ${FONT}`;
  const sgn = v => v > 0 ? 1 : v < 0 ? -1 : 0;
  // 數字格式：去掉多餘的 0（55、27.5、18.3、0.25、16）
  function fmt(v, d) { const s = Math.abs(v) >= 100 ? v.toFixed(d === undefined ? 1 : Math.min(d, 1)) : v.toFixed(d === undefined ? 1 : d); return s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
  const fmtA = v => fmt(v, v >= 10 ? 1 : 2);

  // ───────── 狀態 ─────────
  const S = {
    np: 8, ns: 4, src: 'ac', closed: false,
    off: 0, offT: 0, phi: 0, dphi: 0, acT: 0, vp: 0, vs: 0, ipN: 0,
    qs: 0, qp: 0, wave: [], events: [], evt: null, evtT: -99,
    t: 0, hintA: 1, dragged: false, over: null, overT: -99,
    raf: 0, last: 0, on: false, visible: true, timer: 0, actions: 0
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null, ptr = null, lastRes = '';

  // ───────── 文字與圖形小工具 ─────────
  function textW(s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function text(s, x, y, color, size, align, alpha) {
    if (alpha !== undefined && alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }
  function wrap(s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s), units = latin ? s.split(' ') : s.match(/[A-Za-z0-9ₚₛᵢΦ.:：%]+|./gu), out = [];
    let cur = '';
    for (const u of units) {
      const t = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(t).width > maxW && cur) {
        if (!latin && /^[，。、：；）」！？]/.test(u) && cur.length > 1) { const a = Array.from(cur), l = a.pop(); out.push(a.join('')); cur = l + u; }
        else { out.push(cur); cur = latin ? u : u.trimStart(); }
      } else cur = t;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function arr(x1, y1, x2, y2, color, w, head, alpha, outline) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2 || (alpha !== undefined && alpha <= 0.01)) return;
    const h = Math.min(head, L * 0.7);
    const path = () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.7, y2 - Math.sin(a) * h * 0.7); };
    const tip = () => {
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h);
      ctx.lineTo(x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h); ctx.closePath();
    };
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (outline !== false) { ctx.strokeStyle = C.bg; ctx.lineWidth = w + 5; path(); ctx.stroke(); tip(); ctx.lineWidth = 5; ctx.stroke(); }
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; path(); ctx.stroke(); tip(); ctx.fill();
    ctx.restore();
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
  }
  function poly(pts) { ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); }
  function polyLen(p) { let L = 0; for (let k = 1; k < p.length; k++) L += Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y); return L; }
  function polyAt(p, s) {
    for (let k = 1; k < p.length; k++) {
      const l = Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y);
      if (s <= l || k === p.length - 1) { const u = clamp(s / l, 0, 1); return { x: p[k - 1].x + (p[k].x - p[k - 1].x) * u, y: p[k - 1].y + (p[k].y - p[k - 1].y) * u, dx: (p[k].x - p[k - 1].x) / l, dy: (p[k].y - p[k - 1].y) / l }; }
      s -= l;
    }
  }
  function flowMarks(path, offset, dir, a, size) {
    if (a < 0.05) return;
    const gap = 40, L = polyLen(path);
    for (let s = ((offset % gap) + gap) % gap; s < L; s += gap) {
      if (s < 6 || s > L - 6) continue;
      const q = polyAt(path, s);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(q.dy * dir, q.dx * dir)); ctx.scale(size, size);
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -8); ctx.lineTo(-7, 8); ctx.closePath();
      ctx.lineWidth = 3; ctx.strokeStyle = C.bg; ctx.stroke(); ctx.fillStyle = C.current; ctx.fill(); ctx.restore();
    }
  }

  // ───────── 物理量 ─────────
  const kOf = off => 0.15 + 0.85 * Math.pow(1 - clamp(off / OFF_MAX, 0, 1), 1.5);
  const kNow = () => kOf(S.off);
  const ratio = () => S.ns / S.np;
  const vsRms = () => kNow() * ratio() * VP_AC;                 // 交流輸出（有效值）
  const isRms = () => vsRms() / R_LOAD;
  const ipRms = () => vsRms() * isRms() / VP_AC;
  const vsPeakDC = () => kNow() * ratio() * VP_DC;               // 直流接通脈衝峰值
  const lampV = () => S.src === 'ac' ? vsRms() : Math.abs(S.vs); // 決定燈泡亮度的電壓
  function lampKey() { const v = lampV(); return v < 20 ? 'off' : v < 95 ? 'dim' : v <= 130 ? 'ok' : 'over'; }
  const isUp = () => S.ns > S.np, isDown = () => S.ns < S.np;
  const fs = () => S.src === 'ac' ? FS_AC : FS_DC;
  const clipped = () => S.wave.some(w => w.t > S.t - WIN && Math.abs(w.vs) > (w.dc ? FS_DC : FS_AC));
  const kPct = () => Math.round(kNow() * 100);

  // ───────── 線圈 ─────────
  function helix(cx, n, g0) {
    const pts = [], tot = n * TAU, steps = n * 40;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, g = g0 + u * tot;
      pts.push({ x: cx + COIL_R * Math.cos(g), y: COIL_T + u * (COIL_B - COIL_T) + COIL_RY * Math.sin(g), front: Math.sin(g) > 0 });
    }
    return pts;
  }
  function strands(pts, front) {
    const out = []; let cur = null;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], inn = front ? p.front : !p.front;
      if (inn) { if (!cur) { cur = []; if (i) cur.push(pts[i - 1]); out.push(cur); } cur.push(p); }
      else if (cur) { cur.push(p); cur = null; }
    }
    return out;
  }
  function strokeStrands(segs, col, w) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    segs.forEach(s => { poly(s); ctx.strokeStyle = C.bg; ctx.lineWidth = w + 3; ctx.stroke(); });
    segs.forEach(s => { poly(s); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); });
    ctx.restore();
  }
  const wireW = n => n <= 4 ? 8 : n <= 8 ? 7 : n <= 12 ? 6 : 5;
  function coil(cx, n, g0, col, front) {
    const h = helix(cx, n, g0);
    if (front) strokeStrands(strands(h, true), col, wireW(n));
    else strokeStrands(strands(h, false), shade(col, 0.5), wireW(n) - 2);
  }

  // ───────── 鐵芯、磁場 ─────────
  function ironRect(x, y, w, h) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#9aa6a3'); g.addColorStop(1, '#6f7c79');
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(40,55,52,.28)'; ctx.lineWidth = 1.5;
    const horiz = w > h;
    for (let k = 1; k < 6; k++) {                               // 疊片紋路
      ctx.beginPath();
      if (horiz) { const yy = y + h * k / 6; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); }
      else { const xx = x + w * k / 6; ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); }
      ctx.stroke();
    }
    ctx.strokeStyle = '#3f524d'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h); ctx.restore();
  }
  function drawCoreFixed() {
    const { x0, x1, y0, y1, th } = CORE;
    ironRect(x0, y0 + th, th, y1 - y0 - 2 * th);                 // 左柱
    ironRect(x1 - th, y0 + th, th, y1 - y0 - 2 * th);            // 右柱
    ironRect(x0, y1 - th, x1 - x0, th);                          // 下樑
  }
  function yokeRect() { return { x: CORE.x0 + S.off, y: CORE.y0, w: CORE.x1 - CORE.x0, h: CORE.th }; }
  function drawYoke() {
    const r = yokeRect();
    ironRect(r.x, r.y, r.w, r.h);
    // 握把：三條直紋＋左右小箭頭（圖形，不是字）
    const cx = r.x + r.w * 0.8, cy = r.y + r.h / 2;            // 握把在右段（中左段留給 B 箭頭）
    ctx.save(); ctx.strokeStyle = 'rgba(20,35,32,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const d of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(cx + d, cy - 13); ctx.lineTo(cx + d, cy + 13); ctx.stroke(); }
    ctx.restore();
    // 提示：橫條外框呼吸（提示還在、或正在拖）
    const dragging = ptr && ptr.on;
    const a = dragging ? 0.95 : S.hintA * (0.45 + 0.4 * Math.sin(S.t * 4));
    if (a > 0.02) {
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.yellow; ctx.lineWidth = 4;
      rrect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 6); ctx.stroke(); ctx.restore();
      arr(cx - 30, cy, cx - 56, cy, C.yellow, 4, 12, a, true);
      arr(cx + 30, cy, cx + 56, cy, C.yellow, 4, 12, a, true);
    }
  }
  // 鐵芯磁場 B（Φ＞0 逆時針）：左柱 Φ，其餘三邊 k·Φ
  function drawB() {
    const phi = S.phi, k = kNow(), m = Math.abs(phi); if (m < 0.04) return;
    const s = phi > 0 ? 1 : -1, col = C.purple, hy = CORE.th / 2;
    const cyT = CORE.y0 + hy, cyB = CORE.y1 - hy, cxm = (CORE.x0 + CORE.x1) / 2;
    const L1 = 160 * m, L2 = 160 * m * k, H1 = 120 * m * k, al = 0.45 + 0.55 * m;
    arr(LCX, AXY - s * L1 / 2, LCX, AXY + s * L1 / 2, col, 12, 24, al);
    if (m * k > 0.05) {
      arr(cxm - s * H1 / 2, cyB, cxm + s * H1 / 2, cyB, col, 12, 24, al * (0.4 + 0.6 * k));
      const rx = S.src === 'dc' ? RCX - 14 : RCX;
      arr(rx, AXY + s * L2 / 2, rx, AXY - s * L2 / 2, col, 12, 24, al * (0.4 + 0.6 * k));
      const yc = CORE.x0 + S.off + (CORE.x1 - CORE.x0) * 0.36;
      arr(yc + s * H1 / 2, cyT, yc - s * H1 / 2, cyT, col, 12, 24, al * (0.4 + 0.6 * k));
    }
  }
  // 漏掉的磁力線：在缺口與鐵芯窗口裡（左柱內側 → 空氣 → 回到左柱上端）
  function bez(p0, p1, p2, p3, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push({ x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y });
    }
    return out;
  }
  function leakA() { return clamp((1 - kNow()) / 0.85, 0, 1) * (0.3 + 0.7 * Math.abs(S.phi)); }
  function drawLeak() {
    const a = leakA(); if (a < 0.03) return;
    const xi = CORE.x0 + CORE.th, ytop = CORE.y0 + CORE.th, s = S.phi >= 0 ? 1 : -1;
    for (let i = 0; i < 3; i++) {
      const yS = 340 - 34 * i, xE = 190 + 11 * i, h = 22 + 9 * i, dx = 60 + 34 * i;
      const p = bez({ x: xi, y: yS }, { x: xi + dx, y: yS - 40 }, { x: xE + 4, y: ytop - h - 10 }, { x: xE, y: ytop }, 28);
      ctx.save(); ctx.globalAlpha = a * 0.85; ctx.strokeStyle = C.purple; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -S.t * 12 * s; poly(p); ctx.stroke(); ctx.restore();
      // 中點箭頭：Φ＞0 時沿「內側 → 上端」
      const j = 14, q0 = p[j - 2], q1 = p[j + 2];
      if (s > 0) arr(q0.x, q0.y, q1.x, q1.y, C.purple, 3, 14, a, false); else arr(q1.x, q1.y, q0.x, q0.y, C.purple, 3, 14, a, false);
    }
  }
  // 感應磁場 Bᵢ（只在直流脈衝時畫；右柱向上為正＝vₛ 的正負）
  function drawBi() {
    if (S.src !== 'dc') return;
    const pk = Math.max(1e-6, vsPeakDC()), m = Math.abs(S.vs) / pk; if (m < 0.06) return;
    const L = 150 * Math.min(1, m), x = RCX + 16, d = sgn(S.vs);
    arr(x, AXY + d * L / 2, x, AXY - d * L / 2, C.indPurple, 10, 22, 0.5 + 0.5 * Math.min(1, m));
  }

  // ───────── 外電路 ─────────
  const priA = () => [{ x: SRC_X, y: SRC_Y - (S.src === 'dc' ? 26 : SRC_R) }, { x: SRC_X, y: COIL_T }, { x: PX, y: COIL_T }];
  const priB = () => [{ x: PX, y: COIL_B }, { x: SRC_X, y: COIL_B }, { x: SRC_X, y: SRC_Y + (S.src === 'dc' ? 26 : SRC_R) }];
  const secA = [{ x: SX, y: COIL_T }, { x: WIRE_R, y: COIL_T }, { x: WIRE_R, y: 318 }, { x: LX + 12, y: 318 }];
  const secB = [{ x: LX, y: 338 }, { x: LX, y: COIL_B }, { x: SX, y: COIL_B }];
  function wire(p) { ctx.save(); ctx.strokeStyle = WIRE; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; poly(p); ctx.stroke(); ctx.restore(); }
  function band(paths, w, alpha) {
    if (w < 1) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.current; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    paths.forEach(p => { poly(p); ctx.stroke(); }); ctx.restore();
  }
  function barW() {                                           // 相對粗細：較大的那條 26 px
    if (S.src !== 'ac') return { p: 0, s: 0 };
    const ip = ipRms(), is = isRms(), m = Math.max(ip, is);
    if (m <= 0) return { p: 0, s: 0 };
    return { p: Math.max(3, 26 * ip / m), s: Math.max(3, 26 * is / m) };
  }
  function drawACSource() {
    ctx.save(); ctx.fillStyle = '#16302a'; ctx.strokeStyle = C.orange; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(SRC_X, SRC_Y, SRC_R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = C.white;
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = SRC_X - 16 + 32 * u, y = SRC_Y - 9 * Math.sin(u * TAU); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  function drawBattery() {
    ctx.save(); ctx.lineCap = 'butt';
    ctx.strokeStyle = WIRE; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(SRC_X, SRC_Y - 26); ctx.lineTo(SRC_X, SRC_Y - 8); ctx.moveTo(SRC_X, SRC_Y + 8); ctx.lineTo(SRC_X, SRC_Y + 26); ctx.stroke();
    ctx.strokeStyle = CHG_POS; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(SRC_X - 26, SRC_Y - 8); ctx.lineTo(SRC_X + 26, SRC_Y - 8); ctx.stroke();
    ctx.strokeStyle = C.electron; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(SRC_X - 14, SRC_Y + 8); ctx.lineTo(SRC_X + 14, SRC_Y + 8); ctx.stroke();
    ctx.restore();
    text('+', SRC_X - 32, SRC_Y - 24, CHG_POS, 24); text('−', SRC_X - 32, SRC_Y + 26, C.electron, 24);
  }
  function drawSwitch() {
    ctx.save(); ctx.fillStyle = C.white;
    [SW_A, SW_B].forEach(x => { ctx.beginPath(); ctx.arc(x, COIL_T, 6, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = S.closed ? C.yellow : C.white; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const ang = S.closed ? 0 : -0.62, L = SW_B - SW_A;
    ctx.beginPath(); ctx.moveTo(SW_A, COIL_T); ctx.lineTo(SW_A + L * Math.cos(ang), COIL_T + L * Math.sin(ang)); ctx.stroke();
    ctx.restore();
  }
  // 燈泡：亮度 b＝(V/110)²
  function lampB() { const v = lampV(); return (v / 110) * (v / 110); }
  function drawLampGlow() {
    const b = lampB(), key = lampKey(); if (b < 0.02) return;
    const fl = key === 'over' ? 0.9 + 0.1 * Math.sin(S.t * 23) * Math.sin(S.t * 7.3) : 1;
    const r = Math.min(82, LGR + 14 + 34 * Math.sqrt(Math.min(b, 2.2))) * fl, a = clamp(0.15 + 0.55 * Math.sqrt(Math.min(b, 1.6)), 0, 0.85);
    const g = ctx.createRadialGradient(LX, LGY, 4, LX, LGY, r);
    g.addColorStop(0, `rgba(255,250,215,${a})`); g.addColorStop(0.45, `rgba(255,236,120,${a * 0.6})`); g.addColorStop(1, 'rgba(255,236,120,0)');
    ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(LX, LGY, r, 0, TAU); ctx.fill(); ctx.restore();
    if (key === 'over') {                                       // 太亮：放射光芒（不畫爆炸）
      ctx.save(); ctx.globalAlpha = 0.55 * fl; ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const q = i * TAU / 10 + S.t * 0.4, r0 = LGR + 10, r1 = LGR + 26 + 8 * Math.sin(S.t * 9 + i);
        ctx.beginPath(); ctx.moveTo(LX + Math.cos(q) * r0, LGY + Math.sin(q) * r0); ctx.lineTo(LX + Math.cos(q) * r1, LGY + Math.sin(q) * r1); ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawLampBody() {
    const b = lampB();
    ctx.save();
    ctx.fillStyle = b > 0.02 ? `rgba(255,${Math.round(225 + 25 * Math.min(1, b))},${Math.round(150 + 90 * Math.min(1, b))},${clamp(0.25 + 0.6 * Math.sqrt(Math.min(b, 1.5)), 0, 0.92)})` : 'rgba(184,201,193,.12)';
    ctx.strokeStyle = 'rgba(242,236,217,.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(LX, LGY, LGR, 0, TAU); ctx.fill(); ctx.stroke();
    // 燈絲
    ctx.strokeStyle = b > 0.02 ? (b > 0.6 ? '#fffbe6' : '#ffd36a') : '#8a7a5a'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(LX - 10, LGY + 26); ctx.lineTo(LX - 10, LGY + 2);
    for (let i = 0; i <= 8; i++) ctx.lineTo(LX - 10 + i * 2.5, LGY + 2 + (i % 2 ? -7 : 0));
    ctx.lineTo(LX + 10, LGY + 26); ctx.stroke();
    // 燈座（螺紋）
    ctx.fillStyle = '#7d8a86'; ctx.fillRect(LX - 12, 306, 24, 26);
    ctx.strokeStyle = '#3f524d'; ctx.lineWidth = 2;
    for (let y = 311; y < 332; y += 6) { ctx.beginPath(); ctx.moveTo(LX - 12, y); ctx.lineTo(LX + 12, y + 3); ctx.stroke(); }
    ctx.fillStyle = '#c9b48a'; ctx.beginPath(); ctx.arc(LX, 336, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 燈泡兩條引線旁的 ＋／−（vₛ＞0：上引線 ＋）
  function drawPolarity() {
    const pk = S.src === 'ac' ? Math.SQRT2 * vsRms() : vsPeakDC();
    const a = clamp((Math.abs(S.vs) / Math.max(1e-6, pk) - 0.2) / 0.2, 0, 1); if (a < 0.05 || Math.abs(S.vs) < 0.3) return;
    const top = S.vs > 0 ? '+' : '−', bot = S.vs > 0 ? '−' : '+';
    [[226, top], [366, bot]].forEach(([y, s]) => {
      const col = s === '+' ? CHG_POS : C.electron, x = 506;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.bg; ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      text(s, x, y - 1, col, 24, 'center', a);
    });
  }
  function drawCircuit() {
    const pa = priA(), pb = priB(), bw = barW();
    if (S.src === 'ac') { band([pa, pb], bw.p, 0.32); band([secA, secB], bw.s, 0.32); }
    if (S.src === 'dc') { wire([pa[0], pa[1], { x: SW_A, y: COIL_T }]); wire([{ x: SW_B, y: COIL_T }, pa[2]]); }
    else wire(pa);
    wire(pb); wire(secA); wire(secB);
    // 一次側流動記號：只在直流（接通時 Iₚ 由電池上端流出）
    if (S.src === 'dc') {
      const a = clamp((S.ipN - 0.05) / 0.15, 0, 1);
      flowMarks(pa, S.qp, 1, a, 1); flowMarks(pb, S.qp - polyLen(pa), 1, a, 1);
    }
    // 二次側：vₛ＞0 → 由上引線流向燈泡
    const is = S.vs / R_LOAD, a2 = clamp(Math.abs(is) / 0.03, 0, 1) * (S.src === 'ac' ? 1 : clamp(Math.abs(S.vs) / Math.max(0.5, vsPeakDC() * 0.25), 0, 1));
    const dir = S.vs >= 0 ? 1 : -1;
    flowMarks(secA, S.qs, dir, a2, 1); flowMarks(secB, S.qs - polyLen(secA), dir, a2, 1);
    if (S.src === 'dc') { drawBattery(); drawSwitch(); } else drawACSource();
    drawLampBody();
    drawPolarity();
  }

  // ───────── 標籤（左側） ─────────
  function drawLabels() {
    const vs = vsRms();
    text(tr('一次線圈', 'Primary coil'), LCX, 92, C.orange, 22);
    text(tr('二次線圈', 'Secondary coil'), RCX, 92, C.cyan, 22);
    text(tr(`Nₚ＝${S.np} 匝`, `Nₚ = ${S.np} turns`), LCX, 506, C.orange, 22);
    text(tr(`Nₛ＝${S.ns} 匝`, `Nₛ = ${S.ns} turns`), RCX, 506, C.cyan, 22);
    if (S.src === 'ac') {
      text(tr(`Vₚ＝${VP_AC} V`, `Vₚ = ${VP_AC} V`), LCX, 536, C.orange, 22);
      text(tr(`Vₛ＝${fmt(vs)} V`, `Vₛ = ${fmt(vs)} V`), RCX, 536, C.cyan, 22);
      text(tr('交流電', 'AC'), 116, 258, C.white, 22);
      text(`${VP_AC} V`, 116, 288, C.orange, 22);
    } else {
      text(tr(`Vₚ：直流 ${VP_DC} V`, `Vₚ: DC ${VP_DC} V`), LCX, 536, C.orange, 22);
      const pulse = Math.abs(S.vs) > 0.12 * vsPeakDC() && Math.abs(S.vs) > 0.05;
      text(pulse ? tr('Vₛ：瞬間脈衝', 'Vₛ: brief pulse') : tr('Vₛ＝0', 'Vₛ = 0'), RCX, 536, pulse ? C.yellow : C.cyan, 22);
      text(tr('電池', 'Battery'), 116, 258, C.white, 22);
      text(`${VP_DC} V`, 116, 288, C.orange, 22);
      text(S.closed ? tr('開關：接通', 'Switch: on') : tr('開關：切斷', 'Switch: off'), 106, 172, S.closed ? C.yellow : C.white, 22);
    }
    text('Iₚ', 106, 422, C.current, 24);
    text('Iₛ', 574, 226, C.current, 24);
    // 燈泡標籤與狀態
    text(tr('額定 110 V 燈泡', '110 V-rated bulb'), LX + 8, 420, C.white, 22);
    const key = lampKey();
    const st = { off: tr('幾乎不亮', 'Barely glowing'), dim: tr('偏暗', 'Dim'), ok: tr('正常亮度', 'Normal brightness'), over: tr('太亮了，會燒壞！', 'Too bright — burns out!') }[key];
    const col = { off: C.muted, dim: C.yellow, ok: C.green, over: C.current }[key];
    wrap(st, 160, 22).slice(0, 2).forEach((s, i) => text(s, LX + 8, 448 + i * 26, col, 22));
    // 缺口
    const gapW = S.off;
    if (gapW > 52) text(tr('缺口', 'Gap'), CORE.x0 + gapW / 2, CORE.y0 + CORE.th / 2, C.purple, 22, 'center', clamp((gapW - 52) / 20, 0, 1));
    text(tr('軟鐵芯', 'Soft-iron core'), (CORE.x0 + CORE.x1) / 2, 398, C.white, 22);
    if (S.src === 'dc' && Math.abs(S.vs) > 0.06 * vsPeakDC() && Math.abs(S.vs) > 0.03) text('Bᵢ', SX + 26, AXY - 0, C.indPurple, 24);
  }

  // ───────── 右側：讀數、電流長條、示波器 ─────────
  function drawReadouts() {
    const dc = S.src === 'dc', vs = vsRms();
    const tag = isUp() ? tr('升壓', 'step-up') : isDown() ? tr('降壓', 'step-down') : tr('不變', 'same');
    const lampShort = { off: tr('幾乎不亮', 'barely lit'), dim: tr('偏暗', 'dim'), ok: tr('正常', 'normal'), over: tr('太亮，會燒壞', 'too bright!') }[lampKey()];
    const rows = [
      [tr('Vₚ（電源）', 'Vₚ (source)'), dc ? tr(`${VP_DC} V 直流`, `${VP_DC} V DC`) : tr(`${VP_AC} V 交流`, `${VP_AC} V AC`), C.orange],
      [tr('Vₛ（輸出）', 'Vₛ (output)'), dc ? (Math.abs(S.vs) < 0.05 ? '0 V' : (S.vs > 0 ? '+' : '−') + fmt(Math.abs(S.vs)) + ' V') : fmt(vs) + ' V', C.cyan],
      [tr('匝數比 Nₛ：Nₚ', 'Turns Nₛ : Nₚ'), tr(`${S.ns}：${S.np} ${tag}`, `${S.ns} : ${S.np} ${tag}`), C.yellow],
      [tr('磁通量傳過去', 'Flux passed on'), kPct() + '%', C.purple],
      [tr('燈泡', 'Bulb'), lampShort, lampKey() === 'over' ? C.current : C.white]
    ];
    rows.forEach(([k, v, col], i) => {
      const y = 86 + i * 32;
      text(k, RX0, y, C.muted, 22, 'left');
      text(v, RX1, y, col, 22, 'right');
    });
    if (dc) {
      const pulsing = S.evt && S.t - S.evtT < 1.6;
      const s1 = !S.closed && !pulsing ? tr('開關切斷：沒有電流', 'Switch off: no current')
        : pulsing ? (S.evt === 'on' ? tr('接通瞬間：Φ 增加中', 'Switching on: Φ rising') : tr('切斷瞬間：Φ 減少中', 'Switching off: Φ falling'))
          : tr('接通、電流穩定：Φ 不變', 'On, steady current: Φ constant');
      let y = 254;
      wrap(s1, RX1 - RX0, 22).slice(0, 2).forEach(s => { text(s, RX0, y, pulsing ? C.yellow : C.white, 22, 'left'); y += 28; });
      wrap(tr('只有 Φ 改變時，二次側才有電壓', 'Only a changing Φ gives the secondary a voltage'), RX1 - RX0, 20).slice(0, 2).forEach(s => { text(s, RX0, y, C.muted, 20, 'left'); y += 25; });
      return;
    }
    // 交流：電流長條（粗細＝相對大小）＋功率守恆
    const bw = barW(), ip = ipRms(), is = isRms(), bx0 = RX0 + 40, bx1 = RX0 + 196;
    [[tr('Iₚ', 'Iₚ'), bw.p, ip, 250, C.orange], [tr('Iₛ', 'Iₛ'), bw.s, is, 286, C.cyan]].forEach(([nm, w, I, y, col]) => {
      text(nm, RX0, y, col, 22, 'left');
      ctx.save(); ctx.strokeStyle = C.current; ctx.lineCap = 'round'; ctx.lineWidth = w; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.moveTo(bx0 + w / 2, y); ctx.lineTo(bx1 - w / 2, y); ctx.stroke(); ctx.restore();
      text(fmtA(I) + ' A', RX1, y, C.current, 22, 'right');
    });
    text(`Vₚ·Iₚ ≈ Vₛ·Iₛ ＝ ${fmt(vs * is, vs * is >= 10 ? 1 : 2)} W`, RX0, 322, C.white, 22, 'left');
  }
  function drawScope() {
    const dc = S.src === 'dc', F = fs(), clip = clipped();
    text(tr('示波器（最近 4 秒）', 'Scope (last 4 s)'), RX0, 356, C.white, 22, 'left');
    text(`±${F} V`, RX1, 356, C.muted, 20, 'right');
    ctx.save();
    ctx.fillStyle = 'rgba(16,45,38,.6)'; ctx.fillRect(WX, WT, WW, WB - WT);
    ctx.strokeStyle = 'rgba(85,233,255,.16)'; ctx.lineWidth = 2;
    for (let k = Math.ceil((S.t - WIN) * 2) / 2; k <= S.t; k += 0.5) {
      const x = WX + WW - (S.t - k) / WIN * WW; if (x <= WX + 1) continue;
      ctx.beginPath(); ctx.moveTo(x, WT); ctx.lineTo(x, WB); ctx.stroke();
    }
    [WY0 - AMP, WY0 + AMP].forEach(y => { ctx.beginPath(); ctx.moveTo(WX, y); ctx.lineTo(WX + WW, y); ctx.stroke(); });
    ctx.strokeStyle = '#58736a'; ctx.lineWidth = 3; ctx.strokeRect(WX, WT, WW, WB - WT);
    ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(WX, WY0); ctx.lineTo(WX + WW, WY0); ctx.stroke();
    ctx.restore();
    text('+', WX - 16, WY0 - AMP, C.white, 24); text('0', WX - 16, WY0, C.white, 22); text('−', WX - 16, WY0 + AMP, C.white, 24);
    const xt = t => WX + WW - (S.t - t) / WIN * WW, yv = v => WY0 - clamp(v / F, -1.08, 1.08) * AMP;
    // 直流開關事件線
    if (dc) {
      let lastX = -1e9;
      S.events.filter(e => e.t > S.t - WIN).forEach(e => {
        const x = xt(e.t);
        ctx.save(); ctx.strokeStyle = 'rgba(255,243,106,.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(x, WT + 2); ctx.lineTo(x, WB - 2); ctx.stroke(); ctx.restore();
        const s = e.type === 'on' ? tr('接通', 'On') : tr('切斷', 'Off'), w = textW(s, 20);
        if (x - lastX > w + 8 && x - w / 2 > WX + 2 && x + w / 2 < WX + WW - 2) { text(s, x, WB + 15, C.yellow, 20); lastX = x; }
      });
    }
    ctx.save(); ctx.beginPath(); ctx.rect(WX + 1, WT - 10, WW - 1, WB - WT + 20); ctx.clip();
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const wv = S.wave.filter(w => w.t > S.t - WIN - 0.1);
    const trace = (key, col) => {
      ctx.strokeStyle = col; ctx.beginPath(); let started = false;
      wv.forEach(w => { if (key === 'vp' && w.dc) { started = false; return; } const x = xt(w.t), y = yv(w[key]); if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y); });
      ctx.stroke();
    };
    if (!dc) trace('vp', C.orange);
    trace('vs', C.cyan);
    ctx.restore();
    // 右端圓點
    [[dc ? null : S.vp, C.orange], [S.vs, C.cyan]].forEach(([v, col]) => {
      if (v === null) return;
      ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = C.bg; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(WX + WW, yv(v), 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    });
    // 圖例（框內右上）與超出刻度
    if (!dc) { text('Vₛ', WX + WW - 18, WT + 18, C.cyan, 22, 'right'); text('Vₚ', WX + WW - 62, WT + 18, C.orange, 22, 'right'); }
    else text('Vₛ', WX + WW - 18, WT + 18, C.cyan, 22, 'right');
    if (clip) text(tr('超出刻度！', 'Off scale!'), WX + 10, WT + 18, C.current, 20, 'left');
    // 下方註記
    const note = dc ? tr('直流：只有開關那一瞬間才有電壓', 'DC: a voltage only at the instant you switch') : tr('真實市電 60 Hz，這裡放慢', 'Real mains is 60 Hz; slowed down here');
    const ls = wrap(note, RX1 - RX0, 20).slice(0, 2), y0 = ls.length > 1 ? 558 : 566;
    ls.forEach((s, i) => text(s, RX1, y0 + i * 23, dc ? C.pink : C.muted, 20, 'right'));
  }

  // ───────── 訊息（畫布頂端＋說明框，同一個狀態） ─────────
  function msgKey() {
    if (S.src === 'dc') {
      if (S.evt && S.t - S.evtT < 1.6) return S.evt === 'on' ? 'dcOn' : 'dcOff';
      return S.closed ? 'dcSteady' : 'dcOpen';
    }
    if (S.over && S.t - S.overT < 3.5) return S.over;
    if (kNow() < 0.97) return 'core';
    return 'ratio';
  }
  function caption() {
    const k = msgKey(), v = fmt(vsRms());
    switch (k) {
      case 'dcOn': return tr('接通瞬間：Φ 增加 → Bᵢ 與 B 反向 → Vₛ 負脈衝', 'Switch on: Φ rises → Bᵢ opposes B → a negative pulse in Vₛ');
      case 'dcOff': return tr('切斷瞬間：Φ 減少 → Bᵢ 與 B 同向 → Vₛ 正脈衝', 'Switch off: Φ falls → Bᵢ along B → a positive pulse in Vₛ');
      case 'dcSteady': return tr('電流穩定：Φ 不變 → Vₛ＝0，燈不亮', 'Steady current: Φ constant → Vₛ = 0, the bulb stays dark');
      case 'dcOpen': return tr('直流：只有按開關那一瞬間才有電壓', 'DC: there is a voltage only at the instant you switch');
      case 'core': return tr(`把鐵芯拉開：磁力線漏掉，Vₛ 變小（${v} V），燈變暗`, `Core pulled open: field lines leak out, Vₛ drops (${v} V), the bulb dims`);
      case 'reset': return tr('鐵芯放回：磁通量全部傳到二次線圈', 'Core closed: all the flux reaches the secondary');
      default:
        if (isUp() && vsRms() > 130) return tr(`匝數比 ${S.ns}：${S.np}，輸出 ${v} V（太高了！）`, `Turns ratio ${S.ns}:${S.np}, output ${v} V (too high!)`);
        if (isUp()) return tr(`Nₛ＞Nₚ：升壓，電壓升到 ${v} V、電流變小`, `Nₛ > Nₚ: step-up — voltage rises to ${v} V, current gets smaller`);
        if (isDown()) return tr(`Nₛ＜Nₚ：降壓，電壓降到 ${v} V、電流變大`, `Nₛ < Nₚ: step-down — voltage drops to ${v} V, current gets larger`);
        return tr('Nₛ＝Nₚ：電壓不變，還是 110 V', 'Nₛ = Nₚ: the voltage stays at 110 V');
    }
  }
  const captionColor = () => { const k = msgKey(); return k === 'core' ? C.purple : k.startsWith('dc') ? C.pink : (isUp() && vsRms() > 130 && k === 'ratio') ? C.current : C.yellow; };
  function resultHTML() {
    const k = msgKey(), v = fmt(vsRms()), is = fmtA(isRms()), ip = fmtA(ipRms());
    let main;
    switch (k) {
      case 'dcOn': main = tr('<strong class="pink">接通瞬間</strong>：一次線圈的電流從 0 長起來，Φ 增加 → 二次線圈的 Bᵢ 與 B <strong class="pink">反向</strong>（冷次定律）→ Vₛ 出現一個<strong class="pink">負脈衝</strong>。',
        '<strong class="pink">Switching on</strong>: the primary current grows from 0, so Φ rises → the secondary’s Bᵢ <strong class="pink">opposes</strong> B (Lenz’s law) → a <strong class="pink">negative pulse</strong> in Vₛ.'); break;
      case 'dcOff': main = tr('<strong class="pink">切斷瞬間</strong>：電流消失，Φ 減少 → Bᵢ 與 B <strong class="pink">同向</strong>（想留住磁場）→ Vₛ 出現一個<strong class="pink">正脈衝</strong>，方向和接通時相反。',
        '<strong class="pink">Switching off</strong>: the current vanishes, so Φ falls → Bᵢ points <strong class="pink">along</strong> B (trying to keep the field) → a <strong class="pink">positive pulse</strong>, opposite to switch-on.'); break;
      case 'dcSteady': main = tr('<strong class="pink">直流電流穩定</strong>：鐵芯裡有磁場，但 Φ <strong class="pink">不再改變</strong>，所以 Vₛ＝0、燈不亮——直流電<strong class="pink">無法持續變壓</strong>。再按一次開關看看。',
        '<strong class="pink">Steady DC</strong>: the core is magnetized, but Φ <strong class="pink">no longer changes</strong>, so Vₛ = 0 and the bulb is dark — DC <strong class="pink">cannot be transformed continuously</strong>. Press the switch again.'); break;
      case 'dcOpen': main = tr('<strong class="pink">直流：只有按開關那一瞬間才有電壓</strong>。開關切斷時沒有電流、Φ＝0、Vₛ＝0。按「按開關」，看示波器在接通、切斷時各跳一下。',
        '<strong class="pink">DC: a voltage appears only at the instant you switch</strong>. With the switch off there is no current, Φ = 0 and Vₛ = 0. Press “Flip switch” and watch the scope jump at switch-on and switch-off.'); break;
      case 'core': main = tr(`<strong class="pink">把鐵芯拉開</strong>：磁力線從缺口<strong class="pink">漏到空氣中</strong>，只有 <strong class="yellow">${kPct()}%</strong> 的磁通量傳到二次線圈 → Vₛ 從 ${fmt(ratio() * VP_AC)} V 變小成 <strong class="cyan">${v} V</strong>，燈變暗。軟鐵芯的功用就是把磁場引導過去。`,
        `<strong class="pink">Core pulled open</strong>: field lines <strong class="pink">leak into the air</strong> at the gap, so only <strong class="yellow">${kPct()}%</strong> of the flux reaches the secondary → Vₛ falls from ${fmt(ratio() * VP_AC)} V to <strong class="cyan">${v} V</strong> and the bulb dims. The soft-iron core is there to guide the field across.`); break;
      case 'reset': main = tr(`<strong class="green">鐵芯放回</strong>：鐵芯閉合，磁通量全部傳到二次線圈，Vₛ 回到 <strong class="cyan">${v} V</strong>。`,
        `<strong class="green">Core closed</strong>: all the flux reaches the secondary again, so Vₛ is back to <strong class="cyan">${v} V</strong>.`); break;
      default:
        if (isUp()) main = tr(`<strong class="yellow">Nₛ＞Nₚ：升壓</strong>。匝數比 ${S.ns}：${S.np}，輸出 <strong class="cyan">${v} V</strong>${vsRms() > 130 ? '——<strong class="pink">比燈泡額定 110 V 高太多，燈會燒壞！</strong>' : ''}；電壓升高、電流變小：Iₛ＝${is} A ＜ Iₚ＝${ip} A。`,
          `<strong class="yellow">Nₛ > Nₚ: step-up</strong>. Turns ratio ${S.ns}:${S.np}, output <strong class="cyan">${v} V</strong>${vsRms() > 130 ? ' — <strong class="pink">far above the bulb’s 110 V rating; it would burn out!</strong>' : ''}. Voltage up, current down: Iₛ = ${is} A < Iₚ = ${ip} A.`);
        else if (isDown()) main = tr(`<strong class="yellow">Nₛ＜Nₚ：降壓</strong>。匝數比 ${S.ns}：${S.np}，輸出 <strong class="cyan">${v} V</strong>${vsRms() < 20 ? '，燈幾乎不亮' : ''}；電壓降低、電流變大：Iₛ＝${is} A ＞ Iₚ＝${ip} A。`,
          `<strong class="yellow">Nₛ < Nₚ: step-down</strong>. Turns ratio ${S.ns}:${S.np}, output <strong class="cyan">${v} V</strong>${vsRms() < 20 ? ', the bulb barely glows' : ''}. Voltage down, current up: Iₛ = ${is} A > Iₚ = ${ip} A.`);
        else main = tr(`<strong class="yellow">Nₛ＝Nₚ</strong>：匝數比 ${S.ns}：${S.np}，輸出還是 <strong class="cyan">${v} V</strong>，燈泡正常亮；Iₛ＝Iₚ＝${is} A。`,
          `<strong class="yellow">Nₛ = Nₚ</strong>: turns ratio ${S.ns}:${S.np}, output stays <strong class="cyan">${v} V</strong> and the bulb glows normally; Iₛ = Iₚ = ${is} A.`);
    }
    const tip = S.src === 'dc'
      ? tr('變壓器要靠<strong class="yellow">不斷改變的磁通量</strong>才能感應電壓，所以要用交流電。', 'A transformer needs a <strong class="yellow">changing flux</strong> to induce a voltage — that is why it runs on AC.')
      : tr('Vₛ／Vₚ＝Nₛ／Nₚ（鐵芯閉合時）；理想變壓器功率守恆 <strong class="yellow">Vₚ·Iₚ ≈ Vₛ·Iₛ</strong>，負載當成 110 Ω 電阻。示波器上 Vₚ、Vₛ 同相；磁通量 Φ 與它們差 ¼ 週期。',
        'Vₛ/Vₚ = Nₛ/Nₚ (core closed). An ideal transformer conserves power: <strong class="yellow">Vₚ·Iₚ ≈ Vₛ·Iₛ</strong>, with the bulb treated as a 110 Ω resistor. On the scope Vₚ and Vₛ are in phase; the flux Φ is ¼ cycle away from them.');
    const core = kNow() > 0.995 ? tr('鐵芯閉合', 'core closed') : tr(`鐵芯拉開（傳過去 ${kPct()}%）`, `core open (${kPct()}% passed on)`);
    const src = S.src === 'dc' ? tr(`直流電池 ${VP_DC} V（開關${S.closed ? '接通' : '切斷'}）`, `DC battery ${VP_DC} V (switch ${S.closed ? 'on' : 'off'})`) : tr(`交流 ${VP_AC} V`, `AC ${VP_AC} V`);
    const setup = tr(`目前：${src}｜Nₚ＝${S.np}、Nₛ＝${S.ns}｜${core}`, `Now: ${src} | Nₚ = ${S.np}, Nₛ = ${S.ns} | ${core}`);
    return `${main}<br>${tip}<br><span class="green">${setup}</span>`;
  }
  function writeResult() {
    if (!res) return;
    const h = resultHTML();
    if (h !== lastRes) { lastRes = h; res.innerHTML = h; }
  }

  // ───────── 畫一幀 ─────────
  function render() {
    if (!ctx) return;
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    drawLampGlow();
    coil(LCX, S.np, Math.PI, C.orange, false);
    coil(RCX, S.ns, 0, C.cyan, false);
    drawLeak();
    drawCoreFixed();
    drawYoke();
    drawB();
    coil(LCX, S.np, Math.PI, C.orange, true);
    coil(RCX, S.ns, 0, C.cyan, true);
    drawBi();
    drawCircuit();
    drawLabels();
    drawReadouts();
    drawScope();
    const ls = wrap(caption(), 950, 24), y0 = ls.length > 1 ? 22 : 36;
    ls.forEach((s, i) => text(s, W / 2, y0 + i * 30, captionColor(), 24));
    if (S.hintA > 0.01) {
      const s = tr('👆 水平拖曳鐵芯上方橫條', '👆 Drag the top bar of the core sideways'), w = textW(s, 24) + 28, cx = 318, y = 572;
      const pulse = 0.75 + 0.25 * Math.sin(S.t * 4);
      ctx.save(); ctx.globalAlpha = S.hintA; ctx.fillStyle = PANEL; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
      rrect(cx - w / 2, y - 19, w, 38, 10); ctx.fill(); ctx.stroke(); ctx.restore();
      text(s, cx, y + 1, C.cyan, 24, 'center', S.hintA * pulse);
    }
  }

  // ───────── 物理步進 ─────────
  function step(dt) {
    S.t += dt;
    if (!(ptr && ptr.on)) {
      S.off += (S.offT - S.off) * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(S.offT - S.off) < 0.05) S.off = S.offT;
    }
    const k = kNow(), r = ratio();
    if (S.src === 'ac') {
      S.acT += dt;
      const ph = OM * S.acT;
      S.phi = Math.cos(ph); S.dphi = -OM * Math.sin(ph);
      S.vp = Math.SQRT2 * VP_AC * Math.sin(ph);
      S.vs = k * r * S.vp;
      S.ipN = 0;
    } else {
      // 指數變化；剩不到 0.4% 就當作已穩定（Φ 不再變 → vₛ 確實回到 0）
      if (S.closed) { S.dphi = (1 - S.phi) / DC.tOn; S.phi += (1 - S.phi) * (1 - Math.exp(-dt / DC.tOn)); if (1 - S.phi < 0.004) { S.phi = 1; S.dphi = 0; } }
      else { S.dphi = -S.phi / DC.tOff; S.phi *= Math.exp(-dt / DC.tOff); if (S.phi < 0.004) { S.phi = 0; S.dphi = 0; } }
      S.vp = S.closed ? VP_DC : 0;
      S.vs = -k * r * VP_DC * DC.tOn * S.dphi;
      if (Math.abs(S.vs) < 1e-3) S.vs = 0;
      S.ipN = S.closed ? S.phi : 0;
    }
    // 流動記號位移（速度 ∝ 電流）
    const is = S.vs / R_LOAD;
    S.qs += 70 * sgn(is) * Math.min(2.2, Math.pow(Math.abs(is), 0.7)) * dt;
    S.qp += 60 * S.ipN * dt;
    S.wave.push({ t: S.t, vp: S.vp, vs: S.vs, dc: S.src === 'dc' });
    while (S.wave.length > 2 && S.wave[1].t < S.t - WIN - 0.2) S.wave.shift();
    while (S.events.length && S.events[0].t < S.t - WIN - 0.2) S.events.shift();
    if (S.dragged && S.hintA > 0) S.hintA = Math.max(0, S.hintA - dt / 0.6);
  }

  // ───────── 動畫迴圈（單一 RAF；看不見就停） ─────────
  function visibleNow() { return !!(cv && cv.getClientRects().length && cv.getBoundingClientRect().width > 0); }
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden) return;
    if (!visibleNow() || !S.visible) { poll(); return; }
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    step(dt);
    render();
    writeResult();
    syncResetBtn();
    S.raf = requestAnimationFrame(frame);
  }
  function poll() {
    if (S.timer || !S.on) return;
    S.timer = setTimeout(() => { S.timer = 0; sync(); }, 300);
  }
  function sync() {
    const want = S.on && !document.hidden;
    if (want && !S.raf && !S.timer) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want) { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; if (S.timer) clearTimeout(S.timer); S.timer = 0; }
  }

  // ───────── 操作 ─────────
  function override(k) { S.over = k; S.overT = S.t; }
  function setSrc(s) {
    if (S.src === s) return;
    S.src = s; S.wave = []; S.events = []; S.evt = null; S.phi = 0; S.dphi = 0; S.vs = 0; S.vp = 0; S.closed = false;
    if (s === 'ac') S.acT = 0;
  }
  const ACTIONS = {
    ac: () => { setSrc('ac'); override('ratio'); },
    dc: () => { setSrc('dc'); },
    sw: () => { if (S.src !== 'dc') return; S.closed = !S.closed; S.evt = S.closed ? 'on' : 'off'; S.evtT = S.t; S.events.push({ t: S.t, type: S.evt }); },
    reset: () => { S.offT = 0; override('reset'); }
  };
  NP_OPT.forEach(n => { ACTIONS['np' + n] = () => { S.np = n; override('ratio'); }; });
  NS_OPT.forEach(n => { ACTIONS['ns' + n] = () => { S.ns = n; override('ratio'); }; });
  function act(key) {
    if (!ACTIONS[key]) return;
    S.actions++; ACTIONS[key](); updateUI();
    if (!S.raf) render();
  }
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [tr('一次匝數 Nₚ', 'Primary turns Nₚ'), NP_OPT.map(n => ['np' + n, tr(`${n} 匝`, `${n} turns`)])],
      [tr('二次匝數 Nₛ', 'Secondary turns Nₛ'), NS_OPT.map(n => ['ns' + n, tr(`${n} 匝`, `${n} turns`)])],
      [tr('電源', 'Power'), [['ac', tr('交流 110 V', 'AC 110 V')], ['dc', tr('直流電池 9 V', 'DC battery 9 V')], ['sw', '']]],
      [tr('鐵芯', 'Core'), [['reset', tr('鐵芯放回', 'Close the core')]]]
    ];
    for (const [name, btns] of groups) {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      for (const [key, t] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = t;
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
  }
  function updateUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => {
      const k = b.dataset.act;
      let on = false;
      if (k.startsWith('np')) on = S.np === +k.slice(2);
      else if (k.startsWith('ns')) on = S.ns === +k.slice(2);
      else if (k === 'ac' || k === 'dc') on = S.src === k;
      else if (k === 'sw') {
        on = S.closed; b.style.display = S.src === 'dc' ? '' : 'none';
        b.textContent = S.closed ? tr('按開關（現在：接通）', 'Flip switch (now: on)') : tr('按開關（現在：切斷）', 'Flip switch (now: off)');
      } else if (k === 'reset') { b.disabled = S.offT === 0 && S.off === 0; }
      if (k !== 'reset') { b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); }
    });
    writeResult();
    if (cv) cv.setAttribute('aria-label', tr('變壓器實驗台：水平拖曳鐵芯上方橫條（或按左右方向鍵）把鐵芯拉開，按鈕改變匝數與電源',
      'Transformer bench: drag the top bar of the core sideways (or use the arrow keys) to open the core; buttons change the turns and the power source'));
  }

  // ───────── 拖曳（只有按住橫條才接管） ─────────
  function toLogical(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / (r.width || W), y: (e.clientY - r.top) * H / (r.height || H) }; }
  function onBar(p) { const r = yokeRect(); return p.x >= r.x - 10 && p.x <= r.x + r.w + 10 && p.y >= r.y - 10 && p.y <= r.y + r.h + 10; }
  let lastReset = null;
  function syncResetBtn() {
    const dis = S.offT === 0 && S.off === 0;
    if (dis !== lastReset) { lastReset = dis; const b = ctrl && ctrl.querySelector('.lab-btn[data-act="reset"]'); if (b) b.disabled = dis; }
  }
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = toLogical(e);
    if (!onBar(p)) return;                                     // 不在橫條上：交給頁面（垂直捲動照常）
    ptr = { id: e.pointerId, x0: p.x, off0: S.off, on: true };
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 不支援就算了 */ }
    cv.classList.add('dragging');
    S.over = null;
    if (e.cancelable) e.preventDefault();
  }
  function onMove(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const p = toLogical(e);
    S.off = S.offT = clamp(ptr.off0 + (p.x - ptr.x0), 0, OFF_MAX);
    if (Math.abs(p.x - ptr.x0) > 4) S.dragged = true;
    syncResetBtn();
    if (e.cancelable) e.preventDefault();
  }
  function onUp(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    cv.classList.remove('dragging');
    try { cv.releasePointerCapture(e.pointerId); } catch (_) { /* 已釋放 */ }
    ptr = null; syncResetBtn();
  }
  function onKey(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    S.dragged = true; S.over = null;
    S.offT = clamp(S.offT + (e.key === 'ArrowRight' ? 25 : -25), 0, OFF_MAX);
    syncResetBtn();
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (S.on) deactivate();
    cv = document.getElementById('transLabCanvas');
    ctrl = document.getElementById('transLabControls');
    res = document.getElementById('transLabResult');
    if (!cv) return;
    ctx = cv.getContext('2d');
    S.on = true; S.visible = true; lastRes = ''; lastReset = null;
    S.wave = []; S.events = [];
    buildControls(); updateUI();
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    }
    render(); sync();
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (S.timer) { clearTimeout(S.timer); S.timer = 0; }
    if (cv) {
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('keydown', onKey);
      cv.classList.remove('dragging');
    }
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
    if (ctrl) ctrl.innerHTML = '';
    if (res) res.innerHTML = '';
    lastRes = ''; ptr = null;
  }
  function relang() { if (!S.on) return; lastRes = ''; lastReset = null; buildControls(); updateUI(); render(); }
  function _state() {
    return {
      np: S.np, ns: S.ns, src: S.src, closed: S.closed, off: +S.off.toFixed(1), k: +kNow().toFixed(3), kPct: kPct(),
      vsRms: +vsRms().toFixed(2), isRms: +isRms().toFixed(3), ipRms: +ipRms().toFixed(3),
      vp: +S.vp.toFixed(2), vs: +S.vs.toFixed(3), phi: +S.phi.toFixed(3), lamp: lampKey(), clipped: clipped(),
      secDir: Math.abs(S.vs) < 0.05 ? null : S.vs > 0 ? 'top→bulb' : 'bottom→bulb', bi: S.src !== 'dc' || Math.abs(S.vs) < 0.05 ? null : S.vs > 0 ? 'up(along)' : 'down(oppose)',
      msg: msgKey(), caption: caption(), waveN: S.wave.length, events: S.events.length,
      hintA: +S.hintA.toFixed(2), dragged: S.dragged, dragging: !!(ptr && ptr.on), running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }
  // 測試用：直接把橫條放到某個位置
  function _setOff(px) { S.off = S.offT = clamp(px, 0, OFF_MAX); syncResetBtn(); }

  EmLab.trans = { activate, deactivate, relang, _state, _setOff };
})();

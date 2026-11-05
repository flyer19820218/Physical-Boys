/* electromagnetic_induction_4_cooker_1105_v1.js — 「電磁爐」分頁動畫（#cookerCanvas，邏輯 1000×600）
 *
 * 契約：window.EmiAnim.cooker = { activate(sceneId), deactivate(), relang(), _info(), _state() }
 * 一個場景：'cooker'。
 * 依賴頁面現成的（直接呼叫，不複製）：tr、C、TAU。其餘小工具（換行、外框箭頭、⊙⊗ 記號）在本檔內。
 * 畫布不綁任何事件；唯一控制是 #steps-cooker 裡的 5 個步驟鈕。
 * 畫面是「場景時間 t 的純函式」：每步 tl 從 0 起算；交流相位 ph＝2π·tl（1 Hz：畫面上一個週期＝1 秒，
 *   各步長度都是整數秒，所以相位與全域 t 一致）；B、Iᵢ、Bᵢ、熱度 heat、水溫、氣泡位置、俯視圖電流記號位移
 *   （＝∫Iᵢ dt 的解析式）全由 tl 算出，不累積狀態。
 *
 * ── 步驟表（共 38.0 s）──────────────────────────────────────────
 *   1 磁場來回   7.0 s  [0.0]  剖面：爐面＋平面螺旋線圈（⊙⊗ 紅＝線圈電流）、綠色 B 力線箭頭同步變大、變小、反向；
 *                              右欄：俯視鍋底（B 的 ⊙／⊗）、B–時間 滑動曲線（1 秒＝1 週期）、四格「↑增強／↑減弱／↓增強／↓減弱」
 *   2 渦電流     8.0 s  [7.0]  鍋底出現粉紅渦電流（剖面 ⊙⊗）、紫色 Bᵢ；右欄俯視：粉紅環形箭頭＋中心 Bᵢ（⊙／⊗），
 *                              方向表三列（B／Bᵢ／俯視轉向）×四格，亮起目前那一格
 *   3 反向對照   7.0 s  [15.0] 兩個時刻並排：①ph＝45°（B 向上增強）②ph＝225°（B 向下增強）；各有剖面示意＋俯視環；
 *                              目前相位落在哪一段就亮哪一框（環上的箭頭持續流動）
 *   4 發熱       8.0 s  [22.0] heat＝min(1, tl/6)：鍋底由灰 → 暗紅 → 橘紅 → 白熱，水溫計上升、冒泡、冒蒸氣；
 *                              右欄 P＝I²R、I 與 I² 即時長條（I 反向時 I² 仍為正）
 *   5 能量鏈     8.0 s  [30.0] heat＝1；電能 → 改變的磁場 → 渦電流 → 熱 依序點亮（tl＝0.5／1.7／2.9／4.1 s），
 *                              「面板本身不燙，是鍋子自己發熱」「直流電不會」；停留到 8 s 後停住。
 * 每步開頭 0.35 s 淡入；右下角固定寫「實際上各國的交流電頻率不同，動畫降成 1 Hz 是為了方便觀察。」
 *
 * ── 座標與符號約定 ────────────────────────────────────────────
 *   剖面側視：x 向右、y 向上（物理），z 朝觀看者；剖面切過線圈與鍋底中心。
 *   俯視圖：從上往下看（觀看者在 +y），畫面右＝+x、畫面上＝−z（遠離剖面觀看者）。
 *   線圈電流 I＝sin ph；I＞0 定義為「俯視逆時針」⇒ 右手螺旋 B 向上 ⇒ B＝sin ph（向上為正）。
 *     俯視逆時針 ⇒ 剖面左側導線 ⊙（流出畫面）、右側導線 ⊗（流入畫面）。
 *   Φ（向上為正）∝ B；渦電流（電阻性近似）Iᵢ ∝ −dΦ/dt ⇒ Iᵢ＝−cos ph；Iᵢ＞0＝俯視逆時針 ⇒ Bᵢ 向上；Bᵢ＝Iᵢ。
 *
 * ── 方向表 ─────────────────────────────────────────────────
 *   ph          線圈電流（俯視）  B      Φ（向上為正）   Iᵢ＝−cos   Bᵢ    渦電流（俯視）  剖面鍋底 左／右   畫面
 *   0°→90°      逆時針（I＞0）    ↑      向上、增加      −          ↓     順時針          ⊗／⊙            綠箭頭↑變長、紫箭頭↓、粉環順時針
 *   90°→180°    逆時針（I＞0）    ↑      向上、減少      ＋          ↑     逆時針          ⊙／⊗            綠箭頭↑變短、紫箭頭↑、粉環逆時針
 *   180°→270°   順時針（I＜0）    ↓      向下、增加      ＋          ↑     逆時針          ⊙／⊗            綠箭頭↓變長、紫箭頭↑、粉環逆時針
 *   270°→360°   順時針（I＜0）    ↓      向下、減少      −          ↓     順時針          ⊗／⊙            綠箭頭↓變短、紫箭頭↓、粉環順時針
 *   驗算 ①（B 向上增強）：Bᵢ 須向下反抗 → 右手大拇指朝下 → 四指從上往下看是順時針 ✓（剖面：右 ⊙、左 ⊗，
 *         ⊙ 導線的磁場繞向在觀看者看來逆時針，其左側（鍋底中心）向下 ✓）。
 *   驗算 ②（半週期後 B 向下增強）：Bᵢ 須向上反抗 → 大拇指朝上 → 俯視逆時針 ✓（剖面：左 ⊙、右 ⊗）。
 *   ph＝90°、270°：|B| 最大、變化率 0 ⇒ Iᵢ＝0；ph＝0°、180°：B＝0、變化最快 ⇒ |Iᵢ| 最大。
 *   第 3 步兩框即為 ph＝45°（第一列）與 225°（第三列）；畫面箭頭、方向表、說明文字與結果框全由同一組
 *   B＝sin ph、Iᵢ＝−cos ph 的正負決定，不另外寫死。
 *   發熱功率 P＝Iᵢ²R ∝ cos² ph ≥ 0：電流方向反過來仍發熱。
 *
 * 字級：畫布文字 20–32px（說明 24、標籤 22、次要 20），Noto Sans TC 900；量寬換行，不縮字。
 */
(function () {
  'use strict';
  window.EmiAnim = window.EmiAnim || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const CX = 290;                                                   // 剖面中心 x
  const POT = { x0: 160, x1: 420, rim: 150, baseT: 314, baseB: 332, wall: 10, water: 205 };
  const PANEL = { x0: 110, x1: 470, y0: 334, y1: 350 };
  const BODY = { x0: 110, x1: 470, y0: 350, y1: 452 };
  const COIL_Y = 395, COIL_OFF = [40, 70, 100, 130], COIL_R = 12;
  const BL_DX = [-118, -82, 82, 118], BL_Y0 = 412, BL_Y1 = 172;    // B 力線
  const EDDY_OFF = [75, 110], EDDY_Y = 323;
  const LX = 482, LW = 140;                                        // 剖面右側標籤欄
  const RX = 640, RW = 345, RC = RX + RW / 2;                      // 右欄
  const COPPER = '#c9823f', METAL = [125, 138, 135];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const font = s => `900 ${s}px ${FONT}`;

  // ───────── 文字工具（量寬換行，不縮字） ─────────
  function wrap(ctx, s, maxW, size) {
    ctx.save(); ctx.font = font(size);
    const latin = !/[㐀-鿿]/.test(s);
    const units = latin ? s.split(' ') : Array.from(s);
    const out = []; let cur = '';
    for (const u of units) {
      const test = cur ? (latin ? cur + ' ' + u : cur + u) : u;
      if (ctx.measureText(test).width > maxW && cur) {
        if (!latin && /^[，。、：；）」！？]/.test(u) && cur.length > 1) { const a = Array.from(cur), last = a.pop(); out.push(a.join('')); cur = last + u; }
        else { out.push(cur); cur = latin ? u : u.trimStart(); }
      } else cur = test;
    }
    if (cur) out.push(cur);
    ctx.restore(); return out;
  }
  function text(ctx, s, x, y, color, size, align, alpha) {
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.font = font(size); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = C.bg; ctx.lineWidth = 6; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
  }
  function lines(ctx, arr, x, y, color, size, lh, align, alpha) { arr.forEach((s, k) => text(ctx, s, x, y + k * lh, color, size, align, alpha)); }
  function para(ctx, s, x, y, maxW, color, size, lh, align, alpha) {
    const ls = wrap(ctx, s, maxW, size); lines(ctx, ls, x, y, color, size, lh, align, alpha); return ls.length * lh;
  }
  function tw(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }

  function arr(ctx, x1, y1, x2, y2, color, w, head, alpha) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return;
    const h = Math.min(head, L * 0.7);
    const path = () => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.7, y2 - Math.sin(a) * h * 0.7); };
    const tip = () => {
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h);
      ctx.lineTo(x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h); ctx.closePath();
    };
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = C.bg; ctx.lineWidth = w + 5; path(); ctx.stroke(); tip(); ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; path(); ctx.stroke(); tip(); ctx.fill();
    ctx.restore();
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // ⊙（dir＞0，流出畫面／朝觀看者）、⊗（dir＜0，流入畫面／遠離觀看者）
  function sym(ctx, x, y, r, dir, color, alpha, fill) {
    if (alpha < 0.04) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = fill || C.bg; ctx.strokeStyle = color; ctx.lineWidth = Math.max(2.5, r * 0.22);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.lineCap = 'round';
    if (dir > 0) { ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, TAU); ctx.fill(); }
    else { const d = r * 0.5; ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke(); }
    ctx.restore();
  }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function mix(c1, c2, u) { return [0, 1, 2].map(i => Math.round(lerp(c1[i], c2[i], u))); }
  // 熱度 0～1：金屬灰 → 暗紅 → 橘紅 → 白熱
  function heatRGB(h) {
    const S = [[0, METAL], [0.35, [150, 34, 24]], [0.7, [255, 96, 30]], [1, [255, 236, 190]]];
    for (let k = 1; k < S.length; k++) if (h <= S[k][0]) return mix(S[k - 1][1], S[k][1], (h - S[k - 1][0]) / (S[k][0] - S[k - 1][0]));
    return S[S.length - 1][1];
  }
  const rgb = (c, a) => a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // ───────── 物理（全部是 tl 的解析式） ─────────
  function physics(tl) {
    const ph = TAU * tl;
    return { ph, B: Math.sin(ph), I: Math.sin(ph), Ie: -Math.cos(ph), dB: Math.cos(ph), q: Math.floor((((ph % TAU) + TAU) % TAU) / (TAU / 4)) % 4 };
  }

  // ───────── 剖面主圖 ─────────
  function blX(dx, y) { const s = clamp((BL_Y0 - y) / (BL_Y0 - BL_Y1), 0, 1); return CX + dx * (0.1 + 0.9 * Math.pow(s, 1.2)); }
  function drawFieldLines(ctx, B) {
    const m = Math.abs(B), sg = B >= 0 ? 1 : -1;
    BL_DX.forEach(dx => {
      ctx.save(); ctx.strokeStyle = C.green; ctx.globalAlpha = 0.18 + 0.7 * m; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let y = BL_Y0; y >= BL_Y1; y -= 4) { const x = blX(dx, y); y === BL_Y0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
      if (m < 0.08) return;
      [272, 196].forEach(yc => {
        const L = 14 + 22 * m, y1 = yc + sg * L / 2, y2 = yc - sg * L / 2;
        arr(ctx, blX(dx, y1), y1, blX(dx, y2), y2, C.green, 4 + 3 * m, 12 + 10 * m, 0.35 + 0.65 * m);
      });
    });
  }
  function drawCooker(ctx, I, panelNote) {
    // 機身
    ctx.save(); ctx.fillStyle = '#132a23'; ctx.strokeStyle = '#58736a'; ctx.lineWidth = 3;
    rrect(ctx, BODY.x0, BODY.y0, BODY.x1 - BODY.x0, BODY.y1 - BODY.y0, 8); ctx.fill(); ctx.stroke();
    // 線圈下的鐵氧體托板（示意）
    ctx.fillStyle = '#26332f'; ctx.fillRect(CX - 150, COIL_Y + 18, 300, 10);
    ctx.restore();
    // 爐面（玻璃陶瓷）
    ctx.save();
    const g = ctx.createLinearGradient(0, PANEL.y0, 0, PANEL.y1); g.addColorStop(0, '#3c5560'); g.addColorStop(1, '#22343b');
    ctx.fillStyle = g; rrect(ctx, PANEL.x0 - 6, PANEL.y0, PANEL.x1 - PANEL.x0 + 12, PANEL.y1 - PANEL.y0, 4); ctx.fill();
    ctx.strokeStyle = panelNote ? C.cyan : '#7fa3ad'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    // 平面螺旋線圈（剖面：左右各 4 個導線截面）
    const a = clamp(Math.abs(I) / 0.2, 0, 1), dir = I >= 0 ? 1 : -1;
    COIL_OFF.forEach(o => {
      [-1, 1].forEach(side => {
        const x = CX + side * o;
        ctx.save(); ctx.fillStyle = COPPER; ctx.strokeStyle = C.orange; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, COIL_Y, COIL_R, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
        // I＞0（俯視逆時針）：左 ⊙、右 ⊗
        sym(ctx, x, COIL_Y, COIL_R - 1, side < 0 ? dir : -dir, C.current, a * (0.4 + 0.6 * Math.abs(I)), '#ffe2c4');
      });
    });
  }
  function drawPot(ctx, heat, tl) {
    const hc = heatRGB(heat);
    // 水（越熱越偏暖）
    const wc = mix([26, 74, 92], [70, 72, 80], heat);
    ctx.save(); ctx.fillStyle = rgb(wc);
    ctx.beginPath(); ctx.moveTo(POT.x0 + POT.wall, POT.baseT);
    for (let x = POT.x0 + POT.wall; x <= POT.x1 - POT.wall; x += 6) ctx.lineTo(x, POT.water + 2 * Math.sin(x / 22 + tl * 3) * (0.4 + heat));
    ctx.lineTo(POT.x1 - POT.wall, POT.baseT); ctx.closePath(); ctx.fill(); ctx.restore();
    // 鍋底熱光
    if (heat > 0.05) {
      ctx.save(); const g = ctx.createLinearGradient(0, POT.baseT, 0, POT.baseT - 70);
      g.addColorStop(0, rgb(hc, 0.55 * heat)); g.addColorStop(1, rgb(hc, 0));
      ctx.fillStyle = g; ctx.fillRect(POT.x0 + POT.wall, POT.baseT - 70, POT.x1 - POT.x0 - 2 * POT.wall, 70); ctx.restore();
    }
    // 氣泡
    const nb = Math.floor(clamp((heat - 0.3) / 0.6, 0, 1) * 14);
    for (let k = 0; k < nb; k++) {
      const sp = 45 + (k * 17) % 35, span = POT.baseT - POT.water - 14;
      const y = POT.baseT - 8 - ((tl * sp + k * 41) % span);
      const x = POT.x0 + 22 + ((k * 53) % (POT.x1 - POT.x0 - 44)) + 4 * Math.sin(tl * 4 + k);
      const r = 3 + (k % 3) * 1.5;
      ctx.save(); ctx.globalAlpha = 0.75; ctx.strokeStyle = '#d8f6ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
    }
    // 鍋身（金屬）
    ctx.save();
    const mg = ctx.createLinearGradient(POT.x0, 0, POT.x1, 0); mg.addColorStop(0, '#9aa6a3'); mg.addColorStop(0.5, '#c3ccc9'); mg.addColorStop(1, '#7d8986');
    ctx.fillStyle = mg;
    ctx.fillRect(POT.x0, POT.rim, POT.wall, POT.baseT - POT.rim); ctx.fillRect(POT.x1 - POT.wall, POT.rim, POT.wall, POT.baseT - POT.rim);
    ctx.fillRect(POT.x0 - 6, POT.rim - 6, POT.wall + 6, 8); ctx.fillRect(POT.x1 - POT.wall, POT.rim - 6, POT.wall + 6, 8);
    // 鍋底（熱色）
    ctx.fillStyle = rgb(hc);
    if (heat > 0.3) { ctx.shadowColor = rgb(hc); ctx.shadowBlur = 24 * heat; }
    ctx.fillRect(POT.x0, POT.baseT, POT.x1 - POT.x0, POT.baseB - POT.baseT);
    ctx.shadowBlur = 0; ctx.strokeStyle = '#4b5a57'; ctx.lineWidth = 2;
    ctx.strokeRect(POT.x0, POT.baseT, POT.x1 - POT.x0, POT.baseB - POT.baseT);
    ctx.restore();
    // 蒸氣
    if (heat > 0.7) {
      const a = (heat - 0.7) / 0.3;
      [CX - 70, CX, CX + 70].forEach((x0, k) => {
        ctx.save(); ctx.globalAlpha = 0.55 * a; ctx.strokeStyle = '#e8f4f0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let y = POT.rim - 8; y >= 92; y -= 4) { const x = x0 + 9 * Math.sin(y / 14 + tl * 3 + k * 2); y === POT.rim - 8 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
      });
    }
  }
  // 鍋底渦電流截面（粉紅）＋ Bᵢ（紫）
  function drawEddy(ctx, Ie) {
    const a = clamp(Math.abs(Ie) / 0.2, 0, 1) * (0.35 + 0.65 * Math.abs(Ie)), dir = Ie >= 0 ? 1 : -1;
    EDDY_OFF.forEach(o => {
      sym(ctx, CX - o, EDDY_Y, 9, dir, C.pink, a);
      sym(ctx, CX + o, EDDY_Y, 9, -dir, C.pink, a);
    });
    const m = Math.abs(Ie);
    if (m > 0.08) {
      const L = 70 * m, yc = 272;
      arr(ctx, CX, yc + dir * L / 2, CX, yc - dir * L / 2, C.indPurple, 9, 22, 0.4 + 0.6 * m);   // Bᵢ 向上為正
    }
    text(ctx, 'Bᵢ', CX + 24, 272, C.indPurple, 24, 'center', 0.5 + 0.5 * m);
  }
  function leader(ctx, x1, y1, x2, y2, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function drawMainLabels(ctx, st) {
    // 右側標籤欄
    text(ctx, tr('金屬鍋', 'Metal pot'), LX, 190, C.white, 22, 'left'); leader(ctx, POT.x1 + 6, 190, LX - 8, 190, C.white);
    const pn = st.panelNote ? tr('爐面（不燙）', 'Glass top (not hot)') : tr('爐面', 'Glass top');
    para(ctx, pn, LX, 342, LW, st.panelNote ? C.cyan : C.white, 22, 26, 'left'); leader(ctx, PANEL.x1 + 8, 342, LX - 8, 342, C.white);
    para(ctx, tr('交流線圈', 'AC coil'), LX, 395, LW, C.orange, 22, 26, 'left'); leader(ctx, CX + 145, COIL_Y, LX - 8, 395, C.orange);
    para(ctx, tr('電磁爐', 'Induction cooker'), LX, 436, LW, C.white, 22, 26, 'left');
    // 左側
    text(ctx, tr('水', 'Water'), POT.x0 - 14, 232, C.cyan, 22, 'right');
    if (st.eddy) {
      const ls = wrap(ctx, tr('渦電流', 'Eddy current'), 128, 22);
      lines(ctx, ls, POT.x0 - 14, EDDY_Y - (ls.length - 1) * 13 - 30, C.pink, 22, 26, 'right');
      leader(ctx, POT.x0 - 12, EDDY_Y - 14, POT.x0 + 2, EDDY_Y - 2, C.pink);
    }
    text(ctx, 'B', CX, 186, C.green, 26);
    // ⊙ ⊗ 圖例
    const y = 492; let x = 26;
    sym(ctx, x + 11, y, 11, 1, C.white, 1); x += 30;
    const s1 = tr('流出畫面', 'out of page'); text(ctx, s1, x, y, C.muted, 20, 'left'); x += tw(ctx, s1, 20) + 22;
    sym(ctx, x + 11, y, 11, -1, C.white, 1); x += 30;
    text(ctx, tr('流入畫面', 'into page'), x, y, C.muted, 20, 'left');
  }
  function drawMain(ctx, st, tl, p, heat) {
    drawCooker(ctx, p.I, st.panelNote);
    drawPot(ctx, heat, tl);
    drawFieldLines(ctx, p.B);
    if (st.eddy) drawEddy(ctx, p.Ie);
    drawMainLabels(ctx, st);
  }

  // ───────── 俯視圖（從上往下看） ─────────
  // 數學角 a（逆時針為正）→ 畫面座標
  const TP = (cx, cy, r, a) => ({ x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) });
  function drawTopView(ctx, cx, cy, R, B, Ie, shift, showEddy, showB) {
    // 鍋底圓盤
    ctx.save(); const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 5, cx, cy, R);
    g.addColorStop(0, '#a9b4b1'); g.addColorStop(1, '#5f6d6a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c3ccc9'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    // B（⊙ 向上＝朝觀看者）
    if (showB) {
      const mB = Math.abs(B), aB = clamp(mB / 0.15, 0, 1) * (0.3 + 0.7 * mB);
      for (let k = 0; k < 6; k++) { const p = TP(cx, cy, R * 0.44, k * TAU / 6 + 0.52); sym(ctx, p.x, p.y, Math.min(R * 0.085 + 4 * mB, 11), B >= 0 ? 1 : -1, C.green, aB); }
    }
    if (!showEddy) return;
    const m = Math.abs(Ie), dir = Ie >= 0 ? 1 : -1, ae = clamp(m / 0.15, 0, 1);
    // 環
    const rr = R * 0.74;
    ctx.save(); ctx.strokeStyle = C.pink; ctx.globalAlpha = 0.25 + 0.75 * m; ctx.lineWidth = 3 + 4 * m;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke(); ctx.restore();
    // 箭頭（沿環流動；shift＝∫Iᵢ 的角位移，逆時針為正）
    for (let k = 0; k < 4; k++) {
      const a = k * TAU / 4 + shift, p = TP(cx, cy, rr, a);
      const tx = -Math.sin(a) * dir, ty = -Math.cos(a) * dir;          // 逆時針切向（畫面座標）× dir
      const L = 10 + 8 * m;
      arr(ctx, p.x - tx * L, p.y - ty * L, p.x + tx * L, p.y + ty * L, C.pink, 5, 16 + 6 * m, ae * (0.4 + 0.6 * m));
    }
    // 中心 Bᵢ
    sym(ctx, cx, cy, Math.min(R * 0.12, 10) + 6 * m, dir, C.indPurple, ae * (0.4 + 0.6 * m));
  }
  const eddyShift = tl => -0.55 * Math.sin(TAU * tl);              // ∫(−cos) 的解析式（逆時針為正）

  // ───────── 右欄：第 1 步 ─────────
  function drawTopTitle(ctx) { para(ctx, tr('俯視鍋底（從上往下看）', 'Pan bottom, seen from above'), RC, 84, RW, C.white, 22, 26, 'center'); }
  function drawStep1Right(ctx, tl, p) {
    drawTopTitle(ctx);
    drawTopView(ctx, RC, 196, 78, p.B, 0, 0, false, true);
    // B–時間 滑動曲線
    const GX = RX + 40, GW = RW - 50, GT = 304, GB = 392, Y0 = (GT + GB) / 2, A = 36, span = 2.5;
    text(ctx, 'B', RX + 14, Y0, C.green, 24);
    text(ctx, '↑', RX + 14, GT + 10, C.muted, 20); text(ctx, '↓', RX + 14, GB - 10, C.muted, 20);
    ctx.save(); ctx.strokeStyle = '#58736a'; ctx.lineWidth = 2; ctx.strokeRect(GX, GT, GW, GB - GT);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(GX, Y0); ctx.lineTo(GX + GW, Y0); ctx.stroke();
    ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i <= 120; i++) { const t = tl - span + span * i / 120, x = GX + GW * i / 120, y = Y0 - A * Math.sin(TAU * t); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = C.green; ctx.strokeStyle = C.bg; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(GX + GW, Y0 - A * p.B, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    // 1 秒標尺
    const x1 = GX + GW - GW / span, x2 = GX + GW, yb = GB + 10;
    ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(x1, yb + 6); ctx.lineTo(x1, yb); ctx.lineTo(x2, yb); ctx.lineTo(x2, yb + 6); ctx.stroke(); ctx.restore();
    text(ctx, tr('1 秒＝1 個週期', '1 s = 1 cycle'), (x1 + x2) / 2, yb + 22, C.yellow, 20);
    // 四格
    drawCells(ctx, 450, [bRow()], p.q);
  }
  // B 列（兩行：方向／增減）
  const bRow = () => ({ head: 'B', col: C.green, cells: [tr('↑\n增強', '↑\ngrow'), tr('↑\n減弱', '↑\nfade'), tr('↓\n增強', '↓\ngrow'), tr('↓\n減弱', '↓\nfade')] });
  // 方向表格：rows＝[{head,col,cells[4]}]（格內可用 \n 換行），亮起第 q 格；y0＝表格頂端，回傳底端
  function drawCells(ctx, y0, rows, q) {
    const hw = 74, cw = (RW - hw) / 4, lh = 24, pad = 8;
    const hs = rows.map(r => Math.max(...r.cells.map(c => c.split('\n').length)) * lh + pad);
    const tot = hs.reduce((a, b) => a + b, 0);
    ctx.save(); ctx.fillStyle = 'rgba(255,243,106,.16)'; ctx.strokeStyle = C.yellow; ctx.lineWidth = 3;
    rrect(ctx, RX + hw + q * cw + 2, y0, cw - 4, tot, 8); ctx.fill(); ctx.stroke(); ctx.restore();
    let y = y0;
    rows.forEach((r, i) => {
      const yc = y + hs[i] / 2;
      text(ctx, r.head, RX + hw - 10, yc, r.col, 20, 'right');
      r.cells.forEach((c, k) => { const ls = c.split('\n'); lines(ctx, ls, RX + hw + (k + 0.5) * cw, yc - (ls.length - 1) * lh / 2, r.col, 20, lh, 'center', k === q ? 1 : 0.55); });
      y += hs[i];
    });
    return y0 + tot;
  }

  // ───────── 右欄：第 2 步 ─────────
  function drawStep2Right(ctx, tl, p) {
    drawTopTitle(ctx);
    drawTopView(ctx, RC, 188, 72, p.B, p.Ie, eddyShift(tl), true, true);
    const cw = p.Ie < 0, en = lang_en();
    let y = 292;
    y += para(ctx, cw ? tr('渦電流：順時針', 'Eddy current: clockwise (CW)') : tr('渦電流：逆時針', 'Eddy current: counterclockwise (CCW)'), RC, y, RW, C.pink, 22, 26, 'center');
    y += para(ctx, tr('B 增強 → Bᵢ 反向；B 減弱 → Bᵢ 同向', 'B growing → Bᵢ opposes it; B fading → Bᵢ along it'), RC, y + 4, RW, C.indPurple, 20, 24, 'center');
    drawCells(ctx, Math.max(y + 2, 352), [
      bRow(),
      { head: 'Bᵢ', col: C.indPurple, cells: ['↓', '↑', '↑', '↓'] },
      { head: tr('俯視', 'Top'), col: C.pink, cells: en ? ['CW', 'CCW', 'CCW', 'CW'] : ['順時針', '逆時針', '逆時針', '順時針'] }
    ], p.q);
  }
  function lang_en() { return tr('zh', 'en') === 'en'; }

  // ───────── 第 3 步：兩個時刻並排 ─────────
  function drawCompare(ctx, tl, p) {
    const snaps = [
      { ph: Math.PI / 4, q: 0, px: 18 },
      { ph: 5 * Math.PI / 4, q: 2, px: 510 }
    ];
    snaps.forEach((s, k) => {
      const B = Math.sin(s.ph), Ie = -Math.cos(s.ph), up = B > 0, dir = Ie >= 0 ? 1 : -1;
      const px = s.px, pw = 472, live = p.q === s.q;
      ctx.save(); ctx.fillStyle = live ? 'rgba(255,243,106,.07)' : 'rgba(255,255,255,.03)';
      ctx.strokeStyle = live ? C.yellow : '#58736a'; ctx.lineWidth = live ? 4 : 2;
      rrect(ctx, px, 72, pw, 470, 14); ctx.fill(); ctx.stroke(); ctx.restore();
      const title = up ? tr(`時刻 ${k + 1}：B 向上、增強`, `Moment ${k + 1}: B up, growing`) : tr(`時刻 ${k + 1}：B 向下、增強`, `Moment ${k + 1}: B down, growing`);
      text(ctx, title, px + 22, 102, C.green, 24, 'left');
      if (live) text(ctx, tr('● 現在', '● now'), px + pw - 18, 102, C.yellow, 20, 'right');
      // 剖面示意
      const sx = px + 285, slT = 200, slB = 222, glY = 236, coY = 282;
      ctx.save(); ctx.fillStyle = 'rgb(125,138,135)'; ctx.fillRect(sx - 130, slT, 260, slB - slT);
      ctx.strokeStyle = '#4b5a57'; ctx.lineWidth = 2; ctx.strokeRect(sx - 130, slT, 260, slB - slT);
      ctx.fillStyle = '#2c434b'; ctx.fillRect(sx - 140, glY, 280, 12); ctx.restore();
      [24, 52, 80, 108].forEach(o => [-1, 1].forEach(side => {
        const x = sx + side * o;
        ctx.save(); ctx.fillStyle = COPPER; ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, coY, 10, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
        sym(ctx, x, coY, 9, side < 0 ? (up ? 1 : -1) : (up ? -1 : 1), C.current, 1, '#ffe2c4');
      }));
      text(ctx, tr('鍋底', 'Pan'), sx - 146, (slT + slB) / 2, C.white, 22, 'right');
      text(ctx, tr('線圈', 'Coil'), sx - 126, coY, C.orange, 22, 'right');
      // B（兩支綠箭頭，穿過鍋底）
      [-66, 66].forEach(o => {
        const y1 = up ? 262 : 150, y2 = up ? 150 : 262;
        arr(ctx, sx + o, y1, sx + o, y2, C.green, 8, 22, 1);
      });
      text(ctx, 'B', sx - 66 - 22, 160, C.green, 24);
      // 渦電流截面（Ie＞0 左 ⊙ 右 ⊗）
      [38, 100].forEach(o => { sym(ctx, sx - o, (slT + slB) / 2, 9, dir, C.pink, 1); sym(ctx, sx + o, (slT + slB) / 2, 9, -dir, C.pink, 1); });
      // Bᵢ（紫，中心）
      arr(ctx, sx, dir > 0 ? 250 : 150, sx, dir > 0 ? 150 : 250, C.indPurple, 8, 22, 1);
      text(ctx, 'Bᵢ', sx + 26, 140, C.indPurple, 24);
      // 俯視環（持續流動）
      const tcx = px + 100, tcy = 405;
      drawTopView(ctx, tcx, tcy, 70, B, Ie, dir * 1.6 * tl, true, true);
      text(ctx, tr('俯視', 'Top view'), tcx, 497, C.white, 20);
      // 文字
      const tx = px + 190, mw = pw - 205; let y = 352;
      y += para(ctx, up ? tr('Φ 向上增加', 'Upward Φ increasing') : tr('Φ 向下增加', 'Downward Φ increasing'), tx, y, mw, C.green, 22, 28, 'left') + 6;
      y += para(ctx, dir < 0 ? tr('→ Bᵢ 向下（反抗）', '→ Bᵢ points down (opposes)') : tr('→ Bᵢ 向上（反抗）', '→ Bᵢ points up (opposes)'), tx, y, mw, C.indPurple, 22, 28, 'left') + 6;
      y += para(ctx, dir < 0 ? tr('→ 右手螺旋：俯視順時針', '→ right-hand rule: clockwise from above') : tr('→ 右手螺旋：俯視逆時針', '→ right-hand rule: counterclockwise from above'), tx, y, mw, C.pink, 22, 28, 'left');
    });
  }

  // ───────── 右欄：第 4 步（發熱） ─────────
  function drawHeatRight(ctx, tl, p, heat) {
    // 溫度計
    const tx = RX + 42, top = 128, bot = 438, br = 22, by = bot + 26;
    text(ctx, tr('水溫', 'Water'), tx, 96, C.white, 22);
    const fc = rgb(mix([85, 170, 255], [255, 77, 77], heat));
    ctx.save(); ctx.fillStyle = '#1b3a32'; ctx.strokeStyle = C.white; ctx.lineWidth = 3;
    rrect(ctx, tx - 11, top, 22, bot - top + 8, 11); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(tx, by, br, 0, TAU); ctx.fill(); ctx.stroke();
    const lv = bot - (0.12 + 0.82 * heat) * (bot - top);
    ctx.fillStyle = fc; ctx.fillRect(tx - 6, lv, 12, by - lv);
    ctx.beginPath(); ctx.arc(tx, by, br - 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
    for (let k = 0; k <= 5; k++) { const y = bot - k * (bot - top) / 5; ctx.beginPath(); ctx.moveTo(tx + 13, y); ctx.lineTo(tx + 22, y); ctx.stroke(); }
    ctx.restore();
    text(ctx, '↑', tx + 38, lv, fc, 24);
    // P = I²R
    const cx = RX + 100, mw = RW - 105, mid = cx + mw / 2;
    text(ctx, 'P ＝ I²R', mid, 104, C.yellow, 32);
    let y = 146;
    y += para(ctx, tr('發熱功率和電流的平方成正比', 'Heating power grows with the square of the current'), mid, y, mw, C.white, 22, 27, 'center');
    // I 與 I² 長條
    y += 14;
    text(ctx, tr('I（渦電流）', 'I (eddy current)'), cx, y, C.pink, 20, 'left'); y += 28;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mid, y - 14); ctx.lineTo(mid, y + 14); ctx.stroke();
    ctx.strokeStyle = '#58736a'; ctx.strokeRect(cx, y - 11, mw, 22);
    ctx.fillStyle = C.pink; const w1 = p.Ie * (mw / 2 - 2); ctx.fillRect(Math.min(mid, mid + w1), y - 8, Math.abs(w1), 16); ctx.restore();
    text(ctx, '−', cx - 12, y, C.muted, 22); text(ctx, '+', cx + mw + 12, y, C.muted, 22);
    y += 36;
    text(ctx, tr('I²（發熱快慢）', 'I² (heating rate)'), cx, y, C.orange, 20, 'left'); y += 28;
    ctx.save(); ctx.strokeStyle = '#58736a'; ctx.lineWidth = 2; ctx.strokeRect(cx, y - 11, mw, 22);
    ctx.fillStyle = C.orange; ctx.fillRect(cx + 2, y - 8, p.Ie * p.Ie * (mw - 4), 16); ctx.restore();
    y += 36;
    y += para(ctx, tr('電流反向時 I² 仍是正的，所以一直在發熱', 'When the current reverses, I² is still positive, so heating never stops'), cx, y, mw, C.muted, 20, 25, 'left') + 8;
    para(ctx, tr('R：鍋底金屬的電阻', 'R: resistance of the pan metal'), cx, y, mw, C.white, 20, 25, 'left');
  }

  // ───────── 右欄：第 5 步（能量鏈） ─────────
  const CHAIN_T = [0.5, 1.7, 2.9, 4.1];
  function drawChain(ctx, tl) {
    const items = [[tr('電能', 'Electrical energy'), C.yellow], [tr('改變的磁場', 'Changing magnetic field'), C.green], [tr('渦電流', 'Eddy current'), C.pink], [tr('熱', 'Heat'), C.orange]];
    const bx = RX + 12, bw = RW - 24, bh = 52, gap = 30; let y = 80;
    items.forEach(([s, col], k) => {
      const on = clamp((tl - CHAIN_T[k]) / 0.4, 0, 1);
      if (k > 0) arr(ctx, RC, y - gap + 3, RC, y - 3, col, 5, 14, 0.3 + 0.7 * on);
      ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * on; ctx.fillStyle = on > 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.03)';
      ctx.strokeStyle = col; ctx.lineWidth = 2 + 2 * on;
      if (on > 0) { ctx.shadowColor = col; ctx.shadowBlur = 14 * on; }
      rrect(ctx, bx, y, bw, bh, 12); ctx.fill(); ctx.stroke(); ctx.restore();
      text(ctx, s, RC, y + bh / 2, col, 24, 'center', 0.45 + 0.55 * on);
      y += bh + gap;
    });
    const a = clamp((tl - 4.8) / 0.5, 0, 1);
    y += 4;
    y += para(ctx, tr('電磁爐面板本身不燙，是鍋子自己發熱', 'The cooktop itself is not the heater: the pot heats itself'), RC, y, RW, C.cyan, 22, 28, 'center', a) + 8;
    para(ctx, tr('接直流電：磁場不變 → 沒有渦電流，不會加熱', 'With DC the field stays constant → no eddy current, no heating'), RC, y, RW, C.muted, 20, 25, 'center', a);
  }

  // ───────── 步驟資料 ─────────
  const STEPS = [
    { dur: 7, b: ['磁場來回', 'Field'], eddy: false, right: 's1',
      cap: ['線圈通交流電（1 Hz）：磁場 B 每秒「向上 → 反向向下」來回一次', 'AC in the coil (1 Hz): field B flips up ↔ down once every second'],
      res: ['電磁爐底下的線圈通<strong class="orange">交流電</strong>，磁場 B 跟著電流變大、變小，<strong class="green">每半週期反轉一次</strong>（動畫為 1 Hz：每秒一個週期）。', 'The coil under the cooktop carries <strong class="orange">AC</strong>, so the field B grows, shrinks, and <strong class="green">reverses every half-cycle</strong> (shown at 1 Hz: one cycle per second).'] },
    { dur: 8, b: ['渦電流', 'Eddy'], eddy: true, right: 's2',
      cap: ['鍋底的磁通量一直在變 → 感應出環狀渦電流，Bᵢ 反抗 B 的改變', 'The flux through the pan keeps changing → circular eddy currents; Bᵢ opposes the change'],
      res: ['鍋底的磁通量不斷改變，金屬裡感應出環狀的<strong class="pink">渦電流</strong>。依冷次定律：B 向上增強時，渦電流產生向下的 Bᵢ，從上往下看是<strong class="pink">順時針</strong>；B 向上減弱時，Bᵢ 向上，變成逆時針。', 'The changing flux through the pan induces circulating <strong class="pink">eddy currents</strong>. By Lenz’s law, while upward B grows, the eddy current makes a downward Bᵢ and flows <strong class="pink">clockwise</strong> seen from above; while upward B fades, Bᵢ points up and the flow turns counterclockwise.'] },
    { dur: 7, b: ['反向對照', 'Reverse'], compare: true,
      cap: ['半週期後 B 反向，渦電流也跟著反向', 'Half a cycle later B reverses, and so does the eddy current'],
      res: ['B 向上增強：Bᵢ 向下，俯視<strong class="pink">順時針</strong>。半週期後 B 向下增強：Bᵢ 向上，俯視<strong class="pink">逆時針</strong>。磁場反向，<strong class="pink">渦電流也反向</strong>，每秒來回兩次。', 'Upward B growing: Bᵢ points down, <strong class="pink">clockwise</strong> from above. Half a cycle later, downward B growing: Bᵢ points up, <strong class="pink">counterclockwise</strong>. The field reverses and <strong class="pink">so does the eddy current</strong>, twice every second.'] },
    { dur: 8, b: ['發熱', 'Heat'], eddy: true, right: 'heat', heat: 'ramp',
      cap: ['渦電流流過有電阻的鍋底 → 鍋底發熱，水溫上升', 'Eddy currents flow through the resistive pan bottom → it heats up and warms the water'],
      res: ['渦電流流過鍋底金屬（有電阻）就會發熱，發熱功率 <strong class="yellow">P＝I²R</strong>：電流越大越熱；電流方向反過來，I² 仍是正的，所以<strong class="orange">一直在加熱</strong>。', 'Eddy currents heat the pan because the metal has resistance; the heating power is <strong class="yellow">P = I²R</strong>, so a bigger current heats more. When the current reverses, I² is still positive, so it <strong class="orange">keeps heating</strong>.'] },
    { dur: 8, b: ['能量鏈', 'Energy'], eddy: true, right: 'chain', heat: 'full', panelNote: true,
      cap: ['能量轉換：電能 → 改變的磁場 → 渦電流 → 熱', 'Energy chain: electrical energy → changing field → eddy current → heat'],
      res: ['<span class="yellow">電能</span> → 改變的磁場 → <span class="pink">渦電流</span> → 熱。電磁爐面板本身不是熱源，是<strong class="orange">鍋子自己發熱</strong>（面板只會被熱鍋子傳熱而變溫）；若接直流電，磁場不變，就沒有渦電流。', '<span class="yellow">Electrical energy</span> → changing magnetic field → <span class="pink">eddy current</span> → heat. The cooktop is not the heat source; <strong class="orange">the pot heats itself</strong> (the glass only gets warm from the hot pot). With DC the field would stay constant, so there would be no eddy current.'] }
  ];
  const starts = []; let TOTAL = 0; STEPS.forEach(s => { starts.push(TOTAL); TOTAL += s.dur; });
  const heatOf = (st, tl) => st.heat === 'full' ? 1 : st.heat === 'ramp' ? Math.min(1, tl / 6) : 0;

  function drawCaption(ctx, cap) {
    const ls = wrap(ctx, cap, 950, 24);
    lines(ctx, ls, W / 2, ls.length > 1 ? 26 : 36, C.yellow, 24, 28, 'center');
  }
  function drawNote(ctx) {
    const s = tr('實際上各國的交流電頻率不同，動畫降成 1 Hz 是為了方便觀察。', 'Real AC frequency differs from country to country; the animation slows it to 1 Hz so it is easy to watch.');
    const ls = wrap(ctx, s, 640, 20);
    lines(ctx, ls, W - 14, H - 16 - (ls.length - 1) * 24, C.yellow, 20, 24, 'right');
  }

  // ───────── 播放迴圈（單一 RAF） ─────────
  const SC_ID = 'cooker';
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  let lastResult = '';
  const cv = () => document.getElementById('cookerCanvas');
  function stepAt(t) { let i = 0; while (i + 1 < starts.length && t >= starts[i + 1]) i++; return i; }
  function setResult(html) {
    if (html === lastResult) return; lastResult = html;
    const el = document.getElementById('cookerResult'); if (el) el.innerHTML = html;
  }
  function drawProgress(ctx, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.fillStyle = C.bg; starts.slice(1).forEach(s => ctx.fillRect(W * s / TOTAL - 2, 0, 4, 6));
    ctx.restore();
  }
  function render() {
    const c = cv(); if (!c || !S.scene) return;
    const i = stepAt(S.t), st = STEPS[i], tl = S.t - starts[i];
    const ctx = c.getContext('2d'), k = c.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const p = physics(tl), heat = heatOf(st, tl);
    if (st.compare) drawCompare(ctx, tl, p);
    else {
      drawMain(ctx, st, tl, p, heat);
      if (st.right === 's1') drawStep1Right(ctx, tl, p);
      else if (st.right === 's2') drawStep2Right(ctx, tl, p);
      else if (st.right === 'heat') drawHeatRight(ctx, tl, p, heat);
      else if (st.right === 'chain') drawChain(ctx, tl);
    }
    drawNote(ctx);
    const f = clamp(1 - tl / 0.35, 0, 1);
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    drawCaption(ctx, tr(st.cap[0], st.cap[1]));
    drawProgress(ctx, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
    setResult(tr(st.res[0], st.res[1]));
  }
  function updateUI() {
    const row = document.getElementById('steps-cooker');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.scene) return;
    S.t = starts[k] + 1e-4; S.step = -1; S.last = 0;
    render(); start();
  }
  function buildButtons() {
    const row = document.getElementById('steps-cooker'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }
  let stepStop = true;
  function visible() { const c = cv(); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    // AGENTS 10.6（2026-11-05）：學生模式一次只播一個步驟，播完停在該步最後一幀（不循環、不自動接下一步）。
    // setStepStop(false)＝步驟間不停、連播到底再停住（老師講解用；本頁未做老師模式）。
    {
      // 以「上一幀正在播的步驟」為準；剛跳步或重畫（S.step＝-1）時才由 t 推算
      let kk = S.step >= 0 ? S.step : 0;
      if (S.step < 0) while (kk + 1 < starts.length && S.t >= starts[kk + 1]) kk++;
      const end = stepStop ? (starts[kk + 1] !== undefined ? starts[kk + 1] : TOTAL) : TOTAL;
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

  window.EmiAnim.cooker = {
    activate(sceneId) {
      void sceneId;
      stop();
      S.scene = SC_ID; S.t = 0; S.step = -1; S.last = 0; lastResult = '';
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      S.scene = null; S.step = -1; lastResult = '';
      const row = document.getElementById('steps-cooker'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      lastResult = ''; S.step = -1;
      buildButtons(); render(); start();
    },
    setStepStop(v) { stepStop = !!v; if (S.scene) start(); },
    _frameAt(sceneId, t) { void sceneId; stop(); S.scene = SC_ID; S.t = t; render(); return TOTAL; },
    _info() { return { cooker: { total: TOTAL, starts: starts.slice() } }; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();

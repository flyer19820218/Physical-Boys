/* electromagnetic_induction_4_lab_cooker_1105_v1.js — 「🔬 動手做：換鍋子、拉遠一點」電磁爐實驗台（#cookerLabCanvas，邏輯 1000×600）
 *
 * 契約：window.EmLab.cooker = { activate(), deactivate(), relang(), _state() }（另有測試用 _setH(px)，正式畫面不用）
 * 依賴頁面現成的：tr、C、TAU（直接呼叫，不複製）。其餘小工具在本檔內（寫法同本課其他實驗台與電磁爐動畫）。
 * 控制鈕由本檔建立在 #cookerLabControls，說明字寫進 #cookerLabResult（只有文字改變時才寫）。
 *
 * ── 互動 ──────────────────────────────────────────────
 *   垂直拖曳「鍋子」：只有按在鍋子上（鍋身外框＋10 px）才接管——pointerdown 與 touchstart 都只在這時 preventDefault，
 *     畫布其他地方垂直捲動照常。往上拖＝提起，h＝0～120 px（LIFT_MAX）；方向鍵 ↑／↓ 每按一下 15 px（平滑移動）。
 *   按鈕：①電源 交流／直流  ②鍋子 鐵鍋／鋁鍋／玻璃鍋  ③火力 小／中／大（線圈電流 ×0.5／×1／×1.5）
 *         ④重設 鍋子放回（h 平滑回 0；已在爐面時停用）／換冷水（水溫 → 20 °C）
 *   預設：交流、鐵鍋、火力中、鍋在爐面、水 20 °C；一進來磁場來回、渦電流流動、水面晃動。
 *   怎麼玩提示（24px）在第一次拖曳鍋子或按 ↑↓ 後淡出。
 *
 * ── 公式與簡化 ─────────────────────────────────────────
 *   火力 F＝0.5／1／1.5。交流（慢動作 1 Hz）：B＝F·sin(2πt)（向上為正），線圈電流 I＝F·sin(2πt)（I＞0＝俯視逆時針）。
 *   直流：B 由切換當下的值以 τ＝0.4 s 指數趨近 F（向上），穩定後 B 不變；切到直流、或直流時改火力，才有一瞬間的變化。
 *   耦合（穿過鍋底的磁通量比例）k＝1／(1＋(h/50)²)^1.5；h＝0 → 1，h＝60 → 0.26，h＝120 → 0.057。
 *   材質係數 m：鐵 1、鋁 0.35（示意）、玻璃 0（不導電）。
 *   渦電流 Iᵢ＝−k·m·(dB/dt)/(2π) ⇒ 交流時 Iᵢ＝−k·m·F·cos(2πt)，振幅 A＝k·m·F（最大 1.5）。
 *   發熱功率（相對）P＝(A/1.5)²（＝P∝I²R 的振幅版，電流反向 I² 仍為正，所以一直發熱）；直流的瞬間 P＝2(Iᵢ/1.5)²。
 *   鍋底熱色 heat 以 τ＝0.8 s 追 √P（灰／銀 → 暗紅 → 橘紅 → 白熱）。
 *   水溫 dT/dt＝a·P − b·(T − 20)，a＝4.85、b＝0.02，上限 100 °C（沸騰後維持 100、冒泡冒蒸氣）：
 *     鐵鍋、火力大、在爐面（P＝1）約 20 s 由 20 → 100 °C；火力中 約 68 s；火力小 只到約 47 °C；
 *     鋁鍋火力大 約 50 °C；鍋提起 h＝60、鐵、大 約 37 °C；玻璃／直流 P＝0 → 慢慢冷回 20 °C。
 *   不模擬：磁滯損失、鍋子的磁導率、水的蒸發量；鋁鍋係數只是示意（多數電磁爐對鋁鍋加熱效果很差）。
 *   磁力線：8 條，自線圈平面往上散開 x＝o·(1＋0.8·(d/100)²)，o＝28／62／96／124；在鍋底高度 |x|＜140（鍋半寬）者算「穿過鍋底」
 *     畫實線、較亮，其餘畫虛線、較暗（h＝0 全部穿過、h＝60 剩 4 條、h＝120 剩 2 條）。
 *
 * ── 方向表（座標、⊙⊗、正負號全部沿用 electromagnetic_induction_4_cooker_1105_v1.js 檔頭）──
 *   剖面側視：x 向右、y 向上、z 朝觀看者；俯視：從上往下看，畫面右＝+x、畫面上＝−z。
 *   線圈電流 I＞0＝俯視逆時針 ⇒ 剖面左 ⊙、右 ⊗ ⇒ B 向上。Iᵢ＞0＝俯視逆時針 ⇒ 鍋底剖面左 ⊙、右 ⊗ ⇒ Bᵢ 向上。
 *   交流 ph      線圈（俯視） B       Φ（向上為正）  Iᵢ＝−cos  Bᵢ   渦電流（俯視）  鍋底剖面 左／右
 *   0°→90°       逆時針        ↑      向上、增加      −         ↓    順時針          ⊗／⊙
 *   90°→180°     逆時針        ↑      向上、減少      ＋        ↑    逆時針          ⊙／⊗
 *   180°→270°    順時針        ↓      向下、增加      ＋        ↑    逆時針          ⊙／⊗
 *   270°→360°    順時針        ↓      向下、減少      −         ↓    順時針          ⊗／⊙
 *   直流：剛接上（B 由下往上變大）→ 一瞬間 Iᵢ＜0、俯視順時針、Bᵢ 向下；穩定後 B 不變 → Iᵢ＝0、沒有渦電流環、不發熱。
 *   鍋子提起：方向不變，只有大小 ×k；玻璃鍋：m＝0，任何時刻 Iᵢ＝0。
 *   畫面綠 B 箭頭、橘線圈 ⊙⊗、粉渦電流 ⊙⊗／俯視環、紫 Bᵢ、I 與 I² 長條、讀數、頂端字、說明框全由同一組 B、Iᵢ 算出。
 *
 * 字級：畫布文字 20–26px（頂端說明 24、標籤／讀數 22、次要 20），Noto Sans TC 900；量寬換行，不縮字。
 */
(function () {
  'use strict';
  window.EmLab = window.EmLab || {};

  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const CX = 270;                                                  // 剖面中心 x
  const POT = { hw: 140, wall: 10, depth: 150, base: 18, waterDrop: 44 };
  const PANEL = { x0: 78, x1: 462, y0: 440, y1: 454 };
  const BODY = { x0: 84, x1: 456, y0: 454, y1: 540 };
  const COIL_Y = 476, COIL_OFF = [40, 70, 100, 128], COIL_R = 11;
  const LINE_O = [28, 62, 96, 124], FAN = 0.8;                      // 磁力線
  const EDDY_OFF = [62, 104];
  const LIFT_MAX = 120, KEY_STEP = 15;
  const LX = 472, LW = 128;                                        // 剖面右側標籤欄
  const TH_X = 660, RX = 712, RX1 = 988;                           // 右欄：溫度計、讀數
  const TV = { x: 752, y: 300, r: 44 };                            // 俯視鍋底
  const FIRE = [0.5, 1, 1.5], AMAX = 1.5, TAU_DC = 0.4;
  const MAT = { iron: 1, al: 0.35, glass: 0 };
  const HEAT_A = 4.85, COOL_B = 0.02, T_ROOM = 20;
  const COPPER = '#c9823f', PANEL_BG = 'rgba(12,30,25,0.92)';
  const BASE_RGB = { iron: [112, 122, 120], al: [196, 204, 208], glass: [150, 205, 218] };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const font = s => `900 ${s}px ${FONT}`;
  const lerp = (a, b, u) => a + (b - a) * u;
  const mix = (c1, c2, u) => [0, 1, 2].map(i => Math.round(lerp(c1[i], c2[i], u)));
  const rgb = (c, a) => a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // ───────── 狀態 ─────────
  const S = {
    src: 'ac', mat: 'iron', fire: 1,
    h: 0, hT: 0, acT: 0, dcT: 0, dcB0: 0,
    B: 0, dB: 0, I: 0, Ie: 0, A: 0, P: 0, heat: 0, T: T_ROOM, shift: 0,
    focus: null, focusT: -99, t: 0, hintA: 1, dragged: false,
    raf: 0, last: 0, on: false, visible: true, timer: 0, actions: 0
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null, ptr = null, lastRes = '', lastReset = null;

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
    const latin = !/[㐀-鿿]/.test(s), units = latin ? s.split(' ') : s.match(/[A-Za-z0-9ᵢ.:：%°²]+|./gu), out = [];
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
  // ⊙（dir＞0，流出畫面／朝觀看者）、⊗（dir＜0，流入畫面）——與電磁爐動畫同畫法
  function sym(x, y, r, dir, color, alpha, fill) {
    if (alpha < 0.04) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = fill || C.bg; ctx.strokeStyle = color; ctx.lineWidth = Math.max(2.5, r * 0.22);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.lineCap = 'round';
    if (dir > 0) { ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, TAU); ctx.fill(); }
    else { const d = r * 0.5; ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke(); }
    ctx.restore();
  }
  // 熱度 0～1：材質本色 → 暗紅 → 橘紅 → 白熱
  function heatRGB(h, base) {
    const st = [[0, base], [0.35, [150, 34, 24]], [0.7, [255, 96, 30]], [1, [255, 236, 190]]];
    for (let k = 1; k < st.length; k++) if (h <= st[k][0]) return mix(st[k - 1][1], st[k][1], (h - st[k - 1][0]) / (st[k][0] - st[k - 1][0]));
    return st[st.length - 1][1];
  }
  function leader(x1, y1, x2, y2, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  const isEN = () => tr('zh', 'en') === 'en';

  // ───────── 物理量 ─────────
  const F = () => FIRE[S.fire];
  const kOf = h => Math.pow(1 + (h / 50) * (h / 50), -1.5);
  const kNow = () => kOf(S.h);
  const kPct = () => Math.round(kNow() * 100);
  const eddyPct = () => Math.round(Math.min(1, (S.src === 'ac' ? S.A : Math.abs(S.Ie)) / AMAX) * 100);
  const powPct = () => Math.round(Math.min(1, S.P) * 100);
  const lineOff = (o, d) => o * (1 + FAN * (d / 100) * (d / 100));
  function potG() {
    const baseB = PANEL.y0 - S.h, baseT = baseB - POT.base, rim = baseT - POT.depth;
    return { x0: CX - POT.hw, x1: CX + POT.hw, baseB, baseT, rim, water: rim + POT.waterDrop };
  }
  const eddyDir = () => Math.abs(S.Ie) < 0.02 ? null : S.Ie > 0 ? 'ccw' : 'cw';
  const quad = () => S.src !== 'ac' ? null : Math.floor((((TAU * S.acT) % TAU) + TAU) % TAU / (TAU / 4)) % 4;
  function waterKey() { return S.T >= 99.5 ? 'boil' : S.T >= 70 ? 'hot' : S.T >= 35 ? 'warm' : 'cold'; }

  // ───────── 電磁爐本體（剖面） ─────────
  function drawCooker() {
    ctx.save(); ctx.fillStyle = '#132a23'; ctx.strokeStyle = '#58736a'; ctx.lineWidth = 3;
    rrect(BODY.x0, BODY.y0, BODY.x1 - BODY.x0, BODY.y1 - BODY.y0, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#26332f'; ctx.fillRect(CX - 150, COIL_Y + 18, 300, 10);          // 線圈下的鐵氧體托板（示意）
    const g = ctx.createLinearGradient(0, PANEL.y0, 0, PANEL.y1); g.addColorStop(0, '#3c5560'); g.addColorStop(1, '#22343b');
    ctx.fillStyle = g; rrect(PANEL.x0, PANEL.y0, PANEL.x1 - PANEL.x0, PANEL.y1 - PANEL.y0, 4); ctx.fill();
    ctx.strokeStyle = '#7fa3ad'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    const I = S.I, a = clamp(Math.abs(I) / 0.15, 0, 1) * (0.4 + 0.6 * Math.min(1, Math.abs(I) / AMAX)), dir = I >= 0 ? 1 : -1;
    COIL_OFF.forEach(o => [-1, 1].forEach(side => {
      const x = CX + side * o;
      ctx.save(); ctx.fillStyle = COPPER; ctx.strokeStyle = C.orange; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, COIL_Y, COIL_R, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      sym(x, COIL_Y, COIL_R - 1, side < 0 ? dir : -dir, C.current, a, '#ffe2c4');     // I＞0：左 ⊙、右 ⊗
    }));
  }

  // ───────── 鍋子（水、氣泡、鍋身、鍋底熱色、蒸氣） ─────────
  function drawPot(g) {
    const tw = clamp((S.T - T_ROOM) / 80, 0, 1), glass = S.mat === 'glass';
    const xi0 = g.x0 + POT.wall, xi1 = g.x1 - POT.wall;
    // 水
    ctx.save(); ctx.fillStyle = rgb(mix([26, 74, 92], [84, 70, 82], tw));
    ctx.beginPath(); ctx.moveTo(xi0, g.baseT);
    for (let x = xi0; x <= xi1; x += 6) ctx.lineTo(x, g.water + 2 * Math.sin(x / 22 + S.t * 3) * (0.4 + tw));
    ctx.lineTo(xi1, g.water); ctx.lineTo(xi1, g.baseT); ctx.closePath(); ctx.fill(); ctx.restore();
    // 鍋底熱光
    const hc = heatRGB(S.heat, BASE_RGB[S.mat]);
    if (!glass && S.heat > 0.05) {
      ctx.save(); const gr = ctx.createLinearGradient(0, g.baseT, 0, g.baseT - 70);
      gr.addColorStop(0, rgb(hc, 0.55 * S.heat)); gr.addColorStop(1, rgb(hc, 0));
      ctx.fillStyle = gr; ctx.fillRect(xi0, g.baseT - 70, xi1 - xi0, 70); ctx.restore();
    }
    // 氣泡：沸騰（100 °C 且還在加熱）很多；加熱中、水溫偏高時少量
    const boil = S.T >= 99.5 ? clamp(S.P * 2.5, 0, 1) : clamp((S.T - 55) / 45, 0, 1) * clamp(S.P * 4, 0, 1) * 0.45;
    const nb = Math.floor(boil * 16), span = g.baseT - g.water - 14;
    for (let k = 0; k < nb; k++) {
      const sp = 45 + (k * 17) % 35, y = g.baseT - 8 - ((S.t * sp + k * 41) % span);
      const x = g.x0 + 24 + ((k * 53) % (2 * POT.hw - 48)) + 4 * Math.sin(S.t * 4 + k), r = 3 + (k % 3) * 1.5;
      ctx.save(); ctx.globalAlpha = 0.75; ctx.strokeStyle = '#d8f6ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
    }
    // 鍋身
    ctx.save();
    if (glass) {
      ctx.fillStyle = 'rgba(170,225,238,0.30)'; ctx.strokeStyle = 'rgba(205,245,255,0.9)'; ctx.lineWidth = 2;
      [[g.x0, g.rim, POT.wall, g.baseT - g.rim], [g.x1 - POT.wall, g.rim, POT.wall, g.baseT - g.rim]].forEach(r => { ctx.fillRect(...r); ctx.strokeRect(...r); });
      ctx.fillRect(g.x0, g.baseT, g.x1 - g.x0, POT.base); ctx.strokeRect(g.x0, g.baseT, g.x1 - g.x0, POT.base);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';      // 玻璃反光
      ctx.beginPath(); ctx.moveTo(g.x0 + 5, g.rim + 14); ctx.lineTo(g.x0 + 5, g.rim + 70); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.x0 + 40, g.baseT + 6); ctx.lineTo(g.x0 + 96, g.baseT + 6); ctx.stroke();
    } else {
      const al = S.mat === 'al', mg = ctx.createLinearGradient(g.x0, 0, g.x1, 0);
      mg.addColorStop(0, al ? '#c4ccd0' : '#7f8a87'); mg.addColorStop(0.5, al ? '#eef2f4' : '#a9b3b0'); mg.addColorStop(1, al ? '#a7b1b5' : '#66716e');
      ctx.fillStyle = mg;
      ctx.fillRect(g.x0, g.rim, POT.wall, g.baseT - g.rim); ctx.fillRect(g.x1 - POT.wall, g.rim, POT.wall, g.baseT - g.rim);
      ctx.fillRect(g.x0 - 6, g.rim - 6, POT.wall + 6, 8); ctx.fillRect(g.x1 - POT.wall, g.rim - 6, POT.wall + 6, 8);
      ctx.fillStyle = rgb(hc);
      if (S.heat > 0.3) { ctx.shadowColor = rgb(hc); ctx.shadowBlur = 24 * S.heat; }
      ctx.fillRect(g.x0, g.baseT, g.x1 - g.x0, POT.base);
      ctx.shadowBlur = 0; ctx.strokeStyle = '#4b5a57'; ctx.lineWidth = 2; ctx.strokeRect(g.x0, g.baseT, g.x1 - g.x0, POT.base);
    }
    ctx.restore();
    // 蒸氣（水夠燙就冒）
    const sa = clamp((S.T - 88) / 12, 0, 1);
    if (sa > 0.02) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 66, 600, H); ctx.clip();
      [CX - 70, CX, CX + 70].forEach((x0, k) => {
        ctx.save(); ctx.globalAlpha = 0.55 * sa; ctx.strokeStyle = '#e8f4f0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let y = g.rim - 10; y >= g.rim - 72; y -= 4) { const x = x0 + 9 * Math.sin(y / 14 + S.t * 3 + k * 2); y === g.rim - 10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
      });
      ctx.restore();
    }
    // 拖曳提示：鍋子外框呼吸＋向上箭頭（提示還在、或正在拖）
    const dragging = ptr && ptr.on, a = dragging ? 0.95 : S.hintA * (0.45 + 0.4 * Math.sin(S.t * 4));
    if (a > 0.02) {
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.yellow; ctx.lineWidth = 4;
      rrect(g.x0 - 12, g.rim - 14, g.x1 - g.x0 + 24, g.baseB - g.rim + 20, 10); ctx.stroke(); ctx.restore();
      if (!dragging && g.rim - 62 > 126) arr(CX, g.rim - 22, CX, g.rim - 62, C.yellow, 5, 16, a, true);
    }
  }

  // ───────── 磁場 B（綠）：穿過鍋底的實線、散開的虛線 ─────────
  function drawField(g) {
    const m = Math.min(1, Math.abs(S.B) / AMAX), sg = S.B >= 0 ? 1 : -1, db = COIL_Y - g.baseB;
    LINE_O.forEach(o => [-1, 1].forEach(side => {
      const through = lineOff(o, db) < POT.hw;
      ctx.save(); ctx.strokeStyle = C.green; ctx.lineCap = 'round';
      ctx.globalAlpha = through ? 0.22 + 0.7 * m : 0.14 + 0.36 * m; ctx.lineWidth = through ? 3.5 : 2.5;
      if (!through) ctx.setLineDash([9, 8]);
      ctx.beginPath();
      for (let d = 0; d <= 400; d += 4) {
        const xo = lineOff(o, d), y = COIL_Y - d;
        if (y < 70 || xo > 190) break;
        d ? ctx.lineTo(CX + side * xo, y) : ctx.moveTo(CX + side * xo, y);
      }
      ctx.stroke(); ctx.restore();
      if (m < 0.05) return;
      [70, 150].forEach(d => {
        const L = 12 + 16 * m; if (lineOff(o, d + L / 2) > 180) return;
        const p1 = { x: CX + side * lineOff(o, d - sg * L / 2), y: COIL_Y - d + sg * L / 2 };
        const p2 = { x: CX + side * lineOff(o, d + sg * L / 2), y: COIL_Y - d - sg * L / 2 };
        arr(p1.x, p1.y, p2.x, p2.y, C.green, 3 + 3 * m, 10 + 8 * m, (0.35 + 0.65 * m) * (through ? 1 : 0.6));
      });
    }));
    if (m > 0.05) text('B', CX + lineOff(96, 70) + 24, COIL_Y - 70, C.green, 26);
  }

  // ───────── 渦電流（粉，鍋底剖面 ⊙⊗）＋ Bᵢ（紫） ─────────
  function drawEddy(g) {
    if (S.A < 0.005 && Math.abs(S.Ie) < 0.005) return;
    const An = Math.min(1, S.A / AMAX), u = Math.min(1, Math.abs(S.Ie) / Math.max(S.A, 1e-6)), dir = S.Ie >= 0 ? 1 : -1;
    const a = clamp(u / 0.2, 0, 1) * (0.35 + 0.65 * u) * (0.35 + 0.65 * An), r = 6 + 5 * An, y = g.baseT + POT.base / 2;
    EDDY_OFF.forEach(o => { sym(CX - o, y, r, dir, C.pink, a); sym(CX + o, y, r, -dir, C.pink, a); });
    const m = Math.min(1, Math.abs(S.Ie) / AMAX);
    if (m > 0.04) {
      const L = 20 + 70 * m, yc = g.baseT - 56;
      arr(CX, yc + dir * L / 2, CX, yc - dir * L / 2, C.indPurple, 5 + 5 * m, 14 + 8 * m, 0.4 + 0.6 * Math.min(1, m * 2));
      text('Bᵢ', CX + 28, yc, C.indPurple, 24, 'center', 0.5 + 0.5 * Math.min(1, m * 2));
    }
  }

  // ───────── 高度標尺 h ─────────
  function drawHeight(g) {
    if (S.h < 4) return;
    const y1 = g.baseB + 3, y2 = PANEL.y0 - 3;
    ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(CX - 20, g.baseB); ctx.lineTo(CX + 20, g.baseB); ctx.stroke(); ctx.restore();
    if (y2 - y1 > 14) { arr(CX, (y1 + y2) / 2, CX, y1, C.yellow, 3, 10, 1, true); arr(CX, (y1 + y2) / 2, CX, y2, C.yellow, 3, 10, 1, true); }
    if (y2 - y1 > 30) text('h', CX + 18, (y1 + y2) / 2, C.yellow, 24);
  }

  // ───────── 剖面標籤 ─────────
  function drawMainLabels(g) {
    const pn = { iron: tr('鐵鍋', 'Iron pot'), al: tr('鋁鍋', 'Aluminum pot'), glass: tr('玻璃鍋', 'Glass pot') }[S.mat];
    const pm = (g.rim + g.baseT) / 2, pl = wrap(pn, LW, 22);
    pl.forEach((s, i) => text(s, LX, pm + (i - (pl.length - 1) / 2) * 26, S.mat === 'glass' ? C.cyan : C.white, 22, 'left'));
    leader(g.x1 + 8, pm, LX - 8, pm, C.white);
    text(tr('爐面', 'Glass top'), LX, 447, C.white, 22, 'left'); leader(PANEL.x1 + 4, 447, LX - 8, 447, C.white);
    text(S.src === 'ac' ? tr('交流線圈', 'AC coil') : tr('直流線圈', 'DC coil'), LX, 478, C.orange, 22, 'left');
    leader(CX + COIL_OFF[3] + 14, COIL_Y, LX - 8, 478, C.orange);
    wrap(tr('電磁爐', 'Induction cooker'), LW, 22).forEach((s, i) => text(s, LX, 506 + i * 26, C.white, 22, 'left'));
    // 左側：水、渦電流
    text(tr('水', 'Water'), g.x0 - 14, g.water + 22, C.cyan, 22, 'right');
    const has = S.A > 0.005 || Math.abs(S.Ie) > 0.005;
    const el = has ? wrap(tr('渦電流', 'Eddy current'), g.x0 - 20, 22) : isEN() ? wrap('No eddy current', g.x0 - 20, 22) : ['沒有', '渦電流'];
    el.forEach((s, i) => text(s, g.x0 - 14, g.baseT - 14 - (el.length - 1 - i) * 26, has ? C.pink : C.muted, 22, 'right'));
  }

  // ───────── 右欄：溫度計 ─────────
  const tY = T => 420 - (clamp(T, 15, 100) - 20) / 80 * 290;
  function drawThermo() {
    const top = 104, bot = 446, by = 470, br = 20, tw = clamp((S.T - T_ROOM) / 80, 0, 1);
    text('°C', TH_X, 84, C.white, 22);
    const fc = rgb(mix([85, 170, 255], [255, 77, 77], tw));
    ctx.save(); ctx.fillStyle = '#1b3a32'; ctx.strokeStyle = C.white; ctx.lineWidth = 3;
    rrect(TH_X - 11, top, 22, bot - top + 8, 11); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(TH_X, by, br, 0, TAU); ctx.fill(); ctx.stroke();
    const lv = tY(S.T);
    ctx.fillStyle = fc; ctx.fillRect(TH_X - 6, lv, 12, by - lv);
    ctx.beginPath(); ctx.arc(TH_X, by, br - 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
    [20, 40, 60, 80, 100].forEach(T => { const y = tY(T); ctx.beginPath(); ctx.moveTo(TH_X + 13, y); ctx.lineTo(TH_X + 22, y); ctx.stroke(); });
    ctx.restore();
    [[100, C.current], [60, C.muted], [20, C.cyan]].forEach(([T, col]) => text(String(T), TH_X - 18, tY(T), col, 20, 'right'));
  }
  // ───────── 右欄：讀數 ─────────
  function drawReadouts() {
    const Tcol = rgb(mix([85, 200, 255], [255, 110, 90], clamp((S.T - T_ROOM) / 80, 0, 1)));
    const rows = [
      [tr('渦電流', 'Eddy current'), eddyPct() + '%', C.pink],
      [tr('發熱功率', 'Heating power'), powPct() + '%', C.orange],
      [tr('水溫', 'Water temp'), Math.round(S.T) + ' °C', Tcol],
      [tr('鍋離爐面 h', 'Pot height h'), `${Math.round(S.h)}／${LIFT_MAX}`, C.yellow],
      [tr('穿過鍋底的磁通量', 'Flux through pan'), kPct() + '%', C.green]
    ];
    rows.forEach(([k, v, col], i) => { const y = 84 + i * 30; text(k, RX, y, C.muted, 22, 'left'); text(v, RX1, y, col, 22, 'right'); });
  }
  // ───────── 右欄：俯視鍋底（與動畫同畫法） ─────────
  const TP = (cx, cy, r, a) => ({ x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) });
  function drawTopView() {
    text(tr('俯視鍋底（從上往下看）', 'Pan bottom (top view)'), RX, 238, C.white, 20, 'left');
    const { x: cx, y: cy, r: R } = TV;
    ctx.save();
    if (S.mat === 'glass') { ctx.fillStyle = 'rgba(170,225,238,0.30)'; ctx.strokeStyle = 'rgba(205,245,255,0.9)'; }
    else {
      const base = heatRGB(S.heat, BASE_RGB[S.mat]), gr = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 5, cx, cy, R);
      gr.addColorStop(0, rgb(mix(base, [255, 255, 255], 0.3))); gr.addColorStop(1, rgb(mix(base, [20, 30, 28], 0.3)));
      ctx.fillStyle = gr; ctx.strokeStyle = '#c3ccc9';
    }
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    // 穿過鍋底的 B（k·B）：⊙ 向上
    const kb = kNow() * S.B, mB = Math.min(1, Math.abs(kb) / AMAX), aB = clamp(mB / 0.1, 0, 1) * (0.3 + 0.7 * mB);
    for (let i = 0; i < 6; i++) { const p = TP(cx, cy, R * 0.46, i * TAU / 6 + 0.52); sym(p.x, p.y, 6 + 4 * mB, kb >= 0 ? 1 : -1, C.green, aB); }
    const tx = cx + R + 12, mw = RX1 - tx, dir = eddyDir();
    if (S.A < 0.005 && !dir) {
      const why = S.mat === 'glass' ? tr('不導電', 'Not a conductor') : S.src === 'dc' ? tr('B 不變', 'B is constant') : tr('磁通量太少', 'Too little flux');
      const wl = wrap(why, mw, 22), nl = wrap(tr('沒有渦電流', 'No eddy current'), mw, 22), all = wl.length + nl.length;
      let y = cy - (all - 1) * 13;
      wl.forEach(s => { text(s, tx, y, S.mat === 'glass' ? C.cyan : C.green, 22, 'left'); y += 26; });
      nl.forEach(s => { text(s, tx, y, C.muted, 22, 'left'); y += 26; });
      return;
    }
    // 渦電流環：粗細、亮度 ∝ 振幅；箭頭沿環流動（shift＝∫Iᵢ，逆時針為正）
    const An = Math.min(1, S.A / AMAX), m = Math.min(1, Math.abs(S.Ie) / AMAX), d = S.Ie >= 0 ? 1 : -1, rr = R * 0.76;
    const u = Math.min(1, Math.abs(S.Ie) / Math.max(S.A, 1e-6)), ae = clamp(u / 0.15, 0, 1) * (0.35 + 0.65 * An);
    ctx.save(); ctx.strokeStyle = C.pink; ctx.globalAlpha = 0.2 + 0.7 * An; ctx.lineWidth = 2 + 5 * An;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 4; i++) {
      const a = i * TAU / 4 + S.shift, p = TP(cx, cy, rr, a), tx2 = -Math.sin(a) * d, ty2 = -Math.cos(a) * d, L = 8 + 8 * An;
      arr(p.x - tx2 * L, p.y - ty2 * L, p.x + tx2 * L, p.y + ty2 * L, C.pink, 4, 13 + 5 * An, ae * (0.4 + 0.6 * u));
    }
    sym(cx, cy, 6 + 6 * m, d, C.indPurple, ae * (0.4 + 0.6 * u));
    // 右邊文字：轉向＋Bᵢ
    if (dir) {
      const full = dir === 'cw' ? tr('順時針', 'clockwise') : tr('逆時針', 'counterclockwise');
      const s = textW(full, 22) <= mw ? full : (dir === 'cw' ? 'CW' : 'CCW');
      text(tr('渦電流', 'Eddy current'), tx, cy - 26, C.pink, 20, 'left');
      text(s, tx, cy, C.pink, 22, 'left');
      text(dir === 'cw' ? tr('Bᵢ 向下 ↓', 'Bᵢ down ↓') : tr('Bᵢ 向上 ↑', 'Bᵢ up ↑'), tx, cy + 28, C.indPurple, 22, 'left');
    } else { const rl = wrap(tr('渦電流換方向中', 'Eddy current reversing'), mw, 20); rl.forEach((l, i) => text(l, tx, cy + (i - (rl.length - 1) / 2) * 24, C.muted, 20, 'left')); }
  }
  // ───────── 右欄：I 與 I² 長條（與動畫第 4 步同畫法） ─────────
  function drawBars() {
    const x0 = RX + 22, w = RX1 - 14 - x0, mid = x0 + w / 2, i = clamp(S.Ie / AMAX, -1, 1);
    let y = 372;
    text(tr('I（渦電流）', 'I (eddy current)'), RX, y, C.pink, 20, 'left'); y += 26;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mid, y - 14); ctx.lineTo(mid, y + 14); ctx.stroke();
    ctx.strokeStyle = '#58736a'; ctx.strokeRect(x0, y - 11, w, 22);
    ctx.fillStyle = C.pink; const w1 = i * (w / 2 - 2); ctx.fillRect(Math.min(mid, mid + w1), y - 8, Math.abs(w1), 16); ctx.restore();
    text('−', x0 - 11, y, C.muted, 22); text('+', x0 + w + 11, y, C.muted, 22);
    y += 34;
    text(tr('I²（發熱快慢）', 'I² (heating rate)'), RX, y, C.orange, 20, 'left'); y += 26;
    ctx.save(); ctx.strokeStyle = '#58736a'; ctx.lineWidth = 2; ctx.strokeRect(x0, y - 11, w, 22);
    ctx.fillStyle = C.orange; ctx.fillRect(x0 + 2, y - 8, i * i * (w - 4), 16); ctx.restore();
    y += 34;
    const pl = isEN() ? ['P ∝ I²: I² > 0 either way,', 'so the pan keeps heating'] : ['P ∝ I²：電流反向時', 'I² 仍是正的，所以一直發熱'];
    pl.slice(0, 2).forEach((s, k) => text(s, RX, y + k * 24, C.muted, 20, 'left'));
  }

  // ───────── 底部：⊙⊗ 圖例、1 Hz 註記 ─────────
  function drawFooter() {
    const s = tr('實際上各國的交流電頻率不同，動畫降成 1 Hz 是為了方便觀察。', 'Real AC frequency differs from country to country; the animation slows it to 1 Hz so it is easy to watch.');
    const ls = wrap(s, 640, 20);
    ls.forEach((l, i) => text(l, W - 14, H - 18 - (ls.length - 1 - i) * 24, C.yellow, 20, 'right'));
    const y = H - 18; let x = 20;
    sym(x + 11, y, 11, 1, C.white, 1); x += 30;
    const s1 = tr('流出畫面', 'out of page'); text(s1, x, y, C.muted, 20, 'left'); x += textW(s1, 20) + 20;
    sym(x + 11, y, 11, -1, C.white, 1); x += 30;
    text(tr('流入畫面', 'into page'), x, y, C.muted, 20, 'left');
  }

  // ───────── 訊息（畫布頂端＋說明框，同一個狀態） ─────────
  function msgKey() {
    const cond = { dc: S.src === 'dc', glass: S.mat === 'glass', lifted: S.h > 6, al: S.mat === 'al' };
    if ((S.focus === 'cold' || S.focus === 'reset') && S.t - S.focusT < 3.5) return S.focus;
    let k = null;
    if (S.focus && cond[S.focus]) k = S.focus;
    else for (const c of ['dc', 'glass', 'lifted', 'al']) if (cond[c]) { k = c; break; }
    if (k === 'dc' && S.mat !== 'glass' && Math.abs(S.Ie) > 0.03) return 'dcBlip';
    return k || 'iron';
  }
  function caption() {
    switch (msgKey()) {
      case 'dc': return tr('換成直流電：磁場不變 → 沒有渦電流，不會熱', 'Switched to DC: the field stays constant → no eddy current, no heat');
      case 'dcBlip': return tr('接上直流的一瞬間磁場在變，渦電流只閃一下', 'Only at the instant DC switches on does the field change: one brief flash of eddy current');
      case 'glass': return tr('換成玻璃鍋：不導電，沒有渦電流，不會熱', 'Glass pot: not a conductor, no eddy current, no heat');
      case 'lifted': return kNow() < 0.3
        ? tr('把鍋子拉離爐面：穿過鍋底的磁通量變少 → 渦電流小 → 幾乎不發熱', 'Pot lifted: less flux through the pan → small eddy current → hardly any heat')
        : tr('鍋子提起一點：穿過鍋底的磁通量變少，渦電流和發熱都變小', 'Pot raised a little: less flux through the pan, so less eddy current and less heat');
      case 'al': return tr('換成鋁鍋：渦電流較小，加熱很慢（示意）', 'Aluminum pot: weaker eddy current, very slow heating (simplified)');
      case 'cold': return tr('換一鍋冷水：水溫回到 20 °C', 'Fresh cold water: back to 20 °C');
      case 'reset': return tr('鍋子放回爐面：磁通量又全部穿過鍋底', 'Pot back on the cooktop: all the flux passes through the pan again');
      default:
        if (S.T >= 99.5) return tr('水滾了！鍋底的渦電流一直在發熱', 'Boiling! The eddy current in the pan keeps heating it');
        if (S.fire === 2) return tr('鐵鍋放回爐面、火力大：渦電流強、很快煮開', 'Iron pot on the cooktop, high power: strong eddy current, boils quickly');
        if (S.fire === 0) return tr('火力小：線圈電流小 → 磁場小 → 渦電流小，加熱慢', 'Low power: small coil current → weak field → small eddy current, slow heating');
        return tr('交流磁場來回變 → 鍋底出現渦電流 → 鍋底發熱', 'The AC field keeps flipping → eddy currents in the pan → the pan heats up');
    }
  }
  function captionColor() {
    const k = msgKey();
    return { dc: C.pink, dcBlip: C.pink, glass: C.cyan, lifted: C.green, al: C.muted, cold: C.cyan, reset: C.green }[k] || (S.T >= 99.5 ? C.orange : C.yellow);
  }
  function resultHTML() {
    const k = msgKey(), kp = Math.round(kNow() * 20) * 5;
    let main;
    switch (k) {
      case 'dc': main = tr('<strong class="pink">換成直流電</strong>：線圈電流不變，所以<strong class="green">磁場 B 固定不變</strong>，穿過鍋底的磁通量沒有改變 → <strong class="pink">沒有渦電流、不發熱</strong>。直流只有<strong class="yellow">接上（或改火力）那一瞬間</strong>磁場在變，渦電流只閃一下。',
        '<strong class="pink">Switched to DC</strong>: the coil current is steady, so <strong class="green">the field B stays constant</strong> and the flux through the pan does not change → <strong class="pink">no eddy current, no heat</strong>. With DC the field changes only <strong class="yellow">at the instant it switches on (or the power changes)</strong>, so the eddy current just flashes once.'); break;
      case 'dcBlip': main = tr('<strong class="yellow">接上直流的一瞬間</strong>：磁場從原來的值變到固定值，磁通量在變 → 鍋底閃過一下渦電流（Bᵢ 反抗這個改變）。磁場一穩定，渦電流就沒了——<strong class="pink">直流只有一瞬間</strong>。',
        '<strong class="yellow">At the instant DC switches on</strong>, the field moves to its steady value, so the flux changes → a brief eddy current flashes in the pan (Bᵢ opposes the change). Once the field is steady the eddy current is gone — <strong class="pink">with DC it lasts only an instant</strong>.'); break;
      case 'glass': main = tr('<strong class="cyan">換成玻璃鍋</strong>：磁場一樣穿過鍋底、一樣在變，但玻璃<strong class="pink">不導電</strong>，電荷沒辦法繞圈流動 → <strong class="pink">沒有渦電流，不會熱</strong>。所以電磁爐要用金屬鍋。',
        '<strong class="cyan">Glass pot</strong>: the field still passes through the bottom and still changes, but glass is <strong class="pink">not a conductor</strong>, so no current can circulate → <strong class="pink">no eddy current, no heat</strong>. That is why an induction cooker needs a metal pot.'); break;
      case 'lifted': main = tr(`<strong class="green">把鍋子拉離爐面</strong>：磁力線往外散開，只有約 <strong class="yellow">${kp}%</strong> 的磁通量還穿過鍋底 → 渦電流變小（${eddyPct()}%）→ 發熱功率 ∝ I²，掉得更快（${powPct()}%）${kNow() < 0.3 ? '，<strong class="pink">幾乎不發熱</strong>' : ''}。`,
        `<strong class="green">Pot lifted off the cooktop</strong>: the field lines spread out and only about <strong class="yellow">${kp}%</strong> of the flux still passes through the pan → a smaller eddy current (${eddyPct()}%) → heating ∝ I² drops even faster (${powPct()}%)${kNow() < 0.3 ? ', <strong class="pink">hardly any heat</strong>' : ''}.`); break;
      case 'al': main = tr('<strong class="yellow">換成鋁鍋</strong>：一樣有渦電流，但比鐵鍋小很多，發熱很慢（<strong class="pink">示意：鋁鍋在多數電磁爐上加熱效果很差</strong>）。',
        '<strong class="yellow">Aluminum pot</strong>: there is still an eddy current, but much smaller than in iron, so it heats very slowly (<strong class="pink">simplified: aluminum pots heat poorly on most induction cookers</strong>).'); break;
      case 'cold': main = tr('<strong class="cyan">換一鍋冷水</strong>：水溫回到 20 °C，看看現在的設定要多久才會煮開。', '<strong class="cyan">Fresh cold water</strong>: back to 20 °C. See how long the current setting takes to boil it.'); break;
      case 'reset': main = tr('<strong class="green">鍋子放回爐面</strong>：磁力線又全部穿過鍋底，渦電流與發熱回到最大。', '<strong class="green">Pot back on the cooktop</strong>: all the field lines pass through the pan again, so eddy current and heating are back to full.'); break;
      default: {
        const fz = ['小', '中', '大'][S.fire], fe = ['low', 'medium', 'high'][S.fire];
        main = S.fire === 2
          ? tr('<strong class="yellow">鐵鍋放回爐面、火力大</strong>：線圈電流大 → 磁場變化大 → <strong class="pink">渦電流強</strong>，P ∝ I²，<strong class="orange">很快就煮開</strong>。',
            '<strong class="yellow">Iron pot on the cooktop, high power</strong>: big coil current → big field change → <strong class="pink">strong eddy current</strong>; P ∝ I², so it <strong class="orange">boils quickly</strong>.')
          : tr(`<strong class="yellow">鐵鍋在爐面、火力${fz}</strong>：交流磁場一直來回變，鍋底的磁通量跟著變 → 感應出<strong class="pink">渦電流</strong> → 鍋底發熱。火力${fz}：線圈電流 ×${FIRE[S.fire]}，渦電流 ×${FIRE[S.fire]}，發熱 ×${FIRE[S.fire] * FIRE[S.fire]}。`,
            `<strong class="yellow">Iron pot on the cooktop, ${fe} power</strong>: the AC field keeps flipping, so the flux through the pan keeps changing → <strong class="pink">eddy currents</strong> → the pan heats up. ${fe[0].toUpperCase() + fe.slice(1)} power: coil current ×${FIRE[S.fire]}, eddy current ×${FIRE[S.fire]}, heating ×${FIRE[S.fire] * FIRE[S.fire]}.`);
      }
    }
    const wz = { cold: '冷水', warm: '溫水', hot: '熱水', boil: '沸騰' }[waterKey()], we = { cold: 'cold', warm: 'warm', hot: 'hot', boil: 'boiling' }[waterKey()];
    const water = waterKey() === 'boil' ? tr('水已經滾了，溫度停在 <strong class="orange">100 °C</strong>，多的熱讓水變成水蒸氣。', 'The water is boiling: it stays at <strong class="orange">100 °C</strong> and the extra heat turns water into steam.') : '';
    const tip = S.src === 'ac'
      ? tr('交流 1 Hz 慢動作：B 向上增強時渦電流俯視<strong class="pink">順時針</strong>、Bᵢ 向下；B 向上減弱時反過來（冷次定律）。', 'AC at 1 Hz slow motion: while upward B grows, the eddy current is <strong class="pink">clockwise</strong> from above and Bᵢ points down; while it fades, both reverse (Lenz’s law).')
      : tr('電磁爐要靠<strong class="yellow">一直在改變的磁場</strong>，所以要用交流電。', 'An induction cooker needs a <strong class="yellow">constantly changing field</strong>, which is why it runs on AC.');
    const pos = S.h < 1 ? tr('鍋在爐面', 'pot on the cooktop') : tr(`鍋提起（穿過鍋底約 ${kp}%）`, `pot lifted (about ${kp}% of the flux)`);
    const setup = tr(`目前：${S.src === 'ac' ? '交流' : '直流'}｜${{ iron: '鐵鍋', al: '鋁鍋', glass: '玻璃鍋' }[S.mat]}｜火力${['小', '中', '大'][S.fire]}｜${pos}｜${wz}`,
      `Now: ${S.src === 'ac' ? 'AC' : 'DC'} | ${{ iron: 'iron', al: 'aluminum', glass: 'glass' }[S.mat]} pot | ${['low', 'medium', 'high'][S.fire]} power | ${pos} | ${we} water`);
    return `${main}${water ? ' ' + water : ''}<br>${tip}<br><span class="green">${setup}</span>`;
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
    const g = potG();
    drawCooker();
    drawPot(g);
    drawField(g);
    drawEddy(g);
    drawHeight(g);
    drawMainLabels(g);
    drawThermo();
    drawReadouts();
    drawTopView();
    drawBars();
    drawFooter();
    const ls = wrap(caption(), 950, 24), y0 = ls.length > 1 ? 22 : 36;
    ls.forEach((s, i) => text(s, W / 2, y0 + i * 30, captionColor(), 24));
    if (S.hintA > 0.01) {
      const s = tr('👆 往上拖曳鍋子，把它拉離爐面', '👆 Drag the pot up to lift it off the cooktop'), w = textW(s, 24) + 28, y = 100;
      const cx = clamp(CX, w / 2 + 8, 600 - w / 2), pulse = 0.75 + 0.25 * Math.sin(S.t * 4);
      ctx.save(); ctx.globalAlpha = S.hintA; ctx.fillStyle = PANEL_BG; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
      rrect(cx - w / 2, y - 19, w, 38, 10); ctx.fill(); ctx.stroke(); ctx.restore();
      text(s, cx, y + 1, C.cyan, 24, 'center', S.hintA * pulse);
    }
  }

  // ───────── 物理步進 ─────────
  function step(dt) {
    S.t += dt;
    if (!(ptr && ptr.on)) {
      S.h += (S.hT - S.h) * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(S.hT - S.h) < 0.05) S.h = S.hT;
    }
    const f = F(), k = kNow(), m = MAT[S.mat];
    if (S.src === 'ac') {
      S.acT += dt;
      const ph = TAU * S.acT;
      S.B = f * Math.sin(ph); S.dB = f * TAU * Math.cos(ph); S.I = S.B;
    } else {
      S.dcT += dt;
      const e = Math.exp(-S.dcT / TAU_DC), d0 = S.dcB0 - f;
      S.B = f + d0 * e; S.dB = Math.abs(d0 * e) < 1e-4 ? 0 : -d0 / TAU_DC * e; S.I = S.B;
    }
    S.Ie = -k * m * S.dB / TAU;
    if (Math.abs(S.Ie) < 1e-4) S.Ie = 0;
    S.A = S.src === 'ac' ? k * m * f : Math.abs(S.Ie);
    S.P = Math.min(1, S.src === 'ac' ? (S.A / AMAX) * (S.A / AMAX) : 2 * (S.Ie / AMAX) * (S.Ie / AMAX));
    S.heat += (Math.sqrt(S.P) - S.heat) * (1 - Math.exp(-dt / 0.8));
    S.T = clamp(S.T + (HEAT_A * S.P - COOL_B * (S.T - T_ROOM)) * dt, T_ROOM - 1, 100);
    S.shift += 3.46 * S.Ie * dt;
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
  function focus(k) { S.focus = k; S.focusT = S.t; }
  function dcRestart() { S.dcB0 = S.B; S.dcT = 0; }
  const ACTIONS = {
    ac: () => { if (S.src === 'ac') return; S.src = 'ac'; S.acT = 0.25; focus(null); },            // 從 B＝F 的峰值接上，不跳
    dc: () => { if (S.src === 'dc') return; dcRestart(); S.src = 'dc'; focus('dc'); },
    iron: () => { S.mat = 'iron'; focus(null); },
    al: () => { S.mat = 'al'; focus('al'); },
    glass: () => { S.mat = 'glass'; focus('glass'); },
    reset: () => { S.hT = 0; focus('reset'); },
    cold: () => { S.T = T_ROOM; focus('cold'); }
  };
  [0, 1, 2].forEach(i => { ACTIONS['f' + i] = () => { if (S.fire === i) return; if (S.src === 'dc') dcRestart(); S.fire = i; focus(S.src === 'dc' ? 'dc' : null); }; });
  function act(key) {
    if (!ACTIONS[key]) return;
    S.actions++; ACTIONS[key](); updateUI();
    if (!S.raf) render();
  }
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [tr('電源', 'Supply'), [['ac', tr('交流', 'AC')], ['dc', tr('直流', 'DC')]]],
      [tr('鍋子', 'Pot'), [['iron', tr('鐵鍋', 'Iron')], ['al', tr('鋁鍋', 'Aluminum')], ['glass', tr('玻璃鍋', 'Glass')]]],
      [tr('火力', 'Power level'), [['f0', tr('小', 'Low')], ['f1', tr('中', 'Medium')], ['f2', tr('大', 'High')]]],
      [tr('重設', 'Reset'), [['reset', tr('鍋子放回', 'Put pot back')], ['cold', tr('換冷水', 'Fresh cold water')]]]
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
      if (k === 'reset') { b.disabled = S.hT === 0 && S.h === 0; return; }
      if (k === 'cold') return;
      const on = k === S.src || k === S.mat || k === 'f' + S.fire;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
    });
    lastReset = null; syncResetBtn();
    writeResult();
    if (cv) cv.setAttribute('aria-label', tr('電磁爐實驗台：往上拖曳鍋子（或按上下方向鍵）把鍋子拉離爐面；按鈕切換交流／直流、鍋子材質、火力、換冷水',
      'Induction cooker bench: drag the pot up (or use the up/down arrow keys) to lift it off the cooktop; buttons switch AC/DC, pot material, power level, and refill cold water'));
  }
  function syncResetBtn() {
    const dis = S.hT === 0 && S.h === 0;
    if (dis !== lastReset) { lastReset = dis; const b = ctrl && ctrl.querySelector('.lab-btn[data-act="reset"]'); if (b) b.disabled = dis; }
  }

  // ───────── 拖曳（只有按住鍋子才接管） ─────────
  function toLogical(c) { const r = cv.getBoundingClientRect(); return { x: (c.clientX - r.left) * W / (r.width || W), y: (c.clientY - r.top) * H / (r.height || H) }; }
  function onPot(p) { const g = potG(); return p.x >= g.x0 - 16 && p.x <= g.x1 + 16 && p.y >= g.rim - 16 && p.y <= g.baseB + 10; }
  function onTouchStart(e) {                                   // 觸控：按在鍋子上才擋下捲動（pan-y 不會自己讓出垂直方向）
    const t = e.touches[0]; if (t && e.touches.length === 1 && onPot(toLogical(t)) && e.cancelable) e.preventDefault();
  }
  function onTouchMove(e) { if (ptr && ptr.on && e.cancelable) e.preventDefault(); }
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = toLogical(e);
    if (!onPot(p)) return;                                       // 不在鍋子上：交給頁面（垂直捲動照常）
    ptr = { id: e.pointerId, y0: p.y, h0: S.h, on: true };
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 不支援就算了 */ }
    cv.classList.add('dragging');
    if (S.focus === 'reset' || S.focus === 'cold') S.focus = null;
    if (e.cancelable) e.preventDefault();
  }
  function onMove(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const p = toLogical(e);
    S.h = S.hT = clamp(ptr.h0 + (ptr.y0 - p.y), 0, LIFT_MAX);
    if (Math.abs(p.y - ptr.y0) > 4) { S.dragged = true; if (S.h > 6) S.focus = 'lifted'; }
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
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    S.dragged = true;
    S.hT = clamp(S.hT + (e.key === 'ArrowUp' ? KEY_STEP : -KEY_STEP), 0, LIFT_MAX);
    S.focus = S.hT > 6 ? 'lifted' : null;
    syncResetBtn();
  }
  const onVis = () => sync();

  // ═════════ 介面契約 ═════════
  function activate() {
    if (S.on) deactivate();
    cv = document.getElementById('cookerLabCanvas');
    ctrl = document.getElementById('cookerLabControls');
    res = document.getElementById('cookerLabResult');
    if (!cv) return;
    ctx = cv.getContext('2d');
    S.on = true; S.visible = true; lastRes = ''; lastReset = null;
    buildControls(); updateUI();
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('touchstart', onTouchStart, { passive: false });
    cv.addEventListener('touchmove', onTouchMove, { passive: false });
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
      cv.removeEventListener('touchstart', onTouchStart, { passive: false });
      cv.removeEventListener('touchmove', onTouchMove, { passive: false });
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
      src: S.src, mat: S.mat, fire: FIRE[S.fire], h: +S.h.toFixed(1), k: +kNow().toFixed(3), kPct: kPct(),
      B: +S.B.toFixed(3), Ie: +S.Ie.toFixed(3), A: +S.A.toFixed(3), eddyPct: eddyPct(), P: +S.P.toFixed(4), powPct: powPct(),
      heat: +S.heat.toFixed(3), T: +S.T.toFixed(2), water: waterKey(), quad: quad(), eddyDir: eddyDir(),
      bi: eddyDir() === 'ccw' ? 'up' : eddyDir() === 'cw' ? 'down' : null, bDir: Math.abs(S.B) < 0.02 ? null : S.B > 0 ? 'up' : 'down',
      bGrowing: Math.abs(S.dB) < 1e-3 ? null : S.B * S.dB > 0,
      msg: msgKey(), caption: caption(), hintA: +S.hintA.toFixed(2), dragged: S.dragged, dragging: !!(ptr && ptr.on),
      running: !!S.raf, on: S.on, actions: S.actions, t: +S.t.toFixed(2)
    };
  }
  // 測試用：直接把鍋子放到某個高度（正式畫面不呼叫）
  function _setH(px) { S.h = S.hT = clamp(px, 0, LIFT_MAX); syncResetBtn(); }

  EmLab.cooker = { activate, deactivate, relang, _state, _setH };
})();

/* work_5_lab_renew_1118_v1.js — 「🔧 動手做｜幫再生能源挑地點」實驗台（#renewLabCanvas，邏輯 960×540、2x 高解析）
 *
 * 契約：window.W5Lab.renew = { activate(), deactivate(), relang(), _state() }
 * 自給自足：不依賴 W5 / EmLab 的 helper；只用頁面全域 tr('中文','English')（不存在時退回中文）。
 * 本檔載入時自己把實驗台 DOM（含 <style id="lab-renew-css">）附加到 #tab4 最後面。
 * 頁面沒有呼叫 activate／relang 時的保底：畫布進入可視範圍就自動 activate、離開就 deactivate；
 *   <html lang> 改變（頁面 setLanguage 會改它）就自動 relang。
 *
 * 畫面：一張簡化地形剖面圖（左→右）：火山溫泉地帶（地熱電廠）｜山上水庫（水壩＋水力）｜平原（屋頂太陽能、河流）｜海岸（風力機）｜海。
 *   下方四列：每種發電方式一顆燈泡（亮度＝發電多寡）＋條狀示意＋最近幾秒的「起伏線」＋穩定性標籤。全部「示意」，不標數字。
 * 物理（課文）：水力＝高處的水往低處流，重力位能→電能；風力＝空氣流動的動能→電能，受天候影響；
 *   太陽能光電＝光能→電能，夜間難以發電；地熱＝抽地底熱水或水蒸氣推動渦輪，熱能→電能，用完注回地下，可長時間穩定發電。
 *   水庫可蓄水，晴陰一時影響小，但要靠降雨補水（課本表 1 把水力也列在「供電不穩定」）。
 * 示意發電程度（0～1，非實測）：地熱 0.62 幾乎不變；水力 0.72 幾乎不變；太陽能 晴 0.88／陰 約 0.28 且忽明忽暗；
 *   風力 強風 約 0.72±0.2（陣風起伏）／微風 約 0.18±0.1。
 * 操作：按鈕（挑地點／條件 5 個、天氣 晴／陰、風 強／微）；畫布點選或水平拖曳挑地點；
 *   鍵盤（畫布聚焦）：←／→ 換地點、空白鍵或 Enter 切換晴／陰、↑／↓ 強風／微風。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'renew', TAB = 'tab4';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const FONT = '"Noto Sans TC","JetBrains Mono",sans-serif';
  const COL = {
    bg: '#11261f', panel: '#1c3d34', deep: '#0b1a15', chalk: '#f2ecd9', muted: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', green: '#4ade80', orange: '#fb923c', pink: '#f472b6', red: '#ff6b6b'
  };
  const PANEL = 'rgba(11,26,21,0.92)';

  const T = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const isEn = () => T('zh', 'en') === 'en';

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  function font(size) { return `700 ${size}px ${FONT}`; }
  function textW(c, s, size) { c.save(); c.font = font(size); const w = c.measureText(s).width; c.restore(); return w; }
  function fitSize(c, s, maxW, size, min) { let z = size; while (z > min && textW(c, s, z) > maxW) z -= 1; return z; }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function hexA(h, a) { h = h.replace('#', ''); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; }
  // 文字盒記錄（測試用：_state().boxes）
  let BOXES = [];
  function noteBox(s, x0, y0, x1, y1) { BOXES.push({ s, x0: +x0.toFixed(1), y0: +y0.toFixed(1), x1: +x1.toFixed(1), y1: +y1.toFixed(1) }); }
  function label(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    c.save(); c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    noteBox(s, x0, y - size * 0.6, x0 + w, y + size * 0.6);
    return w;
  }
  // 有深色底板的小標籤；限制在 [xMin,xMax] 內
  function tag(c, s, x, y, color, size, xMin, xMax, filled) {
    xMin = xMin == null ? 6 : xMin; xMax = xMax == null ? W - 6 : xMax;
    size = fitSize(c, s, xMax - xMin - 22, size || 22, 20);
    const w = textW(c, s, size) + 22, h = size * 1.5;
    x = clamp(x, xMin + w / 2, xMax - w / 2);
    c.save(); c.fillStyle = filled ? color : PANEL; c.strokeStyle = color; c.lineWidth = 2;
    rr(c, x - w / 2, y - h / 2, w, h, 9); c.fill(); c.stroke();
    c.font = font(size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = filled ? COL.deep : color; c.fillText(s, x, y + 1);
    c.restore();
    noteBox(s, x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    return { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
  }
  function arrow(c, x1, y1, x2, y2, color, lw, head) {
    lw = lw || 3; head = head || 10;
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
    c.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head);
    c.closePath(); c.fill(); c.restore();
  }

  // ═════════ 地形與場景常數（邏輯座標） ═════════
  const SKY_T = 46, GROUND_B = 338;
  const SEA_X = 822, SEA_Y = 296;
  // 地面剖面線（由左到右）
  const SURF = [
    [0, 256], [40, 236], [96, 132], [108, 124], [113, 134], [127, 134], [132, 124], [144, 132], [196, 240], [222, 246],
    [262, 98], [300, 150], [300, 206], [346, 206], [346, 158], [358, 166], [470, 288], [700, 292], [716, 280], [808, 282],
    [SEA_X, 300], [880, 318], [960, 326]
  ];
  // 水庫：水壩在 x 346；蓄水區在 300～346 之間，水面 y 162
  const RES = { x0: 300, x1: 346, top: 162, bot: 206 };
  const PH = { x: 448, y: 270 };                 // 水力發電廠房
  const GEO = { x: 186, y: 230 };                // 地熱電廠
  const HOT = { x0: 30, x1: 240, y: 318 };        // 地底熱水層
  const HOUSES = [520, 585, 650];
  const TURB = [{ x: 738, y: 280, h: 96 }, { x: 792, y: 282, h: 88 }];
  const SUN = { x: 890, y: 92, r: 28 };

  // 四個地點（拖曳／方向鍵用）；x 範圍＝拖曳選擇區
  const SITES = [
    { id: 'geo', x0: 0, x1: 222, cx: 130 },
    { id: 'hydro', x0: 222, x1: 472, cx: 360 },
    { id: 'solar', x0: 472, x1: 702, cx: 586 },
    { id: 'wind', x0: 702, x1: 960, cx: 780 }
  ];
  const SITE_IDS = SITES.map(s => s.id);
  const ROWS = ['hydro', 'wind', 'solar', 'geo'];
  const ROW_Y0 = 352, ROW_H = 45;

  const NAME = {
    geo: () => T('地熱', 'Geothermal'), hydro: () => T('水力', 'Hydro'),
    solar: () => T('太陽能', 'Solar'), wind: () => T('風力', 'Wind')
  };
  const SITE_TAG = {
    geo: () => T('火山溫泉地帶', 'Volcanic hot springs'), hydro: () => T('山上水庫', 'Mountain reservoir'),
    solar: () => T('屋頂太陽能', 'Rooftop solar'), wind: () => T('強風海岸', 'Windy coast')
  };

  // ═════════ 狀態 ═════════
  const S = {
    site: 'hydro', weather: 'sunny', wind: 'strong', pick: 'hydro',
    t: 0, last: 0, raf: 0, on: false, visible: false, auto: true,
    lv: { hydro: 0.72, wind: 0.72, solar: 0.88, geo: 0.62 },   // 顯示中的發電程度（平滑追目標）
    hist: { hydro: [], wind: [], solar: [], geo: [] }, histT: 0,
    rot: { wind: [0, 1.1], hydro: 0, geo: 0 }, flow: 0, river: 0, cloudX: 0,
    drag: null, actions: 0, frames: 0
  };
  const HIST_N = 110, HIST_DT = 0.06;

  // 示意發電程度（目標值）：時間 t 的函式
  function gust(t) { return 0.5 * Math.sin(1.3 * t) + 0.3 * Math.sin(3.7 * t + 1) + 0.2 * Math.sin(7.1 * t + 2); }
  function cloudShade(t) { return 0.5 + 0.5 * (0.6 * Math.sin(0.9 * t + 0.4) + 0.4 * Math.sin(2.3 * t + 1.7)); }
  function target(id, t) {
    switch (id) {
      case 'geo': return 0.62 + 0.006 * Math.sin(0.7 * t);
      case 'hydro': return 0.72 + 0.012 * Math.sin(0.5 * t + 1);
      case 'solar': return S.weather === 'sunny' ? 0.88 + 0.015 * Math.sin(0.6 * t) : 0.16 + 0.2 * cloudShade(t);
      case 'wind': return S.wind === 'strong' ? clamp(0.72 + 0.2 * gust(t), 0.3, 1) : clamp(0.18 + 0.1 * gust(t * 0.8), 0.04, 0.4);
    }
    return 0;
  }
  function fillHist() { for (const id of ROWS) { S.hist[id] = []; for (let i = 0; i < HIST_N; i++) S.hist[id].push(S.lv[id]); } }
  fillHist();

  let cv = null, ctx = null, ctrl = null, res = null, io = null, desk = null;

  // ═════════ 畫：天空、地形 ═════════
  function drawSky() {
    const sunny = S.weather === 'sunny';
    const g = ctx.createLinearGradient(0, SKY_T, 0, 300);
    if (sunny) { g.addColorStop(0, '#1d4a63'); g.addColorStop(1, '#2a6070'); }
    else { g.addColorStop(0, '#2b3a3c'); g.addColorStop(1, '#3d4b4b'); }
    ctx.fillStyle = g; ctx.fillRect(0, SKY_T, W, 300 - SKY_T);
    // 太陽
    const sa = sunny ? 1 : 0.35;
    const gl = ctx.createRadialGradient(SUN.x, SUN.y, 4, SUN.x, SUN.y, SUN.r * 3);
    gl.addColorStop(0, hexA(COL.yellow, 0.55 * sa)); gl.addColorStop(1, hexA(COL.yellow, 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(SUN.x, SUN.y, SUN.r * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = sunny ? COL.yellow : '#b8ab6a'; ctx.beginPath(); ctx.arc(SUN.x, SUN.y, SUN.r, 0, TAU); ctx.fill();
    if (sunny) {
      ctx.save(); ctx.strokeStyle = hexA(COL.yellow, 0.8); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = i * TAU / 10 + S.t * 0.3;
        ctx.beginPath(); ctx.moveTo(SUN.x + Math.cos(a) * 36, SUN.y + Math.sin(a) * 36); ctx.lineTo(SUN.x + Math.cos(a) * 46, SUN.y + Math.sin(a) * 46); ctx.stroke();
      }
      ctx.restore();
    }
  }
  function cloud(x, y, s, col) {
    ctx.fillStyle = col; ctx.beginPath();
    ctx.arc(x, y, 18 * s, 0, TAU); ctx.arc(x + 22 * s, y - 10 * s, 22 * s, 0, TAU); ctx.arc(x + 46 * s, y, 18 * s, 0, TAU);
    ctx.rect(x, y, 46 * s, 18 * s); ctx.fill();
  }
  function drawClouds() {
    const sunny = S.weather === 'sunny';
    const sp = S.wind === 'strong' ? 1 : 0.35;
    const list = sunny ? [[0.1, 92, 0.8], [0.55, 70, 0.7]] : [[0.02, 86, 1.3], [0.24, 70, 1.1], [0.46, 96, 1.4], [0.68, 74, 1.2], [0.86, 92, 1.5]];
    ctx.save();
    for (const [p, y, s] of list) {
      const x = ((p * 1100 + S.cloudX * sp) % 1100) - 90;
      cloud(x, y, s, sunny ? 'rgba(242,236,217,0.55)' : 'rgba(150,160,158,0.92)');
    }
    // 陰天：雲飄過太陽時遮更多
    if (!sunny) {
      ctx.globalAlpha = 0.55 * (1 - cloudShade(S.t));
      cloud(SUN.x - 46, SUN.y + 4, 1.4, 'rgb(130,140,138)');
    }
    ctx.restore();
  }
  function surfY(x) {
    for (let i = 1; i < SURF.length; i++) {
      const [x0, y0] = SURF[i - 1], [x1, y1] = SURF[i];
      if (x <= x1) return x1 === x0 ? y1 : lerp(y0, y1, (x - x0) / (x1 - x0));
    }
    return SURF[SURF.length - 1][1];
  }
  function drawGround() {
    // 地層（剖面）
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, GROUND_B);
    for (const [x, y] of SURF) ctx.lineTo(x, y);
    ctx.lineTo(W, GROUND_B); ctx.closePath();
    ctx.save(); ctx.clip();
    const g = ctx.createLinearGradient(0, 100, 0, GROUND_B);
    g.addColorStop(0, '#5b6b4a'); g.addColorStop(0.45, '#6a5a3e'); g.addColorStop(1, '#4a3a28');
    ctx.fillStyle = g; ctx.fillRect(0, 90, W, GROUND_B - 90);
    // 地層紋
    ctx.strokeStyle = 'rgba(242,236,217,0.12)'; ctx.lineWidth = 2;
    for (let k = 1; k < 4; k++) { ctx.beginPath(); for (let x = 0; x <= W; x += 20) { const y = surfY(x) + 14 * k + 4 * Math.sin(x / 60 + k); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    // 火山下的熱：地底熱水層
    const hg = ctx.createRadialGradient(130, GROUND_B + 10, 10, 130, GROUND_B + 10, 140);
    hg.addColorStop(0, 'rgba(255,110,60,0.95)'); hg.addColorStop(0.5, 'rgba(251,146,60,0.45)'); hg.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 200, 300, GROUND_B - 200);
    // 火山口的熱氣
    ctx.restore();
    // 草地表面線
    ctx.strokeStyle = '#7fae6a'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); SURF.forEach(([x, y], i) => { if (x > SEA_X) return; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.restore();
    // 火山口冒煙（裝飾）
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const ph = (S.t * 0.35 + i / 3) % 1;
      ctx.globalAlpha = 0.45 * (1 - ph); ctx.fillStyle = '#d9d4c4';
      ctx.beginPath(); ctx.arc(120 + 10 * Math.sin(ph * 5 + i), 124 - ph * 50, 6 + ph * 12, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function drawSea() {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(SEA_X - 6, SEA_Y);
    for (let x = SEA_X - 6; x <= W; x += 8) ctx.lineTo(x, SEA_Y + 3 * Math.sin(x / 18 + S.t * 2));
    ctx.lineTo(W, GROUND_B); ctx.lineTo(SEA_X - 6, GROUND_B); ctx.closePath();
    ctx.save(); ctx.clip();
    const g = ctx.createLinearGradient(0, SEA_Y, 0, GROUND_B); g.addColorStop(0, 'rgba(56,150,200,0.92)'); g.addColorStop(1, 'rgba(20,70,110,0.95)');
    ctx.fillStyle = g; ctx.fillRect(SEA_X - 6, SEA_Y - 6, W, GROUND_B);
    ctx.restore();
    // 海底（在水下）
    ctx.strokeStyle = 'rgba(242,236,217,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(SEA_X, 300); ctx.lineTo(880, 318); ctx.lineTo(960, 326); ctx.stroke();
    ctx.restore();
  }
  // 河：從水力廠房流到海
  function drawRiver() {
    ctx.save();
    ctx.strokeStyle = '#3aa0d8'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); for (let x = PH.x + 18; x <= SEA_X; x += 6) { const y = surfY(x) - 1; x === PH.x + 18 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.strokeStyle = 'rgba(230,248,255,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([8, 14]); ctx.lineDashOffset = -S.river;
    ctx.beginPath(); for (let x = PH.x + 18; x <= SEA_X; x += 6) { const y = surfY(x) - 2; x === PH.x + 18 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }

  // ═════════ 畫：發電裝置 ═════════
  function turbineWheel(x, y, r, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawHydro() {
    const lv = S.lv.hydro;
    // 蓄水
    ctx.save();
    ctx.beginPath(); ctx.moveTo(RES.x0 - 22, RES.top);
    for (let x = RES.x0 - 22; x <= RES.x1; x += 6) ctx.lineTo(x, RES.top + 1.5 * Math.sin(x / 9 + S.t * 1.6));
    ctx.lineTo(RES.x1, RES.bot); ctx.lineTo(RES.x0, RES.bot); ctx.lineTo(RES.x0, RES.top + 4); ctx.lineTo(282, RES.top + 4); ctx.closePath();
    const g = ctx.createLinearGradient(0, RES.top, 0, RES.bot); g.addColorStop(0, '#4fb3e6'); g.addColorStop(1, '#1d5f8c');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    // 水壩
    ctx.save(); ctx.fillStyle = '#b9c2bd'; ctx.strokeStyle = '#59645f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(RES.x1, 150); ctx.lineTo(RES.x1 + 10, 150); ctx.lineTo(RES.x1 + 20, 208); ctx.lineTo(RES.x1, 208); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // 壓力水管：壩底 → 廠房
    const P = [{ x: RES.x1 + 14, y: 200 }, { x: 410, y: 244 }, { x: PH.x - 14, y: PH.y }];
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2b3b38'; ctx.lineWidth = 11; ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    ctx.strokeStyle = '#7f8f8a'; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = '#8fd8ff'; ctx.lineWidth = 4; ctx.setLineDash([6, 10]); ctx.lineDashOffset = -S.flow;
    ctx.globalAlpha = clamp(lv * 1.2, 0, 1); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    // 廠房
    ctx.save(); ctx.fillStyle = '#d6cdb2'; ctx.strokeStyle = '#5c5440'; ctx.lineWidth = 2;
    rr(ctx, PH.x - 16, PH.y - 22, 34, 24, 3); ctx.fill(); ctx.stroke(); ctx.restore();
    turbineWheel(PH.x + 1, PH.y - 10, 8, S.rot.hydro, '#2d5a7a');
  }
  function drawGeo() {
    const lv = S.lv.geo;
    // 生產井（紅、往上）與回注井（藍、往下）
    const prodX = GEO.x - 12, injX = GEO.x + 22;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(prodX, GEO.y); ctx.lineTo(prodX - 30, HOT.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(injX, GEO.y + 4); ctx.lineTo(injX + 14, HOT.y); ctx.stroke();
    ctx.lineWidth = 4; ctx.setLineDash([6, 9]);
    ctx.strokeStyle = COL.red; ctx.lineDashOffset = S.flow * 0.8;
    ctx.beginPath(); ctx.moveTo(prodX - 30, HOT.y); ctx.lineTo(prodX, GEO.y); ctx.stroke();
    ctx.strokeStyle = COL.teal; ctx.lineDashOffset = -S.flow * 0.8;
    ctx.beginPath(); ctx.moveTo(injX, GEO.y + 4); ctx.lineTo(injX + 14, HOT.y); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    arrow(ctx, prodX - 22, HOT.y - 30, prodX - 12, HOT.y - 62, COL.red, 3, 10);
    arrow(ctx, injX + 6, GEO.y + 40, injX + 11, GEO.y + 70, COL.teal, 3, 10);
    // 電廠建築＋冷卻塔
    ctx.save(); ctx.fillStyle = '#d6cdb2'; ctx.strokeStyle = '#5c5440'; ctx.lineWidth = 2;
    rr(ctx, GEO.x - 22, GEO.y - 24, 50, 26, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GEO.x - 18, GEO.y - 24); ctx.lineTo(GEO.x - 12, GEO.y - 48); ctx.lineTo(GEO.x + 4, GEO.y - 48); ctx.lineTo(GEO.x + 10, GEO.y - 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    turbineWheel(GEO.x + 18, GEO.y - 12, 8, S.rot.geo, '#7a3b2a');
    // 水蒸氣（持續、穩定）
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const ph = (S.t * 0.5 + i / 5) % 1;
      ctx.globalAlpha = 0.7 * (1 - ph) * clamp(lv * 1.4, 0, 1); ctx.fillStyle = '#eef2ee';
      ctx.beginPath(); ctx.arc(GEO.x - 4 + 8 * Math.sin(ph * 4 + i), GEO.y - 52 - ph * 46, 5 + ph * 11, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function drawSolar() {
    const lv = S.lv.solar, sunny = S.weather === 'sunny';
    // 陽光射向屋頂
    if (sunny) {
      ctx.save(); ctx.strokeStyle = hexA(COL.yellow, 0.35); ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -S.t * 40;
      for (const hx of HOUSES) { ctx.beginPath(); ctx.moveTo(SUN.x - 24, SUN.y + 18); ctx.lineTo(hx + 6, surfY(hx) - 40); ctx.stroke(); }
      ctx.setLineDash([]); ctx.restore();
    }
    for (const hx of HOUSES) {
      const gy = surfY(hx);
      ctx.save();
      ctx.fillStyle = '#d9c9a3'; ctx.strokeStyle = '#5c5440'; ctx.lineWidth = 2;
      ctx.fillRect(hx - 20, gy - 26, 40, 26); ctx.strokeRect(hx - 20, gy - 26, 40, 26);
      ctx.fillStyle = '#8a4b3a'; ctx.beginPath(); ctx.moveTo(hx - 24, gy - 26); ctx.lineTo(hx + 24, gy - 26); ctx.lineTo(hx + 24, gy - 32); ctx.lineTo(hx - 24, gy - 32); ctx.closePath(); ctx.fill();
      // 太陽能板（斜放）
      ctx.translate(hx, gy - 34); ctx.rotate(-0.32);
      ctx.fillStyle = '#1d3a6b'; ctx.strokeStyle = '#c9d3d6'; ctx.lineWidth = 2;
      ctx.fillRect(-20, -10, 40, 10); ctx.strokeRect(-20, -10, 40, 10);
      ctx.strokeStyle = 'rgba(201,211,214,0.6)'; ctx.lineWidth = 1;
      for (let k = -10; k <= 10; k += 10) { ctx.beginPath(); ctx.moveTo(k, -10); ctx.lineTo(k, 0); ctx.stroke(); }
      ctx.fillStyle = hexA(COL.yellow, 0.75 * lv); ctx.fillRect(-20, -10, 40, 10);
      ctx.restore();
      ctx.fillStyle = '#2b3b38'; ctx.fillRect(hx - 5, gy - 16, 10, 16);
    }
  }
  function drawWind() {
    const lv = S.lv.wind;
    // 風（流線）
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const nStreak = S.wind === 'strong' ? 5 : 2;
    for (let i = 0; i < nStreak; i++) {
      const ph = (S.t * (S.wind === 'strong' ? 0.9 : 0.3) + i / nStreak) % 1;
      const x = 960 - ph * 300, y = 168 + i * 18;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 20, y - 6, x - 46, y); ctx.stroke();
    }
    ctx.restore();
    TURB.forEach((tb, i) => {
      const hx = tb.x, hy = tb.y - tb.h;
      ctx.save();
      ctx.fillStyle = '#e8ecea'; ctx.strokeStyle = '#59645f'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(hx - 4, tb.y); ctx.lineTo(hx - 2, hy); ctx.lineTo(hx + 2, hy); ctx.lineTo(hx + 4, tb.y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.translate(hx, hy); ctx.rotate(S.rot.wind[i]);
      for (let b = 0; b < 3; b++) {
        ctx.rotate(TAU / 3);
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(14, -6, 38, -1); ctx.lineTo(38, 1); ctx.quadraticCurveTo(14, 5, 0, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#c9d3d6'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
      ctx.restore();
    });
    void lv;
  }

  // 選中的地點：黃色虛線框
  function drawFocus() {
    const s = SITES.find(q => q.id === S.site);
    const a = 0.65 + 0.35 * Math.sin(S.t * 4);
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = COL.yellow; ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
    rr(ctx, s.x0 + 4, 52, s.x1 - s.x0 - 8, GROUND_B - 52 - 2, 12); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }
  // 地點名牌
  const TAG_POS = { geo: [118, 74], hydro: [330, 74], solar: [586, 226], wind: [762, 140] };
  function drawSiteTags() {
    for (const s of SITES) {
      const [x, y] = TAG_POS[s.id], on = S.site === s.id;
      tag(ctx, SITE_TAG[s.id](), x, y, on ? COL.yellow : COL.chalk, 20, s.x0 + 6, s.x1 - 6, on);
    }
  }

  // ═════════ 畫：下方「發電看板」 ═════════
  const STABLE = {
    geo: () => [T('穩定：日夜晴陰都發電', 'Steady day and night'), COL.green],
    hydro: () => [T('較穩：要靠下雨補水', 'Fairly steady (rain)'), COL.chalk],
    solar: () => [T('看天吃飯：看陽光', 'Weather-bound: sun'), COL.orange],
    wind: () => [T('看天吃飯：看風', 'Weather-bound: wind'), COL.orange]
  };
  function bulb(x, y, lv) {
    const g = ctx.createRadialGradient(x, y - 3, 1, x, y - 3, 10 + 26 * lv);
    g.addColorStop(0, hexA(COL.yellow, 0.15 + 0.85 * lv)); g.addColorStop(0.55, hexA(COL.yellow, 0.35 * lv)); g.addColorStop(1, hexA(COL.yellow, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 3, 10 + 26 * lv, 0, TAU); ctx.fill();
    ctx.fillStyle = lv > 0.05 ? `rgb(${Math.round(lerp(90, 255, lv))},${Math.round(lerp(90, 236, lv))},${Math.round(lerp(80, 140, lv))})` : '#4a5550';
    ctx.strokeStyle = '#d9d4c4'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y - 4, 11, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(x + 5, y + 9); ctx.lineTo(x - 5, y + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8f9a98'; ctx.fillRect(x - 6, y + 9, 12, 6);
  }
  function drawBoard() {
    ctx.save(); ctx.fillStyle = 'rgba(11,26,21,0.96)'; ctx.fillRect(0, GROUND_B, W, H - GROUND_B); ctx.restore();
    const BAR_X = 238, BAR_W = 250, TR_X = 506, TR_W = 196, TAG_X0 = 714, TAG_X1 = W - 8;
    ROWS.forEach((id, i) => {
      const y = ROW_Y0 + i * ROW_H + ROW_H / 2, lv = S.lv[id], on = S.site === id;
      if (on) { ctx.save(); ctx.strokeStyle = COL.yellow; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,224,102,0.08)'; rr(ctx, 4, y - ROW_H / 2 + 2, W - 8, ROW_H - 4, 10); ctx.fill(); ctx.stroke(); ctx.restore(); }
      const nm = NAME[id]();
      label(ctx, nm, 18, y, on ? COL.yellow : COL.chalk, fitSize(ctx, nm, 150, 22, 20), 'left');
      bulb(196, y, lv);
      // 條狀示意（無數字）
      ctx.save();
      ctx.fillStyle = 'rgba(242,236,217,0.08)'; rr(ctx, BAR_X, y - 11, BAR_W, 22, 7); ctx.fill();
      if (lv > 0.004) {
        const g = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0); g.addColorStop(0, '#2a8fb8'); g.addColorStop(1, COL.teal);
        ctx.fillStyle = g; rr(ctx, BAR_X, y - 11, Math.max(8, BAR_W * lv), 22, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(214,246,255,0.95)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(242,236,217,0.4)'; ctx.lineWidth = 1.5; rr(ctx, BAR_X, y - 11, BAR_W, 22, 7); ctx.stroke();
      ctx.restore();
      // 起伏線（最近幾秒）
      const hs = S.hist[id];
      ctx.save();
      ctx.fillStyle = 'rgba(242,236,217,0.05)'; rr(ctx, TR_X, y - 16, TR_W, 32, 6); ctx.fill();
      ctx.strokeStyle = STABLE[id]()[1]; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      ctx.beginPath();
      hs.forEach((v, k) => { const x = TR_X + 4 + (TR_W - 8) * k / (HIST_N - 1), yy = y + 13 - 26 * clamp(v, 0, 1); k ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); });
      ctx.stroke(); ctx.restore();
      const [st, sc] = STABLE[id]();
      tag(ctx, st, (TAG_X0 + TAG_X1) / 2, y, sc, 20, TAG_X0, TAG_X1, false);
    });
  }

  // 頂端提示
  function tipMsg() {
    const cloudy = S.weather === 'cloudy', weak = S.wind === 'weak';
    switch (S.site) {
      case 'geo': return [T('火山溫泉地帶：地底熱水、水蒸氣推渦輪，晴陰日夜都穩穩發電', 'Volcanic area: underground hot water and steam spin a turbine, steady in any weather'), COL.green];
      case 'hydro': return [T('山上水庫：水從高處往低處流推動水輪機；晴陰一時影響小', 'Mountain reservoir: water flows downhill to spin a turbine; sun or clouds matter little'), COL.teal];
      case 'solar': return cloudy
        ? [T('陰天：雲遮住陽光，屋頂太陽能變暗、忽明忽暗——看天吃飯', 'Cloudy: clouds block the sunlight, so rooftop solar dims and flickers'), COL.orange]
        : [T('晴朗屋頂：陽光充足，太陽能板把光能轉成電能', 'Sunny rooftop: plenty of sunlight; the panels turn light energy into electricity'), COL.yellow];
      case 'wind': return weak
        ? [T('微風：風一小，風機慢慢轉，發電跟著變少——看天吃飯', 'Light wind: the turbines turn slowly and output drops'), COL.orange]
        : [T('強風海岸：風吹動葉片，發電多，但陣風一來一去會忽高忽低', 'Windy coast: strong wind spins the blades, but gusts make output rise and fall'), COL.yellow];
    }
    return ['', COL.chalk];
  }
  function bar(s, y, color) {
    const size = fitSize(ctx, s, W - 60, 22, 20);
    const w = Math.min(W - 16, textW(ctx, s, size) + 30), h = size * 1.55;
    ctx.save(); ctx.fillStyle = PANEL; ctx.strokeStyle = color; ctx.lineWidth = 2;
    rr(ctx, W / 2 - w / 2, y - h / 2, w, h, 10); ctx.fill(); ctx.stroke();
    ctx.font = font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(s, W / 2, y + 1);
    ctx.restore();
    noteBox(s, W / 2 - w / 2, y - h / 2, W / 2 + w / 2, y + h / 2);
  }

  function render() {
    if (!ctx) return;
    BOXES = [];
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
    drawSky(); drawClouds();
    drawGround(); drawSea(); drawRiver();
    drawGeo(); drawHydro(); drawSolar(); drawWind();
    drawFocus(); drawSiteTags();
    drawBoard();
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, SKY_T);
    const [m, c] = tipMsg();
    bar(m, 23, c);
    // 角落小註記：示意
    const nt = T('（示意，不是實測數字）', '(illustrative, not measured)');
    label(ctx, nt, W - 12, 326, COL.chalk, 20, 'right');
  }

  // ═════════ 動畫迴圈（單一 RAF；只在 activate～deactivate、可見、頁面未隱藏時跑） ═════════
  function step(dt) {
    S.t += dt; S.frames++;
    const k = 1 - Math.exp(-dt * 3.2);
    for (const id of ROWS) S.lv[id] = lerp(S.lv[id], target(id, S.t), k);
    S.rot.wind[0] += dt * (0.4 + 7.5 * S.lv.wind);
    S.rot.wind[1] += dt * (0.4 + 7.0 * S.lv.wind);
    S.rot.hydro += dt * 9 * S.lv.hydro;
    S.rot.geo += dt * 9 * S.lv.geo;
    S.flow += dt * 70 * S.lv.hydro;
    S.river += dt * 30;
    S.cloudX += dt * 30;
    S.histT += dt;
    while (S.histT >= HIST_DT) {
      S.histT -= HIST_DT;
      for (const id of ROWS) { const h = S.hist[id]; h.push(S.lv[id]); if (h.length > HIST_N) h.shift(); }
    }
  }
  function frame(now) {
    S.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000)); S.last = now;
    step(dt);
    render();
    sync();
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  // ═════════ 操作 ═════════
  const ACTIONS = {
    hydro: () => { S.site = 'hydro'; },
    coast: () => { S.site = 'wind'; S.wind = 'strong'; },
    roof: () => { S.site = 'solar'; S.weather = 'sunny'; },
    cloudy: () => { S.site = 'solar'; S.weather = 'cloudy'; },
    geo: () => { S.site = 'geo'; },
    sunny: () => { S.weather = 'sunny'; },
    overcast: () => { S.weather = 'cloudy'; },
    strong: () => { S.wind = 'strong'; },
    weak: () => { S.wind = 'weak'; }
  };
  function act(key) {
    if (!ACTIONS[key]) return;
    S.actions++; S.pick = key;
    ACTIONS[key]();
    updateUI();
    if (!S.raf) render();
  }
  function setSite(id) {
    if (!SITE_IDS.includes(id)) return;
    if (S.site === id) return;
    S.site = id; S.actions++;
    updateUI();
    if (!S.raf) render();
  }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const groups = [
      [T('挑地點／條件', 'Pick a site'), [['hydro', T('⛰️ 山上水庫', '⛰️ Mountain reservoir')], ['coast', T('🌬️ 強風海岸', '🌬️ Windy coast')], ['roof', T('☀️ 晴朗屋頂', '☀️ Sunny rooftop')], ['cloudy', T('☁️ 陰天', '☁️ Cloudy day')], ['geo', T('🌋 火山溫泉地帶', '🌋 Volcanic hot springs')]]],
      [T('天氣', 'Weather'), [['sunny', T('晴', 'Sunny')], ['overcast', T('陰', 'Cloudy')]]],
      [T('風', 'Wind'), [['strong', T('強風', 'Strong')], ['weak', T('微風', 'Light')]]]
    ];
    for (const [name, btns] of groups) {
      const row = document.createElement('div'); row.className = 'lab-row';
      const sp = document.createElement('span'); sp.className = 'lab-name'; sp.textContent = name; row.appendChild(sp);
      for (const [key, text] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = key; b.textContent = text;
        b.addEventListener('click', () => act(key));
        row.appendChild(b);
      }
      ctrl.appendChild(row);
    }
  }
  function isActive(k) {
    switch (k) {
      case 'hydro': return S.site === 'hydro';
      case 'coast': return S.site === 'wind';
      case 'roof': return S.site === 'solar' && S.weather === 'sunny';
      case 'cloudy': return S.site === 'solar' && S.weather === 'cloudy';
      case 'geo': return S.site === 'geo';
      case 'sunny': return S.weather === 'sunny';
      case 'overcast': return S.weather === 'cloudy';
      case 'strong': return S.wind === 'strong';
      case 'weak': return S.wind === 'weak';
    }
    return false;
  }
  function updateUI() {
    if (ctrl) ctrl.querySelectorAll('.lab-btn').forEach(b => { const on = isActive(b.dataset.act); b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    if (res) res.innerHTML = resultHTML();
    if (cv) cv.setAttribute('aria-label', T('再生能源挑地點實驗台：點選或左右拖曳挑地點，方向鍵左右換地點、空白鍵切換晴陰、上下鍵切換強風微風',
      'Renewable site bench: tap or drag sideways to pick a site; left/right arrows change site, space toggles sunny/cloudy, up/down toggle strong/light wind'));
  }
  function resultHTML() {
    const cloudy = S.weather === 'cloudy', weak = S.wind === 'weak';
    const main = {
      geo: T('<strong class="lr-green">地熱發電</strong>：抽取地底深處的熱水或水蒸氣推動渦輪機，<strong>熱能 → 電能</strong>，用完的水再注回地下。不管晴天、陰天、白天、晚上都能<strong class="lr-green">長時間穩定發電</strong>。',
        '<strong class="lr-green">Geothermal power</strong>: hot water or steam from deep underground spins a turbine, <strong>thermal → electrical energy</strong>, and the used water is injected back down. Sun or clouds, day or night, it <strong class="lr-green">generates steadily for a long time</strong>.'),
      hydro: T('<strong class="lr-teal">水力發電</strong>：高處的水往低處流，推動水輪機帶動發電機，<strong>重力位能 → 電能</strong>。水庫能把水先存起來，所以一時的晴陰影響不大；但水庫要靠<strong>下雨補水</strong>，久旱不雨時發電就會變少。',
        '<strong class="lr-teal">Hydropower</strong>: water flowing from high to low spins a turbine that drives a generator, <strong>gravitational potential → electrical energy</strong>. A reservoir stores water, so a sunny or cloudy day hardly matters, but it must be <strong>refilled by rain</strong>; in a long drought output falls.'),
      solar: cloudy
        ? T('<strong class="lr-orange">太陽能光電</strong>：太陽能板把<strong>光能 → 電能</strong>。<strong class="lr-orange">陰天</strong>雲層擋住陽光，燈泡變暗、起伏線忽高忽低；到了夜間更難發電。',
          '<strong class="lr-orange">Solar power</strong>: panels turn <strong>light energy → electrical energy</strong>. On a <strong class="lr-orange">cloudy day</strong> clouds block the sunlight, so the bulb dims and the trace wobbles; at night it can hardly generate at all.')
        : T('<strong class="lr-yellow">太陽能光電</strong>：太陽能板把<strong>光能 → 電能</strong>，發電時不會產生汙染。<strong class="lr-yellow">晴天</strong>陽光充足，燈泡最亮；但夜間難以發電，無法全天穩定供電。',
          '<strong class="lr-yellow">Solar power</strong>: panels turn <strong>light energy → electrical energy</strong> with no pollution while generating. On a <strong class="lr-yellow">sunny day</strong> the bulb is brightest, but at night it can hardly generate, so it can\'t supply power all day.'),
      wind: weak
        ? T('<strong class="lr-orange">風力發電</strong>：空氣流動的<strong>動能 → 電能</strong>。現在只有<strong class="lr-orange">微風</strong>，葉片慢慢轉，燈泡很暗——風力發電會受天候影響。',
          '<strong class="lr-orange">Wind power</strong>: the <strong>kinetic energy of moving air → electrical energy</strong>. With only a <strong class="lr-orange">light wind</strong> the blades turn slowly and the bulb is dim: wind power depends on the weather.')
        : T('<strong class="lr-yellow">風力發電</strong>：空氣流動的<strong>動能 → 電能</strong>。<strong class="lr-yellow">強風海岸</strong>風大，發電多；但風一陣一陣，起伏線忽高忽低。',
          '<strong class="lr-yellow">Wind power</strong>: the <strong>kinetic energy of moving air → electrical energy</strong>. On a <strong class="lr-yellow">windy coast</strong> output is high, but gusts come and go, so the trace rises and falls.')
    }[S.site];
    const cond = T(`現在：<strong>${cloudy ? '陰天' : '晴天'}</strong>、<strong>${weak ? '微風' : '強風'}</strong>。換天氣看看：哪幾顆燈泡跟著變？哪幾顆不動如山？`,
      `Now: <strong>${cloudy ? 'cloudy' : 'sunny'}</strong>, <strong>${weak ? 'light wind' : 'strong wind'}</strong>. Change the weather: which bulbs change, and which stay put?`);
    const sum = T('收束：<strong class="lr-orange">風力、太陽能「看天吃飯」</strong>，有風、有陽光才發得多，常要搭配儲電設備；<strong class="lr-green">地熱較穩定</strong>，日夜都能發電。挑地點要看當地有什麼能源。（燈泡亮度與長條都是示意）',
      'Wrap-up: <strong class="lr-orange">wind and solar depend on the weather</strong>; they generate a lot only with wind or sunshine, so they often need energy storage. <strong class="lr-green">Geothermal is steadier</strong>, day and night. Pick a site by the energy it has. (Bulbs and bars are illustrative.)');
    return `${main}<br>${cond}<br><span class="lr-sum">${sum}</span>`;
  }

  // ═════════ 指標（點選／水平拖曳挑地點）與鍵盤 ═════════
  function logicalX(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; }
  function siteAt(x) { const s = SITES.find(q => x >= q.x0 && x < q.x1); return s ? s.id : null; }
  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    S.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* 忽略 */ }
    setSite(siteAt(logicalX(e)));
  }
  function onMove(e) {
    if (!S.drag || S.drag.id !== e.pointerId) return;
    setSite(siteAt(clamp(logicalX(e), 0, W - 1)));
  }
  function onUp(e) {
    if (!S.drag || S.drag.id !== e.pointerId) return;
    S.drag = null;
    try { cv.releasePointerCapture(e.pointerId); } catch (_) { /* 忽略 */ }
  }
  function onKey(e) {
    const i = SITE_IDS.indexOf(S.site);
    if (e.key === 'ArrowRight') setSite(SITE_IDS[Math.min(3, i + 1)]);
    else if (e.key === 'ArrowLeft') setSite(SITE_IDS[Math.max(0, i - 1)]);
    else if (e.key === ' ' || e.key === 'Enter') act(S.weather === 'sunny' ? 'overcast' : 'sunny');
    else if (e.key === 'ArrowUp') act('strong');
    else if (e.key === 'ArrowDown') act('weak');
    else return;
    e.preventDefault();
  }
  const onVis = () => sync();

  // ═════════ DOM 注入 ═════════
  const CSS = `
#lab-renew{margin:28px auto 8px;max-width:1080px;background:#1c3d34;border:2px solid #ffe066;border-radius:18px;padding:18px 18px 20px;color:#f2ecd9;font-size:22px;line-height:1.6;box-shadow:0 8px 24px rgba(9,20,16,.5)}
#lab-renew .lab-title{margin:0 0 6px;font-size:30px;color:#ffe066;font-weight:700;line-height:1.35}
#lab-renew .lab-task{margin:0 0 12px;font-size:22px;color:#f2ecd9}
#lab-renew .canvas-wrap{background:#11261f;border:2px solid rgba(255,224,102,.45);border-radius:14px;overflow:hidden;line-height:0}
#lab-renew canvas{display:block;width:100%;height:auto;aspect-ratio:960/540;outline:none;cursor:pointer}
#lab-renew canvas:focus-visible{box-shadow:inset 0 0 0 3px #ffe066}
#lab-renew .lab-controls{display:flex;flex-direction:column;gap:10px;margin:14px 0 12px}
#lab-renew .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
#lab-renew .lab-name{font-size:22px;color:#a3b8b0;min-width:6.2em;font-weight:700}
#lab-renew .lab-btn{min-height:48px;font-size:22px;font-family:inherit;font-weight:700;line-height:1.25;padding:6px 14px;border-radius:12px;border:2px solid rgba(255,224,102,.55);background:#11261f;color:#f2ecd9;cursor:pointer;touch-action:manipulation}
#lab-renew .lab-btn:hover{background:#1f4236}
#lab-renew .lab-btn.active{background:#ffe066;color:#0b1a15;border-color:#ffe066}
#lab-renew .lab-btn:focus-visible{outline:3px solid #4dd2ff;outline-offset:2px}
#lab-renew .result-box{background:#11261f;border-left:6px solid #ffe066;border-radius:12px;padding:12px 16px;font-size:22px;line-height:1.7}
#lab-renew .lr-green{color:#4ade80}#lab-renew .lr-teal{color:#4dd2ff}#lab-renew .lr-orange{color:#fb923c}#lab-renew .lr-yellow{color:#ffe066}
#lab-renew .lr-sum{color:#f2ecd9}
@media (max-width:640px){#lab-renew{padding:12px}#lab-renew .lab-name{min-width:100%}}
`;
  function mount() {
    if (document.getElementById('lab-' + KEY)) { desk = document.getElementById('lab-' + KEY); return true; }
    const panel = document.getElementById(TAB);
    if (!panel) return false;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    desk = document.createElement('div'); desk.className = 'lab-desk'; desk.id = 'lab-' + KEY;
    const zhT = '🔧 動手做｜幫再生能源挑地點', enT = '🔧 Hands-on | Pick sites for renewable energy';
    const zhK = '任務：按按鈕或在圖上左右拖曳，替水力、風力、太陽能、地熱挑地點；再切換晴／陰、強風／微風，看哪幾顆燈泡會跟著變。';
    const enK = 'Task: use the buttons or drag sideways on the picture to pick a site for hydro, wind, solar and geothermal power; then switch sunny/cloudy and strong/light wind to see which bulbs change.';
    const en = isEn();
    desk.innerHTML =
      `<h3 class="lab-title" data-zh="${zhT}" data-en="${enT}">${en ? enT : zhT}</h3>` +
      `<p class="lab-task" data-zh="${zhK}" data-en="${enK}">${en ? enK : zhK}</p>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" tabindex="0" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>` +
      `<div class="result-box" id="${KEY}LabResult" aria-live="polite"></div>`;
    panel.appendChild(desk);
    cv = document.getElementById(KEY + 'LabCanvas');
    ctrl = document.getElementById(KEY + 'LabControls');
    res = document.getElementById(KEY + 'LabResult');
    ctx = cv.getContext('2d');
    buildControls(); updateUI(); render();
    // 保底：畫布可見就自動跑，不可見就停
    if ('IntersectionObserver' in window) {
      const autoIO = new IntersectionObserver(en => {
        const vis = en[en.length - 1].isIntersecting;
        if (!S.auto) return;
        if (vis && !S.on) activate(); else if (!vis && S.on) deactivate(true);
      });
      autoIO.observe(cv);
    }
    // 保底：<html lang> 改變就重繪文字
    let lastLang = isEn();
    new MutationObserver(() => { const now = isEn(); if (now !== lastLang) { lastLang = now; relang(); } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return true;
  }

  // ═════════ 介面契約 ═════════
  function activate() {
    if (!desk && !mount()) return;
    if (S.on) deactivate(true);
    cv = document.getElementById(KEY + 'LabCanvas'); ctrl = document.getElementById(KEY + 'LabControls'); res = document.getElementById(KEY + 'LabResult');
    if (!cv) return;
    ctx = cv.getContext('2d');
    S.on = true; S.auto = true;
    buildControls(); updateUI();
    cv.addEventListener('keydown', onKey);
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; sync(); });
      io.observe(cv);
    } else S.visible = true;
    render();
    sync();
  }
  function deactivate(fromAuto) {
    S.on = false;
    if (fromAuto !== true) S.auto = false;     // 頁面明確叫停：不再自動重啟，直到下次 activate()
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (cv) {
      cv.removeEventListener('keydown', onKey);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
    }
    S.drag = null;
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = el.getAttribute(isEn() ? 'data-en' : 'data-zh'); });
    buildControls(); updateUI();
    render();
  }
  function _state() {
    return {
      site: S.site, weather: S.weather, wind: S.wind, pick: S.pick,
      levels: Object.fromEntries(ROWS.map(id => [id, +S.lv[id].toFixed(3)])),
      stable: { geo: true, hydro: true, solar: false, wind: false },
      running: !!S.raf, on: S.on, visible: S.visible, auto: S.auto,
      actions: S.actions, frames: S.frames, t: +S.t.toFixed(2),
      lang: isEn() ? 'en' : 'zh', boxes: BOXES.slice()
    };
  }

  W5Lab[KEY] = { activate, deactivate, relang, _state };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

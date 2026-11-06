/* electric_motor_3_aurora_1105_v1.js — 「資優補充」分頁的第 1 個場景：美麗的極光（共用 #giftedCanvas，邏輯 1000×600）
 *
 * 由磁學單元（magnetism_1）的「地球大磁鐵」分頁搬來（老師 2026-11-05 指示：電子進入磁場會 U 形迴轉的概念在本單元教過，
 * 極光放在這後面比較順）。內容、畫面與動畫不變，只改掛載方式。
 *
 * 契約：window.MotorAnim.aurora = { activate('example-aurora'), deactivate(), relang(), _info(), _state(), _frameAt() }
 * 由 electric_motor_3_gifted_1106_v1.js 在收到場景 id 'example-aurora' 時轉交；步驟鈕寫進 #steps-gifted，說明寫進 #giftedResult。
 * 老師講解模式：MotorAnim.ctl.onEnd 是函式時，播到結尾就停住並通知一次；MotorAnim.ctl.paused 為 true 時時間凍結。
 * 依賴頁面現成的：tr、C、TAU、clear、label、currentLang。本檔自帶 line、drawEarthMagneticField（與磁學頁同一份算式）。
 * 地球影像：NASA Blue Marble Next Generation（2004-07，去雲衛星合成），assets/magnetism_1/earth_blue_marble_2048_v1.jpg，
 * 正射投影成北極上空視角（來源見頁面「影像來源」）。
 *
 * ── 場景步驟表（共 66 s）────────────────────────────────────────
 *   1 太陽風   13 s 沿用盾牌畫面：多數粒子被推開；3 顆亮黃粒子在磁層頂附近被磁力線抓住
 *   2 沿磁力線 12 s 北半球 4 條導引磁力線，粒子邊打轉邊滑向極區，落點閃綠光
 *   3 撞擊大氣 13 s 側視剖面（地表弧線、大氣、100／250 km 分層與高度軸）：粒子撞上氧原子、氮分子，原子激發後發光
 *   4 顏色高度 12 s 極光光幕：紅（氧，>250 km）、綠（氧，100–250 km）、藍紫（氮，<100 km）
 *   5 極光帶   16 s 從北極上空俯視：地理北極＋、地磁 S 極、綠色極光橢圓；太陽活動強時向低緯擴大
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;
  const teacher = () => !!(MA.ctl && typeof MA.ctl.onEnd === 'function');
  const W = 1000, H = 600;
  const FONT = "'Noto Sans TC',sans-serif";
  const YELLOW = C.yellow, CYAN = C.cyan, PINK = C.pink, ORANGE = C.orange, RED = C.poleN, BLUE = C.poleS;
  const CHALK = '#f2ecd9';
  const CX = 500, CY = 300, ER = 160;              // 地球（與原圖相同）
  const TILT = 11 * Math.PI / 180;                 // 磁軸傾角（與原圖相同）
  const COS_T = Math.cos(TILT), SIN_T = Math.sin(TILT);
  const MAG_L = 270, MAG_W = 50;                   // 內部大磁鐵（與原圖相同）
  const EARTH_FILL = '#2f87a9', LAND = '#6a8f5d';
  const LINE_RGB = '85,233,255';                   // 地磁場線：青


  // ───────── 本頁沒有的現成函式：自帶（同磁學頁） ─────────
  function line(ctx, pts, color = C.white, width = 4, dash = []) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
  }
  function drawEarthMagneticField(ctx, cx, cy, tilt, r) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt); 
      ctx.strokeStyle = '#a65ca8'; 
      ctx.lineWidth = 2.5;
      
      const Ls = [r*1.1, r*1.3, r*1.6, r*2.1, r*3.0, r*4.5, r*7.0, r*12.0];
      
      for (let L of Ls) {
          ctx.beginPath();
          for(let theta = 0; theta <= Math.PI; theta += 0.05) {
              let R = L * Math.pow(Math.sin(theta), 2);
              if (R > r * 0.96) { 
                  let x = R * Math.sin(theta);
                  let y = -R * Math.cos(theta); // S極在上
                  ctx.lineTo(x, y);
              } else {
                  ctx.moveTo(Math.sin(theta)*R, -Math.cos(theta)*R);
              }
          }
          ctx.stroke();
          
          ctx.beginPath();
          for(let theta = 0; theta <= Math.PI; theta += 0.05) {
              let R = L * Math.pow(Math.sin(theta), 2);
              if (R > r * 0.96) {
                  let x = -R * Math.sin(theta);
                  let y = -R * Math.cos(theta); 
                  ctx.lineTo(x, y);
              } else {
                  ctx.moveTo(-Math.sin(theta)*R, -Math.cos(theta)*R);
              }
          }
          ctx.stroke();
          
          if (L > r * 1.08 && L < r * 6.0) {
              ctx.save(); ctx.translate(L, 0); ctx.rotate(-Math.PI/2);
              ctx.fillStyle = '#a65ca8';
              ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(12, 0); ctx.lineTo(0, 8); ctx.fill(); ctx.restore();
              
              ctx.save(); ctx.translate(-L, 0); ctx.rotate(-Math.PI/2);
              ctx.fillStyle = '#a65ca8';
              ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(12, 0); ctx.lineTo(0, 8); ctx.fill(); ctx.restore();
          }
      }
      ctx.restore();
  }

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
  function font(size) { return `900 ${size}px ${FONT}`; }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function fit(ctx, s, size, maxW) { while (size > 22 && textW(ctx, s, size) > maxW) size--; return size; }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function arrowHead(ctx, x, y, ang, color, s = 12) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.65); ctx.lineTo(-s * 0.7, s * 0.65); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function glowRing(ctx, x, y, r, color, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  // 有底色的小標籤；anchor: 'center' | 'left'（x 為左緣）| 'right'（x 為右緣）
  function tag(ctx, s, x, y, color, a = 1, size = 24, anchor = 'center', border = true) {
    if (a <= 0 || !s) return;
    size = fit(ctx, s, size, W - 60);
    const w = textW(ctx, s, size) + 22;
    let cx = anchor === 'left' ? x + w / 2 : anchor === 'right' ? x - w / 2 : x;
    cx = clamp(cx, w / 2 + 8, W - w / 2 - 8);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(12,30,25,0.9)';
    rrect(ctx, cx - w / 2, y - size * 0.78, w, size * 1.56, 8); ctx.fill();
    if (border) { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke(); }
    label(ctx, s, cx, y + 1, color, 'center', size); ctx.restore();
  }
  function topMsg(ctx, s, color, a = 1) {
    ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.9)'; ctx.fillRect(0, 6, W, 52); ctx.restore();
    if (!s || a <= 0) return;
    const size = fit(ctx, s, 26, W - 40);
    ctx.save(); ctx.globalAlpha = a; label(ctx, s, W / 2, 33, color, 'center', size); ctx.restore();
  }
  function botMsg(ctx, s, color, a = 1) {
    if (!s || a <= 0) return;
    const size = fit(ctx, s, 24, W - 40);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(12,30,25,0.9)'; ctx.fillRect(0, 550, W, 46);
    label(ctx, s, W / 2, 573, color, 'center', size); ctx.restore();
  }
  // 磁軸座標（x 右、y 下，隨 TILT 順時針轉）→ 畫布座標
  function toCanvas(lx, ly) { return { x: CX + lx * COS_T - ly * SIN_T, y: CY + lx * SIN_T + ly * COS_T }; }
  // 偶極場方向（磁矩在磁軸座標中朝下：由上方地磁 S 指向下方地磁 N）
  // 磁緯 λ、離地心 d 的點（side = -1 左、+1 右）
  function atLat(lamDeg, d, side) {
    const l = lamDeg * Math.PI / 180;
    return toCanvas(side * d * Math.cos(l), -d * Math.sin(l));
  }

  // ───────── 地磁場線快取：把 drawEarthMagneticField 的輸出「錄下來」 ─────────
  function recorder() {
    let m = [1, 0, 0, 1, 0, 0], stack = [], cur = [];
    const lines = new Path2D(), heads = new Path2D();
    const T = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    return {
      lines, heads, lineWidth: 1, strokeStyle: '', fillStyle: '', lineCap: 'butt',
      save() { stack.push(m.slice()); }, restore() { if (stack.length) m = stack.pop(); },
      translate(x, y) { m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; },
      rotate(a) {
        const c = Math.cos(a), s = Math.sin(a), [a0, b0, c0, d0] = m;
        m[0] = a0 * c + c0 * s; m[1] = b0 * c + d0 * s; m[2] = -a0 * s + c0 * c; m[3] = -b0 * s + d0 * c;
      },
      beginPath() { cur = []; },
      moveTo(x, y) { cur.push([T(x, y)]); },
      lineTo(x, y) { if (!cur.length) cur.push([]); cur[cur.length - 1].push(T(x, y)); },
      closePath() {}, setLineDash() {},
      stroke() {
        for (const sp of cur) if (sp.length >= 2) { lines.moveTo(sp[0][0], sp[0][1]); for (let i = 1; i < sp.length; i++) lines.lineTo(sp[i][0], sp[i][1]); }
        cur = [];
      },
      fill() {
        for (const sp of cur) if (sp.length >= 3) { heads.moveTo(sp[0][0], sp[0][1]); for (let i = 1; i < sp.length; i++) heads.lineTo(sp[i][0], sp[i][1]); heads.closePath(); }
        cur = [];
      }
    };
  }
  let LC = null;
  function buildLines() {
    if (LC) return LC;
    const rec = recorder();
    drawEarthMagneticField(rec, CX, CY, TILT, ER);
    LC = { lines: rec.lines, heads: rec.heads, wind: buildWind() };
    return LC;
  }
  // 地磁場線：a = 底線透明度，flow = 流動亮段透明度
  // 錄下的每條路徑由北端（地理北極附近）畫向南端；磁場方向相反，故 dashOffset 隨時間增加 → 亮段往路徑起點（北）流
  function drawField(ctx, a, flow, t) {
    if (a <= 0 && flow <= 0) return;
    const L = buildLines();
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (a > 0) {
      ctx.strokeStyle = `rgba(${LINE_RGB},${a})`; ctx.lineWidth = 2.5; ctx.stroke(L.lines);
      ctx.fillStyle = `rgba(${LINE_RGB},${Math.min(1, a * 1.3)})`; ctx.fill(L.heads);
    }
    if (flow > 0) {
      ctx.strokeStyle = `rgba(${LINE_RGB},${flow})`; ctx.lineWidth = 4;
      ctx.setLineDash([14, 46]); ctx.lineDashOffset = (t * 70) % 60; ctx.stroke(L.lines);
    }
    ctx.restore();
  }

  // ───────── 太陽風路徑（繞過「磁場盾牌」的流線，快取） ─────────
  // 以「均勻流 + 點源」（Rankine 半體）近似磁層頂：粒子在地球向陽面被推開，沿弧線繞到上下方離開，
  // 地球背後留下一片沒有粒子的「保護區」。盾牌（磁層頂）頂點在點源左方 SB 處，整個邊界離地表 ≥ 35 px。
  const SRC = { x: 420, y: CY }, SB = 120;
  const WIND_Y0 = [-22, 22, -62, 62, -108, 108, -160, 160, -215, 215];
  function buildWind() {
    const out = [];
    for (const y0 of WIND_Y0) {
      let x = 55 - SRC.x, y = y0;
      const px = [], py = [], s = [];
      for (let k = 0; k < 4000; k++) {
        if (!px.length || Math.hypot(x - px[px.length - 1], y - py[py.length - 1]) >= 3) {
          s.push(px.length ? s[s.length - 1] + Math.hypot(x - px[px.length - 1], y - py[py.length - 1]) : 0);
          px.push(x); py.push(y);
        }
        if (x + SRC.x > W + 40 || Math.abs(y) > CY + 40) break;
        const r2 = x * x + y * y;
        const u = 1 + SB * x / r2, v = SB * y / r2;
        const n = Math.hypot(u, v) || 1;
        x += 2 * u / n; y += 2 * v / n;
      }
      const path = new Path2D(); path.moveTo(px[0] + SRC.x, py[0] + SRC.y);
      for (let i = 1; i < px.length; i++) path.lineTo(px[i] + SRC.x, py[i] + SRC.y);
      out.push({ x: px.map(v => v + SRC.x), y: py.map(v => v + SRC.y), s, len: s[s.length - 1], path });
    }
    // 盾牌（磁層頂）：r = SB(π−θ)/sinθ，畫向陽面那一段
    const sh = new Path2D();
    for (let k = 0; k <= 60; k++) {
      const th = lerp(Math.PI * 0.56, Math.PI * 1.44, k / 60);
      const a = Math.atan2(Math.sin(th), Math.cos(th)), A = Math.abs(a);
      const r = A > Math.PI - 1e-4 ? SB : SB * (Math.PI - A) / Math.sin(A);
      const x = SRC.x + r * Math.cos(a), y = SRC.y + r * Math.sin(a);
      if (k) sh.lineTo(x, y); else sh.moveTo(x, y);
    }
    out.shield = sh;
    return out;
  }
  function windAt(w, d) {
    let lo = 0, hi = w.s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (w.s[m] <= d) lo = m; else hi = m; }
    const k = w.s[hi] > w.s[lo] ? (d - w.s[lo]) / (w.s[hi] - w.s[lo]) : 0;
    return [lerp(w.x[lo], w.x[hi], k), lerp(w.y[lo], w.y[hi], k)];
  }
  function drawWind(ctx, t, a) {
    if (a <= 0) return;
    const ws = buildLines().wind, SP = 170, GAP = 95;
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(255,179,71,0.22)'; ctx.lineWidth = 2; ctx.setLineDash([6, 10]);
    for (const w of ws) ctx.stroke(w.path);
    ctx.setLineDash([]);
    ws.forEach((w, i) => {
      const head = t * SP;                          // 粒子由左側陸續吹出
      for (let d = (head + i * 37) % GAP; d < w.len; d += GAP) {
        if (d > head) break;
        const [x, y] = windAt(w, d);
        ctx.fillStyle = 'rgba(255,179,71,0.25)'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU); ctx.fill();
      }
    });
    ctx.restore();
  }
  function drawSun(ctx, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(-150, CY, 60, -150, CY, 220);
    g.addColorStop(0, '#fff7c2'); g.addColorStop(0.75, '#ffcf4a'); g.addColorStop(0.88, 'rgba(255,170,60,0.55)'); g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-150, CY, 220, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawShield(ctx, a, t) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a * (0.75 + 0.25 * Math.sin(t * 3));
    ctx.strokeStyle = CYAN; ctx.lineWidth = 6; ctx.shadowColor = CYAN; ctx.shadowBlur = 18; ctx.lineCap = 'round';
    ctx.stroke(buildLines().wind.shield);
    ctx.restore();
  }

  // ───────── 真實地球（NASA Blue Marble 去雲衛星合成圖，正射投影成圓盤；一次烘焙、之後只 drawImage）─────────
  // 貼圖：assets/magnetism_1/earth_blue_marble_2048_v1.jpg（2048×1024 等距長方投影，來源見頁面「影像來源」）
  const TEX = { ready: false, data: null, w: 2048, h: 1024, front: null, top: null };
  (function loadTex() {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = TEX.w; c.height = TEX.h;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0, TEX.w, TEX.h);
        TEX.data = x.getImageData(0, 0, TEX.w, TEX.h).data;
        TEX.front = bakeGlobe(ER * 2, 0, 105);      // 正面：赤道上空、中心經度 105°E（亞洲、印度洋、澳洲一帶）
        TEX.top = bakeGlobe(TV_R * 2, 90, 74);      // 俯視北極：地磁 S 極（約 80°N、72°W）落在畫面左上方向
        TEX.ready = true;
      } catch (e) { TEX.ready = false; }
    };
    im.src = 'assets/magnetism_1/earth_blue_marble_2048_v1.jpg';
  })();
  // 正射投影：lat0／lon0 為視線中心；回傳 (2r)² 的離屏畫布（圓外透明），已含邊緣暗化
  function bakeGlobe(r, lat0d, lon0d) {
    const S = 2, N = r * S, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), out = x.createImageData(N, N), o = out.data, d = TEX.data;
    const p0 = lat0d * Math.PI / 180, sp = Math.sin(p0), cp = Math.cos(p0), l0 = lon0d * Math.PI / 180;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const X = (i + 0.5) / N * 2 - 1, Y = 1 - (j + 0.5) / N * 2, rr = X * X + Y * Y;
      if (rr > 1) continue;
      const Z = Math.sqrt(1 - rr);
      const lat = Math.asin(Math.max(-1, Math.min(1, Y * cp + Z * sp)));
      let lon = l0 + Math.atan2(X, Z * cp - Y * sp);
      let u = (lon / Math.PI + 1) / 2; u -= Math.floor(u);
      const v = 0.5 - lat / Math.PI;
      const tx = Math.min(TEX.w - 1, Math.floor(u * TEX.w)), ty = Math.min(TEX.h - 1, Math.floor(v * TEX.h)), k = (ty * TEX.w + tx) * 4;
      const sh = 1.14 * (0.62 + 0.38 * Math.pow(Z, 0.55));      // 邊緣略暗，像球體；整體略提亮以便在黑板底上看清
      const e = Math.sqrt(rr), a = e > 0.985 ? Math.max(0, (1 - e) / 0.015) : 1;
      const q = (j * N + i) * 4;
      o[q] = Math.min(255, d[k] * sh); o[q + 1] = Math.min(255, d[k + 1] * sh); o[q + 2] = Math.min(255, d[k + 2] * sh); o[q + 3] = 255 * a;
    }
    x.putImageData(out, 0, 0);
    return c;
  }

  // ───────── 地球、磁鐵、標籤 ─────────
  function earth(ctx, fillA = 1, glow = 0) {
    ctx.save();
    if (glow > 0) { ctx.shadowColor = CYAN; ctx.shadowBlur = 30 * glow; }
    ctx.beginPath(); ctx.arc(CX, CY, ER, 0, TAU);
    ctx.globalAlpha = fillA; ctx.fillStyle = EARTH_FILL; ctx.fill();
    ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.strokeStyle = CYAN; ctx.stroke();
    ctx.shadowBlur = 0;
    if (TEX.ready) { ctx.globalAlpha = fillA; ctx.drawImage(TEX.front, CX - ER, CY - ER, ER * 2, ER * 2); }
    ctx.restore();
  }
  // 透視：掃描線 scanY 以上為半透明（露出磁鐵），以下仍是不透明地球
  const S_END = toCanvas(0, -95), N_END = toCanvas(0, 95);          // 標籤對準的位置
  const S_TIP = toCanvas(0, -MAG_L / 2 + 18);                         // 相吸線的終點（S 極端）
  const GEO_N = { x: CX, y: CY - ER - 28 }, GEO_S = { x: CX, y: CY + ER + 28 };
  function geoLabels(ctx, k = 0) {
    // k: 0 = 在地球正上／下方；1 = 讓出自轉軸（北標往左、南標往右）
    const nx = lerp(GEO_N.x, 405, k), ny = lerp(GEO_N.y, 104, k);
    const sx = lerp(GEO_S.x, 600, k), sy = lerp(GEO_S.y, 500, k);
    tag(ctx, tr('地理北極', 'Geo North'), nx, ny, CHALK, 1, 24, 'center', false);
    tag(ctx, tr('地理南極', 'Geo South'), sx, sy, CHALK, 1, 24, 'center', false);
  }
  // 粉色虛線（相吸），沿二次曲線，帶箭頭與流動

  // ═════════ 場景 3：補充——美麗的極光 ═════════
  // 極光三色（刻意與地磁 N 紅 #ff6f76、S 藍 #72b9ff 錯開色相：紅偏洋紅、藍改藍紫）
  const AUR = { r: '255,77,120', g: '93,255,150', b: '176,140,255' };
  const AUR_R = `rgb(${AUR.r})`, AUR_G = `rgb(${AUR.g})`, AUR_B = `rgb(${AUR.b})`;
  const DEG = Math.PI / 180;
  function mkPoly(pts) {
    const x = [], y = [], s = []; let acc = 0; const path = new Path2D();
    pts.forEach((p, i) => {
      if (i) { acc += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y); path.lineTo(p.x, p.y); } else path.moveTo(p.x, p.y);
      x.push(p.x); y.push(p.y); s.push(acc);
    });
    return { x, y, s, len: acc, path };
  }
  // 偶極磁力線 r = L·cos²λ 上，磁緯 l0 → l1（度）的點列
  function fieldPts(L, side, l0, l1, n = 70) {
    const out = [];
    for (let k = 0; k <= n; k++) { const lam = lerp(l0, l1, k / n), c = Math.cos(lam * DEG); out.push(atLat(lam, L * c * c, side)); }
    return out;
  }
  const footLat = (L, r) => Math.acos(Math.sqrt(r / L)) / DEG;             // 磁力線落到半徑 r 處的磁緯
  function magPolar(x, y) {
    const dx = x - CX, dy = y - CY, lx = dx * COS_T + dy * SIN_T, ly = -dx * SIN_T + dy * COS_T, r = Math.hypot(lx, ly);
    return { lam: Math.asin(-ly / r) / DEG, r, side: lx >= 0 ? 1 : -1 };
  }
  // 沿路徑 d 處加上「繞磁力線打轉」的橫向擺動（螺旋的側視投影），回傳 [x, y, 深度 -1..1]
  function helixAt(p, d, amp, k) {
    d = clamp(d, 0, p.len);
    const [x, y] = windAt(p, d), [x2, y2] = windAt(p, Math.min(p.len, d + 2));
    let tx = x2 - x, ty = y2 - y; const n = Math.hypot(tx, ty);
    if (n < 1e-6) { const [x0, y0] = windAt(p, Math.max(0, d - 2)); tx = x - x0; ty = y - y0; }
    const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const s = Math.sin(d * k);
    return [x - ty * amp * s, y + tx * amp * s, Math.cos(d * k)];
  }
  function particle(ctx, x, y, depth = 0, a = 1, big = false) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const r = (big ? 6 : 4.5) + depth * 1.2;
    ctx.fillStyle = 'rgba(255,179,71,0.3)'; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = big ? YELLOW : ORANGE; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (big) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
  }
  // 粒子尾跡（沿路徑往回取樣）
  function trail(ctx, p, d, ampF, k, n = 30, step = 3) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = ORANGE;
    let prev = helixAt(p, d, ampF(d), k);
    for (let j = 1; j <= n; j++) {
      const dd = d - j * step; if (dd < 0) break;
      const q = helixAt(p, dd, ampF(dd), k);
      ctx.globalAlpha = 0.55 * (1 - j / n);
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); prev = q;
    }
    ctx.restore();
  }
  function softGlow(ctx, x, y, r, rgb, a) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${0.9 * a})`); g.addColorStop(0.35, `rgba(${rgb},${0.45 * a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  function fadeIn(ctx, a) { if (a <= 0) return; ctx.save(); ctx.fillStyle = `rgba(12,30,25,${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  // ── 快取：被抓住的粒子路徑、極區導引磁力線、極光光幕 ──
  let AC = null;
  const CAUGHT = [[2, 330], [4, 230], [3, 330]];   // [太陽風流線編號, 在 x 處被磁力線抓住]
  const GUIDES = [[330, 1, 0], [450, 1, 2.2], [600, 1, 1.1], [330, -1, 3.3]];   // [L, 側(1 夜側右/-1 日側左), 時間偏移]
  function buildAur() {
    if (AC) return AC;
    const wind = buildLines().wind;
    const caught = CAUGHT.map(([wi, xc]) => {
      const w = wind[wi]; let i = 0; while (i < w.x.length - 1 && w.x[i] < xc) i++;
      const P = { x: w.x[i], y: w.y[i] }, m = magPolar(P.x, P.y);
      const L = m.r / Math.pow(Math.cos(m.lam * DEG), 2);
      const lf = footLat(L, ER + 5) * Math.sign(m.lam);                       // 北半球往北、南半球往南
      const pts = [];
      for (let k = 0; k <= i; k++) pts.push({ x: w.x[k], y: w.y[k] });
      const fp = fieldPts(L, m.side, m.lam, lf, 50);
      const poly = mkPoly(pts.concat(fp.slice(1)));
      return { poly, sCap: w.s[i], fpath: mkPoly(fp).path, foot: fp[fp.length - 1] };
    });
    const guides = GUIDES.map(([L, side, off]) => {
      let l0 = 0;
      while (l0 < 40) { const c = Math.cos(l0 * DEG), p = atLat(l0, L * c * c, side); if (p.x > 15 && p.x < W - 15 && p.y > 70) break; l0 += 0.5; }
      const fp = fieldPts(L, side, l0, footLat(L, ER + 5), 80);
      return { poly: mkPoly(fp), off, foot: fp[fp.length - 1] };
    });
    AC = { caught, guides, curtain: buildCurtain() };
    return AC;
  }

  // 側視剖面：地表是一段大圓弧，高度 1 km ≈ 1 px
  const SV_R = 2600, SV_G0 = 492, SV_CY = SV_G0 + SV_R;
  function altY(x, a) { const r = SV_R + a, dx = x - CX; return SV_CY - Math.sqrt(r * r - dx * dx); }
  const AX_X = 122;                                                             // 高度軸
  function sideScene(ctx, axisA = 1) {
    // 大氣（越低越濃）
    const g = ctx.createLinearGradient(0, SV_G0, 0, altY(CX, 380));
    g.addColorStop(0, 'rgba(85,160,220,0.32)'); g.addColorStop(0.3, 'rgba(85,160,220,0.12)'); g.addColorStop(1, 'rgba(85,160,220,0)');
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, altY(CX, 380), W, H); ctx.restore();
    // 高度分層虛線
    ctx.save(); ctx.strokeStyle = 'rgba(242,236,217,0.28)'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]);
    for (const a of [100, 250]) { ctx.beginPath(); ctx.arc(CX, SV_CY, SV_R + a, -Math.PI / 2 - 0.2, -Math.PI / 2 + 0.2); ctx.stroke(); }
    ctx.restore();
    // 地面
    ctx.save(); ctx.beginPath(); ctx.arc(CX, SV_CY, SV_R, 0, TAU);
    ctx.fillStyle = '#1b3d31'; ctx.fill(); ctx.strokeStyle = LAND; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
    // 高度軸與刻度
    if (axisA > 0) {
      ctx.save(); ctx.globalAlpha = axisA;
      line(ctx, [[AX_X, altY(AX_X, 0)], [AX_X, altY(AX_X, 350)]], CHALK, 3);
      arrowHead(ctx, AX_X, altY(AX_X, 350) - 6, -Math.PI / 2, CHALK, 11);
      for (const a of [100, 250]) {
        const y = altY(AX_X, a);
        line(ctx, [[AX_X - 9, y], [AX_X + 9, y]], CHALK, 3);
        label(ctx, `${a} km`, AX_X - 14, y, CHALK, 'right', 22);
      }
      ctx.restore();
      tag(ctx, tr('高度', 'Altitude'), 72, altY(AX_X, 350) - 34, CHALK, axisA, 22, 'center', false);
    }
  }

  // 極光光幕（離屏畫布一次畫好；播放時切成細條、上下輕擺）
  const CUR = { x0: 150, w: 470, aTop: 390, aBot: 60 };
  function buildCurtain() {
    const cw = CUR.w, ch = CUR.aTop - CUR.aBot;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d'), img = g.createImageData(cw, ch), d = img.data;
    const sm = (a, b, v) => { const k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
    const cols = [AUR.r, AUR.g, AUR.b].map(s => s.split(',').map(Number));
    for (let i = 0; i < cw; i++) {
      const ray = clamp(0.58 + 0.22 * Math.sin(i * 0.21 + 1.3) + 0.15 * Math.sin(i * 0.057 + 0.4) + 0.12 * Math.sin(i * 0.83), 0.12, 1);
      const edge = 6 * Math.sin(i * 0.031) + 3 * Math.sin(i * 0.11 + 2);
      const side = sm(0, 60, i) * sm(0, 60, cw - 1 - i);
      for (let j = 0; j < ch; j++) {
        const a = CUR.aTop - j - edge;
        const G = a < 98 ? 0 : sm(98, 110, a) * Math.exp(-(a - 110) / 75) * (1 - sm(235, 262, a));
        const R = sm(232, 285, a) * 0.62 * (1 - sm(300, 392, a));
        const B = sm(70, 84, a) * (1 - sm(86, 106, a)) * 0.85;
        const tot = G + R + B; if (tot <= 0.002) continue;
        const rayE = lerp(ray, 0.75, R / tot);                               // 紅光較瀰漫，光條紋較淡
        const o = (j * cw + i) * 4;
        for (let c = 0; c < 3; c++) d[o + c] = (cols[0][c] * R + cols[1][c] * G + cols[2][c] * B) / tot;
        d[o + 3] = 255 * clamp(tot * rayE * side * 1.15, 0, 1);
      }
    }
    g.putImageData(img, 0, 0);
    const halo = document.createElement('canvas'); halo.width = Math.ceil(cw / 8); halo.height = Math.ceil(ch / 8);
    const hg = halo.getContext('2d'); hg.imageSmoothingEnabled = true; hg.drawImage(cv, 0, 0, halo.width, halo.height);
    return { cv, halo, cw, ch };
  }
  function drawCurtain(ctx, t, a) {
    if (a <= 0) return;
    const c = buildAur().curtain, SL = 6;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55 * a;
    ctx.drawImage(c.halo, CUR.x0 - 30, altY(CX, CUR.aTop) - 20, c.cw + 60, c.ch + 40);
    for (let sx = 0; sx < c.cw; sx += SL) {
      const xm = CUR.x0 + sx + SL / 2;
      const dy = 5 * Math.sin(sx * 0.03 + t * 1.2);
      ctx.globalAlpha = a * (0.8 + 0.2 * Math.sin(sx * 0.09 - t * 2.3));
      ctx.drawImage(c.cv, sx, 0, SL, c.ch, CUR.x0 + sx, altY(xm, CUR.aTop) + dy, SL, c.ch);
    }
    ctx.restore();
  }
  // 色塊說明（兩行：顏色＋原子／高度）
  function legend2(ctx, x, y, t1, t2, color, a) {
    if (a <= 0) return;
    const s1 = fit(ctx, t1, 24, 296), s2 = fit(ctx, t2, 22, 296);
    const w = Math.max(textW(ctx, t1, s1), textW(ctx, t2, s2)) + 24;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(12,30,25,0.9)';
    rrect(ctx, x, y - 33, w, 66, 8); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    label(ctx, t1, x + 12, y - 14, color, 'left', s1); label(ctx, t2, x + 12, y + 17, CHALK, 'left', s2);
    ctx.restore();
  }

  // 原子：O 一顆、N₂ 兩顆相連
  const ATOMS = [
    { x: 230, a: 322, k: 'O', c: AUR.r, off: 0.2 }, { x: 520, a: 300, k: 'O', c: AUR.r, off: 2.3 },
    { x: 310, a: 205, k: 'O', c: AUR.g, off: 1.1 }, { x: 455, a: 158, k: 'O', c: AUR.g, off: 3.0 },
    { x: 600, a: 222, k: 'O', c: AUR.g, off: 0.6 }, { x: 385, a: 128, k: 'O', c: AUR.g, off: 1.8 },
    { x: 255, a: 90, k: 'N', c: AUR.b, off: 2.7 }, { x: 560, a: 86, k: 'N', c: AUR.b, off: 3.6 }
  ];
  const HIT_P = 4.4, FALL_V = 240, Y_TOP = 64;
  function atomShape(ctx, x, y, k, fill, scale = 1) {
    ctx.fillStyle = fill; ctx.strokeStyle = 'rgba(242,236,217,0.9)'; ctx.lineWidth = 2;
    if (k === 'O') { ctx.beginPath(); ctx.arc(x, y, 10 * scale, 0, TAU); ctx.fill(); ctx.stroke(); }
    else for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 7 * scale, y, 8 * scale, 0, TAU); ctx.fill(); ctx.stroke(); }
  }
  function drawAtoms(ctx, t, a, glowOnly = false) {
    if (a <= 0) return;
    for (const at of ATOMS) {
      const y = altY(at.x, at.a), fallT = (y - Y_TOP) / FALL_V;
      const ph = t - at.off;                                    // 第一次撞擊在 at.off + fallT
      const cyc = ph < 0 ? -1 : Math.floor(ph / HIT_P), tc = ph - Math.max(0, cyc) * HIT_P;
      const tau = ph < 0 ? -1 : tc - fallT;                     // 撞擊後經過的時間
      // 落下的粒子（沿近乎垂直的磁力線，邊轉邊下）
      if (!glowOnly && ph >= 0 && tau < 0) {
        const yy = Y_TOP + tc * FALL_V, xx = at.x + 5 * Math.sin(yy * 0.16);
        ctx.save(); ctx.globalAlpha = a * 0.5; ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); for (let j = 0; j <= 10; j++) { const y2 = Math.max(Y_TOP, yy - j * 6); const x2 = at.x + 5 * Math.sin(y2 * 0.16); j ? ctx.lineTo(x2, y2) : ctx.moveTo(x2, y2); } ctx.stroke(); ctx.restore();
        particle(ctx, xx, yy, Math.cos(yy * 0.16), a * seg(tc, 0, 0.2));
      }
      // 原子：激發（白亮）→ 放光（該色光暈＋擴散光圈）→ 回到原狀
      const exc = tau >= 0 && tau < 0.4 ? 1 : 0;
      const emit = tau >= 0.3 && tau < 1.9 ? 1 - seg(tau, 0.6, 1.9) : 0;
      softGlow(ctx, at.x, y, 26 + 30 * emit, at.c, a * emit);
      if (emit > 0) {
        const rr = 14 + 46 * seg(tau, 0.3, 1.5);
        ctx.save(); ctx.globalAlpha = a * emit * 0.8; ctx.strokeStyle = `rgb(${at.c})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(at.x, y, rr, 0, TAU); ctx.stroke(); ctx.restore();
      }
      if (glowOnly) continue;
      ctx.save(); ctx.globalAlpha = a;
      if (exc) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 18; }
      atomShape(ctx, at.x, y, at.k, exc ? '#ffffff' : emit > 0.05 ? `rgb(${at.c})` : '#8fa3a6', exc ? 1.25 : 1);
      ctx.restore();
    }
  }

  // 俯視北極：地球圓盤、地磁 S 極、極光帶
  const TV_R = 225;
  const TV = { x: 470, y: 312, r: TV_R };
  const MP = { x: TV.x - 24, y: TV.y - 36 };                 // 地磁 S 極：離地理北極約 11°（225·sin11° ≈ 43 px）
  const OV = { x: MP.x + 14, y: MP.y };                      // 極光帶中心略偏夜側
  function topView(ctx, t) {
    ctx.save();
    ctx.beginPath(); ctx.arc(TV.x, TV.y, TV.r, 0, TAU); ctx.fillStyle = EARTH_FILL; ctx.fill();
    ctx.clip();
    if (TEX.ready) ctx.drawImage(TEX.top, TV.x - TV.r, TV.y - TV.r, TV.r * 2, TV.r * 2);   // 真實北極上空視角（NASA Blue Marble）
    const ng = ctx.createLinearGradient(TV.x - 20, 0, TV.x + 60, 0);                                          // 背向太陽的夜側
    ng.addColorStop(0, 'rgba(8,20,30,0)'); ng.addColorStop(1, 'rgba(8,20,30,0.6)');
    ctx.fillStyle = ng; ctx.fillRect(TV.x - 20, TV.y - TV.r, TV.r + 30, TV.r * 2);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = CYAN; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(TV.x, TV.y, TV.r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function poleMarks(ctx) {
    line(ctx, [[TV.x - 10, TV.y], [TV.x + 10, TV.y]], CHALK, 3); line(ctx, [[TV.x, TV.y - 10], [TV.x, TV.y + 10]], CHALK, 3);
    ctx.save(); ctx.fillStyle = BLUE; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(MP.x, MP.y, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  const RING_N = 96;
  function ovalR(th, R, t) { return R * (1 + 0.035 * Math.sin(3 * th + t * 1.4) + 0.015 * Math.sin(5 * th - t * 2.1)); }
  function auroraRing(ctx, R, t, a) {
    if (a <= 0) return;
    const P = [];
    for (let i = 0; i <= RING_N; i++) { const th = i / RING_N * TAU, r = ovalR(th, R, t); P.push([OV.x + r * Math.cos(th), OV.y + r * Math.sin(th), th, r]); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    // 向外的光條（極光幕的「射線」）
    ctx.lineWidth = 3;
    for (let i = 0; i < RING_N; i += 2) {
      const [x, y, th, r] = P[i], night = 0.25 + 0.75 * Math.max(0, Math.cos(th));
      const len = 12 + 14 * (0.5 + 0.5 * Math.sin(i * 1.7 + t * 3));
      ctx.globalAlpha = a * 0.35 * night; ctx.strokeStyle = AUR_G;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(th) * len, y + Math.sin(th) * len); ctx.stroke();
    }
    const layers = [[40, 0.05, AUR_R], [30, 0.1, AUR_G], [16, 0.22, AUR_G], [7, 0.55, AUR_G], [2.5, 0.75, '#d9ffe6']];
    for (const [lw, la, col] of layers) {
      ctx.lineWidth = lw; ctx.strokeStyle = col;
      for (let i = 0; i < RING_N; i++) {
        const night = 0.25 + 0.75 * Math.max(0, Math.cos(P[i][2]));
        ctx.globalAlpha = a * la * night * (0.85 + 0.15 * Math.sin(i * 0.7 - t * 2.5));
        ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + 1][0], P[i + 1][1]); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawAurora(ctx, step, t, T) {
    if (step === 0) {
      // ① 太陽風：多數被推開，少數被磁力線抓住
      const A = buildAur();
      drawSun(ctx, seg(t, 0, 1.0));
      drawField(ctx, 0.32, 0.45, T);
      drawWind(ctx, Math.max(0, t - 1.0), seg(t, 1.0, 1.4));
      drawShield(ctx, seg(t, 1.5, 2.5), T);
      earth(ctx);
      A.caught.forEach((c, k) => {
        const t0 = 3.2 + k * 1.3; if (t < t0) return;
        const tCap = c.sCap / 170, tF = (c.poly.len - c.sCap) / 120, per = tCap + tF + 1.6;
        const tau = (t - t0) % per;
        ctx.save(); ctx.globalAlpha = 0.85 * seg(t, t0 + tCap - 0.3, t0 + tCap + 0.2);
        ctx.strokeStyle = CYAN; ctx.lineWidth = 4; ctx.shadowColor = CYAN; ctx.shadowBlur = 12; ctx.stroke(c.fpath); ctx.restore();
        const d = tau < tCap ? tau * 170 : c.sCap + (tau - tCap) * 120;
        const amp = s => s <= c.sCap ? 0 : 6 * (1 - 0.6 * (s - c.sCap) / (c.poly.len - c.sCap));
        if (tau < tCap + tF) {
          trail(ctx, c.poly, Math.min(d, c.poly.len), amp, 0.3);
          const [x, y, dp] = helixAt(c.poly, Math.min(d, c.poly.len), amp(d), 0.3);
          particle(ctx, x, y, dp, 1, true);
        }
        if (tau > tCap && tau < tCap + 0.7) { const [x, y] = windAt(c.poly, c.sCap); glowRing(ctx, x, y, 16 + 20 * (tau - tCap), YELLOW, 1 - (tau - tCap) / 0.7); }
        if (tau > tCap + tF - 0.1) softGlow(ctx, c.foot.x, c.foot.y, 30, AUR.g, 1 - seg(tau, tCap + tF + 0.4, per));
      });
      geoLabels(ctx);
      tag(ctx, tr('太陽風 →', 'Solar wind →'), 130, 223, ORANGE, seg(t, 1.2, 1.8));
      tag(ctx, tr('少數粒子被磁力線抓住', 'A few get caught by field lines'), 215, 96, YELLOW, seg(t, 6.2, 6.8));
      topMsg(ctx, tr('補充：極光從哪裡來？先看太陽風', 'Extra: where do auroras come from? The solar wind'), CHALK);
      botMsg(ctx, t < 6 ? tr('太陽風（電子、質子）大多被地磁場推開、繞過地球', 'Most solar-wind particles (electrons, protons) are pushed aside')
        : tr('但少數粒子被磁力線「抓住」，導向兩極附近', 'But a few are caught by field lines and led toward the poles'),
      t < 6 ? ORANGE : YELLOW, t < 6 ? seg(t, 1.6, 2.1) : seg(t, 6.0, 6.5));
    } else if (step === 1) {
      // ② 沿磁力線滑向極區（只畫北半球）
      const A = buildAur();
      drawSun(ctx, 0.5);
      drawField(ctx, 0.16, 0, T);
      earth(ctx);
      const ga = seg(t, 0.2, 1.4);
      ctx.save(); ctx.lineCap = 'round';
      for (const g of A.guides) {
        ctx.globalAlpha = ga; ctx.strokeStyle = `rgba(${LINE_RGB},0.7)`; ctx.lineWidth = 3; ctx.stroke(g.poly.path);
        ctx.strokeStyle = `rgba(${LINE_RGB},0.95)`; ctx.lineWidth = 5; ctx.setLineDash([14, 40]); ctx.lineDashOffset = -T * 60;
        ctx.stroke(g.poly.path); ctx.setLineDash([]);
      }
      ctx.restore();
      for (const g of A.guides) {
        const per = g.poly.len / 110 + 1.2;
        const amp = s => 9 * (1 - 0.7 * s / g.poly.len);
        for (const half of [0, 0.5]) {
          const t0 = 1.2 + g.off + half * per; if (t < t0) continue;
          const tau = (t - t0) % per, d = tau * 110;
          if (d < g.poly.len) {
            trail(ctx, g.poly, d, amp, 0.22);
            const [x, y, dp] = helixAt(g.poly, d, amp(d), 0.22);
            particle(ctx, x, y, dp, seg(d, 0, 20), true);
          } else softGlow(ctx, g.foot.x, g.foot.y, 34, AUR.g, 1 - seg(tau, g.poly.len / 110 + 0.2, per));
        }
      }
      geoLabels(ctx, 1);
      tag(ctx, tr('夜側（背向太陽）', 'Night side'), 840, 430, CHALK, seg(t, 1.5, 2.0));
      tag(ctx, tr('只能沿著磁力線走', 'Only along field lines'), 830, 500, CYAN, seg(t, 3.0, 3.5));
      const zb = seg(t, 8.0, 8.6);
      if (zb > 0) {
        ctx.save(); ctx.globalAlpha = zb * (0.75 + 0.25 * Math.sin(t * 4)); ctx.strokeStyle = YELLOW; ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
        rrect(ctx, 572, 150, 104, 92, 12); ctx.stroke(); ctx.restore();
        tag(ctx, tr('放大這裡', 'Zoom in'), 560, 120, YELLOW, zb);
      }
      topMsg(ctx, tr('被抓住的粒子，繞著磁力線打轉、滑向極區', 'Caught particles spiral along field lines to the polar region'), CHALK);
      botMsg(ctx, tr('粒子只能沿著磁力線走，最後落在磁極附近的高空', 'They can only follow field lines, ending high above the poles'), CYAN, seg(t, 3.6, 4.2));
    } else if (step === 2) {
      // ③ 撞擊高空大氣：激發 → 放光
      sideScene(ctx);
      ctx.save(); ctx.strokeStyle = `rgba(${LINE_RGB},0.22)`; ctx.lineWidth = 2;               // 極區附近的磁力線幾乎垂直
      for (const at of ATOMS) { ctx.beginPath(); ctx.moveTo(at.x, Y_TOP); ctx.lineTo(at.x, altY(at.x, 0)); ctx.stroke(); }
      ctx.restore();
      drawAtoms(ctx, t, 1);
      // 圖例
      ctx.save(); ctx.fillStyle = 'rgba(12,30,25,0.9)'; rrect(ctx, 664, 118, 326, 162, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(242,236,217,0.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      particle(ctx, 692, 150, 0, 1);
      ctx.save(); atomShape(ctx, 692, 199, 'O', '#8fa3a6'); atomShape(ctx, 692, 248, 'N', '#8fa3a6', 0.85); ctx.restore();
      const lw = 262;
      label(ctx, tr('帶電粒子', 'Charged particle'), 718, 150, ORANGE, 'left', fit(ctx, tr('帶電粒子', 'Charged particle'), 24, lw));
      label(ctx, tr('氧原子 O', 'Oxygen atom O'), 718, 199, CHALK, 'left', fit(ctx, tr('氧原子 O', 'Oxygen atom O'), 24, lw));
      label(ctx, tr('氮分子 N₂', 'Nitrogen N₂'), 718, 248, CHALK, 'left', fit(ctx, tr('氮分子 N₂', 'Nitrogen N₂'), 24, lw));
      topMsg(ctx, tr('放大極區高空：粒子撞上大氣中的原子', 'Zoom in high above the pole: particles hit air atoms'), CHALK);
      botMsg(ctx, t < 6 ? tr('撞擊把能量交給氧、氮原子：原子被「激發」（變白）', 'Each hit gives energy to an O or N atom: it gets excited (white)')
        : tr('原子回到低能狀態時，多餘的能量變成光放出來', 'As the atom relaxes, the extra energy comes out as light'),
      t < 6 ? YELLOW : AUR_G, t < 6 ? seg(t, 1.2, 1.8) : seg(t, 6.0, 6.5));
      fadeIn(ctx, 1 - seg(t, 0, 0.6));
    } else if (step === 3) {
      // ④ 不同顏色與高度
      sideScene(ctx);
      const ca = easeIO(seg(t, 0.3, 2.0));
      drawAtoms(ctx, t + 3, 1 - seg(t, 0, 1.0), true);
      drawCurtain(ctx, T, ca);
      const items = [
        [310, tr('紅光｜氧', 'Red · oxygen'), tr('約 250 km 以上', 'above ~250 km'), AUR_R, 2.2],
        [170, tr('綠光｜氧', 'Green · oxygen'), tr('約 100–250 km・最常見', '~100–250 km'), AUR_G, 3.4],
        [88, tr('藍紫光｜氮分子', 'Violet · nitrogen'), tr('約 100 km 以下・較少', 'below ~100 km · rarer'), AUR_B, 4.6]
      ];
      for (const [alt, t1, t2, col, ts] of items) {
        const a = seg(t, ts, ts + 0.5), y = altY(668, alt);
        if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha = a; line(ctx, [[CUR.x0 + CUR.w - 14, altY(CUR.x0 + CUR.w, alt)], [662, y]], col, 3, [6, 6]); ctx.restore();
        legend2(ctx, 668, y, t1, t2, col, a);
      }
      topMsg(ctx, tr('不同原子、不同高度，發出不同顏色的光', 'Different atoms at different heights glow in different colors'), CHALK);
      botMsg(ctx, tr('綠光最常見；紅光在最上面，藍紫光在最下面', 'Green is most common; red is on top, violet at the bottom'), AUR_G, seg(t, 5.4, 6.0));
    } else {
      // ⑤ 從北極上空俯視：極光帶（極光橢圓）
      drawSun(ctx, 0.85);
      topView(ctx, t);
      const ex = easeIO(seg(t, 6.6, 8.2)) * (1 - easeIO(seg(t, 13.0, 14.4)));
      const R = lerp(104, 150, ex);
      auroraRing(ctx, R, t, seg(t, 0.8, 2.2) * (1 + 0.25 * ex));
      poleMarks(ctx);
      if (ex > 0.02) {
        ctx.save(); ctx.globalAlpha = ex;
        for (const th of [-0.8, 0.8, Math.PI - 0.8, Math.PI + 0.8]) {
          const r0 = 104 * 1.12, r1 = R * 1.12 + 22;
          if (r1 - r0 < 8) continue;
          line(ctx, [[OV.x + r0 * Math.cos(th), OV.y + r0 * Math.sin(th)], [OV.x + r1 * Math.cos(th), OV.y + r1 * Math.sin(th)]], YELLOW, 4);
          arrowHead(ctx, OV.x + r1 * Math.cos(th), OV.y + r1 * Math.sin(th), th, YELLOW, 12);
        }
        ctx.restore();
      }
      tag(ctx, tr('← 太陽', '← Sun'), 150, TV.y, ORANGE, seg(t, 0.3, 0.8));
      tag(ctx, tr('＋ 地理北極', '+ Geo North Pole'), 736, 130, CHALK, seg(t, 0.6, 1.1), 24, 'left', false);
      tag(ctx, tr('● 地磁 S 極', '● Geomag S pole'), 736, 184, BLUE, seg(t, 0.6, 1.1), 24, 'left', false);
      tag(ctx, tr('極光帶（北極光）', 'Auroral oval'), 736, 238, AUR_G, seg(t, 2.0, 2.5), 24, 'left');
      tag(ctx, tr('夜側較亮', 'Brighter at night'), 736, 292, CHALK, seg(t, 3.0, 3.5), 24, 'left', false);
      topMsg(ctx, tr('從北極上空往下看：極光圍著磁極排成一圈', 'Looking down on the North Pole: the aurora rings the magnetic pole'), CHALK);
      botMsg(ctx, t < 6.4 ? tr('這一圈叫「極光帶」；南極上空也有一圈（南極光）', 'This ring is the auroral oval; the South Pole has one too')
        : tr('太陽活動強時，光環向低緯擴大', 'When the Sun is active, the ring grows toward lower latitudes'),
      t < 6.4 ? AUR_G : YELLOW, t < 6.4 ? seg(t, 2.6, 3.1) : seg(t, 6.4, 6.9));
      fadeIn(ctx, 1 - seg(t, 0, 0.6));
    }
  }
  // ═════════ 場景表 ═════════
  const SCENES = {
    'example-aurora': {
      draw: drawAurora,
      steps: [
        { d: 13.0, b: ['太陽風', 'Solar wind'],
          cap: ['從太陽吹來的<strong class="accent-orange">太陽風</strong>是帶電粒子（電子、質子）。它們大多被<strong class="accent-cyan">地磁場</strong>推開、繞過地球；但有<strong class="accent-yellow">少數粒子</strong>被磁力線「抓住」，被導向兩極附近。',
                'The <strong class="accent-orange">solar wind</strong> is a stream of charged particles (electrons and protons). Most are pushed aside by the <strong class="accent-cyan">geomagnetic field</strong> and flow around Earth, but <strong class="accent-yellow">a few</strong> get caught by field lines and are led toward the poles.'] },
        { d: 12.0, b: ['沿磁力線', 'Along lines'],
          cap: ['被抓住的粒子<strong class="accent-cyan">只能沿著磁力線</strong>前進：一邊繞著磁力線打轉，一邊滑向<strong class="accent-yellow">磁極附近的高空</strong>。許多粒子是從背向太陽的夜側高空被導進來的（圖中只畫北半球，南半球也一樣）。',
                'Caught particles can <strong class="accent-cyan">only travel along field lines</strong>: they spiral around a line while sliding toward the <strong class="accent-yellow">sky above the magnetic poles</strong>. Many come in from high above the night side (only the north is drawn; the south works the same way).'] },
        { d: 13.0, b: ['撞擊大氣', 'Collisions'],
          cap: ['粒子在高空撞上大氣中的<strong class="accent-yellow">氧原子</strong>與<strong class="accent-yellow">氮分子</strong>，把能量交給它們，原子被「激發」。原子回到原本的低能狀態時，把多餘的能量以<strong class="accent-green">光</strong>放出來——這就是極光。',
                'High up, the particles hit <strong class="accent-yellow">oxygen atoms</strong> and <strong class="accent-yellow">nitrogen molecules</strong> and hand over energy, so the atoms become "excited". When they drop back to their low-energy state, the extra energy is given off as <strong class="accent-green">light</strong>: that is the aurora.'] },
        { d: 12.0, b: ['顏色高度', 'Colors'],
          cap: ['不同原子、不同高度發出不同顏色：最常見的<strong class="accent-green">綠光</strong>來自氧（約 100–250 km）；<strong class="accent-red">紅光</strong>也來自氧，在更高處（約 250 km 以上）；<strong class="accent-blue">藍紫光</strong>來自氮，在較低處，比較少見。',
                'Different atoms at different heights give different colors: the most common <strong class="accent-green">green</strong> comes from oxygen (about 100–250 km); <strong class="accent-red">red</strong> also comes from oxygen, but higher up (above about 250 km); <strong class="accent-blue">blue-violet</strong> comes from nitrogen lower down and is rarer.'] },
        { d: 16.0, b: ['極光帶', 'Aurora ring'],
          cap: ['從北極上空往下看：極光出現在磁極周圍的<strong class="accent-green">環狀地帶</strong>（極光帶，又叫極光橢圓）。北半球的叫<strong>北極光</strong>，南半球的叫<strong>南極光</strong>。<strong class="accent-yellow">太陽活動強</strong>時，光環會向低緯度擴大，比較南邊的地方也看得到極光。',
                'Seen from above the North Pole, auroras form a <strong class="accent-green">ring</strong> around the magnetic pole (the auroral oval). In the north they are the <strong>northern lights</strong>; in the south, the <strong>southern lights</strong>. When the <strong class="accent-yellow">Sun is very active</strong>, the ring grows toward lower latitudes, so auroras can be seen farther from the poles.'] }
      ]
    }
  };

  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0, endFired: false };
  function canvasCtx() { const c = document.getElementById('giftedCanvas'); return c ? c.getContext('2d') : null; }
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
    ctx.setTransform(2, 0, 0, 2, 0, 0);          // 本頁畫布 2000×1200，邏輯座標 1000×600
    clear(ctx);
    sc.draw(ctx, i, S.t - sc.starts[i], S.t);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
  }
  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc) return;
    const res = document.getElementById('giftedResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-gifted');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function buildButtons() {
    const row = document.getElementById('steps-gifted'); if (!row) return;
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
  function visible() { const c = document.getElementById('giftedCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
  function frame(ts) {
    S.raf = 0;
    if (!S.scene || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    if (S.last && !(MA.ctl && MA.ctl.paused)) S.t += Math.min(0.1, (ts - S.last) / 1000);
    S.last = ts;
    const sc = SCENES[S.scene];
    if (S.t >= sc.total) {
      if (teacher()) { S.t = sc.total - 1e-3; if (!S.endFired) { S.endFired = true; MA.ctl.onEnd(); } }
      else { S.t = 0; }
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

  MA.aurora = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'example-aurora';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false;
      buildLines();                       // 切入時一次建好地磁場線與太陽風路徑快取
      buildAur();                         // 粒子路徑與光幕離屏畫布
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-gifted'); if (row) row.innerHTML = '';
    },
    relang() {
      if (!S.scene) return;
      buildButtons(); S.step = -1; render(); start();
    },
    // 測試用
    _frameAt(sceneId, t) { if (!SCENES[sceneId]) return null; S.scene = sceneId; S.t = t; render(); return SCENES[sceneId].total; },
    _info() { const o = {}; for (const k in SCENES) o[k] = { total: SCENES[k].total, starts: SCENES[k].starts.slice() }; return o; },
    _state() { return { scene: S.scene, t: S.t, step: S.step, running: !!S.raf }; }
  };
})();

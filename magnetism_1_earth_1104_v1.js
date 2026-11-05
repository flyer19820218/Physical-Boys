/* magnetism_1_earth_1104_v1.js — 「地球大磁鐵」分頁動畫（#earthCanvas，1000×600）
 *
 * 契約：window.MagAnim.earth = { activate(sceneId), deactivate(), relang() }
 * 依賴頁面現成的：tr、C、TAU、clear、label、line、drawCompass、drawEarthMagneticField
 * （直接呼叫，不複製、不修改）。地磁場線用 drawEarthMagneticField 錄成路徑一次（快取成 Path2D），
 * 播放時改用青色重畫（本頁磁力線語意色），並以流動虛線表示方向（地球外部：地理南極附近 → 地理北極附近）。
 * 指南針角度 = 偶極場切線方向（磁矩由地磁 S 指向地磁 N，即在磁軸座標中朝下），N 極指向磁場方向。
 * 原圖幾何：地球 cx=500, cy=300, r=160；磁軸相對自轉軸傾斜 11°（順時針）；
 * 內部大磁鐵長 270 寬 50，上半（靠地理北極）S 極藍、下半 N 極紅，隨磁軸傾斜。
 * 畫布不綁任何事件；唯一控制是 #steps-earth 裡的步驟鈕（每場景 ≤5 個），說明寫入 #earthResult。
 *
 * （「補充：美麗的極光」已於 2026-11-05 搬到 electric_motor_3，見 electric_motor_3_aurora_1105_v1.js）
 *
 * ── 場景步驟表 ───────────────────────────────────────────────
 * earth-surface 表面磁場指向，共 47.0 s
 *   1 放指南針 11.0 s 地球左右兩側（磁緯 34°～−30°）8 處逐一放上指南針，擺盪後 N 極都轉向北方那一側
 *   2 地磁場線 11.0 s 地磁場線（青）淡入並流動；每根指南針標出切線（黃虛線），N 極順著磁場線
 *   3 大磁鐵   9.0 s  結論：地球本身是一顆巨大的磁鐵，周圍充滿地磁場
 *   4 磁場盾牌 16.0 s 太陽風粒子由左方吹來，在向陽面被地磁場（盾牌弧）推開、沿弧線繞到上下方離開，地球背後無粒子（含停留）
 * earth-core 透視地球內部，共 42.0 s
 *   1 誰在吸它 9.0 s  指南針 N 極指向地理北方，粉色虛線拉向北方的「？」
 *   2 透視     10.0 s 掃描光帶由上而下掃過，地球變半透明，露出內部大磁鐵（S 上、N 下）與標籤
 *   3 異名相吸 10.0 s 左右兩根指南針的 N 極都被地磁 S 極吸引（粉色虛線）→ 地理北極附近是地磁 S 極
 *   4 夾角 11° 13.0 s 白虛線自轉軸、黃虛線磁軸，畫出 11° 夾角（含停留）
 * 最後一步播完（含停留）自動從第 1 步重播。
 */
(function () {
  'use strict';
  window.MagAnim = window.MagAnim || {};

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

  // ───────── 小工具 ─────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeIO = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
  function swing(target, start, tau) {
    if (tau <= 0) return start;
    return target + wrapA(start - target) * Math.exp(-1.7 * tau) * Math.cos(6 * tau);
  }
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
  function compass(ctx, x, y, ang, rad, a = 1) {
    if (a <= 0) return;
    if (a >= 1) { drawCompass(ctx, x, y, ang, rad); return; }
    ctx.save(); ctx.globalAlpha = a; drawCompass(ctx, x, y, ang, rad); ctx.restore();
  }
  function tangent(ctx, x, y, ang, half, a) {
    if (a <= 0) return;
    const c = Math.cos(ang), s = Math.sin(ang);
    ctx.save(); ctx.globalAlpha = a;
    line(ctx, [[x - c * half, y - s * half], [x + c * half, y + s * half]], YELLOW, 3.5, [11, 8]);
    ctx.restore();
  }
  // 磁軸座標（x 右、y 下，隨 TILT 順時針轉）→ 畫布座標
  function toCanvas(lx, ly) { return { x: CX + lx * COS_T - ly * SIN_T, y: CY + lx * SIN_T + ly * COS_T }; }
  // 偶極場方向（磁矩在磁軸座標中朝下：由上方地磁 S 指向下方地磁 N）
  function fang(x, y) {
    const dx = x - CX, dy = y - CY;
    const lx = dx * COS_T + dy * SIN_T, ly = -dx * SIN_T + dy * COS_T;
    const r = Math.hypot(lx, ly), ux = lx / r, uy = ly / r;
    const md = uy;                                   // m·r̂，m = (0,1)
    const bx = 3 * md * ux, by = 3 * md * uy - 1;
    return Math.atan2(bx * SIN_T + by * COS_T, bx * COS_T - by * SIN_T);
  }
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
  const TEX = { ready: false, data: null, w: 2048, h: 1024, front: null };
  (function loadTex() {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = TEX.w; c.height = TEX.h;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0, TEX.w, TEX.h);
        TEX.data = x.getImageData(0, 0, TEX.w, TEX.h).data;
        TEX.front = bakeGlobe(ER * 2, 0, 105);      // 正面：赤道上空、中心經度 105°E（亞洲、印度洋、澳洲一帶）
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
  function xrayEarth(ctx, scanY, minA) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, scanY, W, H); ctx.clip(); earth(ctx, 1); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, scanY); ctx.clip(); earth(ctx, minA); ctx.restore();
  }
  function magnet(ctx, a = 1, clipY = H) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.rect(0, 0, W, clipY); ctx.clip();
    ctx.translate(CX, CY); ctx.rotate(TILT);
    const hl = MAG_L / 2, hw = MAG_W / 2;
    ctx.fillStyle = BLUE; ctx.fillRect(-hw, -hl, MAG_W, hl);
    ctx.fillStyle = RED; ctx.fillRect(-hw, 0, MAG_W, hl);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(-hw, -hl, MAG_W, MAG_L);
    label(ctx, 'S', 0, -65, '#ffffff', 'center', 38); label(ctx, 'N', 0, 65, '#ffffff', 'center', 38);
    ctx.restore();
  }
  const S_END = toCanvas(0, -95), N_END = toCanvas(0, 95);          // 標籤對準的位置
  const S_TIP = toCanvas(0, -MAG_L / 2 + 18);                         // 相吸線的終點（S 極端）
  function poleTags(ctx, a, sGlow = 0) {
    if (a <= 0) return;
    const sR = toCanvas(MAG_W / 2, -95), nL = toCanvas(-MAG_W / 2, 95);
    tag(ctx, tr('← 地磁 S 極', '← Geomag S'), sR.x + 12, S_END.y, BLUE, a, 24, 'left');
    tag(ctx, tr('地磁 N 極 →', 'Geomag N →'), nL.x - 12, N_END.y, RED, a, 24, 'right');
    if (sGlow > 0) {
      ctx.save(); ctx.globalAlpha = sGlow; ctx.translate(CX, CY); ctx.rotate(TILT);
      ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.shadowColor = PINK; ctx.shadowBlur = 16;
      ctx.strokeRect(-MAG_W / 2 - 7, -MAG_L / 2 - 7, MAG_W + 14, MAG_L / 2 + 7); ctx.restore();
    }
  }
  const GEO_N = { x: CX, y: CY - ER - 28 }, GEO_S = { x: CX, y: CY + ER + 28 };
  function geoLabels(ctx, k = 0) {
    // k: 0 = 在地球正上／下方；1 = 讓出自轉軸（北標往左、南標往右）
    const nx = lerp(GEO_N.x, 405, k), ny = lerp(GEO_N.y, 104, k);
    const sx = lerp(GEO_S.x, 600, k), sy = lerp(GEO_S.y, 500, k);
    tag(ctx, tr('地理北極', 'Geo North'), nx, ny, CHALK, 1, 24, 'center', false);
    tag(ctx, tr('地理南極', 'Geo South'), sx, sy, CHALK, 1, 24, 'center', false);
  }
  // 粉色虛線（相吸），沿二次曲線，帶箭頭與流動
  function pull(ctx, x1, y1, qx, qy, x2, y2, a, t) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.setLineDash([12, 10]); ctx.lineDashOffset = -t * 40;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(qx, qy, x2, y2); ctx.stroke();
    ctx.restore();
    const ang = Math.atan2(y2 - qy, x2 - qx);
    ctx.save(); ctx.globalAlpha = a; arrowHead(ctx, x2, y2, ang, PINK, 14); ctx.restore();
  }

  // ═════════ 場景 1：表面磁場指向 ═════════
  const CR = 28, CD = ER + 44;                       // 指南針半徑、離地心距離
  const SURF = [[34, -1, -2.2], [12, -1, 2.6], [-10, -1, 1.0], [-30, -1, -0.6], [-30, 1, 2.0], [-10, 1, -2.6], [12, 1, 0.4], [34, 1, 2.9]]
    .map(([lam, side, a0]) => { const p = atLat(lam, CD, side); return { x: p.x, y: p.y, a0, ang: fang(p.x, p.y) }; });
  function surfaceCompasses(ctx, t, opts) {
    SURF.forEach((c, k) => {
      const t0 = opts.t0 + opts.dt * k;
      if (opts.settled) { compass(ctx, c.x, c.y, c.ang, CR, opts.a); return; }
      if (t < t0) return;
      compass(ctx, c.x, c.y, swing(c.ang, c.a0, t - t0 - 0.3), CR, seg(t, t0, t0 + 0.35));
    });
  }
  function nGlow(ctx, a) {                           // 指南針外圈的黃色光環
    if (a <= 0) return;
    for (const c of SURF) glowRing(ctx, c.x, c.y, CR + 6, YELLOW, a);
  }
  function drawSurface(ctx, step, t, T) {
    if (step === 0) {
      earth(ctx);
      surfaceCompasses(ctx, t, { t0: 0.5, dt: 0.95 });
      nGlow(ctx, seg(t, 8.8, 9.3) * (0.55 + 0.45 * Math.sin(t * 5)));
      geoLabels(ctx);
      topMsg(ctx, tr('在地球表面不同位置放上指南針', 'Place compasses all around Earth\'s surface'), CHALK);
      botMsg(ctx, tr('不論在哪裡，N 極（紅）都轉向地理北方', 'Everywhere, the N pole (red) turns toward geographic north'), YELLOW, seg(t, 8.8, 9.3));
    } else if (step === 1) {
      drawField(ctx, 0.5 * easeIO(seg(t, 0, 1.5)), 0.85 * seg(t, 0.8, 2.0), T);
      earth(ctx);
      SURF.forEach((c, k) => tangent(ctx, c.x, c.y, c.ang, 50, seg(t, 2.0 + 0.5 * k, 2.4 + 0.5 * k)));
      surfaceCompasses(ctx, t, { settled: true, a: 1 });
      geoLabels(ctx);
      topMsg(ctx, tr('畫出地磁場線：N 極順著磁場線的切線方向', 'Draw the field lines: each N pole follows the tangent'), CHALK);
      botMsg(ctx, tr('地球外部：磁場線由地理南極附近出發，進入地理北極附近', 'Outside Earth, field lines run from near the South Pole to the North'), CYAN, seg(t, 6.2, 6.8));
    } else if (step === 2) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
      drawField(ctx, 0.55 + 0.25 * pulse, 0.9, T);
      earth(ctx, 1, seg(t, 0.3, 1.2) * (0.5 + 0.5 * pulse));
      surfaceCompasses(ctx, t, { settled: true, a: 1 - 0.5 * seg(t, 0.2, 1.0) });
      geoLabels(ctx);
      tag(ctx, tr('地磁場', 'Geomagnetic field'), 130, CY, CYAN, seg(t, 1.0, 1.5), 26);
      tag(ctx, tr('地磁場', 'Geomagnetic field'), 870, CY, CYAN, seg(t, 1.0, 1.5), 26);
      topMsg(ctx, tr('結論：地球本身就是一顆巨大的磁鐵', 'Conclusion: Earth itself is a giant magnet'), YELLOW, seg(t, 0, 0.6));
      botMsg(ctx, tr('它的周圍充滿了地磁場', 'It is surrounded by a geomagnetic field'), CYAN, seg(t, 1.6, 2.2));
    } else {
      drawSun(ctx, seg(t, 0, 1.0));
      drawField(ctx, 0.32, 0.45, T);
      drawWind(ctx, Math.max(0, t - 1.0), seg(t, 1.0, 1.4));
      drawShield(ctx, seg(t, 5.0, 6.0), T);
      earth(ctx);
      surfaceCompasses(ctx, t, { settled: true, a: 0.5 * (1 - seg(t, 0, 0.8)) });
      geoLabels(ctx);
      tag(ctx, tr('太陽風 →', 'Solar wind →'), 130, 223, ORANGE, seg(t, 1.2, 1.8));
      topMsg(ctx, tr('地磁場像一面盾牌', 'The geomagnetic field is like a shield'), CHALK);
      botMsg(ctx, t < 5 ? tr('太陽風：從太陽吹來的帶電粒子', 'Solar wind: charged particles blowing from the Sun')
        : tr('粒子被地磁場推開、繞過地球，保護地球上的生命', 'Particles are pushed aside and flow around Earth, protecting life'),
      t < 5 ? ORANGE : CYAN, t < 5 ? seg(t, 1.6, 2.1) : seg(t, 5.0, 5.5));
    }
  }

  // ═════════ 場景 2：透視地球內部 ═════════
  const KR = 34;
  const CL = atLat(0, ER + 50, -1), CRt = atLat(0, ER + 50, 1);
  const CL_A = fang(CL.x, CL.y), CR_A = fang(CRt.x, CRt.y);
  function tipOf(p, ang) { return { x: p.x + Math.cos(ang) * KR * 0.8, y: p.y + Math.sin(ang) * KR * 0.8 }; }
  function drawCore(ctx, step, t, T) {
    drawField(ctx, 0.28, 0.4, T);
    if (step === 0) {
      earth(ctx);
      const ang = swing(CL_A, 2.6, t - 0.6);
      compass(ctx, CL.x, CL.y, ang, KR, seg(t, 0.2, 0.6));
      const q = { x: 515, y: 205 };
      const qa = seg(t, 3.0, 3.5);
      if (qa > 0) {
        const tip = tipOf(CL, CL_A);
        pull(ctx, tip.x, tip.y - 6, 330, 150, q.x - 30, q.y - 10, seg(t, 3.4, 3.9), T);
        ctx.save(); ctx.globalAlpha = qa; label(ctx, '?', q.x, q.y, YELLOW, 'center', 60 + 6 * Math.sin(t * 4)); ctx.restore();
      }
      geoLabels(ctx);
      topMsg(ctx, tr('指南針的 N 極指向地理北方……', 'The compass N pole points to geographic north...'), CHALK);
      botMsg(ctx, tr('想一想：北方是誰在吸引 N 極？', 'Think: what up north is pulling the N pole?'), YELLOW, seg(t, 4.2, 4.7));
    } else if (step === 1) {
      const scanY = lerp(CY - ER, CY + ER + 10, easeIO(seg(t, 1.0, 4.2)));
      const sy = t < 1.0 ? 0 : (t > 4.2 ? H : scanY);
      xrayEarth(ctx, sy, 0.3);
      magnet(ctx, 1, sy);
      if (t > 1.0 && t < 4.4) {                        // 掃描光帶
        const half = Math.sqrt(Math.max(0, ER * ER - (sy - CY) * (sy - CY)));
        ctx.save(); ctx.strokeStyle = CYAN; ctx.lineWidth = 5; ctx.shadowColor = CYAN; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.moveTo(CX - half - 12, sy); ctx.lineTo(CX + half + 12, sy); ctx.stroke(); ctx.restore();
      }
      compass(ctx, CL.x, CL.y, CL_A, KR);
      geoLabels(ctx);
      poleTags(ctx, seg(t, 5.0, 5.6));
      topMsg(ctx, tr('透視地球內部：裡面就像藏著一根大磁鐵', 'X-ray view: it is as if a giant magnet hides inside'), CHALK);
      botMsg(ctx, tr('地理北極附近是地磁 S 極，地理南極附近是地磁 N 極', 'Near geographic north: magnetic S; near geographic south: magnetic N'), YELLOW, seg(t, 6.4, 7.0));
    } else if (step === 2) {
      earth(ctx, 0.3); magnet(ctx);
      compass(ctx, CL.x, CL.y, CL_A, KR);
      compass(ctx, CRt.x, CRt.y, swing(CR_A, -2.4, t - 0.5), KR, seg(t, 0.3, 0.7));
      const tl = tipOf(CL, CL_A), trr = tipOf(CRt, CR_A);
      pull(ctx, tl.x, tl.y - 6, 340, 120, S_TIP.x - 22, S_TIP.y - 8, seg(t, 1.6, 2.1), T);
      pull(ctx, trr.x, trr.y - 6, 680, 130, S_TIP.x + 24, S_TIP.y - 4, seg(t, 2.4, 2.9), T);
      geoLabels(ctx);
      poleTags(ctx, 1, seg(t, 2.4, 2.9) * (0.6 + 0.4 * Math.sin(t * 4)));
      tag(ctx, tr('N 吸 S：異名極相吸', 'N is pulled to S: opposites attract'), 205, 160, PINK, seg(t, 3.0, 3.5));
      topMsg(ctx, tr('能把指南針 N 極吸向北方的，必定是 S 極', 'Whatever pulls the N pole north must be an S pole'), CHALK);
      botMsg(ctx, tr('所以地理北極附近，其實藏著地磁 S 極', 'So a magnetic S pole hides near the geographic North Pole'), BLUE, seg(t, 5.0, 5.5));
    } else {
      earth(ctx, 0.3);
      // 自轉軸（白虛線）
      const AX = 230, g = easeIO(seg(t, 1.2, 2.6));
      if (g > 0) {
        ctx.save(); ctx.globalAlpha = 0.95;
        line(ctx, [[CX, CY - AX * g], [CX, CY + AX * g]], CHALK, 3.5, [14, 10]); ctx.restore();
      }
      // 磁軸（黃虛線）
      const m = easeIO(seg(t, 2.8, 4.2));
      if (m > 0) {
        const a = toCanvas(0, -AX * m), b = toCanvas(0, AX * m);
        line(ctx, [[a.x, a.y], [b.x, b.y]], YELLOW, 3.5, [14, 10]);
      }
      magnet(ctx);                                    // 軸線畫在磁鐵之下，S／N 字不被虛線壓到
      compass(ctx, CL.x, CL.y, CL_A, KR);
      compass(ctx, CRt.x, CRt.y, CR_A, KR);
      poleTags(ctx, 1);
      geoLabels(ctx, easeIO(seg(t, 0.4, 1.4)));
      tag(ctx, tr('磁軸', 'Magnetic axis'), toCanvas(0, AX).x - 22, 516, YELLOW, seg(t, 3.8, 4.3), 24, 'right');
      // 11° 夾角
      const k = seg(t, 4.4, 5.4);
      if (k > 0) {
        const RA = 205, a0 = -Math.PI / 2;
        ctx.save(); ctx.strokeStyle = YELLOW; ctx.lineWidth = 4; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.arc(CX, CY, RA, a0, a0 + TILT * k); ctx.stroke(); ctx.restore();
        tag(ctx, '11°', 600, 80, YELLOW, k, 28);
      }
      topMsg(ctx, tr('自轉軸（白）與磁軸（黃）並不重合', 'The spin axis (white) and magnetic axis (yellow) differ'), CHALK);
      botMsg(ctx, tr('兩者夾角約 11 度', 'They are about 11° apart'), YELLOW, seg(t, 5.4, 6.0));
    }
  }

  // ═════════ 場景表 ═════════
  const SCENES = {
    'earth-surface': {
      draw: drawSurface,
      steps: [
        { d: 11.0, b: ['放指南針', 'Compasses'],
          cap: ['在地球表面不同位置放上指南針：不論在哪裡，指南針的 <strong class="accent-red">N 極</strong>都轉向<strong class="accent-yellow">地理北方</strong>。',
                'Place compasses at different spots on Earth\'s surface: wherever they are, the <strong class="accent-red">N pole</strong> turns toward <strong class="accent-yellow">geographic north</strong>.'] },
        { d: 11.0, b: ['地磁場線', 'Field lines'],
          cap: ['畫出<strong class="accent-cyan">地磁場線</strong>：在地球外部，磁場線由地理南極附近出發、進入地理北極附近。每根指南針的 <strong class="accent-red">N 極</strong>都順著磁場線的<strong class="accent-yellow">切線方向</strong>。',
                'Draw the <strong class="accent-cyan">geomagnetic field lines</strong>: outside Earth they leave near the geographic South Pole and enter near the North Pole. Every compass <strong class="accent-red">N pole</strong> points along the line\'s <strong class="accent-yellow">tangent</strong>.'] },
        { d: 9.0, b: ['大磁鐵', 'Giant magnet'],
          cap: ['結論：<strong class="accent-yellow">地球本身就是一顆巨大的磁鐵</strong>，周圍充滿了<strong class="accent-cyan">地磁場</strong>。',
                'Conclusion: <strong class="accent-yellow">Earth itself is a giant magnet</strong>, surrounded by a <strong class="accent-cyan">geomagnetic field</strong>.'] },
        { d: 16.0, b: ['磁場盾牌', 'Shield'],
          cap: ['地磁場像一面<strong class="accent-cyan">盾牌</strong>：從太陽吹來的<strong class="accent-orange">太陽風</strong>（帶電粒子）被推開、繞過地球。地磁場阻擋太陽風與宇宙射線的直擊，保護地球上的生命。',
                'The geomagnetic field acts like a <strong class="accent-cyan">shield</strong>: the <strong class="accent-orange">solar wind</strong> (charged particles) from the Sun is pushed aside and flows around Earth. The field blocks solar wind and cosmic rays, protecting life on Earth.'] }
      ]
    },
    'earth-core': {
      draw: drawCore,
      steps: [
        { d: 9.0, b: ['誰在吸它', 'Who pulls?'],
          cap: ['指南針的 <strong class="accent-red">N 極</strong>指向地理北方。想一想：地理北極附近，到底是什麼在吸引 N 極？',
                'A compass <strong class="accent-red">N pole</strong> points to geographic north. Think: what near the North Pole is pulling it?'] },
        { d: 10.0, b: ['透視', 'X-ray'],
          cap: ['透視地球內部：地球就像藏著一根大磁鐵。<strong class="accent-blue">地磁 S 極</strong>在地理北極附近，<strong class="accent-red">地磁 N 極</strong>在地理南極附近。',
                'X-ray view: Earth behaves as if a giant bar magnet hides inside. The <strong class="accent-blue">magnetic S pole</strong> is near the geographic North Pole, and the <strong class="accent-red">magnetic N pole</strong> is near the geographic South Pole.'] },
        { d: 10.0, b: ['異名相吸', 'Opposites'],
          cap: ['用「異名極相吸」推理：能把指南針 <strong class="accent-red">N 極</strong>吸向北方的，必定是 <strong class="accent-blue">S 極</strong>。因此，地理北極附近其實隱藏著<strong class="accent-blue">地磁南極（S 極）</strong>！',
                'Reason with "opposites attract": whatever pulls a compass <strong class="accent-red">N pole</strong> north must be an <strong class="accent-blue">S pole</strong>. So near the geographic North Pole hides the <strong class="accent-blue">geomagnetic south pole (S)</strong>!'] },
        { d: 13.0, b: ['夾角 11°', '11° tilt'],
          cap: ['地理南極附近則是<strong class="accent-red">地磁北極（N 極）</strong>。地球的<strong>自轉軸</strong>與<strong class="accent-yellow">磁軸</strong>並不重合，兩者夾角約 <strong class="accent-yellow">11 度</strong>。',
                'Near the geographic South Pole is the <strong class="accent-red">geomagnetic north pole (N)</strong>. Earth\'s <strong>spin axis</strong> and <strong class="accent-yellow">magnetic axis</strong> do not line up; they are about <strong class="accent-yellow">11°</strong> apart.'] }
      ]
    }
  };
  Object.values(SCENES).forEach(sc => { let a = 0; sc.starts = sc.steps.map(s => { const v = a; a += s.d; return v; }); sc.total = a; });

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { scene: null, t: 0, raf: 0, last: 0, step: -1, timer: 0 };
  function canvasCtx() { const c = document.getElementById('earthCanvas'); return c ? c.getContext('2d') : null; }
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
    sc.draw(ctx, i, S.t - sc.starts[i], S.t);
    drawProgress(ctx, sc, S.t);
    if (i !== S.step) { S.step = i; updateUI(); }
  }
  function updateUI() {
    const sc = SCENES[S.scene]; if (!sc) return;
    const res = document.getElementById('earthResult');
    if (res && S.step >= 0) { const c = sc.steps[S.step].cap; res.innerHTML = tr(c[0], c[1]); }
    const row = document.getElementById('steps-earth');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function buildButtons() {
    const row = document.getElementById('steps-earth'); if (!row) return;
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
  function visible() { const c = document.getElementById('earthCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }
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

  MagAnim.earth = {
    activate(sceneId) {
      if (!SCENES[sceneId]) sceneId = 'earth-surface';
      stop();
      S.scene = sceneId; S.t = 0; S.step = -1; S.last = 0; S.endFired = false;
      buildLines();                       // 切入時一次建好地磁場線與太陽風路徑快取
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.scene) return;
      S.scene = null; S.step = -1;
      const row = document.getElementById('steps-earth'); if (row) row.innerHTML = '';
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

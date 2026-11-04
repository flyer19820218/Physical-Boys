/* electric_motor_3_power_1104_v1.js — 「實戰：極速馬達」分頁動畫（#motorPowerCanvas，邏輯 1000×600）
 *
 * 契約：window.MotorAnim.power = { activate(sceneId), deactivate(), relang(), practice(), _info(), _state() }
 * 單場景 'motor-power'。
 * 依賴頁面現成的（直接呼叫，不複製、不改）：tr、currentLang、C、TAU、label、structProject（只用來定位強調）、
 *   renderMotorAssembly(ctx, a, { turns, fieldStrength, showCurrent:false })＝頁面 drawMotorPowerLessonCanvas 的同一組參數、
 *   pwrState、updatePower()。
 * 轉速公式、等級門檻、rpm 計算＝頁面 drawMotorPowerLessonCanvas 原樣：
 *   force = I×N×B；speed = .008 + (force/125)^1.38 × 1.62（rad/幀，60 fps）；>10 中等、>25 高速、>50 🔥 狂暴極速；
 *   rpm = round(180 + speed×7900)。畫面角速度 ω = speed×60 rad/s，以 τ = 0.45 s 一階延遲「加速」到目標值。
 * 畫法：renderMotorAssembly 畫進離屏畫布，再以 0.8 倍縮放貼到 (100,40)（底部 y 524–600 留給 I／N／B／轉速四格面板）。
 *   高速時用「殘影」：同一幀把快門 1/60 s 內的數個轉角各畫一次後等權平均（靜止部位不受影響、電樞變成模糊的殘影）。
 * 轉角：老師模式以固定步長 1/240 s 預先積分查表（跳步驟、暫停、重播同一 t 同一畫面）；學生模式依 pwrState 即時積分。
 *
 * ── 場景步驟表 motor-power「極速馬達」，共 40 s（老師模式自動示範；示範時暫改 pwrState 與三個滑桿）──
 *   1 基準      8 s  I=2、N=1、B=2（頁面預設）；顯示轉速與 rpm
 *   2 加電流 I  8 s  I 於 1.2／2.2／3.2 s 由 2 → 3 → 4 → 5；I 格與電池發亮、▲ 箭頭；F = I×L×B 變大
 *   3 加匝數 N  8 s  N 於 1.2／2.2／3.2／4.2 s 由 1 → 5；N 格與線圈發亮（轉太快時只亮面板）
 *   4 加強 B    8 s  B 於 1.2／2.2／3.2 s 由 2 → 5；B 格與兩塊場磁鐵發亮（磁場箭頭由頁面隨 B 變亮）
 *   5 全滿      8 s  I=N=B=5：頂端閃爍「🔥 極速運轉中！」；三格全亮；殘影最明顯
 * 學生模式（MotorAnim.ctl.onEnd 不是函式）＝練習：畫面一律照目前 pwrState 即時畫，滑桿一動（頁面 updatePower → practice()）
 *   就重畫並把剛改的那一格高亮 3 s；步驟鈕＝「套用該步的數值」（同步滑桿後呼叫頁面 updatePower）。
 * 離開老師模式／deactivate：pwrState 還原為 {i:2,n:1,b:2}，同步滑桿與結果框。
 */
(function () {
  'use strict';
  window.MotorAnim = window.MotorAnim || {};
  const MA = window.MotorAnim;

  const W = 1000;
  const FONT = "'Noto Sans TC',sans-serif";
  const CHALK = '#f2ecd9';
  const SC = 0.8, OX = 100, OY = 40;                     // 馬達圖縮放與位置
  const TAU_ACC = 0.45;                                    // 加速延遲（s）
  const SHUTTER = 1 / 60;                                  // 殘影快門（s）
  const DT = 1 / 240;                                      // 預先積分步長
  const BASE = { i: 2, n: 1, b: 2 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pulse = (t, k) => 0.5 + 0.5 * Math.sin(t * (k || 4));
  const teacher = () => !!(MA.ctl && typeof MA.ctl.onEnd === 'function');
  const mp = p => ({ x: OX + SC * p.x, y: OY + SC * p.y });

  // ───────── 頁面公式（照 drawMotorPowerLessonCanvas，不改） ─────────
  const speedOf = f => .008 + Math.pow(f / 125, 1.38) * 1.62;
  const rpmOf = sp => Math.round(180 + sp * 7900);
  const OMEGA_MAX = speedOf(125) * 60;
  function levelOf(f) {
    let zh = '微弱', col = C.muted;
    if (f > 50) { zh = '🔥 狂暴極速'; col = C.red; }
    else if (f > 25) { zh = '高速'; col = C.cyan; }
    else if (f > 10) { zh = '中等'; col = C.yellow; }
    const en = f > 50 ? '🔥 maximum' : f > 25 ? 'high' : f > 10 ? 'medium' : 'low';
    return { text: currentLang === 'en' ? en : zh, col };
  }

  // ═════════ 步驟表 ═════════
  // ramp：[參數, 起值, 終值]，第 m 次 +1 發生在 tl = 1.2 + m 秒
  const STEPS = [
    { d: 8, b: ['基準', 'Baseline'], v: { i: 2, n: 1, b: 2 }, hl: [],
      cap: () => tr('1. 基準：I = 2、N = 1、B = 2，馬達慢慢轉', '1. Baseline: I = 2, N = 1, B = 2, the motor turns slowly'),
      res: () => tr('基準：I = 2、N = 1、B = 2。', 'Baseline: I = 2, N = 1, B = 2. ') },
    { d: 8, b: ['加電流 I', 'More I'], v: { i: 5, n: 1, b: 2 }, ramp: ['i', 2, 5], hl: ['i'],
      cap: () => tr('2. 只加大電流 I（換更高電壓的電池）：F = I×L×B 變大', '2. Increase only the current I (higher-voltage battery): F = I×L×B grows'),
      res: () => tr('<strong class="accent-cyan">增加電流 (I)</strong>：換上更高電壓的電池，F = I×L×B 跟著變大。',
                    '<strong class="accent-cyan">Increase current (I)</strong>: a higher current increases F = I×L×B. ') },
    { d: 8, b: ['加匝數 N', 'More N'], v: { i: 5, n: 5, b: 2 }, ramp: ['n', 1, 5], hl: ['n'],
      cap: () => tr('3. 再增加線圈匝數 N：好幾倍的受力同時推動電樞', '3. Add coil turns N: more turns add the forces from multiple wire segments'),
      res: () => tr('<strong class="accent-cyan">增加線圈匝數 (N)</strong>：相當於好幾倍的受力同時推動電樞。',
                    '<strong class="accent-cyan">Increase coil turns (N)</strong>: more turns add the forces from multiple wire segments. ') },
    { d: 8, b: ['加強 B', 'Stronger B'], v: { i: 5, n: 5, b: 5 }, ramp: ['b', 2, 5], hl: ['b'],
      cap: () => tr('4. 再增強場磁鐵 B：換上強力釹鐵硼磁鐵', '4. Increase field strength B: stronger magnets give a stronger field'),
      res: () => tr('<strong class="accent-green">增強場磁鐵 (B)</strong>：換上強力釹鐵硼磁鐵。',
                    '<strong class="accent-green">Increase field strength (B)</strong>: stronger magnets provide a stronger external field. ') },
    { d: 8, b: ['全滿', 'All max'], v: { i: 5, n: 5, b: 5 }, hl: ['i', 'n', 'b'], fire: true,
      cap: () => tr('5. 三項全滿：電樞快到幾乎看不清楚', '5. All three at maximum: almost impossible to track'),
      res: () => '' }
  ];
  const STARTS = []; let TOTAL = 0;
  STEPS.forEach(s => { STARTS.push(TOTAL); TOTAL += s.d; });
  function stepAt(t) { let k = 0; while (k + 1 < STARTS.length && t >= STARTS[k + 1]) k++; return k; }
  function valsAt(t) {                                      // 老師示範：時間 t 的 I、N、B
    const k = stepAt(t), st = STEPS[k], tl = t - STARTS[k], v = Object.assign({}, k ? STEPS[k - 1].v : st.v);
    if (st.ramp) { const [p, a, b] = st.ramp; v[p] = clamp(a + Math.max(0, Math.floor(tl - 1.2) + 1), a, b); }
    else Object.assign(v, st.v);
    return v;
  }
  function lastTick(t) {                                    // 本步最近一次 +1 的時刻（tl），沒有就 null
    const k = stepAt(t), st = STEPS[k], tl = t - STARTS[k];
    if (!st.ramp || tl < 1.2) return null;
    const m = Math.min(Math.floor(tl - 1.2), st.ramp[2] - st.ramp[1] - 1);
    return 1.2 + m;
  }
  // 預先積分：ω 一階延遲追目標、角度積分
  const NT = Math.ceil(TOTAL / DT) + 2;
  const TA = new Float64Array(NT), TW = new Float64Array(NT);
  (function () {
    const v0 = STEPS[0].v; let w = speedOf(v0.i * v0.n * v0.b) * 60, a = 0.45;
    const k = 1 - Math.exp(-DT / TAU_ACC);
    for (let j = 0; j < NT; j++) {
      TA[j] = a; TW[j] = w;
      const v = valsAt(Math.min(j * DT, TOTAL - 1e-6)), target = speedOf(v.i * v.n * v.b) * 60;
      w += (target - w) * k; a += w * DT;
    }
  })();
  function tableAt(arr, t) {
    const x = clamp(t, 0, (NT - 1) * DT) / DT, j = Math.floor(x), u = x - j;
    return j + 1 < NT ? arr[j] + (arr[j + 1] - arr[j]) * u : arr[NT - 1];
  }

  // ───────── 文字工具 ─────────
  function textW(ctx, s, size) { ctx.save(); ctx.font = `900 ${size}px ${FONT}`; const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function text(ctx, s, x, y, col, align, size) {          // 新字串（已用 tr）直接畫，不經 CANVAS_EN
    ctx.save(); ctx.fillStyle = col; ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
    ctx.fillText(s, x, y); ctx.restore();
  }
  function wrapLines(ctx, s, maxW, size) {
    ctx.save(); ctx.font = `900 ${size}px ${FONT}`;
    const out = []; let line = '';
    const toks = currentLang === 'en' ? s.split(/(\s+)/) : Array.from(s);
    toks.forEach(tk => {
      const test = line + tk;
      if (line && ctx.measureText(test.trim()).width > maxW) { out.push(line.trim()); line = tk.trimStart(); }
      else line = test;
    });
    if (line.trim()) out.push(line.trim());
    if (out.length === 2) {                                 // 兩行時平均分配
      const half = ctx.measureText(s).width / 2 + size * 1.6;
      const bal = []; let l2 = '';
      toks.forEach(tk => { const test = l2 + tk; if (l2 && !bal.length && ctx.measureText(test.trim()).width > Math.min(maxW, half)) { bal.push(l2.trim()); l2 = tk.trimStart(); } else l2 = test; });
      if (l2.trim()) bal.push(l2.trim());
      if (bal.length === 2 && bal.every(x => ctx.measureText(x).width <= maxW)) { ctx.restore(); return bal; }
    }
    ctx.restore(); return out;
  }
  // 頂端說明帶（x 155–845；最多兩行，蓋 0–40 或 0–70：馬達圖頂端 0.8 倍後 y 40–70 是空白）
  function band(ctx, s, col, fireOn) {
    const size = 23;
    const lines = wrapLines(ctx, s, 690, size).slice(0, 2);
    if (fireOn) lines.unshift(null);
    const two = lines.length > 1;
    ctx.save(); ctx.fillStyle = C.canvas; ctx.fillRect(0, 0, W, two ? 72 : 40); ctx.restore();
    const ys = two ? [22, 54] : [22];
    lines.slice(0, 2).forEach((l, k) => {
      if (l === null) { if (fireOn === 'on') label(ctx, '🔥 極速運轉中！', 500, ys[k], C.red, 'center', 28); }
      else text(ctx, l, 500, ys[k], col || CHALK, 'center', size);
    });
  }

  // ───────── 離屏圖與殘影合成 ─────────
  // 電樞／轉軸／分裂環掃過的範圍（頁面座標）：殘影只在這塊合成，其餘部位維持高解析
  const BLUR = { x: 215, y: 70, w: 570, h: 455 };
  let off = null, offCtx = null, lo = null, loCtx = null, acc = null, accCtx = null;
  function ensureOff() {
    if (off) return;
    off = document.createElement('canvas'); off.width = 2000; off.height = 1200; offCtx = off.getContext('2d');
    lo = document.createElement('canvas'); lo.width = BLUR.w * 2; lo.height = BLUR.h * 2; loCtx = lo.getContext('2d');
    acc = document.createElement('canvas'); acc.width = BLUR.w * 2; acc.height = BLUR.h * 2; accCtx = acc.getContext('2d');
  }
  // angles：快門內由新到舊的轉角。最新一個以高解析畫整張；多於一個時，
  // 只在電樞掃過的範圍（同樣 2 倍解析）把各轉角等權平均（running average）後貼回＝殘影。
  function drawMotor(ctx, angles, v) {
    ensureOff();
    const opt = { turns: v.n, fieldStrength: v.b, showCurrent: false };
    ctx.save(); ctx.fillStyle = C.canvas; ctx.fillRect(0, 0, W, 600); ctx.restore();
    offCtx.setTransform(2, 0, 0, 2, 0, 0);
    renderMotorAssembly(offCtx, angles[0], opt);
    ctx.drawImage(off, 0, 0, 2000, 1200, OX, OY, W * SC, 600 * SC);
    if (angles.length < 2) return;
    accCtx.setTransform(1, 0, 0, 1, 0, 0); accCtx.globalAlpha = 1;
    for (let j = angles.length - 1, n = 0; j >= 0; j--, n++) {
      accCtx.globalAlpha = 1 / (n + 1);
      if (j === 0) { accCtx.drawImage(off, 2 * BLUR.x, 2 * BLUR.y, 2 * BLUR.w, 2 * BLUR.h, 0, 0, acc.width, acc.height); continue; }
      loCtx.setTransform(2, 0, 0, 2, -2 * BLUR.x, -2 * BLUR.y);
      renderMotorAssembly(loCtx, angles[j], opt);
      accCtx.drawImage(lo, 0, 0);
    }
    accCtx.globalAlpha = 1;
    ctx.drawImage(acc, 0, 0, acc.width, acc.height, OX + SC * BLUR.x, OY + SC * BLUR.y, SC * BLUR.w, SC * BLUR.h);
  }
  function shutterAngles(a, w) {
    const sweep = Math.abs(w) * SHUTTER, n = clamp(Math.ceil(sweep / 0.35) + 1, 1, 5);
    if (sweep < 0.06) return [a];
    const out = []; for (let j = 0; j < n; j++) out.push(a - sweep * j / (n - 1));
    return out;
  }

  // ───────── 圖上強調 ─────────
  // 發光：以數層由粗到細的半透明描邊代替 shadowBlur（軟體繪圖時 shadowBlur 很耗時）
  function glowStroke(ctx, build, col, alpha, width) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    [[width + 14, 0.12], [width + 7, 0.22], [width, 1]].forEach(([lw, al]) => {
      ctx.globalAlpha = alpha * al; ctx.lineWidth = lw; ctx.beginPath(); build(); ctx.stroke();
    });
    ctx.restore();
  }
  function glowRect(ctx, x, y, w, h, col, tl, alpha) {
    glowStroke(ctx, () => ctx.roundRect(x, y, w, h, 12), col, alpha * (0.6 + 0.4 * pulse(tl, 5)), 4);
  }
  function emphasize(ctx, keys, tl, a, w, alpha) {
    if (alpha <= 0) return;
    if (keys.includes('i')) {                               // 電池（頁面座標 x 340–440、y 505–567）
      const p = mp({ x: 340, y: 502 });
      glowRect(ctx, p.x, p.y, 100 * SC, 60 * SC, C.cyan, tl, alpha);
    }
    if (keys.includes('b')) {                               // 兩塊場磁鐵（drawMagnetPrism 55／800, 155, 145×285, 深 24）
      [55, 800].forEach(x0 => { const p = mp({ x: x0 - 8, y: 123 }); glowRect(ctx, p.x, p.y, 185 * SC, 330 * SC, C.green, tl, alpha); });
    }
    if (keys.includes('n') && Math.abs(w) < 9) {            // 線圈外框（轉太快就不畫，免得閃爍）
      const c = Math.cos(a), s = Math.sin(a), R = 172;
      const q = [[R * c, R * s, -200], [R * c, R * s, 220], [-R * c, -R * s, 220], [-R * c, -R * s, -200]]
        .map(p => mp(structProject(p[0], p[1], p[2])));
      glowStroke(ctx, () => { q.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); },
        C.orange, alpha * (0.55 + 0.45 * pulse(tl, 5)), 4);
    }
  }

  // ───────── 底部面板：I／N／B 三格＋轉速 ─────────
  const PARAMS = [
    { k: 'i', zh: '⚡ 電流強度', sym: 'I', col: () => C.cyan },
    { k: 'n', zh: '🧻 線圈圈數', sym: 'N', col: () => C.orange },
    { k: 'b', zh: '🧲 磁場強度', sym: 'B', col: () => C.green }
  ];
  const PY = 524, PH = 74;
  function tri(ctx, x, y, s, col) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.9, y + s * 0.6); ctx.lineTo(x - s * 0.9, y + s * 0.6); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
  function panel(ctx, v, hl, tl, w, force) {
    ctx.save(); ctx.fillStyle = C.canvas; ctx.fillRect(0, PY - 4, W, 600 - PY + 4); ctx.restore();
    PARAMS.forEach((P, j) => {
      const x = 6 + j * 246, bw = 240, on = hl[P.k], col = P.col();
      ctx.save();
      ctx.fillStyle = on ? 'rgba(255,243,106,0.10)' : 'rgba(242,236,217,0.05)';
      ctx.strokeStyle = on ? C.yellow : 'rgba(242,236,217,0.22)'; ctx.lineWidth = on ? 3 : 1.5;
      ctx.beginPath(); ctx.roundRect(x, PY, bw, PH, 10); ctx.fill(); ctx.stroke(); ctx.restore();
      if (on) glowStroke(ctx, () => ctx.roundRect(x, PY, bw, PH, 10), C.yellow, 0.35 + 0.35 * pulse(tl, 5), 2);
      let lab = currentLang === 'en' ? (EN[P.zh] || P.zh) : P.zh;
      if (textW(ctx, lab, 22) > bw - 22) lab = lab.replace(/^\S+\s/, '');
      text(ctx, lab, x + 11, PY + 20, on ? col : CHALK, 'left', 22);
      // 刻度條：5 格
      for (let s = 0; s < 5; s++) {
        const filled = s < v[P.k], fresh = on && on.fresh && s === v[P.k] - 1;
        ctx.save();
        ctx.fillStyle = filled ? (fresh ? '#ffffff' : col) : 'rgba(242,236,217,0.16)';
        ctx.globalAlpha = filled ? (on || hl.all ? 1 : 0.75) : 1;
        ctx.fillRect(x + 11 + s * 22, PY + 46, 18, 18); ctx.restore();
      }
      text(ctx, `${P.sym} = ${v[P.k]}`, x + 130, PY + 55, on ? col : CHALK, 'left', 24);
      if (on && on.dir) {                                   // 小箭頭 ▲／▼
        const yy = PY + 55 + (on.dir > 0 ? -1 : 1) * 3 * pulse(tl, 7);
        ctx.save(); ctx.globalAlpha = 0.65 + 0.35 * pulse(tl, 7);
        if (on.dir > 0) tri(ctx, x + 218, yy, 10, C.yellow);
        else { ctx.translate(x + 218, yy); ctx.rotate(Math.PI); tri(ctx, 0, 0, 10, C.yellow); }
        ctx.restore();
      }
    });
    // 轉速格
    const x = 744, bw = 250, lv = levelOf(force), sp = Math.abs(w) / 60, rpm = rpmOf(sp);
    const hot = force > 50;
    ctx.save();
    ctx.fillStyle = hot ? 'rgba(255,111,118,0.12)' : 'rgba(242,236,217,0.05)';
    ctx.strokeStyle = hot ? C.red : 'rgba(242,236,217,0.35)'; ctx.lineWidth = hot ? 3 : 1.5;
    ctx.beginPath(); ctx.roundRect(x, PY, bw, PH, 10); ctx.fill(); ctx.stroke(); ctx.restore();
    if (hot) glowStroke(ctx, () => ctx.roundRect(x, PY, bw, PH, 10), C.red, 0.35 + 0.35 * pulse(tl, 8), 2);
    text(ctx, `${tr('轉速', 'Speed')} ≈ ${rpm} rpm`, x + 11, PY + 20, CHALK, 'left', 22);
    const bx = x + 11, by = PY + 47, bL = 80;
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.16)'; ctx.fillRect(bx, by, bL, 16);
    ctx.fillStyle = lv.col;
    ctx.fillRect(bx, by, Math.max(2, bL * clamp(Math.abs(w) / OMEGA_MAX, 0, 1)), 16); ctx.restore();
    text(ctx, lv.text, x + 100, PY + 55, lv.col, 'left', 22);
  }

  // ───────── 結果框 ─────────
  let lastResult = '';
  function setResult(html) {
    if (html === lastResult) return;
    lastResult = html;
    const el = document.getElementById('motorPowerResult'); if (el) el.innerHTML = html;
  }
  function speedSentence(force, full) {                    // 頁面 drawMotorPowerLessonCanvas 原句
    const sp = speedOf(force), rpm = rpmOf(sp), lv = levelOf(force);
    const tail = full ? tr('三項全滿時，電樞快到幾乎看不清楚。', ' At maximum settings the armature becomes almost impossible to track.') : '';
    return currentLang === 'en'
      ? `Simulated speed: <strong style="color:${lv.col}">${lv.text}</strong> (about ${rpm} rpm).${tail}`
      : `模擬轉速：<strong style="color:${lv.col}">${lv.text}</strong>（約 ${rpm} rpm）。${tail}`;
  }
  function practiceSentence(v) {                           // 頁面 updatePower 原句＋rpm；未全滿時接頁面原提示
    const force = v.i * v.n * v.b, lv = levelOf(force), rpm = rpmOf(speedOf(force)), full = force === 125;
    return currentLang === 'en'
      ? `Combined force F = I×L×B. Current speed: <strong style="color:${lv.col}">${lv.text}</strong> (about ${rpm} rpm)${full ? '. At maximum settings the armature becomes almost impossible to track.' : '. Try maximizing every value!'}`
      : `綜合受力 F = I×L×B。目前轉速：<strong style="color:${lv.col}">${lv.text}</strong>（約 ${rpm} rpm）${full ? '。三項全滿時，電樞快到幾乎看不清楚。' : '。請試著把所有數值拉到最大！'}`;
  }

  // ───────── pwrState／滑桿同步 ─────────
  const SLID = { i: 'pwrCurrent', n: 'pwrTurns', b: 'pwrMagnet' };
  function writeState(v) {
    ['i', 'n', 'b'].forEach(k => {
      if (pwrState[k] !== v[k]) pwrState[k] = v[k];
      const el = document.getElementById(SLID[k]); if (el && String(el.value) !== String(v[k])) el.value = String(v[k]);
    });
  }
  function restoreBase() {                                  // 離開老師模式／deactivate：還原頁面預設並同步結果框
    if (!S.touched) return;
    S.touched = false;
    writeState(BASE);
    S.prev = { i: BASE.i, n: BASE.n, b: BASE.b }; S.change = null; S.preset = 0;
    if (typeof updatePower === 'function') updatePower();
  }

  // ═════════ 播放器（單一 RAF） ═════════
  const S = { on: false, t: 0, raf: 0, last: 0, step: -1, timer: 0, endFired: false, drawn: false, wasTeacher: false,
    touched: false, sAng: 0.45, sW: 0, prev: null, change: null, clock: 0, preset: 0 };

  function canvasCtx() { const c = document.getElementById('motorPowerCanvas'); return c ? c.getContext('2d') : null; }
  function curVals() { return { i: pwrState.i | 0 || 1, n: pwrState.n | 0 || 1, b: pwrState.b | 0 || 1 }; }
  function drawProgress(ctx, t) {
    ctx.save(); ctx.fillStyle = 'rgba(242,236,217,0.14)'; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W * clamp(t / TOTAL, 0, 1), 6);
    ctx.fillStyle = C.canvas; STARTS.slice(1).forEach(s => ctx.fillRect(W * s / TOTAL - 2, 0, 4, 6));
    ctx.restore();
  }

  function renderTeacher(ctx) {
    const t = S.t, k = stepAt(t), st = STEPS[k], tl = t - STARTS[k];
    const v = valsAt(t), force = v.i * v.n * v.b;
    S.touched = true; writeState(v);
    const a = tableAt(TA, t), w = tableAt(TW, t);
    pwrState.angle = ((a % TAU) + TAU) % TAU;
    drawMotor(ctx, shutterAngles(a, w), v);
    const tick = lastTick(t), fresh = tick != null && tl - tick < 0.6;
    const hl = {}; st.hl.forEach(p => { hl[p] = { dir: st.ramp ? 1 : 0, fresh }; });
    if (st.fire) hl.all = true;
    emphasize(ctx, st.hl, tl, a, w, clamp(tl / 0.6, 0, 1));
    panel(ctx, v, hl, tl, w, force);
    band(ctx, st.cap(), CHALK, st.fire ? ((tl % 0.8) < 0.55 ? 'on' : 'off') : null);
    drawProgress(ctx, t);
    if (k !== S.step) { S.step = k; updateUI(); }
    setResult(st.fire ? speedSentence(force, true) : st.res() + speedSentence(force, false));
  }

  function renderStudent(ctx) {
    const v = curVals(), force = v.i * v.n * v.b, tl = S.clock;
    const a = S.sAng, w = S.sW;
    drawMotor(ctx, shutterAngles(a, w), v);
    const hl = {}; let keys = [];
    const ch = S.change, age = ch ? S.clock - ch.at : 99;
    if (ch && age < 3) { ch.keys.forEach(p => { hl[p] = { dir: ch.dir[p], fresh: age < 0.6 }; }); keys = ch.keys; }
    const pr = S.preset ? STEPS[S.preset - 1] : null;
    if (pr && pr.fire) hl.all = true;
    emphasize(ctx, keys, tl, a, w, ch ? clamp(1.5 - age / 2, 0, 1) : 0);
    panel(ctx, v, hl, tl, w, force);
    const fireOn = force > 50 ? ((tl % 0.8) < 0.55 ? 'on' : 'off') : null;
    band(ctx, pr ? pr.cap() : tr('練習：拖動下方三個滑桿，請試著把所有數值拉到最大！', 'Practice: drag the three sliders below and try maximizing every value!'), CHALK, fireOn);
    if (S.step !== S.preset - 1) { S.step = S.preset - 1; updateUI(); }
    setResult(practiceSentence(v));
  }

  function render() {
    const ctx = canvasCtx(); if (!ctx || !S.on) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    if (teacher()) renderTeacher(ctx); else renderStudent(ctx);
    S.drawn = true;
  }
  function updateUI() {
    const row = document.getElementById('steps-power');
    if (row) row.querySelectorAll('.step-btn').forEach((b, k) => b.classList.toggle('active', k === S.step));
  }
  function jumpTo(k) {
    if (!S.on) return;
    if (teacher()) {
      S.t = STARTS[k] + 1e-4; S.step = -1; S.last = 0; S.endFired = false;
      render(); start();
    } else {                                                // 學生模式：套用該步的數值（同步滑桿，走頁面 updatePower）
      const v = STEPS[k].v;
      ['i', 'n', 'b'].forEach(p => { const el = document.getElementById(SLID[p]); if (el) el.value = String(v[p]); });
      S.preset = k + 1;
      if (typeof updatePower === 'function') updatePower(); else MA.power.practice();
      // 第 4、5 步數值相同：強調該步的那一項
      if (STEPS[k].hl.length && !STEPS[k].fire) {
        const keys = STEPS[k].hl.slice(), dir = {}; keys.forEach(p => { dir[p] = 1; });
        S.change = { keys, dir, at: S.clock };
      }
      S.step = -1; render(); start();
    }
  }
  function buildButtons() {
    const row = document.getElementById('steps-power'); if (!row) return;
    row.innerHTML = '';
    STEPS.forEach((st, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'step-btn' + (k === S.step ? ' active' : '');
      b.textContent = `${k + 1} ${tr(st.b[0], st.b[1])}`;
      b.addEventListener('click', () => jumpTo(k));
      row.appendChild(b);
    });
  }
  function visible() { const c = document.getElementById('motorPowerCanvas'); return !!(c && c.getClientRects().length && c.getBoundingClientRect().width > 0); }

  function frame(ts) {
    S.raf = 0;
    if (!S.on || document.hidden) return;
    if (!visible()) { S.last = 0; S.timer = setTimeout(() => { S.timer = 0; start(); }, 250); return; }
    const isT = teacher();
    if (isT !== S.wasTeacher) {                             // 模式切換（保險：頁面通常會重新 activate）
      S.wasTeacher = isT;
      if (!isT) { restoreBase(); S.sW = speedOf(BASE.i * BASE.n * BASE.b) * 60; }
      S.t = 0; S.step = -1; S.endFired = false; S.drawn = false; lastResult = ''; buildButtons();
    }
    const paused = isT && !!(MA.ctl && MA.ctl.paused);
    const dt = S.last ? Math.min(0.1, (ts - S.last) / 1000) : 0;
    S.last = ts;
    let frozen = paused;
    if (isT) {
      if (!paused) S.t += dt;
      if (S.t >= TOTAL) { S.t = TOTAL - 1e-3; frozen = frozen || S.endFired; if (!S.endFired) { S.endFired = true; MA.ctl.onEnd(); } }
    } else {
      S.t = (S.t + dt) % TOTAL; S.clock += dt;
      const v = curVals(), target = speedOf(v.i * v.n * v.b) * 60;
      S.sW += (target - S.sW) * (1 - Math.exp(-dt / TAU_ACC));
      S.sAng = (S.sAng + S.sW * dt) % (TAU * 1000);
      pwrState.angle = ((S.sAng % TAU) + TAU) % TAU;
    }
    if (!(frozen && S.drawn)) render();
    S.raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!S.on || S.raf || S.timer || document.hidden) return;
    S.last = 0; S.raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0;
    if (S.timer) clearTimeout(S.timer); S.timer = 0;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (S.on) start(); });

  MA.power = {
    activate(sceneId) {
      stop();
      S.on = true; S.t = 0; S.step = -1; S.last = 0; S.endFired = false; S.drawn = false; lastResult = '';
      S.wasTeacher = teacher();
      if (!S.wasTeacher) restoreBase();                     // 剛離開老師模式：還原頁面預設
      const v = curVals();
      S.prev = { i: v.i, n: v.n, b: v.b }; S.change = null; S.preset = 0; S.clock = 0;
      S.sW = speedOf(v.i * v.n * v.b) * 60;
      buildButtons(); render(); start();
    },
    deactivate() {
      stop();
      if (!S.on) return;
      S.on = false; S.step = -1;
      const row = document.getElementById('steps-power'); if (row) row.innerHTML = '';
      restoreBase();
    },
    relang() {
      if (!S.on) return;
      lastResult = '';
      buildButtons(); S.step = -1; S.drawn = false; render(); start();
    },
    // 頁面 updatePower() 結尾呼叫：學生模式立刻依新 pwrState 重畫、更新結果框（這裡不可呼叫 updatePower）
    practice() {
      if (!S.on || teacher()) return;
      const v = curVals(), p = S.prev || v, keys = [], dir = {};
      ['i', 'n', 'b'].forEach(k => { if (v[k] !== p[k]) { keys.push(k); dir[k] = v[k] > p[k] ? 1 : -1; } });
      if (keys.length) S.change = { keys, dir, at: S.clock };
      S.prev = { i: v.i, n: v.n, b: v.b };
      if (S.preset) { const pv = STEPS[S.preset - 1].v; if (pv.i !== v.i || pv.n !== v.n || pv.b !== v.b) S.preset = 0; }
      lastResult = '';
      render(); start();
    },
    _frameAt(t) { if (!S.on) return null; S.t = t; render(); return TOTAL; },
    _info() { return { 'motor-power': { total: TOTAL, starts: STARTS.slice() } }; },
    _state() { return { scene: S.on ? 'motor-power' : null, t: S.t, step: S.step, running: !!S.raf, vals: { i: pwrState.i, n: pwrState.n, b: pwrState.b } }; }
  };
})();

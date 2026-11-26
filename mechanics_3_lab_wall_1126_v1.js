/* mechanics_3_lab_wall_1126_v1.js — 「動手做｜牆上冰箱：推力要多大？」實驗台（#wallLabCanvas，邏輯 960×540，2x 高解析）
 *
 * 契約：window.W5Lab.wall = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab5 最後（所有 .sub-view 之後），並注入 <style id="lab-wall-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）、window.M3（共用畫法：牆、冰箱、March、力箭頭）。
 *
 * 物理（以規格為準，不自己發明）：
 *   冰箱 50 kgw 被 March 壓在牆上（March 左、冰箱中、牆右）。滑桿「牆面推力 F」0～150 kgw，步進 5。
 *   正向力（牆給冰箱，綠 ←）＝ F；重力（粉 ↓）＝ 50 kgw；
 *   最大靜摩擦力 f_max ＝ F ÷ 2（平地測得：推力(正向力) 50 → 最大靜摩擦 25，比例 1:2）；
 *   實際摩擦力（珊瑚 ↑，畫在冰箱與牆之間）＝ min(重力 50, f_max)。
 *   f_max ≥ 50（即 F ≥ 100）：冰箱靜止，結果框綠色「摩擦力達標，成功靜止！」。
 *   F < 100：冰箱沿牆下滑並掉到地面，結果框「摩擦力極限不足，掉落！」；下滑時摩擦力顯示 f_max 的值（示意）。
 *   掉落後滑桿鎖住（冰箱已在地上），按「↺ 重來」把冰箱放回牆上、推力回到 150。
 * 箭頭長度 ∝ kgw：1 px ＝ 1 kgw（箭身每 25 kgw 一道刻痕＝圖例 1 格）。
 * 動畫只在冰箱下滑時跑 RAF，靜止就停；離開分頁（deactivate）或 document.hidden 就停。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'wall', TAB = 'tab5';
  const W = 960, H = 540, DPR = 2, TAU = Math.PI * 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  const COL = {
    bg: '#0d201a', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6', red: '#ff6b6b'
  };

  /* ═════════ 常數 ═════════ */
  const WEIGHT = 50;                        /* 冰箱重力 kgw */
  const FMAX = 150, FSTEP = 5, FDEF = 150;  /* 推力滑桿 */
  const NEED = WEIGHT * 2;                  /* f_max ≥ 50 ⇔ F ≥ 100 */
  const K = 1;                              /* 箭頭 px／kgw */
  const TICK = 25;                          /* 刻痕 kgw ＝ 圖例 1 格 */
  const GY = 455;                           /* 地面線 */
  const FR_X0 = 320, FR_W = 150, FR_H = 210, WALL_X = FR_X0 + FR_W, FR_CX = FR_X0 + FR_W / 2;
  const BY0 = 335;                          /* 冰箱靜止在牆上時的底面 y（離地 120 px） */
  const DROP = GY - BY0;                    /* 下滑總距離 */
  const MARCH_X = FR_X0 - 65, MARCH_SC = 0.5;
  const PUSH_Y = GY - (471 - 172) * MARCH_SC;   /* March 手的高度（touch_ready：腳底列 471、手在 172） ≈ 305 */

  /* ═════════ 小工具 ═════════ */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function font(size) { return '700 ' + size + 'px "Noto Sans TC","JetBrains Mono",sans-serif'; }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const fmt = v => String(Math.round(v * 10) / 10);

  /* ═════════ 狀態與物理 ═════════ */
  const S = {
    on: false, raf: 0, last: 0, visible: true,
    F: FDEF,                 /* 牆面推力 kgw */
    drop: 0, v: 0,           /* 冰箱已下滑的距離 px、速度 px/s */
    fallen: false,           /* 已經開始掉了（F 曾經 < 100） */
    landed: false,           /* 已掉到地面 */
    debug: false, boxes: [], actions: 0, note: 'start'
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null, imgTimer = 0;

  const fmaxOf = () => S.F / 2;                                  /* 最大靜摩擦力 ＝ 正向力的一半 */
  const fricOf = () => Math.min(WEIGHT, fmaxOf());               /* 實際摩擦力 ＝ min(重力, f_max)；下滑時 ＝ f_max（< 50） */
  const holds = () => fmaxOf() >= WEIGHT;                        /* 摩擦力達標？ */

  /* ═════════ 文字 ═════════ */
  function label(c, s, x, y, color, size, align) {
    size = size || 22; align = align || 'center';
    c.save(); c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(s).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(11,26,21,0.92)'; c.strokeText(s, x, y);
    c.fillStyle = color || COL.white; c.fillText(s, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    if (S.debug) S.boxes.push({ s, x0, y0: y - size * 0.6, x1: x0 + w, y1: y + size * 0.6, size });
    return w;
  }
  /* 量字寬；太寬就縮字（最小 20px），回傳實際字級 */
  function fitSize(c, s, size, maxW) {
    c.save();
    while (size > 20) { c.font = font(size); if (c.measureText(s).width <= maxW) break; size -= 1; }
    c.restore(); return size;
  }
  function pill(c, s, x, y, color, size, maxW) {
    size = fitSize(c, s, size || 22, (maxW || 460) - 28);
    c.save(); c.font = font(size);
    const w = c.measureText(s).width + 28, h = size + 16; c.restore();
    c.save(); c.fillStyle = 'rgba(11,26,21,0.92)'; rr(c, x, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = color; c.stroke(); c.restore();
    const dbg = S.debug; S.debug = false; label(c, s, x + 14, y, color, size, 'left'); S.debug = dbg;
    if (S.debug) S.boxes.push({ s, x0: x, y0: y - h / 2, x1: x + w, y1: y + h / 2, size });
    return size;
  }

  /* ═════════ 畫面 ═════════ */
  function intelCard(c) {
    const l1 = T('前置情報：平地推動極限測試：推力(正向力) 50 → 最大靜摩擦 25',
      'Intel: floor push test: push (normal force) 50 → max static friction 25');
    const l2 = T('最大靜摩擦力是正向力的一半 (1:2)', 'Max static friction is half the normal force (1:2)');
    c.save(); c.fillStyle = 'rgba(11,26,21,0.88)'; rr(c, 20, 14, 920, 86, 14); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = 'rgba(246,243,234,0.45)'; c.stroke(); c.restore();
    const s1 = fitSize(c, l1, 22, 880);
    label(c, l1, 480, 41, COL.white, s1, 'center');
    label(c, l2, 480, 73, COL.yellow, 24, 'center');
  }

  function drawForces(c, by) {
    const ft = by - FR_H, cy = ft + FR_H / 2, F = S.F, f = fricOf();
    const o = { k: K, tick: TICK, lab: null };
    /* 正向力：牆給冰箱，綠，←，長度 ＝ F（作用在冰箱右側接觸面） */
    M3.force(c, Object.assign({ x: WALL_X, y: ft + 30, dir: 'left', val: F, col: COL.green }, o));
    /* 推力：March 的手推冰箱，青，→（高度跟著 March 的手，不隨冰箱下滑） */
    M3.force(c, Object.assign({ x: FR_X0, y: PUSH_Y, dir: 'right', val: F, col: COL.teal }, o));
    /* 重力：粉，↓，從冰箱中心 */
    M3.force(c, Object.assign({ x: FR_CX, y: cy, dir: 'down', val: WEIGHT, col: COL.pink }, o));
    /* 摩擦力：珊瑚，↑，畫在冰箱與牆之間（貼著接觸面） */
    M3.force(c, Object.assign({ x: WALL_X - 12, y: cy, dir: 'up', val: f, col: COL.coral }, o));
  }

  function drawTable(c) {
    const F = S.F, fm = fmaxOf(), f = fricOf(), x = 490;
    const rows = [
      [COL.teal, T('→ 推力 F ＝ ', '→ Push F = ') + fmt(F) + ' kgw'],
      [COL.green, T('← 正向力 N ＝ ', '← Normal force N = ') + fmt(F) + ' kgw'],
      [COL.coral, T('↑ 摩擦力 f ＝ ', '↑ Friction f = ') + fmt(f) + ' kgw' + (S.fallen ? T('（下滑中）', ' (sliding)') : '')],
      [COL.coral, T('最大靜摩擦 f_max ＝ F ÷ 2 ＝ ', 'Max static f_max = F ÷ 2 = ') + fmt(fm) + ' kgw'],
      [COL.pink, T('↓ 重力 ＝ ', '↓ Weight = ') + WEIGHT + ' kgw']
    ];
    rows.forEach((r, i) => pill(c, r[1], x, 148 + i * 48, r[0], 22, 450));
  }

  function render() {
    if (!ctx) return;
    const c = ctx; S.boxes = [];
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    if (!window.M3) { label(c, '…', 480, 270, COL.dim, 22, 'center'); return; }
    M3.backdrop(c, { gy: GY, y0: 110, glow: COL.teal, gx: 400 });
    M3.ground(c, GY);
    M3.wall(c, WALL_X, 110, GY, 'right', { w: W - WALL_X });
    const by = BY0 + S.drop;
    /* March：推著冰箱；冰箱掉了就換成嚇到的樣子 */
    if (S.fallen) M3.march(c, 'shocked_full', MARCH_X, GY, { sc: 0.46 });
    else M3.march(c, 'touch_ready', MARCH_X, GY, { sc: MARCH_SC });
    M3.fridge(c, FR_CX, by, FR_W, FR_H, { handle: 'left' });
    drawForces(c, by);
    drawTable(c);
    intelCard(c);
    M3.legend(c, 30, 505, TICK * K, TICK, 1, 'kgw');
  }

  /* ═════════ 迴圈（冰箱還在下滑才跑） ═════════ */
  function frame(now) {
    S.raf = 0;
    if (!S.on || document.hidden || !S.visible) return;
    const dt = Math.min(0.033, Math.max(0, (now - S.last) / 1000)); S.last = now;
    if (S.fallen && !S.landed) {
      /* 摩擦力越小滑得越快（示意：加速度隨 (重力 − 摩擦力) 變大） */
      const a = 150 + 750 * (1 - fricOf() / WEIGHT);
      S.v += a * dt; S.drop += S.v * dt;
      if (S.drop >= DROP) { S.drop = DROP; S.v = 0; S.landed = true; updateResult(); syncLock(); }
    }
    render();
    if (S.fallen && !S.landed) S.raf = requestAnimationFrame(frame);
  }
  function sync() {
    const want = S.on && S.visible && !document.hidden && S.fallen && !S.landed;
    if (want && !S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
    else if (!want && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
  }

  /* ═════════ 操作 ═════════ */
  function setF(v, note) {
    if (S.fallen) return;                                   /* 已經掉了：先按重來 */
    S.F = clamp(Math.round(v / FSTEP) * FSTEP, 0, FMAX);
    S.note = note || 'set'; S.actions++;
    if (!holds()) { S.fallen = true; S.landed = false; S.v = 0; syncLock(); }
    syncSliders(); updateResult(); render(); sync();
  }
  function reset() {
    S.F = FDEF; S.drop = 0; S.v = 0; S.fallen = false; S.landed = false; S.note = 'reset'; S.actions++;
    syncSliders(); syncLock(); updateResult(); render(); sync();
  }

  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const row = document.createElement('div'); row.className = 'lab-row lab-srow';
    const nm = document.createElement('span'); nm.className = 'lab-name'; nm.textContent = T('牆面推力 F', 'Push on wall F');
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = 0; inp.max = FMAX; inp.step = FSTEP;
    inp.value = S.F; inp.id = KEY + 'Slider'; inp.setAttribute('aria-label', T('牆面推力 F（kgw）', 'Push on the wall F (kgw)'));
    const val = document.createElement('span'); val.className = 'lab-val'; val.id = KEY + 'Val'; val.textContent = fmt(S.F) + ' kgw';
    inp.addEventListener('input', () => setF(+inp.value, 'slider'));
    row.append(nm, inp, val); ctrl.appendChild(row);
    const br = document.createElement('div'); br.className = 'lab-row lab-brow';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.dataset.act = 'reset';
    b.textContent = T('↺ 重來', '↺ Try again'); b.addEventListener('click', reset);
    br.appendChild(b); ctrl.appendChild(br);
    syncLock();
  }
  function syncSliders() {
    const inp = document.getElementById(KEY + 'Slider'), val = document.getElementById(KEY + 'Val');
    if (inp) inp.value = S.F; if (val) val.textContent = fmt(S.F) + ' kgw';
  }
  function syncLock() {
    const inp = document.getElementById(KEY + 'Slider'); if (inp) inp.disabled = !!S.fallen;
  }
  function updateUI() {
    if (cv) cv.setAttribute('aria-label', T('牆上冰箱實驗台：用滑桿調整牆面推力，看冰箱會不會往下滑',
      'Fridge-on-a-wall bench: use the slider to set the push on the wall and see whether the fridge slides down'));
    updateResult();
  }
  function updateResult() {
    if (!res) return;
    const fm = fmaxOf(), f = fricOf();
    const big = S.fallen
      ? T('<span class="lw-bad">❌ 摩擦力極限不足，掉落！</span>', '<span class="lw-bad">❌ Friction limit too small, it falls!</span>')
      : T('<span class="lw-ok">✅ 摩擦力達標，成功靜止！</span>', '<span class="lw-ok">✅ Friction is enough, it stays put!</span>');
    const small = T(
      `摩擦力 f ＝ ${fmt(f)} kgw　f_max ＝ ½ × 正向力 ＝ ${fmt(fm)} kgw　重力 ＝ ${WEIGHT} kgw`,
      `Friction f = ${fmt(f)} kgw   f_max = ½ × normal force = ${fmt(fm)} kgw   Weight = ${WEIGHT} kgw`);
    res.innerHTML = `<div class="lw-big">${big}</div><div class="lt-t">${small}</div>`;
  }

  const onVis = () => sync();

  /* ═════════ 介面契約 ═════════ */
  function bind() {
    cv = document.getElementById(KEY + 'LabCanvas');
    ctrl = document.getElementById(KEY + 'LabControls');
    res = document.getElementById(KEY + 'LabResult');
    if (cv) ctx = cv.getContext('2d');
  }
  /* March 圖載入是非同步的：載完再補畫一次 */
  function waitImages() {
    if (!window.M3 || !M3.preload) return;
    M3.preload(['touch_ready', 'shocked_full']);
    let n = 0; clearInterval(imgTimer);
    imgTimer = setInterval(() => {
      n++;
      if ((M3.marchImg('touch_ready') && M3.marchImg('shocked_full')) || n > 60) { clearInterval(imgTimer); imgTimer = 0; if (!S.raf) render(); }
    }, 100);
  }
  function activate() {
    if (S.on) deactivate();
    bind(); if (!cv) return;
    S.on = true; S.visible = true;
    buildControls(); updateUI(); waitImages();
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
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
  }
  function relang() {
    const desk = document.getElementById('lab-' + KEY);
    if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    bind(); buildControls(); updateUI(); render();
  }
  function _state() {
    return {
      F: S.F, fmax: fmaxOf(), friction: fricOf(), weight: WEIGHT, holds: holds(), fallen: S.fallen, landed: S.landed,
      drop: +S.drop.toFixed(2), v: +S.v.toFixed(2), running: !!S.raf, on: S.on, actions: S.actions, note: S.note,
      sliderDisabled: !!(document.getElementById(KEY + 'Slider') || {}).disabled, boxes: S.boxes.slice()
    };
  }

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-wall.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column;width:100%}
#lab-wall h2{order:0;font-size:32px;font-weight:700;color:#4dd2ff;margin:0 0 4px;line-height:1.35}
#lab-wall .lab-sub{order:1;font-size:22px;line-height:1.5;margin:0 0 12px;color:#f6f3ea}
#lab-wall .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-wall canvas{display:block;width:100%;height:auto;outline:none}
#lab-wall .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-wall .result-box>div+div{margin-top:4px}
#lab-wall .lw-big{font-size:26px;font-weight:700}
#lab-wall .lw-ok{color:#33cc99}#lab-wall .lw-bad{color:#ff8040}
#lab-wall .lab-tip{order:4;font-size:22px;line-height:1.5;margin:8px 0 0;color:#a3b8b0}
#lab-wall .lab-controls{order:5;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-wall .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
#lab-wall .lab-srow{min-height:36px;flex-wrap:nowrap}
#lab-wall .lab-brow{min-height:44px;margin-top:2px}
#lab-wall .lab-name{font-size:22px;font-weight:700;min-width:7.6em;color:#4dd2ff}
#lab-wall .lab-val{font-family:"JetBrains Mono",monospace;font-size:22px;font-weight:700;min-width:5.6em;text-align:right;color:#f6f3ea}
#lab-wall input[type=range]{flex:1 1 auto;min-width:0;height:36px;margin:0;background:transparent;cursor:pointer;touch-action:none;-webkit-appearance:none;appearance:none}
#lab-wall input[type=range]:disabled{opacity:.4;cursor:not-allowed}
#lab-wall input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:5px;background:rgba(246,243,234,.28)}
#lab-wall input[type=range]::-moz-range-track{height:10px;border-radius:5px;background:rgba(246,243,234,.28)}
#lab-wall input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:34px;height:34px;margin-top:-12px;border-radius:50%;background:#4dd2ff;border:3px solid #0b1a15;box-shadow:0 0 0 2px #f6f3ea}
#lab-wall input[type=range]::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:#4dd2ff;border:3px solid #0b1a15;box-shadow:0 0 0 2px #f6f3ea}
#lab-wall .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 18px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-wall .lab-btn:hover{border-color:#ffe066}
#lab-wall .lt-t{color:#a3b8b0}
@media (max-width:640px){#lab-wall.lab-desk{padding:12px 12px 14px}#lab-wall h2{font-size:26px}#lab-wall .lw-big{font-size:22px}#lab-wall .lab-srow{flex-wrap:wrap}#lab-wall .lab-name{min-width:0;width:100%}#lab-wall input[type=range]{flex:1 1 150px}}
`;
  function inject() {
    if (document.getElementById('lab-' + KEY)) { bind(); return; }
    const host = document.getElementById(TAB); if (!host) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
    const tz = '動手做｜牆上冰箱：推力要多大？', te = 'Try it | Fridge on a Wall: How Hard Must You Push?';
    const sz = '50 kgw 的冰箱被 March 壓在牆上。先猜猜看：推力至少要多少，冰箱才不會滑下來？再把滑桿往小調調看。',
      se = 'March presses a 50 kgw fridge against a wall. First guess: how much push at least keeps it from sliding down? Then lower the slider and see.';
    const kz = '冰箱掉下去後，按「↺ 重來」把它放回牆上再試一次。', ke = 'Once the fridge has fallen, press the ↺ Try again button to put it back on the wall.';
    d.innerHTML =
      `<h2 data-zh="${tz}" data-en="${te}">${T(tz, te)}</h2>` +
      `<div class="lab-sub" data-zh="${sz}" data-en="${se}">${T(sz, se)}</div>` +
      `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" style="touch-action:pan-y;width:100%"></canvas></div>` +
      `<div class="result-box" id="${KEY}LabResult"></div>` +
      `<div class="lab-tip" data-zh="${kz}" data-en="${ke}">${T(kz, ke)}</div>` +
      `<div class="lab-controls" id="${KEY}LabControls"></div>`;
    host.appendChild(d);
    bind(); buildControls(); updateUI(); waitImages(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!S.raf) render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = { activate, deactivate, relang, _state, _debug(on) { S.debug = !!on; render(); return S.boxes.slice(); } };
})();

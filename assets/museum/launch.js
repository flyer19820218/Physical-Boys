// 開場：滿版煙霧裡浮出歡迎詞，煙霧往外散開後，露出 3D 場景（太空梭以光速飛進星球）。
// 只用 2D canvas 畫煙霧（約 46 團，事先畫好 4 種煙團貼圖），3D 還在載入時也能先動。
const TXT = {
  zh: { l1: '歡迎搭乘光速太空梭', l2: '來到<b>伽利略星球</b>', wait: '引擎啟動中', ready: '準備好了！', board: '登機中', goBtn: '🚀 出發！', go: '出發！', warp: '太空梭目前正穿越蟲洞', warpGo: '穿越成功！', skip: '跳過' },
  en: { l1: 'Welcome aboard the light-speed shuttle', l2: 'to <b>Galileo Planet</b>', wait: 'Starting engines', ready: 'Ready!', board: 'Boarding', goBtn: '🚀 Lift off!', go: 'Lift off!', warp: 'The shuttle is crossing a wormhole', warpGo: 'Wormhole cleared!', skip: 'Skip' },
};

function makePuff(rgb, seed) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  let r = seed;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.7) * 62;
    const cx = 128 + Math.cos(a) * d, cy = 128 + Math.sin(a) * d * 0.8, rr = 34 + rnd() * 58;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, `rgba(${rgb},0.30)`);
    g.addColorStop(0.55, `rgba(${rgb},0.14)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g;
    x.beginPath(); x.arc(cx, cy, rr, 0, Math.PI * 2); x.fill();
  }
  // 邊緣淡出，煙團之間才不會有硬邊
  x.globalCompositeOperation = 'destination-in';
  const m = x.createRadialGradient(128, 128, 40, 128, 128, 128);
  m.addColorStop(0, 'rgba(255,255,255,1)');
  m.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = m;
  x.fillRect(0, 0, S, S);
  return c;
}

// ---------- 蟲洞：用 2D canvas 畫「時空漩渦」 ----------
// 時空漩渦：斜著看的漏斗（等高圈、倒轉時鐘環、4 條螺旋臂、被吸進去的光點），中央是發亮的喉口。
// 太空梭機頭永遠朝著前進的切線方向，繞約 2.6 圈、一圈比一圈小地轉進喉口。出洞時加速、閃光。
const TAU = Math.PI * 2;
export const WARP_MS = 4200;          // 蟲洞段長度（有旁白時以旁白時間表為準，與 build_narration.py 的 WARP_MIN 一致）
const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

function drawFlash(ctx, W, H, p) {
  if (p <= 0) return;
  const fl = p < 0.45 ? Math.pow(p / 0.45, 1.5) * 0.95 : 0.95 * Math.pow(1 - (p - 0.45) / 0.55, 1.6);
  if (fl <= 0.003) return;
  ctx.fillStyle = `rgba(228,252,250,${fl})`;
  ctx.fillRect(0, 0, W, H);
}

export function makeWarp(warpMs) {
  const TILT = 0.66;                // 漩渦斜著看：橢圓的扁度（1＝正上方俯視）
  const TURNS = 2.6;                // 太空梭繞幾圈才進去（2～3 圈意思意思）
  const PARTS = 150;
  const parts = [];
  const spawn = (pt, first) => {
    pt.r = first ? Math.random() : 0.75 + Math.random() * 0.25; // 以 Rmax 為 1
    pt.a = Math.random() * TAU;
    pt.h = [175, 190, 48, 300, 265][(Math.random() * 5) | 0];
    pt.px = pt.py = null;
  };
  for (let j = 0; j < PARTS; j++) { const pt = {}; spawn(pt, true); parts.push(pt); }

  // 太空梭（從上方看、機鼻朝向隧道盡頭）：和星球上那台同一組顏色——米白機身、黃色腰帶、藍色駕駛艙、翼尖黃與薄荷綠
  function shuttle(ctx, x, y, u, roll, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(roll);
    // 尾焰（在機身後面，朝向觀眾）
    ctx.globalCompositeOperation = 'lighter';
    for (const dx of [-0.2, 0, 0.2]) {
      const fx = dx * u, fy = 0.78 * u, fr = u * (0.5 + glow * 0.22);
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
      g.addColorStop(0, 'rgba(255,243,196,0.95)');
      g.addColorStop(0.4, 'rgba(85,233,255,0.55)');
      g.addColorStop(1, 'rgba(85,233,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(fx, fy, fr, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    const INK = 'rgba(11,26,21,0.9)', lw = Math.max(1, u * 0.035);
    const poly = (pts, fill, stroke) => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * u, py * u) : ctx.moveTo(px * u, py * u)));
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
    };
    poly([[0.3, -0.12], [1.28, 0.55], [1.28, 0.74], [0.34, 0.5]], '#e6e0d0', INK);      // 右翼
    poly([[-0.3, -0.12], [-1.28, 0.55], [-1.28, 0.74], [-0.34, 0.5]], '#e6e0d0', INK);  // 左翼
    poly([[1.28, 0.55], [1.28, 0.74], [1.12, 0.72], [1.12, 0.58]], '#f2d675');           // 翼尖：黃
    poly([[-1.28, 0.55], [-1.28, 0.74], [-1.12, 0.72], [-1.12, 0.58]], '#a8e6cf');       // 翼尖：薄荷綠
    poly([[-0.15, 0.55], [0.15, 0.55], [0.12, 0.7], [-0.12, 0.7]], '#4a5a52', INK);      // 噴嘴座
    ctx.fillStyle = '#f2ecd9'; ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineJoin = 'round';
    ctx.beginPath();                                                                      // 機身：尖尖的機鼻到寬寬的尾端
    ctx.moveTo(0, -1.3 * u);
    ctx.quadraticCurveTo(0.34 * u, -0.7 * u, 0.34 * u, -0.1 * u);
    ctx.lineTo(0.34 * u, 0.56 * u); ctx.lineTo(-0.34 * u, 0.56 * u); ctx.lineTo(-0.34 * u, -0.1 * u);
    ctx.quadraticCurveTo(-0.34 * u, -0.7 * u, 0, -1.3 * u);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-0.335 * u, 0.12 * u, 0.67 * u, 0.13 * u);                                // 黃色腰帶
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.ellipse(0, -0.62 * u, 0.15 * u, 0.24 * u, 0, 0, TAU); ctx.fill(); ctx.stroke(); // 駕駛艙窗
    ctx.restore();
  }

  // tau：進蟲洞後的秒數；w：漩渦淡入 0→1；p：出洞進度 0→1；dt：秒
  return function draw(ctx, W, H, tau, w, p, dt) {
    const hyp = Math.hypot(W, H), big = Math.max(W, H);
    const wt = w * (p < 0.4 ? 1 : 1 - smooth((p - 0.4) / 0.45));
    if (wt <= 0.003) { drawFlash(ctx, W, H, p); return; }
    const cx = W / 2, cy = H * 0.55;
    const Rmax = Math.min(W * 0.44, H * 0.58);
    const rc = big * 0.04;                    // 喉口（入口）的半徑
    const sp = 1 + 7 * p * p;                 // 出洞時一切加速
    const E = (r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r * TILT]; // 圓 → 斜看的橢圓

    ctx.save();
    // 背景：中心偏紫、外圍深黛綠（不用純黑）
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    bg.addColorStop(0, `rgba(84,66,160,${0.95 * wt})`);
    bg.addColorStop(0.3, `rgba(26,48,84,${0.95 * wt})`);
    bg.addColorStop(1, `rgba(11,26,21,${wt})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // 漏斗的等高圈：越靠近中心越密越亮，虛線跟著旋轉（越裡面轉越快）
    for (let k = 1; k <= 9; k++) {
      const f = k / 9, r = rc + (Rmax - rc) * Math.pow(f, 1.7);
      const h = 175 + 145 * (0.5 + 0.5 * Math.sin(k * 0.8 + tau * 1.1));
      const al = wt * (0.22 + 0.55 * Math.pow(1 - f, 1.3)) * Math.min(1, tau / 0.6);
      ctx.strokeStyle = `hsla(${h},88%,64%,${al})`;
      ctx.lineWidth = 1.2 + 3.2 * (1 - f);
      ctx.setLineDash([r * 0.5, r * 0.28]);
      ctx.lineDashOffset = -tau * sp * (30 + 140 * (1 - f));
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * TILT, 0, 0, TAU); ctx.stroke();
    }
    ctx.setLineDash([]);

    // 時鐘環：三圈刻度，朝反方向慢慢轉（時間倒流的感覺）
    for (const [fr, dir] of [[0.5, -1], [0.78, 1], [1.02, -1]]) {
      const r = rc + (Rmax - rc) * Math.pow(fr, 1.2), a0 = dir * tau * 0.5 * sp;
      ctx.strokeStyle = `hsla(48,95%,80%,${wt * 0.75 * Math.min(1, tau / 0.8)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const ang = a0 + k * TAU / 12, [x1, y1] = E(r * (k % 3 === 0 ? 0.9 : 0.95), ang), [x2, y2] = E(r * 1.0, ang);
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }

    // 螺旋臂：4 條對數螺線，整個漩渦朝同一個方向轉
    for (let arm = 0; arm < 4; arm++) {
      const h = [175, 265, 300, 48][arm];
      for (let seg = 0; seg < 36; seg++) {
        const r1 = rc + (Rmax * 1.02 - rc) * (seg / 36), r2 = rc + (Rmax * 1.02 - rc) * ((seg + 1) / 36);
        const th = arm * TAU / 4 + 2.4 * Math.log(r1 / rc + 1) - tau * 0.9 * sp;
        const th2 = arm * TAU / 4 + 2.4 * Math.log(r2 / rc + 1) - tau * 0.9 * sp;
        const [x1, y1] = E(r1, th), [x2, y2] = E(r2, th2), f = seg / 36;
        ctx.strokeStyle = `hsla(${h},85%,70%,${wt * 0.5 * (1 - f) * Math.min(1, tau / 0.9)})`;
        ctx.lineWidth = 1 + 4 * (1 - f);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }

    // 被吸進去的光點：沿螺線往中心掉，越近越快
    for (const q of parts) {
      const f = Math.min(1, Math.max(0, q.r));
      q.r -= dt * sp * (0.05 + 0.5 * Math.pow(1 - f, 2.2));
      q.a += dt * sp * (0.5 + 3.2 * Math.pow(1 - f, 1.6));
      if (q.r <= rc / Rmax * 0.6) { spawn(q, false); continue; }
      const [x, y] = E(q.r * Rmax, q.a);
      if (q.px != null) {
        ctx.strokeStyle = `hsla(${q.h},85%,78%,${wt * Math.min(1, 0.25 + (1 - f)) * 0.9})`;
        ctx.lineWidth = 0.8 + 2.2 * (1 - f);
        ctx.beginPath(); ctx.moveTo(q.px, q.py); ctx.lineTo(x, y); ctx.stroke();
      }
      q.px = x; q.py = y;
    }

    // 太空梭：機頭永遠朝著前進的切線方向，繞 TURNS 圈、一圈比一圈小地轉進喉口
    const T = Math.max(1, warpMs / 1000);
    const u = Math.min(1, tau / T);
    const path = uu => {
      const r = Rmax * 0.94 * Math.pow(1 - uu, 1.15), a = 3.3 + TAU * TURNS * Math.pow(uu, 1.45);
      const [x, y] = E(r, a);
      return [x, y, r, a];
    };
    const [sx, sy, sr, sa] = path(u);
    const vis = smooth(tau / 0.5) * smooth((1 - u) / 0.1) * wt;     // 剛進來淡入、到喉口時縮小消失
    if (vis > 0.01) {
      // 尾跡：沿著走過的路，漸漸變淡
      for (let k = 26; k >= 1; k--) {
        const u1 = Math.max(0, u - k * 0.009), u2 = Math.max(0, u - (k - 1) * 0.009);
        const [x1, y1] = path(u1), [x2, y2] = path(u2), f = 1 - k / 26;
        ctx.strokeStyle = `hsla(${190 - 140 * f},95%,72%,${vis * 0.65 * f * f})`;
        ctx.lineWidth = Math.max(1, big * 0.006 * f);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      const [nx, ny] = path(Math.min(1, u + 0.004)), [mx, my] = path(Math.max(0, u - 0.004));
      const heading = Math.atan2(ny - my, nx - mx) + Math.PI / 2;      // 機身的「上」＝機頭，轉到前進方向
      const near = 0.28 + 0.72 * (sr / (Rmax * 0.94));
      const size = big * 0.046 * near * (1 + 0.2 * Math.sin(sa));      // 越靠近喉口越小；在畫面下側（離我們近）稍大
      ctx.save();
      ctx.globalAlpha = Math.min(1, vis * 1.2);
      shuttle(ctx, sx, sy, size, heading, 0.5 + 0.5 * Math.sin(tau * 11));
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
    }

    // 喉口：發亮的入口，邊緣一圈亮環（出洞時膨脹）
    const gr = big * (0.085 + 0.012 * Math.sin(tau * 6)) * (1 + 7 * p * p);
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
    core.addColorStop(0, `rgba(240,253,255,${0.95 * wt})`);
    core.addColorStop(0.35, `rgba(120,235,255,${0.5 * wt})`);
    core.addColorStop(1, 'rgba(85,233,255,0)');
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.ellipse(cx, cy, gr, gr * Math.max(TILT, 0.8), 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(210,250,255,${0.85 * wt})`;
    ctx.lineWidth = 2.5 + 2 * Math.sin(tau * 8);
    ctx.beginPath(); ctx.ellipse(cx, cy, rc * (1 + 3 * p * p), rc * TILT * (1 + 3 * p * p), 0, 0, TAU); ctx.stroke();
    ctx.restore();

    drawFlash(ctx, W, H, p);
  };
}

export function startLaunch({ lang = 'zh', minMs = 3200 } = {}) {
  const root = document.getElementById('launch');
  if (!root) return null;
  const t = TXT[lang] || TXT.zh;
  root.querySelector('.l1').textContent = t.l1;
  root.querySelector('.l2').innerHTML = t.l2;
  const status = root.querySelector('.launch-status .st');
  status.textContent = t.wait;
  const skipBtn = root.querySelector('#launchSkip');
  const goBtn = root.querySelector('#launchGo');
  skipBtn.textContent = t.skip;
  const capEl = root.querySelector('.warp-cap .cap-t');
  root.setAttribute('aria-label', t.l1 + ' ' + t.l2.replace(/<[^>]+>/g, ''));
  root.hidden = false;
  document.body.classList.add('launching');

  const cv = root.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const dpr = 0.5; // 煙霧本來就是糊的：用一半解析度畫再放大，省很多力氣
  let W = 1, H = 1;
  function resize() {
    W = Math.max(1, root.clientWidth);
    H = Math.max(1, root.clientHeight);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const tex = [makePuff('242,236,217', 11), makePuff('190,226,218', 29), makePuff('159,214,205', 47), makePuff('246,243,234', 83)];
  const puffs = [];
  for (let i = 0; i < 46; i++) {
    puffs.push({
      a: Math.random() * Math.PI * 2,
      d: 0.12 + Math.pow(Math.random(), 0.6) * 0.95,
      s: 0.45 + Math.random() * 0.55,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.25,
      va: (Math.random() - 0.5) * 0.06,
      tex: tex[i % 4],
      al: 0.55 + Math.random() * 0.45,
      delay: Math.random() * 0.6,
    });
  }

  const start = performance.now();
  let lastT = start, partT = 0, raf = 0, done = false;
  let warpT = 0, warpMs = WARP_MS, warpDraw = null;
  let resolveDone;
  const donePromise = new Promise(r => { resolveDone = r; });
  let resolveMin;
  const minShown = new Promise(r => { resolveMin = r; });
  setTimeout(() => resolveMin(), minMs);
  // 歡迎詞淡入完成的時間點：3D 場景在這之後才開始建（建的時候畫面會停一下，這時文字已經靜止，比較不明顯）
  const textShown = new Promise(r => setTimeout(r, 1900));

  function draw(now) {
    raf = 0;
    if (done) return;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const tau = (now - start) / 1000;
    const p = partT ? Math.min(1, (now - partT) / (warpT ? 1500 : 1300)) : 0;
    const w = warpT ? smooth((now - warpT) / 900) : 0; // 蟲洞隧道淡入（煙霧同時淡出）
    ctx.clearRect(0, 0, W, H);
    const baseA = (partT ? Math.pow(1 - p, 2) : 1) * (1 - w);
    if (baseA > 0.002) {
      const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, `rgba(36,68,59,${baseA})`);
      g.addColorStop(0.55, `rgba(23,45,39,${baseA})`);
      g.addColorStop(1, `rgba(11,26,21,${baseA})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    const hd = Math.hypot(W, H) * 0.5, big = Math.max(W, H);
    for (const q of puffs) {
      const inA = Math.min(1, Math.max(0, (tau - q.delay) / 1.1));
      q.rot += q.vr * dt;
      q.a += q.va * dt;
      const push = 1 + 2.6 * p * p, grow = (0.8 + 0.2 * inA) * (1 + 1.4 * p);
      const x = W / 2 + Math.cos(q.a) * q.d * hd * push;
      const y = H / 2 + Math.sin(q.a) * q.d * hd * 0.82 * push;
      const sz = q.s * big * 0.62 * grow;
      const a = q.al * 0.4 * inA * Math.pow(1 - p, 1.6) * (q.d < 0.32 ? 0.45 : 1) * (1 - w);
      if (a <= 0.003) continue;
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(q.rot);
      ctx.drawImage(q.tex, -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (warpT) {
      const wtau = (now - warpT) / 1000;
      warpDraw(ctx, W, H, wtau, w, p, dt);
    }
    if (partT && !warpT && p < 0.35) { // 衝出煙霧的一下閃光
      ctx.fillStyle = `rgba(200,245,240,${0.2 * Math.sin(Math.PI * p / 0.35)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (p >= 1) { finish(); return; }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('show')));

  function finish() {
    if (done) return;
    done = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    root.hidden = true;
    root.classList.remove('show', 'go', 'parting', 'warping', 'warp-go');
    resolveDone();
  }

  let onSkipCb = null;
  skipBtn.addEventListener('click', () => { if (onSkipCb) onSkipCb(); else finish(); });

  return {
    minShown,
    textShown,
    done: donePromise,
    // 先顯示「出發！」，delay 毫秒後煙霧散開；散開的那一刻呼叫 onStart（讓 3D 開始飛）
    part(onStart, delay = 400) {
      if (partT || done) return donePromise;
      root.classList.remove('counting');
      if (warpT) { capEl.textContent = t.warpGo; root.classList.add('warp-go'); } // 在蟲洞裡：大字改成「穿越成功！」，閃光衝出去
      else { status.textContent = t.go; root.classList.add('go'); }
      const go = () => {
        if (done) return;
        partT = performance.now();
        root.classList.add('parting');
        if (onStart) onStart();
      };
      if (delay > 0) setTimeout(go, delay); else go();
      return donePromise;
    },
    // 有旁白時：顯示「出發」按鈕，等使用者按（聲音一定要等使用者按一下才能播）。onTap 在點擊當下直接呼叫
    showGo(onTap) {
      if (done) return;
      status.textContent = t.ready;
      root.classList.add('ready');
      goBtn.textContent = t.goBtn;
      goBtn.hidden = false;
      goBtn.onclick = () => {
        goBtn.hidden = true;
        goBtn.onclick = null;
        root.classList.remove('ready');
        status.textContent = t.board;
        if (onTap) onTap();
      };
      requestAnimationFrame(() => { try { goBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } });
    },
    // 穿越蟲洞：歡迎詞退場，畫面切進時空隧道（煙霧淡出）。ms＝預計停留多久。重複呼叫沒有作用
    warp(ms) {
      if (warpT || partT || done) return;
      warpMs = Math.max(1500, ms || WARP_MS);
      warpDraw = makeWarp(warpMs);
      capEl.textContent = t.warp;
      warpT = performance.now();
      root.classList.remove('ready', 'counting');
      goBtn.hidden = true;
      root.classList.add('warping');
    },
    // （舊版）倒數：中央的大字（3、2、1）
    count(text) {
      if (done) return;
      status.textContent = text;
      root.classList.remove('counting');
      void root.offsetWidth; // 重新觸發彈跳動畫
      root.classList.add('counting');
    },
    skip: finish,
    onSkip(cb) { onSkipCb = cb; },
  };
}

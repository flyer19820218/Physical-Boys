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

// ---------- 蟲洞：用 2D canvas 畫「時空隧道」 ----------
// 一串往觀眾衝過來的光環（螺旋亮弧＋偶爾夾一個倒轉的時鐘環）、中央往外噴的光束、盡頭的亮光，
// 隧道會左右彎曲、整體慢慢旋轉；太空梭（背面剪影）在隧道裡搖擺前進。出洞時加速、閃光。
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

function makeWarp() {
  const N = 22, Z = 6.2, ZN = 0.13;
  const lines = [];
  for (let j = 0; j < 72; j++) lines.push({ a: Math.random() * TAU, q: Math.random(), v: 0.5 + Math.random() * 0.9, h: [175, 190, 48, 300][j % 4] });
  let dist = 0;

  function bend(z, tau, W, H) {
    const f = Math.min(1, Math.max(0, (z - ZN) / Z));
    return [W / 2 + Math.sin(tau * 0.8 + z * 0.55) * W * 0.11 * f, H / 2 + Math.cos(tau * 0.65 + z * 0.45) * H * 0.08 * f];
  }

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

  // tau：進蟲洞後的秒數；w：隧道淡入 0→1；p：出洞進度 0→1；dt：秒
  return function draw(ctx, W, H, tau, w, p, dt) {
    const hyp = Math.hypot(W, H), big = Math.max(W, H);
    const sp = (0.8 + 2.6 * Math.pow(Math.min(1, tau / 2.5), 2)) * (1 + 7 * p * p);
    dist += dt * sp;
    const wt = w * (p < 0.4 ? 1 : 1 - smooth((p - 0.4) / 0.45));
    if (wt <= 0.003) { drawFlash(ctx, W, H, p); return; }
    const [vx, vy] = bend(ZN + Z, tau, W, H);

    ctx.save();
    ctx.globalAlpha = 1;
    // 背景：盡頭偏紫、外圍深黛綠（不用純黑）
    const bg = ctx.createRadialGradient(vx, vy, 0, vx, vy, hyp * 0.62);
    bg.addColorStop(0, `rgba(78,64,150,${0.95 * wt})`);
    bg.addColorStop(0.32, `rgba(26,48,84,${0.95 * wt})`);
    bg.addColorStop(1, `rgba(11,26,21,${wt})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 整個隧道一起慢慢旋轉、輕微搖晃（像在鑽進去）
    ctx.translate(W / 2, H / 2);
    ctx.rotate(tau * 0.1 + Math.sin(tau * 0.9) * 0.05 + p * 0.6);
    ctx.translate(-W / 2, -H / 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // 光環：由遠到近畫（近的蓋在上面）
    const F = hyp * 0.5 * 0.16;
    const order = [];
    for (let i = 0; i < N; i++) {
      const z = ZN + ((((i / N) * Z - dist) % Z) + Z) % Z;
      order.push([z, i]);
    }
    order.sort((a, b) => b[0] - a[0]);
    for (const [z, i] of order) {
      const R = F / z, f = Math.min(1, (z - ZN) / Z);
      const [cx, cy] = bend(z, tau, W, H);
      const a = wt * Math.min(1, (1 - f) * 4) * Math.min(1, (z - ZN) / 0.35);
      if (a <= 0.01) continue;
      const accent = i % 5 === 2;
      const h = accent ? 48 : 175 + 145 * (0.5 + 0.5 * Math.sin(i * 0.6 + tau * 1.2));
      const col = (al, l = 62) => `hsla(${h},${accent ? 95 : 90}%,${accent ? 68 : l}%,${al})`;
      const lw = 1.4 + 13 * Math.min(1, R / (hyp * 0.5));
      ctx.lineWidth = lw;
      ctx.strokeStyle = col(a * 0.22);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = col(a * 0.9);
      const th = tau * 0.9 + i * 0.37 + 0.7 / z;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.arc(cx, cy, R, th + k * 2.0944, th + k * 2.0944 + 1.15); ctx.stroke();
      }
      if (i % 6 === 0) { // 時鐘環：刻度＋倒轉的指針
        ctx.strokeStyle = `hsla(48,95%,80%,${a * 0.85})`;
        ctx.lineWidth = Math.max(1, lw * 0.6);
        ctx.beginPath();
        for (let k = 0; k < 12; k++) {
          const ang = k * TAU / 12, r1 = R * (k % 3 === 0 ? 0.8 : 0.88), r2 = R * 0.96;
          ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
          ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        }
        ctx.stroke();
        const mA = -tau * 9 - i, hA = -tau * 0.75 - i;
        ctx.lineWidth = Math.max(1.5, lw * 0.9);
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(mA) * R * 0.78, cy + Math.sin(mA) * R * 0.78);
        ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(hA) * R * 0.52, cy + Math.sin(hA) * R * 0.52);
        ctx.stroke();
      }
    }

    // 中央往外噴的光束
    for (const L of lines) {
      L.q += dt * L.v * (0.45 + sp * 0.35);
      if (L.q > 1) { L.q -= 1; L.a = Math.random() * TAU; }
      const q = L.q, r0 = hyp * (0.03 + 0.72 * Math.pow(q, 2.2));
      const len = hyp * (0.02 + 0.3 * q * q) * (0.6 + 0.13 * sp);
      const cx = lerp(vx, W / 2, q), cy = lerp(vy, H / 2, q), dx = Math.cos(L.a), dy = Math.sin(L.a);
      const al = wt * q * 0.8 * Math.min(1, tau / 1.2);
      if (al <= 0.01) continue;
      ctx.strokeStyle = `hsla(${L.h},85%,76%,${al})`;
      ctx.lineWidth = 0.7 + 3 * q;
      ctx.beginPath();
      ctx.moveTo(cx + dx * r0, cy + dy * r0);
      ctx.lineTo(cx + dx * (r0 + len), cy + dy * (r0 + len));
      ctx.stroke();
    }
    ctx.restore();

    // 盡頭的亮光（出洞時膨脹）
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gr = big * (0.07 + 0.012 * Math.sin(tau * 6)) * (1 + 7 * p * p);
    const core = ctx.createRadialGradient(vx, vy, 0, vx, vy, gr);
    core.addColorStop(0, `rgba(235,252,255,${0.95 * wt})`);
    core.addColorStop(0.35, `rgba(120,235,255,${0.5 * wt})`);
    core.addColorStop(1, 'rgba(85,233,255,0)');
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(vx, vy, gr, 0, TAU); ctx.fill();
    ctx.restore();

    // 太空梭：隧道裡搖擺前進；出洞時往亮光衝過去
    const sw = Math.min(1, tau / 0.9) * wt;
    if (sw > 0.01) {
      const u0 = big * 0.062 * Math.min(1, 0.55 + hyp / 2600);
      const sx0 = W / 2 + Math.sin(tau * 1.3) * W * 0.025, sy0 = H * 0.66 + Math.cos(tau * 1.7) * H * 0.012;
      const e = smooth(p / 0.7);
      ctx.save();
      ctx.globalAlpha = Math.min(1, sw * 1.2);
      shuttle(ctx, lerp(sx0, vx, e), lerp(sy0, vy, e), u0 * (1 - 0.85 * e), Math.sin(tau * 0.9) * 0.16 + Math.sin(tau * 2.3) * 0.04, 0.5 + 0.5 * Math.sin(tau * 11));
      ctx.restore();
    }

    // 出洞閃光
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
      warpDraw = makeWarp();
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

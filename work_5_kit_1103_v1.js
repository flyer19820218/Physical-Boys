/* ==================================================================
   work_5 ｜ 核能發電 — 共用動畫骨架（Sonnet 寫；Opus 的場景檔只負責 draw）
   ------------------------------------------------------------------
   做的事（AGENTS 10.6）：切入即自動播放、連續循環、最多 5 個步驟鈕（按編號＝從該步重播）、
   畫布頂端一條無文字的細進度條、離開分頁／document.hidden 就停、一次只跑一條 RAF。

   場景檔的寫法：
     W5.register('fission', {
       canvas: 'cvs-fission',          // <canvas id>，內部解析度 960×540
       steps:  [7, 8, 8, 8, 9],        // 每一步秒數（含最後停留），最多 5 步
       draw(c, s) { ... }              // 純函式：同樣的 s 一定畫出同樣的畫面（不累積狀態）
     });
   步驟鈕的 id 一律是 btn-<name>-<n>（n 從 1 起），本檔會自動加／拿掉 .active。
   頁面呼叫：W5.start(name)（進入分頁）、W5.stop(name)、W5.go(name, n)（點步驟鈕）、
            W5.seek(name, 秒)（只畫一格不播放，給檢查用）。
   語言：場景用頁面全域的 tr('中文','English')；語言切換時迴圈本來就每格重畫，不用另外處理。

   draw(c, s) 的 s：
     n 目前步驟 1..N　　N 總步數　　t 迴圈內總秒數　　u 這一步已過幾秒　　d 這一步長度
     p 這一步進度 0..1　k 進場係數 0..1（每步前 0.8 秒緩動，拿來淡入新東西）
     prev 上一步編號（第 1 步的上一步是 N）　since(m) 距離第 m 步開始過了幾秒（可為負）
   ================================================================== */
(function (root) {
  'use strict';

  const W = 960, H = 540, TR = 0.8, TAU = Math.PI * 2;

  /* 黑板色票（AGENTS 2.2）＋ 本單元語意色：質子／正電＝橘、電子＝藍、電流＝紅、能量＝黃 */
  const COL = {
    bg: '#0d201a', panel: '#17332a', deep: '#0b1a15',
    white: '#f6f3ea', dim: '#a3b8b0',
    yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6',
    red: '#ff4d4d', orange: '#fb923c',
    proton: '#ff8040', neutron: '#d9e2dd', electron: '#4dd2ff', current: '#ff4d4d', energy: '#ffe066'
  };

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (u, a, b) => clamp01((u - a) / (b - a));          /* u 秒落在 [a,b] 的 0..1 */
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };  /* 確定性亂數 0..1 */

  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgba(h, a) { const [r, g, b] = hex2rgb(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; }

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function font(size, mono) {
    return '700 ' + size + 'px ' + (mono ? '"JetBrains Mono","Noto Sans TC",monospace' : '"Noto Sans TC","JetBrains Mono",sans-serif');
  }
  function tw(c, str, size, mono) { c.save(); c.font = font(size, mono); const w = c.measureText(str).width; c.restore(); return w; }

  /* 檢查用：W5.debug = true 時，label／pill 會把每一行字的框記進 W5.boxes */
  function note(str, x0, y0, x1, y1, size) { if (api.debug) api.boxes.push({ str, x0, y0, x1, y1, size }); }

  /* 文字：深色描邊讓字壓在線條上也看得見；size 預設 22，畫布上的字不要小於 20（粒子內小標籤 ≥ 16） */
  function label(c, str, x, y, color, size, align, mono) {
    size = size || 22; align = align || 'center';
    c.save(); c.font = font(size, mono); c.textAlign = align; c.textBaseline = 'middle';
    const w = c.measureText(str).width;
    c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(13,32,26,0.92)'; c.strokeText(str, x, y);
    c.fillStyle = color || COL.white; c.fillText(str, x, y); c.restore();
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    note(str, x0, y - size * 0.6, x0 + w, y + size * 0.6, size);
    return w;
  }

  /* 文字＋圓角底板（公式、重點數字用）；回傳外框 */
  function pill(c, str, x, y, color, size, align, mono) {
    size = size || 22; align = align || 'center';
    const w = tw(c, str, size, mono) + 28, h = size + 16;
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    c.save(); c.fillStyle = 'rgba(11,26,21,0.90)'; rr(c, x0, y - h / 2, w, h, h / 2); c.fill();
    c.lineWidth = 2; c.strokeStyle = color || COL.white; c.stroke(); c.restore();
    c.save(); c.font = font(size, mono); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = color || COL.white; c.fillText(str, x0 + w / 2, y); c.restore();
    note(str, x0, y - h / 2, x0 + w, y + h / 2, size);
    return { x: x0, y: y - h / 2, w, h };
  }

  /* 小球（質子、中子、粒子）：有高光的立體感 */
  function ball(c, x, y, r, color) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.08, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.32, color); g.addColorStop(1, mix(color, '#0b1a15', 0.5));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }

  function glow(c, x, y, r, color, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a == null ? 0.8 : a)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }

  function arrow(c, x1, y1, x2, y2, color, lw, head) {
    lw = lw || 4; head = head || 13;
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
    c.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head);
    c.closePath(); c.fill(); c.restore();
  }

  /* ── 控制器 ── */
  const REG = {};
  let activeName = null;

  function stepOf(C, T) {
    let n = C.N;
    for (let i = 0; i < C.N; i++) { if (T < C.bounds[i + 1]) { n = i + 1; break; } }
    return n;
  }

  function render(C) {
    const spec = C.spec, c = C.ctx, T = C.T, n = stepOf(C, T), u = T - C.bounds[n - 1], d = spec.steps[n - 1];
    const s = {
      n, N: C.N, t: T, u, d, p: clamp01(u / d), k: ease(u / TR),
      prev: n === 1 ? C.N : n - 1, W, H,
      since: m => T - C.bounds[m - 1]
    };
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    try { spec.draw(c, s); } catch (e) { c.restore(); throw e; }
    c.restore();
    /* 進度條：整輪的進度，沒有文字 */
    c.save(); c.fillStyle = 'rgba(77,210,255,0.16)'; c.fillRect(0, 0, W, 5);
    c.fillStyle = COL.teal; c.fillRect(0, 0, W * (T / C.total), 5); c.restore();
    if (C.shownStep !== n) {
      C.shownStep = n;
      for (let i = 1; i <= C.N; i++) {
        const b = document.getElementById('btn-' + C.name + '-' + i);
        if (b) b.classList.toggle('active', i === n);
      }
    }
    return s;
  }

  function frame(ts) {
    const C = REG[activeName];
    if (!C || !C.running) return;
    if (document.hidden) { C.raf = 0; return; }
    const dt = C.last ? Math.min(0.1, (ts - C.last) / 1000) : 0;
    C.last = ts; C.T = (C.T + dt) % C.total;
    render(C);
    C.raf = requestAnimationFrame(frame);
  }

  function stopAll() {
    for (const k in REG) { const C = REG[k]; C.running = false; if (C.raf) cancelAnimationFrame(C.raf); C.raf = 0; }
    activeName = null;
  }

  const api = {
    W, H, TR, TAU, COL, debug: false, boxes: [],
    clamp01, ease, lerp, seg, hash, rgba, mix,
    rr, font, tw, label, pill, ball, glow, arrow,

    register(name, spec) {
      if (!spec.steps || spec.steps.length < 1 || spec.steps.length > 5) throw new Error('W5.register: steps 要 1～5 步');
      const bounds = [0]; spec.steps.forEach(d => bounds.push(bounds[bounds.length - 1] + d));
      const canvas = document.getElementById(spec.canvas);
      if (!canvas) { console.warn('W5.register: 找不到畫布 #' + spec.canvas); }
      REG[name] = { name, spec, canvas, ctx: canvas ? canvas.getContext('2d') : null, N: spec.steps.length,
        bounds, total: bounds[bounds.length - 1], T: 0, raf: 0, last: 0, running: false, shownStep: 0 };
    },
    start(name) {
      const C = REG[name]; if (!C || !C.ctx) return;
      stopAll(); activeName = name; C.T = 0; C.last = 0; C.shownStep = 0; C.running = true;
      render(C); C.raf = requestAnimationFrame(frame);
    },
    stop(name) {
      const C = REG[name]; if (!C) return;
      C.running = false; if (C.raf) cancelAnimationFrame(C.raf); C.raf = 0;
      if (activeName === name) activeName = null;
    },
    stopAll,
    go(name, n) {
      const C = REG[name]; if (!C || !C.ctx) return;
      n = Math.max(1, Math.min(C.N, n | 0)); C.T = C.bounds[n - 1] + 0.001; C.last = 0; C.shownStep = 0;
      if (!C.running) { stopAll(); activeName = name; C.running = true; }
      render(C); if (!C.raf) C.raf = requestAnimationFrame(frame);
    },
    seek(name, sec) {            /* 只畫一格、不播放（檢查／截圖用） */
      const C = REG[name]; if (!C || !C.ctx) return null;
      C.T = ((sec % C.total) + C.total) % C.total; C.shownStep = 0; return render(C);
    },
    info(name) { const C = REG[name]; return C ? { N: C.N, bounds: C.bounds.slice(), total: C.total, running: C.running } : null; },
    names() { return Object.keys(REG); }
  };

  document.addEventListener('visibilitychange', () => {
    const C = REG[activeName];
    if (C && C.running && !document.hidden && !C.raf) { C.last = 0; C.raf = requestAnimationFrame(frame); }
  });

  root.W5 = api;
})(window);

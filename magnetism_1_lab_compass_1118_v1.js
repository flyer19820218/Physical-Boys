/* magnetism_1_lab_compass_1118_v1.js — 「自由操作：拖曳指南針」實驗台（#compassLabCanvas，邏輯 1000×600）
 *
 * 背景：11/4 動畫改成「自動播放＋步驟鈕」時，原本可以用手指／滑鼠拖曳指南針的互動被拿掉。
 *      老師 2026-11-18 要求把它加回來：原有內容不變，新增在分頁最下面，讓學生自由操作。
 *
 * 契約：window.MagLab.compass = { activate(), deactivate(), relang(), _state() }
 * 依賴頁面現成的（直接呼叫，不複製、不修改）：
 *   tr、C、TAU、clear、label、getBField、drawCompass、drawMagnet、drawSymmetricFieldLines、currentLang。
 * 控制鈕由本檔建立在 #compassLabControls，說明字寫進 #compassLabResult。
 * 觸控：只有「手指按在指南針上」才擋掉頁面捲動；按在別處照常上下滑。
 */
(function () {
  'use strict';
  window.MagLab = window.MagLab || {};

  const W = 1000, H = 600, DPR = 2;
  const R0 = 40;                // 指南針半徑（邏輯單位；窄螢幕會放大，見 kNow）
  const GRAB0 = 95;             // 抓取半徑（手指比較粗，所以比指南針大）
  const MAX_COMPASS = 6;
  const SPOTS = [{ x: 250, y: 470 }, { x: 750, y: 470 }, { x: 500, y: 480 }, { x: 160, y: 150 }, { x: 840, y: 150 }];
  const FIRST = { x: 500, y: 150 };   // 與原本互動的起始位置相同
  const POLES_N_LEFT = [{ x: 370, y: 300, m: 80000 }, { x: 630, y: 300, m: -80000 }];
  const POLES_N_RIGHT = [{ x: 370, y: 300, m: -80000 }, { x: 630, y: 300, m: 80000 }];

  const S = {
    on: false, visible: false, flip: false, lines: true, tangent: true,
    comps: [], sel: 0, drag: -1, dx: 0, dy: 0, raf: 0, dirty: true, moves: 0, adds: 0
  };
  let cv = null, ctx = null, ctrl = null, res = null, io = null, layer = null, layerKey = '';
  let wired = false;
  // 窄螢幕（手機）整張畫布縮得很小：指南針、字、抓取範圍一起放大
  const kNow = () => { const w = cv ? cv.getBoundingClientRect().width : 1000; return w > 0 && w < 620 ? 1.45 : 1; };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const poles = () => (S.flip ? POLES_N_RIGHT : POLES_N_LEFT);
  const wrapPI = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  const fieldAngle = (x, y) => { const B = getBField(x, y, poles()); return Math.atan2(B.by, B.bx); };

  function resetComps() {
    S.comps = [{ x: FIRST.x, y: FIRST.y, a: fieldAngle(FIRST.x, FIRST.y) }];
    S.sel = 0; S.drag = -1;
  }

  // ───────── CSS（只加一次） ─────────
  function injectCSS() {
    if (document.getElementById('compassLabCSS')) return;
    const st = document.createElement('style'); st.id = 'compassLabCSS';
    st.textContent = [
      '.lab-panel{margin-top:18px;border-color:#fff36a}',
      '.lab-panel h2 .lab-tag{display:inline-block;font-size:16px;padding:2px 10px;margin-left:8px;border-radius:999px;background:#fff36a;color:#11261f;vertical-align:middle}',
      '.lab-panel canvas{cursor:grab}',
      '.lab-panel canvas.dragging{cursor:grabbing}',
      '.lab-controls{display:flex;flex-direction:column;gap:10px;margin:12px 0 4px}',
      '.lab-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.lab-row .lab-name{font-size:16px;font-weight:800;opacity:.75;margin-right:4px}',
      '.lab-btn{min-height:44px;padding:8px 16px;font-size:18px;font-weight:800;font-family:inherit;line-height:1.3;border:2px solid #58736a;border-radius:8px;background:#102d26;color:#f2ecd9;cursor:pointer;touch-action:manipulation}',
      '.lab-btn:hover{border-color:#fff36a}',
      '.lab-btn.active{background:#fff36a;color:#11261f;border-color:#fff36a}',
      '.lab-btn:disabled{opacity:.45;cursor:default}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ───────── 說明文字 ─────────
  function hint() {
    const p = poles();
    const nP = p.find(q => q.m > 0), sP = p.find(q => q.m < 0);
    const c = S.comps[S.sel] || S.comps[0];
    if (!c) return '';
    const dN = Math.hypot(c.x - nP.x, c.y - nP.y), dS = Math.hypot(c.x - sP.x, c.y - sP.y);
    if (S.moves === 0) {
      return tr('👆 <strong>用手指拖曳指南針</strong>，放到磁鐵周圍任何位置。看看紅色 <strong style="color:#ff6f76">N 極</strong>指向哪裡——那就是<strong style="color:#55e9ff">該點的磁場方向</strong>。',
        '👆 <strong>Drag a compass</strong> to any spot around the magnet. Where does the red <strong style="color:#ff6f76">N pole</strong> point? That is the <strong style="color:#55e9ff">field direction at that point</strong>.');
    }
    if (dN < 140 && dN <= dS) {
      return tr('靠近磁鐵的 <strong style="color:#ff6f76">N 極</strong>：同名極互相排斥，所以指南針的紅色 <strong style="color:#ff6f76">N 極</strong>被推開，指向<strong>遠離</strong>磁鐵的方向。',
        'Near the magnet\'s <strong style="color:#ff6f76">N pole</strong>: like poles repel, so the compass\'s red <strong style="color:#ff6f76">N pole</strong> is pushed away and points <strong>away</strong> from the magnet.');
    }
    if (dS < 140) {
      return tr('靠近磁鐵的 <strong style="color:#72b9ff">S 極</strong>：異名極互相吸引，所以指南針的紅色 <strong style="color:#ff6f76">N 極</strong>被吸過去，指向<strong>磁鐵</strong>。',
        'Near the magnet\'s <strong style="color:#72b9ff">S pole</strong>: unlike poles attract, so the compass\'s red <strong style="color:#ff6f76">N pole</strong> is pulled in and points <strong>toward</strong> the magnet.');
    }
    return tr('指南針紅色 <strong style="color:#ff6f76">N 極</strong>所指的方向，就是這一點的<strong style="color:#55e9ff">磁場方向</strong>，也是磁力線的<strong style="color:#fff36a">切線方向</strong>。換個位置再試試！',
      'The direction the compass\'s red <strong style="color:#ff6f76">N pole</strong> points is the <strong style="color:#55e9ff">field direction</strong> here, and it is the <strong style="color:#fff36a">tangent</strong> of the field line. Try another spot!');
  }

  function updateText() { if (res) res.innerHTML = hint(); }

  // ───────── 控制鈕（每群組 ≤5 個） ─────────
  function mkBtn(row, text, onClick, active, disabled) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lab-btn' + (active ? ' active' : '');
    b.textContent = text; b.disabled = !!disabled;
    if (active !== undefined) b.setAttribute('aria-pressed', String(!!active));
    b.addEventListener('click', onClick); row.appendChild(b); return b;
  }
  function row(name) {
    const r = document.createElement('div'); r.className = 'lab-row';
    const n = document.createElement('span'); n.className = 'lab-name'; n.textContent = name; r.appendChild(n);
    ctrl.appendChild(r); return r;
  }
  function buildControls() {
    if (!ctrl) return;
    ctrl.innerHTML = '';
    const r1 = row(tr('指南針', 'Compass'));
    mkBtn(r1, tr('＋ 再放一個', '+ Add one'), addCompass, undefined, S.comps.length >= MAX_COMPASS);
    mkBtn(r1, tr('只留一個', 'Keep one'), keepOne, undefined, S.comps.length <= 1);
    const r2 = row(tr('顯示', 'Show'));
    mkBtn(r2, tr('磁力線', 'Field lines'), () => { S.lines = !S.lines; buildControls(); invalidate(); }, S.lines);
    mkBtn(r2, tr('切線虛線', 'Tangent'), () => { S.tangent = !S.tangent; buildControls(); invalidate(); }, S.tangent);
    const r3 = row(tr('磁鐵', 'Magnet'));
    mkBtn(r3, tr('N、S 對調', 'Swap N / S'), () => { S.flip = !S.flip; layerKey = ''; retarget(); buildControls(); updateText(); invalidate(); }, S.flip);
  }
  function addCompass() {
    if (S.comps.length >= MAX_COMPASS) return;
    const spot = SPOTS[(S.adds++) % SPOTS.length];
    S.comps.push({ x: spot.x, y: spot.y, a: fieldAngle(spot.x, spot.y) + 0.0 });
    S.sel = S.comps.length - 1; buildControls(); updateText(); invalidate();
  }
  function keepOne() {
    const keep = S.comps[S.sel] || S.comps[0];
    S.comps = [keep]; S.sel = 0; S.drag = -1; buildControls(); updateText(); invalidate();
  }
  function retarget() { /* 針的目標角度每格都由磁場即時算出，這裡只需要重畫 */ }

  // ───────── 繪圖 ─────────
  function fieldLayer() {
    const key = S.flip ? 'R' : 'L';
    if (layer && layerKey === key) return layer;
    if (!layer) { layer = document.createElement('canvas'); layer.width = W * DPR; layer.height = H * DPR; }
    const lc = layer.getContext('2d');
    lc.setTransform(DPR, 0, 0, DPR, 0, 0); lc.clearRect(0, 0, W, H);
    drawSymmetricFieldLines(lc, poles(), 20, 2, 'rgba(85,233,255,0.40)', true);
    layerKey = key; return layer;
  }
  function render() {
    if (!ctx) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    clear(ctx);
    if (S.lines) ctx.drawImage(fieldLayer(), 0, 0, W, H);
    drawMagnet(ctx, 350, 270, 300, 60, !S.flip);
    const k = kNow(), R = R0 * k;
    S.comps.forEach((c, i) => {
      const target = fieldAngle(c.x, c.y);
      if (S.tangent) {
        ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(c.x - Math.cos(target) * 85 * k, c.y - Math.sin(target) * 85 * k);
        ctx.lineTo(c.x + Math.cos(target) * 85 * k, c.y + Math.sin(target) * 85 * k);
        ctx.stroke(); ctx.restore();
      }
      if (i === S.sel && S.comps.length > 1) {
        ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.arc(c.x, c.y, R + 9, 0, TAU); ctx.stroke(); ctx.restore();
      }
      drawCompass(ctx, c.x, c.y, c.a, R);
    });
    const c0 = S.comps[S.sel] || S.comps[0];
    if (S.tangent && c0) {
      const ty = c0.y - 74 * k >= 30 ? c0.y - 74 * k : c0.y + 78 * k;
      label(ctx, tr('磁力線切線方向 = 磁針 N 極方向', 'Tangent = Compass N pole direction'), clamp(c0.x, 230 * k, 1000 - 230 * k), ty, C.yellow, 'center', Math.round(20 * k));
    }
    if (S.moves === 0) {
      const c = S.comps[0];
      label(ctx, tr('👆 拖曳我', '👆 Drag me'), c.x, c.y + R + 20 * k, C.white, 'center', Math.round(22 * k));
    }
  }

  // ───────── 動畫迴圈（只在需要時跑，針轉到定位就停） ─────────
  function invalidate() { S.dirty = true; if (!S.raf && S.on && S.visible && !document.hidden) S.raf = requestAnimationFrame(tick); }
  function tick() {
    S.raf = 0;
    if (!S.on || !S.visible || document.hidden) return;
    let moving = S.drag >= 0 || S.dirty;
    S.comps.forEach(c => {
      const d = wrapPI(fieldAngle(c.x, c.y) - c.a);
      if (Math.abs(d) > 0.002) { c.a += d * 0.22; moving = true; } else c.a += d;
    });
    render(); S.dirty = false;
    if (moving) S.raf = requestAnimationFrame(tick);
  }

  // ───────── 拖曳：滑鼠＋觸控（只有抓到指南針才擋捲動） ─────────
  function pos(cx, cy) {
    const r = cv.getBoundingClientRect();
    return { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H };
  }
  function pick(p) {
    let best = -1, bd = GRAB0 * kNow();
    S.comps.forEach((c, i) => { const d = Math.hypot(p.x - c.x, p.y - c.y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function down(cx, cy) {
    const p = pos(cx, cy), i = pick(p);
    if (i < 0) return false;
    S.drag = i; S.sel = i; S.dx = S.comps[i].x - p.x; S.dy = S.comps[i].y - p.y;
    cv.classList.add('dragging'); updateText(); invalidate(); return true;
  }
  function move(cx, cy) {
    if (S.drag < 0) return;
    const p = pos(cx, cy), c = S.comps[S.drag];
    c.x = clamp(p.x + S.dx, 40, W - 40); c.y = clamp(p.y + S.dy, 60, H - 50);
    S.moves++; updateText(); invalidate();
  }
  function up() { if (S.drag >= 0) { S.drag = -1; cv.classList.remove('dragging'); invalidate(); } }

  const onMouseDown = e => { if (e.button === 0 && down(e.clientX, e.clientY)) e.preventDefault(); };
  const onMouseMove = e => move(e.clientX, e.clientY);
  const onTouchStart = e => { const t = e.touches[0]; if (t && down(t.clientX, t.clientY) && e.cancelable) e.preventDefault(); };
  const onTouchMove = e => { if (S.drag < 0) return; const t = e.touches[0]; if (t) { move(t.clientX, t.clientY); if (e.cancelable) e.preventDefault(); } };
  const onKey = e => {
    const c = S.comps[S.sel]; if (!c) return;
    const step = e.shiftKey ? 40 : 15, k = e.key;
    const dx = k === 'ArrowLeft' ? -step : k === 'ArrowRight' ? step : 0;
    const dy = k === 'ArrowUp' ? -step : k === 'ArrowDown' ? step : 0;
    if (!dx && !dy) return;
    e.preventDefault(); c.x = clamp(c.x + dx, 30, W - 30); c.y = clamp(c.y + dy, 50, H - 40);
    S.moves++; updateText(); invalidate();
  };
  const onVis = () => { if (!document.hidden) invalidate(); };

  // ───────── 介面契約 ─────────
  function activate() {
    if (S.on) deactivate();
    cv = document.getElementById('compassLabCanvas');
    ctrl = document.getElementById('compassLabControls');
    res = document.getElementById('compassLabResult');
    if (!cv) return;
    injectCSS();
    ctx = cv.getContext('2d');
    S.on = true; S.visible = false;
    if (!S.comps.length) resetComps();
    buildControls(); updateText();
    cv.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', up);
    cv.addEventListener('touchstart', onTouchStart, { passive: false });
    cv.addEventListener('touchmove', onTouchMove, { passive: false });
    cv.addEventListener('touchend', up);
    cv.addEventListener('touchcancel', up);
    cv.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(en => { S.visible = en[en.length - 1].isIntersecting; if (S.visible) invalidate(); });
      io.observe(cv);
    } else { S.visible = true; invalidate(); }
    if (!wired) { // 語言切換鈕：頁面換完文字後，重建本檔的按鈕與說明
      wired = true;
      ['btn-lang-zh', 'btn-lang-en'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.addEventListener('click', () => setTimeout(relang, 0));
      });
    }
  }
  function deactivate() {
    S.on = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    if (cv) {
      cv.removeEventListener('mousedown', onMouseDown);
      cv.removeEventListener('touchstart', onTouchStart);
      cv.removeEventListener('touchmove', onTouchMove);
      cv.removeEventListener('touchend', up);
      cv.removeEventListener('touchcancel', up);
      cv.removeEventListener('keydown', onKey);
      cv.classList.remove('dragging');
    }
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', up);
    document.removeEventListener('visibilitychange', onVis);
    if (io) { io.disconnect(); io = null; }
    S.drag = -1;
  }
  function relang() { if (!S.on) return; buildControls(); updateText(); invalidate(); }
  function _state() {
    return {
      on: S.on, visible: S.visible, flipped: S.flip, lines: S.lines, tangent: S.tangent,
      selected: S.sel, dragging: S.drag, moves: S.moves, running: !!S.raf,
      compasses: S.comps.map(c => ({
        x: +c.x.toFixed(1), y: +c.y.toFixed(1),
        needleDeg: +((((c.a * 180 / Math.PI) % 360) + 360) % 360).toFixed(1),
        fieldDeg: +((((fieldAngle(c.x, c.y) * 180 / Math.PI) % 360) + 360) % 360).toFixed(1)
      }))
    };
  }

  MagLab.compass = { activate, deactivate, relang, _state };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activate); else activate();
})();

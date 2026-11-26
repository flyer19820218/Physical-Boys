/* mechanics_4_labkit_1126_v1.js ｜ 「動手做」實驗台共用骨架（window.M4Lab）
 *
 * 每個實驗台（mechanics_4_lab_*.js）只要寫：狀態、控制項、step（物理）、draw（畫布）、result（結果框），
 * 其餘（DOM、CSS、高解析畫布、RAF、離開分頁就停、中英切換）都由這裡處理。
 * 版面照 AGENTS 3.5：h2 → 小標 → 畫布 → 結果框（緊貼畫布）→ 說明 → 操作鈕與滑桿（縮小、放最下面）；寬度 ≤ 1080。
 * 契約（給 mechanics_4_modes 與有聲播放器）：window.W5Lab[key] = { activate, deactivate, relang, _state }
 *
 * M4Lab.make({
 *   key, tab,                         // 'brick'、'tab1'
 *   titleZh, titleEn, subZh, subEn, tipZh, tipEn,
 *   init(),                           // → 狀態物件 S
 *   controls(S),                      // → [ {kind:'slider', id, zh, en, min, max, step, get(), set(v), fmt(v), disabled?()},
 *                                     //     {kind:'buttons', items:[{ id, zh, en, on(), active?(), disabled?() }]} ]
 *   step(S, dt),                      // 物理；回傳 true＝還在動、下一格繼續
 *   draw(c, S),                       // 畫在 960×540 邏輯座標（已套 2x 縮放）
 *   result(S),                        // → 結果框 HTML 字串（用 M4Lab.T 取中英）
 *   preload?()                        // 選用：載入圖片等，回傳 Promise
 * }) → { activate, deactivate, relang, _state, S }
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};
  const W = 960, H = 540, DPR = 2;
  const T = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);
  const esc = s => String(s).replace(/"/g, '&quot;');

  const COL = { bg: '#0d201a', deep: '#0b1a15', white: '#f6f3ea', dim: '#a3b8b0', yellow: '#ffe066', teal: '#4dd2ff', coral: '#ff8040', green: '#33cc99', pink: '#f472b6',
                water: '#2f8fd8', waterEdge: '#7cc9ff', oil: '#e0a84a' };

  const CSS = key => `
#lab-${key}.lab-desk{max-width:1080px;margin:28px auto 10px;background:#1c3d34;border:3px solid #ffe066;border-radius:14px;padding:16px 20px 18px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column;width:100%}
#lab-${key} h2{order:0;font-size:32px;font-weight:700;color:#4dd2ff;margin:0 0 4px;line-height:1.35}
#lab-${key} .lab-sub{order:1;font-size:22px;line-height:1.5;margin:0 0 12px;color:#f6f3ea}
#lab-${key} .canvas-wrap{order:2;background:#0d201a;border:2px solid #ffe066;border-radius:10px;overflow:hidden;position:relative}
#lab-${key} canvas{display:block;width:100%;height:auto;outline:none}
#lab-${key} .result-box{order:3;border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-${key} .result-box>div+div{margin-top:4px}
#lab-${key} .lw-big{font-size:26px;font-weight:700}
#lab-${key} .lw-ok{color:#33cc99}#lab-${key} .lw-bad{color:#ff8040}#lab-${key} .lw-y{color:#ffe066}#lab-${key} .lw-c{color:#4dd2ff}#lab-${key} .lw-p{color:#ff8040}
#lab-${key} .lab-tip{order:4;font-size:22px;line-height:1.5;margin:8px 0 0;color:#a3b8b0}
#lab-${key} .lab-controls{order:5;display:flex;flex-direction:column;gap:6px;margin:12px 0 0}
#lab-${key} .lab-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
#lab-${key} .lab-srow{min-height:36px;flex-wrap:nowrap}
#lab-${key} .lab-brow{min-height:44px;margin-top:2px}
#lab-${key} .lab-name{font-size:22px;font-weight:700;min-width:7.6em;color:#4dd2ff}
#lab-${key} .lab-val{font-family:"JetBrains Mono",monospace;font-size:22px;font-weight:700;min-width:6.4em;text-align:right;color:#f6f3ea}
#lab-${key} input[type=range]{flex:1 1 auto;min-width:0;height:36px;margin:0;background:transparent;cursor:pointer;touch-action:none;-webkit-appearance:none;appearance:none}
#lab-${key} input[type=range]:disabled{opacity:.4;cursor:not-allowed}
#lab-${key} input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:5px;background:rgba(246,243,234,.28)}
#lab-${key} input[type=range]::-moz-range-track{height:10px;border-radius:5px;background:rgba(246,243,234,.28)}
#lab-${key} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:34px;height:34px;margin-top:-12px;border-radius:50%;background:#4dd2ff;border:3px solid #0b1a15;box-shadow:0 0 0 2px #f6f3ea}
#lab-${key} input[type=range]::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:#4dd2ff;border:3px solid #0b1a15;box-shadow:0 0 0 2px #f6f3ea}
#lab-${key} .lab-btn{font:inherit;font-size:18px;font-weight:700;min-height:44px;padding:4px 18px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.45);cursor:pointer}
#lab-${key} .lab-btn:hover{border-color:#ffe066}
#lab-${key} .lab-btn.on{background:#ffe066;color:#11261f;border-color:#ffe066}
#lab-${key} .lab-btn:disabled{opacity:.4;cursor:not-allowed}
@media (max-width:640px){#lab-${key}.lab-desk{padding:12px 12px 14px}#lab-${key} h2{font-size:26px}#lab-${key} .lw-big{font-size:22px}#lab-${key} .lab-srow{flex-wrap:wrap}#lab-${key} .lab-name{min-width:0;width:100%}#lab-${key} input[type=range]{flex:1 1 150px}}
`;

  function make(cfg) {
    const KEY = cfg.key, TAB = cfg.tab;
    const S = cfg.init();
    const R = { on: false, raf: 0, last: 0, visible: true, cv: null, ctx: null, ctrl: null, res: null, io: null, rows: [], dirty: true };

    function bind() {
      R.cv = document.getElementById(KEY + 'LabCanvas');
      R.ctrl = document.getElementById(KEY + 'LabControls');
      R.res = document.getElementById(KEY + 'LabResult');
      R.ctx = R.cv ? R.cv.getContext('2d') : null;
    }
    function render() {
      if (!R.ctx) return;
      const c = R.ctx;
      c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
      c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
      try { cfg.draw(c, S); } finally { c.restore(); }
    }
    function updateUI() {
      if (R.res) R.res.innerHTML = cfg.result(S);
      R.rows.forEach(r => {
        if (r.kind === 'slider') {
          r.input.value = r.def.get(); r.val.textContent = r.def.fmt ? r.def.fmt(r.def.get()) : r.def.get();
          r.input.disabled = !!(r.def.disabled && r.def.disabled());
        } else r.btns.forEach(b => {
          b.el.classList.toggle('on', !!(b.def.active && b.def.active()));
          b.el.disabled = !!(b.def.disabled && b.def.disabled());
        });
      });
    }
    function buildControls() {
      if (!R.ctrl) return;
      R.ctrl.innerHTML = ''; R.rows = [];
      cfg.controls(S).forEach(def => {
        const row = document.createElement('div');
        if (def.kind === 'slider') {
          row.className = 'lab-row lab-srow';
          const nm = document.createElement('span'); nm.className = 'lab-name'; nm.setAttribute('data-zh', def.zh); nm.setAttribute('data-en', def.en); nm.textContent = T(def.zh, def.en);
          const inp = document.createElement('input'); inp.type = 'range'; inp.min = def.min; inp.max = def.max; inp.step = def.step; inp.value = def.get();
          inp.setAttribute('aria-label', T(def.zh, def.en));
          const val = document.createElement('span'); val.className = 'lab-val';
          inp.addEventListener('input', () => { def.set(parseFloat(inp.value)); R.dirty = true; updateUI(); request(); });
          row.append(nm, inp, val);
          R.rows.push({ kind: 'slider', def, input: inp, val });
        } else {
          row.className = 'lab-row lab-brow'; const btns = [];
          def.items.forEach(it => {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-btn'; b.id = KEY + 'Btn_' + it.id;
            b.setAttribute('data-zh', it.zh); b.setAttribute('data-en', it.en); b.textContent = T(it.zh, it.en);
            b.addEventListener('click', () => { it.on(); R.dirty = true; updateUI(); request(); });
            row.appendChild(b); btns.push({ el: b, def: it });
          });
          R.rows.push({ kind: 'buttons', btns });
        }
        R.ctrl.appendChild(row);
      });
    }

    function loop(ts) {
      R.raf = 0;
      if (!R.on || !R.visible || document.hidden) return;
      const dt = R.last ? Math.min(0.05, (ts - R.last) / 1000) : 0.016; R.last = ts;
      const moving = cfg.step(S, dt);
      updateUI(); render(); R.dirty = false;
      if (moving) R.raf = requestAnimationFrame(loop); else R.last = 0;
    }
    function request() { if (R.on && !R.raf) { R.last = 0; R.raf = requestAnimationFrame(loop); } }
    const onVis = () => { if (!document.hidden) request(); };

    function activate() {
      if (R.on) deactivate();
      bind(); if (!R.cv) return;
      R.on = true; R.visible = true;
      buildControls(); updateUI(); render();
      document.addEventListener('visibilitychange', onVis);
      if ('IntersectionObserver' in window) {
        R.io = new IntersectionObserver(en => { R.visible = en[en.length - 1].isIntersecting; if (R.visible) request(); });
        R.io.observe(R.cv);
      }
      if (cfg.preload) Promise.resolve(cfg.preload()).then(() => { render(); request(); });
      request();
    }
    function deactivate() {
      R.on = false;
      if (R.raf) { cancelAnimationFrame(R.raf); R.raf = 0; }
      document.removeEventListener('visibilitychange', onVis);
      if (R.io) { R.io.disconnect(); R.io = null; }
    }
    function relang() {
      const desk = document.getElementById('lab-' + KEY);
      if (desk) desk.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = T(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
      bind(); buildControls(); updateUI(); render();
    }
    function inject() {
      if (document.getElementById('lab-' + KEY)) { bind(); return; }
      const host = document.getElementById(TAB); if (!host) return;
      if (!document.getElementById('lab-' + KEY + '-css')) {
        const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS(KEY); document.head.appendChild(st);
      }
      const d = document.createElement('div'); d.className = 'lab-desk'; d.id = 'lab-' + KEY;
      d.innerHTML =
        `<h2 data-zh="${esc(cfg.titleZh)}" data-en="${esc(cfg.titleEn)}">${T(cfg.titleZh, cfg.titleEn)}</h2>` +
        `<div class="lab-sub" data-zh="${esc(cfg.subZh)}" data-en="${esc(cfg.subEn)}">${T(cfg.subZh, cfg.subEn)}</div>` +
        `<div class="canvas-wrap"><canvas id="${KEY}LabCanvas" width="${W * DPR}" height="${H * DPR}" style="touch-action:pan-y;width:100%"></canvas></div>` +
        `<div class="result-box" id="${KEY}LabResult"></div>` +
        `<div class="lab-tip" data-zh="${esc(cfg.tipZh)}" data-en="${esc(cfg.tipEn)}">${T(cfg.tipZh, cfg.tipEn)}</div>` +
        `<div class="lab-controls" id="${KEY}LabControls"></div>`;
      host.appendChild(d);
      bind(); buildControls(); updateUI(); render();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render());
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

    const api = { activate, deactivate, relang, S, request: () => { R.dirty = true; request(); }, _state() { return Object.assign({ on: R.on, running: !!R.raf }, cfg.snapshot ? cfg.snapshot(S) : {}); } };
    window.W5Lab[KEY] = api;
    return api;
  }

  /* ═════════ 共用小畫法 ═════════ */
  const U = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    ease: t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); },
    rr(c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    },
    /* 文字（走 W5.label／pill；沒有 W5 時退回簡單 fillText） */
    label(c, str, x, y, col, size, align, mono) {
      if (window.W5 && W5.label) return W5.label(c, str, x, y, col, size || 22, align, mono);
      c.save(); c.font = '700 ' + (size || 22) + 'px "Noto Sans TC",sans-serif'; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillStyle = col || COL.white; c.fillText(str, x, y); c.restore(); return 0;
    },
    pill(c, str, x, y, col, size, align, mono) {
      if (window.W5 && W5.pill) return W5.pill(c, str, x, y, col, size || 22, align, mono);
      return U.label(c, str, x, y, col, size, align, mono);
    },
    arrow(c, x0, y0, x1, y1, col, lw) {
      if (window.M3 && M3.arrowFx) return M3.arrowFx(c, x0, y0, x1, y1, col, 1, lw || 7, 0);
      if (window.W5) W5.arrow(c, x0, y0, x1, y1, col, lw || 5, 16);
    },
    /* 水：藍色漸層矩形（可含波動水面）；top＝水面 y（可傳函式 x→y），回傳 void */
    waterRect(c, x0, y0, x1, y1, o) {
      o = o || {};
      const g = c.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(47,143,216,0.55)'); g.addColorStop(1, 'rgba(26,96,168,0.72)');
      c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.strokeStyle = COL.waterEdge; c.lineWidth = 3; c.beginPath();
      const wob = o.wob || 0, ph = o.phase || 0;
      for (let x = x0; x <= x1; x += 6) { const y = y0 + wob * Math.sin((x - x0) * 0.09 + ph); if (x === x0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    }
  };

  window.M4Lab = { make, T, COL, U, W, H, DPR };
})();

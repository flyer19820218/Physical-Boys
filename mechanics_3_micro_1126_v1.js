/* ==================================================================
   mechanics_3 ｜ 鋸齒咬合：摩擦力的微觀成因（cvs-micro，960×540）
   四步：1 看起來很平滑 → 2 放大 1000 倍 → 3 鋸齒咬合 → 4 越粗糙越難滑
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 mechanics_3_common_1126_v1.js（M3）。

   場景：
   ・實景（第 1 步、第 2 步開頭）：木桌（桌面 y＝TOP）上放一塊淺色木塊；放大鏡（真的放大 2 倍）移到木塊底與桌面的接觸線。
   ・放大景（第 2、3 步）：一張 960×540 的「虛擬畫面」VIEW，原點 VO 對準鏡片中心；鏡片半徑 r 從 64 撐到 560，
     縮放 sc＝r／560，到 1 時整張畫布就是放大景（＝鏡頭鑽進鏡片）。線寬乘 1／sc，所以縮小時線條不會變細到看不見。
     鋸齒用 M3.teethPair：下排＝桌面（木色）、上排＝木塊底面（淺色），m＝鋸齒顯現程度、gap＝上排抬高。
   ・第 4 步：兩個圓窗（左冰面＋冰刀，右柏油路＋鞋底），鋸齒大小與咬合數不同，摩擦力箭頭一短一長（不標數字）。
   畫布頂端 0～31px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 32。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || !M3.teethPair) return;

  const TAU = Math.PI * 2;
  const COL = W5.COL, seg = W5.seg, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01;
  const L = (zh, en) => (typeof tr === 'function' ? tr(zh, en) : zh);
  const T = M3.T, P = M3.P, withA = M3.withA, fin = M3.fin, fout = M3.fout, grow = M3.grow;
  const WHITE = COL.white, DIM = COL.dim, FR = M3.FC.friction, PUSH = M3.FC.push, YEL = COL.yellow;
  const DUR = [10, 11, 12, 11];      /* 總長 44 秒 */

  /* ═══════════ 實景版面 ═══════════ */
  const GY = M3.GY;                  /* 地面線 455 */
  const TOP = 330;                   /* 桌面 */
  const TAB = { x0: 80, x1: 700 };
  const BLK = { cx: 340, w: 260, h: 118 };
  const LENS = { x: 372, y: TOP, r: 64 };        /* 放大鏡停的位置（中心＝接觸線） */
  const LENS0 = { x: 760, y: 150 };              /* 放大鏡飛進來的起點 */
  const MARCH = { x: 845, sc: 0.52 };

  /* ═══════════ 放大景（虛擬畫面） ═══════════ */
  const VO = { x: 480, y: 305 };     /* 虛擬畫面裡對準鏡片中心的點（接觸線） */
  const R_FULL = 560;                /* 鏡片半徑到這裡＝放大景撐滿畫布（中心到角落 ≈ 550） */
  const YC = 305;                    /* 鋸齒「攤平」時的高度 */
  const PAIR = M3.teethPair(7, -80, 1040, 338, { period: 104, amp: 92, jit: 0.75, bite: 1, clear: 8, dipMin: 0.12, dipMax: 0.32 });
  const GAP2 = 58;                   /* 第 2 步上排抬高，讓尖和谷看得清楚 */
  /* 標「尖」「谷」用的齒：挑畫面右半第一個夠高的尖、和它左邊的谷 */
  const PK_I = (() => { for (let i = 2; i < PAIR.low.length; i += 2) if (PAIR.low[i].x > 560) return i; return 8; })();

  /* 第 4 步的兩個圓窗（區域座標，中心 0,0；接觸面在 +22～+40） */
  const WIN = { r: 132, cy: 292, xl: 250, xr: 710 };
  const ICE = M3.teethPair(21, -160, 160, 26, { period: 26, amp: 9, jit: 0.8, bite: 0.3, clear: 4 });
  const ASP = M3.teethPair(33, -160, 160, 44, { period: 58, amp: 54, jit: 0.7, bite: 1, clear: 5 });
  const inWin = p => Math.abs(p.x) < WIN.r - 16;
  const ICE_C = ICE.contacts.filter(inWin), ASP_C = ASP.contacts.filter(inWin);

  M3.preload(['touch_water', 'shocked', 'struggling']);

  /* ═══════════ 實景：桌子＋木塊＋March（noText：鏡片裡重畫時不寫字） ═══════════ */
  function realScene(c, s, noText) {
    M3.backdrop(c, { gy: GY, cell: 40, glow: COL.teal });
    M3.ground(c, GY);
    M3.table(c, TAB.x0, TAB.x1, TOP, GY, { mat: 'wood' });
    /* 木塊：第 1 步開頭輕輕放到桌上 */
    const e = s.n === 1 ? ease(seg(s.u, 0.2, 1.3)) : 1;
    const by = TOP - 46 * (1 - e) + (s.n === 1 ? Math.sin(seg(s.u, 1.3, 1.7) * Math.PI) * -3 : 0);
    M3.block(c, BLK.cx, by, BLK.w, BLK.h, { a: e, seed: 9, shadow: e > 0.95 });
    M3.march(c, 'touch_water', MARCH.x, GY, { sc: MARCH.sc, a: s.n === 1 ? s.k : 1 });
    if (noText) return;
    const la = fin(s, 1, 1.6, 0.5);
    P(c, la, L('木塊', 'Block'), BLK.cx - 60, TOP - BLK.h + 34, WHITE, 22);
    P(c, la, L('桌面', 'Tabletop'), 210, TOP + 52, WHITE, 22);
  }

  /* ═══════════ 放大景 VIEW（虛擬 960×540 座標） ═══════════
     o：{ m 鋸齒顯現 0..1, gap 上排抬高, ls 線寬倍率, dx 上排水平位移, edge 邊線發光 0..1 } */
  const flat = (p, m) => YC + (p.y - YC) * m;
  function view(c, o) {
    const m = o.m, ls = o.ls || 1, up0 = -o.gap - 2.5 * ls * (1 - m);
    const low = PAIR.low.map(p => ({ x: p.x, y: flat(p, m) }));
    const up = PAIR.up.map(p => ({ x: p.x, y: flat(p, m) + up0 }));
    M3.teethFill(c, low, 1400, 'wood', { lw: ls, seed: 3, glow: o.edge || 0 });
    M3.teethFill(c, up, -900, 'lightwood', { lw: ls, seed: 9, dx: o.dx || 0, glow: o.edge || 0 });
  }
  /* 把 VIEW 畫進一個圓：VO 對準 (cx, cy)，縮放 sc */
  function viewInCircle(c, cx, cy, r, sc, o) {
    c.save();
    c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.clip();
    c.translate(cx, cy); c.scale(sc, sc); c.translate(-VO.x, -VO.y);
    view(c, Object.assign({ ls: 1 / sc }, o));
    c.restore();
  }

  /* ═══════════ 第 1 步：看起來很平滑 ═══════════ */
  function step1(c, s) {
    const n = 1, u = s.u;
    realScene(c, s, false);
    /* 放大鏡飛到接觸線：鏡片裡是真的放大 2 倍的實景 */
    const f = ease(seg(u, 2.4, 4.0));
    const lx = lerp(LENS0.x, LENS.x, f), ly = lerp(LENS0.y, LENS.y, f) - Math.sin(f * Math.PI) * 40;
    const la = fin(s, n, 2.2, 0.4);
    M3.magnifier(c, lx, ly, LENS.r, {
      a: la, inner: cc => {
        cc.save(); cc.translate(lx, ly); cc.scale(2, 2); cc.translate(-lx, -ly); realScene(cc, s, true); cc.restore();
        /* 兩條平滑直線：木塊底（淺）、桌面頂（木色） */
        const k2 = fin(s, n, 4.2, 0.6);
        if (k2 > 0.02) {
          cc.save(); cc.globalAlpha *= k2; cc.lineWidth = 3;
          cc.strokeStyle = '#fff8e6'; cc.beginPath(); cc.moveTo(lx - LENS.r, ly - 3); cc.lineTo(lx + LENS.r, ly - 3); cc.stroke();
          cc.strokeStyle = '#e9bb8a'; cc.beginPath(); cc.moveTo(lx - LENS.r, ly + 3); cc.lineTo(lx + LENS.r, ly + 3); cc.stroke();
          cc.restore();
        }
        /* 光沿著接觸線掃過去 */
        const sh = seg(u, 5.0, 7.0);
        if (sh > 0 && sh < 1) {
          const sx = lerp(lx - LENS.r, lx + LENS.r, sh);
          const g = cc.createLinearGradient(sx - 40, 0, sx + 40, 0);
          g.addColorStop(0, 'rgba(255,224,102,0)'); g.addColorStop(0.5, 'rgba(255,240,180,0.85)'); g.addColorStop(1, 'rgba(255,224,102,0)');
          cc.fillStyle = g; cc.fillRect(sx - 40, ly - 5, 80, 10);
        }
      }
    });
    P(c, fin(s, n, 0.3, 0.5), L('看起來很平滑', 'Looks smooth'), 480, M3.KEY_Y, WHITE, 24);
    P(c, fin(s, n, 0.9, 0.5), L('摩擦力是從哪裡來的？', 'Where does friction come from?'), 480, M3.Q_Y, YEL, 24);
    /* 鏡片旁的說明 */
    const ta = fin(s, n, 4.4, 0.5);
    withA(c, ta, () => {
      c.save(); c.strokeStyle = 'rgba(246,243,234,0.7)'; c.lineWidth = 2; c.setLineDash([6, 5]);
      c.beginPath(); c.moveTo(LENS.x + 52, LENS.y - 40); c.lineTo(530, 200); c.stroke(); c.restore();
    });
    P(c, ta, L('接觸面：兩條平滑直線', 'Contact: two smooth lines'), 530, 186, WHITE, 22, 'left');
    M3.caption(c, fin(s, n, 6.6, 0.5), L('兩個面摸起來都很平', 'Both surfaces feel flat'), WHITE, 440);
  }

  /* ═══════════ 第 2 步：放大 1000 倍 ═══════════ */
  function step2(c, s) {
    const n = 2, u = s.u;
    const z = ease(seg(u, 0.8, 3.8));
    const r = LENS.r * Math.pow(R_FULL / LENS.r, z);           /* 指數放大：每段時間放大的倍數差不多 */
    const sc = Math.min(1, r / R_FULL);
    const cx = lerp(LENS.x, VO.x, z), cy = lerp(LENS.y, VO.y, z);
    const m = ease(seg(u, 4.2, 6.2)), gap = GAP2 * ease(seg(u, 5.0, 6.6));
    if (z < 1) {
      realScene(c, s, false);
      c.fillStyle = 'rgba(11,26,21,' + (0.75 * z).toFixed(3) + ')'; c.fillRect(0, 0, 960, 540);
      const mixA = ease(seg(u, 0.8, 1.6));                       /* 鏡片裡：實景×2 → 放大景 */
      M3.magnifier(c, cx, cy, r, {
        handleA: fout(s, n, 0.8, 0.5), rimA: 1 - ease(seg(z, 0.7, 1)),
        inner: cc => {
          if (mixA < 1) { cc.save(); cc.translate(cx, cy); cc.scale(2, 2); cc.translate(-cx, -cy); realScene(cc, s, true); cc.restore(); }
          if (mixA > 0) { cc.save(); cc.globalAlpha *= mixA; viewInCircle(cc, cx, cy, r, sc, { m, gap }); cc.restore(); }
        }
      });
    } else {
      view(c, { m, gap, ls: 1 });
    }
    /* 倍率計數 1 → 1000 */
    const N = Math.round(Math.pow(10, 3 * z));
    P(c, fin(s, n, 0.3, 0.4), L('放大 ' + N + ' 倍', 'Zoom in ×' + N), 480, M3.KEY_Y, z >= 1 ? YEL : WHITE, 24);
    /* 標示 */
    const la = fin(s, n, 6.6, 0.5);
    P(c, la, L('木塊底面', 'Bottom of the block'), 150, 168, WHITE, 22);
    P(c, la, L('桌面', 'Tabletop'), 150, 452, WHITE, 22);
    const ta = fin(s, n, 7.4, 0.5), pk = PAIR.low[PK_I], vl = PAIR.low[PK_I - 1];
    withA(c, ta, () => {
      W5.glow(c, pk.x, pk.y, 22, YEL, 0.7); W5.glow(c, vl.x, vl.y, 22, YEL, 0.7);
      c.fillStyle = YEL; [pk, vl].forEach(p => { c.beginPath(); c.arc(p.x, p.y, 5, 0, TAU); c.fill(); });
    });
    T(c, ta, L('尖', 'Peak'), pk.x + 12, pk.y + 34, YEL, 22, 'left');
    T(c, ta, L('谷', 'Valley'), vl.x, vl.y - 30, YEL, 22);
    M3.march(c, 'shocked', 880, 540, { sc: 0.4, a: fin(s, n, 6.0, 0.5) });
    M3.caption(c, fin(s, n, 8.2, 0.5), L('看起來平滑，其實凹凸不平', 'Looks smooth, but is really bumpy'), WHITE, 470);
  }

  /* ═══════════ 第 3 步：鋸齒咬合 ═══════════ */
  const PUSH_Y = 150, PUSH_X0 = 70, ARW = 250;    /* 推力、摩擦力箭頭一樣長（沒動＝互相抵消），不標數字 */
  const FR_Y = 208, FR_X0 = 840;
  function step3(c, s) {
    const n = 3, u = s.u;
    const drop = seg(u, 0.3, 1.2), gap = GAP2 * (1 - drop * drop);     /* 加速落下、咬住 */
    const env = grow(s, n, 3.6, 4.2) * (1 - grow(s, n, 9.4, 10.2));
    const dx = 3 * env + M3.shake(u, 1.8 * env, 34);                  /* 想往右動、被卡住而抖動 */
    const bite = fin(s, n, 1.2, 0.2);
    view(c, { m: 1, gap, ls: 1, dx, edge: 0.6 * env });
    /* 咬住的接觸點：剛咬住閃一下；推的時候一直亮、跳動 */
    const vis = PAIR.contacts.filter(p => p.x > 40 && p.x < 920);
    vis.forEach((p, i) => {
      const hit = bite * fout(s, n, 1.5, 0.8);
      const pulse = env * (0.65 + 0.35 * Math.sin(u * 7 + i * 1.3));
      M3.flash(c, p.x + dx, p.y, 24, YEL, Math.max(hit, pulse), u * 0.6 + i);
      /* 小箭頭：桌面斜面頂住鋸齒尖，力朝左上 */
      const g = grow(s, n, 4.2, 5.0);
      if (g > 0.01) M3.arrowFx(c, p.x + dx + p.nx * 6, p.y + p.ny * 6, p.x + dx + p.nx * (6 + 40 * g), p.y + p.ny * (6 + 40 * g), FR, 1, 4);
    });
    P(c, fin(s, n, 1.5, 0.4) * fout(s, n, 6.2, 0.4), L('兩排鋸齒互相咬住', 'The two rows of teeth lock together'), 480, M3.Q_Y, YEL, 24);
    P(c, fin(s, n, 6.5, 0.4), L('木塊想往右動，卻被卡住', 'It wants to move right, but is stuck'), 480, M3.Q_Y, YEL, 24);
    /* 推力（青，→）、摩擦力（珊瑚，←） */
    M3.force(c, { x: PUSH_X0, y: PUSH_Y, dir: 'right', val: ARW, k: 1, col: PUSH, grow: grow(s, n, 2.8, 3.8), name: L('外力', 'Push'), num: false, lab: 'above', lw: 9 });
    M3.force(c, { x: FR_X0, y: FR_Y, dir: 'left', val: ARW, k: 1, col: FR, grow: grow(s, n, 5.0, 6.0), name: L('摩擦力', 'Friction'), num: false, lab: 'above', lw: 9 });
    M3.march(c, 'struggling', 92, 540, { sc: 0.42, flip: true, a: fin(s, n, 2.6, 0.5) });
    P(c, fin(s, n, 0.3, 0.5), L('鋸齒咬合', 'Teeth interlock'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 7.2, 0.5), L('鋸齒卡住 → 產生阻擋運動的摩擦力', 'Teeth catch → friction that resists motion'), FR, 500);
  }

  /* ═══════════ 第 4 步：越粗糙越難滑 ═══════════ */
  /* 小圖示：溜冰鞋＋冰面（x, y＝冰面上緣中心） */
  function skateIcon(c, x, y, a) {
    withA(c, a, () => {
      c.fillStyle = '#bfe9f5'; W5.rr(c, x - 44, y, 88, 9, 3); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 42, y + 1); c.lineTo(x + 42, y + 1); c.stroke();
      /* 冰刀 */
      c.strokeStyle = '#dfe7ec'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 30, y - 2); c.lineTo(x + 24, y - 2); c.quadraticCurveTo(x + 34, y - 3, x + 32, y - 10); c.stroke();
      c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 20, y - 2); c.lineTo(x - 20, y - 10); c.moveTo(x + 14, y - 2); c.lineTo(x + 14, y - 10); c.stroke();
      /* 靴子 */
      c.fillStyle = '#f2f4f6'; c.strokeStyle = '#4a5a66'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - 28, y - 10); c.lineTo(x - 26, y - 46); c.lineTo(x - 6, y - 46); c.lineTo(x - 4, y - 24);
      c.quadraticCurveTo(x + 22, y - 22, x + 26, y - 10); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#4dd2ff'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 24, y - 40 + i * 8); c.lineTo(x - 8, y - 38 + i * 8); c.stroke(); }
    });
  }
  /* 小圖示：運動鞋＋柏油路 */
  function shoeIcon(c, x, y, a) {
    withA(c, a, () => {
      c.fillStyle = '#4a4f55'; W5.rr(c, x - 44, y, 88, 9, 3); c.fill();
      c.fillStyle = 'rgba(200,205,210,0.6)';
      for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(x - 40 + i * 7.3, y + 3 + 3 * W5.hash(i), 1.4, 0, TAU); c.fill(); }
      /* 鞋底（鋸齒紋） */
      c.fillStyle = '#2a2d36';
      c.beginPath(); c.moveTo(x - 34, y - 1);
      for (let i = 0; i <= 10; i++) c.lineTo(x - 34 + i * 6.6, y - (i % 2 ? 0 : 3));
      c.lineTo(x + 32, y - 8); c.lineTo(x - 34, y - 8); c.closePath(); c.fill();
      /* 鞋面 */
      c.fillStyle = '#ff8a5c'; c.strokeStyle = '#5a2a18'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - 34, y - 8); c.lineTo(x - 32, y - 34); c.quadraticCurveTo(x - 20, y - 40, x - 10, y - 34);
      c.quadraticCurveTo(x + 6, y - 24, x + 26, y - 20); c.quadraticCurveTo(x + 34, y - 16, x + 32, y - 8); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - 6, y - 30); c.lineTo(x + 2, y - 24); c.moveTo(x, y - 33); c.lineTo(x + 8, y - 27); c.stroke();
    });
  }
  /* 一個圓窗：kind＝'ice'|'asp'；ga＝摩擦力箭頭長出、fa＝接觸點閃光 */
  function win(c, kind, cx, cy, r, a, s, ga, fa) {
    const D = kind === 'ice' ? ICE : ASP, CS = kind === 'ice' ? ICE_C : ASP_C;
    M3.magnifier(c, cx, cy, r, {
      a, handleA: 0, rim: 9, inner: cc => {
        cc.save(); cc.translate(cx, cy);
        M3.teethFill(cc, D.low, r + 40, kind === 'ice' ? 'ice' : 'asphalt', { seed: kind === 'ice' ? 4 : 6 });
        M3.teethFill(cc, D.up, -r - 40, kind === 'ice' ? 'metal' : 'rubber', { seed: 8 });
        cc.restore();
        CS.forEach((p, i) => {
          const pulse = fa * (0.7 + 0.3 * Math.sin(s.u * 6 + i * 1.7) * (s.u < 9.2 ? 1 : 0));
          M3.flash(cc, cx + p.x, cy + p.y, kind === 'ice' ? 12 : 17, YEL, pulse, i);
        });
      }
    });
    /* 摩擦力：冰面短、柏油路長（只比長短，不標數字） */
    const len = kind === 'ice' ? 46 : 176;
    M3.force(c, { x: cx + len / 2, y: cy - 58, dir: 'left', val: len, k: 1, col: FR, grow: ga, a, name: L('摩擦力', 'Friction'), num: false, lab: 'above', lw: 8 });
  }
  function step4(c, s) {
    const n = 4, u = s.u;
    M3.backdrop(c, { gy: 540, cell: 40, glow: COL.teal, gyGlow: 290 });
    /* 0～1.3 秒：放大景縮成中間一個圓窗；1.3～2.4 秒：分成左右兩個 */
    const shrink = ease(seg(u, 0, 1.3)), split = ease(seg(u, 1.3, 2.4));
    const r0 = lerp(600, WIN.r, shrink);
    const cy = lerp(VO.y, WIN.cy, shrink);
    const woodA = 1 - ease(seg(u, 1.3, 1.9));
    if (woodA > 0.02) {
      withA(c, woodA, () => {
        viewInCircle(c, 480, cy, r0, 1, { m: 1, gap: 0, dx: 0 });
        M3.magnifier(c, 480, cy, r0, { handleA: 0, rim: 9, rimA: shrink, glassA: shrink, inner: () => {} });
      });
    }
    const ga1 = grow(s, n, 4.4, 5.6), fa = fin(s, n, 3.4, 0.6);
    win(c, 'ice', lerp(480, WIN.xl, split), WIN.cy, WIN.r, split, s, ga1, fa);
    win(c, 'asp', lerp(480, WIN.xr, split), WIN.cy, WIN.r, split, s, ga1, fa);
    /* 圖示與名稱 */
    const ia = fin(s, n, 2.5, 0.5), iy = 136;
    skateIcon(c, WIN.xl - 56, iy, ia);
    shoeIcon(c, WIN.xr - 56, iy, ia);
    T(c, ia, L('冰面', 'Ice'), WIN.xl + 4, iy - 18, '#bfe9f5', 22, 'left');
    T(c, ia, L('柏油路', 'Asphalt'), WIN.xr + 4, iy - 18, '#d5dade', 22, 'left');
    /* 結論 */
    const ba = fin(s, n, 6.0, 0.5), by = WIN.cy + WIN.r + 34;
    P(c, ba, L('咬合少 → 摩擦力小', 'Few catches → small friction'), WIN.xl, by, WHITE, 22);
    P(c, fin(s, n, 6.6, 0.5), L('咬合多 → 摩擦力大', 'Many catches → big friction'), WIN.xr, by, FR, 22);
    P(c, fin(s, n, 0.3, 0.5), L('越粗糙越難滑', 'Rougher, harder to slide'), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, n, 7.6, 0.5), L('越粗糙 → 咬合越多 → 摩擦力越大', 'Rougher → more catching → more friction'), YEL, 470, 512);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    if (s.n === 1) step1(c, s);
    else if (s.n === 2) step2(c, s);
    else if (s.n === 3) step3(c, s);
    else step4(c, s);
  }

  W5.register('micro', { canvas: 'cvs-micro', steps: DUR, draw });
})();

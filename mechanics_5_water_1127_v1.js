/* ==================================================================
   mechanics_5 ｜ 換成水柱：要多高才夠？（cvs-water，960×540）
   四步：1 水銀 76 cm → 2 換成清水 → 3 列式計算 → 4 十公尺高
   介面依 work_5_kit_1103_v1.js：W5.register + 純函式 draw(c, s)；共用畫法在 M3、M4、M5。
   用到：M3.backdrop／ground／caption／eqRow、M4.L／T／P／withA／fin／fout／grow／pPill／PC、
        M5.trough／baroTube／dimV／pArrowAt／PC（trough、baroTube、dimV 由 torr 新增）。

   數字（照簡報）：水銀 D ＝ 13.6、清水 D ＝ 1；13.6 × 76 ＝ 1033.6；P水 ＝ P氣、h × 1.0 ＝ 1033.6、h ＝ 1033.6 cm ≈ 10.3 m；
     水銀柱 0.76 m；三層樓（每層約 3.4 m，總高約 10.2 m）；水銀是水的 13.6 倍重，管子短 13.6 倍。
   比例尺：第 1 步 1 cm ＝ 3.6 px（同 torr）；第 2 步 u 0.3～3.3 平滑縮成 1 cm ＝ 0.4 px（1 m ＝ 40 px），之後一直是 0.4 px/cm。
     垂直方向照比例：水銀柱 76 cm ＝ 273.6 px → 30.4 px；水管 11 m ＝ 440 px（管頂 y 70）、水柱 10.336 m ＝ 413 px（頂端 y 97）；
     樓房每層 3.4 m ＝ 136 px，三層 408 px（頂 y 104）。水平方向（槽寬、管寬、樓寬）是示意：縮小時槽寬只縮到 1/4、管子半寬 10→5 px。
   第 1 步（11 s）：左邊完整的水銀氣壓計（管子由 100 cm 掉到 76 cm，u 0.6～3.6，同 torr 的阻尼）；「76 cm」u 3.8、「水銀 D ＝ 13.6」u 4.2、
     「13.6 × 76 ＝ 1033.6」u 5.0；槽面大氣壓力箭頭 u 1.0；字卡 u 7.0。
   第 2 步（11 s）：u 0.3～3.3 鏡頭拉遠（水銀組往左移、變小，水銀柱縮成 30 px）；清水氣壓計（空管）u 3.2 出現，u 3.8～7.4 水柱慢慢升到 10.3 m；
     「清水 D ＝ 1」u 3.6；尺寸標「10.3 m」u 7.6；兩槽面的大氣壓力箭頭（同長 40 px，同一個大氣壓）；字卡 u 8.0。
   第 3 步（11 s）：右側算式逐行浮現：P水 ＝ P氣（u 0.6）→ h × 1.0 ＝ 1033.6（u 2.2）→ h ＝ 1033.6 cm（u 3.8）→ ≈ 10.3 m（u 5.4）；
     最後一行出現時水柱頂端閃一下；字卡 u 7.0。
   第 4 步（12 s）：算式淡出；水柱右邊一層一層蓋起三層樓（u 0.6～3.0），「約三層樓高」u 3.2；水銀小柱旁「0.76 m」u 4.2；
     「水銀是水的 13.6 倍重，管子短 13.6 倍」u 5.2；字卡 u 7.0。
   版面：地面 GY 512；第 1 步尺寸標 x 135；槽面 SURF 510（槽內底 532）；第 1 步水銀組：管 x 200、槽 40～360；縮小後：管 x 90、槽 50～130；
     清水組：管 x 260、槽 200～320；尺寸標「10.3 m」x 180；樓房 x 345～445；算式左緣 x 500。
     步驟標題 KEY_Y 62；字卡改放在右半邊（中心 x 700、BOT_Y 505），因為兩個槽與樓房都在左下角。
     畫布頂端 0～31 px 留給 kit 的進度條，本檔內容一律畫在 y ≥ 34（最高的水管頂 y 70）。
   ================================================================== */
(function () {
  'use strict';
  if (typeof W5 === 'undefined' || typeof M3 === 'undefined' || typeof M4 === 'undefined' || typeof M5 === 'undefined' || !M5.baroTube) return;

  const COL = W5.COL, ease = W5.ease, lerp = W5.lerp, clamp01 = W5.clamp01, TAU = Math.PI * 2;
  const L = M4.L, T = M4.T, P = M4.P, withA = M4.withA, fin = M4.fin, fout = M4.fout, grow = M4.grow;
  const WHITE = COL.white, DIM = COL.dim, YEL = COL.yellow, PR = M5.PC.pressure, WA = M5.PC.water, WE = M5.PC.waterEdge, HG = M5.PC.hg;
  const DUR = [11, 11, 11, 12];                         /* 總長 45 秒 */

  /* ── 版面 ── */
  const GY = 512, SURF = 510, TBOT = 532, DIP = 14, K0 = 3.6, K1 = 0.4;
  const WX = 260, WTR = { x0: 200, x1: 320 }, WLEN = 1100 * K1, WH = 1033.6 * K1;   /* 水管 440 px、水柱 413.4 px */
  const DIMW = 180, BX0 = 345, BX1 = 445, FLOOR = 340 * K1;                         /* 樓房、每層 136 px */
  const EQX = 500, CAPX = 700;

  /* ── 時間函式（純函式） ── */
  const zoomK = s => (s.n === 1 ? 0 : s.n === 2 ? ease(clamp01((s.u - 0.3) / 3.0)) : 1);
  const kNow = s => lerp(K0, K1, zoomK(s));
  const hgH = s => {                                    /* 水銀柱高（cm）：第 1 步掉下來 */
    if (s.n !== 1) return 76;
    const tau = s.u - 0.6; return tau <= 0 ? 100 : 76 + 24 * Math.exp(-2.65 * tau) * Math.cos(4 * tau);
  };
  const waterH = s => (s.n === 2 ? WH * ease(clamp01((s.u - 3.8) / 3.6)) : s.n > 2 ? WH : 0);
  const waterA = s => (s.n === 2 ? clamp01((s.u - 3.2) / 0.6) : s.n > 2 ? 1 : 0);

  /* ═══════════ 水銀組（第 2 步縮小） ═══════════ */
  function hgGroup(c, s) {
    const z = zoomK(s), k = kNow(s), tx = lerp(200, 90, z), half = lerp(160, 40, z), hw = lerp(10, 5, z), t = s.t;
    M5.trough(c, { x0: tx - half, x1: tx + half, bot: TBOT, top: SURF - lerp(30, 14, z), level: SURF, t, wob: lerp(1.3, 0.8, z) });
    M5.baroTube(c, { x: tx, y: SURF + DIP, len: 100 * k + DIP, hw, wall: lerp(4, 3, z), level: SURF - hgH(s) * k });
    /* 第 1 步：76 cm、算式 */
    const a1 = s.n === 1 ? 1 : s.n === 2 ? fout(s, 2, 0, 0.5) : 0;
    if (a1 > 0.02) {
      M5.dimV(c, 135, SURF, SURF - 76 * K0, '76 cm', { a: a1 * fin(s, 1, 3.8, 0.5) });
      withA(c, a1 * fin(s, 1, 3.8, 0.5), () => {
        c.save(); c.strokeStyle = W5.rgba(YEL, 0.9); c.lineWidth = 2; c.setLineDash([8, 6]); c.lineDashOffset = -t * 10;
        c.beginPath(); c.moveTo(141, SURF - 76 * K0); c.lineTo(tx - hw - 6, SURF - 76 * K0); c.stroke(); c.setLineDash([]); c.restore();
      });
      T(c, a1 * fin(s, 1, 4.2, 0.5), L('水銀 D ＝ 13.6', 'Mercury, D = 13.6'), 236, 300, HG, 22, 'left');
      P(c, a1 * fin(s, 1, 5.0, 0.5), '13.6 × 76 ＝ 1033.6', 236, 350, YEL, 28, 'left', true);
      T(c, a1 * fin(s, 1, 5.4, 0.5), 'gw/cm²', 236, 396, DIM, 22, 'left', true);
    }
    /* 大氣壓力（同一個大氣，兩槽一樣長） */
    const pa = s.n === 1 ? fin(s, 1, 1.0, 0.5) : 1, len = lerp(56, 40, z);
    [tx - half * 0.8, tx + half * 0.55].forEach((x, j) => M5.pArrowAt(c, x, SURF - 3, Math.PI / 2, len * (1 + 0.04 * Math.sin(t * 3.2 + j)), { a: pa, lw: lerp(6, 5, z) }));
    /* 第 4 步：0.76 m */
    P(c, fin(s, 4, 4.2, 0.5), '0.76 m', tx, SURF - 76 * K1 - 34, HG, 22, 'center', true);
    return { tx, hw };
  }

  /* ═══════════ 清水組 ═══════════ */
  function waterGroup(c, s) {
    const a = waterA(s); if (a <= 0.02) return;
    const t = s.t, h = waterH(s), flash = s.n === 3 ? Math.max(0, 1 - Math.abs(s.u - 5.8) / 0.6) : 0;
    withA(c, a, () => {
      M5.trough(c, { x0: WTR.x0, x1: WTR.x1, bot: TBOT, top: SURF - 14, level: SURF, t: t + 0.6, wob: 0.8, col: WA });
      M5.baroTube(c, { x: WX, y: SURF + DIP, len: WLEN + DIP, hw: 10, level: SURF - h, col: WA });
      if (flash > 0.02) W5.glow(c, WX, SURF - WH, 46, WE, 0.7 * flash);
    });
    [WTR.x0 + 18, WTR.x1 - 18].forEach((x, j) => M5.pArrowAt(c, x, SURF - 3, Math.PI / 2, 40 * (1 + 0.04 * Math.sin(t * 3.2 + j + 1)), { a: a * (s.n === 2 ? fin(s, 2, 3.6, 0.5) : 1), lw: 5 }));
    T(c, (s.n === 2 ? fin(s, 2, 3.6, 0.5) : 1) * (s.n === 4 ? fout(s, 4, 0, 0.5) : 1), L('清水 D ＝ 1', 'Water, D = 1'), WX + 24, 300, WE, 22, 'left');
    /* 10.3 m */
    const da = s.n === 2 ? fin(s, 2, 7.6, 0.5) : s.n > 2 ? 1 : 0;
    M5.dimV(c, DIMW, SURF, SURF - WH, '10.3 m', { a: da, g: s.n === 2 ? grow(s, 2, 7.6, 8.2) : 1, ty: 300 });
    withA(c, da, () => {
      c.save(); c.strokeStyle = W5.rgba(YEL, 0.9); c.lineWidth = 2; c.setLineDash([8, 6]); c.lineDashOffset = -t * 10;
      c.beginPath(); c.moveTo(DIMW + 6, SURF - WH); c.lineTo(WX - 16, SURF - WH); c.stroke(); c.setLineDash([]); c.restore();
    });
    T(c, s.n === 2 ? fin(s, 2, 0.6, 0.5) * fout(s, 2, 3.4, 0.5) : 0, L('鏡頭拉遠：1 m ＝ 40 px', 'Zoom out: 1 m = 40 px'), 480, 300, DIM, 22, 'center');
  }

  /* ═══════════ 第 3 步：算式 ═══════════ */
  function equations(c, s) {
    if (s.n !== 3 && s.n !== 4) return;
    const a = s.n === 4 ? fout(s, 4, 0, 0.6) : 1; if (a <= 0.02) return;
    const sh = t0 => (s.n === 3 ? ease(clamp01((s.u - t0) / 0.6)) : 1);
    const row = (y, t0, toks) => M3.eqRow(c, { x: EQX, y, align: 'left', size: 28, mono: true, a, show: sh(t0) * toks.length, tokens: toks });
    row(150, 0.6, [{ t: L('P水', 'P(water)'), col: WE }, { t: '＝', col: WHITE }, { t: L('P氣', 'P(air)'), col: PR }]);
    row(214, 2.2, [{ t: 'h × 1.0', col: WE }, { t: '＝', col: WHITE }, { t: '1033.6', col: PR }]);
    row(278, 3.8, [{ t: 'h', col: WE }, { t: '＝', col: WHITE }, { t: '1033.6 cm', col: YEL }]);
    row(346, 5.4, [{ t: '　', col: WHITE }, { t: '≈ 10.3 m', col: YEL, pill: true }]);
  }

  /* ═══════════ 第 4 步：三層樓 ═══════════ */
  function building(c, s) {
    if (s.n !== 4) return;
    const u = s.u, a = fin(s, 4, 0.4, 0.4);
    withA(c, a, () => {
      c.save();
      for (let f = 0; f < 3; f++) {
        const g = ease(clamp01((u - 0.6 - f * 0.8) / 0.8)); if (g <= 0) break;
        const y1 = GY - f * FLOOR, y0 = y1 - FLOOR * g;
        const gr = c.createLinearGradient(BX0, 0, BX1, 0); gr.addColorStop(0, '#d9c7a6'); gr.addColorStop(1, '#a8916c');
        c.fillStyle = gr; c.fillRect(BX0, y0, BX1 - BX0, y1 - y0);
        c.strokeStyle = 'rgba(11,26,21,0.75)'; c.lineWidth = 2; c.strokeRect(BX0, y0, BX1 - BX0, y1 - y0);
        if (g > 0.98) {
          /* 窗（兩扇）＋樓板線 */
          [BX0 + 16, BX0 + 58].forEach(x => {
            c.fillStyle = '#4c7d93'; c.fillRect(x, y0 + 30, 26, 40);
            c.strokeStyle = '#f6f3ea'; c.lineWidth = 2; c.strokeRect(x, y0 + 30, 26, 40);
            c.beginPath(); c.moveTo(x + 13, y0 + 30); c.lineTo(x + 13, y0 + 70); c.stroke();
          });
          c.fillStyle = '#7d6a4f'; c.fillRect(BX0 - 4, y0 - 3, BX1 - BX0 + 8, 6);
          T(c, 1, (f + 1) + 'F', BX1 - 8, y0 + 108, WHITE, 22, 'right', true);
        }
      }
      if (u > 3.0) { c.fillStyle = '#6b5a42'; c.beginPath(); c.moveTo(BX0 - 8, GY - 3 * FLOOR); c.lineTo(BX1 + 8, GY - 3 * FLOOR); c.lineTo(BX1 - 4, GY - 3 * FLOOR - 10); c.lineTo(BX0 + 4, GY - 3 * FLOOR - 10); c.closePath(); c.fill(); }
      c.restore();
    });
    P(c, fin(s, 4, 3.2, 0.5), L('約三層樓高', 'About 3 storeys'), BX1 + 18, 150, YEL, 24, 'left');
    T(c, fin(s, 4, 3.6, 0.5), L('每層約 3.4 m', 'about 3.4 m each'), BX1 + 18, 196, DIM, 22, 'left');
    P(c, fin(s, 4, 5.2, 0.5), L('水銀是水的 13.6 倍重，管子短 13.6 倍', 'Mercury is 13.6× denser → tube 13.6× shorter'), 700, 330, YEL, 22, 'center');
  }

  /* ═══════════ 文字 ═══════════ */
  const TITLES = [
    () => L('水銀 76 cm', 'Mercury: 76 cm'),
    () => L('換成清水', 'Switch to water'),
    () => L('列式計算', 'Work it out'),
    () => L('十公尺高', 'Ten metres tall')
  ];
  function texts(c, s) {
    const n = s.n;
    P(c, fin(s, n, 0.2, 0.5), TITLES[n - 1](), 480, M3.KEY_Y, WHITE, 24);
    M3.caption(c, fin(s, 1, 7.0, 0.6) * fout(s, 2, 0, 0.4), L('水銀：76 cm 就撐得住', 'Mercury: 76 cm is enough'), YEL, CAPX, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 2, 8.0, 0.6) * fout(s, 3, 0, 0.4), L('清水：要撐到約 10.3 m', 'Water: it must reach about 10.3 m'), YEL, CAPX, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 3, 7.0, 0.6) * fout(s, 4, 0, 0.4), L('同樣的大氣壓力，D 小 h 就大', 'Same air pressure: smaller D, taller h'), YEL, CAPX, M3.BOT_Y, 24);
    M3.caption(c, fin(s, 4, 7.0, 0.6), L('所以氣壓計用水銀，不用水', 'So barometers use mercury, not water'), YEL, CAPX, M3.BOT_Y, 24);
  }

  /* ═══════════ draw ═══════════ */
  function draw(c, s) {
    M3.backdrop(c, { gy: GY, cell: 40 });
    M3.ground(c, GY);
    building(c, s);
    hgGroup(c, s);
    waterGroup(c, s);
    equations(c, s);
    texts(c, s);
  }

  W5.register('water', { canvas: 'cvs-water', steps: DUR, draw });
})();

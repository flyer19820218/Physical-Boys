/* Human transport · authorised cutaway redraw · 2026-10-12.
 * Additive module: no registration, DOM changes, timer, audio or RAF.
 * Draw contract: (ctx, state, elapsedSeconds, D). D.tr accepts [zh, en].
 * heartDraw returns AND stores state.cutawayTimeline; audio should consume its
 * events once (event.id), never repeatedly play the snapshot's sound field.
 * timeline(seconds, deltaSeconds=0, periodSeconds=4) is also independently pure.
 * Legacy manual heart phases 0/1/2/3 map to filling/atrial/ejection/relaxation.
 * Optional state.cutawayPhase selects any of the five phase IDs for inspection.
 * pulseDraw is an OVERLAY: call original experiment draw first, then this only
 * for view==='pulse'. Default bounds replace its old strip, preserving records.
 * D.pulseBounds={x,y,w,h} allows main to reserve a larger visual area elsewhere.
 * Original anatomy/evidence: existing teacher-provided files, no pixel edits.
 * Physiology: https://openstax.org/books/anatomy-and-physiology-2e/pages/19-3-cardiac-cycle
 * https://www.nhlbi.nih.gov/health/heart/heart-beats
 * Geometry is a deliberately enlarged teaching model, not a measured anatomy.
 */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, BG = '#11261f', INK = '#f2ecd9';
  const P = (zh, en) => [zh, en];
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const mod = (n, d = 1) => ((n % d) + d) % d;
  const mix = (a, b, u) => a + (b - a) * u;
  const smooth = u => { u = clamp(u); return u * u * (3 - 2 * u); };
  const memories = new WeakMap();
  const HEART_REGIONS = Object.freeze({
    ra: [.10, .34, .32, .30], rv: [.20, .60, .38, .27],
    la: [.60, .30, .27, .22], lv: [.57, .52, .35, .40],
    av: [.30, .43, .52, .25], sl: [.34, .25, .30, .25], septum: [.48, .48, .33, .44]
  });
  const PHASES = Object.freeze([
    { id: 'filling', start: 0, end: .38, avOpen: true, slOpen: false, sound: null,
      name: P('舒張充血', 'Ventricular filling'),
      text: P('房室瓣開，半月瓣關；血液由心房流入心室。', 'AV valves open; semilunar valves close. Blood flows from atria into ventricles.') },
    { id: 'atrial-systole', start: .38, end: .50, avOpen: true, slOpen: false, sound: null,
      name: P('心房收縮', 'Atrial contraction'),
      text: P('左右心房同時收縮，完成心室充血。', 'Both atria contract together to complete ventricular filling.') },
    { id: 'isovolumetric-contraction', start: .50, end: .56, avOpen: false, slOpen: false, sound: 'S1',
      name: P('等容收縮', 'Isovolumetric contraction'),
      text: P('房室瓣關閉伴隨第一心音；半月瓣尚未開，心室容積不變。', 'AV closure accompanies S1. Semilunar valves have not opened; ventricular volume stays constant.') },
    { id: 'ejection', start: .56, end: .86, avOpen: false, slOpen: true, sound: null,
      name: P('左右心室一起射血', 'Both ventricles eject'),
      text: P('房室瓣關、半月瓣開；右心室送往肺，左心室送往全身。', 'AV valves close and semilunar valves open. The right ventricle supplies the lungs; the left supplies the body.') },
    { id: 'isovolumetric-relaxation', start: .86, end: 1, avOpen: false, slOpen: false, sound: 'S2',
      name: P('等容舒張', 'Isovolumetric relaxation'),
      text: P('半月瓣關閉伴隨第二心音；房室瓣尚未開，心室容積暫時不變。', 'Semilunar closure accompanies S2. AV valves have not opened; ventricular volume briefly stays constant.') }
  ]);

  function timeline(seconds, deltaSeconds = 0, periodSeconds = 4) {
    const period = Number.isFinite(periodSeconds) && periodSeconds > 0 ? periodSeconds : 4;
    const secondsNow = Number.isFinite(seconds) ? seconds : 0;
    const cycle = Math.floor(secondsNow / period), u = mod(secondsNow / period);
    const p = PHASES.find(p => u >= p.start && u < p.end) || PHASES[0];
    const local = clamp((u - p.start) / (p.end - p.start));
    // Constant volumes in BOTH isovolumetric phases. Relative volume, not mL.
    const volume = u < .38 ? mix(.48, .88, smooth(u / .38))
      : u < .5 ? mix(.88, 1, smooth((u - .38) / .12))
        : u < .56 ? 1 : u < .86 ? mix(1, .48, smooth((u - .56) / .30)) : .48;
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    const previous = secondsNow - delta, events = [];
    // Suspend/resume must not produce minutes of stale audio events.
    const from = Math.max(previous, secondsNow - period);
    for (let n = Math.floor(from / period); n <= cycle; n++) {
      for (const phase of PHASES) {
        const at = (n + phase.start) * period;
        if (at > from + 1e-10 && at <= secondsNow + 1e-10) events.push({
          id: `${n}:${phase.id}`, cycle: n, at, phase: phase.id,
          avOpen: phase.avOpen, slOpen: phase.slOpen, sound: phase.sound
        });
      }
    }
    return { seconds: secondsNow, period, cycle, u, phase: p.id, name: p.name,
      phaseProgress: local, avOpen: p.avOpen, slOpen: p.slOpen,
      avAperture: p.avOpen ? (p.id === 'filling' ? smooth(local * 9) : 1) : 0,
      slAperture: p.slOpen ? smooth(local * 12) * smooth((1 - local) * 12) : 0,
      sound: p.sound && local < .28 ? p.sound : null, events,
      ventricularVolume: volume, ventricularContraction: (1 - volume) / .52,
      atrialContraction: p.id === 'atrial-systole' ? Math.sin(local * Math.PI) : 0,
      avFlow: p.avOpen ? (p.id === 'atrial-systole' ? .75 : .55) : 0,
      slFlow: p.slOpen ? Math.sin(local * Math.PI) : 0,
      leftEjecting: p.slOpen, rightEjecting: p.slOpen };
  }
  timeline.phases = PHASES;

  function dtFor(s, t, D, key) {
    let m = memories.get(s);
    if (!m) { m = {}; memories.set(s, m); }
    const last = m[key]; m[key] = t;
    if (s.running === false || t === last) return 0;
    if (last !== undefined && t < last) return 0;
    const delta = Number.isFinite(D.dt) ? D.dt : last === undefined ? 0 : t - last;
    return clamp(delta, 0, .25);
  }
  function txt(ctx, D, pair, x, y, size = 22, color = INK, align = 'left') {
    ctx.save(); ctx.font = `700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(D.tr(pair), x, y); ctx.restore();
  }
  function textWrap(ctx, D, pair, x, y, width, size = 22, color = INK) {
    ctx.save(); ctx.font = `700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
    const text = D.tr(pair), units = /\s/.test(text) ? text.split(/\s+/).map(w => w + ' ') : Array.from(text);
    let line = '', row = 0;
    for (const unit of units) {
      if (line && ctx.measureText(line + unit).width > width) {
        txt(ctx, D, [line.trim(), line.trim()], x, y + row++ * (size + 7), size, color); line = unit;
      } else line += unit;
    }
    if (line) txt(ctx, D, [line.trim(), line.trim()], x, y + row++ * (size + 7), size, color);
    ctx.restore(); return row;
  }
  function base(ctx, D, name) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, 960, 600);
    txt(ctx, D, name, 24, 35, 26, '#fde047');
  }
  function line(ctx, points, color, width = 2) {
    ctx.beginPath(); points.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p.x ?? p[0], p.y ?? p[1]));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function ellipse(ctx, x, y, rx, ry, fill, stroke, width = 1) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function gradient(ctx, x, y, x2, y2, stops) {
    const g = ctx.createLinearGradient(x, y, x2, y2);
    stops.forEach(([at, color]) => g.addColorStop(at, color)); return g;
  }
  function original(ctx, D, file, x, y, w, h) {
    return D.image(ctx, file, x + 6, y + 6, w - 12, h - 12);
  }
  function focus(ctx, D, f, crop, hit) {
    if (!f || !crop) return;
    const r = [f.x + crop[0] * f.w, f.y + crop[1] * f.h, crop[2] * f.w, crop[3] * f.h];
    ctx.save(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2; ctx.strokeRect(...r); ctx.restore();
    if (hit) D.hit(...r, ...hit);
  }

  // Biconcave discs: bright central pallor is a depression, NEVER a dark nucleus.
  function rbc(ctx, x, y, r = 9, oxygen = 1, angle = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    const bright = oxygen > .6;
    const g = ctx.createRadialGradient(-r * .12, -r * .16, 0, 0, 0, r);
    g.addColorStop(0, bright ? '#f3a794' : '#c17a78');
    g.addColorStop(.32, bright ? '#e38273' : '#a25459');
    g.addColorStop(.64, bright ? '#dd3f43' : '#852b39');
    g.addColorStop(.83, bright ? '#ff7770' : '#ab5158');
    g.addColorStop(1, '#68232d');
    ellipse(ctx, 0, 0, r, r * .69, g, bright ? '#f39180' : '#b66e6e', .8);
    ctx.beginPath(); ctx.ellipse(-r * .05, -r * .05, r * .40, r * .25, 0, .2, 2.7);
    ctx.strokeStyle = '#ffd5ba80'; ctx.lineWidth = .8; ctx.stroke(); ctx.restore();
  }
  function wbc(ctx, x, y, r = 13) {
    const g = ctx.createRadialGradient(x - r / 3, y - r / 3, 1, x, y, r);
    g.addColorStop(0, '#eee8d7'); g.addColorStop(.7, '#c8cec5'); g.addColorStop(1, '#899f98');
    ellipse(ctx, x, y, r, r, g, '#d8e2d5', 1);
    [[-4, -3], [4, -1], [0, 5]].forEach(([dx, dy]) => ellipse(ctx, x + dx, y + dy, r * .36, r * .30, '#86639f', '#b299bd'));
    for (let i = 0; i < 7; i++) ellipse(ctx, x + Math.cos(i * 2.4) * r * .73, y + Math.sin(i * 2.4) * r * .70, 1, 1, '#b9a6c1');
  }
  function platelet(ctx, x, y, r = 3.5) {
    ctx.beginPath(); for (let i = 0; i < 9; i++) {
      const a = i * TAU / 9, rr = r * (i % 2 ? .58 : 1);
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fillStyle = '#c9a0d5'; ctx.fill(); ctx.strokeStyle = '#e7c2ed'; ctx.lineWidth = .6; ctx.stroke();
  }

  function leafletPair(ctx, x, y, halfWidth, open, kind, contraction = 0) {
    const chord = kind === 'av', direction = kind === 'sl' ? -1 : 1;
    for (const side of [-1, 1]) {
      const anchor = x + side * halfWidth;
      const tipX = x + side * halfWidth * .78 * open;
      const tipY = y + direction * (chord ? 29 * open + 4 : 18 * open + (kind === 'venous' ? 9 : -9) * (1 - open));
      ctx.beginPath(); ctx.moveTo(anchor, y);
      ctx.bezierCurveTo(anchor - side * halfWidth * .13, y + direction * 13,
        tipX + side * 8, tipY + direction * 6, tipX, tipY);
      ctx.quadraticCurveTo(anchor - side * 11, y + direction * 1, anchor, y); ctx.closePath();
      ctx.fillStyle = gradient(ctx, anchor, y, tipX, tipY + 6, [[0, '#ad7b73'], [.5, '#f1d9ba'], [1, '#c99f85']]);
      ctx.fill(); ctx.strokeStyle = '#f6dfbd'; ctx.lineWidth = 1.6; ctx.stroke();
      if (chord) {
        const papX = x + side * (24 - contraction * 5), papY = y + 74 - contraction * 14;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath(); ctx.moveTo(papX + side * k * 2, papY);
          ctx.quadraticCurveTo(mix(papX, tipX, .5) + side * (1 - open) * 2, (papY + tipY) / 2,
            mix(tipX, anchor, k * .12), mix(tipY, y, k * .12));
          ctx.strokeStyle = '#e5cfb5'; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(papX - 8, papY + 20); ctx.quadraticCurveTo(papX, papY - 12, papX + 8, papY + 20);
        ctx.fillStyle = '#b76158'; ctx.fill();
      }
    }
  }

  function heartHalf(ctx, x, mirror, q, oxygen) {
    ctx.save(); ctx.translate(x, 285); ctx.scale(mirror, 1);
    const c = q.ventricularContraction, v = 1 - .17 * c, right = mirror < 0;
    const apex = right ? -1 : 61, depth = right ? 158 : 185;
    // The atrium, AV opening, ventricle and arterial root share real boundaries.
    ctx.beginPath(); ctx.moveTo(56, 0);
    ctx.bezierCurveTo(21, -17, 23, -88, 66, -109);
    ctx.bezierCurveTo(117, -136, 167, -89, 154, -41);
    ctx.quadraticCurveTo(149, -15, 132, 0); ctx.closePath();
    ctx.fillStyle = gradient(ctx, 20, -100, 155, 0, [[0, '#a34e52'], [.5, '#d78c7b'], [1, '#77353d']]); ctx.fill();
    ctx.save(); ctx.translate(100, -45); ctx.scale(1 - q.atrialContraction * .09, 1 - q.atrialContraction * .12);
    ellipse(ctx, 0, -6, 43, 41, oxygen > .6 ? '#6d2834' : '#512735', '#efb194', 2); ctx.restore();
    ctx.beginPath(); ctx.moveTo(23, 5); ctx.lineTo(20, -87); ctx.quadraticCurveTo(34, -102, 55, -87);
    ctx.lineTo(57, 0); ctx.lineTo(135, 0);
    ctx.bezierCurveTo(194 * v, 15, 181 * v, 105 * v, apex, depth * v);
    ctx.bezierCurveTo(right ? -3 : 17, (depth - 12) * v, -3, 72, 23, 5); ctx.closePath();
    ctx.fillStyle = gradient(ctx, 5, 0, 180, 130, [[0, '#813840'], [.35, '#d88672'], [.63, '#bd605e'], [1, '#743840']]); ctx.fill();
    ctx.strokeStyle = '#e8a48b'; ctx.lineWidth = 2; ctx.stroke();
    const inset = oxygen > .6 ? 25 : 13;
    const cavityPath=()=>{
      ctx.moveTo(29, 9); ctx.lineTo(27, -87); ctx.lineTo(48, -87); ctx.lineTo(49, 7);
      ctx.quadraticCurveTo(87, 13, 130, 7);
      ctx.bezierCurveTo(173 * v - inset / 2, 22, 160 * v - inset / 2, 90 * v, apex + 8, (depth - 22 - inset / 2) * v);
      ctx.bezierCurveTo(right ? 22 : 37, 114 * v, 22, 60, 29, 9); ctx.closePath();
    };
    ctx.beginPath();cavityPath();
    ctx.fillStyle = gradient(ctx, 28, -60, 133, 130, [[0, '#853a40'], [.6, '#42262e'], [1, '#642a35']]); ctx.fill();
    ctx.strokeStyle = '#e99e83'; ctx.lineWidth = 2; ctx.stroke();
    // Muscle fibres remain in the myocardium, not free lines through the lumen.
    for (let i = 0; i < 10; i++) {
      const y = 29 + i * 9 * v, xx = 168 * v - i * (right ? 7.8 : 4.8);
      line(ctx, [[xx - 2, y], [xx + 5, y + 6]], '#f0b59870', 1.2);
    }
    // Flow belongs to the current valve phase. No blood crosses a closed valve.
    ctx.save();ctx.beginPath();cavityPath();ctx.moveTo(143,-51);ctx.ellipse(100,-51,43,41,0,0,TAU);
    ctx.rect(56,-25,80,35);ctx.clip();
    if (q.avFlow && q.avAperture > .45) for (let i = 0; i < 7; i++) {
      const u = mod(q.seconds * .48 + i / 7), y = mix(-62,92*v,u);
      rbc(ctx, 93 + Math.sin(u * Math.PI) * 5, y, 5.5, oxygen, Math.PI / 2);
    }
    if (q.slFlow > .05 && q.slAperture > .45) for (let i = 0; i < 7; i++) {
      const u = mod(q.seconds * .6 + i / 7);
      const xx = u < .55 ? mix(91, 38, smooth(u / .55)) : 38;
      rbc(ctx, xx, mix(112 * v, -84, u), 5, oxygen, -Math.PI / 2);
    }
    ctx.restore();
    // Two leaflets visible in each longitudinal section; not a claim of two
    // anatomical cusps in the tricuspid / semilunar valves. Explained in caption.
    leafletPair(ctx, 94, 0, 38, q.avAperture, 'av', c);
    leafletPair(ctx, 38, -55, 12, q.slAperture, 'sl');
    ctx.restore();
  }

  function heartDraw(ctx, s, t, D) {
    const dt = dtFor(s, t, D, 'heartTime');
    const m = memories.get(s);
    if (m.heartClock === undefined) m.heartClock = 0;
    const manualIndex = clamp(Math.floor(Number(s.beat) || 0), 0, 3);
    const manualU = [.18, .44, .70, .93][manualIndex];
    const forced = PHASES.find(p => p.id === s.cutawayPhase);
    if (forced) m.heartClock = (forced.start + (forced.end - forced.start) * .5) * 4;
    else if (s.auto === false) m.heartClock = manualU * 4;
    else m.heartClock += dt;
    const q = timeline(m.heartClock, s.auto === false || forced ? 0 : dt);
    s.cutawayTimeline = q;
    base(ctx, D, P('心臟原圖與同步瓣膜剖面', 'Heart anatomy and synchronised valves'));
    // EXACT original destination (including six-pixel image inset).
    const fitted = original(ctx, D, s.view === 'body' ? 'body_circulation.png' : 'heart.png', 24, 62, 430, 490);
    if (s.view !== 'body') {
      focus(ctx, D, fitted, HEART_REGIONS[s.part] || HEART_REGIONS.lv);
      if (fitted) ['ra', 'rv', 'la', 'lv'].forEach(key => {
        const r = HEART_REGIONS[key]; D.hit(fitted.x + r[0] * fitted.w, fitted.y + r[1] * fitted.h,
          r[2] * fitted.w, r[3] * fitted.h, 'part', key);
      });
    }
    txt(ctx, D, P('器官剖面・慢動作示意', 'Organ cutaway · slow motion'), 480, 75, 22, '#b9cbbd');
    textWrap(ctx, D, q.name, 480, 109, 452, 25, '#fde047');
    // A continuous muscular septum joins the halves into one organ. RV is a
    // shallower crescent; the thick-walled LV extends to the common apex.
    const v = 1 - .17 * q.ventricularContraction;
    ctx.beginPath();ctx.moveTo(644,274);ctx.quadraticCurveTo(690,255,759,274);
    ctx.bezierCurveTo(771,326,817,391*v+70,771,285+185*v);
    ctx.quadraticCurveTo(708,285+176*v,660,285+120*v);ctx.closePath();
    ctx.fillStyle=gradient(ctx,655,260,778,460,[[0,'#ad635c'],[.5,'#d78a75'],[1,'#8a4548']]);ctx.fill();
    heartHalf(ctx, 696, -1, q, .25);
    heartHalf(ctx, 710, 1, q, 1);
    txt(ctx, D, P('右心', 'Right heart'), 551, 170, 22);
    txt(ctx, D, P('左心', 'Left heart'), 812, 170, 22);
    // Leader endpoints touch the actual cusps/chordae, never label the outflow as AV.
    line(ctx, [[599, 306], [527, 329], [493, 329]], '#d7c5aa', 1);
    txt(ctx, D, P('腱索', 'Chordae'), 482, 355, 18);
    txt(ctx, D, P('房室瓣', 'AV'), 479, 270, 18, '#fde047');
    line(ctx, [[535, 273], [574, 285]], '#fde047', 1);
    txt(ctx, D, P('半月瓣', 'SL'), 695, 194, 18, '#fde047', 'center');
    line(ctx, [[674, 200], [658, 230]], '#fde047', 1);
    line(ctx, [[717, 200], [748, 230]], '#fde047', 1);
    txt(ctx, D, P('房室瓣：' + (q.avOpen ? '開' : '關'), 'AV valves: ' + (q.avOpen ? 'open' : 'closed')), 485, 496, 22);
    txt(ctx, D, P('半月瓣：' + (q.slOpen ? '開' : '關'), 'SL valves: ' + (q.slOpen ? 'open' : 'closed')), 727, 496, 22);
    const bx = 485, by = 526, bw = 438;
    PHASES.forEach((p, i) => {
      ctx.fillStyle = p.id === q.phase ? '#fde047' : i % 2 ? '#41675a' : '#315346';
      ctx.fillRect(bx + p.start * bw, by, (p.end - p.start) * bw - 2, 8);
    });
    line(ctx, [[bx + q.u * bw, by - 6], [bx + q.u * bw, by + 13]], INK, 2);
    txt(ctx, D, P('S1 房室瓣關', 'S1 · AV close'), 485 + .5 * bw, 558, 18, q.sound === 'S1' ? '#fde047' : INK, 'right');
    txt(ctx, D, P('S2 半月瓣關', 'S2 · SL close'), 923, 558, 18, q.sound === 'S2' ? '#fde047' : INK, 'right');
    txt(ctx, D, P('觀眾左＝人體右；兩側同步。', 'Viewer left = body right; both sides act together.'), 24, 583, 22);
    if (D.status) D.status(P(q.name[0] + '｜房室瓣' + (q.avOpen ? '開' : '關') + '・半月瓣' + (q.slOpen ? '開' : '關'),
      q.name[1] + ' | AV ' + (q.avOpen ? 'open' : 'closed') + ' · SL ' + (q.slOpen ? 'open' : 'closed')));
    return q;
  }
  function heartExplain(s) {
    const q = s.cutawayTimeline || timeline(0), p = PHASES.find(p => p.id === q.phase);
    return { title: p.name, text: P(p.text[0] + ' 房室瓣有腱索，半月瓣沒有腱索。剖面只畫切面可見的兩片瓣葉；不代表所有瓣膜都只有兩瓣。一組 S1、S2 算一次心搏；模型放慢，不是實測心率。',
      p.text[1] + ' AV valves have chordae; semilunar valves do not. Two leaflets visible in this section do not imply that every valve has only two cusps. One S1–S2 pair is one heartbeat; this slowed model is not a measured heart rate.') };
  }

  // Arc-length sampled cubic curves. All cell positions and wall normals use
  // these same samples; flow never uses unrelated Cartesian guesses.
  function curve(points, count = 100) {
    const samples = []; let distance = 0;
    for (let i = 0; i <= count; i++) {
      const u = i / count, a = 1 - u;
      const x = a*a*a*points[0][0] + 3*a*a*u*points[1][0] + 3*a*u*u*points[2][0] + u*u*u*points[3][0];
      const y = a*a*a*points[0][1] + 3*a*a*u*points[1][1] + 3*a*u*u*points[2][1] + u*u*u*points[3][1];
      const dx = 3*a*a*(points[1][0]-points[0][0]) + 6*a*u*(points[2][0]-points[1][0]) + 3*u*u*(points[3][0]-points[2][0]);
      const dy = 3*a*a*(points[1][1]-points[0][1]) + 6*a*u*(points[2][1]-points[1][1]) + 3*u*u*(points[3][1]-points[2][1]);
      const length = Math.hypot(dx, dy) || 1, last = samples[samples.length - 1];
      if (last) distance += Math.hypot(x-last.x,y-last.y);
      samples.push({ x, y, nx: -dy/length, ny: dx/length, angle: Math.atan2(dy,dx), d: distance });
    }
    return { samples, length: distance };
  }
  function at(route, distance, lane = 0) {
    const d = clamp(distance, 0, route.length), ss = route.samples;
    let lo = 0, hi = ss.length - 1;
    while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (ss[mid].d < d) lo = mid; else hi = mid; }
    const a = ss[lo], b = ss[hi], u = (d-a.d)/(b.d-a.d || 1);
    const nx = mix(a.nx,b.nx,u), ny = mix(a.ny,b.ny,u);
    return { x: mix(a.x,b.x,u)+nx*lane, y: mix(a.y,b.y,u)+ny*lane, angle: mix(a.angle,b.angle,u), d, lane };
  }
  function tubePath(ctx, route, radius, extra = 0) {
    const ss = route.samples;
    ss.forEach((p,i) => { const r = (typeof radius === 'function' ? radius(p.d) : radius)+extra;
      ctx[i?'lineTo':'moveTo'](p.x+p.nx*r,p.y+p.ny*r); });
    for (let i=ss.length-1;i>=0;i--) { const p=ss[i], r=(typeof radius==='function'?radius(p.d):radius)+extra;
      ctx.lineTo(p.x-p.nx*r,p.y-p.ny*r); }
    ctx.closePath();
  }
  function tubes(ctx, routes, radii, muscle = 18, wall = 7) {
    const bounds = routes.flatMap(r => r.samples), ymin = Math.min(...bounds.map(p=>p.y))-90, ymax = Math.max(...bounds.map(p=>p.y))+90;
    const layers = [
      [muscle+wall, [[0,'#754949'],[.3,'#bf8279'],[.52,'#e7b39a'],[.8,'#965954'],[1,'#57363d']]],
      [muscle, [[0,'#8b454e'],[.3,'#d88c86'],[.6,'#b75f64'],[1,'#67343f']]],
      [3, [[0,'#ba8b65'],[.5,'#e7c896'],[1,'#a47559']]],
      [0, [[0,'#503529'],[.28,'#b39461'],[.48,'#d2b273'],[.7,'#c5a166'],[1,'#715036']]]
    ];
    for (const [extra, colors] of layers) {
      ctx.beginPath(); routes.forEach((r,i)=>tubePath(ctx,r,radii[i],extra));
      ctx.fillStyle=gradient(ctx,0,ymin,0,ymax,colors);ctx.fill();
    }
    // Local-normal shading follows the bend (a global vertical gradient alone
    // makes the cutaway look like a flat ribbon). Keep the lumen unobstructed.
    ctx.save();clipTubes(ctx,routes,radii);
    routes.forEach((r,i)=>{
      for(let band=0;band<20;band++){
        const f0=-1+band/10,f1=f0+.1,mid=(f0+f1)/2;
        ctx.beginPath();r.samples.forEach((p,j)=>{const rr=typeof radii[i]==='function'?radii[i](p.d):radii[i];
          ctx[j?'lineTo':'moveTo'](p.x+p.nx*rr*f0,p.y+p.ny*rr*f0);});
        for(let j=r.samples.length-1;j>=0;j--){const p=r.samples[j],rr=typeof radii[i]==='function'?radii[i](p.d):radii[i];ctx.lineTo(p.x+p.nx*rr*f1,p.y+p.ny*rr*f1);}
        ctx.closePath();ctx.fillStyle=`rgba(57,32,30,${Math.pow(Math.abs(mid),3)*.38})`;ctx.fill();
      }
    });ctx.restore();
    // Narrow specular rims describe curved surfaces; no decorative glow.
    routes.forEach((r,i)=>{
      for(const sign of [-1,1]) {
        let points=[];
        r.samples.forEach(p=>{
          const rr=typeof radii[i]==='function'?radii[i](p.d):radii[i];
          const point=[p.x+p.nx*(rr+muscle*.58)*sign,p.y+p.ny*(rr+muscle*.58)*sign];
          const insideOther=routes.some((other,k)=>k!==i&&other.samples.some(o=>Math.hypot(point[0]-o.x,point[1]-o.y)<(typeof radii[k]==='function'?radii[k](o.d):radii[k])+muscle));
          if(insideOther){if(points.length>1)line(ctx,points,sign<0?'#f3bba470':'#552f3860',1.6);points=[];}else points.push(point);
        });
        if(points.length>1)line(ctx,points,sign<0?'#f3bba470':'#552f3860',1.6);
      }
    });
  }
  function clipTubes(ctx,routes,radii) {ctx.beginPath();routes.forEach((r,i)=>tubePath(ctx,r,radii[i]));ctx.clip();}
  function cells(route, time, lanes, spacing, speed, radius=9) {
    const count=Math.max(1,Math.floor(route.length/spacing)), pitch=route.length/count, result=[];
    lanes.forEach((lane,row)=>{
      for(let i=0;i<count;i++) {
        const d=mod(time*speed+i*pitch+(row%2)*pitch/2,route.length);
        result.push({...at(route,d,lane),r:radius,row,index:i});
      }
    });return result;
  }
  function renderCells(ctx,arr,oxygen){arr.forEach(p=>rbc(ctx,p.x,p.y,p.r,oxygen,p.angle+.12*Math.sin(p.index*2)));}
  function pulseProfile(distance, seconds, period=2.8, speed=520) {
    const u=mod((seconds-distance/speed)/period);
    // Compact wave packet; quiet wall ahead and recoil behind, continuous wrap.
    return u<.42?Math.pow(Math.sin(Math.PI*u/.42),2):0;
  }
  function pulseDisplacement(seconds,period=2.8){
    // Integral of positive pulsatile velocity; monotonic, no backwards RBCs.
    const cycles=Math.floor(seconds/period),u=mod(seconds/period),a=Math.min(u,.42);
    return 46*seconds+90*period*(cycles*.21+a/2-.42*Math.sin(TAU*a/.42)/(2*TAU));
  }
  const VESSEL_MAIN=curve([[82,357],[326,273],[558,440],[886,324]]);
  const VESSEL_BRANCH=curve([[503,357],[568,317],[615,200],[851,186]]);
  const VEIN_BRANCH=curve([[218,334],[350,214],[623,188],[851,186]]);
  const BLOOD_MAIN=curve([[40,461],[314,414],[560,540],[920,447]]);
  const BLOOD_BRANCH=curve([[533,474],[641,477],[704,378],[899,381]]);

  function veinMotion(t,squeeze){
    const u=mod(t/3.6), active=!!squeeze;
    const contraction=active&&u<.48?Math.sin(Math.PI*u/.48):0;
    const forward=active?u<.48:true;
    // Continuous, nondecreasing displacement: cells stop when the valve closes.
    const distance=active?Math.floor(t/3.6)*95+95*smooth(u/.48):t*24;
    return {u,contraction,forward,distance,open:forward?1:0,
      upstreamOpen:!active||!forward,downstreamOpen:!active||forward};
  }
  function stepVein(particles,dt,motion,length){
    const result=particles.map(p=>({...p}));
    for(const row of [0,1,2,3]){
      const lane=result.filter(p=>p.row===row).sort((a,b)=>a.d-b.d);
      let previous=-100;
      for(const p of lane){
        const speed=motion.contraction>0?62:30;
        let target=p.d-speed*dt;
        for(const [gate,open] of [[250,motion.downstreamOpen],[665,motion.upstreamOpen]]){
          if(!open&&p.d>=gate+14&&target<gate+14)target=gate+14;
        }
        p.d=Math.max(target,previous+32);previous=p.d;
      }
      // Re-enter only through the upstream cut end, with preserved headway.
      const tail=lane[lane.length-1];
      for(const p of lane)if(p.d<-12){p.d=Math.max(length+12,tail.d+34);}
    }
    return result;
  }
  function venousValve(ctx,route,d,r,open){
    const p=at(route,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle-Math.PI/2);
    // Downstream is +local y; open tips bend downstream, closed tips coapt.
    leafletPair(ctx,0,0,r,open,'venous');ctx.restore();
  }
  function vesselsDraw(ctx,s,t,D){
    const dt=dtFor(s,t,D,'vesselTime'), memory=memories.get(s);
    const motion=veinMotion(t,s.squeeze);
    if(!memory.veinParticles)memory.veinParticles=[-26,-8,10,28].flatMap((lane,row)=>
      Array.from({length:19},(_,i)=>({d:40+i*42+(row%2)*20,lane,row,index:i,r:8})));
    memory.veinParticles=stepVein(memory.veinParticles,dt,motion,VESSEL_MAIN.length);
    base(ctx,D,P('血管剖面：沿著管腔走','Vessel cutaways: follow the lumen'));
    if(s.view==='micrograph'||s.view==='capillary'){
      original(ctx,D,s.view==='micrograph'?'vessel_photo.png':'capillary_micrograph.png',24,60,530,244);
      original(ctx,D,'vessel_atlas.png',584,60,346,244);
      txt(ctx,D,P('光學顯微影像','Optical micrograph'),24,327,22);
      txt(ctx,D,P('課本構造原圖','Textbook anatomy'),584,327,22);
      // Evidence remains selectable; the model occupies the lower half here.
      ctx.save();ctx.translate(230,260);ctx.scale(.52,.52);
      drawVesselModel(ctx,s,t,D,memory.veinParticles);ctx.restore();
      txt(ctx,D,P('下方為動態教學模型','Animated teaching model below'),24,580,22,'#b9cbbd');
    }else{
      drawVesselModel(ctx,s,t,D,memory.veinParticles);
      original(ctx,D,'vessel_atlas.png',25,60,171,125);
      txt(ctx,D,P('構造原圖','Source anatomy'),26,207,18,'#b9cbbd');
      const name=s.vessel==='vein'?P('靜脈・回到心臟','Vein · toward the heart'):s.vessel==='capillary'?P('微血管・單列慢行','Capillaries · single file'):P('動脈・離開心臟','Artery · away from the heart');
      txt(ctx,D,name,237,91,26,'#fde047');
      txt(ctx,D,P('放大剖面示意・各圖不同比例','Enlarged cutaway · scales differ'),237,128,22,'#b9cbbd');
      if(s.vessel!=='capillary'){
        const vein=s.vessel==='vein';
        txt(ctx,D,P('外膜','Outer layer'),74,513,22);
        txt(ctx,D,vein?P('肌層較薄','Thinner muscle'):P('肌層較厚','Thicker muscle'),304,513,22);
        txt(ctx,D,P('內膜','Inner lining'),573,513,22);
        line(ctx,[[104,485],[119,403]],'#d5a59b',1.5);
        line(ctx,[[350,485],[346,392]],'#d5a59b',1.5);
        line(ctx,[[618,485],[620,410]],'#e7c896',1.5);
      }
      const note=s.vessel==='vein'?P('部分靜脈：瓣膜防倒流，肌肉擠壓助回流。','Some veins: valves prevent backflow; muscles assist return.'):
        s.vessel==='capillary'?P('一層內皮・紅血球逐顆通過，留在管內。','One endothelial layer · cells pass singly inside the lumen.'):
          P('管壁局部擴張後回彈；動脈沒有靜脈瓣。','Local wall expansion and recoil; no venous valves in arteries.');
      textWrap(ctx,D,note,24,560,912,22);
    }
    if(D.status)D.status(s.circuit==='lung'?P('肺循環：動脈較少氧，靜脈富氧。','Pulmonary circuit: oxygen-poor arteries, oxygen-rich veins.'):
      P('體循環：動脈富氧，靜脈較少氧。','Systemic circuit: oxygen-rich arteries, oxygen-poor veins.'));
  }
  function drawVesselModel(ctx,s,t,D,veinParticles){
    const vein=s.vessel==='vein', cap=s.vessel==='capillary', oxygen=s.circuit==='lung'?(vein?1:.25):(vein?.25:1);
    if(cap){
      const routes=[-1,0,1].map(k=>curve([[72,340],[285,340+k*146],[668,340+k*146],[894,340]]));
      tubes(ctx,routes,[10,10,10],0,1);
      ctx.save();clipTubes(ctx,routes,[10,10,10]);
      routes.forEach((r,k)=>renderCells(ctx,cells(r,t+k*.6,[0],37,15,7),oxygen));ctx.restore();
      return;
    }
    const motion=veinMotion(t,s.squeeze), radius=vein?d=>48-10*motion.contraction*Math.exp(-Math.pow((d-460)/145,2)):
      d=>39+7*pulseProfile(d,t);
    const branch=vein?VEIN_BRANCH:VESSEL_BRANCH;
    const rr=[radius,vein?25:23], routes=[VESSEL_MAIN,branch];
    if(vein&&s.squeeze){
      const p=at(VESSEL_MAIN,460), squeeze=motion.contraction*13;
      for(const sign of [-1,1]){
        ellipse(ctx,p.x,p.y+sign*(105-squeeze),117,32,'#753f49','#b77a7a',2);
        for(let k=-3;k<=3;k++)line(ctx,[[p.x-80,p.y+sign*(99-squeeze)+k*4],[p.x+82,p.y+sign*(111-squeeze)+k*4]],'#cf8d8860',1);
      }
    }
    tubes(ctx,routes,rr,vein?9:24,7);
    ctx.save();clipTubes(ctx,routes,rr);
    const time=vein?motion.distance/24:pulseDisplacement(t)/46;
    // Three/four staggered lanes; distinct branch starts after its junction.
    const mainCells=vein?veinParticles.filter(p=>p.d>=0&&p.d<=VESSEL_MAIN.length).map(p=>({...p,...at(VESSEL_MAIN,p.d,p.lane)})):
      cells(VESSEL_MAIN,time,[-26,-8,10,28],37,46,8);
    renderCells(ctx,mainCells,oxygen);
    const branchCells=cells(branch,t,[-9,9],38,vein?-24:46,7).filter(p=>p.d>93);
    renderCells(ctx,branchCells,oxygen);ctx.restore();
    if(vein){
      // Return flow is right-to-left; rotate the valve section to face it.
      [250,665].forEach(d=>{const p=at(VESSEL_MAIN,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+Math.PI/2);
        leafletPair(ctx,0,0,radius(d),(d===250?motion.downstreamOpen:motion.upstreamOpen)?1:0,'venous');ctx.restore();});
    }
    // Cross-sectional rim at the cut end displays three concentric tissue layers.
    const end=VESSEL_MAIN.samples[0], r=radius(0);
    ctx.save();ctx.translate(end.x,end.y);ctx.rotate(end.angle);
    ellipse(ctx,0,0,16,r+(vein?16:31),'#b88078','#edb59d',1);
    ellipse(ctx,0,0,12,r+(vein?9:24),'#a44f5b','#e79b91',1);
    ellipse(ctx,0,0,9,r+3,'#e3bc87');ellipse(ctx,0,0,7,r,'#714632');ctx.restore();
  }

  const CROPS={rbc:[.49,.34,.10,.13],wbc:[.414,.493,.10,.14],platelet:[.829,.863,.049,.067],plasma:[0,0,1,1]};
  function bloodDraw(ctx,s,t,D){
    const dt=dtFor(s,t,D,'bloodTime');
    s.separation=clamp((s.separation||0)+((s.targetSeparation||0)-(s.separation||0))*Math.min(1,dt*1.6));
    if(s.task==='separate')return separationDraw(ctx,s,t,D);
    base(ctx,D,P('血液：原圖證據與小動脈剖面','Blood evidence and an arteriole cutaway'));
    if(s.view==='focus'){
      const f=original(ctx,D,'blood_smear.png',24,57,435,238);
      focus(ctx,D,f,CROPS[s.component]);
      D.focus(ctx,'blood_smear.png',CROPS[s.component]||CROPS.rbc,[489,63,435,226]);
    }else{
      original(ctx,D,'blood_vessel.png',24,57,435,238);
      const f=original(ctx,D,s.view==='em'?'blood_electron_original.png':'blood_smear.png',483,57,447,238);
      if(s.view!=='em'&&s.component!=='plasma')focus(ctx,D,f,CROPS[s.component],['view','focus']);
    }
    txt(ctx,D,s.view==='focus'?P('染色光學原圖','Stained optical original'):P('課本血管剖面原圖','Textbook vessel cutaway'),24,318,22);
    txt(ctx,D,s.view==='focus'?P('同一張原圖放大','Same image, enlarged'):s.view==='em'?P('著色電子顯微影像','Colourised electron image'):P('染色光學血抹片','Stained optical blood smear'),483,318,22);
    const routes=[BLOOD_MAIN,BLOOD_BRANCH], radii=[39,21];
    tubes(ctx,routes,radii,8,5);
    ctx.save();clipTubes(ctx,routes,radii);
    const all=cells(BLOOD_MAIN,t,[-27,-9,9,27],33,38,7.5);
    all.forEach(p=>{
      // Replace reserved neighbouring RBC slots, so larger WBCs do not overlap.
      if(p.row===1&&(p.index===5||p.index===18))wbc(ctx,p.x,p.y,12);
      else if(!(p.row===2&&(p.index===5||p.index===18)))rbc(ctx,p.x,p.y,p.r,.95,p.angle);
    });
    renderCells(ctx,cells(BLOOD_BRANCH,t,[-8,8],32,29,7).filter(p=>p.d>86),1);
    for(let i=0;i<23;i++){
      const p=at(BLOOD_MAIN,mod(t*38+i*39.7,BLOOD_MAIN.length),(i%2?18:-18));platelet(ctx,p.x,p.y,3);
    }
    if(s.component==='plasma')for(let i=0;i<13;i++){
      const p=at(BLOOD_MAIN,mod(t*38+i*67,BLOOD_MAIN.length),i%2?0:34);
      ellipse(ctx,p.x,p.y,1.8,1.8,'#f4e4ad');
    }
    ctx.restore();
    if(s.task==='repair'){
      const p=clamp(s.repair||0);s.repair=clamp(p+dt*.14);
      const injury=at(BLOOD_MAIN,620,-39);
      ctx.save();ctx.translate(injury.x,injury.y);ctx.rotate(injury.angle);
      ctx.fillStyle=BG;ctx.fillRect(-15,-13,30,15);
      for(let i=0;i<16;i++){
        const u=clamp(p*1.7-i*.035),a=[-96+i*4,17+(i%3)*6],b=[-13+(i%5)*6,-1+Math.floor(i/5)*5];
        platelet(ctx,mix(a[0],b[0],smooth(u)),mix(a[1],b[1],smooth(u)),4);
      }
      if(p>.35)for(let i=0;i<8;i++)line(ctx,[[-17,1+i*2],[16,15-i*2]],'#f2ecd9b0',1);
      ctx.restore();
    }
    // Legend separate from cells; no explanatory prose squeezed into the lumen.
    rbc(ctx,38,555,10,1);txt(ctx,D,P('無核紅血球','Red cell · no nucleus'),58,562,18);
    wbc(ctx,329,555,12);txt(ctx,D,P('有核白血球','White cell · nucleus'),349,562,18);
    platelet(ctx,621,555,5);txt(ctx,D,P('血小板','Platelets'),638,562,18);
    txt(ctx,D,P('模型非實拍；數量非血球計數。','Model, not footage; counts are illustrative.'),24,592,22,'#b9cbbd');
    return {redCells:all.length-4,whiteCells:2,arterialValves:0};
  }
  function separationDraw(ctx,s,t,D){
    base(ctx,D,P('同一管血液，離心分層','One blood sample, separated'));
    original(ctx,D,'blood_smear.png',24,74,457,388);
    txt(ctx,D,P('染色光學血抹片','Stained optical blood smear'),24,497,22);
    ctx.save();ctx.beginPath();ctx.roundRect(569,85,183,420,65);
    ctx.fillStyle=gradient(ctx,569,0,752,0,[[0,'#9c8558'],[.25,'#ecdaa6'],[.7,'#e3c98c'],[1,'#aa8559']]);ctx.fill();ctx.clip();
    const sep=s.separation;
    ctx.globalAlpha=sep;ctx.fillStyle='#772d3d';ctx.fillRect(569,316,183,189);
    ctx.fillStyle='#e3dbcd';ctx.fillRect(569,311,183,5);ctx.globalAlpha=1;
    for(let i=0;i<54;i++){
      const x=593+(i%6)*26,y=112+Math.floor(i/6)*43;
      rbc(ctx,x,mix(y,333+Math.floor(i/6)*18,sep),9,.3,(i%3)*.3);
    }
    for(let i=0;i<3;i++)wbc(ctx,606+i*41,mix(160+i*100,314,sep),mix(10,2.2,sep));
    for(let i=0;i<8;i++)platelet(ctx,590+i*20,mix(170+i*34,314,sep),mix(3,1,sep));
    ctx.restore();ctx.strokeStyle='#e8d6bc';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(569,85,183,420,65);ctx.stroke();
    textWrap(ctx,D,P('血漿\n約 55%','Plasma ≈ 55%'),780,166,162,22,'#e9ce85');
    textWrap(ctx,D,P('白血球與血小板薄層','Thin white-cell and platelet layer'),780,286,157,22);
    textWrap(ctx,D,P('紅血球為主\n約 45%','Mostly red cells ≈ 45%'),780,411,157,22,'#fde047');
    txt(ctx,D,P('加抗凝劑；比例為概略示意，非個人實測。','Anticoagulated sample; approximate fractions, not a personal test.'),24,562,22);
    D.hit(569,85,183,226,'component','plasma');D.hit(569,311,183,18,'component','wbc');D.hit(569,329,183,176,'component','rbc');
  }

  function pulseDraw(ctx,s,t,D){
    if(s.view==='fish')return null;
    const b=D.pulseBounds||{x:370,y:514,w:560,h:54};
    const compact=b.h<150, label=compact?18:22;
    ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();
    ctx.fillStyle=BG;ctx.fillRect(b.x,b.y,b.w,b.h);
    const cy=b.y+(compact?18:b.h*.47), r=compact?5:Math.min(38,b.h*.14);
    const route=curve([[b.x+22,cy],[b.x+b.w*.33,cy- (compact?0:14)],[b.x+b.w*.65,cy+ (compact?0:18)],[b.x+b.w-18,cy]]);
    const wall=d=>r+(compact?3:13)*pulseProfile(d,t,2.8,520);
    tubes(ctx,[route],[wall],compact?2:13,compact?1:5);
    ctx.save();clipTubes(ctx,[route],[wall]);
    const flowTime=pulseDisplacement(t)/46;
    renderCells(ctx,cells(route,flowTime,compact?[0]:[-r*.60,0,r*.60],compact?24:37,46,compact?3:8),1);ctx.restore();
    if(!compact){
      txt(ctx,D,P('動脈壁：局部擴張 → 回彈','Arterial wall: expansion → recoil'),b.x+18,b.y+31,22,'#fde047');
      for(const fraction of [.25,.52,.78]){
        const d=route.length*fraction,p=at(route,d),rr=wall(d);
        line(ctx,[[p.x,p.y-rr-21],[p.x,p.y-rr-5]],'#fde047',2);
        line(ctx,[[p.x-4,p.y-rr-11],[p.x,p.y-rr-5],[p.x+4,p.y-rr-11]],'#fde047',2);
      }
      txt(ctx,D,P('壁上的脈波傳得比血球快。','The wall pulse travels faster than the cells.'),b.x+18,b.y+b.h-48,22);
    }
    txt(ctx,D,P('脈波沿壁傳播・非你的實測脈搏','Travelling wall pulse · not your measured pulse'),b.x+18,b.y+b.h-5,label,'#b9cbbd');
    ctx.restore();
    return {period:2.8,waveSpeed:520,cellMeanSpeed:46+90*.21,simulation:true,bounds:{...b}};
  }

  root.HumanTransportCutaways=Object.freeze({heartDraw,vesselsDraw,bloodDraw,pulseDraw,heartExplain,timeline,
    // Read-only numerical hooks let the optional validator exercise the SAME
    // geometry used by rendering, rather than a second approximate model.
    geometry:Object.freeze({curve,at,cells,pulseProfile,pulseDisplacement,veinMotion,stepVein,
      vesselMain:VESSEL_MAIN,vesselBranch:VESSEL_BRANCH,bloodMain:BLOOD_MAIN,bloodBranch:BLOOD_BRANCH,heartRegions:HEART_REGIONS})});
})(globalThis);

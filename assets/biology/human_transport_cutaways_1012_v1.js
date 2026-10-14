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
  // Merge the two cutaway outlines before painting. In particular, a branch
  // has no cut end or separate shadow crossing the parent vessel's lumen.
  function tubeOutline(route, radius, extra = 0) {
    const side = sign => route.samples.map(p => {
      const r = (typeof radius === 'function' ? radius(p.d) : radius) + extra;
      return {x:p.x+p.nx*r*sign,y:p.y+p.ny*r*sign};
    });
    return [...side(1), ...side(-1).reverse()];
  }
  function insideOutline(p, polygon) {
    let inside = false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
      const a=polygon[i],b=polygon[j];
      if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
  }
  function joinedOutlines(routes, radii, extra = 0) {
    const polygons=routes.map((r,i)=>tubeOutline(r,radii[i],extra));
    if(polygons.length===1)return polygons;
    const edges=polygons.map(p=>p.map((a,i)=>({a,b:p[(i+1)%p.length],cuts:[{u:0,p:a},{u:1,p:p[(i+1)%p.length]}]})));
    let crossings=0;
    for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++)for(const a of edges[i])for(const b of edges[j]) {
      if(Math.max(a.a.x,a.b.x)<Math.min(b.a.x,b.b.x)||Math.max(b.a.x,b.b.x)<Math.min(a.a.x,a.b.x)||
        Math.max(a.a.y,a.b.y)<Math.min(b.a.y,b.b.y)||Math.max(b.a.y,b.b.y)<Math.min(a.a.y,a.b.y))continue;
      const ax=a.b.x-a.a.x,ay=a.b.y-a.a.y,bx=b.b.x-b.a.x,by=b.b.y-b.a.y,den=ax*by-ay*bx;
      if(Math.abs(den)<1e-9)continue;
      const dx=b.a.x-a.a.x,dy=b.a.y-a.a.y,u=(dx*by-dy*bx)/den,v=(dx*ay-dy*ax)/den;
      if(u<0||u>1||v<0||v>1)continue;
      const p={x:a.a.x+ax*u,y:a.a.y+ay*u,junction:true};
      a.cuts.push({u,p});b.cuts.push({u:v,p});crossings++;
    }
    if(!crossings)return polygons.filter((p,i)=>!polygons.some((other,k)=>k!==i&&insideOutline(p[0],other)));
    const segments=[];
    edges.forEach((list,i)=>list.forEach(e=>{
      e.cuts.sort((a,b)=>a.u-b.u);
      for(let j=0;j<e.cuts.length-1;j++) {
        const a=e.cuts[j],b=e.cuts[j+1];if(b.u-a.u<1e-9)continue;
        if(!polygons.some((other,k)=>k!==i&&insideOutline({x:(a.p.x+b.p.x)/2,y:(a.p.y+b.p.y)/2},other)))segments.push({a:a.p,b:b.p});
      }
    }));
    const key=p=>`${p.x.toFixed(5)},${p.y.toFixed(5)}`,next=new Map(segments.map(s=>[key(s.a),s]));
    const contours=[];
    while(next.size) {
      const first=next.values().next().value,start=key(first.a),contour=[];let edge=first;
      while(edge) {
        contour.push(edge.a);next.delete(key(edge.a));
        if(key(edge.b)===start)break;
        edge=next.get(key(edge.b));
      }
      if(contour.length>2)contours.push(contour);
    }
    return contours;
  }
  const outlineCache=new WeakMap(),routeIds=new WeakMap();let routeSerial=0;
  function cachedOutlines(routes,radii,extra){
    // Exact same numeric union, cached only for immutable sampled routes and
    // numeric radii. Dynamic pulse-radius functions still compute every frame.
    if(radii.some(r=>typeof r!=='number'))return joinedOutlines(routes,radii,extra);
    let cache=outlineCache.get(routes[0]);if(!cache){cache=new Map();outlineCache.set(routes[0],cache);}
    const ids=routes.map(r=>{if(!routeIds.has(r))routeIds.set(r,++routeSerial);return routeIds.get(r);});
    const key=JSON.stringify([ids,radii,extra]);
    if(!cache.has(key))cache.set(key,joinedOutlines(routes,radii,extra));
    return cache.get(key);
  }
  function joinedPath(ctx, routes, radii, extra = 0) {
    ctx.beginPath();
    for(const original of cachedOutlines(routes,radii,extra)) {
      let points=original.slice();
      // Only soften the explicitly authorised branch junction. Sampled bends,
      // vessel endpoints and the blood-cell centreline remain untouched.
      for(let i=points.length-1;i>=0;i--)if(points[i]?.junction) {
        const corner=points[i],reach=18+Math.max(0,extra)*.3;
        let before=i,after=i,db=0,da=0;
        while(db<reach&&before>0){db+=Math.hypot(points[before].x-points[before-1].x,points[before].y-points[before-1].y);before--;}
        while(da<reach&&after<points.length-1){da+=Math.hypot(points[after].x-points[after+1].x,points[after].y-points[after+1].y);after++;}
        if(before<i&&after>i){points.splice(before,after-before+1,points[before],{...points[after],control:corner});i=before;}
      }
      points.forEach((p,i)=>{
        if(!i)ctx.moveTo(p.x,p.y);
        else if(p.control)ctx.quadraticCurveTo(p.control.x,p.control.y,p.x,p.y);
        else ctx.lineTo(p.x,p.y);
      });ctx.closePath();
    }
  }
  function tubes(ctx, routes, radii, muscle = 18, wall = 7) {
    const bounds = routes.flatMap(r => r.samples), ymin = Math.min(...bounds.map(p=>p.y))-90, ymax = Math.max(...bounds.map(p=>p.y))+90;
    const layers = [
      [muscle+wall, [[0,'#754949'],[.3,'#bf8279'],[.52,'#e7b39a'],[.8,'#965954'],[1,'#57363d']]],
      [muscle, [[0,'#8b454e'],[.3,'#d88c86'],[.6,'#b75f64'],[1,'#67343f']]],
      [3, [[0,'#ba8b65'],[.5,'#e7c896'],[1,'#a47559']]],
      [0, [[0,'#b9ac79'],[.28,'#efe5b9'],[.48,'#fff5cf'],[.7,'#f0e4b1'],[1,'#c4b783']]]
    ];
    for (const [extra, colors] of layers) {
      joinedPath(ctx,routes,radii,extra);
      ctx.fillStyle=gradient(ctx,0,ymin,0,ymax,colors);ctx.fill();
    }
    // A single continuous inner rim shades the merged lumen. Painting shadows
    // once per route used to leave a diagonal doubled-shadow seam at the fork.
    ctx.save();clipTubes(ctx,routes,radii);
    joinedPath(ctx,routes,radii);ctx.lineJoin='round';ctx.lineCap='round';
    for(let band=7;band>0;band--){ctx.lineWidth=band*3;ctx.strokeStyle='rgba(57,32,30,.042)';ctx.stroke();}
    ctx.restore();
    joinedPath(ctx,routes,radii,muscle*.58);
    ctx.strokeStyle=gradient(ctx,0,ymin,0,ymax,[[0,'#f3bba480'],[.6,'#d9a18a60'],[1,'#552f3860']]);
    ctx.lineWidth=1.6;ctx.lineJoin='round';ctx.stroke();
  }
  function clipTubes(ctx,routes,radii) {joinedPath(ctx,routes,radii);ctx.clip();}
  // Stable seeded irregularity, never Math.random() during a redraw: each cell
  // keeps its own offset/tilt, so pause and language changes do not reshuffle it.
  function scatter(n) {const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);}
  function cells(route, time, lanes, spacing, speed, radius=9) {
    const count=Math.max(1,Math.floor(route.length/spacing)), pitch=route.length/count, result=[];
    lanes.forEach((lane,row)=>{
      for(let i=0;i<count;i++) {
        const seed=i+row*137,offset=(scatter(seed)-.5)*pitch*.30;
        const d=mod(time*speed+i*pitch+scatter(row+731)*pitch+offset,route.length);
        const lateral=lanes.length===1?0:(scatter(seed+901)-.5)*2.3;
        result.push({...at(route,d,lane+lateral),r:radius*(.92+.17*scatter(seed+231)),tilt:(scatter(seed+19)-.5)*1.35,row,index:i});
      }
    });return result;
  }
  function renderCells(ctx,arr,oxygen){arr.forEach(p=>rbc(ctx,p.x,p.y,p.r,oxygen,p.angle+(p.tilt||0)));}
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
  const BLOOD_MAIN=curve([[40,461],[314,414],[560,540],[920,447]]);
  const BLOOD_BRANCH=curve([[533,474],[641,477],[704,378],[899,381]]);

  // ── Teacher-authorised vessel redraw · 2026-10-14 ─────────────────────────
  // Artery: fast pulsatile flow, the lumen is packed but single cells blur.
  // Capillary: one endothelial layer; the narrowest lumen fits one red cell.
  // Vein: pocket valves visibly coapt; while closed the blood column stops.
  const VEIN_VALVES=Object.freeze({heart:250,far:665});
  const VEIN_FORWARD=70, VEIN_SQUEEZE=95, VEIN_COLUMN=30;
  function veinMotion(t,squeeze){
    const u=mod(t/3.6), active=!!squeeze, forward=u<.48;
    const contraction=active&&forward?Math.sin(Math.PI*u/.48):0;
    const refill=active&&!forward?Math.sin(Math.PI*(u-.48)/.52):0;
    // Slowed teaching rhythm: forward pressure opens; reflux tendency closes.
    const openWindow=(a,b)=>u>=a&&u<b?smooth((u-a)/.06)*smooth((b-u)/.06):0;
    const downstreamAperture=openWindow(0,.48),upstreamAperture=active?openWindow(.48,1):downstreamAperture;
    return {u,contraction,refill,forward,squeeze:active,open:downstreamAperture,
      upstreamOpen:active?!forward:forward,downstreamOpen:forward,
      upstreamAperture,downstreamAperture,pressureDemo:!active};
  }
  // Speed toward the heart (toward smaller d). Blood is not compressed against
  // a closed valve: on that side of the valve the whole column simply stops.
  function veinVelocity(d,m){
    if(!m.squeeze)return VEIN_FORWARD*m.downstreamAperture;
    const a=VEIN_VALVES.heart,b=VEIN_VALVES.far,f=clamp((d-a)/(b-a));
    if(m.forward){const v=VEIN_SQUEEZE*m.downstreamAperture*m.contraction;return d<a?v:d>b?0:v*(1-f);}
    const v=VEIN_SQUEEZE*.923*m.upstreamAperture*m.refill;return d<a?0:d>b?v:v*f;
  }
  function veinColumn(serial,at,lanes,jitterAlong,jitterLane,radius){
    return lanes.map((lane,k)=>{const seed=serial*11+k*3;return{d:at+(scatter(seed+5)-.5)*jitterAlong,
      lane:lane+(scatter(seed+71)-.5)*jitterLane,tilt:(scatter(seed+139)-.5)*1.4,r:radius*(.92+.16*scatter(seed+211))};});
  }
  function veinPopulation(length,column,lanesFor,jitterAlong,jitterLane,radius,start){
    const cells=[];let serial=0,tail=start;
    for(let d=start;d<=length+24;d+=column){cells.push(...veinColumn(serial,d,lanesFor(serial),jitterAlong,jitterLane,radius));tail=d;serial++;}
    return {cells,tail,serial};
  }
  const MAIN_LANES=n=>n%2?[-21,-7,7,21]:[-28,-14,0,14,28];
  function stepVein(pool,dt,motion,length){
    // pool={main}: its cells, the last spawned column and a
    // serial so every new cell receives stable seeded jitter (no Math.random).
    const advance=(group,speedAt,spawnAt,column,lanes,jA,jL,radius,remove)=>{
      for(const p of group.cells)p.d-=speedAt(p.d)*dt;
      group.tail-=speedAt(spawnAt)*dt;
      while(group.tail+column<=spawnAt){group.tail+=column;const n=group.serial++;group.cells.push(...veinColumn(n,group.tail,lanes(n),jA,jL,radius));}
      group.cells=group.cells.filter(p=>p.d>=remove);
    };
    advance(pool.main,d=>veinVelocity(d,motion),length+24,VEIN_COLUMN,MAIN_LANES,18,7,8.2,-26);
    return pool;
  }
  function newVeinPool(){
    return {main:veinPopulation(VESSEL_MAIN.length,VEIN_COLUMN,MAIN_LANES,18,7,8.2,-24)};
  }
  // One pocket valve in a longitudinal section. Local +x points toward the
  // heart. Cusps are attached at x=0 on each wall; their free edges point
  // toward the heart. Open: flat against the wall. Closed: free edges meet in
  // the centre, so blood cannot slip back past the valve.
  function venousLeaflets(ctx,r,aperture){
    const L=r*1.28;
    for(const side of [-1,1]){
      const base={x:0,y:side*r},tip={x:L*(.84+.16*aperture),y:side*(r-6)*aperture};
      const ctrl={x:L*(.18+.34*aperture),y:side*mix(r*.30,r-3,aperture)};
      ctx.lineCap='round';ctx.lineJoin='round';
      for(const [w,color] of [[8.5,'#6f3f3a'],[5.2,'#f4e2bf']]){
        ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.quadraticCurveTo(ctrl.x,ctrl.y,tip.x,tip.y);
        ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();
      }
    }
  }
  function venousValve(ctx,route,d,r,aperture){
    // Flow in the vein model runs toward smaller d, so +x faces -tangent.
    const p=at(route,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+Math.PI);
    venousLeaflets(ctx,r,aperture);ctx.restore();
  }
  function vesselsDraw(ctx,s,t,D){
    const dt=dtFor(s,t,D,'vesselTime'), memory=memories.get(s);
    const motion=veinMotion(t,s.squeeze);
    if(!memory.veinPool)memory.veinPool=newVeinPool();
    stepVein(memory.veinPool,dt,motion,VESSEL_MAIN.length);
    base(ctx,D,P('血管剖面：沿著管腔走','Vessel cutaways: follow the lumen'));
    if(s.view==='micrograph'||s.view==='capillary'){
      original(ctx,D,s.view==='micrograph'?'vessel_photo.png':'capillary_micrograph.png',24,60,530,244);
      original(ctx,D,'vessel_atlas.png',584,60,346,244);
      txt(ctx,D,P('光學顯微影像','Optical micrograph'),24,327,22);
      txt(ctx,D,P('課本構造原圖','Textbook anatomy'),584,327,22);
      // Evidence remains selectable; the model occupies the lower half here.
      ctx.save();ctx.translate(230,260);ctx.scale(.52,.52);
      drawVesselModel(ctx,s,t,D,memory.veinPool);ctx.restore();
      txt(ctx,D,P('下方為動態教學模型','Animated teaching model below'),24,580,22,'#b9cbbd');
    }else{
      drawVesselModel(ctx,s,t,D,memory.veinPool);
      original(ctx,D,'vessel_atlas.png',25,60,171,125);
      txt(ctx,D,P('構造原圖','Source anatomy'),26,207,18,'#b9cbbd');
      const name=s.vessel==='vein'?P('靜脈・回到心臟','Vein · toward the heart'):s.vessel==='capillary'?P('微血管・單列慢行','Capillaries · single file'):P('動脈・離開心臟','Artery · away from the heart');
      txt(ctx,D,name,237,91,26,'#fde047');
      txt(ctx,D,P('放大剖面示意・各圖不同比例','Enlarged cutaway · scales differ'),237,128,22,'#b9cbbd');
      if(s.vessel!=='capillary'){
        const vein=s.vessel==='vein';
        txt(ctx,D,vein?P('← 流回心臟','← Toward the heart'):P('由心臟送出 →','From the heart →'),24,240,22,'#f2ecd9');
        txt(ctx,D,P('外膜','Outer layer'),74,513,22);
        txt(ctx,D,vein?P('肌層較薄','Thinner muscle'):P('肌層較厚','Thicker muscle'),304,513,22);
        txt(ctx,D,P('內膜','Inner lining'),573,513,22);
        line(ctx,[[104,485],[119,403]],'#d5a59b',1.5);
        line(ctx,[[350,485],[346,392]],'#d5a59b',1.5);
        line(ctx,[[618,485],[620,410]],'#e7c896',1.5);
        if(vein){
          // Name the valve that is actually drawn, beside the heart-side cusps.
          const v=at(VESSEL_MAIN,VEIN_VALVES.far);
          txt(ctx,D,P('靜脈瓣','Venous valve'),v.x-6,v.y-87,22,'#fde047','right');
          line(ctx,[[v.x-12,v.y-79],[v.x,v.y-53]],'#fde047',1.5);
        }
      }else{
        const mid=at(CAPILLARY,CAPILLARY.length/2),w=capillaryRadius(CAPILLARY.length/2)+CAPILLARY_WALL;
        txt(ctx,D,P('最細處：只容一顆紅血球通過','Narrowest: room for just one red cell'),mid.x,mid.y-w-46,22,'#fde047','center');
        line(ctx,[[mid.x,mid.y-w-38],[mid.x,mid.y-w-4]],'#fde047',1.5);
        const wallAt=at(CAPILLARY,CAPILLARY.length*.79),ww=capillaryRadius(CAPILLARY.length*.79)+CAPILLARY_WALL;
        line(ctx,[[wallAt.x,wallAt.y+ww-3],[wallAt.x,wallAt.y+ww+38]],'#d4daa8',1.5);
        txt(ctx,D,P('管壁：只有一層細胞','Wall: a single cell layer'),wallAt.x,wallAt.y+ww+66,22,'#d4daa8','center');
        txt(ctx,D,P('小動脈端 →','Arteriole end →'),24,410,22,'#f2ecd9');
        txt(ctx,D,P('→ 小靜脈端','→ Venule end'),936,410,22,'#f2ecd9','right');
      }
      const note=s.vessel==='vein'?(s.squeeze?P('肌肉擠壓：靠心端開、遠心端關；放鬆時相反。','Muscle squeeze: heart-side opens, far-side closes; release reverses them.'):
        P('順流時瓣膜被推開；血液想倒流時，瓣膜閉合擋住，血流停住。','Forward flow pushes the valves open; when blood tends to flow back, they close and the flow stops.')):
        s.vessel==='capillary'?P('管壁只有一層細胞；紅血球排成單列、流得最慢，留在管內。','The wall is one cell thick; red cells pass in single file, slowest of all, and stay inside.'):
          P('血流快又有脈動：管內擠滿血球，只是快到看不清單顆；動脈沒有靜脈瓣。','Fast, pulsing flow: the lumen is packed with cells, but they move too fast to see one by one. Arteries have no venous valves.');
      textWrap(ctx,D,note,24,560,912,22);
    }
    if(D.status)D.status(s.vessel==='vein'?(s.squeeze?(motion.forward?P('擠壓送血：靠心端瓣膜開，遠心端瓣膜關。','Squeeze: heart-side valve opens; far-side valve closes.'):
      P('放鬆充血：靠心端瓣膜關，遠心端瓣膜開。','Refill: heart-side valve closes; far-side valve opens.')):
      (motion.forward?P('順流壓力推開瓣膜 → 血液朝心臟流。','Forward pressure opens valves → flow toward the heart.'):
        P('瓣膜閉合 → 擋住倒流，血液暫停。','Valves closed → backflow blocked; blood pauses.'))):
      s.circuit==='lung'?P('肺循環：動脈較少氧，靜脈富氧。','Pulmonary circuit: oxygen-poor arteries, oxygen-rich veins.'):
      P('體循環：動脈富氧，靜脈較少氧。','Systemic circuit: oxygen-rich arteries, oxygen-poor veins.'));
  }
  // Capillary close-up: a single gently winding vessel. Lumen half-width is
  // 34 px at the ends and 20 px at the waist; a red cell is 42 px across, so at
  // the waist it just fits and is pressed slightly longer (area kept).
  const CAPILLARY=curve([[70,330],[330,250],[630,410],[890,330]],140);
  const CAPILLARY_WALL=9, CAPILLARY_CELL=21, CAPILLARY_SPEED=24;
  function capillaryRadius(d){return 34-14*Math.exp(-Math.pow((d-CAPILLARY.length/2)/140,2));}
  function capillaryCells(t){
    const n=12,L=CAPILLARY.length+80,weights=Array.from({length:n},(_,i)=>.72+.56*scatter(i+517));
    const total=weights.reduce((a,b)=>a+b,0);let offset=0;
    return weights.map(w=>{const base=offset;offset+=w/total*L;return mod(base+CAPILLARY_SPEED*t,L)-40;});
  }
  function blendedRbc(ctx,r,oxygen){
    rbc(ctx,0,0,r,.25,Math.PI/2);
    const bright=smooth((oxygen-.25)/.75);
    if(bright>.01){ctx.save();ctx.globalAlpha=bright;rbc(ctx,0,0,r,1,Math.PI/2);ctx.restore();}
  }
  function drawCapillary(ctx,s,t){
    const ss=CAPILLARY.samples,R=capillaryRadius,side=(extra,sign)=>ss.map(p=>({x:p.x+p.nx*(R(p.d)+extra)*sign,y:p.y+p.ny*(R(p.d)+extra)*sign}));
    const band=extra=>{const a=side(extra,1),b=side(extra,-1).reverse();ctx.beginPath();[...a,...b].forEach((q,i)=>ctx[i?'lineTo':'moveTo'](q.x,q.y));ctx.closePath();};
    // One endothelial layer (same colours as the lymph close-up cartoon).
    band(CAPILLARY_WALL);ctx.fillStyle='#d4daa8';ctx.fill();ctx.strokeStyle='#6c8b5b';ctx.lineWidth=2;ctx.stroke();
    band(0);ctx.fillStyle=gradient(ctx,0,250,0,410,[[0,'#f7edc5'],[1,'#e6d8a5']]);ctx.fill();
    ctx.strokeStyle='#9aa874';ctx.lineWidth=1.2;ctx.stroke();
    for(const sign of [1,-1])for(let d=sign>0?42:81;d<CAPILLARY.length-10;d+=78){
      const p=at(CAPILLARY,d),r=R(d);
      line(ctx,[[p.x+p.nx*r*sign,p.y+p.ny*r*sign],[p.x+p.nx*(r+CAPILLARY_WALL)*sign,p.y+p.ny*(r+CAPILLARY_WALL)*sign]],'#6c8b5b',1.6);
      const q=at(CAPILLARY,d+39);
      if(d+39<CAPILLARY.length-8){ctx.save();ctx.translate(q.x+q.nx*(R(d+39)+CAPILLARY_WALL*.5)*sign,q.y+q.ny*(R(d+39)+CAPILLARY_WALL*.5)*sign);ctx.rotate(q.angle);
        ellipse(ctx,0,0,9,3.1,'#879165');ctx.restore();}
    }
    const lung=s.circuit==='lung';
    ctx.save();band(0);ctx.clip();
    for(const d of capillaryCells(t)){
      if(d<-30||d>CAPILLARY.length+30)continue;
      const p=at(CAPILLARY,d),room=R(clamp(d,0,CAPILLARY.length))-1,across=Math.min(1,room/CAPILLARY_CELL),along=1/Math.pow(across,.8);
      const u=clamp(d/CAPILLARY.length),oxygen=lung?mix(.25,1,u):mix(1,.25,u);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(along,across);blendedRbc(ctx,CAPILLARY_CELL,oxygen);ctx.restore();
    }
    ctx.restore();
  }
  // Artery: packed blood moving fast enough that single cells smear into
  // streaks. Speed surges with each pulse; the centre runs a little faster.
  function arteryFlow(ctx,routes,radii,t,oxygen){
    ctx.save();clipTubes(ctx,routes,radii);
    ctx.fillStyle=oxygen>.6?'#b3212d':'#6c1d2a';ctx.fillRect(0,0,960,600);
    const travel=pulseDisplacement(t)*6;
    routes.forEach((route,k)=>{
      const R=k?23:42;
      for(let lane=-R+3;lane<=R-3;lane+=5){
        const profile=1-.42*Math.pow(lane/R,2),pitch=64+44*scatter(k*97+lane*3.1+400),count=Math.ceil((route.length+140)/pitch);
        for(let i=0;i<count;i++){
          const seed=k*1009+(lane+60)*37+i,len=24+56*scatter(seed+11);
          const d0=mod(i*pitch+scatter(seed)*pitch*.8+travel*profile*(k?.82:1),count*pitch)-70;
          const pts=[];for(let d=Math.max(0,d0);d<=Math.min(route.length,d0+len);d+=8)pts.push(at(route,d,lane));
          if(pts.length<2)continue;
          const light=scatter(seed+29)>.45;
          line(ctx,pts,light?(oxygen>.6?'rgba(255,150,138,.30)':'rgba(196,96,104,.30)'):'rgba(58,6,14,.34)',3.2+2.6*scatter(seed+47));
        }
      }
    });
    joinedPath(ctx,routes,radii);ctx.lineJoin='round';
    for(let band=6;band>0;band--){ctx.lineWidth=band*3;ctx.strokeStyle='rgba(40,6,10,.06)';ctx.stroke();}
    ctx.restore();
  }
  function drawVesselModel(ctx,s,t,D,pool){
    const vein=s.vessel==='vein', cap=s.vessel==='capillary', oxygen=s.circuit==='lung'?(vein?1:.25):(vein?.25:1);
    if(cap){drawCapillary(ctx,s,t);return;}
    const motion=veinMotion(t,s.squeeze), radius=vein?d=>48-10*motion.contraction*Math.exp(-Math.pow((d-460)/145,2)):
      d=>39+7*pulseProfile(d,t);
    // The vein is ONE unbranched vessel: a tributary without its own valves
    // made the closed-valve pause look wrong upstream of the branch point.
    const rr=vein?[radius]:[radius,23], routes=vein?[VESSEL_MAIN]:[VESSEL_MAIN,VESSEL_BRANCH];
    if(vein&&s.squeeze){
      const p=at(VESSEL_MAIN,460), squeeze=motion.contraction*13;
      for(const sign of [-1,1]){
        ellipse(ctx,p.x,p.y+sign*(105-squeeze),117,32,'#753f49','#b77a7a',2);
        for(let k=-3;k<=3;k++)line(ctx,[[p.x-80,p.y+sign*(99-squeeze)+k*4],[p.x+82,p.y+sign*(111-squeeze)+k*4]],'#cf8d8860',1);
      }
    }
    tubes(ctx,routes,rr,vein?9:24,7);
    if(!vein)arteryFlow(ctx,routes,rr,t,oxygen);
    else{
      ctx.save();clipTubes(ctx,routes,rr);
      const place=(route,list)=>list.map(p=>({...p,...at(route,p.d,p.lane)}));
      renderCells(ctx,place(VESSEL_MAIN,pool.main.cells.filter(p=>p.d>=-20&&p.d<=VESSEL_MAIN.length+20)),oxygen);
      ctx.restore();
      // Valves are drawn last so the cusps are never hidden behind cells.
      venousValve(ctx,VESSEL_MAIN,VEIN_VALVES.heart,radius(VEIN_VALVES.heart),motion.downstreamAperture);
      venousValve(ctx,VESSEL_MAIN,VEIN_VALVES.far,radius(VEIN_VALVES.far),motion.upstreamAperture);
    }
    // Cross-sectional rim at the cut end displays three concentric tissue layers.
    const end=VESSEL_MAIN.samples[0], r=radius(0);
    ctx.save();ctx.translate(end.x,end.y);ctx.rotate(end.angle);
    ellipse(ctx,0,0,16,r+(vein?16:31),'#b88078','#edb59d',1);
    ellipse(ctx,0,0,12,r+(vein?9:24),'#a44f5b','#e79b91',1);
    ellipse(ctx,0,0,9,r+3,'#e3bc87');ellipse(ctx,0,0,7,r,vein?'#c4b783':(oxygen>.6?'#9e1f2b':'#5e1a26'));ctx.restore();
  }

  const CROPS={rbc:[.49,.34,.10,.13],wbc:[.414,.493,.10,.14],platelet:[.829,.863,.049,.067],plasma:[0,0,1,1]};
  // Teacher-authorized injury model. The ordinary blood/centrifuge drawings
  // retain their original routes; this enlarged window has its own geometry.
  const REPAIR_ROUTE=curve([[64,343],[326,315],[637,384],[897,347]]);
  const REPAIR_D=440,REPAIR_RADIUS=65;
  const REPAIR_ANCHOR=at(REPAIR_ROUTE,REPAIR_D);
  const repairSeed=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const repairWorld=p=>({x:REPAIR_ANCHOR.x+Math.cos(REPAIR_ANCHOR.angle)*p[0]-Math.sin(REPAIR_ANCHOR.angle)*p[1],
    y:REPAIR_ANCHOR.y+Math.sin(REPAIR_ANCHOR.angle)*p[0]+Math.cos(REPAIR_ANCHOR.angle)*p[1]});
  const REPAIR_STAGES=Object.freeze([
    {id:'bleeding',progress:.06,name:P('受傷、出血','Injury / bleeding'),text:P('管壁破裂，血液從破口流到周圍組織；局部血管收縮，減少出血。','A wall injury lets blood escape into surrounding tissue. Local vessel constriction reduces bleeding.')},
    {id:'platelets',progress:.32,name:P('血小板抵達','Platelets arrive'),text:P('血小板隨血流抵達傷口，黏附在受損管壁，再活化、招來更多血小板。','Flowing platelets reach the wound, adhere to the damaged wall, activate and recruit more platelets.')},
    {id:'fibrin',progress:.62,name:P('纖維蛋白加固','Fibrin reinforces'),text:P('血小板栓先減少外漏；凝血形成纖維蛋白網，網住血小板與血球，加固血塊。','A platelet plug reduces leakage. Coagulation forms fibrin that traps platelets and blood cells, reinforcing the clot.')},
    {id:'sealed',progress:1,name:P('封住破口、止血','Sealed / bleeding stops'),text:P('破口被血塊封住，外漏停止；其餘管腔仍讓血液通過。止血不是整條血管凝固。','The clot seals the wound and leakage stops. Blood still passes through the remaining lumen; the whole vessel does not clot.')}
  ]);
  function hemostasisFrame(progress){
    const p=clamp(progress),seconds=p*20;
    const stage=REPAIR_STAGES[seconds<3?0:seconds<8?1:seconds<15.5?2:3];
    const constriction=7*smooth(p/.14);
    const radius=d=>REPAIR_RADIUS-constriction*Math.exp(-(((d-REPAIR_D)/105)**2));
    // The puncture cuts completely through endothelium, muscle and outer coat.
    const edgeY=-(radius(REPAIR_D)+6),gap=[[-38,-99],[38,-99],[32,-48],[-32,-48]].map(repairWorld);
    const platelets=Array.from({length:34},(_,i)=>{
      const arrivalStart=1.6+i*.22,travel=1.1+repairSeed(i+400)*.5;
      const target=[i<2?(i?-31:31):(repairSeed(i+100)-.5)*57,edgeY-2-repairSeed(i+200)*12];
      const start=at(REPAIR_ROUTE,REPAIR_D-235+(i%5)*19,(repairSeed(i+300)-.5)*58);
      const a=repairWorld([-150,-24]),b=repairWorld([-49,-44]),end=repairWorld(target);
      const route=curve([[start.x,start.y],[a.x,a.y],[b.x,b.y],[end.x,end.y]]);
      const u=clamp((seconds-arrivalStart)/travel);
      return {index:i,start,target,end,route,u,visible:seconds>=arrivalStart,bound:u===1,position:at(route,route.length*smooth(u))};
    });
    const leak=1-smooth((p-.18)/.60),fibrin=smooth((p-.40)/.35);
    const escaped=[];
    for(let i=0;i<38;i++){
      const born=.35+i*.43,atBirth=1-smooth((born/20-.18)/.60);
      if(seconds<born||repairSeed(i+500)>atBirth)continue;
      const end=[92+repairSeed(i+600)*47,-148+(repairSeed(i+700)-.5)*29];
      const local=[[-9+repairSeed(i+800)*18,-48],[-5,-99],[52,-143],end];
      const pts=local.map(repairWorld),route=curve(pts.map(q=>[q.x,q.y]));
      const u=clamp((seconds-born)/(1.15+repairSeed(i+900)*.45));
      escaped.push({index:i,born,u,route,position:at(route,route.length*u),deposited:u===1});
    }
    return {progress:p,seconds,stage,constriction,radius,edgeY,gap,platelets,escaped,leak,fibrin,
      adhered:platelets.filter(q=>q.bound).length,sealed:leak<.001,injury:REPAIR_ANCHOR};
  }
  function hemostasisExplain(s){
    const q=hemostasisFrame(s.repair||0);
    return {title:q.stage.name,text:q.stage.text.map((p,i)=>p+'\n\n'+P(
      '這些機制會重疊進行。血小板在傷口黏附、聚集；凝血反應形成的纖維蛋白網再把血塊加固。動畫是放大、分段教學，不是真實時間或血球比例。',
      'These mechanisms overlap. Platelets adhere and aggregate at the wound; fibrin produced by coagulation then stabilizes the clot. This enlarged, staged model is not real timing or cell proportions.')[i])};
  }
  function hemostasisDraw(ctx,s,t,D,dt){
    if(!s.repairStage||s.repairStage==='auto')s.repair=clamp((s.repair||0)+dt/20);
    const q=hemostasisFrame(s.repair||0);s.hemostasisTrace={progress:q.progress,stage:q.stage.id,adhered:q.adhered,leak:q.leak,fibrin:q.fibrin,escaped:q.escaped.length,sealed:q.sealed};
    base(ctx,D,P('止血：先到傷口，再把破口封住','Hemostasis: reach the wound, then seal it'));
    txt(ctx,D,q.stage.name,24,79,26,'#55e9ff');
    // Exclude the real opening while drawing the continuous vessel wall.
    ctx.save();ctx.beginPath();ctx.rect(0,0,960,600);q.gap.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p.x,p.y));ctx.closePath();ctx.clip('evenodd');
    tubes(ctx,[REPAIR_ROUTE],[q.radius],12,5);ctx.restore();
    ctx.save();clipTubes(ctx,[REPAIR_ROUTE],[q.radius]);
    const main=cells(REPAIR_ROUTE,t,[-40,-14,14,40],35,42,8);
    main.forEach(p=>{if(p.row===1&&p.index===10)wbc(ctx,p.x,p.y,13);else if(!(p.row===2&&p.index===10))rbc(ctx,p.x,p.y,p.r,.9,p.angle+p.tilt);});
    for(let i=0;i<27;i++){const p=at(REPAIR_ROUTE,mod(t*42+i*31.7,REPAIR_ROUTE.length),(repairSeed(i+1000)-.5)*82);platelet(ctx,p.x,p.y,3.2);}
    ctx.restore();
    ctx.save();ctx.translate(q.injury.x,q.injury.y);ctx.rotate(q.injury.angle);
    // Exposed wall ends / collagen, at the puncture rather than in midstream.
    for(const sign of [-1,1])for(let i=0;i<4;i++)line(ctx,[[sign*(32+i),q.edgeY-13+i*3],[sign*(27+i),q.edgeY-5+i*2]],'#ebc7a7',2);
    const deposited=q.escaped.filter(p=>p.deposited).length;
    if(q.escaped.length){
      const pooled=smooth(deposited/18);
      ellipse(ctx,111,-149,24+pooled*30,12+pooled*10,gradient(ctx,111,-149,166,-126,[[0,'#c3626680'],[1,'#8f334c55']]));
    }
    if(q.leak>.001){
      ctx.beginPath();ctx.moveTo(0,-49);ctx.bezierCurveTo(-5,-99,52,-143,107,-149);
      ctx.lineCap='round';ctx.lineWidth=17*q.leak;ctx.strokeStyle='#a74655b0';ctx.stroke();
      ctx.lineWidth=6*q.leak;ctx.strokeStyle='#e9978b70';ctx.stroke();
    }
    ctx.restore();
    q.escaped.forEach(p=>rbc(ctx,p.position.x,p.position.y,7+repairSeed(p.index+1100)*2,.7,p.position.angle));
    q.platelets.filter(p=>p.visible&&!p.bound).forEach(p=>platelet(ctx,p.position.x,p.position.y,4.8));
    const bound=q.platelets.filter(p=>p.bound);
    ctx.save();ctx.translate(q.injury.x,q.injury.y);ctx.rotate(q.injury.angle);
    // Platelet plug is localized to the wall. It never fills the entire lumen.
    if(bound.length>6){ctx.globalAlpha=smooth((bound.length-6)/22)*(.7+.3*q.fibrin);ellipse(ctx,0,q.edgeY-2,36,23,'#b887b4');ctx.globalAlpha=1;}
    bound.forEach(p=>platelet(ctx,p.target[0],p.target[1],5.4));
    if(q.fibrin){
      ctx.globalAlpha=q.fibrin;
      for(let i=0;i<9;i++){line(ctx,[[-32,q.edgeY-17+i*3.4],[32,q.edgeY+10-i*3.4]],'#f2ecd9',1.4);line(ctx,[[-30+i*7,q.edgeY-17],[-22+i*6,q.edgeY+11]],'#f2ecd9',1.2);}
      for(let i=0;i<4;i++)rbc(ctx,-21+i*14,q.edgeY-4+(i%2)*7,5.5,.6,i*.2);
      ctx.globalAlpha=1;
    }
    ctx.restore();
    const edge=repairWorld([0,q.edgeY-17]),pool=repairWorld([126,-152]);
    txt(ctx,D,P('受損管壁／破口','Damaged wall / opening'),195,145,22,'#ebc7a7');
    line(ctx,[[398,153],[edge.x-30,edge.y-37],[edge.x,edge.y]],'#ebc7a7',1.5);
    textWrap(ctx,D,q.sealed?P('外漏停止；血液留在周圍組織','Leak stopped; escaped blood remains in tissue'):P('血液從破口流出','Blood escapes through the opening'),708,151,226,22,'#fb923c');
    line(ctx,[[732,187],[pool.x+18,pool.y-5]],'#fb923c',1.5);
    textWrap(ctx,D,q.stage.text,24,470,910,22);
    platelet(ctx,38,548,5);txt(ctx,D,P('血小板黏附、聚集','Platelet adhesion / aggregation'),55,555,20,'#e7c2ed');
    line(ctx,[[441,544],[459,552],[441,552],[459,544]],INK,1.5);txt(ctx,D,P('纖維蛋白網穩固血塊','Fibrin stabilizes the clot'),471,555,20);
    txt(ctx,D,P('機制會重疊；放大模型，非真實時間。','Overlapping mechanisms; enlarged model, not real timing.'),24,592,20,'#b9cbbd');
    D.status(P('傷口外漏 → 血小板黏附、聚集 → 纖維蛋白加固 → 止血；管內血流仍持續。','Leakage → platelet adhesion and aggregation → fibrin reinforcement → hemostasis; lumen flow continues.'));
    return s.hemostasisTrace;
  }
  function bloodDraw(ctx,s,t,D){
    const dt=dtFor(s,t,D,'bloodTime');
    s.separation=clamp((s.separation||0)+((s.targetSeparation||0)-(s.separation||0))*Math.min(1,dt*1.6));
    if(s.task==='separate')return separationDraw(ctx,s,t,D);
    if(s.task==='repair')return hemostasisDraw(ctx,s,t,D,dt);
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
      else if(!(p.row===2&&(p.index===5||p.index===18)))rbc(ctx,p.x,p.y,p.r,.95,p.angle+p.tilt);
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
    ctx.fillStyle=gradient(ctx,569,0,752,0,[[0,'#c4b783'],[.25,'#fff5cf'],[.7,'#f0e4b1'],[1,'#c4b783']]);ctx.fill();ctx.clip();
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

  root.HumanTransportCutaways=Object.freeze({heartDraw,vesselsDraw,bloodDraw,pulseDraw,heartExplain,timeline,hemostasisFrame,hemostasisExplain,hemostasisStages:REPAIR_STAGES,
    render:Object.freeze({tubes,clipTubes,rbc,renderCells,venousLeaflets}),
    // Read-only numerical hooks let the optional validator exercise the SAME
    // geometry used by rendering, rather than a second approximate model.
    geometry:Object.freeze({curve,at,cells,pulseProfile,pulseDisplacement,veinMotion,stepVein,veinVelocity,capillary:CAPILLARY,capillaryRadius,capillaryCell:CAPILLARY_CELL,veinValves:VEIN_VALVES,
      vesselMain:VESSEL_MAIN,vesselBranch:VESSEL_BRANCH,bloodMain:BLOOD_MAIN,bloodBranch:BLOOD_BRANCH,heartRegions:HEART_REGIONS,hemostasisRoute:REPAIR_ROUTE})});
})(globalThis);

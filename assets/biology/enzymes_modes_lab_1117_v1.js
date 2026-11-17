/* biology_enzymes：學生操作／老師講解＋五個「動手做」實驗台（2026-11-17，外層加法）
 * - 模式：學生操作＝每次播一個步驟鈕就停（AGENTS 10.6）；老師講解＝從頭連續播到底、可暫停／重播（10.7）。
 *   只呼叫 enzymes_v3.js 開放的 EnzymesLesson.setStop／pause／restart，不改模型、幾何、繪圖。
 * - 實驗台：每個分頁的動畫下方一張畫布 <key>LabCanvas，重用頁面原本的 EnzymesDraw 繪圖函式，各自一份狀態，
 *   學生用按鈕＋在畫布上「左右拖曳」操作（touch-action: pan-y，不擋垂直捲動）。
 * - 由 enzymes_v3.js 在 build() 之後呼叫 mount(lang)、在唯一的 rAF 裡呼叫 frame(dt, tab, lang)，本檔沒有自己的迴圈。
 */
(function () {
  'use strict';
  const M = window.EnzymesModel, D = window.EnzymesDraw, G = window.EnzymesGeometry;
  const $ = id => document.getElementById(id);
  const KEYS = ['model', 'specificity', 'temperature', 'ph', 'experiment'];
  let lang = 'zh';
  const tr = (z, e) => (lang === 'zh' ? z : e);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, q) => a + (b - a) * q;

  /* ───────── 各實驗台的狀態（切語言、重建 DOM 都保留） ───────── */
  const S = {
    model: Object.assign(M.create(), { tab: 0, mode: 'break', phase: 0, running: false, cycles: 0, rest: 0 }),
    specificity: Object.assign(M.create(), { tab: 1, enzyme: 'amylase', substrate: 'starch', phase: 0, running: false, q: 0, rest: 0 }),
    temperature: Object.assign(M.create(), { tab: 2, temp: 37, damaged: false }),
    ph: Object.assign(M.create(), { tab: 3, ph: 7, phEnzyme: 'stomach' }),
    experiment: { tubes: ['boiled', 'raw'], t: -1 }   // t：-1＝還沒開始；0～RUN＝實驗進行中／完成
  };
  const RUN = 9;   // 實驗台一次跑完的秒數（時間壓縮）
  const drag = { key: null, x0: 0, v0: 0 };

  /* ───────── 文字 ───────── */
  const TITLES = {
    model: ['🖐 動手做：讓同一個酵素一直工作', '🖐 Try it: keep one enzyme working'],
    specificity: ['🖐 動手做：自己配對酵素與受質', '🖐 Try it: pair enzymes and substrates'],
    temperature: ['🖐 動手做：調溫度，看活性怎麼變', '🖐 Try it: change the temperature'],
    ph: ['🖐 動手做：替酵素換酸鹼環境', '🖐 Try it: change the pH'],
    experiment: ['🖐 動手做：自己設計兩支試管', '🖐 Try it: design your own two tubes']
  };
  const HINTS = {
    model: ['在畫布上按住往右拖，讓受質靠近、吻合、反應、離開；往左拖可以倒回去。數數看：同一個酵素能做幾次？', 'Drag right on the canvas to bring the substrate in, bind, react and release; drag left to rewind. Count how many times one enzyme can work.'],
    specificity: ['先選酵素和受質，再在畫布上按住往右拖，把受質送進活性區、放開。形狀不吻合會怎樣？', 'Pick an enzyme and a substrate, then drag right to push the substrate into the active site and let go. What happens if the shapes do not fit?'],
    temperature: ['在畫布上左右拖曳改變溫度。先降溫再回到 37 °C；再試試加熱到很高之後降回來，結果一樣嗎？', 'Drag left or right to change the temperature. Cool it and return to 37 °C; then overheat it and cool it again. Same result?'],
    ph: ['先選一種酵素，再在畫布上左右拖曳改變酸鹼值，找出它最喜歡的環境。', 'Choose an enzyme, then drag left or right to change the pH and find where it works best.'],
    experiment: ['替甲、乙兩支試管各選一種液體，按「開始實驗」。哪一管會出現磚紅色沉澱？清水那一管有什麼用？', 'Choose a liquid for tubes A and B, then press Start. Which tube forms a brick-red precipitate? What is the water tube for?']
  };
  const LIQ = {
    raw: ['生唾液', 'Fresh saliva'],
    boiled: ['煮過的唾液', 'Boiled saliva'],
    water: ['清水', 'Water']
  };

  /* ───────── DOM ───────── */
  function btn(z, e, attr, on) {
    return `<button type="button" class="action-btn ez-btn${on ? ' primary' : ''}" ${attr}>${esc(tr(z, e))}</button>`;
  }
  function controlsHTML(key) {
    const s = S[key];
    if (key === 'model') return `<div class="ez-row">${btn('分解作用', 'Breakdown', 'data-ez="mode:break"', s.mode === 'break')}${btn('合成作用', 'Synthesis', 'data-ez="mode:join"', s.mode === 'join')}${btn('▶ 自動做一次', '▶ Run once', 'data-ez="auto"')}${btn('↺ 次數歸零', '↺ Reset count', 'data-ez="zero"')}</div>`;
    if (key === 'specificity') return `<div class="ez-row"><span class="ez-lbl">${esc(tr('酵素', 'Enzyme'))}</span>${M.pairs.map(p => btn(p.zh, p.en, `data-ez="enz:${p.id}"`, s.enzyme === p.id)).join('')}</div>` +
      `<div class="ez-row"><span class="ez-lbl">${esc(tr('受質', 'Substrate'))}</span>${M.pairs.map(p => btn(p.substrate[0], p.substrate[1], `data-ez="sub:${p.target}"`, s.substrate === p.target)).join('')}</div>`;
    if (key === 'temperature') return `<div class="ez-row">${btn('冰箱 5 °C', 'Fridge 5 °C', 'data-ez="temp:5"', s.temp === 5)}${btn('體溫 37 °C', 'Body 37 °C', 'data-ez="temp:37"', s.temp === 37)}${btn('高溫 65 °C', 'Hot 65 °C', 'data-ez="temp:65"', s.temp === 65)}${btn('換一份新酵素', 'Fresh enzyme', 'data-ez="fresh"')}</div>`;
    if (key === 'ph') return `<div class="ez-row">${M.phSpecs.map(p => btn(p.zh, p.en, `data-ez="phe:${p.id}"`, s.phEnzyme === p.id)).join('')}</div>`;
    const t = S.experiment.tubes;
    return ['甲', '乙'].map((n, i) => `<div class="ez-row"><span class="ez-lbl">${esc(tr(n + '管', i ? 'Tube B' : 'Tube A'))}</span>${Object.keys(LIQ).map(k => btn(LIQ[k][0], LIQ[k][1], `data-ez="tube:${i}:${k}"`, t[i] === k)).join('')}</div>`).join('') +
      `<div class="ez-row">${btn('▶ 開始實驗', '▶ Start', 'data-ez="run"')}${btn('↺ 重來', '↺ Reset', 'data-ez="reset"')}</div>`;
  }
  function panelHTML(key) {
    return `<div class="ez-lab" id="ezlab-${key}"><h3>${esc(tr(...TITLES[key]))}</h3><p class="small-note">${esc(tr(...HINTS[key]))}</p>` +
      `<div class="ez-controls" id="ezctl-${key}">${controlsHTML(key)}</div>` +
      `<canvas id="${key}LabCanvas" class="ez-canvas" width="960" height="620" aria-label="${esc(tr('動手做實驗台', 'Hands-on bench'))}"></canvas>` +
      `<div class="lab-status ez-status" id="ezstatus-${key}" role="status"></div></div>`;
  }
  function teachBarHTML(key) {
    return `<div class="ez-teach" id="ezteach-${key}"><button type="button" class="ez-tbtn" data-tact="pause"></button><button type="button" class="ez-tbtn" data-tact="replay"></button><div class="ez-track"><div class="ez-fill"></div></div><div class="ez-tnote" aria-live="polite"></div></div>`;
  }
  function refreshControls(key) { const el = $('ezctl-' + key); if (el) el.innerHTML = controlsHTML(key); }

  function mount(l) {
    lang = l || lang;
    KEYS.forEach(key => {
      const shell = $('lab-' + key); if (!shell) return;
      shell.insertAdjacentHTML('afterend', teachBarHTML(key) + panelHTML(key));
      const cv = $(key + 'LabCanvas');
      bindCanvas(cv, key);
      $('ezctl-' + key).addEventListener('click', e => { const b = e.target.closest('[data-ez]'); if (b) act(key, b.dataset.ez); });
      $('ezteach-' + key).addEventListener('click', onTeach);
    });
    paintTeach(true);
  }

  /* ───────── 按鈕 ───────── */
  function act(key, cmd) {
    const s = S[key], [a, b, c] = cmd.split(':');
    if (key === 'model') {
      if (a === 'mode') { s.mode = b; s.phase = 0; s.running = false; s.rest = 0; }
      if (a === 'auto') { if (s.phase >= 1) s.phase = 0; s.running = true; s.rest = 0; }
      if (a === 'zero') { s.cycles = 0; s.phase = 0; s.running = false; s.rest = 0; }
    } else if (key === 'specificity') {
      if (a === 'enz') s.enzyme = b;
      if (a === 'sub') s.substrate = b;
      s.phase = 0; s.running = false; s.q = 0; s.dragPoint = null; s.rest = 0;
    } else if (key === 'temperature') {
      if (a === 'temp') setTemp(+b);
      if (a === 'fresh') { s.damaged = false; s.temp = 37; }
    } else if (key === 'ph') {
      if (a === 'phe') s.phEnzyme = b;
    } else {
      if (a === 'tube') { s.tubes[+b] = c; s.t = -1; }
      if (a === 'run') s.t = 0;
      if (a === 'reset') s.t = -1;
    }
    refreshControls(key);
  }
  function setTemp(v) { const s = S.temperature; s.temp = Math.round(clamp(v, 5, 70)); if (s.temp >= 60) s.damaged = true; }

  /* ───────── 畫布拖曳（只用水平位移；垂直留給頁面捲動） ───────── */
  function logicalX(cv, ev) { const r = cv.getBoundingClientRect(); return (ev.clientX - r.left) * 960 / (r.width || 960); }
  function bindCanvas(cv, key) {
    cv.addEventListener('pointerdown', ev => {
      if (key === 'experiment') return;
      drag.key = key; drag.x0 = logicalX(cv, ev);
      const s = S[key];
      drag.v0 = key === 'model' ? s.phase : key === 'specificity' ? s.q : key === 'temperature' ? s.temp : s.ph;
      if (key === 'temperature') setTemp((drag.x0 - 108) / 754 * 70);
      if (key === 'ph') S.ph.ph = Math.round(clamp((drag.x0 - 108) / 754 * 14, 0, 14) * 10) / 10;
      if (key === 'temperature' || key === 'ph') drag.v0 = key === 'temperature' ? S.temperature.temp : S.ph.ph;
      if (key === 'model') { s.running = false; s.rest = 0; if (s.phase >= 1) { s.phase = 0; drag.v0 = 0; } }
      if (key === 'specificity' && (s.running || s.phase > 0)) { drag.key = null; return; }
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    cv.addEventListener('pointermove', ev => {
      if (drag.key !== key) return;
      const dx = logicalX(cv, ev) - drag.x0, s = S[key];
      if (key === 'model') {
        s.phase = clamp(drag.v0 + dx / 640, 0, 1);
        if (s.phase >= 1) { s.cycles++; s.rest = 0.001; drag.key = null; }
      } else if (key === 'specificity') {
        s.q = clamp(drag.v0 + dx / 300, 0, 1);
        s.dragPoint = s.q > 0 ? { x: lerp(195, 480, s.q), y: lerp(235, 360, s.q) } : null;
      } else if (key === 'temperature') setTemp(drag.v0 + dx / 754 * 70);
      else S.ph.ph = Math.round(clamp(drag.v0 + dx / 754 * 14, 0, 14) * 10) / 10;
    });
    const end = () => {
      if (drag.key !== key) return;
      drag.key = null;
      const s = S[key];
      if (key === 'model' && s.phase > 0 && s.phase < 1) s.running = true;          // 放手後自己把這一次反應做完
      if (key === 'specificity') {
        if (s.q > 0.75) { s.dragPoint = null; s.phase = 0.30; s.running = true; }   // 送進活性區
        s.q = 0; if (!s.running) s.dragPoint = null;
      }
      if (key === 'temperature') refreshControls('temperature');
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  }

  /* ───────── 每格：推進與繪圖（只畫目前分頁那一張） ───────── */
  function step(key, dt) {
    const s = S[key];
    if (key === 'model' || key === 'specificity') {
      if (s.running) { M.tick(s, dt); if (!s.running) s.rest = 0.001; }
      else if (s.rest > 0) { s.rest += dt; if (s.rest > 1.6) { s.rest = 0; s.phase = 0; } }
    }
    if (key === 'experiment' && s.t >= 0 && s.t < RUN) s.t = Math.min(RUN, s.t + dt);
  }
  function frame(dt, tab, l) {
    if (l && l !== lang) lang = l;
    paintTeach(false);
    const key = KEYS[tab], cv = $(key + 'LabCanvas'); if (!cv || cv.offsetParent === null) return;
    step(key, dt);
    const c = cv.getContext('2d');
    if (key === 'model' || key === 'specificity') D.molecular(c, S[key], lang);
    else if (key === 'temperature') D.chart(c, S.temperature, lang, false);
    else if (key === 'ph') D.chart(c, S.ph, lang, true);
    else drawExperiment(c);
    status(key);
  }

  /* 甲、乙試管實驗台：用頁面原本的桌子、水浴、試管、本氏液瓶 */
  function drawExperiment(c) {
    const s = S.experiment, t = s.t, run = t >= 0, tubes = s.tubes;
    D.bg(c); D.table(c);
    // 時間軸：0～3 秒 37 °C 作用（壓縮 20 分鐘）→ 3～4.5 秒加本氏液 → 4.5～9 秒一起沸水浴檢驗
    const digest = run ? clamp(t / 3, 0, 1) : 0, ben = run ? clamp((t - 3) / 1.5, 0, 1) : 0, heat = run ? clamp((t - 4.5) / 4.5, 0, 1) : 0;
    const temp = !run ? 22 : t < 4.5 ? 37 : lerp(37, 100, M.smooth(clamp((t - 4.5) / 1.5, 0, 1)));
    D.bath(c, temp, false, run && t >= 4.5, t, lang);
    // 試管架（還沒開始時試管放在架上）
    c.fillStyle = '#9e8867'; D.rr(c, 195, 454, 263, 22, 5); c.fill(); c.fillRect(202, 297, 14, 157); c.fillRect(438, 297, 14, 157); D.rr(c, 190, 292, 270, 18, 5); c.fill();
    const xs = run ? [590, 750] : [273, 377], bottom = run ? 394 : 478, top = run ? 113 : 197;
    for (let i = 0; i < 2; i++) {
      const liquid = tubes[i], positive = liquid === 'raw';
      const vol = 4 + 2 * ben;            // 液體 2 mL＋澱粉 2 mL，再加本氏液 2 mL
      // 只有「生唾液」那一管的酵素還能分解澱粉，加熱檢驗時才會出現磚紅色沉澱
      D.tube(c, xs[i], top, bottom, vol, ben > 0.5, positive ? heat : 0, positive, 6 + 2 * clamp((t - 6.5) / 2.5, 0, 1));
      if (run) { D.ellipse(c, xs[i], top + 24, 35, 7, null, '#c4d6cd'); c.strokeStyle = '#c4d6cd'; c.lineWidth = 4; c.beginPath(); c.moveTo(xs[i], top + 18); c.lineTo(xs[i], 137); c.stroke(); }
      D.label(c, tr((i ? '乙' : '甲') + '：' + LIQ[liquid][0], (i ? 'B: ' : 'A: ') + LIQ[liquid][1]), run ? (i ? 830 : 430) : (i ? 390 : 260), run ? 170 : 255, 220, i ? '#55e9ff' : '#f472b6');
    }
    D.bath(c, temp, true, false, 0, lang);
    D.bottle(c, true);
    D.label(c, tr('本氏液', "Benedict's"), 112, 487, 166);
    const title = !run ? tr('選好液體，再按「開始實驗」', 'Choose the liquids, then press Start')
      : t < 3 ? tr('兩管都加等量澱粉，37 °C 溫水中作用', 'Equal starch in both, react at 37 °C')
      : t < 4.5 ? tr('加入等量本氏液', "Add equal Benedict's reagent")
      : t < RUN ? tr('兩管一起沸水浴檢驗', 'Heat both in boiling water to test')
      : tr('比較兩管的顏色', 'Compare the two tubes');
    D.label(c, title, 480, 54, 760, '#fde047');
    if (run && t < 3) D.label(c, Math.round(digest * 20) + ' ' + tr('分鐘（壓縮）', 'min (compressed)'), 480, 587, 420, '#4ade80');
    if (t >= RUN) {
      const res = tubes.map((k, i) => tr((i ? '乙' : '甲') + (k === 'raw' ? '：磚紅色沉澱' : '：維持藍色'), (i ? 'B' : 'A') + (k === 'raw' ? ': brick-red precipitate' : ': stays blue')));
      D.label(c, res.join(tr('　｜　', ' | ')), 480, 587, 820, '#4ade80');
    }
  }

  /* ───────── 狀態文字 ───────── */
  function setStatus(key, text) { const el = $('ezstatus-' + key); if (el && el.textContent !== text) el.textContent = text; }
  function status(key) {
    const s = S[key];
    if (key === 'model') {
      const st = G.scene(s).stage;
      const msg = [tr('受質接近活性區，尚未反應。', 'The substrate approaches; no reaction yet.'), tr('形狀吻合，受質暫時與酵素結合。', 'The matching substrate binds temporarily.'),
        s.mode === 'join' ? tr('在活性區接起兩個部分，形成完整產物。', 'The two parts join at the active site.') : tr('在活性區斷開連接，形成較小產物。', 'The link breaks at the active site.'),
        tr('產物離開；酵素保留，可再次催化。', 'Products leave; the enzyme remains reusable.')][st];
      setStatus(key, msg + tr('　這個酵素已完成 ', '  This enzyme has finished ') + s.cycles + tr(' 次反應，它還在！', s.cycles === 1 ? ' reaction and is still here!' : ' reactions and is still here!'));
    } else if (key === 'specificity') {
      const en = M.pairs.find(p => p.id === s.enzyme), sb = M.pairs.find(p => p.target === s.substrate).substrate, match = en.target === s.substrate;
      const head = tr(en.zh + '＋' + sb[0] + '：', en.en + ' + ' + sb[1] + ': ');
      const msg = s.phase === 0 && !s.dragPoint ? tr('按住畫布往右拖，把受質送進活性區。', 'Drag right to push the substrate into the active site.')
        : s.dragPoint ? tr('再往右一點，送進活性區後放開。', 'A little further, then let go at the active site.')
        : match ? tr('配對成功：形狀吻合，受質被分解，酵素可再用。', 'Match: the shapes fit, the substrate is broken down, and the enzyme can be reused.')
        : tr('配對不合：形狀對不上，這個酵素無法催化這個受質。', 'Mismatch: the shapes do not fit, so this enzyme cannot act on this substrate.');
      setStatus(key, head + msg);
    } else if (key === 'temperature') {
      const rate = Math.round((s.damaged ? 0 : M.tempRate(s.temp)) * 100);
      const msg = s.damaged ? (s.temp >= 60 ? tr('溫度太高：酵素的形狀被破壞，活性區對不上受質。', 'Too hot: the enzyme shape is damaged and the active site no longer fits.') : tr('這份酵素已經被高溫破壞，降回這個溫度也不會恢復；按「換一份新酵素」再試。', 'This sample was heat-damaged; cooling does not restore it. Press “Fresh enzyme” to try again.'))
        : s.temp < 30 ? tr('溫度低：反應變慢，但構造沒有被破壞，回到體溫就會恢復。', 'Cold: the reaction slows, but the structure is not damaged and recovers at body temperature.')
        : s.temp <= 42 ? tr('接近體溫：這個人體酵素最適合的溫度範圍。', 'Near body temperature: the best range for this human enzyme.')
        : tr('超過適合的溫度：活性開始下降。', 'Above the suitable temperature: activity falls.');
      setStatus(key, tr('溫度 ', 'Temperature ') + s.temp + ' °C　' + tr('相對活性 ', 'Relative activity ') + rate + '%　' + msg + tr('（本模型的數字只是示意）', ' (model values are illustrative)'));
    } else if (key === 'ph') {
      const sp = M.phSpecs.find(p => p.id === s.phEnzyme), rate = Math.round(M.phRate(s.ph, s.phEnzyme) * 100);
      const where = s.ph < 6 ? tr('酸性', 'acidic') : s.ph <= 8 ? tr('近中性', 'near neutral') : tr('鹼性', 'alkaline');
      const msg = rate >= 70 ? tr('這是它適合的環境，活性高。', 'This environment suits it; activity is high.') : rate >= 25 ? tr('有點不合適，活性下降。', 'Not quite suitable; activity falls.') : tr('很不合適，幾乎沒有活性。', 'Very unsuitable; almost no activity.');
      setStatus(key, tr(sp.zh, sp.en) + tr('：pH ', ': pH ') + s.ph.toFixed(1) + tr('（' + where + '）', ' (' + where + ')') + '　' + tr('相對活性 ', 'Relative activity ') + rate + '%　' + msg);
    } else {
      const ex = S.experiment, t = ex.t;
      if (t < 0) setStatus(key, tr('甲：', 'A: ') + tr(...LIQ[ex.tubes[0]]) + tr('；乙：', '; B: ') + tr(...LIQ[ex.tubes[1]]) + tr('。兩管的澱粉、本氏液都一樣多，只有這一項不同。', '. Starch and reagent are equal; only this differs.'));
      else if (t < RUN) setStatus(key, tr('實驗進行中……', 'Running…'));
      else {
        const any = ex.tubes.includes('raw');
        const why = any ? tr('只有生唾液裡的酵素還能把澱粉分解成較小的糖，所以本氏液加熱後出現磚紅色沉澱。煮過的唾液酵素已失去作用；清水沒有酵素，可以當對照。', 'Only fresh saliva still has working enzyme to break starch into smaller sugars, so heated Benedict’s forms a brick-red precipitate. Boiled saliva’s enzyme no longer works; water has no enzyme and serves as a control.')
          : tr('兩管都沒有能作用的酵素，澱粉沒有被分解成糖，所以都維持藍色。', 'Neither tube has a working enzyme, so no sugar forms and both stay blue.');
        setStatus(key, why);
      }
    }
  }

  /* ───────── 模式：學生操作／老師講解 ───────── */
  const L = () => window.EnzymesLesson;
  let teacher = false;
  function setMode(m) {
    const t = m === 'teacher';
    teacher = t;
    document.body.classList.toggle('mode-teacher', t);
    ['student', 'teacher'].forEach(k => { const b = $('mode-' + k); if (b) { b.classList.toggle('active', (k === 'teacher') === t); b.setAttribute('aria-pressed', String((k === 'teacher') === t)); } });
    if (!L()) return;
    L().setStop(t ? 'none' : 'group');
    L().pause(false);
    L().restart();          // 兩種模式都從這個分頁的第一步開始
    if (t) { const sh = document.querySelector('.lesson:not([hidden]) .lab'); if (sh && sh.scrollIntoView) sh.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    paintTeach(true);
  }
  function onTeach(e) {
    const b = e.target.closest('[data-tact]'); if (!b || !L()) return;
    const g = L().getState();
    if (b.dataset.tact === 'pause') { if (!g.done) L().pause(!g.paused); }
    else { L().pause(false); L().restart(); }
    paintTeach(true);
  }
  let teachSig = '';
  function paintTeach(force) {
    if (!L()) return;
    const g = L().getState(), key = KEYS[g.tab], bar = $('ezteach-' + key); if (!bar) return;
    const p = Math.round(L().progress() * 100);
    const note = g.done ? tr('✔ 講解完畢；可按「從頭重播」，或點上方的步驟編號重看', '✔ Done. Press Replay, or tap a step number to revisit') : g.paused ? tr('⏸ 已暫停', '⏸ Paused') : '';
    const sig = [key, p, g.paused, g.done, lang, teacher].join('|');
    if (!force && sig === teachSig) return; teachSig = sig;
    const pb = bar.querySelector('[data-tact="pause"]'), rb = bar.querySelector('[data-tact="replay"]');
    pb.textContent = g.paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause'); pb.disabled = g.done;
    rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', g.done);
    bar.querySelector('.ez-fill').style.width = p + '%';
    bar.querySelector('.ez-tnote').textContent = note;
  }

  window.EnzymesLabs = { mount, frame, setMode, state: S, act, isTeacher: () => teacher };
  window.setMode = setMode;
})();

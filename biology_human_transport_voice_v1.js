/* biology_human_transport 有聲講解（外層加法；範本：biology_plant_transport_voice_v1.js）
 * 只做：載入 manifest.json／stage.json，依序播放每句 mp3；依 cuts／at／acts 呼叫 window.HTLesson.show(分頁, 步驟, 段) 切畫面；
 * 字幕、頭像、釘選黃條、螢光筆（只畫字，不框整塊）。不碰畫布、動畫與題庫。載入失敗整個功能隱藏，原頁面照常。
 * 音檔與網頁同一網域（audio/biology_human_transport/mp3/）；iPad Safari 只能在使用者點擊時解鎖，所以只用同一個 Audio 元素。
 * acts＝句中換畫面：{句號: [[播放比例0～1, 分頁, 子頁(null), 第幾步]]}（切到該步第 0 段）。
 * 上一句／下一句跳句時，先把畫面還原成「播到那一句時應有的分頁／步驟／段」，再播。
 * 有聲講解用到的分頁代號（lessons/biology_human_transport.json 的 tab_check 會來這裡找；與 window.HTLesson.tabs 相同）：
 *   data-tab="heart" data-tab="vessels" data-tab="blood" data-tab="circulation" data-tab="lymph" data-tab="experiment"
 */
(function () {
  'use strict';
  var BASE = 'audio/biology_human_transport/';
  var SPF = 0.3;                       // 音檔失敗時依字數估時，講解不中斷
  var AV = { '彥君': 'assets/characters/yanjun/pointer_board.png', '曉臻': 'assets/characters/xiaozhen/normal.png' };
  var WHO = { '彥君': '彥君老師', '曉臻': '曉臻助教', '合聲': '兩人' };
  // 螢光筆：這一句唸到 when 的時候，畫面上 phrase 那幾個字（只在 sel 範圍內尋找，找不到就不畫，不報錯）
  // 本課旁白沒有公式／算式（AGENTS_VOICE 8-1），表格留空；要加時照上面格式填
  var HL = [];

  var manifest = null, stage = null, seq = [], lineIdx = [];
  var audio = null, token = 0, pos = 0, paused = true, started = false;
  var waitTimer = null, waitLeftSec = 0, waitStartAt = 0, waitCb = null;
  var ui = null, hlEls = [], hlTimer = 0;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function ptl() { return window.HTLesson || null; }
  // 播放期間一律學生模式：老師講解模式的自動連播會和語音搶著切分頁（AGENTS_VOICE 新課手冊「踩過的雷」）
  function forceStudent() {
    if (document.body.classList.contains('mode-teacher') && window.setMode) window.setMode('student');
  }
  var modeObs = null;
  function watchMode(on) {
    if (on && !modeObs && window.MutationObserver) {
      modeObs = new MutationObserver(function () { if (started) forceStudent(); });
      modeObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    if (!on && modeObs) { modeObs.disconnect(); modeObs = null; }
  }

  /* ── 建立播放列（manifest → seq）── */
  function build(man, stg) {
    var out = [], lines = [];
    man.items.forEach(function (it) {
      if (it.kind === 'marker') {
        if (it.text.indexOf('＊切頁：') === 0) out.push({ type: 'cut', title: it.text.slice(4) });
        else if (it.text.indexOf('＊釘選：') === 0) out.push({ type: 'pin', text: it.text.slice(4) });
        else if (it.text.indexOf('＊停：') === 0) out.push({ type: 'wait', sec: parseFloat(it.text.slice(3)) || 0 });
      } else if (it.kind === 'line') {
        var o = { type: 'line', id: it.id, speaker: it.speaker, file: it.file, text: it.text, sub: (stg.subs && stg.subs[it.id]) || it.text };
        out.push(o); lines.push(o);
      }
    });
    return { seq: out, lines: lines };
  }

  /* ── 切換畫面：分頁＋步驟（段 0）；動畫循環播放 ── */
  // 淋巴分頁：頁面實際畫的是「淋巴旅程」四段（引擎的 lymphStep：0 全圖、1 放大微血管、2 進入淋巴管、3 回到大靜脈），
  // 步驟表的 compartment／movement 不會改變畫面，旅程會自己每 12 秒輪播。語音播放時把旅程固定在該步對應的那一段，
  // 離開淋巴分頁或講解結束時還原成自動輪播（只呼叫引擎公開的 LivingBook.action，等同學生按該分頁的旅程按鈕）。
  var FIX = { lymph: { key: 'lymphStep', by: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 }, off: 'auto' } };
  function lb() { return window.LivingBook || null; }
  function curTabId() { var L = lb(); try { return L && L.getTab ? L.getTab().id : null; } catch (e) { return null; } }
  function releaseFix(nextTab) {
    var L = lb(), cur = curTabId();
    if (L && cur && FIX[cur] && cur !== nextTab) L.action(FIX[cur].key, FIX[cur].off);
  }
  function showScene(tab, step, seg) {
    var p = ptl(); if (!p || !tab) return;
    releaseFix(tab);
    p.takeover(true);
    p.show(tab, step || 1, seg || 0);
    // 再套一次：步驟表的 ops 有先後依賴（例：血液第 2 步先 view=focus 再 component=rbc，
    // 若前一個畫面是血漿，引擎會把 focus 退回 smear）。同一組 ops 再套一次結果固定，不改教學檔。
    p.show(tab, step || 1, seg || 0);
    var f = FIX[tab], L = lb();
    if (f && L && f.by[step || 1] !== undefined) L.action(f.key, f.by[step || 1]);
  }
  function doCut(title) {
    hidePin();   // 換分頁：上一頁的釘選黃條收掉
    var c = stage.cuts && stage.cuts[title];
    if (c) showScene(c.tab, 1);   // 切分頁不捲頁（字幕框固定在畫面下方）
  }
  function doAt(id) {
    var a = stage.at && stage.at[id];
    if (a) showScene(a.tab, a.step || 1, a.seg || 0);
  }
  // 句中換畫面：依音檔播放比例觸發（音檔失敗時依字數估時）
  var actTimer = 0;
  function stopActs() { if (actTimer) { clearInterval(actTimer); actTimer = 0; } }
  function runActs(it, my) {
    stopActs();
    var acts = stage.acts && stage.acts[it.id];
    if (!acts || !acts.length) return;
    var fired = [], t0 = Date.now(), est = Math.max(1.5, it.text.length * SPF);
    actTimer = setInterval(function () {
      if (my !== token) { stopActs(); return; }
      if (paused) { t0 += 50; return; }
      var d = audio && audio.duration, f;
      if (d && isFinite(d) && d > 0 && audio.currentTime > 0) f = audio.currentTime / d;
      else f = (Date.now() - t0) / 1000 / est;
      var left = 0;
      for (var i = 0; i < acts.length; i++) {
        if (fired[i]) continue;
        if (f >= acts[i][0]) { fired[i] = 1; showScene(acts[i][1], acts[i][3] || 1, 0); }
        else left++;
      }
      if (!left) stopActs();
    }, 50);
  }
  // 跳句（上一句／下一句）：算出播到第 i 項之前畫面應該在哪（cuts → at → 該句之前的 acts 都已換過）
  function restoreBefore(i) {
    var want = null, pin = '';
    for (var j = 0; j < i && j < seq.length; j++) {
      var it = seq[j];
      if (it.type === 'pin') pin = it.text;
      if (it.type === 'cut') { pin = ''; var c = stage.cuts && stage.cuts[it.title]; if (c) want = [c.tab, 1, 0]; }
      else if (it.type === 'line') {
        var a = stage.at && stage.at[it.id];
        if (a) want = [a.tab, a.step || 1, a.seg || 0];
        var ac = stage.acts && stage.acts[it.id];
        if (ac && ac.length) { var z = ac[ac.length - 1]; want = [z[1], z[3] || 1, 0]; }
      }
    }
    if (pin) showPin(pin); else hidePin();
    if (want) showScene(want[0], want[1], want[2]);
  }

  /* ── 字幕與頭像 ── */
  function setAvatars(id) {
    var av = (stage.avatars && stage.avatars[id]) || {};
    ['彥君', '曉臻'].forEach(function (who, i) {
      var img = ui.av[i];
      img.src = av[who] || AV[who];
      img.dataset.who = who;
    });
  }
  function speakerLight(sp) {
    ui.av.forEach(function (img) {
      var on = (sp === '合聲') || (img.dataset.who === sp);
      img.classList.toggle('on', on);
    });
    ui.who.textContent = WHO[sp] || sp;
  }
  // 字幕：逐字包 span，播放時依音檔進度逐字變色（與 electronics_4／astronomy_sunpath_3 相同）
  var PACE = 1.15, chars = [], charRaf = 0;
  function displayText(t) { return String(t || '').replace(/恩極/g, 'N極').replace(/艾斯極/g, 'S極'); }
  function setSubChars(text) {
    cancelAnimationFrame(charRaf); charRaf = 0;
    ui.sub.textContent = ''; chars = [];
    var s = displayText(text);
    for (var i = 0; i < s.length; i++) { var sp = el('span', '', s[i]); ui.sub.appendChild(sp); chars.push(sp); }
  }
  function allCharsOn() { for (var k = 0; k < chars.length; k++) chars[k].className = 'on'; }
  function trackChars(a) {
    cancelAnimationFrame(charRaf);
    (function tick() { // 只依音檔實際播放位置變色；暫停時停住，再播放時 trackChars 會重新啟動
      if (!a || a.paused || a.ended) return;
      var d = a.duration, p = 0;
      if (d && isFinite(d) && a.currentTime > 0) p = Math.min(1, a.currentTime * PACE / d);
      var n = p > 0 ? Math.min(chars.length, Math.floor(p * chars.length) + 1) : 0;
      for (var i = 0; i < chars.length; i++) chars[i].className = i < n ? 'on' : '';
      charRaf = requestAnimationFrame(tick);
    })();
  }
  function showLine(it) {
    setSubChars(it.sub);
    speakerLight(it.speaker);
    if (stage.avatars && stage.avatars[it.id]) setAvatars(it.id);
  }
  function showPin(text) { ui.pin.textContent = displayText(text); ui.pin.classList.add('show'); }
  function hidePin() { ui.pin.textContent = ''; ui.pin.classList.remove('show'); }

  /* ── 螢光筆：只畫字；畫在 document 上（position:absolute），不改頁面原有內容 ── */
  function textRects(sel, phrase) {
    var roots = document.querySelectorAll(sel), res = [];
    for (var r = 0; r < roots.length; r++) {
      var w = document.createTreeWalker(roots[r], NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) {
        var k = n.nodeValue.indexOf(phrase);
        if (k < 0) continue;
        var rg = document.createRange(); rg.setStart(n, k); rg.setEnd(n, k + phrase.length);
        var rects = rg.getClientRects();
        for (var i = 0; i < rects.length; i++) if (rects[i].width > 0) res.push(rects[i]);
        if (res.length) return res;
      }
    }
    return res;
  }
  function hlClear() {
    hlEls.forEach(function (e) { e.remove(); });
    hlEls = [];
  }
  function hlDraw(rects) {
    hlClear();
    var sy = window.pageYOffset || 0, sx = window.pageXOffset || 0;
    rects.forEach(function (r) {
      var d = el('div', 'vx-hl');
      d.style.left = (r.left + sx) + 'px'; d.style.top = (r.top + sy) + 'px';
      d.style.width = r.width + 'px'; d.style.height = r.height + 'px';
      document.body.appendChild(d); hlEls.push(d);
    });
  }
  function hlFor(it) {
    for (var i = 0; i < HL.length; i++) {
      if (it.text.indexOf(HL[i].when) >= 0) return HL[i];
    }
    return null;
  }

  /* ── 逐句播放 ── */
  function playLine(it, my) {
    showLine(it);
    var hl = hlFor(it), hlSet = false;
    var rects = hl ? textRects(hl.sel, hl.phrase) : [];
    function finish() { if (my === token) { hlClear(); stopActs(); next(my); } }
    function tickHl() {
      if (!hl || my !== token) return;
      if (!hlSet && rects.length) { hlDraw(rects); hlSet = true; }
      if (audio && audio.duration) {
        var f = audio.currentTime / audio.duration;
        var frac = Math.max(0, Math.min(1, (f - 0.1) / 0.8));
        hlEls.forEach(function (e) { e.style.clipPath = 'inset(0 ' + ((1 - frac) * 100).toFixed(1) + '% 0 0)'; });
      }
      if (!paused) hlTimer = requestAnimationFrame(tickHl);
    }
    if (!manifest) return finish();
    audio.onended = finish;
    audio.onerror = function () { fallbackWait(it.text, my); };
    audio.src = BASE + 'mp3/' + it.file;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { fallbackWait(it.text, my); });
    trackChars(audio);
    if (hl) { cancelAnimationFrame(hlTimer); hlTimer = requestAnimationFrame(tickHl); }
    runActs(it, my);
  }
  function fallbackWait(text, my) {
    setTimeout(function () { if (my === token) { hlClear(); stopActs(); next(my); } }, text.length * SPF * 1000);
  }

  function waitFor(sec, my) {
    waitLeftSec = sec; waitStartAt = Date.now();
    waitCb = function () { if (my === token) next(my); };
    waitTimer = setTimeout(function () { waitTimer = null; waitCb = null; if (my === token) next(my); }, sec * 1000);
  }

  function play(i, my) {
    if (my !== token) return;
    pos = i;
    var it = seq[i];
    if (!it) { finish(); return; }
    updateCount();
    if (it.type === 'cut') { doCut(it.title); return play(i + 1, my); }
    if (it.type === 'pin') { showPin(it.text); return play(i + 1, my); }
    if (it.type === 'wait') return waitFor(it.sec, my);
    if (it.type === 'line') {
      var a = stage.at && stage.at[it.id];
      if (a) doAt(it.id);
      return playLine(it, my);
    }
  }
  function next(my) { if (my !== token) return; allCharsOn(); play(pos + 1, my); }

  function go(i, jump) {
    token++;
    if (audio) { audio.pause(); }
    if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
    hlClear(); cancelAnimationFrame(hlTimer); stopActs();
    paused = false; started = true; forceStudent(); watchMode(true);
    refresh();
    if (jump) restoreBefore(i);
    play(i, token);
  }
  function finish() {
    token++; paused = true; started = false; stopActs(); cancelAnimationFrame(charRaf); charRaf = 0;
    if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
    hlClear(); hidePin(); progress(lineIdx.length);
    ui.sub.textContent = '講解結束，可以按 ▶ 重聽。'; chars = [];
    refresh();
    releaseFix(null);
    if (ptl()) { ptl().takeover(false); }
    watchMode(false);
  }
  function lineIndexFrom(i, dir) {
    var j = i;
    while (j >= 0 && j < seq.length) {
      j += dir;
      if (j >= 0 && j < seq.length && seq[j].type === 'line') return j;
    }
    return -1;
  }
  function progress(doneLines) {
    ui.fill.style.width = (lineIdx.length ? (doneLines / lineIdx.length) * 100 : 0) + '%';
  }
  function lineNo(i) { // 播到第 i 項時，前面有幾句說話行
    var n = 0;
    for (var k = 0; k < i && k < seq.length; k++) if (seq[k].type === 'line') n++;
    return n;
  }
  function updateCount() {
    var n = lineNo(pos) + (seq[pos] && seq[pos].type === 'line' ? 1 : 0);
    ui.count.textContent = n + ' / ' + lineIdx.length;
    progress(n ? n - 1 : 0);
  }
  function refresh() {
    var playing = started && !paused;
    ui.start.disabled = playing;
    ui.pause.disabled = !playing;
    ui.stop.disabled = !started;
    ui.back.disabled = ui.fwd.disabled = !started;
  }

  function start() {
    if (started && !paused) return;
    if (!started) { go(0); return; }
    paused = false;                      // 繼續
    if (ptl()) ptl().resume();
    refresh();
    if (audio && audio.src && audio.currentTime > 0 && !audio.ended) { audio.play(); trackChars(audio); }
    else go(pos, true);
  }
  function pause() {
    if (!started || paused) return;
    paused = true;
    if (audio) audio.pause();
    if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
    if (ptl()) ptl().pause();
    refresh();
  }
  function stop() {
    if (!started) { hidePin(); progress(0); refresh(); return; }
    finish();
    ui.sub.textContent = '按 ▶ 聽彥君老師與曉臻助教講解。';
    progress(0);
  }
  // 快轉／倒退：同一句內移動；超出範圍就跳到下一句／上一句
  function seek(sec) {
    if (!started || !seq[pos] || seq[pos].type !== 'line' || !audio) return;
    var ct = audio.currentTime || 0, d = audio.duration;
    if (sec > 0) {
      if (d && isFinite(d) && ct + sec < d - 0.2) { audio.currentTime = ct + sec; return; }
      var j = lineIndexFrom(pos, 1); if (j >= 0) go(j, true); else finish();
    } else {
      if (ct + sec > 0) { audio.currentTime = ct + sec; return; }
      var k = lineIndexFrom(pos, -1);
      if (ct > 1.5 || k < 0) { audio.currentTime = 0; return; }
      go(k, true);
    }
  }
  function jumpToLine(n) {               // 從第 n 句（0 起算）開始播，畫面依前面的切頁／釘選還原
    var cnt = 0;
    for (var i = 0; i < seq.length; i++) {
      if (seq[i].type !== 'line') continue;
      if (cnt === n) { go(i, true); return; }
      cnt++;
    }
  }

  /* ── 介面：懸浮字幕面板（與 biology_immune_defense 相同：左右頭像＋氣泡字幕＋圖示按鈕＋可拖曳進度條）── */
  function css() {
    var s = el('style');
    s.textContent = [
      '.vx-open{min-height:52px;padding:8px 26px;border-radius:999px;cursor:pointer;font-size:21px;font-weight:700;font-family:inherit;line-height:1.3;background:transparent;color:#55e9ff;border:2px solid #55e9ff;touch-action:manipulation;transition:all .2s}',
      '.vx-open:hover,.vx-open.on{background:#55e9ff;color:#11261f}',
      '#vxPanel{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:9000;width:min(900px,100vw);box-sizing:border-box;padding:0 8px;pointer-events:none;display:none}',
      '#vxPanel.show{display:block}',
      '#vxPanel .vx-cap{position:relative;display:flex;align-items:flex-end;justify-content:space-between;gap:6px}',
      '#vxPanel .vx-av{flex:0 0 auto;height:130px;width:auto;transition:opacity .25s,filter .25s;opacity:.35;filter:grayscale(.6);pointer-events:none}',
      '#vxPanel .vx-av.on{opacity:1;filter:none}',
      '#vxPanel .vx-bub{pointer-events:auto;flex:1 1 auto;min-width:0;margin-bottom:14px;padding:10px 14px 20px;border-radius:14px;background:rgba(17,38,31,.94);border:2px solid #55e9ff;color:#f2ecd9;box-shadow:0 6px 18px rgba(0,0,0,.55);font-family:inherit;position:relative}',
      '#vxPanel .vx-sub{font-size:21px;line-height:1.55;min-height:2.4em;padding-top:2px}',
      '#vxPanel .vx-sub span{color:rgba(242,236,217,.55);transition:color .12s}',
      '#vxPanel .vx-sub span.on{color:#fff}',
      '#vxPanel .vx-ctl{position:absolute;top:2px;right:4px;display:flex;gap:0}',
      '#vxPanel .vx-ic{width:32px;height:32px;display:flex;align-items:center;justify-content:center;padding:0;border-radius:50%;border:0;background:transparent;color:#9af06f;font-size:18px;line-height:1;cursor:pointer;touch-action:manipulation;font-family:inherit}',
      '#vxPanel .vx-ic:hover:not(:disabled){background:rgba(154,240,111,.2)}#vxPanel .vx-ic:disabled{opacity:.3;cursor:default}',
      '#vxPanel .vx-line{position:absolute;left:10px;right:10px;bottom:0;height:18px;cursor:pointer;touch-action:none;user-select:none}',
      '#vxPanel .vx-track{position:absolute;left:0;right:0;bottom:7px;height:4px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}',
      '#vxPanel .vx-fill{height:100%;width:0;background:#fde047}',
      '#vxPin{pointer-events:none;position:relative;margin:0 auto 10px;max-width:min(560px,100%);box-sizing:border-box;padding:8px 14px;border-radius:12px;background:#fde047;color:#11261f;font-size:19px;font-weight:700;line-height:1.4;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.5);display:none}',
      '#vxPin.show{display:block}',
      '.vx-hl{position:absolute;pointer-events:none;background:rgba(253,224,71,.55);border-radius:3px;z-index:8000}',
      'body.vx-on{padding-bottom:280px}',
      '@media (max-width:620px){#vxPanel .vx-av{height:78px}#vxPanel .vx-sub{font-size:17px}#vxPanel .vx-bub{padding:8px 10px 12px}body.vx-on{padding-bottom:240px}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  var IC = {
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/><text x="12" y="16.5" font-size="7.5" font-weight="700" text-anchor="middle" font-family="sans-serif">5</text></svg>',
    fwd: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 5V2l5 4-5 4V7a5 5 0 1 0 5 5h2a7 7 0 1 1-7-7z"/><text x="12" y="16.5" font-size="7.5" font-weight="700" text-anchor="middle" font-family="sans-serif">5</text></svg>',
    play: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    stop: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>'
  };
  // 進度條：點一下或拖曳，就從該句開始播
  function bindBar(bar) {
    var dragging = false;
    function valueAt(ev) {
      var r = bar.getBoundingClientRect(), f = Math.max(0, Math.min(1, (ev.clientX - r.left) / (r.width || 1)));
      return { n: Math.min(lineIdx.length - 1, Math.floor(f * lineIdx.length)), f: f };
    }
    bar.addEventListener('pointerdown', function (ev) {
      if (!lineIdx.length) return;
      dragging = true;
      try { bar.setPointerCapture(ev.pointerId); } catch (e) {}
      ui.fill.style.width = (valueAt(ev).f * 100) + '%';
    });
    bar.addEventListener('pointermove', function (ev) { if (dragging) ui.fill.style.width = (valueAt(ev).f * 100) + '%'; });
    bar.addEventListener('pointerup', function (ev) { if (!dragging) return; dragging = false; jumpToLine(valueAt(ev).n); });
    bar.addEventListener('pointercancel', function () { dragging = false; progress(started ? lineNo(pos) : 0); });
  }
  function buildUI() {
    css();
    var open = el('button', 'vx-open', '🔊 有聲講解'); open.id = 'vxOpen'; open.type = 'button';
    open.setAttribute('aria-pressed', 'false');
    var panel = el('div'); panel.id = 'vxPanel';
    panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', '有聲講解');
    var pin = el('div'); pin.id = 'vxPin';
    var cap = el('div', 'vx-cap');
    var a1 = el('img', 'vx-av'); a1.src = AV['彥君']; a1.alt = '彥君老師'; a1.dataset.who = '彥君';
    var bub = el('div', 'vx-bub');
    var sub = el('div', 'vx-sub', '按 ▶ 聽彥君老師與曉臻助教講解。'); sub.setAttribute('aria-live', 'polite');
    var who = el('span'); who.style.display = 'none';
    var count = el('span', 'vx-count'); count.style.display = 'none';
    var ctl = el('div', 'vx-ctl');
    function mk(ic, title) { var b = el('button', 'vx-ic'); b.innerHTML = IC[ic]; b.title = title; b.setAttribute('aria-label', title); b.type = 'button'; ctl.appendChild(b); return b; }
    var back = mk('back', '倒退 5 秒'), startB = mk('play', '開始／繼續'), pauseB = mk('pause', '暫停'), fwd = mk('fwd', '快轉 5 秒'), stopB = mk('stop', '停止');
    var line = el('div', 'vx-line');
    line.setAttribute('role', 'slider'); line.setAttribute('aria-label', '拖曳或點選，跳到某一句');
    var track = el('div', 'vx-track'), fill = el('div', 'vx-fill');
    track.appendChild(fill); line.appendChild(track);
    bub.append(sub, who, count, ctl, line);
    var a2 = el('img', 'vx-av'); a2.src = AV['曉臻']; a2.alt = '曉臻助教'; a2.dataset.who = '曉臻';
    cap.append(a1, bub, a2);
    panel.append(pin, cap);
    var host = document.querySelector('#modeBar .mode-row') || document.querySelector('#modeBar');
    (host || document.body).appendChild(open);
    document.body.appendChild(panel);
    ui = { open: open, panel: panel, pin: pin, av: [a1, a2], who: who, sub: sub, count: count, fill: fill,
           start: startB, pause: pauseB, stop: stopB, back: back, fwd: fwd };
    bindBar(line);
    open.addEventListener('click', function () {   // 開／關面板；關閉時停止播放
      var show = !panel.classList.contains('show');
      if (!show) stop();
      panel.classList.toggle('show', show);
      document.body.classList.toggle('vx-on', show);
      open.classList.toggle('on', show);
      open.setAttribute('aria-pressed', String(show));
    });
    startB.addEventListener('click', start);
    pauseB.addEventListener('click', pause);
    stopB.addEventListener('click', stop);
    back.addEventListener('click', function () { seek(-5); });
    fwd.addEventListener('click', function () { seek(5); });
    refresh();
  }

  function load() {
    Promise.all([
      fetch(BASE + 'manifest.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }),
      fetch(BASE + 'stage.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
    ]).then(function (v) {
      manifest = v[0]; stage = v[1];
      var b = build(manifest, stage);
      seq = b.seq; lineIdx = b.lines;
      audio = new Audio();
      audio.preload = 'auto';
      buildUI();
    }).catch(function () { /* 沒有音檔：整個功能隱藏，原頁面照常 */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();

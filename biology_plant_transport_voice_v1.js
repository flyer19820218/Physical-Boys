/* biology_plant_transport 有聲講解（外層加法；範本：biology_plant_structure_voice_v1.js）
 * 只做：載入 manifest.json／stage.json，依序播放每句 mp3；依 cuts／at 呼叫 window.PTLesson.show 切分頁與步驟；
 * 字幕、頭像、釘選黃條、螢光筆（只畫字，不框整塊）。不碰畫布、動畫與題庫。載入失敗整個功能隱藏，原頁面照常。
 * 音檔與網頁同一網域（audio/biology_plant_transport/mp3/）；iPad Safari 只能在使用者點擊時解鎖，所以只用同一個 Audio 元素。
 */
(function () {
  'use strict';
  var BASE = 'audio/biology_plant_transport/';
  var SPF = 0.3;                       // 音檔失敗時依字數估時，講解不中斷
  var AV = { '彥君': 'assets/characters/yanjun/pointer_board.png', '曉臻': 'assets/characters/xiaozhen/normal.png' };
  var WHO = { '彥君': '彥君老師', '曉臻': '曉臻助教', '合聲': '兩人' };
  // 螢光筆：這一句唸到 when 的時候，畫面上 phrase 那幾個字（只在 sel 範圍內尋找，找不到就不畫，不報錯）
  var HL = [
    { when: '是主要的動力', phrase: '是主要動力', sel: '.caption, .lesson-body, .closure' },
    { when: '受損的根毛少了', phrase: '有效吸收表面', sel: '.caption, .lesson-body, .closure' },
    { when: '韌皮部運的是蔗糖', phrase: '蔗糖', sel: '.caption, .lesson-body, .closure' }
  ];

  var manifest = null, stage = null, seq = [], lineIdx = [];
  var audio = null, token = 0, pos = 0, paused = true, started = false;
  var waitTimer = null, waitLeftSec = 0, waitStartAt = 0, waitCb = null;
  var ui = null, hlEls = [], hlTimer = 0;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function ptl() { return window.PTLesson || null; }

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
  function showScene(tab, step, seg) {
    var p = ptl(); if (!p || !tab) return;
    p.takeover(true);
    p.show(tab, step || 1, seg || 0);
  }
  function doCut(title) {
    var c = stage.cuts && stage.cuts[title];
    if (c) showScene(c.tab, 1);   // 切分頁不捲頁（字幕框固定在畫面下方）
  }
  function doAt(id) {
    var a = stage.at && stage.at[id];
    if (a) showScene(a.tab, a.step || 1, a.seg || 0);
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
  function showLine(it) {
    ui.sub.textContent = it.sub;
    speakerLight(it.speaker);
    if (stage.avatars && stage.avatars[it.id]) setAvatars(it.id);
  }
  function showPin(text) { ui.pin.textContent = text; ui.pin.classList.add('show'); }

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
    function finish() { if (my === token) { hlClear(); next(my); } }
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
    if (hl) { cancelAnimationFrame(hlTimer); hlTimer = requestAnimationFrame(tickHl); }
  }
  function fallbackWait(text, my) {
    setTimeout(function () { if (my === token) { hlClear(); next(my); } }, text.length * SPF * 1000);
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
  function next(my) { if (my !== token) return; play(pos + 1, my); }

  function go(i) {
    token++;
    if (audio) { audio.pause(); }
    if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
    hlClear(); cancelAnimationFrame(hlTimer);
    paused = false; started = true;
    ui.toggle.textContent = '⏸';
    play(i, token);
  }
  function finish() {
    token++; paused = true; started = false;
    ui.toggle.textContent = '▶';
    hlClear();
    if (ptl()) { ptl().takeover(false); }
  }
  function lineIndexFrom(i, dir) {
    var j = i;
    while (j >= 0 && j < seq.length) {
      j += dir;
      if (j >= 0 && j < seq.length && seq[j].type === 'line') return j;
    }
    return -1;
  }
  function updateCount() {
    var n = 0, total = lineIdx.length;
    for (var i = 0; i <= pos && i < seq.length; i++) if (seq[i].type === 'line') n++;
    ui.count.textContent = (n ? n : 0) + ' / ' + total;
  }

  function toggle() {
    if (!started) { go(0); return; }
    if (!paused) {                       // 暫停
      paused = true;
      if (audio) audio.pause();
      if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
      if (ptl()) ptl().pause();
      ui.toggle.textContent = '▶';
    } else {                             // 繼續
      paused = false;
      if (ptl()) ptl().resume();
      ui.toggle.textContent = '⏸';
      if (audio && audio.src && audio.currentTime > 0 && !audio.ended) audio.play();
      else go(pos);
    }
  }

  /* ── 介面 ── */
  function css() {
    var s = el('style');
    s.textContent = [
      '#vxOpen{position:fixed;right:16px;bottom:18px;z-index:9000;min-height:52px;padding:8px 22px;border-radius:999px;cursor:pointer;font:700 21px/1.3 "Noto Sans TC",sans-serif;background:#0b1a15;color:#55e9ff;border:2px solid #55e9ff;box-shadow:0 6px 18px rgba(0,0,0,.4)}',
      '#vxPanel{position:fixed;left:0;right:0;bottom:0;z-index:9001;display:none;padding:10px 14px 14px;background:rgba(11,26,21,.96);border-top:2px solid rgba(85,233,255,.45);box-shadow:0 -8px 24px rgba(0,0,0,.45);font-family:"Noto Sans TC",sans-serif;color:#f2ecd9}',
      '#vxPanel.show{display:block}',
      '#vxPanel .vx-row{max-width:1080px;margin:0 auto;display:flex;gap:12px;align-items:center}',
      '#vxPanel .vx-av{display:flex;gap:6px;flex:0 0 auto}',
      '#vxPanel .vx-av img{width:64px;height:64px;object-fit:contain;border-radius:50%;background:transparent;opacity:.45;border:2px solid transparent}',
      '#vxPanel .vx-av img.on{opacity:1;border-color:#55e9ff}',
      '#vxPanel .vx-body{flex:1;min-width:0}',
      '#vxPanel .vx-who{font-size:17px;font-weight:700;color:#55e9ff}',
      '#vxPanel .vx-sub{font-size:22px;line-height:1.6;min-height:2.2em}',
      '#vxPanel .vx-ctl{display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex:0 0 auto}',
      '#vxPanel .vx-ctl button{min-height:40px;min-width:76px;border-radius:10px;border:2px solid #55e9ff;background:transparent;color:#f2ecd9;font:700 18px/1 "Noto Sans TC",sans-serif;cursor:pointer;padding:6px 10px}',
      '#vxPanel .vx-count{font-size:15px;color:#b8c9c1;font-family:"JetBrains Mono",monospace}',
      '#vxPin{max-width:1080px;margin:0 auto 8px;display:none;padding:6px 12px;border-radius:8px;background:#fde047;color:#11261f;font:700 20px/1.4 "Noto Sans TC",sans-serif}',
      '#vxPin.show{display:block}',
      '.vx-hl{position:absolute;pointer-events:none;background:rgba(253,224,71,.55);border-radius:3px;z-index:8000;mix-blend-mode:normal}',
      'body.vx-on{padding-bottom:190px}',
      '@media (max-width:620px){#vxPanel .vx-av img{width:48px;height:48px}#vxPanel .vx-sub{font-size:20px}}'
    ].join('');
    document.head.appendChild(s);
  }
  function buildUI() {
    css();
    var open = el('button', null, '🔊 有聲講解'); open.id = 'vxOpen'; open.type = 'button';
    var panel = el('div'); panel.id = 'vxPanel';
    var pin = el('div'); pin.id = 'vxPin';
    var row = el('div', 'vx-row');
    var av = el('div', 'vx-av');
    var a1 = el('img'), a2 = el('img'); a1.alt = ''; a2.alt = '';
    av.append(a1, a2);
    var body = el('div', 'vx-body');
    var who = el('div', 'vx-who'), sub = el('div', 'vx-sub');
    body.append(who, sub);
    var ctl = el('div', 'vx-ctl');
    var toggleBtn = el('button', null, '▶'); toggleBtn.type = 'button';
    var nextBtn = el('button', null, '下一句'); nextBtn.type = 'button';
    var prevBtn = el('button', null, '上一句'); prevBtn.type = 'button';
    var count = el('div', 'vx-count', '0 / 0');
    ctl.append(toggleBtn, nextBtn, prevBtn, count);
    row.append(av, body, ctl);
    panel.append(pin, row);
    document.body.append(open, panel);
    ui = { open: open, panel: panel, pin: pin, av: [a1, a2], who: who, sub: sub, toggle: toggleBtn, count: count };
    open.addEventListener('click', function () {
      panel.classList.add('show'); document.body.classList.add('vx-on'); open.style.display = 'none';
      toggle();
    });
    toggleBtn.addEventListener('click', toggle);
    nextBtn.addEventListener('click', function () { var j = lineIndexFrom(pos, 1); if (j >= 0) go(j); });
    prevBtn.addEventListener('click', function () { var j = lineIndexFrom(pos, -1); if (j >= 0) go(j); });
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
      ui.count.textContent = '0 / ' + lineIdx.length;
    }).catch(function () { /* 沒有音檔：整個功能隱藏，原頁面照常 */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();

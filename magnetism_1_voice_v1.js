/* magnetism_1 有聲講解（外層加法）
 * 只做三件事：載入 manifest.json / stage.json、依序播放 106 句音檔、用 .click() 切換既有分頁。
 * 不碰 Canvas/SVG、動畫、題庫；不改任何既有 js。載入失敗時整個功能隱藏，原頁面完全不受影響。
 * 音檔來自 GitHub Release（tag audio-magnetism_1-v1）。
 */
(function () {
  'use strict';
  var MANIFEST_URL = 'audio/magnetism_1/manifest.json';
  var STAGE_URL = 'audio/magnetism_1/stage.json';
  var AUDIO_BASE = 'https://github.com/flyer19820218/Physical-Boys/releases/download/audio-magnetism_1-v1/';
  var SEC_PER_CHAR = 0.3; // 音檔載入失敗時，依字數估一個等待秒數，讓講解不中斷

  var items = [], stage = { cuts: {}, at: {}, subs: {} }, total = 0;
  var idx = 0, state = 'idle', token = 0;
  var audio = null, timer = null, waitLeft = 0, waitStart = 0, waitDone = null, cache = {};
  var ui = {};

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '.vx-open{min-height:52px;padding:8px 26px;border-radius:999px;cursor:pointer;font-size:21px;font-weight:700;font-family:inherit;line-height:1.3;background:transparent;color:#55e9ff;border:2px solid #55e9ff;touch-action:manipulation;transition:all .2s}',
      '.vx-open:hover,.vx-open.on{background:#55e9ff;color:#11261f}',
      '.vx-panel{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:9000;width:min(860px,calc(100vw - 24px));box-sizing:border-box;padding:12px 14px;border-radius:14px;background:rgba(17,38,31,.95);border:2px solid #55e9ff;color:#f2ecd9;box-shadow:0 8px 24px rgba(0,0,0,.6);font-family:inherit;display:none}',
      '.vx-panel.show{display:block}',
      '.vx-sub{min-height:3em;font-size:22px;line-height:1.5;text-align:center;margin:0 0 10px}',
      '.vx-who{display:inline-block;margin-right:8px;padding:0 10px;border-radius:999px;font-size:16px;font-weight:700;color:#11261f;background:#fde047;vertical-align:2px}',
      '.vx-who.f{background:#ff78b7}.vx-who.c{background:#dd8cff}',
      '.vx-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px}',
      '.vx-btn{min-height:44px;padding:6px 18px;border-radius:8px;cursor:pointer;font-size:18px;font-weight:700;font-family:inherit;background:transparent;color:#9af06f;border:2px solid #9af06f;touch-action:manipulation}',
      '.vx-btn:hover:not(:disabled){background:#9af06f;color:#11261f}.vx-btn:disabled{opacity:.35;cursor:default}',
      '.vx-track{flex:1 1 160px;min-width:120px;height:10px;border-radius:6px;background:rgba(255,255,255,.14);overflow:hidden}',
      '.vx-fill{height:100%;width:0;background:#fde047;border-radius:6px}',
      '.vx-count{font-size:16px;color:#b8c9c1;min-width:5.5em;text-align:center}',
      '.vx-pin{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:9001;max-width:min(720px,calc(100vw - 120px));box-sizing:border-box;padding:8px 18px;border-radius:12px;background:#fde047;color:#11261f;font-size:22px;font-weight:700;line-height:1.4;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.5);display:none}',
      '.vx-pin.show{display:block}',
      '@media (max-width:520px){.vx-sub{font-size:18px}.vx-pin{font-size:18px;top:60px;max-width:calc(100vw - 24px)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function buildUI() {
    css();
    var host = document.querySelector('#modeBar .mode-row') || document.querySelector('#modeBar');
    ui.open = el('button', 'vx-open', '🔊 有聲講解');
    ui.open.type = 'button';
    ui.open.setAttribute('aria-pressed', 'false');
    if (host) host.appendChild(ui.open); else document.body.appendChild(ui.open);

    ui.pin = el('div', 'vx-pin', '', document.body);
    ui.panel = el('div', 'vx-panel', null, document.body);
    ui.panel.setAttribute('role', 'region');
    ui.panel.setAttribute('aria-label', '有聲講解');
    ui.sub = el('p', 'vx-sub', '按「開始」聽彥君老師與曉臻助教講解。', ui.panel);
    ui.sub.setAttribute('aria-live', 'polite');
    var row = el('div', 'vx-row', null, ui.panel);
    ui.start = el('button', 'vx-btn', '▶ 開始', row);
    ui.pause = el('button', 'vx-btn', '⏸ 暫停', row);
    ui.stop = el('button', 'vx-btn', '■ 停止', row);
    var tr = el('div', 'vx-track', null, row);
    ui.fill = el('div', 'vx-fill', null, tr);
    ui.count = el('span', 'vx-count', '0 / ' + total, row);
    [ui.start, ui.pause, ui.stop].forEach(function (b) { b.type = 'button'; });

    ui.open.addEventListener('click', function () {
      var show = !ui.panel.classList.contains('show');
      if (!show) stop();
      ui.panel.classList.toggle('show', show);
      ui.open.classList.toggle('on', show);
      ui.open.setAttribute('aria-pressed', String(show));
    });
    ui.start.addEventListener('click', start);
    ui.pause.addEventListener('click', pause);
    ui.stop.addEventListener('click', stop);
    refresh();
  }

  function refresh() {
    ui.start.textContent = state === 'paused' ? '▶ 繼續' : '▶ 開始';
    ui.start.disabled = state === 'playing';
    ui.pause.disabled = state !== 'playing';
    ui.stop.disabled = state === 'idle';
  }

  function lineNo() { // 目前播到第幾句說話行
    var n = 0;
    for (var i = 0; i < idx && i < items.length; i++) if (items[i].kind === 'line') n++;
    return n;
  }

  function progress(doneLines) {
    ui.fill.style.width = (total ? (doneLines / total) * 100 : 0) + '%';
    ui.count.textContent = doneLines + ' / ' + total;
  }

  // ─── 切頁：只用 .click() 點既有按鈕 ───
  function goto(tab, sub) {
    var t = tab && document.querySelector('.tab-button[data-tab="' + tab + '"]');
    if (t && !t.classList.contains('active')) t.click();
    var s = sub && document.querySelector('.sub-tab-btn[data-sub="' + sub + '"]');
    if (s) setTimeout(function () { s.click(); }, t ? 80 : 0);
  }

  function showSub(item) {
    var text = stage.subs[item.id] || item.text;
    ui.sub.textContent = '';
    var cls = item.speaker === '曉臻' ? 'f' : item.speaker === '合聲' ? 'c' : '';
    el('span', 'vx-who ' + cls, item.speaker, ui.sub);
    ui.sub.appendChild(document.createTextNode(text));
  }

  function setPin(text) {
    ui.pin.textContent = text || '';
    ui.pin.classList.toggle('show', !!text);
  }

  // ─── 計時（＊停）可暫停 ───
  function wait(sec, done) {
    waitLeft = sec * 1000; waitDone = done; waitStart = Date.now();
    timer = setTimeout(function () { timer = null; waitDone = null; done(); }, waitLeft);
  }
  function clearWait() { if (timer) { clearTimeout(timer); timer = null; } }

  // ─── 主迴圈 ───
  function step() {
    if (state !== 'playing') return;
    if (idx >= items.length) { finish(); return; }
    var it = items[idx], my = token;
    if (it.kind === 'marker') {
      var m = /^[＊*]\s*(切頁|停|釘選)\s*[：:]\s*(.+)$/.exec(it.text || '');
      idx++;
      if (m && m[1] === '切頁') {
        var c = stage.cuts[m[2].trim()];
        setPin('');
        if (c) goto(c.tab, c.sub);
      } else if (m && m[1] === '釘選') {
        setPin(m[2].trim());
      } else if (m && m[1] === '停') {
        var sec = parseFloat(m[2]);
        if (sec > 0) { wait(sec, function () { if (my === token) step(); }); return; }
      }
      step();
      return;
    }
    playLine(it, my);
  }

  function getAudio(it) {
    if (cache[it.id]) return cache[it.id];
    var a = new Audio();
    a.preload = 'auto';
    a.src = AUDIO_BASE + encodeURIComponent(it.file);
    cache[it.id] = a;
    return a;
  }

  function preloadNext() {
    for (var i = idx + 1; i < items.length; i++) {
      if (items[i].kind === 'line') { if (!cache[items[i].id]) getAudio(items[i]); return; }
    }
  }

  function playLine(it, my) {
    var at = stage.at[it.id];
    if (at) goto(at.tab, at.sub);
    showSub(it);
    var n = lineNo() + 1;
    progress(n - 1);
    var a = audio = getAudio(it);
    var advanced = false;
    function next() {
      if (advanced || my !== token) return;
      advanced = true;
      a.onended = a.onerror = null;
      if (audio === a) audio = null;
      delete cache[it.id];
      idx++;
      progress(n);
      step();
    }
    function fallback() { // 音檔讀不到：照字數等一下再繼續
      if (advanced || my !== token) return;
      ui.sub.appendChild(document.createTextNode('（音檔載入失敗）'));
      audio = null;
      wait(Math.max(1.5, it.text.length * SEC_PER_CHAR), next);
    }
    a.onended = next;
    a.onerror = fallback;
    try { a.currentTime = 0; } catch (e) { /* 尚未載入，忽略 */ }
    var p = a.play();
    if (p && p.catch) p.catch(function (err) {
      if (my !== token) return;
      if (err && err.name === 'NotAllowedError') { pause(); ui.sub.textContent = '瀏覽器擋住自動播放，請再按「繼續」。'; }
      else fallback();
    });
    preloadNext();
  }

  // ─── 控制 ───
  function start() {
    if (state === 'playing') return;
    if (state === 'paused') {
      state = 'playing'; refresh();
      if (audio && audio.paused) {
        var p = audio.play(); if (p && p.catch) p.catch(function () {});
      } else if (waitDone) {
        var d = waitDone; wait(waitLeft / 1000, d);
      } else { step(); }
      return;
    }
    // 老師講解模式若開著，先切回學生操作，避免兩邊同時自動換頁
    if (document.body.classList.contains('mode-teacher')) {
      var sb = document.getElementById('mode-student'); if (sb) sb.click();
    }
    idx = 0; token++; state = 'playing'; setPin(''); progress(0); refresh();
    step();
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    if (audio && !audio.paused) audio.pause();
    if (timer) { waitLeft = Math.max(0, waitLeft - (Date.now() - waitStart)); clearWait(); }
    refresh();
  }

  function halt() {
    token++; clearWait(); waitDone = null;
    if (audio) { audio.onended = audio.onerror = null; try { audio.pause(); } catch (e) {} }
    audio = null; cache = {};
  }

  function stop() {
    halt(); state = 'idle'; idx = 0;
    setPin(''); progress(0);
    if (ui.sub) ui.sub.textContent = '按「開始」聽彥君老師與曉臻助教講解。';
    refresh();
  }

  function finish() {
    halt(); state = 'idle'; idx = 0; setPin('');
    progress(total);
    ui.sub.textContent = '講解結束，可以按「開始」重聽。';
    refresh();
  }

  // ─── 載入：任何一步失敗就不顯示按鈕 ───
  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }

  function init() {
    Promise.all([getJSON(MANIFEST_URL), getJSON(STAGE_URL)]).then(function (r) {
      items = (r[0].items || []).filter(function (i) {
        return i.kind === 'marker' || (i.kind === 'line' && i.file);
      });
      stage = r[1] || stage;
      stage.cuts = stage.cuts || {}; stage.at = stage.at || {}; stage.subs = stage.subs || {};
      total = items.filter(function (i) { return i.kind === 'line'; }).length;
      if (!total) return;
      buildUI();
    }).catch(function (e) {
      if (window.console) console.info('[有聲講解] 未啟用：', e && e.message);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

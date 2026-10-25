// 開場旁白：播放 assets/museum/audio/intro_zh.mp3，依 intro_zh.json 的時間顯示字幕，並在每一句開始時通知（倒數、起飛）。
// 沒有音檔（還沒錄）就回傳 null，開場照舊無聲播放。
export async function loadNarration({ base, ver }) {
  try {
    const r = await fetch(base + 'intro_zh.json?v=' + ver);
    if (!r.ok) return null;
    const cues = await r.json();
    if (!cues || !Array.isArray(cues.lines) || !cues.lines.length) return null;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = base + 'intro_zh.mp3?v=' + ver;
    return makeNarration(audio, cues);
  } catch (e) {
    return null;
  }
}

function makeNarration(audio, cues) {
  const box = document.getElementById('narration');
  const txt = box ? box.querySelector('p') : null;
  let raf = 0, playing = false, onCue = null, fired = new Set(), shown = '';

  function show(text) {
    if (!box || text === shown) return;
    shown = text;
    if (text) { txt.textContent = text; box.hidden = false; requestAnimationFrame(() => box.classList.add('on')); }
    else box.classList.remove('on');
  }
  function tick() {
    raf = 0;
    if (!playing) return;
    const t = audio.currentTime;
    let cur = null;
    for (const c of cues.lines) {
      if (t >= c.start && !fired.has(c.id)) { fired.add(c.id); if (onCue) onCue(c); }
      if (t >= c.start - 0.05 && t < c.end + 0.4) cur = c;
    }
    // 倒數與「出發」用大字顯示在畫面中央，不另外出字幕
    show(cur && cur.role !== 'count' && cur.role !== 'launch' ? cur.sub : '');
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    playing = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    try { audio.pause(); } catch (e) { /* ignore */ }
    show('');
  }
  audio.addEventListener('ended', () => { playing = false; show(''); });

  return {
    cues,
    // 一定要在使用者點擊的處理函式裡「直接」呼叫（iPad 才會出聲）。fromId：從哪一句開始。回傳 Promise<是否成功播放>
    play(fromId, cb) {
      stop();
      onCue = cb || null;
      fired = new Set();
      const c0 = fromId ? cues.lines.find(c => c.id === fromId) : null;
      const t0 = c0 ? Math.max(0, c0.start - 0.05) : 0;
      for (const c of cues.lines) if (c.start < t0) fired.add(c.id);
      try { audio.currentTime = t0; } catch (e) { /* 還沒載入時無法跳轉 */ }
      playing = true;
      raf = requestAnimationFrame(tick);
      let p;
      try { p = audio.play(); } catch (e) { stop(); return Promise.resolve(false); }
      return p && p.then ? p.then(() => true, () => { stop(); return false; }) : Promise.resolve(true);
    },
    stop,
  };
}

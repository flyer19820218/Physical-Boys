// 開場音效：用 Web Audio 現場合成（不需要音檔），配合蟲洞段：低頻隆隆聲、往上掃的光束聲、倒轉的時鐘滴答聲，
// 出洞那一刻「轟」一聲加一道亮亮的掃頻。整體音量很小，壓在曉臻旁白底下，不蓋過人聲。
// iPad／Safari 規定聲音要在使用者點擊時才能啟動：createSfx() 一定要在點擊的處理函式裡「直接」呼叫。
export function createSfx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  let ac;
  try { ac = new AC(); } catch (e) { return null; }
  if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* ignore */ } }

  const master = ac.createGain();
  master.gain.value = 0.34;
  master.connect(ac.destination);

  // 白噪音（循環）
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = () => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; return s; };

  let live = []; // 目前在響的聲源，stop() 時一起關掉
  let tickTimer = 0;
  const track = n => { live.push(n); return n; };

  function warpStart(durSec = 4.2) {
    const t0 = ac.currentTime + 0.02, d = durSec;
    // 1) 隆隆聲：低通噪音，截止頻率慢慢往上（越飛越快）
    const rum = track(noise());
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(90, t0);
    lp.frequency.exponentialRampToValueAtTime(900, t0 + d);
    const rg = ac.createGain();
    rg.gain.setValueAtTime(0.0001, t0);
    rg.gain.exponentialRampToValueAtTime(0.9, t0 + 0.8);
    rg.gain.setValueAtTime(0.9, t0 + d - 0.2);
    rum.connect(lp); lp.connect(rg); rg.connect(master);
    rum.start(t0);

    // 2) 低音脈動：鋸齒波加 LFO，音高往上爬
    const pad = track(ac.createOscillator());
    pad.type = 'sawtooth';
    pad.frequency.setValueAtTime(48, t0);
    pad.frequency.exponentialRampToValueAtTime(150, t0 + d);
    const pf = ac.createBiquadFilter();
    pf.type = 'lowpass'; pf.frequency.value = 420;
    const pg = ac.createGain();
    pg.gain.setValueAtTime(0.0001, t0);
    pg.gain.exponentialRampToValueAtTime(0.28, t0 + 1.0);
    const lfo = track(ac.createOscillator());
    lfo.frequency.value = 5.5;
    const lg = ac.createGain();
    lg.gain.value = 0.12;
    lfo.connect(lg); lg.connect(pg.gain);
    pad.connect(pf); pf.connect(pg); pg.connect(master);
    pad.start(t0); lfo.start(t0);

    // 3) 往上掃的亮光聲：正弦波 380 → 2400 Hz，加一點顫音
    const sh = track(ac.createOscillator());
    sh.type = 'sine';
    sh.frequency.setValueAtTime(380, t0 + 0.4);
    sh.frequency.exponentialRampToValueAtTime(2400, t0 + d);
    const sg = ac.createGain();
    sg.gain.setValueAtTime(0.0001, t0 + 0.4);
    sg.gain.exponentialRampToValueAtTime(0.1, t0 + d * 0.8);
    const tre = track(ac.createOscillator());
    tre.frequency.value = 9;
    const tg = ac.createGain();
    tg.gain.value = 0.05;
    tre.connect(tg); tg.connect(sg.gain);
    sh.connect(sg); sg.connect(master);
    sh.start(t0 + 0.4); tre.start(t0 + 0.4);

    // 4) 時鐘滴答：越來越快（時間在倒轉的感覺），每一下是一小段高通噪音
    let k = 0;
    const nextTick = () => {
      tickTimer = 0;
      if (ac.state === 'closed') return;
      const now = ac.currentTime, prog = Math.min(1, Math.max(0, (now - t0) / d));
      if (now - t0 > d + 0.1) return;
      const s = ac.createBufferSource(); s.buffer = nb;
      const hp = ac.createBiquadFilter();
      hp.type = 'bandpass'; hp.frequency.value = 2600 + 1400 * prog; hp.Q.value = 6;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.32 * (k % 2 ? 0.7 : 1), now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      s.connect(hp); hp.connect(g); g.connect(master);
      s.start(now, Math.random()); s.stop(now + 0.07);
      k++;
      const gap = 0.42 - 0.3 * prog; // 0.42 秒一下 → 0.12 秒一下
      tickTimer = setTimeout(nextTick, gap * 1000);
    };
    tickTimer = setTimeout(nextTick, 250);
  }

  // 出洞：低頻「轟」＋一道高頻掃頻（閃光），原本的隆隆聲快速收掉
  function warpEnd() {
    const now = ac.currentTime + 0.01;
    live.forEach(n => { try { n.stop(now + 0.35); } catch (e) { /* 已停止 */ } });
    live = [];
    if (tickTimer) { clearTimeout(tickTimer); tickTimer = 0; }

    const boom = ac.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(130, now);
    boom.frequency.exponentialRampToValueAtTime(38, now + 0.7);
    const bg = ac.createGain();
    bg.gain.setValueAtTime(0.0001, now);
    bg.gain.exponentialRampToValueAtTime(1.0, now + 0.03);
    bg.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    boom.connect(bg); bg.connect(master);
    boom.start(now); boom.stop(now + 1.2);

    const wh = noise();
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(500, now);
    bp.frequency.exponentialRampToValueAtTime(7000, now + 0.9);
    const wg = ac.createGain();
    wg.gain.setValueAtTime(0.0001, now);
    wg.gain.exponentialRampToValueAtTime(0.7, now + 0.12);
    wg.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    wh.connect(bp); bp.connect(wg); wg.connect(master);
    wh.start(now); wh.stop(now + 1.3);

    // 一聲清亮的「叮」（穿越成功）
    const ding = ac.createOscillator();
    ding.type = 'triangle';
    ding.frequency.value = 1318.5; // E6
    const dg = ac.createGain();
    dg.gain.setValueAtTime(0.0001, now + 0.18);
    dg.gain.exponentialRampToValueAtTime(0.22, now + 0.2);
    dg.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    ding.connect(dg); dg.connect(master);
    ding.start(now + 0.18); ding.stop(now + 1.2);
  }

  function stop() {
    if (tickTimer) { clearTimeout(tickTimer); tickTimer = 0; }
    live.forEach(n => { try { n.stop(); } catch (e) { /* ignore */ } });
    live = [];
    try { master.gain.setTargetAtTime(0, ac.currentTime, 0.05); } catch (e) { /* ignore */ }
    setTimeout(() => { try { ac.close(); } catch (e) { /* ignore */ } }, 1800);
  }

  return { warpStart, warpEnd, stop };
}

// biology_immune_defense 逐句模擬（2026-11-18，人體的防禦作用）：用假音訊（每句 2～3 秒，真實時間流動）把整課播一遍，
//  ・每句開始、結束各讀一次 LivingBook 狀態（分頁 id、scenario／stage／sequence／mechanism／symptom／antigen／antibody／dock／memoryCase／moment），
//    和 stage.json 的 cuts／at 推算的期望畫面（ImmuneLesson.preset 的控制鈕）比對
//  ・每句結束時 #captionText 必須含該畫面的關鍵字（CAPKEY）；另外印出每句台詞與字幕開頭，給人工判斷主題是否一致
//  ・螢光筆：HLSPEC 的 s／e 是否在台詞裡；句末 .vx-hl 段數是否等於 HLSPEC 段數、而且都 display:block（＝RECT 的 regex 在字幕裡找到）
//  ・全程不得出現 body.mode-teacher（開播前故意先按「老師講解」並停在別的分頁，測開播會切回學生操作、第 1 句切回第一段）
// 用法：repo 根目錄先 python3 -m http.server 8803，再 NODE_PATH=$(npm root -g) node tools/voice/lesson_studio/sim/sim_lines_biology_immune_defense.js [輸出 json]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../../../..');
const LESSON = 'biology_immune_defense';
const AUDIO = path.join(REPO, 'audio', LESSON, '/');
const manifest = JSON.parse(fs.readFileSync(AUDIO + 'manifest.json', 'utf8'));
const stage = JSON.parse(fs.readFileSync(AUDIO + 'stage.json', 'utf8'));
const PORT = process.env.PORT || 8803;
const OUT = process.argv[2] || path.join(process.env.TMPDIR || '/tmp', 'sim_immune_result.json');

// 播放器的螢光筆表
const HLSPEC = (() => {
  const src = fs.readFileSync(path.join(REPO, LESSON + '_voice_v1.js'), 'utf8');
  const m = /var HLSPEC = (\{[\s\S]*?\n  \});/.exec(src);
  return eval('(' + m[1] + ')');
})();

// 子頁 → 期望狀態（只比對這個子頁的控制鈕會決定的欄位）
const WANT = {
  barrier: { intact: { scenario: 'intact', observe: 'auto' }, wound: { scenario: 'wound', observe: 'auto' }, mucosa: { scenario: 'mucosa', observe: 'auto' } },
  phagocytosis: Object.fromEntries([0, 1, 2, 3, 4, 5].map(i => ['s' + i, { stage: i, sequence: 'step' }])),
  inflammation: {
    base: { mechanism: 0 }, dil: { mechanism: 1 }, perm: { mechanism: 2 }, rec: { mechanism: 3 }, all: { mechanism: 4 },
    sym0: { mechanism: 4, symptom: 0 }, sym1: { mechanism: 4, symptom: 1 }, sym2: { mechanism: 4, symptom: 2 }, sym3: { mechanism: 4, symptom: 3 }
  },
  antibody: {
    tips: { antigen: 0, antibody: 0, dock: 0 }, ibind: { antigen: 0, antibody: 1, dock: 1 },
    bind: { antigen: 0, antibody: 0, dock: 1 }, assist: { antigen: 0, antibody: 0, dock: 2 }
  },
  memory: { first: { memoryCase: 0, moment: 'auto' }, recall: { memoryCase: 1, moment: 'auto' }, other: { memoryCase: 2, moment: 'auto' } }
};
// 子頁 → #captionText 必須出現的字（取自 immune_defense_1014_v1.js 的說明文字）
const CAPKEY = {
  intact: '完整屏障外側', wound: '經缺口進入組織', mucosa: '黏液',
  s0: '下方是微血管', s1: '穿越血管壁', s2: '接近還不是吞噬', s3: '開口尚未閉合', s4: '小囊', s5: '分解成碎片',
  base: '比較基準', dil: '血液供應增加', perm: '通過血管壁', rec: '受到訊號引導', all: '同時改變',
  sym0: '看起來較紅', sym1: '溫熱', sym2: '腫脹', sym3: '病原體咬人',
  tips: '兩端結合部位相同', ibind: '不形成結合', bind: '凸起嵌入互補凹槽', assist: '協助吞噬細胞',
  first: '第一次對甲', recall: '已有與甲相符', other: '乙的抗原不同'
};

// 依序套用 cuts／at，得到每句的期望畫面
const lines = [];
let cur = null;
for (const it of manifest.items) {
  if (it.kind === 'marker') {
    const m = /^[＊*]\s*切頁\s*[：:]\s*(.+)$/.exec(it.text || '');
    if (m) { const c = stage.cuts[m[1].trim()]; if (!c) throw new Error('切頁標題找不到：' + m[1]); cur = { tab: c.tab, sub: c.sub }; }
    continue;
  }
  const a = stage.at[it.id];
  if (a) cur = { tab: a.tab, sub: a.sub };
  lines.push({ id: it.id, file: it.file, text: it.text, want: cur && { ...cur } });
}

// 螢光筆的靜態檢查：s／e 在台詞裡
const hlStatic = [];
for (const [id, segs] of Object.entries(HLSPEC)) {
  const L = lines.find(l => l.id === id);
  segs.forEach((g, i) => {
    const si = L ? L.text.indexOf(g.s) : -1, ei = L ? L.text.indexOf(g.e, Math.max(0, si)) : -1;
    if (si < 0 || ei < 0) hlStatic.push(`${id}#${i} s/e 不在台詞裡（s=${g.s} ${si}，e=${g.e} ${ei}）`);
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.addInitScript(() => {
    window.__log = []; window.__teacherSeen = 0;
    const KEYS = ['scenario', 'observe', 'sequence', 'stage', 'mechanism', 'symptom', 'antigen', 'antibody', 'dock', 'notice', 'memoryCase', 'moment'];
    window.__snap = () => {
      const L = window.LivingBook; if (!L || !L.getTab) return { teacher: document.body.classList.contains('mode-teacher') };
      const s = L.getState() || {}, o = { tab: L.getTab().id, teacher: document.body.classList.contains('mode-teacher') };
      KEYS.forEach(k => { if (k in s) o[k] = s[k]; });
      o.cap = (document.getElementById('captionText') || {}).textContent || '';
      return o;
    };
    class FakeAudio {
      constructor() { this._t0 = 0; this.duration = NaN; this.paused = true; this.onended = null; this.onerror = null; this.dataset = {}; this.preload = 'auto'; this._src = ''; this.ended = false; }
      set src(v) { this._src = v; } get src() { return this._src; }
      get currentTime() { return this.paused || !this._t0 ? 0 : (performance.now() - this._t0) / 1000; }
      set currentTime(v) {}
      play() {
        const self = this, src = this._src, txt = (document.querySelector('.vx-txt') || {}).textContent || '';
        this.duration = Math.min(3, Math.max(2, txt.length * 0.07));
        this.paused = false; this.ended = false; this._t0 = performance.now();
        const rec = { src, start: window.__snap() };
        window.__log.push(rec);
        const poll = setInterval(() => { if (document.body.classList.contains('mode-teacher')) window.__teacherSeen++; }, 40);
        setTimeout(() => {
          if (self._src !== src) return;
          clearInterval(poll);
          rec.hl = Array.from(document.querySelectorAll('#vx-hl-layer .vx-hl')).map(e => ({ seg: e.dataset.seg, disp: e.style.display, w: parseFloat(e.style.width) || 0 }));
          rec.end = window.__snap();
          self.paused = true; self.ended = true; if (self.onended) self.onended();
        }, this.duration * 1000);
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
    window.Audio = FakeAudio;
    window.fetch = (orig => function (u, o) { return /\.mp3/.test(String(u)) ? Promise.resolve(new Response('')) : orig(u, o); })(window.fetch);
  });
  await page.goto(`http://127.0.0.1:${PORT}/${LESSON}.html?v=sim${Date.now()}`, { waitUntil: 'load' });
  await page.waitForSelector('.vx-open', { timeout: 15000 });
  await page.click('#introScreen', { force: true }).catch(() => {});
  await page.waitForTimeout(600);
  // 故意先停在最後一個分頁並打開老師講解：開播後應切回學生操作，第 1 句回到第一段畫面
  await page.evaluate(() => { const L = window.LivingBook; L.setTab(4); });
  await page.click('#mode-teacher').catch(() => {});
  await page.waitForTimeout(500);
  const teacherBefore = await page.evaluate(() => document.body.classList.contains('mode-teacher'));
  await page.click('.vx-open');
  await page.click('button[aria-label="開始／繼續"]');
  const t0 = Date.now();
  while (true) {
    // 結束判斷：出現「講解結束」，或最後一句已經唸完（播放器 finish() 若丟錯就不會出現那句字）
    const done = await page.evaluate(n => ((document.querySelector('.vx-txt') || {}).textContent || '').includes('講解結束') ||
      (window.__log.length >= n && !!window.__log[n - 1].end), lines.length);
    if (done) { await page.waitForTimeout(800); break; }
    if (Date.now() - t0 > 600000) { console.log('TIMEOUT'); break; }
    await page.waitForTimeout(250);
  }
  const log = await page.evaluate(() => window.__log);
  const teacherSeen = await page.evaluate(() => window.__teacherSeen);
  await browser.close();

  const diff = (w, s) => {
    if (!w) return ['無期望畫面'];
    if (!s) return ['無狀態'];
    const out = [];
    if (s.tab !== w.tab) out.push(`tab=${s.tab}≠${w.tab}`);
    const ww = WANT[w.tab][w.sub];
    Object.keys(ww).forEach(k => { if (s[k] !== ww[k]) out.push(`${k}=${JSON.stringify(s[k])}≠${JSON.stringify(ww[k])}`); });
    return out;
  };
  let mismatch = 0, capBad = 0, hlBad = 0; const rows = [], issues = [];
  lines.forEach((L, i) => {
    const r = log[i] || {};
    const fileOk = r.src && r.src.indexOf(encodeURIComponent(L.file)) >= 0;
    const dS = diff(L.want, r.start), dE = diff(L.want, r.end);
    if (!fileOk) issues.push(`${L.id} 音檔順序不符（${r.src}）`);
    if (dS.length || dE.length) { mismatch++; issues.push(`${L.id} 狀態不符 開始[${dS.join(',')}] 結束[${dE.join(',')}]`); }
    const cap = (r.end && r.end.cap) || '', key = L.want && CAPKEY[L.want.sub];
    const capOk = !!key && cap.indexOf(key) >= 0;
    if (!capOk) { capBad++; issues.push(`${L.id} 字幕缺關鍵字「${key}」：${cap.slice(0, 40)}`); }
    const spec = HLSPEC[L.id];
    let hl = '';
    if (spec) {
      const shown = (r.hl || []).filter(h => h.disp === 'block' && h.w > 0);
      const segs = new Set(shown.map(h => h.seg));
      hl = `${segs.size}/${spec.length}`;
      if (segs.size !== spec.length) { hlBad++; issues.push(`${L.id} 螢光筆畫出 ${hl}（RECT ${spec.map(g => g.k).join(',')} 在字幕裡找不到？）`); }
    }
    rows.push({ id: L.id, want: L.want && (L.want.tab + '/' + L.want.sub), text: L.text, cap: cap.slice(0, 50), capOk, hl, start: dS, end: dE });
  });
  const res = {
    lines: lines.length, mismatches: mismatch, captionKeyMissing: capBad, hlNotDrawn: hlBad, hlStatic,
    pageErrors: errors, teacherBefore, teacherSeenDuringPlay: teacherSeen, issues, rows
  };
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  rows.forEach(r => console.log(`${r.id} ${r.want.padEnd(22)} ${r.capOk ? 'ok' : 'XX'} ${r.hl ? 'HL' + r.hl : '    '} ｜${r.text.slice(0, 22)}｜${r.cap.slice(0, 26)}`));
  console.log(JSON.stringify({ lines: res.lines, mismatches: mismatch, captionKeyMissing: capBad, hlNotDrawn: hlBad, hlStatic: hlStatic.length, pageErrors: errors.length, teacherBefore, teacherSeenDuringPlay: teacherSeen }));
  issues.forEach(s => console.log('  ! ' + s));
  errors.forEach(s => console.log('  E ' + s));
  console.log('→ ' + OUT);
  process.exit(mismatch || capBad || hlBad || hlStatic.length || errors.length || teacherSeen ? 1 : 0);
})();

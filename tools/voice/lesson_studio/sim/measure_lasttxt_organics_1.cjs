// 量每支 W5 動畫每一步「最後一段字出現」的秒數（W5.seek＋W5.debug 每 0.05 秒取樣；只會跳動的數字不算新字：數字換成 #）。
// 用法：repo 根目錄 python3 -m http.server 8765 在執行，再：NODE_PATH=$(npm root -g) node measure_lasttxt_organics_1.cjs [id id ...]（不給＝全部 12 支）；結果寫進 lasttxt_organics_1.json（合併）
const { chromium } = require('playwright'); const fs = require('fs');
const TAB = { urea: 'tab1', except: 'tab1', char: 'tab2', distill: 'tab2', products: 'tab2', testc: 'tab3', testh: 'tab3', iso: 'tab4', props: 'tab4', smoke: 'tab5', cuo: 'tab5', cuso4: 'tab5' };
(async () => {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TAB);
  const out = __dirname + '/lasttxt_organics_1.json';
  const res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('http://127.0.0.1:8765/organics_1.html?m=' + Date.now(), { waitUntil: 'load' });
  await p.evaluate(() => { const e = document.getElementById('introScreen'); if (e) e.remove(); });
  for (const id of ids) {
    await p.evaluate(([id, tab]) => { document.querySelector('.tab-btn[data-tab="' + tab + '"]').click(); setSub(tab, id); W5.stopAll(); W5.debug = true; }, [id, TAB[id]]);
    await p.waitForTimeout(300);
    const r = await p.evaluate(id => {
      const inf = W5.info(id), bounds = inf.bounds, total = inf.total, last = [], norm = s => String(s).replace(/[0-9]+(\.[0-9]+)?/g, '#');
      let prev = '', stepNo = 0;
      for (let k = 0; k < bounds.length - 1 || k < 4; k++) {
        const t0 = bounds[k], t1 = k + 1 < bounds.length ? bounds[k + 1] : total; let lastT = t0;
        const seen = new Set();
        for (let t = t0 + 0.05; t <= t1 - 0.01; t += 0.05) {
          W5.boxes = []; W5.seek(id, t);
          const cur = new Set(W5.boxes.map(q => norm(q.str)));
          for (const s of cur) if (!seen.has(s)) { seen.add(s); lastT = t; }
        }
        last.push(+(lastT - t0).toFixed(2));
        if (last.length === 4) break;
      }
      return { last, bounds, total };
    }, id);
    res[id] = r.last; console.log(id, JSON.stringify(r.last), 'bounds', JSON.stringify(r.bounds.map(x=>+x.toFixed(2))));
  }
  fs.writeFileSync(out, JSON.stringify(res), 'utf8'); await b.close();
})();

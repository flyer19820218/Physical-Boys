// 逐頁載入檢查（大量修改後快速掃一遍）：
//   node tools/qa/smoke.cjs                    → 檢查專案根目錄所有 *.html
//   node tools/qa/smoke.cjs a.html b.html ...  → 只檢查指定頁面
// 每頁：載入、點掉封面、切到英文、點前 3 個分頁，回報 JS 錯誤；並數英文畫面上還看得到幾個彎撇號。
const fs = require('fs'), path = require('path');
const { launch, BASE } = require('./lib.cjs');
(async () => {
  const root = path.join(__dirname, '..', '..');
  const pages = process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync(root).filter(f => f.endsWith('.html')).sort();
  const b = await launch(), bad = []; let ok = 0;
  for (const page of pages) {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 1024 } }), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 140)));
    try {
      await p.goto(BASE + page + '?s=' + Date.now(), { timeout: 20000 }); await p.waitForTimeout(900);
      const intro = await p.$('#introScreen'); if (intro) await intro.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(700);
      await p.evaluate(() => { const b = document.querySelector('#btn-lang-en,[data-lang="en"],[data-index-lang="en"],[onclick*="setLang(\'en\')"]'); if (b) b.click(); if (typeof setIndexLanguage === 'function') setIndexLanguage('en'); });
      await p.waitForTimeout(600);
      const n = await p.locator('.tab-btn').count();
      for (let i = 0; i < Math.min(n, 3); i++) { await p.locator('.tab-btn').nth(i).click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(350); }
      const curly = await p.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let c = 0, t; while (t = w.nextNode()) { const el = t.parentElement; if (!el || /SCRIPT|STYLE/.test(el.tagName) || !el.offsetParent) continue; if (/[A-Za-z][’‘]|[’‘][A-Za-z]/.test(t.textContent)) c++; } return c; });
      if (errs.length || curly) bad.push(`${page}: errors=${JSON.stringify(errs)} visibleCurlyApostrophes=${curly}`); else ok++;
    } catch (e) { bad.push(page + ': ' + e.message.slice(0, 100)); }
    await ctx.close();
  }
  console.log('clean pages', ok, 'of', pages.length); console.log(bad.length ? bad.join('\n') : 'no problems'); await b.close();
})();

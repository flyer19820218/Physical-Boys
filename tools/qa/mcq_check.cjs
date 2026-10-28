// 選擇題選項長度檢查（AGENTS.md 8.2／8.3）。用法：node tools/qa/mcq_check.cjs assets/quiz/quiz_xxx.js [更多題庫檔...]
// 讀「LessonQuiz.add / addStatic」格式的題庫（Q(P(中,英),[P選項...],正解索引,P解答,P提示)），回報：
//   每題：最長與最短相差是否超標、正解是否唯一最長／唯一最短（中英文各量一次）；
//   整檔：唯一最長／唯一最短的比例、各字母（A–D）正解分布（addStatic 題庫用轉接器同一個洗牌算出真正顯示的字母）。
// 題數少於 5 題的檔，整檔比例沒有意義，只看每題。
const fs = require('fs');
const P = (zh, en) => [zh, en], Q = (q, options, answer, why, hint) => ({ q, options, answer, why, hint });
function order(key, n) { let h = 2166136261; for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1103515245) + 12345 >>> 0; const j = h % (i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; }
const len = s => [...s].length, pc = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
let bad = 0;
for (const file of process.argv.slice(2)) {
  const cap = [];
  global.window = { LessonQuiz: { P, Q, add: (u, b) => cap.push({ u, b, st: false }), addStatic: (u, b) => cap.push({ u, b, st: true }) } };
  new Function('window', fs.readFileSync(file, 'utf8'))(global.window);
  const T = { n: 0, lo: [0, 0], sh: [0, 0], sp: [0, 0], L: [0, 0, 0, 0] }; const notes = [];
  for (const { u, b, st } of cap) for (const [sel, qs] of Object.entries(b)) (Array.isArray(qs) ? qs : [qs]).forEach((q, qi) => {
    if (!q || !q.options) return; T.n++;
    [0, 1].forEach(lang => {
      const L = q.options.map(o => len(o[lang])), mx = Math.max(...L), mn = Math.min(...L), a = L[q.answer], lim = mn <= 10 ? 3 : Math.ceil(mn * 0.3);
      const lo = a === mx && L.filter(x => x === mx).length === 1, sh = a === mn && L.filter(x => x === mn).length === 1, sp = mx - mn > lim;
      if (lo) T.lo[lang]++; if (sh) T.sh[lang]++; if (sp) T.sp[lang]++;
      if (lo || sh || sp) notes.push(`  ${sel} 第${qi + 1}題 ${lang ? 'EN' : '中'} 字數 ${L.join('/')} 正解=${a}${lo ? ' 唯一最長' : ''}${sh ? ' 唯一最短' : ''}${sp ? ` 差距${mx - mn}>${lim}` : ''}`);
    });
    if (st) T.L[order(`${u}:${sel}:${qi}`, q.options.length).indexOf(q.answer)]++;
  });
  const flag = T.n >= 5 && [0, 1].some(l => T.lo[l] / T.n > .35 || T.sh[l] / T.n > .35);
  console.log(`${file}  ${T.n} 題｜中文 唯一最長 ${pc(T.lo[0], T.n)} 唯一最短 ${pc(T.sh[0], T.n)} 差距超標 ${T.sp[0]} 題｜EN 唯一最長 ${pc(T.lo[1], T.n)} 唯一最短 ${pc(T.sh[1], T.n)} 差距超標 ${T.sp[1]} 題｜正解字母 A/B/C/D = ${T.L.join('/')}${flag ? '  ⚠ 超過 35%' : ''}`);
  notes.forEach(n => console.log(n)); if (notes.length || flag) bad++;
}
process.exitCode = bad ? 1 : 0;

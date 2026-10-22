// 真菌分頁 2（yeast 動畫）截圖：每個步驟 × 中英（步驟 2、3 另拍不同預測），存成 PNG。
// 用法：node local-backups/20261022/fungi_ai_originals/qa_yeast_shots_1022.cjs [只拍的名稱關鍵字]
const {launch,BASE,shot}=require('../../../tools/qa/lib.cjs');
(async()=>{const b=await launch();const p=await (await b.newContext({viewport:{width:1366,height:1024}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(BASE+'biology_fungi.html?q='+Date.now());await p.waitForTimeout(1200);
await p.click('#introScreen').catch(()=>{});await p.waitForTimeout(1200);
await p.evaluate(()=>window.LivingBook.setTab(1));await p.waitForTimeout(800);
const fonts=await p.evaluate(async()=>{await document.fonts.load('700 22px "Noto Sans TC"');await document.fonts.load('700 22px "JetBrains Mono"');return[document.fonts.check('700 22px "Noto Sans TC"'),document.fonts.check('700 22px "JetBrains Mono"')];});
console.log('fonts NotoSansTC/JetBrainsMono:',fonts);
const only=process.argv[2]||'';
const cases=[[0,-1,7],[1,-1,4],[1,1,4],[2,0,8],[2,2,8],[2,-1,8],[3,1,6]];
for(const L of ['zh','en'])for(const [ph,g,wait] of cases){const name=`yeast_${L}_s${ph+1}_g${g}`;if(only&&!name.includes(only))continue;
  await p.evaluate(([L,ph,g])=>{const B=window.LivingBook;B.setLanguage(L);B.action('guess',g);B.action('phase',ph);},[L,ph,g]);
  await p.waitForTimeout(wait*1000);
  const data=await p.evaluate(()=>document.getElementById('lessonCanvas').toDataURL('image/png'));
  require('fs').writeFileSync(shot(name+'.png'),Buffer.from(data.split(',')[1],'base64'));console.log('saved',shot(name+'.png'));}
console.log('errors:',errs.length?errs:'none');await b.close();})();

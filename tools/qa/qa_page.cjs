// 通用 V5 教材檢查：node tools/qa/qa_page.cjs weather_wind_3.html [其他頁面...]
// 每個分頁、中英文各跑一次：JS 錯誤、字體、封面是否有字、未定義函式、Base64/純黑/MathJax、1080px、
// 每張畫布 1 秒前後像素差（閒置不動的會點按鈕／拖曳後再量）、Hook 頭像、英文版殘留中文、控制項高度。
const {launch,BASE,shot,out:outFile}=require('./lib.cjs');const fs=require('fs');
(async()=>{const b=await launch();
const out={};
for(const page of process.argv.slice(2)){
 const R={errs:[],bad:[],tabs:[]};out[page]=R;
 const ctx=await b.newContext({viewport:{width:1366,height:1024}});const p=await ctx.newPage();
 p.on('pageerror',e=>R.errs.push('pageerror '+e.message.slice(0,160)));p.on('console',m=>{if(m.type()==='error')R.errs.push('console '+m.text().slice(0,160))});
 p.on('response',r=>{if(r.status()>=400)R.bad.push(r.status()+' '+r.url().replace(BASE,''))});p.on('requestfailed',r=>{if(!/fonts\.(g|google)/.test(r.url()))R.bad.push('FAIL '+r.url())});
 await p.goto(BASE+page+'?q='+Date.now());await p.waitForTimeout(1200);await p.evaluate(()=>document.fonts.ready);
 R.pre=await p.evaluate(()=>{const intro=document.getElementById('introScreen');const src=document.documentElement.outerHTML;
  const fnCalls=[...new Set([...src.matchAll(/\bon(?:click|input|change|keydown)="\s*([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]))];
  return {title:document.title,h1:(document.querySelector('h1')||{}).innerText,lang:document.documentElement.lang,
   fonts:[document.fonts.check('700 22px "Noto Sans TC"'),document.fonts.check('700 22px "JetBrains Mono"')],
   introText:intro?intro.innerText.trim():null,introImgs:intro?[...intro.querySelectorAll('img')].map(i=>i.getAttribute('src')):[],
   introBg:intro?getComputedStyle(intro).backgroundImage.slice(0,120):null,
   undefinedFns:fnCalls.filter(n=>typeof window[n]!=='function'),
   html:{base64:(src.match(/data:image\/[a-z+]+;base64/g)||[]).length,black:(src.match(/#000(?![0-9a-fA-F])|#000000/g)||[]).length,mathjax:/mathjax|\$\$/i.test(src),max1080:/max-width:\s*1080px/.test(src),
    chap:(document.body.innerText.match(/第[一二三四五六七八九十\d]+[章節單元]|\b\d-\d\b|Chapter \d/g)||[])}};});
 const intro=await p.$('#introScreen');if(intro){await intro.click().catch(()=>{});await p.waitForTimeout(1500);}
 const n=await p.evaluate(()=>document.querySelectorAll('.tab-btn').length);R.nTabs=n;
 async function snap(){return p.evaluate(()=>[...document.querySelectorAll('canvas')].filter(c=>c.offsetParent!==null&&c.width>0&&c.height>0).map(c=>{let s=[];try{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<d.length;i+=64)s.push(d[i],d[i+1],d[i+2]);}catch(e){return {id:c.id,err:1};}return {id:c.id||'(canvas)',w:c.width,h:c.height,s};}));}
 for(const L of ['zh','en']){
  if(L==='en'){await p.evaluate(()=>{const b=document.querySelector('[onclick*="setLang(\'en\')"],[data-lang="en"],#btn-lang-en');if(b)b.click();});await p.waitForTimeout(700);}
  for(let i=0;i<n;i++){
   await p.locator('.tab-btn').nth(i).click({timeout:5000}).catch(e=>R.errs.push('tab click '+i+' '+e.message.slice(0,60)));await p.waitForTimeout(800);
   const a=await snap();await p.waitForTimeout(1000);const c=await snap();
   const mv=a.map((x,k)=>{const y=c[k];if(!y||x.err)return x.id+':?';let d=0;for(let j=0;j<x.s.length;j++)if(Math.abs(x.s[j]-y.s[j])>8)d++;return `${x.id}=${d}`;});

   const stillIds=mv.filter(x=>/=0$/.test(x)).map(x=>x.split('=')[0]);R.react=R.react||[];
   for(const id of stillIds){
    const cv=p.locator('#'+id);let best=0,how='none';
    const diff=async fn=>{const before=await p.evaluate(id=>{const c=document.getElementById(id);const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=[];for(let i=0;i<d.length;i+=64)s.push(d[i],d[i+1],d[i+2]);return s;},id);
     await fn();await p.waitForTimeout(450);
     const after=await p.evaluate(id=>{const c=document.getElementById(id);const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=[];for(let i=0;i<d.length;i+=64)s.push(d[i],d[i+1],d[i+2]);return s;},id);
     await p.waitForTimeout(700);
     const later=await p.evaluate(id=>{const c=document.getElementById(id);const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=[];for(let i=0;i<d.length;i+=64)s.push(d[i],d[i+1],d[i+2]);return s;},id);
     let d1=0,d2=0;for(let j=0;j<before.length;j++){if(Math.abs(before[j]-after[j])>8)d1++;if(Math.abs(after[j]-later[j])>8)d2++;}return [d1,d2];};
    // buttons in the same panel
    const btns=await p.evaluate(id=>{const c=document.getElementById(id);const pn=c.closest('.v5-panel,.panel,section,.card')||c.parentElement.parentElement;return [...pn.querySelectorAll('button')].filter(b=>b.offsetParent&&!/v5Full|fs-btn|Fullscreen|全螢幕/.test((b.getAttribute('onclick')||'')+b.className+b.innerText)).map((b,k)=>k);},id);
    const pnBtns=p.locator('#'+id+' >> xpath=ancestor::*[contains(@class,"v5-panel") or contains(@class,"panel")][1]//button');
    const cnt=await pnBtns.count();
    for(let k=0;k<cnt&&k<14;k++){const bt=pnBtns.nth(k);if(!(await bt.isVisible()))continue;const lab=((await bt.innerText())||'').trim();if(/全螢幕|Full ?screen|⛶/.test(lab))continue;
      try{const [d1,d2]=await diff(async()=>{await bt.click({timeout:1500});});if(d1+d2>best){best=d1+d2;how='button '+lab.slice(0,14);}}catch(e){}}
    try{await cv.scrollIntoViewIfNeeded();const bb=await cv.boundingBox();if(bb){const [d1,d2]=await diff(async()=>{await p.mouse.move(bb.x+bb.width*.35,bb.y+bb.height*.5);await p.mouse.down();await p.mouse.move(bb.x+bb.width*.55,bb.y+bb.height*.4,{steps:8});await p.mouse.up();});if(d1+d2>best){best=d1+d2;how='drag';}}}catch(e){}
    R.react.push({L,i,id,best,how});
   }
   const info=await p.evaluate(()=>{const vis=e=>e.offsetParent!==null;
    const hook=document.querySelector('.tab-content.active .hook-box,.tab-pane.active .hook-box,.hook-box:not([hidden])');
    const hookImg=[...document.querySelectorAll('.hook-box')].filter(vis).map(h=>{const im=h.querySelector('img');return im?im.getAttribute('src').split('/').pop():'(none)';});
    const cjk=[];if(document.documentElement.lang!=='zh-Hant'){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let t;while(t=w.nextNode()){const el=t.parentElement;if(!el||!vis(el)||/SCRIPT|STYLE/.test(el.tagName)||el.closest('.floating-lang-container'))continue;if(/[一-鿿]/.test(t.textContent)&&getComputedStyle(el).visibility!=='hidden')cjk.push(t.textContent.trim().slice(0,30));}}
    const small=[...document.querySelectorAll('main *, .wrap *, .container *')].filter(e=>vis(e)&&e.children.length===0&&e.innerText&&e.innerText.trim().length>3&&parseFloat(getComputedStyle(e).fontSize)<17&&!/^(SCRIPT|STYLE|OPTION)$/.test(e.tagName)).map(e=>Math.round(parseFloat(getComputedStyle(e).fontSize))+'px:'+e.innerText.trim().slice(0,18));
    const ctl=[...document.querySelectorAll('button,select,input[type=range]')].filter(e=>vis(e)&&!e.closest('.floating-lang-container')).map(e=>[(e.id||e.innerText||'').trim().slice(0,16),Math.round(e.getBoundingClientRect().height)]).filter(x=>x[1]<40);
    return {overflowX:document.documentElement.scrollWidth>innerWidth+2,hookImg,cjk:[...new Set(cjk)].slice(0,8),smallCount:small.length,smallEx:small.slice(0,4),ctlSmall:ctl.slice(0,6)};});
   R.tabs.push({L,i,mv,...info});
   if(L==='zh'||i===0)await p.screenshot({path:shot(`q_${page.replace('.html','')}_${L}_${i}.png`),fullPage:false});
  }
 }
 await ctx.close();
}
fs.writeFileSync(outFile('qa_page_out.json'),JSON.stringify(out,null,1));
for(const [pg,R] of Object.entries(out)){console.log('\n=====',pg,'| tabs',R.nTabs,'| title:',R.pre.title,'| h1:',R.pre.h1);
 console.log('fonts',R.pre.fonts,'introText',JSON.stringify(R.pre.introText),'imgs',R.pre.introImgs.join(','),'undefinedFns',JSON.stringify(R.pre.undefinedFns));
 console.log('html',JSON.stringify(R.pre.html));console.log('errs',JSON.stringify([...new Set(R.errs)]),'bad',JSON.stringify([...new Set(R.bad)]));console.log('REACTIVE(idle=still → after trigger):',(R.react||[]).map(r=>`${r.L}#${r.i}:${r.id}=${r.best}(${r.how})`).join(' | '));
 for(const t of R.tabs){const still=t.mv.filter(x=>/=0$|:\?$/.test(x));console.log(t.L,'tab',t.i,'| move',t.mv.join(' '),still.length?'  <-- STILL: '+still.join(','):'','| hook',t.hookImg.join(','),t.overflowX?'| OVERFLOW-X':'', t.cjk.length?'| CJK-in-EN: '+t.cjk.join(' / '):'', t.ctlSmall.length?'| ctl<40: '+JSON.stringify(t.ctlSmall):'', t.smallCount?'| text<17px x'+t.smallCount+' '+t.smallEx.join(';'):'');}}
await b.close();})();

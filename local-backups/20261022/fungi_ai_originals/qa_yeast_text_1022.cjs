// 真菌分頁 2（yeast 動畫）全狀態文字檢查＋10.4 可見度＋10.3 動態。
// 用法：node local-backups/20261022/fungi_ai_originals/qa_yeast_text_1022.cjs   （先跑 tools/qa/serve.sh）
// 1) 每個步驟 × 中英 × 不同預測：攔截 fillText，查字壓字、超出安全區（20～940 / 20～580）、字小於 22px（圓形步驟編號 20px 例外）、
//    寫在圓角色塊（高 < 80）裡的字是否被色塊完整包住（左右至少 4px）。
// 2) 10.4：把同一格畫面在離屏畫布（先塗黑板色 #11261f）重畫，每次跳過一筆 fillText，逐直行比對；有墨的直行連續 4px 以上看不到 = 不合格。
// 3) 10.3：真正的 lessonCanvas 間隔 1 秒的像素差（每步 × 中英；步驟 3 先按「看結果」再量；另量連續播放）。
const {launch,BASE}=require('../../../tools/qa/lib.cjs');
(async()=>{const b=await launch();const p=await (await b.newContext({viewport:{width:1366,height:1024}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE+'biology_fungi.html?q='+Date.now());await p.waitForTimeout(1200);
await p.click('#introScreen').catch(()=>{});await p.waitForTimeout(1000);
await p.evaluate(()=>window.LivingBook.setTab(1));await p.waitForTimeout(800);
const fonts=await p.evaluate(async()=>{await document.fonts.load('700 22px "Noto Sans TC"');await document.fonts.load('700 22px "JetBrains Mono"');return[document.fonts.check('700 22px "Noto Sans TC"'),document.fonts.check('700 22px "JetBrains Mono"')];});
console.log('fonts NotoSansTC / JetBrainsMono:',fonts.join(' / '));if(!fonts.every(Boolean)){console.log('FONT NOT LOADED: layout results invalid');}
const cases=[[0,-1],[1,-1],[1,0],[1,2],[2,-1],[2,0],[2,1],[2,2],[3,-1],[3,2]];
let fails=0;
for(const L of ['zh','en'])for(const [ph,g] of cases){
  await p.evaluate(([L,ph,g])=>{const B=window.LivingBook;B.setLanguage(L);B.getState().running=true;B.action('guess',g);B.action('phase',ph);B.getState().start-=8;},[L,ph,g]);
  await p.waitForTimeout(1600);
  const r=await p.evaluate(()=>{
    const B=window.LivingBook,s=B.getState();s.running=false;const t=s.elapsed,draw=window.FungiDraw.yeast;
    const mk=()=>{const cv=document.createElement('canvas');cv.width=960;cv.height=600;return cv;};
    // render with optional skip; returns ImageData plus text records
    function render(skip,rec){const cv=mk(),c=cv.getContext('2d');c.fillStyle='#11261f';c.fillRect(0,0,960,600);
      const ft=c.fillText.bind(c),rr=c.roundRect.bind(c);let n=0;const texts=[],rects=[];let lastRR=null;
      c.roundRect=function(x,y,w,h,...a){const m=c.getTransform();lastRR={x:m.a*x+m.e,y:m.d*y+m.f,w:m.a*w,h:m.d*h};return rr(x,y,w,h,...a);};
      const fl=c.fill.bind(c);c.fill=function(...a){if(lastRR){rects.push(lastRR);lastRR=null;}return fl(...a);};
      const bp=c.beginPath.bind(c);c.beginPath=function(){lastRR=null;return bp();};
      c.fillText=function(str,x,y,...a){const i=n++;str=String(str);
        if(rec){const m=c.measureText(str),tf=c.getTransform(),al=c.textAlign,w=m.width,sz=parseFloat((c.font.match(/(\d+(?:\.\d+)?)px/)||[0,0])[1])*Math.hypot(tf.a,tf.b);
          let x0=al==='center'?x-w/2:(al==='right'||al==='end')?x-w:x;const asc=m.actualBoundingBoxAscent,desc=m.actualBoundingBoxDescent;
          texts.push({i,s:str,x0:tf.a*x0+tf.e,x1:tf.a*(x0+w)+tf.e,y0:tf.d*(y-asc)+tf.f,y1:tf.d*(y+desc)+tf.f,sz,ga:c.globalAlpha,
            font:c.font,fill:c.fillStyle,tf:[tf.a,tf.b,tf.c,tf.d,tf.e,tf.f],al,bl:c.textBaseline,x,y});}
        if(i===skip)return;return ft(str,x,y,...a);};
      draw(c,s,t);return{d:c.getImageData(0,0,960,600).data,texts,rects};}
    const full=render(-1,true),out={n:full.texts.length,issues:[],items:[]};
    const T=full.texts.filter(x=>x.ga>.02&&x.s.trim());
    for(const x of T){
      if(x.sz<22&&!(x.sz>=20&&/^\d$/.test(x.s)))out.issues.push(`SMALL ${x.sz}px "${x.s}"`);
      if(x.x0<20||x.x1>940||x.y0<20||x.y1>580)out.issues.push(`SAFE-AREA "${x.s}" [${x.x0|0},${x.y0|0},${x.x1|0},${x.y1|0}]`);
      const cx=(x.x0+x.x1)/2,cy=(x.y0+x.y1)/2,box=full.rects.find(r=>r.h<80&&cx>r.x&&cx<r.x+r.w&&cy>r.y&&cy<r.y+r.h);
      if(box&&(x.x0<box.x+4||x.x1>box.x+box.w-4||x.y0<box.y+2||x.y1>box.y+box.h-2))out.issues.push(`PILL-FIT "${x.s}" text [${x.x0|0}..${x.x1|0}] box [${box.x|0}..${(box.x+box.w)|0}]`);
    }
    for(let u=0;u<T.length;u++)for(let v=u+1;v<T.length;v++){const A=T[u],Bb=T[v];
      const ox=Math.min(A.x1,Bb.x1)-Math.max(A.x0,Bb.x0),oy=Math.min(A.y1,Bb.y1)-Math.max(A.y0,Bb.y0);
      if(ox>1&&oy>1)out.issues.push(`OVERLAP "${A.s}" x "${Bb.s}"`);}
    // 10.4 visibility
    for(const x of T){
      const sk=render(x.i,false).d,F=full.d;
      // intended ink: the same text alone on a transparent canvas
      const cv=mk(),c=cv.getContext('2d');c.setTransform(...x.tf);c.font=x.font;c.fillStyle=x.fill;c.textAlign=x.al;c.textBaseline=x.bl;c.globalAlpha=x.ga;c.fillText(x.s,x.x,x.y);
      const I=c.getImageData(0,0,960,600).data;
      const X0=Math.max(0,Math.floor(x.x0)-2),X1=Math.min(959,Math.ceil(x.x1)+2),Y0=Math.max(0,Math.floor(x.y0)-2),Y1=Math.min(599,Math.ceil(x.y1)+2);
      let run=0,worst=0,inkCols=0,visCols=0;
      for(let px=X0;px<=X1;px++){let ink=false,vis=false;
        for(let py=Y0;py<=Y1;py++){const k=(py*960+px)*4;if(I[k+3]>60){ink=true;
          if(Math.max(Math.abs(F[k]-sk[k]),Math.abs(F[k+1]-sk[k+1]),Math.abs(F[k+2]-sk[k+2]))>=24){vis=true;break;}}}
        if(!ink)continue;inkCols++;if(vis){visCols++;run=0;}else{run++;worst=Math.max(worst,run);}}
      out.items.push({s:x.s,worst,ratio:inkCols?visCols/inkCols:1,ga:+x.ga.toFixed(2)});
      if(worst>=4)out.issues.push(`HIDDEN "${x.s}" dead run ${worst}px (visible ${(visCols/inkCols*100)|0}%)`);
    }
    s.running=true;return out;});
  fails+=r.issues.length;
  console.log(`${L} step${ph+1} guess=${g}: ${r.n} fillText, ${r.items.length} checked for 10.4, min visible ${Math.min(...r.items.map(x=>x.ratio)).toFixed(2)}, worst dead run ${Math.max(...r.items.map(x=>x.worst))}px`+(r.issues.length?'\n   '+r.issues.join('\n   '):' — OK'));
}
// 10.3 motion on the real canvas
const diff=async()=>p.evaluate(()=>new Promise(res=>{const cv=document.getElementById('lessonCanvas'),g=()=>cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,a=new Uint8ClampedArray(g());
  setTimeout(()=>{const d=g();let n=0;for(let k=0;k<a.length;k+=4)if(Math.abs(a[k]-d[k])+Math.abs(a[k+1]-d[k+1])+Math.abs(a[k+2]-d[k+2])>24)n++;res(n);},1000);}));
for(const L of ['zh','en']){const row=[];
  for(const ph of [0,1,2,3,-1]){await p.evaluate(([L,ph])=>{const B=window.LivingBook;B.setLanguage(L);B.action('guess',1);B.action('phase',ph);},[L,ph]);
    await p.waitForTimeout(ph===2?600:2500);row.push(`${ph<0?'play-all':'step'+(ph+1)}=${await diff()}`);}
  // idle check long after the result has finished (step 3 held, 12 s later): should still move (bubbles, waves)
  await p.evaluate(()=>{const B=window.LivingBook;B.action('phase',2);B.getState().start-=12;});await p.waitForTimeout(600);row.push(`step3-idle=${await diff()}`);
  console.log(`10.3 ${L}: changed px in 1 s:`,row.join('  '));}
console.log('page errors:',errs.length?errs:'none');console.log(fails?`TOTAL ISSUES ${fails}`:'ALL TEXT CHECKS PASSED');await b.close();})();

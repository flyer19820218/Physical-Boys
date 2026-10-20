// 畫布文字檢查：node tools/qa/qa_text.cjs weather_wind_3.html [其他頁面...]
// 攔截每張畫布的 fillText，找出字壓字、字超出畫布、小於 13px 的字，以及幾乎不動的畫布（中英文各跑一次）。
// 注意：同一分頁有多張畫布時，回報的畫布名稱可能是同分頁的另一張（字框座標本身是準的）。
const {launch,BASE,out:outFile}=require('./lib.cjs');const fs=require('fs');
(async()=>{const b=await launch();
const res={};
for(const page of process.argv.slice(2)){
 const ctx=await b.newContext({viewport:{width:1366,height:1024}});const p=await ctx.newPage();
 await p.addInitScript(()=>{
  window.__F=[];window.__frame=0;const raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=cb=>raf(t=>{window.__frame++;cb(t);});
  const orig=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(str,x,y,...r){
   try{const cv=this.canvas;if(cv&&cv.id&&str!=null&&String(str).trim()){const m=this.measureText(String(str)),tf=this.getTransform(),al=this.textAlign,w=m.width;const sz=parseFloat((this.font.match(/(\d+(?:\.\d+)?)px/)||[0,0])[1]);
    const x0=al==='center'?x-w/2:(al==='right'||al==='end')?x-w:x;const asc=m.actualBoundingBoxAscent||sz*.8,desc=m.actualBoundingBoxDescent||sz*.2;
    const X0=tf.a*x0+tf.e,X1=tf.a*(x0+w)+tf.e,Y0=tf.d*(y-asc)+tf.f,Y1=tf.d*(y+desc)+tf.f;const sc=Math.hypot(tf.a,tf.b);
    window.__F.push({c:cv.id,f:window.__frame,s:String(str).slice(0,40),x0:Math.min(X0,X1),x1:Math.max(X0,X1),y0:Math.min(Y0,Y1),y1:Math.max(Y0,Y1),sz:sz*sc,W:cv.width,H:cv.height,rot:Math.abs(tf.b)>.01});}}catch(e){}
   return orig.call(this,str,x,y,...r);};
 });
 const R={page,issues:[],still:[],tabs:0};res[page]=R;
 await p.goto(BASE+page+'?q='+Date.now());await p.waitForTimeout(1200);
 const intro=await p.$('#introScreen');if(intro){await intro.click().catch(()=>{});await p.waitForTimeout(1500);}
 const n=await p.evaluate(()=>document.querySelectorAll('.tab-btn').length);R.tabs=n;
 for(const L of ['zh','en']){
  if(L==='en'){await p.evaluate(()=>{const b=document.querySelector('[onclick*="setLang(\'en\')"],#btn-lang-en');if(b)b.click();});await p.waitForTimeout(700);}
  for(let i=0;i<n;i++){
   await p.locator('.tab-btn').nth(i).click().catch(()=>{});await p.waitForTimeout(600);
   // make every canvas of this tab scroll into view so its RAF loop (often IntersectionObserver-gated) actually runs
   const ids=await p.evaluate(()=>[...document.querySelectorAll('canvas')].filter(c=>c.offsetParent!==null).map(c=>c.id).filter(Boolean));
   for(const id of ids){
     await p.evaluate(id=>document.getElementById(id).scrollIntoView({block:'center'}),id);await p.waitForTimeout(500);
     await p.evaluate(()=>{window.__F=[];});
     await p.evaluate(id=>{const c=document.getElementById(id);window.__A=new Uint8ClampedArray(c.getContext('2d').getImageData(0,0,c.width,c.height).data);},id);
     await p.waitForTimeout(1000);
     const dd=await p.evaluate(id=>{const c=document.getElementById(id),W=c.width,a=window.__A,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let diff=0,minx=1e9,maxx=-1,miny=1e9,maxy=-1;
       for(let k=0;k<a.length;k+=4){if(Math.abs(a[k]-d[k])+Math.abs(a[k+1]-d[k+1])+Math.abs(a[k+2]-d[k+2])>24){diff++;const px=(k/4)%W,py=Math.floor(k/4/W);if(px<minx)minx=px;if(px>maxx)maxx=px;if(py<miny)miny=py;if(py>maxy)maxy=py;}}
       return {diff,minx,maxx,miny,maxy};},id);
     const {diff,minx,maxx,miny,maxy}=dd;
     if(diff<1500)R.still.push(`${L}#${i}:${id} changedPx=${diff}${diff?` bbox=[${minx},${miny}..${maxx},${maxy}]`:''}`);
     const F=await p.evaluate(()=>window.__F.filter(x=>x.c));
     // overlaps within one frame
     const byFrame={};for(const t of F)(byFrame[t.f+'|'+t.c]=byFrame[t.f+'|'+t.c]||[]).push(t);
     const seen=new Set();
     for(const [k,arr] of Object.entries(byFrame)){
       for(const t of arr){if(t.x0<-2||t.y0<-2||t.x1>t.W+2||t.y1>t.H+2){const key='OFF '+t.s;if(!seen.has(key)){seen.add(key);R.issues.push(`${L}#${i}:${id} OFFCANVAS "${t.s}" [${t.x0|0},${t.y0|0},${t.x1|0},${t.y1|0}] of ${t.W}x${t.H}`);}}
         if(t.sz<13){const key='TINY '+t.s;if(!seen.has(key)){seen.add(key);R.issues.push(`${L}#${i}:${id} TINY ${t.sz.toFixed(1)}px "${t.s}"`);}}}
       for(let u=0;u<arr.length;u++)for(let v=u+1;v<arr.length;v++){const A=arr[u],B=arr[v];if(A.s===B.s||A.rot||B.rot)continue;
         const ox=Math.min(A.x1,B.x1)-Math.max(A.x0,B.x0),oy=Math.min(A.y1,B.y1)-Math.max(A.y0,B.y0);if(ox<=2||oy<=2)continue;
         const inter=ox*oy,minA=Math.min((A.x1-A.x0)*(A.y1-A.y0),(B.x1-B.x0)*(B.y1-B.y0));if(inter/minA<0.25)continue;
         const key=[A.s,B.s].sort().join('|');if(seen.has(key))continue;seen.add(key);
         R.issues.push(`${L}#${i}:${id} OVERLAP ${(inter/minA*100)|0}% "${A.s}" [${A.x0|0},${A.y0|0},${A.x1|0},${A.y1|0}] x "${B.s}" [${B.x0|0},${B.y0|0},${B.x1|0},${B.y1|0}]`);}
     }
   }
  }
 }
 await ctx.close();
}
fs.writeFileSync(outFile('qa_text_out.json'),JSON.stringify(res,null,1));
for(const R of Object.values(res)){console.log('\n=====',R.page,'tabs',R.tabs,'| near-static canvases (<1500 changed px/s):',R.still.length?R.still.join(' ; '):'none');
 console.log(R.issues.length?R.issues.join('\n'):'no text overlaps / off-canvas / tiny text found');}
await b.close();})();

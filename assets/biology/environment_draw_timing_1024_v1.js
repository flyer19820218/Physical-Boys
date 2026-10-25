/* Unit 11 lesson 2 · "timing" canvas (climate-ecological-change tab, view 1), 2026-10-25. Flowers and pollinators fall out of step
 * (plan section 3, timing; P2). Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Always moving: a white time hand goes round the calendar (one lap = LAP s); the arc it is on brightens, the picture of that group
 * lights up, and while the hand is inside the overlap, pollen dots fly from the cherry picture to the white-eye and the honeybee
 * (so a short overlap gives few pollen dots). Dashes march, boxes pulse.
 * Layout (as coral / shift): left = stage (x 16..636), right = step card (x 652..944, y 16..566).
 *   circular calendar centre (CX, CY): a thin track with three plates "early / middle / late" (no month numbers), clockwise from the top;
 *   outer ring = flowering period (mountain cherry, red #fb7185), inner ring = pollinator activity (white-eye, honeybee, blue #60a5fa);
 *   white translucent wedge = overlap. Right column: the flower card (TH13_cherry_bloom) and the pollinator card (TH13_white_eye,
 *   BD3_honeybee), each joined to its arc by a leader in the arc colour. Free strip above the calendar for the step boxes.
 *  0 a normal year: arcs grow in, overlap wedge, "when flowers open, pollinators are active too".
 *  1 temperature changes: orange box (pressure colour, heat waves) and arrow; the flowering arc slides earlier (counter-clockwise),
 *    a dashed red ghost keeps the old position; plate "moves earlier".
 *  2 out of step: the pollinator arc stays (pulsing ring, plate "did not move earlier"); the old overlap is a grey dashed outline,
 *    the new overlap is smaller; box "not all organisms sense the season in the same way".
 *  3 fewer chances: two schematic bars "pollen-carrying chances" (normal year vs after the change, lengths = overlap angle, no
 *    numbers); white dashed box "schematic, does not predict any species".
 * The bloom picture keeps white background pockets between its flower stalks; they are keyed out at run time (near-white,
 * unsaturated pixels -> transparent), the file itself is not changed. Angles, lengths and bar sizes are schematic: no months,
 * temperatures, days or species results.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1,LAP=6;
const WHITE=C.white,MUTED=C.muted,ORANGE=K.COL.pressure,INK=C.ink;
const FLOW='#fb7185',POLL='#60a5fa',POLLEN='#f5d58a',GHOST='#9fb3a8';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/',BLOOM=ENV+'TH13_cherry_bloom.png',EYE=ENV+'TH13_white_eye.png',BEE=ENV+'BD3_honeybee.png';

// ── labels ────────────────────────────────────────────────────────────────
const AI=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
const T={
 tab:P('開花和傳粉者對不上','Flowers and pollinators fall out of step'),
 short:[P('平常的年','A normal year'),P('溫度改變','Temperature changes'),P('沒有同步','Out of step'),P('機會變少','Fewer chances')],
 names:[P('平常的年：兩段時間重疊','A normal year: the two periods overlap'),P('花開的時段往前移','Flowering moves earlier'),P('傳粉者沒有同步','The pollinators do not follow'),P('重疊少，花粉傳遞的機會少','Less overlap, fewer chances to carry pollen')],
 parts:[P('早','Early'),P('中','Middle'),P('晚','Late')],
 year:P('一年','One year'),
 overlap:P('重疊','Overlap'),
 flowH:P('花開的時段','Flowering period'),
 pollH:P('傳粉者活動的時段','Pollinators active'),
 cherry:P('山櫻花','Mountain cherry'),
 eye:P('綠繡眼','White-eye'),
 bee:P('蜜蜂','Honeybee'),
 both:P('花開時，傳粉者也在活動','When flowers open, pollinators are active too'),
 temp:P('溫度改變','Temperature changes'),
 earlier:P('往前移','Moves earlier'),
 nofollow:P('沒有跟著往前移','Did not move earlier'),
 sense:P('不是所有生物都用​同一種方式感應季節','Not all organisms sense the season in the same way'),
 chance:P('花粉傳遞的機會','Chances to carry pollen'),
 normal:P('平常的年','A normal year'),
 after:P('溫度改變後','After the change'),
 noPredict:P('示意，不預測哪個物種','Schematic; no species forecast'),
 legFlow:P('紅色弧：花開的時段','Red: flowering'),
 legPoll:P('藍色弧：傳粉者活動的時段','Blue: pollinators'),
 legOver:P('白色區：兩段重疊','White area: the overlap'),
 legHand:P('白色指針：時間往前走','Hand: time passing'),
 legTemp:P('橘色：溫度改變','Orange: temperature change'),
 legGhostF:P('紅色虛線：原本的花開時段','Red dashes: the old flowering period'),
 legGhostO:P('灰色虛線：原本的重疊','Grey dashes: the old overlap'),
 legPollen:P('金色小點：花粉（示意）','Gold dots: pollen (schematic)'),
 legDash:P('白色虛線框：不確定','White dashed box: not certain'),
 schem:L('schematic','示意','Schematic'),
 ai:P(`圖：${AI[0]}`,`Pictures: ${AI[1]}`)
};

// ── geometry ─────────────────────────────────────────────────────────────
const CX=212,CY=320,RT=172,RF=146,RP=114,RW=20,RLAB=184,HAND0=76;
const F0=[45,115],P0=[65,145],SHIFT=35;                       // degrees clockwise from the top; schematic only
const FC={x:416,y:16,w:220,h:246},PC={x:416,y:296,w:220,h:270};  // flower card, pollinator card
const TOP={x:16,y:16,w:384},EP={x:250,y:100};             // strip above the calendar; 'moves earlier' plate                                   // strip above the calendar
const CARD={x:652,y:16,w:292,h:550};
const rad=d=>(d-90)*Math.PI/180;
const polar=(r,d)=>[CX+r*Math.cos(rad(d)),CY+r*Math.sin(rad(d))];
const inA=(d,a)=>{d=mod(d,360);return d>=a[0]&&d<=a[1];};
const ovl=(a,b)=>{const lo=Math.max(a[0],b[0]),hi=Math.min(a[1],b[1]);return hi>lo?[lo,hi]:null;};

// per-step targets and [delay, duration] when entering a step
const TGT={grow:[1,1,1,1],tag0:[1,0,0,0],fsh:[0,1,1,1],ghostF:[0,1,1,0],temp:[0,1,0,0],ghostO:[0,0,1,1],nofollow:[0,0,1,0],sense:[0,0,1,0],bars:[0,0,0,1],note:[0,0,0,1]};
const SCHED=[{tag0:[1.6,.6]},{temp:[.2,.6],fsh:[1.2,3],ghostF:[1,.5]},{ghostO:[.4,.6],nofollow:[.9,.6],sense:[1.6,.6]},{bars:[.6,.6],note:[2.4,.6]}];

// ── keyed bloom picture (white pockets between the flower stalks -> transparent) ──
const KEYED={};
function keyed(file){
  if(KEYED[file])return KEYED[file];
  const im=K.pic(K.src(file));if(!im)return null;
  try{const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const id=g.getImageData(0,0,cv.width,cv.height),d=id.data;
    for(let i=0;i<d.length;i+=4){const r=d[i],gg=d[i+1],b=d[i+2],mn=Math.min(r,gg,b),mx=Math.max(r,gg,b);
      if(d[i+3]===0||mx-mn>=40)continue;
      if(mn>215)d[i+3]=0;else if(mn>185)d[i+3]=Math.round(d[i+3]*(215-mn)/30);}
    g.putImageData(id,0,0);KEYED[file]=cv;return cv;}catch(e){return null;}
}
function drawKeyed(c,file,r,alpha=1){const cv=keyed(file);if(!cv)return K.drawIn(c,file,r,{alpha});
  c.save();c.globalAlpha*=alpha;c.drawImage(cv,r.x,r.y,r.w,r.h);c.restore();return r;}

// ── helpers (as in coral / shift) ────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、；])|(?<=[:,;] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22,vc=false,g=null}={}){
  g=g||boxGeo(c,p,maxW,size);const bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=vc?y-g.h/2:y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const plateW=(c,p)=>measure(c,p,22)+14;
function plate(c,p,x,y,{al='center',col=WHITE,stroke=null}={}){const w=plateW(c,p),h=32,bx=al==='right'?x-w:al==='left'?x:x-w/2;
  D.round(c,bx,y,w,h,10,FILL,stroke||rgba(col,.75));text(c,p,bx+w/2,y+24,22,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
function heatWave(c,x,y0,len,t,a,amp=6){c.save();c.strokeStyle=rgba(ORANGE,a);c.lineWidth=3;c.lineCap='round';c.beginPath();
  for(let j=0;j<=len;j+=3){const px=x+Math.sin((j+t*40)/9)*amp;j?c.lineTo(px,y0+j):c.moveTo(px,y0+j);}c.stroke();c.restore();}
function arcStroke(c,r,a,col,w,dash=null,off=0){if(a[1]<=a[0])return;c.save();c.beginPath();c.arc(CX,CY,r,rad(a[0]),rad(a[1]));c.strokeStyle=col;c.lineWidth=w;c.lineCap='butt';
  if(dash){c.setLineDash(dash);c.lineDashOffset=off;}c.stroke();c.restore();}
function wedgePath(c,a,r0,r1){c.beginPath();c.arc(CX,CY,r1,rad(a[0]),rad(a[1]));c.arc(CX,CY,r0,rad(a[1]),rad(a[0]),true);c.closePath();}
const pRect=(file,bx,by,bw,bh)=>K.fitRect(file,bx,by,bw,bh);

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.timingSt||(s.timingSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const base=st.from>=0?st.from:Math.max(0,k-1),back=base>k;
  const V={};for(const q in TGT){const sc=back?(TGT[q][k]>TGT[q][base]?[.7,.6]:[0,.6]):(SCHED[k][q]||[0,.8]);V[q]=mix(TGT[q][base],TGT[q][k],smooth((tau-sc[0])/sc[1]));}
  // step 0 on a fresh start: arcs grow in
  if(k===0&&!(st.from>=0&&back))V.grow=smooth((tau-.2)/1.2);
  s_dbg.V=V;
  const sh=SHIFT*V.fsh,F=[F0[0]-sh,F0[1]-sh],Pa=P0.slice();
  const Fg=[F[0],mix(F[0],F[1],V.grow)],Pg=[Pa[0],mix(Pa[0],Pa[1],V.grow)];
  const O=ovl(Fg,Pg),O0=ovl(F0,P0);
  const hd=mod(t/LAP*360,360),onF=inA(hd,Fg),onP=inA(hd,Pg),onO=O&&inA(hd,O);
  const G={F,P:Pa,Fg,Pg,O,O0,hd,onF,onP,onO};
  // smoothed "lit" values for the pictures (how far the hand is inside the arc)
  const lit=a=>{if(a[1]<=a[0])return 0;const d=mod(hd,360);const e=Math.min(d-a[0],a[1]-d);return clamp(.5+e/8);};
  G.litF=lit(Fg);G.litP=lit(Pg);
  calendar(c,V,t,tau,k,G,rects);
  cards(c,V,t,tau,k,G,rects);
  pollen(c,V,t,G);
  strip(c,V,t,tau,k,G,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  text(c,T.schem,16,592,22,MUTED,'left');push(rects,1,'schem',{x:16,y:574,w:measure(c,T.schem,22),h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'ai',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── circular calendar ────────────────────────────────────────────────────
function calendar(c,V,t,tau,k,G,rects){
  // track and the three boundaries (no month numbers)
  circle(c,CX,CY,RT,null,rgba(WHITE,.45),2.5);
  circle(c,CX,CY,RF,null,rgba(WHITE,.08),RW);
  circle(c,CX,CY,RP,null,rgba(WHITE,.08),RW);
  [0,120,240].forEach(d=>{const [a1,b1]=polar(RT-9,d),[a2,b2]=polar(RT+9,d);K.sline(c,[[a1,b1],[a2,b2]],rgba(WHITE,.8),3);});
  // clockwise direction: small arrowhead on the track (lower left, away from the arcs)
  {const [ax,ay]=polar(RT,215),a=rad(215)+Math.PI/2;c.save();c.translate(ax,ay);c.rotate(a);c.beginPath();c.moveTo(9,0);c.lineTo(-6,-7);c.lineTo(-6,7);c.closePath();c.fillStyle=rgba(WHITE,.85);c.fill();c.restore();}
  // ghosts
  withA(c,V.ghostF,()=>arcStroke(c,RF,F0,rgba(FLOW,.9),3,[8,7],-t*10));
  withA(c,V.ghostF,()=>{arcStroke(c,RF-RW/2,F0,rgba(FLOW,.7),2,[8,7],-t*10);arcStroke(c,RF+RW/2,F0,rgba(FLOW,.7),2,[8,7],-t*10);});
  // arcs (brighter while the hand is on them)
  const bF=.72+.28*G.litF*(G.onF?1:0),bP=.72+.28*G.litP*(G.onP?1:0);
  arcStroke(c,RF,G.Fg,rgba(FLOW,bF),RW);
  arcStroke(c,RP,G.Pg,rgba(POLL,bP),RW);
  // step 2: the pollinator arc stays where it was (pulsing outline)
  withA(c,V.nofollow,()=>{const u=mod(t*.7);c.save();wedgePath(c,G.Pg,RP-RW/2-2-5*u,RP+RW/2+2+5*u);c.strokeStyle=rgba(POLL,.9*(1-u));c.lineWidth=3;c.stroke();c.restore();});
  // overlap wedge
  if(G.O){const fl=G.onO?.12+.1*Math.sin(t*12):0;c.save();wedgePath(c,G.O,HAND0,RF+RW/2+2);c.fillStyle=rgba(WHITE,.2+fl);c.fill();c.strokeStyle=rgba(WHITE,.9);c.lineWidth=2.5;c.stroke();c.restore();}
  // old overlap (grey dashes)
  withA(c,V.ghostO,()=>{c.save();wedgePath(c,G.O0,HAND0,RF+RW/2+2);c.setLineDash([7,6]);c.lineDashOffset=-t*10;c.strokeStyle=rgba(GHOST,.95);c.lineWidth=2.5;c.stroke();c.restore();});
  // time hand
  {const [x1,y1]=polar(HAND0,G.hd),[x2,y2]=polar(RT+6,G.hd),[dx,dy]=polar(RT,G.hd);K.sline(c,[[x1,y1],[x2,y2]],rgba(WHITE,.9),3);
   K.glow(c,dx,dy,16,WHITE,.5);circle(c,dx,dy,6,WHITE,INK,2);}
  // centre: one year + overlap plate with a leader into the wedge
  const yw=measure(c,T.year,22);text(c,T.year,CX,CY-14,22,MUTED,'center');push(rects,1,'year',{x:CX-yw/2,y:CY-32,w:yw,h:24});
  if(G.O&&V.grow>.98){const q=plate(c,T.overlap,CX,CY+2,{col:WHITE});push(rects,1,'overlapC',q);
    const md=(G.O[0]+G.O[1])/2,[ex,ey]=polar(RP,md),sx=q.x+q.w,sy=q.y+16;K.sline(c,[[sx,sy],[ex,ey]],rgba(WHITE,.8),2);circle(c,ex,ey,4,WHITE,null);}
  // early / middle / late plates on the track
  T.parts.forEach((p,i)=>{const [px,py]=polar(RLAB,60+i*120),q=plate(c,p,px,py-16,{col:WHITE,stroke:rgba(WHITE,.6)});push(rects,1,'part'+i,q);});
  // step 1: "moves earlier" plate pointing at the moved arc
  const ea=V.ghostF*(k===1?clamp((tau-3.6)/.5):1);
  withA(c,ea,()=>{const [ax,ay]=polar(RF+RW/2+4,G.F[0]+12),q=plate(c,T.earlier,EP.x,EP.y,{al:'left',col:FLOW,stroke:FLOW});push(rects,ea,'earlier',q);
    K.arrow(c,q.x+30,q.y+q.h+4,ax-2,ay-4,FLOW,3);});
}

// ── right column: the two picture cards and their leaders ───────────────
function cards(c,V,t,tau,k,G,rects){
  // flower card
  D.round(c,FC.x,FC.y,FC.w,FC.h,14,'rgba(22,51,43,.9)',rgba(FLOW,.7));
  let q=plate(c,T.flowH,FC.x+FC.w/2,FC.y+8,{col:FLOW,stroke:FLOW});push(rects,1,'flowH',q);
  const sw=Math.sin(t*1.1)*2,br=pRect(BLOOM,FC.x+30,FC.y+46,FC.w-60,160);
  drawKeyed(c,BLOOM,{x:br.x+sw,y:br.y,w:br.w,h:br.h},.5+.5*G.litF*(G.onF?1:0));
  q=plate(c,T.cherry,FC.x+FC.w/2,FC.y+FC.h-40,{col:WHITE});push(rects,1,'cherry',q);
  // pollinator card
  D.round(c,PC.x,PC.y,PC.w,PC.h,14,'rgba(22,51,43,.9)',rgba(POLL,.7));
  q=plate(c,T.pollH,PC.x+PC.w/2,PC.y+8,{col:POLL,stroke:POLL});push(rects,1,'pollH',q);
  const pa=.5+.5*G.litP*(G.onP?1:0),bob=G.onP?Math.sin(t*6)*2:0;
  // two rows: picture left, name right
  const er=pRect(EYE,PC.x+8,PC.y+46,86,76),be=pRect(BEE,PC.x+8,PC.y+124,86,70);
  K.drawIn(c,EYE,{x:er.x,y:er.y+bob,w:er.w,h:er.h},{alpha:pa});K.drawIn(c,BEE,{x:be.x,y:be.y-bob,w:be.w,h:be.h},{alpha:pa});
  G.eyeAt=[er.x+er.w*.4,er.y+er.h*.35];G.beeAt=[be.x+be.w*.4,be.y+be.h*.45];G.bloomAt=[br.x+br.w*.3,br.y+br.h*.4];
  const nx=PC.x+102,ew=measure(c,T.eye,22),bw=measure(c,T.bee,22),ey=PC.y+46+38+8,by2=PC.y+124+35+8;
  text(c,T.eye,nx,ey,22,WHITE,'left');push(rects,1,'eye',{x:nx,y:ey-20,w:ew,h:26});
  text(c,T.bee,nx,by2,22,WHITE,'left');push(rects,1,'bee',{x:nx,y:by2-20,w:bw,h:26});
  // step 2: did not move earlier
  withA(c,V.nofollow,()=>{const g=boxGeo(c,T.nofollow,PC.w-12),r=box(c,T.nofollow,PC.x+PC.w/2,PC.y+PC.h-8-g.h,{al:'center',g,stroke:POLL,col:POLL});push(rects,V.nofollow,'nofollow',r);
    if(V.nofollow>=1)ring(c,r,t,POLL);});
  // leaders
  const fd=clampN(85,G.F[0]+8,G.F[1]-8),[fx,fy]=polar(RF+RW/2,fd);
  K.sline(c,[[FC.x,FC.y+FC.h-16],[fx,fy]],rgba(FLOW,.85),2);circle(c,fx,fy,4,FLOW,null);
  const pd=Math.min(138,G.P[1]-8),[px,py]=polar(RP+RW/2,pd);
  K.sline(c,[[PC.x,PC.y+124],[px,py]],rgba(POLL,.85),2);circle(c,px,py,4,POLL,null);
}
function clampN(v,a,b){return Math.max(a,Math.min(b,v));}

// ── pollen: emitted while the hand is inside the overlap (stateless) ─────
function pollen(c,V,t,G){
  if(!G.O||!G.eyeAt||V.grow<.98)return;
  const DT=.07,LIFE=1.3;
  for(let n=Math.floor((t-LIFE)/DT);n<=Math.floor(t/DT);n++){
    const tb=n*DT,q=(t-tb)/LIFE;if(q<0||q>1)continue;
    const hd=mod(tb/LAP*360,360);if(!inA(hd,G.O))continue;
    const to=n%2?G.eyeAt:G.beeAt,fr=G.bloomAt,mid=[330+((n*37)%30)-15,295+((n*23)%30)-15];
    const [x,y]=K.bez(fr,mid,to,smooth(q)),a=Math.min(1,q*6)*(1-smooth((q-.8)/.2));
    circle(c,x,y,4.5,rgba(POLLEN,a),rgba('#7a5a16',.8*a),1.2);}
}

// ── strip above the calendar (step boxes) ────────────────────────────────
function strip(c,V,t,tau,k,G,rects){
  withA(c,V.tag0,()=>{const g=boxGeo(c,T.both,TOP.w),r=box(c,T.both,TOP.x,TOP.y,{g,stroke:WHITE});push(rects,V.tag0,'both',r);});
  withA(c,V.temp,()=>{const g=boxGeo(c,T.temp,200),r=box(c,T.temp,TOP.x+44,TOP.y,{g,stroke:ORANGE});push(rects,V.temp,'temp',r);
    for(let i=0;i<2;i++)heatWave(c,TOP.x+10+i*16,TOP.y+4,44,t+i*.7,.95,4);
    const ea=k===1?clamp((tau-3.6)/.5):1,sh=3*Math.sin(t*3);
    withA(c,ea,()=>K.arrow(c,r.x+r.w*.7,r.y+r.h+4,EP.x-6+sh,EP.y+16,ORANGE,4));
    if(V.temp>=1&&tau>.8&&tau<4)ring(c,r,t,ORANGE);});
  withA(c,V.sense,()=>{const g=boxGeo(c,T.sense,TOP.w),r=box(c,T.sense,TOP.x,TOP.y,{g,stroke:WHITE});push(rects,V.sense,'sense',r);if(V.sense>=1)ring(c,r,t,WHITE);});
  withA(c,V.bars,()=>{
    const h0=plate(c,T.chance,TOP.x,TOP.y,{al:'left',col:POLLEN,stroke:POLLEN});push(rects,V.bars,'chance',h0);
    const lw=Math.max(measure(c,T.normal,22),measure(c,T.after,22)),bx=TOP.x+lw+14,maxL=TOP.x+TOP.w-bx;
    const O1=G.O?G.O[1]-G.O[0]:0,O0=G.O0[1]-G.O0[0];
    [[T.normal,O0],[T.after,O1]].forEach(([p,deg],i)=>{const y=TOP.y+44+i*34;text(c,p,TOP.x,y+22,22,WHITE,'left');push(rects,V.bars,'barL'+i,{x:TOP.x,y:y+2,w:measure(c,p,22),h:24});
      const len=maxL*deg/O0*clamp((tau-.8-i*.4)/1);D.round(c,bx,y+6,Math.max(1,len),20,6,rgba(POLLEN,.85),null);
      if(i===1){const u=.5+.5*Math.sin(t*3);D.round(c,bx-2,y+4,Math.max(1,len)+4,24,7,null,rgba(POLLEN,.4+.5*u));}});
  });
  withA(c,V.note,()=>{const g=boxGeo(c,T.noPredict,600),r=box(c,T.noPredict,TOP.x,566-g.h,{g,stroke:WHITE,dash:[8,6],t});push(rects,V.note,'note',r);});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){return[[['flow',T.legFlow],['poll',T.legPoll],['hand',T.legHand]],[['temp',T.legTemp],['ghostF',T.legGhostF]],[['ghostO',T.legGhostO],['over',T.legOver]],[['pollen',T.legPollen],['dash',T.legDash]]][k];}
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+40;
  if(kind==='flow'||kind==='poll'){c.save();c.beginPath();c.arc(ax,ay,30,-2.2,-.95);c.strokeStyle=kind==='flow'?FLOW:POLL;c.lineWidth=10;c.stroke();c.restore();}
  else if(kind==='over'){const u=.5+.5*Math.sin(t*2);c.save();c.beginPath();c.moveTo(ax,ay);c.arc(ax,ay,32,-2,-1.15);c.closePath();c.fillStyle=rgba(WHITE,.2+.15*u);c.fill();c.strokeStyle=WHITE;c.lineWidth=2;c.stroke();c.restore();}
  else if(kind==='ghostF'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*8;c.beginPath();c.arc(ax,ay,30,-2.2,-.95);c.strokeStyle=FLOW;c.lineWidth=3;c.stroke();c.restore();}
  else if(kind==='ghostO'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*8;c.beginPath();c.moveTo(ax,ay);c.arc(ax,ay,32,-2,-1.15);c.closePath();c.strokeStyle=GHOST;c.lineWidth=2.5;c.stroke();c.restore();}
  else if(kind==='hand'){const a=t*1.5;K.sline(c,[[x+21,y+19],[x+21+Math.cos(a)*15,y+19+Math.sin(a)*15]],WHITE,3);circle(c,x+21,y+19,4,WHITE,null);circle(c,x+21,y+19,16,null,rgba(WHITE,.5),2);}
  else if(kind==='temp'){for(let i=0;i<3;i++)heatWave(c,x+8+i*12,y,30,t+i*.6,.95,3);}
  else if(kind==='pollen'){for(let i=0;i<4;i++){const q=mod(t*.4+i/4);circle(c,x+6+q*30,y+26-q*16,4,rgba(POLLEN,1-q*.6),null);}}
  else if(kind==='dash'){c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*8;D.round(c,x+4,y+4,34,24,6,null,WHITE);c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:ORANGE});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  const RH=34;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH/2,rows=blines(c,p,iw-42),hh=RH+(rows.length-1)*LH;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,2,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh;});
  y+=4;K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=8;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,28));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*28;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,28));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(46,blines(c,p,iw-50).length*27+10));
  const ly=R.y+R.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+2,t);
    const h=bwrap(c,p,ix+50,yy+22,iw-50,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+50,y:yy+2,w:iw-50,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.timing=draw;
window.EnvironmentDraw.timing.dbg=s_dbg;
})();

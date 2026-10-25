/* Unit 11 lesson 2 · "bioacc" canvas (concentration-in-food-chain tab, view 0), 2026-10-25. Build-up in one individual (plan section 3, bioacc).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (steps 1-3 re-run their filling every 9 s;
 * yellow dots keep falling in and dripping out, dots in the bucket breathe, the surface ripples, dashes march, the fish sways).
 * Layout as harvest / conc: left = stage window WIN (x 16..636, y 16..444) + statement box under it; right = step card (x 652..944).
 * Stage: top right = the small fish (environment_ai_1024/TH11_sardine.png, 447x156, tight transparent crop, faces left) with its name
 *   and a dashed callout "Its body as a bucket" to the bucket. Left = the bucket (the fish's body): inlet pipe from the top
 *   (intake from water and food: yellow dots fall in), outlet at the bottom (excretion or breakdown: yellow dots drip out).
 *   Water level = concentration in the body (yellow line); the dots inside = the substance (count proportional to the level).
 *   Right = a graph sharing the bucket's vertical scale: concentration in the body against days (the day axis below, no numbers);
 *   a yellow dashed line joins the bucket level to the point being drawn.
 * Model (schematic, no units or real values): dC/dt = r - kC over one run of the day axis (6 s):
 *  0 easily removed: wide outlet (k large): rises a little, then in ≈ out and the level stops rising.
 *  1 hard to remove: narrow outlet (k small): in > out, the level keeps rising (step 0 curve kept as a white dashed line).
 *  2 more in the environment: same fish and outlet, more dots come in (r x1.6): it rises faster (step 1 curve dashed).
 *  3 summary: the step 1 curve drawn in full; the fish picture is replaced by the same fish three times along the day axis, each with a
 *    cyan tissue box of equal mass (as in conc) holding 1, 3, 5 yellow dots, dashed down to the curve. Statement "Bioaccumulation:
 *    build-up in one individual over time"; dashed note "Comparing trophic levels: the next animation" (magnify).
 * Colours (plan 1.4): substance and concentration = yellow #fde047 (dots, level line, curve); tissue of equal mass = cyan (as in conc);
 * water = pale blue; previous curve / notes = white dashed. No substance names, no numbers; unit note at the bottom.
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,YELLOW=K.COL.conc,CYAN='#55e9ff',INK=C.ink,WATER='#7cc4e4';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const FISH=ENV+'TH11_sardine.png';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('一個個體的累積','Build-up in one individual'),
 short:[P('容易排除','Easily removed'),P('難排除','Hard to remove'),P('環境裡更多','More in the water'),P('小結','Summary')],
 names:[P('容易排除的物質：水位不再上升','An easily removed substance: the level stops rising'),P('難排除的物質：水位隨時間升高','A hard-to-remove substance: the level rises over time'),P('環境裡更多：升得更快','More in the environment: it rises faster'),P('生物累積：同一個個體，隨時間','Bioaccumulation: one individual over time')],
 inTag:P('進：從水和食物','In: from water and food'),
 inMore:P('進：環境裡更多','In: more in the surroundings'),
 outTag:P('出：排出或分解','Out: excreted or broken down'),
 fish:P('一條小魚','One small fish'),
 body:P('身體看成一個水桶','Its body as a bucket'),
 yLab:P('體內濃度','Concentration in the body'),
 xLab:P('日數','Days'),
 same:P('同一條魚，不同時間','Same fish, different times'),
 st:[P('進 ≈ 出：水位不再上升','In ≈ out: the level stops rising'),
  P('進 ＞ 出：水位隨時間一路升高','In > out: the level keeps rising over time'),
  P('同樣的魚，環境裡更多：升得更快','Same fish, more around it: it rises faster'),
  P('生物累積：同一個個體，隨時間的累積','Bioaccumulation: build-up in one individual over time')],
 next:P('比較不同營養階層：下一個動畫','Comparing trophic levels: the next animation'),
 unit:P('單位：自訂的教學濃度（單位/kg），示意','Unit: invented teaching units (units/kg), schematic'),
 legDot:P('黃點：某種物質','Yellow dot: a substance'),
 legOutBig:P('出口大：容易排除','Wide outlet: easily removed'),
 legOutSmall:P('出口小：難排除','Narrow outlet: hard to remove'),
 legPrev:P('白虛線：前一步的曲線','Dashed line: the previous step'),
 legInMore:P('進來的黃點變多','More yellow dots come in'),
 legTissue:P('青框：同質量的組織','Cyan box: tissue of equal mass')
};

// ── geometry (canvas px) ─────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:428};
const CARD={x:652,y:16,w:292,h:550};
const BK={x:56,y:168,w:170,h:206},BOT=BK.y+BK.h,HMAX=196;   // bucket inner box; full level height
const lvY=c0=>BOT-c0*HMAX;
const PX=120,SPOUT=134;                                       // inlet pipe x, spout opening y
const OX=196;                                                 // outlet pipe x (under the bucket)
const G={x0:296,x1:612,run:300};                              // graph: y axis at x0, day d (0..1) at x0+8+d*run
const gx=d=>G.x0+8+d*G.run;
const FISHR={cx:540,cy:54,w:150};
const SNAP=[.2,.55,.9],SNAPN=[1,3,5],SNAPY=200;   // step 3: small fish centre y; tissue box under it
// model: dC/dt = r - kC, d in 0..1 over one run
const MODEL=[{r:.62,k:3.5},{r:.62,k:.15},{r:1.0,k:.15},{r:.62,k:.15}];
const conc=(m,d)=>m.r/m.k*(1-Math.exp(-m.k*d));
const RUN0=.8,RUN=6;                                          // the run starts at tau .8 and lasts 6 s
// dots in the bucket: 6 columns x 10 rows from the bottom; slightly jittered
const DOTS=[];{const rnd=K.rng(11);for(let row=0;row<10;row++){const ord=[0,1,2,3,4,5].sort(()=>rnd()-.5);
  ord.forEach(col=>DOTS.push([BK.x+20+col*26+(rnd()-.5)*8,BOT-10-row*19.6+(rnd()-.5)*5,rnd()*6.28]));}}
const NDOT=DOTS.length;

// ── helpers (as in harvest / conc) ───────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、；？])|(?<=[:,;?] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22,vc=false}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=vc?y-g.h/2:y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22}={}){
  const w=tagW(c,p,size),h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,FILL,rgba(col,.95));text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
function dot(c,x,y,t,i,r=4.6,a=1){const br=r*(1+.13*Math.sin(t*2.2+i*1.7));withA(c,a,()=>circle(c,x,y,br,YELLOW,rgba(INK,.6),1.2));}
function fishPic(c,x,y,w,a=1,t=0){const [W,H]=K.SIZE[FISH]||[447,156],h=w*H/W,dy=Math.sin(t*1.3)*1.5;
  withA(c,a,()=>K.drawIn(c,FISH,{x:x-w/2,y:y-h/2+dy,w,h}));return{x:x-w/2,y:y-h/2,w,h};}

// ── state for one step: level target over time ───────────────────────────
// returns {lev, d (run progress 0..1 or -1), r, k, held (run finished)}
function runState(k,tau,held,prevLev){
  if(k===3){const m=MODEL[1],end=conc(m,1);return{lev:mix(prevLev,end,smooth(tau/RUN0)),d:1,m,done:true};}
  const m=MODEL[k];
  let q=tau,again=false;
  if(held&&tau>=PER){q=mod(tau,PER);again=true;}           // held step: re-run every 9 s
  const from=again?conc(m,1):prevLev;
  if(q<RUN0)return{lev:mix(from,0,smooth(q/RUN0)),d:-1,m,done:false,drain:true};
  const d=clamp((q-RUN0)/RUN);
  return{lev:conc(m,d),d,m,done:d>=1};}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.bioSt||(s.bioSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;st.lev=0;st.prevLev=0;st.parts=[];st.inAcc=0;st.outAcc=0;st.lastT=t;st.outW=k===0?18:6;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.prevLev=st.lev;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.prevLev=st.lev;}
  if(t<st.T){st.T=t;st.from=-1;st.prevLev=st.lev;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const dt=clamp(t-st.lastT,0,.1);st.lastT=t;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const R=runState(k,tau,ck.held,st.prevLev);st.lev=R.lev;s_dbg.lev=R.lev;s_dbg.d=R.d;
  const sy=lvY(R.lev);
  const outW=k===0?18:6;st.outW+= (outW-st.outW)*Math.min(1,dt*4);

  // ── particles: in from the spout, out from the outlet ──
  const still=R.drain||k===3,rateIn=still?0:R.m.r*3.8,rateOut=still?0:R.m.k*R.lev*3.8;   // step 3: the bucket rests (summary)
  st.inAcc+=dt*rateIn;st.outAcc+=dt*rateOut;
  const P0=st.parts;
  while(st.inAcc>=1){st.inAcc-=1;P0.push({in:1,x:PX+(Math.random()-.5)*6,y:SPOUT,vy:40});}
  while(st.outAcc>=1){st.outAcc-=1;P0.push({in:0,x:OX,y:BOT+22,vy:30});}
  for(const q of P0){q.vy+=300*dt;q.y+=q.vy*dt;}
  st.parts=P0.filter(q=>q.in?q.y<sy-2:q.y<WIN.y+WIN.h-6);
  if(st.parts.length>80)st.parts.splice(0,st.parts.length-80);

  // ── stage window ──
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  c.fillStyle='#16332b';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  graph(c,k,R,st,moving,u,tau,t,rects);
  bucket(c,k,R,sy,st,tau,t);
  top(c,k,st,moving,u,tau,t,rects,R);
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  // ── statement under the window ──
  const SC=[WHITE,YELLOW,YELLOW,YELLOW],sd=[5.2,4.0,4.0,3.6][k],sa=clamp((tau-Math.max(sd,moving?MOVE*.6:0))/.5);
  const SY=WIN.y+WIN.h+12;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>box(c,T.st[st.from],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[st.from],col:SC[st.from]}));
  withA(c,sa,()=>{const q=box(c,T.st[k],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[k],col:SC[k]});push(rects,sa,'say',q);
    if(tau<99&&tau>sd+.5&&tau<sd+4)ring(c,q,t,SC[k]);
    if(k===3){const ba=clamp((tau-5)/.6);withA(c,ba,()=>{const b=box(c,T.next,WIN.x+WIN.w/2,q.y+q.h+10,{maxW:620,al:'center',dash:[8,6],t});push(rects,ba,'next',b);s_dbg.nextBottom=b.y+b.h;});}});

  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  text(c,T.unit,16,592,22,MUTED,'left');push(rects,1,'unit',{x:16,y:574,w:measure(c,T.unit,22),h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  text(c,ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── the bucket (the fish's body) ─────────────────────────────────────────
function bucket(c,k,R,sy,st,tau,t){
  const bx=BK.x,by=BK.y,bw=BK.w;
  D.round(c,bx-6,by-6,bw+12,BK.h+12,10,'#10303a',null);
  // water
  const wg=c.createLinearGradient(0,sy,0,BOT);wg.addColorStop(0,'rgba(42,127,166,.42)');wg.addColorStop(1,'rgba(23,80,111,.62)');
  c.fillStyle=wg;c.fillRect(bx,sy,bw,BOT-sy);
  // dots inside, clipped to the water
  const n=R.lev*NDOT;
  c.save();c.beginPath();c.rect(bx,sy-1,bw,BOT-sy+1);c.clip();
  DOTS.forEach(([x0,y0,ph],i)=>{if(i>=Math.ceil(n))return;const a=clamp(n-i);
    dot(c,x0+Math.sin(t*1.1+ph)*2,y0+Math.cos(t*.9+ph)*1.5,t,i,4.6,a);});
  c.restore();
  // surface = concentration in the body (yellow)
  if(R.lev>.004){c.save();c.shadowColor=rgba(YELLOW,.8);c.shadowBlur=8;c.beginPath();
    for(let xx=0;xx<=bw;xx+=6){const yy=sy+Math.sin(xx*.06+t*2.2)*1.6;xx?c.lineTo(bx+xx,yy):c.moveTo(bx+xx,yy);}
    c.strokeStyle=YELLOW;c.lineWidth=4;c.stroke();c.restore();}
  // walls
  c.save();c.lineWidth=4;c.strokeStyle=rgba(WHITE,.75);c.beginPath();c.moveTo(bx-4,by-8);c.lineTo(bx-4,BOT+4);c.lineTo(bx+bw+4,BOT+4);c.lineTo(bx+bw+4,by-8);c.stroke();c.restore();
  K.sline(c,[[bx+6,by+12],[bx+6,BOT-18]],rgba(WHITE,.16),3);
  // inlet pipe and spout
  K.sline(c,[[PX,WIN.y+56],[PX,SPOUT-6]],'#5d6b66',16);K.sline(c,[[PX,WIN.y+56],[PX,SPOUT-6]],'#7f8f88',8);
  D.round(c,PX-14,SPOUT-10,28,10,3,'#7f8f88',null);
  // outlet under the bucket (width shows how easily the substance leaves)
  const ow=st.outW;
  D.round(c,OX-ow/2-6,BOT+3,ow+12,6,3,'#5d6b66',null);
  K.sline(c,[[OX,BOT+6],[OX,BOT+22]],'#6f7d77',ow);
  // particles
  for(const q of st.parts){if(q.in)dot(c,q.x,q.y,t,7,4.6,1);else dot(c,q.x,q.y,t,9,4.6,clamp(1-(q.y-BOT-22)/((WIN.y+WIN.h)-BOT-22)*.7));}
  // ripple where the dots land
  if(!R.drain&&k!==3)for(let i=0;i<2;i++){const q=mod(t*1.3+i/2);K.ellipse(c,PX,sy,6+q*22,2+q*4,null,rgba(YELLOW,.55*(1-q)),2);}
}

// ── the graph (same vertical scale as the bucket) ────────────────────────
function curvePts(m,d1){const pts=[];const n=Math.max(2,Math.ceil(d1*60));for(let i=0;i<=n;i++){const d=d1*i/n;pts.push([gx(d),lvY(conc(m,d))]);}return pts;}
function graph(c,k,R,st,moving,u,tau,t,rects){
  // axes
  K.arrow(c,G.x0,BOT+2,G.x0,BK.y-8,rgba(WHITE,.85),3);
  K.arrow(c,G.x0-2,BOT,G.x1+8,BOT,rgba(WHITE,.85),3);
  for(let i=1;i<=4;i++){const xx=gx(i/4);K.sline(c,[[xx,BOT],[xx,BOT+8]],rgba(WHITE,.6),2);}
  // previous step's curve (white dashed)
  const prevK=k===1?0:k===2?1:-1;
  if(prevK>=0){const pa=clamp(tau/.6);withA(c,pa*.85,()=>K.dashed(c,curvePts(MODEL[prevK],1),rgba(WHITE,.8),3,[9,7],-t*10));}
  // the curve of this step
  const m=R.m,d1=R.d<0?0:R.d;
  if(R.d>0||k===3){const pts=curvePts(m,k===3?1:d1);withA(c,k===3?clamp(tau/.6):1,()=>{c.save();c.shadowColor=rgba(YELLOW,.6);c.shadowBlur=6;K.sline(c,pts,YELLOW,4);c.restore();});}
  // link from the bucket level to the current point
  if(R.lev>.004&&k!==3){const yy=lvY(R.lev),xx=R.d<0?G.x0:gx(d1);
    K.dashed(c,[[BK.x+BK.w+8,yy],[xx,yy]],rgba(YELLOW,.7),2,[6,6],-t*12);
    circle(c,xx,yy,7,YELLOW,INK,2);
    // day marker on the axis
    if(R.d>=0)circle(c,xx,BOT,6,WHITE,INK,2);}
  // still rising: arrow at the end of a finished run (steps 1, 2)
  if((k===1||k===2)&&R.done){const ex=gx(1),ey=lvY(conc(m,1)),q=mod(t*1.2);
    withA(c,1-q*.6,()=>K.arrow(c,ex-6,ey-6-q*4,ex+10,ey-24-q*8,YELLOW,3));}
  // step 3: the same fish at three times, each with a tissue box of equal mass, dashed to the curve
  if(k===3)snapshots(c,tau,t,rects,moving,u);
  // axis names (pills, drawn last so lines pass under them)
  const yl=tag(c,T.yLab,G.x0+10,BK.y-34,{col:YELLOW});push(rects,1,'yLab',yl);
  const xw=measure(c,T.xLab,22);text(c,T.xLab,G.x1+8,BOT+34,22,WHITE,'right');push(rects,1,'xLab',{x:G.x1+8-xw,y:BOT+16,w:xw,h:24});
}
function snapshots(c,tau,t,rects){
  const m=MODEL[1];
  SNAP.forEach((d,i)=>{const a=clamp((tau-.8-i*.9)/.5);if(a<=0)return;
    const xx=gx(d),cy=lvY(conc(m,d)),by=SNAPY+16;
    withA(c,a,()=>{
      K.dashed(c,[[xx,by+36],[xx,cy-8]],rgba(WHITE,.6),2,[5,6],-t*10);
      fishPic(c,xx,SNAPY,76,1,t+i);
      D.round(c,xx-18,by,36,36,6,'#16332b',CYAN);
      const pts=SNAPN[i]===1?[[0,0]]:SNAPN[i]===3?[[-9,-9],[0,0],[9,9]]:[[0,0],[-9,-9],[9,9],[9,-9],[-9,9]];
      pts.forEach((p,j)=>dot(c,xx+p[0],by+18+p[1],t,j+i*5,4));
      circle(c,xx,cy,7,YELLOW,INK,2);
      if(rects&&a>=1)rects.push({id:'snap'+i,x:xx-38,y:SNAPY-14,w:76,h:by+36-SNAPY+14});});});
}

// ── top of the stage: inlet name, fish picture and its callout / step 3 header ──
function top(c,k,st,moving,u,tau,t,rects,R){
  // inlet name (step 2 says "more in the surroundings")
  const inP=k===2?T.inMore:T.inTag,inC=k===2?YELLOW:WHITE;
  const swap=moving&&((st.from===2)!==(k===2));
  if(swap)withA(c,1-u,()=>tag(c,st.from===2?T.inMore:T.inTag,WIN.x+10,WIN.y+10,{col:st.from===2?YELLOW:WHITE}));
  withA(c,swap?u:1,()=>{const r=tag(c,inP,WIN.x+10,WIN.y+10,{col:inC});push(rects,1,'in',r);if(k===2&&tau>.6&&tau<4)ring(c,r,t,YELLOW);});
  // outlet name, right of the outlet
  const orr=tag(c,T.outTag,OX+18,BOT+18,{col:WHITE});push(rects,1,'out',orr);
  if((k===0||k===1)&&tau>.4&&tau<3.5)ring(c,{x:OX-16,y:BOT+2,w:32,h:22},t,WHITE);
  // fish + name (all steps); callout "its body as a bucket" (steps 0..2) / "same fish, different times" (step 3)
  const fr=fishPic(c,FISHR.cx,FISHR.cy,FISHR.w,1,t);
  const nm=tag(c,T.fish,FISHR.cx,fr.y+fr.h+8,{al:'center'});
  push(rects,1,'fishPic',fr);push(rects,1,'fishName',nm);
  const fa=k===3?(moving&&st.from!==3?1-u:0):(moving&&st.from===3?u:1);
  withA(c,fa,()=>{
    K.dashed(c,[[fr.x+6,FISHR.cy+4],[BK.x+BK.w+4,BK.y-6]],rgba(WHITE,.6),2,[6,6],-t*10);
    const w=boxGeo(c,T.body,300).w,b=box(c,T.body,nm.x-12-w,nm.y,{maxW:300});
    push(rects,fa,'body',b);});
  const ha=1-fa;
  withA(c,ha,()=>{const w=tagW(c,T.same),r=tag(c,T.same,nm.x-12-w,nm.y,{col:WHITE});push(rects,ha,'same',r);});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['dot',T.legDot],['outBig',T.legOutBig]];
  if(k===1)return[['outSmall',T.legOutSmall],['prev',T.legPrev]];
  if(k===2)return[['inMore',T.legInMore],['prev',T.legPrev]];
  return[['tissue',T.legTissue]];}
function legIcon(c,kind,x,y,t,pul){
  if(kind==='dot'){D.round(c,x,y,40,26,13,FILL,rgba(YELLOW,.5+.3*pul));[[12,13],[20,9],[28,15]].forEach(([dx,dy],i)=>dot(c,x+dx,y+dy,t,i,4));}
  else if(kind==='outBig'||kind==='outSmall'){const w=kind==='outBig'?16:5;D.round(c,x+8,y+2,24,6,3,'#5d6b66',null);K.sline(c,[[x+20,y+6],[x+20,y+18]],'#6f7d77',w);dot(c,x+20,y+22+mod(t*1.1)*6,t,3,3.6);}
  else if(kind==='prev')K.dashed(c,[[x+2,y+24],[x+18,y+10],[x+38,y+4]],WHITE,3,[6,5],-t*10);
  else if(kind==='inMore'){K.sline(c,[[x+20,y-2],[x+20,y+6]],'#7f8f88',8);[0,1,2].forEach(i=>dot(c,x+14+i*6,y+10+mod(t*1.4+i/3)*18,t,i,3.6));}
  else{D.round(c,x+7,y,26,26,5,'#16332b',rgba(CYAN,.7+.3*pul));dot(c,x+20,y+13,t,1,3.6);}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const Rc=CARD,ix=Rc.x+16,iw=Rc.w-32;
  D.round(c,Rc.x,Rc.y,Rc.w,Rc.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,Rc.y+14,{maxW:iw,stroke:YELLOW});push(rects,1,'tab',hr);
  let y=Rc.y+14+hr.h+12;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=10;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+19,rows=blines(c,p,iw-42),hh=Math.max(38,38+(rows.length-1)*LH);
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=14;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(44,blines(c,p,iw-50).length*28+10));
  const ly=Rc.y+Rc.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{const pul=.5+.5*Math.sin(t*2+q);
    legIcon(c,kind,ix,yy+4,t,pul);
    const h=bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);push(rects,la,'leg'+q,{x:ix+50,y:yy+4,w:iw-50,h:h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.bioacc=draw;
window.EnvironmentDraw.bioacc.dbg=s_dbg;
})();

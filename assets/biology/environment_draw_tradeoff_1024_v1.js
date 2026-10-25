/* Unit 11 lesson 3 · "tradeoff" canvas (everyday-actions tab, view 1), 2026-10-25. Which is better? It depends (plan section 4, tradeoff; P1).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Layout (as track / monitor): left = stage window (x 16..636, y 16..428), statement box under it (y 436..566), right = step card (x 652..944).
 *  0 disposable cup: the stage is split in two halves (left disposable, right reusable; the right half is dimmed). A drawn cup leaves the
 *    stack of paper cups (CV8_paper_cups), is "used once", then drops into a bin; the cups pile up in the bin (one new cup each time).
 *  1 reusable cup: same split scene, the focus moves to the right half (left dims, stays for comparison). A green loop around the reusable
 *    cup (CV8_reusable_cup) with three stops "Use", "Wash", "Return"; a light runs round the loop and every lap adds a tick under
 *    "Number of uses". The labels come in the order of the text: number of uses, washing, return.
 *  2 transport: two columns. Header chips "Distance", "Route", "Safety" light up in turn and the matching part of both columns glows
 *    (distance bracket, route line, the busy orange section). Left: short, safe route, the bicycle (CV8_bicycle) rides it, green
 *    "Cycling is more feasible". Right: long route with a busy orange section, the bicycle stops before it with a "?", then the bus
 *    (CV8_bus, flipped to face right) drives the route; white dashed "Not necessarily".
 *  3 the whole picture: four white dashed factor boxes (materials, number of uses, transport, disposal) feed "Overall environmental impact";
 *    a row of six items (reusable cup, paper cups, tote bag, meal set, bicycle, bus) is scanned one by one, the name under the lit one;
 *    statement "no product is guaranteed best" and a white dashed box "No carbon figures are given here".
 *  0 <-> 1 is the same scene (only the focus moves); every other change (1->2, 2->3, 3->0 loop, jumps) fades the old scene out, then the new in.
 * Always moving: cups travel, a light runs round the loop, the bicycle and bus ride, dashes march, glints run along the arrows, rings pulse.
 * Science (plan 4): reusable cups need washing and returning; the overall impact depends on materials, number of uses, transport and
 * disposal; transport depends on distance and safety. No carbon or emission numbers, no product is said to be always better.
 * Cup counts and ticks are schematic (no real numbers).
 * Pictures (alpha bounds = whole picture, measured with PIL): CV8_reusable_cup 187x326, CV8_paper_cups 178x318, CV8_tote_bag 385x255,
 * CV8_bicycle 301x197 (faces right), CV8_bus 357x152 (faces left, drawn flipped), CV8_meal_set 220x158.
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,MOVE=1.2,TAU=Math.PI*2;
const WHITE=C.white,MUTED=C.muted,INK=C.ink,ORANGE=(K.COL&&K.COL.pressure)||'#fb923c';
const GREEN=(K.COL&&K.COL.protect)||'#4ade80';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const CUP=ENV+'CV8_reusable_cup.png',PAPER=ENV+'CV8_paper_cups.png',BAG=ENV+'CV8_tote_bag.png',BIKE=ENV+'CV8_bicycle.png',BUS=ENV+'CV8_bus.png',MEAL=ENV+'CV8_meal_set.png';
[CUP,PAPER,BAG,BIKE,BUS,MEAL].forEach(f=>{try{K.pic(K.src(f));}catch(e){}});

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('哪一個比較好','Which is better?'),
 short:[P('一次性杯','Disposable cup'),P('循環杯','Reusable cup'),P('交通選擇','Transport'),P('整體判斷','The whole picture')],
 names:[P('一次性杯：用一次就丟','Disposable cup: used once, then thrown away'),P('循環杯：要用很多次才划得來','Reusable cup: worth it only after many uses'),P('交通：距離、路線、安全','Transport: distance, route, safety'),P('看整體，不保證任何單一商品最好','Look at the whole; no single product is always best')],
 disp:P('一次性杯','Disposable cup'),reuse:P('循環杯','Reusable cup'),
 paper:P('紙杯','Paper cups'),usedOnce:P('用一次','Used once'),thrown:P('丟掉','Thrown away'),
 use:P('使用','Use'),wash:P('清洗','Wash'),ret:P('歸還','Return'),uses:P('使用次數','Number of uses'),
 look:P('要看：','Look at:'),chips:[P('距離','Distance'),P('路線','Route'),P('安全','Safety')],
 colA:P('距離短、路線安全','Short, safe route'),colB:P('距離長或不安全','Long or unsafe'),
 resA:P('騎自行車比較可行','Cycling is more feasible'),resB:P('不一定','Not necessarily'),
 impact:P('整體環境影響','Overall environmental impact'),
 factors:[P('材料','Materials'),P('使用次數','Number of uses'),P('運輸','Transport'),P('處理','Disposal')],
 items:[P('循環杯','Reusable cup'),P('紙杯','Paper cups'),P('購物袋','Tote bag'),P('餐具組','Meal set'),P('自行車','Bicycle'),P('公車','Bus')],
 st:[P('一個杯子只用一次，用完就丟','Each cup is used once, then thrown away'),
  P('要用很多次、要清洗、有地方歸還，才有機會划得來','It can pay off only with many uses, washing and a place to return it'),
  P('距離短、路線安全，騎自行車比較可行；不然就不一定','Short and safe: cycling is more feasible; otherwise it may not be'),
  P('看材料、使用次數、運輸與處理；沒有一個商品保證最好','Look at materials, uses, transport and disposal; no product is guaranteed best')],
 noCarbon:P('這裡不給排碳數字','No carbon figures are given here'),
 leg:[[['cup',P('小白杯：用掉的一個新杯','Small white cup: one cup used up')],['bin',P('垃圾桶：用完就丟','Bin: thrown away after use')]],
      [['loop',P('綠色環：用完再回來用','Green loop: back for another use')],['tally',P('一條刻痕：用一次','One tick: one use')]],
      [['bike',P('自行車','Bicycle')],['bus',P('公車','Bus')],['car',P('橘色：車多的路段','Orange: a busy traffic section')]],
      [['dash',P('白虛線框：要看條件','White dashed box: depends on conditions')],['scan',P('亮框：正在看的物品','Bright frame: the item being looked at')]]],
 size:L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── geometry ─────────────────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412},CARD={x:652,y:16,w:292,h:550},BOT=436,MIDX=326;
// steps 0/1: two halves
const LX=166,RX=486;                                  // half centres
const STACK={x:34,y:84,w:84,h:150};                   // paper cups picture (178x318 -> 84x150)
const P0=[140,206],P1=[210,206],P2=[210,262];         // cup path: beside the stack -> used -> into the bin
const BIN={cx:210,top:236,w:90,h:80};
const LOOP={cx:486,cy:200,rx:108,ry:92};
const ST=[0,TAU/3,TAU*2/3];                           // stops on the loop: use (top), wash (lower right), return (lower left)
const lp=th=>[LOOP.cx+LOOP.rx*Math.sin(th),LOOP.cy-LOOP.ry*Math.cos(th)];
const RCUP={w:56,h:Math.round(56*326/187)};           // centre picture of the reusable cup
const PCYC=2.4,LCYC=2.7,PILE=6,MAXT=15;
// step 2: two columns
const COLX=[[46,196],[352,620]],ROAD_Y=278,ROAD_H=24,BR_Y=200,BUSY=[436,566],RES_Y=336,TITLE_Y=WIN.y+72;
const BIKEW=62,BIKEH=Math.round(62*197/301),BUSW=100,BUSH=Math.round(100*152/357);
// step 3
const SLOT_Y=284,SLOT_H=76,SLOTS=[76,176,276,376,476,576],ITEMF=[CUP,PAPER,BAG,MEAL,BIKE,BUS];

// ── helpers (as in monitor / track) ──────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、；？])|(?<=[:,;?] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop()+(/ $/.test(part)?' ':'');rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:FILL,active?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}
  D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill=FILL,dash=null,t=0,minX=WIN.x+6,maxX=WIN.x+WIN.w-6}={}){
  const w=tagW(c,p,size),h=size+18;let bx=al==='right'?x-w:al==='center'?x-w/2:x;bx=Math.max(minX,Math.min(bx,maxX-w));
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}
  D.round(c,bx,y,w,h,h/2,fill,rgba(col,.95));if(dash)c.restore();
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const lerpP=(a,b,u)=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];

// small drawn pictures (schematic)
function pcup(c,x,y,h,a=1){withA(c,a,()=>{const tw=h*.78,bw=h*.56;c.beginPath();c.moveTo(x-tw/2,y-h*.86);c.lineTo(x+tw/2,y-h*.86);c.lineTo(x+bw/2,y);c.lineTo(x-bw/2,y);c.closePath();
  c.fillStyle=WHITE;c.fill();c.strokeStyle=INK;c.lineWidth=1.5;c.stroke();
  D.round(c,x-tw/2-2,y-h,tw+4,h*.16,3,'#d9d3c2',INK);});}
function bin(c,cx,top,w,h,pile,t){
  const bw=w*.76;
  c.beginPath();c.moveTo(cx-w/2,top);c.lineTo(cx+w/2,top);c.lineTo(cx+bw/2,top+h);c.lineTo(cx-bw/2,top+h);c.closePath();c.fillStyle='rgba(28,61,52,.95)';c.fill();
  const spots=[[-22,0],[0,0],[22,0],[-11,-22],[11,-22],[0,-44]];
  for(let i=0;i<Math.min(pile,PILE);i++)pcup(c,cx+spots[i][0],top+h-4+spots[i][1],22);
  c.beginPath();c.moveTo(cx-w/2,top);c.lineTo(cx-bw/2,top+h);c.lineTo(cx+bw/2,top+h);c.lineTo(cx+w/2,top);c.strokeStyle=MUTED;c.lineWidth=3;c.stroke();
  K.sline(c,[[cx-w/2-6,top],[cx+w/2+6,top]],MUTED,4);}
function car(c,x,y,a=1){withA(c,a,()=>{D.round(c,x-15,y-12,30,12,4,ORANGE,INK);D.round(c,x-8,y-19,16,8,3,ORANGE,INK);circle(c,x-8,y,3.5,INK,null);circle(c,x+8,y,3.5,INK,null);});}
function tally(c,x,y,n,col=GREEN){for(let i=0;i<n;i++){const g=Math.floor(i/5),j=i%5,gx=x+g*44;
  if(j<4)K.sline(c,[[gx+j*8,y-13],[gx+j*8,y+13]],col,3);else K.sline(c,[[gx-4,y+9],[gx+28,y-9]],col,3);}}
function loopPath(c,col,w,dash,t){c.save();if(dash){c.setLineDash(dash);c.lineDashOffset=-t*12;}K.ellipse(c,LOOP.cx,LOOP.cy,LOOP.rx,LOOP.ry,null,col,w);c.restore();}
function loopArrow(c,th,col){const [x,y]=lp(th),dx=LOOP.rx*Math.cos(th),dy=LOOP.ry*Math.sin(th),a=Math.atan2(dy,dx),s=11;
  c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(s,0);c.lineTo(-s*.7,-s*.75);c.lineTo(-s*.7,s*.75);c.closePath();c.fillStyle=col;c.fill();c.restore();}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
let curSt=null;
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.tradeSt||(s.tradeSt={});curSt=st;
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const pop=!(st.from===k+1);           // stepping backwards shows the step complete at once
  const cupPair=q=>q===0||q===1;
  if(moving&&cupPair(st.from)&&cupPair(k)){
    // same scene: only the focus moves between the halves
    const f=k===1?u:1-u;
    cups(c,f,k,tau,t,pop,rects,1);
  }else{
    if(moving&&st.from>=0)scene(c,st.from,1-smooth(clamp(x*2)),99,t,false,null);
    const a=moving?smooth(clamp(x*2-1)):1;
    scene(c,k,a,tau-(moving?MOVE*.5:0),t,pop,a>=.99?rects:null);
  }
  under(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const sw=measure(c,T.size,22);text(c,T.size,16,592,22,MUTED,'left');push(rects,1,'size',{x:16,y:574,w:sw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,944,592,22,MUTED,'right');push(rects,1,'aiNote',{x:944-aw,y:574,w:aw,h:24});
}
function scene(c,k,a,tau,t,pop,rects){withA(c,a,()=>{
  if(k===0||k===1)cups(c,k,k,tau,t,pop,rects,1);
  else if(k===2)transport(c,tau,t,pop,rects);
  else whole(c,tau,t,pop,rects);});}
const ap=(pop,tau,at,d=.45)=>pop?clamp((tau-at)/d):1;

// ── steps 0 and 1: disposable vs reusable ────────────────────────────────
function cups(c,f,k,tau,t,pop,rects,a0){
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,14,'rgba(22,51,43,.92)',C.edge);
  K.dashed(c,[[MIDX,WIN.y+14],[MIDX,WIN.y+WIN.h-14]],rgba(WHITE,.25),2,[8,8]);
  const la=mix(1,.38,f),ra=mix(.38,1,f);
  const liveL=k===0,liveR=k===1;
  // ── left half: disposable
  withA(c,la,()=>{
    const hA=liveL?ap(pop,tau,.1):1,r=tag(c,T.disp,WIN.x+12,WIN.y+10,{col:WHITE,maxX:MIDX-8});if(hA>=.99||!liveL)push(rects,la>.9?1:0,'hdrL',r);
    K.drawIn(c,PAPER,STACK);
    const nA=liveL?ap(pop,tau,.4):1;withA(c,nA,()=>{text(c,T.paper,STACK.x,STACK.y+STACK.h+28,22,MUTED,'left');});
    push(rects,la>.9&&nA>=.99?1:0,'paper',{x:STACK.x,y:STACK.y+STACK.h+10,w:measure(c,T.paper,22),h:24});
    // the cup cycle (live) and the pile
    const run=liveL?(pop?tau-1.0:tau+PILE*PCYC):-1;
    // the dimmed half keeps the pile it had when the step was left (3 after a full 9 s step)
    let pile=curSt&&curSt.pile!=null?curSt.pile:3;
    if(liveL){pile=run<0?0:Math.min(PILE,Math.floor((run-.85*PCYC)/PCYC)+1);if(pile<0)pile=0;if(curSt)curSt.pile=pile;}
    const binA=liveL?ap(pop,tau,.7):1;
    withA(c,binA,()=>bin(c,BIN.cx,BIN.top,BIN.w,BIN.h,pile,t));
    const uA=liveL?ap(pop,tau,1.2):1;
    const uR=withA2(c,uA,()=>tag(c,T.usedOnce,P1[0],P1[1]-92,{al:'center',col:WHITE,maxX:MIDX-8}));
    if(uR)push(rects,la>.9&&uA>=.99?1:0,'usedOnce',uR);
    const tA=liveL?ap(pop,tau,1.8):1;
    const tR=withA2(c,tA,()=>tag(c,T.thrown,BIN.cx,BIN.top+BIN.h+12,{al:'center',col:WHITE,maxX:MIDX-8}));
    if(tR)push(rects,la>.9&&tA>=.99?1:0,'thrown',tR);
    // dashed guide: use -> bin
    withA(c,binA*.8,()=>K.dashed(c,[[P1[0]+26,P1[1]-10],[P1[0]+26,BIN.top-8]],rgba(WHITE,.55),2,[6,6],-t*10));
    if(liveL&&run>=0){const p=mod(run,PCYC)/PCYC;let pos,al=1,lift=0;
      if(p<.25){const v=smooth(p/.25);pos=lerpP(P0,P1,v);al=clamp(p/.08);}
      else if(p<.55){pos=P1;lift=Math.sin((p-.25)/.3*Math.PI)*8;if(uR)ring(c,uR,t,WHITE);}
      else if(p<.85){const v=smooth((p-.55)/.3);pos=lerpP(P1,P2,v);al=1-clamp((pos[1]-(BIN.top+4))/20);}
      else{pos=null;}
      if(pos&&al>0)pcup(c,pos[0],pos[1]-lift,34,al);
      if(p>.8&&p<.98&&tR)K.glow(c,BIN.cx,BIN.top+10,40,WHITE,.25*(1-Math.abs(p-.89)/.09));}
  });
  // ── right half: reusable
  withA(c,ra,()=>{
    const r=tag(c,T.reuse,MIDX+12,WIN.y+10,{col:GREEN,minX:MIDX+6});push(rects,ra>.9?1:0,'hdrR',r);
    loopPath(c,rgba(GREEN,.9),4,[12,8],liveR?t:0);
    [TAU/6,TAU/2,TAU*5/6].forEach(th=>loopArrow(c,th,GREEN));
    K.drawIn(c,CUP,{x:LOOP.cx-RCUP.w/2,y:LOOP.cy-RCUP.h/2+4,w:RCUP.w,h:RCUP.h});
    const run=liveR?(pop?tau-1.0:tau+MAXT*LCYC):-1,th=run>=0?mod(run,LCYC)/LCYC*TAU:-1;
    // label timing follows the text: number of uses, washing, return
    const A=[liveR?ap(pop,tau,.2):1,liveR?ap(pop,tau,1.6):1,liveR?ap(pop,tau,2.4):1];
    const labs=[T.use,T.wash,T.ret];
    ST.forEach((s0,i)=>{const [px,py]=lp(s0);withA(c,A[i],()=>{
      const w=tagW(c,labs[i]),h=40,bx=Math.max(MIDX+6,Math.min(px-w/2,WIN.x+WIN.w-6-w)),by=py-h/2;
      const near=th>=0&&Math.min(Math.abs(th-s0),TAU-Math.abs(th-s0))<.35;
      c.save();c.globalAlpha=Math.min(1,c.globalAlpha/ra);D.round(c,bx,by,w,h,h/2,'#15322a',null);c.restore();
      D.round(c,bx,by,w,h,h/2,near?GREEN:FILL,near?WHITE:rgba(GREEN,.95));
      text(c,labs[i],bx+w/2,by+h/2+8,22,near?INK:GREEN,'center');
      push(rects,ra>.9&&A[i]>=.99?1:0,'stop'+i,{x:bx,y:by,w,h});
      if(i===1&&near){for(let d=0;d<3;d++){const q=mod(t*1.6+d/3);circle(c,bx+w/2-14+d*14,by+h+6+q*14,3.5,rgba('#cfefff',1-q),null);}}
      if(i===2&&near)K.glow(c,px,py,34,GREEN,.35);
      if(liveR&&pop&&i>0&&tau>[0,1.6,2.4][i]+.2&&tau<[0,1.6,2.4][i]+2.6)ring(c,{x:bx,y:by,w,h},t,GREEN);});});
    if(th>=0){const [gx,gy]=lp(th);K.glow(c,gx,gy,20,GREEN,.7);circle(c,gx,gy,6,WHITE,INK,1.5);}
    // number of uses
    const cA=liveR?ap(pop,tau,.8):1,n=liveR?(run<0?0:Math.min(MAXT,Math.floor(run/LCYC)+1)):0;
    withA(c,liveR?cA:1,()=>{const ty=LOOP.cy+LOOP.ry+52,w=measure(c,T.uses,22);text(c,T.uses,RX,ty,22,WHITE,'center');
      push(rects,ra>.9&&cA>=.99?1:0,'usesLab',{x:RX-w/2,y:ty-19,w,h:24});
      const tx=RX-62;D.round(c,tx-14,ty+12,152,40,10,'rgba(11,26,21,.6)',rgba(GREEN,.5));tally(c,tx,ty+32,n);
      if(liveR&&pop&&tau>.9&&tau<3)ring(c,{x:RX-w/2-8,y:ty-24,w:w+16,h:32},t,GREEN);});
  });
  s_dbg.split={la,ra};
}
function withA2(c,a,fn){if(a<=0.002)return null;c.save();c.globalAlpha*=Math.min(1,a);const r=fn();c.restore();return r;}

// ── step 2: transport ────────────────────────────────────────────────────
function transport(c,tau,t,pop,rects){
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,14,'rgba(22,51,43,.92)',C.edge);
  K.dashed(c,[[MIDX,WIN.y+62],[MIDX,WIN.y+WIN.h-14]],rgba(WHITE,.25),2,[8,8]);
  // which chip is lit: in turn while they appear, then cycling
  const chipAt=j=>.4+.6*j;
  const lit=pop&&tau<chipAt(2)+1.6?(tau<chipAt(1)?0:tau<chipAt(2)?1:2):Math.floor(mod((pop?tau-chipAt(2)-1.6:tau)/1.8,3));
  // header
  const lw=measure(c,T.look,22),cw=T.chips.map(p=>tagW(c,p)),tot=lw+12+cw.reduce((a,b)=>a+b,0)+12*2;
  let hx=WIN.x+WIN.w/2-tot/2;const hy=WIN.y+10;
  text(c,T.look,hx,hy+28,22,WHITE);push(rects,1,'look',{x:hx,y:hy+10,w:lw,h:24});hx+=lw+12;
  T.chips.forEach((p,j)=>{const a=ap(pop,tau,chipAt(j));withA(c,a,()=>{const on=j===lit&&a>=.99;
    D.round(c,hx,hy,cw[j],40,20,on?WHITE:FILL,on?WHITE:rgba(WHITE,.8));text(c,p,hx+cw[j]/2,hy+28,22,on?INK:WHITE,'center');
    push(rects,a,'chip'+j,{x:hx,y:hy,w:cw[j],h:40});if(on)ring(c,{x:hx,y:hy,w:cw[j],h:40},t,WHITE);});hx+=cw[j]+12;});
  // column titles
  const ta=ap(pop,tau,.2);
  withA(c,ta,()=>{const b1=box(c,T.colA,(WIN.x+MIDX)/2,TITLE_Y,{al:'center',maxW:290,stroke:GREEN,col:GREEN});push(rects,ta,'colA',b1);
    const b2=box(c,T.colB,(MIDX+WIN.x+WIN.w)/2,TITLE_Y,{al:'center',maxW:290,stroke:WHITE,col:WHITE});push(rects,ta,'colB',b2);});
  // roads, distance brackets, busy section
  const sa=ap(pop,tau,.3);
  withA(c,sa,()=>{COLX.forEach(([x0,x1],i)=>{
    // distance bracket
    const on0=lit===0,bc=on0?WHITE:rgba(WHITE,.6),bw=on0?3.5:2.5;
    K.sline(c,[[x0,BR_Y-10],[x0,BR_Y+10]],bc,bw);K.sline(c,[[x1,BR_Y-10],[x1,BR_Y+10]],bc,bw);K.sline(c,[[x0,BR_Y],[x1,BR_Y]],bc,bw);
    if(on0){const g=mod(t*.6);K.glow(c,mix(x0,x1,g),BR_Y,16,WHITE,.6);}
    // road
    D.round(c,x0-6,ROAD_Y,x1-x0+12,ROAD_H,6,'#3a4a44',rgba(WHITE,.35));
    K.dashed(c,[[x0,ROAD_Y+ROAD_H/2],[x1,ROAD_Y+ROAD_H/2]],rgba(WHITE,lit===1?.95:.5),lit===1?3:2,[10,8],lit===1?-t*14:0);
    if(i===0){K.sline(c,[[x0,ROAD_Y+ROAD_H+5],[x1,ROAD_Y+ROAD_H+5]],rgba(GREEN,lit===1||lit===2?1:.6),lit===1||lit===2?5:3);
      if(lit===2)K.glow(c,mix(x0,x1,mod(t*.5)),ROAD_Y+ROAD_H+5,18,GREEN,.6);}
    circle(c,x0,ROAD_Y+ROAD_H/2,7,WHITE,INK,2);circle(c,x1,ROAD_Y+ROAD_H/2,7,WHITE,INK,2);});
    // busy section (orange = pressure)
    const on2=lit===2;
    c.save();c.beginPath();c.rect(BUSY[0],ROAD_Y,BUSY[1]-BUSY[0],ROAD_H);c.clip();
    for(let xx=BUSY[0]-20;xx<BUSY[1]+20;xx+=14)K.sline(c,[[xx,ROAD_Y+ROAD_H],[xx+12,ROAD_Y]],rgba(ORANGE,on2?.75:.45),4);c.restore();
    c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*10;D.round(c,BUSY[0]-4,ROAD_Y-26,BUSY[1]-BUSY[0]+8,ROAD_H+34,8,null,rgba(ORANGE,on2?1:.7));c.restore();
    if(on2)K.glow(c,(BUSY[0]+BUSY[1])/2,ROAD_Y+6,60,ORANGE,.25+.1*Math.sin(t*3));});
  // vehicles
  const va=ap(pop,tau,1.0);
  withA(c,va,()=>{
    // column A: the bicycle rides the short safe route
    const qa=mod(t/3.2),bx=mix(COLX[0][0],COLX[0][1],smooth(clamp(qa/.85))),ba=Math.min(1,qa/.08,(1-qa)/.12);
    withA(c,ba,()=>K.drawIn(c,BIKE,{x:bx-BIKEW/2,y:ROAD_Y-BIKEH+4,w:BIKEW,h:BIKEH}));
    // column B: the bicycle stops before the busy section, then the bus drives the whole route
    const qb=mod(t/7);
    if(qb<.5){const v=smooth(clamp(qb/.22)),x2=mix(COLX[1][0],BUSY[0]-BIKEW/2-8,v),a2=Math.min(1,qb/.05,(.5-qb)/.06);
      withA(c,a2,()=>{K.drawIn(c,BIKE,{x:x2-BIKEW/2,y:ROAD_Y-BIKEH+4,w:BIKEW,h:BIKEH});
        if(qb>.22){const qx=x2,qy=ROAD_Y-BIKEH-24,pu=mod(t*.9);circle(c,qx,qy,17,FILL,WHITE,2);circle(c,qx,qy,17+10*pu,null,rgba(WHITE,.8*(1-pu)),2);
          c.save();c.font=K.MONO(22);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('?',qx,qy+1);c.restore();}});}
    else{const v=(qb-.5)/.5,x2=mix(COLX[1][0]+BUSW/2-20,COLX[1][1]-BUSW/2+20,smooth(v)),a2=Math.min(1,v/.08,(1-v)/.08);
      withA(c,a2,()=>K.drawIn(c,BUS,{x:x2-BUSW/2,y:ROAD_Y-BUSH+6,w:BUSW,h:BUSH},{flip:true}));}
  });
  // busy traffic in the near lane (drawn in front of the vehicles)
  withA(c,sa,()=>{for(let j=0;j<2;j++){const q=mod(t*.16+j/2);car(c,mix(BUSY[0]+18,BUSY[1]-18,q),ROAD_Y+ROAD_H-3,Math.min(1,Math.min(q,1-q)*8));}});
  // results
  const ra=ap(pop,tau,3.2);
  withA(c,ra,()=>{const b1=box(c,T.resA,(WIN.x+MIDX)/2,RES_Y,{al:'center',maxW:290,stroke:GREEN,col:GREEN});push(rects,ra,'resA',b1);
    const b2=box(c,T.resB,(MIDX+WIN.x+WIN.w)/2,RES_Y,{al:'center',maxW:290,dash:[8,6],t});push(rects,ra,'resB',b2);
    if(pop&&tau>3.4&&tau<6){ring(c,b1,t,GREEN);ring(c,b2,t,WHITE);}});
}

// ── step 3: the whole picture ────────────────────────────────────────────
function whole(c,tau,t,pop,rects){
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,14,'rgba(22,51,43,.92)',C.edge);
  const ca=ap(pop,tau,.3);
  const cg=boxGeo(c,T.impact,280),cy=150-cg.h/2;
  let cb=null;
  const fpos=[[WIN.x+20,WIN.y+30,'left'],[WIN.x+WIN.w-20,WIN.y+30,'right'],[WIN.x+20,WIN.y+176,'left'],[WIN.x+WIN.w-20,WIN.y+176,'right']];
  const fa=[0,1,2,3].map(i=>ap(pop,tau,.9+.6*i));
  // arrows first (under the boxes)
  const cbx=MIDX-cg.w/2;
  fpos.forEach(([fx,fy,al],i)=>{const w=tagW(c,T.factors[i])+6,bx=al==='right'?fx-w:fx,h=40,sx=al==='right'?bx:bx+w,sy=fy+h/2;
    const ex=al==='right'?cbx+cg.w+8:cbx-8,ey=cy+cg.h/2+(i<2?-10:10);
    withA(c,Math.min(fa[i],ca),()=>{K.dashed(c,[[sx,sy],[ex,ey]],rgba(INK,.6),6,[8,6],-t*10);K.arrow(c,sx,sy,ex,ey,rgba(WHITE,.8),2.5);
      const g=mod(t*.45+i*.25);K.glow(c,mix(sx,ex,g),mix(sy,ey,g),12,WHITE,.6);});});
  withA(c,ca,()=>{cb=box(c,T.impact,MIDX,cy,{al:'center',maxW:280,stroke:WHITE,col:WHITE});push(rects,ca,'impact',cb);
    const pu=.5+.5*Math.sin(t*2);D.round(c,cb.x-5,cb.y-5,cb.w+10,cb.h+10,20,null,rgba(WHITE,.25+.3*pu));});
  fpos.forEach(([fx,fy,al],i)=>withA(c,fa[i],()=>{const r=box(c,T.factors[i],fx,fy,{al,maxW:260,dash:[8,6],t});push(rects,fa[i],'factor'+i,r);
    if(pop&&tau>.9+.6*i&&tau<.9+.6*i+2)ring(c,r,t,WHITE);}));
  // items row
  const ia=ap(pop,tau,3.4,.6);
  withA(c,ia,()=>{
    const scan=Math.floor(mod((pop?Math.max(0,tau-3.8):tau)/1.5,6));
    SLOTS.forEach((sx,i)=>{const R={x:sx-44,y:SLOT_Y,w:88,h:SLOT_H},on=i===scan;
      D.round(c,R.x-4,R.y-4,R.w+8,R.h+8,10,on?'rgba(242,236,217,.12)':'rgba(11,26,21,.35)',on?WHITE:rgba(WHITE,.25));
      K.place(c,ITEMF[i],R.x+4,R.y+4,R.w-8,R.h-8,{flip:ITEMF[i]===BUS});
      if(on){const v=mod(t*.8);D.round(c,R.x-4-5*v,R.y-4-5*v,R.w+8+10*v,R.h+8+10*v,10+5*v,null,rgba(WHITE,.8*(1-v)));
        const r=tag(c,T.items[i],sx,SLOT_Y+SLOT_H+12,{al:'center',col:WHITE});push(rects,ia,'item',r);}});
  });
}

// ── statements under the stage ───────────────────────────────────────────
function under(c,k,st,moving,x,tau,t,rects){
  const cx=WIN.x+WIN.w/2,sd=[3.0,3.4,4.4,4.6][k];
  const one=(kk,a,live)=>withA(c,a,()=>{
    let y=BOT;const col=kk===1||kk===2?GREEN:WHITE;
    const qa=live?clamp((tau-sd)/.5):1;
    withA(c,qa,()=>{const b=box(c,T.st[kk],cx,y,{maxW:WIN.w,al:'center',stroke:col,col});if(live){push(rects,qa,'say',b);if(tau>sd+.5&&tau<sd+4)ring(c,b,t,col);}y=b.y+b.h+8;});
    if(qa<=0)y+=74;
    if(kk===3){const ba=live?clamp((tau-6.2)/.6):1;withA(c,ba,()=>{const b=box(c,T.noCarbon,cx,y,{maxW:WIN.w,al:'center',dash:[8,6],t});if(live)push(rects,ba,'noCarbon',b);s_dbg.bottom=b.y+b.h;});}
  });
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='cup'){pcup(c,ax,ay+14,28);}
  else if(kind==='bin'){c.save();c.translate(ax,ay);c.scale(.42,.42);bin(c,0,-36,90,80,0,t);c.restore();}
  else if(kind==='loop'){K.ellipse(c,ax,ay,18,13,null,GREEN,3);const a=mod(t*.8)*TAU;circle(c,ax+18*Math.sin(a),ay-13*Math.cos(a),4,WHITE,null);}
  else if(kind==='tally'){K.sline(c,[[ax,ay-13],[ax,ay+13]],GREEN,3);circle(c,ax,ay,12+6*pul,null,rgba(GREEN,.5*(1-pul)),2);}
  else if(kind==='bike')K.place(c,BIKE,x,y+2,44,30);
  else if(kind==='bus')K.place(c,BUS,x,y+4,44,26,{flip:true});
  else if(kind==='car'){car(c,ax,ay+8);K.glow(c,ax,ay,14,ORANGE,.2+.2*pul);}
  else if(kind==='dash'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;D.round(c,x+3,y+4,36,24,6,FILL,WHITE);c.restore();}
  else if(kind==='scan'){const v=mod(t*.8);D.round(c,x+5,y+4,32,26,6,'rgba(242,236,217,.12)',WHITE);D.round(c,x+5-3*v,y+4-3*v,32+6*v,26+6*v,6,null,rgba(WHITE,.8*(1-v)));}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:WHITE});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  const RH2=34;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH2/2,rows=blines(c,p,iw-42),hh=RH2+(rows.length-1)*LH;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,1,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh;});
  y+=4;K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=8;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,28));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*28;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,28));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=T.leg[k],lhs=legs.map(([,p])=>Math.max(46,blines(c,p,iw-50).length*27+10));
  const ly=R.y+R.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+2,t);
    const h=bwrap(c,p,ix+50,yy+22,iw-50,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+50,y:yy+2,w:iw-50,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.tradeoff=draw;
window.EnvironmentDraw.tradeoff.dbg=s_dbg;
})();

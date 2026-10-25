/* Unit 11 lesson 3 · "track" canvas (everyday-actions tab, view 0), 2026-10-25. Record the baseline, then track (plan section 4, track; P1).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (newest dot pulses, chip ring breathes,
 * dashes march, a glow walks along the clocks (all clocks show the same time), the trend line shimmers).
 * Option s.action = 0 reusable cup (default) / 1 public bicycle. The shell has no control for it, so two chips at the top of the
 * stage set it through D.hit('action', i); LivingBook.action('action', i) also works. Switching moves the dots to the other
 * series within about half a second.
 * Layout (as assess / timing): left = stage (x 16..636), right = step card (x 652..944, y 16..566).
 *   chips row (y 16..60); chart panel (y 70..428): horizontal axis = days (21 dots, three weeks; one dot = one day),
 *   vertical axis = times per day (gridlines only, no numbers); statements under the chart (y 436..566).
 *  0 baseline: grey dots for week 1 are recorded one by one.
 *  1 start acting: green dashed line "action starts this day" (with the chosen action's picture); week-2 dots appear in green.
 *  2 same method: a cyan clock (same time of day) appears under every day, also under the baseline week; week-3 dots appear;
 *    tags "same time" and "same unit: times per day" (cyan = tracking evidence, plan 1.4).
 *  3 look at change: grey dashed starting level; thick trend line (5-day moving average of the dots, drawn left to right);
 *    "watch the trend, not one day"; a ring on one low day and a tag "just one day" right of it (kept above the starting level); week-3 band "does it last?";
 *    "slogans and photos are not effectiveness data; records are" and a white dashed box "a rise can also have other causes".
 * Science (plan 4): every dot is a teaching illustration (no real counts, no axis numbers, no reduction figures); one low day is
 * there to show why one number misleads; the dashed box keeps the rise from reading as a certain effect of the action.
 * Pictures: environment_ai_1024/CV8_reusable_cup.png, CV8_bicycle.png (alpha bounds = full picture, measured with PIL).
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const CYAN=(K.COL&&K.COL.evidence)||'#55e9ff',GREEN=(K.COL&&K.COL.protect)||'#4ade80',GREY='#9fb3a8';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/',CUP=ENV+'CV8_reusable_cup.png',BIKE=ENV+'CV8_bicycle.png';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('先記原本，再追蹤','Record the baseline, then track'),
 short:[P('先記原本','Baseline'),P('開始行動','Start acting'),P('同樣的方法','Same method'),P('看變化','Look at change')],
 names:[P('先記原本的情況','First record how things are now'),P('開始行動：從這一天起','Start acting: from this day on'),P('用同樣的方法繼續記','Keep recording the same way'),P('看變化，也看有沒有持續','Look at change, and at whether it lasts')],
 action:P('行動','Action'),
 opt:[P('循環杯','Reusable cup'),P('公共自行車','Public bicycle')],
 yLab:[P('縱軸：每天用循環杯的次數','Up: reusable cup uses per day'),P('縱軸：每天騎公共自行車的次數','Up: public bicycle rides per day')],
 xLab:P('橫軸：天（一個點是一天）','Across: days (one dot = one day)'),
 week:[P('第 1 週','Week 1'),P('第 2 週','Week 2'),P('第 3 週','Week 3')],
 start:P('從這一天，開始行動','Action starts this day'),
 trend:P('看趨勢，不看一天','Watch the trend, not one day'),
 oneDay:P('只是一天','Just one day'),
 last:P('有沒有持續？','Does it last?'),
 sameTime:P('同一個時間','Same time'),
 sameUnit:P('同一種單位：次','Same unit: times'),
 st:[P('先記一週原本的情況，之後才有東西可以比','Record one ordinary week first, so there is something to compare with later'),
  P('行動開始以後的點，畫成綠色','Dots after the action starts are green'),
  P('記法不變，前後才能比','The way of recording stays the same, so before and after can be compared'),
  P('口號和照片不是成效數據，紀錄才是','Slogans and photos are not effectiveness data; records are')],
 cause:P('變多，也可能有別的原因','A rise can also have other causes'),
 legGrey:P('灰點：行動前（基線）','Grey dots: before the action (baseline)'),
 legDot:P('一個點：一天的次數','One dot: the count for one day'),
 legGreen:P('綠點：開始行動以後','Green dots: after the action starts'),
 legStart:P('綠虛線：開始的那一天','Green dashed line: the first day'),
 legClock:P('青色時鐘：每天同一個時間記','Cyan clock: recorded at the same time each day'),
 legUnit:P('單位不變：每天幾次','Same unit: times per day'),
 legLevel:P('灰虛線：原本的水準','Grey dashed line: the starting level'),
 legTrend:P('粗線：好幾天一起看的趨勢','Thick line: the trend over many days'),
 legCheck:P('白虛線框：還要查證','White dashed box: still to check'),
 schem:P('點是教學示意，不是真實數據','Dots are teaching illustrations, not real data'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── data (teaching illustration only; index 10 is one deliberately low day) ─
const DATA=[[3,2,3,4,2,3,3, 6,8,9,5,10,9,9, 10,9,10,9,9,10,9],
            [3,4,3,3,4,3,3, 5,7,8,4,8,8,9, 9,8,9,9,8,9,8]];
const ND=21,DIP=10;

// ── geometry ─────────────────────────────────────────────────────────────
const PANEL={x:16,y:70,w:620,h:358};
const X0=60,X1=616,AX_Y=352,TOPY=118,DX=(X1-X0)/ND,VY=16;
const dayX=d=>X0+(d+.5)*DX,valY=v=>AX_Y-v*VY,SX=X0+7*DX,W3=X0+14*DX;
const CLOCK_Y=363,WEEK_Y=396,XLAB_Y=421;
const CHIP={y:16,h:44};
const BOT=436;
const CARD={x:652,y:16,w:292,h:550};

// ── helpers (as in assess / shift) ───────────────────────────────────────
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
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill=FILL,icon=0}={}){
  const w=tagW(c,p,size)+icon,h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,fill,rgba(col,.95));
  text(c,p,bx+icon+(w-icon)/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
// a clock always showing the same time (hands fixed); t only makes the face breathe
function clock(c,x,y,r,t,col=CYAN,a=1){withA(c,a,()=>{circle(c,x,y,r,FILL,col,2);const h=-Math.PI*.83;
  K.sline(c,[[x,y],[x+Math.cos(h)*r*.55,y+Math.sin(h)*r*.55]],col,2);K.sline(c,[[x,y],[x,y-r*.72]],col,2);});}
function tally(c,x,y,col){for(let i=0;i<4;i++)K.sline(c,[[x+i*6,y-10],[x+i*6,y+10]],col,2.5);K.sline(c,[[x-3,y+7],[x+21,y-7]],col,2.5);}
const actOf=s=>s.action===1?1:0;

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.trackSt||(s.trackSt={});
  let first=false;
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;first=true;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  // series tween when the option changes
  const A=actOf(s),dt=clamp(t-(st.lastT??t),0,1);st.lastT=t;
  if(first||!st.vals)st.vals=DATA[A].slice();
  else st.vals=st.vals.map((v,i)=>v+(DATA[A][i]-v)*(1-Math.exp(-dt*9)));
  const vals=st.vals;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;s_dbg.action=A;
  // "pop" = new things come in one by one (fresh start, one step forward, or the loop back to step 0)
  const base=st.from>=0?st.from:Math.max(0,k-1);
  const pop=k===0||st.from===-1||st.from===k-1;
  const inStep=(kk,d)=>kk===0?d<7:kk===1?d<14:true;
  const popT=d=>d<7?.8+d*.55:d<14?1.4+(d-7)*.5:1.3+(d-14)*.55;
  const newIn=(kk,d)=>kk===0?d<7:kk===1?(d>=7&&d<14):kk===2?d>=14:false;
  const dotA=d=>{
    const was=st.from>=0?inStep(st.from,d):inStep(base,d)&&k>0,is=inStep(k,d);
    if(!is)return was&&moving?1-u:0;
    if(pop&&newIn(k,d))return clamp((tau-popT(d))/.35);
    return was?1:u;};
  // visibility of the step layers (cur = entering, old = leaving)
  const lay=(on,sched)=>{const isOn=on(k),wasOn=st.from>=0?on(st.from):(k>0&&on(base));
    if(isOn)return wasOn?1:(pop?clamp((tau-sched)/.6):u);return wasOn&&moving?1-u:0;};
  const V={line:lay(q=>q>=1,.3),startTag:lay(q=>q===1||q===2,.8),clocks:lay(q=>q>=2,.1),s3:lay(q=>q===3,.2)};
  s_dbg.V=V;

  chips(c,A,t,rects);
  chart(c,k,st,tau,t,vals,dotA,V,pop,A,rects);
  under(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const sw=measure(c,T.schem,22);text(c,T.schem,16,592,22,MUTED,'left');push(rects,1,'schem',{x:16,y:574,w:sw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── option chips (top of the stage) ──────────────────────────────────────
function chips(c,A,t,rects){
  const y=CHIP.y,h=CHIP.h,lab=T.action,lw=measure(c,lab,22),pics=[[CUP,22,38],[BIKE,50,33]];
  const pw=T.opt.map((p,i)=>measure(c,p,22)+pics[i][1]+40);
  let xx=PANEL.x+4;
  text(c,lab,xx,y+h/2+8,22,WHITE);push(rects,1,'actLab',{x:xx,y:y+10,w:lw,h:24});
  xx+=lw+14;
  T.opt.forEach((p,i)=>{const w=pw[i],act=i===A,[f,iw,ih]=pics[i];
    D.round(c,xx,y,w,h,h/2,act?GREEN:FILL,act?WHITE:rgba(GREEN,.85));
    if(act){const v=mod(t*.6);D.round(c,xx-4*v,y-4*v,w+8*v,h+8*v,h/2+4*v,null,rgba(GREEN,.7*(1-v)));}
    K.place(c,f,xx+14,y+(h-ih)/2,iw,ih);
    text(c,p,xx+14+iw+8+(w-iw-36)/2,y+h/2+8,22,act?INK:GREEN,'center');
    D.hit(xx,y,w,h,'action',i);push(rects,1,'chip'+i,{x:xx,y,w,h});
    xx+=w+10;});
  s_dbg.chips=xx-10;
}

// ── chart ─────────────────────────────────────────────────────────────────
function chart(c,k,st,tau,t,vals,dotA,V,pop,A,rects){
  const R=PANEL;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.92)',C.edge);
  // labels
  text(c,T.yLab[A],R.x+14,R.y+30,22,WHITE);push(rects,1,'yLab',{x:R.x+14,y:R.y+12,w:measure(c,T.yLab[A],22),h:24});
  // grid (no numbers) and week separators
  for(let v=2;v<=10;v+=2)K.sline(c,[[X0,valY(v)],[X1,valY(v)]],rgba(WHITE,.08),1.5);
  [7,14].forEach(d=>K.sline(c,[[X0+d*DX,TOPY],[X0+d*DX,AX_Y]],rgba(WHITE,.12),1.5));
  // week-3 band (step 3)
  const s3=V.s3,q3=k===3?tau:9;
  const aBand=s3*clamp((q3-4.4)/.6);
  withA(c,aBand,()=>{c.fillStyle=rgba(WHITE,.07+.03*Math.sin(t*2));c.fillRect(W3,TOPY,X1-W3,AX_Y-TOPY);});
  // axes
  K.arrow(c,X0,AX_Y,X0,TOPY-10,WHITE,3);K.arrow(c,X0,AX_Y,X1+14,AX_Y,WHITE,3);
  T.week.forEach((p,i)=>{const cx=X0+(i*7+3.5)*DX,w=measure(c,p,22);text(c,p,cx,WEEK_Y,22,MUTED,'center');push(rects,1,'week'+i,{x:cx-w/2,y:WEEK_Y-19,w,h:24});});
  // clocks under every day (step 2 on): same time of day
  withA(c,V.clocks,()=>{for(let d=0;d<ND;d++){const a=k===2&&pop&&st.from!==3?(d<14?clamp((tau-.2-d*.04)/.3):clamp((tau-1.3-(d-14)*.55)/.35)):1;
    clock(c,dayX(d),CLOCK_Y,7,t,CYAN,a);}
    const sw=Math.floor(mod(t*2.5,ND+4));if(sw<ND&&dotA(sw)>=1)K.glow(c,dayX(sw),CLOCK_Y,14,CYAN,.55);});
  // start line (step 1 on)
  withA(c,V.line,()=>{const yTop=TOPY+2;c.save();c.setLineDash([9,7]);c.lineDashOffset=-t*10;K.line(c,[[SX,AX_Y],[SX,yTop]],GREEN,3);c.restore();
    const f=A===1?BIKE:CUP,bob=Math.sin(t*2)*2;if(A===1)K.place(c,f,SX+6,yTop+bob,44,30);else K.place(c,f,SX+6,yTop-2+bob,22,38);});
  withA(c,V.startTag,()=>{const b=box(c,T.start,SX-8,TOPY+8,{al:'right',maxW:SX-8-(X0+6),stroke:GREEN,col:GREEN});push(rects,V.startTag,'start',b);
    if(k===1&&tau>.8&&tau<4)ring(c,b,t,GREEN);});
  // step 3: starting level and trend
  const mean=vals.slice(0,7).reduce((a,b)=>a+b,0)/7,yl=valY(mean);
  withA(c,s3*clamp((q3-.4)/.6),()=>{K.dashed(c,[[X0,yl],[X1,yl]],rgba(INK,.7),6,[10,8],-t*10);K.dashed(c,[[X0,yl],[X1,yl]],GREY,3,[10,8],-t*10);});
  const ma=vals.map((_,i)=>{let s=0,n=0;for(let j=i-2;j<=i+2;j++)if(j>=0&&j<ND){s+=vals[j];n++;}return s/n;});
  const reveal=smooth((q3-1.2)/1.6);
  if(reveal>0&&s3>0){const upto=reveal*(ND-1),pts=[];for(let i=0;i<=Math.floor(upto);i++)pts.push([dayX(i),valY(ma[i])]);
    const fi=Math.floor(upto),fr=upto-fi;if(fi<ND-1)pts.push([mix(dayX(fi),dayX(fi+1),fr),valY(mix(ma[fi],ma[fi+1],fr))]);
    withA(c,Math.min(1,s3*1.2),()=>{K.sline(c,pts,rgba(INK,.55),12);
      const g=c.createLinearGradient(X0,0,X1,0),sp=(SX-X0)/(X1-X0);g.addColorStop(0,rgba(GREY,.9));g.addColorStop(sp,rgba(GREY,.9));g.addColorStop(Math.min(1,sp+.001),rgba(GREEN,.9));g.addColorStop(1,rgba(GREEN,.9));
      K.sline(c,pts,g,7);
      // shimmer running along the line
      if(reveal>=1){const m=mod(t*.25)*(ND-1),i0=Math.floor(m),f2=m-i0,px=mix(dayX(i0),dayX(Math.min(ND-1,i0+1)),f2),py=valY(mix(ma[i0],ma[Math.min(ND-1,i0+1)],f2));K.glow(c,px,py,16,WHITE,.45);}});}
  // dots
  let newest=-1;
  for(let d=0;d<ND;d++){const a=dotA(d);if(a<=0)continue;if(a>=1)newest=d;
    const col=d<7?GREY:GREEN,yy=valY(vals[d]),sc=mix(.4,1,smooth(a));
    withA(c,a,()=>{circle(c,dayX(d),yy,8*sc,col,INK,2);});}
  const lastIn=k===0?6:k===1?13:20;
  if(newest===lastIn&&k<3){const v=mod(t*.8),col=newest<7?GREY:GREEN;circle(c,dayX(newest),valY(vals[newest]),10+10*v,null,rgba(col,.9*(1-v)),2.5);}
  // step 3 tags
  withA(c,s3*clamp((q3-2.4)/.5),()=>{const b=box(c,T.trend,X0+6,TOPY+8,{maxW:SX-8-(X0+6),stroke:WHITE});push(rects,s3,'trend',b);
    const pi=8,tx=dayX(pi),ty=valY(ma[pi]);K.dashed(c,[[b.x+b.w,b.y+b.h/2],[tx-4,ty-6]],rgba(WHITE,.9),2.5,[6,5],-t*10);circle(c,tx,ty,5,WHITE,INK,1.5);
    if(k===3&&q3>2.6&&q3<5)ring(c,b,t,WHITE);});
  withA(c,s3*clamp((q3-3.4)/.5),()=>{const dx=dayX(DIP),dy=valY(vals[DIP]),v=mod(t*.7);
    circle(c,dx,dy,13,null,WHITE,2.5);circle(c,dx,dy,13+9*v,null,rgba(WHITE,.8*(1-v)),2);
    const ty=Math.min(dy-20,yl-6-40);const r=tag(c,T.oneDay,dx+20,ty,{col:WHITE});push(rects,s3,'oneDay',r);});
  withA(c,aBand,()=>{const r=tag(c,T.last,X1-4,TOPY+8,{al:'right',col:WHITE});push(rects,aBand,'last',r);});
  // x label
  text(c,T.xLab,X0,XLAB_Y,22,MUTED,'left');push(rects,1,'xLab',{x:X0,y:XLAB_Y-19,w:measure(c,T.xLab,22),h:24});
  s_dbg.mean=mean;s_dbg.dip=[dayX(DIP),valY(vals[DIP])];
}

// ── statements under the chart ───────────────────────────────────────────
function under(c,k,st,moving,x,tau,t,rects){
  const cx=PANEL.x+PANEL.w/2,sd=[4.4,2.4,.8,5.2][k];
  const one=(kk,a,live)=>withA(c,a,()=>{
    let y=BOT;
    if(kk===2){const ta=live?clamp((tau-.4)/.5):1;withA(c,ta,()=>{
      const w1=tagW(c,T.sameTime)+30,w2=tagW(c,T.sameUnit)+34,gap=14,x0=cx-(w1+w2+gap)/2;
      const r1=tag(c,T.sameTime,x0,y,{col:CYAN,icon:30});clock(c,r1.x+24,y+20,10,t);
      const r2=tag(c,T.sameUnit,x0+w1+gap,y,{col:CYAN,icon:34});tally(c,r2.x+16,y+20,CYAN);
      if(live){push(rects,ta,'sameTime',r1);push(rects,ta,'sameUnit',r2);}});y+=52;}
    const col=kk===0?WHITE:kk===1?GREEN:kk===2?CYAN:WHITE;
    const qa=live?clamp((tau-sd)/.5):1;
    withA(c,qa,()=>{const b=box(c,T.st[kk],cx,y,{maxW:PANEL.w,al:'center',stroke:col,col});if(live){push(rects,qa,'say',b);if(tau>sd+.5&&tau<sd+4)ring(c,b,t,col);}y=b.y+b.h+8;});
    if(qa<=0)y+=74;
    if(kk===3){const ba=live?clamp((tau-6.4)/.6):1;withA(c,ba,()=>{const b=box(c,T.cause,cx,y,{maxW:PANEL.w,al:'center',dash:[8,6],t});if(live)push(rects,ba,'cause',b);s_dbg.bottom=b.y+b.h;});}
  });
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){return[[['grey',T.legGrey],['dot',T.legDot]],[['green',T.legGreen],['start',T.legStart]],[['clock',T.legClock],['unit',T.legUnit]],[['level',T.legLevel],['trend',T.legTrend],['check',T.legCheck]]][k];}
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='grey'){[0,1,2].forEach(i=>circle(c,x+6+i*14,ay+(i===1?-4:2),6,GREY,INK,1.5));}
  else if(kind==='dot'){circle(c,ax,ay,7,GREY,INK,1.5);circle(c,ax,ay,9+6*pul,null,rgba(WHITE,.6*(1-pul)),2);}
  else if(kind==='green'){[0,1,2].forEach(i=>circle(c,x+6+i*14,ay+(i===1?-4:2),6,GREEN,INK,1.5));}
  else if(kind==='start'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;K.line(c,[[ax,y+2],[ax,y+30]],GREEN,3);c.restore();}
  else if(kind==='clock')clock(c,ax,ay,11,t);
  else if(kind==='unit')tally(c,x+10,ay,CYAN);
  else if(kind==='level')K.dashed(c,[[x+2,ay],[x+40,ay]],GREY,3,[8,6],-t*10);
  else if(kind==='trend'){const pts=[[x+2,ay+8],[x+14,ay+6],[x+26,ay-4],[x+40,ay-6]];K.sline(c,pts,GREEN,6);K.glow(c,x+2+38*mod(t*.4),ay+8-14*mod(t*.4),8,WHITE,.4);}
  else if(kind==='check'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;D.round(c,x+3,y+4,36,24,6,FILL,WHITE);c.restore();}}
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
window.EnvironmentDraw.track=draw;
window.EnvironmentDraw.track.dbg=s_dbg;
})();

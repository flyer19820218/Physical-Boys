/* Unit 11 lesson 2 · "magnify" canvas (concentration-in-food-chain tab, view 1), 2026-10-25. Up the food chain (plan section 3, magnify).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (steps 0, 1 and 3 re-run every 9 s; water dots
 * drift, pictures sway, dots in the boxes breathe, dashes march, statement boxes ring).
 * Layout as bioacc / conc: left = stage window WIN (x 16..636, y 16..444) + statement boxes under it; right = step card (x 652..944).
 * Stage: the upper part is sea water (sparse yellow dots drift). Five trophic levels left to right in equal columns (x 78..574):
 *   environment_ai_1024/TH11_diatoms (194x394) -> TH11_copepod (344x340) -> TH11_sardine (447x156) -> TH11_mackerel (448x145)
 *   -> TH4_bluefin_adult (530x215); tight transparent crops, fish face left (towards their food). White chain arrows between them,
 *   names under them, and under each a cyan "tissue of equal mass" box (same size for all, as in bioacc / conc) whose yellow dots
 *   = concentration, with the dot count under it. Band at the bottom of the stage: trophic-level arrow / concentration trend.
 *   Top left: "Sea water: very few dots" and the premise box "Assume: hard to break down, hard to excrete" (step 3: the contrast).
 *   Top right (steps 2, 3): small energy panel, white bars falling level by level (white, not yellow: yellow is the substance here).
 *  0 dilute in water: two water dots drift into the diatoms and appear in the diatom box (2 dots); the other boxes are empty ("?").
 *  1 eaten upward: for each pair in turn, small copies of the prey (each carrying a yellow dot) hop into the predator; the predator's
 *    box fills (to 4, 8, 15, 28 dots), the prey box keeps its dots.
 *  2 hard to remove: counts held; the energy bars grow (falling to the right) while the band shows "Concentration: more going up";
 *    "One falls (energy), one rises (concentration): different quantities"; dashed "about 2x, 4x schematic, not a fixed ratio".
 *  3 easily removed: dots still hop in but also leave each box (dots drift out of its lower right corner): counts stay about 2-3;
 *    band "Concentration: about the same"; dashed "Different substances are removed at different rates".
 * Colours (plan 1.4): substance / concentration = yellow #fde047; tissue of equal mass = cyan (as in conc); energy = white bars.
 * No substance names, no ppm, no real values: dot counts are schematic (note at the bottom).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,YELLOW=K.COL.conc,CYAN='#55e9ff',INK=C.ink;
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('一層一層吃上去','Up the food chain'),
 short:[P('水中很稀','Dilute in water'),P('一層層吃上去','Eaten upward'),P('難排除','Hard to remove'),P('容易排除對照','Easily removed')],
 names:[P('水中很稀：框內只有幾點','Dilute in the water: only a few dots'),P('每一層吃很多下面那一層','Each level eats many of the level below'),P('難排除：越往上越密','Hard to remove: denser going up'),P('容易排除：點不變密','Easily removed: dots do not thicken')],
 lv:[P('矽藻','Diatoms'),P('橈足類','Copepods'),P('沙丁魚','Sardine'),P('鯖魚','Mackerel'),P('鮪魚','Tuna')],
 water:P('海水：黃點很稀','Sea water: very few dots'),
 premise:P('假設：這種物質難分解、難排出','Assume: hard to break down and hard to excrete'),
 contrast:P('對照：容易排除的物質','Contrast: an easily removed substance'),
 energy:P('能量：往上變少','Energy: less going up'),
 dots:n=>P(`${n} 點`,n===1?`1 dot`:`${n} dots`),
 levels:P('營養階層：一層一層往上','Trophic levels: one above another'),
 concUp:P('濃度：往上變多','Concentration: more going up'),
 concSame:P('濃度：差不多','Concentration: about the same'),
 st:[P('水中很稀：框內只有幾點','Dilute in the water: only a few dots in the box'),
  P('每一層吃很多下面那一層：黃點被吃進','Each level eats many of the level below: the dots are taken in'),
  P('一個變少（能量），一個變多（濃度）：是不同的量','One falls (energy), one rises (concentration): different quantities'),
  P('容易排除：進來也排出去，點不變密','Easily removed: what comes in goes out, so the dots do not thicken')],
 sub:[P('青框一樣大＝同質量的組織','Same-size cyan boxes = tissue of equal mass'),
  null,
  P('約 2 倍、4 倍是示意，不是固定倍率','About 2x and 4x are schematic, not a fixed ratio'),
  P('不同物質的排除速率不同','Different substances are removed at different rates')],
 note:P('點數是示意，不是測量值','Dot counts are schematic, not measurements'),
 legDot:P('黃點：某種物質','Yellow dot: a substance'),
 legTissue:P('青框：同質量的組織','Cyan box: tissue of equal mass'),
 legArrow:P('箭頭：被下一層吃','Arrow: eaten by the next level'),
 legHop:P('小圖帶著黃點被吃進','Eaten prey carry dots in'),
 legBar:P('白長條：能量','White bar: energy'),
 legDense:P('黃點變密：濃度變高','Denser dots: higher concentration'),
 legOut:P('離開的黃點：排出或分解','Dots leaving: excreted or broken down')
};

// ── geometry (canvas px) ─────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:428};
const CARD={x:652,y:16,w:292,h:550};
const COLX=[78,202,326,450,574];
const PICY=198;                                   // picture centre line
const LV=[{f:ENV+'TH11_diatoms.png',h:80},{f:ENV+'TH11_copepod.png',w:66},{f:ENV+'TH11_sardine.png',w:80},{f:ENV+'TH11_mackerel.png',w:86},{f:ENV+'TH4_bluefin_adult.png',w:96}];
const dims=i=>{const q=LV[i],[W,H]=K.SIZE[q.f]||[100,100];return q.h?{w:q.h*W/H,h:q.h}:{w:q.w,h:q.w*H/W};};
const NAMEY=266;                                  // name baseline
const BOX={s:84,y:282};                           // tissue boxes: x = COLX-42, y 282..366
const CHIPY=392;                                  // dot-count baseline
const BANDY=424;                                  // trend band centre line
const WATERB=240;                                 // water down to here
const EN={x:404,y:24,w:222,h:142};                // energy panel
const HARD=[2,4,8,15,28],EASY=[2,2,3,2,2];
const EBAR=[1,.46,.22,.11,.05];                   // energy bars (schematic, no numbers)
// dot slots in a box: 6 x 6 grid, jittered and shuffled per box
const SLOTS=COLX.map((_,b)=>{const r=K.rng(31+b*7),a=[];for(let j=0;j<6;j++)for(let i=0;i<6;i++)a.push([12+i*12+(r()-.5)*4,12+j*12+(r()-.5)*4,r()*6.28]);
  for(let i=a.length-1;i>0;i--){const k=Math.floor(r()*(i+1));[a[i],a[k]]=[a[k],a[i]];}return a;});
// water dots (sparse)
const WD=(()=>{const r=K.rng(5),a=[];for(let i=0;i<7;i++)a.push([40+r()*560,40+r()*180,r()*6.28,.5+r()*.6]);return a;})();
// step 1 windows (pair p: level p eaten by level p+1)
const WINS=[[.6,2.0],[1.8,3.2],[3.0,4.4],[4.2,5.6]];

// ── helpers (as in bioacc / conc) ────────────────────────────────────────
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
function tag(c,p,x,y,{al='left',col=WHITE,size=22,dash=null,t=0}={}){
  const w=tagW(c,p,size),h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,y,w,h,h/2,FILL,rgba(col,.95));if(dash)c.restore();
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
function dot(c,x,y,t,i,r=4.4,a=1){const br=r*(1+.13*Math.sin(t*2.2+i*1.7));withA(c,a,()=>circle(c,x,y,br,YELLOW,rgba(INK,.6),1.2));}
function pic(c,i,x,y,scale,a=1,t=0){const d=dims(i),w=d.w*scale,h=d.h*scale,dy=Math.sin(t*1.3+i*1.1)*1.5;
  withA(c,a,()=>K.drawIn(c,LV[i].f,{x:x-w/2,y:y-h/2+dy,w,h}));return{x:x-w/2,y:y-h/2,w,h};}
const bx0=i=>COLX[i]-BOX.s/2;

// ── box counts for a step at time q (q = time in this step's run) ─────────
function target(k,q,again){
  if(k===0){const n=[0,0,0,0,0];n[0]=again&&q<.8?mix(2,0,smooth(q/.8)):(q>=2.2?1:0)+(q>=3.6?1:0);return n;}
  if(k===1){const n=HARD.slice();for(let p=0;p<4;p++){const [a,b]=WINS[p];n[p+1]=Math.floor(HARD[p+1]*clamp((q-a)/(b-a))+.0001);}
    if(again&&q<.8){for(let i=1;i<5;i++)n[i]=mix(HARD[i],0,smooth(q/.8));}return n;}
  if(k===2)return HARD.slice();
  return EASY.slice();}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.magSt||(s.magSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;st.cur=[0,0,0,0,0];st.prev=[0,0,0,0,0];st.flash=[-9,-9,-9,-9,-9];st.lastN=[0,0,0,0,0];}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.prev=st.cur.slice();}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.prev=st.cur.slice();}
  if(t<st.T){st.T=t;st.from=-1;st.prev=st.cur.slice();}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const again=ck.held&&tau>=PER&&k!==2,q=again?mod(tau,PER):tau;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  // counts: blend from the previous step's counts during the move
  let tg=target(k,q,again);
  if(st.from>=0&&x<1&&!(k===1&&st.from===0))tg=tg.map((v,i)=>mix(st.prev[i],v,u));
  tg.forEach((v,i)=>{const n=Math.floor(v+.001);if(n>st.lastN[i]&&!moving)st.flash[i]=t;st.lastN[i]=n;});
  st.cur=tg;s_dbg.counts=tg.map(v=>+v.toFixed(2));

  // ── stage window ──
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  c.fillStyle='#16332b';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  water(c,k,q,t);
  chain(c,k,q,t,rects,again);
  boxes(c,k,q,t,st,rects,moving,u);
  band(c,k,st,moving,u,t,rects);
  topLeft(c,k,st,moving,u,t,rects);
  energy(c,k,st,moving,u,tau,t,rects);
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  // ── statements under the window ──
  const SC=[WHITE,YELLOW,WHITE,WHITE],sd=[3.8,4.6,3.2,3.4][k],sa=clamp((tau-Math.max(sd,moving?MOVE*.6:0))/.5);
  const SY=WIN.y+WIN.h+12;
  const say=(kk,a,live)=>withA(c,a,()=>{const qb=box(c,T.st[kk],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[kk],col:SC[kk]});if(live){push(rects,a,'say',qb);if(tau>sd+.5&&tau<sd+4)ring(c,qb,t,SC[kk]);}
    if(T.sub[kk]){const ba=live?clamp((tau-sd-1.2)/.6):1;withA(c,ba,()=>{const b=box(c,T.sub[kk],WIN.x+WIN.w/2,qb.y+qb.h+8,{maxW:620,al:'center',dash:[8,6],t});if(live){push(rects,ba,'sub',b);s_dbg.subBottom=b.y+b.h;}});}});
  if(moving&&st.from>=0)say(st.from,1-clamp(x*2.5),false);
  say(k,sa,true);

  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  text(c,T.note,16,592,22,MUTED,'left');push(rects,1,'note',{x:16,y:574,w:measure(c,T.note,22),h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  text(c,ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── sea water with a few drifting dots ───────────────────────────────────
function water(c,k,q,t){
  const g=c.createLinearGradient(0,WIN.y,0,WATERB);g.addColorStop(0,'rgba(42,127,166,.30)');g.addColorStop(1,'rgba(23,80,111,.12)');
  c.fillStyle=g;c.fillRect(WIN.x,WIN.y,WIN.w,WATERB-WIN.y);
  c.save();c.beginPath();for(let xx=WIN.x;xx<=WIN.x+WIN.w;xx+=8){const yy=WATERB+Math.sin(xx*.03+t*1.4)*2;xx===WIN.x?c.moveTo(xx,yy):c.lineTo(xx,yy);}
  c.strokeStyle='rgba(124,196,228,.45)';c.lineWidth=2;c.stroke();c.restore();
  WD.forEach(([x0,y0,ph,sp],i)=>{const xx=WIN.x+mod(x0+t*sp*9,WIN.w-20)+10,yy=y0+Math.sin(t*.8*sp+ph)*8;dot(c,xx,yy,t,i,4.2,.85);});
  // step 0: two dots drift into the diatoms
  if(k===0)[[1.2,150,70],[2.6,40,120]].forEach(([s0,x0,y0],i)=>{const v=clamp((q-s0)/1);if(v<=0||v>=1)return;
    const xx=mix(x0,COLX[0],smooth(v)),yy=mix(y0,PICY,smooth(v));dot(c,xx,yy,t,20+i,4.4,1);});
}

// ── organisms, chain arrows, names, hopping prey ─────────────────────────
function chain(c,k,q,t,rects,again){
  const gulp=[0,0,0,0,0],hops=[];
  // hopping prey: [pair, progress]
  const addHops=(p,a,b,every,dur)=>{for(let s0=a;s0<b;s0+=every){const v=(q-s0)/dur;if(v>0&&v<1)hops.push([p,v]);if(v>=1&&v<1.25)gulp[p+1]=Math.max(gulp[p+1],1-(v-1)/.25);}};
  if(k===1&&!(again&&q<.8))WINS.forEach(([a,b],p)=>addHops(p,a-.4,b-.5,.32,.6));
  if(k===3){for(let p=0;p<4;p++)addHops(p,mod(p*.37,1)-1,PER+1,1.1,.7);}
  // chain arrows (prey -> predator), drawn before the pictures
  for(let p=0;p<4;p++){const a=COLX[p]+dims(p).w/2+6,b=COLX[p+1]-dims(p+1).w/2-6;K.arrow(c,a,PICY,b,PICY,rgba(WHITE,.85),3);}
  // pictures
  COLX.forEach((cx,i)=>{const sc=1+.06*gulp[i],r=pic(c,i,cx,PICY,sc,1,t);push(rects,1,'pic'+i,r);});
  // hops on top
  hops.forEach(([p,v])=>{const d=dims(p),sx=COLX[p],ex=COLX[p+1]-dims(p+1).w/2+10,xx=mix(sx,ex,v),yy=PICY-Math.sin(v*Math.PI)*(p===3?24:54);   // the last hop stays under the energy panel
    const sc=p===0?.36:.42,a=v<.12?v/.12:v>.85?(1-v)/.15:1;
    withA(c,a,()=>{K.drawIn(c,LV[p].f,{x:xx-d.w*sc/2,y:yy-d.h*sc/2,w:d.w*sc,h:d.h*sc});dot(c,xx,yy,t,p,3.8);});});
  s_dbg.hops=hops.length;
  // names
  COLX.forEach((cx,i)=>{const w=measure(c,T.lv[i],22);text(c,T.lv[i],cx,NAMEY,22,WHITE,'center');push(rects,1,'name'+i,{x:cx-w/2,y:NAMEY-18,w,h:24});});
}

// ── tissue boxes of equal mass ───────────────────────────────────────────
function boxes(c,k,q,t,st,rects,moving,u){
  const n=st.cur;
  COLX.forEach((cx,i)=>{const x0=bx0(i),y0=BOX.y,S=BOX.s;
    D.round(c,x0,y0,S,S,8,'#11261f',CYAN);
    const fl=clamp(1-(t-st.flash[i])/.5);if(fl>0)D.round(c,x0-4*(1-fl),y0-4*(1-fl),S+8*(1-fl),S+8*(1-fl),10,null,rgba(YELLOW,.8*fl));
    const m=n[i];SLOTS[i].forEach(([dx,dy,ph],j)=>{if(j>=Math.ceil(m-.001))return;const a=clamp(m-j);
      dot(c,x0+dx+Math.sin(t*1.1+ph)*1.2,y0+dy+Math.cos(t*.9+ph)*1.2,t,j+i*3,4.2,a);});
    // empty boxes in step 0: a question mark
    const qa=k===0?(n[i]<.05&&i>0?1:0):0;
    withA(c,qa,()=>text(c,'?',cx,y0+S/2+10,30,rgba(MUTED,.85),'center',K.MONO));
    // count under the box
    const shown=Math.round(m),ca=m>.05?1:0;
    withA(c,ca,()=>{const p=T.dots(shown),w=measure(c,p,22);text(c,p,cx,CHIPY,22,YELLOW,'center');push(rects,1,'cnt'+i,{x:cx-w/2,y:CHIPY-18,w,h:24});});
    push(rects,1,'box'+i,{x:x0,y:y0,w:S,h:S});
    // step 3: dots leave from the lower right corner
    if(k===3)for(let j=0;j<2;j++){const v=mod(t*.55+j*.5+i*.23);const xx=x0+S+4+v*22,yy=y0+S-14+v*v*30;dot(c,xx,yy,t,j+40,3.8,(1-v)*.95);}
  });
}

// ── band at the bottom of the stage: trophic levels / concentration trend ─
function band(c,k,st,moving,u,t,rects){
  const draw1=(kk,a,live)=>withA(c,a,()=>{const x1=COLX[0]-30,x2=COLX[4]+40,y=BANDY;
    if(kk<=1)K.arrow(c,x1,y,x2,y,rgba(WHITE,.7),3);
    else if(kk===2){c.save();c.shadowColor=rgba(YELLOW,.6);c.shadowBlur=6;K.arrow(c,x1,y+10,x2,y-12,YELLOW,4);c.restore();}
    else K.dashed(c,[[x1,y],[x2,y]],rgba(WHITE,.8),3,[9,7],-t*10);
    const p=kk<=1?T.levels:kk===2?T.concUp:T.concSame,col=kk===2?YELLOW:WHITE;
    const r=tag(c,p,(x1+x2)/2,y-20,{al:'center',col});if(live){push(rects,a,'band',r);if(kk===2&&st.T!==undefined&&t-st.T>1.2&&t-st.T<4.5)ring(c,r,t,YELLOW);}});
  const grp=kk=>kk<=1?0:kk;
  if(moving&&st.from>=0&&grp(st.from)!==grp(k)){draw1(st.from,1-clamp(u*2),false);draw1(k,clamp(u*2-1),true);}else draw1(k,1,true);   // swaps: one after the other, never both
}

// ── top left: the water tag and the premise ──────────────────────────────
function topLeft(c,k,st,moving,u,t,rects){
  const w=tag(c,T.water,WIN.x+10,WIN.y+10,{col:WHITE});push(rects,1,'water',w);
  const one=(kk,a,live)=>withA(c,a,()=>{const p=kk===3?T.contrast:T.premise,col=kk===3?WHITE:YELLOW;
    const b=box(c,p,WIN.x+10,WIN.y+60,{maxW:EN.x-WIN.x-24,stroke:col,col,dash:kk===3?null:[8,6],t});if(live){push(rects,a,'premise',b);s_dbg.premiseBottom=b.y+b.h;}
    if(live&&kk===1&&t-st.T>.3&&t-st.T<3)ring(c,b,t,YELLOW);});
  const swap=moving&&st.from>=0&&((st.from===3)!==(k===3));
  if(swap){one(st.from,1-clamp(u*2),false);one(k,clamp(u*2-1),true);}else one(k,1,true);
}

// ── energy panel (steps 2, 3) ────────────────────────────────────────────
function energy(c,k,st,moving,u,tau,t,rects){
  const on=k>=2?(moving&&st.from<2?u:1):(moving&&st.from>=2?1-u:0);
  if(on<=0)return;
  const grow=k===2?(st.from===3?1:clamp((tau-1)/1.6)):1;
  withA(c,on,()=>{
    D.round(c,EN.x,EN.y,EN.w,EN.h,12,'rgba(11,26,21,.88)',rgba(WHITE,.6));
    const rows=blines(c,T.energy,EN.w-24);rows.forEach((r,i)=>text(c,r,EN.x+12,EN.y+30+i*26,22,WHITE));
    const top=EN.y+30+rows.length*26-6,base=EN.y+EN.h-12,H=base-top,bw=24,gap=14,x0=EN.x+(EN.w-(5*bw+4*gap))/2;
    K.sline(c,[[x0-6,base],[x0+5*bw+4*gap+6,base]],rgba(WHITE,.6),2);
    EBAR.forEach((e,i)=>{const g=clamp(grow*5-i),h=Math.max(3,H*e*g),br=.82+.12*Math.sin(t*2+i);
      D.round(c,x0+i*(bw+gap),base-h,bw,h,4,rgba(WHITE,br*Math.min(1,g*2)),null);});
    if(k===2&&tau>2.6&&tau<6)ring(c,EN,t,WHITE);
    if(on>=1)push(rects,1,'energy',{x:EN.x,y:EN.y,w:EN.w,h:EN.h});
    s_dbg.enRows=rows.length;});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['dot',T.legDot],['tissue',T.legTissue]];
  if(k===1)return[['arrow',T.legArrow],['hop',T.legHop]];
  if(k===2)return[['bar',T.legBar],['dense',T.legDense]];
  return[['out',T.legOut],['tissue',T.legTissue]];}
function legIcon(c,kind,x,y,t,pul){
  if(kind==='dot'){D.round(c,x,y,40,26,13,FILL,rgba(YELLOW,.5+.3*pul));[[12,13],[20,9],[28,15]].forEach(([dx,dy],i)=>dot(c,x+dx,y+dy,t,i,4));}
  else if(kind==='tissue'){D.round(c,x+7,y,26,26,5,'#11261f',rgba(CYAN,.7+.3*pul));dot(c,x+20,y+13,t,1,3.6);}
  else if(kind==='arrow')K.arrow(c,x+2,y+13,x+38,y+13,rgba(WHITE,.6+.3*pul),3);
  else if(kind==='hop'){const v=mod(t*.8),xx=x+4+v*32,yy=y+18-Math.sin(v*Math.PI)*14;
    const d=dims(2),sc=.3;K.drawIn(c,LV[2].f,{x:xx-d.w*sc/2,y:yy-d.h*sc/2,w:d.w*sc,h:d.h*sc});dot(c,xx,yy,t,2,3.4);}
  else if(kind==='bar'){[1,.55,.3].forEach((e,i)=>D.round(c,x+4+i*12,y+26-22*e,9,22*e,2,rgba(WHITE,.75+.2*pul),null));}
  else if(kind==='dense'){D.round(c,x+1,y,18,26,4,'#11261f',CYAN);D.round(c,x+21,y,18,26,4,'#11261f',CYAN);dot(c,x+10,y+13,t,1,3);
    [[26,7],[34,7],[26,19],[34,19],[30,13]].forEach(([dx,dy],i)=>dot(c,x+dx,y+dy,t,i+2,2.6));}
  else{D.round(c,x+2,y,24,24,5,'#11261f',CYAN);const v=mod(t*.6);dot(c,x+28+v*10,y+20+v*v*10,t,4,3.4,1-v*.8);}}
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
window.EnvironmentDraw.magnify=draw;
window.EnvironmentDraw.magnify.dbg=s_dbg;
})();

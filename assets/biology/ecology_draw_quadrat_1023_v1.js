/* Ecology lesson 1 · "quadrat" canvas (sampling tab, view 0), 2026-10-23.
 * A top-down schematic meadow (drawn panel #1c3d34, ground speckles) with small grass clumps cut from the AI pictures
 * EC3_foxtail / EC3_miscanthus / EC3_rice, scattered with a fixed seed (K.rng). The study site is a 4 × 2 grid of
 * quadrat-sized cells, so one quadrat is exactly 1/8 of the site (K.QAREA = 8). Four steps, 8 s each; s.shown = step.
 *  0 too many: the whole meadow, every clump sways and breathes; "Study site" pill + one short line; a "Grass" tag.
 *  1 place and count: three equal white frames drop (fade + small bounce) one after another at set-specific places
 *    (random-looking, same size, no overlap); the clumps inside light up one by one with number badges 1, 2, 3 …;
 *    a count pill ("4 plants") under each frame; clumps about 75 px tall in 220 px frames (4 × 2 slots, never overlapping); outside clumps fade to faint. Pills: Quadrat / Placed at random / Same size.
 *  2 mean: the frames shrink into a column on the right (clumps kept), the meadow dims; yellow flowing arrows from the
 *    three count pills into the big equation (a + b + c) ÷ 3 = mean (K.MONO).
 *  3 scale up: the meadow comes back smaller with a 4 × 2 grid; the three frames slide into three grid cells, cells are
 *    numbered 1–8 in turn, the other five show "≈ mean"; equation mean × 8 = estimate with "Estimate" / "about" pills;
 *    orange line "An estimate, not an exact census". No true total is given anywhere.
 * s.set (0..2) picks the sample set: quadrat places and the clumps inside them change at once; the meadow outside the
 * quadrats is one fixed scatter (clumps that would sit under a frame are left out for that set). Counts inside the frames = K.QSETS[s.set] exactly.
 * Grass picture base points (bottom-centre of the soil mound, fraction of width) measured once with PIL.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,TAU,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,line,circle,dim,drawIn,stageClock,fade}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=8,CW=960,MOVE=1.2;
const YELLOW=C.yellow,WHITE=C.white,ORANGE=C.orange,GREY='#9fb3a8',MONO=K.MONO;
const QSETS=()=>K.QSETS||[[4,5,3],[6,5,7],[2,3,1]],QAREA=()=>K.QAREA||8;
const fmt=v=>Number.isInteger(v)?String(v):v.toFixed(1);

// ── grass pictures: base point x as a fraction of width (PIL: lowest opaque row) ─
const GRASS=[{f:'EC3_foxtail.png',bx:.56},{f:'EC3_miscanthus.png',bx:.50},{f:'EC3_rice.png',bx:.40}];
const HU=.34;                                   // clump height in cell units (1 cell = 1 quadrat side; 220 px cell -> 75 px clump)

// ── the study site: 4 × 2 cells; quadrat top-left corners per set (cell units) ─
const COLS=4,ROWS=2;
const QPOS=[[[.25,.15],[1.7,.85],[2.85,.2]],[[.1,.9],[1.3,.05],[2.6,.75]],[[.55,.6],[1.8,.12],[2.95,.92]]];
const SNAP=QPOS.map(set=>set.map(([x,y])=>[Math.max(0,Math.min(COLS-1,Math.round(x))),Math.max(0,Math.min(ROWS-1,Math.round(y)))]));
// slots inside a quadrat (local 0..1): 3 columns × 3 rows of clump bases
// slots inside a quadrat (local 0..1): 4 columns x 2 rows of clump bases; row 1 tops (.94-.34=.60) stay below row 0 bases (.47)
const SLOTS=[];for(const y of[.47,.94])for(const x of[.14,.38,.62,.86])SLOTS.push([x,y]);

// background clumps: one fixed scatter for the whole meadow (same for every set)
const BG=(()=>{const r=K.rng(1023),out=[];
  for(let n=0;n<600&&out.length<30;n++){const x=.12+r()*3.76,y=.44+r()*1.5;
    if(out.every(p=>Math.abs(p.x-x)>.3||Math.abs(p.y-y)>.42))out.push({x,y,g:Math.floor(r()*3),s:.9+r()*.2,ph:r()*TAU,fl:r()<.5});}
  return out;})();
const SPECK=(()=>{const r=K.rng(77),out=[];for(let i=0;i<190;i++)out.push([r()*COLS,r()*ROWS,1+r()*2.2,r()<.5]);return out;})();
const CACHE={};
function build(set){
  if(CACHE[set])return CACHE[set];
  const q=QSETS()[set],pos=QPOS[set];
  const inQ=p=>pos.some(([qx,qy])=>p.x>qx-.1&&p.x<qx+1.1&&p.y>qy-.02&&p.y<qy+1+HU+.04);
  const bg=BG.filter(p=>!inQ(p));
  const quads=pos.map(([qx,qy],i)=>{const r=K.rng(500+set*10+i),idx=SLOTS.map((_,j)=>j);
    for(let j=idx.length-1;j>0;j--){const m=Math.floor(r()*(j+1));[idx[j],idx[m]]=[idx[m],idx[j]];}
    const pick=idx.slice(0,q[i]).sort((a,b)=>a-b);
    return{qx,qy,n:q[i],cl:pick.map(j=>({x:SLOTS[j][0]+(r()-.5)*.03,y:SLOTS[j][1]-r()*.03,g:Math.floor(r()*3),s:1,ph:r()*TAU,fl:r()<.5}))};});
  return CACHE[set]={bg,quads,q};
}

// ── geometry per step (canvas px) ──────────────────────────────────────────
const FIELD=[{x:40,y:84,w:880,h:440},{x:40,y:84,w:880,h:440},{x:40,y:84,w:880,h:440},{x:40,y:140,w:560,h:280}];
const COLQ={x:790,y:96,s:130,gap:20};
function qRect(k,set,i){
  if(k===2)return{x:COLQ.x,y:COLQ.y+i*(COLQ.s+COLQ.gap),w:COLQ.s,h:COLQ.s};
  const F=FIELD[k],u=F.w/COLS;
  if(k===3){const [cx,cy]=SNAP[set][i];return{x:F.x+cx*u,y:F.y+cy*u,w:u,h:u};}
  const [qx,qy]=QPOS[set][i];return{x:F.x+qx*u,y:F.y+qy*u,w:u,h:u};
}
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});

// ── small drawing helpers ──────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.9)',font=K.FONT}={}){
  const w=measure(c,p,size,font)+28,h=size+18,bx=Math.max(8,Math.min(CW-8-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center',font);
  return{x:bx,y,w,h};
}
function badge(c,x,y,n,a){withA(c,a,()=>{circle(c,x,y,14,YELLOW,C.ink,2);c.save();c.font=MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();});}
// one grass clump, base at (bx, by), height h, swaying about its base
function clump(c,cl,bx,by,h,t,a,amp){
  if(a<=0)return;const G=GRASS[cl.g],[W,H]=dim(G.f),w=h*W/H,br=1+amp*.6*Math.sin(t*1.25+cl.ph*.7),hh=h*br;
  c.save();c.globalAlpha*=a;c.translate(bx,by);c.rotate(amp*Math.sin(t*1.6+cl.ph));
  const ox=cl.fl?-(1-G.bx)*w:-G.bx*w;
  drawIn(c,G.f,{x:ox,y:-hh,w,h:hh},{flip:cl.fl});c.restore();
}
function fieldBase(c,F,a){
  withA(c,a,()=>{D.round(c,F.x,F.y,F.w,F.h,14,C.panel,C.edge);
    const u=F.w/COLS;c.save();c.beginPath();c.roundRect(F.x,F.y,F.w,F.h,14);c.clip();
    SPECK.forEach(([x,y,r,l])=>circle(c,F.x+x*u,F.y+y*u,r*u/220,l?'rgba(74,222,128,.10)':'rgba(11,26,21,.28)',null));c.restore();});
}
// a flowing curved arrow (as in the levels canvas): under-stroke, line, head, moving dots
function flow(c,p0,p1,p2,col,t,{w=4,dots=3,speed=.3}={}){
  const end=K.bez(p0,p1,p2,.93);
  c.save();c.lineCap='round';
  c.beginPath();c.moveTo(...p0);c.quadraticCurveTo(...p1,...end);c.strokeStyle=rgba(C.deep,.7);c.lineWidth=w+4;c.stroke();
  c.beginPath();c.moveTo(...p0);c.quadraticCurveTo(...p1,...end);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();
  const an=Math.atan2(p2[1]-end[1],p2[0]-end[0]),hl=16,hw=10;
  c.save();c.beginPath();c.moveTo(...p2);
  c.lineTo(p2[0]-hl*Math.cos(an)+hw*Math.sin(an),p2[1]-hl*Math.sin(an)-hw*Math.cos(an));
  c.lineTo(p2[0]-hl*Math.cos(an)-hw*Math.sin(an),p2[1]-hl*Math.sin(an)+hw*Math.cos(an));
  c.closePath();c.fillStyle=col;c.strokeStyle=rgba(C.deep,.7);c.lineWidth=2;c.stroke();c.fill();c.restore();
  for(let i=0;i<dots;i++){const u=mod(t*speed+i/dots)*.9,[x,y]=K.bez(p0,p1,p2,u);glow(c,x,y,11,col,.7);circle(c,x,y,3.4,WHITE,null);}
}
const plantsP=n=>{const p=L('plants','株','plants');return[`${n} ${p[0]}`,n===1?'1 plant':`${n} ${p[1]}`];};

// ── per-step state functions (tau = seconds into the step) ─────────────────
const DROP=i=>.2+i*1.5;                            // step 1: frame i lands
const LIT=(i,j)=>DROP(i)+.55+j*.14;                 // step 1: clump j of frame i lights up
const COUNT=(i,n)=>DROP(i)+.55+n*.14+.15;           // step 1: the count pill appears
const bgA=(k,tau)=>k===0?1:k===1?1-.45*fade(tau,.1,.8):.55;
const fieldA=k=>k===2?.13:1;
const frameA=(k,i,tau)=>k===0?0:k===1?fade(tau,DROP(i),.45):1;
const fillA=k=>k>=2?.94:0;
const clumpIn=(k,i,j,tau)=>k===0?1:k===1?(tau>=LIT(i,j)?mix(.55,1,fade(tau,LIT(i,j),.25)):.55):1;
const badgeA=(k,i,j,tau)=>k===1?fade(tau,LIT(i,j),.25):0;
const swayAmp=k=>k===0?.075:.045;
function dropY(k,i,tau){if(k!==1)return 0;const p=clamp((tau-DROP(i))/.45),b=clamp((tau-DROP(i)-.45)/.3);return -40*(1-ease(p))+(b>0&&b<1?-7*Math.sin(b*Math.PI):0);}

// ── the meadow and the frames (shared by every step, interpolated) ─────────
function scene(c,set,G,t){
  const {a,b,u,ta,tb}=G,S=build(set);
  const F=lerpR(FIELD[a],FIELD[b],u),fA=mix(fieldA(a),fieldA(b),u),uu=F.w/COLS;
  fieldBase(c,F,fA);
  const amp=mix(swayAmp(a),swayAmp(b),u),bA=mix(bgA(a,ta),bgA(b,tb),u)*fA;
  withA(c,1,()=>{c.save();c.beginPath();c.roundRect(F.x,F.y,F.w,F.h,14);c.clip();
    S.bg.forEach(cl=>clump(c,cl,F.x+cl.x*uu,F.y+cl.y*uu,HU*cl.s*uu,t,bA,amp));c.restore();});
  // step 3 grid under the frames
  const gA=(a===3?1:0)*(1-u)+(b===3?1:0)*u;
  if(gA>0)withA(c,gA*fade(b===3?tb:ta,.2,.6),()=>{c.save();c.setLineDash([9,7]);c.lineDashOffset=-t*8;
    for(let i=1;i<COLS;i++)line(c,[[F.x+i*uu,F.y],[F.x+i*uu,F.y+F.h]],rgba(WHITE,.55),2.2);
    for(let j=1;j<ROWS;j++)line(c,[[F.x,F.y+j*uu],[F.x+F.w,F.y+j*uu]],rgba(WHITE,.55),2.2);c.restore();});
  // the three quadrats
  const rects=[];
  S.quads.forEach((Q,i)=>{
    const R=lerpR(qRect(a,set,i),qRect(b,set,i),u),dy=mix(dropY(a,i,ta),dropY(b,i,tb),u),RF={...R,y:R.y+dy};rects.push(R);
    const fa=mix(frameA(a,i,ta),frameA(b,i,tb),u),fl=mix(fillA(a),fillA(b),u)*Math.max(fa,u>0&&a!==b?1:0);
    if(fl>0){c.save();c.globalAlpha*=fl;D.round(c,R.x,R.y,R.w,R.h,6,C.panel,null);c.restore();}
    const pu=.5+.5*Math.sin(t*2.4+i*1.3);
    withA(c,fa,()=>{c.fillStyle=rgba(WHITE,.05+.03*pu);c.fillRect(R.x,R.y,R.w,R.h);glow(c,R.x+R.w/2,R.y+R.h/2,R.w*.62,WHITE,.05+.05*pu);});
    Q.cl.forEach((cl,j)=>{const ca=mix(clumpIn(a,i,j,ta),clumpIn(b,i,j,tb),u);
      clump(c,cl,R.x+cl.x*R.w,R.y+cl.y*R.h,HU*R.w,t,ca,amp);});
    withA(c,fa,()=>{c.save();c.strokeStyle=rgba(C.deep,.7);c.lineWidth=7;c.strokeRect(RF.x,RF.y,RF.w,RF.h);
      c.strokeStyle=WHITE;c.lineWidth=3+1.2*pu;c.strokeRect(RF.x,RF.y,RF.w,RF.h);c.restore();});
    // number badges while counting (step 1)
    Q.cl.forEach((cl,j)=>{const ba=mix(badgeA(a,i,j,ta),badgeA(b,i,j,tb),u);if(ba<=0)return;
      const bx=R.x+cl.x*R.w,by=R.y+cl.y*R.h-HU*R.w-2;
      if(tb-LIT(i,j)<.6&&b===1)glow(c,bx,by,26,YELLOW,.5*(1-fade(tb,LIT(i,j)+.2,.4)));badge(c,bx,by,j+1,ba);});
  });
  return{F,rects,S};
}

// ── labels per step ────────────────────────────────────────────────────────
const SITE=()=>L('site','研究區','Study site');
const NOTE=P(`AI 插圖＋程式示意：株數是示意`,`AI art + schematic: plant counts are illustrative`);
const TOOMANY=P(`一株一株數，數不完`,`Too many to count one by one`);
function lab0(c,g,tau,t,a){withA(c,a,()=>{
  const p=tag(c,SITE(),24,18,{col:YELLOW,active:true,size:30});
  withA(c,fade(tau,.6,.6),()=>text(c,TOOMANY,p.x+p.w+16,p.y+p.h/2+8,22,WHITE));
  // name one clump: "Grass"
  withA(c,fade(tau,1.4,.6),()=>{const cl=anchor(g.S),F=g.F,uu=F.w/COLS,x=F.x+cl.x*uu,y=F.y+(cl.y-HU*cl.s*.5)*uu,
    r=HU*cl.s*uu*.62+3*Math.sin(t*2.2),b=tag(c,L('grass','草','Grass'),x+r+34,y-r-46,{col:GREEN2});
    circle(c,x,y,r,null,rgba(C.deep,.6),5);circle(c,x,y,r,null,GREEN2,2.5);
    line(c,[[b.x,b.y+b.h/2],[x+r*.72,y-r*.7]],GREEN2,2);});
});}
const GREEN2=C.green;
const anchor=S=>S.bg.reduce((b,p)=>Math.hypot(p.x-1.6,p.y-1.5)<Math.hypot(b.x-1.6,b.y-1.5)?p:b,S.bg[0]);

function lab1(c,g,tau,t,a){withA(c,a,()=>{
  const p=tag(c,L('quadrat','樣方','Quadrat'),24,18,{col:YELLOW,active:true,size:30});
  let x=p.x+p.w+14;
  [['random','隨機放','Placed at random',.4],['sameSize','一樣大','Same size',2.2]].forEach(([k,zh,en,t0])=>{
    const w=measure(c,L(k,zh,en),22)+28,x0=x;x+=w+12;
    withA(c,fade(tau,t0,.5),()=>{const on=tau>=t0&&tau<t0+1.6;if(on)glow(c,x0+w/2,42,64,YELLOW,.28);
      tag(c,L(k,zh,en),x0,22,{col:YELLOW,active:on});});});
  withA(c,fade(tau,.3,.5),()=>tag(c,SITE(),936,22,{al:'right',col:WHITE}));
  // count pill on each frame
  g.S.quads.forEach((Q,i)=>{const R=g.rects[i];withA(c,fade(tau,COUNT(i,Q.n),.35),()=>{
    const s=1+.05*Math.sin(t*2.6+i)*(tau<COUNT(i,Q.n)+1?1:.4);
    tag(c,plantsP(Q.n),R.x+R.w/2,R.y+R.h+8+3*(s-1)/.05,{al:'center',col:YELLOW,active:true,size:28});});});
});}

const EQ={x:60,y:276,size:46};
function lab2(c,g,tau,t,a){withA(c,a,()=>{
  tag(c,L('mean','平均','Mean'),24,18,{col:YELLOW,active:true,size:30});
  const q=g.S.q,avg=(q[0]+q[1]+q[2])/3;
  tag(c,L('quadrat','樣方','Quadrat'),COLQ.x+COLQ.s/2,40,{al:'center',col:WHITE});
  // count pills beside the mini frames
  const pills=g.rects.map((R,i)=>tag(c,plantsP(q[i]),R.x-14,R.y+R.h/2-23,{al:'right',col:YELLOW,size:26}));
  // the equation
  const s1=`(${q[0]} + ${q[1]} + ${q[2]}) ÷ 3`,sz=EQ.size;
  const dx=pre=>EQ.x+measure(c,pre,sz,MONO);
  const dig=[[`(`,q[0]],[`(${q[0]} + `,q[1]],[`(${q[0]} + ${q[1]} + `,q[2]]].map(([pre,d])=>dx(pre)+measure(c,String(d),sz,MONO)/2);
  withA(c,fade(tau,.4,.6),()=>text(c,s1,EQ.x,EQ.y,sz,WHITE,'left',MONO));
  // yellow arrows: count pills → numbers in the equation
  const ends=[[dig[0],EQ.y-44,150],[dig[1],EQ.y-44,150],[dig[2],EQ.y+12,null]];
  pills.forEach((b,i)=>withA(c,fade(tau,1.0+i*.5,.6),()=>{
    const p0=[b.x-6,b.y+b.h/2],[ex,ey,cy]=ends[i],p1=cy!=null?[(p0[0]+ex)/2,cy]:[(p0[0]+ex)/2+40,p0[1]+12];
    flow(c,p0,p1,[ex,ey],YELLOW,t+i*.4,{w:3.5});}));
  withA(c,fade(tau,2.8,.6),()=>{const y=EQ.y+118,pl=L('plants','株','plants');
    glow(c,EQ.x+110,y-20,110+8*Math.sin(t*1.8),YELLOW,.16);
    text(c,`= ${fmt(avg)}`,EQ.x,y,60,YELLOW,'left',MONO);
    const w=measure(c,`= ${fmt(avg)}`,60,MONO);text(c,pl,EQ.x+w+16,y,32,YELLOW);
    tag(c,L('mean','平均','Mean'),EQ.x,y+24,{col:YELLOW});});
});}

const RX=632;
function lab3(c,g,tau,t,a){withA(c,a,()=>{
  const q=g.S.q,avg=(q[0]+q[1]+q[2])/3,est=avg*QAREA(),F=g.F,uu=F.w/COLS,set=g.set;
  const p=tag(c,L('estimate','估計','Estimate'),24,18,{col:YELLOW,active:true,size:30});
  tag(c,L('about','約','about'),p.x+p.w+14,22,{col:YELLOW,active:tau>=1.6&&tau<3.2});
  tag(c,SITE(),F.x,F.y-50,{col:WHITE});
  // cells 1–8 numbered in turn; the five unsampled cells show ≈ mean
  const samp=SNAP[set].map(([x,y])=>y*COLS+x);
  for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){const n=j*COLS+i,t0=.3+n*.14,cx=F.x+i*uu,cy=F.y+j*uu;
    withA(c,fade(tau,t0,.35),()=>{
      if(!samp.includes(n)){const s=`≈ ${fmt(avg)}`,w=measure(c,s,26,MONO)+22;
        D.round(c,cx+uu/2-w/2,cy+uu/2-18,w,40,12,'rgba(11,26,21,.82)',rgba(YELLOW,.55));
        text(c,s,cx+uu/2,cy+uu/2+10,26,rgba(YELLOW,.92),'center',MONO);}
      const on=tau>=t0&&tau<t0+.6;if(on)glow(c,cx+20,cy+20,30,YELLOW,.5);
      badge(c,cx+20,cy+20,n+1,1);});}
  // count pill on the three sample cells
  g.rects.forEach((R,i)=>withA(c,fade(tau,.2,.5),()=>tag(c,plantsP(q[i]),R.x+R.w-8,R.y+R.h-44,{al:'right',col:YELLOW,size:22})));
  // legend: white frame = quadrat
  withA(c,fade(tau,.8,.5),()=>{const b=tag(c,L('quadrat','樣方','Quadrat'),F.x+F.w,F.y+F.h+10,{al:'right',col:WHITE});
    const sx=b.x-34,sy=b.y+b.h/2;c.save();c.strokeStyle=WHITE;c.lineWidth=3;c.strokeRect(sx,sy-11,22,22);c.restore();});
  // equation: mean × 8 = estimate
  withA(c,fade(tau,.8,.5),()=>{
    const s1=`${fmt(avg)} × ${QAREA()}`,sz=56,y1=226;
    text(c,s1,RX,y1,sz,WHITE,'left',MONO);
    const mx=RX+measure(c,fmt(avg),sz,MONO)/2,ex=RX+measure(c,`${fmt(avg)} × `,sz,MONO)+measure(c,String(QAREA()),sz,MONO)/2;
    tag(c,L('mean','平均','Mean'),mx,y1+18,{al:'center',col:YELLOW});
    tag(c,L('times8','8 倍','8 times'),ex+10,y1+18,{al:'center',col:WHITE});});
  withA(c,fade(tau,1.1,.5),()=>{const y=372,s=`= ${fmt(est)}`;
    glow(c,RX+90,y-22,120+8*Math.sin(t*1.7),YELLOW,.18);
    text(c,s,RX,y,64,YELLOW,'left',MONO);const w=measure(c,s,64,MONO);text(c,L('plants','株','plants'),RX+w+14,y,32,YELLOW);
    tag(c,L('estimate','估計','Estimate'),RX,y+22,{col:YELLOW});});
  withA(c,fade(tau,2.2,.5),()=>K.wrap(c,L('notCensus','估計值，不是精確普查','An estimate, not an exact census'),F.x,F.y+F.h+92,F.w-150,22,ORANGE));
});}

const LABS=[lab0,lab1,lab2,lab3];
function note(c){const w=measure(c,NOTE,22)+20;D.round(c,14,560,w,34,10,'rgba(11,26,21,.8)',null);text(c,NOTE,24,584,22,C.muted);}

// ── frame ──────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const set=Math.max(0,Math.min(2,s.set|0));
  const st=s.qd||(s.qd={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const off=st.from>=0?MOVE:0,newTau=tau-off,oldTau=moving?st.fromTau+(t-st.T):0;
  const G={a:moving?st.from:k,b:k,u,ta:oldTau,tb:newTau};
  const g=scene(c,set,G,t);g.set=set;
  if(moving){LABS[st.from](c,g,oldTau,t,1-smooth(x*2.2));LABS[k](c,g,newTau,t,smooth((x-.55)/.45));}
  else LABS[k](c,g,newTau,t,1);
  note(c);
}
window.EcologyDraw.quadrat=draw;
})();

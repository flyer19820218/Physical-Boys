/* Ecology lesson 2 · "carbon" canvas (carbon-cycle tab, view 0), 2026-10-23. One carbon atom's trip through a paddy corner.
 * Background: the shell's blackboard #11261f plus a drawn stage: a faint cyan "air" band on top (drifting CO2 molecules,
 * O-C-O drawn), drawn soil below the ground line (y 400). Picture cards stand on the ground: rice, grasshopper, frog,
 * snake (AI pictures; card widths fit the longest English name) and a decomposer card (shiitake picture + drawn bacteria, "schematic"). Seven steps, 8 s each;
 * s.shown = step; the per-step overlay (arrows, pills, the carbon ball) cross-fades (MOVE s); the stage stays put.
 *  0 air: the tracked carbon (bright cyan ball, its two O drawn while it is in the air) floats in a CO2 molecule; "carbon" pill.
 *  1 photosynthesis: cyan arrow air -> rice; the O fade as the carbon enters the leaf; green "photosynthesis" pill.
 *  2 feeding: arc rice -> grasshopper over the cards, "feeding" pill at the apex; the ball follows the arc.
 *  3 feeding: arc grasshopper -> frog; a dashed arc frog -> snake with "same for snakes and eagles".
 *  4 respiration: three arrows up from rice, grasshopper, frog to the air (CO2 molecules rise along them, the tracked ball
 *    from the frog); a dashed bracket ties them to one "respiration" pill; green "plants respire too".
 *  5 remains: short arrows down from the three cards to a ground-level route to the decomposers ("remains and waste",
 *    "decomposition"); from the decomposers an arrow up to the air ("respiration", "decomposer") and one down into the soil
 *    ("humus", cyan specks settle among dark humus crumbs).
 *  6 supplement: drawn dark-brown strata ("fossil fuel"); a long winding dashed route from the ground into the strata
 *    ("buried", "slower"), a short straight route up through a small flame ("burning", "faster") to the air. No years.
 * Bottom: legend "schematic: (ball) carbon (arrow)" on the left, a 7-dot progress track on the right. AI note top right.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=7,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,CYAN=C.cyan,ORANGE=C.orange,MUTED=C.muted,SOILC='#c49a6c';
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const fin=(tau,d,len=.7)=>ease((tau-d)/len);
// labels this module adds (not in K.LAB yet): reported to the main conversation
const X={
  sameUp:P('蛇、大冠鷲同理','Same for snakes and eagles'),
  plantsToo:P('植物也呼吸','Plants respire too'),
  slower:P('較慢','Slower'),faster:P('較快','Faster')};
const co2Name=()=>{const p=L('co2','二氧化碳','Carbon dioxide');return[p[0]+' CO₂',p[1]+' CO₂'];};

// ── layout ─────────────────────────────────────────────────────────────────
const AIR=132,G=400,SOIL_B=548,STRATA=476,PY=128;            // air band bottom, ground, soil bottom, strata top, label row
const CARD={y:196,h:196};
const ORG=[{k:'rice',pic:'EC3_rice.png',n:['水稻','Rice'],x:12,w:120,col:GREEN},{k:'grasshopper',pic:'EC4_grasshopper.png',n:['蚱蜢','Grasshopper'],x:142,w:150},
  {k:'frog',pic:'EC5_frog.png',n:['澤蛙','Paddy field frog'],x:302,w:140},{k:'snake',pic:'EC6_snake.png',n:['黑眉錦蛇','Black-browed ratsnake'],x:452,w:166}];
const ocx=i=>ORG[i].x+ORG[i].w/2,ocy=i=>CARD.y+80;              // where the carbon sits inside a card (the picture)
const DEC={x:632,y:196,w:240,h:196};
const HOME=[200,84];                                          // the tracked carbon's place in the air (step 0)
const MOLS=[[60,96,0],[118,62,1.3],[330,72,2.1],[430,104,.7],[540,78,3.3],[650,102,1.9],[760,74,4.1],[860,104,2.6],[920,68,.4]];

// ── helpers ────────────────────────────────────────────────────────────────
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h,cx:bx+w/2,cy:y+h/2,r:bx+w};
}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function card(c,r,pic,name,{col=WHITE,glowA=0,glowCol=CYAN,t=0}={}){
  if(glowA>0)withA(c,glowA,()=>glow(c,r.x+r.w/2,r.y+r.h/2,Math.max(r.w,r.h)*.7,glowCol,.22+.08*Math.sin(t*2.4)));
  D.round(c,r.x,r.y,r.w,r.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
  const rows=K.splitLines(c,D.tr(name),r.w-14,22),lh=26,nh=rows.length*lh+6;
  K.place(c,pic,r.x+6,r.y+6,r.w-12,r.h-12-nh);
  rows.forEach((s,i)=>text(c,s,r.x+r.w/2,r.y+r.h-nh+20+i*lh,22,col,'center'));
}
// polylines with arc length
function poly(pts){const Ls=[0];for(let i=1;i<pts.length;i++)Ls.push(Ls[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return{pts,Ls,len:Ls[Ls.length-1]};}
function ptAt(pl,u){const d=clamp(u)*pl.len;let i=1;while(i<pl.Ls.length-1&&pl.Ls[i]<d)i++;const s=(d-pl.Ls[i-1])/((pl.Ls[i]-pl.Ls[i-1])||1);return K.lerpP(pl.pts[i-1],pl.pts[i],clamp(s));}
function upTo(pl,u){const d=clamp(u)*pl.len,out=[pl.pts[0]];for(let i=1;i<pl.pts.length;i++){if(pl.Ls[i]<d)out.push(pl.pts[i]);else{out.push(ptAt(pl,u));break;}}return out;}
const quad=(p0,p1,p2,n=36)=>Array.from({length:n+1},(_,i)=>K.bez(p0,p1,p2,i/n));
const cat=(...ps)=>poly(ps.flatMap((p,i)=>i?p.slice(1):p));
// an arrow along a polyline, grown to fraction g
function pathArrow(c,pl,g,col,{w=4,dash=null,off=0}={}){
  if(g<=.02)return;const tip=ptAt(pl,g),back=ptAt(pl,Math.max(0,g-16/pl.len)),pts=upTo(pl,Math.max(0,g-16/pl.len));
  c.save();if(dash){c.setLineDash(dash);c.lineDashOffset=off;}if(pts.length>1)K.sline(c,pts,col,w);c.restore();
  K.arrow(c,back[0],back[1],tip[0],tip[1],col,w);
}
// loop clock for the ball: 0 before d0, then 0..1 over `travel`, holds 1 for `rest`, repeats
function loopU(tau,d0,travel,rest){if(tau<d0)return 0;const q=mod(tau-d0,travel+rest);return smooth(Math.min(1,q/travel));}
// CO2: O-C-O (C muted cyan-grey). bright=true leaves the C out (the tracked carbon ball is drawn there).
function co2(c,x,y,ang,{a=1,s=1,bright=false}={}){
  withA(c,a,()=>{const dx=Math.cos(ang)*14*s,dy=Math.sin(ang)*14*s;
    K.sline(c,[[x-dx,y-dy],[x+dx,y+dy]],rgba(WHITE,.55),3*s);
    circle(c,x-dx,y-dy,7*s,'#e8e1cf','#fff8e6',1.5);circle(c,x+dx,y+dy,7*s,'#e8e1cf','#fff8e6',1.5);
    if(!bright)circle(c,x,y,6*s,'#5f8f93','#a9d6da',1.5);});
}
// the tracked carbon: bright cyan ball; o = how much of its two O to show (only while it is in CO2)
function ball(c,x,y,t,o=0){
  if(o>0.02)co2(c,x,y,.25*Math.sin(t*.7),{a:o,s:1.15,bright:true});
  glow(c,x,y,28,CYAN,.55+.2*Math.sin(t*4));circle(c,x,y,9,'#d9fbff',CYAN,3);
}
const oAbove=(y,y0=176)=>clamp((y0-y)/34);
// drawn bacteria (rods and cocci) inside a clipped circle (same look as the roles module)
const BAC=(()=>{const r=K.rng(23),a=[];for(let i=0;i<34;i++)a.push({x:r()*2-1,y:r()*2-1,rod:i%3!==2,ang:r()*Math.PI,ph:r()*6.28,s:.75+r()*.5});return a.filter(b=>b.x*b.x+b.y*b.y<.78);})();
function bacteria(c,cx,cy,R,t){
  c.save();c.beginPath();c.arc(cx,cy,R,0,K.TAU);c.fillStyle='#0e2a22';c.fill();c.clip();
  const k=R/76;
  BAC.forEach(b=>{const x=cx+b.x*R+4*k*Math.sin(t*1.3+b.ph),y=cy+b.y*R+4*k*Math.cos(t*1.1+b.ph);
    if(b.rod){c.save();c.translate(x,y);c.rotate(b.ang+.25*Math.sin(t*.8+b.ph));const L2=15*k*b.s,W2=5.5*k;
      c.beginPath();c.roundRect(-L2,-W2,L2*2,W2*2,W2);c.fillStyle='#7fe9d0';c.fill();c.strokeStyle='#d9fff4';c.lineWidth=1.5;c.stroke();c.restore();}
    else{circle(c,x,y,6.5*k*b.s,'#a7f3d0','#e8fff7',1.5);circle(c,x+12*k*b.s,y+2*k,6.5*k*b.s,'#a7f3d0','#e8fff7',1.5);}
  });
  c.restore();circle(c,cx,cy,R,null,CYAN,3);
}
function decCard(c,t,glowA){
  const r=DEC;
  if(glowA>0)withA(c,glowA,()=>glow(c,r.x+r.w/2,r.y+r.h/2,r.w*.7,CYAN,.22+.08*Math.sin(t*2.4)));
  D.round(c,r.x,r.y,r.w,r.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
  const ph=94;K.place(c,'fungi_ai_1022/shiitake.png',r.x+8,r.y+8,108,ph);
  bacteria(c,r.x+r.w-62,r.y+8+ph/2,44,t);
  const fn=L('fungi','蕈類（真菌）','Mushrooms (fungi)'),bn=L('bacteria','細菌','Bacteria'),sn=L('schematic','示意','Schematic');
  let y=r.y+ph+38;
  K.splitLines(c,D.tr(fn),r.w-14,22).forEach(s=>{text(c,s,r.x+r.w/2,y,22,WHITE,'center');y+=27;});
  const wb=measure(c,bn,22),ws=measure(c,sn,22);
  if(wb+ws+12<=r.w-16){const x0=r.x+(r.w-wb-ws-12)/2;text(c,bn,x0,y,22,WHITE,'left');text(c,sn,x0+wb+12,y,22,MUTED,'left');}
  else{text(c,bn,r.x+r.w/2,y,22,WHITE,'center');text(c,sn,r.x+r.w/2,y+27,22,MUTED,'center');}
}
function flame(c,x,y,t){
  const f=1+.12*Math.sin(t*9)+.07*Math.sin(t*13.7),sw=2.5*Math.sin(t*7);
  K.ellipse(c,x,y+2,20,6,'#3a281b','#5b3f27',2);
  glow(c,x,y-16,34,ORANGE,.5);
  c.save();c.beginPath();c.moveTo(x-13,y);c.quadraticCurveTo(x-17,y-20*f,x+sw,y-38*f);c.quadraticCurveTo(x+17,y-20*f,x+13,y);c.closePath();c.fillStyle=ORANGE;c.fill();
  c.beginPath();c.moveTo(x-6,y);c.quadraticCurveTo(x-8,y-11*f,x+sw*.6,y-22*f);c.quadraticCurveTo(x+8,y-11*f,x+6,y);c.closePath();c.fillStyle=YELLOW;c.fill();c.restore();
}

// ── the stage (always drawn) ───────────────────────────────────────────────
const SPECK=(()=>{const r=K.rng(41),a=[];for(let i=0;i<70;i++)a.push([r()*CW,G+8+r()*(SOIL_B-G-14),1.5+r()*2.5,i%4]);return a;})();
function stage(c,t){
  const g=c.createLinearGradient(0,0,0,AIR+16);g.addColorStop(0,rgba(CYAN,.10));g.addColorStop(1,rgba(CYAN,0));
  c.fillStyle=g;c.fillRect(0,0,CW,AIR+16);
  K.dashed(c,[[0,AIR],[CW,AIR]],rgba(CYAN,.28),2,[4,10]);
  MOLS.forEach(([x,y,ph])=>co2(c,x+6*Math.sin(t*.45+ph),y+5*Math.sin(t*.8+ph),ph+.3*Math.sin(t*.5+ph),{a:.8}));
  // soil
  c.save();c.fillStyle='#3d2a1c';c.fillRect(0,G,CW,SOIL_B-G);c.fillStyle='#5b3f27';c.fillRect(0,G,CW,10);c.restore();
  K.sline(c,[[0,G],[CW,G]],'#8a6440',3);
  SPECK.forEach(([x,y,r,q])=>circle(c,x,y,r,q?'#4e3624':'#6b4a2f',null));
}

// ── steps (overlays) ───────────────────────────────────────────────────────
const soilTag=(c,x,y)=>tag(c,L('soil','土壤','Soil'),x,y,{col:SOILC});
// step 0 · carbon in the air
function homeAt(t){return[HOME[0]+18*Math.sin(t*.6),HOME[1]+8*Math.sin(t*.9)];}
function step0(c,tau,t){
  soilTag(c,16,G+12);
  const [bx,by]=homeAt(t);
  withA(c,fin(tau,.3),()=>{c.save();c.setLineDash([6,6]);c.lineDashOffset=-t*12;K.line(c,[[HOME[0],PY+18],[bx,by+14]],rgba(CYAN,.85),2.5);c.restore();
    const p=tag(c,L('carbon','碳','Carbon'),HOME[0],PY+18,{al:'center',col:CYAN,active:true});pulseRing(c,p,t,CYAN);});
  K.pulse(c,bx,by,t,CYAN,12);ball(c,bx,by,t,1);
}
// step 1 · photosynthesis: air -> rice
const P1=poly([[190,100],[104,206]]);
function step1(c,tau,t){
  soilTag(c,16,G+12);
  withA(c,fin(tau,.2),()=>pathArrow(c,P1,fin(tau,.2,.7),CYAN,{w:4.5}));
  withA(c,fin(tau,.6),()=>tag(c,L('photosynthesis','光合作用','Photosynthesis'),196,PY,{col:GREEN,active:true}));
  const u=loopU(tau,1,2.2,1.4),[hx,hy]=homeAt(t);
  const path=poly([[hx,hy],[190,100],[104,206],[ocx(0),ocy(0)]]),[x,y]=ptAt(path,u);
  ball(c,x,y,t,oAbove(y));
}
// step 2 · feeding: rice -> grasshopper; step 3 · grasshopper -> frog (+ snake hint)
const arc=(i,j)=>quad([ocx(i)+14,CARD.y-2],[(ocx(i)+ocx(j))/2,CARD.y-46],[ocx(j)-14,CARD.y-2]);
const A01=poly(arc(0,1)),A12=poly(arc(1,2)),A23=poly(arc(2,3));
function feed(c,tau,t,i,A){
  withA(c,fin(tau,.2),()=>pathArrow(c,A,fin(tau,.2,.7),CYAN,{w:4.5}));
  const ax=(ocx(i)+ocx(i+1))/2;let p;
  withA(c,fin(tau,.6),()=>{p=tag(c,L('feeding','攝食','Feeding'),ax,PY,{al:'center',col:WHITE,active:true});});
  const u=loopU(tau,1,2.2,1.4),path=cat([[ocx(i),ocy(i)],A.pts[0]],A.pts,[A.pts[A.pts.length-1],[ocx(i+1),ocy(i+1)]]),[x,y]=ptAt(path,u);
  ball(c,x,y,t,0);
  return p||{r:ax+60};
}
function step2(c,tau,t){soilTag(c,16,G+12);feed(c,tau,t,0,A01);}
function step3(c,tau,t){
  soilTag(c,16,G+12);
  const fp=feed(c,tau,t,1,A12);
  withA(c,fin(tau,1.8),()=>{pathArrow(c,A23,1,rgba(WHITE,.75),{w:3,dash:[9,8],off:-t*16});
    const p=X.sameUp,w=tagW(c,p),ax=(ocx(2)+ocx(3))/2;tag(c,p,Math.max(fp.r+12,ax-w/2),PY,{col:WHITE});});
}
// step 4 · respiration: rice, grasshopper, frog -> air
const RX=[0,1,2].map(i=>ocx(i)+30);
function step4(c,tau,t){
  soilTag(c,16,G+12);
  RX.forEach((x,i)=>withA(c,fin(tau,.2+i*.2),()=>{const pl=poly([[x,CARD.y-4],[x,AIR-30]]);pathArrow(c,pl,fin(tau,.2+i*.2,.6),CYAN,{w:4.5});
    if(i<2&&tau>1)for(let q=0;q<2;q++){const u=mod(t*.33+q*.5+i*.27),y=mix(CARD.y+30,AIR-36,u);co2(c,x-24,y,.4*Math.sin(t+q),{a:Math.sin(u*Math.PI)*oAbove(y,214)+0*u,s:.85});}}));
  let rp;
  withA(c,fin(tau,1),()=>{const bx1=RX[2]+16;c.save();c.setLineDash([7,6]);K.line(c,[[RX[0]-14,PY+20],[bx1,PY+20]],rgba(WHITE,.8),2.5);c.restore();
    RX.forEach(x=>circle(c,x,PY+20,5,WHITE,null));
    rp=tag(c,L('respiration','呼吸作用','Respiration'),bx1+4,PY,{col:WHITE,active:true});});
  withA(c,fin(tau,1.6),()=>{const p=tag(c,X.plantsToo,(rp?rp.r:600)+12,PY,{col:GREEN});pulseRing(c,p,t,GREEN);});
  const u=loopU(tau,1,2,1.4),path=poly([[ocx(2),ocy(2)],[RX[2],CARD.y+20],[RX[2],AIR-30],[RX[2]+14,72]]),[x,y]=ptAt(path,u);
  ball(c,x,y,t,oAbove(y,214));
}
// step 5 · remains -> decomposers -> air (+ humus)
const RY=422,DX=700,UPX=DEC.x+28,HX=DEC.x+DEC.w-40;
const HUMUS=(()=>{const r=K.rng(9),a=[];for(let i=0;i<16;i++)a.push([HX-46+r()*92,486+r()*48,3+r()*4]);return a;})();
function step5(c,tau,t){
  soilTag(c,16,500);
  // remains route
  withA(c,fin(tau,.2),()=>{[0,1,2].forEach(i=>K.arrow(c,ocx(i),CARD.y+CARD.h+2,ocx(i),RY-3,CYAN,4));
    pathArrow(c,poly([[ocx(0),RY],[DX,RY],[DX,DEC.y+DEC.h+4]]),fin(tau,.4,.9),CYAN,{w:4.5});});
  let rp;
  withA(c,fin(tau,.6),()=>{rp=tag(c,L('remains','遺體與排遺','Remains and waste'),110,RY+14,{col:WHITE,active:true});});
  withA(c,fin(tau,1),()=>tag(c,L('decomposition','分解作用','Decomposition'),(rp?rp.r:350)+16,RY+14,{col:CYAN}));
  // decomposers respire: up to the air
  withA(c,fin(tau,1.3),()=>{pathArrow(c,poly([[UPX,DEC.y-4],[UPX,AIR-30]]),fin(tau,1.3,.6),CYAN,{w:4.5});
    tag(c,L('respiration','呼吸作用','Respiration'),UPX-14,PY,{al:'right',col:WHITE,active:true});
    const p=tag(c,L('decomposer','分解者','Decomposer'),UPX+14,PY,{col:CYAN,active:true});pulseRing(c,p,t,CYAN);});
  // part stays in the soil as humus
  withA(c,fin(tau,1.8),()=>{HUMUS.forEach(([x,y,r],i)=>circle(c,x,y,r,i%3?'#2a1d13':'#33241a',null));
    K.arrow(c,HX,DEC.y+DEC.h+2,HX,478,CYAN,4);
    for(let q=0;q<3;q++){const u=mod(t*.35+q/3),x=HX+[-20,6,26][q],y=mix(G+6,520,u);withA(c,Math.sin(u*Math.PI),()=>{glow(c,x,y,10,CYAN,.7);circle(c,x,y,3.5,'#d9fbff',null);});}
    tag(c,L('humus','腐植質','Humus'),HX+16,446,{col:SOILC,active:true});});
  const u=loopU(tau,1.2,3.4,1),path=poly([[ocx(2),ocy(2)],[ocx(2),RY],[DX,RY],[DX,DEC.y+DEC.h-30],[UPX,DEC.y+60],[UPX,AIR-30],[UPX+10,74]]),[x,y]=ptAt(path,u);
  ball(c,x,y,t,oAbove(y,190));
}
// step 6 · supplement: buried (long, slow) -> fossil fuel -> burning (short, fast) -> air
const FX=916;
const BUR=poly([[240,G+4],[590,420],[176,438],[606,456],[206,474],[232,530],[FX,530]]);
const BURN=poly([[FX,530],[FX,G-6],[FX,AIR-30],[FX-10,74]]);
function strata(c){
  const cols=['#3b2a1d','#2a1f17','#35271b','#241b15'],ys=[STRATA,494,512,530,SOIL_B];
  for(let i=0;i<4;i++){c.beginPath();c.moveTo(0,ys[i]+(i?3*Math.sin(i*1.7):0));for(let x=0;x<=CW;x+=40)c.lineTo(x,ys[i]+(i?3*Math.sin(x*.02+i*1.7):0));c.lineTo(CW,ys[i+1]);c.lineTo(0,ys[i+1]);c.closePath();c.fillStyle=cols[i];c.fill();}
  K.sline(c,[[0,STRATA],[CW,STRATA]],'#5b4330',2);
}
function step6(c,tau,t){
  withA(c,fin(tau,0),()=>strata(c));
  soilTag(c,16,G+10);
  withA(c,fin(tau,.1),()=>tag(c,L('supplement','補充','Supplement'),16,PY,{col:YELLOW,active:true}));
  withA(c,fin(tau,.3),()=>{pathArrow(c,BUR,fin(tau,.3,1.4),rgba(CYAN,.85),{w:3.5,dash:[8,7],off:-t*10});
    tag(c,L('buried','埋藏','Buried'),16,456,{col:CYAN,active:true});
    tag(c,X.slower,16,502,{col:WHITE});});
  withA(c,fin(tau,.8),()=>tag(c,L('fossilFuel','化石燃料','Fossil fuel'),640,482,{col:SOILC,active:true}));
  withA(c,fin(tau,1.2),()=>{flame(c,FX,G-6,t);pathArrow(c,poly([[FX,G-48],[FX,AIR-30]]),fin(tau,1.2,.5),CYAN,{w:4.5});
    K.dashed(c,[[FX,530],[FX,G+4]],rgba(CYAN,.85),3.5,[8,7],-t*10);
    const p=tag(c,L('burning','燃燒','Burning'),FX-16,PY,{al:'right',col:ORANGE,active:true});
    tag(c,X.faster,p.x-12,PY,{al:'right',col:WHITE});});
  const T1=4.6,T2=.8,R=1.2,d0=1.6;
  if(tau>=d0){const q=mod(tau-d0,T1+T2+R);let x,y;
    if(q<T1)[x,y]=ptAt(BUR,smooth(q/T1));else[x,y]=ptAt(BURN,smooth(Math.min(1,(q-T1)/T2)));
    ball(c,x,y,t,q<T1?0:oAbove(y,G-40));}
  else ball(c,...BUR.pts[0],t,0);
}

// ── frame ──────────────────────────────────────────────────────────────────
const STEPS=[step0,step1,step2,step3,step4,step5,step6];
const HOLD=[null,0,1,2,null,'dec',null];
function legend(c){
  const sp=L('schematic','示意','Schematic'),s=[sp[0]+'：',sp[1]+':'],y=586,w=measure(c,s,22);
  text(c,s,16,y,22,MUTED,'left');
  const bx=16+w+20;glow(c,bx,y-8,16,CYAN,.5);circle(c,bx,y-8,7,'#d9fbff',CYAN,2.5);
  const cn=L('carbon','碳','Carbon'),cw=measure(c,cn,22);text(c,cn,bx+16,y,22,CYAN,'left');
  K.arrow(c,bx+16+cw+14,y-8,bx+16+cw+60,y-8,CYAN,3.5);
}
function progress(c,k,t){
  const n=N,gap=38,r=15,x0=CW-24-(n-1)*gap,y=578;
  K.sline(c,[[x0,y],[x0+(n-1)*gap,y]],rgba(MUTED,.5),3);
  if(k>0)K.sline(c,[[x0,y],[x0+k*gap,y]],CYAN,3);
  for(let i=0;i<n;i++){const x=x0+i*gap;
    if(i===k){glow(c,x,y,26,CYAN,.35+.15*Math.sin(t*3));circle(c,x,y,r,CYAN,WHITE,2);}
    else circle(c,x,y,r,'#16332b',i<k?CYAN:rgba(MUTED,.7),2.5);
    c.save();c.font=K.MONO(22);c.fillStyle=i===k?C.deep:(i<k?CYAN:MUTED);c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,y+1);c.restore();}
}
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.carbonFx||(s.carbonFx={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,u=st.from>=0?smooth(clamp(tau/MOVE)):1;
  stage(c,t);
  // cards (the one holding the carbon glows cyan)
  const h=HOLD[k],ga=.7+.3*Math.sin(t*2);
  ORG.forEach((o,i)=>card(c,{x:o.x,y:CARD.y,w:o.w,h:CARD.h},o.pic,L(o.k,...o.n),{col:o.col||WHITE,glowA:h===i?ga:(k===3&&i===3?.35:0),t}));
  decCard(c,t,h==='dec'?ga:0);
  if(u<1)withA(c,1-u,()=>STEPS[st.from](c,99,t));
  withA(c,st.from>=0?u:1,()=>STEPS[k](c,st.from>=0?Math.max(0,tau-MOVE*.5):tau,t));
  // fixed labels
  tag(c,L('air','空氣','Air'),16,12,{col:CYAN});
  const ap=tagW(c,L('air','空氣','Air'));tag(c,co2Name(),16+ap+12,12,{col:WHITE});
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-16,40,22,MUTED,'right');
  legend(c);progress(c,k,t);
}
window.EcologyDraw.carbon=draw;
})();

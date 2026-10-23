/* Ecology lesson 2 · "compare" canvas (carbon-cycle tab, view 1), 2026-10-23. Energy one way vs carbon cycling.
 * The canvas is split in two halves by a thin divider (x 480).
 *  Left (energy, yellow): a straight vertical line from a drawn sun at the bottom ("sunlight in") up through rice,
 *    grasshopper, frog and snake (small AI picture nodes, names to the right) to an orange "heat lost" pill at the top.
 *    Yellow energy dots rise along the line, getting smaller at every level, and turn orange on the last stretch;
 *    orange heat sparks float up and away from every level and fade (lost heat never comes back). A tall faint arrow
 *    with moving chevrons carries the "one way" pill.
 *  Right (matter, cyan): a circle air (CO2) -> producer (rice) -> consumer (grasshopper) -> decomposer (shiitake) -> air,
 *    clockwise arrowheads; three bright carbon balls (same look as the carbon module) keep going round, showing their two
 *    O while they pass through the air; "cycles" pill in the middle.
 * Steps (8 s each, s.shown = step; the halves' brightness and the ecosphere cross-fade over MOVE s):
 *  0 only the left half is bright (right dimmed); 1 only the right half; 2 both bright, plus a small drawn ecosphere
 *  (glass jar, rice seedling, soil mound, cyan dots circling inside) at the bottom centre, a drawn sun with a yellow
 *  arrow into the jar, "light energy", and the sentence "a closed ecosphere still needs light".
 * Bottom: a 3-dot progress track on the left; AI note bottom right.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=8,CW=960,MOVE=1.1,DIM=.26;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,CYAN=C.cyan,ORANGE=C.orange,MUTED=C.muted,SOILC='#c49a6c';
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
// labels this module adds (not in K.LAB yet): reported to the main conversation
const airCO2=()=>{const p=L('air','空氣','Air');return[p[0]+'（CO₂）',p[1]+' (CO₂)'];};

// ── shared helpers (same look as the carbon module) ─────────────────────────
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h,cx:bx+w/2,cy:y+h/2,r:bx+w};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function co2(c,x,y,ang,{a=1,s=1,bright=false}={}){
  withA(c,a,()=>{const dx=Math.cos(ang)*14*s,dy=Math.sin(ang)*14*s;
    K.sline(c,[[x-dx,y-dy],[x+dx,y+dy]],rgba(WHITE,.55),3*s);
    circle(c,x-dx,y-dy,7*s,'#e8e1cf','#fff8e6',1.5);circle(c,x+dx,y+dy,7*s,'#e8e1cf','#fff8e6',1.5);
    if(!bright)circle(c,x,y,6*s,'#5f8f93','#a9d6da',1.5);});
}
function ball(c,x,y,t,o=0,r=9){
  if(o>0.02)co2(c,x,y,.25*Math.sin(t*.7),{a:o,s:1.1,bright:true});
  glow(c,x,y,r*3,CYAN,.55+.2*Math.sin(t*4));circle(c,x,y,r,'#d9fbff',CYAN,3);
}
function sun(c,x,y,r,t){
  glow(c,x,y,r*2.4,YELLOW,.35+.08*Math.sin(t*1.8));
  c.save();c.translate(x,y);c.rotate(t*.25);c.lineCap='round';
  for(let i=0;i<12;i++){const a=i*Math.PI/6,l=r*(1.32+.14*Math.sin(t*3+i));c.beginPath();c.moveTo(Math.cos(a)*r*1.1,Math.sin(a)*r*1.1);c.lineTo(Math.cos(a)*l,Math.sin(a)*l);c.strokeStyle=YELLOW;c.lineWidth=3.5;c.stroke();}
  c.restore();circle(c,x,y,r,YELLOW,'#fff3a6',3);
}
function spark(c,x,y,a,r=5){withA(c,a,()=>{glow(c,x,y,r*3,ORANGE,.5);circle(c,x,y,r,ORANGE,null);});}

// ── left half: energy, a straight line ─────────────────────────────────────
const LX=130,SUNY=420,HEAT_Y=60,LANE=410;
const LV=[{k:'snake',pic:'EC6_snake.png',n:['黑眉錦蛇','Black-browed ratsnake'],y:140},{k:'frog',pic:'EC5_frog.png',n:['澤蛙','Paddy field frog'],y:210},
  {k:'grasshopper',pic:'EC4_grasshopper.png',n:['蚱蜢','Grasshopper'],y:280},{k:'rice',pic:'EC3_rice.png',n:['水稻','Rice'],y:350}];
const NB={w:72,h:52};
const dotR=y=>y>350?8:y>280?6.5:y>210?5.2:y>140?4.2:3.8;
function leftHalf(c,t,hot){
  // header
  const hp=tag(c,L('energy','能量','Energy'),20,12,{col:YELLOW,active:true});
  if(hot)pulseRing(c,hp,t,YELLOW);
  // the line (drawn as arrows between the nodes)
  const top=HEAT_Y+40;
  K.sline(c,[[LX,SUNY-22],[LX,top+4]],rgba(YELLOW,.35),10);
  // energy dots: rise from the sun, smaller after every level, orange after the last one
  for(let q=0;q<12;q++){const u=mod(t/6+q/12),y=mix(SUNY-16,top+6,u),r=dotR(y),col=y<LV[0].y?ORANGE:YELLOW;
    withA(c,Math.min(1,(1-u)*8),()=>{glow(c,LX,y,r*2.6,col,.5);circle(c,LX,y,r,col,null);});}
  // heat sparks: up and away from every level, fading (never coming back)
  LV.forEach((v,j)=>{for(let q=0;q<4;q++){const u=mod(t*.42+q/4+j*.23),x=LX-NB.w/2-6-u*46+Math.sin(t*2.3+q*2+j)*(4+u*6),y=v.y-14-u*52;spark(c,x,y,(1-u)*.9,3.2+2*(1-u));}});
  // arrows between the nodes
  K.arrow(c,LX,SUNY-24,LX,LV[3].y+NB.h/2+3,YELLOW,4);
  for(let j=3;j>0;j--)K.arrow(c,LX,LV[j].y-NB.h/2-2,LX,LV[j-1].y+NB.h/2+3,YELLOW,4);
  K.arrow(c,LX,LV[0].y-NB.h/2-2,LX,top+3,ORANGE,4);
  // nodes: picture on a small backing, name to the right
  LV.forEach(v=>{D.round(c,LX-NB.w/2,v.y-NB.h/2,NB.w,NB.h,10,'#16332b',rgba(WHITE,.4));
    K.place(c,v.pic,LX-NB.w/2+4,v.y-NB.h/2+4,NB.w-8,NB.h-8);
    const rows=K.splitLines(c,D.tr(L(v.k,...v.n)),156,22),lh=25,y0=v.y-(rows.length*lh)/2+18;
    rows.forEach((s,i)=>text(c,s,LX+NB.w/2+12,y0+i*lh,22,v.k==='rice'?GREEN:WHITE,'left'));});
  // sun and "sunlight in"
  sun(c,LX,SUNY,14,t);
  tag(c,L('sunlightIn','陽光進來','Sunlight in'),LX+32,SUNY-20,{col:YELLOW,maxX:LANE-70});
  // heat lost at the top
  tag(c,L('heatOut','熱散失','Heat lost'),LX,HEAT_Y,{al:'center',col:ORANGE,active:true,minX:12});
  // one-way lane: faint tall arrow with moving chevrons
  K.sline(c,[[LANE,SUNY],[LANE,HEAT_Y+50]],rgba(YELLOW,.16),26);
  c.save();c.beginPath();c.rect(LANE-20,HEAT_Y+40,40,SUNY-HEAT_Y-36);c.clip();
  for(let q=0;q<9;q++){const y=SUNY-mod(t*34+q*38,SUNY-HEAT_Y-30);K.sline(c,[[LANE-10,y+7],[LANE,y-3],[LANE+10,y+7]],rgba(YELLOW,.7),3);}
  c.restore();
  K.arrow(c,LANE,HEAT_Y+62,LANE,HEAT_Y+30,rgba(YELLOW,.8),5);
  const op=tag(c,L('oneWay','單向','One way'),LANE,236,{al:'center',col:YELLOW,active:true,maxX:470,minX:LX+NB.w/2+170});
  if(hot)pulseRing(c,op,t,YELLOW);
}

// ── right half: carbon, a circle ───────────────────────────────────────────
const CX=720,CY=268,R=134;
const RN=[{a:0,role:['producer','生產者','Producer'],k:'rice',pic:'EC3_rice.png',n:['水稻','Rice'],col:GREEN},
  {a:Math.PI/2,role:['consumer','消費者','Consumer'],k:'grasshopper',pic:'EC4_grasshopper.png',n:['蚱蜢','Grasshopper'],col:WHITE},
  {a:Math.PI,role:['decomposer','分解者','Decomposer'],k:'fungi',pic:'fungi_ai_1022/shiitake.png',n:['蕈類（真菌）','Mushrooms (fungi)'],col:CYAN}];
const ON=(a,r=R)=>[CX+Math.cos(a)*r,CY+Math.sin(a)*r];
function nodeCard(c,v){
  const w=v.a===Math.PI/2?158:150,[nx,ny]=ON(v.a),role=K.splitLines(c,D.tr(L(...v.role)),w-14,22),name=K.splitLines(c,D.tr(L(v.k,...v.n)),w-14,22);
  const ph=48,lh=25,h=10+ph+6+(role.length+name.length)*lh+4,x=nx-w/2,y=ny-h/2;
  D.round(c,x,y,w,h,12,'rgba(28,61,52,.96)',rgba(WHITE,.4));
  K.place(c,v.pic,x+8,y+8,w-16,ph);
  let ty=y+10+ph+6+19;
  role.forEach(s=>{text(c,s,nx,ty,22,v.col,'center');ty+=lh;});
  name.forEach(s=>{text(c,s,nx,ty,22,WHITE,'center');ty+=lh;});
}
const MOLS=[[612,92,.4],[828,88,2.2],[560,150,1.3],[884,150,3.1]];
function rightHalf(c,t,hot){
  const hp=tag(c,L('matter','物質（碳）','Matter (carbon)'),500,12,{col:CYAN,active:true});
  if(hot)pulseRing(c,hp,t,CYAN);
  // legend: the ball is carbon
  const lx=hp.r+30;glow(c,lx,32,18,CYAN,.5);circle(c,lx,32,8,'#d9fbff',CYAN,2.5);text(c,L('carbon','碳','Carbon'),lx+18,40,22,CYAN,'left');
  // air: drifting CO2 molecules around the air pill
  MOLS.forEach(([x,y,ph])=>co2(c,x+6*Math.sin(t*.45+ph),y+5*Math.sin(t*.8+ph),ph+.3*Math.sin(t*.5+ph),{a:.75}));
  // the loop
  circle(c,CX,CY,R,null,rgba(CYAN,.75),4);
  // carbon balls going round (clockwise: air -> producer -> consumer -> decomposer -> air)
  for(let i=0;i<3;i++){const a=-Math.PI/2+t*K.TAU/10+i*K.TAU/3,[x,y]=ON(a);ball(c,x,y,t,clamp((-Math.sin(a)-.82)/.12));}
  [-Math.PI/4,Math.PI/4,3*Math.PI/4,5*Math.PI/4].forEach(a=>{const [x,y]=ON(a),dx=-Math.sin(a),dy=Math.cos(a);K.arrow(c,x-dx*14,y-dy*14,x+dx*12,y+dy*12,CYAN,5);});
  RN.forEach(v=>nodeCard(c,v));
  tag(c,airCO2(),CX,74,{al:'center',col:CYAN,active:true});
  const cp=tag(c,L('cycle','循環','Cycles'),CX,CY-20,{al:'center',col:CYAN,active:true});
  if(hot)pulseRing(c,cp,t,CYAN);
}

// ── step 3: the ecosphere (a big sealed bottle; the two halves fade out) ─────
// glass bottle: body x BL..BR, shoulders up to a short neck NL..NR, cork on top; water from WL, sand from SAND
const JX=480,BL=330,BR=630,NL=420,NR=540,NECK=166,SH=224,BOT=560,WL=240,SAND=518;
const WATERC='#7cc8f0',PINK=C.pink,PLANTD='#2f9e57';
function jarPath(c){c.beginPath();c.moveTo(NL,NECK);c.lineTo(NL,180);c.quadraticCurveTo(BL,182,BL,SH);c.lineTo(BL,BOT-34);c.quadraticCurveTo(BL,BOT,BL+34,BOT);
  c.lineTo(BR-34,BOT);c.quadraticCurveTo(BR,BOT,BR,BOT-34);c.lineTo(BR,SH);c.quadraticCurveTo(BR,182,NR,180);c.lineTo(NR,NECK);c.closePath();}
const waveY=(x,t)=>WL+3*Math.sin(x*.05+t*1.6);
const sandY=x=>SAND+5*Math.sin(x*.06)+3*Math.sin(x*.13+1);
// water plants (producers): stem + alternate leaves, swaying
const PL=[{x:368,h:250,lean:.10,ph:0,n:7},{x:410,h:172,lean:-.07,ph:1.7,n:5},{x:598,h:205,lean:-.12,ph:3.1,n:6}];
function plantGeo(p,t){const base=[p.x,sandY(p.x)+4],sw=Math.sin(t*1.2+p.ph)*12,tip=[p.x+p.lean*p.h+sw,base[1]-p.h],ctrl=[p.x+p.lean*p.h*.4+sw*.3,base[1]-p.h*.55];return u=>K.bez(base,ctrl,tip,u);}
function plant(c,p,t){
  const at=plantGeo(p,t),pts=[];for(let i=0;i<=16;i++)pts.push(at(i/16));
  K.sline(c,pts,PLANTD,4.5);
  for(let i=0;i<p.n;i++){const u=.16+.8*i/(p.n-1),[x,y]=at(u),[x2,y2]=at(Math.min(1,u+.03)),ang=Math.atan2(y2-y,x2-x),side=i%2?1:-1,
    la=ang+side*(.95+.12*Math.sin(t*2+i+p.ph)),len=24*(1-.35*u);
    K.ellipse(c,x+Math.cos(la)*len*.55,y+Math.sin(la)*len*.55,len*.62,6.5,rgba(GREEN,.88),'#bbf7d0',1.3,la);}
  const [tx,ty]=at(1);K.ellipse(c,tx,ty-4,5,10,rgba(GREEN,.9),'#bbf7d0',1.3,Math.atan2(...(()=>{const [a,b]=at(.95);return[ty-b,tx-a];})())-Math.PI/2);
}
// shrimp (consumers), drawn facing +x, then flipped by dir
function shrimp(c,x,y,dir,t,s=1){
  c.save();c.translate(x,y);c.scale(dir*s,s);
  const kick=Math.sin(t*9)*2,ant='rgba(251,207,232,.9)';
  K.sline(c,[[24,-7],[42,-18],[64,-15+3*Math.sin(t*3)]],ant,1.8);
  K.sline(c,[[24,-4],[46,-7],[66,2+3*Math.sin(t*3+1)]],ant,1.8);
  for(let i=0;i<5;i++){const lx=13-i*7;K.sline(c,[[lx,6],[lx-3+2.5*Math.sin(t*10+i),15]],'#f9a8d4',2);}
  c.beginPath();c.moveTo(-22,8);c.lineTo(-38,3+kick);c.lineTo(-35,20+kick);c.closePath();c.fillStyle='#f9a8d4';c.fill();c.strokeStyle='#fbcfe8';c.lineWidth=1.3;c.stroke();
  [[-20,8,6],[-13,5,7],[-5,2.5,8],[4,1,8.5]].forEach(([sx,sy,r])=>K.ellipse(c,sx,sy,r*1.1,r,rgba(PINK,.92),'#fbcfe8',1.5));
  K.ellipse(c,16,-1,12,8,rgba(PINK,.95),'#fbcfe8',1.5);
  K.sline(c,[[25,-5],[38,-10]],'#fbcfe8',2.2);
  circle(c,22,-5,2.8,'#1c2b26',null);
  c.restore();
}
const SHR=[{cx:505,cy:316,ax:56,ay:12,w:.34,ph:0},{cx:498,cy:440,ax:44,ay:9,w:.28,ph:2.2}];
const shrimpPos=(v,t)=>{const a=t*v.w+v.ph;return{x:v.cx+v.ax*Math.sin(a),y:v.cy+v.ay*Math.sin(2*a)+2*Math.sin(t*4+v.ph),dir:Math.cos(a)>=0?1:-1};};
// bacteria (decomposers): rods and cocci on the sand and near the bottom, wobbling (look of the roles module)
const BACS=(()=>{const r=K.rng(41),a=[];for(let i=0;i<14;i++){const x=432+r()*150;a.push({x,y:sandY(x)+3+r()*9,rod:i%3!==2,ang:r()*Math.PI,ph:r()*6.28});}
  for(let i=0;i<6;i++)a.push({x:440+r()*120,y:478+r()*26,rod:i%2===0,ang:r()*Math.PI,ph:r()*6.28,sw:1});return a;})();
function bacteria(c,t){
  BACS.forEach(b=>{const x=b.x+(b.sw?4:1.5)*Math.sin(t*1.3+b.ph),y=b.y+(b.sw?3:1)*Math.cos(t*1.1+b.ph);
    if(b.rod){c.save();c.translate(x,y);c.rotate(b.ang+.25*Math.sin(t*.8+b.ph));c.beginPath();c.roundRect(-11,-4.5,22,9,4.5);c.fillStyle='#7fe9d0';c.fill();c.strokeStyle='#d9fff4';c.lineWidth=1.3;c.stroke();c.restore();}
    else{circle(c,x,y,5,'#a7f3d0','#e8fff7',1.3);circle(c,x+9.5,y+1,5,'#a7f3d0','#e8fff7',1.3);}});
}
// matter (carbon) going round inside: plant (left) -> shrimp (top) -> bacteria (bottom) -> water -> plant
const LC={x:484,y:402,rx:96,ry:66};
const onLoop=a=>[LC.x+Math.cos(a)*LC.rx,LC.y+Math.sin(a)*LC.ry];
function loop(c,t){
  c.save();c.setLineDash([9,8]);c.lineDashOffset=-t*18;c.beginPath();c.ellipse(LC.x,LC.y,LC.rx,LC.ry,0,0,K.TAU);c.strokeStyle=rgba(CYAN,.6);c.lineWidth=2.5;c.stroke();c.restore();
  [Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4].forEach(a=>{const [x,y]=onLoop(a),dx=-Math.sin(a)*LC.rx,dy=Math.cos(a)*LC.ry,n=Math.hypot(dx,dy);K.arrow(c,x-dx/n*9,y-dy/n*9,x+dx/n*9,y+dy/n*9,rgba(CYAN,.85),3);});
  for(let i=0;i<4;i++){const [x,y]=onLoop(t*K.TAU/9+i*K.TAU/4);glow(c,x,y,15,CYAN,.6+.2*Math.sin(t*4+i));circle(c,x,y,5,'#d9fbff',CYAN,2);}
}
function cork(c){
  c.beginPath();c.moveTo(NL-10,124);c.lineTo(NR+10,124);c.lineTo(NR-2,172);c.lineTo(NL+2,172);c.closePath();c.fillStyle='#8a5a36';c.fill();c.strokeStyle='#c08a5a';c.lineWidth=2.5;c.stroke();
  [[NL+18,138],[NL+60,150],[NL+96,136],[NL+40,162],[NR-20,158]].forEach(([x,y])=>circle(c,x,y,2.6,'#6b4428',null));
}
function lead(c,x1,y1,x2,y2,col){K.sline(c,[[x1,y1],[x2,y2]],rgba(col,.8),2);circle(c,x2,y2,4,col,null);}
// a name pill with its role pill under it (al: 'left' = grows right from x, 'right' = ends at x)
function named(c,name,role,x,y,col,al){
  const a=tag(c,name,x,y,{al,col,active:true});const b=role?tag(c,role,al==='right'?a.r:a.x,y+a.h+4,{al,col}):null;return{a,b};}
// small reminder cards of steps 1 and 2 at the top corners
function miniCards(c,t){
  // energy: one way
  D.round(c,12,8,290,98,14,'rgba(22,51,43,.95)',rgba(YELLOW,.45));
  const e1=tag(c,L('energy','能量','Energy'),24,16,{col:YELLOW,active:true});
  tag(c,L('oneWay','單向','One way'),e1.r+8,16,{col:YELLOW,maxX:296});
  const y=82,x0=44,x1=272;sun(c,x0,y,8,t);
  K.sline(c,[[x0+16,y],[x1-40,y]],rgba(YELLOW,.5),4);K.sline(c,[[x1-40,y],[x1-14,y]],rgba(ORANGE,.6),4);K.arrow(c,x1-26,y,x1,y,ORANGE,4);
  for(let q=0;q<5;q++){const u=mod(t*.22+q/5),x=mix(x0+18,x1-6,u),col=x>x1-40?ORANGE:YELLOW;withA(c,Math.min(1,(1-u)*6),()=>{glow(c,x,y,9,col,.6);circle(c,x,y,3.5,col,null);});}
  // matter: cycles
  D.round(c,658,8,290,98,14,'rgba(22,51,43,.95)',rgba(CYAN,.45));
  const m1=tag(c,L('matter','物質（碳）','Matter (carbon)'),670,16,{col:CYAN,active:true}),cw=measure(c,L('cycle','循環','Cycles'),22)+28;
  const inRow=m1.r+8+cw<=940,ex=inRow?803:735;
  if(inRow)tag(c,L('cycle','循環','Cycles'),m1.r+8,16,{col:CYAN});else tag(c,L('cycle','循環','Cycles'),936,62,{al:'right',col:CYAN});
  const rx=inRow?110:60;c.beginPath();c.ellipse(ex,82,rx,13,0,0,K.TAU);c.strokeStyle=rgba(CYAN,.6);c.lineWidth=2.5;c.stroke();
  for(let q=0;q<3;q++){const a=t*K.TAU/7+q*K.TAU/3,x=ex+Math.cos(a)*rx,yy=82+Math.sin(a)*13;glow(c,x,yy,9,CYAN,.6);circle(c,x,yy,3.5,'#d9fbff',null);}
}
// fit a title into a width, no smaller than 22px
function fitSize(c,p,w,big){let z=big;while(z>22&&measure(c,p,z)>w)z-=2;return z;}
function ecosphere(c,t){
  miniCards(c,t);
  // title above the bottle
  const tp=L('ecosphere','生態瓶','Ecosphere (sealed bottle)'),tz=fitSize(c,tp,336,32);
  if(measure(c,tp,tz)<=336)text(c,tp,JX,52,tz,WHITE,'center');else K.wrap(c,tp,JX,40,336,22,WHITE,26,'center');
  const sp=L('bottleFood','瓶中的小生態系','A tiny ecosystem in a bottle');
  if(measure(c,sp,22)<=340)text(c,sp,JX,92,22,MUTED,'center');else K.wrap(c,sp,JX,80,340,22,MUTED,24,'center');
  // inside the bottle (clipped)
  c.save();jarPath(c);c.fillStyle='rgba(18,44,40,.9)';c.fill();c.clip();
  // water
  c.beginPath();c.moveTo(BL-2,waveY(BL,t));for(let x=BL;x<=BR+2;x+=6)c.lineTo(x,waveY(x,t));c.lineTo(BR+2,BOT+2);c.lineTo(BL-2,BOT+2);c.closePath();
  const g=c.createLinearGradient(0,WL,0,BOT);g.addColorStop(0,rgba(WATERC,.34));g.addColorStop(1,rgba('#2a7fa6',.42));c.fillStyle=g;c.fill();
  const wl=[];for(let x=BL;x<=BR;x+=6)wl.push([x,waveY(x,t)]);K.sline(c,wl,rgba('#d6f1ff',.75),2.5);
  // sand
  c.beginPath();c.moveTo(BL-2,sandY(BL));for(let x=BL;x<=BR+2;x+=5)c.lineTo(x,sandY(x));c.lineTo(BR+2,BOT+2);c.lineTo(BL-2,BOT+2);c.closePath();c.fillStyle='#a88a5c';c.fill();
  [[350,536,4],[392,548,3],[452,540,3.5],[520,550,3],[566,538,4],[608,546,3]].forEach(([x,y,r])=>circle(c,x,y,r,'#7a6040',null));
  // a few rising bubbles from the plants (oxygen; no label, just life)
  for(let q=0;q<4;q++){const u=mod(t*.25+q/4),p=PL[q%3],x=p.x+p.lean*p.h*.6+4*Math.sin(t*2+q),y=mix(sandY(p.x)-p.h*.5,WL+8,u);withA(c,(1-u)*.8,()=>circle(c,x,y,3,null,'#d6f1ff',1.3));}
  loop(c,t);
  bacteria(c,t);
  PL.forEach(p=>plant(c,p,t));
  SHR.forEach(v=>{const q=shrimpPos(v,t);shrimp(c,q.x,q.y,q.dir,t,.9);});
  c.restore();
  // glass outline and highlight, cork
  jarPath(c);c.strokeStyle=rgba(WHITE,.85);c.lineWidth=3.5;c.stroke();
  K.sline(c,[[BL+14,SH+16],[BL+14,BOT-40]],rgba(WHITE,.28),5);K.sline(c,[[BR-12,SH+30],[BR-12,SH+120]],rgba(WHITE,.18),4);
  cork(c);
  // sunlight in (left)
  sun(c,SUNP[0],SUNP[1],24,t);
  RAYS.forEach(([x,y],i)=>{const a=Math.atan2(y-SUNP[1],x-SUNP[0]),s0=[SUNP[0]+Math.cos(a)*40,SUNP[1]+Math.sin(a)*40];
    K.arrow(c,s0[0],s0[1],x,y,YELLOW,4);
    for(let q=0;q<2;q++){const v=mod(t*.45+q/2+i*.2),p=K.lerpP(s0,[x,y],v);withA(c,Math.sin(v*Math.PI),()=>{glow(c,p[0],p[1],11,YELLOW,.7);circle(c,p[0],p[1],3.5,'#fff7c2',null);});}});
  tag(c,L('light','光能','Light energy'),SUNP[0],120,{al:'center',col:YELLOW,active:true,minX:14});
  tag(c,L('onlyLightIn','只有光能進來','Only light gets in'),18,340,{col:YELLOW,maxX:BL-14});
  // heat lost (right): out through the glass, sparks drift away
  const h0=[BR-26,300],h1=[700,282];glow(c,BR,296,16,ORANGE,.45+.15*Math.sin(t*3));K.arrow(c,h0[0],h0[1],h1[0],h1[1],ORANGE,4);
  for(let q=0;q<6;q++){const u=mod(t*.38+q/6),x=h1[0]-8+u*16+5*Math.sin(t*2.6+q*1.7),y=h1[1]-8-u*52;spark(c,x,y,(1-u)*.95,2.8+2.2*(1-u));}
  tag(c,L('heatOut','熱散失','Heat lost'),714,262,{col:ORANGE,active:true});
  // names: left column (ends near the glass), right column (starts past the glass)
  const RX=BL-12,LX2=660;
  const sl=tag(c,L('sealed','密封','Sealed'),566,114,{col:WHITE});lead(c,sl.x,sl.cy,NR+6,146,WHITE);
  const wa=tag(c,L('water','水','Water'),LX2,176,{col:WATERC,active:true});lead(c,wa.x,wa.cy,614,262,WATERC);
  const pp=PL[0],pAt=plantGeo(pp,t)(.42),pl=named(c,L('waterPlant','水草','Water plant'),L('producer','生產者','Producer'),RX,396,GREEN,'right');lead(c,pl.a.r,pl.a.cy,pAt[0]-4,pAt[1],GREEN);
  const bp=named(c,L('bacteria','細菌','Bacteria'),L('decomposer','分解者','Decomposer'),RX,486,CYAN,'right');lead(c,bp.a.r,bp.a.cy,446,sandY(446)+6,CYAN);
  const s0=shrimpPos(SHR[0],t),s1=shrimpPos(SHR[1],t),sh=named(c,L('shrimp','小蝦','Shrimp'),L('consumer','消費者','Consumer'),LX2,340,PINK,'left');
  lead(c,sh.a.x,sh.a.cy,s0.x+s0.dir*14,s0.y,PINK);lead(c,sh.a.x,sh.a.cy+6,s1.x+s1.dir*14,s1.y,PINK);
  const [mx,my]=onLoop(.2),mt=named(c,L('matter','物質（碳）','Matter (carbon)'),L('cycle','循環','Cycles'),LX2,446,CYAN,'left');lead(c,mt.a.x,mt.a.cy,mx+6,my,CYAN);
  // everything here is drawn: one "schematic" note
  const sc=[L('schematic','示意','Schematic'),L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes')],note=[sc[0][0]+'：'+sc[1][0],sc[0][1]+': '+sc[1][1]];
  text(c,note,CW-16,588,22,MUTED,'right');
}
const SUNP=[80,210],RAYS=[[372,262],[368,306],[364,350]];

// ── frame ──────────────────────────────────────────────────────────────────
const LA=[1,DIM,0],RA=[DIM,1,0],EA=[0,0,1];
function progress(c,k,t){
  const gap=38,r=15,x0=30,y=576,cols=[YELLOW,CYAN,WHITE];
  K.sline(c,[[x0,y],[x0+(N-1)*gap,y]],rgba(MUTED,.5),3);
  for(let i=0;i<N;i++){const x=x0+i*gap;
    if(i===k){glow(c,x,y,26,cols[i],.35+.15*Math.sin(t*3));circle(c,x,y,r,cols[i],WHITE,2);}
    else circle(c,x,y,r,'#16332b',i<k?cols[i]:rgba(MUTED,.7),2.5);
    c.save();c.font=K.MONO(22);c.fillStyle=i===k?C.deep:(i<k?cols[i]:MUTED);c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,y+1);c.restore();}
}
// a dimmed half is drawn whole on its own layer first, so its cards stay opaque over the dots behind them
const LAYERS=[];
function layer(c,a,fn,i){
  if(a>=.999){fn(c);return;}if(a<=.002)return;
  const cv=c.canvas,o=LAYERS[i]||(LAYERS[i]=document.createElement('canvas'));
  if(o.width!==cv.width||o.height!==cv.height){o.width=cv.width;o.height=cv.height;}
  const oc=o.getContext('2d');oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,o.width,o.height);oc.setTransform(c.getTransform());
  fn(oc);
  c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha*=a;c.drawImage(o,0,0);c.restore();
}
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.compareFx||(s.compareFx={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  // going to / from step 3 the halves and the ecosphere take turns (one fades out, then the other fades in), never both full
  const raw=st.from>=0?clamp((t-st.T)/MOVE):1,f=st.from>=0?st.from:k,toE=k===2&&f!==2,fromE=f===2&&k!==2;
  const uH=smooth(toE?clamp(raw/.55):fromE?clamp((raw-.45)/.55):raw),uE=smooth(toE?clamp((raw-.45)/.55):fromE?clamp(raw/.55):raw);
  const la=mix(LA[f],LA[k],uH),ra=mix(RA[f],RA[k],uH),ea=mix(EA[f],EA[k],uE),ha=Math.max(la,ra);
  withA(c,ha,()=>K.sline(c,[[CW/2,10],[CW/2,452]],rgba(MUTED,.45),2));
  layer(c,la,cc=>leftHalf(cc||c,t,k!==1),0);
  layer(c,ra,cc=>rightHalf(cc||c,t,k!==0),1);
  layer(c,ea,cc=>ecosphere(cc||c,t),2);
  progress(c,k,t);
  withA(c,clamp(ha/DIM),()=>text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-16,588,22,MUTED,'right'));
}
window.EcologyDraw.compare=draw;
})();

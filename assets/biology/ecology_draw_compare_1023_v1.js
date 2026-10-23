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
const N=3,PER=8,CW=960,MOVE=.8,DIM=.26;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,CYAN=C.cyan,ORANGE=C.orange,MUTED=C.muted,SOILC='#c49a6c';
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
// labels this module adds (not in K.LAB yet): reported to the main conversation
const X={jarNeedsLight:P('封閉的生態瓶也需要光','A closed ecosphere still needs light')};
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

// ── bottom: the ecosphere (step 3) ─────────────────────────────────────────
const JX=480,JT=474,JB=590;
const SEED=[[-14,-1,-.5],[-6,-4,-.15],[3,-4,.2],[11,-1,.55]];
function jar(c,t){
  const w=112,top=JT+18,x0=JX-w/2;
  // soil mound and seedling (behind the glass highlight)
  c.save();c.beginPath();c.roundRect(x0,top,w,JB-top,[18,18,26,26]);c.clip();
  c.fillStyle=rgba(CYAN,.07);c.fillRect(x0,top,w,JB-top);
  c.beginPath();c.moveTo(x0,JB);c.quadraticCurveTo(JX,JB-44,x0+w,JB);c.closePath();c.fillStyle='#4a3322';c.fill();
  [[JX-20,JB-10,3],[JX+12,JB-14,2.5],[JX+30,JB-6,2.5],[JX-38,JB-5,2]].forEach(([x,y,r])=>circle(c,x,y,r,'#6b4a2f',null));
  // matter going round inside the closed jar
  for(let i=0;i<5;i++){const a=t*K.TAU/6+i*K.TAU/5,x=JX+Math.cos(a)*38,y=JT+58+Math.sin(a)*20;glow(c,x,y,10,CYAN,.6);circle(c,x,y,3.5,'#d9fbff',null);}
  c.restore();
  const base=[JX,JB-22];
  SEED.forEach(([dx,,lean],i)=>{const sw=.08*Math.sin(t*1.6+i),tip=[base[0]+dx+lean*50+sw*40,base[1]-52+Math.abs(dx)*1.2];
    K.sline(c,[[base[0]+dx*.3,base[1]],[mix(base[0],tip[0],.5)+lean*6,mix(base[1],tip[1],.55)],tip],GREEN,3.5);});
  // glass
  D.round(c,x0,top,w,JB-top,[18,18,26,26],null,rgba(WHITE,.8));
  D.round(c,JX-28,JT,56,22,6,'#7a5235','#a87a4f');
  K.sline(c,[[x0+14,top+18],[x0+14,JB-26]],rgba(WHITE,.35),4);
}
function bottom(c,t,a,k){
  withA(c,a,()=>{
    jar(c,t);
    const sx=384,sy=490;sun(c,sx,sy,13,t);
    const u=mod(t*.5);K.arrow(c,sx+20,sy+8,JX-58,JT+38,YELLOW,4);
    for(let q=0;q<2;q++){const v=mod(u+q/2),p=K.lerpP([sx+20,sy+8],[JX-58,JT+38],v);withA(c,Math.sin(v*Math.PI),()=>{glow(c,p[0],p[1],10,YELLOW,.7);circle(c,p[0],p[1],3.5,'#fff7c2',null);});}
    tag(c,L('light','光能','Light energy'),sx-26,sy-20,{al:'right',col:YELLOW,active:true,minX:150});
    K.wrap(c,X.jarNeedsLight,JX+70,JT+30,330,22,WHITE,28);
  });
}

// ── frame ──────────────────────────────────────────────────────────────────
const LA=[1,DIM,1],RA=[DIM,1,1],EA=[0,0,1];
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
  const u=st.from>=0?smooth(clamp((t-st.T)/MOVE)):1,f=st.from>=0?st.from:k,ab=arr=>mix(arr[f],arr[k],u);
  K.sline(c,[[CW/2,10],[CW/2,452]],rgba(MUTED,.45),2);
  layer(c,ab(LA),cc=>leftHalf(cc||c,t,k!==1),0);
  layer(c,ab(RA),cc=>rightHalf(cc||c,t,k!==0),1);
  bottom(c,t,ab(EA),k);
  progress(c,k,t);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-16,588,22,MUTED,'right');
}
window.EcologyDraw.compare=draw;
})();

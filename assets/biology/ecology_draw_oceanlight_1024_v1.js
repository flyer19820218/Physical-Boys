/* Ecology lesson 4 · "oceanlight" canvas (coasts-ocean tab, view 2), 2026-10-24. Light in the ocean.
 * Layout: on the left a narrow full-depth water column (top "Shallow", bottom "Deep", no numbers) with a yellow window that shows
 * which part is enlarged; on the right the big panel PANEL is the enlarged view of that part (a camera on the same world, depth
 * d = 0 surface .. 1 sea floor; the camera glides down between steps).
 * Light: brightness falls from the surface; z1 = where light is no longer enough for photosynthesis (dashed yellow line),
 * z2 = where sunlight ends. Option s.clear (0 cloudier / 1 clearer) is read every frame and eased fast (about 0.25 s):
 * cloudier = z1 and z2 shallower, greener water, many suspended specks; the line moves at once, flashes, and an arrow shows the way.
 * Pictures: EC10_clownfish_anemone (1111x1091, sits on a drawn shallow reef ledge), animals_ai_1023/jellyfish (928x825),
 * HB9_giant_isopod (1400x677, faces left), HB11_vent (1672x933) cropped to x 0-1440, y 70-864 (the Gemini mark at x 1530, y 740
 * is outside the crop). HB11 points (picture pixels): vent top (840,242), main tube-worm cluster (600,640).
 * Four steps, 9 s each; s.shown = step. World, camera and light stay; step labels cross-fade (0.45 s).
 *  0 sunlight enters: sun, rays and yellow light fading with depth; phytoplankton dots (bright only above z1), clownfish and anemone;
 *    "Lit: photosynthesis possible", "Light depth is not a fixed number".
 *  1 less and less light: camera lower; band between z1 and z2 "Too dark for photosynthesis"; a jellyfish pulses
 *    ("Schematic: not only found at this depth"); below z2 "No sunlight" when it is in view.
 *  2 the dark deep: white particles drift down the whole column and the panel ("Sinking organic particles"); the giant isopod
 *    walks to a carcass ("Scavenger, consumer", never decomposer); "No sunlight does not mean no life".
 *  3 supplement: HB11 fades over the panel; orange dots rise from the vent ("Chemical energy"); "Hydrothermal vent", "Tube worms";
 *    "Some organisms use chemical energy, not sunlight".
 * No depths, light values or temperatures anywhere. Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const SHALLOW=P('淺','Shallow'),DEEP=P('深','Deep');
const CLOWN=P('小丑魚與海葵','Clownfish and sea anemone');
const REMAINS=P('殘骸','Remains');
const NO_SUN_LIFE=P('沒有日光，不等於沒有生命','No sunlight does not mean no life');
const CHEM_NOTE=P('有些生物利用化學能，不是日光','Some organisms use chemical energy, not sunlight');
const N=4,PER=9,CW=960,OUT=.45;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,SAND=C.sand;
const FILL='rgba(11,26,21,.92)',PANEL_BG='#16332b',MURK='#c9b27a';
if(!K.SIZE['animals_ai_1023/jellyfish.png'])K.SIZE['animals_ai_1023/jellyfish.png']=[928,825];

// ── helpers (same look as the oxygen / estuary views) ─────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7),r=Math.min(p.h/2,20);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,r+6*u,null,rgba(col,.8*(1-u)));}
function pointer(c,a,b,col,t,ring=true){const mx=(a[0]+b[0])/2+(b[1]-a[1])*.18,my=(a[1]+b[1])/2-(b[0]-a[0])*.18;
  c.save();c.lineCap='round';c.beginPath();c.moveTo(...a);c.quadraticCurveTo(mx,my,b[0],b[1]);
  c.strokeStyle='rgba(11,26,21,.75)';c.lineWidth=6;c.stroke();c.strokeStyle=col;c.lineWidth=3;c.setLineDash([9,5]);c.lineDashOffset=-t*10;c.stroke();c.restore();
  circle(c,b[0],b[1],8,null,'rgba(11,26,21,.75)',5);circle(c,b[0],b[1],8,null,col,2.5);
  if(ring){const u=mod(t*.8);circle(c,b[0],b[1],9+u*12,null,rgba(col,.8*(1-u)),2);}}
function dashH(c,x0,x1,y,col,t,w=3){c.save();c.setLineDash([12,8]);c.lineDashOffset=-t*16;K.line(c,[[x0,y],[x1,y]],'rgba(11,26,21,.7)',w+3);K.line(c,[[x0,y],[x1,y]],col,w);c.restore();}
const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};

// ── layout ────────────────────────────────────────────────────────────────
const PN={x:132,y:58,w:816,h:450},PB=PN.y+PN.h,HV=.40,SCL=PN.h/HV;          // panel; HV = depth shown in the panel
const COL={x:44,y:96,w:68,h:412},DMAX=1.05,FLOOR=1;                        // full-depth column
const CAM=[-.07,.22,.66,.66];
const cy=d=>COL.y+clamp(d/DMAX)*COL.h;
const VK=PN.w/1440,VCROP=[0,70/933,1440/1672,794/933];
const VM=([x,y])=>[PN.x+x*VK,PN.y+(y-70)*VK];
const VENT=VM([840,242]),TUBES=VM([600,640]);
const ANEM={x:238,d:.137,w:140},JELLY={x:450,d:.40,w:150},ISO={x:566,w:230},CARC={x:410};
const LEDGE=[[132,.132],[172,.126],[232,.129],[300,.136],[348,.15],[372,.176],[358,.2],[300,.214],[220,.222],[132,.228]];
const DARK=hex('#0a1824'),LIT_CLEAR=hex('#2a8cb4'),LIT_MURK=hex('#5a8a60'),YEL=hex(YELLOW);
const SKY0='#24505c',SKY1='#3d7787';
const PRELOAD=['EC10_clownfish_anemone.png','animals_ai_1023/jellyfish.png','HB9_giant_isopod.png','HB11_vent.jpg'];
const rnd=K.rng(1101);
const PHY=Array.from({length:48},(_,i)=>i===0?{x:700,d:.09,o:0,n:3,r:3.6}:{x:mix(400,936,rnd()),d:mix(.012,.29,rnd()),o:rnd()*6.28,n:1+Math.floor(rnd()*3),r:2.6+1.6*rnd()});
const MUD=Array.from({length:90},()=>({x:mix(PN.x+6,PN.x+PN.w-6,rnd()),d:mix(.005,.64,rnd()),o:rnd()*6.28,r:1.4+1.6*rnd()}));
const SNOW=Array.from({length:46},()=>({x:rnd(),o:rnd(),v:.045+.03*rnd(),r:2+2*rnd(),ph:rnd()*6.28}));
const CSNOW=Array.from({length:16},()=>({x:rnd(),o:rnd(),v:.06+.04*rnd()}));
const RAYS=[0,1,2,3,4,5].map(i=>({x:PN.x+150+i*130,w:26+10*(i%3),ph:i*1.7}));
const FLOORB=Array.from({length:30},()=>({x:mix(PN.x,PN.x+PN.w,rnd()),r:6+rnd()*14,c:['#3a4246','#2f383c','#465055'][Math.floor(rnd()*3)]}));
const CHEM=Array.from({length:18},()=>({o:rnd(),dx:(rnd()-.5)*70,r:2.5+2.5*rnd()}));

// ── light ─────────────────────────────────────────────────────────────────
// brightness 0..1 at depth d (no units): bright above z1, fading to nothing at z2
function bright(d,z1,z2){if(d<=0)return 1;if(d<z1)return 1-.68*Math.pow(d/z1,.85);if(d<z2){const u=(d-z1)/(z2-z1);return .32*Math.pow(1-u,2);}return 0;}
function waterRGB(d,W){const b=bright(d,W.z1,W.z2),lit=LIT_MURK.map((q,i)=>mix(q,LIT_CLEAR[i],W.cl)),k=Math.min(1,b*1.15);
  return DARK.map((q,i)=>{const v=mix(q,lit[i],k);return Math.round(mix(v,YEL[i],.22*b*b));});}
function waterGrad(c,y0,y1,d0,d1,W){const g=c.createLinearGradient(0,y0,0,y1);
  for(let i=0;i<=30;i++){const d=Math.max(0,mix(d0,d1,i/30));g.addColorStop(i/30,`rgb(${waterRGB(d,W).join(',')})`);}return g;}
const surfY=(x,t,y0)=>y0+3*Math.sin(x*.035+t*1.8)+1.6*Math.sin(x*.08-t*1.2);

// ── pieces ────────────────────────────────────────────────────────────────
function sun(c,x,y,r,t){glow(c,x,y,r*2.6,YELLOW,.35);
  for(let i=0;i<10;i++){const g=i/10*Math.PI*2+t*.35,l=r*(1.35+.12*Math.sin(t*3+i));K.sline(c,[[x+Math.cos(g)*r*1.15,y+Math.sin(g)*r*1.15],[x+Math.cos(g)*l,y+Math.sin(g)*l]],YELLOW,4);}
  circle(c,x,y,r,YELLOW,C.ink,2.5);}
function column(c,W,t,cam,aSnow,aVent){
  c.save();c.beginPath();c.roundRect(COL.x,COL.y,COL.w,COL.h,10);c.clip();
  c.fillStyle=waterGrad(c,COL.y,COL.y+COL.h,0,DMAX,W);c.fillRect(COL.x,COL.y,COL.w,COL.h);
  // sea floor
  c.fillStyle='#39434a';c.fillRect(COL.x,cy(FLOOR),COL.w,COL.y+COL.h-cy(FLOOR));
  // suspended specks (cloudier)
  for(let i=0;i<24;i++){const d=mod(i*.137,.6),x=COL.x+6+mod(i*29.3,COL.w-12);circle(c,x+2*Math.sin(t+i),cy(d),1.6,rgba(MURK,.7*(1-W.cl)*(.3+.7*bright(d,W.z1,W.z2))));}
  // sinking particles (step 2)
  withA(c,aSnow,()=>{for(const s of CSNOW){const d=mod(s.o+t*s.v,FLOOR);circle(c,COL.x+6+s.x*(COL.w-12),cy(d),2.2,rgba(WHITE,.9*clamp((FLOOR-d)/.05)));}});
  // vent glow at the floor (step 3)
  withA(c,aVent,()=>{glow(c,COL.x+COL.w/2,cy(FLOOR)-4,26+4*Math.sin(t*3),ORANGE,.8);});
  c.restore();
  // surface wave on top
  K.sline(c,[[COL.x+4,COL.y+2],[COL.x+COL.w-4,COL.y+2]],rgba(WHITE,.8),3);
  // light lines
  const flash=W.flash;
  if(flash>0)glow(c,COL.x+COL.w/2,cy(W.z1),40,YELLOW,.6*flash);
  dashH(c,COL.x,COL.x+COL.w,cy(W.z1),YELLOW,t,3);
  c.save();c.setLineDash([4,6]);K.line(c,[[COL.x,cy(W.z2)],[COL.x+COL.w,cy(W.z2)]],rgba(WHITE,.55),2);c.restore();
  D.round(c,COL.x,COL.y,COL.w,COL.h,10,null,C.edge);
  // window = enlarged part
  const w0=cy(Math.max(0,cam)),w1=cy(Math.min(DMAX,cam+HV));
  c.save();c.setLineDash([6,5]);K.line(c,[[COL.x+COL.w,w0],[PN.x,PN.y]],rgba(YELLOW,.7),2);K.line(c,[[COL.x+COL.w,w1],[PN.x,PB]],rgba(YELLOW,.7),2);c.restore();
  D.round(c,COL.x-4,w0-2,COL.w+8,w1-w0+4,8,null,'rgba(11,26,21,.8)');
  D.round(c,COL.x-4,w0-2,COL.w+8,w1-w0+4,8,null,YELLOW);
  // depth words and arrow (no numbers), drawn last so nothing covers them
  text(c,SHALLOW,COL.x+COL.w/2-4,COL.y-12,22,CYAN,'center');
  text(c,DEEP,COL.x+COL.w/2-4,COL.y+COL.h+30,22,'#7fb2f0','center');
  K.arrow(c,24,COL.y+8,24,COL.y+COL.h-6,rgba(WHITE,.75),4);
}
function ledge(c,py){c.save();c.beginPath();LEDGE.forEach(([x,d],i)=>i?c.lineTo(x,py(d)):c.moveTo(x,py(d)));c.closePath();
  c.fillStyle='#4d4b45';c.fill();c.strokeStyle=C.ink;c.lineWidth=2.5;c.stroke();
  for(let i=0;i<9;i++){const x=150+i*24,d=.16+.05*((i*7)%5)/5;K.ellipse(c,x,py(d),9,5,'rgba(120,112,96,.6)',null);}
  c.restore();}
function carcass(c,x,y,a){withA(c,a,()=>{c.save();c.translate(x,y);
  K.ellipse(c,0,0,62,16,'rgba(150,140,120,.35)',null);
  K.sline(c,[[-58,-2],[44,-2]],'#cfc6b0',4);
  for(let i=0;i<7;i++){const xx=-36+i*12;c.beginPath();c.moveTo(xx,-2);c.quadraticCurveTo(xx+5,-16,xx+2,-20);c.moveTo(xx,-2);c.quadraticCurveTo(xx+5,12,xx+2,16);c.strokeStyle='#cfc6b0';c.lineWidth=2.5;c.stroke();}
  circle(c,-64,-2,13,'rgba(207,198,176,.85)',C.ink,2);circle(c,-68,-5,3.5,'#2f383c');
  c.beginPath();c.moveTo(44,-2);c.lineTo(66,-16);c.lineTo(62,-2);c.lineTo(66,12);c.closePath();c.fillStyle='rgba(207,198,176,.85)';c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();
  c.restore();});}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  PRELOAD.forEach(f=>K.pic(K.src(f)));
  const st=s.olSt||(s.olSt={});
  const CL=(s.clear|0)===1?1:0;
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t-ck;st.from=-1;}
  const tau=t-st.T;
  const D0=st.from>=0?OUT:0;
  const A=(s0,d,s1)=>{const now=vis(k,tau-D0,s0,d,s1);if(st.from<0||tau>=OUT)return now;return Math.max(now,vis(st.from,9,s0,0,s1)*(1-smooth(tau/OUT)));};
  // eased state: clearness, camera, vent picture
  const dt=t-(st.lt??t);st.lt=t;
  const tV=k===3?1:0;
  if(st.cl===undefined||dt<0||dt>.6){st.cl=CL;st.cam=CAM[k];st.v=tV;st.C=CL;st.fl=-9;}
  else{const e=r=>1-Math.exp(-dt*r);st.cl+=(CL-st.cl)*e(12);st.cam+=(CAM[k]-st.cam)*e(3.2);st.v+=(tV-st.v)*e(tV?3:8);}
  if(st.C!==CL){st.C=CL;st.fl=t;st.dir=CL?1:-1;}
  const cl=st.cl,cam=st.cam,flash=clamp(1-(t-st.fl)/1.4);
  const W={cl,z1:mix(.16,.30,cl),z2:mix(.52,.62,cl),flash};
  const py=d=>PN.y+(d-cam)*SCL;
  const a0=A(0,0,0),a1=A(1,0,1),a2=A(2,0,2),a3=A(3,0,3);

  // ── column (left) ──
  column(c,W,t,cam,a2,a3);

  // ── panel (right): the enlarged part ──
  c.save();c.beginPath();c.roundRect(PN.x,PN.y,PN.w,PN.h,14);c.clip();
  c.fillStyle=PANEL_BG;c.fillRect(PN.x,PN.y,PN.w,PN.h);
  const y0=py(0);
  // sky
  if(y0>PN.y){const g=c.createLinearGradient(0,PN.y,0,y0);g.addColorStop(0,SKY0);g.addColorStop(1,SKY1);c.fillStyle=g;c.fillRect(PN.x,PN.y,PN.w,y0-PN.y+4);
    sun(c,880,y0-40,20,t);}
  // water
  const top=Math.max(PN.y,y0-6);
  c.beginPath();c.moveTo(PN.x,PB);for(let x=PN.x;x<=PN.x+PN.w;x+=6)c.lineTo(x,Math.max(top,surfY(x,t,y0)));c.lineTo(PN.x+PN.w,PB);c.closePath();
  c.fillStyle=waterGrad(c,PN.y,PB,cam,cam+HV,W);c.fill();
  // sun rays fading with the light
  const rayB=py(W.z2);
  if(rayB>PN.y+4&&y0<PB){
    const rg=c.createLinearGradient(0,y0,0,rayB);for(let i=0;i<=12;i++){const d=mix(0,W.z2,i/12);rg.addColorStop(i/12,rgba(YELLOW,.26*bright(d,W.z1,W.z2)));}
    for(const r of RAYS){const sw=14*Math.sin(t*.45+r.ph),len=rayB-y0;c.beginPath();c.moveTo(r.x+sw,y0);c.lineTo(r.x+sw+r.w,y0);c.lineTo(r.x+sw+r.w*2.4-len*.22,rayB);c.lineTo(r.x+sw-len*.22,rayB);c.closePath();c.fillStyle=rg;c.fill();}}
  // suspended specks: many when cloudier
  for(const m of MUD){const y=py(m.d)+4*Math.sin(t*.6+m.o);if(y<PN.y-4||y>PB+4||y<y0+4)continue;
    circle(c,m.x+5*Math.sin(t*.4+m.o),y,m.r,rgba(MURK,.8*(1-cl)*(.35+.65*bright(m.d,W.z1,W.z2))));}
  // phytoplankton (schematic): bright where there is enough light
  for(const p of PHY){const y=py(p.d)+3*Math.sin(t*.8+p.o);if(y<PN.y-6||y>PB+6||y<y0+6)continue;
    const lit=p.d<W.z1?1:.22,x=p.x+6*Math.sin(t*.35+p.o);
    for(let j=0;j<p.n;j++){const xx=x+j*p.r*1.9,yy=y+j*1.2;circle(c,xx,yy,p.r,rgba(GREEN,.95*lit),rgba('#1f6b3a',.9*lit),1.2);circle(c,xx-p.r*.3,yy-p.r*.3,p.r*.35,rgba(WHITE,.8*lit));}}
  // reef ledge with clownfish and anemone
  if(py(.228)>PN.y+40){ledge(c,py);
    const h=ANEM.w*1091/1111,by=py(ANEM.d)+6;c.save();c.translate(ANEM.x,by);c.rotate(.025*Math.sin(t*1.1));K.drawIn(c,'EC10_clownfish_anemone.png',{x:-ANEM.w/2,y:-h,w:ANEM.w,h});c.restore();}
  // jellyfish
  {const jy=py(JELLY.d);if(jy>PN.y-100&&jy<PB+100){const ph=t*2.2,sq=Math.sin(ph),h=JELLY.w*825/928,bob=-6*Math.sin(ph-1);
    c.save();c.translate(JELLY.x+16*Math.sin(t*.3),jy+bob);c.scale(1+.04*sq,1-.05*sq);K.drawIn(c,'animals_ai_1023/jellyfish.png',{x:-JELLY.w/2,y:-h/2,w:JELLY.w,h},{alpha:.95});c.restore();}}
  // sinking particles (step 2) in the panel
  withA(c,a2,()=>{for(const sn of SNOW){const d=mod(sn.o+t*sn.v,1)*(FLOOR-cam+.02)+cam-.02,y=py(d),x=PN.x+20+sn.x*(PN.w-40)+8*Math.sin(t*.7+sn.ph);
    if(y<PN.y-4||y>PB)continue;circle(c,x,y,sn.r,rgba(WHITE,.9*clamp((py(FLOOR)-y)/20)),rgba('#9fb3c0',.6),1);}});
  // sea floor, carcass, isopod
  {const fy=py(FLOOR);if(fy<PB+10){
    c.beginPath();c.moveTo(PN.x,fy+6);for(let x=PN.x;x<=PN.x+PN.w;x+=12)c.lineTo(x,fy+4*Math.sin(x*.03)+3*Math.sin(x*.011+2));c.lineTo(PN.x+PN.w,PB+4);c.lineTo(PN.x,PB+4);c.closePath();c.fillStyle='#2c363b';c.fill();
    for(const b of FLOORB)K.ellipse(c,b.x,fy+10+b.r*.6,b.r,b.r*.45,b.c,'rgba(11,26,21,.6)',1.2);
    carcass(c,CARC.x,fy-10,1);
    const [W0,H0]=K.dim('HB9_giant_isopod.png'),ih=ISO.w*H0/W0,walk=4*Math.sin(t*.5),lift=2*Math.abs(Math.sin(t*2.6));
    K.ellipse(c,ISO.x+walk,fy+2,ISO.w*.42,8,'rgba(5,10,14,.55)');
    K.drawIn(c,'HB9_giant_isopod.png',{x:ISO.x+walk-ISO.w/2,y:fy+4-ih-lift,w:ISO.w,h:ih});}}
  // vent picture (step 3)
  if(st.v>.002){K.drawIn(c,'HB11_vent.jpg',PN,{crop:VCROP,alpha:st.v});
    withA(c,st.v*a3,()=>{for(const q of CHEM){const u=mod(t/2.6+q.o),x=VENT[0]+q.dx*u+6*Math.sin(t*2+q.o*9),y=VENT[1]-4-u*96;circle(c,x,y,q.r*(1-.4*u),rgba(ORANGE,.9*Math.sin(Math.PI*u)),rgba(YELLOW,.8*Math.sin(Math.PI*u)),1.2);}
      glow(c,VENT[0],VENT[1],34+5*Math.sin(t*3),ORANGE,.55);});}
  // light-limit line in the panel
  {const y=py(W.z1);if(y>y0+4&&y>PN.y&&y<PB){if(flash>0)glow(c,PN.x+PN.w*.55,y,120,YELLOW,.45*flash);dashH(c,PN.x,PN.x+PN.w,y,YELLOW,t,3.5);
    if(flash>0){const dir=st.dir,u=mod(t*1.6),ay=y+dir*(10+18*u);withA(c,flash,()=>{K.arrow(c,620,ay-dir*22,620,ay,YELLOW,5);K.arrow(c,700,ay-dir*22,700,ay,YELLOW,5);});}}
   const y2=py(W.z2);if(y2>PN.y&&y2<PB&&st.v<.5){c.save();c.setLineDash([5,7]);K.line(c,[[PN.x,y2],[PN.x+PN.w,y2]],rgba(WHITE,.5),2.5);c.restore();}}
  c.restore();
  D.round(c,PN.x,PN.y,PN.w,PN.h,14,null,C.edge);

  // ── chip: clearer / cloudier (all steps) ──
  {const col=cl>.5?CYAN:MURK,p=tag(c,cl>.5?L('clearer','較清澈','Clearer'):L('cloudier','較混濁','Cloudier'),CW-8,8,{al:'right',col,active:true,size:24});
    if(flash>0)withA(c,flash,()=>pulseRing(c,p,t,col));}

  // ── step 0: sunlight enters ──
  withA(c,A(0,.4,0),()=>{const y=py(W.z1),p=tag(c,L('sunlit','有光：可以光合作用','Lit: photosynthesis possible'),PN.x+PN.w-12,Math.max(y0+16,y-52),{al:'right',col:YELLOW,active:true,size:24,minX:PN.x+6});
    if(tau>1.2)pulseRing(c,p,t,YELLOW);});
  withA(c,A(0,1.2,0),()=>{const q=PHY[0],pp=tag(c,L('phytoplankton','浮游藻類','Phytoplankton'),PN.x+440,y0+16,{col:GREEN,minX:PN.x+6});
    pointer(c,[pp.x+pp.w*.7,pp.y+pp.h+2],[q.x+6*Math.sin(t*.35+q.o)+4,py(q.d)+3*Math.sin(t*.8+q.o)],GREEN,t,false);});
  withA(c,A(0,2,0),()=>{tag(c,CLOWN,PN.x+8,py(.228)+8,{col:ORANGE,minX:PN.x+6});});
  withA(c,A(0,3,0),()=>{const p=tag(c,L('lightDepthNotFixed','透光深度不是固定的數字','Light depth is not a fixed number'),PN.x+PN.w/2,PB+10,{al:'center',col:YELLOW,active:true});if(tau>3.6)pulseRing(c,p,t,YELLOW);});

  // ── step 1: less and less light ──
  {const bt=Math.max(PN.y,py(W.z1)),bb=Math.min(PB,py(W.z2)),y1=py(W.z1),y2=py(W.z2);
    withA(c,A(1,.3,1)*clamp((y1-PN.y-56)/24),()=>{tag(c,L('sunlit','有光：可以光合作用','Lit: photosynthesis possible'),PN.x+PN.w-12,y1-48,{al:'right',col:YELLOW,minX:PN.x+6});});
    withA(c,A(1,.8,1),()=>{const p=tag(c,L('tooDark','光太少：不能光合作用','Too dark for photosynthesis'),PN.x+PN.w-12,(bt+bb)/2-20,{al:'right',col:WHITE,active:true,size:24,minX:PN.x+6});if(tau>1.4)pulseRing(c,p,t,WHITE);});
    withA(c,A(1,1.2,1)*clamp((PB-y2-52)/20),()=>{tag(c,L('dark','沒有日光','No sunlight'),PN.x+PN.w-12,y2+10,{al:'right',col:'#7fb2f0',minX:PN.x+6});});}
  withA(c,A(1,1.8,1),()=>{const jy=py(JELLY.d);tag(c,L('jellyfish','水母','Jellyfish'),JELLY.x,jy+80,{al:'center',col:CYAN,minX:PN.x+6});
    tag(c,L('notOnlyHere','示意：不代表只住在這個深度','Schematic: not only found at this depth'),JELLY.x,jy+130,{al:'center',col:WHITE,minX:PN.x+6});});

  // ── step 2: the dark deep ──
  withA(c,A(2,.6,2),()=>{tag(c,L('dark','沒有日光','No sunlight'),PN.x+12,PN.y+14,{col:'#7fb2f0',active:true,size:24});});
  withA(c,A(2,1.4,2),()=>{const p=tag(c,L('sinking','沉下來的有機碎屑','Sinking organic particles'),PN.x+PN.w-12,PN.y+14,{al:'right',col:WHITE,minX:PN.x+6});
    const u=mod(t*.22),tx=p.x+p.w*.5+30*Math.sin(u*6),ty=p.y+p.h+30+u*120;circle(c,tx,ty,3.5,WHITE,rgba('#9fb3c0',.8),1);pointer(c,[p.x+p.w*.5,p.y+p.h+2],[tx,ty-6],WHITE,t,false);});
  {const fy=py(FLOOR);
    withA(c,A(2,2.2,2),()=>{tag(c,L('isopod','大王具足蟲','Giant isopod'),ISO.x,fy-206,{al:'center',col:WHITE});
      const p=tag(c,L('scavenger','清除者、消費者','Scavenger, consumer'),ISO.x,fy-158,{al:'center',col:ORANGE,active:true});if(tau>2.8)pulseRing(c,p,t,ORANGE);});
    withA(c,A(2,2.8,2),()=>{tag(c,REMAINS,CARC.x-20,fy+22,{al:'center',col:SAND});});}
  withA(c,A(2,4,2),()=>{const p=tag(c,NO_SUN_LIFE,PN.x+PN.w/2,PB+10,{al:'center',col:YELLOW,active:true,size:24});if(tau>4.6)pulseRing(c,p,t,YELLOW);});

  // ── step 3: supplement, vents ──
  withA(c,A(3,.2,3),()=>{tag(c,L('supplement','補充','Supplement'),PN.x,8,{col:GREEN,active:true,size:24});});
  withA(c,A(3,1,3),()=>{const p=tag(c,L('vent','熱泉','Hydrothermal vent'),PN.x+14,PN.y+14,{col:WHITE,active:true,size:24});pointer(c,[p.x+p.w,p.y+p.h/2],[VENT[0]-6,VENT[1]+8],WHITE,t);});
  withA(c,A(3,1.8,3),()=>{const p=tag(c,L('chemEnergy','化學能','Chemical energy'),VENT[0]+56,VENT[1]+30,{col:ORANGE,active:true,size:24});if(tau>2.4)pulseRing(c,p,t,ORANGE);
    pointer(c,[p.x+12,p.y+4],[VENT[0]+8,VENT[1]-14],ORANGE,t,false);});
  withA(c,A(3,2.6,3),()=>{const p=tag(c,L('tubeWorm','管蟲','Tube worms'),PN.x+14,PN.y+180,{col:WHITE,minX:PN.x+6});pointer(c,[p.x+p.w*.6,p.y+p.h+2],[TUBES[0]-30,TUBES[1]-36],WHITE,t,false);});
  withA(c,A(3,3.4,3),()=>{text(c,CHEM_NOTE,PN.x+PN.w/2,PB+38,22,WHITE,'center');});

  // ── notes (all steps) ──
  const sch=tag(c,L('schematic','示意','Schematic'),8,556,{col:k===3?YELLOW:MUTED,active:k===3&&tau>.8});
  if(k===3&&tau>1.4)pulseRing(c,sch,t,YELLOW);
  withA(c,1-a3,()=>text(c,L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),sch.x+sch.w+14,590,22,MUTED,'left'));
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.oceanlight=draw;
})();

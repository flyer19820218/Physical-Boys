/* Ecology lesson 4 · "tide" canvas (coasts-ocean tab, view 1), 2026-10-24. The intertidal zone.
 * Main scene (drawn by program): a side cut of one sloping shore. Land high on the left, the slope runs down to the sea on the right.
 * On the slope: a small pool held behind a low rim (u .515-.678, it keeps water after the sea goes down) and a crab burrow
 * (mouth at u .40, drawn as a cut-away tunnel). Sea water (see-through #38bdf8) fills everything below a wavy surface line whose
 * height is set by the level L (0 = low-tide line .. 1 = high-tide line). No heights, salinities or temperatures are given anywhere.
 * Pictures: HB6_mangrove (mudflat) and HB10_rocky_shore (rocky shore) as small framed thumbnails in step 0 next to a drawn sandy beach;
 * HB8_fiddler_crab (1359x1197, its pale mud rim is darkened by a gradient on an offscreen copy, plus a shadow) and
 * HB7_mudskipper (1400x678, faces right) in step 2.
 * Three steps; s.shown = step. Play all runs 0 (10 s), 1 (9 s), 2 (13 s); a held step keeps moving (waves, sun rays, tide cycle).
 *  0 two lines: the water rises and falls between the dashed high-tide and low-tide lines; the slope between them glows ("Intertidal zone"
 *    with a bracket); the top pill reads High tide / Low tide as the water moves. Three thumbnails: mudflat (AI), rocky shore (AI),
 *    sandy beach (schematic); "The intertidal zone is not only at estuaries".
 *  1 exposure at low tide: the water goes down to the low-tide line and stays; sun with rays on the bare slope, a thermometer whose
 *    column rises and turns orange (no numbers); the bare sand dries (lighter, wisps rise); the pool turns pale (colour only, schematic)
 *    with salt specks; "Exposure", "Sun", "Drying out", "Pool gets saltier".
 *  2 coping: the fiddler crab walks to its burrow and goes down inside; the mudskipper stays in the pool ("In the burrow", "In the pool");
 *    then the tide comes back and the water covers both, goes down again, and keeps cycling while held.
 *    Only these two responses are shown. "Covered by water again at high tide".
 * Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const ROCKY=P('岩岸','Rocky shore'),SANDY=P('沙灘','Sandy beach'),AI_SHORT=P('AI 插圖','AI illustration');
const POOL_SALTY=P('水窪變鹹','Pool gets saltier');
const PROBLEMS=P('平常泡在水裡的生物要面對的難題','Problems for organisms usually under water');
const COVERED=P('漲潮時又被水淹過','Covered by water again at high tide');
const N=3,CW=960,OUT=.45;
const SEQ=[[0,10],[1,9],[2,13]],TOTAL=SEQ.reduce((a,q)=>a+q[1],0);
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,SAND=C.sand;
const SEA='#38bdf8',SALT_COL='#e9dfbd';
const FILL='rgba(11,26,21,.92)',PANEL='#16332b';

// ── helpers (same look as the estuary / pondstream / oxygen views) ─────────
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
const fin=(tau,t0,d=.6)=>ease((tau-t0)/d);
const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
const mixHex=(a,b,u)=>{const A=hex(a),B=hex(b);return'#'+A.map((q,i)=>Math.round(mix(q,B[i],clamp(u))).toString(16).padStart(2,'0')).join('');};
function sun(c,x,y,r,t,a){withA(c,a,()=>{glow(c,x,y,r*2.4,YELLOW,.35);
  for(let i=0;i<10;i++){const g=i/10*Math.PI*2+t*.4,l=r*(1.35+.12*Math.sin(t*3+i));K.sline(c,[[x+Math.cos(g)*r*1.15,y+Math.sin(g)*r*1.15],[x+Math.cos(g)*l,y+Math.sin(g)*l]],YELLOW,4);}
  circle(c,x,y,r,YELLOW,C.ink,2.5);});}
function thermo(c,x,top,bot,lv,col){
  D.round(c,x-12,top,24,bot-top,12,PANEL,WHITE);circle(c,x,bot+12,18,PANEL,WHITE,3);
  const y=mix(bot-6,top+12,lv);D.round(c,x-5.5,y,11,bot+8-y,5.5,col);circle(c,x,bot+12,12,col);
  for(let i=0;i<6;i++){const yy=mix(bot-10,top+14,i/5);K.sline(c,[[x+15,yy],[x+24,yy]],rgba(WHITE,.7),2);}}

// ── shore geometry (fractions of the scene rect R; u across, v down) ───────
const RA={x:12,y:60,w:936,h:252},RB={x:12,y:60,w:936,h:456};           // step 0 (with thumbnails below) / steps 1-2
const G=[[0,.34],[.12,.36],[.30,.50],[.44,.60],[.50,.645],[.535,.715],[.60,.73],[.655,.705],[.685,.665],[.72,.69],[.86,.85],[1,.88]];
const VH=.46,VL=.80,UH=.249,UL=.816,PV=.675,PU0=.515,PU1=.678,BU=.40;    // tide lines, where they meet the slope, pool, burrow
function gv(u){if(u<=G[0][0])return G[0][1];for(let i=1;i<G.length;i++)if(u<=G[i][0]){const a=G[i-1],b=G[i],w=(u-a[0])/(b[0]-a[0]);return mix(a[1],b[1],(1-Math.cos(Math.PI*w))/2);}return G[G.length-1][1];}
const X=(R,u)=>R.x+u*R.w,Y=(R,v)=>R.y+v*R.h;
const gy=(R,x)=>Y(R,gv((x-R.x)/R.w));
const surfY=(R,Lv,x,t)=>mix(Y(R,VL),Y(R,VH),Lv)+2.2*Math.sin(x*.045+t*2)+1.2*Math.sin(x*.11-t*1.4);
// burrow (cut-away tunnel) in R
function burrow(R){const xm=X(R,BU),ym=gy(R,xm),hw=40*R.h/456,dp=118*R.h/456;
  return{xm,ym,xl:xm-hw,xr:xm+hw,yl:gy(R,xm-hw),yr:gy(R,xm+hw),bot:ym+dp,hw};}
function tunnelPath(c,b){c.moveTo(b.xr,b.yr);c.lineTo(b.xr-4,b.bot-24);c.quadraticCurveTo(b.xr-8,b.bot,b.xm-2,b.bot+2);c.quadraticCurveTo(b.xl-10,b.bot,b.xl-8,b.bot-26);c.lineTo(b.xl,b.yl);}
// region above the ground (notch = include the tunnel)
function abovePath(c,R,notch){const b=burrow(R);c.beginPath();c.moveTo(R.x-2,R.y-2);c.lineTo(R.x+R.w+2,R.y-2);
  let cut=false;
  for(let x=R.x+R.w+2;x>=R.x-2;x-=4){
    if(notch&&!cut&&x<=b.xr){c.lineTo(b.xr,b.yr);tunnelPath(c,b);cut=true;x=b.xl;continue;}
    c.lineTo(x,gy(R,x));}
  c.lineTo(R.x-2,gy(R,R.x));c.closePath();}
function groundPath(c,R){c.beginPath();c.moveTo(R.x-2,R.y+R.h+2);for(let x=R.x-2;x<=R.x+R.w+2;x+=4)c.lineTo(x,gy(R,x));c.lineTo(R.x+R.w+2,R.y+R.h+2);c.closePath();}
const rnd=K.rng(1062);
const SPECK=Array.from({length:70},()=>({u:rnd(),d:rnd(),r:1.4+rnd()*2.2}));
const WISP=Array.from({length:10},()=>({u:UH+.04+rnd()*(UL-UH-.16),o:rnd()}));
const SALT=Array.from({length:14},()=>({u:PU0+.01+rnd()*(PU1-PU0-.02),o:rnd(),dy:rnd()}));
const PRELOAD=['HB6_mangrove.jpg','HB10_rocky_shore.jpg','HB7_mudskipper.png','HB8_fiddler_crab.png'];

// ── the crab with its pale mud rim pressed down (offscreen copy, made once) ─
let crabCv=null;
function crabPic(){if(crabCv)return crabCv;const im=K.pic(K.src('HB8_fiddler_crab.png'));if(!im)return null;
  const w=680,h=Math.round(w*1197/1359),cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  g.drawImage(im,0,0,w,h);g.globalCompositeOperation='source-atop';
  const gr=g.createLinearGradient(0,h*.6,0,h);gr.addColorStop(0,'rgba(11,26,21,0)');gr.addColorStop(.35,'rgba(30,24,18,.35)');gr.addColorStop(1,'rgba(11,26,21,.72)');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  const rg=g.createRadialGradient(w/2,h*.55,h*.2,w/2,h*.55,w*.62);rg.addColorStop(0,'rgba(11,26,21,0)');rg.addColorStop(1,'rgba(11,26,21,.55)');g.fillStyle=rg;g.fillRect(0,h*.6,w,h*.4);
  crabCv=cv;return cv;}
function drawCrab(c,x,foot,w,rot,a){withA(c,a,()=>{const h=w*1197/1359;
  K.ellipse(c,x,foot-2,w*.48,7,'rgba(11,26,21,.55)');
  const cv=crabPic();if(!cv)return;c.save();c.translate(x,foot);c.rotate(rot);c.drawImage(cv,-w/2,-h*.92,w,h);c.restore();});}
function drawSkipper(c,x,foot,w,bob,a){withA(c,a,()=>{const h=w*678/1400;
  K.drawIn(c,'HB7_mudskipper.png',{x:x-w/2,y:foot-h*.86+bob,w,h});});}

// ── the shore scene ───────────────────────────────────────────────────────
// W: {L level, dry 0..1, salty 0..1, band 0..1 (glow between the lines), lines 0..1}
function shore(c,R,t,W,under){
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  const sky=c.createLinearGradient(0,R.y,0,R.y+R.h*.6);sky.addColorStop(0,'#1f4a40');sky.addColorStop(1,PANEL);c.fillStyle=sky;c.fillRect(R.x,R.y,R.w,R.h);
  // ground
  groundPath(c,R);const gg=c.createLinearGradient(0,Y(R,.34),0,R.y+R.h);gg.addColorStop(0,'#6b5a40');gg.addColorStop(1,'#3c3226');c.fillStyle=gg;c.fill();
  c.save();groundPath(c,R);c.clip();
  // wet band (intertidal) darker; drying lightens what is above the water
  // a soft top layer along the slope: wet (darker) in the intertidal zone, drying lightens the part above the water
  const ys=mix(Y(R,VL),Y(R,VH),W.L),th=22*R.h/456,xa=X(R,UH-.05),xb=X(R,UL+.06);
  const layer=(col,yMax)=>{c.save();c.beginPath();c.rect(R.x,R.y,R.w,yMax-R.y);c.clip();
    const hg=c.createLinearGradient(xa,0,xb,0);hg.addColorStop(0,rgba(col,0));hg.addColorStop(.08,col);hg.addColorStop(.92,col);hg.addColorStop(1,rgba(col,0));
    c.beginPath();for(let x=xa;x<=xb;x+=4)x===xa?c.moveTo(x,gy(R,x)-2):c.lineTo(x,gy(R,x)-2);for(let x=xb;x>=xa;x-=4)c.lineTo(x,gy(R,x)+th);c.closePath();c.fillStyle=hg;c.fill();c.restore();};
  layer('#2a221a',R.y+R.h);
  if(W.dry>0){c.save();c.globalAlpha*=W.dry;layer('#b8a57e',ys);c.restore();}
  for(const s of SPECK){const x=R.x+s.u*R.w,y=gy(R,x)+8+s.d*(R.y+R.h-gy(R,x)-8);circle(c,x,y,s.r*R.h/456,'rgba(217,201,160,.28)');}
  c.restore();
  // tunnel
  const b=burrow(R);c.beginPath();tunnelPath(c,b);c.closePath();c.fillStyle='#1d1711';c.fill();c.strokeStyle='rgba(217,201,160,.55)';c.lineWidth=2.5;c.stroke();
  // ground top line
  c.beginPath();for(let x=R.x;x<=R.x+R.w;x+=4){const y=gy(R,x);x===R.x?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=SAND;c.lineWidth=3;c.stroke();
  // intertidal glow on the slope
  if(W.band>0){c.beginPath();for(let u=UH;u<=UL+.001;u+=.005){const x=X(R,u),y=gy(R,x);u===UH?c.moveTo(x,y):c.lineTo(x,y);}
    c.strokeStyle=rgba(YELLOW,(.55+.3*Math.sin(t*3))*W.band);c.lineWidth=7;c.lineCap='round';c.stroke();}
  // drying: cracks and wisps on the bare slope
  if(W.dry>0){withA(c,W.dry,()=>{for(const w of WISP){const x=X(R,w.u),gyx=gy(R,x);if(gyx>ys-6)continue;const u=mod(t*.35+w.o),y=gyx-6-u*46;
      c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+8,y-8,x-8,y-16,x,y-24);c.strokeStyle=rgba(WHITE,.7*Math.sin(Math.PI*u));c.lineWidth=2.5;c.stroke();}});}
  under&&under(c,R,t,W);   // residents (drawn below the water)
  // pool (kept behind the rim when the sea is lower)
  const py=Y(R,PV),seaY=mix(Y(R,VL),Y(R,VH),W.L);
  if(seaY>py-1){c.save();abovePath(c,R,false);c.clip();const pc=mixHex(SEA,SALT_COL,W.salty);
    c.beginPath();c.moveTo(X(R,PU0)-4,py);for(let x=X(R,PU0)-4;x<=X(R,PU1)+4;x+=4)c.lineTo(x,py+1.2*Math.sin(x*.09+t*1.6));c.lineTo(X(R,PU1)+4,R.y+R.h);c.lineTo(X(R,PU0)-4,R.y+R.h);c.closePath();
    c.fillStyle=rgba(pc,.55);c.fill();
    c.beginPath();c.moveTo(X(R,PU0)+2,py);c.lineTo(X(R,PU1)-2,py);c.strokeStyle=rgba(WHITE,.6);c.lineWidth=2;c.stroke();c.restore();
    if(W.salty>0)withA(c,W.salty,()=>{for(const s of SALT){const x=X(R,s.u),a=.5+.5*Math.sin(t*3+s.o*6.28);circle(c,x,py+3+s.dy*8,2.6,rgba(WHITE,.9*a));}
      for(const u of [PU0-.004,PU1+.004]){const x=X(R,u);circle(c,x,gy(R,x)-2,3,rgba(WHITE,.9));}});}
  // sea
  c.save();abovePath(c,R,seaY<b.ym);c.clip();
  c.beginPath();c.moveTo(R.x-2,surfY(R,W.L,R.x-2,t));for(let x=R.x-2;x<=R.x+R.w+2;x+=4)c.lineTo(x,surfY(R,W.L,x,t));c.lineTo(R.x+R.w+2,R.y+R.h+2);c.lineTo(R.x-2,R.y+R.h+2);c.closePath();
  const sg=c.createLinearGradient(0,Y(R,VH),0,R.y+R.h);sg.addColorStop(0,'rgba(56,189,248,.42)');sg.addColorStop(1,'rgba(29,78,137,.62)');c.fillStyle=sg;c.fill();
  c.beginPath();for(let x=R.x-2;x<=R.x+R.w+2;x+=4){const y=surfY(R,W.L,x,t);x===R.x-2?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=rgba(WHITE,.75);c.lineWidth=2.5;c.stroke();
  c.restore();
  // the two tide lines
  if(W.lines>0)withA(c,W.lines,()=>{for(const [v,u,col] of [[VH,UH,WHITE],[VL,UL,CYAN]]){const y=Y(R,v);
    c.save();c.setLineDash([12,8]);c.lineDashOffset=-t*8;K.line(c,[[X(R,u)-24,y],[R.x+R.w-6,y]],'rgba(11,26,21,.7)',6);K.line(c,[[X(R,u)-24,y],[R.x+R.w-6,y]],col,3);c.restore();
    circle(c,X(R,u),y,6,col,C.ink,2);}});
  c.restore();
  D.round(c,R.x,R.y,R.w,R.h,14,null,C.edge);
}
// tide state pill (top row): rising/high -> High tide, falling/low -> Low tide
function statePill(c,Lv,dL,t){const hi=Math.abs(dL)>.02?dL>0:Lv>.5;
  const p=tag(c,hi?L('highTide','漲潮','High tide'):L('lowTide','退潮','Low tide'),8,8,{col:hi?'#7fb2f0':CYAN,active:true,size:24});
  const ax=p.x+p.w+22,u=mod(t*1.1),moving=Math.abs(dL)>.02,y0=p.y+p.h/2+(hi?10:-10)-(hi?1:-1)*(moving?8*u:0);
  withA(c,moving?1-u*.6:.5,()=>K.arrow(c,ax,y0,ax,y0+(hi?-20:20),WHITE,4));}

// ── thumbnails (step 0) ───────────────────────────────────────────────────
const CARDS=[{x:12,file:'HB6_mangrove.jpg',crop:[0,120/933,1,746/933],name:()=>L('mudflat','泥灘','Mudflat'),col:SAND,note:()=>AI_SHORT},
  {x:332,file:'HB10_rocky_shore.jpg',crop:[0,90/933,1,746/933],name:()=>ROCKY,col:'#c4b08a',note:()=>AI_SHORT},
  {x:652,file:null,name:()=>SANDY,col:YELLOW,note:()=>L('schematic','示意','Schematic')}];
const CARD={y:322,w:296,ih:130};
function sandCard(c,r,t){c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,10);c.clip();
  const sky=c.createLinearGradient(0,r.y,0,r.y+r.h);sky.addColorStop(0,'#2d5b6e');sky.addColorStop(1,'#1c3d34');c.fillStyle=sky;c.fillRect(r.x,r.y,r.w,r.h);
  const sandY=x=>r.y+r.h*.45+(x-r.x)/r.w*r.h*.42;
  // sea on the right
  const sl=r.y+r.h*.66+3*Math.sin(t*1.4);c.fillStyle='rgba(42,127,166,.85)';c.fillRect(r.x,sl,r.w,r.h);
  c.beginPath();c.moveTo(r.x,r.y+r.h);for(let x=r.x;x<=r.x+r.w;x+=4)c.lineTo(x,sandY(x));c.lineTo(r.x+r.w,r.y+r.h);c.closePath();c.fillStyle='#d9c9a0';c.fill();
  c.save();c.beginPath();c.rect(r.x,sl,r.w,r.h);c.clip();c.beginPath();c.moveTo(r.x,r.y+r.h);for(let x=r.x;x<=r.x+r.w;x+=4)c.lineTo(x,sandY(x));c.lineTo(r.x+r.w,r.y+r.h);c.closePath();c.fillStyle='rgba(42,127,166,.55)';c.fill();c.restore();
  // foam where the water meets the sand
  const xs=r.x+(sl-r.y-r.h*.45)/(r.h*.42)*r.w;for(let i=0;i<3;i++){const u=mod(t*.4+i/3),x=xs-6-u*26;K.sline(c,[[x,sandY(x)-1],[x+30,sl+2]],rgba(WHITE,.8*(1-u)),3);}
  c.beginPath();for(let x=r.x+r.w*.5;x<=r.x+r.w;x+=4){const y=sl+2*Math.sin(x*.12+t*2);x===r.x+r.w*.5?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=rgba(WHITE,.7);c.lineWidth=2;c.stroke();
  for(const [fx,fy] of [[.12,.62],[.3,.74],[.22,.86],[.42,.9]]){K.ellipse(c,r.x+fx*r.w,r.y+fy*r.h,6,4,'#f2ecd9','#8c8577',1.5);}
  c.restore();}
function cards(c,tau,t){CARDS.forEach((q,i)=>withA(c,fin(tau,2.4+i*.45),()=>{const r={x:q.x,y:CARD.y,w:CARD.w,h:CARD.ih};
  D.round(c,r.x-4,r.y-4,r.w+8,CARD.ih+56,14,'#1c3d34',C.edge);
  if(q.file)K.drawIn(c,q.file,r,{crop:q.crop,radius:10});else sandCard(c,r,t);
  D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(WHITE,.55));
  tag(c,q.name(),r.x+8,r.y+8,{col:q.col,active:true,minX:r.x+4,maxX:r.x+r.w-4});
  text(c,q.note(),r.x+r.w/2,r.y+CARD.ih+36,22,MUTED,'center');
  // a thin wave-line in each card: these all have an intertidal zone
  const u=mod(t*.5+i*.3);D.round(c,r.x-4-3*u,r.y-4-3*u,r.w+8+6*u,CARD.ih+56+6*u,14,null,rgba(YELLOW,.5*(1-u)*fin(tau,4.2)));}));}

// ── water level for each step ─────────────────────────────────────────────
function cyc(q){q=mod(q,9);return q<3?smooth(q/3):q<4.5?1:q<7.5?1-smooth((q-4.5)/3):0;}
function level(k,tau,t,L0){
  if(k===0)return .5+.5*Math.sin(t*Math.PI*2/6);
  if(k===1)return mix(L0,0,smooth(tau/2));
  return tau<5?mix(L0,0,smooth(tau/1.2)):cyc(tau-5);}

// ── one step, drawn at its own time tau ───────────────────────────────────
function step(c,k,tau,t,L0){
  const Lv=level(k,tau,t,L0),dL=(level(k,tau+.05,t+.05,L0)-Lv)/.05;
  // ── step 0 ──
  if(k===0){
    const R=RA,W={L:Lv,dry:0,salty:0,band:fin(tau,1.6),lines:fin(tau,.3)};
    shore(c,R,t,W);
    withA(c,fin(tau,.3),()=>tag(c,L('highTideLine','高潮線','High-tide line'),R.x+R.w-12,Y(R,VH)-44,{al:'right',col:WHITE}));
    withA(c,fin(tau,.9),()=>tag(c,L('lowTideLine','低潮線','Low-tide line'),R.x+R.w-12,Y(R,VL)+6,{al:'right',col:CYAN}));
    withA(c,fin(tau,1.6),()=>{const x=R.x+R.w-30,y0=Y(R,VH)+6,y1=Y(R,VL)-6;
      K.line(c,[[x,y0],[x,y1]],YELLOW,3);K.line(c,[[x-8,y0],[x+8,y0]],YELLOW,3);K.line(c,[[x-8,y1],[x+8,y1]],YELLOW,3);
      const p=tag(c,L('intertidal','潮間帶','Intertidal zone'),x-14,(y0+y1)/2-20,{al:'right',col:YELLOW,active:true});if(tau>2.2)pulseRing(c,p,t,YELLOW);});
    cards(c,tau,t);
    withA(c,fin(tau,4.2),()=>{const p=tag(c,L('notOnlyEstuary','潮間帶不只在河口','The intertidal zone is not only at estuaries'),CW/2+60,526,{al:'center',col:YELLOW,active:true});if(tau>4.8)pulseRing(c,p,t,YELLOW);});
    statePill(c,Lv,dL,t);
    tag(c,L('schematic','示意','Schematic'),RA.x,526,{col:MUTED});
    text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
    return;
  }
  // ── step 1: exposure ──
  if(k===1){
    const R=RB,W={L:Lv,dry:fin(tau,2.4,3),salty:fin(tau,3.4,3),band:0,lines:.45};
    shore(c,R,t,W);
    const aS=fin(tau,1),SX=548,SY=128;
    // rays onto the bare slope
    withA(c,aS*.9,()=>{for(const u of [.34,.48,.62]){const x=X(R,u),y=gy(R,x)-6;c.save();c.setLineDash([10,8]);c.lineDashOffset=-t*16;K.line(c,[[SX,SY+34],[x,y]],rgba(YELLOW,.85),3);c.restore();}});
    sun(c,SX,SY,26,t,aS);
    withA(c,fin(tau,1.4),()=>{const lv=mix(.25,.85,fin(tau,1.6,3));thermo(c,650,84,170,lv,mixHex(CYAN,ORANGE,fin(tau,1.6,3)));
      tag(c,L('sun','太陽曬','Sun'),690,92,{col:YELLOW});});
    withA(c,fin(tau,.5),()=>{const p=tag(c,L('exposure','曝露','Exposure'),24,72,{col:YELLOW,active:true,size:26});if(tau>1.1)pulseRing(c,p,t,YELLOW);
      pointer(c,[p.x+p.w*.6,p.y+p.h+2],[X(R,.33),gy(R,X(R,.33))-4],YELLOW,t);});
    withA(c,fin(tau,2.6),()=>{const p=tag(c,L('drying','變乾','Drying out'),40,400,{col:SAND,active:true});
      pointer(c,[p.x+p.w*.5,p.y-2],[X(R,.27),gy(R,X(R,.27))+10],SAND,t,false);});
    withA(c,fin(tau,3.6),()=>{const pc=(X(R,PU0)+X(R,PU1))/2,p=tag(c,POOL_SALTY,pc,430,{al:'center',col:SALT_COL,active:true});if(tau>4.2)pulseRing(c,p,t,SALT_COL);
      pointer(c,[pc,p.y-2],[pc,Y(R,PV)+10],SALT_COL,t,false);});
    withA(c,fin(tau,5),()=>tag(c,PROBLEMS,CW/2+60,526,{al:'center',col:YELLOW,active:true}));
    statePill(c,Lv,dL,t);
    const sch=tag(c,L('schematic','示意','Schematic'),RB.x,526,{col:tau>3.6?YELLOW:MUTED,active:tau>3.6});if(tau>4.2)pulseRing(c,sch,t,YELLOW);
    return;
  }
  // ── step 2: coping ──
  const R=RB,W={L:Lv,dry:0,salty:0,band:0,lines:.45};
  const b=burrow(R),A0=X(R,.475),a=fin(tau,0,.6);
  // crab path: walk up to the mouth (1-3 s), then down the tunnel (3-4.4 s)
  let cx,cf,rot=0;
  if(tau<3){const u=smooth((tau-1)/2);cx=mix(A0,b.xm+4,u);cf=gy(R,cx)+2;rot=-.18*Math.sin(Math.PI*u);}
  else{const u=smooth((tau-3)/1.4);cx=mix(b.xm+4,b.xm-2,u);cf=mix(gy(R,b.xm)+2,b.bot-2,u);rot=.12*Math.sin(Math.PI*u);}
  const walk=tau>1&&tau<4.4?2.2*Math.sin(tau*14):0;
  const fishX=(X(R,PU0)+X(R,PU1))/2+6,fishY=Y(R,PV)+10;
  shore(c,R,t,W,()=>{
    c.save();abovePath(c,R,true);c.clip();drawCrab(c,cx,cf+walk*.3,76,rot,a);c.restore();
    drawSkipper(c,fishX+3*Math.sin(t*.7),fishY,124,-1.5*Math.max(0,Math.sin(t*1.6)),a);
  });
  withA(c,fin(tau,.6),()=>{const p=tag(c,L('fiddlerCrab','招潮蟹','Fiddler crab'),A0-20,214,{al:'center',col:ORANGE});
    if(tau<4.4)withA(c,1-fin(tau,3.6,.6),()=>pointer(c,[p.x+p.w*.5,p.y+p.h+2],[cx,cf-40],ORANGE,t,false));});
  withA(c,fin(tau,1),()=>tag(c,L('mudskipper','彈塗魚','Mudskipper'),fishX+40,278,{al:'center',col:SAND}));
  withA(c,fin(tau,1.6),()=>{const p=tag(c,L('inPool','留在水窪','In the pool'),fishX+20,430,{al:'center',col:CYAN,active:true});if(tau>2.2&&tau<6)pulseRing(c,p,t,CYAN);
    pointer(c,[fishX+20,p.y-2],[fishX+30,Y(R,PV)+8],CYAN,t,false);});
  withA(c,fin(tau,3.4),()=>{const p=tag(c,L('burrow','躲進洞','In the burrow'),40,420,{col:ORANGE,active:true});if(tau>4&&tau<7)pulseRing(c,p,t,ORANGE);
    pointer(c,[p.x+p.w*.5,p.y-2],[b.xl-6,b.bot-40],ORANGE,t,false);});
  withA(c,fin(tau,7),()=>{const p=tag(c,COVERED,CW/2+60,526,{al:'center',col:YELLOW,active:true});if(tau>7.6&&tau<12)pulseRing(c,p,t,YELLOW);});
  statePill(c,Lv,dL,t);
  tag(c,L('schematic','示意','Schematic'),RB.x,526,{col:MUTED});
  text(c,L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),RB.x,590,22,MUTED,'left');
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}

// ── frame ─────────────────────────────────────────────────────────────────
function clock(s,t){
  if(s.phase>=0){const r=K.stageClock(s,t,N,10);return{k:r.k,tau:r.tau};}
  const q=mod(t-(s.start||0),TOTAL);let acc=0;
  for(const [k,d] of SEQ){if(q<acc+d)return{k,tau:q-acc};acc+=d;}
  return{k:2,tau:0};}
function draw(c,s,t){
  const {k,tau:ck}=clock(s,t);
  s.shown=k;
  PRELOAD.forEach(f=>K.pic(K.src(f)));
  const st=s.tdSt||(s.tdSt={});
  if(st.k===undefined||t<st.T){st.k=k;st.from=-1;st.T=t-ck;st.L0=k===0?.5:k===1?.5:0;}
  if(st.k!==k){st.from=st.k;st.fromTau=t-st.T;st.fromL0=st.L0;st.k=k;st.T=t;st.L0=st.L;}
  const tau=t-st.T;
  st.L=level(k,tau,t,st.L0);
  step(c,k,tau,t,st.L0);
  if(st.from>=0&&tau<OUT){
    c.save();c.globalAlpha*=1-smooth(tau/OUT);c.fillStyle='#11261f';c.fillRect(0,0,CW,600);step(c,st.from,st.fromTau+tau,t,st.fromL0);c.restore();}
}
window.EcologyDraw.tide=draw;
})();

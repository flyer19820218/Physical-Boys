/* Ecology lesson 4 · "fairtest" canvas (schoolyard tab, view 0), 2026-10-24. A fair comparison of an open and a shaded site.
 * Pictures (K.SIZE): EC1_sunny_dry 928x1116 (open site, left), EC1_shady_moist 929x948 (shaded site, right); both are cut-out soil blocks.
 * Top-face corners measured with PIL (picture pixels): sunny left (0,410) front (620,700) right (926,540);
 * shady left (0,420) front (600,530) right (926,230). A point on the face = left + a*(front-left) + b*(right-front).
 * Props drawn by program: quadrat frames, stopwatches, thermometer, light meter, hygrometer, observers, photo card, safety icons.
 * Five steps, 8 s each; s.shown = step. Elements carry the step range they live in, so a step change fades only what changes.
 *  0 unfair: shade gets a big dashed search area and a long magnifier search (stopwatch sweeps far), open site a small area and
 *    a quick look (stopwatch stops early); insects pop up as found; "Open 4 / Shade 12 (schematic)" and the question pill.
 *  1 same area: two identical quadrat frames drop onto both top faces; under them two equal frame icons with "=" and "Same area".
 *  2 same time and method: both stopwatches sweep to the same angle together; two observers kneel and swing a magnifier in step,
 *    the magnifiers trace the same path inside both frames; "Same time" "Same method" pills.
 *  3 record conditions: pictures shrink to the top corners; light meter, thermometer and hygrometer each read once (probe lines to
 *    both sites), the values fill one shared table side by side (schematic numbers); a photo card "place, date, time".
 *  4 safety: pictures fade; four cards (no uprooting, no disturbing dangerous animals, away from roads, away from water edges)
 *    with animated drawn icons; a box "If unsure, record traits first".
 * Labels from K.LAB; new labels are the P() constants below.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const QUICK=P('只找一下、範圍小','Quick look, small area'),LONG=P('找很久、範圍大','Long search, big area');
const OPEN_N=P('開闊 4 隻','Open: 4'),SHADE_N=P('遮蔭 12 隻','Shade: 12'),NUMS=P('數字為示意','Numbers are schematic');
const N=5,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,CYAN=C.cyan,MUTED=C.muted,PINK=C.pink;
const FILL='rgba(11,26,21,.92)',CARD_BG='rgba(28,61,52,.95)';

// ── sites ─────────────────────────────────────────────────────────────────
const SITE=[
  {file:'EC1_sunny_dry.png',W:928,H:1116,Lc:[0,410],F:[620,700],R:[926,540],q:[.5,.45],lab:['openSite','開闊處','Open site'],
   big:{x:107,y:60,w:266},small:{x:40,y:82,w:170},search:[.34,.66]},
  {file:'EC1_shady_moist.png',W:929,H:948,Lc:[0,420],F:[600,530],R:[926,230],q:[.55,.5],lab:['shadeSite','遮蔭處','Shaded site'],
   big:{x:587,y:0,w:266},small:{x:750,y:0,w:170},search:[.08,.92]}];
// bottom-align the shaded block with the open one (big bottom 380, small bottom 286)
for(const s of SITE){for(const [m,bot] of [['big',380],['small',286]]){const r=s[m];r.h=r.w*s.H/s.W;r.y=bot-r.h;}}
const rectOf=(si,cv)=>{const a=SITE[si].big,b=SITE[si].small;return{x:mix(a.x,b.x,cv),y:mix(a.y,b.y,cv),w:mix(a.w,b.w,cv),h:mix(a.h,b.h,cv)};};
function face(si,r,a,b){const S=SITE[si],u=[S.F[0]-S.Lc[0],S.F[1]-S.Lc[1]],v=[S.R[0]-S.F[0],S.R[1]-S.F[1]];
  const px=S.Lc[0]+a*u[0]+b*v[0],py=S.Lc[1]+a*u[1]+b*v[1];return[r.x+px*r.w/S.W,r.y+py*r.h/S.H];}
// identical quadrat shape on both sites (same screen directions, side scales with the picture)
const QU=[Math.cos(20*Math.PI/180),Math.sin(20*Math.PI/180)],QV=[Math.cos(-35*Math.PI/180),Math.sin(-35*Math.PI/180)];
function quadPts(cx,cy,side){const h=side/2;return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[cx+(i*QU[0]+j*QV[0])*h,cy+(i*QU[1]+j*QV[1])*h]);}
function quadrat(c,cx,cy,side,a=1){
  const p=quadPts(cx,cy,side);
  c.save();c.globalAlpha*=a;c.lineJoin='round';
  c.beginPath();p.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();
  c.fillStyle=rgba(YELLOW,.12);c.fill();c.strokeStyle=C.ink;c.lineWidth=8;c.stroke();c.strokeStyle=YELLOW;c.lineWidth=4.5;c.stroke();
  for(const q of p)circle(c,q[0],q[1],4.5,WHITE,C.ink,2);
  c.restore();
}

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:FILL,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dashLine(c,a,b,col,t,w=2.5){c.save();c.lineCap='round';c.setLineDash([7,6]);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();}
function magnifier(c,x,y,r=15,col=WHITE){
  c.save();c.lineCap='round';
  c.beginPath();c.moveTo(x+r*.7,y+r*.7);c.lineTo(x+r*1.9,y+r*1.9);c.strokeStyle=C.ink;c.lineWidth=9;c.stroke();c.strokeStyle=col;c.lineWidth=5;c.stroke();
  circle(c,x,y,r,rgba(CYAN,.18),C.ink,7);circle(c,x,y,r,null,col,3.5);
  c.restore();
}
function insect(c,x,y,t,pop){
  const s=.4+.6*ease(pop);c.save();c.translate(x,y);c.scale(s,s);
  c.strokeStyle=C.ink;c.lineWidth=2;for(const d of [-1,1])for(const k of [-4,0,4]){c.beginPath();c.moveTo(k,0);c.lineTo(k+d*2,d*8);c.stroke();}
  K.ellipse(c,0,0,8,5.5,ORANGE,C.ink,2);circle(c,7,0,3.2,C.ink);
  c.restore();
  if(pop>=1){const u=mod(t*.6+x*.013);circle(c,x,y,9+u*10,null,rgba(ORANGE,.7*(1-u)),2);}
}
function stopwatch(c,x,y,r,ang,col,t){
  c.save();
  D.round(c,x-9,y-r-16,18,14,4,WHITE,C.ink);D.round(c,x+r*.62,y-r*.88,12,10,3,WHITE,C.ink);
  circle(c,x,y,r+4,C.ink);circle(c,x,y,r,'#16332b',WHITE,4);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;K.sline(c,[[x+Math.sin(a)*(r-5),y-Math.cos(a)*(r-5)],[x+Math.sin(a)*(r-11),y-Math.cos(a)*(r-11)]],rgba(WHITE,.7),2);}
  const a0=-Math.PI/2,a1=a0+ang*Math.PI/180;
  if(ang>0.5){c.beginPath();c.moveTo(x,y);c.arc(x,y,r-4,a0,a1);c.closePath();c.fillStyle=rgba(col,.38);c.fill();}
  K.sline(c,[[x,y],[x+Math.cos(a1)*(r-8),y+Math.sin(a1)*(r-8)]],col,4);circle(c,x,y,4.5,col,C.ink,2);
  c.restore();
}
function person(c,x,y,dir,swing,col=WHITE){
  // kneeling observer; swing 0..1 moves the arm (and magnifier) forward and down
  const hip=[x,y-42],sh=[x+dir*6,y-82],head=[x+dir*10,y-100],knee=[x+dir*26,y-34];
  const hand=[x+dir*(34+16*swing),y-60+14*swing];
  c.save();c.lineCap='round';c.lineJoin='round';
  const limb=(pts,w=6)=>{K.sline(c,pts,C.ink,w+4);K.sline(c,pts,col,w);};
  limb([hip,knee,[x+dir*24,y]]);limb([hip,[x-dir*16,y-6],[x-dir*30,y]]);
  limb([hip,sh],7);limb([sh,[x+dir*(20+6*swing),y-70+6*swing],hand],5);
  circle(c,head[0],head[1],13,'#16332b',col,4);
  c.restore();
  magnifier(c,hand[0]+dir*12,hand[1]+4,10,col);
}
// instruments (centre x,y; act 0..1 glow)
function lightMeter(c,x,y,t){
  D.round(c,x-26,y-30,52,68,10,'#16332b',YELLOW);
  c.save();c.beginPath();c.arc(x,y-30,15,Math.PI,0);c.fillStyle=rgba(WHITE,.85);c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();c.restore();
  D.round(c,x-18,y-16,36,22,4,rgba(YELLOW,.18),rgba(YELLOW,.7));
  for(let i=0;i<4;i++){const hgt=4+12*(.5+.5*Math.sin(t*3+i));c.fillStyle=YELLOW;c.fillRect(x-14+i*8,y+4-hgt,5,hgt);}
  for(let i=0;i<5;i++){const a=Math.PI+i/4*Math.PI,u=mod(t*.8);K.sline(c,[[x+Math.cos(a)*20,y-30+Math.sin(a)*20],[x+Math.cos(a)*(26+4*u),y-30+Math.sin(a)*(26+4*u)]],rgba(YELLOW,.8),2.5);}
  circle(c,x,y+22,6,null,YELLOW,2.5);
}
function thermometer(c,x,y,t){
  D.round(c,x-10,y-46,20,72,10,'#16332b',WHITE);circle(c,x,y+32,15,'#16332b',WHITE,3);
  const lv=.55+.08*Math.sin(t*1.6),top=y+26-lv*64;
  D.round(c,x-4.5,top,9,y+30-top,4.5,ORANGE);circle(c,x,y+32,10,ORANGE);
  for(let i=0;i<5;i++)K.sline(c,[[x+12,y-36+i*13],[x+20,y-36+i*13]],rgba(WHITE,.7),2);
}
function hygrometer(c,x,y,t){
  circle(c,x,y,32,'#16332b',CYAN,3.5);
  c.save();c.beginPath();c.arc(x,y,24,Math.PI*.8,Math.PI*2.2);c.strokeStyle=rgba(CYAN,.5);c.lineWidth=4;c.stroke();c.restore();
  const a=Math.PI*(1.35+.28*Math.sin(t*1.3));K.sline(c,[[x,y],[x+Math.cos(a)*22,y+Math.sin(a)*22]],WHITE,3.5);circle(c,x,y,4,WHITE);
  // water drop under the dial
  c.save();c.beginPath();c.moveTo(x,y+12);c.quadraticCurveTo(x+9,y+24,x,y+28);c.quadraticCurveTo(x-9,y+24,x,y+12);c.fillStyle=CYAN;c.fill();c.restore();
}
// safety icons in a circle (cx,cy)
function noSlash(c,cx,cy,r,t){c.save();c.lineCap='round';circle(c,cx,cy,r,null,ORANGE,6);
  const a=-Math.PI/4;K.sline(c,[[cx+Math.cos(a+Math.PI)*r*.7,cy+Math.sin(a+Math.PI)*r*.7],[cx+Math.cos(a)*r*.7,cy+Math.sin(a)*r*.7]],ORANGE,6);
  const u=mod(t*.6);circle(c,cx,cy,r+3+u*10,null,rgba(ORANGE,.6*(1-u)),2.5);c.restore();}
function iconPlant(c,x,y,t){const sw=Math.sin(t*2)*.12;
  c.save();c.translate(x,y+22);c.rotate(sw);K.sline(c,[[0,0],[0,-34]],GREEN,5);
  for(const d of [-1,1]){c.beginPath();c.ellipse(d*12,-24,12,6,d*-.5,0,Math.PI*2);c.fillStyle=GREEN;c.fill();}
  c.restore();K.sline(c,[[x-22,y+24],[x+22,y+24]],C.sand,4);}
function iconBug(c,x,y,t){const k=Math.sin(t*14)*.5+.5;
  c.save();c.globalAlpha*=.85;K.ellipse(c,x-8,y-12,10,6+3*k,rgba(WHITE,.8),null,0,-.5);K.ellipse(c,x+8,y-12,10,6+3*k,rgba(WHITE,.8),null,0,.5);c.restore();
  K.ellipse(c,x,y+4,9,15,YELLOW,C.ink,2);for(const d of [-2,6])K.sline(c,[[x-8,y+d],[x+8,y+d]],C.ink,3.5);circle(c,x,y-12,6,C.ink);}
function iconRoad(c,x,y,t){D.round(c,x-30,y-14,60,32,4,'#47675d');
  c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*20;K.sline(c,[[x-28,y+2],[x+28,y+2]],WHITE,2.5);c.restore();
  const cx=x-22+mod(t*.5)*44;c.save();c.beginPath();c.rect(x-30,y-40,60,60);c.clip();
  D.round(c,cx-14,y-14,28,13,4,PINK);D.round(c,cx-8,y-21,16,9,3,PINK);circle(c,cx-8,y,4,C.ink);circle(c,cx+8,y,4,C.ink);c.restore();}
function iconWater(c,x,y,t){for(let j=0;j<3;j++){c.save();c.beginPath();for(let i=0;i<=24;i++){const xx=x-28+i*56/24,yy=y-10+j*12+3*Math.sin(i*.6+t*3+j);i?c.lineTo(xx,yy):c.moveTo(xx,yy);}
  c.strokeStyle=rgba(CYAN,1-j*.2);c.lineWidth=4;c.lineCap='round';c.stroke();c.restore();}}
const ICONS=[iconPlant,iconBug,iconRoad,iconWater];

// ── layout constants ─────────────────────────────────────────────────────
const HALF=[240,720],SW=[[120,452],[600,452]],SWR=40,TXT=[180,660];
const INST=[[305,140,'lightMeter','光度計','Light meter',YELLOW,lightMeter],[480,140,'thermometer','溫度計','Thermometer',ORANGE,thermometer],[655,140,'hygrometer','濕度計','Hygrometer',CYAN,hygrometer]];
const ROWS=[['light','光','Light',YELLOW,['52000 lux','6000 lux']],['temperature','溫度','Temperature',ORANGE,['31 °C','27 °C']],['humidity','濕度','Humidity',CYAN,['55 %','80 %']]];
const TB={x:40,y:290,cw:[200,210,210],rh:46},PH={x:690,y:290,w:230,h:184};
const CARDS={y:60,w:216,h:300,gap:12};
const rnd=K.rng(1024),SPOTS=[[],[]];
for(let si=0;si<2;si++){const [a0,a1]=SITE[si].search,n=si?12:4;for(let i=0;i<n;i++)SPOTS[si].push([mix(a0+.04,a1-.04,rnd()),mix(a0+.04,a1-.04,rnd())]);}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k,tau:ck}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.ftSt||(s.ftSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-ck;st.cv=k>=3?1:0;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.c0=st.cv;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const T=tau;                                                     // reveal clock of the current step
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d,s1);if(!moving)return now;const was=vis(st.from,9,s0,0,s1);return now>=was?now:mix(was,now,u);};
  const cTarget=k>=3?1:0;st.cv=st.from>=0?mix(st.c0??cTarget,cTarget,smooth(tau/MOVE)):cTarget;const cv=st.cv;
  const R=[rectOf(0,cv),rectOf(1,cv)];
  const picA=A(0,0,3);

  // ── pictures and site names ──
  withA(c,picA,()=>{
    for(let si=0;si<2;si++){const r=R[si],sw=.004*Math.sin(t*1.1+si);
      c.save();const fx=r.x+r.w/2,fy=r.y+r.h;c.translate(fx,fy);c.rotate(sw);c.translate(-fx,-fy);K.drawIn(c,SITE[si].file,r);c.restore();}
    const py=mix(12,26,cv);
    for(let si=0;si<2;si++){const r=R[si],S=SITE[si];
      const p=tag(c,L(...S.lab),r.x+r.w/2,py,{al:'center',col:si?GREEN:YELLOW,active:true,size:24,minX:si?492:8,maxX:si?CW-8:468});
      if(k===0)pulseRing(c,p,t+si*.6,si?GREEN:YELLOW);}
  });

  // ── step 0: unfair search ──
  const searchA=A(0,.2,0);
  withA(c,searchA,()=>{
    const RATE=65,dur=[1.2,4];
    for(let si=0;si<2;si++){const r=R[si],S=SITE[si],[a0,a1]=S.search;
      const pts=[[a0,a0],[a1,a0],[a1,a1],[a0,a1]].map(([a,b])=>face(si,r,a,b));
      c.save();c.setLineDash([9,7]);c.lineDashOffset=-t*12;c.beginPath();pts.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();
      c.fillStyle=rgba(CYAN,.10);c.fill();c.strokeStyle=C.ink;c.lineWidth=7;c.stroke();c.strokeStyle=CYAN;c.lineWidth=3.5;c.stroke();c.restore();
      const run=clamp((T-.4)/dur[si]),done=run>=1;
      // insects found so far
      SPOTS[si].forEach(([a,b],i)=>{const tf=si?.6+i*.3:.6+i*.25;if(T<tf)return;const q=face(si,r,a,b);insect(c,q[0],q[1],t,clamp((T-tf)/.3));});
      // magnifier sweeping the search area
      if(!done){const w=T*2.2,mid=(a0+a1)/2,amp=(a1-a0)/2*.8;const q=face(si,r,mid+amp*Math.sin(w),mid+amp*Math.sin(w*1.7+1));magnifier(c,q[0]-6,q[1]-14,16);}
      // stopwatch
      const [sx,sy]=SW[si];stopwatch(c,sx,sy,SWR,RATE*dur[si]*run,si?GREEN:YELLOW,t);
      text(c,si?LONG:QUICK,TXT[si],440,22,WHITE,'left');
      withA(c,clamp((T-.5-dur[si])/.5),()=>{
        const lab=si?SHADE_N:OPEN_N,wN=measure(c,lab,28);
        text(c,lab,TXT[si],484,28,si?GREEN:YELLOW,'left');
        tag(c,L('schematic','示意','Schematic'),TXT[si]+wN+12,458,{col:MUTED});
      });
    }
  });
  withA(c,A(0,.2,0)*clamp((T-4.9)/.6),()=>{
    const p=tag(c,L('isItShade','是遮蔭，還是找比較久？','Shade, or just searching longer?'),CW/2,512,{al:'center',col:YELLOW,active:true,size:24});
    pulseRing(c,p,t,YELLOW);
  });

  // ── quadrats on the sites (steps 1-3) ──
  const quadA=A(1,.2,3),qSide=r=>r.w*.3;
  withA(c,quadA,()=>{
    for(let si=0;si<2;si++){const r=R[si],S=SITE[si],q=face(si,r,...S.q);
      const drop=k===1?ease(clamp((T-.2-si*.25)/.7)):1,dy=(1-drop)*-110;
      quadrat(c,q[0],q[1]+dy,qSide(r),Math.max(.15,drop));
      if(k===1&&drop>=1){const uu=mod(t*.7);c.save();c.globalAlpha*=1-uu;const p=quadPts(q[0],q[1],qSide(r)*(1+uu*.35));c.beginPath();p.forEach((z,i)=>i?c.lineTo(...z):c.moveTo(...z));c.closePath();c.strokeStyle=YELLOW;c.lineWidth=2.5;c.stroke();c.restore();}
    }
  });
  // step 1: equal frames below with "="
  withA(c,A(1,.9,1),()=>{
    for(let si=0;si<2;si++){const r=R[si],q=face(si,r,...SITE[si].q),[ix,iy]=SW[si];
      dashLine(c,[ix,iy-34],[q[0],q[1]+20],rgba(YELLOW,.7),t);
      quadrat(c,ix,iy,qSide(r),1);
      tag(c,L('quadrat','樣框','Quadrat frame'),TXT[si],432,{col:YELLOW});}
    const g=.5+.5*Math.sin(t*3);text(c,'=',CW/2,470,44,rgba(WHITE,.75+.25*g),'center',K.MONO);
  });
  withA(c,A(1,1.4,1),()=>{const p=tag(c,L('sameArea','範圍一樣','Same area'),CW/2,512,{al:'center',col:YELLOW,active:true,size:24});pulseRing(c,p,t,YELLOW);});

  // ── step 2: same time, same method ──
  withA(c,A(2,.2,2),()=>{
    const run=clamp((T-.3)/3),ang=240*smooth(run),swing=.5+.5*Math.sin(t*2.4);
    for(let si=0;si<2;si++){const r=R[si],q=face(si,r,...SITE[si].q),[sx,sy]=SW[si];
      stopwatch(c,sx,sy,SWR,ang,si?GREEN:YELLOW,t);
      tag(c,L('stopwatch','碼表','Stopwatch'),TXT[si],432,{col:si?GREEN:YELLOW});
      // observers kneel beside the blocks, mirrored, moving in step
      const dir=si?-1:1,px=si?r.x+r.w+44:r.x-44;person(c,px,r.y+r.h,dir,swing);
      // the same magnifier path inside both frames
      const side=qSide(r)*.32,w=t*1.6,mx=q[0]+(Math.sin(w)*QU[0]+Math.sin(w*2)*.6*QV[0])*side,my=q[1]+(Math.sin(w)*QU[1]+Math.sin(w*2)*.6*QV[1])*side;
      magnifier(c,mx-4,my-12,14);
    }
    if(run>=1){const uu=mod(t*.8);for(let si=0;si<2;si++){const [sx,sy]=SW[si];circle(c,sx,sy,SWR+6+uu*14,null,rgba(WHITE,.7*(1-uu)),3);}}
  });
  withA(c,A(2,1.2,2),()=>{
    const a=L('sameTime','時間一樣','Same time'),b=L('sameMethod','方法一樣','Same method');
    const wa=measure(c,a,24)+28,wb=measure(c,b,24)+28,x0=CW/2-(wa+wb+16)/2;
    const p1=tag(c,a,x0,512,{col:YELLOW,active:true,size:24}),p2=tag(c,b,x0+wa+16,512,{col:GREEN,active:true,size:24});
    pulseRing(c,p1,t,YELLOW);pulseRing(c,p2,t+.5,GREEN);
  });

  // ── step 3: record the conditions ──
  withA(c,A(3,.2,3),()=>{
    INST.forEach(([ix,iy,key,zh,en,col,fn],i)=>{
      const t0=.8+i*1.6,act=T>=t0&&T<t0+1.4,ap=act?Math.sin(clamp((T-t0)/1.4)*Math.PI):0;
      if(ap>0)glow(c,ix,iy,70,col,.35*ap);
      c.save();c.translate(ix,iy-6*ap);fn(c,0,0,t);c.restore();
      const p=K.cpill(c,L(key,zh,en),ix,208,{color:col,active:ap>.3});
      if(act){for(let si=0;si<2;si++){const r=R[si],q=face(si,r,...SITE[si].q),e=clamp((T-t0)/.5);
        const a0=[ix+(si?36:-36),iy],b0=[mix(a0[0],q[0],e),mix(a0[1],q[1],e)];dashLine(c,a0,b0,rgba(col,.9),t,3);if(e>=1)K.pulse(c,q[0],q[1],t,col,8);}}
    });
  });
  withA(c,A(3,.4,3),()=>{
    const {x:tx,y:ty,cw,rh}=TB,tw=cw[0]+cw[1]+cw[2],th=rh*4;
    D.round(c,tx,ty,tw,th,14,CARD_BG,rgba(WHITE,.45));
    c.save();c.strokeStyle=rgba(WHITE,.25);c.lineWidth=1.5;
    for(let i=1;i<4;i++){c.beginPath();c.moveTo(tx+10,ty+rh*i);c.lineTo(tx+tw-10,ty+rh*i);c.stroke();}
    c.beginPath();c.moveTo(tx+cw[0],ty+8);c.lineTo(tx+cw[0],ty+th-8);c.moveTo(tx+cw[0]+cw[1],ty+8);c.lineTo(tx+cw[0]+cw[1],ty+th-8);c.stroke();c.restore();
    const cx=[tx+cw[0]/2,tx+cw[0]+cw[1]/2,tx+cw[0]+cw[1]+cw[2]/2],base=r=>ty+rh*r+rh/2+8;
    text(c,L('condition','條件','Condition'),cx[0],base(0),22,MUTED,'center');
    text(c,L('openSite','開闊處','Open site'),cx[1],base(0),22,YELLOW,'center');
    text(c,L('shadeSite','遮蔭處','Shaded site'),cx[2],base(0),22,GREEN,'center');
    ROWS.forEach(([key,zh,en,col,vals],i)=>{
      text(c,L(key,zh,en),cx[0],base(i+1),24,col,'center');
      const t0=.8+i*1.6;
      for(let j=0;j<2;j++){const e=clamp((T-t0-.6-j*.3)/.4);if(e<=0)continue;
        withA(c,e,()=>{const sc=1+.25*(1-e);c.save();c.translate(cx[j+1],base(i+1)-8);c.scale(sc,sc);text(c,vals[j],0,8,24,WHITE,'center',K.MONO);c.restore();});}
    });
    // a soft highlight walking down the rows once everything is in
    if(T>6){const i=Math.floor(mod(t*.5,3)),hy=ty+rh*(i+1);c.save();c.globalAlpha*=.10+.06*Math.sin(t*3);D.round(c,tx+6,hy+4,tw-12,rh-8,8,ROWS[i][3]);c.restore();}
  });
  withA(c,A(3,5.4,3),()=>{text(c,NUMS,TB.x+4,TB.y+TB.rh*4+34,22,MUTED,'left');});
  withA(c,A(3,5.8,3),()=>{
    const {x:px,y:py,w:pw,h:ph}=PH;D.round(c,px,py,pw,ph,14,CARD_BG,rgba(WHITE,.45+.2*Math.sin(t*2)));
    const box={x:px+14,y:py+12,w:pw-28,h:92};D.round(c,box.x,box.y,box.w,box.h,8,'#16332b',rgba(WHITE,.3));
    K.place(c,'EC1_shady_moist.png',box.x+4,box.y+4,box.w-8,box.h-8);
    // camera icon with a flash
    const cx0=px+30,cy0=py+128;D.round(c,cx0-16,cy0-11,32,22,5,WHITE);D.round(c,cx0-7,cy0-16,14,6,2,WHITE);circle(c,cx0,cy0,7,'#16332b',C.ink,2);
    const f=mod(t*.5);if(f<.15)glow(c,cx0,cy0,30,WHITE,.8*(1-f/.15));
    K.wrap(c,L('placeDateTime','地點、日期、時間','Place, date, time'),px+54,py+136,pw-64,22,WHITE,30,'left');
  });

  // ── step 4: safety cards ──
  const CK=[['noPicking','不拔植物','Do not uproot plants'],['noDanger','不翻動、不捕捉危險生物','Do not disturb or catch dangerous animals'],['noRoad','不靠近車道','Keep away from roads'],['noWater','不靠近水邊','Keep away from water edges']];
  const tot=CARDS.w*4+CARDS.gap*3,x0=(CW-tot)/2;
  CK.forEach((lab,i)=>{withA(c,A(4,.3+i*.45,4),()=>{
    const e=k===4?ease(clamp((T-.3-i*.45)/.7)):1,x=x0+i*(CARDS.w+CARDS.gap),y=CARDS.y+(1-e)*40;
    D.round(c,x,y,CARDS.w,CARDS.h,16,CARD_BG,rgba(ORANGE,.55));
    const cx=x+CARDS.w/2,cy=y+88;circle(c,cx,cy,64,'#16332b');c.save();c.translate(cx,cy);c.scale(1.45,1.45);ICONS[i](c,0,0,t+i*.3);c.restore();noSlash(c,cx,cy,64,t+i*.4);
    K.wrap(c,L(...lab),cx,y+194,CARDS.w-28,22,WHITE,30,'center');
  });});
  withA(c,A(4,2.4,4),()=>{
    const bx=120,by=400,bw=720,bh=110;D.round(c,bx,by,bw,bh,18,CARD_BG,rgba(YELLOW,.5+.25*Math.sin(t*2)));
    // notebook and magnifier
    D.round(c,bx+30,by+24,54,64,6,WHITE);for(let i=0;i<4;i++)K.sline(c,[[bx+40,by+40+i*12],[bx+74,by+40+i*12]],rgba(C.deep,.55),2.5);
    const w=t*1.4;magnifier(c,bx+104+6*Math.sin(w),by+48+4*Math.cos(w),16,YELLOW);
    const p=L('unsureTraits','不確定先記特徵，不急著猜名字','If unsure, record traits first');
    K.wrap(c,p,bx+150,by+66,bw-170,26,YELLOW,36,'left');
  });

  withA(c,picA,()=>text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right'));
}
window.EcologyDraw.fairtest=draw;
})();

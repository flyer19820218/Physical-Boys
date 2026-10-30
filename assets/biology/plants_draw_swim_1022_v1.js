/* Plants · "Moss and fern: sperm must swim" canvas (water tab, view 0), 2026-10-22.
 * Left: a small moss.png (teacher's Gemini AI illustration) with a box on the tip of a leafy shoot, joined by dashed
 * lines to the big magnified panel on the right. Everything inside the panel is schematic, drawn here:
 * the tip tissue, an antheridium (orange sac full of sperm), an archegonium (green flask, egg at the bottom),
 * the sperm (cyan #55e9ff, two tails), the egg (pink), the water film (blue), the sporophyte and spores (brown).
 *  0 dry: no water, the antheridium stays shut, a dashed crossed-out route "no water";
 *  1 rain or dew: drops fall, a water film rises over the tip and covers both organs;
 *  2 the antheridium opens; sperm swim out through the film to the open neck of the archegonium (a steady stream);
 *  3 sperm crowd at the neck, one swims down the neck canal to the egg: fertilization, the egg becomes a fertilized egg;
 *  4 a sporophyte (stalk + capsule) grows up out of the archegonium, the capsule releases spores that drift away;
 *    the red-brown stalks and capsules in the moss picture pulse: those are sporophytes too.
 * Idle motion in every step: sperm tails beat, the water film ripples, drops/spores keep moving.
 * Text of the page (steps, captions) lives in plants_diversity_1022_v1.js (SW_*); picture labels come from K.LAB.
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,arrow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,TAU}=K;
const LAB=()=>K.LAB||{};
const N=5,PER=7;
const WATER='#38bdf8',SPORE='#c98f55',STALK='#b5583a',CAPS='#9a4a2c',AWALL=C.orange,GWALL='#a7e07c';
// ── layout ─────────────────────────────────────────────────────────────────
const PX=260,PY=84,PW=684,PH=470;            // magnified panel
const BASE=480;                              // top of the shoot-tip tissue in the panel
const FTOP=214;                              // top of the full water film
const AX=420,AY=372,ARX=46,ARY=88;           // antheridium sac (centre, radii); tip at AY-ARY
const ATIP=[AX,AY-ARY];
const GX=700,NECK_TOP=262,NECK_BOT=376,VY=428,VRX=44,VRY=50;   // archegonium: neck and venter
const EGG=[GX,VY+2],EGG_R=23;
const RC=760,RW=944-760;                     // right label column
// moss inset
const MF='moss.png',[MW,MH]=K.SIZE[MF],IW=210,IK=IW/MW,IX=22,IY=392,IH=MH*IK;
const ip=(ix,iy)=>[IX+ix*IK,IY+iy*IK];
const ZB=[355,375,90,70];                    // zoom box on the leafy shoot tip, image px
const ICAPS=[[143,147],[440,30],[852,165],[652,140]];  // capsules in the picture, image px

// ── small helpers (as in plants_draw_vascular_1022_v1.js) ──────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{const r=splitLines(c,sg,w,size);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}return r;});
function textBlock(c,p,x,y,w,col,{size=22,lh=29,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22}={}){
  const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7,h=rows.length*lh+11,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',active?C.white:rgba(col,.85));
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
// a boxed label with a leader line from the nearest box edge to a target point
function tagBox(c,p,x,y,maxW,tx,ty,col,a=1,o={}){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const r=fitText(c,p,x,y,maxW,col,o);   // measure first (drawn again on top below)
  const ex=tx<r.x?r.x:tx>r.x+r.w?r.x+r.w:tx,ey=ty<r.y?r.y:ty>r.y+r.h?r.y+r.h:r.y+r.h/2;
  line(c,[[ex,ey],[tx,ty]],rgba(col,.9),2);circle(c,tx,ty,4.5,col,C.ink,1.5);
  fitText(c,p,x,y,maxW,col,o);c.restore();return r;
}
const stepA=(held,tau,t0=0)=>held?fade(tau,t0,.5):fade(tau,t0,.5)*(1-fade(tau,PER-.4,.4));

// ── sperm (schematic): elongated head, two beating tails behind it ─────────
function sperm(c,x,y,ang,t,ph,a=1,beat=14){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const dx=Math.cos(ang),dy=Math.sin(ang),nx=-dy,ny=dx,L=27;
  glow(c,x,y,13,C.cyan,.35);
  [-1,1].forEach((sg,j)=>{c.beginPath();
    for(let i=0;i<=12;i++){const s=i/12,w=Math.sin(s*7.5-t*beat+ph+j*1.3)*4.2*s+sg*2.2*s;
      const px=x-dx*(6+s*L)+nx*w,py=y-dy*(6+s*L)+ny*w;i?c.lineTo(px,py):c.moveTo(px,py);}
    c.strokeStyle=rgba(C.cyan,.95);c.lineWidth=2;c.lineCap='round';c.stroke();});
  ellipse(c,x,y,8.5,4.4,C.cyan,C.ink,1.4,ang);
  c.restore();
}
// sperm waiting inside the antheridium (fixed homes inside the sac)
const HOME=(()=>{const R=K.rng(41),a=[];while(a.length<14){const u=R()*2-1,v=R()*2-1;if(u*u+v*v<.8)a.push({x:AX+u*(ARX-24),y:AY+v*(ARY-36),ang:R()*TAU,ph:R()*TAU});}return a;})();
// swimming routes from the tip of the antheridium to the neck of the archegonium
const ROUTE=HOME.map((h,i)=>{const R=K.rng(70+i);return{c1:[mix(AX,GX,.3)+R()*30,FTOP+28+R()*70],c2:[mix(AX,GX,.72),FTOP+40+R()*90],wob:R()*TAU};});
function cubic(p0,p1,p2,p3,u){const v=1-u;return[v*v*v*p0[0]+3*v*v*u*p1[0]+3*v*u*u*p2[0]+u*u*u*p3[0],v*v*v*p0[1]+3*v*v*u*p1[1]+3*v*u*u*p2[1]+u*u*u*p3[1]];}
const NECK=[GX,NECK_TOP-6];

// ── organs and tissue (schematic) ──────────────────────────────────────────
function tissue(c,dry,t){
  c.save();c.beginPath();c.roundRect(PX,PY,PW,PH,18);c.clip();
  const g=c.createLinearGradient(0,BASE,0,PY+PH);g.addColorStop(0,'#2f6a3a');g.addColorStop(1,'#1d4426');
  c.fillStyle=g;c.fillRect(PX,BASE,PW,PY+PH-BASE);
  // a row of cells along the surface
  for(let x=PX+4,i=0;x<PX+PW;x+=34,i++){D.round(c,x,BASE+4,30,24,7,'rgba(120,178,92,.55)',null);D.round(c,x+17,BASE+32,30,22,7,'rgba(120,178,92,.35)',null);}
  if(dry>0){c.fillStyle=rgba('#8a6a3c',.45*dry);c.fillRect(PX,BASE,PW,PY+PH-BASE);
    c.strokeStyle=rgba('#d9c9a0',.55*dry);c.lineWidth=1.6;
    [[300,0],[470,1],[610,2],[860,3]].forEach(([x,s])=>{const R=K.rng(90+s);c.beginPath();c.moveTo(x,BASE+2);let y=BASE+2;for(let j=0;j<4;j++){y+=10+R()*6;c.lineTo(x+(R()-.5)*22,y);}c.stroke();});}
  line(c,[[PX,BASE],[PX+PW,BASE]],'#7fbf6a',3);
  c.restore();
}
function antheridium(c,open){
  D.round(c,AX-9,AY+ARY-6,18,BASE-(AY+ARY-6)+2,6,'#c46a2c',null);         // stalk
  const gap=open*.42;
  ellipse(c,AX,AY,ARX,ARY,rgba(AWALL,.13),null);
  // jacket of cells: inner ring and cross walls
  c.save();c.beginPath();c.ellipse(AX,AY,ARX-9,ARY-9,0,0,TAU);c.strokeStyle=rgba(AWALL,.45);c.lineWidth=1.6;c.stroke();
  for(let i=0;i<16;i++){const th=i/16*TAU;if(open>0&&Math.abs(mod(th+Math.PI/2+Math.PI,TAU)-Math.PI)<gap)continue;
    line(c,[[AX+(ARX-9)*Math.cos(th),AY+(ARY-9)*Math.sin(th)],[AX+ARX*Math.cos(th),AY+ARY*Math.sin(th)]],rgba(AWALL,.6),1.6);}
  c.restore();
  c.beginPath();c.ellipse(AX,AY,ARX,ARY,0,-Math.PI/2+gap,-Math.PI/2-gap+TAU);c.strokeStyle=AWALL;c.lineWidth=4;c.stroke();
}
function archePath(c){
  c.beginPath();c.moveTo(GX-16,BASE);
  c.bezierCurveTo(GX-VRX-8,BASE-14,GX-VRX-4,VY-VRY+10,GX-13,NECK_BOT);
  c.lineTo(GX-11,NECK_TOP);c.lineTo(GX+11,NECK_TOP);c.lineTo(GX+13,NECK_BOT);
  c.bezierCurveTo(GX+VRX+4,VY-VRY+10,GX+VRX+8,BASE-14,GX+16,BASE);c.closePath();
}
function archegonium(c,open){
  archePath(c);c.fillStyle=rgba(GWALL,.14);c.fill();c.strokeStyle=GWALL;c.lineWidth=4;c.stroke();
  // neck canal: closed cells (dashed) or an open channel
  if(open<1)dashed(c,[[GX,NECK_TOP+6],[GX,NECK_BOT+4]],rgba(GWALL,.7*(1-open)),2.4,[6,6]);
  if(open>0){c.save();c.globalAlpha*=open;D.round(c,GX-5,NECK_TOP-2,10,NECK_BOT-NECK_TOP+8,5,rgba(WATER,.45),null);c.restore();
    c.save();c.fillStyle='#10251c';c.globalAlpha*=open;c.fillRect(GX-9,NECK_TOP-4,18,8);c.restore();}
}
function egg(c,t,fert){
  const [x,y]=EGG;
  if(fert>0)glow(c,x,y,EGG_R*2.6,C.pink,.5*fert*(.7+.3*Math.sin(t*2.4)));
  circle(c,x,y,EGG_R,'#f9a8d4',C.pink,3);
  circle(c,x+4,y-2,8,rgba('#9d174d',.75),null);
  if(fert>0)circle(c,x,y,EGG_R+5+2*Math.sin(t*2.4),null,rgba(C.yellow,.85*fert),2.5);
}
// water film over the panel, level 0..1, with a rippling surface
function film(c,level,t){
  if(level<=0)return;
  const top=mix(BASE,FTOP,level);
  c.save();c.beginPath();c.roundRect(PX,PY,PW,PH,18);c.clip();
  const g=c.createLinearGradient(0,top,0,BASE);g.addColorStop(0,rgba(WATER,.34));g.addColorStop(1,rgba(WATER,.20));
  c.beginPath();c.moveTo(PX,BASE);for(let x=PX;x<=PX+PW;x+=6)c.lineTo(x,top+3.2*Math.sin(t*2.2+x/26)+1.6*Math.sin(t*3.1-x/11));
  c.lineTo(PX+PW,BASE);c.closePath();c.fillStyle=g;c.fill();
  c.beginPath();for(let x=PX;x<=PX+PW;x+=6){const y=top+3.2*Math.sin(t*2.2+x/26)+1.6*Math.sin(t*3.1-x/11);x===PX?c.moveTo(x,y):c.lineTo(x,y);}
  c.strokeStyle=rgba('#8fd8ff',.9);c.lineWidth=2.5;c.stroke();
  // little glints rising in the film
  for(let i=0;i<9;i++){const x=PX+40+i*72,u=mod(t*.45+i*.29);circle(c,x,mix(BASE-8,top+14,u),2.2,rgba(C.white,.5*(1-u)*level),null);}
  c.restore();
}
const DROPS=(()=>{const R=K.rng(17),a=[];for(let i=0;i<22;i++)a.push({x:PX+20+R()*(PW-40),ph:R(),sp:.8+R()*.5});return a;})();
function drops(c,t,a,top){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  DROPS.forEach(d=>{const u=mod(t*d.sp*.6+d.ph),y=mix(PY+6,top,u);
    if(u<.96){c.beginPath();c.moveTo(d.x,y-9);c.quadraticCurveTo(d.x+5,y,d.x,y+5);c.quadraticCurveTo(d.x-5,y,d.x,y-9);c.fillStyle=rgba(WATER,.9);c.fill();}
    else{const k=(u-.96)/.04;ellipse(c,d.x,top,4+k*12,1.5+k*2,null,rgba('#8fd8ff',.9*(1-k)),1.5);}});
  c.restore();
}

// ── sporophyte (schematic) and spores ──────────────────────────────────────
const STALK_P=[[GX,VY-6],[GX-8,NECK_TOP-30],[GX+14,150]];
function sporophyte(c,g,t){
  if(g<=0)return;
  const n=24,pts=[];for(let i=0;i<=n*g;i++)pts.push(K.bez(...STALK_P,i/n));
  if(pts.length>1){K.sline(c,pts,'#5b2414',8);K.sline(c,pts,STALK,4.5);}
  const cg=clamp((g-.75)/.25);
  if(cg>0){const [x,y]=STALK_P[2],sw=.08*Math.sin(t*1.3);
    c.save();c.translate(x,y);c.rotate(.18+sw);
    ellipse(c,0,-24*cg,13*cg,25*cg,CAPS,'#e3a477',2.5);
    ellipse(c,0,-46*cg,8*cg,4*cg,'#7a3a22',null);
    c.restore();}
}
const capMouth=t=>{const [x,y]=STALK_P[2],a=.18+.08*Math.sin(t*1.3);return[x+Math.sin(a)*48,y-Math.cos(a)*48];};
function spores(c,t,a){
  if(a<=0)return;const [mx,my]=capMouth(t);
  for(let i=0;i<26;i++){const R=K.rng(300+i),life=3.6,q=mod(t+i*life/26,life)/life,vx=-(50+R()*80),vy=-12+R()*36;
    const x=mx+vx*q*life+6*Math.sin(t*2+i),y=my+vy*q*life+18*q*q+4*Math.sin(t*1.7+i*2);
    if(x<PX+16||y<PY+8)continue;
    circle(c,x,y,3.4,rgba(SPORE,a*Math.min(1,q*6,(1-q)*3)),rgba('#3a2010',.8*a*Math.min(1,(1-q)*3)),1);}
}

// ── moss inset with zoom box ───────────────────────────────────────────────
function inset(c,t,k,wet,capPulse){
  K.drawIn(c,MF,{x:IX,y:IY,w:IW,h:IH});
  const [bx,by]=ip(ZB[0],ZB[1]),bw=ZB[2]*IK,bh=ZB[3]*IK;
  // water glints on the picture
  if(wet>0){const R=K.rng(23);for(let i=0;i<12;i++){const [x,y]=ip(180+R()*680,330+R()*380),pu=.55+.45*Math.sin(t*2+i);circle(c,x,y,2.6,rgba(WATER,.9*wet*pu),rgba(C.white,.6*wet*pu),1);}}
  if(capPulse>0){c.save();c.globalAlpha*=capPulse;ICAPS.forEach(([ix,iy],i)=>{const [x,y]=ip(ix,iy);K.pulse(c,x,y,t+i*.3,SPORE,6);circle(c,x,y,6,null,SPORE,2);});c.restore();}
  c.save();c.strokeStyle=C.white;c.lineWidth=2.5;c.strokeRect(bx,by,bw,bh);c.restore();
  // connectors from the box to the panel's left edge
  dashed(c,[[bx+bw,by],[PX,PY+300]],rgba(C.white,.7),2,[7,6],-t*10);
  dashed(c,[[bx+bw,by+bh],[PX,PY+PH-20]],rgba(C.white,.7),2,[7,6],-t*10);
  const L=LAB();
  fitText(c,L.moss||P(`蘚苔`,`Moss`),IX+IW/2,562,220,C.green,{align:'center'});
}

// ── left column: the step in a few words ───────────────────────────────────
const SHORT=[P(`乾的時候`,`Dry`),P(`水膜`,`Water film`),P(`精子游泳`,`Sperm swim`),P(`受精`,`Fertilization`),P(`孢子體`,`Sporophyte`)];
const SAY=[P(`沒有水，精子出不來，\n也游不動`,`No water: the sperm cannot get out or swim`),
 P(`下雨或有露水，\n表面形成一層水膜`,`Rain or dew covers the surface with a thin water film`),
 P(`精子靠水膜，\n游向頸卵器`,`The sperm swim through the film to the archegonium`),
 P(`一個精子游到卵，\n和卵結合`,`One sperm reaches the egg and joins it`),
 P(`受精卵長成孢子體，\n又產生孢子`,`The fertilized egg grows into a sporophyte, which makes spores`)];
const NOTE4=P(`左下圖紅褐色的細柄\n和孢子囊，也是孢子體`,`The red-brown stalks and capsules in the picture are sporophytes too`);
function caption(c,k,a,tau){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const col=[C.muted,WATER,C.cyan,C.pink,SPORE][k];
  const r=fitText(c,SHORT[k],IX,PY+6,222,col,{active:true});
  const h=textBlock(c,SAY[k],IX,r.y+r.h+32,228,C.white);
  if(k===4){c.save();c.globalAlpha*=fade(tau,3,.6);textBlock(c,NOTE4,IX,r.y+r.h+32+h+12,228,SPORE);c.restore();}
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const L=LAB(),a=stepA(held,tau);
  // state of the scene
  const level=k===0?0:k===1?smooth(fade(tau,.5,2.6)):k===4&&!held?1-smooth(fade(tau,PER-1.1,.8)):1;
  const dry=k===0?1:k===1?1-level:0;
  const openA=k<2?0:k===2?smooth(fade(tau,0,.8)):1;
  const fert=k===3?fade(tau,2.6,.5):k===4?1:0;
  const grow=k===4?smooth(fade(tau,.4,2.6)):0;
  const filmTop=mix(BASE,FTOP,level);

  D.round(c,PX,PY,PW,PH,18,'#0f241b',C.edge);
  tissue(c,dry,t);
  antheridium(c,openA);
  archegonium(c,openA);
  egg(c,t,fert);
  // sperm inside the antheridium (steps 0, 1; still waiting ones in step 2)
  const beat=k===0?10:k===1?mix(10,14,level):14;
  if(k<=2){HOME.forEach((h,i)=>{let q=-1;
    if(k===2)q=tau-.7-i*.42;
    const inside=q<0?1:0;
    if(inside){const jig=k===0?3.5:4;sperm(c,h.x+jig*Math.sin(t*1.3+h.ph),h.y+jig*Math.cos(t*1.1+h.ph),h.ang+.5*Math.sin(t*1.6+h.ph),t,h.ph,1,beat);}});}
  film(c,level,t);
  drops(c,t,k===1?(held?1:1-fade(tau,PER-.6,.5)):0,filmTop);
  // swimming sperm (step 2: a steady stream; step 3: crowding at the neck)
  let swimmer=null;
  if(k===2){const T=5.6;HOME.forEach((h,i)=>{const q0=tau-.7-i*.42;if(q0<0)return;const q=mod(q0,T),r=ROUTE[i];
    let p,ang,al=1;
    if(q<.6){const u=smooth(q/.6);p=K.lerpP([h.x,h.y],ATIP,u);ang=Math.atan2(ATIP[1]-h.y,ATIP[0]-h.x);}
    else if(q<4.6){const u=(q-.6)/4,p0=cubic(ATIP,r.c1,r.c2,NECK,u),p1=cubic(ATIP,r.c1,r.c2,NECK,Math.min(1,u+.01));
      ang=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]);const w=6*Math.sin(t*3+r.wob)*Math.sin(u*Math.PI);p=[p0[0]-Math.sin(ang)*w,p0[1]+Math.cos(ang)*w];}
    else if(q<5.1){const u=(q-4.6)/.5;p=[NECK[0]+10*Math.cos(t*2+i),NECK[1]+8+6*Math.sin(t*2.3+i)];ang=Math.PI/2+.6*Math.sin(t*3+i);al=1-u;}
    else{const u=(q-5.1)/.5;p=[h.x,h.y];ang=h.ang;al=u;}
    sperm(c,p[0],p[1],ang,t,h.ph,al);if(q>.9&&q<4.4&&(!swimmer||Math.abs(q-1.8)<Math.abs(swimmer[2]-1.8)))swimmer=[p[0],p[1],q];});}
  if(k===3){const sa=1;
    for(let i=0;i<9;i++){const R=K.rng(500+i),rx=46+R()*40,ry=16+R()*14,w=(.55+R()*.4)*(i%2?1:-1),th=t*w+R()*TAU;
      const x=GX+rx*Math.cos(th)-10,y=NECK_TOP+8+ry*Math.sin(th)+R()*14,ang=th+(w>0?Math.PI/2:-Math.PI/2);
      sperm(c,x,Math.max(y,FTOP+16),ang,t,R()*TAU,sa*(1-.5*fert));if(i===2)swimmer=[x,Math.max(y,FTOP+16)];}
    // the one that reaches the egg
    const u=fade(tau,.5,2.1);
    if(u<1){const y=mix(NECK_TOP-14,EGG[1]-EGG_R-4,smooth(u)),x=GX+2*Math.sin(t*6);sperm(c,x,y,Math.PI/2+.15*Math.sin(t*5),t,0,1-fade(tau,2.45,.2));}
    if(tau>2.5&&tau<3.6){const q=(tau-2.5)/1.1;circle(c,EGG[0],EGG[1],EGG_R+q*34,null,rgba(C.yellow,.9*(1-q)),3);}
  }
  sporophyte(c,grow,t);
  spores(c,t,k===4?fade(tau,3,.6)*(held?1:1-fade(tau,PER-.5,.5)):0);

  // ── labels ──
  // organs: always named
  tagBox(c,L.antheridium||P(`精子器（示意）`,`Antheridium (schematic)`),PX+16,PY+92,300,AX-ARX*.7,AY-ARY*.7,AWALL);
  tagBox(c,P(`頸卵器\n（示意）`,`Archegonium\n(schematic)`),RC,262,RW,GX+14,NECK_TOP+60,GWALL);
  tagBox(c,fert>.5?P(`受精卵`,`Fertilized egg`):(L.egg||P(`卵`,`Egg`)),RC,382,RW,EGG[0]+EGG_R,EGG[1],C.pink);
  fitText(c,P(`放大：蘚苔的莖頂（示意）`,`Magnified: tip of a moss shoot (schematic)`),PX+PW/2,BASE+28,PW-20,'#a7e07c',{align:'center'});
  // sperm
  const sp=k<2||(k===2&&tau<1.6)?[HOME[3].x,HOME[3].y]:swimmer;
  if(sp&&k<4)tagBox(c,L.sperm||P(`精子`,`Sperm`),k<2?AX+ARX+22:470,k<2?AY-14:PY+10,200,sp[0],sp[1],C.cyan);
  // step 0: no route without water
  if(k===0){c.save();c.globalAlpha*=a;
    const m=K.bez(ATIP,[(AX+GX)/2,FTOP-20],NECK,.5);
    dashed(c,Array.from({length:21},(_,i)=>K.bez(ATIP,[(AX+GX)/2,FTOP-20],NECK,i/20)),rgba(C.muted,.8),2.5,[8,7]);
    K.pulse(c,m[0],m[1],t,C.orange,14);line(c,[[m[0]-11,m[1]-11],[m[0]+11,m[1]+11]],C.orange,4);line(c,[[m[0]+11,m[1]-11],[m[0]-11,m[1]+11]],C.orange,4);
    fitText(c,P(`沒有水`,`No water`),m[0],m[1]+20,200,C.orange,{align:'center'});c.restore();}
  // water film
  if(k>=1&&level>.35){c.save();c.globalAlpha*=clamp((level-.35)/.3);
    fitText(c,L.waterFilm||P(`水膜`,`Water film`),(AX+GX)/2+10,BASE-62,200,WATER,{align:'center'});c.restore();}
  if(k===1){c.save();c.globalAlpha*=a;fitText(c,L.wet||P(`下雨或有露水`,`Rain or dew`),(AX+GX)/2+10,PY+14,260,WATER,{align:'center'});c.restore();}
  if(k===2){c.save();c.globalAlpha*=a*fade(tau,1.2,.6);arrow(c,AX+70,FTOP+24,GX-70,FTOP+24,C.cyan,3);c.restore();}
  if(k===3){c.save();c.globalAlpha*=fert;fitText(c,L.fertilize||P(`受精`,`Fertilization`),RC,436,RW,C.pink,{active:true});c.restore();}
  if(k===4){c.save();c.globalAlpha*=fade(tau,1.6,.6);
    tagBox(c,P(`孢子體\n（示意）`,`Sporophyte\n(schematic)`),RC,150,RW,GX+3,300,SPORE);
    const [x,y]=STALK_P[2];tagBox(c,L.sporangium||P(`孢子囊`,`Capsule`),RC,PY+6,RW,x+12,y-30,SPORE);c.restore();
    c.save();c.globalAlpha*=fade(tau,3.4,.6);tagBox(c,L.spores||P(`孢子`,`Spores`),440,PY+10,160,575,118,SPORE);c.restore();}
  // left side
  inset(c,t,k,k>=1?level:0,k===4?fade(tau,3,.6):0);
  caption(c,k,a,tau);
}
window.PlantsDraw.swim=draw;
})();

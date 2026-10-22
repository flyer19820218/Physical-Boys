/* Prokaryotes and protists · "Dry, and after the rain" canvas (cyano tab, view 1), 2026-10-22.
 * The dry rain mushroom (nostoc_dry.png) and the wet one (nostoc_wet.png) share one base line and one width, so the
 * soil of both pictures sits in the same place; the change is a cross-fade with a swell (the wet picture grows up
 * from a flattened start, the dry one fades while lifting a little), driven by one "wetness" value that always eases.
 * Step 0  Drought: sun, black shrunken crusts on cracked soil, dormant.
 * Step 1  Rain: clouds, raindrops with ripples where they land, water drops sinking into the crusts.
 * Step 2  Swells and turns green: cross-fade dry -> wet with the swell, lighter rain, arrows "swells".
 * Step 3  Photosynthesis again: rain stops, sunlight reaches the green colony.
 * A status panel on the right shows water (bar), colour (chip, mixed from the two pictures' colours) and activity.
 * Banner: the rain mushroom is a cyanobacterium (prokaryote), not a mushroom; panel: classification only, not for eating.
 * Label targets are fractions of the PNGs, measured from the pixels (dark crust blobs, a crack, the wet colony, a drop).
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,TAU,text,measure,splitLines,circle,ellipse,glow,arrow,dashed,line,clamp,mix,ease,smooth,fade,rgba,rng,drawIn,stageClock}=K;
const N=4,PER=7;
const DRY='nostoc_dry.png',WET='nostoc_wet.png';
const [DW,DH]=K.SIZE[DRY],[WW,WH]=K.SIZE[WET];
// both pictures: same width and the same bottom line (their soil bottoms coincide)
const IX=30,IW=700,BOT=528,AX=IX+IW/2;
const dryR={x:IX,y:BOT-IW*DH/DW,w:IW,h:IW*DH/DW},wetR={x:IX,y:BOT-IW*WH/WW,w:IW,h:IW*WH/WW};
// measured points (fractions of each picture)
const CRUST=[[.292,.198],[.586,.192],[.247,.396],[.552,.422],[.373,.647],[.817,.543]];   // dark crust blobs (dry)
const CRACK=[.616,.80];                                                                  // a crack in the dry soil
const WET_SOIL=[.55,.92],WET_TOP=[.50,.30],WET_GREEN=[.62,.30],WET_DROP=[.197,.635];    // wet picture
const WET_LEFT=[.10,.56],WET_RIGHT=[.89,.63],WET_CROWN=[.46,.03];
const DRY_COL=[43,38,34],WET_COL=[107,107,51];                                          // crust black-brown, colony olive green

function follow(o,key,target,dt,rate){if(o[key]===undefined||!isFinite(o[key]))o[key]=target;else o[key]+=(target-o[key])*(1-Math.exp(-dt*rate));return o[key];}
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(seg=>splitLines(c,seg,w,size));
// A label box: rows wrapped to maxW, dark rounded box with a coloured border. x is the left edge (or centre).
function box(c,p,x,y,{w=420,col=C.yellow,a=1,center=false,size=22,active=false}={}){
  const rows=rowsOf(c,p,w-28,size),mw=Math.max(...rows.map(r=>measure(c,r,size))),bw=mw+28,bh=size+18+(rows.length-1)*28,bx=center?x-bw/2:x;
  if(a>0){c.save();c.globalAlpha*=a;D.round(c,bx,y,bw,bh,Math.min(20,bh/2),active?col:'rgba(11,26,21,.9)',active?C.white:rgba(col,.85));
    rows.forEach((r,i)=>text(c,r,bx+bw/2,y+28+i*28,size,active?C.deep:col,'center'));c.restore();}
  return{x:bx,y,w:bw,h:bh};
}
function leader(c,from,to,col,a){if(a<=0)return;c.save();c.globalAlpha*=a;line(c,[from,to],rgba(col,.95),2);circle(c,to[0],to[1],4.5,col,C.ink,1.5);c.restore();}
// picture rect scaled about the bottom centre (AX, BOT)
const scaled=(r,sx,sy)=>({x:AX+(r.x-AX)*sx,y:BOT+(r.y-BOT)*sy,w:r.w*sx,h:r.h*sy});
const fp=(r,f)=>[r.x+f[0]*r.w,r.y+f[1]*r.h];

// raindrops: fixed seeds; each drop falls, lands on the ground patch and leaves a ripple
const DROPS=(()=>{const r=rng(11),out=[];for(let i=0;i<54;i++)out.push({x:r(),v:r(),T:1.0+r()*.5,o:r()});return out;})();
function rain(c,t,lev){
  if(lev<=.01)return;
  const n=DROPS.length*lev;
  DROPS.forEach((d,i)=>{if(i>n)return;const al=Math.min(1,n-i);
    const cyc=Math.floor(t/d.T+d.o),u=(t/d.T+d.o)%1,x=70+((d.x*620+cyc*137)%620);
    const half=Math.sqrt(Math.max(0,1-((x-AX)/335)**2)),land=410+(((d.v+cyc*.37)%1)-.5)*2*95*half;
    c.save();c.globalAlpha*=al;
    if(u<.7){const y=mix(118,land,u/.7);line(c,[[x-2,y-16],[x,y]],rgba('#a5dcff',.9),2.5);}
    else{const q=(u-.7)/.3;ellipse(c,x,land,4+16*q,(4+16*q)*.32,null,rgba('#a5dcff',.85*(1-q)),2);}
    c.restore();});
}
function cloud(c,x,y,s,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  [[-60,8,34],[-22,-12,42],[24,-6,38],[62,10,30],[0,14,40]].forEach(([dx,dy,r])=>circle(c,x+dx*s,y+dy*s,r*s,'#5f7684',null));
  [[-22,-16,30],[24,-10,26]].forEach(([dx,dy,r])=>circle(c,x+dx*s,y+dy*s,r*s,'#7c93a1',null));
  c.restore();
}
function sun(c,x,y,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;glow(c,x,y,62,C.yellow,.45);
  for(let i=0;i<12;i++){const an=i/12*TAU+t*.22;line(c,[[x+Math.cos(an)*34,y+Math.sin(an)*34],[x+Math.cos(an)*48,y+Math.sin(an)*48]],C.yellow,3);}
  circle(c,x,y,26,C.yellow,null);c.restore();
}

function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const dt=s.rnT===undefined?0:Math.max(0,Math.min(.1,t-s.rnT));s.rnT=t;
  if(s.rnK!==k){s.rnFrom=s.rnK===undefined?k:s.rnK;s.rnK=k;}
  const pres=s.rnP||(s.rnP=[0,0,0,0]);for(let j=0;j<N;j++){follow(pres,j,j===k?1:0,dt,9);if(Math.abs(pres[j]-(j===k?1:0))<.02)pres[j]=j===k?1:0;}
  const A=(j,t0)=>{const v=j===k?Math.min(pres[j],fade(tau,Math.max(.45,t0),.5)):pres[j];return v<.02?0:v;};

  // eased scene values
  const V=s.rnV||(s.rnV={});
  const tgt=[{w:0,rain:0,cloud:0,sun:1,water:.08},
             {w:0,rain:1,cloud:1,sun:0,water:.08+.3*smooth(tau/5)},
             {w:smooth((tau-.4)/3.4),rain:.45,cloud:.7,sun:0,water:0},
             {w:1,rain:0,cloud:0,sun:1,water:1}][k];
  const w=follow(V,'w',tgt.w,dt,5),rl=follow(V,'rain',tgt.rain,dt,3),cl=follow(V,'cloud',tgt.cloud,dt,3),su=follow(V,'sun',tgt.sun,dt,3);
  const water=follow(V,'water',k===2?mix(.38,1,w):tgt.water,dt,4);
  const absorb=follow(V,'abs',k===1?1:k===2?1-w:0,dt,4);

  // ── sky ──
  sun(c,690,100,t,su);
  const cd=Math.sin(t*.3)*10;
  cloud(c,230+cd,96,1,cl);cloud(c,520-cd,92,.95,cl);

  // ── the rain mushroom: dry and wet pictures, cross-fading with a swell ──
  const breathe=1+.006*Math.sin(t*1.6)*w;
  const dR=scaled(dryR,mix(1,1.03,w),mix(1,1.12,w)),wR=scaled(wetR,mix(.94,1,w)*breathe,mix(.72,1,w)*breathe);
  const da=clamp((1-w)*1.6),wa=clamp(w*1.6);
  if(da>0)drawIn(c,DRY,dR,{alpha:da});
  if(wa>0){if(k===3)glow(c,...fp(wR,WET_TOP),210,C.yellow,.10*su*(.7+.3*Math.sin(t*2)));drawIn(c,WET,wR,{alpha:wa});}

  // water sinking into the crusts (step 1, early step 2)
  if(absorb>.01){c.save();c.globalAlpha*=absorb*da;
    CRUST.forEach((f,i)=>{const [x,y]=fp(dR,f),u=(t/1.8+i*.17)%1,r=7*(1-u*.85),yy=y-18+16*u;
      c.beginPath();c.moveTo(x,yy-r*1.9);c.quadraticCurveTo(x+r*1.1,yy-r*.2,x,yy+r);c.quadraticCurveTo(x-r*1.1,yy-r*.2,x,yy-r*1.9);
      c.fillStyle=rgba('#7dd3fc',.9*(1-u*.6));c.fill();});
    c.restore();}
  rain(c,t,rl);

  // ── banner ──
  box(c,P(`雨來菇是藍綠菌（原核生物），不是蘑菇`,`The rain mushroom is a cyanobacterium (a prokaryote), not a mushroom`),480,12,{w:900,col:C.yellow,center:true});

  // ── labels per step ──
  // step 0: drought
  const a0=A(0,.6);
  if(a0>0){const b=box(c,P(`雨來菇：縮成黑色的殼（休眠）`,`Rain mushroom: shrunk into black crusts (dormant)`),40,166,{w:560,col:C.white,a:a0});
    leader(c,[b.x+70,b.y+b.h],fp(dR,CRUST[0]),C.white,a0);leader(c,[Math.min(b.x+b.w-40,420),b.y+b.h],fp(dR,CRUST[1]),C.white,a0);}
  // sun label (steps 0 and 3)
  const sa=Math.max(A(0,.9),A(3,.9));
  if(sa>0){c.save();c.globalAlpha*=sa;text(c,P(`陽光`,`Sunlight`),690,176,22,C.yellow,'center');c.restore();}
  // step 1: rain
  const a1=A(1,.8),a1b=A(1,1.6);
  if(a1>0){c.save();c.globalAlpha*=a1;text(c,P(`雨雲`,`Rain clouds`),640,84,22,'#c7d6df');c.restore();
    box(c,P(`雨滴`,`Raindrops`),40,150,{w:200,col:'#a5dcff',a:a1});}
  if(a1b>0){const b=box(c,P(`水滲進雨來菇`,`Water seeps into the rain mushroom`),300,174,{w:420,col:C.cyan,a:a1b});
    leader(c,[b.x+Math.min(140,b.w/2),b.y+b.h],fp(dR,CRUST[1]),C.cyan,a1b);}
  // step 2: swelling, turning green
  const a2=A(2,2.6),a2b=A(2,3.2);
  if(a2>0){const b=box(c,P(`雨來菇吸飽水，膨脹`,`The rain mushroom fills with water and swells`),40,150,{w:260,col:C.cyan,a:a2});
    c.save();c.globalAlpha*=a2;const pu=(t*.9)%1;
    [[WET_CROWN,0,-1],[WET_LEFT,-1,-.35],[WET_RIGHT,1,-.35]].forEach(([f,ux,uy])=>{const [x,y]=fp(wR,f),n=Math.hypot(ux,uy),dx=ux/n,dy=uy/n,o=8+pu*10;
      arrow(c,x+dx*o,y+dy*o,x+dx*(o+28),y+dy*(o+28),rgba(C.cyan,1-pu*.5),3);});
    const cr=fp(wR,WET_CROWN);text(c,P(`膨脹`,`Swells`),cr[0]+22,cr[1]-24,22,C.cyan);c.restore();}
  if(a2b>0){const b=box(c,P(`顏色變綠`,`Turns green`),528,178,{w:200,col:C.green,a:a2b});leader(c,[b.x+30,b.y+b.h],fp(wR,WET_GREEN),C.green,a2b);}
  // water drops on the wet colony (steps 2 and 3)
  const wd=Math.max(A(2,3.4),A(3,1.1))*wa;
  if(wd>0){const b=box(c,P(`水珠`,`Water drops`),40,536,{w:200,col:'#a5dcff',a:wd});leader(c,[b.x+b.w/2,b.y],fp(wR,WET_DROP),'#a5dcff',wd);}
  // step 3: photosynthesis again
  const a3=A(3,1.1);
  if(a3>0){c.save();c.globalAlpha*=a3;
    [WET_TOP,WET_GREEN,[.78,.42]].forEach((f,i)=>{const [x,y]=fp(wR,f);dashed(c,[[690-20,100+16],[x,y]],rgba(C.yellow,.9),3,[10,8],-t*24-i*6);});
    c.restore();
    const b=box(c,P(`雨來菇又能行光合作用`,`The rain mushroom photosynthesizes again`),40,150,{w:260,col:C.green,a:A(3,1.6)});
    leader(c,[b.x+b.w-30,b.y+b.h],fp(wR,[.36,.33]),C.green,A(3,1.6));}
  // the soil is not part of the rain mushroom (all steps)
  const so=[mix(fp(dR,CRACK)[0],fp(wR,WET_SOIL)[0],w),mix(fp(dR,CRACK)[1],fp(wR,WET_SOIL)[1],w)];
  const sd=Math.max(A(0,1.2),A(1,2.2)),sw=Math.max(A(2,3.8),A(3,1.4));
  if(sd>0){c.save();c.globalAlpha*=sd;text(c,P(`乾裂的泥土（不是雨來菇）`,`Cracked dry soil (not the rain mushroom)`),470,558,22,C.sand,'center');c.restore();leader(c,[470,538],so,C.sand,sd);}
  if(sw>0){c.save();c.globalAlpha*=sw;text(c,P(`濕的泥土（不是雨來菇）`,`Wet soil (not the rain mushroom)`),470,558,22,C.sand,'center');c.restore();leader(c,[470,538],so,C.sand,sw);}

  // ── status panel (height from its rows) ──
  const PX=752,PW=188,PM=PX+PW/2,TW=PW-20;
  const ACT=[P(`休眠`,`Dormant`),P(`開始吸水`,`Taking up water`),P(`膨脹、變綠`,`Swelling, greening`),P(`光合作用`,`Photosynthesis`)];
  const ACOL=[C.muted,C.cyan,C.cyan,C.green];
  const tRows=rowsOf(c,P(`雨來菇的狀態`,`Rain mushroom`),TW),aRows=ACT.map(p=>rowsOf(c,p,TW)),nA=Math.max(...aRows.map(r=>r.length));
  const sRows=rowsOf(c,P(`只學分類，\n不教採食`,`For classifying only, not for picking to eat`),TW);
  const PY=140,PH=32+tRows.length*28+44+66+110+nA*28+18+sRows.length*28;
  D.round(c,PX,PY,PW,PH,14,'rgba(11,26,21,.8)',C.edge);
  let y=PY+32;
  tRows.forEach((r,i)=>text(c,r,PM,y+i*28,22,C.white,'center'));
  y+=tRows.length*28+16;
  text(c,P(`水分`,`Water`),PX+14,y,22,'#a5dcff');
  D.round(c,PX+14,y+10,PW-28,18,9,'rgba(165,220,255,.12)',rgba('#a5dcff',.6));
  D.round(c,PX+14,y+10,Math.max(18,(PW-28)*water),18,9,'#38bdf8',null);
  y+=66;
  text(c,P(`顏色`,`Colour`),PX+14,y,22,C.white);
  const col=DRY_COL.map((v,i)=>Math.round(mix(v,WET_COL[i],w)));
  D.round(c,PX+14,y+10,PW-28,34,10,`rgb(${col})`,rgba(C.white,.6));
  const cb=clamp(1-2*w),cg=clamp(2*w-1);     // one name at a time: black-brown fades out, then green fades in
  if(cb>.02){c.save();c.globalAlpha*=cb;text(c,P(`黑褐色`,`Black-brown`),PM,y+72,22,C.muted,'center');c.restore();}
  if(cg>.02){c.save();c.globalAlpha*=cg;text(c,P(`綠色`,`Green`),PM,y+72,22,C.green,'center');c.restore();}
  y+=110;
  for(let j=0;j<N;j++){const a=A(j,.45);if(a>0){c.save();c.globalAlpha*=a;aRows[j].forEach((r,i)=>text(c,r,PM,y+i*28,22,ACOL[j],'center'));c.restore();}}
  y+=nA*28+18;
  sRows.forEach((r,i)=>text(c,r,PM,y+i*28,22,C.orange,'center'));

  // footnote
  text(c,P(`AI 教學插圖（非實拍）；大小與速度都是示意`,`AI illustration (not a photo); size and speed are schematic`),940,592,22,C.muted,'right');
}
window.MicroDraw.rain=draw;
})();

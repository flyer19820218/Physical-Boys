/* Partly shaded leaf → iodine starch test: redrawn experiment animation (teacher-authorized redo, 2026-11-17).
 * Overrides PhotosynthesisDraw.lab only. Same API and state: lab(ctx,u,lang,images), u.lab.step 0..8,
 * u.lab.motion.t / .duration. Every frame is a pure function of (step, motion t); u.t only drives the
 * flame flicker and boiling bubbles. The nine-step procedure and its science are unchanged:
 * 0 foil on both sides of an attached leaf · 1 sunlight 5–7 days (time-lapse, sunlight module)
 * 2 indoors, remove the same leaf, remove foil · 3 boiling water · 4 lamp OUT first, then ethanol in a
 * small beaker inside the hot-water bath · 5 warm rinse · 6 flat in a dish on white · 7 iodine drops
 * fall vertically · 8 exposed = blue-black (starch), shaded band = yellow-brown.
 * One camera, one bench, one leaf size: objects never jump between steps. */
(function(root){'use strict';
 const prev=root.PhotosynthesisDraw;if(!prev||!prev.sunlightKit||typeof document==='undefined')return;
 const K=prev.sunlightKit,W=960,H=620,TAU=Math.PI*2;
 const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#38bdf8',green:'#4ade80',orange:'#fb923c'};
 const tr=(l,z,e)=>l==='zh'?z:e,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
 const ease=t=>{t=clamp(t);return t*t*(3-2*t);},es=(p,a,b)=>ease((p-a)/(b-a));
 const FONT='"Noto Sans TC",Arial,sans-serif';

 /* ---------- text ---------- */
 function text(c,str,x,y,color,size=22,o={}){
  const alpha=o.alpha==null?1:o.alpha;if(alpha<=0)return;
  c.save();c.globalAlpha*=alpha;c.font=`700 ${size}px ${FONT}`;c.textAlign='center';c.textBaseline='middle';
  if(o.pill){const w=c.measureText(str).width+30,h=size+18;x=clamp(x,w/2+6,W-w/2-6);c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,h/2);c.fillStyle='rgba(11,26,21,.84)';c.fill();if(o.edge){c.strokeStyle=o.edge;c.lineWidth=1.5;c.stroke();}}
  c.fillStyle=color;c.fillText(str,x,y+1);c.restore();
 }
 const title=(c,l,z,e)=>text(c,tr(l,z,e),480,50,C.yellow,26);
 const caption=(c,l,z,e,color=C.white)=>text(c,tr(l,z,e),480,598,color,22,{pill:true});
 function pointer(c,x1,y1,x2,y2,color,alpha=1){
  if(alpha<=0)return;c.save();c.globalAlpha*=alpha;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=3;c.lineCap='round';
  c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();const a=Math.atan2(y2-y1,x2-x1);
  c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-15*Math.cos(a-.42),y2-15*Math.sin(a-.42));c.lineTo(x2-15*Math.cos(a+.42),y2-15*Math.sin(a+.42));c.closePath();c.fill();c.restore();
 }

 /* ---------- small drawing helpers ---------- */
 function grad(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);stops.forEach(([p,col])=>g.addColorStop(p,col));return g;}
 function line(c,pts,color,width=3){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function oval(c,x,y,rx,ry,fill,stroke,w=1){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
 function rr(c,x,y,w,h,r,fill,stroke,lw=1){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function scratch(w,h){const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;}
 function board(c){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);const g=c.createRadialGradient(480,290,25,480,290,580);g.addColorStop(0,'#244b3e');g.addColorStop(1,'#0b1a15');c.fillStyle=g;c.fillRect(0,0,W,H);}

 /* ---------- the leaf: sprites cut from the same plant picture ---------- */
 // Crop box in the 1024 × 1536 plant master; the leaf centre (280,620) sits at (LCX,LCY) inside it.
 const CX0=50,CY0=300,CW=464,CH=632,LCX=280-CX0,LCY=620-CY0,BAND_TOP=512,BAND_BOTTOM=731;
 const LS=.4866,LK=LS/3;            // one leaf size for the whole experiment (screen px per master px at zoom 1)
 const spriteCache=new WeakMap();
 function sprites(im){
  if(spriteCache.has(im))return spriteCache.get(im);
  const green=scratch(CW,CH),g=green.getContext('2d');g.save();g.translate(-CX0,-CY0);K.samplePath(g);g.clip();g.drawImage(im,0,0,1024,1536);g.restore();
  const pale=scratch(CW,CH),iod=scratch(CW,CH),stain=scratch(CW,CH);
  const band=y=>ease((y-(BAND_TOP-6))/12)*(1-ease((y-(BAND_BOTTOM-6))/12));
  try{
   const src=g.getImageData(0,0,CW,CH),d=src.data,P=g.createImageData(CW,CH),I=g.createImageData(CW,CH),S=g.createImageData(CW,CH);
   for(let y=0;y<CH;y++){const wb=band(y+CY0);for(let x=0;x<CW;x++){const i=(y*CW+x)*4,a=d[i+3];if(!a)continue;
    const t=clamp(((.3*d[i]+.59*d[i+1]+.11*d[i+2])/255-.14)/.42);
    // decolourised: cream · iodine without starch: yellow-brown · iodine + starch: blue-black (never pure black)
    const pc=[mix(186,247,t),mix(174,241,t),mix(118,208,t)],ic=[mix(160,234,t),mix(112,188,t),mix(44,100,t)],bc=[mix(17,66,t),mix(21,72,t),mix(42,112,t)];
    for(let k=0;k<3;k++){P.data[i+k]=pc[k];I.data[i+k]=ic[k];S.data[i+k]=mix(bc[k],ic[k],wb);}P.data[i+3]=I.data[i+3]=S.data[i+3]=a;}}
   pale.getContext('2d').putImageData(P,0,0);iod.getContext('2d').putImageData(I,0,0);stain.getContext('2d').putImageData(S,0,0);
  }catch(e){// pixel access blocked: approximate the same three looks with canvas filters
   const f=(cv,filter,tint)=>{const x=cv.getContext('2d');x.filter=filter;x.drawImage(green,0,0);x.filter='none';if(tint){x.globalCompositeOperation='source-atop';x.fillStyle=tint;x.fillRect(0,0,CW,CH);x.globalCompositeOperation='source-over';}};
   f(pale,'grayscale(1) brightness(2.1) sepia(.45)');f(iod,'grayscale(1) brightness(1.7) sepia(1) saturate(1.7)');f(stain,'grayscale(1) brightness(.6)','rgba(20,28,66,.7)');
   const x=stain.getContext('2d');x.save();x.beginPath();x.rect(0,BAND_TOP-CY0,CW,BAND_BOTTOM-BAND_TOP);x.clip();x.drawImage(iod,0,0);x.restore();
  }
  // Reminder of where the foil was: two dashed lines across the leaf.
  const marks=scratch(CW,CH),m=marks.getContext('2d');m.save();m.translate(-CX0,-CY0);K.samplePath(m);m.clip();m.setLineDash([18,13]);m.lineWidth=6;m.strokeStyle='rgba(242,236,217,.95)';
  for(const y of [BAND_TOP,BAND_BOTTOM]){m.beginPath();m.moveTo(40,y);m.lineTo(520,y);m.stroke();}m.restore();
  const out={green,pale,iod,stain,marks};spriteCache.set(im,out);return out;
 }
 // L: {x,y,plane,rot,pale,iod,stain,marks,foil}. Position is the leaf centre; plane squashes it vertically.
 function drawLeaf(c,im,L){
  const sp=sprites(im);c.save();c.translate(L.x,L.y);c.scale(1,L.plane);c.rotate(L.rot||0);c.scale(LK,LK);
  const foil=L.foil||0,slide=-(1-foil)*300;
  if(foil>0){c.save();c.globalAlpha*=foil;c.translate(slide-280,-620);rr(c,55,510,450,223,8,'#718278','#d4ddd6',3);c.restore();}
  c.drawImage(sp.green,-LCX,-LCY);
  if(L.pale>0){c.save();c.globalAlpha*=L.pale;c.drawImage(sp.pale,-LCX,-LCY);c.restore();}
  if(L.iod>0){c.save();if(L.iod<1){c.beginPath();c.arc(0,0,L.iod*440,0,TAU);c.clip();}c.drawImage(sp.iod,-LCX,-LCY);c.restore();}
  if(L.stain>0){c.save();c.globalAlpha*=L.stain;c.drawImage(sp.stain,-LCX,-LCY);c.restore();}
  if(L.marks>0){c.save();c.globalAlpha*=L.marks;c.drawImage(sp.marks,-LCX,-LCY);c.restore();}
  if(foil>0){c.save();c.globalAlpha*=foil;c.translate(slide-280,-620);K.foilFront(c,1);c.restore();}
  c.restore();
 }
 // Where the forceps hold the leaf: the petiole end, (394,437) in the master.
 function gripPoint(L){const vx=114*LK,vy=-183*LK,r=L.rot||0;return [L.x+vx*Math.cos(r)-vy*Math.sin(r),L.y+(vx*Math.sin(r)+vy*Math.cos(r))*L.plane];}
 function forceps(c,L,F){
  if(!F||F.alpha<=0)return;const k=F.size||1,[gx,gy0]=gripPoint(L),gy=gy0-F.off*k,open=F.open*7*k;
  c.save();c.globalAlpha*=F.alpha;const tx=gx+22*k,ty=gy-76*k;
  line(c,[[tx-k,ty],[gx-2*k-open,gy+3*k]],'#e6efe8',4*k);line(c,[[tx+5*k,ty+k],[gx+3*k+open,gy+2*k]],'#9fb5aa',4*k);
  line(c,[[tx+k,ty-2*k],[tx+4*k,ty-k]],'#c9d8cf',7*k);c.restore();
 }

 /* ---------- bench world (wide shot, world = screen at zoom 1) ---------- */
 const DISH={x:242,y:481,rx:70},BOTTLE_X=112;
 const LB={x:600,bottom:384,w:176,h:150,level:.68};           // large beaker = hot-water bath
 const SB={w:104,h:118,level:.72,homeX:410,homeBottom:478,bathBottom:376,liftBottom:230};  // small beaker = ethanol
 const RB={x:838,bottom:474,w:112,h:120,level:.8};            // warm-water rinse
 const TRAVEL_Y=176;                                           // carrying height: clears every rim, stays below the title
 const POS={dish:q=>({x:DISH.x,y:477,plane:q}),large:{x:LB.x,y:333,plane:.9},small:b=>({x:LB.x,y:b-44.5,plane:.78}),rinse:{x:RB.x,y:423,plane:.9}};
 const pitch=k=>mix(.34,.52,k);                                // the camera looks further down as it pushes in

 function bench(c){
  c.fillStyle=grad(c,0,428,0,548,[[0,'#b6c3bd'],[1,'#8f9f99']]);c.beginPath();c.moveTo(74,428);c.lineTo(886,428);c.lineTo(953,548);c.lineTo(7,548);c.closePath();c.fill();
  line(c,[[74,428],[886,428],[953,548],[7,548],[74,428]],'#cfd9d4',1.5);
  c.fillStyle='#1d3a31';c.fillRect(7,548,946,34);line(c,[[7,582],[953,582]],'#48685b',1.5);
  for(const x of [64,866]){c.fillStyle=grad(c,x,582,x+22,582,[[0,'#738c81'],[1,'#435e50']]);c.fillRect(x,582,22,38);}
 }
 function dish(c,q){
  const {x,y,rx}=DISH,ry=rx*q*.93;
  // white background sheet under the dish
  c.beginPath();c.moveTo(x-rx*1.22,y-ry*1.35);c.lineTo(x+rx*1.22,y-ry*1.35);c.lineTo(x+rx*1.34,y+ry*1.5);c.lineTo(x-rx*1.34,y+ry*1.5);c.closePath();
  c.fillStyle='rgba(40,62,52,.22)';c.save();c.translate(1.5,2);c.fill();c.restore();c.fillStyle=grad(c,0,y-ry*1.35,0,y+ry*1.5,[[0,'#fbfaf1'],[1,'#ecebdc']]);c.fill();
  oval(c,x+.6,y+3,rx+.6,ry,'rgba(23,44,32,.2)');oval(c,x,y+1.6,rx,ry,'#f3f4e8','#9fbdb1',1);oval(c,x,y,rx-1.6,ry-1.2,'#fbfbf2','#ffffff',.8);
  c.beginPath();c.ellipse(x,y,rx-5,ry-3.2,0,Math.PI*1.05,Math.PI*1.75);c.strokeStyle='rgba(176,205,196,.9)';c.lineWidth=.8;c.stroke();
 }
 function glassBack(c,x,bottom,w,h,liquid,level){
  const top=bottom-h,sy=bottom-h*level;
  c.fillStyle=grad(c,x-w/2,top,x+w/2,bottom,[[0,'rgba(203,243,242,.2)'],[.14,'rgba(233,255,245,.07)'],[.7,'rgba(233,255,245,.04)'],[1,'rgba(196,237,233,.26)']]);c.fillRect(x-w/2,top,w,h-3);
  c.fillStyle=liquid;c.beginPath();c.moveTo(x-w/2+3,sy);c.lineTo(x-w/2+5,bottom-7);c.quadraticCurveTo(x,bottom+5,x+w/2-5,bottom-7);c.lineTo(x+w/2-3,sy);c.closePath();c.fill();
  oval(c,x,sy,w/2-3,6,liquid);
 }
 function glassFront(c,x,bottom,w,h,liquid,level){
  const top=bottom-h,sy=bottom-h*level;
  // liquid in front of whatever is immersed, so the leaf reads as being inside it
  c.save();c.globalAlpha*=.5;c.fillStyle=liquid;c.beginPath();c.moveTo(x-w/2+3,sy);c.lineTo(x-w/2+5,bottom-7);c.quadraticCurveTo(x,bottom+5,x+w/2-5,bottom-7);c.lineTo(x+w/2-3,sy);c.closePath();c.fill();c.restore();
  c.beginPath();c.ellipse(x,sy,w/2-3,6,0,0,Math.PI);c.strokeStyle='rgba(214,244,240,.8)';c.lineWidth=1.2;c.stroke();
  c.beginPath();c.moveTo(x-w/2,top);c.lineTo(x-w/2+4,bottom-7);c.quadraticCurveTo(x,bottom+8,x+w/2-4,bottom-7);c.lineTo(x+w/2,top);c.strokeStyle='#c6eee7';c.lineWidth=2.4;c.stroke();
  oval(c,x,top,w/2,6.5,null,'#e2f5ec',2.2);
  line(c,[[x-w/2+10,top+16],[x-w/2+13,bottom-20]],'rgba(243,253,244,.6)',3);
  for(let i=0;i<4;i++)line(c,[[x+w/2-30,top+26+i*(h-52)/3],[x+w/2-14,top+26+i*(h-52)/3]],'rgba(214,238,234,.8)',1.4);
 }
 const WATER='rgba(99,206,220,.3)';
 const ethanolColour=e=>`rgba(${Math.round(mix(232,104,e))},${Math.round(mix(222,168,e))},${Math.round(mix(172,62,e))},${mix(.36,.62,e).toFixed(3)})`;
 function tripodAndLamp(c,S,ut){
  const x=LB.x,metal=grad(c,510,385,690,532,[[0,'#b6c1be'],[.25,'#485c55'],[.65,'#98aca1'],[1,'#435b4c']]);
  line(c,[[x,392],[x,520]],'#5a7165',4);line(c,[[538,392],[512,532]],metal,6);line(c,[[662,392],[688,532]],metal,6);
  // lamp
  oval(c,x,531,40,7,'rgba(29,53,36,.25)');
  oval(c,x,506,31,25,grad(c,x-31,480,x+31,530,[[0,'#d3ece1'],[.15,'#7ea899'],[.5,'#d7efe5'],[1,'#688d7e']]),'#c1d7c4',1.5);oval(c,x,512,27,15,'rgba(104,189,202,.36)');
  rr(c,x-10,471,20,15,4,grad(c,x-10,0,x+10,0,[[0,'#a67f38'],[.5,'#e5c681'],[1,'#8b682d']]),'#e4d399',1);line(c,[[x,465],[x,471]],'#e1cda0',4);
  if(S.flame>0){const f=S.flame,sw=Math.sin(ut*13)*2.5*f,fh=50*f,by=468;
   c.beginPath();c.moveTo(x-8*f,by);c.bezierCurveTo(x-16*f,by-fh*.42,x+sw,by-fh*.72,x+sw,by-fh);c.bezierCurveTo(x+12*f,by-fh*.5,x+16*f,by-fh*.22,x+7*f,by);c.closePath();
   c.fillStyle=grad(c,x,by-fh,x,by,[[0,'#ffed91'],[.5,'#ffbc58'],[1,'#ed7941']]);c.fill();oval(c,x,by-9*f,5.5*f,10*f,'#64c7e4');}
  // lamp cap: beside the lamp while it burns, on the wick once it is put out
  const e=S.cap,cx=mix(650,x,e),cy=mix(513,462,e)-Math.sin(Math.PI*e)*20;
  if(e<.02)oval(c,cx,531,15,3.5,'rgba(29,53,36,.22)');
  rr(c,cx-13,cy,26,19,5,grad(c,cx-13,0,cx+13,0,[[0,'#9fae9f'],[.5,'#e0e3cb'],[1,'#667b69']]),'#d0d9c2',1);
  // wire gauze on the tripod ring
  c.fillStyle='#596c60';c.beginPath();c.moveTo(522,385);c.lineTo(678,385);c.lineTo(696,397);c.lineTo(504,397);c.closePath();c.fill();
  for(let i=0;i<20;i++){const xx=512+i*9;line(c,[[xx,396.5],[xx+10,385.5]],'#91a299',.6);}for(let i=0;i<4;i++)line(c,[[510,387+i*3],[690,387+i*3]],'#9caf9f',.6);
 }
 function bubbles(c,S,ut){
  if(S.boil<=0)return;c.save();c.globalAlpha*=S.boil;
  for(let i=0;i<14;i++){const rise=(ut*42+i*23)%92,bx=LB.x-66+((i*37)%132)+Math.sin(ut*3+i)*2;oval(c,bx,376-rise,1.6+i%3,1.6+i%3,'rgba(226,248,242,.55)');}c.restore();
 }
 function bottle(c,dropperOut){
  const x=BOTTLE_X;oval(c,x,500,31,5,'rgba(29,53,36,.22)');
  rr(c,x-29,440,58,60,9,grad(c,x-29,0,x+29,0,[[0,'#80541e'],[.18,'#ba8740'],[.45,'#e0b364'],[.65,'#a1752e'],[1,'#684615']]),'#cdb87d',1);
  rr(c,x-13,428,26,14,3,'#9c7834','#d7c789',1);rr(c,x-20,458,40,26,3,'#f2e7bf');line(c,[[x-12,471],[x+12,471]],'#956e2d',2.2);
  if(dropperOut)oval(c,x,428.5,10,2.4,'#5d4212','#d7c789',.8);
 }
 // Dropper: rubber bulb + collar + glass tube; (x,tipY) is the tip.
 function dropper(c,x,tipY,squeeze){
  c.beginPath();c.moveTo(x-3.4,tipY-40);c.lineTo(x+3.4,tipY-40);c.lineTo(x+1.1,tipY);c.lineTo(x-1.1,tipY);c.closePath();c.fillStyle='rgba(206,239,230,.38)';c.fill();c.strokeStyle='#d6efe6';c.lineWidth=.8;c.stroke();
  c.beginPath();c.moveTo(x-2.2,tipY-26);c.lineTo(x+2.2,tipY-26);c.lineTo(x+.7,tipY-1.5);c.lineTo(x-.7,tipY-1.5);c.closePath();c.fillStyle='#b9772a';c.fill();
  rr(c,x-11,tipY-46,22,6,2,'#3f564b','#8fa99b',.7);const bw=9-2.2*squeeze;rr(c,x-bw,tipY-64,bw*2,19,7,grad(c,x-9,0,x+9,0,[[0,'#3f564b'],[.45,'#6b8779'],[1,'#33483e']]),'#8fa99b',.7);
 }
 function tongs(c,x,top,alpha){
  if(alpha<=0)return;c.save();c.globalAlpha*=alpha;
  line(c,[[x-SB.w/2-1,top+5],[x-16,top-30],[x-5,top-34]],'#dbe6de',3.2);line(c,[[x+SB.w/2+1,top+5],[x+16,top-30],[x+5,top-34]],'#a9bdb2',3.2);rr(c,x-7,top-38,14,8,3,'#8ea69a');c.restore();
 }
 function benchLabels(c,l,S){
  const y=565,a=S.labels;if(a<=0)return;
  const put=(z,e,x,color,alpha=1)=>text(c,tr(l,z,e),x,y,color,22,{alpha:a*alpha});
  put('碘液','Iodine',BOTTLE_X,C.yellow,S.gear);put('培養皿','Dish',DISH.x,C.white);
  const away=clamp(Math.abs(S.small.x-SB.homeX)/60);
  put('酒精','Ethanol',SB.homeX,C.orange,S.gear*(1-away));
  put('熱水浴','Hot-water bath',LB.x,C.cyan,S.gear*(1-S.bath));put('酒精＋熱水浴','Ethanol in hot bath',LB.x,C.orange,S.gear*S.bath);
  put('熱水沖洗','Warm rinse',RB.x,C.cyan,S.gear);
 }
 // Everything on the bench, in world coordinates. S is a plain state object (see restState / motionState).
 function world(c,l,im,S,ut){
  bench(c);benchLabels(c,l,S);dish(c,S.q);
  const L=S.leaf,ink=S.leafIn,g=S.gear;
  const leaf=()=>{if(L)drawLeaf(c,im,L);};
  c.save();c.globalAlpha*=g;
  // while the dropper is in (or straight above) the bottle its tube is behind the amber glass
  const D=S.drop,overBottle=!D.out||Math.abs(D.x-BOTTLE_X)<.5;
  if(overBottle)dropper(c,BOTTLE_X,D.out?D.tipY:468,0);bottle(c,D.out);
  tripodAndLamp(c,S,ut);
  const sm=S.small,eth=ethanolColour(S.eth),smTop=sm.bottom-SB.h;
  const small=()=>{glassBack(c,sm.x,sm.bottom,SB.w,SB.h,eth,SB.level);if(ink==='small')leaf();glassFront(c,sm.x,sm.bottom,SB.w,SB.h,eth,SB.level);tongs(c,sm.x,smTop,sm.tongs);};
  glassBack(c,LB.x,LB.bottom,LB.w,LB.h,WATER,LB.level);bubbles(c,S,ut);
  if(ink==='large')leaf();if(sm.inBath)small();
  glassFront(c,LB.x,LB.bottom,LB.w,LB.h,WATER,LB.level);
  glassBack(c,RB.x,RB.bottom,RB.w,RB.h,WATER,RB.level);if(ink==='rinse')leaf();glassFront(c,RB.x,RB.bottom,RB.w,RB.h,WATER,RB.level);
  if(!sm.inBath)small();
  c.restore();
  if(L&&!ink){if(S.onDish)oval(c,L.x+1,L.y+2.5,34,48*L.plane*.55,'rgba(40,62,52,.16)');leaf();}
  if(L)forceps(c,L,S.forceps);
  if(D.out&&!overBottle)dropper(c,D.x,D.tipY,D.squeeze);for(const d of D.drops)oval(c,d.x,d.y,1.7,2.6,'#b9772a');
 }

 /* ---------- states ---------- */
 // The scene exactly as it stands BEFORE the action of `step` (3..8) = after the action of step-1.
 function restState(step){
  const later=step>=5;
  return {q:pitch(step>=7?1:0),cam:step>=7?1:0,gear:1,labels:step>=7?0:1,flame:later?0:1,cap:later?1:0,boil:later?0:1,bath:later?1:0,eth:later?1:0,
   small:{x:later?LB.x:SB.homeX,bottom:later?SB.bathBottom:SB.homeBottom,tongs:0,inBath:later},
   leaf:{...(step===4?POS.large:step===5?POS.small(SB.bathBottom):step===6?POS.rinse:POS.dish(pitch(step>=7?1:0))),rot:0,pale:later?1:0,iod:step===8?1:0,stain:step===8?1:0,marks:step===8?0:.7,foil:0},
   leafIn:step===4?'large':step===5?'small':step===6?'rinse':null,onDish:step===3||step>=7,forceps:null,
   drop:{out:false,x:BOTTLE_X,tipY:468,squeeze:0,drops:[]},result:step===8?1:0};
 }
 // Forceps carry: reach → grip → lift straight up → travel above the rims → lower straight down → release.
 function carry(S,p,T,A,B,inA,inB,rimA,rimB){
  const [t0,t1,t2,t3,t4,t5,t6]=T,up=es(p,t1,t2),tv=es(p,t2,t3),dn=es(p,t3,t4),L=S.leaf;
  L.x=mix(A.x,B.x,tv);L.y=p<t2?mix(A.y,TRAVEL_Y,up):p<t3?TRAVEL_Y:mix(TRAVEL_Y,B.y,dn);L.plane=p<t2?mix(A.plane,1,up):p<t3?1:mix(1,B.plane,dn);
  // the limp leaf trails slightly behind while it is carried sideways
  L.rot=.09*Math.sin(Math.PI*clamp((p-t2)/(t3-t2)))*(B.x>A.x?-1:1);
  const inn=es(p,t0,t1),out=es(p,t5,t6);S.forceps={alpha:inn*(1-out),off:(1-inn)*40+out*40,open:p<t1?1-es(p,mix(t0,t1,.55),t1):es(p,t5,mix(t5,t6,.45))};
  S.leafIn=p<t2?(inA&&L.y>rimA?inA:null):p>=t3?(inB&&L.y>rimB?inB:null):null;S.onDish=false;
 }
 function motionState(step,p){
  const S=restState(step),L=S.leaf;
  if(step===3){
   carry(S,p,[0,.1,.26,.5,.68,.72,.8],POS.dish(S.q),POS.large,null,'large',0,LB.bottom-LB.h+12);
   S.onDish=p<.1;const sway=es(p,.72,.8)*(1-es(p,.9,1));L.y+=1.6*sway*Math.sin(p*70);L.rot+=.05*sway*Math.sin(p*46);
  }else if(step===4){
   // 1) lamp out FIRST  2) leaf lifted out, ethanol beaker set into the hot bath  3) leaf into the ethanol  4) chlorophyll leaves the leaf
   S.cap=es(p,.02,.12);S.flame=1-es(p,.05,.12);S.boil=1-es(p,.1,.3);
   const sm=S.small,lift=es(p,.2,.3),tv=es(p,.3,.42),dn=es(p,.42,.52);
   sm.x=mix(SB.homeX,LB.x,tv);sm.bottom=p<.3?mix(SB.homeBottom,SB.liftBottom,lift):mix(SB.liftBottom,SB.bathBottom,dn);sm.inBath=p>=.42;sm.tongs=es(p,.15,.2)*(1-es(p,.52,.57));S.bath=es(p,.42,.52);
   const A=POS.large,B=POS.small(SB.bathBottom),up=es(p,.16,.26),side=es(p,.26,.34)-es(p,.52,.6),down=es(p,.6,.72);
   L.x=LB.x+112*side;L.y=p<.4?mix(A.y,TRAVEL_Y,up):mix(TRAVEL_Y,B.y,down);L.plane=p<.4?mix(A.plane,1,up):mix(1,B.plane,down);L.rot=-.07*Math.sin(Math.PI*clamp((p-.26)/.34));
   const inn=es(p,.1,.16),out=es(p,.73,.79);S.forceps={alpha:inn*(1-out),off:(1-inn)*40+out*40,open:p<.16?1-es(p,.13,.16):es(p,.73,.76)};
   S.leafIn=p<.4?(L.y>LB.bottom-LB.h+12?'large':null):(L.y>SB.bathBottom-SB.h+12?'small':null);
   S.eth=es(p,.76,1);L.pale=es(p,.78,1);
  }else if(step===5){
   carry(S,p,[0,.08,.24,.48,.66,.9,.97],POS.small(SB.bathBottom),POS.rinse,'small','rinse',SB.bathBottom-SB.h+12,RB.bottom-RB.h+12);
   const swish=es(p,.68,.74)*(1-es(p,.86,.92));L.x+=7*swish*Math.sin((p-.68)*TAU*9);L.rot+=.06*swish*Math.sin((p-.68)*TAU*9+1);
  }else if(step===6){
   const k=es(p,.72,1);S.cam=k;S.q=pitch(k);S.labels=1-es(p,.62,.72);
   carry(S,p,[0,.08,.2,.46,.62,.64,.71],POS.rinse,POS.dish(S.q),'rinse',null,RB.bottom-RB.h+12,0);
   if(p>=.62){L.plane=S.q;S.onDish=true;}
  }else if(step===7){
   // dropper leaves the bottle, stops above the leaf, three drops fall straight down, dropper returns
   const up=es(p,.04,.16)-es(p,.88,.97),over=es(p,.16,.34)-es(p,.72,.88),D=S.drop,times=[.38,.48,.58],fall=.075;
   D.out=p>.03&&p<.985;D.x=mix(BOTTLE_X,DISH.x,over);D.tipY=mix(468,426,up);
   for(const t0 of times){const f=(p-t0)/fall;if(f>0&&f<1)D.drops.push({x:DISH.x,y:mix(428,L.y-2,f*f)});D.squeeze=Math.max(D.squeeze,1-Math.abs((p-t0+.012)/.03));}
   D.squeeze=clamp(D.squeeze);
   L.iod=es(p,.45,.78);L.stain=es(p,.6,.92);L.marks=.7*(1-es(p,.55,.75));S.result=es(p,.93,1);
  }
  return S;
 }
 // Camera for steps 6–8: push in on the dish (bottle stays in view on the left).
 const camera=k=>({z:1+2.1*k,ax:DISH.x,ay:DISH.y,sx:mix(DISH.x,560,k),sy:mix(DISH.y,455,k)});
 const applyCamera=(c,m)=>{c.translate(m.sx,m.sy);c.scale(m.z,m.z);c.translate(-m.ax,-m.ay);};
 const toScreen=(m,x,y)=>[(x-m.ax)*m.z+m.sx,(y-m.ay)*m.z+m.sy];

 const TITLES=[null,null,null,['沸水軟化葉片','Boiling water softens the leaf'],['酒精隔水加熱 → 葉片褪色','Ethanol bath: the leaf loses its green'],['熱水沖洗','Warm-water rinse'],['平放在白色背景的培養皿','Flat in a dish on a white background'],['滴碘液','Add iodine solution'],['結果：受光區變藍黑色','Result: exposed areas turn blue-black']];
 function labCaption(c,l,step,p){
  if(step===3)caption(c,l,'鑷子夾葉 → 放入沸水：葉片失去活性並軟化','Forceps → boiling water: kills and softens the leaf');
  else if(step===4){if(p<.14)caption(c,l,'① 先蓋熄酒精燈','① Put out the alcohol lamp first',C.orange);else if(p<.75)caption(c,l,'② 葉片移入酒精；小燒杯只靠熱水加熱，不可直接加熱酒精','② Leaf into ethanol, warmed only by hot water, never by a flame',C.orange);else caption(c,l,'③ 葉綠素溶入酒精 → 葉片褪色','③ Chlorophyll dissolves into the ethanol → the leaf turns pale');}
  else if(step===5)caption(c,l,'用熱水沖洗：洗去酒精，葉片變軟','Warm-water rinse: removes ethanol and softens the leaf');
  else if(step===6)caption(c,l,'平放在白色背景的培養皿上，準備檢驗','Lay the leaf flat in a dish on a white background');
  else if(step===7&&p<.93)caption(c,l,'滴管懸在葉片正上方，碘液垂直滴下','Dropper held above the leaf; iodine falls straight down');
  else caption(c,l,'碘液驗澱粉 · 不是直接檢驗葡萄糖','Iodine tests for starch, not glucose directly');
 }
 function resultLabels(c,l,m,L,a){
  if(a<=0)return;const at=(mx,my)=>toScreen(m,L.x+(mx-280)*LK,L.y+(my-620)*LK*L.plane);
  const e=at(300,418),b=at(432,622);
  text(c,tr(l,'受光區 → 藍黑色：有澱粉','Exposed → blue-black: starch present'),590,126,C.cyan,24,{alpha:a});pointer(c,585,148,e[0],e[1]-6,C.cyan,a);
  text(c,tr(l,'遮光區 → 黃褐色','Shaded → yellow-brown'),800,232,C.orange,24,{alpha:a});pointer(c,790,252,b[0]+8,b[1]-6,C.orange,a);
 }
 function labScene(c,u,l,images,step,p,moving){
  const S=moving?motionState(step,p):restState(step),m=camera(S.cam);
  board(c);c.save();applyCamera(c,m);world(c,l,images.pottedPlant,S,u.t||0);c.restore();
  title(c,l,...TITLES[step]);resultLabels(c,l,m,S.leaf,S.result);labCaption(c,l,step,moving?p:0);
 }

 /* ---------- step 0: foil goes on, outdoors, leaf still attached ---------- */
 const SAMPLE=[K.PLACE.x+(105+16)*K.PLACE.scale,K.PLACE.y+(232+8)*K.PLACE.scale];   // sample-leaf centre on screen
 function foilScene(c,u,l,images,p,moving){
  const item=K.prepare(c,images),k=moving?es(p,0,.16)*(1-es(p,.86,1)):0;
  const back=moving?es(p,.14,.3):0,slide=moving?-(1-es(p,.14,.34))*70:0,front=moving?es(p,.4,.82):0;
  const z=1+.4*k,sx=mix(SAMPLE[0],300,k),sy=mix(SAMPLE[1],310,k);
  c.setTransform(1,0,0,1,0,0);c.save();c.translate(sx,sy);c.scale(z,z);c.translate(-SAMPLE[0],-SAMPLE[1]);
  K.outdoor(c,l,images,{p:0,t:0,texture:K.variant(item,front,back,false,slide),captions:false});c.restore();
  title(c,l,'在盆栽上，貼雙面鋁箔','Cover both sides of an attached leaf with foil');
  text(c,tr(l,'葉片留在植株上','The leaf stays on the plant'),790,250,C.green,24,{pill:true,alpha:k});
  if(p<.38)text(c,tr(l,'① 背面先墊鋁箔','① Foil behind the leaf'),790,318,C.white,24,{pill:true,alpha:k});
  else text(c,tr(l,'② 再蓋住正面','② Then cover the front'),790,318,C.white,24,{pill:true,alpha:k});
  caption(c,l,'雙面遮光：這一段葉片照不到光','Both sides covered: this band gets no light');
 }

 /* ---------- step 2: garden → bench, take the same leaf, remove the foil ---------- */
 const PS=K.PLACE.scale/2,PB=[560,545];                         // plant scale and pot-base point on the bench (world)
 const PORIGIN=[PB[0]-208*PS,PB[1]-574*PS];                     // top-left of the plant sprite in the world
 const ON_PLANT={x:PORIGIN[0]+(105+16)*PS,y:PORIGIN[1]+(232+8)*PS},WORK={x:445,y:385};
 const camera2=k=>({z:1+k,ax:PB[0],ay:PB[1],sx:mix(PB[0],K.PLACE.x+208*K.PLACE.scale,k),sy:mix(PB[1],K.PLACE.y+574*K.PLACE.scale,k)});
 let layer=null;
 function indoorScene(c,u,l,images,p){
  const item=K.prepare(c,images),a=es(p,0,.2),k=1-es(p,.62,.84),m=camera2(k),S=restState(3);
  S.gear=es(p,.62,.84);S.forceps=null;S.leaf=null;
  const detached=p>=.3,leave=es(p,.66,.82);
  // 1) the garden, fading out under the bench (same plant pose, so there is no double image)
  c.setTransform(1,0,0,1,0,0);
  const amp=1-a;
  if(a<1)K.outdoor(c,l,images,{p:1,t:6,amp,captions:false});
  // 2) the laboratory, on its own layer so it can cross-fade as one picture
  if(!layer)layer=scratch(W,H);const lc=layer.getContext('2d');board(lc);lc.save();applyCamera(lc,m);
  if(detached){const go=es(p,.32,.46),put=es(p,.64,.86),L={x:mix(mix(ON_PLANT.x,WORK.x,go),DISH.x,put),y:mix(mix(ON_PLANT.y,WORK.y,go),477,put),plane:mix(1,S.q,es(p,.72,.86)),rot:.06*Math.sin(Math.PI*clamp((p-.64)/.22)),pale:0,iod:0,stain:0,marks:.7*es(p,.56,.66),foil:1-es(p,.48,.62)};S.leaf=L;S.onDish=p>.84;}
  const grip=S.leaf||{x:ON_PLANT.x,y:ON_PLANT.y,plane:1,rot:0},inn=es(p,.2,.28),out=es(p,.88,.95);
  const F={alpha:inn*(1-out),off:(1-inn)*40+out*40,open:p<.3?1-es(p,.25,.3):es(p,.88,.91),size:mix(1,.62,k)};
  // bench first, then the plant, then leaf + forceps in front of it
  const leafHold=S.leaf;S.leaf=null;world(lc,l,images.pottedPlant,S,u.t||0);
  if(leave<1){const light=K.lighting(1),frame=K.plantFrame(item,6,{...light,direct:light.direct*(1-a)},{texture:detached?K.variant(item,0,0,true,0):item.texture,amp});
   lc.save();lc.globalAlpha=1-leave;const ox=leave*150;oval(lc,PB[0]+ox,PB[1],33,4.5,'rgba(21,39,26,.3)');lc.drawImage(frame,PORIGIN[0]+ox,PORIGIN[1],frame.width*PS,frame.height*PS);lc.restore();}
  if(leafHold)drawLeaf(lc,images.pottedPlant,leafHold);forceps(lc,grip,F);
  lc.restore();
  c.save();c.globalAlpha=a;c.drawImage(layer,0,0);c.restore();
  title(c,l,'搬進實驗室 → 取葉、除鋁箔','Bring indoors → remove the leaf and foil');
  if(p<.2)caption(c,l,'把盆栽搬進實驗室','Bring the potted plant indoors');
  else if(p<.47)caption(c,l,'用鑷子取下同一片葉','Remove the same leaf with forceps');
  else if(p<.64)caption(c,l,'除去鋁箔，記住遮光的位置','Remove the foil; remember where it was');
  else caption(c,l,'葉片放到培養皿上','Place the leaf in the dish');
 }

 function lab(c,u,l,images={}){
  const step=u.lab.step,m=u.lab.motion,p=m?clamp(m.t/m.duration):0;
  if(!images.pottedPlant||!images.sunlitGarden||!K.prepare(c,images)){prev.lab(c,u,l,images);return;}
  if(step===0)foilScene(c,u,l,images,p,!!m);
  else if(step===1||(step===2&&!m))prev.lab(c,u,l,images);       // time-lapse and its held last frame (sunlight module)
  else if(step===2)indoorScene(c,u,l,images,p);
  else labScene(c,u,l,images,Math.min(step,8),p,!!m&&step<8);
 }
 root.PhotosynthesisDraw={...prev,lab,labFable:{restState,motionState,camera,LS}};
})(typeof window==='object'?window:globalThis);

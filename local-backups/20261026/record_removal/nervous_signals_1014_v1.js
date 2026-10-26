/* Nerve signals · teacher-requested V5 remake, 2026-10-14.
 * Same five tabs, hooks and cover as nervous_signals_1009_v1.js. Every picture
 * is an original cartoon drawn here (no textbook or AI raster figures). Faces
 * are decoration. The reaction task keeps its original timing logic.
 * Times, sizes and paths are teaching models, not measurements.
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',
  ink:'#0b1a15',skin:'#f6d2b0',skinDark:'#dfa982',hair:'#5b3a29',brain:'#f4a6b8',nerve:'#f6c453',shirt:'#3fb3a3',receptor:'#ffd84d'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mod=(n,d=1)=>((n%d)+d)%d,mix=(a,b,u)=>a+(b-a)*u;

// ── small cartoon kit ──────────────────────────────────────────────────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function text(c,p,x,y,size=22,color=C.white,align='left'){c.save();c.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function wrap(c,p,x,y,w,size=22,color=C.white){return D.wrap(c,p,x,y,w,{size,color,line:size*1.38});}
function eyes(c,x,y,s,mood='happy',look=[0,0]){
  for(const side of [-1,1]){const ex=x+side*s*1.18;
    if(mood==='closed'){c.beginPath();c.arc(ex,y-s*.2,s*.75,.15*Math.PI,.85*Math.PI);c.strokeStyle=C.ink;c.lineWidth=s*.34;c.lineCap='round';c.stroke();continue;}
    ellipse(c,ex,y,s*.86,s,'#fbfdfb',C.ink,Math.max(1.6,s*.2));
    const pr=mood==='surprised'?s*.36:s*.55;circle(c,ex+look[0]*s*.28,y+look[1]*s*.3,pr,C.ink);circle(c,ex+look[0]*s*.28-pr*.35,y+look[1]*s*.3-pr*.4,pr*.38,'#ffffff');
    if(mood==='hot')line(c,[[ex+side*s*1.05,y-s*1.12],[ex-side*s*.75,y-s*1.55]],C.ink,s*.3);
  }
}
function smile(c,x,y,w,open=false){c.save();c.strokeStyle=C.ink;c.lineWidth=Math.max(2,w*.18);c.lineCap='round';
  if(open){c.beginPath();c.arc(x,y-w*.15,w*.55,.1*Math.PI,.9*Math.PI);c.closePath();c.fillStyle='#8a2f3c';c.fill();c.stroke();}
  else{c.beginPath();c.arc(x,y-w*.32,w*.55,.18*Math.PI,.82*Math.PI);c.stroke();}c.restore();}
function sparkle(c,x,y,s,color=C.yellow){c.save();c.translate(x,y);c.beginPath();for(let i=0;i<8;i++){const r=i%2?s*.32:s,a=i*Math.PI/4-Math.PI/2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fillStyle=color;c.fill();c.restore();}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(85,233,255,0)');c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function pathLength(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
function along(pts,u){const L=pathLength(pts);let d=clamp(u)*L;for(let i=1;i<pts.length;i++){const s=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(d<=s||i===pts.length-1){const f=s?Math.min(1,d/s):0;return[mix(pts[i-1][0],pts[i][0],f),mix(pts[i-1][1],pts[i][1],f)];}d-=s;}return pts[pts.length-1];}
// A nerve signal: a glowing dot that travels; it marks the message, not a moving substance.
function signal(c,pts,u,r=9){if(u<0||u>1)return;const [x,y]=along(pts,u);glow(c,x,y,r*2.6);D.sphere(c,x,y,r,C.cyan);}
function nerveLine(c,pts,w=7){line(c,pts,C.ink,w+4);line(c,pts,C.nerve,w);}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(11,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function brain(c,x,y,s,active){
  if(active)glow(c,x,y,s*1.6,C.cyan,.6);
  c.save();c.translate(x,y);
  c.beginPath();c.moveTo(-s*.95,s*.15);c.bezierCurveTo(-s*1.1,-s*.6,-s*.35,-s*.95,0,-s*.7);c.bezierCurveTo(s*.4,-s*1,s*1.15,-s*.55,s*.95,s*.15);c.bezierCurveTo(s*1,s*.65,s*.2,s*.8,0,s*.55);c.bezierCurveTo(-s*.3,s*.85,-s*1,s*.65,-s*.95,s*.15);c.closePath();
  c.fillStyle=C.brain;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  for(const [a,b,d] of [[-.55,-.35,.25],[-.2,.05,.2],[.3,-.4,.22],[.45,.15,.2],[-.6,.3,.18]]){c.beginPath();c.arc(a*s,b*s,d*s,.2,2.6);c.strokeStyle='#c76f86';c.lineWidth=2.5;c.stroke();}
  c.restore();
}
function splitLines(c,str,maxW,size=22){
  c.save();c.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
  const isEn=/[A-Za-z]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9]+(?:['’–-][A-Za-z0-9]+)*|\s+|[^A-Za-z0-9\s]/g)||[]):Array.from(str);
  const rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());
  c.restore();return rows;
}
function node(c,p,x,y,w,h,active,color=C.cyan){
  D.round(c,x,y,w,h,14,active?color:C.panel,active?C.white:'#47675d');
  const rows=splitLines(c,D.tr(p),w-12,22),lh=27,y0=y+h/2-(rows.length-1)*lh/2+8;
  rows.forEach((r,i)=>text(c,r,x+w/2,y0+i*lh,22,active?C.deep:C.white,'center'));
}
function measure(c,str,size){c.save();c.font=`700 ${size}px "Noto Sans TC"`;const w=c.measureText(str).width;c.restore();return w;}
function panel(c,x,y,w,h,fill=C.panel){D.round(c,x,y,w,h,16,fill,'#47675d');}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
const stepControls=names=>choice(P('訊息位置','Signal position'),'step',[[-1,P('連續觀察','Continuous')],...names.map((p,i)=>[i,p])]);

// ── Tab 1: stimuli and receptors ───────────────────────────────────────────
const senses=[
 {name:P('眼','Eye'),stim:P('光','Light'),rec:P('視網膜受器','Retinal receptors'),loc:P('視網膜上的受器接收光刺激。眼是感覺器官，受器不是整顆眼睛。','Receptors in the retina detect light. The eye is a sense organ; receptors are not the entire eye.')},
 {name:P('耳','Ear'),stim:P('聲音','Sound'),rec:P('內耳受器','Inner-ear receptors'),loc:P('聲波使耳內構造振動，內耳的受器接收刺激，再傳送神經訊息。','Sound causes vibrations. Receptors in the inner ear detect them and send nerve signals.')},
 {name:P('鼻','Nose'),stim:P('氣味','Odour'),rec:P('嗅覺受器','Smell receptors'),loc:P('鼻腔上方嗅黏膜中的受器，接收氣味物質的化學刺激。','Receptors in the olfactory lining at the top of the nasal cavity detect odour chemicals.')},
 {name:P('舌','Tongue'),stim:P('味道','Taste'),rec:P('味蕾受器','Taste-bud receptors'),loc:P('味蕾中的受器接收溶在唾液中的物質，不是舌頭每個部位只能感覺一種味道。','Taste-bud receptors detect substances dissolved in saliva. Tongue regions are not restricted to single tastes.')},
 {name:P('皮膚','Skin'),stim:P('溫度、觸碰與壓力','Heat, touch, pressure'),node:P('冷熱觸壓','Heat, touch'),rec:P('皮膚受器','Skin receptors'),loc:P('皮膚中有不同的受器，能接收溫度、碰觸、壓力及傷害等刺激。','Different skin receptors detect temperature, touch, pressure and potentially damaging stimuli.')}
];
// No person: five sense-organ tiles. Tap one to zoom into its receptors.
const ORGAN_TILES=[[30,62,199,140],[241,62,199,140],[30,214,199,140],[241,214,199,140],[30,366,410,140]];
function iconEye(c,x,y,t){
  circle(c,x+70,y-30,10,C.yellow,C.ink,2);for(let i=0;i<8;i++){const a=i*TAU/8+t*.3;line(c,[[x+70+Math.cos(a)*14,y-30+Math.sin(a)*14],[x+70+Math.cos(a)*19,y-30+Math.sin(a)*19]],C.yellow,2);}
  c.save();c.setLineDash([5,5]);c.lineDashOffset=-t*18;line(c,[[x+60,y-22],[x+6,y-2]],'rgba(253,224,71,.8)',2);c.restore();
  c.beginPath();c.moveTo(x-50,y);c.quadraticCurveTo(x,y-40,x+50,y);c.quadraticCurveTo(x,y+40,x-50,y);c.closePath();
  c.fillStyle='#f6f3ea';c.fill();c.save();c.clip();circle(c,x,y,18,'#5aa9e6',C.ink,2.5);circle(c,x,y,8,C.ink);circle(c,x-6,y-6,4,'#ffffff');c.restore();
  c.beginPath();c.moveTo(x-50,y);c.quadraticCurveTo(x,y-40,x+50,y);c.quadraticCurveTo(x,y+40,x-50,y);c.closePath();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  for(const k of [-.55,-.2,.2,.55])line(c,[[x+k*50,y-20+Math.abs(k)*12],[x+k*62,y-30+Math.abs(k)*10]],C.ink,3);
}
function iconEar(c,x,y,t){
  for(let i=0;i<3;i++){const r=14+((t*30+i*14)%42);c.beginPath();c.arc(x-84,y+4,r,-.55,.55);c.strokeStyle=`rgba(253,224,71,${Math.max(0,1-r/58)})`;c.lineWidth=3;c.stroke();}
  c.beginPath();c.moveTo(x+6,y-44);c.bezierCurveTo(x+40,y-48,x+46,y-8,x+32,y+12);c.bezierCurveTo(x+22,y+28,x+12,y+26,x+10,y+40);c.bezierCurveTo(x+6,y+52,x-14,y+50,x-16,y+34);
  c.bezierCurveTo(x-18,y+16,x-30,y+8,x-30,y-12);c.bezierCurveTo(x-30,y-34,x-18,y-44,x+6,y-44);c.closePath();c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  c.beginPath();c.moveTo(x-12,y-26);c.bezierCurveTo(x+14,y-36,x+28,y-10,x+16,y+6);c.bezierCurveTo(x+8,y+16,x-2,y+10,x,y);c.strokeStyle=C.skinDark;c.lineWidth=4;c.lineCap='round';c.stroke();
  ellipse(c,x-6,y+8,7,9,'#b9785a',C.ink,2);
}
function iconNose(c,x,y,t){
  c.save();
  // Unified front/3/4 cute nose: smooth rounded bridge top + nose tip + left/right nostril wings (鼻翼)
  const g=c.createRadialGradient(x-4,y+10,4,x,y+10,38);
  g.addColorStop(0,'#fde8d2');g.addColorStop(1,C.skin);
  c.beginPath();
  c.moveTo(x-14,y-36);
  c.quadraticCurveTo(x,y-42,x+14,y-36);
  c.quadraticCurveTo(x+11,y-14,x+19,y+2);
  c.bezierCurveTo(x+38,y+10,x+38,y+32,x+19,y+34);
  c.quadraticCurveTo(x+9,y+35,x,y+39);
  c.quadraticCurveTo(x-9,y+35,x-19,y+34);
  c.bezierCurveTo(x-38,y+32,x-38,y+10,x-19,y+2);
  c.quadraticCurveTo(x-11,y-14,x-14,y-36);
  c.closePath();
  c.fillStyle=g;c.fill();
  // Soft shadow along the underside of the nose tip and wings
  c.beginPath();c.ellipse(x,y+28,24,8,0,0,TAU);c.fillStyle='rgba(201,140,104,.38)';c.fill();
  // Outer nose contour (leaving the very top brow transition soft)
  c.beginPath();
  c.moveTo(x-14,y-36);
  c.quadraticCurveTo(x-11,y-14,x-19,y+2);
  c.bezierCurveTo(x-38,y+10,x-38,y+32,x-19,y+34);
  c.quadraticCurveTo(x-9,y+35,x,y+39);
  c.quadraticCurveTo(x+9,y+35,x+19,y+34);
  c.bezierCurveTo(x+38,y+32,x+38,y+10,x+19,y+2);
  c.quadraticCurveTo(x+11,y-14,x+14,y-36);
  c.strokeStyle=C.ink;c.lineWidth=3;c.lineCap='round';c.lineJoin='round';c.stroke();
  // Alar grooves separating the round nose tip (鼻頭) from the side wings (鼻翼)
  c.beginPath();c.arc(x-14,y+18,10,1.2*Math.PI,1.82*Math.PI);c.strokeStyle=C.skinDark;c.lineWidth=2.5;c.stroke();
  c.beginPath();c.arc(x+14,y+18,10,1.18*Math.PI,1.8*Math.PI);c.stroke();
  // Nose bridge & tip 3D highlight
  line(c,[[x,y-28],[x,y+4]],'rgba(255,252,246,.7)',4.5);
  circle(c,x,y+16,8.5,'rgba(255,252,246,.6)');
  // Teardrop nostrils tucked under the nose tip
  ellipse(c,x-14,y+28,7,4,'#4a2518',C.ink,1.8,.3);
  ellipse(c,x+14,y+28,7,4,'#4a2518',C.ink,1.8,-.3);
  c.restore();
  const cols=['#fb923c','#f472b6','#a78bfa','#4ade80'];
  for(let i=0;i<4;i++){const side=i%2?1:-1,u=mod(t*.4+i*.25),px=mix(x+side*74,x+side*14,u),py=mix(y+42,y+29,u)+Math.sin(u*TAU)*5;c.save();c.globalAlpha=1-u*.55;circle(c,px,py,5,cols[i],C.ink,1.5);c.restore();}
}
function iconTongue(c,x,y,t){
  D.round(c,x-46,y-38,92,16,8,'#8a2f3c',C.ink);
  c.beginPath();c.moveTo(x-38,y-26);c.lineTo(x+38,y-26);c.bezierCurveTo(x+46,y+10,x+30,y+42,x,y+42);c.bezierCurveTo(x-30,y+42,x-46,y+10,x-38,y-26);c.closePath();
  c.fillStyle='#f48fa6';c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  line(c,[[x,y-18],[x,y+22]],'#d9668a',3);
  for(const [dx,dy] of [[-22,-10],[-14,6],[-20,20],[22,-10],[14,6],[20,20],[-8,-14],[8,-14]])circle(c,x+dx,y+dy,3.5,'#f9c0cf');
  const u=mod(t*.5);c.save();c.globalAlpha=1-u*.5;sweatDrop(c,x+62,mix(y-36,y-6,u),7);c.restore();
}
function iconSkin(c,x,y,t){
  for(let i=0;i<3;i++){const yy=y-44+i*12;c.beginPath();for(let xx=x-60;xx<=x+60;xx+=6)c.lineTo(xx,yy+Math.sin(xx*.2+t*4)*3);c.strokeStyle='rgba(251,146,60,.75)';c.lineWidth=3;c.stroke();}
  D.round(c,x-72,y-8,144,18,4,'#f1c9a5',C.ink);D.round(c,x-72,y+10,144,44,4,'#e8a9a1',C.ink);
  for(const hx of [x-44,x+38])line(c,[[hx,y+30],[hx+4,y-8],[hx+12,y-26]],'#5b3a29',3);
  line(c,[[x-6,y+6],[x-2,y+30],[x+60,y+44]],C.ink,7);line(c,[[x-6,y+6],[x-2,y+30],[x+60,y+44]],SENSE_COL,4);
  sparkle(c,x-6,y+4,9+Math.sin(t*4)*2,C.yellow);
}
const ORGAN_ICONS=[iconEye,iconEar,iconNose,iconTongue,iconSkin];
function organTile(c,i,t,sel){
  const [x,y,w,h]=ORGAN_TILES[i],q=senses[i];
  if(sel){c.save();c.shadowColor='rgba(253,224,71,.55)';c.shadowBlur=18;D.round(c,x,y,w,h,16,'#24493f');c.restore();c.save();c.lineWidth=4;c.strokeStyle=C.yellow;c.beginPath();c.roundRect(x,y,w,h,16);c.stroke();c.restore();}
  else D.round(c,x,y,w,h,16,C.panel,'#47675d');
  D.hit(x,y,w,h,'sense',i);
  if(i<4){
    ORGAN_ICONS[i](c,x+w/2,y+56,t);
    const a=D.tr(q.name),b=D.tr(q.stim),sep=D.tr(P('：',': ')),wa=measure(c,a+sep,22),wb=measure(c,b,22),x0=x+w/2-(wa+wb)/2;
    text(c,a+sep,x0,y+126,22,sel?C.yellow:C.white);text(c,b,x0+wa,y+126,22,C.yellow);
  }else{
    iconSkin(c,x+100,y+78,t);
    text(c,q.name,x+200,y+46,22,sel?C.yellow:C.white);wrap(c,q.stim,x+200,y+80,196,22,C.yellow);
  }
}
// One shared clock for every sense, so the four cards under the picture light up
// exactly when the picture reaches that step: stimulus → receptor → nerve signal → brain.
const SENSE_PERIOD=4.8,SENSE_AT=[0,.3,.5,.8];
function senseCycle(t){const u=mod(t/SENSE_PERIOD);return{u,stage:u<SENSE_AT[1]?0:u<SENSE_AT[2]?1:u<SENSE_AT[3]?2:3};}
const stimulusFade=u=>u<SENSE_AT[1]?1:clamp(1-(u-SENSE_AT[1])/.12);   // stimulus shown in step 1, then fades
const receptorOn=u=>u>=SENSE_AT[1];
const nerveProgress=u=>(u-SENSE_AT[2])/(SENSE_AT[3]-SENSE_AT[2]);      // 0→1 only during step 3
function zoomEye(c,t){
  circle(c,515,215,22,C.yellow,C.ink,3);for(let i=0;i<8;i++){const a=i*TAU/8+t*.3;line(c,[[515+Math.cos(a)*30,215+Math.sin(a)*30],[515+Math.cos(a)*40,215+Math.sin(a)*40]],C.yellow,3);}
  circle(c,690,225,92,'#f6f3ea',C.ink,4);
  c.beginPath();c.arc(690,225,82,-.95,.95);c.strokeStyle='#f29bb0';c.lineWidth=14;c.stroke();
  ellipse(c,612,225,14,34,'#a9dcf3',C.ink,3);ellipse(c,598,225,8,22,C.ink);
  const {u}=senseCycle(t),rays=[[[545,200],[612,212],[770,230]],[[545,225],[612,225],[770,230]],[[545,250],[612,238],[770,230]]];
  for(const r of rays){line(c,r,'rgba(253,224,71,.85)',3);if(u<SENSE_AT[2]){const [x,y]=along(r,Math.min(1,u/SENSE_AT[1]));circle(c,x,y,5,C.yellow);}}
  for(let i=-3;i<=3;i++){const a=i*.18,rx=690+Math.cos(a)*82,ry=225+Math.sin(a)*82;circle(c,rx,ry,5,receptorOn(u)?C.cyan:'#c76f86');}
  const nerve=[[772,225],[820,205],[860,170],[880,148]];nerveLine(c,nerve,8);signal(c,nerve,nerveProgress(u));
}
function zoomEar(c,t){
  D.round(c,490,190,40,60,10,'#9aa6b0',C.ink);c.beginPath();c.moveTo(530,195);c.lineTo(560,170);c.lineTo(560,270);c.lineTo(530,245);c.closePath();c.fillStyle='#c4ccd3';c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  const {u}=senseCycle(t),k=stimulusFade(u);
  for(let i=0;i<3;i++){const r=20+((t*40+i*24)%72);c.beginPath();c.arc(560,220,r,-.6,.6);c.strokeStyle=`rgba(253,224,71,${(1-r/95)*k})`;c.lineWidth=3;c.stroke();}
  c.beginPath();c.moveTo(640,150);c.bezierCurveTo(600,150,600,300,650,300);c.bezierCurveTo(690,300,690,250,665,240);c.bezierCurveTo(645,230,660,190,680,195);c.lineTo(680,160);c.closePath();c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  D.round(c,672,212,70,22,10,'#e8b996',C.ink);
  const v=Math.sin(t*10)*2*k;line(c,[[744+v,200],[744-v,246]],'#f4a6b8',6);
  const spiral=[];for(let i=0;i<=60;i++){const a=i/60*TAU*2.2,r=34-i*.45;spiral.push([800+Math.cos(a)*r,230+Math.sin(a)*r]);}
  line(c,spiral,C.ink,10);line(c,spiral,receptorOn(u)?C.cyan:'#f4a6b8',6);
  const nerve=[[832,214],[858,180],[880,150]];nerveLine(c,nerve,8);signal(c,nerve,nerveProgress(u));
}
function zoomNose(c,t){
  // Unmistakable side-profile face & nose cutaway facing left:
  // forehead → brow → nasal root → prominent nose bridge → rounded nose tip → nostril & wing → philtrum & upper lip.
  c.beginPath();
  c.moveTo(638,74);
  c.quadraticCurveTo(626,104,634,126);
  c.quadraticCurveTo(584,174,536,222);
  c.bezierCurveTo(518,240,528,264,562,264);
  c.lineTo(622,264);
  c.quadraticCurveTo(606,284,616,304);
  c.quadraticCurveTo(598,314,616,334);
  c.lineTo(906,334);
  c.lineTo(906,74);
  c.closePath();
  c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=4;c.lineJoin='round';c.stroke();
  // Side-profile eyebrow & closed smiling eye above the nose root so the face orientation is 100% instant
  c.beginPath();c.moveTo(646,102);c.quadraticCurveTo(664,95,682,103);c.strokeStyle=C.hair;c.lineWidth=4;c.lineCap='round';c.stroke();
  c.beginPath();c.arc(664,118,11,.15*Math.PI,.85*Math.PI);c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  // Subtle mouth corner line below upper lip
  line(c,[[614,310],[638,308]],C.ink,3);
  // Internal nasal cavity (鼻腔): drawn inside the profile with realistic flesh thickness along the bridge & tip
  c.beginPath();
  c.moveTo(584,256);
  c.quadraticCurveTo(604,224,638,194);
  c.quadraticCurveTo(674,162,722,152);
  c.lineTo(830,154);
  c.quadraticCurveTo(874,164,874,220);
  c.quadraticCurveTo(874,268,850,292);
  c.lineTo(662,282);
  c.quadraticCurveTo(632,278,610,262);
  c.lineTo(584,256);
  c.closePath();
  c.fillStyle='#e79a9a';c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  // Dark oval nostril opening (鼻孔) at the base of the nose + subtle nostril wing curve (鼻翼) on the outer skin
  ellipse(c,578,258,13,5,'#4a2518',C.ink,2.5,-.06);
  c.beginPath();c.arc(572,246,10,1.15*Math.PI,1.88*Math.PI);c.strokeStyle=C.skinDark;c.lineWidth=2.6;c.lineCap='round';c.stroke();
  // Curved nasal conchae folds (鼻甲) inside the nasal cavity
  c.beginPath();c.moveTo(684,210);c.quadraticCurveTo(754,190,826,204);c.strokeStyle='#c96d75';c.lineWidth=3.5;c.lineCap='round';c.stroke();
  c.beginPath();c.moveTo(672,246);c.quadraticCurveTo(750,228,832,242);c.stroke();
  // Olfactory epithelium / smell receptors (嗅黏膜／嗅覺受器) at the roof of the nasal cavity + sensory cilia
  const patch=[[715,156],[750,148],[790,147],[828,154]],{u}=senseCycle(t),on=receptorOn(u);
  for(let i=0;i<7;i++){const cx=720+i*17,cy=153+(i===0||i===6?4:0);line(c,[[cx,cy],[cx-3,cy+15]],on?C.cyan:C.receptor,2.2);line(c,[[cx,cy],[cx+3,cy+15]],on?C.cyan:C.receptor,2.2);}
  line(c,patch,C.ink,14);line(c,patch,on?C.cyan:C.receptor,9);
  // Warm aromatic dish in front of the nose + odour molecules drifting into the nostril and up to the receptors
  D.round(c,476,304,64,32,8,'#fbbf6a',C.ink);ellipse(c,508,304,26,8,'#fde68a',C.ink,2);
  if(u<SENSE_AT[2])for(let i=0;i<5;i++){const path=[[508,292],[546,274],[578,256],[646,208],[726+i*22,165]],w=clamp((u-i*.025)/(SENSE_AT[1]-.1));const [x,y]=along(path,w);circle(c,x,y,6,['#fb923c','#f472b6','#a78bfa','#fde047','#4ade80'][i],C.ink,1.5);}
  const nerve=[[770,147],[785,120],[805,96]];nerveLine(c,nerve,7);signal(c,nerve,nerveProgress(u));
}
function zoomTongue(c,t){
  c.beginPath();c.moveTo(500,330);c.quadraticCurveTo(520,250,640,250);c.quadraticCurveTo(740,250,740,300);c.quadraticCurveTo(740,340,690,350);c.lineTo(500,350);c.closePath();c.fillStyle='#f48fa6';c.fill();c.strokeStyle=C.ink;c.lineWidth=4;c.stroke();
  for(let i=0;i<9;i++)circle(c,540+i*22,280+(i%2)*14,5,'#f7b2c2');
  circle(c,660,272,9,null,C.yellow,3);line(c,[[668,265],[735,205]],C.yellow,2);
  circle(c,800,190,82,'#f8c9d4',C.ink,4);
  c.save();c.beginPath();c.arc(800,190,78,0,TAU);c.clip();
  const {u}=senseCycle(t);
  for(let i=-3;i<=3;i++){c.beginPath();c.ellipse(800+i*12,205,9,46,i*.12,0,TAU);c.fillStyle=receptorOn(u)?'#9be7f7':'#f3e4b0';c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();}
  c.restore();
  ellipse(c,800,152,10,6,'#f48fa6',C.ink,2);
  if(u<SENSE_AT[2])for(let i=0;i<4;i++){const y=mix(100,150,clamp((u-i*.04)/(SENSE_AT[1]-.12)));circle(c,790+i*7,y,4,'#7dd3fc',C.ink,1.2);}
  const nerve=[[800,250],[842,292],[888,296],[906,244],[902,184],[890,144]];nerveLine(c,nerve,7);signal(c,nerve,nerveProgress(u));
  D.round(c,525,120,60,40,10,'#c084fc',C.ink);if(u<SENSE_AT[1])for(let i=0;i<3;i++){const w=mod(u/SENSE_AT[1]*2+i/3);circle(c,555,mix(165,245,w),4,'#7dd3fc');}
}
function zoomSkin(c,t){
  D.round(c,480,170,396,40,6,'#f1c9a5',C.ink);D.round(c,480,210,396,140,6,'#e8a9a1',C.ink);
  const {u}=senseCycle(t),on=receptorOn(u),k=stimulusFade(u);
  ellipse(c,590,250,16,26,on?C.cyan:'#f6e3b4',C.ink,2.5);for(let k=1;k<4;k++)ellipse(c,590,250,16-k*4,26-k*6,null,'#c9a36a',1.5);
  for(const a of [-.6,-.2,.2,.6])line(c,[[720,300],[720+Math.sin(a)*24,230]],on?C.cyan:C.nerve,4);
  for(let k=0;k<5;k++)ellipse(c,820,300,20-k*3.5,14-k*2.5,k%2?'#f6e3b4':'#efd39b',C.ink,1.5);
  D.round(c,740,110,60,58,10,C.orange,C.ink);for(let i=0;i<3;i++)line(c,[[750+i*16,104],[746+i*16+Math.sin(t*3+i)*4,88],[752+i*16,72]],'#fbd38d',3);
  c.save();c.globalAlpha=k;for(let i=0;i<3;i++){const w=mod(t*.6+i/3);line(c,[[750+i*18,170+w*40],[758+i*18,178+w*40]],'#fb923c',3);}c.restore();
  const trunk=[[590,276],[600,335],[892,335],[896,230],[890,144]];
  nerveLine(c,trunk,6);
  nerveLine(c,[[720,300],[720,335]],5);
  nerveLine(c,[[820,314],[820,335]],5);
  signal(c,[[720,300],[720,335],[892,335],[896,230],[890,144]],nerveProgress(u));
}
const ZOOMS=[zoomEye,zoomEar,zoomNose,zoomTongue,zoomSkin];
function drawSenses(c,s,t){
  const q=senses[s.sense];
  text(c,P('點一個感覺器官，看受器怎麼接收','Tap an organ to see its receptors'),30,40,24,C.yellow);
  senses.forEach((_,i)=>organTile(c,i,t,i===s.sense));
  panel(c,460,62,470,320);c.save();c.beginPath();c.roundRect(462,64,466,316,15);c.clip();ZOOMS[s.sense](c,t);c.restore();
  const {stage}=senseCycle(t);
  brain(c,s.sense===2?830:888,s.sense===2?84:126,24,stage===3);
  text(c,q.stim,480,100,22,C.yellow);text(c,q.rec,480,368,22,C.cyan);
  const names=[q.node||q.stim,P('受器接收','Receptor detects'),P('神經訊息','Nerve signal'),P('腦','Brain')],idx=stage;
  // Widths fit 4-char Chinese labels on one line and keep 26px gaps for unmistakable arrows.
  const FW=[102,114,108,68],GAP=26;let fx=460;
  names.forEach((p,i)=>{node(c,p,fx,404,FW[i],76,i===idx,i===0?C.yellow:C.cyan);if(i)arrow(c,fx-GAP+3,442,fx-3,442,C.cyan,4);fx+=FW[i]+GAP;});
  wrap(c,P('感覺器官把刺激變成神經訊息，不是把東西送進腦。','Sense organs turn stimuli into nerve signals; they do not send the thing itself to the brain.'),30,548,900,22,C.cyan);
}

// ── Tab 2: neuron, nerve fibres, nerve ─────────────────────────────────────
const SOMA={x:255,y:300,r:60};
function makeDendrites(cx,cy,r,angles,len=70,w0=11,maxDepth=2){
  const out=[];
  const grow=(x,y,a,l,w,depth,seed)=>{
    const x2=x+Math.cos(a)*l,y2=y+Math.sin(a)*l;
    out.push({pts:[[x,y],[mix(x,x2,.5)+Math.sin(seed)*5*(l/70),mix(y,y2,.5)+Math.cos(seed)*5*(l/70)],[x2,y2]],w,depth});
    if(depth<maxDepth)for(const d of [-.45,.42])grow(x2,y2,a+d+Math.sin(seed*3)*.1,l*.62,w*.64,depth+1,seed*1.7+d);
  };
  angles.forEach((a,i)=>grow(cx+Math.cos(a)*r*.84,cy+Math.sin(a)*r*.84,a,len,w0,0,i+1));
  return out;
}
function drawSomaShape(c,cx,cy,r,colLight,colMain,face=true,phase=.4){
  const g=c.createRadialGradient(cx-r*.33,cy-r*.36,Math.max(2,r*.1),cx,cy,r*1.2);
  g.addColorStop(0,colLight);g.addColorStop(1,colMain);
  // Stationary 5-lobed multipolar soma (no +t rotation!)
  c.beginPath();
  for(let i=0;i<=40;i++){const a=i/40*TAU,rad=r*(1+.07*Math.sin(a*5+phase));c[i?'lineTo':'moveTo'](cx+Math.cos(a)*rad,cy+Math.sin(a)*rad);}
  c.closePath();c.fillStyle=g;c.fill();c.strokeStyle=C.ink;c.lineWidth=Math.max(2.5,r*.058);c.stroke();
  const nr=r*.33,nx=cx-r*.1,ny=cy+r*.32;
  circle(c,nx,ny,nr,'#8e6fd1',C.ink,Math.max(1.8,r*.042));
  circle(c,nx+nr*.25,ny-nr*.2,nr*.3,'#c4b5fd');
  if(face){eyes(c,cx+r*.07,cy-r*.32,Math.max(3.2,r*.115),'happy',[.6,0]);smile(c,cx+r*.1,cy-r*.07,Math.max(6.5,r*.23));}
}
function drawTerminalFan(c,end,prev,color,scale=1,spread=[-0.7,-0.35,0,0.35,0.7]){
  const ang=Math.atan2(end[1]-prev[1],end[0]-prev[0]);
  for(const d of spread){
    const m=[end[0]+Math.cos(ang+d*.7)*22*scale,end[1]+Math.sin(ang+d*.7)*22*scale];
    const tip=[end[0]+Math.cos(ang+d)*38*scale,end[1]+Math.sin(ang+d)*38*scale];
    line(c,[end,m,tip],C.ink,Math.max(4,7*scale));
    line(c,[end,m,tip],color,Math.max(2.5,4.5*scale));
    circle(c,tip[0],tip[1],Math.max(4,5.8*scale),color,C.ink,Math.max(1.6,2.2*scale));
  }
}
const DENDRITES=makeDendrites(SOMA.x,SOMA.y,SOMA.r,[2.4,2.9,3.4,3.9,1.75,4.55],70,11,2);
const AXON=(()=>{const p=[];for(let x=SOMA.x+SOMA.r*.9;x<=790;x+=10)p.push([x,SOMA.y+Math.sin((x-300)/70)*10]);return p;})();
const TERMINALS=[-.7,-.35,0,.35,.7].map(a=>{const s=AXON[AXON.length-1];return[[s[0],s[1]],[s[0]+40,s[1]+a*40],[s[0]+70,s[1]+a*75]];});
function neuronBody(c,t,face=true){
  drawSomaShape(c,SOMA.x,SOMA.y,SOMA.r,'#eef6ff','#9fc5ec',face,.4);
}
// A nerve: the long fibres of several neurons run side by side inside one
// wrapping sheath. Cell bodies lie outside the bundle; each fibre carries its
// own signal, so the dots travel at different times.
const NERVE_SOMAS=[[114,164],[178,232],[106,304],[178,376],[114,448]];
const NERVE_FIBRES=NERVE_SOMAS.map(([x,y],i)=>{
  const lane=300+(i-2)*11,pts=[],tx=862,ty=118+i*70;
  for(let k=0;k<=12;k++){const u=k/12,a=1-u;pts.push([a*a*a*(x+20)+3*a*a*u*260+3*a*u*u*320+u*u*u*380,a*a*a*y+3*a*a*u*y+3*a*u*u*lane+u*u*u*lane]);}
  for(let xx=390;xx<=760;xx+=10)pts.push([xx,lane+Math.sin((xx-380)/55+i*1.3)*2.5]);
  for(let k=1;k<=12;k++){const u=k/12,a=1-u;pts.push([a*a*a*760+3*a*a*u*805+3*a*u*u*832+u*u*u*tx,a*a*a*lane+3*a*a*u*lane+3*a*u*u*ty+u*u*u*ty]);}
  const dens=makeDendrites(x,y,21,[2.3,2.85,3.4,3.95,1.75,4.55],17,4,1);
  return{pts,soma:[x,y],end:[tx,ty],dens};});
function drawNerve(c,t){
  for(const f of NERVE_FIBRES){line(c,f.pts,C.ink,9);line(c,f.pts,'#bcd8f3',5);}
  // Sheath drawn over the fibres (translucent) so they read as wrapped inside.
  c.save();c.beginPath();c.roundRect(370,262,404,76,38);c.fillStyle='rgba(233,215,168,.42)';c.fill();c.lineWidth=4;c.strokeStyle='#e9d7a8';c.stroke();c.restore();
  c.save();c.beginPath();c.roundRect(370,262,404,76,38);c.lineWidth=1.5;c.strokeStyle=C.ink;c.stroke();c.restore();
  NERVE_FIBRES.forEach((f,i)=>{
    for(const d of f.dens){line(c,d.pts,C.ink,d.w+2.6);line(c,d.pts,'#bcd8f3',d.w);}
    drawSomaShape(c,f.soma[0],f.soma[1],21,'#eef6ff','#9fc5ec',true,.4);
    ellipse(c,f.end[0]+42,f.end[1],20,12,'#f472b6',C.ink,2.5);
    drawTerminalFan(c,f.end,f.pts[f.pts.length-2],'#bcd8f3',.58,[-.55,-.27,0,.27,.55]);
    signal(c,f.pts,mod(t*.3+i*.21),7);
  });
  // Cross-section of the nerve: many fibre ends inside one wrapping.
  line(c,[[600,338],[600,404]],C.yellow,3);circle(c,600,470,64,'#e9d7a8',C.ink,4);
  for(const [dx,dy] of [[0,0],[-22,-12],[22,-12],[-22,14],[22,14],[0,-26],[0,27],[-38,1],[38,1]])circle(c,600+dx,470+dy,10,'#bcd8f3',C.ink,2);
  text(c,P('神經元','Neurons'),36,92,22,'#bcd8f3');line(c,[[82,100],[102,126]],'#bcd8f3',2);
  text(c,P('神經纖維','Nerve fibres'),210,122,22,'#bcd8f3');line(c,[[246,130],[266,162]],'#bcd8f3',2);
  text(c,P('神經（外面有膜包住）','Nerve (wrapped together)'),400,248,22,C.yellow);
  wrap(c,P('橫切面：一條神經裡有很多條神經纖維','Cross-section: one nerve holds many nerve fibres'),684,452,250,22,C.yellow);
  wrap(c,P('神經：許多神經元的神經纖維集合成束',"Nerve: many neurons' fibres in one bundle"),40,520,500,22,C.white);
}
function drawNeuron(c,s,t){
  if(s.part==='nerve'){text(c,P('神經：很多條神經纖維包在一起','A nerve: many fibres wrapped together'),30,40,24,C.yellow);drawNerve(c,t);
    D.round(c,30,556,410,34,8,C.panel);text(c,P('亮起＝訊息傳到，不是物質整顆移動','Glow = signal arriving, not a substance moving'),42,580,22,C.cyan);return;}
  const hi=s.part==='fibre',u=mod(t*.35);
  text(c,P('神經元：一顆會傳訊的細胞','A neuron: one cell that carries signals'),30,40,24,C.yellow);
  for(const d of DENDRITES){line(c,d.pts,C.ink,d.w+4);line(c,d.pts,hi?'#fde68a':'#bcd8f3',d.w);}
  line(c,AXON,C.ink,16);line(c,AXON,hi?'#fde68a':'#bcd8f3',11);
  for(const tm of TERMINALS){line(c,tm,C.ink,8);line(c,tm,hi?'#fde68a':'#bcd8f3',5);circle(c,tm[2][0],tm[2][1],7,hi?'#fde68a':'#bcd8f3',C.ink,2.5);}
  neuronBody(c,t);
  // One signal path: dendrite tip → cell body → axon → a terminal.
  const tip=DENDRITES.find(d=>d.depth===2).pts,route=[tip[2],tip[1],tip[0],[SOMA.x,SOMA.y],...AXON.filter((_,i)=>i%3===0),...TERMINALS[2].slice(1)];
  signal(c,route,u,8);
  if(s.part==='body'){
    line(c,[[SOMA.x+40,SOMA.y-45],[520,190]],C.yellow,3);circle(c,620,165,108,'#16302a',C.yellow,4);
    c.save();c.beginPath();c.arc(620,165,104,0,TAU);c.clip();c.translate(620-SOMA.x*1.7,165-SOMA.y*1.7);c.scale(1.7,1.7);neuronBody(c,t,false);c.restore();
    text(c,P('細胞核','Nucleus'),740,250,22,'#c4b5fd');line(c,[[738,243],[620+(-6+0)*1.7-10,165+20*1.7]],'#c4b5fd',2);
    text(c,P('細胞本體','Cell body'),740,110,22,C.yellow);
  }else if(hi){
    text(c,P('樹突','Dendrites'),40,130,22,'#fde68a');text(c,P('軸突（長的神經纖維）','Axon (a long nerve fibre)'),420,250,22,'#fde68a');
    wrap(c,P('樹突、軸突都是同一顆細胞的突起，不是別的細胞。','Dendrites and the axon are extensions of the same cell, not other cells.'),400,410,530,22,C.white);
  }
  D.round(c,30,556,410,34,8,C.panel);text(c,P('亮起＝訊息傳到，不是物質整顆移動','Glow = signal arriving, not a substance moving'),42,580,22,C.cyan);
}

// ── Tab 3: receptor → nervous system → effector ────────────────────────────
const journey=[P('受器：接收刺激','Receptor: detects'),P('神經系統：傳導與整合','Nerves relay, CNS integrates'),P('動器：產生反應','Effector: responds')];
// Both sensory and motor neurons use the exact same canonical multipolar neuron
// morphology (branched dendrites + 5-lobed stationary soma with nucleus & cute face +
// long axon + 5-branched axon terminals), never simplified into plain circles.
const SENSE_COL='#a5b4fc',MOTOR_COL='#fdba74';
const RECEPTOR=[170,452],HANDOVER=[486,192];
const SENSORY={
  den:[[170,452],[186,396],[208,336]],
  soma:[208,336],
  somaLight:'#eef6ff',
  dendriteAngles:[2.25,2.68,3.12,3.56,4.0],
  axon:[[208,336],[256,280],[320,240],[392,208],[444,192]]
};
const MOTOR={
  den:[[518,192],[540,192],[566,192]],
  soma:[566,192],
  somaLight:'#fff7ed',
  dendriteAngles:[2.42,2.78,3.14,3.5,3.86],
  axon:[[566,192],[606,220],[640,262],[686,330],[732,390],[766,422]]
};
// To a sweat gland the outgoing fibre ends on the coiled gland, not on the skin surface.
const MOTOR_GLAND={...MOTOR,axon:[[566,192],[606,220],[640,262],[684,330],[706,396],[704,454]]};
function neuronPath(c,n,color,glowOn){
  const col=glowOn?'#fef9c3':color;
  // Branched dendrites radiating from the 5-lobed soma (same structure as Tab 2 neuron)
  const somaDens=makeDendrites(n.soma[0],n.soma[1],27,n.dendriteAngles,24,4.8,1);
  for(const d of somaDens){line(c,d.pts,C.ink,d.w+3);line(c,d.pts,col,d.w);}
  // Main pathway fibre (sensory receptor trunk + axon, or motor dendrites + axon)
  const fibre=[...n.den,...n.axon.slice(1)];
  line(c,fibre,C.ink,11);line(c,fibre,col,6.5);
  // If sensory neuron starts at the skin receptor, draw branched receptor dendrites in the skin too
  if(Math.hypot(n.den[0][0]-n.soma[0],n.den[0][1]-n.soma[1])>60){
    const start=n.den[0];
    for(const a of [1.1,1.65,2.15,.65]){
      const m=[start[0]+Math.cos(a)*16,start[1]+Math.sin(a)*12];
      for(const da of [-.35,.35]){
        const tip=[m[0]+Math.cos(a+da)*14,m[1]+Math.sin(a+da)*10];
        line(c,[start,m,tip],C.ink,5.5);line(c,[start,m,tip],col,3);
      }
    }
  }
  // 5-branched axon terminals with synaptic bulbs (matching Tab 2)
  const end=n.axon[n.axon.length-1],prev=n.axon[n.axon.length-2];
  drawTerminalFan(c,end,prev,col,.66,[-.66,-.33,0,.33,.66]);
  // Stationary 5-lobed multipolar cell body with purple nucleus + cute face (matching Tab 2)
  drawSomaShape(c,n.soma[0],n.soma[1],27,n.somaLight,color,true,.4);
  return fibre;
}
function sweatDrop(c,x,y,r){c.beginPath();c.moveTo(x,y-r*1.7);c.bezierCurveTo(x+r*.9,y-r*.6,x+r,y+r*.1,x+r,y+r*.3);c.arc(x,y+r*.3,r,0,Math.PI);c.bezierCurveTo(x-r,y+r*.1,x-r*.9,y-r*.6,x,y-r*1.7);c.closePath();
  c.fillStyle='#7dd3fc';c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();circle(c,x-r*.35,y,r*.25,'rgba(255,255,255,.8)');}
function effector(c,t,effect,active){
  if(effect==='muscle'){
    const k=active?(Math.sin(t*5)+1)/2:0,len=mix(110,82,k),fat=mix(30,40,k),cx=800,cy=462;
    line(c,[[cx-len-46,cy],[cx-len,cy]],'#f5f5f4',8);line(c,[[cx+len,cy],[cx+len+46,cy]],'#f5f5f4',8);
    ellipse(c,cx,cy,len,fat,'#f472b6',C.ink,3);
    for(let i=-3;i<=3;i++){c.save();c.beginPath();c.ellipse(cx,cy,len,fat,0,0,TAU);c.clip();line(c,[[cx+i*len/4,cy-fat],[cx+i*len/4+6,cy+fat]],'rgba(255,255,255,.35)',2);c.restore();}
    text(c,P('肌肉','Muscle'),cx+30,cy+12,22,C.deep,'center');
  }else{
    D.round(c,660,424,270,26,4,'#f1c9a5',C.ink);D.round(c,660,450,270,62,4,'#e8a9a1',C.ink);
    const coil=[];for(let i=0;i<=40;i++){const a=i/40*TAU*3;coil.push([716+Math.cos(a)*24+i*.6,490+Math.sin(a)*10]);}
    line(c,[[744,490],[744,426]],C.ink,9);line(c,[[744,490],[744,426]],'#60a5fa',5);line(c,coil,C.ink,9);line(c,coil,'#60a5fa',5);
    for(let i=0;i<3;i++){const u=active?mod(t*.7+i/3):0;c.save();c.globalAlpha=active?1-u*.5:.35;sweatDrop(c,744+i*34,mix(410,394,u),8);c.restore();}
    text(c,P('汗腺','Sweat gland'),856,490,22,C.deep,'center');
  }
}
// One clock drives the cards and the signal. The "nervous system" card covers the whole
// trip through both neurons; the effector card lights only when the signal arrives.
const JOURNEY_PERIOD=6,JOURNEY_AT=[0,.18,.76];
const J_SENSE=[.18,.42],J_HAND=[.42,.52],J_MOTOR=[.52,.76];
function journeyClock(s,t){
  if(s.step<0){const U=mod(t/JOURNEY_PERIOD);return{U,stage:U<JOURNEY_AT[1]?0:U<JOURNEY_AT[2]?1:2};}
  const a=JOURNEY_AT[s.step],b=s.step<2?JOURNEY_AT[s.step+1]:1;   // a chosen step loops on its own part
  return{U:a+mod(t/((b-a)*JOURNEY_PERIOD))*(b-a),stage:s.step};
}
const within=(U,[a,b])=>U>=a&&U<b,frac=(U,[a,b])=>(U-a)/(b-a);
function drawJourney(c,s,t){
  const {U,stage}=journeyClock(s,t),gland=s.effect==='gland';
  // Heat reaching the skin receptor.
  circle(c,82,330,26,C.yellow,C.ink,3);for(let i=0;i<8;i++){const a=i*TAU/8+t*.2;line(c,[[82+Math.cos(a)*34,330+Math.sin(a)*34],[82+Math.cos(a)*44,330+Math.sin(a)*44]],C.yellow,3);}
  for(let i=0;i<3;i++){const y=380+i*16;c.beginPath();for(let x=60;x<=150;x+=6)c.lineTo(x,y+Math.sin(x*.2+t*4)*3);c.strokeStyle='rgba(251,146,60,.7)';c.lineWidth=3;c.stroke();}
  D.round(c,30,440,280,22,4,'#f1c9a5',C.ink);D.round(c,30,462,280,44,4,'#e8a9a1',C.ink);
  text(c,P('皮膚','Skin'),262,492,22,C.deep,'center');
  // Central nervous system: where the two neurons hand the message over.
  D.round(c,316,84,330,178,18,stage===1?'#21524a':'#1c3d34',stage===1?C.cyan:'#5c8a7c');
  brain(c,346,120,20,within(U,J_HAND));text(c,P('中樞神經（腦、脊髓）','CNS (brain, spinal cord)'),374,128,22,C.white);
  // Effector first, so the outgoing fibre stays visible where it reaches the gland.
  effector(c,t,s.effect,stage===2);
  const sFibre=neuronPath(c,SENSORY,SENSE_COL,within(U,J_SENSE));
  const mFibre=neuronPath(c,gland?MOTOR_GLAND:MOTOR,MOTOR_COL,within(U,J_MOTOR));
  c.save();c.setLineDash([5,5]);circle(c,HANDOVER[0],HANDOVER[1],28,null,C.yellow,2.5);c.restore();
  sparkle(c,RECEPTOR[0],RECEPTOR[1],stage===0?17:11,stage===0?C.yellow:'#a3863a');if(stage===0)glow(c,RECEPTOR[0],RECEPTOR[1],32,C.yellow,.6);
  if(within(U,J_SENSE))signal(c,sFibre,frac(U,J_SENSE));
  // The message crosses the small gap to the next neuron; the fibres stay apart.
  if(within(U,J_HAND)){const k=frac(U,J_HAND);glow(c,HANDOVER[0],HANDOVER[1],30,C.cyan,.5);for(const dy of [-7,0,7])circle(c,mix(472,502,clamp(k*1.25-Math.abs(dy)*.02)),HANDOVER[1]+dy,3.5,C.cyan);}
  if(within(U,J_MOTOR))signal(c,mFibre,frac(U,J_MOTOR));
  text(c,P('感覺神經元（傳入）','Sensory neuron (in)'),34,240,22,SENSE_COL);
  text(c,P('運動神經元（傳出）','Motor neuron (out)'),700,300,22,MOTOR_COL);
  text(c,P('交接處','Hand-over'),HANDOVER[0],248,22,C.yellow,'center');
  node(c,journey[0],30,516,280,48,stage===0,C.yellow);
  node(c,journey[1],316,22,330,48,stage===1,C.cyan);
  node(c,journey[2],650,516,280,48,stage===2,MOTOR_COL);
  D.round(c,660,30,270,92,12,C.panel,'#47675d');
  line(c,[[676,58],[716,58]],SENSE_COL,6);text(c,P('感覺神經元','Sensory neuron'),726,66,22,C.white);
  line(c,[[676,96],[716,96]],MOTOR_COL,6);text(c,P('運動神經元','Motor neuron'),726,104,22,C.white);
  wrap(c,P('是兩條不同的神經元：在中樞交接訊息，不是同一條來回。','Two different neurons meet in the CNS; not one neuron going there and back.'),30,592,900,22,C.cyan);
}

// ── Tab 4: reaction-time practice ─────────────────────────────────────────
// 手部直接由老師提供的接尺線稿描成向量（assets/biology/ruler_hands_1017_v1.js），輪廓與手指關係照原圖；
// 這裡只在外層加色：暖膚色底 + 手指陰影 + 棕色墨線。直尺（刻度、數字）仍由程式畫，數字與 0 cm 才準。
const RH_INK='#3b2214',RH_SKIN=['#ffe3cc','#f1c3a0'],RH_SHADE='#e0a984';
const RH={s:.64,x0:196,y0:140,top:40,rw:36.4};
function rhX(x,rl){return RH.x0+(x-rl)*RH.s;}
function rhY(y,dy){return RH.y0+(y-RH.top+(dy||0))*RH.s;}
function rhPath(c,polys,rl,dy){
  c.beginPath();
  for(const p of polys){c.moveTo(rhX(p[0],rl),rhY(p[1],dy));for(let k=2;k<p.length;k+=2)c.lineTo(rhX(p[k],rl),rhY(p[k+1],dy));c.closePath();}
}
// layer: topA/topC/botA/botC；rl = 該圖中直尺左緣的原圖 x；dy = 整隻手上下平移（原圖像素）
function drawTracedHand(c,layer,rl,dy){
  const T=globalThis.RulerHandsTrace&&globalThis.RulerHandsTrace[layer];if(!T)return;
  const isTop=layer.indexOf('top')===0,g=c.createLinearGradient(0,rhY(isTop?40:400,dy),0,rhY(isTop?180:570,dy));
  g.addColorStop(0,RH_SKIN[0]);g.addColorStop(1,RH_SKIN[1]);
  c.save();
  rhPath(c,T.s,rl,dy);c.fillStyle=g;c.fill('evenodd');
  for(const fp of T.f){rhPath(c,fp,rl,dy);c.fillStyle=RH_SHADE;c.fill('evenodd');}
  rhPath(c,T.i,rl,dy);c.fillStyle=RH_INK;c.fill('evenodd');
  c.lineJoin='round';c.lineWidth=.5;c.strokeStyle=RH_INK;c.stroke();
  c.restore();
}
// 直尺：top/bottom 為原圖 y（左圖 130.5～454.8，右圖 247.7～572），30 cm 尺，0 在下緣；skip = 被手擋住、不標示的刻度數字
function drawRulerBody(c,top,bottom,skip){
  const xl=RH.x0,xr=RH.x0+RH.rw*RH.s,yt=rhY(top),yb=rhY(bottom),cm=(yb-yt)/30;
  c.save();
  c.fillStyle='#fde68a';c.fillRect(xl,yt,xr-xl,yb-yt);
  c.strokeStyle=RH_INK;c.lineWidth=2.4;c.lineJoin='round';c.strokeRect(xl,yt,xr-xl,yb-yt);
  c.restore();
  for(let i=1;i<30;i++){
    const ty=yb-i*cm,len=i%10===0?14:i%5===0?10:6;
    line(c,[[xr-len,ty],[xr,ty]],RH_INK,1.6);
    if((i===10||i===20)&&!(skip&&skip.includes(i)))text(c,String(i),xr+8,ty+7,20,C.white);
  }
  // 0 cm：標籤在左側，引線畫在手的後面
  line(c,[[RH.x0-26,yb],[xl,yb]],C.muted,2);
  text(c,'0 cm',RH.x0-30,yb+7,22,C.white,'right');
}
function drawReaction(c,s,t){
  panel(c,20,80,390,415);text(c,P('實體接尺：記錄落下距離','Ruler drop: record the distance'),40,112,22,C.yellow);
  // idle/wait/early = 左圖（上手夾尺）；go = 剛放手；done = 右圖（尺已落下、下手夾住）
  const RA=188.2,RC=508.3;
  if(s.phase==='done'){
    drawRulerBody(c,247.7,572,[10]);
    for(const lx of [510,520.5,531,541.5])line(c,[[rhX(lx,RC),rhY(192)],[rhX(lx,RC),rhY(232)]],'#94a3b8',2);
    drawTracedHand(c,'topC',RC,0);drawTracedHand(c,'botC',RC,0);
    arrow(c,130,300,130,360,C.cyan,3.5);
  }else if(s.phase==='go'){
    drawRulerBody(c,130.5,454.8);
    drawTracedHand(c,'topC',RC,-26);drawTracedHand(c,'botA',RA,0);
  }else{
    drawRulerBody(c,130.5,454.8);
    drawTracedHand(c,'topA',RA,0);drawTracedHand(c,'botA',RA,0);
  }
  const go=s.phase==='go',fill=go?C.green:s.phase==='early'?'#7c3a1d':C.panel,stroke=go?C.white:s.phase==='wait'?C.orange:'#47675d';
  D.round(c,450,80,490,415,24,fill,stroke);c.save();c.lineWidth=go?6:4;c.strokeStyle=stroke;c.beginPath();c.roundRect(450,80,490,415,24);c.stroke();c.restore();
  const msg=go?P('現在！','NOW!'):s.phase==='wait'?P('等待……','Wait…'):s.phase==='early'?P('太早了','Too soon'):s.phase==='done'?P(`${s.response} 毫秒`,`${s.response} ms`):P('先按開始','Press start');
  text(c,msg,695,270,go?64:44,go?C.deep:C.yellow,'center');
  if(go)for(let i=0;i<6;i++)sparkle(c,695+Math.cos(i)*170,220+Math.sin(i*1.7)*120,14,C.deep);
  if(s.phase==='wait'){eyes(c,695,330,18,'surprised',[Math.sin(t*2)*.8,0]);}
  if(s.scores.length){const max=Math.max(...s.scores,400);s.scores.forEach((v,i)=>{const h=Math.max(8,70*v/max),x=520+i*76;D.round(c,x,470-h,44,h,6,go?C.deep:C.cyan);});text(c,P('最近幾次','Recent tries'),520,488,22,go?C.deep:C.muted);}
  D.hit(450,80,490,415,'respond',true);
  text(c,P('螢幕反應練習，非實體接尺測量','On-screen task, not a physical ruler measurement'),40,555,22,C.cyan);
}

// ── Tab 5: same water, different feel ─────────────────────────────────────
function basin(c,x,label,temp,kind,t){
  c.beginPath();c.moveTo(x,250);c.lineTo(x+270,250);c.lineTo(x+245,470);c.quadraticCurveTo(x+135,488,x+25,470);c.closePath();c.fillStyle='#16302a';c.fill();c.strokeStyle=C.ink;c.lineWidth=4;c.stroke();
  text(c,label,x+135,512,22,C.white,'center');text(c,temp,x+135,455,22,C.white,'center');
  if(kind==='warm')for(let i=0;i<3;i++){const pts=[];for(let k=0;k<=8;k++)pts.push([x+80+i*55+Math.sin(k*.9+t*2+i)*6,245-k*9-((t*14)%10)]);line(c,pts,'rgba(251,146,60,.7)',3);}
}
function water(c,x,color,kind,t){
  c.save();c.beginPath();c.moveTo(x+6,290);for(let k=0;k<=10;k++)c.lineTo(x+6+k*25.8,290+Math.sin(k+t*2)*3);c.lineTo(x+244,466);c.quadraticCurveTo(x+135,482,x+26,466);c.closePath();c.fillStyle=color;c.globalAlpha=.62;c.fill();c.restore();
  if(kind==='cool')for(let i=0;i<3;i++){c.save();c.translate(x+70+i*60,300+Math.sin(t*1.5+i)*3);c.rotate(.3*i);D.round(c,-14,-14,28,28,6,'rgba(224,242,254,.85)',C.ink);c.restore();}
}
function handDown(c,x,tip,flip){
  D.round(c,x-22,60,44,tip-150,18,C.skin,C.ink);
  D.round(c,x-26,58,52,22,10,flip?'#3fb3a3':'#fb923c',C.ink);
  c.beginPath();c.roundRect(x-36,tip-120,72,70,24);c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  for(let k=0;k<4;k++){const fh=k===0||k===3?50:62,fx=x-31+k*16;c.beginPath();c.roundRect(fx,tip-62,14,fh,7);c.fillStyle=C.skin;c.fill();c.stroke();ellipse(c,fx+7,tip-62+fh-6,3.5,4,'#fff5ee');}
  c.save();c.translate(x+(flip?-36:36),tip-96);c.rotate(flip?.6:-.6);c.beginPath();c.roundRect(-8,0,16,44,8);c.fillStyle=C.skin;c.fill();c.stroke();c.restore();
  c.save();c.globalAlpha=.38;ellipse(c,x,tip-88,14,8,'#f59aa8');c.restore();
}
function feeling(c,x,y,warm,label){
  D.round(c,x-70,y-34,140,60,18,'#fdf6e3',C.ink);c.beginPath();c.moveTo(x-10,y+26);c.lineTo(x,y+44);c.lineTo(x+10,y+26);c.fillStyle='#fdf6e3';c.fill();
  if(warm){circle(c,x-34,y-4,12,C.orange,C.ink,2);for(let i=0;i<8;i++){const a=i*TAU/8;line(c,[[x-34+Math.cos(a)*15,y-4+Math.sin(a)*15],[x-34+Math.cos(a)*21,y-4+Math.sin(a)*21]],C.orange,2.5);}}
  else for(let i=0;i<3;i++){const a=i*Math.PI/3;line(c,[[x-34+Math.cos(a)*16,y-4+Math.sin(a)*16],[x-34-Math.cos(a)*16,y-4-Math.sin(a)*16]],'#38bdf8',3);}
  text(c,label,x+20,y+5,22,warm?'#c2410c':'#0369a1','center');
}
function drawAdaptation(c,s,t){
  const xs=[30,345,660],cols=['#fb923c','#55e9ff','#7fa3db'],kinds=['warm','middle','cool'];
  xs.forEach((x,i)=>basin(c,x,[P('溫水','Warm'),P('中間水','Middle'),P('涼水','Cool')][i],['35–40°C','20–25°C','10–15°C'][i],kinds[i],t));
  const p=Math.min(Math.max((t-s.start)/1.5,0),1),dest=s.transfer?[425,520]:[165,795],pos=s.fromPos.map((x,i)=>x+(dest[i]-x)*p);
  const tips=pos.map(x=>{const inside=xs.some(b=>x>b+20&&x<b+250);return inside?mix(250,380,p<1&&s.transfer?Math.abs(1-2*p):1):250;});
  pos.forEach((x,i)=>{handDown(c,x,tips[i],i===1);text(c,i===0?P('左手','Left hand'):P('右手','Right hand'),x,52,22,C.yellow,'center');});
  xs.forEach((x,i)=>water(c,x,cols[i],kinds[i],t));
  D.round(c,600,280,16,150,8,'#f8fafc',C.ink);circle(c,608,440,14,'#ef4444',C.ink,3);D.round(c,604,350,8,86,4,'#ef4444');
  if(p>=1){const [l,r]=pos;feeling(c,l-(s.transfer?70:0),150,!s.transfer,s.transfer?P('涼','Cool'):P('暖','Warm'));feeling(c,r+(s.transfer?70:0),150,s.transfer,s.transfer?P('暖','Warm'):P('涼','Cool'));}
  text(c,P('溫度計在中間水盆：讀數不變','The thermometer in the middle reads the same'),480,548,22,C.muted,'center');
  text(c,P('老師準備安全水溫；時間壓縮的示意','Teacher checks safe temperatures; time-compressed model'),30,580,22,C.cyan);
}

// ── Tab 6: persistence of vision (視覺暫留) & visual fatigue / afterimage (視覺疲勞與後像) ──
function drawCageMotif(c,cx,cy,scale=1){
  c.save();c.translate(cx,cy);c.scale(scale,scale);
  // Classic domed birdcage (鳥籠)
  c.strokeStyle='#1e293b';c.lineWidth=3.2;c.lineCap='round';c.lineJoin='round';
  // Top hanging ring
  c.beginPath();c.arc(0,-66,8,0,TAU);c.stroke();
  // Dome arch + flat base
  c.beginPath();
  c.moveTo(-48,46);c.lineTo(-48,-8);
  c.bezierCurveTo(-48,-46,-24,-58,0,-58);
  c.bezierCurveTo(24,-58,48,-46,48,-8);
  c.lineTo(48,46);c.closePath();
  c.stroke();
  // Vertical cage bars
  for(const bx of [-32,-16,0,16,32]){
    const topY=-56+Math.abs(bx)*.32;
    line(c,[[bx,topY],[bx,46]],'#1e293b',2.6);
  }
  // Horizontal rail + base tray
  line(c,[[-48,-8],[48,-8]],'#1e293b',2.8);
  D.round(c,-54,44,108,10,4,'#64748b','#1e293b');
  c.restore();
}
function drawBirdMotif(c,cx,cy,scale=1,bodyCol='#38bdf8',wingCol='#0284c7'){
  c.save();c.translate(cx,cy);c.scale(scale,scale);
  // Cute perching songbird (小鳥)
  // Tail feathers
  c.beginPath();c.moveTo(-18,8);c.lineTo(-40,22);c.lineTo(-34,4);c.closePath();
  c.fillStyle=wingCol;c.fill();c.strokeStyle=C.ink;c.lineWidth=2.5;c.stroke();
  // Plump body + head
  ellipse(c,-2,6,22,16,bodyCol,C.ink,2.8,-.12);
  circle(c,16,-8,13,bodyCol,C.ink,2.8);
  // Cute wing
  ellipse(c,-4,6,13,8,wingCol,C.ink,2.2,-.2);
  // Beak + eye + legs
  c.beginPath();c.moveTo(27,-11);c.lineTo(39,-7);c.lineTo(27,-3);c.closePath();
  c.fillStyle='#fb923c';c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();
  circle(c,19,-10,2.8,C.ink);circle(c,18,-11,1,'#ffffff');
  line(c,[[-4,21],[-8,34]],'#d97706',2.5);line(c,[[6,21],[4,34]],'#d97706',2.5);
  c.restore();
}
function drawFatigueTarget(c,cx,cy,kind,afterimage=false,alpha=1){
  c.save();c.translate(cx,cy);c.globalAlpha=alpha;
  // Complementary color pairs (紅⇄青綠, 綠⇄洋紅紅, 黃⇄藍):
  if(kind==='apple'){
    const bodyCol=afterimage?'#2dd4bf':'#ef4444';   // 紅蘋果 ➔ 青綠後像
    const leafCol=afterimage?'#f43f5e':'#22c55e';   // 綠葉 ➔ 紅／洋紅後像
    const stemCol=afterimage?'#cbd5e1':'#78350f';
    // Stem
    line(c,[[0,-54],[6,-82]],stemCol,6);
    // Leaf
    c.beginPath();c.moveTo(4,-68);c.quadraticCurveTo(36,-92,56,-64);c.quadraticCurveTo(30,-44,4,-68);c.closePath();
    c.fillStyle=leafCol;c.fill();c.strokeStyle=afterimage?'#99f6e4':C.ink;c.lineWidth=afterimage?1.5:3;c.stroke();
    // Plump Apple Body
    c.beginPath();
    c.moveTo(0,-54);
    c.bezierCurveTo(-48,-76,-86,-24,-68,36);
    c.bezierCurveTo(-54,80,-16,84,0,68);
    c.bezierCurveTo(16,84,54,80,68,36);
    c.bezierCurveTo(86,-24,48,-76,0,-54);
    c.closePath();
    c.fillStyle=bodyCol;c.fill();c.strokeStyle=afterimage?'#99f6e4':C.ink;c.lineWidth=afterimage?1.5:3.2;c.stroke();
    if(!afterimage)ellipse(c,-32,-18,12,24,'rgba(255,255,255,.32)',null,1,-.25);
  }else{
    // 黃月亮＋藍夜空 ➔ 藍月亮＋黃背景後像
    const bgCol=afterimage?'#fef08a':'#1d4ed8';
    const moonCol=afterimage?'#3b82f6':'#fde047';
    circle(c,0,4,82,bgCol,afterimage?'#fde047':C.ink,afterimage?2:3.2);
    // Symmetrical crescent moon opening to the left + star inside the opening
    c.beginPath();
    c.arc(-4,4,52,-.72*Math.PI,.72*Math.PI,false);
    c.bezierCurveTo(14,32,14,-24,-4+52*Math.cos(-.72*Math.PI),4+52*Math.sin(-.72*Math.PI));
    c.closePath();
    c.fillStyle=moonCol;c.fill();
    sparkle(c,-36,4,13,moonCol);
  }
  // Central fixation cross (+) that students stare at!
  line(c,[[-9,4],[9,4]],'#0f172a',3.2);
  line(c,[[0,-5],[0,13]],'#0f172a',3.2);
  c.restore();
}
function drawVision(c,s,t){
  if(s.exp==='persistence'){
    text(c,P('視覺暫留：影像消失後，視覺印象仍短暫停留約 0.1 秒','Persistence of vision: an image lingers for ~0.1 s after it disappears'),30,40,24,C.yellow);
    panel(c,24,62,442,438);
    panel(c,490,62,446,438);
    text(c,P('雙面旋轉卡（一面鳥、一面籠）','Two-sided spinning card'),44,98,22,C.yellow);
    text(c,P('眼睛與腦看到的畫面','What your eyes and brain perceive'),512,98,22,C.yellow);

    // Top reference miniatures of Front (正面：小鳥) and Back (背面：鳥籠)
    D.round(c,48,112,182,102,12,'#fdf6e3',C.ink);
    drawBirdMotif(c,94,162,.58);
    text(c,P('正面：鳥','Front: bird'),172,170,20,C.deep,'center');

    D.round(c,258,112,182,102,12,'#fdf6e3',C.ink);
    drawCageMotif(c,302,164,.52);
    text(c,P('背面：籠','Back: cage'),384,170,20,C.deep,'center');

    // Bottom spinning thaumatrope card (籠中鳥旋轉卡)
    const speed=s.speed==='fast'?72:s.speed==='slow'?3.2:0;
    const ang=speed?t*speed:0, flipScale=Math.cos(ang);
    const cx=245,cy=348,r=86;
    if(s.speed==='fast'){
      // High-speed spinning strings (vibrating rapidly)
      const vib=Math.sin(t*75)*2.2;
      line(c,[[56,cy],[cx-r,cy+vib]],'#f43f5e',4);
      line(c,[[cx+r,cy-vib],[434,cy]],'#f43f5e',4);
      // Outer high-speed spin orbit lines
      c.save();c.setLineDash([6,5]);
      c.beginPath();c.ellipse(cx,cy,r+18,30,0,0,TAU);
      c.strokeStyle=C.cyan;c.lineWidth=2.8;c.stroke();
      c.restore();
      // Full-width spinning card disk + fast-whirring foreshortened flip ring + superimposed bird-in-cage!
      circle(c,cx,cy,r,'#fdf6e3',C.ink,3.5);
      // Fast-flipping 3D rim ghost to show high-speed rotation
      for(const phase of [0,1.05]){
        const rx=Math.max(6,r*Math.abs(Math.cos(ang+phase)));
        c.save();c.beginPath();c.ellipse(cx,cy,rx,r,0,0,TAU);
        c.strokeStyle='rgba(15,23,42,.22)';c.lineWidth=2;c.stroke();c.restore();
      }
      // Both bird and cage appear superimposed right on the fast-spinning card (with high-speed shimmer)!
      const aCage=.82+.18*Math.sin(ang), aBird=.82-.18*Math.sin(ang);
      c.save();c.globalAlpha=aCage;drawCageMotif(c,cx,cy+6,.92);c.restore();
      c.save();c.globalAlpha=aBird;drawBirdMotif(c,cx,cy+6,.92);c.restore();
      // Horizontal speed streaks across the spinning card
      for(const sy of [-54,0,54]){
        const sx=Math.sin(ang+sy)*24;
        line(c,[[cx-42+sx,cy+sy],[cx+42+sx,cy+sy]],'rgba(85,233,255,.38)',2);
      }
    }else{
      // Still or slow flip: card physically narrows with cos(ang) and shows only one side at a time
      line(c,[[56,cy],[cx-r*Math.abs(flipScale),cy]],'#f43f5e',4);
      line(c,[[cx+r*Math.abs(flipScale),cy],[434,cy]],'#f43f5e',4);
      if(s.speed==='slow'){
        c.save();c.setLineDash([5,5]);
        c.beginPath();c.ellipse(cx,cy,r+14,26,0,0,TAU);
        c.strokeStyle='rgba(242,236,217,.45)';c.lineWidth=2.5;c.stroke();
        c.restore();
      }
      c.save();c.translate(cx,cy);c.scale(Math.max(.08,Math.abs(flipScale)),1);
      circle(c,0,0,r,'#fdf6e3',C.ink,3.5);
      if(flipScale>=0)drawBirdMotif(c,0,4,.95);
      else drawCageMotif(c,0,6,.92);
      c.restore();
    }
    text(c,s.speed==='fast'?P('快速旋轉中（兩面疊合！）','Spinning fast (merged!)'):s.speed==='slow'?P('慢速翻轉中','Flipping slowly'):P('靜止（正面）','Still (front)'),cx,474,22,s.speed==='fast'?C.yellow:C.white,'center');

    // Right Panel: Perceived image in the brain!
    const px=713,py=268;
    circle(c,px,py,108,'#fdf6e3',s.speed==='fast'?C.cyan:C.ink,s.speed==='fast'?5:3.5);
    if(s.speed==='still'){
      drawBirdMotif(c,px,py+4,1.08);
    }else if(s.speed==='slow'){
      if(flipScale>=0)drawBirdMotif(c,px,py+4,1.08);
      else drawCageMotif(c,px,py+6,1.02);
    }else{
      // Fast spin: Persistence of vision superimposes BOTH the bird and the cage ("籠中鳥")!
      drawCageMotif(c,px,py+6,1.02);
      drawBirdMotif(c,px,py+6,1.02);
    }
    const statusMsg=s.speed==='fast'
      ?P('籠中鳥！（前一張影像還沒消失就疊上下一張）','Bird in the cage! (Images overlap before fading)')
      :s.speed==='slow'
      ?P('鳥與鳥籠輪流出現（間隔太久，無法疊合）','Bird and cage alternate (too slow to merge)')
      :P('只看到單面圖案','Only one side is seen');
    wrap(c,statusMsg,512,418,404,22,s.speed==='fast'?C.yellow:C.white);
    D.round(c,24,518,912,62,12,C.panel,'#47675d');
    text(c,P('正片後像：視覺暫留看到的顏色與原物相同。例：雨滴成線、揮動仙女棒、卡通與電影。','Positive afterimage: same colour as the object (e.g., rain streaks, sparklers, animation).'),42,557,22,C.cyan);
    return;
  }

  // Experiment 2: Visual Fatigue & Complementary Negative Afterimage (視覺疲勞與互補色負片後像)
  text(c,P('視覺疲勞：凝視鮮豔圖案後看白紙，浮現顏色互補的「負片後像」','Visual fatigue: staring at bright colours reveals a complementary afterimage'),30,40,24,C.yellow);
  panel(c,24,62,442,416);
  panel(c,490,62,446,416);
  text(c,P('① 凝視區：盯住中心「＋」字','1. Stare at the center + cross'),44,98,22,C.yellow);
  text(c,P('② 白紙區：移開視線看這裡','2. Look at the white paper here'),512,98,22,C.yellow);

  // Left card: Dark neutral backing with vivid high-saturation stimulus
  D.round(c,52,114,386,274,16,'#152e27','#47675d');
  drawFatigueTarget(c,245,248,s.target,false,1);
  const progress=s.step==='stare'?clamp((t-s.stepStart)/12):1;
  // Fatigue progress bar at bottom of left panel
  D.round(c,52,404,386,18,9,'#0f241e','#47675d');
  D.round(c,54,406,Math.max(12,382*progress),14,7,progress>=1?C.yellow:C.cyan);
  text(c,s.step==='stare'
    ?P(`受器持續受刺激（疲勞累積 ${Math.round(progress*100)}%）`,`Receptors adapting (${Math.round(progress*100)}%)`)
    :P('受器已產生視覺疲勞 → 請看右側白紙！','Fatigue reached → look at white paper!'),245,454,22,progress>=1||s.step==='white'?C.yellow:C.white,'center');

  // Right card: Crisp White Paper (#f8fafc) where the complementary negative afterimage floats!
  D.round(c,518,114,390,274,16,'#f8fafc',s.step==='white'?C.cyan:C.ink);
  if(s.step==='white'){
    // Ghostly complementary-color afterimage slowly pulsing/fading on the white sheet
    const fade=.62+.16*Math.sin(t*2.5);
    drawFatigueTarget(c,713,248,s.target,true,fade);
    text(c,s.target==='apple'
      ?P('浮現「青綠蘋果＋紅葉」負片後像！','A cyan-green apple with a red leaf appears!')
      :P('浮現「藍月亮＋黃底」負片後像！','A blue moon on a yellow background appears!'),713,440,22,C.yellow,'center');
  }else{
    // Fixation cross on blank white paper waiting for step 2
    line(c,[[704,252],[722,252]],'#334155',3);
    line(c,[[713,243],[713,261]],'#334155',3);
    text(c,P('盯完左圖後，點上方「② 看白紙」','After staring, tap "2. Look at white paper"'),713,440,22,C.muted,'center');
  }

  // Bottom Complementary Color Legend (互補色對照表：紅⇄綠、藍⇄黃、黑⇄白)
  D.round(c,24,494,912,86,12,C.panel,'#47675d');
  text(c,P('負片後像（互補色）：','Negative afterimage:'),42,546,22,C.cyan);
  const pairs=[
    ['#ef4444','#2dd4bf',P('紅 ⇄ 綠','Red ⇄ Green'),336],
    ['#3b82f6','#fde047',P('藍 ⇄ 黃','Blue ⇄ Yellow'),564],
    ['#1e293b','#f8fafc',P('黑 ⇄ 白','Black ⇄ White'),794]
  ];
  for(const [c1,c2,lbl,px] of pairs){
    circle(c,px-58,538,13,c1,C.white,2);
    circle(c,px-26,538,13,c2,C.white,2);
    text(c,lbl,px,546,22,C.white);
  }
}

const tabs=[
 {id:'senses',title:P('誰先收到？','Who detects it?'),sub:P('刺激與受器','Stimuli and receptors'),hook:P('聞到便當香味，是鼻子把食物送到腦裡，還是傳了一則訊息？','Does your nose send food to the brain, or a message about its smell?'),
  body:P('刺激是環境或體內的變化；受器接收刺激。點選感覺器官，放大看它接收哪一種訊息。','A stimulus is a change outside or inside the body. Select a sense organ to inspect what its receptors detect.'),
  closure:P('感覺器官內含受器；受器接收刺激，再由神經系統傳遞訊息。','Sense organs contain receptors. Receptors detect stimuli; the nervous system carries the signals.'),
  reading:P('刺激不一定來自體外，體內的變化也能被偵測。受器、神經系統與動器的分工，使動物可以協調反應。動器包括肌肉與腺體：肌肉收縮能產生動作；腺體分泌也能構成反應，例如汗腺分泌汗液。','Stimuli can arise inside the body as well as outside. Receptors, the nervous system and effectors cooperate. Effectors include muscles and glands: contraction produces movement, while secretion can also be a response, such as sweat release.'),
  sources:[],init:()=>({running:true,sense:0}),controls:()=>[choice(P('感覺器官','Sense organ'),'sense',senses.map((q,i)=>[i,q.name]))],
  explain:s=>({title:senses[s.sense].name,text:senses[s.sense].loc}),draw:drawSenses},
 {id:'neuron',title:P('一顆細胞也能傳訊','A cell carries messages'),sub:P('神經元與神經纖維','Neurons and nerve fibres'),hook:P('這麼多分枝，是很多顆細胞黏在一起嗎？','Are all these branches separate cells stuck together?'),
  body:P('神經元是傳遞訊息的基本單位。神經纖維是細胞向外延伸的突起，不是另一顆細胞。','A neuron is a basic unit for carrying signals. Its nerve fibres are extensions of the cell, not separate cells.'),
  closure:P('神經元含細胞本體和延伸的神經纖維；許多神經纖維集合成束，形成神經。','A neuron has a cell body and extending nerve fibres. Bundles of nerve fibres form nerves.'),
  reading:P('細胞本體中有細胞核，維持神經元的生長與代謝。延伸出去的神經纖維可傳遞訊息：樹突多而短，軸突通常較長。神經元、神經纖維與整條神經是不同的層級：神經是許多神經纖維集合成的一束。圖中大小為示意。','The cell body contains the nucleus and maintains growth and metabolism. Its extending fibres carry signals: dendrites are many and short, while the axon is usually longer. A neuron, a nerve fibre and a whole nerve are different levels: a nerve is a bundle of many nerve fibres. Sizes are schematic.'),
  sources:[],init:()=>({running:true,part:'body'}),controls:()=>[choice(P('放大位置','Enlarge'),'part',[['body',P('細胞本體','Cell body')],['fibre',P('神經纖維','Nerve fibres')],['nerve',P('神經','Nerve')]])],
  explain:s=>({title:s.part==='body'?P('細胞本體內有細胞核','The cell body contains a nucleus'):s.part==='fibre'?P('細長突起仍是細胞的一部分','Extensions remain part of the cell'):P('神經是一束神經纖維','A nerve is a bundle of fibres'),
   text:s.part==='body'?P('放大鏡裡是細胞本體；紫色構造是細胞核。細胞本體的臉只是擬人化裝飾。','The magnifier shows the cell body; the purple structure is the nucleus. The face is only decoration.'):s.part==='fibre'?P('沿著細胞突起傳遞訊息；發亮符號代表訊息到達，不是分子在神經裡一路跑。','Signals travel along cell extensions. The glow represents a signal arriving, not a molecule travelling along the entire nerve.'):P('許多神經元的神經纖維並排在一起，外面有膜包住，就成了一條神經；每條纖維各自傳自己的訊息。神經元的細胞本體不在這一束裡。神經不是一顆神經元。','The fibres of many neurons run side by side, wrapped together, to form a nerve; each fibre carries its own signal. The cell bodies are outside the bundle. A nerve is not a single neuron.')}),draw:drawNeuron},
 {id:'journey',title:P('有收到，還要有回應','Detect, then respond'),sub:P('受器、整合與動器','Receptors, integration, effectors'),hook:P('天氣熱時不只會想開冷氣，還會流汗。這兩種反應的動器相同嗎？','In heat you may move toward a fan and also sweat. Are the effectors the same?'),
  body:P('用同一套接收、整合、反應的流程，比較肌肉動作與腺體分泌。','Compare muscle movement and gland secretion using the same detect–integrate–respond model.'),
  closure:P('動器不只有肌肉，腺體也是動器。完整反應需要受器、傳訊與整合、動器共同完成。','Effectors include glands as well as muscles. A complete response requires detection, signaling and integration, then an effector.'),
  sources:[],init:()=>({running:true,effect:'muscle',step:-1}),controls:()=>[choice(P('動器','Effector'),'effect',[['muscle',P('肌肉收縮','Muscle contracts')],['gland',P('汗腺分泌','Sweat gland secretes')]]),stepControls(journey)],
  explain:s=>({title:journey[journeyClock(s,s.elapsed||0).stage],text:s.effect==='muscle'?P('皮膚受器接收溫度刺激，訊息由感覺神經元傳到中樞神經；中樞整合後，再由另一條運動神經元把訊息傳到肌肉，肌肉收縮產生動作。傳入和傳出是兩條不同的神經元。此圖只呈現分工，不等同特定反射弧。','Skin receptors detect temperature. A sensory neuron carries the message to the central nervous system; after integration, a different motor neuron carries it to a muscle, which contracts to produce movement. The incoming and outgoing paths are two different neurons. This diagram shows roles, not a specific reflex arc.'):P('一樣由感覺神經元傳入、中樞整合，再由另一條傳出的神經元把訊息送到汗腺；汗腺分泌汗液，並不是肌肉收縮。汗液蒸發有助散熱。','Again a sensory neuron carries the message in and the CNS integrates it; a different outgoing neuron then reaches the sweat gland, which secretes rather than contracts. Evaporation of sweat helps heat loss.')}),draw:drawJourney},
 {id:'reaction',title:P('看到就能立刻動？','Can you react instantly?'),sub:P('反應時間與紀錄','Reaction time and records'),hook:P('不要預猜！等畫面真的變綠，再按「反應」。多做幾次，結果一樣嗎？','Do not guess! Wait until the panel turns green, then respond. Are repeated results identical?'),
  body:P('這是螢幕視覺反應練習。真實接尺實驗要記直尺落下的距離；本練習記的是畫面變色到按鍵的時間。','This is an on-screen visual reaction task. The physical ruler experiment records falling distance; this task records the interval from colour change to your press.'),
  closure:P('刺激接收、訊息整合與肌肉反應都需要時間。練習、注意力與測量方式可能影響結果。','Detection, integration and muscle responses take time. Practice, attention and the measurement method can affect results.'),
  reading:P('接尺時，受試者手臂平放桌上，拇指與食指對準 0 cm 但不碰尺；主試者不預告放手時刻。記錄落下距離，重複五次，再交換角色。不要把掉尺距離直接當成時間。這裡的毫秒數包含畫面更新與裝置輸入延遲，不是診斷工具，也不能拿不同裝置的成績當能力排名。','In the ruler task, rest the arm on the table and align thumb and index finger with 0 cm without touching the ruler. The tester releases it without warning. Record falling distance, repeat five times, then exchange roles. Distance is not time. On-screen milliseconds include display and input delays: they are not diagnostic and should not rank ability across devices.'),
  record:P('做五次：結果有沒有變化？注意力、預猜或裝置延遲，可能怎樣影響結果？另做實體接尺時，請記錄距離與單位。','Try five times. How do attention, guessing and device delays affect the results? For a physical ruler test, record distance and units.'),
  sources:[],noPause:true,init:()=>({running:true,phase:'idle',scores:[],trial:0}),
  controls:s=>[{label:P('操作','Task'),items:[{label:P('開始等待','Start waiting'),key:'start',value:true,disabled:s.phase==='wait'||s.phase==='go'},{label:P('反應！','Respond!'),key:'respond',value:true,disabled:s.phase==='idle'||s.phase==='done'||s.phase==='early'}]}],
  act(s,k){if(k==='start'){s.phase='wait';s.trial++;s.due=performance.now()+2000+Math.random()*2500;s.response=0;}if(k==='respond'){if(s.phase==='wait')s.phase='early';else if(s.phase==='go'){s.response=Math.round(performance.now()-s.onset);s.scores.push(s.response);s.scores=s.scores.slice(-5);s.phase='done';}}},
  cancel(s){if(s.phase==='wait'||s.phase==='go')s.phase='idle';},
  update(s,now){if(s.phase==='wait'&&now>=s.due){s.phase='go';s.onset=now;return true;}return false;},
  explain:s=>({title:s.phase==='go'?P('現在按下！','Respond now!'):s.phase==='wait'?P('等待變綠，不要預猜','Wait for green; do not guess'):s.phase==='early'?P('搶先了，這次不計','Too early; trial excluded'):s.phase==='done'?P(`${s.response} 毫秒`,`${s.response} ms`):P('準備好再開始','Start when ready'),text:s.scores.length?P(`最近 ${s.scores.length} 次：${s.scores.join('、')} 毫秒。結果包含裝置延遲。`,`Last ${s.scores.length}: ${s.scores.join(', ')} ms. Results include device delays.`):P('可按控制鍵，也可點右側大方塊；變綠後才反應。','Use the button or tap the large panel. Respond only after it turns green.')}),draw:drawReaction},
 {id:'adaptation',title:P('同一盆水，感覺不同','Same water, different feel'),sub:P('溫度感覺與適應','Temperature and adaptation'),hook:P('兩隻手放進同一盆水，一隻說冷、一隻說熱，誰說錯了？','Both hands enter the same water. One feels cold, one warm. Who is wrong?'),
  body:P('先讓一手接觸溫水、一手接觸涼水，再一起移到中間水盆。動畫是感覺比較模型，不是真實溫度量測。','First expose one hand to warm water and the other to cool water, then move both to the middle basin. This model compares sensations; it does not measure temperature.'),
  closure:P('感覺會受先前刺激影響；判斷水溫要靠溫度計，不能只靠手的感覺。','Prior stimulation affects sensation. Use a thermometer, not touch alone, to determine water temperature.'),
  reading:P('課本條件：溫水約 35～40°C，中間水約 20～25°C，涼水約 10～15°C；先接觸兩端水盆約 30 秒，再移到中間。由老師準備、確認水溫；不要使用極冷或極熱的水。這個活動比較的是感覺，不是證明中間水盆有兩種溫度。','Textbook conditions: warm water about 35–40°C, middle water about 20–25°C, cool water about 10–15°C. After about 30 seconds in the outer basins, move both hands to the middle. A teacher should prepare and check temperatures; avoid extreme heat or cold. The task compares sensations, not two temperatures in one basin.'),
  sources:[],init:()=>({running:true,transfer:false,fromPos:[165,795],start:0}),
  act(s,k,v){const p=Math.min(Math.max((s.elapsed-s.start)/1.5,0),1),dest=s.transfer?[425,520]:[165,795];s.fromPos=s.fromPos.map((x,i)=>x+(dest[i]-x)*p);s.transfer=v;s.start=s.elapsed;},
  controls:()=>[choice(P('手的位置','Hands'),'transfer',[[false,P('先接觸兩端','Outer basins first')],[true,P('一起移到中間','Both to the middle')]])],
  explain:s=>({title:s.transfer?P('相同水溫，感覺相對','Same temperature, relative sensations'):P('先前刺激不同','Different prior stimuli'),text:s.transfer?P('先接觸溫水的手，移到中間常覺得較冷；先接觸涼水的手，移到中間常覺得較暖。','The hand from warm water often feels cooler in the middle; the hand from cool water often feels warmer.'):P('兩手先接觸不同溫度的水；比較前先保持中間水盆的溫度相同。','The hands first encounter different temperatures. Keep the middle basin unchanged for the comparison.')}),draw:drawAdaptation},
 {id:'vision',title:P('影像怎麼還在？','Why does the image stay?'),sub:P('視覺暫留與視覺疲勞','Persistence and visual fatigue'),
  hook:P('快速翻轉一面畫鳥、一面畫鳥籠的卡片，為什麼小鳥會進到籠子裡？盯著紅蘋果看 20 秒再看白紙，為什麼會浮現「綠蘋果」？','Spin a card with a bird on one side and a cage on the other—why does the bird appear inside the cage? Stare at a red apple for 20 seconds, then look at white paper—why does a green apple appear?'),
  body:P('切換「視覺暫留」與「視覺疲勞」兩個實驗：觀察快速旋轉雙面卡如何疊合成「籠中鳥」（正片後像），以及長時間凝視鮮豔圖案後在白紙上浮現的互補色「負片後像」。','Switch between Persistence of Vision and Visual Fatigue: see how a fast-spinning card merges a bird and cage (positive afterimage), and how staring at bright colours produces a complementary negative afterimage on white paper.'),
  closure:P('視覺印象在刺激消失後仍短暫停留（視覺暫留）；若受器長時間受同一色光刺激而疲勞，移開視線看白紙會出現形狀相同、顏色互補的負片後像。','Visual impressions linger briefly after a stimulus ends (persistence of vision). When colour receptors fatigue from prolonged staring, looking at white paper reveals a complementary-colour negative afterimage.'),
  reading:P('凝視物體後移開視線，影像仍短暫留存的現象稱為後像。若只短暫觀看，因視覺暫留而出現與原物顏色相同的「正片後像」，例如快速旋轉籠中鳥卡片、雨滴連成細線、卡通與電影的連續畫面。若長時間凝視鮮豔色塊（約 20 秒），負責該色光的視覺受器產生疲勞，改看白紙時該色光反應減弱，便會看到互補色的「負片後像」：紅配綠、藍配黃、黑配白。','An image remaining briefly after looking away is an afterimage. Brief viewing produces a positive afterimage of the same colour through persistence of vision—as in a bird-in-cage thaumatrope, rain streaks, and animation. Prolonged staring (about 20 s) fatigues specific colour receptors; looking at white paper then produces a complementary negative afterimage: red with green, blue with yellow, and black with white.'),
  sources:[],
  init:()=>({running:true,exp:'persistence',speed:'fast',target:'apple',step:'stare',stepStart:0}),
  act(s,k,v){
    s[k]=v;
    if(k==='exp'||k==='target'){s.step='stare';s.stepStart=s.elapsed||0;}
    if(k==='step')s.stepStart=s.elapsed||0;
  },
  controls:s=>s.exp==='persistence'
    ?[
      choice(P('實驗切換','Experiment'),'exp',[['persistence',P('視覺暫留：籠中鳥','Persistence: Bird in cage')],['fatigue',P('視覺疲勞：互補色後像','Visual fatigue: Afterimage')]]),
      choice(P('翻轉速度','Spin speed'),'speed',[['still',P('靜止看單面','Still')],['slow',P('慢速翻轉','Slow flip')],['fast',P('快速旋轉','Fast spin')]])
    ]
    :[
      choice(P('實驗切換','Experiment'),'exp',[['persistence',P('視覺暫留：籠中鳥','Persistence: Bird in cage')],['fatigue',P('視覺疲勞：互補色後像','Visual fatigue: Afterimage')]]),
      choice(P('凝視圖案','Target'),'target',[['apple',P('紅蘋果＋綠葉','Red apple & green leaf')],['moon',P('黃月亮＋藍夜空','Yellow moon & blue sky')]]),
      choice(P('實驗步驟','Step'),'step',[['stare',P('① 凝視左圖中心','1. Stare at center')],['white',P('② 看右側白紙','2. Look at white paper')]])
    ],
  explain:s=>s.exp==='persistence'
    ?({
      title:s.speed==='fast'?P('視覺暫留：兩面影像疊合成「籠中鳥」','Persistence of vision: bird and cage merge'):P('翻轉太慢時，兩面影像不會疊合','When flipped slowly, the two sides do not merge'),
      text:s.speed==='fast'
        ?P('當卡片快速旋轉，正面「小鳥」的視覺印象還沒消失（約停留 0.1 秒），背面「鳥籠」的影像就傳到腦中，兩者疊合看起來就像小鳥關在籠子裡！','When the card spins rapidly, the impression of the bird lingers (~0.1 s) while the cage arrives, so the brain perceives the bird inside the cage.')
        :P('靜止或慢速翻轉時，前一張影像已經消失才出現下一張，因此只會輪流看到單獨的小鳥或空的鳥籠。','When still or flipping slowly, one image fades before the next arrives, so you only see the bird or the empty cage in turn.')
    })
    :({
      title:s.step==='white'?P('視覺疲勞：白紙上浮現互補色「負片後像」','Visual fatigue: complementary afterimage on white paper'):P('凝視中心「＋」字，讓特定色光受器疲勞','Stare at the + cross to fatigue colour receptors'),
      text:s.step==='white'
        ?P(s.target==='apple'
          ?'久看紅蘋果與綠葉後，接收紅光與綠光的受器分別疲勞；移到白紙（反射各種色光）時，疲勞受器反應減弱，腦中便浮現互補色「青綠蘋果＋紅葉」的負片後像。'
          :'久看黃月亮與藍底後，移到白紙時，疲勞受器反應減弱，腦中便浮現互補色「藍月亮＋黃底」的負片後像。',
          s.target==='apple'
          ?'After staring at the red apple and green leaf, those colour receptors fatigue. On white paper, the complementary cyan-green apple and red leaf appear.'
          :'After staring at the yellow moon on blue, looking at white paper reveals the complementary blue moon on yellow.')
        :P('請專心盯住左側圖案中央的「＋」字約 15～20 秒不要眨眼或移開，再點選「② 看右側白紙」觀察後像。','Fix your gaze on the center + of the left figure for 15–20 seconds, then select "2. Look at white paper" to observe the afterimage.')
    }),
  draw:drawVision}
];
const tabsHost=document.getElementById('lessonTabs');if(tabsHost)tabsHost.style.setProperty('--tab-count','3');
B.register({id:'nervous',title:P('神經訊息：刺激到反應','Nerve signals: from stimulus to response'),subtitle:P('受器、神經元、動器，與可以親自記錄的反應練習','Receptors, neurons, effectors and your own reaction records'),cover:'assets/covers/biology_nervous_1009_v1.jpg',tabs});
})();

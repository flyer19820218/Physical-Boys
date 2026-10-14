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
function blush(c,x,y,r){c.save();c.globalAlpha=.5;ellipse(c,x,y,r,r*.6,'#f59aa8');c.restore();}
function sparkle(c,x,y,s,color=C.yellow){c.save();c.translate(x,y);c.beginPath();for(let i=0;i<8;i++){const r=i%2?s*.32:s,a=i*Math.PI/4-Math.PI/2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fillStyle=color;c.fill();c.restore();}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(85,233,255,0)');c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function pathLength(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
function along(pts,u){const L=pathLength(pts);let d=clamp(u)*L;for(let i=1;i<pts.length;i++){const s=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(d<=s||i===pts.length-1){const f=s?Math.min(1,d/s):0;return[mix(pts[i-1][0],pts[i][0],f),mix(pts[i-1][1],pts[i][1],f)];}d-=s;}return pts[pts.length-1];}
// A nerve signal: a glowing dot that travels; it marks the message, not a moving substance.
function signal(c,pts,u,r=9){if(u<0||u>1)return;const [x,y]=along(pts,u);glow(c,x,y,r*2.6);D.sphere(c,x,y,r,C.cyan);}
function nerveLine(c,pts,w=7){line(c,pts,C.ink,w+4);line(c,pts,C.nerve,w);}
function arrow(c,x1,y1,x2,y2,color,w=3){line(c,[[x1,y1],[x2,y2]],color,w);const a=Math.atan2(y2-y1,x2-x1),l=12;line(c,[[x2-l*Math.cos(a-.5),y2-l*Math.sin(a-.5)],[x2,y2],[x2-l*Math.cos(a+.5),y2-l*Math.sin(a+.5)]],color,w);}
function brain(c,x,y,s,active){
  if(active)glow(c,x,y,s*1.6,C.cyan,.6);
  c.save();c.translate(x,y);
  c.beginPath();c.moveTo(-s*.95,s*.15);c.bezierCurveTo(-s*1.1,-s*.6,-s*.35,-s*.95,0,-s*.7);c.bezierCurveTo(s*.4,-s*1,s*1.15,-s*.55,s*.95,s*.15);c.bezierCurveTo(s*1,s*.65,s*.2,s*.8,0,s*.55);c.bezierCurveTo(-s*.3,s*.85,-s*1,s*.65,-s*.95,s*.15);c.closePath();
  c.fillStyle=C.brain;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  for(const [a,b,d] of [[-.55,-.35,.25],[-.2,.05,.2],[.3,-.4,.22],[.45,.15,.2],[-.6,.3,.18]]){c.beginPath();c.arc(a*s,b*s,d*s,.2,2.6);c.strokeStyle='#c76f86';c.lineWidth=2.5;c.stroke();}
  c.restore();
}
function node(c,p,x,y,w,h,active,color=C.cyan){D.round(c,x,y,w,h,14,active?color:C.panel,active?C.white:'#47675d');
  const lines=Math.min(2,Math.ceil(measure(c,D.tr(p),22)/(w-18)));wrap(c,p,x+10,y+h/2+(lines>1?-4:8),w-18,22,active?C.deep:C.white);}
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
 {name:P('皮膚','Skin'),stim:P('溫度、觸碰與壓力','Temperature, touch and pressure'),rec:P('皮膚受器','Skin receptors'),loc:P('皮膚中有不同的受器，能接收溫度、碰觸、壓力及傷害等刺激。','Different skin receptors detect temperature, touch, pressure and potentially damaging stimuli.')}
];
const FACE={x:225,y:300,r:132};
const ORGAN=[[FACE.x+FACE.r*.38,FACE.y-FACE.r*.06,34],[FACE.x-FACE.r*1.0,FACE.y+12,36],[FACE.x,FACE.y+FACE.r*.2,28],[FACE.x,FACE.y+FACE.r*.56,30],[398,452,46]];
function kidFace(c,t,sel){
  const {x,y,r}=FACE;
  for(const side of [-1,1]){ellipse(c,x+side*r*.98,y+12,r*.2,r*.3,C.skin,C.ink,3);ellipse(c,x+side*r*.98,y+12,r*.09,r*.16,C.skinDark);}
  circle(c,x,y,r,C.skin,C.ink,4);
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  c.beginPath();c.moveTo(x-r*1.1,y-r*.15);c.bezierCurveTo(x-r*.9,y-r*1.25,x+r*.9,y-r*1.25,x+r*1.1,y-r*.2);c.lineTo(x+r*.7,y-r*.5);c.quadraticCurveTo(x+r*.35,y-r*.32,x+r*.05,y-r*.55);c.quadraticCurveTo(x-r*.3,y-r*.3,x-r*.75,y-r*.45);c.closePath();
  c.fillStyle=C.hair;c.fill();c.restore();circle(c,x,y,r,null,C.ink,4);
  eyes(c,x,y-r*.06,r*.12,sel===0?'surprised':'happy',[0,0]);
  c.beginPath();c.moveTo(x-4,y+r*.1);c.quadraticCurveTo(x+12,y+r*.24,x-6,y+r*.27);c.strokeStyle=C.ink;c.lineWidth=3;c.lineCap='round';c.stroke();
  c.beginPath();c.moveTo(x-r*.28,y+r*.44);c.quadraticCurveTo(x,y+r*.74,x+r*.28,y+r*.44);c.closePath();c.fillStyle='#8a2f3c';c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  ellipse(c,x,y+r*.6,r*.15,r*.08,'#f48fa6');
  blush(c,x-r*.55,y+r*.2,r*.12);blush(c,x+r*.55,y+r*.2,r*.12);
  // A raised hand touching a warm cup (skin receptors).
  const hx=398,hy=452;
  c.save();c.translate(hx,hy);c.rotate(-.25);
  for(let k=0;k<4;k++){c.beginPath();c.roundRect(-26+k*14,-62,12,40,6);c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=2.5;c.stroke();}
  c.beginPath();c.roundRect(-30,-30,60,52,18);c.fillStyle=C.skin;c.fill();c.stroke();
  c.beginPath();c.ellipse(-34,-6,10,20,-.7,0,TAU);c.fillStyle=C.skin;c.fill();c.stroke();c.restore();
  D.round(c,328,468,46,40,8,C.orange,C.ink);for(let i=0;i<3;i++)line(c,[[338+i*12,462],[334+i*12+Math.sin(t*3+i)*4,448],[340+i*12,434]],'#fbd38d',3);
}
function zoomEye(c,t){
  circle(c,515,215,22,C.yellow,C.ink,3);for(let i=0;i<8;i++){const a=i*TAU/8+t*.3;line(c,[[515+Math.cos(a)*30,215+Math.sin(a)*30],[515+Math.cos(a)*40,215+Math.sin(a)*40]],C.yellow,3);}
  circle(c,690,225,92,'#f6f3ea',C.ink,4);
  c.beginPath();c.arc(690,225,82,-.95,.95);c.strokeStyle='#f29bb0';c.lineWidth=14;c.stroke();
  ellipse(c,612,225,14,34,'#a9dcf3',C.ink,3);ellipse(c,598,225,8,22,C.ink);
  const hit=mod(t*.45),rays=[[[545,200],[612,212],[770,230]],[[545,225],[612,225],[770,230]],[[545,250],[612,238],[770,230]]];
  for(const r of rays){line(c,r,'rgba(253,224,71,.85)',3);const [x,y]=along(r,hit<.5?hit*2:1);circle(c,x,y,5,C.yellow);}
  for(let i=-3;i<=3;i++){const a=i*.18,rx=690+Math.cos(a)*82,ry=225+Math.sin(a)*82;circle(c,rx,ry,5,hit>.45?C.cyan:'#c76f86');}
  const nerve=[[772,225],[820,205],[860,170],[880,148]];nerveLine(c,nerve,8);signal(c,nerve,(hit-.5)*2);
}
function zoomEar(c,t){
  D.round(c,490,190,40,60,10,'#9aa6b0',C.ink);c.beginPath();c.moveTo(530,195);c.lineTo(560,170);c.lineTo(560,270);c.lineTo(530,245);c.closePath();c.fillStyle='#c4ccd3';c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  for(let i=0;i<3;i++){const r=20+((t*40+i*24)%72);c.beginPath();c.arc(560,220,r,-.6,.6);c.strokeStyle=`rgba(253,224,71,${1-r/95})`;c.lineWidth=3;c.stroke();}
  c.beginPath();c.moveTo(640,150);c.bezierCurveTo(600,150,600,300,650,300);c.bezierCurveTo(690,300,690,250,665,240);c.bezierCurveTo(645,230,660,190,680,195);c.lineTo(680,160);c.closePath();c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  D.round(c,672,212,70,22,10,'#e8b996',C.ink);
  const v=Math.sin(t*10)*2;line(c,[[744+v,200],[744-v,246]],'#f4a6b8',6);
  const hit=mod(t*.45),spiral=[];for(let i=0;i<=60;i++){const a=i/60*TAU*2.2,r=34-i*.45;spiral.push([800+Math.cos(a)*r,230+Math.sin(a)*r]);}
  line(c,spiral,C.ink,10);line(c,spiral,hit>.4?C.cyan:'#f4a6b8',6);
  const nerve=[[832,214],[858,180],[880,150]];nerveLine(c,nerve,8);signal(c,nerve,(hit-.5)*2);
}
function zoomNose(c,t){
  c.beginPath();c.moveTo(560,110);c.quadraticCurveTo(600,170,640,250);c.quadraticCurveTo(660,300,620,310);c.lineTo(580,330);c.lineTo(900,330);c.lineTo(900,110);c.closePath();c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=4;c.stroke();
  c.beginPath();c.moveTo(640,300);c.quadraticCurveTo(700,230,700,170);c.quadraticCurveTo(760,140,860,160);c.quadraticCurveTo(870,250,820,310);c.closePath();c.fillStyle='#e79a9a';c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  const patch=[[715,165],[750,150],[790,148],[830,155]],hit=mod(t*.4);
  line(c,patch,C.ink,14);line(c,patch,hit>.6?C.cyan:C.receptor,9);
  D.round(c,490,300,64,34,8,'#fbbf6a',C.ink);ellipse(c,522,300,26,8,'#fde68a',C.ink,2);
  for(let i=0;i<5;i++){const path=[[520,290],[600,280],[660,300],[690,240],[730+i*20,170]],u=mod(t*.4+i*.2);const [x,y]=along(path,u);circle(c,x,y,6,['#fb923c','#f472b6','#a78bfa','#fde047','#4ade80'][i],C.ink,1.5);}
  const nerve=[[770,148],[785,120],[805,96]];nerveLine(c,nerve,7);signal(c,nerve,(hit-.6)*2.5);
}
function zoomTongue(c,t){
  c.beginPath();c.moveTo(500,330);c.quadraticCurveTo(520,250,640,250);c.quadraticCurveTo(740,250,740,300);c.quadraticCurveTo(740,340,690,350);c.lineTo(500,350);c.closePath();c.fillStyle='#f48fa6';c.fill();c.strokeStyle=C.ink;c.lineWidth=4;c.stroke();
  for(let i=0;i<9;i++)circle(c,540+i*22,280+(i%2)*14,5,'#f7b2c2');
  circle(c,660,272,9,null,C.yellow,3);line(c,[[668,265],[735,205]],C.yellow,2);
  circle(c,800,190,82,'#f8c9d4',C.ink,4);
  c.save();c.beginPath();c.arc(800,190,78,0,TAU);c.clip();
  for(let i=-3;i<=3;i++){c.beginPath();c.ellipse(800+i*12,205,9,46,i*.12,0,TAU);c.fillStyle=mod(t*.45)>.5?'#9be7f7':'#f3e4b0';c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();}
  c.restore();
  ellipse(c,800,152,10,6,'#f48fa6',C.ink,2);
  for(let i=0;i<4;i++){const u=mod(t*.45+i*.25),y=mix(100,150,u);circle(c,790+i*7,y,4,'#7dd3fc',C.ink,1.2);}
  const nerve=[[800,250],[840,290],[880,300],[900,270]],hit=mod(t*.45);nerveLine(c,nerve,7);signal(c,nerve,(hit-.5)*2);
  D.round(c,525,120,60,40,10,'#c084fc',C.ink);for(let i=0;i<3;i++){const u=mod(t*.5+i/3);circle(c,555,mix(165,245,u),4,'#7dd3fc');}
}
function zoomSkin(c,t){
  D.round(c,480,170,430,40,6,'#f1c9a5',C.ink);D.round(c,480,210,430,140,6,'#e8a9a1',C.ink);
  const hit=mod(t*.45),on=hit>.35;
  ellipse(c,590,250,16,26,on?C.cyan:'#f6e3b4',C.ink,2.5);for(let k=1;k<4;k++)ellipse(c,590,250,16-k*4,26-k*6,null,'#c9a36a',1.5);
  for(const a of [-.6,-.2,.2,.6])line(c,[[720,300],[720+Math.sin(a)*24,230]],on?C.cyan:C.nerve,4);
  for(let k=0;k<5;k++)ellipse(c,830,300,20-k*3.5,14-k*2.5,k%2?'#f6e3b4':'#efd39b',C.ink,1.5);
  D.round(c,690,110,60,58,10,C.orange,C.ink);for(let i=0;i<3;i++)line(c,[[700+i*16,104],[696+i*16+Math.sin(t*3+i)*4,88],[702+i*16,72]],'#fbd38d',3);
  for(let i=0;i<3;i++){const u=mod(t*.6+i/3);line(c,[[700+i*18,170+u*40],[708+i*18,178+u*40]],'#fb923c',3);}
  line(c,[[590,276],[600,335],[900,335]],C.ink,10);line(c,[[590,276],[600,335],[900,335]],C.nerve,6);line(c,[[720,300],[720,335]],C.nerve,5);line(c,[[830,314],[830,335]],C.nerve,5);
  signal(c,[[720,300],[720,335],[900,335]],(hit-.35)*1.6);
}
const ZOOMS=[zoomEye,zoomEar,zoomNose,zoomTongue,zoomSkin];
function drawSenses(c,s,t){
  const q=senses[s.sense];
  text(c,P('點臉上的器官，看受器怎麼接收','Tap an organ to see its receptors'),30,40,24,C.yellow);
  kidFace(c,t,s.sense);
  ORGAN.forEach(([x,y,r],i)=>{D.hit(x-r,y-r,r*2,r*2,'sense',i);if(i===s.sense){c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*20;circle(c,x,y,r+4*Math.sin(t*4),null,C.yellow,4);c.restore();}});
  const [ox,oy]=ORGAN[s.sense];line(c,[[ox+(s.sense===1?-10:20),oy],[460,140]],'rgba(253,224,71,.55)',2);
  panel(c,460,62,470,320);c.save();c.beginPath();c.roundRect(462,64,466,316,15);c.clip();ZOOMS[s.sense](c,t);c.restore();
  brain(c,s.sense===2?830:888,s.sense===2?84:126,24,mod(t*.45)>.85||mod(t*.4)>.88);
  text(c,q.stim,480,100,22,C.yellow);text(c,q.rec,480,368,22,C.cyan);
  const names=[q.stim,P('受器接收','Receptor detects'),P('神經訊息','Nerve signal'),P('腦','Brain')],idx=Math.floor(t*.8)%4;
  names.forEach((p,i)=>{const x=460+i*121;node(c,p,x,404,108,76,i===idx,i===0?C.yellow:C.cyan);if(i)arrow(c,x-12,442,x-2,442,C.cyan,3);});
  wrap(c,P('感覺器官把刺激變成神經訊息，不是把東西送進腦。','Sense organs turn stimuli into nerve signals; they do not send the thing itself to the brain.'),30,548,900,22,C.cyan);
}

// ── Tab 2: neuron, nerve fibres, nerve ─────────────────────────────────────
const SOMA={x:255,y:300,r:60};
const DENDRITES=(()=>{const out=[];const grow=(x,y,a,len,w,depth,seed)=>{const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;out.push({pts:[[x,y],[mix(x,x2,.5)+Math.sin(seed)*6,mix(y,y2,.5)+Math.cos(seed)*6],[x2,y2]],w,depth});
  if(depth<2)for(const d of [-.45,.42])grow(x2,y2,a+d+Math.sin(seed*3)*.12,len*.62,w*.62,depth+1,seed*1.7+d);};
  [2.4,2.9,3.4,3.9,1.75,4.55].forEach((a,i)=>grow(SOMA.x+Math.cos(a)*SOMA.r*.85,SOMA.y+Math.sin(a)*SOMA.r*.85,a,70,11,0,i+1));return out;})();
const AXON=(()=>{const p=[];for(let x=SOMA.x+SOMA.r*.9;x<=790;x+=10)p.push([x,SOMA.y+Math.sin((x-300)/70)*10]);return p;})();
const TERMINALS=[-.7,-.35,0,.35,.7].map(a=>{const s=AXON[AXON.length-1];return[[s[0],s[1]],[s[0]+40,s[1]+a*40],[s[0]+70,s[1]+a*75]];});
function neuronBody(c,t,face=true){
  const g=c.createRadialGradient(SOMA.x-20,SOMA.y-22,6,SOMA.x,SOMA.y,SOMA.r*1.2);g.addColorStop(0,'#eef6ff');g.addColorStop(1,'#9fc5ec');
  c.beginPath();for(let i=0;i<=36;i++){const a=i/36*TAU,r=SOMA.r*(1+.06*Math.sin(a*5+t));c[i?'lineTo':'moveTo'](SOMA.x+Math.cos(a)*r,SOMA.y+Math.sin(a)*r);}c.closePath();c.fillStyle=g;c.fill();c.strokeStyle=C.ink;c.lineWidth=3.5;c.stroke();
  circle(c,SOMA.x-6,SOMA.y+20,20,'#8e6fd1',C.ink,2.5);circle(c,SOMA.x-1,SOMA.y+16,6,'#c4b5fd');
  if(face){eyes(c,SOMA.x+4,SOMA.y-20,7,'happy',[.6,0]);smile(c,SOMA.x+6,SOMA.y-4,14);}
}
// A nerve: the long fibres of several neurons run side by side inside one
// wrapping sheath. Cell bodies lie outside the bundle; each fibre carries its
// own signal, so the dots travel at different times.
const NERVE_SOMAS=[[118,150],[166,225],[104,300],[160,375],[116,450]];
const NERVE_FIBRES=NERVE_SOMAS.map(([x,y],i)=>{
  const lane=300+(i-2)*11,pts=[],tx=880,ty=118+i*70;
  for(let k=0;k<=12;k++){const u=k/12,a=1-u;pts.push([a*a*a*(x+22)+3*a*a*u*260+3*a*u*u*320+u*u*u*380,a*a*a*y+3*a*a*u*y+3*a*u*u*lane+u*u*u*lane]);}
  for(let xx=390;xx<=760;xx+=10)pts.push([xx,lane+Math.sin((xx-380)/55+i*1.3)*2.5]);
  for(let k=1;k<=12;k++){const u=k/12,a=1-u;pts.push([a*a*a*760+3*a*a*u*810+3*a*u*u*840+u*u*u*tx,a*a*a*lane+3*a*a*u*lane+3*a*u*u*ty+u*u*u*ty]);}
  return{pts,soma:[x,y],end:[tx,ty]};});
function drawNerve(c,t){
  for(const f of NERVE_FIBRES){line(c,f.pts,C.ink,9);line(c,f.pts,'#bcd8f3',5);}
  // Sheath drawn over the fibres (translucent) so they read as wrapped inside.
  c.save();c.beginPath();c.roundRect(370,262,404,76,38);c.fillStyle='rgba(233,215,168,.42)';c.fill();c.lineWidth=4;c.strokeStyle='#e9d7a8';c.stroke();c.restore();
  c.save();c.beginPath();c.roundRect(370,262,404,76,38);c.lineWidth=1.5;c.strokeStyle=C.ink;c.stroke();c.restore();
  NERVE_FIBRES.forEach((f,i)=>{
    for(const a of [2.3,2.9,3.5,4.0]){const [x,y]=f.soma;line(c,[[x,y],[x+Math.cos(a)*34,y+Math.sin(a)*30],[x+Math.cos(a)*48,y+Math.sin(a)*42-6]],C.ink,6);line(c,[[x,y],[x+Math.cos(a)*34,y+Math.sin(a)*30],[x+Math.cos(a)*48,y+Math.sin(a)*42-6]],'#bcd8f3',3);}
    const g=c.createRadialGradient(f.soma[0]-7,f.soma[1]-8,3,f.soma[0],f.soma[1],26);g.addColorStop(0,'#eef6ff');g.addColorStop(1,'#9fc5ec');
    circle(c,f.soma[0],f.soma[1],22,g,C.ink,3);circle(c,f.soma[0]-3,f.soma[1]+5,8,'#8e6fd1',C.ink,2);
    ellipse(c,f.end[0]+22,f.end[1],22,12,'#f472b6',C.ink,2.5);circle(c,f.end[0],f.end[1],6,'#bcd8f3',C.ink,2);
    signal(c,f.pts,mod(t*.3+i*.21),7);
  });
  // Cross-section of the nerve: many fibre ends inside one wrapping.
  line(c,[[600,338],[600,404]],C.yellow,3);circle(c,600,470,64,'#e9d7a8',C.ink,4);
  for(const [dx,dy] of [[0,0],[-22,-12],[22,-12],[-22,14],[22,14],[0,-26],[0,27],[-38,1],[38,1]])circle(c,600+dx,470+dy,10,'#bcd8f3',C.ink,2);
  text(c,P('神經元','Neurons'),40,112,22,'#bcd8f3');
  text(c,P('神經纖維','Nerve fibres'),200,122,22,'#bcd8f3');line(c,[[236,130],[256,160]],'#bcd8f3',2);
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
// No person: only the receptor, two SEPARATE neurons and the effector.
// Sensory neuron (blue) carries the message in; the central nervous system
// integrates; a different motor neuron (orange) carries it out. The two never
// touch: a visible gap marks the hand-over.
const SENSE_COL='#a5b4fc',MOTOR_COL='#fdba74';
const RECEPTOR=[170,452],HANDOVER=[486,198];
const SENSORY={den:[[170,452],[184,402],[205,348]],soma:[205,330],axon:[[205,330],[250,282],[316,246],[396,214],[452,198]]};
const MOTOR={den:[[514,196],[528,198],[540,198]],soma:[556,198],axon:[[556,198],[600,222],[634,262],[684,330],[736,394],[776,428]]};
// To a sweat gland the outgoing fibre ends on the coiled gland, not on the skin surface.
const MOTOR_GLAND={...MOTOR,axon:[[556,198],[600,222],[634,262],[684,330],[708,400],[704,468]]};
function neuronPath(c,n,color,glow){
  const fibre=[...n.den,...n.axon.slice(1)];
  line(c,fibre,C.ink,10);line(c,fibre,glow?'#fef9c3':color,6);
  const start=n.den[0];for(const a of [-2.3,-1.6,-.9,2.6])line(c,[start,[start[0]+Math.cos(a)*22,start[1]+Math.sin(a)*14]],color,3);
  const end=n.axon[n.axon.length-1],prev=n.axon[n.axon.length-2],ang=Math.atan2(end[1]-prev[1],end[0]-prev[0]);
  for(const d of [-.6,0,.6]){const tx=end[0]+Math.cos(ang+d)*20,ty=end[1]+Math.sin(ang+d)*20;line(c,[end,[tx,ty]],C.ink,7);line(c,[end,[tx,ty]],color,4);circle(c,tx,ty,6,color,C.ink,2);}
  const g=c.createRadialGradient(n.soma[0]-6,n.soma[1]-7,3,n.soma[0],n.soma[1],24);g.addColorStop(0,'#ffffff');g.addColorStop(1,color);
  circle(c,n.soma[0],n.soma[1],20,g,C.ink,3);circle(c,n.soma[0]-2,n.soma[1]+4,7,'#8e6fd1',C.ink,2);
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
function drawJourney(c,s,t){
  const stage=s.step<0?Math.floor(t*.7)%3:s.step,u=mod(t*.7),gland=s.effect==='gland';
  // Heat reaching the skin receptor.
  circle(c,82,330,26,C.yellow,C.ink,3);for(let i=0;i<8;i++){const a=i*TAU/8+t*.2;line(c,[[82+Math.cos(a)*34,330+Math.sin(a)*34],[82+Math.cos(a)*44,330+Math.sin(a)*44]],C.yellow,3);}
  for(let i=0;i<3;i++){const y=380+i*16;c.beginPath();for(let x=60;x<=150;x+=6)c.lineTo(x,y+Math.sin(x*.2+t*4)*3);c.strokeStyle='rgba(251,146,60,.7)';c.lineWidth=3;c.stroke();}
  D.round(c,30,440,280,22,4,'#f1c9a5',C.ink);D.round(c,30,462,280,44,4,'#e8a9a1',C.ink);
  text(c,P('皮膚','Skin'),262,492,22,C.deep,'center');
  // Central nervous system: where the two neurons hand the message over.
  D.round(c,316,84,330,178,18,stage===1?'#21524a':'#1c3d34',stage===1?C.cyan:'#5c8a7c');
  brain(c,346,120,20,stage===1);text(c,P('中樞神經（腦、脊髓）','CNS (brain, spinal cord)'),374,128,22,C.white);
  // Effector first, so the outgoing fibre stays visible where it reaches the gland.
  effector(c,t,s.effect,stage===2);
  const sFibre=neuronPath(c,SENSORY,SENSE_COL,stage===1&&u<.7);
  const mFibre=neuronPath(c,gland?MOTOR_GLAND:MOTOR,MOTOR_COL,stage===2);
  c.save();c.setLineDash([5,5]);circle(c,HANDOVER[0],HANDOVER[1],32,null,C.yellow,2.5);c.restore();
  sparkle(c,RECEPTOR[0],RECEPTOR[1],stage===0?17:11,stage===0?C.yellow:'#a3863a');if(stage===0)glow(c,RECEPTOR[0],RECEPTOR[1],32,C.yellow,.6);
  if(stage===1){
    signal(c,sFibre,u/.75);
    // The message crosses the small gap to the next neuron; the fibres stay apart.
    if(u>.75){const k=(u-.75)/.25;glow(c,HANDOVER[0],HANDOVER[1],30,C.cyan,.5);for(const dy of [-7,0,7])circle(c,mix(478,496,mod(k+dy*.05)),HANDOVER[1]+dy,3.5,C.cyan);}
  }
  if(stage===2)signal(c,mFibre,u);
  text(c,P('感覺神經元（傳入）','Sensory neuron (in)'),34,240,22,SENSE_COL);
  text(c,P('運動神經元（傳出）','Motor neuron (out)'),700,300,22,MOTOR_COL);
  text(c,P('交接處','Hand-over'),HANDOVER[0],252,22,C.yellow,'center');
  node(c,journey[0],30,516,280,48,stage===0,C.yellow);
  node(c,journey[1],316,22,330,48,stage===1,C.cyan);
  node(c,journey[2],650,516,280,48,stage===2,MOTOR_COL);
  D.round(c,660,30,270,92,12,C.panel,'#47675d');
  line(c,[[676,58],[716,58]],SENSE_COL,6);text(c,P('感覺神經元','Sensory neuron'),726,66,22,C.white);
  line(c,[[676,96],[716,96]],MOTOR_COL,6);text(c,P('運動神經元','Motor neuron'),726,104,22,C.white);
  wrap(c,P('是兩條不同的神經元：在中樞交接訊息，不是同一條來回。','Two different neurons meet in the CNS; not one neuron going there and back.'),30,592,900,22,C.cyan);
}

// ── Tab 4: reaction-time practice (timing logic unchanged) ────────────────
function cartoonHand(c,x,y,flip,open){c.save();c.translate(x,y);c.scale(flip?-1:1,1);
  c.beginPath();c.roundRect(-70,-22,70,44,20);c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  c.save();c.translate(-2,-12);c.rotate(open?-.5:-.15);c.beginPath();c.roundRect(0,-8,46,16,8);c.fillStyle=C.skin;c.fill();c.stroke();c.restore();
  c.save();c.translate(-2,12);c.rotate(open?.5:.15);c.beginPath();c.roundRect(0,-8,40,16,8);c.fillStyle=C.skin;c.fill();c.stroke();c.restore();c.restore();}
function drawReaction(c,s,t){
  panel(c,20,80,390,415);text(c,P('實體接尺：記錄落下距離','Ruler drop: record the distance'),40,118,22,C.yellow);
  const drop=s.phase==='done'?28:0;
  D.round(c,190,150+drop,36,290,6,'#fde68a',C.ink);for(let i=0;i<=28;i+=2){const y=430+drop-i*10;line(c,[[190,y],[i%10?202:212,y]],C.ink,2);if(i%10===0)text(c,String(i),232,y+7,22,C.white);}
  cartoonHand(c,234,170,true,false);
  cartoonHand(c,166,430,false,s.phase!=='done');
  text(c,'cm',252,476,22,C.muted);
  if(s.phase==='done')arrow(c,150,250,150,300,C.cyan,3);
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
  c.beginPath();c.roundRect(x-36,tip-120,72,70,24);c.fillStyle=C.skin;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  for(let k=0;k<4;k++){c.beginPath();c.roundRect(x-31+k*16,tip-62,14,k===0||k===3?50:62,7);c.fillStyle=C.skin;c.fill();c.stroke();}
  c.save();c.translate(x+(flip?-36:36),tip-96);c.rotate(flip?.6:-.6);c.beginPath();c.roundRect(-8,0,16,44,8);c.fillStyle=C.skin;c.fill();c.stroke();c.restore();
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
  explain:s=>({title:journey[s.step<0?Math.floor(s.elapsed*.7)%3:s.step],text:s.effect==='muscle'?P('皮膚受器接收溫度刺激，訊息由感覺神經元傳到中樞神經；中樞整合後，再由另一條運動神經元把訊息傳到肌肉，肌肉收縮產生動作。傳入和傳出是兩條不同的神經元。此圖只呈現分工，不等同特定反射弧。','Skin receptors detect temperature. A sensory neuron carries the message to the central nervous system; after integration, a different motor neuron carries it to a muscle, which contracts to produce movement. The incoming and outgoing paths are two different neurons. This diagram shows roles, not a specific reflex arc.'):P('一樣由感覺神經元傳入、中樞整合，再由另一條傳出的神經元把訊息送到汗腺；汗腺分泌汗液，並不是肌肉收縮。汗液蒸發有助散熱。','Again a sensory neuron carries the message in and the CNS integrates it; a different outgoing neuron then reaches the sweat gland, which secretes rather than contracts. Evaporation of sweat helps heat loss.')}),draw:drawJourney},
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
  explain:s=>({title:s.transfer?P('相同水溫，感覺相對','Same temperature, relative sensations'):P('先前刺激不同','Different prior stimuli'),text:s.transfer?P('先接觸溫水的手，移到中間常覺得較冷；先接觸涼水的手，移到中間常覺得較暖。','The hand from warm water often feels cooler in the middle; the hand from cool water often feels warmer.'):P('兩手先接觸不同溫度的水；比較前先保持中間水盆的溫度相同。','The hands first encounter different temperatures. Keep the middle basin unchanged for the comparison.')}),draw:drawAdaptation}
];
B.register({id:'nervous',title:P('神經訊息：刺激到反應','Nerve signals: from stimulus to response'),subtitle:P('受器、神經元、動器，與可以親自記錄的反應練習','Receptors, neurons, effectors and your own reaction records'),cover:'assets/covers/biology_nervous_1009_v1.jpg',tabs});
})();

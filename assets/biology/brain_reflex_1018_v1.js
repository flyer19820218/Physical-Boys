/* Brain and reflexes · teacher-requested V5 remake, 2026-10-18.
 * Same five tabs, hooks, closures, readings and interactions as brain_reflex_1009_v1.js.
 * Every picture is an original illustration drawn here in code (no textbook raster,
 * no white boxes). Anatomy is simplified for teaching; times and sizes are not to scale.
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',
  ink:'#0b1a15',skin:'#f6d2b0',skinDark:'#c98f68',nerve:'#f6c453',bone:'#efe6cc',boneDark:'#a8987a',shirt:'#3fb3a3',
  cerebrum:'#f4a6b8',cerebellum:'#f6a76c'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};

// ── AI teaching illustrations (Gemini, background removed; see brain_reflex_ai_1018/sources.md) ──
const AI_DIR='assets/biology/brain_reflex_ai_1018/',PICS={};
function pic(name){let im=PICS[name];if(!im){im=new Image();im.onload=()=>B.draw();im.src=AI_DIR+name;PICS[name]=im;}return im.complete&&im.naturalWidth?im:null;}

// ── drawing kit ────────────────────────────────────────────────────────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
const FONT=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
function text(c,p,x,y,size=22,color=C.white,align='left'){c.save();c.font=FONT(size);c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function wrap(c,p,x,y,w,size=22,color=C.white){return D.wrap(c,p,x,y,w,{size,color,line:Math.round(size*1.38)});}
function measure(c,p,size){c.save();c.font=FONT(size);const w=c.measureText(D.tr(p)).width;c.restore();return w;}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,1));g.addColorStop(1,rgba(color,0));c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function pathLength(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
function along(pts,u){const L=pathLength(pts);let d=clamp(u)*L;for(let i=1;i<pts.length;i++){const s=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(d<=s||i===pts.length-1){const f=s?Math.min(1,d/s):0;return[mix(pts[i-1][0],pts[i][0],f),mix(pts[i-1][1],pts[i][1],f)];}d-=s;}return pts[pts.length-1];}
// A nerve signal: a glowing dot that travels; it marks the message, not a moving substance.
function signal(c,pts,u,color=C.cyan,r=9){if(u<0||u>1)return;const [x,y]=along(pts,u);glow(c,x,y,r*2.8,color,.6);D.sphere(c,x,y,r,color);}
function nerve(c,pts,{w=7,color=C.nerve,alpha=1,dash=null}={}){c.save();c.globalAlpha=alpha;if(dash)c.setLineDash(dash);line(c,pts,C.ink,w+4);line(c,pts,color,w);c.restore();}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(11,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function splitLines(c,str,maxW,size=22){
  c.save();c.font=FONT(size);
  const isEn=/[A-Za-z]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9]+(?:['’–-][A-Za-z0-9]+)*|\s+|[^A-Za-z0-9\s]/g)||[]):Array.from(str);
  const rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());
  c.restore();return rows;
}
function node(c,p,x,y,w,h,active,color=C.cyan){
  D.round(c,x,y,w,h,14,active?color:C.panel,active?C.white:C.edge);
  const rows=splitLines(c,D.tr(p),w-20,22),lh=27,y0=y+h/2-(rows.length-1)*lh/2+8;
  rows.forEach((r,i)=>text(c,r,x+w/2,y0+i*lh,22,active?C.deep:C.white,'center'));
}
function panel(c,x,y,w,h,fill='#16332b'){D.round(c,x,y,w,h,16,fill,C.edge);}
// A label capsule with an optional leader line to the structure it names.
function pill(c,p,x,y,{active=false,color=C.yellow,size=24,anchor=null,maxX=940,hit=null}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(24,Math.min(x,maxX-w));
  if(anchor){const sx=Math.max(x,Math.min(x+w,anchor[0])),sy=Math.max(y,Math.min(y+h,anchor[1]));const col=active?color:C.muted;line(c,[[sx,sy],anchor],col,2.5);circle(c,anchor[0],anchor[1],5,col);}
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.86)',active?C.white:rgba(color,.75));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  if(hit)D.hit(x,y,w,h,hit[0],hit[1]);
  return{x,y,w,h};
}
function legend(c,items,x,y,w,size=22){for(const [color,p] of items){circle(c,x+10,y-7,9,color,C.ink,2);y+=wrap(c,p,x+28,y,w-28,size,C.white)+4;}return y;}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
const stepControls=names=>choice(P('訊息位置','Signal position'),'step',[[-1,P('連續觀察','Continuous')],...names.map((p,i)=>[i,p])]);

// ── brain picture with part masks (coordinates in the original 2000×1493 picture) ──
const BRAIN_PARTS={
  cerebellum:[[1229,857],[1286,800],[1414,793],[1500,829],[1571,914],[1600,971],[1643,1000],[1671,1086],[1643,1186],[1571,1257],[1471,1293],[1357,1293],[1286,1257],[1257,1171],[1243,1086],[1214,1000],[1207,914]],
  stem:[[986,829],[1086,800],[1186,800],[1207,886],[1214,1000],[1243,1086],[1257,1171],[1279,1257],[1293,1357],[1300,1443],[1200,1443],[1157,1286],[1114,1229],[1057,1186],[1000,1114],[971,1000],[957,914]],
  cord:[[1190,1443],[1305,1443],[1305,1493],[1190,1493]]
};
const MASKED={};
function polyPath(g,pts,k){g.moveTo(pts[0][0]*k,pts[0][1]*k);for(const q of pts.slice(1))g.lineTo(q[0]*k,q[1]*k);g.closePath();}
// A copy of the picture darkened everywhere except the chosen region (keep=null: no darkening).
function maskedPic(name,id,polys,keepInside){
  const key=name+'|'+id;if(MASKED[key])return MASKED[key];const im=pic(name);if(!im)return null;
  const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const g=cv.getContext('2d');g.drawImage(im,0,0);
  g.globalCompositeOperation='source-atop';g.fillStyle='rgba(17,38,31,.6)';g.beginPath();
  if(keepInside)g.rect(0,0,cv.width,cv.height);for(const pts of polys)polyPath(g,pts,name==='brain_sagittal.png'?cv.width/2000:cv.width/1493);
  g.fill(keepInside?'evenodd':'nonzero');return MASKED[key]=cv;
}
function brainPic(hl){
  if(!hl)return pic('brain_sagittal.png');
  if(hl==='cerebrum')return maskedPic('brain_sagittal.png','cerebrum',[BRAIN_PARTS.cerebellum,BRAIN_PARTS.stem,BRAIN_PARTS.cord],false);
  return maskedPic('brain_sagittal.png',hl,[BRAIN_PARTS[hl]],true);
}
// Draw the brain so that the original pixel (0,0) lands at (x,y) with k canvas px per original px.
function drawBrainPic(c,x,y,k,hl,t=0){
  const im=brainPic(hl);if(!im)return;c.drawImage(im,x,y,2000*k,1493*k);
  if(hl==='cerebellum'||hl==='stem'){c.save();c.beginPath();for(const q of BRAIN_PARTS[hl].map((q,i)=>[x+q[0]*k,y+q[1]*k]))c.lineTo(...q);c.closePath();c.shadowColor=C.yellow;c.shadowBlur=12+8*Math.sin(t*4);c.strokeStyle=rgba(C.yellow,.85);c.lineWidth=3;c.stroke();c.restore();}
}

// ── Tab 1: three control centres ───────────────────────────────────────────
const parts=[
 {key:'cerebrum',name:P('大腦','Cerebrum'),text:P('大腦負責感覺、意識活動、思考、記憶，並控制許多隨意運動。左右半球通常控制身體對側的隨意運動。','The cerebrum supports perception, conscious activities, thinking and memory, and controls many voluntary movements. Each hemisphere generally controls voluntary movement on the opposite side.'),
  rows:[['bulb',P('思考、記憶','Thinking, memory')],['eye',P('產生感覺與意識','Senses, awareness')],['hand',P('控制許多隨意運動','Voluntary movement')]]},
 {key:'cerebellum',name:P('小腦','Cerebellum'),text:P('小腦協調肌肉運動、維持身體平衡；不是主導思考與記憶的構造。','The cerebellum coordinates muscle movements and balance; it is not the main centre for thinking and memory.'),
  rows:[['balance',P('維持身體平衡','Keeps the body balanced')],['run',P('協調肌肉運動，動作才流暢','Coordinates muscles for smooth movement')],['nobulb',P('不是主導思考與記憶的地方','Not the main centre for thinking or memory')]]},
 {key:'stem',name:P('腦幹','Brainstem'),text:P('腦幹連接腦與脊髓，參與心跳、呼吸等生命功能，也參與部分頭部反射。','The brainstem connects the brain and spinal cord, helps regulate vital functions such as breathing and heart rate, and mediates some head reflexes.'),
  rows:[['heart',P('調節心跳','Regulates heart rate')],['lungs',P('調節呼吸','Regulates breathing')],['updown',P('連接腦與脊髓','Links the brain and spinal cord')],['eye',P('參與部分頭部反射（如瞳孔）','Some head reflexes (pupils)')]]}
];
function icon(c,kind,x,y,t){
  c.save();c.lineCap='round';c.lineJoin='round';
  if(kind==='bulb'||kind==='nobulb'){const on=kind==='bulb';if(on)glow(c,x,y-5,28,C.yellow,.4+.2*Math.sin(t*3));circle(c,x,y-6,12,on?C.yellow:'#6b7f77',C.ink,2);D.round(c,x-6,y+6,12,10,3,C.muted,C.ink);if(!on)line(c,[[x-17,y+15],[x+17,y-21]],C.orange,4);}
  else if(kind==='eye'){c.beginPath();c.moveTo(x-20,y);c.quadraticCurveTo(x,y-17,x+20,y);c.quadraticCurveTo(x,y+17,x-20,y);c.closePath();c.fillStyle='#f7f3ea';c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();circle(c,x,y,7,'#8a5a2b');circle(c,x,y,3.5,C.ink);}
  else if(kind==='hand'){const k=Math.sin(t*3)*2;for(let i=0;i<4;i++)line(c,[[x-7.5+i*5,y-2],[x-7.5+i*5,y-17+Math.abs(i-1.5)*2+(i===1?k:0)]],C.skin,4.5);line(c,[[x-9,y+5],[x-17,y-3]],C.skin,4.5);D.round(c,x-10,y-4,20,18,6,C.skin);}
  else if(kind==='balance'){const a=Math.sin(t*2)*.25;c.beginPath();c.moveTo(x,y+4);c.lineTo(x-9,y+18);c.lineTo(x+9,y+18);c.closePath();c.fillStyle=C.muted;c.fill();c.translate(x,y+2);c.rotate(a);line(c,[[-20,0],[20,0]],C.white,4);circle(c,-17,-7,6,C.cyan);circle(c,17,-7,6,C.orange);}
  else if(kind==='run'){const k=Math.sin(t*6);circle(c,x+4,y-16,5,C.white);line(c,[[x+2,y-10],[x-2,y+4]],C.white,3.5);line(c,[[x-2,y+4],[x-10+k*4,y+18]],C.white,3.5);line(c,[[x-2,y+4],[x+8-k*4,y+16]],C.white,3.5);line(c,[[x,y-6],[x-10-k*3,y]],C.white,3.5);line(c,[[x,y-6],[x+10+k*3,y-2]],C.white,3.5);}
  else if(kind==='heart'){const s=1+.12*Math.max(0,Math.sin(t*7));c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(0,14);c.bezierCurveTo(-24,-2,-12,-22,0,-9);c.bezierCurveTo(12,-22,24,-2,0,14);c.fillStyle=C.pink;c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();}
  else if(kind==='lungs'){const s=1+.09*Math.sin(t*2.2);line(c,[[x,y-19],[x,y-6]],C.muted,3);for(const side of [-1,1])ellipse(c,x+side*10,y+3,9*s,15*s,'#f9a8c4',C.ink,2);}
  else if(kind==='updown'){arrow(c,x-8,y+15,x-8,y-16,C.cyan,3.5);arrow(c,x+8,y-15,x+8,y+16,C.pink,3.5);}
  c.restore();
}
function drawCross(c,t,y0){
  const ch=wrap(c,P('左右半球通常控制身體對側','Each half controls the opposite side'),612,y0+24,312,22,C.cyan);
  const cx=765,cy=y0+ch+56;
  for(const side of [-1,1])ellipse(c,cx+side*30,cy,28,42,side<0?C.cerebrum:'#f9c6d2',C.ink,2.5);
  text(c,P('左','L'),cx-30,cy+8,22,C.deep,'center');text(c,P('右','R'),cx+30,cy+8,22,C.deep,'center');
  const L=[[cx-30,cy+42],[cx+8,cy+66],[cx+84,cy+80]],R=[[cx+30,cy+42],[cx-8,cy+66],[cx-84,cy+80]];
  line(c,L,rgba(C.yellow,.6),3);line(c,R,rgba(C.cyan,.6),3);signal(c,L,(t*.6)%1,C.yellow,6);signal(c,R,(t*.6+.5)%1,C.cyan,6);
  text(c,P('右側身體','Right side'),cx+86,cy+106,22,C.yellow,'center');text(c,P('左側身體','Left side'),cx-86,cy+106,22,C.cyan,'center');
}
function drawBrainTab(c,s,t){
  panel(c,20,20,552,560);
  drawBrainPic(c,36,110,.26,parts[s.part].key,t);
  line(c,[[396,540],[364,500]],C.muted,2);text(c,P('脊髓','Spinal cord'),400,560,22,C.muted);
  text(c,P('◀ 前方（臉）','◀ Front (face)'),40,560,22,C.muted);
  D.hit(60,120,480,200,'part',0);D.hit(285,318,90,167,'part',2);D.hit(350,316,120,130,'part',1);
  pill(c,parts[0].name,48,40,{active:s.part===0,anchor:[218,214],hit:['part',0],maxX:560});
  pill(c,parts[1].name,440,470,{active:s.part===1,anchor:[413,409],hit:['part',1],maxX:560});
  pill(c,parts[2].name,150,470,{active:s.part===2,anchor:[322,396],hit:['part',2],maxX:560});
  const p=parts[s.part];panel(c,590,20,350,560);
  text(c,p.name,615,74,34,C.yellow);
  let y=100;
  for(const [kind,label] of p.rows){circle(c,642,y+32,30,'#11261f',C.edge,2);icon(c,kind,642,y+32,t);const h=wrap(c,label,686,y+28,236,22,C.white);y+=Math.max(66,h+16)+8;}
  if(s.part===0)drawCross(c,t,y);
}

// ── Tab 2: central and peripheral systems ──────────────────────────────────
const mirror=pts=>pts.map(([x,y])=>[460-x,y]);
// Full-body picture (original 1493×2000): k canvas px per original px, placed at (BX,BY).
const BODY_LAYOUT={wide:{k:.285,x:27,y:5.5},narrow:{k:.25,x:-57,y:42}};
let BK=.285,BX=27,BY=5.5;const BM=(x,y)=>[BX+x*BK,BY+y*BK];
const BODY_CNS=[[[757,75],[815,95],[835,150],[815,210],[770,228],[757,1090],[740,1090],[728,228],[690,210],[675,150],[695,95]]];
const ARM_O=[[714,429],[600,471],[529,543],[486,686],[457,857],[429,1000],[407,1114],[386,1200]],LEG_O=[[743,1000],[700,1086],[664,1171],[650,1357],[657,1514],[650,1643],[643,1786],[636,1871]];
const flipO=pts=>pts.map(([x,y])=>[1494-x,y]);
const LIMBS_O=[ARM_O,flipO(ARM_O),LEG_O,flipO(LEG_O)];
function bodyPic(view){
  if(view==='central')return maskedPic('nervous_system_body.png','cns',BODY_CNS,true);
  return pic('nervous_system_body.png');
}
function drawCordSection(c,cx,cy,s=1){
  c.save();c.translate(cx,cy);c.scale(s,s);
  ellipse(c,0,0,64,52,'#f2d48a',C.ink,3);
  c.fillStyle='#c9963c';
  for(const side of [-1,1]){c.save();c.scale(side,1);c.beginPath();c.moveTo(0,-8);c.bezierCurveTo(10,-10,14,-22,20,-40);c.bezierCurveTo(28,-43,33,-36,30,-26);c.bezierCurveTo(28,-14,22,-6,24,2);c.bezierCurveTo(36,10,42,24,36,34);c.bezierCurveTo(28,40,16,36,10,24);c.bezierCurveTo(6,16,4,10,0,8);c.closePath();c.fill();c.restore();}
  circle(c,0,0,3.5,'#7a5a20');c.restore();
}
function drawCnsZoom(c,t){
  text(c,P('腦＋脊髓','Brain + spinal cord'),505,68,30,C.yellow);
  glow(c,700,280,230,C.yellow,.12+.06*Math.sin(t*3));
  drawBrainPic(c,500,110,.21,null,t);
  pill(c,P('腦','Brain'),850,130,{active:true,anchor:[836,215]});
  pill(c,P('脊髓','Spinal cord'),790,440,{active:true,anchor:[762,418]});
  wrap(c,P('中樞負責整合訊息','The CNS integrates signals'),505,525,410,26,C.cyan);
}
// ── Peripheral view: the same nerve-bundle cartoon as the "nerve signals" unit (nervous_signals_1014_v1.js),
// geometry copied unchanged and drawn at NB_K; labels are written at full size outside the scaled drawing.
const mod=(n,d=1)=>((n%d)+d)%d;
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
const NERVE_SOMAS=[[114,164],[178,232],[106,304],[178,376],[114,448]];
const NERVE_FIBRES=NERVE_SOMAS.map(([x,y],i)=>{
  const lane=300+(i-2)*11,pts=[],tx=862,ty=118+i*70;
  for(let k=0;k<=12;k++){const u=k/12,a=1-u;pts.push([a*a*a*(x+20)+3*a*a*u*260+3*a*u*u*320+u*u*u*380,a*a*a*y+3*a*a*u*y+3*a*u*u*lane+u*u*u*lane]);}
  for(let xx=390;xx<=760;xx+=10)pts.push([xx,lane+Math.sin((xx-380)/55+i*1.3)*2.5]);
  for(let k=1;k<=12;k++){const u=k/12,a=1-u;pts.push([a*a*a*760+3*a*a*u*805+3*a*u*u*832+u*u*u*tx,a*a*a*lane+3*a*a*u*lane+3*a*u*u*ty+u*u*u*ty]);}
  const dens=makeDendrites(x,y,21,[2.3,2.85,3.4,3.95,1.75,4.55],17,4,1);
  return{pts,soma:[x,y],end:[tx,ty],dens};});
const NB_K=.72,NB_X=238,NB_Y=58,NB=(x,y)=>[NB_X+x*NB_K,NB_Y+y*NB_K];
function drawPnsZoom(c,t){
  c.save();c.translate(NB_X,NB_Y);c.scale(NB_K,NB_K);
  for(const f of NERVE_FIBRES){line(c,f.pts,C.ink,9);line(c,f.pts,'#bcd8f3',5);}
  c.save();c.beginPath();c.roundRect(370,262,404,76,38);c.fillStyle='rgba(233,215,168,.42)';c.fill();c.lineWidth=4;c.strokeStyle='#e9d7a8';c.stroke();c.restore();
  c.save();c.beginPath();c.roundRect(370,262,404,76,38);c.lineWidth=1.5;c.strokeStyle=C.ink;c.stroke();c.restore();
  NERVE_FIBRES.forEach((f,i)=>{
    for(const d of f.dens){line(c,d.pts,C.ink,d.w+2.6);line(c,d.pts,'#bcd8f3',d.w);}
    drawSomaShape(c,f.soma[0],f.soma[1],21,'#eef6ff','#9fc5ec',true,.4);
    ellipse(c,f.end[0]+42,f.end[1],20,12,'#f472b6',C.ink,2.5);
    drawTerminalFan(c,f.end,f.pts[f.pts.length-2],'#bcd8f3',.58,[-.55,-.27,0,.27,.55]);
    signal(c,f.pts,mod(t*.3+i*.21),C.cyan,7);
  });
  line(c,[[600,338],[600,404]],C.yellow,3);circle(c,600,470,64,'#e9d7a8',C.ink,4);
  for(const [dx,dy] of [[0,0],[-22,-12],[22,-12],[-22,14],[22,14],[0,-26],[0,27],[-38,1],[38,1]])circle(c,600+dx,470+dy,10,'#bcd8f3',C.ink,2);
  c.restore();
  text(c,P('神經：很多條神經纖維包在一起','A nerve: many fibres wrapped together'),268,58,24,C.yellow);
  text(c,P('神經元','Neurons'),262,124,22,'#bcd8f3');line(c,[NB(82,100),NB(102,126)],'#bcd8f3',2);
  text(c,P('神經纖維','Nerve fibres'),380,150,22,'#bcd8f3');line(c,[[412,158],NB(266,162)],'#bcd8f3',2);
  text(c,P('神經（外面有膜包住）','Nerve (wrapped together)'),498,240,22,C.yellow);
  wrap(c,P('橫切面：一條神經裡有很多條神經纖維','Cross-section: one nerve holds many nerve fibres'),728,382,200,22,C.yellow);
  wrap(c,P('神經：許多神經元的神經纖維集合成束',"Nerve: many neurons' fibres in one bundle"),268,506,650,22,C.white);
  D.round(c,262,540,420,34,8,C.panel);text(c,P('亮起＝訊息傳到，不是物質整顆移動','Glow = signal arriving, not a substance moving'),274,564,22,C.cyan);
}
function drawBoneZoom(c,t){
  wrap(c,P('脊椎是骨骼，脊髓藏在裡面','Vertebrae are bone; the cord sits inside'),505,66,415,26,C.yellow);
  const vim=pic('vertebra_section.png'),VS=.44,VX=710-500*VS,VY=300-380*VS;
  if(vim)c.drawImage(vim,VX,VY,1000*VS,746*VS);
  const nL=[[556,285],[622,291],[657,300]],nR=nL.map(([x,y])=>[1420-x,y]);
  signal(c,nL,(t*.5)%1,C.cyan,6);signal(c,nR,(t*.5+.5)%1,C.cyan,6);
  legend(c,[['#e6d6b4',P('脊椎骨：骨骼，在外保護','Vertebra: bone that protects')],['#f3e4dc',P('脊髓：神經組織，在內傳訊','Spinal cord: nervous tissue')],['#efd98a',P('脊神經：由脊髓發出，從骨縫穿出','Spinal nerves: exit between bones')]],505,500,420,22);
}
function drawSystem(c,s,t){
  const cns=s.view==='central',pns=s.view==='peripheral',bone=s.view==='bone';
  ({k:BK,x:BX,y:BY}=BODY_LAYOUT[pns?'narrow':'wide']);const PX=pns?250:480;
  panel(c,20,20,PX-40,560);
  if(cns)glow(c,240,180,170,C.yellow,.18+.08*Math.sin(t*3));
  const bp=bodyPic(s.view);if(bp)c.drawImage(bp,BX,BY,1493*BK,2000*BK);
  if(cns){c.save();c.shadowColor=C.yellow;c.shadowBlur=14+8*Math.sin(t*3);line(c,[BM(748,230),BM(748,1080)],rgba('#ffe58a',.75),4);c.restore();}
  if(pns)LIMBS_O.forEach((p,i)=>signal(c,p.map(q=>BM(...q)).reverse(),((t*.45)+i*.25)%1,C.cyan,7));
  if(bone)for(let y=BM(0,240)[1];y<BM(0,1080)[1];y+=12)D.round(c,231,y,16,9,3,rgba(C.bone,.9),C.boneDark);
  // magnifier from the body to the zoom panel
  c.save();c.setLineDash([8,7]);c.strokeStyle=rgba(C.yellow,.75);c.lineWidth=2.5;
  let a,b;
  if(cns){c.beginPath();c.roundRect(200,22,80,304,18);c.stroke();a=[280,40];b=[280,320];}
  else{const [x,y]=pns?BM(457,857):[239,200];c.beginPath();c.arc(x,y,pns?24:30,0,TAU);c.stroke();a=[x+21,y-21];b=[x+21,y+21];}
  c.beginPath();c.moveTo(...a);c.lineTo(PX,40);c.moveTo(...b);c.lineTo(PX,560);c.stroke();c.restore();
  panel(c,PX,20,940-PX,560);
  if(cns)drawCnsZoom(c,t);else if(pns)drawPnsZoom(c,t);else drawBoneZoom(c,t);
}

// ── Tab 3: withdrawal reflex and later awareness ───────────────────────────
// Teacher-authorised refinement 2026-10-26, same colour code as the knee tab: receptor yellow, sensory neuron
// cyan, interneuron green, motor neuron pink. In the cord section (back side up) the sensory neuron enters on
// the back (dorsal) side and passes the message to an interneuron; the motor neuron leaves on the front
// (ventral) side and ends inside the upper-arm muscle, which shortens and thickens as the forearm lifts.
const reflex=[P('受器接收熱刺激','Receptors detect heat'),P('感覺神經元','Sensory neuron'),P('脊髓整合訊息','Spinal cord integrates'),P('運動神經元','Motor neuron'),P('肌肉收縮、縮手','Muscle contracts: withdraw')];
const aware=[P('脊髓：上傳訊息','Spinal cord: sends upward'),P('大腦：感覺與決定','Cerebrum: perception and decision'),P('脊髓：傳下控制訊息','Spinal cord: relays commands'),P('運動神經元','Motor neuron'),P('動器：肌肉','Effector: muscle')];
// Arm picture (AI, original 2000×1116) split at the elbow; the forearm layer turns about the elbow.
const AK=.253,AX=38.4,AY=188.5,AM=(x,y)=>[AX+x*AK,AY+y*AK],ELBOW=AM(1090,575),SHOULDER=AM(1480,215),BICEPS=AM(1270,420),CORD=[520,318];
// upper-arm muscle outline, measured on the arm picture; it shortens toward its shoulder end W_P
const W_MUS=[[1030,512],[1074,488],[1117,457],[1157,417],[1196,381],[1236,354],[1275,330],[1315,310],[1354,296],[1394,294],[1433,294],[1465,300],[1485,306],
  [1461,342],[1433,377],[1398,421],[1358,457],[1319,484],[1279,512],[1240,532],[1200,547],[1160,555],[1121,532],[1077,512]].map(p=>AM(...p));
const W_D=AM(1030,512),W_P=AM(1485,306),W_MEND=AM(1326,453);
// spinal-cord inset drawn upright: back (dorsal) side up, front (ventral) side down
const CS=1.15,W_GANG=[458,247],W_SYN=[492,281],W_ISOMA=[501,309],W_MSOMA=[488,350],W_IEND=[490,333];
const UPPER=[[322,294.5],[342,276],[362,259],[382,248],[404,240],[430,238],W_GANG,[478,259],W_SYN]; // sensory route along the top of the upper arm to the dorsal root
const INTER=[W_SYN,[497,296],W_ISOMA,[497,328],W_IEND],MOTOR=[W_MSOMA,[486,374],[470,390],[440,389],[414,366],[397,338],[385,318]];
const UP=[[494,279],[503,266],[509,252],[514,232],[521,205],[528,178],[531,158],[527,130],[521,100]],DOWN=[[537,100],[542,130],[546,158],[548,190],[546,222],[538,256],[531,290],[528,322],[518,342],[497,350]];
function armPose(lift){const a=lift*.8,R=q=>rotAbout(AM(...q),ELBOW,a);return{a,tip:R([345,1070]),palm:R([470,930]),wrist:R([575,775]),top:R([939,504])};}
function sensoryPath(pose){return[pose.tip,pose.palm,pose.wrist,pose.top,...UPPER];}
// muscle-axis transform about the shoulder end: along×fa, across×fp
function wMusPt(p,fa,fp){const ux=W_D[0]-W_P[0],uy=W_D[1]-W_P[1],L=Math.hypot(ux,uy),ax=ux/L,ay=uy/L,dx=p[0]-W_P[0],dy=p[1]-W_P[1],al=dx*ax+dy*ay,pe=-dx*ay+dy*ax;return[W_P[0]+ax*al*fa-ay*pe*fp,W_P[1]+ay*al*fa+ax*pe*fp];}
function drawPot(c,t){
  // pot on a gas stove (AI picture, 460×498): lid rim lands just under the fingertips
  const im=pic('hot_pot.png'),k=.36,X=46,Y=417;
  glow(c,120,541,70+6*Math.sin(t*9),C.orange,.3+.08*Math.sin(t*13));
  if(im)c.drawImage(im,X,Y,460*k,498*k);
  c.save();c.lineCap='round';for(const [x,ph] of [[66,0],[88,1.8]]){c.beginPath();for(let n=0;n<=10;n++){const yy=456-n*6-((t*30+ph*10)%18),xx=x+Math.sin(n*.8+t*3+ph)*5;n?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle='rgba(242,236,217,.4)';c.lineWidth=3;c.stroke();}c.restore();
}
function drawArm(c,pose){
  const up=pic('arm_upper.png'),fo=pic('arm_forearm.png');
  c.save();c.globalAlpha=.9;ellipse(c,ELBOW[0],ELBOW[1],15,19,'#e8c2b2');c.restore();
  if(fo){c.save();c.translate(...ELBOW);c.rotate(pose.a);c.translate(-ELBOW[0],-ELBOW[1]);c.drawImage(fo,AX,AY,2000*AK,1116*AK);c.restore();}
  if(up)c.drawImage(up,AX,AY,2000*AK,1116*AK);
}
// the effector: outlined upper-arm muscle; contracting = pink, shorter and thicker, with inward arrows
function drawMuscle(c,Ct,fa,fp,acting){
  const mus=W_MUS.map(p=>wMusPt(p,fa,fp));
  if(Ct>0)glow(c,...wMusPt(BICEPS,fa,fp),66,C.pink,.35*Ct);
  c.save();c.beginPath();mus.forEach((p,k)=>c[k?'lineTo':'moveTo'](...p));c.closePath();
  c.fillStyle=Ct>0?rgba(C.pink,.12+.4*Ct):rgba(C.white,.1);c.fill();
  c.lineJoin='round';c.strokeStyle=C.ink;c.lineWidth=5;c.stroke();c.strokeStyle=Ct>0?C.pink:C.white;c.lineWidth=2.5;c.stroke();c.restore();
  if(acting&&Ct>.1){const Q=u=>wMusPt([mix(W_D[0],W_P[0],u),mix(W_D[1],W_P[1],u)],fa,fp);
    c.save();c.globalAlpha=Math.min(1,Ct*1.5);arrow(c,...Q(.03),...Q(.27),C.white,4);arrow(c,...Q(.97),...Q(.73),C.white,4);c.restore();}
  return mus;
}
// motor endings spreading into the muscle
function wFan(c,end,prev,on){const dir=Math.atan2(end[1]-prev[1],end[0]-prev[0]),col=on?C.pink:rgba(C.pink,.6);
  for(const d of [-.75,0,.75]){const tip=[end[0]+Math.cos(dir+d)*13,end[1]+Math.sin(dir+d)*13];line(c,[end,tip],C.ink,5);line(c,[end,tip],col,3);circle(c,...tip,3.5,C.pink,C.ink,1.5);}}
// a neuron cell body (withdraw and knee tabs): type colour with a purple nucleus, same nucleus style as drawSomaShape
const NUC='#8e6fd1',NUC_HI='#c4b5fd';
function cellBody(c,x,y,rx,ry,fill,rot=0){ellipse(c,x,y,rx,ry,fill,C.ink,2.5,rot);const nr=Math.min(rx,ry)*.42;circle(c,x,y,nr,NUC,C.ink,1.8);circle(c,x+nr*.25,y-nr*.2,nr*.3,NUC_HI);}
function drawWithdraw(c,s,t){
  const isReflex=s.mode==='reflex',names=isReflex?reflex:aware,color=isReflex?C.cyan:C.pink;
  const phase=t*.7,i=s.step<0?Math.floor(phase)%5:s.step,u=phase%1;
  // reflex: the forearm lifts at step 5. Awareness: the hand is already withdrawn; at step 5 the muscle
  // contracts once more on the brain's command
  const pulse=!isReflex&&i===4?Math.sin(Math.PI*clamp(u*1.25)):0;
  const lift=isReflex?(i===4?ease(u*2):0):1+.08*pulse,Ct=isReflex?(i===4?ease(u*2):0):.35+.65*pulse;
  const pose=armPose(lift),sens=sensoryPath(pose),fa=1-.12*Ct,fp=1+.28*Ct,mEnd=wMusPt(W_MEND,fa,fp),motor=[...MOTOR,mEnd];
  drawPot(c,t);
  // the brain and the pathways to it
  drawBrainPic(c,453,49,.07,isReflex?null:(i===1?'cerebrum':null),t);
  if(isReflex)text(c,P('稍後才上傳大腦','Reaches the brain later'),420,74,22,C.muted,'right');
  else if(i===1){glow(c,518,70,70,C.pink,.45+.2*Math.sin(t*6));pill(c,P('好燙！好痛！','Ouch, hot!'),250,50,{active:true,color:C.pink,size:24,maxX:420});}
  else text(c,P('大腦：感覺與決定','Cerebrum: feel and decide'),420,74,22,C.pink,'right');
  // the arm, then the spinal-cord inset over the shoulder
  const cordGlow=isReflex?(i===2?C.green:null):(i===0?C.cyan:i===2?C.pink:null);
  if(cordGlow)glow(c,CORD[0],CORD[1],100,cordGlow,.35+.2*Math.sin(t*6));
  drawArm(c,pose);
  circle(c,CORD[0],CORD[1],88,'#0f221c',C.edge,3);
  drawCordSection(c,CORD[0],CORD[1],CS);
  text(c,P('脊髓（橫切面放大）','Spinal cord (section)'),CORD[0],CORD[1]+114,22,C.muted,'center');
  const mus=drawMuscle(c,Ct,fa,fp,i===4);
  // neurons: bright while the message is on them
  const sOn=isReflex&&i===1,iOn=isReflex&&i===2,mOn=i>=3;
  nerve(c,sens,{w:5,color:C.cyan,alpha:sOn?1:.5});
  nerve(c,INTER,{w:5,color:C.green,alpha:iOn?1:.5});
  nerve(c,motor,{w:5,color:C.pink,alpha:mOn?1:.5});wFan(c,mEnd,motor[motor.length-2],mOn);
  if(isReflex){nerve(c,UP,{w:4,color:C.cyan,alpha:.45,dash:[8,8]});kChevrons(c,UP.slice(3,7),rgba(C.cyan,.6),1,7);}
  else{nerve(c,UP,{w:5,color:C.cyan,alpha:i===0?1:.5});nerve(c,DOWN,{w:5,color:C.pink,alpha:i===2?1:.5});
    kChevrons(c,UP.slice(3,7),C.cyan,1,7);kChevrons(c,DOWN.slice(2,6),C.pink,1,7);
    text(c,P('上傳','Up'),510,196,22,C.cyan,'right');text(c,P('傳下','Down'),558,196,22,C.pink);}
  kChevrons(c,[pose.palm,pose.wrist],C.cyan,1,7);kChevrons(c,UPPER.slice(3,6),C.cyan,1,7);kChevrons(c,MOTOR.slice(3,5),C.pink,1,7);
  cellBody(c,...W_GANG,17,12,'#bdf3fb',.42);       // sensory neuron cell body, outside the cord
  cellBody(c,...W_ISOMA,12,12,C.green);            // interneuron cell body
  cellBody(c,...W_MSOMA,13,13,mOn?C.pink:'#e9a3c4'); // motor neuron cell body
  circle(c,...W_SYN,5,C.cyan,C.ink,2);circle(c,...W_IEND,4,C.green,C.ink,1.5); // the two synapses
  // receptor and the travelling message
  const rec=pose.tip;
  if(isReflex&&i===0)glow(c,rec[0],rec[1],46,C.yellow,.5+.3*Math.sin(t*8));
  circle(c,rec[0],rec[1],8,C.yellow,C.ink,2);
  if(isReflex){if(i===1)signal(c,sens,u,C.cyan);if(i===2)signal(c,INTER,u,C.green);if(i===3)signal(c,motor,u,C.pink);}
  else{if(i===0)signal(c,UP,u,C.cyan);if(i===2)signal(c,DOWN,u,C.pink);if(i===3)signal(c,motor,u,C.pink);}
  // labels with leader lines, the awareness caption and the colour key
  pill(c,P('受器','Receptor'),24,330,{active:isReflex&&i===0,color:C.yellow,size:22,anchor:rec,maxX:240});
  pill(c,P('肌肉（動器）','Muscle (effector)'),140,180,{active:i===4,color:C.pink,size:22,anchor:mus[5],maxX:400});
  if(!isReflex)wrap(c,P('手已先縮回，之後才覺得痛','The hand has already pulled back. The pain comes later.'),20,118,420,24,C.yellow);
  legend(c,[[C.cyan,P('感覺神經元：傳入','Sensory neuron: in')],[C.green,P('中間神經元：整合','Interneuron: integrates')],[C.pink,P('運動神經元：傳出','Motor neuron: out')]],254,480,380,22);
  legend(c,[[NUC,P('細胞核','Nucleus')]],512,480,128,22);
  text(c,P('動畫已放慢，不能比較真實傳導速度','Slowed: not a real conduction speed'),254,592,22,C.cyan);
  // the pathway as a vertical chain
  names.forEach((p,k)=>{const y=30+k*106;if(k){arrow(c,795,y-20,795,y-2,k<=i?color:C.edge,3.5);}node(c,p,650,y,290,84,k===i,color);});
}

// ── Tab 4: knee-jerk (patellar stretch) reflex ─────────────────────────────
// Teacher-authorised redesign 2026-10-26. Left, the leg picture shows WHERE: the quadriceps with
// its muscle spindle, the nerve route to the lower back, the tendon pull chain and the kick.
// Right, a zoom shows HOW: muscle fibres with a spindle (receptor) and motor endings (effector),
// and a spinal-cord section where the sensory neuron synapses directly on the motor neuron
// (one synapse, no interneuron). Slowed model; sizes not to scale.
const KS=.64,KX=-92,KY=130,KM=(x,y)=>[KX+x*KS,KY+y*KS],PIVOT=KM(645,255);
// leg-picture anchors, given in the original 1000×746 picture coordinates
const K_QUAD=[[360,134],[400,124],[450,121],[500,124],[550,134],[595,150],[630,168],[650,186],[657,198],[630,201],[590,195],[540,187],[480,176],[420,163],[380,152]].map(p=>KM(...p));
const K_QA=KM(380,143),K_QB=KM(645,186),K_SPINDLE=KM(506,151),K_RING=KM(528,158),K_CORDLEG=[KM(249,2),KM(252,60)];
const K_ROUTE=[[506,151],[470,142],[420,132],[372,122],[334,105],[298,85],[270,66],[252,54]].map(p=>KM(...p));
const K_QT=[KM(634,195),KM(652,201),KM(667,209)],K_PAT=KM(673,227),K_PT_TOP=KM(678,246),K_PT_BOT=KM(673,305),K_TAP=KM(688,284);
// right panel: muscle zoom block, then the spinal-cord section (turned so its back side faces left, like the body)
const KB={x:604,y:66,w:328,h:166,cx:768},K_FIB=[[86,12],[112,12],[184,12],[210,12]],K_SPX=730,K_SPY=148;
const KCX=766,KCY=470,KCS=1.2,K_SYN=[777,441],K_SOMA=[795,435];
const K_SENS_PANEL=[[702,180],[652,214],[628,238],[628,382],[642,402],[672,414],[700,428],[718,437],[740,445],[762,446],K_SYN];
const K_MOT_PANEL=[K_SOMA,[810,426],[838,410],[884,400],[910,384],[910,236],[910,100]];
// slowed timeline after the tap (seconds): start/end of each step, and the loop used when stepping by hand
const K_STEPS=[[0,.8],[.8,1.8],[1.8,2.9],[2.9,3.6],[3.6,4.7],[4.7,6.6]],K_LOOP=[[0,.8],[.05,1.85],[1.8,2.9],[2.9,3.6],[3.6,4.7],[4.6,6.6]],K_END=6.6;
const K_TEXT=[P('輕敲膝蓋下方的髕腱','A gentle tap on the patellar tendon below the kneecap'),
 P('股四頭肌被拉長，肌梭產生訊息','The quadriceps is stretched: its muscle spindles send a signal'),
 P('感覺神經元把訊息傳入脊髓','The sensory neuron carries the signal into the spinal cord'),
 P('在脊髓內直接連到運動神經元','In the spinal cord it passes straight to a motor neuron'),
 P('運動神經元把訊息傳回同一塊肌肉','The motor neuron carries it back to the same muscle'),
 P('股四頭肌收縮，經肌腱拉動小腿踢出','The quadriceps contracts; its tendon pulls the lower leg forward')];
const K_SHORT=[P('① 輕敲髕腱','① Tap the tendon'),P('② 肌肉被拉長','② Muscle stretched'),P('③ 傳入脊髓','③ Into the cord'),P('④ 突觸相連','④ Synapse'),P('⑤ 傳回肌肉','⑤ Back to the muscle'),P('⑥ 收縮踢腿','⑥ Contract and kick')];
function rotAbout(p,o,a){const dx=p[0]-o[0],dy=p[1]-o[1];return[o[0]+dx*Math.cos(a)-dy*Math.sin(a),o[1]+dx*Math.sin(a)+dy*Math.cos(a)];}
const kSmooth=(a,b,x)=>{const u=clamp((x-a)/(b-a));return u*u*(3-2*u);};
// T = seconds into the slowed timeline (-1 before any tap); k = highlighted step (6 = finished)
function kTime(s,t){
  if(!s.tapped)return{T:-1,k:-1};
  const dt=Math.max(0,t-s.start);
  if(s.step>=0){const [a,b]=K_LOOP[s.step],len=b-a;return{T:a+Math.min(dt%(len+.7),len),k:s.step};}
  const T=Math.min(dt,K_END);return{T,k:T>=K_END?6:K_STEPS.findIndex(([a,b])=>T>=a&&T<b)};
}
function kState(T){
  const hammer=T<0?0:T<.12?T/.12:Math.max(0,1-(T-.12)/.4);
  const stretch=T<0?0:kSmooth(.12,.45,T)*(1-kSmooth(1.55,1.85,T));
  const fire=T>=.9&&T<1.85?.65+.35*Math.sin((T-.9)*18):0;
  const u=clamp((T-4.75)/1.8),kick=T<0?0:Math.sin(Math.PI*u);
  const contract=T<0?0:clamp(1.4*Math.sin(Math.PI*clamp((T-4.65)/1.85)));
  return{hammer,stretch,fire,angle:-.75*kick,contract,sens:(T-1.85)/1.0,syn:T>=2.85&&T<3.65,mot:(T-3.6)/1.05};
}
function kOffset(pts,d){return pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return[p[0]-dy/L*d,p[1]+dx/L*d];});}
function kChevrons(c,pts,color,n=3,size=7){
  for(let i=1;i<=n;i++){const u=i/(n+1),a=along(pts,u-.03),b=along(pts,u+.03),[x,y]=along(pts,u),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
    c.save();c.translate(x,y);c.rotate(ang);c.beginPath();c.moveTo(-size*.55,-size);c.lineTo(size*.55,0);c.lineTo(-size*.55,size);
    c.lineJoin='round';c.lineCap='round';c.strokeStyle=C.ink;c.lineWidth=5;c.stroke();c.strokeStyle=color;c.lineWidth=2.6;c.stroke();c.restore();}
}
// a neuron drawn as a coloured fibre; bright while its signal is travelling
function kNeuron(c,pts,color,on,w=5){nerve(c,pts,{w,color,alpha:on?1:.5});}
function kBadge(c,n,x,y,st){ // st: 0 not yet, 1 now, 2 done
  if(st===1)glow(c,x,y,34,C.yellow,.55);
  circle(c,x,y,16,st===1?C.yellow:st===2?'#8f8a4a':'rgba(11,26,21,.92)',st===1?C.white:rgba(C.yellow,.85),2.5);
  text(c,String(n),x,y+8,22,st===0?C.yellow:C.deep,'center');
  D.hit(x-20,y-20,40,40,'step',n-1);
}
// muscle-axis transform for the quadriceps overlay: along×fa, across×fp (about the hip end)
function kQuadPt(p,fa,fp){const ux=K_QB[0]-K_QA[0],uy=K_QB[1]-K_QA[1],L=Math.hypot(ux,uy),ax=ux/L,ay=uy/L,dx=p[0]-K_QA[0],dy=p[1]-K_QA[1],al=dx*ax+dy*ay,pe=-dx*ay+dy*ax;return[K_QA[0]+ax*al*fa-ay*pe*fp,K_QA[1]+ay*al*fa+ax*pe*fp];}
function kFibre(c,y,h,f){
  const x0=KB.cx-210*f,x1=KB.cx+210*f,g=c.createLinearGradient(0,y-h,0,y+h);
  g.addColorStop(0,'#eba08f');g.addColorStop(.5,'#cf6e60');g.addColorStop(1,'#9e473e');
  c.save();c.beginPath();c.roundRect(x0,y-h,x1-x0,2*h,h);c.fillStyle=g;c.fill();c.strokeStyle='rgba(70,22,18,.85)';c.lineWidth=1.5;c.stroke();c.clip();
  const sp=9*f;c.strokeStyle='rgba(96,30,24,.5)';c.lineWidth=1.8;
  for(let x=KB.cx-Math.ceil((KB.cx-x0)/sp)*sp;x<x1;x+=sp){c.beginPath();c.moveTo(x,y-h);c.lineTo(x,y+h);c.stroke();}
  c.restore();
}
function kSpindle(c,x,y,L,r,S,fire){
  c.save();c.beginPath();c.moveTo(x-L/2,y);c.bezierCurveTo(x-L/4,y-r*1.25,x+L/4,y-r*1.25,x+L/2,y);c.bezierCurveTo(x+L/4,y+r*1.25,x-L/4,y+r*1.25,x-L/2,y);c.closePath();
  c.fillStyle='rgba(248,232,220,.95)';c.fill();c.strokeStyle='#b07c6e';c.lineWidth=2;c.stroke();c.restore();
  for(const d of [-4,4])line(c,[[x-L*.44,y+d*.3],[x-L*.22,y+d],[x+L*.22,y+d],[x+L*.44,y+d*.3]],'#d38c7d',3);
  const w=26*(1+.5*S),n=6,pts=[];for(let i=0;i<=n*12;i++){const u=i/(n*12);pts.push([x-w+2*w*u,y+Math.sin(u*n*TAU)*r*.9]);}
  if(fire>0)glow(c,x,y,64,C.yellow,.6*fire);
  line(c,pts,C.ink,6);line(c,pts,fire>0||S>.3?C.yellow:'#d9bb45',3.4);
}
function kMuscleZoom(c,st,t){
  const S=st.stretch,Ct=st.contract,f=1+.12*S-.1*Ct,X=x=>KB.cx+(x-KB.cx)*f;
  D.round(c,KB.x,KB.y,KB.w,KB.h,16,'#2a1c18',rgba(C.yellow,.75));
  c.save();c.beginPath();c.roundRect(KB.x+2,KB.y+2,KB.w-4,KB.h-4,14);c.clip();
  if(Ct>0)glow(c,KB.cx,KB.y+KB.h/2,220,C.pink,.45*Ct);
  for(const [y,h] of K_FIB)kFibre(c,y,h*(1-.12*S+.2*Ct),f);
  const spx=X(K_SPX);kSpindle(c,spx,K_SPY,206*f,13,S,st.fire);
  // motor endings on the ordinary muscle fibres (the effector side)
  const mOn=st.mot>=0&&st.mot<1.15||Ct>0,ends=[[882,K_FIB[0][0]],[866,K_FIB[1][0]],[858,K_FIB[2][0]],[876,K_FIB[3][0]]].map(([x,y])=>[X(x),y]);
  kNeuron(c,[[910,KB.y+KB.h],[910,K_FIB[0][0]]],C.pink,mOn,5);
  for(const e of ends){kNeuron(c,[[910,e[1]],e],C.pink,mOn,4);ellipse(c,e[0],e[1],9,5,C.pink,C.ink,1.8);}
  // the sensory ending leaves the spindle
  kNeuron(c,[[spx,K_SPY+12],...K_SENS_PANEL.slice(0,3)],C.cyan,st.sens>=-.1&&st.sens<1.1,5);
  c.restore();
  // what the muscle is doing now: a dark tag with arrows (outward = stretched, inward = shortening)
  if(S>.05||Ct>.05){const on=S>.05,lab=on?P('被拉長','Stretched'):P('收縮變短','Shortening'),col=on?C.white:C.pink,a=on?S:Ct;
    c.save();c.globalAlpha=Math.min(1,a*1.5);const b=pill(c,lab,KB.cx-(measure(c,lab,22)+28)/2,KB.y+KB.h-46,{color:col,size:22,maxX:KB.x+KB.w});
    const y=b.y+b.h/2;for(const sd of [-1,1]){const x0=sd<0?b.x-6:b.x+b.w+6,x1=x0+sd*44;if(on)arrow(c,x0,y,x1,y,col,4.5);else arrow(c,x1,y,x0,y,col,4.5);}
    c.restore();}
}
function kCord(c,st,t){
  if(st.syn)glow(c,K_SYN[0],K_SYN[1],70,C.yellow,.45+.25*Math.sin(t*10));
  c.save();c.translate(KCX,KCY);c.rotate(-Math.PI/2);drawCordSection(c,0,0,KCS);c.restore();
  const sOn=st.sens>=-.1&&st.sens<1.1,mOn=st.mot>=-.1&&st.mot<1.15;
  kNeuron(c,K_SENS_PANEL.slice(2),C.cyan,sOn||st.syn,5);
  cellBody(c,672,414,19,13,'#bdf3fb',.42); // sensory neuron cell body, outside the cord
  kNeuron(c,K_MOT_PANEL,C.pink,mOn,5);
  cellBody(c,...K_SOMA,14,14,st.syn||mOn?C.pink:'#e9a3c4'); // motor neuron cell body
  circle(c,K_SYN[0],K_SYN[1],6,C.cyan,C.ink,2); // sensory ending touching the motor neuron = the one synapse
}
function kLines(c,p,x,y,size,color,lh){D.tr(p).split('\n').forEach((r,i)=>text(c,r,x,y+i*lh,size,color));}
function drawKnee(c,s,t){
  const {T,k}=kTime(s,t),st=kState(T),angle=st.angle,S=st.stretch,Ct=st.contract,R=p=>rotAbout(p,PIVOT,angle);
  const stepOf=n=>k<0?0:k===6||n<k?2:n===k?1:0;
  // examination table
  line(c,[[30,313],[30,588]],'#6d8a7a',10);line(c,[[238,313],[238,588]],'#6d8a7a',10);
  D.round(c,16,289,250,24,8,'#6d8a7a','#8fb0a0');
  // the leg: lower leg turns about the knee; the thigh layer on top hides the joint seam
  const thigh=pic('leg_thigh.png'),lower=pic('leg_lower.png');
  c.save();c.globalAlpha=.9;ellipse(c,PIVOT[0]-14,PIVOT[1]+8,26,30,'#e8c2b2');c.restore();
  if(lower){c.save();c.translate(...PIVOT);c.rotate(angle);c.translate(-PIVOT[0],-PIVOT[1]);c.drawImage(lower,KX,KY,1000*KS,746*KS);c.restore();}
  if(thigh)c.drawImage(thigh,KX,KY,1000*KS,746*KS);
  // quadriceps = the effector and home of the receptor: outlined; stretched (yellow) / contracting (pink)
  const fa=1+.05*S-.05*Ct,fp=1-.06*S+.16*Ct,quad=K_QUAD.map(p=>kQuadPt(p,fa,fp));
  c.save();c.beginPath();quad.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.closePath();
  c.fillStyle=Ct>0?rgba(C.pink,.12+.4*Ct):S>0?rgba(C.yellow,.1+.15*S):rgba(C.white,.1);c.fill();
  c.lineJoin='round';c.strokeStyle=C.ink;c.lineWidth=5;c.stroke();c.strokeStyle=Ct>0?C.pink:S>0?C.yellow:C.white;c.lineWidth=2.5;c.stroke();c.restore();
  const Q=u=>kQuadPt([mix(K_QA[0],K_QB[0],u),mix(K_QA[1],K_QB[1],u)],fa,fp);
  if(Ct>.1){arrow(c,...Q(.95),...Q(.7),C.white,4);arrow(c,...Q(.05),...Q(.3),C.white,4);}
  // pull chain, drawn when it matters: the tapped tendon (step 1) and the pull on the shin (step 6)
  const ptBot=R(K_PT_BOT),dent=st.hammer>.6?(st.hammer-.6)*8:0,ptMid=[mix(K_PT_TOP[0],ptBot[0],.55)-dent,mix(K_PT_TOP[1],ptBot[1],.55)];
  if(T>=0&&T<.8){const a=1-kSmooth(.55,.8,T);c.save();c.globalAlpha=a;line(c,[K_PT_TOP,ptMid,ptBot],C.ink,9);line(c,[K_PT_TOP,ptMid,ptBot],C.yellow,5);c.restore();}
  if(Ct>.1){c.save();c.globalAlpha=Math.min(1,Ct*1.5);
    for(const pts of [K_QT,[K_PT_TOP,ptBot]]){line(c,pts,C.ink,9);line(c,pts,C.white,5);}
    ellipse(c,K_PAT[0],K_PAT[1],7,13,rgba(C.bone,.5),C.white,3,-.2);
    arrow(c,...K_QT[2],K_QT[0][0]-4,K_QT[0][1]-2,C.pink,4.5);arrow(c,...ptBot,K_PT_TOP[0],K_PT_TOP[1]+8,C.pink,4.5);
    // the lower leg swings forward
    c.setLineDash([9,7]);c.strokeStyle=C.white;c.lineWidth=3;c.beginPath();c.arc(...PIVOT,300,1.2,.66,true);c.stroke();c.setLineDash([]);
    const e=[PIVOT[0]+300*Math.cos(.66),PIVOT[1]+300*Math.sin(.66)];arrow(c,e[0]-9,e[1]+12,e[0]+3,e[1]-5,C.white,4);c.restore();}
  // spinal cord in the lower back, and the two separate routes along the thigh
  nerve(c,K_CORDLEG,{w:8});
  const sensLeg=kOffset(K_ROUTE,5),motLeg=[...kOffset(K_ROUTE,-5).reverse(),KM(548,168)];
  const sOn=st.sens>=-.1&&st.sens<1.1,mOn=st.mot>=-.1&&st.mot<1.15||Ct>0;
  kNeuron(c,sensLeg,C.cyan,sOn,4);kNeuron(c,motLeg,C.pink,mOn,4);
  const mEnd=motLeg[motLeg.length-1],mDir=Math.atan2(K_QB[1]-K_QA[1],K_QB[0]-K_QA[0]);
  for(const d of [-.75,0,.75]){const tip=[mEnd[0]+Math.cos(mDir+d)*13,mEnd[1]+Math.sin(mDir+d)*13];line(c,[mEnd,tip],C.ink,5);line(c,[mEnd,tip],mOn?C.pink:rgba(C.pink,.6),3);circle(c,...tip,3.5,C.pink,C.ink,1.5);}
  kChevrons(c,sensLeg.slice(2,6),sOn?C.cyan:rgba(C.cyan,.8),1,7);kChevrons(c,motLeg.slice(1,4),mOn?C.pink:rgba(C.pink,.8),1,7);
  // the receptor: a muscle spindle inside the quadriceps belly (magnified on the right)
  c.save();c.translate(...K_SPINDLE);c.rotate(mDir);if(st.fire>0)glow(c,0,0,30,C.yellow,.7*st.fire);ellipse(c,0,0,12*(1+.25*S),4.5,C.yellow,C.ink,2);c.restore();
  if(st.sens>=0&&st.sens<=1)signal(c,sensLeg,st.sens,C.cyan,7);
  if(st.mot>=0&&st.mot<=1)signal(c,motLeg,st.mot,C.pink,7);
  // magnifier: dashed ring on the thigh → muscle zoom
  c.save();c.setLineDash([8,7]);c.strokeStyle=rgba(C.yellow,.85);c.lineWidth=2.5;c.beginPath();c.arc(...K_RING,26,0,TAU);c.stroke();
  c.beginPath();c.moveTo(K_RING[0]+14,K_RING[1]-22);c.lineTo(KB.x,KB.y+18);c.moveTo(K_RING[0]+20,K_RING[1]+17);c.lineTo(KB.x,KB.y+KB.h);c.stroke();c.restore();
  // reflex hammer taps the patellar tendon below the kneecap
  const tap=R(K_TAP),hk=st.hammer,hm=pic('reflex_hammer.png'),tip=[mix(tap[0]+78,tap[0]+2,hk),mix(tap[1]-6,tap[1],hk)],tilt=mix(-.9,-.35,hk);
  if(T<0)glow(c,...tap,26,C.yellow,.35+.2*Math.sin(t*4));
  if(T>=.1&&T<.4)glow(c,...tap,40,C.white,.7*(1-(T-.1)/.3));
  if(hm){c.save();c.translate(...tip);c.rotate(tilt);c.drawImage(hm,0,-29,66,195);c.restore();}
  D.hit(tip[0]-20,tip[1]-80,110,120,'tap',true);
  if(T<0){line(c,[[378,440],[tap[0]+6,tap[1]+8]],C.muted,2);kLines(c,P('輕敲：\n膝蓋下方的肌腱','Tap: the tendon\nbelow the kneecap'),372,466,22,C.white,30);}
  // ── right panel: the reflex arc, magnified ──
  panel(c,592,12,352,580);
  kMuscleZoom(c,st,t);
  kCord(c,st,t);
  if(st.sens>=0&&st.sens<=1)signal(c,[[K_SPX,K_SPY+12],...K_SENS_PANEL],st.sens,C.cyan,8);
  if(st.mot>=0&&st.mot<=1)signal(c,[...K_MOT_PANEL.slice(0,-1),[910,K_FIB[1][0]],[870,K_FIB[1][0]]],st.mot,C.pink,8);
  kChevrons(c,[[628,238],[628,292]],C.cyan,1,8);kChevrons(c,[[910,292],[910,238]],C.pink,1,8);
  legend(c,[[C.yellow,P('肌梭：肌肉內的受器','Receptor in muscle')],[C.cyan,P('感覺神經元：傳入','Sensory neuron: in')],[C.pink,P('運動神經元：傳出','Motor neuron: out')]],648,262,250,22);
  // labels
  const spl=pill(c,P('肌梭（受器）','Muscle spindle (receptor)'),KB.x+40,18,{active:stepOf(1)===1,color:C.yellow,size:22,maxX:KB.x+KB.w});
  line(c,[[K_SPX+18,spl.y+spl.h],[K_SPX+8,K_SPY-12]],C.yellow,2.5);circle(c,K_SPX+8,K_SPY-12,4,C.yellow);
  const lab=P('脊髓：反射中樞','Spinal cord: reflex centre'),lw=measure(c,lab,22)+28;pill(c,lab,KCX-lw/2,550,{active:true,size:22});
  // the nucleus inside the motor neuron's cell body
  const nl=P('細胞核','Nucleus'),nw=measure(c,nl,22)+28,nx=Math.min(Math.max(830,936-nw),940-nw);
  const n0=[nx+16,506],nd=Math.hypot(n0[0]-K_SOMA[0],n0[1]-K_SOMA[1]),n1=[K_SOMA[0]+(n0[0]-K_SOMA[0])/nd*8.5,K_SOMA[1]+(n0[1]-K_SOMA[1])/nd*8.5];
  line(c,[n0,n1],C.ink,5);line(c,[n0,n1],NUC_HI,2.5);pill(c,nl,nx,504,{color:NUC_HI,size:22,maxX:940});
  const sy=P('突觸','Synapse'),syw=measure(c,sy,22),sx=KCX-(syw+40)/2+40;
  text(c,sy,sx,382,22,st.syn?C.yellow:C.white);line(c,[[K_SYN[0],394],[K_SYN[0],K_SYN[1]-8]],C.white,2);
  text(c,P('脊髓','Spinal cord'),18,124,22,C.white);
  pill(c,P('股四頭肌（動器）','Quadriceps (effector)'),192,100,{active:Ct>0,color:C.pink,size:22,anchor:K_QUAD[2],maxX:560});
  // numbered steps on the picture, and the current step written at the top
  kBadge(c,1,tap[0]+44,tap[1]-46,stepOf(0));
  kBadge(c,2,KB.x+20,38,stepOf(1));
  kBadge(c,3,628,350,stepOf(2));
  kBadge(c,4,sx-22,374,stepOf(3));
  kBadge(c,5,910,350,stepOf(4));
  kBadge(c,6,176,120,stepOf(5));
  if(k<0)wrap(c,P('先預測：輕敲髕腱後，小腿會怎麼動？','Predict: after a gentle tap on the tendon, how will the lower leg move?'),20,44,540,24,C.white);
  else{const done=k===6;circle(c,36,36,20,done?C.green:C.yellow,C.white,2);
    if(done)line(c,[[26,37],[33,45],[47,28]],C.deep,4);else text(c,String(k+1),36,45,24,C.deep,'center');
    wrap(c,done?P('被拉長的股四頭肌，就是收縮、踢腿的那一塊','The stretched quadriceps is the very muscle that contracts and kicks'):K_TEXT[k],66,45,516,24,done?C.green:C.yellow);}
  kLines(c,P('動畫已放慢\n非真實比例','Slowed model,\nnot to scale'),46,546,22,C.muted,30);
}

// ── Tab 5: pupil light reflex ──────────────────────────────────────────────
function lamp(c,x,y,on,t){if(on){glow(c,x,y,70,C.yellow,.5+.1*Math.sin(t*3));for(let i=0;i<8;i++){const a=i*TAU/8;line(c,[[x+Math.cos(a)*26,y+Math.sin(a)*26],[x+Math.cos(a)*34,y+Math.sin(a)*34]],C.yellow,3);}}
  circle(c,x,y-2,18,on?C.yellow:'#5d7068',C.ink,2.5);D.round(c,x-9,y+14,18,12,3,C.muted,C.ink);}
function drawPupil(c,s,t){
  const x=715,y=300,p=Math.min(Math.max((t-s.start)/1.2,0),1),r=s.fromRadius+((s.bright?37:80)-s.fromRadius)*p;
  const R=140,pr=r*R/170;
  D.round(c,20,20,480,560,16,s.bright?'#21402f':'#0d1d18',C.edge);
  if(s.bright){c.save();c.setLineDash([10,9]);c.lineDashOffset=-t*30;for(const [a,b] of [[[86,86],[200,230]],[[96,72],[250,210]],[[74,98],[160,250]]])line(c,[a,b],rgba(C.yellow,.55),3);c.restore();}
  // eye: bright-light picture as base; the pupil disc grows over it, and the dim-light picture fades in when fully dilated
  const ES=.5,EX=260-508*ES,EY=320-380*ES,pImg=52+(r-37)/(80-37)*(114-52),prC=pImg*ES;
  const eb=pic('eye_bright.png'),ed=pic('eye_dim.png');
  if(eb){c.drawImage(eb,EX,EY,1000*ES,746*ES);
    const g=c.createRadialGradient(260,320,prC*.86,260,320,prC+2);g.addColorStop(0,'rgba(16,10,8,1)');g.addColorStop(1,'rgba(16,10,8,0)');c.fillStyle=g;c.beginPath();c.arc(260,320,prC+2,0,TAU);c.fill();
    const k=clamp((pImg-98)/16);if(ed&&k>0){c.globalAlpha=k;c.drawImage(ed,EX,EY,1000*ES,746*ES);c.globalAlpha=1;}
    circle(c,236,296,6,'rgba(255,255,255,.7)');}
  lamp(c,62,64,s.bright,t);text(c,s.bright?P('較亮','Brighter'):P('較暗','Dimmer'),106,72,24,s.bright?C.yellow:C.muted);
  pill(c,P('虹膜','Iris'),360,40,{active:true,anchor:[322,242],maxX:490});
  pill(c,P('中央開口＝瞳孔','Central opening = pupil'),120,536,{active:true,anchor:[260,320+prC-3],maxX:490});
  // the reflex pathway through the brainstem
  panel(c,520,20,420,560);
  text(c,P('反射路徑：經過腦幹','Reflex path: via the brainstem'),540,62,24,C.yellow);
  c.save();c.setLineDash([6,8]);ellipse(c,775,262,165,130,null,rgba(C.muted,.45),2.5);c.restore();
  drawBrainPic(c,711,197,.1,'stem',t);
  if(s.bright){c.save();c.setLineDash([10,8]);c.lineDashOffset=-t*30;for(const dy of [-22,0,22])line(c,[[540,262+dy*1.6],[606,266+dy*.3]],rgba(C.yellow,.7),3);c.restore();}
  text(c,P('光','Light'),548,214,22,C.yellow);
  circle(c,640,268,28,'#f7f3ea',C.ink,2.5);ellipse(c,614,268,7,15,'#7a4f26',C.ink,2);text(c,P('眼','Eye'),640,234,22,C.white,'center');
  const sens=[[668,262],[720,270],[780,292],[820,302]],motor=[[822,320],[770,326],[710,304],[640,286],[618,280]];
  nerve(c,sens,{w:5});nerve(c,motor,{w:5,color:'#f7b2c9'});
  const T=(t*.6)%1;if(T<.5)signal(c,sens,T*2,C.cyan,7);else signal(c,motor,(T-.5)*2,C.pink,7);
  pill(c,P('腦幹：反射中樞','Brainstem: reflex centre'),700,352,{active:true,size:22,anchor:[826,318]});
  let yy=legend(c,[[C.cyan,P('光的訊息傳到腦幹','Light signal to the brainstem')],[C.pink,P('控制虹膜肌肉','Command to the iris muscles')]],545,444,375,22);
  wrap(c,s.bright?P('較亮：瞳孔縮小，進入的光變少','Brighter: the pupil shrinks and lets in less light'):P('較暗：瞳孔放大，進入的光變多','Dimmer: the pupil widens and lets in more light'),545,yy+14,375,24,C.yellow);
}

const tabs=[
 {id:'brain',title:P('指揮不是一人包辦','Different control centres'),sub:P('大腦、小腦與腦幹','Cerebrum, cerebellum, brainstem'),hook:P('騎腳踏車保持平衡、記住路線、持續呼吸，都是大腦同一個地方做的嗎？','Do balance, remembering a route and breathing use the same part of the brain?'),body:P('點選構造或圖上的標籤：左邊看它在腦的哪個位置，右邊看它負責什麼。','Tap a part or its label: the left shows where it sits in the brain, the right shows what it does.'),closure:P('大腦處理許多意識活動；小腦協調與平衡；腦幹參與維持生命的功能。','The cerebrum supports many conscious activities; the cerebellum coordinates and balances; the brainstem supports vital functions.'),sources:[],init:()=>({running:true,part:0}),controls:s=>[choice(P('選擇構造','Select a part'),'part',parts.map((p,i)=>[i,p.name]))],explain:s=>({title:parts[s.part].name,text:parts[s.part].text}),draw:drawBrainTab},
 {id:'system',title:P('脊髓不是脊椎','Spinal cord is not bone'),sub:P('中樞與周圍神經','Central and peripheral systems'),hook:P('背後一節一節的骨頭，和裡面傳訊息的構造，是同一種東西嗎？','Are the segmented bones in your back the same structure as the signal-carrying cord inside?'),body:P('神經系統依構造與功能分為中樞神經系統、周圍神經系統。切換觀察，分清保護構造和傳訊構造。','Distinguish the central and peripheral nervous systems, then compare protective bones with signal-carrying tissue.'),closure:P('中樞是腦與脊髓；周圍是腦神經與脊神經。脊椎是骨骼，保護脊髓。','The CNS is the brain and spinal cord; the PNS includes cranial and spinal nerves. Vertebrae are bones that protect the spinal cord.'),reading:P('周圍神經連接中樞與受器、動器。脊髓既能傳遞訊息，也能整合一些反射；腦神經不等於中樞神經。課本把神經分成腦神經與脊神經，是依它們從哪裡發出，不是說神經本身就是腦或脊髓。','Peripheral nerves connect the CNS with receptors and effectors. The spinal cord relays signals and integrates some reflexes. Cranial nerves are not the CNS: the names cranial and spinal nerves refer to where the nerves emerge, not to being the brain or cord themselves.'),sources:[],init:()=>({running:true,view:'central'}),controls:s=>[choice(P('觀察','View'),'view',[['central',P('腦與脊髓','Brain and cord')],['peripheral',P('周圍神經','Peripheral nerves')],['bone',P('脊椎保護','Vertebral protection')]])],explain:s=>({title:s.view==='bone'?P('骨骼在外，神經組織在內','Bone outside, nervous tissue inside'):s.view==='central'?P('中樞神經系統','Central nervous system'):P('周圍神經系統','Peripheral nervous system'),text:s.view==='bone'?P('脊椎骨圍成保護通道，脊髓在其中；兩者的組成與功能不同。','Vertebrae form a protective canal around the spinal cord. Their tissues and functions differ.'):s.view==='central'?P('腦與脊髓負責整合訊息；脊髓也把許多身體訊息傳向腦、傳回身體。','The brain and spinal cord integrate signals. The spinal cord also relays many signals between brain and body.'):P('腦神經、脊神經把受器的訊息帶往中樞，並把控制訊息帶向肌肉或腺體。','Cranial and spinal nerves carry receptor signals toward the CNS and control signals toward muscles or glands.')}),draw:drawSystem},
 {id:'withdraw',title:P('先縮手，再覺得痛','Withdraw, then feel pain'),sub:P('反射與意識活動','Reflex and conscious actions'),hook:P('碰到燙物時，還沒想好「要縮手」，手就縮回來了。大腦沒收到訊息嗎？','A hand withdraws from heat before you decide to move. Does that mean the brain receives no signal?'),body:P('只觀察模型，不要故意碰燙物。比較快速縮手的脊髓反射，以及之後傳向大腦的感覺與處理。','Observe the model only; never deliberately touch hot objects. Compare spinal withdrawal with later awareness and conscious action.'),closure:P('反射不必先由大腦作意識決定；訊息仍可傳向大腦，形成感覺與後續反應。','A reflex does not require a conscious cerebral decision first. Signals can still reach the brain for awareness and later responses.'),reading:P('縮手反射的途徑：皮膚受器、感覺神經元、脊髓、運動神經元、肌肉。在脊髓內，訊息通常先經過中間神經元整合，再交給運動神經元（膝跳反射則是兩者直接相連）。訊息也可從脊髓上傳到大腦，使人感覺疼痛，並決定後續處理。不是所有反射都由脊髓負責；例如瞳孔對光反射涉及腦幹。動畫用較慢速度分解，不能用播放時間比較真實神經傳導速度。','Withdrawal involves skin receptors, sensory neurons, the spinal cord, motor neurons and muscles. Inside the cord the signal usually passes through an interneuron, which integrates it before it reaches the motor neuron (in the knee jerk the two connect directly). Signals also ascend to the cerebrum for pain perception and later decisions. Not every reflex is spinal: the pupil light reflex involves the brainstem. Slowed teaching animations do not measure real conduction speeds.'),sources:[],init:()=>({running:true,step:-1,mode:'reflex'}),controls:s=>[choice(P('途徑','Pathway'),'mode',[['reflex',P('縮手反射','Withdrawal reflex')],['aware',P('意識與後續處理','Awareness and action')]]),stepControls(s.mode==='reflex'?reflex:aware)],explain:s=>({title:s.mode==='reflex'?P('脊髓先整合，手先縮回','Spinal integration: hand withdraws first'):P('訊息仍會上傳大腦','Signals also ascend to the cerebrum'),text:s.mode==='reflex'?P('依序追蹤受器、感覺神經元、脊髓、運動神經元、動器；不把大腦排在縮手反射的必經順序內。','Trace receptor, sensory neuron, spinal cord, motor neuron and effector. A conscious cerebral decision is not a required step before withdrawal.'):P('脊髓把訊息上傳大腦；感覺疼痛並決定處理後，控制訊息可經脊髓與運動神經元到肌肉。','The spinal cord sends signals to the cerebrum. After pain perception and a decision, commands can travel via the cord and motor neurons to muscles.')}),draw:drawWithdraw},
 {id:'knee',title:P('敲一下，腿自己動','A tap makes the leg move'),sub:P('膝跳反射','Knee-jerk reflex'),hook:P('坐好、讓小腿懸空，輕敲膝蓋下方，為什麼小腿會抬起？','With the lower leg hanging freely, why can a gentle tap below the knee make it kick?'),body:P('老師示範輕敲髕腱：股四頭肌被拉長，肌肉裡的肌梭（受器）產生訊息，經脊髓直接傳回同一塊肌肉，使它收縮、小腿踢出。可用「逐步看」一步一步觀察。','A teacher gently taps the patellar tendon. The quadriceps is stretched, muscle spindles (receptors) inside it send a signal, and the spinal cord sends it straight back to the same muscle, which contracts and kicks the lower leg. Use "Step through" to watch one step at a time.'),closure:P('膝跳反射由脊髓整合：受器（肌梭）在被拉長的股四頭肌內，不是髕腱本身；訊息傳回同一塊肌肉，使它收縮。','The knee jerk is integrated in the spinal cord. Its receptors (muscle spindles) are inside the stretched quadriceps, not in the tendon itself, and the signal returns to that same muscle, which contracts.'),reading:P('膝跳反射的路徑：輕敲髕腱，股四頭肌瞬間被拉長 → 肌梭（肌肉裡的受器）產生訊息 → 感覺神經元把訊息傳入腰部的脊髓 → 在脊髓內直接與運動神經元相接，只經過一個突觸，中間沒有中間神經元 → 運動神經元把訊息傳回同一塊股四頭肌 → 肌肉收縮，經肌腱拉動小腿向前。同時，脊髓裡另有抑制性的中間神經元讓大腿後側的肌肉放鬆，小腿才踢得出去（圖中沒有畫出）。動畫已放慢，大小也不是真實比例。','The knee-jerk pathway: a tap on the patellar tendon briefly stretches the quadriceps → muscle spindles (receptors inside the muscle) send a signal → a sensory neuron carries it into the spinal cord in the lower back → there it connects directly to a motor neuron across a single synapse, with no interneuron in between → the motor neuron carries the signal back to the same quadriceps → the muscle contracts and, through the tendon, pulls the lower leg forward. At the same time, separate inhibitory interneurons in the cord relax the muscles at the back of the thigh so the leg can kick (not drawn). The animation is slowed and sizes are not to scale.'),sources:[],init:()=>({running:true,tapped:false,start:0,step:-1}),controls:s=>[{label:P('示範','Demonstration'),items:[{label:P('輕敲一次','Tap gently once'),key:'tap',value:true}]},choice(P('逐步看','Step through'),'step',K_SHORT.map((p,i)=>[i,p]))],act(s,k,v){if(k==='tap'){s.tapped=true;s.step=-1;s.start=s.elapsed;}else if(k==='step'){s.tapped=true;s.step=v;s.start=s.elapsed;}},explain:s=>{const k=kTime(s,s.elapsed||0).k;return{title:k<0?P('小腿懸空，先預測','Lower leg free: predict first'):k===6?P('股四頭肌收縮，小腿向前','The quadriceps contracts: the lower leg moves forward'):P('訊息走一圈，回到同一塊肌肉','The signal loops back to the same muscle'),text:P('這是放慢的機制示意，不是反射速度測量；大小也不是真實比例。實作由老師指導，輕敲即可，不能用力敲骨頭或當作診斷。','This is a slowed mechanism model, not a reflex-speed measurement, and sizes are not to scale. A teacher supervises gentle tapping; do not hit bones forcefully or use it diagnostically.')};},draw:drawKnee},
 {id:'pupil',title:P('光強了，入口縮小','Bright light, smaller opening'),sub:P('瞳孔對光反射','Pupil light reflex'),hook:P('眼睛的黑色開口大小會變，是你刻意思考後才動的嗎？','Do you consciously decide to change the size of the dark opening in your eye?'),body:P('切換環境光，觀察放慢的瞳孔變化模型，並追蹤訊息經過腦幹的反射路徑；瞳孔是虹膜中央的開口。','Switch the light, watch a slowed model of the pupil, and trace the reflex path through the brainstem. The pupil is an opening in the iris.'),closure:P('瞳孔對光反射涉及腦幹，並非所有反射都由脊髓負責。','The pupil light reflex involves the brainstem; not every reflex is integrated in the spinal cord.'),sources:[],init:()=>({running:true,bright:false,fromRadius:80,start:0}),act(s,k,v){const p=Math.min(Math.max((s.elapsed-s.start)/1.2,0),1),target=s.bright?37:80;s.fromRadius=s.fromRadius+(target-s.fromRadius)*p;s.bright=v;s.start=s.elapsed;},controls:s=>[choice(P('環境光','Light'),'bright',[[false,P('較暗','Dimmer')],[true,P('較亮','Brighter')]])],explain:s=>({title:s.bright?P('較亮：瞳孔縮小','Brighter: pupil constricts'):P('較暗：瞳孔較大','Dimmer: pupil enlarges'),text:P('改變瞳孔大小的是虹膜的肌肉；中央開口不是一塊黑色組織。請不要用強光直照眼睛做實驗。','Iris muscles change the opening\'s size; the pupil is not a piece of black tissue. Do not shine intense light into eyes as an experiment.')}),draw:drawPupil}
];
B.register({id:'brain',title:P('腦與反射：訊息怎麼走？','Brain and reflexes: where do signals go?'),subtitle:P('大腦、小腦、腦幹怎麼分工，反射為什麼比「想」還快','How the brain shares the work, and why reflexes beat thinking'),cover:'assets/covers/biology_brain_1018_v1.jpg',tabs});
})();

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
const BK=.285,BX=27,BY=5.5,BM=(x,y)=>[BX+x*BK,BY+y*BK];
const BODY_CNS=[[[757,75],[815,95],[835,150],[815,210],[770,228],[757,1090],[740,1090],[728,228],[690,210],[675,150],[695,95]]];
const ARM_O=[[714,429],[600,471],[529,543],[486,686],[457,857],[429,1000],[407,1114],[386,1200]],LEG_O=[[743,1000],[700,1086],[664,1171],[650,1357],[657,1514],[650,1643],[643,1786],[636,1871]];
const flipO=pts=>pts.map(([x,y])=>[1494-x,y]);
const LIMBS=[ARM_O,flipO(ARM_O),LEG_O,flipO(LEG_O)].map(p=>p.map(q=>BM(...q)));
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
function drawPnsZoom(c,t){
  wrap(c,P('一條神經＝許多神經纖維成束','One nerve = many nerve fibres in a bundle'),505,66,415,26,C.yellow);
  const cx=640,cy=300,R=108;
  for(let i=0;i<9;i++){const y=cy-70+i*17.5,k=i-4,strand=[[846,y],[880,y+k*3],[926,y+k*7]];nerve(c,strand,{w:5});if(i%3===1)signal(c,[...strand].reverse(),((t*.5)+i*.17)%1,C.cyan,6);}
  c.save();c.beginPath();c.roundRect(cx,cy-90,212,180,22);const g=c.createLinearGradient(0,cy-90,0,cy+90);g.addColorStop(0,'#c8ad72');g.addColorStop(.45,'#ecd9a8');g.addColorStop(1,'#b0924f');c.fillStyle=g;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();c.restore();
  for(let i=0;i<5;i++)line(c,[[cx+20,cy-62+i*31],[cx+200,cy-62+i*31]],'rgba(120,90,40,.45)',2);
  circle(c,cx,cy,R,'#efe0b8',C.ink,3);
  for(const [fx,fy,fr] of [[cx-40,cy-38,40],[cx+42,cy-30,38],[cx-28,cy+44,40],[cx+48,cy+50,34]]){
    circle(c,fx,fy,fr,'#d6b56d',C.ink,2);
    for(let yy=-fr+9;yy<fr;yy+=12.5)for(let xx=-fr+9;xx<fr;xx+=12.5){const ox=xx+((Math.round(yy)%2)?3:0);if(Math.hypot(ox,yy)<fr-7){circle(c,fx+ox,fy+yy,5.4,'#fbe7a6','#8a6a2a',1.2);circle(c,fx+ox,fy+yy,2.1,'#c98d2c');}}
  }
  pill(c,P('神經纖維','Nerve fibre'),505,436,{active:true,anchor:[612,346],size:22});
  pill(c,P('一條神經','One nerve'),790,160,{active:true,anchor:[800,212],size:22});
  wrap(c,P('腦神經從腦發出，脊神經從脊髓發出；它們把訊息送進、送出中樞。','Cranial nerves leave the brain and spinal nerves leave the cord; they carry signals into and out of the CNS.'),505,512,415,22,C.white);
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
  panel(c,20,20,440,560);
  if(cns)glow(c,240,180,170,C.yellow,.18+.08*Math.sin(t*3));
  const bp=bodyPic(s.view);if(bp)c.drawImage(bp,BX,BY,1493*BK,2000*BK);
  if(cns){c.save();c.shadowColor=C.yellow;c.shadowBlur=14+8*Math.sin(t*3);line(c,[BM(748,230),BM(748,1080)],rgba('#ffe58a',.75),4);c.restore();}
  if(pns)LIMBS.forEach((p,i)=>signal(c,[...p].reverse(),((t*.45)+i*.25)%1,C.cyan,7));
  if(bone)for(let y=BM(0,240)[1];y<BM(0,1080)[1];y+=12)D.round(c,231,y,16,9,3,rgba(C.bone,.9),C.boneDark);
  // magnifier from the body to the zoom panel
  c.save();c.setLineDash([8,7]);c.strokeStyle=rgba(C.yellow,.75);c.lineWidth=2.5;
  let a,b;
  if(cns){c.beginPath();c.roundRect(200,22,80,304,18);c.stroke();a=[280,40];b=[280,320];}
  else{const [x,y]=pns?BM(457,857):[239,200];c.beginPath();c.arc(x,y,30,0,TAU);c.stroke();a=[x+21,y-21];b=[x+21,y+21];}
  c.beginPath();c.moveTo(...a);c.lineTo(480,40);c.moveTo(...b);c.lineTo(480,560);c.stroke();c.restore();
  panel(c,480,20,460,560);
  if(cns)drawCnsZoom(c,t);else if(pns)drawPnsZoom(c,t);else drawBoneZoom(c,t);
}

// ── Tab 3: withdrawal reflex and later awareness ───────────────────────────
const reflex=[P('受器接收熱刺激','Receptors detect heat'),P('感覺神經元','Sensory neuron'),P('脊髓整合訊息','Spinal cord integrates'),P('運動神經元','Motor neuron'),P('肌肉收縮、縮手','Muscle contracts: withdraw')];
const aware=[P('脊髓：上傳訊息','Spinal cord: sends upward'),P('大腦：感覺與決定','Cerebrum: perception and decision'),P('脊髓：傳下控制訊息','Spinal cord: relays commands'),P('運動神經元','Motor neuron'),P('動器：肌肉','Effector: muscle')];
const SHOULDER=[420,198],ELBOW=[300,330],CORD=[520,318];
const INTER=[[495,280],[505,312],[486,346]],MOTOR=[[486,346],[456,366],[420,340],[384,292],[362,262]];
const UP=[[498,282],[530,262],[548,226],[552,186],[540,150],[520,92]],DOWN=[[506,92],[524,150],[516,206],[500,252],[490,300],[486,346]];
function armPose(lift){const L=Math.hypot(135,90),a=Math.atan2(90,-135)+lift*.9,wrist=[ELBOW[0]+Math.cos(a)*L,ELBOW[1]+Math.sin(a)*L],h=a-.45,dir=[Math.cos(h),Math.sin(h)];
  return{wrist,dir,palm:[wrist[0]+dir[0]*26,wrist[1]+dir[1]*26],tip:[wrist[0]+dir[0]*70,wrist[1]+dir[1]*70]};}
function sensoryPath(pose){return[pose.tip,pose.palm,pose.wrist,[ELBOW[0]+6,ELBOW[1]-14],[362,250],[410,212],[440,236],[456,262],[478,272],[495,280]];}
function drawPot(c,t){
  // pot on a gas stove (AI picture, 460×498): lid rim lands just under the fingertips
  const im=pic('hot_pot.png'),k=.36,X=76,Y=417;
  glow(c,150,541,70+6*Math.sin(t*9),C.orange,.3+.08*Math.sin(t*13));
  if(im)c.drawImage(im,X,Y,460*k,498*k);
  c.save();c.lineCap='round';for(const [x,ph] of [[96,0],[118,1.8]]){c.beginPath();for(let n=0;n<=10;n++){const yy=456-n*6-((t*30+ph*10)%18),xx=x+Math.sin(n*.8+t*3+ph)*5;n?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle='rgba(242,236,217,.4)';c.lineWidth=3;c.stroke();}c.restore();
}
function drawArm(c,pose,contract){
  circle(c,SHOULDER[0],SHOULDER[1],34,C.skin,C.skinDark,3);
  line(c,[SHOULDER,ELBOW],C.skinDark,62);line(c,[ELBOW,pose.wrist],C.skinDark,48);
  line(c,[SHOULDER,ELBOW],C.skin,56);line(c,[ELBOW,pose.wrist],C.skin,42);
  const {dir,palm,tip}=pose,n=[-dir[1],dir[0]];
  for(const k of [-1.5,-.5,.5,1.5]){const base=[palm[0]+n[0]*k*7,palm[1]+n[1]*k*7],end=[tip[0]+n[0]*k*9-dir[0]*Math.abs(k)*6,tip[1]+n[1]*k*9-dir[1]*Math.abs(k)*6];line(c,[base,end],C.skinDark,12);line(c,[base,end],C.skin,8);}
  const th=[[palm[0]+n[0]*16,palm[1]+n[1]*16],[palm[0]+n[0]*30+dir[0]*14,palm[1]+n[1]*30+dir[1]*14]];line(c,th,C.skinDark,14);line(c,th,C.skin,10);
  ellipse(c,palm[0],palm[1],28,22,C.skin,C.skinDark,3,Math.atan2(dir[1],dir[0]));
  const mid=[(SHOULDER[0]+ELBOW[0])/2,(SHOULDER[1]+ELBOW[1])/2],ang=Math.atan2(ELBOW[1]-SHOULDER[1],ELBOW[0]-SHOULDER[0]),ry=15+contract*9;
  c.save();c.translate(mid[0],mid[1]);c.rotate(ang);
  const g=c.createLinearGradient(0,-8-ry,0,-8+ry);g.addColorStop(0,'#f08a8a');g.addColorStop(1,'#b8414d');ellipse(c,0,-8,58,ry,g,'#7d2532',2.5);
  for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(-46,-8+k*ry*.3);c.quadraticCurveTo(0,-8+k*ry*.42,46,-8+k*ry*.3);c.strokeStyle='rgba(255,210,210,.45)';c.lineWidth=1.5;c.stroke();}
  c.restore();
}
function drawWithdraw(c,s,t){
  const isReflex=s.mode==='reflex',names=isReflex?reflex:aware,color=isReflex?C.cyan:C.pink;
  const phase=t*.7,i=s.step<0?Math.floor(phase)%5:s.step,u=phase%1;
  const lift=isReflex?(i===4?ease(u*2):0):1,contract=(i===4)?ease(u*2):isReflex?0:.3,pose=armPose(lift),sens=sensoryPath(pose);
  drawPot(c,t);
  // the brain and the pathways to it
  drawBrainPic(c,453,49,.07,isReflex?null:(i===1?'cerebrum':null),t);
  if(isReflex){nerve(c,UP,{w:4,alpha:.4,dash:[8,8]});text(c,P('稍後才上傳大腦','Reaches the brain later'),420,74,22,C.muted,'right');}
  else{nerve(c,UP,{w:5});nerve(c,DOWN,{w:5});
    if(i===1){glow(c,518,70,70,C.pink,.45+.2*Math.sin(t*6));pill(c,P('好燙！好痛！','Ouch, hot!'),250,50,{active:true,color:C.pink,size:24,maxX:420});}
    else text(c,P('大腦：感覺與決定','Cerebrum: feel and decide'),420,74,22,C.pink,'right');}
  // spinal cord inset
  circle(c,CORD[0],CORD[1],88,'#0f221c',C.edge,3);
  if((isReflex&&i===2)||(!isReflex&&(i===0||i===2)))glow(c,CORD[0],CORD[1],100,color,.35+.2*Math.sin(t*6));
  drawCordSection(c,CORD[0],CORD[1],1);
  text(c,P('脊髓（橫切面放大）','Spinal cord (section)'),CORD[0],CORD[1]+114,22,C.muted,'center');
  drawArm(c,pose,contract);
  nerve(c,sens,{w:5});nerve(c,INTER,{w:5});nerve(c,MOTOR,{w:5,color:'#f7b2c9'});
  ellipse(c,456,262,11,8,C.nerve,C.ink,2.5);
  // receptor and the travelling message
  const rec=pose.tip;
  if((isReflex&&i===0)){glow(c,rec[0],rec[1],46,C.yellow,.5+.3*Math.sin(t*8));}
  circle(c,rec[0],rec[1],8,C.yellow,C.ink,2);
  if(isReflex){if(i===1)signal(c,sens,u,color);if(i===2)signal(c,INTER,u,color);if(i===3)signal(c,MOTOR,u,color);}
  else{if(i===0)signal(c,UP,u,color);if(i===2)signal(c,DOWN,u,color);if(i===3)signal(c,MOTOR,u,color);}
  if(i===4){const m=[(SHOULDER[0]+ELBOW[0])/2,(SHOULDER[1]+ELBOW[1])/2];glow(c,m[0],m[1],70,color,.3+.2*Math.sin(t*8));}
  text(c,P('受器','Receptor'),mix(20,30,lift),mix(410,352,lift),22,C.yellow);
  text(c,P('肌肉（動器）','Muscle (effector)'),345,230,22,C.white,'right');
  text(c,P('動畫已放慢，不能比較真實傳導速度','Slowed: not a real conduction speed'),254,592,22,C.cyan);
  // the pathway as a vertical chain
  names.forEach((p,k)=>{const y=30+k*106;if(k){arrow(c,795,y-20,795,y-2,k<=i?color:C.edge,3.5);}node(c,p,650,y,290,84,k===i,color);});
}

// ── Tab 4: knee-jerk reflex ────────────────────────────────────────────────
const KS=.66,KX=-40,KY=60,KM=(x,y)=>[KX+x*KS,KY+y*KS],PIVOT=KM(645,255);
const K_SENS=[[500,165],[431,151],[341,136],[277,113],[256,67]].map(p=>KM(...p)),K_MOTOR=[[262,82],[282,131],[362,167],[449,182],[508,179]].map(p=>KM(...p)),K_REC=KM(500,165),K_SPINE=[KM(249,18),KM(262,110)];
const IN_SENS=[[706,124],[732,116],[767,123]],IN_INTER=[[767,123],[780,170],[753,214]],IN_MOTOR=[[753,214],[730,228],[704,234]];
function rotAbout(p,o,a){const dx=p[0]-o[0],dy=p[1]-o[1];return[o[0]+dx*Math.cos(a)-dy*Math.sin(a),o[1]+dx*Math.sin(a)+dy*Math.cos(a)];}
function drawKnee(c,s,t){
  const dt=t-s.start,on=s.tapped&&dt<2.6,dk=dt-.55;
  // the kick follows the motor signal (slowed model); same swing shape as before
  const angle=s.tapped&&dk>0&&dk<2?-.75*Math.sin(Math.min(dk,1)*Math.PI):0;
  const kickC=angle?Math.min(1,-angle/.5):0;
  // table, then the dashed zoom lines behind the leg
  line(c,[[96,246],[96,540]],'#6d8a7a',12);line(c,[[290,246],[290,540]],'#6d8a7a',12);line(c,[[96,480],[290,480]],'#6d8a7a',8);
  D.round(c,64,224,246,24,8,'#6d8a7a','#8fb0a0');
  c.save();c.setLineDash([8,7]);c.strokeStyle=rgba(C.yellow,.55);c.lineWidth=2.5;c.beginPath();c.moveTo(...K_SENS[4]);c.lineTo(712,132);c.moveTo(...K_SENS[4]);c.lineTo(712,222);c.stroke();c.restore();
  // the leg: lower leg turns about the knee, thigh layer on top hides the joint seam
  const thigh=pic('leg_thigh.png'),lower=pic('leg_lower.png');
  // joint flesh under both layers, so no gap opens behind the knee during the kick
  c.save();c.globalAlpha=.9;ellipse(c,PIVOT[0]-14,PIVOT[1]+8,26,30,'#e8c2b2');c.restore();
  if(lower){c.save();c.translate(...PIVOT);c.rotate(angle);c.translate(-PIVOT[0],-PIVOT[1]);c.drawImage(lower,KX,KY,1000*KS,746*KS);c.restore();}
  if(thigh)c.drawImage(thigh,KX,KY,1000*KS,746*KS);
  if(kickC)glow(c,...KM(420,170),90,C.pink,.35*kickC);
  // spinal cord in the lower back
  nerve(c,K_SPINE,{w:7});
  nerve(c,K_SENS,{w:5});nerve(c,K_MOTOR,{w:5,color:'#f7b2c9'});
  if(on&&dt<.18)glow(c,...K_REC,44,C.yellow,.6);
  circle(c,...K_REC,9,C.yellow,C.ink,2);
  if(on){signal(c,K_SENS,dt/.22,C.cyan);signal(c,K_MOTOR,(dt-.5)/.3,C.pink);}
  // reflex hammer taps the tendon below the kneecap
  const tap=rotAbout(KM(680,282),PIVOT,angle),k=s.tapped?(dt<.1?dt/.1:Math.max(0,1-(dt-.1)/.35)):0;
  const hm=pic('reflex_hammer.png'),tip=[mix(tap[0]+78,tap[0]+2,k),mix(tap[1]-6,tap[1],k)],tilt=mix(-.9,-.35,k);
  if(hm){c.save();c.translate(...tip);c.rotate(tilt);c.drawImage(hm,0,-29,66,195);c.restore();}
  if(!s.tapped){line(c,[[500,398],tap],C.muted,2);text(c,P('輕敲：膝蓋下方的肌腱','Tap: tendon below the kneecap'),500,420,22,C.white);}
  // spinal cord inset
  circle(c,800,175,100,'#0f221c',C.edge,3);
  if(on&&dt>.28&&dt<.5)glow(c,800,175,110,C.yellow,.45);
  drawCordSection(c,800,175,1.3);
  nerve(c,IN_SENS,{w:5});nerve(c,IN_INTER,{w:5});nerve(c,IN_MOTOR,{w:5,color:'#f7b2c9'});ellipse(c,730,117,10,7,C.nerve,C.ink,2);
  if(on){signal(c,IN_SENS,(dt-.2)/.1,C.cyan,7);signal(c,IN_INTER,(dt-.3)/.1,C.yellow,7);signal(c,IN_MOTOR,(dt-.4)/.1,C.pink,7);}
  const lab=P('脊髓：反射中樞','Spinal cord: reflex centre'),lw=measure(c,lab,22)+28;pill(c,lab,800-lw/2,24,{active:true,size:22});
  legend(c,[[C.yellow,P('肌肉內受器','Receptor in muscle')]],30,572,300);
  legend(c,[[C.cyan,P('感覺訊息進脊髓','Sensory signal to cord')]],340,572,300);
  legend(c,[[C.pink,P('運動訊息回肌肉','Motor signal to muscle')]],650,572,300);
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
 {id:'withdraw',title:P('先縮手，再覺得痛','Withdraw, then feel pain'),sub:P('反射與意識活動','Reflex and conscious actions'),hook:P('碰到燙物時，還沒想好「要縮手」，手就縮回來了。大腦沒收到訊息嗎？','A hand withdraws from heat before you decide to move. Does that mean the brain receives no signal?'),body:P('只觀察模型，不要故意碰燙物。比較快速縮手的脊髓反射，以及之後傳向大腦的感覺與處理。','Observe the model only; never deliberately touch hot objects. Compare spinal withdrawal with later awareness and conscious action.'),closure:P('反射不必先由大腦作意識決定；訊息仍可傳向大腦，形成感覺與後續反應。','A reflex does not require a conscious cerebral decision first. Signals can still reach the brain for awareness and later responses.'),reading:P('縮手反射的途徑：皮膚受器、感覺神經元、脊髓、運動神經元、肌肉。訊息也可從脊髓上傳到大腦，使人感覺疼痛，並決定後續處理。不是所有反射都由脊髓負責；例如瞳孔對光反射涉及腦幹。動畫用較慢速度分解，不能用播放時間比較真實神經傳導速度。','Withdrawal involves skin receptors, sensory neurons, the spinal cord, motor neurons and muscles. Signals also ascend to the cerebrum for pain perception and later decisions. Not every reflex is spinal: the pupil light reflex involves the brainstem. Slowed teaching animations do not measure real conduction speeds.'),sources:[],init:()=>({running:true,step:-1,mode:'reflex'}),controls:s=>[choice(P('途徑','Pathway'),'mode',[['reflex',P('縮手反射','Withdrawal reflex')],['aware',P('意識與後續處理','Awareness and action')]]),stepControls(s.mode==='reflex'?reflex:aware)],explain:s=>({title:s.mode==='reflex'?P('脊髓先整合，手先縮回','Spinal integration: hand withdraws first'):P('訊息仍會上傳大腦','Signals also ascend to the cerebrum'),text:s.mode==='reflex'?P('依序追蹤受器、感覺神經元、脊髓、運動神經元、動器；不把大腦排在縮手反射的必經順序內。','Trace receptor, sensory neuron, spinal cord, motor neuron and effector. A conscious cerebral decision is not a required step before withdrawal.'):P('脊髓把訊息上傳大腦；感覺疼痛並決定處理後，控制訊息可經脊髓與運動神經元到肌肉。','The spinal cord sends signals to the cerebrum. After pain perception and a decision, commands can travel via the cord and motor neurons to muscles.')}),draw:drawWithdraw},
 {id:'knee',title:P('敲一下，腿自己動','A tap makes the leg move'),sub:P('膝跳反射','Knee-jerk reflex'),hook:P('坐好、讓小腿懸空，輕敲膝蓋下方，為什麼小腿會抬起？','With the lower leg hanging freely, why can a gentle tap below the knee make it kick?'),body:P('老師示範輕敲髕腱；刺激使肌肉被拉長，肌肉中的受器產生訊息，經脊髓反射造成肌肉收縮。','A teacher gently taps the patellar tendon. The resulting muscle stretch activates receptors within the muscle, leading to a spinal reflex and contraction.'),closure:P('膝跳反射由脊髓整合；受器在被拉伸的肌肉內，不是把髕腱本身當作受器。','The knee jerk is integrated in the spinal cord. Its receptors are in the stretched muscle, not the tendon itself.'),sources:[],init:()=>({running:true,tapped:false,start:0}),controls:s=>[{label:P('示範','Demonstration'),items:[{label:P('輕敲一次','Tap gently once'),key:'tap',value:true}]}],act(s,k){if(k==='tap'){s.tapped=true;s.start=s.elapsed;}},explain:s=>({title:s.tapped?P('肌肉收縮，小腿向前','Contraction moves the lower leg forward'):P('小腿懸空，先預測','Lower leg free: predict first'),text:P('這是放慢的機制示意，不是反射速度測量。實作由老師指導，輕敲即可，不能用力敲骨頭或當作診斷。','This is a slowed mechanism model, not a reflex-speed measurement. A teacher supervises gentle tapping; do not hit bones forcefully or use it diagnostically.')}),draw:drawKnee},
 {id:'pupil',title:P('光強了，入口縮小','Bright light, smaller opening'),sub:P('瞳孔對光反射','Pupil light reflex'),hook:P('眼睛的黑色開口大小會變，是你刻意思考後才動的嗎？','Do you consciously decide to change the size of the dark opening in your eye?'),body:P('切換環境光，觀察放慢的瞳孔變化模型，並追蹤訊息經過腦幹的反射路徑；瞳孔是虹膜中央的開口。','Switch the light, watch a slowed model of the pupil, and trace the reflex path through the brainstem. The pupil is an opening in the iris.'),closure:P('瞳孔對光反射涉及腦幹，並非所有反射都由脊髓負責。','The pupil light reflex involves the brainstem; not every reflex is integrated in the spinal cord.'),sources:[],init:()=>({running:true,bright:false,fromRadius:80,start:0}),act(s,k,v){const p=Math.min(Math.max((s.elapsed-s.start)/1.2,0),1),target=s.bright?37:80;s.fromRadius=s.fromRadius+(target-s.fromRadius)*p;s.bright=v;s.start=s.elapsed;},controls:s=>[choice(P('環境光','Light'),'bright',[[false,P('較暗','Dimmer')],[true,P('較亮','Brighter')]])],explain:s=>({title:s.bright?P('較亮：瞳孔縮小','Brighter: pupil constricts'):P('較暗：瞳孔較大','Dimmer: pupil enlarges'),text:P('改變瞳孔大小的是虹膜的肌肉；中央開口不是一塊黑色組織。請不要用強光直照眼睛做實驗。','Iris muscles change the opening’s size; the pupil is not a piece of black tissue. Do not shine intense light into eyes as an experiment.')}),draw:drawPupil}
];
B.register({id:'brain',title:P('腦與反射：訊息怎麼走？','Brain and reflexes: where do signals go?'),subtitle:P('大腦、小腦、腦幹怎麼分工，反射為什麼比「想」還快','How the brain shares the work, and why reflexes beat thinking'),cover:'assets/covers/biology_brain_1009_v1.jpg',tabs});
})();

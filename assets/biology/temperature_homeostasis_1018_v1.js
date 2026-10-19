/* Homeostasis and body temperature · teacher-requested V5 remake, 2026-10-18.
 * Same five tabs, hooks, closures, readings and controls as temperature_homeostasis_1009_v1.js.
 * Pictures are the teacher's Gemini AI teaching illustrations (see temperature_ai_1018/sources.md);
 * curves, heat, sweat, blood flow and the cooperation diagram are drawn here. The arm reuses the
 * brain-and-reflex unit's pictures. Curves, times and sizes are concept models, not measurements.
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',
  ink:'#0b1a15',nerve:'#f6c453'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};

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

function sun(c,x,y,t,r=30){glow(c,x,y,r*3.2,C.yellow,.45+.08*Math.sin(t*3));for(let i=0;i<12;i++){const a=i*TAU/12+t*.2;line(c,[[x+Math.cos(a)*(r+8),y+Math.sin(a)*(r+8)],[x+Math.cos(a)*(r+18),y+Math.sin(a)*(r+18)]],C.yellow,3.5);}D.sphere(c,x,y,r,C.yellow);}

// ── pictures ───────────────────────────────────────────────────────────────
const PICS={};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
const T_DIR='assets/biology/temperature_ai_1018/',ARM_DIR='assets/biology/brain_reflex_ai_1018/';
function fitPic(c,path,bx,by,bw,bh,alpha=1,cover=false){
  const im=pic(path);if(!im)return null;const f=cover?Math.max:Math.min,k=f(bw/im.naturalWidth,bh/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k,x=bx+(bw-w)/2,y=by+(bh-h)/2;
  c.save();if(cover){c.beginPath();c.roundRect(bx,by,bw,bh,14);c.clip();}c.globalAlpha=alpha;c.drawImage(im,x,y,w,h);c.restore();return(px,py)=>[x+px*k,y+py*k];
}
const HEAT='#fb923c',COOL='#55e9ff';
function heatWave(c,x,y,t,color=HEAT,len=40,ph=0){c.save();c.lineCap='round';c.beginPath();for(let i=0;i<=12;i++){const u=i/12,yy=y-u*len-mod(t*28+ph*9,18),xx=x+Math.sin(u*9+t*4+ph)*5;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle=rgba(color,.75);c.lineWidth=3;c.stroke();c.restore();}
function droplet(c,x,y,r,a=1){c.save();c.globalAlpha=a;c.beginPath();c.moveTo(x,y-r*1.6);c.bezierCurveTo(x+r*1.1,y-r*.4,x+r,y+r,x,y+r);c.bezierCurveTo(x-r,y+r,x-r*1.1,y-r*.4,x,y-r*1.6);c.fillStyle='rgba(125,211,252,.9)';c.fill();c.strokeStyle='#0369a1';c.lineWidth=1.5;c.stroke();circle(c,x-r*.3,y-r*.2,r*.25,'rgba(255,255,255,.8)');c.restore();}
function waterMol(c,x,y,s=7,a=1){c.save();c.globalAlpha=a;circle(c,x-s*.75,y-s*.55,s*.48,'#f2ecd9',C.ink,1);circle(c,x+s*.75,y-s*.55,s*.48,'#f2ecd9',C.ink,1);circle(c,x,y,s*.7,'#f472b6',C.ink,1.2);c.restore();}
function thermometer(c,x,y,h,level,color){D.round(c,x-10,y,20,h,10,'#16302a',C.edge);D.round(c,x-6,y+h*(1-level),12,h*level,6,color);circle(c,x,y+h+12,16,color,C.edge,2);}

// ── Tab 1: a stable range, not a fixed value ───────────────────────────────
function drawRange(c,s,t){
  const X0=90,X1=900,YC=300,BAND=50,dist=s.disturb,reg=s.regulate,tt=Math.max(0,t-s.start);
  panel(c,20,20,920,560);
  text(c,P('體溫（概念曲線）','Body temperature (concept curve)'),40,62,26,C.yellow);
  // suitable band
  c.save();c.fillStyle='rgba(74,222,128,.14)';c.fillRect(X0,YC-BAND,X1-X0,BAND*2);c.setLineDash([8,6]);line(c,[[X0,YC-BAND],[X1,YC-BAND]],rgba(C.green,.7),2);line(c,[[X0,YC+BAND],[X1,YC+BAND]],rgba(C.green,.7),2);c.restore();
  text(c,P('適當範圍','Suitable range'),X1,YC-BAND-12,22,C.green,'right');
  line(c,[[X0,100],[X0,500]],C.muted,3);line(c,[[X0,500],[X1,500]],C.muted,3);text(c,P('時間 →','time →'),X1,530,22,C.muted,'right');
  // curve: disturbance pushes, regulation pulls back
  const sign=dist==='hot'?-1:1,T0=.25,cut=clamp(tt/8);
  const yAt=u=>{const wob=Math.sin(u*38)*9+Math.sin(u*17+1)*6;if(u<T0)return YC+wob;const v=(u-T0)/(1-T0),push=sign*150*(1-Math.exp(-v*8));const back=reg?push*Math.exp(-Math.max(0,v-.12)*7):push;return YC+wob*(reg?1:.6)+(reg?back:push);};
  const pts=[];for(let i=0;i<=200*cut;i++){const u=i/200;pts.push([mix(X0,X1,u),yAt(u)]);}
  line(c,pts,reg?C.cyan:C.orange,5);
  if(pts.length){const p=pts[pts.length-1];glow(c,p[0],p[1],34,reg?C.cyan:C.orange,.35+.25*Math.sin(t*4));D.sphere(c,p[0],p[1],9,reg?C.cyan:C.orange);}
  const dx=mix(X0,X1,T0);c.save();c.setLineDash([6,6]);line(c,[[dx,100],[dx,500]],rgba(C.white,.5),2);c.restore();
  text(c,dist==='hot'?P('🏃 劇烈運動、天熱','🏃 Exercise / heat'):P('❄️ 突然變冷','❄️ Sudden cold'),dx+10,120,22,C.white);
  if(cut>.6)pill(c,reg?P('有調節：回到範圍內，仍小幅波動','Regulated: back in range, still wobbles'):P('沒有調節：持續偏離','No regulation: keeps drifting'),reg?520:470,dist==='hot'?440:130,{active:true,color:reg?C.cyan:C.orange,size:22,maxX:930});
}

// ── Tab 2: body systems cooperate — the organ is pulled out of the body and enlarged ──
// Body pictures are full-size cut-outs (about 440×1105). Coordinates below are in those pixels.
const SYSTEMS=[
 {name:P('消化','Digestion'),file:'body_digestive.png',area:[130,150,180,440],dot:'#fde047',flow:P('養分被吸收，進入血液','Nutrients are absorbed into the blood'),
  labels:[[P('食道','Esophagus'),[224,250],-1],[P('肝臟','Liver'),[180,365],-1],[P('胃','Stomach'),[262,372],1],[P('大腸','Large intestine'),[158,470],-1],[P('小腸','Small intestine'),[222,488],1]]},
 {name:P('呼吸','Respiration'),file:'body_respiratory.png',area:[125,70,180,330],dot:'#55e9ff',flow:P('氧氣進入血液，二氧化碳排出','Oxygen enters blood; carbon dioxide leaves'),
  labels:[[P('鼻腔','Nasal cavity'),[212,100],1],[P('氣管','Trachea'),[215,215],1],[P('肺','Lung'),[172,320],-1],[P('肺','Lung'),[262,320],1]]},
 {name:P('皮膚','Skin'),file:'body_respiratory.png',area:[20,430,110,140],skin:true,dot:'#fb923c',flow:P('流汗、散熱，也排出少量廢物','Sweat and heat loss; a little waste leaves too')},
 {name:P('泌尿','Urinary'),file:'body_urinary.png',area:[150,320,160,250],dot:'#a3e635',flow:P('廢物與多餘水分形成尿液排出','Wastes and extra water leave as urine'),
  labels:[[P('腎臟','Kidney'),[185,390],-1],[P('腎臟','Kidney'),[268,375],1],[P('輸尿管','Ureter'),[199,460],-1],[P('膀胱','Bladder'),[228,522],1]]}
];
const RESP_IN=[[212,100],[214,180],[215,268]],LUNG_L=[[215,268],[192,290],[172,318]],LUNG_R=[[215,268],[240,290],[262,318]];
const URINE_L=[[190,395],[202,410],[200,455],[197,500],[215,516]],URINE_R=[[266,380],[252,398],[255,455],[252,500],[238,516]];
// Soften the hard rectangle of a cropped body picture into the panel colour.
function featherEdges(c,[x,y,w,h],f){const base='#16332b';c.save();
  for(const [x0,y0,x1,y1,rx,ry,rw,rh] of [[x,0,x+f,0,x,y,f,h],[x+w,0,x+w-f,0,x+w-f,y,f,h],[0,y,0,y+f,x,y,w,f],[0,y+h,0,y+h-f,x,y+h-f,w,f]]){
    const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,base);g.addColorStop(1,rgba(base,0));c.fillStyle=g;c.fillRect(rx,ry,rw,rh);}
  c.restore();}
function drawCooperate(c,s,t){
  const q=SYSTEMS[s.system],tt=Math.max(0,t-s.start),z=ease(tt/.9);
  // left: the whole body, with the region that will be enlarged
  panel(c,20,20,190,560);
  const im=pic(T_DIR+q.file),TK=.386,TX=30,TY=60;
  if(im)c.drawImage(im,TX,TY,im.naturalWidth*TK,im.naturalHeight*TK);
  const [ax,ay,aw,ah]=q.area,src=[TX+ax*TK,TY+ay*TK,aw*TK,ah*TK];
  c.save();c.strokeStyle=C.yellow;c.lineWidth=3;c.setLineDash([7,5]);c.strokeRect(...src);c.restore();
  text(c,P('全身位置','Body view'),115,48,22,C.muted,'center');
  // middle: zoom panel; the region flies out of the body and grows
  const ZX=228,ZY=20,ZW=462,ZH=560;panel(c,ZX,ZY,ZW,ZH);
  const bottom=s.system===1?70:20,k=Math.min((ZW-40)/aw,(ZH-80-bottom)/ah),dst=[ZX+(ZW-aw*k)/2,ZY+60+(ZH-80-bottom-ah*k)/2,aw*k,ah*k];
  const cur=[0,1,2,3].map(i=>mix(src[i],dst[i],z));
  c.save();c.setLineDash([8,7]);c.strokeStyle=rgba(C.yellow,.6*(1-z*.6));c.lineWidth=2.5;
  c.beginPath();c.moveTo(src[0]+src[2],src[1]);c.lineTo(cur[0],cur[1]);c.moveTo(src[0]+src[2],src[1]+src[3]);c.lineTo(cur[0],cur[1]+cur[3]);c.stroke();c.restore();
  c.save();c.beginPath();c.roundRect(ZX+2,ZY+2,ZW-4,ZH-4,14);c.clip();
  if(q.skin){if(im){c.globalAlpha=1-z;c.drawImage(im,ax,ay,aw,ah,...cur);c.globalAlpha=1;}
    const sk=pic(T_DIR+'skin_section.png');if(sk&&z>0){const w=ZW-40,h=w*596/687,x=ZX+20,y=ZY+(ZH-h)/2+20;c.globalAlpha=z;c.drawImage(sk,x,y,w,h);c.globalAlpha=1;
      if(z>.95){const M=(px,py)=>[x+px*w/687,y+py*w/687],pore=M(...SK.pore);for(let i=0;i<5;i++)heatWave(c,ZX+70+i*80,y+40,t,HEAT,46,i);
        [-60,-20,30,80].forEach((dx,i)=>{const life=mod(t*.35+i*.25);droplet(c,pore[0]+dx,pore[1]-12-life*30,7*(1-life*.5),1-life*.6);});
        pill(c,P('汗腺','Sweat gland'),ZX+24,y+h-30,{size:22,color:C.cyan,anchor:M(...SK.gland),maxX:ZX+ZW-10});
        pill(c,P('皮膚血管','Skin vessels'),ZX+260,y+h-30,{size:22,color:'#fca5a5',anchor:M(470,215),maxX:ZX+ZW-10});}}}
  else if(im){c.drawImage(im,ax,ay,aw,ah,...cur);featherEdges(c,cur,28);
    if(z>.95){const M=(px,py)=>[dst[0]+(px-ax)*k,dst[1]+(py-ay)*k];
      if(s.system===0){const ctr=M(222,488);glow(c,...ctr,120,q.dot,.18+.08*Math.sin(t*3));
        for(let i=0;i<14;i++){const a=i*2.4,u=mod(t*.35+i/14),r=30+u*90;circle(c,ctr[0]+Math.cos(a)*r,ctr[1]+Math.sin(a)*r*.7,6,q.dot,C.ink,1.3);}
        for(let i=0;i<3;i++){const [x,y]=along([M(224,175),M(225,330),M(255,370)],mod(t*.3+i/3));circle(c,x,y,8,'#d9a066',C.ink,1.5);}}
      else if(s.system===1){for(const br of [LUNG_L,LUNG_R])for(let i=0;i<4;i++){const path=[...RESP_IN,...br.slice(1)].map(p=>M(...p));const [x,y]=along(path,mod(t*.3+i/4+(br===LUNG_R?.12:0)));circle(c,x,y,7,C.cyan,C.ink,1.3);}
        for(let i=0;i<3;i++){const path=[...RESP_IN].reverse().map(p=>M(...p));const [x,y]=along(path,mod(t*.3+i/3+.5));circle(c,x+14,y,6,'#9ca3af',C.ink,1.3);}
        legend(c,[[C.cyan,P('氧氣','Oxygen')]],ZX+30,ZY+ZH-28,200,22);legend(c,[['#9ca3af',P('二氧化碳','Carbon dioxide')]],ZX+220,ZY+ZH-28,230,22);}
      else if(s.system===3){for(const path of [URINE_L,URINE_R])for(let i=0;i<4;i++){const [x,y]=along(path.map(p=>M(...p)),mod(t*.3+i/4));circle(c,x,y,6,q.dot,C.ink,1.3);}
        glow(c,...M(228,522),70,q.dot,.25+.1*Math.sin(t*3));}
      for(const [lab,pt,side] of q.labels){const a=M(...pt);pill(c,lab,side<0?ZX+16:a[0]+70,a[1]-18,{size:22,color:q.dot,anchor:a,maxX:ZX+ZW-10});}}}
  c.restore();
  text(c,P('放大：','Enlarged: '),ZX+20,ZY+40,24,C.yellow);text(c,q.name,ZX+20+measure(c,P('放大：','Enlarged: '),24),ZY+40,24,q.dot);
  // right: compact diagram — every system trades materials with the blood
  panel(c,704,20,236,560);
  text(c,P('一起維持恆定','Working together'),822,62,24,C.yellow,'center');
  const hub=[890,290],ys=[150,240,330,420];
  ys.forEach((yc,i)=>{const on=i===s.system,col=SYSTEMS[i].dot,a=[846,yc],b=[hub[0]-30,hub[1]+(yc-hub[1])*.25];
    line(c,[a,b],on?col:rgba(C.white,.22),on?5:2.5);
    if(on)for(let n=0;n<3;n++){const u=mod(t*.5+n/3),p=i===3||i===2?[mix(b[0],a[0],u),mix(b[1],a[1],u)]:[mix(a[0],b[0],u),mix(a[1],b[1],u)];circle(c,p[0],p[1],6,col,C.ink,1.2);}
    D.round(c,714,yc-27,132,54,12,on?col:C.panel,on?C.white:C.edge);text(c,SYSTEMS[i].name,780,yc+8,22,on?C.deep:C.white,'center');D.hit(714,yc-27,132,54,'system',i);});
  circle(c,hub[0],hub[1],40,'#7f1d1d','#fca5a5',3);text(c,P('循環','Blood'),hub[0],hub[1]+8,22,C.white,'center');
  wrap(c,q.flow,718,494,212,22,q.dot);
}

// ── Tab 3: endotherms and ectotherms ───────────────────────────────────────
const ANIMALS=[
 {file:'polar_bear.jpg',name:P('北極熊','Polar bear'),endo:true},
 {file:'seal_ice.jpg',name:P('海豹','Seal'),endo:true},
 {file:'skink_basking.jpg',name:P('石龍子','Skink'),endo:false},
 {file:'turtle_basking.jpg',name:P('龜','Turtle'),endo:false}
];
function drawAnimals(c,s,t){
  const a=ANIMALS[s.animal];
  fitPic(c,T_DIR+a.file,20,20,600,400,1,true);D.round(c,20,20,600,400,14,null,C.edge);
  text(c,P('AI 教學插圖（非實拍）','AI teaching illustration (not a photo)'),30,445,22,C.muted);
  if(a.endo){for(let i=0;i<6;i++){const x=200+i*45,y=260+Math.sin(i)*20;glow(c,x,y,36,HEAT,.25+.15*Math.sin(t*3+i));}
    for(let i=0;i<5;i++)heatWave(c,190+i*55,220,t,HEAT,34,i);}
  else{sun(c,560,70,t,28);c.save();c.setLineDash([10,9]);c.lineDashOffset=-t*30;for(let i=0;i<4;i++)line(c,[[540-i*8,92+i*6],[330-i*40,230+i*10]],rgba(C.yellow,.6),3);c.restore();}
  panel(c,640,20,300,560);
  text(c,a.name,790,66,30,C.yellow,'center');
  text(c,a.endo?P('內溫動物','Endotherm'):P('外溫動物','Ectotherm'),790,108,26,a.endo?HEAT:C.yellow,'center');
  const rows=a.endo?[[HEAT,P('熱主要來自身體代謝','Heat mainly from metabolism')],['#f2ecd9',P('毛皮、脂肪減少散熱','Fur and fat reduce heat loss')],[C.green,P('需要足夠食物供應','Needs enough food')]]
    :[[C.yellow,P('熱主要來自外界（太陽）','Heat mainly from outside (sun)')],[C.cyan,P('冷了曬太陽，熱了躲陰影','Bask when cold, hide in shade when hot')],[C.green,P('外溫不等於體溫永遠低','Not always cold')]];
  let y=160;for(const [col,p] of rows){circle(c,664,y-7,9,col,C.ink,2);y+=wrap(c,p,684,y,252,22,C.white)+22;}
  // body temperature vs outside temperature mini chart
  const gx=660,gy=400,gw=260,gh=150;D.round(c,gx,gy,gw,gh,10,'#11261f',C.edge);
  text(c,P('外界溫度 →','Outside temp →'),gx+gw-6,gy+gh-8,22,C.muted,'right');
  const pts=[];for(let i=0;i<=40;i++){const u=i/40,yy=a.endo?gy+gh*.35+Math.sin(u*20)*2:gy+gh*.85-u*gh*.6;pts.push([gx+12+u*(gw-24),yy]);}
  line(c,pts,a.endo?HEAT:C.yellow,4);text(c,P('體溫','Body temp'),gx+10,gy+26,22,a.endo?HEAT:C.yellow);
}

// ── skin picture landmarks (skin_section.png 687×596) ──────────────────────
const SK={vessels:[[8,170],[60,205],[130,262],[260,245],[380,232],[470,215],[580,198],[680,185]],pore:[250,140],gland:[265,410],
  muscle:[[480,330],[560,250]]};
function skinPic(c,x,y,w,file='skin_section.png',alpha=1){const im=pic(T_DIR+file);if(!im)return null;const k=w/687;c.save();c.globalAlpha=alpha;c.drawImage(im,x,y,687*k,596*k);c.restore();return(px,py)=>[x+px*k,y+py*k];}
// The skin picture fades into a copy whose vessels are widened (heat) or narrowed (cold); only the vessels differ.
function skinVessels(c,x,y,w,file,z){const m=skinPic(c,x,y,w);if(z>0)skinPic(c,x,y,w,file,z);return m;}
function bloodFlow(c,m,t,n,speed,r){if(!m)return;const pts=SK.vessels.map(p=>m(...p));for(let k=0;k<n;k++){const u=mod(t*speed+k/n),[x,y]=along(pts,u);circle(c,x,y+2,r,'#fecaca','#7f1d1d',1);}}


// ── Close-up of one skin vessel: its width changes over time, and blood flow follows ──
// w: 0 = narrowed (cold) … 1 = widened (hot). The small skin picture marks which vessel is enlarged.
// Red blood cells: random positions (seeded, so every visit looks the same) that never overlap.
const RBC_LEN=600,RBC=(()=>{let a=20261019;const rnd=()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  return Array.from({length:90},()=>({x:rnd()*RBC_LEN,lane:rnd()*2-1}));})();
function visibleCells(r,n){const out=[],half=Math.max(0,r-9);
  for(const q of RBC){if(out.length>=n)break;const y=q.lane*half;
    if(out.every(o=>{const dx=Math.abs(o.x-q.x),cdx=Math.min(dx,RBC_LEN-dx);return cdx>25||Math.abs(o.y-y)>16;}))out.push({x:q.x,y});}
  return out;}
function drawVesselZoom(c,s,t,w,from,to){
  // small skin picture, blended between the narrowed and widened copies
  const SX=40,SY=84,SW=240;skinPic(c,SX,SY,SW,'skin_vessels_wide.png');const m=skinPic(c,SX,SY,SW,'skin_vessels_narrow.png',1-w);
  const k=SW/687,box=[SX+250*k,SY+198*k,140*k,70*k];
  c.save();c.setLineDash([7,5]);c.strokeStyle=C.yellow;c.lineWidth=3;c.strokeRect(...box);c.restore();
  // zoom window
  const Z=[40,330,560,236],surf=Z[1]+22,cy=surf+(Z[1]+Z[3]-surf)/2,r=mix(13,50,w);
  c.save();c.setLineDash([8,7]);c.strokeStyle=rgba(C.yellow,.6);c.lineWidth=2.5;c.beginPath();c.moveTo(box[0],box[1]+box[3]);c.lineTo(Z[0]+6,Z[1]);c.moveTo(box[0]+box[2],box[1]+box[3]);c.lineTo(Z[0]+250,Z[1]);c.stroke();c.restore();
  c.save();c.beginPath();c.roundRect(...Z,14);c.clip();
  let g=c.createLinearGradient(0,Z[1],0,Z[1]+Z[3]);g.addColorStop(0,'#f1c9b6');g.addColorStop(.1,'#e9b49f');g.addColorStop(1,'#d9957f');c.fillStyle=g;c.fillRect(...Z);
  c.fillStyle='#f6d8c8';c.fillRect(Z[0],Z[1],Z[2],22);line(c,[[Z[0],surf],[Z[0]+Z[2],surf]],'#c98a74',2);
  for(let i=0;i<40;i++)circle(c,Z[0]+(i*97)%Z[2],surf+14+(i*53)%(Z[3]-30),2,'rgba(160,90,70,.25)');
  // the vessel: wall, blood, red blood cells (constant size; how many fit and how fast they go follow the width)
  D.round(c,Z[0]-10,cy-r-7,Z[2]+20,2*r+14,r+7,'#c2414c');
  g=c.createLinearGradient(0,cy-r,0,cy+r);g.addColorStop(0,'#f8b4b4');g.addColorStop(.5,'#fecaca');g.addColorStop(1,'#f19c9c');D.round(c,Z[0]-10,cy-r,Z[2]+20,2*r,r,g);
  const speed=mix(35,150,w);s.flow=(s.flow||0)+speed*clamp(t-(s.flowT??t),0,.1);s.flowT=t;
  const n=Math.round(mix(4,40,Math.pow(w,1.1)));
  for(const q of visibleCells(r,n)){const x=Z[0]-20+mod(q.x+s.flow,RBC_LEN),y=cy+q.y;
    ellipse(c,x,y,11,7,'#dc2626','#7f1d1d',1.4);ellipse(c,x,y,4.5,2.6,'#f87171');}
  c.restore();D.round(c,...Z,14,null,C.edge);
  // heat carried by the blood leaves through the surface
  const waves=Math.round(1+7*w);for(let i=0;i<waves;i++){c.save();c.globalAlpha=.35+.6*w;heatWave(c,Z[0]+40+i*(Z[2]-80)/Math.max(1,waves-1||1),Z[1]-2,t,HEAT,26+18*w,i);c.restore();}
  pill(c,P('局部放大：一條皮膚血管','Close-up: one skin vessel'),Z[0]+12,Z[1]+Z[3]-46,{size:22,active:true,color:C.yellow,maxX:Z[0]+Z[2]-6});
  // gauges and the change in progress
  const GX=300,GW=290;
  [[P('血管粗細','Vessel width'),w,'#fca5a5'],[P('血流量','Blood flow'),Math.pow(w,1.1),'#ef4444'],[P('從皮膚散熱','Heat lost at skin'),w,HEAT]].forEach(([lab,v,col],i)=>{const y=92+i*54;
    text(c,lab,GX,y,22,C.white);D.round(c,GX,y+10,GW,16,8,'#11261f',C.edge);D.round(c,GX+2,y+12,Math.max(6,(GW-4)*mix(.08,1,v)),12,6,col);});
  const py=258;text(c,from,GX,py,22,C.muted);text(c,to,GX+GW,py,22,C.muted,'right');
  const ax=GX+measure(c,from,22)+12,bx=GX+GW-measure(c,to,22)-12,prog=clamp((t-s.start-.6)/4);line(c,[[ax,py-7],[bx,py-7]],C.edge,4);
  D.sphere(c,mix(ax,bx,prog),py-7,8,C.yellow);
}

// ── Tab 4: sweat must evaporate to carry heat ──────────────────────────────
function drawHeat(c,s,t){
  panel(c,20,20,600,560);
  c.save();c.beginPath();c.roundRect(20,20,600,560,16);c.clip();const g=c.createLinearGradient(0,20,0,200);g.addColorStop(0,'rgba(251,146,60,.28)');g.addColorStop(1,'rgba(251,146,60,0)');c.fillStyle=g;c.fillRect(20,20,600,200);c.restore();
  sun(c,560,70,t,26);text(c,P('天氣炎熱','Hot weather'),40,62,26,HEAT);
  if(s.view==='vessel'){const w=ease(clamp((t-s.start-.6)/4));drawVesselZoom(c,s,t,w,P('涼爽','Cool'),P('炎熱','Hot'));
    panel(c,640,20,300,560);text(c,P('血管擴張','Vessels widen'),790,70,28,C.yellow,'center');
    let y=120;for(const p of [P('天氣變熱，皮膚血管變粗','In heat, skin vessels widen'),P('流經皮膚的血液變多','More blood flows through the skin'),P('血液把較多的熱帶到皮膚表面散失','Blood carries more heat to the surface to be lost')])y+=wrap(c,p,662,y,260,24,C.white)+24;
    wrap(c,P('紅血球放大示意；時間經過壓縮','Red cells enlarged; time compressed'),662,540,260,22,C.muted);return;}
  const vz=ease((t-s.start)/1.6),m=skinVessels(c,70,118,490,'skin_vessels_wide.png',vz);
  bloodFlow(c,m,t,Math.round(4+6*vz),.18,3.5);
  if(m){const pore=m(...SK.pore),gl=m(...SK.gland);
    glow(c,gl[0],gl[1],40,C.cyan,.3+.15*Math.sin(t*4));
    // sweat rising in the duct, then droplets on the surface
    for(let k=0;k<3;k++){const u=mod(t*.5+k/3);circle(c,mix(gl[0],pore[0],u),mix(gl[1],pore[1],u),4,'#7dd3fc','#0369a1',1);}
    const drops=[[-60,6],[-20,-2],[30,4],[80,-4],[130,0]];
    drops.forEach(([dx,dy],i)=>{const x=pore[0]+dx,y=pore[1]+dy-14;
      if(s.evaporate){const life=mod(t*.35+i*.2),r=8*(1-life*.6);droplet(c,x,y,r,1-life*.4);
        for(let j=0;j<2;j++){const u=mod(t*.45+i*.17+j*.5);waterMol(c,x+Math.sin(u*8+i)*14,y-20-u*120,6,1-u);if(j===0&&u<.7)heatWave(c,x+10,y-30-u*100,t,HEAT,22,i);}}
      else droplet(c,x,y,9+i%2*2,1);});
    pill(c,P('汗腺分泌汗液','Sweat gland secretes sweat'),40,486,{size:22,color:C.cyan,anchor:gl,maxX:600});
    pill(c,P('皮膚血管擴張、血流增加','Skin vessels widen, more blood flow'),260,540,{size:22,color:'#fca5a5',anchor:m(380,232),maxX:610});}
  panel(c,640,20,300,560);
  text(c,s.evaporate?P('蒸發出去','Evaporates'):P('留在表面','Stays on surface'),790,70,28,C.yellow,'center');
  const rows=s.evaporate?[P('水分子離開皮膚，進入空氣','Water molecules leave the skin'),P('離開時帶走熱，皮膚變涼','They carry heat away; skin cools')]:[P('汗液停在皮膚上','Sweat stays on the skin'),P('還沒蒸發，帶走的熱有限','Little heat removed until it evaporates')];
  let y=120;for(const p of rows)y+=wrap(c,p,662,y,260,24,C.white)+24;
  thermometer(c,790,330,170,s.evaporate?.45+.05*Math.sin(t):.78,s.evaporate?C.cyan:HEAT);
  text(c,P('皮膚溫度（示意）','Skin temperature (model)'),790,555,22,C.muted,'center');
}

// ── Tab 5: shivering and narrowed skin vessels ─────────────────────────────
function drawCold(c,s,t){
  panel(c,20,20,600,560);
  c.save();c.beginPath();c.roundRect(20,20,600,560,16);c.clip();const g=c.createLinearGradient(0,20,0,220);g.addColorStop(0,'rgba(85,233,255,.25)');g.addColorStop(1,'rgba(85,233,255,0)');c.fillStyle=g;c.fillRect(20,20,600,220);
  const vz=s.response==='vessel',snowN=vz?12:26;for(let i=0;i<snowN;i++){const x=vz?210+(i*97)%390:30+(i*83)%580,y=vz?28+mod(t*14+i*17,48):30+mod(t*30+i*41,200);c.fillStyle='rgba(242,236,217,.8)';c.font='18px sans-serif';c.fillText('❄',x,y);}c.restore();
  text(c,P('天氣寒冷','Cold weather'),40,62,26,COOL);
  if(s.response==='vessel'){
    const w=1-ease(clamp((t-s.start-.6)/4));drawVesselZoom(c,s,t,w,P('溫暖','Warm'),P('寒冷','Cold'));
  }else{
    const im=pic(ARM_DIR+'arm_upper.png'),fo=pic(ARM_DIR+'arm_forearm.png'),k=.3,shake=Math.sin(t*38)*2.2,AX=0,AY=170;
    c.save();c.translate(shake,Math.cos(t*41)*1.5);if(fo)c.drawImage(fo,AX,AY,2000*k,1116*k);if(im)c.drawImage(im,AX,AY,2000*k,1116*k);c.restore();
    const mus=[AX+1270*k,AY+420*k];glow(c,mus[0],mus[1],90,HEAT,.45+.2*Math.sin(t*12));
    for(let i=0;i<4;i++)heatWave(c,mus[0]-50+i*34,mus[1]-30,t,HEAT,40,i);
    pill(c,P('肌肉快速收縮（發抖）→ 產熱','Rapid muscle contractions (shivering) → heat'),40,500,{size:22,color:HEAT,active:true,anchor:mus,maxX:610});
  }
  panel(c,640,20,300,560);
  text(c,P('寒冷時兩招','Two ways in the cold'),790,66,28,C.yellow,'center');
  const items=[[ 'vessel',COOL,P('減少散熱','Lose less heat'),P('皮膚血管收縮','Skin vessels narrow')],['shiver',HEAT,P('增加產熱','Make more heat'),P('肌肉發抖','Shivering muscles')]];
  items.forEach(([key,col,a,b],i)=>{const y=110+i*150,on=s.response===key;D.round(c,660,y,260,124,14,on?rgba(col,.2):C.panel,on?col:C.edge);text(c,a,790,y+50,26,on?col:C.white,'center');text(c,b,790,y+92,22,C.white,'center');D.hit(660,y,260,124,'response',key);});
  thermometer(c,790,420,100,.55+.04*Math.sin(t),C.green);
  text(c,P('體溫維持在適當範圍','Body temp stays in range'),790,568,22,C.green,'center');
}

const tabs=[
 {id:'range',title:P('穩定不是不變','Stable is not frozen'),sub:P('恆定性與調節','Homeostasis'),hook:P('跑完操場，心跳和呼吸都變快。身體是失去控制，還是正在調節？','After a run, pulse and breathing increase. Is the body out of control, or regulating?'),body:P('恆定性是把內在環境維持在適合生命活動的範圍；不是每個數值永遠固定。選一種外界干擾，再比較有沒有調節。','Homeostasis keeps internal conditions within a suitable range, not at a perfectly fixed value. Choose a disturbance, then compare with and without regulation.'),closure:P('外界改變時，身體偵測變化並調節，讓內在環境維持適當範圍。','The body detects changes and regulates to maintain suitable internal conditions.'),reading:P('體溫、血糖與水分都需要調節。適當範圍不是所有人、所有時間都相同；圖上的曲線只是概念模型，不是學生的實測資料。','Temperature, glucose and water all require regulation. Suitable ranges vary with context. These curves are conceptual, not measurements of a student.'),sources:[],init:()=>({running:true,regulate:true,disturb:'hot',start:0}),controls:()=>[choice(P('外界干擾','Disturbance'),'disturb',[['hot',P('運動、天熱','Exercise / heat')],['cold',P('突然變冷','Sudden cold')]]),choice(P('概念比較','Compare'),'regulate',[[true,P('有調節','Regulation')],[false,P('沒有調節','No regulation')]])],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>({title:P('波動在適當範圍內','Fluctuation within a suitable range'),text:s.regulate?P('干擾後，調節使數值逐漸回到適當範圍；仍有小幅波動，不是變成完全水平的直線。','After a disturbance, regulation returns conditions toward the suitable range; small fluctuations remain.'):P('這條比較曲線假設沒有調節，數值持續偏離；用來看懂調節的功能，不是預測病人的狀況。','This comparison assumes no regulation, so values keep drifting. It shows what regulation does; it does not predict a patient.')}),draw:drawRange},
 {id:'cooperate',title:P('全身一起幫忙','A whole-body team'),sub:P('系統間的合作','Systems cooperate'),hook:P('吃進去的養分，到底怎麼變成跑步時能用的能量？','How do nutrients from food help you run?'),body:P('選一個系統：器官會從全身圖拉出來放大，再看它和循環怎麼合作。身體不是各器官各自工作，而是合作維持生命活動。','Choose a system: its organs are pulled out of the body and enlarged, then see how it works with circulation. Systems cooperate rather than work alone.'),closure:P('消化供應養分，呼吸交換氣體，循環運送物質；皮膚與泌尿等系統也參與恆定。','Digestion supplies nutrients, respiration exchanges gases, circulation transports materials; skin and urinary functions also support homeostasis.'),sources:[],init:()=>({running:true,system:0,start:0}),controls:()=>[choice(P('放大觀察','Inspect'),'system',[[0,P('消化','Digestion')],[1,P('呼吸','Respiration')],[2,P('皮膚','Skin')],[3,P('泌尿','Urinary')]])],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>({title:[P('消化：供應養分','Digestion supplies nutrients'),P('呼吸：交換氣體','Respiration exchanges gases'),P('皮膚：散熱與排出','Skin loses heat and wastes'),P('泌尿：排出與保留','Urinary: remove and retain')][s.system],text:[P('食物經消化後，小分子養分被吸收，再經循環運到細胞。細胞呼吸能釋出能量，不是消化器官直接把能量送出去。','Digested small nutrients are absorbed and transported to cells. Cellular respiration releases energy; digestive organs do not ship energy as a substance.'),P('肺讓氧氣進入血液、二氧化碳離開血液；血液再與組織交換物質。呼吸運動不是細胞呼吸本身。','Lungs exchange oxygen and carbon dioxide with blood, which exchanges materials with tissues. Ventilation is not cellular respiration itself.'),P('皮膚血流與汗液蒸發影響散熱。汗液也含水分與鹽類，因此需要和水分調節一起看。','Skin blood flow and sweat evaporation affect heat loss. Sweat also removes water and salts, connecting heat control with water regulation.'),P('腎臟把代謝廢物、多餘的水與鹽排出，並保留身體仍需要的物質；尿液先存於膀胱。','Kidneys remove metabolic wastes and excess water and salts while retaining needed substances. The bladder stores urine.')][s.system]}),draw:drawCooperate},
 {id:'animals',title:P('冷血？不等於冰冷','Ectotherms are not icy'),sub:P('內溫與外溫動物','Endotherms and ectotherms'),hook:P('烏龜曬太陽，不就是在幫自己調整體溫嗎？','Is a basking turtle regulating its temperature?'),body:P('切換動物，分清「主要熱來源」和「能不能調節」。外溫動物也能靠行為改變受熱。','Switch animals. Distinguish the main heat source from the ability to regulate. Ectotherms also regulate through behaviour.'),closure:P('內溫動物主要靠代謝產熱；外溫動物的體溫較受外界影響，也能靠曬太陽或躲陰影調節。','Endotherms rely mainly on metabolic heat; ectotherms depend more on external heat and can regulate behaviourally.'),sources:[],init:()=>({running:true,animal:0}),controls:()=>[choice(P('動物','Animal'),'animal',[[0,P('北極熊','Polar bear')],[1,P('海豹','Seal')],[2,P('石龍子','Skink')],[3,P('龜','Turtle')]])],explain:s=>({title:s.animal<2?P('內溫：代謝產熱為主','Endotherm: mainly metabolic heat'):P('外溫：外界熱源影響較大','Ectotherm: external heat matters more'),text:s.animal<2?P('哺乳類與鳥類屬內溫動物。毛、羽毛或皮下脂肪可減少散熱；代謝產熱仍需養分供應。右下圖是概念示意。','Mammals and birds are endotherms. Fur, feathers or fat reduce heat loss; metabolic heat still requires nutrients. The small graph is a concept sketch.'):P('爬蟲類可移到陽光下或陰影中。外溫不是「體溫永遠低」，也不等於完全沒有調節。右下圖是概念示意。','Reptiles may move into sunlight or shade. Ectothermy means neither always cold nor incapable of regulation. The small graph is a concept sketch.')}),draw:drawAnimals},
 {id:'heat',title:P('汗留下來，還是飛走？','Sweat: stay or evaporate?'),sub:P('炎熱時的散熱','Heat loss'),hook:P('同樣流汗，汗滴一直留在皮膚上，和蒸發出去，散熱效果一樣嗎？','Does sweat cool equally when it stays on skin or evaporates?'),body:P('皮膚血管擴張可增加散熱；汗液蒸發也能帶走熱。切換「汗液蒸發」與「放大：皮膚血管」，分別觀察。','Dilated skin vessels increase heat loss. Evaporating sweat carries away heat. Switch between the sweat view and the skin-vessel close-up.'),closure:P('汗液要蒸發才有明顯的蒸發散熱；炎熱時皮膚血流增加，也有助散熱。','Evaporation provides evaporative cooling; increased skin blood flow also helps heat loss.'),sources:[],init:()=>({running:true,evaporate:true,start:0,view:'sweat'}),controls:s=>[choice(P('觀察','View'),'view',[['sweat',P('汗液蒸發','Sweat')],['vessel',P('放大：皮膚血管','Close-up: skin vessel')]]),s.view==='vessel'?{label:P('播放','Play'),items:[{label:P('重新播放','Play again'),key:'replay',value:true}]}:choice(P('汗液去向','Sweat'),'evaporate',[[true,P('蒸發出去','Evaporates')],[false,P('留在表面','Stays on surface')]])],act(s,k,v){if(k!=='replay')s[k]=v;s.start=s.elapsed;},explain:s=>s.view==='vessel'?({title:P('血管擴張，血流量增加','Vessels widen; blood flow rises'),text:P('炎熱時皮膚血管擴張，流經皮膚的血液變多，較多的熱由血液帶到皮膚表面散失。','In heat, skin vessels widen, more blood flows through the skin and more heat reaches the surface to be lost.')}):({title:s.evaporate?P('水分子離開表面，帶走熱','Water leaves the surface with heat'):P('分泌汗液不等於已完成散熱','Secretion is not evaporation'),text:s.evaporate?P('水分子從皮膚表面進入空氣。動畫以放大符號呈現，不代表肉眼能看見水蒸氣。','Water molecules leave skin for the air. Enlarged symbols do not mean water vapour is visible.'):P('這個比較暫時不畫蒸發，讓你看到汗液停在表面；不是說真實汗液永遠不能蒸發。','This comparison suppresses evaporation to show sweat remaining on the surface; real sweat can still evaporate.')}),draw:drawHeat},
 {id:'cold',title:P('發抖在做什麼？','Why shiver?'),sub:P('寒冷時的調節','Cold response'),hook:P('冷到發抖，不只是一種感覺；肌肉正在替身體做什麼？','Shivering is more than a feeling. What are the muscles doing?'),body:P('寒冷時可減少散熱並增加產熱。比較皮膚血管收縮與肌肉收縮，不要把兩種收縮混為一談。','Cold responses reduce heat loss and increase heat production. Distinguish skin-vessel constriction from muscle contraction.'),closure:P('皮膚血管收縮減少散熱；發抖時肌肉收縮增加代謝產熱。','Skin-vessel constriction reduces heat loss; shivering increases metabolic heat production.'),sources:[],init:()=>({running:true,response:'shiver',start:0}),controls:s=>[choice(P('看哪種調節','Inspect'),'response',[['shiver',P('發抖產熱','Shivering')],['vessel',P('減少散熱','Less heat loss')]]),...(s.response==='vessel'?[{label:P('播放','Play'),items:[{label:P('重新播放','Play again'),key:'replay',value:true}]}]:[])],act(s,k,v){if(k!=='replay')s[k]=v;s.start=s.elapsed;},explain:s=>({title:s.response==='shiver'?P('肌肉活動增加產熱','Muscle activity produces heat'):P('皮膚血管收縮','Skin vessels constrict'),text:s.response==='shiver'?P('發抖是肌肉快速收縮；代謝活動增加可產熱。食物供應養分，但不能把熱當作在血液中流動的一顆顆物質。','Shivering involves rapid muscle contractions and increased metabolic heat. Heat is not a stream of separate particles in blood.'):P('皮膚血流減少，可減少由體內向表面的熱散失；不是全身血管全部關閉，也不是停止循環。','Reduced skin blood flow limits heat loss at the surface. Circulation does not stop or shut every vessel.')}),draw:drawCold}
];
B.register({id:'temperature',title:P('恆定與體溫：穩定不是不變','Homeostasis and body temperature'),subtitle:P('全身合作、內溫與外溫，以及炎熱和寒冷時的調節','Systems cooperate, heat sources and responses to heat and cold'),cover:'assets/covers/biology_temperature_1009_v1.jpg',tabs});
})();

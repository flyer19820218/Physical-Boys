/* Excretion and water balance · teacher-requested V5 remake, 2026-10-19.
 * Same six tabs, hooks, closures, readings and controls as excretion_water_1009_v1.js.
 * Pictures are the teacher's Gemini AI teaching illustrations (excretion_ai_1019, plus the body,
 * skin, liver and lenticel pictures from earlier units). Urine, wastes, water, blood and every
 * close-up section are drawn here as models, not to scale; levels and counts are qualitative.
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
const mixHex=(a,b,u)=>{const p=parseInt(a.slice(1),16),q=parseInt(b.slice(1),16),ch=s=>Math.round(mix(p>>s&255,q>>s&255,clamp(u)));return `rgb(${ch(16)},${ch(8)},${ch(0)})`;};
const src=(file,name,page,figure)=>({file,name,page,figure});

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
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(16,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function splitLines(c,str,maxW,size=22){
  c.save();c.font=FONT(size);
  const isEn=/[A-Za-z]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9₂]+(?:['’–-][A-Za-z0-9₂]+)*|\s+|[^A-Za-z0-9₂\s]/g)||[]):Array.from(str);
  const rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());
  c.restore();return rows;
}
function node(c,p,x,y,w,h,active,color=C.cyan){
  D.round(c,x,y,w,h,12,active?color:C.panel,active?C.white:C.edge);
  const rows=splitLines(c,D.tr(p),w-20,22),lh=26,y0=y+h/2-(rows.length-1)*lh/2+8;
  rows.forEach((r,i)=>text(c,r,x+w/2,y0+i*lh,22,active?C.deep:C.white,'center'));
}
function panel(c,x,y,w,h,fill='#16332b'){D.round(c,x,y,w,h,16,fill,C.edge);}
// A label capsule with an optional leader line to the structure it names.
function pill(c,p,x,y,{active=false,color=C.yellow,size=22,anchor=null,maxX=940,minX=24,hit=null}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(minX,Math.min(x,maxX-w));
  if(anchor){const sx=Math.max(x,Math.min(x+w,anchor[0])),sy=Math.max(y,Math.min(y+h,anchor[1]));const col=active?color:rgba(color,.9);line(c,[[sx,sy],anchor],C.ink,5);line(c,[[sx,sy],anchor],col,2.5);circle(c,anchor[0],anchor[1],5,col,C.ink,1.5);}
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.9)',active?C.white:rgba(color,.8));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  if(hit)D.hit(x,y,w,h,hit[0],hit[1]);
  return{x,y,w,h};
}
function legendRow(c,items,x,y,size=22){for(const [draw,p] of items){draw(x+10,y-7);text(c,p,x+30,y,size,C.white);x+=measure(c,p,size)+62;}}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
function dashedBox(c,r,color=C.yellow,w=3){c.save();c.strokeStyle=color;c.lineWidth=w;c.setLineDash([8,5]);c.strokeRect(...r);c.restore();}
function lerpRect(a,b,u){return a.map((v,i)=>mix(v,b[i],u));}
// Dashed lines join the small source box to its enlargement, so students see where it came from.
function connectors(c,a,b,alpha=.6){c.save();c.setLineDash([7,6]);const col=rgba(C.yellow,alpha);
  if(b[0]>=a[0]+a[2]-1){line(c,[[a[0]+a[2],a[1]],[b[0],b[1]]],col,2);line(c,[[a[0]+a[2],a[1]+a[3]],[b[0],b[1]+b[3]]],col,2);}
  else{line(c,[[a[0],a[1]+a[3]],[b[0],b[1]]],col,2);line(c,[[a[0]+a[2],a[1]+a[3]],[b[0]+b[2],b[1]]],col,2);}
  c.restore();}
function zoomRect(box,area,maxK=3.4){const [bx,by,bw,bh]=box,[X,Y,W,H]=area,k=Math.min(W/bw,H/bh,maxK);return{k,r:[X+(W-bw*k)/2,Y+(H-bh*k)/2,bw*k,bh*k]};}
// Oxygen-poor blood is dark red, oxygen-rich bright red: never blue.
function rbc(c,x,y,r,ox){const body=mixHex('#7a1f2b','#ef3e46',ox),rim=mixHex('#a3404a','#ff8a8f',ox);ellipse(c,x,y,r,r*.62,body,rim,1.6);ellipse(c,x,y,r*.42,r*.24,mixHex('#5e1520','#c42f39',ox));}
function hexagon(c,x,y,r,fill=C.yellow,a=1,rot=0){c.save();c.globalAlpha=a;c.beginPath();for(let i=0;i<6;i++){const q=rot+i*TAU/6+Math.PI/6;i?c.lineTo(x+Math.cos(q)*r,y+Math.sin(q)*r):c.moveTo(x+Math.cos(q)*r,y+Math.sin(q)*r);}c.closePath();c.fillStyle=rgba(fill,.3);c.fill();c.strokeStyle=fill;c.lineWidth=3;c.stroke();c.restore();}
function bolt(c,x,y,s,a=1){c.save();c.globalAlpha=a;c.beginPath();c.moveTo(x+s*.15,y-s);c.lineTo(x-s*.45,y+s*.1);c.lineTo(x-s*.02,y+s*.1);c.lineTo(x-s*.18,y+s);c.lineTo(x+s*.5,y-s*.15);c.lineTo(x+s*.05,y-s*.15);c.closePath();c.fillStyle=C.yellow;c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();c.restore();}

// ── pictures ───────────────────────────────────────────────────────────────
const PICS={};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
// Fit a picture in a box; returns where it landed, or null while it loads.
function place(c,path,bx,by,bw,bh,{alpha=1,cover=false,radius=14}={}){
  const im=pic(path);if(!im)return null;const f=cover?Math.max:Math.min,k=f(bw/im.naturalWidth,bh/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k,x=bx+(bw-w)/2,y=by+(bh-h)/2;
  c.save();if(cover){c.beginPath();c.roundRect(bx,by,bw,bh,radius);c.clip();}c.globalAlpha=alpha;c.drawImage(im,x,y,w,h);c.restore();
  return{x,y,k,map:(px,py)=>[x+px*k,y+py*k],rect:([px,py,pw,ph])=>[x+px*k,y+py*k,pw*k,ph*k]};
}
function crop(c,path,box,dst){const im=pic(path);if(!im)return;c.drawImage(im,box[0],box[1],box[2],box[3],...dst);}

function gauge(c,x,y,h,level,{label=P('相對血糖','Relative glucose'),note=null}={}){
  const lw=measure(c,label,22);text(c,label,Math.min(x+28,936-lw/2),y-14,22,C.yellow,'center');
  D.round(c,x,y,56,h,18,C.panel,C.edge);
  const lv=clamp(level),col=lv>.58?C.orange:lv<.42?C.cyan:'#d5bb55';
  D.round(c,x+4,y+h*(1-lv),48,h*lv,14,col);
  D.round(c,x-8,y+h*.42,72,h*.16,6,'rgba(74,222,128,.22)',C.green);
  const bw=measure(c,P('適當','normal'),22)+14;D.round(c,x+28-bw/2,y+h*.5-14,bw,30,10,'rgba(11,26,21,.85)',C.green);text(c,P('適當','normal'),x+28,y+h*.5+8,22,C.green,'center');
  text(c,P('高','high'),x+28,y+30,22,C.muted,'center');text(c,P('低','low'),x+28,y+h-14,22,C.muted,'center');
  if(note)wrap(c,note,x-30,y+h+36,120,22,C.white);
}
// A round zoom window that shows a crop of a picture; returns the window.
function zoomCircle(c,path,box,x,y,R){c.save();c.beginPath();c.arc(x,y,R,0,TAU);c.fillStyle='#0f241e';c.fill();c.clip();crop(c,path,box,[x-R,y-R,2*R,2*R]);c.restore();circle(c,x,y,R,null,C.yellow,4);return[x-R,y-R,2*R,2*R];}
function boxToCircle(c,b,x,y,R){c.save();c.setLineDash([7,6]);const col=rgba(C.yellow,.55);line(c,[[b[0],b[1]+b[3]],[x-R*.92,y-R*.38]],col,2);line(c,[[b[0]+b[2],b[1]+b[3]],[x+R*.92,y-R*.38]],col,2);c.restore();}

const X_DIR='assets/biology/excretion_ai_1019/',T_DIR='assets/biology/temperature_ai_1018/',R_DIR='assets/biology/respiration_ai_1019/',E_DIR='assets/biology/endocrine_ai_1018/';
const BODY={resp:T_DIR+'body_respiratory.png',uri:T_DIR+'body_urinary.png',dig:T_DIR+'body_digestive.png'},SKIN=T_DIR+'skin_section.png';
// Substance symbols: urine amber, urea lavender, ammonia violet with three hydrogens, uric acid chalk-white crystals.
const URINE='#f5c542',UREA='#c4b5fd',NH3='#a78bfa',BROWN='#8b5a2b';
const O2=(c,x,y,s=5,a=1)=>{c.save();c.globalAlpha=a;D.oxygen(c,x,y,s);c.restore();};
const CO2=(c,x,y,s=4,a=1)=>{c.save();c.globalAlpha=a;D.co2(c,x,y,s);c.restore();};
const H2O=(c,x,y,s=8,a=1)=>{c.save();c.globalAlpha=a;D.water(c,x,y,s);c.restore();};
function urea(c,x,y,a=1){c.save();c.globalAlpha=a;D.round(c,x-9,y-6,18,12,6,UREA,C.ink);c.restore();}
function ammonia(c,x,y,a=1){c.save();c.globalAlpha=a;for(const q of [-.5,1.6,3.7]){circle(c,x+Math.cos(q)*8,y+Math.sin(q)*8,3.6,C.white,C.ink,1);}circle(c,x,y,6.5,NH3,C.ink,1.5);c.restore();}
function uric(c,x,y,a=1){c.save();c.globalAlpha=a;for(const [dx,dy,r] of [[-5,2,5.5],[4,3,5],[0,-4,5]])circle(c,x+dx,y+dy,r,'#fffaf0','#8a8170',1.5);c.restore();}
function salt(c,x,y,a=1){c.save();c.globalAlpha=a;D.sphere(c,x,y,5,C.orange);c.restore();}
function drop(c,x,y,r,color=URINE,a=1){c.save();c.globalAlpha=a;c.beginPath();c.moveTo(x,y-r*1.6);c.bezierCurveTo(x+r*1.1,y-r*.4,x+r,y+r,x,y+r);c.bezierCurveTo(x-r,y+r,x-r*1.1,y-r*.4,x,y-r*1.6);c.fillStyle=color;c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();circle(c,x-r*.3,y-r*.2,r*.25,'rgba(255,255,255,.7)');c.restore();}
function pellet(c,x,y,a=1){c.save();c.globalAlpha=a;ellipse(c,x,y,9,6,BROWN,'#3f2a15',1.5);c.restore();}
// Draw a whole-body cut-out at height h; returns a mapper from picture pixels.
function bodyPic(c,file,x,y,h){const im=pic(file);if(!im)return null;const k=h/im.naturalHeight,w=im.naturalWidth*k;c.drawImage(im,x,y,w,h);return{k,w,map:(px,py)=>[x+px*k,y+py*k],rect:([px,py,pw,ph])=>[x+px*k,y+py*k,pw*k,ph*k]};}
function zoomIn(c,file,box,from,area,z,maxK=4){const {k,r:to}=zoomRect(box,area,maxK),cur=lerpRect(from,to,z);connectors(c,from,cur,.5);crop(c,file,box,cur);c.save();c.strokeStyle=rgba(C.yellow,.85);c.lineWidth=3;c.strokeRect(...cur);c.restore();return{k,to,done:z>.98,zm:(px,py)=>[to[0]+(px-box[0])*k,to[1]+(py-box[1])*k]};}
function flowAlong(c,path,t,n,speed,draw,{fade=true}={}){for(let i=0;i<n;i++){const u=mod(t*speed+i/n),[x,y]=along(path,u);draw(x,y,fade?(u<.06?u/.06:u>.94?(1-u)/.06:1):1,i);}}

// Paths in body-picture pixels (the three body pictures share one mannequin, about 440×1105).
const LUNG_TO_NOSE_L=[[172,318],[192,290],[215,268],[214,180],[212,100],[196,92]],LUNG_TO_NOSE_R=[[262,318],[240,290],[215,268],[214,180],[212,100],[196,92]];
const URINE_L=[[190,395],[202,410],[200,455],[197,500],[215,516]],URINE_R=[[266,380],[252,398],[255,455],[252,500],[238,516]],URETHRA=[[228,528],[227,550],[226,572]];
const COLON=[[160,540],[160,420],[220,412],[290,420],[292,530],[260,548],[225,552],[218,600]];
const SWEAT_DUCT=[[265,410],[262,330],[256,230],[250,150]];

// ── Tab 1: excretion or egestion? Sort by where the material came from ─────
const WASTE=[
 {id:'co2',name:P('呼出二氧化碳','Exhaled carbon dioxide'),body:BODY.resp,area:[120,60,190,300],kind:'ex',title:P('排泄：代謝後產生','Excretion: produced by metabolism'),origin:P('細胞呼吸產生','Made by cellular respiration'),exit:P('由肺呼出','Breathed out by the lungs'),text:P('細胞呼吸產生二氧化碳，由血液運到肺，再經呼氣排出。呼吸系統能交換氣體，也能排出代謝廢物；不是只有尿液才屬排泄。','Cellular respiration produces CO₂, which blood carries to lungs for exhalation. The respiratory system both exchanges gases and removes metabolic waste; excretion is not restricted to urine.')},
 {id:'urea',name:P('尿液中的尿素','Urea in urine'),body:BODY.uri,area:[150,320,160,260],kind:'ex',title:P('排泄：含氮代謝廢物','Excretion: nitrogenous waste'),origin:P('蛋白質代謝產生','Made from protein metabolism'),exit:P('腎臟形成尿液排出','Kidneys remove it in urine'),text:P('蛋白質代謝可產生氨，人體在肝臟轉成毒性較低的尿素，再經循環到腎臟，隨尿液排出。腎臟負責形成尿液，膀胱只暫存尿液。','Protein metabolism can produce ammonia. The human liver converts it to less toxic urea; blood carries urea to kidneys for urinary removal. Kidneys make urine; the bladder stores it.')},
 {id:'sweat',name:P('汗液排出','Sweat loss'),body:BODY.resp,area:[20,430,110,140],zoom:SKIN,kind:'ex',title:P('排泄與散熱相連','Excretion and heat loss are linked'),origin:P('水、鹽和少量尿素','Water, salts, a little urea'),exit:P('由汗腺經皮膚排出','Out through sweat glands in the skin'),text:P('汗液主要是水，也含鹽類和少量尿素。汗液排出與蒸發散熱有關，但汗腺不是主要排尿素的器官；排泄與水分、體溫調節需要合作。','Sweat is mainly water with salts and a little urea. Sweating connects excretion with evaporative heat loss, but sweat glands are not the main urea-removal organs. Water and temperature regulation cooperate.')},
 {id:'faeces',name:P('未吸收殘渣排出','Unabsorbed food residue'),body:BODY.dig,area:[130,390,190,230],kind:'eg',title:P('排遺：沒有吸收的殘渣','Egestion: unabsorbed residue'),origin:P('沒有被吸收的食物','Food that was never absorbed'),exit:P('由肛門排出','Out through the anus'),text:P('未被吸收的食物殘渣由肛門排出，稱為排遺。分類看物質的來源，不是只看是否離開身體。鳥類糞便中的尿酸是代謝廢物，雖和糞便同時排出，仍屬排泄。','Unabsorbed food residue leaving through the anus is egestion. Classify by origin, not merely departure from the body. A bird’s uric acid is metabolic waste and remains excretion even when discharged with faeces.')}
];
const WASTE_ANIM={
 co2(c,zm,t){for(const p of [LUNG_TO_NOSE_L,LUNG_TO_NOSE_R])flowAlong(c,p,t,6,.14,(x0,y0,a)=>{const [x,y]=zm(x0,y0);CO2(c,x,y,5,a);});},
 urea(c,zm,t){for(const p of [URINE_L,URINE_R])flowAlong(c,p,t,5,.18,(x0,y0,a,i)=>{const [x,y]=zm(x0,y0);drop(c,x,y,7,URINE,a);if(i%2)urea(c,x+12,y,a);});flowAlong(c,URETHRA,t,2,.3,(x0,y0,a)=>{const [x,y]=zm(x0,y0);drop(c,x,y,7,URINE,a);});},
 sweat(c,zm,t){flowAlong(c,SWEAT_DUCT,t,5,.2,(x0,y0,a,i)=>{const [x,y]=zm(x0,y0);[()=>H2O(c,x,y,8,a),()=>salt(c,x,y,a),()=>H2O(c,x,y,8,a),()=>urea(c,x,y,a),()=>H2O(c,x,y,8,a)][i]();});
  const [px,py]=zm(250,140),g=mod(t*.4);drop(c,px,py-8-g*10,mix(6,16,g),'rgba(125,211,252,.9)',1-g*.3);},
 faeces(c,zm,t){flowAlong(c,COLON,t,7,.08,(x0,y0,a)=>{const [x,y]=zm(x0,y0);pellet(c,x,y,a);});}
};
function drawWaste(c,s,t){
  const q=WASTE.find(o=>o.id===s.case)||WASTE[0],tt=Math.max(0,t-s.start),z=ease(tt/.9);
  panel(c,20,20,230,560);
  const b=bodyPic(c,q.body,36,34,508);text(c,P('全身位置','Body view'),135,570,22,C.muted,'center');
  panel(c,270,20,670,380);
  text(c,q.name,290,58,26,C.yellow);
  if(b){const from=b.rect(q.area);dashedBox(c,from);
    if(q.zoom){const im=pic(q.zoom);const area=[290,74,420,312];if(im){const {r:to}=zoomRect([0,0,im.naturalWidth,im.naturalHeight],area,2),cur=lerpRect(from,to,z);connectors(c,from,cur,.5);c.save();c.globalAlpha=clamp(z*1.4);c.drawImage(im,...cur);c.restore();
      if(z>.98){const k=to[2]/im.naturalWidth,zm=(px,py)=>[to[0]+px*k,to[1]+py*k];WASTE_ANIM.sweat(c,zm,t);pill(c,P('汗腺','Sweat gland'),300,330,{anchor:zm(265,410),color:C.cyan,maxX:700});}}}
    else{const Z=zoomIn(c,q.body,q.area,from,[290,74,420,312],z);if(Z.done)WASTE_ANIM[q.id](c,Z.zm,t);}}
  // origin and exit
  node(c,q.origin,724,96,200,92,false);arrow(c,824,196,824,222,C.yellow,4);node(c,q.exit,724,230,200,92,false);
  text(c,P('從哪裡來？','Where from?'),824,86,22,C.muted,'center');
  // sorting bins
  const bins=[['ex',P('排泄','Excretion'),P('細胞代謝產生的廢物','Waste made by cell metabolism'),C.cyan],['eg',P('排遺','Egestion'),P('沒有被吸收的食物殘渣','Food residue never absorbed'),'#d4a373']];
  bins.forEach(([kind,name,sub,col],i)=>{const x=270+i*340,on=q.kind===kind;D.round(c,x,416,330,164,16,on?rgba(col,.16):'rgba(11,26,21,.5)',on?col:C.edge);
    text(c,name,x+165,454,30,on?col:C.muted,'center');wrap(c,sub,x+20,488,290,22,on?C.white:C.muted);});
  const tgt=q.kind==='ex'?[435,548]:[775,548],u=clamp((tt-1)/1.2),src0=[600,392],p=[mix(src0[0],tgt[0],ease(u)),mix(src0[1],tgt[1],ease(u))-Math.sin(u*Math.PI)*40];
  if(u>0){const draw={co2:()=>CO2(c,p[0],p[1],6),urea:()=>urea(c,p[0],p[1]),sweat:()=>drop(c,p[0],p[1],10,'rgba(125,211,252,.9)'),faeces:()=>pellet(c,p[0],p[1])}[q.id];draw();}
  if(u>=1)pill(c,q.kind==='ex'?P('✓ 排泄','✓ Excretion'):P('✓ 排遺','✓ Egestion'),q.kind==='ex'?360:700,530,{active:true,color:q.kind==='ex'?C.cyan:'#d4a373'});
}

// ── Tab 2: three forms of nitrogenous waste ───────────────────────────────
const NITROGEN=[
 {id:'ammonia',name:P('草履蟲：氨','Paramecium: ammonia'),file:X_DIR+'paramecium.png',box:[1150,150,220,260],output:P('氨直接向周圍水中擴散','Ammonia diffuses into surrounding water'),text:P('水生單細胞生物可把氨向周圍水中擴散。氨毒性較高，排出時需要較多水；不能把「直接排氨」當成所有陸生動物的方式。圖片是 AI 教學插圖，螢幕上的大小不是實物大小。','An aquatic unicellular organism can diffuse ammonia into water. Ammonia is relatively toxic and its removal requires more water; this is not the method of every terrestrial animal. The picture is an AI illustration; screen size is not real size.')},
 {id:'urea',name:P('哺乳類：尿素','Mammals: urea'),file:BODY.uri,crop:[60,240,320,400],output:P('肝臟轉成尿素，隨尿液排出','Liver converts to urea; removed in urine'),text:P('人和其他哺乳類一樣：氨先轉成毒性較低的尿素，主要混在尿液中排出。轉變在肝臟，形成尿液在腎臟，不能把這兩項工作都交給膀胱。','Humans, like other mammals, convert ammonia to less toxic urea, mainly removed in urine. Conversion occurs in the liver and urine formation in kidneys, not both in the bladder.')},
 {id:'uric',name:P('鳥類：尿酸','Birds: uric acid'),file:X_DIR+'pigeon_ledge.jpg',cover:true,output:P('尿酸與糞便一起排出，較省水','Uric acid leaves with faeces, saving water'),text:P('鳥類與多數昆蟲主要排尿酸，排出時所需水較少，但合成也需能量。尿酸來自代謝，和未吸收的食物殘渣不是同一種東西；兩者可以同時離開身體。','Birds and many insects mainly remove uric acid, using less water but spending energy on its formation. Metabolic uric acid and unabsorbed food residue have different origins, even when discharged together.')}
];
function chainBox(c,x,y,w,h,p,draw){D.round(c,x,y,w,h,12,'rgba(11,26,21,.6)',C.edge);if(draw)draw(x,y,w,h);text(c,p,x+w/2,y+h-12,22,C.white,'center');}
function drawNitrogen(c,s,t){
  const q=NITROGEN.find(o=>o.id===s.animal)||NITROGEN[0],i=NITROGEN.indexOf(q);
  panel(c,20,20,440,370);
  let f=null;if(q.crop){const im=pic(q.file);if(im){const k=Math.min(420/q.crop[2],350/q.crop[3]),w=q.crop[2]*k,h=q.crop[3]*k;crop(c,q.file,q.crop,[30+(420-w)/2,30+(350-h)/2,w,h]);}}
  else f=place(c,q.file,30,30,420,350,{cover:!!q.cover});
  panel(c,480,20,460,370);text(c,q.output,710,58,22,C.yellow,'center');
  const R=[496,74,428,300];
  if(q.id==='ammonia'){
    if(f){const b=f.rect(q.box);dashedBox(c,b);connectors(c,b,R,.45);}
    c.save();c.beginPath();c.roundRect(...R,12);c.clip();c.fillStyle='#0d3442';c.fillRect(...R);
    c.beginPath();c.ellipse(R[0]-60,R[1]+150,250,220,0,0,TAU);c.fillStyle='#a9cfd8';c.fill();c.lineWidth=10;c.strokeStyle='#5f8f9b';c.stroke();
    for(let k=0;k<18;k++){const x=R[0]+230+(k*61)%190,y=R[1]+20+(k*43)%260;H2O(c,x+Math.sin(t+k)*4,y,8,.75);}
    for(let k=0;k<9;k++){const u=mod(t*.16+k/9),y=R[1]+40+(k*31)%220,x=mix(R[0]+40,R[0]+420,u);ammonia(c,x,y+Math.sin(t*2+k)*6,u>.85?(1-u)/.15:1);}
    c.restore();D.round(c,...R,12,null,rgba(C.yellow,.8));
    pill(c,P('細胞內','Inside the cell'),R[0]+10,R[1]+10,{color:C.white,maxX:940});
    pill(c,P('周圍大量的水','Plenty of water around'),R[0]+R[2]-230,R[1]+R[3]-50,{color:C.cyan,maxX:932});
  }else{
    const uricCase=q.id==='uric';
    chainBox(c,R[0],R[1],120,120,P('細胞','Cells'),(x,y)=>{ellipse(c,x+60,y+48,40,30,'#1f4a3d','#9fd8b8',3);});
    chainBox(c,R[0]+154,R[1],120,120,P('肝臟','Liver'),(x,y,w)=>{const im=pic(E_DIR+'liver_pancreas.png');if(im)c.drawImage(im,150,50,560,400,x+8,y+8,w-16,80);});
    chainBox(c,R[0]+308,R[1],120,120,uricCase?P('排出','Out'):P('腎臟','Kidney'),(x,y,w)=>{if(uricCase){uric(c,x+48,y+48);pellet(c,x+74,y+52);}else{const im=pic(X_DIR+'kidney_section.png');if(im)c.drawImage(im,x+30,y+6,60,80);}});
    arrow(c,R[0]+122,R[1]+50,R[0]+150,R[1]+50,C.yellow,4);arrow(c,R[0]+276,R[1]+50,R[0]+304,R[1]+50,C.yellow,4);
    const path=[[R[0]+60,R[1]+48],[R[0]+214,R[1]+48],[R[0]+368,R[1]+48]];
    for(let k=0;k<4;k++){const u=mod(t*.18+k/4),[x]=along(path,u),y2=R[1]+142;if(u<.5)ammonia(c,x,y2);else if(uricCase)uric(c,x,y2);else urea(c,x,y2);}
    line(c,[[R[0]+20,R[1]+158],[R[0]+408,R[1]+158]],rgba(C.muted,.4),2);
    if(!uricCase){flowAlong(c,[[R[0]+368,R[1]+172],[R[0]+368,R[1]+270]],t,3,.4,(x,y,a)=>drop(c,x,y,10,URINE,a));pill(c,P('尿液','Urine'),R[0]+250,R[1]+250,{color:URINE,maxX:932});}
    else{drop(c,R[0]+368,R[1]+200,6,'rgba(125,211,252,.9)');pill(c,P('只需要很少的水','Very little water needed'),R[0]+190,R[1]+240,{color:C.cyan,maxX:932});}
    pill(c,uricCase?P('氨 → 尿酸','Ammonia → uric acid'):P('氨 → 尿素','Ammonia → urea'),R[0]+20,R[1]+186,{active:true,color:uricCase?C.white:UREA,maxX:R[0]+300});
  }
  // qualitative comparison of the three forms
  panel(c,20,406,920,174);
  const cols=[[P('氨','Ammonia'),(x,y)=>ammonia(c,x,y),3,3,P('水生生物','Aquatic animals')],[P('尿素','Urea'),(x,y)=>urea(c,x,y),2,2,P('哺乳類','Mammals')],[P('尿酸','Uric acid'),(x,y)=>uric(c,x,y),1,1,P('鳥類、多數昆蟲','Birds, most insects')]];
  text(c,P('毒性','Toxicity'),40,486,22,C.muted);text(c,P('排出需要的水','Water needed'),40,530,22,C.muted);
  cols.forEach(([name,icon,tox,water,eg],k)=>{const x=250+k*228,on=k===i;D.round(c,x,418,214,152,12,on?'rgba(253,224,71,.12)':'rgba(11,26,21,.4)',on?C.yellow:C.edge);
    icon(x+30,446);text(c,name,x+52,454,24,on?C.yellow:C.white);
    for(let j=0;j<3;j++){D.round(c,x+20+j*58,472,50,20,6,j<tox?C.orange:'#0f241e',C.edge);D.round(c,x+20+j*58,516,50,20,6,j<water?C.cyan:'#0f241e',C.edge);}
    text(c,eg,x+107,562,22,on?C.white:C.muted,'center');});
  text(c,P('定性比較','qualitative'),236,454,22,C.muted,'right');
}

// ── Tab 3: urinary organs, pulled out of the body ──────────────────────────
const ORGANS=[
 {id:'kidney',name:P('腎臟','Kidneys'),box:[160,330,135,100],role:P('形成尿液','Makes urine'),text:P('腎臟左右各一，位於腹腔背側、脊柱兩旁。血液流經時，腎臟過濾血液並再吸收所需物質，將尿素及多餘水、鹽等形成尿液。右邊是腎臟縱切面：血液由腎動脈進、腎靜脈出，尿液則從腎盂流進輸尿管，兩條路線不同。','Paired kidneys lie posteriorly beside the spine. They filter blood and reabsorb needed materials, forming urine containing urea and excess water/salts. The section shows blood entering by the renal artery and leaving by the renal vein, while urine drains from the renal pelvis into the ureter: two different routes.')},
 {id:'ureter',name:P('輸尿管','Ureters'),box:[180,395,95,125],role:P('輸送尿液','Carries urine'),text:P('左右輸尿管是腎臟連到膀胱的細管，輸送已形成的尿液。腎臟旁的粗血管不屬輸尿管；別只憑「往下的一條管」判斷。','The two thin ureters connect kidneys to bladder and transport formed urine. The large vessels beside the kidneys are not ureters. A downward tube is not enough evidence to name it.')},
 {id:'bladder',name:P('膀胱','Bladder'),box:[190,490,75,55],role:P('暫時儲存尿液','Stores urine'),text:P('膀胱位於骨盆內，暫時儲存尿液。它不是把血液變成尿液的過濾器。排尿時膀胱收縮，尿液經尿道離開；本圖不用固定個人尿量推測健康。','The bladder lies in the pelvis and stores urine. It does not filter blood to make urine. During urination it contracts and urine leaves through the urethra; no personal volume is used to infer health.')},
 {id:'urethra',name:P('尿道','Urethra'),box:[205,525,45,55],role:P('排出體外','Leads out of the body'),text:P('尿道是膀胱通到體外的出口，與腎臟到膀胱的輸尿管不同。','The urethra is the bladder’s outlet to the exterior, distinct from ureters between kidneys and bladder.')}
];
// kidney_section.png is 852×1040
const K_ART=[[845,405],[700,395],[560,405],[440,385],[350,380]],K_VEIN=[[410,470],[520,480],[650,470],[830,460]];
const K_URINE=[[[300,300],[350,420],[430,560],[505,680],[525,1010]],[[230,480],[340,500],[450,600],[510,700],[528,1010]],[[300,650],[380,600],[470,620],[515,720],[530,1010]]];
function bladderFill(c,zm,k,level){const [x,y]=zm(228,519),rx=26*k,ry=17*k;c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.clip();c.fillStyle=rgba(URINE,.42);c.fillRect(x-rx,y+ry-2*ry*level,2*rx,2*ry*level);c.restore();}
function drawUrinary(c,s,t){
  const q=ORGANS.find(o=>o.id===s.organ)||ORGANS[0],tt=Math.max(0,t-s.start),z=ease(tt/.9);
  panel(c,20,20,250,560);
  const b=bodyPic(c,BODY.uri,30,36,540);
  if(b){[...ORGANS].reverse().forEach(o=>{const r=b.rect(o.box);D.hit(...r,'organ',o.id);});
    flowAlong(c,URINE_L,t,3,.18,(x0,y0,a)=>{const [x,y]=b.map(x0,y0);drop(c,x,y,4,URINE,a);});flowAlong(c,URINE_R,t,3,.18,(x0,y0,a)=>{const [x,y]=b.map(x0,y0);drop(c,x,y,4,URINE,a);});}
  panel(c,290,20,650,560);
  text(c,q.name,310,60,28,C.yellow);text(c,q.role,920,60,24,C.cyan,'right');
  if(!b)return;
  const from=b.rect(q.box);dashedBox(c,from);
  if(q.id==='kidney'){
    const im=pic(X_DIR+'kidney_section.png');if(!im)return;const {r:to}=zoomRect([0,0,852,1040],[310,80,420,420],1),cur=lerpRect(from,to,z);connectors(c,from,cur,.5);c.save();c.globalAlpha=clamp(z*1.3);c.drawImage(im,...cur);c.restore();
    if(z>.98){const k=to[2]/852,zm=(px,py)=>[to[0]+px*k,to[1]+py*k];
      flowAlong(c,K_ART,t,6,.25,(x0,y0,a)=>{const [x,y]=zm(x0,y0);rbc(c,x,y,8,1);});
      flowAlong(c,K_VEIN,t,6,.25,(x0,y0,a)=>{const [x,y]=zm(x0,y0);rbc(c,x,y,8,.25);});
      K_URINE.forEach((p,j)=>flowAlong(c,p,t+j*.7,4,.1,(x0,y0,a)=>{const [x,y]=zm(x0,y0);drop(c,x,y,6,URINE,a);}));
      pill(c,P('腎動脈：血液進來','Renal artery: blood in'),640,150,{anchor:zm(700,397),color:'#ff8a8f',maxX:932});
      pill(c,P('腎靜脈：血液回去','Renal vein: blood out'),640,300,{anchor:zm(700,468),color:'#93c5fd',maxX:932});
      pill(c,P('尿液 → 輸尿管','Urine → ureter'),640,470,{anchor:zm(525,850),color:URINE,maxX:932});
      pill(c,P('腎盂：尿液匯集','Renal pelvis: urine collects'),640,380,{anchor:zm(380,520),color:C.white,maxX:932});}
  }else{
    const Z=zoomIn(c,BODY.uri,q.box,from,[310,80,610,420],z,6);
    if(Z.done){const zm=Z.zm;c.save();c.beginPath();c.rect(...Z.to);c.clip();
      if(q.id==='ureter'){for(const p of [URINE_L,URINE_R])flowAlong(c,p,t,6,.14,(x0,y0,a)=>{const [x,y]=zm(x0,y0);drop(c,x,y,9,URINE,a);});}
      if(q.id==='bladder'){const lv=.25+.65*mod(t*.08);bladderFill(c,zm,Z.k,lv);for(const p of [URINE_L,URINE_R])flowAlong(c,p.slice(2),t,3,.25,(x0,y0,a)=>{const [x,y]=zm(x0,y0);drop(c,x,y,9,URINE,a);});}
      if(q.id==='urethra'){flowAlong(c,URETHRA,t,4,.3,(x0,y0,a)=>{const [x,y]=zm(x0,y0);drop(c,x,y,10,URINE,a);});}
      c.restore();}
  }
  // route strip
  const names=ORGANS.map(o=>o.name),cur=ORGANS.indexOf(q);
  const sx=310,sy=560-10;let x=sx;names.forEach((p,i)=>{const w=measure(c,p,22)+24;D.round(c,x,sy-30,w,38,12,i===cur?C.yellow:'rgba(11,26,21,.75)',i===cur?C.white:C.edge);text(c,p,x+w/2,sy-4,22,i===cur?C.deep:C.white,'center');x+=w;if(i<3){arrow(c,x+4,sy-11,x+24,sy-11,URINE,3.5);x+=30;}});
}

// ── Tab 4: filter first, then recover (picture shows the look; the model shows the work) ─
const NEPH=X_DIR+'nephron.png';
const SOLUTES={
 water:{name:P('水','Water'),draw:(c,x,y,a)=>H2O(c,x,y,8,a),text:P('水可被濾出，也可再吸收回血液。身體需要保留的水回收，多餘的水隨尿液離開；腎臟不是把所有水都丟掉。路徑數量僅示意，沒有固定回收百分比。','Water can be filtered and reabsorbed. Needed water returns to blood and excess water leaves in urine. Path counts are schematic, not fixed recovery percentages.')},
 salt:{name:P('鹽類','Salts'),draw:(c,x,y,a)=>salt(c,x,y,a),text:P('鹽類也是身體需要的成分；過濾後可調節再吸收，保留需要的部分、排出多餘的部分。不能把「在尿液裡出現」直接等同於它對身體永遠沒用。','Salts are needed by the body. After filtration, reabsorption helps retain needed amounts and remove excess. Presence in urine does not mean a substance is always useless.')},
 glucose:{name:P('葡萄糖','Glucose'),draw:(c,x,y,a)=>hexagon(c,x,y,9,C.yellow,a),text:P('葡萄糖是養分，正常情況下被濾出的葡萄糖會再吸收回血液，不是必須全部丟入尿液的代謝廢物。本模型不拿尿糖診斷個人疾病。','Glucose is a nutrient. Normally, filtered glucose is reabsorbed into blood rather than discarded as metabolic waste. This model does not use urine glucose to diagnose anyone.')},
 urea:{name:P('尿素','Urea'),draw:(c,x,y,a)=>urea(c,x,y,a),text:P('尿素由肝臟將氨轉變而來，血液把它送到腎臟，最後可隨尿液排出。示意突出淨排除途徑，不宣稱每一個尿素分子都絕不再吸收，也不包含全部腎單位機制。','Urea is formed from ammonia in the liver and carried to kidneys for urinary removal. The display emphasises net removal; it does not claim every urea molecule is never reabsorbed or include every nephron mechanism.')}
};
const G=[470,206],BLOOD=[[372,110],[452,118],[462,170],[470,206],[480,170],[492,120],[560,104],[600,214],[930,214]];
const TUB=[[470,222],[506,242],[530,300],[876,300],[876,566]];
function glomerulus(c,x,y,t){for(let i=0;i<7;i++){const a=i*TAU/7+.3;ellipse(c,x+Math.cos(a)*14,y+Math.sin(a)*12,14,9,'#b73a4a','#ef8a95',2,a);}circle(c,x,y,10,'#b73a4a','#ef8a95',2);}
function drawKidney(c,s,t){
  const S=SOLUTES[s.solute],showReturn=s.stage!=='filter'&&s.solute!=='urea',showUrine=s.stage!=='filter'&&s.solute!=='glucose';
  // left: the kidney, then one nephron from it
  panel(c,20,20,320,560);
  text(c,P('腎臟縱切面','Kidney section'),36,50,22,C.muted);
  const k1=place(c,X_DIR+'kidney_section.png',90,58,180,220);
  text(c,P('其中一個腎元','One nephron'),36,306,22,C.muted);
  const k2=place(c,NEPH,34,316,292,242);
  if(k1&&k2){const a=k1.rect([40,300,250,250]);dashedBox(c,a,C.yellow,2.5);connectors(c,a,[k2.x,k2.y,1295*k2.k,1074*k2.k],.45);
    pill(c,P('腎絲球','Glomerulus'),40,466,{anchor:k2.map(205,215),color:'#ff8a8f',maxX:330});
    pill(c,P('腎小管','Tubule'),150,330,{anchor:k2.map(470,250),color:URINE,maxX:330});
    pill(c,P('集尿管','Collecting duct'),170,520,{anchor:k2.map(1200,700),color:C.white,maxX:330});}
  // right: the working model
  panel(c,360,20,580,560);
  // capsule (cup) around the glomerulus
  c.save();c.lineCap='round';c.beginPath();c.arc(G[0],G[1],58,-Math.PI*.38,-Math.PI*.62+TAU);c.lineWidth=16;c.strokeStyle='#e9ce85';c.stroke();c.lineWidth=2;c.strokeStyle='#9a8455';c.beginPath();c.arc(G[0],G[1],66,-Math.PI*.38,-Math.PI*.62+TAU);c.stroke();c.restore();
  ellipse(c,G[0],G[1],48,48,'rgba(233,206,133,.22)');
  // tubule
  c.save();c.lineCap='round';c.lineJoin='round';line(c,TUB,'#9a8455',34);line(c,TUB,'#e9ce85',28);line(c,TUB,'rgba(255,248,220,.7)',18);c.restore();
  // blood: in through the glomerulus, out along the capillary beside the tubule
  c.save();c.lineCap='round';c.lineJoin='round';line(c,BLOOD,'#d98c93',26);line(c,BLOOD,'#5c2029',20);c.restore();
  glomerulus(c,...G,t);
  flowAlong(c,BLOOD,t,10,.07,(x,y,a,i)=>{if(i===4){c.save();c.globalAlpha=a;circle(c,x,y,10,'#f8fafc','#94a3b8',2);c.restore();}else rbc(c,x,y,8,i%3?.9:.5);});
  // filtration: small substances leave the glomerulus into the capsule and tubule
  flowAlong(c,TUB.slice(0,3),t,4,.35,(x,y,a)=>S.draw(c,x,y,a));
  if(showReturn)for(let i=0;i<5;i++){const u=mod(t*.22+i/5),x0=590+i*56,path=[[x0-60,300],[x0,300],[x0+6,214],[930,214]],[x,y]=along(path,u);S.draw(c,x,y,u>.94?(1-u)/.06:1);
    if(i===2)arrow(c,x0+30,284,x0+30,236,C.green,4);}
  if(showUrine)flowAlong(c,TUB.slice(2),t,6,.13,(x,y,a)=>S.draw(c,x,y,a));
  if(s.stage==='filter'){c.save();c.globalAlpha=.85;D.round(c,600,330,300,40,10,'rgba(11,26,21,.7)',C.edge);c.restore();text(c,P('先看到這裡：濾出液','Filtrate so far'),750,358,22,C.white,'center');}
  pill(c,P('腎絲球：過濾','Glomerulus: filtering'),376,334,{anchor:[G[0]-10,G[1]+10],color:'#ff8a8f',maxX:600});
  pill(c,P('鮑氏囊','Capsule'),376,44,{anchor:[G[0]-50,G[1]-34],color:'#e9ce85',maxX:600});
  pill(c,P('微血管：回收到血液','Capillary: back to blood'),640,150,{anchor:[700,214],color:C.green,maxX:932});
  pill(c,P('腎小管','Tubule'),620,318,{anchor:[700,300],color:URINE,maxX:932});
  pill(c,P('尿液','Urine'),760,520,{anchor:[876,540],color:URINE,maxX:870});
  wrap(c,P('紅血球和大分子蛋白質留在血液中，不會濾出。','Red cells and large proteins stay in the blood, unfiltered'),380,418,360,22,C.white);
  legendRow(c,[[(x,y)=>S.draw(c,x,y,1),P('正在追蹤：','Tracking: ')]],380,566);text(c,S.name,380+30+measure(c,P('正在追蹤：','Tracking: '),22)+4,566,22,C.yellow);
  if(!showReturn&&s.stage!=='filter')pill(c,P('尿素：不回收，隨尿液排出','Urea: not recovered, leaves in urine'),380,470,{active:true,color:UREA,maxX:860});
  if(!showUrine&&s.stage!=='filter')pill(c,P('葡萄糖：全部回收，正常尿液沒有','Glucose: all recovered; none in normal urine'),380,470,{active:true,color:C.yellow,maxX:860});
}

// ── Tab 5: water balance — the body fills or drains toward a suitable level ─
let FILL=null;
function bodyWater(c,file,x,y,h,level,t){
  const im=pic(file);if(!im)return null;const k=h/im.naturalHeight,w=Math.ceil(im.naturalWidth*k);
  if(!FILL)FILL=document.createElement('canvas');FILL.width=w;FILL.height=Math.ceil(h);const o=FILL.getContext('2d');
  o.clearRect(0,0,w,h);o.drawImage(im,0,0,w,h);o.globalCompositeOperation='source-atop';
  const top=h*(1-.86*level)-h*.02;o.beginPath();o.moveTo(0,h);for(let i=0;i<=40;i++){const xx=w*i/40;o.lineTo(xx,top+Math.sin(i*.6+t*2.4)*4);}o.lineTo(w,h);o.closePath();o.fillStyle='rgba(56,189,248,.42)';o.fill();
  o.globalCompositeOperation='source-over';c.drawImage(FILL,x,y);return{k,map:(px,py)=>[x+px*k,y+py*k]};
}
function cup(c,x,y){c.beginPath();c.moveTo(x-22,y-30);c.lineTo(x+22,y-30);c.lineTo(x+16,y+28);c.lineTo(x-16,y+28);c.closePath();c.fillStyle='rgba(220,240,255,.12)';c.fill();c.strokeStyle='rgba(220,240,255,.9)';c.lineWidth=3;c.stroke();c.fillStyle='rgba(56,189,248,.55)';c.fillRect(x-18,y-12,36,38);}
function drawWater(c,s,t){
  const low=s.balance==='low',high=s.balance==='high',u=Math.max(0,t-(s.changedAt||0)),level=.55+(low?-.24:high?.24:0)*Math.exp(-u*.22);
  panel(c,20,20,300,560);
  const b=bodyWater(c,BODY.uri,70,30,516,level,t);
  text(c,P('體內水分','Body water'),170,570,22,C.cyan,'center');
  panel(c,340,20,600,560);
  // intake
  const thirsty=low&&level<.5;
  cup(c,400,120);text(c,P('喝水、食物','Drinks, food'),400,186,22,C.white,'center');
  if(b){const mouth=b.map(212,122),inRate=low?7:high?0:3;if(inRate)flowAlong(c,[[430,110],[mouth[0]+20,mouth[1]]],t,inRate,.35,(x,y,a)=>H2O(c,x,y,7,a));
    if(thirsty){const head=b.map(215,45);glow(c,head[0],head[1],46,C.orange,.45+.2*Math.sin(t*5));pill(c,P('好渴！','So thirsty!'),head[0]+30,head[1]-30,{active:true,color:C.orange,maxX:600});}
    // urine out
    const ure=b.map(226,575),outRate=low?1:high?7:3;flowAlong(c,[[ure[0],ure[1]],[ure[0]+4,ure[1]+60]],t,outRate,.6,(x,y,a)=>drop(c,x,y,6,URINE,a));
    for(let i=0;i<2;i++){const v=mod(t*.4+i/2),nose=b.map(212,100);H2O(c,nose[0]-10-v*60,nose[1]-v*20,6,1-v);}}
  // kidney close-up: how much urine
  const KX=480,KY=370,KR=96;zoomCircle(c,X_DIR+'kidney_section.png',[300,420,360,420],KX,KY,KR);
  const rate=low?.08:high?.5:.22;for(let i=0;i<(low?2:high?7:4);i++){const v=mod(t*rate*2+i/(low?2:high?7:4));drop(c,KX+28,KY-60+v*150,7,URINE,v>.85?(1-v)/.15:1);}
  text(c,P('腎臟','Kidney'),KX,KY+KR+30,22,C.yellow,'center');
  D.round(c,600,240,220,110,14,'rgba(11,26,21,.6)',low?C.orange:high?C.cyan:C.edge);
  text(c,P('尿液','Urine'),710,276,22,C.muted,'center');text(c,low?P('變少','Less'):high?P('變多','More'):P('一般','Usual'),710,322,32,low?C.orange:high?C.cyan:C.white,'center');
  D.round(c,600,90,220,110,14,'rgba(11,26,21,.6)',thirsty?C.orange:C.edge);
  text(c,P('口渴','Thirst'),710,126,22,C.muted,'center');text(c,thirsty?P('想喝水','Wants water'):P('不明顯','Not much'),710,172,30,thirsty?C.orange:C.white,'center');
  wrap(c,low?P('水分太少：口渴，喝水補充；腎臟少排尿，減少流失。','Too little water: thirst makes you drink, and kidneys make less urine.'):high?P('水分過多：腎臟排出較多尿液，把多餘的水排掉。','Too much water: kidneys make more urine to remove the excess.'):P('在適當範圍：攝入與排出持續平衡進行。','In range: intake and loss continue in balance.'),600,410,230,22,C.white);
  gauge(c,862,70,440,level,{label:P('體內水分','Body water')});
}

// ── Tab 6: surfaces that keep water in, and guttation that lets liquid out ─
function bounceWater(c,R,barrierY,t,n=10,escape=0){
  for(let i=0;i<n;i++){const u=mod(t*.25+i/n),x=R[0]+40+(i*83)%(R[2]-80),bottom=R[1]+R[3]-14;
    const esc=i<escape;let y;if(esc){y=mix(bottom,R[1]+10,u);}else{const v=u<.5?u/.5:(1-u)/.5;y=mix(bottom,barrierY+12,ease(v));}
    H2O(c,x+Math.sin(t*2+i)*4,y,8,esc&&u>.85?(1-u)/.15:1);}
}
const SURF_ZOOM={
 scales(c,R,t){const [x,y,w,h]=R,top=y+70;c.fillStyle='#173a30';c.fillRect(x,y,w,top-y);c.fillStyle='#5a3b2e';c.fillRect(x,top+30,w,h);
  for(let i=-1;i<22;i++){const sx=x+i*44;c.beginPath();c.moveTo(sx,top+34);c.quadraticCurveTo(sx+30,top-14,sx+62,top+10);c.lineTo(sx+60,top+34);c.closePath();c.fillStyle=i%2?'#a68a5b':'#8f7448';c.fill();c.strokeStyle='#3d2e1a';c.lineWidth=2;c.stroke();}
  bounceWater(c,R,top+30,t,12,1);
  pill(c,P('鱗片層層重疊，表面乾燥','Overlapping, dry scales'),x+12,y+12,{color:'#e8d7a8',maxX:x+w});
  pill(c,P('體內的水不容易散失','Body water is hard to lose'),x+w-330,y+h-52,{color:C.cyan,maxX:x+w});},
 insect(c,R,t){const [x,y,w,h]=R,top=y+66;c.fillStyle='#173a30';c.fillRect(x,y,w,top-y);
  c.fillStyle='rgba(220,240,255,.55)';c.fillRect(x,top,w,8);c.fillStyle='#3b2f1a';c.fillRect(x,top+8,w,34);c.fillStyle='#2f3320';c.fillRect(x,top+42,w,h);
  for(let i=0;i<20;i++)line(c,[[x+i*48,top+10],[x+i*48+20,top+40]],'rgba(120,100,60,.6)',2);
  bounceWater(c,R,top+42,t,12,1);
  pill(c,P('外骨骼表面有蠟質','A waxy layer on the exoskeleton'),x+12,y+12,{color:'#e8d7a8',maxX:x+w});
  pill(c,P('減少水分散失（氣門仍可交換氣體）','Less water loss (spiracles still exchange gas)'),x+w-520,y+h-52,{color:C.cyan,maxX:x+w});},
 bark(c,R,t){const [x,y,w,h]=R,cork=y+60,cx=x+w*.62;c.fillStyle='#173a30';c.fillRect(x,y,w,cork-y);
  for(let j=0;j<3;j++)for(let i=0;i<26;i++){const bx=x+i*36+(j%2?18:0);if(Math.abs(bx+15-cx)<70)continue;D.round(c,bx,cork+j*18,34,17,3,'#7c4a2c','#4a2a17');}
  for(let i=0;i<10;i++){const a=i/10;circle(c,cx-56+a*112+(i%2)*8,cork+12+(i%3)*14,11,'#d6b98c','#8a6a40',2);}
  c.fillStyle='#2c3f26';c.fillRect(x,cork+54,w,h);
  bounceWater(c,R,cork+54,t,10,0);
  for(let i=0;i<5;i++){const u=mod(t*.2+i/5),p=along([[cx-30+i*14,y+6],[cx-6+(i%3)*6,cork+20],[cx-120+i*60,cork+110]],u);O2(c,p[0],p[1],5,u>.9?(1-u)/.1:1);}
  pill(c,P('樹皮：減少水分散失、保護莖','Bark: less water loss, protects the stem'),x+12,y+10,{color:'#e8c79a',maxX:x+w*.5});
  pill(c,P('皮孔：仍可交換氣體','Lenticel: gases still pass'),cx+90,y+10,{anchor:[cx,cork+6],color:C.pink,maxX:x+w});},
 cuticle(c,R,t){const [x,y,w,h]=R,top=y+56,low=y+h-40,sx=x+w*.7;c.fillStyle='#173a30';c.fillRect(x,y,w,top-y);
  c.fillStyle='rgba(220,240,255,.6)';c.fillRect(x,top,w,10);
  for(let i=0;i<24;i++)D.round(c,x+i*38,top+10,36,18,5,'#bfe3a5','#6b8f55');
  for(let i=0;i<30;i++)D.round(c,x+4+i*30,top+30,26,52,10,'#4f9b45','#2f6b2a');
  c.fillStyle='#163828';c.fillRect(x,top+84,w,low-top-84);
  for(let i=0;i<24;i++){const ex=x+i*38;if(Math.abs(ex+18-sx)<44)continue;D.round(c,ex,low,36,18,5,'#bfe3a5','#6b8f55');}
  ellipse(c,sx-22,low+9,20,13,'#22c55e','#14532d',2);ellipse(c,sx+22,low+9,20,13,'#22c55e','#14532d',2);
  for(let i=0;i<8;i++){const u=mod(t*.25+i/8),xx=x+60+i*70,v=u<.5?u/.5:(1-u)/.5;H2O(c,xx,mix(top+110,top+18,ease(v)),7);}
  for(let i=0;i<3;i++){const u=mod(t*.3+i/3);H2O(c,sx+Math.sin(t+i)*4,mix(low-30,y+h+10,u),7,u>.8?(1-u)/.2:1);}
  pill(c,P('角質層：減少水分散失','Cuticle: less water loss'),x+12,y+8,{anchor:[x+260,top+5],color:C.white,maxX:x+w});
  pill(c,P('氣孔：氣體交換與蒸散','Stoma: gas exchange, transpiration'),sx-480,low-52,{anchor:[sx-10,low+6],color:C.green,maxX:x+w});},
 guttation(c,R,t){const [x,y,w,h]=R;c.fillStyle='#173a30';c.fillRect(x,y,w,h);
  const NT=7,TW=(w-40)/NT,leaf=new Path2D();leaf.moveTo(x,y+h);leaf.lineTo(x,y+70);for(let i=0;i<NT;i++){const tx=x+20+i*TW;leaf.lineTo(tx+TW/2,y+46);leaf.lineTo(tx+TW,y+70);}leaf.lineTo(x+w,y+70);leaf.lineTo(x+w,y+h);leaf.closePath();
  c.fillStyle='#3f7a34';c.fill(leaf);c.strokeStyle='#22541c';c.lineWidth=3;c.stroke(leaf);
  const vein=[[x+40,y+h-20],[x+w-40,y+h-20]];line(c,vein,'#a3d977',8);
  for(let i=0;i<NT;i++){const tx=x+20+i*TW+TW/2,v=[[tx-40,y+h-20],[tx-10,y+120],[tx,y+50]];line(c,v,'#a3d977',5);
    flowAlong(c,v,t+i*.3,3,.35,(xx,yy,a)=>H2O(c,xx,yy,6,a));
    const g=mod(t*.3+i*.17),r=mix(4,14,g);drop(c,tx,y+44-r*.6,r,'rgba(186,230,253,.9)',g>.92?(1-g)/.08:1);}
  flowAlong(c,vein,t,8,.1,(xx,yy,a)=>H2O(c,xx,yy,6,a));
  pill(c,P('液態水從葉緣的水孔排出','Liquid water exits at the edge'),x+12,y+h-56,{color:C.cyan,maxX:x+w*.62});
  pill(c,P('不是露水，也不是水蒸氣','Not dew, not vapour'),x+w-360,y+h-56,{active:true,color:C.orange,maxX:x+w});}
};
const SURFACES=[
 {id:'scales',name:P('蛇的鱗片','Snake scales'),file:X_DIR+'snake_scales.jpg',cover:true,box:[870,220,300,180],points:[P('鱗片重疊、表面乾燥','Overlapping, dry scales'),P('減少水分散失','Less water loss'),P('仍需要喝水補充','Still needs to drink')],text:P('鱗片與角質化表面可降低水分散失。圖片是 AI 教學插圖，不代表每片鱗片完全不透水，也不表示蛇不需要補充水分。','Scales and keratinised surfaces limit water loss. The picture is an AI illustration; scales are not perfectly impermeable and snakes still need water.')},
 {id:'insect',name:P('昆蟲外骨骼','Insect exoskeleton'),file:X_DIR+'beetle_leaf.jpg',cover:true,box:[700,200,320,180],points:[P('外骨骼＋表面蠟質','Exoskeleton + wax'),P('減少水分散失','Less water loss'),P('氣門仍可交換氣體','Spiracles still exchange gas')],text:P('昆蟲的外骨骼與表面覆蓋有助減少水分散失。體表保護和氣管交換是不同功能，需要同時理解，不能把外骨骼畫成堵住所有氣體交換的密封袋。','The exoskeleton and surface covering limit water loss. Protection and tracheal gas exchange are distinct functions; the covering is not a sealed bag blocking all gas exchange.')},
 {id:'bark',name:P('樹皮','Bark'),file:R_DIR+'lenticel_branch.png',box:[610,195,150,90],points:[P('樹皮的木栓層','Cork layers of bark'),P('減少水分散失、保護莖','Less water loss, protects'),P('皮孔仍可交換氣體','Lenticels still exchange gas')],text:P('樹皮可降低莖表面的水分散失、保護內部。木本植物也可經皮孔交換氣體，保護不等於完全沒有交換。','Bark protects stems and reduces surface water loss while lenticels allow gas exchange. Protection does not mean no exchange at all.')},
 {id:'cuticle',name:P('葉表面角質層','Leaf cuticle'),file:X_DIR+'waxy_leaf.png',box:[620,150,300,200],points:[P('葉表面的角質層','Waxy cuticle on the leaf'),P('減少水分散失','Less water loss'),P('氣孔仍可交換氣體','Stomata still exchange gas')],text:P('葉表面角質層可減少水分散失；氣孔仍是調節與交換的重要通道。圖片的光澤不能當成測得的厚度或防水百分比，也不能說所有氣孔白天必開、晚上必關。','The cuticle reduces water loss while stomata remain important exchange routes. Shine is not a thickness measurement or waterproofing percentage. Stomata are not universally open by day and closed by night.')},
 {id:'guttation',name:P('葉緣泌液','Guttation at leaf margins'),file:X_DIR+'guttation_leaf.png',box:[1180,380,220,220],points:[P('根吸水多、蒸散弱','Much root water, little transpiration'),P('液態水從葉緣水孔排出','Liquid leaves pores at the edge'),P('不是露水或水蒸氣','Not dew or vapour')],text:P('根部水分充足、蒸散較弱等條件下，植物可把液態水從葉緣或葉尖的水孔排出，稱泌液（吐水）。液滴來自植物內部，不是空氣水氣凝結形成的露水，也不是水蒸氣。','With ample root water and low transpiration, liquid may leave through hydathodes at leaf tips or margins: guttation. Drops come from inside the plant, unlike dew condensed from atmospheric water vapour; they are not vapour.')}
];
function drawSurface(c,s,t){
  const q=SURFACES.find(o=>o.id===s.surface)||SURFACES[0],tt=Math.max(0,t-s.start),z=ease(tt/.8);
  panel(c,20,20,500,270);
  const f=place(c,q.file,30,30,480,250,{cover:!!q.cover});
  const inner=[30,316,900,254];panel(c,20,306,920,274);
  if(f){const box=f.rect(q.box);dashedBox(c,box);connectors(c,box,lerpRect(box,inner,z),.55);}
  panel(c,540,20,400,270);text(c,q.name,740,58,26,C.yellow,'center');
  q.points.forEach((p,i)=>{const y=76+i*66;if(i)arrow(c,740,y-14,740,y+1,C.cyan,4);node(c,p,560,y,360,50,i===1,q.id==='guttation'?C.cyan:C.green);});
  c.save();c.beginPath();c.roundRect(...inner,12);c.clip();c.globalAlpha=z;SURF_ZOOM[q.id](c,inner,t);c.restore();
  D.round(c,...inner,12,null,rgba(C.yellow,.8));
}

const tabs=[
 {id:'waste_origin',title:P('都是排出去，一樣嗎？','All leaving, but the same?'),sub:P('排泄與排遺','Excretion and egestion'),hook:P('呼出氣體、流汗、排尿和排便，為什麼課本沒有全部叫排泄？','Why does the book not call exhalation, sweat, urine and faeces all the same process?'),body:P('選一種排出物：器官從全身圖拉出來放大，再看它是不是細胞代謝後產生，最後放進「排泄」或「排遺」。','Choose an output: its organ is pulled out of the body, then decide whether it came from cell metabolism and sort it into excretion or egestion.'),reading:P('排泄是排除代謝廢物；排遺是排出未吸收的食物殘渣。呼吸、皮膚與泌尿系統都能參與排泄，不能把所有廢物都交給腎臟。分類的關鍵是來源，不是出口：鳥類尿酸即使混在糞便中排出，仍是代謝廢物。水分、鹽類也是身體需要的成分，排出多餘部分與調節有關。想一想：哪一種排出同時連結到體溫或氣體恆定？','Excretion removes metabolic wastes; egestion removes unabsorbed food residue. Lungs, skin and urinary organs all participate in excretion. Origin, not exit, determines classification: uric acid is metabolic waste even when discharged with bird faeces. Water and salts are also needed materials; removing excess supports regulation. Which outputs connect to temperature or gas balance?'),closure:P('分類看來源：代謝廢物是排泄，未吸收殘渣是排遺。','Classify by origin: metabolic waste is excretion; unabsorbed residue is egestion.'),sources:[],init:()=>({running:true,case:'co2',start:0}),controls:()=>[choice(P('排出物','Output'),'case',WASTE.map(q=>[q.id,q.name]))],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>{const q=WASTE.find(p=>p.id===s.case)||WASTE[0];return{title:q.title,text:q.text};},draw:drawWaste},
 {id:'nitrogen',title:P('氮廢物，怎麼排？','How are nitrogen wastes removed?'),sub:P('氨、尿素與尿酸','Ammonia, urea, uric acid'),hook:P('水裡的草履蟲和陸上的哺乳類、鳥，能用完全相同的方式排氮廢物嗎？','Can a paramecium, a mammal and a bird remove nitrogen wastes in exactly the same way?'),body:P('切換三種生物，看含氮廢物的形式怎麼變，以及排出時需要多少水。','Switch between three organisms: see how the nitrogen-waste form changes and how much water its removal needs.'),reading:P('蛋白質中的胺基酸代謝可產生氨。氨、尿素、尿酸都是含氮代謝廢物；本頁依課本以水生單細胞、哺乳類、鳥類作比較，不能當成每一個物種毫無例外的規則。氨毒性較高、排出需水較多；轉成尿素或尿酸有利於不同生活環境，但也需要能量。肝臟轉換與腎臟形成尿液是不同工作。','Amino-acid metabolism can produce ammonia. Ammonia, urea and uric acid are nitrogenous wastes. The textbook compares aquatic unicellular organisms, mammals and birds, not exceptionless rules for every species. Ammonia is relatively toxic and needs more water for removal; converting it to urea or uric acid suits different environments but costs energy. Liver conversion and renal urine formation are different tasks.'),closure:P('含氮廢物形式連結生活環境、用水與轉換成本。','Nitrogen-waste form relates to environment, water use and conversion costs.'),sources:[],init:()=>({running:true,animal:'ammonia'}),controls:()=>[choice(P('生物','Organism'),'animal',NITROGEN.map(q=>[q.id,q.name]))],explain:s=>{const q=NITROGEN.find(p=>p.id===s.animal)||NITROGEN[0];return{title:q.name,text:q.text};},draw:drawNitrogen},
 {id:'urinary',title:P('尿液不是膀胱做的','The bladder does not make urine'),sub:P('泌尿器官與尿液路線','Urinary organs and the urine route'),hook:P('尿液先形成、再輸送、再儲存。哪個器官負責哪一件事？','Urine is formed, transported and stored. Which organ performs each task?'),body:P('點器官名稱或全身圖上的位置：那一段會拉出來放大，黃色水滴是尿液走的路。','Choose an organ or tap the body: that part is pulled out and enlarged. Amber drops show the urine route.'),reading:P('左右腎臟位於腹腔背側、脊柱兩旁，過濾血液並再吸收所需成分，形成尿液。輸尿管把尿送到骨盆內的膀胱暫存，尿道是通往體外的出口。血液路線與尿液路線不同：腎臟旁的粗血管不能叫輸尿管。課本的洗腎延伸是用機器協助處理血液，不是把腎臟拿出來清洗；本頁不提供醫療操作或個人診斷。','Paired posterior kidneys beside the spine filter blood and recover needed substances to make urine. Ureters carry urine to the pelvic bladder; urethra is the exit. Blood and urine routes differ: the large vessels beside the kidneys are not ureters. The book’s dialysis extension describes external blood treatment, not removing kidneys for washing. No medical procedure or personal diagnosis is provided.'),closure:P('腎臟形成、輸尿管輸送、膀胱儲存、尿道排出。','Kidneys form, ureters transport, bladder stores, urethra discharges urine.'),sources:[],init:()=>({running:true,organ:'kidney',start:0}),controls:()=>[choice(P('放大觀察','Enlarge'),'organ',ORGANS.map(q=>[q.id,q.name]))],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>{const q=ORGANS.find(p=>p.id===s.organ)||ORGANS[0];return{title:q.name,text:q.text};},draw:drawUrinary},
 {id:'kidney',title:P('丟掉之前，先回收','Recover before discarding'),sub:P('過濾與再吸收','Filtration and reabsorption'),hook:P('水和葡萄糖被濾出，就表示它們都是廢物、都該排掉嗎？','If water and glucose are filtered, does that make them wastes that must be discarded?'),body:P('左邊從腎臟放大到一個腎元；右邊的模型追蹤一種小分子：過濾到腎小管後，可能回到血液，也可能最後隨尿液離開。','The left side zooms from a kidney to one nephron. The model on the right tracks one small substance after filtration: it may return to blood or leave in urine.'),reading:P('腎臟形成尿液不只是把血液整包倒出去。正常過濾保留血球與大部分大蛋白，小分子可進入濾出液；後續再吸收把需要的養分、水及鹽類收回。正常葡萄糖應回收，不是永遠丟掉的廢物；尿素則需要淨排除。水與鹽也需要依狀態調節。模型省略完整腎元與分泌等細節；顆粒數與路線速度不代表固定回收率、腎功能或學生的真實尿液。','Urine formation is not dumping whole blood. Normal filtration retains cells and most large proteins while small substances enter filtrate. Reabsorption recovers needed nutrients, water and salts. Glucose is normally recovered, not always discarded; urea requires net removal. Water and salts are regulated with physiological state. The model omits complete nephron and secretion details; counts and speeds are not recovery fractions, renal-function values or student urine measurements.'),closure:P('過濾不等於最後排出；再吸收把需要的物質收回血液。','Filtration does not equal final removal; reabsorption returns needed materials to blood.'),sources:[],init:()=>({running:true,solute:'water',stage:'all'}),controls:()=>[choice(P('追蹤成分','Track substance'),'solute',Object.entries(SOLUTES).map(([k,q])=>[k,q.name])),choice(P('看哪段','Inspect phase'),'stage',[['all',P('完整機制','Full mechanism')],['filter',P('只看過濾','Filtration only')],['recover',P('追蹤回收／排出','Recovery / removal')]])],explain:s=>({title:SOLUTES[s.solute].name,text:SOLUTES[s.solute].text}),draw:drawKidney},
 {id:'water_balance',title:P('少一點，還是多排？','Conserve or remove more?'),sub:P('水分的恆定','Water balance'),hook:P('缺水時身體一邊叫你喝水，一邊讓腎臟少排水。這兩件事如何合作？','When water is low, thirst promotes intake and kidneys conserve it. How do these actions cooperate?'),body:P('切換水分太少、適當範圍、過多：看身體裡的水位、口渴和尿量怎麼一起調節。','Switch low, suitable and excess water: watch the body’s water level, thirst and urine output adjust together.'),reading:P('水分太少時，腦中的調節中樞可使人感覺口渴，並調節腎臟形成較少尿液，減少流失；水分過多時，較多水可隨尿液排出。只是少排水不能憑空增加體內水，還需要攝入等來源。喝水、食物與代謝可提供水；呼吸、流汗、排尿與排便可散失水。課本冬夏比較應一次控制一項條件，不能只憑季節推測每人的尿量。此概念模型不提供固定飲水量、健康分數或治療建議。','Low water promotes thirst and kidney conservation with less urine; excess water can be removed in more urine. Less loss alone cannot create water; intake is also needed. Drinks, food and metabolism supply water; respiration, sweat, urine and faeces remove it. Seasonal comparisons require controlled conditions, not predictions of everyone’s urine volume. This conceptual model provides no fixed drinking target, health score or treatment advice.'),closure:P('缺水：增加攝入並減少流失；過多：排出多餘，回到適當範圍。','Low water: increase intake and reduce loss; excess: remove surplus toward a suitable range.'),sources:[],init:()=>({running:true,balance:'low',changedAt:0}),controls:()=>[choice(P('比較水分狀態','Compare water state'),'balance',[['low',P('水分太少','Water low')],['normal',P('適當範圍','Suitable range')],['high',P('水分過多','Water high')]])],act:(s,k,v)=>{s[k]=v;if(k==='balance')s.changedAt=s.elapsed||0;},explain:s=>({title:s.balance==='low'?P('口渴與少尿一起幫忙','Thirst and less urine work together'):s.balance==='high'?P('排出多餘水分','Remove excess water'):P('在範圍內持續調節','Keep regulating within the range'),text:s.balance==='low'?P('喝水增加攝入，腎臟保留較多水、形成較少尿液。少尿不是完全不排尿，示意水位回升也不能當成實測恢復速度。','Intake adds water and kidneys retain more, producing less urine. Less urine is not zero urine; the model’s level rise is not a measured recovery speed.'):s.balance==='high'?P('腎臟可讓多餘水分隨較多尿液排出，幫助內在水分回到適當範圍；不是多喝一定更健康，也不能由示意圖決定治療。','Kidneys can remove surplus water in more urine, helping return toward a suitable range. More intake is not always healthier, and the diagram cannot determine treatment.'):P('恆定是動態平衡，仍有攝入與散失，不是水分從此完全不動。圖中數量只比較方向。','Homeostasis is dynamic: intake and loss continue. Water does not become motionless. Particle numbers only compare direction.')}),draw:drawWater},
 {id:'surfaces',title:P('外衣，幫誰留住水？','Which surfaces conserve water?'),sub:P('體表保護與植物泌液','Barriers and guttation'),hook:P('蛇的鱗片、葉片角質層和葉緣水珠，都是水分調節；但水珠是露水嗎？','Scales, cuticles and leaf-margin drops relate to water balance. Are those drops dew?'),body:P('選一種構造：上方圖片框出位置，下方放大看水分怎麼被擋住，或怎麼從葉緣排出。','Choose a surface: the picture marks the spot, and the close-up shows water being held back, or leaving at the leaf edge.'),reading:P('陸生動植物可用體表構造降低水分散失：昆蟲外骨骼、蛇鱗、植物角質層與樹皮。防止過度散失不等於完全不透水、不需攝水或沒有氣體交換。植物的氣孔仍有交換與蒸散功能；不同物種及環境會影響開閉。根部水充足而蒸散較弱時，水可經水孔在葉緣或尖端以液滴排出，稱泌液（吐水）。它不是蒸散的水蒸氣，也不是大氣水氣凝結的露水。想一想：要區分泌液與露水，除了看水珠，還需要哪些位置與環境證據？','Terrestrial surfaces limit water loss: insect exoskeletons, scales, cuticles and bark. Protection does not imply perfect impermeability, no intake or no gas exchange. Stomata still exchange gases and support transpiration, with species and environmental differences. With ample root water and low transpiration, hydathodes may discharge liquid at leaf tips/margins: guttation. This is neither transpired vapour nor dew condensed from air. Which positional and environmental observations help distinguish guttation from dew?'),closure:P('保護構造減少散失；泌液排出液態水，不等於露水或蒸散。','Protective surfaces limit loss; guttation releases liquid, unlike dew or transpiration.'),sources:[],init:()=>({running:true,surface:'scales',start:0}),controls:()=>[choice(P('構造','Surface'),'surface',SURFACES.map(q=>[q.id,q.name]))],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>{const q=SURFACES.find(p=>p.id===s.surface)||SURFACES[0];return{title:q.name,text:q.text};},draw:drawSurface}
];
B.register({id:'excretion_water',title:P('排泄與水分：留下需要的，排出多餘的','Excretion and water balance'),subtitle:P('廢物從哪裡來、尿液怎麼形成，以及水分怎麼維持平衡','Where wastes come from, how urine forms, and how water stays balanced'),cover:'assets/covers/biology_water_balance_1009_v1.jpg',tabs});
})();

/* Respiration and gas exchange · teacher-requested V5 remake, 2026-10-19.
 * Same six tabs, hooks, closures, readings and controls as respiration_1009_v1.js.
 * Pictures are the teacher's Gemini AI teaching illustrations (see respiration_ai_1019/sources.md);
 * the bottle-model and limewater photographs stay as the textbook's original evidence.
 * Air, gases, blood, cells and every mechanism close-up are drawn here as models, not to scale.
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
// Gas symbols follow the homeostasis book: oxygen atoms pink, carbon grey, hydrogen chalk white.
const O2=(c,x,y,s=5,a=1)=>{c.save();c.globalAlpha=a;D.oxygen(c,x,y,s);c.restore();};
const CO2=(c,x,y,s=4,a=1)=>{c.save();c.globalAlpha=a;D.co2(c,x,y,s);c.restore();};
const H2O=(c,x,y,s=8,a=1)=>{c.save();c.globalAlpha=a;D.water(c,x,y,s);c.restore();};
function airDot(c,x,y,r=5,a=1){c.save();c.globalAlpha=a;glow(c,x,y,r*2.4,C.cyan,.35);D.sphere(c,x,y,r,C.cyan);c.restore();}
// Oxygen-poor blood is dark red, oxygen-rich bright red: never blue.
function rbc(c,x,y,r,ox){const body=mixHex('#7a1f2b','#ef3e46',ox),rim=mixHex('#a3404a','#ff8a8f',ox);ellipse(c,x,y,r,r*.62,body,rim,1.6);ellipse(c,x,y,r*.42,r*.24,mixHex('#5e1520','#c42f39',ox));}
function hexagon(c,x,y,r,fill=C.yellow,a=1,rot=0){c.save();c.globalAlpha=a;c.beginPath();for(let i=0;i<6;i++){const q=rot+i*TAU/6+Math.PI/6;i?c.lineTo(x+Math.cos(q)*r,y+Math.sin(q)*r):c.moveTo(x+Math.cos(q)*r,y+Math.sin(q)*r);}c.closePath();c.fillStyle=rgba(fill,.3);c.fill();c.strokeStyle=fill;c.lineWidth=3;c.stroke();c.restore();}
function bolt(c,x,y,s,a=1){c.save();c.globalAlpha=a;c.beginPath();c.moveTo(x+s*.15,y-s);c.lineTo(x-s*.45,y+s*.1);c.lineTo(x-s*.02,y+s*.1);c.lineTo(x-s*.18,y+s);c.lineTo(x+s*.5,y-s*.15);c.lineTo(x+s*.05,y-s*.15);c.closePath();c.fillStyle=C.yellow;c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();c.restore();}

// ── pictures ───────────────────────────────────────────────────────────────
const PICS={};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
const A_DIR='assets/biology/respiration_ai_1019/',BOOK='assets/biology/ch6_homeostasis_1009_v1/';
// Fit a picture in a box; returns where it landed, or null while it loads.
function place(c,path,bx,by,bw,bh,{alpha=1,cover=false,radius=14}={}){
  const im=pic(path);if(!im)return null;const f=cover?Math.max:Math.min,k=f(bw/im.naturalWidth,bh/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k,x=bx+(bw-w)/2,y=by+(bh-h)/2;
  c.save();if(cover){c.beginPath();c.roundRect(bx,by,bw,bh,radius);c.clip();}c.globalAlpha=alpha;c.drawImage(im,x,y,w,h);c.restore();
  return{x,y,k,map:(px,py)=>[x+px*k,y+py*k],rect:([px,py,pw,ph])=>[x+px*k,y+py*k,pw*k,ph*k]};
}
function crop(c,path,box,dst){const im=pic(path);if(!im)return;c.drawImage(im,box[0],box[1],box[2],box[3],...dst);}

// ── Tab 1: which way does air go? The organ is pulled out of the airway picture ─────
// airway_section.png is 900×1031; organ boxes and the air route are in those pixels.
const AW={file:A_DIR+'airway_section.png',S:.5,X:30,Y:42};
const AIR=[
 {id:'nose',name:P('鼻腔','Nasal cavity'),box:[118,140,362,165],key:P('鼻毛攔下灰塵；空氣在這裡變得溫暖、溼潤。','Hairs trap dust; the air is warmed and moistened here.'),text:P('空氣從鼻腔進入。鼻毛可攔截較大的灰塵，鼻腔也有助使吸入空氣溫暖、溼潤；鼻腔不是主要氣體交換處。','Air enters the nasal cavity. Nasal hairs trap larger particles, and the cavity helps warm and moisten air. It is not the main gas-exchange surface.')},
 {id:'pharynx',right:true,name:P('咽','Pharynx'),box:[395,215,150,300],key:P('空氣和食物共用的一段，下面才分成兩條路。','A section shared by air and food; the two routes split below it.'),text:P('咽是呼吸道與消化道共用的一段。空氣接著前往喉；食物則進入食道，不是沿氣管到肺。','The pharynx is shared by respiratory and digestive routes. Air continues toward the larynx; food enters the oesophagus, not the trachea or lungs.')},
 {id:'larynx',right:true,name:P('喉','Larynx'),box:[365,415,155,205],key:P('吞嚥時，會厭幫忙蓋住氣管的入口。','When you swallow, the epiglottis helps cover the airway.'),text:P('喉位於氣管上端，含發聲相關構造。吞嚥時會厭有助遮住氣管入口，使食物走向食道；此頁定位，不演示吞嚥操作。','The larynx is at the top of the trachea and contains structures for voice. During swallowing, the epiglottis helps protect the airway. This view locates the structure, not a swallowing procedure.')},
 {id:'trachea',right:true,name:P('氣管','Trachea'),box:[405,610,130,262],key:P('軟骨環撐住管子；纖毛和黏液把灰塵往上送。','Cartilage rings hold it open; cilia and mucus move dust upward.'),text:P('氣管把空氣送向兩側支氣管。管壁的軟骨有助保持通暢；纖毛與黏液協助清除異物，不把所有顆粒都當成會在肺中交換的氣體。','The trachea carries air toward the bronchi. Cartilage supports the airway; cilia and mucus help clear particles. Dust particles are not exchange gases.')},
 {id:'bronchi',name:P('支氣管','Bronchi'),box:[290,826,440,200],key:P('氣管分成兩支，把空氣送進兩側的肺。','The trachea splits in two, carrying air into both lungs.'),text:P('氣管分成左右支氣管，再分成更細的分支，把空氣送到肺內眾多肺泡。分支不是血管，這裡面主要通過的是空氣。','The trachea divides into right and left bronchi, then smaller branches leading to alveoli. These airways are not blood vessels; they carry air.')},
 {id:'lung',name:P('肺','Lungs'),box:[140,655,700,376],key:P('支氣管越分越細，末端連著許多肺泡。','The branches get finer and end in many alveoli.'),text:P('肺位於胸腔，含許多肺泡。肺泡壁與周圍微血管壁薄、總表面積大，有利氣體擴散。人體左右是解剖方向，不依看圖者的左右命名。','The lungs lie in the chest and contain many alveoli. Thin alveolar and capillary walls and a large total area favour diffusion. Left and right follow the person’s anatomy, not the viewer.')}
];
const AIR_MAIN=[[132,268],[230,238],[330,218],[430,228],[464,262],[470,330],[472,408],[460,462],[446,530],[462,622],[470,740],[476,852]];
const AIR_L=AIR_MAIN.concat([[440,886],[400,930],[352,972],[300,1008]]),AIR_R=AIR_MAIN.concat([[516,880],[570,914],[630,952],[690,988]]);
const FOOD=[[380,318],[428,322],[452,362],[468,410],[482,456],[495,510],[500,570],[503,640]];
function airFlow(c,map,t,{r=5,n=14,clip=null}={}){
  c.save();if(clip){c.beginPath();c.rect(...clip);c.clip();}
  for(let i=0;i<n;i++){const [px,py]=along(i%2?AIR_R:AIR_L,mod(t*.08+i/n)),[x,y]=map(px,py);airDot(c,x,y,r);}
  c.restore();
}
// Organ-specific helpers drawn on the enlargement; `zm` maps picture pixels into it.
const AIR_EXTRA={
 nose(c,zm,t,R){c.save();c.beginPath();c.rect(...R);c.clip();for(let i=0;i<4;i++){const u=mod(t*.22+i/4),stop=[150+i*6,262+i*4],a=[120,292],p=[mix(a[0],stop[0],ease(u*1.7)),mix(a[1],stop[1],ease(u*1.7))],[x,y]=zm(...p);circle(c,x,y,6.5,'#d6c39a','#5b4a2c',1.5);}c.restore();
  pill(c,P('鼻毛攔下灰塵','Hairs trap dust'),R[0],R[1]+R[3]+16,{anchor:zm(150,266),color:'#e8d7a8',minX:R[0]});
  pill(c,P('溫暖、溼潤','Warmed and moistened'),R[0]+R[2]-250,R[1]-58,{anchor:zm(320,205),color:C.cyan,maxX:R[0]+R[2]});},
 pharynx(c,zm,t,R){c.save();c.beginPath();c.rect(...R);c.clip();for(let i=0;i<5;i++){const [x,y]=zm(...along(FOOD,mod(t*.12+i/5)));circle(c,x,y,7,C.orange,C.ink,2);}c.restore();
  pill(c,P('空氣：往前進氣管','Air: forward to the trachea'),528,R[1]+R[3]-150,{anchor:zm(452,486),color:C.cyan,minX:520});
  pill(c,P('食物：往後進食道','Food: back to the esophagus'),528,R[1]+R[3]-60,{anchor:zm(497,508),color:C.orange,minX:520});},
 larynx(c,zm,t,R){pill(c,P('會厭','Epiglottis'),528,R[1]+40,{anchor:zm(447,440),color:C.yellow,minX:520});
  pill(c,P('聲帶（發聲）','Vocal cords (voice)'),528,R[1]+R[3]-110,{anchor:zm(430,525),color:C.pink,minX:520});},
 trachea(c,zm,t,R){for(let i=0;i<3;i++){const u=mod(t*.12+i/3),[x,y]=zm(447,mix(860,620,u));circle(c,x,y,6,'#d6c39a','#5b4a2c',1.5);}
  pill(c,P('軟骨環：撐開管子','Cartilage rings keep it open'),528,R[1]+30,{anchor:zm(486,690),color:C.white,minX:520});
  pill(c,P('纖毛把灰塵往上送','Cilia sweep dust upward'),528,R[1]+R[3]-120,{anchor:zm(448,780),color:'#e8d7a8',minX:520});},
 bronchi(c,zm,t,R){pill(c,P('在這裡分成兩支','It splits in two here'),R[0]+R[2]/2-120,R[1]-58,{anchor:zm(476,858),color:C.yellow,minX:R[0]});
  pill(c,P('進入兩側的肺','Into both lungs'),R[0]+R[2]-200,R[1]+R[3]+16,{anchor:zm(640,960),color:C.cyan,maxX:R[0]+R[2]});},
 lung(c,zm,t,R){pill(c,P('越分越細的支氣管','Finer and finer branches'),R[0]+R[2]-300,R[1]-58,{anchor:zm(650,840),color:C.yellow,maxX:R[0]+R[2]});
  pill(c,P('末端：肺泡（下一頁）','Ends: alveoli (next tab)'),R[0],R[1]+R[3]+16,{anchor:zm(260,940),color:C.pink,minX:R[0]});}
};
function drawAir(c,s,t){
  const q=AIR.find(o=>o.id===s.organ)||AIR[0],tt=Math.max(0,t-s.start),z=ease(tt/.9),{S,X,Y}=AW,map=(px,py)=>[X+px*S,Y+py*S];
  panel(c,20,20,470,560);
  const im=pic(AW.file);if(im)c.drawImage(im,X,Y,900*S,1031*S);
  airFlow(c,map,t,{r:4.5,clip:[20,20,470,560]});
  [...AIR].reverse().forEach(o=>{const [bx,by,bw,bh]=o.box;D.hit(X+bx*S,Y+by*S,bw*S,bh*S,'organ',o.id);});
  const [bx,by,bw,bh]=q.box,from=[X+bx*S,Y+by*S,bw*S,bh*S];
  dashedBox(c,from);
  // the enlargement
  panel(c,510,20,430,560);
  text(c,q.name,725,62,28,C.yellow,'center');
  const zr=zoomRect(q.box,[528,84,394,370],3.2),k=zr.k,to=zr.r;if(q.right)to[0]=922-to[2];const cur=lerpRect(from,to,z);
  connectors(c,from,cur,.55);
  crop(c,AW.file,q.box,cur);
  c.save();c.strokeStyle=rgba(C.yellow,.85);c.lineWidth=3;c.strokeRect(...cur);c.restore();
  if(z>.98){const zm=(px,py)=>[to[0]+(px-bx)*k,to[1]+(py-by)*k];
    airFlow(c,zm,t,{r:7,n:44,clip:to});AIR_EXTRA[q.id](c,zm,t,to);}
  wrap(c,q.key,532,494,390,22,C.white);
  legendRow(c,[[(x,y)=>airDot(c,x,y,6),P('藍點＝空氣','Blue dots = air')],...(q.id==='pharynx'?[[(x,y)=>circle(c,x,y,7,C.orange,C.ink,2),P('橘點＝食物','Orange = food')]]:[])],532,566);
}

// ── Tab 2: alveoli, enlarged level by level, then oxygen and carbon dioxide crossing ──
const ALV={file:A_DIR+'alveoli_capillaries.png',wall:[848,540,130,170]};
const LUNG_BOX=[140,655,700,376],LUNG_SPOT=[260,935,80,80];
function drawAlveoli(c,s,t){
  // left: lung → a cluster of alveoli → one wall
  panel(c,20,20,330,560);
  text(c,P('肺','Lung'),36,50,22,C.muted);
  const LM=[45,58,280,150],lk=280/700;crop(c,AW.file,LUNG_BOX,LM);
  const spot=[LM[0]+(LUNG_SPOT[0]-LUNG_BOX[0])*lk,LM[1]+(LUNG_SPOT[1]-LUNG_BOX[1])*lk,LUNG_SPOT[2]*lk,LUNG_SPOT[3]*lk];
  const f=place(c,ALV.file,55,246,260,262);
  text(c,P('一串肺泡','A cluster of alveoli'),36,238,22,C.muted);
  if(f){const r1=[f.x,f.y,260,262];connectors(c,spot,r1,.45);dashedBox(c,spot,C.yellow,2.5);
    const wall=f.rect(ALV.wall);dashedBox(c,wall);connectors(c,wall,[370,20,570,560],.5);}
  wrap(c,P('圖中藍色只是慣例：含氧少的血仍是暗紅色。','Blue is only a convention: such blood is dark red.'),36,538,300,22,C.muted);
  // right: the enlarged wall between air and blood
  const X0=370,X1=940,AIR_TOP=24,WALL=250,CAP0=280,CAP1=396;
  panel(c,370,20,570,560);
  c.save();c.beginPath();c.roundRect(370,20,570,560,16);c.clip();
  const ag=c.createLinearGradient(0,AIR_TOP,0,WALL);ag.addColorStop(0,'#14392f');ag.addColorStop(1,'#1d4a3d');c.fillStyle=ag;c.fillRect(X0,AIR_TOP,X1-X0,WALL-AIR_TOP);
  // alveolar wall: one thin row of flat cells
  c.fillStyle='#e7a9a4';c.fillRect(X0,WALL,X1-X0,12);for(let x=X0+30;x<X1;x+=88)ellipse(c,x,WALL+6,16,4,'#b35d63');
  c.fillStyle='#2a1c22';c.fillRect(X0,WALL+12,X1-X0,6);
  c.fillStyle='#d98c93';c.fillRect(X0,WALL+18,X1-X0,CAP0-WALL-18);
  // the capillary
  const pg=c.createLinearGradient(0,CAP0,0,CAP1);pg.addColorStop(0,'#4a1a22');pg.addColorStop(.5,'#5c2029');pg.addColorStop(1,'#4a1a22');c.fillStyle=pg;c.fillRect(X0,CAP0,X1-X0,CAP1-CAP0);
  c.fillStyle='#d98c93';c.fillRect(X0,CAP1,X1-X0,10);
  c.fillStyle='#173a30';c.fillRect(X0,CAP1+10,X1-X0,580-CAP1-10);
  const ox=x=>clamp((x-470)/330);
  for(let i=0;i<7;i++){const x=X0-30+mod(t*48+i*90,X1-X0+60),y=(CAP0+CAP1)/2+((i*37)%3-1)*24;rbc(c,x,y,24,ox(x));}
  // gases
  if(s.gas!=='co2')for(let i=0;i<11;i++){const u=mod(t*.2+i/11),x0=400+(i*149)%500,wob=Math.sin(t*2+i)*6;
    let x,y,a=1;if(u<.55){const v=u/.55;x=x0+wob;y=mix(70+(i*41)%120,CAP0+34,ease(v));}else{const v=(u-.55)/.45;x=x0+wob+v*90;y=CAP0+34+((i*13)%40);a=1-v;}
    O2(c,x,y,5.5,a);}
  if(s.gas!=='oxygen')for(let i=0;i<8;i++){const u=mod(t*.17+i/8+.3),x0=420+(i*113)%470,wob=Math.sin(t*1.7+i)*6;
    const y=mix(CAP1-28,60,ease(u)),a=u>.85?(1-u)/.15:1;CO2(c,x0+wob+u*20,y,4.5,a);}
  c.restore();
  text(c,P('肺泡內的空氣','Air inside the alveolus'),388,58,24,C.cyan);
  pill(c,P('兩層薄壁：氣體容易穿過','Two thin walls: gases pass easily'),640,WALL-58,{anchor:[650,WALL+10],color:C.white,maxX:932});
  pill(c,P('紅血球留在血管裡','Red cells stay in the vessel'),560,CAP1+22,{anchor:[640,CAP1-30],color:'#ff8a8f',maxX:932});
  text(c,P('血液流動 →','Blood flow →'),388,CAP1+46,22,C.white);
  // keys
  const ky=CAP1+98;
  O2(c,402,ky-7,6);text(c,P('氧氣：肺泡 → 血液','Oxygen: alveolus → blood'),424,ky,22,s.gas==='co2'?C.muted:C.pink);
  CO2(c,404,ky+29,5);text(c,P('二氧化碳：血液 → 肺泡','CO₂: blood → alveolus'),428,ky+36,22,s.gas==='oxygen'?C.muted:C.white);
  rbc(c,404,ky+64,14,0);text(c,P('含氧少：暗紅','Less O₂: dark red'),426,ky+72,22,C.white);
  rbc(c,668,ky+64,14,1);text(c,P('含氧多：鮮紅','More O₂: bright red'),690,ky+72,22,C.white);
}

// ── Tab 3: what expands the chest? The picture breathes; arrows show the movements ─
// chest_diaphragm.png is 1077×1116. DOME traces the diaphragm in those pixels.
const CH={file:A_DIR+'chest_diaphragm.png',W:1077,H:1116,k:.466,cx:320,top:40};
const DOME=[[175,905],[255,808],[350,742],[440,706],[530,692],[620,706],[710,742],[805,808],[885,905]];
function breath(s,t){
  if(s.mode==='auto'){const b=.5-.5*Math.cos(t*TAU/6);s.phase=mod(t,6)<3?'in':'out';return b;}
  s.phase=s.mode;const u=ease((t-s.start)/1.6);return s.mode==='in'?u:1-u;
}
function phaseRows(c,inside,x,y,rows){
  rows.forEach(([name,a,b],i)=>{const yy=y+i*58;D.round(c,x,yy,268,46,12,'rgba(11,26,21,.55)',C.edge);text(c,name,x+14,yy+31,22,C.muted);text(c,inside?a:b,x+254,yy+31,24,inside?C.cyan:C.orange,'right');});
}
function drawChest(c,s,t,b){
  const inside=s.phase==='in';
  panel(c,20,20,600,560);
  const sx=1+.05*b,sy=1+.07*b,{k,cx,top}=CH,cm=(px,py)=>[cx+(px-CH.W/2)*k*sx,top+py*k*sy],cm0=(px,py)=>[cx+(px-CH.W/2)*k,top+py*k];
  c.save();c.beginPath();c.roundRect(20,20,600,560,16);c.clip();
  const im=pic(CH.file);if(im){const w=CH.W*k*sx,h=CH.H*k*sy;c.drawImage(im,cx-w/2,top,w,h);}
  // air in the trachea
  for(let i=0;i<5;i++){const u=mod(t*.5+i/5),v=inside?u:1-u,[x,y]=cm(538,mix(-60,150,v));airDot(c,x,y,6,v<.08||v>.92?.4:1);}
  c.restore();
  // the diaphragm: faint dashes where it rests, chalk-yellow where it is now
  c.save();c.setLineDash([8,7]);line(c,DOME.map(p=>cm0(...p)),rgba(C.white,.55),3);c.restore();
  line(c,DOME.map(p=>cm(...p)),C.ink,8);line(c,DOME.map(p=>cm(...p)),C.yellow,4.5);
  const peak=cm(530,692),wob=Math.sin(t*5)*3;
  if(inside)arrow(c,peak[0],peak[1]+20+wob,peak[0],peak[1]+76+wob,C.yellow,6);else arrow(c,peak[0],peak[1]+76-wob,peak[0],peak[1]+20-wob,C.yellow,6);
  // ribs: up and out, or down and in
  for(const side of [-1,1]){const [x,y]=cm(side<0?175:902,560),d=inside?1:-1;arrow(c,x-side*d*-4,y+d*22,x+side*d*36,y-d*24,C.orange,6);}
  pill(c,P('肺','Lungs'),34,170,{anchor:cm(330,420),color:C.pink});
  pill(c,P('肋骨','Ribs'),34,470,{anchor:cm(205,600),color:C.orange});
  pill(c,P('橫膈','Diaphragm'),470,520,{anchor:cm(720,748),color:C.yellow,maxX:612});
  // right: what changed
  panel(c,640,20,300,560);
  text(c,inside?P('吸氣','Inhale'):P('呼氣','Exhale'),790,74,40,inside?C.cyan:C.orange,'center');
  phaseRows(c,inside,656,104,[[P('橫膈','Diaphragm'),P('收縮、下降','down ↓'),P('放鬆、上升','up ↑')],[P('肋骨','Ribs'),P('上舉、向外','up and out'),P('下降、向內','down and in')],[P('胸腔','Chest'),P('變大','larger'),P('變小','smaller')],[P('空氣','Air'),P('進入肺','flows in'),P('排出','flows out')]]);
  text(c,P('胸腔大小','Chest size'),656,374,22,C.muted);
  D.round(c,656,388,268,30,12,'#0f241e',C.edge);D.round(c,659,391,(262)*mix(.42,1,b),24,10,inside?C.cyan:C.orange);
  wrap(c,P('肺自己不會收縮；是胸腔變大，肺跟著被撐開。','Lungs do not pull by themselves; the chest pulls them open.'),656,448,268,22,C.white);
  c.save();c.setLineDash([8,7]);line(c,[[658,538],[700,538]],rgba(C.white,.7),3);c.restore();text(c,P('放鬆時的橫膈','Relaxed diaphragm'),712,546,22,C.muted);
  line(c,[[658,564],[700,564]],C.yellow,4.5);text(c,P('現在的橫膈','Diaphragm now'),712,572,22,C.muted);
}
function drawBottle(c,s,t,b){
  const inside=s.phase==='in',CX=300;
  panel(c,20,20,600,560);
  // bell jar
  const jar=new Path2D();jar.moveTo(CX-34,96);jar.lineTo(CX-34,128);jar.bezierCurveTo(CX-150,150,CX-150,220,CX-150,300);jar.lineTo(CX-150,450);jar.lineTo(CX+150,450);jar.lineTo(CX+150,300);jar.bezierCurveTo(CX+150,220,CX+150,150,CX+34,128);jar.lineTo(CX+34,96);
  c.save();c.fillStyle='rgba(220,240,255,.07)';c.fill(jar);c.strokeStyle='rgba(220,240,255,.85)';c.lineWidth=4;c.stroke(jar);c.restore();
  line(c,[[CX-122,210],[CX-122,420]],'rgba(255,255,255,.28)',8);
  D.round(c,CX-40,82,80,26,6,'#3b82f6','#1e3a8a');
  // Y tube and balloons
  line(c,[[CX,40],[CX,214]],'#cfe3ec',10);line(c,[[CX,214],[CX-58,262]],'#cfe3ec',9);line(c,[[CX,214],[CX+58,262]],'#cfe3ec',9);
  const rx=mix(26,62,b),ry=mix(30,72,b);
  for(const sd of [-1,1]){const bx=CX+sd*(70+rx*.35),by=262+ry*.9;ellipse(c,bx,by,rx,ry,'#f472b6','#9d174d',3);ellipse(c,bx-rx*.35,by-ry*.4,rx*.22,ry*.16,'rgba(255,255,255,.35)');}
  // rubber membrane, pulled by a knob
  const sag=94*b,mem=[[CX-150,450]];for(let i=1;i<=20;i++){const u=i/20;mem.push([CX-150+300*u,450+sag*Math.sin(Math.PI*u)]);}
  line(c,mem,'#0ea5e9',7);circle(c,CX,450+sag+10,11,'#22c55e',C.ink,2);
  const wob=Math.sin(t*5)*3;
  if(inside)arrow(c,CX+40,470+sag*.5+wob,CX+40,520+sag*.5+wob,C.yellow,6);else arrow(c,CX+40,520+sag*.5-wob,CX+40,470+sag*.5-wob,C.yellow,6);
  // air through the straw
  for(let i=0;i<5;i++){const u=mod(t*.55+i/5),v=inside?u:1-u,[x,y]=v<.6?[CX,mix(28,214,v/.6)]:[CX+(i%2?1:-1)*58*(v-.6)/.4,mix(214,262,(v-.6)/.4)];airDot(c,x,y,6);}
  pill(c,P('吸管＝氣管','Straw = trachea'),360,40,{anchor:[CX+6,150],color:C.cyan,maxX:612});
  pill(c,P('氣球＝肺','Balloons = lungs'),440,240,{anchor:[CX+70+rx,262+ry*.9],color:C.pink,maxX:612});
  pill(c,P('瓶子＝胸腔','Bottle = chest'),440,330,{anchor:[CX+150,380],color:C.white,maxX:612});
  pill(c,P('橡皮膜＝橫膈','Membrane = diaphragm'),360,520,{anchor:[CX-60,450+sag*.85],color:C.yellow,maxX:612});
  text(c,inside?P('拉下橡皮膜','Pull the membrane down'):P('放開橡皮膜','Let the membrane go'),40,560,22,C.muted);
  // right: the textbook photographs
  panel(c,640,20,300,560);
  text(c,inside?P('吸氣','Inhale'):P('呼氣','Exhale'),790,74,40,inside?C.cyan:C.orange,'center');
  D.round(c,654,96,272,224,12,'#faf7eb');place(c,BOOK+(inside?'Im1612.png':'Im1613.png'),660,102,260,212);
  text(c,P('課本照片','Textbook photo'),790,348,22,C.muted,'center');
  phaseRows(c,inside,656,372,[[P('橡皮膜','Membrane'),P('往下','down'),P('往上','up')],[P('氣球','Balloons'),P('脹大','inflate'),P('縮小','deflate')]]);
  wrap(c,P('模型沒有肋骨的動作。','The model leaves out rib movement.'),656,508,268,22,C.white);
}
function drawBreathing(c,s,t){const b=breath(s,t);s.b=b;if(s.evidence==='bottle')drawBottle(c,s,t,b);else drawChest(c,s,t,b);}

// ── Tab 4: cellular respiration inside a cell ─────────────────────────────
const MITO=[470,330];
function cellUses(c,lit){
  const items=[P('肌肉收縮','Muscle contraction'),P('維持體溫','Keeping warm'),P('細胞活動','Cell activities')];
  items.forEach((p,i)=>node(c,p,738,170+i*104,184,76,lit>i,C.yellow));
}
function drawCell(c,s,t){
  const active=s.oxygen&&s.nutrient,u=s.inspect>=0?[.2,.48,.8][s.inspect]:mod(t,7)/7;s.stage=u<.35?0:u<.6?1:2;
  panel(c,20,20,920,560);
  // equation strip
  const st=s.stage,on=k=>active&&st===k;
  D.round(c,36,32,888,62,14,'rgba(11,26,21,.55)',C.edge);
  let ex=56;const item=(icon,p,lit,w0=34)=>{icon(ex+14);text(c,p,ex+w0,71,22,lit?C.yellow:C.white);ex+=w0+measure(c,p,22)+14;},plus=()=>{text(c,'+',ex,71,24,C.muted);ex+=30;};
  item(x=>hexagon(c,x,63,15,C.yellow,s.nutrient?1:.3),P('葡萄糖','glucose'),on(0),36);plus();
  item(x=>O2(c,x,63,6,s.oxygen?1:.3),P('氧','oxygen'),on(0));
  arrow(c,ex+6,63,ex+66,63,on(1)?C.yellow:C.muted,4);ex+=84;
  item(x=>CO2(c,x,63,5),P('二氧化碳','CO₂'),on(2),38);plus();
  item(x=>H2O(c,x,66,10),P('水','water'),on(2));plus();
  item(x=>bolt(c,x,63,15),P('能量','energy'),on(2));
  // capillary on the left
  c.save();c.beginPath();c.roundRect(64,140,84,424,20);c.clip();c.fillStyle='#4a1a22';c.fillRect(64,140,84,424);
  for(let i=0;i<6;i++){const y=100+mod(t*60+i*80,480);rbc(c,106,y,20,.85);}c.restore();
  D.round(c,64,140,84,424,20,null,'#d98c93');
  text(c,P('微血管','Capillary'),106,128,22,C.muted,'center');
  // the cell
  ellipse(c,430,345,268,212,'#1f4a3d','#9fd8b8',4);
  circle(c,300,470,44,'#4c3d78','#a78bfa',3);circle(c,306,462,13,'#7c6bb5');
  c.save();c.translate(...MITO);c.rotate(-.12);ellipse(c,0,0,130,64,'#7c3a1d',C.orange,4);
  c.beginPath();for(let i=0;i<=60;i++){const x=-110+220*i/60,y=Math.sin(i/60*Math.PI*9)*34*Math.sin(i/60*Math.PI);i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#fdba74';c.lineWidth=4;c.stroke();c.restore();
  pill(c,P('粒線體：呼吸作用的主要場所','Mitochondrion: main site of respiration'),300,150,{anchor:[MITO[0]+20,MITO[1]-58],color:C.orange,maxX:712});
  // inputs travel in, products leave
  const inT=clamp(u/.35),conv=clamp((u-.35)/.25),outT=clamp((u-.6)/.4);
  if(u<.6){
    if(s.nutrient){const x=mix(120,MITO[0]-20,ease(inT)),a=active&&conv>0?1-conv:1;hexagon(c,x,MITO[1]-6,22,C.yellow,a,conv*3);}
    if(s.oxygen)for(let i=0;i<6;i++){const ang=i/6*TAU,x=mix(118,MITO[0]+Math.cos(ang)*60,ease(inT)),y=mix(200+i*52,MITO[1]+Math.sin(ang)*30,ease(inT)),a=active&&conv>0?1-conv:1;O2(c,x,y,5.5,a);}
  }
  if(active&&conv>0&&conv<1)glow(c,MITO[0],MITO[1],120*conv,C.yellow,.55*(1-conv*.4));
  if(active&&u>=.6){
    for(let i=0;i<6;i++){const sy=MITO[1]-30+i*12,x=mix(MITO[0]-40,118,ease(outT)),y=mix(sy,420+i*22,ease(outT));CO2(c,x,y,4.5,1-Math.max(0,outT-.85)/.15);}
    for(let i=0;i<6;i++){const ang=i/6*TAU+.4,x=MITO[0]+40+Math.cos(ang)*mix(20,150,ease(outT)),y=MITO[1]+Math.sin(ang)*mix(10,110,ease(outT));H2O(c,x,y,9);}
    for(let i=0;i<3;i++){const v=clamp(outT*1.3-i*.15),x=mix(MITO[0]+100,734,ease(v)),y=mix(MITO[1],208+i*104,ease(v));if(v>0&&v<1)bolt(c,x,y,16);}
  }
  if(!active&&u>=.35){const [mx,my]=MITO;line(c,[[mx-40,my-40],[mx+40,my+40]],C.orange,8);line(c,[[mx+40,my-40],[mx-40,my+40]],C.orange,8);
    pill(c,!s.oxygen?P('缺少氧氣：此有氧模型停止','No oxygen: this aerobic model stops'):P('缺少葡萄糖：此有氧模型停止','No glucose: this aerobic model stops'),250,404,{active:true,color:C.orange,maxX:712});}
  if(!(active&&u>=.6&&outT>.2))pill(c,P('細胞（放大示意）','Cell (enlarged model)'),190,520,{anchor:[240,480],color:'#9fd8b8',maxX:712});
  if(active&&u>=.6&&outT>.2)pill(c,P('CO₂ 回到血液，送到肺排出','CO₂ returns to the blood, to be breathed out'),160,560-46,{anchor:[140,470],color:C.white,maxX:712});
  // where the energy goes
  D.round(c,724,112,212,440,14,'rgba(11,26,21,.45)',C.edge);
  text(c,P('能量用來…','Energy for…'),830,146,22,C.yellow,'center');
  cellUses(c,active&&u>=.6?Math.floor(clamp(outT*1.3)*3.2):0);
}

// ── Tab 5: gas exchange without lungs ──────────────────────────────────────
// Picture boxes are in each file's own pixels; the close-ups below are drawn models.
function waterStreaks(c,R,t){c.save();c.lineCap='round';for(let i=0;i<9;i++){const y=R[1]+20+i*(R[3]-40)/8,x=R[0]+mod(t*90+i*137,R[2]+160)-80;line(c,[[x,y],[x+70,y]],'rgba(186,230,253,.35)',3);}c.restore();}
function gillZoom(c,R,t){
  const [x,y,w,h]=R;c.fillStyle='#0d3442';c.fillRect(x,y,w,h);waterStreaks(c,R,t);
  const base=y+h-34;D.round(c,x+40,base,w-80,22,10,'#e8d9b5','#9a8a64');
  for(let i=0;i<9;i++){const fx=x+110+i*82,top=y+46;
    for(let j=0;j<8;j++){const ly=top+16+j*19;ellipse(c,fx-15,ly,10,4,'#f87171');ellipse(c,fx+15,ly,10,4,'#f87171');}
    D.round(c,fx-11,top,22,base-top+4,11,'#dc2626','#7f1d1d');
    for(let j=0;j<3;j++){const v=mod(t*.5+j/3+i*.13),by=mix(base-6,top+12,v);circle(c,fx,by,4,mixHex('#7a1f2b','#ff6b6b',v));}}
  for(let i=0;i<10;i++){const u=mod(t*.25+i/10),fx=x+110+(i%9)*82,sx=fx-60,yy=y+60+(i*29)%(h-120);O2(c,mix(sx,fx-14,ease(u)),yy,5,u>.85?(1-u)/.15:1);}
  pill(c,P('水流過鰓絲','Water flows over the filaments'),x+12,y+8,{color:C.cyan,maxX:x+w});
  pill(c,P('溶在水中的氧 → 鰓絲的微血管','Oxygen dissolved in water → gill capillaries'),x+w-480,y+8,{anchor:[x+110+4*82-14,y+120],color:C.pink,maxX:x+w});
}
function tracheaZoom(c,R,t){
  const [x,y,w,h]=R;c.fillStyle='#2f3320';c.fillRect(x,y,w,h);
  c.fillStyle='#6b5a2e';c.fillRect(x,y,w,30);c.fillStyle='#2f3320';c.fillRect(x+150,y,44,30);
  const sp=[x+172,y+15];ellipse(c,sp[0],y+28,26,7,null,'#d4c27a',3);
  const cells=[];for(let i=0;i<9;i++)cells.push([x+300+i*68,y+h-50-(i%2)*44]);
  cells.forEach(([cx,cy])=>{circle(c,cx,cy,26,'#7d7a46','#b8b279',2);circle(c,cx,cy,8,'#4b4a2a');});
  const main=[sp,[x+172,y+80],[x+300,y+110],[x+880,y+110]],tubes=[main];
  cells.forEach(([cx,cy],i)=>{const bx=x+300+i*68;tubes.push([[bx,y+110],[bx+(i%2?8:-8),cy-60],[cx,cy-26]]);});
  tubes.forEach((p,i)=>{line(c,p,'#e5e7eb',i?5:14);if(!i)line(c,p,'#9ca3af',8);});
  for(let i=0;i<14;i++){const tube=tubes[1+(i%9)],path=main.slice(0,3).concat(tube),u=mod(t*.18+i/14);const [px,py]=along(path,u);airDot(c,px,py,5.5,u>.92?(1-u)/.08:1);}
  pill(c,P('氣門：空氣的入口','Spiracle: the air inlet'),x+220,y+40,{anchor:[sp[0]+10,sp[1]+8],color:C.yellow,maxX:x+w});
  pill(c,P('氣管裝的是空氣，直接送到細胞','Tracheae carry air straight to the cells'),x+w-420,y+44,{anchor:[x+300+5*68+8,y+150],color:C.cyan,maxX:x+w});
}
function skinZoom(c,R,t){
  const [x,y,w,h]=R,film=y+64,epi=film+18,derm=epi+40;
  c.fillStyle='#173a30';c.fillRect(x,y,w,film-y);
  c.fillStyle='rgba(125,211,252,.55)';c.fillRect(x,film,w,18);
  for(let i=0;i<20;i++){D.round(c,x+i*46,epi,44,38,8,'#6b5e4f','#a8987f');}
  c.fillStyle='#3d2f2a';c.fillRect(x,derm,w,y+h-derm);
  const vessel=[derm+48,derm+100];for(const vy of vessel){D.round(c,x,vy-18,w,36,18,'#5c2029','#d98c93');for(let i=0;i<6;i++){const vx=x+mod(t*50+i*170+(vy%7)*20,w+60)-30;rbc(c,vx,vy,14,.4+.6*clamp((vx-x)/w));}}
  for(let i=0;i<10;i++){const u=mod(t*.2+i/10),gx=x+60+(i*89)%(w-120),yy=u<.35?mix(y+14,film+9,u/.35):mix(film+9,vessel[i%2],(u-.35)/.65);O2(c,gx+Math.sin(t+i)*4,yy,5,u>.9?(1-u)/.1:1);}
  pill(c,P('溼潤的水膜：氧先溶進水裡','Moist film: oxygen dissolves first'),x+w-470,y+8,{anchor:[x+w-300,film+9],color:C.cyan,maxX:x+w});
  pill(c,P('皮膚很薄，下面就是微血管','Thin skin, capillaries just below'),x+12,y+h-50,{anchor:[x+330,vessel[1]],color:'#ff8a8f',maxX:x+w});
}
function stomaZoom(c,R,t){
  const [x,y,w,h]=R,top=y+8,pal=top+20,spg=pal+66,low=y+h-56,cx=x+w/2;
  c.fillStyle='#0f2a22';c.fillRect(x,y,w,h);
  for(let i=0;i<24;i++)D.round(c,x+i*38,top,36,18,5,'#bfe3a5','#6b8f55');
  for(let i=0;i<30;i++)D.round(c,x+4+i*30,pal,26,60,10,'#4f9b45','#2f6b2a');
  c.fillStyle='#163828';c.fillRect(x,spg,w,low-spg);
  for(let i=0;i<22;i++)for(let j=0;j<2;j++){const sx=x+20+i*42+(j?21:0),sy=spg+24+j*44;if(Math.abs(sx-cx)<50&&j)continue;circle(c,sx,sy,17,'#5fae52','#2f6b2a',2);}
  for(let i=0;i<24;i++){const ex=x+i*38;if(Math.abs(ex+18-cx)<50)continue;D.round(c,ex,low,36,18,5,'#bfe3a5','#6b8f55');}
  ellipse(c,cx-27,low+9,23,16,'#22c55e','#14532d',2.5);ellipse(c,cx+27,low+9,23,16,'#22c55e','#14532d',2.5);
  for(let i=0;i<6;i++){const u=mod(t*.22+i/6),p=along([[cx-6+(i%3)*4,y+h+10],[cx,low+9],[cx-100+i*40,spg+40]],u);O2(c,p[0],p[1],5,u>.9?(1-u)/.1:1);}
  for(let i=0;i<5;i++){const u=mod(t*.2+i/5+.5),p=along([[cx+120-i*50,spg+50],[cx+4,low+9],[cx+10,y+h+10]],u);CO2(c,p[0],p[1],4,u>.9?(1-u)/.1:1);}
  pill(c,P('氣孔：兩個保衛細胞圍成的開口','Stoma: an opening between two guard cells'),x+w-480,spg+8,{anchor:[cx+30,low+4],color:C.green,maxX:x+w});
  pill(c,P('呼吸作用日夜都在進行','Respiration goes on day and night'),x+12,spg+8,{color:C.pink,maxX:x+w});
}
function lenticelZoom(c,R,t){
  const [x,y,w,h]=R,cork=y+50,inner=cork+56,cx=x+w/2;
  c.fillStyle='#173a30';c.fillRect(x,y,w,cork-y);
  for(let j=0;j<3;j++)for(let i=0;i<26;i++){const bx=x+i*36+(j%2?18:0);if(Math.abs(bx+15-cx)<80)continue;D.round(c,bx,cork+j*18,34,17,3,'#7c4a2c','#4a2a17');}
  c.save();c.beginPath();c.ellipse(cx,cork+20,84,46,0,Math.PI,0);c.fillStyle='#173a30';c.fill();c.restore();
  for(let i=0;i<14;i++){const a=i/14,px=cx-70+a*140+(i%2)*8,py=cork-20+(i%3)*24;circle(c,px,py,12,'#d6b98c','#8a6a40',2);}
  c.fillStyle='#2c3f26';c.fillRect(x,inner,w,y+h-inner);
  for(let i=0;i<22;i++)for(let j=0;j<2;j++)circle(c,x+20+i*42+(j?21:0),inner+30+j*42,18,'#7aa35a','#45663a',2);
  for(let i=0;i<8;i++){const u=mod(t*.2+i/8),p=along([[cx-40+i*10,y+6],[cx-8+(i%3)*8,cork+10],[x+120+i*100,inner+44]],u);airDot(c,p[0],p[1],5.5,u>.9?(1-u)/.1:1);}
  pill(c,P('皮孔：細胞鬆鬆的，留有空隙','Lenticel: loose cells with gaps'),x+12,y+6,{anchor:[cx-60,cork-10],color:'#e8c79a',maxX:x+w});
  pill(c,P('空氣進到莖內的活細胞','Air reaches living cells inside'),x+w-380,inner+82,{anchor:[x+w-260,inner+44],color:C.cyan,maxX:x+w});
}
const SPECIES=[
 {id:'fish',name:P('魚：鰓','Fish: gills'),file:'fish_gills.png',box:[228,262,226,240],zoom:gillZoom,
  route:[P('水中溶解的氧','Oxygen dissolved in water'),P('鰓絲的微血管','Capillaries in the gills'),P('血液運送','Carried by blood'),P('全身細胞','Body cells')],
  text:P('鰓與水接觸，交換的是溶在水中的氧氣，不是把水分子拆成氧氣。鰓有大的表面積與微血管，氧氣進入血液，二氧化碳往水中擴散。','Gills exchange oxygen dissolved in water; they do not split water molecules to obtain oxygen. Their large area and capillaries support oxygen entering blood and carbon dioxide diffusing into water.')},
 {id:'insect',name:P('昆蟲：氣管','Insects: tracheae'),file:'grasshopper_tracheae.png',box:[780,345,390,160],zoom:tracheaZoom,
  route:[P('空氣中的氧','Oxygen in the air'),P('氣門','Spiracles'),P('氣管越分越細','Ever finer tracheae'),P('直接送到細胞','Straight to the cells')],
  text:P('氣體由氣門進入分支的氣管系統，細氣管接近組織細胞。這條氣體輸送路徑不同於人類的「肺泡→血液→細胞」，不可把昆蟲氣管畫成裝血液的管子。','Air enters spiracles and a branching tracheal system; fine branches reach tissues. Unlike the human alveolus–blood–cell route, these tubes carry air rather than blood.')},
 {id:'skin',name:P('山椒魚：溼潤皮膚','Salamander: moist skin'),file:'salamander_stream.jpg',cover:true,box:[430,258,210,110],zoom:skinZoom,
  route:[P('空氣中的氧','Oxygen in the air'),P('溶進皮膚的水膜','Dissolves in the moist skin'),P('皮下微血管','Capillaries under the skin'),P('血液運送','Carried by blood')],
  text:P('課本山椒魚除用肺，也利用薄而溼潤的皮膚交換氣體。氧氣先溶於表面的水分，再跨過表面；乾燥會妨礙此途徑。圖片是 AI 教學插圖，皮膚剖面是放大示意。','The salamander uses lungs and thin, moist skin. Oxygen dissolves in surface moisture before diffusing inward; drying impairs the route. The picture is an AI teaching illustration; the skin section is an enlarged model.')},
 {id:'stoma',name:P('植物：氣孔','Plants: stomata'),file:'leaf_stomata.png',box:[380,400,200,220],zoom:stomaZoom,
  route:[P('空氣中的氧','Oxygen in the air'),P('氣孔','Stomata'),P('葉內的空隙','Air spaces in the leaf'),P('葉肉細胞','Leaf cells')],
  text:P('葉片氣孔可讓氣體進出；左上是葉片下表皮的顯微示意（AI 插圖，不是顯微照片）。植物的活細胞日夜都呼吸，不能把氣孔進出氣體全部等同於光合作用。','Stomata allow gas exchange. The top picture is an AI illustration of the lower leaf surface, not a micrograph. Living plant cells respire day and night; stomatal exchange is not exclusively photosynthesis.')},
 {id:'lenticel',name:P('植物：皮孔','Plants: lenticels'),file:'lenticel_branch.png',box:[610,195,150,90],zoom:lenticelZoom,
  route:[P('空氣中的氧','Oxygen in the air'),P('皮孔','Lenticels'),P('莖內的空隙','Air spaces in the stem'),P('莖內的活細胞','Living cells in the stem')],
  text:P('木本植物莖上的皮孔能與外界交換氣體；根的表皮細胞也可與土壤空氣交換。氣孔、皮孔、根部是不同位置的途徑，植物沒有人的肺。','Lenticels in woody stems allow gas exchange; root epidermal cells also exchange gases with soil air. Stomata, lenticels and roots are distinct routes. Plants do not have human lungs.')}
];
function drawSpecies(c,s,t){
  const q=SPECIES.find(o=>o.id===s.species)||SPECIES[0],tt=Math.max(0,t-s.start),z=ease(tt/.8);
  panel(c,20,20,500,270);
  const f=place(c,A_DIR+q.file,30,30,480,250,{cover:!!q.cover});
  panel(c,540,20,400,270);
  text(c,q.name,740,58,26,C.yellow,'center');
  q.route.forEach((p,i)=>{const y=74+i*52;if(i)arrow(c,740,y-12,740,y+1,C.pink,4);node(c,p,560,y,360,40,i===0||i===3,i===0?C.pink:C.cyan);});
  // the close-up, opened from the boxed region
  const ZR=[20,306,920,274];panel(c,...ZR);
  const inner=[30,316,900,254];
  if(f){const box=f.rect(q.box);dashedBox(c,box);connectors(c,box,lerpRect(box,inner,z),.55);}
  c.save();c.beginPath();c.roundRect(...inner,12);c.clip();
  c.globalAlpha=z;q.zoom(c,inner,t);c.restore();
  D.round(c,...inner,12,null,rgba(C.yellow,.8));
}

// ── Tab 6: limewater evidence (textbook photos kept; the setup is a drawn model) ──
function flask(c,x,y,kind,t){
  const body=new Path2D();body.moveTo(x-14,y-62);body.lineTo(x-14,y-26);body.lineTo(x-52,y+44);body.quadraticCurveTo(x-56,y+56,x-42,y+56);body.lineTo(x+42,y+56);body.quadraticCurveTo(x+56,y+56,x+52,y+44);body.lineTo(x+14,y-26);body.lineTo(x+14,y-62);
  c.save();c.fillStyle='rgba(220,240,255,.08)';c.fill(body);c.strokeStyle='rgba(220,240,255,.85)';c.lineWidth=3;c.stroke(body);c.restore();
  D.round(c,x-18,y-74,36,16,4,'#6b7280','#374151');
  for(let i=0;i<14;i++){const bx=x-34+(i%7)*11+(i>6?5:0),by=y+46-(i>6?10:0);ellipse(c,bx,by,6,4.5,'#5b7a2a','#2f4a14',1.2);if(kind==='sprout'){line(c,[[bx+3,by-2],[bx+8,by-12-((i*7)%6)]],'#f5f5dc',2.5);}}
}
function pump(c,x,y){ellipse(c,x,y+20,30,36,'#b91c1c','#7f1d1d',3);D.round(c,x-8,y-30,16,26,4,'#9ca3af','#4b5563');text(c,P('打氣','pump'),x,y+80,22,C.muted,'center');}
function mouthpiece(c,x,y,t){D.round(c,x-34,y-6,68,46,18,'#f3c9a8','#9a6b4f');ellipse(c,x,y+16,16,7,'#8a2f3c');
  for(let i=0;i<3;i++){const u=mod(t*.8+i/3);circle(c,x+mix(0,20,u),y-12-u*30,mix(5,12,u),null,rgba(C.white,.6*(1-u)),2);}
  text(c,P('吹氣','blow'),x,y+80,22,C.muted,'center');}
function testTube(c,cx,cloud,prog,running,t,seed){
  const top=262,bot=500,liq=330;
  c.save();const tube=new Path2D();tube.moveTo(cx-36,top);tube.lineTo(cx-36,bot-36);tube.arc(cx,bot-36,36,Math.PI,0,true);tube.lineTo(cx+36,top);
  c.fillStyle='rgba(220,240,255,.06)';c.fill(tube);c.clip(tube);
  c.fillStyle='rgba(207,232,240,.2)';c.fillRect(cx-40,liq,80,bot-liq);
  c.fillStyle=rgba('#f2ecd9',.78*cloud);c.fillRect(cx-40,liq,80,bot-liq);
  const n=Math.round(110*cloud);for(let i=0;i<n;i++){const px=cx-30+mod(i*.618+seed)*60,py=liq+8+mod(i*.137+seed*.3+t*.01)*(bot-liq-14);circle(c,px,py,2.2,'#ffffff');}
  if(running&&prog<1)for(let i=0;i<6;i++){const u=mod(t*.9+i/6);circle(c,cx+Math.sin(i*2+t*3)*8,mix(bot-26,liq+4,u),mix(3,6,u),null,'rgba(242,236,217,.85)',1.6);}
  c.restore();
  c.save();const outline=new Path2D();outline.moveTo(cx-36,top);outline.lineTo(cx-36,bot-36);outline.arc(cx,bot-36,36,Math.PI,0,true);outline.lineTo(cx+36,top);c.strokeStyle='rgba(220,240,255,.9)';c.lineWidth=3.5;c.stroke(outline);c.restore();
  line(c,[[cx-36,liq],[cx+36,liq]],'rgba(207,232,240,.75)',2.5);
}
function drawLime(c,s,t){
  const seeds=s.trial==='sprout',prog=s.started===null?0:clamp((t-s.started)/6),done=prog>=1;s.progress=prog;
  // left: the two groups and the textbook photographs
  panel(c,20,20,300,560);
  text(c,P('比較的兩組','The two groups'),170,56,24,C.yellow,'center');
  if(seeds){place(c,A_DIR+'mung_beans.png',30,70,280,126);text(c,P('乾燥','Dry'),100,222,22,C.white,'center');text(c,P('已萌芽','Germinated'),240,222,22,C.white,'center');text(c,P('AI 教學插圖','AI illustration'),170,252,22,C.muted,'center');}
  else{node(c,P('周圍空氣','Room air'),36,80,124,80,false);node(c,P('呼出的氣體','Exhaled air'),180,80,124,80,true,C.cyan);wrap(c,P('只改「通入的氣體」','Only the gas changes'),40,200,260,22,C.muted);}
  text(c,P('課本照片','Textbook photos'),170,300,22,C.muted,'center');
  D.round(c,32,312,124,100,10,'#0b0f0e');place(c,BOOK+'Im9987.png',34,314,120,96);
  D.round(c,184,312,124,100,10,'#0b0f0e');place(c,BOOK+'Im9986.png',186,314,120,96);
  arrow(c,158,362,182,362,C.yellow,3);
  text(c,P('澄清','Clear'),94,442,22,C.white,'center');text(c,P('混濁','Cloudy'),246,442,22,C.white,'center');
  wrap(c,P('白色沉澱支持：氣體中含有二氧化碳。','White precipitate = CO₂ is present.'),36,476,268,22,C.white);
  wrap(c,P('教師示範；不吸入、不飲用試液。','Teacher demo; never inhale or drink reagents.'),36,540,268,22,C.muted);
  // right: the setup model
  panel(c,340,20,600,560);
  const groups=seeds?[[P('乾燥綠豆','Dry beans'),'dry',.12],[P('萌芽綠豆','Germinated beans'),'sprout',1]]:[[P('周圍空氣','Room air'),'pump',.12],[P('呼出的氣體','Exhaled air'),'mouth',1]];
  groups.forEach(([name,kind,strength],i)=>{
    const cx=i?790:490,sx=cx-74;
    if(kind==='pump')pump(c,sx,120);else if(kind==='mouth')mouthpiece(c,sx,120,t);else flask(c,sx,130,kind,t);
    const tubeTop=kind==='pump'||kind==='mouth'?[sx,kind==='pump'?90:104]:[sx,56];
    line(c,[tubeTop,[sx,44],[cx,44],[cx,474]],'#cfe3ec',6);
    testTube(c,cx,strength*prog,prog,s.started!==null,t,i*.37);
    text(c,name,cx,540,22,C.white,'center');
    if(done)pill(c,i?P('明顯混濁','Clearly cloudy'):P('幾乎澄清','Nearly clear'),cx-70,222,{active:i===1,color:i?C.white:C.muted,maxX:cx+120,minX:cx-120});
  });
  if(s.started===null){c.save();c.setLineDash([8,6]);line(c,[[430,330],[850,330]],rgba(C.yellow,.8),2.5);c.restore();pill(c,P('同量、同液面','Same volume, same level'),540,282,{color:C.yellow,maxX:932});}
}

const tabs=[
 {id:'air_route',title:P('空氣走哪條路？','Which way does air go?'),sub:P('呼吸道的路線','The airway route'),hook:P('吸進去的空氣會先到胃嗎？從鼻開始，跟著藍點找出它要走的路。','Does inhaled air first reach the stomach? Start at the nose and follow the blue dots.'),body:P('點器官名稱或圖上的位置：那一段會從左圖拉出來放大；藍點是空氣走的路。','Choose an organ or tap the picture: that part is pulled out and enlarged. Blue dots show where air goes.'),reading:P('鼻腔、咽、喉、氣管、支氣管依序把空氣送向肺內肺泡。咽是兩條系統共用的一段，氣管與食道則不同。鼻毛與纖毛協助保護呼吸道；氣體交換主要不是在大氣管，而是在肺泡與周圍微血管。想一想：空氣通道若暢通，但肺泡交換表面受損，兩者是否仍能互相代替？','The nasal cavity, pharynx, larynx, trachea and bronchi conduct air toward alveoli. The pharynx is shared, but trachea and oesophagus are separate. Hairs and cilia protect airways. Gas exchange mainly occurs across alveoli and capillaries, not the large trachea. Can an open airway compensate fully for a damaged exchange surface?'),closure:P('通道負責運送空氣；肺泡表面負責與血液交換氣體。','Airways conduct air; alveolar surfaces exchange gases with blood.'),sources:[],init:()=>({running:true,organ:'nose',start:0}),controls:()=>[choice(P('放大觀察','Enlarge'),'organ',AIR.map(q=>[q.id,q.name]))],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>{const q=AIR.find(p=>p.id===s.organ)||AIR[0];return{title:q.name,text:q.text};},draw:drawAir},
 {id:'alveoli',title:P('進血液，出肺泡','Into blood, out to air'),sub:P('肺泡氣體交換','Alveolar gas exchange'),hook:P('肺泡裡有空氣，血管裡有血。氧氣要怎麼越過這個邊界？','Air is in alveoli and blood in vessels. How does oxygen cross that boundary?'),body:P('左邊從肺到肺泡一層層放大；右邊選氧氣或二氧化碳，看它們跨過薄壁的方向。紅血球始終留在血管裡。','The left side zooms from lung to alveoli. On the right, choose a gas and watch which way it crosses the thin walls; red cells stay in the vessel.'),reading:P('肺泡壁與微血管壁很薄，表面溼潤，肺泡眾多形成大的總表面積。氧氣由肺泡進血液，二氧化碳由血液進肺泡，隨呼氣離開；氣體各自依分壓差擴散，不是紅血球游進肺泡。血液含氧多呈鮮紅，含氧較少仍暗紅，絕不是藍血。大部分二氧化碳在運輸時以碳酸氫根形式存在血漿；這裡呈現的是交換方向而非全部化學步驟。','Thin moist alveolar and capillary walls and numerous alveoli provide a large exchange area. Oxygen diffuses into blood; carbon dioxide diffuses into alveoli to be exhaled. Each gas follows its partial-pressure gradient; red cells do not enter alveoli. Oxygen-rich blood is bright red and oxygen-poor blood dark red, never blue. Much transported carbon dioxide is plasma bicarbonate; this model shows exchange rather than every chemical step.'),closure:P('氧入血，二氧化碳入肺泡；交換小分子，不交換整顆紅血球。','Oxygen enters blood; carbon dioxide enters alveoli; molecules cross, not red cells.'),sources:[],init:()=>({running:true,gas:'both'}),controls:()=>[choice(P('追蹤氣體','Track gas'),'gas',[['both',P('兩種一起看','Both gases')],['oxygen',P('氧氣','Oxygen')],['co2',P('二氧化碳','Carbon dioxide')]])],explain:s=>({title:s.gas==='oxygen'?P('氧氣：肺泡進血液','Oxygen: alveolus to blood'):s.gas==='co2'?P('二氧化碳：血液進肺泡','Carbon dioxide: blood to alveolus'):P('兩種氣體，各有方向','Two gases, opposite directions'),text:P('氧氣由肺泡跨薄壁進入血液，紅血球由暗紅變鮮紅；二氧化碳由血液跨壁進入肺泡。動畫把分子放大供辨認，仍比紅血球小；肺泡、細胞和分子的實際尺寸沒有畫成同一比例。','Oxygen crosses the thin walls into blood and red cells turn from dark to bright red; carbon dioxide crosses toward the alveolus. Enlarged molecular symbols remain smaller than red cells. Alveolar, cellular and molecular sizes are not drawn to one scale.')}),draw:drawAlveoli},
 {id:'ventilation',title:P('誰把胸腔撐開？','What expands the chest?'),sub:P('橫膈與呼吸運動','Diaphragm and ventilation'),hook:P('吸氣時橫膈往上，還是往下？把動作停住，比較胸腔和肺的大小。','Does the diaphragm go up or down during inhalation? Hold a phase and compare chest and lungs.'),body:P('連續看吸氣／呼氣，或定格檢查；可切換胸腔圖與課本的瓶中氣球模型。','Watch the cycle or hold a phase; switch between the chest picture and the textbook bottle model.'),reading:P('吸氣時橫膈收縮、下降，肋骨上舉向外，胸腔體積增加，肺跟著擴張、空氣進入。平靜呼氣時相關肌肉放鬆，橫膈回升、肋骨回落向內，胸腔及肺變小，空氣排出。本頁依國中教學以動作與體積建立關係，不用壓力公式。瓶內氣球模型不呈現完整肋骨活動，不能等同於真人胸腔的全部構造；也不表示肺自己像幫浦般主動收縮。','During inhalation the diaphragm contracts downward, ribs lift outward, the chest enlarges and lungs expand as air enters. In quiet exhalation muscles relax, the diaphragm rises, ribs return inward, chest and lungs become smaller and air leaves. We use movement and volume, not pressure equations. The bottle model omits full rib movement and is not complete human anatomy. Lungs are not active muscular pumps.'),closure:P('吸氣：下、外、大、進；呼氣：上、內、小、出。','Inhale: down, outward, larger, air in; exhale: up, inward, smaller, air out.'),sources:[src('Im1612.png',P('拉下橡皮膜','Bottle membrane pulled down'),167,'5-12'),src('Im1613.png',P('橡皮膜回復','Bottle membrane returned'),167,'5-12')],init:()=>({running:true,mode:'auto',phase:'in',evidence:'chest',start:0,b:0}),controls:()=>[choice(P('觀察階段','Observe phase'),'mode',[['auto',P('連續呼吸','Continuous breathing')],['in',P('定格吸氣','Hold inhalation')],['out',P('定格呼氣','Hold exhalation')]]),choice(P('看哪一個','View'),'evidence',[['chest',P('胸腔構造','Chest anatomy')],['bottle',P('瓶中氣球模型','Bottle model')]])],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>({title:s.phase==='in'?P('吸氣：橫膈下降，胸腔增大','Inhale: diaphragm down, chest larger'):P('呼氣：橫膈回升，胸腔縮小','Exhale: diaphragm up, chest smaller'),text:s.phase==='in'?P('橫膈收縮下降，肋骨向上、向外，肺隨胸腔擴張，外界空氣進來。圖上的伸縮是動作放大示意。','The diaphragm contracts downward, ribs lift outward and lungs expand with the chest. Air flows inward. The stretching is an exaggerated model of the movement.'):P('平靜呼氣時肌肉放鬆，橫膈回升，肋骨向下、向內，胸腔與肺縮小，空氣沿原通道出去。這是呼吸運動，不是細胞內分解養分。','Quiet exhalation involves relaxation, a rising diaphragm and ribs moving down/inward. Chest and lungs shrink and air leaves by the same airway. This is ventilation, not nutrient breakdown inside cells.')}),draw:drawBreathing},
 {id:'cell_respiration',title:P('能量在細胞裡釋出','Energy released in cells'),sub:P('有氧呼吸作用','Aerobic cellular respiration'),hook:P('肺換進氧氣，卻沒有吃到飯。養分和氧氣在哪裡一起發揮作用？','The lungs take in oxygen, but do not eat food. Where do nutrients and oxygen work together?'),body:P('跟著六角形的葡萄糖和氧氣進入細胞；比較缺氧或缺養分時，此有氧模型能否持續。','Follow hexagonal glucose and oxygen into a cell; compare whether this aerobic model continues without oxygen or nutrients.'),reading:P('細胞利用氧氣分解養分，產生二氧化碳、水，並釋出可利用的能量。這裡以葡萄糖為例，六角形不是蔗糖的雙環符號。呼吸運動把空氣帶到肺，氣體交換與循環把氧氣帶給細胞，消化吸收提供養分；它們合作但不是同一過程。真核細胞的相關反應分布在細胞質與粒線體；本圖不是全部反應的分子機制。植物活細胞也需要呼吸；本頁缺原料的比較只針對有氧模型，不否定其他呼吸方式。','Cells use oxygen to break down nutrients, producing carbon dioxide and water and releasing usable energy. Glucose is a single hexagon, not the two-ring sucrose symbol. Ventilation, exchange, circulation and digestion supply inputs but are distinct processes. In eukaryotes relevant reactions involve cytoplasm and mitochondria; the display is not every biochemical mechanism. Plants also respire. Missing-input comparisons apply to this aerobic model, not all forms of respiration.'),closure:P('養分＋氧氣，經細胞呼吸產生 CO₂、水並釋出能量。','Nutrients + oxygen produce CO₂ and water and release energy through cellular respiration.'),sources:[],init:()=>({running:true,oxygen:true,nutrient:true,inspect:-1,stage:0}),controls:()=>[choice(P('氧氣','Oxygen'),'oxygen',[[true,P('有氧氣','Oxygen available')],[false,P('缺氧氣','Oxygen absent')]]),choice(P('養分','Nutrients'),'nutrient',[[true,P('有葡萄糖','Glucose available')],[false,P('缺葡萄糖','Glucose absent')]]),choice(P('慢慢拆解','Inspect sequence'),'inspect',[[-1,P('連續觀察','Continuous')],[0,P('原料','Inputs')],[1,P('轉換','Conversion')],[2,P('產物','Products')]])],explain:s=>({title:P('細胞內的物質轉變','Matter changes inside cells'),text:s.oxygen&&s.nutrient?P('葡萄糖與氧氣供有氧呼吸使用；輸出是二氧化碳與水，能量用黃色閃電表示，不是另一種分子。一個葡萄糖配六個氧是關係示意，不是實測速率或人體產量。','Glucose and oxygen supply aerobic respiration; outputs are carbon dioxide and water. The yellow bolts stand for released energy, not a molecule. One glucose with six oxygen shows a relationship, not measured rates or amounts.'):P('缺少這個有氧模型的必要原料，因此停止產物與能量的輸出；不同呼吸方式需另外討論，不能推成所有細胞都只會這一條路。','A necessary aerobic input is missing, so product and energy outputs stop in this model. Other respiration pathways require separate discussion; this is not every cell’s only pathway.')}),draw:drawCell},
 {id:'species',title:P('不用肺，也能交換','Gas exchange without lungs'),sub:P('鰓、氣管、皮膚與植物','Gills, tracheae, skin, plants'),hook:P('魚、昆蟲和樹都需要氧氣，卻不能全部替它們裝一對人的肺。','Fish, insects and trees need oxygen, but cannot all be given human lungs.'),body:P('選一種生物：上方圖片框出交換的位置，下方放大看氣體怎麼進出。','Choose an organism: the picture marks where exchange happens, and the close-up below shows how gases move.'),reading:P('交換構造常具薄、溼潤、表面積大的特徵，但運輸路徑各不相同。魚鰓把溶於水的氧氣交給血液；昆蟲氣管把氣體送近細胞；山椒魚溼潤皮膚也參與交換。植物可利用氣孔、皮孔與根部表皮和外界交換，日夜都進行細胞呼吸。想一想：昆蟲氣管和人的氣管同名，是否代表血液運氧的方式也完全一樣？','Exchange surfaces often are thin, moist and extensive, but transport routes differ. Fish gills pass dissolved oxygen to blood; insect tracheae reach tissues; salamander moist skin also exchanges gases. Plants exchange through stomata, lenticels and roots and respire day and night. Does the shared word trachea imply identical blood-based oxygen transport?'),closure:P('共同任務是氣體交換；器官與氣體輸送路徑不能混套。','The shared task is gas exchange; structures and transport routes are not interchangeable.'),sources:[],init:()=>({running:true,species:'fish',start:0}),controls:()=>[choice(P('比較','Compare'),'species',SPECIES.map(q=>[q.id,q.name]))],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>{const q=SPECIES.find(p=>p.id===s.species)||SPECIES[0];return{title:q.name,text:q.text};},draw:drawSpecies},
 {id:'evidence',title:P('透明怎麼變混濁？','Why does clear turn cloudy?'),sub:P('呼吸作用的氣體證據','Evidence of respiration'),hook:P('兩管同樣的石灰水，只有一管明顯混濁。你能從這個結果推到哪一步？','Two equal limewater samples; one becomes clearly cloudier. How far does that evidence let you infer?'),body:P('先看同量、同液面的起始條件，再啟動教師示範模型。切換人或萌芽綠豆比較。','Inspect equal starting volumes and levels, then start the teacher-demonstration model; compare human gas or germinated seeds.'),reading:P('澄清石灰水遇二氧化碳會產生白色沉澱，使液體混濁。這支持待測氣體含二氧化碳，不代表氣體只有二氧化碳。呼出的氣體仍含氧；環境空氣也不是完全沒有二氧化碳。萌芽與乾燥綠豆比較時，應控制樣本量、溫度、收集氣體方式、石灰水量與觀察時間；差異是定性證據，不能讀成精確產氣速率。操作限教師溫和示範，不吸入或飲用試液，不共用入口器材。課本另以試紙觀察水分，這裡不提供氯化亞鈷的實際準備或操作。','Carbon dioxide forms white precipitate in clear limewater. Cloudiness supports CO₂ being present, not being the only gas. Exhaled air still contains oxygen and ambient air contains CO₂. Seed comparisons require controlled mass, temperature, gas collection, limewater amount and observation time; the model provides qualitative evidence, not production rates. Demonstration is gentle and teacher-led: do not inhale or drink reagents or share mouth-contact equipment. The book also uses a water indicator; no cobalt-chloride preparation or handling is provided here.'),closure:P('控制起始條件，以白色沉澱支持「待測氣體含 CO₂」。','Control initial conditions; white precipitate supports CO₂ being present.'),record:P('記錄起始條件、前後差異，以及結果能支持和不能支持的結論。','Record initial conditions, before/after changes, and what the result does and does not support.'),sources:[src('Im9987.png',P('澄清石灰水原照片','Original clear limewater photograph'),171,'實驗5-2'),src('Im9986.png',P('混濁石灰水原照片','Original cloudy limewater photograph'),171,'實驗5-2')],init:()=>({running:true,trial:'human',action:'before',started:null,progress:0}),controls:()=>[choice(P('比較情境','Comparison'),'trial',[['human',P('呼出氣體','Exhaled gas')],['sprout',P('萌芽／乾燥綠豆','Germinated / dry seeds')]]),choice(P('實驗證據','Evidence'),'action',[['before',P('看初始狀態','Initial conditions')],['run',P('開始教師示範','Start teacher demonstration')]])],act:(s,k,v)=>{if(k==='action'){s.action=v;s.started=v==='run'?(s.elapsed||0):null;s.progress=0;}else{s[k]=v;s.action='before';s.started=null;s.progress=0;}},explain:s=>({title:s.progress?P('產生白色沉澱','White precipitate forms'):P('先確認相同起始條件','First ensure identical starting conditions'),text:s.progress?P('模型把沉澱畫成液體內的白色顆粒，未把整支試管塗白；左下是課本的觀察前後原照片。混濁只支持含有二氧化碳；不能據此斷言只有二氧化碳。','The model shows white grains within the liquid, not a white-painted tube; the textbook before/after photographs are at lower left. Cloudiness supports CO₂ being present, not being the only constituent.'):P('兩管的液面、體積與顏色相同，先觀察再開始。比較時一次只改待測氣體來源；示意時間不是真實實驗倒數，也不是學生的實測紀錄。','Both samples begin with identical levels, volumes and colour. Change only the gas source. Model time is not a real experimental countdown or a student measurement.')}),draw:drawLime}
];
B.register({id:'respiration',title:P('呼吸與氣體：空氣如何到達細胞？','Respiration: how does air reach our cells?'),subtitle:P('空氣的通道、肺泡交換、呼吸運動與細胞呼吸','Airways, alveolar exchange, breathing movements and cellular respiration'),cover:'assets/covers/biology_respiration_1009_v1.jpg',tabs});
})();

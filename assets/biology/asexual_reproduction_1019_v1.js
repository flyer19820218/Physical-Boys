/* Asexual reproduction · teacher-requested V5 remake, 2026-10-19.
 * Same six tabs, hooks, closures, readings and controls as asexual_reproduction_1009_v1.js.
 * Paramecium, yeast, starfish, Spirogyra and mould photographs stay as the textbook's original evidence.
 * Plant pictures are the teacher's Gemini AI teaching illustrations (asexual_ai_1019/sources.md).
 * Cells, spores, culture flasks, set-ups and the population model are drawn here; times are compressed.
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
const mixHex=(a,b,u)=>{const p=parseInt(a.slice(1),16),q=parseInt(b.slice(1),16),ch=s=>Math.round(mix(p>>s&255,q>>s&255,clamp(u)));return `rgb(${ch(16)},${ch(8)},${ch(0)})`;};
const source=(name,page,figure)=>({name:Array.isArray(name)?name:P(name,'Original textbook figure'),page,figure});

// ── drawing kit ────────────────────────────────────────────────────────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
const FONT=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
function text(c,p,x,y,size=22,color=C.white,align='left'){c.save();c.font=FONT(size);c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function wrap(c,p,x,y,w,size=22,color=C.white){
  const lh=Math.round(size*1.38),rows=splitLines(c,D.tr(p),w,size),PUNCT=/^[，。、；：！？）」』,.;:!?)]/;
  for(let i=1;i<rows.length;i++)while(PUNCT.test(rows[i])&&rows[i-1].length>1){
    if(/[A-Za-z]/.test(rows[i-1])){rows[i-1]+=rows[i][0];rows[i]=rows[i].slice(1).trimStart();}else{rows[i]=rows[i-1].slice(-1)+rows[i];rows[i-1]=rows[i-1].slice(0,-1);}}
  rows.filter(r=>r).forEach((r,i)=>text(c,r,x,y+i*lh,size,color));return rows.length*lh;}
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

const BOOK='assets/biology/ch7_reproduction_1009_v1/',AX='assets/biology/asexual_ai_1019/';
function unionEllipses(c,list,fill,stroke,w=6){
  c.save();c.lineWidth=w;c.strokeStyle=stroke;for(const [x,y,rx,ry,r=0] of list){c.beginPath();c.ellipse(x,y,rx,ry,r,0,TAU);c.stroke();}
  c.fillStyle=fill;for(const [x,y,rx,ry,r=0] of list){c.beginPath();c.ellipse(x,y,rx,ry,r,0,TAU);c.fill();}c.restore();
}
const inside=(px,py,[x,y,rx,ry])=>((px-x)/rx)**2+((py-y)/ry)**2<1;
function steps(c,names,cur,x,y,w,h=42,gap=8,color=C.yellow){names.forEach((p,i)=>{const yy=y+i*(h+gap);D.round(c,x,yy,w,h,10,i===cur?color:'rgba(11,26,21,.6)',i===cur?C.white:C.edge);text(c,`${i+1}. ${D.tr(p)}`,x+12,yy+h/2+8,22,i===cur?C.deep:C.white);});}
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*22,null,rgba(color,.9*(1-u)),3);circle(c,x,y,6,color,C.ink,2);}
function fadeLoop(tt,P){return clamp(Math.min(tt/.35,(P-tt)/.35));}

// ── Tab 1: fission and budding ─────────────────────────────────────────────
function cilia(c,cells,t,len=11){
  c.save();c.strokeStyle='rgba(214,240,232,.85)';c.lineWidth=2;c.lineCap='round';
  cells.forEach(([x,y,rx,ry],k)=>{const n=Math.round((rx+ry)/5);for(let i=0;i<n;i++){const q=i/n*TAU,px=x+rx*Math.cos(q),py=y+ry*Math.sin(q);
    if(cells.some((o,j)=>j!==k&&inside(px,py,o)))continue;
    let nx=Math.cos(q)/rx,ny=Math.sin(q)/ry;const L=Math.hypot(nx,ny);nx/=L;ny/=L;const w=Math.sin(t*9+i*.7)*.5;
    const ex=px+(nx*Math.cos(w)-ny*Math.sin(w))*len,ey=py+(ny*Math.cos(w)+nx*Math.sin(w))*len;c.beginPath();c.moveTo(px,py);c.lineTo(ex,ey);c.stroke();}});
  c.restore();
}
const FIS_NAMES=[P('細胞核複製','Nucleus copies'),P('從中間凹陷','Pinches in the middle'),P('分成兩個','Splits into two'),P('各自長大','Each grows')];
const BUD_NAMES=[P('長出小芽','A bud forms'),P('細胞核複製並分給芽','Nucleus into the bud'),P('芽體長大','The bud grows'),P('分離成新個體','It separates')];
function drawFission(c,t){
  const PER=7,tt=mod(t,PER),gen=Math.floor(t/PER)%4,CX=640,CY=290,A=180,B=70;
  const k1=ease((tt-1)/1.4),sep=ease((tt-2.4)/1.6),s2=ease((tt-4)/1),g=ease((tt-5)/1.4);
  const step=tt<2.4?0:tt<4?1:tt<5?2:3;
  c.save();c.globalAlpha=fadeLoop(tt,PER);
  let cells;
  if(tt<2.4)cells=[[CX,CY,A,B]];
  else{const a=mix(mix(A,A*.52,sep),130,g),d=mix(mix(0,A*.5,sep),145,s2),b=mix(B,64,sep)+6*g;cells=[[CX-d,CY,a,b],[CX+d,CY,a,b]];}
  cilia(c,cells,t);
  unionEllipses(c,cells,'#9fd3c4','#e3f5ef',5);
  cells.forEach(([x,y,rx,ry])=>{c.save();c.beginPath();c.moveTo(x-rx*.15,y-ry*.55);c.quadraticCurveTo(x+rx*.25,y-ry*.05,x+rx*.05,y+ry*.45);c.strokeStyle='rgba(47,96,80,.55)';c.lineWidth=4;c.stroke();c.restore();
    for(const sd of [-1,1]){const vx=x+sd*rx*.62;for(let i=0;i<6;i++){const q=i/6*TAU+t;line(c,[[vx,y],[vx+Math.cos(q)*ry*.2,y+Math.sin(q)*ry*.2]],'rgba(255,255,255,.55)',2);}circle(c,vx,y,ry*.1,'rgba(255,255,255,.75)');}});
  const nd=tt<2.4?A*.42*k1:0,NR=34;
  if(tt<2.4){for(const sd of [-1,1])ellipse(c,CX+sd*nd,CY+4,NR,NR*.7,'#8b6bb8','#d9c8f2',2.5);}
  else cells.forEach(([x,y])=>ellipse(c,x,y+4,NR*.9,NR*.65,'#8b6bb8','#d9c8f2',2.5));
  c.restore();
  pill(c,FIS_NAMES[step],360,36,{active:true,color:C.yellow,maxX:930});
  pill(c,P('細胞核','Nucleus'),360,440-40,{anchor:tt<2.4?[CX-nd,CY+4]:[cells[0][0],cells[0][1]+4],color:'#d9c8f2',maxX:930});
  pill(c,P('纖毛','Cilia'),780,92,{anchor:[cells[cells.length-1][0]+cells[cells.length-1][2]*.55,CY-cells[cells.length-1][3]-6],color:'#d6f0e8',maxX:930});
  // ideal doubling
  const gx=372;text(c,P('理想情況：每次分裂，個體數加倍','Ideally the number doubles each time'),gx,486,22,C.muted);
  [1,2,4,8].forEach((n,i)=>{const x0=gx+i*140,on=i===gen||i===gen+1;D.round(c,x0,500,122,66,10,on?'rgba(253,224,71,.14)':'rgba(11,26,21,.5)',on?C.yellow:C.edge);
    for(let j=0;j<n;j++){const cols=Math.min(n,4),r=Math.floor(j/4),q=j%4;ellipse(c,x0+18+q*(n>1?(cols>1?86/(cols-1):0):0)+(n===1?42:0),512+r*20+(n<=4?10:0),11,6,'#9fd3c4');}
    text(c,`${n}`,x0+108,560,22,on?C.yellow:C.white,'right');if(i<3)arrow(c,x0+124,533,x0+138,533,C.muted,3);});
  return step;
}
function drawBudding(c,t){
  const PER=7,tt=mod(t,PER),MX=600,MY=300,RX=105,RY=135,phi=-.75;
  const grow1=ease((tt-.6)/1.6),nk=ease((tt-2.2)/1.4),grow2=ease((tt-3.6)/1.4),sepK=ease((tt-5)/1.3);
  const step=tt<2.2?0:tt<3.6?1:tt<5?2:3,r=mix(0,42,grow1)+mix(0,40,grow2);
  const ex=MX+RX*Math.cos(phi),ey=MY+RY*Math.sin(phi),nx=Math.cos(phi)*RY,ny=Math.sin(phi)*RX,nl=Math.hypot(nx,ny),ux=nx/nl,uy=ny/nl;
  const bx=ex+ux*(r*.68+sepK*58),by=ey+uy*(r*.68+sepK*58);
  c.save();c.globalAlpha=fadeLoop(tt,PER);
  const cells=[[MX,MY,RX,RY]];if(r>1)cells.push([bx,by,r,r*1.12]);
  unionEllipses(c,cells,'#d1a15e','#f5dfb4',5);
  circle(c,MX-30,MY+40,32,'rgba(255,240,210,.45)');
  if(sepK>0)circle(c,ex-ux*4,ey-uy*4,14*sepK,null,'rgba(120,80,30,.8)',3);
  const home=[MX+10,MY-20],neck=[ex-ux*14,ey-uy*14];
  if(tt<2.2)ellipse(c,...home,26,20,'#8b6bb8','#d9c8f2',2.5);
  else{const a=[mix(home[0],neck[0],nk*.5),mix(home[1],neck[1],nk*.5)];ellipse(c,a[0],a[1],22,17,'#8b6bb8','#d9c8f2',2.5);
    const b2=[mix(home[0],bx,nk),mix(home[1],by,nk)];ellipse(c,b2[0],b2[1],mix(22,Math.max(14,r*.32),nk),mix(17,Math.max(11,r*.25),nk),'#8b6bb8','#d9c8f2',2.5);}
  c.restore();
  pill(c,BUD_NAMES[step],360,36,{active:true,color:C.yellow,maxX:930});
  pill(c,P('母細胞','Parent cell'),370,470,{anchor:[MX-60,MY+100],color:'#f5dfb4',maxX:930});
  if(r>20)pill(c,P('芽體','Bud'),760,110,{anchor:[bx,by-r*.6],color:'#f5dfb4',maxX:930});
  if(sepK>.5)pill(c,P('芽痕','Bud scar'),760,330,{anchor:[ex-ux*4,ey-uy*4],color:'#e8c79a',maxX:930});
  wrap(c,P('芽體比母細胞小，但一樣帶有完整的遺傳物質。','The bud is smaller, but it has a full copy of the genetic material.'),372,540,556,22,C.muted);
  return step;
}
function drawOneParent(c,s,t){
  const fis=s.mode==='fission';
  panel(c,20,20,300,560);
  text(c,fis?P('真實照片：草履蟲分裂','Real photo: paramecium'):P('真實照片：酵母菌出芽','Real photo: yeast budding'),36,54,22,C.yellow);
  D.round(c,30,66,280,214,12,'#0b1a15');place(c,BOOK+(fis?'Im578.png':'Im584.png'),34,70,272,206);
  panel(c,340,20,600,560);
  const st=fis?drawFission(c,t):drawBudding(c,t);
  steps(c,fis?FIS_NAMES:BUD_NAMES,st,34,296,272,42,8);
  wrap(c,P('不經過配子結合：新個體只有一個親代。','No gametes join: only one parent.'),36,526,268,22,C.white);
}

// ── Tab 2: fragmentation and spores ────────────────────────────────────────
function starArm(c,cx,cy,ang,L,W){if(L<2)return;c.save();c.translate(cx,cy);c.rotate(ang);c.beginPath();c.moveTo(0,-W);c.quadraticCurveTo(L*.6,-W*.55,L,0);c.quadraticCurveTo(L*.6,W*.55,0,W);c.closePath();
  const g=c.createLinearGradient(0,0,L,0);g.addColorStop(0,'#f97316');g.addColorStop(1,'#fb923c');c.fillStyle=g;c.fill();c.strokeStyle='#7c2d12';c.lineWidth=2;c.stroke();
  for(let i=1;i<L/16;i++){circle(c,i*16,((i*7)%5-2)*W*.12,2.6,'#fff1e6');}c.restore();}
function drawStarfish(c,t){
  const PER=8,tt=mod(t,PER),g=ease((tt-1)/5),CX=720,CY=300,base=-.35;
  c.save();c.globalAlpha=fadeLoop(tt,PER);
  for(let i=1;i<5;i++)starArm(c,CX,CY,base+i*TAU/5,mix(4,120,clamp(g*1.15-(i%2)*.1)),mix(8,24,g));
  starArm(c,CX,CY,base,150,26);
  circle(c,CX,CY,mix(20,34,g),'#f97316','#7c2d12',2);circle(c,CX,CY,6,'#fde68a');
  c.restore();
  const step=tt<1?0:g<.95?1:2;
  pill(c,[P('斷下的一段（含部分中央盤）','A broken piece (with part of the centre)'),P('長出新的腕','New arms grow'),P('長成一隻新海星','A whole new starfish')][step],476,36,{active:true,color:C.yellow,maxX:930});
  pill(c,P('原本的腕','Original arm'),760,470,{anchor:[CX+Math.cos(base)*110,CY+Math.sin(base)*110],color:C.orange,maxX:930});
  return step;
}
function drawSpirogyra(c,t){
  const PER=8,tt=mod(t,PER),br=ease((tt-1.2)/1.2),g=ease((tt-2.6)/3.6),W=30,H=30,frags=[[0,5],[5,4],[9,5]];
  c.save();c.globalAlpha=fadeLoop(tt,PER);
  frags.forEach(([i0,n],f)=>{const y=mix(300,190+f*110,br),wcell=W*(1+g),x0=mix(482+i0*W+(f)*0,500+(f===1?60:0),br);
    for(let j=0;j<n;j++){const x=x0+j*wcell;D.round(c,x,y-H/2,wcell-2,H,8,'rgba(134,239,172,.25)','#4ade80');
      c.save();c.beginPath();c.rect(x,y-H/2,wcell-2,H);c.clip();c.beginPath();for(let k=0;k<=24;k++){const u=k/24,xx=x+u*(wcell-2),yy=y+Math.sin(u*TAU*1.5+f)*H*.32;k?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle='#15803d';c.lineWidth=4;c.stroke();c.restore();
      if(g>.5)line(c,[[x+wcell/2-1,y-H/2+2],[x+wcell/2-1,y+H/2-2]],rgba('#4ade80',clamp((g-.5)*2)),2);}});
  c.restore();
  const step=tt<1.2?0:tt<2.6?1:2;
  pill(c,[P('一條絲狀的水綿','A Spirogyra filament'),P('斷成幾段','It breaks into pieces'),P('每段繼續分裂、變長','Each piece divides and grows')][step],476,36,{active:true,color:C.yellow,maxX:930});
  text(c,P('一格＝一個細胞；螺旋綠帶是葉綠體','One box = one cell; the green spiral is the chloroplast'),476,560,22,C.muted);
  return step;
}
function mould(c,t,penicillium){
  const PER=8,tt=mod(t,PER),burst=ease((tt-1.4)/.6),fly=clamp((tt-1.6)/2.6),germ=ease((tt-4.2)/2.6),col=penicillium?'#3fa58a':'#1f2937',hl=penicillium?'#a7f3d0':'#9ca3af';
  c.save();c.globalAlpha=fadeLoop(tt,PER);
  for(const [x0,w] of [[480,240],[760,160]]){D.round(c,x0,470,w,90,18,'#d6a35c','#8a5a2b');for(let i=0;i<8;i++)circle(c,x0+18+(i*37)%(w-30),488+(i*23)%60,4,'rgba(138,90,43,.5)');}
  c.save();c.strokeStyle='rgba(240,240,230,.85)';c.lineWidth=2.5;for(let i=0;i<9;i++){c.beginPath();c.moveTo(490+i*25,470);c.quadraticCurveTo(500+i*25,452,520+i*25,468);c.stroke();}c.restore();
  const stalks=[[520,330],[580,300],[640,345],[690,315]];
  stalks.forEach(([x,y],i)=>{line(c,[[x,470],[x+4,y]],'rgba(240,240,230,.9)',3.5);
    if(penicillium){for(const sd of [-1,0,1]){const bx=x+4+sd*12,by=y-14;line(c,[[x+4,y],[bx,by]],'rgba(240,240,230,.9)',2.5);for(let k=0;k<5;k++){if(burst>0&&k>=5-Math.ceil(burst*3))continue;circle(c,bx+sd*2,by-8-k*11,5.5,col,hl,1.5);}}}
    else if(burst<1){circle(c,x+4,y-16,mix(22,26,burst),col,hl,2);if(burst>0)circle(c,x+4,y-16,26*burst+6,null,rgba('#ffffff',.5*(1-burst)),2);}
    else{ellipse(c,x+4,y-6,10,6,'rgba(240,240,230,.9)');}});
  const N=16;for(let i=0;i<N;i++){if(fly<=0)break;const s=stalks[i%4],sx=s[0]+4,sy=s[1]-20,tx=780+(i*29)%130,ty=468,u=ease(fly*(1.2-(i%4)*.05)),x=mix(sx,tx,u)+Math.sin(u*Math.PI*2+i)*18,y=mix(sy,ty,u)-Math.sin(u*Math.PI)*120;
    circle(c,x,y,4.5,col,hl,1.2);
    if(u>=1&&germ>0){c.save();c.strokeStyle='rgba(240,240,230,.9)';c.lineWidth=2;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo(tx+10*germ,ty-8*germ,tx+(i%2?24:-20)*germ,ty-22*germ);c.stroke();c.restore();}}
  c.restore();
  const step=tt<1.4?0:tt<4.2?1:2;
  pill(c,[penicillium?P('孢子一串串長在菌絲頂端','Spores grow in chains on hyphae'):P('黑色孢子囊裡有很多孢子','A black sac holds many spores'),P('孢子散播出去','Spores are released and spread'),P('落到適合的地方，萌發長出菌絲','On a suitable spot they germinate')][step],476,36,{active:true,color:C.yellow,maxX:930});
  pill(c,P('食物（養分）','Food (nutrients)'),490,516,{color:'#f5dfb4',maxX:720});
  return step;
}
const FRAG=[{name:P('海星','Starfish'),file:'Im580.png',draw:drawStarfish,count:[P('一隻海星的一段','A piece of one starfish'),P('長成新的一隻','Grows into a new one'),'1 → 2'],compare:true},
 {name:P('水綿','Spirogyra'),file:'Im585.png',draw:drawSpirogyra,count:[P('一條水綿','One filament'),P('斷成幾段，各自長大','Pieces grow on'),'1 → 3']},
 {name:P('黑黴菌','Black mould'),file:'Im583.png',draw:(c,t)=>mould(c,t,false),count:[P('孢子','Spores'),P('萌發成新的黴菌','Germinate into new mould'),P('孢子 → 新個體','spore → new mould')]},
 {name:P('青黴菌','Penicillium'),file:'Im586.png',draw:(c,t)=>mould(c,t,true),count:[P('孢子','Spores'),P('萌發成新的黴菌','Germinate into new mould'),P('孢子 → 新個體','spore → new mould')]}];
function drawFragment(c,s,t){
  const q=FRAG[s.type];
  panel(c,20,20,420,560);
  text(c,P(`真實照片：${D.tr(q.name)}`,`Real photo: ${D.tr(q.name)}`),36,54,22,C.yellow);
  place(c,BOOK+q.file,30,66,400,250,{cover:true});
  if(q.compare){
    const box=(x,title,res,n,col)=>{D.round(c,x,340,192,226,14,'rgba(11,26,21,.6)',col);text(c,title,x+96,374,22,col,'center');wrap(c,res,x+14,412,166,22,C.white);text(c,n,x+96,548,30,col,'center');};
    box(32,P('海星斷下一段','A starfish piece'),P('長成一隻新的海星','grows into a whole new starfish'),'1 → 2',C.green);
    box(236,P('蜥蜴斷尾','A lizard tail'),P('尾巴長回來，還是同一隻（再生）','grows back, but it is still one lizard: regeneration'),'1 → 1',C.orange);
  }else{
    D.round(c,32,340,396,226,14,'rgba(11,26,21,.6)',C.edge);
    text(c,s.type===1?P('斷裂生殖','Fragmentation'):P('孢子繁殖','Spore reproduction'),230,376,26,C.yellow,'center');
    wrap(c,s.type===1?P('一段絲狀體繼續生長，就成為新的個體。','A piece of the filament keeps growing into a new individual.'):P('孢子很小、很輕，可隨空氣散播；孢子不是種子，也不是配子結合來的。','Spores are tiny and light and drift in air. They are not seeds, and not from gametes joining.'),48,416,364,22,C.white);
    text(c,s.type>=2?P('只看照片，不要打開或嗅聞黴菌','Photos only: never sniff mould'):'',230,548,22,C.muted,'center');
  }
  panel(c,460,20,480,560);
  q.draw(c,t);
}

// ── Tab 3: vegetative organs ───────────────────────────────────────────────
const VEG=[
 {name:P('石蓮：葉','Echeveria: leaf'),file:'echeveria_leaf.png',organ:'leaf',spots:[[1030,130],[1010,330]],labels:[[P('新芽','New shoot'),[1030,110],'r'],[P('新根','New roots'),[1000,360],'r'],[P('一片葉','One leaf'),[450,250],'l']],text:P('葉的基部可長出新芽與根；新植株不是由種子開始。','Plantlets and roots can develop at the leaf base, without starting from a seed.')},
 {name:P('落地生根：葉','Kalanchoe: leaf'),file:'kalanchoe_leaf.png',organ:'leaf',spots:[[330,110],[500,45],[830,60],[160,450],[430,430],[820,470]],labels:[[P('葉緣缺刻長出小植株','Plantlets in the leaf notches'),[500,45],'l'],[P('一片葉','One leaf'),[900,300],'r']],text:P('葉緣可出現小植株。根、莖、葉能不能繁殖，要看植物種類與所取部位。','Plantlets can form at leaf margins. Success depends on species and the part used.')},
 {name:P('草莓：匍匐莖','Strawberry: runner'),file:'strawberry_runner.png',organ:'stem',runner:[[420,470],[600,458],[850,478],[1050,498],[1210,515]],spots:[[1220,470]],labels:[[P('匍匐莖（貼著地面長的莖）','Runner (a stem)'),[800,472],'l'],[P('新植株，長出根','New plant with roots'),[1225,600],'r'],[P('母株','Parent plant'),[300,300],'l']],text:P('匍匐莖的節可生根、長新植株；草莓的果實不是此無性生殖的起點。','Runner nodes form roots and new plants; the fruit is not the starting organ in this method.')},
 {name:P('馬鈴薯：塊莖','Potato: stem tuber'),file:'potato_sprouts.png',organ:'stem',spots:[[470,160],[890,90],[1160,210],[1290,300],[130,370],[810,370],[380,560]],labels:[[P('芽眼長出芽','Shoots from the eyes'),[470,160],'l'],[P('塊莖（是莖，不是根）','Stem tuber (a stem, not a root)'),[700,430],'r']],text:P('馬鈴薯是塊莖，芽眼是芽的位置，不能因為長在土裡就說是根。','Potato is a stem tuber with buds at its eyes; underground does not automatically mean root.')},
 {name:P('番薯：塊根','Sweet potato: storage root'),file:'sweet_potato_root.png',organ:'root',spots:[[330,370]],labels:[[P('長出新芽','New shoots'),[330,330],'l'],[P('塊根（是根）','Storage root (a root)'),[720,560],'r']],text:P('番薯的塊根可長新芽；也可取有節的莖扦插，兩種營養器官不要混在一起。','Sweet-potato storage roots can sprout; stems with nodes can also be used as cuttings. Distinguish the organs.')},
 {name:P('番薯：莖','Sweet potato: stem'),file:'sweet_potato_cutting.png',organ:'stem',spots:[[590,690],[770,760],[950,800]],labels:[[P('土裡的節長出新根','New roots from buried nodes'),[770,760],'r'],[P('剪下的莖','A cut stem'),[420,380],'l']],text:P('有節的莖可扦插，長出根和新芽；是否成功仍要觀察實際條件。','Stem cuttings with nodes can develop roots and shoots; record actual outcomes under your conditions.')}
];
function organIcon(c,kind,x,y,col){
  if(kind==='leaf'){c.save();c.translate(x,y);c.rotate(-.5);c.beginPath();c.moveTo(-26,0);c.bezierCurveTo(-10,-20,14,-18,28,0);c.bezierCurveTo(14,18,-10,20,-26,0);c.fillStyle=col;c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();line(c,[[-22,0],[24,0]],C.ink,1.6);c.restore();}
  else if(kind==='stem'){line(c,[[x,y+30],[x,y-30]],col,7);for(const yy of [y-10,y+12]){circle(c,x,yy,5,C.ink);ellipse(c,x+14,yy-6,12,6,col,C.ink,1.5,-.5);}}
  else{line(c,[[x,y-28],[x,y+30]],col,8);line(c,[[x,y],[x-16,y+22]],col,4);line(c,[[x,y+8],[x+15,y+28]],col,4);line(c,[[x,y-10],[x+14,y+6]],col,3);}
}
function drawVeg(c,s,t){
  const q=VEG[s.plant];
  panel(c,20,20,600,560);
  text(c,q.name,40,58,28,C.yellow);
  const f=place(c,AX+q.file,40,80,560,390);
  if(f){if(q.runner){line(c,q.runner.map(p=>f.map(...p)),rgba(C.yellow,.5),3);const u=mod(t*.25),[x,y]=f.map(...along(q.runner,u));glow(c,x,y,18,C.yellow,.6);circle(c,x,y,6,C.yellow,C.ink,2);}
    q.spots.forEach((p,i)=>pulse(c,...f.map(...p),t+i*.23));
    q.labels.forEach(([p,a,side])=>{const [ax,ay]=f.map(...a),w=measure(c,p,22)+28;pill(c,p,side==='r'?Math.min(600-w,ax+30):Math.max(40,ax-w-30),Math.max(84,Math.min(430,ay-60)),{anchor:[ax,ay],color:C.white,maxX:604,minX:36});});}
  wrap(c,q.text,40,506,560,22,C.white);
  panel(c,640,20,300,560);
  text(c,P('用哪一種器官？','Which organ?'),790,62,26,C.yellow,'center');
  [['root',P('根','Root')],['stem',P('莖','Stem')],['leaf',P('葉','Leaf')]].forEach(([k,p],i)=>{const y=82+i*112,on=q.organ===k;D.round(c,656,y,268,96,16,on?'rgba(253,224,71,.18)':'rgba(11,26,21,.5)',on?C.yellow:C.edge);
    organIcon(c,k,706,y+48,k==='leaf'?'#6fae4b':k==='stem'?'#8cb875':'#d9b98a');text(c,p,780,y+60,32,on?C.yellow:C.white);if(on)text(c,'✓',904,y+60,32,C.yellow,'right');});
  D.round(c,656,424,268,140,14,'rgba(11,26,21,.5)',C.edge);
  text(c,P('長在土裡 ≠ 一定是根','Underground ≠ root'),790,458,22,C.orange,'center');
  wrap(c,P('馬鈴薯有芽眼，是莖；番薯是根。','A potato has eyes: a stem. A sweet potato is a root.'),670,494,240,22,C.white);
}

// ── Tab 4: tissue culture ──────────────────────────────────────────────────
const CUL_NAMES=[P('取一小塊植物組織','Take a small piece of tissue'),P('細胞分裂變多，再分化','Cells multiply, then differentiate'),P('長成許多小植株','Many small plantlets grow')];
function flask(c){const p=new Path2D();p.moveTo(600,96);p.lineTo(600,170);p.lineTo(470,470);p.quadraticCurveTo(462,500,492,500);p.lineTo(808,500);p.quadraticCurveTo(838,500,830,470);p.lineTo(700,170);p.lineTo(700,96);return p;}
function plantlet(c,x,y,s,sway){if(s<=.02)return;const h=34*s;c.save();c.translate(x,y);c.rotate(sway*.06);line(c,[[0,0],[0,-h]],'#3f7a34',3);
  [[-1,.45],[1,.7],[-1,.95]].forEach(([a,f])=>{c.save();c.translate(0,-h*f);c.rotate(a*.6);ellipse(c,a*9*s,0,11*s,5*s,'#6fbf4f','#2f6b2a',1.2);c.restore();});
  for(const a of [-.4,0,.4])line(c,[[0,0],[Math.sin(a)*14*s,16*s]],'rgba(245,240,220,.8)',1.5);c.restore();}
function drawCulture(c,s,t){
  let g;if(s.stage<0){const tt=mod(t,10);g=tt/10;}else g=mix(s.from??0,[.2,.55,1][s.stage],ease((t-(s.start||0))/1.4));
  const fade=s.stage<0?fadeLoop(mod(t,10),10):1;
  panel(c,20,20,300,560);
  text(c,P('同一品種的蝴蝶蘭','One orchid variety'),36,54,22,C.yellow);
  place(c,AX+'orchid_pot.png',30,64,280,220);
  text(c,P('實際的培養瓶','Real culture flasks'),36,322,22,C.yellow);
  place(c,AX+'culture_flasks.png',30,332,280,164);
  wrap(c,P('AI 教學插圖','AI teaching illustrations'),36,540,268,22,C.muted);
  panel(c,340,20,600,560);
  const F=flask(c);c.save();c.fillStyle='rgba(220,240,255,.07)';c.fill(F);c.clip(F);c.fillStyle='rgba(250,232,160,.55)';c.fillRect(440,430,420,80);c.restore();
  D.round(c,590,72,120,30,8,'#3b6fd1','#1e3a8a');
  c.save();c.globalAlpha=fade;
  const st=g<.25?0:g<.6?1:2;
  if(g<.25){const u=ease(g/.25*1.4),y=mix(120,420,u);ellipse(c,650,y,22,13,'#7fb85a','#2f6b2a',2);}
  else{const k=clamp((g-.25)/.35),n=Math.round(mix(1,26,k));for(let i=0;i<n;i++){const a=i*2.4,r=7*Math.sqrt(i);circle(c,650+Math.cos(a)*r*1.6,424-Math.abs(Math.sin(a))*r*.7,8,'#b9e39a','#5f8f3f',1.2);}
    if(g>.45){const m=clamp((g-.45)/.55);for(let i=0;i<9;i++){const x=500+i*38,sm=clamp(m*1.3-(i%3)*.12);plantlet(c,x,430,sm*1.3,Math.sin(t*1.5+i));}}}
  c.restore();
  c.save();c.strokeStyle='rgba(220,240,255,.9)';c.lineWidth=4;c.stroke(F);c.restore();
  pill(c,CUL_NAMES[st],360,36,{active:true,color:C.yellow,maxX:930});
  pill(c,P('培養基：養分＋植物激素','Medium: nutrients + plant hormones'),360,504,{anchor:[520,470],color:'#fde68a',maxX:930});
  pill(c,P('瓶子封好、無菌','Sealed and sterile'),730,86,{anchor:[710,88],color:'#93c5fd',maxX:930});
  text(c,P('1 小塊 → 很多株，特徵和母株相同','1 small piece → many plants, same traits'),640,572,22,C.green,'center');
  return st;
}

// ── Tab 5: two-week investigation (the result is left for students) ────────
const INV={0:{name:P('落地生根','Kalanchoe'),file:'kalanchoe_plant.png',leafBox:[0,640,165,170],stemBox:[215,250,130,330],leaf:'scallop'},1:{name:P('薄荷','Mint'),file:'mint_plant.png',leafBox:[30,290,115,115],stemBox:[420,100,100,330],leaf:'serrate'}};
function leafShape(c,x,y,L,W,rot,kind,fill){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();const n=kind==='scallop'?7:12;
  c.moveTo(-L/2,0);for(let i=0;i<=n;i++){const u=i/n,xx=-L/2+u*L,yy=-Math.sin(u*Math.PI)*W;const mid=-L/2+(i-.5)/n*L,bump=kind==='scallop'?W*.18:W*.12;if(i)c.quadraticCurveTo(mid,-Math.sin((i-.5)/n*Math.PI)*W-bump,xx,yy);}
  for(let i=n;i>=0;i--){const u=i/n,xx=-L/2+u*L,yy=Math.sin(u*Math.PI)*W*.95;c.lineTo(xx,yy);}
  c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle='#2f5f2a';c.lineWidth=2;c.stroke();line(c,[[-L/2+4,0],[L/2-4,0]],'rgba(47,95,42,.8)',2);c.restore();}
function drawInvestigate(c,s,t){
  const q=INV[s.plant],leafOrg=s.organ==='leaf',day=1+Math.floor(mod(t/.7,14)),night=mod(t/.7,1)>.6;
  panel(c,20,20,300,560);
  text(c,q.name,36,58,28,C.yellow);
  const f=place(c,AX+q.file,40,74,260,380);
  if(f){const b=f.rect(leafOrg?q.leafBox:q.stemBox);dashedBox(c,b);pill(c,leafOrg?P('取一片葉','Take a leaf'):P('取一段有節的莖','Take a stem with nodes'),40,470,{anchor:[b[0]+b[2]/2,b[1]+b[3]],color:C.yellow,maxX:310});}
  wrap(c,P('老師指導下取健康的部位','Take healthy parts with your teacher'),36,540,268,22,C.muted);
  panel(c,340,20,600,560);
  // day counter
  c.save();c.globalAlpha=.9;if(night){circle(c,890,70,18,'#f2ecd9');circle(c,898,64,16,'#16332b');}else{glow(c,890,70,40,C.yellow,.45);D.sphere(c,890,70,16,C.yellow);}c.restore();
  text(c,P(`第 ${day} 天`,`Day ${day}`),860,78,26,C.white,'right');
  // the setup
  if(leafOrg){ellipse(c,640,350,210,52,'rgba(220,240,255,.12)','rgba(220,240,255,.85)',3);ellipse(c,640,338,186,34,'#e8e6dc','#c9c4b2',2);
    for(let i=0;i<14;i++)circle(c,480+(i*53)%320,326+(i*17)%26,6,'rgba(255,255,255,.5)');
    leafShape(c,640,318,q.leaf==='scallop'?240:170,q.leaf==='scallop'?48:44,-.05,q.leaf,q.leaf==='scallop'?'#7fae6a':'#5fae4b');
    const dr=mod(t*.5,1);if(day%3===0){D.round(c,700,150,18,60,6,'rgba(220,240,255,.5)','#cfe3ec');drop(c,709,230+dr*60,7,dr);}
    pill(c,P('濕棉花（保持濕潤）','Moist cotton (keep it damp)'),360,420,{anchor:[520,350],color:'#e8e6dc',maxX:930});}
  else{const BX=540,BY=196,BW=200,BH=254;c.save();c.fillStyle='rgba(56,189,248,.28)';c.fillRect(BX+6,BY+110,BW-12,BH-116);c.restore();
    line(c,[[BX,BY],[BX,BY+BH],[BX+BW,BY+BH],[BX+BW,BY]],'rgba(220,240,255,.9)',4);for(let i=1;i<5;i++)line(c,[[BX+BW-30,BY+BH-i*50],[BX+BW-6,BY+BH-i*50]],'rgba(220,240,255,.6)',2);
    const sx=640,sw=Math.sin(t*1.2)*3;line(c,[[sx+sw,120],[sx,BY+BH-40]],q.leaf==='scallop'?'#8cb875':'#6b8f4e',q.leaf==='scallop'?12:8);
    for(const ny of [170,290,380]){circle(c,sx+(ny-120)/(BY+BH-160)*-sw+sw,ny,7,'#3f6b34');}
    for(const [ny,sd] of [[170,-1],[170,1]])leafShape(c,sx+sw+sd*58,ny-10,q.leaf==='scallop'?110:80,q.leaf==='scallop'?24:20,sd*.35+(sd<0?Math.PI:0),q.leaf,q.leaf==='scallop'?'#7fae6a':'#5fae4b');
    line(c,[[BX+6,BY+110+Math.sin(t*2)*1.5],[BX+BW-6,BY+110-Math.sin(t*2)*1.5]],'rgba(186,230,253,.9)',2.5);
    pill(c,P('節','Node'),700,268,{anchor:[sx,290],color:C.white,maxX:930});pill(c,P('燒杯裡的水','Water in a beaker'),758,356,{anchor:[BX+BW-10,390],color:C.cyan,maxX:930});}
  // record sheet
  const TX=360,TY=470;D.round(c,TX,TY,560,96,10,'rgba(11,26,21,.7)',C.edge);
  [P('日期','Date'),P('新芽','Shoots'),P('新根','Roots')].forEach((p,i)=>text(c,p,TX+20+i*130,TY+30,22,C.muted));
  text(c,P(`第 ${day} 天`,`Day ${day}`),TX+20,TY+70,22,C.white);text(c,'？',TX+170,TY+70,24,C.yellow);text(c,'？',TX+300,TY+70,24,C.yellow);
  wrap(c,P('結果由你觀察後填寫','Fill in what you observe'),TX+380,TY+44,170,22,C.yellow);
}
function drop(c,x,y,r,a=1){c.save();c.globalAlpha=1-a;c.beginPath();c.moveTo(x,y-r*1.6);c.bezierCurveTo(x+r*1.1,y-r*.4,x+r,y+r,x,y+r);c.bezierCurveTo(x-r,y+r,x-r*1.1,y-r*.4,x,y-r*1.6);c.fillStyle='rgba(125,211,252,.9)';c.fill();c.restore();}

// ── Tab 6: same traits — convenient, but shared risk ───────────────────────
const TRAIT=['#4caf50','#9acd32','#2e8b57','#7cc96b','#3aa58a'],SEX_T=[1,2,3,0,2,1,3,4],SURVIVE=new Set([1,4,6]);
function plantIcon(c,x,y,s,trait,wilt,a=1){
  c.save();c.globalAlpha=a;c.translate(x,y);c.scale(s,s);const col=mixHex(TRAIT[trait],'#8b6a3a',wilt);
  line(c,[[0,0],[wilt*8,-60+wilt*10]],mixHex('#3f7a34','#6b5330',wilt),5);
  [[-1,-22,.5],[1,-34,.6],[-1,-46,.7],[1,-56,.8]].forEach(([sd,yy,k])=>{c.save();c.translate(wilt*8*(-yy/60),yy);c.rotate(sd*(.5+wilt*1.1));ellipse(c,sd*16*k,0,18*k+4,7,col,'#1f3d1a',1.5);c.restore();});
  ellipse(c,0,4,24,6,'#5a3b22');c.restore();
}
function drawDiversity(c,s,t){
  if(s.method==='banana'){drawBanana(c,t);return;}
  const asex=s.method==='asexual',PER=10,tt=mod(t,PER),fade=fadeLoop(tt,PER),born=clamp(tt/2.4),wave=clamp((tt-2.6)/2),wiltK=ease((tt-4.4)/2);
  panel(c,20,20,920,450);
  c.save();c.globalAlpha=fade;
  const parents=asex?[[120,250,0]]:[[90,180,1],[150,330,2]];
  text(c,asex?P('親代（1 個）','Parent (1)'):P('親代（2 個）','Parents (2)'),120,60,24,C.yellow,'center');
  parents.forEach(([x,y,tr])=>plantIcon(c,x,y,1.3,tr,0));
  if(!asex)text(c,'＋',120,262,30,C.white,'center');
  const kids=[];for(let i=0;i<8;i++)kids.push([330+(i%4)*165,i<4?220:390]);
  text(c,P('子代','Offspring'),660,60,24,C.yellow,'center');
  kids.forEach(([x,y],i)=>{const k=clamp(born*1.6-i*.08),tr=asex?0:SEX_T[i],ill=asex||!SURVIVE.has(i);
    if(k>0&&k<1){parents.forEach(([px,py])=>{c.save();c.setLineDash([6,6]);line(c,[[px+20,py-30],[x,y-30]],rgba(C.white,.35*(1-k)),2);c.restore();});}
    plantIcon(c,x,y,1.15*ease(k),tr,ill?wiltK:0);
    if(wiltK>.6&&!ill)glow(c,x,y-30,46,C.green,.25);});
  if(wave>0&&wave<1)for(let i=0;i<40;i++){const x=mix(260,980,wave)-((i*53)%300),y=110+(i*37)%320;if(x>260&&x<930)circle(c,x,y,4,'#c2803a','#6b3f15',1);}
  c.restore();
  if(wave>0)pill(c,P('同一種病原來了','The same pathogen arrives'),330,86,{active:wave<1,color:C.orange,maxX:930});
  panel(c,20,486,920,94);
  const res=asex?P('子代特徵幾乎相同：同一種病原來了，可能全部都受影響','Offspring are nearly identical: one pathogen may affect them all'):P('子代各有差異：有些受影響、有些存活','Offspring differ: some are affected, some survive');
  wrap(c,tt>5.6?res:(asex?P('一個親代，不經配子結合：子代和親代很相似','One parent, no gametes: offspring closely resemble it'):P('兩個親代的遺傳物質重新組合：子代各不相同','Two parents’ genes recombine: each offspring differs')),40,526,880,22,tt>5.6?(asex?C.orange:C.green):C.white);
  text(c,P('概念模型：顏色只代表特徵不同，數量不是實際比例','Concept model: colours only mark different traits; numbers are not real ratios'),40,570,22,C.muted);
}
const BAN_SPOTS=[[320,880],[440,830],[615,830],[735,700],[915,800]];
const BAN_NAMES=[P('用吸芽或組織培養繁殖','Grown from suckers or tissue culture'),P('大量、特徵一致的香蕉','Many bananas with the same traits'),P('黃葉病：病原阻礙木質部運水','Fusarium wilt blocks water transport in xylem'),P('同一品種大多一起受影響','One variety is mostly affected together'),P('對策：圍堵病區、選育耐病品種','Response: contain it, breed resistant varieties')];
function drawBanana(c,t){
  panel(c,20,20,460,560);
  text(c,P('香蕉的吸芽','Banana suckers'),36,56,24,C.yellow);
  const f=place(c,AX+'banana_suckers.png',30,66,440,456);
  if(f){BAN_SPOTS.forEach((p,i)=>pulse(c,...f.map(...p),t+i*.2,C.yellow,12));
    pill(c,P('吸芽：從母株基部長出','Suckers grow from the base'),220,90,{anchor:f.map(735,690),color:C.yellow,maxX:470});
    pill(c,P('母株','Parent plant'),36,300,{anchor:f.map(530,640),color:C.white,maxX:470});}
  text(c,P('AI 教學插圖','AI teaching illustration'),36,566,22,C.muted);
  panel(c,500,20,440,560);
  place(c,AX+'culture_flasks.png',512,34,416,150);
  text(c,P('組織培養苗','Tissue-culture plantlets'),720,206,22,C.muted,'center');
  const cur=Math.floor(t/1.6)%BAN_NAMES.length;
  BAN_NAMES.forEach((p,i)=>{const y=222+i*70;if(i)arrow(c,720,y-16,720,y-2,C.muted,3.5);node(c,p,516,y,408,54,i===cur,i>=2&&i<=3?C.orange:C.green);});
}

const tabs=[
{id:'oneparent',title:P('不用配子結合','No gamete fusion'),sub:P('分裂與出芽生殖','Fission and budding'),hook:P('一個草履蟲變成兩個，是長大而已，還是產生了新個體？','One paramecium becomes two. Is that just growth, or reproduction?'),body:P('無性生殖不經配子結合。比較分裂生殖與出芽生殖：新個體的形成方式不同，不要只看有沒有細胞分裂。','Asexual reproduction lacks gamete fusion. Compare fission and budding, not merely whether cells divide.'),closure:P('分裂生殖把一個個體分成新個體；出芽生殖由母體長出芽體，再形成新個體。','Fission divides an individual; budding grows a new individual from a bud on the parent.'),sources:[source(P('草履蟲分裂原照片','Paramecium fission photo')),source(P('酵母菌出芽原照片','Yeast budding photo'))],init:()=>({running:true,mode:'fission'}),controls:()=>[choice(P('生殖方式','Method'),'mode',[['fission',P('分裂：草履蟲','Fission: paramecium')],['bud',P('出芽：酵母菌','Budding: yeast')]])],explain:s=>({title:s.mode==='fission'?P('一個分為兩個','One divides into two'):P('小芽長大再離開','A bud grows and separates'),text:s.mode==='fission'?P('模型用兩個新個體顯示分裂結果。若每一個都再分裂，理想化的三輪可由1變8；實際族群還受環境限制。','The model shows two new individuals. If all divide each round, three idealized rounds turn one into eight; real populations face limits.'):P('芽體由小到大，再離開母體；大小不同，不等於沒有複製遺傳物質。左側是真實酵母菌照片。','The bud grows and separates. Unequal size does not mean genetic material was not copied. Left is the real yeast photo.')}),draw:drawOneParent},
{id:'fragment',title:P('再生，不一定是繁殖','Regrowth is not always reproduction'),sub:P('斷裂生殖與孢子','Fragmentation and spores'),hook:P('蜥蜴尾巴長回來，就多出一隻蜥蜴了嗎？','Does regrowing a lizard tail produce another lizard?'),body:P('能從片段長成完整新個體，才是此處的斷裂生殖；只修補受損部分是再生。黴菌也能以孢子散播到適當環境後萌發。','Fragmentation produces whole new individuals from pieces; repair alone is regeneration. Mould spores disperse and germinate in suitable conditions.'),closure:P('斷裂生殖要形成新個體；孢子不是種子，也不是配子結合的結果。','Fragmentation must yield a new individual; spores are not seeds or a result of gamete fusion in this model.'),sources:[source(P('海星斷裂生殖原照片','Starfish fragmentation photo')),source(P('水綿與黴菌原照片','Spirogyra and mould photos'))],init:()=>({running:true,type:0}),controls:()=>[choice(P('比較','Compare'),'type',[[0,P('海星','Starfish')],[1,P('水綿','Spirogyra')],[2,P('黑黴菌','Black mould')],[3,P('青黴菌','Penicillium')]])],explain:s=>({title:[P('片段須能形成完整新個體','The fragment must form a new individual'),P('絲狀個體的片段繼續生長','Filament fragments grow'),P('孢子散播與萌發','Spore dispersal and germination'),P('孢子繁殖，非種子繁殖','Spores, not seeds')][s.type],text:s.type===0?P('並非所有海星或任意斷腕都能形成新個體。照片顯示可發育的片段；不能把動物切割當成學生實作。','Not every species or detached arm becomes a new starfish. The photo shows a viable fragment; do not perform animal cutting as an activity.'):s.type===1?P('水綿片段在適當環境可繼續生長形成新個體。斷裂生殖與一般傷口修補，判斷重點是有沒有增加個體。','Spirogyra fragments can grow into new individuals. Distinguish reproduction from repair by whether individuals increase.'):P('照片是黴菌菌絲與產生孢子的構造。用照片觀察即可；不要打開、嗅聞或培養未知黴菌。','The photo shows hyphae and spore-producing structures. Observe photographs; do not open, sniff or culture unknown mould.')}),draw:drawFragment},
{id:'vegetative',title:P('哪個器官長新株？','Which organ starts a plant?'),sub:P('根、莖、葉繁殖','Vegetative reproduction'),hook:P('馬鈴薯和番薯都埋在土裡，繁殖器官就一定相同嗎？','Potato and sweet potato are both underground. Are they the same organ?'),body:P('選不同植物，看新植株從哪個部位長出來。能不能繁殖，要看植物種類及營養器官，不是隨便一片葉都可以。','Choose a plant and see where the new plant grows from. Success depends on species and organ, not any random leaf.'),closure:P('營養器官繁殖可利用根、莖或葉；馬鈴薯塊莖與番薯塊根是不同器官。','Vegetative reproduction uses roots, stems or leaves; potato stem tubers and sweet-potato storage roots differ.'),sources:[],init:()=>({running:true,plant:0}),controls:()=>[choice(P('植物與器官','Plant and organ'),'plant',VEG.map((q,i)=>[i,q.name]))],explain:s=>({title:VEG[s.plant].name,text:VEG[s.plant].text}),draw:drawVeg},
{id:'culture',title:P('一小塊，也能成株','A small piece becomes a plant'),sub:P('組織培養','Tissue culture'),hook:P('園藝店那麼多相似蘭花，都是一顆顆種子慢慢種出來的嗎？','Are all those similar orchids grown individually from seeds?'),body:P('組織培養把適當植物組織放在有養分與激素的培養基，在無菌條件下生長、分裂與分化。','Tissue culture uses suitable plant tissue on a medium with nutrients and hormones, under sterile conditions for growth and differentiation.'),closure:P('組織培養不是把任何碎片放進普通水；需適當組織、培養基與無菌條件。','Tissue culture is not any fragment in ordinary water: suitable tissue, medium and sterile conditions matter.'),sources:[],init:()=>({running:true,stage:-1,start:0}),controls:()=>[choice(P('觀察階段','Stage'),'stage',[[-1,P('連續觀察','Continuous')],[0,P('植物組織','Tissue')],[1,P('增殖與分化','Multiply and differentiate')],[2,P('小植株','Plantlets')]])],act(s,k,v){s.from=s.stage>=0?[.2,.55,1][s.stage]:0;s[k]=v;s.start=s.elapsed;},explain:s=>({title:P('有控制條件的植物繁殖','Plant propagation under controlled conditions'),text:P('培養瓶中的生長是時間壓縮概念模型；不是幾秒就長成蘭花，也不顯示學生可直接照做的無菌操作配方。','Growth in the bottle is time-compressed. An orchid does not grow in seconds; this is not a sterile-culture recipe for unsupervised use.')}),draw:drawCulture},
{id:'investigate',title:P('兩週，自己找證據','Two weeks to find evidence'),sub:P('營養器官繁殖觀察','Propagation investigation'),hook:P('落地生根的葉能長小苗，那薄荷的葉也一定可以嗎？','If a kalanchoe leaf grows plantlets, must a mint leaf do so too?'),body:P('比較落地生根和薄荷的葉、莖。維持濕棉花或燒杯水分，持續兩週記錄新芽與新根；不要把模型預測填成實測結果。','Compare leaves and stems of kalanchoe and mint. Maintain moisture and record roots and shoots for two weeks; predictions are not observations.'),closure:P('用相同觀察項目比較不同植物與器官，證據才能回答哪些部位能繁殖。','Use the same observations across species and organs to establish which parts propagate.'),record:P('植物／器官／日期／新芽／新根。兩週後比較：同一株的營養器官是否都能繁殖？控制了哪些條件？','Record species, organ, date, shoots and roots. After two weeks, compare organs and identify controlled conditions.'),reading:P('老師指導取有節的健康莖，葉放在濕棉花上，莖放入燒杯水中。每次記錄水分、光照與變化；不要只比較一天，也不要把失敗樣本丟掉不記錄。','Under teacher guidance use healthy stem cuttings with nodes, leaves on moist cotton and stems in water. Record moisture, light and changes, including failed samples.'),sources:[],init:()=>({running:true,plant:0,organ:'leaf'}),controls:()=>[choice(P('植物','Plant'),'plant',[[0,P('落地生根','Kalanchoe')],[1,P('薄荷','Mint')]]),choice(P('器官','Organ'),'organ',[['leaf',P('葉與濕棉花','Leaf on moist cotton')],['stem',P('有節的莖與水','Stem with nodes in water')]])],explain:s=>({title:P('先預測，再用實際結果判斷','Predict, then judge from observations'),text:P('左邊是所選植物；右邊呈現起始的培養方式，故不直接畫出新芽新根。兩週結果由你的觀察紀錄來回答。','The plant is at left and the starting setup at right. New roots and shoots are not drawn in; your two-week observations supply the answer.')}),draw:drawInvestigate},
{id:'diversity',title:P('長得像，是優點也有風險','Similarity: benefit and risk'),sub:P('兩種生殖與香蕉案例','Reproductive strategies'),hook:P('品質一致的香蕉很方便，但同一種病原來了，會怎樣？','Uniform bananas are convenient. What happens when the same pathogen arrives?'),body:P('無性生殖可迅速保留親代特徵；有性生殖使親代資料重新組合，子代差異較多。比較兩種策略，不說哪一種永遠最好。','Asexual reproduction preserves traits quickly; sexual reproduction combines parental information, creating more differences. Neither is always best.'),closure:P('特徵一致有利栽培，但遺傳差異少也可能增加共同風險；有性生殖增加差異，不保證每個子代都存活。','Uniformity aids cultivation but may share vulnerabilities. Sexual variation does not guarantee every offspring survives.'),reading:P('課本香蕉案例：農民以吸芽或組織培養繁殖。黃葉病可影響木質部運水；課文強調圍堵與選育耐病品種。本單元不提供農藥或檢疫操作建議。','In the banana case, suckers or tissue culture provide plants. Fusarium wilt affects xylem transport; the reading discusses containment and resistant selection. No pesticide or quarantine advice is given.'),sources:[],init:()=>({running:true,method:'asexual'}),controls:()=>[choice(P('比較策略','Compare'),'method',[['asexual',P('無性：保留特徵','Asexual: retain traits')],['sexual',P('有性：產生差異','Sexual: variation')],['banana',P('香蕉案例','Banana case')]])],explain:s=>({title:s.method==='banana'?P('組織培養與耐病選育','Tissue culture and resistant selection'):s.method==='asexual'?P('通常相似，不是永遠零差異','Usually similar, not zero variation forever'):P('子代資料重新組合','Offspring information recombines'),text:s.method==='banana'?P('吸芽與組織培養都能快速得到特徵一致的香蕉苗。繁殖方式連到遺傳差異與病害風險；組織培養本身不保證全部抗病。','Suckers and tissue culture quickly give uniform banana plants. Propagation links to variation and disease risk; tissue culture alone does not guarantee resistance.'):s.method==='asexual'?P('不經配子結合，子代通常與親代很相似；仍可能有突變，不能說永遠完全相同。','Without gamete fusion, offspring are usually very similar; mutation can still occur.'):P('配子形成與受精造成新的組合。遺傳差異可增加族群面對環境改變的機會，不代表每個新組合都更好。','Gamete formation and fertilization create combinations. Variation can help populations in changing conditions, but not every combination is better.')}),draw:drawDiversity}
];
B.register({id:'asexual_reproduction',title:P('無性生殖：不靠種子，也能延續','Asexual reproduction: new life without seeds'),subtitle:P('分裂、出芽、斷裂、孢子與植物的營養器官繁殖','Fission, budding, fragmentation, spores and plant propagation'),cover:'assets/covers/biology_reproduction_asexual_1009_v1.jpg',tabs});
})();

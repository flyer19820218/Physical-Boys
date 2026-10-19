/* Cell division and chromosome sets · teacher-requested V5 remake, 2026-10-19.
 * Same five tabs, hooks, closures, readings and controls as cell_division_1009_v1.js.
 * The onion-root micrographs stay as the textbook's original evidence. The onion, root tips,
 * DNA-to-chromosome and pea pictures are the teacher's Gemini AI teaching illustrations
 * (cell_division_ai_1019/sources.md). Chromosomes, cells and their movements are drawn here as models.
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

const BOOK='assets/biology/ch7_reproduction_1009_v1/',CD='assets/biology/cell_division_ai_1019/';
// Chromosome colours mark parental origin, as in the original lesson: pink from one parent, cyan from the other.
const PINK=C.pink,CYAN=C.cyan;
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
// One chromatid: a rod through its centromere. dx pushes it sideways, so two of them meet at the centromere as an X.
function chromatid(c,x,y,L,color,rot=0,dx=0,a=1,w=11){
  const ax=Math.sin(rot),ay=Math.cos(rot),px=Math.cos(rot),py=-Math.sin(rot);
  const p1=[x-ax*L/2+px*dx,y-ay*L/2+py*dx],pc=[x+px*dx*.18,y+py*dx*.18],p2=[x+ax*L/2+px*dx,y+ay*L/2+py*dx];
  c.save();c.globalAlpha=a;sline(c,[p1,pc,p2],C.ink,w+5);sline(c,[p1,pc,p2],color,w);
  for(const [q,r] of [[p1,pc],[pc,p2]])for(const f of [.3,.68]){const bx=mix(q[0],r[0],f),by=mix(q[1],r[1],f);sline(c,[[bx-px*w*.42,by-py*w*.42],[bx+px*w*.42,by+py*w*.42]],'rgba(255,255,255,.4)',2.5);}
  c.restore();
}
function cellsUnion(c,list,fill='rgba(31,74,61,.92)',stroke='#9fd8b8'){
  c.save();c.lineWidth=8;c.strokeStyle=stroke;for(const [x,y,rx,ry] of list){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.stroke();}
  c.fillStyle=fill;for(const [x,y,rx,ry] of list){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}c.restore();
}
// Run a list of poses either as a loop or towards a held stage.
function poseClock(s,t,n,hold=1,move=1.6){
  if(s.stage>=0){const k=ease((t-(s.start||0))/1.4);return{a:s.from??s.stage,b:s.stage,k,show:s.stage,fade:1};}
  const total=n*hold+(n-1)*move+1.2,u=mod(t,total);let acc=0;
  for(let i=0;i<n;i++){if(u<acc+hold)return{a:i,b:i,k:0,show:i,fade:clamp(Math.min(u/.4,(total-u)/.4))};acc+=hold;if(i<n-1&&u<acc+move){const k=ease((u-acc)/move);return{a:i,b:i+1,k,show:k>.5?i+1:i,fade:1};}acc+=move;}
  return{a:n-1,b:n-1,k:0,show:n-1,fade:clamp((total-u)/.4)};
}
function blendPose(P,clk){const A=P[clk.a],Bp=P[clk.b],k=clk.k;
  return{actors:A.actors.map((q,i)=>{const r=Bp.actors[i];return{x:mix(q.x,r.x,k),y:mix(q.y,r.y,k),rot:mix(q.rot,r.rot,k),dx:mix(q.dx,r.dx,k)};}),cells:A.cells.map((q,i)=>q.map((v,j)=>mix(v,Bp.cells[i][j],k)))};}
const KS=[{L:84,col:PINK},{L:84,col:CYAN},{L:50,col:PINK},{L:50,col:CYAN}];
const SCATTER=[[-95,-45,.35],[70,-80,-.4],[-30,85,1.25],[115,55,.75]],STACK=[-128,-20,71,145];
const MX=340,MY=320;
function actorList(fn){const out=[];KS.forEach((q,k)=>[-1,1].forEach(sd=>out.push(fn(k,sd))));return out;}
const MITOSIS=(()=>{const big=[MX,MY,280,208],P=[];
  P.push({actors:actorList((k,sd)=>({x:MX+SCATTER[k][0],y:MY+SCATTER[k][1],rot:SCATTER[k][2],dx:0})),cells:[big,big]});
  P.push({actors:actorList((k,sd)=>({x:MX+SCATTER[k][0],y:MY+SCATTER[k][1],rot:SCATTER[k][2],dx:sd*10})),cells:[big,big]});
  P.push({actors:actorList((k,sd)=>({x:MX,y:MY+STACK[k],rot:0,dx:sd*10})),cells:[big,big]});
  P.push({actors:actorList((k,sd)=>({x:MX+sd*178,y:MY+STACK[k],rot:sd*.06,dx:0})),cells:[[MX,MY,300,204],[MX,MY,300,204]]});
  const jit=[[-18,.25],[16,-.3],[-8,-.6],[20,.5]];
  P.push({actors:actorList((k,sd)=>({x:MX+sd*160+jit[k][0],y:MY+STACK[k]*.72,rot:jit[k][1],dx:0})),cells:[[MX-160,MY,150,200],[MX+160,MY,150,200]]});
  return P;})();
function meiosisPoses(assort){const big=[MX,MY,280,208],side=k=>k===0?-1:k===1?1:(k===2?(assort?1:-1):(assort?-1:1)),P=[];
  const half=sd=>[MX+sd*150,MY,145,190],B4=[big,big,big,big],H4=[half(-1),half(-1),half(1),half(1)];
  P.push({actors:actorList((k,sd)=>({x:MX+SCATTER[k][0],y:MY+SCATTER[k][1],rot:SCATTER[k][2],dx:0})),cells:B4});
  P.push({actors:actorList((k,sd)=>({x:MX+SCATTER[k][0],y:MY+SCATTER[k][1],rot:SCATTER[k][2],dx:sd*9})),cells:B4});
  P.push({actors:actorList((k,sd)=>({x:MX+side(k)*27,y:MY+(k<2?-78:78),rot:0,dx:sd*9})),cells:B4});
  P.push({actors:actorList((k,sd)=>({x:MX+side(k)*150,y:MY+(k<2?-72:72),rot:0,dx:sd*9})),cells:H4});
  P.push({actors:actorList((k,sd)=>({x:MX+side(k)*150+(k<2?-42:58),y:MY,rot:Math.PI/2,dx:sd*9})),cells:H4});
  P.push({actors:actorList((k,sd)=>({x:MX+side(k)*150+(k<2?-42:58),y:MY-sd*96,rot:Math.PI/2,dx:0})),cells:[[MX-150,MY,140,206],[MX-150,MY,140,206],[MX+150,MY,140,206],[MX+150,MY,140,206]]});
  P.push({actors:actorList((k,sd)=>({x:MX+side(k)*150+(k<2?-42:58),y:MY-sd*104,rot:Math.PI/2+(k%2?.12:-.1),dx:0})),cells:[[MX-150,MY-104,140,94],[MX-150,MY+104,140,94],[MX+150,MY-104,140,94],[MX+150,MY+104,140,94]]});
  return P;}
const MEIOSIS={true:meiosisPoses(true),false:meiosisPoses(false)};
function drawPose(c,pose,fade){c.save();c.globalAlpha=fade;cellsUnion(c,pose.cells);pose.actors.forEach((q,i)=>{const K=KS[i>>1];chromatid(c,q.x,q.y,K.L,K.col,q.rot,q.dx);});c.restore();}
function stageList(c,names,cur,x,y,w,h=40,gap=6,color=C.yellow){names.forEach((p,i)=>{const yy=y+i*(h+gap);D.round(c,x,yy,w,h,10,i===cur?color:'rgba(11,26,21,.6)',i===cur?C.white:C.edge);text(c,`${i+1}. ${D.tr(p)}`,x+12,yy+h/2+8,22,i===cur?C.deep:C.white);});}
function countBox(c,p){const w=measure(c,p,22)+28;pill(c,p,648-w,32,{color:C.yellow,maxX:648});}

// ── Tab 1: grow by more cells and by bigger cells ──────────────────────────
const ONION_ROOTS=[385,600,220,195],ROOT_BOX=[[520,690,150,148],[600,555,150,150]];
function rootModel(c,t,region){
  const PX=640,COLX=[680,714],W=34,CAP=514,rate=.4;
  panel(c,PX,20,300,560);
  c.save();c.beginPath();c.roundRect(PX,140,300,440,16);c.clip();
  for(let i=0;i<26;i++){const x=PX+16+(i*113)%268,y=40+mod(i*71-t*26,540);circle(c,x,y,2.5+(i%3),'rgba(160,130,90,.55)');}
  const h=a=>a<1?14*a:a<5?14:a<9?14+(a-5)*13:66,zone=[CAP-70,CAP],zone2=[CAP-70-134,CAP-70];
  const band=region===0?zone:zone2;c.fillStyle='rgba(253,224,71,.16)';c.fillRect(COLX[0]-14,band[0],W*2+28,band[1]-band[0]);
  COLX.forEach((x,f)=>{const ph=mod(t*rate+f*.5,1);let yb=CAP;
    for(let i=0;i<14&&yb>140;i++){const a=i+ph,hh=h(a);if(hh<.5){continue;}
      const fill=a<5?'#e2d3a0':a<9?'#ece4c6':'#f3eedd';D.round(c,x,yb-hh,W,hh,4,fill,'#8a7c52');
      circle(c,x+W/2,yb-hh/2,a<5?Math.min(5,hh*.32):4,a<5?'#7c6a3a':'#a8996a');
      if(a>9.6){const ry=yb-hh*.5,sd=f?1:-1;sline(c,[[x+(f?W:0),ry],[x+(f?W:0)+sd*28,ry-10]],'#efe9d4',2.5);}
      if(i===0&&a<1)glow(c,x+W/2,yb-hh,18,C.yellow,.5*(1-a));
      yb-=hh;}});
  c.beginPath();c.moveTo(COLX[0],CAP);c.quadraticCurveTo(COLX[0]+2,CAP+44,COLX[0]+W,CAP+46);c.quadraticCurveTo(COLX[1]+W-2,CAP+44,COLX[1]+W,CAP);c.closePath();c.fillStyle='#c9b98a';c.fill();c.strokeStyle='#8a7c52';c.lineWidth=2;c.stroke();
  c.restore();
  text(c,P('放大示意：根尖','Model: a root tip'),PX+150,52,22,C.muted,'center');
  pill(c,P('根冠','Root cap'),770,520,{anchor:[COLX[1]+W-6,CAP+24],color:'#c9b98a',maxX:936});
  pill(c,P('生長點：分裂變多','Growing point: divide'),770,436,{anchor:[COLX[1]+W,CAP-36],color:C.yellow,active:region===0,maxX:936});
  pill(c,P('延長部位：變長','Elongation: lengthen'),770,330,{anchor:[COLX[1]+W,CAP-70-70],color:C.yellow,active:region===1,maxX:936});
  wrap(c,P('周圍的小點往上移，表示根尖往下長。','Specks drift up: the tip grows down.'),PX+16,88,268,22,C.white);
}
function drawGrowth(c,s,t){
  const tt=Math.max(0,t-s.start),z=ease(tt/.9),reg=s.region;
  panel(c,20,20,300,560);
  text(c,P('洋蔥泡水長出根','Onion growing roots'),36,50,22,C.muted);
  const on=place(c,CD+'onion_water.png',30,58,280,226);
  const rt=place(c,CD+'root_tips.png',30,330,280,168);
  text(c,P('根的尖端','Root tips'),36,322,22,C.muted);
  if(on&&rt){const a=on.rect(ONION_ROOTS);dashedBox(c,a,C.yellow,2.5);connectors(c,a,[rt.x,rt.y,1400*rt.k,838*rt.k],.4);}
  panel(c,330,20,300,560);
  const MR=[338,74,284,284];
  if(rt){const b=rt.rect(ROOT_BOX[reg]);dashedBox(c,b);connectors(c,b,lerpRect(b,MR,z),.55);}
  const im=pic(BOOK+(reg===0?'Im5.png':'Im4.png'));
  if(im){const cur=lerpRect(rt?rt.rect(ROOT_BOX[reg]):MR,MR,z);c.save();c.globalAlpha=clamp(z*1.4);c.drawImage(im,...cur);c.restore();c.save();c.strokeStyle=rgba(C.yellow,.85);c.lineWidth=3;c.strokeRect(...cur);c.restore();}
  text(c,P('真實顯微照片（染色後）','Real micrograph (stained)'),480,56,22,C.muted,'center');
  text(c,reg===0?P('生長點','Growing point'):P('延長部位','Elongation region'),346,396,26,C.yellow);
  wrap(c,reg===0?P('細胞小、排得很密：正在分裂，細胞數量變多。','Small, tightly packed cells: they divide, so the number grows.'):P('細胞變長、變大：根因此被推長。','Cells stretch and enlarge, so the root lengthens.'),346,434,272,22,C.white);
  wrap(c,P('藍紫色是染料，不是細胞原本的顏色。','The blue-violet is stain, not the live colour.'),346,530,272,22,C.muted);
  rootModel(c,t,reg);
}

// ── Tab 2: what a chromosome is, and one X versus one pair ────────────────
const DNA_LABELS=[[P('DNA','DNA'),[80,421]],[P('蛋白質','Protein'),[406,452]],[P('染色體','Chromosome'),[1428,421]]];
function dnaPanel(c,x,y,w){const f=place(c,CD+'dna_to_chromosome.png',x,y,w,w*956/1600);
  if(f){const rowY=y+w*956/1600+14;let px=x;DNA_LABELS.forEach(([p,a],i)=>{const r=pill(c,p,[x,x+w*.28,x+w-150][i],rowY,{anchor:f.map(...a),color:[C.cyan,C.orange,C.pink][i],maxX:x+w});});
    const u=mod(t0*.18);const [gx,gy]=along([[60,600],[300,760],[520,300],[900,450],[1430,420]],u);glow(c,...f.map(gx,gy),30,C.yellow,.5*Math.sin(u*Math.PI));}
  return f;}
let t0=0;
function drawChromosomes(c,s,t){
  t0=t;
  if(s.view==='original'){
    panel(c,20,20,440,560);text(c,P('真實照片：洋蔥根尖細胞（染色）','Real photo: onion root-tip cells (stained)'),36,54,22,C.yellow);
    const f=place(c,BOOK+'Im11.png',40,70,400,390);
    if(f){const r=f.rect([440,260,110,120]);dashedBox(c,r);pill(c,P('深色的線條就是染色體','Dark threads are chromosomes'),40,480,{anchor:[r[0]+r[2]/2,r[1]+r[3]],color:C.yellow,maxX:450});}
    wrap(c,P('正在分裂的細胞，染色體才濃縮成看得見的線條。','Chromosomes condense into visible threads only in dividing cells.'),40,540,400,22,C.white);
    panel(c,480,20,460,560);text(c,P('染色體由 DNA 和蛋白質組成','Chromosomes are DNA plus protein'),500,54,22,C.yellow);
    dnaPanel(c,494,74,432);
    wrap(c,P('DNA 纏繞在蛋白質上，再一層層摺疊，才變成染色體。','DNA wraps around proteins and folds again and again into a chromosome.'),500,420,420,22,C.white);
    wrap(c,P('AI 教學插圖，不是顯微照片。','AI teaching illustration, not a micrograph.'),500,520,420,22,C.muted);
    return;}
  panel(c,20,20,440,560);text(c,P('染色體由 DNA 和蛋白質組成','Chromosomes are DNA plus protein'),36,54,22,C.yellow);
  dnaPanel(c,34,74,412);
  wrap(c,P('平常 DNA 是鬆開的細絲；細胞要分裂時，才纏繞、摺疊成短棒狀。','Normally DNA is loose; before division it coils and folds into short rods.'),36,410,408,22,C.white);
  wrap(c,P('右邊用彩色短棒代表染色體，方便數數。','On the right, coloured rods stand for chromosomes so we can count them.'),36,500,408,22,C.muted);
  panel(c,480,20,460,560);
  if(s.view==='pair'){
    circle(c,710,250,172,'rgba(31,74,61,.92)','#9fd8b8',4);
    const pos=[[640,200],[692,200],[760,312],[800,312]],hl=Math.floor(t/3)%2,pulse=.5+.5*Math.sin(t*4);
    KS.forEach((q,k)=>chromatid(c,pos[k][0],pos[k][1],q.L*1.25,q.col,0,0));
    const pr=hl?[730,256,100,112]:[612,128,108,146];c.save();c.strokeStyle=rgba(C.yellow,.55+.45*pulse);c.lineWidth=4;c.setLineDash([9,6]);c.beginPath();c.roundRect(...pr,16);c.stroke();c.restore();
    pill(c,hl?P('另一對同源染色體','Another homologous pair'):P('一對同源染色體','A homologous pair'),hl?500:740,hl?370:70,{active:true,color:C.yellow,maxX:932,anchor:hl?[730,330]:[720,170]});
    wrap(c,P('同源染色體：大小、形狀相似的一對。','Homologous chromosomes: a pair of the same size and shape.'),500,500,420,22,C.white);
    legendRow(c,[[(x,y)=>chromatid(c,x,y,22,PINK,0,0,1,8),P('來自一個親代','From one parent')],[(x,y)=>chromatid(c,x,y,22,CYAN,0,0,1,8),P('來自另一個親代','From the other')]],500,572);
    text(c,P('2 對，共 4 條','2 pairs, 4 chromosomes'),710,456,24,C.yellow,'center');
  }else{
    const u=mod(t/4.5),rep=ease(clamp((u-.2)/.4)),cx=600,cy=250;
    text(c,P('一條染色體複製','Copying one'),cx,62,22,C.yellow,'center');
    chromatid(c,cx,cy,120,PINK,0,-12*rep);chromatid(c,cx,cy,120,PINK,0,12*rep,rep>0?1:0);
    text(c,rep>.5?P('一條，兩份拷貝（X）','One, two copies'):P('一條','One'),cx,cy+108,22,C.white,'center');
    text(c,'≠',710,cy+12,44,C.orange,'center');
    text(c,P('一對同源染色體','A pair'),830,62,22,C.yellow,'center');
    chromatid(c,805,cy,120,PINK,0,0);chromatid(c,855,cy,120,CYAN,0,0);
    text(c,P('兩條，一對','Two, one pair'),830,cy+108,22,C.white,'center');
    wrap(c,P('X 的兩半是同一條複製出來的，完全相同；同源染色體則是各來自一個親代的兩條。','Both halves of an X are copies of the same chromosome; homologues come one from each parent.'),500,440,420,22,C.white);
  }
}

// ── Tabs 3–4: mitosis and meiosis ──────────────────────────────────────────
const MIT_NAMES=[P('母細胞','Parent cell'),P('複製一次','Copy once'),P('排在中央','Line up'),P('分向兩端','Pull apart'),P('兩個子細胞','Two daughters')];
const MIT_COUNT=[P('1 個細胞：4 條','1 cell: 4'),P('1 個細胞：4 條（已複製）','1 cell: 4 (copied)'),P('1 個細胞：4 條（已複製）','1 cell: 4 (copied)'),P('兩端各 4 條','4 at each end'),P('2 個細胞：各 4 條','2 cells: 4 each')];
function drawMitosis(c,s,t){
  const clk=poseClock(s,t,5);s.shown=clk.show;
  panel(c,20,20,640,560);
  drawPose(c,blendPose(MITOSIS,clk),clk.fade);
  pill(c,MIT_NAMES[clk.show],40,32,{active:true,color:C.yellow,maxX:650});
  countBox(c,MIT_COUNT[clk.show]);
  panel(c,680,20,260,560);
  place(c,BOOK+'Im11.png',692,32,236,180);
  text(c,P('真實照片：分裂中的細胞','Real photo: dividing cells'),810,236,22,C.muted,'center');
  stageList(c,MIT_NAMES,clk.show,692,256,236);
  wrap(c,P('複製一次、分裂一次：數目不變。','Copy once, divide once: same count.'),692,520,236,22,C.white);
}
const MEI_NAMES=[P('母細胞','Parent cell'),P('複製一次','Copy once'),P('同源染色體並排','Pairs line up'),P('第一次分裂','First division'),P('排在中央','Line up'),P('第二次分裂','Second division'),P('四個子細胞','Four daughters')];
const MEI_COUNT=[P('1 個細胞：4 條（2 對）','1 cell: 4 (2 pairs)'),P('1 個細胞：4 條（已複製）','1 cell: 4 (copied)'),P('同源的兩條靠在一起','Pairs side by side'),P('2 個細胞：各 2 條','2 cells: 2 each'),P('2 個細胞：各 2 條','2 cells: 2 each'),P('兩份分開','Copies separate'),P('4 個細胞：各 2 條','4 cells: 2 each')];
function drawMeiosis(c,s,t){
  const clk=poseClock(s,t,7,.9,1.5);s.shown=clk.show;
  panel(c,20,20,640,560);
  drawPose(c,blendPose(MEIOSIS[s.assort],clk),clk.fade);
  pill(c,MEI_NAMES[clk.show],40,32,{active:true,color:C.yellow,maxX:650});
  countBox(c,MEI_COUNT[clk.show]);
  panel(c,680,20,260,560);
  stageList(c,MEI_NAMES,clk.show,692,34,236,42,6);
  wrap(c,P('複製一次、分裂兩次：數目減半。','Copy once, divide twice: count halves.'),692,388,236,22,C.white);
  wrap(c,s.assort?P('這次：左邊拿到長粉紅＋短青。','This time: long pink + short cyan go left.'):P('這次：左邊拿到長粉紅＋短粉紅。','This time: long pink + short pink go left.'),692,466,236,22,C.yellow);
}

// ── Tab 5: one set from each gamete, two sets in the zygote ───────────────
const SPECIES=[{name:P('人類','Human'),body:46,n:23,file:'assets/biology/temperature_ai_1018/body_urinary.png',grey:true},{name:P('豌豆','Pea'),body:14,n:7,file:CD+'pea_plant.png'},{name:P('黑猩猩','Chimpanzee'),body:48,n:24,file:'assets/biology/responses_ai_1018/chimp_termites.jpg',cover:true}];
function glyphs(c,cx,cy,R,n,paired,colors=[PINK,CYAN],a=1){
  const cols=Math.ceil(Math.sqrt(n)*1.25),rows=Math.ceil(n/cols),sx=R*1.38/cols,sy=R*1.3/rows;
  c.save();c.globalAlpha=a;
  for(let i=0;i<n;i++){const r=Math.floor(i/cols),q=i%cols,inRow=Math.min(cols,n-r*cols),x=cx+(q-(inRow-1)/2)*sx,y=cy+(r-(rows-1)/2)*sy,L=sy*mix(.82,.38,i/Math.max(1,n-1));
    if(paired){chromatid(c,x-3.5,y,L,colors[0],0,0,1,4);chromatid(c,x+3.5,y,L,colors[1],0,0,1,4);}else chromatid(c,x,y,L,colors[0],0,0,1,5);}
  c.restore();
}
function drawCounts(c,s,t){
  const sp=SPECIES[s.species],rev=s.answer,u=mod(t/7),meet=ease(clamp((u-.25)/.3)),fuse=clamp((u-.55)/.12);
  panel(c,20,20,300,560);
  text(c,sp.name,170,58,28,C.yellow,'center');
  const im=pic(sp.file);
  if(im){c.save();if(sp.grey)c.filter='grayscale(1) brightness(1.12)';if(sp.cover){c.beginPath();c.roundRect(34,76,272,330,14);c.clip();const k=Math.max(272/im.naturalWidth,330/im.naturalHeight);c.drawImage(im,170-im.naturalWidth*k/2,241-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k);}else{const k=Math.min(272/im.naturalWidth,330/im.naturalHeight);c.drawImage(im,170-im.naturalWidth*k/2,241-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k);}c.restore();}
  D.round(c,34,430,272,70,12,'rgba(11,26,21,.6)',C.edge);
  text(c,P('體細胞','Body cell'),50,474,22,C.muted);text(c,rev?P(`${sp.body} 條`,`${sp.body}`):'?',290,476,30,C.white,'right');
  text(c,P('減數分裂後形成配子','Meiosis makes gametes'),170,546,22,C.muted,'center');
  panel(c,340,20,600,560);
  const G1=[mix(470,610,meet),150+meet*120],G2=[mix(810,670,meet),150+meet*120],Z=[640,330];
  if(fuse<1){for(const [g,col,i] of [[G1,PINK,0],[G2,CYAN,1]]){circle(c,g[0],g[1],78,'rgba(31,74,61,.95)',col,4);
      if(rev)glyphs(c,g[0],g[1],78,sp.n,false,[col],1-fuse);else text(c,'?',g[0],g[1]+18,52,col,'center');
      if(meet<.05){text(c,P('配子','Gamete'),g[0],g[1]-92,22,col,'center');text(c,rev?P(`${sp.n} 條（一套）`,`${sp.n} (one set)`):P('? 條','?'),g[0],g[1]+108,22,C.white,'center');}}}
  if(fuse>0){const R=mix(80,128,fuse);circle(c,Z[0],Z[1],R,'rgba(31,74,61,.95)',C.yellow,5);glow(c,Z[0],Z[1],R*1.2,C.yellow,.18*(1-fuse)+.08);
    if(rev)glyphs(c,Z[0],Z[1],R,sp.n,true,[PINK,CYAN],fuse);else text(c,'?',Z[0],Z[1]+20,60,C.yellow,'center');
    text(c,P('受精卵','Zygote'),Z[0],Z[1]-R-16,24,C.yellow,'center');
    text(c,rev?P(`${sp.body} 條（兩套，${sp.n} 對）`,`${sp.body} (two sets, ${sp.n} pairs)`):P('? 條','?'),Z[0],Z[1]+R+34,24,C.white,'center');}
  if(meet>0&&fuse<1)text(c,P('受精','Fertilization'),640,170,24,C.yellow,'center');
  wrap(c,rev?P('一套＋一套＝兩套：數目和親代的體細胞一樣。','One set + one set = two sets: the same as the parent\'s body cells.'):P('先在上方選「看數目」之前，自己預測看看。','Predict before choosing “Reveal counts” above.'),360,540,560,22,rev?C.white:C.muted);
}

const tabs=[
{id:'growth',title:P('變大，還是變多？','Bigger, or more cells?'),sub:P('生長與新細胞','Growth and new cells'),hook:P('洋蔥根一直往下長，只把原有細胞拉長就夠了嗎？','Can an onion root grow using only stretched old cells?'),body:P('從洋蔥的根放大到根尖：靠近生長點的細胞較小而密集，正在分裂；離開生長點的細胞逐漸伸長變大。兩種變化都參與生長。','Zoom from the onion to its root tip: small packed cells near the growing point divide; farther away, cells stretch and enlarge. Both contribute to growth.'),closure:P('生長可包括細胞分裂增加數量，以及細胞體積增大；不是只能二選一。','Growth includes increased cell number and cell enlargement, not just one or the other.'),sources:[source('洋蔥根尖原照片',6,'1-1')],init:()=>({running:true,region:0,start:0}),controls:()=>[choice(P('放大部位','Enlarge'),'region',[[0,P('生長點','Growing region')],[1,P('延長部位','Elongating region')]])],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>({title:s.region===0?P('較小、密集的新生細胞','Small packed new cells'):P('細胞逐漸增大','Cells enlarge'),text:s.region===0?P('中間是洋蔥根尖的真實染色照片，許多細胞集中排列。數位放大只放大這張照片，不改顯微鏡光學倍率。','The centre shows a real stained onion-root micrograph with packed cells. Digital enlargement does not change optical magnification.'):P('離開生長點的細胞逐漸伸長，和新細胞的產生一起讓根生長。不要用兩張不同視野直接算整條根的細胞總數。','Cells elongate away from the growing tip. Do not count the whole root from these different microscope fields.')}),draw:drawGrowth},
{id:'chromosomes',title:P('同一套，先認清','Recognize the set'),sub:P('染色體與同源染色體','Chromosomes and homologues'),hook:P('一個X形，是兩條同源染色體黏在一起嗎？','Is one X shape a pair of homologous chromosomes?'),body:P('同源染色體是大小、形狀相似的一對，通常各來自一個親代。複製後一條染色體有兩份拷貝，不能把一個X直接當一對同源染色體。','Homologues are a similar pair, usually one from each parent. One replicated chromosome contains two copies; a single X is not a homologous pair.'),closure:P('分清「一對同源染色體」和「一條染色體複製後的兩份」，才能看懂分配。','Distinguish a homologous pair from the two copies of one replicated chromosome.'),reading:P('染色體由DNA和蛋白質構成。未分裂時遺傳物質較鬆散，動畫的棒狀只是方便數數的符號。人類一般有核體細胞46條，配子23條；成熟紅血球沒有細胞核，不能硬套這個例子。','Chromosomes contain DNA and proteins. Rods are counting symbols; genetic material is looser between divisions. Typical nucleated human body cells have 46 chromosomes, gametes 23; mature red cells lack nuclei.'),sources:[source('洋蔥染色體',7,'1-2')],init:()=>({running:true,view:'pair'}),controls:()=>[choice(P('比較','Compare'),'view',[['pair',P('同源的一對','Homologous pair')],['copy',P('一條先複製','One is copied')],['original',P('原圖觀察','Originals')]])],explain:s=>({title:s.view==='copy'?P('複製增加DNA份量，不是多一對同源染色體','Copying DNA does not add a homologous pair'):P('同源的兩條，來自不同親代','Two homologues from different parents'),text:s.view==='original'?P('左邊是洋蔥根尖的真實染色照片，右邊是 DNA 纏繞成染色體的 AI 教學插圖。插圖不是直接拿顯微鏡就能看到的畫面。','Left: a real stained onion-root micrograph. Right: an AI illustration of DNA packing into a chromosome, not a direct microscope view.'):s.view==='copy'?P('一個X含同一條染色體複製出的兩份；分開後各可分配到新細胞。此圖省略高中的分裂時期名稱。','One X has the two copies of one chromosome. Separation allocates copies to new cells. High-school phase names are omitted.'):P('一條青色、一條粉紅色，表示不同親代來源；同樣長短的一對才是此模型的同源染色體。顏色不是真實染色體的天生顏色。','Cyan and pink identify parental origin; equal-length rods form a homologous pair in this model. The colours are symbolic.')}),draw:drawChromosomes},
{id:'mitosis',title:P('複製一回，分一回','Copy once, divide once'),sub:P('一般細胞分裂','Mitosis'),hook:P('傷口補新細胞時，染色體會分到只剩一半嗎？','When new cells repair tissue, do they get half a chromosome set?'),body:P('以2對、4條染色體為例：先複製一次，再分裂一次。形成兩個子細胞，每個的染色體數目與母細胞相同。','With two pairs (four chromosomes): replicate once, divide once. Each of two daughter cells has the same chromosome count as the parent.'),closure:P('一般細胞分裂：複製一次、分裂一次；兩個子細胞的染色體數目維持相同。','Mitosis: one replication, one division, two daughters with the same chromosome count.'),sources:[source('一般細胞分裂',8,'1-6'),source('染色體分配',9,'1-7')],init:()=>({running:true,stage:-1,start:0}),controls:()=>[choice(P('觀察階段','Stage'),'stage',[[-1,P('連續播放','Continuous')],...MIT_NAMES.map((p,i)=>[i,p])])],act(s,k,v){s.from=s.stage>=0?s.stage:(s.shown||0);s[k]=v;s.start=s.elapsed;},explain:s=>({title:P('數目相同，不是每次減半','Same count, not halved each time'),text:P('一個母細胞2n＝4，形成兩個各2n＝4的子細胞。複製讓每個新細胞都有一套完整資料；動畫以時間壓縮重播。','One 2n = 4 parent produces two 2n = 4 daughters. Copying ensures each receives complete information. Time is compressed and the demonstration repeats.')}),draw:drawMitosis},
{id:'meiosis',title:P('複製一回，分兩回','Copy once, divide twice'),sub:P('減數分裂','Meiosis'),hook:P('如果精子和卵都帶完整雙套，結合後的染色體不是越來越多嗎？','If both gametes carried two sets, would chromosome counts keep doubling?'),body:P('先複製一次，再分裂兩次。第一次分開同源染色體，第二次分開複製的兩份；最後各子細胞只含每對中的一條。','Replicate once, divide twice: homologues separate first, then their copies. Each final daughter receives one chromosome from each pair.'),closure:P('減數分裂使染色體套數減半；受精讓n＋n恢復2n，代代維持套數。','Meiosis halves the sets; fertilization restores n + n to 2n across generations.'),reading:P('一般化模型形成四個子細胞；人類卵形成時分配不均，不能把四個圓圈解釋成四個成熟卵。植物的配子形成還包含其他步驟，本初版不展開高中的世代交替。','The general model gives four daughter cells. Human egg formation involves unequal division, not four mature eggs. Plant gamete formation has additional steps beyond this introductory model.'),sources:[source('減數分裂觀察',10,'1-8'),source('減數分裂模型',11,'1-9')],init:()=>({running:true,stage:-1,assort:true,start:0}),controls:()=>[choice(P('觀察階段','Stage'),'stage',[[-1,P('連續播放','Continuous')],[0,MEI_NAMES[0]],[1,P('複製','Copy')],[2,P('並排','Pairs')],[3,MEI_NAMES[3]],[5,MEI_NAMES[5]],[6,MEI_NAMES[6]]]),choice(P('兩對如何分配','Distribution'),'assort',[[true,P('一種組合','Combination A')],[false,P('另一種組合','Combination B')]])],act(s,k,v){if(k==='stage'){s.from=s.stage>=0?s.stage:(s.shown||0);s.start=s.elapsed;}s[k]=v;},explain:s=>({title:P('四個子細胞，各只有一套','Four daughters, each with one set'),text:P('模型母細胞2n＝4，最後每個子細胞n＝2。切換組合看不同來源如何配在一起：不把同源的一對留在同一個最終子細胞。','A 2n = 4 model parent yields n = 2 daughters. Compare combinations: each final cell takes one of each homologous pair, not both members.')}),draw:drawMeiosis},
{id:'counts',title:P('套數怎麼接回去？','How do sets return?'),sub:P('配子與受精的數目','Gametes and fertilization'),hook:P('人類精子23條、卵23條，受精卵是多少條？先選，再解釋。','Human sperm and egg each have 23 chromosomes. What is the zygote count?'),body:P('依課本比較人類、豌豆與黑猩猩的染色體數目。這裡討論一般有核體細胞與配子，不把特殊細胞混在一起。','Compare textbook chromosome counts for humans, peas and chimpanzees. Use typical nucleated body cells and gametes, not specialized exceptions.'),closure:P('配子各帶一套，結合後恢復兩套；不是受精讓每一條再複製一次。','Gametes each carry one set; union restores two sets without another replication at fertilization.'),record:P('用一種生物舉例，寫出體細胞、配子與受精卵的染色體數目，說明減數分裂的作用。','Choose a species; record body-cell, gamete and zygote counts, and explain the role of meiosis.'),sources:[source('不同物種染色體數',7,'知識快遞'),source('有性生殖套數',17,'1-16')],init:()=>({running:true,species:0,answer:false}),controls:()=>[choice(P('物種','Species'),'species',[[0,P('人類','Human')],[1,P('豌豆','Pea')],[2,P('黑猩猩','Chimpanzee')]]),choice(P('顯示說明','Explanation'),'answer',[[false,P('先預測','Predict first')],[true,P('看數目','Reveal counts')]])],explain:s=>({title:P('兩套 → 一套＋一套 → 兩套','Two sets → one + one → two'),text:s.answer?P(`此例體細胞${[46,14,48][s.species]}條，配子各${[23,7,24][s.species]}條，受精卵${[46,14,48][s.species]}條。雙套的數目維持，但親代資料重新組合。`,`Body cell: ${[46,14,48][s.species]}; each gamete: ${[23,7,24][s.species]}; zygote: ${[46,14,48][s.species]}. The diploid count is maintained while parental information combines.`):P('先說出體細胞、配子和受精卵的數目，再用「套」解釋，不能只背加法。','Predict all three counts, then explain chromosome sets rather than memorizing an addition.')}),draw:drawCounts}
];
B.register({id:'cell_division',title:P('細胞分裂：變多，又不亂套','Cell division and chromosome sets'),subtitle:P('從根尖的真實照片，到染色體的複製、分配與受精','From real root-tip photos to copying, sharing and joining chromosome sets'),cover:'assets/covers/biology_reproduction_cells_1009_v1.jpg',tabs});
})();

/* Flowering-plant reproduction · teacher-requested V5 remake, 2026-10-19.
 * Same six tabs, hooks, closures, readings and controls as reproduction_flowers_1009_v1.js.
 * Textbook photographs and micrographs (cherry, pollen tube, pollinators, anther, ovary, ovules, pollen) stay
 * as original evidence. The peach-blossom section, pistil section, lily and bean germination pictures are the
 * teacher's Gemini AI teaching illustrations (flowers_ai_1019/sources.md); the pea pod reuses
 * cell_division_ai_1019/pea_plant.png. Pollen paths, the tube, sperm cells, the ovule and the transfer
 * diagrams are drawn models; model time is not biological time.
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
  const isEn=/[A-Za-z]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9₂]+(?:['\'–-][A-Za-z0-9₂]+)*|\s+|[^A-Za-z0-9₂\s]/g)||[]):Array.from(str);
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

const BOOK='assets/biology/ch7_reproduction_1009_v1/',FX='assets/biology/flowers_ai_1019/';
const PEACH=FX+'peach_section.png',PIST=FX+'pistil_section.png',LILY=FX+'lily.png',STRIP=FX+'germination_strip.png',SOIL=FX+'germination_soil.png',PEA='assets/biology/cell_division_ai_1019/pea_plant.png?v=20261019b';
const join=ps=>P(ps.map(p=>p[0]).join('\n\n'),ps.map(p=>p[1]).join('\n\n'));
// Colours: stamen and pollen yellow, pistil green, ovule orange, egg pink, sperm cells cyan
// (the egg pink and sperm cyan follow the animal-reproduction unit).
const STAM=C.yellow,PIS=C.green,OVU=C.orange,EGG=C.pink,SPERM=C.cyan;
function steps(c,names,cur,x,y,w,h=42,gap=8,color=C.yellow){let yy=y;names.forEach((p,i)=>{const rows=splitLines(c,`${i+1}. ${D.tr(p)}`,w-24,22),hh=Math.max(h,rows.length*26+12);D.round(c,x,yy,w,hh,10,i===cur?color:'rgba(11,26,21,.6)',i===cur?C.white:C.edge);rows.forEach((r,j)=>text(c,r,x+12,yy+hh/2-(rows.length-1)*13+8+j*26,22,i===cur?C.deep:C.white));yy+=hh+gap;});return yy;}
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*22,null,rgba(color,.9*(1-u)),3);circle(c,x,y,6,color,C.ink,2);}
function stageClock(s,t,n,per=3){
  if(s.phase>=0)return{k:s.phase,u:ease((t-(s.start||0))/1.6),held:true};
  const q=mod(t-(s.start||0),n*per)/per;return{k:Math.floor(q),u:q%1,held:false};
}
function grain(c,x,y,r=7,a=1){c.save();c.globalAlpha=a;glow(c,x,y,r*2.4,C.yellow,.3);circle(c,x,y,r,'#fcd34d','#7a5b0c',1.6);circle(c,x-r*.32,y-r*.32,r*.34,'rgba(255,255,255,.65)');c.restore();}
function spermCell(c,x,y,r=7){circle(c,x,y,r+2,null,C.ink,3);circle(c,x,y,r,SPERM,'#0b4f63',1.5);}
function cross(c,x,y,r,color='#ff6b6b'){line(c,[[x-r,y-r],[x+r,y+r]],C.ink,9);line(c,[[x+r,y-r],[x-r,y+r]],C.ink,9);line(c,[[x-r,y-r],[x+r,y+r]],color,5);line(c,[[x+r,y-r],[x-r,y+r]],color,5);}
function tick(c,x,y,r,color=C.green){line(c,[[x-r,y],[x-r*.3,y+r*.7],[x+r,y-r*.7]],C.ink,9);line(c,[[x-r,y],[x-r*.3,y+r*.7],[x+r,y-r*.7]],color,5);}
function subPath(pts,u){const L=pathLength(pts);let d=clamp(u)*L;const out=[pts[0]];for(let i=1;i<pts.length;i++){const s=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(d>=s){out.push(pts[i]);d-=s;}else{const f=s?d/s:0;out.push([mix(pts[i-1][0],pts[i][0],f),mix(pts[i-1][1],pts[i][1],f)]);break;}}return out;}
function arc(a,b,lift,n=26){const cx=(a[0]+b[0])/2,cy=Math.min(a[1],b[1])-lift,o=[];for(let i=0;i<=n;i++){const u=i/n;o.push([(1-u)*(1-u)*a[0]+2*u*(1-u)*cx+u*u*b[0],(1-u)*(1-u)*a[1]+2*u*(1-u)*cy+u*u*b[1]]);}return o;}
// A pollen tube: a pale-yellow tube with a dark rim so it reads on green tissue.
function tubeLine(c,pts,w=7){if(pts.length<2)return;sline(c,pts,C.ink,w+5);sline(c,pts,'#fde68a',w);sline(c,pts,'rgba(255,255,255,.55)',Math.max(1.5,w*.28));}
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
function caption(c,p,x,y,color=C.yellow){text(c,p,x,y,22,color);}
// Zoom-in timing: the frame flies out of its source box after every change.
const zoomU=(s,t,d=.9,delay=0)=>ease((t-(s.start||0)-delay)/d);
function zoomed(c,file,box,from,to,u){const r=lerpRect(from,to,u);crop(c,file,box,r);c.save();c.strokeStyle=rgba(C.yellow,.85);c.lineWidth=2.5;c.strokeRect(...r);c.restore();return r;}
const mapBox=(box,r)=>(ix,iy)=>[r[0]+(ix-box[0])*r[2]/box[2],r[1]+(iy-box[1])*r[3]/box[3]];

// A schematic ovule (not to scale): integuments with a micropyle at the top, the egg cell just inside it,
// and the central cell below. Drawn, not photographed.
function ovuleModel(c,x,y,R,{zyg=0,polar=1,t=0,eggGlow=0}={}){
  const gap=.2;
  c.save();c.beginPath();c.ellipse(x,y,R*.82,R,0,-Math.PI/2+gap,-Math.PI/2-gap+TAU);c.lineWidth=R*.16;c.strokeStyle='#cdb57c';c.stroke();
  c.beginPath();c.ellipse(x,y,R*.82,R,0,-Math.PI/2+gap,-Math.PI/2-gap+TAU);c.lineWidth=2;c.strokeStyle='#8a7444';c.stroke();c.restore();
  ellipse(c,x,y+R*.06,R*.66,R*.82,'#e9dcb4','#b9a372',2);
  ellipse(c,x,y+R*.12,R*.4,R*.6,'rgba(255,250,235,.85)','#c9b27e',2.5);
  const ex=x,ey=y-R*.3;
  if(eggGlow)glow(c,ex,ey,R*.32,EGG,eggGlow);
  circle(c,ex,ey,R*.15,zyg?mixHex('#f9d5e5','#c4f1ff',.35):'#f9d5e5',EGG,3);circle(c,ex,ey,R*.055,zyg?'#7c3a6b':'#b04a86');
  if(polar){circle(c,x-R*.07,y+R*.18,R*.05,'#d8c89a','#9a8456',1.5);circle(c,x+R*.07,y+R*.18,R*.05,'#d8c89a','#9a8456',1.5);}
  return{egg:[ex,ey],micro:[x,y-R],center:[x,y+R*.18]};
}
// Simple pollinator glyphs for the model box.
function bee(c,x,y,s,t,dir=1){c.save();c.translate(x,y);c.scale(dir*s,s);
  const fl=Math.sin(t*40)*.35;c.globalAlpha=.75;ellipse(c,-4,-14,12,7,'rgba(220,240,255,.85)','#cfe8ff',1.2,-.6+fl);ellipse(c,6,-14,12,7,'rgba(220,240,255,.85)','#cfe8ff',1.2,.6-fl);c.globalAlpha=1;
  ellipse(c,0,0,20,12,'#f5b82e',C.ink,2.5);[-7,1,9].forEach(dx=>{c.fillStyle=C.ink;c.fillRect(dx,-11,4,22);});circle(c,22,-2,8,'#3b2a1a',C.ink,2);c.restore();}
function flowerGlyph(c,x,y,r,col,t,hasPollen){for(let i=0;i<5;i++){const a=i*TAU/5+.3;ellipse(c,x+Math.cos(a)*r*.62,y+Math.sin(a)*r*.62,r*.5,r*.3,col,C.ink,2,a);}circle(c,x,y,r*.32,'#6abf69',C.ink,2);if(hasPollen)for(let i=0;i<6;i++){const a=i*TAU/6;circle(c,x+Math.cos(a)*r*.2,y+Math.sin(a)*r*.2,3.5,'#fcd34d','#7a5b0c',1);}}

// ── Tab 1: where the reproductive parts are ─────────────────────────────────
const parts=[P('完整花構造','Full flower'),P('雄蕊與花藥','Stamen and anther'),P('雌蕊與柱頭','Pistil and stigma'),P('子房內的胚珠','Ovules inside the ovary')];
const partText=[
 P('典型花的萼片、花瓣、雄蕊與雌蕊共同著生於花托。這張桃花縱切圖把花剖成兩半，外面的花瓣和裡面的子房一次都看得到；點標籤可以直接放大那個部位。','Typical sepals, petals, stamens and pistil are borne on a receptacle. This peach-blossom section shows the outer petals and the inner ovary at once; tap a label to enlarge that part.'),
 P('雄蕊由花絲和花藥組成，花藥內產生花粉。花粉不是一顆會游泳的精子；它參與形成或運送開花植物的雄配子。','A stamen consists of filament and anther. Pollen forms in anthers. A pollen grain is not a swimming sperm; it participates in forming or delivering the male gametes of flowering plants.'),
 P('雌蕊包括柱頭、花柱和基部膨大的子房。柱頭接收花粉；子房內含胚珠。不要把柱頭、子房與胚珠叫成同一個部位。','A pistil has a stigma, style and swollen ovary. The stigma receives pollen and the ovary contains ovules. These are distinct structures.'),
 P('胚珠位在子房內，卵細胞位在胚珠內。從整朵花放大到子房，再放大到一枚胚珠，就能看清楚一層包一層的關係；胚珠不是卵細胞本身，子房也不是單一胚珠。','Ovules lie inside the ovary and the egg cell lies within an ovule. Zooming from the whole flower to the ovary and then to one ovule shows the nesting: an ovule is not the egg cell, and an ovary is not one ovule.')
];
// Landmarks on peach_section.png (1175 × 982).
const PK={stigma:[590,20],style:[588,330],ovary:[662,600],ovule:[590,560],recept:[600,760],sepal:[330,615],petal:[150,330],anther:[675,115],filament:[684,240]};
const STRUCT=[
 {name:P('柱頭','Stigma'),at:'stigma',side:1,y:42,color:PIS,part:2},
 {name:P('花藥','Anther'),at:'anther',side:1,y:96,color:STAM,part:1},
 {name:P('花絲','Filament'),at:'filament',side:1,y:150,color:STAM,part:1},
 {name:P('花柱','Style'),at:'style',side:1,y:204,color:PIS,part:2},
 {name:P('胚珠','Ovule'),at:'ovule',side:1,y:282,color:OVU,part:3},
 {name:P('子房','Ovary'),at:'ovary',side:1,y:340,color:PIS,part:2},
 {name:P('花瓣','Petal'),at:'petal',side:0,y:170,color:C.white,part:0},
 {name:P('萼片','Sepal'),at:'sepal',side:0,y:388,color:C.white,part:0},
 {name:P('花托','Receptacle'),at:'recept',side:0,y:450,color:C.white,part:0}
];
const THUMB=[34,58,232,194];
function leftColumn(c,s,t,box,photo,photoName){
  panel(c,20,20,256,560);caption(c,P('整朵花（縱切）','Whole flower (section)'),34,48);
  const m=place(c,PEACH,...THUMB);if(!m)return null;const r=m.rect(box);dashedBox(c,r,C.yellow,2.5);
  if(photo){caption(c,P('真實照片（課本）','Real photo (textbook)'),34,292,C.cyan);D.round(c,32,302,232,214,12,C.deep);place(c,BOOK+photo,36,306,224,206);wrap(c,photoName,34,540,228,22,C.muted);}
  return r;
}
function drawStructure(c,s,t){
  if(s.part===0){
    panel(c,20,20,920,560);
    const m=place(c,PEACH,180,36,600,500);if(!m)return;
    const on=Math.floor(mod(t/1.5,STRUCT.length));
    STRUCT.forEach((L,i)=>{const a=m.map(...PK[L.at]);const p=pill(c,L.name,L.side?796:30,L.y,{active:i===on,color:L.color,anchor:a,maxX:936,hit:L.part?['part',L.part]:null});if(i===on)pulse(c,a[0],a[1],t,L.color,10);});
    legendRow(c,[[(x,y)=>circle(c,x,y,8,STAM,C.ink,2),P('雄蕊','Stamen')],[(x,y)=>circle(c,x,y,8,PIS,C.ink,2),P('雌蕊','Pistil')],[(x,y)=>circle(c,x,y,8,OVU,C.ink,2),P('胚珠','Ovule')]],36,560);
    text(c,P('點彩色標籤可放大','Tap a coloured label to enlarge'),926,560,22,C.muted,'right');
    s.shown=0;return;
  }
  if(s.part===1){
    const box=[330,30,420,380],from=leftColumn(c,s,t,box,'Im5195.png',P('百合花藥（課本照片）','Lily anthers'));if(!from)return;
    panel(c,292,20,648,560);const to=[302,60,470,425],u=zoomU(s,t),r=zoomed(c,PEACH,box,from,to,u);connectors(c,from,r,.55*(1-u*.4));
    if(u<.98)return;
    const M=mapBox(box,r);
    // pollen leaves the anthers and drifts down
    [[675,115],[410,68],[456,112],[480,160]].forEach(([ax,ay],j)=>{for(let i=0;i<5;i++){const q=mod(t*.42+i/5+j*.17);const [x,y]=M(ax+Math.sin(i*2.1+j)*30*q,ay+18+q*150);grain(c,x,y,4.5,1-q);}});
    pill(c,P('花藥','Anther'),790,96,{anchor:M(690,112),color:STAM,maxX:936});
    pill(c,P('花絲','Filament'),790,214,{anchor:M(684,240),color:STAM,maxX:936});
    [[702,146],[712,156],[700,160]].forEach(p=>grain(c,...M(...p),5.5));
    pill(c,P('花粉','Pollen'),790,330,{anchor:M(706,156),color:STAM,maxX:936});
    pill(c,P('雄蕊＝花藥＋花絲','Stamen = anther + filament'),302,500,{active:true,color:STAM,maxX:936,minX:302});
    wrap(c,P('花藥裡產生花粉，成熟後花藥裂開，花粉散出來。','Pollen forms inside the anther; the ripe anther splits and releases it.'),790,400,140,22,C.white);
    s.shown=1;return;
  }
  if(s.part===2){
    const box=[470,0,240,720],from=leftColumn(c,s,t,box,'Im5252.png',P('百合子房（課本照片）','Lily ovary'));if(!from)return;
    panel(c,292,20,648,560);const to=[316,40,173,520],u=zoomU(s,t),r=zoomed(c,PEACH,box,from,to,u);connectors(c,from,r,.55*(1-u*.4));
    if(u<.98)return;
    const M=mapBox(box,r),route=[[590,20],[589,200],[588,420],[590,560]].map(p=>M(...p)),q=mod(t/4.2),k=q<.25?0:q<.7?1:2;
    glow(c,...along(route,Math.min(1,q*1.2)),26,C.yellow,.7);
    const rows=[[P('柱頭','Stigma'),P('接住花粉','Catches pollen'),M(590,20),52],[P('花柱','Style'),P('連接柱頭與子房','Joins stigma to ovary'),M(588,300),196],[P('子房','Ovary'),P('裡面有胚珠','Holds the ovules'),M(660,600),360]];
    rows.forEach(([n,d,a,y],i)=>{const p=pill(c,n,520,y,{anchor:a,active:i===k,color:PIS,maxX:936});wrap(c,d,p.x+p.w+12,y+28,936-(p.x+p.w+12),22,i===k?C.white:C.muted);});
    pill(c,P('雌蕊＝柱頭＋花柱＋子房','Pistil = stigma + style + ovary'),520,500,{active:true,color:PIS,maxX:936});
    s.shown=2;return;
  }
  const box=[490,470,200,240],from=leftColumn(c,s,t,box,'Im5251.png',P('百合胚珠（課本照片）','Lily ovules'));if(!from)return;
  panel(c,292,20,648,560);
  const to=[302,96,300,360],u1=zoomU(s,t),r=zoomed(c,PEACH,box,from,to,u1);connectors(c,from,r,.55*(1-u1*.4));
  caption(c,P('放大：子房','Enlarged: ovary'),306,80);
  if(u1<.98)return;
  const M=mapBox(box,r),ob=[540,500,100,150],obr=[...M(ob[0],ob[1]),ob[2]*r[2]/box[2],ob[3]*r[3]/box[3]];
  dashedBox(c,obr,OVU,2.5);
  pill(c,P('子房','Ovary'),306,470,{anchor:M(526,560),color:PIS,maxX:600});
  pill(c,P('胚珠','Ovule'),460,470,{anchor:M(590,640),color:OVU,maxX:600});
  const u2=zoomU(s,t,.9,1.1),area=[640,70,280,400],R=mix(20,150,u2),cx=mix(obr[0]+obr[2]/2,780,u2),cy=mix(obr[1]+obr[3]/2,280,u2);
  if(u2>0){c.save();c.globalAlpha=clamp(u2*2);connectors(c,obr,[cx-R*.82,cy-R,R*1.64,R*2],.5);const o=ovuleModel(c,cx,cy,R,{t,eggGlow:u2>.98?.35+.2*Math.sin(t*3):0});c.restore();
    if(u2>.98){caption(c,P('一枚胚珠（放大示意）','One ovule (model)'),652,60,OVU);pill(c,P('卵細胞','Egg cell'),800,450,{anchor:o.egg,active:true,color:EGG,maxX:936});}}
  if(u2>.98){text(c,P('子房 ⊃ 胚珠 ⊃ 卵細胞','Ovary ⊃ ovule ⊃ egg cell'),306,560,24,C.yellow);}
  s.shown=3;
}

// ── Tab 2: pollen must reach the stigma ─────────────────────────────────────
function drawPollination(c,s,t){
  panel(c,20,20,592,560);panel(c,628,20,312,560);
  const m=place(c,PEACH,30,60,572,476);if(!m)return;
  const A=m.map(840,108),S=m.map(590,24),PT=m.map(1030,300),toStigma=s.target==='stigma',end=toStigma?S:PT;
  const path=arc(A,end,toStigma?70:40),T=t-(s.start||0),loop=mod(T,6);
  pill(c,P('花藥','Anther'),470,46,{anchor:A,color:STAM,maxX:600});
  pill(c,P('柱頭','Stigma'),40,40,{anchor:S,color:PIS,active:toStigma,hit:['target','stigma'],maxX:600});
  pill(c,P('花瓣','Petal'),470,300,{anchor:m.map(1000,360),color:C.pink,active:!toStigma,hit:['target','petal'],maxX:600});
  c.save();c.setLineDash([6,7]);line(c,path,rgba(C.yellow,.55),2.5);c.restore();
  const N=3,landed=[];
  for(let i=0;i<N;i++){const q=clamp((loop-i*.7)/1.8);if(q<=0)continue;const [x,y]=along(path,q);if(q<1)grain(c,x,y,7);else landed.push(i);}
  landed.forEach(i=>grain(c,end[0]+(i-1)*9,end[1]+(i%2?3:-2),6.5));
  const dz=toStigma?[S[0]-34,S[1]-22,68,44]:[PT[0]-40,PT[1]-30,80,60];dashedBox(c,dz,toStigma?PIS:C.pink,2.5);
  // enlargement on the right
  caption(c,toStigma?P('放大：柱頭表面（示意）','Enlarged stigma (model)'):P('放大：花瓣表面','Enlarged: petal surface'),644,52,toStigma?PIS:C.pink);
  const zr=[644,74,280,140];connectors(c,dz,zr,.45);D.round(c,...zr,12,C.deep);
  const spots=toStigma?[[150,32],[205,24],[258,32]]:[[1000,290],[1030,312],[1062,296]];
  let Mz;
  if(toStigma){const box=[80,0,250,135];crop(c,PIST,box,[zr[0]+26,zr[1]+6,230,124]);Mz=mapBox(box,[zr[0]+26,zr[1]+6,230,124]);}
  else{const box=[960,250,140,90];c.save();c.beginPath();c.roundRect(...zr,12);c.clip();crop(c,PEACH,box,[zr[0],zr[1]-10,zr[2],zr[2]*90/140]);c.restore();Mz=mapBox(box,[zr[0],zr[1]-10,zr[2],zr[2]*90/140]);}
  landed.forEach(i=>{const [x,y]=Mz(...spots[i]);grain(c,x,y-8,13);});
  const done=landed.length===N;
  if(toStigma){if(landed.length)tick(c,zr[0]+zr[2]-30,zr[1]+zr[3]-26,16);
    const h=wrap(c,P('花粉到了柱頭＝授粉。','Pollen on the stigma = pollination.'),644,250,282,24,C.green);
    wrap(c,P('柱頭表面能黏住花粉。但授粉還不是受精：接下來花粉要長出花粉管。','The stigma surface holds pollen. Pollination is not yet fertilization: next the pollen grows a tube.'),644,258+h,282,22,C.white);}
  else{if(landed.length)cross(c,zr[0]+zr[2]-30,zr[1]+zr[3]-28,14);
    const h=wrap(c,P('落在花瓣上，不算授粉。','Landing on a petal is not pollination.'),644,250,282,24,'#ff8a8a');
    wrap(c,P('花瓣上沒有柱頭，花粉留在這裡不會長出花粉管，後面的過程也不會開始。','A petal has no stigma; pollen left here grows no tube, so nothing further happens.'),644,258+h,282,22,C.white);}
  const chain=[P('授粉','Pollination'),P('長出花粉管','Tube grows'),P('受精','Fertilization')];
  chain.forEach((n,i)=>{const y=446+i*44;D.round(c,644,y,282,36,10,toStigma&&i===0&&landed.length?C.green:'rgba(11,26,21,.6)',C.edge);text(c,n,660,y+26,22,toStigma&&i===0&&landed.length?C.deep:(toStigma?C.white:C.muted));if(!toStigma)cross(c,906,y+18,8);else if(i>0)text(c,P('下一頁','Next tab'),914,y+26,22,C.muted,'right');});
  text(c,P('點左圖的「柱頭」或「花瓣」換落點','Tap Stigma or Petal to change'),40,566,22,C.muted);
  s.shown=done?1:0;
}

// ── Tab 3: the pollen tube delivers sperm cells ────────────────────────────
const tubeNames=[P('柱頭已有花粉','Pollen on the stigma'),P('花粉管沿花柱生長','Tube grows down the style'),P('花粉管進入胚珠','Tube reaches an ovule'),P('精細胞與卵結合','Sperm cell unites with egg')];
const tubeText=[
 P('授粉完成時，花粉位在柱頭表面，尚未等於受精。合適的花粉可以萌發花粉管；不是整粒花粉直接掉進子房。','After pollination, pollen rests on the stigma. This is not yet fertilization. Compatible pollen may germinate a tube rather than dropping as a whole grain into the ovary.'),
 P('花粉管由花粉萌發，沿花柱中的組織向子房和胚珠生長。管是逐段伸長的構造，不是精細胞在空中游向胚珠。','The tube grows from a pollen grain through the style toward an ovule. It extends progressively; sperm cells are not swimming through open air.'),
 P('花粉管到達胚珠，把精細胞運到卵附近。開花植物的精細胞沒有用於自行游泳的鞭毛，本圖用無尾的小點表示，並清楚標為放大模型。','The pollen tube reaches an ovule and delivers sperm cells near the egg. Flowering-plant sperm lack swimming flagella. Tailless dots are enlarged model symbols.'),
 P('一個精細胞與卵結合形成受精卵，之後發育成胚。補充：開花植物另有一個精細胞參與形成胚乳；這裡聚焦卵受精，不把花粉粒說成受精卵。','One sperm cell unites with the egg to form the zygote that develops into an embryo. Extension: another sperm cell contributes to endosperm formation. This model focuses on egg fertilization; pollen is not the zygote.')
];
// Route of the tube on pistil_section.png (395 × 1043): stigma → style canal → ovary cavity → lower-left ovule.
const TUBE=[[205,40],[206,130],[207,240],[207,420],[207,600],[201,660],[188,740],[168,820],[150,870],[141,884]];
function drawTube(c,s,t){
  const {k,u,held}=stageClock(s,t,4,3.4);s.shown=k;
  panel(c,20,20,312,560);
  caption(c,P('真實顯微照片（課本）','Real micrograph'),34,48,C.cyan);
  D.round(c,32,58,288,176,12,C.deep);place(c,BOOK+'Im3935.png',34,60,284,172);
  wrap(c,P('百合花粉長出花粉管','Lily pollen tube'),34,258,284,22,C.muted);
  steps(c,tubeNames,k,32,292,288,44,6);
  panel(c,344,20,596,560);
  const m=place(c,PIST,352,32,230,536);if(!m)return;
  const pts=TUBE.map(p=>m.map(...p)),G=m.map(205,34);
  const grow=k===0?0:k===1?(held?.62:.62*ease(u*1.1)):1;
  const reach=k===2?(held?1:ease(u*1.6)):k>2?1:0;
  const tubeU=k<2?grow:mix(.62,1,clamp(reach*1.6));
  if(k===0)pulse(c,G[0],G[1],t,C.yellow,12);
  if(tubeU>0){const sub=subPath(pts,tubeU),tip=sub[sub.length-1];tubeLine(c,sub,6);if(k<3)glow(c,...tip,14,C.yellow,.4+.3*Math.sin(t*4));circle(c,...tip,5,'#fff7c2',C.ink,1.5);}
  grain(c,G[0],G[1]-2,10);
  if(k===2){const sq=clamp((reach-.55)/.45);for(let i=0;i<2;i++){const [x,y]=along(pts,mix(.15,.97,clamp(sq-i*.08)));spermCell(c,x,y,5);}}
  pill(c,P('柱頭','Stigma'),556,96,{anchor:m.map(318,70),color:PIS,maxX:640});
  pill(c,P('花柱','Style'),470,250,{anchor:m.map(250,330),color:PIS,maxX:600});
  pill(c,P('子房','Ovary'),470,370,{anchor:m.map(330,700),color:PIS,maxX:600});
  if(k>=1&&k<3)pill(c,P('花粉管','Pollen tube'),352,170,{anchor:m.map(207,330),color:C.yellow,active:true,maxX:600});
  // enlargement of the target ovule
  const ob=[85,846,84,84],obr=m.rect(ob);dashedBox(c,obr,OVU,2.5);
  const Z=[770,300],R=148;connectors(c,obr,[Z[0]-R*.82,Z[1]-R,R*1.64,R*2],.45);
  caption(c,P('放大：一枚胚珠（示意）','Enlarged ovule (model)'),650,52,OVU);
  const u3=k===3?(held?u:clamp(u*1.4)):0,zyg=k===3?clamp((u3-.6)/.3):0;
  const o=ovuleModel(c,Z[0],Z[1],R,{eggGlow:k===3?.25+.45*zyg+.12*Math.sin(t*3):0,zyg:zyg>.98?1:0});
  const zt=[[925,96],[870,118],[815,132],[o.micro[0],o.micro[1]+4]];
  if(k>=2){const zu=k===2?clamp(reach*1.3):1;tubeLine(c,subPath(zt,zu),10);
    if(k===2){const sq=clamp((reach-.55)/.45);for(let i=0;i<2;i++){const [x,y]=along(zt,clamp(sq-i*.12));if(sq>i*.12)spermCell(c,x,y,8);}}
    else{const a=ease(clamp(u3*1.8)),e=o.egg,cc=o.center,m0=[o.micro[0],o.micro[1]+4];
      if(zyg<.98)spermCell(c,mix(m0[0],e[0],a),mix(m0[1],e[1],a),8);
      spermCell(c,mix(m0[0]+10,cc[0]+18,a),mix(m0[1],cc[1],a),8);
      if(zyg>.98){pill(c,P('受精卵','Zygote'),800,186,{anchor:e,active:true,color:EGG,maxX:936});pill(c,P('補充：形成胚乳','Extension: endosperm'),690,470,{anchor:[cc[0]+18,cc[1]],color:C.muted,maxX:936});}}}
  if(!(k===3&&zyg>.98))pill(c,P('卵細胞','Egg cell'),810,186,{anchor:o.egg,color:EGG,maxX:936});
  legendRow(c,[[(x,y)=>grain(c,x,y,7),P('花粉','Pollen')]],616,530);legendRow(c,[[(x,y)=>spermCell(c,x,y,6),P('精細胞（無尾）','Sperm cell (no tail)')]],616,564);
}

// ── Tab 4: ovary to fruit, ovule to seed; then germination ──────────────────
const fruitCases=[P('一粒種子（特例：櫻桃）','One seed (special case: cherry)'),P('多粒種子（豌豆）','Many seeds (pea)')];
const conditions=[P('水、氧氣與溫度適合','Suitable water, oxygen and temperature'),P('缺水','Too little water'),P('氧氣不足','Insufficient oxygen'),P('溫度不適合','Unsuitable temperature')];
const germNames=[P('種子吸水膨脹','The seed takes up water'),P('胚根先長出來','The radicle emerges first'),P('根往下長','The root grows down'),P('莖葉往上長，子葉出土','Shoot rises; seed leaves emerge')];
const SPECIAL=P('特例：櫻桃、桃的子房有 2 枚胚珠，通常只有 1 枚長成種子；縱切圖只切到 1 枚。','Special case: cherry and peach ovaries hold 2 ovules; usually only 1 becomes a seed. The section shows one.');
// Peas inside the opened pod on pea_plant.png (1400 × 928)
const PEAS=[[791,592],[794,621],[797,651],[800,682],[803,714],[806,746],[809,778],[812,810]];
// Ovules on pistil_section.png
const OVULES=[[145,690],[113,763],[103,833],[125,898],[275,690],[302,760],[303,820],[285,875]];
function drawMapping(c,s,t){
  const T=t-(s.start||0),loop=mod(T,8),g=ease(clamp((loop-1)/2.4)),one=s.example===0;
  panel(c,20,20,920,560);
  caption(c,P('受精後的子房','Ovary after fertilization'),36,52,PIS);caption(c,one?P('果實（課本照片）','Fruit (textbook photos)'):P('果實：豆莢','Fruit: the pod'),640,52,C.pink);
  let fromOvary,fromOvule,toFruit,toSeed;
  if(one){const box=[460,410,260,330];D.round(c,36,66,262,330,12,'rgba(11,26,21,.5)');crop(c,PEACH,box,[36,66,260,330]);const M=mapBox(box,[36,66,260,330]);
    fromOvary=M(662,600);fromOvule=M(590,575);
    const k=mix(.35,1,g);D.round(c,630,66,290,290,12,C.deep);place(c,BOOK+'Im3933.png',775-130*k,211-130*k,260*k,260*k);
    if(g>.98){place(c,BOOK+'Im3934.png',36,410,120,118);text(c,P('外觀','Outside'),166,476,22,C.muted);}
    toFruit=[648+0,250];toSeed=[775,215];
    wrap(c,SPECIAL,340,436,580,22,C.orange);
  }else{const box=[0,560,395,483];D.round(c,36,66,262,330,12,'rgba(11,26,21,.5)');crop(c,PIST,box,[44,70,246,302]);const M=mapBox(box,[44,70,246,302]);
    fromOvary=M(20,800);fromOvule=M(...OVULES[2]);
    OVULES.forEach((p,i)=>{if(!s.all&&i!==2){const [x,y]=M(...p);cross(c,x,y,7,'#ff8a8a');}});
    const pb=[760,500,92,370],k=mix(.45,1,g),H=400*k,W=H*pb[2]/pb[3],pr=[775-W/2,74+(400-H)/2,W,H];crop(c,PEA,pb,pr);const Mp=mapBox(pb,pr);
    if(!s.all&&g>.6)PEAS.forEach((p,i)=>{if(i!==2){const [x,y]=Mp(...p),q=pr[2]/pb[2];ellipse(c,x,y,15*q,14*q,'#a9c46f');ellipse(c,x,y,5*q,3.5*q,'#7a6a3a','#3d3218',1.2);}});
    toFruit=Mp(830,700);toSeed=Mp(...PEAS[2]);
    wrap(c,s.all?P('8 枚胚珠都受精發育 → 8 粒種子，全部在同一個豆莢裡。','All 8 ovules develop → 8 seeds, all in one pod.'):P('只有 1 枚胚珠完成發育 → 豆莢裡只有 1 粒飽滿的種子。','Only 1 ovule completes → the pod holds 1 full seed.'),340,436,390,22,C.white);
  }
  arrow(c,318,230,mix(330,610,g),230,C.white,4);text(c,P('發育','Develops'),464,214,22,C.white,'center');
  if(g>.98){c.save();c.setLineDash([8,6]);line(c,[fromOvary,[fromOvary[0]+60,140],[toFruit[0]-40,140],toFruit],rgba(C.pink,.9),3);line(c,[fromOvule,[fromOvule[0]+40,330],[toSeed[0]-40,330],toSeed],rgba(OVU,.95),3);c.restore();
    pill(c,P('子房 → 果實','Ovary → fruit'),400,110,{active:true,color:C.pink,maxX:620});pill(c,P('胚珠 → 種子','Ovule → seed'),400,310,{active:true,color:OVU,maxX:620});}
  pill(c,P('子房','Ovary'),36,76,{anchor:fromOvary,color:PIS,maxX:300});pill(c,P('胚珠','Ovule'),190,350,{anchor:fromOvule,color:OVU,maxX:300});
  if(g>.98){pill(c,P('果實','Fruit'),830,76,{anchor:toFruit,color:C.pink,maxX:936});pill(c,P('種子','Seed'),830,300,{anchor:toSeed,color:OVU,maxX:936});}
  text(c,P('受精卵 → 胚（在種子裡）','Zygote → embryo (inside the seed)'),340,556,22,C.yellow);
}
// Germination strip: four snapshots of the same kind of bean; stage k shows only once it is reached.
const STAGE_X=[0,380,680,990,1500];
function drawGermination(c,s,t){
  const ok=s.condition===0,T=t-(s.start||0),k=ok?Math.min(3,Math.floor(mod(T,10)/2.2)):0,fade=ok?clamp(mod(T,10)/2.2-k):0;s.shown=k;
  panel(c,20,20,604,560);panel(c,636,20,304,560);
  const area=[30,74,584,400],kk=area[2]/1500;
  place(c,SOIL,...area);
  const im=pic(STRIP);
  if(im){for(let i=0;i<=k;i++){const x0=STAGE_X[i],x1=STAGE_X[i+1];c.save();c.globalAlpha=i===k&&ok&&i>0?clamp(fade*3):1;c.drawImage(im,x0,0,x1-x0,1026,area[0]+x0*kk,area[1],(x1-x0)*kk,1026*kk);c.restore();}}
  for(let i=0;i<4;i++){const cx=area[0]+(STAGE_X[i]+STAGE_X[i+1])/2*kk,y=area[1]+16;circle(c,cx,y+8,16,i<=k?C.yellow:'rgba(11,26,21,.8)',i<=k?C.white:C.edge,2);text(c,String(i+1),cx,y+16,22,i<=k?C.deep:C.muted,'center');}
  const soilY=area[1]+485*kk,seed=[area[0]+185*kk,area[1]+540*kk];
  if(s.condition!==1)for(let i=0;i<6;i++){const q=mod(t*.5+i/6),x=area[0]+40+i*98,y=mix(area[1]+60,soilY+40,q);c.save();c.globalAlpha=1-q*.6;c.beginPath();c.moveTo(x,y-14);c.quadraticCurveTo(x+11,y+3,x,y+10);c.quadraticCurveTo(x-11,y+3,x,y-14);c.fillStyle='#7dd3fc';c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();c.restore();}
  else{c.save();c.fillStyle='rgba(214,170,110,.28)';c.fillRect(area[0],soilY,area[2],area[3]-(soilY-area[1]));c.restore();text(c,P('土壤乾燥','Dry soil'),area[0]+area[2]-14,soilY+40,22,'#f5d29b','right');}
  if(s.condition!==2)for(let i=0;i<8;i++){const q=mod(t*.3+i/8),x=area[0]+30+i*76+Math.sin(t*2+i)*6,y=mix(area[3]+area[1]-10,soilY+14,q);circle(c,x,y,7,'rgba(244,114,182,.25)','rgba(244,114,182,.9)',1.5);}
  else{c.save();c.fillStyle='rgba(56,189,248,.28)';c.fillRect(area[0],soilY,area[2],area[3]-(soilY-area[1]));c.restore();text(c,P('土壤積水，空氣進不去','Waterlogged: no air'),area[0]+area[2]-14,soilY+40,22,'#bae6fd','right');}
  if(!ok){cross(c,seed[0]+70,seed[1]-60,14);wrap(c,P('種子不會萌發','The seed does not germinate'),area[0]+(STAGE_X[1]+20)*kk,area[1]+130,area[2]-(STAGE_X[1]+40)*kk,24,'#ff8a8a');}
  // condition panel
  caption(c,P('萌發條件','Conditions'),650,52);
  const rows=[[P('水分','Water'),s.condition!==1,'#7dd3fc'],[P('氧氣','Oxygen'),s.condition!==2,C.pink],[P('溫度','Temperature'),s.condition!==3,C.orange]];
  rows.forEach(([n,good,col],i)=>{const y=70+i*58;D.round(c,648,y,280,48,12,'rgba(11,26,21,.6)',good?C.edge:'#ff8a8a');text(c,i===2&&!good?P('溫度：太冷或太熱','Temp: too cold/hot'):n,664,y+32,22,col);if(good)tick(c,900,y+24,10);else cross(c,900,y+24,9);});
  steps(c,germNames,ok?k:-1,648,250,280,42,6);
  legendRow(c,[[(x,y)=>{c.beginPath();c.moveTo(x,y-10);c.quadraticCurveTo(x+8,y+3,x,y+8);c.quadraticCurveTo(x-8,y+3,x,y-10);c.fillStyle='#7dd3fc';c.fill();},P('水','Water')],[(x,y)=>circle(c,x,y,6,'rgba(244,114,182,.25)','rgba(244,114,182,.9)',1.5),P('氧氣','Oxygen')]],652,566);
  wrap(c,P('同一種豆子四個時期的示意，不是實測天數。','Four stages of the same kind of bean; not measured days.'),36,514,576,22,C.muted);
}
function drawFruit(c,s,t){if(s.view==='mapping'){drawMapping(c,s,t);s.shown=0;}else drawGermination(c,s,t);}

// ── Tab 5: wind or insects ─────────────────────────────────────────────────
const pollinators=[
 ['Im5074.png',P('玉米：風媒花','Corn: wind pollination'),P('玉米的花粉由雄花傳出，風可把它帶到雌花的柱頭（玉米鬚）。照片原有的雌雄花位置分開；風吹花粉到柱頭才是授粉，不是落在任意葉片都算成功。','Corn pollen is shed from male flowers and wind can carry it to receptive stigmas, the silks. Arrival on a stigma is pollination; landing on any leaf does not count.'),'wind',P('風媒花：花粉多又輕，花不鮮豔也能授粉。','Wind: lots of light pollen; no bright petals needed.')],
 ['Im5075.png',P('木槿：蟲媒花','Rose of Sharon: insect pollination'),P('課本這張照片是木槿，不是把同科的朱槿混稱同一種。花色、氣味、蜜源及構造可能吸引昆蟲，但不能只看鮮豔就保證每一朵都完成授粉。','The textbook photograph is rose of Sharon, not the separate hibiscus species used for the pollen image. Colour, scent, nectar and structure may attract insects, without guaranteeing pollination.'),'insect',P('蟲媒花常有鮮豔花色、香氣或花蜜，可吸引昆蟲。','Insect flowers often have colour, scent or nectar that can attract insects.')],
 ['Im5076.png',P('百日草與昆蟲','Zinnia and a visiting insect'),P('昆蟲訪花時可帶走並傳遞花粉；訪花不一定等於完成授粉，需要花粉接觸合適的柱頭。這是一張靜態原照片，不是昆蟲運動追蹤。','A visiting insect may collect and carry pollen. A visit alone does not prove pollination: pollen must contact a suitable stigma. This is a static original photograph, not movement tracking.'),'insect',P('昆蟲訪花時身上沾到花粉，可能帶到另一朵花的柱頭。','A visiting insect picks up pollen and may carry it to another flower\'s stigma.')],
 ['Im5278.png',P('鼠尾草：降落平台','Sage: a landing platform'),P('唇形花瓣可提供昆蟲降落的位置。花的形狀和授粉行為有關，不只靠花朵顏色。','A lip-shaped petal can provide a landing platform. Flower shape matters as well as colour.'),'insect',P('唇形花瓣像降落平台，昆蟲停下來就碰到花粉。','The lip petal is a landing pad; a landing insect brushes the pollen.')],
 ['Im5279.png',P('同一花的可見光與紫外光','Visible-light and ultraviolet views'),P('上方為一般光下的驢蹄草，下方為課本呈現的紫外光／模擬昆蟲視覺。它不是人眼平常看到的黑藍花色，也不是所有昆蟲都有完全相同的視覺。','The upper marsh-marigold view uses ordinary light; the lower is the textbook ultraviolet/insect-vision representation. It is not the everyday human-visible flower colour or the exact vision of every insect.'),'uv',P('許多昆蟲看得到紫外光；花瓣上可能有人眼看不到的「路標」。','Many insects see ultraviolet; petals may carry guides we cannot see.')]
];
function drawVectors(c,s,t){
  const a=pollinators[s.case];s.shown=s.case;
  panel(c,20,20,596,560);panel(c,632,20,308,560);
  caption(c,P('真實照片（課本）','Real photo (textbook)'),36,52,C.cyan);
  if(a[3]==='uv'){const q=.5+.5*Math.sin(t*1.2),uv=q>.5;D.round(c,30,64,576,470,12,C.deep);
    const im=pic(BOOK+a[0]);if(im){const k=Math.min(560/719,454/462),w=719*k,h=462*k,x=318-w/2,y=299-h/2;c.save();c.globalAlpha=1;c.drawImage(im,0,0,719,462,x,y,w,h);c.globalAlpha=clamp((q-.3)*2.5);c.drawImage(im,0,466,719,458,x,y,w,h);c.restore();}
    pill(c,uv?P('紫外光呈現（模擬昆蟲看到的）','Ultraviolet view (insect-like)'):P('一般光（人眼看到的）','Ordinary light (human view)'),40,480,{active:true,color:uv?C.cyan:C.yellow,maxX:600});
  }else{D.round(c,30,64,576,470,12,C.deep);place(c,BOOK+a[0],34,68,568,462);}
  caption(c,P('傳粉模型（示意）','Transfer model'),648,52,C.yellow);D.round(c,646,64,280,230,12,'rgba(11,26,21,.6)');
  if(a[3]==='wind'){
    // tassel releasing many light grains, wind carries a few to the silk
    line(c,[[690,250],[690,110]],'#6abf69',5);for(let i=0;i<5;i++)line(c,[[690,112],[668+i*11,86+Math.abs(i-2)*8]],'#d6c56a',4);
    line(c,[[880,250],[880,180]],'#6abf69',6);for(let i=0;i<5;i++)line(c,[[880,182],[858+i*10,150-Math.abs(i-2)*6]],'#e8b4a0',2);
    for(let i=0;i<14;i++){const q=mod(t*.35+i/14),x=mix(694,880,q),y=96+Math.sin(q*6+i)*22+q*44+(i%3)*8;grain(c,x,y,3.5,1-Math.max(0,q-.85)*6);}
    for(let i=0;i<3;i++){const w=mod(t*.6+i/3);line(c,[[660+w*240,120+i*30],[690+w*240,116+i*30]],rgba(C.cyan,.7),2.5);}
    text(c,P('風 →','Wind →'),786,92,22,C.cyan,'center');text(c,P('雄花','Male'),690,280,22,C.white,'center');text(c,P('雌花（鬚）','Silk'),880,280,22,C.white,'center');
  }else if(a[3]==='insect'){
    const q=mod(t/5),fly=q<.15?0:q<.6?ease((q-.15)/.45):1,p=arc([712,170],[862,170],70)[Math.round(fly*26)];
    flowerGlyph(c,712,190,46,'#f9a8d4',t,true);flowerGlyph(c,862,190,46,'#f9a8d4',t,q>.65);
    bee(c,p[0],p[1]-28,1,t,fly<1?1:-1);if(fly<1){for(let i=0;i<4;i++)circle(c,p[0]-8+i*5,p[1]-18,3,'#fcd34d','#7a5b0c',1);}
    if(q>.65)glow(c,862,190,26,C.yellow,.6*(1-mod(q*3)));
    text(c,P('花 A','Flower A'),712,280,22,C.white,'center');text(c,P('花 B','Flower B'),862,280,22,C.white,'center');
  }else{
    const q=.5+.5*Math.sin(t*1.2);flowerGlyph(c,786,170,70,mixHex('#fde047','#60a5fa',clamp((q-.3)*2.5)),t,false);
    if(q>.55)for(let i=0;i<5;i++){const ang=i*TAU/5+.3;line(c,[[786+Math.cos(ang)*22,170+Math.sin(ang)*22],[786+Math.cos(ang)*48,170+Math.sin(ang)*48]],'#0b1a3a',5);}
    text(c,P('紫外光下的「路標」','Ultraviolet "guides"'),786,280,22,C.white,'center');
  }
  wrap(c,a[4],648,330,282,24,C.yellow);
  wrap(c,P('完整說明在畫面下方。','More notes below.'),648,560,282,22,C.muted);
}

// ── Tab 6: the observation lab ─────────────────────────────────────────────
const labCases=[
 [null,P('外形：觀察完整百合','Observe the whole lily'),P('先觀察花的外形、顏色、香氣、花藥與柱頭。僅記錄實際所見，不把照片沒有顯示的氣味或黏液當成已測到。百合內外兩輪花被相似，需依位置辨識。','Record visible form, colour, anthers and stigma. Do not claim that scent or stickiness was measured from a photograph. Lily petal and sepal whorls look similar; distinguish them by position.')],
 ['Im5195.png',P('花藥與花絲原照片','Original anther and filament'),P('從花藥沾取少許花粉，放到載玻片的一滴水中，再輕放蓋玻片，使用複式顯微鏡觀察。這裡保留課本照片，沒有生成顯微鏡下的花粉。','Collect a little pollen from an anther, place it in a water drop on a slide and gently lower a coverslip for compound-microscope observation. The photograph is original; microscopy is not generated.')],
 ['Im5252.png',P('保留雌蕊，子房縱切','Retain the pistil; cut the ovary lengthwise'),P('先移除萼片、花瓣與雄蕊，留下雌蕊。由老師操作刀片，將膨大的子房縱切；學生不可把刀片朝手指切。這張原圖保留切割方向，不用左右搖晃替代操作。','Remove sepals, petals and stamens, retaining the pistil. The teacher handles the blade and cuts the swollen ovary lengthwise. Keep fingers clear; a moving photograph is not a dissection.')],
 ['Im5251.png',P('百合子房內的胚珠','Ovules inside a lily ovary'),P('用解剖顯微鏡觀察縱切子房內的胚珠並畫圖。原照片的細節和課本 0.6 mm 比例尺可對照；數位放大不會增加原圖解析度。','Use a dissecting microscope to observe and sketch ovules in the longitudinal section. Refer to the textbook 0.6 mm scale. Digital enlargement adds no new resolution.')],
 ['Im5260.png',P('朱槿花粉原顯微影像','Original hibiscus pollen micrograph'),P('這張是課本的朱槿花粉顯微照片，不是百合花粉。比較輪廓與表面紋路，並對照課本 110 μm 比例尺；不能直接用不同排版照片的畫面大小比較真實尺寸。','This is a textbook hibiscus pollen micrograph, not lily pollen. Compare outline and surface features, referring to the 110 μm scale in the book. Displayed sizes across layouts are not physical-size comparisons.')],
 ['Im3935.png',P('百合花粉管原顯微影像','Original lily pollen-tube micrograph'),P('課本照片顯示百合花粉萌發的花粉管，比例尺為 100 μm。它是單一靜態影像，不能由一張照片算出生長速率；花粉管分頁的動畫才是另外建立的解釋模型。','The textbook photo shows a germinated lily pollen tube with a 100 μm textbook scale. A single static image gives no growth rate; the animation in the pollen-tube tab is a separate explanatory model.')]
];
const labRecord=P('記錄：你觀察的花色、香味與各部位；畫花粉輪廓與紋路；畫子房縱切和胚珠位置。思考：與朱槿花粉有哪些異同？你觀察的胚珠數能支持什麼種子數推論，還需要哪些條件？保留你的觀察，不自動填答案。','Record flower colour, scent and structures; sketch pollen outline and surface; sketch the ovary section and ovules. Compare with hibiscus pollen. What seed-number inference does your ovule count support, and what conditions remain necessary? Keep your observations; no automatic answers are supplied.');
// Landmarks on lily.png (1415 × 1023)
const LK={stigma:[862,22],anther:[884,212],filament:[640,420],tepalOut:[120,330],tepalIn:[1240,330],ovary:[700,620]};
function drawLab(c,s,t){
  const a=labCases[s.case];s.shown=s.case;
  panel(c,20,20,612,560);panel(c,648,20,292,560);
  if(s.case===0){
    caption(c,P('百合（AI 教學插圖）','Lily (AI teaching illustration)'),36,52,C.cyan);
    const m=place(c,LILY,30,92,600,430);if(!m)return;
    const L=[[P('柱頭（3 裂）','Stigma (3 lobes)'),'stigma',PIS,40,70],[P('花藥','Anther'),'anther',STAM,470,110],[P('花絲','Filament'),'filament',STAM,40,250],[P('花被（共 6 片）','Tepals (6 in all)'),'tepalIn',C.pink,440,440],[P('子房在花被裡面','Ovary inside the tepals'),'ovary',PIS,300,520]];
    const on=Math.floor(mod(t/1.6,L.length));
    L.forEach(([n,key,col,x,y],i)=>{const an=m.map(...LK[key]);pill(c,n,x,y,{anchor:an,active:i===on,color:col,maxX:624});if(i===on)pulse(c,an[0],an[1],t,col,9);});
    caption(c,P('數一數','Count them'),664,52);
    [[P('花被','Tepals'),'6',C.pink],[P('雄蕊','Stamens'),'6',STAM],[P('雌蕊','Pistil'),'1',PIS]].forEach(([n,v,col],i)=>{const y=70+i*60;D.round(c,662,y,264,50,12,'rgba(11,26,21,.6)',C.edge);text(c,n,678,y+33,22,col);text(c,s.reveal?v:'?',906,y+35,28,s.reveal?C.white:C.muted,'right');});
    D.hit(662,70,264,170,'reveal',s.reveal?0:1);wrap(c,s.reveal?P('點一下收起','Tap to hide'):P('自己數完，再點一下對答案','Count first, then tap to check'),664,268,264,22,C.muted);
    wrap(c,P('外輪 3 片是花萼、內輪 3 片是花瓣，長得很像，要看位置分辨。','The outer 3 are sepals and the inner 3 petals; they look alike, so use position.'),664,340,264,22,C.white);
    wrap(c,P('依序觀察，自己記錄','Observe in order; record it yourself'),664,540,264,22,C.muted);
    return;
  }
  caption(c,P('真實照片（課本）','Real photo (textbook)'),36,52,C.cyan);D.round(c,30,64,592,470,12,C.deep);
  const m=place(c,BOOK+a[0],34,68,584,462),y0=52+wrap(c,a[1],664,52,264,22,C.yellow);
  if(s.case===1){
    // slide preparation, drawn as a looping model
    const q=mod(t/6),Y=y0+34;D.round(c,666,Y,256,64,6,'rgba(186,230,253,.25)','#bae6fd');
    if(q>.15){const d=ease((q-.15)/.15);ellipse(c,794,Y+32,30*d,12*d,'rgba(125,211,252,.7)','#7dd3fc',2);}
    if(q>.32)for(let i=0;i<6;i++){const f=ease((q-.32-i*.02)/.15),x=780+(i%3)*12,y=mix(Y-80,Y+28+(i>2?6:0),f);grain(c,x,y,4);}
    if(q>.55){const f=ease((q-.55)/.2),ang=mix(-.6,0,f);c.save();c.translate(758,Y+26);c.rotate(ang);D.round(c,0,-4,74,8,2,'rgba(242,236,217,.6)',C.white);c.restore();}
    const k=q<.15?0:q<.32?1:q<.55?2:3;
    steps(c,[P('沾取花粉','Collect pollen'),P('滴一滴水','Add a water drop'),P('放上花粉','Add pollen'),P('輕放蓋玻片','Lower the coverslip')],k,664,Y+90,264,40,6);
    caption(c,P('做玻片（步驟示意）','Making a slide (model)'),664,y0+14,C.muted);
  }else if(s.case===2&&m){
    const A=m.map(150,330),Bp=m.map(320,120),q=mod(t/4),u=ease(clamp(q*1.4));
    c.save();c.setLineDash([10,7]);line(c,[A,[mix(A[0],Bp[0],u),mix(A[1],Bp[1],u)]],'#ff8a8a',4);c.restore();
    const bx=mix(A[0],Bp[0],u),by=mix(A[1],Bp[1],u);c.save();c.translate(bx,by);c.rotate(Math.atan2(Bp[1]-A[1],Bp[0]-A[0]));D.round(c,-18,-26,36,18,3,'#d7dde3','#7b8794');c.restore();
    pill(c,P('縱切方向','Lengthwise cut'),60,90,{anchor:m.map(235,225),color:'#ff8a8a',maxX:620});
    const warn=P('刀片由老師操作；手指不在刀口前方。','The teacher handles the blade; fingers stay clear.'),wh=splitLines(c,D.tr(warn),240,22).length*30+26;
    caption(c,P('安全','Safety'),664,y0+14,'#ff8a8a');D.round(c,664,y0+30,264,wh,12,'rgba(255,138,138,.12)','#ff8a8a');wrap(c,warn,678,y0+64,240,22,C.white);
  }else{
    wrap(c,s.case===3?P('觀察並畫下胚珠的位置；對照課本的比例尺。','Observe and sketch where the ovules sit; use the book scale.'):s.case===4?P('看輪廓和表面的刺狀紋路；這是朱槿，不是百合。','Look at the outline and spiny surface; this is hibiscus, not lily.'):P('花粉長出細長的花粉管；一張照片看不出生長速度。','The grain has grown a long tube; one photo shows no growth rate.'),664,y0+14,264,22,C.white);
  }
  wrap(c,P('照片是觀察證據；保留你自己的紀錄。','Photos are evidence; keep your own record.'),664,520,264,22,C.muted);
}

const src=(file,zh,en)=>source(P(zh,en));
const tabs=[
{id:'structure',title:P('一朵花，生殖構造藏在哪？','Where are the reproductive parts?'),sub:P('雄蕊、雌蕊與胚珠','Stamens, pistil and ovules'),hook:P('雄蕊和雌蕊都在花裡，但花粉、胚珠和卵究竟各在哪一層？','Stamens and pistil share a flower. Where are pollen, ovules and the egg cell?'),body:P('先看整朵花的縱切，再一層一層放大花藥、雌蕊和子房。先認構造，下一頁再看花粉去哪裡。','Start with a whole-flower section, then enlarge the anther, pistil and ovary layer by layer. Identify structures before following pollen.'),reading:join(partText),closure:P('花藥有花粉；柱頭接收花粉；子房內有胚珠，胚珠內有卵。','Anthers contain pollen; stigmas receive it. Ovaries contain ovules, which contain the egg.'),record:P('用「……裡有……」寫出花藥、子房、胚珠與卵的包覆關係。','Describe which structure contains which: anther, ovary, ovule and egg.'),sources:[src('Im5195.png','花藥原照片','Original anther photograph'),src('Im5252.png','子房原照片','Original ovary photograph'),src('Im5251.png','胚珠原照片','Original ovule photograph')],init:()=>({running:true,part:0,start:0}),controls:()=>[choice(P('放大部位','Focus'),'part',parts.map((n,i)=>[i,n]))],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>({title:parts[s.part],text:partText[s.part]}),draw:drawStructure},
{id:'pollination',title:P('花粉先到柱頭，不是子房','Pollen arrives on the stigma'),sub:P('授粉不等於受精','Pollination is not fertilization'),hook:P('花粉碰到花瓣就算授粉嗎？花粉要先抵達哪裡，後面的流程才能開始？','Does pollen on a petal count? Where must it arrive before the next steps can begin?'),body:P('改變花粉的落點，追蹤從花藥到柱頭的傳遞；落在花瓣與落在柱頭的結果不同。','Change the landing site and follow transport from anther. Landing on a petal differs from reaching a stigma.'),reading:join([P('授粉是花粉由花藥傳到柱頭的過程，可由風、昆蟲、鳥等媒介協助。媒介不是把卵送到花藥，也不是把整粒花粉一路送入子房。','Pollination transfers pollen from anther to stigma, often via wind, insects or birds. It does not transport an egg to anther or carry whole pollen directly into the ovary.'),tubeText[0],P('同種且相容的花粉到達合適的柱頭後，才可能接續萌發花粉管等過程。授粉不保證每次都受精，異花授粉也不是任何兩種植物都能任意配對。','Suitable compatible pollen on a receptive stigma may proceed to tube growth. Pollination does not guarantee fertilization, and cross-pollination does not mean arbitrary plant species are interchangeable.')]),closure:P('授粉看花粉是否到柱頭；受精看精細胞是否與卵結合，兩者不同。','Pollination concerns pollen reaching a stigma; fertilization concerns a sperm cell uniting with an egg.'),record:P('比較兩種落點，寫出為什麼「落到花瓣」不能直接當作授粉完成。','Compare both landing sites and explain why landing on a petal is not completed pollination.'),sources:[],init:()=>({running:true,target:'stigma',start:0}),controls:()=>[choice(P('花粉落點','Landing site'),'target',[['stigma',P('柱頭','Stigma')],['petal',P('花瓣','Petal')]])],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>({title:s.target==='stigma'?P('抵達柱頭，才可能往下繼續','Stigma arrival can precede the next steps'):P('落在花瓣，不等於授粉','A petal landing is not pollination'),text:s.target==='stigma'?tubeText[0]:P('花粉留在花瓣表面，本模型不啟動花粉管。位置不同造成不同結果，不是換個標籤而已。','Pollen stays on a petal, so this model does not initiate a pollen tube. Different destinations have different consequences.')}),draw:drawPollination},
{id:'tube',title:P('不會游泳，靠管送進去','No swimming: delivery through a tube'),sub:P('花粉管與受精','Pollen tube and fertilization'),hook:P('精細胞不會自己游，如何從高高的柱頭到達子房裡的卵？','How does a non-swimming sperm cell travel from stigma to an egg inside the ovary?'),body:P('左邊看真實的花粉管照片；右邊逐段觀察花粉管沿花柱伸長、進入胚珠，再放大看精細胞與卵結合。','See a real pollen-tube photo on the left; on the right follow the tube down the style into an ovule, then enlarge to see a sperm cell unite with the egg.'),reading:join(tubeText),closure:P('花粉留在柱頭，花粉管向胚珠生長；精細胞沿管運送，不在子房外游泳。','Pollen remains on the stigma while its tube grows toward an ovule. Sperm travels through the tube rather than swimming outside it.'),record:P('畫出花粉、花粉管、精細胞、胚珠與卵的位置，並標出受精發生的位置。','Draw pollen, tube, sperm, ovule and egg; mark the location of fertilization.'),sources:[src('Im3935.png','百合花粉管原顯微影像','Original lily pollen-tube micrograph')],init:()=>({running:true,phase:-1,start:0}),controls:()=>[choice(P('生長階段','Stage'),'phase',[[-1,P('連續觀察','Continuous')],...tubeNames.map((n,i)=>[i,n])])],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;return{title:tubeNames[k],text:tubeText[k]};},draw:drawTube},
{id:'fruit',title:P('子房變果實，胚珠變種子','Ovary to fruit; ovule to seed'),sub:P('發育對應與種子萌發','Development and germination'),hook:P('番茄有很多種子，是很多子房拼在一起嗎？種子只要有水就一定發芽嗎？','Do many tomato seeds mean many ovaries joined together? Does water alone guarantee germination?'),body:P('切換一粒與多粒種子的例子，追蹤果實和種子的來源；再比較萌發所需條件。','Compare one-seed and many-seed examples, trace fruit and seed origins, then compare conditions for germination.'),reading:join([P('特例：課本常用櫻桃當「一枚胚珠」的例子，但櫻桃、桃、李的子房其實有 2 枚胚珠，通常只有 1 枚發育成種子，所以果實裡只看到 1 顆種子。子房真的只有 1 枚胚珠的例子有：向日葵、蒲公英（菊科），稻、玉米、小麥（禾本科），酪梨與芒果。','Special case: textbooks often use cherry as a "one-ovule" example, but cherry, peach and plum ovaries actually hold 2 ovules; usually only 1 develops into a seed, so the fruit shows a single seed. Plants whose ovary truly has 1 ovule include sunflower and dandelion (daisy family), rice, corn and wheat (grass family), avocado and mango.'),P('一般開花植物受精後，子房發育成果實，胚珠發育成種子，受精卵發育成胚。三個層次不同。多粒種子的例子以豌豆示意：一個子房裡有好幾枚胚珠，就能長成一個豆莢裡有好幾粒豌豆。','In the usual pathway after fertilization, ovary develops into fruit, ovule into seed and zygote into embryo. These are different levels. The many-seed example uses pea: one ovary with several ovules can become one pod with several peas.'),P('不是每一枚胚珠都保證受精並成熟成種子。果實數不能直接等同種子數；部分果實也有其他花部參與形成，這個模型只處理課本的主要對應。','Not every ovule necessarily fertilizes and matures. Fruit count differs from seed count. Some fruits include other flower parts; this model focuses on the textbook\'s main mapping.'),P('種子萌發需要適當水分、氧氣和溫度；不同種類還可能受光照與休眠影響。萌發初期可使用種子儲藏養分；模型假設種子有活力且已解除休眠，不預測實際發芽天數。','Germination needs suitable water, oxygen and temperature; species also differ in light responses and dormancy. Early growth can use stored food. This model assumes a viable, nondormant seed and predicts no measured germination time.')]),closure:P('子房→果實；胚珠→種子；受精卵→胚。種子萌發還需要合適條件，不是授粉後立刻變成新植株。','Ovary → fruit; ovule → seed; zygote → embryo. Germination needs suitable conditions; pollination does not instantly create a new plant.'),record:P('記錄各構造的發育去向；比較一枚與多枚胚珠。再選一種不足的萌發條件，寫下你的預測與理由。','Record each developmental mapping and compare ovule numbers. Choose an inadequate germination condition and explain your prediction.'),sources:[src('Im3933.png','果實內含種子原圖','Original fruit containing seed'),src('Im3934.png','果實原圖','Original fruit exterior')],init:()=>({running:true,view:'mapping',example:0,all:true,condition:0,start:0}),controls:()=>[choice(P('看哪個過程','Process'),'view',[['mapping',P('果實與種子','Fruit and seed')],['germination',P('種子萌發','Germination')]]),choice(P('種子數例子','Seeds'),'example',fruitCases.map((n,i)=>[i,n])),choice(P('胚珠是否都完成發育','Ovule development'),'all',[[true,P('本例全部完成','All in this example')],[false,P('只一枚完成','Only one completes')]]),choice(P('萌發條件','Germination conditions'),'condition',conditions.map((n,i)=>[i,n]))],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>({title:s.view==='mapping'?fruitCases[s.example]:conditions[s.condition],text:s.view==='mapping'?(s.example===0?SPECIAL:P('外圈子房對應果實，內部每枚完成發育的胚珠對應一粒種子。多枚胚珠可以在同一個子房內，不是多個果實。','The outer ovary corresponds to fruit; each successfully developed ovule becomes one seed. Several ovules can share one ovary, rather than being several fruits.')):P('這是有活力、非休眠種子的條件比較，生長不是實測。缺水、氧氣不足或溫度不合適都可能妨礙萌發；光需求依植物種類不同。','This compares conditions for a viable, nondormant seed. Growth is not measured. Inadequate water, oxygen or temperature may prevent germination; light requirements vary by species.')}),draw:drawFruit},
{id:'vectors',title:P('風傳，還是昆蟲帶？','Wind-borne or insect-carried?'),sub:P('授粉媒介與祕密標記','Pollinators and hidden guides'),hook:P('玉米的花不鮮豔也能授粉；有些花還有我們看不到的路標。為什麼？','Corn can pollinate without bright petals; some flowers have guides we cannot see. Why?'),body:P('比較玉米、木槿和百日草，再看花瓣平台與紫外光圖像；照片是觀察證據，右邊的傳粉模型是示意。','Compare corn, rose of Sharon and zinnia, then inspect landing platforms and ultraviolet imagery. Photos are evidence; the transfer model on the right is a diagram.'),reading:join(pollinators.map(a=>a[2])),closure:P('風媒與蟲媒的構造、花粉及吸引方式常有差異；紫外光呈現不是人眼日常花色。','Wind- and insect-pollinated flowers often differ in structures, pollen and attraction. Ultraviolet imagery is not everyday human-visible colour.'),record:P('記錄可見構造和授粉媒介的可能關係；對紫外光圖標明成像方式，不把模型色當原本花色。','Record visible structures and possible links to pollen transport. Label ultraviolet imaging rather than treating its colours as ordinary flower colours.'),sources:pollinators.map(a=>src(a[0],a[1][0],a[1][1])),init:()=>({running:true,case:0}),controls:()=>[choice(P('照片比較','Photographs'),'case',pollinators.map((a,i)=>[i,a[1]]))],explain:s=>({title:pollinators[s.case][1],text:pollinators[s.case][2]}),draw:drawVectors},
{id:'lab',title:P('看花、看粉、看子房','Observe flower, pollen and ovary'),sub:P('花的觀察與紀錄','Flower observation lab'),hook:P('顯微鏡看到的花粉都一樣嗎？子房裡數到的胚珠，能直接當作未來種子數嗎？','Does all pollen look alike? Is an ovule count already the future seed count?'),body:P('依課本實驗順序觀察完整花、花粉與縱切子房；刀片由老師操作，保留自己的紀錄與問題。','Follow the textbook lab: whole flower, pollen and longitudinal ovary section. The teacher handles the blade; keep your own observations and questions.'),reading:join([...labCases.map(a=>a[2]),labRecord]),closure:P('分開記錄觀察與推論；胚珠數是潛在種子數的依據，不保證每枚都成熟。','Separate observations from inferences. Ovule count informs potential seed number but does not guarantee maturation.'),record:labRecord,sources:labCases.filter(a=>a[0]).map(a=>src(a[0],a[1][0],a[1][1])),init:()=>({running:true,case:0,reveal:0}),controls:()=>[choice(P('觀察與操作階段','Lab stage'),'case',labCases.map((a,i)=>[i,a[1]]))],explain:s=>({title:labCases[s.case][1],text:labCases[s.case][2]}),draw:drawLab}
];
// 2026-10-26: supplement tab "one tube, one ovule" (flowers_ovule_1026_v1.js), moved here from the plants lesson; goes right after "tube"
if(window.FlowersOvuleTab){tabs.splice(tabs.findIndex(t=>t.id==='tube')+1,0,window.FlowersOvuleTab);}
B.register({id:'reproduction_flowers',title:P('開花植物生殖：從花到果實與種子','Flowering plant reproduction'),subtitle:P('花的構造、授粉、花粉管與受精、果實與種子，以及種子萌發','Flower structure, pollination, the pollen tube and fertilization, fruits and seeds, and germination'),cover:'assets/covers/biology_reproduction_flowers_1009_v1.jpg',tabs});
})();

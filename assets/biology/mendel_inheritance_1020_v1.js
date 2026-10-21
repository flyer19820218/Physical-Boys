/* Inheritance: Mendel's peas · teacher-requested V5 remake, 2026-10-20.
 * Same four tabs and topics as genetics_lessons_1010_v1.js: traits and forms, Mendel's crosses,
 * gametes and the Punnett square, probability and sampling. Pea plants, flowers, seeds and hand
 * pollination use the teacher's Gemini AI illustrations when present (mendel_ai_1020/); until then
 * they are drawn in code. Alleles, gametes, crosses and counts are drawn models. T/t is the
 * stem-height model; pollen-borne alleles are cyan and egg-borne alleles pink, as in the
 * reproduction units. Multiple-choice checks replace the open-ended notes (genetics_quiz_1020_v1.js).
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};

// ── drawing kit (same helpers as the rebuilt reproduction units) ───────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
const FONT=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
const MONO=size=>`700 ${size}px "JetBrains Mono", "Noto Sans TC", monospace`;
function text(c,p,x,y,size=22,color=C.white,align='left'){c.save();c.font=FONT(size);c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function measure(c,p,size){c.save();c.font=FONT(size);const w=c.measureText(D.tr(p)).width;c.restore();return w;}
function splitLines(c,str,maxW,size=22){
  c.save();c.font=FONT(size);
  const isEn=/[A-Za-z]/.test(str)&&!/[一-鿿]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9₁₂]+(?:['–-][A-Za-z0-9₁₂]+)*|\s+|[^A-Za-z0-9₁₂\s]/g)||[]):Array.from(str);
  const rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());
  c.restore();return rows;
}
function wrap(c,p,x,y,w,size=22,color=C.white,lh=Math.round(size*1.38)){
  const rows=splitLines(c,D.tr(p),w,size),PUNCT=/^[，。、；：！？）」』,.;:!?)]/;
  for(let i=1;i<rows.length;i++)while(PUNCT.test(rows[i])&&rows[i-1].length>1){
    if(/[A-Za-z]/.test(rows[i-1])&&!/[一-鿿]/.test(rows[i-1])){rows[i-1]+=rows[i][0];rows[i]=rows[i].slice(1).trimStart();}else{rows[i]=rows[i-1].slice(-1)+rows[i];rows[i-1]=rows[i-1].slice(0,-1);}}
  rows.filter(r=>r).forEach((r,i)=>text(c,r,x,y+i*lh,size,color));return rows.length*lh;}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,1));g.addColorStop(1,rgba(color,0));c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(16,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function panel(c,x,y,w,h,fill='#16332b'){D.round(c,x,y,w,h,16,fill,C.edge);}
function node(c,p,x,y,w,h,active,color=C.cyan){
  D.round(c,x,y,w,h,12,active?color:C.panel,active?C.white:C.edge);
  const rows=splitLines(c,D.tr(p),w-20,22),lh=26,y0=y+h/2-(rows.length-1)*lh/2+8;
  rows.forEach((r,i)=>text(c,r,x+w/2,y0+i*lh,22,active?C.deep:C.white,'center'));
}
function pill(c,p,x,y,{active=false,color=C.yellow,size=22,maxX=940,minX=24,hit=null}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(minX,Math.min(x,maxX-w));
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.9)',active?C.white:rgba(color,.8));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  if(hit)D.hit(x,y,w,h,hit[0],hit[1]);
  return{x,y,w,h};
}
function steps(c,names,cur,x,y,w,h=42,gap=8,color=C.yellow){names.forEach((p,i)=>{const yy=y+i*(h+gap);D.round(c,x,yy,w,h,10,i===cur?color:'rgba(11,26,21,.6)',i===cur?C.white:C.edge);text(c,`${i+1}. ${D.tr(p)}`,x+12,yy+h/2+8,22,i===cur?C.deep:C.white);});}
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*16,null,rgba(color,.9*(1-u)),3);}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
// A stage clock: loops through n stages, or eases into a held stage.
function stageClock(s,t,n,per=4.5){
  if(s.phase>=0)return{k:s.phase,u:ease((t-(s.start||0))/1.6),held:true};
  const q=mod(t-(s.start||0),n*per)/per;return{k:Math.floor(q),u:q%1,held:false};
}
// Draw only the first fraction u of a polyline (for branches that grow).
function partial(pts,u){const L=[];let total=0;for(let i=1;i<pts.length;i++){const s=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);L.push(s);total+=s;}
  let d=clamp(u)*total;const out=[pts[0]];for(let i=1;i<pts.length;i++){if(d>=L[i-1]){out.push(pts[i]);d-=L[i-1];}else{const f=L[i-1]?d/L[i-1]:0;out.push([mix(pts[i-1][0],pts[i][0],f),mix(pts[i-1][1],pts[i][1],f)]);break;}}return out;}

// ── pictures ───────────────────────────────────────────────────────────────
const AI='assets/biology/mendel_ai_1020/',PEA_PLANT='assets/biology/cell_division_ai_1019/pea_plant.png',PICS={};
const HAVE_POLLINATION=true; // the hand-pollination illustration (prompt M4) is in mendel_ai_1020/ (2026-10-21)
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.onerror=()=>{im.failed=true;};im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
function place(c,path,bx,by,bw,bh,{alpha=1}={}){
  const im=pic(path);if(!im)return null;const k=Math.min(bw/im.naturalWidth,bh/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k,x=bx+(bw-w)/2,y=by+(bh-h)/2;
  c.save();c.globalAlpha=alpha;c.drawImage(im,x,y,w,h);c.restore();return{x,y,w,h};
}

// ── peas drawn in code (fallback for the Gemini pictures, and the tiny field plants) ──
const LEAF='#7dbf5c',STEM='#5d9c48',VEIN='#24452a';
const FLOWER={purple:{banner:'#d7b4ee',wing:'#8d3fb3',keel:'#c79bd9',line:'#4b1f63'},white:{banner:'#faf6ec',wing:'#ece5d2',keel:'#f2f0dd',line:'#8c9a80'}};
function leaf(c,x,y,rx,ry,rot){ellipse(c,x,y,rx,ry,LEAF,VEIN,1.3,rot);}
function curl(c,x,y,d,s){c.save();c.strokeStyle='#a5dc7f';c.lineWidth=Math.max(1,1.2*s);c.lineCap='round';c.beginPath();c.moveTo(x,y);const ex=x+d*8*s,ey=y-6*s;c.quadraticCurveTo(x+d*3*s,y-6*s,ex,ey);c.arc(ex,ey-3*s,3*s,Math.PI/2,Math.PI/2+d*5,d<0);c.stroke();c.restore();}
function peaFlower(c,x,y,r,kind='purple'){const f=FLOWER[kind];c.save();
  c.fillStyle='#6fae4f';c.beginPath();c.moveTo(x-r*.32,y+r*.5);c.lineTo(x+r*.32,y+r*.5);c.lineTo(x,y+r*1.05);c.closePath();c.fill();
  c.beginPath();c.moveTo(x,y+r*.2);c.bezierCurveTo(x-r*1.3,y-r*.15,x-r*.95,y-r*1.35,x-r*.1,y-r*.98);c.lineTo(x,y-r*.82);c.lineTo(x+r*.1,y-r*.98);c.bezierCurveTo(x+r*.95,y-r*1.35,x+r*1.3,y-r*.15,x,y+r*.2);c.closePath();
  c.fillStyle=f.banner;c.fill();c.strokeStyle=f.line;c.lineWidth=Math.max(1,r*.04);c.stroke();
  if(r>20){c.strokeStyle=rgba(f.line,.35);c.lineWidth=1.2;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(x,y+r*.1);c.quadraticCurveTo(x+i*r*.18,y-r*.45,x+i*r*.3,y-r*.8+Math.abs(i)*r*.08);c.stroke();}}
  ellipse(c,x-r*.36,y+r*.26,r*.42,r*.3,f.wing,f.line,Math.max(1,r*.04),-.45);ellipse(c,x+r*.36,y+r*.26,r*.42,r*.3,f.wing,f.line,Math.max(1,r*.04),.45);
  ellipse(c,x,y+r*.42,r*.2,r*.15,f.keel,f.line,1);c.restore();}
// Tall and dwarf share leaf size and node count; only the internodes differ.
function drawnPea(c,x,gy,{tall=true,grow=1,s=1,sway=0,flower='purple'}={}){
  const n=6,inter=(tall?20:6.5)*s,L=11*s,g=clamp(grow),shown=g*n,top=Math.floor(shown),frac=shown-top,pts=[[x,gy]];
  for(let i=1;i<=n;i++)pts.push([x+(i%2?1.6:-1.6)*s+sway*i/n,gy-i*inter]);
  const stem=pts.slice(0,top+1);if(top<n&&frac>0)stem.push([mix(pts[top][0],pts[top+1][0],frac),mix(pts[top][1],pts[top+1][1],frac)]);
  if(stem.length>1){sline(c,stem,VEIN,3.6*s);sline(c,stem,STEM,2.2*s);}
  for(let i=1;i<=top;i++){const [nx,ny]=pts[i],d=i%2?1:-1,px=nx+d*L*1.5,py=ny-L*.9;
    leaf(c,nx-3.5*s,ny+s,L*.55,L*.42,-.5);leaf(c,nx+3.5*s,ny+s,L*.55,L*.42,.5);
    line(c,[[nx,ny],[px,py]],STEM,1.4*s);
    leaf(c,mix(nx,px,.55),mix(ny,py,.55)-L*.42,L*.62,L*.36,d*-.6);leaf(c,mix(nx,px,.55),mix(ny,py,.55)+L*.42,L*.62,L*.36,d*.4);
    curl(c,px,py,d,s);
    if(g>.92&&i>=n-2)peaFlower(c,nx-d*L*1.05,ny-L*.45,L*.62,flower);}
}
function miniPea(c,x,gy,tall){const h=tall?44:15;sline(c,[[x,gy],[x,gy-h]],STEM,2.4);const n=tall?4:3;for(let i=1;i<=n;i++){const y=gy-h*i/(n+.3),d=i%2?1:-1;ellipse(c,x+d*5,y,5.5,3.2,LEAF,VEIN,1,d*-.5);}circle(c,x,gy-h-3,3.6,'#b778d9',VEIN,1);}
// One pea plant at a reference height H for the tall form; the dwarf keeps the same scale.
function pea(c,tall,x,gy,H,grow=1,sway=0){
  const ti=pic(AI+'pea_tall.png'),di=pic(AI+'pea_dwarf.png');
  if(ti&&di){const im=tall?ti:di,k=H/ti.naturalHeight,w=im.naturalWidth*k,h=im.naturalHeight*k,g=clamp(grow);if(g<=0)return;
    c.save();c.beginPath();c.rect(x-w/2-4,gy-h*g,w+8,h*g+2);c.clip();c.drawImage(im,x-w/2,gy-h,w,h);c.restore();return;}
  drawnPea(c,x,gy,{tall,grow,s:H/120,sway});
}
const SEED={yellow:{hi:'#fff2a6',mid:'#e6c34a',lo:'#a8801f'},green:{hi:'#e2f5b5',mid:'#8fc455',lo:'#4f7d2b'}};
function seed(c,x,y,r,shape,col,rot=0){const k=SEED[col];c.save();c.translate(x,y);c.rotate(rot);c.beginPath();
  if(shape==='round')c.arc(0,0,r,0,TAU);else{for(let i=0;i<=48;i++){const a=i/48*TAU,rr=r*(.88+.09*Math.sin(a*5+1)+.05*Math.sin(a*11));i?c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr*.92):c.moveTo(Math.cos(a)*rr,Math.sin(a)*rr*.92);}c.closePath();}
  const g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r);g.addColorStop(0,k.hi);g.addColorStop(.55,k.mid);g.addColorStop(1,k.lo);c.fillStyle=g;c.fill();c.strokeStyle=rgba(C.ink,.7);c.lineWidth=1.5;c.stroke();
  if(shape!=='round'){c.strokeStyle=rgba(k.lo,.95);c.lineWidth=Math.max(1.2,r*.07);for(const [a,b,cc] of [[-.5,.05,.45],[.25,-.45,.4],[.15,.45,.38]]){c.beginPath();c.arc(a*r,b*r,cc*r,.3,2.1);c.stroke();}}
  else ellipse(c,r*.55,r*.1,r*.16,r*.09,rgba(k.lo,.9),null,0,.4);
  c.restore();}
const SEED_SPOTS=[[-62,-40,.2],[8,-58,1.4],[66,-18,2.6],[-28,14,.9],[40,40,2.1],[-74,52,1.7],[0,78,.4]];
function seedHeap(c,x,y,shape,col,t){const im=pic(AI+`seeds_${shape}_${col}.png`);if(im){place(c,AI+`seeds_${shape}_${col}.png`,x-126,y-130,252,260);return;}
  SEED_SPOTS.forEach(([dx,dy,r0],i)=>seed(c,x+dx,y+dy,30,shape,col,r0+Math.sin(t*.8+i)*.08));}

// ── alleles and gametes ────────────────────────────────────────────────────
const POLLEN=C.cyan,EGG=C.pink,PLAIN=C.white;
function chip(c,x,y,letter,fill,size=30){D.round(c,x-size/2,y-size/2,size,size,7,fill,C.ink);c.save();c.font=MONO(Math.max(22,Math.round(size*.78)));c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(letter,x,y+1);c.restore();}
// Two allele chips, dominant letter first; each chip keeps the colour of the gamete it came in.
function genotype(c,x,y,items,size=30,gap=4){const list=items[0][0]===items[0][0].toUpperCase()||items[1][0]!==items[1][0].toUpperCase()?items:[items[1],items[0]];
  const w=2*size+gap;list.forEach(([l,col],i)=>chip(c,x-w/2+size/2+i*(size+gap),y,l,col,size));}
function gamete(c,x,y,letter,col,r=26){circle(c,x,y,r,rgba(col,.16),col,3);c.save();c.font=MONO(28);c.fillStyle=C.white;c.textAlign='center';c.textBaseline='middle';c.fillText(letter,x,y+1);c.restore();}
const isTall=g=>/T/.test(g),FORM=g=>isTall(g)?P('高莖','Tall'):P('矮莖','Short'),FORM_COLOR=g=>isTall(g)?C.green:C.orange;
const gcd=(a,b)=>b?gcd(b,a%b):a;
function ratio(nums){const g=nums.reduce((a,b)=>gcd(a,b));return nums.map(n=>n/g).join('：');}
const enRatio=s=>s.replace(/：/g,' : ');

// ── Tab 1: a trait and its forms ───────────────────────────────────────────
const TRAITS=[
 {kind:'height',name:P('莖的高度','Stem height'),forms:[P('高莖','Tall'),P('矮莖','Short')],text:P('「莖的高度」是性狀，「高莖」和「矮莖」是它的兩種表徵。兩株的葉子和花都一樣，差別只在莖的長短。','Stem height is the trait; tall and short are its two forms. The leaves and flowers match; only the stem length differs.')},
 {kind:'flower',name:P('花的顏色','Flower colour'),forms:[P('紫花','Purple'),P('白花','White')],text:P('「花的顏色」是性狀，「紫花」和「白花」是它的兩種表徵。','Flower colour is the trait; purple and white are its two forms.')},
 {kind:'shape',name:P('種子的形狀','Seed shape'),forms:[P('圓滑','Round'),P('皺縮','Wrinkled')],text:P('「種子的形狀」是性狀，「圓滑」和「皺縮」是它的兩種表徵。','Seed shape is the trait; round and wrinkled are its two forms.')},
 {kind:'color',name:P('子葉的顏色','Cotyledon colour'),forms:[P('黃色','Yellow'),P('綠色','Green')],text:P('「子葉的顏色」是性狀，「黃色」和「綠色」是它的兩種表徵。豌豆的種皮很薄，看得到裡面子葉的顏色。','Cotyledon colour is the trait; yellow and green are its two forms. The thin seed coat lets the colour show through.')},
 {kind:'frog',name:P('澤蛙背上的縱紋','Rice frog back stripe'),forms:[P('有縱紋','Striped'),P('沒有縱紋','No stripe')],text:P('同一種澤蛙，有的背上有一條淺色縱紋，有的沒有。「背上的縱紋」是性狀，「有縱紋」和「沒有縱紋」是它的兩種表徵。動物也一樣有性狀和表徵。','Within one rice frog species, some have a pale stripe down the back and some do not. The back stripe is the trait; striped and unstriped are its two forms. Animals have traits and forms too.')}
];
function defCard(c,x,y,w,h,title,color,body){D.round(c,x,y,w,h,14,'rgba(11,26,21,.6)',color===C.yellow?rgba(C.yellow,.7):C.edge);text(c,title,x+16,y+36,24,color);wrap(c,body,x+16,y+72,w-32,22,C.white,30);}
function drawTraits(c,s,t){
  const q=TRAITS[s.trait],since=t-(s.since||0),X=[490,790];
  panel(c,20,20,300,560);
  text(c,P('孟德爾研究的豌豆','Mendel\'s garden peas'),36,54,22,C.yellow);
  D.round(c,30,66,280,186,12,C.deep);place(c,PEA_PLANT,36,72,268,174);
  defCard(c,30,266,280,150,P('性狀','Trait'),C.yellow,P('生物可以觀察、比較的特徵，例如花的顏色。','A feature we can observe, e.g. flower colour.'));
  defCard(c,30,426,280,150,P('表徵','Form'),C.white,P('同一個性狀表現出來的樣子，例如紫花、白花。','How that feature looks, e.g. purple or white.'));
  panel(c,340,20,600,560);
  const head=P(`性狀：${q.name[0]}`,`Trait: ${q.name[1]}`),hw=measure(c,head,24)+28,top=pill(c,head,640-hw/2,30,{active:true,color:C.yellow,size:24});
  const g=ease(since/1.1),y0=top.y+top.h,yb=y0+20;
  X.forEach((x,i)=>{
    const branch=[[640,y0],[640,yb],[x,yb],[x,126]];sline(c,partial(branch,g),C.yellow,3);
    if(g>=1){const tip=partial(branch,mod(t*.4)).pop();glow(c,tip[0],tip[1],14,C.yellow,.8);circle(c,tip[0],tip[1],4,C.white);} // trait → form, again and again
    c.save();c.globalAlpha=clamp((g-.6)/.4);const f=P(`表徵：${q.forms[i][0]}`,`Form: ${q.forms[i][1]}`),fw=measure(c,f,22)+28;pill(c,f,x-fw/2,126,{color:C.white});c.restore();
    D.round(c,x-136,184,272,350,14,'rgba(11,26,21,.55)',C.edge);
    if(q.kind==='height'){D.round(c,x-112,512,224,10,5,'#6b4a2b');pea(c,i===0,x,516,292,1,Math.sin(t*1.2+i)*3);}
    else if(q.kind==='flower'){const name=i?'white':'purple',im=place(c,AI+`flower_${name}.png`,x-126,196,252,326);if(!im)peaFlower(c,x,360+Math.sin(t*1.4+i)*3,78,name);}
    else if(q.kind==='frog'){const r=place(c,AI+(i?'frog_plain.png':'frog_striped.png'),x-128,250,256,230);if(r&&!i){const k=r.w/526;pulse(c,r.x+250*k,r.y+90*k,t,C.yellow,12);}}
    else if(q.kind==='shape')seedHeap(c,x,362,i?'wrinkled':'round','yellow',t);
    else seedHeap(c,x,362,'round',i?'green':'yellow',t);
  });
  text(c,P('同一個性狀，可以有不同的表徵。','One trait can take different forms.'),640,566,22,C.muted,'center');
}

// ── Tab 2: P → F1 → F2; the short allele is hidden, not lost ───────────────
const GEN_NAMES=[P('親代：純品種雜交','Cross pure lines'),P('第一子代：全部高莖','F₁: all tall'),P('第一子代自花授粉','F₁ self-pollinates'),P('第二子代：矮莖又出現','F₂: short returns')];
const GEN_SHORT=[P('親代','Parents'),P('第一子代','F₁'),P('自花授粉','Self-pollinate'),P('第二子代','F₂')];
const GEN_TEXT=[
 P('先確認親代是純品種：高莖豌豆自花授粉很多代，都只長出高莖；矮莖也一樣。再除去高莖花的雄蕊，把矮莖的花粉刷到它的柱頭上，這叫人工授粉。','First confirm pure lines: many generations of self-pollination give only tall plants (or only short ones). Then remove the stamens from a tall plant\'s flower and brush on pollen from a short plant.'),
 P('第一子代全部是高莖，矮莖好像消失了。打開看基因：每一株都是 Tt，T 來自高莖親代，t 來自矮莖親代。T 是顯性，遮住了 t 的表徵。','Every F₁ plant is tall, as if "short" had vanished. Show the genes: each plant is Tt, with T from the tall parent and t from the short one. Dominant T masks t.'),
 P('讓第一子代自花授粉。形成配子時，成對的 T 和 t 分開：花粉帶 T 或 t，卵細胞也帶 T 或 t，機率各一半。','Let F₁ self-pollinate. When gametes form, the pair separates: each pollen grain carries T or t, and so does each egg, half and half.'),
 P('第二子代中矮莖又出現了。T 和 t 隨機組合成 TT、Tt、Tt、tt，只有 tt 是矮莖，所以高莖：矮莖約 3：1。','Short plants return in F₂. Random pairing gives TT, Tt, Tt and tt; only tt is short, so tall : short is about 3 : 1.')
];
const F1X=[550,665,780,895],F2X=F1X;
const F2=[[['T',EGG],['T',POLLEN]],[['T',EGG],['t',POLLEN]],[['t',EGG],['T',POLLEN]],[['t',EGG],['t',POLLEN]]];
function rowLabel(c,lines,y,colors){lines.forEach((p,i)=>text(c,p,362,y+i*30,22,colors[i]||C.muted));}
function placeholder(c,y0,y1,p){c.save();c.setLineDash([8,6]);D.round(c,496,y0+12,432,y1-y0-24,12,null,rgba(C.muted,.5));c.restore();text(c,p,712,(y0+y1)/2+8,22,C.muted,'center');}
function drawGenerations(c,s,t){
  const {k,u,held}=stageClock(s,t,4,4.6),gene=s.view===1;s.shown=k;
  // left: stages and evidence
  panel(c,20,20,300,560);
  text(c,P('孟德爾的豌豆實驗','Mendel\'s pea crosses'),36,50,22,C.yellow);
  steps(c,GEN_NAMES,k,34,64,272,42,8);
  if(k===0){
    const hp=HAVE_POLLINATION?place(c,AI+'hand_pollination.png',30,276,280,178):null;
    if(!hp){node(c,P('① 除去雄蕊','1 Remove the stamens'),40,290,260,64,false);node(c,P('② 刷上另一株的花粉','2 Brush on other pollen'),40,370,260,64,false);}
    else[0,1].forEach(i=>{const x=hp.x+i*hp.w/2+16,y=hp.y+16;circle(c,x,y,13,C.yellow,C.ink,2);c.save();c.font=MONO(20);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,y+1);c.restore();});
    wrap(c,P('① 除去花的雄蕊；② 把另一株的花粉刷到柱頭上。','① Remove the stamens. ② Brush on pollen from the other plant.'),36,476,268,22,C.white,30);
  }else if(k<3){
    text(c,P('基因的寫法','Writing the alleles'),36,300,22,C.yellow);
    chip(c,52,334,'T',PLAIN,30);text(c,P('高莖（顯性）','Tall (dominant)'),78,342,22,C.green);
    chip(c,52,378,'t',PLAIN,30);text(c,P('矮莖（隱性）','Short (recessive)'),78,386,22,C.orange);
    const note=k===2?P('形成配子時 T 和 t 分開：每個花粉、每個卵細胞只帶一個。','T and t separate as gametes form: each pollen grain or egg carries just one.'):gene?P('第一子代都是 Tt：t 還在，只是被 T 遮住了。','Every F₁ plant is Tt: t is still there, masked by T.'):P('只看外表：全部高莖，矮莖好像不見了。按「打開看基因」。','Looks only: all tall, as if "short" vanished. Try "Show genes".');
    wrap(c,note,36,436,268,22,k===1&&gene?C.yellow:C.white,30);
  }else{
    const n=clamp(held?u:u*1.4),tall=Math.round(787*n),short=Math.round(277*n);
    text(c,P('孟德爾數到的第二子代','Mendel\'s F₂ count'),36,300,22,C.yellow);
    [[P('高莖','Tall'),tall,787,C.green,342],[P('矮莖','Short'),short,277,C.orange,386]].forEach(([p,v,max,col,y])=>{text(c,p,36,y,22,col);D.round(c,100,y-20,150*v/787,24,6,col);text(c,String(v),300,y,22,C.white,'right');});
    if(n>=1){text(c,'787：277 ≈ 2.84：1',36,436,22,C.white);text(c,P('很接近 3：1','close to 3 : 1'),36,470,24,C.yellow);}
    wrap(c,P('種了一千多株，數量夠多，比例才接近 3：1。','Over a thousand plants: enough for the ratio to approach 3 : 1.'),36,516,268,22,C.muted,30);
  }
  // right: three generations
  panel(c,340,20,600,560);
  c.save();c.setLineDash([6,6]);line(c,[[352,200],[928,200]],rgba(C.muted,.5),2);line(c,[[352,380],[928,380]],rgba(C.muted,.5),2);c.restore();
  rowLabel(c,[P('親代','Parents'),P('純品種','pure lines')],70,[C.white,C.muted]);
  rowLabel(c,[P('第一子代','F₁')].concat(k>=1?[P('全部高莖','all tall')]:[]),250,[C.white,C.green]);
  rowLabel(c,[P('第二子代','F₂')].concat(k>=3?[P('高莖：矮莖','tall : short'),P('＝3：1','= 3 : 1')]:[]),430,[C.white,C.yellow,C.yellow]);
  // parents
  const PA=k>=2?.45:1;c.save();c.globalAlpha=PA;
  pea(c,true,600,160,108);pea(c,false,840,160,108);text(c,'×',720,116,40,C.white,'center');
  if(gene){genotype(c,600,182,[['T',PLAIN],['T',PLAIN]],26);genotype(c,840,182,[['t',PLAIN],['t',PLAIN]],26);}
  c.restore();
  if(k===0){
    const g=held?u:clamp(u*1.3);const A=[838,122],Q=[730,14],Z=[606,62];
    for(let i=0;i<6;i++){const v=mod(t*.45-i*.12);if(g<.05)break;const x=(1-v)*(1-v)*A[0]+2*(1-v)*v*Q[0]+v*v*Z[0],y=(1-v)*(1-v)*A[1]+2*(1-v)*v*Q[1]+v*v*Z[1];circle(c,x,y,5,C.yellow,C.ink,1.5);}
    const hp=P('人工授粉','Hand-pollinate'),pw=measure(c,hp,22)+28;pill(c,hp,720-pw/2,126,{active:true,color:C.yellow});
    placeholder(c,200,380,P('第一子代會長怎樣？','What will F₁ look like?'));placeholder(c,380,578,P('第二子代？','F₂?'));
    return;
  }
  // F1
  const g1=k===1?(held?u:clamp(u*1.5)):1;
  F1X.forEach((x,i)=>{const dim=k===2&&i>0;c.save();if(dim)c.globalAlpha=.25;if(k===2&&i===0)glow(c,x,282,70,C.yellow,.22+.1*Math.sin(t*3));
    pea(c,true,x,330,120,clamp(g1*1.25-i*.08));
    if(gene&&g1>.6){genotype(c,x,352,[['T',EGG],['t',POLLEN]],26);if(k===1)pulse(c,x+15,352,t+i*.2,C.cyan,14);}
    c.restore();});
  if(k===1){placeholder(c,380,578,P('第二子代？','F₂?'));return;}
  if(k===2){
    const g=held?u:clamp(u*1.3);
    D.round(c,612,212,320,160,14,'rgba(11,26,21,.92)',C.edge);
    text(c,P('自花授粉：T、t 分開','T and t separate'),628,240,22,C.yellow);
    text(c,P('花粉','Pollen'),720,292,22,C.cyan,'right');text(c,P('卵細胞','Eggs'),720,344,22,C.pink,'right');
    const from=[[535,352],[565,352]];
    [['T',0],['t',1]].forEach(([l,j])=>{[[POLLEN,284],[EGG,336]].forEach(([col,y])=>{const v=ease(g*1.5-j*.15),x=mix(from[j][0],770+j*80,v),yy=mix(from[j][1],y,v);if(v<.98)chip(c,x,yy,l,col,26);else gamete(c,770+j*80,y,l,col,24);});});
    arrow(c,906,300,906,360,C.yellow,3);
    placeholder(c,380,578,P('配子隨機結合 → 第二子代','Random pairing → F₂'));return;
  }
  // F2
  const g2=held?u:clamp(u*1.4);
  F2X.forEach((x,i)=>{const pair=F2[i],tall=pair.some(([l])=>l==='T'),gi=clamp(g2*1.5-i*.12);
    if(!tall&&gi>.9)glow(c,x,505,40,C.orange,.25+.1*Math.sin(t*3));
    pea(c,tall,x,530,120,gi,Math.sin(t+i)*2);
    if(gene&&gi>.6)genotype(c,x,554,pair,26);});
}

// ── Tab 3: gametes and the Punnett square ──────────────────────────────────
const GENOS=['TT','Tt','tt'];
const CROSS_NAMES=[P('親代','Parents'),P('分離成配子','Alleles separate'),P('配子結合','Gametes combine'),P('看結果','Results')];
const CROSS_TEXT=[
 P('先寫出兩個親代的基因型。每個親代都有一對控制莖高的等位基因。','Write each parent\'s genotype. Each carries one pair of stem-height alleles.'),
 P('形成配子時，成對的等位基因分開，每個配子只帶一個。Tt 產生帶 T、帶 t 的配子，機率各一半；TT 只產生帶 T 的配子。','When gametes form, the pair separates and each gamete carries one allele. Tt makes T and t gametes, half each; TT makes only T gametes.'),
 P('花粉和卵細胞隨機結合。上方的配子往下、左方的配子往右，交叉的那一格就是一種組合。','Pollen and egg meet at random. A top gamete moves down and a side gamete moves across; each cell is one combination.'),
 P('四格的機率一樣，各是 1/4。數一數各種基因型和表徵，就得到比例。TT 和 Tt 的基因型不同，表徵卻都是高莖。','Each cell has probability 1/4. Count the genotypes and forms to get the ratios. TT and Tt differ in genotype but are both tall.')
];
const GX=520,GY=160,CW=180,CH=166,COLX=[610,790],ROWY=[243,409],TOP_Y=106,SIDE_X=452;
function parentCard(c,y,h,title,col,geno,chipsAlpha){
  D.round(c,30,y,280,h,14,'rgba(11,26,21,.55)',rgba(col,.7));text(c,title,44,y+34,22,col);
  pea(c,isTall(geno),112,y+h-22,150);
  c.save();c.globalAlpha=chipsAlpha;genotype(c,235,y+h/2-6,[[geno[0],PLAIN],[geno[1],PLAIN]],38,6);c.restore();
  text(c,FORM(geno),235,y+h/2+44,22,FORM_COLOR(geno),'center');
}
function drawCross(c,s,t){
  const {k,u,held}=stageClock(s,t,4,4.4);s.shown=k;
  const pol=[...s.pa],egg=[...s.pb],cells=[0,1,2,3].map(i=>{const r=i>>1,cc=i&1;return{r,cc,egg:egg[r],pol:pol[cc]};});
  panel(c,20,20,300,560);
  parentCard(c,30,266,P('提供花粉的親代','Pollen parent'),C.cyan,s.pa,k>=1?.35:1);
  parentCard(c,306,266,P('提供卵細胞的親代','Egg parent'),C.pink,s.pb,k>=1?.35:1);
  panel(c,340,20,600,560);
  text(c,P('花粉（精細胞）','Pollen (sperm cell)'),700,58,22,C.cyan,'center');
  text(c,P('卵細胞','Egg'),SIDE_X,170,22,C.pink,'center');
  // cells
  cells.forEach((q,i)=>{const x=GX+q.cc*CW,y=GY+q.r*CH,on=s.cell===i&&k>=2;
    c.save();if(k<2)c.setLineDash([8,6]);D.round(c,x+5,y+5,CW-10,CH-10,14,on?rgba(C.yellow,.16):'rgba(11,26,21,.55)',on?C.yellow:C.edge);c.restore();
    if(k>=2)D.hit(x+5,y+5,CW-10,CH-10,'cell',i);});
  // gametes: from the parent cards to the edges of the square
  const g1=k===1?(held?u:clamp(u*1.4)):1;
  if(k>=1)[0,1].forEach(j=>{
    const v=k===1?ease(g1*1.3-(1-j)*.2):1; // the right-hand chip leaves first, so the two never cross
    const ps=[213+j*44,157],pd=[COLX[j],TOP_Y],es=[213+j*44,433],ed=[SIDE_X,ROWY[j]];
    if(v<1){chip(c,mix(ps[0],pd[0],v),mix(ps[1],pd[1],v),pol[j],POLLEN,34);chip(c,mix(es[0],ed[0],v),mix(es[1],ed[1],v),egg[j],EGG,34);}
    else{gamete(c,pd[0],pd[1],pol[j],POLLEN,28);gamete(c,ed[0],ed[1],egg[j],EGG,28);}
  });
  if(k===0){text(c,P('先選親代，再按「連續播放」或下一步。','Choose parents, then play or step on.'),730,330,22,C.muted,'center');pulse(c,235,157,t,C.cyan,46);pulse(c,235,433,t+.6,C.pink,46);}
  // combine
  if(k>=2)cells.forEach((q,i)=>{const cx=COLX[q.cc],cy=ROWY[q.r],v=k===2?ease(((held?u:u*1.25)-.05-i*.2)/.3):1;
    const final=q.pol===q.pol.toUpperCase()||q.egg!==q.egg.toUpperCase()?[[q.pol,POLLEN,cx-18],[q.egg,EGG,cx+18]]:[[q.egg,EGG,cx-18],[q.pol,POLLEN,cx+18]];
    if(v<=0)return;
    if(v<1){chip(c,mix(cx,final.find(f=>f[1]===POLLEN)[2],v),mix(TOP_Y,cy-46,v),q.pol,POLLEN,32);chip(c,mix(SIDE_X,final.find(f=>f[1]===EGG)[2],v),mix(cy,cy-46,v),q.egg,EGG,32);}
    else final.forEach(([l,col,x])=>chip(c,x,cy-46,l,col,32));
    if(s.cell===i){pulse(c,COLX[q.cc],TOP_Y,t,C.yellow,30);pulse(c,SIDE_X,ROWY[q.r],t,C.yellow,30);}
  });
  if(k>=3){const g=held?u:clamp(u*1.3);cells.forEach((q,i)=>{const cx=COLX[q.cc],cy=ROWY[q.r],geno=q.pol+q.egg;
    pea(c,isTall(geno),cx-38,cy+70,82,clamp(g*1.3-i*.1));text(c,FORM(geno),cx+40,cy+30,22,FORM_COLOR(geno),'center');text(c,'1/4',cx+40,cy+64,22,C.muted,'center');});}
  // summary
  const counts={TT:0,Tt:0,tt:0};cells.forEach(q=>{const g=[q.pol,q.egg].sort((a,b)=>a===a.toUpperCase()?-1:b===b.toUpperCase()?1:0).join('');counts[g]++;});
  const present=GENOS.filter(g=>counts[g]),tall=counts.TT+counts.Tt,short=counts.tt;
  if(k>=3){
    const gt=present.length===1?P(`基因型　全部 ${present[0]}`,`Genotypes: all ${present[0]}`):P(`基因型　${present.join('：')}＝${ratio(present.map(g=>counts[g]))}`,`Genotypes ${present.join(' : ')} = ${enRatio(ratio(present.map(g=>counts[g])))}`);
    const ph=!short?P('表徵　全部高莖','Forms: all tall'):!tall?P('表徵　全部矮莖','Forms: all short'):P(`表徵　高莖：矮莖＝${ratio([tall,short])}`,`Forms tall : short = ${enRatio(ratio([tall,short]))}`);
    text(c,gt,360,530,22,C.white);text(c,ph,360,564,22,C.yellow);
  }else text(c,P('基因型？　表徵？','Genotypes? Forms?'),360,548,22,C.muted);
}

// ── Tab 4: chance in small and large samples ───────────────────────────────
function sampleCounts(s,t){const shown=s.batch.length?Math.min(s.batch.length,Math.floor((t-s.animStart)/s.dt)+1):0;
  let tall=s.base.tall,short=s.base.short;for(let i=0;i<shown;i++)s.batch[i].tall?tall++:short++;return{tall,short,shown};}
function drawSamples(c,s,t){
  const {tall,short,shown}=sampleCounts(s,t),n=tall+short,last=shown?s.batch[shown-1]:null;
  panel(c,20,20,300,560);
  c.save();c.font=MONO(34);c.fillStyle=C.white;c.textAlign='center';c.fillText('Tt × Tt',170,66);c.restore();
  text(c,P('兩株都是高莖','Both parents tall'),170,98,22,C.muted,'center');
  [[95,POLLEN,P('花粉','Pollen')],[245,EGG,P('卵細胞','Egg')]].forEach(([x,col,p])=>{text(c,p,x,140,22,col,'center');D.round(c,x-58,152,116,72,16,rgba(col,.12),col);chip(c,x-24,188,'T',col,34);chip(c,x+24,188,'t',col,34);});
  if(last){const v=s.dt>=.2?ease((t-s.animStart-(shown-1)*s.dt)/Math.min(.45,s.dt)):1;
    chip(c,mix(95,146,v),mix(188,284,v),last.pol,POLLEN,36);chip(c,mix(245,194,v),mix(188,284,v),last.egg,EGG,36);
    if(v>=1){pea(c,last.tall,170,458,112,1);text(c,last.tall?P('高莖','Tall'):P('矮莖','Short'),170,494,24,last.tall?C.green:C.orange,'center');}}
  else text(c,P('按「抽 1 株」開始','Press "1 plant"'),170,330,22,C.muted,'center');
  wrap(c,P('每次兩邊各抽一個，抽完放回。','Draw one from each side, then put it back.'),36,532,268,22,C.muted,30);
  panel(c,340,20,600,560);
  text(c,P('最近 100 株','Latest 100 plants'),356,48,22,C.muted);
  // field: 5 rows of 20
  const recent=s.history.concat(s.batch.slice(0,shown)).slice(-100);
  for(let r=0;r<5;r++){const gy=116+r*58;line(c,[[356,gy],[924,gy]],'rgba(107,74,43,.8)',3);}
  recent.forEach((q,i)=>{const r=Math.floor(i/20),cc=i%20;miniPea(c,370+cc*28.4,116+r*58,q.tall);});
  // stacked bar with the 3 : 1 mark
  const W=568,x0=356,tw=n?W*tall/n:0;
  D.round(c,x0,404,W,36,10,'rgba(11,26,21,.6)',C.edge);
  if(n){D.round(c,x0,404,Math.max(tw,1),36,10,rgba(C.green,.85));if(short)D.round(c,x0+tw,404,W-tw,36,10,rgba(C.orange,.85));}
  c.save();c.setLineDash([6,5]);line(c,[[x0+W*.75,394],[x0+W*.75,450]],C.yellow,3);c.restore();
  text(c,P('3：1 的位置','3 : 1 mark'),x0+W*.75,388,22,C.yellow,'center');
  text(c,P(`高莖 ${tall} 株　矮莖 ${short} 株　共 ${n} 株`,`Tall ${tall}  Short ${short}  Total ${n}`),356,476,22,C.white);
  if(short)text(c,P(`高：矮 ≈ ${(tall/short).toFixed(2)}：1`,`Tall : short ≈ ${(tall/short).toFixed(2)} : 1`),924,476,22,C.yellow,'right');
  // tens
  text(c,P('每 10 株一組，高莖有幾株？（預期約 7.5）','Tall plants per set of 10 (expect ≈ 7.5)'),356,512,22,C.muted);
  const sets=s.tens.slice(-10);if(!sets.length)text(c,P('按「抽 10 株」','Press "10 plants"'),356,552,22,C.muted);
  sets.forEach((v,i)=>{const x=356+i*57;D.round(c,x,526,50,40,10,'rgba(11,26,21,.6)',C.edge);text(c,String(v),x+25,554,22,C.white,'center');});
}
function drawSample(s,count){
  // finish the previous batch at once, then start the new one
  for(const q of s.batch){q.tall?s.base.tall++:s.base.short++;s.history.push(q);}s.history=s.history.slice(-100);s.batch=[];
  for(let i=0;i<count;i++){const pol=Math.random()<.5?'T':'t',egg=Math.random()<.5?'T':'t';s.batch.push({pol,egg,tall:pol==='T'||egg==='T'});}
  for(let i=0;i+10<=count;i+=10)s.tens.push(s.batch.slice(i,i+10).filter(q=>q.tall).length);
  s.dt=count===1?.6:count===10?.22:.025;s.animStart=s.elapsed;
}

// ── tabs ───────────────────────────────────────────────────────────────────
const tabs=[
{id:'traits',title:P('像，不代表全一樣','Similar, not identical'),sub:P('性狀與表徵','Traits and their forms'),
 hook:P('同一片豌豆田裡，有的高、有的矮；有的開紫花、有的開白花。「花的顏色」和「白花」，哪一個才是性狀？','In one pea field some plants are tall and some short; some flowers are purple and some white. Which is the trait: "flower colour" or "white"?'),
 body:P('選一種性狀，看它分成哪兩種表徵。左邊是「性狀」和「表徵」的意思。','Pick a trait and see its two forms. The cards on the left explain the two words.'),
 reading:P('孟德爾研究了豌豆的七種性狀：莖的高度、花的顏色、花的位置、種子的形狀、子葉的顏色、豆莢的形狀、豆莢的顏色。每一種都只有兩種一眼就分得出來的表徵，沒有「不高不矮」的中間型，數起來很清楚。\n\n豌豆的花在自然狀態下會自花授粉，容易得到純品種；也可以用人工授粉，控制哪一株當親代。這些都是孟德爾選豌豆做實驗的原因。','Mendel studied seven pea traits: stem height, flower colour, flower position, seed shape, cotyledon colour, pod shape and pod colour. Each has two forms that are easy to tell apart, with no in-between, so counting is clear.\n\nPea flowers naturally pollinate themselves, which makes pure lines easy to keep, and hand pollination lets the experimenter choose the parents. That is why Mendel chose peas.'),
 closure:P('性狀是生物的特徵（例如莖的高度），表徵是那個特徵表現出來的樣子（高莖、矮莖）。','A trait is a feature (such as stem height); a form is how that feature turns out (tall or short).'),
 quiz:[
  {q:P('「花的顏色」和「白花」，哪一個是性狀？','Which is the trait: "flower colour" or "white"?'),options:[P('花的顏色','Flower colour'),P('白花','White'),P('兩個都是表徵','Both are forms')],answer:0,why:P('花的顏色是性狀；紫花、白花是這個性狀的兩種表徵。','Flower colour is the trait; purple and white are its two forms.'),hint:P('性狀是「哪一方面」，表徵是「那一方面長成什麼樣子」。','A trait names the feature; a form is what the feature looks like.')},
  {q:P('下列哪一組是「同一種性狀」的兩種表徵？','Which pair shows two forms of the same trait?'),options:[P('高莖、矮莖','Tall, short'),P('高莖、白花','Tall, white flowers'),P('圓滑種子、綠色子葉','Round seeds, green cotyledons')],answer:0,why:P('高莖和矮莖都在回答「莖有多高」，是同一種性狀的兩種表徵。','Tall and short both describe stem height.'),hint:P('兩個表徵要回答同一個問題，例如「莖有多高？」。','Both forms must answer the same question, such as "how tall is the stem?".')},
  {q:P('孟德爾挑的豌豆性狀有什麼共同點？','What do Mendel\'s pea traits have in common?'),options:[P('每種只有兩種很容易分辨的表徵','Each has two forms that are easy to tell apart'),P('都長在豌豆的花上','They are all on the flower'),P('都不會遺傳給下一代','None of them is inherited')],answer:0,why:P('表徵分得清楚、沒有中間型，後代才數得清楚。','Clear forms with no in-between make offspring easy to count.'),hint:P('想一想：要數幾百株豌豆，什麼樣的表徵最好數？','If you had to count hundreds of plants, which forms would be easiest to count?')}
 ],
 sources:[],init:()=>({running:true,trait:0,since:0}),
 controls:()=>[choice(P('選一種性狀','Pick a trait'),'trait',TRAITS.map((q,i)=>[i,q.name]))],
 act(s,k,v){s[k]=v;s.since=s.elapsed;},
 explain:s=>({title:TRAITS[s.trait].name,text:TRAITS[s.trait].text}),draw:drawTraits},
{id:'generations',title:P('矮莖沒有消失','The short trait is hidden'),sub:P('孟德爾的豌豆實驗','Mendel\'s pea experiment'),
 hook:P('純品種高莖和矮莖豌豆雜交，第一子代全部都是高莖。矮莖真的消失了嗎？為什麼到了第二子代又冒出來？','Pure tall and pure short peas give an all-tall first generation. Has "short" really vanished? Why does it come back in the second generation?'),
 body:P('按「連續播放」看三代的變化；再切到「打開看基因」，找出第一子代裡藏起來的 t。','Play all three generations, then switch to "Show genes" and find the hidden t in F₁.'),
 reading:P('「純品種」：自花授粉很多代，子代的表徵都和親代一樣。孟德爾用字母代表控制性狀的遺傳因子，今天稱為基因；控制同一性狀、成對的一組叫等位基因。本頁用 T 代表高莖、t 代表矮莖，大寫是顯性，小寫是隱性。\n\n顯性不是「比較好」或「比較常見」，只是兩個同時存在時，表現出來的是它。','A pure line keeps the parents\' form through many generations of self-pollination. Mendel used letters for the hereditary factors we now call genes; the pair controlling one trait are alleles. Here T is tall and t is short: capital for dominant, lower case for recessive.\n\nDominant does not mean better or more common. It is simply the form that shows when both alleles are present.'),
 closure:P('矮莖的等位基因 t 沒有消失，在第一子代被顯性的 T 遮住；第二子代 tt 的個體再次表現矮莖，高莖：矮莖約 3：1。','The short allele t never disappears: in F₁ dominant T masks it, and tt plants in F₂ are short again, about 3 tall : 1 short.'),
 quiz:[
  {q:P('純品種高莖 × 純品種矮莖，第一子代長成什麼樣子？','Pure tall × pure short: what does F₁ look like?'),options:[P('全部高莖','All tall'),P('全部矮莖','All short'),P('一半高、一半矮','Half tall, half short'),P('全部中等高度','All medium height')],answer:0,why:P('第一子代都是 Tt，T 是顯性，所以全部高莖。','Every F₁ plant is Tt and T is dominant, so all are tall.'),hint:P('切到「打開看基因」，看第一子代的基因型。','Switch to "Show genes" and read the F₁ genotypes.')},
  {q:P('第一子代全部高莖，第二子代卻又出現矮莖。矮莖的 t 在第一子代去哪了？','F₁ is all tall, yet short plants return in F₂. Where was t in F₁?'),options:[P('還在第一子代體內，只是被 T 遮住','Still in F₁, masked by T'),P('在第一子代消失，第二子代重新產生','Lost in F₁ and created again in F₂'),P('被環境改變成 T','Changed into T by the environment')],answer:0,why:P('第一子代都是 Tt：t 一直都在，只是顯性的 T 決定了表徵。','F₁ plants are Tt: t is there all along, but dominant T sets the form.'),hint:P('看第一子代每一株下面的兩個字母。','Look at the two letters under each F₁ plant.')},
  {q:P('孟德爾在第二子代數到高莖 787 株、矮莖 277 株，比例最接近？','Mendel counted 787 tall and 277 short F₂ plants. Which ratio is closest?'),options:[P('3：1','3 : 1'),P('1：1','1 : 1'),P('1：2：1','1 : 2 : 1'),P('2：1','2 : 1')],answer:0,why:P('787 ÷ 277 ≈ 2.84，最接近 3：1。1：2：1 是基因型 TT：Tt：tt 的比例，不是表徵的比例。','787 ÷ 277 ≈ 2.84, closest to 3 : 1. The 1 : 2 : 1 ratio is for genotypes (TT : Tt : tt), not forms.'),hint:P('算一算 787 ÷ 277 大約是多少。','Work out 787 ÷ 277.')}
 ],
 sources:[],init:()=>({running:true,phase:-1,start:0,view:0}),
 controls:()=>[choice(P('階段','Stage'),'phase',[[-1,P('連續播放','Play all')],...GEN_SHORT.map((n,i)=>[i,n])]),choice(P('觀察','View'),'view',[[0,P('只看外表','Looks only')],[1,P('打開看基因','Show genes')]])],
 act(s,k,v){s[k]=v;if(k==='phase')s.start=s.elapsed;},
 explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;return{title:GEN_NAMES[k],text:GEN_TEXT[k]};},draw:drawGenerations},
{id:'cross',title:P('一格是一種可能','A cell is a possibility'),sub:P('配子與棋盤格','Gametes and Punnett squares'),
 hook:P('棋盤格裡畫了四格，是代表一定會長出四株豌豆嗎？','A Punnett square has four cells. Does that mean exactly four pea plants will grow?'),
 body:P('先選兩個親代，再看等位基因分開、配子結合。點格子可以看那一格是怎麼來的。','Choose the two parents, then watch the alleles separate and the gametes combine. Tap a cell to see where it came from.'),
 reading:P('棋盤格上方寫一個親代的配子，左方寫另一個親代的配子，交叉的格子就是一種組合。\n\nTT × tt → 全部 Tt，全部高莖。\nTt × Tt → TT：Tt：tt＝1：2：1，高莖：矮莖＝3：1。\nTt × tt → Tt：tt＝1：1，高莖：矮莖＝1：1。','Write one parent\'s gametes along the top and the other\'s down the side; each crossing cell is one combination.\n\nTT × tt → all Tt, all tall.\nTt × Tt → TT : Tt : tt = 1 : 2 : 1; tall : short = 3 : 1.\nTt × tt → Tt : tt = 1 : 1; tall : short = 1 : 1.'),
 closure:P('每個配子只帶一對等位基因中的一個；棋盤格的每一格是一種機率相同的組合。TT 和 Tt 基因型不同，表徵都是高莖。','Each gamete carries one allele of the pair; each cell is an equally likely combination. TT and Tt differ in genotype but are both tall.'),
 quiz:[
  {q:P('Tt 形成配子時，一個配子帶幾個控制莖高的等位基因？','When Tt forms gametes, how many stem-height alleles does one gamete carry?'),options:[P('1 個：T 或 t','One: T or t'),P('2 個：T 和 t','Two: T and t'),P('0 個','None')],answer:0,why:P('成對的等位基因在形成配子時分開，每個配子只帶一個。','The pair separates when gametes form; each gamete carries one.'),hint:P('看「分離成配子」那一步：棋盤格上方每個圓圈裡有幾個字母？','Watch "Alleles separate": how many letters are in each circle?')},
  {q:P('Tt × tt，子代是矮莖的機率是多少？','Tt × tt: what is the chance an offspring is short?'),options:[P('1/2','1/2'),P('1/4','1/4'),P('3/4','3/4'),P('0','0')],answer:0,why:P('tt 只給 t；Tt 給 T 或 t。四格裡有兩格是 tt，機率 1/2。','tt gives only t; Tt gives T or t. Two of the four cells are tt: 1/2.'),hint:P('把親代設成 Tt 和 tt，數一數有幾格是矮莖。','Set the parents to Tt and tt and count the short cells.')},
  {q:P('棋盤格的四格代表什麼？','What do the four cells stand for?'),options:[P('四種機率相同的配子組合','Four equally likely gamete combinations'),P('一定會長出的四株子代','Exactly four offspring that will grow'),P('四個親代','Four parents')],answer:0,why:P('每一格是一種可能，機率各 1/4；種很多株時，比例才會接近棋盤格的結果。','Each cell is one possibility with chance 1/4; the ratio shows up when many plants are grown.'),hint:P('想一想：如果只長出一株，它會是哪一格？','If only one plant grew, which cell would it be?')}
 ],
 sources:[],init:()=>({running:true,phase:-1,start:0,pa:'Tt',pb:'Tt',cell:-1}),
 controls:()=>[choice(P('花粉的親代','Pollen parent'),'pa',GENOS.map(g=>[g,P(`${g}（${FORM(g)[0]}）`,`${g} (${FORM(g)[1].toLowerCase()})`)])),choice(P('卵細胞的親代','Egg parent'),'pb',GENOS.map(g=>[g,P(`${g}（${FORM(g)[0]}）`,`${g} (${FORM(g)[1].toLowerCase()})`)])),choice(P('步驟','Step'),'phase',[[-1,P('連續播放','Play all')],...CROSS_NAMES.map((n,i)=>[i,n])])],
 act(s,k,v){s[k]=v;if(k==='pa'||k==='pb'){s.cell=-1;s.start=s.elapsed;}if(k==='phase'){s.start=s.elapsed;}},
 explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;if(s.cell>=0&&k>=2){const pol=s.pa[s.cell&1],egg=s.pb[s.cell>>1],g=[pol,egg].sort((a,b)=>a===a.toUpperCase()?-1:b===b.toUpperCase()?1:0).join('');
   return{title:P(`這一格：${g}`,`This cell: ${g}`),text:P(`花粉帶 ${pol}、卵細胞帶 ${egg}，結合成 ${g}，表徵是${FORM(g)[0]}。四格的機率一樣，各是 1/4。`,`Pollen brings ${pol} and the egg brings ${egg}, giving ${g}: ${FORM(g)[1].toLowerCase()}. Each of the four cells has chance 1/4.`)};}
   return{title:CROSS_NAMES[k],text:CROSS_TEXT[k]};},draw:drawCross},
{id:'samples',title:P('十次就一定三比一？','Must ten trials give 3:1?'),sub:P('機率與抽樣','Probability and sampling'),
 hook:P('理論上高莖：矮莖＝3：1，那麼種 4 株豌豆，一定剛好 3 高 1 矮嗎？','In theory tall : short is 3 : 1. If you grow four plants, must you get exactly 3 tall and 1 short?'),
 body:P('按「抽 10 株」好幾次，看每 10 株的結果有多不一樣；再按「抽 100 株」，看比例往哪裡靠。','Press "10 plants" several times and compare the sets; then press "100 plants" and watch where the ratio settles.'),
 reading:P('機率 1/4 的意思是：做很多很多次，大約每四次有一次。孟德爾種了一千多株，所以比例很接近 3：1；如果只有幾株，結果常常差很多。\n\n每一次受精都是獨立的。不會因為前面出現很多高莖，下一株就比較容易是矮莖。','A probability of 1/4 means about one in four over very many trials. Mendel grew over a thousand plants, so his ratio came close to 3 : 1; with only a few plants the result often differs a lot.\n\nEach fertilization is independent: many tall plants in a row do not make the next one more likely to be short.'),
 closure:P('機率是大量結果的趨勢，不是少數幾次的保證。數量越多，比例越接近 3：1；每一次受精都重新抽一次。','Probability is a trend over many results, not a promise for a few. The more plants, the closer to 3 : 1; every fertilization is a fresh draw.'),
 quiz:[
  {q:P('Tt × Tt 種出 4 株，結果一定是 3 高 1 矮嗎？','Tt × Tt gives four plants. Must it be 3 tall and 1 short?'),options:[P('不一定，數量少時常常偏離 3：1','Not necessarily; small samples often stray from 3 : 1'),P('一定剛好 3 高 1 矮','Always exactly 3 tall, 1 short'),P('一定不會出現 3 高 1 矮','Never 3 tall, 1 short')],answer:0,why:P('每株都是獨立抽樣，4 株太少，4 高 0 矮、2 高 2 矮都可能出現。','Each plant is an independent draw; with only four, 4 : 0 or 2 : 2 can easily happen.'),hint:P('按幾次「抽 10 株」，看每組的結果是不是都一樣。','Press "10 plants" a few times: are the sets all the same?')},
  {q:P('已經連續種出 3 株高莖，第 4 株是矮莖的機率是多少？','Three tall plants in a row. What is the chance the fourth is short?'),options:[P('1/4','1/4'),P('1，一定輪到矮莖','1: short is due'),P('3/4','3/4'),P('0','0')],answer:0,why:P('每次受精都是獨立的，前面的結果不會「補償」下一次，矮莖的機率還是 1/4。','Each fertilization is independent; earlier results do not "balance out", so it is still 1/4.'),hint:P('花粉和卵細胞會記得前面抽到什麼嗎？','Do pollen and eggs remember earlier draws?')},
  {q:P('要讓結果更接近 3：1，該怎麼做？','How do you get results closer to 3 : 1?'),options:[P('種更多株，用大量結果計算比例','Grow many more plants and use all the results'),P('只挑長得最好的幾株來數','Count only the best-looking plants'),P('種到剛好 3：1 就停下來','Stop as soon as it reads 3 : 1')],answer:0,why:P('數量越多，偶然的偏差越不明顯，比例越接近理論值。孟德爾就數了上千株。','The bigger the sample, the less chance swings matter. Mendel counted over a thousand.'),hint:P('比較「抽 10 株」和「抽 100 株」之後的比例。','Compare the ratio after "10 plants" with after "100 plants".')}
 ],
 sources:[],init:()=>({running:true,draw:-1,base:{tall:0,short:0},batch:[],history:[],tens:[],dt:.3,animStart:0}),
 controls:()=>[choice(P('抽樣','Draw'),'draw',[[1,P('抽 1 株','1 plant')],[10,P('抽 10 株','10 plants')],[100,P('抽 100 株','100 plants')],[0,P('全部清除','Clear all')]])],
 act(s,k,v){if(k!=='draw')return;s.draw=v;if(v===0){s.base={tall:0,short:0};s.batch=[];s.history=[];s.tens=[];return;}drawSample(s,v);},
 explain:s=>{const {tall,short}=sampleCounts(s,s.elapsed||0),n=tall+short;
   if(!n)return{title:P('Tt × Tt 抽樣','Sampling Tt × Tt'),text:P('兩株親代都是 Tt。每抽一次，花粉和卵細胞各隨機帶來 T 或 t；理論上矮莖（tt）的機率是 1/4。','Both parents are Tt. Each draw takes T or t at random from the pollen and from the egg; in theory a short plant (tt) has chance 1/4.')};
   return{title:P(`已抽 ${n} 株`,`${n} plants so far`),text:short?P(`高莖 ${tall} 株、矮莖 ${short} 株，高：矮 ≈ ${(tall/short).toFixed(2)}：1。孟德爾數到 787：277 ≈ 2.84：1。數量越多，越接近 3：1。`,`Tall ${tall}, short ${short}: about ${(tall/short).toFixed(2)} : 1. Mendel counted 787 : 277 ≈ 2.84 : 1. More plants bring the ratio closer to 3 : 1.`):P(`目前高莖 ${tall} 株，還沒有矮莖。矮莖的機率是 1/4，多抽幾次就會出現。`,`${tall} tall and no short yet. Short has chance 1/4; keep drawing.`)};},
 draw:drawSamples}
];
B.register({id:'mendel_inheritance',title:P('遺傳：消失的表徵去哪了？','Inheritance: where did the hidden trait go?'),subtitle:P('從豌豆實驗看見藏起來的等位基因','Mendel\'s peas reveal the hidden allele'),cover:'assets/covers/biology_mendel_inheritance_1019_v1.jpg',
 assetDir:'assets/biology/genetics_originals_1010_v1/',family:P('遺傳與生物技術','Inheritance and biotechnology'),bookName:P('遺傳','Inheritance'),tabs});
})();

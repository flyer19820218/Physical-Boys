/* Endocrine coordination · teacher-requested V5 remake, 2026-10-18.
 * Same five tabs, hooks, closures, readings and controls as endocrine_1009_v1.js.
 * Pictures are the teacher's Gemini AI teaching illustrations (background removed; see
 * endocrine_ai_1018/sources.md); cells, hormones and blood are cartoons drawn here.
 * Symbols, sizes and times are teaching models, not measurements.
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',
  ink:'#0b1a15',nerve:'#f6c453'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d;
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

// ── pictures ───────────────────────────────────────────────────────────────
const PICS={};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
const E_DIR='assets/biology/endocrine_ai_1018/',BR_DIR='assets/biology/brain_reflex_ai_1018/';
// Fit a picture into a box; returns a mapper from picture pixels to canvas (null until loaded).
function fitPic(c,path,bx,by,bw,bh,alpha=1){
  const im=pic(path);if(!im)return null;const k=Math.min(bw/im.naturalWidth,bh/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k,x=bx+(bw-w)/2,y=by+(bh-h)/2;
  c.save();c.globalAlpha=alpha;c.drawImage(im,x,y,w,h);c.restore();return(px,py)=>[x+px*k,y+py*k];
}
function ring(c,x,y,r,t,color=C.orange){glow(c,x,y,r*1.8,color,.35+.15*Math.sin(t*4));c.save();c.beginPath();c.arc(x,y,r+2*Math.sin(t*4),0,TAU);c.strokeStyle=color;c.lineWidth=4;c.stroke();c.restore();}
function star(c,x,y,r,fill=C.yellow,rot=0){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<10;i++){const rr=i%2?r*.45:r,a=i*Math.PI/5-Math.PI/2;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();c.restore();}
function hexagon(c,x,y,r,fill=C.yellow){c.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();}
function blob(c,x,y,r,fill,light,phase=0){
  const g=c.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r*1.15);g.addColorStop(0,light);g.addColorStop(1,fill);
  c.beginPath();for(let i=0;i<=40;i++){const a=i/40*TAU,rr=r*(1+.06*Math.sin(a*4+phase));c[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fillStyle=g;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
}

// ── Tab 1: where the glands are ────────────────────────────────────────────
// Body picture (708×912): only the torso part is shown. BODY maps picture pixels to the canvas.
const BODY_SRC=[110,30,488,740],BODY_K=.72,BODY=(x,y)=>[30+(x-BODY_SRC[0])*BODY_K,30+(y-BODY_SRC[1])*BODY_K];
function drawBody(c,x0,y0,k,alpha=1){const im=pic(E_DIR+'endocrine_body.png');if(!im)return;c.save();c.globalAlpha=alpha;c.drawImage(im,...BODY_SRC,x0,y0,BODY_SRC[2]*k,BODY_SRC[3]*k);c.restore();}
const glands=[
 {name:P('腦垂腺','Pituitary'),at:[[352,112]],where:P('位置：腦的底部','Location: base of the brain'),file:BR_DIR+'brain_sagittal.png',spots:[[410,476,22]],
  text:P('位於腦的底部。生長激素參與生長發育；腦垂腺也分泌多種促進激素，影響其他內分泌腺。','At the base of the brain. Growth hormone contributes to growth; other pituitary hormones regulate several endocrine glands.')},
 {name:P('甲狀腺','Thyroid'),at:[[352,242]],where:P('位置：頸部，氣管前方（右圖為背面）','Location: neck, in front of the trachea (picture: back view)'),file:E_DIR+'thyroid_back.png',spots:[[300,400,120],[708,410,120]],
  text:P('在頸部、氣管附近。甲狀腺素參與調節代謝與生長發育；不是把整個頸部都叫甲狀腺。','In the neck near the trachea. Thyroid hormones help regulate metabolism, growth and development; the gland is not the whole neck.')},
 {name:P('副甲狀腺','Parathyroids'),at:[[352,242]],where:P('位置：甲狀腺背面的四小顆','Location: four small glands behind the thyroid'),file:E_DIR+'thyroid_back.png',spots:[[295,280,26],[325,525,26],[702,290,26],[672,545,26]],
  text:P('位於甲狀腺的背面，通常有四小顆。副甲狀腺素參與調節血鈣；不是甲狀腺的另一個名稱。','Usually four small glands behind the thyroid. Parathyroid hormone helps regulate blood calcium; these glands are not another name for the thyroid.')},
 {name:P('腎上腺','Adrenals'),at:[[318,470],[398,470]],where:P('位置：兩個腎臟的上方','Location: on top of the two kidneys'),file:E_DIR+'kidneys_adrenals.png',spots:[[345,185,62],[645,168,62]],
  text:P('在兩個腎臟上方。緊急狀況時，腎上腺素使心跳與呼吸加快、血糖上升，幫助身體應付變化；腎上腺不是腎臟。','Above the kidneys. During an emergency, adrenaline increases heart and breathing rates and blood glucose, helping the body respond. Adrenal glands are not kidneys.')},
 {name:P('胰島','Pancreatic islets'),at:[[368,462]],where:P('位置：散布在胰臟裡的細胞群','Location: cell groups scattered in the pancreas'),file:E_DIR+'liver_pancreas.png',spots:[[600,440,70]],islet:true,
  text:P('胰島是散布在胰臟內的細胞群。胰島素使血糖下降，升糖素使血糖上升；胰臟還有分泌消化液的外分泌部分。','Islets are groups of cells within the pancreas. Insulin lowers blood glucose; glucagon raises it. Other pancreatic cells also release digestive secretions.')},
 {name:P('卵巢','Ovaries'),at:[[318,612],[390,612]],where:P('位置：骨盆腔內，左右各一','Location: in the pelvis, one on each side'),file:E_DIR+'ovaries.png',spots:[[225,290,62],[762,290,62]],
  text:P('卵巢分泌動情素等激素，參與生殖與第二性徵的發育。發育時間與外觀有個體差異，不用拿同學互相比較。','Ovaries release hormones such as estrogens, contributing to reproduction and secondary sex characteristics. Development varies; do not compare classmates\' bodies.')},
 {name:P('睪丸','Testes'),at:[[352,706]],where:P('位置：陰囊內，左右各一','Location: in the scrotum, one on each side'),file:E_DIR+'testes.png',spots:[[330,380,90],[690,340,90]],
  text:P('睪丸分泌雄性激素，參與生殖與第二性徵的發育。人體圖上不畫生殖器官，只用圓圈標出位置；右邊是器官放大圖。','Testes produce androgens involved in reproduction and secondary sex characteristics. The body picture shows only the position; the organ is enlarged on the right.')}
];
function drawGlands(c,s,t){
  panel(c,20,20,380,560);drawBody(c,30,30,BODY_K);
  glands.forEach((q,i)=>{for(const p of q.at){const [x,y]=BODY(...p);if(i===s.gland)ring(c,x,y,i>=5?16:14,t);else circle(c,x,y,6,rgba(C.orange,.75),C.ink,1.5);D.hit(x-20,y-20,40,40,'gland',i);}});
  const q=glands[s.gland],[ax,ay]=BODY(...q.at[q.at.length-1]);
  c.save();c.setLineDash([8,7]);line(c,[[ax+18,ay],[420,ay<300?100:300]],rgba(C.orange,.7),2.5);c.restore();
  panel(c,420,20,520,560);
  text(c,q.name,445,66,32,C.yellow);
  const box=q.islet?[440,90,330,330]:[440,90,480,380],m=fitPic(c,q.file,...box);
  if(m)for(const [px,py,r] of q.spots){const [x,y]=m(px,py);ring(c,x,y,r*Math.min(box[2]/1000,box[3]/746)*1.05,t);}
  if(q.islet){const cx=840,cy=330,r=86;c.save();c.beginPath();c.arc(cx,cy,r,0,TAU);c.clip();fitPic(c,E_DIR+'islet.png',cx-r*1.25,cy-r*1.25,r*2.5,r*2.5);c.restore();circle(c,cx,cy,r,null,C.yellow,4);
    if(m){const [x,y]=m(600,440);line(c,[[x+20,y],[cx-r,cy]],C.yellow,2.5);}text(c,P('胰島（淺色細胞群）','Islet (pale cell group)'),cx,cy+r+30,22,C.yellow,'center');}
  wrap(c,q.where,445,520,470,24,C.cyan);
}

// ── Tab 2: hormones travel in blood ────────────────────────────────────────
const VESSEL={x0:30,x1:930,y:300,h:96};
function drawMessenger(c,s,t){
  // blood vessel with red cells drifting to the right
  const {x0,x1,y,h}=VESSEL;
  c.save();c.beginPath();c.roundRect(x0,y-h/2,x1-x0,h,h/2);const g=c.createLinearGradient(0,y-h/2,0,y+h/2);g.addColorStop(0,'#7a2333');g.addColorStop(.5,'#a8394b');g.addColorStop(1,'#6b1d2c');c.fillStyle=g;c.fill();c.lineWidth=4;c.strokeStyle='#e88b9b';c.stroke();c.clip();
  for(let i=0;i<14;i++){const xx=x0+((i*71+t*60)%(x1-x0+80))-40,yy=y+Math.sin(i*1.7)*24;ellipse(c,xx,yy,18,11,'#e0485e','#7a1f2c',2);ellipse(c,xx,yy,8,4,'rgba(120,20,35,.55)');}
  c.restore();
  // gland cell releases hormones into the vessel
  blob(c,140,140,58,'#f59e5b','#ffe2c4');eyes(c,150,120,8,'happy',[.4,.5]);smile(c,152,148,18);
  text(c,P('內分泌腺細胞','Endocrine gland cell'),140,58,22,C.orange,'center');
  // hormones: drop from the gland, then ride the blood
  const hormones=[];for(let i=0;i<7;i++){const u=mod(t*.12+i/7);hormones.push(u<.14?[140+u/.14*40,200+u/.14*(y-215)]:[180+(u-.14)/.86*(x1-200),y-18+Math.sin(i*2.1+u*9)*20]);}
  // target cells under the vessel
  const cells=[{x:400,match:false},{x:720,match:true}];
  for(const cell of cells){
    const chosen=cell.match===s.match,cx=cell.x,cy=470,docked=cell.match&&mod(t*.5)>.45;
    if(chosen)glow(c,cx,cy,110,cell.match?C.green:C.muted,.25);
    c.save();c.globalAlpha=chosen?1:.45;
    blob(c,cx,cy,62,cell.match?(docked?'#3fb37a':'#4b8f72'):'#6a7f78',cell.match?'#d8ffe6':'#c9d6d1',cell.x/50);
    // receptors on the top edge: star-shaped notches only on the matching cell
    for(const dx of [-30,0,30]){const rx=cx+dx,ry=cy-58+Math.abs(dx)*.25;if(cell.match){star(c,rx,ry,11,'#0b1a15');}else{circle(c,rx,ry,9,'#2f403a',C.ink,2);}}
    if(docked){star(c,cx,cy-58,10,C.yellow,t);sparkleBurst(c,cx,cy,t);}
    eyes(c,cx,cy-8,8,docked?'happy':'closed',[0,-.4]);smile(c,cx,cy+18,docked?20:12,docked);
    c.restore();
    if(chosen){c.save();c.setLineDash([8,6]);c.beginPath();c.arc(cx,cy,74,0,TAU);c.strokeStyle=C.yellow;c.lineWidth=3;c.stroke();c.restore();}
    {const lab=cell.match?P('作用細胞：有對應的接受器','Target cell: matching receptors'):P('其他細胞：沒有對應的接受器','Other cell: no matching receptor'),rows=splitLines(c,D.tr(lab),290,22);rows.forEach((r,k)=>text(c,r,cx,572+k*26-(rows.length-1)*13,22,cell.match?C.green:C.muted,'center'));}
    text(c,cell.match?(docked?P('有反應！','Responds!'):P('等待激素','Waiting')):P('沒有反應','No response'),cx,cy-84,22,cell.match?C.yellow:C.muted,'center');
  }
  // the hormone that docks on the matching cell
  if(mod(t*.5)>.3&&mod(t*.5)<=.45){const u=(mod(t*.5)-.3)/.15;star(c,720,y+30+u*(480-58-y-30),11,C.yellow,t);}
  hormones.forEach((p,i)=>star(c,p[0],p[1],11,C.yellow,t+i));
  text(c,P('血管：激素隨血液流到全身','Blood vessel: hormones travel everywhere in blood'),x1-10,y-h/2-14,22,C.white,'right');
  legend(c,[[C.yellow,P('星形＝激素（辨識符號）','Star = hormone (symbol)')]],560,42,370);
  legend(c,[['#e0485e',P('紅色扁圓＝紅血球','Red disc = red blood cell')]],560,76,370);
}
function sparkleBurst(c,x,y,t){for(let i=0;i<6;i++){const a=i*TAU/6+t,r=86+6*Math.sin(t*6+i);star(c,x+Math.cos(a)*r,y+Math.sin(a)*r,6,C.yellow,t*2);}}

// ── Tab 3: insulin and glucagon ────────────────────────────────────────────
function drawGlucose(c,s,t){
  const dt=Math.max(0,t-s.start),offset=(s.event==='meal'?.32:-.32)*Math.exp(-dt*.3),level=.5+offset,meal=s.event==='meal',active=Math.abs(offset)>.025;
  panel(c,20,20,410,560);
  const m=fitPic(c,E_DIR+'liver_pancreas.png',30,40,390,300);
  const ISLET=[120,460],R=78;
  c.save();c.beginPath();c.arc(...ISLET,R,0,TAU);c.clip();fitPic(c,E_DIR+'islet.png',ISLET[0]-R*1.25,ISLET[1]-R*1.25,R*2.5,R*2.5);c.restore();circle(c,...ISLET,R,null,C.yellow,4);
  let LIVER=[150,140],PANC=[260,250];if(m){LIVER=m(380,190);PANC=m(600,440);line(c,[PANC,[ISLET[0]+R*.7,ISLET[1]-R*.7]],C.yellow,2.5);}
  pill(c,P('肝臟','Liver'),LIVER[0]-60,LIVER[1]-110,{size:22,anchor:LIVER,maxX:420});
  pill(c,P('胰臟','Pancreas'),PANC[0]+20,PANC[1]+60,{size:22,anchor:PANC,maxX:420});
  text(c,P('胰島','Islet'),ISLET[0]+R+16,ISLET[1]+8,24,C.yellow);
  // blood vessel and glucose in it
  const VX0=460,VX1=730,VY=300;
  c.save();c.beginPath();c.roundRect(VX0,VY-40,VX1-VX0,80,40);c.fillStyle='#8f2e40';c.fill();c.strokeStyle='#e88b9b';c.lineWidth=3;c.stroke();c.clip();
  const n=Math.round(level*22);for(let i=0;i<n;i++){const x=VX0+((i*37+t*40)%(VX1-VX0+40))-20,y=VY+Math.sin(i*2.3)*22;hexagon(c,x,y,9);}c.restore();
  text(c,P('血液中的葡萄糖','Glucose in blood'),VX0,VY-54,22,C.yellow);
  // hormone from the islet, and where glucose goes
  const hColor=meal?C.cyan:C.orange,hName=meal?P('胰島素','Insulin'):P('升糖素','Glucagon');
  const toBlood=[[ISLET[0]+R,ISLET[1]],[330,430],[VX0+30,VY+30]],toLiver=[[ISLET[0],ISLET[1]-R],[60,330],[LIVER[0]-40,LIVER[1]+40]];
  const CELL=[630,470];
  blob(c,...CELL,48,'#4b8f72','#d8ffe6');eyes(c,CELL[0],CELL[1]-6,6,'happy');smile(c,CELL[0],CELL[1]+14,14);
  text(c,P('身體細胞、肝臟儲存','Body cells, liver storage'),CELL[0],CELL[1]+72,22,C.white,'center');
  if(active){
    if(meal){D.flow(c,toBlood,dt,4,(cc,x,y)=>circle(cc,x,y,7,C.cyan,C.ink,2));D.flow(c,[[640,VY+40],[CELL[0],CELL[1]-50]],dt,3,(cc,x,y)=>hexagon(cc,x,y,9));}
    else{D.flow(c,toLiver,dt,4,(cc,x,y)=>circle(cc,x,y,7,C.orange,C.ink,2));D.flow(c,[[LIVER[0]+60,LIVER[1]+10],[400,220],[VX0+20,VY-20]],dt,3,(cc,x,y)=>hexagon(cc,x,y,9));}
  }
  text(c,hName,620,96,30,hColor,'center');
  wrap(c,meal?P('細胞利用與儲存葡萄糖','Cells use and store glucose'):P('肝糖分解，釋出葡萄糖','Liver glycogen breaks down; glucose released'),490,134,260,22,C.white);
  // gauge: relative glucose
  const GX=850,GY=70,GH=450;
  text(c,P('相對血糖','Relative glucose'),936,GY-14,22,C.yellow,'right');
  D.round(c,GX,GY,60,GH,20,C.panel,C.edge);D.round(c,GX+4,GY+GH*(1-level),52,GH*level,16,'#d5bb55');
  D.round(c,GX-8,GY+GH*.42,76,GH*.16,6,'rgba(74,222,128,.22)',C.green);
  text(c,P('基準','Normal'),GX-14,GY+GH*.5+8,22,C.green,'right');
  text(c,active?P('偏差變小，調節刺激減弱','Imbalance shrinking'):P('回到基準帶','Back in the band'),645,590,22,C.cyan,'center');
}

// ── Tab 4: growth and metamorphosis ────────────────────────────────────────
const LIFE={
  frog:{stages:[P('卵','Eggs'),P('蝌蚪','Tadpole'),P('長出後腳','Hind legs'),P('幼蛙（還有短尾）','Froglet (short tail)'),P('成蛙','Adult frog')],file:i=>`${E_DIR}frog_stage${i+1}.png`},
  butterfly:{stages:[P('卵','Eggs'),P('幼蟲','Caterpillar'),P('蛹','Pupa'),P('成蟲','Adult butterfly')],file:i=>`${E_DIR}butterfly_stage${i+1}.png`}
};
function drawGrowth(c,s,t){
  const L=LIFE[s.animal],n=L.stages.length,cur=s.stage<0?Math.floor(t*.45)%n:s.stage;
  const slot=880/n;
  for(let i=0;i<n;i++){const x=40+i*slot,on=i===cur;D.round(c,x+6,30,slot-12,140,14,on?'rgba(253,224,71,.16)':C.panel,on?C.yellow:C.edge);fitPic(c,L.file(i),x+16,40,slot-32,92,on?1:.55);
    text(c,L.stages[i],x+slot/2,160,22,on?C.yellow:C.muted,'center');D.hit(x+6,30,slot-12,140,'stage',i);
    if(i<n-1)arrow(c,x+slot-10,100,x+slot+8,100,C.muted,3);}
  panel(c,40,190,880,340);
  glow(c,480,360,220,C.yellow,.12);
  fitPic(c,L.file(cur),120,210,720,250);
  text(c,L.stages[cur],480,500,32,C.yellow,'center');
  text(c,P('生長：變大　發育：構造與功能也改變','Growth: bigger   Development: structures and functions change'),480,570,24,C.cyan,'center');
}

// ── Tab 5: nervous vs endocrine ────────────────────────────────────────────
function drawCompare(c,s,t){
  const nerveOn=s.mode==='nerve';
  panel(c,20,20,450,545);panel(c,490,20,450,545);
  // left: nervous system picture (746×1000), one signal along a fixed path to the hand
  const NK=.5,NX=245-746*NK/2,NY=70,N=(x,y)=>[NX+x*NK,NY+y*NK];
  const nim=pic(BR_DIR+'nervous_system_body.png');if(nim){c.save();c.globalAlpha=nerveOn?1:.35;c.drawImage(nim,NX,NY,746*NK,1000*NK);c.restore();}
  const route=[[378,80],[374,150],[374,214],[357,214],[300,235],[264,271],[243,343],[228,428],[214,500],[203,557],[193,600]].map(p=>N(...p));
  if(nerveOn){for(let k=0;k<2;k++)signal(c,route,mod(t*.45+k*.5),C.cyan,8);const h=route[route.length-1];ring(c,h[0],h[1],16,t,C.cyan);}
  text(c,P('神經：沿專線傳到特定對象','Nerves: a direct line to one target'),245,58,24,nerveOn?C.cyan:C.muted,'center');
  // right: full endocrine body at the same figure height as the nervous-system body (both ≈433 px tall)
  const EK=.396,EX0=715-529*EK/2,EY0=NY+35*NK,EB=(x,y)=>[EX0+x*EK,EY0+y*EK];
  const eim=pic(E_DIR+'endocrine_body_full.png');if(eim){c.save();c.globalAlpha=nerveOn?.35:1;c.drawImage(eim,EX0,EY0,529*EK,1204*EK);c.restore();}
  const src=EB(232,436),ends=[[265,60],[60,650],[470,650],[215,1160],[318,1160],[215,880],[318,880],[300,300]].map(p=>EB(...p));
  if(!nerveOn){ring(c,...src,12,t,C.orange);ends.forEach((e,i)=>{const mid=[(src[0]+e[0])/2+(i%2?14:-14),(src[1]+e[1])/2];const path=[src,mid,e];for(let k=0;k<2;k++){const u=mod(t*.28+k*.5+i*.13);const [x,y]=along(path,u);circle(c,x,y,6,C.orange,C.ink,1.5);}});
    const heart=ends[7];ring(c,heart[0],heart[1],12,t+1,C.green);pill(c,P('作用對象','Target'),810,heart[1]-60,{active:true,color:C.green,size:22,anchor:heart,maxX:935});pill(c,P('腎上腺','Adrenal gland'),800,src[1]+40,{active:true,color:C.orange,size:22,anchor:src,maxX:935});}
  text(c,P('內分泌：激素隨血液到全身','Hormones: carried in blood'),715,58,24,nerveOn?C.muted:C.orange,'center');
  D.round(c,40,540,880,0,0);
  text(c,P('播放速度不代表真實快慢','Playback speed is not real speed'),480,594,22,C.muted,'center');
}

const tabs=[
 {id:'glands',title:P('小腺體，大影響','Small glands, large effects'),sub:P('內分泌腺定位','Locate endocrine glands'),hook:P('腎上腺、胰島、副甲狀腺，名稱很像附近器官，真的就是同一個構造嗎？','Adrenals, islets and parathyroids sound like nearby organs. Are they the same structures?'),body:P('點選腺體：左邊看它在身體的哪裡，右邊看放大圖；位置、名稱與功能一起看。','Select a gland: the left shows where it is, the right enlarges it. Match location, name and function.'),closure:P('內分泌腺分泌激素；分泌量與時機要適當，並不是越多越好。','Endocrine glands release hormones. Appropriate amounts and timing matter; more is not always better.'),reading:P('內分泌沒有輸送分泌物的導管，激素進入血液，由血液運送。少量激素就能產生作用。胰臟同時有內、外分泌功能：胰島分泌激素，其他細胞可經導管分泌消化液。疾病名稱與症狀只作課本背景閱讀；本教材不提供診斷或治療建議。','Endocrine secretion has no duct carrying its product: hormones enter the blood and travel in it. Small amounts can have effects. The pancreas has both endocrine and exocrine functions: islets release hormones; other cells release digestive fluid through ducts. Disease examples are textbook context, not diagnosis or treatment advice.'),sources:[],init:()=>({running:true,gland:0}),controls:s=>[choice(P('腺體','Gland'),'gland',glands.map((q,i)=>[i,q.name]))],explain:s=>({title:glands[s.gland].name,text:glands[s.gland].text}),draw:drawGlands},
 {id:'messenger',title:P('血液帶著訊息走','Messages travel in blood'),sub:P('激素與作用對象','Hormones and target cells'),hook:P('血液到處流，為什麼不是每個細胞收到激素都做一樣的反應？','Blood circulates everywhere. Why does a hormone not make every cell respond in the same way?'),body:P('激素由內分泌腺釋出，經血液運送；只有能辨識該訊息的作用對象，才會產生相應反應。','Hormones are released by endocrine glands and carried in blood. Cells able to recognize that message respond appropriately.'),closure:P('運送到附近，不等於一定能作用；激素要對應適當的作用對象。','Being carried nearby does not guarantee an effect. A hormone must reach cells that can recognize it.'),reading:P('補充模型：激素與受器具有選擇性，作用細胞要具備相應的受器。畫面使用簡化辨識符號，不是真實分子形狀，也不宣稱所有激素都在細胞表面結合。神經與內分泌不是互相獨立的兩套系統：神經訊息也能調節部分激素的釋放。','Supplementary model: target cells have receptors that recognize particular hormones. Symbols are simplified, not real molecular shapes; not every hormone binds at the cell surface. Nervous and endocrine systems interact, and neural signals can regulate hormone release.'),sources:[],init:()=>({running:true,match:true}),controls:s=>[choice(P('作用細胞','Target cell'),'match',[[true,P('可以辨識','Recognizes message')],[false,P('不能辨識','Does not recognize')]])],explain:s=>({title:s.match?P('辨識訊息，產生反應','Message recognized: response'):P('沒有相應辨識，不產生此反應','No recognition: no such response'),text:P('黃色星形是激素的辨識符號，紅色扁圓是紅血球；畫面故意放大符號，並非真實比例或濃度。細胞的表情只是擬人化裝飾。','Yellow stars identify hormones and red discs represent red cells. Symbols are enlarged and do not show actual scale or concentration. Faces are decoration only.')}),draw:drawMessenger},
 {id:'glucose',title:P('血糖不是越高越好','Glucose needs balance'),sub:P('胰島素與升糖素','Insulin and glucagon'),hook:P('吃完飯和長時間沒有吃東西，身體會送出相同的調節訊息嗎？','After a meal and during fasting, does the body send the same regulatory message?'),body:P('選一個情境，先預測需要哪種激素，再觀察相對血糖變化。模型只表示調節方向，不提供人體血糖數值。','Choose a situation, predict the hormone needed, then observe relative glucose change. The model shows direction, not clinical glucose values.'),closure:P('胰島素使血糖下降；升糖素使血糖上升。兩者協調，有助維持血糖穩定。','Insulin lowers blood glucose; glucagon raises it. Coordinated regulation helps maintain stability.'),reading:P('血糖偏高時，胰島素促進細胞利用或儲存葡萄糖；血糖偏低時，升糖素促進肝臟把儲存的肝糖分解並釋出葡萄糖。不要把肝糖和血糖當成同一個位置的物質，也不要把兩種激素想成互相消滅。畫面時間、數量與基準帶都是教學用相對示意。','When glucose is high, insulin promotes glucose use or storage. When it is low, glucagon promotes breakdown of stored liver glycogen and glucose release. Blood glucose and liver glycogen are not the same location or form. The hormones do not destroy each other. Time, quantities and the reference band are qualitative teaching symbols.'),sources:[],init:()=>({running:true,event:'meal',start:0,predict:'none'}),controls:s=>[choice(P('情境','Situation'),'event',[['meal',P('餐後偏高','High after meal')],['fast',P('空腹偏低','Low during fasting')]]),choice(P('先預測','Predict first'),'predict',[['insulin',P('胰島素','Insulin')],['glucagon',P('升糖素','Glucagon')]]),{label:P('觀察','Observe'),items:[{label:P('重播調節','Replay regulation'),key:'replay',value:true}]}],act(s,k,v){if(k==='event'){s.event=v;s.start=s.elapsed;s.predict='none';}else if(k==='replay')s.start=s.elapsed;else s[k]=v;},explain:s=>({title:s.event==='meal'?P('胰島素：血糖下降','Insulin: glucose decreases'):P('升糖素：血糖上升','Glucagon: glucose increases'),text:s.predict==='none'?P('先選你的預測；血糖回到相對基準時，促使該激素增加的刺激也減弱。','Choose a prediction. As glucose approaches the reference level, the stimulus increasing that hormone weakens.'):P(`${s.predict===(s.event==='meal'?'insulin':'glucagon')?'方向正確':'再想一想'}：激素調節的是血糖的偏差，不是讓血糖無限上升或下降。`,`${s.predict===(s.event==='meal'?'insulin':'glucagon')?'Correct direction':'Think again'}: regulation reduces the imbalance; glucose does not rise or fall without limit.`)}),draw:drawGlucose},
 {id:'growth',title:P('身體變了，不是一瞬間','Change takes time'),sub:P('生長、變態與第二性徵','Growth and development'),hook:P('蝌蚪變成青蛙、毛毛蟲變成蝴蝶，只有「越長越大」而已嗎？','Does a tadpole becoming a frog or a caterpillar becoming a butterfly merely grow bigger?'),body:P('一個階段一個階段比較外形的改變。內分泌協調不只調整當下反應，也參與長期生長與發育。','Compare body form stage by stage. Endocrine coordination contributes to long-term growth as well as short-term adjustments.'),closure:P('生長是大小增加；發育還包含構造與功能改變。激素參與協調，但不是所有變化都只由一種激素決定。','Growth increases size; development also changes structures and functions. Hormones participate, but a single hormone does not explain every change.'),reading:P('人的生長激素、甲狀腺素與性激素參與不同的發育過程。第二性徵不是每個人同時出現，也不需要拿外觀比較成熟程度。動物的變態是生命史中構造與功能的改變；圖片切換只作階段對照，不表示真實發育只需數秒。','Human growth hormone, thyroid hormones and sex hormones contribute to different developmental processes. Secondary sex characteristics appear at different times; appearance should not rank maturity. Metamorphosis changes structures and functions over a life cycle. Picture changes compare stages, not development completed in seconds.'),sources:[],init:()=>({running:true,animal:'frog',stage:-1}),act(s,k,v){s[k]=v;if(k==='animal')s.stage=-1;},controls:s=>[choice(P('動物','Animal'),'animal',[['frog',P('蛙','Frog')],['butterfly',P('蝴蝶','Butterfly')]]),choice(P('階段','Stage'),'stage',[[-1,P('連續觀察','Continuous')],...LIFE[s.animal].stages.map((p,i)=>[i,p])])],explain:s=>({title:s.animal==='frog'?P('蛙：卵、蝌蚪到成蛙','Frog: eggs, tadpole, adult'):P('蝴蝶：卵、幼蟲、蛹、成蟲','Butterfly: egg, larva, pupa, adult'),text:P('比較外形、移動與生活環境；這裡不把圖片切換速度當作發育所需時間。','Compare body form, movement and habitat. Picture switching speed does not represent development time.')}),draw:drawGrowth},
 {id:'compare',title:P('兩套訊息一起協調','Two systems cooperate'),sub:P('神經與內分泌比較','Nervous and endocrine systems'),hook:P('神經一定快、激素一定慢嗎？遇到緊急狀況，腎上腺素就能很快參與。','Must nerves always be fast and hormones always slow? Adrenaline can contribute quickly in emergencies.'),body:P('比較傳訊方式與常見時間尺度，不把「通常」背成「永遠」。','Compare delivery methods and typical timescales; do not turn “usually” into “always”.'),closure:P('神經傳訊沿特定路徑；內分泌由血液運送激素。兩者能一起維持協調。','Nervous signals follow specific pathways; endocrine hormones travel in blood. The systems work together.'),sources:[],init:()=>({running:true,mode:'nerve'}),controls:s=>[choice(P('系統','System'),'mode',[['nerve',P('神經','Nervous')],['hormone',P('內分泌','Endocrine')]])],explain:s=>({title:s.mode==='nerve'?P('沿神經傳導與整合','Signals relayed and integrated along nerves'):P('激素隨血液運送','Hormones carried in blood'),text:P('神經反應通常較快、作用時間較短；內分泌影響常較持久，但依激素與反應而異。播放速度不代表真實快慢。','Neural responses are often faster and shorter; endocrine effects often last longer, but hormones and responses vary. Playback speed does not compare real speeds.')}),draw:drawCompare}
];
B.register({id:'endocrine',title:P('內分泌：血液裡的協調訊息','Endocrine signals: coordination through blood'),subtitle:P('小腺體分泌激素，隨血液把訊息送到全身','Small glands release hormones that blood carries everywhere'),cover:'assets/covers/biology_endocrine_1009_v1.jpg',tabs});
})();

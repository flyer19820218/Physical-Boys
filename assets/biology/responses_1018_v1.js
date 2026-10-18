/* Responses in animals and plants · teacher-requested V5 remake, 2026-10-18.
 * Same six tabs, hooks, closures, readings, records and controls as responses_1009_v1.js.
 * Pictures are the teacher's Gemini AI teaching illustrations (see responses_ai_1018/sources.md);
 * seedlings, auxin, roots, tendrils and boxes are drawn here. The box investigation keeps the
 * original textbook photos as evidence. Times and sizes are teaching models, not measurements.
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

// ── pictures ───────────────────────────────────────────────────────────────
const PICS={};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
const R_DIR='assets/biology/responses_ai_1018/',BOOK='assets/biology/ch5_coordination_1009_v1/';
function fitPic(c,path,bx,by,bw,bh,alpha=1,cover=false){
  const im=pic(path);if(!im)return null;const f=cover?Math.max:Math.min,k=f(bw/im.naturalWidth,bh/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k,x=bx+(bw-w)/2,y=by+(bh-h)/2;
  c.save();if(cover){c.beginPath();c.roundRect(bx,by,bw,bh,14);c.clip();}c.globalAlpha=alpha;c.drawImage(im,x,y,w,h);c.restore();return(px,py)=>[x+px*k,y+py*k];
}
const AUXIN='#c084fc',STEM='#7fb85a',STEM_DARK='#3f7a34',CELL_A='#b9e39a',CELL_B='#94cf74';
function leafShape(c,x,y,len,ang,fill='#6fae4b'){
  c.save();c.translate(x,y);c.rotate(ang);const g=c.createLinearGradient(0,-len*.3,len,len*.3);g.addColorStop(0,'#a8dc7e');g.addColorStop(1,fill);
  c.beginPath();c.moveTo(0,0);c.bezierCurveTo(len*.3,-len*.42,len*.78,-len*.34,len,0);c.bezierCurveTo(len*.78,len*.34,len*.3,len*.42,0,0);c.closePath();c.fillStyle=g;c.fill();c.strokeStyle=STEM_DARK;c.lineWidth=2;c.stroke();
  line(c,[[2,0],[len*.92,0]],'rgba(63,122,52,.7)',1.6);c.restore();
}
function sun(c,x,y,t,r=30){glow(c,x,y,r*3.2,C.yellow,.45+.08*Math.sin(t*3));for(let i=0;i<12;i++){const a=i*TAU/12+t*.2;line(c,[[x+Math.cos(a)*(r+8),y+Math.sin(a)*(r+8)],[x+Math.cos(a)*(r+18),y+Math.sin(a)*(r+18)]],C.yellow,3.5);}D.sphere(c,x,y,r,C.yellow);}
function rays(c,from,to,t,n=5,spread=40){c.save();c.setLineDash([12,10]);c.lineDashOffset=-t*40;for(let i=0;i<n;i++){const k=(i-(n-1)/2)/((n-1)/2||1),dx=to[0]-from[0],dy=to[1]-from[1],L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L;line(c,[[from[0]+nx*k*spread*.3,from[1]+ny*k*spread*.3],[to[0]+nx*k*spread,to[1]+ny*k*spread]],rgba(C.yellow,.55),3);}c.restore();}
function steps(c,names,cur,x,y,w,h,color){names.forEach((p,k)=>{const yy=y+k*(h+18);if(k)arrow(c,x+w/2,yy-16,x+w/2,yy-2,k<=cur?color:C.edge,3.5);node(c,p,x,yy,w,h,k===cur,color);});}

// ── Tab 1: animal behaviour ────────────────────────────────────────────────
const animalExamples=[
 {name:P('飛蛾趨向燈光','Moths approach light'),file:null,answer:'innate',text:P('依課本例子，飛蛾趨光不需要先經過個別訓練，屬先天性行為。不是所有動物的所有行為都只能靠先天。','In the textbook example, moth light-seeking does not require individual training and is innate. This does not mean every animal behavior is innate.')},
 {name:P('黑猩猩用工具取食','Chimpanzees use tools'),file:R_DIR+'chimp_termites.jpg',answer:'learned',text:P('課本以黑猩猩學習用細枝取食為例；經驗與練習會影響學習行為。先天因素與學習也可能一起影響實際行為。','The textbook uses chimpanzees learning to use twigs for feeding. Experience affects learned behavior. Innate factors and learning can both influence real behavior.')},
 {name:P('人練習作畫','People practise painting'),file:R_DIR+'painting_hands.jpg',answer:'learned',text:P('作畫的技巧可經觀察、練習與經驗改善，是學習行為的例子。','Painting skills can improve through observation, practice and experience: an example of learned behavior.')}
];
function moth(c,x,y,s,ang,flap){
  c.save();c.translate(x,y);c.rotate(ang);
  for(const side of [-1,1]){c.save();c.scale(1,side);c.rotate(-.25-flap*.55);const g=c.createLinearGradient(0,0,0,-s*1.6);g.addColorStop(0,'#c9b48a');g.addColorStop(1,'#8a7656');
    c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-s*.4,-s*1.1,s*.9,-s*1.7,s*1.2,-s*.7);c.bezierCurveTo(s*.9,-s*.25,s*.4,-s*.05,0,0);c.fillStyle=g;c.fill();c.strokeStyle='#5d4c33';c.lineWidth=1.4;c.stroke();
    circle(c,s*.62,-s*.82,s*.13,'#5d4c33');c.restore();}
  ellipse(c,0,0,s*.75,s*.2,'#6b5a3e','#3d3122',1.4);line(c,[[s*.7,-s*.06],[s*1.2,-s*.4]],'#3d3122',1.3);line(c,[[s*.7,s*.06],[s*1.2,s*.4]],'#3d3122',1.3);
  c.restore();
}
function drawMothScene(c,t){
  c.save();c.beginPath();c.roundRect(30,40,560,500,16);c.clip();
  const g=c.createRadialGradient(310,250,10,310,250,420);g.addColorStop(0,'#3b4a3c');g.addColorStop(1,'#08130f');c.fillStyle=g;c.fillRect(30,40,560,500);
  for(let i=0;i<40;i++){const x=40+(i*137)%540,y=50+(i*71)%200;circle(c,x,y,1.2+(i%3)*.5,rgba(C.white,.25+.25*Math.sin(t*2+i)));}
  line(c,[[310,40],[310,190]],'#3a3a3a',5);D.round(c,292,186,36,28,6,'#6a6f6c','#2c302e');
  glow(c,310,250,200,C.yellow,.55+.05*Math.sin(t*9));
  c.beginPath();c.moveTo(310,214);c.bezierCurveTo(250,230,262,300,288,312);c.lineTo(332,312);c.bezierCurveTo(358,300,370,230,310,214);c.closePath();
  const bg=c.createRadialGradient(305,262,6,310,262,70);bg.addColorStop(0,'#fffbe0');bg.addColorStop(1,'#fde047');c.fillStyle=bg;c.fill();
  for(let k=0;k<5;k++){const ph=k*1.37,r=70+k*26+18*Math.sin(t*.9+ph),a=t*(1.1+k*.18)+ph,x=310+Math.cos(a)*r*1.2,y=262+Math.sin(a)*r*.62;moth(c,x,y,15+(k%2)*3,a+Math.PI/2,Math.abs(Math.sin(t*22+k)));}
  c.restore();D.round(c,30,40,560,500,16,null,C.edge);
}
function drawAnimal(c,s,t){
  const q=animalExamples[s.example];
  if(q.file){fitPic(c,q.file,30,40,560,500,1,true);D.round(c,30,40,560,500,16,null,C.edge);}else drawMothScene(c,t);
  text(c,P('AI 教學插圖（非實拍）','AI teaching illustration (not a photo)'),40,568,22,C.muted);
  panel(c,610,40,330,500);
  wrap(c,q.name,632,88,290,28,C.yellow);
  wrap(c,P('需要個別的經驗與練習，才會這樣做嗎？','Does it need individual experience and practice?'),632,160,290,24,C.white);
  if(s.answer==='none'){text(c,P('先在上方選「先天性」或「學習」','Choose “Innate” or “Learned” above'),775,330,22,C.cyan,'center');return;}
  const ok=s.answer===q.answer,kind=q.answer==='innate',col=kind?C.green:C.cyan;
  D.round(c,632,250,286,180,16,rgba(col,.14),col);
  text(c,ok?'✓':'?',775,318,56,ok?col:C.orange,'center');
  text(c,ok?(kind?P('先天性行為','Innate behavior'):P('學習行為','Learned behavior')):P('再想一想','Think again'),775,372,30,ok?col:C.orange,'center');
  text(c,ok?(kind?P('不需要先學','No learning needed'):P('經驗與練習影響','Shaped by experience')):P('它需要先學嗎？','Must it be learned?'),775,410,22,C.white,'center');
}

// ── Tab 2: phototropism — light makes auxin uneven, the shaded side elongates more ──
const LIGHT_POS={'-1':[90,150],'0':[300,80],'1':[540,150]},BASE=[300,490],SEG=12,STEM_W=46;
function stemGeometry(L,theta){
  const w=[];for(let i=0;i<SEG;i++)w.push(Math.pow((i+1)/SEG,1.3));const sum=w.reduce((a,b)=>a+b,0);
  const pts=[[...BASE]],heads=[];let h=-Math.PI/2,acc=0;const l=L/SEG;
  for(let i=0;i<SEG;i++){acc+=w[i]/sum;const hi=-Math.PI/2+theta*(acc-w[i]/sum/2);heads.push(hi);const p=pts[i];pts.push([p[0]+Math.cos(hi)*l,p[1]+Math.sin(hi)*l]);}
  const norms=pts.map((_,i)=>{const hA=heads[Math.max(0,i-1)],hB=heads[Math.min(SEG-1,i)],hh=(hA+hB)/2;return[Math.sin(hh),-Math.cos(hh)];});
  return{pts,heads,norms};
}
function lightTimeline(s){const tt=Math.max(0,s.elapsed-s.start);return{tt,shift:s.light===0?0:ease(clamp((tt-.8)/2.6)),grow:ease(clamp((tt-2.2)/10)),bend:s.light===0?0:ease(clamp((tt-3.4)/9))};}
function drawSeedling(c,s,t){
  const {tt,shift,grow,bend}=lightTimeline(s),dir=s.light,L=150+220*grow,theta=dir*1.0*bend,G=stemGeometry(L,theta),{pts,norms}=G,hw=STEM_W/2;
  // light
  const lp=LIGHT_POS[String(dir)],tip=pts[SEG];sun(c,lp[0],lp[1],t,28);rays(c,lp,[ (tip[0]+pts[SEG/2][0])/2,(tip[1]+pts[SEG/2][1])/2],t,5,70);
  // pot and soil
  c.beginPath();c.moveTo(210,500);c.lineTo(390,500);c.lineTo(370,578);c.lineTo(230,578);c.closePath();const pg=c.createLinearGradient(210,0,390,0);pg.addColorStop(0,'#9a5a36');pg.addColorStop(.4,'#c9774a');pg.addColorStop(1,'#8a4f2f');c.fillStyle=pg;c.fill();c.strokeStyle=C.ink;c.lineWidth=3;c.stroke();
  ellipse(c,300,500,92,14,'#4a3424',C.ink,3);
  // cells: each segment holds a cell on each side; the outer side of a bend is drawn longer by the geometry itself
  const side=(i,sg)=>[pts[i][0]+norms[i][0]*hw*sg,pts[i][1]+norms[i][1]*hw*sg];
  const shaded=dir; // +1 = the normal side (left of travel) is shaded when light comes from the right
  for(let i=0;i<SEG;i++)for(const sg of [1,-1]){
    const a=side(i,sg),b=side(i+1,sg),q=pts[i+1],p=pts[i],isShade=dir!==0&&sg===shaded;
    c.beginPath();c.moveTo(...p);c.lineTo(...a);c.lineTo(...b);c.lineTo(...q);c.closePath();
    c.fillStyle=isShade?(i%2?'#c6ee9f':'#b4e48a'):(i%2?CELL_A:CELL_B);c.fill();c.strokeStyle='rgba(47,96,40,.85)';c.lineWidth=1.6;c.stroke();
    const m=[(p[0]+a[0]+b[0]+q[0])/4,(p[1]+a[1]+b[1]+q[1])/4];circle(c,m[0],m[1],2.6,'rgba(63,122,52,.55)');
  }
  line(c,pts.map((_,i)=>side(i,1)),STEM_DARK,3);line(c,pts.map((_,i)=>side(i,-1)),STEM_DARK,3);
  // apex with two young leaves
  const ht=G.heads[SEG-1];circle(c,tip[0],tip[1],hw*.9,'#9fd77a',STEM_DARK,3);
  leafShape(c,tip[0],tip[1],46,ht-.75);leafShape(c,tip[0],tip[1],46,ht+.75);
  // auxin: made at the tip, carried down; it gathers on the shaded side when light is one-sided
  for(let k=0;k<30;k++){const u=mod(t*.09+k/30),f=1-u,idx=f*SEG,i=Math.min(SEG-1,Math.floor(idx)),r=idx-i,
    cx=mix(pts[i][0],pts[i+1][0],r),cy=mix(pts[i][1],pts[i+1][1],r),n=norms[i],even=((k*.618)%1-.5)*1.5,lat=mix(even,shaded*(.35+.5*((k*.37)%1)),shift)*hw*.85;
    if(u<.04)continue;circle(c,cx+n[0]*lat,cy+n[1]*lat,4.6,AUXIN,'#4c1d95',1.2);}
  glow(c,tip[0],tip[1],30,AUXIN,.35+.2*Math.sin(t*4));
  // labels on the two sides once the bend shows
  if(dir!==0&&bend>.25){const i=Math.floor(SEG*.55),sh=side(i,shaded),li=side(i,-shaded),out=[shaded*norms[i][0],shaded*norms[i][1]];
    const shX=sh[0]+out[0]*30,lX=li[0]-out[0]*30;
    pill(c,P('背光側：生長素多，細胞伸長多','Shaded side: more auxin, longer cells'),dir>0?40:600,250,{size:22,color:C.pink,anchor:sh,maxX:610});
    pill(c,P('向光側：伸長少','Lit side: less growth'),dir>0?420:40,430,{size:22,color:C.yellow,anchor:li,maxX:610});}
  legend(c,[[AUXIN,P('紫點＝生長素（放大示意）','Purple dots = auxin (symbol)')]],40,56,400);
  return{tt,dir};
}
function drawLight(c,s,t){
  panel(c,20,20,600,580-20);
  const {tt,dir}=drawSeedling(c,s,t);
  panel(c,640,20,300,560);
  fitPic(c,R_DIR+'seedling_pot.png',652,34,276,130);
  wrap(c,P('生活中：窗邊的植物彎向光（AI 插圖）','Windowsill plant bends to light (AI)'),655,190,270,22,C.muted);
  const names=dir===0?[P('光從上方照射','Light from above'),P('生長素平均分布','Auxin stays even'),P('兩側伸長一樣多','Both sides elongate equally'),P('莖直直往上長','The shoot grows straight')]
    :[P('單側光照射','Light from one side'),P('生長素移到背光側','Auxin moves to the shaded side'),P('背光側細胞伸長較快','Shaded-side cells elongate faster'),P('莖彎向光','The shoot bends to light')];
  const cur=tt<1.2?0:tt<3.6?1:tt<8?2:3;
  steps(c,names,cur,655,258,270,62,dir===0?C.green:AUXIN);
}

// ── Tab 3: gravitropism, a clear pot lying on its side ─────────────────────
function curvePath(start,h0,h1,len,n=16){const pts=[[...start]];for(let i=0;i<n;i++){const u=(i+.5)/n,h=mix(h0,h1,Math.pow(u,1.4)),p=pts[i];pts.push([p[0]+Math.cos(h)*len/n,p[1]+Math.sin(h)*len/n]);}return pts;}
function drawGravity(c,s,t){
  const p=s.stage==='initial'?0:s.stage==='later'?1:ease(clamp((t-s.start)/11));
  panel(c,20,20,600,560);
  arrow(c,64,150,64,430,C.cyan,7);text(c,P('引力','Gravity'),64,130,26,C.cyan,'center');text(c,P('向下','down'),64,470,22,C.cyan,'center');
  const GX=-200;c.save();c.translate(GX,0);
  // the pot lies on its side, opening to the right; its wall is see-through
  const PT=[[340,260],[580,240],[580,420],[340,400]];
  c.save();c.beginPath();c.moveTo(...PT[0]);PT.slice(1).forEach(q=>c.lineTo(...q));c.closePath();c.fillStyle='rgba(120,90,60,.55)';c.fill();c.restore();
  for(let i=0;i<60;i++){const x=350+(i*53)%220,y=268+(i*37)%126;circle(c,x,y,2.2,'rgba(40,26,16,.5)');}
  // roots (inside the soil): grew toward the pot bottom, then turn downward
  const roots=[[0,0,1],[8,-34,.75],[-10,30,.7],[4,58,.55]];
  for(const [dx,dy,k] of roots){const st=[548+dx,330+dy];const old=[[548+dx,330+dy],[548+dx-90*k,330+dy+4]];c.save();c.setLineDash([6,6]);if(p>0)line(c,old,'rgba(242,236,217,.35)',3);c.restore();
    const path=curvePath(st,Math.PI,Math.PI-1.45*p*(k>.6?1:.9),110*k+40*p*k);line(c,path,'#f3e3c0',6*k+2);for(let j=3;j<path.length;j+=3){const q=path[j];line(c,[q,[q[0]-6,q[1]+9]],'#f3e3c0',1.5);}}
  c.save();c.beginPath();c.moveTo(...PT[0]);PT.slice(1).forEach(q=>c.lineTo(...q));c.closePath();c.strokeStyle='rgba(220,240,255,.85)';c.lineWidth=4;c.stroke();
  const gl=c.createLinearGradient(0,240,0,420);gl.addColorStop(0,'rgba(220,240,255,.22)');gl.addColorStop(.3,'rgba(220,240,255,.04)');gl.addColorStop(1,'rgba(220,240,255,.12)');c.fillStyle=gl;c.fill();c.restore();
  ellipse(c,580,330,16,92,'rgba(220,240,255,.08)','rgba(220,240,255,.9)',4);
  // shoot leaves the opening horizontally, then curves upward
  const sp=curvePath([585,318],0,-1.5*p,150+60*p);
  c.save();c.setLineDash([6,6]);if(p>0)line(c,[[585,318],[735,318]],'rgba(242,236,217,.35)',3);c.restore();
  line(c,sp,STEM_DARK,12);line(c,sp,STEM,8);const tip=sp[sp.length-1],th=Math.atan2(tip[1]-sp[sp.length-3][1],tip[0]-sp[sp.length-3][0]);
  leafShape(c,tip[0],tip[1],50,th-.7);leafShape(c,tip[0],tip[1],50,th+.7);
  leafShape(c,sp[6][0],sp[6][1],40,th-1.6+.6*(1-p));
  text(c,P('透明花盆（教學示意）','Clear pot (teaching model)'),460,230,22,C.muted,'center');
  c.restore();
  pill(c,P('莖：向上長（負向地性）','Shoot: up (negative)'),300,60,{size:22,color:C.green,active:p>.4,anchor:[tip[0]+GX-10,tip[1]+20],maxX:610});
  pill(c,P('根：向下長（正向地性）','Root: down (positive)'),150,500,{size:22,color:'#f3e3c0',active:p>.4,anchor:[470+GX,440],maxX:610});
  if(p>0)text(c,P('虛線＝剛側放時的方向','Dashed = first direction'),610,568,22,C.muted,'right');
  panel(c,640,20,300,560);
  fitPic(c,R_DIR+'pot_sideways.png',650,40,280,170);
  wrap(c,P('側放一段時間後的盆栽（AI 插圖）','A pot left on its side for a while (AI picture)'),655,240,270,22,C.muted);
  wrap(c,P('根：朝引力方向生長','Roots: with gravity'),655,330,270,24,'#f3e3c0');
  wrap(c,P('莖：背著引力生長','Shoots: against gravity'),655,400,270,24,C.green);
  wrap(c,P('正、負不是好壞，而是和引力同向或反向','Positive / negative = with or against gravity, not good or bad'),655,470,270,22,C.cyan);
}

// ── Tab 4: thigmotropism — contact slows growth on the touching side ─────────
const STAKE_X=420,ST_R=18,TBASE=[150,470],TC=[250,280],TQ=[STAKE_X-ST_R-2,300];
function bez(u,a=TBASE,b=TC,q=TQ){const v=1-u;return[v*v*a[0]+2*v*u*b[0]+u*u*q[0],v*v*a[1]+2*v*u*b[1]+u*u*q[1]];}
function drawTendril(c,s,t){
  const tt=Math.max(0,t-s.start),reach=ease(clamp(tt/4)),coil=s.support?ease(clamp((tt-4)/8)):0,touched=s.support&&tt>=4;
  panel(c,20,20,600,560);
  // vine with a leaf
  const vine=[[70,590],[95,520],[130,480],[150,470],[175,420],[200,330],[215,200],[220,60]];line(c,vine,STEM_DARK,14);line(c,vine,STEM,10);
  leafShape(c,200,330,90,-.3,'#6fae4b');leafShape(c,175,420,80,-2.7,'#6fae4b');
  // stake (drawn behind the front half of the coils)
  if(s.support){D.round(c,STAKE_X-ST_R,40,ST_R*2,540,8,'#c9a96e','#7a6340');for(let y=110;y<580;y+=120)line(c,[[STAKE_X-ST_R,y],[STAKE_X+ST_R,y]],'#7a6340',3);}
  // free part of the tendril: searches by sweeping, more at the tip
  const sway=(1-(touched?1:0))*(1-reach*.6),gmax=s.support?mix(.25,1,reach):mix(.25,1.25,reach),pts=[];
  for(let i=0;i<=30;i++){const u=i/30*gmax,base=bez(Math.min(u,1)),over=Math.max(0,u-1),q=[base[0]+over*260,base[1]-over*40],a=Math.sin(t*1.6+u*3)*28*u*u*(touched?0:sway+.25);pts.push([q[0]-a*.55,q[1]+a]);}
  // after contact the free part tightens into a gentle spring
  if(touched)for(let i=4;i<pts.length-2;i++){const u=i/30;pts[i][1]+=Math.sin(u*Math.PI*6)*7*coil;pts[i][0]+=Math.cos(u*Math.PI*6)*4*coil;}
  const coilPts=[];if(touched){const turns=4.2*coil,n=Math.max(2,Math.round(turns*24));for(let i=0;i<=n;i++){const a=i/n*turns*TAU;coilPts.push([STAKE_X-Math.cos(a)*(ST_R+5),TQ[1]-a*7.5,Math.sin(a)]);}}
  for(let i=1;i<coilPts.length;i++)if(coilPts[i][2]<0)line(c,[coilPts[i-1],coilPts[i]],'#4f8a3a',7);
  line(c,pts,STEM_DARK,9);line(c,pts,'#9fd77a',6);
  if(s.support){for(let i=1;i<coilPts.length;i++)if(coilPts[i][2]>=0){line(c,[coilPts[i-1],coilPts[i]],STEM_DARK,9);line(c,[coilPts[i-1],coilPts[i]],'#9fd77a',6);}}
  const tipP=coilPts.length?coilPts[coilPts.length-1]:pts[pts.length-1];
  if(!touched)glow(c,tipP[0],tipP[1],26,C.yellow,.35+.2*Math.sin(t*5));
  if(touched&&coil<.2)glow(c,TQ[0],TQ[1],46,C.orange,.6*(1-coil*5));
  pill(c,touched?P('碰到支架，開始纏繞','Contact: coiling begins'):s.support?P('捲鬚尖端左右擺動、尋找支撐','The tip sweeps, searching'):P('沒有支架：繼續擺動','No support: keeps sweeping'),300,520,{size:22,active:true,color:touched?C.orange:C.yellow,maxX:610});
  // right: real-looking reference and a close-up of the cells
  panel(c,640,20,300,560);
  fitPic(c,R_DIR+'tendril_stake.png',650,32,280,156);
  text(c,P('絲瓜捲鬚纏繞竹竿（AI 插圖）','Tendril on bamboo (AI)'),790,210,22,C.muted,'center');
  drawContactZoom(c,790,372,112,touched?coil:0,s.support,t);
}
function drawContactZoom(c,cx,cy,R,coil,support,t){
  c.save();c.beginPath();c.arc(cx,cy,R,0,TAU);c.fillStyle='#0f221c';c.fill();c.clip();
  const span=mix(.05,3.4,coil),r0=30,mid=50,r1=72,n=6,a0=-Math.PI/2-span/2;
  if(support)circle(c,cx,cy+(1-coil)*0,r0-6,'#c9a96e','#7a6340',2);
  if(coil<.02){// straight band: two rows of equal cells
    for(let row=0;row<2;row++)for(let i=0;i<n;i++){const x=cx-90+i*30,y=cy-62+row*20;D.round(c,x,y,30,20,3,row?CELL_A:'#c6ee9f',STEM_DARK);}
  }else{
    for(let row=0;row<2;row++){const ra=row?mid:r0,rb=row?r1:mid;for(let i=0;i<n;i++){const aa=a0+span*i/n,ab=a0+span*(i+1)/n;c.beginPath();c.arc(cx,cy,rb,aa,ab);c.arc(cx,cy,ra,ab,aa,true);c.closePath();c.fillStyle=row?'#c6ee9f':CELL_B;c.fill();c.strokeStyle=STEM_DARK;c.lineWidth=1.6;c.stroke();}}
  }
  c.restore();circle(c,cx,cy,R,null,C.yellow,4);
  text(c,P('放大：捲鬚的細胞','Close-up: tendril cells'),cx,cy-R-14,22,C.yellow,'center');
  if(coil<.02){wrap(c,support?P('還沒碰到：兩側伸長差不多','Not touching: both sides alike'):P('沒有接觸刺激','No contact stimulus'),cx-R+4,cy+R+34,2*R-8,22,C.white);}
  else{text(c,P('外側：伸長多','Outer: elongates more'),cx,cy+R+32,22,C.pink,'center');text(c,P('接觸側：伸長少','Contact side: less'),cx,cy+R+60,22,C.cyan,'center');
    circle(c,cx,cy-r0+10,4,C.cyan);circle(c,cx,cy-r1+6,4,C.pink);}
}

// ── Tab 5: touch, sleep and trap movements ─────────────────────────────────
const NASTIC={
  mimosa:{open:'mimosa_open.png',closed:'mimosa_closed.png',steps:[P('碰觸刺激','Touch'),P('葉枕細胞失水','Pulvinus cells lose water'),P('膨壓下降、支撐變小','Turgor drops'),P('小葉閉合、葉柄下垂','Leaflets fold, stalk droops')]},
  oxalis:{open:'oxalis_day.png',closed:'oxalis_night.png',steps:[P('白天：光照','Day: light'),P('小葉展開','Leaflets open'),P('夜晚：光變暗','Night: darkness'),P('小葉下垂合起','Leaflets fold down')]},
  flytrap:{open:'flytrap_open.png',closed:'flytrap_closed.png',steps:[P('昆蟲碰觸感應毛','An insect touches trigger hairs'),P('葉片細胞迅速改變','Leaf cells change quickly'),P('兩片葉迅速閉合','The two lobes snap shut'),P('邊緣刺毛交錯','Bristles interlock')]}
};
function drawNastic(c,s,t){
  const N=NASTIC[s.plant],p=ease(clamp((t-s.start)/(s.plant==='flytrap'?.5:1.6))),k=s.closed?p:1-p;
  panel(c,20,20,600,560);
  if(s.plant==='oxalis'){const day=1-k;c.save();c.beginPath();c.roundRect(20,20,600,560,16);c.clip();c.fillStyle=rgba('#0b1a15',.55*k);c.fillRect(20,20,600,560);c.restore();
    if(day>.5)sun(c,560,80,t,24);else{circle(c,560,80,24,'#f2ecd9');circle(c,570,72,22,'#1a3029');for(let i=0;i<8;i++)circle(c,60+i*60,60+(i*37)%80,2,rgba(C.white,.6));}}
  fitPic(c,R_DIR+N.open,40,60,560,440,1-k);fitPic(c,R_DIR+N.closed,40,60,560,440,k);
  if(s.plant!=='oxalis')D.hit(40,60,560,440,'closed',!s.closed);
  if(s.plant==='mimosa'&&!s.closed){const x=260+Math.sin(t*2)*6;text(c,'👆',x,250,40,C.white,'center');}
  text(c,s.plant==='oxalis'?P('切換上方的白天／夜晚狀態','Switch day / night above'):P('點一下植物，或切換上方狀態','Tap the plant, or switch above'),320,560,22,C.cyan,'center');
  panel(c,640,20,300,560);
  text(c,P('發生了什麼？','What happens?'),790,66,26,C.yellow,'center');
  const cur=s.closed?Math.min(3,Math.floor(p*3.99)):s.plant==='oxalis'?1:-1;
  steps(c,N.steps,cur,655,96,270,86,C.green);
  text(c,P('AI 插圖（非實拍）','AI pictures (not photos)'),790,568,22,C.muted,'center');
}

// ── Tab 6: the box investigation (original textbook photos kept) ────────────
function drawBox(c,x,y,w,h,open,t){
  D.round(c,x,y,w,h,8,'#6b5236','#3d2e1f');
  c.fillStyle='#14100b';c.fillRect(x+8,y+8,w-16,h-16);
  const gap=open==='top'?[x+w/2-24,y,48,10]:open==='bottom'?[x+w/2-24,y+h-10,48,10]:[x+w-10,y+h/2-20,10,40];
  c.fillStyle='#fef9c3';c.fillRect(...gap);
  const from=open==='top'?[x+w/2,y-22]:open==='bottom'?[x+w/2,y+h+22]:[x+w+36,y+h/2],to=[x+w/2,y+h-26];
  c.save();c.globalAlpha=.8;rays(c,from,[gap[0]+gap[2]/2,gap[1]+gap[3]/2],t,3,10);c.restore();
  ellipse(c,x+w/2,y+h-20,w*.32,8,'#e7e5e4','#57534e',2);
  for(let i=0;i<5;i++){const sx=x+w/2-28+i*14;line(c,[[sx,y+h-22],[sx,y+h-40]],'#d9f99d',2.5);circle(c,sx,y+h-41,2.5,'#bef264');}
}
function drawBoxes(c,s,t){
  const photos={1:['Im4289.png','Im4290.png','Im4291.png'],5:['Im4292.png','Im4293.png','Im4294.png'],7:['Im4295.png','Im4296.png','Im4297.png']}[s.day];
  const names=[P('開口朝上','Opening above'),P('開口朝下','Opening below'),P('開口朝側面','Side opening')],opens=['top','bottom','side'];
  for(let i=0;i<3;i++){const x=24+i*312;
    text(c,names[i],x+148,40,24,C.yellow,'center');
    drawBox(c,x+74,70,150,110,opens[i],t);
    D.round(c,x,210,296,224,12,'#faf7eb');fitPic(c,BOOK+photos[i],x+8,216,280,212);
    text(c,P(`課本照片・第 ${s.day} 天`,`Textbook photo · day ${s.day}`),x+148,458,22,C.white,'center');
    node(c,P('種子、水、容器相同','Same seeds, water, box'),x+8,476,280,58,s.variable==='light',C.green);}
  text(c,P('上排是裝置示意；結果只看課本照片，不捏造高度或生長速率','Top row: set-up model. Results come only from the textbook photos'),480,580,22,C.cyan,'center');
}

const tabs=[
 {id:'animal',title:P('出生就會？還是學來？','Born with it, or learned?'),sub:P('動物的行為','Animal behavior'),hook:P('飛蛾朝燈飛、黑猩猩用細枝取食，都需要先上課嗎？','Must moths approaching light and chimpanzees using twigs both be taught first?'),body:P('先觀察情境，再選先天性行為或學習行為；每次選擇都附上理由。','Observe the example, then choose innate or learned behavior. Each choice provides a reason.'),closure:P('先天性行為不需個別學習才出現；學習行為受經驗影響。實際行為也可能兼有兩者。','Innate behavior does not require individual learning; learned behavior depends on experience. Real behavior can involve both.'),sources:[],init:()=>({running:true,example:0,answer:'none'}),controls:s=>[choice(P('情境','Example'),'example',animalExamples.map((q,i)=>[i,q.name])),choice(P('判斷','Classify'),'answer',[['innate',P('先天性','Innate')],['learned',P('學習','Learned')]])],act(s,k,v){s[k]=v;if(k==='example')s.answer='none';},explain:s=>({title:s.answer==='none'?P('先看證據，再判斷','Observe evidence, then decide'):s.answer===animalExamples[s.example].answer?P('判斷正確','Correct classification'):P('再看它需不需要先學','Does it require learning first?'),text:s.answer==='none'?P('圖片只是一個觀察起點；思考行為是否需要個別經驗與練習，再選擇。','The picture is a starting point. Consider whether the behavior requires individual experience and practice.'):animalExamples[s.example].text}),draw:drawAnimal},
 {id:'light',title:P('不會走，怎麼找光？','Finding light without walking'),sub:P('莖的向光性','Shoot phototropism'),hook:P('窗邊的植物偏向光，是整棵移過去，還是兩邊生長不一樣？','Does a plant near a window move its whole body, or grow differently on its two sides?'),body:P('選左側、正上方或右側光源；看光照讓生長素分布不均，背光側細胞伸長較快，莖逐漸彎向光。','Choose light from the left, above or right. Watch light make auxin uneven: shaded-side cells elongate faster, so the shoot gradually bends toward light.'),closure:P('莖的向光性是與光源方向有關的生長反應；不是整棵植物搬家。','Shoot phototropism is directional growth toward light, not relocation of the entire plant.'),reading:P('光刺激會影響植物生長。生長反應通常需要較長時間，動畫把數小時至數天的變化壓縮。單側光照使生長素分布不均，背光側生長素較多、細胞伸長較快，因此莖彎向光；光從正上方照射時兩側差不多，莖就直直生長。植物仍有根、莖和葉，不會為了指向光而把維管束或整株連根扭轉。','Light influences growth over hours to days, compressed here. One-sided light makes auxin uneven: the shaded side has more auxin and its cells elongate faster, so the shoot bends toward light. With light from above both sides are similar and the shoot grows straight. The plant remains rooted; it does not rotate or relocate the whole root system.'),sources:[],init:()=>({running:true,light:1,start:0}),controls:s=>[choice(P('光源','Light source'),'light',[[-1,P('左側','Left')],[0,P('上方','Above')],[1,P('右側','Right')]]),{label:P('生長','Growth'),items:[{label:P('重新長一次','Grow again'),key:'replay',value:true}]}],act(s,k,v){if(k==='light')s.light=v;s.start=s.elapsed;},explain:s=>({title:s.light===0?P('兩側伸長一樣，莖直直長','Equal elongation: the shoot grows straight'):P('背光側長得快，莖彎向光','The shaded side grows faster: the shoot bends to light'),text:P('紫點是生長素的放大示意；模型起始幼苗相同，只改光源方向。播放時間不是實際生長時間，光、水、溫度等也會影響生長。','Purple dots are enlarged auxin symbols. Seedlings start the same and only light direction changes. Playback time is not real growth time; water, temperature and other conditions also matter.')}),draw:drawLight},
 {id:'gravity',title:P('盆栽躺倒了，根往哪？','A sideways pot: where do roots go?'),sub:P('根與莖的向地性','Root and shoot gravitropism'),hook:P('盆栽側放後，根和莖會一起朝同一方向長嗎？','When a pot lies sideways, do its root and shoot grow in the same direction?'),body:P('透明花盆讓你看見土裡的根：比較剛側放與生長後，或播放根向下、莖向上的生長模型。','A clear pot shows the roots in the soil. Compare the model just after placement and after growth, or play its gradual response.'),closure:P('根通常表現正向地性，莖通常表現負向地性；判斷方向要對照地球引力。','Roots usually show positive gravitropism and shoots negative gravitropism, relative to gravity.'),sources:[],init:()=>({running:true,start:0,stage:'growing'}),controls:s=>[choice(P('模型階段','Model stage'),'stage',[['initial',P('剛側放','Just placed sideways')],['growing',P('播放生長','Play growth')],['later',P('生長後','After growth')]]),{label:P('模型','Model'),items:[{label:P('重播生長','Replay growth'),key:'replay',value:true}]}],act(s,k,v){s.stage=k==='replay'?'growing':v;s.start=s.elapsed;},explain:s=>({title:P('根向下，莖向上','Roots downward, shoots upward'),text:P('正、負指生長方向與引力方向相同或相反，不是「好」或「壞」。模型不把既有枝條瞬間搬動，時間經過壓縮。','Positive and negative mean with or against gravity, not good or bad. Existing branches do not instantly relocate; time is compressed.')}),draw:drawGravity},
 {id:'tendril',title:P('碰到支架，就繞上去','Touch a support, then curl'),sub:P('向觸性','Thigmotropism'),hook:P('絲瓜捲鬚沿支架繞圈，是手指抓住，還是接觸刺激改變生長？','Does a loofah tendril grab like a finger, or does contact change its growth?'),body:P('看捲鬚尖端擺動尋找支撐，碰到支架後一圈圈纏繞；右邊放大看兩側細胞伸長的差別。','Watch the tip sweep and search, then coil after contact. The close-up compares cell elongation on the two sides.'),closure:P('向觸性是受接觸方向影響的生長反應；和含羞草迅速閉葉的機制不同。','Thigmotropism is directional growth affected by contact. It differs from the rapid folding mechanism in Mimosa.'),reading:P('捲鬚接觸支架後，接觸側生長較慢、另一側生長較快，捲鬚就彎向支架並纏繞。動畫時間經過壓縮；支架不是把植物吸過去，也不是每種攀緣植物都靠捲鬚。','After contact, the touching side grows more slowly and the other side faster, so the tendril curves around the support. Time is compressed; the support does not attract the plant, and not every climber uses tendrils.'),sources:[],init:()=>({running:true,support:true,start:0}),controls:s=>[choice(P('接觸','Contact'),'support',[[true,P('有支架','Support present')],[false,P('無支架','No support')]]),{label:P('模型','Model'),items:[{label:P('重播生長','Replay growth'),key:'replay',value:true}]}],act(s,k,v){if(k==='support')s.support=v;s.start=s.elapsed;},explain:s=>({title:s.support?P('接觸側長得慢，捲鬚纏繞','The contact side grows slower; the tendril coils'):P('沒有同樣的接觸刺激','No equivalent contact stimulus'),text:P('時間壓縮示意；細胞與捲鬚粗細都放大，不是實際比例。','Time-compressed model; cells and tendril thickness are enlarged, not to scale.')}),draw:drawTendril},
 {id:'nastic',title:P('碰一下，不是長歪了','A touch folds, not bends growth'),sub:P('觸發、睡眠與捕蟲運動','Touch, sleep and trapping movements'),hook:P('含羞草閉起來、酢漿草夜間合葉，和莖慢慢長向光一樣嗎？','Are Mimosa folding and Oxalis closing at night the same as a shoot growing toward light?'),body:P('點選植物，切換展開與合起，右邊看每一步發生了什麼。','Select a plant, switch between open and closed, and follow each step on the right.'),closure:P('這些短時間感應與方向性生長不同；課本以細胞含水量、膨壓變化解釋開合運動。','These shorter responses differ from directional growth. The textbook relates the movements to changes in cell water content and turgor.'),reading:P('含羞草葉枕處的細胞水分改變，使膨壓與支撐改變，小葉閉合、葉柄下垂；恢復需要時間。酢漿草有晝夜相關的睡眠運動。捕蠅草葉片上的感應毛被觸動後可引發閉合；這裡只是開閉階段比較，不把「碰一次就必定捕到」當成規則。不要反覆逗弄植物，會消耗能量。','Changes in water and turgor in the Mimosa pulvinus alter support, folding leaflets and lowering the petiole; recovery takes time. Oxalis exhibits day–night-related sleep movements. Stimulating Venus flytrap trigger hairs can cause closure; the stage comparison does not imply every single touch traps prey. Repeatedly triggering plants wastes energy.'),sources:[],init:()=>({running:true,plant:'mimosa',closed:false,start:-9}),controls:s=>[choice(P('植物','Plant'),'plant',[['mimosa',P('含羞草','Mimosa')],['oxalis',P('酢漿草','Oxalis')],['flytrap',P('捕蠅草','Flytrap')]]),choice(P('狀態','State'),'closed',s.plant==='oxalis'?[[false,P('白天：展開','Day: open')],[true,P('夜晚：合起','Night: closed')]]:[[false,P('展開／恢復','Open / recover')],[true,P('刺激後／合起','Stimulated / closed')]])],act(s,k,v){if(k==='plant'){s.plant=v;s.closed=false;s.start=-9;return;}s[k]=v;s.start=s.elapsed;},explain:s=>({title:s.plant==='mimosa'?P('含羞草：葉枕水分與膨壓改變','Mimosa: water and turgor in the pulvinus'):s.plant==='oxalis'?P('酢漿草：晝夜相關的睡眠運動','Oxalis: day–night sleep movement'):P('捕蠅草：感應後閉合','Flytrap: closure after stimulation'),text:P('動畫是機制示意，時間經過壓縮。植物沒有動物的神經系統。','The animation is a time-compressed model. Plants do not have an animal nervous system.')}),draw:drawNastic},
 {id:'boxes',title:P('只改光從哪裡來','Change only light direction'),sub:P('向光性探究與紀錄','Phototropism investigation'),hook:P('三盒幼苗，如果一盒比較乾、一盒比較熱，還能說差別只來自光線嗎？','If one seedling box is drier and another warmer, can you blame every difference on light direction?'),body:P('依課本設置上方、下方、側方開口。先選操縱變因，再比較原照片並記錄；不捏造實驗數據。','Follow the textbook’s top, bottom and side openings. Choose the manipulated variable, compare original photos, and record observations without invented data.'),closure:P('只改光源方向，控制容器、種子、水與溫度等條件；生長方向是觀察結果。','Change light direction while controlling containers, seeds, water and temperature. Growth direction is an observed outcome.'),record:P('先寫預測：三種開口的幼苗會往哪裡長？再依第 1、5、7 天原照片，記錄生長方向、顏色與可觀察的差異。哪些條件要相同？有哪些仍需要實作才能確認？','Predict growth for each opening. Then use original day 1, 5 and 7 photos to record direction, colour and observable differences. Which conditions must match? What still requires a real experiment?'),reading:P('課本流程：三個相同培養皿各放等量濕潤棉花、約 20 mL 水和 20 顆發芽苜蓿種子。使用同樣大小、不透光的盒子，改變開口朝向；放在同樣的光照環境觀察七天，保持棉花濕潤。不要只看「彎向哪裡」：同時記錄顏色、長度與時間，但沒有尺規的照片不能虛構精確長度。','Textbook setup: identical dishes with equal moist cotton, about 20 mL water and 20 germinated alfalfa seeds each. Use matching opaque boxes with different opening directions, the same light environment, and observe for seven days while keeping cotton moist. Record direction, colour, length and time, but do not invent precise lengths from photos without a ruler.'),sources:[{name:P('光對植物生長的影響','Light and plant growth'),page:148,figure:'探究活動'},{name:P('不同開口的原始觀察照片','Original photos for each opening'),page:149,figure:'第1、5、7天'}],init:()=>({running:true,day:1,variable:'none'}),controls:s=>[choice(P('操縱變因','Manipulated variable'),'variable',[['light',P('光源方向','Light direction')],['water',P('水量','Water amount')],['seeds',P('種子數','Seed count')]]),choice(P('原照片日期','Photo day'),'day',[[1,P('第1天','Day 1')],[5,P('第5天','Day 5')],[7,P('第7天','Day 7')]])],explain:s=>({title:s.variable==='light'?P('只改光源方向，對照才公平','Change only light direction'):s.variable==='none'?P('先選這次要改的條件','Choose the factor to change'):P('這會變成另一個實驗','That would be a different experiment'),text:s.variable==='light'?P('容器、種子數、水與環境等需相同；各照片是課本的觀察，不是程式算出來的結果。','Match containers, seed counts, water and other conditions. These are textbook observations, not computer-generated results.'):P('本次問題是光源方向；若改水量或種子數，就不能把差異都歸因於光。','The question is light direction. Changing water or seed numbers would confound that comparison.')}),draw:drawBoxes}
];
B.register({id:'responses',title:P('動植物的感應：不只有移動','Responses in animals and plants'),subtitle:P('動物行為、植物的方向性生長與開合運動','Animal behavior, directional growth and plant movements'),cover:'assets/covers/biology_responses_1009_v1.jpg',tabs});
})();

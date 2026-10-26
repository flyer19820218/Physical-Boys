/* Animal and human reproduction · teacher-requested V5 remake, 2026-10-19.
 * Same six tabs, hooks, closures, readings and controls as reproduction_humans_1009_v1.js.
 * The sperm–egg micrograph and all animal and egg photographs stay as the textbook's original evidence.
 * The egg section, female organs, female body and fetus pictures are the teacher's Gemini AI teaching
 * illustrations (humans_ai_1019/sources.md). Chromosomes, cells, routes and exchange are drawn models;
 * model time is not biological time, and nothing here is medical or pregnancy advice.
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

const BOOK='assets/biology/ch7_reproduction_1009_v1/',HX='assets/biology/humans_ai_1019/';
const join=ps=>P(ps.map(p=>p[0]).join('\n\n'),ps.map(p=>p[1]).join('\n\n'));
// Chromosome colours follow the cell-division unit: the father's set cyan, the mother's set pink.
const DAD=C.cyan,MOM=C.pink;
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
function rod(c,x,y,L,color,a=1,w=8){c.save();c.globalAlpha=a;sline(c,[[x,y-L/2],[x,y+L/2]],C.ink,w+4);sline(c,[[x,y-L/2],[x,y+L/2]],color,w);c.restore();}
function steps(c,names,cur,x,y,w,h=42,gap=8,color=C.yellow){names.forEach((p,i)=>{const yy=y+i*(h+gap);D.round(c,x,yy,w,h,10,i===cur?color:'rgba(11,26,21,.6)',i===cur?C.white:C.edge);text(c,`${i+1}. ${D.tr(p)}`,x+12,yy+h/2+8,22,i===cur?C.deep:C.white);});}
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*22,null,rgba(color,.9*(1-u)),3);circle(c,x,y,6,color,C.ink,2);}
// A stage clock: loops through n stages, or eases into a held stage.
function stageClock(s,t,n,per=3){
  if(s.phase>=0)return{k:s.phase,u:ease((t-(s.start||0))/1.6),held:true};
  const q=mod(t-(s.start||0),n*per)/per;return{k:Math.floor(q),u:q%1,held:false};
}
function sperm(c,x,y,ang,t,s=1,col=DAD){c.save();c.translate(x,y);c.rotate(ang);c.beginPath();for(let i=0;i<=16;i++){const u=i/16,xx=-8*s-u*44*s,yy=Math.sin(u*9-t*16)*5*s*u;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle='rgba(242,236,217,.9)';c.lineWidth=2*s;c.stroke();ellipse(c,0,0,10*s,6.5*s,'#f2ecd9',col,2);c.restore();}
function eggCell(c,x,y,r,glowA=0){if(glowA)glow(c,x,y,r*1.6,C.pink,glowA);circle(c,x,y,r+5,'rgba(244,114,182,.12)','rgba(244,114,182,.5)',2);circle(c,x,y,r,'#f6e3c9','#c9a77a',2.5);}
function embryo(c,x,y,n,R){if(n<=1){eggCell(c,x,y,R);return;}const rr=n<=2?R*.62:n<=4?R*.5:R*.4;
  const pos=n<=2?[[-.42,0],[.42,0]]:n<=4?[[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]]:[[-.5,-.3],[0,-.5],[.5,-.3],[-.55,.2],[0,0],[.55,.2],[-.25,.55],[.3,.55]];
  circle(c,x,y,R+4,'rgba(244,114,182,.12)','rgba(244,114,182,.5)',2);pos.forEach(([a,b])=>circle(c,x+a*R,y+b*R,rr,'#f6e3c9','#c9a77a',2));}

// ── Tab 1: gametes carry one set; fertilization restores two ───────────────
const cycleNames=[P('親代的生殖母細胞','Parental germ cells'),P('形成單套配子','Haploid gametes'),P('配子結合','Gametes unite'),P('受精卵為雙套','Diploid zygote'),P('分裂、發育成子代','Divide and develop')];
const cycleText=[
 P('親代的生殖母細胞具有雙套染色體。這裡只畫兩對，代表相同種類的染色體成對，不是人類只有四條染色體。','Parental germ cells are diploid. Two pairs are drawn only to explain paired chromosome types, not the human chromosome count.'),
 P('經減數分裂，配子的染色體套數減為單套 n。精子與卵各有一套；本圖只追蹤一個精子與一個卵，不畫成人類產生四個等大的卵。','Meiosis produces haploid gametes, n. Sperm and egg each carry one set. This model follows one of each, not four equally sized human eggs.'),
 P('受精是精子與卵結合；兩個單套染色體組合在同一個受精卵內。不是把兩個個體整個相加。','Fertilization unites sperm and egg, bringing two haploid chromosome sets into one zygote. It does not add two whole organisms together.'),
 P('n＋n＝2n 表示套數恢復為雙套。每一對染色體各有一條來自不同親代。正常人類配子有 23 條，受精卵有 46 條。','n + n = 2n restores two chromosome sets, one from each parent. Normal human gametes have 23 chromosomes and the zygote has 46.'),
 P('受精卵接著進行細胞分裂與分化，形成新個體。一般體細胞分裂維持染色體套數；不是每分裂一次就再減半。','The zygote divides and cells differentiate to form a new individual. Ordinary mitotic divisions retain the chromosome sets rather than halving them each time.')
];
const CYC_COUNT=[P('2n＝4（兩對）','2n = 4 (two pairs)'),P('精子 n＝2，卵 n＝2','sperm n = 2, egg n = 2'),P('n＋n','n + n'),P('2n＝4：每對一條來自爸爸、一條來自媽媽','2n = 4: one of each pair from each parent'),P('每個細胞都是 2n＝4','Every cell stays 2n = 4')];
function drawGametes(c,s,t){
  const {k,u,held}=stageClock(s,t,5,3.2);s.shown=k;
  panel(c,20,20,300,560);
  text(c,P('真實顯微照片：精子與卵','Real micrograph'),36,54,22,C.yellow);
  D.round(c,30,66,280,176,12,'#0b1a15');place(c,BOOK+'Im2928.png',34,70,272,168);
  steps(c,cycleNames,k,34,256,272,42,8);
  wrap(c,P('人類：配子 23 條、受精卵 46 條。','Humans: gametes 23, zygote 46.'),36,530,268,22,C.muted);
  panel(c,340,20,600,560);
  const F=[500,260],M=[780,260],Z=[650,300];
  if(k===0){
    for(const [p,col,who] of [[F,DAD,P('爸爸的生殖母細胞','Father\'s germ cell')],[M,MOM,P('媽媽的生殖母細胞','Mother\'s germ cell')]]){circle(c,p[0],p[1],78,'rgba(31,74,61,.95)','#9fd8b8',4);
      [[-27,46],[-9,46],[9,30],[27,30]].forEach(([dx,L])=>rod(c,p[0]+dx,p[1],L,col));text(c,who,p[0],p[1]+112,22,col,'center');}
  }else if(k===1){
    const g=held?u:ease(u*1.4);
    // meiosis: each cell keeps one of each pair; the other pair members leave for the other gametes
    circle(c,F[0],F[1],mix(78,24,g),'rgba(31,74,61,.95)','#9fd8b8',3);circle(c,M[0],M[1],mix(78,70,g),'rgba(31,74,61,.95)','#9fd8b8',3);
    if(g>.6){eggCell(c,M[0],M[1],70);sperm(c,F[0],F[1],0,t,1.5);}
    for(const [p,col,sc] of [[F,DAD,mix(1,.45,g)],[M,MOM,mix(1,.85,g)]]){[[-27,46,1],[-9,46,0],[9,30,1],[27,30,0]].forEach(([dx,L,keep])=>{const a=keep?1:1-g;rod(c,p[0]+dx*sc+(keep?0:dx*g*1.4),p[1]-(keep?0:g*40),L*sc,col,a,keep?mix(8,5,(1-sc)*2):8);});}
    pill(c,P('減數分裂：雙套 → 單套','Meiosis: two sets → one set'),360,92,{active:true,color:C.yellow,maxX:930});
    text(c,P('精子','Sperm'),F[0],F[1]+112,22,DAD,'center');text(c,P('卵','Egg'),M[0],M[1]+112,22,MOM,'center');
  }else if(k===2){
    const g=held?u:ease(u*1.25),sx=mix(F[0],M[0]-72,g),sy=F[1]+Math.sin(g*Math.PI)*-30;
    eggCell(c,M[0],M[1],70,g>.95?.4:0);[[-9,46],[9,30]].forEach(([dx,L])=>rod(c,M[0]+dx*.85,M[1],L*.85,MOM));
    sperm(c,sx,sy,Math.atan2(M[1]-sy,M[0]-sx)*.4,t,1.5);[[-6,22],[6,14]].forEach(([dx,L])=>rod(c,sx+dx*.6,sy,L,DAD,1,4));
    pill(c,P('受精：精子和卵結合','Fertilization: sperm meets egg'),360,92,{active:true,color:C.yellow,maxX:930});
  }else if(k===3){
    const g=held?u:ease(u*1.3);eggCell(c,Z[0],Z[1],mix(70,86,g),.15+.1*Math.sin(t*3));
    [[-34,46,MOM],[-20,46,DAD],[20,30,MOM],[34,30,DAD]].forEach(([dx,L,col])=>rod(c,Z[0]+dx,Z[1],L,col));
    c.save();c.setLineDash([6,5]);c.strokeStyle=rgba(C.yellow,.8);c.lineWidth=2.5;c.strokeRect(Z[0]-46,Z[1]-30,40,60);c.strokeRect(Z[0]+8,Z[1]-22,40,44);c.restore();
    text(c,P('受精卵','Zygote'),Z[0],Z[1]+124,24,C.yellow,'center');
    pill(c,P('一對','A pair'),Z[0]-180,Z[1]-70,{anchor:[Z[0]-27,Z[1]-30],color:C.yellow,maxX:930});
  }else{
    const g=held?u:u,n=g<.33?2:g<.66?4:8;embryo(c,Z[0],Z[1],n,86);
    text(c,P(`${n} 個細胞`,`${n} cells`),Z[0],Z[1]+124,24,C.yellow,'center');
    const R=86*(n<=2?.62:n<=4?.5:.4),pos=n<=2?[[-.42,0],[.42,0]]:n<=4?[[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]]:[[-.5,-.3],[0,-.5],[.5,-.3],[-.55,.2],[0,0],[.55,.2],[-.25,.55],[.3,.55]];
    pos.forEach(([a,b])=>{const x=Z[0]+a*86,y=Z[1]+b*86,sc=R/52;[[-9,MOM],[-3,DAD],[3,MOM],[9,DAD]].forEach(([dx,col],j)=>rod(c,x+dx*sc*1.1,y,(j<2?30:20)*sc*.85,col,1,Math.max(2.5,3*sc)));});
  }
  pill(c,CYC_COUNT[k],360,520,{color:C.white,maxX:930,minX:360});
  legendRow(c,[[(x,y)=>rod(c,x,y,16,DAD,1,5),P('來自爸爸','From father')],[(x,y)=>rod(c,x,y,16,MOM,1,5),P('來自媽媽','From mother')]],360,60);
  text(c,P('只畫 2 對','2 pairs shown'),924,60,22,C.muted,'right');
}

// ── Tab 2: where gametes meet, and where the embryo grows ───────────────────
const animals=[
 {name:P('小丑魚','Clownfish'),fert:P('體外受精','External fertilization'),dev:P('卵生：胚胎在母體外','Egg-laying: outside the mother'),f:'Im2936.png',e:'Im2932.png',cell:[0,0],where:P('配子在水中結合；胚胎在卵裡、母體外發育。','Gametes meet in water; embryos develop in eggs outside the mother.')},
 {name:P('紅鶴','Flamingo'),fert:P('體內受精','Internal fertilization'),dev:P('卵生：胚胎在母體外','Egg-laying: outside the mother'),f:'Im2935.png',e:'Im2931.png',cell:[1,0],where:P('配子在母體內結合；生下蛋後，胚胎在母體外發育。','Gametes meet inside the mother; after the egg is laid, the embryo develops outside.')},
 {name:P('非洲水牛','African buffalo'),fert:P('體內受精','Internal fertilization'),dev:P('胎生：胚胎留在母體內','Live-bearing: inside the mother'),f:'Im2934.png',e:'Im2930.png',cell:[1,1],where:P('配子在母體內結合；胚胎也留在母體內發育。','Gametes meet inside the mother; the embryo also develops inside.')}
];
function drawAnimals(c,s,t){
  const a=animals[s.animal];
  panel(c,20,20,460,560);
  for(const [file,lab,y] of [[a.f,P('配子在哪裡結合？','Where do gametes meet?'),32],[a.e,P('胚胎在哪裡發育？','Where does the embryo develop?'),292]]){place(c,BOOK+file,30,y,440,250,{cover:true});pill(c,lab,40,y+10,{active:true,color:C.yellow,maxX:470});}
  text(c,P('真實照片','Real photos'),460,568,22,C.muted,'right');
  panel(c,500,20,440,560);
  const X0=620,Y0=120,CW=150,CH=150;
  text(c,P('胚胎在哪發育？','Where does the embryo grow?'),X0+CW,52,22,C.yellow,'center');
  [P('卵生','Egg-laying'),P('胎生','Live-bearing')].forEach((p,j)=>text(c,p,X0+j*CW+CW/2,98,24,C.white,'center'));
  text(c,P('受精','Fertilization'),556,Y0-24,22,C.yellow,'center');
  [P('體外','External'),P('體內','Internal')].forEach((p,i)=>text(c,p,556,Y0+i*CH+CH/2+8,24,C.white,'center'));
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){const on=a.cell[0]===i&&a.cell[1]===j;D.round(c,X0+j*CW+4,Y0+i*CH+4,CW-8,CH-8,14,on?'rgba(253,224,71,.16)':'rgba(11,26,21,.5)',on?C.yellow:C.edge);}
  text(c,'—',X0+CW*1.5,Y0+CH/2+10,28,C.muted,'center');
  animals.forEach((q,i)=>{const [r,col]=q.cell,others=animals.filter((o,j)=>j<i&&o.cell[0]===r&&o.cell[1]===col).length,x=X0+col*CW+CW/2,y=Y0+r*CH+CH/2-14+others*44,on=i===s.animal,w=measure(c,q.name,22)+28;
    if(on)glow(c,x,y,60,C.yellow,.25+.15*Math.sin(t*3));
    const pp=pill(c,q.name,x-w/2,y-20,{active:on,color:on?C.yellow:C.white,maxX:940,minX:500});D.hit(pp.x,pp.y,pp.w,pp.h,'animal',i);});
  D.round(c,516,428,408,116,14,'rgba(11,26,21,.6)',C.edge);
  wrap(c,a.where,532,464,376,22,C.white);
  text(c,P('點名字可以切換','Tap a name to switch'),920,570,22,C.muted,'right');
}

// ── Tab 3: courtship, egg protection and care of young ─────────────────────
const care=[
 ['Im2937.png',P('軍艦鳥：求偶展示','Frigatebird: courtship display'),P('雄性軍艦鳥鼓起鮮紅喉部，屬求偶展示，可增加與同種個體繁殖的機會。照片是靜止的觀察證據。','A male frigatebird displays its red throat pouch during courtship. The photograph is a still record.'),0,P('雄鳥展示','Male displays')],
 ['Im2946.png',P('蝦：護卵','Shrimp: egg protection'),P('照片中的卵附在腹部，這是護卵。單靠卵在腹部的位置，不能推定其受精方式；不同蝦、蟹的繁殖方式並不完全相同。','Eggs attached under the abdomen show egg protection. Their position alone does not identify fertilization mode; shrimp and crab reproduction varies.'),2,P('卵附在親代腹部','Eggs on the parent')],
 ['Im2943.png',P('臺灣獼猴：育幼','Formosan macaques: parental care'),P('幼猴出生後仍接受照顧；育幼是出生或孵化後的照顧，與孵化前的護卵不同。不是只有母親或所有物種都必然育幼。','Young macaques receive care after birth. Post-birth or post-hatching care differs from egg protection. Care is not universal or always maternal.'),4,P('親代照顧幼猴','Adults care for the young')],
 ['Im2945.png',P('企鵝：餵養幼鳥','Penguins: feeding young'),P('企鵝親鳥以食糜餵食幼鳥。護卵和育幼可增加後代存活的機會，但不能用這張照片算出固定的存活率。','Penguins feed regurgitated food to their young. Protection and care can improve survival opportunities, but the photograph supplies no measured survival rate.'),4,P('親鳥餵食','Parents feed')],
 ['Im5280.png',P('負子蟲：雄蟲背卵','Giant water bug: male carries eggs'),P('雌蟲把卵固定在雄蟲背上，雄蟲護卵並協助卵接觸適當的水分與空氣。生活在水中不代表一定體外受精。','Eggs are attached to a male giant water bug. He protects them and supports suitable moisture and air exposure. Aquatic habitat does not imply external fertilization.'),2,P('雄蟲背卵','The male carries eggs')],
 ['Im5281.png',P('黃盾背椿象：護幼','Shield-backed bug: guarding young'),P('照片呈現雌蟲與聚集的幼蟲。請比較負子蟲與這種椿象：照顧者、卵所在位置、照顧階段各有什麼不同？','The photo shows a female bug with clustered young. Compare the caregiver, egg location and stage of care with the giant water bug.'),4,P('雌蟲守護幼蟲','The female guards the young')]
];
const LIFE=[P('求偶','Courtship'),P('受精','Fertilization'),P('護卵','Egg protection'),P('孵化或出生','Hatching or birth'),P('育幼','Care of young')];
function drawCare(c,s,t){
  const a=care[s.case];
  panel(c,20,20,600,560);
  place(c,BOOK+a[0],30,30,580,410,{cover:true});
  pill(c,a[1],40,40,{active:true,color:C.yellow,maxX:600});
  care.forEach((q,i)=>{const x=30+i*97,on=i===s.case;place(c,BOOK+q[0],x,452,91,90,{cover:true,radius:10,alpha:on?1:.55});D.round(c,x,452,91,90,10,null,on?C.yellow:C.edge);D.hit(x,452,91,90,'case',i);});
  text(c,P('真實照片；點小圖切換','Real photos; tap a thumbnail'),30,572,22,C.muted);
  panel(c,640,20,300,560);
  text(c,P('發生在哪個階段？','At which stage?'),790,58,24,C.yellow,'center');
  LIFE.forEach((p,i)=>{const y=80+i*72,on=i===a[3];if(i)arrow(c,790,y-14,790,y,C.muted,3);node(c,p,664,y,252,52,on,C.yellow);if(on){const u=mod(t*.9);circle(c,676,y+26,8+u*10,null,rgba(C.yellow,1-u),3);}});
  D.round(c,656,448,268,116,14,'rgba(11,26,21,.6)',C.edge);
  text(c,P('照顧者／行為','Who / what'),790,480,22,C.muted,'center');
  wrap(c,a[4],672,520,236,24,C.white);
}

// ── Tab 4: a shelled egg is more than one egg cell ─────────────────────────
const EGG={file:HX+'egg_section.png',W:1306,H:943};
const eggNames=[P('全部構造','All parts'),P('卵黃','Yolk'),P('蛋白','Albumen'),P('繫帶','Chalazae'),P('胚盤與細胞核','Germinal disc and nucleus')];
const eggText=[
 P('切換部位觀察：右邊是雞蛋剖面的 AI 教學插圖（非實拍），左邊是課本的真實照片。不把插圖上畫出的胚盤說成照片裡拍到的構造。','Switch parts to observe. The section on the right is an AI teaching illustration (not a photo); the real photos are on the left. The drawn disc is not claimed to be visible in the photos.'),
 P('卵黃儲存供胚胎發育使用的養分，是鳥類卵細胞的重要部分。大塊卵黃不能和整顆帶蛋殼的雞蛋畫上等號。','Yolk stores nutrients for embryonic development and is a major part of the bird egg cell. It is not the entire shelled egg.'),
 P('蛋白可提供水分和養分，也有保護作用。它不是卵細胞的細胞核；蛋白、殼膜和蛋殼是在卵通過輸卵管時形成的外加構造。','Albumen provides water and nutrients and helps protect the contents. It is not the nucleus; albumen, membranes and shell are added during passage through the hen\'s oviduct.'),
 P('繫帶是蛋白的一部分，可固定卵黃的位置，讓卵黃懸在蛋的中間。','Chalazae are part of the albumen and hold the yolk in place near the centre of the egg.'),
 P('卵黃表面的小白點稱胚盤，含有細胞核或遺傳物質，是卵細胞的一部分，不能把小白點當成整個卵細胞。','The small germinal disc on the yolk contains the nucleus or genetic material and is part of the egg cell, not the entire cell.')
];
const EGG_LAB={yolk:[P('卵黃','Yolk'),[600,520]],disc:[P('胚盤','Germinal disc'),[795,298]],white:[P('蛋白','Albumen'),[220,430]],chal:[P('繫帶','Chalazae'),[260,600]],air:[P('氣室','Air cell'),[1160,330]],shell:[P('蛋殼','Shell'),[400,860]],memb:[P('殼膜','Shell membranes'),[150,250]]};
function drawEgg(c,s,t){
  const part=s.part;
  panel(c,20,20,280,560);
  text(c,P('真實照片：氣室','Real photo: air cell'),34,54,22,C.yellow);place(c,BOOK+'Im2969.png',30,64,260,180,{cover:true});
  text(c,P('真實照片：打開的雞蛋','Real photo: opened egg'),34,280,22,C.yellow);place(c,BOOK+'Im2970.png',30,290,260,180,{cover:true});
  wrap(c,P('未受精的蛋孵不出小雞。','An unfertilized egg cannot hatch.'),34,508,252,22,C.white);
  panel(c,320,20,620,560);
  const f=place(c,EGG.file,330,106,600,420);
  text(c,eggNames[part],340,62,28,C.yellow);text(c,P('AI 教學插圖（剖面）','AI illustration (section)'),926,96,22,C.muted,'right');
  if(!f)return;
  const show=part===0?['memb','white','chal','yolk','disc','air','shell']:[[],['yolk'],['white'],['chal'],['disc']][part];
  if(part===1||part===4){const [x,y]=f.map(665,462),rx=262*f.k+8,ry=242*f.k+8,u=mod(t*.8);ellipse(c,x,y,rx,ry,null,rgba(part===4?C.pink:C.orange,.95),4);ellipse(c,x,y,rx+u*14,ry+u*14,null,rgba(part===4?C.pink:C.orange,.7*(1-u)),3);}
  if(part===4||part===0){pulse(c,...f.map(795,298),t,C.pink,12);}
  if(part===3){for(const seg of [[[120,640],[260,600],[400,565]],[[930,385],[1010,362],[1080,345]]]){const pts=seg.map(p=>f.map(...p));sline(c,pts,rgba(C.cyan,.5+.4*Math.sin(t*4)),9);}}
  if(part===2){c.save();c.globalAlpha=.18+.1*Math.sin(t*3);ellipse(c,...f.map(560,430),540*f.k,330*f.k,C.cyan);c.restore();}
  const side={memb:'l',white:'l',chal:'l',yolk:'l',disc:'l',air:'r',shell:'l'};
  show.forEach(k=>{const [p,a]=EGG_LAB[k],[ax,ay]=f.map(...a),w=measure(c,p,22)+28,col=k==='disc'?C.pink:k==='yolk'?C.orange:C.white;
    const top=k==='disc'&&part===0,lx=top?Math.min(924-w,ax+30):side[k]==='r'?Math.min(924-w,ax+40):Math.max(330,ax-w-40),ly=top?106:Math.max(96,Math.min(500,ay-60));pill(c,p,lx,ly,{anchor:[ax,ay],color:col,maxX:930,minX:326,active:part!==0});});
  if(part===4)pill(c,P('卵細胞＝卵黃＋胚盤','Egg cell = yolk + disc'),340,540,{color:C.pink,maxX:930});
  else if(part===0)wrap(c,P('卵黃和胚盤屬於卵細胞；蛋白、殼膜、蛋殼包在外面。','Yolk and disc belong to the egg cell; albumen, membranes and shell are outer layers.'),340,540,584,22,C.white);
}

// ── Tab 5: fertilization in the oviduct, implantation in the uterus ─────────
const ORG={file:HX+'female_organs.png',W:1400,H:1005},BODY={file:HX+'female_body.png',box:[415,705,215,190]};
const EGG_PATH=[[1212,312],[1250,322],[1282,352],[1318,300],[1338,220],[1328,150],[1290,100],[1220,80],[1130,100],[1040,135],[965,162],[905,178],[840,205],[790,190],[740,172]];
const SPERM_PATH=[[700,940],[700,780],[702,650],[700,560],[705,420],[760,300],[840,205],[905,178],[965,162],[1040,135],[1130,100],[1220,80],[1290,100],[1328,150],[1338,220]];
const VIEWS=[[0,0,1400,1005],[860,20,540,420],[500,90,460,340]];
const journeyNames=[P('卵巢釋出卵','Ovulation'),P('輸卵管內受精','Fertilization in the oviduct'),P('細胞分裂並移動','Division during transport'),P('進入子宮','Entry into the uterus'),P('著床於子宮內膜','Implantation in the lining')];
const journeyText=[
 P('卵巢釋出的卵進入輸卵管。卵巢、輸卵管和子宮是不同構造；動畫用路徑說明先後，不使用實測時間。','An ovulated egg enters the oviduct. Ovary, oviduct and uterus are distinct structures. The path shows sequence, not measured timing.'),
 P('人類正常受精通常發生於輸卵管，卵與精子在此結合成受精卵。子宮主要是後續著床及發育的場所，不是把兩者混成同一位置。','Human fertilization normally occurs in the oviduct, where sperm and egg form a zygote. The uterus is the later site of implantation and development.'),
 P('受精卵分裂成更多細胞，同時沿輸卵管移向子宮。早期分裂不代表整團胚胎立即變成同等倍數的大；細胞畫大只為方便辨識。','The early embryo divides while moving toward the uterus. More cells do not mean an immediate proportional increase in size; cells are enlarged for recognition.'),
 P('早期胚胎進入子宮；「已進入子宮腔」不等於「已著床」。','The early embryo enters the uterine cavity. Entry is not implantation.'),
 P('胚胎之後著床於子宮內膜，繼續發育。模型只說明一般生物學過程，不預測個人是否懷孕，也不提供避孕或受孕時機。','The embryo later implants in the uterine lining and continues development. This is general biology, not a prediction of pregnancy or advice about contraception or conception timing.')
];
function subPath(path,a,b){return path.slice(a,b+1);}
function drawJourney(c,s,t){
  const {k,u,held}=stageClock(s,t,5,3.4);s.shown=k;
  panel(c,20,20,220,560);
  text(c,P('在身體哪裡？','Where in the body?'),130,54,22,C.yellow,'center');
  const bi=pic(BODY.file);let src0=null;
  if(bi){const kk=Math.min(200/bi.naturalWidth,500/bi.naturalHeight),bx=130-bi.naturalWidth*kk/2,by=70;c.drawImage(bi,bx,by,bi.naturalWidth*kk,bi.naturalHeight*kk);const [x,y,w,h]=BODY.box;src0=[bx+x*kk,by+y*kk,w*kk,h*kk];dashedBox(c,src0);}
  panel(c,260,20,680,560);
  const V=VIEWS[s.focus],A=[270,60,660,470],kz=Math.min(A[2]/V[2],A[3]/V[3]),ox=A[0]+(A[2]-V[2]*kz)/2,oy=A[1]+(A[3]-V[3]*kz)/2,M=(px,py)=>[ox+(px-V[0])*kz,oy+(py-V[1])*kz];
  if(src0)connectors(c,src0,[ox,oy,V[2]*kz,V[3]*kz],.35);
  c.save();c.beginPath();c.rect(ox,oy,V[2]*kz,V[3]*kz);c.clip();crop(c,ORG.file,V,[ox,oy,V[2]*kz,V[3]*kz]);
  const R=Math.max(8,22*kz),g=held?u:u;
  // route guide
  c.save();c.setLineDash([8,7]);sline(c,EGG_PATH.map(p=>M(...p)),rgba(C.yellow,.35),3);c.restore();
  if(k===0){const [x,y]=M(...along(subPath(EGG_PATH,0,4),ease(g)));pulse(c,...M(1212,312),t,C.yellow,10);eggCell(c,x,y,R,.3);}
  else if(k===1){const egg=M(1338,220);eggCell(c,...egg,R,g>.8?.5:.15);
    for(let i=0;i<7;i++){const v=clamp(g*1.25-i*.05),p=along(SPERM_PATH,v),q=along(SPERM_PATH,Math.max(0,v-.01)),[x,y]=M(...p),[qx,qy]=M(...q);if(i===0&&v>=1)continue;sperm(c,x+Math.sin(i*2.1)*R*.8,y+Math.cos(i*1.7)*R*.6,Math.atan2(y-qy,x-qx),t+i,Math.max(.35,kz*.9));}
    if(g>.8)glow(c,...egg,R*3,C.yellow,.5*(1-(g-.8)/.2)+.2);}
  else if(k===2){const p=along(subPath(EGG_PATH,4,11),ease(g)),[x,y]=M(...p);embryo(c,x,y,g<.3?2:g<.65?4:8,R*1.1);}
  else if(k===3){const p=along(subPath(EGG_PATH,11,14),ease(g)),[x,y]=M(...p);embryo(c,x,y,8,R*1.2);}
  else{const [x,y]=M(740,172),sink=ease(g);glow(c,x,y-4,R*3,C.pink,.25+.2*sink);embryo(c,x,y-R*.4*sink,8,R*1.2);}
  c.restore();
  // labels on the enlargement
  const lab=(p,a,dx,dy,col=C.white)=>{const [x,y]=M(...a);if(x<ox||x>ox+V[2]*kz||y<oy||y>oy+V[3]*kz)return;pill(c,p,x+dx,y+dy,{anchor:[x,y],color:col,maxX:930,minX:270});};
  lab(P('卵巢','Ovary'),[1150,345],-60,70);lab(P('輸卵管','Oviduct'),[1100,108],-180,-70);lab(P('子宮','Uterus'),[700,500],-260,0);
  lab(P('子宮內膜','Uterine lining'),[620,170],-240,-40,C.pink);
  if(k===1)lab(P('受精在這裡','Fertilization here'),[1338,220],-250,40,C.yellow);
  if(k===4)lab(P('著床在這裡','Implantation here'),[740,172],60,50,C.yellow);
  pill(c,journeyNames[k],276,30,{active:true,color:C.yellow,maxX:930});
  legendRow(c,[[(x,y)=>eggCell(c,x,y,8),P('卵／胚胎','Egg / embryo')],[(x,y)=>sperm(c,x+10,y,0,t,.5),P('精子','Sperm')]],276,570);
}

// ── Tab 6: placenta exchange; the two bloods stay apart ─────────────────────
const FET={file:HX+'fetus_placenta.png',W:770,H:1056,box:[40,70,200,460]};
const CORD=[[200,300],[250,318],[300,348],[302,400],[268,438],[215,458],[205,488],[240,506],[300,500],[340,508],[358,545],[383,585]];
const routes=[
 {name:P('氧氣','Oxygen'),text:P('氧氣由母體血液跨越胎盤交換面進入胎兒血液，再經臍帶的血管運向胎兒。胎兒不是在子宮內直接用肺吸入空氣。','Oxygen crosses the placental exchange surface from maternal to fetal blood and reaches the fetus through umbilical vessels. The fetus does not inhale air in the uterus.'),toFetus:true,color:C.pink,draw:(c,x,y,a)=>{c.save();c.globalAlpha=a;D.oxygen(c,x,y,5);c.restore();}},
 {name:P('養分','Nutrients'),text:P('例如葡萄糖等養分經胎盤交換，進入胎兒循環。胎盤是交換場所，臍帶是胎兒與胎盤間的運輸連結；不是母親的血直接倒進胎兒。','Nutrients such as glucose cross the placenta into fetal circulation. The placenta exchanges materials, and the cord connects fetus and placenta; maternal blood is not poured into the fetus.'),toFetus:true,color:C.yellow,draw:(c,x,y,a)=>{c.save();c.globalAlpha=a;c.beginPath();for(let i=0;i<6;i++){const q=i*TAU/6+Math.PI/6;c.lineTo(x+Math.cos(q)*8,y+Math.sin(q)*8);}c.closePath();c.fillStyle=rgba(C.yellow,.3);c.fill();c.strokeStyle=C.yellow;c.lineWidth=2.5;c.stroke();c.restore();}},
 {name:P('二氧化碳','Carbon dioxide'),text:P('胎兒產生的二氧化碳先經臍帶回到胎盤，再跨交換面進入母體血液，由母體呼吸系統代為排出。','Fetal carbon dioxide travels through the cord to the placenta, crosses into maternal blood and is removed by the mother\'s respiratory system.'),toFetus:false,color:C.white,draw:(c,x,y,a)=>{c.save();c.globalAlpha=a;D.co2(c,x,y,4);c.restore();}},
 {name:P('代謝廢物','Metabolic wastes'),text:P('部分代謝廢物由胎兒循環經胎盤進入母體，再由母體的排泄器官處理。此符號概括多種廢物，不是把所有廢物畫成同一種真實分子。','Some fetal metabolic wastes cross into maternal blood for removal by maternal organs. The symbol represents several wastes, not one literal molecular structure.'),toFetus:false,color:C.orange,draw:(c,x,y,a)=>{c.save();c.globalAlpha=a;D.round(c,x-8,y-5,16,10,5,C.orange,C.ink);c.restore();}}
];
function rbcDisc(c,x,y,r,ox){const body=mixHex('#7a1f2b','#ef3e46',ox);ellipse(c,x,y,r,r*.62,body,mixHex('#a3404a','#ff8a8f',ox),1.5);ellipse(c,x,y,r*.42,r*.24,mixHex('#5e1520','#c42f39',ox));}
function drawPlacenta(c,s,t){
  const r=routes[s.material];
  panel(c,20,20,340,560);
  const f=place(c,FET.file,30,34,320,500);
  if(f){const b=f.rect(FET.box);dashedBox(c,b);connectors(c,b,[380,20,560,560],.35);
    const path=r.toFetus?CORD:[...CORD].reverse();for(let i=0;i<6;i++){const u=mod(t*.22+i/6),[x,y]=f.map(...along(path,u));r.draw(c,x,y,u<.08?u/.08:u>.92?(1-u)/.08:1);}
    pill(c,P('胎盤','Placenta'),36,560-70,{anchor:f.map(110,420),color:C.white,maxX:350});
    pill(c,P('臍帶','Umbilical cord'),160,560-120,{anchor:f.map(250,505),color:C.white,maxX:350});
    pill(c,P('羊水','Amniotic fluid'),230,46,{anchor:f.map(560,200),color:C.cyan,maxX:350});}
  text(c,P('AI 教學插圖','AI teaching illustration'),190,572,22,C.muted,'center');
  // the enlarged exchange surface
  panel(c,380,20,560,560);
  const MX0=396,MX1=630,WALL=630,FX0=652,FX1=924,Y0=96,Y1=430;
  c.save();c.beginPath();c.roundRect(380,20,560,560,16);c.clip();
  c.fillStyle='#4a1820';c.fillRect(MX0-16,Y0,MX1-MX0+16,Y1-Y0);
  c.fillStyle='#e7a9a4';c.fillRect(WALL,Y0,FX0-WALL,Y1-Y0);for(let y=Y0+20;y<Y1;y+=60)ellipse(c,WALL+11,y,4,14,'#b35d63');
  c.fillStyle='#3d1a2e';c.fillRect(FX0,Y0,FX1-FX0+20,Y1-Y0);
  c.save();c.beginPath();c.rect(MX0-16,Y0,FX1-MX0+40,Y1-Y0);c.clip();
  for(let i=0;i<6;i++){const y=Y0+mod(t*40+i*60,Y1-Y0+40)-20;rbcDisc(c,MX0+30+(i*53)%170,y,18,.85);}
  for(let i=0;i<6;i++){const y=Y1-mod(t*36+i*62,Y1-Y0+40)+20;rbcDisc(c,FX0+40+(i*61)%200,y,16,r.toFetus?.35+.5*((i%3)/2):.5);}
  c.restore();
  for(let i=0;i<7;i++){const u=mod(t*.28+i/7),y=Y0+40+(i*47)%(Y1-Y0-80),x=r.toFetus?mix(MX0+40,FX1-30,u):mix(FX1-30,MX0+40,u);r.draw(c,x,y+Math.sin(t*2+i)*6,u<.1?u/.1:u>.9?(1-u)/.1:1);}
  c.restore();
  text(c,P('母體血液','Mother\'s blood'),MX0,82,24,'#ff8a8f');text(c,P('胎兒血液 → 臍帶 → 胎兒','Fetal blood → fetus'),FX0+4,82,22,C.cyan);
  arrow(c,r.toFetus?560:740,Y1+30,r.toFetus?740:560,Y1+30,r.color,5);
  text(c,r.toFetus?P(`${D.tr(r.name)}：母體 → 胎兒`,`${D.tr(r.name)}: mother → fetus`):P(`${D.tr(r.name)}：胎兒 → 母體`,`${D.tr(r.name)}: fetus → mother`),650,Y1+70,24,r.color,'center');
  pill(c,P('紅血球留在各自的血管裡，兩邊的血不混合','Red cells stay put; the two bloods never mix'),396,Y1+92,{color:'#ff8a8f',maxX:932,minX:392});
}

const tabs=[
{id:'gametes',title:P('套數先減，再合回來','Halve the sets, then unite'),sub:P('配子形成與受精','Gametes and fertilization'),hook:P('如果精子和卵都帶著完整雙套染色體，下一代不是會一直加倍嗎？','If both gametes carried two sets, would each generation keep doubling its chromosomes?'),body:P('追蹤同一套染色體：親代 2n 經減數分裂形成 n 配子，受精恢復 2n，再分裂與發育。','Follow chromosome sets: 2n parents form n gametes through meiosis; fertilization restores 2n, followed by division and development.'),reading:join(cycleText),closure:P('減數分裂減少套數，受精恢復套數；子代正常染色體數目與親代相同，組合卻可以不同。','Meiosis reduces the sets and fertilization restores them. The chromosome number is maintained while combinations can differ.'),sources:[source(P('精子與卵原始顯微影像','Original sperm–egg micrograph'))],init:()=>({running:true,phase:-1,start:0}),controls:()=>[choice(P('追蹤階段','Follow a stage'),'phase',[[-1,P('連續觀察','Continuous')],...cycleNames.map((n,i)=>[i,n])])],act(s,k,v){s[k]=v;s.start=s.elapsed;},explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;return{title:cycleNames[k],text:cycleText[k]};},draw:drawGametes},
{id:'animals',title:P('受精在哪？胚胎在哪？','Two different location questions'),sub:P('受精方式與發育方式','Fertilization and development'),hook:P('紅鶴是體內受精，為什麼還會下蛋？「體內受精＝胎生」是真的嗎？','Flamingos fertilize internally yet lay eggs. Does internal fertilization always mean live birth?'),body:P('先問配子在哪裡結合，再問胚胎在哪裡發育。選動物，看牠落在表格的哪一格。','First ask where gametes unite, then where embryos develop. Choose an animal and see which box of the table it falls in.'),reading:P('小丑魚在水中體外受精，胚胎在母體外的卵中發育；紅鶴體內受精，但產卵後胚胎在母體外發育；水牛體內受精，胚胎留在母體內發育。這三例把兩個分類分開，不代表所有魚、鳥或哺乳類都沒有例外。體內受精可減少配子暴露於乾燥環境，不能因此保證受精成功。','Clownfish fertilize externally and develop in eggs outside the mother. Flamingos fertilize internally but embryos develop in laid eggs. Buffalo fertilize internally and retain the developing embryo. These examples separate two classifications; they are not universal claims without exceptions. Internal fertilization reduces exposure to dry environments but does not guarantee success.'),closure:P('體內受精可以配上卵生，也可以配上胎生；受精方式和胚胎發育場所不能混成一題。','Internal fertilization can accompany egg-laying or live-bearing. Fertilization and embryonic development are separate questions.'),sources:animals.map(a=>source(P(a.name[0]+'的受精與胚胎發育照片',a.name[1]+' photos'))),init:()=>({running:true,animal:0}),controls:()=>[choice(P('比較動物','Compare'),'animal',animals.map((a,i)=>[i,a.name]))],explain:s=>({title:animals[s.animal].name,text:join([animals[s.animal].fert,animals[s.animal].dev,P('照片用來觀察；分類依課本描述，不從單一外形猜測。','Photographs support observation; classification follows the textbook descriptions, not guesses from appearance.')])}),draw:drawAnimals},
{id:'care',title:P('生下來，還要照顧嗎？','What happens after reproduction?'),sub:P('求偶、護卵與育幼','Courtship, protection and care'),hook:P('背著卵的負子蟲是爸爸還是媽媽？照顧後代的方式只有一種嗎？','Is the egg-carrying giant water bug a father or a mother? Is there just one way to care for offspring?'),body:P('逐張觀察照片，看這個行為發生在繁殖的哪個階段：求偶、護卵，還是育幼；再比較照顧者。','Inspect each photo and find the stage of the behaviour: courtship, egg protection or care of young. Then compare the caregivers.'),reading:join(care.map(a=>a[2])),closure:P('繁殖行為可增加繁殖及後代存活機會；不同物種的策略不同，並非每種都具備全部行為。','Reproductive behaviours can improve reproduction and offspring survival opportunities; species use different strategies and do not all perform every behaviour.'),sources:care.map(a=>source(a[1])),init:()=>({running:true,case:0}),controls:()=>[choice(P('觀察例子','Example'),'case',care.map((a,i)=>[i,a[1]]))],explain:s=>({title:care[s.case][1],text:care[s.case][2]}),draw:drawCare},
{id:'egg',title:P('雞蛋不只是一顆卵細胞','A shelled egg is more than one cell'),sub:P('雞蛋構造與功能','Egg structure and function'),hook:P('卵黃上的小白點，就是整個卵細胞嗎？超市的蛋都能孵出小雞嗎？','Is the white spot the whole egg cell? Can every supermarket egg hatch?'),body:P('看雞蛋剖面找出卵黃、蛋白、繫帶與胚盤，再對照左邊的真實照片。','Find the yolk, albumen, chalazae and germinal disc on the section, then compare with the real photos on the left.'),reading:join([...eggText,P('未受精的雞蛋不能孵出小雞；受精蛋也需要適合的發育條件，不是只要有小白點就必定孵化。小白點和卵黃是卵細胞的一部分，蛋白、殼膜與蛋殼則不是另一個卵細胞。','Unfertilized eggs cannot hatch chicks. Fertilized eggs also need suitable conditions; a visible disc is not a guarantee of hatching. The disc and yolk belong to the egg cell, while albumen, membranes and shell are not another egg cell.')]),closure:P('胚盤含細胞核，是卵細胞的一部分；卵黃與蛋白提供養分，繫帶固定卵黃。','The germinal disc contains the nucleus and is part of the egg cell. Yolk and albumen supply nutrients; chalazae hold the yolk.'),sources:[source(P('氣室原照片','Original air-cell photograph')),source(P('雞蛋內部原照片','Original opened-egg photograph'))],init:()=>({running:true,part:0}),controls:()=>[choice(P('構造觀察','Structure'),'part',eggNames.map((n,i)=>[i,n]))],explain:s=>({title:eggNames[s.part],text:eggText[s.part]}),draw:drawEgg},
{id:'journey',title:P('受精到著床，不在同一處','Fertilization is not implantation'),sub:P('輸卵管、分裂與子宮','Oviduct, division and uterus'),hook:P('如果受精發生在輸卵管，胚胎怎麼來到子宮？進了子宮就是著床嗎？','If fertilization occurs in the oviduct, how does the embryo reach the uterus? Is entry already implantation?'),body:P('左邊標出生殖器官在身體的位置；右邊放大，追蹤受精、分裂、移動和著床的先後。','The left marks where the organs are; the enlargement follows fertilization, division, movement and implantation in order.'),reading:join(journeyText),closure:P('輸卵管通常是受精場所；胚胎分裂並移向子宮，之後才著床於子宮內膜。','Fertilization normally occurs in the oviduct. The dividing embryo moves to the uterus and later implants in its lining.'),sources:[],init:()=>({running:true,phase:-1,focus:0,start:0}),controls:()=>[choice(P('放大觀察','Enlarge'),'focus',[[0,P('完整構造','Full anatomy')],[1,P('輸卵管放大','Oviduct close-up')],[2,P('子宮內膜放大','Lining close-up')]]),choice(P('階段','Stage'),'phase',[[-1,P('連續追蹤','Continuous')],...journeyNames.map((n,i)=>[i,n])])],act(s,k,v){s[k]=v;if(k==='phase')s.start=s.elapsed;},explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;return{title:journeyNames[k],text:journeyText[k]};},draw:drawJourney},
{id:'placenta',title:P('交換物質，不把血混一起','Exchange materials, not whole blood'),sub:P('胎盤、臍帶與羊水','Placenta, cord and amniotic fluid'),hook:P('胎兒的氧氣從哪裡來？是母親的血直接流進胎兒身體嗎？','Where does fetal oxygen come from? Does maternal blood flow directly into the fetus?'),body:P('左邊看胎盤與臍帶，右邊放大胎盤的交換面：選一種物質，追蹤它往哪個方向走；兩邊的血液保持分開。','See the placenta and cord on the left; the enlargement shows the exchange surface. Choose a material and follow its direction; the two bloods stay separate.'),reading:join([...routes.map(a=>a.text),P('羊膜包圍胎兒，羊水可緩衝震動。胎盤不是攔住所有物質的絕對屏障；本模型只追蹤一般生理交換，不提供醫療判斷。母胎血液在正常情況下不直接混合，臍帶中的血液屬胎兒循環。','The amnion surrounds the fetus and amniotic fluid cushions movement. The placenta is not an absolute barrier to all substances. This model illustrates normal exchange, not medical assessment. Maternal and fetal blood normally remain separate; cord blood belongs to fetal circulation.')]),closure:P('胎盤負責交換，臍帶連結胎兒與胎盤；氧氣和養分向胎兒，二氧化碳及部分廢物向母體。','The placenta exchanges materials and the cord connects it to the fetus. Oxygen and nutrients move toward the fetus; carbon dioxide and some wastes toward the mother.'),sources:[],init:()=>({running:true,material:0}),controls:()=>[choice(P('追蹤物質','Follow a material'),'material',routes.map((a,i)=>[i,a.name]))],explain:s=>({title:routes[s.material].name,text:routes[s.material].text}),draw:drawPlacenta}
];
B.register({id:'reproduction_humans',title:P('動物與人類生殖：新生命如何開始？','Animal and human reproduction'),subtitle:P('配子與受精、發育的場所、後代的照顧，以及胎盤的交換','Gametes and fertilization, where embryos grow, care of young, and placental exchange'),cover:'assets/covers/biology_reproduction_humans_1009_v1.jpg',tabs});
})();

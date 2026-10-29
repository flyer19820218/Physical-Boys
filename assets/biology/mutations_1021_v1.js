/* Mutations · teacher-requested V5 remake, 2026-10-21.
 * Four tabs: albinism as a mutation (the teacher's Gemini buffalo, sparrow and peacock pictures, a magnified
 * hair-and-skin model of melanin, and whether a mutation harms or helps), gene vs chromosome mutations (the real
 * haemoglobin sequence with its one-letter sickle-cell change; trisomy 21 on the karyotype layout of the
 * human-inheritance unit), causes and body-cell vs germ-cell mutations, and carriers / genetic diseases /
 * genetic counselling (a buffalo family, Aa × Aa).
 * Pictures: mutations_ai_1021/ (AI illustrations, not photographs; the dark calf is the albino calf recoloured in
 * code). Changed DNA is orange everywhere; sperm-borne cyan and egg-borne pink, dominant green and recessive orange,
 * as in the other genetics units. Multiple-choice checks: genetics_quiz_1020_v1.js.
 * Replaces the mutations entry of genetics_lessons_1010_v1.js (left in that file, unused).
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3);
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
const mixHex=(a,b,u)=>{const p=parseInt(a.slice(1),16),q=parseInt(b.slice(1),16),f=s=>[s>>16&255,s>>8&255,s&255],A=f(p),Bq=f(q);return `rgb(${A.map((v,i)=>Math.round(mix(v,Bq[i],clamp(u)))).join(',')})`;};

// ── drawing kit (same helpers as the other genetics units) ─────────────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
const FONT=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
const MONO=size=>`700 ${size}px "JetBrains Mono", "Noto Sans TC", monospace`;
function text(c,p,x,y,size=22,color=C.white,align='left',font=FONT){c.save();c.font=font(size);c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function measure(c,p,size,font=FONT){c.save();c.font=font(size);const w=c.measureText(D.tr(p)).width;c.restore();return w;}
function splitLines(c,str,maxW,size=22){
  c.save();c.font=FONT(size);
  const isEn=/[A-Za-z]/.test(str)&&!/[一-鿿]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9₁₂]+(?:['–-][A-Za-z0-9₁₂]+)*|\s+|[^A-Za-z0-9₁₂\s]/g)||[]):Array.from(str);
  const rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());
  c.restore();return rows;
}
function wrap(c,p,x,y,w,size=22,color=C.white,lh=Math.round(size*1.38),align='left'){
  const rows=splitLines(c,D.tr(p),w,size),PUNCT=/^[，。、；：！？）」』,.;:!?)]/;
  for(let i=1;i<rows.length;i++)while(PUNCT.test(rows[i])&&rows[i-1].length>1){
    if(/[A-Za-z]/.test(rows[i-1])&&!/[一-鿿]/.test(rows[i-1])){rows[i-1]+=rows[i][0];rows[i]=rows[i].slice(1).trimStart();}else{rows[i]=rows[i-1].slice(-1)+rows[i];rows[i-1]=rows[i-1].slice(0,-1);}}
  rows.filter(r=>r).forEach((r,i)=>text(c,r,x,y+i*lh,size,color,align));return rows.length*lh;}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,1));g.addColorStop(1,rgba(color,0));c.globalAlpha*=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(16,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function panel(c,x,y,w,h,fill='#16332b'){D.round(c,x,y,w,h,16,fill,C.edge);}
function pill(c,p,x,y,{active=false,color=C.yellow,size=22,maxX=940,minX=24}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(minX,Math.min(x,maxX-w));
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.9)',active?C.white:rgba(color,.8));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  return{x,y,w,h};
}
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*16,null,rgba(color,.9*(1-u)),3);}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
const steps=(short)=>choice(P('步驟','Step'),'phase',[[-1,P('連續播放','Play all')],...short.map((n,i)=>[i,n])]);
// A stage clock: loops through n stages, or eases into a held stage.
function stageClock(s,t,n,per=5){
  if(s.phase>=0)return{k:s.phase,u:ease((t-(s.start||0))/1.6),held:true,tau:t-(s.start||0)};
  const q=mod(t-(s.start||0),n*per)/per;return{k:Math.floor(q),u:q%1,held:false,tau:(q%1)*per};
}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const SPERM=C.cyan,EGG=C.pink,MUT=C.orange;

// ── pictures ───────────────────────────────────────────────────────────────
const AI='assets/biology/mutations_ai_1021/',PICS={};
const SIZE={'buffalo_cow.png':[865,590],'buffalo_calf_albino.png':[431,349],'buffalo_calf_dark.png':[431,349],'sparrow_normal.png':[598,573],'sparrow_albino.png':[598,573],
 'peacock_blue.png':[656,618],'peacock_white.png':[586,612],'rbc_normal.png':[438,398],'rbc_sickle.png':[399,405],'eye_peacock_blue.png':[120,120],'eye_peacock_white.png':[120,120],'eye_sparrow_albino.png':[128,128]};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.onerror=()=>{im.failed=true;};im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
// The box an image (or a crop of it) fills; known before the image loads, so layouts never jump.
function fitRect(file,bx,by,bw,bh,crop=[0,0,1,1]){const [W,H]=SIZE[file],sw=W*crop[2],sh=H*crop[3],k=Math.min(bw/sw,bh/sh),w=sw*k,h=sh*k;return{x:bx+(bw-w)/2,y:by+(bh-h)/2,w,h};}
function drawIn(c,file,r,{crop=[0,0,1,1],alpha=1,flip=false}={}){
  const im=pic(AI+file);
  if(!im){c.save();c.setLineDash([6,6]);D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(C.muted,.4));c.restore();return r;}
  const W=im.naturalWidth,H=im.naturalHeight;c.save();c.globalAlpha*=alpha;if(flip){c.translate(r.x*2+r.w,0);c.scale(-1,1);}
  c.drawImage(im,W*crop[0],H*crop[1],W*crop[2],H*crop[3],r.x,r.y,r.w,r.h);c.restore();return r;}
const place=(c,file,bx,by,bw,bh,o={})=>drawIn(c,file,fitRect(file,bx,by,bw,bh,o.crop),o);

// ── small shared marks ─────────────────────────────────────────────────────
function marker(c,x,y,n,t,r=13){if(t!=null)pulse(c,x,y,t,C.yellow,r+2);circle(c,x,y,r,C.yellow,C.ink,2);c.save();c.font=MONO(20);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function tile(c,x,y,ch,fill,w=24,h=30,sx=1){c.save();c.translate(x+w/2,y+h/2);c.scale(Math.max(.04,sx),1);D.round(c,-w/2,-h/2,w,h,6,fill,C.ink);c.font=MONO(20);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(ch,0,1);c.restore();}
function strip(c,str,cx,y,changed=-1,w=24,gap=4){const x0=cx-(str.length*(w+gap)-gap)/2;[...str].forEach((ch,i)=>tile(c,x0+i*(w+gap),y,ch,i===changed?MUT:C.white,w));return x0;}
function granule(c,x,y,a=1,s=1){c.save();c.globalAlpha*=a;ellipse(c,x,y,4.2*s,3*s,'#3b2414','#a87048',1.3);c.restore();}
function melCell(c,x,y,s=1,mark=false,t=0){c.save();c.translate(x,y);c.scale(s,s);
  [[24,-8],[22,-26],[-18,-24]].forEach(([dx,dy])=>sline(c,[[0,0],[dx,dy]],'#efe0cf',6));circle(c,0,0,12,'#efe0cf','#8a6a55',2);
  circle(c,0,0,5.5,mark?MUT:'#9d8fcf',null);c.restore();if(mark)pulse(c,x,y,t,MUT,9*s);}
// Chromosome rod (same drawing as the human-inheritance unit).
function rod(c,x,y,L,cen,color,{w=10,rot=0,alpha=1,seed=1}={}){
  if(alpha<=0)return;c.save();c.translate(x,y);c.rotate(rot);c.globalAlpha*=alpha;
  const up=Math.max(3,L*cen),dn=Math.max(3,L-up),r=w/2;c.fillStyle=color;c.strokeStyle=C.ink;c.lineWidth=1.6;
  c.beginPath();c.roundRect(-r,-up,w,up-1,r);c.fill();c.stroke();c.beginPath();c.roundRect(-r,1,w,dn-1,r);c.fill();c.stroke();
  c.fillStyle='rgba(11,26,21,.38)';const R=rng(seed*7919);for(let i=0;i<Math.round(L/12);i++){const yy=-up+3+R()*(L-6);if(Math.abs(yy)>3)c.fillRect(-r+1.5,yy,w-3,1.8+R()*1.6);}
  c.restore();
}
const CH='#c8d6cc';

// ── Tab 1: albinism ────────────────────────────────────────────────────────
const ANIMALS=[
 {name:P('水牛','Water buffalo'),sub:P('白化小水牛','Albino calf'),normal:'buffalo_cow.png',white:'buffalo_calf_albino.png',nLabel:P('水牛媽媽','Mother'),wLabel:P('白化小水牛','Albino calf'),albino:true,
  nNote:P('皮膚和毛都有黑色素','Skin and hair have melanin'),
  clues:[[.75,.12,P('毛色很淡','Very pale hair'),26,-14],[.43,.93,P('皮膚、蹄是粉紅色','Pink skin and hooves'),-30,4],[.16,.145,P('眼睛顏色很淡','Very pale eyes'),-22,-30]],
  spot:[[.56,.14],[.6,.13]],res:[P('毛和皮膚是灰黑色','Dark hair and skin'),P('毛白、皮膚粉紅','White hair, pink skin')],hair:P('毛','Hair'),coat:P('毛','hair')},
 {name:P('麻雀','Tree sparrow'),sub:P('白化麻雀','Albino'),normal:'sparrow_normal.png',white:'sparrow_albino.png',nLabel:P('一般麻雀','Normal sparrow'),wLabel:P('白化麻雀','Albino sparrow'),albino:true,
  nNote:P('羽毛有褐色和黑色的花紋','Brown and black feather patterns'),
  clues:[[.42,.42,P('羽毛全白','All-white feathers'),0,0],[.33,.72,P('嘴和腳是粉紅色','Pink beak and feet'),-34,0],[.167,.10,P('眼睛是紅色的','Red eyes'),-26,-26]],
  spot:[[.3,.45],[.3,.45]],res:[P('羽毛有花紋','Patterned feathers'),P('羽毛白、腳粉紅','White feathers, pink feet')],hair:P('羽毛','Feather'),coat:P('羽毛','feathers')},
 {name:P('孔雀（補充）','Peafowl'),sub:P('白孔雀','White (extra)'),normal:'peacock_blue.png',white:'peacock_white.png',nLabel:P('藍孔雀','Blue peacock'),wLabel:P('白孔雀','White peacock'),albino:false,
  nNote:P('羽毛有藍、綠色和眼狀斑','Blue and green feathers with eyespots'),
  clues:[[.36,.36,P('羽毛全白','All-white feathers'),0,0],[.78,.86,P('長尾羽也是白的','White train too'),0,0],[.075,.078,P('眼睛還有顏色','Eyes still coloured'),-28,20]]}
];
const ALB_SUM=P('白化：控制黑色素的基因發生突變，身體做不出黑色素。不是曬白的，也不會傳染。','Albinism: a gene for melanin is mutated, so the body cannot make melanin. It is not caused by the sun and cannot be caught.');
const PEA_SUM=P('白孔雀的眼睛還有顏色，所以不是白化；牠是另一種突變（白變），只有羽毛缺少色素。','The white peacock\'s eyes still have colour, so it is not albino: a different mutation (leucism) leaves only its feathers without pigment.');
const ZOOM_NAMES=[P('放大毛和皮膚','Zoom in on hair and skin'),P('照著基因做黑色素','Making melanin from the gene'),P('毛和皮膚的顏色','The colour of hair and skin')];
const ZOOM_SHORT=[P('放大','Zoom'),P('做黑色素','Melanin'),P('顏色','Colour')];
const IMPACT_SHORT=[P('白化麻雀','Albino sparrow'),P('白孔雀','White peacock'),P('鐮形血球','Sickle cells')];
function drawAlbKey(c,s){
  panel(c,20,20,300,560);
  text(c,P('突變','Mutation'),36,52,22,C.yellow);
  wrap(c,P('遺傳物質（DNA）發生改變，叫做突變；性狀可能跟著改變。','A mutation is a change in the genetic material (DNA). It may change a trait.'),36,86,250,22,C.white,28);
  ANIMALS.forEach((a,i)=>{const y=186+i*104,on=i===s.animal&&s.view!==2;
    D.round(c,30,y,280,96,10,on?rgba(C.yellow,.16):'rgba(11,26,21,.45)',on?C.yellow:C.edge);
    place(c,a.white,36,y+6,104,84);
    text(c,a.name,150,y+38,22,on?C.yellow:C.white);text(c,a.sub,150,y+72,22,C.muted);D.hit(30,y,280,96,'animal',i);});
  D.round(c,30,500,280,76,10,'rgba(11,26,21,.45)',C.edge);
  granule(c,52,524,1,1.6);text(c,P('黑色素','Melanin'),72,532,22,C.white);
  melCell(c,52,560,.62);text(c,P('製造黑色素的細胞','Melanin-making cell'),72,566,22,C.white);
}
function cmpLayout(a){
  if(a.normal==='buffalo_cow.png'){const k=Math.min(568/(865+30+431),290/590),cw=865*k,ch=590*k,kw=431*k,kh=349*k,yb=352;return[{x:356,y:yb-ch,w:cw,h:ch},{x:356+cw+30*k,y:yb-kh,w:kw,h:kh}];}
  return[fitRect(a.normal,362,86,266,266),fitRect(a.white,652,86,266,266)];
}
function drawCompare(c,s,t){
  const a=ANIMALS[s.animal],[rn,rw]=cmpLayout(a),since=t-(s.since||0);
  drawIn(c,a.normal,rn);drawIn(c,a.white,rw);
  text(c,a.nLabel,rn.x+rn.w/2,rn.y-14,22,C.white,'center');text(c,a.wLabel,rw.x+rw.w/2,rw.y-14,22,C.yellow,'center');
  wrap(c,a.nNote,366,400,262,22,C.muted,30);
  a.clues.forEach(([fx,fy,p,dx,dy],i)=>{const v=clamp((since-.4-i*.6)/.4);if(v<=0)return;c.save();c.globalAlpha=v;const x=rw.x+fx*rw.w,y=rw.y+fy*rw.h;
    if(dx||dy){circle(c,x,y,8,null,C.yellow,2.5);const d=Math.hypot(dx,dy);line(c,[[x+dx*8/d,y+dy*8/d],[x+dx*(d-13)/d,y+dy*(d-13)/d]],C.yellow,2);pulse(c,x,y,t+i*.3,C.yellow,8);marker(c,x+dx,y+dy,i+1,null);}
    else marker(c,x,y,i+1,t+i*.3);
    marker(c,664,392+i*30,i+1,null,12);text(c,p,684,400+i*30,22,C.white);c.restore();});
  D.round(c,352,476,576,100,12,'rgba(11,26,21,.55)',rgba(a.albino?MUT:C.cyan,.75));
  wrap(c,a.albino?ALB_SUM:PEA_SUM,368,506,530,22,C.white,30);
}
// Magnified skin and hair (local coordinates, lens radius ZR).
const ZX=[490,790],ZY=300,ZR=112,SURF=-30;
const EPI=(()=>{const R=rng(17),o=[];for(let i=0;i<34;i++)o.push([-ZR+8+R()*(2*ZR-16),SURF+4+R()*22]);return o;})();
const MEL_PATH=[[-22,54],[2,46],[12,30],[22,-30],[34,-ZR-4]];
function lens(c,cx,cy,rr,alb,k,u,t,a){
  const sc=rr/ZR;c.save();c.translate(cx,cy);c.scale(sc,sc);
  c.beginPath();c.arc(0,0,ZR,0,TAU);c.clip();
  c.fillStyle='#0d1f19';c.fillRect(-ZR,-ZR,2*ZR,2*ZR);
  const mel=alb?0:k===0?0:k===1?u:1;
  c.fillStyle=alb?'#f2c9bd':mixHex('#f0d2bb','#b48466',mel);c.fillRect(-ZR,SURF,2*ZR,32);
  c.fillStyle=alb?'#ecb4a6':'#d6a68c';c.fillRect(-ZR,SURF+32,2*ZR,ZR);
  const cap=[];for(let x=-ZR;x<=ZR;x+=6)cap.push([x,72+7*Math.sin(x/26)]);
  sline(c,cap,rgba('#c2303f',alb?.95:.5),11);sline(c,cap,rgba('#ff8f8f',alb?.55:.22),3);
  if(!alb&&mel>0)EPI.forEach(([x,y],i)=>{if(i/EPI.length<mel)granule(c,x,y);});
  ellipse(c,10,16,26,52,alb?'#e9aa9b':'#c79479','rgba(90,50,40,.55)',2);
  const hairCol=alb?'#f3ecdd':mixHex('#f3ecdd','#3b2b22',mel);
  c.beginPath();c.moveTo(-2,56);c.lineTo(26,-ZR-8);c.lineTo(48,-ZR-8);c.lineTo(20,56);c.closePath();c.fillStyle=hairCol;c.fill();
  c.strokeStyle=alb?'rgba(120,100,80,.7)':'rgba(242,236,217,.6)';c.lineWidth=1.8;c.stroke();
  ellipse(c,9,58,16,12,hairCol,'rgba(90,50,40,.6)',1.8);
  melCell(c,-22,54,1,alb&&k>=1,t);
  if(!alb&&k===1)D.flow(c,MEL_PATH,t*3,12,(cc,x,y)=>granule(cc,x,y));
  if(!alb&&k>=2)for(let i=0;i<9;i++){const v=i/9,y=50-v*150;granule(c,9+v*28+((i%2)?4:-4),y,.9);}
  if(alb&&k>=1){c.save();c.setLineDash([3,3]);ellipse(c,2,44,5,3.6,null,rgba(C.white,.7),1.5);c.restore();
    c.save();c.globalAlpha=.6+.4*Math.sin(t*4);line(c,[[8,30],[20,42]],MUT,3.5);line(c,[[20,30],[8,42]],MUT,3.5);c.restore();}
  text(c,a.hair,-86,-58,22,C.white);
  text(c,P('皮膚','Skin'),-100,36,22,C.deep);
  c.restore();
  circle(c,cx,cy,rr,null,alb?C.yellow:rgba(C.white,.75),4);
}
function drawZoom(c,s,t){
  const a=ANIMALS[s.animal];if(!a.albino)return drawEyes(c,s,t);
  const {k,u,held}=stageClock(s,t,3,5);s.shown=k;
  const grow=k===0?ease(held?u:clamp(u*1.6)):1,g=held?u:clamp(u*1.3);
  [0,1].forEach(j=>{const alb=j===1,file=alb?a.white:a.normal,x=ZX[j],r=place(c,file,x-125,30,250,100),col=alb?C.yellow:C.white;
    const [fx,fy]=a.spot[j],sx=r.x+fx*r.w,sy=r.y+fy*r.h,bs=22,rr=ZR*grow;
    c.save();c.strokeStyle=col;c.lineWidth=2.5;c.strokeRect(sx-bs/2,sy-bs/2,bs,bs);c.restore();
    c.save();c.setLineDash([6,5]);line(c,[[sx-bs/2,sy+bs/2],[x-rr*.71,ZY-rr*.71]],rgba(col,.6),2);line(c,[[sx+bs/2,sy+bs/2],[x+rr*.71,ZY-rr*.71]],rgba(col,.6),2);c.restore();
    if(rr>2)lens(c,x,ZY,rr,alb,k,g,t,a);
    text(c,P('黑色素基因（示意）','Melanin gene (model)'),x,442,22,C.muted,'center');
    strip(c,alb?'CTGTCGT':'CTGACGT',x,452,alb?3:-1);
    if(k>=1){const v=k===1?clamp(g*2):1;c.save();c.globalAlpha=v;text(c,alb?P('做不出黑色素','No melanin made'):P('做得出黑色素','Melanin made'),x,514,24,alb?MUT:C.green,'center');c.restore();}
    if(k>=2){const v=held?u:clamp(u*2);c.save();c.globalAlpha=v;text(c,a.res[j],x,552,22,C.white,'center');c.restore();}
  });
}
const EYES=[{file:'eye_peacock_blue.png',name:P('藍孔雀','Blue peacock'),note:P('眼睛有色素','Pigmented eyes'),col:C.green},
 {file:'eye_peacock_white.png',name:P('白孔雀','White peacock'),note:P('眼睛也有色素','Also pigmented'),col:C.cyan},
 {file:'eye_sparrow_albino.png',name:P('白化麻雀','Albino sparrow'),note:P('沒有黑色素','No melanin'),col:MUT}];
function drawEyes(c,s,t){
  text(c,P('看眼睛分辨：是不是白化？','Check the eyes: albino or not?'),640,66,24,C.yellow,'center');
  EYES.forEach((e,i)=>{const x=450+i*190,y=226,r=82;
    c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.fillStyle='#0d1f19';c.fillRect(x-r,y-r,2*r,2*r);place(c,e.file,x-r,y-r,2*r,2*r);c.restore();
    circle(c,x,y,r,null,e.col,4);pulse(c,x,y,t+i*.4,e.col,24);
    text(c,e.name,x,y+r+38,22,C.white,'center');text(c,e.note,x,y+r+72,22,e.col,'center');});
  wrap(c,P('白化：全身做不出黑色素，連眼睛也沒有，透出血色而呈紅色。白孔雀的眼睛有色素，只有羽毛是白的，所以不是白化，是另一種突變（白變）。','Albinism: no melanin anywhere, not even in the eyes, so they look red. The white peacock\'s eyes are pigmented and only its feathers are white, so it is not albino but a different mutation (leucism).'),360,440,540,22,C.white,30);
}
const IMPACT=[
 {file:'sparrow_albino.png',title:P('白化麻雀','Albino sparrow'),tag:P('在野外：不利','Harmful'),col:MUT,text:P('太顯眼，容易被老鷹等天敵發現；眼睛也怕強光。','Easy for hawks to spot; bright light hurts its eyes.')},
 {file:'peacock_white.png',title:P('白孔雀','White peacock'),tag:P('被人類留下','Kept by people'),col:C.green,text:P('在野外一樣顯眼，但人們喜歡牠，特地飼養、繁殖。','Easy to spot too, but people like it and breed it.')},
 {file:'rbc_sickle.png',title:P('鐮形血球','Sickle cells (extra)'),tag:P('補充：看環境','Depends'),col:C.cyan,text:P('只帶一個鐮形基因的人，在瘧疾流行的地方，比較不容易得重症。','One sickle gene protects against malaria.')}];
function hawk(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-46,-4);c.quadraticCurveTo(-22,-20,-6,-2);c.lineTo(0,8);c.lineTo(6,-2);c.quadraticCurveTo(22,-20,46,-4);c.quadraticCurveTo(20,-6,4,6);c.lineTo(0,14);c.lineTo(-4,6);c.quadraticCurveTo(-20,-6,-46,-4);c.closePath();
  c.fillStyle='#0b1a15';c.fill();c.strokeStyle=rgba(C.muted,.8);c.lineWidth=1.6;c.stroke();c.restore();}
function drawImpact(c,s,t){
  const {k}=stageClock(s,t,3,5);s.shown=k;
  IMPACT.forEach((q,i)=>{const x=350+i*198,y=32,w=186,h=440,on=i===k;
    c.save();c.globalAlpha=on?1:.55;D.round(c,x,y,w,h,14,on?rgba(q.col,.12):'rgba(11,26,21,.55)',on?q.col:C.edge);
    const r=place(c,q.file,x+8,y+10,w-16,150);
    if(i===0&&on){hawk(c,r.x+r.w*.74+10*Math.sin(t*.9),r.y+22+5*Math.sin(t*2),.62);pulse(c,r.x+r.w*.42,r.y+r.h*.42,t,MUT,18);}
    if(i===1&&on)pulse(c,r.x+r.w*.25,r.y+r.h*.3,t,C.green,18);
    if(i===2&&on)pulse(c,r.x+r.w*.3,r.y+r.h*.24,t,C.cyan,14);
    let yy=y+192;yy+=wrap(c,q.title,x+12,yy,w-40,22,C.white,28)-14;
    const pw=measure(c,q.tag,22)+28;pill(c,q.tag,x+w/2-pw/2,yy,{color:q.col,active:on,minX:x+4,maxX:x+w-4});
    wrap(c,q.text,x+12,yy+74,w-46,22,C.white,28);c.restore();});
  wrap(c,P('突變可能有害、有利，也可能沒有明顯影響；好不好，常常要看生活的環境。','A mutation may harm, help or make no clear difference; whether it is good often depends on where the organism lives.'),360,506,540,22,C.yellow,30);
}
function drawAlbino(c,s,t){drawAlbKey(c,s);panel(c,340,20,600,560);if(s.view===1)drawZoom(c,s,t);else if(s.view===2)drawImpact(c,s,t);else drawCompare(c,s,t);}
const ZOOM_TEXT=(a,k)=>[
  P(`把${a.hair[0]}和皮膚放大：每根${a.hair[0]}都從皮膚裡長出來，根部有會製造黑色素的細胞。`,`Zoom in: each ${a.hair[1].toLowerCase()} grows out of the skin, and at its root sit cells that make melanin.`),
  P('一般的動物：基因正常，細胞做出黑色素（褐色小顆粒），送進毛和皮膚。白化的動物：這個基因有一個地方改變了（橘色），做不出黑色素。','Normal animal: the gene works, and the cell makes melanin (brown grains) and passes it into hair and skin. Albino animal: one spot in this gene has changed (orange), so no melanin is made.'),
  P('有黑色素，毛和皮膚就是深色的；沒有黑色素，毛是白的，皮膚和眼睛透出血管的顏色，看起來粉紅。','With melanin, hair and skin are dark; without it, hair is white and the skin and eyes show the colour of the blood vessels, so they look pink.')][k];
const IMPACT_TEXT=[
  P('白化麻雀：在野外太顯眼，容易被天敵發現；沒有黑色素保護，眼睛也怕強光。這個突變在野外是不利的。','Albino sparrow: it stands out in the wild, so predators find it easily, and without melanin bright light hurts its eyes. In the wild this mutation is harmful.'),
  P('白孔雀：在野外一樣顯眼，但人們喜歡白色的孔雀，特地飼養、繁殖，所以被保留下來。人類也會利用突變，培育新品種。','White peacock: just as easy to spot in the wild, but people like white peafowl and breed them, so the mutation is kept. People also use mutations to breed new varieties.'),
  P('補充：鐮形血球的基因若只帶一個，在瘧疾流行的地方比較不容易得重症；兩個都帶，卻會得鐮形血球貧血症。同一個突變，好不好要看環境。','Extra: carrying one sickle-cell gene protects against severe malaria where malaria is common, yet two copies cause sickle-cell anaemia. Whether a mutation is good depends on the environment.')];

// ── Tab 2: gene and chromosome mutations ───────────────────────────────────
const HB='CTGACTCCTGAGGAGAAGTCT',HBI=10; // HBB codons 3–9; codon 6 GAG → GTG gives sickle-cell haemoglobin
const GENE_NAMES=[P('正常的血紅素基因','The normal haemoglobin gene'),P('一個字母換了','One letter changes'),P('血紅素跟著改變','The haemoglobin changes'),P('紅血球變成鐮刀形','Sickle-shaped red cells')];
const GENE_SHORT=[P('正常','Normal'),P('換一個字','One letter'),P('血紅素','Haemoglobin'),P('鐮刀形','Sickle')];
const CHR_NAMES=[P('正常：46 條','Normal: 46'),P('多了一條第 21 號','An extra chromosome 21'),P('為什麼會多一條？','Why is there an extra one?'),P('兩種突變比一比','The two kinds compared')];
const CHR_SHORT=[P('46 條','46'),P('47 條','47'),P('原因','Why'),P('比一比','Compare')];
function helix(c,x0,x1,yc,t,amp=18){
  const s1=[],s2=[];for(let x=x0;x<=x1;x+=3){const a=(x-x0)/15+t*1.2;s1.push([x,yc+amp*Math.sin(a)]);s2.push([x,yc-amp*Math.sin(a)]);}
  for(let x=x0+4;x<x1;x+=9){const a=(x-x0)/15+t*1.2;line(c,[[x,yc+amp*Math.sin(a)],[x,yc-amp*Math.sin(a)]],rgba(C.white,.3),2);}
  sline(c,s1,C.white,3.5);sline(c,s2,C.muted,3.5);
}
function drawScaleKey(c,s,t){
  panel(c,20,20,300,560);
  text(c,P('突變有大有小','Big and small mutations'),36,52,22,C.yellow);
  rod(c,52,170,124,.42,CH,{w:18,seed:4});
  c.save();c.strokeStyle=C.yellow;c.lineWidth=2;c.strokeRect(40,126,24,22);c.restore();
  c.save();c.setLineDash([5,5]);line(c,[[64,126],[100,96]],rgba(C.yellow,.6),2);line(c,[[64,148],[100,146]],rgba(C.yellow,.6),2);c.restore();
  D.round(c,166,98,74,46,8,rgba(C.yellow,.16),C.yellow);
  helix(c,100,304,121,t);
  text(c,'DNA',202,86,22,C.white,'center');
  text(c,P('基因','Gene'),203,176,22,C.yellow,'center');text(c,P('DNA 上的一段','a stretch of DNA'),203,206,22,C.white,'center');
  text(c,P('染色體','Chromosome'),30,270,22,C.white);
  const on=s.kind==='gene';
  [[286,136,'gene',P('基因突變','Gene mutation'),P('DNA 上的一小段改變，可能只差一個字母。例：鐮形血球','A small part of DNA changes, e.g. sickle cells.')],
   [432,144,'chrom',P('染色體突變','Chromosome mutation'),P('染色體的數目或結構改變。例：唐氏症','Chromosome number or shape changes, e.g. Down syndrome.')]].forEach(([y,h,key,title,desc])=>{const act=key===s.kind;
    D.round(c,30,y,280,h,10,act?rgba(C.yellow,.16):'rgba(11,26,21,.45)',act?C.yellow:C.edge);
    text(c,title,44,y+32,22,act?C.yellow:C.white);wrap(c,desc,44,y+64,240,22,C.white,28);D.hit(30,y,280,h,'kind',key);});
  return on;
}
// Red-cell outline: circle (g = 0) morphing into a crescent (g = 1); same point count both ways.
const NPT=40,RC=[640,322],RR=104,SC=[640,432],SR=170,SPAN=1.0,TH=58;
function cellPts(g){const o=[];
  for(let i=0;i<NPT;i++){const w=i/(NPT-1),ca=Math.PI+w*Math.PI,sa=-Math.PI/2+(w-.5)*2*SPAN;o.push([mix(RC[0]+RR*Math.cos(ca),SC[0]+SR*Math.cos(sa),g),mix(RC[1]+RR*Math.sin(ca),SC[1]+SR*Math.sin(sa),g)]);}
  for(let i=0;i<NPT;i++){const w=1-i/(NPT-1),ca=(i/(NPT-1))*Math.PI,sa=-Math.PI/2+(w-.5)*2*SPAN,sr=SR-TH*Math.sin(Math.PI*w);o.push([mix(RC[0]+RR*Math.cos(ca),SC[0]+sr*Math.cos(sa),g),mix(RC[1]+RR*Math.sin(ca),SC[1]+sr*Math.sin(sa),g)]);}
  return o;}
const HBD=(()=>{const R=rng(61),o=[];for(let f=0;f<3;f++)for(let j=0;j<12;j++){let x,y;do{x=(R()*2-1)*86;y=(R()*2-1)*86;}while(x*x+y*y>86*86);
  const a=-Math.PI/2+(j/11-.5)*2*SPAN*.8,w=.5+(a+Math.PI/2)/(2*SPAN),th=TH*Math.sin(Math.PI*w),r=SR-th/2+(f-1)*th*.27;
  o.push({x:RC[0]+x,y:RC[1]+y,fx:SC[0]+r*Math.cos(a),fy:SC[1]+r*Math.sin(a),f,j,ph:R()*TAU});}return o;})();
function redCell(c,g,t,dots){
  const pts=cellPts(g);c.save();c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();
  const gr=c.createRadialGradient(RC[0],mix(RC[1],300,g),10,RC[0],mix(RC[1],300,g),mix(RR,170,g));gr.addColorStop(0,'#b9313f');gr.addColorStop(.5,'#e05a63');gr.addColorStop(.85,'#d64352');gr.addColorStop(1,'#9e2533');
  c.fillStyle=gr;c.fill();c.strokeStyle='#5c1520';c.lineWidth=3;c.stroke();c.restore();
  if(g<1){c.save();c.globalAlpha=1-g;ellipse(c,RC[0],RC[1],RR*.45,RR*.42,'rgba(140,28,43,.45)',null);c.restore();}
  if(!dots)return;
  const g2=clamp((g-.0)/.7);
  if(g2>.85){c.save();c.globalAlpha=(g2-.85)/.15;for(let f=0;f<3;f++){const fib=HBD.filter(d=>d.f===f).sort((a,b)=>a.j-b.j).map(d=>[d.fx,d.fy]);sline(c,fib,rgba(MUT,.8),3);}c.restore();}
  HBD.forEach(d=>{const x=mix(d.x+3*Math.sin(t*2+d.ph),d.fx,g2),y=mix(d.y+3*Math.cos(t*1.7+d.ph),d.fy,g2);circle(c,x,y,6,mixHex('#ffc6bd','#fb923c',dots==='mut'?clamp(g2*1.5):0),'#5c1520',1.2);});
}
function drawGene(c,s,t){
  const {k,u,held}=stageClock(s,t,4,6);s.shown=k;const g=held?u:clamp(u*1.4);
  text(c,P('血紅素基因的一小段（真實序列）','Part of the haemoglobin gene (real sequence)'),640,56,22,C.muted,'center');
  const w=24,gap=3,x0=640-(HB.length*(w+gap)-gap)/2;
  [...HB].forEach((ch,i)=>{let L=ch,fill=C.white,sx=1;
    if(i===HBI&&k>=1){const f=k===1?clamp(g*1.6):1;sx=Math.abs(Math.cos(Math.PI*f));L=f<.5?'A':'T';fill=f<.5?C.white:MUT;}
    tile(c,x0+i*(w+gap),76,L,fill,w,30,sx);});
  const tx=x0+HBI*(w+gap)+w/2;
  if(k>=1){const v=k===1?clamp(g*2-.4):1;c.save();c.globalAlpha=v;arrow(c,tx,136,tx,112,MUT,3);pill(c,P('A → T','A → T'),tx-48,138,{color:MUT,active:true});c.restore();if(k===1)pulse(c,tx,91,t,MUT,18);}
  if(k<=2){
    redCell(c,k===2?clamp((g-.35)/.65):0,t,k===2?'mut':'ok');
    const cap=k===2?P('缺氧時，改變的血紅素黏成一長條（橘色），把紅血球拉成鐮刀形。','With little oxygen the changed haemoglobin (orange) sticks into long strands and pulls the cell into a sickle.'):P('紅血球：裡面裝滿血紅素（小圓點），負責運送氧。','A red blood cell is full of haemoglobin (dots), which carries oxygen.');
    wrap(c,cap,640,478,540,22,k===2?C.yellow:C.white,30,'center');
  }else{
    place(c,'rbc_normal.png',356,212,276,220);place(c,'rbc_sickle.png',648,212,276,220);
    text(c,P('正常：圓盤狀','Normal discs'),494,204,22,C.green,'center');text(c,P('鐮刀形','Sickle-shaped'),786,204,22,MUT,'center');
    [P('① 很硬、容易破 → 貧血','① Stiff and fragile → anaemia'),P('② 容易卡在微血管 → 疼痛、器官受傷','② Gets stuck in capillaries → pain, organ damage'),P('③ 隱性遺傳疾病：鐮形血球貧血症','③ A recessive disease: sickle-cell anaemia')].forEach((p,i)=>{const v=held?clamp(u*2-i*.3):clamp(u*3-i*.4);c.save();c.globalAlpha=v;text(c,p,372,462+i*32,22,C.white);c.restore();});
    text(c,P('只改了一個字母！','Just one letter changed!'),640,566,24,C.yellow,'center');
  }
}
// Karyotype (female, 44+XX) with room for a third chromosome 21. Sizes as in the human-inheritance unit.
const CHR=[[249,.5],[242,.39],[198,.46],[190,.26],[182,.27],[171,.35],[159,.38],[145,.31],[138,.32],[134,.3],[135,.39],[133,.27],[114,.15],[107,.16],[102,.17],[90,.4],[83,.29],[80,.22],[59,.45],[64,.43],[47,.25],[51,.27]];
const XC=[156,.39],KS=.4,KROWS=[[0,5],[5,12],[12,18],[18,23]];
const KARYO=(()=>{const out=[];let top=84;
  KROWS.forEach(([a,b])=>{const ids=[];for(let i=a;i<b;i++)ids.push(i);const spec=i=>i<22?CHR[i]:XC;
    const ups=ids.map(i=>spec(i)[0]*KS*spec(i)[1]),dns=ids.map(i=>spec(i)[0]*KS*(1-spec(i)[1]));
    const cy=top+Math.max(...ups),bottom=cy+Math.max(...dns),x0=640-((ids.length-1)*74)/2;
    ids.forEach((i,j)=>out.push({i,x:x0+j*74,y:cy,L:spec(i)[0]*KS,cen:spec(i)[1],label:i<22?String(i+1):'XX',ly:bottom+26,top:cy-spec(i)[0]*KS*spec(i)[1]}));
    top=bottom+44;});return out;})();
function drawKaryo(c,s,t,k,g){
  const extra=k===1?ease(g*1.2):1;
  text(c,k===0?P('46 條＝23 對（女生 44＋XX）','46 = 23 pairs (female, 44+XX)'):P('47 條：第 21 號有三條','47: three copies of chromosome 21'),640,56,24,k===0?C.white:C.yellow,'center');
  KARYO.forEach(q=>{const is21=q.i===20,sh=is21?8*(k>=1?extra:0):0;
    rod(c,q.x-8-sh,q.y,q.L,q.cen,CH,{seed:q.i*2+1});rod(c,q.x+8-sh,q.y,q.L,q.cen,CH,{seed:q.i*2+2});
    text(c,q.label,q.x,q.ly,22,is21&&k>=1?C.yellow:C.muted,'center');
    if(is21&&k>=1){const ex=mix(900,q.x+16,extra),ey=mix(110,q.y,extra);if(extra>=1)glow(c,ex,ey,30,MUT,.35+.15*Math.sin(t*3));rod(c,ex,ey,q.L,q.cen,MUT,{seed:77});
      if(extra>=1){c.save();c.strokeStyle=C.yellow;c.lineWidth=2.5;c.beginPath();c.roundRect(q.x-34,q.top-8,68,q.ly+10-q.top+8,10);c.stroke();c.restore();}}});
}
function drawWhy(c,s,t,g){
  const p1=clamp(g/.35),p2=clamp((g-.35)/.3),p3=clamp((g-.68)/.32),L=58;
  text(c,P('形成配子的細胞（只畫第 21 號）','A cell making gametes (only chromosome 21 shown)'),640,56,22,C.muted,'center');
  circle(c,520,150,58,'rgba(242,236,217,.06)',C.edge,3);
  const A=[[506,150],[534,150]],G1=[[416,306],[444,306]];
  A.forEach((p,i)=>{rod(c,p[0],p[1],L,.25,CH,{w:12,seed:40+i,alpha:.28});rod(c,mix(p[0],G1[i][0],ease(p1)),mix(p[1],G1[i][1],ease(p1)),L,.25,CH,{w:12,seed:40+i});});
  c.save();c.globalAlpha=p1;arrow(c,488,198,446,250,C.muted,3);arrow(c,552,198,594,250,C.muted,3);
  circle(c,430,306,48,'rgba(242,236,217,.06)',MUT,3);circle(c,610,306,48,'rgba(242,236,217,.06)',C.edge,3);
  text(c,P('兩條沒有分開','Did not separate'),430,384,22,MUT,'center');text(c,P('少了一條','None'),610,384,22,C.muted,'center');c.restore();
  c.save();c.globalAlpha=p2;text(c,P('另一個正常的配子','A normal gamete'),830,238,22,C.white,'center');circle(c,830,306,48,'rgba(242,236,217,.06)',C.edge,3);rod(c,830,306,L,.25,CH,{w:12,seed:44});
  text(c,P('（一條）','(one copy)'),830,384,22,C.muted,'center');c.restore();
  c.save();c.globalAlpha=p3;arrow(c,490,336,592,428,C.white,3);arrow(c,796,350,684,432,C.white,3);
  glow(c,634,466,70,MUT,.25);circle(c,634,466,56,'rgba(242,236,217,.08)',C.yellow,3);[-20,0,20].forEach((dx,i)=>rod(c,634+dx,466,L*.8,.25,CH,{w:11,seed:50+i}));
  text(c,P('受精卵：三條 → 唐氏症','Zygote: three copies → Down syndrome'),634,552,22,C.yellow,'center');c.restore();
}
function drawCompareScale(c,s,t,g){
  D.round(c,352,76,280,380,14,'rgba(11,26,21,.55)',C.edge);D.round(c,648,76,280,380,14,'rgba(11,26,21,.55)',C.edge);
  text(c,P('基因突變','Gene mutation'),492,114,24,C.yellow,'center');text(c,P('染色體突變','Chromosome mutation'),788,114,22,C.yellow,'center');
  strip(c,'CCTGTGG',492,190,4);pulse(c,520,205,t,MUT,16);
  text(c,P('只改一個字母','One letter changes'),492,268,22,C.white,'center');text(c,P('例：鐮形血球','e.g. sickle cells'),492,302,22,C.muted,'center');
  [-38,0,38].forEach((dx,i)=>rod(c,788+dx,240,150,.25,i===2?MUT:CH,{w:24,seed:60+i}));
  if(g>0)glow(c,826,240,60,MUT,.18*g);
  text(c,P('多了一整條','One extra chromosome'),788,372,22,C.white,'center');text(c,P('上面有兩百多個基因','with over 200 genes'),788,404,22,C.muted,'center');text(c,P('例：唐氏症','e.g. Down syndrome'),788,436,22,C.muted,'center');
  wrap(c,P('染色體突變一次改變很多基因；基因突變只改一小段，但改到重要的地方，一樣會造成嚴重的疾病。','A chromosome mutation changes many genes at once; even a one-letter gene mutation can cause serious disease.'),640,494,540,22,C.white,30,'center');
}
function drawChrom(c,s,t){const {k,u,held}=stageClock(s,t,4,7);s.shown=k;const g=held?u:clamp(u*1.3);
  if(k<=1)drawKaryo(c,s,t,k,g);else if(k===2)drawWhy(c,s,t,g);else drawCompareScale(c,s,t,g);}
function drawScale(c,s,t){drawScaleKey(c,s,t);panel(c,340,20,600,560);if(s.kind==='gene')drawGene(c,s,t);else drawChrom(c,s,t);}
const GENE_TEXT=[
  P('紅血球裡裝滿血紅素，負責運送氧。上面是製造血紅素的基因其中一小段：DNA 上 A、T、C、G 的排列順序，就是遺傳訊息。','Red blood cells are full of haemoglobin, which carries oxygen. Above is a small part of the gene for haemoglobin: the order of A, T, C and G in DNA is the inherited information.'),
  P('這一段只有一個字母改變：A 變成 T。DNA 上一小段的改變，叫做基因突變。','Only one letter changes: A becomes T. A change in a small part of the DNA is a gene mutation.'),
  P('照著改變的基因做出來的血紅素不一樣：缺氧時會黏成一長條，把紅血球拉長、變形。','Haemoglobin made from the changed gene is different: with little oxygen it sticks into long strands that stretch and bend the cell.'),
  P('紅血球變成鐮刀形：很硬、容易破，造成貧血；還會卡在微血管，讓身體疼痛、器官受傷。這就是鐮形血球貧血症，一種隱性遺傳疾病。','The red cells become sickle-shaped: stiff and fragile, causing anaemia, and they get stuck in capillaries, causing pain and organ damage. This is sickle-cell anaemia, a recessive genetic disease.')];
const CHR_TEXT=[
  P('這是一個女生體細胞的染色體圖譜：46 條，兩兩成對，共 23 對。','This is the karyotype of a female body cell: 46 chromosomes in 23 pairs.'),
  P('唐氏症的人，第 21 號染色體有三條，體細胞共 47 條。染色體的數目或結構改變，叫做染色體突變。','In Down syndrome there are three copies of chromosome 21, 47 chromosomes in all. A change in the number or structure of chromosomes is a chromosome mutation.'),
  P('大多是形成卵或精子時，第 21 號染色體沒有分開，一個配子拿到兩條；它和正常的配子（一條）受精，受精卵就有三條。','Usually chromosome 21 fails to separate while an egg or sperm forms, so one gamete gets two copies; when it joins a normal gamete (one copy), the zygote has three.'),
  P('基因突變可能只改一個字母；染色體突變卻是一整條，第 21 號上就有兩百多個基因，所以會影響身體很多地方。','A gene mutation may change one letter; a chromosome mutation involves a whole chromosome, and chromosome 21 carries over 200 genes, so many parts of the body are affected.')];

// ── Tab 3: causes, and whether the change is passed on ─────────────────────
const CAUSES=[{name:P('紫外線','Ultraviolet (UV)'),sub:P('陽光裡就有','in sunlight'),col:'#a78bfa',phrase:P('太陽的紫外線','Sunlight\'s UV')},
 {name:P('X 光等輻射','X-rays, radiation'),sub:P('照射太多','too much of it'),col:C.white,phrase:P('X 光等輻射','Radiation such as X-rays')},
 {name:P('某些化學物質','Some chemicals'),sub:P('例：香菸的煙','e.g. in smoke'),col:'#9fb3a6',phrase:P('香菸的煙裡的化學物質','A chemical in cigarette smoke')},
 {name:P('自然發生','By chance'),sub:P('複製 DNA 時抄錯','a DNA copying slip'),col:C.yellow,phrase:P('細胞複製 DNA 時抄錯','A copying slip as the cell copied its DNA')}];
const CAUSE_NAMES=[P('DNA 改變了','The DNA changes'),P('細胞分裂','The cell divides'),P('受精','Fertilization'),P('下一代','The next generation')];
const CAUSE_SHORT=[P('改變','Change'),P('分裂','Divide'),P('受精','Fertilize'),P('下一代','Next gen.')];
function causeIcon(c,i,x,y,s=1,t=0){c.save();c.translate(x,y);c.scale(s,s);
  if(i===0){for(let k=0;k<8;k++){const a=k*TAU/8+t*.3;line(c,[[Math.cos(a)*13,Math.sin(a)*13],[Math.cos(a)*19,Math.sin(a)*19]],C.yellow,3);}circle(c,0,0,10,C.yellow,null);}
  else if(i===1){circle(c,0,0,17,C.yellow,C.ink,2);c.fillStyle=C.ink;for(let k=0;k<3;k++){const a=-Math.PI/2+k*TAU/3;c.beginPath();c.moveTo(Math.cos(a-.52)*4,Math.sin(a-.52)*4);c.arc(0,0,14,a-.52,a+.52);c.lineTo(Math.cos(a+.52)*4,Math.sin(a+.52)*4);c.closePath();c.fill();}circle(c,0,0,3,C.ink,null);}
  else if(i===2){c.beginPath();c.moveTo(-5,-16);c.lineTo(5,-16);c.lineTo(5,-4);c.lineTo(15,14);c.lineTo(-15,14);c.lineTo(-5,-4);c.closePath();c.fillStyle='rgba(159,179,166,.3)';c.fill();c.strokeStyle=C.white;c.lineWidth=2.5;c.stroke();
    [[0,-22,5],[7,-27,4],[-3,-31,3]].forEach(([dx,dy,r],k)=>circle(c,dx,dy-mod(t*.5+k*.3)*3,r,'rgba(159,179,166,.75)',null));}
  else{[-12,0,12].forEach((dx,k)=>{D.round(c,dx-5,-14,10,10,2,C.white,null);D.round(c,dx-5,4,10,10,2,k===1?MUT:C.white,null);});}
  c.restore();}
function drawCauseKey(c,s,t){
  panel(c,20,20,300,560);
  text(c,P('突變的原因','Causes of mutation'),36,52,22,C.yellow);
  CAUSES.forEach((q,i)=>{const y=70+i*92,on=i===s.cause;
    D.round(c,30,y,280,84,10,on?rgba(C.yellow,.16):'rgba(11,26,21,.45)',on?C.yellow:C.edge);
    causeIcon(c,i,64,y+42,1,t);text(c,q.name,100,y+34,22,on?C.yellow:C.white);text(c,q.sub,100,y+66,22,C.muted);D.hit(30,y,280,84,'cause',i);});
  wrap(c,P('紫外線、輻射和某些化學物質，會讓突變更容易發生。','UV, radiation and some chemicals make mutations more likely.'),36,466,250,22,C.white,28);
  circle(c,44,549,8,MUT,C.ink,1.5);text(c,P('DNA 改變的地方','DNA changed here'),60,556,22,C.white);
}
// Layout of the right panel
const SOMA={x:352,y:72,w:290,h:228},GERM={x:654,y:72,w:274,h:228};
const SKIN=(()=>{const o=[],x0=SOMA.x+(SOMA.w-(6*44-4))/2,y0=SOMA.y+10;for(let r=0;r<4;r++)for(let j=0;j<6;j++)o.push({x:x0+j*44+20,y:y0+r*44+20});return o;})();
const SKIN_HIT=[2,3,8,9],GC=[[712,170],[791,170],[870,170]],SPX=[708,768,828,888],SPY=342,EGGP=[470,404];
const KID=(()=>{const o=[],x0=640-(12*40-4)/2;for(let r=0;r<2;r++)for(let j=0;j<12;j++)o.push({x:x0+j*40+18,y:488+r*40+18});return o;})();
function skinCell(c,x,y,mark,t,a=1){c.save();c.globalAlpha*=a;D.round(c,x-20,y-20,40,40,9,'rgba(233,201,183,.2)',rgba('#e9c9b7',.7));circle(c,x,y,7,mark?MUT:'#9d8fcf',null);c.restore();if(mark&&a>=1)glow(c,x,y,16,MUT,.3);}
function spermAt(c,x,y,mark,t,a=1){c.save();c.globalAlpha*=a;const pts=[];for(let i=0;i<=14;i++){const v=i/14;pts.push([x+12+v*30,y+Math.sin(v*7-t*8)*4*v]);}sline(c,pts,rgba(SPERM,.85),2.5);
  ellipse(c,x,y,13,9,'rgba(85,233,255,.2)',SPERM,2.5);circle(c,x-1,y,4,mark?MUT:'#9d8fcf',null);c.restore();}
function hazard(c,s,t,tx,ty,box,g){
  const i=s.cause;
  if(i===3){const v=clamp(g*1.6),bx=box.x+box.w-206,by=24;c.save();c.globalAlpha=v;
    c.save();c.setLineDash([5,4]);line(c,[[bx+50,by+44],[tx,ty-14]],rgba(C.yellow,.8),2);c.restore();
    D.round(c,bx,by,196,44,10,'rgba(11,26,21,.92)',C.yellow);
    for(let j=0;j<6;j++){D.round(c,bx+10+j*15,by+7,12,12,2,C.white,null);if(j<=Math.floor(g*9))D.round(c,bx+10+j*15,by+24,12,12,2,j===3&&g>.5?MUT:C.white,null);}
    text(c,P('抄錯了','A slip!'),bx+110,by+30,22,C.yellow);c.restore();if(g>.6)pulse(c,tx,ty,t,C.yellow,12);return;}
  const ix=box.x+box.w-34,iy=52;causeIcon(c,i,ix,iy,1,t);
  const v=clamp(g*1.5),ex=mix(ix,tx,v),ey=mix(iy,ty,v);
  if(i===0)for(let k=-1;k<=1;k++){const pts=[];for(let q=0;q<=20;q++){const w=q/20,x=mix(ix,ex,w),y=mix(iy,ey,w),nx=-(ty-iy),ny=tx-ix,nl=Math.hypot(nx,ny);pts.push([x+nx/nl*(k*8+4*Math.sin(w*14-t*10)),y+ny/nl*(k*8+4*Math.sin(w*14-t*10))]);}sline(c,pts,rgba(CAUSES[0].col,.9),2.5);}
  else if(i===1){c.save();c.setLineDash([10,6]);c.lineDashOffset=-t*40;for(let k=-1;k<=1;k++)line(c,[[ix+k*6,iy+8],[ex+k*3,ey]],rgba(C.white,.85),2.5);c.restore();}
  else D.flow(c,[[ix,iy-12],[mix(ix,tx,.5)+20,mix(iy,ty,.5)-10],[tx,ty]],t*2,7,(cc,x,y)=>{const d=Math.hypot(x-ix,y-iy)/Math.hypot(tx-ix,ty-iy);if(d<=v+.02)circle(cc,x,y,5,'rgba(159,179,166,.85)',null);});
}
function drawCause(c,s,t){
  drawCauseKey(c,s,t);panel(c,340,20,600,560);
  const {k,u,held}=stageClock(s,t,4,5.5);s.shown=k;const g=held?u:clamp(u*1.3),germ=s.where==='germ';
  [[SOMA,P('體細胞（例：皮膚）','Body cells (skin)'),!germ],[GERM,P('生殖細胞（睪丸、卵巢）','Germ cells (gonads)'),germ]].forEach(([b,lab,on])=>{D.round(c,b.x,b.y,b.w,b.h,14,'rgba(11,26,21,.45)',on?C.yellow:C.edge);text(c,lab,b.x+b.w/2,b.y+b.h-14,22,on?C.yellow:C.muted,'center');});
  // skin cells
  const skinMarked=i=>{if(germ)return false;const n=SKIN_HIT.indexOf(i);if(n<0)return false;if(n===0)return k>0||g>.6;return k>1||(k===1&&g>n*.28);};
  SKIN.forEach((q,i)=>skinCell(c,q.x,q.y,skinMarked(i),t));
  // germ cells
  GC.forEach(([x,y],i)=>{const mark=germ&&i===0&&(k>0||g>.6);circle(c,x,y,30,'rgba(242,236,217,.1)',rgba(C.muted,.8),2.5);circle(c,x,y,10,mark?MUT:'#9d8fcf',null);if(mark)glow(c,x,y,22,MUT,.3);});
  if(k===0){const tgt=germ?{x:GC[0][0],y:GC[0][1]}:SKIN[SKIN_HIT[0]];hazard(c,s,t,tgt.x,tgt.y,germ?GERM:SOMA,g);}
  // sperm leave the germ cell (k >= 1): from the mutated one if the mutation is in the germ line
  const src=germ?GC[0]:GC[1],spMark=j=>germ&&(j===0||j===2);
  if(k>=1){text(c,P('精子','Sperm'),692,SPY+8,22,SPERM,'right');
    SPX.forEach((x,j)=>{if(k>=2&&j===0)return;const v=k===1?ease(clamp(g*1.4-j*.12)):1;if(v<=0)return;spermAt(c,mix(src[0],x,v),mix(src[1],SPY,v),spMark(j),t,v);});}
  // egg and fertilization
  if(k>=1){const zy=k>=2;text(c,P('卵','Egg'),EGGP[0]-48,EGGP[1]+8,22,EGG,'right');
    circle(c,EGGP[0],EGGP[1],36,'rgba(244,114,182,.12)',EGG,3);
    const fert=k===2?ease(clamp(g*1.3)):k>2?1:0;
    if(k===2&&fert<1)spermAt(c,mix(SPX[0],EGGP[0]+30,fert),mix(SPY,EGGP[1]-6,fert),spMark(0),t);
    circle(c,EGGP[0],EGGP[1],10,zy&&germ&&fert>=1?MUT:'#9d8fcf',null);if(zy&&germ&&fert>=1)glow(c,EGGP[0],EGGP[1],22,MUT,.3);
    if(zy&&fert>=1)text(c,P('受精卵','Zygote'),EGGP[0]+50,EGGP[1]+8,22,C.white);}
  // next generation
  if(k===3){text(c,P('下一代：受精卵分裂出全身的細胞','Next generation: every cell comes from the zygote'),640,472,22,C.muted,'center');
    KID.forEach((q,i)=>{const d=Math.hypot(q.x-EGGP[0],q.y-EGGP[1]),a=clamp((held?u*1.5:u*2)-d/700);if(a>0)skinCell(c,q.x,q.y,germ,t,a);});}
}
const CAUSE_TEXT=(s,k)=>{const q=CAUSES[s.cause],germ=s.where==='germ';
  return[
   germ?P(`${q.phrase[0]}，讓睪丸裡一個會形成精子的細胞，DNA 改變了（橘點）。卵巢裡形成卵的細胞也一樣可能發生。`,`${q.phrase[1]} changed the DNA of one sperm-making cell in the testes (orange dot). The same can happen in egg-making cells in the ovaries.`)
       :P(`${q.phrase[0]}，讓一個皮膚細胞的 DNA 改變了（橘點）。${s.cause===0?'紫外線照不進身體裡面，所以照不到生殖細胞。':''}`,`${q.phrase[1]} changed the DNA of one skin cell (orange dot).${s.cause===0?' UV cannot reach inside the body, so it cannot reach germ cells.':''}`),
   germ?P('這個細胞形成精子時，改變也被複製下來：一部分精子帶著改變（橘點），一部分沒有。','As this cell makes sperm, the change is copied: some sperm carry it (orange dot) and some do not.')
       :P('這個皮膚細胞分裂，新的皮膚細胞也帶著同樣的改變；但是形成精子的細胞沒有改變，做出的精子都正常。','The skin cell divides and its new cells carry the same change; but the sperm-making cells are unchanged, so all the sperm are normal.'),
   germ?P('如果剛好是帶著改變的精子受精，受精卵就帶有這個突變；若是別的精子受精，就不會。','If a sperm carrying the change fertilizes the egg, the zygote has the mutation; if another sperm does, it does not.')
       :P('精子和卵受精，受精卵沒有這個改變。','Sperm and egg meet, and the zygote does not have the change.'),
   germ?P('受精卵分裂出全身的細胞，每個細胞都帶有這個突變：生殖細胞的突變可能遺傳給下一代。','The zygote divides into all the cells of the body, and every one carries the mutation: a germ-cell mutation can be passed on.')
       :P('下一代全身的細胞都沒有這個改變：體細胞的突變不會遺傳。不過皮膚細胞的突變累積太多，可能變成皮膚癌，所以要防曬。','None of the next generation\'s cells has the change: body-cell mutations are not inherited. But too many mutations in skin cells can lead to skin cancer, so protect your skin from the sun.')][k];};

// ── Tab 4: carriers, genetic diseases and counselling ──────────────────────
const FAM_NAMES=[P('爸媽都是帶因者 Aa','Both parents are carriers (Aa)'),P('形成配子：A、a 分開','Gametes: A and a separate'),P('精卵隨機結合','Random fertilization'),P('小牛的四種可能','Four possible calves')];
const FAM_SHORT=[P('爸媽','Parents'),P('配子','Gametes'),P('受精','Fertilize'),P('小牛','Calves')];
const KIDS=[['A','A'],['A','a'],['a','A'],['a','a']];
const PAR=[{x:352,label:P('爸爸','Father'),col:SPERM,gx:[462,570],flip:true},{x:648,label:P('媽媽','Mother'),col:EGG,gx:[748,858],flip:false}];
const KX=[415,565,715,865],GY=216,KY=256,HEAD=[0,0,.43,.6];
function chip(c,x,y,letter,fill,size=30){D.round(c,x-size/2,y-size/2,size,size,7,fill,C.ink);c.save();c.font=MONO(Math.max(22,Math.round(size*.78)));c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(letter,x,y+1);c.restore();}
function gamete(c,x,y,letter,col,r=24){circle(c,x,y,r,rgba(col,.16),col,3);c.save();c.font=MONO(28);c.fillStyle=C.white;c.textAlign='center';c.textBaseline='middle';c.fillText(letter,x,y+1);c.restore();}
function pairChips(c,x,y,items,size=30,gap=4){const list=items[0][0]==='A'||items[1][0]!=='A'?items:[items[1],items[0]];const w=2*size+gap;list.forEach(([l,col],i)=>chip(c,x-w/2+size/2+i*(size+gap),y,l,col,size));}
function dashed(c,x,y,w,h,label){c.save();c.setLineDash([8,6]);D.round(c,x,y,w,h,12,'rgba(11,26,21,.35)',rgba(C.muted,.5));c.restore();if(label)text(c,label,x+w/2,y+h/2+8,22,C.muted,'center');}
function drawCarrierKey(c,s){
  panel(c,20,20,300,560);
  text(c,P('白化基因','The albinism gene'),36,52,22,C.yellow);
  chip(c,50,90,'A',C.white,30);text(c,P('正常的基因（顯性）','Normal (dominant)'),74,98,22,C.green);
  chip(c,50,132,'a',C.white,30);text(c,P('突變的基因（隱性）','Mutated (recessive)'),74,140,22,MUT);
  [['AA',P('灰黑色','Dark grey'),null,'buffalo_calf_dark.png'],['Aa',P('灰黑色','Dark grey'),P('帶因者','carrier'),'buffalo_calf_dark.png'],['aa',P('白化','Albino'),null,'buffalo_calf_albino.png']].forEach(([g,lab,sub,file],i)=>{const y=162+i*96;
    D.round(c,30,y,280,88,10,'rgba(11,26,21,.45)',g==='aa'?rgba(MUT,.7):C.edge);
    pairChips(c,70,y+44,[[g[0],C.white],[g[1],C.white]],28);place(c,file,106,y+8,84,72);
    text(c,lab,198,sub?y+36:y+52,22,g==='aa'?MUT:C.white);if(sub)text(c,sub,198,y+68,22,C.cyan);});
  D.round(c,30,456,280,120,10,'rgba(85,233,255,.08)',rgba(C.cyan,.65));
  text(c,P('帶因者','Carrier'),44,484,22,C.cyan);
  wrap(c,P('帶有隱性的突變基因，自己卻沒有表現出來。','Has the recessive allele but does not show it.'),44,512,240,22,C.white,26);
}
function drawFamily(c,s,t){
  const {k,u,held}=stageClock(s,t,4,5);s.shown=k;
  PAR.forEach(p=>{D.round(c,p.x,32,280,148,14,'rgba(11,26,21,.55)',rgba(p.col,.7));
    drawIn(c,'buffalo_cow.png',fitRect('buffalo_cow.png',p.x+8,38,160,136,HEAD),{crop:HEAD,flip:p.flip,alpha:k>=2?.55:1});
    text(c,p.label,p.x+222,66,22,p.col,'center');
    c.save();c.globalAlpha=k>=1?.35:1;chip(c,p.x+204,110,'A',C.white,32);chip(c,p.x+240,110,'a',C.white,32);c.restore();
    text(c,P('帶因者','Carrier'),p.x+222,160,22,C.cyan,'center');});
  if(k>=1){text(c,P('精子','Sperm'),PAR[0].gx[0]-32,GY+8,22,SPERM,'right');text(c,P('卵','Eggs'),PAR[1].gx[0]-32,GY+8,22,EGG,'right');}
  if(k===0){PAR.forEach((p,j)=>pulse(c,p.x+222,110,t+j*.6,p.col,30));dashed(c,420,GY-26,480,52,P('形成配子時，A 和 a 會怎樣？','What happens to A and a?'));}
  else PAR.forEach(p=>['A','a'].forEach((l,j)=>{const v=k===1?ease((held?u:u*1.4)*1.25-j*.2):1,from=[p.x+204+j*36,110],to=[p.gx[j],GY];
    if(v<1){line(c,[from,[mix(from[0],to[0],v),mix(from[1],to[1],v)]],rgba(p.col,.35),2);chip(c,mix(from[0],to[0],v),mix(from[1],to[1],v),l,p.col,30);}else gamete(c,to[0],to[1],l,p.col,24);}));
  const g2=k===2?(held?u:clamp(u*1.3)):k>2?1:0,g3=k===3?(held?u:clamp(u*1.5)):0;
  KX.forEach((x,i)=>{const [fs,fe]=KIDS[i],rec=fs==='a'&&fe==='a',het=fs!==fe;
    if(k<2){dashed(c,x-68,KY,136,264,P('？','?'));return;}
    D.round(c,x-68,KY,136,264,14,'rgba(11,26,21,.55)',k===3&&rec?rgba(MUT,.8):C.edge);
    const v=clamp((g2*1.35-i*.18)/.5),sx=PAR[0].gx[fs==='A'?0:1],ex=PAR[1].gx[fe==='A'?0:1],dom1=fs==='A'||fe!=='A';
    const slotS=[x+(dom1?-17:17),KY+26],slotE=[x+(dom1?17:-17),KY+26];
    if(v<1){line(c,[[sx,GY+24],[mix(sx,slotS[0],v),mix(GY,slotS[1],v)]],rgba(SPERM,.35),2);line(c,[[ex,GY+24],[mix(ex,slotE[0],v),mix(GY,slotE[1],v)]],rgba(EGG,.35),2);
      if(v>0){chip(c,mix(sx,slotS[0],v),mix(GY,slotS[1],v),fs,SPERM,30);chip(c,mix(ex,slotE[0],v),mix(GY,slotE[1],v),fe,EGG,30);}}
    else pairChips(c,x,KY+26,[[fs,SPERM],[fe,EGG]],30);
    if(k===3){const a=clamp(g3*1.4-i*.12);if(rec&&a>.9)glow(c,x,KY+110,74,MUT,.22+.08*Math.sin(t*3));
      place(c,rec?'buffalo_calf_albino.png':'buffalo_calf_dark.png',x-62,KY+50,124,120,{alpha:a});
      c.save();c.globalAlpha=a;text(c,rec?P('白化','Albino'):P('灰黑色','Dark grey'),x,KY+208,22,rec?MUT:C.white,'center');text(c,het?P('帶因者 1/4','carrier 1/4'):'1/4',x,KY+244,22,het?C.cyan:C.muted,'center');c.restore();}
    else text(c,P('？','?'),x,KY+150,26,C.muted,'center');
  });
  if(k===3)text(c,P('灰黑色：白化＝3：1','Dark grey : albino = 3 : 1'),640,560,24,C.yellow,'center');
  else text(c,P('精子帶的是青色，卵帶的是粉紅色。','Cyan came in the sperm, pink in the egg.'),640,560,22,C.muted,'center');
}
const COUNSEL_NAMES=[P('人類的遺傳疾病','Human genetic diseases'),P('隱性遺傳疾病','Recessive diseases'),P('染色體異常','A chromosome change'),P('遺傳諮詢','Genetic counselling')];
const COUNSEL_SHORT=[P('疾病','Diseases'),P('隱性','Recessive'),P('染色體','Chromosome'),P('諮詢','Counselling')];
const DISEASES=[
 {name:P('白化症','Albinism'),tag:P('隱性遺傳','Recessive'),text:P('做不出黑色素：皮膚、毛髮很白，怕強光。','No melanin: pale skin and hair.'),rec:true},
 {name:P('鐮形血球貧血症','Sickle cells'),tag:P('隱性遺傳','Recessive'),text:P('紅血球變成鐮刀形，容易破。','Red cells bend into sickles and break.'),rec:true},
 {name:P('地中海型貧血','Thalassaemia'),tag:P('隱性遺傳','Recessive'),text:P('血紅素做得不夠；臺灣較常見。','Low haemoglobin; common in Taiwan.'),rec:true},
{name:P('唐氏症','Down syndrome'),tag:P('染色體多一條','Chromosomes'),text:P('第 21 號染色體有三條。','Three copies of chromosome 21.'),rec:false}];
function diseaseIcon(c,i,x,y,t){
  if(i===0){c.save();c.beginPath();c.moveTo(x-24,y);c.quadraticCurveTo(x,y-20,x+24,y);c.quadraticCurveTo(x,y+20,x-24,y);c.closePath();c.fillStyle='#f2ecd9';c.fill();c.strokeStyle=C.ink;c.lineWidth=2;c.stroke();circle(c,x,y,9,'#e6a3a3',null);circle(c,x,y,4,'#b2474f',null);c.restore();}
  else if(i===1){c.save();c.beginPath();c.arc(x,y+26,30,-Math.PI/2-1,-Math.PI/2+1);c.arc(x,y+30,22,-Math.PI/2+.95,-Math.PI/2-.95,true);c.closePath();c.fillStyle='#d64352';c.fill();c.strokeStyle='#5c1520';c.lineWidth=2;c.stroke();c.restore();}
  else if(i===2){circle(c,x,y,18,'#e98a91','#7a2a33',2);circle(c,x,y,8,'#f4c2c4',null);}
  else[-12,0,12].forEach((dx,k)=>rod(c,x+dx,y,34,.25,k===2?MUT:CH,{w:9,seed:90+k}));
}
function drawCounsel(c,s,t){
  const {k,u,held}=stageClock(s,t,4,6);s.shown=k;const g=held?u:clamp(u*1.4);
  DISEASES.forEach((q,i)=>{const x=352+(i%2)*294,y=34+Math.floor(i/2)*170,on=(k===1&&q.rec)||(k===2&&!q.rec),a=k===0?clamp(g*2.2-i*.3):(k===3?.5:on?1:.45);
    c.save();c.globalAlpha=a;D.round(c,x,y,282,160,12,on?rgba(C.yellow,.12):'rgba(11,26,21,.55)',on?C.yellow:C.edge);
    diseaseIcon(c,i,x+42,y+52,t);text(c,q.name,x+82,y+42,22,on?C.yellow:C.white);text(c,q.tag,x+82,y+74,22,q.rec?MUT:C.cyan);
    wrap(c,q.text,x+16,y+108,236,22,C.white,26);c.restore();});
  if(k===1||k===2){const v=held?u:clamp(u*2),p=k===1?P('爸媽都是帶因者（Aa × Aa）→ 孩子 1/4','Aa × Aa → 1/4 each child'):P('大多不是從爸媽遺傳來的','Usually not inherited'),w=measure(c,p,22)+28;
    c.save();c.globalAlpha=v;pill(c,p,932-w,370,{color:k===1?MUT:C.cyan,active:true,minX:470});c.restore();}
  const on3=k===3;c.save();c.globalAlpha=k===3?1:.55;
  text(c,P('遺傳諮詢','Genetic counselling'),360,414,24,on3?C.cyan:C.white);
  [[P('① 家族病史','① History'),P('家裡有沒有人得過遺傳疾病','Any genetic disease in the family?')],
   [P('② 做檢查','② Tests'),P('婚前健康檢查、產前檢查','Before marriage or in pregnancy')],
   [P('③ 推算機率','③ The chances'),P('說明風險，討論怎麼準備','Explain the risk and how to prepare')]].forEach(([h,d],i)=>{const x=352+i*196,v=on3?clamp(g*2-i*.35):1;
    D.round(c,x,428,184,148,12,on3&&v>=1?rgba(C.cyan,.12):'rgba(11,26,21,.55)',on3&&v>0?C.cyan:C.edge);
    text(c,h,x+12,458,22,C.cyan);wrap(c,d,x+12,490,156,22,C.white,26);if(i<2)arrow(c,x+184,500,x+196,500,on3?C.cyan:C.edge,3);});
  c.restore();
}
function drawCarrier(c,s,t){drawCarrierKey(c,s);panel(c,340,20,600,560);if(s.view===1)drawCounsel(c,s,t);else drawFamily(c,s,t);}
const FAM_TEXT=[
  P('水牛爸爸、媽媽都是灰黑色，基因型都是 Aa：A 讓牠們做得出黑色素，突變的 a 藏在身上沒有表現，所以牠們是帶因者。','Both buffalo parents are dark grey and Aa: A lets them make melanin, while the mutated a is carried but not shown. They are carriers.'),
  P('形成精子和卵時，成對的 A 和 a 分開：每個精子、每個卵只帶一個，帶 A 或帶 a 的機率各一半。','When sperm and eggs form, the pair separates: each sperm or egg carries A or a, half and half.'),
  P('精子和卵隨機結合，有四種機率相同的組合：AA、Aa、aA、aa。','Sperm and egg meet at random, giving four equally likely combinations: AA, Aa, aA and aa.'),
  P('只有 aa 的小牛做不出黑色素，是白化，機率 1/4；Aa 的小牛看起來正常，但和爸媽一樣是帶因者。所以兩隻灰黑色的水牛，也可能生出白化小牛。','Only an aa calf cannot make melanin and is albino, with chance 1/4; Aa calves look normal but are carriers like their parents. So two dark grey buffalo can have an albino calf.')];
const COUNSEL_TEXT=[
  P('由突變造成、可以從爸媽遺傳給孩子的疾病，叫做遺傳疾病。這裡是幾個例子。','Diseases caused by mutations that can pass from parents to children are genetic diseases. Here are a few examples.'),
  P('白化症、鐮形血球貧血症、地中海型貧血都是隱性遺傳疾病：爸媽都是帶因者時看起來都正常，孩子仍有 1/4 的機率得病。','Albinism, sickle-cell anaemia and thalassaemia are recessive: two carrier parents look healthy, yet each child has a 1/4 chance of the disease.'),
  P('唐氏症是第 21 號染色體多了一條，大多不是從爸媽遺傳來的，而是形成卵或精子時染色體沒有分開；媽媽年紀越大，機率越高。產前檢查可以檢查胎兒的染色體。','Down syndrome is an extra chromosome 21. It is usually not inherited but happens when chromosomes fail to separate as an egg or sperm forms; the chance rises with the mother\'s age. Prenatal tests can check the baby\'s chromosomes.'),
  P('遺傳諮詢：醫師依家族病史和檢查結果，推算孩子得到遺傳疾病的機率，說明可以怎麼準備，再由家人自己決定。','Genetic counselling: a doctor uses the family history and test results to work out the chance of a genetic disease and explains the options; the family then decides.')];

// ── tabs ───────────────────────────────────────────────────────────────────
const tabs=[
{id:'albino',title:P('小水牛怎麼是白的？','Why is the calf white?'),sub:P('突變與白化','Mutation and albinism'),
 hook:P('水牛媽媽全身灰黑，生下的小水牛卻是粉白色的，眼睛的顏色也很淡。牠是曬太陽曬白的嗎？還是身上少了什麼？','The mother buffalo is dark grey, yet her calf is pinkish white with very pale eyes. Did the sun bleach it, or is something missing from its body?'),
 body:P('先選一種動物「比一比」，找出白化的線索；再「放大看」毛和皮膚裡的黑色素；最後想想，這個突變是好是壞。','Pick an animal and compare to find the clues of albinism; then zoom in on the melanin in hair and skin; finally, think about whether the mutation helps or harms.'),
 reading:P('白化：控制黑色素的基因發生突變，身體做不出黑色素。毛、皮膚很白；皮膚和眼睛透出血管的顏色，所以常看起來粉紅。沒有黑色素擋光，白化的動物和人都怕強光、視力較差。人類也有白化症，要特別防曬、保護眼睛。\n\n補充：白色不一定是白化。白孔雀的眼睛還有顏色，只有羽毛缺少色素，是另一種突變（白變）。封面的白老虎做不出橘色的色素，但黑色條紋還在、眼睛是藍色的，也是一種突變，不是白化。\n\n補充：人類也會利用突變。用輻射或化學物質讓作物發生突變，再從中挑出產量高、抗病的新品種，叫做誘變育種。','Albinism: a gene for melanin is mutated, so the body cannot make melanin. Hair and skin are very pale, and the skin and eyes show the colour of the blood vessels, so they often look pink. Without melanin to block light, albino animals and people are sensitive to bright light and see less well. People with albinism need extra sun protection for their skin and eyes.\n\nExtra: white is not always albino. A white peacock\'s eyes still have colour and only its feathers lack pigment: a different mutation (leucism). The white tiger on the cover cannot make orange pigment, but its black stripes remain and its eyes are blue: also a mutation, but not albinism.\n\nExtra: people use mutations too. Crops are exposed to radiation or chemicals to cause mutations, and the useful ones (higher yield, disease resistance) are selected as new varieties: mutation breeding.'),
 closure:P('突變是遺傳物質（DNA）的改變。控制黑色素的基因突變，身體就做不出黑色素，毛、皮膚變白，眼睛顏色變淡：這就是白化。突變對生物可能有害、有利，或沒有明顯影響。','A mutation is a change in the genetic material (DNA). When a gene for melanin is mutated, the body cannot make melanin: hair and skin turn white and the eyes pale. This is albinism. A mutation may harm, help, or make no clear difference.'),
 quiz:[
  {q:P('白化動物的毛色很白，主要是因為？','Why is an albino animal\'s coat so white?'),options:[P('黑色素基因突變，做不出色素','A melanin gene mutated, so no melanin'),P('曬太陽曬得太久，毛就漂白了','Too much sunshine bleached its coat white'),P('吃的食物缺少色素，毛變白了','Its food lacked the pigment it needs'),P('被其他白化動物傳染，變白了','It caught it from another albino animal')],answer:0,why:P('白化是遺傳物質的改變：控制黑色素的基因突變，身體就做不出黑色素。','Albinism is a change in genetic material: with the melanin gene mutated, no melanin is made.'),hint:P('切到「放大看」，看兩邊的黑色素基因有什麼不同。','Switch to "Zoom in" and compare the two melanin genes.')},
  {q:P('下列哪一個是「突變」？','Which of these is a mutation?'),options:[P('鳥長大後換了一身新的羽毛','New feathers as a young bird grows up'),P('毛被人用染髮劑染成了白色','A fur coat that was dyed white by hand'),P('遺傳物質（DNA）改變了','A change in the genetic material (DNA)'),P('曬了太陽以後皮膚變得很黑','Skin tanning after a day in the sun')],answer:2,why:P('突變是遺傳物質的改變；染色、換羽、曬黑都沒有改變 DNA。','A mutation changes the genetic material; dyeing, moulting and tanning do not change the DNA.'),hint:P('想一想：哪一個改變了 DNA？','Which one changes the DNA?')},
  {q:P('關於突變對生物的影響，哪一個說法正確？','Which statement about the effects of mutations is correct?'),options:[P('可能有害、有利或沒有影響','It may harm, help, or do nothing'),P('對生物來說一定都是有害的','It always harms the living things'),P('對生物來說一定都是有利的','It always helps the living things'),P('每一種突變都能馬上看得出來','It can always be seen right away')],answer:0,why:P('白化麻雀在野外不利，白孔雀卻被人類留下；好不好常常要看環境。','The albino sparrow is harmed in the wild, yet people keep white peafowl; it often depends on the environment.'),hint:P('切到「好還是壞」，比一比三張卡片。','Switch to "Good or bad?" and compare the three cards.')}
 ],
 sources:[],init:()=>({running:true,animal:0,view:0,since:0,phase:-1,start:0}),
 controls:s=>{const out=[];if(s.view!==2)out.push(choice(P('選一種動物','Pick an animal'),'animal',ANIMALS.map((a,i)=>[i,a.name])));
   out.push(choice(P('觀察','View'),'view',[[0,P('比一比','Compare')],[1,P('放大看','Zoom in')],[2,P('好還是壞','Good or bad?')]]));
   if(s.view===1&&ANIMALS[s.animal].albino)out.push(steps(ZOOM_SHORT));if(s.view===2)out.push(steps(IMPACT_SHORT));return out;},
 act(s,k,v){s[k]=v;s.since=s.elapsed;if(k==='view'){s.phase=-1;s.start=s.elapsed;}if(k==='phase'||k==='animal')s.start=s.elapsed;},
 explain:s=>{const a=ANIMALS[s.animal];
   if(s.view===2){const k=s.phase<0?(s.shown||0):s.phase;return{title:P('突變是好是壞？','Is a mutation good or bad?'),text:IMPACT_TEXT[k]};}
   if(s.view===1){if(!a.albino)return{title:P('看眼睛分辨','Check the eyes'),text:P('藍孔雀和白孔雀的眼睛都有色素；白化麻雀的眼睛沒有黑色素。要判斷是不是白化，眼睛是重要的線索。','Both the blue and the white peacock have pigmented eyes; the albino sparrow\'s eyes have no melanin. The eyes are a key clue to albinism.')};
     const k=s.phase<0?(s.shown||0):s.phase;return{title:ZOOM_NAMES[k],text:ZOOM_TEXT(a,k)};}
   return{title:P(`${a.nLabel[0]}和${a.wLabel[0]}`,`${a.nLabel[1]} and ${a.wLabel[1].toLowerCase()}`),text:a.albino?P(`${a.wLabel[0]}：${a.hair[0]}很白，皮膚透出血色而呈粉紅，眼睛顏色很淡；全身都缺少黑色素，這就是白化。`,`The ${a.wLabel[1].toLowerCase()} has very pale ${a.coat[1]}, pink skin where blood shows through and very pale eyes: its whole body lacks melanin. This is albinism.`):P('白孔雀的羽毛全白，但眼睛還有顏色，所以不是白化；牠是另一種突變（白變），只有羽毛缺少色素。','The white peacock\'s feathers are all white, but its eyes still have colour, so it is not albino: a different mutation (leucism) leaves only its feathers without pigment.')};},
 draw:drawAlbino},
{id:'scale',title:P('改一個字差多少？','One letter, big change?'),sub:P('基因與染色體的突變','Gene and chromosome mutations'),
 hook:P('「我要吃麵」改一個字，變成「我要吃藥」，意思就差很多。遺傳訊息只改一個字母，也會差那麼多嗎？','Change one character in a sentence and the meaning can change completely. If inherited information changes by one letter, can it matter that much?'),
 body:P('選「基因突變」或「染色體突變」，按連續播放：看一個字母的改變怎麼讓紅血球變形，多一條染色體又是什麼樣子。','Choose gene or chromosome mutation and play: see how one changed letter reshapes a red blood cell, and what an extra chromosome looks like.'),
 reading:P('基因是 DNA 上的一段，DNA 上 A、T、C、G 的排列順序就是遺傳訊息。\n\n鐮形血球貧血症：血紅素基因裡只有一個字母改變（A 變成 T），做出的血紅素在缺氧時會黏在一起，把紅血球拉成鐮刀形。鐮形紅血球很硬、容易破（貧血），還會卡在微血管。這是隱性遺傳疾病。\n\n唐氏症：第 21 號染色體有三條，體細胞共 47 條。大多是形成卵或精子時，第 21 號染色體沒有分開；媽媽年齡越大，機率越高。唐氏症的人學習、發展通常比較慢，有些人有心臟等健康問題；經過早期療育和家人、學校的支持，很多人可以上學、工作。\n\n補充：本頁的 DNA 字母是血紅素基因的真實序列（只畫一條、一小段）。高中會學到，每三個字母決定一個胺基酸，這個突變把一個胺基酸換掉了。','A gene is a stretch of DNA, and the order of A, T, C and G is the inherited information.\n\nSickle-cell anaemia: a single letter in the haemoglobin gene changes (A to T). With little oxygen, the haemoglobin made from it sticks together and pulls the red cell into a sickle. Sickle cells are stiff and fragile (anaemia) and get stuck in capillaries. It is a recessive genetic disease.\n\nDown syndrome: three copies of chromosome 21, 47 chromosomes in all. Usually chromosome 21 fails to separate while an egg or sperm forms; the chance rises with the mother\'s age. People with Down syndrome usually learn and develop more slowly, and some have heart or other health problems; with early support from family and school, many go to school and work.\n\nExtra: the DNA letters here are the real sequence of the haemoglobin gene (one strand, a short stretch). In senior high you will learn that every three letters stand for one amino acid; this mutation swaps one amino acid.'),
 closure:P('突變有大有小：基因突變是 DNA 上一小段改變，像鐮形血球只改了一個字母；染色體突變是染色體的數目或結構改變，像唐氏症多了一條第 21 號染色體。','Mutations can be small or large: a gene mutation changes a small part of the DNA, as in sickle cells where one letter changed; a chromosome mutation changes the number or structure of chromosomes, as in Down syndrome with an extra chromosome 21.'),
 quiz:[
  {q:P('鐮形血球貧血症是哪一種改變造成的？','What causes sickle-cell anaemia?'),options:[P('被細菌感染而造成的疾病','A bacterial infection of the blood cells'),P('多一條第 21 號染色體','An extra copy of chromosome 21 in cells'),P('少了一條性染色體造成的','A missing sex chromosome in the cells'),P('血紅素基因的一個字母改變','A haemoglobin gene letter was changed')],answer:3,why:P('血紅素基因裡 A 變成 T，這是基因突變。','In the haemoglobin gene A became T: a gene mutation.'),hint:P('選「基因突變」，看第二步換了什麼。','Choose "Gene mutation" and look at step 2.')},
  {q:P('唐氏症的人，體細胞有幾條染色體？','How many chromosomes are in a body cell of a person with Down syndrome?'),options:[P('47 條','47'),P('46 條','46'),P('45 條','45'),P('23 條','23')],answer:0,why:P('第 21 號染色體多了一條：46＋1＝47。','One extra chromosome 21: 46 + 1 = 47.'),hint:P('選「染色體突變」，數一數第 21 號有幾條。','Choose "Chromosome mutation" and count the copies of 21.')},
  {q:P('關於基因突變和染色體突變，哪一個正確？','Which is true about gene and chromosome mutations?'),options:[P('一條染色體有很多基因，多一條影響大','A chromosome has many genes, so an extra one matters'),P('基因的大小一定比染色體大很多很多倍','A gene is always much bigger than a whole chromosome'),P('只改變一個字母，一定是完全不會有影響','Changing one letter can never matter at all in a gene'),P('突變只會發生在染色體的數目變化上面','Mutations only ever change the chromosome number')],answer:0,why:P('第 21 號染色體上就有兩百多個基因；但只改一個字母也可能造成鐮形血球貧血症。','Chromosome 21 carries over 200 genes; yet one letter can still cause sickle-cell anaemia.'),hint:P('看左邊的圖：染色體、DNA、基因誰包含誰？','Look at the diagram on the left: which contains which?')}
 ],
 sources:[],init:()=>({running:true,kind:'gene',phase:-1,start:0}),
 controls:s=>[choice(P('看哪一種','Which kind'),'kind',[['gene',P('基因突變','Gene mutation')],['chrom',P('染色體突變','Chromosome mutation')]]),steps(s.kind==='gene'?GENE_SHORT:CHR_SHORT)],
 act(s,k,v){s[k]=v;if(k==='kind'){s.phase=-1;s.start=s.elapsed;}if(k==='phase')s.start=s.elapsed;},
 explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;return s.kind==='gene'?{title:GENE_NAMES[k],text:GENE_TEXT[k]}:{title:CHR_NAMES[k],text:CHR_TEXT[k]};},
 draw:drawScale},
{id:'cause',title:P('曬傷會遺傳嗎？','Is sunburn inherited?'),sub:P('突變的原因與遺傳','Causes and inheritance'),
 hook:P('在海邊曬了一整天，紫外線會讓皮膚細胞的 DNA 受傷、改變。那這個改變，會不會傳給以後的孩子？','A whole day on the beach: UV damages and changes the DNA in skin cells. Will that change be passed on to your future children?'),
 body:P('選一種原因，再選突變發生在皮膚細胞還是生殖細胞，看這個改變會不會傳到下一代。','Choose a cause, then whether the mutation happens in a skin cell or a germ cell, and see whether the change reaches the next generation.'),
 reading:P('突變可能自然發生：細胞分裂前要複製 DNA，偶爾會抄錯。紫外線、X 光等輻射，以及某些化學物質（例如香菸的煙裡的物質），會讓突變更容易發生。\n\n體細胞（皮膚、肺、肝……）的突變只留在自己身上，不會傳給孩子；但是突變累積太多，細胞可能不受控制地一直分裂，變成癌症。所以要防曬、不吸菸；醫院照 X 光的劑量很低，但也不必要時就不照。\n\n生殖細胞（睪丸裡形成精子、卵巢裡形成卵的細胞）的突變，可能進入精子或卵；剛好是那個精子或卵受精，突變就會傳給下一代，而且下一代全身的細胞都有。','Mutations can happen by chance: before dividing, a cell copies its DNA and sometimes makes a slip. UV, radiation such as X-rays, and some chemicals (such as those in cigarette smoke) make mutations more likely.\n\nA mutation in a body cell (skin, lung, liver…) stays in that person and is not passed to children; but if mutations build up, cells may divide out of control and become cancer. So protect your skin from the sun and do not smoke; hospital X-rays use a low dose, but avoid them when they are not needed.\n\nA mutation in a germ cell (the cells in the testes that make sperm, or in the ovaries that make eggs) can enter a sperm or egg; if that sperm or egg is the one at fertilization, the mutation is passed on, and every cell of the child carries it.'),
 closure:P('突變可能自然發生，紫外線、輻射、某些化學物質會增加突變的機會。體細胞的突變不會遺傳；生殖細胞的突變進入精子或卵，才可能傳給下一代。','Mutations can happen by chance, and UV, radiation and some chemicals make them more likely. Body-cell mutations are not inherited; only a germ-cell mutation that enters a sperm or egg can be passed to the next generation.'),
 quiz:[
  {q:P('下列哪一種突變，可能遺傳給下一代？','Which mutation could be passed to the next generation?'),options:[P('睪丸裡形成精子的細胞突變','A mutated sperm-making cell in the testes'),P('曬太陽使皮膚細胞發生突變','A skin cell that was mutated by sunlight'),P('照 X 光使肺部細胞突變了','A lung cell that was mutated by an X-ray'),P('抽菸使口腔的細胞發生突變','A mouth cell that was mutated by cigarettes')],answer:0,why:P('只有生殖細胞的突變能進入精子或卵；皮膚、肺、口腔都是體細胞。','Only germ-cell mutations can enter sperm or eggs; skin, lung and mouth cells are body cells.'),hint:P('切換「發生在」，看看哪一種會傳到下一代。','Switch where it happens and see which one reaches the next generation.')},
  {q:P('下列哪一個「不是」會增加突變機會的因素？','Which of these does NOT make mutations more likely?'),options:[P('喝足夠的水','Drinking enough water every day'),P('紫外線','Ultraviolet light from the sun'),P('X 光等輻射','Strong radiation such as X-rays'),P('香菸的煙','Smoke from burning cigarettes')],answer:0,why:P('紫外線、輻射和香菸的煙裡的化學物質都會增加突變的機會；喝水不會。','UV, radiation and chemicals in smoke make mutations more likely; drinking water does not.'),hint:P('看左邊的「突變的原因」。','Look at "Causes of mutation" on the left.')},
  {q:P('完全沒有紫外線、輻射和化學物質，還會發生突變嗎？','With no UV, radiation or chemicals at all, can mutations still happen?'),options:[P('會，細胞複製 DNA 偶爾抄錯','Yes: a cell sometimes slips copying its DNA'),P('不會，突變全部都是環境所造成的','No: mutations always come from the outside'),P('只有人在生病的時候才會發生突變','Only when the animal is ill or very old'),P('只有在剛剛出生之前才會發生突變','Only before the animal is born, never after')],answer:0,why:P('突變也可能自然發生：細胞分裂前複製 DNA，偶爾會抄錯。','Mutations also happen by chance: a cell copying its DNA sometimes makes a slip.'),hint:P('選「自然發生」看看。','Choose "By chance" and watch.')}
 ],
 sources:[],init:()=>({running:true,cause:0,where:'soma',phase:-1,start:0}),
 controls:s=>[choice(P('原因','Cause'),'cause',CAUSES.map((q,i)=>[i,q.name])),choice(P('發生在','Where'),'where',[['soma',P('皮膚細胞（體細胞）','A skin cell (body cell)')],['germ',P('生殖細胞','A germ cell')]]),steps(CAUSE_SHORT)],
 act(s,k,v){s[k]=v;if(k==='where'&&v==='germ'&&s.cause===0)s.cause=1;if(k==='cause'&&v===0&&s.where==='germ')s.where='soma';if(k==='phase'||k==='cause'||k==='where')s.start=s.elapsed;},
 explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;return{title:CAUSE_NAMES[k],text:CAUSE_TEXT(s,k)};},
 draw:drawCause},
{id:'carrier',title:P('爸媽都正常，為什麼？','Normal parents, albino calf?'),sub:P('遺傳疾病與遺傳諮詢','Genetic disease and counselling'),
 hook:P('白化小水牛的爸爸、媽媽都是灰黑色的。牠的白化基因是從哪裡來的？人類有沒有像這樣的疾病，醫生又能幫上什麼忙？','The albino calf\'s father and mother are both dark grey. Where did its albinism gene come from? Do people have diseases like this, and how can doctors help?'),
 body:P('先看「一家人」：兩隻帶因者水牛怎麼生出白化小牛；再看「遺傳諮詢」：人類的遺傳疾病，以及醫生能幫上什麼忙。','First watch "A family": how two carrier buffalo can have an albino calf; then "Counselling": human genetic diseases and how doctors can help.'),
 reading:P('白化基因（a）是隱性的。Aa 的水牛有一個正常的 A，做得出黑色素，看起來是灰黑色，但身上帶著 a，叫做帶因者。兩隻帶因者生下的小牛，每一胎都有 1/4 的機率是 aa，表現白化。\n\n遺傳諮詢：醫師或遺傳諮詢人員會了解家族裡有沒有遺傳疾病，必要時安排檢查（婚前健康檢查、產前檢查，例如抽羊水檢查胎兒的染色體），推算孩子得病的機率，再和家人一起討論。\n\n補充：法律規定近親不能結婚。血緣越近，越可能帶有相同的隱性突變基因，孩子表現隱性遺傳疾病的機率就比較高。','The albinism allele (a) is recessive. An Aa buffalo has one normal A, makes melanin and looks dark grey, but carries a: it is a carrier. Each calf of two carriers has a 1/4 chance of being aa and albino.\n\nGenetic counselling: a doctor or genetic counsellor asks whether genetic diseases run in the family, arranges tests if needed (health checks before marriage, prenatal tests such as testing the baby\'s chromosomes from amniotic fluid), works out the chances and talks the options through with the family.\n\nExtra: the law does not allow close relatives to marry. The closer the relationship, the more likely both carry the same recessive mutation, so a child is more likely to show a recessive genetic disease.'),
 closure:P('許多遺傳疾病是隱性的：帶因者（Aa）看起來正常，兩個帶因者的孩子有 1/4 的機率得病。遺傳諮詢可以依家族病史和檢查推算機率，幫助家庭做準備。','Many genetic diseases are recessive: carriers (Aa) look healthy, but each child of two carriers has a 1/4 chance of the disease. Genetic counselling uses the family history and tests to work out the chances and help families prepare.'),
 quiz:[
  {q:P('兩隻灰黑色的水牛生出白化小牛，爸媽的基因型最可能是？','Two dark grey buffalo have an albino calf. What are the parents\' genotypes most likely to be?'),options:[P('都是 Aa（帶有隱性基因）','Both Aa (each carries one a)'),P('都是 AA（兩個顯性基因）','Both AA (two dominant genes)'),P('都是 aa（兩個隱性基因）','Both aa (two recessive genes)'),P('一隻 AA、一隻 aa（各一）','One AA and one aa (one each)')],answer:0,why:P('白化小牛是 aa，爸媽各給一個 a；爸媽又是灰黑色，所以都是 Aa（帶因者）。','The albino calf is aa, with one a from each parent; the parents are dark grey, so both are Aa (carriers).'),hint:P('小牛的兩個 a，分別從哪裡來？','Where did each of the calf\'s two a alleles come from?')},
  {q:P('爸媽都是白化基因的帶因者（Aa），孩子白化的機率是多少？','Both parents are carriers (Aa). What is the chance a child has albinism?'),options:[P('1/4','1/4'),P('1/2','1/2'),P('3/4','3/4'),P('0','0')],answer:0,why:P('四種組合中只有 aa 一種是白化，機率 1/4。','Of the four combinations only aa is albino: 1/4.'),hint:P('看「一家人」最後一步，數一數白化的小牛。','In "A family", count the albino calves at the last step.')},
  {q:P('遺傳諮詢主要在做什麼？','What does genetic counselling mainly do?'),options:[P('依病史推算孩子得遺傳病的機率','Works out disease chances and gives advice'),P('保證能把所有遺傳疾病全部治好','Guarantees a cure for every genetic disease'),P('替爸媽決定下一個孩子的性別','Chooses the sex of the parents\' next baby'),P('直接修改爸媽身上全部的基因','Rewrites the genes of both parents\' cells')],answer:0,why:P('遺傳諮詢是推算機率、提供建議，幫助家庭做準備，決定仍由家人自己做。','Counselling works out the chances and advises, so the family can prepare; the family makes the decision.'),hint:P('切到「遺傳諮詢」，看最後三個步驟。','Switch to "Counselling" and read the three steps.')}
 ],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P('觀察','View'),'view',[[0,P('一家人','A family')],[1,P('遺傳諮詢','Counselling')]]),steps(s.view===1?COUNSEL_SHORT:FAM_SHORT)],
 act(s,k,v){s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;}if(k==='phase')s.start=s.elapsed;},
 explain:s=>{const k=s.phase<0?(s.shown||0):s.phase;return s.view===1?{title:COUNSEL_NAMES[k],text:COUNSEL_TEXT[k]}:{title:FAM_NAMES[k],text:FAM_TEXT[k]};},
 draw:drawCarrier}
];
B.register({id:'mutations',title:P('突變：遺傳訊息改了一點之後','Mutations: when inherited information changes'),subtitle:P('從白化動物、鐮形血球，到遺傳諮詢','From albino animals and sickle cells to genetic counselling'),cover:'assets/covers/biology_mutations_1019_v1.jpg',
 assetDir:'assets/biology/genetics_originals_1010_v1/',family:P('遺傳與生物技術','Inheritance and biotechnology'),bookName:P('遺傳','Inheritance'),tabs});
})();

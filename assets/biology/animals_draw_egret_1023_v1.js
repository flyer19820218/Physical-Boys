/* Animals · "Little egret: feathers and wings" canvas (adaptation tab, view 1), 2026-10-23.
 * Four steps (AN7 egret_stand.png / egret_fly.png, AN6 penguin.png; AI teaching illustrations, not photos):
 *  0 standing: the standing egret large on a muted sky-and-shallow-water panel (keeps the white feathers and the dark legs
 *    readable on the dark board); a cyan band sweeps from head to the bottom of the body (feathers, not the legs);
 *    numbered markers 1 white feathers, 2 long thin neck, 3 long thin legs, matching a list card; a close-up card of
 *    the egret's own body feathers (cropped from the same picture, its frame drawn on the bird).
 *  1 flight feathers: the flying egret large; the near wing's primaries (yellow) and secondaries (cyan) tinted on the
 *    picture (regions measured from the PNG alpha; marks are schematic), a dot running along the trailing edge,
 *    "wing tip" and "body" pills; legend card; a fan of overlapping feathers drawn in code (schematic).
 *  2 warmth and flight: the flying egret with "flight feathers on the wings: help flight" (yellow tint, airflow) and
 *    "body feathers: hold air, keep warm" (orange glow, air dots); right card: lungs and air sacs schematic drawn in code
 *    (air sacs pulse like bellows, air runs trachea → posterior sacs → lung → anterior sacs → out; red sparkles only
 *    in the lung = gas exchange).
 *  3 flightless bird: egret (flies) vs emperor penguin (flipper-like wing, swims, cannot fly), both "has feathers";
 *    orange "Not every bird flies" + yellow "Has feathers, still a bird".
 * The flying egret shows only one leg; nothing here counts or names its legs.
 * Step changes (0.9 s): old step fades out, the new one fades in.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,TAU,text,measure,splitLines,circle,ellipse,glow,line,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,fitRect,drawIn}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=4,PER=9;
const FRAME_BG='#16332b',CYAN=C.cyan,YELLOW=C.yellow,ORANGE=C.orange,GREEN=C.green,PINK=C.pink;
const SKY0='#2c5869',SKY1='#3e7283',WATER='#245a6e',WATER_HI='#5aa3bb',ICE='#cfe2e8',ICE_EDGE='#8fb3bf';
const LUNG='#f08aa0',LUNG_EDGE='#b24a63',TUBE='#e9d8c4',AIRC='#dff7ff',HEAT='#fb923c';

// ── pictures and points measured once from the PNG alpha (image px) ───────
const ST='egret_stand.png',FY='egret_fly.png',PG='penguin.png';
// egret_stand: 1 body feathers, 2 neck, 3 the two legs; feathers end at the bottom of the body (legs are bare)
const ZC=[262,402,216,216]; // close-up crop (image px) of the body feathers
const SP={feather:[330,430],neck:[590,220],legA:[290,800],legB:[355,800],bodyEnd:640};
// egret_fly, near wing: primaries (near the tip) and secondaries (near the body); polygons are clipped by the picture alpha
const PRIM=[[575,0],[800,0],[800,312],[712,318],[640,300],[585,240],[545,150]];
const SEC=[[640,300],[712,318],[800,312],[800,585],[575,585],[562,470],[590,380]];
const WINGS=[[180,170],[440,170],[440,540],[180,540]]; // far wing (flight tint in step 2 only)
// trailing edge of the near wing, from the tip down to the body (rightmost opaque pixel per row)
const TE=[[600,8],[650,22],[694,25],[729,50],[745,100],[750,125],[744,150],[751,175],[737,200],[742,225],[736,250],[726,275],[720,300],[710,325],[708,350],[712,375],[711,400],[705,425],[698,450],[691,475],[680,500],[677,525],[666,550],[651,575]];
const SPLIT_Y=310;
const FP={prim:[690,140],sec:[665,450],tip:[700,40],body:[330,650],wing:[640,200],bodyC:[400,630],flipper:[205,300]};

// ── text ───────────────────────────────────────────────────────────────────
const T={
 t0:P(`站姿：全身都是羽毛`,`Standing: feathers all over the body`),
 t1:P(`展翅：看飛羽排列`,`Wings open: see the flight feathers`),
 t2:P(`羽毛保暖，也幫忙飛行`,`Feathers keep warm and help flight`),
 t3:P(`不是所有鳥都能飛`,`Not every bird can fly`),
 s0:P(`站姿`,`Standing`),s1:P(`展翅飛羽`,`Flight feathers`),s2:P(`保暖與飛行`,`Warmth and flight`),s3:P(`不會飛的鳥`,`Flightless bird`),
 fLine:P(`從頭到身體，都是白色的羽毛`,`White feathers from head to body`),
 zoom:P(`框起處放大`,`Framed area, zoomed`),
 look:P(`看全身`,`Look at the whole body`),
 i1:P(`白色的羽毛`,`White feathers`),i2:P(`細長的頸`,`Long, thin neck`),i3:P(`細長的腿`,`Long, thin legs`),
 key0:P(`鳥的身體覆蓋著羽毛`,`A bird's body is covered with feathers`),
 nearTip:P(`靠翅尖`,`Near the wing tip`),nearBody:P(`靠身體`,`Near the body`),marks:P(`標記是示意`,`The marks are schematic`),
 overlap:P(`一片壓著一片`,`Feathers overlap`),surface:P(`排成寬寬的翅面`,`They form a broad wing surface`),
 key1:P(`靠翅尖是初級飛羽，靠身體是次級飛羽`,`Near the tip: primaries; near the body: secondaries`),
 flyLbl:P(`翅膀的飛羽：幫忙飛行`,`Wing flight feathers: help flight`),
 warmLbl:P(`身體的羽毛：留住空氣，保暖`,`Body feathers: hold air, keep warm`),
 lungT:P(`肺與氣囊`,`Lungs and air sacs`),air:P(`空氣`,`Air`),
 n1:P(`氣囊：像風箱，協助通氣`,`Air sacs: like bellows, help move air`),
 n2:P(`肺：在這裡進行氣體交換`,`Lungs: gas exchange happens here`),
 n3:P(`氣囊不是取代肺`,`Air sacs do not replace the lungs`),
 hasF:P(`有羽毛`,`Has feathers`),noFly:P(`不會飛`,`Cannot fly`),
 still:P(`有羽毛，仍然是鳥`,`Has feathers, still a bird`)
};
const TITLE=[T.t0,T.t1,T.t2,T.t3],SHORT=[T.s0,T.s1,T.s2,T.s3];

// ── text helpers (as in animals_draw_covering_1023_v1.js) ──────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
function boxOf(c,p,maxW,size=22){const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7;return{rows,w,h:rows.length*lh+11,lh};}
// fitText: a label in a dark rounded box, measured first; one line if it fits in maxW, otherwise wrapped (never shrunk).
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22,border=null,textCol=null,dash=null}={}){
  const {rows,w,h,lh}=boxOf(c,p,maxW,size),bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();if(dash)c.setLineDash(dash);c.beginPath();c.roundRect(bx,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(border||col,.85);c.lineWidth=2;c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:(textCol||col),'center'));
  return{x:bx,y,w,h};
}
const withA=(c,a,fn)=>{if(a<=0)return;c.save();c.globalAlpha*=a;fn();c.restore();};
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
// lead from the nearest point of box b to (px,py)
const leadBox=(c,b,px,py,col)=>{const x=Math.max(b.x+12,Math.min(b.x+b.w-12,px)),y=Math.max(b.y,Math.min(b.y+b.h,py));
  const ex=px<b.x?b.x:px>b.x+b.w?b.x+b.w:x,ey=py<b.y?b.y:py>b.y+b.h?b.y+b.h:y;lead(c,ex,ey,px,py,col);};
function cardBox(c,R){c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.fillStyle=FRAME_BG;c.fill();c.strokeStyle=rgba(C.white,.7);c.lineWidth=2;c.stroke();}
function rowsAt(c,p,x,y,w,size,col,lh,max=9){const r=rowsOf(c,p,w,size).slice(0,max);r.forEach((s,i)=>text(c,s,x,y+i*lh,size,col));return r.length;}
const ip=(r,file,[x,y])=>{const [W,H]=dim(file);return[r.x+x/W*r.w,r.y+y/H*r.h];};

// ── a picture drawn off-screen first, so tints and highlights stay on the bird (source-atop) ──
const OFF={};
function picPaint(c,file,r,paint){
  const im=pic(src(file));if(!im){drawIn(c,file,r);return;}
  const tf=c.getTransform(),sc=Math.max(1,Math.min(2,Math.hypot(tf.a,tf.b)||1)),w=Math.max(1,Math.ceil(r.w*sc)),h=Math.max(1,Math.ceil(r.h*sc));
  const key=file+'|'+w+'x'+h;let cv=OFF[key];if(!cv){cv=OFF[key]=document.createElement('canvas');cv.width=w;cv.height=h;}
  const g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,w,h);
  g.drawImage(im,0,0,w,h);
  if(paint){const [W,H]=dim(file);g.globalCompositeOperation='source-atop';g.save();g.scale(w/W,h/H);paint(g);g.restore();g.globalCompositeOperation='source-over';}
  c.drawImage(cv,r.x,r.y,r.w,r.h);
}
const polyFill=(g,pts,col)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=col;g.fill();};

// ── backgrounds: muted sky (keeps white feathers and dark legs readable), shallow water, sea and ice ──
function sky(c,R,t,{water=0}={}){
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  const g=c.createLinearGradient(0,R.y,0,R.y+R.h);g.addColorStop(0,SKY0);g.addColorStop(1,SKY1);c.fillStyle=g;c.fillRect(R.x,R.y,R.w,R.h);
  for(let i=0;i<3;i++){const u=mod(t*.012+i*.37),x=R.x-90+u*(R.w+180),y=R.y+40+i*58;
    ellipse(c,x,y,70,13,'rgba(242,236,217,.07)',null);ellipse(c,x+30,y-8,40,11,'rgba(242,236,217,.06)',null);}
  if(water){const wy=R.y+R.h-water;c.fillStyle=WATER;c.fillRect(R.x,wy,R.w,water);
    for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<=40;i++){const xx=R.x+i/40*R.w;c.lineTo(xx,wy+6+j*11+2.5*Math.sin(i*.9-t*1.6+j*1.7));}c.strokeStyle=rgba(WATER_HI,.55-j*.13);c.lineWidth=2;c.stroke();}}
  c.restore();
  c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.strokeStyle=rgba(C.white,.55);c.lineWidth=2;c.stroke();
}

// ── header ─────────────────────────────────────────────────────────────────
function header(c,k){
  const pl=fitText(c,L('bird','鳥類','Birds'),20,12,300,CYAN,{active:true});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),room=940-measure(c,ai,22)-24-(pl.x+pl.w+14);
  let n=TITLE[k];if(measure(c,n,26)>room)n=SHORT[k];
  text(c,n,pl.x+pl.w+14,pl.y+pl.h/2+9,26,C.white);
  text(c,ai,940,40,22,C.muted,'right');
}
// key line(s) at the bottom
const KEY_Y=532;
function keyRow(c,items,tau,t0){
  const ws=items.map(([p])=>boxOf(c,p,900).w),gap=16,tot=ws.reduce((a,b)=>a+b,0)+gap*(items.length-1);let x=480-tot/2;
  items.forEach(([p,col,act],i)=>{withA(c,fade(tau,t0+i*.6,.5),()=>fitText(c,p,x,KEY_Y,900,col,{active:!!act}));x+=ws[i]+gap;});
}

// ── step 0: standing ───────────────────────────────────────────────────────
const H0={x:16,y:64,w:440,h:452};
const A0={x:472,y:64,w:472,h:196},B0={x:472,y:276,w:472,h:240};
function step0(c,tau,t){
  sky(c,H0,t,{water:42});
  const r0=fitRect(ST,H0.x+10,H0.y+6,H0.w-20,H0.h-14),r={...r0,y:r0.y+1.2*Math.sin(t*1.1)};
  const [W,H]=dim(ST);
  // ripples around the feet
  const fy=H0.y+H0.h-30;for(let i=0;i<2;i++){const u=mod(t*.35+i*.5);ellipse(c,r.x+r.w*.38,fy,30+u*60,5+u*8,null,rgba(C.white,.45*(1-u)),2);}
  withA(c,fade(tau,0,.6),()=>picPaint(c,ST,r,g=>{
    // sweep from head to the bottom of the body: feathers, not the legs
    if(tau<1)return;const u=mod((t-1)/3.2),y=mix(-60,SP.bodyEnd,u),a=Math.sin(u*Math.PI);
    g.save();g.beginPath();g.rect(0,0,W,SP.bodyEnd);g.clip();
    const gr=g.createLinearGradient(0,y-90,0,y+30);gr.addColorStop(0,rgba(CYAN,0));gr.addColorStop(.75,rgba(CYAN,.42*a));gr.addColorStop(1,rgba(CYAN,0));
    g.fillStyle=gr;g.fillRect(0,y-90,W,120);g.restore();
  }));
  // numbered markers on the picture
  const mk=[[SP.feather,1.2],[SP.neck,2.0]];
  mk.forEach(([p,t0],i)=>withA(c,fade(tau,t0,.5),()=>{const [x,y]=ip(r,ST,p);K.marker(c,x,y,i+1,t,13);}));
  withA(c,fade(tau,2.8,.5),()=>{const a=ip(r,ST,SP.legA),b=ip(r,ST,SP.legB),mx=r.x+r.w*.13,my=a[1]+6;
    lead(c,mx,my,a[0],a[1],YELLOW);lead(c,mx,my,b[0],b[1],YELLOW);K.marker(c,mx,my,3,t,13);});
  // card A: feather close-up
  withA(c,fade(tau,.6,.5),()=>{cardBox(c,A0);
    // close-up of the egret's own body feathers, with its frame on the picture
    const [zx,zy,zw,zh]=ZC,f0=ip(r,ST,[zx,zy]),f1=ip(r,ST,[zx+zw,zy+zh]),zb={x:A0.x+14,y:A0.y+14,w:168,h:168},pan=4*Math.sin(t*.5);
    c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*12;c.strokeStyle=C.white;c.lineWidth=2;c.strokeRect(f0[0],f0[1],f1[0]-f0[0],f1[1]-f0[1]);
    c.beginPath();c.moveTo(f1[0],f0[1]);c.lineTo(zb.x,zb.y);c.moveTo(f1[0],f1[1]);c.lineTo(zb.x,zb.y+zb.h);c.strokeStyle=rgba(C.white,.55);c.stroke();c.restore();
    D.round(c,zb.x,zb.y,zb.w,zb.h,12,SKY1,null);
    drawIn(c,ST,zb,{radius:12,crop:[(zx+pan)/W,(zy+pan)/H,(zw-8)/W,(zh-8)/H]});
    c.beginPath();c.roundRect(zb.x,zb.y,zb.w,zb.h,12);c.strokeStyle=C.white;c.lineWidth=2;c.stroke();
    const tx=A0.x+200,tw=A0.x+A0.w-16-tx;
    text(c,L('feathers','羽毛','Feathers'),tx,A0.y+44,26,CYAN);
    rowsAt(c,T.fLine,tx,A0.y+84,tw,22,C.white,30,2);
    text(c,T.zoom,tx,A0.y+A0.h-20,22,C.muted);});
  // card B: the list that matches the markers
  withA(c,fade(tau,1,.5),()=>{cardBox(c,B0);text(c,T.look,B0.x+18,B0.y+36,24,C.white);
    [T.i1,T.i2,T.i3].forEach((p,i)=>withA(c,fade(tau,1.2+i*.8,.5),()=>{const y=B0.y+86+i*56;
      K.marker(c,B0.x+34,y-8,i+1,null,13);text(c,p,B0.x+60,y,24,YELLOW);}));});
  keyRow(c,[[T.key0,YELLOW,false]],tau,3.6);
}

// ── step 1: flight feathers ────────────────────────────────────────────────
const H1={x:16,y:64,w:535,h:452};
const A1={x:567,y:64,w:377,h:206},B1={x:567,y:282,w:377,h:234};
function teAt(r,u){ // point and image y on the trailing edge, u 0..1 from the tip to the body
  const pts=TE,seg=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d;}
  let s=u*tot,i=0;while(i<seg.length-1&&s>seg[i]){s-=seg[i];i++;}const v=clamp(s/seg[i]),x=mix(pts[i][0],pts[i+1][0],v),y=mix(pts[i][1],pts[i+1][1],v);
  return{p:ip(r,FY,[x,y]),iy:y};
}
function feather(c,x,y,ang,len,w,fill,edge){
  c.save();c.translate(x,y);c.rotate(ang);c.beginPath();c.moveTo(len*.08,0);
  c.bezierCurveTo(len*.3,-w*1.15,len*.85,-w*1.05,len,-w*.15);c.bezierCurveTo(len*.86,w*.75,len*.32,w*.85,len*.08,0);
  c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=1.8;c.stroke();
  c.beginPath();c.moveTo(0,0);c.lineTo(len*.97,-w*.1);c.strokeStyle='#7d7563';c.lineWidth=2;c.stroke();
  for(let k=1;k<6;k++){const xx=len*(.2+k*.13);c.beginPath();c.moveTo(xx,0);c.lineTo(xx+len*.06,-w*.75);c.moveTo(xx,0);c.lineTo(xx+len*.05,w*.6);c.strokeStyle=rgba('#7d7563',.45);c.lineWidth=1;c.stroke();}
  c.restore();
}
function fan(c,R,tau,t){
  const bx=R.x+44,by=R.y+R.h-26,s=.62+.38*Math.sin(t*.9),n=9,mid=-.82;
  const list=[];for(let i=0;i<n;i++){const prim=i<5,a0=mix(-1.48,-.1,i/(n-1)),ang=mid+(a0-mid)*s,len=prim?mix(150,138,i/4):mix(128,112,(i-5)/3);list.push({i,prim,ang,len});}
  // inner (secondaries) first, so each feather lies over the next one
  for(let j=n-1;j>=0;j--){const f=list[j];withA(c,fade(tau,.8+(n-1-j)*.12,.4),()=>feather(c,bx,by,f.ang,f.len,13,f.prim?'#f6ecb8':'#cdf4fb','#4b5a52'));}
  circle(c,bx,by,7,'#7d7563',C.ink,1.5);
  withA(c,fade(tau,2,.5),()=>{const a=list[2],b=list[7];
    K.marker(c,bx+Math.cos(a.ang)*a.len*.62,by+Math.sin(a.ang)*a.len*.62,1,null,12);
    K.marker(c,bx+Math.cos(b.ang)*b.len*.62,by+Math.sin(b.ang)*b.len*.62,2,null,12,CYAN);});
}
function step1(c,tau,t){
  sky(c,H1,t);
  const r0=fitRect(FY,H1.x+12,H1.y+6,H1.w-24,H1.h-12),r={...r0,y:r0.y+3*Math.sin(t*1.4)};
  // airflow under the wings
  for(let k=0;k<3;k++){const yy=r.y+r.h*(.58+k*.1),off=mod(t*40+k*17,24);c.save();c.setLineDash([12,10]);c.lineDashOffset=-off;
    c.beginPath();c.moveTo(r.x+r.w*.02,yy+18);c.quadraticCurveTo(r.x+r.w*.5,yy+4,r.x+r.w*.98,yy-14);c.strokeStyle=rgba(AIRC,.28);c.lineWidth=2.4;c.stroke();c.restore();}
  const aP=fade(tau,1,.6)*(.36+.1*Math.sin(t*2)),aS=fade(tau,2.2,.6)*(.36+.1*Math.sin(t*2+1.5));
  picPaint(c,FY,r,g=>{if(aP>0)polyFill(g,PRIM,rgba(YELLOW,aP));if(aS>0)polyFill(g,SEC,rgba(CYAN,aS));});
  // a dot running along the trailing edge, tip → body
  withA(c,fade(tau,3,.5),()=>{const u=mod((t-3)/3.4),{p,iy}=teAt(r,u),col=iy<SPLIT_Y?YELLOW:CYAN;glow(c,p[0],p[1],20,col,.7);circle(c,p[0],p[1],6,col,C.ink,1.5);});
  withA(c,fade(tau,1,.5),()=>{const [x,y]=ip(r,FY,FP.prim);K.marker(c,x,y,1,t,13);});
  withA(c,fade(tau,2.2,.5),()=>{const [x,y]=ip(r,FY,FP.sec);K.marker(c,x,y,2,t,13,CYAN);});
  // wing tip and body pills
  withA(c,fade(tau,1.6,.5),()=>{const b=fitText(c,L('wingTip','翅尖','Wing tip'),H1.x+H1.w-10,H1.y+12,150,C.white,{align:'right'}),[x,y]=ip(r,FY,FP.tip);leadBox(c,b,x,y,C.white);});
  withA(c,fade(tau,2.6,.5),()=>{const b=fitText(c,L('body','身體','Body'),H1.x+24,H1.y+H1.h-56,200,C.white),[x,y]=ip(r,FY,FP.body);leadBox(c,b,x,y,C.white);});
  // legend card
  withA(c,fade(tau,.8,.5),()=>{cardBox(c,A1);const x=A1.x+18;
    withA(c,fade(tau,1,.5),()=>{K.marker(c,x+14,A1.y+30,1,null,13);text(c,L('primaries','初級飛羽','Primary flight feathers'),x+38,A1.y+38,22,YELLOW);text(c,T.nearTip,x+38,A1.y+68,22,C.white);});
    withA(c,fade(tau,2.2,.5),()=>{K.marker(c,x+14,A1.y+106,2,null,13,CYAN);text(c,L('secondaries','次級飛羽','Secondary flight feathers'),x+38,A1.y+114,22,CYAN);text(c,T.nearBody,x+38,A1.y+144,22,C.white);});
    text(c,T.marks,x,A1.y+A1.h-16,22,C.muted);});
  // overlapping-feather fan (schematic)
  withA(c,fade(tau,.6,.5),()=>{cardBox(c,B1);text(c,T.overlap,B1.x+18,B1.y+32,22,C.white);text(c,L('schematic','示意','Schematic'),B1.x+B1.w-16,B1.y+32,22,C.muted,'right');
    fan(c,B1,tau,t);
    withA(c,fade(tau,3.4,.5),()=>rowsAt(c,T.surface,B1.x+200,B1.y+112,B1.w-214,22,YELLOW,30,4));});
  keyRow(c,[[T.key1,YELLOW,false]],tau,4.2);
}

// ── step 2: warmth and flight; lungs and air sacs (schematic) ──────────────
const H2={x:16,y:64,w:440,h:452},R2={x:472,y:64,w:472,h:452};
const TRACHEA=[[500,128],[545,166],[585,200],[650,216]];
const AIRPATH=[[500,128],[545,166],[585,200],[650,216],[760,238],[812,272],[790,238],[762,214],[740,212],[700,212],[660,212],[640,228],[612,282],[606,240],[585,200],[545,166],[500,128]];
const LUNG_EXIT=10; // index in AIRPATH where the air leaves the lung
function pathAt(pts,u){const seg=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d;}
  let s=u*tot,i=0;while(i<seg.length-1&&s>seg[i]){s-=seg[i];i++;}const v=clamp(s/seg[i]);return{x:mix(pts[i][0],pts[i+1][0],v),y:mix(pts[i][1],pts[i+1][1],v),i};}
function lungs(c,tau,t){
  const br=(1-Math.cos(t*TAU/3.2))/2;
  // body outline and neck
  c.save();c.lineCap='round';line(c,[[492,118],[545,166],[600,206]],rgba(C.muted,.14),42);c.restore();
  ellipse(c,720,262,178,100,rgba(C.muted,.08),null);
  c.save();c.setLineDash([8,7]);ellipse(c,720,262,178,100,null,rgba(C.muted,.6),2);c.restore();
  // tubes
  c.save();c.lineCap='round';c.lineJoin='round';
  K.sline(c,TRACHEA,TUBE,8);K.sline(c,[[650,216],[760,238],[800,258]],TUBE,5);K.sline(c,[[792,244],[762,214]],TUBE,5);K.sline(c,[[648,222],[620,262]],TUBE,5);c.restore();
  // air sacs (bellows)
  const sa=1+.17*br,sp=1+.17*br;
  ellipse(c,612,282,38*sa,32*sa,rgba(CYAN,.22),CYAN,2.5);
  ellipse(c,816,276,62*sp,44*sp,rgba(CYAN,.22),CYAN,2.5);
  // lung: compact, spongy tubes
  ellipse(c,700,212,62,24,LUNG,LUNG_EDGE,2.5);
  c.save();c.beginPath();c.ellipse(700,212,60,22,0,0,TAU);c.clip();
  for(let j=-2;j<=2;j++){line(c,[[636,212+j*8],[764,212+j*8]],rgba('#fde2e8',.55),1.6);}
  for(let i=0;i<6;i++){const u=mod(t*.7+i/6),x=650+i*20,y=204+((i*7)%3)*8,a=Math.sin(u*Math.PI);circle(c,x,y,2.5+3*a,rgba('#ef4444',.85*a),null);}
  c.restore();
  // moving air
  for(let i=0;i<16;i++){const u=mod(t*.09+i/16),q=pathAt(AIRPATH,u);circle(c,q.x,q.y,4.2,q.i>=LUNG_EXIT?rgba(AIRC,.6):AIRC,C.ink,1.2);}
  text(c,T.air,486,184,22,AIRC);
}
function step2(c,tau,t){
  sky(c,H2,t);
  const r0=fitRect(FY,H2.x+12,H2.y+64,H2.w-24,H2.h-128),r={...r0,y:r0.y+3*Math.sin(t*1.4)};
  for(let k=0;k<3;k++){const yy=r.y+r.h*(.58+k*.1),off=mod(t*40+k*17,24);c.save();c.setLineDash([12,10]);c.lineDashOffset=-off;
    c.beginPath();c.moveTo(r.x+r.w*.02,yy+14);c.quadraticCurveTo(r.x+r.w*.5,yy+4,r.x+r.w*.98,yy-10);c.strokeStyle=rgba(AIRC,.28*fade(tau,1,.5));c.lineWidth=2.4;c.stroke();c.restore();}
  const aF=fade(tau,.9,.6)*(.3+.08*Math.sin(t*2)),aW=fade(tau,2,.6)*(.3+.12*Math.sin(t*1.7));
  picPaint(c,FY,r,g=>{if(aF>0){polyFill(g,PRIM,rgba(YELLOW,aF));polyFill(g,SEC,rgba(YELLOW,aF));polyFill(g,WINGS,rgba(YELLOW,aF*.7));}
    if(aW>0){const [x,y]=FP.bodyC,gr=g.createRadialGradient(x,y,0,x,y,230);gr.addColorStop(0,rgba(HEAT,aW));gr.addColorStop(1,rgba(HEAT,0));g.fillStyle=gr;g.fillRect(x-240,y-240,480,480);}});
  // air held in the body feathers
  withA(c,fade(tau,2,.6),()=>{const rr=K.rng(7);for(let i=0;i<9;i++){const px=mix(260,620,rr()),py=mix(600,680,rr()),ph=rr()*TAU,[x,y]=ip(r,FY,[px,py]);
    circle(c,x+2*Math.sin(t*2+ph),y+1.6*Math.cos(t*1.7+ph),3.2,rgba(AIRC,.95),rgba(C.ink,.7),1.2);}});
  withA(c,fade(tau,.9,.5),()=>{const b=fitText(c,T.flyLbl,H2.x+12,H2.y+12,H2.w-24,YELLOW),[x,y]=ip(r,FY,FP.wing);leadBox(c,b,x,y,YELLOW);});
  withA(c,fade(tau,2,.5),()=>{const b=fitText(c,T.warmLbl,H2.x+12,H2.y+H2.h-52,H2.w-24,HEAT),[x,y]=ip(r,FY,FP.bodyC);leadBox(c,b,x,y,HEAT);});
  // lungs and air sacs
  withA(c,fade(tau,2.8,.6),()=>{cardBox(c,R2);
    text(c,T.lungT,R2.x+18,R2.y+30,24,C.white);text(c,L('schematic','示意','Schematic'),R2.x+R2.w-16,R2.y+30,22,C.muted,'right');
    lungs(c,tau,t);
    withA(c,fade(tau,3.4,.5),()=>{const b=fitText(c,L('lungSchem','肺（示意）','Lung (schematic)'),700,R2.y+50,300,PINK,{align:'center'});lead(c,700,b.y+b.h,700,189,PINK);});
    withA(c,fade(tau,3.8,.5),()=>{const b=fitText(c,L('airSac','氣囊（示意）','Air sacs (schematic)'),714,374,300,CYAN,{align:'center'});
      lead(c,b.x+12,b.y+b.h/2,612,316,CYAN);lead(c,b.x+b.w-12,b.y+b.h/2,812,322,CYAN);});
    [[T.n1,CYAN],[T.n2,PINK],[T.n3,ORANGE]].forEach(([p,col],i)=>withA(c,fade(tau,4.2+i*.5,.5),()=>{const y=R2.y+R2.h-80+i*31;
      circle(c,R2.x+26,y-7,6,col,C.ink,1.2);text(c,p,R2.x+42,y,22,i===2?ORANGE:C.white);}));});
  keyRow(c,[[L('airSacNote','氣囊協助通氣，氣體交換在肺','Air sacs help ventilation; gas exchange is in the lungs'),YELLOW,false]],tau,5.8);
}

// ── step 3: not every bird flies ───────────────────────────────────────────
const H3={x:16,y:64,w:440,h:452},R3={x:472,y:64,w:472,h:452};
function chips(c,items,x,y,tau,t0){items.forEach(([p,col],i)=>withA(c,fade(tau,t0+i*.5,.5),()=>{const b=fitText(c,p,x,y,300,col);x+=b.w+10;}));}
function chipsW(c,items){return items.reduce((a,[p])=>a+boxOf(c,p,300).w+10,-10);}
function step3(c,tau,t){
  sky(c,H3,t);
  const r0=fitRect(FY,H3.x+24,H3.y+76,H3.w-48,H3.h-170),r={...r0,x:r0.x+6*Math.sin(t*.6),y:r0.y+4*Math.sin(t*1.6)};
  for(let k=0;k<2;k++){const yy=r.y+r.h*(.62+k*.12),off=mod(t*40+k*17,24);c.save();c.setLineDash([12,10]);c.lineDashOffset=-off;
    c.beginPath();c.moveTo(r.x,yy+12);c.quadraticCurveTo(r.x+r.w*.5,yy+4,r.x+r.w,yy-10);c.strokeStyle=rgba(AIRC,.28);c.lineWidth=2.4;c.stroke();c.restore();}
  withA(c,fade(tau,0,.6),()=>drawIn(c,FY,r));
  withA(c,fade(tau,.4,.5),()=>fitText(c,L('egret','小白鷺','Little egret'),H3.x+12,H3.y+12,300,C.white));
  const e=[[T.hasF,CYAN],[L('flies','會飛','Flies'),GREEN]];chips(c,e,H3.x+H3.w/2-chipsW(c,e)/2,H3.y+H3.h-54,tau,1);
  // sea, ice and the penguin
  withA(c,fade(tau,.6,.6),()=>{
    sky(c,R3,t,{water:120});
    c.save();c.beginPath();c.roundRect(R3.x,R3.y,R3.w,R3.h,14);c.clip();
    c.beginPath();c.moveTo(R3.x,R3.y+344);c.lineTo(R3.x+212,R3.y+344);c.lineTo(R3.x+240,R3.y+372);c.lineTo(R3.x+222,R3.y+R3.h);c.lineTo(R3.x,R3.y+R3.h);c.closePath();
    c.fillStyle=ICE;c.fill();c.strokeStyle=ICE_EDGE;c.lineWidth=2;c.stroke();
    for(let i=0;i<7;i++){const u=mod(t*.28+i/7),x=R3.x+280+((i*53)%170),y=mix(R3.y+R3.h-8,R3.y+R3.h-110,u);circle(c,x+3*Math.sin(t*2+i),y,3+2*(i%3),null,rgba(C.white,.65*(1-u)),1.6);}
    c.restore();
    const pr=fitRect(PG,R3.x+40,R3.y+50,200,300),fx=pr.x+pr.w/2,fy=pr.y+pr.h,sw=.022*Math.sin(t*1.1);
    c.save();c.translate(fx,fy);c.rotate(sw);drawIn(c,PG,{x:-pr.w/2,y:-pr.h,w:pr.w,h:pr.h});c.restore();
    fitText(c,L('penguin','帝企鵝','Emperor penguin'),R3.x+12,R3.y+12,300,C.white);
    withA(c,fade(tau,1.6,.5),()=>{const [W,H]=dim(PG),lx=FP.flipper[0]/W*pr.w-pr.w/2,ly=FP.flipper[1]/H*pr.h-pr.h,
      px=fx+lx*Math.cos(sw)-ly*Math.sin(sw),py=fy+lx*Math.sin(sw)+ly*Math.cos(sw);K.pulse(c,px,py,t,YELLOW,10);
      const b=fitText(c,L('flipper','鰭狀翅膀','Flipper-like wing'),R3.x+R3.w-12,R3.y+150,220,YELLOW,{align:'right'});leadBox(c,b,px,py,YELLOW);});
  });
  const pz=[[T.hasF,CYAN],[T.noFly,ORANGE],[L('swims','會游泳','Swims'),CYAN]];chips(c,pz,R3.x+R3.w/2-chipsW(c,pz)/2,R3.y+R3.h-54,tau,2.2);
  keyRow(c,[[L('notAllFly','不是所有鳥都能飛','Not every bird flies'),ORANGE,true],[T.still,YELLOW,false]],tau,3.8);
}

// ── one step's whole picture ───────────────────────────────────────────────
const STEPS=[step0,step1,step2,step3];
function scene(c,k,tau,t,a){withA(c,a,()=>{STEPS[k](c,tau,t);header(c,k);});}

function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.eg||(s.eg={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut);
  scene(c,k,tau,t,cross?aIn:1);
}
window.AnimalsDraw.egret=draw;
})();

/* Unit 11 lesson 1 · "mosaic" canvas (ecosystem-diversity tab, view 0), 2026-10-24. One region, many homes (plan section 2, mosaic).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (the camera drifts, patch edges breathe,
 * dashed outlines march, icons turn / ripple, rings pulse).
 * Left 2/3 = stage: the BD5 panorama in a window (x 16..636, y 16..500); right 1/3 = step card (x 652..944): green
 * "Ecosystem diversity" header, the four step labels, the step's title (VIEWS.mosaic.names) and a legend for the step.
 *  0 see the region: Ken Burns. The camera starts on the base view, pushes in on the mountains, glides down to the sea, then pulls
 *    back to the base view (then a slow drift). Pills "Mountains" / "Sea" ride with the picture.
 *  1 divide it: six soft-edged green patches (shadow-blur feathering, no hard fill edge) with a thin dashed green outline light up
 *    from near to far: coast, wetland, stream, farmland, grassland, forest. Each gets its name pill (fixed canvas positions,
 *    checked for overlap in zh and en).
 *  2 different conditions: under each name pill two condition chips pop in (drawn icon + name), same order. Icon colours follow
 *    ecology lesson 4: light yellow, water cyan, temperature orange, salinity white. One sentence only (the step text).
 *  3 how many kinds: chips fade; each name pill gets a numbered green square; copies of the squares fly into a count row under the
 *    picture: six squares + "= 6 ecosystems" + "Schematic". Card legend: "Boundaries are gradual" (feathered swatch).
 * Colours (plan 1.4): ecosystem diversity green #4ade80 (card header, outlines, squares), always with its name.
 * No real areas, temperatures or other numbers; the 6 is the count in this schematic picture and is marked "Schematic".
 * Picture: environment_ai_1024/BD5_mosaic.jpg 1672x933 (K.SIZE). Region outlines / anchors below are picture pixels measured with PIL
 * (water mask + grid); base view = picture rect x 230..1370, y 43..933 (scale 620/1140).
 * New labels (P(), not in K.LAB) are listed in T and REG below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,GREEN=K.COL.ecosystem,LIGHT='#fde047',WATER='#55e9ff',TEMP='#fb923c',SALT='#f2ecd9';
const FILE=(K.ENV||'environment_ai_1024/')+'BD5_mosaic.jpg',IW=1672,IH=933;

// ── labels ────────────────────────────────────────────────────────────────
const T={
 short:[P('看見地區','See the region'),P('切成幾塊','Divide it'),P('條件不同','Different conditions'),P('有幾種？','How many kinds?')],
 names:[P('一個地區的全景','A panorama of one region'),P('六種不同的生態系','Six different ecosystems'),P('每塊的條件都不一樣','Each has different conditions'),P('生態系多樣性','Ecosystem diversity')],
 mountain:P('高山','Mountains'),sea:P('海','Sea'),
 cam:P('鏡頭：從山移到海','Camera: from mountain to sea'),
 patch:P('柔邊色塊：一種生態系','Soft patch: one ecosystem'),
 gradual:P('邊界是漸變的','Boundaries are gradual'),
 square:P('一格：一種生態系','One square: one ecosystem'),
 total:P('＝ 6 種生態系','= 6 ecosystems'),
 light:P('光','Light'),water:P('水','Water'),temp:P('溫度','Temperature'),salt:P('鹽度','Salinity'),
 patchNote:P('色塊位置與邊界是示意','Patches and edges are schematic')
};
// condition kinds: colour + drawn icon; the legend names the four kinds
const KIND={light:LIGHT,shade:LIGHT,water:WATER,waves:WATER,flow:WATER,shallow:WATER,irrig:WATER,rain:WATER,temp:TEMP,salt:SALT};
// six regions, near -> far. poly / line / anchor in picture px; blk = name block (canvas px, top; al = which side the x is)
const REG=[
 {id:'coast',name:P('海岸','Coast'),tint:'#86efac',
  poly:[[232,610],[330,625],[450,640],[580,660],[720,680],[860,690],[980,700],[1050,740],[1060,800],[980,850],[860,880],[760,933],[232,933]],
  anchor:[430,800],blk:{x:40,y:414,al:'left'},cond:[['salt',P('鹽度','Salinity')],['waves',P('風浪','Waves')]]},
 {id:'wetland',name:P('濕地','Wetland'),tint:'#4ade80',
  poly:[[232,520],[350,520],[500,525],[620,500],[750,495],[880,490],[1000,500],[1120,530],[1200,560],[1150,600],[1050,640],[950,665],[820,660],[700,645],[560,640],[420,615],[300,600],[232,598]],
  anchor:[640,570],blk:{x:262,y:312,al:'left'},cond:[['shallow',P('淺水','Shallow water')],['salt',P('鹽度','Salinity')]]},
 {id:'stream',name:P('溪流','Stream'),tint:'#a7f3d0',
  line:[[232,318],[300,322],[360,335],[330,360],[262,385],[300,402],[400,410],[550,420],[660,435],[728,462],[700,490],[600,505],[450,515],[330,512],[232,503]],
  anchor:[560,421],blk:{x:30,y:224,al:'left'},cond:[['flow',P('水流','Flow')],['temp',P('溫度','Temperature')]]},
 {id:'farm',name:P('農田','Farmland'),tint:'#bbf7d0',
  poly:[[240,300],[400,285],[600,290],[780,300],[800,330],[750,380],[720,410],[700,470],[600,495],[450,500],[300,495],[240,480]],
  anchor:[600,330],blk:{x:150,y:132,al:'left'},cond:[['light',P('光照','Light')],['irrig',P('灌溉','Irrigation')]]},
 {id:'grass',name:P('草地','Grassland'),tint:'#d9f99d',
  poly:[[760,385],[900,370],[1050,375],[1200,410],[1370,470],[1370,520],[1300,520],[1150,505],[1000,480],[870,470],[760,460],[720,430]],
  anchor:[1000,430],blk:{x:628,y:218,al:'right'},cond:[['light',P('光照','Light')],['rain',P('雨水','Rainfall')]]},
 {id:'forest',name:P('森林','Forest'),tint:'#22c55e',
  poly:[[700,280],[800,240],[950,215],[1100,195],[1250,170],[1370,150],[1370,470],[1250,440],[1150,400],[1050,365],[900,345],[760,335]],
  anchor:[1250,330],lead:true,blk:{x:628,y:48,al:'right'},cond:[['shade',P('遮蔭','Shade')],['temp',P('溫度','Temperature')]]}
];

// ── layout ────────────────────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:484},ASP=WIN.h/WIN.w;
const BASE={x:230,y:43,w:1140};                 // base view (picture px); h = w*ASP = 890
const CARD={x:652,y:16,w:292,h:550};
const PILL_H=40,CHIP_H=34,GAP=4,ROW_Y=510,SQ=32;
const MOUNT=[1130,78],SEA=[330,890];

// ── helpers (as in the response / frogs views) ───────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，])|(?<=[:,] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',stroke=null}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:(stroke||rgba(col,.9)));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?C.ink:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// numbered green square (one ecosystem)
function square(c,n,x,y,t,ph=0){const b=1+.04*Math.sin(t*2+ph);const s=SQ*b;
  D.round(c,x-s/2,y-s/2,s,s,6,GREEN,WHITE);
  c.save();c.font=K.MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}

// ── camera (picture px rect) and mapping ──────────────────────────────────
function camAt(cx,cy,zoom){const w=BASE.w/zoom,h=w*ASP;return{x:clamp((cx-w/2)/(IW-w))*(IW-w),y:clamp((cy-h/2)/(IH-h))*(IH-h),w};}
const CAM_BASE={x:BASE.x,y:BASE.y,w:BASE.w},CAM_MT=camAt(1010,250,1.8),CAM_SEA=camAt(480,760,2.0);
const lerpCam=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u)});
// step 0 path: base -> mountains (0.3..2) -> sea (2..5.6) -> base (5.6..8), then a slow drift
function camPath(tau,t){
  if(tau<.3)return CAM_BASE;
  if(tau<2)return lerpCam(CAM_BASE,CAM_MT,smooth((tau-.3)/1.7));
  if(tau<5.6)return lerpCam(CAM_MT,CAM_SEA,smooth((tau-2)/3.6));
  if(tau<8)return lerpCam(CAM_SEA,CAM_BASE,smooth((tau-5.6)/2.4));
  const d=.5+.5*Math.sin((tau-8)*.6-Math.PI/2),z=1+.04*d;return camAt(800+30*Math.sin((tau-8)*.35),488,z);
}
const map=(cam,[px,py])=>[WIN.x+(px-cam.x)*WIN.w/cam.w,WIN.y+(py-cam.y)*WIN.w/cam.w];

// smooth closed / open path through points (midpoint quadratic)
function smoothPath(c,pts,closed){
  const n=pts.length;c.beginPath();
  if(closed){const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];let s=m(pts[n-1],pts[0]);c.moveTo(...s);
    for(let i=0;i<n;i++){const p=pts[i],q=m(p,pts[(i+1)%n]);c.quadraticCurveTo(p[0],p[1],q[0],q[1]);}c.closePath();}
  else{c.moveTo(...pts[0]);for(let i=1;i<n-1;i++){const p=pts[i],q=[(p[0]+pts[i+1][0])/2,(p[1]+pts[i+1][1])/2];c.quadraticCurveTo(p[0],p[1],q[0],q[1]);}c.lineTo(...pts[n-1]);}
}
// feathered patch: the shape itself is drawn far off-canvas; only its blurred shadow lands here (works without ctx.filter)
const OFF=4000;
function soft(c,pts,closed,col,a,blur,lw){
  const m=c.getTransform(),sx=Math.hypot(m.a,m.b)||1;
  c.save();c.shadowColor=rgba(col,a);c.shadowBlur=blur*sx;c.shadowOffsetX=OFF*sx;c.shadowOffsetY=0;
  c.translate(-OFF,0);smoothPath(c,pts,closed);
  if(closed){c.fillStyle='#16332b';c.fill();}else{c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';c.strokeStyle='#16332b';c.stroke();}
  c.restore();
}
function outline(c,pts,closed,t,a){
  c.save();c.setLineDash([10,7]);c.lineDashOffset=-t*14;c.lineWidth=2.5;c.strokeStyle=rgba(GREEN,.9*a);
  c.shadowColor=rgba(GREEN,.7*a);c.shadowBlur=8*(Math.hypot(c.getTransform().a,c.getTransform().b)||1);
  smoothPath(c,pts,closed);c.stroke();c.restore();
}

// ── condition icons (drawn, centred at x,y, ~22 px) ─────────────────────────
function icon(c,kind,x,y,t,s=1){
  c.save();c.translate(x,y);c.scale(s,s);const col=KIND[kind];
  if(kind==='light'||kind==='shade'){
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2+t*.5;K.sline(c,[[8*Math.cos(a),8*Math.sin(a)],[12*Math.cos(a),12*Math.sin(a)]],col,2.5);}
    circle(c,0,0,6,col,null);
    if(kind==='shade'){c.save();c.rotate(-.6+.08*Math.sin(t*1.2));K.ellipse(c,4,4,9,5,'#166534',C.ink,1.5);K.sline(c,[[-4,4],[12,4]],'#86efac',1.5);c.restore();}
  }else if(kind==='temp'){
    D.round(c,-4,-12,8,18,4,'rgba(11,26,21,.9)',WHITE);circle(c,0,8,6,col,WHITE,1.5);
    const lv=.7+.15*Math.sin(t*1.5);D.round(c,-1.8,6-14*lv,3.6,14*lv+2,1.8,col,null);
  }else if(kind==='salt'){
    const b=1+.06*Math.sin(t*2);c.save();c.scale(b,b);
    c.beginPath();c.moveTo(0,-11);c.lineTo(9,-5);c.lineTo(9,6);c.lineTo(0,12);c.lineTo(-9,6);c.lineTo(-9,-5);c.closePath();
    c.fillStyle=col;c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();
    K.sline(c,[[-9,-5],[0,1],[9,-5]],'#b9b29f',1.5);K.sline(c,[[0,1],[0,12]],'#b9b29f',1.5);c.restore();
  }else{
    // water family
    const drop=(dx,dy,r)=>{c.beginPath();c.moveTo(dx,dy-r*1.7);c.bezierCurveTo(dx+r,dy-r*.5,dx+r,dy+r,dx,dy+r);c.bezierCurveTo(dx-r,dy+r,dx-r,dy-r*.5,dx,dy-r*1.7);c.fillStyle=col;c.fill();};
    const wave=(dy,ph)=>{const pts=[];for(let i=0;i<=12;i++){const xx=-12+i*2;pts.push([xx,dy+2.5*Math.sin(xx*.5+t*3+ph)]);}K.sline(c,pts,col,2.5);};
    if(kind==='water')drop(0,2,7);
    else if(kind==='waves'){wave(-5,0);wave(2,1.4);wave(9,2.8);}
    else if(kind==='flow'){wave(-2,0);const ax=6+2*Math.sin(t*3);K.arrow(c,-10,8,ax+4,8,col,2.5);}
    else if(kind==='shallow'){drop(0,-3,5);K.sline(c,[[-12,9],[12,9]],col,2.5);wave(4,0);}
    else if(kind==='irrig'){drop(-4,-2,5.5);K.sline(c,[[-12,10],[12,10]],col,3);K.sline(c,[[6,-6],[6,10]],col,2.5);}
    else if(kind==='rain'){[-7,0,7].forEach((dx,i)=>{const yy=-6+mod(t*1.2+i*.33)*14;c.save();c.globalAlpha*=.4+.6*Math.sin(mod(t*1.2+i*.33)*Math.PI);drop(dx,yy,3.2);c.restore();});}
  }
  c.restore();
}
// condition chip: icon + name, outlined in the kind's colour
function chipW(c,p){return 10+24+6+measure(c,p,22)+14;}
function chip(c,kind,p,x,y,t){const w=chipW(c,p),col=KIND[kind];
  D.round(c,x,y,w,CHIP_H,CHIP_H/2,'rgba(11,26,21,.92)',rgba(col,.9));
  icon(c,kind,x+10+12,y+CHIP_H/2,t,.9);text(c,p,x+40,y+CHIP_H/2+8,22,col);return{x,y,w,h:CHIP_H};}

// block geometry for region i (name pill + chip row), all in canvas px
function block(c,r){
  const pw=tagW(c,r.name),cw=r.cond.map(([,p])=>chipW(c,p)),rw=cw[0]+6+cw[1],bw=Math.max(pw,rw);
  const left=r.blk.al==='right'?r.blk.x-bw:r.blk.x;
  const px=r.blk.al==='right'?r.blk.x-pw:left;
  const cx0=r.blk.al==='right'?r.blk.x-rw:left;
  return{pill:{x:px,y:r.blk.y,w:pw,h:PILL_H},chips:[{x:cx0,y:r.blk.y+PILL_H+GAP,w:cw[0]},{x:cx0+cw[0]+6,y:r.blk.y+PILL_H+GAP,w:cw[1]}],
    box:{x:left,y:r.blk.y,w:bw,h:PILL_H+GAP+CHIP_H}};
}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.mosaicSt||(s.mosaicSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;st.cam=CAM_BASE;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.camFrom=st.cam||CAM_BASE;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.camFrom=st.cam||CAM_BASE;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const at=(d,dur=.45)=>clamp((tau-d)/dur);
  const fromA=(test)=>moving&&st.from>=0&&test(st.from)?1-u:0;

  // ── camera ──
  let cam=k===0?camPath(tau,t):CAM_BASE;
  if(k!==0&&st.camFrom&&tau<MOVE)cam=lerpCam(st.camFrom,CAM_BASE,smooth(tau/MOVE));
  st.cam=cam;

  // ── the picture ──
  D.round(c,WIN.x-2,WIN.y-2,WIN.w+4,WIN.h+4,14,'#16332b',null);
  K.drawIn(c,FILE,{x:WIN.x,y:WIN.y,w:WIN.w,h:WIN.h},{radius:12,crop:[cam.x/IW,cam.y/IH,cam.w/IW,cam.w*ASP/IH]});

  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  // step 0 landmarks: mountains / sea pills ride with the picture
  const lmA=k===0?at(.4,.6):fromA(kk=>kk===0);
  withA(c,lmA,()=>{
    // a landmark pill shows only while its point is inside the window; the pill is kept fully inside the window
    const lm=(pt,p,col,below)=>{const [x0,y0]=map(cam,pt),inside=x0>WIN.x+6&&x0<WIN.x+WIN.w-6&&y0>WIN.y+6&&y0<WIN.y+WIN.h-6;if(!inside)return null;
      const w=tagW(c,p),px=Math.max(WIN.x+8,Math.min(x0-w/2,WIN.x+WIN.w-w-8)),py=Math.max(WIN.y+8,Math.min(below?y0+14:y0-54,WIN.y+WIN.h-48));
      circle(c,x0,y0,6,col,C.ink,2);return tag(c,p,px,py,{col});};
    const r1=lm(MOUNT,T.mountain,WHITE,true),r2=lm(SEA,T.sea,WATER,false);
    s_dbg.lm=[r1,r2];
  });

  // patches (steps 1..3); a light dark veil first so the soft green patches read on a green picture
  const pA=k>=1?1:fromA(()=>true);
  const veil=k>=1?(st.from===0&&moving?u:1):fromA(()=>true);
  if(veil>0){c.fillStyle=rgba('#0b1a15',.32*veil);c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);}
  if(pA>0)REG.forEach((r,i)=>{
    const on=k===1?(st.from>=2?1:at(.5+i*.9,.6)):1;
    const a=pA*on;if(a<=0)return;
    const breathe=.5+.5*Math.sin(t*1.6+i*1.1);
    const pts=(r.poly||r.line).map(p=>map(cam,p)),closed=!!r.poly;
    const base=k===2?.42:.58,lit=k===1?(1-at(1.1+i*.9,1.2))*.3:0,all=k===3?.08*breathe:0;
    soft(c,pts,closed,r.tint,(base+lit+all)*a,(k===3?14+10*breathe:14+4*breathe),closed?0:20);
    outline(c,pts,closed,t,a*(k===2?.7:1));
    if(k===1&&on<1)K.glow(c,...map(cam,r.anchor),40,GREEN,.5*on);
  });
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  // name blocks (steps 1..3)
  const rects=[];
  REG.forEach((r,i)=>{
    const g=block(c,r);
    const nameA=k===1?(st.from>=2?1:at(.8+i*.9,.45)):k>=2?1:fromA(kk=>kk>=1);
    if(nameA<=0)return;
    withA(c,nameA,()=>{
      // leader from the block to the region when the anchor is outside the block
      if(r.lead){const [ax,ay]=map(CAM_BASE,r.anchor),bx=g.box;
        const ly=k===2?bx.y+bx.h:g.pill.y+g.pill.h,lx=clamp((ax-g.pill.x)/g.pill.w)*g.pill.w+g.pill.x;
        K.sline(c,[[lx,ly],[ax,ay]],rgba(GREEN,.9),2.5);circle(c,ax,ay,6,GREEN,C.ink,2);}
      const pr=tag(c,r.name,g.pill.x,g.pill.y,{col:WHITE,stroke:GREEN});
      if(k===1&&st.from<2&&tau<.8+i*.9+1.6)ring(c,pr,t,GREEN);
      rects.push(pr);
      // numbered square (step 3), on the outer side of the pill
      const sqA=k===3?at(.3+i*.15,.4):fromA(kk=>kk===3);
      if(sqA>0)withA(c,sqA,()=>{const sxp=r.blk.al==='right'?g.pill.x-SQ/2-8:g.pill.x+g.pill.w+SQ/2+8;square(c,i+1,sxp,g.pill.y+PILL_H/2,t,i);
        rects.push({x:sxp-SQ/2,y:g.pill.y+PILL_H/2-SQ/2,w:SQ,h:SQ});});
    });
    // condition chips (step 2)
    const chA=k===2?at(.6+i*.85,.45):fromA(kk=>kk===2);
    if(chA>0)withA(c,chA,()=>{r.cond.forEach(([kind,p],j)=>{const q=g.chips[j];const yy=q.y+(1-ease(chA))*8;rects.push(chip(c,kind,p,q.x,yy,t+j*.4));});});
  });
  s_dbg.rects=rects;

  // ── count row (step 3) ──
  const cA=k===3?1:fromA(kk=>kk===3);
  if(cA>0)withA(c,cA,()=>{
    REG.forEach((r,i)=>{
      const g=block(c,r),sx0=r.blk.al==='right'?g.pill.x-SQ/2-8:g.pill.x+g.pill.w+SQ/2+8,sy0=g.pill.y+PILL_H/2;
      const tx=WIN.x+8+SQ/2+i*(SQ+10),ty=ROW_Y+24,f=k===3?ease(at(1.2+i*.35,.9)):1;
      if(f<=0)return;
      const xx=mix(sx0,tx,f),yy=mix(sy0,ty,f)-Math.sin(f*Math.PI)*30;
      if(f<1)withA(c,.85,()=>square(c,i+1,xx,yy,t,i));else square(c,i+1,tx,ty,t,i);
    });
    const sumA=k===3?at(3.6,.6):1,sx=WIN.x+8+6*(SQ+10)+6;
    withA(c,sumA,()=>{
      text(c,T.total,sx,ROW_Y+32,22,GREEN);
      const sw=measure(c,T.total,22),pr=tag(c,L('schematic','示意','Schematic'),sx+sw+14,ROW_Y+4,{col:WHITE});
      if(k===3)ring(c,pr,t,WHITE);s_dbg.row=[sx,sx+sw,pr];
    });
  });

  // ── step card (right) ──
  card(c,k,st,moving,x,u,tau,t);

  // notes: AI picture always; schematic patches from step 1
  withA(c,k>=1?1:fromA(kk=>kk>=1),()=>text(c,T.patchNote,24,592,22,MUTED,'left'));
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,592,22,MUTED,'right');
}

function card(c,k,st,moving,x,u,tau,t){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=tag(c,L('ecosystem','生態系多樣性','Ecosystem diversity'),ix,R.y+14,{col:GREEN});
  let y=R.y+14+hr.h+14;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  T.short.forEach((p,j)=>{
    const rows=blines(c,p,iw-46),hh=40+(rows.length-1)*28;
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true));
    rows.forEach((q,n)=>text(c,q,ix+42,cy+8+n*28,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(38,blines(c,p,iw-50).length*28+12)),ly=R.y+R.h-10-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const fade=moving&&st.from>=0&&JSON.stringify(legend(st.from).map(l=>l[0]))!==JSON.stringify(legs.map(l=>l[0]))?u:1;
  withA(c,fade,()=>{let yy=ly;legs.forEach(([kind,p],q)=>{swatch(c,kind,ix,yy,t);bwrap(c,p,ix+50,yy+28,iw-50,22,WHITE,28);yy+=lhs[q];});});
}
function legend(k){
  if(k===0)return[['cam',T.cam]];
  if(k===1)return[['patch',T.patch],['grad',T.gradual]];
  if(k===2)return[['light',T.light],['water',T.water],['temp',T.temp],['salt',T.salt]];
  return[['square',T.square],['grad',T.gradual]];
}
function swatch(c,kind,x,y,t){
  const cx=x+20,cy=y+20;
  if(kind==='cam'){const v=mod(t*.5);K.sline(c,[[cx-8,cy-14],[cx-8,cy+12]],rgba(WHITE,.5),2);K.arrow(c,cx+4,cy-14,cx+4,cy-14+26*ease(v)+2,WHITE,3);}
  else if(kind==='patch'){c.save();c.beginPath();c.rect(x,y,44,40);c.clip();soft(c,[[cx-14,cy-10],[cx+14,cy-12],[cx+16,cy+10],[cx-12,cy+12]],true,GREEN,.6,10,0);
    outline(c,[[cx-14,cy-10],[cx+14,cy-12],[cx+16,cy+10],[cx-12,cy+12]],true,t,1);c.restore();}
  else if(kind==='grad'){const b=.5+.5*Math.sin(t*1.6);const g=c.createLinearGradient(x+2,0,x+40,0);
    g.addColorStop(0,rgba(GREEN,.9));g.addColorStop(.35+.25*b,rgba(GREEN,.45));g.addColorStop(1,rgba('#d9f99d',.08));
    D.round(c,x+2,cy-10,38,20,6,g,null);}
  else if(kind==='square')square(c,1,cx,cy,t);
  else icon(c,kind,cx,cy,t,1.1);
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.mosaic=draw;
window.EnvironmentDraw.mosaic.dbg=s_dbg;
})();

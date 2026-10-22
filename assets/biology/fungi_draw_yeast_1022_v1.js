/* Fungi · "yeast" canvas (Tab 2: why does dough rise? three bottles with balloons), 2026-10-22.
 * Registers window.FungiDraw.yeast; called as draw(ctx, state, t) on the 960x600 canvas. Sets s.shown (stage 0..3).
 * Step 1: three identical glass bottles fade in one by one (same yeast icons, same balloon); under each its condition
 *   (A sugar + warm water, B no sugar + warm water, C sugar + cold water with ice); dashed arcs A–B "only sugar differs",
 *   A–C "only temperature differs".
 * Step 2: predict. The bottles pulse in turn and can be tapped (D.hit 'guess'); the chosen one gets a yellow frame.
 *   Balloons stay the same size: no result is shown before "See the result".
 * Step 3: the result (starts when the step starts, so it is replayed by pressing the step button): A's balloon swells
 *   most, C's slowly and a little, B's hardly; pink carbon-dioxide bubbles (many in A, few in C, almost none in B).
 *   Then a green tick over A and a short label next to the predicted bottle. Qualitative only: no numbers anywhere.
 * Step 4: bottle A slides left; a round zoom grows out of one of its yeast cells (bt:yeast_budding.png): sugar goes in,
 *   carbon dioxide and alcohol come out; carbon dioxide rises into the balloon. Dough bowl cross-fades to risen dough.
 * Bottles, balloons, water, ice, sugar and bubbles are drawn in code; yeast and dough are the biotech AI pictures.
 * The page shell owns the animation loop (one RAF for the whole page); this module draws one frame and keeps no timer.
 */
(()=>{'use strict';
const K=window.FungiKit,{P,C,D,text,measure,splitLines,rgba,clamp,mix,ease,smooth,fade,stageClock,drawIn,at,fitRect,circle,line,dashed,cpill,glow,mod,marker,MONO,TAU}=K;
const N=4,PER=9;

// ── words ──────────────────────────────────────────────────────────────────
const T={
 bottle:[P(`A 瓶`,`Bottle A`),P(`B 瓶`,`Bottle B`),P(`C 瓶`,`Bottle C`)],
 mat:[P(`有糖、溫水`,`Sugar, warm water`),P(`沒有糖、溫水`,`No sugar, warm water`),P(`有糖、冷水`,`Sugar, cold water`)],
 yeast:P(`酵母菌（等量）`,`Yeast (equal amount)`),
 onlySugar:P(`只差糖`,`Only sugar differs`),onlyTemp:P(`只差溫度`,`Only temperature differs`),
 ask:P(`哪一個氣球會鼓得最明顯？`,`Which balloon will swell the most?`),
 choose:P(`先選一個預測`,`Choose a prediction first`),
 right:P(`你猜對了`,`You were right`),wrongA:P(`A 瓶最明顯`,`Bottle A swells most`),
 qual:P(`定性比較：只看誰多誰少，快慢是示意`,`Qualitative: only more or less; the speed is a sketch`),
 alcohol:P(`酒精`,`Alcohol`),
 dough:P(`麵團：二氧化碳被包住，麵團膨脹`,`Dough: carbon dioxide is trapped, so it swells`),
 single:P(`酵母菌（單細胞真菌）`,`Yeast (a single-celled fungus)`),
 // names for the other things on the canvas (everything drawn gets a name)
 balloon:P(`氣球`,`Balloon`),sugar:P(`糖`,`Sugar`),ice:P(`冰塊`,`Ice`),co2:P(`二氧化碳`,`Carbon dioxide`),
 ai:P(`AI 插圖，非顯微照片`,`AI illustration, not a micrograph`)};
const LAV='#c4b5fd',BAL_EDGE='#cfc3ff',ALC='#d8d0ff';

// ── geometry of one bottle (local coordinates: x from the centre line, y up from the base = 0) ──────────────
const G={bw:70,bodyTop:-165,neckY:-205,nw:22,lipY:-238,lipW:27,liq:-105};
// layouts per step: [cx, base y, scale, alpha]
const ROW=[[170,465,1,1],[480,465,1,1],[790,465,1,1]];
const LAY=[ROW,ROW,ROW,[[150,470,.78,1],[560,465,1,0],[860,465,1,0]]];
const YX=[-45,-15,15,45],SX=[-38,2,40],IX=[-40,-2,36];
// bubbles: fixed scatter (threshold th decides how many show: A all, C a few, B about one)
const BUB=[...Array(16)].map((_,j)=>{const h=n=>mod(Math.sin((j+1)*n)*43758.5453);return{th:(j+.6)/16,x:h(12.9)*2-1,sp:.7+.6*h(78.2),ph:h(39.3),r:h(5.7)};});

// ── helpers ────────────────────────────────────────────────────────────────
function track(s,key,k,t,dur){
  let o=s[key];if(!o||t<o.t){o=s[key]={k,from:k,t:t-9};}
  if(o.k!==k){o.from=o.k;o.k=k;o.t=t;}
  return{from:o.from,u:ease((t-o.t)/dur)};
}
// smoothed balloon size and bubble activity per bottle (so that changing step never jumps)
function follow(s,t,inf,act){
  let o=s._yS;if(!o||t<o.t||t-o.t>1){o=s._yS={t,inf:inf.slice(),act:act.slice()};}
  const r=1-Math.exp(-(t-o.t)*5);o.t=t;
  for(let i=0;i<3;i++){o.inf[i]+=(inf[i]-o.inf[i])*r;o.act[i]+=(act[i]-o.act[i])*r;}
  return o;
}
function rowsOf(c,p,w,size=22){
  const str=D.tr(p),rows=splitLines(c,str,w,size);
  for(let i=0;i<rows.length-1;i++)if(/[（(]$/.test(rows[i])){rows[i]=rows[i].slice(0,-1).trimEnd();rows[i+1]=(/（/.test(str)?'（':'(')+rows[i+1];}
  return rows;
}
// A label: rows of text with the top at y; leaders from the nearest edge to each target in tgts.
function tag(c,p,x,y,{col=C.white,align='center',maxW=260,tgts=[],a=1,size=22}={}){
  if(a<=.004)return null;
  const rows=rowsOf(c,p,maxW,size),lh=size+6,w=Math.max(...rows.map(r=>measure(c,r,size))),h=rows.length*lh;
  const x0=align==='left'?x:align==='right'?x-w:x-w/2;
  c.save();c.globalAlpha*=a;
  for(const [tx,ty] of tgts){
    let sx,sy;
    if(tx<x0-4){sx=x0-6;sy=clamp((ty-y)/h)*h*.6+y+h*.2;}else if(tx>x0+w+4){sx=x0+w+6;sy=clamp((ty-y)/h)*h*.6+y+h*.2;}
    else if(ty>y+h){sx=tx;sy=y+h+4;}else{sx=tx;sy=y-4;}
    line(c,[[sx,sy],[tx,ty]],rgba(col,.9),2);circle(c,tx,ty,4.5,col,C.ink,1.5);
  }
  rows.forEach((r,i)=>text(c,r,x,y+size-1+i*lh,size,col,align));
  c.restore();
  return{x0,y,w,h};
}
function check(c,x,y,a=1,r=18){
  if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,C.green,C.ink,2);
  c.strokeStyle=C.ink;c.lineWidth=4.5;c.lineCap='round';c.lineJoin='round';c.beginPath();
  c.moveTo(x-r*.45,y+r*.02);c.lineTo(x-r*.1,y+r*.36);c.lineTo(x+r*.5,y-r*.34);c.stroke();c.restore();
}
const toCanvas=(g,x,y)=>[g.cx+x*g.sc,g.base+y*g.sc];

// ── the bottle, drawn in code ──────────────────────────────────────────────
function glassPath(c){
  c.beginPath();c.moveTo(-G.nw,G.lipY+6);c.lineTo(-G.nw,G.neckY);
  c.bezierCurveTo(-G.nw,G.neckY+24,-G.bw,G.bodyTop-16,-G.bw,G.bodyTop+10);
  c.lineTo(-G.bw,-18);c.quadraticCurveTo(-G.bw,0,-G.bw+18,0);c.lineTo(G.bw-18,0);c.quadraticCurveTo(G.bw,0,G.bw,-18);
  c.lineTo(G.bw,G.bodyTop+10);c.bezierCurveTo(G.bw,G.bodyTop-16,G.nw,G.neckY+24,G.nw,G.neckY);c.lineTo(G.nw,G.lipY+6);
}
function water(c,cold,t){
  const lt=G.liq,wv=x=>Math.sin(x*.07+t*2.1)*1.8,L=-G.bw+3,R=G.bw-3;
  c.beginPath();c.moveTo(L,lt+wv(L));for(let x=L;x<=R;x+=5)c.lineTo(x,lt+wv(x));
  c.lineTo(R,-18);c.quadraticCurveTo(R,-3,R-15,-3);c.lineTo(L+15,-3);c.quadraticCurveTo(L,-3,L,-18);c.closePath();
  const g=c.createLinearGradient(0,lt,0,0);
  if(cold){g.addColorStop(0,'rgba(140,240,255,.42)');g.addColorStop(1,'rgba(60,150,220,.48)');}
  else{g.addColorStop(0,'rgba(110,165,225,.40)');g.addColorStop(1,'rgba(251,146,60,.34)');}
  c.fillStyle=g;c.fill();
  c.beginPath();c.moveTo(L,lt+wv(L));for(let x=L;x<=R;x+=5)c.lineTo(x,lt+wv(x));
  c.strokeStyle=cold?'rgba(170,245,255,.85)':'rgba(190,215,245,.8)';c.lineWidth=2;c.stroke();
}
function ice(c,x,y,sz,rot){
  c.save();c.translate(x,y);c.rotate(rot);c.beginPath();c.roundRect(-sz/2,-sz/2,sz,sz,4);
  c.fillStyle='rgba(225,250,255,.62)';c.fill();c.strokeStyle='#e8fbff';c.lineWidth=2;c.stroke();
  c.beginPath();c.moveTo(-sz*.28,-sz*.18);c.lineTo(sz*.05,-sz*.3);c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=2;c.stroke();c.restore();
}
function bubble(c,x,y,r,a){if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,rgba(C.pink,.28),rgba(C.pink,.95),1.6);circle(c,x-r*.35,y-r*.35,r*.28,'rgba(255,240,250,.85)',null);c.restore();}
// balloon on the lip; returns its body ellipse (local coordinates, before the sway)
function balloon(c,inf,t,act){
  const rx=mix(19,66,inf),ry=mix(30,76,inf),hn=mix(16,22,inf),sw=Math.sin(t*1.3)*.05*(1-.5*inf),cy=-hn-ry*.95;
  c.save();c.translate(0,G.lipY);c.rotate(sw);
  const tl=Math.acos(-10/rx),tr=Math.acos(10/rx);
  c.beginPath();c.moveTo(-G.lipW+1,8);c.lineTo(-10,cy+ry*Math.sin(tl));c.ellipse(0,cy,rx,ry,0,tl,TAU+tr);c.lineTo(G.lipW-1,8);c.closePath();
  const g=c.createRadialGradient(-rx*.35,cy-ry*.4,2,0,cy,Math.max(rx,ry));g.addColorStop(0,'rgba(236,230,255,.62)');g.addColorStop(1,'rgba(167,139,250,.42)');
  c.fillStyle=g;c.fill();c.strokeStyle=BAL_EDGE;c.lineWidth=2.6;c.lineJoin='round';c.stroke();
  c.beginPath();c.ellipse(-rx*.42,cy-ry*.38,rx*.14,ry*.22,-.4,0,TAU);c.fillStyle='rgba(255,255,255,.42)';c.fill();
  // carbon dioxide gathered in the balloon
  const n=inf>.3?Math.round(inf*4):0;
  for(let j=0;j<n;j++)D.co2(c,rx*.42*Math.sin(t*.7+j*2.1),cy+ry*.4*Math.cos(t*.55+j*1.7),3.4);
  // rubber band over the lip
  c.beginPath();c.roundRect(-G.lipW-3,-2,2*G.lipW+6,13,5);c.fillStyle='#8f7fe0';c.fill();c.strokeStyle=BAL_EDGE;c.lineWidth=1.5;c.stroke();
  c.restore();
  return{cy:G.lipY+cy,rx,ry};
}
function bottle(c,i,g,st,t){
  if(g.a<=.01)return null;
  c.save();c.globalAlpha*=g.a;c.translate(g.cx,g.base);c.scale(g.sc,g.sc);
  const cold=i===2,act=st.act[i];
  glassPath(c);c.closePath();c.fillStyle='rgba(242,236,217,.05)';c.fill();
  water(c,cold,t);
  YX.forEach((x,j)=>at(c,'bt:yeast_small.png',x,-23+Math.sin(t*1.5+j*1.3)*1.5,28));
  if(i!==1)SX.forEach((x,j)=>D.sugar(c,x,-62+Math.sin(t*1.2+j*2)*2,6));
  if(cold)IX.forEach((x,j)=>ice(c,x,G.liq+1+Math.sin(t*1.6+j)*1.6,21,Math.sin(t*.8+j*2)*.12));
  // carbon dioxide bubbles (cold bottle: slower)
  const slow=cold?.5:1;
  BUB.forEach((b,j)=>{const a=clamp((act-b.th)/.06);if(a<=0)return;
    const p=mod(t*b.sp*.42*slow+b.ph),x=b.x*54+Math.sin(t*2+j)*3,y=mix(-34,G.liq+6,p),r=2.6+b.r*3.4*(.6+.4*p);
    bubble(c,x,y,r,a*Math.min(1,p*5)*(1-smooth((p-.86)/.14)));});
  // glass outline, lip
  glassPath(c);c.strokeStyle=rgba(C.white,.85);c.lineWidth=2.6;c.lineJoin='round';c.stroke();
  line(c,[[-G.bw+12,-146],[-G.bw+12,-34]],'rgba(242,236,217,.22)',5);
  c.beginPath();c.roundRect(-G.lipW,G.lipY,2*G.lipW,9,3);c.strokeStyle=rgba(C.white,.85);c.lineWidth=2.2;c.stroke();
  const bal=balloon(c,st.inf[i],t,act);
  // carbon dioxide rising through the neck into the balloon
  const m=i===0?3:i===2?1:0;
  if(act>.25)for(let j=0;j<m;j++){const p=mod(t*.33*slow+j/m),y=mix(G.liq-8,G.lipY-26,p);
    c.save();c.globalAlpha*=clamp(act)*Math.sin(Math.PI*p);D.co2(c,Math.sin(p*6+j)*7,y,3.2);c.restore();}
  c.restore();
  return bal;
}

// ── step 4: the zoom on one yeast cell ─────────────────────────────────────
const ZX=420,ZY=290,ZR=140;
function zoom(c,src,tau,t,a){
  if(a<=.004)return;
  const zu=ease((tau-.3)/1.0),zx=mix(src[0],ZX,zu),zy=mix(src[1],ZY,zu),R=mix(12,ZR,zu),k=R/ZR;
  c.save();c.globalAlpha*=a;
  glow(c,src[0],src[1],22,C.yellow,.35+.2*Math.sin(t*3));
  c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*10;
  const ang=Math.atan2(zy-src[1],zx-src[0]);
  for(const d of [-1,1]){const q=ang+Math.PI+d*1.05;line(c,[[src[0],src[1]],[zx+R*Math.cos(q),zy+R*Math.sin(q)]],rgba(C.white,.7),2);}
  c.restore();
  circle(c,zx,zy,R,C.panel,null);
  c.save();c.beginPath();c.arc(zx,zy,R,0,TAU);c.clip();
  at(c,'bt:yeast_budding.png',zx,zy+Math.sin(t*1.1)*2*k,240*k);
  const pa=fade(tau,1.5,.6);
  if(pa>0){c.globalAlpha*=pa;
    // direction of each flow (sugar in; carbon dioxide and alcohol out), behind the moving molecules
    for(const [x1,y1,x2,y2,col] of [[104,92,26,26,C.yellow],[-22,-22,-92,-98,C.pink],[-2,44,6,124,ALC]])
      K.arrow(c,zx+(x1+14)*k,zy+(y1-6)*k,zx+(x2+14)*k,zy+(y2-6)*k,rgba(col,.8),3);
    for(let j=0;j<3;j++){const p=mod(t*.26+j/3),q=ease(p),x=zx+mix(92,12,q)*k,y=zy+mix(80,14,q)*k,al=Math.min(1,p*6)*(1-smooth((p-.7)/.3));
      c.save();c.globalAlpha*=al;D.sugar(c,x,y,8*k);c.restore();}
    for(let j=0;j<3;j++){const p=mod(t*.26+j/3+.18),x=zx+mix(-8,-80,p)*k,y=zy+mix(-8,-86,p)*k,al=smooth(p/.2)*(1-smooth((p-.85)/.15));
      c.save();c.globalAlpha*=al;bubble(c,x,y,13*k,1);D.co2(c,x,y,3.6*k);c.restore();}
    for(let j=0;j<2;j++){const p=mod(t*.22+j/2+.4),x=zx+mix(8,18,p)*k,y=zy+mix(34,112,p)*k,al=smooth(p/.2)*(1-smooth((p-.85)/.15));
      c.save();c.globalAlpha*=al;c.beginPath();c.moveTo(x,y-9*k);c.quadraticCurveTo(x+7*k,y+1*k,x,y+6*k);c.quadraticCurveTo(x-7*k,y+1*k,x,y-9*k);
      c.fillStyle=ALC;c.fill();c.strokeStyle=C.white;c.lineWidth=1.2;c.stroke();c.restore();}
  }
  c.restore();
  circle(c,zx,zy,R,null,rgba(C.white,.85),3);
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u}=track(s,'_yL',k,t,1.0),out=held?1:1-fade(tau,PER-.5,.5);
  const only=(j,d=0)=>k===j?fade(tau,d,.5)*out:(from===j?1-u:0);        // alpha of things that belong to step j
  const first=k===0&&from===0;                                           // step 1 shown fresh (not reached from another step)

  // balloons and bubbles (qualitative: A most, C slowly and a little, B hardly)
  let inf=[0,0,0],act=[0,0,0];
  if(k===2){inf=[ease((tau-.8)/4.2),.05*smooth((tau-1.2)/5),.36*smooth((tau-1.6)/6.4)];act=[clamp((tau-.5)/.8),.08*clamp((tau-1)/1),.32*clamp((tau-1.2)/1)];}
  if(k===3){inf=[1,.05,.36];act=[1,0,0];}
  const st=follow(s,t,inf,act);

  const L=[0,1,2].map(i=>{const a=LAY[from][i],b=LAY[k][i];
    return{cx:mix(a[0],b[0],u),base:mix(a[1],b[1],u),sc:mix(a[2],b[2],u),a:mix(a[3],b[3],u)*(first?fade(tau,.15+i*.45,.6):1)};});
  const balTop=i=>{const g=L[i],ry=mix(30,76,st.inf[i]),hn=mix(16,22,st.inf[i]);return g.base+(G.lipY-hn-ry*1.95)*g.sc;};

  // step 2 and 3: the chosen bottle has a yellow frame; step 2: the bottles pulse in turn
  const fr=Math.max(only(1),only(2));
  if(fr>0)for(let i=0;i<3;i++){const g=L[i],x=g.cx-80,y=Math.min(132,balTop(i)-12),h=g.base+10-y;
    if(s.guess===i){c.save();c.globalAlpha*=fr*g.a;D.round(c,x,y,160,h,16,rgba(C.yellow,.07),null);c.strokeStyle=C.yellow;c.lineWidth=4;c.beginPath();c.roundRect(x,y,160,h,16);c.stroke();c.restore();}
    const pu=only(1)*Math.max(0,Math.sin((t*1.4-i*.7)*Math.PI))**2*(s.guess===i?0:1);
    if(pu>0){c.save();c.globalAlpha*=pu*.8;c.strokeStyle=rgba(C.yellow,.9);c.lineWidth=3;c.setLineDash([10,7]);c.beginPath();c.roundRect(x+4,y+4,152,h-8,14);c.stroke();c.restore();}
  }

  // the three bottles
  const bal=[0,1,2].map(i=>bottle(c,i,L[i],st,t));

  // names and conditions under the bottles
  for(let i=0;i<3;i++){const g=L[i];if(g.a<=.01)continue;
    const chosen=s.guess===i&&fr>0;
    c.save();c.globalAlpha*=g.a;
    if(chosen){c.save();c.globalAlpha*=fr;cpill(c,T.bottle[i],g.cx,g.base+12,{active:true,size:24,color:C.yellow,minX:20,maxX:940});c.restore();}
    if(!chosen||fr<1){c.save();c.globalAlpha*=chosen?1-fr:1;text(c,T.bottle[i],g.cx,g.base+42,26,C.white,'center');c.restore();}
    text(c,T.mat[i],g.cx,g.base+78,22,i===2?'#a5f3fc':'#fdba74','center');
    c.restore();}

  // names of the things in the bottles (steps 1–3, the labels sit in the gaps between the bottles)
  const grp=k<=2?(from===3?u:1):(from<=2?1-u:0),ga=grp*(first?fade(tau,1.6,.6):1);
  if(ga>0){
    const A=L[0],B=L[1],Cc=L[2],ba=bal[0];
    if(ba){const ry=ba.ry*A.sc;tag(c,T.balloon,325,176,{maxW:140,a:ga,tgts:[[A.cx+ba.rx*A.sc*.92,A.base+ba.cy*A.sc+ry*.32]]});}
    tag(c,T.sugar,325,350,{col:C.yellow,maxW:140,a:ga,tgts:[toCanvas(A,40,-62)]});
    tag(c,T.yeast,325,410,{maxW:164,a:ga,tgts:[toCanvas(A,47,-23),toCanvas(B,-47,-23)]});
    tag(c,T.ice,635,312,{col:'#a5f3fc',maxW:140,a:ga,tgts:[toCanvas(Cc,-40,G.liq)]});
    const ca=Math.min(ga,k===2?fade(tau,1.4,.5):from===2&&k===3?1-u:0);
    tag(c,T.co2,325,252,{col:C.pink,maxW:140,a:ca,tgts:[toCanvas(A,4,-150)]});
  }

  // step 1: dashed arcs that link the bottles which differ in one condition
  const a1=only(0,2.4);
  if(a1>0){
    c.save();c.globalAlpha*=a1;const off=-t*12,col=rgba(C.yellow,.85);
    const ab=[];for(let j=0;j<=24;j++){const v=j/24;ab.push([mix(186,464,v),(1-v)*(1-v)*146+2*(1-v)*v*40+v*v*146]);}
    dashed(c,ab,col,2.5,[9,7],off);
    dashed(c,[[156,142],[160,70],[196,40],[764,40],[800,70],[804,142]],col,2.5,[9,7],off);
    cpill(c,T.onlySugar,325,73,{color:C.yellow});cpill(c,T.onlyTemp,480,20,{color:C.yellow});
    c.restore();
  }

  // step 2: the question, and a hint while nothing is chosen
  const a2=k===1?fade(tau,.9,.5)*out*(from===0?clamp((u-.85)/.15):1):(from===1?1-u:0);
  if(a2>0){c.save();c.globalAlpha*=a2;text(c,T.ask,480,62,28,C.yellow,'center');
    if(s.guess<0){const pu=.75+.25*Math.sin(t*3);c.globalAlpha*=pu;text(c,T.choose,480,574,22,C.yellow,'center');}c.restore();}

  // step 3: tick over A, short verdict next to the predicted bottle, the qualitative note
  const a3=only(2);
  if(a3>0){
    c.save();c.globalAlpha*=a3;text(c,T.qual,20,574,22,C.muted,'left');c.restore();
    const ck=k===2?fade(tau,5.2,.5):1;
    const A=L[0],ba=bal[0];
    if(ba)check(c,A.cx+ba.rx*A.sc*.86,A.base+(ba.cy-ba.ry*.86)*A.sc,a3*ck,18);
    if(s.guess>=0){const va=a3*(k===2?fade(tau,5.8,.5):1);
      if(va>0){c.save();c.globalAlpha*=va;const ok=s.guess===0;
        const fy=Math.min(132,balTop(s.guess)-12);
        cpill(c,ok?T.right:T.wrongA,ok?352:L[s.guess].cx,ok?72:fy-50,{active:true,color:ok?C.green:C.orange,size:22});c.restore();}}
  }

  // step 4: zoom on a yeast cell of bottle A, and the dough
  const a4=k===3?out:(from===3?1-u:0);
  if(a4>0){
    const A=L[0],src=toCanvas(A,15,-23),zt=k===3?tau:9;
    zoom(c,src,zt,t,a4);
    const la=a4*(k===3?fade(tau,1.7,.5):1);
    tag(c,T.single,ZX,30,{a:la,maxW:400,size:24});
    tag(c,T.sugar,ZX+150,ZY+70,{col:C.yellow,align:'left',a:la});
    tag(c,T.co2,ZX-80,ZY-170,{col:C.pink,align:'right',a:la,maxW:200});
    tag(c,T.alcohol,ZX+36,ZY+140,{col:ALC,align:'left',a:la,maxW:120});
    const ba=bal[0];if(ba)tag(c,T.balloon,214,186,{align:'left',a:la,maxW:90,tgts:[[A.cx+ba.rx*A.sc*.9,A.base+(ba.cy+ba.ry*.3)*A.sc]]});
    // dough: kneaded → risen, cross-fading in a loop
    const da=a4*(k===3?fade(tau,2.2,.6):1);
    if(da>0){const q=mod(zt-2.2,8),r=q<1.5?0:q<3?smooth((q-1.5)/1.5):q<6.5?1:1-smooth((q-6.5)/1.5),box=fitRect('bt:dough_bowl.png',672,212,258,196);
      drawIn(c,'bt:dough_bowl.png',box,{alpha:da*(1-r)});drawIn(c,'bt:dough_risen.png',box,{alpha:da*r});
      c.save();c.globalAlpha*=da;K.wrap(c,T.dough,801,box.y+box.h+30,250,22,C.white,30,'center');c.restore();}
    c.save();c.globalAlpha*=la;text(c,T.ai,480,574,22,C.muted,'center');c.restore();
  }

  // step markers (tap to jump to a step)
  for(let j=0;j<N;j++){const x=786+j*46,y=566;
    if(j===k)marker(c,x,y,j+1,null,14);
    else{circle(c,x,y,14,'rgba(11,26,21,.9)',rgba(C.muted,.8),2);c.save();c.font=MONO(20);c.fillStyle=C.muted;c.textAlign='center';c.textBaseline='middle';c.fillText(String(j+1),x,y+1);c.restore();}
    D.hit(x-23,y-24,46,48,'phase',j);}
  // tap a bottle to predict (steps 1–3)
  if(k<=2)for(let i=0;i<3;i++)D.hit(L[i].cx-150,120,300,420,'guess',i);
}
window.FungiDraw.yeast=draw;
})();

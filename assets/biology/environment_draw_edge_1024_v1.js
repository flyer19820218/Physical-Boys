/* Unit 11 lesson 2 · "edge" canvas (habitat-fragmentation tab, view 0), 2026-10-25. Area, quality and edges (plan section 3, edge).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (dashes march, the forest edge breathes,
 * arrows pulse, the shape keeps thinning and fattening in step 2, light / mist / wind move in step 3).
 * Left 2/3 = stage: top view window WIN (x 16..636, y 16..388) + bar rows under it; right 1/3 = step card (x 652..944) as in judge:
 * header (VIEWS.edge.tab), four step labels, step title (VIEWS.edge.names), legend for the step.
 * Top view: TH1b farmland (darkened a little) fills the window; the forest TH1a is cut to a soft-edged polygon (offscreen canvas:
 * feathered mask from a shadow-blurred fill, then 'source-in' with the forest picture). Same crop of both pictures.
 *  0 intact forest: green dashed outline + "Habitat" pill (ring); "Farmland" pill in the corner; bar "Forest area" full.
 *  1 less area: the right side is pushed in by farmland (cut line moves left, ~30 % of the area); the lost part turns orange with an
 *    orange dashed old outline, "Area cut away" pill, two orange arrows pushing left; the bar falls to the computed ratio, the lost
 *    part of the bar is orange.
 *  2 lower quality: the outline gets winding, a fixed-width edge band (yellow) and the interior (green) are drawn; then the same shape
 *    thins and fattens (ping-pong). Two bars, both full at the fat shape: "Whole area" and "Interior area"; the interior bar falls
 *    faster. Areas are counted from pixels of a half-size mask (polygon fill; interior = fill minus a stroke of 2 x band width).
 *  3 edges differ: a white dashed cut line sweeps from the interior out to the farmland, the top view fades and TH3 (section) fades
 *    in with a small zoom. Pills "Forest interior" (left) / "Forest edge" (right) / "Wind"; yellow light beams on the right,
 *    cyan mist dots on the left, white wind streaks on the right. Under it, per side: light chip (yellow) and water chip (cyan) with
 *    a 3-step level meter, one line of description; statement box "Edge conditions differ ...".
 * Colours (plan 1.4 and ecology lesson 4): habitat / interior green #4ade80; pressure (farmland, area cut away, arrows) orange #fb923c;
 * edge zone and light yellow #fde047; water cyan #55e9ff; wind white. No real numbers, distances or species.
 * Pictures: environment_ai_1024/TH1a_forest_top.jpg, TH1b_farmland_top.jpg (1672x933, crop x 58..1613 to 620x372),
 * TH3_edge_section.jpg (1024x572, shown 620x346, smaller than the original). TH3 interior/edge split measured by eye on the
 * picture: dark forest x < ~560 px, bright edge x > ~600 px (display x ~355..380).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,GREEN=K.COL.ecosystem,ORANGE=K.COL.pressure,YELLOW='#fde047',CYAN='#55e9ff',INK=C.ink;
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const FOREST=ENV+'TH1a_forest_top.jpg',FARM=ENV+'TH1b_farmland_top.jpg',SECT=ENV+'TH3_edge_section.jpg';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('面積、品質與邊緣','Area, quality and edges'),
 short:[P('完整的森林','An intact forest'),P('面積減少','Less area'),P('品質下降','Lower quality'),P('邊緣不一樣','Edges differ')],
 names:[P('一整片森林：棲地','One whole forest: a habitat'),P('面積減少：農地吃掉一側','Less area: farmland takes one side'),P('品質下降：內部縮得更快','Lower quality: the interior shrinks faster'),P('森林內部和邊緣，條件不一樣','Forest interior and edge differ in conditions')],
 habitat:P('棲地','Habitat'),
 farm:P('農地','Farmland'),
 lost:P('被切掉的面積','Area cut away'),
 area:P('森林面積','Forest area'),
 whole:P('整體面積','Whole area'),
 inner:P('內部面積','Interior area'),
 edgeZone:P('邊緣帶','Edge zone'),
 interior:P('內部','Interior'),
 faster:P('內部比整體縮得更快','The interior shrinks faster than the whole'),
 cut:P('切開看剖面','Cut to see the section'),
 inside:P('森林內部','Forest interior'),
 edge:P('森林邊緣','Forest edge'),
 light:P('光','Light'),water:P('水','Water'),wind:P('風','Wind'),
 inLine:P('光弱、較潮濕','Weak light, more humid'),
 edLine:P('光強、風大、較乾','Strong light, windy, drier'),
 differ:P('邊緣的條件和內部不一樣，適合的生物也不一樣','Conditions at the edge differ from the interior, so the organisms that suit them differ too'),
 shapeNote:P('森林形狀與長條都是示意','Forest shapes and bars are schematic'),
 legHab:P('綠虛線：棲地範圍','Green dashes: habitat outline'),
 legBar:P('長條：森林面積','Bar: forest area'),
 legLost:P('橘色：被農地吃掉的面積','Orange: area taken by farmland'),
 legPush:P('橘箭頭：農地擴張','Orange arrows: farmland spreads'),
 legEdge:P('黃色帶：邊緣帶','Yellow: edge zone'),
 legInner:P('綠色：內部','Green: interior'),
 legTwo:P('兩條長條：變瘦前都滿格','Bars: full before thinning'),
 legLight:P('黃：光','Yellow: light'),legWater:P('青：水','Cyan: water'),legWind:P('白線：風','White lines: wind')
};

// ── geometry ──────────────────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:372};
const IW=1672,IH=933,CROPW=IH*WIN.w/WIN.h,CROP=[(IW-CROPW)/2/IW,0,CROPW/IW,1];
const SEC={x:16,y:16,w:620,h:Math.round(620*572/1024)};          // 620 x 346, below the 1024 x 572 original
const CARD={x:652,y:16,w:292,h:550};
const CX=310,CY=186,RX=250,RY=140,X0=CX-30,BAND=26,NP=180;      // window-local px
const ROW1=410,ROW2=454,BAR_H=26;
const COLS=[{x:16,w:302},{x:334,w:302}];

// shape: eat 0..1 (farmland pushes in from the right), wind 0..1 (winding outline), thin 0..1 (same shape gets thinner)
function shape(p){
  const pts=[],f=mix(1,.42,p.thin),fx=mix(1,.88,p.thin);
  for(let i=0;i<NP;i++){const a=i/NP*Math.PI*2;
    const r=1+.05*Math.sin(3*a+.7)+.035*Math.sin(5*a+2.1)+p.wind*(.05*Math.sin(11*a+.4)+.03*Math.sin(17*a+1.3));
    let x=CX+RX*r*Math.cos(a),y=CY+RY*r*Math.sin(a);
    const xc=CX+.32*RX+10*Math.sin(y*.045+1)+p.wind*18*Math.sin(y*.1+.5);
    x=Math.min(x,mix(CX+RX*1.3,xc,p.eat));
    pts.push([X0+(x-X0)*fx,CY+(y-CY)*f]);}
  return pts;}
const mixP=(a,b,u)=>({eat:mix(a.eat,b.eat,u),wind:mix(a.wind,b.wind,u),thin:mix(a.thin,b.thin,u)});
function path(g,pts,ox=0,oy=0){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x+ox,y+oy):g.moveTo(x+ox,y+oy));g.closePath();}

// ── offscreen canvases ───────────────────────────────────────────────────
const OFFS={};
function off(name,w,h){let o=OFFS[name];if(!o||o.width!==w||o.height!==h){o=document.createElement('canvas');o.width=w;o.height=h;OFFS[name]=o;
  o.g=o.getContext('2d',name==='mask'?{willReadFrequently:true}:undefined);}o.g.setTransform(1,0,0,1,0,0);o.g.globalCompositeOperation='source-over';o.g.clearRect(0,0,w,h);return o;}
// pixel areas (half-size mask): whole = polygon fill; interior = fill minus a stroke 2 x BAND wide along the outline
const MS=.5;
function count(o){const d=o.g.getImageData(0,0,o.width,o.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>127)n++;return n;}
function areas(pts){
  const o=off('mask',Math.round(WIN.w*MS),Math.round(WIN.h*MS)),g=o.g;g.setTransform(MS,0,0,MS,0,0);
  path(g,pts);g.fillStyle='#fff';g.fill();const A=count(o);
  g.globalCompositeOperation='destination-out';g.lineWidth=2*BAND;g.lineJoin='round';path(g,pts);g.stroke();const I=count(o);
  return{A,I};}
const REF={};
function ref(){if(!REF.ok){REF.a0=areas(shape({eat:0,wind:0,thin:0})).A;const r=areas(shape({eat:1,wind:1,thin:0}));REF.a2=r.A;REF.i2=r.I;REF.ok=true;}return REF;}

// ── helpers (as in judge) ────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、])|(?<=[:,] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
// one-line name pill (dark fill, coloured text and outline)
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22}={}){
  const w=tagW(c,p,size),h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,FILL,rgba(col,.95));text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};

// ── icons ────────────────────────────────────────────────────────────────
function sun(c,x,y,t,s=1){c.save();c.translate(x,y);c.scale(s,s);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+t*.5;K.sline(c,[[8*Math.cos(a),8*Math.sin(a)],[12*Math.cos(a),12*Math.sin(a)]],YELLOW,2.5);}
  circle(c,0,0,6,YELLOW,null);c.restore();}
function drop(c,x,y,t,s=1){c.save();c.translate(x,y+Math.sin(t*2)*1.2);c.scale(s,s);c.beginPath();c.moveTo(0,-11);c.bezierCurveTo(7,-3,8,4,0,9);c.bezierCurveTo(-8,4,-7,-3,0,-11);c.fillStyle=CYAN;c.fill();c.restore();}
function windIcon(c,x,y,t,s=1){c.save();c.translate(x,y);c.scale(s,s);c.strokeStyle=WHITE;c.lineWidth=2.5;c.lineCap='round';
  [[-7,-12,10],[0,-14,14],[7,-10,8]].forEach(([dy,x0,len],i)=>{const o=Math.sin(t*3+i)*2;c.beginPath();c.moveTo(x0+o,dy);c.lineTo(x0+len*2+o,dy);c.quadraticCurveTo(x0+len*2+6+o,dy,x0+len*2+4+o,dy-5);c.stroke();});c.restore();}

// condition chip: icon + name + a 3-step level meter (no numbers)
const METER=3*7+2*4;
const chipW=(c,p)=>10+24+6+measure(c,p,22)+10+METER+12;
function chip(c,kind,p,level,x,y,t){const w=chipW(c,p),h=36,col=kind==='light'?YELLOW:CYAN;
  D.round(c,x,y,w,h,h/2,FILL,rgba(col,.95));
  if(kind==='light')sun(c,x+22,y+h/2,t,.9);else drop(c,x+22,y+h/2+1,t,1);
  text(c,p,x+40,y+h/2+8,22,col);
  const mx=x+40+measure(c,p,22)+10,pul=.75+.25*Math.sin(t*2.4);
  for(let i=0;i<3;i++){const on=i<level,bh=8+i*4,by=y+h/2+9-bh;D.round(c,mx+i*11,by,7,bh,2,on?rgba(col,i===level-1?pul:1):null,on?null:rgba(MUTED,.7));}
  return{x,y,w,h};}

// ── top view ─────────────────────────────────────────────────────────────
// o: hab (green dashed outline), lost (orange lost region + old outline), band (edge band / interior), feather (px)
function topView(c,p,t,o){
  const m=c.getTransform(),sx=Math.max(1,Math.hypot(m.a,m.b)),W=Math.ceil(WIN.w*sx),H=Math.ceil(WIN.h*sx);
  const pts=shape(p);
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  K.drawIn(c,FARM,WIN,{crop:CROP});
  c.fillStyle='rgba(11,26,21,.30)';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  const im=K.pic(K.src(FOREST));
  if(im){const F=off('forest',W,H),g=F.g,OFF=4000;
    g.setTransform(sx,0,0,sx,0,0);
    g.save();g.shadowColor='#fff';g.shadowBlur=o.feather*sx;g.shadowOffsetX=OFF*sx;g.translate(-OFF,0);path(g,pts);g.fillStyle='#fff';g.fill();g.restore();
    g.globalCompositeOperation='source-in';g.drawImage(im,CROP[0]*im.naturalWidth,0,CROP[2]*im.naturalWidth,im.naturalHeight,0,0,WIN.w,WIN.h);
    g.globalCompositeOperation='source-over';
    c.drawImage(F,WIN.x,WIN.y,WIN.w,WIN.h);}
  // lost region: old shape (no eating, same wind / thin) minus the current one
  if(o.lost>0){const old=shape({eat:0,wind:p.wind,thin:p.thin}),O=off('lost',W,H),g=O.g;g.setTransform(sx,0,0,sx,0,0);
    path(g,old);g.fillStyle=ORANGE;g.fill();g.globalCompositeOperation='destination-out';path(g,pts);g.fill();g.globalCompositeOperation='source-over';
    const xmin=Math.min(...pts.filter(q=>Math.abs(q[1]-CY)<RY*.6).map(q=>q[0]).filter(x=>x>CX));
    g.save();g.beginPath();g.rect(xmin-2,0,WIN.w,WIN.h);g.clip();g.setLineDash([10,7]);g.lineDashOffset=-t*14;g.lineWidth=3;g.strokeStyle=ORANGE;path(g,old);g.stroke();g.restore();
    withA(c,o.lost,()=>{c.save();c.globalAlpha*=.55;c.drawImage(O,WIN.x,WIN.y,WIN.w,WIN.h);c.restore();});}
  // edge band (yellow, fixed width) and interior (green)
  if(o.band>0){const O=off('band',W,H),g=O.g;g.setTransform(sx,0,0,sx,0,0);
    path(g,pts);g.fillStyle=GREEN;g.fill();g.globalCompositeOperation='source-atop';g.lineJoin='round';
    path(g,pts);g.lineWidth=2*BAND+4;g.strokeStyle=WHITE;g.stroke();path(g,pts);g.lineWidth=2*BAND;g.strokeStyle=YELLOW;g.stroke();
    g.globalCompositeOperation='source-over';
    withA(c,o.band,()=>{c.save();c.globalAlpha*=.42+.04*Math.sin(t*1.8);c.drawImage(O,WIN.x,WIN.y,WIN.w,WIN.h);c.restore();});}
  // habitat outline
  if(o.hab>0)withA(c,o.hab,()=>{c.save();c.translate(WIN.x,WIN.y);c.setLineDash([10,7]);c.lineDashOffset=-t*14;c.lineWidth=3;c.strokeStyle=GREEN;
    c.shadowColor=rgba(GREEN,.7);c.shadowBlur=8*sx;path(c,pts);c.stroke();c.restore();});
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);
  return pts;}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
const thinCurve=tau=>{if(tau<2.4)return 0;const q=mod(tau-2.4,13);
  return q<5?.5-.5*Math.cos(Math.PI*q/5):q<6.5?1:q<11.5?.5+.5*Math.cos(Math.PI*(q-6.5)/5):0;};
function target(k,tau,from){
  if(k===0)return{eat:0,wind:0,thin:0};
  if(k===1)return{eat:from>=1?1:ease(clamp((tau-.6)/2.6)),wind:0,thin:0};
  return{eat:1,wind:from>=2?1:smooth(clamp((tau-.2)/1.4)),thin:thinCurve(tau)};}
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.edgeSt||(s.edgeSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;st.cur=target(Math.min(k,2),9,9);st.fromP=st.cur;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.fromP=st.cur;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.fromP=st.cur;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;

  // shape parameters: step 3 keeps the shape it was entered with
  let p;
  if(k===3)p=st.fromP||{eat:1,wind:1,thin:0};
  else{p=target(k,tau,st.from);if(moving&&st.fromP)p=mixP(st.fromP,p,u);}
  if(k!==3)st.cur=p;
  s_dbg.p=p;

  // ── top view (steps 0..2, and the first second of step 3) ──
  const secIn=k===3?clamp((tau-1)/.7):0,secOut=k!==3&&moving&&st.from===3?1-u:0;
  const topA=k===3?1-secIn:1;
  const lostT=k===1?1:k===0||k===2?(moving&&st.from===1?1-u:0):0;
  const bandT=k===2?(st.from>=2?1:clamp((tau-1.2)/.8)):(moving&&st.from===2?1-u:0);
  const habT=k<=1?1:(moving&&st.from<=1?1-u:0);
  let pts=null;
  if(topA>0)withA(c,topA,()=>{pts=topView(c,p,t,{hab:habT,lost:k===1?clamp((tau-.6)/.6):lostT,band:bandT,feather:10+3*Math.sin(t*1.5)});});
  if(!pts)pts=shape(p);
  const pW=([x,y])=>[WIN.x+x,WIN.y+y];

  // top-view labels
  if(k<=2&&topA>0){
    // farmland (all three top-view steps)
    const fr=tag(c,T.farm,WIN.x+WIN.w-10,WIN.y+WIN.h-50,{al:'right',col:ORANGE});push(rects,1,'farm',fr);
    if(k===1&&tau>.6&&tau<3.4)ring(c,fr,t,ORANGE);
    // habitat (steps 0..1)
    const ha=k<=1?(moving&&st.from===2?u:1):0;
    withA(c,ha,()=>{const r=tag(c,T.habitat,WIN.x+150,WIN.y+CY-20,{al:'center',col:GREEN});push(rects,ha,'habitat',r);if(k===0)ring(c,r,t,GREEN);});
    // step 1: lost pill + arrows
    if(k===1){const la=clamp((tau-2)/.5);
      [110,262].forEach((yy,i)=>{const row=pts.filter(q=>Math.abs(q[1]-yy)<6&&q[0]>CX);const tipX=row.length?Math.max(...row.map(q=>q[0])):CX+RX;
        const pul=Math.sin(t*3+i)*5,x2=WIN.x+tipX+14+pul;if(x2<WIN.x+WIN.w-30)K.arrow(c,WIN.x+WIN.w-6,WIN.y+yy,x2,WIN.y+yy,ORANGE,4);});
      withA(c,la,()=>{const r=tag(c,T.lost,505,WIN.y+CY-20,{al:'center',col:ORANGE});push(rects,la,'lost',r);});}
    // step 2: edge zone + interior pills
    if(k===2){const ba=clamp((tau-1.6)/.5);
      withA(c,ba,()=>{
        // band anchor: outline point toward the upper left, moved half a band inwards
        let best=pts[0],bd=1e9;pts.forEach(q=>{const a=Math.atan2(q[1]-CY,q[0]-X0),d=Math.abs(a+2.25);if(d<bd){bd=d;best=q;}});
        const vx=X0-best[0],vy=CY-best[1],vl=Math.hypot(vx,vy),ax=best[0]+vx/vl*BAND/2,ay=best[1]+vy/vl*BAND/2;
        const er=tag(c,T.edgeZone,WIN.x+10,WIN.y+10,{col:YELLOW});push(rects,ba,'edgeZone',er);
        K.sline(c,[[er.x+er.w*.5,er.y+er.h],[WIN.x+ax,WIN.y+ay]],YELLOW,2.5);circle(c,WIN.x+ax,WIN.y+ay,5,YELLOW,INK,2);
        const ir=tag(c,T.interior,WIN.x+X0-70,WIN.y+CY-20,{al:'center',col:GREEN});push(rects,ba,'interior',ir);});}
  }
  // step 3 cut line (over the top view)
  if(k===3&&tau<1.8){const ca=1-clamp((tau-1.1)/.6),y0=WIN.y+CY,xa=WIN.x+40,xb=WIN.x+WIN.w-14,hx=mix(xa,xb,ease(clamp(tau/1)));
    withA(c,ca,()=>{K.dashed(c,[[xa,y0],[hx,y0]],WHITE,4,[12,8],-t*20);K.glow(c,hx,y0,18,WHITE,.8);circle(c,hx,y0,5,WHITE,null);
      const r=tag(c,T.cut,xa,y0-56,{col:WHITE});push(rects,ca,'cut',r);});}

  // ── section (step 3) ──
  const secA=k===3?secIn:secOut;
  if(secA>0)withA(c,secA,()=>section(c,t,k===3?tau:99,k===3?mix(1.06,1,ease(secIn)):1,rects,secA));

  // ── bars (steps 0..2) ──
  if(k<=2||moving)bars(c,k,st,moving,u,tau,t,pts,rects);

  // ── step card ──
  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  const na=k<=2?(moving&&st.from===3?u:1):(moving?1-u:0);
  withA(c,na,()=>{text(c,T.shapeNote,16,592,22,MUTED,'left');push(rects,na,'shapeNote',{x:16,y:574,w:measure(c,T.shapeNote,22),h:24});});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  text(c,ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── bars under the window ────────────────────────────────────────────────
function bars(c,k,st,moving,u,tau,t,pts,rects){
  const R=ref(),cur=areas(pts);
  const LW=Math.max(measure(c,T.area,22),measure(c,T.whole,22),measure(c,T.inner,22))+16;
  const schem=L('schematic','示意','Schematic'),sw=tagW(c,schem),bx=16+LW,be=636-sw-14,bw=be-bx;
  const row=(y,label,ratio,col,lostCol,a,id)=>withA(c,a,()=>{
    text(c,label,16,y+21,22,WHITE);push(rects,a,id+'Label',{x:16,y:y,w:measure(c,label,22),h:26});
    c.save();c.setLineDash([6,5]);D.round(c,bx,y,bw,BAR_H,6,'rgba(11,26,21,.6)',rgba(WHITE,.55));c.restore();
    const r=clamp(ratio);
    if(lostCol&&r<1)D.round(c,bx+bw*r,y,bw*(1-r),BAR_H,6,rgba(lostCol,.75),null);
    if(r>0.01)D.round(c,bx,y,bw*r,BAR_H,6,col,null);
    const gx=bx+bw*r;K.glow(c,gx,y+BAR_H/2,12+3*Math.sin(t*3),WHITE,.35);
    push(rects,a,id+'Bar',{x:bx,y,w:bw,h:BAR_H});});
  // one bar (steps 0..1)
  const a1=k<=1?(moving&&st.from===2?u:(k===0&&st.from<0?clamp(tau/.6):1)):(moving&&st.from<=1?1-u:0);
  if(a1>0)row(ROW1,T.area,cur.A/R.a0,GREEN,k===1||st.from===1?ORANGE:null,a1,'area');
  // two bars (step 2)
  const a2=k===2?(st.from===2?1:clamp((tau-.6)/.6)):(moving&&st.from===2?1-u:0);
  if(a2>0){row(ROW1,T.whole,cur.A/R.a2,WHITE,null,a2,'whole');row(ROW2,T.inner,cur.I/R.i2,GREEN,null,a2,'inner');}
  s_dbg.ratio={A:cur.A/R.a0,whole:cur.A/R.a2,inner:cur.I/R.i2};
  const sa=Math.max(a1,a2);
  withA(c,sa,()=>{const r=tag(c,schem,636,ROW1-7,{al:'right',col:WHITE});push(rects,sa,'schem',r);});
  if(k===2){const fa=clamp((tau-3)/.6);
    withA(c,fa,()=>{const rows=blines(c,T.faster,620);rows.forEach((q,i)=>text(c,q,16,ROW2+BAR_H+34+i*LH,22,GREEN));
      push(rects,fa,'faster',{x:16,y:ROW2+BAR_H+16,w:Math.max(...rows.map(q=>measure(c,q,22))),h:rows.length*LH});});}
}

// ── the section (step 3) ─────────────────────────────────────────────────
function section(c,t,tau,z,rects,a){
  const at=(d,dur=.5)=>clamp((tau-d)/dur);
  c.save();c.beginPath();c.roundRect(SEC.x,SEC.y,SEC.w,SEC.h,12);c.clip();
  c.translate(SEC.x+SEC.w/2,SEC.y+SEC.h/2);c.scale(z,z);c.translate(-SEC.x-SEC.w/2,-SEC.y-SEC.h/2);
  K.drawIn(c,SECT,SEC);
  // light beams on the edge side (yellow), shimmering
  c.save();c.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){const sh=.05+.04*(.5+.5*Math.sin(t*1.3+i*1.7)),x0=SEC.x+SEC.w+10,y0=SEC.y-10,ang=2.3+i*.12+.02*Math.sin(t*.5+i);
    const len=420,wd=.035;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+Math.cos(ang-wd)*len,y0+Math.sin(ang-wd)*len);c.lineTo(x0+Math.cos(ang+wd)*len,y0+Math.sin(ang+wd)*len);c.closePath();
    c.fillStyle=rgba(YELLOW,sh);c.fill();}
  c.restore();
  // mist / moisture on the interior side (cyan dots drifting up)
  for(let i=0;i<14;i++){const R=K.rng(40+i),bx=SEC.x+20+R()*270,u=mod(t*.12+R()),by=SEC.y+SEC.h-30-u*170,al=Math.sin(u*Math.PI)*.75;
    circle(c,bx+Math.sin(t*.8+i)*6,by,2.5+R()*2,rgba(CYAN,al),null);}
  // wind streaks on the edge side (white)
  for(let i=0;i<4;i++){const u=mod(t*.35+i*.25),wx=SEC.x+SEC.w-20-u*190,wy=SEC.y+150+i*18,al=Math.min(1,Math.sin(u*Math.PI)*1.3);
    c.save();c.lineCap='round';const wp=()=>{c.beginPath();c.moveTo(wx,wy);c.quadraticCurveTo(wx-28,wy-7,wx-60,wy);c.quadraticCurveTo(wx-74,wy+3,wx-70,wy-7);};wp();c.strokeStyle=rgba('#0b1a15',.45*al);c.lineWidth=7;c.stroke();wp();c.strokeStyle=rgba(WHITE,al);c.lineWidth=4;c.stroke();c.restore();}
  c.restore();
  D.round(c,SEC.x,SEC.y,SEC.w,SEC.h,12,null,C.edge);
  // name pills on the picture
  const pa=at(1.8);
  withA(c,pa,()=>{const l=tag(c,T.inside,SEC.x+12,SEC.y+12,{col:GREEN}),r=tag(c,T.edge,SEC.x+SEC.w-12,SEC.y+12,{al:'right',col:YELLOW});
    push(rects,pa*a,'inside',l);push(rects,pa*a,'edge',r);
    const w=tag(c,T.wind,SEC.x+SEC.w-12,SEC.y+92,{al:'right',col:WHITE});push(rects,pa*a,'wind',w);});
  // condition chips + one line per side
  const SIDES=[{lv:[1,3],line:T.inLine,col:GREEN},{lv:[3,1],line:T.edLine,col:YELLOW}];
  let bottom=0;
  SIDES.forEach((sd,i)=>{const col=COLS[i],ca=at(2.4+i*.6),y0=SEC.y+SEC.h+12;
    let x=col.x,y=y0;const w1=chipW(c,T.light),w2=chipW(c,T.water);
    withA(c,ca,()=>{const r1=chip(c,'light',T.light,sd.lv[0],x,y,t);push(rects,ca*a,'light'+i,r1);
      if(w1+8+w2<=col.w)x+=w1+8;else{y+=42;}
      const r2=chip(c,'water',T.water,sd.lv[1],x,y,t+.5);push(rects,ca*a,'water'+i,r2);});
    const ly=y+36+30,rows=blines(c,sd.line,col.w);
    withA(c,at(2.8+i*.6),()=>{rows.forEach((q,j)=>text(c,q,col.x,ly+j*LH,22,WHITE));
      push(rects,at(2.8+i*.6)*a,'line'+i,{x:col.x,y:ly-20,w:Math.max(...rows.map(q=>measure(c,q,22))),h:rows.length*LH});});
    bottom=Math.max(bottom,ly+(rows.length-1)*LH);});
  const sa=at(4.2,.6);
  withA(c,sa,()=>{const q=box(c,T.differ,326,bottom+16,{maxW:620,al:'center'});push(rects,sa*a,'differ',q);if(tau<99&&tau>4.2&&tau<7)ring(c,q,t,WHITE);});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['hab',T.legHab],['bar',T.legBar]];
  if(k===1)return[['lost',T.legLost],['push',T.legPush]];
  if(k===2)return[['edge',T.legEdge],['inner',T.legInner],['two',T.legTwo]];
  return[['light',T.legLight],['water',T.legWater],['wind',T.legWind]];}
function legIcon(c,kind,x,y,t,pul){
  if(kind==='hab'){c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*10;D.round(c,x+2,y+2,36,24,10,null,GREEN);c.restore();}
  else if(kind==='bar'){D.round(c,x,y+6,40,16,4,null,rgba(WHITE,.55));D.round(c,x,y+6,26+4*pul,16,4,GREEN,null);}
  else if(kind==='lost'){D.round(c,x,y,40,28,6,rgba(ORANGE,.45+.2*pul),ORANGE);}
  else if(kind==='push')K.arrow(c,x+40,y+14,x+2+4*pul,y+14,ORANGE,4);
  else if(kind==='edge'){D.round(c,x,y,40,28,8,rgba(YELLOW,.7),null);D.round(c,x+9,y+8,22,12,4,rgba(GREEN,.7),WHITE);}
  else if(kind==='inner'){D.round(c,x,y,40,28,8,rgba(GREEN,.55+.2*pul),null);}
  else if(kind==='two'){D.round(c,x,y+2,40,10,3,WHITE,null);D.round(c,x,y+16,22+4*pul,10,3,GREEN,null);}
  else if(kind==='light')sun(c,x+20,y+14,t,1);
  else if(kind==='water')drop(c,x+20,y+16,t,1.1);
  else windIcon(c,x+20,y+18,t,1);}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+14,{maxW:iw,stroke:GREEN});push(rects,1,'tab',hr);
  let y=R.y+14+hr.h+14;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20,rows=blines(c,p,iw-42),hh=Math.max(40,40+(rows.length-1)*LH);
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+10));
  const ly=R.y+R.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{const pul=.5+.5*Math.sin(t*2+q);
    legIcon(c,kind,ix,yy+4,t,pul);
    const h=bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);push(rects,la,'leg'+q,{x:ix+50,y:yy+4,w:iw-50,h:h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.edge=draw;
window.EnvironmentDraw.edge.dbg=s_dbg;
})();

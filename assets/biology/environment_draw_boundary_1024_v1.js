/* Unit 11 lesson 1 · "boundary" canvas (ecosystem-diversity tab, view 2, supplement), 2026-10-24. Where to draw the line
 * (plan section 2, boundary). Three steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (dashed frames
 * march, the active pill gets a pulsing ring, the dimming breathes a little).
 * Left 2/3 = stage: one picture for the whole view, ecology_ai_1023/HB5_pond.jpg (1672x933), crop x 170..1470 (full height) drawn
 * into WIN (x 16..636, y 16..461, scale 620/1300). Under it (y 467..563) a band used only in step 2. Right 1/3 = step card
 * (x 652..944) as in mosaic: green "Ecosystem diversity" header, three step labels, the step's title (VIEWS.boundary.names), legend.
 *  0 the pond only: a green dashed rounded frame holds only the water; outside it the picture is dimmed (feathered edge, no hard
 *    line). Pill "Study area" on the frame, pill "Life in the pond" beside it (lower left, on the mud shore, outside the frame).
 *  1 a wider area: the frame grows smoothly (1.8 s) from the water outline to a big frame holding water + banks + upstream; the
 *    dimming gets lighter. Pills "Upstream" (far channel, top centre) and "Bank" x2 (root banks left / right) with anchor dots,
 *    pill "The whole stream basin" inside the frame (lower right).
 *  2 set by the question: both frames at once, small = cyan "Water study", big = green "Study including the land"; under the
 *    picture one sentence "The boundary is set by the question"; corner row: HB2 desert thumbnail + "Deserts also hold life ...".
 *    Card legend: both frames + "Both are right; the questions differ". No frame is judged better.
 * Back 2 -> 0 the big green frame shrinks back onto the water while the cyan one fades.
 * Colours (plan 1.4 + brief): ecosystem green #4ade80 (header, big frame), small frame cyan #55e9ff, always with their names.
 * No areas, numbers or ratios. Frames are schematic (K.LAB.schematic, bottom left), the pictures are AI illustrations (K.LAB.aiNote).
 * Picture regions below were measured with PIL on HB5 (water outline traced on a grid crop and checked on an overlay).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=9,CW=960,MOVE=.8,GROW=1.8;
const WHITE=C.white,MUTED=C.muted,GREEN=K.COL.ecosystem,CYAN=K.COL.species;
const FILE='HB5_pond.jpg',DESERT='HB2_desert.jpg',IW=1672,IH=933;

// ── labels ────────────────────────────────────────────────────────────────
const T={
 short:[P('只看池塘','The pond only'),P('擴大範圍','A wider area'),P('依問題決定','Set by the question')],
 names:[P('研究「池塘裡的生物」','Studying "life in the pond"'),P('研究「整個溪流域」','Studying "the whole stream basin"'),P('邊界依研究的問題而定','Boundaries depend on the question')],
 scene:P('池塘與周邊','A pond and its surroundings'),
 range:P('研究範圍','Study area'),
 qPond:P('池塘裡的生物','Life in the pond'),qBasin:P('整個溪流域','The whole stream basin'),
 bank:P('岸邊','Bank'),up:P('上游','Upstream'),
 nWater:P('水域研究','Water study'),nLand:P('含陸地研究','Study including the land'),
 rule:P('邊界依研究的問題決定','The boundary is set by the question'),
 desert:P('沙漠也有生物，只是不容易一眼看見','Deserts also hold life, just not always visible at a glance'),
 dim:P('框外壓暗：不在這次範圍','Dimmed: outside this study'),
 both:P('兩個框都對，只是問題不同','Both are right; the questions differ')
};

// ── picture regions (HB5 picture px, measured with PIL) ───────────────────
// water surface (open water + lily pads, far channel included; reeds standing at the edge left out)
const WATER=[[640,288],[760,262],[900,250],[1060,252],[1150,268],[1040,292],[990,318],[1100,345],[1220,350],[1235,420],[1320,470],[1350,505],
 [1250,525],[1240,600],[1210,690],[1120,770],[900,815],[620,800],[430,760],[405,690],[430,610],[370,540],[290,470],[225,440],[320,380],[450,345],[560,315]];
// water + banks + upstream (bulges up to the far channel and the gap in the forest)
const BIG=[[200,178],[560,168],[760,120],[1060,120],[1250,168],[1445,178],[1452,540],[1445,902],[820,908],[200,902],[192,540]];
const FOREST=[[0,0,1672,200]];                    // forest band above the banks (outside both frames' sides; not labelled)
const UP=[960,234],BANK_L=[262,392],BANK_R=[1410,470],MUD=[650,872];
const CEN=[820,520];

// ── layout ────────────────────────────────────────────────────────────────
const CX0=170,CWID=1300,WIN={x:16,y:16,w:620,h:Math.round(IH*620/CWID*10)/10},SC=620/CWID;
const CARD={x:652,y:16,w:292,h:550};
const map=([px,py])=>[WIN.x+(px-CX0)*SC,WIN.y+py*SC];
const BAND_Y=467,DES={x:16,y:513,w:90,h:50};

// ── frames: Chaikin-rounded, then sampled on rays from one centre so the two shapes can be blended ──
function chaikin(pts,n){let p=pts;for(let k=0;k<n;k++){const q=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];
  q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}p=q;}return p;}
const NS=120;
function radial(poly){const out=[];
  for(let i=0;i<NS;i++){const a=i/NS*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a);let best=0;
    for(let j=0;j<poly.length;j++){const p=poly[j],q=poly[(j+1)%poly.length],ex=q[0]-p[0],ey=q[1]-p[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;
      const wx=p[0]-CEN[0],wy=p[1]-CEN[1],t=(wx*ey-wy*ex)/den,s=(wx*dy-wy*dx)/den;if(t>0&&s>=0&&s<=1&&t>best)best=t;}
    out.push([CEN[0]+dx*best,CEN[1]+dy*best]);}return out;}
const S_SMALL=radial(chaikin(WATER,2)),S_BIG=radial(chaikin(BIG,3));
const shapeAt=g=>S_SMALL.map((p,i)=>map([mix(p[0],S_BIG[i][0],g),mix(p[1],S_BIG[i][1],g)]));

// ── helpers (as in mosaic / green) ──────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，；])|(?<=[:,;] )/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill='rgba(11,26,21,.92)',stroke=null}={}){
  const w=tagW(c,p,size),h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,fill,stroke||rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');
  return{x:bx,y,w,h};
}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?C.ink:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function smoothPath(c,pts){const n=pts.length,m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];c.beginPath();c.moveTo(...m(pts[n-1],pts[0]));
  for(let i=0;i<n;i++){const p=pts[i],q=m(p,pts[(i+1)%n]);c.quadraticCurveTo(p[0],p[1],q[0],q[1]);}c.closePath();}
const scaleOf=c=>{const m=c.getTransform();return Math.hypot(m.a,m.b)||1;};

// dimming outside a frame, feathered: an offscreen layer is filled dark and the frame is cut out through a blurred shadow
// (destination-out; the shape itself is drawn far off the layer, so only its soft shadow cuts). Works without ctx.filter.
let OFFC=null;const OFF=6000;
function dimOutside(c,pts,a,feather){
  if(a<=0.002)return;const sx=scaleOf(c),W=Math.ceil(WIN.w*sx),H=Math.ceil(WIN.h*sx);
  if(!OFFC)OFFC=document.createElement('canvas');if(OFFC.width!==W||OFFC.height!==H){OFFC.width=W;OFFC.height=H;}
  const o=OFFC.getContext('2d');o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='source-over';o.clearRect(0,0,W,H);
  o.fillStyle=rgba('#0b1a15',a);o.fillRect(0,0,W,H);
  o.globalCompositeOperation='destination-out';o.setTransform(sx,0,0,sx,-WIN.x*sx,-WIN.y*sx);
  o.shadowColor='rgba(11,26,21,1)';o.shadowBlur=feather*sx;o.shadowOffsetX=OFF*sx;o.shadowOffsetY=0;
  o.translate(-OFF,0);smoothPath(o,pts);o.fillStyle='#16332b';o.fill();
  o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='source-over';o.shadowColor='rgba(0,0,0,0)';
  c.drawImage(OFFC,WIN.x,WIN.y,WIN.w,WIN.h);
}
// dashed frame with a soft glow under it; dashes march
function frame(c,pts,col,a,t,dir=1){
  if(a<=0.002)return;const sx=scaleOf(c);
  c.save();c.lineJoin='round';
  smoothPath(c,pts);c.lineWidth=9;c.strokeStyle=rgba(col,.18*a);c.stroke();
  c.setLineDash([14,9]);c.lineDashOffset=-t*16*dir;c.lineWidth=3.5;c.strokeStyle=rgba(col,.95*a);c.shadowColor=rgba(col,.8*a);c.shadowBlur=8*sx;
  smoothPath(c,pts);c.stroke();c.restore();
}
function dot(c,x,y,col,t){const u=mod(t*.6);circle(c,x,y,7+10*u,null,rgba(col,.8*(1-u)),2);circle(c,x,y,6,col,C.ink,2);}
// a pill joined to an anchor dot by a short leader
function pin(c,p,anchor,x,y,al,col,t,rects){const w=tagW(c,p),bx=al==='right'?x-w:x,cy=y+20;
  const ex=anchor[0]<bx?bx:anchor[0]>bx+w?bx+w:anchor[0],ey=anchor[0]>=bx&&anchor[0]<=bx+w?(anchor[1]<y?y:y+40):cy;
  K.sline(c,[anchor,[ex,ey]],rgba(col,.9),2.5);dot(c,anchor[0],anchor[1],col,t);const r=tag(c,p,x,y,{al,col});rects&&rects.push(r);return r;}

// ── frame ─────────────────────────────────────────────────────────────────
const TG=[{g:0,v:.55,cy:0},{g:1,v:.32,cy:0},{g:1,v:.3,cy:1}];
const s_dbg={};
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.boundarySt||(s.boundarySt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;st.src={...TG[k]};st.cur={...TG[k]};}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.src={...st.cur};}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.src=k===1?{...TG[1],g:0,v:TG[0].v}:k===2?{...TG[2],cy:0}:{...TG[k]};}
  if(t<st.T){st.T=t;st.from=-1;st.src={...TG[k]};}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const at=(d,dur=.45)=>clamp((tau-d)/dur);
  const fromA=test=>moving&&test(st.from)?1-u:0;
  // blended frame state
  const tg=TG[k],gd=k===1?.3:0,ug=smooth(clamp((tau-gd)/GROW)),uc=smooth(clamp(tau/MOVE));
  const cur={g:mix(st.src.g,tg.g,ug),v:mix(st.src.v,tg.v,ug),cy:mix(st.src.cy,tg.cy,uc)};st.cur=cur;
  const grown=k===1?at(gd+GROW,.5):0;

  // ── the picture ──
  D.round(c,WIN.x-2,WIN.y-2,WIN.w+4,WIN.h+4,14,'#16332b',null);
  K.drawIn(c,FILE,{x:WIN.x,y:WIN.y,w:WIN.w,h:WIN.h},{radius:12,crop:[CX0/IW,0,CWID/IW,1]});
  const main=shapeAt(cur.g),small=shapeAt(0);
  const rects=[];
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  dimOutside(c,main,cur.v*(1+.06*Math.sin(t*1.3)),22);
  frame(c,main,GREEN,1,t);
  frame(c,small,CYAN,cur.cy,t,-1);

  // scene name (always)
  rects.push(tag(c,T.scene,WIN.x+WIN.w-10,WIN.y+8,{al:'right',col:WHITE}));

  // "Study area" pill rides on the frame (steps 0, 1)
  const rgA=k<2?(st.from===2&&moving?u:1):fromA(kk=>kk<2);
  withA(c,rgA,()=>{const w=tagW(c,T.range),p0=map([760,262]),cxS=p0[0],cyS=p0[1],cxB=WIN.x+20+w/2,cyB=map([300,172])[1];
    const cx=mix(cxS,cxB,cur.g),cy=mix(cyS,cyB,cur.g),r=tag(c,T.range,cx,cy-20,{al:'center',col:GREEN});rects.push(r);
    if(k<2)ring(c,r,t,GREEN);});
  // question pills beside the frame
  withA(c,k===0?(st.from>=0&&moving?u:at(.3)):fromA(kk=>kk===0),()=>{rects.push(tag(c,T.qPond,WIN.x+12,WIN.y+WIN.h-50,{col:WHITE,stroke:GREEN}));});
  withA(c,k===1?grown:fromA(kk=>kk===1),()=>{rects.push(tag(c,T.qBasin,WIN.x+WIN.w-12,WIN.y+WIN.h-60,{al:'right',col:WHITE,stroke:GREEN}));});
  // step 1: upstream and banks
  withA(c,k===1?at(gd+GROW+.2,.5):fromA(kk=>kk===1),()=>{
    const up=map(UP),bl=map(BANK_L),br=map(BANK_R);
    pin(c,T.up,up,up[0]+26,WIN.y+70,'left',WHITE,t,rects);
    pin(c,T.bank,bl,WIN.x+16,bl[1]+44,'left',WHITE,t+.3,rects);
    pin(c,T.bank,br,WIN.x+WIN.w-16,br[1]+44,'right',WHITE,t+.6,rects);});
  // step 2: frame names
  withA(c,k===2?(st.from>=0&&moving?u:at(.2)):fromA(kk=>kk===2),()=>{
    const p0=map([760,262]),r1=tag(c,T.nWater,p0[0],p0[1]-20,{al:'center',col:CYAN});
    const r2=tag(c,T.nLand,WIN.x+20,map([300,172])[1]-20,{col:GREEN});rects.push(r1,r2);
    if(k===2){ring(c,r1,t,CYAN);ring(c,r2,t+.5,GREEN);}});
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  // ── band under the picture (step 2) ──
  withA(c,k===2?at(.6,.5):fromA(kk=>kk===2),()=>{
    const w=measure(c,T.rule,24)+40,bx=WIN.x+WIN.w/2-w/2;
    D.round(c,bx,BAND_Y,w,40,20,'rgba(242,236,217,.10)',rgba(WHITE,.9));
    text(c,T.rule,WIN.x+WIN.w/2,BAND_Y+29,24,WHITE,'center');rects.push({x:bx,y:BAND_Y,w,h:40});
    if(k===2&&tau>1.2)ring(c,{x:bx,y:BAND_Y,w,h:40},t+.3,WHITE);});
  withA(c,k===2?at(1.4,.5):fromA(kk=>kk===2),()=>{
    D.round(c,DES.x-2,DES.y-2,DES.w+4,DES.h+4,9,'#16332b',null);
    K.drawIn(c,DESERT,DES,{radius:8});D.round(c,DES.x,DES.y,DES.w,DES.h,8,null,C.edge);
    const rows=blines(c,T.desert,WIN.w-DES.w-14);
    rows.forEach((q,n)=>text(c,q,DES.x+DES.w+14,DES.y+(rows.length>1?19:33)+n*27,22,WHITE));
    s_dbg.desertRows=rows.length;});
  s_dbg.rects=rects;

  // ── step card (right) ──
  card(c,k,st,moving,x,u,tau,t);

  // notes: schematic frames (bottom left), AI pictures (bottom right)
  const sch=L('schematic','示意','Schematic');
  c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*8;D.round(c,18,575,30,22,6,null,rgba(GREEN,.9));c.restore();
  text(c,sch,56,592,22,MUTED,'left');
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
    if(on<1)badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true));
    rows.forEach((q,n)=>text(c,q,ix+42,cy+8+n*28,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+12)),ly=R.y+R.h-10-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const same=st.from>=0&&JSON.stringify(legend(st.from).map(l=>l[0]))===JSON.stringify(legs.map(l=>l[0]));
  const fade=moving&&st.from>=0&&!same?u:1;
  if(moving&&st.from>=0&&!same){const ol=legend(st.from),oh=ol.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+12));let yy=R.y+R.h-10-oh.reduce((a,b)=>a+b,0);
    withA(c,1-u,()=>ol.forEach(([kind,p],q)=>{swatch(c,kind,ix,yy,t);bwrap(c,p,ix+50,yy+28,iw-50,22,WHITE,28);yy+=oh[q];}));}
  withA(c,fade,()=>{let yy=ly;legs.forEach(([kind,p],q)=>{swatch(c,kind,ix,yy,t);bwrap(c,p,ix+50,yy+28,iw-50,22,WHITE,28);yy+=lhs[q];});});
}
function legend(k){
  if(k<2)return[['frameG',T.range],['dim',T.dim]];
  return[['frameC',T.nWater],['frameG',T.nLand],['both',T.both]];
}
function mini(c,x,y,w,h,col,t,dir=1){c.save();c.setLineDash([7,5]);c.lineDashOffset=-t*10*dir;D.round(c,x,y,w,h,8,null,rgba(col,.95));c.restore();}
function swatch(c,kind,x,y,t){
  if(kind==='frameG')mini(c,x+3,y+7,38,26,GREEN,t);
  else if(kind==='frameC')mini(c,x+3,y+7,38,26,CYAN,t,-1);
  else if(kind==='both'){mini(c,x+1,y+3,42,34,GREEN,t);mini(c,x+11,y+12,22,16,CYAN,t,-1);}
  else if(kind==='dim'){K.drawIn(c,FILE,{x:x+2,y:y+6,w:40,h:28},{radius:6,crop:[.38,.4,.2,.25]});
    const b=.5+.5*Math.sin(t*1.3);c.save();c.beginPath();c.roundRect(x+2,y+6,40,28,6);c.clip();
    c.fillStyle=rgba('#0b1a15',.55+.06*b);c.fillRect(x+22,y+6,20,28);c.restore();D.round(c,x+2,y+6,40,28,6,null,C.edge);}
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.boundary=draw;
window.EnvironmentDraw.boundary.dbg=s_dbg;
})();

/* Fossils · horse tab, view 0 "Five horse skeletons" (window.FossilDraw.horses), 2026-10-21.
 * Five horse skeletons (AI illustrations, fossils_ai_1021/horse_*.png) cut from one source picture at one scale,
 * so all five are drawn with the same factor S and stand on one ground line; their relative sizes stay right.
 * One selected series, ordered by time only: no "evolved into" arrows between the animals.
 * Colours: yellow = the horse of this step (frame, glow, back-height line); cyan = today's horse back height;
 * orange = the gap between the two; green = front toes.
 * Names, ages and toe counts repeat HORSES in fossils_1021_v1.js (that file loads after this one).
 */
(()=>{'use strict';
const K=window.FossilKit,{P,C,text,wrap,panel,arrow,dashed,circle,line,glow,pulse,stageClock,fade,smooth,ease,mix,clamp,mod,drawIn,measure,marker,D,rgba,SIZE}=K;
const N=5,PER=6,isZh=()=>D.tr(P('zh','en'))==='zh';

// Same data as HORSES in fossils_1021_v1.js.  back = top of the back on the picture, as fractions [fx, fy]
// (measured from the transparent PNGs: the highest point of the spine between hip and withers).
const HORSES=[
 {name:P(`始祖馬`,`Hyracotherium`),sci:`Hyracotherium`,when:P(`約 5,000 萬年前`,`about 50 million years ago`),toes:4,file:`horse_1_hyracotherium.png`,back:[.35,.07]},
 {name:P(`中新馬`,`Mesohippus`),sci:`Mesohippus`,when:P(`約 3,500 萬年前`,`about 35 million years ago`),toes:3,file:`horse_2_mesohippus.png`,back:[.56,.18]},
 {name:P(`草原古馬`,`Merychippus`),sci:`Merychippus`,when:P(`約 1,500 萬年前`,`about 15 million years ago`),toes:3,file:`horse_3_merychippus.png`,back:[.55,.20]},
 {name:P(`上新馬`,`Pliohippus`),sci:`Pliohippus`,when:P(`約 1,000 萬年前`,`about 10 million years ago`),toes:1,file:`horse_4_pliohippus.png`,back:[.53,.23]},
 {name:P(`現代馬`,`Equus (today's horse)`),sci:`Equus`,when:P(`約 500 萬年前到現在`,`about 5 million years ago to today`),toes:1,file:`horse_5_equus.png`,back:[.55,.21]}];
const NOTE=[
 P(`只有小狗那麼大`,`Only the size of a small dog`),
 P(`比始祖馬高一些`,`A little taller than Hyracotherium`),
 P(`比中新馬再高一些`,`Taller again than Mesohippus`),
 P(`離現代馬的背高只差一點`,`Almost as high as today's horse`),
 P(`我們熟悉的馬`,`The horse we know`)];

// ── layout: one scale for all five, one ground line ────────────────────────
const S=.66,G=430,LEFT=20,RIGHT=940,AXIS=G+32;
const DIMS=HORSES.map(h=>{const [W,H]=SIZE[h.file];return{w:W*S,h:H*S};});
const GAP=(RIGHT-LEFT-DIMS.reduce((a,d)=>a+d.w,0))/(N-1);
const RECTS=[];{let x=LEFT;DIMS.forEach(d=>{RECTS.push({x,y:G-d.h,w:d.w,h:d.h});x+=d.w+GAP;});}
const BODY=RECTS.map(r=>r.x+r.w*.4);                                   // body centre (between the legs)
const BACK=RECTS.map((r,i)=>[r.x+r.w*HORSES[i].back[0],r.y+r.h*HORSES[i].back[1]]);
const FRAME=RECTS.map(r=>({x:r.x-8,y:r.y-8,w:r.w+16,h:r.h+16}));
const lerpRect=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
function at(arr,f,lerp){const i=Math.max(0,Math.min(N-1,Math.floor(f))),j=Math.min(N-1,i+1);return lerp(arr[i],arr[j],f-i);}
const frameAt=f=>at(FRAME,f,lerpRect),bodyAt=f=>at(BODY,f,(a,b,u)=>mix(a,b,u));

// Sliding highlight: remembers where it was and eases to the new step.
function slide(s,k,t){
  if(s._hzTo===undefined){s._hzFrom=k;s._hzTo=k;s._hzT0=t-9;}
  const cur=mix(s._hzFrom,s._hzTo,smooth((t-s._hzT0)/.7));
  if(s._hzTo!==k){s._hzFrom=cur;s._hzTo=k;s._hzT0=t;return cur;}
  return cur;
}

// Labels under the horses: centred under each body, then pushed apart so none overlap.
function spread(c,labels,size){
  const ws=labels.map(p=>measure(c,p,size)),xs=[];let end=-1e9;
  ws.forEach((w,i)=>{let x=Math.max(BODY[i]-w/2,end+16,LEFT);xs.push(x);end=x+w;});
  const over=end-RIGHT;if(over>0)for(let i=N-1;i>=0;i--){const lim=i<N-1?xs[i+1]-16-ws[i]:RIGHT-ws[i];xs[i]=Math.min(xs[i],lim);}
  return xs.map((x,i)=>x+ws[i]/2);
}

// ── pieces ─────────────────────────────────────────────────────────────────
function drawCard(c,k,tau,t){
  const h=HORSES[k],a=ease(fade(tau,0,.55)),dx=(1-a)*18;
  panel(c,LEFT,16,560,196);
  c.save();c.globalAlpha*=a;
  marker(c,LEFT+30+dx,48,k+1,null,15);
  text(c,h.name,LEFT+56+dx,58,30,C.yellow);
  if(isZh())text(c,h.sci,LEFT+56+dx+measure(c,h.name,30)+14,58,22,C.muted);
  text(c,h.when,LEFT+24+dx,104,24,C.white);
  // front toes: one green dot per toe
  for(let i=0;i<h.toes;i++)circle(c,LEFT+34+dx+i*26,140,9,C.green,C.ink,2);
  text(c,P(`前腳 ${h.toes} 趾`,`${h.toes} front toe${h.toes>1?'s':''}`),LEFT+34+dx+h.toes*26+6,148,22,C.green);
  wrap(c,NOTE[k],LEFT+24+dx,190,512,22,C.white);
  c.restore();
}

function drawLegend(c,t){
  const x=596,y=16,w=344;
  panel(c,x,y,w,196);
  wrap(c,P(`同一個比例尺、同一條地面`,`One scale, one ground line`),x+16,y+34,w-32,22,C.white);
  const rows=[
   [P(`現代馬的背高`,`Back height: Equus`),C.cyan,'dash'],
   [P(`這一隻的背高`,`Back height: this one`),C.yellow,'dash'],
   [P(`高度差`,`Height gap`),C.orange,'gap']];
  rows.forEach(([p,col,kind],i)=>{
    const ry=y+78+i*40;
    if(kind==='dash')dashed(c,[[x+18,ry-8],[x+62,ry-8]],col,3,[7,6]);
    else{arrow(c,x+40,ry-6,x+40,ry-22,col,3);arrow(c,x+40,ry-10,x+40,ry+6,col,3);}
    text(c,p,x+76,ry,22,col);
  });
}

function drawHorses(c,hp,k,tau,t){
  // breathing glow and lit ground under the horse of this step
  const fr=frameAt(hp),bx=bodyAt(hp),br=.5+.5*Math.sin(t*1.9);
  glow(c,fr.x+fr.w/2,fr.y+fr.h*.55,Math.max(fr.w,fr.h)*.62,C.yellow,.08+.14*br);
  line(c,[[LEFT-6,G],[RIGHT+6,G]],rgba(C.sand,.55),3);
  c.save();c.shadowColor=C.yellow;c.shadowBlur=10+6*br;
  line(c,[[fr.x+6,G],[fr.x+fr.w-6,G]],C.yellow,5);c.restore();
  // today's horse back height, across the whole row (cyan)
  const yM=BACK[4][1];
  dashed(c,[[LEFT,yM],[BACK[4][0],yM]],rgba(C.cyan,.9),3,[10,8]);
  // the horses: same scale S, standing on G
  RECTS.forEach((r,i)=>{const on=clamp(1-Math.abs(hp-i));drawIn(c,HORSES[i].file,r,{alpha:.38+.62*on});});
  // frame
  c.save();c.lineWidth=3;c.strokeStyle=C.yellow;c.beginPath();c.roundRect(fr.x,fr.y,fr.w,fr.h,14);c.stroke();c.restore();
  // this horse's back height (yellow) reaching across to today's horse, then the gap (orange)
  if(k<N-1&&Math.abs(hp-k)<.05){
    const [x0,y0]=BACK[k],x1=BACK[4][0],u=ease(fade(tau,.4,1.1)),xe=mix(x0,x1,u);
    dashed(c,[[x0,y0],[xe,y0]],C.yellow,3,[10,8]);
    circle(c,x0,y0,5,C.yellow,C.ink,2);
    const g=fade(tau,1.3,.6),gap=y0-yM;
    if(g>0){c.save();c.globalAlpha*=g;
      if(gap>30){arrow(c,x0,y0-gap/2,x0,yM+3,C.orange,3);arrow(c,x0,y0-gap/2,x0,y0-3,C.orange,3);}
      else{line(c,[[x0,yM],[x0,y0]],C.orange,3);line(c,[[x0-7,yM],[x0+7,yM]],C.orange,3);line(c,[[x0-7,y0],[x0+7,y0]],C.orange,3);}
      // the same gap again where the yellow line meets today's horse
      if(u>.98){if(gap>30){arrow(c,x1,y0-gap/2,x1,yM+3,C.orange,3);arrow(c,x1,y0-gap/2,x1,y0-3,C.orange,3);}
        else{line(c,[[x1,yM],[x1,y0]],C.orange,3);}}
      c.restore();}
  }
  if(k===N-1&&Math.abs(hp-k)<.05){const [x0,y0]=BACK[4];circle(c,x0,y0,5,C.yellow,C.ink,2);pulse(c,x0,y0,t,C.yellow,6);}
}

function drawTimeline(c,hp,k,t){
  const tipX=bodyAt(hp);
  // the time axis: long ago (left) -> today (right); dashes drift to the right like passing time
  arrow(c,LEFT,AXIS,RIGHT+4,AXIS,rgba(C.white,.55),3);
  dashed(c,[[LEFT,AXIS],[RIGHT-14,AXIS]],rgba(C.white,.7),3,[6,20],-t*22);
  // how far along the series we are (yellow arrow riding the axis)
  if(tipX-LEFT>30)arrow(c,LEFT,AXIS,tipX-18,AXIS,C.yellow,4);
  BODY.forEach((x,i)=>{const on=clamp(1-Math.abs(hp-i));
    if(on>.5){const u=mod(t*.6);circle(c,x,AXIS,17+u*7,null,rgba(C.yellow,.8*(1-u)),3);marker(c,x,AXIS,i+1,null,14,C.yellow);}
    else marker(c,x,AXIS,i+1,null,13,rgba(C.muted,.8));});
  // names: Chinese + scientific name (zh); scientific name only (en)
  const zh=isZh(),names=HORSES.map(h=>zh?h.name:P(h.sci,h.sci));
  const nx=spread(c,names,zh?24:22);
  names.forEach((p,i)=>{const on=clamp(1-Math.abs(hp-i));
    text(c,p,nx[i],AXIS+40,zh?24:22,on>.5?C.yellow:rgba(C.white,.75),'center');});
  if(zh){const sx=spread(c,HORSES.map(h=>P(h.sci,h.sci)),22);
    HORSES.forEach((h,i)=>{const on=clamp(1-Math.abs(hp-i));
      text(c,P(h.sci,h.sci),sx[i],AXIS+68,22,on>.5?rgba(C.yellow,.85):rgba(C.muted,.75),'center');});}
  // axis ends and what the axis means
  const yb=578;
  text(c,P(`很久以前`,`Long ago`),LEFT,yb,22,C.muted);
  text(c,P(`現在`,`Today`),RIGHT,yb,22,C.muted,'right');
  text(c,P(`時間愈來愈近 →（挑出來的一個系列）`,`Later and later in time → (one selected series)`),480,yb,22,C.white,'center');
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const hp=slide(s,k,t);
  drawCard(c,k,tau,t);
  drawLegend(c,t);
  drawHorses(c,hp,k,tau,t);
  drawTimeline(c,hp,k,t);
  RECTS.forEach((r,i)=>{const x0=i?(RECTS[i-1].x+RECTS[i-1].w+r.x)/2:0,x1=i<N-1?(r.x+r.w+RECTS[i+1].x)/2:960;
    D.hit(x0,r.y-8,x1-x0,600-(r.y-8),'phase',i);});
}
window.FossilDraw.horses=draw;
})();

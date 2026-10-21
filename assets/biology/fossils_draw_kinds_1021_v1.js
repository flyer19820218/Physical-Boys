/* Fossils · "Kinds of fossil evidence" (tab evidence, view 1), 2026-10-21. Registers window.FossilDraw.kinds.
 * Four steps: a trilobite slab (remains), a trackway (trace fossil), an insect in amber (remains), and a
 * trilobite reconstruction (a model drawn from the evidence). Steps 1-3 list what the fossil can and cannot tell.
 * Colours: type tags remains = cyan, trace = pink, model = orange. Lists: can tell = green, cannot tell = orange.
 * Reconstruction labels: from fossils = green, seen only in rare fossils = yellow, mostly a guess = orange.
 * Picture positions below are fractions of each picture, read off the pictures themselves.
 */
(()=>{'use strict';
const K=window.FossilKit,{P,C,TAU,text,wrap,pill,arrow,dashed,circle,ellipse,line,glow,pulse,stageClock,fade,smooth,ease,mix,clamp,mod,
  fitRect,drawIn,place,measure,splitLines,D,rgba,pic,AI,pt,marker}=K;
const N=4,PER=6;
const REMAINS=C.cyan,TRACE=C.pink,MODEL=C.orange;
const SEEN=C.green,UNSEEN=C.orange;
const EVID=C.green,RARE=C.yellow,GUESS=C.orange;

const SLAB='fossil_trilobite_slab.png',TRACK='fossil_footprints_slab.png',AMBER='fossil_amber_insect.png',WALK='trilobite_walking.png';
const STEPS=[
 {title:P('三葉蟲化石','Trilobite fossil'),tag:P('遺體','Remains'),color:REMAINS,file:SLAB,
  name:P('三葉蟲','Trilobite'),kind:P('遺體','Remains'),
  see:[P('頭、胸、尾三段','Head, thorax and tail'),P('身體分節','Body segments'),P('外形和大小','Shape and size')],
  not:[P('顏色','Colour'),P('軟的部分（多半沒有留下）','Soft parts (mostly lost)')]},
 {title:P('足跡化石','Footprint fossils'),tag:P('遺跡（痕跡）','Trace fossil'),color:TRACE,file:TRACK,
  name:P('足跡','Footprints'),kind:P('遺跡','Trace'),
  see:[P('曾有生物走過','Something walked here'),P('腳有幾趾','How many toes'),P('大小和行走方向','Size and direction')],
  not:[P('牠完整的樣子','What it looked like'),P('顏色','Colour')]},
 {title:P('琥珀裡的昆蟲','Insect in amber'),tag:P('遺體','Remains'),color:REMAINS,file:AMBER,
  name:P('琥珀','Amber'),kind:P('遺體','Remains'),
  see:[P('整隻昆蟲','The whole insect'),P('翅膀和細小的腳','Wings and tiny legs')],
  not:[P('怎麼生活、吃什麼','How it lived, what it ate')]},
 {title:P('三葉蟲復原圖','Trilobite reconstruction'),tag:P('模型','Model'),color:MODEL,file:WALK,
  name:P('復原圖','Reconstruction'),kind:P('模型','Model')}];

// ── layout ────────────────────────────────────────────────────────────────
const MB={x:30,y:84,w:350,h:372};           // main picture box, steps 1-3
const LX=462,LW=224,LG=16,LY=96;              // the two list panels
const TY=470,TH=118;                          // thumbnail row

// Paint over a picture, only where the picture is opaque (offscreen mask), then draw with a blend mode.
let OFF=null;
function masked(c,file,r,paint,{alpha=1,mode='screen'}={}){
  const im=pic(AI+file);if(!im||alpha<=0)return;
  const S=2,w=Math.ceil(r.w*S),h=Math.ceil(r.h*S);
  if(!OFF)OFF=document.createElement('canvas');
  if(OFF.width!==w||OFF.height!==h){OFF.width=w;OFF.height=h;}
  const g=OFF.getContext('2d');
  g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,w,h);
  g.drawImage(im,0,0,w,h);g.globalCompositeOperation='source-in';g.scale(S,S);paint(g,r.w,r.h);
  c.save();c.globalAlpha*=alpha;c.globalCompositeOperation=mode;c.drawImage(OFF,r.x,r.y,r.w,r.h);c.restore();
}

// ── small icons ───────────────────────────────────────────────────────────
function check(c,x,y,r,color){circle(c,x,y,r,color,null);
  c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=C.ink;c.lineWidth=Math.max(2,r*.28);c.beginPath();
  c.moveTo(x-r*.48,y+r*.02);c.lineTo(x-r*.12,y+r*.38);c.lineTo(x+r*.5,y-r*.36);c.stroke();c.restore();}
function cross(c,x,y,r,color){circle(c,x,y,r,color,null);
  c.save();c.lineCap='round';c.strokeStyle=C.ink;c.lineWidth=Math.max(2,r*.28);const q=r*.4;c.beginPath();
  c.moveTo(x-q,y-q);c.lineTo(x+q,y+q);c.moveTo(x+q,y-q);c.lineTo(x-q,y+q);c.stroke();c.restore();}

// ── title row and the two lists ───────────────────────────────────────────
function titleRow(c,st){
  text(c,st.title,30,54,32,C.white);
  pill(c,st.tag,30+measure(c,st.title,32)+18,22,{active:true,color:st.color,size:22});
}
function listHeight(c,items,w){return items.reduce((h,p)=>h+splitLines(c,D.tr(p),w,22).length*30+12,0);}
function lists(c,st,tau){
  const tw=LW-46,hs=listHeight(c,st.see,tw),hn=listHeight(c,st.not,tw),H=70+Math.max(hs,hn)+8;
  const cols=[{x:LX,items:st.see,head:P('看得出','We can tell'),color:SEEN,icon:check,t0:.6},
              {x:LX+LW+LG,items:st.not,head:P('看不出','We cannot tell'),color:UNSEEN,icon:cross,t0:.6+st.see.length*.5}];
  cols.forEach((col,ci)=>{
    c.save();c.globalAlpha*=fade(tau,.3+ci*.2,.5);
    D.round(c,col.x,LY,LW,H,16,'rgba(11,26,21,.6)',rgba(col.color,.55));
    col.icon(c,col.x+28,LY+33,15,col.color);
    text(c,col.head,col.x+52,LY+42,24,col.color);
    c.restore();
    let y=LY+92;
    col.items.forEach((p,j)=>{
      const a=fade(tau,col.t0+j*.5,.5),rows=splitLines(c,D.tr(p),tw,22).length;
      c.save();c.globalAlpha*=a;c.translate((1-a)*10,0);
      col.icon(c,col.x+26,y-8,9,col.color);
      wrap(c,p,col.x+42,y,tw,22,C.white,30);
      c.restore();y+=rows*30+12;});
  });
}

// ── step 1: trilobite slab, a scan passes over the body ───────────────────
const PARTS=[{y0:.20,y1:.40,name:P('頭','Head')},{y0:.41,y1:.655,name:P('胸','Thorax')},{y0:.665,y1:.77,name:P('尾','Tail')}];
function stepRemains(c,tau,held){
  const r=fitRect(SLAB,MB.x,MB.y,MB.w,MB.h);drawIn(c,SLAB,r);
  const first=(tau-.4)/3.2,cyc=held?mod(tau-.4,4.6)/3.2:first,scanning=cyc>=0&&cyc<=1;
  const yS=mix(.16,.80,clamp(cyc)),reach=mix(.16,.80,clamp(first));
  if(scanning){
    const a=Math.sin(Math.PI*clamp(cyc));
    masked(c,SLAB,r,(g,w,h)=>{const y=yS*h,b=.06*h,gr=g.createLinearGradient(0,y-b,0,y+b);
      gr.addColorStop(0,rgba(C.yellow,0));gr.addColorStop(.5,rgba(C.yellow,.75));gr.addColorStop(1,rgba(C.yellow,0));
      g.fillStyle=gr;g.fillRect(0,y-b,w,2*b);},{alpha:a*.9});
  }
  // brackets: head, thorax, tail appear as the scan reaches them
  const bx=r.x+r.w+8;
  PARTS.forEach(p=>{
    const a=clamp((reach-p.y0)/.05);if(a<=0)return;
    const y0=r.y+p.y0*r.h+2,y1=r.y+p.y1*r.h-2,on=scanning&&yS>=p.y0&&yS<=p.y1;
    c.save();c.globalAlpha*=a;
    line(c,[[bx-6,y0],[bx,y0],[bx,y1],[bx-6,y1]],on?C.yellow:rgba(C.yellow,.75),3);
    text(c,p.name,bx+12,(y0+y1)/2+8,24,on?C.yellow:C.white);
    c.restore();});
}

// ── step 2: trackway; prints light up in walking order (toes point up, so it walked upward) ─
const PRINTS=[
 {c:[.38,.80],tips:[[.27,.749],[.374,.692],[.489,.742]]},
 {c:[.60,.60],tips:[[.496,.548],[.611,.492],[.72,.548]]},
 {c:[.38,.40],tips:[[.274,.353],[.383,.298],[.493,.345]]},
 {c:[.61,.20],tips:[[.51,.152],[.624,.095],[.733,.15]]}];
function stepTrace(c,tau,held,t){
  const r=fitRect(TRACK,MB.x,MB.y,MB.w,MB.h);drawIn(c,TRACK,r);
  const m=held?mod(tau,6.4):tau,out=held?1-fade(m,5.6,.6):1;
  const lit=PRINTS.map((p,i)=>fade(m,.5+i*.8,.45)*out);
  masked(c,TRACK,r,(g,w,h)=>{PRINTS.forEach((p,i)=>{if(lit[i]<=0)return;
    const x=p.c[0]*w,y=p.c[1]*h,R=.2*w,gr=g.createRadialGradient(x,y,0,x,y,R);
    gr.addColorStop(0,rgba(TRACE,.55*lit[i]));gr.addColorStop(1,rgba(TRACE,0));g.fillStyle=gr;g.fillRect(x-R,y-R,2*R,2*R);});},{alpha:1});
  PRINTS.forEach((p,i)=>{if(lit[i]<=0)return;const [x,y]=pt(r,p.c[0],p.c[1]);
    c.save();c.globalAlpha*=lit[i];
    ellipse(c,x,y+2,.17*r.w,.115*r.h,null,rgba(TRACE,.9),2.5);
    const newest=i===3||lit[i+1]<=0;
    marker(c,x+(p.c[0]<.5?-.22:.22)*r.w,y+4,i+1,newest?t:null,13,TRACE);
    c.restore();});
  // walking-direction arrow beside the slab, with chevrons moving up
  const ax=r.x+r.w+12,yB=r.y+.88*r.h,yT=r.y+.10*r.h,aa=fade(tau,.3,.6);
  c.save();c.globalAlpha*=aa;
  arrow(c,ax,yB,ax,yT,TRACE,4);
  for(let j=0;j<3;j++){const u=mod(t*.35+j/3),y=mix(yB-20,yT+30,u),a=Math.sin(Math.PI*u);
    c.save();c.globalAlpha*=a;line(c,[[ax-9,y+7],[ax,y-2],[ax+9,y+7]],C.white,2.5);c.restore();}
  wrap(c,P('行走方向','Way it walked'),ax+12,(yB+yT)/2-6,96,22,TRACE,28);
  c.restore();
  // the three toes of the last print
  const ta=fade(m,3.5,.5)*out;
  if(ta>0){const tips=PRINTS[3].tips.map(q=>pt(r,q[0],q[1]));
    c.save();c.globalAlpha*=ta;
    tips.forEach(([x,y],j)=>{circle(c,x,y,6,C.yellow,C.ink,2);pulse(c,x,y,t+j*.25,C.yellow,6);});
    const lab=P('3 趾','3 toes'),w=measure(c,lab,22)+28,px=tips[0][0]-18-w,py=tips[0][1]-20;
    line(c,[[px+w,py+20],[tips[0][0]-8,tips[0][1]]],C.yellow,2);
    pill(c,lab,px,py,{color:C.yellow,minX:r.x+4});
    c.restore();}
}

// ── step 3: amber; a slow gloss moves over it, the wing outlines breathe ──
const WINGS=[{c:[.385,.497],rx:.118,ry:.036,rot:.02},{c:[.67,.468],rx:.118,ry:.04,rot:-.15}];
function stepAmber(c,tau,held,t){
  const r=fitRect(AMBER,MB.x,MB.y,MB.w,MB.h);drawIn(c,AMBER,r);
  const u=mod(t/5.5);
  masked(c,AMBER,r,(g,w,h)=>{const d=Math.hypot(w,h),x0=mix(-.4*d,1.1*d,u),gr=g.createLinearGradient(x0,0,x0+.35*d,.2*d);
    gr.addColorStop(0,'rgba(255,248,220,0)');gr.addColorStop(.5,'rgba(255,248,220,.42)');gr.addColorStop(1,'rgba(255,248,220,0)');
    g.fillStyle=gr;g.fillRect(0,0,w,h);},{alpha:.9});
  const br=.55+.4*Math.sin(t*2.2),wa=fade(tau,.8,.6);
  c.save();c.globalAlpha*=wa;
  WINGS.forEach(wg=>{const [x,y]=pt(r,wg.c[0],wg.c[1]);ellipse(c,x,y,wg.rx*r.w,wg.ry*r.h,null,rgba(C.yellow,br),2.5,wg.rot);});
  // labels to the right of the amber
  const lx=r.x+r.w+14,wingTip=pt(r,.775,.44),leg=pt(r,.61,.615);
  line(c,[wingTip,[lx-4,wingTip[1]]],C.yellow,2);circle(c,wingTip[0],wingTip[1],4,C.yellow,null);
  text(c,P('翅膀','Wings'),lx,wingTip[1]+8,22,C.yellow);
  c.restore();
  c.save();c.globalAlpha*=fade(tau,1.3,.6);
  line(c,[leg,[lx-4,leg[1]]],C.white,2);circle(c,leg[0],leg[1],4,C.white,null);pulse(c,leg[0],leg[1],t,C.white,4);
  text(c,P('細小的腳','Tiny legs'),lx,leg[1]+8,22,C.white);
  c.restore();
}

// ── step 4: from fossil to reconstruction ────────────────────────────────
const LEGEND=[{color:EVID,p:P('來自化石','From fossils'),t0:1.2},
 {color:RARE,p:P('少數保存特別好的標本才看過','Seen only in rare fossils'),t0:2.1},
 {color:GUESS,p:P('幾乎沒有證據，多半是推測','Mostly a guess'),t0:3.0}];
// Labels on the reconstruction: point on the picture (fractions), which side the label sits, label centre y.
const PINS=[{f:[.78,.33],p:P('外殼形狀','Shell shape'),g:0,side:1,y:206},
 {f:[.78,.50],p:P('分節','Segments'),g:0,side:1,y:276},
 {f:[.95,.68],p:P('步足','Legs'),g:1,side:1,y:350},
 {f:[.05,.215],p:P('觸角','Antennae'),g:1,side:-1,y:168},
 {f:[.24,.50],p:P('顏色','Colour'),g:2,side:-1,y:336}];
function stepModel(c,tau,held,t){
  // legend
  let x=30;
  LEGEND.forEach(L=>{const a=fade(tau,L.t0,.5);c.save();c.globalAlpha*=a;
    circle(c,x+9,97,9,L.color,null);text(c,L.p,x+26,105,22,L.color);c.restore();
    x+=26+measure(c,L.p,22)+30;});
  // the fossil (evidence)
  const r1=fitRect(SLAB,30,150,170,250);drawIn(c,SLAB,r1,{alpha:.92});
  D.round(c,r1.x-4,r1.y-4,r1.w+8,r1.h+8,12,null,rgba(EVID,.5));
  text(c,P('化石（證據）','Fossil (evidence)'),r1.x+r1.w/2,r1.y+r1.h+32,22,EVID,'center');
  // arrow: drawn from the evidence
  const ay=275,a0=r1.x+r1.w+16,a1=392;
  dashed(c,[[a0,ay],[a1-16,ay]],C.white,4,[10,8],-t*30);
  arrow(c,a1-18,ay,a1,ay,C.white,4);
  const lab=P('依證據畫出','Drawn from evidence'),rows=splitLines(c,D.tr(lab),164,22).length;
  wrap(c,lab,(a0+a1)/2,ay-18-(rows-1)*28,164,22,C.white,28,'center');
  // the reconstruction (model)
  const r2=fitRect(WALK,400,128,290,320),ra=fade(tau,.3,.8);
  drawIn(c,WALK,r2,{alpha:ra});
  // labels, one colour group at a time
  PINS.forEach(pn=>{const a=fade(tau,LEGEND[pn.g].t0,.5);if(a<=0)return;const col=LEGEND[pn.g].color;
    const [px,py]=pt(r2,pn.f[0],pn.f[1]),w=measure(c,pn.p,22)+28,bx=pn.side>0?712:388-w,ex=pn.side>0?bx:bx+w;
    c.save();c.globalAlpha*=a;
    line(c,[[ex,pn.y],[mix(ex,px,a),mix(pn.y,py,a)]],col,2.5);
    circle(c,px,py,5.5,col,C.ink,2);pulse(c,px,py,t+pn.g*.3,col,5);
    pill(c,pn.p,bx,pn.y-20,{color:col,minX:20});
    c.restore();});
}

// ── thumbnail row (click to choose a step) ───────────────────────────────
function thumbs(c,k,tau){
  const need=STEPS.map(st=>76+Math.max(measure(c,st.name,22),measure(c,st.kind,22))+18),sum=need.reduce((a,b)=>a+b,0);
  const gap=Math.max(8,Math.min(16,(900-sum)/3)),extra=Math.max(0,(900-sum-3*gap)/4);
  let x=30;
  STEPS.forEach((st,i)=>{const w=need[i]+extra,on=i===k;
    c.save();if(!on)c.globalAlpha*=.62;
    D.round(c,x,TY,w,TH,14,on?'rgba(253,224,71,.10)':'rgba(11,26,21,.55)',on?null:C.edge);
    place(c,st.file,x+10,TY+9,56,TH-18);
    text(c,st.name,x+76,TY+50,22,on?C.yellow:C.white);
    text(c,st.kind,x+76,TY+88,22,st.color);
    if(on){c.save();c.globalAlpha*=.6+.4*ease(tau/.5);c.lineWidth=3;c.strokeStyle=C.yellow;c.beginPath();c.roundRect(x,TY,w,TH,14);c.stroke();c.restore();}
    c.restore();
    D.hit(x,TY,w,TH,'phase',i);x+=w+gap;});
}

function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=STEPS[k],aIn=ease(tau/.6),aOut=held?1:clamp((PER-tau)/.45),a=Math.min(aIn,aOut),dx=(1-aIn)*24-(1-aOut)*24;
  c.save();c.globalAlpha*=a;c.translate(dx,0);
  titleRow(c,st);
  if(k===0)stepRemains(c,tau,held);
  else if(k===1)stepTrace(c,tau,held,t);
  else if(k===2)stepAmber(c,tau,held,t);
  else stepModel(c,tau,held,t);
  if(st.see)lists(c,st,tau);
  c.restore();
  thumbs(c,k,tau);
}
window.FossilDraw.kinds=draw;
})();

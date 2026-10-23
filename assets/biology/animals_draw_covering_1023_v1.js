/* Animals · "Feathers, scales, hair" canvas (adaptation tab, view 0), 2026-10-23.
 * Four steps (AN9 close-ups, AI teaching illustrations, not photos):
 *  0 three close-ups side by side (feather.png, scales.png, fur.png); under each: covering name, cyan class pill,
 *    a dashed "Job?" pill; a magnifier hops from one close-up to the next; question "same job?".
 *  1 feathers (birds)   2 scales (reptiles)   3 hair (mammals)
 *    left: the close-up large with a wandering magnifier and one label pinned on the picture;
 *    right top: function card, a schematic drawn in code (marked "schematic") with a colour legend:
 *      feathers / hair: cold air stays outside, air held in the layer, body heat stays in;
 *      scales: water drops rise from the body and are turned back by the dry, hard scales;
 *    right bottom: example card (1 flying little egret with airflow, "long wing feathers help flight";
 *      2 pond turtle, "fish scales are built differently"; 3 platypus dense fur / killer whale almost no hair);
 *    yellow "Job: ..." pill; step 3 adds an orange "Not a ranking" pill;
 *    bottom: a strip of the three coverings, the current one lit; a covering's job shows once it has been reached;
 *    end of step 3: all three lit with their jobs.
 * Step changes (0.9 s): old step fades out, the new one fades in.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,TAU,text,measure,splitLines,circle,ellipse,glow,line,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,fitRect,drawIn}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=4,PER=9,CONCL=6;
const FRAME_BG='#16332b',CYAN=C.cyan,YELLOW=C.yellow,ORANGE=C.orange;
const COLD='#7dd3fc',AIR='#e8f1f2',HEAT='#f87171',BODY='#7a3b30',BODY_T='#e3a08a',FEATH='#d8c39d',HAIR='#c08a5a',SCALE='#c9c48a',DRY='#d9c9a0';

// ── layout ─────────────────────────────────────────────────────────────────
const HERO={x:16,y:64,w:420,h:360};
const RX=452,RW=492,RA={x:RX,y:64,w:RW,h:250},RB={x:RX,y:322,w:RW,h:102};
const FN_Y=434;
const TW=296,TG=16,TX=(960-3*TW-2*TG)/2,TY=486,TH=104;
const PW=296,PY=64,PH=280;              // step 0 panels

// ── pictures ───────────────────────────────────────────────────────────────
const FILES=['feather.png','scales.png','fur.png'];
// one pin per close-up (fractions of the picture; all three pictures are opaque squares there)
const PIN=[[.42,.45],[.40,.42],[.40,.32]];

// ── text ───────────────────────────────────────────────────────────────────
const T={
 cover:P(`體表`,`Coverings`),
 t0:P(`羽毛、鱗片、毛髮：並排看`,`Feathers, scales, hair: side by side`),t0s:P(`並排看`,`Side by side`),
 t1:P(`羽毛：保暖，也參與飛行`,`Feathers: keep warm and help flight`),
 t2:P(`鱗片：減少水分散失`,`Scales: cut water loss`),
 t3:P(`毛髮：保暖`,`Hair: keeps warm`),
 job:P(`作用？`,`Job?`),
 q:P(`都長在體表，作用一樣嗎？`,`All three cover the body. Same job?`),
 next:P(`一個一個看 →`,`Look at them one by one →`),
 pin1:P(`羽毛一片疊一片`,`Feathers overlap`),pin2:P(`鱗片重疊排列`,`Overlapping scales`),pin3:P(`一根根毛髮`,`Many hairs`),
 warm:P(`保暖`,`Keeps warm`),water:P(`減少水分散失`,`Cuts water loss`),
 cold:P(`冷空氣`,`Cold air`),trapped:P(`留住的空氣`,`Trapped air`),between:P(`毛髮間的空氣`,`Air between hairs`),
 heat:P(`體熱`,`Body heat`),body:P(`身體`,`Body`),dry:P(`乾燥的空氣`,`Dry air`),drops:P(`水分`,`Water`),
 sen1:P(`羽毛層留住空氣，體熱不容易散失`,`A layer of feathers holds air, so body heat stays in`),
 sen2:P(`乾而硬的鱗片擋住水分，減少散失`,`Dry, hard scales keep water in and cut water loss`),
 sen3:P(`毛髮之間留著空氣，可以保暖`,`Air held between the hairs keeps the body warm`),
 flyT:P(`參與飛行`,`Helps flight`),flyN:P(`翅膀上的長羽毛（例：小白鷺）`,`Long wing feathers (e.g. little egret)`),
 turT:P(`例：斑龜`,`e.g. pond turtle`),fishN:P(`魚的鱗片構造不同，主要是保護身體`,`Fish scales differ; they mainly protect the body`),
 platN:P(`鴨嘴獸：毛很密`,`Platypus: dense fur`),orcaN:P(`虎鯨：幾乎沒有毛`,`Killer whale: almost no hair`),
 varyN:P(`毛的多寡因種類而異`,`Hair amount varies by species`),
 fn1:P(`作用：保暖、參與飛行`,`Job: keeps warm, helps flight`),
 fn2:P(`作用：減少水分散失、保護身體`,`Job: cuts water loss, protects the body`),
 fn3:P(`作用：保暖`,`Job: keeps warm`),
 sh1:P(`保暖、飛行`,`Warmth, flight`),sh2:P(`減少水分散失`,`Less water loss`),sh3:P(`保暖`,`Warmth`),
 notRank:P(`作用不同，不是排高低`,`Different jobs, not a ranking`)
};
const CLS=()=>[L('bird','鳥類','Birds'),L('reptile','爬蟲類','Reptiles'),L('mammal','哺乳類','Mammals')];
const NAME=()=>[L('feathers','羽毛','Feathers'),L('scales','鱗片','Scales'),L('hair','毛髮','Hair')];
const TITLE=[T.t0,T.t1,T.t2,T.t3],PINL=[T.pin1,T.pin2,T.pin3],FN=[T.fn1,T.fn2,T.fn3],SH=[T.sh1,T.sh2,T.sh3];

// ── text helpers (as in animals_draw_frog_1023_v1.js) ──────────────────────
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
function cardBox(c,R){c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.fillStyle=FRAME_BG;c.fill();c.strokeStyle=rgba(C.white,.7);c.lineWidth=2;c.stroke();}
function rowsAt(c,p,x,y,w,size,col,lh,max=9){const r=rowsOf(c,p,w,size).slice(0,max);r.forEach((s,i)=>text(c,s,x,y+i*lh,size,col));return r.length;}

// ── magnifier: a zoomed circle of the picture under it, with a handle ──────
function lens(c,file,r,cx,cy,R,z){
  const im=pic(src(file));if(!im)return;
  const W=im.naturalWidth,H=im.naturalHeight,sx=(cx-r.x)/r.w*W,sy=(cy-r.y)/r.h*H,sw=2*R/z/r.w*W,sh=2*R/z/r.h*H;
  const hx=Math.cos(Math.PI/4),h0=R+3,h1=R+42;
  c.save();c.lineCap='round';
  line(c,[[cx+h0*hx,cy+h0*hx],[cx+h1*hx,cy+h1*hx]],'#4a3424',13);line(c,[[cx+h0*hx,cy+h0*hx],[cx+h1*hx,cy+h1*hx]],'#b88a55',8);c.restore();
  circle(c,cx+3,cy+5,R+3,'rgba(11,26,21,.45)',null);
  c.save();c.beginPath();c.arc(cx,cy,R,0,TAU);c.clip();c.fillStyle=FRAME_BG;c.fillRect(cx-R,cy-R,2*R,2*R);
  c.drawImage(im,sx-sw/2,sy-sh/2,sw,sh,cx-R,cy-R,2*R,2*R);
  const g=c.createLinearGradient(cx-R,cy-R,cx+R,cy+R);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(.45,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(cx-R,cy-R,2*R,2*R);
  c.restore();
  circle(c,cx,cy,R,null,'#4a3424',7);circle(c,cx,cy,R,null,C.white,3.5);
}

// ── schematics drawn in code ───────────────────────────────────────────────
function coverIcon(c,x,y,w,h,t,kind){
  const top=y+h*(kind==='scale'?.44:.3),mid=y+h*.74,bot=y+h;
  c.save();c.beginPath();c.roundRect(x,y,w,h,10);c.clip();
  c.fillStyle=kind==='scale'?rgba(DRY,.10):rgba(COLD,.08);c.fillRect(x,y,w,top-y);
  c.fillStyle=BODY;c.fillRect(x,mid,w,bot-mid);
  // outside: cold arrows coming down, or dry air drifting
  if(kind==='scale'){
    for(let j=0;j<2;j++){const yy=y+14+j*18;c.beginPath();for(let i=0;i<=30;i++){const xx=x+i/30*w;c.lineTo(xx,yy+3*Math.sin(i*.7-t*2.2+j*2));}c.strokeStyle=rgba(DRY,.75);c.lineWidth=2.4;c.stroke();}
  }else for(let k=0;k<3;k++){const u=mod(t*.45+k/3),xx=x+w*(.2+k*.3),y0=y+4,y1=top-6,yy=mix(y0,y1-14,u);
    withA(c,Math.sin(u*Math.PI),()=>K.arrow(c,xx,yy,xx,yy+16,COLD,3));}
  // the layer
  const rr=K.rng(kind==='hair'?11:kind==='scale'?5:3);
  if(kind==='feather'){
    for(let row=0;row<3;row++){const yy=mix(top+10,mid-6,row/2);
      for(let i=-1;i<7;i++){const xx=x+i*w/5.5+(row%2)*w/11+3*Math.sin(t*.9+i+row);
        ellipse(c,xx,yy,w/9,(mid-top)*.24,FEATH,'#7a5a3c',1.6,-.45);
        line(c,[[xx-w/12,yy+(mid-top)*.1],[xx+w/12,yy-(mid-top)*.1]],'#9a7a58',1.4);}}
  }else if(kind==='hair'){
    for(let i=0;i<16;i++){const xx=x+6+i*(w-12)/15,sw=6*Math.sin(t*1.1+i*.7),ht=(mid-top)*(.82+.18*rr());
      c.beginPath();c.moveTo(xx,mid);c.quadraticCurveTo(xx+sw*.4,mid-ht*.5,xx+sw,mid-ht);c.strokeStyle=HAIR;c.lineWidth=3;c.lineCap='round';c.stroke();}
  }else{
    const sr=w/14;for(let row=0;row<2;row++){const yy=top+row*(mid-top)*.42+4;
      for(let i=-1;i<9;i++){const xx=x+i*sr*2+(row%2)*sr;c.beginPath();c.arc(xx,yy,sr,0,Math.PI);c.lineTo(xx-sr,yy);c.fillStyle=SCALE;c.fill();
        c.strokeStyle='#5d5a35';c.lineWidth=1.8;c.stroke();}}
    c.fillStyle=SCALE;c.fillRect(x,top-2,w,6);
  }
  if(kind!=='scale'){
    // air held in the layer: jiggling dots
    for(let i=0;i<12;i++){const ax=x+12+rr()*(w-24),ay=mix(top+10,mid-8,rr()),ph=rr()*TAU;
      circle(c,ax+2.5*Math.sin(t*2+ph),ay+2*Math.cos(t*1.7+ph),3.4,rgba(AIR,.9),null);}
    // body heat rises and stays inside the layer
    for(let k=0;k<3;k++){const u=mod(t*.4+k/3+.15),xx=x+w*(.33+k*.17),y0=bot-6,y1=top+(mid-top)*.3,yy=mix(y0,y1,u);
      withA(c,Math.sin(u*Math.PI),()=>{c.beginPath();for(let i=0;i<=10;i++){const py=yy+i*2.2;c.lineTo(xx+3*Math.sin(i*.9+t*4),py);}c.strokeStyle=HEAT;c.lineWidth=3;c.stroke();
        K.arrow(c,xx,yy+6,xx,yy-8,HEAT,3);});}
  }else{
    // water drops rise, meet the scales and turn back
    for(let k=0;k<4;k++){const u=mod(t*.42+k/4),xx=x+w*(.16+k*.23),y0=bot-8,y1=top+(mid-top)*.6,yy=u<.6?mix(y0,y1,smooth(u/.6)):mix(y1,y0,smooth((u-.6)/.4));
      withA(c,Math.min(1,Math.sin(u*Math.PI)*1.6),()=>{c.beginPath();c.moveTo(xx,yy-12);c.quadraticCurveTo(xx+9,yy,xx,yy+7);c.quadraticCurveTo(xx-9,yy,xx,yy-12);c.fillStyle=COLD;c.fill();
        c.strokeStyle='#e0f4fe';c.lineWidth=1.2;c.stroke();});}
  }
  c.restore();
  c.beginPath();c.roundRect(x,y,w,h,10);c.strokeStyle=rgba(C.edge,.95);c.lineWidth=2;c.stroke();
}
const LEGEND=[
  [[T.cold,COLD],[L('feathers','羽毛','Feathers'),FEATH],[T.trapped,AIR],[T.heat,HEAT],[T.body,BODY_T]],
  [[T.dry,DRY],[L('scales','鱗片','Scales'),SCALE],[T.drops,COLD],[T.body,BODY_T]],
  [[T.cold,COLD],[L('hair','毛髮','Hair'),HAIR],[T.between,AIR],[T.heat,HEAT],[T.body,BODY_T]]];
const KIND=['feather','scale','hair'],CTITLE=[T.warm,T.water,T.warm],SEN=[T.sen1,T.sen2,T.sen3];

function cardA(c,j,tau,t){withA(c,fade(tau,.8,.5),()=>{
  cardBox(c,RA);
  text(c,CTITLE[j],RA.x+16,RA.y+30,22,C.white);
  text(c,L('schematic','示意','Schematic'),RA.x+RA.w-16,RA.y+30,22,C.muted,'right');
  coverIcon(c,RA.x+16,RA.y+42,230,142,t,KIND[j]);
  const lg=LEGEND[j],lx=RA.x+262,ly=RA.y+42+(142-lg.length*26)/2+19;
  lg.forEach(([p,col],i)=>{circle(c,lx+7,ly+i*26-7,6,col,C.ink,1.2);text(c,p,lx+20,ly+i*26,22,col===BODY_T?C.white:col);});
  rowsAt(c,SEN[j],RA.x+16,RA.y+214,RA.w-32,22,C.white,28,2);
});}

function cardB(c,j,tau,t){withA(c,fade(tau,2.2,.5),()=>{
  cardBox(c,RB);
  const tx=RB.x+150,tw=RB.x+RB.w-14-tx;
  if(j===0){
    const r=fitRect('egret_fly.png',RB.x+12,RB.y+8,126,86),dy=3*Math.sin(t*1.6);
    for(let k=0;k<3;k++){const yy=r.y+r.h*(.55+k*.16),off=mod(t*40+k*17,24);c.save();c.setLineDash([10,8]);c.lineDashOffset=-off;
      c.beginPath();c.moveTo(r.x-4,yy+14);c.quadraticCurveTo(r.x+r.w*.5,yy+6,r.x+r.w+4,yy-10);c.strokeStyle=rgba(COLD,.7);c.lineWidth=2.4;c.stroke();c.restore();}
    drawIn(c,'egret_fly.png',{...r,y:r.y+dy});
    text(c,T.flyT,tx,RB.y+32,22,C.white);rowsAt(c,T.flyN,tx,RB.y+62,tw,22,C.muted,27,2);
  }else if(j===1){
    const r=fitRect('turtle.png',RB.x+12,RB.y+10,126,82);drawIn(c,'turtle.png',{...r,x:r.x+2*Math.sin(t*.8)});
    text(c,T.turT,tx,RB.y+32,22,C.white);rowsAt(c,T.fishN,tx,RB.y+62,tw,22,C.muted,27,2);
  }else{
    const a=fitRect('platypus.png',RB.x+12,RB.y+8,120,40),o=fitRect('orca.png',RB.x+12,RB.y+52,120,44);
    drawIn(c,'platypus.png',{...a,y:a.y+1.5*Math.sin(t*1.3)});drawIn(c,'orca.png',{...o,y:o.y+2*Math.sin(t*1.1+1)});
    text(c,T.platN,tx,RB.y+30,22,C.white);text(c,T.orcaN,tx,RB.y+58,22,C.white);text(c,T.varyN,tx,RB.y+88,22,C.muted);
  }
});}

// ── the close-up with a wandering magnifier and its pinned label ──────────
function hero(c,j,tau,t){
  const f=FILES[j],r=fitRect(f,HERO.x+8,HERO.y+4,HERO.w-16,HERO.h-8);
  withA(c,fade(tau,0,.6),()=>{
    drawIn(c,f,r);
    withA(c,fade(tau,1,.6),()=>{const cx=r.x+r.w*(.68+.1*Math.sin(t*.5)),cy=r.y+r.h*(.7+.1*Math.sin(t*.37+1));lens(c,f,r,cx,cy,62,1.9);});
  });
  withA(c,fade(tau,1.5,.5),()=>{
    const [px,py]=[r.x+r.w*PIN[j][0],r.y+r.h*PIN[j][1]];
    K.pulse(c,px,py,t,C.white,10);
    const b=fitText(c,PINL[j],r.x+14,r.y+16,r.w-28,C.white);
    lead(c,Math.max(b.x+14,Math.min(b.x+b.w-14,px)),b.y+b.h,px,py,C.white);
  });
}

// ── header ─────────────────────────────────────────────────────────────────
function header(c,k){
  const pl=fitText(c,k?CLS()[k-1]:T.cover,20,12,300,CYAN,{active:true});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),room=940-measure(c,ai,22)-24-(pl.x+pl.w+14);
  let n=TITLE[k];if(measure(c,n,26)>room)n=k?NAME()[k-1]:T.t0s;
  text(c,n,pl.x+pl.w+14,pl.y+pl.h/2+9,26,C.white);
  text(c,ai,940,40,22,C.muted,'right');
}

// ── step 0: three close-ups side by side ───────────────────────────────────
function overview(c,tau,t){
  const act=Math.floor(mod(t/3.2,3)),u=mod(t/3.2,1);
  for(let i=0;i<3;i++){const x=TX+i*(PW+TG),r=fitRect(FILES[i],x+8,PY+6,PW-16,PH-12);
    withA(c,fade(tau,i*.35,.6),()=>{
      if(i===act)glow(c,x+PW/2,PY+PH/2,PW*.62,CYAN,.22*Math.sin(u*Math.PI));
      drawIn(c,FILES[i],{...r,y:r.y+2*Math.sin(t*1.1+i*2)});
      if(i===act)withA(c,clamp(Math.sin(u*Math.PI)*2.5),()=>{const cx=r.x+r.w*(.42+.16*Math.sin(t*.9+i)),cy=r.y+r.h*(.4+.12*Math.cos(t*.7+i));lens(c,FILES[i],r,cx,cy,52,1.9);});
      text(c,NAME()[i],x+PW/2,PY+PH+40,28,C.white,'center');
      fitText(c,CLS()[i],x+PW/2,PY+PH+54,PW-20,CYAN,{align:'center'});
    });
    withA(c,fade(tau,1.6+i*.3,.5),()=>{const b=fitText(c,T.job,x+PW/2,PY+PH+104,PW-20,C.muted,{align:'center',dash:[6,5]});
      if(i===act)withA(c,.5*Math.sin(u*Math.PI),()=>{c.save();c.beginPath();c.roundRect(b.x-4,b.y-4,b.w+8,b.h+8,(b.h+8)/2);c.strokeStyle=C.white;c.lineWidth=2;c.stroke();c.restore();});});
  }
  withA(c,fade(tau,2.8,.6),()=>{text(c,T.q,480,PY+PH+192,26,C.white,'center');});
  withA(c,fade(tau,3.6,.6),()=>{text(c,T.next,480+5*Math.sin(t*3),PY+PH+226,22,C.muted,'center');});
}

// ── bottom: function pill(s) and the strip of the three coverings ─────────
function fnRow(c,j,tau){
  withA(c,fade(tau,3.2,.5),()=>fitText(c,FN[j],16,FN_Y,j===2?440:900,YELLOW));
  if(j===2)withA(c,fade(tau,4.2,.5),()=>fitText(c,T.notRank,944,FN_Y,480,ORANGE,{active:true,align:'right'}));
}
function strip(c,j,tau,t){
  const all=j===2&&tau>=CONCL;
  for(let i=0;i<3;i++){const x=TX+i*(TW+TG),cur=i===j,on=cur||all,known=i<j||all||(cur&&tau>=3.2),al=on?1:i<j?.7:.45;
    if(cur)glow(c,x+TW/2,TY+TH/2,TW*.45,CYAN,.16+.06*Math.sin(t*2));
    if(all)glow(c,x+TW/2,TY+TH/2,TW*.4,CYAN,.22*Math.max(0,Math.sin(t*1.6-i*1.1)));
    D.round(c,x,TY,TW,TH,12,on?'rgba(85,233,255,.12)':'rgba(11,26,21,.55)',null);
    c.save();c.beginPath();c.roundRect(x,TY,TW,TH,12);c.strokeStyle=on?CYAN:rgba(C.edge,.9);c.lineWidth=on?3:1.5;c.stroke();c.restore();
    withA(c,al,()=>{drawIn(c,FILES[i],fitRect(FILES[i],x+10,TY+10,84,84));
      text(c,NAME()[i],x+106,TY+32,24,C.white);text(c,CLS()[i],x+106,TY+62,22,CYAN);
      text(c,known?SH[i]:T.job,x+106,TY+92,22,known?YELLOW:C.muted);});
  }
}

// ── one step's whole picture ───────────────────────────────────────────────
function scene(c,k,tau,t,a){withA(c,a,()=>{
  if(k===0)overview(c,tau,t);
  else{const j=k-1;hero(c,j,tau,t);cardA(c,j,tau,t);cardB(c,j,tau,t);fnRow(c,j,tau);strip(c,j,tau,t);}
  header(c,k);
});}

function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.cv||(s.cv={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut);
  scene(c,k,tau,t,cross?aIn:1);
}
window.AnimalsDraw.covering=draw;
})();

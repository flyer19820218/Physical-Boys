/* Animals · "Mother and calf: nursing" canvas (adaptation tab, view 2), 2026-10-23.
 * Four steps (AN8 elephant.png: one picture of a cow Asian elephant with her calf standing under her, the calf's head
 * pressed behind the mother's near front leg; AN6 platypus.png; AI teaching illustrations, not photos):
 *  0 mother and calf: the picture large on a muted sky-and-ground panel; numbered markers 1 mother, 2 calf, matching a
 *    list card ("the calf stays close beside its mother"; sizes are only the composition).
 *  1 calf nursing: the whole picture small with a dashed frame round the calf's head and the mother's front leg; that
 *    area zoomed large (cropped from the same picture, slow pan); "Calf", "Mother's front leg", yellow "Nursing" at the
 *    calf's mouth; white milk drops run from the mother's chest behind the front leg to the calf's mouth (schematic).
 *  2 fed with milk: the elephant with the schematic milk flow and "mammary gland (schematic): makes milk" / "calf: grows
 *    on milk"; right card: platypus, a schematic chain drawn in code: lays eggs → young hatch → drink the mother's milk.
 *  3 not live birth: elephant vs platypus table; birth differs (live birth / lays eggs, muted), feeding the same (milk,
 *    yellow, dots flowing between them), both mammals (cyan); orange "Not all mammals give live birth" + yellow
 *    "The core is milk, not live birth".
 * The two elephants are one picture; it is never cut apart. Sizes in the picture are only the composition.
 * Step changes (0.9 s): old step fades out, the new one fades in.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,TAU,text,measure,splitLines,circle,ellipse,glow,line,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,fitRect,drawIn}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=4,PER=9;
const FRAME_BG='#16332b',CYAN=C.cyan,YELLOW=C.yellow,ORANGE=C.orange;
const SKY0='#2c5869',SKY1='#3e7283',GROUND='#4d5a3c',GROUND_HI='#6b7a4f',GRASS='#8fa063',WATER='#245a6e',WATER_HI='#5aa3bb';
const MILK='#fbf7ec',EGG='#efe3c4',EGG_EDGE='#a8936a';

// ── pictures and points measured once from the PNG (image px) ─────────────
const EL='elephant.png',PL='platypus.png';
// elephant.png 1602×1248: mother faces right; the calf stands under her belly, its head behind her near front leg.
// mother's chest edge behind the front leg (top of the gap between calf and leg) → down the leg edge → the calf's mouth
const EP={mother:[560,330],calf:[430,960],chest:[812,726],mouth:[824,868],eye:[776,815],leg:[900,960],calfEar:[660,830]};
const FLOW=[[812,726],[824,760],[836,796],[846,832],[826,866]];
const CROP=[560,660,500,369]; // zoom area (image px): calf's head, the mother's front leg and chest; aspect = zoom box

// ── text ───────────────────────────────────────────────────────────────────
const T={
 t0:P(`母象與小象`,`A mother elephant and her calf`),
 t1:P(`小象靠近母象前腿後方吸奶`,`The calf nurses behind the front leg`),
 t2:P(`哺乳類的母體用乳汁哺育幼體`,`A mammal mother feeds her young milk`),
 t3:P(`哺乳是核心特徵，不是胎生`,`Nursing is the key trait, not live birth`),
 s0:P(`母象與小象`,`Mother and calf`),s1:P(`靠近吸奶`,`Calf nursing`),s2:P(`乳汁哺育`,`Fed with milk`),s3:P(`不是胎生`,`Not live birth`),
 look:P(`看一看`,`Take a look`),
 close:P(`小象貼在母象身邊，跟著一起走`,`The calf stays close beside its mother and walks with her`),
 sizeNote:P(`AI 插圖：兩頭象的大小只是構圖，不是真實比例`,`AI illustration: the sizes of the two elephants are only the composition, not real proportions`),
 key0:P(`小象貼在母象身邊`,`The calf stays close to its mother`),
 where:P(`吸奶的位置`,`Where the calf nurses`),
 behindLeg:P(`母象前腿的後方`,`Behind the mother's front leg`),
 growsMilk:P(`小象靠母象的乳汁長大`,`The calf grows on its mother's milk`),
 zoom:P(`框起處放大`,`Framed area, zoomed`),
 frontLeg:P(`母象前腿`,`Mother's front leg`),
 milkS:P(`乳汁（示意）`,`Milk (schematic)`),
 key1:P(`小象把頭湊到母象前腿後方吸奶`,`The calf nurses behind the mother's front leg`),
 gland:P(`乳腺分泌乳汁（示意）`,`Mammary gland makes milk (schematic)`),
 calfMilk:P(`小象：喝乳汁長大`,`Calf: grows on milk`),
 laysEggs:P(`生蛋`,`Lays eggs`),hatch:P(`孵出幼體`,`Young hatch`),drinks:P(`喝乳汁`,`Drinks milk`),
 pStill:P(`生蛋，也用乳汁哺育`,`Lays eggs, still feeds milk`),
 chainNote:P(`蛋與乳汁是示意圖`,`Egg and milk: schematic`),
 key2:P(`哺乳類的母體用乳汁哺育幼體`,`A mammal mother feeds her young with milk`),
 rBirth:P(`生產方式：不同`,`Birth: different`),rFeed:P(`哺育幼體：相同`,`Feeding: the same`),rGroup:P(`類群：相同`,`Group: the same`),
 live:P(`胎生`,`Live birth`),
 notAll:P(`不是所有哺乳類都胎生`,`Not all mammals give live birth`)
};
const TITLE=[T.t0,T.t1,T.t2,T.t3],SHORT=[T.s0,T.s1,T.s2,T.s3];

// ── text helpers (as in animals_draw_egret_1023_v1.js) ─────────────────────
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
const leadBox=(c,b,px,py,col)=>{const x=Math.max(b.x+12,Math.min(b.x+b.w-12,px)),y=Math.max(b.y,Math.min(b.y+b.h,py));
  const ex=px<b.x?b.x:px>b.x+b.w?b.x+b.w:x,ey=py<b.y?b.y:py>b.y+b.h?b.y+b.h:y;lead(c,ex,ey,px,py,col);};
function cardBox(c,R){c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.fillStyle=FRAME_BG;c.fill();c.strokeStyle=rgba(C.white,.7);c.lineWidth=2;c.stroke();}
function rowsAt(c,p,x,y,w,size,col,lh,max=9){const r=rowsOf(c,p,w,size).slice(0,max);r.forEach((s,i)=>text(c,s,x,y+i*lh,size,col));return r.length;}
const ip=(r,file,[x,y])=>{const [W,H]=dim(file);return[r.x+x/W*r.w,r.y+y/H*r.h];};

// ── backgrounds: muted sky, dry ground with swaying grass (elephant), or water (platypus) ──
function land(c,R,t,{ground=0,water=0,seed=3}={}){
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  const g=c.createLinearGradient(0,R.y,0,R.y+R.h);g.addColorStop(0,SKY0);g.addColorStop(1,SKY1);c.fillStyle=g;c.fillRect(R.x,R.y,R.w,R.h);
  for(let i=0;i<3;i++){const u=mod(t*.012+i*.37+seed*.11),x=R.x-90+u*(R.w+180),y=R.y+34+i*Math.min(58,R.h*.13);
    ellipse(c,x,y,70,13,'rgba(242,236,217,.07)',null);ellipse(c,x+30,y-8,40,11,'rgba(242,236,217,.06)',null);}
  if(ground){const gy=R.y+R.h-ground;c.fillStyle=GROUND;c.fillRect(R.x,gy,R.w,ground);line(c,[[R.x,gy],[R.x+R.w,gy]],rgba(GROUND_HI,.9),2);
    const rr=K.rng(seed);for(let i=0;i<Math.round(R.w/26);i++){const x=R.x+rr()*R.w,h=6+rr()*9,ph=rr()*TAU,sw=3*Math.sin(t*1.3+ph);
      K.sline(c,[[x-3,gy+3],[x-4+sw*.6,gy-h*.7]],rgba(GRASS,.85),1.8);K.sline(c,[[x,gy+3],[x+sw,gy-h]],rgba(GRASS,.85),1.8);K.sline(c,[[x+3,gy+3],[x+5+sw*.6,gy-h*.6]],rgba(GRASS,.85),1.8);}}
  if(water){const wy=R.y+R.h-water;c.fillStyle=WATER;c.fillRect(R.x,wy,R.w,water);
    for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<=40;i++){const xx=R.x+i/40*R.w;c.lineTo(xx,wy+6+j*11+2.5*Math.sin(i*.9-t*1.6+j*1.7));}c.strokeStyle=rgba(WATER_HI,.55-j*.13);c.lineWidth=2;c.stroke();}}
  c.restore();
  c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.strokeStyle=rgba(C.white,.55);c.lineWidth=2;c.stroke();
}

// ── milk drops (schematic) along FLOW, mapped by fn(image point) → canvas point ──
function pathAt(pts,u){const seg=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d;}
  let s=u*tot,i=0;while(i<seg.length-1&&s>seg[i]){s-=seg[i];i++;}const v=clamp(s/seg[i]);return[mix(pts[i][0],pts[i+1][0],v),mix(pts[i][1],pts[i+1][1],v)];}
function milkFlow(c,map,t,r=4.5,n=5){
  for(let i=0;i<n;i++){const u=mod(t*.32+i/n),[x,y]=map(pathAt(FLOW,u)),a=Math.sin(u*Math.PI);
    glow(c,x,y,r*3,MILK,.45*a);circle(c,x,y,r,rgba(MILK,.35+.65*a),rgba(C.ink,.7*a),1.2);}
}
// a milk drop icon
function drop(c,x,y,s,col=MILK){c.save();c.translate(x,y);c.beginPath();c.moveTo(0,-s*1.25);c.bezierCurveTo(s*.5,-s*.55,s,0,s,s*.32);c.arc(0,s*.32,s,0,Math.PI);c.bezierCurveTo(-s,0,-s*.5,-s*.55,0,-s*1.25);
  c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();c.restore();}

// ── header ─────────────────────────────────────────────────────────────────
function header(c,k){
  const pl=fitText(c,L('mammal','哺乳類','Mammals'),20,12,300,CYAN,{active:true});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),room=940-measure(c,ai,22)-24-(pl.x+pl.w+14);
  let n=TITLE[k];if(measure(c,n,26)>room)n=SHORT[k];
  text(c,n,pl.x+pl.w+14,pl.y+pl.h/2+9,26,C.white);
  text(c,ai,940,40,22,C.muted,'right');
}
const KEY_Y=532;
function keyRow(c,items,tau,t0){
  const ws=items.map(([p])=>boxOf(c,p,900).w),gap=16,tot=ws.reduce((a,b)=>a+b,0)+gap*(items.length-1);let x=480-tot/2;
  items.forEach(([p,col,act],i)=>{withA(c,fade(tau,t0+i*.6,.5),()=>fitText(c,p,x,KEY_Y,900,col,{active:!!act}));x+=ws[i]+gap;});
}
// the elephant picture with a slow "breath" (scaled about the feet so it stays on the ground)
function elephant(c,R,t,alpha=1){const k=1+.004*Math.sin(t*1.2),r={x:R.x+R.w/2-R.w*k/2,y:R.y+R.h-R.h*k,w:R.w*k,h:R.h*k};drawIn(c,EL,r,{alpha});return r;}

// ── step 0: mother and calf ────────────────────────────────────────────────
const H0={x:16,y:64,w:600,h:452},A0={x:632,y:64,w:312,h:452};
function step0(c,tau,t){
  land(c,H0,t,{ground:30,seed:3});
  const r0=fitRect(EL,H0.x+12,H0.y+8,H0.w-24,H0.h-16);
  // shadow on the ground
  ellipse(c,r0.x+r0.w*.5,r0.y+r0.h-6,r0.w*.46,9,'rgba(11,26,21,.35)',null);
  const r=withPic(c,tau,()=>elephant(c,r0,t));
  // a soft light that moves from the mother to the calf and back
  withA(c,fade(tau,3.2,.6),()=>{const u=(1-Math.cos(t*TAU/4))/2,a=ip(r,EL,EP.mother),b=ip(r,EL,EP.calf);glow(c,mix(a[0],b[0],u),mix(a[1],b[1],u),70,YELLOW,.22);});
  [[EP.mother,1.2],[EP.calf,2.0]].forEach(([p,t0],i)=>withA(c,fade(tau,t0,.5),()=>{const [x,y]=ip(r,EL,p);K.marker(c,x,y,i+1,t,13);
    fitText(c,i?L('calf','小象','Calf'):L('cow','母象','Mother'),x+22,y-20,200,C.white);}));
  withA(c,fade(tau,.6,.5),()=>{cardBox(c,A0);const x=A0.x+18,w=A0.w-36;
    text(c,L('elephant','亞洲象','Asian elephant'),x,A0.y+40,26,C.white);
    text(c,T.look,x,A0.y+80,22,C.muted);
    [L('cow','母象','Mother'),L('calf','小象','Calf')].forEach((p,i)=>withA(c,fade(tau,1.2+i*.8,.5),()=>{const y=A0.y+124+i*48;
      K.marker(c,x+14,y-8,i+1,null,13);text(c,p,x+38,y,24,YELLOW);}));
    withA(c,fade(tau,2.6,.5),()=>rowsAt(c,T.close,x,A0.y+236,w,22,C.white,30,4));
    withA(c,fade(tau,3.4,.5),()=>{const n=rowsOf(c,T.sizeNote,w,22).length;rowsAt(c,T.sizeNote,x,A0.y+A0.h-18-(n-1)*30,w,22,C.muted,30,5);});});
  keyRow(c,[[T.key0,YELLOW,false]],tau,4);
}
function withPic(c,tau,fn){let r;c.save();c.globalAlpha*=fade(tau,0,.6);r=fn();c.restore();return r;}

// ── step 1: the nursing place, zoomed ──────────────────────────────────────
const M1={x:16,y:64,w:300,h:224},B1={x:16,y:304,w:300,h:212},Z1={x:332,y:64,w:612,h:452};
function step1(c,tau,t){
  land(c,M1,t,{ground:16,seed:5});
  const rm=fitRect(EL,M1.x+12,M1.y+8,M1.w-24,M1.h-14);
  withA(c,fade(tau,0,.5),()=>drawIn(c,EL,rm));
  // zoom area with a slow pan
  const pan=8*Math.sin(t*.45),cx=CROP[0]+pan,cy=CROP[1]+pan*.5,cw=CROP[2],ch=CROP[3],[W,H]=dim(EL);
  const zm=([x,y])=>[Z1.x+(x-cx)/cw*Z1.w,Z1.y+(y-cy)/ch*Z1.h];
  withA(c,fade(tau,.5,.6),()=>{
    const f0=ip(rm,EL,[cx,cy]),f1=ip(rm,EL,[cx+cw,cy+ch]);
    c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*12;c.strokeStyle=C.white;c.lineWidth=2;c.strokeRect(f0[0],f0[1],f1[0]-f0[0],f1[1]-f0[1]);
    c.beginPath();c.moveTo(f1[0],f0[1]);c.lineTo(Z1.x,Z1.y+14);c.moveTo(f1[0],f1[1]);c.lineTo(Z1.x,Z1.y+Z1.h-14);c.strokeStyle=rgba(C.white,.55);c.stroke();c.restore();
    land(c,Z1,t,{seed:8});
    drawIn(c,EL,Z1,{radius:14,crop:[cx/W,cy/H,cw/W,ch/H]});
    c.beginPath();c.roundRect(Z1.x,Z1.y,Z1.w,Z1.h,14);c.strokeStyle=C.white;c.lineWidth=2;c.stroke();});
  // milk (schematic) from the mother's chest behind the leg to the calf's mouth
  withA(c,fade(tau,2.6,.6),()=>{c.save();c.beginPath();c.roundRect(Z1.x,Z1.y,Z1.w,Z1.h,14);c.clip();milkFlow(c,zm,t,6,5);c.restore();});
  withA(c,fade(tau,1.2,.5),()=>{const [x,y]=zm(EP.calfEar),b=fitText(c,L('calf','小象','Calf'),Z1.x+16,Z1.y+Z1.h-118,200,C.white);leadBox(c,b,x,y,C.white);});
  withA(c,fade(tau,1.6,.5),()=>{const [x,y]=zm(EP.leg),b=fitText(c,T.frontLeg,Z1.x+Z1.w-16,Z1.y+Z1.h-58,260,C.white,{align:'right'});leadBox(c,b,x,y,C.white);});
  withA(c,fade(tau,2.2,.5),()=>{const [x,y]=zm(EP.mouth);K.pulse(c,x,y,t,YELLOW,12);
    const b=fitText(c,L('nursing','吸奶','Nursing'),Z1.x+Z1.w/2-20,Z1.y+Z1.h-58,220,YELLOW,{active:true,align:'center'});leadBox(c,b,x,y,YELLOW);});
  withA(c,fade(tau,2.8,.5),()=>{const [x,y]=zm(EP.chest),b=fitText(c,T.milkS,Z1.x+16,Z1.y+16,260,C.white);leadBox(c,b,x,y,MILK);});
  // card under the small picture
  withA(c,fade(tau,.8,.5),()=>{cardBox(c,B1);const x=B1.x+16,w=B1.w-32;
    text(c,T.where,x,B1.y+34,24,C.white);
    const y1=B1.y+72,n1=rowsOf(c,T.behindLeg,w,22).length;
    withA(c,fade(tau,2.2,.5),()=>rowsAt(c,T.behindLeg,x,y1,w,22,YELLOW,29,2));
    withA(c,fade(tau,3,.5),()=>rowsAt(c,T.growsMilk,x,y1+n1*29+8,w,22,C.white,29,2));
    text(c,T.zoom,x,B1.y+B1.h-14,22,C.muted);});
  keyRow(c,[[T.key1,YELLOW,false]],tau,4);
}

// ── step 2: fed with milk; platypus too ────────────────────────────────────
const H2={x:16,y:64,w:452,h:452},R2={x:484,y:64,w:460,h:452};
function egg(c,x,y,s,crack=0,t=0){
  const wob=crack>0?0:.06*Math.sin(t*3);c.save();c.translate(x,y+s*1.2);c.rotate(wob);c.translate(0,-s*1.2);
  ellipse(c,0,0,s*.82,s*1.1,EGG,EGG_EDGE,2);ellipse(c,-s*.25,-s*.35,s*.18,s*.3,'rgba(255,255,255,.45)',null);
  if(crack>0){c.beginPath();const pts=[[-s*.8,-s*.05],[-s*.45,-s*.3],[-s*.15,0],[s*.2,-s*.32],[s*.5,-s*.02],[s*.8,-s*.2]];
    pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]-crack*s*.25*(i%2)):c.moveTo(p[0],p[1]));c.strokeStyle='#6b5a3a';c.lineWidth=2.4;c.stroke();}
  c.restore();
}
function step2(c,tau,t){
  land(c,H2,t,{ground:22,seed:4});
  const r0=fitRect(EL,H2.x+10,H2.y+66,H2.w-20,H2.h-132);
  ellipse(c,r0.x+r0.w*.5,r0.y+r0.h-4,r0.w*.46,7,'rgba(11,26,21,.35)',null);
  const r=withPic(c,tau,()=>elephant(c,r0,t));
  const im=p=>ip(r,EL,p);
  withA(c,fade(tau,1,.6),()=>{const [x,y]=im(EP.chest);glow(c,x,y,16+3*Math.sin(t*2.4),YELLOW,.5);milkFlow(c,im,t,3.6,5);});
  withA(c,fade(tau,1,.5),()=>{const [x,y]=im(EP.chest),b=fitText(c,T.gland,H2.x+12,H2.y+12,H2.w-24,YELLOW);leadBox(c,b,x,y,YELLOW);});
  withA(c,fade(tau,2,.5),()=>{const [x,y]=im(EP.mouth),b=fitText(c,T.calfMilk,H2.x+12,H2.y+H2.h-58,H2.w-24,C.white);leadBox(c,b,x,y,C.white);});
  // platypus card
  withA(c,fade(tau,2.6,.6),()=>{cardBox(c,R2);const x=R2.x+18;
    text(c,L('platypus','鴨嘴獸','Platypus'),x,R2.y+38,26,C.white);
    text(c,L('schematic','示意','Schematic'),R2.x+R2.w-16,R2.y+38,22,C.muted,'right');
    const pr0=fitRect(PL,R2.x+30,R2.y+58,R2.w-60,150),pr={...pr0,y:pr0.y+2*Math.sin(t*1.3)};
    ellipse(c,pr0.x+pr0.w*.55,pr0.y+pr0.h-4,pr0.w*.4,7,'rgba(11,26,21,.4)',null);drawIn(c,PL,pr);
    // chain: lays eggs → young hatch → drinks milk (schematic)
    const cy=R2.y+276,xs=[R2.x+82,R2.x+230,R2.x+378],lbl=[T.laysEggs,T.hatch,T.drinks];
    const loop=mod(Math.max(0,tau-3.2)/4.5),act=Math.min(2,Math.floor(loop*3));
    withA(c,fade(tau,3.2,.5),()=>{
      for(let i=0;i<2;i++){const ax=xs[i]+44,bx=xs[i+1]-44;K.arrow(c,ax,cy,bx,cy,rgba(C.white,.75),3);}
      egg(c,xs[0],cy,30,0,t);
      egg(c,xs[1],cy,30,.5+.5*Math.sin(t*2),t);
      const dy=4*Math.sin(t*2.2);drop(c,xs[2],cy-6+dy,20);
      // milk drip from the drop
      const u=mod(t*.8);withA(c,1-u,()=>circle(c,xs[2],cy+22+u*22,4,MILK,C.ink,1));
      circle(c,xs[act],cy,46,null,rgba(YELLOW,.55+.35*Math.sin(t*4)),3);
      lbl.forEach((p,i)=>text(c,p,xs[i],cy+76,22,i===2?YELLOW:C.white,'center'));});
    withA(c,fade(tau,4.4,.5),()=>fitText(c,T.pStill,R2.x+R2.w/2,R2.y+366,R2.w-32,YELLOW,{align:'center'}));
    text(c,T.chainNote,R2.x+R2.w/2,R2.y+R2.h-16,22,C.muted,'center');});
  keyRow(c,[[T.key2,YELLOW,false]],tau,5.2);
}

// ── step 3: nursing, not live birth ────────────────────────────────────────
const PA={x:16,y:64,w:440,h:196},PB={x:504,y:64,w:440,h:196};
const ROWS=[302,374,446],LX=PA.x+PA.w/2-40,RX=PB.x+PB.w/2+40,MX=480;
function step3(c,tau,t){
  land(c,PA,t,{ground:20,seed:6});
  const ra0=fitRect(EL,PA.x+70,PA.y+12,PA.w-140,PA.h-22);
  withPic(c,tau,()=>elephant(c,ra0,t));
  withA(c,fade(tau,.4,.6),()=>{land(c,PB,t,{ground:34,seed:7});
    const pb0=fitRect(PL,PB.x+60,PB.y+40,PB.w-120,PB.h-64),pb={...pb0,y:pb0.y+2*Math.sin(t*1.3)};drawIn(c,PL,pb);});
  withA(c,fade(tau,.3,.5),()=>fitText(c,L('elephant','亞洲象','Asian elephant'),PA.x+12,PA.y+12,300,C.white));
  withA(c,fade(tau,.6,.5),()=>fitText(c,L('platypus','鴨嘴獸','Platypus'),PB.x+12,PB.y+12,300,C.white));
  // rows: label in the middle, elephant value left, platypus value right
  const rowsDef=[
    {lab:T.rBirth,a:T.live,b:L('eggLaying','卵生','Lays eggs'),col:C.white,labCol:C.muted,link:'diff',t0:1},
    {lab:T.rFeed,a:L('milk','乳汁','Milk'),b:L('milk','乳汁','Milk'),col:YELLOW,labCol:YELLOW,link:'same',t0:2.2},
    {lab:T.rGroup,a:L('mammal','哺乳類','Mammals'),b:L('mammal','哺乳類','Mammals'),col:CYAN,labCol:CYAN,link:'same',t0:3.4,active:true}];
  rowsDef.forEach((R,i)=>withA(c,fade(tau,R.t0,.6),()=>{const y=ROWS[i];
    const lb=boxOf(c,R.lab,240),ab=boxOf(c,R.a,260),bb=boxOf(c,R.b,260),h=lb.h,cyy=y+h/2;
    const lx0=MX-lb.w/2,lx1=MX+lb.w/2,ax1=LX+ab.w/2,bx0=RX-bb.w/2;
    if(R.link==='same'){line(c,[[ax1,cyy],[lx0,cyy]],rgba(R.col,.7),3);line(c,[[lx1,cyy],[bx0,cyy]],rgba(R.col,.7),3);
      for(let j=0;j<3;j++){const u=mod(t*.35+j/3);const p=u<.5?[mix(ax1,lx0,u*2),cyy]:[mix(lx1,bx0,u*2-1),cyy];circle(c,p[0],p[1],4.5,R.col,C.ink,1.2);}}
    else{K.dashed(c,[[ax1,cyy],[lx0,cyy]],rgba(C.muted,.6),2.5,[6,6],-t*10);K.dashed(c,[[lx1,cyy],[bx0,cyy]],rgba(C.muted,.6),2.5,[6,6],t*10);}
    fitText(c,R.lab,MX,y,240,R.labCol,{align:'center',dash:R.link==='diff'?[5,4]:null});
    fitText(c,R.a,LX,y,260,R.col,{align:'center',active:!!R.active});
    fitText(c,R.b,RX,y,260,R.col,{align:'center',active:!!R.active});
    if(R.active){glow(c,LX,cyy,60+6*Math.sin(t*2),CYAN,.18);glow(c,RX,cyy,60+6*Math.sin(t*2+1),CYAN,.18);}}));
  keyRow(c,[[T.notAll,ORANGE,true],[L('notLiveBirth','核心是哺乳，不是胎生','The core is milk, not live birth'),YELLOW,false]],tau,4.6);
}

// ── one step's whole picture ───────────────────────────────────────────────
const STEPS=[step0,step1,step2,step3];
function scene(c,k,tau,t,a){withA(c,a,()=>{STEPS[k](c,tau,t);header(c,k);});}

function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.nu||(s.nu={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut);
  scene(c,k,tau,t,cross?aIn:1);
}
window.AnimalsDraw.nurse=draw;
})();

/* Plants · "Seed coat and fruit" canvas (water tab, view 2), 2026-10-22.
 * Pictures: teacher's Gemini AI illustrations in plants_ai_1022/ (not photos). Code only adds leader lines, rings,
 * arrows and the small comparison icons in the bottom strip; all of those are schematic and the page says so.
 *  0 inside a seed: peanut_seed.png, labels seed coat / two seed leaves (stored food) / embryo (dashed ring);
 *  1 angiosperm: orange_whole.png → one segment (orange_segment.png, its two seeds ringed) → orange_seeds.png;
 *    labels fruit (from the ovary), peel, juice sacs (part of the fruit). orange_half.png is not used;
 *  2 gymnosperm: pine_branch.png (2 mature cones + 1 young green cone), a cone scale ringed, an arrow to the
 *    winged seeds pine_seed_a/b.png, pill "a cone is not a fruit";
 *  3 germination: germ_1…4.png cross-fade on a common scale, aligned on the soil surface and the plant axis;
 *    the four pictures are different seeds (the soil differs), said in the caption; the strip shows all four.
 * Bottom strip, steps 0–2: seed / angiosperm (a fruit around the seed) / gymnosperm (no fruit), the current one lit,
 * so the three steps can be compared at a glance. Step 3: the four germination pictures in order.
 * Idle motion in every step: a shine sweeps over the pictures, seeds sway a little, rings pulse, arrows stream;
 * step 3 keeps cycling through the four pictures while held.
 * Label anchor points were measured once from the PNG alpha/colour (fractions of the natural size, K.SIZE).
 * Text of the page (steps, captions) lives in plants_diversity_1022_v1.js (SD_*); picture labels come from K.LAB.
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,arrow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,TAU}=K;
const LAB=()=>K.LAB||{};
const N=4,PER=8;
const SEED='#efe0b9',COAT='#fca5a5',FRUIT=C.orange,CONE=C.sand,WATER=C.cyan,EMB=C.yellow,LEAF=C.green,ROOT='#f5e6c8';
// ── layout ─────────────────────────────────────────────────────────────────
const PX=260,PY=84,PW=684,PH=388;            // picture panel
const SY=482,SH=110;                         // bottom strip
const LX=22,LW=228;                          // left caption column

// ── small helpers (as in plants_draw_pollen_1022_v1.js) ────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{const r=splitLines(c,sg,w,size);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}return r;});
function textBlock(c,p,x,y,w,col,{size=22,lh=29,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22}={}){
  const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7,h=rows.length*lh+11,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',active?C.white:rgba(col,.85));
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
// a label box with leader lines to one or more points
function tagBox(c,p,x,y,maxW,targets,col,a=1,o={}){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  if(typeof targets[0]==='number')targets=[targets];
  const r=fitText(c,p,x,y,maxW,col,o);
  targets.forEach(([tx,ty])=>{const ex=tx<r.x?r.x:tx>r.x+r.w?r.x+r.w:tx,ey=ty<r.y?r.y:ty>r.y+r.h?r.y+r.h:r.y+r.h/2;
    line(c,[[ex,ey],[tx,ty]],rgba(col,.9),2);circle(c,tx,ty,4.5,col,C.ink,1.5);});
  fitText(c,p,x,y,maxW,col,o);c.restore();return r;
}
const stepA=(held,tau,t0=0)=>held?fade(tau,t0,.5):fade(tau,t0,.5)*(1-fade(tau,PER-.4,.4));

// ── pictures: rect from a width, image-pixel → canvas point, drawing with a sweeping shine ───────────
const R=(f,x,y,w)=>{const [W,H]=K.SIZE[f];return{f,x,y,w,h:w*H/W,rot:0};};
// point (px,py) in natural pixels of the picture → canvas, following the picture's small sway (r.rot)
function pp(r,px,py){const [W,H]=K.SIZE[r.f];let x=r.x+px*r.w/W,y=r.y+py*r.h/H;
  if(r.rot){const cx=r.x+r.w/2,cy=r.y+r.h/2,co=Math.cos(r.rot),si=Math.sin(r.rot),dx=x-cx,dy=y-cy;x=cx+dx*co-dy*si;y=cy+dx*si+dy*co;}return[x,y];}
// germ_1.png has an enclosed transparent hole in the seed (a white highlight cleared with the background,
// x 204…248, y 86…128), germ_2.png a tiny one on the root (x 371…383, y 91…106): filled from behind in the
// picture's own colours so the board does not show through. The PNG files are not changed.
const PATCH={'germ_1.png':[[226,107,25,23,'#f3e8da']],'germ_2.png':[[377,98,8,10,'#ece4da']]};
const OFF={};
function pic(c,r,t,{alpha=1,shine=0,ph=0}={}){
  if(alpha<=0)return r;
  const im=K.pic(K.AI+r.f);
  if(!im){K.drawIn(c,r.f,r,{alpha});return r;}
  c.save();c.globalAlpha*=alpha;
  if(r.rot){const cx=r.x+r.w/2,cy=r.y+r.h/2;c.translate(cx,cy);c.rotate(r.rot);c.translate(-cx,-cy);}
  // fill small enclosed transparent holes of a picture from behind (see PATCH)
  (PATCH[r.f]||[]).forEach(([px,py,rx,ry,col])=>{const [W,H]=K.SIZE[r.f],kx=r.w/W,ky=r.h/H;ellipse(c,r.x+px*kx,r.y+py*ky,rx*kx,ry*ky,col,null);});
  if(shine>0){
    const W=Math.max(1,Math.round(r.w)),H=Math.max(1,Math.round(r.h)),key=r.f+W+'x'+H;
    let o=OFF[key];if(!o){o=document.createElement('canvas');o.width=W;o.height=H;OFF[key]=o;}
    const g=o.getContext('2d');g.globalCompositeOperation='source-over';g.clearRect(0,0,W,H);g.drawImage(im,0,0,W,H);
    g.globalCompositeOperation='source-atop';
    const band=Math.max(36,W*.2),sx=-band*2+mod(t*.16+ph)*(W+band*4);
    const gr=g.createLinearGradient(sx-band,0,sx+band,H*.35);
    gr.addColorStop(0,'rgba(255,252,235,0)');gr.addColorStop(.5,`rgba(255,252,235,${shine})`);gr.addColorStop(1,'rgba(255,252,235,0)');
    g.fillStyle=gr;g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';
    c.drawImage(o,r.x,r.y,r.w,r.h);
  }else c.drawImage(im,r.x,r.y,r.w,r.h);
  c.restore();return r;}
// a pulsing dashed ring (schematic)
function ring(c,x,y,rx,ry,t,col,a=1){if(a<=0)return;c.save();c.globalAlpha*=a;
  const u=.5+.5*Math.sin(t*2.4);glow(c,x,y,Math.max(rx,ry)*1.25,col,.12+.1*u);
  c.setLineDash([8,6]);c.lineDashOffset=-t*14;ellipse(c,x,y,rx+2*u,ry+2*u,null,col,2.6);c.restore();}
// a streaming dashed arrow along a quadratic curve (schematic)
function flowArrow(c,p0,p1,p2,t,col,a=1,w=2.8){if(a<=0)return;c.save();c.globalAlpha*=a;
  const pts=Array.from({length:25},(_,i)=>K.bez(p0,p1,p2,i/24*.93));
  dashed(c,pts,rgba(col,.95),w,[9,7],-t*20);
  const e=K.bez(p0,p1,p2,.9);arrow(c,e[0],e[1],p2[0],p2[1],col,w);c.restore();}

// ── step 0: inside a seed (peanut) ─────────────────────────────────────────
const PEA=R('peanut_seed.png',428,94,345);           // 345 × 371.7 → y 94…466
function step0(c,t,a,tau,L){
  PEA.rot=.018*Math.sin(t*1.1);
  pic(c,PEA,t,{alpha:a,shine:.2});
  c.save();c.globalAlpha*=a;
  fitText(c,L.peanut||P(`花生種子`,`Peanut seed`),LX+250,PY+12,170,C.green);
  // embryo: radicle + two tiny leaves between the seed leaves (measured bbox x 335…495, y 545…890)
  const [ex,ey]=pp(PEA,415,717);
  ring(c,ex,ey,40,74,t,EMB,fade(tau,2.2,.5));
  tagBox(c,P(`種皮`,`Seed coat`),790,150,150,pp(PEA,866,400),COAT,fade(tau,.6,.5));
  tagBox(c,P(`子葉\n（存養分）`,`Seed leaf\n(stored food)`),790,300,150,pp(PEA,690,430),SEED,fade(tau,1.4,.5));
  tagBox(c,P(`子葉\n（存養分）`,`Seed leaf\n(stored food)`),272,160,150,pp(PEA,250,400),SEED,fade(tau,1.4,.5));
  tagBox(c,P(`胚\n（會長成\n新植物）`,`Embryo\n(becomes\nthe plant)`),272,330,154,[ex-40,ey],EMB,fade(tau,2.2,.5));
  c.restore();
}

// ── step 1: angiosperm (orange) ────────────────────────────────────────────
const OWH=R('orange_whole.png',282,178,186),SEG=R('orange_segment.png',505,128,280),OSD=R('orange_seeds.png',818,318,112);
function step1(c,t,a,tau,L){
  OSD.rot=.03*Math.sin(t*1.3);
  pic(c,OWH,t,{alpha:a,shine:.2});
  pic(c,SEG,t,{alpha:a*fade(tau,.5,.6),shine:.18,ph:.35});
  pic(c,OSD,t,{alpha:a*fade(tau,2.4,.6),shine:.2,ph:.6});
  c.save();c.globalAlpha*=a;
  tagBox(c,P(`${D.tr(L.fruit||P('果實','Fruit'))}（子房變的）`,`${(L.fruit||P('','Fruit'))[1]} (from the ovary)`),375,96,250,pp(OWH,370,480),FRUIT,1,{align:'center'});
  tagBox(c,L.peel||P(`果皮`,`Peel`),282,398,160,pp(OWH,130,560),FRUIT,fade(tau,.8,.5));
  // peel one segment off
  flowArrow(c,[OWH.x+OWH.w-6,OWH.y+OWH.h*.5],[490,236],[SEG.x+8,SEG.y+SEG.h*.42],t,FRUIT,fade(tau,.4,.5));
  c.save();c.globalAlpha*=fade(tau,.6,.5);fitText(c,P(`剝開的一瓣`,`One segment`),SEG.x+SEG.w/2,PY+10,300,FRUIT,{align:'center'});c.restore();
  const s1=pp(SEG,320,160),s2=pp(SEG,153,232),sa=fade(tau,1.4,.5);
  ring(c,s1[0],s1[1],30,18,t,C.yellow,sa);ring(c,s2[0],s2[1],18,30,t+1,C.yellow,sa);
  tagBox(c,P(`${D.tr(L.juice||P('汁囊','Juice sacs'))}（果實的一部分）`,`${(L.juice||P('','Juice sacs'))[1]} (part of the fruit)`),650,394,300,pp(SEG,430,420),FRUIT,fade(tau,1.8,.5),{align:'center'});
  // seeds taken out of the segment
  flowArrow(c,[s1[0]+30,s1[1]+6],[800,230],[OSD.x+OSD.w*.45,OSD.y+4],t,SEED,fade(tau,2.4,.5));
  tagBox(c,P(`種子`,`Seeds`),OSD.x+OSD.w/2,PY+150,140,[OSD.x+OSD.w/2,OSD.y+10],SEED,fade(tau,2.6,.5),{align:'center'});
  c.restore();
}

// ── step 2: gymnosperm (pine) ──────────────────────────────────────────────
const PB=R('pine_branch.png',268,118,540),SA=R('pine_seed_a.png',846,190,80),SB=R('pine_seed_b.png',840,292,92);
function step2(c,t,a,tau,L){
  SA.rot=.07*Math.sin(t*1.6);SB.rot=-.06*Math.sin(t*1.4+1);
  pic(c,PB,t,{alpha:a,shine:.16});
  pic(c,SA,t,{alpha:a*fade(tau,1.6,.6),shine:.25,ph:.2});pic(c,SB,t,{alpha:a*fade(tau,1.8,.6),shine:.25,ph:.7});
  c.save();c.globalAlpha*=a;
  // cones: upper and lower mature cones (left edges), young green cone (bottom), a top scale of the upper cone
  const up=pp(PB,680,330),lo=pp(PB,470,850),gr=pp(PB,1365,715),sc=pp(PB,585,200);
  ring(c,sc[0],sc[1],18,16,t,C.yellow,fade(tau,.8,.5));
  tagBox(c,L.scale||P(`毬果鱗片`,`Cone scale`),sc[0],PY+8,220,[sc[0],sc[1]-16],CONE,fade(tau,.8,.5),{align:'center'});
  tagBox(c,P(`成熟毬果（2 個）`,`Mature cones (2)`),272,426,260,[up,lo],CONE,fade(tau,.3,.5));
  tagBox(c,P(`青毬果`,`Young green cone`),gr[0],426,240,gr,LEAF,fade(tau,.5,.5),{align:'center'});
  // the seeds sit on the scales: arrow from the ringed scale to the winged seeds
  flowArrow(c,[sc[0]+18,sc[1]+4],[640,150],[SA.x-4,SA.y+SA.h*.4],t,SEED,fade(tau,1.4,.5));
  tagBox(c,P(`種子\n（帶翅）`,`Seeds\n(winged)`),PX+PW-8,PY+8,140,[SA.x+SA.w*.5,SA.y+12],SEED,fade(tau,1.6,.5),{align:'right'});
  c.save();c.globalAlpha*=fade(tau,2.6,.5);fitText(c,L.coneNotFruit||P(`毬果不是果實`,`A cone is not a fruit`),PX+PW-14,372,300,CONE,{align:'right',active:true});c.restore();
  c.restore();
}

// ── step 3: germination (four different seeds) ─────────────────────────────
const GF=['germ_1.png','germ_2.png','germ_3.png','germ_4.png'];
const AXIS=[330,240,290,270],SOIL=[38,118,199,457];          // plant axis x and soil-surface y, natural pixels (measured)
const GK=.373,GX=500,GY=96+457*GK;                            // common scale; canvas x of the axis, y of the soil surface
const G=GF.map((f,i)=>{const [W,H]=K.SIZE[f];return{f,x:GX-AXIS[i]*GK,y:GY-SOIL[i]*GK,w:W*GK,h:H*GK,rot:0};});
const gp=(i,px,py)=>pp(G[i],px,py);
const RC3=660,RW3=944-RC3-12;
// where the cycle is: index i and the cross-fade weight w to the next picture
function germPos(held,tau){
  if(held){const q=mod(Math.max(0,tau-.2)/3.2,4),i=Math.floor(q),f=q-i;return{i,w:smooth((f-.72)/.28),n:(i+1)%4};}
  const q=Math.min(3.999,Math.max(0,tau-.2)/1.9),i=Math.floor(q),f=q-i;return{i,w:i<3?smooth((f-.7)/.3):0,n:Math.min(3,i+1)};
}
function germLabels(c,i,t,a,L){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  if(i===0){
    tagBox(c,L.seed||P(`種子`,`Seed`),RC3,214,RW3,gp(0,500,170),SEED);
    tagBox(c,L.water||P(`水`,`Water`),RC3,350,RW3,[gp(0,410,286),gp(0,288,290)],WATER);
    const sc=gp(0,330,178);glow(c,sc[0],sc[1],80,WATER,.16+.1*Math.sin(t*2.2));
    [[[40,180],[150,182]],[[630,180],[514,184]],[[215,410],[262,288]],[[455,410],[405,290]]].forEach(([a0,a1],j)=>{
      const p0=gp(0,...a0),p1=gp(0,...a1);flowArrow(c,p0,[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2],p1,t+j*.3,WATER,1,3);});
  }else if(i===1){
    tagBox(c,P(`種皮裂開`,`Seed coat splits`),GX-10,PY+68,300,gp(1,200,112),COAT,1,{align:'center'});
    tagBox(c,P(`胚根`,`Young root`),RC3,320,RW3,gp(1,352,338),ROOT);
    const a0=gp(1,428,170),a1=gp(1,428,330);flowArrow(c,a0,[a0[0]+4,(a0[1]+a1[1])/2],a1,t,ROOT,1,2.6);
  }else if(i===2){
    tagBox(c,P(`莖彎成鉤`,`Stem bent into a hook`),RC3,150,RW3,gp(2,320,24),LEAF);
    tagBox(c,L.cotyledon||P(`子葉`,`Seed leaf`),272,150,130,gp(2,160,120),LEAF);
    tagBox(c,L.root||P(`根`,`Root`),RC3,380,RW3,gp(2,300,470),ROOT);
    const a0=gp(2,395,200),a1=gp(2,395,40);flowArrow(c,a0,[a0[0]+4,(a0[1]+a1[1])/2],a1,t,LEAF,1,2.6);
  }else{
    tagBox(c,P(`真葉`,`True leaves`),RC3,150,RW3,[gp(3,420,48),gp(3,150,84)],LEAF);
    tagBox(c,L.cotyledon||P(`子葉`,`Seed leaf`),RC3,214,RW3,gp(3,392,205),LEAF);
    tagBox(c,L.stem||P(`莖`,`Stem`),RC3,284,RW3,gp(3,276,380),LEAF);
    tagBox(c,L.root||P(`根`,`Root`),RC3,370,RW3,gp(3,300,650),ROOT);
  }
  c.restore();
}
const GL=L=>[L.germ1||P(`吸水膨脹`,`Swells with water`),L.germ2||P(`胚根長出`,`Root emerges`),L.germ3||P(`莖彎鉤出土`,`Bent stem pushes up`),L.germ4||P(`展開真葉`,`True leaves open`)];
function step3(c,t,a,tau,held,L){
  const {i,w,n}=germPos(held,tau);
  // cross-fade: the next picture comes in on top while the current one goes out
  pic(c,G[i],t,{alpha:a*(1-w),shine:.16,ph:i*.25});
  if(w>0)pic(c,G[n],t,{alpha:a*w,shine:.16,ph:n*.25});
  // labels switch with a short dip in the middle of the cross-fade, so old and new never overlap
  const la=Math.max(0,1-2*w),lb=Math.max(0,2*w-1);
  germLabels(c,i,t,a*la,L);if(n!==i)germLabels(c,n,t,a*lb,L);
  c.save();c.globalAlpha*=a;
  const lab=GL(L);
  [[i,la],[n,lb]].forEach(([j,al])=>{if(al<=0)return;c.save();c.globalAlpha*=al;
    const w0=Math.min(measure(c,lab[j],22)+28,300),x1=PX+PW-14;num(c,x1-w0-22,PY+29,j+1,null);fitText(c,lab[j],x1,PY+10,300,C.yellow,{active:true,align:'right'});c.restore();});
  c.restore();
  return{i,w,n};
}

// a numbered dot (digit at 22px)
function num(c,x,y,n,t,col=C.yellow){if(t!=null)K.pulse(c,x,y,t,col,16);circle(c,x,y,15,col,C.ink,2);
  c.save();c.font=K.MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}

// ── bottom strip ───────────────────────────────────────────────────────────
function seedIcon(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);
  c.beginPath();c.moveTo(0,-15);c.bezierCurveTo(10,-10,14,4,0,15);c.bezierCurveTo(-14,4,-10,-10,0,-15);
  c.fillStyle=SEED;c.fill();c.strokeStyle='#a8875a';c.lineWidth=3;c.stroke();
  ellipse(c,0,5,4,6,'#9fd97a',null);c.restore();}
const CMP=[P(`種子：\n種皮包著胚`,`Seed:\ncoat + embryo`),P(`被子植物：\n果實包著種子`,`Angiosperm:\nin a fruit`),P(`裸子植物：\n沒有果實包著`,`Gymnosperm:\nno fruit`)];
const CMP_COL=[SEED,FRUIT,CONE];
function compareStrip(c,k,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const cw=(PW-16)/3;
  for(let j=0;j<3;j++){const x=PX+j*(cw+8),on=j===k,col=CMP_COL[j];
    c.save();c.globalAlpha*=on?1:.5;
    D.round(c,x,SY,cw,SH,14,on?'#173a2e':'#10261d',on?col:C.edge);
    if(on){c.save();c.lineWidth=3;c.strokeStyle=rgba(col,.35+.25*Math.sin(t*2.2));c.beginPath();c.roundRect(x-3,SY-3,cw+6,SH+6,16);c.stroke();c.restore();}
    const ix=x+cw/2,iy=SY+28,sw=on?.05*Math.sin(t*2+j):0;
    c.save();c.translate(ix,iy);c.rotate(sw);c.translate(-ix,-iy);
    if(j===1){circle(c,ix,iy,22,'#f8a24a','#fed7aa',2.5);circle(c,ix,iy,15,'#fbc27f',null);}
    if(j===2){c.beginPath();c.moveTo(ix-30,iy+14);c.quadraticCurveTo(ix,iy+2,ix+30,iy+14);c.lineTo(ix+22,iy+22);c.quadraticCurveTo(ix,iy+14,ix-22,iy+22);c.closePath();
      c.fillStyle='#9a6b43';c.fill();c.strokeStyle=CONE;c.lineWidth=2;c.stroke();}
    seedIcon(c,ix,j===2?iy-3:iy,j===0?1.05:.72);
    c.restore();
    textBlock(c,CMP[j],ix,SY+72,cw-16,on?col:C.muted,{lh:27,align:'center'});
    c.restore();}
  c.restore();
}
function germStrip(c,g,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const cw=(PW-24)/4;
  for(let j=0;j<4;j++){const x=PX+j*(cw+8),on=j===g.i?1-g.w:j===g.n?g.w:0;
    c.save();c.globalAlpha*=.5+.5*on;
    D.round(c,x,SY,cw,SH,14,on>.5?'#173a2e':'#10261d',on>.5?C.yellow:C.edge);
    const r=K.fitRect(GF[j],x+34,SY+6,cw-44,SH-12);pic(c,{f:GF[j],...r,rot:0},t,{shine:on>.5?.18:0,ph:j*.2});
    num(c,x+19,SY+21,j+1,on>.5?t:null);
    if(j<3)arrow(c,x+cw-6,SY+SH/2,x+cw+10,SY+SH/2,rgba(C.muted,.9),2.5);
    c.restore();}
  c.restore();
}

// ── left column: the step in a few words ───────────────────────────────────
const SHORT=[P(`種子裡有什麼`,`Inside a seed`),P(`被子：在果實裡`,`Angiosperm: in a fruit`),P(`裸子：在鱗片上`,`Gymnosperm: on a scale`),P(`萌發`,`Germination`)];
const SAY=[P(`種子外面有種皮，\n裡面有胚和養分`,`A seed coat outside; an embryo and stored food inside`),
 P(`被子植物的種子\n包在果實裡`,`In an angiosperm the seeds are inside a fruit`),
 P(`裸子植物的種子\n露在毬果鱗片上，\n沒有果實包著`,`In a gymnosperm the seeds lie uncovered on the cone scales, with no fruit around them`),
 P(`吸水 → 胚根 →\n莖彎鉤出土 → 真葉`,`Water → root → bent stem comes up → true leaves`)];
const NOTE=[P(`花生的兩枚子葉\n存著養分`,`A peanut's two seed leaves store the food`),
 P(`果實由子房\n發育而來`,`A fruit develops from the ovary`),
 P(`圖裡有 2 個成熟毬果\n和 1 個青毬果`,`The picture shows 2 mature cones and 1 young green cone`),
 P(`四張圖是不同的種子\n（土塊形狀不同），\n不是同一粒種子`,`Four different seeds (the soil differs), not one seed`)];
const NOTE_COL=[SEED,FRUIT,CONE,C.muted];
const AI3=P(`AI 插圖，非實拍；\n箭頭是示意`,`AI illustrations, not photos; arrows are schematic`);
const AI02=P(`AI 插圖，非實拍；\n圈、箭頭和下排\n小圖是示意`,`AI illustrations, not photos; rings, arrows and the small icons are schematic`);
function caption(c,k,a,tau){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const col=[SEED,FRUIT,CONE,LEAF][k];
  const r=fitText(c,SHORT[k],LX,PY+6,LW-6,col,{active:true});
  const h=textBlock(c,SAY[k],LX,r.y+r.h+32,LW,C.white);
  c.save();c.globalAlpha*=fade(tau,1.6,.6);textBlock(c,NOTE[k],LX,r.y+r.h+32+h+12,LW,NOTE_COL[k]);c.restore();
  const ai=k===3?AI3:AI02,n=rowsOf(c,ai,LW).length;
  textBlock(c,ai,LX,SY+SH-8-(n-1)*27,LW,C.muted,{lh:27});
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const L=LAB(),a=stepA(held,tau);
  D.round(c,PX,PY,PW,PH,18,'#0f241b',C.edge);
  let g=null;
  if(k===0)step0(c,t,a,tau,L);
  else if(k===1)step1(c,t,a,tau,L);
  else if(k===2)step2(c,t,a,tau,L);
  else g=step3(c,t,a,tau,held,L);
  if(k<3)compareStrip(c,k,t,a);else germStrip(c,g,t,a);
  caption(c,k,a,tau);
}
window.PlantsDraw.seed=draw;
})();

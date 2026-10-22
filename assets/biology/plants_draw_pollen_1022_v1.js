/* Plants · "Seed plants: pollen tube" canvas (water tab, view 1), 2026-10-22.
 * Left bottom: a small flower (schematic, drawn here) with a box on its pistil, joined by dashed lines to the big
 * magnified panel on the right: the pistil cut open lengthwise (schematic, drawn here): stigma, style, ovary with three
 * ovules, an egg in each ovule; pollen grains (yellow), pollen tubes (pale yellow), sperm cells (cyan #55e9ff, no tails:
 * they ride in the tube), egg (pink).
 *  0 pollen drifts in and lands on the stigma (three grains; the left one is followed, the others are fainter);
 *  1 the grains take up moisture and each grows a pollen tube into the top of the style; the sperm cells move into it;
 *  2 the tubes grow down through the style into the ovary, each to the opening of one ovule, carrying the sperm cells;
 *  3 the tube tip opens, one sperm cell joins the egg (fertilization, the egg becomes a fertilized egg), the other
 *    sperm cell goes on into the ovule and fades (no name given: the course does not teach double fertilization);
 *  4 the stigma and style wither, the ovary swells and turns into a fruit, the ovules turn into seeds;
 *    the small flower on the left gives way to orange_whole.png and orange_seeds.png (teacher's Gemini AI illustrations).
 * Idle motion in every step: the stigma glistens, the pollen grains and sperm cells shimmer, streaming dots run along
 * the tubes, the fertilized eggs pulse, the fruit shines. Pine (gymnosperm) is only mentioned in the text of step 3.
 * Text of the page (steps, captions) lives in plants_diversity_1022_v1.js (PO_*); picture labels come from K.LAB.
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,arrow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,TAU}=K;
const LAB=()=>K.LAB||{};
const N=5,PER=7;
const POLLEN=C.yellow,TUBE='#fde68a',STIG='#a7e07c',STYLE='#8fd17a',OVARY=C.green,OVULE='#e6f4b8',SEED='#efe0b9',FRUIT=C.orange;
// ── layout ─────────────────────────────────────────────────────────────────
const PX=260,PY=84,PW=684,PH=470;            // magnified panel
const X0=560;                                // axis of the pistil
const ST_TOP=166,ST_BOT=196,ST_HW=72;        // stigma: top surface, joint with the style, half width
const SY0=192,SY1=372;                       // style from the stigma to inside the ovary
const OC=[X0,445],ORX=150,ORY=95,WALL=14;    // ovary (outer ellipse) and wall thickness
const OVX=[475,560,645],OVY=455,OVRX=32,OVRY=40;   // ovules: centres and radii; micropyle at the top
const EGGY=OVY-OVRY+18,EGG_R=11;
const RC=772,RW=944-772;                     // right label column
const LC=PX+14;                              // left label column inside the panel
// pollen grains on the stigma (landing points) and their tubes (Catmull-Rom control points, grain → micropyle)
const GR=[[528,ST_TOP-8],[562,ST_TOP-10],[596,ST_TOP-8]],GR_R=11;
const TUBE_P=[
 [[528,170],[537,196],[546,232],[548,300],[546,352],[528,384],[492,402],[475,OVY-OVRY+2]],
 [[562,170],[561,198],[560,260],[560,340],[560,OVY-OVRY+2]],
 [[596,170],[586,198],[574,240],[572,330],[590,372],[628,396],[645,OVY-OVRY+2]]];
// inset flower (schematic)
const FX=125,FBASE=520,BOX=[109,457,32,60];

// ── small helpers (as in plants_draw_swim_1022_v1.js) ──────────────────────
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
function tagBox(c,p,x,y,maxW,tx,ty,col,a=1,o={}){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const r=fitText(c,p,x,y,maxW,col,o);
  const ex=tx<r.x?r.x:tx>r.x+r.w?r.x+r.w:tx,ey=ty<r.y?r.y:ty>r.y+r.h?r.y+r.h:r.y+r.h/2;
  line(c,[[ex,ey],[tx,ty]],rgba(col,.9),2);circle(c,tx,ty,4.5,col,C.ink,1.5);
  fitText(c,p,x,y,maxW,col,o);c.restore();return r;
}
const stepA=(held,tau,t0=0)=>held?fade(tau,t0,.5):fade(tau,t0,.5)*(1-fade(tau,PER-.4,.4));

// ── tube paths: Catmull-Rom samples with running length ────────────────────
function spline(pts,n=10){const out=[];
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
    for(let j=0;j<n;j++){const u=j/n,u2=u*u,u3=u2*u;
      out.push([0,1].map(d=>.5*(2*p1[d]+(-p0[d]+p2[d])*u+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*u2+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*u3)));}}
  out.push(pts[pts.length-1]);
  const L=[0];for(let i=1;i<out.length;i++)L.push(L[i-1]+Math.hypot(out[i][0]-out[i-1][0],out[i][1]-out[i-1][1]));
  return{pts:out,L,len:L[L.length-1]};}
const PATHS=TUBE_P.map(p=>spline(p));
function along(path,d){d=Math.max(0,Math.min(path.len,d));const {pts,L}=path;let i=1;while(i<L.length-1&&L[i]<d)i++;
  const u=(d-L[i-1])/((L[i]-L[i-1])||1),a=pts[i-1],b=pts[i];return{x:mix(a[0],b[0],u),y:mix(a[1],b[1],u),ang:Math.atan2(b[1]-a[1],b[0]-a[0])};}
function partial(path,d){const out=[];for(let i=0;i<path.pts.length&&path.L[i]<d;i++)out.push(path.pts[i]);const e=along(path,d);out.push([e.x,e.y]);return out;}
// length of the main tube down to the top of the style (end of step 1)
const L1=PATHS.map(p=>{let i=0;while(i<p.pts.length-1&&p.pts[i][1]<236)i++;return p.L[i];});

// ── pistil (schematic) ─────────────────────────────────────────────────────
function stigmaPath(c){
  c.beginPath();c.moveTo(X0-24,ST_BOT+4);
  c.bezierCurveTo(X0-ST_HW-10,ST_BOT,X0-ST_HW-6,ST_TOP+4,X0-ST_HW+8,ST_TOP);
  for(let i=0;i<=8;i++){const x=X0-ST_HW+8+i*(2*ST_HW-16)/8;c.quadraticCurveTo(x-((2*ST_HW-16)/16),ST_TOP-9,x,ST_TOP);}
  c.bezierCurveTo(X0+ST_HW+6,ST_TOP+4,X0+ST_HW+10,ST_BOT,X0+24,ST_BOT+4);c.closePath();
}
function stylePath(c){c.beginPath();c.moveTo(X0-24,SY0);c.lineTo(X0+24,SY0);c.lineTo(X0+30,SY1);c.lineTo(X0-30,SY1);c.closePath();}
function pistilTop(c,t,wither){
  c.save();c.globalAlpha*=1-.6*wither;
  stylePath(c);c.fillStyle=wither>0?`rgb(${mix(76,120,wither)|0},${mix(140,96,wither)|0},${mix(70,52,wither)|0})`:'#4c8c46';c.fill();
  c.strokeStyle=STYLE;c.lineWidth=3;c.stroke();
  // transmitting tissue: a paler channel down the middle of the style
  D.round(c,X0-14,SY0+4,28,SY1-SY0-4,8,rgba('#d9f2a6',.18),null);
  stigmaPath(c);c.fillStyle=wither>0?`rgb(${mix(110,140,wither)|0},${mix(178,110,wither)|0},${mix(88,60,wither)|0})`:'#6eb25c';c.fill();
  c.strokeStyle=STIG;c.lineWidth=3;c.stroke();
  // sticky glints on the stigma surface
  for(let i=0;i<7;i++){const x=X0-54+i*18,u=.5+.5*Math.sin(t*2.1+i*1.7);circle(c,x,ST_TOP+6+(i%2)*5,2.4,rgba(C.white,.25+.5*u*(1-wither)),null);}
  c.restore();
}
// ovary + ovules (or fruit + seeds), drawn with the swelling k around the ovary centre
function ovaryShape(c,rx,ry){c.beginPath();c.ellipse(OC[0],OC[1],rx,ry,0,0,TAU);}
function ovary(c,t,m){
  const k=1+.08*m;c.save();c.translate(OC[0],OC[1]);c.scale(k,k);c.translate(-OC[0],-OC[1]);
  // green ovary
  if(m<1){c.save();c.globalAlpha*=1-m;
    ovaryShape(c,ORX,ORY);const g=c.createLinearGradient(0,OC[1]-ORY,0,OC[1]+ORY);g.addColorStop(0,'#4f9a4c');g.addColorStop(1,'#2f6a35');c.fillStyle=g;c.fill();
    c.strokeStyle=OVARY;c.lineWidth=3.5;c.stroke();
    ovaryShape(c,ORX-WALL,ORY-WALL);c.fillStyle='#163322';c.fill();c.strokeStyle=rgba('#a7e07c',.5);c.lineWidth=1.6;c.stroke();
    c.restore();}
  // fruit: thicker peel, juicy flesh
  if(m>0){c.save();c.globalAlpha*=m;
    ovaryShape(c,ORX,ORY);const g=c.createRadialGradient(OC[0]-50,OC[1]-40,10,OC[0],OC[1],ORX);g.addColorStop(0,'#fdba74');g.addColorStop(1,'#ea7a1c');c.fillStyle=g;c.fill();
    c.strokeStyle='#fed7aa';c.lineWidth=3.5;c.stroke();
    ovaryShape(c,ORX-WALL-6,ORY-WALL-6);c.fillStyle='#f8b469';c.fill();
    c.save();ovaryShape(c,ORX-WALL-6,ORY-WALL-6);c.clip();
    for(let i=0;i<16;i++){const th=i/16*TAU;line(c,[[OC[0]+40*Math.cos(th),OC[1]+26*Math.sin(th)],[OC[0]+130*Math.cos(th),OC[1]+80*Math.sin(th)]],rgba('#fde3c0',.5),2);}
    // a shine that sweeps across the fruit (idle)
    const sx=OC[0]-ORX+mod(t*.25)*2*ORX;const sg=c.createLinearGradient(sx-40,0,sx+40,0);sg.addColorStop(0,rgba(C.white,0));sg.addColorStop(.5,rgba(C.white,.16));sg.addColorStop(1,rgba(C.white,0));
    c.fillStyle=sg;c.fillRect(sx-40,OC[1]-ORY,80,2*ORY);c.restore();
    c.restore();}
  c.restore();
}
const oxy=(x,y,m)=>{const k=1+.08*m;return[OC[0]+(x-OC[0])*k,OC[1]+(y-OC[1])*k];};
function ovule(c,i,t,fert,m){
  const x=OVX[i],main=i===0;
  const k=1+.08*m;c.save();c.translate(OC[0],OC[1]);c.scale(k,k);c.translate(-OC[0],-OC[1]);
  if(m<1){c.save();c.globalAlpha*=(1-m)*(main?1:.85);
    // stalk to the ovary wall
    const bot=OC[1]+(ORY-WALL)*Math.sqrt(Math.max(0,1-((x-OC[0])/(ORX-WALL))**2));
    D.round(c,x-6,OVY+OVRY-6,12,bot-(OVY+OVRY-6)+2,5,'#9cc77a',null);
    ellipse(c,x,OVY,OVRX,OVRY,rgba(OVULE,.22),null);
    const gap=.34;c.beginPath();c.ellipse(x,OVY,OVRX,OVRY,0,-Math.PI/2+gap,-Math.PI/2-gap+TAU);c.strokeStyle=OVULE;c.lineWidth=3.5;c.stroke();
    c.beginPath();c.ellipse(x,OVY,OVRX-7,OVRY-7,0,-Math.PI/2+gap+.12,-Math.PI/2-gap-.12+TAU);c.strokeStyle=rgba(OVULE,.55);c.lineWidth=1.8;c.stroke();
    ellipse(c,x,OVY+4,OVRX-14,OVRY-14,rgba('#fdf4dc',.18),null);
    // egg
    const r=main?EGG_R:EGG_R-1.5;
    if(fert>0)glow(c,x,EGGY,r*2.8,C.pink,.55*fert*(.7+.3*Math.sin(t*2.4+i)));
    circle(c,x,EGGY,r,'#f9a8d4',C.pink,2.5);circle(c,x+2,EGGY-1,r*.36,rgba('#9d174d',.8),null);
    if(fert>0)circle(c,x,EGGY,r+4+2*Math.sin(t*2.4+i),null,rgba(C.yellow,.85*fert),2.2);
    c.restore();}
  if(m>0){c.save();c.globalAlpha*=m;
    // seed: teardrop with a seed coat, a small embryo inside
    const pulse=.5+.5*Math.sin(t*1.8+i);glow(c,x,OVY,48,SEED,.18+.12*pulse);
    c.beginPath();c.moveTo(x,OVY-OVRY-6);c.bezierCurveTo(x+22,OVY-24,x+OVRX+4,OVY+12,x,OVY+OVRY);c.bezierCurveTo(x-OVRX-4,OVY+12,x-22,OVY-24,x,OVY-OVRY-6);
    c.fillStyle='#f3e7c8';c.fill();c.strokeStyle='#a8875a';c.lineWidth=3;c.stroke();
    ellipse(c,x,OVY+12,9,14,'#c9d98a','#8aa35a',1.5);
    c.restore();}
  c.restore();
}

// ── pollen, tubes, sperm cells ─────────────────────────────────────────────
function grain(c,x,y,t,i,a=1,wither=0){
  if(a<=0)return;c.save();c.globalAlpha*=a*(1-.6*wither);
  glow(c,x,y,GR_R*2,POLLEN,.25+.15*Math.sin(t*2.6+i));
  circle(c,x,y,GR_R,'#facc15','#a16207',2);
  for(let j=0;j<7;j++){const th=j/7*TAU+i;circle(c,x+6*Math.cos(th),y+6*Math.sin(th),1.6,rgba('#854d0e',.7),null);}
  c.restore();
}
function tube(c,i,d,t,a=1){
  if(d<=1||a<=0)return;const path=PATHS[i],pts=partial(path,d),main=i===0;
  c.save();c.globalAlpha*=a*(main?1:.6);
  K.sline(c,pts,'#6b5a1a',main?10:8);K.sline(c,pts,TUBE,main?6.5:5);
  // streaming dots inside the tube, running toward the tip (idle motion)
  for(let s=mod(t*26,22);s<d-4;s+=22){const p=along(path,s);circle(c,p.x,p.y,1.6,rgba('#a16207',.8),null);}
  const tip=along(path,d);glow(c,tip.x,tip.y,12,TUBE,.5+.3*Math.sin(t*3));
  c.restore();
}
function spermCell(c,x,y,ang,t,ph,a=1,small=false){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const fl=.55+.45*Math.sin(t*4.2+ph);
  glow(c,x,y,small?10:14,C.cyan,.25+.35*fl);
  ellipse(c,x,y,small?5.5:7,small?3.6:4.6,C.cyan,C.ink,1.3,ang);
  c.restore();
}
// where the two sperm cells of tube i are when the tube is d long
function cellsAt(i,d){const g=GR[i],out=[];
  for(let j=0;j<2;j++){const home=[g[0]+(j?4:-4),g[1]+(j?3:-3)],back=16+14*j,u=clamp(d/34);
    const p=along(PATHS[i],Math.max(0,d-back));out.push({x:mix(home[0],p.x,u),y:mix(home[1],p.y,u),ang:u>0?p.ang:.6});}
  return out;}

// ── inset: a small flower (schematic) with a box on the pistil ─────────────
function petal(c,x0,y0,x1,y1,w,col,a=1){
  const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L;c.save();c.globalAlpha*=a;
  c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(x0+dx*.5+nx*w,y0+dy*.5+ny*w,x1,y1);c.quadraticCurveTo(x0+dx*.5-nx*w,y0+dy*.5-ny*w,x0,y0);
  c.fillStyle=col;c.fill();c.strokeStyle='#cfc6ab';c.lineWidth=1.5;c.stroke();c.restore();}
function flowerInset(c,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const sw=2*Math.sin(t*1.1);
  line(c,[[FX,FBASE+4],[FX+sw*.3,FBASE+44]],'#5f9a45',5);
  petal(c,FX-4,FBASE-6,FX-30+sw,FBASE-92,16,'#e9e3d0',.9);petal(c,FX+4,FBASE-6,FX+30+sw,FBASE-92,16,'#e9e3d0',.9);
  petal(c,FX-8,FBASE-2,FX-72+sw,FBASE-62,20,'#f6f1e3');petal(c,FX+8,FBASE-2,FX+72+sw,FBASE-62,20,'#f6f1e3');
  ellipse(c,FX,FBASE,16,7,'#6aa84f',null);
  // pistil
  ellipse(c,FX,FBASE-14,10,11,'#4f9a4c','#a7e07c',1.5);
  D.round(c,FX-3,BOX[1]+12,6,FBASE-24-(BOX[1]+12),3,'#6eb25c',null);
  ellipse(c,FX,BOX[1]+11,8,4.5,'#8fd17a','#a7e07c',1.2);
  c.save();c.strokeStyle=C.white;c.lineWidth=2.5;c.strokeRect(...BOX);c.restore();
  dashed(c,[[BOX[0]+BOX[2],BOX[1]],[PX,PY+306]],rgba(C.white,.7),2,[7,6],-t*10);
  dashed(c,[[BOX[0]+BOX[2],BOX[1]+BOX[3]],[PX,PY+PH-20]],rgba(C.white,.7),2,[7,6],-t*10);
  tagBox(c,P(`花瓣`,`Petal`),22,384,120,FX-62,FBASE-58,'#f6f1e3');
  fitText(c,P(`一朵花（示意）`,`Flower (schematic)`),FX,FBASE+40,240,C.green,{align:'center'});
  c.restore();
}
// step 4: the real fruit and seeds (teacher's AI illustrations)
const OW=120,OH=OW*K.SIZE['orange_whole.png'][1]/K.SIZE['orange_whole.png'][0],SW_=100,SH_=SW_*K.SIZE['orange_seeds.png'][1]/K.SIZE['orange_seeds.png'][0];
const ORG={x:20,y:350},SDS={x:146,y:372};
function orangeInset(c,t,a,m){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const L=LAB(),b=2*Math.sin(t*1.4);
  K.drawIn(c,'orange_whole.png',{x:ORG.x,y:ORG.y+b,w:OW,h:OH});
  K.drawIn(c,'orange_seeds.png',{x:SDS.x,y:SDS.y,w:SW_,h:SH_});
  fitText(c,P(`果實：${D.tr(L.orange||P('橘子','Orange')) }`,`Fruit: ${(L.orange||P('橘子','Orange'))[1].toLowerCase()}`),ORG.x,ORG.y+OH+8,230,FRUIT);
  fitText(c,L.seed||P(`種子`,`Seed`),SDS.x+SW_/2,SDS.y-46,104,SEED,{align:'center'});
  textBlock(c,L.aiNote||P(`AI 插圖，非實拍`,`AI illustration, not a photo`),22,ORG.y+OH+88,228,C.muted);
  // dashed arrows from the pictures to the schematic fruit and seed
  c.save();c.globalAlpha*=m;
  const [fx,fy]=oxy(OC[0]-ORX+22,OC[1]+50,1),[sx,sy]=oxy(OVX[0]-OVRX+4,OVY-14,1);
  const darrow=(x1,y1,x2,y2,col)=>{const L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L;
    dashed(c,[[x1,y1],[x2-ux*20,y2-uy*20]],rgba(col,.9),2.5,[8,6],-t*12);arrow(c,x2-ux*26,y2-uy*26,x2,y2,col,2.5);};
  darrow(ORG.x+OW+2,ORG.y+OH*.88,fx-4,fy,FRUIT);darrow(SDS.x+SW_+2,SDS.y+SH_*.45,sx-4,sy,SEED);
  c.restore();
  c.restore();
}

// ── left column: the step in a few words ───────────────────────────────────
const SHORT=[P(`花粉落下`,`Pollen lands`),P(`長出花粉管`,`Tube grows`),P(`到胚珠`,`Reaches ovule`),P(`受精`,`Fertilization`),P(`種子與果實`,`Seed and fruit`)];
const SAY=[P(`花粉被風或昆蟲帶來，\n落在柱頭上`,`Wind or insects carry pollen to the stigma`),
 P(`花粉吸收柱頭的水分，\n長出花粉管`,`The pollen grain takes up moisture and grows a pollen tube`),
 P(`花粉管穿過花柱，\n到達胚珠`,`The tube grows through the style to the ovule`),
 P(`精細胞和卵結合，\n這叫受精`,`A sperm cell joins the egg: fertilization`),
 P(`受精以後：\n子房 → 果實\n胚珠 → 種子`,`After fertilization:\novary → fruit\novule → seed`)];
const NOTE=[null,null,
 P(`精細胞在管子裡\n被送過去，\n不必自己游泳`,`The sperm cells ride inside the tube; they do not have to swim`),
 P(`裸子植物（像松）\n的花粉直接落在\n胚珠旁，也是長出\n花粉管`,`In gymnosperms such as pine, pollen lands next to the ovule and also grows a pollen tube`),null];
const NOTE_COL=[0,0,C.cyan,C.muted,0];
function caption(c,k,a,tau){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const col=[POLLEN,TUBE,C.cyan,C.pink,FRUIT][k];
  const r=fitText(c,SHORT[k],22,PY+6,222,col,{active:true});
  const h=textBlock(c,SAY[k],22,r.y+r.h+32,228,C.white);
  if(NOTE[k]){c.save();c.globalAlpha*=fade(tau,k===3?2.8:1.6,.6);textBlock(c,NOTE[k],22,r.y+r.h+32+h+12,228,NOTE_COL[k]);c.restore();}
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const L=LAB(),a=stepA(held,tau);
  // state of the scene
  const m=k===4?smooth(fade(tau,.6,2.6))*(held?1:1-smooth(fade(tau,PER-1.1,.8))):0;     // ovary → fruit, ovule → seed
  const land=i=>k===0?smooth(fade(tau,.4+i*.8,1.6)):1;                                    // 0 in the air → 1 on the stigma
  const tubeD=i=>{const p=PATHS[i];
    if(k===0)return 0;
    if(k===1)return L1[i]*K.ease(fade(tau,.8+i*.35,held?5:PER-1.4));
    if(k===2)return mix(L1[i],p.len,smooth(fade(tau,.3+i*.35,4.6)));
    return p.len;};
  const out4=k===4&&!held?smooth(fade(tau,PER-1.1,.8)):0;                                  // end of the loop: back to the bare pistil
  const fertOf=i=>k===3?fade(tau,2.2+i*.5,.4):k===4?1-out4:0;

  D.round(c,PX,PY,PW,PH,18,'#0f241b',C.edge);
  // pistil, back to front: style + stigma, ovary, ovules, tubes on top (they run inside the tissue)
  pistilTop(c,t,m);
  ovary(c,t,m);
  for(let i=2;i>=0;i--)ovule(c,i,t,fertOf(i),m);
  const tubeA=k===4?1-smooth(fade(tau,.6,1.6)):1;
  for(let i=2;i>=0;i--)tube(c,i,tubeD(i),t,tubeA);
  // pollen grains: drifting in (step 0), sitting on the stigma afterwards
  for(let i=2;i>=0;i--){const u=land(i),g=GR[i],st=[PX+10,PY+40+i*58];
    const x=mix(st[0],g[0],u)+(1-u)*10*Math.sin(t*3+i),y=mix(st[1],g[1],u*u*(2-u))+(1-u)*8*Math.cos(t*2.3+i)+(u>=1?.8*Math.sin(t*2+i):0);
    if(u>0||k===0)grain(c,x,y,t,i,(k===0?fade(tau,i*.8,.3):1)*(i===0?1:.75)*(1-out4),m);}
  // sperm cells (in the grain, then riding in the tube; step 3: into the ovule)
  let mainCell=null;
  for(let i=0;i<3;i++){const small=i>0,al=(small?.7:1)*(1-m);
    if(k<=2){const d=tubeD(i),cs=cellsAt(i,d);
      cs.forEach((p,j)=>{let x=p.x,y=p.y;if(d<1){const u=land(i),g=GR[i];x=mix(PX+10,g[0],u)+(j?4:-4)+(1-u)*10*Math.sin(t*3+i);y=mix(PY+40+i*58,g[1],u*u*(2-u))+(j?3:-3)+(1-u)*8*Math.cos(t*2.3+i);}
        spermCell(c,x,y,p.ang,t,i*2+j,al*(k===0?fade(tau,i*.8,.3):1),small);if(i===0&&j===0)mainCell=[x,y];});}
    else if(k===3){const q=tau-i*.5,M=along(PATHS[i],PATHS[i].len),x=OVX[i];
      const ua=smooth(fade(q,.5,1.7)),ub=smooth(fade(q,.7,1.7));
      const A=[mix(M.x,x,ua),mix(M.y,EGGY,ua)],B=[mix(M.x,x+ (i===1?10:-10)*Math.sin(ub*Math.PI),ub),mix(M.y,OVY+10,ub)];
      spermCell(c,A[0],A[1],Math.PI/2,t,i*2,al*(1-fade(q,2.2,.3)),small);
      spermCell(c,B[0],B[1],Math.PI/2,t,i*2+1,al*(1-fade(q,2.2,.6)),small);
      if(i===0&&q<2.3)mainCell=A;
      if(q>2.2&&q<3.3){const r=(q-2.2)/1.1;circle(c,x,EGGY,EGG_R+r*30,null,rgba(C.yellow,.9*(1-r)*(small?.6:1)),3);}
      // the tip opens: a short flash at the opening of the ovule
      if(q>.3&&q<1.1){const r=(q-.3)/.8;circle(c,M.x,M.y,4+r*14,null,rgba(TUBE,.9*(1-r)),2.5);}}}

  // ── labels ──
  fitText(c,P(`放大：雌蕊剖面（示意）`,`Magnified: pistil cut open (schematic)`),PX+PW-14,PY+10,PW-40,'#a7e07c',{align:'right'});
  // the pistil: always named
  tagBox(c,L.stigma||P(`柱頭`,`Stigma`),RC,150,RW,X0+ST_HW-6,ST_TOP+10,STIG,1-.5*m);
  tagBox(c,L.style||P(`花柱`,`Style`),RC,250,RW,X0+26,282,STYLE,1-.5*m);
  {const [x,y]=oxy(OC[0]+ORX-6,OC[1]-36,m);
   const lab=m>.5?P(`${D.tr(L.fruit||P('果實','Fruit'))}\n（子房變的）`,`${(L.fruit||P('','Fruit'))[1]}, from\nthe ovary`):(L.ovary||P(`子房`,`Ovary`));
   tagBox(c,lab,RC,m>.5?318:340,RW,x,y,m>.5?FRUIT:OVARY);}
  {const [x,y]=oxy(OVX[2]+OVRX,OVY,m);
   const lab=m>.5?P(`${D.tr(L.seed||P('種子','Seed'))}\n（胚珠變的）`,`${(L.seed||P('','Seed'))[1]}, from\nan ovule`):(L.ovule||P(`胚珠`,`Ovule`));
   tagBox(c,lab,RC,m>.5?420:432,RW,x,y,m>.5?SEED:OVULE);}
  // egg of the followed ovule
  if(k<4||m<.5){const f=fertOf(0);
    tagBox(c,f>.5?P(`受精卵`,`Fertilized egg`):(L.egg||P(`卵`,`Egg`)),LC,410,150,OVX[0]-EGG_R,EGGY,C.pink,k===4?1-2*m:1);}
  if(k===3){c.save();c.globalAlpha*=fertOf(0);fitText(c,L.fertilize||P(`受精`,`Fertilization`),RC,500,RW,C.pink,{active:true});c.restore();}
  // pollen
  if(k<4)tagBox(c,L.pollen||P(`花粉`,`Pollen`),LC,PY+66,170,GR[0][0]-GR_R+2,GR[0][1]+2,POLLEN,k===0?fade(tau,1.6,.5):1);
  // pollen tube
  {const d=tubeD(0);if(d>22&&k<4){const p=along(PATHS[0],Math.min(d-8,150));
    tagBox(c,L.pollenTube||P(`花粉管`,`Pollen tube`),LC,240,170,p.x-4,p.y,TUBE,clamp((d-22)/20));}}
  // sperm cells
  if(mainCell&&k>=1&&k<=3)tagBox(c,L.spermCell||P(`精細胞`,`Sperm cell`),LC,320,170,mainCell[0]-6,mainCell[1],C.cyan,k===1?fade(tau,1.4,.5):1);
  // left side
  flowerInset(c,t,k<4?1:held?1-smooth(fade(tau,.3,.5)):Math.max(1-smooth(fade(tau,.3,.5)),smooth(fade(tau,PER-.5,.5))));
  orangeInset(c,t,k===4?smooth(fade(tau,.9,.6))*(held?1:1-fade(tau,PER-1.05,.45)):0,m);
  caption(c,k,a,tau);
}
window.PlantsDraw.pollen=draw;
})();

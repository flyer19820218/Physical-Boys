/* Animals · "Why molt to grow" canvas (arthropods tab, view 1), 2026-10-23.
 * Four steps; pictures cicada_shell / cicada_emerging / cicada_adult (AI illustrations, each with its own branch:
 * they are not one cicada photographed over time, and the canvas says so under the thumbnail strip).
 *  0 Schematic: a grey hard shell that never grows and a pink body inside that grows one notch at a time
 *    (pink markers 1–5) until it fills the shell; the shell edge then pulses. Right: a cicada shell as the real example,
 *    "exoskeleton".
 *  1 cicada_shell large; a yellow zoom box over the back grows into a close-up frame; the split along the back
 *    (measured once from the PNG: the dark crevice) is traced in yellow on both; "old exoskeleton (empty shell)";
 *    a card "the old shell is not stretched / it is shed and replaced by a new one".
 *  2 cicada_emerging large: "new shell still soft" (new body), "wings not yet hard" (wing, close-up frame of the wing),
 *    "old shell" (the old shell in the same picture).
 *  3 cicada_adult large: "new shell hardens", "wings spread"; pink numbered dots on the five visible legs (measured),
 *    the sixth is hidden by the body and only noted; "crabs and dragonflies also molt" with their unit-2 pictures.
 * Every step: cyan group pill (arthropod), yellow evidence label, orange "do not judge only by ___" label.
 * Bottom: three thumbnails (shell → just emerged → adult) joined by moving timeline arrows; the current one is lit.
 * Step changes (0.9 s): old step fades out, new fades in; the strip stays.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,fitRect,drawIn,MONO}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=4,PER=9;
const FRAME_BG='#16332b',PINK=C.pink,CYAN=C.cyan,ORANGE=C.orange,YELLOW=C.yellow,GREY='#a9b1ad';
const SH='cicada_shell.png',EM='cicada_emerging.png',AD='cicada_adult.png';

// ── layout (canvas px) ─────────────────────────────────────────────────────
const RX=600,RW=340;
const INS={x:RX,y:72,w:RW,h:200};
const SY=474,CW=170,CG=56,SX=20;          // thumbnail strip

// ── measured from the PNGs (image px) ──────────────────────────────────────
// shell: the split along the back = median of the dark crevice (alpha>200, luminance<50) every 8 px of x
const SPLIT=[[442,127],[450,127],[458,128],[466,129],[474,128],[482,131],[490,137],[498,141],[506,145],[514,151],[522,160],[530,172],[538,186]];
const SH_BODY=[470,520];                  // abdomen of the empty shell (opaque brown)
const CROP_SH=[396,90,190,112];           // close-up of the back
// emerging: new body (pale green, opaque), its wing, the old shell (brown, opaque)
const EM_NEW=[470,240],EM_WING=[600,420],EM_OLD=[300,560];
const CROP_WING=[445,330,212,125];
// adult: a point on each visible leg (tibia, opaque); the sixth leg (far-side hind leg) is hidden by the body
const AD_LEGS=[[135,360],[222,440],[290,335],[392,395],[525,355]];
const AD_BODY=[290,110],AD_WING=[690,190];

// ── labels added by this module (LAB has none for these) ───────────────────
const T={
 bodySch:P(`身體（示意）`,`Body (schematic)`),exoSch:P(`外骨骼（示意）`,`Exoskeleton (schematic)`),
 grow:P(`身體長大：`,`Body grows:`),full:P(`身體頂到殼了，殼沒有變大`,`The body fills the shell; the shell did not grow`),
 example:P(`實例：蟬蛻殼`,`Example: a cicada shell`),
 emptyShell:P(`舊的外骨骼（空殼）`,`Old exoskeleton (empty shell)`),backSplit:P(`背部裂開`,`Split along the back`),
 back:P(`背部`,`Back`),wing:P(`翅膀`,`Wing`),enlarged:P(`放大`,`enlarged`),
 shedIt:P(`而是脫掉舊的、換上新的`,`It is shed and replaced by a new one`),
 wingSoft:P(`翅膀還沒變硬`,`Wings not yet hard`),wingsOpen:P(`翅膀展開`,`Wings spread`),
 legs6:P(`6 隻腳：看得到 5 隻`,`6 legs: 5 can be seen`),hidden6:P(`第 6 隻被身體遮住`,`Leg 6 is hidden by the body`),
 alsoMolt:P(`蟹和蜻蜓長大也要蛻殼`,`Crabs and dragonflies also molt to grow`),
 notSame:P(`三張圖的樹枝不同：不是同一隻蟬的連續照片`,`The branches differ: not one cicada photographed over time`),
 marks:P(`粉紅點與虛線：程式標示（示意）`,`Dots and dashed lines: drawn in code (schematic)`),
 ev:[P(`外骨骼硬，不能拉長`,`the exoskeleton is hard and cannot stretch`),P(`背部裂開，留下空殼`,`the back splits and an empty shell is left`),
     P(`新殼顏色淡、還軟`,`the new shell is pale and still soft`),P(`新殼變硬、顏色變深`,`the new shell hardens and darkens`)],
 no:[P(`身體變大`,`the body getting bigger`),P(`外形像一隻蟬`,`looking like a cicada`),P(`已經爬出來`,`having crawled out`),P(`有沒有翅膀`,`having wings or not`)]
};
const HEAD=[['outgrown','外骨骼不會變大','The exoskeleton does not grow'],['molt','蛻殼','Molting'],['emerging','剛羽化','Just emerged'],['adult','成蟬','Adult cicada']];
const STRIP=[[SH,'shell','蟬蛻殼','Cicada shell'],[EM,'emerging','剛羽化','Just emerged'],[AD,'adult','成蟬','Adult cicada']];
const STRIP_OF=[0,0,1,2];

// ── text helpers (as in animals_draw_legs_1023_v1.js) ──────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
// box size of a fitText label (one line if it fits, otherwise wrapped; never shrunk)
function boxSize(c,p,maxW,size=22){const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  return{rows,w,h:rows.length*(size+7)+11};}
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22,dashedBorder=false}={}){
  const {rows,w,h}=boxSize(c,p,maxW,size),lh=size+7,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();c.beginPath();c.roundRect(bx,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(col,.85);c.lineWidth=2;if(dashedBorder)c.setLineDash([6,4]);c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
// lead from the edge of box b to (x, y)
function leadFrom(c,b,x,y,col){const cy=b.y+b.h/2;let x0=Math.max(b.x+10,Math.min(b.x+b.w-10,x)),y0=Math.max(b.y,Math.min(b.y+b.h,y));
  if(x0>b.x+10&&x0<b.x+b.w-10&&y0>b.y&&y0<b.y+b.h)y0=y<cy?b.y:b.y+b.h;
  if(x<b.x&&y>b.y+8&&y<b.y+b.h-8){x0=b.x;y0=y;}else if(x>b.x+b.w&&y>b.y+8&&y<b.y+b.h-8){x0=b.x+b.w;y0=y;}
  if(Math.hypot(x-x0,y-y0)>8)lead(c,x0,y0,x,y,col);}
// pink count marker, 22px number (dashed ring = not reached)
function count(c,x,y,n,a,r=15,dashedRing=false){if(a<=0)return;c.save();c.globalAlpha*=a;
  if(dashedRing){c.setLineDash([5,4]);circle(c,x,y,r,rgba(PINK,.12),PINK,2.2);c.setLineDash([]);}
  else{circle(c,x,y,r+3,rgba(C.deep,.7),null);circle(c,x,y,r,PINK,C.ink,2);}
  c.font=MONO(22);c.fillStyle=dashedRing?PINK:C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function zbox(c,b,t,a=1){if(a<=0)return;c.save();c.globalAlpha*=a;
  c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.strokeStyle=rgba(C.deep,.8);c.lineWidth=6;c.stroke();
  c.setLineDash([6,4]);c.lineDashOffset=-t*12;c.strokeStyle=YELLOW;c.lineWidth=2.6;c.stroke();c.restore();}
function cone(c,b,r,t,a=1){if(a<=0)return;
  const Ls=[[[b.x+b.w,b.y],[r.x,r.y]],[[b.x+b.w,b.y+b.h],[r.x,r.y+r.h]]];
  c.save();c.globalAlpha*=a;Ls.forEach(pts=>{line(c,pts,rgba(C.deep,.6),4.5);dashed(c,pts,rgba(YELLOW,.9),2,[7,6],-t*12);});c.restore();}
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
const mp=(r,f,ix,iy)=>{const [W,H]=dim(f);return[r.x+ix/W*r.w,r.y+iy/H*r.h];};
const boxOn=(r,f,cr)=>{const [W,H]=dim(f);return{x:r.x+cr[0]/W*r.w,y:r.y+cr[1]/H*r.h,w:cr[2]/W*r.w,h:cr[3]/H*r.h};};
const mi=(R,cr,ix,iy)=>[R.x+(ix-cr[0])/cr[2]*R.w,R.y+(iy-cr[1])/cr[3]*R.h];
function frame(c,f,cr,R,a){if(a<=0)return;const im=pic(src(f)),rad=Math.min(16,R.w*.08);c.save();c.globalAlpha*=a;
  c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,rad);c.fillStyle=FRAME_BG;c.fill();
  c.save();c.clip();if(im){c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,cr[0],cr[1],cr[2],cr[3],R.x,R.y,R.w,R.h);}c.restore();
  c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,rad);c.strokeStyle=rgba(C.white,.85);c.lineWidth=2.5;c.stroke();c.restore();}
function panelBox(c,R,a=1){if(a<=0)return;c.save();c.globalAlpha*=a;c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,16);c.fillStyle=FRAME_BG;c.fill();c.strokeStyle=rgba(C.white,.6);c.lineWidth=2;c.stroke();c.restore();}
function zoomChain(c,f,r,cr,tau,t){
  const b=boxOn(r,f,cr),g=smooth(clamp((tau-1)/.8));
  zbox(c,b,t,fade(tau,.5,.4));
  let R=null;if(tau>1){R=lerpR(b,INS,g);frame(c,f,cr,R,clamp((tau-1)/.15));}
  if(R)cone(c,b,R,t,clamp((tau-1.8)/.3));
  return R;
}
const capt=p=>P(`${p[0]}（${T.enlarged[0]}）`,`${p[1]} (${T.enlarged[1]})`);
// the split along the back, a yellow moving dashed trace
function splitTrace(c,pts,t,a,w=3){if(a<=0)return;c.save();c.globalAlpha*=a;c.lineCap='round';c.lineJoin='round';
  c.beginPath();pts.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=rgba(C.deep,.75);c.lineWidth=w+4;c.stroke();
  c.setLineDash([9,6]);c.lineDashOffset=-t*16;c.beginPath();pts.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=YELLOW;c.lineWidth=w;c.stroke();c.restore();}

// ── right column: evidence (yellow) and "do not judge only by" (orange) ───
function labelsAt(c,k,y,tau,t0=1.8){
  const evid=L('evidence','證據','Evidence'),ev=T.ev[k],no=L('notOnly','不能只看','Do not judge only by'),x=T.no[k];
  c.save();c.globalAlpha*=fade(tau,t0,.5);const e=fitText(c,P(`${evid[0]}：${ev[0]}`,`${evid[1]}: ${ev[1]}`),RX,y,RW,YELLOW);c.restore();
  c.save();c.globalAlpha*=fade(tau,t0+1,.5);const n=fitText(c,P(`${no[0]}「${x[0]}」`,`${no[1]} ${x[1]}`),RX,e.y+e.h+14,RW,ORANGE);c.restore();
  return n.y+n.h;
}
function header(c,k){
  const pl=fitText(c,L('arthropod','節肢動物','Arthropod'),20,12,300,CYAN,{active:true});
  text(c,L(...HEAD[k]),pl.x+pl.w+14,pl.y+pl.h/2+9,26,C.white);
}
const bob=t=>3*Math.sin(t*1.2);

// ── step 0: schematic shell and growing body ───────────────────────────────
const LV=[.58,.69,.8,.9,1];
function step0(c,tau,t,held){
  const gt=held?mod(tau,8.5):tau,GS=.6,GD=.95;
  let i=Math.max(0,Math.min(4,Math.floor((gt-GS)/GD)+1));if(gt<GS)i=0;
  const u=i===0?1:smooth(clamp((gt-GS-(i-1)*GD)/.35)),s=i===0?LV[0]:mix(LV[i-1],LV[i],u),isFull=i===4&&u>=1;
  const SX0=100,SY0=132,SW=400,SH0=220,WALL=10,cx=SX0+SW/2,cy=SY0+SH0/2;
  // schematic tag
  fitText(c,L('schematic','示意','Schematic'),24,70,160,C.muted,{dashedBorder:true});
  // shell (grey, hard edge), fill first
  c.save();c.beginPath();c.roundRect(SX0,SY0,SW,SH0,70);c.fillStyle=rgba(GREY,.13);c.fill();c.restore();
  // body (pink), grows one notch at a time
  const IW=SW-2*WALL-10,IH=SH0-2*WALL-10,bw=IW*s,bh=IH*s;
  c.save();c.beginPath();c.roundRect(cx-bw/2,cy-bh/2,bw,bh,Math.min(60,bh/2.2));c.fillStyle=rgba(PINK,.9);c.fill();c.strokeStyle=rgba('#ffd1e6',.9);c.lineWidth=2.5;c.stroke();
  c.clip();c.strokeStyle=rgba(C.ink,.22);c.lineWidth=2;for(let q=1;q<5;q++){const x=cx-bw/2+bw*q/5;c.beginPath();c.moveTo(x,cy-bh/2);c.lineTo(x,cy+bh/2);c.stroke();}c.restore();
  const bl=measure(c,T.bodySch,22)<=bw-24?T.bodySch:L('body','身體','Body');
  text(c,bl,cx,cy+8,22,C.ink,'center');
  // shell wall drawn over the body edge: dark under-stroke, grey hard edge, segment ticks
  const pulse=isFull?.5+.5*Math.sin(t*5):0;
  c.save();c.beginPath();c.roundRect(SX0,SY0,SW,SH0,70);c.strokeStyle=rgba(C.deep,.85);c.lineWidth=WALL+6;c.stroke();
  c.strokeStyle=GREY;c.lineWidth=WALL;c.stroke();
  if(isFull){c.strokeStyle=rgba(YELLOW,.35+.5*pulse);c.lineWidth=3;c.stroke();}
  c.strokeStyle=rgba('#e3e8e5',.55);c.lineWidth=2;c.beginPath();c.roundRect(SX0+WALL/2+2,SY0+WALL/2+2,SW-WALL-4,SH0-WALL-4,64);c.stroke();
  c.strokeStyle='#6f7774';c.lineWidth=3;for(let q=1;q<5;q++){const x=SX0+SW*q/5;[[SY0-4,SY0+WALL+3],[SY0+SH0-WALL-3,SY0+SH0+4]].forEach(([a,b])=>{c.beginPath();c.moveTo(x,a);c.lineTo(x,b);c.stroke();});}
  c.restore();
  // body pushes on the wall (yellow arrows) once it is full
  if(isFull){const pa=.55+.45*pulse;c.save();c.globalAlpha*=pa;
    for(const sgn of [-1,1]){K.arrow(c,cx+sgn*(bw/2-40),cy-40,cx+sgn*(bw/2-6),cy-40,YELLOW,3);K.arrow(c,cx+sgn*(bw/2-40),cy+40,cx+sgn*(bw/2-6),cy+40,YELLOW,3);}
    c.restore();}
  // exoskeleton label
  c.save();c.globalAlpha*=fade(tau,.3,.5);const xl=fitText(c,T.exoSch,300,68,290,C.white);leadFrom(c,xl,SX0+SW-90,SY0+2,C.white);c.restore();
  // growth counter: pink markers 1..5
  const gl=T.grow,gw=measure(c,gl,22),mx0=Math.max(40,cx-(gw+12+5*40)/2);
  text(c,gl,mx0,SY0+SH0+52,22,C.white);
  for(let q=0;q<5;q++){const x=mx0+gw+28+q*40,y=SY0+SH0+44;if(q<=i)count(c,x,y,q+1,q===i?1:.55);else count(c,x,y,q+1,1,15,true);}
  c.save();c.globalAlpha*=isFull?1:0;rowsOf(c,T.full,540).forEach((r,j)=>text(c,r,cx,SY0+SH0+94+j*28,22,YELLOW,'center'));c.restore();
  // right: the real example
  const R={x:RX,y:72,w:RW,h:224};panelBox(c,R);
  text(c,T.example,RX+16,R.y+34,22,C.white);
  const ir=fitRect(SH,RX+14,R.y+48,150,R.h-58),r={...ir,y:ir.y+bob(t)};drawIn(c,SH,r);
  c.save();c.globalAlpha*=fade(tau,.8,.5);const [ex,ey]=mp(r,SH,...SH_BODY);const eb=fitText(c,L('exoskeleton','外骨骼','Exoskeleton'),RX+RW-12,R.y+120,170,C.white,{align:'right'});leadFrom(c,eb,ex,ey,C.white);c.restore();
  labelsAt(c,0,R.y+R.h+16,tau,1.2);
}

// ── step 1: the empty shell, split along the back ──────────────────────────
function step1(c,tau,t){
  const r0=fitRect(SH,20,66,300,396),r={...r0,y:r0.y+bob(t)};
  drawIn(c,SH,r);
  const R=zoomChain(c,SH,r,CROP_SH,tau,t);
  splitTrace(c,SPLIT.map(p=>mp(r,SH,...p)),t,fade(tau,2,.5),2.6);
  if(R){const sa=fade(tau,1.9,.5);splitTrace(c,SPLIT.map(p=>mi(R,CROP_SH,...p)),t,sa,4);
    c.save();c.globalAlpha*=sa;
    fitText(c,capt(T.back),R.x+8,R.y+8,R.w-16,C.white);
    const sp=fitText(c,T.backSplit,R.x+R.w-8,R.y+R.h-48,R.w-16,YELLOW,{align:'right'});const [qx,qy]=mi(R,CROP_SH,...SPLIT[9]);lead(c,sp.x+sp.w/2,sp.y,qx,qy+6,YELLOW);
    c.restore();}
  // old exoskeleton (empty shell)
  c.save();c.globalAlpha*=fade(tau,.8,.5);const [bx,by]=mp(r,SH,...SH_BODY);const eb=fitText(c,T.emptyShell,334,180,248,C.white);leadFrom(c,eb,bx,by,C.white);c.restore();
  // key idea card
  c.save();c.globalAlpha*=fade(tau,3.2,.6);
  const w=258,x=330,r1=rowsOf(c,L('notStretch','不是把舊殼拉大','The old shell is not stretched'),w-28,22),r2=rowsOf(c,T.shedIt,w-28,22),lh=30,h=(r1.length+r2.length)*lh+30,y=Math.min(300,458-h);
  D.round(c,x,y,w,h,16,'rgba(11,26,21,.92)',null);c.save();c.beginPath();c.roundRect(x,y,w,h,16);c.strokeStyle=rgba(YELLOW,.85);c.lineWidth=2;c.stroke();c.restore();
  r1.forEach((s,j)=>text(c,s,x+14,y+34+j*lh,22,C.white));r2.forEach((s,j)=>text(c,s,x+14,y+40+(r1.length+j)*lh,22,YELLOW));
  c.restore();
  labelsAt(c,1,INS.y+INS.h+18,tau,2.2);
}

// ── step 2: just emerged ───────────────────────────────────────────────────
function step2(c,tau,t){
  const r0=fitRect(EM,20,66,340,396),r={...r0,y:r0.y+bob(t)};
  drawIn(c,EM,r);
  const R=zoomChain(c,EM,r,CROP_WING,tau,t);
  if(R){c.save();c.globalAlpha*=fade(tau,2,.5);fitText(c,capt(T.wing),R.x+8,R.y+8,R.w-16,C.white);c.restore();}
  c.save();c.globalAlpha*=fade(tau,.7,.5);const [nx,ny]=mp(r,EM,...EM_NEW);const nb=fitText(c,L('softNew','新殼還軟','New shell still soft'),380,92,202,YELLOW);leadFrom(c,nb,nx,ny,YELLOW);c.restore();
  c.save();c.globalAlpha*=fade(tau,1.2,.5);const [wx,wy]=mp(r,EM,...EM_WING);const wb=fitText(c,T.wingSoft,380,236,202,YELLOW);leadFrom(c,wb,wx,wy,YELLOW);c.restore();
  c.save();c.globalAlpha*=fade(tau,1.6,.5);const [ox,oy]=mp(r,EM,...EM_OLD);const ob=fitText(c,L('oldShell','舊殼','Old shell'),26,402,160,C.white);leadFrom(c,ob,ox,oy,C.white);c.restore();
  labelsAt(c,2,INS.y+INS.h+18,tau,2.4);
}

// ── step 3: adult ──────────────────────────────────────────────────────────
function step3(c,tau,t){
  const r0=fitRect(AD,20,66,560,396),r={...r0,y:r0.y+bob(t)};
  drawIn(c,AD,r);
  c.save();c.globalAlpha*=fade(tau,.6,.5);const [hx,hy]=mp(r,AD,...AD_BODY);const hb=fitText(c,L('hardNew','新殼變硬','New shell hardens'),24,70,260,YELLOW);leadFrom(c,hb,hx,hy,YELLOW);c.restore();
  c.save();c.globalAlpha*=fade(tau,1,.5);const [wx,wy]=mp(r,AD,...AD_WING);const wb=fitText(c,T.wingsOpen,578,398,200,YELLOW,{align:'right'});leadFrom(c,wb,wx,wy,YELLOW);c.restore();
  AD_LEGS.forEach((p,i)=>{const [x,y]=mp(r,AD,...p),t0=1.4+i*.35,a=fade(tau,t0,.3);if(a<=0)return;
    if(tau-t0<1.2){c.save();c.globalAlpha*=a;K.pulse(c,x,y,t*1.6,PINK,15);c.restore();}count(c,x,y,i+1,a);});
  // right column
  let y=labelsAt(c,3,72,tau,.8)+14;
  const la=fade(tau,1.4+5*.35,.4);
  c.save();c.globalAlpha*=la;const lp=fitText(c,T.legs6,RX,y,RW,PINK,{active:true});y=lp.y+lp.h+10;
  const hp=fitText(c,T.hidden6,RX,y,RW,PINK,{dashedBorder:true});y=hp.y+hp.h+16;c.restore();
  c.save();c.globalAlpha*=fade(tau,3.6,.5);
  const rows=rowsOf(c,T.alsoMolt,RW);rows.forEach((s,j)=>text(c,s,RX,y+22+j*28,22,C.white));y+=rows.length*28+12;
  c.restore();
  c.save();c.globalAlpha*=fade(tau,2.2,.5);rowsOf(c,T.marks,RW).forEach((s,j)=>text(c,s,RX,y+22+j*28,22,C.muted));c.restore();
}
const STEPS=[step0,step1,step2,step3];

// ── thumbnail strip with timeline arrows ───────────────────────────────────
function strip(c,k,t){
  const cur=STRIP_OF[k];
  for(let i=0;i<3;i++){const x=SX+i*(CW+CG),on=i===cur;
    if(on){c.save();glow(c,x+CW/2,SY+46,80,CYAN,.16+.06*Math.sin(t*2));c.restore();}
    D.round(c,x,SY,CW,116,12,on?'rgba(85,233,255,.12)':'rgba(11,26,21,.55)',null);
    c.save();c.beginPath();c.roundRect(x,SY,CW,116,12);c.strokeStyle=on?CYAN:rgba(C.edge,.9);c.lineWidth=on?3:1.5;c.stroke();c.restore();
    K.place(c,STRIP[i][0],x+8,SY+6+(on?1.5*Math.sin(t*1.8):0),CW-16,76,{alpha:on?1:.42});
    text(c,L(STRIP[i][1],STRIP[i][2],STRIP[i][3]),x+CW/2,SY+106,22,on?C.white:C.muted,'center');
    if(i<2){const x1=x+CW+6,x2=x+CW+CG-6,y=SY+46;
      line(c,[[x1,y],[x2-10,y]],rgba(C.deep,.8),6);dashed(c,[[x1,y],[x2-12,y]],C.white,2.5,[6,5],-t*14);K.arrow(c,x2-14,y,x2,y,C.white,2.5);
      const q=mod(t*.6+i*.5);c.save();c.globalAlpha*=Math.sin(q*Math.PI);circle(c,mix(x1,x2-8,q),y,4.5,C.white,null);c.restore();}}
  const nx=SX+3*CW+2*CG+22,nw=940-nx;
  rowsOf(c,T.notSame,nw).forEach((s,j,a)=>text(c,s,nx,SY+58-(a.length-1)*14+j*28,22,C.muted));
}

// ── one step's whole picture ──────────────────────────────────────────────
function scene(c,k,tau,t,a,held){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  STEPS[k](c,tau,t,held);
  header(c,k);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),940,40,22,C.muted,'right');
  c.restore();
}

function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.ml||(s.ml={});
  if(st.k===undefined||st.held!==held){st.k=k;st.from=-1;st.T=t-9;st.held=held;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut,held);
  scene(c,k,tau,t,cross?aIn:1,held);
  strip(c,k,t);
}
window.AnimalsDraw.molt=draw;
})();

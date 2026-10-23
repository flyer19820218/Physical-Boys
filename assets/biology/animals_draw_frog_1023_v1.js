/* Animals · "Life of a frog: gills to lungs" canvas (vertebrates tab, view 1), 2026-10-23.
 * Five steps (AN5b, AI teaching illustrations, all facing right, never mirrored):
 *  0 eggs (frog_egg.png)       breathing: no gills, no lungs, through the egg membrane   habitat: water
 *  1 tadpole (tadpole_1.png)   gills, water flows over them                              water
 *  2 hind legs (tadpole_2.png) gills shrink, lungs begin to grow                         water
 *  3 fore legs (froglet.png)   lungs take over, gills gone, tail shorter                 water with a shore
 *  4 adult (frog_adult.png)    lungs + moist skin                                        water's edge / land
 * Every step:
 *   header: cyan "Amphibians" pill + step name; "AI illustration, not a photo" top right;
 *   orange filled pill "Do not judge only by ___" with a white note;
 *   left: the stage large on a two-colour habitat block (blue water, sand land), labels on the picture placed by the
 *     program (the picture is drawn once off-screen; each label takes the free spot with the fewest opaque pixels);
 *   right: breathing card (gill / lung icons drawn as in animals_draw_swim_1023_v1.js, egg-membrane and skin icons,
 *     "schematic") and a body-shape card;
 *   one yellow evidence label and a pink "sizes are schematic" note;
 *   bottom: a five-stage timeline strip (pink line and dots), thumbnails at one shared scale (sizes from the PNG
 *     pixel sizes in AnimalsKit.SIZE), current lit, seen dimmer, unseen dimmest.
 *   End of step 4: closing card "gills → lungs", "Amphibians: young use gills, adults use lungs", a gill→lung arrow
 *     over the strip.
 * Points on the pictures were measured once from the PNG alpha (all inside the opaque body).
 * Step changes (0.9 s): old step fades out, the new one fades in; the strip stays.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,fitRect,drawIn}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=5,PER=10,CONCL=6.5;
const FRAME_BG='#16332b',PINK=C.pink,CYAN=C.cyan,ORANGE=C.orange,YELLOW=C.yellow;
const WATER_BG='#1d5f7d',LAND_BG='#6f5f3c',SHORE='#a08a5a';

// ── layout (canvas px) ─────────────────────────────────────────────────────
const TRAP_Y=60;
const HERO={x:16,y:108,w:540,h:302};
const PX=572,PW=372;
const R1={x:PX,y:108,w:PW,h:236},R2={x:PX,y:352,w:PW,h:60};
const EVY=420;
const CELL=164,GAP=12,SX=(960-(5*CELL+4*GAP))/2,SY=470,SH=122,GROUND=SY+68,TL_Y=SY+80;

// ── pictures and points measured from the PNGs (image px, alpha 255 at every point) ──
const FE='frog_egg.png',T1='tadpole_1.png',T2='tadpole_2.png',FL='froglet.png',FA='frog_adult.png';
const FILES=[FE,T1,T2,FL,FA];
const PT={egg:[45,75],gill1:[262,70],tail1:[90,52],hind:[290,175],tail2:[110,95],gill2:[392,100],fore:[330,228],tail3:[50,150],skin:[250,112],lung:[390,190]};
// land block width per step (0 = all water)
const LANDW=[0,0,0,120,350];
// picture boxes inside the hero (fitted, centred)
const BOX=[{x:120,y:172,w:320,h:228},{x:46,y:200,w:470,h:170},{x:30,y:182,w:500,h:216},{x:28,y:172,w:378,h:228},{x:208,y:152,w:342,h:252}];
// one shared scale for the strip (size from the PNG pixel size)
const TS=Math.min((CELL-24)/dim(FA)[0],60/dim(FA)[1]);

// ── labels added by this module (LAB has eggs, tadpole, froglet, adult frog, gills, lungs, tail …) ──
const T={
 life:P(`蛙的一生`,`Life of a frog`),
 hindTad:P(`長後腿的蝌蚪`,`Tadpole with hind legs`),foreFrog:P(`長前腿的幼蛙`,`Froglet with fore legs`),
 tBreath:P(`呼吸`,`Breathing`),tBody:P(`外形`,`Body`),
 membrane:P(`卵膜`,`Membrane`),gillShrink:P(`鰓變小`,`Gills shrink`),lungGrow:P(`肺發育中`,`Lungs grow`),gillGone:P(`鰓消失`,`Gills gone`),skin:P(`皮膚`,`Skin`),
 b0:P(`沒有鰓、沒有肺：透過卵膜`,`No gills, no lungs: through the membrane`),
 b1:P(`鰓：水流過鰓`,`Gills: water flows over them`),
 b2:P(`鰓逐漸退化，肺開始發育`,`Gills shrink, lungs begin to grow`),
 b3:P(`以肺為主，鰓消失`,`Mainly lungs; the gills are gone`),
 b4:P(`肺＋濕潤的皮膚輔助`,`Lungs, helped by moist skin`),
 s0:P(`一團卵，外包膠質`,`A clump of eggs in jelly`),s1:P(`有尾巴，沒有腳`,`A tail, no legs`),s2:P(`長出後腿，尾巴還在`,`Hind legs; the tail is still there`),
 s3:P(`長出前腿，尾巴縮短`,`Fore legs; the tail is shorter`),s4:P(`四條腿，沒有尾巴`,`Four legs, no tail`),
 water:P(`水中`,`In water`),land:P(`水邊／陸地`,`Water's edge / land`),
 lEgg:P(`卵膜（膠質）`,`Membrane (jelly)`),lGill:P(`鰓（體內，示意）`,`Gills (inside, schematic)`),lHind:P(`後腿`,`Hind leg`),lFore:P(`前腿`,`Fore leg`),
 lTailShort:P(`尾巴縮短`,`Shorter tail`),lSkin:P(`濕潤的皮膚`,`Moist skin`),lLung:P(`肺（體內，示意）`,`Lungs (inside, schematic)`),
 trap0:P(`生在水中`,`living in water`),trap1:P(`外形像魚`,`looking like a fish`),trap2:P(`有沒有尾巴`,`whether it has a tail`),
 trap3:P(`有沒有四條腿`,`whether it has four legs`),trap4:P(`成蛙的樣子`,`the adult alone`),
 note0:P(`魚卵也在水中，要看牠長大的樣子`,`Fish eggs are in water too; watch it grow`),
 note1:P(`蝌蚪看起來像魚，但不是魚`,`A tadpole looks like a fish, but it is not a fish`),
 note2:P(`還有尾巴，已經長出後腿`,`Still a tail, yet hind legs have grown`),
 note3:P(`四條腿都有了，還帶著短尾巴`,`All four legs, yet still a short tail`),
 note4:P(`要看一生：幼體與成體不一樣`,`Look at the whole life: young and adult differ`),
 ev0:P(`卵透過卵膜和水交換氣體`,`gases pass through the egg membrane`),
 ev1:P(`蝌蚪用鰓呼吸`,`a tadpole breathes with gills`),
 ev2:P(`鰓逐漸退化，肺開始發育`,`gills shrink, lungs begin to grow`),
 ev3:P(`肺為主，鰓消失`,`mainly lungs, gills gone`),
 ev4:P(`幼體用鰓，成體用肺`,`gills when young, lungs as an adult`),
 sizeNote:P(`縮圖大小為示意`,`Sizes: schematic`),
 young:P(`幼體（蝌蚪）`,`Young (tadpole)`),grown:P(`成體（成蛙）`,`Adult (frog)`),
 cTitle:P(`一生的呼吸器官`,`Breathing organs over a life`),
 cRule:P(`幼體用鰓、成體用肺`,`young use gills, adults use lungs`),
 cSkin:P(`成蛙的濕潤皮膚也幫忙交換氣體`,`The adult's moist skin also helps with gas exchange`),
 gillToLung:P(`鰓 → 肺`,`Gills → lungs`)
};
const lab=(k,zh,en)=>L(k,zh,en);
const NAMES=()=>[lab('egg','卵','Eggs'),lab('tadpole','蝌蚪','Tadpole'),T.hindTad,T.foreFrog,lab('adultFrog','成蛙','Adult frog')];
const SHORT=()=>[lab('egg','卵','Eggs'),lab('tadpole','蝌蚪','Tadpole'),lab('hindLegs','長後腿','Hind legs'),lab('froglet','幼蛙','Froglet'),lab('adultFrog','成蛙','Adult frog')];
const STEP=[
 {trap:T.trap0,note:T.note0,breath:T.b0,body:T.s0,ev:T.ev0},
 {trap:T.trap1,note:T.note1,breath:T.b1,body:T.s1,ev:T.ev1},
 {trap:T.trap2,note:T.note2,breath:T.b2,body:T.s2,ev:T.ev2},
 {trap:T.trap3,note:T.note3,breath:T.b3,body:T.s3,ev:T.ev3},
 {trap:T.trap4,note:T.note4,breath:T.b4,body:T.s4,ev:T.ev4}];
// labels on the picture: [text, point key, colour]
const TAGS=[
 [[T.lEgg,'egg']],
 [[T.lGill,'gill1'],[lab('tail','尾巴','Tail'),'tail1']],
 [[T.lHind,'hind'],[lab('tail','尾巴','Tail'),'tail2']],
 [[T.lFore,'fore'],[T.lTailShort,'tail3']],
 [[T.lSkin,'skin'],[T.lLung,'lung']]];

// ── text helpers (as in animals_draw_swim_1023_v1.js) ──────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
// fitText: a label in a dark rounded box, measured first; one line if it fits in maxW, otherwise wrapped (never shrunk).
function boxOf(c,p,maxW,size=22){const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7;return{rows,w,h:rows.length*lh+11,lh};}
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22,border=null,textCol=null}={}){
  const {rows,w,h,lh}=boxOf(c,p,maxW,size),bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();c.beginPath();c.roundRect(bx,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(border||col,.85);c.lineWidth=2;c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:(textCol||col),'center'));
  return{x:bx,y,w,h};
}
const withA=(c,a,fn)=>{if(a<=0)return;c.save();c.globalAlpha*=a;fn();c.restore();};
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
function leadFrom(c,b,x,y,col){let x0=Math.max(b.x+10,Math.min(b.x+b.w-10,x)),y0=y<b.y+b.h/2?b.y:b.y+b.h;
  if(x<b.x&&y>b.y+8&&y<b.y+b.h-8){x0=b.x;y0=y;}else if(x>b.x+b.w&&y>b.y+8&&y<b.y+b.h-8){x0=b.x+b.w;y0=y;}
  if(Math.hypot(x-x0,y-y0)>8)lead(c,x0,y0,x,y,col);}
const mp=(r,f,ix,iy)=>{const [W,H]=dim(f);return[r.x+ix/W*r.w,r.y+iy/H*r.h];};
function cardBox(c,R,a=1){withA(c,a,()=>{c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.fillStyle=FRAME_BG;c.fill();c.strokeStyle=rgba(C.white,.7);c.lineWidth=2;c.stroke();});}

// ── icons drawn in code (schematic); gill and lung exactly as in the swim view ──
const GILL='#e2556b',LUNG='#f08aa0',WATER='#7dd3fc',SKIN='#8fa45a';
function gillIcon(c,x,y,w,h,t){
  const top=y+h*.08,bot=y+h*.92,mid=(top+bot)/2;
  for(let i=0;i<3;i++){const ax=x+w*(.28+i*.2),bow=w*.07;
    c.save();c.lineCap='round';
    for(let j=1;j<=7;j++){const u=j/8,py=mix(top,bot,u),px=ax-bow*Math.sin(u*Math.PI),len=w*.12*(.55+.45*Math.sin(u*Math.PI));
      line(c,[[px,py],[px+len,py]],GILL,2.4);}
    c.beginPath();c.moveTo(ax,top);c.quadraticCurveTo(ax-bow*2,mid,ax,bot);c.strokeStyle='#efe4c8';c.lineWidth=4;c.stroke();c.restore();}
  for(let k=0;k<6;k++){const u=mod(t*.35+k/6),py=mix(top+6,bot-6,((k*37)%6)/5);c.save();c.globalAlpha*=Math.sin(u*Math.PI);
    circle(c,x+u*w,py,3.2,WATER,null);c.restore();}
}
function lungIcon(c,x,y,w,h,t){
  const cx=x+w/2,br=1+.06*Math.sin(t*2.2),ry=h*.36*br,rx=Math.min(w*.2,h*.3)*br,ly=y+h*.6;
  c.save();c.lineCap='round';
  [-1,1].forEach(s=>{const lx=cx+s*(rx+3);ellipse(c,lx,ly,rx,ry,rgba(LUNG,.9),'#ffd1dc',2);
    line(c,[[cx,y+h*.36],[lx,ly-ry*.35]],'#efe4c8',3);
    line(c,[[lx,ly-ry*.35],[lx+s*rx*.45,ly+ry*.1]],rgba('#8f2d45',.8),2);line(c,[[lx,ly-ry*.35],[lx-s*rx*.2,ly+ry*.45]],rgba('#8f2d45',.8),2);});
  line(c,[[cx,y+2],[cx,y+h*.36]],'#efe4c8',4.5);
  c.restore();
}
// egg: a jelly membrane round a dark embryo; water dots cross the membrane in and out
function eggIcon(c,x,y,w,h,t){
  const cx=x+w/2,cy=y+h/2,R=Math.min(w,h)*.42;
  circle(c,cx,cy,R,'rgba(226,238,240,.22)','#e8f1f2',3);
  circle(c,cx,cy,R*.45,'#2b2a26','#5a5a50',2);
  for(let k=0;k<8;k++){const ang=k/8*Math.PI*2+.3,u=mod(t*.4+k*.37),inw=k%2===0,d=inw?mix(R*1.45,R*.6,u):mix(R*.6,R*1.45,u);
    c.save();c.globalAlpha*=Math.sin(u*Math.PI);circle(c,cx+d*Math.cos(ang),cy+d*Math.sin(ang),3.2,inw?WATER:'#e8f1f2',null);c.restore();}
}
// skin: a moist wavy layer with a thin blood vessel underneath; dots pass through it
function skinIcon(c,x,y,w,h,t){
  const top=y+h*.38,th=h*.24;
  c.save();c.beginPath();c.moveTo(x,top);for(let i=0;i<=20;i++){const xx=x+i/20*w;c.lineTo(xx,top+3*Math.sin(i*.9+t*1.5));}
  c.lineTo(x+w,top+th);c.lineTo(x,top+th);c.closePath();c.fillStyle=rgba(SKIN,.9);c.fill();c.strokeStyle='#cfe0a0';c.lineWidth=2;c.stroke();c.restore();
  line(c,[[x+4,top+th+12],[x+w-4,top+th+12]],GILL,3);
  for(let k=0;k<5;k++){const u=mod(t*.35+k/5),px=x+w*(.12+k*.19);c.save();c.globalAlpha*=Math.sin(u*Math.PI);
    circle(c,px,mix(y+4,top+th+10,u),3,WATER,null);c.restore();}
  for(let k=0;k<4;k++){const u=mod(t*.5+k/4);c.save();c.globalAlpha*=.6*Math.sin(u*Math.PI);circle(c,x+w*(.2+k*.2),top-6-u*8,2.2,'#e8f1f2',null);c.restore();}
}

// ── habitat blocks (water / land) with moving bubbles and ripples ──────────
function habitat(c,k,t){
  const lw=LANDW[k],wx=HERO.x,ww=HERO.w-lw,top=HERO.y,h=HERO.h;
  c.save();c.beginPath();c.roundRect(HERO.x,top,HERO.w,h,16);c.clip();
  const g=c.createLinearGradient(0,top,0,top+h);g.addColorStop(0,rgba(WATER_BG,.75));g.addColorStop(1,rgba('#0f3a52',.9));
  c.fillStyle=g;c.fillRect(wx,top,ww,h);
  if(lw){const lx=HERO.x+ww;c.fillStyle=rgba(LAND_BG,.9);c.beginPath();c.moveTo(lx+28,top);c.lineTo(HERO.x+HERO.w,top);c.lineTo(HERO.x+HERO.w,top+h);c.lineTo(lx-18,top+h);c.quadraticCurveTo(lx-6,top+h*.5,lx+28,top);c.fill();
    c.strokeStyle=SHORE;c.lineWidth=3;c.beginPath();c.moveTo(lx-18,top+h);c.quadraticCurveTo(lx-6,top+h*.5,lx+28,top);c.stroke();}
  // ripples on the water
  for(let j=0;j<3;j++){const yy=top+60+j*80;c.beginPath();for(let i=0;i<=40;i++){const xx=wx+i/40*ww;c.lineTo(xx,yy+3*Math.sin(i*.6+t*1.6+j));}
    c.strokeStyle=rgba('#a5e3fb',.18);c.lineWidth=2;c.stroke();}
  // bubbles rising
  const rr=K.rng(7+k);for(let i=0;i<9;i++){const bx=wx+20+rr()*(ww-40),sp=.12+rr()*.1,u=mod(t*sp+rr()),by=top+h-10-u*(h-20);
    c.save();c.globalAlpha*=Math.sin(u*Math.PI)*.7;circle(c,bx+4*Math.sin(t*2+i),by,2.5+rr()*2.5,null,'#bfeaff',1.6);c.restore();}
  c.restore();
  c.save();c.beginPath();c.roundRect(HERO.x,top,HERO.w,h,16);c.strokeStyle=rgba(C.edge,.9);c.lineWidth=2;c.stroke();c.restore();
}
function habPill(c,p,x,y,border,align='left'){return fitText(c,p,x,y,300,C.white,{border,textCol:C.white,align});}
function habLabels(c,k){
  const lw=LANDW[k],out=[habPill(c,T.water,HERO.x+12,HERO.y+10,WATER)];
  if(lw)out.push(habPill(c,T.land,HERO.x+HERO.w-12,HERO.y+10,SHORE,'right'));
  return out;}
const habRects=(c,k)=>{const r=[{x:HERO.x+12,y:HERO.y+10,w:boxOf(c,T.water,300).w,h:40}];
  if(LANDW[k]){const w=boxOf(c,T.land,300).w;r.push({x:HERO.x+HERO.w-12-w,y:HERO.y+10,w,h:40});}return r;};

// ── labels on the picture: free spot with the fewest opaque pixels ─────────
const PLACE={};
function placeLabels(c,k,r,tags){
  const key=k+'|'+D.tr(P('z','e'));if(PLACE[key])return PLACE[key];
  const W=960,H=600,off=document.createElement('canvas');off.width=W;off.height=H;const g=off.getContext('2d');
  const im=pic(src(FILES[k]));let ok=!!im;
  if(im){g.drawImage(im,r.x-6,r.y-8,r.w+12,r.h+16);g.drawImage(im,r.x,r.y,r.w,r.h);}
  g.fillStyle='#fff';g.fillRect(0,0,W,HERO.y+6);g.fillRect(0,HERO.y+HERO.h-6,W,H);g.fillRect(0,0,HERO.x+6,H);g.fillRect(HERO.x+HERO.w-6,0,W,H);
  habRects(c,k).forEach(b=>g.fillRect(b.x-6,b.y-6,b.w+12,b.h+12));
  const al=g.getImageData(0,0,W,H).data,I=new Float64Array((W+1)*(H+1));
  for(let y=0;y<H;y++){let s=0;for(let x=0;x<W;x++){s+=al[(y*W+x)*4+3]>40?1:0;I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+s;}}
  const sum=(x,y,w,h)=>I[(y+h)*(W+1)+x+w]-I[y*(W+1)+x+w]-I[(y+h)*(W+1)+x]+I[y*(W+1)+x];
  const out=[],taken=[];
  for(const tg of tags){const bs=boxOf(c,tg.p,tg.maxW),bw=Math.ceil(bs.w),bh=Math.ceil(bs.h);let best=null;const [tx,ty]=tg.to;
    for(let y=HERO.y+6;y+bh<=HERO.y+HERO.h-6;y+=3)for(let x=HERO.x+6;x+bw<=HERO.x+HERO.w-6;x+=3){
      let cost=sum(x,y,bw,bh)*3;
      for(const o of taken){const ox=Math.min(x+bw,o.x+o.w)-Math.max(x,o.x)+12,oy=Math.min(y+bh,o.y+o.h)-Math.max(y,o.y)+12;if(ox>0&&oy>0)cost+=1e6;}
      const dx=Math.max(x-tx,0,tx-(x+bw)),dy=Math.max(y-ty,0,ty-(y+bh)),d=Math.hypot(dx,dy);cost+=d*5+(d<16?400:0);
      if(!best||cost<best.cost)best={x,y,w:bw,h:bh,cost};}
    taken.push(best);out.push({...tg,x:best.x,y:best.y});}
  if(ok)PLACE[key]=out;return out;}

// ── header, "do not judge only by", evidence ───────────────────────────────
function header(c,k){
  const pl=fitText(c,lab('amphibian','兩生類','Amphibians'),20,12,300,CYAN,{active:true});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),room=940-measure(c,ai,22)-24-(pl.x+pl.w+14);
  let n=P(`${T.life[0]}：${NAMES()[k][0]}`,`${T.life[1]}: ${NAMES()[k][1]}`);if(measure(c,n,26)>room)n=NAMES()[k];
  text(c,n,pl.x+pl.w+14,pl.y+pl.h/2+9,26,C.white);
  text(c,ai,940,40,22,C.muted,'right');
}
function trapRow(c,k,tau,t){
  const S=STEP[k],no=L('notOnly','不能只看','Do not judge only by');
  withA(c,fade(tau,.4,.5),()=>{
    const pb=fitText(c,P(`${no[0]}「${S.trap[0]}」`,`${no[1]} ${S.trap[1]}`),20,TRAP_Y,560,ORANGE,{active:true,size:24});
    c.save();c.globalAlpha*=.35+.35*Math.sin(t*3);D.round(c,pb.x-4,pb.y-4,pb.w+8,pb.h+8,(pb.h+8)/2,null,ORANGE);c.restore();
    withA(c,fade(tau,.9,.5),()=>{const x0=pb.x+pb.w+18,w=940-x0,rows=rowsOf(c,S.note,w,22);
      const y0=pb.y+pb.h/2+8-(rows.length-1)*13;rows.forEach((r,i)=>text(c,r,x0,y0+i*26,22,C.white));});
  });
}
function bottomRow(c,k,tau){
  const sp=boxOf(c,T.sizeNote,320);
  withA(c,fade(tau,.6,.5),()=>fitText(c,T.sizeNote,944,EVY,320,PINK,{align:'right'}));
  const e=L('evidence','證據','Evidence'),v=STEP[k].ev;
  withA(c,fade(tau,3.4,.5),()=>fitText(c,P(`${e[0]}：${v[0]}`,`${e[1]}: ${v[1]}`),16,EVY,944-16-sp.w-16,YELLOW));
}

// ── right side: breathing card and body card ───────────────────────────────
function breathCard(c,k,tau,t){
  withA(c,fade(tau,1,.5),()=>{cardBox(c,R1);
    text(c,T.tBreath,R1.x+14,R1.y+30,22,C.muted);
    text(c,L('schematic','示意','Schematic'),R1.x+R1.w-14,R1.y+30,22,C.muted,'right');
    const iy=R1.y+42,ih=86,half=(R1.w-24)/2,lx=R1.x+12,rx=R1.x+12+half,ly=iy+ih+24;
    const one=(fn,lp,x,w,a=1,col=C.white)=>{withA(c,a,()=>fn(c,x+w/2-60,iy,120,ih,t));text(c,lp,x+w/2,ly,22,col,'center');};
    if(k===0)one(eggIcon,T.membrane,R1.x,R1.w);
    else if(k===1)one(gillIcon,lab('gills','鰓','Gills'),R1.x,R1.w);
    else{
      const gA=k===2?.55:.14,gL=k===2?T.gillShrink:k===3?T.gillGone:lab('lungs','肺','Lungs');
      if(k<4){withA(c,gA,()=>gillIcon(c,lx+half/2-50,iy+(k===2?10:14),100,ih-(k===2?20:28),t));text(c,gL,lx+half/2,ly,22,k===2?C.white:C.muted,'center');
        if(k===3){c.save();c.setLineDash([6,5]);D.round(c,lx+half/2-56,iy+4,112,ih-8,12,null,rgba(C.muted,.6));c.restore();}}
      else{lungIcon(c,lx+half/2-55,iy,110,ih,t);text(c,gL,lx+half/2,ly,22,C.white,'center');}
      K.arrow(c,R1.x+R1.w/2-12,iy+ih/2,R1.x+R1.w/2+12,iy+ih/2,YELLOW,3);
      if(k<4){const sc=k===2?.62:1,w=110*sc,h=ih*sc;lungIcon(c,rx+half/2-w/2,iy+(ih-h),w,h,t);text(c,k===2?T.lungGrow:lab('lungs','肺','Lungs'),rx+half/2,ly,22,C.white,'center');}
      else{skinIcon(c,rx+half/2-60,iy,120,ih,t);text(c,T.skin,rx+half/2,ly,22,C.white,'center');}
    }
    rowsOf(c,STEP[k].breath,R1.w-28,24).forEach((r,i)=>text(c,r,R1.x+14,R1.y+192+i*28,24,C.white));
  });
}
function bodyCard(c,k,tau){
  withA(c,fade(tau,1.8,.5),()=>{cardBox(c,R2);const tw=measure(c,T.tBody,22),x0=R2.x+14+tw+14,rows=rowsOf(c,STEP[k].body,R2.x+R2.w-12-x0,22);
    const cy=R2.y+R2.h/2;text(c,T.tBody,R2.x+14,cy+8,22,C.muted);
    rows.forEach((r,i)=>text(c,r,x0,cy+8-(rows.length-1)*13+i*26,22,C.white));});
}

// ── the hero picture with its labels ───────────────────────────────────────
const bob=t=>3*Math.sin(t*1.2);
function heroRect(k){const b=BOX[k];return fitRect(FILES[k],b.x,b.y,b.w,b.h);}
function hero(c,k,tau,t){
  const f=FILES[k],r0=heroRect(k),sway=(k===1||k===2)?5*Math.sin(t*.9):0,dy=bob(t),r={...r0,x:r0.x+sway,y:r0.y+dy};
  withA(c,fade(tau,0,.6),()=>drawIn(c,f,r));
  const tags=TAGS[k].map(([p,key],i)=>({p,to:mp(r0,f,...PT[key]),key,t0:2.4+i*.5,maxW:230}));
  const placed=placeLabels(c,k,r0,tags);
  placed.forEach(o=>withA(c,fade(tau,o.t0,.5),()=>{const b=fitText(c,o.p,o.x,o.y,o.maxW,C.white);const [px,py]=o.to;
    leadFrom(c,b,px+sway,py+dy,C.white);
    if(/gill|lung/.test(o.key)){c.save();c.setLineDash([4,3]);c.lineDashOffset=-t*10;circle(c,px+sway,py+dy,13,null,C.white,2.2);c.restore();}}));
}

// ── closing (end of the adult step) ────────────────────────────────────────
function closing(c,a,t){withA(c,a,()=>{
  const x=40,y=72,w=880,h=356;
  D.round(c,x,y,w,h,18,'rgba(11,26,21,.95)',null);
  c.save();c.beginPath();c.roundRect(x,y,w,h,18);c.strokeStyle=YELLOW;c.lineWidth=3;c.stroke();c.restore();
  text(c,T.cTitle,480,y+44,28,C.white,'center');
  const iy=y+70,ih=120;
  gillIcon(c,250-80,iy,160,ih,t);lungIcon(c,710-70,iy,140,ih,t);
  const ax0=360,ax1=600,ay=iy+ih/2,u=mod(t*.5);
  line(c,[[ax0,ay],[ax1-14,ay]],rgba(C.deep,.8),9);dashed(c,[[ax0,ay],[ax1-16,ay]],YELLOW,4,[10,7],-t*16);K.arrow(c,ax1-20,ay,ax1,ay,YELLOW,4);
  circle(c,mix(ax0,ax1-16,u),ay,5,YELLOW,null);
  text(c,lab('gills','鰓','Gills'),250,iy+ih+30,24,C.white,'center');text(c,lab('lungs','肺','Lungs'),710,iy+ih+30,24,C.white,'center');
  text(c,T.young,250,iy+ih+58,22,C.muted,'center');text(c,T.grown,710,iy+ih+58,22,C.muted,'center');
  text(c,L('schematic','示意','Schematic'),480,iy+ih+30,22,C.muted,'center');
  // "Amphibians: young use gills, adults use lungs" (class name cyan, rule yellow)
  text(c,T.cSkin,480,iy+ih+96,22,C.white,'center');
  const nm=lab('amphibian','兩生類','Amphibians'),sep=P('：',': '),cw=measure(c,nm,26),sw=measure(c,sep,26),rw=measure(c,T.cRule,26),bw=cw+sw+rw+36,bx=480-bw/2,by=y+h-52;
  D.round(c,bx,by-6,bw,46,20,'rgba(11,26,21,.92)',null);c.save();c.beginPath();c.roundRect(bx,by-6,bw,46,20);c.strokeStyle=rgba(YELLOW,.85);c.lineWidth=2;c.stroke();c.restore();
  text(c,nm,bx+18,by+26,26,CYAN);text(c,sep,bx+18+cw,by+26,26,YELLOW);text(c,T.cRule,bx+18+cw+sw,by+26,26,YELLOW);
  // gill → lung arrow over the strip, from the tadpole to the adult
  const x0=SX+1*(CELL+GAP)+40,x1=SX+4*(CELL+GAP)+CELL/2,yy=SY-16;
  const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,GILL);g.addColorStop(1,LUNG);
  line(c,[[x0,yy],[x1-16,yy]],rgba(C.deep,.85),10);
  c.save();c.lineCap='round';c.beginPath();c.moveTo(x0,yy);c.lineTo(x1-16,yy);c.strokeStyle=g;c.lineWidth=5;c.stroke();c.restore();K.arrow(c,x1-22,yy,x1,yy,LUNG,5);
  text(c,lab('gills','鰓','Gills'),x0-10,yy+8,22,'#ff8a9b','right');text(c,lab('lungs','肺','Lungs'),x1+10,yy+8,22,LUNG,'left');
});}

// ── timeline strip: shared scale thumbnails, pink line and dots ────────────
function strip(c,k,seen,allOn,t){
  const x0=SX+CELL/2,x1=SX+4*(CELL+GAP)+CELL/2;
  for(let i=0;i<5;i++){const x=SX+i*(CELL+GAP),cur=i===k,on=allOn||cur,al=on?1:seen.has(i)?.55:.25;
    if(cur)glow(c,x+CELL/2,SY+44,70,CYAN,.18+.06*Math.sin(t*2));
    const wv=allOn?Math.max(0,1-Math.abs(mod(t*.8,6.5)-.5-i)):0;
    if(wv>0)glow(c,x+CELL/2,SY+44,80,CYAN,.35*wv);
    D.round(c,x,SY,CELL,SH,12,cur?'rgba(85,233,255,.12)':'rgba(11,26,21,.55)',null);
    c.save();c.beginPath();c.roundRect(x,SY,CELL,SH,12);c.strokeStyle=cur?CYAN:rgba(C.edge,.9);c.lineWidth=cur?3:1.5;c.stroke();c.restore();
    const [W,H]=dim(FILES[i]),w=W*TS,h=H*TS;drawIn(c,FILES[i],{x:x+CELL/2-w/2,y:GROUND-h-5*wv,w,h},{alpha:al});}
  // pink timeline
  line(c,[[x0,TL_Y],[x1,TL_Y]],rgba(C.deep,.85),7);line(c,[[x0,TL_Y],[x1,TL_Y]],rgba(PINK,.85),3);
  for(let i=0;i<4;i++){const xa=SX+i*(CELL+GAP)+CELL/2,xb=xa+CELL+GAP;K.arrow(c,(xa+xb)/2-6,TL_Y,(xa+xb)/2+8,TL_Y,PINK,3);}
  for(let i=0;i<5;i++){const cx=SX+i*(CELL+GAP)+CELL/2,cur=i===k,on=allOn||cur;
    if(cur&&!allOn)K.pulse(c,cx,TL_Y,t,PINK,7);
    circle(c,cx,TL_Y,cur?8:6,on||seen.has(i)?PINK:rgba(PINK,.35),C.ink,1.5);
    withA(c,on?1:seen.has(i)?.7:.45,()=>text(c,SHORT()[i],cx,SY+SH-8,22,C.white,'center'));}
}

// ── one step's whole picture ───────────────────────────────────────────────
function scene(c,k,tau,t,a){withA(c,a,()=>{
  const ca=k===4?fade(tau,CONCL,.7):0;
  if(ca<1)withA(c,1-ca,()=>{trapRow(c,k,tau,t);habitat(c,k,t);habLabels(c,k);hero(c,k,tau,t);breathCard(c,k,tau,t);bodyCard(c,k,tau);bottomRow(c,k,tau);});
  header(c,k);
  closing(c,ca,t);
});}

function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.fr||(s.fr={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;st.seen=new Set();}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;if(!held&&k===0)st.seen=new Set();}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut);
  scene(c,k,tau,t,cross?aIn:1);
  const seen=new Set(st.seen);if(!held)for(let i=0;i<k;i++)seen.add(i);
  strip(c,k,seen,k===4&&tau>=CONCL,t);
  if(x>=1||!cross)st.seen.add(k);
}
window.AnimalsDraw.frog=draw;
})();

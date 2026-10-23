/* Animals · "Seven animals, which class" canvas (vertebrates tab, view 0), 2026-10-23.
 * Five steps = five classes; seven animals (seahorse, frog, pond turtle, emperor penguin, killer whale, bat, platypus).
 * Every step:
 *   header: cyan class pill + animal name; "AI illustration, not a photo" top right;
 *   top row: an orange filled pill "Do not judge only by ___" (the eye-catching trait that does not decide the class)
 *     with a white note beside it;
 *   the animal large (steps 0–3 on the left; step 4 the three mammals in a row, each with its name and an orange tag);
 *   the criteria drawn in code: breathing organ (gill / lung cross-section icons, "schematic"), body covering
 *     (a yellow box on the picture grows into a close-up frame of the same PNG, dashed lines join them,
 *     AGENTS.md law 9-2), feeding (no mammary glands / milk drops, "schematic");
 *   one yellow evidence label.
 *  0 seahorse: gills, bony plates in rings; "an odd shape does not change the class".
 *  1 frog: gills when young → lungs as an adult, moist skin; text hint to the next view (life of a frog).
 *  2 pond turtle: lungs, keratin scales and bony plates; "living by water does not mean gills".
 *  3 emperor penguin: lungs, feathers; "flipper-like wing" on the picture; "cannot fly, still a bird".
 *  4 killer whale, bat, platypus: lungs, hair (close-up of platypus fur), milk; then the closing card,
 *    a pink bracket that groups the seven thumbnails into five classes (cyan names) and a pink "5 classes".
 * Bottom strip: seven thumbnails; current lit, seen dimmer, unseen dimmest.
 * Bat: drawn at 1.3 × the common scale of the killer whale and the platypus (the bat picture is small).
 * Close-up crops and the flipper point were measured once from the PNG alpha (crops ≥ 99 % opaque).
 * Step changes (0.9 s): old step fades out, the new one fades in; the strip stays.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,fitRect,drawIn}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=5,PER=10,CONCL=6;
const FRAME_BG='#16332b',PINK=C.pink,CYAN=C.cyan,ORANGE=C.orange,YELLOW=C.yellow;

// ── layout (canvas px) ─────────────────────────────────────────────────────
const TRAP_Y=60;
const HERO={x:16,y:108,w:420,h:350};
const PX=452,PW=488,IW=190;                       // criteria panel; icon / close-up column width
const R1={x:PX,y:108,w:PW,h:108},R2={x:PX,y:222,w:PW,h:130},R3={x:PX,y:358,w:PW,h:60};
const EVY=428;
const CELL=128,GAP=6,SX=(960-(7*CELL+6*GAP))/2,SY=484,SH=108;
// step 4: three animal cells and three criteria columns
const MC=[{x:16,w:309},{x:325,w:309},{x:634,w:310}];
const COLY=330,COLH=86,COLW=303,COLIW=118;

// ── pictures and points measured from the PNGs (image px) ──────────────────
const SH_='seahorse.png',FR='frog.png',TU='turtle.png',PE='penguin.png',OR='orca.png',BA='bat.png',PY='platypus.png';
const CROP={[SH_]:[72,282,150,90],[FR]:[200,150,180,108],[TU]:[250,60,200,120],[PE]:[178,190,100,60],[PY]:[360,60,150,90]};
const FLIPPER=[215,330];
const SCALE4=.28,BAT_X=1.3;

// ── labels added by this module (LAB has the class names, organs and coverings) ──
const T={
 tBreath:P(`呼吸器官`,`Breathing`),tCover:P(`體表`,`Covering`),tFeed:P(`哺育方式`,`Feeding`),
 noMammary:P(`不用乳汁哺育`,`Young not fed with milk`),
 gillToLung:P(`幼體用鰓 → 成體用肺`,`Gills when young → lungs as an adult`),
 vSeahorse:P(`骨板（一圈圈環節）`,`Bony plates in rings`),vFrog:P(`濕潤的皮膚，沒有鱗片`,`Moist skin, no scales`),
 vTurtle:P(`角質鱗與骨板`,`Keratin scales and bony plates`),
 closeUp:P(`左：圖的局部放大`,`Left: close-up`),
 trap0:P(`會游泳`,`swimming`),trap1:P(`卵生`,`laying eggs`),trap2:P(`生活在水邊`,`living by water`),trap3:P(`會不會飛`,`whether it flies`),
 trap4:P(`會游泳、會飛、卵生`,`swimming, flying, eggs`),
 note0:P(`外形不像一般魚，也不改變分類`,`An odd shape does not change the class`),
 note1:P(`魚、龜、鳥和鴨嘴獸也生蛋`,`Fish, birds and platypuses lay eggs too`),
 note2:P(`生活在水邊，不代表用鰓`,`Living by water does not mean gills`),
 note3:P(`不會飛，仍是鳥`,`Cannot fly, still a bird`),
 note4:P(`三種都是哺乳類`,`All three are mammals`),
 nextFrog:P(`下一個觀察：蛙的一生，鰓怎樣換成肺`,`Next view: the life of a frog, gills to lungs`),
 flipperWing:P(`翅膀變成鰭狀`,`Wing became a flipper`),
 ev0:P(`鰓、骨板`,`gills, bony plates`),ev1:P(`幼體鰓、成體肺、濕潤皮膚`,`gills then lungs, moist skin`),
 ev2:P(`肺、角質鱗與骨板`,`lungs, scales, bony plates`),ev3:P(`羽毛、肺`,`feathers, lungs`),ev4:P(`肺、毛髮、乳汁`,`lungs, hair, milk`),
 c1:P(`分類看：呼吸器官、體表、哺育方式`,`Classify by breathing organ, covering and feeding`),
 c2:P(`會游泳的虎鯨、會飛的蝙蝠、卵生的鴨嘴獸，都是哺乳類。`,`A swimming killer whale, a flying bat and an egg-laying platypus are all mammals.`),
 c3:P(`會游泳／會飛／卵生，都不是單獨的判準。`,`Swimming, flying or laying eggs is not a deciding clue alone.`),
 classes5:P(`5 類`,`5 classes`)
};

const GRP=[['fish','魚類','Fish'],['amphibian','兩生類','Amphibians'],['reptile','爬蟲類','Reptiles'],['bird','鳥類','Birds'],['mammal','哺乳類','Mammals']];
const AN=[['seahorse','海馬','Seahorse'],['frog','蛙','Frog'],['turtle','斑龜','Pond turtle'],['penguin','帝企鵝','Emperor penguin'],['orca','虎鯨','Killer whale'],['bat','蝙蝠','Bat'],['platypus','鴨嘴獸','Platypus']];
const THUMB=[SH_,FR,TU,PE,OR,BA,PY],TSTEP=[0,1,2,3,4,4,4];
const STEP=[
 {f:SH_,trap:T.trap0,note:T.note0,breath:'gill',cover:T.vSeahorse,ev:T.ev0},
 {f:FR,trap:T.trap1,note:T.note1,breath:'gill2lung',cover:T.vFrog,ev:T.ev1},
 {f:TU,trap:T.trap2,note:T.note2,breath:'lung',cover:T.vTurtle,ev:T.ev2},
 {f:PE,trap:T.trap3,note:T.note3,breath:'lung',cover:null,ev:T.ev3},
 {f:PY,trap:T.trap4,note:T.note4,breath:'lung',cover:null,ev:T.ev4}];
const lab=a=>L(a[0],a[1],a[2]);

// ── text helpers (as in animals_draw_phyla_1023_v1.js) ─────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
// fitText: a label in a dark rounded box, measured first; one line if it fits in maxW, otherwise wrapped (never shrunk).
function boxOf(c,p,maxW,size=22){const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7;return{rows,w,h:rows.length*lh+11,lh};}
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22}={}){
  const {rows,w,h,lh}=boxOf(c,p,maxW,size),bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();c.beginPath();c.roundRect(bx,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(col,.85);c.lineWidth=2;c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
const withA=(c,a,fn)=>{if(a<=0)return;c.save();c.globalAlpha*=a;fn();c.restore();};
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
function zbox(c,b,t,a=1){withA(c,a,()=>{c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.strokeStyle=rgba(C.deep,.8);c.lineWidth=6;c.stroke();
  c.setLineDash([6,4]);c.lineDashOffset=-t*12;c.strokeStyle=YELLOW;c.lineWidth=2.6;c.stroke();});}
function cone(c,b,r,t,a=1){
  const Ls=r.x>=b.x+b.w?[[[b.x+b.w,b.y],[r.x,r.y]],[[b.x+b.w,b.y+b.h],[r.x,r.y+r.h]]]:[[[b.x,b.y+b.h],[r.x,r.y]],[[b.x+b.w,b.y+b.h],[r.x+r.w,r.y]]];
  withA(c,a,()=>Ls.forEach(pts=>{line(c,pts,rgba(C.deep,.6),4.5);dashed(c,pts,rgba(YELLOW,.9),2,[7,6],-t*12);}));}
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
const mp=(r,f,ix,iy)=>{const [W,H]=dim(f);return[r.x+ix/W*r.w,r.y+iy/H*r.h];};
const boxOn=(r,f,cr)=>{const [W,H]=dim(f);return{x:r.x+cr[0]/W*r.w,y:r.y+cr[1]/H*r.h,w:cr[2]/W*r.w,h:cr[3]/H*r.h};};
function frame(c,f,cr,R,a){withA(c,a,()=>{const im=pic(src(f)),rad=Math.min(14,R.w*.08);
  c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,rad);c.fillStyle=FRAME_BG;c.fill();
  c.save();c.clip();if(im){c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,cr[0],cr[1],cr[2],cr[3],R.x,R.y,R.w,R.h);}c.restore();
  c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,rad);c.strokeStyle=rgba(C.white,.85);c.lineWidth=2.5;c.stroke();});}
function zoomChain(c,f,r,FR_,tau,t,t0){
  const cr=CROP[f],b=boxOn(r,f,cr),g=smooth(clamp((tau-t0-.5)/.8));
  zbox(c,b,t,fade(tau,t0,.4));
  if(tau>t0+.5){const R=lerpR(b,FR_,g);frame(c,f,cr,R,clamp((tau-t0-.5)/.15));cone(c,b,R,t,clamp((tau-t0-1.3)/.3));}
}
function cardBox(c,R,a,dim_=false){withA(c,a,()=>{c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.fillStyle=dim_?'rgba(22,51,43,.6)':FRAME_BG;c.fill();
  c.strokeStyle=rgba(C.white,dim_?.35:.7);c.lineWidth=2;c.stroke();});}

// ── icons drawn in code (schematic) ────────────────────────────────────────
const GILL='#e2556b',LUNG='#f08aa0',WATER='#7dd3fc',MILK='#f8f4e8';
// gill: three bony arches, each with a comb of red filaments; water dots flow through from left to right
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
// lung: trachea, two bronchi and two lobes with branches; the lobes swell and shrink slowly (breathing)
function lungIcon(c,x,y,w,h,t){
  const cx=x+w/2,br=1+.06*Math.sin(t*2.2),ry=h*.36*br,rx=Math.min(w*.2,h*.3)*br,ly=y+h*.6;
  c.save();c.lineCap='round';
  [-1,1].forEach(s=>{const lx=cx+s*(rx+3);ellipse(c,lx,ly,rx,ry,rgba(LUNG,.9),'#ffd1dc',2);
    line(c,[[cx,y+h*.36],[lx,ly-ry*.35]],'#efe4c8',3);
    line(c,[[lx,ly-ry*.35],[lx+s*rx*.45,ly+ry*.1]],rgba('#8f2d45',.8),2);line(c,[[lx,ly-ry*.35],[lx-s*rx*.2,ly+ry*.45]],rgba('#8f2d45',.8),2);});
  line(c,[[cx,y+2],[cx,y+h*.36]],'#efe4c8',4.5);
  c.restore();
}
// milk: drops fall from a small schematic teat
function dropPath(c,x,y,r){c.beginPath();c.moveTo(x,y-r*1.7);c.bezierCurveTo(x+r*.9,y-r*.5,x+r,y,x+r,y+r*.1);c.arc(x,y+r*.1,r,0,Math.PI);c.bezierCurveTo(x-r,y,x-r*.9,y-r*.5,x,y-r*1.7);c.closePath();}
function milkIcon(c,x,y,w,h,t){
  const cx=x+w/2;
  c.save();c.beginPath();c.ellipse(cx,y+4,w*.32,h*.22,0,0,Math.PI);c.fillStyle='#d9a99a';c.fill();c.restore();
  ellipse(c,cx,y+h*.24,4.5,6,'#c98a7c',null);
  for(let k=0;k<3;k++){const u=mod(t*.6+k/3);c.save();c.globalAlpha*=1-u*.7;dropPath(c,cx+(k-1)*6*u,mix(y+h*.36,y+h*.95,u),5.5);c.fillStyle=MILK;c.fill();c.restore();}
}
function schem(c,x,y,a=1){withA(c,a,()=>text(c,L('schematic','示意','Schematic'),x,y,22,C.muted,'center'));}
// icon box: icon in the upper part, "schematic" underneath
function breathIcon(c,kind,B,t){
  const ih=B.h-30;
  if(kind==='gill')gillIcon(c,B.x+B.w/2-60,B.y,120,ih,t);
  else if(kind==='lung')lungIcon(c,B.x+B.w/2-55,B.y,110,ih,t);
  else{gillIcon(c,B.x+2,B.y+4,74,ih-8,t);K.arrow(c,B.x+B.w/2-12,B.y+ih/2,B.x+B.w/2+14,B.y+ih/2,YELLOW,3);lungIcon(c,B.x+B.w-80,B.y,78,ih,t);}
  schem(c,B.x+B.w/2,B.y+B.h-4);
}

// ── a criteria row: icon / close-up on the left, title + value on the right ──
function rowText(c,R,title,value,{x0=R.x+IW+24,extra=null,dimmed=false}={}){
  const w=R.x+R.w-12-x0;
  text(c,title,x0,R.y+30,22,C.muted);
  const rows=rowsOf(c,value,w,24);rows.forEach((r,i)=>text(c,r,x0,R.y+62+i*28,24,dimmed?C.muted:C.white));
  if(extra)rowsOf(c,extra,w,22).forEach((r,i)=>text(c,r,x0,R.y+62+rows.length*28+i*26,22,C.muted));
}
const iconBox=R=>({x:R.x+10,y:R.y+8,w:IW,h:R.h-12});
function rowsFor(c,k,r,tau,t){
  const S=STEP[k];
  // breathing
  withA(c,fade(tau,1,.5),()=>{cardBox(c,R1,1);breathIcon(c,S.breath,iconBox(R1),t);
    rowText(c,R1,T.tBreath,S.breath==='gill'?L('gills','鰓','Gills'):S.breath==='lung'?L('lungs','肺','Lungs'):T.gillToLung);});
  // covering: close-up of the same picture
  withA(c,fade(tau,1.6,.5),()=>{cardBox(c,R2,1);
    rowText(c,R2,T.tCover,S.cover||L('feathers','羽毛','Feathers'),{extra:T.closeUp});});
  const FRr={x:R2.x+10,y:R2.y+8,w:IW,h:IW*.6};
  zoomChain(c,S.f,r,FRr,tau,t,1.6);
  // feeding: one line, dimmed (not the deciding clue for these classes)
  withA(c,fade(tau,2.6,.5),()=>{cardBox(c,R3,1,true);const tw=measure(c,T.tFeed,22);
    text(c,T.tFeed,R3.x+14,R3.y+38,22,C.muted);text(c,T.noMammary,R3.x+30+tw,R3.y+38,24,C.white);});
}

// ── header, top "do not judge only by" row, evidence ───────────────────────
function header(c,k){
  const pl=fitText(c,lab(GRP[k]),20,12,400,CYAN,{active:true});
  const n=k<4?lab(AN[k]):P([4,5,6].map(i=>AN[i][1]).join('、'),[4,5,6].map(i=>AN[i][2]).join(', ').replace(/^(.)/,m=>m));
  text(c,n,pl.x+pl.w+14,pl.y+pl.h/2+9,26,C.white);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),940,40,22,C.muted,'right');
}
function trapRow(c,k,tau,t){
  const S=STEP[k],no=L('notOnly','不能只看','Do not judge only by');
  withA(c,fade(tau,.4,.5),()=>{
    const pb=fitText(c,P(`${no[0]}「${S.trap[0]}」`,`${no[1]} ${S.trap[1]}`),20,TRAP_Y,600,ORANGE,{active:true,size:24});
    c.save();c.globalAlpha*=.35+.35*Math.sin(t*3);D.round(c,pb.x-4,pb.y-4,pb.w+8,pb.h+8,(pb.h+8)/2,null,ORANGE);c.restore();
    withA(c,fade(tau,.9,.5),()=>{const x0=pb.x+pb.w+18,w=940-x0,rows=rowsOf(c,S.note,w,22);
      const y0=pb.y+pb.h/2+8-(rows.length-1)*13;rows.forEach((r,i)=>text(c,r,x0,y0+i*26,22,C.white));});
  });
}
function evidence(c,k,tau,x=PX,maxW=PW){
  const e=L('evidence','證據','Evidence'),v=STEP[k].ev;
  let b=null;withA(c,fade(tau,3.2,.5),()=>{b=fitText(c,P(`${e[0]}：${v[0]}`,`${e[1]}: ${v[1]}`),x,EVY,maxW,YELLOW);});return b;
}

// ── steps 0–3: one animal ──────────────────────────────────────────────────
const bob=t=>3*Math.sin(t*1.2);
function heroRect(k){
  const f=STEP[k].f,r=fitRect(f,HERO.x,HERO.y,HERO.w,k===1?306:HERO.h);
  if(k===1)r.y=HERO.y;                    // frog: top-aligned, the hint goes underneath
  if(k===3)r.x=HERO.x+24;                 // penguin: left, the flipper label goes on the right
  return r;
}
function stepOne(c,k,tau,t){
  const r0=heroRect(k),r={...r0,y:r0.y+bob(t)};
  drawIn(c,STEP[k].f,r);
  rowsFor(c,k,r,tau,t);
  if(k===1)withA(c,fade(tau,3.6,.5),()=>rowsOf(c,T.nextFrog,HERO.w-8).forEach((row,i)=>text(c,row,HERO.x+4,r0.y+r0.h+28+i*26,22,C.muted)));
  if(k===3)withA(c,fade(tau,2.2,.5),()=>{const [fx,fy]=mp(r,PE,...FLIPPER),x0=r0.x+r0.w+14,
      b=fitText(c,T.flipperWing,x0,HERO.y+272,HERO.x+HERO.w-x0,C.white);lead(c,b.x+18,b.y,fx,fy,C.white);});
  evidence(c,k,tau);
}

// ── step 4: three mammals in a row ─────────────────────────────────────────
function mammalRects(){
  const [Wo,Ho]=dim(OR),[Wb,Hb]=dim(BA),[Wp,Hp]=dim(PY),sb=SCALE4*BAT_X;
  const o={w:Wo*SCALE4,h:Ho*SCALE4},b={w:Wb*sb,h:Hb*sb},p={w:Wp*SCALE4,h:Hp*SCALE4};
  o.x=MC[0].x+(MC[0].w-o.w)/2;o.y=160+(176-o.h)/2;
  b.x=MC[1].x+24;b.y=104+(232-b.h)/2;
  p.x=MC[2].x+(MC[2].w-p.w)/2;p.y=160+(176-p.h)/2;
  return{o,b,p};
}
function tagPair(c,name,trap,x,y,a){withA(c,a,()=>{text(c,name,x,y+28,24,C.white);const w=measure(c,name,24);
  fitText(c,trap,x+w+12,y,300,ORANGE);});}
function step4(c,tau,t){
  const R=mammalRects(),bb=bob(t),o={...R.o,y:R.o.y+bb},b={...R.b,y:R.b.y-bb},p={...R.p,y:R.p.y+bb*.7};
  drawIn(c,OR,o);drawIn(c,BA,b);drawIn(c,PY,p);
  const tags=[[AN[4],L('swims','會游泳','Swims'),MC[0]],[AN[6],L('eggLaying','卵生','Lays eggs'),MC[2]]];
  tags.forEach(([n,tr,M],i)=>{const nm=lab(n),w=measure(c,nm,24)+12+measure(c,tr,22)+28;tagPair(c,nm,tr,M.x+(M.w-w)/2,112,fade(tau,.6+i*.5,.5));});
  withA(c,fade(tau,.85,.5),()=>{const x=b.x+b.w+14;text(c,lab(AN[5]),x,196,24,C.white);fitText(c,L('flies','會飛','Flies'),x,210,MC[1].x+MC[1].w-x,ORANGE);});
  // three criteria columns
  const cols=[0,2,1].map(i=>({x:16+i*(COLW+9),y:COLY,w:COLW,h:COLH}));   // breathing, covering (under the platypus), feeding
  const ib=Cc=>({x:Cc.x+8,y:Cc.y+6,w:COLIW,h:Cc.h-8});
  const ct=(Cc,title,value)=>{const x0=Cc.x+COLIW+20;text(c,title,x0,Cc.y+32,22,C.muted);text(c,value,x0,Cc.y+64,24,C.white);};
  withA(c,fade(tau,1.4,.5),()=>{cardBox(c,cols[0],1);const B=ib(cols[0]);lungIcon(c,B.x+B.w/2-40,B.y,80,B.h-24,t);schem(c,B.x+B.w/2,B.y+B.h-4);ct(cols[0],T.tBreath,L('lungs','肺','Lungs'));});
  withA(c,fade(tau,1.9,.5),()=>{cardBox(c,cols[1],1);ct(cols[1],T.tCover,L('hair','毛髮','Hair'));});
  const fr={x:cols[1].x+8,y:cols[1].y+6,w:COLIW,h:COLIW*.6};
  zoomChain(c,PY,p,fr,tau,t,1.9);
  withA(c,fade(tau,2.6,.5),()=>{cardBox(c,cols[2],1);const B=ib(cols[2]);milkIcon(c,B.x+B.w/2-40,B.y,80,B.h-24,t);schem(c,B.x+B.w/2,B.y+B.h-4);ct(cols[2],T.tFeed,L('milk','乳汁','Milk'));});
  withA(c,fade(tau,3.2,.5),()=>{const e=L('evidence','證據','Evidence'),v=STEP[4].ev;fitText(c,P(`${e[0]}：${v[0]}`,`${e[1]}: ${v[1]}`),480,COLY+COLH+8,928,YELLOW,{align:'center'});});
}

// ── closing (end of the mammal step) ───────────────────────────────────────
const GROUPS=[[0,0],[1,1],[2,2],[3,3],[4,6]];
function closing(c,a,t){withA(c,a,()=>{
  const x=40,y=96,w=880;
  const r1=rowsOf(c,T.c1,w-60,28),r2=rowsOf(c,T.c2,w-60,24),r3=rowsOf(c,T.c3,w-60,24);
  const h=40+r1.length*38+14+r2.length*34+10+r3.length*34+16;
  D.round(c,x,y,w,h,18,'rgba(11,26,21,.95)',null);
  c.save();c.beginPath();c.roundRect(x,y,w,h,18);c.strokeStyle=YELLOW;c.lineWidth=3;c.stroke();c.restore();
  let yy=y+52;r1.forEach(r=>{text(c,r,480,yy,28,YELLOW,'center');yy+=38;});yy+=14;
  r2.forEach(r=>{text(c,r,480,yy,24,C.white,'center');yy+=34;});yy+=10;
  r3.forEach(r=>{text(c,r,480,yy,24,ORANGE,'center');yy+=34;});
  // pink bracket: one bracket per class over the thumbnails, cyan class names above, pink "5 classes"
  const by=SY-8;c.save();c.lineCap='round';
  GROUPS.forEach(([i0,i1])=>{const x0=SX+i0*(CELL+GAP)+6,x1=SX+i1*(CELL+GAP)+CELL-6,pts=[[x0,by+6],[x0,by],[x1,by],[x1,by+6]];
    line(c,pts,rgba(C.deep,.8),7);line(c,pts,PINK,3);});
  c.restore();
  GROUPS.forEach(([i0,i1],g)=>{const cx=(SX+i0*(CELL+GAP)+SX+i1*(CELL+GAP)+CELL)/2;text(c,lab(GRP[g]),cx,by-12,22,CYAN,'center');});
  const pu=.5+.5*Math.sin(t*3),pp=fitText(c,T.classes5,480,by-80,300,PINK,{align:'center',active:true});
  withA(c,.4+.6*pu,()=>{circle(c,pp.x-14,pp.y+pp.h/2,5,PINK,null);circle(c,pp.x+pp.w+14,pp.y+pp.h/2,5,PINK,null);});
});}

// ── thumbnail strip ────────────────────────────────────────────────────────
function strip(c,k,seen,allOn,t){
  for(let i=0;i<7;i++){const x=SX+i*(CELL+GAP),st=TSTEP[i],cur=st===k,on=allOn||cur,al=on?1:seen.has(st)?.55:.25;
    if(cur){glow(c,x+CELL/2,SY+40,66,CYAN,.18+.06*Math.sin(t*2));}
    const wv=allOn?Math.max(0,1-Math.abs(mod(t*.8,8.5)-.5-i)):0;
    if(wv>0)glow(c,x+CELL/2,SY+44,76,CYAN,.35*wv);
    D.round(c,x,SY,CELL,SH,12,cur?'rgba(85,233,255,.12)':'rgba(11,26,21,.55)',null);
    c.save();c.beginPath();c.roundRect(x,SY,CELL,SH,12);c.strokeStyle=cur?CYAN:rgba(C.edge,.9);c.lineWidth=cur?3:1.5;c.stroke();c.restore();
    const two=rowsOf(c,lab(AN[i]),CELL-10).length>1,ph=two?46:(THUMB[i]===BA?60:56);K.place(c,THUMB[i],x+8,SY+5-6*wv,CELL-16,ph,{alpha:al});
    withA(c,on?1:al+.15,()=>{const rows=rowsOf(c,lab(AN[i]),CELL-10);const y0=rows.length>1?SY+76:SY+92;rows.slice(0,2).forEach((r,j)=>text(c,r,x+CELL/2,y0+j*24,22,C.white,'center'));});}
}

// ── one step's whole picture ───────────────────────────────────────────────
function scene(c,k,tau,t,a){withA(c,a,()=>{
  const ca=k===4?fade(tau,CONCL,.7):0;
  if(ca<1)withA(c,1-ca,()=>{trapRow(c,k,tau,t);if(k<4)stepOne(c,k,tau,t);else step4(c,tau,t);});
  header(c,k);
  closing(c,ca,t);
});}

function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.sw||(s.sw={});
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
window.AnimalsDraw.swim=draw;
})();

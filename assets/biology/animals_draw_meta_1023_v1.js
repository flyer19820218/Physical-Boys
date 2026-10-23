/* Animals · "Metamorphosis (extra)" canvas (arthropods tab, view 2), 2026-10-23. Extra content, not required.
 * Four steps; pictures MT1–MT3 (AI teaching illustrations, not photos) plus unit-2 fly / dragonfly and the cicada shell.
 *  0 Complete (swallowtail): egg → larva → pupa → adult appear one by one, joined by arrows, names under each.
 *    A process lane under the names: white "hatch", pink "molt" arrows (larva also gets a pink "molts, grows a bit" loop).
 *    The pupa gets a schematic swirl inside ("does not eat or move; the body is rebuilt inside (schematic)").
 *    Then the larva and adult fly down side by side, joined by an orange ≠ line, "not alike at all". Fly in the corner.
 *  1 Incomplete (grasshopper): egg pod → nymph → older nymph → adult; yellow "no wings / wing buds / full wings" on the
 *    backs (points measured from the PNGs), pink "molt (grows a bit)" arrows; cicada shell and dragonfly in the corner.
 *  2 None (silverfish): eggs → young → older young → adult; yellow "no wings" on each; a pink ruler-style bar under
 *    every stage (body length measured from the PNG alpha, "longer and longer (schematic)", no real mm); pink molt
 *    arrows, and "adults molt too"; the older young and the adult scaled to the same body length, "=" same shape.
 *  3 The three side by side: a table (pupa? / young like the adult? / wings? / examples), one row lit at a time,
 *    thumbnails (young and adult) under each column head; a closing row "every kind molts; molting is not metamorphosis".
 * Row layout: the four pictures of a step share one scale (the scale of the teacher's sheet) and are fitted into 960 px
 *   with kit fitRect boxes proportional to their widths. Labels on the pictures are placed by the program: the pictures
 *   are drawn once off-screen and each label takes the free spot with the fewest opaque pixels near its target.
 * Every step: "Extra" pill top right, "AI illustration, not a photo" bottom right, "marks are schematic".
 * Step changes (0.9 s): old step fades out, new fades in.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,fitRect,drawIn,MONO}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=4,PER=14;
const FRAME_BG='#16332b',PINK=C.pink,CYAN=C.cyan,ORANGE=C.orange,YELLOW=C.yellow;

// ── layout (canvas px) ─────────────────────────────────────────────────────
const G=44,ROW_T=62,ROW_B=260,BAR_Y=271,NAME_Y=300,LANE_Y=313,PILL_Y=323,BOT_T=400,NOTE_Y=592;

// ── pictures and points measured from the PNGs (image px) ──────────────────
const BE='butterfly_egg.png',BL='butterfly_larva.png',BP='butterfly_pupa.png',BA='butterfly_adult.png';
const GE='grasshopper_egg.png',G1='grasshopper_nymph_1.png',G2='grasshopper_nymph_2.png',GA='grasshopper_adult.png';
const SE='silverfish_egg.png',S1='silverfish_young.png',S2='silverfish_young_2.png',SA='silverfish_adult.png';
const FLY='fly.png',DF='dragonfly.png',CS='cicada_shell.png';
// pupa body (alpha > 200 below the twig, eroded 9 px): centre, sd along the two axes, angle of the long axis
const PUPA={c:[175,358],a:97,b:33,ang:103.6};
// larva: top of the body (for the "molts" loop)
const LARVA_TOP=[470,40];
// grasshopper backs: where the wings sit (behind the pronotum)
const WING_PT={[G1]:[178,118],[G2]:[275,160],[GA]:[110,268]};
// silverfish: body (alpha > 128, opened by the leg width) x-extent, mid line y, top of the thorax
const BODY={[SE]:[36,82,64],[S1]:[140,306,99],[S2]:[93,301,134],[SA]:[285,819,243]};
const THORAX={[S1]:[259,84],[S2]:[242,112],[SA]:[669,186]};

// ── labels added by this module (LAB has the stage and group names) ────────
const T={
 advanced:P(`補充`,`Extra`),
 marks:P(`程式畫的箭頭與標記：示意`,`Arrows and marks drawn in code: schematic`),
 exB:P(`例：鳳蝶`,`Example: swallowtail`),exG:P(`例：蝗蟲`,`Example: grasshopper`),exS:P(`例：衣魚`,`Example: silverfish`),
 all3:P(`三種放在一起比`,`The three side by side`),
 egg1:P(`卵`,`Egg`),eggPod:P(`卵（卵囊）`,`Egg pod`),nymph2:P(`若蟲（大一點）`,`Older nymph`),young2:P(`幼體（大一點）`,`Older young`),
 hatch:P(`孵化`,`Hatch`),molt:P(`蛻皮（長大一點）`,`Molt (grows a bit)`),
 moltPupa:P(`蛻皮（化蛹）`,`Molt (into a pupa)`),moltEmerge:P(`蛻皮（羽化）`,`Molt (adult emerges)`),
 larvaMolts:P(`幼蟲也蛻皮，長大一點`,`The larva molts, grows a bit`),adultMolts:P(`成體還會蛻皮`,`Adults molt too`),
 pupaNote:P(`蛹：不吃不動，身體在裡面重組（示意）`,`Pupa: does not eat or move; the body is rebuilt inside (schematic)`),
 notAlike:P(`完全不像`,`Not alike at all`),
 flyToo:P(`蒼蠅也是完全變態`,`A fly also has complete metamorphosis`),
 noWing:P(`無翅`,`No wings`),fullWing:P(`完整的翅`,`Full wings`),
 nymphLike:P(`若蟲像小成蟲`,`The nymph looks like a small adult`),
 cicada:P(`蟬：若蟲蛻下的殼，\n也沒有蛹`,`Cicada: the shell its nymph shed; no pupa either`),
 dragonfly:P(`蜻蜓：若蟲住在水裡，\n外形差較多，也沒有蛹`,`Dragonfly: the nymph lives in water and looks less alike; no pupa`),
 sameShape:P(`形狀一樣，只是越來越大`,`Same shape, only larger and larger`),
 neverWings:P(`從頭到尾都沒有翅膀`,`No wings from start to end`),
 longer:P(`越長越大（示意）`,`Longer and longer (schematic)`),
 sameLen:P(`放大到一樣長來比：形狀一樣（示意）`,`Scaled to the same length: same shape (schematic)`),
 // table
 qPupa:P(`有沒有蛹？`,`A pupa?`),qLike:P(`幼體像不像成蟲？`,`Young like the adult?`),qWing:P(`有沒有翅膀？`,`Wings?`),qEx:P(`例子`,`Examples`),
 cAdultWings:P(`成蟲有翅膀`,`The adult has wings`),cNymphLike:P(`若蟲像小成蟲`,`Nymph like a small adult`),
 exC:P(`鳳蝶、蒼蠅`,`Swallowtail, fly`),exI:P(`蝗蟲、蟬、蜻蜓`,`Grasshopper, cicada, dragonfly`),exN:P(`衣魚`,`Silverfish`),
};

// ── text helpers (as in animals_draw_molt_1023_v1.js) ──────────────────────
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
function leadFrom(c,b,x,y,col){const cy=b.y+b.h/2;let x0=Math.max(b.x+10,Math.min(b.x+b.w-10,x)),y0=Math.max(b.y,Math.min(b.y+b.h,y));
  if(x0>b.x+10&&x0<b.x+b.w-10&&y0>b.y&&y0<b.y+b.h)y0=y<cy?b.y:b.y+b.h;
  if(x<b.x&&y>b.y+8&&y<b.y+b.h-8){x0=b.x;y0=y;}else if(x>b.x+b.w&&y>b.y+8&&y<b.y+b.h-8){x0=b.x+b.w;y0=y;}
  if(Math.hypot(x-x0,y-y0)>8)lead(c,x0,y0,x,y,col);}
const mp=(r,f,ix,iy)=>{const [W,H]=dim(f);return[r.x+ix/W*r.w,r.y+iy/H*r.h];};
const withA=(c,a,fn)=>{if(a<=0)return;c.save();c.globalAlpha*=a;fn();c.restore();};
const bob=(t,i)=>2.2*Math.sin(t*1.3+i*1.1);

// ── the four pictures of a step in one row, one shared scale ───────────────
function row(files,align,mids){
  const ds=files.map(dim),sumW=ds.reduce((a,d)=>a+d[0],0),maxH=Math.max(...ds.map(d=>d[1]));
  const s=Math.min((920-G*(files.length-1))/sumW,(ROW_B-ROW_T)/maxH),tot=sumW*s+G*(files.length-1);
  let x=480-tot/2;const out=[];
  files.forEach((f,i)=>{const [W,H]=ds[i],bw=W*s,bh=H*s;
    let by=align==='mid'?(ROW_T+ROW_B)/2+8-mids[i]*s:ROW_B-bh;by=Math.max(ROW_T,Math.min(ROW_B-bh,by));
    const r=fitRect(f,x,by,bw,bh);out.push({f,...r,cx:r.x+r.w/2});x+=bw+G;});
  return out;}
const ROWS={};
const rowOf=k=>ROWS[k]||(ROWS[k]=k===0?row([BE,BL,BP,BA],'bottom'):k===1?row([GE,G1,G2,GA],'bottom'):row([SE,S1,S2,SA],'mid',[BODY[SE][2],BODY[S1][2],BODY[S2][2],BODY[SA][2]]));
const STAGE_T=i=>.3+i*.8;           // stage i appears
const LANE_T=i=>3.5+i*.45;          // lane arrow i appears

function drawRow(c,R,tau,t){
  R.forEach((r,i)=>{const a=fade(tau,STAGE_T(i),.5);if(a<=0)return;const dy=(1-smooth(a))*14+bob(t,i);
    drawIn(c,r.f,{x:r.x,y:r.y+dy,w:r.w,h:r.h},{alpha:a});
    if(i<R.length-1){const x1=r.x+r.w+8,x2=R[i+1].x-8,y=ROW_B-34;withA(c,fade(tau,STAGE_T(i+1)-.2,.4),()=>{
      line(c,[[x1,y],[x2-8,y]],rgba(C.deep,.8),6);dashed(c,[[x1,y],[x2-10,y]],C.white,2.5,[6,5],-t*14);K.arrow(c,x2-12,y,x2,y,C.white,2.5);});}});}
function names(c,R,ns,tau){R.forEach((r,i)=>withA(c,fade(tau,STAGE_T(i)+.2,.5),()=>text(c,ns[i],r.cx,NAME_Y,22,C.white,'center')));}
// process lane: arrow from stage i to i+1 with a pill (white = hatch, pink = molt)
function lane(c,R,items,tau,t){
  // pill positions: centred on their lane, pushed right just enough not to touch the previous pill
  let prevR=-1e9;const px=items.map((it,i)=>{if(!it)return null;const x1=R[i].cx+6,x2=R[i+1].cx-6,mw=Math.max(x2-x1-12,250),w=boxSize(c,it.p,mw).w;
    let x=Math.max((x1+x2)/2-w/2,prevR+10);x=Math.min(x,940-w);prevR=x+w;return{x,mw};});
  items.forEach((it,i)=>{const a=fade(tau,LANE_T(i),.5);if(a<=0||!it)return;const x1=R[i].cx+6,x2=R[i+1].cx-6,col=it.col;
    withA(c,a,()=>{line(c,[[x1,LANE_Y],[x2-8,LANE_Y]],rgba(C.deep,.8),6);dashed(c,[[x1,LANE_Y],[x2-10,LANE_Y]],col,2.6,[7,5],-t*16);K.arrow(c,x2-12,LANE_Y,x2,LANE_Y,col,2.6);
      circle(c,x1,LANE_Y,4,col,C.ink,1.2);
      const q=mod(t*.45+i*.3);c.save();c.globalAlpha*=Math.sin(q*Math.PI);circle(c,mix(x1,x2-10,q),LANE_Y,4.5,col,null);c.restore();
      fitText(c,it.p,px[i].x,PILL_Y,px[i].mw,col);});});}
// a pink loop arrow (molting while staying in one stage)
function loop(c,x,y,r,t,a){withA(c,a,()=>{c.save();c.lineCap='round';c.beginPath();c.arc(x,y,r,Math.PI*.15,Math.PI*1.75);c.strokeStyle=rgba(C.deep,.8);c.lineWidth=6;c.stroke();
  c.setLineDash([6,4]);c.lineDashOffset=-t*12;c.beginPath();c.arc(x,y,r,Math.PI*.15,Math.PI*1.75);c.strokeStyle=PINK;c.lineWidth=2.6;c.stroke();c.restore();
  const e=Math.PI*1.75,ex=x+r*Math.cos(e),ey=y+r*Math.sin(e);K.arrow(c,ex-6*Math.cos(e+Math.PI/2),ey-6*Math.sin(e+Math.PI/2),ex+5*Math.cos(e+Math.PI/2),ey+5*Math.sin(e+Math.PI/2),PINK,2.6);});}

// ── label placement on the row: the free spot with the fewest opaque pixels ─
const PLACE={};
function placeLabels(c,key,R,tags){
  const k=key+'|'+D.tr(P('z','e'));if(PLACE[k])return PLACE[k];
  const W=960,H=600,off=document.createElement('canvas');off.width=W;off.height=H;const g=off.getContext('2d');let ok=true;
  for(const r of R){const im=pic(src(r.f));if(!im){ok=false;continue;}g.drawImage(im,r.x-4,r.y-4,r.w+8,r.h+8);g.drawImage(im,r.x,r.y,r.w,r.h);}
  g.fillStyle='#fff';g.fillRect(0,0,W,ROW_T-4);g.fillRect(0,ROW_B+4,W,H);
  R.forEach((r,i)=>{if(i<R.length-1)g.fillRect(r.x+r.w,ROW_B-50,R[i+1].x-r.x-r.w,32);});
  const al=g.getImageData(0,0,W,H).data,I=new Float64Array((W+1)*(H+1));
  for(let y=0;y<H;y++){let s=0;for(let x=0;x<W;x++){s+=al[(y*W+x)*4+3]>40?1:0;I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+s;}}
  const sum=(x,y,w,h)=>I[(y+h)*(W+1)+x+w]-I[y*(W+1)+x+w]-I[(y+h)*(W+1)+x]+I[y*(W+1)+x];
  const out=[],taken=[];
  for(const tg of tags){const bs=boxSize(c,tg.p,tg.maxW||220),bw=Math.ceil(bs.w),bh=Math.ceil(bs.h);let best=null;const [tx,ty]=tg.to;
    for(let y=ROW_T-2;y+bh<=ROW_B+2;y+=3)for(let x=20;x+bw<=940;x+=3){
      let cost=sum(x,y,bw,bh)*3;
      for(const o of taken){const ox=Math.min(x+bw,o.x+o.w)-Math.max(x,o.x)+10,oy=Math.min(y+bh,o.y+o.h)-Math.max(y,o.y)+10;if(ox>0&&oy>0)cost+=1e6;}
      const dx=Math.max(x-tx,0,tx-(x+bw)),dy=Math.max(y-ty,0,ty-(y+bh)),d=Math.hypot(dx,dy);cost+=d*5+(d<12?400:0);
      if(!best||cost<best.cost)best={x,y,w:bw,h:bh,cost};}
    taken.push(best);out.push({...tg,x:best.x,y:best.y});}
  if(ok)PLACE[k]=out;return out;}
function drawTags(c,tg,tau,t,bobOf){tg.forEach(o=>withA(c,fade(tau,o.t0,.5),()=>{const b=fitText(c,o.p,o.x,o.y,o.maxW||220,o.col);const dy=bobOf?bobOf(o):0;
  leadFrom(c,b,o.to[0],o.to[1]+dy,o.col);if(o.ring){c.save();c.setLineDash([4,3]);c.lineDashOffset=-t*10;circle(c,o.to[0],o.to[1]+dy,9,null,o.col,2.2);c.restore();}}));}

// ── header, corners ────────────────────────────────────────────────────────
function header(c,grp,title){
  let x=20;if(grp){const pl=fitText(c,grp,20,12,420,CYAN,{active:true});x=pl.x+pl.w+14;}
  text(c,title,x,44,26,C.white);
  fitText(c,T.advanced,940,12,260,C.white,{align:'right',dashedBorder:true});}
function corners(c){text(c,T.marks,20,NOTE_Y,22,C.muted);text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),940,NOTE_Y,22,C.muted,'right');}

// ── step 0: complete metamorphosis (swallowtail) ───────────────────────────
function step0(c,tau,t){
  const R=rowOf(0);
  drawRow(c,R,tau,t);
  // schematic: the body is rebuilt inside the pupa
  const p=R[2],[px,py]=mp(p,BP,...PUPA.c),k=p.w/dim(BP)[0],ra=PUPA.a*k*.62,rb=PUPA.b*k*.7,ang=PUPA.ang*Math.PI/180,pa=fade(tau,4.8,.6),dy=bob(t,2);
  withA(c,pa,()=>{c.save();c.translate(px,py+dy);c.rotate(ang);
    ellipse(c,0,0,ra,rb,null,rgba(C.deep,.6),5);c.setLineDash([5,4]);c.lineDashOffset=-t*10;ellipse(c,0,0,ra,rb,null,C.white,2);c.setLineDash([]);
    for(let j=0;j<6;j++){const q=t*.7+j/6*Math.PI*2;circle(c,ra*.7*Math.cos(q),rb*.6*Math.sin(q*1.3),3.2,C.white,C.ink,1);}c.restore();});
  // larva and adult copies fly down to the bottom left (drawn before the labels, so labels stay on top)
  const l=R[1];
  const u=smooth(clamp((tau-5.6)/.9)),Lt=fitRect(BL,30,452,180,106),At=fitRect(BA,300,446,140,118);
  if(tau>5.6){const lr={x:mix(l.x,Lt.x,u),y:mix(l.y,Lt.y,u),w:mix(l.w,Lt.w,u),h:mix(l.h,Lt.h,u)},a=R[3],ar={x:mix(a.x,At.x,u),y:mix(a.y,At.y,u),w:mix(a.w,At.w,u),h:mix(a.h,At.h,u)};
    withA(c,clamp((tau-5.6)/.3),()=>{drawIn(c,BL,lr);drawIn(c,BA,ar);});}
  names(c,R,[T.egg1,L('larva','幼蟲','Larva'),L('pupa','蛹','Pupa'),L('imago','成蟲','Adult')],tau);
  lane(c,R,[{p:T.hatch,col:C.white},{p:T.moltPupa,col:PINK},{p:T.moltEmerge,col:PINK}],tau,t);
  // the larva molts while it grows: loop + label above it
  const [lx,ly]=mp(l,BL,...LARVA_TOP),la=fade(tau,LANE_T(3),.5);
  loop(c,lx,ly-6+bob(t,1),15,t,la);
  const tg=placeLabels(c,'s0',R,[{p:T.larvaMolts,to:[lx-14,ly-10],col:PINK,t0:LANE_T(3),maxW:250}]);
  drawTags(c,tg,tau,t);
  withA(c,fade(tau,6.6,.5),()=>{const y=Lt.y+Lt.h/2,x1=Lt.x+Lt.w+8,x2=At.x-8,mx=(x1+x2)/2;
    line(c,[[x1,y],[x2,y]],rgba(C.deep,.8),7);dashed(c,[[x1,y],[x2,y]],ORANGE,3.2,[8,5],-t*12);K.arrow(c,x1+12,y,x1,y,ORANGE,3);K.arrow(c,x2-12,y,x2,y,ORANGE,3);
    circle(c,mx,y,16,C.deep,ORANGE,2.6);c.save();c.font=MONO(26);c.fillStyle=ORANGE;c.textAlign='center';c.textBaseline='middle';c.fillText('≠',mx,y+1);c.restore();
    fitText(c,T.notAlike,mx,BOT_T,300,ORANGE,{align:'center',active:true});});
  // bottom middle: the pupa note
  withA(c,fade(tau,4.8,.6),()=>fitText(c,T.pupaNote,466,BOT_T+8,250,C.white,{dashedBorder:true}));
  // bottom right: the fly
  withA(c,fade(tau,8,.6),()=>{const fr=fitRect(FLY,740,BOT_T,200,78);drawIn(c,FLY,{...fr,y:fr.y+bob(t,5)});
    rowsOf(c,T.flyToo,200).forEach((s,j)=>text(c,s,840,BOT_T+104+j*27,22,C.white,'center'));});
}

// ── step 1: incomplete metamorphosis (grasshopper) ─────────────────────────
function step1(c,tau,t){
  const R=rowOf(1);
  drawRow(c,R,tau,t);
  names(c,R,[T.eggPod,L('nymph','若蟲','Nymph'),T.nymph2,L('imago','成蟲','Adult')],tau);
  lane(c,R,[{p:T.hatch,col:C.white},{p:T.molt,col:PINK},{p:T.molt,col:PINK}],tau,t);
  const tags=[[1,T.noWing,G1],[2,L('wingBud','翅芽','Wing buds'),G2],[3,T.fullWing,GA]].map(([i,p,f])=>({p,to:mp(R[i],f,...WING_PT[f]),col:YELLOW,t0:5.2+(i-1)*.6,maxW:200,ring:true,i}));
  drawTags(c,placeLabels(c,'s1',R,tags),tau,t,o=>bob(t,o.i));
  // bottom left: evidence
  [L('noPupa','沒有蛹','No pupa'),T.nymphLike,L('wingsGrow','翅膀逐漸長出','Wings grow gradually')].forEach((p,j)=>withA(c,fade(tau,7+j*.5,.5),()=>fitText(c,p,20,BOT_T+j*48,420,YELLOW)));
  // bottom right: cicada and dragonfly
  withA(c,fade(tau,8.8,.6),()=>{const r=fitRect(CS,452,BOT_T,196,56);drawIn(c,CS,{...r,y:r.y+bob(t,6)});rowsOf(c,T.cicada,196).forEach((s,j)=>text(c,s,550,BOT_T+80+j*27,22,C.white,'center'));});
  withA(c,fade(tau,9.4,.6),()=>{const r=fitRect(DF,664,BOT_T,276,56);drawIn(c,DF,{...r,y:r.y+bob(t,7)});rowsOf(c,T.dragonfly,276).forEach((s,j)=>text(c,s,802,BOT_T+80+j*27,22,C.white,'center'));});
}

// ── step 2: no metamorphosis (silverfish) ──────────────────────────────────
function ruler(c,x1,x2,y,a,t){withA(c,a,()=>{line(c,[[x1,y],[x2,y]],rgba(C.deep,.85),8);line(c,[[x1,y],[x2,y]],PINK,3.2);
  for(let x=x1;x<=x2+.5;x+=8)line(c,[[x,y-3],[x,y+3]],PINK,1.6);
  [x1,x2].forEach(x=>{line(c,[[x,y-9],[x,y+9]],rgba(C.deep,.85),6);line(c,[[x,y-8],[x,y+8]],PINK,3);});});}
function step2(c,tau,t){
  const R=rowOf(2);
  drawRow(c,R,tau,t);
  // ruler-style length bars under every stage
  R.forEach((r,i)=>{const b=BODY[r.f],[x1]=mp(r,r.f,b[0],0),[x2]=mp(r,r.f,b[1],0),g=smooth(clamp((tau-4.4-i*.35)/.6));if(g<=0)return;ruler(c,x1,mix(x1,x2,g),BAR_Y,1,t);});
  names(c,R,[L('egg','卵','Eggs'),L('juvenile','幼體','Young'),T.young2,L('grown','成體','Adult')],tau);
  lane(c,R,[{p:T.hatch,col:C.white},{p:T.molt,col:PINK},{p:T.molt,col:PINK}],tau,t);
  // adults molt too: loop at the adult
  const A=R[3],la=fade(tau,LANE_T(3),.5);
  withA(c,la,()=>{loop(c,A.cx+16,LANE_Y+2,12,t,1);fitText(c,T.adultMolts,A.cx+34,PILL_Y,940-A.cx-34,PINK);});
  const tags=[1,2,3].map(i=>({p:T.noWing,to:mp(R[i],R[i].f,...THORAX[R[i].f]),col:YELLOW,t0:5.8+(i-1)*.5,maxW:180,ring:true,i}));
  drawTags(c,placeLabels(c,'s2',R,tags),tau,t,o=>bob(t,o.i));
  // bottom left: evidence and the ruler legend
  withA(c,fade(tau,7.2,.5),()=>fitText(c,T.sameShape,20,BOT_T,420,YELLOW));
  withA(c,fade(tau,7.7,.5),()=>fitText(c,T.neverWings,20,BOT_T+48,420,YELLOW));
  withA(c,fade(tau,4.6,.5),()=>{ruler(c,28,92,BOT_T+116,1,t);fitText(c,T.longer,104,BOT_T+96,336,PINK);});
  // bottom right: older young and adult at the same body length
  withA(c,fade(tau,8.6,.6),()=>{const cap=fitText(c,T.sameLen,700,BOT_T,480,YELLOW,{align:'center'}),top=cap.y+cap.h+6,hMax=568-top;
    const B=Math.min(hMax/dim(S2)[1]*(BODY[S2][1]-BODY[S2][0]),hMax/dim(SA)[1]*(BODY[SA][1]-BODY[SA][0]),150);
    const mid=top+hMax/2,draw1=(f,cx,i)=>{const [W,H]=dim(f),k=B/(BODY[f][1]-BODY[f][0]),w=W*k,h=H*k,bx=(BODY[f][0]+BODY[f][1])/2*k,by=BODY[f][2]*k;drawIn(c,f,{x:cx-bx,y:mid-by+bob(t,i),w,h});return[cx-B/2,cx+B/2];};
    const a=draw1(S2,580,8),b=draw1(SA,820,9);
    circle(c,700,mid,17,C.deep,YELLOW,2.6);c.save();c.font=MONO(28);c.fillStyle=YELLOW;c.textAlign='center';c.textBaseline='middle';c.fillText('=',700,mid+1);c.restore();
    ruler(c,a[0],a[1],568-4,1,t);ruler(c,b[0],b[1],568-4,1,t);});
}

// ── step 3: the three side by side ─────────────────────────────────────────
const TX=20,LW=214,CW=(920-LW)/3,LH=27,TH=96,ROW0=.8,DT=2.2;
const COLS=[{g:['complete','完全變態','Complete metamorphosis'],th:[BL,BP,BA]},{g:['incomplete','不完全變態','Incomplete metamorphosis'],th:[G1,GA]},{g:['noMeta','無變態','No metamorphosis'],th:[S1,SA]}];
function tableRows(){return[
  {q:T.qPupa,c:[[L('hasPupa','有蛹','Has a pupa')],[L('noPupa','沒有蛹','No pupa')],[L('noPupa','沒有蛹','No pupa')]]},
  {q:T.qLike,c:[[L('looksDifferent','幼蟲不像成蟲','Larva unlike adult'),ORANGE],[T.cNymphLike],[L('sameShape','形狀相同，只是變大','Same shape, just larger')]]},
  {q:T.qWing,c:[[T.cAdultWings],[L('wingsGrow','翅膀逐漸長出','Wings grow gradually')],[L('noWings','沒有翅膀','No wings')]]},
  {q:T.qEx,c:[[T.exC],[T.exI],[T.exN]]}];}
function geom3(c){const rows=tableRows(),lines=rows.map(r=>Math.max(rowsOf(c,r.q,LW-24).length,...r.c.map(x=>rowsOf(c,x[0],CW-24).length)));
  const heads=COLS.map(o=>boxSize(c,L(...o.g),CW-16).h),HH=Math.max(...heads)+8+TH+12;
  const closeP=P(`${L('moltEvery','每一種都要蛻皮','Every kind molts')[0]}；${L('moltNotMeta','蛻皮不等於變態','Molting is not metamorphosis')[0]}`,`${L('moltEvery','每一種都要蛻皮','Every kind molts')[1]}; ${L('moltNotMeta','蛻皮不等於變態','Molting is not metamorphosis')[1].toLowerCase()}`);
  const closeL=rowsOf(c,closeP,920-28).length;
  const top=62,avail=NOTE_Y-24-top-HH-(closeL*LH+18),content=lines.reduce((a,b)=>a+b,0)*LH,pad=Math.max(10,Math.min(30,(avail-content)/rows.length));
  const hs=lines.map(l=>l*LH+pad),ys=[];let y=top+HH;hs.forEach(h=>{ys.push(y);y+=h;});
  return{rows,lines,hs,ys,HH,top,closeP,closeY:y,closeH:closeL*LH+18};}
function step3(c,tau,t){
  const g=geom3(c),n=g.rows.length,cur=(()=>{let r=-1;for(let i=0;i<=n;i++)if(tau>=ROW0+i*DT)r=i;return r;})(),lit=i=>fade(tau,ROW0+i*DT,.5);
  const bottom=g.closeY+g.closeH;
  c.save();c.beginPath();c.roundRect(TX,g.top,920,bottom-g.top,14);c.fillStyle='rgba(11,26,21,.92)';c.fill();c.strokeStyle=C.edge;c.lineWidth=2;c.stroke();c.restore();
  [TX+LW,TX+LW+CW,TX+LW+2*CW].forEach(x=>line(c,[[x,g.top+8],[x,g.closeY-2]],rgba(C.edge,.9),1.5));
  // column heads: cyan group name and thumbnails (young → adult)
  COLS.forEach((o,ci)=>{const x=TX+LW+ci*CW,pl=fitText(c,L(...o.g),x+CW/2,g.top+8,CW-16,CYAN,{align:'center',active:true}),ty=g.top+g.HH-TH-10,th=o.th,n2=th.length,bw=(CW-24-(n2-1)*22)/n2;
    th.forEach((f,j)=>{const bx=x+12+j*(bw+22),r=fitRect(f,bx,ty,bw,TH),hl=(cur===0&&f===BP)||(cur===2&&(f===BA||f===GA))||(cur===1);
      if(hl){c.save();c.globalAlpha*=.5+.3*Math.sin(t*3);D.round(c,r.x-4,r.y-4,r.w+8,r.h+8,8,null,YELLOW);c.restore();}
      drawIn(c,f,{...r,y:r.y+bob(t,ci*3+j)*.6});
      if(j<n2-1){const ax=bx+bw+3,ay=ty+TH/2;K.arrow(c,ax,ay,ax+16,ay,C.white,2.2);}});});
  line(c,[[TX+10,g.top+g.HH-2],[TX+910,g.top+g.HH-2]],rgba(C.edge,1),1.5);
  g.rows.forEach((r,i)=>{const y=g.ys[i],h=g.hs[i],a=lit(i);
    if(i)line(c,[[TX+10,y],[TX+910,y]],rgba(C.edge,.7),1);
    if(i===cur&&a>0)withA(c,a*(.8+.2*Math.sin(t*2.6)),()=>{D.round(c,TX+5,y+2,910,h-4,10,rgba(YELLOW,.1),null);D.round(c,TX+5,y+6,4,h-12,2,YELLOW,null);});
    const block=(p,x,w,col,al)=>{const rs=rowsOf(c,p,w),y0=y+(h-rs.length*LH)/2+19;withA(c,al,()=>rs.forEach((s,j)=>text(c,s,x,y0+j*LH,22,col)));};
    block(r.q,TX+14,LW-24,a>0?YELLOW:C.muted,a>0?1:.55);
    if(a>0)r.c.forEach((cell,ci)=>block(cell[0],TX+LW+ci*CW+12,CW-24,cell[1]||C.white,a));});
  // closing row: molting
  const a=lit(n),y=g.closeY;
  line(c,[[TX+10,y],[TX+910,y]],rgba(C.edge,1),1.5);
  withA(c,a,()=>{D.round(c,TX+5,y+3,910,g.closeH-6,10,rgba(PINK,.12),null);c.save();c.beginPath();c.roundRect(TX+5,y+3,910,g.closeH-6,10);c.strokeStyle=rgba(PINK,.6+.4*Math.sin(t*2.6));c.lineWidth=2.4;c.stroke();c.restore();
    rowsOf(c,g.closeP,920-28).forEach((s,j)=>text(c,s,480,y+9+19+j*LH,22,PINK,'center'));});
}

const STEPS=[step0,step1,step2,step3];
const HEAD=[['complete','完全變態','Complete metamorphosis',T.exB],['incomplete','不完全變態','Incomplete metamorphosis',T.exG],['noMeta','無變態','No metamorphosis',T.exS]];

// ── one step's whole picture ──────────────────────────────────────────────
function scene(c,k,tau,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  STEPS[k](c,tau,t);
  if(k<3){const h=HEAD[k];header(c,L(h[0],h[1],h[2]),h[3]);}else header(c,null,T.all3);
  corners(c);
  c.restore();
}

function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.mt||(s.mt={});
  if(st.k===undefined||st.held!==held){st.k=k;st.from=-1;st.T=t-9;st.held=held;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut);
  scene(c,k,tau,t,cross?aIn:1);
}
window.AnimalsDraw.meta=draw;
})();

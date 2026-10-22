/* Plants · "Zoom in on a dot" canvas (fern tab, view 1), 2026-10-22.
 * A chain of local enlargements (AGENTS.md, law 9-2 "small structures are enlarged"): the small picture only says
 * WHERE, the enlarged frame says WHAT; a yellow box on the small picture is joined to the frame by dashed lines,
 * and the frame grows out of the box, so students see where the enlargement comes from.
 * Pictures: the teacher's Gemini AI illustrations (plants_ai_1022/), aspect kept.
 *  0 underside: sori_dots large, pulsing rings (schematic) on six measured dots, "dots"; then a yellow box on one dot,
 *    "zoom in here".
 *  1 sorus: the frond shrinks to a thumbnail (left), the box shrinks onto one round sorus, and a frame grows out of
 *    the box to the main area: a crop of the same sori_dots.png (full-resolution source, not a scaled-down copy),
 *    labelled "sorus"; dashed lines join box and frame.
 *  2 sporangia: the sorus frame shrinks into a second thumbnail (chain: underside → sorus), a box on it, and
 *    sporangia.png grows into the main frame: "sporangium", "ring of cells (schematic)", "stalk", and "opened" on the
 *    two split ones.
 *  3 spores released: drawn spores (brown specks, schematic, seeded K.rng so they repeat) puff out of the two split
 *    sporangia, drift up and fade, looping; a box on the cloud is joined to a spores.png close-up (right) with a pale
 *    panel and a soft glow behind every measured spore, because a few spores are darker than the board.
 *  4 not a seed: one spore (crop of spores.png, round frame) ≠ peanut_seed.png (seed coat, seed leaf + stored food,
 *    embryo); "a spore is not a seed", and a note that the two pictures are enlarged by different amounts.
 * Sori, spore centres, sporangium mouths and peanut parts were measured once from the PNGs (alpha and colour).
 * Step changes (0.9 s): a picture in both steps keeps showing and glides to its new place (the zoom chain); other
 * pictures and all words are sequenced (old fades out, then new fades in), as in plants_draw_fernleaf_1022_v1.js.
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,text,measure,splitLines,circle,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,AI,SIZE,TAU,fitRect}=K;
const LAB=()=>K.LAB||{};
const N=5,PER=8;
const BROWN='#c98a5a',SPORE='#b07a4c',SPORE_EDGE='#3e2614',FRAME_BG='#11261f';
const SD='sori_dots.png',SPG='sporangia.png',SPS='spores.png',PN='peanut_seed.png';
const FULL=f=>[0,0,SIZE[f][0],SIZE[f][1]];

// ── measured from the PNGs (image px) ──────────────────────────────────────
const CS=[547,339,110,110];          // sori_dots: the round sorus that is enlarged, centre (602,394), ~25 px across (the most isolated one)
const CS2=[577,369,50,50];           // the middle of that sorus, boxed in step 2
const DOTS0=[[648,739],[304,443],[600,922],[181,916],[395,118]];   // sori ringed in step 0 (4, 2 get leaders, clear of the zoom box)
const SP1=[349,45,72,72];            // spores.png: one round spore, centre (385,81)
const SPORES=[[527,26],[215,80],[385,81],[767,123],[322,165],[544,165],[444,222],[119,256],[713,286],[361,295],[534,304],[228,313],[460,354],[307,371],[634,378],[412,383],[840,380],[26,386],[149,432],[334,448],[568,457],[464,470],[688,495],[797,506],[272,505],[506,567],[377,576],[171,591],[638,645],[317,695],[486,726]];
const MOUTH=[{p:[425,140],a:-1.05},{p:[690,282],a:-.38}];   // sporangia.png: openings of the two split sporangia, puff direction
const SPG_PT={body:[640,612],ring:[728,660],stalk:[465,800],open1:[392,58],open2:[652,172],cloud:[790,230]};
const PN_PT={coat:[862,430],cot:[650,300],embryo:[455,690]};

// ── layout (canvas px) ─────────────────────────────────────────────────────
const R0=fitRect(SD,30,20,420,560);
const T1={x:20,y:60,w:180,h:180*SIZE[SD][1]/SIZE[SD][0]};
const T1b={x:50,y:60,w:120,h:120*SIZE[SD][1]/SIZE[SD][0]};
const T2={x:35,y:290,w:150,h:150};
const Z={x:226,y:64,w:440,h:440};
const RX=686,RW=258;                 // right column, steps 1–3
const RX0=480,RW0=450;               // right column, step 0
const SCH=RW*SIZE[SPS][1]/SIZE[SPS][0];
const ONE={cx:160,cy:190,r:95};      // step 4, the one spore
const PR=fitRect(PN,400,56,300,326); // step 4, the peanut

const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
const sameR=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.w-b.w)+Math.abs(a.h-b.h)<.5;

// ── pictures as items {id,f,crop,r,a,frame,fit,rot,pv,bg,under} ────────────
function imgRect(q){if(!q.fit)return q.r;const pad=q.r.w*.012,bw=q.r.w-2*pad,bh=q.r.h-2*pad,k=Math.min(bw/q.crop[2],bh/q.crop[3]),w=q.crop[2]*k,h=q.crop[3]*k;
  return{x:q.r.x+(q.r.w-w)/2,y:q.r.y+(q.r.h-h)/2,w,h};}
const lin=(q,ix,iy)=>{const r=imgRect(q);return[r.x+(ix-q.crop[0])/q.crop[2]*r.w,r.y+(iy-q.crop[1])/q.crop[3]*r.h];};
function map(q,ix,iy){const [x,y]=lin(q,ix,iy);if(!q.rot)return[x,y];const [px,py]=lin(q,...q.pv),co=Math.cos(q.rot),si=Math.sin(q.rot);
  return[px+(x-px)*co-(y-py)*si,py+(x-px)*si+(y-py)*co];}
const kOf=q=>imgRect(q).w/q.crop[2];
// canvas rect of an image-px rect on a picture (follows the sway of its centre)
function boxOf(q,[sx,sy,sw,sh]){const k=kOf(q),[x,y]=map(q,sx+sw/2,sy+sh/2);return{x:x-sw*k/2,y:y-sh*k/2,w:sw*k,h:sh*k};}
const RAD=r=>Math.min(16,r.w*.08);
// Enlarging a very small crop (one spore, about 70 px): upscale in three bilinear 2x steps and cache, so the edge looks smooth, not blocky.
const SOFT={};
function softImg(im,crop){const key=crop[2]+'x'+crop[3];if(SOFT[key])return SOFT[key];
  let src=document.createElement('canvas');src.width=crop[2];src.height=crop[3];src.getContext('2d').drawImage(im,crop[0],crop[1],crop[2],crop[3],0,0,crop[2],crop[3]);
  for(let i=0;i<3;i++){const n=document.createElement('canvas');n.width=src.width*2;n.height=src.height*2;const g=n.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(src,0,0,n.width,n.height);src=n;}
  return SOFT[key]=src;}
function drawItem(c,q){
  if(q.a<=0)return;const im=pic(AI+q.f),r=q.r;c.save();c.globalAlpha*=Math.min(1,q.a);
  const clipPath=()=>{c.beginPath();if(q.frame===2)c.arc(r.x+r.w/2,r.y+r.h/2,r.w/2,0,TAU);else c.roundRect(r.x,r.y,r.w,r.h,RAD(r));};
  if(q.frame){clipPath();c.fillStyle=q.bg||FRAME_BG;c.fill();c.save();clipPath();c.clip();}
  if(q.under)q.under(c,q);
  if(im){const ir=imgRect(q);c.save();
    if(q.rot){const [px,py]=lin(q,...q.pv);c.translate(px,py);c.rotate(q.rot);c.translate(-px,-py);}
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';if(q.soft)c.drawImage(softImg(im,[SP1[0],SP1[1],SP1[2],SP1[3]]),ir.x,ir.y,ir.w,ir.h);else c.drawImage(im,q.crop[0],q.crop[1],q.crop[2],q.crop[3],ir.x,ir.y,ir.w,ir.h);c.restore();}
  else{c.save();c.setLineDash([6,6]);D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(C.muted,.4));c.restore();}
  if(q.frame){c.restore();clipPath();c.strokeStyle=rgba(C.white,.85);c.lineWidth=2.5;c.stroke();}
  c.restore();
}

// ── text helpers (as in plants_draw_fernleaf_1022_v1.js) ───────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
function textBlock(c,p,x,y,w,col,{size=22,lh=30,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
function bottomBlock(c,p,x,yb,w,col,{lh=28,align='left'}={}){const rows=rowsOf(c,p,w);rows.forEach((r,i)=>text(c,r,x,yb-(rows.length-1-i)*lh,22,col,align));return rows.length*lh;}
// fitText: a label in a dark rounded box, measured first; one line if it fits in maxW, otherwise wrapped (never shrunk).
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22,dash=null}={}){
  const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7,h=rows.length*lh+11,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();if(dash)c.setLineDash(dash);c.beginPath();c.roundRect(bx,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(col,.85);c.lineWidth=2;c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
function ring(c,x,y,r,t,a,col=C.yellow){if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,null,rgba(C.deep,.75),6.5);c.setLineDash([7,5]);c.lineDashOffset=-t*14;circle(c,x,y,r,null,col,3);c.restore();c.save();c.globalAlpha*=a;K.pulse(c,x,y,t,col,r);c.restore();}
// the yellow zoom box (schematic marker)
function zbox(c,b,t,a=1){if(a<=0)return;c.save();c.globalAlpha*=a;
  c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.strokeStyle=rgba(C.deep,.8);c.lineWidth=6;c.stroke();
  c.setLineDash([6,4]);c.lineDashOffset=-t*12;c.strokeStyle=C.yellow;c.lineWidth=2.6;c.stroke();c.restore();}
// dashed lines from a box to the frame it is enlarged in
function cone(c,b,r,dir,t,a=1){if(a<=0)return;
  const L=dir==='down'?[[[b.x,b.y+b.h],[r.x,r.y]],[[b.x+b.w,b.y+b.h],[r.x+r.w,r.y]]]:[[[b.x+b.w,b.y],[r.x,r.y]],[[b.x+b.w,b.y+b.h],[r.x,r.y+r.h]]];
  c.save();c.globalAlpha*=a;L.forEach(pts=>{line(c,pts,rgba(C.deep,.6),4.5);dashed(c,pts,rgba(C.yellow,.9),2,[7,6],-t*12);});c.restore();}
const aiP=()=>LAB().aiNote||P(`AI 插圖，非實拍`,`AI illustration, not a photo`);
const MARK=P(`黃色框、圈與虛線是加上的標示（示意）`,`Yellow boxes, rings and dashed lines are added markers (schematic)`);
// notes for steps 1–3: AI note under the chain (left), marker note at the bottom of the right column
function notes(c){bottomBlock(c,aiP(),20,590,182,C.muted);bottomBlock(c,MARK,RX,590,RW,C.muted);}
const title=(c,p,x=RX,y=16,w=RW)=>fitText(c,p,x,y,w,C.yellow,{active:true});
const chainLabel=(c,p,x,y)=>text(c,p,x,y,22,C.muted,'center');

// ── pictures of each step ──────────────────────────────────────────────────
const SORUS_NAME=P(`孢子囊堆`,`Sorus`),UNDER=P(`葉背`,`Underside`);
function mkLeaf(r,t,a=1){return{id:'leaf',f:SD,crop:FULL(SD),r,a,rot:.006*Math.sin(t*.9),pv:[200,1190]};}
function mkSorus(r,t,a=1){return{id:'sorus',f:SD,crop:[CS[0]+1.6*Math.sin(t*.5),CS[1]+1.6*Math.cos(t*.41),CS[2],CS[3]],r,a,frame:1};}
function mkSpor(r,t,a=1){return{id:'spor',f:SPG,crop:FULL(SPG),r,a,frame:1,fit:1,rot:.008*Math.sin(t*.8+1),pv:[420,960]};}
function haloSpores(c,q){const k=kOf(q);c.save();
  SPORES.forEach(([ix,iy],i)=>{const [x,y]=lin(q,ix,iy);glow(c,x,y,(30+3*Math.sin(i))*k*1.25,'#efe3c4',.42);});c.restore();}
function mkClose(y,t,a=1){return{id:'close',f:SPS,crop:FULL(SPS),r:{x:RX,y,w:RW,h:SCH},a,frame:1,bg:'#21453a',under:haloSpores};}
function mkOne(t,a=1){const b=1.5*Math.sin(t*1.2);return{id:'one',f:SPS,crop:[SP1[0],SP1[1]+b*.3,SP1[2],SP1[3]],r:{x:ONE.cx-ONE.r,y:ONE.cy-ONE.r+b,w:ONE.r*2,h:ONE.r*2},a,frame:2,soft:1,bg:'#21453a',
  under:(c,q)=>{const [x,y]=lin(q,385,81);glow(c,x,y,ONE.r*.85,'#efe3c4',.38);}};}
function mkPeanut(t,a=1){return{id:'pn',f:PN,crop:FULL(PN),r:PR,a,rot:.006*Math.sin(t*.7),pv:[445,940]};}

// ── step 0: underside ──────────────────────────────────────────────────────
function over0(c,a,tau,t,L){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  DOTS0.forEach((d,i)=>{const [x,y]=map(L,...d);ring(c,x,y,15,t+i*.23,fade(tau,.3+i*.12,.4));});
  const b=title(c,UNDER,RX0,40,RW0);
  c.save();c.globalAlpha*=fade(tau,.9,.5);
  const dp=fitText(c,P(`小點`,`Dots`),RX0,b.y+b.h+40,RW0,BROWN);
  [4,2].forEach(i=>{const [x,y]=map(L,...DOTS0[i]);lead(c,dp.x-6,dp.y+dp.h/2,x+16,y,BROWN);});
  let y=dp.y+dp.h+40;
  y+=textBlock(c,P(`葉背有一排排咖啡色的小點。`,`The underside has rows of brown dots.`),RX0,y,RW0,C.white)+20;
  c.restore();
  const za=fade(tau,2.6,.5);
  if(za>0){c.save();c.globalAlpha*=za;
    const bx=boxOf(L,CS),s=mix(1.9,1,smooth(clamp((tau-2.6)/.7))),bb={x:bx.x+bx.w/2-bx.w*s/2,y:bx.y+bx.h/2-bx.h*s/2,w:bx.w*s,h:bx.h*s};
    zbox(c,bb,t);
    const zp=fitText(c,LAB().zoomBox||P(`放大這裡`,`Zoom in here`),RX0,y,RW0,C.yellow);
    lead(c,zp.x-6,zp.y+zp.h/2,bb.x+bb.w+2,bb.y+bb.h/2,C.yellow);
    textBlock(c,P(`挑一個小點，拉近看。`,`Pick one dot and look closer.`),RX0,zp.y+zp.h+40,RW0,C.white);
    c.restore();}
  bottomBlock(c,aiP(),RX0,590,RW0,C.muted);bottomBlock(c,MARK,RX0,556,RW0,C.muted);
  c.restore();
}

// ── step 1: sorus ──────────────────────────────────────────────────────────
function over1(c,a,tau,t,L,S){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const bx=boxOf(L,CS),s=mix(3,1,smooth(clamp((tau-.9)/.6))),bb={x:bx.x+bx.w/2-bx.w*s/2,y:bx.y+bx.h/2-bx.h*s/2,w:bx.w*s,h:bx.h*s};
  chainLabel(c,UNDER,T1.x+T1.w/2,44);
  if(S)cone(c,bb,S.r,'right',t,clamp((tau-1.6)/.2));
  zbox(c,bb,t,fade(tau,.9,.3));
  const b=title(c,P(`拉近一個小點`,`Zoom in on one dot`));
  const la=fade(tau,2.7,.5);
  if(la>0&&S){c.save();c.globalAlpha*=la;
    const [x,y]=map(S,602,394),k=kOf(S);ring(c,x,y,15*k,t,1,BROWN);
    const sp=fitText(c,LAB().sori||P(`孢子囊堆`,`Sorus (group of sporangia)`),RX,Math.max(b.y+b.h+60,180),RW,BROWN);
    lead(c,sp.x-6,sp.y+sp.h/2,x+15*k+4,y,BROWN);
    let yy=sp.y+sp.h+40;
    textBlock(c,P(`一個小點，是許多孢子囊聚在一起。`,`One dot is many sporangia packed together.`),RX,yy,RW,C.white);
    c.restore();
    c.save();c.globalAlpha*=fade(tau,3.4,.5);
    fitText(c,P(`不是蟲卵，也不是種子`,`Not insect eggs, not a seed`),Z.x+Z.w/2,Z.y+Z.h+12,Z.w,C.green,{align:'center'});
    c.restore();}
  notes(c);
  c.restore();
}

// ── step 2: sporangia ──────────────────────────────────────────────────────
function over2(c,a,tau,t,L,S,G){
  if(a<=0)return;c.save();c.globalAlpha*=a;const Lb=LAB();
  chainLabel(c,UNDER,T1b.x+T1b.w/2,44);
  const b1=boxOf(L,CS);cone(c,b1,S.r,'down',t);zbox(c,b1,t);
  chainLabel(c,SORUS_NAME,T2.x+T2.w/2,S.r.y+S.r.h+28);
  const bx=boxOf(S,CS2),s=mix(2.6,1,smooth(clamp((tau-.9)/.6))),bb={x:bx.x+bx.w/2-bx.w*s/2,y:bx.y+bx.h/2-bx.h*s/2,w:bx.w*s,h:bx.h*s};
  if(G)cone(c,bb,G.r,'right',t,clamp((tau-1.6)/.2));
  zbox(c,bb,t,fade(tau,.9,.3));
  const b=title(c,P(`再拉近`,`Closer still`));
  const la=fade(tau,2.7,.5);
  if(la>0&&G){c.save();c.globalAlpha*=la;
    // "opened" on the two split sporangia, above the frame
    const OPEN=P(`打開了`,`Opened`);
    [[SPG_PT.open1,Z.x+150],[SPG_PT.open2,Z.x+Z.w-70]].forEach(([pp,cx],i)=>{const [x,y]=map(G,...pp);
      const o=fitText(c,OPEN,cx,12,200,C.orange,{align:'center'});lead(c,o.x+o.w/2,o.y+o.h,x,y-4,C.orange);ring(c,x,y,9,t+i*.4,1,C.orange);});
    // labels in the right column, each kept below the one before
    let y0=b.y+b.h+16;
    const put=(p,pt,col,dy=0)=>{const [x,y]=map(G,...pt);const want=y-22+dy,yy=Math.max(y0,want);const f=fitText(c,p,RX,yy,RW,col);
      lead(c,f.x-6,f.y+Math.min(f.h/2,20),x,y,col);y0=f.y+f.h+12;return f;};
    put(Lb.sporangium||P(`孢子囊`,`Sporangium`),SPG_PT.body,BROWN,-40);
    put(Lb.annulus||P(`環帶（示意）`,`Ring of cells (schematic)`),SPG_PT.ring,C.white);
    put(P(`柄`,`Stalk`),SPG_PT.stalk,C.white);
    c.restore();
    c.save();c.globalAlpha*=fade(tau,3.4,.5);
    fitText(c,P(`成熟時裂開：環帶像彈簧，把孢子彈出來`,`When ripe it splits: the ring springs and flings the spores out`),Z.x+Z.w/2,Z.y+Z.h+12,Z.w,C.green,{align:'center'});
    c.restore();}
  notes(c);
  c.restore();
}

// ── step 3: spores released ────────────────────────────────────────────────
const RN=K.rng(1022),PARTS=[...Array(84)].map((_,i)=>({m:i%2,ph:RN(),ang:(RN()-.5)*.95,sp:.6+RN()*.7,sz:.8+RN()*.55,wob:RN()*TAU,life:2.8+RN()*1.6,lift:.5+RN()*.8}));
function particles(c,G,t,a){
  if(a<=0)return;const k=kOf(G);c.save();c.globalAlpha*=a;c.beginPath();c.roundRect(Z.x,Z.y,Z.w,Z.h,RAD(Z));c.clip();
  PARTS.forEach(q=>{const age=mod(t/q.life+q.ph),m=MOUTH[q.m],[mx,my]=map(G,...m.p),ang=m.a+q.ang,d=(1-Math.pow(1-age,1.6))*q.sp*300*k;
    const x=mx+Math.cos(ang)*d+Math.sin(t*1.3+q.wob)*7*age,y=my+Math.sin(ang)*d-age*age*q.lift*120*k;
    const al=age<.06?age/.06:1-smooth((age-.45)/.55);if(al<=0)return;
    const r=(4.2*q.sz)*(k/.45);c.save();c.globalAlpha*=al;
    circle(c,x,y,r+1.6,rgba('#f2e6c8',.22),null);circle(c,x,y,r,SPORE,SPORE_EDGE,1.4);circle(c,x-r*.3,y-r*.3,r*.3,rgba('#f4d9b0',.7),null);c.restore();});
  c.restore();
}
function over3(c,a,tau,t,L,S,G,Q){
  if(a<=0)return;c.save();c.globalAlpha*=a;const Lb=LAB();
  chainLabel(c,UNDER,T1b.x+T1b.w/2,44);
  const b1=boxOf(L,CS);cone(c,b1,S.r,'down',t);zbox(c,b1,t);
  chainLabel(c,SORUS_NAME,T2.x+T2.w/2,S.r.y+S.r.h+28);
  const b2=boxOf(S,CS2);cone(c,b2,G.r,'right',t);zbox(c,b2,t);
  particles(c,G,t,fade(tau,.3,.6));
  title(c,P(`孢子散出來`,`Spores are released`));
  c.save();c.globalAlpha*=fade(tau,1,.5);
  const [px,py]=map(G,770,150),sp=fitText(c,P(`孢子（示意）`,`Spores (schematic)`),Z.x+Z.w-110,12,300,BROWN,{align:'center'});
  lead(c,sp.x+sp.w/2,sp.y+sp.h,px,py,BROWN);
  c.restore();
  if(Q){c.save();c.globalAlpha*=fade(tau,1.6,.5);
    const cb=boxOf(G,[SPG_PT.cloud[0]-55,SPG_PT.cloud[1]-55,110,110]);cone(c,cb,Q.r,'right',t);zbox(c,cb,t);
    const f=fitText(c,Lb.spores||P(`孢子`,`Spores`),RX+RW/2,Q.r.y-50,RW,BROWN,{align:'center',active:true});
    let y=Q.r.y+Q.r.h+36;
    y+=textBlock(c,P(`很小、褐色的小粒，隨風散開。`,`Tiny brown specks, carried off by the wind.`),RX,y,RW,C.white)+8;
    textBlock(c,P(`一個孢子是一個細胞。`,`A spore is a single cell.`),RX,y,RW,C.white);
    c.restore();}
  c.save();c.globalAlpha*=fade(tau,2.4,.5);
  fitText(c,P(`孢子從裂開的孢子囊飄出來`,`Spores drift out of the split sporangia`),Z.x+Z.w/2,Z.y+Z.h+12,Z.w,C.green,{align:'center'});
  c.restore();
  notes(c);
  c.restore();
}
// right-column top of the close-up (below the title and its "spores" pill)
function closeY(c){const one=measure(c,P(`孢子散出來`,`Spores are released`),22)+28<=RW;return(one?56:85)+16+40+10;}

// ── step 4: a spore is not a seed ──────────────────────────────────────────
function over4(c,a,tau,t,O,PNq){
  if(a<=0)return;c.save();c.globalAlpha*=a;const Lb=LAB();
  c.save();c.globalAlpha*=fade(tau,.3,.5);
  fitText(c,P(`一個孢子`,`One spore`),ONE.cx,14,300,BROWN,{align:'center',active:true});
  fitText(c,Lb.peanut||P(`花生種子`,`Peanut seed`),PR.x+PR.w/2,8,320,C.white,{align:'center',active:true});
  c.restore();
  // ≠ (drawn)
  c.save();c.globalAlpha*=fade(tau,.8,.5);const nx=330,ny=200,pu=1+.06*Math.sin(t*2.2);
  c.translate(nx,ny);c.scale(pu,pu);c.lineCap='round';
  [[-26,-11,26,-11],[-26,11,26,11],[14,-32,-14,32]].forEach(([x0,y0,x1,y1])=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.8),11);line(c,[[x0,y0],[x1,y1]],C.yellow,6);});
  c.restore();
  // spore side
  c.save();c.globalAlpha*=fade(tau,1.2,.5);
  const oc=fitText(c,P(`一個細胞，沒有胚`,`One cell, no embryo`),ONE.cx,ONE.cy+ONE.r+16,290,BROWN,{align:'center'});
  textBlock(c,P(`孢子很小（圖已放大）`,`Spores are tiny (enlarged here)`),ONE.cx,oc.y+oc.h+30,280,C.muted,{align:'center',lh:28});
  c.restore();
  // seed side: labels right of the peanut, kept in order
  c.save();c.globalAlpha*=fade(tau,1.8,.5);
  const cz=Lb.cotyledon||P(`子葉`,`Seed leaf`),fz=Lb.food||P(`養分`,`Stored food`);
  const COT=P(`${cz[0]}（存${fz[0]}）`,`${cz[1]} (${fz[1].toLowerCase()})`);
  let y0=60;const LX=PR.x+PR.w+26,LW=940-LX;
  const put=(p,pt,col,i)=>{const [x,y]=map(PNq,...pt);const yy=Math.max(y0,y-20);const f=fitText(c,p,LX,yy,LW,col);lead(c,f.x-6,f.y+Math.min(f.h/2,20),x,y,col);ring(c,x,y,9,t+i*.4,1,col);y0=f.y+f.h+14;};
  put(COT,PN_PT.cot,C.sand,0);
  put(Lb.coat||P(`種皮`,`Seed coat`),PN_PT.coat,C.white,1);
  put(Lb.embryo||P(`胚`,`Embryo`),PN_PT.embryo,C.green,2);
  c.restore();
  // conclusion
  c.save();c.globalAlpha*=fade(tau,2.6,.6);
  const cw=760,cx0=480-cw/2,cy0=420,msg=P(`孢子只有一個細胞；種子裡有胚、養分和種皮。`,`A spore is one cell; a seed holds an embryo, stored food and a seed coat.`),rows=rowsOf(c,msg,cw-48),ch=26+34+rows.length*28+8;
  D.round(c,cx0,cy0,cw,ch,16,'rgba(11,26,21,.94)',null);
  c.save();c.beginPath();c.roundRect(cx0,cy0,cw,ch,16);c.strokeStyle=C.yellow;c.lineWidth=3;c.stroke();c.restore();
  text(c,Lb.notSeed||P(`孢子不是種子`,`A spore is not a seed`),480,cy0+40,28,C.yellow,'center');
  rows.forEach((r,i)=>text(c,r,480,cy0+74+i*28,22,C.white,'center'));
  c.restore();
  const ai=aiP(),nt=P(`${ai[0]}・兩張圖放大的倍數不同，不能比大小`,`${ai[1]} · enlarged by different amounts; do not compare sizes`);
  bottomBlock(c,nt,480,590,920,C.muted,{align:'center'});
  c.restore();
}

// ── scenes ─────────────────────────────────────────────────────────────────
function scene(c,j,tau,t){
  if(j===0){const L=mkLeaf(R0,t);return{items:[L],over:(c,a)=>over0(c,a,tau,t,L)};}
  if(j===1){const L=mkLeaf(lerpR(R0,T1,smooth(clamp(tau/.9))),t),g=smooth(clamp((tau-1.6)/1));
    let S=null;if(tau>1.6){const bx=boxOf(mkLeaf(T1,t),CS);S=mkSorus(lerpR(bx,Z,g),t,clamp((tau-1.6)/.15));}
    return{items:S?[L,S]:[L],over:(c,a)=>over1(c,a,tau,t,L,S)};}
  if(j===2){const s1=smooth(clamp(tau/.9)),L=mkLeaf(lerpR(T1,T1b,s1),t),S=mkSorus(lerpR(Z,T2,s1),t),g=smooth(clamp((tau-1.6)/1));
    let G=null;if(tau>1.6){const bx=boxOf(mkSorus(T2,t),CS2);G=mkSpor(lerpR(bx,Z,g),t,clamp((tau-1.6)/.15));}
    return{items:G?[L,S,G]:[L,S],over:(c,a)=>over2(c,a,tau,t,L,S,G)};}
  if(j===3){const L=mkLeaf(T1b,t),S=mkSorus(T2,t),G=mkSpor(Z,t),Q=tau>1.6?mkClose(closeY(c),t,fade(tau,1.6,.5)):null;
    return{items:Q?[L,S,G,Q]:[L,S,G],over:(c,a)=>over3(c,a,tau,t,L,S,G,Q)};}
  const O=mkOne(t),PNq=mkPeanut(t);
  return{items:[O,PNq],over:(c,a)=>over4(c,a,tau,t,O,PNq)};
}
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.zm||(s.zm={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  const u=smooth((t-st.T)/.9),cross=st.from>=0&&u<1;
  const cur=scene(c,k,tau,t),old=cross?scene(c,st.from,st.fromTau+(t-st.T),t):null;
  st.tau=tau;
  // a picture in both steps glides from its old place to its new one; the others are sequenced, old out then new in
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),list=[];
  if(old)old.items.forEach(q=>list.push(Object.assign({},q,{o:true})));
  cur.items.forEach(q=>{const i=list.findIndex(o=>o.id===q.id);
    if(i>=0){const o=list[i],r=sameR(o.r,q.r)?q.r:lerpR(o.r,q.r,u);list[i]=Object.assign({},q,{r,a:o.a*(1-u)+q.a*u});}
    else list.push(Object.assign({},q,{a:old?q.a*aIn:q.a}));});
  list.forEach(q=>{if(q.o)q.a*=aOut;});
  list.forEach(q=>drawItem(c,q));
  if(old)old.over(c,aOut);
  cur.over(c,old?aIn:1);
}
window.PlantsDraw.zoom=draw;
})();

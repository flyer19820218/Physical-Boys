/* Animals · "Compare: two tables" canvas (phyla tab, view 1), 2026-10-23.
 * Two steps; the table text is window.AnimalsKit.CMP (written in animals_diversity_1023_v1.js), not copied here.
 *  0 annelid vs arthropod: earthworm (cropped to its straight stretch) and crab (same picture as unit 2).
 *  1 cnidarian vs echinoderm: moon jelly and sea star (top side and underside, side by side).
 * Layout: a narrow left column ("AI illustration", "marks are schematic"), two picture cards on top that are
 *   the column heads (cyan group name + animal name), the table underneath with the same three columns.
 *   Rows light one at a time (yellow row label, white cells, a yellow band on the current row); while a row is lit,
 *   the program marks that structure on both pictures (yellow evidence marks, pink count marks) with a short tag.
 *   The last row "easy to confuse" spans both cells in orange and stays (orange pulsing frame, orange tags on both
 *   pictures: "segmented" / "not left-right symmetrical").
 *   Row heights come from the wrapped text (22 px, never shrunk); the padding grows in Chinese, and the cards take
 *   what is left above the table, so the whole table is always on the canvas (no scrolling needed: the tallest case,
 *   English step 0, is 381 px).
 * Tags are placed by the program: the pictures and marks are drawn once off-screen, and each tag takes the free spot
 *   in its card with the fewest opaque pixels, close to its target (cached per step, row and language).
 * All points (ring grooves, joints, tentacle fringe, gonads, arm tips, spines, tube feet, mouths) were measured once
 * from the PNG alpha/colour (the same measurements as animals_draw_phyla_1023_v1.js, plus arm tips and gonads).
 * Step changes (0.9 s): old step fades out, new fades in.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,MONO}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=2,PER=20,ROW0=.8,DT=2.6;
const FRAME_BG='#16332b',PINK=C.pink,CYAN=C.cyan,ORANGE=C.orange,YELLOW=C.yellow;

// ── layout (canvas px) ─────────────────────────────────────────────────────
const TX=20,LW=150,CW=385,TW=LW+2*CW,LH=27,BOT=592;

// ── measured from the PNGs (image px) ──────────────────────────────────────
const EW='earthworm.png',CR='crab.png',JF='jellyfish.png',ST='seastar_top.png',SU='seastar_under.png';
// earthworm: ring grooves on the straight stretch (dark minima along the body axis), unit normal, half body width ≈ 57
const GROOVES=[[623,414],[649,405],[678,395],[708,385],[741,373],[772,362],[807,350],[837,339],[868,328],[898,318],[926,308]];
const WN=[.330,.944],HW=55;
const EW_VIEW=[470,170,560,320];
// crab: cephalothorax ellipse [cx,cy,a,b,angle], leg and claw joints, one right leg from body to tip
const CEPH=[224.2,158.8,105,78,3.12];
const JOINTS=[[358,163],[392,171],[426,190],[360,200],[402,262],[372,112],[388,78]];
const LEG=[[326,176],[334,176],[359,168],[386,170],[418,186],[425,192],[435,206],[441,223]];
// moon jelly: tentacle fringe, the four gonads (pink, r−g > 28), bell centre, the mouth opening between the oral arms
const CNIDO=[[89,552],[114,552],[139,552],[169,552],[216,552],[257,552],[124,576],[229,576],[184,588],[99,600],[224,600],[259,564]];
const GONADS=[[345,165],[530,150],[370,262],[560,245]];
const JF_C=[452,205],JF_MOUTH=[462,478];
// sea star top: centroid, five arm tips (alpha extremes per angle, pulled 7 % toward the centre), spine tips;
// underside: centroid (= mouth), tube feet (bright bulbs) along the right arm
const ST_C=[535,548];
const TIPS=[[527,9],[1053,362],[848,983],[221,984],[6,375]].map(([x,y])=>[mix(x,ST_C[0],.07),mix(y,ST_C[1],.07)]);
const SPINES=[[452,126],[439,185],[427,256],[95,344],[147,352],[235,360],[297,367]];
const SU_C=[529,535],FEET=[[678,497],[721,467],[787,453],[858,439],[904,423],[961,404]];

// ── labels added by this module (LAB has none for these) ───────────────────
const T={
 rings:P(`一環一環重複`,`Repeated rings`),soft:P(`柔軟，沒有外骨骼`,`Soft, no exoskeleton`),noLegs:P(`沒有腳`,`No legs`),
 muscle:P(`體壁肌肉伸縮（示意）`,`Body-wall muscles (schematic)`),
 region:P(`頭胸部（分區）`,`Cephalothorax (a region)`),joints:P(`關節`,`Joints`),walk:P(`用有關節的腳走`,`Walks on jointed legs`),
 segmented:P(`分節`,`Segmented`),
 cnido:P(`刺絲胞（示意）`,`Cnidocytes (schematic)`),radial:P(`輻射對稱`,`Radial symmetry`),oneOpening:P(`一個開口：口兼肛門`,`One opening: mouth and anus`),
 spines:P(`棘`,`Spines`),tubeFeet:P(`管足`,`Tube feet`),five:P(`五輻對稱`,`Five-fold radial`),
 mouthUnder:P(`口（腹面）`,`Mouth (underside)`),anusTop:P(`肛門在背面（示意）`,`Anus on the top side (schematic)`),
 notLR:P(`不是左右對稱`,`Not left-right symmetrical`),
 topSide:P(`背面`,`Top side`),underSide:P(`腹面`,`Underside`),
 marks:P(`圖上標記：示意`,`Marks: schematic`)
};
const ANIMALS=[['earthworm','蚯蚓','Earthworm'],['crab','蟹','Crab'],['jellyfish','月水母','Moon jelly'],['seastar','海星','Sea star']];

// ── text helpers (as in animals_draw_molt_1023_v1.js) ──────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
function boxSize(c,p,maxW,size=22){const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  return{rows,w,h:rows.length*(size+7)+11};}
function fitText(c,p,x,y,maxW,col,{active=false,size=22}={}){
  const {rows,w,h}=boxSize(c,p,maxW,size),lh=size+7;
  D.round(c,x,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();c.beginPath();c.roundRect(x,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(col,.85);c.lineWidth=2;c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,x+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x,y,w,h};
}
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
function leadFrom(c,b,x,y,col){const cy=b.y+b.h/2;let x0=Math.max(b.x+10,Math.min(b.x+b.w-10,x)),y0=Math.max(b.y,Math.min(b.y+b.h,y));
  if(x0>b.x+10&&x0<b.x+b.w-10&&y0>b.y&&y0<b.y+b.h)y0=y<cy?b.y:b.y+b.h;
  if(x<b.x&&y>b.y+8&&y<b.y+b.h-8){x0=b.x;y0=y;}else if(x>b.x+b.w&&y>b.y+8&&y<b.y+b.h-8){x0=b.x+b.w;y0=y;}
  if(Math.hypot(x-x0,y-y0)>8)lead(c,x0,y0,x,y,col);}
// pink count marker, 20 px number
function count(c,x,y,n,a,r=13){if(a<=0)return;c.save();c.globalAlpha*=a;
  circle(c,x,y,r+3,rgba(C.deep,.7),null);circle(c,x,y,r,PINK,C.ink,2);
  c.font=MONO(20);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function ring(c,x,y,r,col,t,a=1,dash=true){if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,null,rgba(C.deep,.75),5);
  if(dash){c.setLineDash([5,4]);c.lineDashOffset=-t*10;}circle(c,x,y,r,null,col,2.4);c.restore();}
function poly(c,pts,col,w,t,a=1,dash=[9,6]){if(a<=0)return;c.save();c.globalAlpha*=a;c.lineCap='round';c.lineJoin='round';
  c.beginPath();pts.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=rgba(C.deep,.75);c.lineWidth=w+4;c.stroke();
  if(dash){c.setLineDash(dash);c.lineDashOffset=-t*16;}c.beginPath();pts.forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();}

// ── table geometry (per step and language) ─────────────────────────────────
function geom(c,k){const T0=K.CMP[k],rows=T0.rows,n=rows.length+1,lines=[];
  rows.forEach(r=>lines.push(Math.max(rowsOf(c,r[0],LW-24).length,rowsOf(c,r[1],CW-28).length,rowsOf(c,r[2],CW-28).length)));
  lines.push(Math.max(rowsOf(c,L('confuse','容易混淆','Easy to confuse'),LW-24).length,rowsOf(c,T0.confuse,2*CW-28).length));
  const content=lines.reduce((a,b)=>a+b,0)*LH,pad=Math.max(14,Math.min(26,(BOT-18-252-content)/n));
  const hs=lines.map(l=>l*LH+pad),TH=hs.reduce((a,b)=>a+b,0)+8,TY=BOT-TH,cardH=TY-10-8;
  const ys=[];let y=TY+4;hs.forEach(h=>{ys.push(y);y+=h;});
  return{n,lines,hs,ys,TH,TY,cardH};}

// ── picture cards ──────────────────────────────────────────────────────────
const cardOf=(side,g)=>({x:TX+LW+side*CW+4,y:8,w:CW-8,h:g.cardH});
// fit a view window [vx,vy,vw,vh] of a picture into box b; returns rect + image→canvas map
function fitView(f,v,b,align){const k=Math.min(b.w/v[2],b.h/v[3]),w=v[2]*k,h=v[3]*k,x=align==='left'?b.x+Math.min(14,(b.w-w)/2):b.x+(b.w-w)/2,y=b.y+(b.h-h)/2;
  return{f,v,k,x,y,w,h,M:(ix,iy)=>[x+(ix-v[0])*k,y+(iy-v[1])*k]};}
// the pictures of one card (step k, side 0/1)
function picsOf(k,side,card){const PR={x:card.x+8,y:card.y+52,w:card.w-16,h:card.h-60};
  if(k===0&&side===0)return[fitView(EW,EW_VIEW,PR)];
  if(k===0&&side===1){const [W,H]=dim(CR);return[fitView(CR,[0,0,W,H],PR,'left')];}// left: the tags go to the free space on the right, beside the marked legs
  if(k===1&&side===0){const [W,H]=dim(JF);return[fitView(JF,[0,0,W,H],PR)];}
  const hw=(PR.w-10)/2,h=PR.h-30,[W1,H1]=dim(ST),[W2,H2]=dim(SU);
  return[fitView(ST,[0,0,W1,H1],{x:PR.x,y:PR.y,w:hw,h}),fitView(SU,[0,0,W2,H2],{x:PR.x+hw+10,y:PR.y,w:hw,h})];}
function drawPics(c,ps,card){for(const r of ps){const im=pic(src(r.f));
  if(!im){c.save();c.setLineDash([6,6]);D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(C.muted,.4));c.restore();continue;}
  c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();c.drawImage(im,r.v[0],r.v[1],r.v[2],r.v[3],r.x,r.y,r.w,r.h);c.restore();
  if(r.f===EW){// soft edges where the window cuts the worm
    const F=26;[['l',r.x],['r',r.x+r.w]].forEach(([s,x])=>{const g=c.createLinearGradient(x,0,s==='l'?x+F:x-F,0);g.addColorStop(0,rgba(FRAME_BG,1));g.addColorStop(1,rgba(FRAME_BG,0));c.fillStyle=g;c.fillRect(s==='l'?x-1:x-F,r.y-1,F+1,r.h+2);});
    const g=c.createLinearGradient(0,r.y+r.h,0,r.y+r.h-F);g.addColorStop(0,rgba(FRAME_BG,1));g.addColorStop(1,rgba(FRAME_BG,0));c.fillStyle=g;c.fillRect(r.x-1,r.y+r.h-F,r.w+2,F+1);}}
  if(ps.length===2)[T.topSide,T.underSide].forEach((p,i)=>text(c,p,ps[i].x+ps[i].w/2,card.y+card.h-10,22,C.muted,'center'));}
function cardFrame(c,k,side,card,t,lit){
  c.save();c.beginPath();c.roundRect(card.x,card.y,card.w,card.h,14);c.fillStyle=FRAME_BG;c.fill();
  c.strokeStyle=rgba(CYAN,lit?.5+.25*Math.sin(t*2.4):.5);c.lineWidth=2;c.stroke();c.restore();
  const g=K.CMP[k].head[side],pl=fitText(c,g,card.x+8,card.y+8,card.w-16,CYAN,{active:true}),A=ANIMALS[k*2+side];
  text(c,L(...A),pl.x+pl.w+12,pl.y+pl.h/2+8,22,C.white);
  return pl;}

// ── marks per step / row / side: draw(c,ps,t,a) and the tags [{p,to:[x,y],col}] ─
const nrm=(g,s)=>[g[0]+s*HW*WN[0],g[1]+s*HW*WN[1]];
const MK=[
 // step 0: earthworm | crab
 [[// 0 body
   {d:(c,[r],t,a,tau)=>GROOVES.forEach((g,i)=>{const q=fade(tau,.15+i*.12,.25);poly(c,[r.M(...nrm(g,-1)),r.M(...nrm(g,1))],PINK,3,t,a*q,null);}),tags:([r])=>[{p:T.rings,to:r.M(...GROOVES[5]),col:YELLOW}]},
   {d:(c,[r],t,a)=>{c.save();c.globalAlpha*=a;const e=CEPH,[x,y]=r.M(e[0],e[1]);ellipse(c,x,y,e[2]*r.k,e[3]*r.k,rgba(YELLOW,.08),rgba(C.deep,.75),6,e[4]);c.setLineDash([8,6]);c.lineDashOffset=-t*14;ellipse(c,x,y,e[2]*r.k,e[3]*r.k,null,YELLOW,2.6,e[4]);c.restore();},
    tags:([r])=>[{p:T.region,to:r.M(150,110),col:YELLOW}]}],
  [// 1 exoskeleton
   {d:(c,[r],t,a)=>{const up=GROOVES.map(g=>r.M(...nrm(g,-1))),dn=GROOVES.map(g=>r.M(...nrm(g,1))).reverse();poly(c,[...up,...dn,up[0]],YELLOW,2.6,t,a);},tags:([r])=>[{p:T.soft,to:r.M(...nrm(GROOVES[3],-1)),col:YELLOW}]},
   {d:(c,[r],t,a)=>{c.save();c.globalAlpha*=a*(.75+.25*Math.sin(t*3));const e=CEPH,[x,y]=r.M(e[0],e[1]);ellipse(c,x,y,e[2]*r.k,e[3]*r.k,rgba(YELLOW,.16),rgba(C.deep,.75),6,e[4]);ellipse(c,x,y,e[2]*r.k,e[3]*r.k,null,YELLOW,3,e[4]);c.restore();},
    tags:([r])=>[{p:L('exoskeleton','外骨骼','Exoskeleton'),to:r.M(225,120),col:YELLOW}]}],
  [// 2 limbs
   {d:(c,[r],t,a)=>{[2,6,9].forEach(i=>{const [x,y]=r.M(...nrm(GROOVES[i],1.08));ring(c,x,y,9,YELLOW,t,a);});},tags:([r])=>[{p:T.noLegs,to:r.M(...nrm(GROOVES[6],1.08)),col:YELLOW}]},
   {d:(c,[r],t,a,tau)=>JOINTS.forEach((p,i)=>{const [x,y]=r.M(...p);ring(c,x,y,8,YELLOW,t,a*fade(tau,.1+i*.12,.25),false);}),tags:([r])=>[{p:T.joints,to:r.M(...JOINTS[1]),col:YELLOW}]}],
  [// 3 movement
   {d:(c,[r],t,a)=>{c.save();c.globalAlpha*=a;for(let w=0;w<2;w++){const q=mod(t*.25+w/2)*(GROOVES.length-1),i=Math.min(GROOVES.length-2,Math.floor(q)),u=q-i,g=[mix(GROOVES[i][0],GROOVES[i+1][0],u),mix(GROOVES[i][1],GROOVES[i+1][1],u)];
      const a0=r.M(...nrm(g,-1)),a1=r.M(...nrm(g,1)),ang=Math.atan2(a1[1]-a0[1],a1[0]-a0[0]);ellipse(c,(a0[0]+a1[0])/2,(a0[1]+a1[1])/2,Math.hypot(a1[0]-a0[0],a1[1]-a0[1])/2+3,Math.max(5,30*r.k),rgba(YELLOW,.42),YELLOW,2,ang);}c.restore();},
    tags:([r])=>[{p:T.muscle,to:r.M(...GROOVES[4]),col:YELLOW}]},
   {d:(c,[r],t,a)=>{poly(c,LEG.map(p=>r.M(...p)),YELLOW,3,t,a);JOINTS.slice(0,3).forEach((p,i)=>{const [x,y]=r.M(...p);ring(c,x,y,7+2*Math.max(0,Math.sin(t*3-i)),YELLOW,t,a,false);});},
    tags:([r])=>[{p:T.walk,to:r.M(...LEG[4]),col:YELLOW}]}],
  [{d:null,tags:()=>[]},{d:null,tags:()=>[]}],// 4 examples
  [// 5 easy to confuse: both segmented
   {d:(c,[r],t,a)=>GROOVES.forEach(g=>poly(c,[r.M(...nrm(g,-1)),r.M(...nrm(g,1))],PINK,3,t,a,null)),tags:([r])=>[{p:T.segmented,to:r.M(...GROOVES[7]),col:ORANGE}]},
   {d:(c,[r],t,a)=>{poly(c,LEG.map(p=>r.M(...p)),ORANGE,2.6,t,a);JOINTS.forEach(p=>{const [x,y]=r.M(...p);ring(c,x,y,7,PINK,t,a,false);});},tags:([r])=>[{p:T.segmented,to:r.M(...JOINTS[0]),col:ORANGE}]}]],
 // step 1: moon jelly | sea star (top, underside)
 [[// 0 key structure
   {d:(c,[r],t,a,tau)=>CNIDO.forEach((p,i)=>{const [x,y]=r.M(...p),q=fade(tau,.1+i*.08,.25),fl=.5+.5*Math.sin(t*4+i*1.7);c.save();c.globalAlpha*=a*q;
      circle(c,x,y,4.5,YELLOW,C.ink,1.2);if(fl>.8){line(c,[[x,y],[x+(i%2?6:-6),y+9]],YELLOW,1.6);}c.restore();}),tags:([r])=>[{p:T.cnido,to:r.M(...CNIDO[4]),col:YELLOW}]},
   {d:(c,[r,u],t,a,tau)=>{SPINES.forEach((p,i)=>{const [x,y]=r.M(...p);ring(c,x,y,6,YELLOW,t,a*fade(tau,.1+i*.1,.25),false);});poly(c,FEET.map(p=>u.M(...p)),YELLOW,3,t,a*fade(tau,1,.4));},
    tags:([r,u])=>[{p:T.spines,to:r.M(...SPINES[1]),col:YELLOW},{p:T.tubeFeet,to:u.M(...FEET[3]),col:YELLOW}]}],
  [// 1 symmetry
   {d:(c,[r],t,a,tau)=>{const [cx,cy]=r.M(...JF_C);GONADS.forEach((p,i)=>{const [x,y]=r.M(...p);c.save();c.globalAlpha*=a;dashed(c,[[cx,cy],[x,y]],rgba(YELLOW,.9),2,[5,4],-t*10);c.restore();});
      GONADS.forEach((p,i)=>{const [x,y]=r.M(...p);count(c,x,y,i+1,a*fade(tau,.2+i*.3,.25));});},tags:([r])=>[{p:T.radial,to:r.M(...JF_C),col:YELLOW}]},
   {d:(c,[r],t,a,tau)=>{const [cx,cy]=r.M(...ST_C);TIPS.forEach(p=>{c.save();c.globalAlpha*=a;dashed(c,[[cx,cy],r.M(...p)],rgba(YELLOW,.9),2,[5,4],-t*10);c.restore();});
      TIPS.forEach((p,i)=>{const [x,y]=r.M(...p);count(c,x,y,i+1,a*fade(tau,.2+i*.3,.25));});},tags:([r])=>[{p:T.five,to:r.M(...ST_C),col:YELLOW}]}],
  [// 2 digestion
   {d:(c,[r],t,a)=>{const [x,y]=r.M(...JF_MOUTH);ring(c,x,y,10+1.5*Math.sin(t*3),YELLOW,t,a);},tags:([r])=>[{p:T.oneOpening,to:r.M(...JF_MOUTH),col:YELLOW}]},
   {d:(c,[r,u],t,a)=>{const [x,y]=u.M(...SU_C);ring(c,x,y,8+1.5*Math.sin(t*3),YELLOW,t,a);const [ax,ay]=r.M(...ST_C);ring(c,ax,ay,6,YELLOW,t,a);},
    tags:([r,u])=>[{p:T.mouthUnder,to:u.M(...SU_C),col:YELLOW},{p:T.anusTop,to:r.M(...ST_C),col:YELLOW}]}],
  [{d:null,tags:()=>[]},{d:null,tags:()=>[]}],// 3 examples
  [// 4 easy to confuse: neither is left-right symmetrical
   {d:(c,[r],t,a)=>{const [cx,cy]=r.M(...JF_C);GONADS.forEach(p=>{c.save();c.globalAlpha*=a;dashed(c,[[cx,cy],r.M(...p)],ORANGE,2.4,[6,4],-t*10);c.restore();});circle(c,cx,cy,5,ORANGE,C.ink,1.5);},
    tags:([r])=>[{p:T.notLR,to:r.M(...JF_C),col:ORANGE}]},
   {d:(c,[r],t,a)=>{const [cx,cy]=r.M(...ST_C);TIPS.forEach(p=>{c.save();c.globalAlpha*=a;dashed(c,[[cx,cy],r.M(...p)],ORANGE,2.4,[6,4],-t*10);c.restore();});circle(c,cx,cy,5,ORANGE,C.ink,1.5);},
    tags:([r])=>[{p:T.notLR,to:r.M(...ST_C),col:ORANGE}]}]]];

// ── tag placement: the free spot with the fewest opaque pixels, near the target ─
const PLACE={};
function placeTags(c,k,row,side,card,ps,names){
  const tags=MK[k][row][side].tags(ps);if(!tags.length)return[];
  const key=[k,row,side,D.tr(P('z','e')),card.h|0].join('|');let hit=PLACE[key];if(hit)return hit;
  const W=Math.ceil(card.w),H=Math.ceil(card.h),off=document.createElement('canvas');off.width=W;off.height=H;const g=off.getContext('2d');
  g.translate(-card.x,-card.y);let ok=true;
  for(const r of ps){const im=pic(src(r.f));if(!im){ok=false;continue;}g.drawImage(im,r.v[0],r.v[1],r.v[2],r.v[3],r.x,r.y,r.w,r.h);}
  const m=MK[k][row][side];if(m.d)m.d(g,ps,0,1,99);
  g.fillStyle='#fff';g.fillRect(names.x-4,names.y-4,card.w,names.h+8);
  if(ps.length===2)g.fillRect(card.x,card.y+card.h-34,card.w,34);
  const al=g.getImageData(0,0,W,H).data,I=new Float64Array((W+1)*(H+1));
  for(let y=0;y<H;y++){let s=0;for(let x=0;x<W;x++){s+=al[(y*W+x)*4+3]>50?1:0;I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+s;}}
  const sum=(x,y,w,h)=>I[(y+h)*(W+1)+x+w]-I[y*(W+1)+x+w]-I[(y+h)*(W+1)+x]+I[y*(W+1)+x];
  const out=[],taken=[];
  for(const tg of tags){const bs=boxSize(c,tg.p,Math.min(240,card.w-16)),bw=Math.ceil(bs.w),bh=Math.ceil(bs.h);let best=null;
    const tx=tg.to[0]-card.x,ty=tg.to[1]-card.y;
    for(let y=4;y+bh<=H-4;y+=3)for(let x=4;x+bw<=W-4;x+=3){
      let cost=sum(x,y,bw,bh);
      for(const o of taken){const ox=Math.min(x+bw,o.x+o.w)-Math.max(x,o.x)+8,oy=Math.min(y+bh,o.y+o.h)-Math.max(y,o.y)+8;if(ox>0&&oy>0)cost+=1e6;}
      const dx=Math.max(x-tx,0,tx-(x+bw)),dy=Math.max(y-ty,0,ty-(y+bh)),d=Math.hypot(dx,dy);cost+=d*6+(d<10?400:0);
      if(!best||cost<best.cost)best={x,y,w:bw,h:bh,cost};}
    taken.push(best);out.push({...tg,x:best.x+card.x,y:best.y+card.y});}
  if(ok)PLACE[key]=out;return out;}

// ── left column: title and notes ───────────────────────────────────────────
function leftColumn(c,g){
  let y=34;for(const p of [L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),T.marks]){const rs=rowsOf(c,p,LW-14);
    if(y+(rs.length-1)*27>g.TY-14)break;rs.forEach((s,j)=>text(c,s,TX+4,y+j*27,22,C.muted));y+=rs.length*27+12;}}

// ── the table ──────────────────────────────────────────────────────────────
function table(c,k,g,tau,t){
  const T0=K.CMP[k],n=g.n,last=n-1,lit=i=>fade(tau,ROW0+i*DT,.5),cur=(()=>{let r=-1;for(let i=0;i<n;i++)if(tau>=ROW0+i*DT)r=i;return r;})();
  c.save();c.beginPath();c.roundRect(TX,g.TY,TW,g.TH,14);c.fillStyle='rgba(11,26,21,.92)';c.fill();c.strokeStyle=rgba(C.edge,1);c.lineWidth=2;c.stroke();c.restore();
  // column separators (not through the merged last row)
  const yEnd=g.ys[last]-2;[TX+LW,TX+LW+CW].forEach(x=>line(c,[[x,g.TY+6],[x,yEnd]],rgba(C.edge,.9),1.5));
  for(let i=0;i<n;i++){const y=g.ys[i],h=g.hs[i],a=lit(i),isLast=i===last,col=isLast?ORANGE:YELLOW;
    if(i)line(c,[[TX+10,y],[TX+TW-10,y]],rgba(C.edge,.7),1);
    if(isLast&&a>0){c.save();c.globalAlpha*=a;D.round(c,TX+5,y+2,TW-10,h-4,10,rgba(ORANGE,.12),null);
      c.beginPath();c.roundRect(TX+5,y+2,TW-10,h-4,10);c.strokeStyle=rgba(ORANGE,.6+.4*Math.sin(t*2.6));c.lineWidth=2.6;c.stroke();c.restore();}
    else if(i===cur&&a>0){c.save();c.globalAlpha*=a*(.8+.2*Math.sin(t*2.6));D.round(c,TX+5,y+2,TW-10,h-4,10,rgba(YELLOW,.1),null);D.round(c,TX+5,y+6,4,h-12,2,YELLOW,null);c.restore();}
    const lab=isLast?L('confuse','容易混淆','Easy to confuse'):T0.rows[i][0];
    const block=(p,x,w,colr,al)=>{const rs=rowsOf(c,p,w),y0=y+(h-rs.length*LH)/2+19;c.save();c.globalAlpha*=al;rs.forEach((s,j)=>text(c,s,x,y0+j*LH,22,colr));c.restore();};
    block(lab,TX+14,LW-24,a>0?col:C.muted,a>0?1:.55);
    if(a>0){if(isLast)block(T0.confuse,TX+LW+14,2*CW-28,ORANGE,a);
      else{block(T0.rows[i][1],TX+LW+14,CW-28,C.white,a);block(T0.rows[i][2],TX+LW+CW+14,CW-28,C.white,a);}}}
  return cur;}

// ── one step's whole picture ──────────────────────────────────────────────
function scene(c,k,tau,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const g=geom(c,k);
  leftColumn(c,g);
  const cur=table(c,k,g,tau,t);
  for(const side of [0,1]){const card=cardOf(side,g),names=cardFrame(c,k,side,card,t,cur===g.n-1),ps=picsOf(k,side,card);
    drawPics(c,ps,card);
    for(let row=0;row<g.n;row++){const m=MK[k][row][side],t0=ROW0+row*DT,isLast=row===g.n-1;
      const ma=isLast?fade(tau,t0+.3,.5):fade(tau,t0+.3,.5)*(1-fade(tau,t0+DT,.4));if(ma<=0)continue;
      if(m.d)m.d(c,ps,t,ma,tau-t0-.3);
      const tg=placeTags(c,k,row,side,card,ps,names);
      c.save();c.globalAlpha*=fade(tau,t0+.6,.5)*(isLast?1:1-fade(tau,t0+DT,.4));
      tg.forEach(o=>{const b=fitText(c,o.p,o.x,o.y,Math.min(240,card.w-16),o.col);leadFrom(c,b,o.to[0],o.to[1],o.col);});c.restore();}}
  c.restore();}

function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.cp||(s.cp={});
  if(st.k===undefined||st.held!==held){st.k=k;st.from=-1;st.T=t-9;st.held=held;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut);
  scene(c,k,tau,t,cross?aIn:1);
}
window.AnimalsDraw.compare=draw;
})();

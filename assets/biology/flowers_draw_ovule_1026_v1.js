/* Flowering plant reproduction · "One tube, one ovule" canvas, view 0 (one ovule), 8 steps, 2026-10-26.
 * Registered as window.PlantsDraw.flowerOvule; page shell, step texts and checks: flowers_ovule_1026_v1.js (OV_*).
 * Steps 2-7 are the 6 steps of plants_draw_ovule_1022_v1.js (copied here, renamed); steps 0-1 are new.
 *
 * Pictures (teacher's Gemini AI illustrations, not photographs):
 *   ovary_single.png (450×906, "O px"): ovary cut lengthwise, mirrored; stigma on top, style with a central channel,
 *     thick ovary wall, empty ovary cavity, ONE anatropous ovule at the lower left on a short stalk, micropyle down.
 *   ovule.png (861×1216, "U px"): one anatropous ovule (see the measurements of the 1022 module below).
 * Measured from ovary_single.png (alpha + a flood fill of the cavity bounded by the dark outline, L < 185):
 *   stigma: cap y 6..57 (x 176..274), top of the alpha at x 225 is y 6; style channel: inner lines x 221 and 228
 *     (centre x 224.5) from y ~125 down to the mouth at y ~388; cavity: y 390..799, inner wall x 48 (y 610) .. 400
 *     (y 600..620), floor y ~797 (x 150..300), rising to y 711 at x 382;
 *   ovule: x 90..267 (y 640), top y 532 (x 174..190), lobes down to y ~750; micropyle (nucellus tip) at (186,722);
 *     stalk right edge x 193 (y 744) .. 191 (y 760) .. 202 (y 796), flaring into the floor;
 *   WALL = the inner wall outline (row extremes + floor columns, smoothed, 78 points, 16 px apart);
 *   TUBE1 = the pollen tube route: stigma → channel centre → then the level set 7 px inside the cavity (distance
 *     transform), from the mouth along the ceiling, the right wall and the floor, up the right side of the stalk
 *     into the micropyle. 7 O px ≈ half the drawn tube width, so the tube's edge lies on the wall line.
 * The two pictures are registered so the small ovule of ovary_single sits on ovule.png: U = U0 + (O − O0)/M with
 *   M = 0.233, O0 = (178.5,750) ↔ U0 = (389,1000) (ovule width 177 ↔ 764, lobe tips y 750 ↔ 1000). One camera in
 *   U px runs all 8 steps; the ovary fades out and ovule.png fades in as the camera zooms (ovA from cam.k).
 * Measured from ovule.png (1022 module): embryo sac centre (400,545), half-width 187, top y 260, bottom ~830;
 *   micropyle notch from y 896 (x 391..413) to the lobe tips at y 1000; stalk left edge (641,1000) → (583,1060) →
 *   (540,1120) → (514,1180); lower side of the right lobe y 1000 (x 475) → 980 (x 550) → 943 (x 610).
 *   The 1022 tube route crossed the open gap below the right lobe; here it hugs the stalk, hops the narrowest gap
 *   and follows the lower side of the right lobe into the micropyle (same start, same end).
 * Steps (step names repeated from OV_SHORT):
 *  0 whole ovary: rings + labels: stigma, style (central channel), ovary wall, ovary cavity, ovule, stalk;
 *  1 a pollen grain lands; the tube grows down the style channel, then HUGS THE CAVITY WALL (ceiling, right wall,
 *    floor) and climbs the stalk into the micropyle; the wall it touches lights up green; chemical signal ripples
 *    from the ovule; a small grey dashed "not this way" line straight across the cavity with ×; route chain;
 *  2 zoom into the ovule, cross-fade to ovule.png; = old step 0 (ovule parts);
 *  3 eight nuclei = old 1;  4 tube at the micropyle = old 2 (+ a small map of the whole route);  5 two sperm = old 3;
 *  6 double fertilization = old 4;  7 becomes a seed = old 5.
 * Camera: each change of step starts from the camera actually on screen (snapshot) and zooms to the new one around
 *   their common fixed point (log scale), so any jump between steps is smooth. Play all: DUR seconds per step
 *   (step 1 is longer); a held step uses K.stageClock. The current step is written back to s.shown.
 * Idle motion in every step: rings dash-rotate, pollen and tube tip glow, dots stream in the tubes, ripples, nuclei
 *   glow, sperm cells wobble, the dot on the route map travels.
 */
(()=>{'use strict';
const K=window.PlantsKit;if(!K)return;
const {P,C,D,text,measure,splitLines,circle,ellipse,glow,arrow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,TAU}=K;
const N=8,DUR=[8,12,8,8,8,8,8,8],TOTAL=DUR.reduce((p,q)=>p+q,0);
let PER=8;
const FILE='ovule.png',[IW,IH]=K.SIZE[FILE];
const OVF='ovary_single.png',[OW,OH]=K.SIZE[OVF];
// colours
const EGG={fill:'#f9a8d4',edge:'#db2777',nuc:'#be185d',lab:C.pink};
const SYN={fill:'#fed7aa',edge:'#ea580c',nuc:'#c2410c',lab:'#fdba74'};
const CEN={fill:'#e9d5ff',edge:'#9333ea',nuc:'#7e22ce',lab:'#d8b4fe'};
const ANT={fill:'#d9f99d',edge:'#65a30d',nuc:'#4d7c0f',lab:'#bef264'};
const TUBE=C.yellow,TUBE_EDGE='#a16207',COAT='#c8a070',STALK='#d9e7b0',PLAC='#86c46a',STRUCT='#efe6c8';
const WALLC=C.green,CAVC='#a5d8ff',OVC='#f0abfc',POLC='#fbbf24',NOPE='#f87171';
// ── geometry of ovule.png (U px, measured) ─────────────────────────────────
const SAC={x:400,y:545,rx:187,ry:285};
// cells (image px): 0 egg, 1-2 synergids, 3-4 polar nuclei (central cell), 5-7 antipodals
const EGGC={x:400,y:668,rx:46,ry:54},SYNC=[{x:353,y:765,rx:37,ry:47},{x:447,y:765,rx:37,ry:47}];
const ANTC=[{x:346,y:338,r:31},{x:400,y:300,r:30},{x:454,y:338,r:31}];
// nuclei in counting order (1..8): egg, synergid L, synergid R, polar L, polar R, antipodal L, top, R
const NUC=[{x:400,y:652,r:18,c:EGG},{x:356,y:752,r:16,c:SYN},{x:444,y:752,r:16,c:SYN},{x:372,y:525,r:20,c:CEN},{x:428,y:525,r:20,c:CEN},
  {x:346,y:340,r:15,c:ANT},{x:400,y:302,r:15,c:ANT},{x:454,y:340,r:15,c:ANT}];
const MARK=[[462,625],[300,735],[500,735],[360,478],[440,478],[300,385],[400,360],[500,385]];   // number markers
const SP1=[452,700],SP2=[476,632],ZYG=[400,652],ENDO=[400,525];
// ── geometry of ovary_single.png (O px, measured) and the O → U registration ─
const M=.233,O0=[178.5,750],U0=[389,1000];
const UX=ox=>U0[0]+(ox-O0[0])/M,UY=oy=>U0[1]+(oy-O0[1])/M;
const WALL=[[229,392],[244,393],[260,393],[276,395],[291,400],[305,408],[318,417],[330,427],[341,439],[352,451],[361,464],[369,477],[376,492],[382,506],[387,521],[392,537],[396,552],[398,568],[400,584],[401,600],[401,615],[400,631],[399,647],[396,663],[393,679],[389,694],[384,709],[378,724],[370,738],[362,751],[353,764],[341,775],[329,785],[315,793],[300,798],[284,800],[268,800],[252,798],[236,797],[220,796],[205,797],[189,798],[173,798],[157,799],[141,797],[126,791],[114,781],[102,770],[91,759],[83,745],[75,731],[68,717],[62,702],[57,687],[54,671],[51,656],[49,640],[48,624],[48,608],[49,592],[50,576],[53,561],[55,545],[59,530],[64,514],[70,500],[78,485],[85,472],[94,458],[103,445],[114,433],[125,422],[137,412],[151,403],[165,396],[181,394],[197,393],[213,392]];
const TUBE1=[[236,4],[233,30],[229,62],[226,96],[224.5,128],[224.5,190],[224.5,250],[224.5,310],[224.5,360],[224.5,382],[227,393],[236,397],[244,397],
  [262,397],[279,402],[295,409],[309,420],[324,431],[336,443],[347,457],[358,472],[366,487],[374,503],[378,520],[384,536],[389,554],[391,571],[393,589],
  [394,607],[393,625],[392,643],[389,660],[386,678],[381,695],[375,712],[367,728],[359,744],[348,758],[336,772],[322,782],[305,789],[288,792],[270,793],
  [252,791],[234,790],[217,789],[203,784],[198,767],[197,752],[194,739],[189,729]];
const PG=[236,-6],RIP=[186,714],MICRO_O=[186,722],XLINE=[[227,400],[266,650]],XMARK=[246.5,525];
// ── cameras (U px): image point (ix,iy) shown at screen (sx,sy), scale k; spot = dimming outside the sac ─────
const KO0=.625,COV={k:KO0*M,ix:UX(225),iy:UY(452),sx:556,sy:305};
const C0={k:.46,ix:430.5,iy:608,sx:598,sy:290},C1={k:.78,ix:400,iy:545,sx:590,sy:292};
const CAMS=[COV,COV,C0,C1,{k:.6,ix:480,iy:800,sx:600,sy:290},{k:1,ix:420,iy:820,sx:590,sy:300},C1,C0]
  .map((q,i)=>({...q,spot:[0,0,0,.62,.22,.42,.62,0][i]}));
let cam={...CAMS[0]};
const X=ix=>cam.sx+(ix-cam.ix)*cam.k,Y=iy=>cam.sy+(iy-cam.iy)*cam.k,S=(ix,iy)=>[X(ix),Y(iy)];
const SO=(ox,oy)=>[X(UX(ox)),Y(UY(oy))],kO=()=>cam.k/M;
// layout: left caption panel, stage on the right
const LP={x:12,y:10,w:274,h:580},LX=26,LW=246;
const RX=760,RW=944-760;
const RX1=704,RW1=944-704;   // right label column in steps 0-1 (the ovary ends at x ~692)

// the camera between two views: a pure zoom about their common fixed point (log scale), else a straight pan
function camLerp(A,B,e){
  const r=Math.log(B.k/A.k),spot=mix(A.spot||0,B.spot||0,e);
  if(Math.abs(r)<.03)return{k:mix(A.k,B.k,e),ix:mix(A.ix,B.ix,e),iy:mix(A.iy,B.iy,e),sx:mix(A.sx,B.sx,e),sy:mix(A.sy,B.sy,e),spot};
  const px=(B.sx-A.sx+A.ix*A.k-B.ix*B.k)/(A.k-B.k),py=(B.sy-A.sy+A.iy*A.k-B.iy*B.k)/(A.k-B.k);
  return{k:A.k*Math.exp(r*e),ix:px,iy:py,sx:A.sx+(px-A.ix)*A.k,sy:A.sy+(py-A.iy)*A.k,spot};
}
// Play all: DUR seconds per step; a held step: K.stageClock
function clock(s,t){
  if(s.phase>=0){const r=stageClock(s,t,N,8);return{k:Math.max(0,Math.min(N-1,r.k)),tau:r.tau,held:true};}
  const q=mod(t-(s.start||0),TOTAL);let k=0,acc=0;while(k<N-1&&q>=acc+DUR[k]){acc+=DUR[k];k++;}
  return{k,tau:q-acc,held:false};
}
const VIEW={k:-1,t:-1e9,tau:0,from:CAMS[0]};

// ── small helpers (as in plants_draw_pollen_1022_v1.js) ────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{const r=splitLines(c,sg,w,size);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}return r;});
function textBlock(c,p,x,y,w,col,{size=22,lh=29,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
function fitRows(c,p,maxW,size=22){const one=measure(c,p,size);return one+28<=maxW&&!D.tr(p).includes('\n')?[D.tr(p)]:rowsOf(c,p,maxW-28,size);}
const fitH=(c,p,maxW,size=22)=>fitRows(c,p,maxW,size).length*(size+7)+11;
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22}={}){
  const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7,h=rows.length*lh+11,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',active?C.white:rgba(col,.85));
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
// a boxed label with leader lines to one or more target points (screen px)
function tagBox(c,p,x,y,maxW,targets,col,a=1,o={}){
  if(a<=0)return null;c.save();c.globalAlpha*=a;
  const r=fitText(c,p,x,y,maxW,col,o);
  (Array.isArray(targets[0])?targets:[targets]).forEach(([tx,ty])=>{
    const ex=tx<r.x?r.x:tx>r.x+r.w?r.x+r.w:tx,ey=ty<r.y?r.y:ty>r.y+r.h?r.y+r.h:r.y+r.h/2;
    line(c,[[ex,ey],[tx,ty]],rgba(col,.95),2);circle(c,tx,ty,4.5,col,C.ink,1.5);});
  fitText(c,p,x,y,maxW,col,o);c.restore();return r;
}
const stepA=(held,tau,t0=0)=>held?fade(tau,t0,.5):fade(tau,t0,.5)*(1-fade(tau,PER-.4,.4));

// ── tube paths: Catmull-Rom spline through measured points, measured by length ─
function spline(pts,n=12){const out=[];
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
    for(let j=0;j<n;j++){const u=j/n,u2=u*u,u3=u2*u;
      out.push([0,1].map(d=>.5*(2*p1[d]+(-p0[d]+p2[d])*u+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*u2+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*u3)));}}
  out.push(pts[pts.length-1]);
  const L=[0];for(let i=1;i<out.length;i++)L.push(L[i-1]+Math.hypot(out[i][0]-out[i-1][0],out[i][1]-out[i-1][1]));
  return{pts:out,L,len:L[L.length-1]};}
const nearP=(Q,x,y)=>{let best=0,bd=1e9;Q.pts.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best=i;}});return Q.L[best];};
function alongP(Q,d){d=Math.max(0,Math.min(Q.len,d));const {pts,L}=Q;let i=1;while(i<L.length-1&&L[i]<d)i++;
  const u=(d-L[i-1])/((L[i]-L[i-1])||1),a=pts[i-1],b=pts[i];return{x:mix(a[0],b[0],u),y:mix(a[1],b[1],u),ang:Math.atan2(b[1]-a[1],b[0]-a[0])};}
function partialP(Q,d){const out=[];for(let i=0;i<Q.pts.length&&Q.L[i]<d;i++)out.push(Q.pts[i]);const e=alongP(Q,d);out.push([e.x,e.y]);return out;}
// U px (ovule.png): along the placenta from the right, over the stalk base, up the stalk, across the narrowest gap,
// along the lower side of the right lobe, into the micropyle, into a synergid
const TUBE_P=[[1150,1199],[900,1199],[700,1199],[640,1199],[606,1196],[575,1186],[550,1166],[537,1145],[543,1122],[557,1103],[571,1087],
  [584,1072],[597,1057],[611,1042],[622,1024],[627,1003],[622,980],[610,966],[595,964],[580,973],[565,982],[550,989],[535,996],[520,1000],
  [505,1005],[488,1008],[470,1009],[455,1000],[446,978],[438,950],[424,922],[408,900],[404,880],[409,866],[424,828],[441,798],[446,778]];
const PATH=spline(TUBE_P);
const near=(x,y)=>nearP(PATH,x,y),along=d=>alongP(PATH,d),partial=d=>partialP(PATH,d);
const L_MIC=near(424,922);
// O px (ovary_single.png): step 1
const PATH1=spline(TUBE1,8);
const near1=(x,y)=>nearP(PATH1,x,y);
const L1_STYLE=near1(224.5,128),L1_MOUTH=near1(236,397),L1_WALL=near1(394,607),L1_FLOOR=near1(322,782),L1_STALK=near1(203,784),L1_END=PATH1.len;
const L1_CH=near1(224.5,215);
// wall points the tube touches, by tube length (closer than 16 O px)
const WALL_T=WALL.map(([x,y])=>{let bd=1e9,bl=Infinity;PATH1.pts.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;bl=PATH1.L[i];}});return bd<16?bl:Infinity;});
// step 1 timeline: the tube grows from T1A for T1G seconds at a steady speed
const T1A=1.4,T1G=7.2,tauOf=d=>T1A+T1G*d/L1_END,tube1D=tau=>L1_END*clamp((tau-T1A)/T1G);

// ── seed coat: a tinted copy of the picture (everything outside the sac, not the free stalk) ─────
let coatCv=null;
function coatCanvas(){
  if(coatCv)return coatCv;const im=K.pic(K.AI+FILE);if(!im)return null;
  try{const cv=document.createElement('canvas');cv.width=IW;cv.height=IH;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,IW,IH),a=d.data;
    for(let y=0;y<IH;y++){let bodyEnd=IW;
      if(y>1005)bodyEnd=0;
      else if(y>=420){const st=[];for(let x=1;x<IW;x++){const i0=(y*IW+x-1)*4+3,i1=i0+4;if(a[i0]<100&&a[i1]>=100)st.push(x);}
        if(st.length&&st[st.length-1]>=600)bodyEnd=st[st.length-1]-2;}
      for(let x=0;x<IW;x++){const i=(y*IW+x)*4;if(a[i+3]<8)continue;
        const ex=(x-SAC.x)/(SAC.rx+4),ey=(y-SAC.y)/(SAC.ry+4);
        if(ex*ex+ey*ey<1||x>=bodyEnd){a[i+3]=0;continue;}
        const l=(a[i]+a[i+1]+a[i+2])/765;a[i]=mix(70,206,l);a[i+1]=mix(44,160,l);a[i+2]=mix(22,104,l);}}
    g.putImageData(d,0,0);coatCv=cv;}catch(e){coatCv=null;}
  return coatCv;
}

// ── drawing in U px (inside the camera transform) ──────────────────────────
const lw=w=>w/cam.k;
function placenta(c,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  c.beginPath();c.moveTo(170,1290);c.lineTo(170,1214);
  for(let x=170;x<=1500;x+=40)c.quadraticCurveTo(x+20,1203,x+40,1210);
  c.lineTo(1500,1290);c.closePath();
  const g=c.createLinearGradient(0,1205,0,1290);g.addColorStop(0,'#5e9e4c');g.addColorStop(1,'#2f6a35');c.fillStyle=g;c.fill();
  c.strokeStyle=PLAC;c.lineWidth=lw(2.5);c.stroke();c.restore();
}
function nucleus(c,n,t,i,a,{r=n.r,col=n.c.nuc,x=n.x,y=n.y}={}){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  glow(c,x,y,r*2.1,n.c.lab,.28+.22*Math.sin(t*2.2+i*.9));
  circle(c,x,y,r,col,C.white,lw(1.6));circle(c,x-r*.35,y-r*.35,r*.25,rgba(C.white,.35),null);
  c.restore();
}
// st: vis[8], deg (synergid R breaks down), zyg, endo (3n nucleus), m (seed), aux (synergids + antipodals left), pol (polar nuclei move together)
function cells(c,t,st){
  const v=st.vis,cenA=Math.max(v[3],v[4]);
  if(cenA>0){c.save();c.globalAlpha*=cenA*(1-st.m*.9);
    ellipse(c,SAC.x,SAC.y,SAC.rx-5,SAC.ry-5,rgba(CEN.fill,.62),CEN.edge,lw(2.6));c.restore();}
  ANTC.forEach((a,j)=>{const al=v[5+[1,0,2][j]]*st.aux;if(al<=0)return;c.save();c.globalAlpha*=al;
    circle(c,a.x,a.y,a.r,ANT.fill,ANT.edge,lw(2.4));c.restore();});
  SYNC.forEach((s,j)=>{const al=v[1+j]*st.aux;if(al<=0)return;c.save();c.globalAlpha*=al;
    const dg=j===1?st.deg:0;
    ellipse(c,s.x,s.y,s.rx*(1-.12*dg),s.ry*(1-.1*dg),dg>0?`rgb(${mix(254,176,dg)|0},${mix(215,128,dg)|0},${mix(170,96,dg)|0})`:SYN.fill,SYN.edge,lw(2.4));
    line(c,[[s.x+(j?-10:10),s.y+s.ry-6],[s.x+(j?-16:16),s.y+s.ry+4]],rgba(SYN.edge,.8),lw(2));
    c.restore();});
  if(v[0]>0){c.save();c.globalAlpha*=v[0]*(1-st.m);
    ellipse(c,EGGC.x,EGGC.y,EGGC.rx,EGGC.ry,EGG.fill,EGG.edge,lw(2.6));
    ellipse(c,EGGC.x,EGGC.y+22,20,16,rgba(C.white,.35),null);
    c.restore();}
  NUC.forEach((n,i)=>{let a=v[i],o={};
    if(i===1||i===2||i>=5)a*=st.aux;
    if(i===2)a*=1-.5*st.deg;
    if(i===0){a*=1-st.m;if(st.zyg>0)o={r:mix(n.r,21,st.zyg),col:'#9d174d'};}
    if(i===3||i===4){const p=st.pol;o={x:mix(n.x,ENDO[0],p),y:mix(n.y,ENDO[1],p)};a*=(1-st.endo)*(1-st.m);}
    nucleus(c,n,t,i,a,o);});
  if(st.endo>0)nucleus(c,{x:ENDO[0],y:ENDO[1],r:26,c:CEN},t,9,st.endo*(1-st.m),{col:'#6b21a8'});
  if(st.zyg>0){c.save();c.globalAlpha*=st.zyg*(1-st.m);circle(c,ZYG[0],ZYG[1],24+3*Math.sin(t*2.4),null,rgba(C.yellow,.85),lw(2.4));c.restore();}
}
// endosperm cells and embryo (step 7)
const ENDO_CELLS=(()=>{const R=K.rng(23),a=[];let tries=0;
  while(a.length<70&&tries<4000){tries++;const u=R()*2-1,w=R()*2-1;if(u*u+w*w>.86)continue;
    const x=SAC.x+u*SAC.rx,y=SAC.y+w*SAC.ry;if(y>600&&Math.abs(x-400)<70)continue;
    if(a.some(p=>Math.hypot(p.x-x,p.y-y)<38))continue;a.push({x,y,d:Math.hypot(u,w),ph:R()*TAU});}return a;})();
function seed(c,t,m){
  if(m<=0)return;c.save();
  c.globalAlpha*=clamp(m*1.6);
  ellipse(c,SAC.x,SAC.y,SAC.rx-4,SAC.ry-4,'#efe3f9',CEN.edge,lw(2.4));
  c.restore();c.save();c.beginPath();c.ellipse(SAC.x,SAC.y,SAC.rx-6,SAC.ry-6,0,0,TAU);c.clip();
  ENDO_CELLS.forEach(p=>{const u=clamp((m-p.d*.6)/.35);if(u<=0)return;c.save();c.globalAlpha*=u;
    circle(c,p.x,p.y,19,rgba('#c4a4ec',.55),rgba(CEN.edge,.7),lw(1.4));circle(c,p.x,p.y,6,CEN.nuc,null);
    circle(c,p.x,p.y,6+2.5*(.5+.5*Math.sin(t*2.6+p.ph)),null,rgba(C.white,.35),lw(1));c.restore();});
  const sy=SAC.y-SAC.ry+mod(t*.22)*2*SAC.ry,g=c.createLinearGradient(0,sy-50,0,sy+50);
  g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,.18*m));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(SAC.x-SAC.rx,sy-50,2*SAC.rx,100);
  c.restore();
  const e=smooth(clamp((m-.15)/.85)),ex=400,ey=mix(652,700,e),s=mix(.35,1,e),pu=1+.03*Math.sin(t*2.2);
  c.save();c.globalAlpha*=clamp(m*2);
  for(let i=0;i<4;i++)circle(c,ex,ey+50*s+i*14*s,7*s,'#fbcfe8',EGG.edge,lw(1.4));
  c.translate(ex,ey);c.scale(s*pu,s*pu);
  glow(c,0,0,80,C.pink,.25);
  c.beginPath();c.moveTo(0,48);c.bezierCurveTo(-52,40,-60,-6,-44,-40);c.bezierCurveTo(-34,-62,-12,-58,0,-30);
  c.bezierCurveTo(12,-58,34,-62,44,-40);c.bezierCurveTo(60,-6,52,40,0,48);c.closePath();
  c.fillStyle='#f9a8d4';c.fill();c.strokeStyle=EGG.edge;c.lineWidth=lw(2.6)/s;c.stroke();
  c.restore();
}
function tube(c,d,t,a){
  if(d<=2||a<=0)return;const pts=partial(d);c.save();c.globalAlpha*=a;
  K.sline(c,pts,TUBE_EDGE,lw(10));K.sline(c,pts,TUBE,lw(6.5));
  for(let s=mod(t*40,30);s<d-6;s+=30){const p=along(s);circle(c,p.x,p.y,lw(1.8),rgba(TUBE_EDGE,.9),null);}
  const tip=along(d);glow(c,tip.x,tip.y,lw(14),TUBE,.5+.3*Math.sin(t*3));c.restore();
}
function sperm(c,x,y,ang,t,ph,a=1){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const wx=Math.sin(t*3.3+ph)*lw(1.6),wy=Math.cos(t*2.7+ph)*lw(1.2),fl=.55+.45*Math.sin(t*4.2+ph);
  glow(c,x+wx,y+wy,lw(15),C.cyan,.25+.35*fl);
  ellipse(c,x+wx,y+wy,lw(9),lw(5.6),C.cyan,C.ink,lw(1.3),ang+.25*Math.sin(t*2+ph));
  c.restore();
}
function ripples(c,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.setLineDash([lw(7),lw(6)]);
  for(let i=0;i<3;i++){const u=mod(t*.55+i/3),r=30+u*230;
    c.beginPath();c.arc(400,780,r,Math.PI*.22,Math.PI*.78);c.strokeStyle=rgba(SYN.lab,.9*(1-u));c.lineWidth=lw(2.4);c.stroke();}
  c.restore();
}
function ring(c,x,y,rx,ry,t,col,a,rot=0,w=lw){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.setLineDash([w(9),w(7)]);c.lineDashOffset=-t*w(14);
  c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.strokeStyle=col;c.lineWidth=w(2.6);c.stroke();c.restore();
}

// ── drawing in O px (ovary_single.png; steps 0-1) ──────────────────────────
const lwO=w=>w/kO();
function toO(c){c.translate(cam.sx+(U0[0]-O0[0]/M-cam.ix)*cam.k,cam.sy+(U0[1]-O0[1]/M-cam.iy)*cam.k);c.scale(kO(),kO());}
function wallPath(c){c.beginPath();WALL.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();}
function wallDash(c,t,col,a,w=2.4){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.setLineDash([lwO(9),lwO(7)]);c.lineDashOffset=-t*lwO(14);
  wallPath(c);c.strokeStyle=col;c.lineWidth=lwO(w);c.stroke();c.restore();
}
// the stretch of wall the tube has already touched: a green rim outside the tube
function wallTouched(c,d,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.lineCap='round';c.lineJoin='round';
  const segs=[];let cur=null;
  for(let i=0;i<=WALL.length;i++){const j=i%WALL.length;if(WALL_T[j]<=d){if(!cur){cur=[];segs.push(cur);}cur.push(WALL[j]);}else cur=null;}
  const pulse=.75+.25*Math.sin(t*2.4);
  segs.forEach(sg=>{if(sg.length<2)return;
    K.sline(c,sg,rgba(WALLC,.28*pulse),lwO(9));K.sline(c,sg,rgba(WALLC,.95),lwO(3.2));});
  c.restore();
}
function tube1(c,d,t,a){
  if(d<=1||a<=0)return;const pts=partialP(PATH1,d),q=kO();c.save();c.globalAlpha*=a;
  K.sline(c,pts,TUBE_EDGE,9/q);K.sline(c,pts,TUBE,5.6/q);
  const gap=17/q;for(let s=mod(t*26/q,gap);s<d-5/q;s+=gap){const p=alongP(PATH1,s);circle(c,p.x,p.y,1.5/q,rgba(TUBE_EDGE,.95),null);}
  const tip=alongP(PATH1,d);glow(c,tip.x,tip.y,15/q,TUBE,.55+.3*Math.sin(t*3));circle(c,tip.x,tip.y,2.6/q,'#fff7c2',null);
  c.restore();
}
function pollen(c,x,y,t,a){
  if(a<=0)return;const q=kO();c.save();c.globalAlpha*=a;
  glow(c,x,y,24/q*.625,POLC,.35+.2*Math.sin(t*2.6));
  circle(c,x,y,10,POLC,TUBE_EDGE,1.6/q);
  for(let i=0;i<6;i++){const an=i/6*TAU+.4;circle(c,x+5.2*Math.cos(an),y+5.2*Math.sin(an),1.5,rgba(TUBE_EDGE,.8),null);}
  c.restore();
}
function ripplesO(c,t,a){
  if(a<=0)return;const q=kO();c.save();c.globalAlpha*=a;
  wallPath(c);c.clip();c.setLineDash([7/q,6/q]);
  for(let i=0;i<3;i++){const u=mod(t*.42+i/3),r=18+u*240;
    c.beginPath();c.arc(RIP[0],RIP[1],r,0,TAU);c.strokeStyle=rgba('#f59e0b',.6*(1-u));c.lineWidth=2.4/q;c.stroke();}
  c.setLineDash([]);glow(c,RIP[0],RIP[1],22,SYN.lab,.3+.15*Math.sin(t*2.2));
  c.restore();
}
function wrongWay(c,t,a){
  if(a<=0)return;const q=kO();c.save();c.globalAlpha*=a;
  dashed(c,XLINE,rgba(C.muted,.8),1.8/q,[6/q,6/q]);
  const [x,y]=XMARK,r=7/q,w=1+.06*Math.sin(t*2.4);
  circle(c,x,y,r*1.7*w,'rgba(11,26,21,.78)',rgba(NOPE,.9),1.6/q);
  line(c,[[x-r,y-r],[x+r,y+r]],NOPE,3/q);line(c,[[x-r,y+r],[x+r,y-r]],NOPE,3/q);
  c.restore();
}

// ── screen-space pieces ────────────────────────────────────────────────────
function spotlight(c,a,canal){
  if(a<=0)return;c.save();c.beginPath();c.rect(0,0,960,600);
  const ex=X(SAC.x),ey=Y(SAC.y),rx=SAC.rx*cam.k+4,ry=SAC.ry*cam.k+4;
  c.moveTo(ex+rx,ey);c.ellipse(ex,ey,rx,ry,0,0,TAU);
  if(canal){c.moveTo(X(360),Y(842));c.lineTo(X(445),Y(842));c.lineTo(X(500),Y(1030));c.lineTo(X(310),Y(1030));c.closePath();}
  c.fillStyle=rgba('#0b1a15',a);c.fill('evenodd');c.restore();
}
function nLabel(c,ix,iy,s,a,size=22){if(a<=0||Y(iy)<22||Y(iy)>588)return;c.save();c.globalAlpha*=a;text(c,s,X(ix),Y(iy)+size*.36,size,C.white,'center',K.MONO);c.restore();}
function marker(c,n,x,y,a,t){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const u=mod(t*.7+n*.13);circle(c,x,y,16+u*8,null,rgba(C.yellow,.7*(1-u)),2);
  circle(c,x,y,15,C.yellow,C.ink,2);text(c,String(n),x,y+8,22,C.ink,'center',K.MONO);c.restore();
}
function bracket(c,x,y0,y1,col,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  line(c,[[x-8,y0],[x,y0],[x,y1],[x-8,y1]],col,3);line(c,[[x,(y0+y1)/2],[x+8,(y0+y1)/2]],col,3);c.restore();
}
// step 4: a small map of the whole ovary with the route of step 1, and a frame on the part shown
function routeMap(c,t,a){
  if(a<=0)return;const bx=832,by=10,bw=112,tx=840,ty=18,tw=96,kT=tw/OW,th=OH*kT;
  c.save();c.globalAlpha*=a;
  D.round(c,bx,by,bw,th+50,14,'rgba(11,26,21,.92)',C.edge);
  K.drawIn(c,OVF,{x:tx,y:ty,w:tw,h:th});
  const pts=PATH1.pts.map(p=>[tx+p[0]*kT,ty+p[1]*kT]);K.sline(c,pts,TUBE_EDGE,4);K.sline(c,pts,TUBE,2.2);
  const p=alongP(PATH1,mod(t*.3)*PATH1.len);glow(c,tx+p.x*kT,ty+p.y*kT,9,TUBE,.9);circle(c,tx+p.x*kT,ty+p.y*kT,2.6,'#fff7c2',null);
  // the frame: screen x 286..960, y 0..600 in O px
  const o=(sx,sy)=>[(cam.ix+(sx-cam.sx)/cam.k-U0[0])*M+O0[0],(cam.iy+(sy-cam.sy)/cam.k-U0[1])*M+O0[1]];
  const [x0,y0]=o(286,0),[x1,y1]=o(960,600),fx0=Math.max(0,x0),fy0=Math.max(0,y0),fx1=Math.min(OW,x1),fy1=Math.min(OH,y1);
  const fr=[tx+fx0*kT,ty+fy0*kT,(fx1-fx0)*kT,(fy1-fy0)*kT];c.save();c.strokeStyle=rgba(C.deep,.85);c.lineWidth=3.6;c.strokeRect(...fr);c.setLineDash([5,3]);c.strokeStyle=C.white;c.lineWidth=2;c.strokeRect(...fr);c.restore();
  text(c,T.route,bx+bw/2,ty+th+29,20,C.muted,'center');
  c.restore();
}

// ── texts drawn on the canvas ──────────────────────────────────────────────
const SHORT=[P(`整個子房`,`Whole ovary`),P(`沿腔壁找胚珠`,`Along the wall`),P(`胚珠構造`,`Ovule`),P(`八個核`,`Eight nuclei`),P(`管到珠孔`,`Tube at micropyle`),P(`兩個精細胞`,`Two sperm cells`),P(`雙重受精`,`Double fertilization`),P(`變成種子`,`Becomes a seed`)];
const STEPCOL=[STRUCT,TUBE,STRUCT,C.yellow,TUBE,C.cyan,C.pink,COAT];
const T={
 // steps 0-1
 stigma:P(`柱頭`,`Stigma`),style:P(`花柱：中間有\n一條細通道`,`Style, with a thin\nchannel down the middle`),
 cavity:P(`子房腔（空的）`,`Ovary cavity (empty)`),wall:P(`子房壁`,`Ovary wall`),
 ovule1:P(`胚珠：只有 1 顆`,`Ovule: only 1`),stalk0:P(`珠柄`,`Stalk`),
 hint0:P(`花粉管要從柱頭\n一路長到這顆胚珠，\n中間隔著空空的子房腔。`,`The pollen tube must grow from the stigma all the way to this ovule, across an empty ovary cavity.`),
 pollen:P(`一粒花粉`,`A pollen grain`),tube1:P(`花粉管（示意）`,`Pollen tube (schematic)`),
 wallHug:P(`子房腔壁：\n花粉管貼著它長`,`Cavity wall:\nthe tube hugs it`),
 signal1:P(`化學訊號（示意）：\n胚珠幫忙引路`,`Chemical signals\n(schematic) from\nthe ovule guide it`),
 nope:P(`× 不會直線穿過\n空空的子房腔`,`× Not straight across the empty cavity`),
 phase:[P(`一粒花粉落在柱頭上`,`A pollen grain lands on the stigma`),
   P(`① 花粉管沿著花柱中間的通道往下長`,`1. The tube grows down the channel in the style`),
   P(`② 出了花柱：貼著子房腔壁往下爬`,`2. Out of the style, it creeps along the cavity wall`),
   P(`③ 沿著腔底往左，再爬上珠柄`,`3. Along the floor, then up the stalk`),
   P(`④ 到達珠孔！一路都貼著表面`,`4. At the micropyle! It kept to a surface all the way`)],
 chain:[P(`柱頭`,`Stigma`),P(`花柱通道`,`Style channel`),P(`腔壁`,`Cavity wall`),P(`腔底`,`Cavity floor`),P(`珠柄`,`Stalk`),P(`珠孔`,`Micropyle`)],
 route:P(`整條路線`,`The route`),
 // steps 2-7 (as in the 1022 module)
 integ:P(`珠被（2 層）`,`Integuments (2 layers)`),nucellus:P(`珠心`,`Nucellus`),sac:P(`胚囊`,`Embryo sac`),micro:P(`珠孔`,`Micropyle`),
 stalk:P(`珠柄`,`Stalk`),chalaza:P(`合點端`,`Chalazal end`),placenta:P(`胎座（示意）`,`Placenta (schematic)`),
 wallPlac:P(`子房腔壁（胎座）`,`Cavity wall\n(placenta)`),
 anatropous:P(`倒生胚珠：珠孔朝下，\n朝向胎座、靠近珠柄`,`Anatropous ovule: the micropyle faces down, towards the placenta, next to the stalk`),
 egg:P(`卵`,`Egg`),syn:P(`助細胞`,`Synergid`),syn2:P(`助細胞 ×2`,`Synergids ×2`),central:P(`中央細胞`,`Central cell`),polar:P(`極核 ×2`,`Polar nuclei ×2`),
 anti:P(`反足細胞`,`Antipodal cells`),
 gEgg:P(`卵端 3 個細胞\n1 卵＋2 助細胞`,`Egg end:\n3 cells:\n1 egg +\n2 synergids`),gCen:P(`中央細胞\n（2 個極核）`,`Central cell\n(2 polar nuclei)`),gAnt:P(`反足 3 個細胞`,`Antipodal end:\n3 cells`),
 count:P(`數一數胚囊裡的核`,`Count the nuclei`),rows:[P(`卵`,`Egg`),P(`助細胞`,`Synergids`),P(`極核`,`Polar nuclei`),P(`反足細胞`,`Antipodals`)],
 total:P(`合計`,`Total`),nucs:n=>P(`${n} 個核`,`${n} nuclei`),cells7:P(`（7 個細胞）`,`(in 7 cells)`),
 formula:P(`8 個核＝1＋2＋2＋3`,`8 nuclei = 1+2+2+3`),
 oneSac:P(`全都在 1 個胚囊裡，\n不是 8 個胚珠`,`All in 1 embryo sac,\nnot 8 ovules`),
 toMicro:P(`↓ 珠孔端`,`↓ micropyle end`),toChal:P(`↑ 合點端`,`↑ chalazal end`),
 tube:P(`花粉管（示意）\n沿腔壁而來`,`Pollen tube (schematic)\nalong the wall`),signal:P(`助細胞發出訊號\n（示意）`,`Synergids send signals\n(schematic)`),
 spermIn:P(`2 個精細胞\n在管子裡`,`2 sperm cells\nride in the tube`),
 synIn:P(`助細胞：花粉管進入`,`Synergid: the tube enters`),burst:P(`管尖破裂`,`Tip bursts`),
 sperm2:P(`2 個精細胞\n（n，沒有尾巴）`,`2 sperm cells\n(n, no tails)`),
 s1:P(`精細胞 1`,`Sperm cell 1`),s2:P(`精細胞 2`,`Sperm cell 2`),eggN:P(`卵（n）`,`Egg (n)`),polarN:P(`極核（n＋n）`,`Polar nuclei (n + n)`),
 zyg:P(`受精卵（2n）`,`Zygote (2n)`),endoN:P(`胚乳核（3n）`,`Endosperm nucleus (3n)`),
 u1:P(`第 1 次結合`,`Union 1`),u2:P(`第 2 次結合`,`Union 2`),
 eq1:[[P(`精細胞 1`,`Sperm 1`),`n`],[P(`＋ 卵`,`+ Egg`),`n`],[P(`受精卵`,`Zygote`),`2n`]],
 eq2:[[P(`精細胞 2`,`Sperm 2`),`n`],[P(`＋ 極核`,`+ Polar nuclei`),`n＋n`],[P(`胚乳核`,`Endosperm nucleus`),`3n`]],
 oneTube:P(`1 條花粉管，\n2 次結合`,`1 pollen tube,\n2 unions`),
 seedT:P(`種子\n（胚珠變的）`,`Seed\n(from the ovule)`),coat:P(`種皮（珠被變的）`,`Seed coat (from the integuments)`),
 embryo:P(`胚（受精卵變的）`,`Embryo (from the zygote)`),endo:P(`胚乳（3n 細胞變的）`,`Endosperm (from the 3n cell)`),
 gone:P(`助細胞、反足細胞：消失`,`Synergids and antipodals: gone`),
 noteAI:P(`胚珠圖：AI 插圖，\n非實拍`,`Ovule: AI illustration,\nnot a photo`),noteAIov:P(`子房圖：AI 插圖，\n非實拍`,`Ovary: AI illustration,\nnot a photo`),
 time:P(`時間已壓縮：\n實際常要好幾個小時`,`Time is compressed:\nit often takes hours`),
 note:[P(`子房縱切面`,`Ovary cut lengthwise`),P(`花粉管路線：示意`,`Tube route: schematic`),P(`胎座：示意`,`Placenta: schematic`),P(`細胞與核：示意`,`Cells and nuclei: schematic`),P(`花粉管路線、胎座：示意`,`Tube route, placenta: schematic`),
   P(`細胞與核：示意`,`Cells and nuclei: schematic`),P(`細胞與核：示意`,`Cells and nuclei: schematic`),P(`胚與胚乳：示意`,`Embryo, endosperm: schematic`)]
};
function notes(c,k){
  const ai=k<=1?T.noteAIov:T.noteAI,parts=[[ai,C.muted],[T.note[k],C.muted]];if(k===1)parts.push([T.time,C.white]);
  c.save();const h=parts.reduce((p,[q])=>p+rowsOf(c,q,LW).length*27,0);let y=LP.y+LP.h-14-h+20;
  parts.forEach(([q,col])=>{y+=textBlock(c,q,LX,y,LW,col,{lh:27});});c.restore();
  return LP.y+LP.h-14-h;
}
// a row "label ........ value" in the left panel; returns the height used
function eqRow(c,lab,val,y,col,valCol,a=1,bold=false){
  if(a<=0)return 0;c.save();c.globalAlpha*=a;
  const vw=measure(c,val,bold?28:24,K.MONO);const h=textBlock(c,lab,LX,y,LW-vw-14,col);
  text(c,val,LX+LW,y,bold?28:24,valCol,'right',K.MONO);c.restore();return Math.max(h,30);
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=clock(s,t);
  s.shown=k;PER=DUR[k];
  // camera: start from what is on screen whenever the step changes (or restarts)
  if(VIEW.k!==k||tau<VIEW.tau-.05||Math.abs(t-VIEW.t)>.5){
    VIEW.from=(VIEW.k>=0&&Math.abs(t-VIEW.t)<=.5)?{...cam}:CAMS[k];VIEW.k=k;}
  VIEW.t=t;VIEW.tau=tau;
  const e=smooth(fade(tau,0,1.4));
  cam=camLerp(VIEW.from,CAMS[k],e);
  const ovA=1-smooth((cam.k-.2)/.14),uA=1-ovA;   // ovary_single when zoomed out, ovule.png when zoomed in
  const a=stepA(held,tau,k<=1?.3:1.2),out=held?0:fade(tau,PER-.7,.6);
  // ── state (steps 3-7 as the 1022 module's steps 1-5) ──
  const vis=NUC.map((_,i)=>k===3?smooth(fade(tau,1.5+i*.55,.4)):k<=2?0:1);
  const m5=k===7?smooth(fade(tau,1.6,3.4))*(1-out):0;
  const st={vis,deg:k===5?fade(tau,3.8,1):k===6||k===7?1:0,
    zyg:k===6?fade(tau,3.3,.4):k===7?1:0,endo:k===6?fade(tau,5.5,.4):k===7?1:0,pol:k===6?smooth(fade(tau,4.7,.9)):k===7?1:0,
    m:m5,aux:k===7?1-fade(tau,1.2,1.6):1};
  if(k===7&&!held)st.vis=vis.map(()=>1-out);
  const tubeD=k===4?mix(0,L_MIC,K.ease(fade(tau,1.5,4.6))):k===5?mix(L_MIC,PATH.len,smooth(fade(tau,1.5,2.1))):k>=6?PATH.len:0;
  const tubeA=k===6?.55:k===7?.55*(1-fade(tau,.4,1.2)):1;
  // step 1 state (kept briefly while step 2 zooms in)
  const s1A=(k===1?1:k===2?1-fade(tau,0,.5):0)*ovA;
  const d1=k===1?tube1D(tau):k===2?L1_END:0;

  c.save();c.imageSmoothingQuality='high';
  // ── pictures and schematic structures (U px) ──
  c.save();c.translate(cam.sx-cam.ix*cam.k,cam.sy-cam.iy*cam.k);c.scale(cam.k,cam.k);
  if(ovA>0)K.drawIn(c,OVF,{x:UX(0),y:UY(0),w:OW/M,h:OH/M},{alpha:ovA});
  if(uA>0){
    placenta(c,uA);
    K.drawIn(c,FILE,{x:0,y:0,w:IW,h:IH},{alpha:uA});
    if(m5>0){const cv=coatCanvas();if(cv){c.save();c.globalAlpha*=m5*.85;c.drawImage(cv,0,0);c.restore();}}
    cells(c,t,st);
    seed(c,t,m5);
    if(k===2){const rA=i=>fade(tau,.5+i*.6,.5)*(held?1:1-out)*uA;
      ring(c,650,1110,62,125,t,STALK,rA(0),-.45);
      ring(c,36,560,34,60,t,STRUCT,rA(1));ring(c,93,560,30,60,t,STRUCT,rA(1));
      ring(c,402,950,48,66,t,C.yellow,rA(2));
      ring(c,165,620,40,80,t,'#e6f0b8',rA(3));
      ring(c,SAC.x,SAC.y,SAC.rx+6,SAC.ry+6,t,CEN.lab,rA(4));
      ring(c,400,40,110,46,t,STRUCT,rA(5));}
  }
  c.restore();
  // ── steps 0-1 on the ovary (O px) ──
  if(ovA>0&&(k<=1||s1A>0)){
    c.save();toO(c);
    if(k===0){const rA=i=>fade(tau,.4+i*.6,.5)*(held?1:1-out)*ovA,w=lwO;
      ring(c,225,32,58,32,t,STRUCT,rA(0),0,w);
      ring(c,224.5,256,15,138,t,STRUCT,rA(1),0,w);
      wallDash(c,t,CAVC,rA(2));
      ring(c,423,640,21,64,t,WALLC,rA(3),0,w);
      ring(c,178,641,100,116,t,OVC,rA(4),0,w);
      ring(c,191,772,20,30,t,STALK,rA(5),0,w);}
    if(s1A>0){
      const pf=k===1?smooth(fade(tau,.2,.9)):1,py=mix(-130,PG[1],pf)+(k===1?-3*Math.sin(clamp((tau-1.1)/.3)*Math.PI):0);
      ripplesO(c,t,s1A*.85*(k===1?fade(tau,2.2,.8):1));
      wallDash(c,t,WALLC,s1A*.45*clamp((d1-L1_MOUTH+20)/60),2);
      wallTouched(c,d1,t,s1A);
      wrongWay(c,t,s1A*(k===1?fade(tau,tauOf(L1_MOUTH)+.6,.6):1));
      tube1(c,d1,t,s1A);
      pollen(c,PG[0],py,t,s1A*(k===1?fade(tau,.2,.3):1));
      if(d1>=L1_END-.5){const u=mod(t*.7);circle(c,MICRO_O[0],MICRO_O[1],lwO(10+u*16),null,rgba(C.yellow,.9*(1-u)),lwO(3));}
    }
    c.restore();
  }
  spotlight(c,cam.spot,false);
  // ── tube and sperm cells in the ovule (U px) ──
  c.save();c.translate(cam.sx-cam.ix*cam.k,cam.sy-cam.iy*cam.k);c.scale(cam.k,cam.k);
  if(k===4||(k===5&&tau<4.2))ripples(c,t,(k===4?fade(tau,1,.8):1-fade(tau,3.6,.6)));
  tube(c,tubeD,t,tubeA);
  const sp=[];
  if((k===4&&tubeD>60)||(k===5&&tau<3.85))[24,46].forEach((b,j)=>{const p=along(tubeD-b);sp.push({x:p.x,y:p.y,ang:p.ang,j});});
  else if(k===5){const u1=smooth(fade(tau,3.9,1.5)),u2=smooth(fade(tau,4.1,1.6)),tip=along(PATH.len);
    sp.push({x:mix(tip.x,SP1[0],u1),y:mix(tip.y,SP1[1],u1),ang:-1.2,j:0},{x:mix(tip.x,SP2[0],u2)+14*Math.sin(u2*Math.PI),y:mix(tip.y,SP2[1],u2),ang:-1.3,j:1});}
  else if(k===6){const u1=smooth(fade(tau,1.6,1.7)),u2=smooth(fade(tau,3.6,1.8));
    if(tau<3.35)sp.push({x:mix(SP1[0],ZYG[0],u1),y:mix(SP1[1],ZYG[1],u1)-18*Math.sin(u1*Math.PI),ang:2.6,j:0});
    if(tau<5.5){const q=u2<.5?[mix(SP2[0],468,u2*2),mix(SP2[1],578,u2*2)]:[mix(468,ENDO[0],u2*2-1),mix(578,ENDO[1]+18,u2*2-1)];sp.push({x:q[0],y:q[1],ang:-2,j:1});}}
  sp.forEach(p=>sperm(c,p.x,p.y,p.ang,t,p.j*2.1,(k===4?fade(tau,1.6,.5):1)));
  if(k===5&&tau>3.75&&tau<4.9){const r=(tau-3.75)/1.15,tip=along(PATH.len);circle(c,tip.x,tip.y,8+r*46,null,rgba(TUBE,.95*(1-r)),lw(3));}
  if(k===6){[[3.3,ZYG],[5.5,ENDO]].forEach(([t0,p])=>{if(tau>t0&&tau<t0+1.1){const r=(tau-t0)/1.1;circle(c,p[0],p[1],20+r*50,null,rgba(C.yellow,.9*(1-r)),lw(3));}});}
  c.restore();
  c.restore();

  // ── labels in the picture (n on every nucleus when it is big enough) ──
  if(cam.k>.7&&k>=3&&k<=6){const nA=fade(tau,1.1,.4);
    NUC.forEach((n,i)=>{let al=vis[i]*nA;if(i===2)al*=1-.5*st.deg;
      if(i===0&&st.zyg>.5){nLabel(c,ZYG[0],ZYG[1],'2n',al);return;}
      if(i===0)al*=1-2*st.zyg;
      if(i===3||i===4){al*=1-st.pol;nLabel(c,mix(n.x,ENDO[0],st.pol),mix(n.y,ENDO[1],st.pol),'n',al);return;}
      nLabel(c,n.x,n.y,'n',al);});
    if(st.endo>.5)nLabel(c,ENDO[0],ENDO[1],'3n',e);}
  if(k===4)routeMap(c,t,a*(held?1:1-out));
  // ── left panel ──
  D.round(c,LP.x,LP.y,LP.w,LP.h,16,'rgba(11,26,21,.9)',C.edge);
  c.save();c.globalAlpha*=held?1:1-fade(tau,PER-.4,.4);fitText(c,SHORT[k],LX,LP.y+12,LW,STEPCOL[k],{active:true});c.restore();
  const noteTop=notes(c,k);
  if(k===0){
    tagBox(c,T.stigma,RX1,18,RW1,SO(262,30),STRUCT,a*fade(tau,.5,.5));
    tagBox(c,T.style,RX1,80,RW1,SO(226,236),STRUCT,a*fade(tau,1.1,.5));
    tagBox(c,T.cavity,RX1,214,RW1,SO(318,480),CAVC,a*fade(tau,1.7,.5));
    tagBox(c,T.wall,RX1,336,RW1,SO(424,640),WALLC,a*fade(tau,2.3,.5));
    tagBox(c,T.stalk0,RX1,470,RW1,SO(200,776),STALK,a*fade(tau,3.5,.5));
    const r=tagBox(c,T.ovule1,LX,74,LW,SO(96,600),OVC,a*fade(tau,2.9,.5));
    c.save();c.globalAlpha*=a*fade(tau,4.3,.6);textBlock(c,T.hint0,LX,(r?r.y+r.h:120)+44,LW,C.yellow);c.restore();
  }
  if(k===1){
    const la=held?1:1-out,tA=tt=>la*fade(tau,tt,.5);
    // right column: what is what
    const pf=smooth(fade(tau,.2,.9));
    tagBox(c,T.pollen,RX1,12,RW1,SO(PG[0]+10,mix(-130,PG[1],pf)),POLC,tA(1.0));
    let y=12+fitH(c,T.pollen,RW1)+12;
    if(d1>=L1_CH)tagBox(c,T.tube1,RX1,y,RW1,SO(224.5,215),TUBE,tA(tauOf(L1_CH)));
    y+=fitH(c,T.tube1,RW1)+12;
    if(d1>=L1_WALL)tagBox(c,T.wallHug,RX1,y,RW1,SO(401,600),WALLC,tA(tauOf(L1_WALL)));
    y+=fitH(c,T.wallHug,RW1)+22;
    // route chain: each stop lights up when the tube gets there
    const LN=[T1A-.3,tauOf(L1_STYLE),tauOf(L1_MOUTH+30),tauOf(L1_FLOOR),tauOf(L1_STALK),tauOf(L1_END)];
    let cur=-1;LN.forEach((tt,i)=>{if(tau>=tt)cur=i;});
    c.save();c.globalAlpha*=la*fade(tau,.6,.5);
    T.chain.forEach((p,i)=>{const on=i<=cur,h=fitH(c,p,RW1);
      c.save();c.globalAlpha*=on?1:.45;fitText(c,p,RX1,y,RW1,on?TUBE:C.muted,{active:i===cur});c.restore();
      y+=h;if(i<T.chain.length-1){c.save();c.globalAlpha*=i<cur?1:.45;arrow(c,RX1+22,y+1,RX1+22,y+13,i<cur?TUBE:C.muted,2.5);c.restore();y+=14;}});
    c.restore();
    // left panel: what is happening now, then signals and the wrong way
    const ph=d1<=0?0:d1<L1_MOUTH?1:d1<L1_FLOOR?2:d1<L1_END-.5?3:4,t0=[0,T1A,tauOf(L1_MOUTH),tauOf(L1_FLOOR),tauOf(L1_END)][ph];
    const capH=Math.max(...T.phase.map(p=>rowsOf(c,p,LW).length))*29,capY=LP.y+12+fitH(c,SHORT[1],LW)+34;
    c.save();c.globalAlpha*=la*fade(tau,ph?t0:.3,.4);textBlock(c,T.phase[ph],LX,capY,LW,ph===4?C.green:C.yellow);c.restore();
    let yl=capY-22+capH+18;
    tagBox(c,T.signal1,LX,yl,LW,SO(66,650),SYN.lab,tA(2.8));
    yl+=fitH(c,T.signal1,LW)+16;
    if(d1>=L1_MOUTH&&yl+fitH(c,T.nope,LW)<noteTop)tagBox(c,T.nope,LX,yl,LW,SO(XMARK[0]-20,XMARK[1]),NOPE,tA(tauOf(L1_MOUTH)+.6));
  }
  if(k===2){
    tagBox(c,T.integ,LX,110,LW,[S(36,560),S(93,560)],STRUCT,a*fade(tau,1.1,.5));
    tagBox(c,T.nucellus,LX,196,LW,S(165,640),'#e6f0b8',a*fade(tau,2.3,.5));
    tagBox(c,T.micro,LX,300,LW,S(402,950),C.yellow,a*fade(tau,1.7,.5));
    c.save();c.globalAlpha*=a*fade(tau,4.1,.6);
    const [mx,my]=S(402,1000);dashed(c,[[mx,my+4],[mx,Y(1196)]],rgba(C.yellow,.9),2.5,[7,6],-t*12);arrow(c,mx,Y(1150),mx,Y(1200),C.yellow,2.5);
    textBlock(c,T.anatropous,LX,382,LW,C.yellow);c.restore();
    c.save();c.globalAlpha*=a*fade(tau,2.9,.5);fitText(c,T.sac,X(SAC.x),Y(SAC.y)-20,SAC.rx*2*cam.k-6,CEN.lab,{align:'center'});c.restore();
    tagBox(c,T.chalaza,RX+40,24,RW-40,S(470,36),STRUCT,a*fade(tau,3.5,.5));
    tagBox(c,T.stalk,RX+40,380,RW-40,S(690,1060),STALK,a*fade(tau,.5,.5));
    tagBox(c,T.placenta,RX,470,RW,S(900,1236),PLAC,a*fade(tau,4.1,.5));
  }
  if(k===3){
    const cnt=[vis[0]>.5?1:0,(vis[1]>.5)+(vis[2]>.5),(vis[3]>.5)+(vis[4]>.5),(vis[5]>.5)+(vis[6]>.5)+(vis[7]>.5)],tot=cnt.reduce((p,q)=>p+q,0);
    const cols=[EGG,SYN,CEN,ANT],first=[0,1,3,5];
    c.save();c.globalAlpha*=held?1:1-out;
    textBlock(c,T.count,LX,92,LW,C.white);
    let y=128;cols.forEach((cc,r)=>{const al=smooth(fade(tau,1.5+first[r]*.55,.4));if(al<=0){y+=34;return;}
      c.save();c.globalAlpha*=al;circle(c,LX+10,y-7,9,cc.nuc,C.white,1.5);
      const vw=measure(c,String(cnt[r]),26,K.MONO);textBlock(c,T.rows[r],LX+28,y,LW-28-vw-10,cc.lab);text(c,String(cnt[r]),LX+LW,y,26,cc.lab,'right',K.MONO);c.restore();y+=34;});
    c.save();c.globalAlpha*=fade(tau,1.5,.4);
    line(c,[[LX,y-14],[LX+LW,y-14]],rgba(C.muted,.7),2);
    eqRow(c,T.total,D.tr(T.nucs(tot)),y+16,C.white,C.yellow,1,true);
    textBlock(c,T.cells7,LX,y+44,LW,C.muted);c.restore();
    c.save();c.globalAlpha*=fade(tau,6.1,.5);
    const r=fitText(c,T.formula,LX,y+58,LW,C.yellow,{active:true});
    textBlock(c,T.oneSac,LX,r.y+r.h+26,LW,C.pink);
    c.restore();c.restore();
    NUC.forEach((n,i)=>{const [x,yy]=S(...MARK[i]);marker(c,i+1,x,yy,vis[i]*(held?1:1-out),t);});
    const gA=(i)=>smooth(fade(tau,1.5+i*.55,.4))*(held?1:1-out);
    tagBox(c,T.anti,432,92,142,S(315,338),ANT.lab,gA(5),{align:'right'});
    tagBox(c,T.central,432,176,142,S(298,452),CEN.lab,gA(3),{align:'right'});
    tagBox(c,T.polar,432,256,142,S(352,525),CEN.lab,gA(3),{align:'right'});
    tagBox(c,T.egg,432,360,142,S(354,668),EGG.lab,gA(0),{align:'right'});
    tagBox(c,T.syn2,432,452,142,[S(316,765)],SYN.lab,gA(1),{align:'right'});
    const BX=X(SAC.x+SAC.rx)+14;
    [[T.gAnt,268,370,ANT.lab,7],[T.gCen,374,618,CEN.lab,4],[T.gEgg,622,815,EGG.lab,2]].forEach(([p,y0,y1,col,last])=>{
      const al=fade(tau,1.5+last*.55+.3,.5)*(held?1:1-out);if(al<=0)return;
      bracket(c,BX,Y(y0)+3,Y(y1)-3,col,al);c.save();c.globalAlpha*=al;
      const h=rowsOf(c,p,RW-28).length*29+11;fitText(c,p,BX+14,(Y(y0)+Y(y1))/2-h/2,944-BX-14,col);c.restore();});
    c.save();c.globalAlpha*=a;text(c,T.toChal,X(SAC.x),Y(SAC.y-SAC.ry)-12,22,C.muted,'center');text(c,T.toMicro,X(SAC.x),Y(SAC.y+SAC.ry)+40,22,C.muted,'center');c.restore();
  }
  if(k===4){
    tagBox(c,T.signal,LX,170,LW,S(372,820),SYN.lab,a*fade(tau,1.0,.5));
    tagBox(c,T.micro,LX,300,LW,S(392,968),C.yellow,a);
    if(tubeD>60){const p=along(tubeD-35);tagBox(c,T.spermIn,LX,380,LW,S(p.x,p.y),C.cyan,a*fade(tau,1.9,.5));}
    tagBox(c,T.stalk,RX+40,300,RW-40,S(650,1060),STALK,a);
    {const p=along(Math.min(tubeD,near(820,1199)));tagBox(c,T.tube,RX-10,372,RW+10,S(p.x,p.y-8),TUBE,a*clamp(tubeD/120));}
    tagBox(c,T.wallPlac,300,470,256,S(380,1250),PLAC,a);
  }
  if(k===5){
    tagBox(c,T.egg,LX,120,LW,S(354,668),EGG.lab,a);
    tagBox(c,T.syn,LX,206,LW,S(316,765),SYN.lab,a);
    tagBox(c,T.micro,LX,330,LW,S(392,968),C.yellow,a);
    tagBox(c,T.central,RX,40,RW,S(500,610),CEN.lab,a);
    tagBox(c,tau>3.9?P(`${D.tr(T.synIn)}，${D.tr(T.burst)}`,`${T.synIn[1]}; ${T.burst[1].toLowerCase()}`):T.synIn,RX,236,RW,S(482,775),SYN.lab,a);
    tagBox(c,T.tube,RX,400,RW,S(406,880),TUBE,a);
    if(tau>4)tagBox(c,T.sperm2,RX-24,118,RW+24,sp.map(p=>S(p.x,p.y)),C.cyan,a*fade(tau,4.4,.5));
  }
  if(k===6){
    c.save();c.globalAlpha*=held?1:1-out;
    let y=92;
    [[T.u1,T.eq1,EGG,2.0,3.3],[T.u2,T.eq2,CEN,3.9,5.5]].forEach(([head,eq,cc,t0,t1])=>{
      const al=fade(tau,t0,.5);if(al<=0){y+=150;return;}
      c.save();c.globalAlpha*=al;textBlock(c,head,LX,y,LW,cc.lab);y+=36;
      y+=eqRow(c,eq[0][0],eq[0][1],y,C.cyan,C.cyan);
      y+=eqRow(c,eq[1][0],eq[1][1],y,cc.lab,cc.lab);
      line(c,[[LX,y-18],[LX+LW,y-18]],rgba(C.white,.8),2);
      y+=eqRow(c,eq[2][0],eq[2][1],y+6,C.white,C.yellow,fade(tau,t1,.5),true)+18;
      c.restore();});
    c.save();c.globalAlpha*=fade(tau,6.0,.5);textBlock(c,T.oneTube,LX,y+4,LW,C.yellow);c.restore();
    c.restore();
    tagBox(c,T.anti,RX,52,RW,S(485,338),ANT.lab,a*.9);
    tagBox(c,st.endo>.5?T.endoN:T.polarN,RX,176,RW,S(ENDO[0]+(st.endo>.5?26:48),ENDO[1]),CEN.lab,a);
    if(sp.some(p=>p.j===1)){const p=sp.find(q=>q.j===1);tagBox(c,T.s2,RX,268,RW,S(p.x,p.y),C.cyan,a);}
    tagBox(c,st.zyg>.5?T.zyg:T.eggN,RX,342,RW,S(EGGC.x+EGGC.rx,EGGC.y-14),EGG.lab,a);
    if(sp.some(p=>p.j===0)){const p=sp.find(q=>q.j===0);tagBox(c,T.s1,RX,414,RW,S(p.x,p.y),C.cyan,a);}
    tagBox(c,T.syn2,RX,488,RW,[S(484,765),S(390,800)],SYN.lab,a*.9);
  }
  if(k===7){
    const b=a*fade(tau,4.4,.6)*(1-out);
    tagBox(c,T.coat,LX,96,LW,S(36,450),COAT,b);
    tagBox(c,T.endo,LX,196,LW,S(330,430),CEN.lab,b);
    tagBox(c,T.embryo,LX,296,LW,S(355,690),EGG.lab,b);
    c.save();c.globalAlpha*=a*fade(tau,2.4,.6)*(1-out);textBlock(c,T.gone,LX,410,LW,SYN.lab);c.restore();
    tagBox(c,T.seedT,RX+20,150,RW-20,S(812,330),COAT,b);
    tagBox(c,T.stalk,RX+40,380,RW-40,S(690,1060),STALK,a*(1-out));
    tagBox(c,T.placenta,RX,470,RW,S(900,1236),PLAC,a*(1-out));
  }
}
window.PlantsDraw=window.PlantsDraw||{};
window.PlantsDraw.flowerOvule=draw;
})();

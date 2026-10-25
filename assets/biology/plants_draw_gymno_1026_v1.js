/* Plants: water, seeds and fruits · "Do sperm need water or a tube?" canvas, view 1 (pine pollination), 7 steps, 2026-10-26.
 * Registered as window.PlantsDraw.gymno; page shell, step texts (GY_SHORT / GY_NAMES / GY_TEXT), labels (LAB, read here
 * as K.LAB at draw time because plants_diversity_1022_v1.js loads after this file) and the quiz: plants_diversity_1022_v1.js.
 * Structure follows flowers_draw_ovule_1026_v1.js (camera, tagBox / fitText / textBlock, tube drawn along a path).
 *
 * Pictures (teacher's Gemini AI illustrations, not photographs), measured once with PIL (alpha, colour, flood fill):
 *   pine_shoot_spring.png (629×520, "H px"): alpha bbox x 4..624, y 4..515.
 *     male cones: one yellow cluster (r>200, g>160, b<170, closed, largest component) x 225..416, y 197..373, centre (314,286);
 *     female cone: the only one, purple/green scales x 468..562, y 38..148 (axis tilted from the base ~(495,148) to the
 *     tip ~(545,40)); young green shoot between them, centre ~(430,195); branch base at the lower left (x 16, y ~426).
 *   pine_pollen.png (577×285, "G px"): body circle centre (290,161) r 119 (rows 210/250 half widths 108/78.5);
 *     air sacs: left centre (110,104) r ~104 (x 6..215), right centre (468,104) r ~104 (x 365..571); tops at y ~8.
 *   pine_scale_ovule.png (653×324, "U px"): cone axis x 8..70, y 30..315; scale from the axis (y ~160..215) to its tip
 *     (648,~250), upper surface y 161 (x 100) .. 158 (x 190) .. 209 (x 550) .. 242 (x 640); bract below it, tip (~405,297);
 *     ovule outline OVP (top from alpha, every 12 px; lower edge from the dark outline line; checked as an overlay);
 *     cavity (flood fill of the pale centre bounded by L<170): x 276..485, y 42..184 → ellipse (380.5,113) 104.5×71;
 *     micropyle notch: leftmost alpha x 214 (y 104) / 215 (y 120), notch bottom (225,112) → mouth MIC (217,111);
 *     olive chamber behind it x 224..246, y 105..119 (the pollen ends here); nucellus = the cream fibrous zone between
 *     the chamber and the cavity (x 246..276 at y 112). Scale colour ~ (218,212,178).
 * One ovule is drawn; a scale carries 2 (the other is not in this cut). One female cone, 1 egg, 2 sperm cells.
 * Steps (names repeated from GY_SHORT):
 *  0 male and female cones: the shoot, dashed rings + labels; yellow pollen dust keeps drifting from the male cones;
 *  1 pollen with air sacs: the shoot moves down-left and one grain grows out of the male cones into a big grain;
 *    wind streamlines and pollen stream from the male cones, most fly past, a few stick on the female cone;
 *  2 a naked ovule: the shoot shrinks into a thumbnail (top right) and the scale picture grows out of the frame on
 *    the female cone; labels: axis, scale, bract, ovule (naked), micropyle (faces the axis), no stigma, 2 ovules;
 *  3 pollination droplet: zoom to the micropyle; a drop swells, 2 grains drift in and stick, the drop draws back and
 *    pulls them into the micropyle (held: the cycle repeats); comparison with the stigma of an angiosperm;
 *  4 a slow pollen tube: the tube creeps through the nucellus to the micropylar end of the cavity while a pointer moves
 *    along a time line (pollination → fertilization ~1 year → ripe seeds 1.5-2 years) and a bar compares the times;
 *  5 fertilization: 1 egg (pink); the tube tip bursts, 2 sperm cells (cyan, no tails); one joins the egg (zygote 2n),
 *    the other fades: only one union, no double fertilization;
 *  6 becomes a seed: zygote → embryo, integument → brown seed coat, a thin wing grows; the seed leaves the scale and
 *    spins away on the wind (held: repeats); the scale keeps a pale scar (the picture is cut along OVP_X, the outline
 *    pushed 9 px outwards so no outline line is left behind; the hidden part of the scale is filled in scale colour).
 * Camera: steps 0-1 move the shoot rect, steps 2-6 run one camera in U px; each change of step starts from what is
 *   on screen (snapshot). Play all: DUR seconds per step; a held step uses K.stageClock. s.shown = current step.
 * Idle motion in every step: dashed rings rotate, dust and wind particles flow, the big grain bobs, the drop shimmers,
 *   dots stream in the tube, tip/zygote/embryo glow, the pointer pulses, the seed spins away.
 */
(()=>{'use strict';
const K=window.PlantsKit;if(!K)return;
const {P,C,D,text,measure,splitLines,circle,ellipse,glow,arrow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,TAU}=K;
const N=7,DUR=[8,9,9,11,11,9,12],TOTAL=DUR.reduce((p,q)=>p+q,0);
let PER=8;
const SH='pine_shoot_spring.png',[HW,HH]=K.SIZE[SH];
const PO='pine_pollen.png',[GW,GH]=K.SIZE[PO];
const SC='pine_scale_ovule.png',[UW,UH]=K.SIZE[SC];
// colours (as in the flower module: tube yellow, sperm cyan, egg pink)
const EGG={fill:'#f9a8d4',edge:'#db2777',nuc:'#be185d',lab:C.pink};
const TUBE=C.yellow,TUBE_EDGE='#a16207',POLC='#fbbf24',STRUCT='#efe6c8',COAT='#c8a070',DROP='#a5d8ff',NOPE='#f87171';
const MALEC=C.yellow,FEMC='#d8b4fe',SHOOTC=C.green,WINGC='#d9a066';
// ── geometry: pine_shoot_spring.png (H px) ─────────────────────────────────
const MALE={x:320,y:285,rx:104,ry:96},FEM={x:515,y:93,rx:64,ry:36,rot:-1.13},NEWS={x:432,y:196,rx:62,ry:30,rot:-.85};
const FEM_BOX=[468,38,562,148];
// ── geometry: pine_pollen.png (G px) ───────────────────────────────────────
const PSAC=[[110,10],[468,10]];
// ── geometry: pine_scale_ovule.png (U px) ──────────────────────────────────
const OVP=[[216,98],[228,84],[240,71],[252,58],[264,48],[276,39],[288,32],[300,25],[312,19],[324,16],[336,13],[348,10],[360,8],[372,6],
  [384,6],[396,6],[408,6],[420,7],[432,10],[444,13],[456,17],[468,23],[480,30],[492,39],[504,51],[516,68],[528,95],[532,116],[530,130],
  [526,140],[522,150],[516,160],[510,170],[503,180],[496,190],[480,204],[460,215],[430,223],[400,227],[370,226],[340,220],[310,210],
  [290,198],[272,184],[256,168],[242,152],[230,136],[220,124],[215,120],[218,116],[225,112],[220,108],[214,104]];
const OVP_X=OVP.map(([x,y])=>{const dx=x-373,dy=y-116,d=Math.hypot(dx,dy);return[x+9*dx/d,y+9*dy/d];});   // 9 px outside, clear of the outline line
const CAV={x:380.5,y:113,rx:104.5,ry:71};
const MIC=[217,111],G_END=[[238,110],[226,114]],NUC_T=[258,125];
const AXIS_T=[40,100],SCALE_T=[600,240],BRACT_T=[350,277],OV_T=[300,26];
const EGGC={x:301,y:113,rx:17,ry:23},EGGN=[304,113];
const TOPLINE=x=>158+(x-190)*51/360;   // the scale's upper surface under the ovule (between x 190 and 550)
const SCALE_RGB='#dad4b2';
// ── cameras ────────────────────────────────────────────────────────────────
// shoot rects (screen): image (0,0) at (x,y), scale k
const R0={x:315,y:45,k:.98},R1={x:300,y:330,k:.5},RT={x:800,y:14,k:.232};
const PR1={x:511,y:64,k:.62};   // the big pollen grain in step 1
// U px cameras: image point (ix,iy) shown at screen (sx,sy), scale k (≤ 1.6: the picture is only 653 px wide)
const C2={k:.98,ix:0,iy:0,sx:302,sy:140},C3={k:1.6,ix:217,iy:111,sx:700,sy:300},C4={k:1.5,ix:300,iy:112,sx:640,sy:190},C6={k:.9,ix:0,iy:0,sx:300,sy:150};
const SCN=[{sh:R0,shA:1,cam:null,uA:0},{sh:R1,shA:1,cam:null,uA:0},{sh:RT,shA:1,cam:C2,uA:1},{sh:RT,shA:0,cam:C3,uA:1},
  {sh:RT,shA:0,cam:C4,uA:1},{sh:RT,shA:0,cam:C4,uA:1},{sh:RT,shA:0,cam:C6,uA:1}];
let cam={...C2};
const cur={sh:{...R0},shA:1,cam:{...C2},uA:0};
const X=ix=>cam.sx+(ix-cam.ix)*cam.k,Y=iy=>cam.sy+(iy-cam.iy)*cam.k,S=(ix,iy)=>[X(ix),Y(iy)];
const hx=(R,u)=>R.x+u*R.k,hy=(R,v)=>R.y+v*R.k,HS=(R,u,v)=>[hx(R,u),hy(R,v)];
// the scale picture fitted into the frame on the female cone of a shoot rect (step 2 grows out of it)
function camFromShoot(R){const w=(FEM_BOX[2]-FEM_BOX[0])*R.k,cx=hx(R,(FEM_BOX[0]+FEM_BOX[2])/2),cy=hy(R,(FEM_BOX[1]+FEM_BOX[3])/2);
  return{k:w/UW,ix:UW/2,iy:UH/2,sx:cx,sy:cy};}
// layout: left caption panel, stage on the right
const LP={x:12,y:10,w:274,h:580},LX=26,LW=246;
// time line (steps 4-6), screen px
const TL={x:300,y:462,w:646,h:126},TX0=322,TX1=924,TY=556,mX=m=>TX0+(TX1-TX0)*m/24;

// the camera between two views: a pure zoom about their common fixed point (log scale), else a straight pan
function camLerp(A,B,e){
  const r=Math.log(B.k/A.k);
  if(Math.abs(r)<.03)return{k:mix(A.k,B.k,e),ix:mix(A.ix,B.ix,e),iy:mix(A.iy,B.iy,e),sx:mix(A.sx,B.sx,e),sy:mix(A.sy,B.sy,e)};
  const px=(B.sx-A.sx+A.ix*A.k-B.ix*B.k)/(A.k-B.k),py=(B.sy-A.sy+A.iy*A.k-B.iy*B.k)/(A.k-B.k);
  return{k:A.k*Math.exp(r*e),ix:px,iy:py,sx:A.sx+(px-A.ix)*A.k,sy:A.sy+(py-A.iy)*A.k};
}
// Play all: DUR seconds per step; a held step: K.stageClock
function clock(s,t){
  if(s.phase>=0){const r=stageClock(s,t,N,8);return{k:Math.max(0,Math.min(N-1,r.k)),tau:r.tau,held:true};}
  const q=mod(t-(s.start||0),TOTAL);let k=0,acc=0;while(k<N-1&&q>=acc+DUR[k]){acc+=DUR[k];k++;}
  return{k,tau:q-acc,held:false};
}
const VIEW={k:-1,t:-1e9,tau:0,from:null,fromK:-1};
const snap=()=>({sh:{...cur.sh},shA:cur.shA,cam:{...cur.cam},uA:cur.uA});

// ── small helpers (as in flowers_draw_ovule_1026_v1.js) ────────────────────
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
  if(targets)(Array.isArray(targets[0])?targets:[targets]).forEach(([tx,ty])=>{
    const ex=tx<r.x?r.x:tx>r.x+r.w?r.x+r.w:tx,ey=ty<r.y?r.y:ty>r.y+r.h?r.y+r.h:r.y+r.h/2;
    line(c,[[ex,ey],[tx,ty]],rgba(col,.95),2);circle(c,tx,ty,4.5,col,C.ink,1.5);});
  fitText(c,p,x,y,maxW,col,o);c.restore();return r;
}
const stepA=(held,tau,t0=0)=>held?fade(tau,t0,.5):fade(tau,t0,.5)*(1-fade(tau,PER-.4,.4));
const polyPath=(c,pts)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();};
const bez=(a,b,d,u)=>[(1-u)*(1-u)*a[0]+2*(1-u)*u*b[0]+u*u*d[0],(1-u)*(1-u)*a[1]+2*(1-u)*u*b[1]+u*u*d[1]];
// a rotating dashed ring (w converts screen px to the current units)
function ring(c,x,y,rx,ry,t,col,a,rot=0,w=v=>v){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.setLineDash([w(9),w(7)]);c.lineDashOffset=-t*w(14);
  c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.strokeStyle=col;c.lineWidth=w(2.6);c.stroke();c.restore();
}

// ── tube path: Catmull-Rom spline through points, measured by length ───────
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
// U px: from the grain in the chamber, a gentle S through the nucellus, to the micropylar end of the cavity (280),
// then (step 5) on to the egg's edge (285)
const PATH=spline([[245,110],[249,106.5],[253,104.5],[258,106],[262,110.5],[266,115],[271,116.5],[276,114.5],[280,113],[285,113]]);
const L_CAV=nearP(PATH,280,113);

// ── particles (seeded) ─────────────────────────────────────────────────────
const DUST=(()=>{const R=K.rng(11),a=[];for(let i=0;i<54;i++){const an=R()*TAU,rr=Math.sqrt(R());
  a.push({u:MALE.x+Math.cos(an)*rr*MALE.rx*.82,v:MALE.y+Math.sin(an)*rr*MALE.ry*.82,ph:R(),sp:.15+R()*.1,dx:R(),dy:R(),w:R()*TAU,caught:i%9===4,img:i%4===0});}return a;})();
const STUCK=(()=>{const R=K.rng(5),a=[];for(let i=0;i<6;i++){const an=R()*TAU,rr=.25+.55*Math.sqrt(R());
  const lx=Math.cos(an)*rr*FEM.rx,ly=Math.sin(an)*rr*FEM.ry;a.push({u:FEM.x+lx*Math.cos(FEM.rot)-ly*Math.sin(FEM.rot),v:FEM.y+lx*Math.sin(FEM.rot)+ly*Math.cos(FEM.rot),ph:R()*TAU});}return a;})();
// wind streamlines (screen px, step 1)
const WIND=[[[330,566],[620,560],[944,430]],[[430,512],[660,450],[944,338]],[[560,600],[780,590],[944,520]]];

// ── seed coat: the ovule outside the cavity, tinted brown (multiply), alpha kept ─────
let coatCv=null;
function coatCanvas(){
  if(coatCv)return coatCv;const im=K.pic(K.AI+SC);if(!im)return null;
  try{const cv=document.createElement('canvas');cv.width=UW;cv.height=UH;const g=cv.getContext('2d');
    g.save();polyPath(g,OVP);g.clip();g.drawImage(im,0,0);g.restore();
    g.globalCompositeOperation='destination-out';g.beginPath();g.ellipse(CAV.x,CAV.y,CAV.rx+2,CAV.ry+2,0,0,TAU);g.fill();
    const m=document.createElement('canvas');m.width=UW;m.height=UH;m.getContext('2d').drawImage(cv,0,0);
    g.globalCompositeOperation='multiply';g.fillStyle='#b5793f';g.fillRect(0,0,UW,UH);
    g.globalCompositeOperation='destination-in';g.drawImage(m,0,0);coatCv=cv;}catch(e){coatCv=null;}
  return coatCv;
}

// ── drawing in screen px (the shoot and the big grain) ─────────────────────
function shoot(c,R,a){if(a>0)K.drawIn(c,SH,{x:R.x,y:R.y,w:HW*R.k,h:HH*R.k},{alpha:a});}
function dust(c,R,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  DUST.forEach((p,i)=>{const q=mod(t*p.sp+p.ph),sx=hx(R,p.u+(150+130*p.dx)*q+14*Math.sin(t*1.3+p.w)),sy=hy(R,p.v-(40+90*p.dy)*q+10*Math.sin(t*1.7+p.w*2));
    const al=Math.pow(Math.sin(Math.PI*q),.7),r=(1.6+1.3*p.dx)*Math.max(R.k,.6);
    glow(c,sx,sy,r*3.2,POLC,.45*al);circle(c,sx,sy,r,rgba(C.yellow,.95*al),null);});
  c.restore();
}
function bigPollen(c,cx,cy,k,t,a){
  if(a<=0)return;const w=GW*k,h=GH*k,bob=3.5*Math.sin(t*1.3),rot=.025*Math.sin(t*.9);
  c.save();c.globalAlpha*=a;c.translate(cx,cy+bob);c.rotate(rot);
  glow(c,0,0,w*.62,POLC,.16+.05*Math.sin(t*2));
  K.drawIn(c,PO,{x:-w/2,y:-h/2,w,h});c.restore();
  return{x:cx-w/2,y:cy-h/2+bob,w,h,k};
}
function grainS(c,x,y,w,ang,a){   // a small grain (screen px)
  if(a<=0)return;const im=K.pic(K.AI+PO);c.save();c.globalAlpha*=a;c.translate(x,y);c.rotate(ang);
  glow(c,0,0,w*.85,POLC,.4);
  if(im)c.drawImage(im,-w/2,-w*GH/GW/2,w,w*GH/GW);else circle(c,0,0,w/3,POLC,null);c.restore();
}
function windLines(c,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  WIND.forEach(([p0,p1,p2],i)=>{c.save();c.setLineDash([16,12]);c.lineDashOffset=-t*46-i*9;
    c.beginPath();c.moveTo(...p0);c.quadraticCurveTo(...p1,...p2);c.strokeStyle=rgba(C.white,.42);c.lineWidth=2.6;c.stroke();c.restore();
    const q=bez(p0,p1,p2,.97);arrow(c,q[0],q[1],p2[0],p2[1],rgba(C.white,.75),2.6);});
  c.restore();
}
function windPollen(c,R,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  DUST.forEach((p,i)=>{const p0=HS(R,p.u,p.v);let q=mod(t*p.sp*.9+p.ph),p2,p1,al;
    if(p.caught){const s=STUCK[i%STUCK.length];p2=HS(R,s.u,s.v);p1=[mix(p0[0],p2[0],.5)+40,mix(p0[1],p2[1],.5)+30];q=Math.min(1,q*1.3);al=q<1?Math.pow(Math.sin(Math.PI*Math.min(q,.5)),.6):1-fade(mod(t*p.sp*.9+p.ph),.77,.2);}
    else{p2=[964+30*p.dx,p0[1]-150-130*p.dy];p1=[p0[0]+170+90*p.dx,p0[1]+18-50*p.dy];al=Math.pow(Math.sin(Math.PI*q),.6);}
    const [x,y]=bez(p0,p1,p2,q),wx=6*Math.sin(t*2.1+p.w)*(1-q),wy=5*Math.cos(t*1.7+p.w)*(1-q);
    if(p.img)grainS(c,x+wx,y+wy,15,.5*Math.sin(t*1.8+p.w),al);
    else{glow(c,x+wx,y+wy,7,POLC,.5*al);circle(c,x+wx,y+wy,2.4,rgba(C.yellow,al),null);}});
  STUCK.forEach((s,i)=>{const [x,y]=HS(R,s.u,s.v);glow(c,x,y,8,POLC,.35+.2*Math.sin(t*2.4+s.ph));circle(c,x,y,2.6,C.yellow,TUBE_EDGE,1);});
  c.restore();
}

// ── drawing in U px (inside the camera transform) ──────────────────────────
const lw=w=>w/cam.k;
function grainU(c,x,y,w,ang,a,t,glowA=.35){   // a small grain on the ovule (U px)
  if(a<=0)return;const im=K.pic(K.AI+PO);c.save();c.globalAlpha*=a;
  glow(c,x,y,w*.9,POLC,glowA+.12*Math.sin(t*2.6));c.translate(x,y);c.rotate(ang);
  if(im)c.drawImage(im,-w/2,-w*GH/GW/2,w,w*GH/GW);else ellipse(c,0,0,w/2,w/4,POLC,null);c.restore();
}
const dropC=r=>[MIC[0]-.62*r,MIC[1]];
function droplet(c,r,t){
  if(r<=.3)return;const [cx,cy]=dropC(r),rr=r*(1+.035*Math.sin(t*3.1));c.save();
  const g=c.createRadialGradient(cx-rr*.35,cy-rr*.35,rr*.1,cx,cy,rr);
  g.addColorStop(0,'rgba(235,248,255,.88)');g.addColorStop(.6,rgba(DROP,.55));g.addColorStop(1,'rgba(120,190,240,.62)');
  c.beginPath();c.arc(cx,cy,rr,0,TAU);c.fillStyle=g;c.fill();c.strokeStyle='rgba(215,240,255,.95)';c.lineWidth=lw(2.2);c.stroke();
  circle(c,cx-rr*.38,cy-rr*.42,rr*.17,'rgba(255,255,255,.9)',null);
  c.restore();
}
function tube(c,d,t,a){
  if(d<=.5||a<=0)return;const pts=partialP(PATH,d);c.save();c.globalAlpha*=a;
  K.sline(c,pts,TUBE_EDGE,lw(10));K.sline(c,pts,TUBE,lw(6.5));
  const gap=lw(24);for(let s=mod(t*lw(18),gap);s<d-lw(5);s+=gap){const p=alongP(PATH,s);circle(c,p.x,p.y,lw(1.8),rgba(TUBE_EDGE,.9),null);}
  const tip=alongP(PATH,d);glow(c,tip.x,tip.y,lw(15),TUBE,.5+.3*Math.sin(t*3));circle(c,tip.x,tip.y,lw(2.6),'#fff7c2',null);c.restore();
}
function sperm(c,x,y,ang,t,ph,a=1){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const wx=Math.sin(t*3.3+ph)*lw(1.6),wy=Math.cos(t*2.7+ph)*lw(1.2),fl=.55+.45*Math.sin(t*4.2+ph);
  glow(c,x+wx,y+wy,lw(15),C.cyan,.25+.35*fl);
  ellipse(c,x+wx,y+wy,lw(9),lw(5.6),C.cyan,C.ink,lw(1.3),ang+.25*Math.sin(t*2+ph));
  c.restore();
}
// egg (z: 0 egg → 1 zygote)
function eggCell(c,t,a,z){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  ellipse(c,EGGC.x,EGGC.y,EGGC.rx,EGGC.ry,EGG.fill,EGG.edge,lw(2.6));
  ellipse(c,EGGC.x-4,EGGC.y+12,7,5,rgba(C.white,.35),null);
  const r=mix(6,8,z);glow(c,EGGN[0],EGGN[1],r*2.2,EGG.lab,.28+.2*Math.sin(t*2.2));
  circle(c,EGGN[0],EGGN[1],r,z>.5?'#9d174d':EGG.nuc,C.white,lw(1.6));circle(c,EGGN[0]-r*.35,EGGN[1]-r*.35,r*.25,rgba(C.white,.35),null);
  if(z>0){c.save();c.globalAlpha*=z;circle(c,EGGN[0],EGGN[1],r+lw(5)+lw(2)*Math.sin(t*2.4),null,rgba(C.yellow,.85),lw(2.4));c.restore();}
  c.restore();
}
// embryo along the long axis: root end at the micropyle, a brush of seed leaves towards the far end (e 0..1)
function embryo(c,e,t){
  if(e<=0)return;const s=mix(.12,1,e),pu=1+.025*Math.sin(t*2.2);c.save();c.globalAlpha*=clamp(e*3);c.translate(302,113);c.scale(s*pu,mix(.55,1,e)*pu);
  glow(c,70,0,90,C.pink,.18);
  [[-9,-15],[-3,-5],[3,5],[9,15]].forEach(([y0,y1])=>{K.sline(c,[[88,y0],[118,mix(y0,y1,.45)],[146,y1]],EGG.edge,lw(2.2)/s+6);K.sline(c,[[88,y0],[118,mix(y0,y1,.45)],[146,y1]],EGG.fill,6);});
  c.beginPath();c.moveTo(-3,0);c.bezierCurveTo(-3,-10,6,-11,16,-11);c.lineTo(98,-11);c.quadraticCurveTo(104,0,98,11);c.lineTo(16,11);c.bezierCurveTo(6,11,-3,10,-3,0);c.closePath();
  c.fillStyle=EGG.fill;c.fill();c.strokeStyle=EGG.edge;c.lineWidth=lw(2.2)/s;c.stroke();
  c.restore();
}
// the thin papery wing (behind the seed), grown out from the seed's far side (w 0..1)
function wing(c,w,t){
  if(w<=0)return;c.save();c.translate(505,118);c.scale(w,1);c.translate(-505,-118);
  c.beginPath();c.moveTo(470,40);c.bezierCurveTo(560,22,662,52,702,104);c.bezierCurveTo(714,124,692,150,642,166);
  c.bezierCurveTo(592,182,532,198,476,204);c.closePath();
  const g=c.createLinearGradient(480,0,710,0);g.addColorStop(0,'rgba(196,146,86,.78)');g.addColorStop(1,'rgba(236,206,158,.42)');
  c.fillStyle=g;c.fill();c.strokeStyle='rgba(150,98,48,.95)';c.lineWidth=lw(1.8);c.stroke();
  c.strokeStyle='rgba(150,98,48,.5)';c.lineWidth=lw(1.2);
  [[[520,62],[620,58],[690,100]],[[520,96],[620,92],[700,114]],[[520,130],[620,130],[690,134]],[[520,166],[600,164],[656,158]]].forEach(([a,b,d])=>{c.beginPath();c.moveTo(...a);c.quadraticCurveTo(...b,...d);c.stroke();});
  glow(c,640,112,46,WINGC,.1+.06*Math.sin(t*2));
  c.restore();
}
// the seed: wing, ovule (now the seed), coat tint, embryo (U px, local frame)
function seedGroup(c,t,coat,w,emb){
  wing(c,w,t);
  const im=K.pic(K.AI+SC);if(im){c.save();polyPath(c,OVP);c.clip();c.drawImage(im,0,0);c.restore();}
  if(coat>0){const cv=coatCanvas();if(cv){c.save();c.globalAlpha*=coat*.9;c.drawImage(cv,0,0);c.restore();}}
  embryo(c,emb,t);
}
// the scale without the seed, with a pale scar where the seed sat
function scaleOnly(c,a){
  const im=K.pic(K.AI+SC);if(!im||a<=0)return;c.save();c.globalAlpha*=a;
  c.save();c.beginPath();c.rect(-10,-10,UW+20,UH+20);OVP_X.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip('evenodd');c.drawImage(im,0,0);c.restore();
  c.save();polyPath(c,OVP_X);c.clip();
  c.beginPath();c.moveTo(180,TOPLINE(180));c.lineTo(560,TOPLINE(560));c.lineTo(560,260);c.lineTo(180,260);c.closePath();c.fillStyle=SCALE_RGB;c.fill();
  c.beginPath();c.ellipse(372,TOPLINE(372)+14,110,13,.14,0,TAU);c.fillStyle='rgba(176,160,118,.55)';c.fill();
  c.restore();
  line(c,[[236,TOPLINE(236)],[520,TOPLINE(520)]],'rgba(120,110,80,.7)',lw(1.6));
  c.restore();
}

// ── screen-space pieces ────────────────────────────────────────────────────
function bracketH(c,x0,x1,y,col,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  line(c,[[x0,y-8],[x0,y],[x1,y],[x1,y-8]],col,3);line(c,[[(x0+x1)/2,y],[(x0+x1)/2,y+8]],col,3);c.restore();
}
// step 2: the thumbnail panel behind the shrunken shoot, with the frame on the female cone and a link to the big view
function thumbFrame(c,t,a,R){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const x0=hx(R,FEM_BOX[0])-3,y0=hy(R,FEM_BOX[1])-3,w=(FEM_BOX[2]-FEM_BOX[0])*R.k+6,h=(FEM_BOX[3]-FEM_BOX[1])*R.k+6;
  c.save();c.strokeStyle=rgba(C.deep,.85);c.lineWidth=4;c.strokeRect(x0,y0,w,h);c.setLineDash([5,3]);c.lineDashOffset=-t*8;c.strokeStyle=C.white;c.lineWidth=2;c.strokeRect(x0,y0,w,h);c.restore();
  const u=mod(t*.7);c.save();c.globalAlpha*=1-u;c.strokeStyle=C.white;c.lineWidth=2;c.strokeRect(x0-u*8,y0-u*8,w+u*16,h+u*16);c.restore();
  // a dashed link from the frame down to the magnified scale
  dashed(c,[[x0,y0+h],[X(420),Y(2)]],rgba(C.white,.8),2,[7,6],-t*12);
  dashed(c,[[x0+w,y0+h],[X(560),Y(60)]],rgba(C.white,.8),2,[7,6],-t*12);
  c.restore();
}
// steps 4-6: the time line (months after pollination), pointer at mo
function timeline(c,L,mo,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  D.round(c,TL.x,TL.y,TL.w,TL.h,14,'rgba(11,26,21,.92)',C.edge);
  c.fillStyle=rgba(COAT,.4);c.fillRect(mX(18),TY-8,mX(24)-mX(18),16);
  line(c,[[TX0,TY],[TX1,TY]],rgba(C.muted,.8),3);
  line(c,[[TX0,TY],[mX(clamp(mo/24)*24),TY]],TUBE,5);
  [0,12,18,24].forEach(m=>line(c,[[mX(m),TY-10],[mX(m),TY+10]],C.white,2.5));
  const bw=(p,mw)=>Math.max(...fitRows(c,p,mw).map(r=>measure(c,r,22)))+28,lx=TL.x+10,rx=TL.x+TL.w-10;
  const wl=bw(L.yP,214),wc=bw(L.yF,260),wr=bw(L.yS,214),cx=Math.max(lx+wl+8+wc/2,Math.min(rx-wr-8-wc/2,mX(12)));
  fitText(c,L.yP,lx,TL.y+8,214,POLC,{active:mo>=0});fitText(c,L.yF,cx,TL.y+8,260,C.cyan,{align:'center',active:mo>=11.95});
  fitText(c,L.yS,rx,TL.y+8,214,COAT,{align:'right',active:mo>=18});
  const px=mX(clamp(mo/24)*24),pu=.5+.5*Math.sin(t*3);
  glow(c,px,TY,16,C.yellow,.35+.25*pu);
  c.beginPath();c.moveTo(px,TY+6);c.lineTo(px-9,TY+24);c.lineTo(px+9,TY+24);c.closePath();c.fillStyle=C.yellow;c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();
  c.restore();
}
// step 2: a scale seen from above (schematic): 2 ovules at its base, micropyles towards the axis
function topView(c,x,y,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  D.round(c,x,y-34,8,68,3,'#d9c9a0',null);
  c.beginPath();c.moveTo(x+8,y-16);c.quadraticCurveTo(x+70,y-40,x+124,y-30);c.quadraticCurveTo(x+142,y,x+124,y+30);c.quadraticCurveTo(x+70,y+40,x+8,y+16);c.closePath();
  c.fillStyle=SCALE_RGB;c.fill();c.strokeStyle='#8c8577';c.lineWidth=1.5;c.stroke();
  [-1,1].forEach((sg,i)=>{const oy=y+sg*13;ellipse(c,x+32,oy,15,10,i?'#e7e1c3':'#f0e9cc','#6b8a4e',2);circle(c,x+18,oy,2.4,'#6b8a4e',null);
    if(i===0){c.save();c.setLineDash([4,3]);c.lineDashOffset=-t*8;ellipse(c,x+32,oy,19,14,null,C.white,1.6);c.restore();}});
  c.restore();
}

// ── texts drawn on the canvas (labels from K.LAB, which loads after this file) ─
const SHORT=[P(`雄毬果與雌毬果`,`Two kinds of cones`),P(`花粉帶氣囊`,`Pollen with air sacs`),P(`裸露的胚珠`,`A naked ovule`),P(`傳粉滴`,`Pollination droplet`),P(`花粉管慢慢長`,`A slow pollen tube`),P(`受精`,`Fertilization`),P(`長成種子`,`Becomes a seed`)];
const STEPCOL=[MALEC,POLC,STRUCT,DROP,TUBE,C.cyan,COAT];
let T=null;
function tx(){
  if(T&&K.LAB)return T;const L=K.LAB||{},g=(k,zh,en)=>L[k]||P(zh,en),cat=(p,zh,en)=>P(p[0]+zh,p[1]+en);
  const brk=p=>P(p[0].replace('（','\n（'),p[1].replace(' (','\n('));   // two rows on the time line
  const ai=g('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
  const one=g('oneUnion','只有一次結合','Only one union'),nd=g('noDouble','沒有雙重受精','No double fertilization');
  const mic=g('micropyle','珠孔','Micropyle');
  const t={
   male:g('maleCones','雄毬果','Male cones'),female:g('femaleCone','雌毬果（還小）','Female cone (young)'),shoot:g('newShoot','春天的新枝','New shoot in spring'),
   shed:g('shedPollen','放出大量花粉','Shedding lots of pollen'),
   hint0:P(`雄毬果：一簇，很多個\n雌毬果：只有 1 個，\n還很小，在新枝頂端`,`Male cones: many,\nin a cluster\nFemale cone: just 1,\nstill small, at the tip`),
   sacs2:cat(g('airSacs','氣囊','Air sacs'),' ×2',' ×2'),grain:g('pollenGrain','花粉粒','Pollen grain'),wind:g('wind','風','Wind'),
   airy:g('airFilled','氣囊充滿空氣，很輕','Air-filled sacs: light'),
   few:P(`雄毬果放出非常多花粉，只有少數落在雌毬果上`,`Male cones shed huge amounts of pollen; only a few grains land on a female cone`),
   axis:g('coneAxis','毬果軸','Cone axis'),bract:g('bract','苞片','Bract'),scale:g('scale','毬果鱗片','Cone scale'),
   naked:g('naked','胚珠裸露，沒有子房','Ovule uncovered: no ovary'),micAxis:cat(mic,'（朝向毬果軸）',' (faces the cone axis)'),
   noStig:g('noStigma','沒有柱頭','No stigma'),two:cat(g('twoOvules','每片鱗片有 2 顆胚珠','2 ovules on each scale'),'\n（另一顆沒畫出來）','\n(the other one is not drawn)'),
   top:P(`鱗片俯視\n（示意）`,`Top view\n(schematic)`),
   mic,drop:g('droplet','傳粉滴','Pollination droplet'),drawIn:g('drawIn','縮回去，把花粉拉進珠孔','Draws back, pulling pollen in'),
   ph3:[P(`珠孔滲出一滴黏黏的液體`,`A sticky drop oozes from the micropyle`),P(`飄來的花粉黏在小滴上`,`Drifting pollen sticks to the drop`),g('drawIn','縮回去，把花粉拉進珠孔','Draws back, pulling pollen in')],
   angioCmp:P(`被子植物：花粉落在柱頭上`,`Angiosperm: pollen lands on a stigma`),pineCmp:P(`松：沒有柱頭，花粉落在這一滴液體上`,`Pine: no stigma; pollen lands on this drop`),
   slow:P(`花粉管要長多久？`,`How long does the tube take?`),angioT:g('angioTime','開花植物：幾小時到幾天','Flowering plant: hours to days'),pineT:g('pineTime','松：約一年','Pine: about a year'),
   comp:g('timeCompressed','時間經過壓縮','Time compressed'),
   yP:brk(g('yearPoll','授粉（第 1 年春天）','Pollination (spring, year 1)')),yF:brk(g('yearFert','受精（約一年後）','Fertilization (about a year later)')),yS:brk(g('yearSeed','種子成熟（一年半到兩年）','Ripe seeds (1.5 to 2 years)')),
   tube:g('pollenTube','花粉管','Pollen tube'),nuc:g('nucellus','珠心','Nucellus'),pollen:g('pollen','花粉','Pollen'),egg:g('egg','卵','Egg'),
   eggN:P(`卵（n）`,`Egg (n)`),sperm2:P(`精細胞 ×2\n（沒有尾巴）`,`2 sperm cells\n(no tails)`),burst:P(`管尖破裂`,`Tip bursts`),
   zyg:g('zygote','受精卵（2n）','Zygote (2n)'),other:P(`另一個精細胞：消失`,`The other sperm cell fades away`),
   one:P(`${one[0]}：\n${nd[0]}`,`${one[1]}:\n${nd[1].charAt(0).toLowerCase()+nd[1].slice(1)}`),
   eq:[[P(`精細胞`,`Sperm cell`),`n`],[P(`＋ 卵`,`+ Egg`),`n`],[P(`受精卵`,`Zygote`),`2n`]],
   seedT:P(`種子（胚珠變的）`,`Seed (from the ovule)`),wing:g('seedWing','種子的翅','Wing of the seed'),emb:P(`胚（受精卵變的）`,`Embryo (from the zygote)`),
   bare:P(`種子露在鱗片上，\n沒有果實包著`,`The seed lies uncovered on the scale, with no fruit around it`),notFruit:g('coneNotFruit','毬果不是果實','A cone is not a fruit'),
   ai:[P(`枝條與毬果：\n`,`Shoot and cones: `),P(`花粉：`,`Pollen: `),P(`鱗片與胚珠：\n`,`Scale and ovule: `)].map(p=>P(p[0]+ai[0],p[1]+ai[1])),
   sch:[P(`花粉粉塵：示意`,`Pollen dust: schematic`),P(`風與飄動：示意`,`Wind and drifting: schematic`),P(`鱗片縱切面`,`Scale cut lengthwise`),
     P(`傳粉滴與小花粉：示意`,`Droplet and small grains: schematic`),P(`花粉管與時間線：示意`,`Pollen tube, time line: schematic`),
     P(`卵與精細胞：示意`,`Egg and sperm cells: schematic`),P(`胚、種皮、翅：示意`,`Embryo, seed coat, wing: schematic`)]
  };
  if(K.LAB)T=t;return t;
}
function notes(c,L,k){
  const parts=[[L.ai[k<=0?0:k===1?1:2],C.muted],[L.sch[k],C.muted]];if(k===3||k===4)parts.push([L.comp,C.white]);
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
  const L=tx();
  // scene: start from what is on screen whenever the step changes (or restarts)
  if(VIEW.k!==k||tau<VIEW.tau-.05||Math.abs(t-VIEW.t)>.5){
    const cont=VIEW.k>=0&&Math.abs(t-VIEW.t)<=.5;
    VIEW.fromK=cont?VIEW.k:k;
    VIEW.from=cont?snap():{sh:{...SCN[k].sh},shA:SCN[k].shA,cam:{...(SCN[k].cam||C2)},uA:SCN[k].uA};
    VIEW.k=k;}
  VIEW.t=t;VIEW.tau=tau;
  const F=VIEW.from,G=SCN[k],toU=G.uA>0&&F.uA<.05;   // toU: the scale picture grows out of the cone in the thumbnail
  const e=smooth(fade(tau,0,1.4)),eS=toU?smooth(fade(tau,0,1)):e;
  const fsh=F.shA>.01?F.sh:G.sh;
  cur.sh={x:mix(fsh.x,G.sh.x,eS),y:mix(fsh.y,G.sh.y,eS),k:Math.exp(mix(Math.log(fsh.k),Math.log(G.sh.k),eS))};
  cur.shA=mix(F.shA,G.shA,e);
  if(toU){cur.cam=camLerp(camFromShoot(RT),G.cam,smooth(fade(tau,.9,1.5)));cur.uA=G.uA*fade(tau,.9,.3);}
  else if(G.cam){cur.cam=camLerp(F.cam,G.cam,e);cur.uA=mix(F.uA,G.uA,e);}
  else{cur.cam={...F.cam};cur.uA=F.uA*(1-fade(tau,0,.6));}
  cam=cur.cam;const R=cur.sh;
  const a=stepA(held,tau,k===0?.3:1.2),out=held?0:fade(tau,PER-.7,.6),la=held?1:1-out;

  // ── step-local state ──
  // step 1: the big grain grows out of the male cones
  let polA=0,pcx=PR1.x+GW*PR1.k/2,pcy=PR1.y+GH*PR1.k/2,pk=PR1.k;
  if(k===1){const gr=VIEW.fromK===1?1:smooth(fade(tau,.3,1.4));polA=VIEW.fromK===1?1:fade(tau,.3,.4);
    pcx=mix(hx(R,MALE.x),pcx,gr);pcy=mix(hy(R,MALE.y),pcy,gr);pk=Math.exp(mix(Math.log(.03),Math.log(PR1.k),gr));}
  else if(VIEW.fromK===1)polA=1-fade(tau,0,.6);
  // step 3: drop and grains (held: the cycle repeats every 9.6 s)
  const seq=k===3&&held&&tau>10.6?1+mod(tau-10.6,9.6):tau;
  const RMAX=20,grow=smooth(fade(seq,1.2,1.8)),ret=smooth(fade(seq,5.8,2.4)),dropR=RMAX*grow*(1-smooth(clamp(ret/.7)));
  const G_START=[[150,-80],[92,-52]],G_DIR=[3.74,2.84];
  const grains3=G_START.map((st,i)=>{const dir=G_DIR[i],[dx,dy]=dropC(dropR);
    const stick=[dx+(dropR+4)*Math.cos(dir),dy+(dropR+4)*Math.sin(dir)],uF=smooth(fade(seq,2.2+i*.9,2));
    let p;
    if(ret<=0||uF<1){const ctl=[st[0]+20,stick[1]-30];p=bez(st,ctl,stick,uF);p[0]+=3*Math.sin(t*2+i)*(1-uF);p[1]+=3*Math.cos(t*1.6+i)*(1-uF);}
    if(ret>0&&uF>=1){if(ret<.7){p=stick;}else{const m0=[MIC[0]+4*Math.cos(dir),MIC[1]+4*Math.sin(dir)];p=[mix(m0[0],G_END[i][0],(ret-.7)/.3),mix(m0[1],G_END[i][1],(ret-.7)/.3)];}}
    const fadeLoop=held&&tau>10.6?1-fade(seq,10.0,.55):1;
    return{x:p[0],y:p[1],ang:(i?-.5:.35)*(1-ret)+.4*Math.sin(t*1.5+i)*(1-uF),a:fade(seq,2.0+i*.9,.4)*fadeLoop,stuck:uF>=1};});
  // step 4: tube to the cavity; months on the time line
  const g4=k===4?fade(tau,1.8,7):0,egg4=k===4?fade(tau,8.6,.6):0;
  const tubeD=k===4?L_CAV*g4:k===5?mix(L_CAV,PATH.len,smooth(fade(tau,.4,1))):k===6?PATH.len:0;
  const tubeA=k===6?1-fade(tau,.4,1.2):1;
  // step 5: burst, sperm, union
  const burst=k===5?fade(tau,1.8,.01):0,zyg=k===5?smooth(fade(tau,4.1,.5)):k===6?1:0;
  // step 6: maturity, wing, flight (held: repeats)
  const m6=k===6?smooth(fade(tau,.8,2.6)):0,w6=k===6?smooth(fade(tau,3,1.5)):0;
  // flight cycle (6.5 s): fly 3.6 s, gone 0.6 s, the next seed re-forms on the scale 1 s, rest; play all runs it once
  let fly=0,back=1;
  if(k===6&&tau>=5.6){const cy=held?mod(tau-5.6,6.5):tau-5.6;
    if(cy<3.6)fly=Math.max(1e-4,smooth(cy/3.6));else if(cy<4.2)fly=1.01;else back=fade(cy,4.2,1);}
  const off=fly>0||back<1;   // the seed is not (fully) on the scale
  const months=k===4?12*g4:k===5?12:k===6?mix(12,21,smooth(fade(tau,.6,2.6))):0;

  c.save();c.imageSmoothingQuality='high';
  c.save();c.beginPath();c.rect(LP.x+LP.w,0,960-LP.x-LP.w,600);c.clip();   // pictures stay on the stage
  // ── the shoot (screen px) ──
  if(cur.shA>0){
    const thA=k===2?fade(tau,.6,.4)*cur.shA:0;
    if(thA>0){c.save();c.globalAlpha*=thA;D.round(c,RT.x-6,RT.y-6,HW*RT.k+12,HH*RT.k+12,12,'rgba(11,26,21,.92)',C.edge);c.restore();}
    shoot(c,R,cur.shA);
    if(k===0){const rA=i=>fade(tau,.4+i*.7,.5)*la;const w=R.k;
      ring(c,hx(R,MALE.x),hy(R,MALE.y),MALE.rx*w,MALE.ry*w,t,MALEC,rA(0));
      ring(c,hx(R,FEM.x),hy(R,FEM.y),FEM.rx*w,FEM.ry*w,t,FEMC,rA(1),FEM.rot);
      ring(c,hx(R,NEWS.x),hy(R,NEWS.y),NEWS.rx*w,NEWS.ry*w,t,SHOOTC,rA(2),NEWS.rot);
      dust(c,R,t,cur.shA*fade(tau,.2,.8));}
    if(k===1){windLines(c,t,fade(tau,1,.8)*la);windPollen(c,R,t,fade(tau,1.2,.8)*la);}
  }
  if(polA>0)bigPollen(c,pcx,pcy,pk,t,polA*(k===1?la:1));
  // ── the scale picture and everything on it (U px) ──
  if(cur.uA>0){
    c.save();c.translate(cam.sx-cam.ix*cam.k,cam.sy-cam.iy*cam.k);c.scale(cam.k,cam.k);c.globalAlpha*=cur.uA;
    if(k===6&&off)scaleOnly(c,1);else K.drawIn(c,SC,{x:0,y:0,w:UW,h:UH});
    const emb=k===6?smooth(fade(tau,1,2.4)):0;
    if(k===6&&fly===0){c.save();c.globalAlpha*=back;seedGroup(c,t,m6,w6,emb);c.restore();}
    if(k===2){const rA=i=>fade(tau,1.6+i*.6,.5)*la;
      ring(c,MIC[0],MIC[1],13,13,t,C.yellow,rA(1),0,lw);
      ring(c,374,116,170,121,t,'#f0abfc',rA(2),0,lw);
      c.save();c.globalAlpha*=rA(1);const ar=fade(tau,2.4,.8);dashed(c,[[MIC[0]-6,MIC[1]],[mix(MIC[0]-6,80,ar),MIC[1]]],C.yellow,lw(3),[lw(8),lw(6)],-t*lw(14));
      if(ar>.9)arrow(c,100,MIC[1],76,MIC[1],C.yellow,lw(3.4));c.restore();}
    if(k===3){droplet(c,dropR,t);
      grains3.forEach((g,i)=>grainU(c,g.x,g.y,22,g.ang,g.a,t));
      if(ret>.95){const u=mod(t*.7);circle(c,MIC[0],MIC[1],lw(10+u*16),null,rgba(C.yellow,.9*(1-u)),lw(3));}
      if(ret>0&&ret<.98){c.save();c.globalAlpha*=Math.sin(Math.PI*ret);arrow(c,MIC[0]-30,MIC[1],MIC[0]+2,MIC[1],C.yellow,lw(3));c.restore();}}
    if(k>=4){const ga=k===6?1-fade(tau,.4,1):1;
      grainU(c,G_END[1][0],G_END[1][1],20,-.5,ga*.75,t,.15);grainU(c,G_END[0][0],G_END[0][1],20,0,ga,t,k===4?.45:.25);
      tube(c,tubeD,t,tubeA);
      const eA=k===4?egg4:k===5?1:1-fade(tau,1.6,1.6);eggCell(c,t,eA*(k===6&&off?0:1),zyg);}
    if(k===5){const tip=alongP(PATH,tubeD);
      if(burst<=0){[5,14].forEach((b,j)=>{const p=alongP(PATH,Math.max(0,tubeD-b));sperm(c,p.x,p.y,p.ang,t,j*2.1,fade(tau,.2,.5));});}
      else{const u1=smooth(fade(tau,1.85,1)),u2=smooth(fade(tau,1.95,1.1)),v1=smooth(fade(tau,3,1.1));
        const s1=[mix(mix(tip.x,293,u1),EGGN[0],v1),mix(mix(tip.y,106,u1),EGGN[1],v1)];
        if(tau<4.25)sperm(c,s1[0],s1[1],-.2,t,0);
        sperm(c,mix(tip.x,291,u2),mix(tip.y,124,u2),.4,t,2.1,1-fade(tau,4.4,1.4));
        if(tau<2.9){const r=(tau-1.8)/1.1;circle(c,tip.x,tip.y,lw(6+r*30),null,rgba(TUBE,.95*(1-r)),lw(3));}
        if(tau>4.1&&tau<5.2){const r=(tau-4.1)/1.1;circle(c,EGGN[0],EGGN[1],lw(14+r*40),null,rgba(C.yellow,.9*(1-r)),lw(3));}}}
    if(k===6&&fly>0&&fly<=1){const piv=[400,116],p=bez([0,0],[260,-40],[720,-560],fly),sc=mix(1,.5,fly),rot=fly*3.2*TAU+.15*Math.sin(t*3);
      c.save();c.globalAlpha*=1-fade(fly,.8,.2);c.translate(piv[0]+p[0],piv[1]+p[1]);c.rotate(rot);c.scale(sc,sc);c.translate(-piv[0],-piv[1]);
      seedGroup(c,t,m6,w6,emb);c.restore();}
    c.restore();
  }
  c.restore();
  // ── screen overlays ──
  if(k===2&&cur.shA>0)thumbFrame(c,t,fade(tau,1.6,.5)*cur.shA*la,R);
  if(k>=4)timeline(c,L,months,t,(k===4?fade(tau,1,.6):1)*(held?1:1-fade(tau,PER-.4,.4)));
  // ── left panel ──
  D.round(c,LP.x,LP.y,LP.w,LP.h,16,'rgba(11,26,21,.9)',C.edge);
  c.save();c.globalAlpha*=held?1:1-fade(tau,PER-.4,.4);const cap=fitText(c,SHORT[k],LX,LP.y+12,LW,STEPCOL[k],{active:true});c.restore();
  const noteTop=notes(c,L,k);let ly=cap.y+cap.h+20;
  if(k===0){
    tagBox(c,L.female,946,14,300,HS(R,505,44),FEMC,a*fade(tau,1.1,.5),{align:'right'});
    tagBox(c,L.shoot,330,120,240,HS(R,NEWS.x-30,NEWS.y+8),SHOOTC,a*fade(tau,1.8,.5));
    tagBox(c,L.male,700,440,240,HS(R,392,350),MALEC,a*fade(tau,.4,.5));
    c.save();c.globalAlpha*=a*fade(tau,2.6,.6);textBlock(c,L.shed,712,512,230,C.yellow);c.restore();
    c.save();c.globalAlpha*=a*fade(tau,3.2,.6);textBlock(c,L.hint0,LX,ly+20,LW,C.yellow);c.restore();
  }
  if(k===1){const pr={x:pcx-GW*pk/2,y:pcy-GH*pk/2+3.5*Math.sin(t*1.3)},PS=(u,v)=>[pr.x+u*pk,pr.y+v*pk],ta=i=>a*fade(tau,1.6+i*.5,.5);
    tagBox(c,L.sacs2,690,14,320,PSAC.map(([u,v])=>PS(u,v)),C.white,ta(0),{align:'center'});
    tagBox(c,L.airy,300,112,200,PS(24,112),DROP,ta(1));
    c.save();c.globalAlpha*=ta(2);bracketH(c,pr.x+6,pr.x+GW*pk-6,pr.y+GH*pk+12,POLC,1);c.restore();
    tagBox(c,L.grain,690,pr.y+GH*pk+26,300,null,POLC,ta(2),{align:'center'});
    tagBox(c,L.male,530,548,240,HS(R,392,352),MALEC,ta(3));
    tagBox(c,L.female,600,326,300,HS(R,548,92),FEMC,ta(3));
    tagBox(c,L.wind,880,452,120,null,C.white,ta(4),{align:'center'});
    c.save();c.globalAlpha*=a*fade(tau,3.6,.6);textBlock(c,L.few,LX,ly+20,LW,C.yellow);c.restore();
  }
  if(k===2){const b=i=>a*fade(tau,1.2+i*.6,.5);
    tagBox(c,L.naked,300,14,470,S(...OV_T),'#f0abfc',b(2));
    let y=ly;tagBox(c,L.axis,LX,y,LW,S(...AXIS_T),STRUCT,b(0));y+=fitH(c,L.axis,LW)+14;
    tagBox(c,L.micAxis,LX,y,LW,S(MIC[0]-2,MIC[1]),C.yellow,b(1));y+=fitH(c,L.micAxis,LW)+14;
    tagBox(c,L.noStig,LX,y,LW,null,NOPE,b(3));y+=fitH(c,L.noStig,LW)+22;
    c.save();c.globalAlpha*=b(4);textBlock(c,L.two,LX,y+18,LW,C.white);c.restore();
    topView(c,306,532,t,b(4));c.save();c.globalAlpha*=b(4);textBlock(c,L.top,458,522,130,C.muted);c.restore();
    tagBox(c,L.bract,612,480,180,S(...BRACT_T),STRUCT,b(5));
    tagBox(c,L.scale,946,480,220,S(...SCALE_T),STRUCT,b(5),{align:'right'});
  }
  if(k===3){
    const ph=seq<2.2?0:seq<5.8?1:2,t0=[0,2.2,5.8][ph];
    c.save();c.globalAlpha*=la*fade(seq,ph?t0:.6,.4);textBlock(c,L.ph3[ph],LX,ly+20,LW,ph===2?C.green:C.yellow);c.restore();
    const [dx,dy]=dropC(Math.max(dropR,6));
    tagBox(c,L.drop,468,334,250,[X(dx),Y(dy+Math.max(dropR,6))],DROP,a*fade(tau,1.8,.5)*clamp(dropR/3));
    tagBox(c,L.mic,720,150,220,S(MIC[0]+2,MIC[1]-5),C.yellow,a*fade(tau,1.4,.5));
    c.save();c.globalAlpha*=a*fade(tau,2.2,.6);D.round(c,300,506,646,82,14,'rgba(11,26,21,.92)',C.edge);
    text(c,L.angioCmp,320,538,22,C.muted);text(c,L.pineCmp,320,572,22,DROP);c.restore();
  }
  if(k===4){
    let y=ly;c.save();c.globalAlpha*=a;y+=textBlock(c,L.slow,LX,y+20,LW,C.yellow)+16;
    y+=textBlock(c,L.angioT,LX,y+20,LW,C.orange);D.round(c,LX,y+6,LW,14,7,rgba(C.muted,.18),null);D.round(c,LX,y+6,5,14,3,C.orange,null);y+=34;
    y+=textBlock(c,L.pineT,LX,y+20,LW,TUBE);D.round(c,LX,y+6,LW,14,7,rgba(C.muted,.18),null);
    const bw=Math.max(5,LW*g4);D.round(c,LX,y+6,bw,14,7,TUBE,null);glow(c,LX+bw,y+13,12,TUBE,.4+.3*Math.sin(t*3));y+=34;
    c.restore();
    const ta=(t0)=>a*fade(tau,t0,.5);
    tagBox(c,L.pollen,304,40,196,S(G_END[0][0]-4,G_END[0][1]-4),POLC,ta(1.2));
    if(tubeD>8){const p=alongP(PATH,tubeD*.5);tagBox(c,L.tube,304,108,196,S(p.x,p.y),TUBE,ta(2.4));}
    tagBox(c,L.nuc,304,176,196,S(...NUC_T),STRUCT,ta(1.8));
    tagBox(c,L.egg,690,108,200,S(EGGC.x+EGGC.rx-2,EGGC.y-10),EGG.lab,a*egg4);
  }
  if(k===5){
    let y=ly+6;c.save();c.globalAlpha*=la;
    y+=eqRow(c,L.eq[0][0],L.eq[0][1],y+20,C.cyan,C.cyan,fade(tau,2.6,.5));
    y+=eqRow(c,L.eq[1][0],L.eq[1][1],y+20,EGG.lab,EGG.lab,fade(tau,2.6,.5));
    c.save();c.globalAlpha*=fade(tau,4.1,.5);line(c,[[LX,y+4],[LX+LW,y+4]],rgba(C.white,.8),2);c.restore();
    y+=eqRow(c,L.eq[2][0],L.eq[2][1],y+30,C.white,C.yellow,fade(tau,4.2,.5),true)+20;
    c.save();c.globalAlpha*=fade(tau,5.6,.6);fitText(c,L.one,LX,y,LW,C.yellow,{active:true});c.restore();
    c.restore();
    const ta=(t0)=>a*fade(tau,t0,.5),tip=alongP(PATH,tubeD);
    tagBox(c,L.tube,304,40,196,S(...(()=>{const p=alongP(PATH,tubeD*.45);return[p.x,p.y];})()),TUBE,ta(.4));
    if(tau>1.8)tagBox(c,L.burst,304,120,196,S(tip.x,tip.y),TUBE,a*fade(tau,1.9,.4)*(1-fade(tau,4.2,.5)));
    tagBox(c,zyg>.5?L.zyg:L.eggN,690,108,240,S(EGGC.x+EGGC.rx-2,EGGC.y-12),EGG.lab,ta(.6));
    if(tau>1.9&&tau<4.2){const u1=smooth(fade(tau,1.85,1)),u2=smooth(fade(tau,1.95,1.1)),v1=smooth(fade(tau,3,1.1));
      tagBox(c,L.sperm2,690,232,250,[S(mix(mix(tip.x,293,u1),EGGN[0],v1),mix(mix(tip.y,106,u1),EGGN[1],v1)),S(mix(tip.x,291,u2),mix(tip.y,124,u2))],C.cyan,a*fade(tau,2.2,.4)*(1-fade(tau,3.9,.3)));}
    if(tau>=4.2)tagBox(c,L.other,690,232,250,S(291,124),C.cyan,a*fade(tau,4.3,.4)*(1-fade(tau,6.2,.8)));
  }
  if(k===6){
    const vis=fly>0?0:back,b=i=>a*fade(tau,1.2+i*.7,.5);
    let y=ly;
    tagBox(c,L.seedT,LX,y,LW,S(...OV_T),COAT,b(1)*vis);y+=fitH(c,L.seedT,LW)+12;
    tagBox(c,L.emb,LX,y,LW,S(330,113),EGG.lab,b(2)*vis);y+=fitH(c,L.emb,LW)+12;
    tagBox(c,L.wing,LX,y,LW,S(652,108),WINGC,a*fade(tau,3.6,.5)*vis);y+=fitH(c,L.wing,LW)+20;
    c.save();c.globalAlpha*=a*fade(tau,4.6,.6);textBlock(c,L.bare,LX,y+20,LW,C.yellow);fitText(c,L.notFruit,300,14,300,C.orange,{active:true});c.restore();
  }
  c.restore();
}
window.PlantsDraw=window.PlantsDraw||{};
window.PlantsDraw.gymno=draw;
})();

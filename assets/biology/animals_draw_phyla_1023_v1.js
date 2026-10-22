/* Animals · "Six groups: what evidence?" canvas (phyla tab, view 0), 2026-10-23.
 * One animal per step (moon jelly, planarian, octopus, earthworm, crab, sea star). Each step:
 *   the animal large on the left (main); a yellow zoom box on it grows into a close-up frame at the top right
 *   (AGENTS.md law 9-2: local enlargement, the frame grows out of the box, dashed lines join them);
 *   the evidence structure is marked on the close-up or the main picture; a yellow "evidence" label and an orange
 *   "do not judge only by ___" label sit under the frame; the group name is a cyan pill in the header.
 *   Bottom strip: six thumbnails with cyan group names; the current one is lit, seen ones dimmer, unseen dimmest.
 *  0 moon jelly: close-up of the tentacle fringe, drawn cnidocyte capsules (schematic) that fire a thread now and then.
 *  1 planarian: a yellow cut line sweeps along the body; the frame shows the flat cross-section (schematic), its width
 *    taken from the measured body width at the cut.
 *  2 octopus: pink count markers 1–8 on the eight arm tips, "8 arms"; close-up of an arm (muscular foot); "soft body".
 *  3 earthworm: close-up of a straight stretch; pink numbers on ten ring segments between measured grooves.
 *  4 crab (same picture as unit 2): yellow rings on measured leg joints, on the main picture and the close-up;
 *    "exoskeleton" on the carapace.
 *  5 sea star: top (spines ringed) and underside (close-up of tube feet); then the closing card:
 *    "No backbone: not one phylum", a pink bracket over all six thumbnails, "6 phyla".
 * All points (arm tips, grooves, joints, spines, tentacles, body widths) were measured once from the PNG alpha/colour.
 * Step changes (0.9 s): old step fades out, then the new one fades in; the thumbnail strip stays.
 */
(()=>{'use strict';
const K=window.AnimalsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,src,dim,fitRect,drawIn,MONO,TAU}=K;
const LB=()=>K.LAB||{};
const L=(k,zh,en)=>LB()[k]||P(zh,en);
const N=6,PER=9,CONCL=5.4;
const FRAME_BG='#16332b',PINK=C.pink,CYAN=C.cyan,ORANGE=C.orange,YELLOW=C.yellow;

// ── layout (canvas px) ─────────────────────────────────────────────────────
const MAIN={x:20,y:72,w:590,h:396};
const RX=630,RW=310;
const INS={x:RX,y:72,w:RW,h:180};
const EVY=270;
const CELL=150,GAP=6,SX=15,SY=484;

// ── measured from the PNGs (image px) ──────────────────────────────────────
const JF='jellyfish.png',PL='planarian.png',OC='octopus.png',EW='earthworm.png',CR='crab.png',ST='seastar_top.png',SU='seastar_under.png';
const CROP={[JF]:[40,470,280,163],[OC]:[560,552,290,168],[EW]:[640,282,244,142],[CR]:[300,150,148,86],[SU]:[640,380,300,174]};
// moon jelly: points on the tentacle fringe (bright tentacle edge, alpha > 200)
const CNIDO=[[89,552],[114,552],[139,552],[169,552],[216,552],[257,552],[124,576],[229,576],[184,588],[99,600],[224,600],[259,564]];
// planarian: body extent (top, bottom) every 50 px of x, from alpha > 128
const PLW=[[150,11,287],[200,60,238],[250,66,233],[300,58,241],[350,46,253],[400,34,264],[450,25,274],[500,19,280],[550,17,283],[600,19,282],[650,24,278],[700,29,274],[750,35,268],[800,40,263],[850,45,258],[900,52,251],[950,60,243],[1000,70,232]];
const plAt=x=>{for(let i=1;i<PLW.length;i++)if(x<=PLW[i][0]){const a=PLW[i-1],b=PLW[i],u=(x-a[0])/(b[0]-a[0]);return[mix(a[1],b[1],u),mix(a[2],b[2],u)];}return[PLW.at(-1)[1],PLW.at(-1)[2]];};
// octopus: the eight arm tips (snapped onto opaque pixels)
const ARMS=[[328,158],[196,347],[124,457],[289,588],[798,561],[901,361],[1068,221],[1041,408]];
const MANTLE=[800,120];
// earthworm: ring grooves along the straight stretch (dark minima of brightness along the body axis)
const GROOVES=[[623,414],[649,405],[678,395],[708,385],[741,373],[772,362],[807,350],[837,339],[868,328],[898,318],[926,308]];
const WN=[.330,.944];   // unit normal to the body axis (image px)
// crab: leg and claw joints
const JOINTS=[[358,163],[392,171],[426,190],[360,200],[402,262],[372,112],[388,78]];
const CARAPACE=[225,150];
// sea star top: spine tips on the top arm's left edge; underside: tube feet on the right arm
const SPINES=[[452,126],[439,185],[427,256],[95,344],[235,360]];
const FEET=[[700,488],[790,462],[880,436]];

// ── labels added by this module (LAB has none for these) ───────────────────
const T={
 tentacles:P(`觸手`,`Tentacles`),arm:P(`腕`,`Arm`),enlarged:P(`放大`,`enlarged`),
 cnidoSchem:P(`刺絲胞（示意）`,`Cnidocytes (schematic)`),
 section:P(`剖面（示意）`,`Cross-section (schematic)`),cutHere:P(`切開這裡（示意）`,`Cut here (schematic)`),back:P(`背面`,`Back`),belly:P(`腹面`,`Belly`),
 arms8:P(`8 條腕`,`8 arms`),soft:P(`柔軟、不分節`,`Soft, unsegmented body`),
 notSlender:P(`細長`,`a long body`),
 joints:P(`關節`,`Joints`),spines:P(`棘`,`Spines`),tubeFeet:P(`管足`,`Tube feet`),topSide:P(`背面`,`Top side`),underSide:P(`腹面`,`Underside`),
 c1:P(`這六種動物都沒有脊椎骨，`,`None of these six animals has a backbone,`),
 c2:P(`卻分屬六個不同的門。`,`yet they belong to six different phyla.`),
 c3:P(`分類要看牠們「有」的構造，不是共同「缺少」的。`,`Classify by the structures they have, not by what they all lack.`),
 phyla6:P(`6 個門`,`6 phyla`)
};

// ── steps ──────────────────────────────────────────────────────────────────
const STEP=[
 {f:JF,name:'jellyfish',grp:'cnidaria',ev:'evCnidocyte',not:['notSwim','會游泳','swimming'],part:T.tentacles},
 {f:PL,name:'planarian',grp:'flatworm',ev:'evFlat',not:['notLong','細長像蟲','a long wormy body']},
 {f:OC,name:'octopus',grp:'mollusc',ev:'evSoft',not:['notShell','有沒有殼','having a shell'],part:T.arm},
 {f:EW,name:'earthworm',grp:'annelid',ev:'evRings',not:null,part:null},
 {f:CR,name:'crab',grp:'arthropod',ev:'evExo',not:['notShell','有沒有殼','having a shell'],part:null},
 {f:SU,name:'seastar',grp:'echinoderm',ev:'evSpines',not:['notColor','顏色與外形','colour and shape'],part:null}
];
const THUMB=[JF,PL,OC,EW,CR,ST];
const GRP=[['cnidaria','刺絲胞動物','Cnidarian'],['flatworm','扁形動物','Flatworm'],['mollusc','軟體動物','Mollusc'],['annelid','環節動物','Annelid'],['arthropod','節肢動物','Arthropod'],['echinoderm','棘皮動物','Echinoderm']];
const NAMES=[['jellyfish','月水母','Moon jelly'],['planarian','渦蟲','Planarian'],['octopus','章魚','Octopus'],['earthworm','蚯蚓','Earthworm'],['crab','蟹','Crab'],['seastar','海星','Sea star']];
const EVS=[['evCnidocyte','刺絲胞','Cnidocytes'],['evFlat','腹背扁平','Flattened body'],['evSoft','柔軟身體、肌肉足','Soft body, muscular foot'],['evRings','環狀分節','Ring-like segments'],['evExo','外骨骼、分節附肢','Exoskeleton, jointed limbs'],['evSpines','棘與管足','Spines and tube feet']];

// ── text helpers (as in plants_draw_zoom_1022_v1.js) ───────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
function bottomBlock(c,p,x,yb,w,col,{lh=28,align='left'}={}){const rows=rowsOf(c,p,w);rows.forEach((r,i)=>text(c,r,x,yb-(rows.length-1-i)*lh,22,col,align));return rows.length*lh;}
// fitText: a label in a dark rounded box, measured first; one line if it fits in maxW, otherwise wrapped (never shrunk).
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22}={}){
  const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7,h=rows.length*lh+11,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();c.beginPath();c.roundRect(bx,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(col,.85);c.lineWidth=2;c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
function ring(c,x,y,r,t,a,col=YELLOW){if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,null,rgba(C.deep,.75),6.5);c.setLineDash([7,5]);c.lineDashOffset=-t*14;circle(c,x,y,r,null,col,3);c.restore();c.save();c.globalAlpha*=a;K.pulse(c,x,y,t,col,r);c.restore();}
function zbox(c,b,t,a=1){if(a<=0)return;c.save();c.globalAlpha*=a;
  c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.strokeStyle=rgba(C.deep,.8);c.lineWidth=6;c.stroke();
  c.setLineDash([6,4]);c.lineDashOffset=-t*12;c.strokeStyle=YELLOW;c.lineWidth=2.6;c.stroke();c.restore();}
function cone(c,b,r,t,a=1){if(a<=0)return;
  const Ls=[[[b.x+b.w,b.y],[r.x,r.y]],[[b.x+b.w,b.y+b.h],[r.x,r.y+r.h]]];
  c.save();c.globalAlpha*=a;Ls.forEach(pts=>{line(c,pts,rgba(C.deep,.6),4.5);dashed(c,pts,rgba(YELLOW,.9),2,[7,6],-t*12);});c.restore();}
// pink count marker, 22px number
function count(c,x,y,n,a,r=15){if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r+3,rgba(C.deep,.7),null);circle(c,x,y,r,PINK,C.ink,2);
  c.font=MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
const mp=(r,f,ix,iy)=>{const [W,H]=dim(f);return[r.x+ix/W*r.w,r.y+iy/H*r.h];};
const boxOn=(r,f,cr)=>{const [W,H]=dim(f);return{x:r.x+cr[0]/W*r.w,y:r.y+cr[1]/H*r.h,w:cr[2]/W*r.w,h:cr[3]/H*r.h};};
const mi=(R,cr,ix,iy)=>[R.x+(ix-cr[0])/cr[2]*R.w,R.y+(iy-cr[1])/cr[3]*R.h];
const inR=(cr,[ix,iy])=>ix>cr[0]+6&&ix<cr[0]+cr[2]-6&&iy>cr[1]+6&&iy<cr[1]+cr[3]-6;
// the close-up frame: a crop of the same full-resolution PNG
function frame(c,f,cr,R,a){if(a<=0)return;const im=pic(src(f)),rad=Math.min(16,R.w*.08);c.save();c.globalAlpha*=a;
  c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,rad);c.fillStyle=FRAME_BG;c.fill();
  c.save();c.clip();if(im){c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,cr[0],cr[1],cr[2],cr[3],R.x,R.y,R.w,R.h);}c.restore();
  c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,rad);c.strokeStyle=rgba(C.white,.85);c.lineWidth=2.5;c.stroke();c.restore();}
function panelBox(c,R,a){if(a<=0)return;c.save();c.globalAlpha*=a;c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,16);c.fillStyle=FRAME_BG;c.fill();c.strokeStyle=rgba(C.white,.85);c.lineWidth=2.5;c.stroke();c.restore();}
const lab=(arr)=>L(arr[0],arr[1],arr[2]);
const capt=(p)=>P(`${p[0]}（${T.enlarged[0]}）`,`${p[1]} (${T.enlarged[1]})`);

// ── zoom chain shared by steps with a close-up ─────────────────────────────
function zoomChain(c,f,r,tau,t){
  const cr=CROP[f],b=boxOn(r,f,cr),g=smooth(clamp((tau-1)/.8));
  zbox(c,b,t,fade(tau,.5,.4));
  let R=null;if(tau>1){R=lerpR(b,INS,g);frame(c,f,cr,R,clamp((tau-1)/.15));}
  if(R)cone(c,b,R,t,clamp((tau-1.8)/.3));
  return{R,cr,done:g>=1};
}

// ── right column: evidence (yellow) and "do not judge only by" (orange) ───
function labelsRight(c,k,tau){
  const S=STEP[k],ev=lab(EVS[k]),evid=L('evidence','證據','Evidence'),Lb=LB();
  let e=null;
  c.save();c.globalAlpha*=fade(tau,1.8,.5);
  e=fitText(c,P(`${evid[0]}：${ev[0]}`,`${evid[1]}: ${ev[1]}`),RX,EVY,RW,YELLOW);
  c.restore();
  const no=L('notOnly','不能只看','Do not judge only by'),x=S.not?L(...S.not):T.notSlender;
  c.save();c.globalAlpha*=fade(tau,3,.5);
  fitText(c,P(`${no[0]}「${x[0]}」`,`${no[1]} ${x[1]}`),RX,e.y+e.h+18,RW,ORANGE);
  c.restore();
  return e;
}
function header(c,k){
  const g=lab(GRP[k]),n=lab(NAMES[k]);
  const pl=fitText(c,g,20,12,400,CYAN,{active:true});
  text(c,n,pl.x+pl.w+14,pl.y+pl.h/2+9,26,C.white);
}

// ── steps ──────────────────────────────────────────────────────────────────
const bob=t=>3*Math.sin(t*1.2);
function step0(c,tau,t){
  const r0=fitRect(JF,MAIN.x,MAIN.y,MAIN.w,MAIN.h),r={...r0,y:r0.y+bob(t)};
  drawIn(c,JF,r);
  const {R,cr,done}=zoomChain(c,JF,r,tau,t);
  if(R){c.save();c.globalAlpha*=fade(tau,1.9,.5);
    const k=R.w/cr[2];
    CNIDO.forEach(([ix,iy],i)=>{const [x,y]=mi(R,cr,ix,iy);
      // a thread fires now and then (schematic)
      const ph=mod(t*.45+i*.37);if(ph<.35){const u=ph/.35,len=30*smooth(u*1.6);c.save();c.globalAlpha*=1-u;
        c.beginPath();c.moveTo(x,y+7);for(let s=0;s<=10;s++){const q=s/10;c.lineTo(x+Math.sin(q*9+t*6)*2.6,y+7+q*len);}c.strokeStyle=YELLOW;c.lineWidth=1.8;c.stroke();c.restore();}
      ellipse(c,x,y,5.5,8,rgba(YELLOW,.95),C.ink,1.5);circle(c,x,y-2,2.2,rgba(C.ink,.6),null);});
    c.restore();
    c.save();c.globalAlpha*=fade(tau,2.2,.5);
    fitText(c,capt(T.tentacles),R.x+8,R.y+8,R.w-16,C.white);
    const cp=fitText(c,T.cnidoSchem,R.x+R.w-8,R.y+R.h-48,R.w-16,YELLOW,{align:'right'});
    const ax=cp.x+cp.w/2,tg=CNIDO.map(p=>mi(R,cr,...p)).filter(([x,y])=>y<cp.y-10).sort((a,b)=>Math.abs(a[0]-ax)-Math.abs(b[0]-ax))[0];if(tg)lead(c,ax,cp.y,tg[0],tg[1]+8,YELLOW);
    c.restore();}
  labelsRight(c,0,tau);
}
function step1(c,tau,t){
  const r0=fitRect(PL,MAIN.x,MAIN.y,MAIN.w,MAIN.h),r={...r0,y:r0.y+bob(t)};
  drawIn(c,PL,r);
  const cx=640+250*Math.sin(t*.45),[top,bot]=plAt(cx),[mx,my0]=mp(r,PL,cx,top),[,my1]=mp(r,PL,cx,bot);
  const a1=fade(tau,.5,.5);
  if(a1>0){c.save();c.globalAlpha*=a1;
    line(c,[[mx,my0-16],[mx,my1+16]],rgba(C.deep,.8),6);dashed(c,[[mx,my0-16],[mx,my1+16]],YELLOW,3,[8,5],-t*14);
    const cl=fitText(c,T.cutHere,Math.max(170,Math.min(mx,460)),my1+40,300,YELLOW,{align:'center'});
    lead(c,mx,cl.y,mx,my1+16,YELLOW);
    c.restore();}
  const pa=fade(tau,1,.6);
  if(pa>0){panelBox(c,INS,pa);
    c.save();c.globalAlpha*=pa;
    const b={x:mx-3,y:my0-16,w:6,h:my1-my0+32};cone(c,b,INS,t,clamp((tau-1.2)/.3));
    text(c,T.section,INS.x+14,INS.y+34,22,C.white);
    const ex=INS.x+INS.w/2,ey=INS.y+118,rx=(bot-top)*.42,ry=Math.max(12,rx*.19);
    ellipse(c,ex,ey,rx,ry,'#a1836d','#5a4030',3);ellipse(c,ex,ey-ry*.35,rx*.82,ry*.42,rgba('#d9bfa8',.35),null);
    text(c,T.back,ex,ey-ry-16,22,C.white,'center');text(c,T.belly,ex,ey+ry+32,22,C.white,'center');
    c.restore();}
  const e=labelsRight(c,1,tau);
  if(e){c.save();c.globalAlpha*=fade(tau,1.8,.5);const ex=INS.x+INS.w/2,ey=INS.y+118,rx=(bot-top)*.42;lead(c,e.x+24,e.y,ex-rx*.6,ey+8,YELLOW);c.restore();}
}
function step2(c,tau,t){
  const w=540,h=w*dim(OC)[1]/dim(OC)[0],r={x:20,y:MAIN.y+MAIN.h-h+bob(t),w,h};
  drawIn(c,OC,r);
  const {R}=zoomChain(c,OC,r,tau,t);
  ARMS.forEach((p,i)=>{const [x,y]=mp(r,OC,...p);count(c,x,y,i+1,fade(tau,1+i*.28,.3));});
  c.save();c.globalAlpha*=fade(tau,3.4,.5);fitText(c,T.arms8,24,80,240,PINK);c.restore();
  c.save();c.globalAlpha*=fade(tau,2.4,.5);
  const sp=fitText(c,T.soft,430,76,300,C.white,{align:'center'});const [mx,my]=mp(r,OC,...MANTLE);lead(c,sp.x+sp.w/2,sp.y+sp.h,mx,my,C.white);
  c.restore();
  if(R){c.save();c.globalAlpha*=fade(tau,2.2,.5);fitText(c,P(`${T.arm[0]}＝${L('muscleFoot','肌肉足','Muscular foot')[0]}`,`${T.arm[1]} = ${L('muscleFoot','肌肉足','Muscular foot')[1].toLowerCase()}`),R.x+8,R.y+8,R.w-16,C.white);c.restore();}
  labelsRight(c,2,tau);
}
function step3(c,tau,t){
  const r0=fitRect(EW,MAIN.x,MAIN.y,MAIN.w,MAIN.h),r={...r0,y:r0.y+bob(t)};
  drawIn(c,EW,r);
  const {R,cr}=zoomChain(c,EW,r,tau,t);
  if(R){const kk=R.w/cr[2];
    const G=GROOVES.filter(p=>inR(cr,p));for(let i=0;i<G.length-1;i++){const a=G[i],b=G[i+1],ix=(a[0]+b[0])/2-WN[0]*22,iy=(a[1]+b[1])/2-WN[1]*22;
      const [x,y]=mi(R,cr,ix,iy);count(c,x,y,i+1,fade(tau,2+i*.22,.3),14);}
    c.save();c.globalAlpha*=fade(tau,2.2,.5);fitText(c,capt(L('body','身體','Body')),R.x+8,R.y+8,R.w-90,C.white);c.restore();
    const e=labelsRight(c,3,tau);
    c.save();c.globalAlpha*=fade(tau,1.8,.5);const [gx,gy]=mi(R,cr,GROOVES[4][0]+WN[0]*14,GROOVES[4][1]+WN[1]*14);lead(c,gx,e.y,gx,gy,YELLOW);c.restore();
  }else labelsRight(c,3,tau);
}
function step4(c,tau,t){
  const r0=fitRect(CR,MAIN.x,MAIN.y,MAIN.w,MAIN.h),r={...r0,y:r0.y+bob(t)};
  drawIn(c,CR,r);
  const {R,cr}=zoomChain(c,CR,r,tau,t);
  JOINTS.forEach((p,i)=>{const [x,y]=mp(r,CR,...p);ring(c,x,y,9,t+i*.3,fade(tau,2.2+i*.12,.4));});
  c.save();c.globalAlpha*=fade(tau,2.6,.5);
  const ex=L('exoskeleton','外骨骼','Exoskeleton'),[cx,cy]=mp(r,CR,...CARAPACE),ep=fitText(c,ex,cx,cy-62,300,C.white,{align:'center'});
  lead(c,cx,ep.y+ep.h,cx,cy,C.white);
  c.restore();
  if(R){JOINTS.forEach((p,i)=>{if(!inR(cr,p))return;const [x,y]=mi(R,cr,...p);ring(c,x,y,13,t+i*.3,fade(tau,2.2+i*.12,.4));});
    c.save();c.globalAlpha*=fade(tau,2.4,.5);
    fitText(c,capt(L('legs','步足','Walking legs')),R.x+8,R.y+8,R.w-16,C.white);
    const jp=fitText(c,T.joints,R.x+R.w-8,R.y+R.h-48,R.w-16,YELLOW,{align:'right'});const [jx,jy]=mi(R,cr,...JOINTS[2]);lead(c,jp.x+jp.w/2,jp.y,jx,jy+13,YELLOW);
    c.restore();}
  labelsRight(c,4,tau);
}
function step5(c,tau,t){
  const rt0=fitRect(ST,20,100,290,300),ru0=fitRect(SU,320,100,290,300),b=bob(t),rt={...rt0,y:rt0.y+b},ru={...ru0,y:ru0.y-b};
  drawIn(c,ST,rt);drawIn(c,SU,ru);
  text(c,T.topSide,rt.x+rt.w/2,rt0.y+rt0.h+36,22,C.white,'center');text(c,T.underSide,ru.x+ru.w/2,ru0.y+ru0.h+36,22,C.white,'center');
  SPINES.forEach((p,i)=>{const [x,y]=mp(rt,ST,...p);ring(c,x,y,8,t+i*.3,fade(tau,2+i*.12,.4));});
  c.save();c.globalAlpha*=fade(tau,2.4,.5);const sp=fitText(c,T.spines,30,74,200,C.white);const [sx,sy]=mp(rt,ST,...SPINES[0]);lead(c,sp.x+sp.w/2,sp.y+sp.h,sx-3,sy,C.white);c.restore();
  const {R,cr}=zoomChain(c,SU,ru,tau,t);
  if(R){FEET.forEach((p,i)=>{const [x,y]=mi(R,cr,...p);ring(c,x,y,14,t+i*.4,fade(tau,2.2+i*.15,.4));});
    c.save();c.globalAlpha*=fade(tau,2.2,.5);
    fitText(c,capt(T.underSide),R.x+8,R.y+8,R.w-16,C.white);
    const fp=fitText(c,T.tubeFeet,R.x+R.w-8,R.y+R.h-48,R.w-16,YELLOW,{align:'right'});const [fx,fy]=mi(R,cr,...FEET[2]);lead(c,fp.x+fp.w/2,fp.y,fx,fy+14,YELLOW);
    c.restore();}
  labelsRight(c,5,tau);
}
const STEPS=[step0,step1,step2,step3,step4,step5];

// ── closing card (end of the sea-star step) ────────────────────────────────
function closing(c,a,t){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const x=60,y=110,w=840,h=250;
  D.round(c,x,y,w,h,18,'rgba(11,26,21,.95)',null);
  c.save();c.beginPath();c.roundRect(x,y,w,h,18);c.strokeStyle=YELLOW;c.lineWidth=3;c.stroke();c.restore();
  text(c,L('noVertebrae','沒有脊椎骨：不是一個門','No backbone: not one phylum'),480,y+60,32,YELLOW,'center');
  let yy=y+118;
  [T.c1,T.c2].forEach(p=>{rowsOf(c,p,w-60).forEach(r=>{text(c,r,480,yy,24,C.white,'center');yy+=36;});});
  yy+=14;rowsOf(c,T.c3,w-60).forEach(r=>{text(c,r,480,yy,22,C.muted,'center');yy+=32;});
  // pink bracket over the six thumbnails, "6 phyla"
  const by=SY-8,x0=SX+8,x1=SX+6*CELL+5*GAP-8,pu=.5+.5*Math.sin(t*3);
  c.save();c.lineCap='round';
  line(c,[[x0,by+6],[x0,by],[x1,by],[x1,by+6]],rgba(C.deep,.8),7);line(c,[[x0,by+6],[x0,by],[x1,by],[x1,by+6]],PINK,3);
  for(let i=0;i<6;i++){const cx=SX+i*(CELL+GAP)+CELL/2;line(c,[[cx,by],[cx,by+6]],PINK,3);}
  c.restore();
  const pp=fitText(c,T.phyla6,480,by-46,300,PINK,{align:'center',active:true});
  c.save();c.globalAlpha*=.4+.6*pu;circle(c,pp.x-14,pp.y+pp.h/2,5,PINK,null);circle(c,pp.x+pp.w+14,pp.y+pp.h/2,5,PINK,null);c.restore();
  c.restore();
}

// ── thumbnail strip ────────────────────────────────────────────────────────
function strip(c,k,seen,allOn,t){
  for(let i=0;i<6;i++){const x=SX+i*(CELL+GAP),cur=i===k,on=allOn||cur,al=on?1:seen.has(i)?.55:.25;
    if(cur){c.save();glow(c,x+CELL/2,SY+40,70,CYAN,.18+.06*Math.sin(t*2));c.restore();}
    const wv=allOn?Math.max(0,1-Math.abs(mod(t*.8,7.5)-.5-i)):0;   // closing: a highlight sweeps across the six groups
    if(wv>0){c.save();glow(c,x+CELL/2,SY+44,80,CYAN,.35*wv);c.restore();}
    D.round(c,x,SY,CELL,108,12,cur?'rgba(85,233,255,.12)':'rgba(11,26,21,.55)',null);
    c.save();c.beginPath();c.roundRect(x,SY,CELL,108,12);c.strokeStyle=cur?CYAN:rgba(C.edge,.9);c.lineWidth=cur?3:1.5;c.stroke();c.restore();
    K.place(c,THUMB[i],x+8,SY+6-6*wv,CELL-16,58,{alpha:al});
    c.save();c.globalAlpha*=on?1:al+.15;text(c,lab(GRP[i]),x+CELL/2,SY+94,22,CYAN,'center');c.restore();}
}

// ── one step's whole picture (header + step + right labels) ───────────────
function scene(c,k,tau,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const ca=k===5?fade(tau,CONCL,.7):0;
  if(ca<1){c.save();c.globalAlpha*=1-ca;STEPS[k](c,tau,t);c.restore();}
  header(c,k);
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),940,40,22,C.muted,'right');
  closing(c,ca,t);
  c.restore();
}

function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.ph||(s.ph={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;st.seen=new Set();}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;if(!held&&k===0)st.seen=new Set();}
  if(t<st.T)st.T=t;
  st.tau=tau;
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),cross=st.from>=0&&x<1;
  if(cross)scene(c,st.from,st.fromTau+(t-st.T),t,aOut);
  scene(c,k,tau,t,cross?aIn:1);
  const seen=new Set(st.seen);if(!held)for(let i=0;i<k;i++)seen.add(i);
  strip(c,k,seen,k===5&&tau>=CONCL,t);
  if(x>=1||!cross)st.seen.add(k);
}
window.AnimalsDraw.phyla=draw;
})();

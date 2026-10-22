/* Microorganisms · "Amoeba" canvas (protozoa tab, view 1), 2026-10-22.
 * Two AI illustrations (Gemini): amoeba_moving.png (steps 1–2) and amoeba_engulfing.png (steps 3–4); a cross-fade joins them.
 *   step 1  the long pseudopod of amoeba_moving stretches out and draws back: the picture is cut across the arm at its
 *           base (measured), and the part beyond the cut is drawn scaled along the arm axis, so the arm is the
 *           picture's own arm, only longer or shorter. The picture is turned 26° so that the arm points right.
 *   step 2  cytoplasm granules stream into the arm while it reaches out; then the whole cell follows (the picture slides
 *           forward while the arm shortens, so the tip stays put). A dashed ghost marks where the nucleus started.
 *   step 3  amoeba_engulfing: the green food (cut from the picture along its own outline) drifts in through the gap
 *           between the two left pseudopods, arrows run along those pseudopods, then the grey membrane round the food fades in.
 *   step 4  the food vacuole (food + membrane, cut from the picture) moves into the cytoplasm and is digested:
 *           the food shrinks and fades, nutrient dots spread into the cell.
 * Labels only on structures we are sure of: nucleus and contractile vacuole (amoeba_moving), pseudopods, food, food vacuole.
 * The two brown circles and three pale circles of amoeba_engulfing are not labelled (Gemini drew them; see sources.md).
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,text,measure,splitLines,circle,glow,arrow,dashed,line,fade,ease,smooth,mix,clamp,mod,rgba,stageClock,pic,AI,SIZE,TAU,rng}=K;
const N=4,PER=8;

// ── amoeba_moving: turned so the long pseudopod points right ──────────────
const MV='amoeba_moving.png',[MW,MH]=SIZE[MV],MK=.6,MX=430,MY=310;
const AX=[.89825684,-.4394709],AN=[.4394709,.89825684],A0=[928.9,255.0];       // arm axis (fitted to the arm pixels) and its normal
const ROT=Math.atan2(-AX[1],AX[0]);                                             // 26.07°
const S_BASE=-150,S_TIP=150,Q0=-118,Q1=80;                                      // cut across the arm at s=-150; arm lies within q∈[-118,80]
const ap=(s,q)=>[A0[0]+AX[0]*s+AN[0]*q,A0[1]+AX[1]*s+AN[1]*q];
const BASE=ap(S_BASE,0),BAND=[ap(S_BASE,Q0),ap(460,Q0),ap(460,Q1),ap(S_BASE,Q1)];
// the stretched arm starts 4 px before the cut, so the two pieces overlap and no seam shows
const BAND_ARM=[ap(S_BASE-4,Q0),ap(460,Q0),ap(460,Q1),ap(S_BASE-4,Q1)];
const NUC_M=[351.5,356.5,49],CV_M=[549.5,347.5,25];                             // nucleus and contractile vacuole (Hough circles)
const TOPPOD=[352,40];                                                           // tip of the upper pseudopod
// ── amoeba_engulfing ───────────────────────────────────────────────────────
const EN='amoeba_engulfing.png',[EW,EH]=SIZE[EN],EK=.76,EX=340,EY=78;
const FOOD=[[90,283],[88,292],[89,303],[98,323],[106,334],[121,348],[149,366],[175,376],[198,376],[224,371],[236,365],[247,355],[250,357],[252,347],[248,344],[246,337],[233,326],[228,325],[225,321],[221,320],[218,315],[212,310],[207,301],[197,291],[196,288],[192,287],[178,278],[164,273],[147,270],[123,270],[121,272],[105,273],[100,270],[93,277]];
const FOOD_C=[164.8,323.2];
// FOOD dilated by 6 px: hidden from the picture while the food is elsewhere (takes the anti-aliased rim and the thin stalks with it)
const HIDE=[[82,288],[83,306],[93,327],[99,335],[119,354],[150,373],[174,382],[200,382],[228,376],[238,371],[248,362],[253,362],[256,359],[258,345],[253,340],[252,335],[240,324],[227,316],[216,305],[214,300],[199,283],[193,281],[179,272],[165,267],[149,264],[123,264],[113,267],[106,267],[100,264],[97,265],[86,276]];
const ALGA=[[128,275],[122,282],[122,286],[125,293],[145,304],[153,316],[148,320],[144,320],[126,309],[119,308],[113,310],[110,316],[111,332],[115,336],[117,342],[127,354],[131,356],[134,360],[139,361],[144,365],[154,368],[158,371],[174,374],[199,373],[207,369],[211,363],[210,352],[191,335],[191,331],[193,329],[196,332],[205,336],[214,335],[219,329],[219,322],[213,309],[197,291],[184,282],[165,274],[153,271],[141,271]];
const ALGA_C=[172.7,327.3];
const INSIDE=[336,236],IN_SC=.66;                                                // where the food vacuole goes: free cytoplasm between the notch and the pale circle
const ARM_UP=[[262,196],[170,196],[80,214],[30,244]],ARM_LO=[[262,420],[170,412],[90,392],[38,360]];   // along the two left pseudopods, towards their tips
const START=[-300,345];                                                          // food starts here (picture px, left of the picture)

// ── helpers ────────────────────────────────────────────────────────────────
const path=(c,poly)=>{c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();};
const clamp2=(v,a,b)=>Math.max(a,Math.min(b,v));
function label(c,p,x,y,{align='left',col=C.yellow,a=1,to=[],w=300,size=22}={}){
  if(a<=0)return;
  const rows=D.tr(p).split('\n').flatMap(seg=>splitLines(c,seg,w,size)),lh=Math.round(size*1.3);
  const bw=Math.max(...rows.map(r=>measure(c,r,size))),bx=align==='left'?x:align==='right'?x-bw:x-bw/2,by=y-size*.8,bh=(rows.length-1)*lh+size*1.05;
  c.save();c.globalAlpha*=a;
  to.forEach(([tx,ty])=>{const sx=clamp2(tx,bx-6,bx+bw+6),sy=clamp2(ty,by-4,by+bh+4);
    if(Math.hypot(tx-sx,ty-sy)>8){line(c,[[sx,sy],[tx,ty]],rgba(C.ink,.55),4.5);line(c,[[sx,sy],[tx,ty]],rgba(col,.95),2);circle(c,tx,ty,4.5,col,C.ink,1.5);}});
  rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));
  c.restore();
}
// amoeba_moving: picture px -> canvas, with the forward slide T
function mvT(c,T){c.translate(MX+T,MY);c.rotate(ROT);c.scale(MK,MK);c.translate(-MW/2,-MH/2);}
function MM(T,u,v){const ca=Math.cos(ROT),sa=Math.sin(ROT),x=u-MW/2,y=v-MH/2;return[MX+T+MK*(ca*x-sa*y),MY+MK*(sa*x+ca*y)];}
const armStretch=(c,f)=>{const k=f-1;c.translate(BASE[0],BASE[1]);c.transform(1+k*AX[0]*AX[0],k*AX[0]*AX[1],k*AX[0]*AX[1],1+k*AX[1]*AX[1],0,0);c.translate(-BASE[0],-BASE[1]);};
const tipM=f=>ap(S_BASE+(S_TIP-S_BASE)*f,-8);
// The two pieces (body, stretched arm) are put together at full opacity on a scratch canvas first, then drawn with
// the fade alpha, so the 4 px overlap never shows as a lighter seam while the picture fades.
let OC=null;
function moving(c,T,f,a){
  const im=pic(AI+MV);if(!im||a<=0)return;
  if(!OC){OC=document.createElement('canvas');OC.width=960;OC.height=600;}
  const o=OC.getContext('2d');o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,960,600);
  o.save();mvT(o,T);
  o.save();o.beginPath();o.rect(-400,-400,MW+800,MH+800);BAND.forEach((p,i)=>i?o.lineTo(p[0],p[1]):o.moveTo(p[0],p[1]));o.closePath();o.clip('evenodd');o.drawImage(im,0,0,MW,MH);o.restore();
  o.save();armStretch(o,f);path(o,BAND_ARM);o.clip();o.drawImage(im,0,0,MW,MH);o.restore();
  o.restore();
  c.save();c.globalAlpha*=a;c.drawImage(OC,0,0,960,600);c.restore();
}
// cytoplasm granules streaming from the body into the arm (picture px, drawn under the same transform)
const GRAINS=Array.from({length:16},(_,i)=>{const r=rng(70+i);return{ph:i/16,q:(r()-.5)*2,r:7+r()*3};});
function grains(c,T,f,t,a,dir=1){
  if(a<=0)return;
  c.save();c.globalAlpha*=a;mvT(c,T);
  const s0=-430,s1=S_BASE+(S_TIP-S_BASE)*f-36;
  GRAINS.forEach(g=>{const u=mod(g.ph+dir*t*.32),s=mix(s0,s1,u),half=s<S_BASE?60:mix(52,26,clamp((s-S_BASE)/(s1-S_BASE+1)));
    const [x,y]=ap(s,g.q*half-8);c.globalAlpha=a*Math.sin(Math.PI*u)*.95;circle(c,x,y,g.r,'#9c7a4c',rgba('#f2ecd9',.7),1.5);});
  c.restore();
}
// amoeba_engulfing
function inE(c,fn){c.save();c.translate(EX,EY);c.scale(EK,EK);fn();c.restore();}
const ME=(u,v)=>[EX+u*EK,EY+v*EK];
function engulfing(c,a,hideFood){
  const im=pic(AI+EN);if(!im||a<=0)return;
  inE(c,()=>{c.save();c.globalAlpha*=a;
    if(hideFood){c.beginPath();c.rect(-10,-10,EW+20,EH+20);HIDE.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip('evenodd');}
    c.drawImage(im,0,0,EW,EH);c.restore();});
}
// part of the engulfing picture (food or alga outline) drawn moved to (x,y) and scaled about its centre
function cutout(c,poly,ctr,x,y,sc,a,hole=null){
  const im=pic(AI+EN);if(!im||a<=0)return;
  inE(c,()=>{c.save();c.globalAlpha*=a;c.translate(x,y);c.scale(sc,sc);c.translate(-ctr[0],-ctr[1]);
    c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();
    if(hole){hole.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip('evenodd');}else c.clip();
    c.drawImage(im,0,0,EW,EH);c.restore();});
}
function curvedArrow(c,pts,u,col,a){
  if(a<=0||u<=0)return;
  const cp=pts.map(p=>ME(...p)),L=[];let tot=0;for(let i=1;i<cp.length;i++){const l=Math.hypot(cp[i][0]-cp[i-1][0],cp[i][1]-cp[i-1][1]);L.push(l);tot+=l;}
  let d=tot*u;const out=[cp[0]];for(let i=1;i<cp.length;i++){if(d>=L[i-1]){out.push(cp[i]);d-=L[i-1];}else{const f=d/L[i-1];out.push([mix(cp[i-1][0],cp[i][0],f),mix(cp[i-1][1],cp[i][1],f)]);break;}}
  c.save();c.globalAlpha*=a;
  if(out.length>2)line(c,out.slice(0,-1),col,4);
  const p1=out[out.length-1],p0=out[out.length-2];if(Math.hypot(p1[0]-p0[0],p1[1]-p0[1])>2)arrow(c,p0[0],p0[1],p1[0],p1[1],col,4);
  c.restore();
}

// ── per-step motion (shared by the picture layer and the labels) ──────────
// step 1: arm reaches out, holds, draws back slowly (loops, no jumps)
// (a slow small sway keeps the arm alive while it holds)
function arm0(tau){const q=mod(tau,PER),e=smooth(fade(q,.4,2.6))-smooth(fade(q,5.4,2.4));return .72+.40*e+.025*Math.sin(tau*2.1)*e;}
// step 2: arm reaches out, then the body follows with the tip in place; a quick fade starts the next round
function crawl(tau){
  const q=mod(tau,PER),Lc=181*MK/.6;              // arm length in canvas px at f=1
  const reset=q>=7.55;                             // the cell dips out (7.2–7.55 s) and comes back at the start (7.55–7.9 s)
  const out=reset?0:smooth(fade(q,.4,2.4)),follow=reset?0:smooth(fade(q,3.1,2.4));
  const f=.72+.40*out-.40*follow;                  // while following, the arm shortens exactly as much as the body slides: the tip stays put
  const vis=q<7.2?1:reset?smooth(fade(q,7.55,.35)):1-smooth(fade(q,7.2,.35));
  return{f,T:Lc*.40*follow,vis,phase:out<1?'out':follow<1?'follow':'done',q};
}

// ── draw ───────────────────────────────────────────────────────────────────
const SIZE_NOTE=P(`示意，非同比例（真實約 100～500 µm）`,`Schematic, not to scale (real size about 100–500 µm)`);
function camAt(s,k,t){
  if(s.amK===undefined){s.amK=k;s.amFrom=k;s.amT=t-9;}
  if(s.amK!==k){s.amFrom=s.amK;s.amK=k;s.amT=t;}
  if(t<s.amT)s.amT=t;
  return{from:s.amFrom,since:t-s.amT,u:ease((t-s.amT)/.9)};
}
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const cam=camAt(s,k,t),from=cam.from,since=cam.since;
  const aNew=from===k?1:fade(since,.35,.5),aOld=from===k?0:1-fade(since,0,.4);
  const isE=i=>i>=2,wE=mix(isE(from)?1:0,isE(k)?1:0,cam.u);
  glow(c,480,300,420,'#9fd3c8',.07+.02*Math.sin(t*1.3));

  // ---- picture layer: amoeba_moving (steps 1–2), amoeba_engulfing (steps 3–4), cross-faded
  // while the picture fades out after a step change, it keeps the pose it had (stored in s.amMv)
  let mvState;
  if(k===0)mvState={f:arm0(tau),T:0,vis:1};else if(k===1)mvState=crawl(tau);else mvState=s.amMv||{f:.72,T:0,vis:1};
  if(k<2)s.amMv={f:mvState.f,T:mvState.T,vis:mvState.vis};
  if(wE<1)moving(c,mvState.T,mvState.f,(1-wE)*mvState.vis);
  if(k===1&&wE<1)grains(c,mvState.T,mvState.f,t,(1-wE)*mvState.vis*aNew);

  // food state on the engulfing picture
  let foodHidden=false,food=null;
  if(k===2){
    const q=mod(tau,PER),u=ease(fade(q,.5,2.7)),mem=fade(q,3.0,1.0),gone=fade(q,7.3,.6);
    foodHidden=true;
    const [sx,sy]=START,x=mix(sx,ALGA_C[0],u),y=mix(sy,ALGA_C[1],u)+Math.sin(u*Math.PI)*-30;
    engulfing(c,wE,true);
    cutout(c,ALGA,ALGA_C,x,y,1,wE*(1-gone)*fade(q,.2,.4));
    if(mem>0)cutout(c,FOOD,FOOD_C,FOOD_C[0],FOOD_C[1],1,wE*mem*(1-gone),ALGA);
    food={q,u,mem,gone,x,y};
  }else if(k===3){
    const q=mod(tau,PER),mv=smooth(fade(q,.6,2.0)),dig=fade(q,2.8,3.2),gone=fade(q,7.2,.7),back=fade(q,0,.4);
    const x=mix(FOOD_C[0],INSIDE[0],mv),y=mix(FOOD_C[1],INSIDE[1],mv),sc=mix(1,IN_SC,mv)*mix(1,.86,dig);
    engulfing(c,wE,true);
    const al=wE*(1-gone)*(from===2?1:back);
    // the vacuole: the picture's own membrane+food, the food area covered with membrane grey (sampled), then the shrinking food on top
    cutout(c,FOOD,FOOD_C,x,y,sc,al);
    if(dig>0)inE(c,()=>{c.save();c.globalAlpha*=al*Math.min(1,dig*4);c.translate(x,y);c.scale(sc,sc);c.translate(-FOOD_C[0],-FOOD_C[1]);
      path(c,ALGA);c.fillStyle='#aeb1b6';c.fill();c.strokeStyle='#aeb1b6';c.lineWidth=3;c.stroke();c.restore();});
    cutout(c,ALGA,ALGA_C,x+(ALGA_C[0]-FOOD_C[0])*sc,y+(ALGA_C[1]-FOOD_C[1])*sc,sc*mix(1,.5,dig),al*mix(1,.35,dig));
    food={q,mv,dig,gone,x,y,sc,al};
  }else if(wE>0)engulfing(c,wE,false);

  // ---- overlays
  const ov=(i,a,tauI)=>{if(a<=0)return;
    if(i===0)over0(c,t,tauI,a);
    else if(i===1)over1(c,t,tauI,a);
    else if(i===2&&food&&k===2)over2(c,t,food,a);
    else if(i===3&&food&&k===3)over3(c,t,food,a);};
  if(from!==k)ov(from,aOld,PER);
  ov(k,aNew,tau);
  text(c,SIZE_NOTE,20,36,22,C.muted);
}

function over0(c,t,tau,a){
  const f=arm0(tau),q=mod(tau,PER),ext=q>.4&&q<3.0,ret=q>5.4&&q<7.8;
  const [tx,ty]=MM(0,...tipM(f));
  label(c,P(`偽足`,`Pseudopod`),818,300,{col:C.yellow,a,to:[[tx-24,ty+2]]});
  if(ext||ret){const [bx,by]=MM(0,...ap(S_BASE+40,-8));c.save();c.globalAlpha*=a*.95;
    arrow(c,ext?bx:tx-30,by+46,ext?tx-30:bx,by+46,C.yellow,3.5);c.restore();
    label(c,ext?P(`伸出去`,`Reaching out`):P(`縮回來`,`Drawing back`),(bx+tx)/2-15,by+84,{align:'center',col:C.yellow,a});}
  label(c,P(`細胞核`,`Nucleus`),150,118,{align:'center',col:C.white,a,to:[MM(0,NUC_M[0]-20,NUC_M[1]-30)]});
  label(c,P(`伸縮泡`,`Contractile\nvacuole`),510,110,{align:'center',col:C.cyan,a,to:[MM(0,CV_M[0],CV_M[1]-CV_M[2])]});
}
function over1(c,t,tau,a){
  const st=crawl(tau),[tx,ty]=MM(st.T,...tipM(st.f));
  label(c,P(`偽足`,`Pseudopod`),818,300,{col:C.yellow,a:a*st.vis,to:[[tx-24,ty+2]]});
  // flow arrow along the arm axis
  const [b0x,b0y]=MM(st.T,...ap(-360,-8)),[b1x,b1y]=MM(st.T,...ap(S_BASE+(S_TIP-S_BASE)*st.f-60,-8));
  const fa=a*st.vis;
  c.save();c.globalAlpha*=fa;dashed(c,[[b0x,b0y],[b1x-14,b1y]],rgba(C.pink,.95),3,[10,7],-t*30);arrow(c,b1x-22,b1y,b1x,b1y,C.pink,3.5);c.restore();
  label(c,P(`細胞質流向偽足`,`Cytoplasm flows\ninto the pseudopod`),668,470,{col:C.pink,a:fa,to:[[(b0x+b1x)/2+60,b1y+4]]});
  // where the nucleus started, and how far the cell has moved
  const [n0x,n0y]=MM(0,NUC_M[0],NUC_M[1]),[n1x]=MM(st.T,NUC_M[0],NUC_M[1]),r=NUC_M[2]*MK;
  const ga=a*st.vis*clamp(st.T/10);
  if(ga>0){
    // dashed ghost of the nucleus where it started (dark, so it shows on the pale cytoplasm), dashed drops to a ruler below
    c.save();c.globalAlpha*=ga;c.setLineDash([7,5]);circle(c,n0x,n0y,r,null,rgba(C.ink,.85),3);
    c.setLineDash([4,6]);line(c,[[n0x,n0y+r],[n0x,526]],rgba(C.ink,.6),4);line(c,[[n0x,n0y+r],[n0x,526]],rgba(C.white,.9),2);
    line(c,[[n1x,n0y+r],[n1x,526]],rgba(C.ink,.6),4);line(c,[[n1x,n0y+r],[n1x,526]],rgba(C.white,.9),2);c.restore();
    c.save();c.globalAlpha*=ga;line(c,[[n0x,526],[n0x,550]],C.white,3);if(n1x-n0x>14)arrow(c,n0x,538,n1x,538,C.white,3.5);c.restore();
    label(c,P(`原本的位置`,`Where it started`),n0x-12,546,{align:'right',col:C.white,a:ga});
    label(c,P(`整個細胞往前移動`,`The whole cell moves on`),Math.max(n1x,n0x+20)+12,546,{align:'left',col:C.white,a:ga});}
}
function over2(c,t,fd,a){
  const ua=fade(fd.q,1.0,.5)*(1-fd.gone),grow=fade(fd.q,1.0,2.2);
  curvedArrow(c,ARM_UP,grow,C.yellow,a*ua);curvedArrow(c,ARM_LO,grow,C.yellow,a*ua);
  label(c,P(`偽足`,`Pseudopod`),232,172,{align:'right',col:C.yellow,a:a*ua,to:[ME(150,190)]});
  label(c,P(`偽足`,`Pseudopod`),232,470,{align:'right',col:C.yellow,a:a*ua,to:[ME(150,420)]});
  const [fx,fy]=ME(fd.x,fd.y);
  label(c,P(`食物（小生物）`,`Food (a small\norganism)`),fd.u<.5?40:40,fd.u<.5?260:250,{col:C.green,a:a*(1-fd.gone)*fade(fd.q,.3,.4),to:[[fx-18,fy-24]]});
  if(fd.mem>0)label(c,P(`食物泡（形成中）`,`Food vacuole\n(forming)`),232,548,{align:'right',col:C.orange,a:a*fd.mem*(1-fd.gone),to:[ME(140,362)]});
}
const NUTS=Array.from({length:12},(_,i)=>{const r=rng(200+i);return{ang:i/12*TAU+r()*.4,d:40+r()*45,del:r()*1.2};});
function over3(c,t,fd,a){
  const [vx,vy]=ME(fd.x,fd.y);
  label(c,P(`食物泡`,`Food vacuole`),720,66,{align:'center',col:C.orange,a:a*fd.al,to:[[vx,vy-30*fd.sc*EK*1.4]]});
  if(fd.mv>0&&fd.mv<1){c.save();c.globalAlpha*=a*.9;const [ax,ay]=ME(FOOD_C[0]+40,FOOD_C[1]-20);dashed(c,[[ax,ay],[vx-30,vy+12]],rgba(C.orange,.8),2.5,[6,5],-t*14);c.restore();}
  if(fd.dig>0){
    NUTS.forEach(n=>{const u=clamp((fd.dig*3.2-n.del)/2.2);if(u<=0)return;const d=n.d*ease(u)*EK,x=vx+Math.cos(n.ang)*d,y=vy+Math.sin(n.ang)*d*.8;
      c.save();c.globalAlpha*=a*(1-fd.gone)*Math.min(1,u*4)*(1-.5*u);circle(c,x,y,4,C.yellow,C.ink,1.2);c.restore();});
    label(c,P(`養分`,`Nutrients`),762,300,{align:'center',col:C.yellow,a:a*(1-fd.gone)*fade(fd.dig,.15,.2),to:[[vx+36,vy+10]]});
    label(c,P(`消化：食物變成養分，\n留在細胞裡`,`Digestion: food becomes\nnutrients that stay in the cell`),40,540,{col:C.yellow,a:a*(1-fd.gone)*fade(fd.dig,.15,.2),w:380});
  }
}
window.MicroDraw.amoeba=draw;
})();

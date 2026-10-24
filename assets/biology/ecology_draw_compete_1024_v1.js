/* Ecology lesson 3 · "compete" canvas (competition tab, view 0), 2026-10-24. Competition = a shared resource that is not enough.
 * Only who loses what (− / −, relative to having no rival); no food-chain arrow, no eaten/eater roles, no energy (lesson 2).
 * Pictures (K.SIZE, measured with PIL): EC9_beetles_sap 1400x1167, EC3_rice 590x1096, EC23_stags_duel 1400x454.
 * EC9 is cut out (trunk on transparency) with a 1-3 px pale rim; EC3 has the same rim plus opaque near-white pockets between
 * leaves and panicle (min RGB > 215, sat < 30, ~9.5k px). Cleanup (PIL test): EC9 only light low-saturation pixels within 2 px of
 * transparency (~3.6k px, rim only, sap highlights kept); EC3 also treats the near-white pockets as transparency (grains kept).
 * EC9 anchors (picture px): sap top (700,250), sap drip tip (703,1090), rhino head (540,600), rhino elytra (150,600),
 *   stag head (930,640), stag elytra (1200,650). EC3 anchors: stem base (240,975), roots (240,1000), top leaf tips
 *   (220,20) (470,70) (20,190), leaf for the name (100,400), panicle x 300..590 y 220..590.
 * Three steps, 8 s each; s.shown = step. Elements carry the steps they live in; a step change fades only what changes.
 *  0 shared + limited: EC9 large (slow sway), sap drops fall from the drip; "Tree sap" pill with leader; dashed "want" lines
 *    from both beetle heads to the sap; right column: tick "Shared resource", tick "Limited", bracket → "Competition".
 *  1 same species, two examples side by side (a faint divider at x 480; "Same species" pill spans both):
 *    left "Plants": two smaller rice plants (one mirrored) sway close together; light rays from the "Light" pill to both crowns;
 *    water drops from the soil between them to both roots; dashed overlap zone ("Space"); two "Rice" pills; − + "Harmed" each.
 *    right "Animals" (fades in from 3.2 s): EC23 two sika stags, antlers locked, the whole picture leans a few px left/right
 *    (skew about the ground line = a slow shove, no fight marks); one pink heart above the antlers, "Only one mate", dashed
 *    "want" lines from both heads; a "Sika deer" pill with leader for each stag; − + "Harmed" under each. Then RIVAL as one
 *    orange line under both examples, and the legend.
 *  2 different species: back to EC9; "Rhinoceros beetle" / "Stag beetle" pills with leaders; pulsing rings at both heads; "Different
 *    species"; an orange − disc + "Harmed" under each beetle (below the picture); right card: sign legend, RIVAL lines, sign note.
 * EC23 (cut out; PIL test): paper-white pockets between the antlers (x 600..830, y <= 235) are flooded from transparency;
 *   the pale watercolour grass wash (y >= 345, sat < 60) fades out smoothly (alpha x (232-min)/52); elsewhere only the 2 px
 *   light rim. EC23 anchors (picture px): stag backs (330,60) (1070,60), ears (625,165) (810,165), antler crown x 715, top y 18.
 * Labels from K.LAB; new labels defined here as P(): RIVAL, RIVAL1 (same sentence on one line), SIKA, MATE, PLANTS, ANIMALS.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const RIVAL=[P('− 是和沒有對手時比，','− means less to use'),P('能用的資源變少','than with no rival')];   // new label, two lines (not in K.LAB)
const RIVAL1=P('− 是和沒有對手時比，能用的資源變少','− means less to use than with no rival');     // the same sentence on one line (step 1)
const SIKA=P('梅花鹿','Sika deer'),MATE=P('只有一個配偶','Only one mate'),PLANTS=P('植物','Plants'),ANIMALS=P('動物','Animals');
const PINK=C.pink;
const N=3,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,CYAN=C.cyan,ORANGE=C.orange,MUTED=C.muted,SAP='#e0a04a';

// ── layout ────────────────────────────────────────────────────────────────
const EC9='EC9_beetles_sap.png',RICE='EC3_rice.png',STAG='EC23_stags_duel.png';
const PR=K.fitRect(EC9,30,20,600,490);                              // 587.8 x 490 at x 36.1
const ep=(px,py)=>[PR.x+px/1400*PR.w,PR.y+py/1167*PR.h];
const SAP_TOP=ep(700,250),DRIP=ep(703,1090),RH_HEAD=ep(540,600),RH_BODY=ep(150,600),ST_HEAD=ep(930,640),ST_BODY=ep(1200,650);
const RC=795,RX0=650;                                               // right column centre / left edge
// rice (step 1, left half): height 340 from y 110; plant A stem at x 178, plant B (mirrored) stem at x 302 (soil mounds touch)
// picture extent: x 30..582 from the stem at 240, so the pair spans x 113..367; flanks x 10..100 and 380..470 stay free for labels
const RH=340,RW=RH*590/1096,RY=110,RKS=RH/1096;
const RA={x:178-240*RKS,y:RY,w:RW,h:RH},RB={x:302-(590-240)*RKS,y:RY,w:RW,h:RH};
const rp=(r,mir,px,py)=>[r.x+(mir?590-px:px)*RKS,r.y+py*RKS];
const ROOT_A=rp(RA,0,240,1010),ROOT_B=rp(RB,1,240,1010),BASE_A=rp(RA,0,240,975),BASE_B=rp(RB,1,240,975);
const TIPS_A=[[220,20],[470,70],[20,190]].map(q=>rp(RA,0,...q)),TIPS_B=[[220,20],[470,70],[20,190]].map(q=>rp(RB,1,...q));
const ZQ=rp(RA,0,439,411),ZONE={x:ZQ[0],y:ZQ[1],rx:155*RKS,ry:239*RKS};  // where the two crowns overlap (same picture spot as before)
const SOIL=rp(RA,0,439,1017);                                        // soil surface between the plants
const LC=55,RFL=425;                                                 // rice flank centres
// stags (step 1, right half): x 495..955, y 150..299
const DR={x:495,y:150,w:460,h:460*454/1400},dp=(px,py)=>[DR.x+px/1400*DR.w,DR.y+py/454*DR.h];
const BACK_L=dp(330,60),BACK_R=dp(1070,60),EAR_L=dp(625,165),EAR_R=dp(810,165),HEART=[dp(715,0)[0],126];
const DISC_L=dp(330,0)[0],DISC_R=dp(1070,0)[0],DY=356;

// ── picture rim cleanup (once per picture, only 2 px deep; EC3 also clears its near-white pockets) ──
const CLEAN={};
function cleaned(file){
  if(CLEAN[file])return CLEAN[file];const im=K.pic(K.src(file));if(!im)return null;
  try{const W=im.naturalWidth,H=im.naturalHeight,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,n=W*H,dep=new Uint8Array(n).fill(255),q=new Int32Array(n);let h=0,e=0;
    const pockets=file===RICE,stag=file===STAG;
    const light=i=>{const j=i*4,r=a[j],gg=a[j+1],b=a[j+2];return a[j+3]>=20&&(r+gg+b)/3>150&&Math.max(r,gg,b)-Math.min(r,gg,b)<70;};
    const white=i=>{const j=i*4,r=a[j],gg=a[j+1],b=a[j+2];return Math.min(r,gg,b)>215&&Math.max(r,gg,b)-Math.min(r,gg,b)<30;};
    const grass=i=>stag&&i>=345*W,antler=i=>{const x=i%W,y=(i-x)/W;return stag&&x>=600&&x<=830&&y<=235;};
    for(let i=0;i<n;i++)if(a[i*4+3]<20||(pockets&&white(i))){dep[i]=0;q[e++]=i;}
    while(h<e){const i=q[h++],dd=dep[i],x=i%W;
      for(const k of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W]){if(k<0||k>=n||dep[k]!==255)continue;
        if(antler(k)&&white(k)){dep[k]=0;q[e++]=k;}                     // EC23: paper-white pockets between the antlers
        else if(dd<2&&light(k)&&!grass(k)){dep[k]=dd+1;q[e++]=k;}}}
    if(stag)for(let i=345*W;i<n;i++){const j=i*4,r=a[j],gg=a[j+1],b=a[j+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);   // grass wash fades
      if(a[j+3]>=20&&mx-mn<60)a[j+3]=Math.round(a[j+3]*clamp((232-mn)/52));}
    for(let i=0;i<n;i++)if(dep[i]<255)a[i*4+3]=0;
    g.putImageData(d,0,0);CLEAN[file]=cv;}catch(err){CLEAN[file]=im;}
  return CLEAN[file];
}
function picIn(c,file,r,flip=false){
  const cv=cleaned(file);
  if(!cv){K.drawIn(c,file,r,{flip});return;}
  c.save();if(flip){c.translate(r.x*2+r.w,0);c.scale(-1,1);}if(file===STAG)c.imageSmoothingQuality='high';c.drawImage(cv,r.x,r.y,r.w,r.h);c.restore();
}

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dline(c,p0,p1,col,t,w=3,dash=[8,7]){
  c.save();c.lineCap='round';c.setLineDash(dash);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...p0);c.lineTo(...p1);c.strokeStyle=rgba(col,.85);c.lineWidth=w;c.stroke();c.restore();
}
function leader(c,p0,p1,col,t){dline(c,p0,p1,col,t);circle(c,p1[0],p1[1],7,col,C.ink,2);K.pulse(c,p1[0],p1[1],t,col,8);}
function signDisc(c,x,y,r,col,t,pop){
  const rr=r*(.4+.6*ease(pop))*(1+.03*Math.sin(t*2.6)),bw=rr*.95,bt=Math.max(8,rr*.2);
  glow(c,x,y,rr*1.7,col,.25);
  circle(c,x,y,rr,'rgba(11,26,21,.92)',col,5);
  const u=mod(t*.55);circle(c,x,y,rr+4+u*16,null,rgba(col,.7*(1-u)),3);
  c.save();c.fillStyle=col;c.beginPath();c.roundRect(x-bw/2,y-bt/2,bw,bt,bt/2);c.fill();c.restore();
}
function tick(c,x,y,col,u){                                          // a drawn check mark, u = 0..1 drawing progress
  const pts=[[x-11,y],[x-3,y+9],[x+13,y-11]],L1=Math.hypot(8,9),L2=Math.hypot(16,20),d=u*(L1+L2);
  const p=d<=L1?K.lerpP(pts[0],pts[1],d/L1):K.lerpP(pts[1],pts[2],(d-L1)/L2);
  K.sline(c,d<=L1?[pts[0],p]:[pts[0],pts[1],p],col,5);
}
function balanced(c,p,cx,y,maxW,size,col,lh){                         // centred wrap with balanced rows; returns height
  const str=D.tr(p),n=K.splitLines(c,str,maxW,size).length;let lo=40,hi=maxW;
  while(hi-lo>2){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}
  K.wrap(c,p,cx,y+size*.95,hi,size,col,lh,'center');return n*lh;
}
function sapDrops(c,t){                                              // drops gather at the drip tip and fall
  for(let i=0;i<3;i++){const q=mod(t/2.4+i/3),x=DRIP[0],y0=DRIP[1];
    if(q<.45){const r=2+5*q/.45;circle(c,x,y0+r*.6,r,rgba(SAP,.95),rgba(WHITE,.5),1.5);}
    else{const v=(q-.45)/.55,y=y0+6+v*v*34,a=1-smooth(v);c.save();c.globalAlpha*=a;
      c.beginPath();c.ellipse(x,y,4.5,6.5,0,0,Math.PI*2);c.fillStyle=SAP;c.fill();circle(c,x-1.5,y-2,1.6,rgba(WHITE,.8));c.restore();}}
}
function swayPic(c,t,amp){                                           // EC9 with a slow breathing sway about the trunk foot
  const sw=amp*Math.sin(t*1.3),sc=1+.006*Math.sin(t*1.7),fx=PR.x+PR.w/2,fy=PR.y+PR.h;
  c.save();c.translate(fx,fy);c.rotate(sw);c.scale(sc,sc);c.translate(-fx,-fy);picIn(c,EC9,PR);c.restore();
}
function heart(c,x,y,s,fill,stroke){                                 // a heart of half-width s, tip at y+s
  c.save();c.beginPath();c.moveTo(x,y+s);
  c.bezierCurveTo(x-s*1.25,y+s*.15,x-s*1.05,y-s*1.05,x,y-s*.42);c.bezierCurveTo(x+s*1.05,y-s*1.05,x+s*1.25,y+s*.15,x,y+s);c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}c.restore();
}
function stags(c,t){                                                  // a slow shove: the pair leans together, feet stay put
  const sk=.022*Math.sin(t*1.6)+.008*Math.sin(t*3.7),gy=DR.y+DR.h;
  c.save();c.transform(1,0,-sk,1,sk*gy,0);picIn(c,STAG,DR);c.restore();
}
function ricePlant(c,r,mir,base,t,ph){
  const sw=.012*Math.sin(t*1.25+ph);
  c.save();c.translate(...base);c.rotate(sw);c.translate(-base[0],-base[1]);picIn(c,RICE,r,mir);c.restore();
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.compSt||(s.compSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  // A(steps, delay): alpha of an element living in the listed steps; fades in after `delay` when it was not there before
  const A=(steps,d)=>{const inK=steps.includes(k),inF=st.from>=0&&steps.includes(st.from);
    const now=!inK?0:inF?1:ease((tau-d)/.7);
    if(!moving)return now;const was=inF?1:0;return now>=was?now:mix(was,now,u);};

  // ── EC9 (steps 0 and 2) ──
  withA(c,A([0,2],0),()=>{swayPic(c,t,.004);sapDrops(c,t);});

  // ── step 0: shared + limited ──
  withA(c,A([0,2],.4),()=>{
    const p=tag(c,L('sap','樹液','Tree sap'),RC,26,{al:'center',col:YELLOW,minX:RX0});
    leader(c,[p.x,p.y+p.h/2],SAP_TOP,YELLOW,t);
  });
  withA(c,A([0],1.0),()=>{                                           // both beetles want the same spot
    for(const [h,o] of [[RH_HEAD,0],[ST_HEAD,.6]]){dline(c,h,SAP_TOP,WHITE,t+o,2.5,[5,7]);circle(c,h[0],h[1],6,WHITE,C.ink,2);K.pulse(c,h[0],h[1],t+o,WHITE,9);}
  });
  const c1=A([0],1.2),c2=A([0],2.4),cmp=A([0],3.6);
  const RXL=RX0+34;
  withA(c,c1,()=>{
    const p=tag(c,L('sharedResource','共用的資源','Shared resource'),RXL,112,{col:WHITE,minX:RXL});
    tick(c,RX0+12,p.y+p.h/2,YELLOW,k===0&&!moving?clamp((tau-1.5)/.5):1);
  });
  withA(c,c2,()=>{
    const p=tag(c,L('limited','有限','Limited'),RXL,178,{col:WHITE,minX:RXL});
    tick(c,RX0+12,p.y+p.h/2,YELLOW,k===0&&!moving?clamp((tau-2.7)/.5):1);
    // "only a little": the sap patch ring breathes small
    const r=10+3*Math.sin(t*2.2);circle(c,SAP_TOP[0],SAP_TOP[1],r+14,null,rgba(SAP,.8),3);
  });
  withA(c,cmp,()=>{
    K.sline(c,[[RX0+2,128],[RX0-10,128],[RX0-10,194],[RX0+2,194]],rgba(YELLOW,.8),3);
    K.sline(c,[[RX0-10,161],[RX0-10,270],[RX0+28,270]],rgba(YELLOW,.8),3);
    const p=tag(c,L('competition','競爭','Competition'),RXL,250,{col:YELLOW,active:true,size:26,minX:RXL});
    if(k===0)pulseRing(c,p,t,YELLOW);
  });

  // ── step 1: same species, two examples (rice left, sika stags right) ──
  withA(c,A([1],0),()=>{                                              // divider + kingdom headings
    c.save();c.setLineDash([4,10]);K.line(c,[[480,74],[480,452]],rgba(WHITE,.22),2);c.restore();
    text(c,PLANTS,20,90,22,MUTED);text(c,ANIMALS,950,90,22,MUTED,'right');
  });
  withA(c,A([1],0),()=>{ricePlant(c,RB,true,BASE_B,t,1.7);ricePlant(c,RA,false,BASE_A,t,0);});
  withA(c,A([1],.6),()=>{                                            // light: rays from the pill to both crowns
    const lp=tag(c,L('light','光','Light'),240,62,{al:'center',col:YELLOW,minX:110,maxX:370});
    const o=[240,lp.y+lp.h+2];glow(c,o[0],o[1],34,YELLOW,.35+.15*Math.sin(t*3));
    [...TIPS_A,...TIPS_B].forEach((p,i)=>{const a=.45+.4*Math.max(0,Math.sin(t*2.4-i*.9));
      c.save();c.globalAlpha*=a;dline(c,o,p,YELLOW,t*1.4,3,[10,8]);c.restore();circle(c,p[0],p[1],3.5+2*a,rgba(YELLOW,.9));});
  });
  withA(c,A([1],1.2),()=>{                                           // water: drops sink from between the plants to both roots
    const src=SOIL;
    for(let i=0;i<6;i++){const q=mod(t/2.2+i/6),to=i%2?ROOT_B:ROOT_A,mid=[mix(src[0],to[0],.5),src[1]+5];
      const p=K.bez(src,mid,to,smooth(q)),a=q<.15?q/.15:q>.85?(1-q)/.15:1;
      c.save();c.globalAlpha*=a;c.beginPath();c.moveTo(p[0],p[1]-8);c.quadraticCurveTo(p[0]+5,p[1]-1,p[0],p[1]+4);c.quadraticCurveTo(p[0]-5,p[1]-1,p[0],p[1]-8);
      c.fillStyle=CYAN;c.fill();c.restore();}
    for(const r of [ROOT_A,ROOT_B]){const v=mod(t*.6);K.ellipse(c,r[0],r[1]+6,14+11*v,5+4*v,null,rgba(CYAN,.8*(1-v)),2.5);}
    const p=tag(c,L('water','水','Water'),LC,418,{al:'center',col:CYAN,maxX:110});
    dline(c,[p.x+p.w,p.y+p.h/2],[ROOT_A[0]-20,ROOT_A[1]+2],CYAN,t);
  });
  withA(c,A([1],1.8),()=>{                                           // space: dashed overlap zone
    c.save();c.setLineDash([9,7]);c.lineDashOffset=-t*10;K.ellipse(c,ZONE.x,ZONE.y,ZONE.rx+2*Math.sin(t*2),ZONE.ry,'rgba(242,236,217,.06)',rgba(WHITE,.9),3);c.restore();
    const p=tag(c,L('space','空間','Space'),RFL,120,{al:'center',col:WHITE,minX:378,maxX:472});
    dline(c,[p.x,p.y+p.h/2],[ZONE.x+ZONE.rx,ZONE.y-16],WHITE,t);
  });
  withA(c,A([1],.3),()=>{
    const p=tag(c,L('sameSpecies','同種','Same species'),480,10,{al:'center',col:YELLOW,active:true,size:26});
    if(k===1)pulseRing(c,p,t,YELLOW);
  });
  withA(c,A([1],.9),()=>{
    const a=tag(c,L('rice','水稻','Rice'),LC,196,{al:'center',col:WHITE,maxX:110});
    const b=tag(c,L('rice','水稻','Rice'),RFL,228,{al:'center',col:WHITE,minX:378,maxX:472});
    dline(c,[a.x+a.w,a.y+a.h/2],rp(RA,0,100,400),WHITE,t);dline(c,[b.x,b.y+b.h/2],rp(RB,1,100,400),WHITE,t);
  });
  const pop1=k===1&&!moving?clamp((tau-2.6)/.6):1;
  withA(c,A([1],2.6),()=>{
    for(const [x,o] of [[LC,0],[RFL,.4]]){signDisc(c,x,318,30,ORANGE,t+o,pop1);text(c,L('loss','受害','Harmed'),x,382,24,ORANGE,'center');}
  });
  // animals: two sika stags, one mate
  withA(c,A([1],3.2),()=>{stags(c,t);});
  withA(c,A([1],3.8),()=>{
    const a=tag(c,SIKA,500,104,{col:WHITE,minX:492,maxX:700});
    const b=tag(c,SIKA,952,104,{al:'right',col:WHITE,minX:760,maxX:952});
    leader(c,[a.x+a.w*.6,a.y+a.h],BACK_L,WHITE,t);leader(c,[b.x+b.w*.4,b.y+b.h],BACK_R,WHITE,t+.5);
  });
  withA(c,A([1],4.4),()=>{                                           // one mate, both want it
    for(const [e,o] of [[EAR_L,0],[EAR_R,.6]]){dline(c,e,[HEART[0]+(e[0]<HEART[0]?-12:12),HEART[1]+6],WHITE,t+o,2.5,[5,7]);circle(c,e[0],e[1],4,WHITE,C.ink,2);   // small dots: keep the antlers visible
      const v=mod(t*.8+o);circle(c,e[0],e[1],5+v*8,null,rgba(WHITE,.6*(1-v)),2);}
    const b=1+.07*Math.sin(t*2.6);glow(c,HEART[0],HEART[1],34,PINK,.35);
    const u=mod(t*.55);circle(c,HEART[0],HEART[1]+1,22+u*14,null,rgba(PINK,.7*(1-u)),2.5);
    heart(c,HEART[0],HEART[1]+2,15*b,PINK,C.ink);
    tag(c,MATE,HEART[0],60,{al:'center',col:PINK,minX:500,maxX:940});
  });
  const pop3=k===1&&!moving?clamp((tau-5.2)/.6):1;
  withA(c,A([1],5.2),()=>{
    for(const [x,o] of [[DISC_L,.2],[DISC_R,.6]]){signDisc(c,x,DY,28,ORANGE,t+o,pop3);text(c,L('loss','受害','Harmed'),x,DY+60,24,ORANGE,'center');}
  });
  withA(c,A([1],6.0),()=>{text(c,RIVAL1,480,492,22,ORANGE,'center');});
  withA(c,A([1],6.6),()=>{tag(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains  − harmed  0 no evident effect'),CW/2,516,{al:'center',col:WHITE});});

  // ── step 2: two species at the same sap ──
  withA(c,A([2],.6),()=>{
    const p=tag(c,L('diffSpecies','不同種','Different species'),RC,90,{al:'center',col:YELLOW,active:true,size:26,minX:RX0});
    if(k===2)pulseRing(c,p,t,YELLOW);
  });
  withA(c,A([2],1.2),()=>{
    const a=tag(c,L('rhinoBeetle','獨角仙','Rhinoceros beetle'),190,24,{al:'center',col:WHITE,minX:20,maxX:400});
    const b=tag(c,L('stagBeetle','鍬形蟲','Stag beetle'),520,24,{al:'center',col:WHITE,minX:420,maxX:640});
    leader(c,[a.x+a.w*.3,a.y+a.h],RH_BODY,WHITE,t);leader(c,[b.x+b.w*.6,b.y+b.h],ST_BODY,WHITE,t+.5);
    for(const [h,o] of [[RH_HEAD,0],[ST_HEAD,.9]])K.pulse(c,h[0],h[1],t*1.3+o,ORANGE,12);
  });
  const pop2=k===2&&!moving?clamp((tau-2.0)/.6):1;
  withA(c,A([2],2.0),()=>{
    for(const [x,o] of [[90,0],[480,.4]]){signDisc(c,x,550,26,ORANGE,t+o,pop2);text(c,L('loss','受害','Harmed'),x+40,559,24,ORANGE);}
  });
  withA(c,A([2],2.8),()=>{
    const B={x:RX0,y:168,w:CW-12-RX0,h:st.cardH||300};
    D.round(c,B.x,B.y,B.w,B.h,16,'rgba(28,61,52,.95)',rgba(YELLOW,.45+.25*Math.sin(t*2)));
    let y=B.y+16;const cx=B.x+B.w/2,mw=B.w-32;
    y+=balanced(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains  − harmed  0 no evident effect'),cx,y,mw,22,WHITE,31)+12;
    K.line(c,[[B.x+24,y],[B.x+B.w-24,y]],rgba(WHITE,.3),2);y+=14;
    RIVAL.forEach((p,i)=>text(c,p,cx,y+22*.95+i*31,22,ORANGE,'center'));y+=62+12;
    K.line(c,[[B.x+24,y],[B.x+B.w-24,y]],rgba(WHITE,.3),2);y+=14;
    y+=balanced(c,L('signNote','正負號描述利害，不是死亡百分比','Signs describe effects, not death percentages'),cx,y,mw,22,WHITE,31);
    st.cardH=y+14-B.y;                                               // card fits its text (measured on the previous frame)
  });

  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.compete=draw;
})();

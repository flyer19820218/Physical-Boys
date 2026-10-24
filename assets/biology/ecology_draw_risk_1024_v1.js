/* Ecology lesson 3 · "risk" canvas (biocontrol tab, view 1), 2026-10-24. Introducing a natural enemy needs a risk assessment.
 * Stance: biological control guarantees neither eradication nor zero risk; look at the target, the way it acts, nontarget
 * organisms, and keep monitoring. The golden apple snail is an INTRODUCED SPECIES example, NOT biological control.
 * No food-chain arrows, no eat / eaten arrows, no energy (lesson 2). No numbers: the time bar and counts are schematic.
 * Pictures (K.SIZE, measured with PIL): EC4_caterpillar 633x331 (body (300,140), leaf left tip (0,222), right tip (632,161)),
 * EC15_field_snail 655x350 (shell (240,140)), EC15_apple_snail 1037x639 (shell (420,200), foot bottom y 595),
 * EC15_egg_mass 221x744 (pink eggs centre (116,400), stem bottom y 742), EC3_rice 590x1096 (cropped y 0..960 to drop the soil
 * mound; stem base x 236 = 0.40 of the width; leaf at (430,300)).
 * Cleanup (PIL test, once per picture, like biocontrol): (1) near-white (min RGB > 225, max-min < 22) connected to transparency
 * -> transparent; rice also drops enclosed near-white patches of 40 px or more (the white gaps beside the panicle);
 * (2) 2 px into light low-saturation pixels (lum > 150, max-min < 70) next to transparency -> transparent.
 * Three steps, 8 s each; s.shown = step. A step change fades the old step out (0.5 s) and the new one in.
 *  0 other organisms: a small field (program-drawn soil and ditch), EC4 caterpillar on its leaf (tags "Target" + "Caterpillar",
 *    yellow reticle), EC15 field snail in the ditch (tags "Nontarget" + "Native field snail"), a program-drawn generic enemy glyph
 *    ("Introduced natural enemy (schematic)"). Its zone of action (cyan dashed) first covers the target, then spreads (orange
 *    dashed) over the snail and a dashed "Others?" circle. Right: two sign rows (− caterpillar, target: harmed; − field snail,
 *    nontarget: may be affected), then "Assess first: whom will it affect?". No arrows of any kind.
 *  1 introduced species: "Golden apple snail: introduced from South America", "Not a biocontrol example"; a program-drawn
 *    paddy (water band) with three EC3 rice plants, EC15 egg mass on a stem above the water, EC15 apple snail, a small native
 *    field snail. Right: vertical time bar ① new place: no original enemies ② numbers grow too much (small snail copies
 *    appear in the paddy) ③ local environment affected (orange marks on the rice); "Schematic, not a result"; closing sentence.
 *  2 assess first: "Do not introduce or release casually"; checklist (target, how it acts, effects on nontarget organisms, keep
 *    monitoring after, adjust if needed) ticked in turn; a step cycle Assess -> Act -> Monitor -> Adjust (cyan arrows, centre
 *    label "Steps", note "Arrows: order of steps"); "Biocontrol is no cure-all and not free of risk".
 * Labels from K.LAB; new labels defined here as P() (see NEW).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const CAT='EC4_caterpillar.png',FS='EC15_field_snail.png',AS='EC15_apple_snail.png',EGG='EC15_egg_mass.png',RICE='EC3_rice.png';
// new labels and sentences (not in K.LAB)
const NEW={
  introEnemy:P('引進的天敵（示意）','Introduced natural enemy (schematic)'),
  target:P('目標','Target'),nonTarget:P('非目標','Nontarget'),
  targetPest:P('目標害蟲','Target pest'),
  others:P('其他生物？','Others?'),
  spill:P('作用可能超出目標','It may act beyond the target'),
  effects:P('可能的影響','Possible effects'),
  tHarm:P('目標：受害','Target: harmed'),
  ntMay:P('非目標：可能受影響','Nontarget: may be affected'),
  assessQ:P('要先評估：它會影響誰？','Assess first: whom will it affect?'),
  fromSA:P('福壽螺：從南美洲引進的外來種','Golden apple snail: introduced from South America'),
  notBio:P('這個例子不是生物防治','This example is not biocontrol'),
  pestRice:P('在稻田成為害物','A pest in rice paddies'),
  eggMass:P('福壽螺的卵塊','Apple snail eggs'),
  r1:P('① 新地方：\n沒有原來的天敵','① New place:\nno original enemies'),
  r2:P('② 數量增加太多','② Numbers grow too much'),
  r3:P('③ 影響本地環境','③ The local environment is affected'),
  notResult:P('示意，不是結果','Schematic, not a result'),
  lesson1:P('外來生物引進新地方，可能沒有原來的天敵。','An organism brought to a new place may lack its original enemies.'),
  noCasual:P('不隨意引進、野放','Do not introduce or release casually'),
  checkTitle:P('決定之前，先評估','Assess before deciding'),
  c1:P('評估目標','Assess the target'),c2:P('作用方式','How it acts'),c3:P('對非目標生物的影響','Effects on nontarget organisms'),
  c4:P('措施後持續監測','Keep monitoring after the measure'),c5:P('必要時調整','Adjust when needed'),
  cyc:[P('評估','Assess'),P('措施','Act'),P('監測','Monitor'),P('調整','Adjust')],
  stepLbl:P('步驟','Steps'),
  stepNote:P('箭頭：步驟的順序','Arrows: order of the steps'),
  notPanacea:P('生物防治不是萬靈丹，也不是完全沒有風險。','Biocontrol is not a cure-all, and not free of risk.')
};
const N=3,PER=8,CW=960,CH=600;
const WHITE=C.white,YELLOW=C.yellow,CYAN=C.cyan,GREEN=C.green,ORANGE=C.orange,MUTED=C.muted;

// ── picture prep (once per picture) ───────────────────────────────────────
const PREP={[CAT]:{w:300},[FS]:{w:190},[AS]:{w:210},[EGG]:{w:56},[RICE]:{crop:[0,0,590,960],holes:true,w:150}};
const CLEAN={};
function cleaned(f){
  if(CLEAN[f])return CLEAN[f]==='raw'?null:CLEAN[f];const im=K.pic(K.src(f));if(!im)return null;const o=PREP[f]||{};
  try{const W=im.naturalWidth,H=im.naturalHeight,n=W*H,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,dead=new Uint8Array(n),bgw=new Uint8Array(n),light=new Uint8Array(n),q=new Int32Array(n);let h=0,e=0,cnt=0,holes=0;
    for(let i=0;i<n;i++){const j=i*4,r=a[j],gg=a[j+1],b=a[j+2];if(a[j+3]<20){dead[i]=1;q[e++]=i;continue;}
      const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),lum=(r+gg+b)/3;if(mn>225&&mx-mn<22)bgw[i]=1;if(lum>150&&mx-mn<70)light[i]=1;}
    const nb=(i,x)=>[x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W];
    // (1) near-white connected to transparency
    while(h<e){const i=q[h++],x=i%W;for(const k of nb(i,x)){if(k<0||k>=n||dead[k]||!bgw[k])continue;dead[k]=2;q[e++]=k;cnt++;}}
    // rice: enclosed near-white patches of 40 px or more
    if(o.holes){const seen=new Uint8Array(n),comp=new Int32Array(n);
      for(let s0=0;s0<n;s0++){if(!bgw[s0]||dead[s0]||seen[s0])continue;let ch=0,ce=0;comp[ce++]=s0;seen[s0]=1;
        while(ch<ce){const i=comp[ch++],x=i%W;for(const k of nb(i,x)){if(k<0||k>=n||seen[k]||dead[k]||!bgw[k])continue;seen[k]=1;comp[ce++]=k;}}
        if(ce>=40){for(let m=0;m<ce;m++)dead[comp[m]]=2;holes+=ce;}}}
    // (2) 2 px into light pixels next to the removed area
    const dep=new Uint8Array(n).fill(255);h=0;e=0;for(let i=0;i<n;i++)if(dead[i]){dep[i]=0;q[e++]=i;}
    while(h<e){const i=q[h++],dd=dep[i],x=i%W;if(dd>=2)continue;for(const k of nb(i,x)){if(k<0||k>=n||dep[k]!==255||!light[k])continue;dep[k]=dd+1;q[e++]=k;cnt++;}}
    for(let i=0;i<n;i++)if(dep[i]<255)a[i*4+3]=0;
    g.putImageData(d,0,0);
    const cr=o.crop||[0,0,W,H];
    // pre-scale in halving steps to about 2x the drawn width (smooth)
    let s=document.createElement('canvas');s.width=cr[2];s.height=cr[3];s.getContext('2d').drawImage(cv,cr[0],cr[1],cr[2],cr[3],0,0,cr[2],cr[3]);
    const tw=Math.round(Math.min(cr[2],(o.w||cr[2])*2)),th=Math.round(tw*cr[3]/cr[2]);
    while(s.width/2>tw){const hc=document.createElement('canvas');hc.width=Math.round(s.width/2);hc.height=Math.round(s.height/2);const hg=hc.getContext('2d');hg.imageSmoothingQuality='high';hg.drawImage(s,0,0,hc.width,hc.height);s=hc;}
    const oc=document.createElement('canvas');oc.width=tw;oc.height=th;const og=oc.getContext('2d');og.imageSmoothingQuality='high';og.drawImage(s,0,0,tw,th);
    CLEAN[f]=oc;draw.cleanStats=Object.assign(draw.cleanStats||{},{[f]:{rim:cnt,holes}});}catch(err){CLEAN[f]='raw';return null;}
  return CLEAN[f];
}
const csize=f=>{const cr=(PREP[f]||{}).crop;return cr?[cr[2],cr[3]]:K.dim(f);};
// rect of a (cropped) picture centred at (x, y) with width w
function rAt(f,x,y,w){const [W,H]=csize(f),hh=w*H/W;return{x:x-w/2,y:y-hh/2,w,h:hh};}
function picIn(c,f,r){const cv=cleaned(f);if(!cv){const o=PREP[f]||{},dm=K.dim(f);K.drawIn(c,f,r,o.crop?{crop:[o.crop[0]/dm[0],o.crop[1]/dm[1],o.crop[2]/dm[0],o.crop[3]/dm[1]]}:{});return;}c.drawImage(cv,r.x,r.y,r.w,r.h);}
// picture px (uncropped) -> canvas point
function pp(f,r,px,py){const cr=(PREP[f]||{}).crop||[0,0,...K.dim(f)];return[r.x+(px-cr[0])/cr[2]*r.w,r.y+(py-cr[1])/cr[3]*r.h];}

// ── helpers (same style as biocontrol) ────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dline(c,p0,p1,col,t,w=3){c.save();c.lineCap='round';c.setLineDash([8,7]);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...p0);c.lineTo(...p1);c.strokeStyle=rgba(col,.85);c.lineWidth=w;c.stroke();c.restore();}
function leader(c,p0,p1,col,t){dline(c,p0,p1,col,t);circle(c,p1[0],p1[1],6,col,C.ink,2);K.pulse(c,p1[0],p1[1],t,col,7);}
function signDisc(c,x,y,r,t,minus){
  const col=minus?ORANGE:GREEN,rr=r*(1+.04*Math.sin(t*2.6)),bw=rr*.95,bt=Math.max(5,rr*.2);
  glow(c,x,y,rr*1.7,col,.25);circle(c,x,y,rr,'rgba(11,26,21,.92)',col,Math.max(3,rr*.13));
  const u=mod(t*.55);circle(c,x,y,rr+4+u*12,null,rgba(col,.7*(1-u)),2.5);
  c.save();c.fillStyle=col;c.beginPath();c.roundRect(x-bw/2,y-bt/2,bw,bt,bt/2);if(!minus)c.roundRect(x-bt/2,y-bw/2,bt,bw,bt/2);c.fill();c.restore();
}
function lwrap(c,p,x,y,maxW,size,col,lh){
  const str=D.tr(p),n=K.splitLines(c,str,maxW,size).length;let lo=40,hi=maxW;
  while(hi-lo>2){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}
  return K.wrap(c,p,x,y,hi+1,size,col,lh);
}
function cwrap(c,p,x,y,maxW,size,col,lh){
  const str=D.tr(p),n=K.splitLines(c,str,maxW,size).length;let lo=40,hi=maxW;
  while(hi-lo>2){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}
  return K.wrap(c,p,x,y,hi+1,size,col,lh,'center');
}
const nLines=(c,p,w,size)=>K.splitLines(c,D.tr(p),w,size).length;
// wrap with explicit line breaks ('\n' in the string)
const mLines=(c,p,w,size)=>D.tr(p).split('\n').reduce((n,s)=>n+K.splitLines(c,s,w,size).length,0);
function mwrap(c,p,x,y,w,size,col,lh){let h=0;for(const s of D.tr(p).split('\n'))h+=K.wrap(c,s,x,y+h,w,size,col,lh);return h;}
function card(c,x,y,w,h,t,col=C.edge,ph=0,lw=2){D.round(c,x,y,w,h,16,'rgba(28,61,52,.95)',null);
  c.save();c.lineWidth=lw;D.round(c,x,y,w,h,16,null,col===C.edge?C.edge:rgba(col,.55+.25*Math.sin(t*2+ph)));c.restore();}
function tick(c,x,y,s,u,col=GREEN){if(u<=0)return;c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=col;c.lineWidth=5;c.beginPath();
  const a=[x+s*.18,y+s*.52],b=[x+s*.42,y+s*.76],d=[x+s*.84,y+s*.24],u1=clamp(u*2),u2=clamp(u*2-1);
  c.moveTo(...a);c.lineTo(mix(a[0],b[0],u1),mix(a[1],b[1],u1));if(u2>0)c.lineTo(mix(b[0],d[0],u2),mix(b[1],d[1],u2));c.stroke();c.restore();}
function dEllipse(c,x,y,rx,ry,col,t,fillA=0,w=3){c.save();c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,K.TAU);
  if(fillA){c.fillStyle=rgba(col,fillA);c.fill();}c.setLineDash([12,9]);c.lineDashOffset=-t*12;c.strokeStyle=rgba(col,.9);c.lineWidth=w;c.stroke();c.restore();}
// a generic natural-enemy glyph (program-drawn insect outline, schematic: not a particular species)
function enemyGlyph(c,x,y,s,t){
  c.save();c.translate(x,y);c.rotate(.06*Math.sin(t*1.3));const col=CYAN;
  glow(c,0,0,s*1.1,col,.22+.08*Math.sin(t*2.2));
  c.lineCap='round';c.strokeStyle=col;c.lineWidth=3.5;
  const fl=.08*Math.sin(t*9);                                              // legs flicker a little
  for(const sg of [-1,1])for(let i=0;i<3;i++){const bx=-s*.18+i*s*.2,a=(i-1)*.45+fl*sg;c.beginPath();c.moveTo(bx,sg*s*.18);
    c.lineTo(bx+Math.sin(a)*s*.18,sg*s*.42);c.lineTo(bx+Math.sin(a)*s*.32,sg*s*.5);c.stroke();}
  K.ellipse(c,-s*.08,0,s*.42,s*.22,rgba(col,.18),col,3.5);
  circle(c,s*.42,0,s*.13,rgba(col,.18),col,3.5);
  for(const sg of [-1,1]){c.beginPath();c.moveTo(s*.5,sg*s*.06);c.quadraticCurveTo(s*.66,sg*s*.18,s*.74,sg*s*.3);c.stroke();}
  c.restore();
}
// a small snail icon (program-drawn) for the time bar
function snailIcon(c,x,y,s,col,a=1){c.save();c.globalAlpha*=a;K.ellipse(c,x,y+s*.28,s*.62,s*.14,rgba(col,.35),col,2);
  circle(c,x-s*.05,y,s*.34,rgba(col,.25),col,2.5);c.beginPath();c.arc(x-s*.05,y,s*.16,0,K.TAU*.8);c.strokeStyle=col;c.lineWidth=2;c.stroke();c.restore();}

// ── layout ────────────────────────────────────────────────────────────────
// step 0
const S0={soil:[14,400,600,122],ditch:[470,470,140,45]};
const R_CAT=rAt(CAT,200,300,300),R_FS0=rAt(FS,470,450,190);
const GLY=[330,150],GHOST=[560,300];
const Z0={x:192,y:290,rx:175,ry:100},Z1={x:330,y:345,rx:292,ry:162};      // zone of action: target only, then spread
const RX0=640,RW0=CW-14-RX0;
// step 1
const WATER={x:14,y:370,w:580,h:110};
const RICE_X=[100,300,480],RICE_W=[150,140,150],RICE_BASE=402;
const riceR=i=>{const w=RICE_W[i],[W,H]=csize(RICE),h=w*H/W;return{x:RICE_X[i]-.4*w,y:RICE_BASE-h,w,h};};
const R_EGG=(()=>{const [W,H]=K.dim(EGG),w=56,h=w*H/W;return{x:172,y:374-h,w,h};})();
const R_AS=rAt(AS,300,415,210),R_FS1=rAt(FS,530,452,92);
const EXTRA=[[70,452],[140,468],[438,468],[572,402]];
const RX1=610,RW1=CW-14-RX1,BAR1={x:632,y0:150,y1:420};
const CARD1H=112;
// step 2
const LX2=14,LW2=510,CYC={x:748,y:245,r:118};

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.rkSt||(s.rkSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  st.lastT=t;
  const tau=t-st.T,held=s.phase>=0;
  const out=st.from>=0?1-clamp(tau/.5):0;
  const A=d=>ease((tau-.35-d)/.6);
  const ct=held?mod(tau,PER):Math.min(tau,PER-.001);                        // time inside the step (loops when held)
  const layer=(j,fn)=>{if(j===k)fn(A,ct,held);else if(j===st.from&&out>0)withA(c,out,()=>fn(()=>1,PER-.01,false));};
  layer(0,(A,ct,h)=>step0(c,t,A,ct,h));
  layer(1,(A,ct,h)=>step1(c,t,A,ct,h));
  layer(2,(A,ct,h)=>step2(c,t,A,ct,h));
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
  withA(c,k<2?A(0):out*(st.from<2?1:0),()=>text(c,ai,CW-12,590,22,MUTED,'right'));
}

// ── step 0: other organisms ──
function step0(c,t,A,ct,held){
  const ramp=(a,b)=>clamp((ct-a)/(b-a)),wrapOut=held?1-ramp(7.4,7.95):1;
  // field: soil band and a ditch (program-drawn)
  withA(c,A(0),()=>{const [x,y,w,h]=S0.soil;const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#3a3324');g.addColorStop(1,'#2a251b');
    D.round(c,x,y,w,h,18,g,rgba('#6b5d40',.8));
    const R=K.rng(7);for(let i=0;i<60;i++){const px=x+12+R()*(w-24),py=y+10+R()*(h-20);circle(c,px,py,1.5+R()*2.5,rgba('#5c5038',.8));}
    const [dx,dy,rx,ry]=S0.ditch;K.ellipse(c,dx,dy,rx,ry,'#1d4a4f',rgba('#55e9ff',.35),2.5);
    c.save();c.beginPath();c.ellipse(dx,dy,rx-4,ry-4,0,0,K.TAU);c.clip();
    for(let i=0;i<4;i++){const u=mod(t*.12+i/4),yy=dy-ry+10+i*20;K.sline(c,[[dx-rx+20+u*60,yy],[dx-rx+80+u*60,yy]],rgba('#bfe9e6',.35),2.5);
      K.sline(c,[[dx+20-u*50,yy+8],[dx+70-u*50,yy+8]],rgba('#bfe9e6',.3),2.5);}c.restore();
    // a stem holding the caterpillar's leaf
    const tip=pp(CAT,R_CAT,0,222);K.sline(c,[[86,404],[70,372],[tip[0]+6,tip[1]+4]],'#6f9257',8);});
  // pictures
  const sway=2*Math.sin(t*.9),bob=1.2*Math.sin(t*2.1);
  const RC={x:R_CAT.x+sway,y:R_CAT.y+bob,w:R_CAT.w,h:R_CAT.h};
  withA(c,A(.1),()=>picIn(c,CAT,RC));
  const sn=1.5*Math.sin(t*.7),RS={x:R_FS0.x+sn,y:R_FS0.y,w:R_FS0.w,h:R_FS0.h};
  withA(c,A(.2),()=>picIn(c,FS,RS));
  // zone of action
  const g1=ramp(1.2,2.4)*wrapOut,g2=smooth(ramp(3.0,5.0))*wrapOut;
  withA(c,A(.6)*g1*(1-g2*.6),()=>dEllipse(c,Z0.x,Z0.y,Z0.rx*(.6+.4*g1)+3*Math.sin(t*2),Z0.ry*(.6+.4*g1),CYAN,t,.07));
  withA(c,A(.6)*g2,()=>{const z={x:mix(Z0.x,Z1.x,g2),y:mix(Z0.y,Z1.y,g2),rx:mix(Z0.rx,Z1.rx,g2)+3*Math.sin(t*2),ry:mix(Z0.ry,Z1.ry,g2)};dEllipse(c,z.x,z.y,z.rx,z.ry,ORANGE,t,.06);});
  withA(c,A(.6)*clamp(g2*1.5-.5),()=>tag(c,NEW.spill,614,196,{al:'right',col:ORANGE,minX:300,maxX:614}));
  // others? (a dashed empty circle)
  withA(c,A(.4),()=>{const hit=g2>.85;c.save();c.setLineDash([6,6]);c.lineDashOffset=t*8;circle(c,GHOST[0],GHOST[1],26+2*Math.sin(t*1.8),rgba(MUTED,.08),hit?rgba(ORANGE,.9):rgba(MUTED,.8),2.5);c.restore();
    text(c,NEW.others,GHOST[0],GHOST[1]+56,22,hit?ORANGE:MUTED,'center');});
  // target reticle
  const body=pp(CAT,RC,300,140);
  withA(c,A(.4),()=>{const r=46+5*Math.sin(t*3);c.save();c.strokeStyle=rgba(YELLOW,.95);c.lineWidth=3;c.setLineDash([10,7]);c.lineDashOffset=-t*12;
    c.beginPath();c.arc(body[0],body[1],r,0,K.TAU);c.stroke();c.setLineDash([]);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.moveTo(body[0]+Math.cos(a)*(r-10),body[1]+Math.sin(a)*(r-10));c.lineTo(body[0]+Math.cos(a)*(r+12),body[1]+Math.sin(a)*(r+12));c.stroke();}c.restore();});
  // nontarget affected: orange ring and a small − disc at the snail
  const shell=pp(FS,RS,240,140),hitS=clamp((g2-.75)/.25);
  withA(c,A(.6)*hitS,()=>{const v=mod(t*.6);K.ellipse(c,shell[0]+30,shell[1]+10,110+16*v,62+10*v,null,rgba(ORANGE,.7*(1-v)),3);signDisc(c,R_FS0.x-8,R_FS0.y+18,16,t,true);});
  // enemy glyph
  withA(c,A(.3),()=>{enemyGlyph(c,GLY[0]+4*Math.sin(t*.8),GLY[1]+3*Math.sin(t*1.4),74,t);
    tag(c,NEW.introEnemy,GLY[0],70,{al:'center',col:CYAN,minX:14,maxX:614});});
  // tags
  withA(c,A(.8),()=>{const q=tag(c,NEW.target,30,170,{col:YELLOW,active:true});const q2=tag(c,L('caterpillar','毛蟲','Caterpillar'),q.x+q.w+8,170,{col:WHITE});
    pulseRing(c,q,t);dline(c,[q.x+q.w/2,q.y+q.h],[body[0]-30,body[1]-30],YELLOW,t);});
  withA(c,A(1.2),()=>{const fs=L('fieldSnail','本土田螺','Native field snail'),x0=Math.min(330,622-tagW(c,NEW.nonTarget)-8-tagW(c,fs));
    const q=tag(c,NEW.nonTarget,x0,536,{col:WHITE});const q2=tag(c,fs,q.x+q.w+8,536,{col:WHITE,maxX:622});
    leader(c,[q2.x+q2.w*.4,q2.y],[shell[0],shell[1]+10],WHITE,t);});
  // right column: possible effects
  withA(c,A(0),()=>tag(c,L('schematic','示意','Schematic'),CW-14,14,{al:'right',col:MUTED}));
  withA(c,A(.8),()=>{
    const r1=nLines(c,NEW.tHarm,RW0-82,22),r2=nLines(c,NEW.ntMay,RW0-82,22),h1=30+r1*30,h2=30+r2*30,H=70+h1+h2+30;
    card(c,RX0,64,RW0,H,t,ORANGE,0,2.5);text(c,NEW.effects,RX0+20,104,26,WHITE);
    let y=130;
    signDisc(c,RX0+36,y+22,18,t,true);text(c,L('caterpillar','毛蟲','Caterpillar'),RX0+66,y+16,22,WHITE);lwrap(c,NEW.tHarm,RX0+66,y+46,RW0-82,22,ORANGE,30);
    y+=h1+14;
    const on=hitS>.5,a2=Math.max(.35,hitS);
    withA(c,a2,()=>{signDisc(c,RX0+36,y+22,18,t+.5,true);text(c,L('fieldSnail','本土田螺','Native field snail'),RX0+66,y+16,22,WHITE);lwrap(c,NEW.ntMay,RX0+66,y+46,RW0-82,22,ORANGE,30);});
    if(on){const v=mod(t*.8);D.round(c,RX0+8-4*v,y-6-4*v,RW0-16+8*v,h2+8*v,14,null,rgba(ORANGE,.6*(1-v)));}
    draw.s0card=64+H;});
  withA(c,A(4.2),()=>{const y0=(draw.s0card||330)+20,p=NEW.assessQ,lines=nLines(c,p,RW0-36,24),hh=lines*32+30;
    D.round(c,RX0,y0,RW0,hh,20,rgba(YELLOW,.95),WHITE);cwrap(c,p,RX0+RW0/2,y0+40,RW0-36,24,C.deep,32);
    const u=mod(t*.7);D.round(c,RX0-5*u,y0-5*u,RW0+10*u,hh+10*u,22,null,rgba(YELLOW,.8*(1-u)));});
}

// ── step 1: an introduced species ──
function step1(c,t,A,ct,held){
  const ramp=(a,b)=>clamp((ct-a)/(b-a)),wrapOut=held?1-ramp(7.5,7.95):1;
  const stg=ct<8/3?0:ct<16/3?1:2;
  // top tags
  withA(c,A(0),()=>{const q=tag(c,NEW.fromSA,14,14,{col:YELLOW,active:true});pulseRing(c,q,t);
    tag(c,NEW.notBio,14,62,{col:ORANGE,maxX:RX1-10});});
  // paddy: rice behind, water band, then snails and eggs
  const sp=ramp(16/3,6)*wrapOut;                                       // stage ③ strength
  RICE_X.forEach((x,i)=>withA(c,A(.1+i*.1),()=>{const r=riceR(i),a=.035*Math.sin(t*.9+i*1.7)*(1-.5*sp);
    c.save();c.translate(x,RICE_BASE);c.rotate(a);c.translate(-x,-RICE_BASE);picIn(c,RICE,r);c.restore();}));
  withA(c,A(0),()=>{const {x,y,w,h}=WATER;const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(36,92,98,.88)');g.addColorStop(1,'rgba(22,62,64,.95)');
    D.round(c,x,y,w,h,18,g,rgba(CYAN,.35));
    c.save();c.beginPath();c.roundRect(x+3,y+3,w-6,h-6,16);c.clip();
    for(let i=0;i<5;i++){const u=mod(t*.1+i*.23),yy=y+14+i*20;for(let j=0;j<4;j++){const xx=x+((u+j*.25)%1)*w;K.sline(c,[[xx,yy],[xx+44,yy]],rgba('#bfe9e6',.28),2.5);}}c.restore();
    K.sline(c,[[x+10,y+2],[x+w-10,y+2]],rgba('#bfe9e6',.45+.15*Math.sin(t*2)),2.5);});
  // stage ③: orange marks on the rice (local environment affected)
  withA(c,A(.3)*sp,()=>RICE_X.forEach((x,i)=>{const v=mod(t*.6+i*.3);K.ellipse(c,x+6,RICE_BASE-22,34+14*v,16+6*v,null,rgba(ORANGE,.75*(1-v)),3);
    signDisc(c,x-30,RICE_BASE-64,13,t+i*.4,true);}));
  // egg mass on a stem above the water
  withA(c,A(.4),()=>{const b=1+.01*Math.sin(t*1.5),r=R_EGG,cx=r.x+r.w/2,cy=r.y+r.h;c.save();c.translate(cx,cy);c.scale(b,b);c.translate(-cx,-cy);picIn(c,EGG,r);c.restore();});
  // native field snail (small)
  withA(c,A(.6),()=>picIn(c,FS,{x:R_FS1.x+1.2*Math.sin(t*.8),y:R_FS1.y,w:R_FS1.w,h:R_FS1.h}));
  // stage ②: more apple snails appear (schematic)
  const n2=ct<8/3?0:Math.min(EXTRA.length,Math.floor((ct-8/3)/(8/3)*EXTRA.length*1.25)+1);
  EXTRA.forEach(([x,y],i)=>{if(i>=n2)return;const a=clamp((ct-8/3-i*(8/3)/(EXTRA.length*1.25))/.5)*wrapOut;
    withA(c,A(.5)*a,()=>{const r=rAt(AS,x+2*Math.sin(t*.7+i),y,60);c.save();if(i%2){c.translate(r.x*2+r.w,0);c.scale(-1,1);}picIn(c,AS,r);c.restore();});});
  // main apple snail
  const as={x:R_AS.x+3*Math.sin(t*.5),y:R_AS.y+1*Math.sin(t*1.3),w:R_AS.w,h:R_AS.h};
  withA(c,A(.5),()=>picIn(c,AS,as));
  // labels
  withA(c,A(1.0),()=>{const q=tag(c,L('appleSnail','福壽螺','Golden apple snail'),20,492,{col:YELLOW});leader(c,[q.x+q.w*.6,q.y],pp(AS,as,420,200),YELLOW,t);
    tag(c,NEW.pestRice,q.x+q.w+10,492,{col:ORANGE,maxX:RX1-10});});
  withA(c,A(1.4),()=>{const q=tag(c,L('fieldSnail','本土田螺','Native field snail'),RX1-14,540,{al:'right',col:WHITE,minX:14});leader(c,[q.x+q.w-34,q.y],pp(FS,R_FS1,240,140),WHITE,t+.3);});
  withA(c,A(1.8),()=>{const ey=110;const q=tag(c,NEW.eggMass,40,ey,{col:'#f9a8c9'});leader(c,[q.x+q.w*.55,q.y+q.h],pp(EGG,R_EGG,116,300),'#f9a8c9',t+.6);
    const r3=riceR(2),q2=tag(c,L('rice','水稻','Rice'),Math.max(q.x+q.w+16,420),ey,{col:GREEN,maxX:RX1-10});leader(c,[q2.x+q2.w/2,q2.y+q2.h],pp(RICE,r3,430,300),GREEN,t+.9);});
  // right column: vertical time bar
  const top=64;
  withA(c,A(.6),()=>tag(c,NEW.notResult,CW-14,top,{al:'right',col:ORANGE}));
  const labs=[NEW.r1,NEW.r2,NEW.r3];
  const y0=top+50,gap=10,ch=Math.min(CARD1H,(434-y0-2*gap)/3);
  withA(c,A(.8),()=>{
    const ys=[0,1,2].map(i=>y0+i*(ch+gap)),nx=BAR1.x;
    K.sline(c,[[nx,ys[0]+ch/2],[nx,ys[2]+ch/2]],rgba(WHITE,.35),6);
    const py=ys[0]+ch/2+(ch+gap)*Math.min(2,ct/(8/3)*1.15)*wrapOut;                 // reaches each node as its stage beginsK.sline(c,[[nx,ys[0]+ch/2],[nx,py]],rgba(YELLOW,.85),6);
    labs.forEach((p,i)=>{const on=stg===i&&wrapOut>.5,reached=py>=ys[i]+ch/2-2,y=ys[i],cx=nx+24,cw=CW-14-cx;
      card(c,cx,y,cw,ch,t,on?YELLOW:C.edge,i,on?3:2);if(on)glow(c,nx,y+ch/2,30,YELLOW,.35*(.8+.2*Math.sin(t*3)));
      circle(c,nx,y+ch/2,12,reached?YELLOW:'rgba(11,26,21,.95)',reached?WHITE:rgba(WHITE,.6),3);
      const tw=cw-28-52,lines=mLines(c,p,tw,22),ty=y+ch/2-(lines-1)*15+8;
      mwrap(c,p,cx+14,ty,tw,22,on?YELLOW:WHITE,30);
      const ix=CW-14-36,iy=y+ch/2;
      if(i===0){c.save();c.setLineDash([5,5]);c.lineDashOffset=t*6;circle(c,ix,iy,20,null,rgba(MUTED,.9),2.5);c.restore();
        c.save();c.strokeStyle=rgba(ORANGE,.9);c.lineWidth=3.5;c.lineCap='round';c.beginPath();c.moveTo(ix-9,iy-9);c.lineTo(ix+9,iy+9);c.moveTo(ix+9,iy-9);c.lineTo(ix-9,iy+9);c.stroke();c.restore();}
      if(i===1){const m=on?1+Math.floor(mod(t*1.2,3)):3;for(let j=0;j<3;j++)snailIcon(c,ix-14+(j%2)*26,iy-12+Math.floor(j/2)*24-(j===2?0:0),18,'#d9b36a',j<m?1:.25);}
      if(i===2)signDisc(c,ix,iy,17,t+1,true);});
    glow(c,nx,py,16,YELLOW,.6);circle(c,nx,py,7,WHITE);
  });
  withA(c,A(2.6),()=>{const y=440+20;lwrap(c,NEW.lesson1,RX1,y+20,RW1,24,YELLOW,32);});
}

// ── step 2: assess, then decide ──
function step2(c,t,A,ct,held){
  withA(c,A(0),()=>{const q=tag(c,NEW.noCasual,14,14,{col:YELLOW,active:true,size:24});pulseRing(c,q,t);});
  withA(c,A(0),()=>tag(c,L('schematic','示意','Schematic'),CW-14,14,{al:'right',col:MUTED}));
  // checklist
  withA(c,A(.3),()=>{
    const items=[NEW.c1,NEW.c2,NEW.c3,NEW.c4,NEW.c5],hs=items.map(p=>Math.max(76,nLines(c,p,LW2-100,24)*32+42));
    card(c,LX2,74,LW2,66+hs.reduce((u,v)=>u+v,0)+4,t,GREEN,0,2.5);
    text(c,NEW.checkTitle,LX2+20,116,28,WHITE);
    let y=140;
    items.forEach((p,i)=>{const t0=1.0+i*1.1,u=held&&ct>7.4?1-clamp((ct-7.4)/.5):clamp((ct-t0)/.6),on=u>.5;
      D.round(c,LX2+20,y+4,40,40,8,'rgba(11,26,21,.9)',on?GREEN:rgba(WHITE,.6));tick(c,LX2+20,y+4,40,u);
      if(on){const v=mod(t*.6+i*.3);D.round(c,LX2+20-4*v,y-4*v+4,40+8*v,40+8*v,10,null,rgba(GREEN,.6*(1-v)));}
      const hh=lwrap(c,p,LX2+76,y+34,LW2-100,24,on?WHITE:rgba(WHITE,.65),32);y+=Math.max(76,hh+42);});
  });
  // step cycle (order of steps only)
  const NODE=[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>[CYC.x+dx*CYC.r,CYC.y+dy*CYC.r]);
  const act=Math.floor(mod(t/1.5,4));
  withA(c,A(1.0),()=>{
    const {x,y,r}=CYC;
    for(let i=0;i<4;i++){const a0=-Math.PI/2+i*Math.PI/2+.42,a1=a0+Math.PI/2-.84,on=i===act;
      c.save();c.beginPath();c.arc(x,y,r,a0,a1-.06);c.strokeStyle=rgba(CYAN,on?.95:.6);c.lineWidth=on?5:4;c.lineCap='round';c.stroke();c.restore();
      const pA=[x+Math.cos(a1-.14)*r,y+Math.sin(a1-.14)*r],pB=[x+Math.cos(a1)*r,y+Math.sin(a1)*r];K.arrow(c,pA[0],pA[1],pB[0],pB[1],rgba(CYAN,on?.95:.6),on?5:4);
      if(on){const u=mod(t/1.5),aa=mix(a0,a1,u);glow(c,x+Math.cos(aa)*r,y+Math.sin(aa)*r,16,CYAN,.7);circle(c,x+Math.cos(aa)*r,y+Math.sin(aa)*r,6,WHITE);}}
    // centre label
    circle(c,x,y,52+2*Math.sin(t*1.6),'rgba(11,26,21,.85)',rgba(CYAN,.5),2);
    text(c,NEW.stepLbl,x,y+9,26,CYAN,'center');
    NEW.cyc.forEach((p,i)=>{const [nx,ny]=NODE[i],w=tagW(c,p,24),on=i===act;const q=tag(c,p,nx-w/2,ny-21,{col:on?YELLOW:WHITE,active:on,size:24,minX:540,maxX:CW-10});if(on)pulseRing(c,q,t);});
  });
  withA(c,A(1.4),()=>text(c,NEW.stepNote,CYC.x,CYC.y+CYC.r+64,22,MUTED,'center'));
  withA(c,A(3.0),()=>{const x0=544,w=CW-14-x0,p=NEW.notPanacea,lines=nLines(c,p,w-36,24),hh=lines*32+30,y0=550-hh;
    D.round(c,x0,y0,w,hh,20,'rgba(11,26,21,.92)',rgba(ORANGE,.9));cwrap(c,p,x0+w/2,y0+40,w-36,24,ORANGE,32);
    const u=mod(t*.7);D.round(c,x0-5*u,y0-5*u,w+10*u,hh+10*u,22,null,rgba(ORANGE,.7*(1-u)));});
}

window.EcologyDraw.risk=draw;
})();

/* Ecology lesson 3 · "biocontrol" canvas (biocontrol tab, view 0), 2026-10-24. Biological control = using other organisms to
 * reduce a pest's impact, with this lesson's relationships (predation, parasitism). Stance: no guarantee of eradication, no
 * guarantee of zero risk; look at the target, the way it acts, nontarget organisms, and monitor the same way before and after.
 * No food-chain arrow, no energy (lesson 2). No real numbers: the checklist and the counts are schematic.
 * Pictures (K.SIZE, measured with PIL): EC4_caterpillar 633x331 (crop y 0..212, bottom 38 px fade into the program-drawn leaf, and its leaf right of x 505..545 below y 150 faded out;
 * the picture's own leaf and its white hole are cut off), EC19_ladybird_aphids 1400x878, EC22_ducks_paddy 1400x602 (crop
 * x 520..1330, y 0..470: two ducks with rice; pale water darkened, see below), EC20_wasp_caterpillar 1400x651,
 * EC25_wasp_cocoons 1400x543 (cocoons on the caterpillar's back), EC15_field_snail 655x350.
 * Cleanup (PIL test, once per picture, like relations): (1) near-white background (min RGB > 225, max-min < 22) connected to
 * transparency -> transparent; (2) 2 px into light low-saturation pixels (lum > 150, max-min < 70) next to that -> transparent.
 * EC22 only, before cropping: pale grey water (min RGB 100..140 ramp, max-min < 50, B >= R-30, y >= 190, outside the two duck
 * ellipses DUCKS) is re-tinted to a dark teal that keeps its texture (lum*.30+20, lum*.42+26, lum*.40+30).
 * Anchors (picture px): EC4 body (300,140), head (505,105); EC19 ladybird (1124,368), aphids (330,480); EC22 ducks (725,230),
 * (1120,260); EC20 wasp (711,158), ovipositor tip (838,245), caterpillar (1000,330) / card leader (420,330), inside window (640,345); EC25 cocoon
 * cluster (545,135), caterpillar (950,250); snail shell (180,140).
 * Four steps, 8 s each; s.shown = step. A step change fades the old step out (0.5 s) and the new one in.
 *  0 problem: a program-drawn cabbage leaf with half-round bite notches (one grows slowly beside the caterpillar's head),
 *    EC4 caterpillar crawling on it; tags Caterpillar, Cabbage leaf, Feeding damage (orange); right: "Damage?" checklist,
 *    three items ticked in turn (caterpillars seen, notches in the leaves, enough to hurt the harvest), "Schematic" tag;
 *    "Confirm the damage, then consider control".
 *  1 choose: "Biocontrol: other organisms reduce a pest's impact"; three cards: ladybird + aphids (Predation, eats aphids),
 *    ducks (Predation, eats insects in the paddy), parasitic wasp + caterpillar (Parasitism, lays eggs in the caterpillar);
 *    at 3.5 s the wasp card is chosen (yellow, "Chosen here"), the others fade; "Natural enemy: wasp · Target pest: caterpillar".
 *  2 target: EC20 large with a time bar ① find ② eggs ③ larvae ④ cocoons (2 s each, loops when held): a reticle
 *    sweeps over the snail (grey, nontarget) and locks on the caterpillar; eggs enter a dashed "inside" window; larvae wiggle;
 *    crossfade to EC25 cocoons. Right: "Target: caterpillar" (leader to the reticle), "How it acts: parasitism" card,
 *    + wasp gains / − caterpillar harmed, "The pest's impact may drop", "No guarantee that every pest is gone".
 *    Snail: "Nontarget: not this insect", "The wasp does not lay eggs in it". Sign legend.
 *  3 monitor: "Monitoring: survey the same way" + "Schematic, not a result"; two panels Before / After, the same cabbage row,
 *    the same-size yellow dashed quadrat at the same place, caterpillar icons inside (5 / 2) counted by a scanning ring in
 *    sync, tally icons below (no digits); "Same-size frame" tag with leaders to both quadrats; closing sentence.
 * Labels from K.LAB; new labels defined here as P() (see NEW).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const CAT='EC4_caterpillar.png',LADY='EC19_ladybird_aphids.png',DUCK='EC22_ducks_paddy.png',WASP='EC20_wasp_caterpillar.png',
  COC='EC25_wasp_cocoons.png',SNAIL='EC15_field_snail.png';
Object.entries({[LADY]:[1400,878],[DUCK]:[1400,602],[WASP]:[1400,651],[COC]:[1400,543]}).forEach(([f,s])=>{if(!K.SIZE[f])K.SIZE[f]=s;});
// new labels and sentences (not in K.LAB)
const NEW={
  dmgQ:P('損失？','Damage?'),
  chk1:P('看得到毛蟲','Caterpillars are seen'),
  chk2:P('葉子有缺口','Leaves have notches'),
  chk3:P('數量多到影響收成','Enough to hurt the harvest'),
  confirm:P('確認有損失，再考慮防治','Confirm the damage, then consider control'),
  bcDef:P('生物防治：利用其他生物減少害蟲的影響',"Biocontrol: other organisms reduce a pest's impact"),
  ladybird:P('瓢蟲','Ladybird'),aphid:P('蚜蟲','Aphids'),duck:P('鴨','Ducks'),
  eatAphid:P('吃蚜蟲','Eats aphids'),eatPaddy:P('在稻田裡吃蟲','Eats insects in the paddy'),layEgg:P('在毛蟲體內產卵','Lays eggs in the caterpillar'),
  chosen:P('本動畫選這個','Chosen here'),
  pairLine:P('天敵：寄生蜂　目標害蟲：毛蟲','Natural enemy: wasp · Target pest: caterpillar'),
  target:P('目標：毛蟲','Target: caterpillar'),
  howActs:P('作用方式：寄生','How it acts: parasitism'),
  larvaFeed:P('幼蟲在體內取食','Larvae feed inside it'),
  mayDrop:P('害蟲的影響「可能」降低',"The pest's impact may drop"),
  noGuar:P('不保證消滅所有害蟲','No guarantee that every pest is gone'),
  nonTarget:P('非目標：不是這種蟲','Nontarget: not this insect'),
  snailNo:P('寄生蜂不在牠身上產卵','The wasp lays no eggs in it'),
  snail:P('蝸牛','Snail'),
  inside:P('虛線：毛蟲體內（示意）','Dashed: inside it (schematic)'),
  s1:P('① 找到目標','① Find'),s2:P('② 產卵','② Eggs'),s3:P('③ 幼蟲取食','③ Larvae'),s4:P('④ 結繭','④ Cocoons'),
  notResult:P('示意，不是結果','Schematic, not a result'),
  sameFrame:P('同樣大小的框','Same-size frame'),
  evidence:P('有天敵只是措施存在；有沒有成效，要用證據。','Having an enemy only shows a measure exists; whether it works needs evidence.')
};
const N=4,PER=8,CW=960,CH=600;
const WHITE=C.white,YELLOW=C.yellow,CYAN=C.cyan,GREEN=C.green,ORANGE=C.orange,MUTED=C.muted;
const LEAF='#93b278',LEAF_D='#6f9257',VEIN='#c6d9a8';

// ── picture prep (once per picture) ───────────────────────────────────────
const DUCKS=[[725,195,140,80],[1120,235,190,80]];                 // protected duck ellipses (cx, cy, rx, ry), picture px
const PREP={
  [CAT]:{crop:[0,0,633,212],fade:[0,38],cutR:[505,545,150],w:400},
  [LADY]:{w:290},[DUCK]:{crop:[520,0,810,470],fade:[0,40],w:290,water:true},
  [WASP]:{w:570},[COC]:{w:570},[SNAIL]:{w:180}
};
const CLEAN={};
function cleaned(f){
  if(CLEAN[f])return CLEAN[f]==='raw'?null:CLEAN[f];const im=K.pic(K.src(f));if(!im)return null;const o=PREP[f]||{};
  try{const W=im.naturalWidth,H=im.naturalHeight,n=W*H,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,dep=new Uint8Array(n).fill(255),q=new Int32Array(n);let h=0,e=0,cnt=0,tint=0;
    const bgw=new Uint8Array(n),light=new Uint8Array(n);
    for(let i=0;i<n;i++){const j=i*4,r=a[j],gg=a[j+1],b=a[j+2];if(a[j+3]<20){dep[i]=0;q[e++]=i;continue;}
      const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),lum=(r+gg+b)/3;
      if(o.water){const x=i%W,y=(i-x)/W;
        if(y>=190&&mx-mn<50&&b>=r-30&&mn>100&&!DUCKS.some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1)){
          const w=clamp((mn-100)/40);a[j]=r*(1-w)+(lum*.30+20)*w;a[j+1]=gg*(1-w)+(lum*.42+26)*w;a[j+2]=b*(1-w)+(lum*.40+30)*w;tint++;continue;}}
      if(mn>225&&mx-mn<22)bgw[i]=1;if(lum>150&&mx-mn<70)light[i]=1;}
    while(h<e){const i=q[h++],dd=dep[i],x=i%W;
      for(const k of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W]){if(k<0||k>=n||dep[k]!==255)continue;
        if(bgw[k]){dep[k]=0;q[e++]=k;cnt++;}else if(dd<2&&light[k]){dep[k]=dd+1;q[e++]=k;cnt++;}}}
    for(let i=0;i<n;i++)if(dep[i]<255)a[i*4+3]=0;
    g.putImageData(d,0,0);
    const cr=o.crop||[0,0,W,H],fc=document.createElement('canvas');fc.width=cr[2];fc.height=cr[3];const fg=fc.getContext('2d');fg.drawImage(cv,cr[0],cr[1],cr[2],cr[3],0,0,cr[2],cr[3]);
    if(o.fade){fg.save();fg.globalCompositeOperation='destination-out';const [ft,fb]=o.fade,Hc=cr[3];
      if(ft){const gr=fg.createLinearGradient(0,0,0,ft);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');fg.fillStyle=gr;fg.fillRect(0,0,cr[2],ft);}
      if(fb){const gr=fg.createLinearGradient(0,Hc-fb,0,Hc);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');fg.fillStyle=gr;fg.fillRect(0,Hc-fb,cr[2],fb);}
      fg.restore();}
    if(o.cutR){const [x0,x1,y0]=o.cutR;fg.save();fg.globalCompositeOperation='destination-out';const gr=fg.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');fg.fillStyle=gr;fg.fillRect(x0,y0,cr[2]-x0,cr[3]-y0);fg.restore();}
    // pre-scale in halving steps to about 2x the drawn width (smooth)
    let s=fc;const tw=Math.round(Math.min(cr[2],(o.w||cr[2])*2)),th=Math.round(tw*cr[3]/cr[2]);
    while(s.width/2>tw){const hc=document.createElement('canvas');hc.width=Math.round(s.width/2);hc.height=Math.round(s.height/2);const hg=hc.getContext('2d');hg.imageSmoothingQuality='high';hg.drawImage(s,0,0,hc.width,hc.height);s=hc;}
    const oc=document.createElement('canvas');oc.width=tw;oc.height=th;const og=oc.getContext('2d');og.imageSmoothingQuality='high';og.drawImage(s,0,0,tw,th);
    oc.cw=cr[2];oc.ch=cr[3];CLEAN[f]=oc;draw.cleanStats=Object.assign(draw.cleanStats||{},{[f]:{rim:cnt,tint}});}catch(err){CLEAN[f]='raw';return null;}
  return CLEAN[f];
}
// picture rect for a (cropped) picture fitted into a box
const csize=f=>{const o=PREP[f]||{},cr=o.crop;return cr?[cr[2],cr[3]]:K.dim(f);};
function fitC(f,bx,by,bw,bh){const [W,H]=csize(f),k=Math.min(bw/W,bh/H),w=W*k,h=H*k;return{x:bx+(bw-w)/2,y:by+(bh-h)/2,w,h};}
function picIn(c,f,r){const cv=cleaned(f);if(!cv){const o=PREP[f]||{};K.drawIn(c,f,r,o.crop?{crop:[o.crop[0]/K.dim(f)[0],o.crop[1]/K.dim(f)[1],o.crop[2]/K.dim(f)[0],o.crop[3]/K.dim(f)[1]]}:{});return;}c.drawImage(cv,r.x,r.y,r.w,r.h);}
// picture px (in the uncropped picture) -> canvas point
function pp(f,r,px,py){const o=PREP[f]||{},cr=o.crop||[0,0,...K.dim(f)];return[r.x+(px-cr[0])/cr[2]*r.w,r.y+(py-cr[1])/cr[3]*r.h];}

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
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
function cwrap(c,p,x,y,maxW,size,col,lh){                            // centred wrap with balanced rows
  const str=D.tr(p),n=K.splitLines(c,str,maxW,size).length;let lo=40,hi=maxW;
  while(hi-lo>2){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}
  return K.wrap(c,p,x,y,hi+1,size,col,lh,'center');
}
function card(c,x,y,w,h,t,col=C.edge,ph=0,lw=2){D.round(c,x,y,w,h,16,'rgba(28,61,52,.95)',null);
  c.save();c.lineWidth=lw;D.round(c,x,y,w,h,16,null,col===C.edge?C.edge:rgba(col,.55+.25*Math.sin(t*2+ph)));c.restore();}
function tick(c,x,y,s,u,col=GREEN){if(u<=0)return;c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=col;c.lineWidth=5;c.beginPath();
  const a=[x+s*.18,y+s*.52],b=[x+s*.42,y+s*.76],d=[x+s*.84,y+s*.24],u1=clamp(u*2),u2=clamp(u*2-1);
  c.moveTo(...a);c.lineTo(mix(a[0],b[0],u1),mix(a[1],b[1],u1));if(u2>0)c.lineTo(mix(b[0],d[0],u2),mix(b[1],d[1],u2));c.stroke();c.restore();}
// a small caterpillar icon (program-drawn, schematic)
function catIcon(c,x,y,s,t,ph=0,a=1){
  c.save();c.globalAlpha*=a;c.translate(x,y);c.rotate(.12*Math.sin(t*1.7+ph));
  for(let i=0;i<5;i++){const f=i/4,xx=-s*.5+f*s,yy=Math.sin(t*3+ph+f*3)*s*.05,r=s*.15*(i===4?1.12:1);circle(c,xx,yy,r,i===4?'#5f9a3e':'#7fbf55',rgba('#21401c',.95),1.6);}
  circle(c,s*.5+s*.04,-s*.03,s*.035,C.ink);c.restore();
}
// cabbage leaf (program-drawn) with bite notches; bites: [angle(rad), radius]
function leafPath(c,cx,cy,rx,ry,rot){c.beginPath();const n=40;
  for(let i=0;i<=n;i++){const a=i/n*K.TAU,wv=1+.035*Math.sin(a*9)+.02*Math.sin(a*14+1),x=Math.cos(a)*rx*wv,y=Math.sin(a)*ry*wv*(1-.18*Math.cos(a));
    const X=cx+x*Math.cos(rot)-y*Math.sin(rot),Y=cy+x*Math.sin(rot)+y*Math.cos(rot);i?c.lineTo(X,Y):c.moveTo(X,Y);}c.closePath();}
function edgePt(cx,cy,rx,ry,rot,a){const wv=1+.035*Math.sin(a*9)+.02*Math.sin(a*14+1),x=Math.cos(a)*rx*wv,y=Math.sin(a)*ry*wv*(1-.18*Math.cos(a));
  return[cx+x*Math.cos(rot)-y*Math.sin(rot),cy+x*Math.sin(rot)+y*Math.cos(rot)];}
function cabbage(c,L0,bites,holes){
  const {cx,cy,rx,ry,rot}=L0;c.save();c.beginPath();c.rect(0,0,CW,CH);
  for(const [a,r] of bites){const p=edgePt(cx,cy,rx,ry,rot,a);c.moveTo(p[0]+r,p[1]);c.arc(p[0],p[1],r,0,K.TAU);}
  for(const [x,y,r] of holes){c.moveTo(x+r,y);c.arc(x,y,r,0,K.TAU);}
  c.clip('evenodd');
  leafPath(c,cx,cy,rx,ry,rot);const g=c.createRadialGradient(cx-rx*.2,cy-ry*.3,10,cx,cy,rx*1.1);g.addColorStop(0,'#a6c58a');g.addColorStop(1,LEAF);c.fillStyle=g;c.fill();
  c.strokeStyle=LEAF_D;c.lineWidth=3;c.stroke();
  // midrib and veins
  const m0=edgePt(cx,cy,rx,ry,rot,Math.PI),m1=edgePt(cx,cy,rx,ry,rot,0);
  c.lineCap='round';c.strokeStyle=VEIN;c.lineWidth=7;c.beginPath();c.moveTo(...m0);c.lineTo(...m1);c.stroke();
  c.lineWidth=3;for(let i=1;i<6;i++){const f=i/6,b=K.lerpP(m0,m1,f);for(const sg of [-1,1]){const e=edgePt(cx,cy,rx,ry,rot,Math.PI-sg*(Math.PI*(1-f))*.9-sg*.15);
    c.beginPath();c.moveTo(...b);c.quadraticCurveTo((b[0]+e[0])/2+18,(b[1]+e[1])/2,mix(b[0],e[0],.85),mix(b[1],e[1],.85));c.stroke();}}
  c.restore();
  // bite rims (slightly darker, like eaten edges)
  for(const [a,r] of bites){const p=edgePt(cx,cy,rx,ry,rot,a);c.save();leafPath(c,cx,cy,rx,ry,rot);c.clip();c.beginPath();c.arc(p[0],p[1],r+2,0,K.TAU);c.strokeStyle='#7a8f4e';c.lineWidth=3;c.stroke();c.restore();}
  for(const [x,y,r] of holes){c.beginPath();c.arc(x,y,r+2,0,K.TAU);c.strokeStyle='#7a8f4e';c.lineWidth=3;c.stroke();}
}

// ── layout ────────────────────────────────────────────────────────────────
// step 0
const LF={cx:290,cy:318,rx:262,ry:205,rot:-.08};
const R_CAT=fitC(CAT,92,170,400,150);                                     // 400x142 at y 174
const RX0=600;
// step 1 cards
const CARD_X=[14,328,642],CARD_W=304,CARD_Y=74,CARD_H=392;
const PICBOX=i=>[CARD_X[i]+10,CARD_Y+14,CARD_W-20,170];
const R_L1=fitC(LADY,...PICBOX(0)),R_D1=fitC(DUCK,...PICBOX(1)),R_W1=fitC(WASP,...PICBOX(2));
// step 2
const R_W2=fitC(WASP,14,14,570,270),R_C2=fitC(COC,14,14,570,270),R_S2=fitC(SNAIL,24,322,170,92);
const RX2=604,RW2=CW-12-RX2;
const BAR={x0:40,x1:584,y:466,nx:[80,230,380,524]};
// step 3
const PAN=[{x:24,y:72,w:444,h:364},{x:492,y:72,w:444,h:364}];
const QD=200,QX=f=>f.x+f.w/2-QD/2,QY=f=>f.y+80;                         // same-size quadrat, same place in each panel
const ICONS=[[.25,.26],[.70,.22],[.48,.52],[.22,.78],[.76,.74]],AFTER=[1,3];  // positions in the quadrat; after keeps two

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.bcSt||(s.bcSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  st.lastT=t;
  const tau=t-st.T,held=s.phase>=0;
  const out=st.from>=0?1-clamp(tau/.5):0;
  const A=d=>ease((tau-.35-d)/.6);                                         // fade-in for an element of the current step
  const layer=(j,fn)=>{if(j===k)fn(A,tau);else if(j===st.from&&out>0)withA(c,out,()=>fn(()=>1,PER-.01));};
  const ct=held?mod(tau,PER):Math.min(tau,PER-.001);                        // time inside the step (loops when held)
  layer(0,(A,tl)=>step0(c,t,A,held?mod(tl,PER):Math.min(tl,PER),held));
  layer(1,(A,tl)=>step1(c,t,A,tl));
  layer(2,(A,tl)=>step2(c,t,A,k===2?ct:PER-.01,held));
  layer(3,(A,tl)=>step3(c,t,A,tl));
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
  withA(c,k<3?A(0):out*(st.from<3?1:0),()=>text(c,ai,CW-12,590,22,MUTED,'right'));
}

// ── step 0: is there a problem? ──
function step0(c,t,A,ct,held){
  const grow=.5+.5*smooth(mod(t/8));                                      // the bite next to the head grows slowly
  const bites=[[-.22,26*grow+8],[.55,26],[1.05,20],[2.35,30],[2.9,22],[-2.5,24],[-1.75,18]];
  const holes=[[150,360,16],[230,420,12],[390,410,14]];
  withA(c,A(0),()=>cabbage(c,LF,bites,holes));
  const crawl=6*Math.sin(t*.9),bob=1.5*Math.sin(t*2.2);
  const R={x:R_CAT.x+crawl,y:R_CAT.y+bob,w:R_CAT.w,h:R_CAT.h};
  withA(c,A(.2),()=>picIn(c,CAT,R));
  // tags
  const body=pp(CAT,R,300,130),nb=edgePt(LF.cx,LF.cy,LF.rx,LF.ry,LF.rot,-.22),h2=holes[2];
  withA(c,A(.8),()=>{const q=tag(c,L('caterpillar','毛蟲','Caterpillar'),40,64,{col:WHITE});leader(c,[q.x+q.w/2,q.y+q.h],body,WHITE,t);});
  withA(c,A(1.4),()=>{const q=tag(c,L('damage','被啃食的痕跡','Feeding damage'),330,540,{col:ORANGE,maxX:RX0-14});
    leader(c,[q.x+q.w*.8,q.y],[nb[0]-8,nb[1]+10],ORANGE,t+.4);leader(c,[q.x+q.w*.35,q.y],[h2[0],h2[1]+h2[2]],ORANGE,t+.8);
    const v=mod(t*.6);circle(c,nb[0],nb[1],28+18*v,null,rgba(ORANGE,.6*(1-v)),2.5);});
  withA(c,A(2.0),()=>{const q=tag(c,L('cabbage','菜葉','Cabbage leaf'),40,540,{col:GREEN});leader(c,[q.x+q.w*.6,q.y],[150,478],GREEN,t+.2);});
  // checklist
  withA(c,A(.6),()=>{
    card(c,RX0,64,CW-12-RX0,330,t,YELLOW,0,2.5);
    text(c,NEW.dmgQ,RX0+20,108,30,YELLOW);tag(c,L('schematic','示意','Schematic'),CW-28,80,{al:'right',col:MUTED});
    const items=[NEW.chk1,NEW.chk2,NEW.chk3];let y=136;
    items.forEach((p,i)=>{const t0=1.4+i*1.3,u=held&&ct>7.4?1-clamp((ct-7.4)/.5):clamp((ct-t0)/.6),on=u>.5;
      D.round(c,RX0+20,y+4,40,40,8,'rgba(11,26,21,.9)',on?GREEN:rgba(WHITE,.6));tick(c,RX0+20,y+4,40,u);
      if(on){const v=mod(t*.6+i*.3);D.round(c,RX0+20-4*v,y-4*v+4,40+8*v,40+8*v,10,null,rgba(GREEN,.6*(1-v)));}
      const hh=lwrap(c,p,RX0+76,y+34,CW-12-RX0-96,24,on?WHITE:rgba(WHITE,.65),32);y+=Math.max(70,hh+38);});
  });
  withA(c,A(4.8),()=>{const p=NEW.confirm,sz=22,w=measure(c,p,sz)+28,fits=w<=CW-12-RX0;
    if(fits){const q=tag(c,p,RX0,412,{col:YELLOW,active:true,minX:RX0});pulseRing(c,q,t);}
    else{D.round(c,RX0,410,CW-12-RX0,82,20,rgba(YELLOW,.95),WHITE);K.wrap(c,p,RX0+(CW-12-RX0)/2,440,CW-12-RX0-30,22,C.deep,30,'center');
      const u=mod(t*.7);D.round(c,RX0-5*u,410-5*u,CW-12-RX0+10*u,82+10*u,22,null,rgba(YELLOW,.8*(1-u)));}});
}

// ── step 1: choose a natural enemy ──
function step1(c,t,A,tl){
  const pick=clamp((tl-3.5)/.8),sel=smooth(pick);
  withA(c,A(0),()=>{const q=tag(c,NEW.bcDef,CW/2,14,{al:'center',col:YELLOW,active:true,size:22});pulseRing(c,q,t);});
  const cards=[
    {f:LADY,R:R_L1,tags:[[NEW.aphid,330,480],[NEW.ladybird,1124,368]],rel:L('predation','掠食','Predation'),act:NEW.eatAphid},
    {f:DUCK,R:R_D1,tags:[[NEW.duck,725,230]],rel:L('predation','掠食','Predation'),act:NEW.eatPaddy},
    {f:WASP,R:R_W1,tags:[[L('wasp','寄生蜂','Parasitic wasp'),711,158],[L('caterpillar','毛蟲','Caterpillar'),420,330]],rel:L('parasitism','寄生','Parasitism'),act:NEW.layEgg}];
  cards.forEach((cd,i)=>withA(c,A(.3+i*.5)*(i===2?1:mix(1,.32,sel)),()=>{
    const X=CARD_X[i],chosen=i===2&&sel>0;
    card(c,X,CARD_Y,CARD_W,CARD_H,t,chosen?YELLOW:C.edge,i,chosen?2+2*sel:2);
    if(chosen)glow(c,X+CARD_W/2,CARD_Y+CARD_H/2,200,YELLOW,.12*sel);
    const br=1+.008*Math.sin(t*1.4+i),R=cd.R,cx=R.x+R.w/2,cy=R.y+R.h/2;
    c.save();c.translate(cx,cy);c.scale(br,br);c.translate(-cx,-cy);picIn(c,cd.f,R);c.restore();
    let y=CARD_Y+186;
    cd.tags.forEach(([p,px,py],j)=>{const q=tag(c,p,X+14,y,{col:WHITE,minX:X+14,maxX:X+CARD_W-14});leader(c,[q.x+q.w,q.y+q.h/2],pp(cd.f,R,px,py),WHITE,t+j*.5+i);y+=46;});
    y=CARD_Y+186+92;
    const r=tag(c,cd.rel,X+14,y,{col:CYAN,active:true,minX:X+14});
    lwrap(c,cd.act,X+14,y+r.h+28,CARD_W-28,22,WHITE,30);
  }));
  withA(c,A(0)*sel,()=>{const q=tag(c,NEW.chosen,CARD_X[2]+CARD_W-10,CARD_Y-20,{al:'right',col:YELLOW,active:true});pulseRing(c,q,t+.3);});
  withA(c,A(.6)*sel,()=>{const q=tag(c,NEW.pairLine,CW/2,484,{al:'center',col:YELLOW,size:24});pulseRing(c,q,t+.6);});
}

// ── step 2: it acts on the target ──
function step2(c,t,A,ct,held){
  const ramp=(v,a,b)=>clamp((v-a)/(b-a));
  const wrapIn=held?ramp(ct,7.5,8):0;
  const s1=Math.max(1-ramp(ct,1.8,2.1),wrapIn),s2=Math.min(ramp(ct,1.8,2.1),1-ramp(ct,3.8,4.1)),s3=Math.min(ramp(ct,3.8,4.1),1-ramp(ct,5.8,6.2)),s4=Math.min(ramp(ct,5.8,6.2),1-wrapIn);
  const bob=1.2*Math.sin(t*1.3);
  withA(c,A(0)*(1-s4),()=>picIn(c,WASP,{x:R_W2.x,y:R_W2.y+bob,w:R_W2.w,h:R_W2.h}));
  withA(c,A(0)*s4,()=>{const br=1+.006*Math.sin(t*1.6),R=R_C2,cx=R.x+R.w/2,cy=R.y+R.h/2;c.save();c.translate(cx,cy);c.scale(br,br);c.translate(-cx,-cy);picIn(c,COC,R);c.restore();});
  // snail (nontarget)
  const sn=1.5*Math.sin(t*.8);
  withA(c,A(.3),()=>{picIn(c,SNAIL,{x:R_S2.x+sn,y:R_S2.y,w:R_S2.w,h:R_S2.h});
    tag(c,NEW.nonTarget,212,326,{col:WHITE,maxX:RX2-10});lwrap(c,NEW.snailNo,212,404,RX2-230,22,MUTED,30);});
  // reticle: sweeps over the snail, then locks on the caterpillar
  const catP=s4>0?pp(COC,R_C2,950,250):pp(WASP,R_W2,1000,330),snP=pp(SNAIL,R_S2,250,150);
  const sw=ramp(ct,.2,1.0),lk=ramp(ct,1.0,1.7);
  let ret,col;if(s1>0&&ct<1.7&&!wrapIn){ret=lk>0?K.lerpP(snP,catP,smooth(lk)):snP;col=lk>.5?YELLOW:MUTED;}else{ret=catP;col=YELLOW;}
  withA(c,A(.2),()=>{const r=42+6*Math.sin(t*3);c.save();c.strokeStyle=rgba(col,.95);c.lineWidth=3;c.setLineDash([10,7]);c.lineDashOffset=-t*12;
    c.beginPath();c.arc(ret[0],ret[1],r,0,K.TAU);c.stroke();c.setLineDash([]);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.moveTo(ret[0]+Math.cos(a)*(r-10),ret[1]+Math.sin(a)*(r-10));c.lineTo(ret[0]+Math.cos(a)*(r+12),ret[1]+Math.sin(a)*(r+12));c.stroke();}c.restore();
    if(col===MUTED&&sw>0){c.save();c.strokeStyle=rgba(MUTED,.9);c.lineWidth=4;c.lineCap='round';const d=14;c.beginPath();c.moveTo(snP[0]-d,snP[1]-d);c.lineTo(snP[0]+d,snP[1]+d);c.moveTo(snP[0]+d,snP[1]-d);c.lineTo(snP[0]-d,snP[1]+d);c.stroke();c.restore();}});
  // wasp tag
  withA(c,A(.5)*(1-s4),()=>{const q=tag(c,L('wasp','寄生蜂','Parasitic wasp'),24,40,{col:GREEN});leader(c,[q.x+q.w,q.y+q.h/2],pp(WASP,R_W2,690,150),GREEN,t);});
  withA(c,A(.5)*s4,()=>{const q=tag(c,L('cocoons','蜂繭','Wasp cocoons'),24,40,{col:WHITE});leader(c,[q.x+q.w,q.y+q.h/2],pp(COC,R_C2,470,110),WHITE,t);});
  // inside window, eggs, larvae (schematic)
  const win=pp(WASP,R_W2,640,345),wr=[100*R_W2.w/570,32*R_W2.h/265];
  const io=Math.max(s2,s3);
  withA(c,A(.2)*io,()=>{c.save();c.beginPath();c.ellipse(win[0],win[1],wr[0],wr[1],0,0,K.TAU);c.fillStyle=rgba('#0b1a15',.45);c.fill();
    c.setLineDash([9,7]);c.lineDashOffset=-t*10;c.strokeStyle=rgba(WHITE,.85);c.lineWidth=3;c.stroke();c.restore();
    text(c,NEW.inside,14,312,22,MUTED);});
  const EGG=[[-.6,.1],[-.2,-.2],[.2,.2],[.6,-.1]],tip=pp(WASP,R_W2,838,245);
  withA(c,A(.2)*s2,()=>{const v=mod(t*.8);circle(c,tip[0],tip[1],8+14*v,null,rgba(YELLOW,.8*(1-v)),2.5);glow(c,tip[0],tip[1],14,YELLOW,.5);
    EGG.forEach((e,i)=>{const t0=2.1+i*.4,q=clamp((ct-t0)/.6);if(ct<t0)return;const dst=[win[0]+e[0]*wr[0],win[1]+e[1]*wr[1]],p=K.bez(tip,[(tip[0]+dst[0])/2+10,tip[1]-6],dst,smooth(q));
      c.save();c.translate(p[0],p[1]);c.rotate(.5);K.ellipse(c,0,0,7,4.5,'#f6eccd',rgba('#8a7650',.9),1.4);c.restore();});});
  withA(c,A(.2)*s3,()=>{const g=.5+.5*ramp(ct,4,5.8);EGG.forEach((e,i)=>{c.save();c.translate(win[0]+e[0]*wr[0],win[1]+e[1]*wr[1]);c.rotate((i%2?.3:-.25)+.2*Math.sin(t*3+i));
    const len=30*g;for(let j=0;j<5;j++){const f=j/4;circle(c,-len/2+f*len,Math.sin(t*4+f*3+i)*2,len*.17*(1-.3*Math.abs(f-.4)),'#f4e7c3',rgba('#8a7650',.9),1.3);}c.restore();});});
  // time bar
  withA(c,A(.4),()=>{const {x0,x1,y,nx}=BAR;K.sline(c,[[x0,y],[x1,y]],rgba(WHITE,.35),6);
    const cx=mix(x0,x1,clamp(ct/PER));K.sline(c,[[x0,y],[cx,y]],rgba(YELLOW,.85),6);
    const act=[s1,s2,s3,s4],lab=[NEW.s1,NEW.s2,NEW.s3,NEW.s4];
    nx.forEach((x,i)=>{const on=act[i]>.5,reached=cx>=x-2||on;if(act[i]>0)glow(c,x,y,28,YELLOW,.35*act[i]*(.8+.2*Math.sin(t*3)));
      circle(c,x,y,12,reached?YELLOW:'rgba(11,26,21,.95)',reached?WHITE:rgba(WHITE,.6),3);
      tag(c,lab[i],x,y+22,{al:'center',col:on?YELLOW:WHITE,active:on,minX:8,maxX:RX2-6});});
    glow(c,cx,y,16,YELLOW,.6);circle(c,cx,y,7,WHITE);});
  // right column
  const locked=col===YELLOW;
  withA(c,A(.6),()=>{const q=tag(c,NEW.target,RX2,14,{col:YELLOW,active:true,minX:RX2});pulseRing(c,q,t);if(locked)dline(c,[q.x,q.y+q.h/2],[ret[0]+44,ret[1]-20],YELLOW,t);});
  withA(c,A(1.0),()=>{card(c,RX2,70,RW2,182,t,CYAN,0,2.5);text(c,NEW.howActs,RX2+18,110,26,CYAN);
    let y=150;for(const p of [NEW.layEgg,NEW.larvaFeed])y+=lwrap(c,p,RX2+18,y,RW2-36,22,WHITE,30)+6;});
  const row=(y,minus,name,eff,ph,hl)=>{signDisc(c,RX2+22,y,18,t+ph,minus);text(c,name,RX2+52,y+8,22,WHITE);
    text(c,eff,CW-14,y+8,22,minus?ORANGE:GREEN,'right');if(hl>0){const v=mod(t*.8);D.round(c,RX2-4*v,y-26-4*v,RW2+8*v,52+8*v,18,null,rgba(ORANGE,.6*(1-v)*hl));}};
  withA(c,A(1.6),()=>{row(290,false,L('wasp','寄生蜂','Parasitic wasp'),L('gain','得益','Gains'),0,0);row(346,true,L('caterpillar','毛蟲','Caterpillar'),L('loss','受害','Harmed'),.5,s4);});
  withA(c,A(2.4),()=>lwrap(c,NEW.mayDrop,RX2,412,RW2,24,YELLOW,32));
  withA(c,A(3.2),()=>lwrap(c,NEW.noGuar,RX2,486,RW2,22,ORANGE,30));
  withA(c,A(3.0),()=>tag(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains · − harmed · 0 no evident effect'),14,540,{col:WHITE,maxX:RX2-6}));
}

// ── step 3: check before and after ──
function step3(c,t,A,tl){
  const head=[`${L('monitor','監測','Monitoring')[0]}：${L('sameMethod','用同樣的方法調查','Survey the same way')[0]}`,`${L('monitor','監測','Monitoring')[1]}: ${L('sameMethod','用同樣的方法調查','Survey the same way')[1].toLowerCase()}`];
  withA(c,A(0),()=>{const q=tag(c,head,14,14,{col:YELLOW,active:true});pulseRing(c,q,t);});
  withA(c,A(.4),()=>tag(c,NEW.notResult,CW-14,14,{al:'right',col:ORANGE}));
  PAN.forEach((f,pi)=>withA(c,A(.6+pi*.5),()=>{
    card(c,f.x,f.y,f.w,f.h,t,C.edge);
    tag(c,pi?L('after','措施後','After'):L('before','措施前','Before'),f.x+f.w/2,f.y+14,{al:'center',col:WHITE,minX:f.x+8,maxX:f.x+f.w-8});
    // the same cabbage row behind
    for(let j=0;j<3;j++){const x=f.x+f.w*(.2+.3*j),y=f.y+180;for(let r=0;r<6;r++){const a=r/6*K.TAU+j;K.ellipse(c,x+Math.cos(a)*30,y+Math.sin(a)*22,34,22,rgba('#7fae62',.55),rgba(LEAF_D,.6),2,a);}circle(c,x,y,20,rgba('#a9cf8c',.7));}
    // quadrat
    const qx=QX(f),qy=QY(f);c.save();c.setLineDash([10,7]);c.lineDashOffset=-t*8;c.strokeStyle=rgba(YELLOW,.9+.1*Math.sin(t*2));c.lineWidth=3.5;c.strokeRect(qx,qy,QD,QD);c.restore();
    const list=pi?AFTER.map(i=>ICONS[i]):ICONS;const ncnt=list.length;
    const nCounted=Math.min(ncnt,Math.floor(clamp((tl-1.6)/4.4)*6));            // icons counted so far (both panels counted the same way)
    list.forEach(([u,v],i)=>{const x=qx+u*QD,y=qy+v*QD;catIcon(c,x,y,46,t,i+pi);
      if(i<nCounted){circle(c,x,y,30,null,rgba(YELLOW,.8),2.5);}});
    if(nCounted<ncnt&&tl>1.6){const [u,v]=list[nCounted];const x=qx+u*QD,y=qy+v*QD,w=mod(t*1.4);circle(c,x,y,26+10*w,null,rgba(YELLOW,.9*(1-w)),3);}
    // tally (icons only, no digits)
    const ty=f.y+f.h-48;text(c,L('caterpillar','毛蟲','Caterpillar'),f.x+20,ty+8,22,WHITE);
    const tx0=f.x+20+measure(c,L('caterpillar','毛蟲','Caterpillar'),22)+30;
    for(let i=0;i<ncnt;i++){const on=i<nCounted;catIcon(c,tx0+i*54,ty,40,t,i,on?1:.25);}
  }));
  withA(c,A(1.8),()=>{const q=tag(c,NEW.sameFrame,CW/2,448,{al:'center',col:YELLOW});
    const gx=(PAN[0].x+PAN[0].w+PAN[1].x)/2,gy=QY(PAN[0])+QD;dline(c,[gx,q.y],[gx,gy],YELLOW,t);   // up the gap between panels
    for(const f of PAN){const qx=QX(f),cx=f===PAN[0]?qx+QD:qx;dline(c,[gx,gy],[cx,gy],YELLOW,t);circle(c,cx,gy,6,YELLOW,C.ink,2);K.pulse(c,cx,gy,t,YELLOW,7);}});
  withA(c,A(3.0),()=>cwrap(c,NEW.evidence,CW/2,CH-56,CW-60,24,YELLOW,32));
}

window.EcologyDraw.biocontrol=draw;
})();

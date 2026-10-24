/* Ecology lesson 3 · "parasite" canvas (symbiosis tab, view 2), 2026-10-24. Parasitism = the parasite gains, the host is
 * harmed (+ / −). Same signs as predation; the difference is the process (a parasite depends on a living host over time,
 * a predator eats its prey). No food-chain arrow, no eaten/eater arrow, no energy (lesson 2). The wasp larvae do end up
 * killing the caterpillar; this is said plainly, without gore.
 * Pictures (K.SIZE, measured with PIL): EC12_dodder 1125x1204, EC20_wasp_caterpillar 1400x651, EC12_wasp_cocoons 1018x522.
 * The caterpillar in EC20 is labelled only "Caterpillar" (it looks like a noctuid larva, not a cabbage-white larva).
 * Cleanup (PIL test, once per picture): (1) near-white background left on the cut-out (min RGB > 225, max-min < 22) that is
 * connected to transparency -> transparent (dodder 27.3k px, EC20 1.6k, cocoons 1.2k); (2) 2 px into light low-saturation
 * pixels (lum > 150, max-min < 70) next to that -> transparent (pale rim); (3) enclosed background pockets (min RGB > T,
 * max-min < 28, >= 30 px, plus 2 px of light rim): dodder T 165 outside the six flower clusters (also removes a grey-white
 * blob inside a loop at (690,820)); EC20 T 200 only in the box (640,140)-(770,230) (white gap between the wasp legs and the
 * caterpillar back). Dodder: top 40 px and bottom 40 px fade out (the host stem is cut flat there).
 * Dodder anchors (picture px): strand (990,190), coil around the host stem (560,876), host leaf (950,800), host stem (545,750).
 *   Nutrient paths: traced with PIL along the orange strands (shortest path through the orange mask, centre-weighted),
 *   each starting on the green host stem and ending at a dodder flower cluster (DFLOW).
 * EC20 anchors: ovipositor tip (838,245), wasp abdomen (790,165), caterpillar flank (1000,300), "inside" window centre (640,345).
 * Cocoons anchors: cocoon cluster (580,320), caterpillar (800,120).
 * Three steps, 8 s each; s.shown = step. Elements carry the steps they live in; a step change fades only what changes.
 *  0 dodder: dodder large (left); white nutrient dots run from the host stem along the dodder stems to its flowers; right
 *    column: Dodder card (+, "Gets", nutrients from the host), "Nutrients" pill, "Thin stems twine around the host" pill,
 *    Host plant card (−, "Harmed", nutrients taken away), "Parasitism: + / −" tag.
 *  1 wasp: three sub-stages inside the step (loop when held), shown on a time bar ① eggs laid ② larvae feed ③ cocoons:
 *    a EC20, eggs slide from the ovipositor tip into a dashed "inside" window; b small cream larvae grow and wiggle in the
 *    window (schematic); c crossfade to EC12 cocoons, "Wasp cocoons" pill. Right cards: Parasitic wasp (+, its larvae get
 *    food from the caterpillar), Caterpillar (−, fed on by the larvae, usually dies in the end).
 *  2 + / −: dodder and cocoons small on the left with + / − rows; right: "Parasitism and predation: both + / −", two time
 *    strips (parasite and host lines run side by side for a long time, nutrient dots hop across; predator and prey lines
 *    meet and the prey line ends), a "Time" axis, "Signs first, then the process"; note that wasp larvae kill the host;
 *    sign legend.
 * Labels from K.LAB; new labels defined here as P() (see NEW).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const DOD='EC12_dodder.png',WASP='EC20_wasp_caterpillar.png',COC='EC12_wasp_cocoons.png';
if(!K.SIZE[WASP])K.SIZE[WASP]=[1400,651];
// new labels (not in K.LAB)
const NEW={
  gets:P('得到','Gets'),
  dodGain:P('寄主的養分','Nutrients from the host'),
  nutrients:P('養分','Nutrients'),
  twine:P('細莖纏住寄主','Thin stems twine around the host'),
  hostPlant:P('寄主植物','Host plant'),
  hostLoss:P('養分被取走','Its nutrients are taken'),
  waspGain:P('幼蟲從毛蟲得到食物','Its larvae get food from the caterpillar'),
  catLoss1:P('被幼蟲取食','Fed on by the larvae'),
  catLoss2:P('最後常會死亡','Usually dies in the end'),
  eggs:P('卵','Eggs'),
  larvae:P('幼蟲','Larvae'),
  inside:P('虛線框內：示意毛蟲體內','Dashed outline: inside the caterpillar (schematic)'),
  st1:P('① 產卵','① Eggs laid'),st2:P('② 幼蟲取食','② Larvae feed'),st3:P('③ 結繭','③ Cocoons'),
  both:P('寄生和掠食：都是 ＋／−','Parasitism and predation: both + / −'),
  paLong:P('寄生者長時間依賴寄主','A parasite depends on its host over time'),
  paNot:P('寄主不一定立刻死亡','The host does not always die at once'),
  prEat:P('掠食者吃掉獵物','A predator eats its prey'),
  waspKill:P('寄生蜂的幼蟲最後會使毛蟲死亡','Wasp larvae end up killing the caterpillar'),
  signsFirst:P('先看符號，再看過程','Signs first, then the process')
};
const N=3,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,CYAN=C.cyan,GREEN=C.green,ORANGE=C.orange,MUTED=C.muted;

// ── layout ────────────────────────────────────────────────────────────────
const R_D0=K.fitRect(DOD,14,12,500,576),R_D2=K.fitRect(DOD,14,14,220,236);        // 500x535.1 at y 32.5 / 220x235.5
const R_W1=K.fitRect(WASP,14,14,580,380);                                           // 580x269.7 at y 69.2
const R_C1=K.fitRect(COC,14,14,580,380),R_C2=K.fitRect(COC,14,262,220,140);          // 580x297.4 at y 55.3 / 220x112.8
const dp=(R,px,py)=>[R.x+px/1125*R.w,R.y+py/1204*R.h];
const wp=(px,py)=>[R_W1.x+px/1400*R_W1.w,R_W1.y+py/651*R_W1.h];
const cp=(R,px,py)=>[R.x+px/1018*R.w,R.y+py/522*R.h];
const D_STRAND=[990,190],D_COIL=[560,876],D_LEAF=[950,800],D_STEM=[545,750];
const FLOWERS=[[350,345],[800,315],[585,540],[850,605],[265,660],[350,800]];
// nutrient paths (picture px): host stem -> along dodder stems -> flower cluster (PIL shortest path in the orange mask)
const DFLOW=[
  [[440,300],[428,296],[431,279],[441,262],[448,245],[451,228],[454,211],[442,198],[425,207],[408,218],[391,232],[375,249],[365,266],[358,283],[353,300],[350,321]],
  [[468,452],[485,461],[497,454],[499,439],[499,424],[514,422],[529,423],[544,425],[559,429],[574,435],[589,442],[604,451],[619,464],[633,478],[625,493],[611,514]],
  [[505,606],[510,600],[485,626],[455,618],[425,600],[406,570],[395,540],[391,510],[373,480],[343,472],[313,480],[284,502],[261,532],[249,562],[245,592],[246,622]],
  [[566,905],[570,900],[571,882],[552,883],[541,869],[545,850],[530,831],[513,821],[494,819],[475,814],[456,812],[437,805],[418,797],[399,788],[380,780],[362,796]],
  [[462,392],[476,401],[495,422],[520,422],[545,425],[570,433],[595,445],[620,465],[645,485],[670,471],[691,446],[705,421],[716,396],[733,371],[757,348],[782,337],[790,330]]
];
const W_TIP=[838,245],W_WASP=[790,165],W_CAT=[1000,300],W_WIN=[640,345],W_WR=[250,78];
const C_COC=[580,320],C_CAT=[800,120];
const RX0=530,RX1=610;                                                              // right columns (steps 0 / 1)

// ── picture cleanup (once per picture) ────────────────────────────────────
const CLEAN={};
const OPT={
  [DOD]:{T:165,keep:FLOWERS,kr:75,fade:40},
  [WASP]:{T:200,box:[640,140,770,230]},
  [COC]:{}
};
function cleaned(file){
  if(CLEAN[file])return CLEAN[file];const im=K.pic(K.src(file));if(!im)return null;
  try{const W=im.naturalWidth,H=im.naturalHeight,n=W*H,o=OPT[file]||{};
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data;
    const bg=new Uint8Array(n),light=new Uint8Array(n),pk=new Uint8Array(n),rm=new Uint8Array(n),q=new Int32Array(n);
    let keep=null;
    if(o.keep){keep=new Uint8Array(n);const r2=o.kr*o.kr;for(const [fx,fy] of o.keep)for(let y=Math.max(0,fy-o.kr);y<Math.min(H,fy+o.kr);y++)for(let x=Math.max(0,fx-o.kr);x<Math.min(W,fx+o.kr);x++)if((x-fx)**2+(y-fy)**2<r2)keep[y*W+x]=1;}
    for(let i=0;i<n;i++){const j=i*4,r=a[j],gg=a[j+1],b=a[j+2],al=a[j+3];if(al<20)continue;
      const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),lum=(r+gg+b)/3;
      if(mn>225&&mx-mn<22)bg[i]=1;
      if(lum>150&&mx-mn<70)light[i]=1;
      if(o.T&&mn>o.T&&mx-mn<28){const x=i%W,y=(i-x)/W;
        if(o.box?(x>=o.box[0]&&x<o.box[2]&&y>=o.box[1]&&y<o.box[3]):!(keep&&keep[i]))pk[i]=1;}}
    // 4-neighbours of pixel i into out (returns count); no closures in the hot loops
    const NB=new Int32Array(4);
    const nbs=i=>{let m=0;const x=i%W;if(x>0)NB[m++]=i-1;if(x<W-1)NB[m++]=i+1;if(i>=W)NB[m++]=i-W;if(i<n-W)NB[m++]=i+W;return m;};
    // (1) background connected to transparency
    let h=0,e=0;
    for(let i=0;i<n;i++)if(a[i*4+3]<20)q[e++]=i;
    const tr=e;
    while(h<e){const i=q[h++],m=nbs(i);for(let z=0;z<m;z++){const k=NB[z];if(bg[k]&&!rm[k]){rm[k]=1;q[e++]=k;}}}
    const flood=e-tr;
    // (2) 2 px of pale rim from transparency or removed background
    let fr=Array.from(q.subarray(0,e));
    for(let it=0;it<2;it++){const nx=[];for(const i of fr){const m=nbs(i);for(let z=0;z<m;z++){const k=NB[z];if(!rm[k]&&light[k]&&a[k*4+3]>=20){rm[k]=1;nx.push(k);}}}fr=nx;}
    // (3) enclosed pockets >= 30 px, then 2 px of light rim around them
    let pc=0;
    if(o.T){const seen=new Uint8Array(n),cq=new Int32Array(n);let grow=[];
      for(let s0=0;s0<n;s0++){if(!pk[s0]||rm[s0]||seen[s0])continue;let ch=0,ce=0;cq[ce++]=s0;seen[s0]=1;
        while(ch<ce){const i=cq[ch++],m=nbs(i);for(let z=0;z<m;z++){const k=NB[z];if(pk[k]&&!rm[k]&&!seen[k]){seen[k]=1;cq[ce++]=k;}}}
        if(ce>=30)for(let z=0;z<ce;z++){grow.push(cq[z]);pc++;}}
      for(const i of grow)rm[i]=1;
      for(let it=0;it<2;it++){const nx=[];for(const i of grow){const m=nbs(i);for(let z=0;z<m;z++){const k=NB[z];if(!rm[k]&&light[k]&&!(keep&&keep[k])){rm[k]=1;nx.push(k);pc++;}}}grow=nx;}}
    let cnt=0;for(let i=0;i<n;i++)if(rm[i]){a[i*4+3]=0;cnt++;}
    g.putImageData(d,0,0);
    if(o.fade){g.save();g.globalCompositeOperation='destination-out';
      let gr=g.createLinearGradient(0,0,0,o.fade);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,o.fade);
      gr=g.createLinearGradient(0,H-o.fade,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');g.fillStyle=gr;g.fillRect(0,H-o.fade,W,o.fade);g.restore();}
    CLEAN[file]=cv;draw.cleanStats=Object.assign(draw.cleanStats||{},{[file]:{flood,pockets:pc,total:cnt}});
  }catch(err){CLEAN[file]=im;}
  return CLEAN[file];
}
function picIn(c,file,r){const cv=cleaned(file);if(!cv){K.drawIn(c,file,r);return;}c.drawImage(cv,r.x,r.y,r.w,r.h);}

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
function leader(c,p0,p1,col,t){dline(c,p0,p1,col,t);circle(c,p1[0],p1[1],6,col,C.ink,2);K.pulse(c,p1[0],p1[1],t,col,7);}
function signDisc(c,x,y,r,t,pop,minus,ring=1){                       // green "+" or orange "−" disc, glyph drawn as bars
  const col=minus?ORANGE:GREEN,rr=r*(.4+.6*ease(pop))*(1+.03*Math.sin(t*2.6)),bw=rr*.95,bt=Math.max(6,rr*.2);
  glow(c,x,y,rr*1.7,col,.25);
  circle(c,x,y,rr,'rgba(11,26,21,.92)',col,Math.max(3,rr*.13));
  const u=mod(t*.55);circle(c,x,y,rr+4+u*16*ring,null,rgba(col,.7*(1-u)),3);
  c.save();c.fillStyle=col;c.beginPath();c.roundRect(x-bw/2,y-bt/2,bw,bt,bt/2);if(!minus)c.roundRect(x-bt/2,y-bw/2,bt,bw,bt/2);c.fill();c.restore();
}
function lwrap(c,p,x,y,maxW,size,col,lh){                            // left wrap with balanced rows; returns height
  const str=D.tr(p),n=K.splitLines(c,str,maxW,size).length;let lo=40,hi=maxW;
  while(hi-lo>2){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}
  return K.wrap(c,p,x,y,hi+1,size,col,lh);
}
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
// point at fraction u along a polyline
function along(pts,u){
  let tot=0;const seg=[];for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);tot+=l;}
  let d=clamp(u)*tot;for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1){const f=seg[i]?clamp(d/seg[i]):0;return K.lerpP(pts[i],pts[i+1],f);}d-=seg[i];}
  return pts[pts.length-1];
}
// nutrient dots along the traced dodder paths (host stem -> dodder flowers)
function nutrientFlow(c,R,t,per=3,size=1){
  DFLOW.forEach((path,i)=>{const pts=path.map(q=>dp(R,...q));
    const s=pts[0],v=mod(t*.8+i*.37);glow(c,s[0],s[1],12*size,GREEN,.35+.25*Math.sin(t*2.4+i));
    circle(c,s[0],s[1],(10+12*v)*size,null,rgba(GREEN,.7*(1-v)),2);
    for(let j=0;j<per;j++){const u=mod(t/3.4+i*.21+j/per),p=along(pts,u),a=u<.12?u/.12:u>.88?(1-u)/.12:1;
      glow(c,p[0],p[1],16*size,WHITE,.7*a);circle(c,p[0],p[1],5.2*size,rgba(WHITE,a),rgba(C.ink,.9*a),2);}
    const e=pts[pts.length-1],w=mod(t*.6+i*.29);circle(c,e[0],e[1],(6+14*w)*size,null,rgba(WHITE,.55*(1-w)),2);
  });
}
// a small cream larva (segmented grub), length len, wiggle phase
function grub(c,x,y,len,ang,t,a=1){
  c.save();c.globalAlpha*=a;c.translate(x,y);c.rotate(ang+.18*Math.sin(t*3.1));
  const seg=5,r=len*.17;
  for(let i=0;i<seg;i++){const f=i/(seg-1),xx=-len/2+f*len,yy=Math.sin(t*4+f*3)*r*.35,rr=r*(1-.35*Math.abs(f-.4));
    circle(c,xx,yy,rr,'#f4e7c3',rgba('#8a7650',.9),1.4);}
  circle(c,len/2-r*.2,Math.sin(t*4+3)*r*.35,r*.42,'#c9a96a');
  c.restore();
}
// time bar with three sub-stages (step 1)
function timeBar(c,ct,t,a1,a2,a3){
  const X0=110,X1=900,Y=470,NX=[200,505,810];
  text(c,L('time','時間','Time'),14,Y+8,22,MUTED);
  K.sline(c,[[X0,Y],[X1,Y]],rgba(WHITE,.35),6);
  const cx=mix(X0,X1,clamp(ct/PER));K.sline(c,[[X0,Y],[cx,Y]],rgba(YELLOW,.85),6);
  c.save();c.fillStyle=rgba(WHITE,.55);c.beginPath();c.moveTo(X1+16,Y);c.lineTo(X1-2,Y-10);c.lineTo(X1-2,Y+10);c.closePath();c.fill();c.restore();
  const lab=[NEW.st1,NEW.st2,NEW.st3],act=[a1,a2,a3];
  NX.forEach((x,i)=>{const on=act[i],reached=cx>=x-2;
    if(on>0)glow(c,x,Y,30,YELLOW,.35*on*(.8+.2*Math.sin(t*3)));
    circle(c,x,Y,13,reached?YELLOW:'rgba(11,26,21,.95)',reached?WHITE:rgba(WHITE,.6),3);
    const w=measure(c,lab[i],24)+28;D.round(c,x-w/2,Y+28,w,42,21,on>.5?rgba(YELLOW,.95):'rgba(11,26,21,.92)',on>.5?WHITE:rgba(WHITE,.5));
    text(c,lab[i],x,Y+28+21+24*.36,24,on>.5?C.deep:WHITE,'center');});
  glow(c,cx,Y,16,YELLOW,.6);circle(c,cx,Y,7,WHITE);
}
// a time strip for step 2: two lines (gain side green, harmed side orange); kind 'pa' long together, 'pr' prey line ends
function strip(c,x0,x1,y,kind,t,labG,labO){
  const yG=y,yO=y+36,xe=kind==='pa'?x1:mix(x0,x1,.34);
  text(c,labG,x0-12,yG+8,22,GREEN,'right');text(c,labO,x0-12,yO+8,22,ORANGE,'right');
  if(kind==='pa'){
    K.sline(c,[[x0,yG],[x1,yG]],rgba(GREEN,.9),6);K.sline(c,[[x0,yO],[x1,yO]],rgba(ORANGE,.9),6);
    for(let i=0;i<5;i++){const u=mod(t/6+i/5),x=mix(x0+10,x1-10,u),v=mod(t*.9+i*.45),yy=mix(yO,yG,smooth(v)),a=Math.sin(Math.PI*v);
      glow(c,x,yy,9,WHITE,.5*a);circle(c,x,yy,3.4,rgba(WHITE,.95*a));}
  }else{
    const meet=[xe,(yG+yO)/2];
    K.sline(c,[[x0,yG],[x1,yG]],rgba(GREEN,.9),6);
    c.save();c.lineCap='round';c.beginPath();c.moveTo(x0,yO);c.lineTo(xe-40,yO);c.quadraticCurveTo(xe-8,yO,meet[0],meet[1]+4);c.strokeStyle=rgba(ORANGE,.9);c.lineWidth=6;c.stroke();c.restore();
    const v=mod(t*.7);circle(c,meet[0],meet[1]+4,7+12*v,null,rgba(ORANGE,.8*(1-v)),2.5);circle(c,meet[0],meet[1]+4,6,ORANGE,C.ink,2);
    c.save();c.setLineDash([4,8]);K.sline(c,[[xe+14,yO],[x1,yO]],rgba(ORANGE,.25),3);c.restore();
  }
  const u=mod(t/6),cx=mix(x0,x1,u);c.save();c.setLineDash([4,5]);K.sline(c,[[cx,yG-14],[cx,yO+14]],rgba(WHITE,.4),2);c.restore();
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.parasiteSt||(s.parasiteSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  st.lastT=t;
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(steps,d)=>{const inK=steps.includes(k),inF=st.from>=0&&steps.includes(st.from);
    const now=!inK?0:inF?1:ease((tau-d)/.7);
    if(!moving)return now;const was=inF?1:0;return now>=was?now:mix(was,now,u);};
  const RR=m=>(moving&&m[st.from]&&m[k])?lerpR(m[st.from],m[k],u):m[k]||m[st.from];
  const RD=RR({0:R_D0,2:R_D2})||R_D0,RC=RR({1:R_C1,2:R_C2})||R_C1;
  const pop=(d)=>moving?1:clamp((tau-d)/.6);
  const held=s.phase>=0;

  // step-1 sub-stages (a eggs 0-2.7 s, b larvae 2.7-5.4 s, c cocoons 5.4-8 s); held steps loop, so c fades back to a
  const ct=k===1?(held?mod(tau,PER):Math.min(tau,PER-.001)):(moving&&st.from===1&&st.ct1!==undefined?st.ct1:PER-.001);
  if(k===1)st.ct1=ct;                                                            // a move away from step 1 keeps its last sub-stage
  const ramp=(v,a,b)=>clamp((v-a)/(b-a));
  const wrapIn=held&&(k===1||st.from===1)?ramp(ct,7.4,8):0;
  const sA=Math.max(1-ramp(ct,2.4,3.0),wrapIn),sB=Math.min(ramp(ct,2.4,3.0),1-ramp(ct,5.1,5.7)),sC=Math.min(ramp(ct,5.1,5.7),1-wrapIn);
  const wEC20=1-sC;                                                              // EC20 visible in a and b

  // ── pictures ──
  withA(c,A([0,2],.0),()=>picIn(c,DOD,RD));
  withA(c,A([1],.0)*wEC20,()=>{const bob=1.2*Math.sin(t*1.3);picIn(c,WASP,{x:R_W1.x,y:R_W1.y+bob,w:R_W1.w,h:R_W1.h});});
  const aC=A([1,2],0)*(k===1?(moving&&st.from===2?mix(1,sC,u):sC):(moving&&st.from===1?mix(sC,1,u):1));
  withA(c,aC,()=>{
    const br=1+.006*Math.sin(t*1.6),cx=RC.x+RC.w/2,cy=RC.y+RC.h/2;c.save();c.translate(cx,cy);c.scale(br,br);c.translate(-cx,-cy);picIn(c,COC,RC);c.restore();});

  // ── step 0: dodder on a host plant ──
  withA(c,A([0],.6),()=>nutrientFlow(c,RD,t,3,1));
  const card=(X,y,W,h,name,anchor,ph,minus,head,lines,pp,la=1)=>{
    D.round(c,X,y,W,h,16,'rgba(28,61,52,.95)',rgba(minus?ORANGE:GREEN,.45+.2*Math.sin(t*2+ph)));
    const p=tag(c,name,X+16,y+14,{col:WHITE,minX:X+16});
    withA(c,la,()=>leader(c,[p.x,p.y+p.h/2],anchor,WHITE,t+ph));
    signDisc(c,X+50,y+104,28,t+ph,pp,minus);text(c,head,X+90,y+100,26,minus?ORANGE:GREEN);
    let yy=y+132;for(const [q,col] of lines)yy+=lwrap(c,q,X+90,yy,W-90-14,22,col,30);
  };
  withA(c,A([0],1.0),()=>card(RX0,14,CW-12-RX0,170,L('dodder','菟絲子','Dodder'),dp(RD,...D_STRAND),0,false,NEW.gets,[[NEW.dodGain,WHITE]],k===0?pop(1.4):1));
  withA(c,A([0],1.8),()=>{const p=tag(c,NEW.nutrients,RX0,198,{col:WHITE,minX:RX0});const m=along(DFLOW[4].map(q=>dp(RD,...q)),.55);
    dline(c,[p.x,p.y+p.h/2],m,WHITE,t+.3);circle(c,m[0],m[1],6,WHITE,C.ink,2);});
  withA(c,A([0],2.6),()=>{const p=tag(c,NEW.twine,RX0,252,{col:WHITE,minX:RX0});const r=dp(RD,...D_COIL);leader(c,[p.x,p.y+p.h/2],r,WHITE,t+.6);
    const v=mod(t*.6);circle(c,r[0],r[1],14+22*v,null,rgba(WHITE,.6*(1-v)),2.5);});
  withA(c,A([0],3.4),()=>card(RX0,312,CW-12-RX0,170,NEW.hostPlant,dp(RD,...D_LEAF),.9,true,L('loss','受害','Harmed'),[[NEW.hostLoss,WHITE]],k===0?pop(3.8):1));
  withA(c,A([0],5.0),()=>{const pa=L('parasitism','寄生','Parasitism'),lab=P(pa[0]+'：＋／−',pa[1]+': + / −');
    const p=tag(c,lab,RX0,500,{col:YELLOW,active:true,size:24,minX:RX0});if(k===0)pulseRing(c,p,t,YELLOW);});

  // ── step 1: parasitic wasp, eggs -> larvae -> cocoons ──
  const win=wp(...W_WIN),wr=[W_WR[0]*R_W1.w/1400,W_WR[1]*R_W1.h/651];
  withA(c,A([1],.3)*Math.max(sA,sB),()=>{                                     // dashed "inside" window on the caterpillar
    c.save();c.beginPath();c.ellipse(win[0],win[1],wr[0],wr[1],0,0,K.TAU);c.fillStyle=rgba('#0b1a15',.45*sB+.18*sA);c.fill();
    c.setLineDash([9,7]);c.lineDashOffset=-t*10;c.strokeStyle=rgba(WHITE,.85);c.lineWidth=3;c.stroke();c.restore();});
  const EGG=[[-60,6],[-10,-8],[42,8],[88,-4]];
  withA(c,A([1],.3)*sA,()=>{                                                   // eggs slide from the ovipositor tip into the window
    const tip=wp(...W_TIP),v=mod(t*.8);circle(c,tip[0],tip[1],8+14*v,null,rgba(YELLOW,.8*(1-v)),2.5);glow(c,tip[0],tip[1],14,YELLOW,.5);
    EGG.forEach((e,i)=>{const t0=.5+i*.5,q=clamp((ct-t0)/.8),dst=[win[0]+e[0]*wr[0]/120,win[1]+e[1]*wr[1]/40];
      if(ct<t0)return;const ctl=[(tip[0]+dst[0])/2+10,tip[1]-6],p=K.bez(tip,ctl,dst,smooth(q));
      c.save();c.translate(p[0],p[1]);c.rotate(.5);K.ellipse(c,0,0,8,5,'#f6eccd',rgba('#8a7650',.9),1.4);c.restore();});
  });
  withA(c,A([1],.3)*sB,()=>{                                                   // larvae grow and wiggle inside (schematic)
    const g=.45+.55*ramp(ct,2.6,5.0);
    EGG.forEach((e,i)=>grub(c,win[0]+e[0]*wr[0]/120,win[1]+e[1]*wr[1]/40,40*g,(i%2?.3:-.25),t+i*.8));});
  const catA=wp(...W_CAT),catC=cp(RC,...C_CAT);
  withA(c,A([1],.3),()=>{                                                      // stage pill (eggs / larvae / cocoons) with leader
    const tw=(p,a,anc,ph)=>withA(c,a,()=>{const q=tag(c,p,14,352,{col:WHITE});leader(c,[q.x+q.w/2,q.y],anc,WHITE,t+ph);});
    tw(NEW.eggs,sA*(1-wrapIn),[win[0]-wr[0]*.4,win[1]],0);tw(NEW.larvae,sB,[win[0]-wr[0]*.45,win[1]+4],.3);tw(L('cocoons','蜂繭','Wasp cocoons'),sC,cp(RC,...C_COC),.6);
    withA(c,Math.max(sA*(1-wrapIn),sB),()=>text(c,NEW.inside,14,424,22,MUTED));
  });
  withA(c,A([1],.8),()=>card(RX1,14,CW-12-RX1,196,L('wasp','寄生蜂','Parasitic wasp'),wp(...W_WASP),0,false,NEW.gets,[[NEW.waspGain,WHITE]],k===1?pop(1.2):1,1-sC));
  withA(c,A([1],1.6),()=>{const anc=K.lerpP(catA,catC,sC);
    card(RX1,218,CW-12-RX1,206,L('caterpillar','毛蟲','Caterpillar'),anc,.9,true,L('loss','受害','Harmed'),[[NEW.catLoss1,WHITE],[NEW.catLoss2,ORANGE]],k===1?pop(2.0):1);
    if(sC>0)withA(c,sC,()=>{const v=mod(t*.8);D.round(c,RX1-4*v,218-4*v,CW-12-RX1+8*v,206+8*v,18,null,rgba(ORANGE,.6*(1-v)));});});
  withA(c,A([1],.4),()=>timeBar(c,ct,t,sA,sB,sC));

  // ── step 2: + / −, parasitism vs predation ──
  withA(c,A([2],.6),()=>nutrientFlow(c,RD,t,1,.6));
  const row=(x,y,minus,name,ph)=>{signDisc(c,x+18,y,18,t+ph,k===2?pop(.6):1,minus,.6);text(c,name,x+46,y+8,22,WHITE);};
  withA(c,A([2],.8),()=>{row(248,90,false,L('dodder','菟絲子','Dodder'),0);row(248,150,true,NEW.hostPlant,.4);});
  withA(c,A([2],1.2),()=>{row(248,298,false,L('wasp','寄生蜂','Parasitic wasp'),.8);row(248,356,true,L('caterpillar','毛蟲','Caterpillar'),1.2);});
  withA(c,A([2],2.8),()=>lwrap(c,NEW.waspKill,14,430,456,22,ORANGE,30));
  const RX2=490,RW2=CW-12-RX2;
  withA(c,A([2],.4),()=>{const p=tag(c,NEW.both,RX2+RW2/2,14,{al:'center',col:YELLOW,active:true,minX:RX2,maxX:CW-12});if(k===2)pulseRing(c,p,t,YELLOW);});
  const box=(y,h,title,ph,kind,lines,labs)=>{
    D.round(c,RX2,y,RW2,h,16,'rgba(28,61,52,.95)',rgba(YELLOW,.3+.15*Math.sin(t*2+ph)));
    text(c,title,RX2+18,y+36,26,YELLOW);const tw=measure(c,title,26);
    signDisc(c,RX2+18+tw+30,y+27,15,t+ph,1,false,.4);signDisc(c,RX2+18+tw+70,y+27,15,t+ph+.3,1,true,.4);
    strip(c,620,CW-34,y+76,kind,t+ph,...labs);
    let yy=y+150;for(const [q,col] of lines)yy+=lwrap(c,q,RX2+18,yy,RW2-36,22,col,30);
  };
  withA(c,A([2],1.4),()=>box(60,236,L('parasitism','寄生','Parasitism'),0,'pa',[[NEW.paLong,WHITE],[NEW.paNot,MUTED]],[L('parasite','寄生者','Parasite'),L('host','寄主','Host')]));
  withA(c,A([2],2.2),()=>box(306,170,L('predation','掠食','Predation'),.6,'pr',[[NEW.prEat,WHITE]],[L('predator','掠食者','Predator'),L('prey','獵物','Prey')]));
  withA(c,A([2],2.6),()=>{const Y=494;K.sline(c,[[620,Y],[CW-40,Y]],rgba(WHITE,.55),3);
    c.save();c.fillStyle=rgba(WHITE,.7);c.beginPath();c.moveTo(CW-26,Y);c.lineTo(CW-42,Y-8);c.lineTo(CW-42,Y+8);c.closePath();c.fill();c.restore();
    text(c,L('time','時間','Time'),608,Y+8,22,MUTED,'right');});
  withA(c,A([2],3.4),()=>{const p=tag(c,NEW.signsFirst,RX2,516,{col:YELLOW,minX:RX2});if(k===2)pulseRing(c,p,t+.5,YELLOW);});
  withA(c,A([2],3.0),()=>tag(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains · − harmed · 0 no evident effect'),14,516,{col:WHITE,maxX:476}));

  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
  withA(c,A([0,1,2],0),()=>text(c,ai,CW-12,590,22,MUTED,'right'));
}
window.EcologyDraw.parasite=draw;
})();

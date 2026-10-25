/* Unit 11 lesson 2 · "stages" canvas (resource-use-and-introduction tab, view 2), 2026-10-25. From arrival to invasion (plan section 3).
 * Five steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (the lit layer pulses, icons breathe,
 * the spreading dots keep flowing out, the harm pictures loop: light rays, a fish being eaten, soil crumbling).
 * Layout as pathway / harvest: left = scene window WIN (x 16..636, y 16..428) + statement box under it; right = step card (x 652..944).
 * Scene (window-local px): a funnel (centre x 385, y 12..400, half width 225 at the top to 70 at the bottom) cut into four layers
 * (arrival / establishment / spread / causing harm; label pills left of the funnel wall). The lit layer has a coloured frame.
 *  0 arrival: 12 small icons (3 each of the four TH5 animals) fall into layer 1. Their names are in the card legend.
 *  1 not all stay: 8 icons fade (4 drift up and out = leave, 4 tip over and sink = die); one of EACH kind stays (green ring), so no
 *    species is shown failing (individuals, as in the step text). A box "Nonnative is not invasive" appears in the empty layer 2.
 *  2 establishment: the four survivors drop into layer 2; each produces two more (green +), a small column per kind.
 *  3 spread: in layer 3 the apple snail (EC15, "Example: apple snail", one icon only) sits at one point; green dots flow outward and
 *    a green dashed range ring grows (clipped to the layer). Layer 2 stays visible, dimmed.
 *  4 harm: the funnel shrinks to a small icon at the left (layer 4 orange); three orange arrows lead to three rows:
 *    competition (TH6 vine over the canopy, yellow light rays stop on the vines), feeding (TH5 crayfish, small generic fish; an orange
 *    arrow points from the eaten to the eater, one fish fades in a loop), habitat change (drawn riverbank with burrow holes, soil
 *    crumbs fall into the water, orange dashed outline). Statement: evidence of establishment, spread and harm, not origin or looks.
 *    Card: dashed note "Do not kill, eat or release them; leave it to professionals".
 * Colours (plan 1.4): population (survivors, growth, spread) green #4ade80; pressure / harm orange #fb923c; light yellow (as ecology
 * lesson 4); everything else neutral. Orange is NOT used for "carried by people" here (that is pathway's meaning; no routes here).
 * No numbers; no species lists beyond the plan's TH5 four, EC15 apple snail (example) and TH6 vine; which individuals stay is schematic.
 * Pictures: environment_ai_1024/TH5_* (tight transparent crops, alpha>10 box = whole picture; all face left; crayfish is a top view,
 * head up), TH6_vine_smother.jpg (1672x933; crop fractions [.36,.04,.54,.57] = the vine dome over the trees),
 * ecology_ai_1023/EC15_apple_snail.png (1037x639, tight, faces right).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=5,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,ORANGE=K.COL.pressure,GREEN=K.COL.count,YELLOW=C.yellow,INK=C.ink;
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const FROG=ENV+'TH5_spot_legged_treefrog.png',TURTLE=ENV+'TH5_red_eared_slider.png',IGUANA=ENV+'TH5_green_iguana.png',CRAY=ENV+'TH5_crayfish.png';
const VINE=ENV+'TH6_vine_smother.jpg',SNAIL='EC15_apple_snail.png';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('從到達到入侵','From arrival to invasion'),
 short:[P('到達','Arrival'),P('不一定留下','Not all stay'),P('建立族群','Establishment'),P('擴散','Spread'),P('危害的路','Ways of harm')],
 names:[P('第一層：到達','Layer 1: arrival'),P('外來不等於入侵','Nonnative is not invasive'),P('第二層：建立族群','Layer 2: establishment'),P('第三層：擴散','Layer 3: spread'),P('第四層：造成危害','Layer 4: causing harm')],
 layer:[P('到達','Arrival'),P('建立族群','Establishment'),P('擴散','Spread'),P('造成危害','Causing harm')],
 kind:[P('斑腿樹蛙','Spot-legged tree frog'),P('巴西龜','Red-eared slider'),P('綠鬣蜥','Green iguana'),P('美國螯蝦','Red swamp crayfish')],
 notInv:P('外來不等於入侵','Nonnative is not invasive'),
 snail:P('例子：福壽螺','Example: apple snail'),
 harm:[P('競爭','Competition'),P('取食','Feeding'),P('改變棲地','Habitat change')],
 harmD:[P('藤蔓蓋住樹冠，搶走陽光','A vine covers the canopy and takes the light'),P('螯蝦吃水生生物','Crayfish eat aquatic organisms'),P('水岸被挖鬆','The riverbank is dug loose')],
 st:[P('多種外來生物到達新的地方','Several nonnative organisms arrive in a new place'),
  P('不是每一個都留得下來：多數離開或死去','Not every one stays: most leave or die'),
  P('能活下來並繁殖的，開始增加：建立族群','Those that survive and reproduce increase: establishment'),
  P('族群從一個點往外擴散','The population spreads outward from one point'),
  P('要說入侵，看建立、擴散、有害的證據，不是來源，也不是長相','To call it invasive, look for evidence of establishment, spread and harm, not origin or looks')],
 manage:P('不自行捕殺、食用或野放，交給專業管理','Do not kill, eat or release them; leave it to professionals'),
 note:P('大小與數目都是示意','Sizes and numbers are schematic'),
 legFade:P('變淡：離開或死去','Fading: left or died'),
 legRing:P('綠圈：留下來的個體','Green ring: individuals that stay'),
 legPlus:P('綠色＋：繁殖，數量增加','Green +: breeding, numbers grow'),
 legBand:P('亮框：現在這一層','Lit frame: the current layer'),
 legDot:P('綠點：族群往外擴散','Green dots: the population spreads'),
 legRange:P('綠色虛線：分布範圍變大','Green dashes: the range grows'),
 legEat:P('橘色箭頭：指向吃的一方','Orange arrow: points to the eater')
};

// ── geometry (window-local px) ───────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412};
const CARD={x:652,y:16,w:292,h:550};
const FX=385,FT=12,FB=400,HW0=225,HW1=70;
const BY=[12,130,222,314,400];                         // layer boundaries
const hw=y=>HW0-(HW0-HW1)*(y-FT)/(FB-FT);
const BCOL=[WHITE,GREEN,GREEN,ORANGE];
const ACT=[0,0,1,2,3];                                 // lit layer per step
const FILE=[FROG,TURTLE,IGUANA,CRAY],BW=[40,46,56,22];   // icon files, base widths
// 12 arrivals: kind, position in layer 1 (dx from FX, y), survivor column (-1 = does not stay), fate (0 leave, 1 die), fade order
const ARR=[[0,-150,52],[1,-90,52],[3,-30,52],[2,30,52],[0,90,52],[1,150,52],[3,-140,100],[2,-84,100],[1,-28,100],[0,28,100],[2,84,100],[3,140,100]]
 .map(([kind,dx,y],i)=>({kind,x:FX+dx,y,i}));
const SURV={6:0,8:1,3:2,4:3};                          // arrival index -> column in layer 2
let ord=0;ARR.forEach(A=>{A.col=SURV[A.i]!==undefined?SURV[A.i]:-1;if(A.col<0){A.fate=ord%2;A.ord=ord++;}});
const COLX=[-123,-41,41,123].map(d=>FX+d),COLY=[148,176,204],COLJ=[0,-10,10],SC2=.75;
const SN={x:FX,y:252,w:46};
// step 5 (harm): mini funnel and three rows
const MINI={s:.18,x:44,y:150},TRUNK=92;
const ROWS=[8,140,272].map(y=>({x:112,y,w:500,h:126}));

// ── helpers (as in pathway) ──────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、；？])|(?<=[:,;?] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:mode===1?rgba(col,.7):rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:mode===1?col:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22,vc=false}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=vc?y-g.h/2:y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,stroke=null}={}){
  const w=tagW(c,p,size),h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,FILL,rgba(stroke||col,.95));text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const plateW=(c,p)=>measure(c,p,22)+14;
function plate(c,p,x,y,{al='center',col=WHITE}={}){const w=plateW(c,p),h=32,bx=al==='right'?x-w:al==='left'?x:x-w/2;
  D.round(c,bx,y,w,h,10,FILL,rgba(col,.75));text(c,p,bx+w/2,y+24,22,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const G=(x,y)=>[WIN.x+x,WIN.y+y];
function pic(c,file,x,y,w,{flip=false,rot=0,a=1}={}){const [W,H]=K.SIZE[file],h=w*H/W;
  withA(c,a,()=>{c.save();c.translate(x,y);if(rot)c.rotate(rot);K.drawIn(c,file,{x:-w/2,y:-h/2,w,h},{flip});c.restore();});}
// generic small fish (drawn, no species), facing right when dir>0
function fishShape(c,x,y,len,body,edge,dir=1,a=1,t=0){withA(c,a,()=>{c.save();c.translate(x,y);c.scale(dir,1);
  const wag=Math.sin(t*6)*.12;
  c.beginPath();c.moveTo(-len*.42,0);c.lineTo(-len*.62,-len*.2+wag*len);c.lineTo(-len*.62,len*.2+wag*len);c.closePath();c.fillStyle=body;c.fill();c.strokeStyle=edge;c.lineWidth=2;c.stroke();
  K.ellipse(c,0,0,len*.45,len*.2,body,edge,2);circle(c,len*.27,-len*.04,2.2,INK,null);c.restore();});}
function plus(c,x,y,r,col,lw=3){K.sline(c,[[x-r,y],[x+r,y]],col,lw);K.sline(c,[[x,y-r],[x,y+r]],col,lw);}

// funnel outline path for layer b (0..3), in local coords
function bandPath(c,b){const y0=BY[b],y1=BY[b+1];c.beginPath();c.moveTo(FX-hw(y0),y0);c.lineTo(FX+hw(y0),y0);c.lineTo(FX+hw(y1),y1);c.lineTo(FX-hw(y1),y1);c.closePath();}

// ── icon states (local px). Returns {x,y,w,a,rot,ring}
function arrAt(A,k,tau,t){const W=BW[A.kind],bob=Math.sin(t*1.4+A.i*1.3)*1.2;
  if(k===0){const d=.4+A.i*.28,v=clamp((tau-d)/.9),e=1-Math.pow(1-v,3),bo=v>=1?0:Math.sin(Math.PI*clamp((v-.7)/.3))*8;
    return{x:A.x,y:mix(-40,A.y,e)-bo+(v>=1?bob:0),w:W,a:tau>d?1:0,rot:0,ring:0};}
  if(k===1){if(A.col>=0)return{x:A.x,y:A.y+bob,w:W*(1+.02*Math.sin(t*1.8+A.i)),a:1,rot:0,ring:clamp((tau-4.6)/.5)};
    const f=.9+A.ord*.4,v=smooth((tau-f)/1.6);
    if(A.fate===0)return{x:A.x+Math.sign(A.x-FX)*60*v,y:A.y-90*v,w:W,a:1-v,rot:0,ring:0};
    return{x:A.x,y:A.y+14*v,w:W,a:1-smooth((tau-f-.5)/1.3),rot:.9*v*(A.x<FX?-1:1),ring:0};}
  if(A.col<0)return{x:A.x,y:A.y,w:W,a:0,rot:0,ring:0};
  const cx=COLX[A.col]+COLJ[0],cy=COLY[0];
  if(k===2){const v=smooth((tau-.4)/1.2);return{x:mix(A.x,cx,v),y:mix(A.y,cy,v)-24*Math.sin(Math.PI*v)+(v>=1?bob:0),w:mix(W,W*SC2,v),a:1,rot:0,ring:1-v};}
  return{x:cx,y:cy+bob*.6,w:W*SC2,a:.5,rot:0,ring:0};}
// offspring in layer 2: column col, slot 1|2
const KIDS=[];[3,1,2,0].forEach((kind,col)=>{[1,2].forEach(sl=>KIDS.push({kind,col,sl,i:12+col*2+sl}));});
// column kinds: survivors 6 (crayfish) -> 0, 8 (slider) -> 1, 3 (iguana) -> 2, 4 (frog) -> 3
function kidAt(Q,k,tau,t){const W=BW[Q.kind]*SC2,sx=COLX[Q.col]+COLJ[Q.sl],sy=COLY[Q.sl],bob=Math.sin(t*1.4+Q.i*1.3)*1;
  if(k<2)return{x:COLX[Q.col],y:COLY[0],w:W*.5,a:0,rot:0,ring:0};
  if(k===2){const s0=Q.sl===1?2.4:4.0,v=smooth((tau-s0)/.6);
    return{x:mix(COLX[Q.col],sx,v),y:mix(COLY[0],sy,v)+(v>=1?bob:0),w:W*mix(.5,1,v),a:tau>s0?1:0,rot:0,ring:0};}
  return{x:sx,y:sy+bob*.6,w:W,a:.5,rot:0,ring:0};}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.stgSt||(s.stgSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;st.pos={};}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.fromPos=Object.assign({},st.pos);}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.fromPos=Object.assign({},st.pos);}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  // morph 0 = big funnel, 1 = mini funnel (step 5)
  const mOf=j=>j===4?1:0,m=moving?mix(mOf(st.from),mOf(k),u):mOf(k);
  const actOf=j=>ACT[j];

  // ── scene window ──
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  c.fillStyle='#16332b';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  // funnel group transform (big -> mini)
  const sc=mix(1,MINI.s,m),ox=mix(0,MINI.x-FX*MINI.s,m),oy=mix(0,MINI.y-FT*MINI.s,m);
  c.save();c.translate(WIN.x+ox,WIN.y+oy);c.scale(sc,sc);
  // layer fills and frames
  for(let b=0;b<4;b++){
    const on=b===actOf(k)?(moving&&actOf(st.from)!==b?u:1):(moving&&actOf(st.from)===b?1-u:0);
    bandPath(c,b);c.fillStyle=b%2?'#1f4237':'#1c3d34';c.fill();
    if(on>0){bandPath(c,b);c.fillStyle=rgba(BCOL[b],.10*on);c.fill();}
    bandPath(c,b);c.strokeStyle=rgba(WHITE,.35);c.lineWidth=2/sc;c.stroke();
  }
  // funnel walls
  K.sline(c,[[FX-HW0,FT],[FX-HW1,FB]],rgba('#a9c3d4',.9),4/sc);K.sline(c,[[FX+HW0,FT],[FX+HW1,FB]],rgba('#a9c3d4',.9),4/sc);
  K.ellipse(c,FX,FT,HW0,6,null,rgba('#a9c3d4',.9),3/sc);
  // chevrons between layers (lit once the step reaches below them)
  for(let b=1;b<4;b++){const lit=actOf(k)>=b?(moving&&actOf(st.from)<b?u:1):(moving&&actOf(st.from)>=b?1-u:0),y=BY[b],col=BCOL[b];
    const dy=mod(t*.8)*6*lit;
    withA(c,.35*(1-lit),()=>{c.beginPath();c.moveTo(FX-12,y-6);c.lineTo(FX,y+6);c.lineTo(FX+12,y-6);c.strokeStyle=WHITE;c.lineWidth=3/sc;c.stroke();});
    withA(c,lit,()=>{c.beginPath();c.moveTo(FX-14,y-8+dy);c.lineTo(FX,y+6+dy);c.lineTo(FX+14,y-8+dy);c.strokeStyle=col;c.lineWidth=4/sc;c.stroke();});}
  // lit layer frame (pulse)
  const ab=actOf(k),fa=moving&&actOf(st.from)!==ab?u:1;
  withA(c,fa,()=>{bandPath(c,ab);c.strokeStyle=BCOL[ab];c.lineWidth=(3+Math.sin(t*2.4))/sc;c.stroke();});
  if(moving&&actOf(st.from)!==ab)withA(c,1-u,()=>{const b=actOf(st.from);bandPath(c,b);c.strokeStyle=BCOL[b];c.lineWidth=3/sc;c.stroke();});

  // icons (fade out while the funnel shrinks)
  const ia=clamp(1-m*2),pos={};
  const blend=(id,p)=>{if(moving&&st.fromPos&&st.fromPos[id]){const f=st.fromPos[id];return{x:mix(f.x,p.x,u),y:mix(f.y,p.y,u),w:mix(f.w,p.w,u),a:mix(f.a,p.a,u),rot:mix(f.rot,p.rot,u),ring:mix(f.ring,p.ring,u)};}return p;};
  // spread (step 4): dots and range ring, clipped to layer 3
  const spA=(k===3?(moving&&st.from!==3?u:1):(moving&&st.from===3?1-u:0))*ia;
  const sT=k===3?tau:9;
  withA(c,spA,()=>{c.save();bandPath(c,2);c.clip();
    const g=smooth((sT-1)/4),rx=mix(20,170,g),ry=mix(8,36,g);
    c.save();c.setLineDash([10,8]);c.lineDashOffset=-t*12;K.ellipse(c,SN.x,SN.y+6,rx,ry,null,rgba(GREEN,.9),3);c.restore();
    for(let i=0;i<26;i++){const th=i/26*Math.PI*2+.13,ph=mod(t*.18+i*.37),r=ph*g*1.1;
      const px=SN.x+Math.cos(th)*rx*r,py=SN.y+6+Math.sin(th)*ry*r;circle(c,px,py,5,rgba(GREEN,.95*(1-ph*ph)),null);}
    c.restore();});
  ARR.forEach(A=>{const p=blend('a'+A.i,arrAt(A,k,tau,t));pos['a'+A.i]=p;
    if(p.ring>0&&p.a>0)withA(c,p.ring*ia,()=>{const q=mod(t*.7);circle(c,p.x,p.y,26,null,GREEN,3);circle(c,p.x,p.y,26+q*12,null,rgba(GREEN,.8*(1-q)),2);});
    if(p.a>0)pic(c,FILE[A.kind],p.x,p.y,p.w,{rot:p.rot,a:p.a*ia});});
  KIDS.forEach(Q=>{const p=blend('k'+Q.i,kidAt(Q,k,tau,t));pos['k'+Q.i]=p;if(p.a>0)pic(c,FILE[Q.kind],p.x,p.y,p.w,{a:p.a*ia});
    // green + when a new one appears
    if(k===2&&!moving){const s0=Q.sl===1?2.4:4.0,q=clamp((tau-s0-.3)/1.4);if(q>0&&q<1)withA(c,(1-q)*ia,()=>{circle(c,p.x+20,p.y-8,10+q*8,null,GREEN,3);plus(c,p.x+20,p.y-8,6,GREEN,3);});}});
  st.pos=pos;
  // the snail (step 4)
  withA(c,spA*clamp((sT-.4)/.6),()=>pic(c,SNAIL,SN.x,SN.y+Math.sin(t*1.2)*1.5,SN.w*(1+.02*Math.sin(t*1.8))));
  c.restore();   // funnel group

  // ── labels on the funnel (big state only) ──
  const la=clamp(1-m*2);
  T.layer.forEach((p,b)=>{const yc=(BY[b]+BY[b+1])/2,[ex,ey]=G(FX-hw(yc)-10,yc-20);
    const on=b===ab,past=b<ab,col=on?BCOL[b]:past?WHITE:MUTED;
    withA(c,la*(on||past?1:.75),()=>{const r=tag(c,p,ex,ey,{al:'right',col,stroke:on?BCOL[b]:rgba(WHITE,.5)});if(la>=.99)push(rects,1,'lay'+b,r);});});
  // snail name plate (step 4)
  withA(c,spA*clamp((sT-.8)/.6),()=>{const [px,py]=G(SN.x,SN.y+22);const r=plate(c,T.snail,px,py);push(rects,spA,'snail',r);});
  // step 2: "Nonnative is not invasive" in the (still empty) layer 2
  const niA=(k===1?(moving&&st.from!==1?u:1):(moving&&st.from===1?1-u:0))*clamp(((k===1?tau:9)-4.8)/.6);
  withA(c,niA,()=>{const [bx,by]=G(FX,BY[1]+(BY[2]-BY[1])/2);const r=box(c,T.notInv,bx,by,{maxW:300,al:'center',stroke:WHITE,vc:true});push(rects,niA,'notInv',r);if(k===1&&tau>5.4)ring(c,r,t,WHITE);});

  // ── step 5: three routes of harm ──
  const hA=clamp((m-.5)/.5);
  if(hA>0){
    const tip=G(MINI.x+(hw(357)+20)*MINI.s,MINI.y+((BY[3]+BY[4])/2-FT)*MINI.s),tx0=WIN.x+TRUNK;
    withA(c,hA,()=>{const y0=WIN.y+ROWS[0].y+ROWS[0].h/2,y2=WIN.y+ROWS[2].y+ROWS[2].h/2;
      K.dashed(c,[[tip[0],tip[1]],[tx0,tip[1]]],ORANGE,4,[10,7],-t*20);K.dashed(c,[[tx0,y0],[tx0,y2]],ORANGE,4,[10,7],-t*20);});
    ROWS.forEach((R,r)=>{const ra=hA*clamp(((k===4?tau:9)-.3-r*.5)/.6+(moving?0:0));
      withA(c,ra,()=>{
        const [rx,ry]=G(R.x,R.y),cy=ry+R.h/2;
        // orange arrow from the funnel's last layer to the row
        K.arrow(c,tx0-2,cy,rx-2,cy,ORANGE,4);
        D.round(c,rx,ry,R.w,R.h,12,'rgba(11,26,21,.55)',rgba(ORANGE,.85));
        const th={x:rx+8,y:ry+9,w:180,h:108};
        c.save();c.beginPath();c.roundRect(th.x,th.y,th.w,th.h,8);c.clip();
        [thumbVine,thumbEat,thumbBank][r](c,th,t);
        c.restore();
        D.round(c,th.x,th.y,th.w,th.h,8,null,rgba(WHITE,.4));
        const tx=th.x+th.w+14,tw=rx+R.w-10-tx;
        const pr=tag(c,T.harm[r],tx,ry+10,{col:ORANGE});push(rects,ra,'harm'+r,pr);
        const h=bwrap(c,T.harmD[r],tx,ry+80,tw,22,WHITE,26);push(rects,ra,'harmD'+r,{x:tx,y:ry+62,w:tw,h});
      });});
  }
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  // ── statement under the window ──
  const SY=WIN.y+WIN.h+12,SC=[WHITE,WHITE,GREEN,GREEN,WHITE];
  const sd=[3.8,1.0,1.8,1.2,2.2][k],sa=clamp((tau-Math.max(sd,moving?MOVE*.6:0))/.5);
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>box(c,T.st[st.from],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[st.from]}));
  withA(c,sa,()=>{const q=box(c,T.st[k],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[k]});push(rects,sa,'say',q);s_dbg.sayBottom=q.y+q.h;if(k===4&&tau>3&&tau<9)ring(c,q,t,WHITE);});

  // ── step card ──
  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  text(c,T.note,16,592,22,MUTED,'left');push(rects,1,'note',{x:16,y:574,w:measure(c,T.note,22),h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  text(c,ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── harm thumbnails (rect th, already clipped) ───────────────────────────
function thumbVine(c,th,t){
  K.drawIn(c,VINE,th,{crop:[.36,.04,.54,.57]});
  // shade under the vines
  const g=c.createLinearGradient(0,th.y+th.h*.55,0,th.y+th.h);g.addColorStop(0,'rgba(11,26,21,0)');g.addColorStop(1,'rgba(11,26,21,.55)');c.fillStyle=g;c.fillRect(th.x,th.y,th.w,th.h);
  // light rays stop on the vine surface
  [[.18,.42],[.38,.22],[.58,.12],[.78,.2]].forEach(([fx,fy],i)=>{const x=th.x+th.w*fx,y1=th.y+th.h*fy;
    K.dashed(c,[[x+10,th.y-4],[x,y1]],rgba(YELLOW,.95),3,[8,6],-t*18-i*5);circle(c,x,y1,3+1.5*Math.sin(t*3+i),rgba(YELLOW,.9),null);});}
function thumbEat(c,th,t){
  const g=c.createLinearGradient(0,th.y,0,th.y+th.h);g.addColorStop(0,'#2a6a7e');g.addColorStop(1,'#1b4a5c');c.fillStyle=g;c.fillRect(th.x,th.y,th.w,th.h);
  for(let i=0;i<3;i++){const yy=th.y+20+i*32,off=mod(t*14+i*31,60);c.save();c.setLineDash([18,40]);c.lineDashOffset=-off;K.sline(c,[[th.x,yy],[th.x+th.w,yy]],'rgba(124,196,228,.25)',2);c.restore();}
  // water plants
  for(let i=0;i<3;i++){const bx=th.x+100+i*30,sw=Math.sin(t*1.1+i)*4;K.sline(c,[[bx,th.y+th.h],[bx+sw,th.y+th.h-34],[bx-sw*.5,th.y+th.h-52]],'#4f8a3c',3);}
  // crayfish (top view, head turned right)
  const cx=th.x+46+Math.sin(t*1.3)*2,cy=th.y+62;pic(c,CRAY,cx,cy,28,{rot:Math.PI/2});
  // small aquatic organisms (generic fish); the nearest is eaten in a loop
  const q=mod(t/4),eat=q<.5?0:smooth((q-.5)/.25)*(1-smooth((q-.85)/.15));
  fishShape(c,th.x+112-12*eat+Math.sin(t)*2,th.y+60,24,'rgba(242,236,217,.92)','#8fa39a',-1,1-eat,t);
  fishShape(c,th.x+150+Math.sin(t*.8+1)*4,th.y+34,22,'rgba(242,236,217,.92)','#8fa39a',-1,1,t+1);
  fishShape(c,th.x+152+Math.sin(t*.7+2)*4,th.y+88,22,'rgba(242,236,217,.92)','#8fa39a',-1,1,t+2);
  // orange arrow: from the eaten to the eater
  K.arrow(c,th.x+100,th.y+66,th.x+74,th.y+66,ORANGE,4);
  if(eat>0)circle(c,th.x+100,th.y+60,10+eat*10,null,rgba(ORANGE,.9*(1-eat)),3);}
function thumbBank(c,th,t){
  c.fillStyle='#2f5a6a';c.fillRect(th.x,th.y,th.w,th.h);                       // sky / air
  const wl=th.y+50;
  const wg=c.createLinearGradient(0,wl,0,th.y+th.h);wg.addColorStop(0,'#2a6a7e');wg.addColorStop(1,'#1b4a5c');c.fillStyle=wg;c.fillRect(th.x,wl,th.w,th.h);
  // the bank (land) with a slope into the water
  const B=[[th.x,th.y+30],[th.x+70,th.y+30],[th.x+96,th.y+60],[th.x+112,th.y+86],[th.x+128,th.y+th.h],[th.x,th.y+th.h]];
  c.beginPath();B.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle='#6b5134';c.fill();
  K.sline(c,[[th.x,th.y+30],[th.x+70,th.y+30]],'#4f8a3c',6);
  // burrow holes
  [[84,52,9,6],[100,74,10,6],[112,96,9,6],[60,70,8,5]].forEach(([x,y,a,b])=>K.ellipse(c,th.x+x,th.y+y,a,b,'#2b1f14',null));
  // crumbs falling into the water, a cloudy plume
  for(let i=0;i<5;i++){const q=mod(t*.45+i/5),x=th.x+96+i*6+q*18,y=th.y+56+i*8+q*42;circle(c,x,y,3,rgba('#a08060',1-q),null);}
  const pq=mod(t*.25);K.ellipse(c,th.x+142,th.y+92,18+pq*16,7+pq*4,rgba('#a08060',.35*(1-pq)),null);
  // loosened face: orange dashed outline
  c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*10;c.beginPath();c.moveTo(th.x+62,th.y+34);c.lineTo(th.x+76,th.y+30);c.lineTo(th.x+100,th.y+60);c.lineTo(th.x+116,th.y+86);c.lineTo(th.x+130,th.y+th.h-2);c.lineTo(th.x+50,th.y+th.h-2);c.closePath();
  c.strokeStyle=ORANGE;c.lineWidth=3;c.stroke();c.restore();}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['k0',T.kind[0]],['k1',T.kind[1]],['k2',T.kind[2]],['k3',T.kind[3]]];
  if(k===1)return[['fade',T.legFade],['ring',T.legRing]];
  if(k===2)return[['plus',T.legPlus],['band',T.legBand]];
  if(k===3)return[['dot',T.legDot],['range',T.legRange]];
  return[['eat',T.legEat]];}
function legIcon(c,kind,x,y,t){
  if(kind[0]==='k'){const j=+kind[1],w=[34,38,42,18][j];pic(c,FILE[j],x+20,y+14,w,{rot:0});}
  else if(kind==='fade'){const w=.5+.5*Math.sin(t*1.2);pic(c,FROG,x+20,y+14-w*6,32,{a:1-.75*w});}
  else if(kind==='ring'){const q=mod(t*.7);circle(c,x+20,y+14,13,null,GREEN,3);circle(c,x+20,y+14,13+q*8,null,rgba(GREEN,.8*(1-q)),2);}
  else if(kind==='plus'){circle(c,x+20,y+14,13,null,GREEN,3);plus(c,x+20,y+14,7,GREEN,3);}
  else if(kind==='band'){c.beginPath();c.moveTo(x+2,y+3);c.lineTo(x+38,y+3);c.lineTo(x+32,y+25);c.lineTo(x+8,y+25);c.closePath();c.fillStyle=rgba(GREEN,.12);c.fill();c.strokeStyle=GREEN;c.lineWidth=3+Math.sin(t*2.4);c.stroke();}
  else if(kind==='dot'){for(let i=0;i<4;i++){const q=mod(t*.4+i/4);circle(c,x+8+q*28,y+14+(i%2?-1:1)*q*6,4,rgba(GREEN,1-q*q),null);}}
  else if(kind==='range'){c.save();c.setLineDash([7,5]);c.lineDashOffset=-t*12;K.ellipse(c,x+20,y+14,18,10,null,GREEN,3);c.restore();}
  else{K.arrow(c,x+38,y+14,x+4,y+14,ORANGE,4);}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const Rc=CARD,ix=Rc.x+16,iw=Rc.w-32;
  D.round(c,Rc.x,Rc.y,Rc.w,Rc.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,Rc.y+14,{maxW:iw,stroke:ORANGE});push(rects,1,'tab',hr);
  let y=Rc.y+14+hr.h+12;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=10;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+19,rows=blines(c,p,iw-42),hh=Math.max(38,38+(rows.length-1)*LH);
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,2,ORANGE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=14;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=legend(k),lhs=legs.map(([,p])=>k===0?Math.max(30,blines(c,p,iw-50).length*26+4):Math.max(44,blines(c,p,iw-50).length*28+10));
  const ly=Rc.y+Rc.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  // step 5: the dashed management note sits in the card, under the title
  const oa=k===4?clamp((tau-3.4)/.6):(moving&&st.from===4?1-u:0);
  withA(c,oa,()=>{const b=box(c,T.manage,ix+iw/2,ty+hh-16,{maxW:iw+8,al:'center',stroke:WHITE,dash:[8,6],t});push(rects,oa,'manage',b);s_dbg.manageBottom=b.y+b.h;});
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+(k===0?1:4),t);
    const h=k===0?bwrap(c,p,ix+50,yy+22,iw-50,22,WHITE,26):bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);push(rects,la,'leg'+q,{x:ix+50,y:yy+4,w:iw-50,h:h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.stages=draw;
window.EnvironmentDraw.stages.dbg=s_dbg;
})();

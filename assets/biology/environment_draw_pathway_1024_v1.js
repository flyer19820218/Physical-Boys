/* Unit 11 lesson 2 · "pathway" canvas (resource-use-and-introduction tab, view 1), 2026-10-25. How nonnative species arrive (plan section 3).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (the active route's orange dashes march,
 * the water ripples, settled animals breathe, the released-fish ripples keep spreading in step 4).
 * Layout as harvest / fragment: left = scene window WIN (x 16..636, y 16..428) + statement box(es) under it; right = step card (x 652..944).
 * Scene (window-local px): "Original place" strip on the left (x 0..92), four routes in the middle (rows RY, lane x 96..246, numbered
 * badges), "New place" on the right (x 250..620: land, water for x >= 330 below y 222). Each step lights its route; a carrier with the
 * animal(s) leaves the original place, travels the route and unloads; the animals stay in the new place with a name plate.
 *  0 hitchhiking: a cargo crate with a potted plant; the tree frog (TH5) sits on the potting soil, then hops out.
 *  1 pets and display: a pet carrier box with the red-eared slider and green iguana (TH5); both walk out (abandoned).
 *  2 farming / food use: a tub with the crayfish (TH5) is emptied into a farm pond; the crayfish crawls out into the new waters.
 *  3 release: a bucket with two generic fish (drawn, no species) is poured into the water beside two local fish; one released fish
 *    slowly fades and sinks ("may not do well"), orange ripples spread to the local fish ("may affect local life").
 * Colours (plan 1.4): pressure / carried by people (routes, ripples) orange #fb923c; everything else neutral. Natural spread is NOT
 * drawn here; if a later animation (shift) shows it, it must use another colour (plan: two different processes).
 * No numbers, no species lists beyond the plan's four TH5 examples; "nonnative" is origin only, not harm (dashed note in step 4).
 * Pictures: environment_ai_1024/TH5_spot_legged_treefrog.png (485x381), TH5_red_eared_slider.png (739x388), TH5_green_iguana.png
 * (1189x528): tight transparent crops (alpha>10 box = whole picture), all face left, drawn mirrored (facing the direction of travel);
 * TH5_crayfish.png (422x766): top view, head up, drawn rotated 90° (head to the right).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,ORANGE=K.COL.pressure,INK=C.ink;
const WATER='#7cc4e4';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const FROG=ENV+'TH5_spot_legged_treefrog.png',TURTLE=ENV+'TH5_red_eared_slider.png',IGUANA=ENV+'TH5_green_iguana.png',CRAY=ENV+'TH5_crayfish.png';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('外來種怎麼到的','How nonnative species arrive'),
 short:[P('搭便車','Hitchhiking'),P('寵物與觀賞','Pets and display'),P('養殖逃逸','Farm escape'),P('放生不等於救牠','Release is not rescue')],
 names:[P('路徑一：搭便車','Route 1: hitchhiking'),P('路徑二：寵物與觀賞','Route 2: pets and display'),P('路徑三：養殖或食用用途的逃逸或釋放','Route 3: escape or release from farming or food use'),P('路徑四：放生','Route 4: release')],
 orig:P('原本的地方','Original place'),
 newp:P('新的地方','New place'),
 frog:P('斑腿樹蛙','Spot-legged tree frog'),
 turtle:P('巴西龜','Red-eared slider'),
 iguana:P('綠鬣蜥','Green iguana'),
 cray:P('美國螯蝦','Red swamp crayfish'),
 pond:P('養殖池','Farm pond'),
 rel:P('被放生的魚','Released fish'),
 loc:P('本地的魚','Local fish'),
 st0:P('搭便車：隨運輸、貨物或盆栽土移動','Hitchhiking: moving with transport, cargo or potting soil'),
 st1:P('買來又不想養：棄養，進到原本沒有的地方','Bought, then unwanted: abandoned where they did not occur'),
 st2:P('逃出或被放出，進入新的水域','Escaped or released into new waters'),
 st3:P('放到不適合的環境：可能活不好，也可能影響本地生物','In an unsuitable place it may not do well, and may affect local life'),
 st3b:P('放生不等於救牠：不棄養、不放生','Releasing is not rescuing: do not abandon or release'),
 origin:P('「外來」只是來源，不等於有害','"Nonnative" means origin, not harm'),
 note:P('路徑與大小都是示意','Routes and sizes are schematic'),
 legRoute:P('橘色虛線：人帶著移動','Orange dashes: carried by people'),
 legNum:P('數字：第幾條路徑','Number: which route'),
 legDim:P('淡橘色：前面的路徑','Pale orange: earlier routes'),
 legWeak:P('變淡的魚：可能活不好','Fading fish: may not do well'),
 legRipple:P('橘色波紋：可能影響本地生物','Orange ripples: may affect local life')
};

// ── geometry (window-local px) ───────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412};
const CARD={x:652,y:16,w:292,h:550};
const ORW=92,RX=250,WX=330,WY=222;                    // original strip width, new place left edge, water box
const RY=[100,186,272,358];                            // row baselines (lane line, carrier floor)
const LX0=96,LX1=246,BX=112;                           // lane ends, badge x
const START=48,PARK=[284,284,296,288];                 // carrier start / park x
const POND={x:262,y:RY[2]-34,w:68,h:34};
// animals: route, picture, final centre, width (picture width; crayfish is rotated), carried offset (dx, dy from carrier floor), carried width
const ANI=[
 {id:'frog',j:0,file:FROG,fx:400,fy:RY[0]-20,w:64,cx:4,cy:-50,cw:30,name:T.frog,pl:'c'},
 {id:'turtle',j:1,file:TURTLE,fx:340,fy:RY[1]-20,w:84,cx:-12,cy:-14,cw:30,name:T.turtle,pl:'l'},
 {id:'iguana',j:1,file:IGUANA,fx:548,fy:RY[1]-22,w:108,cx:10,cy:-28,cw:38,name:T.iguana,pl:'r'},
 {id:'cray',j:2,file:CRAY,fx:500,fy:RY[2]-20,w:42,cx:0,cy:-26,cw:16,name:T.cray,rot:Math.PI/2,pl:'r'}];
const REL=[[372,RY[3]-22],[446,RY[3]-12]],LOC=[[528,RY[3]-26],[590,RY[3]-14]];

// ── helpers (as in harvest) ──────────────────────────────────────────────
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
function tag(c,p,x,y,{al='left',col=WHITE,size=22}={}){
  const w=tagW(c,p,size),h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,FILL,rgba(col,.95));text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
// compact name plate under an animal: 22px text, 32px tall
const plateW=(c,p)=>measure(c,p,22)+14;
function plate(c,p,x,y,{al='center',col=WHITE}={}){const w=plateW(c,p),h=32,bx=al==='right'?x-w:al==='left'?x:x-w/2;
  D.round(c,bx,y,w,h,10,FILL,rgba(col,.75));text(c,p,bx+w/2,y+24,22,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const G=(x,y)=>[WIN.x+x,WIN.y+y];

// ── pieces ───────────────────────────────────────────────────────────────
// picture centred at canvas (x, y), width w (before rotation), mirrored when flip
function pic(c,file,x,y,w,{flip=false,rot=0,a=1}={}){const [W,H]=K.SIZE[file],h=w*H/W;
  withA(c,a,()=>{c.save();c.translate(x,y);if(rot)c.rotate(rot);K.drawIn(c,file,{x:-w/2,y:-h/2,w,h},{flip});c.restore();});}
// generic fish (drawn, no species), facing right when dir>0
function fishShape(c,x,y,len,body,edge,dir=1,a=1,tilt=0,t=0){withA(c,a,()=>{c.save();c.translate(x,y);c.rotate(tilt);c.scale(dir,1);
  const wag=Math.sin(t*6)*.12;
  c.beginPath();c.moveTo(-len*.42,0);c.lineTo(-len*.62,-len*.2+wag*len);c.lineTo(-len*.62,len*.2+wag*len);c.closePath();c.fillStyle=body;c.fill();c.strokeStyle=edge;c.lineWidth=2;c.stroke();
  K.ellipse(c,0,0,len*.45,len*.2,body,edge,2);
  circle(c,len*.27,-len*.04,2.4,INK,null);c.restore();});}
// carriers: floor at canvas y b, centre x; part 'back' (behind the animal) or 'front'
function crate(c,x,b,part){
  if(part==='back'){
    D.round(c,x-27,b-22,54,22,4,'#6b5134','#a08060');
    K.sline(c,[[x-27,b-11],[x+27,b-11]],'#4f3b25',2);
    // pot and potting soil
    c.beginPath();c.moveTo(x-16,b-44);c.lineTo(x+16,b-44);c.lineTo(x+11,b-22);c.lineTo(x-11,b-22);c.closePath();c.fillStyle='#b5623a';c.fill();c.strokeStyle='#7a3f22';c.lineWidth=2;c.stroke();
    K.ellipse(c,x,b-44,16,4,'#4a3424',null);
    // plant
    K.sline(c,[[x-6,b-45],[x-12,b-70]],'#4f8a3c',3);K.sline(c,[[x-8,b-55],[x-20,b-62]],'#4f8a3c',3);K.sline(c,[[x-10,b-64],[x-2,b-76]],'#4f8a3c',3);
  }}
function petBox(c,x,b,part){
  if(part==='back'){D.round(c,x-32,b-42,64,42,6,'#3b3227',null);}
  else{c.save();c.strokeStyle='rgba(214,200,170,.85)';c.lineWidth=2;for(let i=-20;i<=20;i+=10){c.beginPath();c.moveTo(x+i,b-40);c.lineTo(x+i,b-2);c.stroke();}c.restore();
    D.round(c,x-32,b-42,64,42,6,null,'#d6c8aa');
    c.save();c.beginPath();c.arc(x,b-42,11,Math.PI,0);c.strokeStyle='#d6c8aa';c.lineWidth=4;c.stroke();c.restore();}}
function tub(c,x,b,part){
  if(part==='back'){K.ellipse(c,x,b-24,25,5,'#2d6d80',null);}
  else{c.beginPath();c.moveTo(x-25,b-24);c.lineTo(x+25,b-24);c.lineTo(x+20,b);c.lineTo(x-20,b);c.closePath();c.fillStyle='#7d8a86';c.fill();c.strokeStyle='#b8c4c0';c.lineWidth=2;c.stroke();
    K.ellipse(c,x,b-24,25,5,null,'#b8c4c0',2);}}
function bucket(c,x,b,part){
  if(part==='back'){K.ellipse(c,x,b-32,19,5,'#2d6d80',null);}
  else{c.beginPath();c.moveTo(x-19,b-32);c.lineTo(x+19,b-32);c.lineTo(x+14,b);c.lineTo(x-14,b);c.closePath();c.fillStyle='#5f86a0';c.fill();c.strokeStyle='#a9c3d4';c.lineWidth=2;c.stroke();
    K.ellipse(c,x,b-32,19,5,null,'#a9c3d4',2);
    c.save();c.beginPath();c.arc(x,b-32,18,Math.PI*1.05,Math.PI*1.95);c.strokeStyle='#a9c3d4';c.lineWidth=2;c.stroke();c.restore();}}
const CARRIER=[crate,petBox,tub,bucket];

// ── step timeline ────────────────────────────────────────────────────────
const APPEAR=.3,GO=1.2,TRAVEL=3,UNLOAD=4.4;
const levOf=(j,k)=>j<k?.5:j===k?1:.2;
// carrier of route j at time tau of its own step: x, alpha, rotation (pour)
function carrierAt(j,tau){
  const x=mix(START,PARK[j],smooth((tau-GO)/TRAVEL));
  const a=clamp((tau-APPEAR)/.6)*(1-clamp((tau-(j===2?5.2:5.8))/.8));
  const rot=j===2?.75*smooth((tau-4.3)/.5):j===3?.85*smooth((tau-4.2)/.5):0;
  return{x,a,rot};}
// animal position at time tau of its own step (canvas px)
function aniAt(A,tau){
  const cr=carrierAt(A.j,tau),b=WIN.y+RY[A.j],cx=WIN.x+cr.x+A.cx,cy=b+A.cy,fin=G(A.fx,A.fy);
  const a=clamp((tau-APPEAR)/.6);
  if(A.id==='cray'){
    const pond=G(POND.x+POND.w/2,POND.y+POND.h/2-6);
    const v1=smooth((tau-UNLOAD)/.8),v2=smooth((tau-5.4)/1.6);
    let x=mix(cx,pond[0],v1),y=mix(cy,pond[1],v1)-18*Math.sin(Math.PI*v1),w=mix(A.cw,A.w*.8,v1);
    x=mix(x,fin[0],v2);y=mix(y,fin[1],v2)-8*Math.sin(Math.PI*v2);w=mix(w,A.w,v2);
    return{x,y,w,a,rot:A.rot+(v2>0&&v2<1?Math.sin(tau*14)*.06:0),flip:false};}
  const d=A.id==='iguana'?.25:0,v=smooth((tau-UNLOAD-d)/1.0);
  return{x:mix(cx,fin[0],v),y:mix(cy,fin[1],v)-26*Math.sin(Math.PI*v),w:mix(A.cw,A.w,v),a,rot:0,flip:true};}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.pathSt||(s.pathSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;st.pos={};}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.fromPos=Object.assign({},st.pos);}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.fromPos=Object.assign({},st.pos);}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const lev=j=>moving?mix(levOf(j,st.from),levOf(j,k),u):levOf(j,k);

  // ── scene window ──
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  c.fillStyle='#16332b';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  // original place (left strip)
  c.fillStyle='#3a3a2a';c.fillRect(WIN.x,WIN.y,ORW,WIN.h);
  K.sline(c,[[WIN.x+ORW,WIN.y],[WIN.x+ORW,WIN.y+WIN.h]],rgba(WHITE,.25),2);
  // new place: land, then water with a soft bank
  c.fillStyle='#24432f';c.fillRect(WIN.x+RX,WIN.y,WIN.w-RX,WIN.h);
  K.sline(c,[[WIN.x+RX,WIN.y],[WIN.x+RX,WIN.y+WIN.h]],rgba(WHITE,.25),2);
  c.save();c.beginPath();c.moveTo(WIN.x+WIN.w,WIN.y+WY);
  for(let xx=WIN.w;xx>=WX+30;xx-=10)c.lineTo(WIN.x+xx,WIN.y+WY+Math.sin(xx*.05)*4);
  c.quadraticCurveTo(WIN.x+WX,WIN.y+WY,WIN.x+WX,WIN.y+WY+30);
  for(let yy=WY+30;yy<=WIN.h;yy+=10)c.lineTo(WIN.x+WX+Math.sin(yy*.07)*4,WIN.y+yy);
  c.lineTo(WIN.x+WIN.w,WIN.y+WIN.h);c.closePath();
  const wg=c.createLinearGradient(0,WIN.y+WY,0,WIN.y+WIN.h);wg.addColorStop(0,'#2a6a7e');wg.addColorStop(1,'#1b4a5c');c.fillStyle=wg;c.fill();
  c.strokeStyle=rgba('#a9c3d4',.5);c.lineWidth=2;c.stroke();c.clip();
  for(let i=0;i<6;i++){const yy=WIN.y+WY+20+i*30,off=mod(t*16+i*41,70);c.save();c.setLineDash([22,48]);c.lineDashOffset=-off;K.sline(c,[[WIN.x+WX+8,yy],[WIN.x+WIN.w-6,yy]],rgba(WATER,.22),2);c.restore();}
  c.restore();
  // farm pond (route 3 onwards)
  const pondA=k>=2?(moving&&st.from<2?u:1)*(k===2?clamp((tau-APPEAR)/.6):1):(moving&&st.from>=2?1-u:0);
  withA(c,pondA,()=>{const [px,py]=G(POND.x,POND.y);D.round(c,px,py,POND.w,POND.h,4,'#2d6d80','#9aa59f');
    c.save();c.lineWidth=4;c.strokeStyle='#9aa59f';c.strokeRect(px,py,POND.w,POND.h);c.restore();
    const q=mod(t*.6);K.ellipse(c,px+POND.w/2,py+POND.h/2,8+q*18,2+q*4,null,rgba(WHITE,.5*(1-q)),2);});

  // routes
  for(let j=0;j<4;j++){const Lv=lev(j),[x0,y0]=G(LX0,RY[j]),[x1]=G(LX1,0);
    const wA=(1-clamp((Lv-.2)/.3))*.35,oA=clamp((Lv-.2)/.3)*mix(.5,1,clamp((Lv-.5)/.5)),act=clamp((Lv-.5)/.5);
    withA(c,wA,()=>{K.dashed(c,[[x0+22,y0],[x1-12,y0]],WHITE,3,[8,8],0);K.arrow(c,x1-14,y0,x1,y0,WHITE,3);});
    withA(c,oA,()=>{K.dashed(c,[[x0+22,y0],[x1-14,y0]],ORANGE,mix(4,6,act),[12,9],-t*30*act);
      c.save();c.beginPath();c.moveTo(x1+2,y0);c.lineTo(x1-16,y0-10);c.lineTo(x1-16,y0+10);c.closePath();c.fillStyle=ORANGE;c.fill();c.restore();});
    badge(c,j+1,WIN.x+BX,y0,Lv>.75?2:Lv>.35?1:0,Lv>.35?ORANGE:WHITE);}
  if(!moving&&tau<4)withA(c,1-clamp((tau-3)/1),()=>{const q=mod(t*.8);circle(c,WIN.x+BX,WIN.y+RY[k],17+q*14,null,rgba(ORANGE,.9*(1-q)),3);});

  // carrier of the current route (behind its animals)
  const cr=carrierAt(k,tau),cb=WIN.y+RY[k];
  const crA=cr.a*(moving?u:1);
  const pivot=k===2?[WIN.x+cr.x+20,cb]:[WIN.x+cr.x+14,cb];
  const inCarrier=fn=>withA(c,crA,()=>{c.save();if(cr.rot){c.translate(...pivot);c.rotate(cr.rot);c.translate(-pivot[0],-pivot[1]);}fn();c.restore();});
  inCarrier(()=>CARRIER[k](c,WIN.x+cr.x,cb,'back'));

  // animals
  const pos={};
  ANI.forEach((A,i)=>{
    const fin=G(A.fx,A.fy),bob=Math.sin(t*1.3+i*1.7)*1.2,breath=1+.015*Math.sin(t*1.8+i);
    let p;
    if(A.j<k)p={x:fin[0],y:fin[1]+bob,w:A.w*breath,a:1,rot:A.rot||0,flip:!A.rot};
    else if(A.j===k)p=aniAt(A,tau);
    else p={x:fin[0],y:fin[1],w:A.w,a:0,rot:A.rot||0,flip:!A.rot};
    if(moving){const was=A.j<=st.from,fp=st.fromPos&&st.fromPos[A.id];
      if(A.j<k){if(was&&fp){p.x=mix(fp.x,p.x,u);p.y=mix(fp.y,p.y,u);p.w=mix(fp.w,p.w,u);}else p.a*=u;}
      else if(A.j===k)p.a*=u;
      else if(was&&fp){p={...fp,a:fp.a*(1-u)};}}
    pos[A.id]=p;
    if(p.a>0)pic(c,A.file,p.x,p.y,p.w,{flip:p.flip,rot:p.rot,a:p.a});
  });
  st.pos=pos;
  // fish of route 4 (bucket contents, then in the water)
  const fA=k===3?(moving?u:1):(moving&&st.from===3?1-u:0);
  const tf=k===3?tau:9;
  if(fA>0){
    const locA=clamp((tf-APPEAR)/.6);
    LOC.forEach(([lx,ly],i)=>{const sw=Math.sin(t*.7+i*2);fishShape(c,WIN.x+lx+sw*8,WIN.y+ly+Math.sin(t*1.3+i)*2,30,'rgba(242,236,217,.92)','#8fa39a',Math.cos(t*.7+i*2)>0?1:-1,fA*locA,0,t+i);});
    const bcr=carrierAt(3,tf),bb=WIN.y+RY[3];
    REL.forEach(([rx,ry],i)=>{
      const sx=WIN.x+bcr.x-6+i*12,sy=bb-34+i*4,v=smooth((tf-4.5-i*.2)/1.0);
      let x=mix(sx,WIN.x+rx,v),y=mix(sy,WIN.y+ry,v)-30*Math.sin(Math.PI*v),a=clamp((tf-APPEAR)/.6),tilt=0,col='#a9bcc4';
      if(v>=1){x+=Math.sin(t*.9+i)*6;y+=Math.sin(t*1.4+i)*1.5;}
      if(i===1){const w=smooth((tf-6.2)/2.2);y+=w*6;tilt=w*.45;a*=1-.45*w;col=w>.5?'#8d9a9e':col;}
      fishShape(c,x,y,34,col,'#4b5d63',1,fA*a,tilt,v>=1?t*(i===1?.3:1):0);});
    // ripples from the released fish to the local fish
    const rA=fA*clamp((tf-5.8)/.6);
    withA(c,rA,()=>{for(let q=0;q<3;q++){const g=mod(t*.5+q/3);K.ellipse(c,WIN.x+REL[1][0]+10,WIN.y+REL[0][1]+4,16+g*96,6+g*22,null,rgba(ORANGE,.85*(1-g)),3);}});
  }
  // carrier front (grill, rim) over the animals it holds
  inCarrier(()=>CARRIER[k](c,WIN.x+cr.x,cb,'front'));
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  // ── labels on the scene ──
  const ho=tag(c,T.orig,WIN.x+8,WIN.y+8,{col:WHITE});push(rects,1,'orig',ho);
  const hn=tag(c,T.newp,WIN.x+WIN.w-8,WIN.y+8,{al:'right',col:WHITE});push(rects,1,'newp',hn);
  // name plates (after unloading)
  const plA=A=>{const p=pos[A.id];if(!p||p.a<=0)return 0;if(A.j<k)return p.a;if(A.j===k)return p.a*clamp((tau-(A.id==='cray'?6.8:5.6))/.5);return p.a;};
  ANI.forEach(A=>{const a=plA(A);withA(c,a,()=>{const [px,py]=G(A.fx,RY[A.j]+12);
    const w=plateW(c,A.name),cx=Math.max(WIN.x+RX+6+w/2,Math.min(WIN.x+WIN.w-6-w/2,px));
    // two plates in one row: turtle anchored left, iguana / crayfish anchored right (English names are long)
    const r=A.pl==='l'?plate(c,A.name,WIN.x+RX+6,py,{al:'left'}):A.pl==='r'?plate(c,A.name,Math.min(WIN.x+WIN.w-6,cx+w/2),py,{al:'right'}):plate(c,A.name,cx,py);push(rects,a,'pl_'+A.id,r);});});
  withA(c,pondA,()=>{const [px,py]=G(POND.x+POND.w/2,RY[2]+12);const pw=plateW(c,T.pond),lim=WIN.x+WIN.w-6-plateW(c,T.cray)-6-pw/2;const r=plate(c,T.pond,Math.min(lim,Math.max(WIN.x+RX+6+pw/2,px)),py);push(rects,pondA,'pl_pond',r);});
  if(fA>0){const py=WIN.y+RY[3]+12,lw=plateW(c,T.loc),lx=WIN.x+WIN.w-8;
    const la=fA*clamp((tf-APPEAR-.4)/.6),ra=fA*clamp((tf-5.6)/.5);
    withA(c,la,()=>{const r=plate(c,T.loc,lx,py,{al:'right'});push(rects,la,'pl_loc',r);});
    withA(c,ra,()=>{const rw=plateW(c,T.rel),cx=Math.min(lx-lw-8-rw/2,WIN.x+(REL[0][0]+REL[1][0])/2);const r=plate(c,T.rel,cx,py);push(rects,ra,'pl_rel',r);});}

  // ── statement(s) under the window ──
  const SAY=[T.st0,T.st1,T.st2,T.st3],SY=WIN.y+WIN.h+12;
  const sd=[.6,.6,.6,5.8][k],sa=clamp((tau-Math.max(sd,moving?MOVE*.6:0))/.5);
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>{const q=box(c,SAY[st.from],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:st.from===3?ORANGE:WHITE});
    if(st.from===3)box(c,T.st3b,WIN.x+WIN.w/2,q.y+q.h+10,{maxW:620,al:'center',stroke:ORANGE,col:ORANGE});});
  withA(c,sa,()=>{const q=box(c,SAY[k],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:k===3?ORANGE:WHITE});push(rects,sa,'say',q);
    if(k===3){const ba=clamp((tau-7)/.6);withA(c,ba,()=>{const b=box(c,T.st3b,WIN.x+WIN.w/2,q.y+q.h+10,{maxW:620,al:'center',stroke:ORANGE,col:ORANGE});push(rects,ba,'say2',b);s_dbg.sayBottom=b.y+b.h;if(tau>7.4&&tau<12)ring(c,b,t,ORANGE);});}});

  // ── step card ──
  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  text(c,T.note,16,592,22,MUTED,'left');push(rects,1,'note',{x:16,y:574,w:measure(c,T.note,22),h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  text(c,ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['route',T.legRoute],['num',T.legNum]];
  if(k===3)return[['weak',T.legWeak],['ripple',T.legRipple]];
  return[['route',T.legRoute],['dim',T.legDim]];}
function legIcon(c,kind,x,y,t){
  if(kind==='route'){K.dashed(c,[[x+2,y+14],[x+28,y+14]],ORANGE,5,[9,6],-t*30);c.save();c.beginPath();c.moveTo(x+40,y+14);c.lineTo(x+26,y+5);c.lineTo(x+26,y+23);c.closePath();c.fillStyle=ORANGE;c.fill();c.restore();}
  else if(kind==='dim'){withA(c,.5,()=>{K.dashed(c,[[x+2,y+14],[x+28,y+14]],ORANGE,4,[9,6],0);c.save();c.beginPath();c.moveTo(x+40,y+14);c.lineTo(x+26,y+5);c.lineTo(x+26,y+23);c.closePath();c.fillStyle=ORANGE;c.fill();c.restore();});}
  else if(kind==='num')badge(c,1,x+20,y+14,2,ORANGE);
  else if(kind==='weak'){const w=.5+.5*Math.sin(t*1.2);fishShape(c,x+20,y+10+w*6,32,'#8d9a9e','#4b5d63',1,1-.5*w,w*.4,0);}
  else{for(let q=0;q<2;q++){const g=mod(t*.5+q/2);K.ellipse(c,x+20,y+14,4+g*16,2+g*9,null,rgba(ORANGE,.9*(1-g)),3);}}}
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
  // step 4: the dashed origin note sits in the card, under the title
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(44,blines(c,p,iw-50).length*28+10));
  const ly=Rc.y+Rc.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const oa=k===3?clamp((tau-7.6)/.6):(moving&&st.from===3?1-u:0);
  withA(c,oa,()=>{const b=box(c,T.origin,ix+iw/2,ty+hh-16,{maxW:iw+8,al:'center',stroke:WHITE,dash:[8,6],t});push(rects,oa,'origin',b);s_dbg.originBottom=b.y+b.h;});
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+4,t);
    const h=bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);push(rects,la,'leg'+q,{x:ix+50,y:yy+4,w:iw-50,h:h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.pathway=draw;
window.EnvironmentDraw.pathway.dbg=s_dbg;
})();

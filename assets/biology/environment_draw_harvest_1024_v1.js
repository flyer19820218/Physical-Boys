/* Unit 11 lesson 2 · "harvest" canvas (resource-use-and-introduction tab, view 0), 2026-10-25. Taking more than is replaced (plan section 3).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (the tap stream flows, the drain drips,
 * fish swim, the surface ripples, the ladle keeps scooping in steps 2 and 3, the tap ring pulses in step 4).
 * Layout as fragment / edge: left = scene window WIN (x 16..636, y 16..428) + one statement box (and one dashed note) under it;
 * right = step card (x 652..944).
 * Scene (window-local px): a tank (inner x 210..470, y 120..360). Water level = population size (green surface line, green name
 * on the left). A tap above the tank = replenishment (births and growth into the population); a drain under it = natural loss;
 * an orange ladle on the right = taken by people, emptied into a crate. Fish (TH4 adults and juveniles) swim in the water;
 * fish that no longer fit under the surface fade out, so fewer fish show as the level falls.
 *  0 no harvest: tap ≈ drain, the level holds.
 *  1 a small ladle scoops now and then; the level still holds. Dashed note "Schematic, not a safe proportion".
 *  2 a big ladle scoops often; the level keeps falling (white dashed line = the earlier level, orange arrow down).
 *  3 the ladle takes one adult (TH4 adult in the ladle); then the tap narrows (valve turns, orange ring, "Less replenishment")
 *    and the level starts to sink. Legend shows the two ladles (adults that breed / juveniles not yet breeding).
 *    Dashed note: harvesting can also affect non-target organisms and habitat.
 * Colours (plan 1.4): population (level) green #4ade80; pressure (ladle, taken by people, less replenishment) orange #fb923c;
 * natural in/out white; uncertain / caution note white dashed. No catch numbers, no species status, no dates; no blame.
 * Pictures: environment_ai_1024/TH4_bluefin_adult.png (530x215), TH4_bluefin_juvenile.png (393x159): tight transparent crops
 * (alpha>10 box = whole picture), both face left.
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,GREEN=K.COL.count,ORANGE=K.COL.pressure,INK=C.ink;
const WATER='#7cc4e4';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const ADULT=ENV+'TH4_bluefin_adult.png',JUV=ENV+'TH4_bluefin_juvenile.png';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('取走的比補充的多','Taking more than is replaced'),
 short:[P('沒有取走','No harvest'),P('取走得少','A small harvest'),P('取走得多','A large harvest'),P('取走哪些個體','Which individuals')],
 names:[P('進 ≈ 出：水位穩定','In ≈ out: the level holds'),P('取走得少：水位仍穩','A small harvest: the level still holds'),P('取走超過補充：水位一路下降','Harvest exceeds replacement: the level keeps falling'),P('取走成魚或幼魚，影響不同','Taking adults or juveniles differs')],
 tap:P('補充：出生、成長加入','Replenishment: births, growth'),
 drain:P('自然損失','Natural loss'),
 take:P('人類取走','Taken by people'),
 takeAdult:P('取走成魚','Adults taken'),
 level:P('水位＝族群大小','Level = population size'),
 less:P('補充變小','Less replenishment'),
 st0:P('補充和自然損失差不多：水位穩定','Replenishment about equals natural loss: the level holds'),
 st1:P('補充 ≥ 自然損失＋取走：水位仍穩','Replenishment ≥ natural loss + harvest: the level holds'),
 st2:P('取走得多又長期：取走超過補充','Large and long-lasting: harvest exceeds replacement'),
 st3:P('取走的不只是現在的數量，還有未來的補充',`What is lost: today's numbers and future replacement`),
 safe:P('示意，不是安全比例','Schematic, not a safe proportion'),
 side:P('捕撈也可能影響非目標生物與棲地','Harvest can also affect non-target life and habitat'),
 note:P('水槽與魚數都是示意','Tank and fish counts are schematic'),
 legLevel:P('綠線：水位＝族群大小','Green line: level = population size'),
 legInOut:P('水龍頭進、排水孔出','Tap in, drain out'),
 legLadle:P('橘色勺子：人類取走','Orange ladle: taken by people'),
 legOld:P('白虛線：原本的水位','Dashed line: the earlier level'),
 legAdult:P('取走成魚：會繁殖','Taking adults: they breed'),
 legJuv:P('取走幼魚：還沒繁殖','Taking juveniles: not yet breeding')
};

// ── geometry (window-local px) ───────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412};
const CARD={x:652,y:16,w:292,h:550};
const TK={x:210,y:120,w:260,h:240},HMAX=220;          // tank inner box; full water height
const surfY=lev=>TK.y+TK.h-lev*HMAX;
const PIPE=262,SPOUT=[300,86];                          // tap: vertical pipe x, spout opening
const DRAIN=330;                                        // drain pipe x under the tank
const CRATE={x:486,y:290,w:120,h:70};
const LEV0=.68;
// fish in the tank: type, depth (fraction of HMAX from the bottom), home x, swim amplitude, speed, phase
const FISH=[['A',.04,300,40,.35,0],['J',.12,410,26,.5,1.3],['A',.22,370,34,.3,2.1],['J',.30,270,30,.45,.7],
 ['A',.38,330,36,.32,3.4],['J',.44,420,22,.55,2.6],['A',.50,404,14,.28,4.1],['J',.08,250,20,.6,5.2]];
const PICK=6;                                           // the adult taken in step 4 (highest adult)

// ── offscreen-free helpers (as in fragment) ──────────────────────────────
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
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
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
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const G=(x,y)=>[WIN.x+x,WIN.y+y];

// ── pieces ───────────────────────────────────────────────────────────────
// fish picture centred at (x, y) (canvas px), facing left unless flip
function fish(c,file,x,y,w,flip=false,a=1){const [W,H]=K.SIZE[file]||[530,215],h=w*H/W;
  withA(c,a,()=>K.drawIn(c,file,{x:x-w/2,y:y-h/2,w,h},{flip}));return{x:x-w/2,y:y-h/2,w,h};}
// the ladle: bowl centre (x, y) = middle of the rim, bowl width bw, rotation rot; carry = picture in the bowl
function ladle(c,x,y,bw,rot,carry,carryA,wet,a=1,hl=100){withA(c,a,()=>{
  c.save();c.translate(x,y);c.rotate(rot);
  const d=bw*.42,ang=-1.22,hx=bw/2-4+hl*Math.cos(ang),hy=-2+hl*Math.sin(ang),lw=hl<60?4:7;
  // handle (pressure colour)
  K.sline(c,[[bw/2-4,-2],[hx,hy]],'#7a4a22',lw+4);
  K.sline(c,[[bw/2-4,-2],[hx,hy]],ORANGE,lw);
  // bowl
  c.beginPath();c.moveTo(-bw/2,0);c.ellipse(0,0,bw/2,d,0,0,Math.PI);c.closePath();
  const g=c.createLinearGradient(0,0,0,d);g.addColorStop(0,'#d9dfdb');g.addColorStop(1,'#8f9a94');c.fillStyle=g;c.fill();
  c.lineWidth=hl<60?3:4;c.strokeStyle=ORANGE;c.stroke();
  if(wet>0){withA(c,wet,()=>{c.beginPath();c.ellipse(0,1,bw/2-4,6,0,0,Math.PI*2);c.fillStyle=rgba(WATER,.85);c.fill();});}
  if(carry&&carryA>0){const w=carry===ADULT?bw*.9:bw*.7;fish(c,carry,0,-w*.12,w,false,carryA);}
  c.restore();});}
function crate(c,t){const x=WIN.x+CRATE.x,y=WIN.y+CRATE.y,w=CRATE.w,h=CRATE.h;
  D.round(c,x,y,w,h,6,'#4b3d2c','#8a7a63');
  for(let i=1;i<3;i++)K.sline(c,[[x+4,y+h*i/3],[x+w-4,y+h*i/3]],'#6b5d4a',2);
  K.sline(c,[[x-4,y+2],[x+w+4,y+2]],'#8a7a63',5);}
function valve(c,x,y,rot,col){c.save();c.translate(x,y);c.rotate(rot);
  circle(c,0,0,15,null,col,4);K.sline(c,[[-15,0],[15,0]],col,4);K.sline(c,[[0,-15],[0,15]],col,4);c.restore();circle(c,x,y,4,col,null);}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function target(k,tau){
  const lev=k<=1?LEV0:k===2?Math.max(.28,LEV0-.06*Math.max(0,tau-.8)):(tau<4.4?LEV0:Math.max(.54,LEV0-.025*(tau-4.4)));
  const inR=k<3?.62:mix(.62,.2,smooth((tau-3.6)/1.2));
  return{lev,inR,lad:k===0?0:1,bw:k===1?58:k===2?92:80};}
// ladle path (canvas px) for cycle fraction f; dipY = bowl depth at the surface
function pose(f,dipY){
  const REST=[528,236,0],OVER=[520,72,0],UP=[420,72,0],DIP=[420,dipY,0],POUR=[546,262,-.75];
  const KF=[[0,REST],[.12,OVER],[.24,UP],[.34,DIP],[.44,UP],[.56,OVER],[.68,POUR],[.82,REST],[1,REST]];
  let i=0;while(i<KF.length-2&&f>KF[i+1][0])i++;
  const [f0,a]=KF[i],[f1,b]=KF[i+1],u=smooth((f-f0)/(f1-f0));
  return{x:WIN.x+mix(a[0],b[0],u),y:WIN.y+mix(a[1],b[1],u),rot:mix(a[2],b[2],u),
   carry:clamp((f-.36)/.05)*(1-clamp((f-.66)/.05)),wet:clamp((f-.33)/.04)*(1-clamp((f-.62)/.06)),dip:f>.28&&f<.42?1-Math.abs(f-.35)/.07:0};}
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.harvSt||(s.harvSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;st.cur=null;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.fromP=st.cur;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.fromP=st.cur;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  let p=target(k,tau);
  if(moving&&st.fromP)p={lev:mix(st.fromP.lev,p.lev,u),inR:mix(st.fromP.inR,p.inR,u),lad:mix(st.fromP.lad,p.lad,u),bw:mix(st.fromP.bw,p.bw,u)};
  else if(st.fromP&&st.from<0&&tau<MOVE){const v=smooth(x);p={lev:mix(st.fromP.lev,p.lev,v),inR:mix(st.fromP.inR,p.inR,v),lad:mix(st.fromP.lad,p.lad,v),bw:mix(st.fromP.bw,p.bw,v)};}
  st.cur=p;s_dbg.p=p;
  const sy=surfY(p.lev);

  // ── scene window ──
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  c.fillStyle='#16332b';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  // floor
  c.fillStyle='rgba(11,26,21,.35)';c.fillRect(WIN.x,WIN.y+TK.y+TK.h+4,WIN.w,WIN.h);

  // ladle state
  const period=k===1?5:k===2?2.6:3.6;
  let f,cyc=0;
  if(k===3)f=clamp((tau-.6)/period);
  else if(k===0)f=0;
  else{const q=Math.max(0,tau-.5)/period;cyc=Math.floor(q);f=q-cyc;}
  const dipY=Math.min(sy+6,TK.y+TK.h-p.bw*.42-4);
  const L0=pose(f,dipY);
  const carry=k===3?ADULT:(cyc%2?ADULT:JUV);

  // tank back
  const tx=WIN.x+TK.x,ty=WIN.y+TK.y;
  D.round(c,tx-6,ty-6,TK.w+12,TK.h+12,10,'#10303a',null);
  // sand
  c.fillStyle='rgba(217,201,160,.28)';c.fillRect(tx,ty+TK.h-10,TK.w,10);
  // fish (clipped to the water)
  const wy=WIN.y+sy,whp=(TK.y+TK.h-sy);
  c.save();c.beginPath();c.rect(tx,wy,TK.w,whp);c.clip();
  const fishInfo=[];
  FISH.forEach(([ty2,d,hx,amp,sp,ph],i)=>{
    const isA=ty2==='A',file=isA?ADULT:JUV,w=isA?86:58,[W,H]=K.SIZE[file],h=w*H/W;
    const depth=d*HMAX,room=whp-depth-h/2-6,a0=clamp(room/16);
    let a=a0;
    if(i===PICK&&k===3)a*=1-clamp((f-.34)/.04);
    if(i===PICK&&moving&&st.from===3&&k!==3)a*=u;
    const ph2=t*sp+ph,fx=WIN.x+hx+Math.sin(ph2)*amp,fy=WIN.y+TK.y+TK.h-10-depth-h/2+Math.sin(ph2*1.7)*2,flip=Math.cos(ph2)>0;
    if(a>0)fish(c,file,fx,fy,w,flip,a);fishInfo.push(+a.toFixed(2));});
  c.restore();
  s_dbg.fish=fishInfo;
  // water
  const wg=c.createLinearGradient(0,wy,0,ty+TK.h);wg.addColorStop(0,'rgba(42,127,166,.42)');wg.addColorStop(1,'rgba(23,80,111,.62)');
  c.fillStyle=wg;c.fillRect(tx,wy,TK.w,whp);
  // light ripples in the water (moving)
  for(let i=0;i<4;i++){const yy=wy+14+i*((whp-24)/4),off=mod(t*18+i*37,60);if(yy<ty+TK.h-12){c.save();c.setLineDash([18,42]);c.lineDashOffset=-off;K.sline(c,[[tx+8,yy],[tx+TK.w-8,yy]],rgba(WATER,.22),2);c.restore();}}
  // inflow stream
  const sw=4+22*p.inR,sx0=WIN.x+SPOUT[0],sy0=WIN.y+SPOUT[1];
  c.fillStyle=rgba(WATER,.75);c.fillRect(sx0-sw/2,sy0,sw,wy-sy0);
  c.save();c.beginPath();c.rect(sx0-sw/2,sy0,sw,wy-sy0);c.clip();
  for(let yy=sy0-40+mod(t*120,40);yy<wy;yy+=40){c.fillStyle=rgba(WHITE,.55);c.fillRect(sx0-sw/2+2,yy,Math.max(2,sw-4),12);}
  c.restore();
  // splash ripples at the inflow
  for(let i=0;i<2;i++){const q=mod(t*1.2+i/2);K.ellipse(c,sx0,wy,8+q*(26+sw),3+q*5,null,rgba(WHITE,.6*(1-q)),2);}
  // surface wave = population level (green)
  c.save();c.shadowColor=rgba(GREEN,.8);c.shadowBlur=8;c.beginPath();
  for(let xx=0;xx<=TK.w;xx+=6){const yy=wy+Math.sin(xx*.06+t*2.2)*1.6;xx?c.lineTo(tx+xx,yy):c.moveTo(tx+xx,yy);}
  c.strokeStyle=GREEN;c.lineWidth=4;c.stroke();c.restore();
  // ladle dip ripples
  if(L0.dip>0)for(let i=0;i<2;i++){const q=mod(t*1.6+i/2);K.ellipse(c,L0.x,wy,20+q*40,3+q*6,null,rgba(WHITE,.7*L0.dip*(1-q)),2);}
  // step 3: the earlier level and the fall
  const oldA=k===2?clamp((tau-1.6)/.5)*(moving?u:1):(moving&&st.from===2?1-u:0);
  withA(c,oldA,()=>{const oy=WIN.y+surfY(LEV0);K.dashed(c,[[tx+4,oy],[tx+TK.w-4,oy]],rgba(WHITE,.9),3,[10,8],-t*10);
    if(wy-oy>34){const ax=tx+34;K.arrow(c,ax,oy+6,ax,wy-6,ORANGE,5);}});
  // glass
  c.save();c.lineWidth=4;c.strokeStyle=rgba(WHITE,.7);c.beginPath();c.moveTo(tx-4,ty-10);c.lineTo(tx-4,ty+TK.h+4);c.lineTo(tx+TK.w+4,ty+TK.h+4);c.lineTo(tx+TK.w+4,ty-10);c.stroke();c.restore();
  K.sline(c,[[tx+6,ty+10],[tx+6,ty+TK.h-20]],rgba(WHITE,.18),3);
  // level pointer on the left wall
  c.save();c.fillStyle=GREEN;c.beginPath();c.moveTo(tx-8,wy);c.lineTo(tx-22,wy-9);c.lineTo(tx-22,wy+9);c.closePath();c.fill();c.restore();

  // drain under the tank, dripping (natural loss)
  const dx=WIN.x+DRAIN,dy=ty+TK.h+4;
  D.round(c,dx-16,dy-3,32,8,3,'#5d6b66',null);
  K.sline(c,[[dx,dy+4],[dx,dy+24]],'#6f7d77',12);
  for(let i=0;i<3;i++){const q=mod(t*1.1+i/3),yy=dy+26+q*(WIN.y+WIN.h-dy-26);circle(c,dx,yy,4,rgba(WATER,.9*(1-q*.5)),null);}
  // tap: pipe from the top, valve, spout
  const px=WIN.x+PIPE,py=WIN.y;
  K.sline(c,[[px,py-4],[px,py+66],[sx0,py+66],[sx0,sy0-2]],'#5d6b66',16);
  K.sline(c,[[px,py-4],[px,py+66],[sx0,py+66],[sx0,sy0-2]],'#7f8f88',8);
  const vr=k===3?-1.6*smooth((tau-3.6)/1.2):0,vrot=moving&&st.from===3?mix(-1.6,0,u):vr;
  valve(c,px,py+30,vrot,WHITE);
  // crate
  crate(c,t);
  // ladle (in front of everything in the tank)
  ladle(c,L0.x,L0.y,p.bw,L0.rot,carry,k===0?0:L0.carry,L0.wet,p.lad);
  // step 4: tap narrows → orange ring and name
  const lessA=k===3?clamp((tau-3.8)/.5):(moving&&st.from===3?1-u:0);
  withA(c,lessA,()=>{for(let i=0;i<2;i++){const q=mod(t*.8+i/2);circle(c,px,py+30,18+q*26,null,rgba(ORANGE,.9*(1-q)),3);}});
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  // ── labels on the scene ──
  // tap name, top left, with a leader to the valve
  const tb=box(c,T.tap,WIN.x+10,WIN.y+10,{maxW:220,stroke:WHITE});push(rects,1,'tap',tb);
  K.sline(c,[[tb.x+tb.w,WIN.y+30],[px-20,WIN.y+30]],rgba(WHITE,.7),2);
  // level name, left of the tank at the surface
  const lb=boxGeo(c,T.level,200),lyc=Math.max(WIN.y+tb.h+30+lb.h/2,Math.min(WIN.y+344-lb.h/2,wy));
  const lr=box(c,T.level,tx-26,lyc,{maxW:200,al:'right',stroke:GREEN,col:GREEN,vc:true});push(rects,1,'level',lr);
  if(k===0&&tau<5)ring(c,lr,t,GREEN);
  // drain name
  const dr=tag(c,T.drain,dx-18,WIN.y+WIN.h-44,{al:'right',col:WHITE});push(rects,1,'drain',dr);
  // taken by people (steps 2..4), under the crate
  const ta=p.lad;
  const swap=moving&&((st.from===3)!==(k===3));
  if(swap)withA(c,ta*(1-u),()=>tag(c,st.from===3?T.takeAdult:T.take,WIN.x+WIN.w-8,WIN.y+WIN.h-44,{al:'right',col:ORANGE}));
  withA(c,ta*(swap?u:1),()=>{const r=tag(c,k===3?T.takeAdult:T.take,WIN.x+WIN.w-8,WIN.y+WIN.h-44,{al:'right',col:ORANGE});push(rects,ta,'take',r);
    if((k===1||k===2)&&tau>.4&&tau<3)ring(c,r,t,ORANGE);});
  withA(c,lessA,()=>{const r=tag(c,T.less,WIN.x+PIPE+22,WIN.y+12+tb.h*0,{al:'left',col:ORANGE});push(rects,lessA,'less',r);});

  // ── statement under the window ──
  const SAY=[T.st0,T.st1,T.st2,T.st3],SC=[WHITE,WHITE,ORANGE,ORANGE],sd=[.4,.6,1.6,4.2][k],sa=clamp((tau-Math.max(sd,moving?MOVE*.6:0))/.5);
  const SY=WIN.y+WIN.h+12;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>box(c,SAY[st.from],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[st.from]}));
  withA(c,sa,()=>{const q=box(c,SAY[k],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[k]});push(rects,sa,'say',q);
    if(k===2&&tau>2&&tau<6)ring(c,q,t,ORANGE);
    const extra=k===1?T.safe:k===3?T.side:null;
    if(extra){const ba=clamp((tau-(k===1?2.6:5.6))/.6);withA(c,ba,()=>{const b=box(c,extra,WIN.x+WIN.w/2,q.y+q.h+10,{maxW:620,al:'center',stroke:WHITE,dash:[8,6],t});push(rects,ba,'extra',b);s_dbg.extraBottom=b.y+b.h;});}});

  // ── step card ──
  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  text(c,T.note,16,592,22,MUTED,'left');push(rects,1,'note',{x:16,y:574,w:measure(c,T.note,22),h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  text(c,ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['level',T.legLevel],['inout',T.legInOut]];
  if(k===1)return[['ladle',T.legLadle],['level',T.legLevel]];
  if(k===2)return[['old',T.legOld],['ladle',T.legLadle]];
  return[['ladleA',T.legAdult],['ladleJ',T.legJuv]];}
function legIcon(c,kind,x,y,t,pul){
  if(kind==='level'){K.sline(c,[[x+2,y+14],[x+38,y+14]],GREEN,4);c.save();c.fillStyle=rgba(GREEN,.25+.15*pul);c.fillRect(x+2,y+16,36,12);c.restore();}
  else if(kind==='inout'){c.fillStyle=rgba(WATER,.8);c.fillRect(x+8,y,8,16);circle(c,x+30,y+10+mod(t*1.1)*14,4,rgba(WATER,.9),null);K.sline(c,[[x+2,y+28],[x+38,y+28]],rgba(WHITE,.7),3);}
  else if(kind==='old'){K.dashed(c,[[x+2,y+8],[x+38,y+8]],WHITE,3,[6,5],-t*10);K.arrow(c,x+20,y+10,x+20,y+30,ORANGE,4);}
  else if(kind==='ladle')ladle(c,x+14,y+14,28,0,null,0,0,1,22);
  else if(kind==='ladleA'){ladle(c,x+20,y+18,42,0,ADULT,1,0,1,20);}
  else{ladle(c,x+20,y+18,42,0,JUV,1,0,1,20);}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const Rc=CARD,ix=Rc.x+16,iw=Rc.w-32;
  D.round(c,Rc.x,Rc.y,Rc.w,Rc.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,Rc.y+14,{maxW:iw,stroke:ORANGE});push(rects,1,'tab',hr);
  let y=Rc.y+14+hr.h+12;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=10;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+19,rows=blines(c,p,iw-42),hh=Math.max(38,38+(rows.length-1)*LH);
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=14;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(44,blines(c,p,iw-50).length*28+10));
  const ly=Rc.y+Rc.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{const pul=.5+.5*Math.sin(t*2+q);
    legIcon(c,kind,ix,yy+4,t,pul);
    const h=bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);push(rects,la,'leg'+q,{x:ix+50,y:yy+4,w:iw-50,h:h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.harvest=draw;
window.EnvironmentDraw.harvest.dbg=s_dbg;
})();

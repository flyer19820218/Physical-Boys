/* Unit 11 lesson 2 · "shift" canvas (climate-ecological-change tab, view 0), 2026-10-25. Suitable conditions move uphill (plan section 3, shift).
 * Five steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (mist drifts, bands breathe, dashes march,
 * infrared waves travel, arrows pulse; step 2 re-runs its upward shift every 9 s).
 * Option s.warm = 0 smaller / 1 medium (default) / 2 larger ASSUMED warming = only how far the bands move (no numbers anywhere).
 * The shell has no control for it, so three chips under the window (steps 2-4) set it through D.hit('warm', i); LivingBook.action('warm', i) also works.
 * Layout as magnify: left = panorama window WIN (x 16..536, y 16..416) + rows under it; thermometer column (x 548..640); right = step card (x 652..944).
 * Panorama: ecology_ai_1023/HB14_mountain.jpg (1672x933) drawn at scale 0.5 from picture x 413 (summit at picture (920,72) -> window (270,52)).
 * Skyline measured with PIL (first non-sky pixel per column, SKY below); the vegetation band tints are clipped below it.
 * Band boundaries (picture y 270 / 430 / 620 -> window y 151 / 231 / 326), as in ecology lesson 4 "mountain":
 *   broadleaf (green), mixed forest and mist (teal), fir (blue), low shrubs and grass slopes (light grey); soft-edged translucent tints.
 *  0 recap: bands light up bottom to top; a row of close-up cards HB15..HB18 (frames in the band colours); "Last unit" tag.
 *  1 premise (Earth science): a small inset picture only: surface -> red infrared waves -> greenhouse-gas layer absorbs and re-emits
 *    in all directions (some back down). Dashed "learned in Earth science, taken as a premise". No mechanism beyond that.
 *  2 assumed warming: every boundary moves up by the chosen amount (dashed lines keep the old boundaries, white arrows between);
 *    the warm colour of the thermometer column rises by the same amount; "an assumption, not a forecast".
 *  3 summit: the top band is squeezed between its rising lower boundary and the summit; "No higher ground" at the summit;
 *    panel with the TH12 examples (alpine rhododendron = alpine plant, Formosan salmon = cold-water fish), "examples, no forecast".
 *  4 can they move: a farmland-and-road belt across the middle; purple arrows (moving on their own, natural dispersal) rise from
 *    below and stop at the belt; one orange arc (carried by people, introduction; orange as in pathway) jumps over it from elsewhere.
 *    Dashed: species that move are not all invasive.
 * Colours: natural dispersal purple #c084fc (new, not orange); carried by people orange #fb923c (as pathway); infrared red #f87171;
 * thermometer orange (warmer) to cyan (colder) as in ecology "mountain"; every colour is written together with its name.
 * No temperatures, heights or warming values; no species forecasts. Labels from K.LAB; new labels are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=5,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,ORANGE=K.COL.pressure,INK=C.ink,CYAN=C.cyan;
const PURPLE='#c084fc',RED='#f87171';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('適合的條件往上搬','Suitable conditions move uphill'),
 short:[P('回顧','Recap'),P('前提','Premise'),P('假設升溫','Assumed warming'),P('山頂的難題','The summit problem'),P('能不能搬','Can they move?')],
 names:[P('越高越冷，林相一帶一帶變','Higher is colder; vegetation changes in bands'),P('前提：溫室效應（地科學過）','Premise: the greenhouse effect (Earth science)'),P('假設升溫：各帶往上移','Assumed warming: bands shift upward'),P('山頂沒有更高的地方','The summit has no higher ground'),P('自己移動，和人搬運，是不同的過程','Moving on their own vs carried by people')],
 band:[L('broadleaf','闊葉林','Broadleaf forest'),L('mixed','針闊混合林與霧','Mixed conifer-broadleaf forest and mist'),L('fir','冷杉林','Fir forest'),L('alpine','矮灌叢與草坡','Low shrubs and grass slopes')],
 bandShort:[P('闊葉林','Broadleaf'),P('混合林與霧','Mixed forest, mist'),P('冷杉林','Fir'),P('矮灌叢與草坡','Shrubs and grass')],
 lastUnit:P('上一單元看過','Seen in the last unit'),
 colder:P('較冷','Colder'),warmer:P('較暖','Warmer'),
 premiseHead:P('溫室效應（地科學過）','Greenhouse effect (Earth science)'),
 surface:P('地表','Surface'),ir:P('紅外線','Infrared'),gas:P('溫室氣體','Greenhouse gases'),
 reemit:P('吸收，再向各方向放射','Absorbed, re-emitted every way'),
 noHigher:P('沒有更高的地方','No higher ground'),
 examples:P('最上面那一帶的代表','Examples from the top band'),
 rhodo:P('高山杜鵑','Alpine rhododendron'),rhodoRole:P('高山植物','Alpine plant'),
 salmon:P('櫻花鉤吻鮭','Formosan salmon'),salmonRole:P('冷水魚','Cold-water fish'),
 belt:P('農地與道路','Farmland and roads'),
 own:P('自己移動','Moving on their own'),people:P('人搬運','Carried by people'),
 warmLabel:P('假設升溫','Assumed warming'),warmOpt:[P('較小','Smaller'),P('中','Medium'),P('較大','Larger')],
 st:[null,
  P('地科已學，這裡當作前提','Learned in Earth science; taken as a premise'),
  P('適合的條件往上移，各帶跟著往上','Conditions move up; the bands follow'),
  P('最上面那一帶被擠壓','The top band is squeezed'),
  P('中間有農地與道路擋住','Farmland and roads block the middle')],
 sub:[P('示意：各帶的交界是漸變的','Schematic: the bands blend into each other'),
  null,
  P('這是假設，不是預測','An assumption, not a forecast'),
  P('只是代表，不預測牠們的結果','Examples only; no forecast for them'),
  P('會移動的物種，不都是入侵種','Species that move are not all invasive')],
 note:P('示意：不寫溫度與高度數字','Schematic: no temperature or height values'),
 legBand:P('色帶：林相帶（示意）','Bands: vegetation zones'),
 legNorth:P('上一單元：爬山像往北走','Last unit: uphill is like going north'),
 legWave:P('紅色波浪：紅外線','Red waves: infrared'),
 legGas:P('白點：溫室氣體','White dots: greenhouse gases'),
 legDash:P('虛線：原來的交界','Dashed: old boundary'),
 legBar:P('直條：暖色往上移','Bar: warm colour rises'),
 legEx:P('怕熱的代表','Heat-sensitive examples'),
 legTop:P('到頂了，沒有地方去','Nowhere higher to go'),
 legOwn:P('紫箭頭：自己移動​（自然擴散）','Purple: own movement, natural dispersal'),
 legPeople:P('橘箭頭：人搬運​（外來引入）','Orange: carried by people, introduction')
};

// ── geometry (canvas px) ─────────────────────────────────────────────────
const WIN={x:16,y:16,w:520,h:400};
const CARD={x:652,y:16,w:292,h:550};
const PANO='HB14_mountain.jpg',PS=.5,PX0=413;
const wx=px=>WIN.x+(px-PX0)*PS,wy=py=>WIN.y+py*PS;
// first non-sky pixel per picture column (PIL, HB14_mountain.jpg)
const SKY=[[360,250],[400,236],[440,218],[480,188],[520,176],[560,154],[600,154],[640,156],[680,144],[720,122],[760,104],[800,96],[840,78],[880,76],[920,72],[960,76],[1000,120],[1040,142],[1080,170],[1120,176],[1160,216],[1200,234],[1240,268],[1280,270],[1320,276],[1360,288],[1400,310],[1440,338],[1480,360]].map(([x,y])=>[wx(x),wy(y)]);
const skyAt=x=>{for(let i=1;i<SKY.length;i++)if(x<=SKY[i][0]){const a=SKY[i-1],b=SKY[i];return mix(a[1],b[1],clamp((x-a[0])/(b[0]-a[0])));}return SKY[SKY.length-1][1];};
const SUMMIT=[wx(920),wy(72)];
const BOUND=[wy(620),wy(430),wy(270)];               // broadleaf|mixed, mixed|fir, fir|alpine (window y)
const BCOL=['#4ade80','#2dd4bf','#60a5fa','#e2e8f0'];
const CARDS=['HB15_lowland.jpg','HB16_cloudforest.jpg','HB17_fir.jpg','HB18_alpine.jpg'];
const RHODO=ENV+'TH12_alpine_rhododendron.png',SALMON=ENV+'TH12_formosan_salmon.png',TUNDRA='HB3_tundra.jpg';
const SHIFT=[16,30,46];                              // window px per assumed warming (no physical meaning)
const TH={x:594,top:52,bot:380,w:22};                // thermometer tube (x centre)
const ROWY=428;                                      // first row under the window
const BELT={y:330,h:30};
// mist veils
const MIST=(()=>{const r=K.rng(11),a=[];for(let i=0;i<6;i++)a.push([r()*520,170+r()*190,60+r()*60,.4+r()*.5,r()*6.28]);return a;})();
// greenhouse-gas molecules in the premise panel (panel-local)
const MOL=(()=>{const r=K.rng(3),a=[];for(let i=0;i<13;i++)a.push([30+i*30+(r()-.5)*10,(r()-.5)*24,r()*6.28]);return a;})();

// ── helpers (as in magnify) ──────────────────────────────────────────────
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
function tag(c,p,x,y,{al='left',col=WHITE,size=22,dash=null,t=0,fill=FILL}={}){
  const w=tagW(c,p,size),h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,y,w,h,h/2,fill,rgba(col,.95));if(dash)c.restore();
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
function wave(c,x1,y1,x2,y2,col,t,amp=5,w=3){const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  c.save();c.lineCap='round';c.beginPath();for(let s=0;s<=len-10;s+=2){const o=Math.sin(s*.28-t*7)*amp;const x=x1+ux*s+nx*o,y=y1+uy*s+ny*o;s?c.lineTo(x,y):c.moveTo(x,y);}
  c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();
  const hx=x2,hy=y2,bx=x2-ux*12,by=y2-uy*12;c.beginPath();c.moveTo(hx,hy);c.lineTo(bx+nx*7,by+ny*7);c.lineTo(bx-nx*7,by-ny*7);c.closePath();c.fillStyle=col;c.fill();}
function molecule(c,x,y,t,ph,a=1){withA(c,a,()=>{const r=Math.sin(t*1.6+ph)*.35;const ox=Math.cos(r)*7,oy=Math.sin(r)*7;
  circle(c,x-ox,y-oy,4,'#cbd5e1',rgba(INK,.6),1);circle(c,x+ox,y+oy,4,'#cbd5e1',rgba(INK,.6),1);circle(c,x,y,5.5,WHITE,rgba(INK,.6),1.2);});}
const wOf=s=>{const v=s.warm;return v===0||v===1||v===2?v:1;};

// ── band limits for a given shift d (window y) ───────────────────────────
const bandTop=(i,d)=>i===3?WIN.y:BOUND[i]-d;
const bandBot=(i,d)=>i===0?WIN.y+WIN.h:BOUND[i-1]-d;

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.shiftSt||(s.shiftSt={});
  let first=false;
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;st.lastT=t;first=true;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const again=ck.held&&tau>=PER,q=again?mod(tau,PER):tau;
  const W=wOf(s),dW=SHIFT[W];
  // shift target: 0 in steps 0-1; step 2 ramps (re-runs when held); steps 3-4 full
  let dT=0;
  if(k===2){const fromAbove=st.from>=3&&!again;dT=fromAbove?dW:(again&&q<.7?dW*(1-smooth(q/.7)):dW*smooth((q-1)/2.4));}
  else if(k>=3)dT=dW;
  const dt=clamp(t-(st.lastT??t));st.lastT=t;
  if(first||st.d===undefined)st.d=dT;else st.d+=(dT-st.d)*(1-Math.exp(-dt*5));
  const d=st.d;
  rectsT=tau;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;s_dbg.d=+d.toFixed(2);s_dbg.warm=W;

  // ── panorama window ──
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  c.fillStyle='#16332b';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  K.drawIn(c,PANO,{x:wx(0),y:wy(0),w:1672*PS,h:933*PS});
  c.fillStyle='rgba(11,26,21,.16)';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  bands(c,k,st,moving,u,tau,t,d);
  mist(c,t);
  if(k>=2||(moving&&st.from>=2))ghost(c,(k>=2?(moving&&st.from<2?u:1):1-u)*(k>=3?.5:1),d,t);
  scene(c,k,st,moving,u,q,tau,t,d,rects);
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  thermo(c,k,d,t,rects);
  under(c,k,st,moving,x,u,tau,t,W,rects);
  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  text(c,T.note,16,592,22,MUTED,'left');push(rects,1,'note',{x:16,y:574,w:measure(c,T.note,22),h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  text(c,ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── vegetation band tints (clipped below the skyline) ────────────────────
function skyClip(c){c.beginPath();c.moveTo(WIN.x,WIN.y+WIN.h);c.lineTo(WIN.x,skyAt(WIN.x));SKY.forEach(([x,y])=>c.lineTo(x,y));c.lineTo(WIN.x+WIN.w+40,WIN.y+WIN.h);c.closePath();}
function bandLit(k,i,q){if(k===0)return clamp((q-.6-i*1.5)/.6);return 1;}
function bands(c,k,st,moving,u,tau,t,d){
  c.save();skyClip(c);c.clip();
  for(let i=0;i<4;i++){
    const top=bandTop(i,d),bot=bandBot(i,d);
    let a=.2+.05*Math.sin(t*1.4+i*1.3);
    const lit=k===0?bandLit(0,i,tau):1;
    if(k===0){const act=clamp(1-Math.abs(tau-(1.2+i*1.5))/1.2);a=a*lit+.16*act;}
    if(k===3)a=i===3?.36+.12*Math.sin(t*3):a*.55;
    if(k===1)a*=.6;
    const soft=10,g=c.createLinearGradient(0,top-soft,0,bot+soft),col=BCOL[i],h=bot-top+2*soft;
    g.addColorStop(0,rgba(col,0));g.addColorStop(clamp(2*soft/h),rgba(col,a));g.addColorStop(clamp(1-2*soft/h),rgba(col,a));g.addColorStop(1,rgba(col,0));
    c.fillStyle=g;c.fillRect(WIN.x,top-soft,WIN.w,h);
  }
  c.restore();
}
function mist(c,t){MIST.forEach(([x0,y0,r,sp,ph])=>{const xx=WIN.x+mod(x0+t*sp*8,WIN.w+2*r)-r,yy=y0+Math.sin(t*.3+ph)*6;
  const g=c.createRadialGradient(xx,yy,0,xx,yy,r);g.addColorStop(0,'rgba(242,246,248,.20)');g.addColorStop(1,'rgba(242,246,248,0)');
  c.save();c.translate(xx,yy);c.scale(1.8,.45);c.translate(-xx,-yy);c.fillStyle=g;c.beginPath();c.arc(xx,yy,r,0,Math.PI*2);c.fill();c.restore();});}
// old boundaries (dashed) and arrows to the new ones
function ghost(c,a,d,t){withA(c,a,()=>{
  c.save();skyClip(c);c.clip();
  BOUND.forEach((y,i)=>{K.dashed(c,[[WIN.x,y],[WIN.x+WIN.w,y]],'rgba(11,26,21,.7)',5,[10,8],-t*10);K.dashed(c,[[WIN.x,y],[WIN.x+WIN.w,y]],rgba(WHITE,.9),2.5,[10,8],-t*10);
    if(d>4)[400,470].forEach((xx,j)=>{const pul=.7+.3*Math.sin(t*3+i+j);K.arrow(c,xx,y-1,xx,y-d+2,rgba(WHITE,pul),3);});});
  c.restore();});}

// ── per-step scene contents inside the window ────────────────────────────
function scene(c,k,st,moving,u,q,tau,t,d,rects){
  const one=(kk,a,live)=>{if(a<=0)return;
    if(kk!==1)withA(c,a,()=>bandTags(c,kk,d,t,live?rects:null));
    if(kk===0)withA(c,a,()=>{const r=tag(c,T.lastUnit,WIN.x+10,WIN.y+8);if(live)push(rects,a,'lastUnit',r);});
    if(kk===1)premise(c,a,tau,t,live?rects:null);
    if(kk===3)withA(c,a,()=>summit(c,d,tau,t,live?rects:null));
    if(kk===4)withA(c,a,()=>moveScene(c,d,q,t,live?rects:null));};
  if(moving&&st.from>=0)one(st.from,1-clamp(u*2),false);
  one(k,moving?clamp(u*2-1):1,true);
}
// band names: three lower ones on the left edge, the top one right of the summit (pointer to the band)
function bandTags(c,kk,d,t,rects){
  for(let i=0;i<3;i++){
    if((kk===3&&i<3)||(kk===4&&i<2))continue;       // step 3: the example panel sits there; step 4: belt and arrows
    const top=Math.max(bandTop(i,d),i===2?skyAt(WIN.x+80)+4:0),bot=bandBot(i,d),cy=(top+bot)/2;
    const lit=kk===0?clamp((rectsT-.6-i*1.5)/.6):1;if(lit<=0)continue;
    withA(c,lit,()=>{const r=tag(c,T.bandShort[i],WIN.x+10,cy-20,{col:BCOL[i]});push(rects,lit,'band'+i,r);});
  }
  const lit=kk===0?clamp((rectsT-.6-3*1.5)/.6):1;
  if(lit>0)withA(c,lit,()=>{const p=T.bandShort[3],w=tagW(c,p),x0=WIN.x+WIN.w-10-w,y0=WIN.y+8;
    const pt=[wx(1010),Math.min(wy(150),(skyAt(wx(1010))+BOUND[2]-d)/2+4)];
    K.sline(c,[[x0+20,y0+40],pt],rgba(INK,.7),5);K.sline(c,[[x0+20,y0+40],pt],rgba(BCOL[3],.9),2.5);
    circle(c,pt[0],pt[1],5,BCOL[3],INK,1.5);
    const r=tag(c,p,x0,y0,{col:BCOL[3]});push(rects,lit,'band3',r);});
}
let rectsT=0;    // tau of the current step, used by bandTags in step 0

// step 1: the premise inset (small picture only)
function premise(c,a,tau,t,rects){withA(c,a,()=>{
  const R={x:WIN.x+40,y:WIN.y+30,w:WIN.w-80,h:WIN.h-60};
  c.fillStyle='rgba(11,26,21,.45)';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(18,40,48,.97)',rgba(WHITE,.7));
  const hd=box(c,T.premiseHead,R.x+R.w/2,R.y+12,{al:'center',maxW:R.w-24,stroke:WHITE,dash:[8,6],t});push(rects,1,'premHead',hd);
  // sky gradient + ground
  const gy=R.y+R.h-46;
  D.round(c,R.x+14,gy,R.w-28,34,8,'#5b4a32',null);
  c.save();c.fillStyle='#4f7a3a';c.fillRect(R.x+14,gy,R.w-28,8);c.restore();
  const sf=tag(c,T.surface,R.x+R.w-24,gy-4,{al:'right',col:WHITE});push(rects,1,'surface',sf);
  // gas layer
  const ly=R.y+hd.h+50;
  const g=c.createLinearGradient(0,ly-26,0,ly+26);g.addColorStop(0,'rgba(242,236,217,0)');g.addColorStop(.5,'rgba(242,236,217,.16)');g.addColorStop(1,'rgba(242,236,217,0)');
  c.fillStyle=g;c.fillRect(R.x+14,ly-26,R.w-28,52);
  MOL.forEach(([mx,my,ph],i)=>molecule(c,R.x+mx+Math.sin(t*.7+ph)*3,ly+my,t,ph));
  const gs=tag(c,T.gas,R.x+20,ly+30,{col:WHITE});push(rects,1,'gas',gs);
  // infrared: up from the surface to the layer (always drawn, waves travel), then re-emitted up, down and sideways
  const xs=[R.x+R.w*.69,R.x+R.w*.815,R.x+R.w*.94];
  xs.forEach((xx,i)=>{const y0=gy-6,y1=ly+22;wave(c,xx,y0,xx,y1,rgba(RED,.95),t+i*.3,5,3);
    const v=mod(t*.5+i*.33),L1=26+14*Math.sin(v*Math.PI);
    circle(c,xx,ly,10+8*v,null,rgba(RED,.7*(1-v)),2);
    wave(c,xx-4,ly-8,xx-4-L1*.5,ly-8-L1*.55,rgba(RED,.9),t,4,2.5);
    wave(c,xx-8,ly+4,xx-8-L1*.55,ly+4+L1*.9,rgba(RED,.9),t,4,2.5);});
  const ir=tag(c,T.ir,xs[0]-14,gy-48,{al:'right',col:RED});push(rects,1,'ir',ir);
  const re=box(c,T.reemit,R.x+14,ly+74,{maxW:R.w*.62,stroke:rgba(RED,.8),col:WHITE});push(rects,1,'reemit',re);
  s_dbg.prem={hd:hd.y+hd.h,re:[re.y,re.y+re.h],layer:ly,gas:[gs.y,gs.y+gs.h],ir:[ir.y,ir.y+ir.h],ground:gy};
});}

// step 3: the summit problem
function summit(c,d,tau,t,rects){
  const [sx,sy]=SUMMIT;
  // squeeze: arrows on the rising lower boundary of the top band
  const yb=BOUND[2]-d;
  [wx(700),wx(850),wx(1000)].forEach((xx,i)=>{const pul=mod(t*.8+i*.3);const y0=yb+14-pul*6;
    if(skyAt(xx)<yb-20)K.arrow(c,xx,y0,xx,y0-22,rgba(WHITE,.95),3.5);});
  // summit cap and "?" above
  K.sline(c,[[sx-26,sy-8],[sx+26,sy-8]],rgba(INK,.7),6);K.sline(c,[[sx-26,sy-8],[sx+26,sy-8]],WHITE,3);
  const pu=mod(t*.9);K.arrow(c,sx,sy-10,sx,sy-24-pu*6,rgba(WHITE,.9*(1-pu*.6)),3);
  // tag at the top left with a pointer to the summit
  const r=tag(c,T.noHigher,WIN.x+10,WIN.y+8,{col:WHITE});push(rects,1,'noHigher',r);
  K.dashed(c,[[r.x+r.w,r.y+r.h/2],[sx-30,sy-10]],rgba(WHITE,.9),2.5,[6,5],-t*10);
  if(tau>.8&&tau<4)ring(c,r,t,WHITE);
  // examples panel (lower left)
  const P0={x:WIN.x+10,y:222,w:0,h:0};
  const tw=Math.max(measure(c,T.examples,22),96+Math.max(measure(c,T.rhodo,22),measure(c,T.rhodoRole,22),measure(c,T.salmon,22),measure(c,T.salmonRole,22)));
  P0.w=Math.min(WIN.w-20,tw+28);P0.h=WIN.y+WIN.h-10-P0.y;
  D.round(c,P0.x,P0.y,P0.w,P0.h,12,'rgba(11,26,21,.93)',rgba(BCOL[3],.9));
  text(c,T.examples,P0.x+14,P0.y+30,22,BCOL[3]);push(rects,1,'exHead',{x:P0.x+14,y:P0.y+12,w:measure(c,T.examples,22),h:24});
  const sw=Math.sin(t*1.3)*1.5;
  K.place(c,RHODO,P0.x+12,P0.y+44+sw,72,62);
  K.place(c,SALMON,P0.x+8,P0.y+118-sw,82,44);
  [[T.rhodo,T.rhodoRole,P0.y+44],[T.salmon,T.salmonRole,P0.y+116]].forEach(([n,ro,yy],i)=>{
    text(c,n,P0.x+100,yy+24,22,WHITE);text(c,ro,P0.x+100,yy+52,22,MUTED);
    push(rects,1,'exName'+i,{x:P0.x+100,y:yy+6,w:measure(c,n,22),h:24});push(rects,1,'exRole'+i,{x:P0.x+100,y:yy+34,w:measure(c,ro,22),h:24});});
  // pointer from the panel to the top band
  const pt=[wx(700),Math.max(skyAt(wx(700))+8,(skyAt(wx(700))+yb)/2)];
  K.dashed(c,[[P0.x+P0.w-30,P0.y],pt],rgba(BCOL[3],.9),2.5,[6,5],-t*10);circle(c,pt[0],pt[1],6,BCOL[3],INK,1.5);
  s_dbg.exPanel=[P0.x,P0.y,P0.w,P0.h];
}

// step 4: farmland and roads across the middle; purple (own) vs orange (people) arrows
function moveScene(c,d,q,t,rects){
  const y0=BELT.y,h=BELT.h;
  // farmland patches + road
  c.save();c.beginPath();c.rect(WIN.x,y0,WIN.w,h);c.clip();
  for(let i=0;i<14;i++){const xx=WIN.x+i*40-6;c.fillStyle=['#b9a75a','#8fae5a','#a4b864','#c2b06a'][i%4];c.fillRect(xx,y0,40,h-12);
    c.strokeStyle='rgba(60,50,30,.35)';c.lineWidth=1;for(let j=6;j<40;j+=8){c.beginPath();c.moveTo(xx+j,y0+2);c.lineTo(xx+j-4,y0+h-14);c.stroke();}}
  c.fillStyle='#5d615a';c.fillRect(WIN.x,y0+h-12,WIN.w,12);
  K.dashed(c,[[WIN.x,y0+h-6],[WIN.x+WIN.w,y0+h-6]],rgba(WHITE,.85),2,[12,10],-t*14);
  c.restore();
  K.sline(c,[[WIN.x,y0],[WIN.x+WIN.w,y0]],rgba(INK,.6),2);K.sline(c,[[WIN.x,y0+h],[WIN.x+WIN.w,y0+h]],rgba(INK,.6),2);
  const bt=tag(c,T.belt,WIN.x+10,y0-46,{col:WHITE});push(rects,1,'belt',bt);
  // purple: moving on their own, from below; stopped at the belt
  const stopY=y0+h+6;
  [300,360,420].forEach((xx,i)=>{const v=mod(q*.42+i*.27),rise=smooth(clamp(v/.6)),y1=WIN.y+WIN.h-6,ytip=mix(y1,stopY,rise);
    const bump=v>.6?Math.sin((v-.6)/.4*Math.PI)*3:0;
    K.sline(c,[[xx,y1],[xx,ytip+10+bump]],rgba(INK,.6),7);K.arrow(c,xx,y1,xx,ytip+bump,PURPLE,4);
    if(v>.6)K.sline(c,[[xx-12,stopY-2],[xx+12,stopY-2]],rgba(PURPLE,.9*(1-(v-.6)/.4)),3);});
  const ot=tag(c,T.own,WIN.x+10,stopY+8,{col:PURPLE});push(rects,1,'own',ot);
  // orange: carried by people, from elsewhere (right edge), over the belt
  const A=[WIN.x+WIN.w-8,WIN.y+WIN.h-24],B=[WIN.x+WIN.w-110,y0-80],Cc=[WIN.x+WIN.w+30,y0-60];
  c.save();c.setLineDash([10,7]);c.lineDashOffset=-t*12;c.beginPath();c.moveTo(...A);c.quadraticCurveTo(Cc[0],Cc[1],B[0],B[1]);
  c.strokeStyle=rgba(INK,.6);c.lineWidth=7;c.stroke();c.strokeStyle=ORANGE;c.lineWidth=4;c.stroke();c.restore();
  const e=K.bez(A,Cc,B,.97);K.arrow(c,e[0],e[1],B[0],B[1],ORANGE,4);
  const v=mod(q*.35),p=K.bez(A,Cc,B,v);circle(c,p[0],p[1],7,ORANGE,INK,2);
  const pt=tag(c,T.people,WIN.x+WIN.w-10,B[1]-56,{al:'right',col:ORANGE});push(rects,1,'people',pt);
  s_dbg.move={belt:[y0,y0+h],bt:[bt.y,bt.y+bt.h],own:[ot.x,ot.y,ot.w],people:[pt.x,pt.y,pt.w],B};
}

// ── thermometer column: orange (warmer, low) to cyan (colder, high); rises with the assumed warming ─
function thermo(c,k,d,t,rects){
  const {x,top,bot,w}=TH,h=bot-top;
  const ct=measure(c,T.colder,22),wt=measure(c,T.warmer,22);
  text(c,T.colder,x,40,22,CYAN,'center');push(rects,1,'colder',{x:x-ct/2,y:22,w:ct,h:24});
  D.round(c,x-w/2-3,top-3,w+6,h+6,(w+6)/2,'#0b1a15',C.edge);
  c.save();c.beginPath();c.roundRect(x-w/2,top,w,h,w/2);c.clip();
  for(let y=top;y<bot;y+=3){const v=clamp((y+d*1.6-top)/h),col=mixHex(CYAN,ORANGE,smooth((v-.15)/.85));c.fillStyle=col;c.fillRect(x-w/2,y,w,3);}
  // a soft light running upward (keeps the column alive)
  const ly=bot-mod(t*.35)*h;const g=c.createRadialGradient(x,ly,0,x,ly,26);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(x-w/2,ly-26,w,52);
  c.restore();
  // ticks at the band boundaries (move with the bands)
  BOUND.forEach(y=>{const yy=y-d;if(yy>top&&yy<bot)K.sline(c,[[x-w/2-6,yy],[x+w/2+6,yy]],WHITE,2.5);});
  circle(c,x,bot+18,17,ORANGE,'#0b1a15',3);
  text(c,T.warmer,x,bot+66,22,ORANGE,'center');push(rects,1,'warmer',{x:x-wt/2,y:bot+48,w:wt,h:24});
  if(k>=2){K.arrow(c,x+w/2+16,bot-60,x+w/2+16,bot-84,rgba(ORANGE,.5+.4*Math.sin(t*3)),3);}
}
function mixHex(a,b,u){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);u=clamp(u);
  const r=Math.round(mix(A>>16&255,B>>16&255,u)),g=Math.round(mix(A>>8&255,B>>8&255,u)),bl=Math.round(mix(A&255,B&255,u));return `rgb(${r},${g},${bl})`;}

// ── rows under the window: step 0 close-up cards; statements; warming chips (steps 2-4) ─
function under(c,k,st,moving,x,u,tau,t,W,rects){
  const SC=[WHITE,WHITE,WHITE,WHITE,WHITE],sd=[0,1.2,3.6,1.6,2.2][k];
  const cx=WIN.x+WIN.w/2;
  const one=(kk,a,live)=>withA(c,a,()=>{
    let y=ROWY;
    if(kk===0){const cw=(WIN.w-30)/4,ch=Math.round(cw*933/1672);
      CARDS.forEach((f,i)=>{const ca=live?clamp((tau-.9-i*1.5)/.5):1;if(ca<=0)return;withA(c,ca,()=>{const xx=WIN.x+i*(cw+10),yy=y+(1-ca)*6;
        K.drawIn(c,f,{x:xx,y:yy,w:cw,h:ch},{radius:8});D.round(c,xx,yy,cw,ch,8,null,BCOL[i]);
        const act=live?clamp(1-Math.abs(tau-(1.2+i*1.5))/1.2):0;if(act>0)D.round(c,xx-3,yy-3,cw+6,ch+6,10,null,rgba(BCOL[i],act));
        push(rects,ca,'card'+i,{x:xx,y:yy,w:cw,h:ch});});});
      y+=ch+10;}
    else if(T.st[kk]){const qa=live?clamp((tau-Math.max(sd,moving?MOVE*.6:0))/.5):1;
      withA(c,qa,()=>{const b=box(c,T.st[kk],cx,y,{maxW:WIN.w,al:'center',stroke:SC[kk],col:SC[kk],dash:kk===1?[8,6]:null,t});if(live){push(rects,qa,'say',b);if(tau>sd+.5&&tau<sd+4)ring(c,b,t,SC[kk]);}y=b.y+b.h+8;});
      if(qa<=0)y+=48;}
    if(T.sub[kk]){const ba=live?clamp((tau-(kk===0?6.6:sd+1.2))/.6):1;
      withA(c,ba,()=>{const b=box(c,T.sub[kk],cx,y,{maxW:WIN.w,al:'center',dash:[8,6],t});if(live){push(rects,ba,'sub',b);s_dbg.subBottom=b.y+b.h;}});}
  });
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
  // warming chips (steps 2-4)
  const on=k>=2?(moving&&st.from<2?u:1):(moving&&st.from>=2?1-u:0);
  if(on>0)withA(c,on,()=>chips(c,W,t,on>.5?rects:null));
}
function chips(c,W,t,rects){
  const y=524,h=40,lab=T.warmLabel,lw=measure(c,lab,22),pw=T.warmOpt.map(p=>measure(c,p,22)+26),gap=8;
  const total=lw+14+pw.reduce((a,b)=>a+b,0)+gap*2;let x0=Math.max(WIN.x,Math.min(WIN.x+(WIN.w-total)/2,644-total));
  text(c,lab,x0,y+h/2+8,22,WHITE);push(rects,1,'warmLab',{x:x0,y:y+8,w:lw,h:24});
  let xx=x0+lw+14;
  T.warmOpt.forEach((p,i)=>{const w=pw[i],act=i===W;
    D.round(c,xx,y,w,h,h/2,act?ORANGE:FILL,act?WHITE:rgba(ORANGE,.85));
    if(act){const u=mod(t*.6);D.round(c,xx-4*u,y-4*u,w+8*u,h+8*u,h/2+4*u,null,rgba(ORANGE,.7*(1-u)));}
    text(c,p,xx+w/2,y+h/2+8,22,act?INK:ORANGE,'center');
    if(rects){D.hit(xx,y,w,h,'warm',i);push(rects,1,'chip'+i,{x:xx,y,w,h});}
    xx+=w+gap;});
  s_dbg.chips=[x0,xx-gap];
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['band',T.legBand],['north',T.legNorth]];
  if(k===1)return[['wave',T.legWave],['gas',T.legGas]];
  if(k===2)return[['dash',T.legDash],['bar',T.legBar]];
  if(k===3)return[['ex',T.legEx],['top',T.legTop]];
  return[['own',T.legOwn],['people',T.legPeople]];}
function legIcon(c,kind,x,y,t,pul){
  if(kind==='band'){BCOL.forEach((col,i)=>D.round(c,x+2,y+20-i*6,36,6,2,rgba(col,.55+.25*pul),null));}
  else if(kind==='north'){K.drawIn(c,TUNDRA,{x,y:y+2,w:42,h:24},{radius:4});D.round(c,x,y+2,42,24,4,null,rgba(WHITE,.6));}
  else if(kind==='wave')wave(c,x+2,y+13,x+40,y+13,RED,t,4,2.5);
  else if(kind==='gas'){molecule(c,x+12,y+13,t,0);molecule(c,x+30,y+13,t,2);}
  else if(kind==='dash')K.dashed(c,[[x,y+13],[x+40,y+13]],rgba(WHITE,.6+.3*pul),2.5,[8,6],-t*10);
  else if(kind==='bar'){for(let i=0;i<26;i+=2)c.fillStyle=mixHex(CYAN,ORANGE,i/26),c.fillRect(x+12,y+i,12,2);K.arrow(c,x+34,y+24,x+34,y+4,ORANGE,2.5);}
  else if(kind==='ex')K.place(c,RHODO,x,y-4,40,34);
  else if(kind==='top'){K.sline(c,[[x+6,y+4],[x+34,y+4]],WHITE,3);K.arrow(c,x+20,y+26,x+20,y+9,rgba(WHITE,.6+.3*pul),3);}
  else if(kind==='own')K.arrow(c,x+20,y+28,x+20,y,PURPLE,4);
  else{c.save();c.setLineDash([7,5]);c.lineDashOffset=-t*10;c.beginPath();c.moveTo(x+2,y+26);c.quadraticCurveTo(x+20,y-8,x+38,y+10);c.strokeStyle=ORANGE;c.lineWidth=3.5;c.stroke();c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const Rc=CARD,ix=Rc.x+16,iw=Rc.w-32;
  D.round(c,Rc.x,Rc.y,Rc.w,Rc.h,14,'rgba(22,51,43,.95)',C.edge);
  let y=Rc.y+12;
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
window.EnvironmentDraw.shift=draw;
window.EnvironmentDraw.shift.dbg=s_dbg;
})();

/* Unit 11 lesson 3 · "monitor" canvas (habitat-connections tab, view 2), 2026-10-25. Is one sighting enough? (plan section 4, monitor; P1).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Layout (as corridor): left = stage window (x 16..636, y 16..428), statement box under it, right = step card (x 652..944).
 *  0 one record: the camera trap (CV7) on the left flashes; the night infrared frame (CV7b, crop below) grows out of its lens into a
 *    cyan-framed photo (cyan = tracking evidence, plan 1.4). Tags "Night infrared frame", "Leopard cat", "One record" (cyan);
 *    cyan chips "This place", "This time", "One animal seen".
 *  1 repeated records: the photo flies into the first box of a 4 x 3 grid of nights while the camera shrinks to the left; cyan chips
 *    "Same camera", "Same place", "Same method"; the other boxes fill one by one (lit box = a photo that night, with a camera flash;
 *    dark dashed box = no photo that night); cyan bracket "Building up box by box". The hit pattern is a teaching illustration.
 *  2 near, enter, cross: a drawn side view (crossfade, a different scene): a road embankment with a culvert (green = connection),
 *    a camera on a post at each end, three cyan dashed gates "Near", "Enter", "Cross". Drawn leopard cats (TH2 walk / stand) make six
 *    trips: three turn back before the culvert, two go in and come back out, one crosses. Three tally counters (cyan ticks, no digits)
 *    run together; crossing ends lowest, tag "Fewest".
 *  3 more evidence: the cyan photo "One cat photographed", "≠", a white dashed box "Population recovered?"; under it "Evidence still
 *    needed" and three white dashed boxes (to check) "Survival", "Breeding", "Population size", each with a pulsing "?";
 *    cyan chips recall "Mark-recapture", "Quadrats" (ecology lesson 1).
 *  Steps 1->2, 2->3, 3->0 (loop) and any jump: the old scene fades out, then the new one fades in (no overlap).
 * Always moving: dashes march, the camera's IR panel glows, glints run along lines, cats walk, rings pulse.
 * Science (plan 4): one photo cannot show recovery; boxes and ticks are schematic (no real counts, no digits, no results);
 * quadrats and mark-recapture are only recalled from ecology lesson 1.
 * Pictures: CV7_camera_trap.png 338x506 (alpha bbox = whole picture, lens faces left: lens src (80,222), IR panel src (85,322));
 * CV7b_ir_frame.jpg 1024x572, crop src x 330..1000, y 160..572 (cat inside: head ~ (525,290), back ~ (690,270));
 * TH2_leopard_cat_walk.png 1198x562 / TH2_leopard_cat_stand.png 1122x701 (alpha bbox = whole picture, both face left).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,MOVE=1.2;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const CYAN=(K.COL&&K.COL.evidence)||'#55e9ff',GREEN=(K.COL&&K.COL.protect)||'#4ade80';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const CAM=ENV+'CV7_camera_trap.png',IR=ENV+'CV7b_ir_frame.jpg',WALK=ENV+'TH2_leopard_cat_walk.png',STAND=ENV+'TH2_leopard_cat_stand.png';
[CAM,IR,WALK,STAND].forEach(f=>{try{K.pic(K.src(f));}catch(e){}});

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('看到一隻，夠了嗎','Is one sighting enough?'),
 short:[P('一筆紀錄','One record'),P('重複記錄','Repeated records'),P('靠近、進入、通過','Near, enter, cross'),P('還要更多證據','More evidence')],
 names:[P('一張照片：一筆紀錄','One photo: one record'),P('用同樣的方法重複記錄','Repeat records with the same method'),P('靠近、進入、通過，是不同的事','Approaching, entering and crossing differ'),P('想說「族群恢復」，還需要更多證據','Saying "the population recovered" needs more evidence')],
 camera:P('自動相機','Camera trap'),irTag:P('夜間紅外線畫面','Night infrared frame'),cat:P('石虎','Leopard cat'),
 record:P('一筆紀錄','One record'),
 chips0:[P('這個地點','This place'),P('這個時間','This time'),P('出現過一隻','One animal seen')],
 chips1:[P('同一台相機','Same camera'),P('同一個位置','Same place'),P('同樣的方法','Same method')],
 build:P('一格一格累積起來','Building up box by box'),
 road:P('道路','Road'),culvert:P('涵洞','Culvert'),
 gate:[P('靠近','Near'),P('進入','Enter'),P('通過','Cross')],
 fewest:P('最少','Fewest'),
 seen:P('拍到一隻','One cat photographed'),
 recover:P('族群恢復？','Population recovered?'),
 need:P('還需要的證據','Evidence still needed'),
 needs:[P('存活','Survival'),P('繁殖','Breeding'),P('族群數量','Population size')],
 recall:P('回想生態：','Recall ecology:'),
 methods:[P('捉放法','Mark-recapture'),P('樣方','Quadrats')],
 st:[P('一張照片：這個地點、這個時間，出現過一隻','One photo: one animal, at this place and this time'),
  P('同樣的方法重複記錄，紀錄才能比較','Repeat the same method, and the records can be compared'),
  P('要看有沒有通過，不是只看有沒有靠近','Look for crossing, not just approaching'),
  P('不能只拍到一隻，就宣稱族群恢復','One photographed animal cannot show the population recovered')],
 leg:[[['cam',P('相機：有動靜就拍','Camera: shoots when something moves')],['frame',P('青框：追蹤證據','Cyan frame: tracking evidence')]],
      [['cell',P('一格：一個晚上','One box: one night')],['dark',P('暗格：那晚沒拍到','Dark box: no photo that night')]],
      [['tick',P('一條刻痕：一次紀錄','One tick: one record')],['cam',P('相機：通道兩端各一台','Cameras: one at each end')]],
      [['cyan',P('青：已經有的紀錄','Cyan: records we have')],['dash',P('白虛線框：還要查證','White dashed box: still to check')]]],
 foot:P('格子與刻痕都是示意，不是真實數據','Boxes and ticks are schematic, not real data'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── geometry ─────────────────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412},CARD={x:652,y:16,w:292,h:550};
const CAMW=338,CAMH=506,camR=(x,y,w)=>({x,y,w,h:w*CAMH/CAMW});
const camPt=(R,[X,Y])=>[R.x+X*R.w/CAMW,R.y+Y*R.h/CAMH];
const LENS=[80,222],LEDS=[85,322];
const PC={x:330,y:160,w:670,h:412},PCROP=[PC.x/1024,PC.y/572,PC.w/1024,PC.h/572];
const php=(R,[X,Y])=>[R.x+(X-PC.x)*R.w/PC.w,R.y+(Y-PC.y)*R.h/PC.h];
// step 0
const CAM0=camR(30,96,150),PH0={x:212,y:66,w:410,h:Math.round(410*PC.h/PC.w)};
// step 1: 4 x 3 nights
const CAM1=camR(28,150,100);
const GX=150,GY=96,CWc=109,CHc=Math.round(109*PC.h/PC.w),GXS=10,GYS=12;
const cell=i=>({x:GX+(i%4)*(CWc+GXS),y:GY+Math.floor(i/4)*(CHc+GYS),w:CWc,h:CHc});
const HIT=[1,0,0,1,1,0,0,1,0,1,0,0];
// lit boxes show the same frame with a shifted crop (and some mirrored), so the cat is not in the same spot every night (illustration only)
const VAR={3:[354,130,true],4:[250,150,false],7:[300,100,true],9:[354,160,false]};
const fillT=i=>i===0?0:1.0+(i-1)*.42;
// step 2: side view
const GND=356,EMB=[[244,GND],[300,200],[400,200],[456,GND]],TUN={x:266,y:296,w:168,h:60};
const GATE=[170,284,452],GATEP=[GATE[0],GATE[1]+6,GATE[2]+12];
const V=160,X0=WIN.x-40;
const TRIPS=[[.6,0],[1.4,1],[2.4,0],[3.0,2],[4.0,1],[4.8,0]];   // [start, kind]: 0 turns back before the culvert, 1 goes in and comes back, 2 crosses
const TURN=[190,330,720],PAUSE=.6;
const CNT={x:28,y:26,w:352,h:136},ROWY=[60,102,144],TICK0=150,TICKS=16;
// step 3
const PH3={x:36,y:56,w:236,h:Math.round(236*PC.h/PC.w)};
const NB={y:302,h:68,w:189,xs:[30,231,432]};

// ── helpers (as in corridor) ─────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function withA2(c,a,fn){if(a<=0.002)return null;c.save();c.globalAlpha*=Math.min(1,a);const r=fn();c.restore();return r;}
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、；？])|(?<=[:,;?] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop()+(/ $/.test(part)?' ':'');rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:FILL,active?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22}={}){
  const w=tagW(c,p,size),h=size+18;let bx=al==='right'?x-w:al==='center'?x-w/2:x;bx=Math.max(WIN.x+6,Math.min(bx,WIN.x+WIN.w-6-w));
  const by=Math.max(WIN.y+6,Math.min(y,WIN.y+WIN.h-6-h));
  D.round(c,bx,by,w,h,h/2,FILL,rgba(col,.95));text(c,p,bx+w/2,by+h/2+size*.36,size,col,'center');return{x:bx,y:by,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const lead=(c,x1,y1,x2,y2,t,col=WHITE)=>{K.dashed(c,[[x1,y1],[x2,y2]],rgba(INK,.7),5,[8,6],-t*10);K.dashed(c,[[x1,y1],[x2,y2]],col,2.5,[8,6],-t*10);};
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
// a row of chips centred at cx, kept inside the window
function chips(c,list,cx,y,t,q0,q,col,rects,a,id){
  const ws=list.map(p=>tagW(c,p)),gap=10,tot=ws.reduce((s,w)=>s+w,0)+gap*(list.length-1);
  let x=Math.max(WIN.x+8,Math.min(cx-tot/2,WIN.x+WIN.w-8-tot));
  list.forEach((p,i)=>{const aa=clamp((q-q0-i*.4)/.4);withA(c,aa,()=>{const r=tag(c,p,x,y,{col});push(rects,aa*a,id+i,r);if(q>q0+i*.4+.2&&q<q0+i*.4+2.4)ring(c,r,t,col);});x+=ws[i]+gap;});}
// camera picture (lens faces left unless flip) and its infrared panel glow
function camera(c,R,t,flash=0,flip=false){
  c.save();c.shadowColor='rgba(11,26,21,.85)';c.shadowBlur=10;K.drawIn(c,CAM,R,{flip});c.restore();
  let [lx,ly]=camPt(R,LEDS);if(flip)lx=R.x+R.w-(lx-R.x);
  K.glow(c,lx,ly,R.w*.22,WHITE,.18+.1*Math.sin(t*2.2));
  if(flash>0)K.glow(c,lx,ly,R.w*.75,WHITE,.85*flash);}
function photo(c,R,t,{radius=10,frame=true,march=true,v=null}={}){
  K.drawIn(c,IR,R,{radius,crop:v?[v[0]/1024,v[1]/572,PC.w/1024,PC.h/572]:PCROP,flip:!!(v&&v[2])});
  if(frame){D.round(c,R.x,R.y,R.w,R.h,radius,null,CYAN);c.save();c.lineWidth=3.5;
    if(march){c.setLineDash([14,10]);c.lineDashOffset=-t*16;c.strokeStyle=rgba(CYAN,.95);c.beginPath();c.roundRect(R.x-6,R.y-6,R.w+12,R.h+12,radius+5);c.stroke();}c.restore();}}
// cat picture centred at (x, y), facing left unless flip
function cat(c,file,x,y,w,flip=false,a=1){const [W,H]=K.SIZE[file]||[1198,562],h=w*H/W;
  withA(c,a,()=>{c.save();c.shadowColor='rgba(11,26,21,.8)';c.shadowBlur=6;K.drawIn(c,file,{x:x-w/2,y:y-h/2,w,h},{flip});c.restore();});
  return{x:x-w/2,y:y-h/2,w,h};}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.monSt||(s.monSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const morph=moving&&st.from===0&&k===1;
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,'rgba(22,51,43,.92)',null);
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  const STEP=[step0,step1,step2,step3];
  if(morph){
    step0(c,1-clamp(x*3),99,t,null,true);
    step1(c,clamp((x-.55)/.45),0,t,null,true);
    camera(c,lerpR(CAM0,CAM1,u),t);
    const R=lerpR(PH0,cell(0),u);photo(c,R,t,{radius:mix(10,6,u),march:false});
  }else if(moving){
    STEP[st.from](c,1-smooth(clamp(x*2)),99,t,null,false);      // dip: the old scene leaves, then the new one comes in (no overlap of two busy scenes)
    STEP[k](c,smooth(clamp(x*2-1)),tau,t,null,false);
  }else STEP[k](c,1,tau,t,rects,false);
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);
  statement(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const fw=measure(c,T.foot,22);text(c,T.foot,16,592,22,MUTED,'left');push(rects,1,'foot',{x:16,y:574,w:fw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,944,592,22,MUTED,'right');push(rects,1,'aiNote',{x:944-aw,y:574,w:aw,h:24});
}

// 0: one photo, one record
function step0(c,a,q,t,rects,noBase){if(a<=0)return;withA(c,a,()=>{
  const flash=q<3?clamp(1-Math.abs(q-.5)/.35):0;
  if(!noBase){camera(c,CAM0,t,flash);
    const g=smooth(clamp((q-.45)/1)),[lx,ly]=camPt(CAM0,LENS);
    if(g>0){const R=lerpR({x:lx-8,y:ly-5,w:16,h:10},PH0,g);photo(c,R,t,{radius:mix(4,10,g),march:g>=1});
      if(q<2)withA(c,clamp(1-(q-.6)/.8),()=>D.round(c,R.x,R.y,R.w,R.h,10,'rgba(242,236,217,.55)',null));}}
  withA(c,clamp((q-.2)/.4),()=>{const r=tag(c,T.camera,CAM0.x+CAM0.w/2,WIN.y+30,{al:'center',col:WHITE});push(rects,a,'camera',r);});
  withA(c,clamp((q-1.6)/.4),()=>{const r=tag(c,T.irTag,PH0.x+10,PH0.y+10,{col:WHITE});push(rects,a,'ir',r);});
  withA(c,clamp((q-2.1)/.4),()=>{const r=tag(c,T.cat,PH0.x+PH0.w-8,PH0.y+PH0.h-52,{al:'right',col:WHITE});const b=php(PH0,[770,400]);
    lead(c,r.x+18,r.y,b[0]+2,b[1]+4,t);push(rects,a,'cat',r);});
  withA(c,clamp((q-2.7)/.4),()=>{const r=tag(c,T.record,WIN.x+WIN.w-6,WIN.y+6,{al:'right',col:CYAN});push(rects,a,'record',r);if(q>2.9&&q<6.5)ring(c,r,t,CYAN);});
  chips(c,T.chips0,PH0.x+PH0.w/2,PH0.y+PH0.h+18,t,3.4,q,CYAN,rects,a,'c0');
});}

// 1: the same method, night after night
function step1(c,a,q,t,rects,noBase){if(a<=0)return;withA(c,a,()=>{
  let flash=0;HIT.forEach((h,i)=>{if(h&&i>0){const d=q-fillT(i);if(d>-.05&&d<.6)flash=Math.max(flash,1-d/.6);}});
  if(!noBase)camera(c,CAM1,t,flash);
  chips(c,T.chips1,WIN.x+WIN.w/2,WIN.y+10,t,.4,q,CYAN,rects,a,'c1');
  const done=fillT(11)+.4,sweep=q>done?Math.floor(mod(t*2.2,14)):-1;
  for(let i=0;i<12;i++){const R=cell(i),f=i===0?1:clamp((q-fillT(i))/.3);
    D.round(c,R.x,R.y,R.w,R.h,6,'rgba(11,26,21,.35)',rgba(WHITE,.16));
    if(i===0&&noBase)continue;
    if(f<=0)continue;
    withA(c,f,()=>{
      if(HIT[i]){photo(c,R,t,{radius:6,march:false,v:VAR[i]||null});}
      else{D.round(c,R.x,R.y,R.w,R.h,6,'#0b1a15',null);c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*8;D.round(c,R.x+1,R.y+1,R.w-2,R.h-2,6,null,rgba(MUTED,.75));c.restore();}
      const nw=q-fillT(i);if(i>0&&nw>0&&nw<1.2){const v=clamp(nw/1.2);D.round(c,R.x-4*v,R.y-4*v,R.w+8*v,R.h+8*v,6+4*v,null,rgba(HIT[i]?CYAN:WHITE,.9*(1-v)));}
      if(i===sweep)D.round(c,R.x-3,R.y-3,R.w+6,R.h+6,8,null,rgba(CYAN,.9));});}
  if(rects)push(rects,a,'grid',{x:GX,y:GY,w:cell(3).x+CWc-GX,h:cell(11).y+CHc-GY});
  // bracket under the grid
  withA(c,clamp((q-(done+.2))/.5),()=>{const y=cell(11).y+CHc+12,x1=GX,x2=cell(3).x+CWc;
    K.dashed(c,[[x1,y-8],[x1,y],[x2,y],[x2,y-8]],CYAN,3,[10,7],-t*12);
    const r=tag(c,T.build,(x1+x2)/2,y+8,{al:'center',col:CYAN});push(rects,a,'build',r);if(q>done+.4&&q<done+3.2)ring(c,r,t,CYAN);});
});}

// 2: near, enter, cross (drawn side view)
function tripPos(i,q){const [t0,kind]=TRIPS[i],tt=q-t0;if(tt<0)return null;
  const turn=TURN[kind],t1=(turn-X0)/V;
  if(kind===2){if(tt>t1)return null;return{x:X0+V*tt,right:true,walk:true};}
  if(tt<t1)return{x:X0+V*tt,right:true,walk:true};
  if(tt<t1+PAUSE)return{x:turn,right:true,walk:false};
  const tb=tt-t1-PAUSE;if(tb>t1)return null;return{x:turn-V*tb,right:false,walk:true};}
function counts(q){const n=[0,0,0];TRIPS.forEach(([t0,kind])=>{const tt=q-t0;
  for(let g=0;g<3;g++){if(g===1&&kind<1)continue;if(g===2&&kind<2)continue;if(tt>=(GATEP[g]-X0)/V)n[g]++;}});return n;}
function lastHit(q,g){let best=-1;TRIPS.forEach(([t0,kind])=>{if((g===1&&kind<1)||(g===2&&kind<2))return;const th=t0+(GATEP[g]-X0)/V;if(th<=q)best=Math.max(best,th);});return best;}
function step2(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  // ground, embankment, road, culvert
  c.fillStyle='#24412f';c.fillRect(WIN.x,GND,WIN.w,WIN.y+WIN.h-GND);
  K.sline(c,[[WIN.x,GND],[WIN.x+WIN.w,GND]],'#3c5e48',3);
  c.save();c.beginPath();EMB.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle='#3a4a42';c.fill();c.strokeStyle='#56665d';c.lineWidth=2;c.stroke();c.restore();
  K.sline(c,[[296,198],[404,198]],'#2b3430',10);c.save();c.setLineDash([10,8]);c.lineDashOffset=-t*6;K.sline(c,[[300,198],[400,198]],rgba(WHITE,.8),2);c.restore();
  D.round(c,TUN.x,TUN.y,TUN.w,TUN.h+2,[14,14,0,0],'#0b1a15',null);
  c.save();c.strokeStyle=GREEN;c.lineWidth=3.5;c.beginPath();c.moveTo(TUN.x,GND);c.lineTo(TUN.x,TUN.y+14);c.arcTo(TUN.x,TUN.y,TUN.x+14,TUN.y,14);c.lineTo(TUN.x+TUN.w-14,TUN.y);c.arcTo(TUN.x+TUN.w,TUN.y,TUN.x+TUN.w,TUN.y+14,14);c.lineTo(TUN.x+TUN.w,GND);c.stroke();c.restore();
  // cameras on posts at both ends
  [[206,true],[494,false]].forEach(([px,flip])=>{K.sline(c,[[px,GND],[px,292]],'#6b5a45',5);camera(c,camR(px-19,236,38),t,0,flip);});
  // gates
  const n=counts(q);
  GATE.forEach((gx,g)=>{const lh=lastHit(q,g),fl=lh>=0?clamp(1-(q-lh)/.7):0;
    K.dashed(c,[[gx,292],[gx,GND]],CYAN,3,[8,6],-t*10);if(fl>0)K.glow(c,gx,GND-30,34,CYAN,.8*fl);});
  // cats
  TRIPS.forEach((tr,i)=>{const p=tripPos(i,q);if(!p)return;const file=p.walk?WALK:STAND,[W,H]=K.SIZE[file],w=p.walk?64:58,h=w*H/W,bob=p.walk?Math.abs(Math.sin(q*9+i))*1.4:0;
    const cr=cat(c,file,p.x,GND-h/2-2-bob,w,p.right);if(rects)push(rects,1,'cat'+i,cr);});
  // tags
  withA(c,clamp((q-.2)/.4),()=>{const r=tag(c,T.culvert,(TUN.x+TUN.w/2),236,{al:'center',col:GREEN});push(rects,a,'culvert',r);
    const r2=tag(c,T.road,470,166,{col:WHITE});lead(c,r2.x,r2.y+r2.h/2,406,197,t);push(rects,a,'road',r2);});
  GATE.forEach((gx,g)=>withA(c,clamp((q-.3-g*.2)/.4),()=>{const r=tag(c,T.gate[g],gx,GND+12,{al:'center',col:CYAN});push(rects,a,'gate'+g,r);}));
  // counters (tally, no digits)
  D.round(c,CNT.x,CNT.y,CNT.w,CNT.h,12,FILL,rgba(CYAN,.6));
  ROWY.forEach((y,g)=>{text(c,T.gate[g],CNT.x+16,y+8,22,CYAN,'left');if(rects)push(rects,a,'row'+g,{x:CNT.x+16,y:y-14,w:measure(c,T.gate[g],22),h:26});
    for(let j=0;j<n[g];j++){const tx=TICK0+j*TICKS,lh=lastHit(q,g),isNew=j===n[g]-1&&lh>=0&&q-lh<.8;
      if(isNew)K.glow(c,tx,y,20,CYAN,.8*(1-(q-lh)/.8));K.sline(c,[[tx,y-13],[tx,y+13]],CYAN,5);}
    if(n[g]>0){const v=.5+.5*Math.sin(t*2.4-g);K.glow(c,TICK0+(n[g]-1)*TICKS,y,12,CYAN,.25*v);}});
  const fq=lastHit(9,2)+.4;
  withA(c,clamp((q-fq)/.4),()=>{const y=ROWY[2],r=tag(c,T.fewest,TICK0+TICKS+30,y-20,{col:CYAN});push(rects,a,'fewest',r);if(q>fq+.2)ring(c,{x:TICK0-12,y:y-20,w:TICKS+20,h:40},t,CYAN);});
});}

// 3: more evidence before saying "recovered"
function step3(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  withA(c,clamp((q-.2)/.4),()=>{photo(c,PH3,t,{radius:8});const r=tag(c,T.seen,PH3.x+PH3.w/2,PH3.y+PH3.h+12,{al:'center',col:CYAN});push(rects,a,'seen',r);});
  const ra=clamp((q-1)/.5);
  withA(c,ra,()=>{const cx=330,cy=128;
    K.sline(c,[[cx-22,cy-10],[cx+22,cy-10]],WHITE,5);K.sline(c,[[cx-22,cy+10],[cx+22,cy+10]],WHITE,5);K.sline(c,[[cx-12,cy+28],[cx+12,cy-28]],WHITE,5);
    const g=boxGeo(c,T.recover,250),w=Math.max(200,g.w+12),bh=g.h+10,bx=500-w/2,by=cy-bh/2;
    D.round(c,bx,by,w,bh,14,FILL,null);c.save();c.setLineDash([10,7]);c.lineDashOffset=-t*10;D.round(c,bx,by,w,bh,14,null,WHITE);c.restore();
    g.rows.forEach((r,i)=>text(c,r,500,by+5+28+i*g.lh,22,WHITE,'center'));push(rects,a,'recover',{x:bx,y:by,w,h:bh});if(q>1.3&&q<4.5)ring(c,{x:bx,y:by,w,h:bh},t,WHITE);});
  withA(c,clamp((q-2)/.4),()=>{text(c,T.need,36,290,22,WHITE,'left');push(rects,a,'need',{x:36,y:272,w:measure(c,T.need,22),h:26});});
  NB.xs.forEach((bx,i)=>{const ba=clamp((q-2.5-i*.6)/.4);withA(c,ba,()=>{
    const cx=bx+NB.w/2;
    D.round(c,bx,NB.y,NB.w,NB.h,12,FILL,null);c.save();c.setLineDash([10,7]);c.lineDashOffset=-t*10;D.round(c,bx,NB.y,NB.w,NB.h,12,null,WHITE);c.restore();
    const rows=tlines(c,T.needs[i],NB.w-44),y0=NB.y+NB.h/2+8-(rows.length-1)*13;
    rows.forEach((r,j)=>{text(c,r,cx-6,y0+j*26,22,WHITE,'center');push(rects,ba*a,'needs'+i+'_'+j,{x:cx-6-measure(c,r,22)/2,y:y0+j*26-18,w:measure(c,r,22),h:24});});
    const qx=bx+NB.w-6,qy=NB.y+4,pu=.5+.5*Math.sin(t*2.6+i);circle(c,qx,qy,14,FILL,rgba(WHITE,.6+.4*pu),2.5);
    c.save();c.font=K.MONO(22);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('?',qx,qy+1);c.restore();});});
  withA(c,clamp((q-4.6)/.4),()=>{const y=382;let x0=36;text(c,T.recall,x0,y+29,22,WHITE,'left');const rw=measure(c,T.recall,22);push(rects,a,'recall',{x:x0,y:y+11,w:rw,h:26});
    let xx=x0+rw+10;T.methods.forEach((p,i)=>{const r=tag(c,p,xx,y,{col:CYAN});push(rects,a,'m'+i,r);if(q>4.8&&q<7.5)ring(c,r,t,CYAN);xx+=r.w+10;});});
});}

// ── statement under the window ───────────────────────────────────────────
function statement(c,k,st,moving,x,tau,t,rects){
  const cx=WIN.x+WIN.w/2,SY=WIN.y+WIN.h+12,sd=[3.2,5.6,6.0,5.2],col=kk=>kk===3?WHITE:CYAN;
  const one=(kk,a,live)=>withA(c,a,()=>{
    const qa=live?clamp((tau-sd[kk])/.5):1;
    withA(c,qa,()=>{const b=box(c,T.st[kk],cx,SY,{maxW:WIN.w,al:'center',stroke:col(kk),col:WHITE});
      if(live){push(rects,qa*a,'say',b);s_dbg.bottom=b.y+b.h;if(tau>sd[kk]+.5&&tau<sd[kk]+4)ring(c,b,t,col(kk));}});});
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='cam'){const R=camR(ax-13,ay-20,26);camera(c,R,t,.25*pul);}
  else if(kind==='frame'){D.round(c,x+2,y+3,38,26,5,'#0b1a15',CYAN);c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*10;D.round(c,x-1,y,44,32,7,null,rgba(CYAN,.8));c.restore();}
  else if(kind==='cell'){const R={x:x+2,y:y+3,w:40,h:Math.round(40*PC.h/PC.w)};K.drawIn(c,IR,R,{radius:4,crop:PCROP});D.round(c,R.x,R.y,R.w,R.h,4,null,rgba(CYAN,.7+.3*pul));}
  else if(kind==='dark'){D.round(c,x+2,y+3,40,25,4,'#0b1a15',null);c.save();c.setLineDash([5,4]);c.lineDashOffset=-t*8;D.round(c,x+2,y+3,40,25,4,null,MUTED);c.restore();}
  else if(kind==='tick'){for(let j=0;j<3;j++)K.sline(c,[[x+10+j*11,ay-12],[x+10+j*11,ay+12]],CYAN,4);K.glow(c,x+32,ay,12,CYAN,.3*pul);}
  else if(kind==='cyan'){K.glow(c,ax,ay,16,CYAN,.5+.3*pul);circle(c,ax,ay,8,null,CYAN,3);}
  else if(kind==='dash'){c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*10;D.round(c,x+2,y+3,38,26,6,null,WHITE);c.restore();}}
const tlines=(c,p,w)=>/[一-鿿]/.test(D.tr(p))?blines(c,p,w):greedyBal(c,D.tr(p),w);
const twrap=(c,p,x,y,w)=>{const r=tlines(c,p,w);r.forEach((q,i)=>text(c,q,x,y+i*28,22,WHITE,'left'));return r.length*28;};
function card(c,k,st,moving,x,u,tau,t,rects){
  const Rc=CARD,ix=Rc.x+16,iw=Rc.w-32;
  D.round(c,Rc.x,Rc.y,Rc.w,Rc.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,Rc.y+14,{maxW:iw,stroke:CYAN});push(rects,1,'tab',hr);
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
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>twrap(c,T.names[st.from],ix,ty,iw));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=tlines(c,T.names[k],iw).length*28;withA(c,na,()=>twrap(c,T.names[k],ix,ty,iw));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=T.leg[k],lhs=legs.map(([,p])=>Math.max(50,blines(c,p,iw-54).length*27+12));
  const ly=Rc.y+Rc.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+4,t);
    const h=bwrap(c,p,ix+54,yy+22,iw-54,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+54,y:yy+2,w:iw-54,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.monitor=draw;
window.EnvironmentDraw.monitor.dbg=s_dbg;
})();

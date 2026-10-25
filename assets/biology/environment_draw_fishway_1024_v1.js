/* Unit 11 lesson 3 · "fishway" canvas (habitat-connections tab, view 0), 2026-10-25. Finding, passing, surviving (plan section 4, fishway; P1).
 * Five steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Always moving: white glints fall over the weir and over every pool wall, drawn fish swim (blocked, climbing, drawn to the entrance,
 * passing pool by pool in the section), the outflow lines run, the lit tag or box breathes, light dots run along the bars.
 * Layout (as turtle / toolbox / casefile): left = stage (x 16..636, y 16..486), statement box under it, right = step card (x 652..944).
 *  0 blocked: CV5a_weir.jpg fills the stage (crop src x 250..1000, y 4..572). Three drawn fish below the drop push up and fall back;
 *    a white dashed arrow "upstream" stops at the crest with an orange bar (pressure = orange, recalls lesson 2); orange bracket "drop".
 *  1 fishway: CV5b_weir_fishway.jpg (same crop). NOT a crossfade with CV5a (handoff: the two pictures are not to be aligned by fading):
 *    the CV5a picture shrinks into a small "before" picture card (top left) and CV5b is shown behind it. The six pools light up green
 *    (connection = green) one by one from the bottom; tags "fishway" (green), "pool by pool"; a fish climbs pool by pool.
 *  2 entrance: same CV5b (no change of picture); the scene dims except round the lower end of the fishway; white outflow lines run out
 *    of the entrance into the river; a green ring "entrance"; tag "the outflow draws fish"; one fish follows the flow into the entrance,
 *    two others wait under the big fall (they have not found it).
 *  3 drops: CV5c_fishway_section.jpg (crop src x 40..1000, y 70..500) in the upper part of the stage (crossfade: a different scene);
 *    glints fall over each wall; a fish passes pool by pool through the wall openings (entrance lower right, exit upper left);
 *    bracket "one step's drop"; under it four animals (CV5_eel, CV5_goby, BD7_chub, EC14a_shrimp), each with a white bar "drops it can
 *    pass"; heading says the lengths are only schematic. No numbers, no axis, no flow speed, slope or size.
 *  4 evidence: CV5b again (from CV5c: crossfade; from CV5a: dip through dark, never a crossfade), dimmed. Three boxes stacked on the
 *    left from the bottom: "finds the entrance" (cyan, lit), "gets through" and "breeds and survives upstream" (white dashed, "to check"),
 *    with "≠" between them; leaders to the entrance, the channel and the upstream river; the route: cyan up to the entrance, white
 *    dashed after it with "?" marks; a fish swims only to the entrance. Cyan box "evidence: use, passage, survival, breeding".
 *  Loop 4 -> 0 (CV5b -> CV5a) dips through dark.
 * Science (plan 4): the fishway is only an analogy for connectivity (no flow speed, slope or engineering size); real effect needs use,
 * passage, survival and breeding evidence; no effect numbers. Bar lengths are schematic and their order is not data.
 * Pictures (alpha bbox = whole picture, measured with PIL): CV5_eel 500x341 (faces right), CV5_goby 469x152 (faces left),
 * BD7_chub 348x133 (faces right), EC14a_shrimp 1242x584 (faces left); CV5a / CV5b / CV5c 1024x572. Positions on the pictures were
 * picked once from zoomed copies (source px below). Measured: CV5a and CV5b differ only round the fishway (mean abs diff 4..8 elsewhere).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=5,PER=9,CW=960,MOVE=1.2;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const GREEN=(K.COL&&K.COL.protect)||'#4ade80',CYAN=(K.COL&&K.COL.evidence)||'#55e9ff',ORANGE=(K.COL&&K.COL.pressure)||'#fb923c';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const CVA=ENV+'CV5a_weir.jpg',CVB=ENV+'CV5b_weir_fishway.jpg',CVC=ENV+'CV5c_fishway_section.jpg';
const EEL=ENV+'CV5_eel.png',GOBY=ENV+'CV5_goby.png',CHUB=ENV+'BD7_chub.png',SHRIMP='EC14a_shrimp.png';
// load all pictures of this view at once, so a step never starts with an empty frame
[CVA,CVB,CVC,EEL,GOBY,CHUB,SHRIMP].forEach(f=>{try{K.pic(K.src(f));}catch(e){}});

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('魚梯怎麼走','Getting through a fishway'),
 short:[P('河被攔住','A blocked river'),P('魚梯','The fishway'),P('入口在哪','Where is the entrance'),P('能過的落差','Which drops'),P('三種證據','Three kinds of evidence')],
 names:[P('河被攔住：一道落差','A blocked river: one drop'),P('加了魚梯：一格一格的水池','A fishway: pool by pool'),P('魚要先找到入口','Fish must first find the entrance'),P('每一格的落差，能過的生物不同','Each step: different animals manage different drops'),P('找到入口、通過、繁殖存活，是三件事','Finding, passing and surviving to breed are three things')],
 drop:P('落差','Drop'),up:P('往上游','Upstream'),
 before:P('原本：沒有魚梯','Before: no fishway'),
 fishway:P('魚梯','Fishway'),pools:P('一格一格的水池','Pool by pool'),
 ent:P('入口','Entrance'),outflow:P('流出的水吸引魚','The outflow draws fish'),
 exit:P('出口','Exit'),oneStep:P('一格的落差','One step\'s drop'),
 barHead:P('能通過的落差（示意，不分高低）','Drops each can pass (schematic, no ranking)'),
 res:[P('鰻魚','Eel'),P('吻鰕虎','Goby'),P('苦花','Taiwan chub'),P('米蝦','Shrimp')],
 ev:[P('找到入口','Finds the entrance'),P('順利通過','Gets through'),P('到上游產卵並存活','Breeds and survives upstream')],
 check:L('toCheck','待查','To check'),
 evid:P('要看的證據：使用、通過、存活、繁殖','Evidence needed: use, passage, survival, breeding'),
 st:[P('一道落差，擋住往上游的魚','One drop holds back fish heading upstream'),
  P('魚梯把一道大落差，拆成許多小落差','A fishway splits one big drop into many small ones'),
  P('魚要先找到入口；流出的水會吸引牠','Fish must first find the entrance; the outflow draws them'),
  P('每種生物能通過的落差不同（示意）','Each animal manages different drops (schematic)'),
  P('蓋好魚梯，不等於魚用了，也不等於族群變好','A built fishway does not mean fish use it, nor that the population improves')],
 leg:[[['drop',P('橘色：擋路的落差','Orange: the drop')],['fish',P('魚形：程式畫的剪影','Drawn fish shapes')]],
      [['ladder',P('綠色：魚梯（連通）','Green: connection')],['before',P('小圖：加魚梯以前','Before the fishway')]],
      [['flow',P('白色流線：從魚梯流出的水','White lines: outflow')],['door',P('綠圈：入口','Green ring: entrance')]],
      [['bar',P('長條：能通過的落差','Bars: drops passed')],['nodata',P('示意：長度相同，不比高低，也不是真實數據','Schematic: equal length, no ranking, not data')]],
      [['cyan',P('青色：追蹤的證據','Cyan: evidence')],['dash',P('白色虛線：待查','Dashed: to check')]]],
 foot:P('魚梯只作連通的示意，不表示流速、坡度或尺寸','Connection only: no flow, slope or size shown'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── geometry ─────────────────────────────────────────────────────────────
const STAGE={x:16,y:16,w:620,h:470};
// CV5a / CV5b: crop src x 250..1000, y 4..572 onto the whole stage
const AB={x:16,y:16,w:620,h:470},AB_SX=250,AB_SY=4,AB_SW=750,AB_SH=568;
const AB_CROP=[AB_SX/1024,AB_SY/572,AB_SW/1024,AB_SH/572];
const ax=X=>AB.x+(X-AB_SX)*AB.w/AB_SW,ay=Y=>AB.y+(Y-AB_SY)*AB.h/AB_SH,AP=([X,Y])=>[ax(X),ay(Y)];
// CV5c: crop src x 40..1000, y 70..500 onto the upper stage
const SC3=620/960,CC={x:16,y:16,w:620,h:Math.round(430*SC3)},CC_CROP=[40/1024,70/572,960/1024,430/572];
const cx3=X=>CC.x+(X-40)*SC3,cy3=Y=>CC.y+(Y-70)*SC3,CP=([X,Y])=>[cx3(X),cy3(Y)];
// points on CV5a / CV5b (source px)
const CREST=[[380,300],[605,305]],DROP_B=AP([612,386]),DROP_T=AP([612,306]);
const FOAM=[[505,438],[565,428],[400,452]].map(AP);                     // fish below the drop (step 0)
const ENT=AP([560,500]);                                              // lower end of the fishway (entrance)
const POOLS=[[645,495],[740,432],[790,395],[825,365],[850,340],[890,312]].map(AP);
const EXIT=AP([918,300]),UPR=AP([700,255]);
const DOWN=AP([380,548]);
const CLIMB=[DOWN,AP([470,520]),ENT,...POOLS,EXIT,AP([800,272])];   // step 1 climbing route
const FALLS=[[690,462],[765,412],[808,380],[838,352],[870,326]].map(AP);// wall crests between pools (glints)
// CV5c section (source px)
const SP=[[148,222],[265,260],[373,298],[482,327],[607,364],[732,398]].map(CP);  // pools 1..6, left (upstream) to right
const SH=[[236,262],[332,308],[452,340],[565,380],[686,420]].map(CP);              // wall openings 1..5
const SCREST=[[307,177],[411,214],[515,247],[627,285],[748,327]].map(CP);
const S_IN=CP([960,452]),S_ENT=CP([846,432]),S_EXIT=CP([66,188]);
const STEP_BR={x:cx3(588),y0:cy3(264),y1:cy3(304)};
// bars area (step 3)
const BARS={x:16,y:CC.y+CC.h+8,w:620,h:486-(CC.y+CC.h+8)};
const BARLEN=[.7,.7,.7,.7];                                         // equal on purpose: no ranking implied
const BARPIC=[EEL,GOBY,CHUB,SHRIMP];
// step 4 boxes
const EVX=28,EVW=212,EV_BOT=392;
const BOT=496,EVID_Y=128;
const CARD={x:652,y:16,w:292,h:550};
const BG=['a','b','b','c','b'];
const CARD_R={x:28,y:28,w:176,h:Math.round(176*AB_SH/AB_SW)};       // small "before" picture

// ── helpers (as in turtle / toolbox / casefile) ──────────────────────────
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
const bwrap=(c,p,x,y,w,size,col,lh,al='left')=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col,al));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=24,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),w=g.w,bx=al==='center'?x-w/2:al==='right'?x-w:x,by=y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,w,g.h,g.rows.length>1?14:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill=FILL,dash=null,t=0,minX=STAGE.x+8,maxX=STAGE.x+STAGE.w-8}={}){
  const w=tagW(c,p,size),h=size+18;let bx=al==='right'?x-w:al==='center'?x-w/2:x;bx=Math.max(minX,Math.min(bx,maxX-w));
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}
  D.round(c,bx,y,w,h,h/2,fill,rgba(col,.95));if(dash)c.restore();
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const lead=(c,x1,y1,x2,y2,t,col=WHITE)=>{K.dashed(c,[[x1,y1],[x2,y2]],rgba(INK,.7),5,[8,6],-t*10);K.dashed(c,[[x1,y1],[x2,y2]],col,2.5,[8,6],-t*10);};
// point along a polyline, u in 0..1 by length
function along(pts,u){let tot=0;const seg=[];for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);tot+=l;}
  let d=clamp(u)*tot;for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1){const r=seg[i]?Math.min(1,d/seg[i]):0;
    return{p:[mix(pts[i][0],pts[i+1][0],r),mix(pts[i][1],pts[i+1][1],r)],a:Math.atan2(pts[i+1][1]-pts[i][1],pts[i+1][0]-pts[i][0])};}d-=seg[i];}
  return{p:pts[pts.length-1],a:0};}
// hop route: rest at every point, glide between them; v in 0..1 over the whole route
function hop(pts,v){const n=pts.length-1,f=clamp(v)*n,i=Math.min(n-1,Math.floor(f)),r=f-i,g=smooth(clamp((r-.35)/.65));
  const p=[mix(pts[i][0],pts[i+1][0],g),mix(pts[i][1],pts[i+1][1],g)],a=Math.atan2(pts[i+1][1]-pts[i][1],pts[i+1][0]-pts[i][0]);return{p,a,moving:g>0&&g<1};}
// a drawn fish silhouette (dark body, light outline), head towards angle a
function fish(c,x,y,a,len,t,{ph=0,col=INK,edge=WHITE}={}){const w=len*.42,sw=.22*Math.sin(t*7+ph);
  c.save();c.translate(x,y);c.rotate(a);c.lineJoin='round';
  c.beginPath();c.moveTo(len*.5,0);c.quadraticCurveTo(len*.18,-w*.62,-len*.28,-w*.18);c.lineTo(-len*.5,-w*.62+sw*len*.3);c.lineTo(-len*.42,0);
  c.lineTo(-len*.5,w*.62+sw*len*.3);c.lineTo(-len*.28,w*.18);c.quadraticCurveTo(len*.18,w*.62,len*.5,0);c.closePath();
  c.fillStyle=col;c.fill();c.strokeStyle=rgba(edge,.9);c.lineWidth=1.8;c.stroke();
  circle(c,len*.3,-w*.12,1.6,edge,null);c.restore();}
// falling glints over a short drop
function fallGlints(c,x0,x1,y0,y1,t,n,ph=0){for(let i=0;i<n;i++){const v=mod(t*.9+i*.37+ph),x=mix(x0,x1,mod(i*.618+ph)),y=mix(y0,y1,v);
  c.save();c.globalAlpha*=.75*Math.sin(Math.PI*v);K.sline(c,[[x,y-7],[x,y+5]],WHITE,2.4);c.restore();}}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.fwSt||(s.fwSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=j=>j===k?(moving?clamp((x-.3)/.7):1):(moving&&j===st.from?1-clamp(x*1.6):0);
  const TT=j=>j===k?tau:99;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  D.round(c,STAGE.x,STAGE.y,STAGE.w,STAGE.h,14,'rgba(22,51,43,.92)',C.edge);
  c.save();c.beginPath();c.roundRect(STAGE.x,STAGE.y,STAGE.w,STAGE.h,14);c.clip();
  background(c,k,st,moving,x,u,t);
  step0(c,A(0),TT(0),t,rects);
  step1(c,A(1),TT(1),t,rects,k,st,moving,x,u);
  step2(c,A(2),TT(2),t,rects);
  step3(c,A(3),TT(3),t,rects);
  step4(c,A(4),TT(4),t,rects);
  c.restore();
  D.round(c,STAGE.x,STAGE.y,STAGE.w,STAGE.h,14,null,C.edge);
  statement(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const fw=measure(c,T.foot,22);text(c,T.foot,16,592,22,MUTED,'left');push(rects,1,'foot',{x:16,y:574,w:fw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── background pictures and their transitions ────────────────────────────
function pictAB(c,f,a=1){withA(c,a,()=>K.drawIn(c,f,AB,{radius:14,crop:AB_CROP}));}
function pictC(c,a=1){withA(c,a,()=>{
  // the section on top, a quiet panel underneath for the bars
  K.drawIn(c,CVC,CC,{crop:CC_CROP});
  K.sline(c,[[CC.x,CC.y+CC.h],[CC.x+CC.w,CC.y+CC.h]],C.edge,2);});}
function bgDraw(c,id,a,t){if(a<=0)return;
  if(id==='a')pictAB(c,CVA,a);else if(id==='b')pictAB(c,CVB,a);else pictC(c,a);
  // moving water on the pictures
  withA(c,a,()=>{
    if(id==='a'||id==='b'){fallGlints(c,ax(CREST[0][0])+6,ax(CREST[1][0])-6,ay(CREST[0][1])+4,ay(385),t,9);
      for(let i=0;i<4;i++){const v=mod(t*.12+i/4),gx=ax(330+170*mod(i*.43)+60*v),gy=ay(470+70*mod(i*.71));K.glow(c,gx,gy,10,WHITE,.4*Math.sin(Math.PI*v));}}
    if(id==='b')FALLS.forEach((p,i)=>fallGlints(c,p[0]-10,p[0]+10,p[1]-6,p[1]+8,t,2,i*.29));
    if(id==='c')SCREST.forEach((p,i)=>fallGlints(c,p[0]-4,p[0]+10,p[1],p[1]+22,t,3,i*.23));});}
function background(c,k,st,moving,x,u,t){
  const cur=BG[k],old=moving&&st.from>=0?BG[st.from]:cur;
  if(old===cur){bgDraw(c,cur,1,t);return;}
  if(old==='a'&&cur==='b'&&k===1){bgDraw(c,'b',1,t);return;}          // CV5a shrinks into the small card (drawn in step1)
  if((old==='a'&&cur==='b')||(old==='b'&&cur==='a')){                  // never crossfade CV5a and CV5b: dip through dark
    if(x<.5)bgDraw(c,old,1-smooth(x*2),t);else bgDraw(c,cur,smooth(x*2-1),t);return;}
  bgDraw(c,old,1,t);bgDraw(c,cur,u,t);}

// 0: a blocked river
function step0(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const R=AB;
  // fish push up towards the drop and fall back
  withA(c,clamp((q-.3)/.5),()=>FOAM.forEach((p,i)=>{const v=mod(t*.42+i*.33),push=Math.sin(Math.PI*clamp(v/.7)),fall=v>.7?(v-.7)/.3:0;
    const y=p[1]-28*push*(1-fall)+6*Math.sin(t*1.3+i),xx=p[0]+5*Math.sin(t*.9+i*2);
    fish(c,xx,y,-Math.PI/2+.18*Math.sin(t*.8+i),40,t,{ph:i});
    if(v>.62&&v<.8){const w=(v-.62)/.18;circle(c,xx,y-22,6+16*w,null,rgba(WHITE,.8*(1-w)),2);}}));
  // dashed arrow "upstream", stopped at the crest
  const ar=clamp((q-1.2)/.6);
  withA(c,ar,()=>{const x0=ax(455),yA=ay(425),yC=ay(318);
    K.dashed(c,[[x0,yA],[x0,yC+10]],rgba(INK,.7),6,[10,7],-t*10);K.dashed(c,[[x0,yA],[x0,yC+10]],WHITE,3,[10,7],-t*10);
    K.arrow(c,x0,yC+24,x0,yC+8,WHITE,3);
    withA(c,.5,()=>K.dashed(c,[[x0,yC-6],[x0,ay(250)]],WHITE,3,[6,8],-t*10));
    withA(c,clamp((q-2)/.4),()=>{const b=1+.12*Math.sin(t*4);K.sline(c,[[x0-22*b,yC-1],[x0+22*b,yC-1]],rgba(INK,.8),10);K.sline(c,[[x0-22*b,yC-1],[x0+22*b,yC-1]],ORANGE,6);});
    withA(c,clamp((q-1.4)/.4),()=>{const r=tag(c,T.up,x0,ay(250)-48,{al:'center',col:WHITE});push(rects,a,'up',r);});});
  // drop bracket
  withA(c,clamp((q-2.6)/.4),()=>{const x0=DROP_T[0]+6,y0=DROP_T[1],y1=DROP_B[1];
    [[INK,.8,7],[ORANGE,1,3.5]].forEach(([col,al,w])=>K.sline(c,[[x0-8,y0],[x0,y0],[x0,y1],[x0-8,y1]],rgba(col,al),w));
    const v=mod(t*.8);K.glow(c,x0,mix(y0,y1,v),9,ORANGE,.9);
    const r=tag(c,T.drop,x0+16,(y0+y1)/2-20,{col:ORANGE});push(rects,a,'drop',r);if(q>2.8&&q<6)ring(c,r,t,ORANGE);});
});}

// 1: the fishway (CV5a shrinks into the small "before" card)
function step1(c,a,q,t,rects,k,st,moving,x,u){
  // the small card: shrink from the whole stage when coming from step 0
  const shrink=k===1&&moving&&st.from===0;
  if(shrink){const f=smooth(x),r={x:mix(AB.x,CARD_R.x,f),y:mix(AB.y,CARD_R.y,f),w:mix(AB.w,CARD_R.w,f),h:mix(AB.h,CARD_R.h,f)};
    K.drawIn(c,CVA,r,{radius:mix(14,10,f),crop:AB_CROP});D.round(c,r.x,r.y,r.w,r.h,mix(14,10,f),null,rgba(WHITE,f));}
  if(a<=0)return;
  withA(c,a,()=>{
    // pools light up green one by one, then the light walks up the fishway
    POOLS.forEach((p,i)=>{const on=clamp((q-1-i*.3)/.3);if(on<=0)return;const w=.5+.5*Math.sin(t*2.2-i*.9);
      c.save();c.globalAlpha*=on;K.ellipse(c,p[0],p[1],19,10,rgba(GREEN,.18+.22*w),GREEN,3,-.55);c.restore();});
    withA(c,clamp((q-3)/.5),()=>{const v=mod(t*.25),pt=along([ENT,...POOLS,EXIT],v).p;K.glow(c,pt[0],pt[1],16,GREEN,.85);});
    // a fish climbs pool by pool
    withA(c,clamp((q-2.4)/.5),()=>{const v=mod((q-2.4)/7),h=hop(CLIMB,v),fa=v<.05?v/.05:v>.95?(1-v)/.05:1;
      withA(c,fa,()=>fish(c,h.p[0],h.p[1]-4,h.a,32,t));});
    // small card (stays after the shrink, fades in from other steps)
    if(!(k===1&&moving&&st.from===0)){K.drawIn(c,CVA,CARD_R,{radius:10,crop:AB_CROP});D.round(c,CARD_R.x,CARD_R.y,CARD_R.w,CARD_R.h,10,null,WHITE);}
    withA(c,clamp((q-.9)/.4),()=>{const r=tag(c,T.before,CARD_R.x,CARD_R.y+CARD_R.h+8,{col:WHITE});push(rects,a,'before',r);push(rects,a,'card',CARD_R);});
    // tags
    withA(c,clamp((q-1.2)/.4),()=>{const r=tag(c,T.fishway,STAGE.x+STAGE.w-12,40,{al:'right',col:GREEN});lead(c,r.x+r.w/2,r.y+r.h,POOLS[4][0]+4,POOLS[4][1]-14,t,GREEN);
      push(rects,a,'fishway',r);if(q>1.4&&q<4.5)ring(c,r,t,GREEN);});
    withA(c,clamp((q-2.2)/.4),()=>{const r=tag(c,T.pools,STAGE.x+STAGE.w-12,104,{al:'right',col:WHITE});lead(c,r.x+24,r.y+r.h,POOLS[2][0]-6,POOLS[2][1]-12,t);
      push(rects,a,'pools',r);});
  });}

// 2: where is the entrance
const FLOWS=[[[ENT[0]-4,ENT[1]],[ENT[0]-50,ENT[1]+8],[ENT[0]-110,ENT[1]+26]],[[ENT[0]-4,ENT[1]+4],[ENT[0]-40,ENT[1]+28],[ENT[0]-80,ENT[1]+54]],[[ENT[0]-4,ENT[1]-4],[ENT[0]-56,ENT[1]-16],[ENT[0]-120,ENT[1]-12]]];
const ATTR=[[ENT[0]-170,ENT[1]+40],FLOWS[0][2],FLOWS[0][1],ENT,POOLS[0]];
function step2(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  // spotlight on the lower end of the fishway
  const sp=clamp((q-.6)/.8);
  withA(c,sp,()=>{const g=c.createRadialGradient(ENT[0]+20,ENT[1]-6,60,ENT[0]+20,ENT[1]-6,190);g.addColorStop(0,rgba(INK,0));g.addColorStop(1,rgba(INK,.62));
    c.fillStyle=g;c.fillRect(STAGE.x,STAGE.y,STAGE.w,STAGE.h);});
  // two fish under the big fall (still searching)
  withA(c,clamp((q-.4)/.5),()=>[FOAM[0],FOAM[1]].forEach((p,i)=>{const y=p[1]+8*Math.sin(t*1.1+i*2);fish(c,p[0]+10*Math.sin(t*.7+i),y,-Math.PI/2+.4*Math.sin(t*.6+i*3),36,t,{ph:i});}));
  // outflow lines
  withA(c,clamp((q-1)/.5),()=>FLOWS.forEach((f,i)=>{K.dashed(c,f,rgba(INK,.6),6,[12,9],t*22+i*7);K.dashed(c,f,WHITE,3,[12,9],t*22+i*7);
    const e=f[f.length-1],d=f[f.length-2];K.arrow(c,mix(d[0],e[0],.6),mix(d[1],e[1],.6),e[0],e[1],WHITE,3);}));
  // entrance ring
  withA(c,clamp((q-1.4)/.4),()=>{const v=mod(t*.8);K.ellipse(c,ENT[0]+4,ENT[1]-2,24,15,rgba(GREEN,.18),GREEN,3.5,-.3);
    K.ellipse(c,ENT[0]+4,ENT[1]-2,24+14*v,15+9*v,null,rgba(GREEN,.9*(1-v)),2.5,-.3);});
  // one fish follows the outflow into the entrance
  withA(c,clamp((q-2)/.5),()=>{const v=mod((q-2)/5.5),h=hop(ATTR,v),fa=v<.06?v/.06:v>.94?(1-v)/.06:1;withA(c,fa,()=>fish(c,h.p[0],h.p[1],h.a,34,t));});
  // tags
  withA(c,clamp((q-1.6)/.4),()=>{const r=tag(c,T.ent,ENT[0]+44,ENT[1]+12,{col:GREEN});lead(c,r.x+4,r.y+r.h/2,ENT[0]+22,ENT[1]+4,t,GREEN);
    push(rects,a,'ent',r);if(q>1.8&&q<4.6)ring(c,r,t,GREEN);});
  withA(c,clamp((q-2.4)/.4),()=>{const r=tag(c,T.outflow,ENT[0]-20,ENT[1]-104,{al:'right',col:WHITE});const f=FLOWS[2][1];lead(c,r.x+r.w-30,r.y+r.h,f[0],f[1]-6,t);push(rects,a,'outflow',r);});
});}

// 3: the section and the bars
function step3(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  // a fish passes pool by pool (entrance lower right, exit upper left)
  const route=[S_IN,S_ENT,SP[5],SH[4],SP[4],SH[3],SP[3],SH[2],SP[2],SH[1],SP[1],SH[0],SP[0],S_EXIT];
  withA(c,clamp((q-.6)/.5),()=>{const v=mod((q-.6)/12),h=hop(route,v),fa=v<.03?v/.03:v>.97?(1-v)/.03:1;withA(c,fa,()=>fish(c,h.p[0],h.p[1],h.a,30,t));});
  // one step's drop
  withA(c,clamp((q-1.2)/.4),()=>{const b=STEP_BR;[[INK,.8,7],[WHITE,1,3]].forEach(([col,al,w])=>K.sline(c,[[b.x-7,b.y0],[b.x,b.y0],[b.x,b.y1],[b.x-7,b.y1]],rgba(col,al),w));
    const r=tag(c,T.oneStep,b.x+10,STAGE.y+10,{al:'center',col:WHITE});lead(c,r.x+r.w/2,r.y+r.h,b.x+2,b.y0-4,t);push(rects,a,'oneStep',r);if(q>1.4&&q<4)ring(c,r,t,WHITE);});
  withA(c,clamp((q-.8)/.4),()=>{const r=tag(c,T.ent,STAGE.x+STAGE.w-10,STAGE.y+10,{al:'right',col:GREEN});lead(c,r.x+r.w/2,r.y+r.h,S_ENT[0]+6,S_ENT[1]-14,t,GREEN);push(rects,a,'entC',r);});
  withA(c,clamp((q-1)/.4),()=>{const r=tag(c,T.exit,STAGE.x+10,STAGE.y+10,{col:GREEN});lead(c,r.x+22,r.y+r.h,S_EXIT[0]+4,S_EXIT[1]-8,t,GREEN);push(rects,a,'exitC',r);});
  // bars
  const B=BARS;
  withA(c,clamp((q-1.6)/.4),()=>{text(c,T.barHead,B.x+12,B.y+28,22,WHITE,'left');push(rects,a,'barHead',{x:B.x+12,y:B.y+8,w:measure(c,T.barHead,22),h:26});});
  const cw=(B.w-24)/2,ch=(B.h-44)/2;
  for(let i=0;i<4;i++){const col=i%2,row=i>>1,x0=B.x+12+col*cw,y0=B.y+40+row*ch,on=clamp((q-2-i*.45)/.4);
    withA(c,on,()=>{
      const pr=K.fitRect(BARPIC[i],x0,y0+3,74,ch-8);const bob=1.5*Math.sin(t*1.6+i);K.drawIn(c,BARPIC[i],{x:pr.x,y:pr.y+bob,w:pr.w,h:pr.h});
      const tx=x0+84,nm=T.res[i];text(c,nm,tx,y0+24,22,WHITE,'left');push(rects,1,'res'+i,{x:tx,y:y0+4,w:measure(c,nm,22),h:24});
      const bx=tx,bw=cw-96,by=y0+36,bh=14,g=smooth(clamp((q-2.2-i*.45)/.8))*BARLEN[i];
      c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*6;D.round(c,bx,by,bw,bh,7,rgba(WHITE,.06),rgba(WHITE,.45));c.restore();
      if(g>0){D.round(c,bx,by,bw*g,bh,7,rgba(WHITE,.85),null);const v=mod(t*.5+i*.27);K.glow(c,bx+bw*g*v,by+bh/2,10,WHITE,.9);}
      push(rects,1,'bar'+i,{x:bx,y:by,w:bw,h:bh});});}
});}

// 4: three kinds of evidence
function evGeo(c,i){const rows=blines(c,T.ev[i],EVW-24);return{rows,h:18+rows.length*LH+12};}
function step4(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  withA(c,clamp((q-.2)/.6),()=>{c.fillStyle=rgba(INK,.5);c.fillRect(STAGE.x,STAGE.y,STAGE.w,STAGE.h);});
  // the route: evidence (cyan) up to the entrance, still to check (white dashed) after it
  const r1=[AP([400,540]),AP([470,522]),ENT],r2=[ENT,...POOLS,EXIT,UPR];
  withA(c,clamp((q-.8)/.5),()=>{K.sline(c,r1,rgba(INK,.6),7);K.dashed(c,r1,CYAN,3.5,[10,7],-t*10);});
  withA(c,clamp((q-2.2)/.5),()=>{K.sline(c,r2,rgba(INK,.5),6);K.dashed(c,r2,WHITE,2.5,[6,8],-t*8);});
  withA(c,clamp((q-1)/.5),()=>{const v=mod((q-1)/5),h=hop(r1,Math.min(1,v*1.4)),fa=v>.9?(1-v)/.1:Math.min(1,v/.05);withA(c,fa,()=>fish(c,h.p[0],h.p[1],h.a,34,t));});
  // "?" on the unknown parts
  [[POOLS[2],2.6],[UPR,3.8]].forEach(([p,t0])=>withA(c,clamp((q-t0)/.4),()=>{const b=1+.08*Math.sin(t*3+t0);
    c.save();c.setLineDash([5,4]);c.lineDashOffset=-t*6;circle(c,p[0],p[1],15*b,FILL,WHITE,2.5);c.restore();
    c.save();c.font=K.MONO(22);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('?',p[0],p[1]+1);c.restore();}));
  // the three boxes, stacked from the bottom (entrance) to the top (upstream)
  const g=[0,1,2].map(i=>evGeo(c,i)),ys=[];ys[0]=EV_BOT-g[0].h;ys[2]=STAGE.y+14;ys[1]=Math.round((ys[2]+g[2].h+ys[0])/2-g[1].h/2);
  const targets=[ENT,POOLS[2],UPR],t0=[1,2.2,3.4];
  for(let i=0;i<3;i++){const on=clamp((q-t0[i])/.4);if(on<=0)continue;withA(c,on,()=>{
    const y=ys[i],h=g[i].h,lit=i===0,col=lit?CYAN:WHITE,tg=targets[i];
    lead(c,EVX+EVW,y+h-12,tg[0]-(i===0?14:16),tg[1]+(i===2?0:-4),t,col);
    if(lit)D.round(c,EVX,y,EVW,h,14,FILL,CYAN);else{c.save();c.setLineDash([9,6]);c.lineDashOffset=-t*8;D.round(c,EVX,y,EVW,h,14,FILL,WHITE);c.restore();}
    if(lit){c.save();c.lineWidth=3;c.strokeStyle=CYAN;c.beginPath();c.roundRect(EVX,y,EVW,h,14);c.stroke();c.restore();}
    g[i].rows.forEach((r,j)=>text(c,r,EVX+EVW/2,y+18+18+j*LH,22,col,'center'));
    push(rects,on,'ev'+i,{x:EVX,y,w:EVW,h});
    if(!lit){const r=tag(c,T.check,EVX+EVW+10,y-2,{col:WHITE,dash:[6,4],t,minX:0});push(rects,on,'chk'+i,r);}
    const cyc=mod((q-5.4)/4.5);if(q>5.4&&Math.floor(cyc*3)===i)ring(c,{x:EVX,y,w:EVW,h},t,col);});}
  // "≠" between the boxes
  for(let i=0;i<2;i++){const on=clamp((q-t0[i+1]+.3)/.4);if(on<=0)continue;const yA=ys[i],yB=ys[i+1]+g[i+1].h,ym=(yA+yB)/2;
    withA(c,on,()=>{c.save();c.font=K.MONO(30);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('≠',EVX+EVW/2,ym+1);c.restore();});}
  // evidence box
  withA(c,clamp((q-4.4)/.5),()=>{const r=box(c,T.evid,STAGE.x+STAGE.w-10,EVID_Y,{maxW:340,al:'right',stroke:CYAN,col:CYAN});push(rects,a,'evid',r);if(q>4.6&&q<7.5)ring(c,r,t,CYAN);});
  s_dbg.ev=ys.map((y,i)=>({y,h:g[i].h}));
});}

// ── statement under the stage ────────────────────────────────────────────
function statement(c,k,st,moving,x,tau,t,rects){
  const cx=STAGE.x+STAGE.w/2,sd=[3.6,3.6,3.8,4.4,5.2];
  const one=(kk,a,live)=>withA(c,a,()=>{
    const qa=live?clamp((tau-sd[kk])/.5):1;
    withA(c,qa,()=>{const b=box(c,T.st[kk],cx,BOT,{maxW:STAGE.w,al:'center',stroke:WHITE,col:WHITE});
      if(live){push(rects,qa*a,'say',b);s_dbg.bottom=b.y+b.h;if(tau>sd[kk]+.5&&tau<sd[kk]+4)ring(c,b,t,WHITE);}});});
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const axx=x+21,ayy=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='drop'){K.sline(c,[[axx-6,ayy-12],[axx+2,ayy-12],[axx+2,ayy+12],[axx-6,ayy+12]],ORANGE,3.5);K.glow(c,axx+2,ayy-12+24*mod(t*.8),8,ORANGE,.9);}
  else if(kind==='fish'){fish(c,axx,ayy,Math.PI*.0+.1*Math.sin(t),34,t);}
  else if(kind==='ladder'){for(let i=0;i<4;i++){const on=.5+.5*Math.sin(t*2.2-i*.9);K.ellipse(c,x+6+i*10,ayy+10-i*7,7,4,rgba(GREEN,.2+.3*on),GREEN,2);}}
  else if(kind==='before'){K.drawIn(c,CVA,{x:x+1,y:y+5,w:40,h:30},{radius:4,crop:AB_CROP});D.round(c,x+1,y+5,40,30,4,null,WHITE);}
  else if(kind==='flow'){for(let i=0;i<2;i++)K.dashed(c,[[x+40,ayy-5+i*10],[x+4,ayy-1+i*14]],WHITE,2.5,[7,5],t*16+i*4);}
  else if(kind==='door'){const v=mod(t*.8);K.ellipse(c,axx,ayy,15,9,rgba(GREEN,.18),GREEN,3);K.ellipse(c,axx,ayy,15+8*v,9+5*v,null,rgba(GREEN,.9*(1-v)),2);}
  else if(kind==='bar'){c.save();c.setLineDash([5,4]);D.round(c,x+2,ayy-6,40,12,6,null,rgba(WHITE,.45));c.restore();D.round(c,x+2,ayy-6,26+6*pul,12,6,rgba(WHITE,.85),null);}
  else if(kind==='nodata'){c.save();c.setLineDash([5,4]);c.lineDashOffset=-t*6;D.round(c,x+2,y+2,40,28,8,null,WHITE);c.restore();
    c.save();c.font=K.MONO(22);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('?',axx+1,ayy+1);c.restore();}
  else if(kind==='cyan'){D.round(c,x+2,y+3,40,26,8,FILL,CYAN);K.glow(c,axx+1,ayy,14,CYAN,.2+.3*pul);}
  else if(kind==='dash'){c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*8;D.round(c,x+2,y+3,40,26,8,FILL,WHITE);c.restore();}}
const tlines=(c,p,w)=>/[一-鿿]/.test(D.tr(p))?blines(c,p,w):greedyBal(c,D.tr(p),w);
const twrap=(c,p,x,y,w)=>{const r=tlines(c,p,w);r.forEach((q,i)=>text(c,q,x,y+i*28,22,WHITE,'left'));return r.length*28;};
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:WHITE});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  const RH2=34;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH2/2,rows=blines(c,p,iw-42),hh=RH2+(rows.length-1)*LH;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,2,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh;});
  y+=4;K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=8;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>twrap(c,T.names[st.from],ix,ty,iw));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=tlines(c,T.names[k],iw).length*28;withA(c,na,()=>twrap(c,T.names[k],ix,ty,iw));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=T.leg[k],lhs=legs.map(([,p])=>Math.max(50,blines(c,p,iw-54).length*27+12));
  const ly=R.y+R.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+4,t);
    const h=bwrap(c,p,ix+54,yy+22,iw-54,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+54,y:yy+2,w:iw-54,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.fishway=draw;
window.EnvironmentDraw.fishway.dbg=s_dbg;
})();

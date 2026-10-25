/* Unit 11 lesson 3 · "materials" canvas (traditional-knowledge tab, view 2), 2026-10-25. Natural materials have conditions
 * (plan section 4, materials; P3, supplement). Three steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step.
 * Layout (as citizen / tradeoff): left = stage window (x 16..636, y 16..428), statement box under it (y 436..), right = step card
 * (x 652..944).
 *  0 collecting: the four CV11 materials (bamboo, pandan leaves, areca sheath, banana leaf; common names, no people named) stand in
 *    a row with their names, a white frame visits them in turn. Under them two schematic "source" tanks (green = amount of the
 *    source, plan 1.4 population / protection colour): green "regrows" dots flow in at the same rate on both; an orange "collected"
 *    arrow (orange = taking out, pressure) is thin on the left ("not more than regrows": the level stays near the white dashed
 *    starting line) and thick on the right ("more than regrows": the level sinks below the line and the tank pulses orange).
 *  1 making and reuse: one material at a time (they take turns) -> clock "time" + bar "effort" fill while it is made -> a plain
 *    card "the finished item" (no object is drawn: no AI or drawn cultural objects, plan 4 / 7.4). Below, "how many uses?": the same
 *    white making bar for "used once" (one cyan use dot, the whole bar on it) and "used many times" (cyan dots appear one by one and
 *    the bar splits into one share per use). Box: "the number of uses affects whether it is worth it". No numbers.
 *  2 after use: left, the leaf litter (EC7 green -> brown -> skeleton leaf on a drawn litter / soil band; crumbs drift into the
 *    soil; recall ecology). Right, the four materials again, each in a white dashed box with "?" (white dashed = to check,
 *    plan 1.4) and a white dashed box "how fast? check it". No days, years or rates (the book's "28 days" is not used).
 *  Every step change fades the old scene out, then the new one in. Stepping back shows the step complete.
 * Always moving: the frame walks, dots flow, levels breathe, clock turns, dots count, leaves sway, crumbs fall, dashes march.
 * Pictures (alpha bounds = whole picture, PIL): CV11_bamboo 187x400, CV11_pandan 248x431 (a few small white specks between the
 * leaves, known), CV11_areca_sheath 241x429, CV11_banana_leaf 173x447; ecology_ai_1023 EC7_leaf_green 533x925, EC7_leaf_brown
 * 530x926, EC7_leaf_skeleton 530x924 (EC7_leaf_soil not used: white rim on the board colour; the soil is drawn).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=9,MOVE=1.2,TAU=Math.PI*2;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const CYAN=(K.COL&&K.COL.evidence)||'#55e9ff',ORANGE=(K.COL&&K.COL.pressure)||'#fb923c',GREEN=(K.COL&&K.COL.count)||'#4ade80';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const MATF=[ENV+'CV11_bamboo.png',ENV+'CV11_pandan.png',ENV+'CV11_areca_sheath.png',ENV+'CV11_banana_leaf.png'];
const LEAF=['EC7_leaf_green.png','EC7_leaf_brown.png','EC7_leaf_skeleton.png'];
[...MATF,...LEAF].forEach(f=>{try{K.pic(K.src(f));}catch(e){}});

// ── labels ────────────────────────────────────────────────────────────────
const AI=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
const T={
 tab:P('天然素材的條件','Conditions for natural materials'),
 short:[P('採集','Collecting'),P('製作與重複使用','Making and reuse'),P('用完以後','After use')],
 names:[P('天然素材不是沒有成本','Natural materials are not cost-free'),P('製作，以及用幾次','Making it, and how many times it is used'),P('用完以後：要查證，不一概而論','After use: check, do not generalise')],
 // material names: Chinese given as explicit lines (a 7-character name does not fit a 150 px slot at 22 px)
 mat:[[P('竹子','Bamboo')],[P('露兜葉','Pandan'),P('（林投）','leaves')],[P('檳榔葉鞘','Areca sheath')],[P('香蕉葉','Banana leaf')]],
 within:P('沒有超過補充','Not more than regrows'),
 beyond:P('超過補充','More than regrows'),
 regrow:P('補充','Regrows'),
 take:P('採集','Taken'),
 make:P('製作要花時間和力氣','Making takes time and effort'),
 time:L('time','時間','Time'),
 effort:P('力氣','Effort'),
 done:P('做好的用品','The finished item'),
 uses:P('用幾次？','How many uses?'),
 once:P('用一次','Used once'),
 many:P('用很多次','Used many times'),
 worth:P('用的次數，影響值不值得','The number of uses affects whether it is worth it'),
 litter:P('落葉層：落葉被分解（回想生態）','Leaf litter: leaves are broken down (recall ecology)'),
 stage:[P('落下','Fallen'),P('變褐','Browned'),P('剩葉脈','Veins left')],
 four:P('這四種素材呢？','And these four?'),
 check:P('分解多快？要查證','How fast? Check it'),
 st:[P('採集會不會超過補充，要看量與方法','Whether collecting exceeds replenishment depends on amount and method'),
  P('製作要花時間和力氣；用的次數，影響值不值得','Making takes time and effort; the number of uses affects whether it is worth it'),
  P('分解要看條件：要查證，不一概而論','Decomposition depends on conditions: check, do not generalise')],
 leg:[[['green',P('綠色：來源的量、長回來的補充','Green: the source and what regrows')],['out',P('橘色箭頭：採集取走','Orange arrow: collecting')],['line',P('白色虛線：原本的量','White dashed line: the starting amount')]],
      [['bar',P('白色條：製作花的時間和力氣','White bar: the time and effort of making')],['dot',P('青點：用了一次','Cyan dot: one use')]],
      [['dash',P('白色虛線：要查證','White dashes: to check')],['leaf',P('落葉：在落葉層被分解','Leaves: broken down in the litter')]]],
 schem:P('示意，沒有數字','Schematic, no numbers'),
 ai:P(`圖：${AI[0]}`,`Pictures: ${AI[1]}`)
};

// ── geometry ─────────────────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412},CARD={x:652,y:16,w:292,h:550},BOT=436;
// step 0
const SX=[93,248,403,558],SLOT={y:20,w:150,h:224},IMG={y:28,w:124,h:146},NAME_Y=200;
const HALF=[26,336],TK={dx:120,w:84,y:304,h:114},TITLE_Y=252,START=.72;
// step 1
const MK=4.5,MIMG={x:30,y:76,w:108,h:122},CLK=[230,130],EFF={x:300,y:100,w:30,h:58},DONE={x:404,y:92,w:220,h:76};
const BAR={x:40,w:340,h:22},ROWA=262,ROWB=346,MAXN=8;
// step 2
const GROUND=304,LX=[84,200,316],LH0=164,RX=412,CELL={w:102,h:116},CY0=74;

// ── helpers (as in citizen) ──────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
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
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}
  D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill=FILL,dash=null,t=0,minX=WIN.x+6,maxX=WIN.x+WIN.w-6}={}){
  const w=tagW(c,p,size),h=size+18;let bx=al==='right'?x-w:al==='center'?x-w/2:x;bx=Math.max(minX,Math.min(bx,maxX-w));
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}
  D.round(c,bx,y,w,h,h/2,fill,rgba(col,.95));if(dash)c.restore();
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const ap=(pop,tau,at,d=.45)=>pop?clamp((tau-at)/d):1;
function tick(c,x,y,s=1,col=CYAN){c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=col;c.lineWidth=4*s;c.beginPath();c.moveTo(x-9*s,y);c.lineTo(x-3*s,y+7*s);c.lineTo(x+10*s,y-8*s);c.stroke();c.restore();}
// a centred label line (or two) that measures itself; returns its rect
function label(c,p,cx,y,col,rects,a,id){const w=measure(c,p,22);text(c,p,cx,y,22,col,'center');push(rects,a,id,{x:cx-w/2,y:y-19,w,h:24});return w;}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.matSt||(s.matSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const pop=!(st.from===k+1);
  if(moving&&st.from>=0)scene(c,st.from,1-smooth(clamp(x*2)),99,t,false,null);
  const a=moving?smooth(clamp(x*2-1)):1;
  scene(c,k,a,tau-(moving?MOVE*.5:0),t,pop,a>=.99?rects:null);
  under(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const sw=measure(c,T.schem,22);text(c,T.schem,16,592,22,MUTED,'left');push(rects,1,'schem',{x:16,y:574,w:sw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,944,592,22,MUTED,'right');push(rects,1,'aiNote',{x:944-aw,y:574,w:aw,h:24});
}
function scene(c,k,a,tau,t,pop,rects){withA(c,a,()=>{
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,14,'rgba(22,51,43,.92)',C.edge);
  if(k===0)collect(c,tau,t,pop,rects);
  else if(k===1)making(c,tau,t,pop,rects);
  else after(c,tau,t,pop,rects);});}

// ── step 0: collecting ───────────────────────────────────────────────────
function matName(c,j,cx,y,col,rects,a){
  const L0=T.mat[j],en=D.tr(P('','x'))==='x';
  let rows=L0.length>1?L0.map(p=>D.tr(p)):[D.tr(L0[0])];
  if(en){rows=greedy(c,L0.map(p=>D.tr(p)).join(' '),SLOT.w-8);} // English: wrap by words in the slot
  rows.forEach((r,i)=>{const w=measure(c,r,22);text(c,r,cx,y+i*26,22,col,'center');push(rects,a,'mat'+j+'_'+i,{x:cx-w/2,y:y+i*26-19,w,h:24});});
  return rows.length;}
function collect(c,tau,t,pop,rects){
  const cyc=pop?(tau<PER?tau:mod(tau,PER)):99,rounds=pop?Math.floor(Math.max(0,tau)/PER):1;
  const act=Math.floor(mod(t/1.7,4));
  // the four materials
  MATF.forEach((f,j)=>{const a=ap(pop,tau,.15+.3*j);withA(c,a,()=>{const on=j===act;
    const R={x:SX[j]-SLOT.w/2,y:SLOT.y,w:SLOT.w,h:SLOT.h};
    D.round(c,R.x,R.y,R.w,R.h,12,on?'rgba(242,236,217,.08)':'rgba(11,26,21,.35)',on?WHITE:rgba(WHITE,.18));
    if(on){K.glow(c,SX[j],IMG.y+IMG.h/2,70,WHITE,.08+.05*Math.sin(t*3));ring(c,R,t,WHITE);}
    const sway=Math.sin(t*1.1+j*1.7)*.015;
    c.save();c.translate(SX[j],IMG.y+IMG.h);c.rotate(sway);c.translate(-SX[j],-(IMG.y+IMG.h));
    K.place(c,f,SX[j]-IMG.w/2,IMG.y,IMG.w,IMG.h);c.restore();
    matName(c,j,SX[j],NAME_Y,on?WHITE:rgba(WHITE,.9),rects,a);});});
  // two schematic source tanks
  const lv=(side)=>{
    if(side===0)return START+.025*Math.sin(t*1.3);
    if(!pop)return .3+.02*Math.sin(t*1.3);
    const drop=.42*smooth(clamp((cyc-3)/4.6));
    if(rounds>0&&cyc<3)return mix(START-.42,START,smooth(clamp(cyc/1.6)));
    return START-drop+.012*Math.sin(t*1.3);};
  HALF.forEach((hx,side)=>{const a=ap(pop,tau,1.9+.5*side);withA(c,a,()=>meter(c,hx,side,lv(side),a,t,rects));});
  s_dbg.lev=[lv(0),lv(1)];
}
function meter(c,hx,side,lev,a,t,rects){
  const title=side?T.beyond:T.within,tcol=side?ORANGE:GREEN;
  const r=tag(c,title,hx+145,TITLE_Y,{al:'center',col:tcol,minX:hx,maxX:hx+290});push(rects,a,'title'+side,r);
  const tx=hx+TK.dx,ty=TK.y,tw=TK.w,th=TK.h;
  // tank
  D.round(c,tx,ty,tw,th,10,'rgba(11,26,21,.6)',rgba(WHITE,.55));
  const lh=th*clamp(lev),ly=ty+th-lh;
  c.save();c.beginPath();c.rect(tx+3,ty+3,tw-6,th-6);c.clip();
  c.fillStyle=rgba(GREEN,.55);c.fillRect(tx,ly,tw,lh+4);
  // a small wave on the surface
  c.beginPath();c.moveTo(tx,ly);for(let q=0;q<=tw;q+=6)c.lineTo(tx+q,ly+2*Math.sin(q*.12+t*3));c.strokeStyle=GREEN;c.lineWidth=3;c.stroke();c.restore();
  // starting amount
  const sy=ty+th-th*START;K.dashed(c,[[tx-6,sy],[tx+tw+6,sy]],rgba(WHITE,.85),2.5,[7,5],-t*8);
  if(side===1&&lev<START-.12){const pu=.5+.5*Math.sin(t*4);D.round(c,tx-3,ty-3,tw+6,th+6,12,null,rgba(ORANGE,.5+.4*pu));K.glow(c,tx+tw/2,ty+th/2,60,ORANGE,.08+.08*pu);}
  // in: regrowth (same on both sides)
  const iy=ty+34,ix0=hx+8,ix1=tx-6;
  K.arrow(c,ix0,iy,ix1,iy,GREEN,5);
  for(let q=0;q<3;q++){const u=mod(t*.45+q/3);circle(c,mix(ix0,ix1-14,u),iy,5,GREEN,null);}
  const gw=measure(c,T.regrow,22),gx=Math.max(hx+gw/2+2,(ix0+ix1)/2);text(c,T.regrow,gx,iy-16,22,GREEN,'center');push(rects,a,'regrow'+side,{x:gx-gw/2,y:iy-35,w:gw,h:24});
  // out: collecting (thin = little, thick = a lot)
  const oy=ty+th-26,ox0=tx+tw+6,ox1=hx+286,ow=side?11:4,n=side?6:2,sp=side?.7:.35;
  K.arrow(c,ox0,oy,ox1,oy,ORANGE,ow);
  for(let q=0;q<n;q++){const u=mod(t*sp+q/n);circle(c,mix(ox0+4,ox1-18,u),oy,side?6:4,'#fed7aa',null);}
  const ow2=measure(c,T.take,22),ocx=Math.min(hx+286-ow2/2,(ox0+ox1)/2);text(c,T.take,ocx,oy-20,22,ORANGE,'center');push(rects,a,'take'+side,{x:ocx-ow2/2,y:oy-39,w:ow2,h:24});
}

// ── step 1: making and reuse ─────────────────────────────────────────────
function clockIcon(c,x,y,r,t,spin){circle(c,x,y,r,'rgba(242,236,217,.06)',WHITE,3);
  for(let i=0;i<12;i++){const an=i/12*TAU;K.sline(c,[[x+(r-6)*Math.sin(an),y-(r-6)*Math.cos(an)],[x+(r-2)*Math.sin(an),y-(r-2)*Math.cos(an)]],rgba(WHITE,.6),1.5);}
  const m=spin,h=spin/12;K.sline(c,[[x,y],[x+(r-8)*Math.sin(m),y-(r-8)*Math.cos(m)]],WHITE,3);K.sline(c,[[x,y],[x+(r-14)*Math.sin(h),y-(r-14)*Math.cos(h)]],WHITE,4);circle(c,x,y,3.5,WHITE,null);}
function making(c,tau,t,pop,rects){
  // which material, and how far the making has gone
  const base=pop?Math.max(0,tau):t+50,mi=Math.floor(base/MK)%4,mc=mod(base,MK);
  const mk=smooth(clamp((mc-.6)/2.4)),doneA=clamp((mc-3.1)/.35)*clamp((MK-mc)/.35),fadeIn=clamp(mc/.35)*clamp((MK-mc)/.3);
  const ha=ap(pop,tau,.1);
  withA(c,ha,()=>{const r=tag(c,T.make,WIN.x+12,WIN.y+10,{col:WHITE});push(rects,ha,'make',r);});
  const ra=ap(pop,tau,.3);
  withA(c,ra,()=>{
    D.round(c,MIMG.x-6,MIMG.y-4,MIMG.w+12,MIMG.h+8,12,'rgba(11,26,21,.35)',rgba(WHITE,.25));
    withA(c,fadeIn,()=>K.place(c,MATF[mi],MIMG.x,MIMG.y,MIMG.w,MIMG.h));
    K.arrow(c,MIMG.x+MIMG.w+12,CLK[1],CLK[0]-40,CLK[1],rgba(WHITE,.8),3.5);
    // time
    const spin=t*(.6+5*(mk>0&&mk<1?1:0))+mk*TAU*2;clockIcon(c,CLK[0],CLK[1],30,t,spin);
    label(c,T.time,CLK[0],186,WHITE,rects,ra,'time');
    // effort: a bar that fills while it is made
    D.round(c,EFF.x,EFF.y,EFF.w,EFF.h,6,'rgba(11,26,21,.6)',WHITE);
    const eh=(EFF.h-6)*mk;D.round(c,EFF.x+3,EFF.y+EFF.h-3-eh,EFF.w-6,eh,4,rgba(WHITE,.8),null);
    if(mk>0&&mk<1)K.glow(c,EFF.x+EFF.w/2,EFF.y+EFF.h/2,30,WHITE,.12+.08*Math.sin(t*6));
    label(c,T.effort,EFF.x+EFF.w/2,186,WHITE,rects,ra,'effort');
    K.arrow(c,EFF.x+EFF.w+16,CLK[1],DONE.x-10,CLK[1],rgba(WHITE,.8),3.5);
    // the finished item: a plain card (no object drawn)
    c.save();c.setLineDash([7,6]);D.round(c,DONE.x,DONE.y,DONE.w,DONE.h,12,'rgba(11,26,21,.35)',rgba(MUTED,.45));c.restore();
    withA(c,doneA,()=>{D.round(c,DONE.x,DONE.y,DONE.w,DONE.h,12,'rgba(242,236,217,.10)',WHITE);
      const w=measure(c,T.done,22),cx=DONE.x+(DONE.w-34)/2;text(c,T.done,cx,DONE.y+DONE.h/2+8,22,WHITE,'center');
      push(rects,doneA>.99?1:0,'done',{x:cx-w/2,y:DONE.y+DONE.h/2-11,w,h:24});
      circle(c,DONE.x+DONE.w-22,DONE.y+DONE.h/2,13,FILL,WHITE,2);tick(c,DONE.x+DONE.w-22,DONE.y+DONE.h/2,.75,WHITE);});
  });
  // how many uses
  const ua=ap(pop,tau,1.6);
  withA(c,ua,()=>{K.sline(c,[[WIN.x+12,212],[WIN.x+WIN.w-12,212]],rgba(WHITE,.18),2);
    const r=tag(c,T.uses,WIN.x+12,220,{col:CYAN});push(rects,ua,'uses',r);});
  const cyc=pop?(tau<PER?tau:mod(tau,PER)):99;
  const nB=pop?(cyc<2.6?1:Math.min(MAXN,1+Math.floor((cyc-2.6)/.55))):MAXN;
  const newest=pop&&cyc<2.6+MAXN*.55?nB-1:Math.floor(mod(t/.8,MAXN));
  const rowA=ap(pop,tau,1.9),rowB=ap(pop,tau,2.3);
  withA(c,rowA,()=>useRow(c,T.once,ROWA,1,0,t,rects,rowA,'once'));
  withA(c,rowB,()=>useRow(c,T.many,ROWB,nB,newest,t,rects,rowB,'many'));
  const wa=ap(pop,tau,5.4);
  withA(c,wa,()=>{const b=box(c,T.worth,513,ROWA+10,{al:'center',maxW:214,stroke:CYAN});push(rects,wa,'worth',b);
    if(pop&&tau>5.6&&tau<8.6)ring(c,b,t,CYAN);s_dbg.worthBottom=b.y+b.h;});
  s_dbg.nB=nB;
}
function useRow(c,p,y,n,hi,t,rects,a,id){
  const w=measure(c,p,22);text(c,p,BAR.x,y+18,22,WHITE,'left');push(rects,a,id,{x:BAR.x,y:y-1,w,h:24});
  const by=y+28,seg=BAR.w/n;
  D.round(c,BAR.x,by,BAR.w,BAR.h,6,rgba(WHITE,.72),null);
  // the share of the newest use is lit; dividers between shares
  if(n>1){D.round(c,BAR.x+seg*hi+1,by,seg-2,BAR.h,5,rgba(CYAN,.85),null);
    for(let i=1;i<n;i++)K.sline(c,[[BAR.x+seg*i,by-3],[BAR.x+seg*i,by+BAR.h+3]],'#16332b',3);}
  else{const pu=.5+.5*Math.sin(t*3);D.round(c,BAR.x,by,BAR.w,BAR.h,6,rgba(CYAN,.35+.3*pu),null);}
  for(let i=0;i<n;i++){const dx=BAR.x+seg*(i+.5),on=i===hi;circle(c,dx,by+BAR.h+16,on?8:6,CYAN,null);
    if(on){const pu=mod(t*1.2);circle(c,dx,by+BAR.h+16,8+8*pu,null,rgba(CYAN,.8*(1-pu)),2);}}
}

// ── step 2: after use ────────────────────────────────────────────────────
function after(c,tau,t,pop,rects){
  const ha=ap(pop,tau,.1);let hb=null;
  withA(c,ha,()=>{hb=box(c,T.litter,WIN.x+12,WIN.y+10,{maxW:376});push(rects,ha,'litter',hb);});
  // ground: litter layer and soil (drawn)
  const ga=ap(pop,tau,.3);
  withA(c,ga,()=>{const gx0=WIN.x+4,gx1=RX-12;
    const g=c.createLinearGradient(0,GROUND,0,WIN.y+WIN.h);g.addColorStop(0,'#4a3624');g.addColorStop(.25,'#3a2b1d');g.addColorStop(1,'#2a2017');
    c.save();c.beginPath();c.moveTo(gx0,GROUND);for(let q=gx0;q<=gx1;q+=10)c.lineTo(q,GROUND+3*Math.sin(q*.09));c.lineTo(gx1,WIN.y+WIN.h-4);c.lineTo(gx0,WIN.y+WIN.h-4);c.closePath();c.fillStyle=g;c.fill();c.restore();
    const R=K.rng(7);for(let i=0;i<60;i++){const px=mix(gx0+6,gx1-6,R()),py=mix(GROUND+6,WIN.y+WIN.h-10,R()),sz=1.5+R()*3;circle(c,px,py,sz,i%3?'rgba(120,90,60,.55)':'rgba(170,140,90,.35)',null);}});
  // the leaf sequence (EC7)
  const leafH=LH0,leafW=leafH*530/925;
  LEAF.forEach((f,j)=>{const a=ap(pop,tau,.6+.7*j);withA(c,a,()=>{const x=LX[j],sway=Math.sin(t*1.2+j)*.03;
    c.save();c.translate(x,GROUND+4);c.rotate(sway+(j-1)*.05);K.drawIn(c,f,{x:-leafW/2,y:-leafH,w:leafW,h:leafH},{alpha:j===2?.95:1});c.restore();
    label(c,T.stage[j],x,GROUND+34,WHITE,rects,a,'stage'+j);
    if(j>0)K.arrow(c,LX[j-1]+leafW/2+2,GROUND-leafH/2,x-leafW/2-4,GROUND-leafH/2,rgba(WHITE,.85),3);});});
  // time arrow under the leaves
  const ta=ap(pop,tau,2.4);
  withA(c,ta,()=>{const y=GROUND+66;const tw=measure(c,T.time,22);text(c,T.time,WIN.x+20,y+8,22,WHITE,'left');push(rects,ta,'timeArrow',{x:WIN.x+20,y:y-11,w:tw,h:24});
    const x0=WIN.x+20+tw+12,x1=RX-24;K.arrow(c,x0,y,x1,y,rgba(WHITE,.8),3);
    const v=mod(t*.25);K.glow(c,mix(x0,x1,v),y,14,WHITE,.6);
    // crumbs from the skeleton leaf drift into the soil
    for(let q=0;q<5;q++){const u=mod(t*.3+q/5),cx=LX[2]-20+q*10+Math.sin(t+q)*4,cy=mix(GROUND-30,GROUND+90,u);withA(c,Math.min(1,(1-u)*2.5,u*5),()=>circle(c,cx,cy,3,'#b89a6a',null));}});
  // divider
  withA(c,ga,()=>K.sline(c,[[RX-6,WIN.y+14],[RX-6,WIN.y+WIN.h-14]],rgba(WHITE,.16),2));
  // the four materials: how fast they break down is to be checked
  const fa=ap(pop,tau,3.2);
  withA(c,fa,()=>{const r=tag(c,T.four,WIN.x+WIN.w-10,WIN.y+10,{al:'right',col:WHITE,minX:RX-2});push(rects,fa,'four',r);});
  MATF.forEach((f,j)=>{const a=ap(pop,tau,3.6+.35*j);withA(c,a,()=>{const cx=RX+(j%2)*(CELL.w+8),cy=CY0+Math.floor(j/2)*(CELL.h+8);
    c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*10;D.round(c,cx,cy,CELL.w,CELL.h,10,'rgba(11,26,21,.35)',rgba(WHITE,.85));c.restore();
    K.place(c,f,cx+6,cy+8,CELL.w-30,CELL.h-16);
    const qx=cx+CELL.w-16,qy=cy+18,pu=mod(t*.8+j*.25);
    circle(c,qx,qy,13,FILL,WHITE,2);circle(c,qx,qy,13+7*pu,null,rgba(WHITE,.7*(1-pu)),2);
    c.save();c.font=K.MONO(20);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('?',qx,qy+1);c.restore();});});
  const ca=ap(pop,tau,5.2);
  withA(c,ca,()=>{const b=box(c,T.check,RX+CELL.w+4,CY0+2*CELL.h+28,{al:'center',maxW:212,dash:[8,6],t});push(rects,ca,'check',b);
    if(pop&&tau>5.4&&tau<8.4)ring(c,b,t,WHITE);s_dbg.checkBottom=b.y+b.h;});
  s_dbg.headBottom=hb?hb.y+hb.h:0;
}

// ── statements under the stage ───────────────────────────────────────────
function under(c,k,st,moving,x,tau,t,rects){
  const cx=WIN.x+WIN.w/2,sd=[6.6,6.2,6.4][k];
  const one=(kk,a,live)=>withA(c,a,()=>{
    const col=kk===0?GREEN:kk===1?CYAN:WHITE;
    const qa=live?(st.from===kk+1?1:clamp((tau-sd)/.5)):1;
    withA(c,qa,()=>{const b=box(c,T.st[kk],cx,BOT,{maxW:WIN.w,al:'center',stroke:col,dash:kk===2?[8,6]:null,t});if(live){push(rects,qa,'say',b);if(tau>sd+.5&&tau<sd+3)ring(c,b,t,col);}s_dbg.sayBottom=b.y+b.h;});
  });
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='green'){D.round(c,x+4,y+4,22,26,4,'rgba(11,26,21,.6)',rgba(WHITE,.55));D.round(c,x+6,y+14,18,14,3,rgba(GREEN,.6),null);K.arrow(c,x+26,y+10,x+40,y+10,GREEN,3);K.glow(c,ax,ay,16,GREEN,.08+.1*pul);}
  else if(kind==='out'){K.arrow(c,x+2,ay,x+40,ay,ORANGE,6);K.glow(c,ax,ay,16,ORANGE,.08+.12*pul);}
  else if(kind==='line'){K.dashed(c,[[x+2,ay],[x+40,ay]],WHITE,2.5,[7,5],-t*8);}
  else if(kind==='bar'){D.round(c,x+2,y+8,38,16,4,rgba(WHITE,.72),null);D.round(c,x+2,y+8,12,16,4,rgba(CYAN,.4+.4*pul),null);}
  else if(kind==='dot'){circle(c,ax,ay,8,CYAN,null);circle(c,ax,ay,8+7*pul,null,rgba(CYAN,.6*(1-pul)),2);}
  else if(kind==='dash'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;D.round(c,x+3,y+4,36,24,6,FILL,WHITE);c.restore();}
  else if(kind==='leaf'){c.save();c.translate(ax,y+32);c.rotate(Math.sin(t*1.5)*.08);K.drawIn(c,LEAF[1],{x:-9,y:-32,w:18,h:32});c.restore();}}
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
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,1,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh;});
  y+=4;K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=8;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,28));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*28;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,28));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=T.leg[k],lhs=legs.map(([,p])=>Math.max(46,blines(c,p,iw-50).length*27+10));
  const ly=R.y+R.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+2,t);
    const h=bwrap(c,p,ix+50,yy+22,iw-50,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+50,y:yy+2,w:iw-50,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.materials=draw;
window.EnvironmentDraw.materials.dbg=s_dbg;
})();

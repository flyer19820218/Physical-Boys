/* Unit 11 lesson 2 · "conc" canvas (concentration-in-food-chain tab, view 2), 2026-10-25. Total is not concentration (plan section 3, conc).
 * Three steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (dots breathe, fish sway and wag their tails,
 * statement boxes ring, dashed lines march).
 * No pictures: two fish drawn in code, facing right. One unit of mass = one cell U = 44 px square. Big fish body ellipse rx 140, ry 80
 * (holds a 5 x 2 grid of cells = 10 units); small fish body rx 38, ry 28 (holds one cell = 1 unit); body areas 11200 : 1064, about 10 : 1.
 * Left 2/3 = stage (x 16..636). Right 1/3 = step card (x 652..944) as in uses / green: header (VIEWS.conc.tab), three step labels,
 * step title (VIEWS.conc.names), legend for the step, and at the bottom "Teaching numbers, not real measurements" (all steps).
 *  0 total: big fish (centre 206,170) and small fish (505,170) side by side; under each a name pill, a cyan mass pill
 *    ("Mass: 10 units" / "Mass: 1 unit") and a yellow count pill. Yellow dots jump into the bodies one by one (20 and 5, every dot
 *    drawn); the counts count up to "20 dots in all" / "5 dots in all"; a ">" between the counts; statement "Total: the big fish has more".
 *  1 divide by mass: same fish and dots (cross-fade, nothing moves). Cyan cell frames appear in the big fish one by one (10 cells,
 *    2 dots each) and around the small fish's 5 dots (1 cell). Formula pills "20 ÷ 10 = 2" / "5 ÷ 1 = 5" (dots yellow, mass cyan,
 *    result on a yellow chip), yellow-filled "2 per unit" / "5 per unit" with "<" between; yellow statement "Concentration: the small
 *    fish is higher"; white dashed caveat "Teaching numbers only: real fish need real measurements".
 *  2 same mass to compare: cross-fade to the two fish side by side (both at 0.75 scale), no food-chain arrow.
 *    One cell of each fish lights up (cyan) and dashed callouts open two equal tissue boxes (120 x 120, "Tissue of equal mass"):
 *    5 dots vs 2 dots. Statements "To read concentration, first check the mass compared" (yellow), "A larger total is not a higher
 *    concentration" (white) and the same white dashed caveat.
 * Colours (plan 1.4 wins over the brief): hard-to-remove substance and concentration = yellow #fde047 (dots, counts, per-unit chips);
 * mass = cyan #55e9ff (mass pills, cells, tissue boxes; cyan is not otherwise used in this tab); unknown / caveat = white dashed box.
 * All numbers are teaching numbers (card footer, every step).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const N=3,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,YELLOW=K.COL.conc,CYAN='#55e9ff',INK=C.ink;
const FILL='rgba(11,26,21,.92)';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('總量不等於濃度','Total is not concentration'),
 short:[P('算總量','Total'),P('除以質量','Divide by mass'),P('同質量才能比','Same mass to compare')],
 names:[P('大魚的總量比較多','The big fish has the larger total'),P('每單位質量：小魚比較高','Per unit mass: the small fish is higher'),P('比濃度，要先確認質量','Compare concentrations: fix the mass first')],
 big:P('大魚','Big fish'),small:P('小魚','Small fish'),
 massBig:P('質量 10 單位','Mass: 10 units'),massSmall:P('質量 1 單位','Mass: 1 unit'),
 count:n=>P(`共 ${n} 點`,`${n} dots in all`),
 perBig:P('每單位 2','2 per unit'),perSmall:P('每單位 5','5 per unit'),
 totalMore:P('總量：大魚較多','Total: the big fish has more'),
 concHigh:P('濃度：小魚較高','Concentration: the small fish is higher'),
 caveat:P('這只是教學數字，真實的魚要看實際測量','Teaching numbers only; real fish must be measured'),
 chain:P('食物鏈\u200b（示意）','Food chain (schematic)'),
 tissue:P('同質量的組織','Tissue of equal mass'),
 dots5:P('5 點','5 dots'),dots2:P('2 點','2 dots'),
 checkMass:P('看濃度，要先確認比較的質量','To read concentration, first check the mass compared'),
 notEq:P('總量多，不等於濃度高','A larger total is not a higher concentration'),
 teach:P('教學數字，不是真實測量','Teaching numbers, not real measurements'),
 legDot:P('黃點：某種難排除的物質','Yellow dot: hard-to-remove substance'),
 legMass:P('青：質量','Cyan: mass'),
 legCell:P('青框：1 格＝1 單位質量','Cyan cell: 1 unit of mass'),
 
};
// formulas: [dots, mass, result]
const FORM={big:['20','10','2'],small:['5','1','5']};

// ── geometry ──────────────────────────────────────────────────────────────
const U=44;
const BIG={rx:140,ry:80},SMALL={rx:38,ry:28};
const POS0={big:{x:210,y:170,s:1},small:{x:505,y:170,s:1}};      // steps 0 and 1
const POS2={small:{x:100,y:144,s:.75},big:{x:430,y:144,s:.75}};  // step 2 (food chain)
const COLX={big:210,small:505};
const ROW={name:262,mass:310,count:358,form:414,per:464,cav:526,stmt:16};
const CARD={x:652,y:16,w:292,h:550};
// dot positions, local to the fish centre. Big fish: 5 x 2 cells, 2 dots per cell (slightly varied); small fish: one cell, dice five.
const CELLS_BIG=[];for(let j=0;j<2;j++)for(let i=0;i<5;i++)CELLS_BIG.push([-110+U/2+U*i,-44+U/2+U*j]);
const DOTS_BIG=[];CELLS_BIG.forEach(([x,y],n)=>{const f=n%2?1:-1;DOTS_BIG.push([x-9,y-9*f],[x+9,y+9*f]);});
const DOTS_SMALL=[[0,0],[-11,-11],[11,-11],[-11,11],[11,11]];
const DOT_ORDER_BIG=[0,5,10,15,2,7,12,17,4,9,14,19,1,6,11,16,3,8,13,18];   // fill the body evenly while jumping in
const BIG_PICK=2;   // the cell lit in step 2 (top row, middle)

// ── helpers (as in the uses / green views) ───────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、])|(?<=[:,] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,22)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w){const n=greedy(c,str,w).length;if(n<2)return greedy(c,str,w);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// a box whose text may wrap (measured first, never below 22 px)
function boxGeo(c,p,maxW){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad):greedyBal(c,str,maxW-pad);
  const w=Math.max(...rows.map(r=>measure(c,r,22)))+pad,h=40+(rows.length-1)*LH;return{rows,w,h};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0}={}){
  const g=boxGeo(c,p,maxW),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:20,fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+28+i*LH,22,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
const boxRect=(c,p,x,y,maxW,al='center')=>{const g=boxGeo(c,p,maxW);return{x:al==='center'?x-g.w/2:x,y,w:g.w,h:g.h};};
// formula pill: dots (yellow) ÷ mass (cyan) = result (on a yellow chip)
function formula(c,f,cx,y){const zh=D.tr(P('a','b'))==='a',eq=zh?' ＝ ':' = ';
  const segs=[[f[0],YELLOW],[' ÷ ',WHITE],[f[1],CYAN],[eq,WHITE]],ws=segs.map(([s])=>measure(c,s,22)),rw=measure(c,f[2],22)+16;
  const w=ws.reduce((a,b)=>a+b,0)+rw+28,h=40,x=cx-w/2;
  D.round(c,x,y,w,h,20,FILL,rgba(WHITE,.85));
  let xx=x+14;segs.forEach(([s,col],i)=>{text(c,s,xx,y+28,22,col);xx+=ws[i];});
  D.round(c,xx,y+6,rw,h-12,8,YELLOW,null);text(c,f[2],xx+rw/2,y+28,22,INK,'center');
  return{x,y,w,h};}

// ── the fish (drawn in local coordinates, facing right) ──────────────────
function fishBody(c,g,t,ph,sel){
  const {rx,ry}=g,wag=Math.sin(t*2.6+ph)*.16,tl=rx*.32+6,th=ry*.62;
  c.save();c.lineJoin='round';c.lineWidth=2.5;c.strokeStyle=rgba(WHITE,.85);c.fillStyle='#1c3d34';
  // tail, hinged at the back of the body
  c.save();c.translate(-rx+4,0);c.rotate(wag);c.beginPath();c.moveTo(0,0);c.lineTo(-tl,-th);c.quadraticCurveTo(-tl*.7,0,-tl,th);c.closePath();c.fill();c.stroke();c.restore();
  // dorsal fin
  c.beginPath();c.moveTo(-rx*.3,-ry*.92);c.quadraticCurveTo(-rx*.18,-ry*1.36,rx*.12,-ry*.97);c.closePath();c.fill();c.stroke();
  // body
  c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.fill();c.stroke();
  if(sel)sel();
  // eye and gill line
  circle(c,rx*.84,-ry*.2,Math.max(3,ry*.065),WHITE,null);
  c.beginPath();c.strokeStyle=rgba(WHITE,.4);c.lineWidth=2;c.arc(rx*.62,0,ry*.62,-.75,.75);c.stroke();
  c.restore();}
const fishOf=k=>k==='big'?BIG:SMALL;
function dot(c,x,y,t,i,r=4.6,a=1){const br=r*(1+.13*Math.sin(t*2.2+i*1.7));withA(c,a,()=>circle(c,x,y,br,YELLOW,rgba(INK,.6),1.2));}
// a fish at pos with its dots; landed(i) gives alpha (0..1) of dot i; cells(i) gives alpha of cell frame i
function drawFish(c,key,pos,t,{landed=()=>1,cells=null,pick=null,ph=0}={}){
  const g=fishOf(key),bob=Math.sin(t*1.3+ph)*1.6;
  c.save();c.translate(pos.x,pos.y+bob);c.scale(pos.s,pos.s);
  fishBody(c,g,t,ph,null);
  const D0=key==='big'?DOTS_BIG:DOTS_SMALL,cl=key==='big'?CELLS_BIG:[[0,0]];
  if(cells)cl.forEach(([x,y],i)=>{const a=cells(i);if(a<=0)return;withA(c,a,()=>{c.save();c.lineWidth=2.5/pos.s;c.strokeStyle=rgba(CYAN,.9);
    c.strokeRect(x-U/2+1.5,y-U/2+1.5,U-3,U-3);c.restore();});});
  D0.forEach(([x,y],i)=>{const a=landed(i);if(a>=1)dot(c,x,y,t,i+(key==='big'?0:40));});
  if(pick!=null){const [x,y]=cl[pick.i],a=pick.a;withA(c,a,()=>{c.save();c.fillStyle=rgba(CYAN,.18);c.fillRect(x-U/2,y-U/2,U,U);
    c.lineWidth=4/pos.s;c.strokeStyle=CYAN;c.strokeRect(x-U/2,y-U/2,U,U);c.restore();});}
  c.restore();
  return bob;}
// screen point of a local point
const toScr=(pos,bob,[x,y])=>[pos.x+x*pos.s,pos.y+bob+y*pos.s];
const fishRect=(key,pos)=>{const g=fishOf(key),tl=g.rx*.32+6;return{x:pos.x-(g.rx+tl)*pos.s,y:pos.y-g.ry*1.36*pos.s-2,w:(2*g.rx+tl)*pos.s,h:(g.ry*2.36)*pos.s+4,fish:true};};

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.concSt||(s.concSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}   // first frame: follow the stage clock (step 0 plays from its start)
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}   // the same step clicked again: replay it
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  // steps 0 -> 1 share the same fish: the new scene is drawn at once, the old one only fades its own labels
  if(moving)scene(c,st.from,99,t,1-clamp(x*1.6),null,k);
  scene(c,k,tau,t,1,rects,-1,moving?st.from:-1);
  card(c,k,st,moving,x,u,tau,t,rects);
}

function scene(c,k,tau,t,a,rects,toK=-1,fromK=-1){
  if(a<=0.002)return;
  const at=(d,dur=.5)=>clamp((tau-d)/dur);
  withA(c,a,()=>{
    if(k===0)total(c,tau,t,rects,at,toK,fromK);
    else if(k===1)divide(c,tau,t,rects,at,toK,fromK);
    else chain(c,tau,t,rects,at);
  });
}
const push=(rects,a,id,q)=>{if(rects&&a>=1)rects.push({id,...q});};

// fish pair + name / mass / count pills, shared by steps 0 and 1. skipFish: the other scene draws the fish (no double drawing)
function pair(c,tau,t,rects,at,{jump=false,cells=null,skipFish=false}={}){
  const out={};
  ['big','small'].forEach((key,n)=>{
    const pos=POS0[key],D0=key==='big'?DOTS_BIG:DOTS_SMALL,cx=COLX[key];
    // jump schedule: big fish every .15 s, small fish every .6 s (both start at .4 s)
    const tj=i=>{if(!jump)return-1;if(key==='big')return .4+DOT_ORDER_BIG.indexOf(i)*.15;return .4+i*.6;};
    const landed=i=>jump?at(tj(i)+.42,.01):1;
    let bob=0;
    if(!skipFish){bob=drawFish(c,key,pos,t,{landed,cells,ph:n*1.9});
      if(rects)rects.push({id:'fish_'+key,...fishRect(key,pos)});}
    else bob=Math.sin(t*1.3+n*1.9)*1.6;
    // jumping dots (in flight)
    if(jump)D0.forEach((p,i)=>{const f=clamp((tau-tj(i))/.42);if(f<=0||f>=1)return;
      const [tx,ty]=toScr(pos,bob,p),ox=tx+(key==='big'?-30:24)*(i%2?1:-1),oy=pos.y-fishOf(key).ry-70;
      const q=K.bez([ox,oy],[(ox+tx)/2,oy-36],[tx,ty],ease(f));dot(c,q[0],q[1],t,i,4.6,clamp(f*4));});
    const nm=key==='big'?T.big:T.small,ms=key==='big'?T.massBig:T.massSmall;
    const na=jump?at(0,.4):1;
    withA(c,na,()=>{const q=box(c,nm,cx,ROW.name,{maxW:240,al:'center'});push(rects,na,'name_'+key,q);
      const r=box(c,ms,cx,ROW.mass,{maxW:240,al:'center',stroke:CYAN,col:CYAN});push(rects,na,'mass_'+key,r);});
    const nLand=D0.reduce((s0,_,i)=>s0+(landed(i)>=1?1:0),0);
    const ca=jump?at(.3,.4):1;
    withA(c,ca,()=>{const q=box(c,T.count(nLand),cx,ROW.count,{maxW:240,al:'center',stroke:YELLOW,col:YELLOW});push(rects,ca,'count_'+key,q);out[key]=q;
      if(jump&&tau<99&&nLand===D0.length&&tau<6)ring(c,q,t,YELLOW);});
  });
  return out;}
const midX=(c)=>{const a=boxRect(c,T.count(20),COLX.big,0,240),b=boxRect(c,T.count(5),COLX.small,0,240);return(a.x+a.w+b.x)/2;};
function cmp(c,sym,y,a,rects,id,col=WHITE){withA(c,a,()=>{const x=midX(c);c.save();c.font=K.MONO(34);c.fillStyle=col;c.textAlign='center';c.fillText(sym,x,y+31);c.restore();
  push(rects,a,id,{x:x-12,y:y+4,w:24,h:30});});}

function total(c,tau,t,rects,at,toK){
  // when fading out into step 1, the fish stay (step 1 draws them); only this step's own labels fade
  pair(c,tau,t,rects,at,{jump:true,skipFish:toK===1});
  cmp(c,'>',ROW.count,toK===1?0:at(3.6,.4),rects,'gt');
  const sa=at(4.2,.6);
  withA(c,sa,()=>{const q=box(c,T.totalMore,326,ROW.stmt,{maxW:600,al:'center'});push(rects,sa,'totalMore',q);if(tau<99&&tau>4.2)ring(c,q,t,WHITE);});
}
function divide(c,tau,t,rects,at,toK,fromK){
  const cellA={big:i=>at(.6+i*.15,.3),small:()=>at(.6+10*.15,.3)};
  // steps 1 -> 0 or 2: fish fade with the scene; step 0 -> 1: fish drawn at once (same place as in step 0)
  ['big','small'].forEach((key,n)=>{const pos=POS0[key];
    drawFish(c,key,pos,t,{cells:cellA[key],ph:n*1.9});if(rects)rects.push({id:'fish_'+key,...fishRect(key,pos)});
    // the cells' dots breathe a little more once their frame is on
  });
  // pills: name / mass / count stay as in step 0
  ['big','small'].forEach(key=>{const cx=COLX[key];
    push(rects,1,'name_'+key,box(c,key==='big'?T.big:T.small,cx,ROW.name,{maxW:240,al:'center'}));
    push(rects,1,'mass_'+key,box(c,key==='big'?T.massBig:T.massSmall,cx,ROW.mass,{maxW:240,al:'center',stroke:CYAN,col:CYAN}));
    push(rects,1,'count_'+key,box(c,T.count(key==='big'?20:5),cx,ROW.count,{maxW:240,al:'center',stroke:YELLOW,col:YELLOW}));});
  cmp(c,'>',ROW.count,.45,null,'gt');
  // formulas and per-unit chips
  ['big','small'].forEach((key,n)=>{const cx=COLX[key],fa=at(2.4+n*.5,.5),pa=at(3.4+n*.5,.5);
    withA(c,fa,()=>{const q=formula(c,FORM[key],cx,ROW.form);push(rects,fa,'form_'+key,q);});
    withA(c,pa,()=>{const q=box(c,key==='big'?T.perBig:T.perSmall,cx,ROW.per,{maxW:240,al:'center',stroke:YELLOW,col:INK,fill:YELLOW});push(rects,pa,'per_'+key,q);
      if(tau<99&&tau>3.4+n*.5)ring(c,q,t+n*.4,YELLOW);});});
  cmp(c,'<',ROW.per,at(4.6,.4),rects,'lt',YELLOW);
  const sa=at(5.2,.6);
  withA(c,sa,()=>{const q=box(c,T.concHigh,326,ROW.stmt,{maxW:600,al:'center',stroke:YELLOW,col:YELLOW});push(rects,sa,'concHigh',q);if(tau<99&&tau>5.2)ring(c,q,t,YELLOW);});
  const va=at(6.2,.6);
  withA(c,va,()=>{const q=box(c,T.caveat,326,ROW.cav,{maxW:610,al:'center',dash:[8,6],t});push(rects,va,'caveat',q);});
}
// step 2: food chain small -> big, one cell each opened into two equal tissue boxes
const TB={w:120,y:226};
function chain(c,tau,t,rects,at){
  const fa=at(.2,.6);
  const bobs={};
  withA(c,fa,()=>{['small','big'].forEach((key,n)=>{const pos=POS2[key];
    bobs[key]=drawFish(c,key,pos,t,{ph:n*1.9,pick:{i:key==='big'?BIG_PICK:0,a:at(1.6,.5)}});
    if(rects&&fa>=1)rects.push({id:'fish_'+key,...fishRect(key,pos)});});});
  if(bobs.small===undefined){bobs.small=0;bobs.big=0;}
  // names above the fish
  const na=at(.5,.5);
  ['small','big'].forEach(key=>withA(c,na,()=>{const q=box(c,key==='big'?T.big:T.small,POS2[key].x,ROW.stmt,{maxW:200,al:'center'});push(rects,na,'name2_'+key,q);}));
  // (2026-10-25: food-chain arrow removed. Showing small fish -> big fish with a LOWER concentration in the big fish contradicts the biomagnification view; the two fish are only compared by equal-mass tissue.)
  // tissue boxes, callouts from the lit cells
  ['small','big'].forEach((key,n)=>{const pos=POS2[key],cl=key==='big'?CELLS_BIG[BIG_PICK]:[0,0],bob=bobs[key];
    const bx=pos.x-TB.w/2,by=TB.y,oa=at(2.0+n*.3,.5);
    withA(c,oa,()=>{const [x0,y0]=toScr(pos,bob,[cl[0]-U/2,cl[1]+U/2]),[x1,y1]=toScr(pos,bob,[cl[0]+U/2,cl[1]+U/2]);
      K.dashed(c,[[x0,y0],[bx,by]],rgba(CYAN,.75),2,[6,6],-t*10);K.dashed(c,[[x1,y1],[bx+TB.w,by]],rgba(CYAN,.75),2,[6,6],-t*10);
      const z=ease(oa);c.save();c.translate(pos.x,by+TB.w/2);c.scale(mix(.3,1,z),mix(.3,1,z));
      D.round(c,-TB.w/2,-TB.w/2,TB.w,TB.w,10,'#16332b',CYAN);c.restore();
      if(rects&&oa>=1)rects.push({id:'tbox_'+key,x:bx,y:by,w:TB.w,h:TB.w,fish:true});});
    const D1=key==='big'?[[-22,-22],[22,22]]:[[0,0],[-30,-30],[30,-30],[-30,30],[30,30]];
    D1.forEach((p,i)=>{const da=at(2.6+n*.3+i*.12,.3);if(da>0)dot(c,pos.x+p[0],by+TB.w/2+p[1],t,i+n*7,7.5,da);});
    const ca=at(3.4+n*.3,.5);
    withA(c,ca,()=>{const q=box(c,key==='big'?T.dots2:T.dots5,pos.x,by+TB.w+8,{maxW:200,al:'center',stroke:YELLOW,col:YELLOW});push(rects,ca,'tcount_'+key,q);});
  });
  // "Tissue of equal mass" between the two boxes, with arrows to both
  const ea=at(4.0,.5);
  withA(c,ea,()=>{const l=POS2.small.x+TB.w/2,r=POS2.big.x-TB.w/2,gap=r-l,cx=(l+r)/2,rows=blines(c,T.tissue,gap-56);
    const h=(rows.length-1)*LH,cy=TB.y+TB.w/2,y0=cy-h/2+8;rows.forEach((q,i)=>text(c,q,cx,y0+i*LH,22,CYAN,'center'));
    const w=Math.max(...rows.map(q=>measure(c,q,22)));
    K.arrow(c,cx-w/2-6,cy,l+4,cy,CYAN,3);K.arrow(c,cx+w/2+6,cy,r-4,cy,CYAN,3);
    push(rects,ea,'tissue',{x:cx-w/2,y:y0-20,w,h:h+26});});
  // statements
  let y=TB.y+TB.w+8+40+14;
  const s1=at(4.8,.6),s2=at(5.6,.6),s3=at(6.4,.6);
  withA(c,s1,()=>{const q=box(c,T.checkMass,326,y,{maxW:610,al:'center',stroke:YELLOW,col:YELLOW});push(rects,s1,'checkMass',q);if(tau<99&&tau>4.8&&tau<5.6)ring(c,q,t,YELLOW);});
  y+=boxGeo(c,T.checkMass,610).h+10;
  withA(c,s2,()=>{const q=box(c,T.notEq,326,y,{maxW:610,al:'center'});push(rects,s2,'notEq',q);if(tau<99&&tau>5.6)ring(c,q,t,WHITE);});
  y+=boxGeo(c,T.notEq,610).h+10;
  withA(c,s3,()=>{const q=box(c,T.caveat,326,Math.max(y,ROW.cav),{maxW:610,al:'center',dash:[8,6],t});push(rects,s3,'caveat',q);});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){const L0=[['dot',T.legDot,YELLOW]];
  if(k===0)L0.push(['mass',T.legMass,CYAN]);
  else L0.push(['cell',T.legCell,CYAN]);
  return L0;}
function legIcon(c,kind,x,y,col,t,pul){
  if(kind==='dot'){D.round(c,x,y,40,26,13,FILL,rgba(col,.5+.3*pul));[[12,13],[20,9],[28,15]].forEach(([dx,dy],i)=>dot(c,x+dx,y+dy,t,i,4));}
  else if(kind==='mass'){D.round(c,x,y,40,26,13,FILL,rgba(col,.7+.3*pul));}
  else if(kind==='cell'){c.save();c.lineWidth=2.5;c.strokeStyle=rgba(col,.7+.3*pul);c.strokeRect(x+8,y,24,24);c.restore();}
  else if(kind==='conc')D.round(c,x,y,40,26,8,rgba(col,.75+.25*pul),null);
  else{c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*10;D.round(c,x,y,40,26,13,FILL,rgba(col,.7+.3*pul));c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+14,{maxW:iw});
  let y=R.y+14+hr.h+14;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20,rows=blines(c,p,iw-42),hh=Math.max(40,40+(rows.length-1)*LH);
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh,card:true});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+10));
  const ly=R.y+R.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p,col],q)=>{const pul=.5+.5*Math.sin(t*2+q);
    legIcon(c,kind,ix,yy+4,col,t,pul);
    bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);yy+=lhs[q];}));
  // all numbers are teaching numbers: bottom right of the canvas, every step
  const tw=measure(c,T.teach,22);text(c,T.teach,CW-16,592,22,MUTED,'right');
  if(rects)rects.push({id:'teach',x:CW-16-tw,y:574,w:tw,h:24});
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.conc=draw;
window.EnvironmentDraw.conc.dbg=s_dbg;
})();

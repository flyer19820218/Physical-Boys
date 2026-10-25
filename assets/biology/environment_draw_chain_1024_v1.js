/* Unit 11 lesson 2 · "chain" canvas (pollution-eutrophication tab, view 2), 2026-10-25. More nutrients, less oxygen (plan section 3, chain).
 * Six steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (water ripples, bubbles drift, algae drift,
 * plants sway, fish swim, light shimmers, a light sweep crosses the surface picture, dashes march).
 * Layout as judge / sources: left = stage (x 16..636), right = step card (x 652..944, y 16..566).
 *  Top of the stage: PHOTO window (620 x 172) = the pond seen from above: crop of ecology_ai_1023/HB5_pond.jpg, and from step 3 on
 *    environment_ai_1024/TH8_pond_bloom.jpg cross-faded over it (TH8 is HB5 with only the water changed, same composition; crop in
 *    picture px [180,290,1320,366], chosen with PIL so both show the same stretch of water).
 *  Middle: SEC window (620 x 274) = side section drawn in code: air band, water surface (local y 56), left bank with a field and a
 *    drain pipe, mud bottom (local y 232), six water plants, white bubbles (dissolved oxygen), algae clusters, three fish, a sun.
 *  Under it: the causal link of the step as two boxes joined by an orange arrow (cause -> effect).
 * Every visual quantity has a target per step (TGT) and eases from the previous step's value with the step's own delay/duration
 * (SCHED), so each step shows its own change happening:
 *  0 clear pond: few algae, plants healthy, 20 bubbles, faint light beams reach the plants.
 *  1 nutrients enter: pink dots run off the field over the bank and drop out of the drain, then spread through the water.
 *  2 algae multiply: algae clusters multiply in the top layer, a green film forms on the surface, TH8 fades in over HB5.
 *  3 shading: the yellow light beams brighten, then are cut at the algae layer; below it the water darkens and the plants dim, shrink
 *    and half of them fade (fewer).
 *  4 death and decay: dark specks (dead algae and plants) sink to the mud and pile up; decomposers (tan rods) appear on that layer;
 *    the deepest bubbles drift down to them and vanish (decomposers use oxygen): bubbles 20 -> 9.
 *  5 low oxygen: bubbles 9 -> 4 (the ones left are near the surface); fish rise to just under the surface, ripples at their mouths,
 *    pill "Not enough oxygen"; then the surface picture dims and a white dashed box says which data are needed to judge water quality.
 *    Card legend: day / night note (algae release oxygen by day; at night and in decay oxygen is used).
 * Colours (plan 1.4): nutrients = pink #f472b6 dots; dissolved oxygen = white bubbles; pressure / causal arrows = orange #fb923c;
 * unknown / data still needed = white dashed box. Yellow is used only for the light beam and the sun, as the plan asks (named "Light").
 * Algae clusters yellow-green #a3d65c, plants green, decomposers tan: neutral colours, always named in the legend or a plate.
 * No numbers. Not mixed with biomagnification (next tab). New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=6,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,ORANGE=K.COL.pressure,PINK=K.COL.nutrient,INK=C.ink,SUN='#fde047';
const ALG='#a3d65c',PLANT='#5cb46a',PLANT_DIM='#2c5442',ROD='#d8b98a',DEAD='#8a8a44';
const FILL='rgba(11,26,21,.92)';
const HB5='HB5_pond.jpg',TH8=(K.ENV||'environment_ai_1024/')+'TH8_pond_bloom.jpg';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('養分多了，氧怎麼不見','More nutrients, less oxygen'),
 short:[P('清澈的池塘','A clear pond'),P('養分進來','Nutrients enter'),P('藻類增生','Algae multiply'),P('遮光','Shading'),P('死亡與分解','Death and decay'),P('缺氧','Low oxygen')],
 names:[P('清澈的池塘：氧夠用','A clear pond: enough oxygen'),P('營養鹽從岸邊流入','Nutrients flow in from the bank'),P('藻類大量增生，水面變綠','Algae multiply and the surface turns green'),P('水面的藻擋住光','Surface algae block the light'),P('死亡的藻下沉，被分解','Dead algae sink and are decomposed'),P('溶氧不夠，魚游到水面附近','Too little oxygen: fish come near the surface')],
 photo:P('水面（從上方看）','Surface (from above)'),
 side:P('側面剖面','Side view'),
 mud:P('泥底','Mud'),
 plants:P('水草','Plants'),
 field:P('田','Field'),
 drain:P('排水','Drain'),
 nut:P('營養鹽','Nutrients'),
 algae:P('藻類','Algae'),
 light:P('光','Light'),
 decomp:P('分解者','Decomposers'),
 lowO2:P('溶氧不夠','Not enough oxygen'),
 data:P('要判斷水質，看的是時間、深度、溶氧、營養鹽等資料','To judge water quality, look at data: time, depth, dissolved oxygen, nutrients'),
 links:[
  [P('清澈：水草在水下，溶氧夠用','Clear water: plants below, enough oxygen')],
  [P('田、排水','Fields and drains'),P('營養鹽增加','More nutrients')],
  [P('營養鹽增加','More nutrients'),P('藻類大量增生','Algae multiply')],
  [P('藻類蓋住水面','Algae cover the surface'),P('水草得到的光變少','Less light for plants')],
  [P('藻與水草死亡、下沉','Dead algae and plants sink'),P('分解者用氧，溶氧下降','Decomposers use oxygen; oxygen falls')],
  [P('溶氧下降','Oxygen falls'),P('魚游到水面附近','Fish come near the surface')]],
 legBub:P('白色小泡泡：溶氧','White bubbles: dissolved oxygen'),
 legFish:P('魚','Fish'),
 legPlant:P('水草','Plants'),
 legPink:P('粉紅小點：營養鹽','Pink dots: nutrients'),
 legAlg:P('綠色小團：藻類','Green clusters: algae'),
 legBeam:P('黃色光柱：光','Yellow beam: light'),
 legDim:P('水草變暗、變少','Plants dimmer and fewer'),
 legDead:P('深色碎屑：死去的藻與水草','Dark specks: dead algae and plants'),
 legRod:P('土色小棒：分解者','Tan rods: decomposers'),
 legDay:P('白天：藻類放出氧；夜間與分解：耗氧','Day: algae give off oxygen. Night and decay: oxygen used'),
 schem:L('schematic','示意','Schematic'),
 ai:P(`水面圖：${L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')[0]}`,`Surface picture: ${L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')[1]}`)
};

// ── geometry ─────────────────────────────────────────────────────────────
const PHOTO={x:16,y:16,w:620,h:172};
const CROP=[180/1672,290/933,1320/1672,366/933];
const SEC={x:16,y:198,w:620,h:274};
const CARD={x:652,y:16,w:292,h:550};
const WS=56,BOT=232;                   // water surface, mud top (section-local y)
const BANK=[[0,40],[90,40],[175,BOT+6]];   // bank top edge and slope down to the mud
const slopeX=y=>y<=40?90:mix(90,175,clamp((y-40)/(BOT+6-40)));
const G=(x,y)=>[SEC.x+x,SEC.y+y];
const PLANTS=[[205,118],[268,92],[336,138],[410,104],[478,128],[556,90]];
const FISH=[{cx:250,A:55,w:.33,ph:0,y:142,s:.9},{cx:420,A:75,w:.26,ph:2.1,y:178,s:1},{cx:540,A:45,w:.38,ph:4.2,y:116,s:.8}];
const SUNP=[590,26];
const BEAMS=[300,420,540];             // x where each beam meets the water surface; beams slant down-left
const SLANT=-.32;

// per-step targets of every quantity, and [delay, duration] when entering a step
const TGT={bloom:[0,0,1,1,1,1],nut:[0,1,1,1,1,1],alg:[0,0,1,1,1,1],shade:[0,0,0,1,1,1],beam:[0,0,0,1,.4,.4],
 plant:[0,0,0,1,1.2,1.2],dead:[0,0,0,0,1,1],ox:[1,1,1,1,.45,.2],up:[0,0,0,0,0,1],data:[0,0,0,0,0,1]};
const SCHED=[{},{nut:[1,4]},{alg:[.6,3],bloom:[.8,2.6]},{beam:[.3,1],shade:[1.4,1.6],plant:[2.4,2.4]},{dead:[.4,4.5],ox:[1.6,4],plant:[.4,2]},{ox:[0,1.2],up:[.6,2.4],data:[4,.8]}];

// fixed random positions
const R1=K.rng(11),BUB=Array.from({length:20},()=>({x:150+R1()*455,y:WS+18+R1()*(BOT-WS-40),r:3.5+R1()*2.5,ph:R1()*6})).sort((a,b)=>a.y-b.y);
const R2=K.rng(23),ALGS=Array.from({length:46},(_,i)=>({x:120+R2()*495,y:i<6?WS+10+R2()*90:WS+5+R2()*(i<34?26:46),ph:R2()*6}));
const R3=K.rng(37),NUTS=Array.from({length:18},()=>({x:140+R3()*470,y:WS+12+R3()*(BOT-WS-30),ph:R3()*6}));
const R4=K.rng(41),SPECK=Array.from({length:40},()=>({x:180+R4()*430,ph:R4(),y0:WS+12+R4()*30}));
const R5=K.rng(53),RODS=Array.from({length:14},()=>({x:190+R5()*410,ph:R5()*6}));
const PILE=Array.from({length:60},(_,i)=>({x:178+i*7.3,h:3+((i*37)%5)}));

// ── helpers (as in sources / judge) ──────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、；])|(?<=[:,;] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22,vc=false,g=null}={}){
  g=g||boxGeo(c,p,maxW,size);const bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=vc?y-g.h/2:y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const plateW=(c,p)=>measure(c,p,22)+14;
function plate(c,p,x,y,{al='center',col=WHITE,stroke=null}={}){const w=plateW(c,p),h=32,bx=al==='right'?x-w:al==='left'?x:x-w/2;
  D.round(c,bx,y,w,h,10,FILL,stroke||rgba(col,.75));text(c,p,bx+w/2,y+24,22,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
const mixCol=(a,b,u)=>{const A=hex(a),B=hex(b);return`rgb(${A.map((v,i)=>Math.round(mix(v,B[i],clamp(u)))).join(',')})`;};

// ── fish (outline style as in conc), facing right at dir=1 ────────────────
function fish(c,x,y,s,dir,tilt,t,ph){const rx=26,ry=11,wag=Math.sin(t*3+ph)*.2,tl=rx*.32+6,th=ry*.66;
  c.save();c.translate(x,y);c.scale(s*dir,s);c.rotate(tilt);c.lineJoin='round';c.lineWidth=2.2/s;c.strokeStyle=rgba(WHITE,.9);c.fillStyle='#24584e';
  c.save();c.translate(-rx+3,0);c.rotate(wag);c.beginPath();c.moveTo(0,0);c.lineTo(-tl,-th);c.quadraticCurveTo(-tl*.7,0,-tl,th);c.closePath();c.fill();c.stroke();c.restore();
  c.beginPath();c.moveTo(-rx*.3,-ry*.9);c.quadraticCurveTo(-rx*.15,-ry*1.5,rx*.15,-ry*.95);c.closePath();c.fill();c.stroke();
  c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.fill();c.stroke();
  circle(c,rx*.68,-ry*.18,2.4,WHITE,null);
  c.restore();}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.chainSt||(s.chainSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  // quantities: ease from the previous step's targets (or step k-1 when entering fresh) with this step's schedule
  const base=st.from>=0?st.from:Math.max(0,k-1),back=base>k;
  const V={};for(const q in TGT){const sc=back?[0,.8]:(SCHED[k][q]||[0,.8]);V[q]=mix(TGT[q][base],TGT[q][k],smooth((tau-sc[0])/sc[1]));}
  s_dbg.V=V;
  photo(c,V,t,tau,k,rects);
  section(c,V,t,tau,k,rects,back);
  links(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  // bottom notes
  text(c,T.schem,16,592,22,MUTED,'left');push(rects,1,'schem',{x:16,y:574,w:measure(c,T.schem,22),h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'ai',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── surface picture (top) ────────────────────────────────────────────────
function photo(c,V,t,tau,k,rects){
  const R=PHOTO;
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,12);c.clip();c.fillStyle='#16332b';c.fillRect(R.x,R.y,R.w,R.h);
  K.drawIn(c,HB5,R,{crop:CROP});
  if(V.bloom>0)K.drawIn(c,TH8,R,{crop:CROP,alpha:V.bloom});
  // a soft light sweep (keeps a held step moving)
  const sw=mod(t*.11),sx=R.x-80+sw*(R.w+160),gr=c.createLinearGradient(sx-60,0,sx+60,0);
  gr.addColorStop(0,'rgba(242,236,217,0)');gr.addColorStop(.5,'rgba(242,236,217,.10)');gr.addColorStop(1,'rgba(242,236,217,0)');
  c.fillStyle=gr;c.fillRect(R.x,R.y,R.w,R.h);
  // step 6: the picture dims and the data note comes up
  withA(c,V.data,()=>{c.fillStyle='rgba(11,26,21,.66)';c.fillRect(R.x,R.y,R.w,R.h);});
  c.restore();
  D.round(c,R.x,R.y,R.w,R.h,12,null,C.edge);
  if(k===2&&tau>.8&&tau<4)ring(c,{x:R.x,y:R.y,w:R.w,h:R.h},t,ALG);
  const pr=plate(c,T.photo,R.x+10,R.y+10,{al:'left'});push(rects,1,'photoName',pr);
  withA(c,V.data,()=>{const g=boxGeo(c,T.data,560),q=box(c,T.data,R.x+R.w/2,R.y+R.h/2+18,{al:'center',vc:true,dash:[8,6],t,g});push(rects,V.data,'data',q);if(V.data>=1)ring(c,q,t,WHITE);});
}

// ── side section (middle) ────────────────────────────────────────────────
function section(c,V,t,tau,k,rects,back){
  const R=SEC,[ox,oy]=G(0,0);
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,12);c.clip();
  // air
  const ag=c.createLinearGradient(0,oy,0,oy+WS);ag.addColorStop(0,'#1d4552');ag.addColorStop(1,'#24525a');c.fillStyle=ag;c.fillRect(ox,oy,R.w,WS);
  // water (tinted green with the bloom)
  const wg=c.createLinearGradient(0,oy+WS,0,oy+BOT);
  wg.addColorStop(0,mixCol('#2f7186','#4f6f2c',V.bloom));wg.addColorStop(1,mixCol('#1a4656','#2b3d1c',V.bloom));
  c.fillStyle=wg;c.fillRect(ox,oy+WS,R.w,BOT-WS+4);
  // sun and light beams
  sunDraw(c,t);
  beams(c,V,t,k);
  // darker water under the algae layer
  withA(c,V.shade,()=>{c.fillStyle='rgba(8,20,16,.42)';c.fillRect(ox,oy+WS+46,R.w,BOT-WS-44);});
  // mud
  c.fillStyle='#4a3826';c.fillRect(ox,oy+BOT,R.w,R.h-BOT);
  K.sline(c,[[ox,oy+BOT],[ox+R.w,oy+BOT]],'#6b5236',3);
  for(let i=0;i<26;i++){circle(c,ox+180+((i*53)%440),oy+BOT+10+((i*17)%26),2.2,'rgba(160,128,92,.5)',null);}
  // plants
  plants(c,V,t);
  // dead material pile and decomposers
  deadLayer(c,V,t,tau,k);
  // nutrients spread in the water
  NUTS.forEach((d,i)=>{const a=clamp(V.nut*18-i);if(a<=0)return;const [x,y]=G(d.x+Math.sin(t*.4+d.ph)*6,d.y+Math.cos(t*.5+d.ph)*4);
    circle(c,x,y,4.5,rgba(PINK,.9*a),rgba(INK,.5*a),1);});
  // dissolved oxygen bubbles (the deepest go first)
  bubbles(c,V,t,tau,k,back);
  // algae
  algae(c,V,t);
  // fish
  fishes(c,V,t);
  // bank, field, drain pipe
  bankDraw(c,t);
  // step 2: runoff from the field and the drain
  withA(c,k===1?clamp(tau/.6):0,()=>runoff(c,t,tau));
  c.restore();
  D.round(c,R.x,R.y,R.w,R.h,12,null,C.edge);
  // plates
  let q=plate(c,T.side,G(6,0)[0],G(0,186)[1],{al:'left',col:MUTED});push(rects,1,'side',q);
  q=plate(c,T.mud,G(186,0)[0],G(0,BOT+6)[1],{al:'left',col:MUTED});push(rects,1,'mud',q);
  q=plate(c,T.plants,G(360,0)[0],G(0,BOT+6)[1],{col:k===3?WHITE:MUTED});push(rects,1,'plants',q);
  const fa=k===1?clamp((tau-.4)/.5):0;
  withA(c,fa,()=>{let r=plate(c,T.field,G(8,0)[0],G(0,4)[1],{al:'left',col:PINK});push(rects,fa,'field',r);
    r=plate(c,T.drain,G(6,0)[0],G(0,66)[1],{al:'left',col:PINK});push(rects,fa,'drain',r);});
  const na=k===1?clamp((tau-2.2)/.5):0;
  withA(c,na,()=>{const r=plate(c,T.nut,G(330,0)[0],G(0,WS+6)[1],{col:PINK});push(rects,na,'nut',r);});
  const aa=k>=2?clamp((tau-(k===2?2:0))/.5):0;
  withA(c,aa,()=>{const r=plate(c,T.algae,G(150,0)[0],G(0,12)[1],{al:'left',col:ALG});push(rects,aa,'algae',r);
    const [lx,ly]=G(150+r.w/2,12+32);K.sline(c,[[r.x+r.w/2,ly],[r.x+r.w/2,ly+12]],rgba(ALG,.8),2);});
  const la=k===3?clamp((tau-.5)/.5):(k>3?1:0);
  withA(c,la,()=>{const r=plate(c,T.light,G(SUNP[0]-24,0)[0],G(0,10)[1],{al:'right',col:SUN});push(rects,la,'light',r);});
  const da=k>=4?clamp((tau-(k===4?2.6:0))/.5):0;
  withA(c,da,()=>{const r=plate(c,T.decomp,G(610,0)[0],G(0,BOT+6)[1],{al:'right',col:ROD});push(rects,da,'decomp',r);});
  const oa=k===5?clamp((tau-2.6)/.5):0;
  withA(c,oa,()=>{const r=plate(c,T.lowO2,G(370,0)[0],G(0,12)[1],{col:WHITE,stroke:rgba(ORANGE,.7+.3*Math.sin(t*3))});push(rects,oa,'lowO2',r);});
  s_dbg.fishY=V.up;
}
function sunDraw(c,t){const [x,y]=G(...SUNP);c.save();c.strokeStyle=SUN;c.lineWidth=2.5;
  for(let n=0;n<10;n++){const a=t*.4+n*Math.PI/5;c.beginPath();c.moveTo(x+Math.cos(a)*17,y+Math.sin(a)*17);c.lineTo(x+Math.cos(a)*23,y+Math.sin(a)*23);c.stroke();}
  c.restore();circle(c,x,y,12,SUN,null);}
function beams(c,V,t,k){
  const cut=mix(BOT,WS+44,V.shade),bw=34;
  BEAMS.forEach((bx,i)=>{const sh=.5+.5*Math.sin(t*1.8+i*1.3);
    const a=.12+.30*V.beam+.05*sh;
    // above water: from the sun side down to the surface
    const top=0,xTop=bx-SLANT*(WS-top);
    const xs=y=>bx+SLANT*(y-WS);
    c.save();c.beginPath();
    const [p1x,p1y]=G(xTop-bw/2,top),[p2x,p2y]=G(xTop+bw/2,top),[p3x,p3y]=G(xs(cut)+bw/2,cut),[p4x,p4y]=G(xs(cut)-bw/2,cut);
    c.moveTo(p1x,p1y);c.lineTo(p2x,p2y);c.lineTo(p3x,p3y);c.lineTo(p4x,p4y);c.closePath();
    const g=c.createLinearGradient(0,p1y,0,p3y);g.addColorStop(0,rgba(SUN,a*1.2));g.addColorStop(1,rgba(SUN,a*.7));c.fillStyle=g;c.fill();c.restore();
    // where the light used to reach (dashed ghost), only once it is blocked
    withA(c,V.shade*.8,()=>{const [a1x,a1y]=G(xs(cut)-bw/2,cut),[a2x,a2y]=G(xs(BOT)-bw/2,BOT),[b1x,b1y]=G(xs(cut)+bw/2,cut),[b2x,b2y]=G(xs(BOT)+bw/2,BOT);
      K.dashed(c,[[a1x,a1y],[a2x,a2y]],rgba(SUN,.45),2,[6,6],-t*8);K.dashed(c,[[b1x,b1y],[b2x,b2y]],rgba(SUN,.45),2,[6,6],-t*8);
      K.sline(c,[[a1x-4,a1y],[b1x+4,b1y]],rgba(SUN,.85),4);});});
}
function plants(c,V,t){
  const d=clamp(V.plant);   // 0 healthy .. 1 dim and fewer (1.2 = a little more)
  const dd=clamp(V.plant/1.2);
  PLANTS.forEach(([px,h],i)=>{const odd=i%2===1,al=odd?1-.85*dd:1,hh=h*(1-.22*dd),col=mixCol(PLANT,PLANT_DIM,d);
    withA(c,al,()=>{const pts=[];for(let j=0;j<=10;j++){const f=j/10,sw=Math.sin(t*1.1+i*1.7+f*2)*7*f;pts.push(G(px+sw,BOT-f*hh));}
      K.sline(c,pts,col,3.5);
      for(let j=2;j<=9;j++){const [lx,ly]=pts[j],side=j%2?1:-1,ang=side*(.7+.15*Math.sin(t*1.3+j));
        c.save();c.translate(lx,ly);c.rotate(ang);K.ellipse(c,side*9,0,10,4,col,null);c.restore();}});});
}
function deadLayer(c,V,t,tau,k){
  const dv=V.dead;if(dv<=0)return;
  // pile on the mud
  PILE.forEach(p=>{const [x,y]=G(p.x,BOT);if(p.x>612)return;c.fillStyle=rgba('#6e6a38',.9*dv);c.fillRect(x,y-p.h*dv-1,7.5,p.h*dv+1);});
  // sinking specks (keep falling while the step is held)
  withA(c,k>=4?1:dv,()=>SPECK.forEach((s,i)=>{const q=mod(t*.07+s.ph),y=mix(s.y0,BOT-4,q),x=s.x+Math.sin(t*.8+i)*5;
    const a=clamp((1-q)*6)*clamp(q*8)*clamp(dv*1.5);if(a<=0)return;const [X,Y]=G(x,y);
    c.save();c.translate(X,Y);c.rotate(t*.5+i);c.fillStyle=rgba(DEAD,a);c.fillRect(-3.5,-2,7,4);c.restore();}));
  // decomposers: tan rods wriggling on the pile
  RODS.forEach((r,i)=>{const a=clamp(dv*14-i)*clamp((dv-.25)*3);if(a<=0)return;const [x,y]=G(r.x+Math.sin(t*.9+r.ph)*3,BOT-6-Math.abs(Math.sin(t*1.4+r.ph))*2);
    c.save();c.translate(x,y);c.rotate(Math.sin(t*1.2+r.ph)*.5);D.round(c,-7,-2.5,14,5,2.5,rgba(ROD,a),null);c.restore();});
}
function bubbles(c,V,t,tau,k,back){
  const n=V.ox*BUB.length;
  BUB.forEach((b,i)=>{const a=clamp(n-i);
    // in step 5 the bubbles that are going drift down to the decomposers before they vanish
    let x=b.x+Math.sin(t*.5+b.ph)*8,y=b.y+Math.cos(t*.4+b.ph)*5;
    if(k===4&&!back&&a<1){const goingTo=1-a;const tx=RODS[i%RODS.length].x,ty=BOT-12;x=mix(x,tx,smooth(goingTo*1.4));y=mix(y,ty,smooth(goingTo*1.4));}
    const al=k===4&&!back?clamp(a*3):a;if(al<=0)return;
    const [X,Y]=G(x,y);circle(c,X,Y,b.r*(1+.08*Math.sin(t*2+b.ph)),rgba(WHITE,.12*al),rgba(WHITE,.95*al),2);});
}
function algae(c,V,t){
  const n=6+V.alg*(ALGS.length-6);
  // green film on the surface
  withA(c,V.alg,()=>{const [x,y]=G(110,WS);const g=c.createLinearGradient(0,y,0,y+20);g.addColorStop(0,rgba(ALG,.55));g.addColorStop(1,rgba(ALG,0));c.fillStyle=g;c.fillRect(x,y,520,20);
    c.save();c.setLineDash([16,10]);c.lineDashOffset=-t*6;K.sline(c,[[x,y+1],[x+520,y+1]],rgba(ALG,.9),3);c.restore();});
  ALGS.forEach((a,i)=>{const v=clamp(n-i);if(v<=0)return;const [X,Y]=G(a.x+Math.sin(t*.3+a.ph)*5,a.y+Math.cos(t*.45+a.ph)*2.5);
    [[0,0],[5,-3],[4,4],[-4,3]].forEach(([dx,dy])=>circle(c,X+dx,Y+dy,3.2,rgba(ALG,.95*v),rgba('#2d4a14',.7*v),1));});
}
function fishes(c,V,t){
  FISH.forEach((f,i)=>{const ph=t*f.w+f.ph,x=f.cx+f.A*Math.sin(ph),dir=Math.cos(ph)>=0?1:-1;
    const y=mix(f.y,WS+13+i*2,V.up)+Math.sin(t*1.3+i)*2,tilt=-.28*V.up;
    const [X,Y]=G(x,y);fish(c,X,Y,f.s,dir,tilt,t,f.ph);
    // ripples at the mouth when the fish is at the surface
    withA(c,V.up,()=>{const mx=X+dir*24*f.s,my=G(0,WS)[1],q=mod(t*.8+i*.3);K.ellipse(c,mx,my,4+q*14,1.5+q*3,null,rgba(WHITE,.8*(1-q)),2);});});
}
function bankDraw(c,t){
  const pts=[G(0,40),G(90,40),G(175,BOT+6),G(175,SEC.h),G(0,SEC.h)];
  c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle='#5a4430';c.fill();
  K.sline(c,[G(0,40),G(90,40),G(175,BOT+6)],'#7a9a45',4);
  // field: rows of sprouts on the bank top
  for(let i=0;i<7;i++){const x=10+i*11;const [bx,by]=G(x,40),sw=Math.sin(t*1.5+i)*1.5;
    K.sline(c,[[bx,by],[bx+sw,by-10]],'#79c35e',2.5);K.ellipse(c,bx+sw-3,by-9,4,2,'#79c35e',null,1,-.5);K.ellipse(c,bx+sw+3,by-7,4,2,'#79c35e',null,1,.5);}
  // drain pipe through the bank, outlet just above the water
  const [px,py]=G(54,46);D.round(c,px,py,slopeX(50)-54+12,9,3,'#8b9a97',rgba(WHITE,.5));
  circle(c,px+slopeX(50)-54+12,py+4.5,5,'#5c6866',rgba(WHITE,.5),1.5);
}
function runoff(c,t,tau){
  // from the field over the bank edge and down into the water, then along the surface layer
  for(let j=0;j<10;j++){const q=mod(t*.16+j/10);if(tau<q*3)continue;
    let x,y;if(q<.3){const e=q/.3;x=mix(20,90,e);y=37;}
    else if(q<.45){const e=(q-.3)/.15;y=mix(37,WS+8,e);x=slopeX(y)+4;}
    else{const e=(q-.45)/.55;x=mix(slopeX(WS+8)+4,330+((j*41)%260),e);y=WS+8+e*(20+((j*29)%110));}
    const [X,Y]=G(x,y);circle(c,X,Y,5,rgba(PINK,.95*(1-Math.pow(q,6))),rgba(INK,.5),1);}
  const outX=slopeX(50)+17;
  for(let j=0;j<8;j++){const q=mod(t*.2+j/8+.05);if(tau<q*3)continue;
    let x,y;if(q<.2){const e=q/.2;x=outX+e*6;y=mix(50,WS+4,e*e);}
    else{const e=(q-.2)/.8;x=mix(outX+6,250+((j*53)%300),e);y=WS+4+e*(40+((j*31)%120));}
    const [X,Y]=G(x,y);circle(c,X,Y,5,rgba(PINK,.95*(1-Math.pow(q,6))),rgba(INK,.5),1);}
}

// ── cause -> effect under the section ────────────────────────────────────
const LY=SEC.y+SEC.h+10;
function linkBoxes(c,k,a,t,rects){
  const L=T.links[k];
  if(L.length===1){const q=box(c,L[0],SEC.x+SEC.w/2,LY,{maxW:620,al:'center'});push(rects,a,'link0',q);return;}
  const g1=boxGeo(c,L[0],270),g2=boxGeo(c,L[1],300),gap=48,W=g1.w+gap+g2.w,x0=SEC.x+SEC.w/2-W/2,h=Math.max(g1.h,g2.h);
  const q1=box(c,L[0],x0,LY+(h-g1.h)/2,{g:g1,stroke:rgba(WHITE,.6)});
  const q2=box(c,L[1],x0+g1.w+gap,LY+(h-g2.h)/2,{g:g2,stroke:ORANGE});
  const ay=LY+h/2,sh=3*Math.sin(t*3);K.arrow(c,q1.x+q1.w+8+sh*.3,ay,q2.x-6+sh,ay,ORANGE,4);
  push(rects,a,'link0',q1);push(rects,a,'link1',q2);
  return q2;}
function links(c,k,st,moving,x,tau,t,rects){
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>linkBoxes(c,st.from,0,t,null));
  const a=clamp((tau-Math.max([.6,2.6,2.8,2.6,2.8,2.8][k],moving?MOVE*.6:0))/.5);
  withA(c,a,()=>{const q=linkBoxes(c,k,a,t,rects);if(q&&tau>3.4&&tau<7)ring(c,q,t,ORANGE);});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  return[[['bub',T.legBub],['fish',T.legFish],['plant',T.legPlant]],[['pink',T.legPink]],[['alg',T.legAlg]],[['beam',T.legBeam],['dim',T.legDim]],
   [['dead',T.legDead],['rod',T.legRod]],[['day',T.legDay]]][k];}
function legIcon(c,kind,x,y,t){
  if(kind==='bub'){[[10,18,4],[22,10,5],[32,18,3]].forEach(([dx,dy,r],i)=>circle(c,x+dx,y+dy-2*Math.sin(t*2+i),r,rgba(WHITE,.12),WHITE,2));}
  else if(kind==='pink'){for(let i=0;i<4;i++){const q=mod(t*.4+i/4);circle(c,x+6+q*28,y+14+(i%2?-1:1)*q*5,4.5,rgba(PINK,1-q*q),null);}}
  else if(kind==='alg'){[[10,14],[26,10],[30,22]].forEach(([dx,dy],i)=>[[0,0],[5,-3],[4,4]].forEach(([a,b])=>circle(c,x+dx+a+Math.sin(t+i)*1.5,y+dy+b,3,ALG,'#2d4a14',1)));}
  else if(kind==='beam'){c.save();c.beginPath();c.moveTo(x+14,y);c.lineTo(x+30,y);c.lineTo(x+24,y+26);c.lineTo(x+8,y+26);c.closePath();c.fillStyle=rgba(SUN,.45+.2*Math.sin(t*1.8));c.fill();c.restore();}
  else if(kind==='plant'||kind==='dim'){const col=kind==='dim'?PLANT_DIM:PLANT;const pts=[];for(let j=0;j<=6;j++){const f=j/6;pts.push([x+20+Math.sin(t*1.1+f*2)*3*f,y+28-f*26]);}
    K.sline(c,pts,col,3);[2,4].forEach((j,m)=>{const [lx,ly]=pts[j];K.ellipse(c,lx+(m?-7:7),ly,7,3,col,null);});}
  else if(kind==='fish'){fish(c,x+22,y+14,.6,1,0,t,0);}
  else if(kind==='dead'){for(let i=0;i<5;i++){const q=mod(t*.25+i/5);c.fillStyle=rgba('#8a8a44',1-q*.5);c.fillRect(x+6+i*6,y+4+q*18,6,4);}}
  else if(kind==='rod'){for(let i=0;i<3;i++){c.save();c.translate(x+10+i*11,y+16);c.rotate(Math.sin(t*1.2+i)*.5);D.round(c,-6,-2.5,12,5,2.5,ROD,null);c.restore();}}
  else if(kind==='day'){// sun (day) and moon (night)
    circle(c,x+11,y+12,6,SUN,null);c.save();c.strokeStyle=SUN;c.lineWidth=2;for(let n=0;n<8;n++){const q=t*.6+n*Math.PI/4;c.beginPath();c.moveTo(x+11+Math.cos(q)*9,y+12+Math.sin(q)*9);c.lineTo(x+11+Math.cos(q)*12,y+12+Math.sin(q)*12);c.stroke();}c.restore();
    c.save();c.beginPath();c.arc(x+30,y+24,8,0,Math.PI*2);c.fillStyle=WHITE;c.fill();c.globalCompositeOperation='source-atop';c.beginPath();c.arc(x+35,y+20,7,0,Math.PI*2);c.fillStyle='#16332b';c.fill();c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:ORANGE});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  const RH=34;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH/2,rows=blines(c,p,iw-42),hh=RH+(rows.length-1)*LH;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    // causal arrow from the previous step's badge down to this one
    if(j>0){const lit=j<=k;K.sline(c,[[ix+16,y-RH/2+15+2],[ix+16,cy-15-1]],lit?rgba(ORANGE,.9):rgba(MUTED,.35),2);}
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,2,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh;});
  y+=4;K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=8;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,28));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*28;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,28));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(38,blines(c,p,iw-50).length*27+8));
  const ly=R.y+R.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+2,t);
    const h=bwrap(c,p,ix+50,yy+22,iw-50,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+50,y:yy+2,w:iw-50,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.chain=draw;
window.EnvironmentDraw.chain.dbg=s_dbg;
})();

/* Unit 11 lesson 3 · "casefile" canvas (synthesis tab, view 0), 2026-10-25. One stream: compare, trace, act, verify (plan section 4, casefile; P3).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Always moving: the four residents move a little (chub swims, nymph crawls, dipper bobs, snail creeps), glints run down the fast water,
 * dashed outlines march, the lit item of each step pulses (habitat outline in turn, pressure icons, measure items, survey frame).
 * Layout (as assess / track / clues): left = stage (x 16..636), right = step card (x 652..944, y 16..566).
 *   SCN (x 16..636, y 16..332) = ecology_ai_1023/HB4_stream.jpg (1672x933; crop rows 41..893 = whole width), residents placed in the water.
 *   Under it (y 344..566) the step's own diagram; three columns (centres x 115 / 326 / 537) line up with the icons in the scene.
 *  0 compare (lesson 1): the residents (cyan = species diversity) get their names; a cyan box shows them as small pictures; then four
 *    green dashed outlines (fast water, slow water, stony bed, bank = habitats, green = ecosystem diversity) light up one after another,
 *    with the matching pill in the green box; afterwards the lit outline walks round the four.
 *  1 trace (lesson 2): the scene dims; three orange icons (habitat altered = a weir, more nutrients = a drain, nonnative species = a fish
 *    brought in) light up one by one, each with its name; an orange line runs from each icon down to a box "changed: ...".
 *  2 act (lesson 3): two green measures: a small picture card of environment_ai_1024/CV5b_weir_fishway.jpg (only the fishway part, crop
 *    fractions [.5,.47,.47,.53]; CV5b is NOT used as a background and is not faded against HB4) above the weir icon, and a drawn
 *    "less discharge" icon (pipe with a closing valve) above the drain icon; each joins its pressure with a green line and leads down to a
 *    green box "for: ..."; the third column gets a white dashed box "done; only tracking can tell".
 *  3 verify: the scene is clear again; a cyan dashed survey frame "same place" with a cyan clock; under the scene two cyan tags
 *    (same method, repeated records) and a row of five cyan record sheets (one before, four after the measure, green dashed line between);
 *    under every sheet a white dashed circle "?" (result still to check: no result is given); box "A measure is not an effect".
 * Science (plan 4): recall only (no new knowledge); no real results, no numbers; icons are schematic; the scene is an AI illustration.
 * Pictures: HB4 (kit SIZE), BD7_chub / BD7_mayfly_nymph / BD7_dipper / BD7_river_snail (alpha bbox = whole picture, measured with PIL;
 * chub and dipper face right, nymph head up, snail faces left), CV5b_weir_fishway.jpg (1024x572).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const CYAN=(K.COL&&K.COL.evidence)||'#55e9ff',GREEN=(K.COL&&K.COL.protect)||'#4ade80',ORANGE=(K.COL&&K.COL.pressure)||'#fb923c';
const SPC=(K.COL&&K.COL.species)||CYAN,ECO=(K.COL&&K.COL.ecosystem)||GREEN;
const FILL='rgba(11,26,21,.92)',CARDF='rgba(22,51,43,.92)';
const ENV=K.ENV||'environment_ai_1024/',HB4='HB4_stream.jpg',CV5B=ENV+'CV5b_weir_fishway.jpg';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('同一條溪，比、追、做、驗','One stream: compare, trace, act, verify'),
 short:[P('比','Compare'),P('追','Trace'),P('做','Act'),P('驗','Verify')],
 names:[P('比：這條溪有哪些居民、哪些住處','Compare: who lives here and in which habitats'),P('追：這條溪承受什麼壓力','Trace: what pressures does this stream face'),P('做：兩個措施','Act: two measures'),P('驗：用同樣的方法追蹤','Verify: track with the same method')],
 res:[P('河烏','Brown dipper'),P('苦花','Taiwan chub'),P('蜉蝣稚蟲','Mayfly nymph'),P('川蜷','Freshwater snail')],
 resHead:P('居民','Residents'),resSub:L('species','物種多樣性','Species diversity'),
 habHead:P('住處','Habitats'),habSub:L('ecosystem','生態系多樣性','Ecosystem diversity'),
 hab:[P('急流','Fast water'),P('緩流','Slow water'),P('溪底石頭','Stony bed'),P('溪岸','Bank')],
 pr:[P('棲地被改變','Habitat altered'),P('營養鹽增加','More nutrients'),P('外來種','Nonnative species')],
 changed:P('改變了','Changed'),
 cond:[P('水流、上下游的通路','Flow and the way up and down stream'),P('水質：養分、溶氧','Water: nutrients and oxygen'),P('居民的競爭、捕食','Competition and predation among residents')],
 me:[P('魚梯','Fishway'),P('減少排放','Less discharge')],
 meFor:[P('針對：上下游的通路','For: the way up and down stream'),P('針對：營養鹽','For: nutrients')],
 todo:P('做了，還要追蹤才知道','Done; only tracking can tell'),
 place:P('同一個地點','Same place'),
 same:P('同樣的方法','Same method'),rep:P('重複記錄','Repeated records'),
 before:P('做之前','Before'),after:P('做之後','After the measures'),
 notEffect:P('措施不等於成效','A measure is not an effect'),
 leg:[[['res',P('居民＝物種多樣性','Residents = species diversity')],['hab',P('住處＝生態系多樣性','Habitats = ecosystem diversity')]],
      [['pr',P('橘色：壓力','Orange: pressure')],['line',P('橘線：連到改變了的條件','Orange line: to the condition that changed')]],
      [['me',P('綠色：措施','Green: measure')],['todo',P('白虛線：還不知道有沒有效','White dashes: effect not known yet')]],
      [['ev',P('青色：追蹤證據','Cyan: tracking evidence')],['q',P('白虛線圈：結果待查證','White dashed circle: result still to check')]]],
 schem:P('小圖示是示意','Icons are schematic'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── geometry ─────────────────────────────────────────────────────────────
const SCN={x:16,y:16,w:620,h:316};
const CROP=[0,41/933,1,852/933],SC=620/1672;
const sx=X=>SCN.x+X*SC,sy=Y=>SCN.y+(Y-41)*SC;
const R4=(a)=>({x:sx(a[0]),y:sy(a[1]),w:(a[2]-a[0])*SC,h:(a[3]-a[1])*SC});
// habitats (picture px of HB4, chosen once on the picture): fast water, slow water, stony bed, left bank
const HAB=[[440,395,1180,560],[390,566,1350,672],[290,684,1150,890],[6,250,300,860]].map(R4);
// residents: picture, centre (stage px), width, rotation, motion, name pill position (left x / centre x, top y)
const RES=[
 {f:ENV+'BD7_dipper.png',x:150,y:116,w:80,mv:'dip',px:24,py:30,al:'left'},
 {f:ENV+'BD7_chub.png',x:420,y:236,w:120,mv:'swim',px:420,py:164,al:'center'},
 {f:ENV+'BD7_mayfly_nymph.png',x:246,y:296,w:40,rot:-Math.PI/2,mv:'crawl',px:226,py:228,al:'center'},
 {f:ENV+'BD7_river_snail.png',x:382,y:312,w:56,mv:'creep',px:422,py:288,al:'left'}];
const COLX=[16,227,438],COLW=198,COLC=COLX.map(x=>x+COLW/2);
// pressure icons in the scene (centres line up with the columns)
const PR=[{x:COLC[0],y:244},{x:COLC[1],y:170},{x:COLC[2],y:210}];
const BOT=344;
const FW={x:22,y:24,w:200,h:124};          // fishway picture card
const FWCROP=[.5,.47,.47,.53];
const DIS={x:COLC[1],y:76};                        // less-discharge icon
const SURV={x:330,y:196,w:170,h:132};              // survey frame (step 3)
const CARD={x:652,y:16,w:292,h:550};

// ── helpers (as in assess / track) ───────────────────────────────────────
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
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=24,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
// box: fixed width when fixW is given (text centred inside), else fits the text
function box(c,p,x,y,{maxW=600,fixW=0,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,fixW||maxW,size),w=fixW||g.w,bx=al==='center'?x-w/2:al==='right'?x-w:x,by=y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,w,g.h,g.rows.length>1?14:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w,h:g.h};}
// box with a coloured head line and a white body, fixed width
function hbox(c,head,body,x,y,w,{stroke=WHITE,hcol=WHITE}={}){const str=D.tr(body),rows=/[一-鿿]/.test(str)?blines(c,body,w-20):greedyBal(c,str,w-20);
  const h=30+rows.length*28+14;D.round(c,x,y,w,h,14,FILL,stroke);text(c,head,x+w/2,y+30,22,hcol,'center');
  rows.forEach((r,i)=>text(c,r,x+w/2,y+58+i*28,22,WHITE,'center'));return{x,y,w,h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill=FILL,icon=0,minX=SCN.x+4,maxX=SCN.x+SCN.w-4}={}){
  const w=tagW(c,p,size)+icon,h=size+18;let bx=al==='right'?x-w:al==='center'?x-w/2:x;bx=Math.max(minX,Math.min(bx,maxX-w));
  D.round(c,bx,y,w,h,h/2,fill,rgba(col,.95));
  text(c,p,bx+icon+(w-icon)/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const dashRect=(c,r,rad,col,t,w=2.5,fill=null)=>{c.save();c.setLineDash([9,7]);c.lineDashOffset=-t*10;c.lineWidth=w;D.round(c,r.x,r.y,r.w,r.h,rad,fill,col);c.restore();};
function clock(c,x,y,r,col=CYAN){circle(c,x,y,r,FILL,col,2);const h=-Math.PI*.83;
  K.sline(c,[[x,y],[x+Math.cos(h)*r*.55,y+Math.sin(h)*r*.55]],col,2);K.sline(c,[[x,y],[x,y-r*.72]],col,2);}
function sheet(c,x,y,col=CYAN,s=1){const w=22*s,h=28*s;D.round(c,x-w/2,y-h/2,w,h,3,FILL,col);for(let i=0;i<3;i++)K.sline(c,[[x-w/2+5*s,y-h/2+8*s+i*6*s],[x+w/2-5*s,y-h/2+8*s+i*6*s]],col,2);}
// drawn icons (schematic)
function iconWeir(c,x,y,col){D.round(c,x-14,y-6,28,9,2,rgba(col,.25),col);
  K.sline(c,[[x-15,y-11],[x-8,y-13],[x-1,y-11]],col,2);for(let i=0;i<3;i++)K.sline(c,[[x-7+i*7,y+5],[x-8+i*7,y+13]],col,2);}
function iconDrain(c,x,y,col,t){D.round(c,x-16,y-11,16,10,2,rgba(col,.25),col);
  const v=mod(t*.9);circle(c,x+3,y-6+18*v,3,col,null);circle(c,x+3,y-6+18*mod(v+.5),3,col,null);}
function iconFish(c,x,y,col){K.ellipse(c,x+2,y,11,6,rgba(col,.25),col,2);K.sline(c,[[x-9,y],[x-16,y-6],[x-16,y+6],[x-9,y]],col,2);circle(c,x+7,y-1,1.6,col,null);
  K.sline(c,[[x+10,y-15],[x+3,y-9]],col,2);K.sline(c,[[x+3,y-9],[x+8,y-9]],col,2);K.sline(c,[[x+3,y-9],[x+3,y-14]],col,2);}
function iconValve(c,x,y,col,t){D.round(c,x-18,y-6,22,12,2,rgba(col,.25),col);circle(c,x+12,y,9,FILL,col,2);
  const a=Math.sin(t*1.6)*.5;K.sline(c,[[x+12-Math.cos(a)*7,y-Math.sin(a)*7],[x+12+Math.cos(a)*7,y+Math.sin(a)*7]],col,2.5);
  const v=mod(t*.5);withA(c,1-v,()=>circle(c,x-2,y+10+10*v,2.5,col,null));}
function iconBadge(c,x,y,col,draw,lit,t){circle(c,x,y,22,FILL,col,2.5);draw();if(lit){const u=mod(t*.8);circle(c,x,y,22+12*u,null,rgba(col,.85*(1-u)),2.5);}}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.caseSt||(s.caseSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  // layer alpha and local time of each step's layer
  const A=j=>j===k?(moving?clamp((x-.3)/.7):1):(moving&&j===st.from?1-clamp(x*1.6):0);
  const TT=j=>j===k?tau:99;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  scene(c,k,A,TT,t,rects);
  under(c,A,TT,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const sw=measure(c,T.schem,22);text(c,T.schem,16,592,22,MUTED,'left');push(rects,1,'schem',{x:16,y:574,w:sw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── the stream ───────────────────────────────────────────────────────────
function resPos(r,i,t){let dx=0,dy=0,rot=r.rot||0;
  if(r.mv==='swim'){dx=12*Math.sin(t*.7);dy=2*Math.sin(t*1.9);rot=.04*Math.cos(t*.7);}
  else if(r.mv==='crawl'){dx=3*Math.sin(t*.5);}
  else if(r.mv==='dip'){dy=-3*Math.max(0,Math.sin(t*2.4));}
  else if(r.mv==='creep'){dx=-2*Math.sin(t*.3);}
  return{x:r.x+dx,y:r.y+dy,rot};}
function resident(c,r,i,t,a){const p=resPos(r,i,t),[W,H]=K.dim(r.f),w=r.w,h=w*H/W;
  withA(c,a,()=>{c.save();c.translate(p.x,p.y);c.rotate(p.rot);
    c.save();c.globalAlpha*=.45;c.fillStyle=INK;c.filter='blur(6px)';c.beginPath();c.ellipse(0,0,w/2+4,h/2+4,0,0,Math.PI*2);c.fill();c.restore();
    K.drawIn(c,r.f,{x:-w/2,y:-h/2,w,h});c.restore();});
  return p;}
function scene(c,k,A,TT,t,rects){
  const R=SCN;
  K.drawIn(c,HB4,{x:R.x,y:R.y,w:R.w,h:R.h},{radius:14,crop:CROP});
  // glints running down the fast water
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  for(let i=0;i<7;i++){const v=mod(t*.22+i/7),hx=HAB[0].x+HAB[0].w*(.12+.76*mod(i*.37)),
    gx=mix(hx,hx-30,v),gy=mix(HAB[0].y+6,HAB[1].y+HAB[1].h-8,v);K.glow(c,gx,gy,10,WHITE,.35*Math.sin(Math.PI*v));}
  const a12=A(1)+A(2);
  if(a12>0){c.fillStyle=rgba(INK,.42*Math.min(1,a12));c.fillRect(R.x,R.y,R.w,R.h);}
  c.restore();
  D.round(c,R.x,R.y,R.w,R.h,14,null,C.edge);
  // step 0: habitats
  const a0=A(0),t0=TT(0);
  const habT=i=>2.8+.8*i,cyc=t0>6.2?Math.floor((t0-6.2)/1.4)%4:-1;
  const habLit=i=>cyc>=0?i===cyc:(t0>=habT(i)&&(i===3||t0<habT(i+1)));
  withA(c,a0,()=>HAB.forEach((r,i)=>{const ai=clamp((t0-habT(i))/.5);if(ai<=0)return;
    withA(c,ai*(habLit(i)?1:.75),()=>{if(habLit(i))c.save(),c.fillStyle=rgba(ECO,.12),c.fillRect(r.x,r.y,r.w,r.h),c.restore();dashRect(c,r,10,ECO,t,habLit(i)?3.5:2.5);});}));
  s_dbg.habLit=[0,1,2,3].map(habLit);
  // residents
  const ra=1-.45*Math.min(1,a12);
  const resT=i=>.4+.5*i;
  const pos=RES.map((r,i)=>resident(c,r,i,t,ra));
  withA(c,a0,()=>RES.forEach((r,i)=>{const ai=clamp((t0-resT(i)-.2)/.4);if(ai<=0)return;
    withA(c,ai,()=>{const q=tag(c,T.res[i],r.px,r.py,{al:r.al,col:SPC});push(rects,a0*ai,'res'+i,q);
      if(t0>resT(i)+.2&&t0<resT(i)+2.2)ring(c,q,t,SPC);});}));
  // step 1 and 2: pressure icons, step 2: measures
  const a1=A(1),t1=TT(1),a2=A(2),t2=TT(2);
  const prT=i=>1+2.2*i;
  const draws=[(x,y,col)=>iconWeir(c,x,y,col),(x,y,col)=>iconDrain(c,x,y,col,t),(x,y,col)=>iconFish(c,x,y,col)];
  // lines (behind icons): orange in step 1, green in step 2 (pressures 0 and 1)
  withA(c,a1,()=>PR.forEach((p,i)=>{const g=clamp((t1-prT(i)-.5)/.8);if(g<=0)return;const y0=p.y+24,y1=mix(y0,BOT+4,g);
    K.sline(c,[[p.x,y0],[p.x,y1]],ORANGE,3);if(g>=1){const v=mod(t*.6+i*.3);K.glow(c,p.x,mix(y0,BOT,v),8,ORANGE,.7);}}));
  withA(c,a2,()=>[0,1].forEach(i=>{const p=PR[i],g=clamp((t2-meT(i)-.5)/.8);if(g<=0)return;const y0=p.y+24,y1=mix(y0,BOT+4,g);
    K.sline(c,[[p.x,y0],[p.x,y1]],GREEN,3);if(g>=1){const v=mod(t*.6+i*.3);K.glow(c,p.x,mix(y0,BOT,v),8,GREEN,.7);}}));
  // icons
  PR.forEach((p,i)=>{const on1=a1*clamp((t1-prT(i))/.4),on2=a2*(i<2?.75:.4),a=Math.max(on1,on2);if(a<=0)return;
    withA(c,a,()=>iconBadge(c,p.x,p.y,ORANGE,()=>draws[i](p.x,p.y,ORANGE),a1>.5&&t1>=prT(i)&&(i===2||t1<prT(i+1)+1.2)||(a1>.5&&t1>7.6&&Math.floor(t*.7)%3===i),t));});
  withA(c,a1,()=>PR.forEach((p,i)=>{const ai=clamp((t1-prT(i)-.2)/.4);if(ai<=0)return;
    withA(c,ai,()=>{const q=tag(c,T.pr[i],p.x,p.y-66,{al:'center',col:ORANGE});push(rects,a1*ai,'pr'+i,q);});}));
  // measures (step 2)
  withA(c,a2,()=>{
    const f0=clamp((t2-meT(0))/.5);
    withA(c,f0,()=>{const lit=t2<meT(1)||(t2>6.6&&Math.floor(t*.6)%2===0);
      K.sline(c,[[PR[0].x,FW.y+FW.h],[PR[0].x,PR[0].y-22]],GREEN,3);
      D.round(c,FW.x-3,FW.y-3,FW.w+6,FW.h+6,12,FILL,GREEN);
      K.drawIn(c,CV5B,FW,{radius:9,crop:FWCROP});
      if(lit)ring(c,{x:FW.x-3,y:FW.y-3,w:FW.w+6,h:FW.h+6},t,GREEN);
      const q=tag(c,T.me[0],FW.x+FW.w-6,FW.y+FW.h-46,{al:'right',col:GREEN});push(rects,a2*f0,'me0',q);});
    const f1=clamp((t2-meT(1))/.5);
    withA(c,f1,()=>{const lit=t2>=meT(1)&&t2<6.6||(t2>6.6&&Math.floor(t*.6)%2===1);
      K.sline(c,[[DIS.x,DIS.y+24],[PR[1].x,PR[1].y-22]],GREEN,3);
      iconBadge(c,DIS.x,DIS.y,GREEN,()=>iconValve(c,DIS.x,DIS.y,GREEN,t),lit,t);
      const q=tag(c,T.me[1],DIS.x+32,DIS.y-20,{col:GREEN});push(rects,a2*f1,'me1',q);});
  });
  // step 3: survey frame, same place, same time
  const a3=A(3),t3=TT(3);
  withA(c,a3,()=>{const f=clamp((t3-.4)/.5);withA(c,f,()=>{
      const flash=recFlash(t3);c.save();c.fillStyle=rgba(CYAN,.06+.16*flash);c.fillRect(SURV.x,SURV.y,SURV.w,SURV.h);c.restore();
      dashRect(c,SURV,8,rgba(INK,.7),t,6);dashRect(c,SURV,8,CYAN,t,3.5);
      clock(c,SURV.x+SURV.w-2,SURV.y+2,13);
      const q=tag(c,T.place,SURV.x+SURV.w/2-8,SURV.y-46,{al:'center',col:CYAN});push(rects,a3*f,'place',q);});});
  s_dbg.pos=pos;
}
const meT=i=>[.8,3.2][i];
const recT=i=>1.6+1.1*i;
function recFlash(t3){let m=0;for(let i=0;i<5;i++){const d=t3-recT(i);if(d>=0&&d<.9)m=Math.max(m,1-d/.9);}return m;}

// ── under the stream: the step's diagram ─────────────────────────────────
function under(c,A,TT,t,rects){
  // step 0: residents box (cyan) and habitats box (green)
  const a0=A(0),t0=TT(0);
  withA(c,a0,()=>{
    const LB={x:16,y:BOT+6,w:262,h:170},RB={x:290,y:BOT+6,w:346,h:170};
    withA(c,clamp((t0-.3)/.5),()=>{D.round(c,LB.x,LB.y,LB.w,LB.h,14,CARDF,SPC);
      text(c,T.resHead,LB.x+16,LB.y+34,22,SPC);text(c,T.resSub,LB.x+16,LB.y+64,22,WHITE);
      push(rects,a0,'resHead',{x:LB.x+16,y:LB.y+15,w:measure(c,T.resHead,22),h:24});push(rects,a0,'resSub',{x:LB.x+16,y:LB.y+45,w:measure(c,T.resSub,22),h:24});
      const cw=(LB.w-24)/4,lit=Math.floor(t*.8)%4;
      RES.forEach((r,i)=>{const ai=clamp((t0-.4-.5*i)/.4);const cx=LB.x+12+cw*(i+.5),cy=LB.y+124;
        withA(c,ai,()=>{const [W,H]=K.dim(r.f),bw=cw-12,bh=56;
          if(r.rot){c.save();c.translate(cx,cy);c.rotate(r.rot);const kk=Math.min(bh/W,bw/H);K.drawIn(c,r.f,{x:-W*kk/2,y:-H*kk/2,w:W*kk,h:H*kk});c.restore();}
          else K.place(c,r.f,cx-bw/2,cy-bh/2,bw,bh);
          if(t0>2.6&&i===lit)circle(c,cx,cy,32,null,rgba(SPC,.8),2.5);});});});
    withA(c,clamp((t0-2.4)/.5),()=>{D.round(c,RB.x,RB.y,RB.w,RB.h,14,CARDF,ECO);
      text(c,T.habHead,RB.x+16,RB.y+34,22,ECO);text(c,T.habSub,RB.x+16,RB.y+64,22,WHITE);
      push(rects,a0,'habHead',{x:RB.x+16,y:RB.y+15,w:measure(c,T.habHead,22),h:24});push(rects,a0,'habSub',{x:RB.x+16,y:RB.y+45,w:measure(c,T.habSub,22),h:24});
      const pw=(RB.w-40)/2;
      T.hab.forEach((p,i)=>{const ai=clamp((t0-2.8-.8*i)/.5),lit=s_dbg.habLit&&s_dbg.habLit[i];
        const bx=RB.x+14+(i%2)*(pw+12),by=RB.y+80+Math.floor(i/2)*44;
        withA(c,ai,()=>{c.save();c.setLineDash([7,5]);c.lineDashOffset=-t*8;D.round(c,bx,by,pw,38,19,lit?rgba(ECO,.22):FILL,ECO);c.restore();
          text(c,p,bx+pw/2,by+27,22,lit?WHITE:ECO,'center');push(rects,a0*ai,'hab'+i,{x:bx+pw/2-measure(c,p,22)/2,y:by+8,w:measure(c,p,22),h:24});});});});
  });
  // step 1: condition boxes (orange)
  const a1=A(1),t1=TT(1);
  withA(c,a1,()=>[0,1,2].forEach(i=>{const ai=clamp((t1-(1+2.2*i)-1.1)/.5);if(ai<=0)return;
    withA(c,ai,()=>{const b=hbox(c,T.changed,T.cond[i],COLX[i],BOT+6,COLW,{stroke:ORANGE,hcol:ORANGE});push(rects,a1*ai,'cond'+i,b);
      if(t1>1+2.2*i+1.4&&t1<1+2.2*i+3.4)ring(c,b,t,ORANGE);});}));
  // step 2: measures' boxes (green) and the white dashed box
  const a2=A(2),t2=TT(2);
  withA(c,a2,()=>{[0,1].forEach(i=>{const ai=clamp((t2-meT(i)-1.2)/.5);if(ai<=0)return;
      withA(c,ai,()=>{const b=hbox(c,T.me[i],T.meFor[i],COLX[i],BOT+6,COLW,{stroke:GREEN,hcol:GREEN});push(rects,a2*ai,'meFor'+i,b);});});
    const ai=clamp((t2-5.6)/.5);withA(c,ai,()=>{const b=box(c,T.todo,COLX[2],BOT+6,{fixW:COLW,dash:[8,6],t});push(rects,a2*ai,'todo',b);
      if(t2>5.8&&t2<8.6)ring(c,b,t,WHITE);});});
  // step 3: same method, repeated records, results unknown
  const a3=A(3),t3=TT(3);
  withA(c,a3,()=>{
    const ta=clamp((t3-.8)/.5),cx=SCN.x+SCN.w/2;
    withA(c,ta,()=>{const w1=tagW(c,T.same)+30,w2=tagW(c,T.rep)+30,gap=14,x0=cx-(w1+w2+gap)/2,y=BOT;
      const r1=tag(c,T.same,x0,y,{col:CYAN,icon:30});clock(c,r1.x+22,y+20,10);
      const r2=tag(c,T.rep,x0+w1+gap,y,{col:CYAN,icon:30});sheet(c,r2.x+21,y+20,CYAN,.7);
      push(rects,a3*ta,'same',r1);push(rects,a3*ta,'rep',r2);});
    const XS=[86,250,358,466,574],AX=436,DIV=168;
    withA(c,clamp((t3-1.2)/.5),()=>{K.sline(c,[[40,AX],[616,AX]],rgba(WHITE,.5),2);
      c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*8;K.line(c,[[DIV,BOT+52],[DIV,AX+56]],GREEN,3);c.restore();});
    XS.forEach((xx,i)=>{const ai=clamp((t3-recT(i))/.4);if(ai<=0)return;
      withA(c,ai,()=>{const d=t3-recT(i),pop=d<.9?1+.25*Math.sin(Math.PI*clamp(d/.9)):1;sheet(c,xx,AX-22,CYAN,pop);
        if(d>=0&&d<.9)K.glow(c,xx,AX-22,26,CYAN,.5*(1-d/.9));
        const qa=clamp((d-.3)/.4);withA(c,qa,()=>{c.save();c.setLineDash([5,4]);c.lineDashOffset=-t*6;circle(c,xx,AX+22,15,FILL,WHITE,2);c.restore();
          text(c,'?',xx,AX+30,22,WHITE,'center');push(rects,a3*ai*qa,'q'+i,{x:xx-7,y:AX+12,w:14,h:22});});});});
    withA(c,clamp((t3-1.6)/.4),()=>{const w=measure(c,T.before,22);text(c,T.before,XS[0],AX+68,22,MUTED,'center');push(rects,a3,'before',{x:XS[0]-w/2,y:AX+49,w,h:24});});
    withA(c,clamp((t3-2.7)/.4),()=>{const mx=(XS[1]+XS[4])/2,w=measure(c,T.after,22);text(c,T.after,mx,AX+68,22,MUTED,'center');push(rects,a3,'after',{x:mx-w/2,y:AX+49,w,h:24});});
    const ba=clamp((t3-6.8)/.5);withA(c,ba,()=>{const b=box(c,T.notEffect,cx,BOT+180,{al:'center',stroke:WHITE,col:WHITE});push(rects,a3*ba,'notEffect',b);
      if(t3>7)ring(c,b,t,WHITE);s_dbg.bottom=b.y+b.h;});
  });
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='res'){D.round(c,x+2,ay-11,38,22,11,FILL,SPC);circle(c,ax,ay,4,SPC,null);}
  else if(kind==='hab')dashRect(c,{x:x+2,y:ay-12,w:38,h:24},6,ECO,t,2.5);
  else if(kind==='pr')iconBadge(c,ax,ay,ORANGE,()=>iconWeir(c,ax,ay,ORANGE),false,t),circle(c,ax,ay,22+4*pul,null,rgba(ORANGE,.4),2);
  else if(kind==='line'){K.sline(c,[[ax,y],[ax,y+32]],ORANGE,3);K.glow(c,ax,y+32*mod(t*.6),7,ORANGE,.7);}
  else if(kind==='me')iconBadge(c,ax,ay,GREEN,()=>iconValve(c,ax,ay,GREEN,t),false,t);
  else if(kind==='todo'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;D.round(c,x+3,y+4,36,24,6,FILL,WHITE);c.restore();}
  else if(kind==='ev'){sheet(c,ax,ay,CYAN,1);K.glow(c,ax,ay,18,CYAN,.25+.25*pul);}
  else if(kind==='q'){c.save();c.setLineDash([5,4]);c.lineDashOffset=-t*6;circle(c,ax,ay,14,FILL,WHITE,2);c.restore();text(c,'?',ax,ay+8,22,WHITE,'center');}}
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
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,28));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*28;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,28));
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
window.EnvironmentDraw.casefile=draw;
window.EnvironmentDraw.casefile.dbg=s_dbg;
})();

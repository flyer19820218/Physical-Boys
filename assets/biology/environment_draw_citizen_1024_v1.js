/* Unit 11 lesson 3 · "citizen" canvas (everyday-actions tab, view 2), 2026-10-25. A good record (plan section 4, citizen; P3, supplement).
 * Three steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Layout (as tradeoff / track / monitor): left = stage window (x 16..636, y 16..428), statement box under it (y 436..566),
 * right = step card (x 652..944).
 *  0 five fields: the four field tools (CV9 notebook, binoculars, camera, hand lens) stand in a row with their names; under them a cyan
 *    record card (cyan = tracking evidence, plan 1.4) with five fields "Place", "Date", "Time", "Photo", "Features". The fields fill one
 *    by one with symbols only (map pin, blank calendar, clock, photo frame, feature sketch; no digits, no real data); a cyan glint runs
 *    from the tool that fills it (notebook -> place, date, time; camera -> photo; binoculars and hand lens -> features) and a tick
 *    appears. Then a cyan chip "Same five fields every time". Held: the full card slides into a stack and a blank card with the same
 *    five fields fills again.
 *  1 features first: a drawn insect on a leaf (schematic, no species); the hand lens (CV9) visits colour, spots, antennae and legs, its
 *    glass shows that part enlarged; each visit fills one row of a cyan "Features" card. Above it a white dashed box (unknown, plan 1.4)
 *    "Name: leave it blank, check later" with a pulsing "?".
 *  2 safety: a plan-view road with moving cars (orange = pressure / danger), an orange no-entry sign and tag "Stay off the road";
 *    a simple standing silhouette (no face) on the grass looks through the binoculars (CV9) at a bird along a cyan dashed line; an
 *    orange "hands off" sign and tag "Never move an animal"; a cyan panel "Roadkill records" with a cyan folder from which record cards
 *    slide out, "Use safe data from the teacher". No dead animal is drawn.
 *  Every step change (0->1, 1->2, 2->0 loop, jumps) fades the old scene out, then the new one in. Stepping back shows the step complete.
 * Always moving: clock hands turn, glints run, dashes march, the lens travels, cars drive, the bird hops, rings pulse.
 * Science (plan 4): citizen observation uses teacher-arranged safe data; no entering the road, no moving animals, no collecting;
 * records carry place, date and time and use the same fields every time; no numbers or results are given.
 * Pictures (alpha bounds = whole picture, measured with PIL): CV9_notebook 281x194, CV9_binoculars 228x210, CV9_camera 211x122,
 * CV9_hand_lens 115x242 (glass centre src (57,57), radius ~50).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=9,MOVE=1.2,TAU=Math.PI*2;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const CYAN=(K.COL&&K.COL.evidence)||'#55e9ff',ORANGE=(K.COL&&K.COL.pressure)||'#fb923c';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const NOTE=ENV+'CV9_notebook.png',BINO=ENV+'CV9_binoculars.png',CAM=ENV+'CV9_camera.png',LENS=ENV+'CV9_hand_lens.png';
[NOTE,BINO,CAM,LENS].forEach(f=>{try{K.pic(K.src(f));}catch(e){}});

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('一筆好紀錄','A good record'),
 short:[P('五格紀錄','Five fields'),P('先記特徵','Features first'),P('安全第一','Safety first')],
 names:[P('一筆好紀錄有五格','A good record has five fields'),P('不確定時，先記特徵','When unsure, record features first'),P('安全第一','Safety first')],
 tools:[P('筆記本','Notebook'),P('望遠鏡','Binoculars'),P('相機','Camera'),P('放大鏡','Hand lens')],
 oneRec:P('一筆紀錄','One record'),
 fields:[L('place','地點','Place'),P('日期','Date'),L('time','時間','Time'),P('照片','Photo'),P('特徵','Features')],
 same:P('每一筆都用同樣五格','Same five fields every time'),
 bug:P('沒見過的昆蟲','An unfamiliar insect'),
 name:P('名字：先空著，之後再查','Name: leave it blank, check later'),
 feat:P('特徵','Features'),
 feats:[P('顏色','Colour'),P('斑點','Spots'),P('觸角','Antennae'),P('腳','Legs')],
 road:P('不進車道','Stay off the road'),
 hands:P('不搬動動物','Never move an animal'),
 roadkill:P('路死動物紀錄','Roadkill records'),
 safe:P('用老師安排的安全資料','Use safe data from the teacher'),
 st:[P('地點、日期、時間、照片、特徵，五格都填好','Place, date, time, photo, features: fill in all five'),
  P('先記看得到的特徵，名字可以之後再查','Record the features you can see first; the name can be checked later'),
  P('不進車道、不搬動動物；路死動物用老師安排的安全資料','Stay off the road and never move an animal; for roadkill use safe data from the teacher')],
 leg:[[['rec',P('青色卡：一筆紀錄','Cyan card: one record')],['tick',P('打勾：這一格填好了','Tick: this field is filled')]],
      [['dash',P('白虛線框：還不確定','White dashed box: not sure yet')],['look',P('青色光圈：正在看的特徵','Cyan ring: the feature being looked at')]],
      [['car',P('橘色：危險的車道','Orange: the dangerous road')],['folder',P('青色資料夾：老師安排的安全資料','Cyan folder: safe data from the teacher')]]],
 schem:P('示意，不是真實紀錄','Schematic, not a real record'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── geometry ─────────────────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412},CARD={x:652,y:16,w:292,h:550},BOT=436;
// step 0
const SX=[93,248,403,558],TOOLF=[NOTE,BINO,CAM,LENS],TBOX={y:22,h:82,w:132},TNAME_Y=128;
const REC={x:36,y:150,w:572,h:258};
const CELLS=[{x:48,y:204,w:178,h:88},{x:234,y:204,w:178,h:88},{x:420,y:204,w:176,h:88},{x:48,y:300,w:270,h:100},{x:326,y:300,w:270,h:100}];
const FT=[1.2,2.1,3.0,4.0,5.1],FROM=[[0],[0],[0],[2],[1,3]];
// step 1
const BUG={x:184,y:268};
const TGT=[[206,312],[158,248],[166,132],[268,256]];
const LENSW=96,LK=96/115,GC=57*LK,GR=36,MAG=1.9;
const NBOX={x:300,y:28,w:324},FCARD={x:356,y:128,w:268,h:288},FROW0=196,FROWH=54;
const V0=.8,VS=1.5;
// step 2
const ROAD={y0:40,y1:136},SIGN=[230,88],OBS={x:100,feet:404},BIRD={x:300,y:392},HAND=[300,306],FPAN={x:438,y:178,w:188,h:240};

// ── helpers (as in tradeoff / monitor) ───────────────────────────────────
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
const lerpP=(a,b,u)=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];
const ap=(pop,tau,at,d=.45)=>pop?clamp((tau-at)/d):1;
function tick(c,x,y,s=1,col=CYAN){c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=col;c.lineWidth=4*s;c.beginPath();c.moveTo(x-9*s,y);c.lineTo(x-3*s,y+7*s);c.lineTo(x+10*s,y-8*s);c.stroke();c.restore();}
function noSign(c,x,y,r,col,inner){circle(c,x,y,r,FILL,null);if(inner)inner();c.save();c.strokeStyle=col;c.lineWidth=5;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
  c.beginPath();c.moveTo(x-r*.7,y-r*.7);c.lineTo(x+r*.7,y+r*.7);c.stroke();c.restore();}

// ── small drawn symbols (schematic, no digits) ───────────────────────────
function symPin(c,x,y,a,t){withA(c,a,()=>{D.round(c,x-34,y-18,68,40,6,'rgba(85,233,255,.08)',rgba(CYAN,.6));
  K.sline(c,[[x-30,y+8],[x-8,y-4],[x+10,y+10],[x+30,y-6]],rgba(WHITE,.55),2);
  const b=Math.sin(t*3)*2;c.save();c.beginPath();c.arc(x,y-14+b,10,Math.PI*.85,Math.PI*.15);c.lineTo(x,y+6+b);c.closePath();c.fillStyle=CYAN;c.fill();c.restore();circle(c,x,y-14+b,4,INK,null);});}
function symCal(c,x,y,a){withA(c,a,()=>{D.round(c,x-28,y-20,56,42,5,'rgba(85,233,255,.08)',rgba(CYAN,.8));D.round(c,x-28,y-20,56,11,5,CYAN,null);
  for(let r=0;r<3;r++)for(let q=0;q<4;q++){const on=r===1&&q===2;D.round(c,x-23+q*12.5,y-4+r*8.5,9,6,1.5,on?CYAN:rgba(WHITE,.35),null);}});}
function symClock(c,x,y,a,t){withA(c,a,()=>{circle(c,x,y,21,'rgba(85,233,255,.08)',CYAN,2.5);
  for(let i=0;i<12;i++){const an=i/12*TAU;K.sline(c,[[x+16*Math.sin(an),y-16*Math.cos(an)],[x+19*Math.sin(an),y-19*Math.cos(an)]],rgba(WHITE,.6),1.5);}
  const m=t*.9,h=t*.075;K.sline(c,[[x,y],[x+15*Math.sin(m),y-15*Math.cos(m)]],WHITE,2.5);K.sline(c,[[x,y],[x+10*Math.sin(h),y-10*Math.cos(h)]],CYAN,3.5);circle(c,x,y,3,WHITE,null);});}
function leaf(c,x,y,rx,ry,rot){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();c.moveTo(0,-ry);c.quadraticCurveTo(rx*1.25,0,0,ry);c.quadraticCurveTo(-rx*1.25,0,0,-ry);
  c.fillStyle='#2c5138';c.fill();c.strokeStyle='rgba(158,200,150,.35)';c.lineWidth=2;c.stroke();K.sline(c,[[0,-ry*.92],[0,ry*.95]],'rgba(158,200,150,.4)',2);
  for(let i=-2;i<=2;i++){const yy=i*ry*.3;K.sline(c,[[0,yy],[rx*.62,yy-ry*.18]],'rgba(158,200,150,.25)',1.5);K.sline(c,[[0,yy],[-rx*.62,yy-ry*.18]],'rgba(158,200,150,.25)',1.5);}c.restore();}
// insect (schematic, no species): s = scale, centre of the wing cases at (x,y)
function bug(c,x,y,s,t,outline=false){c.save();c.translate(x,y);c.scale(s,s);
  const body=outline?null:'#8a5a3c',edge=outline?rgba(WHITE,.85):'#3a2416',lw=outline?3/s:2.5;
  const wig=Math.sin(t*2.2)*3;
  // legs
  [[-50,-46,-92,-84,-104,-104],[-56,-4,-98,-12,-118,-2],[-50,40,-86,74,-96,104]].forEach(([ax,ay,kx,ky,fx,fy],i)=>{const w=i===1?wig:0;
    K.sline(c,[[ax,ay],[kx,ky+w],[fx,fy+w]],outline?rgba(WHITE,.85):'#3a2416',outline?3/s:5);K.sline(c,[[-ax,ay],[-kx,ky-w],[-fx,fy-w]],outline?rgba(WHITE,.85):'#3a2416',outline?3/s:5);});
  // antennae
  const aw=Math.sin(t*1.7)*4;
  c.save();c.strokeStyle=outline?rgba(WHITE,.85):'#3a2416';c.lineWidth=outline?3/s:4;c.lineCap='round';
  c.beginPath();c.moveTo(-10,-116);c.quadraticCurveTo(-24,-150,-52+aw,-168);c.stroke();c.beginPath();c.moveTo(10,-116);c.quadraticCurveTo(24,-150,52-aw,-168);c.stroke();c.restore();
  // head, pronotum, wing cases
  K.ellipse(c,0,-100,22,20,outline?null:'#4a2f1d',edge,lw);
  K.ellipse(c,0,-66,36,22,outline?null:'#6b4329',edge,lw);
  K.ellipse(c,0,6,58,74,body,edge,lw);
  K.sline(c,[[0,-64+20],[0,78]],edge,lw);
  if(!outline)[[-26,-22],[24,-26],[-30,30],[30,26],[-14,58],[16,60]].forEach(([sx,sy])=>circle(c,sx,sy,9,'#e8d9a8',null));
  else [[-26,-22],[24,-26],[-30,30],[30,26]].forEach(([sx,sy])=>circle(c,sx,sy,8,null,CYAN,3/s));
  c.restore();}
function symPhoto(c,x,y,a,t,flash){withA(c,a,()=>{D.round(c,x-62,y-34,124,68,6,'#1d3a31',CYAN);
  c.save();c.beginPath();c.rect(x-58,y-30,116,60);c.clip();leaf(c,x,y+4,34,46,1.1);bug(c,x+2,y+2,.22,t);c.restore();
  if(flash>0)withA(c,flash,()=>{D.round(c,x-62,y-34,124,68,6,'rgba(242,236,217,.55)',WHITE);});});}
function symFeat(c,x,y,a,t){withA(c,a,()=>{bug(c,x-30,y+2,.24,t,true);
  const sw=t*1.2;circle(c,x+42,y-6,17,'rgba(85,233,255,.08)',CYAN,3);K.sline(c,[[x+54,y+6],[x+66,y+20]],CYAN,5);
  circle(c,x-30+Math.cos(sw)*7,y-8+Math.sin(sw)*5,4,CYAN,null);});}
function car(c,x,y,dir,a=1){withA(c,a,()=>{c.save();c.translate(x,y);if(dir<0)c.scale(-1,1);
  D.round(c,-34,-15,68,30,9,'#c46a2c',INK);D.round(c,-8,-11,24,22,5,'rgba(11,26,21,.55)',null);D.round(c,22,-11,8,22,3,rgba(WHITE,.65),null);
  circle(c,-22,-16,4,INK,null);circle(c,-22,16,4,INK,null);circle(c,22,-16,4,INK,null);circle(c,22,16,4,INK,null);c.restore();});}
function folder(c,x,y,w,h,t,col=CYAN){D.round(c,x,y,w*.42,h*.2,4,rgba(col,.9),null);D.round(c,x,y+h*.12,w,h*.88,6,'rgba(85,233,255,.18)',col);
  K.sline(c,[[x+w*.16,y+h*.46],[x+w*.84,y+h*.46]],rgba(col,.7),2);K.sline(c,[[x+w*.16,y+h*.66],[x+w*.7,y+h*.66]],rgba(col,.7),2);}
function hand(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#d8c7a6';c.strokeStyle=INK;c.lineWidth=1.5;
  D.round(c,-11,-2,22,20,6,'#d8c7a6',INK);[-9,-3,3,9].forEach((fx,i)=>D.round(c,fx-2.6,-18+(i===0||i===3?4:0),5.2,20,2.6,'#d8c7a6',INK));
  c.save();c.translate(-12,6);c.rotate(-.7);D.round(c,-2.6,-12,5.2,14,2.6,'#d8c7a6',INK);c.restore();c.restore();}
function person(c,x,feet,t){const col='#7f948a',dk='#5c6f66';
  K.sline(c,[[x-9,feet-70],[x-11,feet]],dk,11);K.sline(c,[[x+9,feet-70],[x+11,feet]],dk,11);
  D.round(c,x-20,feet-140,40,76,14,col,null);
  circle(c,x,feet-156,18,col,null);
  // arms up to the binoculars
  K.sline(c,[[x+12,feet-128],[x+24,feet-150]],col,10);K.sline(c,[[x-12,feet-128],[x+4,feet-146]],col,10);}
function bird(c,x,y,t){const h=Math.max(0,Math.sin(t*3.2))*6;c.save();c.translate(x,y-h);
  K.sline(c,[[-4,8],[-6,20+h]],'#5a4632',3);K.sline(c,[[4,8],[6,20+h]],'#5a4632',3);
  c.beginPath();c.moveTo(-22,-2);c.lineTo(-38,-10);c.lineTo(-36,2);c.closePath();c.fillStyle='#6d5640';c.fill();
  K.ellipse(c,-4,0,24,14,'#8a6d50',null);circle(c,16,-12,11,'#8a6d50',null);
  c.beginPath();c.moveTo(25,-14);c.lineTo(36,-11);c.lineTo(25,-8);c.closePath();c.fillStyle='#d6a640';c.fill();
  circle(c,19,-14,2.2,INK,null);K.ellipse(c,-8,-2,14,8,'#6d5640',null);c.restore();}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.citSt||(s.citSt={});
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
  if(k===0)record(c,tau,t,pop,rects);
  else if(k===1)features(c,tau,t,pop,rects);
  else safety(c,tau,t,pop,rects);});}

// ── step 0: five fields ──────────────────────────────────────────────────
function record(c,tau,t,pop,rects){
  const rounds=pop?Math.floor(Math.max(0,tau)/PER):1,cyc=pop?(tau<PER?tau:mod(tau,PER)):99;
  // which field is being filled now (or, when shown complete, a slow highlight round)
  let act=-1,glint=-1,gu=0;
  if(pop){for(let i=0;i<5;i++){if(cyc>=FT[i]-.8&&cyc<FT[i]+.5)act=i;if(cyc>=FT[i]-.7&&cyc<FT[i]){glint=i;gu=(cyc-FT[i]+.7)/.7;}}}
  if(act<0&&(!pop||cyc>FT[4]+.5))act=Math.floor(mod(t/1.6,5));
  const litTools=act>=0?FROM[act]:[];
  // tools row
  const ta=ap(pop,tau,.1);
  withA(c,ta,()=>SX.forEach((sx,j)=>{const on=litTools.includes(j);
    const R={x:sx-TBOX.w/2-6,y:TBOX.y-4,w:TBOX.w+12,h:TNAME_Y-TBOX.y+14};
    D.round(c,R.x,R.y,R.w,R.h,12,on?'rgba(85,233,255,.10)':'rgba(11,26,21,.35)',on?CYAN:rgba(WHITE,.18));
    if(on)K.glow(c,sx,TBOX.y+TBOX.h/2,60,CYAN,.18+.08*Math.sin(t*4));
    K.place(c,TOOLF[j],sx-TBOX.w/2,TBOX.y,TBOX.w,TBOX.h-6);
    text(c,T.tools[j],sx,TNAME_Y,22,on?CYAN:WHITE,'center');const w=measure(c,T.tools[j],22);push(rects,ta,'tool'+j,{x:sx-w/2,y:TNAME_Y-19,w,h:24});}));
  // stack of earlier records (held step: one more each round, at most 3)
  const ra=ap(pop,tau,.4);
  const nStack=Math.min(3,rounds),slide=pop&&rounds>0&&cyc<.8?smooth(cyc/.8):1;
  withA(c,ra,()=>{for(let j=Math.min(3,nStack);j>=1;j--){const off=4*(j-1+slide);D.round(c,REC.x+off,REC.y+off,REC.w,REC.h,14,'#0f2c25',rgba(CYAN,.45));}});
  const ca=ra*(pop&&rounds>0&&cyc<.8?smooth(cyc/.8):1);
  withA(c,ca,()=>{
    D.round(c,REC.x,REC.y,REC.w,REC.h,14,'#123029',CYAN);
    const r=tag(c,T.oneRec,REC.x+12,REC.y+10,{col:CYAN});push(rects,ca,'oneRec',r);
    const sa=pop?(rounds>0?1:clamp((cyc-6.0)/.5)):1;
    withA(c,sa,()=>{const r2=tag(c,T.same,REC.x+REC.w-12,REC.y+10,{al:'right',col:CYAN,minX:REC.x+170});push(rects,sa*ca,'same',r2);
      if(pop&&rounds===0&&cyc>6.3&&cyc<8.8)ring(c,r2,t,CYAN);});
    CELLS.forEach((R,i)=>{const f=pop?clamp((cyc-FT[i])/.5):1,on=i===act;
      if(f<1){c.save();c.setLineDash([7,6]);D.round(c,R.x,R.y,R.w,R.h,10,'rgba(11,26,21,.45)',rgba(MUTED,.55));c.restore();}
      withA(c,f,()=>D.round(c,R.x,R.y,R.w,R.h,10,on?'rgba(85,233,255,.14)':'rgba(85,233,255,.06)',on?CYAN:rgba(CYAN,.8)));
      text(c,T.fields[i],R.x+12,R.y+30,22,f>.5?CYAN:MUTED);const w=measure(c,T.fields[i],22);push(rects,ca,'field'+i,{x:R.x+12,y:R.y+11,w,h:24});
      const sx=R.x+R.w/2+(i<3?0:22),sy=R.y+(i<3?60:62);
      if(i===0)symPin(c,sx+20,sy,f,t);else if(i===1)symCal(c,sx+20,sy,f);else if(i===2)symClock(c,sx+20,sy-2,f,t);
      else if(i===3)symPhoto(c,sx+16,sy,f,t,pop?clamp(1-(cyc-FT[3])/.5)*(cyc>=FT[3]?1:0):0);else symFeat(c,sx+10,sy,f,t);
      withA(c,f,()=>{circle(c,R.x+R.w-20,R.y+20,13,FILL,CYAN,2);tick(c,R.x+R.w-20,R.y+20,.75);});
      if(on)ring(c,R,t,CYAN);});
  });
  // glint from the tool to the field
  if(glint>=0)FROM[glint].forEach(j=>{const R=CELLS[glint],p0=[SX[j],TNAME_Y+12],p1=[R.x+R.w/2+(glint<3?20:glint===3?38:32),R.y+(glint<3?58:62)],v=smooth(gu);
    const q=lerpP(p0,p1,v);K.glow(c,q[0],q[1],18,CYAN,.9);circle(c,q[0],q[1],5,WHITE,null);});
  s_dbg.act=act;
}

// ── step 1: features first ───────────────────────────────────────────────
function lensPos(pop,tau,t){
  // returns {p:[x,y], vis: index of the feature being visited (or -1 while moving), n: rows filled}
  const REST=[300,400];
  if(!pop){const q=mod(t/VS,4),i=Math.floor(q),w=q-i,prev=TGT[(i+3)%4];return{p:w<.33?lerpP(prev,TGT[i],smooth(w/.33)):TGT[i],vis:w<.33?-1:i,n:4};}
  if(tau<V0)return{p:REST,vis:-1,n:0};
  const q=(tau-V0)/VS,i=Math.floor(q)%4,w=q-Math.floor(q),prev=q<1?REST:TGT[(i+3)%4];
  const n=Math.min(4,Math.floor(q)+(w>=.33?1:0));
  return{p:w<.33?lerpP(prev,TGT[i],smooth(w/.33)):TGT[i],vis:w<.33?-1:i,n,fillAge:(w-.33)*VS};}
function features(c,tau,t,pop,rects){
  // insect on a leaf
  const ba=ap(pop,tau,.1);
  withA(c,ba,()=>{leaf(c,BUG.x+6,BUG.y+14,118,170,.12);bug(c,BUG.x,BUG.y,1,t);
    const r=tag(c,T.bug,WIN.x+12,WIN.y+10,{col:WHITE});push(rects,ba,'bug',r);});
  const L0=lensPos(pop,tau,t);
  // name box (white dashed = not sure yet)
  const na=ap(pop,tau,.3);
  withA(c,na,()=>{const b=box(c,T.name,NBOX.x+NBOX.w-48,NBOX.y,{al:'right',maxW:NBOX.w-56,dash:[8,6],t});push(rects,na,'name',b);
    const qx=NBOX.x+NBOX.w-22,qy=b.y+b.h/2,pu=mod(t*.9);
    circle(c,qx,qy,18,FILL,WHITE,2);circle(c,qx,qy,18+10*pu,null,rgba(WHITE,.8*(1-pu)),2);
    c.save();c.font=K.MONO(24);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('?',qx,qy+1);c.restore();
    s_dbg.nameBottom=b.y+b.h;});
  // features card
  const fa=ap(pop,tau,.5);
  withA(c,fa,()=>{D.round(c,FCARD.x,FCARD.y,FCARD.w,FCARD.h,14,'#123029',CYAN);
    const r=tag(c,T.feat,FCARD.x+12,FCARD.y+10,{col:CYAN});push(rects,fa,'featTitle',r);
    T.feats.forEach((p,i)=>{const y=FROW0+i*FROWH,R={x:FCARD.x+10,y:y-4,w:FCARD.w-20,h:FROWH-8};
      const f=pop?(L0.n>i?(L0.n-1===i&&L0.fillAge!=null&&L0.vis===i&&tau<V0+VS*4.2?clamp(L0.fillAge/.4):1):0):1,on=L0.vis===i;
      if(f<1){c.save();c.setLineDash([7,6]);D.round(c,R.x,R.y,R.w,R.h,10,'rgba(11,26,21,.45)',rgba(MUTED,.5));c.restore();}
      withA(c,f,()=>{D.round(c,R.x,R.y,R.w,R.h,10,on?'rgba(85,233,255,.16)':'rgba(85,233,255,.06)',on?CYAN:rgba(CYAN,.7));
        featSym(c,i,R.x+34,R.y+R.h/2,t);
        text(c,p,R.x+70,R.y+R.h/2+8,22,on?WHITE:CYAN);push(rects,f,'feat'+i,{x:R.x+70,y:R.y+R.h/2-11,w:measure(c,p,22),h:24});
        circle(c,R.x+R.w-22,R.y+R.h/2,12,FILL,CYAN,2);tick(c,R.x+R.w-22,R.y+R.h/2,.7);});
      if(on&&f>=.99)ring(c,R,t,CYAN);});});
  // the hand lens (drawn last, over the insect); glass shows the part enlarged
  const la=ap(pop,tau,.6);
  withA(c,la,()=>{const [lx,ly]=L0.p,H=LENSW*242/115;
    K.drawIn(c,LENS,{x:lx-GC,y:ly-GC,w:LENSW,h:H});
    c.save();c.beginPath();c.arc(lx,ly,GR,0,TAU);c.clip();c.fillStyle='#16332b';c.fillRect(lx-GR,ly-GR,GR*2,GR*2);
    c.translate(lx,ly);c.scale(MAG,MAG);c.translate(-lx,-ly);leaf(c,BUG.x+6,BUG.y+14,118,170,.12);bug(c,BUG.x,BUG.y,1,t);c.restore();
    const g=c.createRadialGradient(lx-12,ly-14,2,lx,ly,GR);g.addColorStop(0,'rgba(255,255,255,.28)');g.addColorStop(1,'rgba(255,255,255,0)');
    c.save();c.fillStyle=g;c.beginPath();c.arc(lx,ly,GR,0,TAU);c.fill();c.restore();
    if(L0.vis>=0){const pu=mod(t*.9);circle(c,lx,ly,GR+3,null,CYAN,3);circle(c,lx,ly,GR+4+10*pu,null,rgba(CYAN,.8*(1-pu)),2);
      // glint to the row
      const y=FROW0+L0.vis*FROWH+(FROWH-8)/2-4,v=mod(t*.8);K.dashed(c,[[lx+GR+4,ly],[FCARD.x+8,y]],rgba(CYAN,.35),2,[6,6],-t*12);
      K.glow(c,mix(lx+GR+4,FCARD.x+8,v),mix(ly,y,v),12,CYAN,.8);}});
  s_dbg.lens=L0;
}
function featSym(c,i,x,y,t){
  if(i===0){D.round(c,x-16,y-12,32,24,6,'#8a5a3c',WHITE);}
  else if(i===1){D.round(c,x-18,y-13,36,26,6,'#8a5a3c',null);[[-8,-4],[7,-5],[-6,6],[8,5]].forEach(([dx,dy])=>circle(c,x+dx,y+dy,3.5,'#e8d9a8',null));}
  else if(i===2){const w=Math.sin(t*1.7)*2;c.save();c.strokeStyle=WHITE;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(x-3,y+12);c.quadraticCurveTo(x-6,y-2,x-15+w,y-12);c.stroke();
    c.beginPath();c.moveTo(x+3,y+12);c.quadraticCurveTo(x+6,y-2,x+15-w,y-12);c.stroke();c.restore();}
  else{K.sline(c,[[x-16,y-10],[x-4,y-2],[x-8,y+12]],WHITE,3);K.sline(c,[[x-2,y-12],[x+8,y-2],[x+4,y+12]],WHITE,3);K.sline(c,[[x+10,y-12],[x+18,y-2],[x+16,y+12]],WHITE,3);}}

// ── step 2: safety ───────────────────────────────────────────────────────
function safety(c,tau,t,pop,rects){
  // ground: grass below the road
  D.round(c,WIN.x+2,ROAD.y1,WIN.w-4,WIN.y+WIN.h-ROAD.y1-2,12,'#1d3b2d',null);
  // road (plan view) with moving cars
  c.save();c.beginPath();c.rect(WIN.x+2,ROAD.y0,WIN.w-4,ROAD.y1-ROAD.y0);c.clip();
  c.fillStyle='#34413c';c.fillRect(WIN.x,ROAD.y0,WIN.w,ROAD.y1-ROAD.y0);
  K.dashed(c,[[WIN.x,(ROAD.y0+ROAD.y1)/2],[WIN.x+WIN.w,(ROAD.y0+ROAD.y1)/2]],rgba(WHITE,.6),3,[18,14],0);
  for(let j=0;j<2;j++){const q=mod(t*.13+j*.5);car(c,mix(WIN.x-50,WIN.x+WIN.w+50,q),ROAD.y0+24,1);
    const q2=mod(t*.11+j*.5+.25);car(c,mix(WIN.x+WIN.w+50,WIN.x-50,q2),ROAD.y1-24,-1);}
  c.restore();
  K.sline(c,[[WIN.x+2,ROAD.y0],[WIN.x+WIN.w-2,ROAD.y0]],rgba(WHITE,.4),2);
  // rule 1: stay off the road (orange = danger)
  const r1=ap(pop,tau,.9);
  withA(c,r1,()=>{K.dashed(c,[[WIN.x+4,ROAD.y1+2],[WIN.x+WIN.w-4,ROAD.y1+2]],ORANGE,4,[14,8],-t*10);
    const pu=.5+.5*Math.sin(t*3);K.glow(c,SIGN[0],SIGN[1],46,ORANGE,.25+.15*pu);
    noSign(c,SIGN[0],SIGN[1],28,ORANGE,()=>{const x=SIGN[0],y=SIGN[1];K.ellipse(c,x-6,y+4,6,10,WHITE,null);K.ellipse(c,x+7,y-6,6,10,WHITE,null);});
    const r=tag(c,T.road,SIGN[0],ROAD.y1+10,{al:'center',col:ORANGE});push(rects,r1,'road',r);
    if(pop&&tau>1.1&&tau<3.5)ring(c,r,t,ORANGE);});
  // the observer and the bird
  const oa=ap(pop,tau,.2);
  withA(c,oa,()=>{person(c,OBS.x,OBS.feet,t);
    const by=OBS.feet-156;K.place(c,BINO,OBS.x+4,by-26,50,48);
    bird(c,BIRD.x,BIRD.y,t);
    K.dashed(c,[[OBS.x+52,by-2],[BIRD.x-22,BIRD.y-12]],rgba(CYAN,.85),3,[10,8],-t*14);
    const g=mod(t*.5);K.glow(c,mix(OBS.x+52,BIRD.x-22,g),mix(by-2,BIRD.y-12,g),12,CYAN,.7);});
  // rule 2: never move an animal
  const r2=ap(pop,tau,2.6);
  withA(c,r2,()=>{noSign(c,HAND[0],HAND[1],28,ORANGE,()=>hand(c,HAND[0],HAND[1]+2,1));
    const r=tag(c,T.hands,HAND[0],HAND[1]-90,{al:'center',col:ORANGE,maxX:FPAN.x-8});push(rects,r2,'hands',r);
    if(pop&&tau>2.8&&tau<5)ring(c,r,t,ORANGE);});
  // rule 3: roadkill records come from safe data arranged by the teacher
  const r3=ap(pop,tau,4.2);
  withA(c,r3,()=>{D.round(c,FPAN.x,FPAN.y,FPAN.w,FPAN.h,14,'rgba(11,26,21,.88)',CYAN);
    const b1=box(c,T.roadkill,FPAN.x+FPAN.w/2,FPAN.y+10,{al:'center',maxW:FPAN.w-12,stroke:CYAN,col:CYAN});push(rects,r3,'roadkill',b1);
    const fx=FPAN.x+FPAN.w/2-36,fy=b1.y+b1.h+14,fw=72,fh=54;
    // record cards slide out of the folder
    for(let j=0;j<3;j++){const q=mod(t*.35+j/3);withA(c,Math.min(1,q*4,(1-q)*3),()=>{D.round(c,fx+12+q*30,fy-4-q*10,44,30,4,'#123029',CYAN);K.sline(c,[[fx+18+q*30,fy+6-q*10],[fx+48+q*30,fy+6-q*10]],rgba(CYAN,.7),2);});}
    folder(c,fx,fy,fw,fh,t);
    const sy=fy+fh+12,h=bwrapC(c,T.safe,FPAN.x+FPAN.w/2,sy+20,FPAN.w-20,22,CYAN,27);push(rects,r3,'safe',{x:FPAN.x+10,y:sy,w:FPAN.w-20,h});
    s_dbg.fpanBottom=sy+h;
    if(pop&&tau>4.4&&tau<7)ring(c,FPAN,t,CYAN);});
}
function bwrapC(c,p,cx,y,w,size,col,lh){const str=D.tr(p),r=/[一-鿿]/.test(str)?blines(c,p,w,size):greedyBal(c,str,w,size);r.forEach((q,i)=>text(c,q,cx,y+i*lh,size,col,'center'));return r.length*lh;}

// ── statements under the stage ───────────────────────────────────────────
function under(c,k,st,moving,x,tau,t,rects){
  const cx=WIN.x+WIN.w/2,sd=[5.8,6.9,5.6][k];
  const one=(kk,a,live)=>withA(c,a,()=>{
    const col=kk===2?ORANGE:CYAN;
    const qa=live?(st.from===kk+1?1:clamp((tau-sd)/.5)):1;
    withA(c,qa,()=>{const b=box(c,T.st[kk],cx,BOT,{maxW:WIN.w,al:'center',stroke:col,col:kk===2?WHITE:WHITE});if(live){push(rects,qa,'say',b);if(tau>sd+.5&&tau<sd+3)ring(c,b,t,col);}s_dbg.sayBottom=b.y+b.h;});
  });
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='rec'){D.round(c,x+4,y+3,34,28,5,'#123029',CYAN);K.sline(c,[[x+10,y+13],[x+32,y+13]],rgba(CYAN,.7),2);K.sline(c,[[x+10,y+22],[x+26,y+22]],rgba(CYAN,.7),2);}
  else if(kind==='tick'){circle(c,ax,ay,13,FILL,CYAN,2);tick(c,ax,ay,.75);circle(c,ax,ay,13+6*pul,null,rgba(CYAN,.5*(1-pul)),2);}
  else if(kind==='dash'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;D.round(c,x+3,y+4,36,24,6,FILL,WHITE);c.restore();}
  else if(kind==='look'){circle(c,ax,ay,12,'rgba(85,233,255,.12)',CYAN,3);circle(c,ax,ay,12+6*pul,null,rgba(CYAN,.6*(1-pul)),2);}
  else if(kind==='car'){c.save();c.translate(ax,ay);c.scale(.55,.55);car(c,0,0,1);c.restore();K.glow(c,ax,ay,16,ORANGE,.15+.15*pul);}
  else if(kind==='folder'){folder(c,x+5,y+4,34,26,t);K.glow(c,ax,ay,16,CYAN,.1+.15*pul);}}
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
window.EnvironmentDraw.citizen=draw;
window.EnvironmentDraw.citizen.dbg=s_dbg;
})();

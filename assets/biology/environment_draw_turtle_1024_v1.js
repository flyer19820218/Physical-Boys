/* Unit 11 lesson 3 · "turtle" canvas (conservation-evidence tab, view 0), 2026-10-25. One turtle, several homes (plan section 4, turtle; P1).
 * Five steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Always moving: the turtle marker bobs on the route strip, light dots run along the lit route, waves glint on the sea,
 * hatchlings crawl in a loop, the young turtle swims, particles drift, the lit tag or box breathes.
 * Layout (as casefile / track): left = stage (x 16..636), right = step card (x 652..944, y 16..566).
 *   ROUTE (y 16..142): the route from left to right: nesting beach -> open sea -> seagrass bed (three homes, white pills),
 *     with a faint dashed return arc above (seagrass -> beach) that lights up in step 4. A small turtle walks the route.
 *   SCN (y 166..486): the step's scene; STATEMENT box under it (y 496..).
 *  0 nesting beach: CV2_nesting_beach.jpg; small picture CV1_nest_cutaway.png (eggs under the sand), dashed line to the nest pit.
 *  1 leaving the beach: same CV2 picture (no fade, same composition); three CV1_hatchling.png crawl from the nest pit to the sea; tags "hatching", "to the sea".
 *  2 open sea: a drawn blue gradient (schematic, tag "schematic") with drifting particles; CV1_juvenile.png swims (no size label: the
 *    original picture has an adult posture).
 *  3 seagrass bed: CV3_seagrass.jpg (its own turtle feeds); tags "seagrass bed", "feeding" pointing at the turtle's head.
 *  4 back to nest: CV2 again (fade from CV3); CV1_green_turtle_adult.png crawls out of the sea; tag "back to the coast to nest";
 *    white dashed box "often returns near where it hatched / most studies say so" (uncertain = white dashed, plan 1.4);
 *    ONE orange arrow (pressure, recalls lesson 2) points at the beach: "if the beach is gone, the cycle is missing a piece";
 *    the beach pill on the route flashes orange; conclusion box.
 * Science (plan 4): no conservation category, numbers or years; "often returns near where it hatched" kept as in VIEWS (teacher to confirm).
 * Pictures (alpha bbox = whole picture, measured with PIL): adult 369x278, hatchling 227x141 (faces left), juvenile 509x311 (faces right),
 * nest cutaway 367x390, CV2 / CV3 1024x572 (crop rows 20..549). Positions on CV2 / CV3 picked once from the pictures (source px below).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=5,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const ORANGE=(K.COL&&K.COL.pressure)||'#fb923c',CYAN=(K.COL&&K.COL.evidence)||'#55e9ff';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const BEACH=ENV+'CV2_nesting_beach.jpg',GRASS=ENV+'CV3_seagrass.jpg',ADULT=ENV+'CV1_green_turtle_adult.png',HATCH=ENV+'CV1_hatchling.png',
      JUV=ENV+'CV1_juvenile.png',NEST=ENV+'CV1_nest_cutaway.png';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('一隻海龜用幾個家','How many homes does one turtle use?'),
 short:[P('產卵的沙灘','Nesting beach'),P('離開沙灘','Leaving the beach'),P('外海成長','Growing offshore'),P('海草床覓食','Seagrass feeding'),P('回來產卵','Back to nest')],
 names:[P('家一：產卵的沙灘','Home 1: the nesting beach'),P('孵化後離開沙灘','After hatching: leaving the beach'),P('家二：外海成長','Home 2: growing offshore'),P('家三：近岸海草床覓食','Home 3: feeding in seagrass beds'),P('回到海岸產卵，循環才完整','Back to the coast to nest: the cycle is complete')],
 home:[P('產卵沙灘','Nesting beach'),P('外海','Open sea'),P('海草床','Seagrass bed')],
 nest:P('沙下的卵窩','Eggs under the sand'),
 hatch:P('孵化','Hatching'),toSea:P('爬向海','Crawling to the sea'),
 schem:L('schematic','示意','Schematic'),
 feed:P('覓食','Feeding'),
 back:P('回到海岸產卵','Back to the coast to nest'),
 often:P('常回到出生地附近','Often returns near where it hatched'),study:P('多數研究如此','Most studies say so'),
 gone:P('沙灘消失，這個循環就缺一塊','If the beach is gone, the cycle is missing a piece'),
 st:[P('沙灘是第一個家：產卵','The beach is the first home: nesting'),
  P('小海龜要通過同一片沙灘，才能到海','Hatchlings must cross the same beach to reach the sea'),
  P('這一段需要的是外海，不是沙灘','This stage needs the open sea, not the beach'),
  P('同一隻海龜，不同階段用不同的家','One turtle uses different homes at different stages'),
  P('只保護動物、不保護牠要用的家，保育沒有完成','Protecting only the animal, not the homes it uses, is not complete conservation')],
 leg:[[['route',P('上方：一隻海龜用到的家','Top: the homes one turtle uses')],['nest',P('小圖：沙下卵窩的剖面','Small picture: egg chamber, cut open')]],
      [['hatch',P('小海龜爬向海','Hatchlings crawl to the sea')],['dots',P('亮點：海龜走的路線','Moving light: the route')]],
      [['juv',P('海龜在外海長大','The turtle grows up offshore')],['grad',P('藍色漸層：示意，不代表某個海域','Blue gradient: schematic, no particular sea')]],
      [['grass',P('海草床：覓食的地方','Seagrass bed: a feeding place')],['three',P('三個家，依序用到','Three homes, used in turn')]],
      [['orange',P('橘色：壓力（第 2 課）','Orange: pressure (lesson 2)')],['dash',P('白虛線框：多數研究如此','White dashed box: most studies say so')]]],
 size:L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── geometry ─────────────────────────────────────────────────────────────
const ROUTE={x:16,y:16,w:620,h:126};
const LINE_Y=66,NX=[110,326,542],PILL_Y=94;
const ARC=[[NX[2],LINE_Y],[326,-6],[NX[0],LINE_Y]];      // return arc (quadratic), peak y = 30
const SCN={x:16,y:166,w:620,h:320};
const CROP=[0,20/572,1,529/572],SC=620/1024;
const sx=X=>SCN.x+X*SC,sy=Y=>SCN.y+(Y-20)*SC;
const PIT={x:sx(712),y:sy(168)};                           // nest pit on CV2
const INSET={x:488,y:316,w:136,h:136*390/367};             // nest cutaway card
const SEA_EDGE={x:sx(235),y:sy(470)};                      // where the hatchlings reach the water (CV2)
const HEAD={x:sx(505),y:sy(372)};                          // feeding turtle's head on CV3
const BOT=496;
const CARD={x:652,y:16,w:292,h:550};
const BG=['beach','beach','sea','grass','beach'];

// ── helpers (as in casefile / track) ─────────────────────────────────────
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
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),w=g.w,bx=al==='center'?x-w/2:al==='right'?x-w:x,by=y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,w,g.h,g.rows.length>1?14:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill=FILL,dash=null,t=0,minX=SCN.x+4,maxX=SCN.x+SCN.w-4}={}){
  const w=tagW(c,p,size),h=size+18;let bx=al==='right'?x-w:al==='center'?x-w/2:x;bx=Math.max(minX,Math.min(bx,maxX-w));
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}
  D.round(c,bx,y,w,h,h/2,fill,rgba(col,.95));if(dash)c.restore();
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
// a picture centred at (x,y) with width w, a soft dark shadow under it
function sprite(c,f,x,y,w,{rot=0,a=1,shadow=.4}={}){const [W,H]=K.dim(f),h=w*H/W;
  withA(c,a,()=>{c.save();c.translate(x,y);c.rotate(rot);
    if(shadow>0){c.save();c.globalAlpha*=shadow;c.fillStyle=INK;c.filter='blur(5px)';c.beginPath();c.ellipse(0,h*.12,w/2,h/2.4,0,0,Math.PI*2);c.fill();c.restore();}
    K.drawIn(c,f,{x:-w/2,y:-h/2,w,h});c.restore();});}
// an arrow with a dark outline, readable on the light sand
function oarrow(c,x1,y1,x2,y2,col,w=4){const a=Math.atan2(y2-y1,x2-x1),hl=22,hw=13,ca=Math.cos(a),sa=Math.sin(a);
  const bx=x2-hl*ca,by=y2-hl*sa;K.sline(c,[[x1,y1],[bx,by]],rgba(INK,.75),w+4);K.sline(c,[[x1,y1],[bx+2*ca,by+2*sa]],col,w);
  c.save();c.beginPath();c.moveTo(x2,y2);c.lineTo(bx+hw*sa,by-hw*ca);c.lineTo(bx-hw*sa,by+hw*ca);c.closePath();
  c.fillStyle=col;c.strokeStyle=rgba(INK,.75);c.lineWidth=2.5;c.lineJoin='round';c.stroke();c.fill();c.restore();}
const bez=(p,u)=>[(1-u)*(1-u)*p[0][0]+2*(1-u)*u*p[1][0]+u*u*p[2][0],(1-u)*(1-u)*p[0][1]+2*(1-u)*u*p[1][1]+u*u*p[2][1]];

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.turtleSt||(s.turtleSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=j=>j===k?(moving?clamp((x-.3)/.7):1):(moving&&j===st.from?1-clamp(x*1.6):0);
  const TT=j=>j===k?tau:99;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  route(c,k,st,moving,u,tau,t,rects);
  scene(c,k,st,moving,u,A,TT,t,rects);
  statement(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const sw=measure(c,T.size,22);text(c,T.size,16,592,22,MUTED,'left');push(rects,1,'size',{x:16,y:574,w:sw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── route strip (top) ────────────────────────────────────────────────────
// where the marker is in step j at local time q (seconds); returns {x,y,f,w}
function marker(j,q,t){const g=smooth(clamp((q-.6)/4)),bob=2*Math.sin(t*2.2);
  if(j===0)return{x:NX[0]+30,y:LINE_Y+bob,f:ADULT,w:56};
  if(j===1)return{x:mix(NX[0]+30,(NX[0]+NX[1])/2,g),y:LINE_Y+bob,f:HATCH,w:44};
  if(j===2)return{x:mix((NX[0]+NX[1])/2,NX[1]+34,g),y:LINE_Y+bob,f:JUV,w:56};
  if(j===3)return{x:mix(NX[1]+34,NX[2]+30,g),y:LINE_Y+bob,f:ADULT,w:56};
  const p=bez(ARC,mix(.06,.94,g));return{x:p[0],y:p[1]+bob,f:ADULT,w:56};}
function route(c,k,st,moving,u,tau,t,rects){
  const R=ROUTE;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.92)',C.edge);
  // return arc: faint dashes, lit in step 4
  const arcPts=[];for(let i=0;i<=40;i++)arcPts.push(bez(ARC,i/40));
  const lit4=k===4?u:(moving&&st.from===4?1-u:0);
  K.dashed(c,arcPts,rgba(WHITE,.28),2,[7,7],-t*6);
  withA(c,lit4,()=>{K.dashed(c,arcPts,WHITE,3,[10,7],-t*10);
    const v=mod(t*.35);const p=bez(ARC,v);K.glow(c,p[0],p[1],10,WHITE,.6);
    const e=bez(ARC,.97),d=bez(ARC,.9);K.arrow(c,d[0],d[1],e[0],e[1],WHITE,3);});
  // forward line; the part already travelled is bright
  const reach=[NX[0],(NX[0]+NX[1])/2,NX[1],NX[2],NX[2]][k];
  K.sline(c,[[NX[0],LINE_Y],[NX[2],LINE_Y]],rgba(WHITE,.25),3);
  K.sline(c,[[NX[0],LINE_Y],[Math.max(NX[0],reach),LINE_Y]],WHITE,4);
  if(reach>NX[0]){for(let i=0;i<3;i++){const v=mod(t*.4+i/3),px=mix(NX[0],reach,v);K.glow(c,px,LINE_Y,9,WHITE,.55*Math.sin(Math.PI*v));}}
  // homes: dot on the line + pill under it
  const homeOf=[0,0,1,2,0],hk=homeOf[k];
  NX.forEach((nx,i)=>{const on=(k===3?i<=2:k===4?true:i<=hk)||(k===1&&i===0),cur=i===hk&&k!==1;
    circle(c,nx,LINE_Y,9,on?WHITE:FILL,on?WHITE:rgba(MUTED,.7),2);
    const q=tag(c,T.home[i],nx,PILL_Y,{al:'center',col:on?WHITE:MUTED,minX:R.x+4,maxX:R.x+R.w-4});
    push(rects,1,'home'+i,q);
    if(cur&&k!==4)ring(c,q,t,WHITE);
    // step 4: the beach pill flashes orange once the orange arrow is up
    if(i===0&&k===4&&tau>4.2){const f=.5+.5*Math.sin(t*4);c.save();c.setLineDash([7,5]);c.lineDashOffset=-t*10;
      D.round(c,q.x-5,q.y-5,q.w+10,q.h+10,(q.h+10)/2,null,rgba(ORANGE,.55+.45*f));c.restore();}
  });
  // the turtle on the route
  const q=k===st.from?99:tau,m=marker(k,q,t);
  if(moving&&st.from>=0){const m0=marker(st.from,99,t);sprite(c,m0.f,m0.x,m0.y,m0.w,{a:1-u,shadow:.5});}
  sprite(c,m.f,m.x,m.y,m.w,{a:moving?u:1,shadow:.5});
  s_dbg.marker=m;
}

// ── scene (middle) ───────────────────────────────────────────────────────
function seaGrad(c,R,t){const g=c.createLinearGradient(0,R.y,0,R.y+R.h);g.addColorStop(0,'#2a7fa8');g.addColorStop(.55,'#155a7e');g.addColorStop(1,'#0d3550');
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();c.fillStyle=g;c.fillRect(R.x,R.y,R.w,R.h);
  // light bands and drifting particles
  for(let i=0;i<5;i++){const bx=R.x+60+i*130+20*Math.sin(t*.3+i);c.save();c.globalAlpha=.07+.04*Math.sin(t*.8+i*1.3);c.fillStyle=WHITE;
    c.beginPath();c.moveTo(bx-14,R.y);c.lineTo(bx+14,R.y);c.lineTo(bx+70,R.y+R.h);c.lineTo(bx+20,R.y+R.h);c.closePath();c.fill();c.restore();}
  for(let i=0;i<26;i++){const v=mod(t*.05+i*.383),px=R.x+mod(i*.618+.03*Math.sin(t*.4+i))*R.w,py=R.y+R.h*(1-v);circle(c,px,py,1.6+(i%3)*.7,rgba(WHITE,.35*Math.sin(Math.PI*v)),null);}
  c.restore();}
function bg(c,id,t,a){withA(c,a,()=>{const R=SCN;
  if(id==='beach')K.drawIn(c,BEACH,R,{radius:14,crop:CROP});
  else if(id==='grass')K.drawIn(c,GRASS,R,{radius:14,crop:CROP});
  else seaGrad(c,R,t);});}
function scene(c,k,st,moving,u,A,TT,t,rects){
  const R=SCN,cur=BG[k],old=moving&&st.from>=0?BG[st.from]:cur;
  if(old!==cur){bg(c,old,t,1);bg(c,cur,t,u);}else bg(c,cur,t,1);
  // always-on motion on the pictures: glints on the sea (CV2) or in the water (CV3)
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  const aB=(cur==='beach'?(old===cur?1:u):0)+(old==='beach'&&old!==cur?1-u:0);
  withA(c,aB,()=>{for(let i=0;i<6;i++){const v=mod(t*.18+i/6),gx=sx(40+170*mod(i*.43)+60*v),gy=sy(140+380*mod(i*.71)+30*v);K.glow(c,gx,gy,9,WHITE,.45*Math.sin(Math.PI*v));}});
  const aG=(cur==='grass'?(old===cur?1:u):0)+(old==='grass'&&old!==cur?1-u:0);
  withA(c,aG,()=>{for(let i=0;i<18;i++){const v=mod(t*.06+i*.29),px=R.x+mod(i*.618)*R.w+8*Math.sin(t*.7+i),py=R.y+R.h*(1-v);circle(c,px,py,1.8,rgba(WHITE,.45*Math.sin(Math.PI*v)),null);}});
  c.restore();
  D.round(c,R.x,R.y,R.w,R.h,14,null,C.edge);
  // home tag at the top left of the scene (steps 0, 2, 3)
  const homeTag=[0,null,1,2,null];
  [0,1,2,3,4].forEach(j=>{const a=A(j),h=homeTag[j];if(a<=0||h===null)return;const q0=TT(j);
    withA(c,a*clamp((q0-.3)/.4),()=>{const q=tag(c,T.home[h],R.x+12,R.y+12,{col:WHITE});push(rects,a,'sceneHome'+j,q);if(j===k&&q0>.5&&q0<3)ring(c,q,t,WHITE);});});
  step0(c,A(0),TT(0),t,rects);
  step1(c,A(1),TT(1),t,rects);
  step2(c,A(2),TT(2),t,rects);
  step3(c,A(3),TT(3),t,rects);
  step4(c,A(4),TT(4),t,rects);
}
// 0: nest cutaway card linked to the pit
function step0(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const f=clamp((q-1)/.6),I=INSET;
  withA(c,f,()=>{K.dashed(c,[[PIT.x,PIT.y],[I.x+I.w/2,I.y]],rgba(INK,.7),5,[8,6],-t*10);K.dashed(c,[[PIT.x,PIT.y],[I.x+I.w/2,I.y]],WHITE,2.5,[8,6],-t*10);
    const v=mod(t*.8);circle(c,PIT.x,PIT.y,10,null,WHITE,2.5);circle(c,PIT.x,PIT.y,10+10*v,null,rgba(WHITE,.8*(1-v)),2);
    D.round(c,I.x-4,I.y-4,I.w+8,I.h+8,12,FILL,WHITE);K.drawIn(c,NEST,I,{radius:8});
    // the eggs breathe a little
    K.glow(c,I.x+I.w*.5,I.y+I.h*.68,30,WHITE,.18+.12*Math.sin(t*2));});
  const g=clamp((q-1.8)/.5);withA(c,g,()=>{const r=tag(c,T.nest,I.x-10,I.y+I.h-40,{al:'right',col:WHITE});push(rects,a*g,'nest',r);if(q>2&&q<5)ring(c,r,t,WHITE);});});}
// 1: hatchlings crawl from the pit to the sea, in a loop
function step1(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const p0=[PIT.x-18,PIT.y+18],p1=[mix(PIT.x,SEA_EDGE.x,.55),sy(330)],p2=[SEA_EDGE.x,SEA_EDGE.y];
  const path=[p0,p1,p2];
  const g=clamp((q-.5)/.5);
  withA(c,g,()=>{for(let i=0;i<3;i++){const v=mod(t*.11+i/3),pp=bez(path,v),off=(i-1)*14,fa=Math.min(1,Math.sin(Math.PI*v)*3);
      const d=bez(path,Math.min(1,v+.02)),rot=Math.atan2(d[1]-pp[1],d[0]-pp[0])-Math.atan2(.55,-1);
      sprite(c,HATCH,pp[0]+off,pp[1]+off*.6,50,{rot,a:fa,shadow:.35});}});
  const h=clamp((q-1.2)/.4);withA(c,h,()=>{const r=tag(c,T.hatch,PIT.x+24,PIT.y-56,{col:WHITE});push(rects,a*h,'hatch',r);if(q>1.4&&q<4)ring(c,r,t,WHITE);});
  const s=clamp((q-2.4)/.5);withA(c,s,()=>{const ax0=sx(640),ay0=sy(350),ax1=sx(390),ay1=sy(480);
    oarrow(c,ax0,ay0,ax1,ay1,WHITE,4);
    const r=tag(c,T.toSea,ax0+8,ay0-54,{col:WHITE});push(rects,a*s,'toSea',r);if(q>2.6&&q<5)ring(c,r,t,WHITE);});});}
// 2: open sea, the young turtle swims
function step2(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const g=clamp((q-.4)/.6),R=SCN;
  withA(c,g,()=>{const xx=R.x+R.w*.5+90*Math.sin(t*.35),yy=R.y+R.h*.58+10*Math.sin(t*.9),rot=.05*Math.cos(t*.35);
    const [W,H]=K.dim(JUV),w=240,h=w*H/W,dir=Math.cos(t*.35)>=0?1:-1;
    c.save();c.translate(xx,yy);c.rotate(rot);if(dir<0)c.scale(-1,1);K.drawIn(c,JUV,{x:-w/2,y:-h/2,w,h});c.restore();});
  const s=clamp((q-1)/.4);withA(c,s,()=>{const r=tag(c,T.schem,R.x+R.w-12,R.y+12,{al:'right',col:WHITE,dash:[7,5],t});push(rects,a*s,'schem',r);});});}
// 3: seagrass bed, feeding
function step3(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const f=clamp((q-1.2)/.5);withA(c,f,()=>{const tx=SCN.x+40,ty=sy(330);
    const r=tag(c,T.feed,tx,ty,{col:WHITE});push(rects,a*f,'feed',r);
    K.dashed(c,[[r.x+r.w,r.y+r.h/2],[HEAD.x-14,HEAD.y]],rgba(INK,.7),5,[8,6],-t*10);K.dashed(c,[[r.x+r.w,r.y+r.h/2],[HEAD.x-14,HEAD.y]],WHITE,2.5,[8,6],-t*10);
    const v=mod(t*.8);circle(c,HEAD.x,HEAD.y,14,null,WHITE,2.5);circle(c,HEAD.x,HEAD.y,14+10*v,null,rgba(WHITE,.8*(1-v)),2);
    if(q>1.4&&q<4)ring(c,r,t,WHITE);});});}
// 4: back to the beach; often near where it hatched; the one orange arrow
function step4(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const g=smooth(clamp((q-.4)/5)),bob=1.5*Math.sin(t*3);
  const tx=mix(sx(40),sx(330),g),ty=mix(sy(500),sy(430),g)+bob;
  sprite(c,ADULT,tx,ty,120,{rot:-.18,a:clamp((q-.2)/.5),shadow:.45});
  const b=clamp((q-1)/.4);withA(c,b,()=>{const r=tag(c,T.back,SCN.x+12,SCN.y+12,{col:WHITE});push(rects,a*b,'back',r);if(q>1.2&&q<3)ring(c,r,t,WHITE);});
  const d=clamp((q-2.2)/.5);withA(c,d,()=>{
    const r1=box(c,T.often,SCN.x+12,SCN.y+62,{maxW:330,dash:[8,6],t});push(rects,a*d,'often',r1);
    const r2=tag(c,T.study,SCN.x+12,r1.y+r1.h+8,{col:WHITE,dash:[7,5],t});push(rects,a*d,'study',r2);});
  const o=clamp((q-4)/.5);withA(c,o,()=>{
    const r=box(c,T.gone,SCN.x+SCN.w-12,SCN.y+12,{al:'right',maxW:290,stroke:ORANGE,col:ORANGE});push(rects,a*o,'gone',r);
    const v=.5+.5*Math.sin(t*3),ex=sx(640)+6*v,ey=sy(260)+6*v;
    oarrow(c,r.x+r.w*.5,r.y+r.h+4,ex,ey,ORANGE,5);
    c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*10;c.beginPath();c.ellipse(sx(640)+16,sy(330),70,40,-.2,0,Math.PI*2);c.strokeStyle=rgba(ORANGE,.6+.4*v);c.lineWidth=3;c.stroke();c.restore();
    if(q>4.2&&q<7)ring(c,r,t,ORANGE);});});}

// ── statement under the scene ────────────────────────────────────────────
function statement(c,k,st,moving,x,tau,t,rects){
  const cx=SCN.x+SCN.w/2,sd=[3,4,2.2,3,6.2];
  const one=(kk,a,live)=>withA(c,a,()=>{const qa=live?clamp((tau-sd[kk])/.5):1;
    withA(c,qa,()=>{const b=box(c,T.st[kk],cx,BOT,{maxW:SCN.w,al:'center',stroke:WHITE,col:WHITE});
      if(live){push(rects,qa*a,'say',b);s_dbg.bottom=b.y+b.h;if(tau>sd[kk]+.5&&tau<sd[kk]+4)ring(c,b,t,WHITE);}});});
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='route'){K.sline(c,[[x+2,ay],[x+40,ay]],WHITE,3);circle(c,x+6,ay,5,WHITE,null);circle(c,x+36,ay,5,WHITE,null);K.glow(c,x+2+38*mod(t*.4),ay,7,WHITE,.6);}
  else if(kind==='nest'){D.round(c,x+6,y+1,30,30,6,FILL,WHITE);K.drawIn(c,NEST,{x:x+8,y:y+3,w:26,h:26});}
  else if(kind==='hatch')sprite(c,HATCH,ax+3*Math.sin(t*2),ay,38,{shadow:0});
  else if(kind==='dots'){K.sline(c,[[x+2,ay],[x+40,ay]],rgba(WHITE,.5),3);K.glow(c,x+2+38*mod(t*.5),ay,9,WHITE,.7);}
  else if(kind==='juv')sprite(c,JUV,ax+2*Math.sin(t*1.5),ay,42,{shadow:0});
  else if(kind==='grad'){const g=c.createLinearGradient(0,y+2,0,y+30);g.addColorStop(0,'#2a7fa8');g.addColorStop(1,'#0d3550');D.round(c,x+3,y+2,36,28,6,g,rgba(WHITE,.6));
    circle(c,x+12+4*pul,y+20-8*pul,1.8,rgba(WHITE,.7),null);}
  else if(kind==='grass'){D.round(c,x+3,y+2,36,28,6,FILL,WHITE);K.drawIn(c,GRASS,{x:x+5,y:y+4,w:32,h:24},{radius:4,crop:[.3,.3,.6,.6]});}
  else if(kind==='three'){[0,1,2].forEach(i=>circle(c,x+6+i*15,ay,5,i===Math.floor(mod(t*.8)*3)?WHITE:rgba(WHITE,.4),null));}
  else if(kind==='orange')K.arrow(c,x+4,ay-10,x+38,ay+10,ORANGE,4+pul);
  else if(kind==='dash'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;D.round(c,x+3,y+4,36,24,6,FILL,WHITE);c.restore();}}
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
window.EnvironmentDraw.turtle=draw;
window.EnvironmentDraw.turtle.dbg=s_dbg;
})();

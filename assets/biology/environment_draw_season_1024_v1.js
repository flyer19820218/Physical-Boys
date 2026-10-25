/* Unit 11 lesson 3 · "season" canvas (traditional-knowledge tab, view 0), 2026-10-25. Rules tied to a season (plan section 4, season; P1).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Layout (as timing): left = stage (x 16..636), right = step card (x 652..944, y 16..566).
 *   circular season dial (CX, CY), no months: the outer blue arc = "this season" (the fish come near), the rest of the track =
 *   "other seasons"; plates on the track only say "this season" / "other seasons". A white marker goes round the track (one lap = LAP s).
 *   Centre: the flying fish (CV10_flying_fish_glide) with its name. Right column (x 424..636) changes per step.
 *  0 the season of the fish: the blue arc grows in; while the marker is on it the arc brightens and a school of flying fish
 *    (CV10_flying_fish_swim) swims into the "school of fish" card, which is joined to the arc by a leader.
 *  1 fishing and rest: an inner ring grows in, split in two colours: orange "time to fish" (same span as the fish season; orange =
 *    taking out, the unit's pressure colour) and green "time to rest" (green = protection). The track plates become
 *    "this season: fish" / "other seasons: rest"; under the card a plate shows which time the marker is in.
 *  2 replenishment: the card fades into a green population bar ("schematic, no numbers"): it drops a little while the marker is in
 *    the fishing time and rises again during the rest (green up-arrow "rises again").
 *  3 a local rule: two small white dashed dials with "?" ("other peoples, other places"), white dashed box "details: ask the
 *    community", white dashed box "not a present-day schedule, and not fishing permission" (wording from VIEWS, kept for the teacher).
 * Always moving: the marker goes round, arcs brighten under it, the fish glides and the school swims, dashes march, rings pulse.
 * Science and culture (plan 4, 7.4): no months, dates, amounts or catch numbers; no people, boats, gear or rites are drawn; no people
 * or ritual details are named; the bar is schematic. Pictures (alpha bounds = whole picture, PIL): glide 447x253, swim 439x130,
 * both face right, clean edges on the board colour.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1,LAP=7;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const ORANGE=(K.COL&&K.COL.pressure)||'#fb923c',GREEN=(K.COL&&K.COL.protect)||'#4ade80',FISHC='#60a5fa';
const FILL='rgba(11,26,21,.92)',CARDF='rgba(22,51,43,.9)';
const ENV=K.ENV||'environment_ai_1024/',GLIDE=ENV+'CV10_flying_fish_glide.png',SWIM=ENV+'CV10_flying_fish_swim.png';
[GLIDE,SWIM].forEach(f=>{try{K.pic(K.src(f));}catch(e){}});

// ── labels ────────────────────────────────────────────────────────────────
const AI=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
const T={
 tab:P('季節裡的規範','Rules tied to a season'),
 short:[P('魚群來的季節','Season of the fish'),P('捕與休息','Fishing and rest'),P('資源補充','Replenishment'),P('特定地方的規範','A local rule')],
 names:[P('一年中，魚群來的季節','The season when the fish come'),P('有的時間捕，有的時間休息','Some times to fish, some to rest'),P('休息的時間，資源有機會補充','During rest, the resource can be replenished'),P('這是特定族群、特定地方的規範','These rules belong to a particular people and place')],
 year:P('一年','One year'),
 fish:P('飛魚','Flying fish'),
 thisS:P('這個季節','This season'),
 otherS:P('其他季節','Other seasons'),
 thisF:P('這個季節：捕','This season: fish'),
 otherR:P('其他季節：休息','Other seasons: rest'),
 school:P('魚群','School of fish'),
 near:P('魚群接近','The fish come near'),
 away:P('魚群不在附近','The fish are away'),
 nowF:P('現在：捕的時間','Now: time to fish'),
 nowR:P('現在：休息的時間','Now: time to rest'),
 box0:P('魚群接近時，這段弧線亮起','This arc lights up when the fish come near'),
 box1:P('不是一直捕：​捕一段，休息一段','Not fishing all the time: a time to fish, a time to rest'),
 box2:P('休息的時間，族群有機會回升','During the rest, the population can recover'),
 box3:P('不同族群、不同地方，​有不同做法','Different peoples and places have different practices'),
 pop:P('飛魚族群','Flying fish population'),
 down:P('捕：變少','Fishing: fewer'),
 up:P('休息：回升','Rest: rises again'),
 noNum:P('示意，沒有數字','Schematic, no numbers'),
 others:P('別的族群、別的地方','Other peoples, other places'),
 ask:P('細節：要詢問族人','Details: ask the community'),
 notPermit:P('不當成現在的時間表，​也不是捕撈許可','Not a present-day schedule, and not fishing permission'),
 legFish:P('藍色弧：魚群來的季節','Blue arc: the season of the fish'),
 legHand:P('白點：時間往前走','White dot: time passing'),
 legFishT:P('橘色：捕的時間','Orange: time to fish'),
 legRest:P('綠色：休息的時間','Green: time to rest'),
 legBar:P('綠色條：族群數量（示意）','Green bar: population (schematic)'),
 legDash:P('白色虛線：不確定、要詢問','White dashes: not certain, ask'),
 schem:L('schematic','示意','Schematic'),
 ai:P(`圖：${AI[0]}`,`Pictures: ${AI[1]}`)
};

// ── geometry ─────────────────────────────────────────────────────────────
const CX=220,CY=334,RT=168,RO=150,RI=122,RW=20;
const FS=[310,410];                                  // fish season, degrees clockwise from the top (schematic, no months)
const RS=[410,670];                                   // the rest of the year
const TOP={x:16,y:16,w:620};
const COL={x:424,y:104,w:212,h:462};                  // right column of the stage
const FC={x:424,y:150,w:212,h:196};                   // school card
const CARD={x:652,y:16,w:292,h:550};
const rad=d=>(d-90)*Math.PI/180;
const polar=(r,d)=>[CX+r*Math.cos(rad(d)),CY+r*Math.sin(rad(d))];
const inA=(d,a)=>mod(d-a[0],360)<=a[1]-a[0];

// per-step targets and [delay, duration] when entering a step
const TGT={grow:[1,1,1,1],box0:[1,0,0,0],split:[0,1,1,1],box1:[0,1,0,0],card:[1,1,0,0],now:[0,1,0,0],bar:[0,0,1,0],box2:[0,0,1,0],box3:[0,0,0,1],others:[0,0,0,1],ask:[0,0,0,1],note:[0,0,0,1],dim:[0,0,0,1]};
const SCHED=[{box0:[1.6,.6]},{split:[.4,2],box1:[.2,.6],now:[2.4,.6]},{card:[0,.6],bar:[.7,.7],box2:[.3,.6]},{bar:[0,.6],box3:[.2,.6],others:[.8,.7],ask:[2.4,.6],note:[3.6,.6],dim:[.8,.8]}];

// ── helpers (as in timing / clues) ───────────────────────────────────────
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
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p).replace(/​/g,''),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22,g=null}={}){
  g=g||boxGeo(c,p,maxW,size);const bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const plateW=(c,p)=>measure(c,p,22)+14;
function plate(c,p,x,y,{al='center',col=WHITE,stroke=null}={}){const w=plateW(c,p),h=32,bx=al==='right'?x-w:al==='left'?x:x-w/2;
  D.round(c,bx,y,w,h,10,FILL,stroke||rgba(col,.75));text(c,p,bx+w/2,y+24,22,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
function arcStroke(c,r,a,col,w,dash=null,off=0){if(a[1]<=a[0])return;c.save();c.beginPath();c.arc(CX,CY,r,rad(a[0]),rad(a[1]));c.strokeStyle=col;c.lineWidth=w;c.lineCap='butt';
  if(dash){c.setLineDash(dash);c.lineDashOffset=off;}c.stroke();c.restore();}
// how far the marker is inside an arc (soft edges), 0..1
const litIn=(hd,a)=>{const d=mod(hd-a[0],360),span=a[1]-a[0];if(d>span)return 0;return clamp(Math.min(d,span-d)/10+.3);};
// schematic population level over one lap: falls a little during fishing, rises again during the rest
function level(hd){const d=mod(hd-FS[0],360),f=FS[1]-FS[0],HI=.8,LO=.56;
  return d<=f?mix(HI,LO,smooth(d/f)):mix(LO,HI,smooth((d-f)/(360-f)));}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.seasonSt||(s.seasonSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const base=st.from>=0?st.from:Math.max(0,k-1),back=base>k;
  const V={};for(const q in TGT){const sc=back?(TGT[q][k]>TGT[q][base]?[.7,.6]:[0,.6]):(SCHED[k][q]||[0,.8]);V[q]=mix(TGT[q][base],TGT[q][k],smooth((tau-sc[0])/sc[1]));}
  if(k===0&&!(st.from>=0&&back))V.grow=smooth((tau-.2)/1.2);
  if(k===1&&!(st.from>=0&&back)&&st.from!==2&&st.from!==3)V.split=smooth((tau-.4)/2);
  s_dbg.V=V;
  const hd=mod(t/LAP*360,360);
  const G={hd,onF:inA(hd,FS),litF:litIn(hd,FS),litR:litIn(hd,RS)};
  dial(c,V,t,tau,k,G,rects);
  column(c,V,t,tau,k,G,rects);
  strip(c,V,t,G,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  text(c,T.schem,16,592,22,MUTED,'left');push(rects,1,'schem',{x:16,y:574,w:measure(c,T.schem,22),h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'ai',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── season dial ──────────────────────────────────────────────────────────
function dial(c,V,t,tau,k,G,rects){
  const dimA=1-.35*V.dim;
  c.save();c.globalAlpha*=dimA;
  circle(c,CX,CY,RT,null,rgba(WHITE,.45),2.5);
  circle(c,CX,CY,RO,null,rgba(WHITE,.08),RW);
  circle(c,CX,CY,RI,null,rgba(WHITE,.06),RW);
  // clockwise direction: small arrowhead on the track (lower left)
  {const [ax,ay]=polar(RT,225),a=rad(225)+Math.PI/2;c.save();c.translate(ax,ay);c.rotate(a);c.beginPath();c.moveTo(9,0);c.lineTo(-6,-7);c.lineTo(-6,7);c.closePath();c.fillStyle=rgba(WHITE,.85);c.fill();c.restore();}
  // boundaries of the fish season
  FS.forEach(d=>{const [a1,b1]=polar(RT-9,d),[a2,b2]=polar(RT+9,d);K.sline(c,[[a1,b1],[a2,b2]],rgba(WHITE,.8),3);});
  // outer arc: the season of the fish (brighter under the marker)
  const fg=[FS[0],mix(FS[0],FS[1],V.grow)];
  arcStroke(c,RO,fg,rgba(FISHC,.62+.38*G.litF),RW);
  if(G.onF&&V.grow>.98){const u=mod(t*1.2);c.save();c.beginPath();c.arc(CX,CY,RO,rad(FS[0]),rad(FS[1]));c.strokeStyle=rgba(FISHC,.5*(1-u));c.lineWidth=RW+10*u;c.stroke();c.restore();}
  // inner ring: time to fish (orange) and time to rest (green)
  if(V.split>.002){const sp=V.split;
    arcStroke(c,RI,[FS[0],mix(FS[0],FS[1],sp)],rgba(ORANGE,(.62+.38*G.litF*(k>=1?1:0))*Math.min(1,sp*3)),RW);
    arcStroke(c,RI,[RS[0],mix(RS[0],RS[1],sp)],rgba(GREEN,(.6+.4*G.litR*(k>=1?1:0))*Math.min(1,sp*3)),RW);}
  // marker
  {const [x1,y1]=polar(RI-RW/2-4,G.hd),[x2,y2]=polar(RT+6,G.hd),[dx,dy]=polar(RT,G.hd);K.sline(c,[[x1,y1],[x2,y2]],rgba(WHITE,.9),3);
   K.glow(c,dx,dy,16,WHITE,.5);circle(c,dx,dy,6,WHITE,INK,2);}
  // centre: one year, the flying fish, its name
  const yw=measure(c,T.year,22);text(c,T.year,CX,CY-74,22,MUTED,'center');push(rects,1,'year',{x:CX-yw/2,y:CY-92,w:yw,h:24});
  const fr=K.fitRect(GLIDE,CX-96,CY-58,192,104);
  c.save();c.translate(CX,CY-6+Math.sin(t*1.6)*4);c.rotate(Math.sin(t*1.1)*.04);
  K.drawIn(c,GLIDE,{x:fr.x-CX,y:fr.y-CY,w:fr.w,h:fr.h});c.restore();
  const fq=plate(c,T.fish,CX,CY+50,{col:WHITE});push(rects,1,'fish',fq);
  c.restore();
  // track plates
  const top=CY-RT-30,bot=CY+RT+4;
  const a0=1-V.split;
  withA(c,a0*dimA,()=>{const q=plate(c,T.thisS,CX,top,{col:FISHC,stroke:FISHC});push(rects,a0,'thisS',q);
    const q2=plate(c,T.otherS,CX,bot,{col:WHITE,stroke:rgba(WHITE,.6)});push(rects,a0,'otherS',q2);});
  withA(c,V.split*dimA,()=>{const q=plate(c,T.thisF,CX,top,{col:ORANGE,stroke:ORANGE});push(rects,V.split,'thisF',q);
    const q2=plate(c,T.otherR,CX,bot,{col:GREEN,stroke:GREEN});push(rects,V.split,'otherR',q2);});
}

// ── right column of the stage ────────────────────────────────────────────
function column(c,V,t,tau,k,G,rects){
  // steps 0-1: school card, leader to the blue arc
  withA(c,V.card,()=>{
    D.round(c,FC.x,FC.y,FC.w,FC.h,14,CARDF,rgba(FISHC,.7));
    const q=plate(c,T.school,FC.x+FC.w/2,FC.y+8,{col:FISHC,stroke:FISHC});push(rects,V.card,'school',q);
    // the school swims in while the marker is in the fish season (stateless: position from the marker angle)
    const d=mod(G.hd-FS[0],360),span=FS[1]-FS[0],inn=d<=span;
        c.save();c.beginPath();c.rect(FC.x+4,FC.y+44,FC.w-8,FC.h-88);c.clip();
    // swim in from the right at the start of the season, stay, swim out to the left at its end
    const e1=smooth(clamp(d/28)),e2=smooth(clamp((d-(span-28))/28)),cx0=FC.x+FC.w/2;
    const cx=inn?(e2>0?mix(cx0,FC.x-90,e2):mix(FC.x+FC.w+90,cx0,e1)):FC.x+FC.w+200;
    [[0,.0,-6,0],[1,.45,-44,34],[2,.9,30,30]].forEach(([i,ph,dx,dy])=>{
      const w=88,h=w*130/439,fx=cx+dx-w/2+Math.sin(t*1.3+ph*5)*5,fy=FC.y+70+dy+Math.sin(t*3+ph*4)*4;
      K.drawIn(c,SWIM,{x:fx,y:fy,w,h},{flip:true});});
    c.restore();
    const lab=G.onF?T.near:T.away,lw=measure(c,lab,22),col=G.onF?FISHC:MUTED;
    text(c,lab,FC.x+FC.w/2,FC.y+FC.h-14,22,col,'center');push(rects,V.card,'near',{x:FC.x+FC.w/2-lw/2,y:FC.y+FC.h-32,w:lw,h:24});
    const [ex,ey]=polar(RO+RW/2,40);K.sline(c,[[FC.x,FC.y+60],[ex,ey]],rgba(FISHC,.85),2);circle(c,ex,ey,4,FISHC,null);
  });
  // step 1: which time the marker is in
  withA(c,V.now,()=>{const p=G.onF?T.nowF:T.nowR,col=G.onF?ORANGE:GREEN,g=boxGeo(c,p,FC.w),r=box(c,p,FC.x+FC.w/2,FC.y+FC.h+18,{al:'center',g,stroke:col,col});push(rects,V.now,'now',r);ring(c,r,t,col);});
  // step 2: population bar (schematic)
  withA(c,V.bar,()=>{
    const hq=boxGeo(c,T.pop,COL.w),hr=box(c,T.pop,COL.x+COL.w/2,COL.y+6,{al:'center',g:hq,stroke:GREEN,col:GREEN});push(rects,V.bar,'pop',hr);
    const bx=COL.x+30,bw=58,by=hr.y+hr.h+22,bh=220,lv=level(G.hd);
    D.round(c,bx,by,bw,bh,10,'rgba(242,236,217,.06)',rgba(WHITE,.55));
    const fh=bh*lv;D.round(c,bx+5,by+bh-fh+5,bw-10,fh-10,6,rgba(GREEN,.85),null);
    // arrow beside the bar, label under the bar
    const ax=bx+bw+26,mid=by+bh-fh+18;
    if(G.onF){K.arrow(c,ax,mid-34,ax,mid+20,ORANGE,4);}
    else{const u=mod(t*1.4);K.arrow(c,ax,mid+40-8*u,ax,mid-14-8*u,GREEN,4);}
    const lab=G.onF?T.down:T.up,col=G.onF?ORANGE:GREEN,lg=boxGeo(c,lab,COL.w);
    const lr=box(c,lab,COL.x+COL.w/2,by+bh+14,{al:'center',g:lg,stroke:col,col});push(rects,V.bar,'updown',lr);
    const nr=D.tr(T.noNum).length>12?greedyBal(c,D.tr(T.noNum),COL.w,22):[D.tr(T.noNum)];
    nr.forEach((q,i)=>{const ny=lr.y+lr.h+28+i*26,nw=measure(c,q,22);if(ny<=566){text(c,q,COL.x+COL.w/2,ny,22,MUTED,'center');push(rects,V.bar,'noNum'+i,{x:COL.x+COL.w/2-nw/2,y:ny-18,w:nw,h:24});}});
  });
  // step 3: other peoples, other places; ask; not a schedule or permission
  withA(c,V.others,()=>{
    const hq=boxGeo(c,T.others,COL.w),hr=box(c,T.others,COL.x+COL.w/2,COL.y+6,{al:'center',g:hq,stroke:WHITE});push(rects,V.others,'others',hr);
    const dy=hr.y+hr.h+52;
    [COL.x+COL.w*.27,COL.x+COL.w*.73].forEach((dx,i)=>{
      c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*10*(i?-1:1);circle(c,dx,dy,40,null,rgba(WHITE,.85),3);c.restore();
      c.save();c.setLineDash([4,6]);c.lineDashOffset=t*8;circle(c,dx,dy,28,null,rgba(WHITE,.4),6);c.restore();
      const b=1+.08*Math.sin(t*2.4+i*1.6);c.save();c.translate(dx,dy);c.scale(b,b);text(c,'?',0,10,30,WHITE,'center');c.restore();});
    s_dbg.dialsBottom=dy+40;
  });
  withA(c,V.ask,()=>{const g=boxGeo(c,T.ask,COL.w),y0=(s_dbg.dialsBottom||300)+16,r=box(c,T.ask,COL.x+COL.w/2,y0,{al:'center',g,stroke:WHITE,dash:[8,6],t});push(rects,V.ask,'ask',r);s_dbg.askBottom=r.y+r.h;});
  withA(c,V.note,()=>{const g=boxGeo(c,T.notPermit,250),r=box(c,T.notPermit,COL.x+COL.w/2-10,566-g.h,{al:'center',g,stroke:WHITE,dash:[8,6],t});push(rects,V.note,'note',r);});
}

// ── strip above the dial ──────────────────────────────────────────────────
function strip(c,V,t,G,rects){
  [['box0',T.box0,FISHC],['box1',T.box1,WHITE],['box2',T.box2,GREEN],['box3',T.box3,WHITE]].forEach(([id,p,col])=>
    withA(c,V[id],()=>{const g=boxGeo(c,p,COL.x-TOP.x-12),r=box(c,p,TOP.x,TOP.y,{g,stroke:col});push(rects,V[id],id,r);}));
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){return[[['fish',T.legFish],['hand',T.legHand]],[['fishT',T.legFishT],['rest',T.legRest]],[['bar',T.legBar],['rest',T.legRest]],[['dash',T.legDash]]][k];}
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+40;
  if(kind==='fish'||kind==='fishT'||kind==='rest'){c.save();c.beginPath();c.arc(ax,ay,30,-2.2,-.95);c.strokeStyle=kind==='fish'?FISHC:kind==='fishT'?ORANGE:GREEN;c.lineWidth=10;c.stroke();c.restore();}
  else if(kind==='hand'){const a=t*1.5,px=x+21+Math.cos(a)*14,py=y+19+Math.sin(a)*14;circle(c,x+21,y+19,14,null,rgba(WHITE,.5),2);circle(c,px,py,5,WHITE,INK,1.5);}
  else if(kind==='bar'){const h=14+8*Math.sin(t*1.5);D.round(c,x+10,y+4,22,34,4,null,rgba(WHITE,.55));D.round(c,x+13,y+38-h-2,16,h,3,GREEN,null);}
  else if(kind==='dash'){c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*8;D.round(c,x+4,y+4,34,24,6,null,WHITE);c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:FISHC});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  const RH=34;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH/2,rows=blines(c,p,iw-42),hh=RH+(rows.length-1)*LH;
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
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(46,blines(c,p,iw-50).length*27+10));
  const ly=R.y+R.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+2,t);
    const h=bwrap(c,p,ix+50,yy+22,iw-50,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+50,y:yy+2,w:iw-50,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.season=draw;
window.EnvironmentDraw.season.dbg=s_dbg;
})();

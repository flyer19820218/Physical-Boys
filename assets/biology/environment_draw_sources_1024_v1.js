/* Unit 11 lesson 2 · "sources" canvas (pollution-eutrophication tab, view 1), 2026-10-25. Where pollution comes from (plan section 3, sources).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (dots keep flowing, the lit band and the
 * orange source frames pulse, pictures breathe, table icons loop).
 * Layout as stages / judge: left = scene window WIN (x 16..636, y 16..428) + statement box under it; right = step card (x 652..944).
 * Scene (window-local px): a small landscape section: air (sky, y 0..150, label "Air"), land (objects stand with their bottom on
 * y 336), soil strip (y 336..372, label "Soil"), water strip (a stream, y 372..412, label "Water"). The band of the step is lit.
 * Only the sources of the step are shown (big, orange frame, name plate above); the sprayed field moves from step 2 to step 3.
 *  0 air: TH10 factory + traffic; grey puffs rise from the chimney and the cars and drift as haze in the sky band.
 *  1 water: TH10 sprayed field, fish pond, household drain; pink dots (nutrients) run off into the stream and drift downstream.
 *  2 soil: TH10 sprayed field + livestock yard; brown dots (substances, schematic) fall from the spray boom and the yard into the soil;
 *    some go on into the water (white dashed arrow, plate "May pass into water").
 *  3 different routes: the landscape dims; a table of five rows (drawn icons): nutrients -> water, eutrophication (pink); factory and
 *    vehicle emissions -> air; acid rain; ozone-layer damage; fine particles. Statement (white dashed): "These do not have a single
 *    cause". Card: dashed note "Colours in the pictures are not pollutant tests".
 * Colours (plan 1.4): nutrients = pink #f472b6 dots; sources (pressures) = orange #fb923c frames and badges; emissions grey and
 * substances brown are neutral (no fixed meaning; always named in the legend). Yellow (hard-to-remove substances / concentration)
 * is not used: that belongs to the next tab.
 * No numbers; no names of particular fertilisers, pesticides or gases; no drinking-water or health advice.
 * Pictures: environment_ai_1024/TH10_* (tight transparent crops; anchor fractions measured with PIL: chimney top (.61,.27),
 * drain outlet (.58,.63)).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,ORANGE=K.COL.pressure,PINK=K.COL.nutrient,INK=C.ink;
const GREY='#c9d3cf',BROWN='#c8a36a',WATERC='#7cc4e4';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('汙染從哪裡來','Where pollution comes from'),
 short:[P('空氣','Air'),P('水','Water'),P('土壤','Soil'),P('不同汙染，不同途徑','Different routes')],
 names:[P('空氣：工廠與車輛','Air: factories and vehicles'),P('水：住家排水、魚塭、農田的水','Water: household drains, fish ponds, farm runoff'),P('土壤：農田與畜牧場','Soil: farmland and livestock yards'),P('不同汙染，走不同的路','Different pollution takes different routes')],
 band:[P('空氣','Air'),P('土壤','Soil'),P('水','Water')],
 obj:[P('工廠','Factory'),P('車輛','Vehicles'),P('畜牧場','Livestock yard'),P('噴灑的農田','Sprayed field'),P('魚塭','Fish pond'),P('住家排水口','Household drain')],
 st:[P('工廠與車輛的排放，進入空氣','Emissions from factories and vehicles enter the air'),
  P('住家排水、魚塭、農田的水，可能把營養鹽帶進水體','Household drains, fish ponds and farm runoff can carry nutrients into water'),
  P('農田與畜牧場的物質進入土壤，也可能再進入水','Substances from fields and livestock yards enter the soil and may pass on into water'),
  P('這些不是同一個原因','These do not have a single cause')],
 toWater:P('也可能進入水','May pass into water'),
 head:[P('是什麼','What'),P('走哪一條路','Which route')],
 rows:[[P('營養鹽','Nutrients'),P('進入水體，造成優養化','Enter water and cause eutrophication')],
  [P('工廠與車輛排放','Factory and vehicle emissions'),P('進入空氣','Enter the air')],
  [P('酸雨','Acid rain'),P('空氣中的排放物溶進雨水，落到地面與水','Emissions in the air dissolve in rain and fall on land and water')],
  [P('臭氧層受損','Ozone-layer damage'),P('某些氣體升到高空，臭氧層變薄','Some gases rise high up and the ozone layer thins')],
  [P('細懸浮微粒','Fine particles'),P('很小的微粒懸浮在空氣中','Very small particles stay suspended in the air')]],
 colour:P('圖上的顏色不是汙染物檢測','Colours in the pictures are not pollutant tests'),
 note:P('大小與位置都是示意','Sizes and positions are schematic'),
 legGrey:P('灰色小點：排放','Grey dots: emissions'),
 legFrame:P('橘框：這一步的來源','Orange frame: sources in this step'),
 legPink:P('粉紅小點：營養鹽','Pink dots: nutrients'),
 legBrown:P('土色小點：物質','Brown dots: substances'),
 legArrow:P('虛線箭頭：也可能進入水','Dashed arrow: may pass into water'),
 legDash:P('白虛線框：不是同一個原因','White dashed box: not a single cause')
};

// ── geometry ─────────────────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412};
const CARD={x:652,y:16,w:292,h:550};
const SKY=150,GROUND=336,SOIL=[336,372],WAT=[372,412];
const FILES=['TH10_factory.png','TH10_traffic.png','TH10_livestock.png','TH10_sprayer_field.png','TH10_fish_farm.png','TH10_drain.png'].map(f=>ENV+f);
// per step: object index -> [centre x, width] (window-local); bottom on GROUND
const LAY=[{0:[230,150],1:[460,220]},{3:[132,172],4:[322,176],5:[510,150]},{3:[196,196],2:[432,196]},{}];
// name plate: above the picture, except the factory (left of it)
const PLATE={0:'left'};
const ACT_BAND=[0,2,1,-1];             // band lit per step: 0 air, 1 soil, 2 water
const BANDR=[[0,SKY],SOIL,WAT];

// ── helpers (as in stages) ───────────────────────────────────────────────
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
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:mode===1?rgba(col,.7):rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:mode===1?col:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22,vc=false}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=vc?y-g.h/2:y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const plateW=(c,p)=>measure(c,p,22)+14;
function plate(c,p,x,y,{al='center',col=WHITE}={}){const w=plateW(c,p),h=32,bx=al==='right'?x-w:al==='left'?x:x-w/2;
  D.round(c,bx,y,w,h,10,FILL,rgba(col,.75));text(c,p,bx+w/2,y+24,22,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const G=(x,y)=>[WIN.x+x,WIN.y+y];
const hOf=(i,w)=>{const [W,H]=K.SIZE[FILES[i]];return w*H/W;};
// anchor inside picture i (fractions) for state p -> canvas px
const anc=(i,p,fx,fy)=>{const h=hOf(i,p.w);return G(p.cx-p.w/2+fx*p.w,GROUND-h+fy*h);};

// object state in step k (null = not in that step)
function objAt(i,k){const q=LAY[k]&&LAY[k][i];return q?{cx:q[0],w:q[1],a:1}:null;}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.srcSt||(s.srcSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  // how much step j is "on" now
  const on=j=>j===k?(moving&&st.from!==k?u:1):(moving&&st.from===j?1-u:0);
  // sequenced: the outgoing step fades out in the first half of the move, the incoming one fades in during the second half
  const on2=j=>j===k?(moving&&st.from!==k?clamp(2*u-1):1):(moving&&st.from===j?clamp(1-2*u):0);
  const tl=j=>j===k?tau:9;   // local time of step j (outgoing step is frozen at its end)

  // ── scene window ──
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  const land=1-.7*on(3);
  // sky / air
  const g=c.createLinearGradient(0,WIN.y,0,WIN.y+GROUND);g.addColorStop(0,'#1d4552');g.addColorStop(1,'#1c3d34');c.fillStyle=g;c.fillRect(WIN.x,WIN.y,WIN.w,GROUND);
  // soil strip
  const [sx,sy]=G(0,SOIL[0]);c.fillStyle='#4a3826';c.fillRect(sx,sy,WIN.w,SOIL[1]-SOIL[0]);
  K.sline(c,[[sx,sy],[sx+WIN.w,sy]],'#5d8a45',4);
  for(let i=0;i<22;i++){const px=sx+((i*53)%WIN.w),py=sy+8+((i*17)%24);circle(c,px,py,2.2,'rgba(160,128,92,.5)',null);}
  // water strip (stream)
  const [wx,wy]=G(0,WAT[0]);const wg=c.createLinearGradient(0,wy,0,wy+40);wg.addColorStop(0,'#2a6a7e');wg.addColorStop(1,'#1b4a5c');c.fillStyle=wg;c.fillRect(wx,wy,WIN.w,40);
  for(let i=0;i<2;i++){const yy=wy+12+i*16;c.save();c.setLineDash([22,40]);c.lineDashOffset=-mod(t*16+i*30,62);K.sline(c,[[wx,yy],[wx+WIN.w,yy]],rgba(WATERC,.35),2);c.restore();}
  // dim layer for the table step
  withA(c,.7*on(3),()=>{c.fillStyle='#16332b';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);});
  // lit band frame
  for(let b=0;b<3;b++){const a=[0,1,2].reduce((acc,j)=>acc+(ACT_BAND[j]===b?on(j):0),0);
    withA(c,a,()=>{const [bx,by]=G(3,BANDR[b][0]+3),bh=BANDR[b][1]-BANDR[b][0]-6;
      c.fillStyle=rgba(WHITE,.06);c.fillRect(bx,by,WIN.w-6,bh);
      D.round(c,bx,by,WIN.w-6,bh,8,null,rgba(WHITE,.65+.3*Math.sin(t*2.4)));});}

  // particles (behind the pictures where they start, in front where they travel)
  withA(c,on2(0),()=>airDots(c,t,tl(0)));

  // pictures
  const pos={};
  for(let i=0;i<6;i++){
    let a=objAt(i,k),b=moving?objAt(i,st.from):null,p;
    if(!moving){p=a;}
    else{if(a&&b)p={cx:mix(b.cx,a.cx,u),w:mix(b.w,a.w,u),a:1};else if(a)p={...a,a:clamp(2*u-1)};else if(b)p={...b,a:clamp(1-2*u)};}
    if(!p)continue;pos[i]=p;
    const w=p.w*(1+.012*Math.sin(t*1.6+i)),h=hOf(i,w),[px,py]=G(p.cx-w/2,GROUND-h);
    withA(c,p.a*land,()=>{K.drawIn(c,FILES[i],{x:px,y:py,w,h});});
  }
  s_dbg.pos=pos;
  withA(c,on2(1),()=>waterDots(c,t,tl(1),pos));
  withA(c,on2(2),()=>soilDots(c,t,tl(2),pos));
  // orange frames + names
  for(const i in pos){const p=pos[i],h=hOf(+i,p.w),[px,py]=G(p.cx-p.w/2,GROUND-h);
    const fa=p.a*clamp(((moving?0:tau)-.2)/.5+(moving?1:0));
    withA(c,p.a*land,()=>{c.save();c.setLineDash([10,7]);c.lineDashOffset=-t*12;D.round(c,px-6,py-6,p.w+12,h+12,12,null,rgba(ORANGE,.75+.25*Math.sin(t*2.4)));c.restore();});
    withA(c,fa*land,()=>{let r;
      if(PLATE[i]==='left')r=plate(c,T.obj[i],px-12,py+h*.42,{al:'right',col:ORANGE});
      else r=plate(c,T.obj[i],px+p.w/2,py-46,{col:ORANGE});
      push(rects,fa*p.a,'obj'+i,r);});}
  // band names
  const BL=[[8,8],[8,SOIL[0]+2],[8,WAT[0]+4]];
  const bpA=k===3?(moving&&st.from!==3?clamp(1-2*u):0):(moving&&st.from===3?clamp(2*u-1):1);   // band names give way to the table first
  T.band.forEach((p,b)=>{const lit=[0,1,2].reduce((acc,j)=>acc+(ACT_BAND[j]===b?on(j):0),0),[px,py]=G(BL[b][0],BL[b][1]);
    withA(c,bpA*(.75+.25*lit),()=>{const r=plate(c,p,px,py,{al:'left',col:lit>.5?WHITE:MUTED});push(rects,bpA,'band'+b,r);});});
  // step 2: "may pass into water"
  withA(c,on2(2)*clamp((tl(2)-2.4)/.6),()=>{const [ax,ay]=G(322,SOIL[0]+8),[bx,by]=G(322,WAT[0]+20);
    K.dashed(c,[[ax,ay],[bx,by-8]],WHITE,4,[8,6],-t*16);
    c.beginPath();c.moveTo(bx-9,by-12);c.lineTo(bx,by);c.lineTo(bx+9,by-12);c.closePath();c.fillStyle=WHITE;c.fill();
    const r=plate(c,T.toWater,bx+18,by-24+2,{al:'left'});push(rects,on(2),'toWater',r);});

  // ── step 4: table ──
  withA(c,on2(3),()=>table(c,t,tl(3),rects,on2(3)));
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);

  // ── statement under the window ──
  const SY=WIN.y+WIN.h+12,SC=[WHITE,PINK,WHITE,WHITE],DS=[null,null,null,[8,6]];
  const sd=[1.6,1.6,1.6,4.0][k],sa=clamp((tau-Math.max(sd,moving?MOVE*.6:0))/.5);
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>box(c,T.st[st.from],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[st.from],dash:DS[st.from],t}));
  withA(c,sa,()=>{const q=box(c,T.st[k],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:SC[k],dash:DS[k],t});push(rects,sa,'say',q);s_dbg.sayBottom=q.y+q.h;if(k===3&&tau>4.6)ring(c,q,t,WHITE);});

  // ── step card ──
  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  text(c,T.note,16,592,22,MUTED,'left');push(rects,1,'note',{x:16,y:574,w:measure(c,T.note,22),h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  withA(c,1-on(3),()=>text(c,ai,CW-16,592,22,MUTED,'right'));push(rects,1-on(3),'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── particles ────────────────────────────────────────────────────────────
function airDots(c,t,tt){
  // haze that builds up in the sky band
  const grow=smooth((tt-.6)/4);
  for(let i=0;i<26;i++){const ph=mod(t*.035+i*.137),[x,y]=G(ph*WIN.w,20+((i*37)%110)+Math.sin(t*.7+i)*4);circle(c,x,y,4+(i%3),rgba(GREY,.45*grow),null);}
  const p0=LAY[0][0],p1=LAY[0][1];
  const P0={cx:p0[0],w:p0[1]},P1={cx:p1[0],w:p1[1]};
  // chimney plume
  const [cx,cy]=anc(0,P0,.61,.24);
  for(let j=0;j<16;j++){const q=mod(t*.2+j/16);if(tt<q*4)continue;
    circle(c,cx+q*120+Math.sin(t*1.3+j)*6,cy-q*(cy-WIN.y-26),4+q*5,rgba(GREY,.9*(1-q*q)),null);}
  // car exhausts (rear of each vehicle)
  [[.24,.42],[.38,.58],[.55,.3]].forEach(([fx,fy],v)=>{const [ex,ey]=anc(1,P1,fx,fy);
    for(let j=0;j<8;j++){const q=mod(t*.28+j/8+v*.3);if(tt<q*3)continue;circle(c,ex-q*20+Math.sin(t*2+j)*4,ey-q*(ey-WIN.y-40),3+q*4,rgba(GREY,.85*(1-q)),null);}});
}
function waterDots(c,t,tt,pos){
  const [,wy]=G(0,WAT[0]+20),xEnd=WIN.x+WIN.w+10;
  const src=[[3,.82,.72],[4,.86,.62],[5,.58,.64]];
  src.forEach(([i,fx,fy],v)=>{const p=pos[i]||objAt(i,1);if(!p)return;const [ax,ay]=anc(i,p,fx,fy);
    for(let j=0;j<10;j++){const q=mod(t*.11+j/10+v*.33);if(tt<q*5)continue;
      let x,y;if(q<.35){const e=q/.35;x=ax+e*14;y=mix(ay,wy+((j%3)-1)*6,e*e);}
      else{const e=(q-.35)/.65;x=mix(ax+14,xEnd,e);y=wy+((j%3)-1)*6+Math.sin(t*2+j)*2;}
      circle(c,x,y,5,rgba(PINK,.95*(1-Math.pow(q,6))),null);}});
}
function soilDots(c,t,tt,pos){
  const sTop=G(0,SOIL[0])[1];
  // spray mist from the boom onto the field, then down into the soil
  const pf=pos[3]||objAt(3,2),pl=pos[2]||objAt(2,2);
  [[pf,3,[.28,.42,.56,.70]],[pl,2,[.30,.45,.60,.72]]].forEach(([p,i,fxs],v)=>{if(!p)return;
    fxs.forEach((fx,m)=>{const [ax,ay]=anc(i,p,fx,i===3?.3:.42);
      for(let j=0;j<4;j++){const q=mod(t*.14+j/4+m*.21+v*.4);if(tt<q*4)continue;
        const yEnd=sTop+10+((j+m)%3)*8,y=mix(ay,yEnd,smooth(q/.75)),x=ax+Math.sin(j+m+t*.8)*3;
        circle(c,x,y,4.5,rgba(BROWN,.95*(q<.9?1:(1-q)*10)),null);}});});
  // some go on into the water
  const [bx]=G(322,0),wy=G(0,WAT[0]+20)[1];
  for(let j=0;j<6;j++){const q=mod(t*.16+j/6);if(tt<2.4+q*2)continue;const y=mix(sTop+12,wy,q),x=bx+((j%2)?-14:14)+Math.sin(t+j)*2;
    circle(c,x,y,4.5,rgba(BROWN,.9*(1-q*q)),null);}
}

// ── table (step 4) ───────────────────────────────────────────────────────
const TB={x:10,y:6,w:600,ix:8,nx:58,nw:178,rx:262};
function table(c,t,tt,rects,a){
  const [x0,y0]=G(TB.x,TB.y);
  text(c,T.head[0],x0+TB.nx,y0+24,22,MUTED,'left');text(c,T.head[1],x0+TB.rx,y0+24,22,MUTED,'left');
  K.sline(c,[[x0,y0+38],[x0+TB.w,y0+38]],rgba(WHITE,.3),2);
  let y=y0+46;
  T.rows.forEach(([nm,rt],r)=>{
    const nl=blines(c,nm,TB.nw),rl=blines(c,rt,TB.w-TB.rx),n=Math.max(nl.length,rl.length,1),h=Math.max(50,10+n*LH);
    const ra=clamp((tt-.3-r*.7)/.6);
    withA(c,ra,()=>{
      const col=r===0?PINK:WHITE;
      D.round(c,x0,y,TB.w,h,10,'rgba(11,26,21,.6)',rgba(col,r===0?.9:.45));
      rowIcon(c,r,x0+TB.ix+22,y+h/2,t);
      nl.forEach((q,i)=>text(c,q,x0+TB.nx,y+h/2-(nl.length-1)*LH/2+8+i*LH,22,col,'left'));
      rl.forEach((q,i)=>text(c,q,x0+TB.rx,y+h/2-(rl.length-1)*LH/2+8+i*LH,22,WHITE,'left'));
      K.arrow(c,x0+TB.rx-34,y+h/2,x0+TB.rx-10,y+h/2,rgba(WHITE,.8),3);
      push(rects,ra*a,'row'+r+'n',{x:x0+TB.nx,y:y+h/2-(nl.length-1)*LH/2-12,w:TB.nw,h:nl.length*LH});
      push(rects,ra*a,'row'+r+'r',{x:x0+TB.rx,y:y+h/2-(rl.length-1)*LH/2-12,w:TB.w-TB.rx-6,h:rl.length*LH});});
    y+=h+4;});
  s_dbg.tableBottom=y;
}
function rowIcon(c,r,x,y,t){
  if(r===0){// pink dots dropping into water
    K.ellipse(c,x,y+10,20,6,rgba(WATERC,.5),WATERC,2);
    for(let j=0;j<3;j++){const q=mod(t*.6+j/3);circle(c,x-8+j*8,y-16+q*24,4,rgba(PINK,1-q*q*.6),null);}}
  else if(r===1){// grey puffs rising from a stack
    D.round(c,x-6,y-2,12,20,2,'#8a6a50',null);
    for(let j=0;j<4;j++){const q=mod(t*.5+j/4);circle(c,x+q*12,y-6-q*20,3+q*4,rgba(GREY,1-q),null);}}
  else if(r===2){// cloud with drops
    K.ellipse(c,x,y-12,18,8,'#9aa8a3',null);circle(c,x-8,y-16,7,'#9aa8a3',null);circle(c,x+6,y-18,8,'#9aa8a3',null);
    for(let j=0;j<3;j++){const q=mod(t*.9+j/3);K.sline(c,[[x-9+j*9,y-4+q*18],[x-11+j*9,y+2+q*18]],rgba(WATERC,1-q),3);}}
  else if(r===3){// high layer that thins
    const th=.55+.45*(.5+.5*Math.sin(t*1.2));
    c.beginPath();c.arc(x,y+22,22,Math.PI*1.15,Math.PI*1.85);c.strokeStyle=rgba('#a9c3d4',th);c.lineWidth=7;c.stroke();
    circle(c,x,y+10,5,'#5d8a45',null);}
  else{// tiny particles drifting
    for(let j=0;j<9;j++){const ph=t*.5+j*1.7;circle(c,x+Math.sin(ph)*14,y+Math.cos(ph*1.3)*12,2.2,rgba(GREY,.95),null);}}
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['grey',T.legGrey],['frame',T.legFrame]];
  if(k===1)return[['pink',T.legPink],['frame',T.legFrame]];
  if(k===2)return[['brown',T.legBrown],['arrow',T.legArrow]];
  return[['dash',T.legDash]];}
function legIcon(c,kind,x,y,t){
  if(kind==='grey'||kind==='pink'||kind==='brown'){const col=kind==='grey'?GREY:kind==='pink'?PINK:BROWN;
    for(let i=0;i<4;i++){const q=mod(t*.4+i/4);circle(c,x+6+q*28,y+14+(i%2?-1:1)*q*5,4.5,rgba(col,1-q*q),null);}}
  else if(kind==='frame'){c.save();c.setLineDash([7,5]);c.lineDashOffset=-t*12;D.round(c,x+4,y+2,32,24,6,null,ORANGE);c.restore();}
  else if(kind==='arrow'){K.dashed(c,[[x+20,y],[x+20,y+20]],WHITE,3,[5,4],-t*14);c.beginPath();c.moveTo(x+13,y+18);c.lineTo(x+20,y+28);c.lineTo(x+27,y+18);c.closePath();c.fillStyle=WHITE;c.fill();}
  else{c.save();c.setLineDash([7,5]);c.lineDashOffset=-t*10;D.round(c,x+2,y+2,36,24,8,null,WHITE);c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const Rc=CARD,ix=Rc.x+16,iw=Rc.w-32;
  D.round(c,Rc.x,Rc.y,Rc.w,Rc.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,Rc.y+14,{maxW:iw,stroke:ORANGE});push(rects,1,'tab',hr);
  let y=Rc.y+14+hr.h+12;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=10;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+19,rows=blines(c,p,iw-42),hh=Math.max(38,38+(rows.length-1)*LH);
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,2,ORANGE));
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
  // step 4: dashed note about colours
  const oa=k===3?clamp((tau-4.6)/.6):(moving&&st.from===3?clamp(1-3*u):0);
  withA(c,oa,()=>{const b=box(c,T.colour,ix+iw/2,ty+hh-10,{maxW:iw+8,al:'center',stroke:WHITE,dash:[8,6],t});push(rects,oa,'colour',b);s_dbg.noteBottom=b.y+b.h;});
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+4,t);
    const h=bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);push(rects,la,'leg'+q,{x:ix+50,y:yy+4,w:iw-50,h:h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.sources=draw;
window.EnvironmentDraw.sources.dbg=s_dbg;
})();

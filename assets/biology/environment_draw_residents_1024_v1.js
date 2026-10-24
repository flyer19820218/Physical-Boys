/* Unit 11 lesson 1 · "residents" canvas (ecosystem-diversity tab, view 1), 2026-10-24. Each home has its residents (plan section 2, residents).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (the picture breathes slowly, residents bob /
 * swim / sway, pills ring, dashed trails and empty outlines march).
 * Left 2/3 = stage: a picture window (x 16..636, y 16..466) and a row under it (y 474..); right 1/3 = step card (x 652..944): green
 * "Ecosystem diversity" header, the four step labels, the step's title (VIEWS.residents.names) and a legend (green = home / ecosystem,
 * cyan = resident / species, "sizes are not real sizes").
 *  0 forest (HB1 forest picture, no BD forest background exists): the four BD6 residents slide up from below one by one, each with a
 *    cyan name pill under it; the row under the window: green "Forest" pill, "needs", chips "Shade" "Moisture".
 *  1 stream (HB4): chub in the water, mayfly nymph flat on a stone in the shallows, dipper on the bank rock, snail on the bottom; they
 *    pop in one by one; row: "Stream" needs "Flowing, clean water".
 *  2 estuary (HB6): mudskipper and fiddler crab on the mudflat, spoonbill in the shallow channel; row: "Estuary" needs
 *    "Mudflats where fresh and salt water meet".
 *  3 moving test: a narrow forest panel (HB1) on the left with the four residents in a column, the desert (HB2) on the right. One by one
 *    a white dashed curved arrow drags each resident to the desert; there it fades and gets its name pill; a dashed outline stays at
 *    its forest place. Labels "The conditions they need are missing here" (desert), "The places stand empty" (forest); the row under
 *    the window: "Diversity rests on different environments, not on moving organisms around"; bottom note "Schematic, not a real
 *    transplant experiment".
 * Scenes cross-fade (picture under, labels fade first). Colours (plan 1.4): ecosystem green #4ade80 (home pills, card header),
 * species cyan #55e9ff (resident pills); conditions / statements white. No numbers.
 * Pictures (K.SIZE): ecology_ai_1023/HB1_forest, HB4_stream, HB6_mangrove, HB2_desert (1672x933); HB7_mudskipper 1400x678,
 * HB8_fiddler_crab 1359x1197, EC16_spoonbill_stand 999x989; environment_ai_1024/BD6_* and BD7_* (cut-outs, alpha bbox = full).
 * Resident positions: canvas px at zoom 1, read from a PIL grid of each picture (stream bank rock, water, shallows; estuary mud / channel).
 * New labels (P(), not in K.LAB) are in T, HOMES and the resident lists below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,GREEN=K.COL.ecosystem,CYAN=K.COL.species;
const E=K.ENV||'environment_ai_1024/';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 short:[P('森林','Forest'),P('溪流','Stream'),P('河口濕地','Estuary'),P('搬家測試','Moving test')],
 names:[P('森林的居民','Residents of the forest'),P('溪流的居民','Residents of the stream'),P('河口濕地的居民','Residents of the estuary'),P('把森林居民搬到沙漠','Moving forest residents to a desert')],
 needs:P('需要','needs'),
 desert:P('沙漠','Desert'),
 missing:P('這裡沒有它們需要的環境','The conditions they need are missing here'),
 empty:P('位置變空了','The places stand empty'),
 lesson:P('多樣性靠不同的環境，不是把生物搬來搬去','Diversity rests on different environments, not on moving organisms around'),
 notReal:P('示意，不是真實移入實驗','Schematic, not a real transplant experiment'),
 legHome:P('綠框：住處，一種生態系','Green: a home, one ecosystem'),
 legRes:P('青框：居民，一個物種','Cyan: a resident, one species')
};
const HOMES=[
 {name:P('森林','Forest'),cond:[P('遮蔭','Shade'),P('濕潤','Moisture')]},
 {name:P('溪流','Stream'),cond:[P('流動、乾淨的水','Flowing, clean water')]},
 {name:P('河口濕地','Estuary'),cond:[P('鹹淡水交會的泥灘','Mudflats where fresh and salt water meet')]}
];
// residents: f = picture, x / y = bottom centre (canvas px, zoom 1), h = height, rot = turn (rad), mv = idle motion, pw = pill max width
const FOREST=[
 {f:E+'BD6_blue_magpie.png',name:P('臺灣藍鵲','Taiwan blue magpie'),x:93.5,y:388,h:168,mv:'bob',pw:164},
 {f:E+'BD6_muntjac.png',name:P('山羌','Reeves\'s muntjac'),x:248.5,y:388,h:136,mv:'sway',pw:154},
 {f:E+'BD6_swinhoes_pheasant.png',name:P('藍腹鷴','Swinhoe\'s pheasant'),x:403.5,y:388,h:140,mv:'sway',pw:154},
 {f:E+'BD6_macaque.png',name:P('臺灣獼猴','Formosan macaque'),x:558.5,y:388,h:140,mv:'bob',pw:154}
];
const STREAM=[
 {f:E+'BD7_chub.png',name:P('苦花','Taiwan chub'),x:354,y:334,h:56,mv:'swim',pw:200},
 {f:E+'BD7_mayfly_nymph.png',name:P('蜉蝣稚蟲','Mayfly nymph'),x:190,y:375,h:136,rot:-Math.PI/2,mv:'crawl',pw:200},
 {f:E+'BD7_dipper.png',name:P('河烏','Brown dipper'),x:96,y:240,h:100,mv:'dip',pw:200},
 {f:E+'BD7_river_snail.png',name:P('川蜷','Freshwater snail'),x:474,y:409,h:50,mv:'crawl',pw:230}
];
const ESTUARY=[
 {f:'HB7_mudskipper.png',name:P('彈塗魚','Mudskipper'),x:140,y:332,h:70,mv:'hop',pw:200},
 {f:'HB8_fiddler_crab.png',name:P('招潮蟹','Fiddler crab'),x:354,y:394,h:96,mv:'bob',pw:200},
 {f:'EC16_spoonbill_stand.png',name:P('黑面琵鷺','Black-faced spoonbill'),x:547,y:250,h:150,mv:'sway',pw:180}
];
const SCENES=[
 {file:'HB1_forest.jpg',crop:{x:200,w:1285},anchor:[326,380],res:FOREST,slide:true},
 {file:'HB4_stream.jpg',crop:{x:200,w:1285},anchor:[326,320],res:STREAM},
 {file:'HB6_mangrove.jpg',crop:{x:300,w:1285},anchor:[326,320],res:ESTUARY}
];
const IW=1672,IH=933;

// ── layout ────────────────────────────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:450};
const CARD={x:652,y:16,w:292,h:550};
const ROW_Y=474;
// moving test: forest panel and desert panel (canvas), crops (picture px, full height)
const FP={x:16,y:16,w:200,h:450},DP={x:228,y:16,w:408,h:450};
const FP_CROP=640,DP_CROP=440;
const MROWS=[214,295,376,457],MOV_H=72,FOREST_X=116,DESERT_X=276;

// ── helpers (as in the mosaic / response views) ──────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
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
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?C.ink:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// a pill whose text may wrap: lines measured first (K.measure inside blines), never below 22 px
const LH=26;
function greedy(c,str,w){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,22)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function boxGeo(c,p,maxW){const str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-28):greedy(c,str,maxW-28);const w=Math.max(...rows.map(r=>measure(c,r,22)))+28,h=40+(rows.length-1)*LH;return{rows,w,h};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill='rgba(11,26,21,.92)',dash=null}={}){
  const g=boxGeo(c,p,maxW),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  if(dash){c.save();c.setLineDash(dash);}D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:20,fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+28+i*LH,22,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};
}
// a cut-out picture with its bottom centre at (x, y) and height h (rot turns it about its centre)
function cut(c,f,x,y,h,rot=0,a=1){const [W,H]=K.dim(f);c.save();c.shadowColor='rgba(11,26,21,.75)';c.shadowBlur=10;c.shadowOffsetY=2;const res=cut0(c,f,x,y,h,rot,a,W,H);c.restore();return res;}
function cut0(c,f,x,y,h,rot,a,W,H){
  if(!rot){const w=h*W/H;K.drawIn(c,f,{x:x-w/2,y:y-h,w,h},{alpha:a});return{x:x-w/2,y:y-h,w,h};}
  // turned a quarter: h is the drawn length along x; the picture's long side becomes horizontal
  const len=h,thick=len*W/H;c.save();c.translate(x,y-thick/2);c.rotate(rot);K.drawIn(c,f,{x:-thick/2,y:-len/2,w:thick,h:len},{alpha:a});c.restore();
  return{x:x-len/2,y:y-thick,w:len,h:thick};
}
// idle motion offset for a resident
function motion(r,t,i){const ph=i*1.7;
  switch(r.mv){
   case'swim':return{dx:9*Math.sin(t*.9+ph),dy:2.5*Math.sin(t*1.8+ph),rot:0,sy:1};
   case'dip':{const d=Math.max(0,Math.sin(t*2.6+ph));return{dx:0,dy:0,rot:0,sy:1-.05*d*d};}
   case'hop':{const d=Math.max(0,Math.sin(t*1.9+ph));return{dx:0,dy:-5*d*d,rot:0,sy:1};}
   case'crawl':return{dx:3*Math.sin(t*.6+ph),dy:0,rot:0,sy:1};
   case'sway':return{dx:0,dy:0,rot:.025*Math.sin(t*1.3+ph),sy:1};
   default:return{dx:0,dy:0,rot:0,sy:1+.02*Math.sin(t*1.8+ph)};}
}

// ── camera: slow breathing zoom about a canvas anchor; residents ride with the picture ──
function cam(sc,t){
  const z=1+.035*(.5-.5*Math.cos(t*.38)),A=sc.anchor,k0=WIN.w/sc.crop.w;   // canvas px per picture px at zoom 1
  const pa=[sc.crop.x+(A[0]-WIN.x)/k0,(A[1]-WIN.y)/k0],w=sc.crop.w/z,k=WIN.w/w;
  return{z,A,x:pa[0]-(A[0]-WIN.x)/k,y:pa[1]-(A[1]-WIN.y)/k,w,h:WIN.h/k};
}
const zmap=(cm,x,y)=>[cm.A[0]+(x-cm.A[0])*cm.z,cm.A[1]+(y-cm.A[1])*cm.z];

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.residentsSt||(s.residentsSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}   // the same step clicked again: replay it
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;

  // window backdrop
  D.round(c,WIN.x-2,WIN.y-2,WIN.w+4,WIN.h+4,14,'#16332b',null);
  // outgoing scene: picture full, labels fade in the first half; incoming scene fades over it
  if(moving)scene(c,st.from,99,t,1,1-clamp(x*2),null);
  scene(c,k,tau,t,moving?u:1,1,rects);

  card(c,k,st,moving,x,u,tau,t);

  // notes: AI pictures always; schematic note on the moving test
  const nA=k===3?clamp((tau-6.6)/.6):(moving&&st.from===3?1-u:0);
  withA(c,nA,()=>{text(c,T.notReal,24,592,22,MUTED,'left');rects.push({id:'notReal',x:24,y:574,w:measure(c,T.notReal,22),h:24});});
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,592,22,MUTED,'right');
  rects.push({id:'aiNote',x:CW-12-measure(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),22),y:574,w:measure(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),22),h:24});
}

// one step's stage: pictA = picture alpha, labA = labels alpha, rects = collect label rects (null: do not)
function scene(c,k,tau,t,pictA,labA,rects){
  const at=(d,dur=.5)=>clamp((tau-d)/dur);
  if(k===3)return moveTest(c,tau,t,pictA,labA,rects,at);
  const sc=SCENES[k],cm=cam(sc,t);
  withA(c,pictA,()=>{
    K.drawIn(c,sc.file,WIN,{radius:12,crop:[cm.x/IW,cm.y/IH,cm.w/IW,cm.h/IH]});
    // a light veil so the cut-outs and pills read on a busy picture
    c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
    c.fillStyle=rgba('#0b1a15',.18);c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
    // residents, then their name pills
    const pills=[];
    sc.res.forEach((r,i)=>{
      const a=at(.9+i*.8,.7);if(a<=0)return;
      const m=motion(r,t,i),[px,py]=zmap(cm,r.x,r.y),h=r.h*cm.z;
      const slide=sc.slide?(1-ease(a))*300:(1-ease(a))*14,pop=sc.slide?1:.85+.15*ease(a);
      withA(c,sc.slide?1:a,()=>{
        c.save();c.translate(px+m.dx,py+m.dy+slide);c.rotate(m.rot);c.scale(pop,pop*m.sy);
        if(a<1&&!sc.slide)K.glow(c,0,-h/2,h*.7,CYAN,.35*(1-a));
        cut(c,r.f,0,0,h,r.rot||0);c.restore();});
      pills.push({r,i,a,x:px,y:py+slide+6});
    });
    withA(c,labA,()=>pills.forEach(({r,a,x,y})=>{
      const g=boxGeo(c,r.name,r.pw),bx=Math.max(WIN.x+8,Math.min(x-g.w/2,WIN.x+WIN.w-8-g.w));
      withA(c,sc.slide?1:a,()=>{const q=box(c,r.name,bx,y,{maxW:r.pw,stroke:CYAN});if(rects&&a>=1)rects.push({id:D.tr(r.name),...q});});
    }));
    c.restore();
  });
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);
  // the row under the window: home (green) needs conditions (white)
  const H=HOMES[k];
  withA(c,labA*pictA,()=>{
    const hr=withPill(c,H.name,WIN.x,ROW_Y,GREEN,at(.3,.5));if(rects&&at(.3,.5)>=1)rects.push({id:'home',...hr});
    const ca=at(4.4,.6);if(ca<=0)return;
    withA(c,ca,()=>{
      let xx=hr.x+hr.w+12;text(c,T.needs,xx,ROW_Y+28,22,MUTED);const nw=measure(c,T.needs,22);
      if(rects)rects.push({id:'needs',x:xx,y:ROW_Y+8,w:nw,h:24});xx+=nw+12;
      H.cond.forEach(p=>{const q=box(c,p,xx,ROW_Y,{maxW:WIN.x+WIN.w-xx,stroke:WHITE});if(rects)rects.push({id:'cond',...q});
        if(tau<99&&tau>4.4&&tau<8.6)ring(c,q,t,WHITE);xx+=q.w+10;});
    });
  });
}
function withPill(c,p,x,y,col,a){let r=null;withA(c,a,()=>{r=box(c,p,x,y,{stroke:col});});return r||{x,y,w:K.measure(c,p,22)+28,h:40};}

// step 3: the moving test
function moveTest(c,tau,t,pictA,labA,rects,at){
  const z=1+.02*(.5-.5*Math.cos(t*.38));
  const crop=(r,x0)=>{const w=IH*r.w/r.h/z,h=IH/z;return[(x0+(IH*r.w/r.h-w)/2)/IW,(IH-h)/IH,w/IW,h/IH];};
  withA(c,pictA,()=>{
    K.drawIn(c,'HB1_forest.jpg',FP,{radius:12,crop:crop(FP,FP_CROP)});
    K.drawIn(c,'HB2_desert.jpg',DP,{radius:12,crop:crop(DP,DP_CROP)});
    [FP,DP].forEach(r=>{c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,12);c.clip();c.fillStyle=rgba('#0b1a15',.2);c.fillRect(r.x,r.y,r.w,r.h);c.restore();
      D.round(c,r.x,r.y,r.w,r.h,12,null,C.edge);});
    // home pills (green) on both panels
    const la=labA;
    withA(c,la,()=>{const a=box(c,HOMES[0].name,FP.x+10,FP.y+10,{stroke:GREEN}),b=box(c,T.desert,DP.x+10,DP.y+10,{stroke:GREEN});
      if(rects)rects.push({id:'forestPill',...a},{id:'desertPill',...b});});
    // each resident: in the forest, dragged along a dashed curve, then faded in the desert
    FOREST.forEach((r,i)=>{
      const y=MROWS[i],d=1.2+i*1.1,f=ease(at(d,.9)),arr=at(d+.9,.5),m=motion(r,t,i);
      const p0=[FOREST_X,y],p2=[DESERT_X,y],p1=[(FOREST_X+DESERT_X)/2,y-MOV_H-18];
      const [W,H]=K.dim(r.f),w=MOV_H*W/H;
      // empty place (dashed outline) once it has left
      if(f>0)withA(c,clamp(f*1.5)*la,()=>{c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*10;c.lineWidth=3;c.strokeStyle=WHITE;
        c.beginPath();c.roundRect(FOREST_X-w/2-8,y-MOV_H-2,w+16,MOV_H+4,10);c.fillStyle='rgba(11,26,21,.45)';c.fill();c.stroke();c.restore();});
      // trail
      if(f>0)withA(c,.9*la,()=>{const n=24,pts=[];for(let j=0;j<=n*f;j++)pts.push(K.bez([p0[0]+w/2+10,p0[1]-MOV_H*.6],[p1[0],p1[1]],[p2[0]-w/2-12,p2[1]-MOV_H*.6],j/n));
        if(pts.length>1){c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*16;c.lineWidth=3;c.strokeStyle=WHITE;c.beginPath();pts.forEach((q,j)=>j?c.lineTo(...q):c.moveTo(...q));c.stroke();c.restore();}
        if(arr>0&&pts.length>2){const q=pts[pts.length-1],o=pts[pts.length-3];withA(c,arr,()=>K.arrow(c,o[0],o[1],q[0],q[1],WHITE,3));}});
      // the resident itself
      const pos=K.bez(p0,[p1[0],y-50],p2,f);
      const fadeA=1-.5*at(d+1,.7);
      c.save();c.translate(pos[0],pos[1]);c.rotate(m.rot);cut(c,r.f,0,0,MOV_H*m.sy,0,fadeA);c.restore();
      // grab mark while dragging
      if(f>0&&f<1)circle(c,pos[0],pos[1]-MOV_H-8,7,WHITE,C.ink,2);
      // name pill in the desert
      const na=at(d+1.1,.5)*la;
      withA(c,na,()=>{const q=box(c,r.name,DESERT_X+w/2+14,y-MOV_H/2-20,{maxW:DP.x+DP.w-8-(DESERT_X+w/2+14),stroke:CYAN});if(rects&&na>=1)rects.push({id:D.tr(r.name),...q});});
    });
    // labels: missing environment (desert), empty places (forest)
    const ma=at(5.8,.6)*la,ea=at(6.2,.6)*la;
    withA(c,ma,()=>{const x0=DP.x+10+tagW(c,T.desert)+10,q=box(c,T.missing,x0,DP.y+10,{maxW:DP.x+DP.w-8-x0,stroke:WHITE});if(rects&&ma>=1)rects.push({id:'missing',...q});
      if(tau<99&&tau>5.8)ring(c,q,t,WHITE);});
    withA(c,ea,()=>{const q=box(c,T.empty,FP.x+8,FP.y+58,{maxW:FP.w-16,stroke:WHITE,dash:[7,5]});if(rects&&ea>=1)rects.push({id:'empty',...q});});
  });
  // the row under the window: the statement
  const la2=at(6.6,.6)*labA;
  withA(c,la2,()=>{const q=box(c,T.lesson,WIN.x,ROW_Y,{maxW:WIN.w,stroke:GREEN,col:WHITE});if(rects&&la2>=1)rects.push({id:'lesson',...q});
    if(tau<99&&tau>6.6)ring(c,q,t,GREEN);});
}
const tagW=(c,p)=>boxGeo(c,p,600).w;

function card(c,k,st,moving,x,u,tau,t){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,L('ecosystem','生態系多樣性','Ecosystem diversity'),ix,R.y+14,{stroke:GREEN,col:GREEN});
  let y=R.y+14+hr.h+14;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,40,12,'rgba(242,236,217,.10)',null));
    badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true));
    text(c,p,ix+42,cy+8,22,on>.5?WHITE:MUTED);
    y+=42;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  // legend: green home, cyan resident, sizes note
  const legs=[['home',T.legHome],['res',T.legRes]];
  const sz=L('sizeNoReal','大小不代表真實大小','Sizes are not real sizes'),szh=blines(c,sz,iw).length*28;
  const lhs=legs.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+10));
  const ly=R.y+R.h-12-szh-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  let yy=ly;
  legs.forEach(([kind,p],q)=>{const col=kind==='home'?GREEN:CYAN,pul=.5+.5*Math.sin(t*2+q);
    D.round(c,ix,yy+4,40,26,13,'rgba(11,26,21,.92)',rgba(col,.7+.3*pul));
    bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);yy+=lhs[q];});
  bwrap(c,sz,ix,yy+30,iw,22,MUTED,28);
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.residents=draw;
window.EnvironmentDraw.residents.dbg=s_dbg;
})();

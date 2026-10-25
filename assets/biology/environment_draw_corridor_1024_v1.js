/* Unit 11 lesson 3 · "corridor" canvas (habitat-connections tab, view 1), 2026-10-25. Overpasses and culverts (plan section 4, corridor; P1).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Continues lesson 2 "fragment": the same top view (TH1b farmland under a soft-edged TH1a forest blob, the same curved road, the same
 * cyan dashed home-range circle, the same leopard cat pictures) in the same window (x 16..636, y 16..428), statement box under it,
 * step card on the right (x 652..944).
 *  0 recap: the forest cut by the road (fragment step 2 state); cyan dashed "Home range" circle crosses the road; a leopard cat
 *    (TH2 stand, facing the road) at the roadside; tags "Forest", "Road", "Leopard cat".
 *  1 overpass: a green vegetated band appears over the road in the top view; the top view shrinks into a small map card (top left)
 *    while CV6a_overpass.jpg grows out of the band's spot to fill the window (a cut-in close-up, never a crossfade with the top view).
 *    Green ring on the band in the card, dashed leader to the bridge; on CV6a a green dashed path with running glints over the bridge
 *    and a small walking cat; tags "Overpass" (green), "Road".
 *  2 culvert: a green dashed line under the road appears in the card; CV6a shrinks back into its spot in the card, then CV6b_underpass.jpg
 *    grows out of the culvert spot. A cat walks through the culvert on the floor; tags "Culvert" (green), "Road"; white box
 *    "Different animals need different designs".
 *  3 where it leads: CV6b shrinks into its spot while the card grows back to the full top view. Both crossings are on the map; green
 *    glows at both ends of the overpass ("Vegetated entrance", "Leads to forest"), a cat crosses the overpass; a farmland strip grows
 *    from the right edge up to the culvert's exit (orange, "Exit opens onto farmland"); white tag "Where it leads matters";
 *    statement "A crossing cannot make up for all lost habitat".
 *  Loop 3 -> 0: same top view, the extra pieces fade out.
 * Always moving: dashes march, the forest edge breathes, glints run along paths, cats walk or breathe, rings pulse.
 * Colours (plan 1.4): connection / protection green #4ade80; pressure (farmland) orange #fb923c; home range cyan as in fragment
 * (recap only, always named). No sizes, widths or building numbers; "finished is not yet success" is left to monitor.
 * Pictures: TH1a_forest_top.jpg, TH1b_farmland_top.jpg (1672x933, centre crop as fragment); TH2_leopard_cat_walk.png (1198x562),
 * TH2_leopard_cat_stand.png (1122x701): tight transparent crops (alpha>10 bbox = whole picture), both face left.
 * CV6a_overpass.jpg, CV6b_underpass.jpg (1024x572): crop src x 80..941, full height, onto the window. Points on them were picked once
 * from a gridded copy (source px below).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1.2;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const GREEN=(K.COL&&K.COL.protect)||'#4ade80',ORANGE=(K.COL&&K.COL.pressure)||'#fb923c',CYAN=(K.COL&&K.COL.species)||'#55e9ff';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const FOREST=ENV+'TH1a_forest_top.jpg',FARM=ENV+'TH1b_farmland_top.jpg',WALK=ENV+'TH2_leopard_cat_walk.png',STAND=ENV+'TH2_leopard_cat_stand.png';
const OVER=ENV+'CV6a_overpass.jpg',UNDER=ENV+'CV6b_underpass.jpg';
[FOREST,FARM,WALK,STAND,OVER,UNDER].forEach(f=>{try{K.pic(K.src(f));}catch(e){}});

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('陸橋與涵洞','Overpasses and culverts'),
 short:[P('被路切開','Cut by a road'),P('陸橋','Overpass'),P('涵洞','Culvert'),P('連到哪裡','Where it leads')],
 names:[P('回顧：被路切開的森林','Recap: a forest cut by a road'),P('陸橋：從上方走過','Overpass: crossing above'),P('涵洞：從路下走過','Culvert: passing below'),P('通道要連到合適的棲地','A crossing must lead to suitable habitat')],
 range:P('活動範圍','Home range'),forest:P('森林','Forest'),road:P('道路','Road'),cat:P('石虎','Leopard cat'),
 over:P('陸橋','Overpass'),culvert:P('涵洞','Culvert'),
 design:P('不同動物需要不同設計','Different animals need different designs'),
 veg:P('入口有植被','Vegetated entrance'),toForest:P('通到森林','Leads to forest'),toFarm:P('出口是農地','Exit opens onto farmland'),
 where:P('連到哪裡很重要','Where it leads matters'),
 st:[P('一條路把森林切成兩塊','A road splits the forest in two'),
  P('陸橋：動物從路的上方走過去','Overpass: animals cross above the road'),
  P('涵洞：動物從路的下面走過去','Culvert: animals pass under the road'),
  P('通道不能彌補全部的棲地損失','A crossing cannot make up for all lost habitat')],
 leg:[[['range',P('青虛線圓：活動範圍','Cyan dashed circle: home range')],['road',P('灰帶：道路','Grey band: road')]],
      [['bridge',P('綠帶：陸橋（連通）','Green band: overpass')],['mini',P('小地圖：在哪裡','Small map: where it is')]],
      [['culvert',P('綠虛線：路下的涵洞','Green dashes: culvert under the road')],['mini',P('小地圖：在哪裡','Small map: where it is')]],
      [['green',P('綠：通到森林','Green: leads to forest')],['orange',P('橘：通到農地','Orange: leads to farmland')]]],
 foot:P('廊道只作連通的示意，不寫尺寸與施工數字','Connection only: no sizes or building figures'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── geometry: top view (window-local px, same as fragment) ───────────────
const WIN={x:16,y:16,w:620,h:412};
const IW=1672,IH=933,CROPW=IH*WIN.w/WIN.h,CROP=[(IW-CROPW)/2/IW,0,CROPW/IW,1];
const CARD={x:652,y:16,w:292,h:550};
const BX=310,BY=210,BRX=286,BRY=192,NB=180;
const C0=[300,210],R=110;
const ROADW=26,RP=[[352,-20],[262,210],[302,445]];
const STRIP={pts:[[650,322],[560,336],[470,318],[380,332],[300,328]],w:54};   // step 3: farmland up to the culvert's exit
function blob(){const pts=[];for(let i=0;i<NB;i++){const a=i/NB*Math.PI*2,r=1+.04*Math.sin(3*a+.9)+.03*Math.sin(5*a+2.4)+.015*Math.sin(11*a+.3);
  pts.push([BX+BRX*r*Math.cos(a),BY+BRY*r*Math.sin(a)]);}return pts;}
const BLOB=blob();
const qb=u=>{const [a,b,c]=RP,v=1-u;return[v*v*a[0]+2*v*u*b[0]+u*u*c[0],v*v*a[1]+2*v*u*b[1]+u*u*c[1]];};
const ROAD=[];for(let i=0;i<=60;i++)ROAD.push(qb(i/60));
function roadAt(y){let bu=0,bd=1e9;for(let i=0;i<=400;i++){const q=qb(i/400),d=Math.abs(q[1]-y);if(d<bd){bd=d;bu=i/400;}}
  const [a,b,c]=RP,dx=2*(1-bu)*(b[0]-a[0])+2*bu*(c[0]-b[0]),dy=2*(1-bu)*(b[1]-a[1])+2*bu*(c[1]-b[1]);return{p:qb(bu),ang:Math.atan2(dy,dx)};}
const roadX=y=>roadAt(y).p[0];
// the two crossings: centre on the road, direction across it
const mkCross=y=>{const r=roadAt(y);let a=r.ang+Math.PI/2;if(Math.cos(a)<0)a+=Math.PI;const ca=Math.cos(a),sa=Math.sin(a);return{c:r.p,ang:a,ux:ca,uy:sa,end:d=>[r.p[0]+ca*d,r.p[1]+sa*d]};};
const CA=mkCross(212),CB=mkCross(328);
const OVL=136,OVW=44;                           // overpass band length / width on the map (drawing only)
function partial(pts,f){if(f>=1)return pts;if(f<=0)return[pts[0]];let tot=0;for(let i=1;i<pts.length;i++)tot+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  let left=tot*f;const out=[pts[0]];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(left>=l){out.push(b);left-=l;}else{out.push([mix(a[0],b[0],left/l),mix(a[1],b[1],left/l)]);break;}}return out;}
function pathPoly(g,pts,close=true){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(close)g.closePath();}
// small map card and the spots of the two crossings (map-local, 3:2 like the window)
const CARDM={x:26,y:26,w:186,h:Math.round(186*WIN.h/WIN.w)};
const SPOT=[null,{c:CA.c,w:120,h:80},{c:CB.c,w:120,h:80}];
const mapPt=(R,[x,y])=>[R.x+x*R.w/WIN.w,R.y+y*R.h/WIN.h];
const spotRect=(i,R)=>{const s=SPOT[i],k=R.w/WIN.w;return{x:R.x+(s.c[0]-s.w/2)*k,y:R.y+(s.c[1]-s.h/2)*k,w:s.w*k,h:s.h*k};};
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});

// ── geometry: the two pictures (crop src x 80..941, full height, onto the window) ──
const PSX=80,PSW=861,PCROP=[PSX/1024,0,PSW/1024,1];
const pp=([X,Y],Rr=WIN)=>[Rr.x+(X-PSX)*Rr.w/PSW,Rr.y+Y*Rr.h/572];
// CV6a: across the bridge deck (left forest -> right forest), the deck, the road under it
const A_PATH=[[268,222],[340,236],[480,256],[620,278],[770,292]].map(q=>pp(q));
const A_DECK=pp([520,246]),A_ROAD=pp([395,470]);
// CV6b: along the culvert floor (left opening -> far end), the tunnel, the road surface on top
const B_PATH=[[250,382],[430,374],[620,366],[860,356]].map(q=>pp(q));
const B_TUN=pp([660,272]),B_ROAD=pp([600,80]);

// ── helpers (as in fragment / fishway) ───────────────────────────────────
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
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22}={}){
  const w=tagW(c,p,size),h=size+18;let bx=al==='right'?x-w:al==='center'?x-w/2:x;bx=Math.max(WIN.x+6,Math.min(bx,WIN.x+WIN.w-6-w));
  const by=Math.max(WIN.y+6,Math.min(y,WIN.y+WIN.h-6-h));
  D.round(c,bx,by,w,h,h/2,FILL,rgba(col,.95));text(c,p,bx+w/2,by+h/2+size*.36,size,col,'center');return{x:bx,y:by,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const lead=(c,x1,y1,x2,y2,t,col=WHITE)=>{K.dashed(c,[[x1,y1],[x2,y2]],rgba(INK,.7),5,[8,6],-t*10);K.dashed(c,[[x1,y1],[x2,y2]],col,2.5,[8,6],-t*10);};
function along(pts,u){let tot=0;const seg=[];for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);tot+=l;}
  let d=clamp(u)*tot;for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1){const r=seg[i]?Math.min(1,d/seg[i]):0;
    return[mix(pts[i][0],pts[i+1][0],r),mix(pts[i][1],pts[i+1][1],r)];}d-=seg[i];}return pts[pts.length-1];}
// cat picture centred at (x, y), facing left unless flip
function cat(c,file,x,y,w,flip=false,a=1){const [W,H]=K.SIZE[file]||[1198,562],h=w*H/W;
  withA(c,a,()=>{c.save();c.shadowColor='rgba(11,26,21,.8)';c.shadowBlur=6;K.drawIn(c,file,{x:x-w/2,y:y-h/2,w,h},{flip});c.restore();});
  return{x:x-w/2,y:y-h/2,w,h};}
// walk cycle along a path: stand, walk, stand, fade; returns null while hidden
function walker(c,pts,q,cyc,w,a,{feet=true}={}){const flip=pts[pts.length-1][0]>pts[0][0];
  const tt=mod(q,cyc),fa=a*(tt<.4?tt/.4:tt>cyc-.5?(cyc-tt)/.5:1);if(fa<=0)return null;
  const W0=.6,W1=cyc-1.4,f=tt<W0?0:tt>W1?1:smooth((tt-W0)/(W1-W0)),walking=tt>W0&&tt<W1,file=walking?WALK:STAND;
  const [x,y]=along(pts,f),[Wd,Ht]=K.SIZE[file],ww=walking?w:w*.9,h=ww*Ht/Wd,bob=walking?Math.abs(Math.sin(tt*9))*1.6:0;
  return cat(c,file,x,(feet?y-h/2:y)-bob,ww,flip,fa);}

// ── offscreen canvases ───────────────────────────────────────────────────
const OFFS={};
function off(name,w,h){let o=OFFS[name];if(!o||o.width!==w||o.height!==h){o=document.createElement('canvas');o.width=w;o.height=h;OFFS[name]=o;o.g=o.getContext('2d');}
  o.g.setTransform(1,0,0,1,0,0);o.g.globalCompositeOperation='source-over';o.g.globalAlpha=1;o.g.clearRect(0,0,w,h);return o;}

// ── the top view, rendered once per frame into an offscreen canvas (window-local coords) ──
// p: {a overpass 0..1, b culvert 0..1, e farmland strip 0..1}
function mapCanvas(c,p,t){
  const m=c.getTransform(),sx=Math.max(1,Math.hypot(m.a,m.b)),W=Math.ceil(WIN.w*sx),H=Math.ceil(WIN.h*sx);
  const M=off('map',W,H),g=M.g;g.setTransform(sx,0,0,sx,0,0);
  K.drawIn(g,FARM,{x:0,y:0,w:WIN.w,h:WIN.h},{crop:CROP});
  g.fillStyle='rgba(11,26,21,.30)';g.fillRect(0,0,WIN.w,WIN.h);
  const im=K.pic(K.src(FOREST)),feather=10+3*Math.sin(t*1.5);
  const drawForest=gg=>gg.drawImage(im,CROP[0]*im.naturalWidth,0,CROP[2]*im.naturalWidth,im.naturalHeight,0,0,WIN.w,WIN.h);
  if(im){const F=off('forest',W,H),f=F.g,OFF=4000;f.setTransform(sx,0,0,sx,0,0);
    f.save();f.shadowColor='#fff';f.shadowBlur=feather*sx;f.shadowOffsetX=OFF*sx;f.translate(-OFF,0);pathPoly(f,BLOB);f.fillStyle='#fff';f.fill();f.restore();
    f.save();f.globalCompositeOperation='destination-out';f.shadowColor='#fff';f.shadowBlur=feather*.6*sx;f.shadowOffsetX=OFF*sx;f.translate(-OFF,0);f.strokeStyle='#fff';f.lineCap='round';f.lineJoin='round';
    pathPoly(f,ROAD,false);f.lineWidth=ROADW;f.stroke();
    if(p.e>0){pathPoly(f,partial(STRIP.pts,p.e),false);f.lineWidth=STRIP.w*mix(.5,1,p.e);f.stroke();}f.restore();
    f.save();f.globalCompositeOperation='destination-out';f.strokeStyle='#fff';f.lineCap='round';pathPoly(f,ROAD,false);f.lineWidth=ROADW*.7;f.stroke();f.restore();
    f.globalCompositeOperation='source-in';drawForest(f);f.globalCompositeOperation='source-over';
    g.drawImage(F,0,0,WIN.w,WIN.h);}
  // road surface (as fragment)
  K.sline(g,ROAD,'#3f4a45',ROADW-6);g.save();g.setLineDash([12,12]);K.sline(g,ROAD,rgba(WHITE,.8),2.5);g.restore();
  // culvert: dashes under the road, a dark opening at each end
  if(p.b>0)withA(g,p.b,()=>{const e1=CB.end(-52),e2=CB.end(52);
    K.dashed(g,[e1,e2],rgba(INK,.8),7,[9,6],-t*12);K.dashed(g,[e1,e2],GREEN,3.5,[9,6],-t*12);
    [e1,e2].forEach(q=>K.ellipse(g,q[0],q[1],7,11,'#0b1a15',GREEN,2.5,CB.ang));});
  // overpass: a band of forest over the road, green edge
  if(p.a>0)withA(g,p.a,()=>{g.save();g.translate(CA.c[0],CA.c[1]);g.rotate(CA.ang);
    g.save();g.shadowColor='rgba(11,26,21,.85)';g.shadowBlur=10;D.round(g,-OVL/2,-OVW/2,OVL,OVW,8,'#2f5d3a',null);g.restore();
    g.beginPath();g.roundRect(-OVL/2,-OVW/2,OVL,OVW,8);g.clip();
    if(im){g.save();g.rotate(-CA.ang);g.translate(-CA.c[0],-CA.c[1]);drawForest(g);g.restore();}
    g.fillStyle=rgba(GREEN,.28);g.fillRect(-OVL/2,-OVW/2,OVL,OVW);
    g.restore();
    g.save();g.translate(CA.c[0],CA.c[1]);g.rotate(CA.ang);
    K.sline(g,[[-OVL/2+14,-OVW/2+1],[OVL/2-14,-OVW/2+1]],'#d8d0bf',2.5);K.sline(g,[[-OVL/2+14,OVW/2-1],[OVL/2-14,OVW/2-1]],'#d8d0bf',2.5);
    g.lineWidth=3.5;g.strokeStyle=GREEN;g.beginPath();g.roundRect(-OVL/2,-OVW/2,OVL,OVW,8);g.stroke();g.restore();});
  return M;}
function blitMap(c,M,Rr,radius){c.save();c.beginPath();c.roundRect(Rr.x,Rr.y,Rr.w,Rr.h,radius);c.clip();c.drawImage(M,Rr.x,Rr.y,Rr.w,Rr.h);c.restore();}
function cardFrame(c,M,Rr,a=1){withA(c,a,()=>{c.save();c.shadowColor='rgba(11,26,21,.9)';c.shadowBlur=14;D.round(c,Rr.x,Rr.y,Rr.w,Rr.h,10,'#16332b',null);c.restore();
  blitMap(c,M,Rr,10);D.round(c,Rr.x,Rr.y,Rr.w,Rr.h,10,null,WHITE);});}
const picOf=k=>k===1?OVER:k===2?UNDER:null;
function drawPic(c,file,Rr,a=1,radius=12){withA(c,a,()=>K.drawIn(c,file,Rr,{radius,crop:PCROP}));}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function target(k,tau,from){
  if(k===0)return{a:0,b:0,e:0};
  if(k===1)return{a:1,b:0,e:0};
  if(k===2)return{a:1,b:1,e:0};
  return{a:1,b:1,e:from>=0&&from!==3?ease(clamp((tau-1.6)/1.8)):1};}
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.corSt||(s.corSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;st.cur=target(k,9,-1);st.fromP=st.cur;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.fromP=st.cur;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.fromP=st.cur;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  let p=target(k,tau,st.from);
  if(moving&&st.fromP)p={a:mix(st.fromP.a,p.a,u),b:mix(st.fromP.b,p.b,u),e:mix(st.fromP.e,p.e,u)};
  st.cur=p;s_dbg.p=p;
  // overlays of a step: new one fades in after the move, old one fades out at its start
  // (the pictures zoom during the move, so the overlays only show once they stand still)
  const A=j=>j===k?(moving?clamp((x-.9)/.1):1):(moving&&j===st.from?1-clamp(x*4):0);
  const TT=j=>j===k?tau:99;

  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,'rgba(22,51,43,.92)',null);
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  const M=mapCanvas(c,p,t);
  scene(c,M,k,st,moving,x,u,t,rects);
  step0(c,A(0),TT(0),t,rects);
  step1(c,A(1),TT(1),t,rects);
  step2(c,A(2),TT(2),t,rects);
  step3(c,A(3),TT(3),t,rects);
  // card marker and leader (picture steps)
  if(k===1||k===2){const ma=moving?clamp((x-.75)/.25):1;
    withA(c,ma,()=>{const r=spotRect(k,CARDM),q=k===1?A_DECK:B_TUN;const v=mod(t*.8);
      D.round(c,r.x-2,r.y-2,r.w+4,r.h+4,6,null,GREEN);D.round(c,r.x-2-5*v,r.y-2-5*v,r.w+4+10*v,r.h+4+10*v,6+4*v,null,rgba(GREEN,.9*(1-v)));
      lead(c,r.x+r.w,r.y+r.h/2,q[0]-10,q[1]-6,t,GREEN);push(rects,ma,'card',CARDM);});}
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);
  statement(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const fw=measure(c,T.foot,22);text(c,T.foot,16,592,22,MUTED,'left');push(rects,1,'foot',{x:16,y:574,w:fw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── background: the top view and the two close-ups, with cut-in / cut-out moves (never a crossfade between them) ──
function scene(c,M,k,st,moving,x,u,t,rects){
  const nowPic=picOf(k),oldPic=moving?picOf(st.from):nowPic;
  if(!moving||(!nowPic&&!oldPic)){                         // held, or top view to top view (same picture)
    if(!nowPic){blitMap(c,M,WIN,12);return;}
    drawPic(c,nowPic,WIN);cardFrame(c,M,CARDM);return;}
  if(!oldPic&&nowPic){                                      // top view -> close-up: map shrinks to the card, picture grows out of its spot
    const mr=lerpR(WIN,CARDM,u);blitMap(c,M,mr,mix(12,10,u));
    drawPic(c,nowPic,lerpR(spotRect(k,mr),WIN,u),clamp(x*4),mix(4,12,u));
    cardFrame(c,M,CARDM,clamp((x-.7)/.3));return;}
  if(oldPic&&!nowPic){                                      // close-up -> top view: picture shrinks into its spot, card grows to the window
    const mr=lerpR(CARDM,WIN,u);blitMap(c,M,mr,mix(10,12,u));
    drawPic(c,oldPic,lerpR(WIN,spotRect(st.from,mr),u),1-clamp((x-.6)/.4),mix(12,4,u));
    withA(c,1-clamp(x/.3),()=>{D.round(c,mr.x,mr.y,mr.w,mr.h,10,null,WHITE);});return;}
  // close-up -> other close-up: the old one shrinks into its spot in the card, the new one grows out of its own spot
  c.fillStyle='#16332b';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  cardFrame(c,M,CARDM);
  if(x<.5){const f=smooth(x*2);drawPic(c,oldPic,lerpR(WIN,spotRect(st.from,CARDM),f),1-clamp((x-.35)/.15),mix(12,4,f));}
  else{const f=smooth(x*2-1);drawPic(c,nowPic,lerpR(spotRect(k,CARDM),WIN,f),clamp((x-.5)/.1),mix(4,12,f));cardFrame(c,M,CARDM,clamp((x-.85)/.15));}
}

// 0: recap of fragment (forest cut by the road; cat at the roadside)
function step0(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const G=([xx,yy])=>[WIN.x+xx,WIN.y+yy];
  withA(c,clamp((q-.3)/.4),()=>{const r=tag(c,T.forest,WIN.x+95,WIN.y+BY+62,{al:'center',col:GREEN});push(rects,a,'forest',r);});
  withA(c,clamp((q-.7)/.4),()=>{const yy=372,rx=roadX(yy),r=tag(c,T.road,WIN.x+rx-ROADW/2-8,WIN.y+yy-20,{al:'right',col:WHITE});push(rects,a,'road',r);if(q>.9&&q<4)ring(c,r,t,WHITE);});
  // home range circle (cyan dashed, as fragment), crossing the road
  withA(c,clamp((q-1.1)/.5),()=>{const [gx,gy]=G(C0);c.save();c.setLineDash([12,8]);c.lineDashOffset=-t*14;c.lineWidth=4;c.strokeStyle=CYAN;c.shadowColor=rgba(CYAN,.7);c.shadowBlur=8;
    c.beginPath();c.arc(gx,gy,R,0,Math.PI*2);c.stroke();c.restore();circle(c,gx,gy,5,CYAN,INK,2);
    const r=tag(c,T.range,gx,gy-R-50,{al:'center',col:CYAN});push(rects,a,'range',r);});
  // the cat at the roadside (right of the road), facing the road; it breathes
  withA(c,clamp((q-1.6)/.5),()=>{const y=118,rx=roadX(y),cw=96,cx=WIN.x+rx+ROADW/2+cw/2+10,cy=WIN.y+y+1.2*Math.sin(t*1.8);
    const cr=cat(c,STAND,cx,cy,cw*.9);push(rects,a,'catPic',cr);
    const r=tag(c,T.cat,cx+6,cr.y+cr.h+6,{al:'center',col:WHITE});push(rects,a,'cat',r);s_dbg.cat0=cr;});
});}

// 1: overpass close-up (CV6a)
function step1(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  withA(c,clamp((q-1.6)/.5),()=>{K.sline(c,A_PATH,rgba(INK,.55),8);K.dashed(c,A_PATH,GREEN,3.5,[12,8],-t*16);
    for(let i=0;i<3;i++){const pt=along(A_PATH,mod(t*.18+i/3));K.glow(c,pt[0],pt[1],12,GREEN,.85);}});
  const cr=withA2(c,clamp((q-2.2)/.5),()=>walker(c,A_PATH,q-2.2,6.4,58,1));
  if(cr)push(rects,1,'catA',cr);
  withA(c,clamp((q-1.2)/.4),()=>{const r=tag(c,T.over,WIN.x+WIN.w-12,WIN.y+56,{al:'right',col:GREEN});lead(c,r.x+r.w/2,r.y+r.h,A_DECK[0]+40,A_DECK[1]-14,t,GREEN);
    push(rects,a,'over',r);if(q>1.4&&q<4.6)ring(c,r,t,GREEN);});
  withA(c,clamp((q-2.8)/.4),()=>{const r=tag(c,T.road,A_ROAD[0]-150,A_ROAD[1]+30,{al:'center',col:WHITE});lead(c,r.x+r.w,r.y+r.h/2,A_ROAD[0]-8,A_ROAD[1]+4,t);push(rects,a,'roadA',r);});
});}
// withA that returns the callback's value
function withA2(c,a,fn){if(a<=0.002)return null;c.save();c.globalAlpha*=Math.min(1,a);const r=fn();c.restore();return r;}

// 2: culvert close-up (CV6b)
function step2(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  withA(c,clamp((q-1.6)/.5),()=>{K.dashed(c,B_PATH,rgba(INK,.6),7,[12,8],-t*16);K.dashed(c,B_PATH,GREEN,3.5,[12,8],-t*16);
    for(let i=0;i<3;i++){const pt=along(B_PATH,mod(t*.18+i/3));K.glow(c,pt[0],pt[1],12,GREEN,.8);}});
  const cr=withA2(c,clamp((q-2)/.5),()=>walker(c,B_PATH,q-2,6.4,92,1));
  if(cr)push(rects,1,'catB',cr);
  withA(c,clamp((q-1)/.4),()=>{const r=tag(c,T.road,B_ROAD[0]+150,WIN.y+12,{al:'left',col:WHITE});lead(c,r.x,r.y+r.h/2,B_ROAD[0]+70,B_ROAD[1]-2,t);push(rects,a,'roadB',r);});
  withA(c,clamp((q-1.3)/.4),()=>{const r=tag(c,T.culvert,WIN.x+WIN.w-12,WIN.y+132,{al:'right',col:GREEN});lead(c,r.x+r.w/2,r.y+r.h,B_TUN[0]+20,B_TUN[1]-10,t,GREEN);
    push(rects,a,'culvert',r);if(q>1.5&&q<4.6)ring(c,r,t,GREEN);});
  withA(c,clamp((q-4)/.5),()=>{const r=box(c,T.design,WIN.x+WIN.w/2,WIN.y+WIN.h-62,{maxW:560,al:'center',stroke:WHITE});push(rects,a,'design',r);if(q>4.3&&q<7.5)ring(c,r,t,WHITE);});
});}

// 3: where it leads (top view again, both crossings)
function step3(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const G=([xx,yy])=>[WIN.x+xx,WIN.y+yy];
  // green glows at both ends of the overpass (vegetated entrances in the forest)
  const ea=clamp((q-1.2)/.5),eL=G(CA.end(-OVL/2-14)),eR=G(CA.end(OVL/2+14));
  withA(c,ea,()=>[eL,eR].forEach((e,i)=>{const v=mod(t*.7+i*.5);K.glow(c,e[0],e[1],30,GREEN,.55+.2*Math.sin(t*2+i));circle(c,e[0],e[1],14+16*v,null,rgba(GREEN,.9*(1-v)),3);}));
  withA(c,clamp((q-1.4)/.4),()=>{const r=tag(c,T.veg,eL[0]-20,eL[1]+34,{al:'center',col:GREEN});push(rects,a,'veg',r);});
  // a cat crosses the overpass, left forest -> right forest
  const path=[G(CA.end(-OVL/2-40)),G(CA.end(OVL/2+40))];
  const cr=withA2(c,clamp((q-2)/.5),()=>walker(c,path,q-2,6.4,64,1,{feet:false}));if(cr)push(rects,1,'cat3',cr);
  withA(c,clamp((q-2.4)/.4),()=>{const r=tag(c,T.toForest,eR[0]+30,eR[1]-74,{al:'center',col:GREEN});push(rects,a,'toForest',r);});
  // the culvert's exit now opens onto farmland
  const xo=G(CB.end(52));
  withA(c,clamp((q-3.4)/.5),()=>{const v=mod(t*.8);circle(c,xo[0],xo[1],12+18*v,null,rgba(ORANGE,.9*(1-v)),3.5);circle(c,xo[0],xo[1],9,null,ORANGE,3);
    const r=tag(c,T.toFarm,xo[0]+40,xo[1]+30,{al:'center',col:ORANGE});lead(c,r.x+24,r.y,xo[0]+6,xo[1]+8,t,ORANGE);push(rects,a,'toFarm',r);if(q>3.6&&q<6.5)ring(c,r,t,ORANGE);});
  withA(c,clamp((q-4.4)/.4),()=>{const r=tag(c,T.where,WIN.x+WIN.w/2+60,WIN.y+10,{al:'center',col:WHITE});push(rects,a,'where',r);if(q>4.6&&q<8)ring(c,r,t,WHITE);});
});}

// ── statement under the window ───────────────────────────────────────────
function statement(c,k,st,moving,x,tau,t,rects){
  const cx=WIN.x+WIN.w/2,SY=WIN.y+WIN.h+12,sd=[2.2,3.4,3.2,5];
  const one=(kk,a,live)=>withA(c,a,()=>{
    const qa=live?clamp((tau-sd[kk])/.5):1;
    withA(c,qa,()=>{const b=box(c,T.st[kk],cx,SY,{maxW:WIN.w,al:'center',stroke:kk===3?ORANGE:kk===0?WHITE:GREEN,col:WHITE});
      if(live){push(rects,qa*a,'say',b);s_dbg.bottom=b.y+b.h;if(tau>sd[kk]+.5&&tau<sd[kk]+4)ring(c,b,t,kk===3?ORANGE:kk===0?WHITE:GREEN);}});});
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='range'){c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*10;circle(c,ax,ay,13,null,CYAN,3);c.restore();}
  else if(kind==='road'){K.sline(c,[[x+2,ay],[x+40,ay]],'#3f4a45',14);c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*8;K.sline(c,[[x+2,ay],[x+40,ay]],WHITE,2);c.restore();}
  else if(kind==='bridge'){K.sline(c,[[ax,ay-14],[ax,ay+14]],'#3f4a45',12);D.round(c,x+2,ay-8,38,16,5,rgba(GREEN,.35+.25*pul),GREEN);}
  else if(kind==='culvert'){K.sline(c,[[ax,ay-14],[ax,ay+14]],'#3f4a45',12);K.dashed(c,[[x+2,ay],[x+40,ay]],GREEN,3.5,[7,5],-t*10);}
  else if(kind==='mini'){D.round(c,x+2,y+3,40,27,5,'#2f5d3a',WHITE);const v=mod(t*.8);D.round(c,x+14,y+10,16,12,3,null,rgba(GREEN,1));D.round(c,x+14-3*v,y+10-3*v,16+6*v,12+6*v,3,null,rgba(GREEN,1-v));}
  else if(kind==='green'){K.glow(c,ax,ay,16,GREEN,.5+.3*pul);circle(c,ax,ay,8,null,GREEN,3);}
  else if(kind==='orange'){const v=mod(t*.8);circle(c,ax,ay,6+10*v,null,rgba(ORANGE,1-v),3);circle(c,ax,ay,7,null,ORANGE,3);}}
const tlines=(c,p,w)=>/[一-鿿]/.test(D.tr(p))?blines(c,p,w):greedyBal(c,D.tr(p),w);
const twrap=(c,p,x,y,w)=>{const r=tlines(c,p,w);r.forEach((q,i)=>text(c,q,x,y+i*28,22,WHITE,'left'));return r.length*28;};
function card(c,k,st,moving,x,u,tau,t,rects){
  const Rc=CARD,ix=Rc.x+16,iw=Rc.w-32;
  D.round(c,Rc.x,Rc.y,Rc.w,Rc.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,Rc.y+14,{maxW:iw,stroke:GREEN});push(rects,1,'tab',hr);
  let y=Rc.y+14+hr.h+12;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=10;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+19,rows=blines(c,p,iw-42),hh=Math.max(38,38+(rows.length-1)*LH);
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh+2;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=14;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>twrap(c,T.names[st.from],ix,ty,iw));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=tlines(c,T.names[k],iw).length*28;withA(c,na,()=>twrap(c,T.names[k],ix,ty,iw));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=T.leg[k],lhs=legs.map(([,p])=>Math.max(50,blines(c,p,iw-54).length*27+12));
  const ly=Rc.y+Rc.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+4,t);
    const h=bwrap(c,p,ix+54,yy+22,iw-54,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+54,y:yy+2,w:iw-54,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.corridor=draw;
window.EnvironmentDraw.corridor.dbg=s_dbg;
})();

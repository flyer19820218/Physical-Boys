/* Unit 11 lesson 2 · "fragment" canvas (habitat-fragmentation tab, view 1), 2026-10-25. A leopard cat's home does not fit (plan section 3).
 * Five steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (dashes march, the forest edge breathes,
 * name pills ring, the circle keeps touring the patches in step 3, the cat walk cycle repeats in step 4, barriers pulse in step 5).
 * Layout as edge: left = top view window WIN (x 16..636, y 16..436) + one statement box under it; right = step card (x 652..944).
 * Top view: TH1b farmland (darkened) fills the window; the forest TH1a is cut to a soft-edged blob (offscreen canvas, feathered mask
 * from a shadow-blurred fill, then 'source-in' with the forest picture). Road and farmland strips are cut out of it with feathered
 * 'destination-out' strokes (same shadow trick), so the farmland picture shows through.
 *  0 intact forest: cyan dashed circle "Home range" (species colour) lies wholly in the forest; pills "Forest", "Farmland".
 *  1 a road (grey band, white centre dashes) grows from top to bottom through the circle; the forest splits in two.
 *  2 three farmland strips with small house roofs spread from the edges to the road; the forest becomes small patches. The circle
 *    turns orange and tours the best spot of every patch (largest inscribed circle from a distance transform); the part of the
 *    circle that falls outside the forest is shaded orange. Geometry check: every patch's inscribed radius < circle radius (dbg.fit).
 *  3 a leopard cat (TH2 walk, facing left) walks to the roadside, stops (TH2 stand), an orange "Danger" pulse rises on the road,
 *    then it turns (mirrored) and walks back. A white dashed arrow "To the other side" shows where it wanted to go. No traffic, no injury.
 *  4 each patch keeps one or two small standing cats ("A few individuals"); dashed links between neighbouring patches are broken by
 *    pulsing orange bars at the road / farmland ("Hard to meet"). Statement box + green bridge line to the next lesson.
 * Colours (plan 1.4): species / home range cyan #55e9ff; pressure (farmland and houses, danger, circle that does not fit) orange
 * #fb923c; forest green #4ade80. No distances, no species lists; the cat only stands for the idea.
 * Pictures: environment_ai_1024/TH1a_forest_top.jpg, TH1b_farmland_top.jpg (1672x933, centre crop to 620x420);
 * TH2_leopard_cat_walk.png (1198x562), TH2_leopard_cat_stand.png (1122x701): tight transparent crops (alpha>10 box = whole picture),
 * both face left, so the head is the left end of the picture.
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=5,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,GREEN=K.COL.ecosystem,ORANGE=K.COL.pressure,CYAN=K.COL.species,INK=C.ink;
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const FOREST=ENV+'TH1a_forest_top.jpg',FARM=ENV+'TH1b_farmland_top.jpg',WALK=ENV+'TH2_leopard_cat_walk.png',STAND=ENV+'TH2_leopard_cat_stand.png';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('石虎的家裝不下',`A leopard cat's home does not fit`),
 short:[P('完整的森林','An intact forest'),P('一條路切過','A road cuts through'),P('再被切碎','Cut into pieces'),P('想去對面','Trying to cross'),P('空間不夠','Not enough space')],
 names:[P('石虎的活動範圍落在森林裡',`The leopard cat's home range lies inside the forest`),P('一條路切過：活動範圍跨過路','A road cuts through: the home range crosses it'),P('沒有任何一塊裝得下整個活動範圍','No single patch holds the whole home range'),P('走到路邊，停，退回','Walks to the roadside, stops, turns back'),P('只保住一隻不夠','Saving one animal is not enough')],
 range:P('活動範圍','Home range'),
 forest:P('森林','Forest'),
 farm:P('農地','Farmland'),
 farmHouse:P('農地與房舍','Farmland and houses'),
 road:P('道路','Road'),
 patch:P('小塊森林','Small patch'),
 cat:P('石虎','Leopard cat'),
 other:P('想去對面','To the other side'),
 danger:P('危險','Danger'),
 few:P('少數個體','A few individuals'),
 meet:P('不容易交流','Hard to meet'),
 st0:P('虛線圓完全落在森林裡','The dashed circle lies wholly inside the forest'),
 st1:P('森林分成兩塊，虛線圓跨過了路','The forest splits in two; the dashed circle crosses the road'),
 st2:P('每一塊都試過：虛線圓總有一部分超出森林','Every patch tried: part of the circle always falls outside the forest'),
 st3:P('移動、覓食、繁殖、躲避危險都受影響','Moving, feeding, breeding and avoiding danger are all affected'),
 st4:P('只保住一隻不夠，要保住牠需要的空間','Saving one animal is not enough; the space it needs must be kept too'),
 bridge:P('怎麼讓兩塊連起來？下一課','How can the pieces be joined? Next lesson'),
 note:P('石虎圖示、範圍與森林形狀都是示意','Cat icons, range and forest shapes are schematic'),
 legRange:P('青虛線圓：活動範圍','Cyan dashed circle: home range'),
 legForest:P('綠：森林','Green: forest'),
 legRoad:P('灰帶：道路','Grey band: road'),
 legNoFit:P('橘虛線圓：裝不下','Orange circle: does not fit'),
 legOut:P('橘色：超出森林的部分','Orange: outside the forest'),
 legDanger:P('橘色脈衝：危險','Orange pulse: danger'),
 legWant:P('白虛線：想走的路','Dashed arrow: the way it wanted'),
 legFew:P('小石虎：少數個體','Small cats: a few individuals'),
 legBar:P('橘短線：不容易交流','Orange bars: hard to meet')
};

// ── geometry (window-local px) ───────────────────────────────────────────
const WIN={x:16,y:16,w:620,h:412};
const IW=1672,IH=933,CROPW=IH*WIN.w/WIN.h,CROP=[(IW-CROPW)/2/IW,0,CROPW/IW,1];
const CARD={x:652,y:16,w:292,h:550};
const BX=310,BY=210,BRX=286,BRY=192,NB=180;           // forest blob
const C0=[300,210],R=110;                               // home range circle (window-local)
const ROADW=26,RP=[[352,-20],[262,210],[302,445]];      // road: quadratic bezier
// farmland strips spreading from the forest edge to the road (polyline, width)
const STRIPS=[
 {pts:[[-30,214],[70,200],[160,222],[240,204],[300,214]],w:52,from:0},
 {pts:[[650,150],[560,138],[470,158],[380,140],[300,152]],w:52,from:1},
 {pts:[[650,296],[560,312],[470,290],[380,308],[300,298]],w:50,from:1}];
const HOUSES=[[0,.30,.3],[0,.55,-.4],[0,.78,.2],[1,.22,.5],[1,.48,-.2],[2,.30,-.3],[2,.62,.4]];   // strip, position along, angle

function blob(){const pts=[];for(let i=0;i<NB;i++){const a=i/NB*Math.PI*2,r=1+.04*Math.sin(3*a+.9)+.03*Math.sin(5*a+2.4)+.015*Math.sin(11*a+.3);
  pts.push([BX+BRX*r*Math.cos(a),BY+BRY*r*Math.sin(a)]);}return pts;}
const BLOB=blob();
const qb=(u)=>{const [a,b,c]=RP,v=1-u;return[v*v*a[0]+2*v*u*b[0]+u*u*c[0],v*v*a[1]+2*v*u*b[1]+u*u*c[1]];};
const ROAD=[];for(let i=0;i<=60;i++)ROAD.push(qb(i/60));
function roadX(y){let best=ROAD[0],bd=1e9;for(let i=0;i<=200;i++){const q=qb(i/200),d=Math.abs(q[1]-y);if(d<bd){bd=d;best=q;}}return best[0];}
// part of a polyline (0..1 of its length), starting at its first point
function partial(pts,f){if(f>=1)return pts;if(f<=0)return[pts[0]];const seg=[];let tot=0;for(let i=1;i<pts.length;i++)tot+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  let left=tot*f;const out=[pts[0]];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(left>=l){out.push(b);left-=l;}else{out.push([mix(a[0],b[0],left/l),mix(a[1],b[1],left/l)]);break;}}return out;}
function along(pts,f){const p=partial(pts,f);return p[p.length-1];}
function pathPoly(g,pts,ox=0,oy=0,close=true){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x+ox,y+oy):g.moveTo(x+ox,y+oy));if(close)g.closePath();}
// cut shapes for road progress r and expansion e
function cuts(g,r,e,ox=0,oy=0){
  g.lineCap='round';g.lineJoin='round';
  if(r>0){pathPoly(g,partial(ROAD,r),ox,oy,false);g.lineWidth=ROADW;g.stroke();}
  if(e>0)STRIPS.forEach(s=>{pathPoly(g,partial(s.pts,e),ox,oy,false);g.lineWidth=s.w*mix(.5,1,e);g.stroke();});}

// ── offscreen canvases ───────────────────────────────────────────────────
const OFFS={};
function off(name,w,h){let o=OFFS[name];if(!o||o.width!==w||o.height!==h){o=document.createElement('canvas');o.width=w;o.height=h;OFFS[name]=o;
  o.g=o.getContext('2d',name==='mask'?{willReadFrequently:true}:undefined);}o.g.setTransform(1,0,0,1,0,0);o.g.globalCompositeOperation='source-over';o.g.clearRect(0,0,w,h);return o;}

// ── geometry check: patches of the final map and their largest inscribed circle (half-size binary mask) ──
const MS=.5,GEO={};
function geo(){if(GEO.ok)return GEO;
  const w=Math.round(WIN.w*MS),h=Math.round(WIN.h*MS),o=off('mask',w,h),g=o.g;g.setTransform(MS,0,0,MS,0,0);
  pathPoly(g,BLOB);g.fillStyle='#fff';g.fill();g.globalCompositeOperation='destination-out';g.strokeStyle='#fff';cuts(g,1,1);
  const d=g.getImageData(0,0,w,h).data,inF=new Uint8Array(w*h);for(let i=0;i<w*h;i++)inF[i]=d[i*4+3]>127?1:0;
  // chamfer distance to the nearest non-forest pixel (outside of the window counts as non-forest)
  const INF=1e9,dist=new Float32Array(w*h),a=1,b=Math.SQRT2;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!inF[i]){dist[i]=0;continue;}
    let v=Math.min(x+1,y+1);if(y>0){v=Math.min(v,dist[i-w]+a);if(x>0)v=Math.min(v,dist[i-w-1]+b);if(x<w-1)v=Math.min(v,dist[i-w+1]+b);}if(x>0)v=Math.min(v,dist[i-1]+a);dist[i]=v;}
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(!inF[i])continue;let v=Math.min(dist[i],w-x,h-y);
    if(y<h-1){v=Math.min(v,dist[i+w]+a);if(x<w-1)v=Math.min(v,dist[i+w+1]+b);if(x>0)v=Math.min(v,dist[i+w-1]+b);}if(x<w-1)v=Math.min(v,dist[i+1]+a);dist[i]=v;}
  // connected patches
  const lab=new Int32Array(w*h).fill(-1),patches=[];
  for(let i=0;i<w*h;i++){if(!inF[i]||lab[i]>=0)continue;const id=patches.length,st=[i];lab[i]=id;let n=0,sx=0,sy=0,best=0,bi=i;
    while(st.length){const j=st.pop(),x=j%w,y=(j/w)|0;n++;sx+=x;sy+=y;if(dist[j]>best){best=dist[j];bi=j;}
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const k=Y*w+X;if(inF[k]&&lab[k]<0){lab[k]=id;st.push(k);}}}
    patches.push({n,cx:(bi%w)/MS,cy:((bi/w)|0)/MS,r:best/MS,mx:sx/n/MS,my:sy/n/MS});}
  GEO.patches=patches.filter(p=>p.n>400).sort((p,q)=>q.r-p.r);
  GEO.maxR=Math.max(...GEO.patches.map(p=>p.r));GEO.fit=GEO.maxR<R;GEO.ok=true;
  // which side of the road each patch is on
  GEO.patches.forEach(p=>{p.side=p.cx<roadX(p.cy)?'L':'R';});
  return GEO;}

// ── helpers (as in edge) ─────────────────────────────────────────────────
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
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22}={}){
  const w=tagW(c,p,size),h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  D.round(c,bx,y,w,h,h/2,FILL,rgba(col,.95));text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
// keep a centred pill inside the window
function tagIn(c,p,x,y,o={}){const w=tagW(c,p),h=40,xx=Math.max(WIN.x+6+w/2,Math.min(WIN.x+WIN.w-6-w/2,x)),yy=Math.max(WIN.y+6,Math.min(WIN.y+WIN.h-6-h,y));return tag(c,p,xx,yy,Object.assign({al:'center'},o));}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};

// ── pieces ───────────────────────────────────────────────────────────────
// cat picture centred at (x, y) (window-global), facing left unless flip
function cat(c,file,x,y,w,flip=false,a=1){withA(c,a,()=>{const [W,H]=K.SIZE[file]||[1198,562],h=w*H/W;
  c.save();c.shadowColor='rgba(11,26,21,.8)';c.shadowBlur=6;K.drawIn(c,file,{x:x-w/2,y:y-h/2,w,h},{flip});c.restore();});
  const [W,H]=K.SIZE[file]||[1198,562];return{x:x-w/2,y:y-w*H/W/2,w,h:w*H/W};}
function house(c,x,y,ang,s=1){c.save();c.translate(x,y);c.rotate(ang);c.scale(s,s);
  D.round(c,-11,-8,22,16,2,'#d8d0bf','#6b5d4a');K.sline(c,[[-11,0],[11,0]],'#8a7a63',2);c.restore();}
function homeRange(c,x,y,o,t,a=1){withA(c,a,()=>{c.save();c.setLineDash([12,8]);c.lineDashOffset=-t*14;c.lineWidth=4;
  if(o<1){c.strokeStyle=rgba(CYAN,1-o);c.shadowColor=rgba(CYAN,.7);c.shadowBlur=8;c.beginPath();c.arc(x,y,R,0,Math.PI*2);c.stroke();}
  if(o>0){c.strokeStyle=rgba(ORANGE,o);c.shadowColor=rgba(ORANGE,.7);c.shadowBlur=8;c.beginPath();c.arc(x,y,R,0,Math.PI*2);c.stroke();}
  c.restore();circle(c,x,y,5,o>.5?ORANGE:CYAN,INK,2);});}

// ── top view ─────────────────────────────────────────────────────────────
// p: {r road 0..1, e expansion 0..1}; returns the forest canvas (window-local, scaled by sx) for later masking
function topView(c,p,t,feather){
  const m=c.getTransform(),sx=Math.max(1,Math.hypot(m.a,m.b)),W=Math.ceil(WIN.w*sx),H=Math.ceil(WIN.h*sx);
  c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();
  K.drawIn(c,FARM,WIN,{crop:CROP});
  c.fillStyle='rgba(11,26,21,.30)';c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);
  let F=null;const im=K.pic(K.src(FOREST));
  if(im){F=off('forest',W,H);const g=F.g,OFF=4000;
    g.setTransform(sx,0,0,sx,0,0);
    g.save();g.shadowColor='#fff';g.shadowBlur=feather*sx;g.shadowOffsetX=OFF*sx;g.translate(-OFF,0);pathPoly(g,BLOB);g.fillStyle='#fff';g.fill();g.restore();
    // cut the road and the strips out with the same feather
    g.save();g.globalCompositeOperation='destination-out';g.shadowColor='#fff';g.shadowBlur=feather*.6*sx;g.shadowOffsetX=OFF*sx;g.translate(-OFF,0);g.strokeStyle='#fff';cuts(g,p.r,p.e,0,0);g.restore();
    g.save();g.globalCompositeOperation='destination-out';g.strokeStyle='#fff';g.setTransform(sx,0,0,sx,0,0);
    // a thinner hard cut keeps the gaps clearly open
    g.lineCap='round';if(p.r>0){pathPoly(g,partial(ROAD,p.r),0,0,false);g.lineWidth=ROADW*.7;g.stroke();}g.restore();
    g.globalCompositeOperation='source-in';g.drawImage(im,CROP[0]*im.naturalWidth,0,CROP[2]*im.naturalWidth,im.naturalHeight,0,0,WIN.w,WIN.h);
    g.globalCompositeOperation='source-over';
    c.drawImage(F,WIN.x,WIN.y,WIN.w,WIN.h);}
  // houses on the strips
  if(p.e>0)HOUSES.forEach(([si,f,ang],i)=>{const s=STRIPS[si];if(p.e<f)return;const q=along(s.pts,f),a=clamp((p.e-f)/.15);
    withA(c,a,()=>house(c,WIN.x+q[0]+((i%2)?6:-6),WIN.y+q[1]+((i%2)?-5:5),ang,1));});
  // road surface
  if(p.r>0){const pr=partial(ROAD,p.r).map(([x,y])=>[WIN.x+x,WIN.y+y]);
    K.sline(c,pr,'#3f4a45',ROADW-6);c.save();c.setLineDash([12,12]);c.lineDashOffset=0;K.sline(c,pr,rgba(WHITE,.8),2.5);c.restore();
    K.sline(c,pr,'rgba(0,0,0,0)',1);}
  c.restore();
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);
  return F;}

// part of the circle outside the forest, shaded orange
function overflow(c,F,x,y,a,t){if(!F||a<=0)return;const m=c.getTransform(),sx=Math.max(1,Math.hypot(m.a,m.b)),W=Math.ceil(WIN.w*sx),H=Math.ceil(WIN.h*sx);
  const O=off('over',W,H),g=O.g;g.setTransform(sx,0,0,sx,0,0);g.beginPath();g.arc(x-WIN.x,y-WIN.y,R,0,Math.PI*2);g.fillStyle=ORANGE;g.fill();
  g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-out';g.drawImage(F,0,0);g.globalCompositeOperation='source-over';
  withA(c,a*(.5+.08*Math.sin(t*3)),()=>{c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();c.drawImage(O,WIN.x,WIN.y,WIN.w,WIN.h);c.restore();});}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function target(k,tau,from){
  if(k===0)return{r:0,e:0};
  if(k===1)return{r:from>=1?1:ease(clamp((tau-.6)/2.2)),e:0};
  return{r:1,e:k===2&&from<2?ease(clamp((tau-.4)/2.4)):1};}
const TOUR0=3.2,DWELL=1.25;                // step 3: tour starts after the strips have grown
function circleAt(k,tau,G){
  if(k!==2||tau<TOUR0)return C0;
  const ps=G.patches.slice(0,5),n=ps.length,q=(tau-TOUR0)/DWELL,i=Math.floor(q),f=q-i;
  const P0=i===0?C0:[ps[(i-1)%n].cx,ps[(i-1)%n].cy],P1=[ps[i%n].cx,ps[i%n].cy],u=smooth(clamp(f/.45));
  return[mix(P0[0],P1[0],u),mix(P0[1],P1[1],u)];}
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.fragSt||(s.fragSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;st.cur=target(k,9,9);st.fromP=st.cur;st.cpos=C0;st.fromC=C0;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.fromP=st.cur;st.fromC=st.cpos;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.fromP=st.cur;st.fromC=st.cpos;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const G=geo();s_dbg.geo={maxR:G.maxR,R,fit:G.fit,patches:G.patches.map(p=>({x:Math.round(p.cx),y:Math.round(p.cy),r:Math.round(p.r),side:p.side}))};

  // map parameters
  let p=target(k,tau,st.from);
  if(moving&&st.fromP)p={r:mix(st.fromP.r,p.r,u),e:mix(st.fromP.e,p.e,u)};
  st.cur=p;s_dbg.p=p;
  const F=topView(c,p,t,10+3*Math.sin(t*1.5));
  const W0=([xx,yy])=>[WIN.x+xx,WIN.y+yy];

  // circle position and colour
  let cp=circleAt(k,tau,G);if(moving&&st.fromC)cp=[mix(st.fromC[0],cp[0],u),mix(st.fromC[1],cp[1],u)];st.cpos=cp;
  const orT=k<2?(moving&&st.from>=2?1-u:0):k===2?(st.from>=2?1:clamp((tau-2.4)/.6)):1;
  const ringA=k<=2?1:k===3?(moving&&st.from===4?.55*u:.55):(moving&&st.from<=3?.55*(1-u):0);
  const [gx,gy]=W0(cp);
  if(k===2)overflow(c,F,gx,gy,clamp((tau-TOUR0-.3)/.5),t);
  homeRange(c,gx,gy,orT,t,ringA);
  s_dbg.circle={x:cp[0],y:cp[1],orange:orT};

  // ── labels on the map ──
  // farmland (top right corner, outside the forest blob)
  const farmLab=k>=2?T.farmHouse:T.farm,fr=tag(c,farmLab,WIN.x+WIN.w-10,WIN.y+10,{al:'right',col:ORANGE});push(rects,1,'farm',fr);
  if(k===2&&tau>.4&&tau<3)ring(c,fr,t,ORANGE);
  // home range name, above the circle
  withA(c,ringA,()=>{const r=tagIn(c,T.range,gx,gy-R-50,{col:orT>.5?ORANGE:CYAN});push(rects,ringA,'range',r);if(k===0)ring(c,r,t,CYAN);});
  // forest (steps 0..1), on the left part of the forest
  const fa=k<=1?(moving&&st.from>=2?u:1):(moving&&st.from<=1?1-u:0);
  withA(c,fa,()=>{const r=tag(c,T.forest,WIN.x+95,WIN.y+BY+62,{al:'center',col:GREEN});push(rects,fa,'forest',r);});
  // road (steps 1..), right of the road near the bottom
  if(k>=1){const ra=k===1?clamp((tau-2.4)/.5):1,yy=372,rx=roadX(yy);
    withA(c,ra,()=>{const r=tag(c,T.road,WIN.x+rx-ROADW/2-8,WIN.y+yy-20,{al:'right',col:WHITE});push(rects,ra,'road',r);if(k===1&&tau<5)ring(c,r,t,WHITE);});}
  // small patch name (step 2), on the biggest left patch
  if(k===2){const pa=clamp((tau-2.6)/.5),q=G.patches.find(q=>q.side==='L')||G.patches[0];
    withA(c,pa,()=>{const r=tag(c,T.patch,WIN.x+q.mx,WIN.y+q.my+R*.05+28,{al:'center',col:GREEN});push(rects,pa,'patch',r);});}

  // ── step 4: one cat tries to cross ──
  if(k===3)crossing(c,tau,t,G,rects,moving?u:1);
  // ── step 5: a few individuals per patch, hard to meet ──
  if(k===4)fewCats(c,tau,t,G,rects,moving?u:1,fr);

  // ── statement under the window ──
  const SAY=[T.st0,T.st1,T.st2,T.st3,T.st4],sd=[0,2.4,TOUR0,2.6,.6][k],sa=clamp((tau-Math.max(sd,moving?MOVE*.6:0))/.5);
  const SY=WIN.y+WIN.h+12;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>box(c,SAY[st.from],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:[CYAN,WHITE,ORANGE,ORANGE,WHITE][st.from]}));
  withA(c,sa,()=>{const q=box(c,SAY[k],WIN.x+WIN.w/2,SY,{maxW:620,al:'center',stroke:[CYAN,WHITE,ORANGE,ORANGE,WHITE][k]});push(rects,sa,'say',q);
    if(k===3&&tau>2.6&&tau<6)ring(c,q,t,ORANGE);
    if(k===4){const ba=clamp((tau-3.2)/.6);withA(c,ba,()=>{const yb=q.y+q.h+10,b=box(c,T.bridge,WIN.x+WIN.w/2,yb,{maxW:620,al:'center',stroke:GREEN,col:GREEN,dash:[8,6],t});push(rects,ba,'bridge',b);s_dbg.bridgeBottom=b.y+b.h;});}});

  // ── step card ──
  card(c,k,st,moving,x,u,tau,t,rects);

  // ── bottom notes ──
  text(c,T.note,16,592,22,MUTED,'left');push(rects,1,'note',{x:16,y:574,w:measure(c,T.note,22),h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),aw=measure(c,ai,22);
  text(c,ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// step 4: walk to the roadside, stop, danger pulse, turn back (cycle of 8.6 s, repeats while held)
const CYC=8.6;
function crossing(c,tau,t,G,rects,a){
  const q=G.patches.filter(p=>p.side==='R').sort((p,q)=>Math.abs(p.cy-210)-Math.abs(q.cy-210))[0]||G.patches[0];
  const y=q.cy,rx=roadX(y),CWD=104,stopX=rx+ROADW/2+CWD/2+6,startX=Math.max(q.cx+50,stopX+120);
  const tt=mod(tau,CYC);let cx,file=WALK,flip=false,bob=0;
  if(tt<.6){cx=startX;file=STAND;}
  else if(tt<2.9){const f=ease((tt-.6)/2.3);cx=mix(startX,stopX,f);bob=Math.abs(Math.sin(tt*9))*2;}
  else if(tt<4.8){cx=stopX;file=STAND;}
  else if(tt<7.1){const f=smooth((tt-4.8)/2.3);cx=mix(stopX,startX,f);flip=true;bob=Math.abs(Math.sin(tt*9))*2;}
  else{cx=startX;file=STAND;flip=true;}
  const gy=WIN.y+y,gx=WIN.x+cx,gr=WIN.x+rx;
  // where it wanted to go: dashed arrow across the road (fades when it stops)
  const wa=a*(tt<.6?clamp(tt/.4):tt<3.4?1:1-clamp((tt-3.4)/.6));
  const tip=WIN.x+rx-ROADW/2-70;
  withA(c,wa,()=>{K.dashed(c,[[gx-CWD/2-6,gy-30],[tip+12,gy-30]],WHITE,3,[10,7],-t*16);K.arrow(c,tip+16,gy-30,tip,gy-30,WHITE,3);
    const r=tag(c,T.other,tip-6,gy-82,{al:'center',col:WHITE});push(rects,wa,'other',r);});
  // danger pulse on the road while it stands at the roadside
  const da=a*(tt>2.9&&tt<5.4?clamp((tt-2.9)/.3)*(1-clamp((tt-5)/.4)):0);
  withA(c,da,()=>{for(let i=0;i<3;i++){const uu=mod(t*.9+i/3);circle(c,gr,gy,12+uu*46,null,rgba(ORANGE,.9*(1-uu)),4);}
    K.glow(c,gr,gy,26,ORANGE,.55);circle(c,gr,gy,9,ORANGE,INK,2);
    const r=tag(c,T.danger,gr-ROADW/2-6,gy+40,{al:'right',col:ORANGE});push(rects,da,'danger',r);});
  const cr=cat(c,file,gx,gy-bob,file===WALK?CWD:CWD*.9,flip,a);push(rects,a,'catX',cr);
  // the cat's name, under it
  withA(c,a,()=>{const r=tag(c,T.cat,gx,gy+cr.h/2+8,{al:'center',col:CYAN});push(rects,a,'cat',r);});
  s_dbg.cross={cx,stopX,roadX:rx,y};
}

// step 5: one or two small cats per patch; broken links between neighbouring patches
function fewCats(c,tau,t,G,rects,a,fr){
  const ps=G.patches.slice(0,5),CW2=62;
  const spots=ps.map((p,i)=>[p.cx,p.cy]);
  // links between patch pairs that are close (neighbours)
  const links=[];for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const d=Math.hypot(ps[i].cx-ps[j].cx,ps[i].cy-ps[j].cy);if(d<300)links.push([i,j,d]);}
  links.sort((p,q)=>p[2]-q[2]);const L3=links.slice(0,5);
  const la=a*clamp((tau-1.4)/.6);
  L3.forEach(([i,j],n)=>{const A=spots[i],B=spots[j],mxp=(A[0]+B[0])/2,myp=(A[1]+B[1])/2,dx=B[0]-A[0],dy=B[1]-A[1],dl=Math.hypot(dx,dy),ux=dx/dl,uy=dy/dl;
    const gap=24,ga=[WIN.x+mxp-ux*gap,WIN.y+myp-uy*gap],gb=[WIN.x+mxp+ux*gap,WIN.y+myp+uy*gap];
    withA(c,la,()=>{K.dashed(c,[[WIN.x+A[0]+ux*36,WIN.y+A[1]+uy*24],ga],rgba(WHITE,.9),3,[8,7],-t*12);K.dashed(c,[gb,[WIN.x+B[0]-ux*36,WIN.y+B[1]-uy*24]],rgba(WHITE,.9),3,[8,7],t*12);
      const pul=.6+.4*Math.sin(t*3+n);c.save();c.translate(WIN.x+mxp,WIN.y+myp);c.rotate(Math.atan2(dy,dx));D.round(c,-4,-14,8,28,3,rgba(ORANGE,pul),INK);c.restore();});});
  // cats: one per patch, a second one in the two biggest patches
  // keep cats clear of the corner pill (nudge down)
  const ch=CW2*701/1122,clear=(x,y,w)=>{const h=w*701/1122;if(fr&&x+w/2>fr.x&&x-w/2<fr.x+fr.w&&y-h/2<fr.y+fr.h+4)return fr.y+fr.h+4+h/2;return y;};
  ps.forEach((p,i)=>{const ca=a*clamp((tau-.2-i*.15)/.5),br=Math.sin(t*1.6+i)*1.2,x1=WIN.x+p.cx,y1=clear(x1,WIN.y+p.cy,CW2);
    const r1=cat(c,STAND,x1,y1+br,CW2,i%2===1,ca);push(rects,ca,'cat'+i,r1);
    if(i<2){const x2=x1+(i?-1:1)*Math.min(62,p.r*.85),y2=y1+14,r2=cat(c,STAND,x2,y2+br,CW2*.85,i%2===0,ca);push(rects,ca,'catb'+i,r2);}});
  // names
  const fa=a*clamp((tau-.9)/.5),q0=ps[0];
  withA(c,fa,()=>{const r=tagIn(c,T.few,WIN.x+q0.cx+Math.min(31,q0.r*.4),WIN.y+q0.cy+44,{col:CYAN});push(rects,fa,'few',r);});
  if(L3.length){const ma=a*clamp((tau-2)/.5);const midY=([i,j])=>(ps[i].cy+ps[j].cy)/2,lk=L3.find(l=>ps[l[0]].side!==ps[l[1]].side&&midY(l)>200&&midY(l)<300)||L3.find(([i,j])=>ps[i].side!==ps[j].side)||L3[0],A=spots[lk[0]],B=spots[lk[1]];
    withA(c,ma,()=>{const r=tag(c,T.meet,WIN.x+(A[0]+B[0])/2+16,WIN.y+(A[1]+B[1])/2+16,{col:ORANGE});push(rects,ma,'meet',r);});}
  s_dbg.links=L3.map(([i,j])=>[i,j]);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['range',T.legRange],['forest',T.legForest]];
  if(k===1)return[['road',T.legRoad],['range',T.legRange]];
  if(k===2)return[['nofit',T.legNoFit],['out',T.legOut]];
  if(k===3)return[['danger',T.legDanger],['want',T.legWant]];
  return[['few',T.legFew],['bar',T.legBar]];}
function legIcon(c,kind,x,y,t,pul){
  if(kind==='range'||kind==='nofit'){c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*10;circle(c,x+20,y+14,13,null,kind==='range'?CYAN:ORANGE,3);c.restore();}
  else if(kind==='forest')D.round(c,x,y,40,28,8,rgba(GREEN,.55+.2*pul),GREEN);
  else if(kind==='road'){K.sline(c,[[x+2,y+14],[x+38,y+14]],'#3f4a45',14);c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*8;K.sline(c,[[x+2,y+14],[x+38,y+14]],WHITE,2);c.restore();}
  else if(kind==='out'){D.round(c,x,y,40,28,6,rgba(ORANGE,.45+.2*pul),ORANGE);}
  else if(kind==='danger'){const uu=mod(t*.9);circle(c,x+20,y+14,6+uu*12,null,rgba(ORANGE,1-uu),3);circle(c,x+20,y+14,6,ORANGE,null);}
  else if(kind==='want'){K.dashed(c,[[x+40,y+14],[x+10,y+14]],WHITE,3,[6,5],-t*10);K.arrow(c,x+12,y+14,x+2,y+14,WHITE,3);}
  else if(kind==='few')cat(c,STAND,x+20,y+14,40);
  else{c.save();c.translate(x+20,y+14);D.round(c,-4,-13,8,26,3,rgba(ORANGE,.6+.4*pul),INK);c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const Rc=CARD,ix=Rc.x+16,iw=Rc.w-32;
  D.round(c,Rc.x,Rc.y,Rc.w,Rc.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,Rc.y+14,{maxW:iw,stroke:CYAN});push(rects,1,'tab',hr);
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
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+10));
  const ly=Rc.y+Rc.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{const pul=.5+.5*Math.sin(t*2+q);
    legIcon(c,kind,ix,yy+4,t,pul);
    const h=bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);push(rects,la,'leg'+q,{x:ix+50,y:yy+4,w:iw-50,h:h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.fragment=draw;
window.EnvironmentDraw.fragment.dbg=s_dbg;
})();

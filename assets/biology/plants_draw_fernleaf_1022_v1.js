/* Plants · "Young to mature frond" canvas (fern tab, view 0), 2026-10-22.
 * Pictures: the teacher's Gemini AI illustrations (plants_ai_1022/), aspect kept, swaying gently about the stem base
 * (drawn in 2 px rows shifted by a wave that grows toward the top, as in plants_draw_vascular_1022_v1.js).
 *  0 coiled young frond: fern_young_1 large on the left, a dashed marker ring (schematic) round the coil, its name and
 *    the FL_TEXT hint (rolled up like a little fist; a clue for ferns; no dots yet).
 *  1 unrolling: fern_young_1 → 2 → 3 cross-fade. All three share one scale and one anchor (the bottom of the stem
 *    base, measured from the PNG alpha), so nothing jumps; it is a cross-fade, never a morph. A three-node progress
 *    bar "young → unrolling → mature" follows the fades, and a note says the three pictures are different fronds
 *    (plants_ai_1022/sources.md, known issue 6). Held on this step the sequence loops (fades back to 1).
 *  2 upper side: fern_young_3, a dashed ring (schematic) glides over the pinnae: "smooth, no dots".
 *  3 underside: a horizontal flip (scale x to 0 and open again) from fern_young_3 to sori_dots, labelled
 *    "underside (another frond)"; pulsing rings on five measured dots (sori), leader lines to two of them,
 *    and the key idea "a young frond with no sori yet is still a fern".
 *  4 two patterns: sori_lines (left, "in lines") and sori_dots (right, "in round dots"), a few lines / dots light up
 *    in turn (schematic markers), no species named; a closing card with a small fern_young_1.
 * Dot centres (sori_dots.png) and line ends (sori_lines.png) were measured once from the PNG (brown blobs, PCA axis).
 * Step changes (0.9 s): a picture shared by both steps (fern_young_3 between 1, 2 and 3) stays and its alphas merge;
 * other pictures and all words are sequenced (old fades out, then new fades in), so nothing is stacked.
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,text,measure,splitLines,circle,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,AI,SIZE,TAU,fitRect,drawIn,arrow}=K;
const LAB=()=>K.LAB||{};
const N=5,PER=8;
const RX=480,RW=450;               // right column
const BROWN='#c98a5a';

// ── pictures and placement ─────────────────────────────────────────────────
// mk(file, stem x in px, bottom of stem in px, canvas x of the stem, canvas y of the stem bottom, scale)
const mk=(f,sx,by,X,Y,k)=>({f,W:SIZE[f][0],H:SIZE[f][1],k,x0:X-sx*k,y0:Y-by*k});
const KY=.42,AX=270,AY=568;        // one scale, one anchor for the three young fronds
const Y1=mk('fern_young_1.png',161.5,1093,AX,AY,KY),Y2=mk('fern_young_2.png',342,1190,AX,AY,KY),Y3=mk('fern_young_3.png',379,1300,AX,AY,KY);
const FCX=Y3.x0+Y3.W*Y3.k/2;      // flip axis (centre of the mature frond)
const BK=(()=>{const f='sori_dots.png',k=.45,[W,H]=SIZE[f];return{f,W,H,k,x0:FCX-W*k/2,y0:AY-1199*k};})();
const box=(f,cx,y,h)=>{const [W,H]=SIZE[f],k=h/H;return{f,W,H,k,x0:cx-W*k/2,y0:y};};
const S4L=box('sori_lines.png',250,62,366),S4D=box('sori_dots.png',700,62,366);
// measured features, image px
const COIL=[219,218],COIL_R=228;
const SCAN=[[250,540],[520,420],[560,640],[300,900],[200,620]];
const DOTS3=[[395,118],[606,281],[304,443],[654,568],[310,734]],LEAD3=[1,3];
const DOTS4=[[304,443],[622,523],[328,674]];
const LINES4=[[[413,267],[376,458]],[[338,502],[146,470]],[[601,537],[548,710]]];

const sway=(L,iy,t)=>{const q=clamp(1-iy/L.H);return 5*q*q*Math.sin(t*1.1-iy/(L.H*.32));};
const ptOf=(L,ix,iy,t,sx=1,cx=FCX)=>[cx+(L.x0+ix*L.k-cx)*sx+sway(L,iy,t)*sx,L.y0+iy*L.k];
function drawPic(c,L,t,a,sx=1,cx=FCX){
  if(a<=0||sx<=.004)return;const im=pic(AI+L.f);
  if(!im){c.save();c.setLineDash([6,6]);D.round(c,L.x0,L.y0,L.W*L.k,L.H*L.k,10,null,rgba(C.muted,.4));c.restore();return;}
  c.save();c.globalAlpha*=a;
  const y0=Math.ceil(L.y0),y1=Math.floor(L.y0+L.H*L.k),w=L.W*L.k*sx;
  for(let y=y0;y<y1;y+=2){const iy=(y-L.y0)/L.k,ih=Math.min(2/L.k,L.H-iy);if(ih<=0)break;
    c.drawImage(im,0,iy,L.W,ih,cx+(L.x0-cx)*sx+sway(L,iy+ih/2,t)*sx,y,w,Math.min(2,ih*L.k));}
  c.restore();
}

// ── text helpers (as in plants_draw_vascular_1022_v1.js) ───────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
function textBlock(c,p,x,y,w,col,{size=22,lh=30,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
// rows ending at baseline yb (grows upward)
function bottomBlock(c,p,x,yb,w,col,{lh=28,align='left'}={}){const rows=rowsOf(c,p,w);rows.forEach((r,i)=>text(c,r,x,yb-(rows.length-1-i)*lh,22,col,align));return rows.length*lh;}
// fitText: a label in a dark rounded box, measured first; one line if it fits in maxW, otherwise wrapped (never shrunk).
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22,dash=null}={}){
  const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW&&!D.tr(p).includes('\n')){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7,h=rows.length*lh+11,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',null);
  c.save();if(dash)c.setLineDash(dash);c.beginPath();c.roundRect(bx,y,w,h,Math.min(h/2,20));c.strokeStyle=active?C.white:rgba(col,.85);c.lineWidth=2;c.stroke();c.restore();
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(col,.9),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
// a dashed marker ring (schematic)
function ring(c,x,y,r,t,a,col=C.yellow){if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,null,rgba(C.deep,.75),6.5);c.setLineDash([7,5]);c.lineDashOffset=-t*14;circle(c,x,y,r,null,col,3);c.restore();c.save();c.globalAlpha*=a;K.pulse(c,x,y,t,col,r);c.restore();}
const aiNote=(c,x,yb,align='left')=>bottomBlock(c,LAB().aiNote||P(`AI 插圖，非實拍`,`AI illustration, not a photo`),x,yb,align==='left'?RW:700,C.muted,{align});
const MARK=P(`黃色虛線圈是加上的標示（示意）`,`Yellow dashed rings are added markers (schematic)`);
function notes(c,mark){aiNote(c,RX,586);if(mark)bottomBlock(c,MARK,RX,550,RW,C.muted);}

// ── step 0: coiled young frond ─────────────────────────────────────────────
function over0(c,a,tau,t){
  if(a<=0)return;const L=LAB();c.save();c.globalAlpha*=a;
  const [cx,cy]=ptOf(Y1,...COIL,t),r=COIL_R*KY,ra=fade(tau,.3,.6);
  glow(c,cx,cy,r*1.25,C.yellow,.10*ra*(.7+.3*Math.sin(t*1.8)));
  ring(c,cx,cy,r,t,ra);
  c.save();c.globalAlpha*=fade(tau,.6,.5);
  const b=fitText(c,L.fiddlehead||P(`捲曲的幼葉`,`Coiled young frond`),RX,40,RW,C.yellow,{active:true});
  const ang=-.55;lead(c,b.x-6,b.y+b.h/2,cx+r*Math.cos(ang),cy+r*Math.sin(ang),C.yellow);
  c.restore();
  c.save();c.globalAlpha*=fade(tau,1.1,.5);
  let y=b.y+b.h+44;
  y+=textBlock(c,P(`蕨類的幼葉捲起來，像一個小拳頭。`,`The young frond of a fern is rolled up like a little fist.`),RX,y,RW,C.white)+10;
  y+=textBlock(c,P(`這個捲曲的樣子，是認出蕨類的線索。`,`This coiled shape is a clue for recognizing ferns.`),RX,y,RW,C.white)+14;
  c.restore();
  c.save();c.globalAlpha*=fade(tau,1.7,.5);
  fitText(c,P(`這時候葉背還沒有小點`,`No dots on the underside yet`),RX,y,RW,C.muted,{dash:[7,5]});
  c.restore();
  notes(c,true);
  c.restore();
}

// ── step 1: unrolling (cross-fade 1 → 2 → 3) ───────────────────────────────
const CYC=9.4;
function unroll(tau,held){
  const q=held?mod(tau,CYC):tau;
  const u12=smooth(clamp((q-1.4)/1.2)),u23=smooth(clamp((q-4.2)/1.2)),back=held?smooth(clamp((q-8.2)/1.2)):0;
  return{a1:(1-u12)+back,a2:u12*(1-u23),a3:u23*(1-back),p:(u12*.5+u23*.5)*(1-back)};
}
const STAGES=()=>{const L=LAB();return[P(`幼葉`,`Young`),L.unrolling||P(`展開中`,`Unrolling`),P(`成熟葉`,`Mature`)];};
function over1(c,a,tau,t,held){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const {p}=unroll(tau,held);
  fitText(c,P(`幼葉慢慢展開`,`The frond unrolls`),RX,40,RW,C.yellow,{active:true});
  // progress bar
  const x0=RX+40,x1=RX+RW-40,by=150,xs=[x0,(x0+x1)/2,x1],px=mix(x0,x1,p);
  c.save();c.lineCap='round';line(c,[[x0,by],[x1,by]],rgba(C.white,.25),8);line(c,[[x0,by],[px,by]],C.green,8);c.restore();
  const st=STAGES();
  xs.forEach((x,i)=>{const on=clamp(1-Math.abs(p-i*.5)/.25);
    circle(c,x,by,13,on>.5?C.green:'#16332b',on>.5?C.white:rgba(C.white,.6),2.5);
    if(on>.5)K.pulse(c,x,by,t,C.green,13);
    text(c,st[i],x,by+48,22,on>.5?C.green:C.muted,'center');});
  glow(c,px,by,22,C.green,.5);circle(c,px,by,6,C.white,null);
  let y=by+100;
  y+=textBlock(c,P(`小羽片從頂端一片一片打開。`,`From the tip, the leaflets open one by one.`),RX,y,RW,C.white)+16;
  fitText(c,P(`三張圖是不同的葉，\n不是同一片葉的連續照片`,`Three different fronds, not one frond photographed over time`),RX,y,RW,C.muted,{dash:[7,5]});
  notes(c,false);
  c.restore();
}

// ── step 2: upper side ─────────────────────────────────────────────────────
function scanAt(t){const n=SCAN.length,q=mod(t*.22,n),i=Math.floor(q),u=smooth(q-i);return K.lerpP(SCAN[i],SCAN[(i+1)%n],u);}
function over2(c,a,tau,t){
  if(a<=0)return;const L=LAB();c.save();c.globalAlpha*=a;
  const [ix,iy]=scanAt(t),[sx,sy]=ptOf(Y3,ix,iy,t),ra=fade(tau,.4,.6);
  ring(c,sx,sy,34,t,ra);
  c.save();c.globalAlpha*=fade(tau,.3,.5);
  const b=fitText(c,L.matureFront||P(`成熟葉正面`,`Mature frond, upper side`),RX,40,RW,C.yellow,{active:true});
  c.restore();
  c.save();c.globalAlpha*=ra;
  const nd=fitText(c,P(`光滑、沒有小點`,`Smooth, no dots`),RX,b.y+b.h+40,RW,C.yellow);
  lead(c,nd.x-6,nd.y+nd.h/2,sx+34,sy,C.yellow);
  c.restore();
  c.save();c.globalAlpha*=fade(tau,1.2,.5);
  let y=nd.y+nd.h+44;
  y+=textBlock(c,P(`成熟葉的正面很光滑，看不到小點。`,`The upper side of a mature frond is smooth, with no dots.`),RX,y,RW,C.white)+12;
  textBlock(c,P(`只看正面，會以為蕨類沒有任何繁殖的構造。`,`Looking only at this side, you might think a fern has nothing for reproduction.`),RX,y,RW,C.muted);
  c.restore();
  notes(c,true);
  c.restore();
}

// ── step 3: flip to the underside of another mature frond ─────────────────
const flipU=tau=>clamp((tau-.9)/1.3);
const flipSx=f=>Math.abs(Math.cos(f*Math.PI));
function over3(c,a,tau,t){
  if(a<=0)return;const L=LAB();c.save();c.globalAlpha*=a;
  const frontA=1-fade(tau,.7,.3),turnA=fade(tau,1,.3)*(1-fade(tau,2.2,.3)),after=fade(tau,2.5,.5);
  if(frontA>0){c.save();c.globalAlpha*=frontA;fitText(c,L.matureFront||P(`成熟葉正面`,`Mature frond, upper side`),RX,40,RW,C.yellow,{active:true});c.restore();}
  if(turnA>0){c.save();c.globalAlpha*=turnA;
    const b=fitText(c,P(`翻到背面`,`Turn it over`),RX,40,RW,C.orange,{active:true});
    // a curved "turn over" arrow (schematic)
    const ax=RX+110,ay=b.y+b.h+60,ph=Math.sin(t*3)*.08;
    c.save();c.strokeStyle=C.orange;c.lineWidth=3.5;c.lineCap='round';c.beginPath();c.ellipse(ax,ay,90,22,0,Math.PI*(1.05+ph),Math.PI*1.95);c.stroke();c.restore();
    const ex=ax+90*Math.cos(Math.PI*1.95),ey=ay+22*Math.sin(Math.PI*1.95);arrow(c,ex-16,ey-4,ex+2,ey+3,C.orange,3.5);
    c.restore();}
  if(after>0){c.save();c.globalAlpha*=after;
    const b=fitText(c,L.matureBack||P(`成熟葉背面（另一片葉）`,`Mature frond, underside (another frond)`),RX,40,RW,C.yellow,{active:true});
    // pulsing rings on measured sori
    DOTS3.forEach(([ix,iy],i)=>{const [x,y]=ptOf(BK,ix,iy,t);ring(c,x,y,15,t+i*.23,fade(tau,2.5+i*.15,.4));});
    const sy=b.y+b.h+62;
    c.save();c.globalAlpha*=fade(tau,3,.5);
    const sp=fitText(c,L.soriPl||P(`孢子囊堆`,`Sori`),RX,sy-28,RW,BROWN);
    LEAD3.forEach(i=>{const [x,y]=ptOf(BK,...DOTS3[i],t);lead(c,sp.x-6,sp.y+sp.h/2,x+16,y,BROWN);});
    let y=sp.y+sp.h+34;
    y+=textBlock(c,P(`一排排咖啡色的小點，\n是許多孢子囊聚在一起。`,`Rows of brown dots: each is many sporangia grouped together.`),RX,y,RW,C.white)+6;
    c.restore();
    c.save();c.globalAlpha*=fade(tau,3.8,.5);
    fitText(c,P(`重點：幼葉還沒長出孢子囊堆，\n不代表它不是蕨`,`Key idea: a young frond with no sori yet is still a fern`),RX,y,RW,C.green);
    c.restore();
    c.restore();}
  notes(c,after>0);
  c.restore();
}

// ── step 4: two patterns ───────────────────────────────────────────────────
function over4(c,a,tau,t){
  if(a<=0)return;const L=LAB();c.save();c.globalAlpha*=a;
  const la=fade(tau,.4,.5);
  c.save();c.globalAlpha*=la;
  fitText(c,L.linear||P(`線形排列`,`In lines`),S4L.x0+S4L.W*S4L.k/2,14,400,C.yellow,{align:'center',active:true});
  fitText(c,L.round||P(`圓點排列`,`In round dots`),S4D.x0+S4D.W*S4D.k/2,14,400,C.yellow,{align:'center',active:true});
  c.restore();
  // markers lighting up in turn (schematic)
  const ma=fade(tau,.9,.6);
  LINES4.forEach(([p0,p1],i)=>{const on=.35+.65*Math.max(0,Math.sin(t*1.6-i*1.1));const A=ptOf(S4L,...p0,t),B=ptOf(S4L,...p1,t);
    c.save();c.globalAlpha*=ma;c.setLineDash([7,5]);c.lineDashOffset=-t*14;K.sline(c,[A,B],rgba(C.yellow,.18*on),14);c.restore();
    c.save();c.globalAlpha*=ma*on;c.lineCap='round';
    const nx=-(B[1]-A[1]),ny=B[0]-A[0],nl=Math.hypot(nx,ny)||1,o=9;
    [1,-1].forEach(sg=>line(c,[[A[0]+sg*nx/nl*o,A[1]+sg*ny/nl*o],[B[0]+sg*nx/nl*o,B[1]+sg*ny/nl*o]],rgba(C.deep,.75),6));
    c.setLineDash([7,5]);c.lineDashOffset=-t*14;
    line(c,[[A[0]+nx/nl*o,A[1]+ny/nl*o],[B[0]+nx/nl*o,B[1]+ny/nl*o]],C.yellow,2.5);line(c,[[A[0]-nx/nl*o,A[1]-ny/nl*o],[B[0]-nx/nl*o,B[1]-ny/nl*o]],C.yellow,2.5);c.restore();});
  DOTS4.forEach(([ix,iy],i)=>{const [x,y]=ptOf(S4D,ix,iy,t);ring(c,x,y,12,t+i*.4,ma);});
  // species note and marker legend
  c.save();c.globalAlpha*=fade(tau,1.3,.5);
  text(c,P(`兩片葉不同，不指定物種・黃色標示是加上的（示意）`,`Two different leaves, species not named · yellow marks are added (schematic)`),480,458,22,C.muted,'center');
  c.restore();
  // closing card
  c.save();c.globalAlpha*=fade(tau,2,.6);
  const msg=P(`幼葉還沒長出孢子囊堆，不代表它不是蕨`,`A young frond with no sori yet is still a fern`);
  const cw=700,cx0=480-cw/2,cy0=476,tw=cw-120,rows=rowsOf(c,msg,tw),ch=Math.max(78,rows.length*30+26);
  D.round(c,cx0,cy0,cw,ch,16,'rgba(11,26,21,.94)',null);
  c.save();c.beginPath();c.roundRect(cx0,cy0,cw,ch,16);c.strokeStyle=C.green;c.lineWidth=3;c.stroke();c.restore();
  const th=ch-14,tr=fitRect('fern_young_1.png',cx0+16,cy0+7,70,th),wob=.04*Math.sin(t*1.4);
  c.save();c.translate(tr.x+tr.w/2,tr.y+tr.h);c.rotate(wob);c.translate(-(tr.x+tr.w/2),-(tr.y+tr.h));drawIn(c,'fern_young_1.png',tr);c.restore();
  rows.forEach((r,i)=>text(c,r,cx0+100,cy0+ch/2+8+(i-(rows.length-1)/2)*30,22,C.green));
  c.restore();
  aiNote(c,480,592,'center');
  c.restore();
}

// ── scenes: pictures (shared ones merge during a cross-fade) + overlay ─────
function scene(j,tau,t,held){
  if(j===0)return{pics:[[Y1,1,1]],over:(c,a)=>over0(c,a,tau,t)};
  if(j===1){const u=unroll(tau,held);return{pics:[[Y1,u.a1,1],[Y2,u.a2,1],[Y3,u.a3,1]],over:(c,a)=>over1(c,a,tau,t,held)};}
  if(j===2)return{pics:[[Y3,1,1]],over:(c,a)=>over2(c,a,tau,t)};
  if(j===3){const f=flipU(tau),sx=flipSx(f);return{pics:f<.5?[[Y3,1,sx]]:[[BK,1,sx]],over:(c,a)=>over3(c,a,tau,t)};}
  return{pics:[[S4L,1,1],[S4D,1,1]],over:(c,a)=>over4(c,a,tau,t)};
}
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.fl||(s.fl={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.fromHeld=st.held;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  const u=smooth((t-st.T)/.9),cross=st.from>=0&&u<1;
  const cur=scene(k,tau,t,held),old=cross?scene(st.from,st.fromTau+(t-st.T),t,st.fromHeld):null;
  st.tau=tau;st.held=held;
  // pictures
  // a picture in both steps keeps showing (alphas merge); the others are sequenced, old out then new in
  const x=clamp((t-st.T)/.9),aOut=1-smooth(clamp(x*2)),aIn=smooth(clamp(x*2-1)),list=[];
  if(old)old.pics.forEach(([L,a,sx])=>list.push({L,a,sx,o:true}));
  cur.pics.forEach(([L,a,sx])=>{const o=list.find(q=>q.L===L);if(o){o.a=o.a*(1-u)+a*u;o.sx=sx;o.o=false;o.sh=true;}else list.push({L,a:old?a*aIn:a,sx});});
  list.forEach(q=>{if(q.o)q.a*=aOut;});
  list.forEach(q=>drawPic(c,q.L,t,Math.min(1,q.a),q.sx,FCX));
  // overlays
  // overlays are sequenced too, so their words never meet
  if(old)old.over(c,aOut);
  cur.over(c,old?aIn:1);
}
window.PlantsDraw.fernleaf=draw;
})();

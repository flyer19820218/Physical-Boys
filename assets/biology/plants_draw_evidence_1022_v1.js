/* Plants · "Five clues" canvas (leaf tab, view 0), 2026-10-22.
 * Every step has the same two columns: left = dicot (cyan #55e9ff), right = monocot (orange #fb923c), with the
 * column headers "Dicots" / "Monocots" on top. Pictures: the teacher's Gemini AI illustrations (plants_ai_1022/),
 * aspect kept, swaying gently. All rings, bright lines, numbers and dashed outlines are added markers (schematic).
 *  0 veins: bodhi_leaf (midrib + four side veins traced, light runs along them) | bamboo_leaves (three lines along
 *    each leaf, running dashes); "midrib", "fine veins join into a net", "veins run side by side"; net / parallel.
 *  1 stem: stem_dicot (dashed circle along the ring of bundles, pulsing rings on bundles, a light runs round) |
 *    stem_monocot (pulsing rings on scattered bundles, lit in turn); ring / scattered. Note "AI drawing: look only at
 *    the arrangement" (PL9 is an AI staining style; no xylem / phloem, no colour is named).
 *  2 seed leaves: peanut_seed (numbers 1, 2 on the two seed leaves; "food in seed leaves", "embryo") | corn_kernel
 *    (number 1 on its one seed leaf; dashed outline of the small embryo at the bottom; "food in the endosperm").
 *  3 roots: dicot_root (taproot traced by a thick bright line; "taproot", "side roots") | monocot_root (dashed outline
 *    of the tuft; "roots of similar thickness"); taproot + side roots / fibrous roots.
 *  4 petals: the coloured petals light up one by one and are counted 1..5, then 1..3 (green sepals of the three-petal
 *    flower are not counted; one sepal gets "sepal, not counted"); 5 petals / 3 petals; then the lit petal cycles.
 *  5 together: a clue board (5 rows × 2 columns, thumbnails + short words), rows light up in order with ticks, then a
 *    yellow card: typical features with exceptions; look at several clues; dicot ≠ woody, monocot ≠ herbaceous.
 * Steps 0–4: a small "clue board" progress strip (5 cells) bottom left; seen clues are lit.
 * Marker points were measured once from the PNGs (alpha and colour). Step changes (0.9 s): old fades out, then new in.
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,sline,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,AI,SIZE,TAU,fitRect}=K;
const LAB=()=>K.LAB||{};
const N=6,PER=10;
const DI=C.cyan,MO=C.orange;
const COL={L:{x:20,w:450,cx:245},R:{x:490,w:450,cx:715}};
const F={bodhi:'bodhi_leaf.png',bamboo:'bamboo_leaves.png',sd:'stem_dicot.png',sm:'stem_monocot.png',pn:'peanut_seed.png',ck:'corn_kernel.png',dr:'dicot_root.png',mr:'monocot_root.png',f5:'flower_5petal.png',f3:'flower_3petal.png'};
const FULL=f=>[0,0,SIZE[f][0],SIZE[f][1]];
const L1=(k,zh,en)=>LAB()[k]||P(zh,en);

// ── measured from the PNGs (image px) ──────────────────────────────────────
const BODHI={mid:[[300,250],[300,400],[298,560],[297,720],[298,880]],
 side:[[[300,700],[252,672],[204,662],[156,644],[108,583],[60,542]],[[300,830],[252,795],[204,789],[156,763],[108,737],[60,701],[20,673]],
  [[300,640],[348,609],[396,573],[444,529],[492,490],[522,487]],[[300,780],[348,752],[396,742],[444,726],[492,700],[540,669],[582,663]]]};
// bamboo leaf axes: x = a + b*(y - 180)
const BAMBOO=[{a:99,b:.498,y0:200,y1:660,off:[-34,0,34]},{a:760,b:-.398,y0:170,y1:640,off:[-30,0,30]}];
const RING={c:[555,555],r:428};
const DIB=[[622,129],[798,193],[957,408],[980,564],[944,726],[860,856],[717,953],[560,984],[399,954],[256,864],[166,735],[127,572],[148,421],[209,303],[309,202],[433,137]];
const MOB=[[378,306],[606,249],[799,498],[289,616],[531,721],[430,515],[781,699],[414,835],[515,396],[863,830],[176,699],[700,153],[238,260],[946,341]];
const PN_PT={cot1:[266,452],cot2:[635,470],food:[600,300],embryo:[445,700]};
const CK_PT={cot:[505,640],endo:[300,330],emb:{c:[495,690],rx:118,ry:200,rot:-.32},embLead:[383,760]};
const TAP=[[283,540],[284,570],[278,600],[286,630],[281,660],[284,690],[282,720],[285,750],[281,780],[293,810],[288,840],[285,870],[284,900],[277,930],[281,960],[285,990],[285,1020],[280,1050],[279,1080],[283,1110],[283,1140]];
const DR_PT={side:[436,700],tap:[284,880]};
const MR_PT={tuft:{c:[300,1065],rx:268,ry:190},lead:[226,1040]};
const FL5={c:[440,450],half:.6,inner:110,R:520,pet:[[440,187],[688,369],[589,655],[289,656],[189,368]]};
const FL3={c:[460,490],half:.82,inner:120,R:560,pet:[[460,203],[720,640],[198,641]],sepal:[450,772]};

// ── pictures as items {id,f,crop,r,a,rot,pv} ───────────────────────────────
const lin=(q,ix,iy)=>[q.r.x+(ix-q.crop[0])/q.crop[2]*q.r.w,q.r.y+(iy-q.crop[1])/q.crop[3]*q.r.h];
function map(q,ix,iy){const [x,y]=lin(q,ix,iy);if(!q.rot)return[x,y];const [px,py]=lin(q,...q.pv),co=Math.cos(q.rot),si=Math.sin(q.rot);
  return[px+(x-px)*co-(y-py)*si,py+(x-px)*si+(y-py)*co];}
const kOf=q=>q.r.w/q.crop[2];
function mk(id,f,r,t,amp,ph,pv){return{id,f,crop:FULL(f),r,a:1,rot:amp*Math.sin(t*.8+ph),pv:pv||[SIZE[f][0]/2,SIZE[f][1]]};}
function withRot(c,q,fn){c.save();if(q.rot){const [px,py]=lin(q,...q.pv);c.translate(px,py);c.rotate(q.rot);c.translate(-px,-py);}fn();c.restore();}
function drawItem(c,q){
  if(q.a<=0)return;const im=pic(AI+q.f),r=q.r;c.save();c.globalAlpha*=Math.min(1,q.a);
  if(im)withRot(c,q,()=>{c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,q.crop[0],q.crop[1],q.crop[2],q.crop[3],r.x,r.y,r.w,r.h);
    if(q.lit)q.lit(c,im);});
  else{c.save();c.setLineDash([6,6]);D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(C.muted,.4));c.restore();}
  c.restore();
}

// ── text helpers (as in plants_draw_zoom_1022_v1.js) ───────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{let r=splitLines(c,sg,w,size);
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}
  for(let i=1;i<r.length;i++)while(/^[.,;:!?)]/.test(r[i])&&!/[一-鿿]/.test(r[i-1])){r[i-1]+=r[i][0];r[i]=r[i].slice(1).trimStart();}
  r=r.filter(x=>x);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
function textBlock(c,p,x,y,w,col,{size=22,lh=30,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
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
const lead=(c,x0,y0,x1,y1,col)=>{line(c,[[x0,y0],[x1,y1]],rgba(C.deep,.7),5);line(c,[[x0,y0],[x1,y1]],rgba(col,.95),2);circle(c,x1,y1,4.5,col,C.ink,1.5);};
function ring(c,x,y,r,t,a,col){if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,null,rgba(C.deep,.75),6.5);c.setLineDash([6,4]);c.lineDashOffset=-t*14;circle(c,x,y,r,null,col,3);c.restore();c.save();c.globalAlpha*=a;K.pulse(c,x,y,t,col,r);c.restore();}
function num(c,x,y,n,col,r=17){circle(c,x,y,r+3,rgba(C.deep,.7),null);circle(c,x,y,r,col,C.ink,2);c.save();c.font=K.MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function tick(c,x,y,r,col){circle(c,x,y,r,col,C.ink,2);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x-r*.45,y+r*.02);c.lineTo(x-r*.1,y+r*.38);c.lineTo(x+r*.48,y-r*.36);c.stroke();c.restore();}
// a glowing traced line (schematic), drawn up to fraction g, with a light running along it
function trace(c,pts,col,w,g,t,speed=.35,ph=0){
  if(g<=0||pts.length<2)return;const seg=[];let tot=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d;}
  const upto=(L)=>{const out=[pts[0]];let acc=0;for(let i=1;i<pts.length;i++){if(acc+seg[i-1]>=L){const u=(L-acc)/seg[i-1];out.push([mix(pts[i-1][0],pts[i][0],u),mix(pts[i-1][1],pts[i][1],u)]);return out;}acc+=seg[i-1];out.push(pts[i]);}return out;};
  const P1=upto(tot*clamp(g));sline(c,P1,rgba(C.deep,.7),w+4);sline(c,P1,rgba(col,.9),w);
  if(g>=1){const L=mod(t*speed+ph)*tot,p=upto(L).pop();glow(c,p[0],p[1],w*4.5,C.white,.75);circle(c,p[0],p[1],w*.7,C.white,null);}
}
const put=(c,st,p,pt,col,side)=>{ // label beside a picture; side 'L' = label right of picture (left column), 'R' = label left of picture
  const [x,y]=pt,yy=Math.max(st.y0,y-20),f=side==='L'?fitText(c,p,st.x,yy,st.w,col):fitText(c,p,st.x+st.w,yy,st.w,col,{align:'right'});
  const ex=side==='L'?f.x-6:f.x+f.w+6;lead(c,ex,f.y+Math.min(f.h/2,20),x,y,col);st.y0=f.y+f.h+14;return f;};
const aiP=()=>LAB().aiNote||P(`AI 插圖，非實拍`,`AI illustration, not a photo`);
const MARK=P(`亮線、圈與數字是加上的標示（示意）`,`Bright lines, rings and numbers are added markers (schematic)`);
const NOTE=[null,P(`AI 繪製，只看排列方式・圈與虛線是加上的標示（示意）`,`AI drawing: look only at the arrangement · rings and dashes are markers (schematic)`)];
const names=(c,pl,pr,a=1)=>{c.save();c.globalAlpha*=a;text(c,pl,COL.L.cx,84,22,C.white,'center');text(c,pr,COL.R.cx,84,22,C.white,'center');c.restore();};
const result=(c,pl,pr,aL,aR)=>{if(aL>0){c.save();c.globalAlpha*=aL;fitText(c,pl,COL.L.cx,474,440,DI,{align:'center',active:true});c.restore();}
  if(aR>0){c.save();c.globalAlpha*=aR;fitText(c,pr,COL.R.cx,474,440,MO,{align:'center',active:true});c.restore();}};
const RES=[3,3,3.4,3.2,7];   // when the result of each step appears (s); the progress cell lights then

// ── step 0: veins ──────────────────────────────────────────────────────────
const R0L=fitRect(F.bodhi,40,96,200,366),R0R=fitRect(F.bamboo,652,96,280,366);
function bambooLines(q){return BAMBOO.flatMap(b=>b.off.map(o=>{const pts=[];for(let y=b.y0;y<=b.y1;y+=40)pts.push(map(q,b.a+b.b*(y-180)+o,y));return pts;}));}
function over0(c,a,tau,t,A,B){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  names(c,L1('bodhi','菩提葉','Bodhi leaf'),L1('bamboo','竹葉','Bamboo leaf'));
  const g=clamp((tau-.8)/1.2);
  trace(c,BODHI.mid.map(p=>map(A,...p)),DI,4,g,t,.3);
  BODHI.side.forEach((s,i)=>trace(c,s.map(p=>map(A,...p)),DI,3,clamp((tau-1.2-i*.15)/1),t,.45,i*.27));
  bambooLines(B).forEach((pts,i)=>{const gg=clamp((tau-.9-i*.08)/1.1);if(gg<=0)return;c.save();c.globalAlpha*=gg;
    sline(c,pts,rgba(C.deep,.6),6);c.setLineDash([12,10]);c.lineDashOffset=-t*22;sline(c,pts,rgba(MO,.95),3);c.restore();});
  c.save();c.globalAlpha*=fade(tau,2,.5);
  const st={x:252,y0:140,w:214};
  put(c,st,P(`中肋`,`Midrib`),map(A,298,420),DI,'L');
  put(c,st,P(`細脈連成網`,`Fine veins join into a net`),map(A,444,529),DI,'L');
  const sr={x:490,y0:236,w:164};
  put(c,sr,P(`細脈平行排列`,`Veins run side by side`),map(B,99+.498*(500-180)-34,500),MO,'R');
  c.restore();
  result(c,L1('netVein','網狀脈','Net veins'),L1('parVein','平行脈','Parallel veins'),fade(tau,RES[0],.5),fade(tau,RES[0]+.3,.5));
  c.restore();
}

// ── step 1: stem bundles ───────────────────────────────────────────────────
const R1L=fitRect(F.sd,61,96,368,366),R1R=fitRect(F.sm,531,96,368,366);
function over1(c,a,tau,t,A,B){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  names(c,L1('stemDi','向日葵莖橫切（示意）','Sunflower stem section (schematic)'),L1('stemMono','玉米莖橫切（示意）','Maize stem section (schematic)'));
  const kA=kOf(A),kB=kOf(B),[cx,cy]=map(A,...RING.c);
  // dashed circle along the ring of bundles + a light running round it
  const ga=clamp((tau-1.8)/1);
  if(ga>0){c.save();c.globalAlpha*=ga;c.beginPath();c.arc(cx,cy,RING.r*kA,-Math.PI/2,-Math.PI/2+TAU*ga);c.strokeStyle=rgba(C.deep,.75);c.lineWidth=7;c.stroke();
    c.setLineDash([10,8]);c.lineDashOffset=-t*16;c.strokeStyle=DI;c.lineWidth=3;c.stroke();c.restore();
    if(ga>=1){const an=-Math.PI/2+mod(t*.18)*TAU,x=cx+Math.cos(an)*RING.r*kA,y=cy+Math.sin(an)*RING.r*kA;glow(c,x,y,22,C.white,.8);circle(c,x,y,4,C.white,null);}}
  DIB.forEach((p,i)=>{if(i%2)return;const [x,y]=map(A,...p),al=fade(tau,.8+i*.06,.4);
    const on=mod(t*.18)*DIB.length,near=Math.abs(mod(on-i+DIB.length/2,DIB.length)-DIB.length/2)<1.2&&tau>3;ring(c,x,y,46*kA*(near?1.15:1),t+i*.21,al,DI);});
  MOB.forEach((p,i)=>{const [x,y]=map(B,...p),al=fade(tau,.8+i*.08,.4),hi=Math.floor(mod(t*1.2,MOB.length))===i&&tau>3;
    ring(c,x,y,(hi?34:26)*kB+6,t+i*.37,al,MO);});
  result(c,L1('ring','維管束排成一圈','Bundles in a ring'),L1('scattered','維管束散生','Bundles scattered'),fade(tau,RES[1],.5),fade(tau,RES[1]+.3,.5));
  c.restore();
}

// ── step 2: seed leaves ────────────────────────────────────────────────────
const R2L=fitRect(F.pn,18,110,244,330),R2R=fitRect(F.ck,700,110,234,330);
function over2(c,a,tau,t,A,B){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  names(c,L1('peanut','花生種子','Peanut seed'),L1('corn','玉米粒','Corn kernel'));
  // corn: dashed outline of the embryo (small, at the bottom)
  const ea=fade(tau,2.2,.5);
  if(ea>0)withRot(c,B,()=>{const e=CK_PT.emb,k=kOf(B),[x,y]=lin(B,...e.c);c.save();c.globalAlpha*=ea;
    ellipse(c,x,y,e.rx*k,e.ry*k,null,rgba(C.deep,.75),6,e.rot);c.setLineDash([7,5]);c.lineDashOffset=-t*12;ellipse(c,x,y,e.rx*k,e.ry*k,null,C.white,2.5,e.rot);c.restore();});
  // numbered seed leaves
  [[A,PN_PT.cot1,1,DI,.9],[A,PN_PT.cot2,2,DI,1.4],[B,CK_PT.cot,1,MO,1.2]].forEach(([q,p,n,col,t0])=>{const al=fade(tau,t0,.4);if(al<=0)return;
    const [x,y]=map(q,...p);c.save();c.globalAlpha*=al;K.pulse(c,x,y,t+n*.3,col,20);num(c,x,y,n,col);c.restore();});
  c.save();c.globalAlpha*=fade(tau,2,.5);
  const st={x:276,y0:150,w:190};
  put(c,st,P(`養分存在子葉`,`Food in the seed leaves`),map(A,...PN_PT.food),DI,'L');
  put(c,st,L1('embryo','胚','Embryo'),map(A,...PN_PT.embryo),C.white,'L');
  const sr={x:496,y0:150,w:190};
  put(c,sr,P(`養分存在胚乳`,`Food in the endosperm`),map(B,...CK_PT.endo),MO,'R');
  c.restore();
  c.save();c.globalAlpha*=ea;const sr2={x:496,y0:300,w:190};put(c,sr2,P(`小小的胚在底部`,`Small embryo at the bottom`),map(B,...CK_PT.embLead),C.white,'R');c.restore();
  result(c,L1('twoCot','兩枚子葉','Two seed leaves'),L1('oneCot','一枚子葉','One seed leaf'),fade(tau,RES[2],.5),fade(tau,RES[2]+.3,.5));
  c.restore();
}

// ── step 3: roots ──────────────────────────────────────────────────────────
const R3L=fitRect(F.dr,50,96,190,366),R3R=fitRect(F.mr,720,96,200,366);
function over3(c,a,tau,t,A,B){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  names(c,P(`雙子葉幼苗`,`Dicot seedling`),P(`單子葉幼苗`,`Monocot seedling`));
  trace(c,TAP.map(p=>map(A,...p)),DI,6,clamp((tau-.8)/1.2),t,.4);
  const ta=fade(tau,1.6,.5);
  if(ta>0)withRot(c,B,()=>{const e=MR_PT.tuft,k=kOf(B),[x,y]=lin(B,...e.c);c.save();c.globalAlpha*=ta;
    ellipse(c,x,y,e.rx*k,e.ry*k,null,rgba(C.deep,.7),6);c.setLineDash([8,6]);c.lineDashOffset=-t*12;ellipse(c,x,y,e.rx*k,e.ry*k,null,MO,2.6);c.restore();});
  c.save();c.globalAlpha*=fade(tau,2,.5);
  const st={x:252,y0:250,w:214};
  put(c,st,P(`側根`,`Side roots`),map(A,...DR_PT.side),C.white,'L');
  put(c,st,P(`主根（一條粗的）`,`Taproot (one thick root)`),map(A,...DR_PT.tap),DI,'L');
  const sr={x:486,y0:300,w:230};
  put(c,sr,P(`一大叢，粗細差不多`,`A tuft of similar roots`),map(B,...MR_PT.lead),MO,'R');
  c.restore();
  result(c,L1('taproot','主根＋側根','Taproot + side roots'),L1('fibrous','鬚根','Fibrous roots'),fade(tau,RES[3],.5),fade(tau,RES[3]+.3,.5));
  c.restore();
}

// ── step 4: petals ─────────────────────────────────────────────────────────
const R4L=fitRect(F.f5,60,100,370,300),R4R=fitRect(F.f3,530,100,370,300);
const T5=1,T3=5.2,DT=.7;   // counting starts; one petal every DT s
function litFn(q,fl,idx,amt){return(c,im)=>{if(idx<0||amt<=0)return;const [cx,cy]=lin(q,...fl.c),k=kOf(q),p=fl.pet[idx],an=Math.atan2(p[1]-fl.c[1],p[0]-fl.c[0]);
  // feathered wedge: four passes, each a little narrower, so the lit petal has no hard straight edge
  [1,.86,.72,.58].forEach(f=>{const h=fl.half*f;c.save();c.beginPath();c.arc(cx,cy,fl.R*k,an-h,an+h);c.arc(cx,cy,fl.inner*k,an+h,an-h,true);c.closePath();c.clip();
    c.globalCompositeOperation='lighter';c.globalAlpha*=.12*amt;c.drawImage(im,q.r.x,q.r.y,q.r.w,q.r.h);c.restore();});};}
// which petal is lit now (counting, then cycling while idle) and how many are counted
function countState(fl,tau,t,t0,tEnd){const n=fl.pet.length,cnt=Math.max(0,Math.min(n,Math.floor((tau-t0)/DT)+1));
  if(tau<t0)return{cnt:0,idx:-1,amt:0};
  if(cnt<n||tau<t0+n*DT){const i=Math.min(n-1,Math.floor((tau-t0)/DT));return{cnt,idx:i,amt:1-.4*mod((tau-t0)/DT)};}
  if(tau<tEnd)return{cnt:n,idx:-1,amt:0};
  const u=(t*.9)%n;return{cnt:n,idx:Math.floor(u),amt:Math.sin(Math.PI*mod(u))};}
function over4(c,a,tau,t,A,B,s5,s3){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const done5=T5+5*DT,done3=T3+3*DT,q=P(`數一數彩色的花瓣`,`Count the coloured petals`);
  const n5=fade(tau,done5,.35),n3=fade(tau,done3,.35),o5=1-fade(tau,done5-.4,.35),o3=1-fade(tau,done3-.4,.35);
  c.save();c.globalAlpha*=o5;text(c,q,COL.L.cx,84,22,C.muted,'center');c.restore();
  c.save();c.globalAlpha*=n5;text(c,P(`五片花瓣的花`,`A five-petal flower`),COL.L.cx,84,22,C.white,'center');c.restore();
  c.save();c.globalAlpha*=o3;text(c,q,COL.R.cx,84,22,C.muted,'center');c.restore();
  c.save();c.globalAlpha*=n3;text(c,P(`三片花瓣的花`,`A three-petal flower`),COL.R.cx,84,22,C.white,'center');c.restore();
  for(let i=0;i<s5.cnt;i++){const [x,y]=map(A,...FL5.pet[i]);num(c,x,y,i+1,DI);}
  for(let i=0;i<s3.cnt;i++){const [x,y]=map(B,...FL3.pet[i]);num(c,x,y,i+1,MO);}
  // a sepal of the three-petal flower: not counted
  const sa=fade(tau,T3-.6,.5);
  if(sa>0){c.save();c.globalAlpha*=sa;const [x,y]=map(B,...FL3.sepal);ring(c,x,y,14,t,1,C.green);
    const f=fitText(c,P(`綠色的是萼片，不數`,`Green ones are sepals: not counted`),COL.R.cx,416,440,C.green,{align:'center',dash:[6,4]});
    lead(c,f.x+f.w/2,f.y,x,y+16,C.green);c.restore();}
  result(c,L1('petals5','5 片花瓣','5 petals'),L1('petals3','3 片花瓣','3 petals'),fade(tau,done5+.2,.5),fade(tau,done3+.2,.5));
  c.restore();
}

// ── step 5: clue board ─────────────────────────────────────────────────────
const ROWS=[
 {n:0,l:[F.bodhi,[0,250,599,640]],r:[F.bamboo,[0,0,853,853]],tl:['netVein','網狀脈','Net veins'],tr:['parVein','平行脈','Parallel veins']},
 {n:1,l:[F.sd,FULL(F.sd)],r:[F.sm,FULL(F.sm)],tl:['ring','維管束排成一圈','Bundles in a ring'],tr:['scattered','維管束散生','Bundles scattered']},
 {n:2,l:[F.pn,FULL(F.pn)],r:[F.ck,FULL(F.ck)],tl:['twoCot','兩枚子葉','Two seed leaves'],tr:['oneCot','一枚子葉','One seed leaf']},
 {n:3,l:[F.dr,[0,520,542,600]],r:[F.mr,[0,860,573,400]],tl:['taproot','主根＋側根','Taproot + side roots'],tr:['fibrous','鬚根','Fibrous roots']},
 {n:4,l:[F.f5,FULL(F.f5)],r:[F.f3,FULL(F.f3)],tl:['petals5','5 片花瓣','5 petals'],tr:['petals3','3 片花瓣','3 petals']}];
const RY0=62,RH=64,RG=8,LW5=158,CELL={L:[184,558],R:[566,940]},HX5=[371,753];
function thumb(c,f,crop,x,y,s){const im=pic(AI+f);D.round(c,x,y,s,s,10,'#21453a',null);if(!im)return;const k=Math.min((s-6)/crop[2],(s-6)/crop[3]),w=crop[2]*k,h=crop[3]*k;
  c.save();c.beginPath();c.roundRect(x,y,s,s,10);c.clip();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,crop[0],crop[1],crop[2],crop[3],x+(s-w)/2,y+(s-h)/2,w,h);c.restore();}
function over5(c,a,tau,t){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const sweep=Math.floor(mod(t*.4,ROWS.length+1));
  ROWS.forEach((R,i)=>{const y=RY0+i*(RH+RG),on=fade(tau,.6+i*.8,.5),hi=tau>5&&sweep===i;
    [['L',R.l,R.tl,DI],['R',R.r,R.tr,MO]].forEach(([side,[f,crop],tl,col])=>{const [x0,x1]=CELL[side],w=x1-x0;
      c.save();c.globalAlpha*=.45+.55*on;
      D.round(c,x0,y,w,RH,14,hi?rgba(col,.16):'rgba(11,26,21,.9)',null);
      c.save();c.beginPath();c.roundRect(x0,y,w,RH,14);c.strokeStyle=on>0?rgba(col,.4+.55*on):rgba(C.muted,.4);c.lineWidth=hi?3:2;c.stroke();c.restore();
      const s=RH-10,tx=side==='L'?x0+5:x1-5-s;thumb(c,f,crop,tx,y+5,s);
      c.save();c.globalAlpha*=on;
      const lab=L1(...tl);
      const rr=rowsOf(c,lab,w-s-70),y1=y+RH/2+8-(rr.length-1)*14;
      if(side==='L'){rr.forEach((r,j)=>text(c,r,x0+s+18,y1+j*28,22,col));tick(c,x1-26,y+RH/2,14*Math.min(1,on*1.3),col);}
      else{rr.forEach((r,j)=>text(c,r,x1-s-18,y1+j*28,22,col,'right'));tick(c,x0+26,y+RH/2,14*Math.min(1,on*1.3),col);}
      c.restore();c.restore();});
    fitText(c,EVS[i],20+LW5/2,y+(RH-40)/2,LW5,C.yellow,{align:'center',active:on>.5});});
  const ca=fade(tau,4.9,.6);
  if(ca>0){c.save();c.globalAlpha*=ca;
    const cw=900,cx0=30,cy0=RY0+5*(RH+RG)+6,body=P(`只靠一項證據可能判斷錯，要多項一起看。雙子葉不等於木本，單子葉也不等於草本。`,`One clue alone can mislead you, so look at several together. Dicot does not mean woody, and monocot does not mean herbaceous.`),
      rows=rowsOf(c,body,cw-48),ch=16+30+rows.length*28+12;
    D.round(c,cx0,cy0,cw,ch,16,'rgba(11,26,21,.95)',null);
    c.save();c.beginPath();c.roundRect(cx0,cy0,cw,ch,16);c.strokeStyle=C.yellow;c.lineWidth=3+.8*Math.sin(t*2.4);c.stroke();c.restore();
    text(c,P(`這些是典型特徵，有例外`,`These are typical features, with exceptions`),480,cy0+38,26,C.yellow,'center');
    rows.forEach((r,i)=>text(c,r,480,cy0+72+i*28,22,C.white,'center'));
    c.restore();}
  bottomBlock(c,aiP(),480,590,900,C.muted,{align:'center'});
  c.restore();
}
const EVS=[P(`葉脈`,`Veins`),P(`莖`,`Stem`),P(`子葉`,`Seed leaves`),P(`根`,`Roots`),P(`花瓣`,`Petals`)];

// ── progress strip (steps 0–4) and notes ───────────────────────────────────
function progress(c,k,tau,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const lab=P(`證據板`,`Clue board`),lw=measure(c,lab,22);text(c,lab,20,584,22,C.yellow);
  const x0=20+lw+12,S=34,G=8;
  for(let i=0;i<5;i++){const x=x0+i*(S+G),y=556,seen=i<k||(i===k&&tau>RES[k]+.2),cur=i===k;
    if(cur)K.pulse(c,x+S/2,y+S/2,t,C.yellow,S/2);
    D.round(c,x,y,S,S,9,seen?C.yellow:'rgba(11,26,21,.9)',null);
    c.save();c.beginPath();c.roundRect(x,y,S,S,9);c.strokeStyle=cur?C.white:seen?C.yellow:rgba(C.muted,.6);c.lineWidth=cur?3:2;c.stroke();c.restore();
    c.save();c.font=K.MONO(22);c.fillStyle=seen?C.ink:C.muted;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x+S/2,y+S/2+1);c.restore();}
  c.restore();
  return x0+5*(S+G);
}
function notes(c,k,a){if(a<=0)return;c.save();c.globalAlpha*=a;const lw=measure(c,P(`證據板`,`Clue board`),22),x=20+lw+12+5*42+22;
  const ai=aiP(),p=NOTE[k]||P(`${ai[0]}・${MARK[0]}`,`${ai[1]} · ${MARK[1]}`);bottomBlock(c,p,x,590,940-x,C.muted);c.restore();}

// ── scenes ─────────────────────────────────────────────────────────────────
function scene(c,j,tau,t){
  if(j===0){const A=mk('bodhi',F.bodhi,R0L,t,.012,0),B=mk('bamboo',F.bamboo,R0R,t,.01,1.7,[560,1060]);return{items:[A,B],over:(c,a)=>over0(c,a,tau,t,A,B)};}
  if(j===1){const A=mk('sd',F.sd,R1L,t,.008,0,[555,555]),B=mk('sm',F.sm,R1R,t,.008,1.9,[555,555]);return{items:[A,B],over:(c,a)=>over1(c,a,tau,t,A,B)};}
  if(j===2){const A=mk('pn',F.pn,R2L,t,.012,0),B=mk('ck',F.ck,R2R,t,.012,1.4);return{items:[A,B],over:(c,a)=>over2(c,a,tau,t,A,B)};}
  if(j===3){const A=mk('dr',F.dr,R3L,t,.014,0,[284,560]),B=mk('mr',F.mr,R3R,t,.014,1.6,[310,880]);return{items:[A,B],over:(c,a)=>over3(c,a,tau,t,A,B)};}
  if(j===4){const A=mk('f5',F.f5,R4L,t,.012,0,[440,450]),B=mk('f3',F.f3,R4R,t,.012,1.5,[460,490]);
    const s5=countState(FL5,tau,t,T5,T5+5*DT+.4),s3=countState(FL3,tau,t,T3,T3+3*DT+.4);
    A.lit=litFn(A,FL5,s5.idx,s5.amt);B.lit=litFn(B,FL3,s3.idx,s3.amt);
    return{items:[A,B],over:(c,a)=>over4(c,a,tau,t,A,B,s5,s3)};}
  return{items:[],over:(c,a)=>over5(c,a,tau,t)};
}
// column headers; hx = their centres (steps 0–4: the two picture columns; step 5: the two board columns), dv = divider alpha
function headers(c,t,hx,dv){
  const L=LAB();
  [[hx[0],L.dicot||P(`雙子葉植物`,`Dicots`),DI],[hx[1],L.monocot||P(`單子葉植物`,`Monocots`),MO]].forEach(([x,p,col],i)=>{
    const w=measure(c,p,22)+28;glow(c,x,30,w*.6,col,.12+.06*Math.sin(t*1.6+i*Math.PI));fitText(c,p,x,10,440,col,{align:'center',active:true});});
  if(dv>0){c.save();c.globalAlpha*=dv;c.setLineDash([4,8]);c.lineDashOffset=-t*6;line(c,[[480,60],[480,520]],rgba(C.muted,.35),2);c.restore();}
}
const HX=j=>j===5?HX5:[COL.L.cx,COL.R.cx];
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.ev||(s.ev={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.fromTau=st.tau;st.k=k;st.T=t;}
  if(t<st.T)st.T=t;
  const x=clamp((t-st.T)/.9),cross=st.from>=0&&x<1;
  const cur=scene(c,k,tau,t),old=cross?scene(c,st.from,st.fromTau+(t-st.T),t):null;
  st.tau=tau;
  const aOut=1-smooth(clamp(x*2)),aIn=old?smooth(clamp(x*2-1)):1,u=smooth(x);
  const h0=old?HX(st.from):HX(k),h1=HX(k),dv=a=>a===5?0:1;
  headers(c,t,[mix(h0[0],h1[0],u),mix(h0[1],h1[1],u)],old?mix(dv(st.from),dv(k),u):dv(k));
  if(old){old.items.forEach(q=>{q.a*=aOut;drawItem(c,q);});old.over(c,aOut);}
  cur.items.forEach(q=>{q.a*=aIn;drawItem(c,q);});cur.over(c,aIn);
  // progress strip and notes: steps 0–4 only
  const pa=k<5?(old&&st.from===5?aIn:1):(old&&st.from<5?aOut:0);
  if(old&&st.from<5&&k<5){progress(c,k,tau,t,1);notes(c,st.from,aOut);notes(c,k,aIn);}
  else{progress(c,k<5?k:st.from,k<5?tau:st.fromTau+(t-st.T),t,pa);notes(c,k<5?k:st.from,pa);}
}
window.PlantsDraw.evidence=draw;
})();

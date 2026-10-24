/* Unit 11 lesson 1 · "green" canvas (biodiversity-value tab, view 1), 2026-10-24. What a green view shows (plan section 2, green).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (the divider sways a few px, dashes march,
 * rings pulse, icons turn).
 * Stage (x 16..636): one compare window WIN (x 91..561, y 64..326.5; both pictures drawn into the same rect at 470 px wide, scale
 * 470/1024, no enlargement). BD9a (A, rainforest) shows left of the divider, BD9b (B, palm plantation) right of it, so both halves
 * stay aligned to the same rect. Name pills above the window: "A rainforest" (left) / "B palm plantation" (right).
 * The divider is moved by the program; tapping the picture moves it there (D.hit strips, key 'split'; the shell has no drag for
 * modules) and after 10 s the program takes over again. Under the window (y 342..572) = the step's cards. Right = step card
 * (x 652..944) as in uses / mosaic: header (VIEWS.green.tab), four step labels, step title (VIEWS.green.names), legend.
 *  0 both green: divider starts in the middle, sweeps to show more of A, then more of B, back to the middle; both halves glow.
 *    Two swatches = the average colour of each whole picture (PIL: A 111,130,94; B 126,131,101), pill "Both green".
 *  1 observe first: white rounded boxes pop onto crowns that look different (4 on A, numbered 1..4; 3 on B, all numbered 1 = the
 *    same look). Under the window a list per side (number + "height / shape / layout: ..."), the counts "4 boxes, 4 looks" /
 *    "3 boxes, 1 look" (the numbers are the boxes on screen) and "What we see, not the number of species".
 *  2 cannot say yet: three white dashed cards (how many species, which animals, what soil) each get a "To check" stamp; a wide card
 *    "Which land has higher diversity?" gets a "Not shown yet" stamp.
 *  3 what to add: three cyan cards with drawn icons: same plot size (two equal squares; two equal dashed cyan plots also appear on the
 *    picture), same time and method (clock + record board), repeat (three stacked squares, x3, "Schematic"). No answer is given:
 *    no A-vs-B arrow, no ranking, no result numbers. The note "teaching pictures, not the same place" lights up.
 * Colours (plan 1.4): white = what we see / to check (unknown); cyan #55e9ff = data still needed (evidence). Green is not used to
 * mean "more diverse".
 * Box positions (picture px of the 1024x572 originals) were measured with PIL on a grid crop, see BOX_A / BOX_B.
 * New labels (P(), not in K.LAB) are in T, BOX_A and BOX_B below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,CYAN=K.COL.evidence,UNK=K.COL.unknown;
const E=K.ENV||'environment_ai_1024/',FA=E+'BD9a_rainforest.jpg',FB=E+'BD9b_palm_plantation.jpg',IW=1024,IH=572;

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('一片綠，看得出什麼','What a green view shows'),
 short:[P('都很綠','Both green'),P('先觀察','Observe first'),P('還不能說','Cannot say yet'),P('該補什麼','What to add')],
 names:[P('看起來都很綠','Both look green'),P('看得到的：樹冠的差別','What we see: crown differences'),P('不能直接說的','What we cannot say yet'),P('還需要哪些資料','What data we still need')],
 nameA:P('A 熱帶雨林','A  Rainforest'),nameB:P('B 棕櫚園','B  Palm plantation'),
 avgA:P('A 的平均顏色','A: average colour'),avgB:P('B 的平均顏色','B: average colour'),
 green:P('都很綠','Both green'),
 cntA:P('4 個框，看到 4 個樣子','4 boxes, 4 looks'),cntB:P('3 個框，看到 1 個樣子','3 boxes, 1 look'),
 seen:P('看到的，不是物種數','What we see, not the number of species'),
 q:[P('物種有幾種？','How many species?'),P('動物有哪些？','Which animals?'),P('土壤如何？','What is the soil like?')],
 who:P('兩片土地，誰的多樣性高？','Which land has higher diversity?'),
 need:[P('相同的樣區大小','Same plot size'),P('相同的調查時間與方法','Same time and method'),P('重複幾次','Repeat several times')],
 notSame:P('這兩張是教學示意，不是同一個地點','These two are teaching pictures, not the same place'),
 legKnob:P('白線：分割線，點圖片可移動','White line: divider; tap the picture to move it'),
 legSw:P('色塊：整張圖的平均顏色','Swatch: average colour of a picture'),
 legBox:P('白框：看起來不同的樹冠','White box: a crown that looks different'),
 legNum:P('同號碼＝同一個樣子','Same number = same look'),
 legDash:P('白虛線：待查','White dashes: to check'),
 legCyan:P('青框：還要補的資料','Cyan: data still needed'),
 legPlot:P('青虛線方框：樣區','Cyan dashed square: a plot')
};
// boxes in picture px [x0,y0,x1,y1] (A kept left of x 470, B right of x 690, so a centred divider never cuts them)
const BOX_A=[
 {r:[185,20,425,168],n:1,p:P('高度：特別高','Height: much taller')},
 {r:[350,174,468,238],n:2,p:P('形狀：像傘','Shape: like an umbrella')},
 {r:[4,212,178,334],n:3,p:P('形狀：圓團','Shape: round clump')},
 {r:[342,372,442,458],n:4,p:P('形狀：細長葉片','Shape: long fronds')}];
const BOX_B=[
 {r:[700,425,800,535],n:1,p:P('形狀：都很像','Shape: all alike')},
 {r:[860,330,1010,420],n:1,p:P('高度：差不多','Height: about the same')},
 {r:[794,130,1020,240],n:1,p:P('排列：一行一行','Layout: in rows')}];
const AVG_A='#6f825e',AVG_B='#7e8365';   // mean colour of each whole picture (PIL, BOX resize to 1x1)

// ── layout ────────────────────────────────────────────────────────────────
const SC=470/IW,WIN={x:91,y:64,w:470,h:IH*SC};
const STAGE={x:16,w:620},Y0=342,CARD={x:652,y:16,w:292,h:550},LH=26;
const COLA={x:16,w:300},COLB={x:336,w:300};
const map=(px,py)=>[WIN.x+px*SC,WIN.y+py*SC];
const rectOf=b=>{const [x0,y0]=map(b[0],b[1]),[x1,y1]=map(b[2],b[3]);return{x:x0,y:y0,w:x1-x0,h:y1-y0};};

// ── helpers (as in the uses / mosaic views) ──────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、])|(?<=[:,;] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop()+(/\s$/.test(part)?' ':'');rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh,al='left')=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col,al));return r.length*lh;};
function ring(c,r,t,col,rad){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,(rad!=null?rad:Math.min(r.h/2,16))+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?C.ink:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// a pill whose text may wrap (measured first, never below 22 px)
function boxGeo(c,p,maxW){const pad=28,rows=blines(c,p,maxW-pad),w=Math.max(...rows.map(r=>measure(c,r,22)))+pad,h=40+(rows.length-1)*LH;return{rows,w,h};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill='rgba(11,26,21,.92)'}={}){
  const g=boxGeo(c,p,maxW),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:20,fill,stroke);
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+28+i*LH,22,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
// numbered marker for a framed crown (white disc, dark digit)
function mark(c,n,x,y){circle(c,x,y,14,WHITE,C.ink,2);c.save();c.font=K.MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// a rubber stamp: rotated, double outline, dark fill; s = scale (drop-in)
function stamp(c,p,x,y,col,s=1,rot=-.12){const w=measure(c,p,22)+26,h=40;
  c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);
  D.round(c,-w/2,-h/2,w,h,8,'rgba(11,26,21,.95)',col);c.save();c.globalAlpha*=.6;D.round(c,-w/2+4,-h/2+4,w-8,h-8,5,null,col);c.restore();
  text(c,p,0,8,22,col,'center');c.restore();return{w,h};}
const stampW=(c,p)=>measure(c,p,22)+26;

// ── divider: program path, user taps, step changes ──────────────────────
function basePath(k,tau,t){
  if(k!==0)return .5+.008*Math.sin(t*1.3);
  if(tau<1)return .5;
  if(tau<3.4)return mix(.5,.82,smooth((tau-1)/2.4));
  if(tau<6.2)return mix(.82,.18,smooth((tau-3.4)/2.8));
  if(tau<8)return mix(.18,.5,smooth((tau-6.2)/1.8));
  return .5+.012*Math.sin((tau-8)*1.4);
}
function divider(s,st,k,tau,t){
  if(typeof s.split==='number'){st.us=clamp(s.split);st.usT=t;st.usFrom=st.div==null?.5:st.div;s.split=undefined;}
  let v=basePath(k,tau,t);
  if(st.divFrom!=null&&tau<MOVE)v=mix(st.divFrom,v,smooth(tau/MOVE));
  if(st.usT!=null){const d=t-st.usT;
    if(d<0||d>11)st.usT=null;
    else{const user=mix(st.usFrom,st.us,smooth(d/.6))+.006*Math.sin(t*1.6);v=d<10?user:mix(user,v,smooth(d-10));}}
  st.div=Math.max(.04,Math.min(.96,v));return st.div;
}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.greenSt||(s.greenSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;st.divFrom=st.div;st.usT=null;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;st.divFrom=st.div;st.usT=null;}   // same step clicked again: replay
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const dv=divider(s,st,k,tau,t),dx=WIN.x+dv*WIN.w;s_dbg.div=dx;

  pictures(c,k,st,moving,u,tau,t,dx);
  // on-picture marks of the current / previous step, clipped to their own side
  if(moving)onPic(c,st.from,99,t,1-clamp(x*1.6),dx);
  onPic(c,k,tau,t,1,dx);
  handle(c,dx,t);
  names(c,dx,rects);
  // tap strips: tapping the picture moves the divider there
  for(let i=0;i<24;i++)D.hit(WIN.x+i*WIN.w/24,WIN.y,WIN.w/24,WIN.h,'split',+((i+.5)/24).toFixed(4));

  if(moving)scene(c,st.from,99,t,1-clamp(x*1.6),null);
  scene(c,k,tau,t,1,rects);
  card(c,k,st,moving,x,u,tau,t);

  // notes: not the same place (bright in step 3), AI pictures
  const hot=k===3?(moving?u:1):(moving&&st.from===3?1-u:0);
  const nw=measure(c,T.notSame,22),nr={x:22,y:572,w:nw+12,h:28};
  if(hot>0)withA(c,hot,()=>{D.round(c,nr.x-4,nr.y-2,nr.w+8,nr.h+4,10,'rgba(242,236,217,.08)',rgba(WHITE,.7));if(tau<99)ring(c,{x:nr.x-4,y:nr.y-2,w:nr.w+8,h:nr.h+4},t,WHITE,10);});
  text(c,T.notSame,28,592,22,hot>.5?WHITE:MUTED,'left');
  rects.push({id:'notSame',x:28,y:574,w:nw,h:24});
  const ai=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
  text(c,ai,CW-12,592,22,MUTED,'right');
  rects.push({id:'aiNote',x:CW-12-measure(c,ai,22),y:574,w:measure(c,ai,22),h:24});
}

// ── the two pictures in one window, split at dx ──────────────────────────
function pictures(c,k,st,moving,u,tau,t,dx){
  D.round(c,WIN.x-2,WIN.y-2,WIN.w+4,WIN.h+4,14,'#16332b',null);
  K.drawIn(c,FB,WIN,{radius:12});
  c.save();c.beginPath();c.rect(WIN.x,WIN.y,dx-WIN.x,WIN.h);c.clip();K.drawIn(c,FA,WIN,{radius:12});c.restore();
  // step 0: both halves light up together (wash in, then a slow breathing rim on both sides)
  const on=k===0?(moving?u:1):(moving&&st.from===0?1-u:0);
  if(on>0)withA(c,on,()=>{
    const wash=k===0?clamp(1-Math.abs(tau-1)/.8)*.16:0;
    if(wash>0){c.save();c.beginPath();c.roundRect(WIN.x,WIN.y,WIN.w,WIN.h,12);c.clip();c.fillStyle=rgba(WHITE,wash);c.fillRect(WIN.x,WIN.y,WIN.w,WIN.h);c.restore();}
    const b=.45+.35*Math.sin(t*2.2);
    c.save();c.shadowColor=rgba(WHITE,.8);c.shadowBlur=14;
    D.round(c,WIN.x+3,WIN.y+3,dx-WIN.x-8,WIN.h-6,10,null,rgba(WHITE,b));
    D.round(c,dx+5,WIN.y+3,WIN.x+WIN.w-dx-8,WIN.h-6,10,null,rgba(WHITE,b));c.restore();});
  D.round(c,WIN.x,WIN.y,WIN.w,WIN.h,12,null,C.edge);
}
function handle(c,dx,t){
  const y0=WIN.y,y1=WIN.y+WIN.h,cy=(y0+y1)/2;
  c.save();c.shadowColor='rgba(11,26,21,.8)';c.shadowBlur=6;K.sline(c,[[dx,y0+1],[dx,y1-1]],WHITE,3);c.restore();
  const r=17+1.2*Math.sin(t*2.4);
  circle(c,dx,cy,r,'rgba(11,26,21,.92)',WHITE,2.5);
  c.save();c.fillStyle=WHITE;const a=4+1.2*Math.sin(t*2.4);
  c.beginPath();c.moveTo(dx-a-8,cy);c.lineTo(dx-a,cy-6);c.lineTo(dx-a,cy+6);c.closePath();c.fill();
  c.beginPath();c.moveTo(dx+a+8,cy);c.lineTo(dx+a,cy-6);c.lineTo(dx+a,cy+6);c.closePath();c.fill();c.restore();
}
function names(c,dx,rects){
  const a=box(c,T.nameA,WIN.x,16),b=boxGeo(c,T.nameB,400);
  const q=box(c,T.nameB,WIN.x+WIN.w,16,{al:'right'});
  rects.push({id:'nameA',...a},{id:'nameB',...q});
}

// marks drawn on the picture for step k (boxes in step 1, plots in step 3)
function onPic(c,k,tau,t,a,dx){
  if(a<=0.002)return;
  const at=(d,dur=.45)=>clamp((tau-d)/dur);
  const side=(left,fn)=>{c.save();c.beginPath();left?c.rect(WIN.x,WIN.y,dx-WIN.x,WIN.h):c.rect(dx,WIN.y,WIN.x+WIN.w-dx,WIN.h);c.clip();fn();c.restore();};
  withA(c,a,()=>{
    if(k===1){
      [[BOX_A,true,0],[BOX_B,false,4]].forEach(([L0,left,off])=>side(left,()=>L0.forEach((b,i)=>{
        const f=at(.5+(off+i)*.75,.4);if(f<=0)return;const r=rectOf(b.r),g=(1-ease(f))*10;
        withA(c,clamp(f*2),()=>{
          c.save();c.shadowColor='rgba(11,26,21,.85)';c.shadowBlur=6;D.round(c,r.x-g,r.y-g,r.w+2*g,r.h+2*g,8,null,WHITE);c.restore();
          D.round(c,r.x-g,r.y-g,r.w+2*g,r.h+2*g,8,null,rgba(WHITE,.95));
          if(f>=1&&tau<99){const u=mod(t*.6+i*.25);D.round(c,r.x-4*u,r.y-4*u,r.w+8*u,r.h+8*u,8+4*u,null,rgba(WHITE,.5*(1-u)));}
          mark(c,b.n,r.x+15,r.y+15);});})));
    }else if(k===3){
      const f=at(.6,.6);if(f<=0)return;
      const sz=64,cy=WIN.y+WIN.h*.56,pts=[[WIN.x+WIN.w*.25,true],[WIN.x+WIN.w*.75,false]];
      pts.forEach(([cx,left])=>side(left,()=>withA(c,f,()=>{
        const b=1+.03*Math.sin(t*2);c.save();c.translate(cx,cy);c.scale(b,b);
        D.round(c,-sz/2,-sz/2,sz,sz,4,'rgba(85,233,255,.10)',null);
        c.setLineDash([8,6]);c.lineDashOffset=-t*12;c.lineWidth=3;c.strokeStyle=CYAN;c.shadowColor='rgba(11,26,21,.9)';c.shadowBlur=6;
        c.strokeRect(-sz/2,-sz/2,sz,sz);c.restore();})));
    }
  });
}

// ── one step's cards under the window. a = alpha; rects = collect label rects (null: do not) ──
function scene(c,k,tau,t,a,rects){
  if(a<=0.002)return;
  const at=(d,dur=.5)=>clamp((tau-d)/dur);
  withA(c,a,()=>{
    if(k===0)allGreen(c,tau,t,rects,at);
    else if(k===1)observe(c,tau,t,rects,at);
    else if(k===2)cannot(c,tau,t,rects,at);
    else need(c,tau,t,rects,at);
  });
}
function allGreen(c,tau,t,rects,at){
  const cols=[[COLA,AVG_A,T.avgA,.4],[COLB,AVG_B,T.avgB,.9]],y=Y0+6;let tips=[];
  cols.forEach(([R,col,p,d],i)=>{const f=at(d,.5);
    const tw=Math.min(measure(c,p,22),R.w-60),w=48+12+tw,x0=R.x+(R.w-w)/2;
    tips.push([x0+24,y+48]);
    withA(c,f,()=>{const b=1+.04*Math.sin(t*1.8+i);c.save();c.translate(x0+24,y+24);c.scale(b,b);D.round(c,-24,-24,48,48,10,col,WHITE);c.restore();
      text(c,p,x0+60,y+32,22,WHITE);
      if(rects&&f>=1)rects.push({id:'avg'+i,x:x0+60,y:y+14,w:tw,h:24});});});
  const ga=at(1.8,.6),g=boxGeo(c,T.green,400),gy=y+112;
  withA(c,ga,()=>{
    tips.forEach(([x0,y0])=>K.dashed(c,[[x0,y0+4],[x0,gy-26],[326,gy-26],[326,gy]],rgba(WHITE,.6),2.5,[6,6],-t*10));
    const q=box(c,T.green,326,gy,{al:'center'});if(rects&&ga>=1)rects.push({id:'green',...q});if(tau<99&&tau>1.8)ring(c,q,t,WHITE);});
}
function observe(c,tau,t,rects,at){
  const OY=Y0-8;let ys=[OY,OY];
  [[BOX_A,COLA,0],[BOX_B,COLB,4]].forEach(([L0,R,off],j)=>{
    let y=OY;
    L0.forEach((b,i)=>{const f=at(.5+(off+i)*.75+.2,.4),rows=blines(c,b.p,R.w-40);
      withA(c,f,()=>{mark(c,b.n,R.x+14,y+16);rows.forEach((q,n)=>text(c,q,R.x+38,y+24+n*LH,22,WHITE));});
      if(rects&&f>=1)rects.push({id:'row'+j+i,x:R.x+38,y:y+6,w:Math.max(...rows.map(q=>measure(c,q,22))),h:rows.length*LH});
      y+=4+rows.length*LH;});
    ys[j]=y;});
  const cy=Math.max(...ys)+4;
  [[T.cntA,COLA,6.2],[T.cntB,COLB,6.6]].forEach(([p,R,d],j)=>{const f=at(d,.5);
    withA(c,f,()=>{const q=box(c,p,R.x+R.w/2,cy,{maxW:R.w,al:'center'});if(rects&&f>=1)rects.push({id:'cnt'+j,...q});if(tau<99&&tau>d&&tau<d+3)ring(c,q,t,WHITE);});});
  const sa=at(7.2,.5),sy=cy+boxGeo(c,T.cntA,COLA.w).h+8;
  withA(c,sa,()=>{const q=box(c,T.seen,326,sy,{maxW:STAGE.w,al:'center',fill:'rgba(242,236,217,.10)'});if(rects&&sa>=1)rects.push({id:'seen',...q});if(tau<99&&tau>7.2)ring(c,q,t,WHITE);});
  s_dbg.observeBottom=sy+40;
}
// three cards across the stage; returns geometry
function cardRow(c,ps,iconH,extra=0){const gap=12,w=(STAGE.w-2*gap)/3;
  const rows=ps.map(p=>blines(c,p,w-28)),n=Math.max(...rows.map(r=>r.length)),h=iconH+18+n*LH+12+extra;
  return ps.map((p,i)=>({x:STAGE.x+i*(w+gap),y:Y0,w,h,rows:rows[i]}));}
function cannot(c,tau,t,rects,at){
  const G=cardRow(c,T.q,52);
  G.forEach((g,i)=>{const f=at(.4+i*.9,.5);
    withA(c,f,()=>{
      c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*8;D.round(c,g.x,g.y,g.w,g.h,14,'rgba(11,26,21,.55)',rgba(UNK,.9));c.restore();
      qIcon(c,i,g.x+34,g.y+36,t);
      g.rows.forEach((q,n)=>text(c,q,g.x+14,g.y+52+18+18+n*LH,22,WHITE));
      if(rects&&f>=1)rects.push({id:'q'+i,x:g.x+14,y:g.y+70,w:Math.max(...g.rows.map(q=>measure(c,q,22))),h:g.rows.length*LH});
      // stamp drops in
      const sf=at(.9+i*.9,.35);if(sf>0){const sw=stampW(c,L('toCheck','待查','To check'));
        withA(c,clamp(sf*2),()=>stamp(c,L('toCheck','待查','To check'),g.x+g.w-8-sw/2,g.y+34,UNK,mix(1.6,1,ease(sf))));
        if(rects&&sf>=1)rects.push({id:'stamp'+i,x:g.x+g.w-8-sw,y:g.y+14,w:sw,h:40,stamp:true});}
    });});
  const y=G[0].y+G[0].h+14,h=60,f=at(3.3,.5),np=L('notProved','還沒證明','Not shown yet'),sw=stampW(c,np);
  withA(c,f,()=>{
    c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*8;D.round(c,STAGE.x,y,STAGE.w,h,14,'rgba(11,26,21,.55)',rgba(UNK,.9));c.restore();
    const rows=blines(c,T.who,STAGE.w-sw-56);rows.forEach((q,n)=>text(c,q,STAGE.x+18,y+h/2+8-(rows.length-1)*LH/2+n*LH,22,WHITE));
    if(rects&&f>=1)rects.push({id:'who',x:STAGE.x+18,y:y+h/2-12-(rows.length-1)*LH/2,w:Math.max(...rows.map(q=>measure(c,q,22))),h:rows.length*LH});
    const sf=at(3.9,.35);if(sf>0){withA(c,clamp(sf*2),()=>stamp(c,np,STAGE.x+STAGE.w-16-sw/2,y+h/2,UNK,mix(1.6,1,ease(sf)),-.08));
      if(rects&&sf>=1)rects.push({id:'stampWho',x:STAGE.x+STAGE.w-16-sw,y:y+h/2-20,w:sw,h:40,stamp:true});}
    if(tau<99&&tau>3.9)ring(c,{x:STAGE.x,y,w:STAGE.w,h},t,WHITE,14);});
  s_dbg.cannotBottom=y+h;
}
function need(c,tau,t,rects,at){
  const sch=L('schematic','示意','Schematic'),G=cardRow(c,T.need,64,48);
  G.forEach((g,i)=>{const f=at(.4+i*1.2,.5);
    withA(c,f,()=>{
      D.round(c,g.x,g.y,g.w,g.h,14,'rgba(85,233,255,.07)',rgba(CYAN,.9));
      needIcon(c,i,g,t);
      g.rows.forEach((q,n)=>text(c,q,g.x+14,g.y+58+18+24+n*LH,22,CYAN));
      if(rects&&f>=1)rects.push({id:'need'+i,x:g.x+14,y:g.y+82,w:Math.max(...g.rows.map(q=>measure(c,q,22))),h:g.rows.length*LH});
      if(i===2){const q=box(c,sch,g.x+14,g.y+g.h-50,{stroke:WHITE});if(rects&&f>=1)rects.push({id:'schematic',...q});}
      if(tau<99&&tau>.4+i*1.2&&tau<4+i*1.2)ring(c,g,t+i*.3,CYAN,14);});});
  s_dbg.needBottom=G[0].y+G[0].h;
}
// icons of the three "to check" cards (white = unknown)
function qIcon(c,i,x,y,t){c.save();c.strokeStyle=WHITE;c.fillStyle=WHITE;c.lineWidth=2.5;c.lineCap='round';c.lineJoin='round';
  if(i===0){// three different leaves
    [[-18,0,.0],[0,-4,1],[18,0,2]].forEach(([dx,dy,kind],j)=>{c.save();c.translate(x+dx,y+dy+6);c.rotate(.12*Math.sin(t*1.5+j));
      c.beginPath();
      if(kind===0){c.ellipse(0,-10,6,12,0,0,Math.PI*2);}
      else if(kind===1){c.moveTo(0,-24);c.quadraticCurveTo(10,-14,4,-10);c.quadraticCurveTo(12,-6,0,2);c.quadraticCurveTo(-12,-6,-4,-10);c.quadraticCurveTo(-10,-14,0,-24);}
      else{c.moveTo(0,-22);c.lineTo(3,0);c.lineTo(-3,0);c.closePath();}
      c.stroke();K.sline(c,[[0,0],[0,8]],WHITE,2.5);c.restore();});
  }else if(i===1){// paw print
    const b=1+.05*Math.sin(t*2);c.translate(x,y);c.scale(b,b);
    K.ellipse(c,0,8,10,8,WHITE,null);[[-13,-4],[-5,-12],[5,-12],[13,-4]].forEach(([px,py])=>K.ellipse(c,px,py,4,5,WHITE,null));
  }else{// soil layers
    const w=46,h=34,x0=x-w/2,y0=y-h/2+2;
    [[C.sand,0,10],[C.rock,10,12],['#5b4a36',22,12]].forEach(([col,o,hh])=>{c.fillStyle=col;c.fillRect(x0,y0+o,w,hh);});
    c.strokeStyle=WHITE;c.strokeRect(x0,y0,w,h);
    const wy=y0+16+2*Math.sin(t*1.5);K.sline(c,[[x0+10,wy],[x0+18,wy-3],[x0+26,wy],[x0+34,wy-3]],WHITE,2.5);
  }
  c.restore();}
// icons of the three "data to add" cards (cyan = data still needed; no answers, no comparison arrows)
function needIcon(c,i,g,t){const x=g.x+14,y=g.y+12;c.save();c.strokeStyle=CYAN;c.fillStyle=CYAN;c.lineWidth=2.5;c.lineCap='round';c.lineJoin='round';
  if(i===0){// two plots of the same size; one ruler length above each
    [0,62].forEach((o,j)=>{c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*10;c.strokeRect(x+o,y+16,42,42);c.restore();
      K.sline(c,[[x+o,y+6],[x+o+42,y+6]],CYAN,2.5);K.sline(c,[[x+o,y+1],[x+o,y+11]],CYAN,2.5);K.sline(c,[[x+o+42,y+1],[x+o+42,y+11]],CYAN,2.5);
      c.save();c.font=K.MONO(22);c.textAlign='center';c.fillStyle=CYAN;c.fillText(j?'B':'A',x+o+21,y+45);c.restore();});
  }else if(i===1){// clock + record board
    const cx=x+24,cy=y+30,a=t*1.2;circle(c,cx,cy,22,'rgba(11,26,21,.9)',CYAN,2.5);
    K.sline(c,[[cx,cy],[cx+14*Math.sin(a),cy-14*Math.cos(a)]],CYAN,2.5);K.sline(c,[[cx,cy],[cx+9*Math.sin(a/12),cy-9*Math.cos(a/12)]],CYAN,3);
    const bx=x+64,by=y+6;D.round(c,bx,by,40,50,5,'rgba(11,26,21,.9)',CYAN);D.round(c,bx+12,by-4,16,8,3,CYAN,null);
    const n=1+Math.floor(mod(t*.8,3));for(let r=0;r<3;r++){K.sline(c,[[bx+8,by+18+r*11],[bx+32,by+18+r*11]],rgba(CYAN,r<n?1:.35),2.5);}
  }else{// three stacked plots, x3
    for(let j=2;j>=0;j--){const o=j*7+(j===0?1.5*Math.sin(t*2):0);D.round(c,x+o,y+16-o,38,38,4,'rgba(11,26,21,.92)',CYAN);}
    c.save();c.font=K.MONO(22);c.fillStyle=CYAN;c.fillText('×3',x+66,y+46);c.restore();
  }
  c.restore();}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){
  if(k===0)return[['knob',T.legKnob],['sw',T.legSw]];
  if(k===1)return[['box',T.legBox],['num',T.legNum]];
  if(k===2)return[['dash',T.legDash]];
  return[['cyan',T.legCyan],['plot',T.legPlot]];}
function swatch(c,kind,x,y,t){const cx=x+20,cy=y+18;
  if(kind==='knob'){K.sline(c,[[cx,y+2],[cx,y+34]],WHITE,3);circle(c,cx,cy,10,'rgba(11,26,21,.92)',WHITE,2);}
  else if(kind==='sw'){D.round(c,cx-14,cy-14,14,28,4,AVG_A,WHITE);D.round(c,cx,cy-14,14,28,4,AVG_B,WHITE);}
  else if(kind==='box'){D.round(c,x+2,y+4,36,28,6,null,WHITE);}
  else if(kind==='num'){mark(c,1,cx,cy);}
  else if(kind==='dash'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*8;D.round(c,x+2,y+4,36,28,6,null,UNK);c.restore();}
  else if(kind==='cyan'){D.round(c,x+2,y+4,36,28,6,'rgba(85,233,255,.07)',CYAN);}
  else if(kind==='plot'){c.save();c.setLineDash([6,5]);c.lineDashOffset=-t*8;c.strokeStyle=CYAN;c.lineWidth=2.5;c.strokeRect(x+6,y+4,28,28);c.restore();}
}
function card(c,k,st,moving,x,u,tau,t){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+14,{maxW:iw});
  let y=R.y+14+hr.h+14;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20,col=j===3?CYAN:WHITE;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,40,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true,col));
    text(c,p,ix+42,cy+8,22,on>.5?col:MUTED);
    y+=42;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*30;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,30));
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(40,blines(c,p,iw-50).length*28+10));
  const ly=R.y+R.h-12-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{swatch(c,kind,ix,yy,t);bwrap(c,p,ix+50,yy+24,iw-50,22,WHITE,28);yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.green=draw;
window.EnvironmentDraw.green.dbg=s_dbg;
})();

/* Unit 11 lesson 1 · "count" canvas (species-diversity tab, view 0), 2026-10-24. Individuals or kinds? (plan section 2, count).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (dashes and rings keep moving).
 *  0 count individuals: two equally large plots A, B (two square windows of the same meadow EC2). Animals pop in one by one,
 *    each with a green number badge; green "Individuals" bars count up: A 12, B 8.
 *  1 count kinds: the same animals glide into one row per kind; a cyan kind marker lights per row; cyan "Kinds" bars: A 3, B 5.
 *  2 two changes: 100 more grasshoppers pour into A (A individuals 12 -> 112, bar axis rescales; kinds stay 3);
 *    one caterpillar (a kind B lacked) walks into B (kinds 5 -> 6).
 *  3 a real scene: BD4 reef. Cyan boxes mark 10 fish types that look different (two small blue-green fish share one type);
 *    3 small far fish get white dashed boxes with "?" (not identified); a white dashed "not seen" box over the coral thicket;
 *    capsules: place / area / time / method still to be written ("?").
 * Colours (plan 1.4): individuals green, kinds cyan (species diversity), uncertain = white dashed. Each animal kind has its own outline
 * colour, always shown with its name in the legend row: grasshopper yellow, caterpillar white, ladybird orange, snail violet,
 * frog pink, mantis periwinkle. No diversity index; counts are teaching numbers.
 * Pictures (K.SIZE, PIL): EC4_grasshopper 788x446, EC4_caterpillar 633x331, EC15_field_snail 655x350 (a land snail: named "snail"),
 * EC5_frog 657x581, EC5_mantis 803x760, EC19_ladybird_aphids 1400x878 -> ladybird crop (770,180,540,360) px,
 * EC2_meadow_scene 1672x933 -> plot windows A (0,40,460,460) px and B (480,40,460,460) px (no butterfly, sparrows or spider web inside),
 * environment_ai_1024/BD4_reef 1672x933; fish boxes below are picture pixels measured with PIL.
 * New labels (P(), not in K.LAB) are listed in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,YELLOW=C.yellow,IND=K.COL.count,KIND=K.COL.species;

// ── new labels ────────────────────────────────────────────────────────────
const T={
 plotA:P('樣區 A','Plot A'),plotB:P('樣區 B','Plot B'),
 ind:P('個體數','Individuals'),kinds:P('種類數','Kinds'),
 sameMeadow:P('同一片草原','same meadow'),equal:P('一樣大','equal'),sameDay:P('同一天','same day'),byEye:P('目視數','by eye'),
 s0:P('數個體：A 比較多','Counting individuals: A has more'),
 s1:P('個體多，不等於種類多','More individuals does not mean more kinds'),
 s2:P('兩種改變，不是同一件事','These are two different changes'),
 plus100:P('+100 隻（同一種）','+100 (same kind)'),plus1:P('+1 種（新的）','+1 kind (new)'),
 typesSeen:n=>P(`看起來不同：${n} 類`,`Look different: ${n} types`),
 notId:P('無法辨認：3 隻','Not identified: 3'),notSeen:P('沒看到：？','Not seen: ?'),
 noEach:P('未辨認的，不能每隻算一種','Unidentified fish cannot each count as one kind'),
 seenNot:P('看不到，不等於不存在','Not seen does not mean not there'),
 before:P('比較前先寫清楚：','Before comparing, state:'),
 teach:P('數字為教學示意','Numbers are for teaching only')
};
const NAME={gh:L('grasshopper','蚱蜢','Grasshopper'),cat:P('毛蟲','Caterpillar'),lb:P('瓢蟲','Ladybird'),sn:P('蝸牛','Snail'),fr:P('澤蛙','Paddy frog'),ma:L('mantis','螳螂','Mantis')};
const COLR={gh:'#fde047',cat:'#f2ecd9',lb:'#fb923c',sn:'#c4b5fd',fr:'#f472b6',ma:'#8fb4ff'};
const ORDER=['gh','cat','lb','sn','fr','ma'];
const PIC={gh:['EC4_grasshopper.png'],cat:['EC4_caterpillar.png'],sn:['EC15_field_snail.png'],fr:['EC5_frog.png'],ma:['EC5_mantis.png'],
  lb:['EC19_ladybird_aphids.png',[770/1400,180/878,540/1400,360/878],1.5]};

// ── layout ────────────────────────────────────────────────────────────────
const PLOT={A:{x:24,y:58,w:330,h:330},B:{x:378,y:58,w:330,h:330}};
const MEADOW='EC2_meadow_scene.jpg',CROP={A:[0,40/933,460/1672,460/933],B:[480/1672,40/933,460/1672,460/933]};
const BAR={x:726,y:58,w:218,h:330};
const Y_LEG=400,Y_CAP=452,Y_ST=508;
// scattered positions (plot-relative centres) and the kind of each animal
const SCAT={
 A:[[50,52,'gh'],[132,46,'cat'],[214,58,'gh'],[286,88,'sn'],[64,138,'gh'],[150,128,'cat'],[236,152,'gh'],[46,226,'cat'],[124,214,'gh'],[206,238,'gh'],[286,216,'cat'],[156,290,'sn']],
 B:[[70,70,'gh'],[190,58,'lb'],[280,120,'ma'],[110,160,'fr'],[210,190,'lb'],[60,262,'sn'],[160,276,'ma'],[268,262,'gh']]};
const ROWS={A:['gh','cat','sn'],B:['gh','lb','sn','fr','ma','cat']};
const TILE0=58,TILE1=46,ROW_H=52,ROW_X=56,ROW_DX=48,ROW_Y=34;
// row positions: animal i of side S goes to its kind's row, in order of appearance
function rowPos(S){const cnt={};return SCAT[S].map(([,,sp])=>{const r=ROWS[S].indexOf(sp),j=cnt[sp]=(cnt[sp]||0)+1;return[ROW_X+(j-1)*ROW_DX,ROW_Y+r*ROW_H];});}
const RP={A:rowPos('A'),B:rowPos('B')};
const NEWB=[ROW_X,ROW_Y+5*ROW_H];                        // the caterpillar that arrives in B (row 6)
// 100 small grasshoppers: 10 x 10 under A's three rows
const CLOUD={x:16,y:178,w:298,h:142};
const cloudPos=i=>[CLOUD.x+15+(i%10)*29.8+((i/10|0)%2)*6-3,CLOUD.y+10+(i/10|0)*13.6];

// reef
const REEF='environment_ai_1024/BD4_reef.jpg',RR={x:20,y:20,w:620,h:620*933/1672};
const rs=RR.w/1672,rbox=b=>({x:RR.x+b[0]*rs,y:RR.y+b[1]*rs,w:(b[2]-b[0])*rs,h:(b[3]-b[1])*rs});
const TYPES=[[[205,120,400,230]],[[528,250,722,330]],[[1110,132,1300,262]],[[1345,140,1620,335]],[[895,302,1078,408]],[[405,405,602,595]],
  [[1045,455,1228,538]],[[1292,345,1628,452]],[[395,635,735,808]],[[155,262,255,310],[75,325,185,372]]];
const UNK=[[52,438,172,492],[232,458,342,514],[132,520,258,578]];
const UNSEEN=[1262,575,1660,925];
const LEG3={x:656,y:20,w:284};

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',dash=null,dashOff=0}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  if(dash){D.round(c,bx,y,w,h,h/2,fill,null);c.save();c.setLineDash(dash);c.lineDashOffset=dashOff;D.round(c,bx,y,w,h,h/2,null,rgba(col,.9));c.restore();}
  else D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function ring(c,p,t,col){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
// one animal in a tile with its kind's outline colour
function animal(c,sp,cx,cy,size,a=1){
  withA(c,a,()=>{
    D.round(c,cx-size/2,cy-size/2,size,size,10,'rgba(11,26,21,.82)',null);
    c.save();c.lineWidth=3;c.strokeStyle=COLR[sp];c.beginPath();c.roundRect(cx-size/2,cy-size/2,size,size,10);c.stroke();c.restore();
    const [f,crop,ar]=PIC[sp],pad=size*.1,bw=size-pad*2;
    if(crop){const w=bw,h=w/ar;K.drawIn(c,f,{x:cx-w/2,y:cy-h/2,w,h},{crop});}
    else K.place(c,f,cx-bw/2,cy-bw/2,bw,bw);
  });
}
function badge(c,n,x,y,col,ink=C.ink,r=15){circle(c,x,y,r,col,ink,2);c.save();c.font=K.MONO(22);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function dashRect(c,r,col,t,w=2.5){c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*14;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,6);c.stroke();c.restore();}
function plotFrame(c,S,t){
  const r=PLOT[S];
  c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,12);c.clip();
  K.drawIn(c,MEADOW,r,{crop:CROP[S]});c.fillStyle='rgba(11,26,21,.38)';c.fillRect(r.x,r.y,r.w,r.h);c.restore();
  c.save();c.lineWidth=4;c.strokeStyle=rgba(WHITE,.9);c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,12);c.stroke();c.restore();
}
// a horizontal bar: label, track, value
function bar(c,lab,y,val,max,col,t,a){
  const x0=BAR.x+40,len=BAR.w-40-62,v=Math.max(0,val),w=len*clamp(v/max);
  text(c,lab,BAR.x+14,y+20,22,WHITE);
  D.round(c,x0,y,len,26,8,'rgba(11,26,21,.7)',rgba(col,.35));
  if(w>1){D.round(c,x0,y,Math.max(10,w),26,8,col,null);
    const g=mod(t*.5);withA(c,.35*(1-g)*a,()=>D.round(c,x0,y,Math.max(10,w*g),26,8,WHITE,null));}
  text(c,String(Math.round(v)),BAR.x+BAR.w-10,y+21,22,col,'right',K.MONO);
}
function pillRow(c,items,y,{minX=24,maxX=936,gap=12}={}){                // items: [p,col,opts]; centred row
  const ws=items.map(([p])=>measure(c,p,22)+28),tot=ws.reduce((s,w)=>s+w,0)+gap*(items.length-1);
  let x=(minX+maxX)/2-tot/2;const out=[];
  items.forEach(([p,col,o],i)=>{out.push(tag(c,p,x,y,Object.assign({col},o||{})));x+=ws[i]+gap;});return out;
}
const cap=(k,v)=>P(`${k[0]}：${v[0]}`,`${k[1]}: ${v[1]}`);

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.6);
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.countSt||(s.countSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}   // the same step clicked again: replay it
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d,s1);if(!moving)return now;const was=vis(st.from,20,s0,0,s1);return now>=was?now:mix(was,now,u);};
  // the two scenes (plots, reef) swap out-then-in, so their texts never overlap
  const sc=j=>j>=3?1:0,swap=moving&&sc(st.from)!==sc(k);
  const plotsA=swap?(sc(k)===0?smooth(clamp(x*2-1)):1-smooth(clamp(x*2))):A(0,0,2);
  const reefA=swap?(sc(k)===1?smooth(clamp(x*2-1)):1-smooth(clamp(x*2))):A(3,0,3);

  // ── steps 0-2: the two plots ──
  if(plotsA>0)withA(c,plotsA,()=>{
    plotFrame(c,'A',t);plotFrame(c,'B',t);
    tag(c,T.plotA,PLOT.A.x,12,{col:WHITE,active:true});tag(c,T.plotB,PLOT.B.x,12,{col:WHITE,active:true});
    // layout mix: 0 scattered, 1 rows
    const rowT=k>=1&&k<=2?1:0,rowF=st.from>=3?rowT:st.from>=1&&st.from<=2?1:0,rm=moving?mix(rowF,rowT,u):rowT;
    const size=mix(TILE0,TILE1,rm);
    // pop-in timing in step 0 (A first, then B)
    const popAt=(S,i)=>.5+(S==='A'?i:12+i)*.18;
    const popped=(S,i)=>k===0?clamp((tau-popAt(S,i))/.3):1;
    let cntA=0,cntB=0;
    for(const S of ['A','B']){const r=PLOT[S];
      SCAT[S].forEach(([sx,sy,sp],i)=>{
        const p=popped(S,i);if(p<=0)return;if(p>=1){if(S==='A')cntA++;else cntB++;}
        const [rx,ry]=RP[S][i],cx=r.x+mix(sx,rx,rm),cy=r.y+mix(sy,ry,rm),sc=.6+.4*ease(p);
        animal(c,sp,cx,cy,size*sc,p);
      });
    }
    // number badges (step 0)
    const badgeA=A(0,0,0)*clamp(1-rm*4);
    if(badgeA>0)withA(c,badgeA,()=>{for(const S of ['A','B']){const r=PLOT[S];
      SCAT[S].forEach(([sx,sy],i)=>{const p=popped(S,i);if(p<=0)return;const [rx,ry]=RP[S][i];
        withA(c,p,()=>badge(c,i+1,r.x+mix(sx,rx,rm)-size/2+4,r.y+mix(sy,ry,rm)-size/2+4,IND));});}});
    // kind markers (steps 1-2)
    const rowsA=A(1,0,2);let kA=0,kB=0;
    const markAt=(S,j)=>MOVE+.3+(S==='A'?j:3+j)*.35;
    if(rowsA>0)withA(c,rowsA,()=>{for(const S of ['A','B']){const r=PLOT[S],n=S==='A'?3:5;
      for(let j=0;j<n;j++){const a=k===1?clamp((tau-markAt(S,j))/.3):1;if(a<=0)continue;if(a>=1){if(S==='A')kA++;else kB++;}
        withA(c,a,()=>badge(c,j+1,r.x+20,r.y+ROW_Y+j*ROW_H,KIND));}}});
    // step 2: 100 more grasshoppers in A, one new kind in B
    const chA=A(2,0,2);let poured=0,newB=0;
    if(chA>0)withA(c,chA,()=>{
      const r=PLOT.A,a0=MOVE+.2;
      const fr={x:r.x+CLOUD.x,y:r.y+CLOUD.y,w:CLOUD.w,h:CLOUD.h};
      c.save();c.lineWidth=2.5;c.strokeStyle=rgba(COLR.gh,.85);c.beginPath();c.roundRect(fr.x,fr.y,fr.w,fr.h,10);c.stroke();c.restore();
      for(let i=0;i<100;i++){const t0=a0+i*.024,p=k===2?clamp((tau-t0)/.45):1;if(p<=0)continue;if(p>=1)poured++;
        const [ex,ey]=cloudPos(i),q=ease(p),px=r.x+ex,py=r.y+mix(-30-(i%7)*6,ey,q);
        withA(c,Math.min(1,p*2),()=>K.at(c,'EC4_grasshopper.png',px,py,27));}
      const ta=tag(c,T.plus100,PLOT.A.x+PLOT.A.w,12,{al:'right',col:COLR.gh});if(k===2)ring(c,ta,t,COLR.gh);
      // B: a caterpillar walks in from the right edge into a new sixth row
      const rb=PLOT.B,b0=a0+100*.024+.4,p=k===2?clamp((tau-b0)/.9):1;
      if(p>0){const ex=rb.x+NEWB[0],ey=rb.y+NEWB[1],sx=rb.x+rb.w+40;
        c.save();c.beginPath();c.roundRect(rb.x,rb.y,rb.w,rb.h,12);c.clip();animal(c,'cat',mix(sx,ex,smooth(p)),ey,TILE1);c.restore();
        if(p>=1){newB=1;badge(c,6,rb.x+20,rb.y+ROW_Y+5*ROW_H,KIND);}}
      const tb=tag(c,T.plus1,PLOT.B.x+PLOT.B.w,12,{al:'right',col:KIND});if(k===2)ring(c,tb,t+.4,KIND);
    });
    // bars
    D.round(c,BAR.x,BAR.y,BAR.w,BAR.h,14,'rgba(22,51,43,.94)',C.edge);
    const indA=cntA+(k===2?poured:0),indB=cntB+(k===2?newB:0);
    // the individual axis grows smoothly with A (rescale in step 2)
    const maxI=Math.max(14,indA*1.06);
    text(c,T.ind,BAR.x+14,BAR.y+34,22,IND);
    bar(c,'A',BAR.y+52,indA,maxI,IND,t,1);bar(c,'B',BAR.y+92,indB,maxI,IND,t+.3,1);
    withA(c,rowsA,()=>{
      text(c,T.kinds,BAR.x+14,BAR.y+174,22,KIND);
      bar(c,'A',BAR.y+192,kA,7,KIND,t+.6,1);bar(c,'B',BAR.y+232,kB+newB,7,KIND,t+.9,1);
    });
    // legend: outline colour + name of every kind
    pillRow(c,ORDER.map(sp=>[NAME[sp],COLR[sp]]),Y_LEG);
    // place / area / time / method
    pillRow(c,[[cap(L('place','地點','Place'),T.sameMeadow),WHITE],[cap(L('area','面積','Area'),T.equal),WHITE],[cap(L('time','時間','Time'),T.sameDay),WHITE],[cap(L('method','方法','Method'),T.byEye),WHITE]],Y_CAP);
    // the step's statement
    [[T.s0,IND,0],[T.s1,KIND,1],[T.s2,WHITE,2]].forEach(([p,col,j])=>{const a=A(j,j===0?2.8:j===1?2.8:4.6,j);
      withA(c,a,()=>{const r=tag(c,p,24,Y_ST,{col,active:false});if(k===j)ring(c,r,t,col);});});
  });

  // ── step 3: the reef ──
  if(reefA>0)withA(c,reefA,()=>{
    K.drawIn(c,REEF,RR,{radius:12});
    c.save();c.lineWidth=3;c.strokeStyle=rgba(WHITE,.7);c.beginPath();c.roundRect(RR.x,RR.y,RR.w,RR.h,12);c.stroke();c.restore();
    const at0=MOVE+.3;
    let nT=0;
    TYPES.forEach((bs,i)=>{const a=k===3?clamp((tau-at0-i*.3)/.3):1;if(a<=0)return;nT++;
      withA(c,a,()=>bs.forEach((b,j)=>{const r=rbox(b);
        c.save();c.lineWidth=3;c.strokeStyle=KIND;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,6);c.stroke();c.restore();
        if(j===0)badge(c,i+1,r.x,r.y,KIND,C.ink,14);}));});
    const u0=at0+10*.3+.3;
    UNK.forEach((b,i)=>{const a=k===3?clamp((tau-u0-i*.25)/.3):1;if(a<=0)return;
      withA(c,a,()=>{const r=rbox(b);dashRect(c,r,WHITE,t);
        circle(c,r.x-4,r.y+r.h/2,14,'rgba(11,26,21,.92)',WHITE,2);text(c,'?',r.x-4,r.y+r.h/2+8,22,WHITE,'center');});});
    const n0=u0+1.1,an=k===3?clamp((tau-n0)/.4):1;
    if(an>0)withA(c,an,()=>{const r=rbox(UNSEEN);dashRect(c,r,WHITE,t,3);
      tag(c,P('沒看到','Not seen'),r.x+r.w/2,r.y+r.h/2-14,{al:'center',col:WHITE,dash:[7,5],dashOff:-t*10});});
    // legend panel on the right
    D.round(c,LEG3.x,LEG3.y,LEG3.w,RR.h,14,'rgba(22,51,43,.94)',C.edge);
    const rowsL=[[T.typesSeen(10),KIND,false,at0,T.typesSeen(nT)],[T.notId,WHITE,true,u0],[T.notSeen,WHITE,true,n0]];
    let yy=LEG3.y+22;
    rowsL.forEach(([p,col,dsh,t0,shown])=>{const a=k===3?clamp((tau-t0)/.4):1;
      const ix=LEG3.x+16,tw=LEG3.w-16-44-12,lines=K.splitLines(c,D.tr(p),tw,22).length,hh=Math.max(36,lines*30);
      withA(c,a,()=>{const r={x:ix,y:yy+(hh-26)/2-6,w:40,h:26};
        if(dsh)dashRect(c,r,col,t);else{c.save();c.lineWidth=3;c.strokeStyle=col;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,6);c.stroke();c.restore();}
        K.wrap(c,shown||p,ix+52,yy+16,tw,22,col,30);});
      yy+=hh+26;});
    // statements and the capsules to fill in
    const s1=k===3?clamp((tau-(n0+.5))/.4):1,s2=k===3?clamp((tau-(n0+.9))/.4):1,s3=k===3?clamp((tau-(n0+1.3))/.4):1;
    withA(c,s1,()=>{const r=tag(c,T.noEach,24,RR.y+RR.h+14,{col:WHITE});if(k===3)ring(c,r,t,WHITE);});
    withA(c,s2,()=>{const r=tag(c,T.seenNot,24,RR.y+RR.h+64,{col:WHITE});if(k===3)ring(c,r,t+.5,WHITE);});
    withA(c,s3,()=>{
      const items=[[L('place','地點','Place'),WHITE],[L('area','面積','Area'),WHITE],[L('time','時間','Time'),WHITE],[L('method','方法','Method'),WHITE]]
        .map(([p,col])=>[P(`${p[0]} ？`,`${p[1]} ?`),col,{dash:[7,5],dashOff:-t*10}]);
      const w0=measure(c,T.before,22),ws=items.reduce((s,[p])=>s+measure(c,p,22)+28+12,0)-12,x0=480-(w0+12+ws)/2;
      text(c,T.before,x0,Y_ST+26,22,YELLOW);
      pillRow(c,items,Y_ST,{minX:x0+w0+12,maxX:x0+w0+12+ws});
    });
  });

  // notes (all steps)
  text(c,T.teach,24,590,22,MUTED,'left');
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EnvironmentDraw.count=draw;
})();

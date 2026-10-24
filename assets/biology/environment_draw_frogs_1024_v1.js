/* Unit 11 lesson 1 · "frogs" canvas (genetic-variation tab, view 0), 2026-10-24. One species, many looks (plan section 2, frogs).
 * The hero is the harlequin ladybird (Harmonia axyridis); the textbook Swinhoe's frog photos stay in the "Textbook photos" view.
 * Four steps, 10 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (beetles breathe, dashes march, rings pulse).
 * Left 2/3 = stage (x 16..636), right 1/3 = step card (x 652..944): pink "Genetic diversity" header, the four step labels, the step's
 * title (VIEWS.frogs.names) and a legend for the step.
 *  0 compare looks: six beetles pop in (2 rows x 3); each gets a pink-framed capsule "colour / spots" (only visible traits).
 *    Spots are described, not counted (the AI pictures' spot counts are not reliable; see the colour/spot table below).
 *  1 same species? the capsules fade, the six glide into one white frame "one species: harlequin ladybird"; the seven-spot ladybird
 *    (EC19 crop, "another species") fades in on the right; a yellow dashed link "look alike" joins it to the red, black-blotched beetle;
 *    pills "look different, same species" (white) / "look alike, different species" (yellow).
 *  2 look inside (scene swaps out-then-in): body -> cell -> one chromosome pair, with dashed zoom cones; two positions on the pair,
 *    pink / white squares = two gene versions; below, position 1 in three individuals (pink-pink, pink-white, white-white);
 *    note "schematic, not a real gene sequence".
 *  3 looks != genes (scene swaps): row A two identical-looking beetles with different gene squares ("looks =", "genes ≠");
 *    row B two different-looking beetles (many spots / few dots) with the same gene squares and drawn thermometers
 *    (cooler / warmer while a larva): "looks ≠", "genes =", "environment ≠". Pill "looks alone cannot reveal the genes".
 *    Never "one colour = one genotype".
 * Colours (plan 1.4): genetic diversity pink #f472b6, always with its name (card header). Gene version 1 pink, version 2 white.
 * "One species" frame white; "look alike" yellow dashes; thermometer cool #8fb4ff / warm yellow, always labelled.
 * Pictures (K.SIZE, all cut out, alpha 0 corners): environment_ai_1024/BD1_ladybird_* ~415x488..525;
 * EC19_ladybird_aphids 1400x878 -> seven-spot crop (750,150,580,500) px (red elytra bbox 895..1286 x 186..509, legs to ~640).
 * New labels (P(), not in K.LAB) are listed in T and BEE below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=10,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,YELLOW=C.yellow,PINK=K.COL.genetic,COOL='#8fb4ff',WARM=C.yellow;
const E=K.ENV||'environment_ai_1024/';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 short:[P('比外表','Compare looks'),P('同種？不同種？','Same species?'),P('看進體內','Look inside'),P('外表≠基因','Looks ≠ genes')],
 names:[P('六隻異色瓢蟲：底色和斑點都不同','Six harlequin ladybirds: colour and spots differ'),P('長得不一樣，可以是同一種','Looking different can still be one species'),
        P('鏡頭推進：同一個位置有不同版本','Zooming in: one position, different versions'),P('外表同時受遺傳與環境影響','Looks come from both genes and environment')],
 within:P('同一種之內的差異','Differences within one species'),
 name:P('異色瓢蟲（示意）','Harlequin ladybird (schematic)'),
 colour:P('底色','Colour'),spots:P('斑點','Spots'),
 oneSp:P('同一種：異色瓢蟲','One species: harlequin ladybird'),
 seven:P('七星瓢蟲','Seven-spot ladybird'),another:P('（另一種）','(another species)'),
 alike:P('長得像','Look alike'),
 diffSame:P('外表不同，同一種','Look different, same species'),alikeDiff:P('外表相似，不同種','Look alike, different species'),
 body:P('身體','Body'),cell:P('細胞','Cell'),pair:P('一對染色體','A chromosome pair'),
 pos:n=>P(`位置 ${n}`,`Position ${n}`),
 pos1three:P('位置 1，三隻個體','Position 1 in 3 individuals'),
 notSeq:P('示意，不是真的基因序列','Schematic, not a real gene sequence'),
 sameLook:P('外表一樣','Same looks'),diffLook:P('外表不同','Different looks'),
 looksEq:P('外表 =','Looks ='),looksNe:P('外表 ≠','Looks ≠'),genesEq:P('基因組合 =','Genes ='),genesNe:P('基因組合 ≠','Genes ≠'),envNe:P('環境 ≠','Environment ≠'),
 cool:P('較冷','Cooler'),warm:P('較暖','Warmer'),
 noRead:P('不能只看外表就讀出基因','Looks alone cannot reveal the genes'),
 legFrame:P('同種內看得見的差異','Visible differences in one species'),
 legOne:P('同一種','One species'),legAlike:P('長得像','Look alike'),
 v1:P('基因版本一','Gene version 1'),v2:P('基因版本二','Gene version 2'),
 legTemp:P('環境：幼蟲時溫度','Larva temperature')
};
// six beetles: what the AI pictures show (looked at one by one); spots are described, not counted
const BEE=[
 {f:'orange19',base:P('橘紅','orange-red'),spot:P('很多小黑點','many small black'),sw:'#df7f42'},
 {f:'orange0',base:P('橘','orange'),spot:P('沒有黑點','none'),sw:'#eb9e2a'},
 {f:'patch',base:P('紅','red'),spot:P('大塊黑斑','big black patches'),sw:'#d8432a'},
 {f:'pale',base:P('淡黃','pale yellow'),spot:P('細小深色點','tiny dark dots'),sw:'#f2c98f'},
 {f:'black2red',base:P('黑','black'),spot:P('大紅斑','big red'),sw:'#2b3136'},
 {f:'black4red',base:P('黑','black'),spot:P('小紅斑','small red'),sw:'#2b3136'}
];
const FILE=i=>E+'BD1_ladybird_'+BEE[i].f+'.png';
const SEVEN='EC19_ladybird_aphids.png',SEVEN_CROP=[750/1400,150/878,580/1400,500/878],SEVEN_AR=580/500;

// ── layout ────────────────────────────────────────────────────────────────
const CARD={x:652,y:16,w:292,h:550};
// step 0 grid: 3 columns x 2 rows, picture box 100 high, capsule below
const GX=[119,326,533],GY=[64,314],IMG_H0=100,CAP_W=196;
const gridPos=i=>[GX[i%3],GY[i/3|0]+IMG_H0/2];
// step 1 group frame (left) and the seven-spot ladybird (right)
const GROUP={x:24,y:70,w:360,h:300},GCX=[90,204,318],GCY=[180,300],IMG_H1=90;
const groupPos=i=>[GCX[i%3],GCY[i/3|0]];
const SEV={cx:528,cy:214,w:176,bw:216};
const Y_P1=400,Y_P2=452;
// step 2 panels
const BODY={x:24,y:70,w:150,h:190},CELL={x:200,y:70,w:160,h:190},CHR={x:384,y:70,w:248,h:420};
const ZB={x:85,y:176,s:28},NUC={x:280,y:165,r:28},ZN={x:248,y:133,s:64};
const ROD=[544,598],ROD_W=34,ROD_Y0=126,ROD_Y1=470,CEN=292,BAND=[212,394];
const GENE2=[[1,0],[0,1]];                            // the zoomed beetle: position 1 pink/white, position 2 white/pink
const IND={x:24,y:318,w:336,h:172},IND_BEE=[1,4,3],IND_G=[[1,1],[1,0],[0,0]];
// step 3 rows
const RA=64,RB=286,BX=[100,300],TH_DX=96,TAG_R=632;
const GENE_A=[[[1,1],[0,0]],[[1,0],[0,0]]],GENE_B=[[0,0],[1,0]];

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',dash=null,dashOff=0}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  if(dash){D.round(c,bx,y,w,h,h/2,fill,null);c.save();c.setLineDash(dash);c.lineDashOffset=dashOff;D.round(c,bx,y,w,h,h/2,null,rgba(col,.9));c.restore();}
  else D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,active,col=WHITE){circle(c,x,y,15,active?col:'rgba(11,26,21,.92)',active?col:rgba(MUTED,.8),2);
  c.save();c.font=K.MONO(22);c.fillStyle=active?C.ink:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function stroke(c,r,col,w=3,rad=12,dash=null,off=0){c.save();if(dash){c.setLineDash(dash);c.lineDashOffset=off;}c.lineWidth=w;c.strokeStyle=col;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,rad);c.stroke();c.restore();}
function dline(c,a,b,col,t,w=2.5){c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*14;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.restore();}
// one beetle centred at (cx, cy), h px high, breathing a little
function bee(c,i,cx,cy,h,t,a=1){const [W,H]=K.dim(FILE(i)),b=1+.02*Math.sin(t*1.8+i*1.1),hh=h*b,ww=hh*W/H;
  withA(c,a,()=>K.drawIn(c,FILE(i),{x:cx-ww/2,y:cy-hh/2,w:ww,h:hh}));}
function seven(c,cx,cy,w,t,a=1){const b=1+.02*Math.sin(t*1.6+.5),ww=w*b,hh=ww/SEVEN_AR;withA(c,a,()=>K.drawIn(c,SEVEN,{x:cx-ww/2,y:cy-hh/2,w:ww,h:hh},{crop:SEVEN_CROP}));}
// a gene square: version 1 pink, version 2 white
function sq(c,x,y,v,s=24,glowA=0){
  if(glowA>0)withA(c,glowA,()=>D.round(c,x-4,y-4,s+8,s+8,7,null,rgba(v?PINK:WHITE,.9)));
  D.round(c,x,y,s,s,5,v?PINK:WHITE,C.ink);
}
// gene strip: "1" [a][b]   "2" [a][b], centred at cx
function strip(c,cx,y,g,t,ph=0){
  const w14=measure(c,'1',22,K.MONO),tot=2*(w14+6+24+4+24)+14;let x=cx-tot/2;
  g.forEach((pair,j)=>{text(c,String(j+1),x,y+20,22,MUTED,'left',K.MONO);x+=w14+6;
    pair.forEach((v,q)=>{sq(c,x,y,v,24,.5+.5*Math.sin(t*2.2+ph+j+q));x+=24+4;});x+=14-4;});
}
function thermo(c,cx,top,level,col,t){
  const tubeH=86,lv=clamp(level+.03*Math.sin(t*1.5));
  D.round(c,cx-9,top,18,tubeH+8,9,'rgba(11,26,21,.9)',WHITE);
  circle(c,cx,top+tubeH+14,15,'rgba(11,26,21,.9)',WHITE,2);
  circle(c,cx,top+tubeH+14,10,col,null);
  const fh=(tubeH-6)*lv;D.round(c,cx-4,top+tubeH+6-fh,8,fh+6,4,col,null);
  for(let i=1;i<=4;i++)K.sline(c,[[cx+9,top+i*18],[cx+16,top+i*18]],rgba(WHITE,.7),2);
}
// capsule with two attribute lines (step 0); returns its height
function capsule(c,i,cx,y,t,on){
  const b=BEE[i],l1=P(`${T.colour[0]}：${b.base[0]}`,`${T.colour[1]}: ${b.base[1]}`),l2=P(`${T.spots[0]}：${b.spot[0]}`,`${T.spots[1]}: ${b.spot[1]}`);
  const tw=CAP_W-24-26,r1=K.splitLines(c,D.tr(l1),tw,22),r2=K.splitLines(c,D.tr(l2),CAP_W-24,22),h=(r1.length+r2.length)*28+18;
  const R={x:cx-CAP_W/2,y,w:CAP_W,h};
  D.round(c,R.x,R.y,R.w,R.h,16,'rgba(11,26,21,.9)',null);stroke(c,R,PINK,3,16);
  if(on)ring(c,R,t,PINK);
  circle(c,R.x+22,y+24,9,b.sw,WHITE,2);
  r1.forEach((r,q)=>text(c,r,R.x+38,y+31+q*28,22,WHITE));
  r2.forEach((r,q)=>text(c,r,R.x+12,y+31+(r1.length+q)*28,22,WHITE));
  return h;
}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.6);
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.frogsSt||(s.frogsSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}   // the same step clicked again: replay it
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d,s1);if(!moving)return now;const was=vis(st.from,20,s0,0,s1);return now>=was?now:mix(was,now,u);};
  const at=(d,dur=.45)=>clamp((tau-d)/dur);            // entrance inside the current step
  // scenes: 0 = steps 0-1 (the six beetles move), 1 = step 2, 2 = step 3; different scenes swap out-then-in
  const sc=j=>j<=1?0:j-1,swap=moving&&sc(st.from)!==sc(k);
  const sceneA=n=>swap?(sc(k)===n?smooth(clamp(x*2-1)):sc(st.from)===n?1-smooth(clamp(x*2)):0):(sc(k)===n?1:0);

  // ── scene 0: steps 0-1 ──
  const a0=sceneA(0);
  if(a0>0)withA(c,a0,()=>{
    const gT=k===1?1:0,gF=st.from===1?1:0,g=moving&&sc(st.from)===0?mix(gF,gT,u):gT;   // 0 grid, 1 group
    // step 1: group frame and its label (behind the beetles)
    const fr=A(1,MOVE,1);
    withA(c,fr,()=>{D.round(c,GROUP.x,GROUP.y,GROUP.w,GROUP.h,16,'rgba(22,51,43,.85)',null);stroke(c,GROUP,WHITE,3.5,16);
      const r=tag(c,T.oneSp,GROUP.x+GROUP.w/2,GROUP.y+12,{al:'center',col:WHITE});if(k===1)ring(c,r,t,WHITE);});
    // the six beetles
    for(let i=0;i<6;i++){
      const pop=k===0?at(.3+i*.35):1;if(pop<=0)continue;
      const [x0,y0]=gridPos(i),[x1,y1]=groupPos(i),h=mix(IMG_H0,IMG_H1,g)*(.7+.3*ease(pop));
      bee(c,i,mix(x0,x1,g),mix(y0,y1,g)+(1-ease(pop))*10,h,t,pop);
    }
    // step 0: the name and the capsules
    withA(c,A(0,0,0),()=>{tag(c,T.name,24,16,{col:WHITE,active:true});});
    for(let i=0;i<6;i++){const ca=Math.min(A(0,0,0),k===0?at(2.6+i*.4):1);if(ca<=0)continue;
      const [cx]=gridPos(i);withA(c,ca,()=>capsule(c,i,cx,GY[i/3|0]+IMG_H0+8,t,k===0&&tau>2.6+i*.4&&tau<2.6+i*.4+2.4));}
    // step 1: the seven-spot ladybird, the "look alike" link and the two pills
    const sa=A(1,MOVE+1.4,1);
    withA(c,sa,()=>{
      seven(c,SEV.cx,SEV.cy,SEV.w,t);
      const rows=[T.seven,T.another].flatMap(p=>K.splitLines(c,D.tr(p),SEV.bw-20,22)),h=rows.length*28+16,ty=SEV.cy+SEV.w/SEVEN_AR/2+14;
      D.round(c,SEV.cx-SEV.bw/2,ty,SEV.bw,h,14,'rgba(11,26,21,.9)',rgba(WHITE,.9));
      rows.forEach((r,q)=>text(c,r,SEV.cx,ty+29+q*28,22,WHITE,'center'));
    });
    const la=A(1,MOVE+2.4,1);
    withA(c,la,()=>{
      const [px,py]=groupPos(2),a=[px+44,py-4],b=[SEV.cx-SEV.w/2+3,SEV.cy-18],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
      dline(c,a,b,YELLOW,t,3);
      circle(c,mx,my,17,'rgba(11,26,21,.95)',YELLOW,2.5);
      c.save();c.font=K.MONO(22);c.fillStyle=YELLOW;c.textAlign='center';c.textBaseline='middle';c.fillText('≈',mx,my+1);c.restore();
      if(k===1)K.pulse(c,mx,my,t,YELLOW,17);
    });
    withA(c,A(1,MOVE+3.4,1),()=>{const r=tag(c,T.diffSame,24,Y_P1,{col:WHITE});if(k===1)ring(c,r,t,WHITE);});
    withA(c,A(1,MOVE+4.2,1),()=>{const r=tag(c,T.alikeDiff,24,Y_P2,{col:YELLOW});if(k===1)ring(c,r,t+.4,YELLOW);});
  });

  // ── scene 1: step 2, look inside ──
  const a1=sceneA(1);
  if(a1>0)withA(c,a1,()=>{
    const e=d=>k===2?at(d):1;
    // body
    withA(c,e(MOVE),()=>{D.round(c,BODY.x,BODY.y,BODY.w,BODY.h,14,'rgba(22,51,43,.9)',C.edge);
      bee(c,0,BODY.x+BODY.w/2,BODY.y+BODY.h/2,164,t);
      tag(c,T.body,BODY.x+BODY.w/2,BODY.y+BODY.h+8,{al:'center',col:WHITE});});
    withA(c,e(MOVE+.6),()=>{const r={x:ZB.x,y:ZB.y,w:ZB.s,h:ZB.s};stroke(c,r,WHITE,3,4);if(k===2)ring(c,r,t,WHITE);});
    // cell
    withA(c,e(MOVE+1.2),()=>{
      dline(c,[ZB.x+ZB.s,ZB.y],[CELL.x,CELL.y],rgba(WHITE,.75),t,2);dline(c,[ZB.x+ZB.s,ZB.y+ZB.s],[CELL.x,CELL.y+CELL.h],rgba(WHITE,.75),t,2);
      D.round(c,CELL.x,CELL.y,CELL.w,CELL.h,14,'rgba(22,51,43,.95)',C.edge);
      const cx=CELL.x+CELL.w/2,cy=CELL.y+CELL.h/2,w=1+.02*Math.sin(t*1.4);
      c.save();c.beginPath();for(let i=0;i<=40;i++){const a=i/40*Math.PI*2,rr=(64+5*Math.sin(a*3+t*.8))*w;const px=cx+rr*Math.cos(a)*1.05,py=cy+rr*Math.sin(a)*1.1;i?c.lineTo(px,py):c.moveTo(px,py);}
      c.closePath();c.fillStyle='rgba(242,236,217,.10)';c.fill();c.strokeStyle=WHITE;c.lineWidth=3;c.stroke();c.restore();
      circle(c,NUC.x,NUC.y,NUC.r,'rgba(244,114,182,.14)',WHITE,2.5);
      [[-12,-8,.6],[8,-10,-.4],[-4,8,.2],[12,8,1.1]].forEach(([dx,dy,r],q)=>{c.save();c.translate(NUC.x+dx,NUC.y+dy);c.rotate(r+.1*Math.sin(t+q));
        K.sline(c,[[-7,0],[7,0]],PINK,4);c.restore();});
      tag(c,T.cell,CELL.x+CELL.w/2,CELL.y+CELL.h+8,{al:'center',col:WHITE});
    });
    withA(c,e(MOVE+1.8),()=>{const r={x:ZN.x,y:ZN.y,w:ZN.s,h:ZN.s};stroke(c,r,WHITE,3,6);if(k===2)ring(c,r,t+.3,WHITE);});
    // chromosome pair
    withA(c,e(MOVE+2.4),()=>{
      dline(c,[ZN.x+ZN.s,ZN.y],[CHR.x,CHR.y],rgba(WHITE,.75),t,2);dline(c,[ZN.x+ZN.s,ZN.y+ZN.s],[CHR.x,CHR.y+CHR.h],rgba(WHITE,.75),t,2);
      D.round(c,CHR.x,CHR.y,CHR.w,CHR.h,14,'rgba(22,51,43,.97)',null);stroke(c,CHR,PINK,3,14);
      text(c,T.pair,CHR.x+CHR.w/2,CHR.y+34,22,WHITE,'center');
      ROD.forEach((rx,q)=>{const sway=1.5*Math.sin(t*1.2+q*1.7);
        D.round(c,rx-ROD_W/2+sway,ROD_Y0,ROD_W,CEN-ROD_Y0-6,ROD_W/2,'rgba(242,236,217,.22)',WHITE);
        D.round(c,rx-ROD_W/2+sway,CEN+6,ROD_W,ROD_Y1-CEN-6,ROD_W/2,'rgba(242,236,217,.22)',WHITE);
        D.round(c,rx-7+sway,CEN-10,14,20,6,'rgba(242,236,217,.4)',null);});
    });
    BAND.forEach((by,j)=>{const ba=e(MOVE+3.2+j*.7);
      withA(c,ba,()=>{
        text(c,T.pos(j+1),CHR.x+14,by+8,22,WHITE);
        const lw=measure(c,T.pos(j+1),22);
        dline(c,[CHR.x+20+lw,by],[ROD[0]-ROD_W/2-4,by],rgba(WHITE,.6),t,2);
        ROD.forEach((rx,q)=>{const sway=1.5*Math.sin(t*1.2+q*1.7);sq(c,rx-15+sway,by-15,GENE2[j][q],30,k===2?.5+.5*Math.sin(t*2.4+j+q):0);});
      });});
    // position 1 in three individuals
    withA(c,e(MOVE+4.8),()=>{
      D.round(c,IND.x,IND.y,IND.w,IND.h,14,'rgba(22,51,43,.9)',C.edge);
      text(c,T.pos1three,IND.x+IND.w/2,IND.y+32,22,WHITE,'center');
    });
    IND_BEE.forEach((bi,q)=>{const ia=e(MOVE+5.3+q*.4);const cx=IND.x+56+q*112;
      withA(c,ia,()=>{bee(c,bi,cx,IND.y+82,64,t);IND_G[q].forEach((v,w)=>sq(c,cx-26+w*28,IND.y+124,v,24,.5+.5*Math.sin(t*2+q+w)));});});
    withA(c,e(MOVE+6.8),()=>{const r=tag(c,T.notSeq,24,IND.y+IND.h+16,{col:WHITE,dash:[7,5],dashOff:-t*10});if(k===2)ring(c,r,t,WHITE);});
  });

  // ── scene 2: step 3, looks ≠ genes ──
  const a2=sceneA(2);
  if(a2>0)withA(c,a2,()=>{
    const e=d=>k===3?at(d):1;
    // row A: same looks, different genes
    withA(c,e(MOVE),()=>{tag(c,T.sameLook,24,RA,{col:WHITE,active:true});});
    BX.forEach((cx,q)=>{withA(c,e(MOVE+.4+q*.3),()=>bee(c,1,cx,RA+96,100,t+q*.7));
      withA(c,e(MOVE+1.4+q*.3),()=>strip(c,cx,RA+162,GENE_A[q],t,q));});
    withA(c,e(MOVE+2.2),()=>{const r=tag(c,T.looksEq,TAG_R,RA+46,{al:'right',col:WHITE});});
    withA(c,e(MOVE+2.7),()=>{const r=tag(c,T.genesNe,TAG_R,RA+100,{al:'right',col:PINK});if(k===3)ring(c,r,t,PINK);});
    withA(c,e(MOVE+.4),()=>K.sline(c,[[24,RB-14],[632,RB-14]],rgba(WHITE,.25),2));
    // row B: different looks, same genes, different temperature
    withA(c,e(MOVE+3.4),()=>{tag(c,T.diffLook,24,RB,{col:WHITE,active:true});});
    [[0,COOL,.25,T.cool],[3,WARM,.8,T.warm]].forEach(([bi,col,lv,lab],q)=>{const cx=BX[q];
      withA(c,e(MOVE+3.8+q*.3),()=>bee(c,bi,cx,RB+98,100,t+q*.9));
      withA(c,e(MOVE+4.4+q*.3),()=>{thermo(c,cx+TH_DX,RB+44,lv,col,t+q);text(c,lab,cx+TH_DX,RB+190+20,22,col,'center');});
      withA(c,e(MOVE+5.0+q*.3),()=>strip(c,cx,RB+164,GENE_B,t,q+2));});
    withA(c,e(MOVE+5.8),()=>tag(c,T.looksNe,TAG_R,RB+44,{al:'right',col:WHITE}));
    withA(c,e(MOVE+6.2),()=>{const r=tag(c,T.genesEq,TAG_R,RB+96,{al:'right',col:PINK});if(k===3)ring(c,r,t+.3,PINK);});
    withA(c,e(MOVE+6.6),()=>{const r=tag(c,T.envNe,TAG_R,RB+148,{al:'right',col:WARM});if(k===3)ring(c,r,t+.6,WARM);});
    withA(c,e(MOVE+7.3),()=>{const r=tag(c,T.noRead,24,RB+232,{col:WHITE});if(k===3)ring(c,r,t,WHITE);});
  });

  // ── step card (right) ──
  card(c,k,st,moving,x,u,tau,t);

  // notes (all steps)
  text(c,L('schematic','示意','Schematic'),24,590,22,MUTED,'left');
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}

const s_cardDbg={};
function card(c,k,st,moving,x,u,tau,t){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=tag(c,L('genetic','遺傳多樣性','Genetic diversity'),ix,R.y+14,{col:PINK});
  let y=R.y+14+hr.h+30;
  y+=K.wrap(c,T.within,ix,y,iw,22,PINK,28)+4;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=12;
  // step list
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+20;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,40,12,'rgba(242,236,217,.10)',null));
    badge(c,j+1,ix+16,cy,false);withA(c,on,()=>badge(c,j+1,ix+16,cy,true));
    text(c,p,ix+42,cy+8,22,on>.5?WHITE:MUTED);
    y+=42;});
  K.sline(c,[[ix,y+2],[ix+iw,y+2]],rgba(WHITE,.25),2);y+=16;
  // the step's title (cross-fades)
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>K.wrap(c,T.names[st.from],ix,ty,iw,22,WHITE,30));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  let hh=0;withA(c,na,()=>{hh=K.wrap(c,T.names[k],ix,ty,iw,22,WHITE,30);});
  if(!hh)hh=K.splitLines(c,D.tr(T.names[k]),iw,22).length*30;
  // legend of the step (at the card bottom)
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(40,K.splitLines(c,D.tr(p),iw-46,22).length*28+12)),ly=R.y+R.h-12-lhs.reduce((a,b)=>a+b,0);
  s_cardDbg.title=ty+hh-22;s_cardDbg.legend=ly;
  const fade=moving&&st.from>=0&&JSON.stringify(legend(st.from).map(l=>l[1][0]))!==JSON.stringify(legs.map(l=>l[1][0]))?u:1;
  withA(c,fade,()=>{let yy=ly;legs.forEach(([kind,p],q)=>{swatch(c,kind,ix,yy,t);K.wrap(c,p,ix+46,yy+26,iw-46,22,WHITE,28);yy+=lhs[q];});});
}
function legend(k){
  if(k===0)return[['pinkBox',T.legFrame]];
  if(k===1)return[['whiteBox',T.legOne],['yellowDash',T.legAlike]];
  if(k===2)return[['sq1',T.v1],['sq0',T.v2]];
  return[['sq1',T.v1],['sq0',T.v2],['thermo',T.legTemp]];
}
function swatch(c,kind,x,y,t){
  if(kind==='pinkBox')stroke(c,{x,y:y+6,w:34,h:24},PINK,3,8);
  else if(kind==='whiteBox')stroke(c,{x,y:y+6,w:34,h:24},WHITE,3,8);
  else if(kind==='yellowDash')dline(c,[x,y+18],[x+34,y+18],YELLOW,t,3);
  else if(kind==='sq1')sq(c,x+5,y+6,1,24);
  else if(kind==='sq0')sq(c,x+5,y+6,0,24);
  else if(kind==='thermo'){c.save();c.translate(x+17,y+2);c.scale(.3,.3);thermo(c,0,0,.6,WARM,t);c.restore();}
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.frogs=draw;
window.EnvironmentDraw.frogs.dbg=s_cardDbg;
})();

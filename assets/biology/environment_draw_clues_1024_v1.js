/* Unit 11 lesson 3 · "clues" canvas (traditional-knowledge tab, view 1), 2026-10-25. What can one photo tell us? (plan section 4, clues; P1).
 * Three steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Pictures: the same three textbook originals as the tab's "Textbook photos" view (environment_originals_1010_v1/Im142_2279.png
 * ceremony, Im145_2298.png vessels, Im146_2301.png weaving; sizes from the kit). They are shown whole and unchanged (no cut-out,
 * no redraw, no crop); only a cyan frame is drawn over them. Source line under the stage; the full rights note stays in the
 * "Textbook photos" view and the page's picture sources.
 * Always moving: the cyan frame walks between the parts of the photo that the "visible" cards name (the matching card lights up,
 * the frame's number = the card's number) and a ring breathes round it; the dashed boxes march; the step card's current
 * thumbnail pulses; in step 3 the magnifier swings and the clue box glows.
 * Layout (as assess / track): left = stage (x 16..636), right = step card (x 652..944, y 16..566).
 *   photo panel (y 16..250): the photo grows out of its thumbnail in the step card (one after another = "enlarged in turn").
 *   three columns under it (y 260..566): "visible in the photo" (cyan), "provided by reading" (yellow),
 *   "ask the community" (white dashed = not known from photo or reading, plan 1.4).
 *  0 ceremony: three "visible" cards (people, clothing, place); the other two columns stay dashed ("left empty for now").
 *  1 vessels: visible = shapes and the look of the material; reading = the materials the textbook names
 *    (bamboo, pandan leaves, areca sheaths); ask = how and by whom it is made, when it is used.
 *  2 weaving: visible = two woven objects, strips over and under, strip ends; reading = name and material from the textbook;
 *    ask = what the name means, how it is made and used; closing box "one photo is only a clue".
 * Culture (plan 4 and 7.4): only what can be seen is written as "visible"; "reading" only repeats what the program's texts say
 * the textbook gives; no people, place or meaning of a rite is guessed; the ceremony's meaning is not explained here.
 * Highlight regions were measured once on the originals (fractions of width / height).
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const N=3,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,INK=C.ink,YELLOW=C.yellow;
const CYAN=(K.COL&&K.COL.evidence)||'#55e9ff';
const FILL='rgba(11,26,21,.92)',CARDF='rgba(22,51,43,.92)';
const ORIG=K.ORIG||'environment_originals_1010_v1/';
const PICS=[ORIG+'Im142_2279.png',ORIG+'Im145_2298.png',ORIG+'Im146_2301.png'];

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('一張照片能說什麼','What can a photo tell us?'),
 short:[P('祭典','Ceremony'),P('器皿','Vessels'),P('編織','Weaving')],
 names:[P('祭典照片：看得見的、閱讀的、要詢問的','Ceremony photo: visible, read, or to be asked'),P('器皿照片','Vessel photo'),P('編織照片：一張照片只是一個線索','Weaving photo: one photo is only a clue')],
 heads:[P('照片可見','Visible in the photo'),P('閱讀提供','From the reading'),P('需要詢問族人','Ask the community')],
 empty:P('先空著','Left empty for now'),
 vis:[[P('人：一群人','People: a group'),P('服飾：條紋衣、帽子','Clothing: stripes, hats'),P('場所：船的旁邊','Place: beside boats')],
      [P('形狀：長盒','Shape: long boxes'),P('形狀：圓碗','Shape: round bowls'),P('外觀：淺褐色、有紋路','Look: light brown, lined')],
      [P('兩個編織物件','Two woven objects'),P('長條交錯編成','Crossing strips'),P('末端伸出長條','Strip ends stick out')]],
 read:[[],[P('竹子','Bamboo'),P('林投葉','Pandan leaves'),P('檳榔葉鞘','Areca sheaths')],[P('名稱：阿里鳳鳳','Name: alifongfong'),P('材料：林投葉','Material: pandan leaves')]],
 ask:[[],[P('怎麼製作、誰製作？','How is it made, and by whom?'),P('什麼時候用？','When is it used?')],[P('名稱的意思？','What does the name mean?'),P('怎麼做、怎麼用？','How is it made and used?')]],
 clue:P('一張照片只是一個線索','One photo is only a clue'),
 legFrame:P('青框：照片上看得見的地方','Cyan frame: seen in the photo'),
 legEmpty:P('虛線：還沒有資料，先空著','Dashes: nothing known yet'),
 legRead:P('黃色：閱讀提供','Yellow: from the reading'),
 legAsk:P('白色虛線：要詢問族人','White dashes: ask the community'),
 src:P('照片：課本原圖','Photos: textbook originals'),
 note:P('意義與脈絡：要詢問族人','Meaning and context: ask the community')
};
// parts of each photo named by the "visible" cards: [x0,y0,x1,y1] as fractions of the picture (measured on the originals)
const REG=[[[.02,.30,.97,.80],[.64,.22,.83,.75],[.01,.62,.99,.99]],
           [[.05,.20,.33,.71],[.56,.44,.70,.74],[.25,.44,.44,.89]],
           [[.08,.08,.90,.86],[.55,.36,.82,.62],[.45,.05,.75,.30]]];

// ── geometry ─────────────────────────────────────────────────────────────
const PH={x:16,y:16,w:620,h:234},PIN={x:24,y:24,w:604,h:218};
const COLY=260,COLB=566,COLW=200,COLX=[16,226,436];
const CARD={x:652,y:16,w:292,h:550};
const RH2=50;   // step-card row height (badge, thumbnail, name)
// times inside a step (seconds after it begins)
const T_VIS=i=>1.3+.8*i,T_READ=j=>4+.6*j,T_ASK=j=>5.6+.6*j,T_CLUE=7,CYC=2.2;

// ── helpers (as in assess) ───────────────────────────────────────────────
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
// lines for a narrow column: Chinese by punctuation, English balanced by words
const colLines=(c,p,w)=>{const str=D.tr(p);return /[一-鿿]/.test(str)?blines(c,p,w):greedyBal(c,str,w);};
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,size=22}={}){
  const g=boxGeo(c,p,maxW,size),bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x;
  D.round(c,bx,y,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,y+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y,w:g.w,h:g.h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const dashRect=(c,x,y,w,h,r,col,t,fill=null)=>{c.save();c.setLineDash([9,7]);c.lineDashOffset=-t*8;D.round(c,x,y,w,h,r,fill,col);c.restore();};
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
const mainRect=k=>K.fitRect(PICS[k],PIN.x,PIN.y,PIN.w,PIN.h);
// thumbnail rect of step j in the step card (rows start at card.rowY, set while drawing the card)
let rowY0=0;
const thumbRect=j=>K.fitRect(PICS[j],CARD.x+16+40,rowY0+j*RH2+5,56,40);
function regRect(k,i){const r=mainRect(k),q=REG[k][i],x0=r.x+q[0]*r.w,y0=r.y+q[1]*r.h,x1=r.x+q[2]*r.w,y1=r.y+q[3]*r.h,m=3;
  const X0=Math.max(r.x+m,x0),Y0=Math.max(r.y+m,y0),X1=Math.min(r.x+r.w-m,x1),Y1=Math.min(r.y+r.h-m,y1);return{x:X0,y:Y0,w:X1-X0,h:Y1-Y0};}
// which "visible" item the frame is on at time tau, and the one it came from: {cur, prev, u}
function frameAt(tau){
  const ev=[];for(let i=0;i<3;i++)ev.push([T_VIS(i),i]);
  const last=T_VIS(2);if(tau>last){const j=Math.floor((tau-last)/CYC);for(let q=Math.max(1,j-1);q<=j+1;q++)ev.push([last+q*CYC,q%3]);}
  let cur=null,prev=null;for(const e of ev){if(e[0]<=tau){prev=cur;cur=e;}}
  if(!cur)return null;return{cur:cur[1],prev:prev?prev[1]:cur[1],u:smooth((tau-cur[0])/.6),since:tau-cur[0]};}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.cluesSt||(s.cluesSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  card(c,k,st,moving,x,u,tau,t,rects);
  // photo panel
  D.round(c,PH.x,PH.y,PH.w,PH.h,14,'rgba(22,51,43,.95)',C.edge);
  const fadeOld=st.from>=0?1-clamp(tau/.5):0;
  columnsFrame(c,t,rects);
  if(fadeOld>0){withA(c,fadeOld,()=>{K.drawIn(c,PICS[st.from],mainRect(st.from),{radius:8});columns(c,st.from,99,t,null);});}
  const grow=smooth(clamp(tau/MOVE)),fresh=st.from<0&&tau>MOVE;
  columns(c,k,tau,t,rects,fadeOld);
  side(c,k,tau,t,rects);
  frame(c,k,tau,t,rects);
  // the photo grows out of its thumbnail (drawn last while it moves, so it passes over the step card)
  const pr=fresh?mainRect(k):lerpR(thumbRect(k),mainRect(k),grow);
  if(grow<1&&!fresh)K.drawIn(c,PICS[k],pr,{radius:mix(4,8,grow)});
  s_dbg.photo=pr;
  text(c,T.src,16,592,22,MUTED,'left');push(rects,1,'src',{x:16,y:574,w:measure(c,T.src,22),h:24});
  const aw=measure(c,T.note,22);text(c,T.note,CW-16,592,22,MUTED,'right');push(rects,1,'note',{x:CW-16-aw,y:574,w:aw,h:24});
  s_dbg.T=tau;
}
// the settled photo is drawn under the frame; while growing it is drawn on top in draw()
function photoSettled(c,k,tau){if(tau>=MOVE)K.drawIn(c,PICS[k],mainRect(k),{radius:8});}

// ── columns ──────────────────────────────────────────────────────────────
let headH=0;
function columnsFrame(c,t,rects){
  const lines=T.heads.map(p=>colLines(c,p,COLW-24));headH=Math.max(...lines.map(r=>r.length))*26+14;
  const cols=[CYAN,YELLOW,WHITE];
  T.heads.forEach((p,i)=>{const x=COLX[i];
    D.round(c,x,COLY,COLW,COLB-COLY,14,'rgba(22,51,43,.85)',rgba(cols[i],.55));
    D.round(c,x,COLY,COLW,headH,14,rgba(cols[i],.16),null);
    const r=lines[i],y0=COLY+headH/2-(r.length*26)/2+20;
    r.forEach((q,j)=>text(c,q,x+COLW/2,y0+j*26,22,cols[i],'center'));
    push(rects,1,'head'+i,{x:x+COLW/2-Math.max(...r.map(q=>measure(c,q,22)))/2,y:y0-19,w:Math.max(...r.map(q=>measure(c,q,22))),h:(r.length-1)*26+25});});
  s_dbg.headH=headH;
}
function cardGeo(c,p,tw){const r=colLines(c,p,tw);return{r,h:r.length*LH+12};}
function columns(c,k,tau,t,rects,fadeOld=0){
  const bodyY=COLY+headH+10,fa=f=>clamp((tau-f)/.4);
  const lists=[T.vis[k],T.read[k],T.ask[k]],tws=[COLW-16-44,COLW-16-20,COLW-16-44],starts=[T_VIS,T_READ,T_ASK];
  const fr=frameAt(tau);
  lists.forEach((list,i)=>{const x=COLX[i]+8,w=COLW-16;let y=bodyY;
    if(!list.length){const a=fa(starts[i](0));withA(c,a,()=>{const h=COLB-8-bodyY;dashRect(c,x,y,w,h,12,rgba(WHITE,.6),t);
        const r=colLines(c,T.empty,w-24),y0=y+h/2-(r.length*26)/2+19;r.forEach((q,j)=>text(c,q,x+w/2,y0+j*26,22,MUTED,'center'));
        push(rects,a,'empty'+i,{x:x+w/2-Math.max(...r.map(q=>measure(c,q,22)))/2,y:y0-19,w:Math.max(...r.map(q=>measure(c,q,22))),h:(r.length-1)*26+25});});
      return;}
    list.forEach((p,j)=>{const g=cardGeo(c,p,tws[i]),a=fa(starts[i](j)),dx=-14*(1-smooth(a));
      withA(c,a,()=>{const cx=x+dx;
        if(i===0){const on=fr&&fr.cur===j?smooth(clamp(fr.since/.4)):0,off=fr&&fr.prev===j&&fr.cur!==j?1-smooth(clamp(fr.since/.4)):0,hot=Math.max(on,off);
          D.round(c,cx,y,w,g.h,12,hot>0?rgba(CYAN,.08+.14*hot):CARDF,rgba(CYAN,.45+.5*hot));
          if(hot>.5&&on>.5){const q=mod(t*.7);D.round(c,cx-4*q,y-4*q,w+8*q,g.h+8*q,12+4*q,null,rgba(CYAN,.6*(1-q)));}
          numTag(c,j+1,cx+20,y+g.h/2);
        }else if(i===1){D.round(c,cx,y,w,g.h,12,CARDF,rgba(YELLOW,.85));}
        else{dashRect(c,cx,y,w,g.h,12,rgba(WHITE,.8),t,CARDF);askMark(c,cx+20,y+g.h/2);}
        const tx=cx+(i===1?10:40);g.r.forEach((q,m)=>text(c,q,tx,y+27+m*LH,22,WHITE,'left'));
        if(rects)push(rects,a*(fadeOld>0?0:1),'c'+i+j,{x:tx,y:y+8,w:Math.max(...g.r.map(q=>measure(c,q,22))),h:(g.r.length-1)*LH+25});});
      y+=g.h+8;});
    s_dbg['bottom'+i]=y-8;});
}
function numTag(c,n,x,y){circle(c,x,y,13,CYAN,rgba(INK,.7),1.5);c.save();c.font=K.MONO(22);c.fillStyle=INK;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function askMark(c,x,y){c.save();c.setLineDash([4,3]);circle(c,x,y,13,FILL,rgba(WHITE,.85),2);c.restore();
  c.save();c.font=K.MONO(22);c.fillStyle=WHITE;c.textAlign='center';c.textBaseline='middle';c.fillText('?',x,y+1);c.restore();}
function bookIcon(c,x,y){ // a small open book (reading)
  c.save();c.strokeStyle=YELLOW;c.lineWidth=2;c.fillStyle=rgba(YELLOW,.25);
  c.beginPath();c.moveTo(x+8,y+3);c.quadraticCurveTo(x+3,y,x,y+1);c.lineTo(x,y+14);c.quadraticCurveTo(x+3,y+13,x+8,y+16);c.quadraticCurveTo(x+13,y+13,x+16,y+14);c.lineTo(x+16,y+1);c.quadraticCurveTo(x+13,y,x+8,y+3);c.closePath();c.fill();c.stroke();
  c.beginPath();c.moveTo(x+8,y+3);c.lineTo(x+8,y+16);c.stroke();c.restore();}

// ── photo frame (cyan) ───────────────────────────────────────────────────
function frame(c,k,tau,t,rects){
  photoSettled(c,k,tau);
  const fr=frameAt(tau);if(!fr||tau<MOVE)return;
  const a=clamp((tau-T_VIS(0))/.4),r=lerpR(regRect(k,fr.prev),regRect(k,fr.cur),fr.u);
  withA(c,a,()=>{
    D.round(c,r.x,r.y,r.w,r.h,8,null,rgba(INK,.55));c.save();c.lineWidth=6;c.strokeStyle=rgba(INK,.5);c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,8);c.stroke();c.restore();
    c.save();c.lineWidth=3;c.strokeStyle=CYAN;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,8);c.stroke();c.restore();
    if(fr.u>=1){const q=mod(t*.6),pr=mainRect(k),ex=6*q;
      c.save();c.beginPath();c.roundRect(pr.x,pr.y,pr.w,pr.h,8);c.clip();c.lineWidth=2;c.strokeStyle=rgba(CYAN,.7*(1-q));c.beginPath();c.roundRect(r.x-ex,r.y-ex,r.w+2*ex,r.h+2*ex,8+ex);c.stroke();c.restore();}
    const pr=mainRect(k),lim=(v,a,b)=>Math.min(b,Math.max(a,v)),nx=lim(r.x+16,pr.x+16,pr.x+pr.w-16),ny=lim(r.y+16,pr.y+16,pr.y+pr.h-16);
    numTag(c,fr.cur+1,nx,ny);});
  s_dbg.frame=r;
}

// ── side of the photo: the closing clue box (step 3) ─────────────────────
function side(c,k,tau,t,rects){
  if(k!==2)return;const pr=mainRect(2),a=clamp((tau-T_CLUE)/.6);
  withA(c,a,()=>{
    // right of the photo: the closing sentence
    const x0=pr.x+pr.w+12,w=PIN.x+PIN.w-x0,g=boxGeo(c,T.clue,w),y=PH.y+PH.h/2-g.h/2;
    const b=box(c,T.clue,x0+w/2,y,{maxW:w,al:'center',stroke:YELLOW,col:YELLOW});
    const q=.5+.5*Math.sin(t*2.4);D.round(c,b.x-3,b.y-3,b.w+6,b.h+6,18,null,rgba(YELLOW,.2+.45*q));
    push(rects,a,'clue',b);
    // left of the photo: a magnifier swinging slowly (a clue, looked at closely)
    const mx=(PIN.x+pr.x)/2,my=PH.y+PH.h/2,ang=.25*Math.sin(t*1.5);
    c.save();c.translate(mx,my);c.rotate(ang);circle(c,-6,-10,26,rgba(CYAN,.12),CYAN,4);
    K.sline(c,[[12,9],[34,31]],CYAN,7);c.restore();});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){return k===0?[['frame',T.legFrame],['empty',T.legEmpty]]:[['frame',T.legFrame],['read',T.legRead],['ask',T.legAsk]];}
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16;
  if(kind==='frame'){const b=1+.08*Math.sin(t*2);c.save();c.lineWidth=3;c.strokeStyle=CYAN;c.beginPath();c.roundRect(ax-16*b,ay-11*b,32*b,22*b,5);c.stroke();c.restore();}
  else if(kind==='read'){D.round(c,x+3,y+2,36,28,6,CARDF,YELLOW);bookIcon(c,x+13,y+8);}
  else{dashRect(c,x+3,y+2,36,28,6,rgba(WHITE,.85),t);}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:WHITE});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  rowY0=y;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH2/2;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,RH2,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,2,WHITE));
    const tr=thumbRect(j);
    if(!(j===k&&tau<MOVE&&st.from>=0))K.drawIn(c,PICS[j],tr,{radius:4,alpha:on>.5?1:.55});
    if(j===k&&on>.5){const q=mod(t*.7);D.round(c,tr.x-2-3*q,tr.y-2-3*q,tr.w+4+6*q,tr.h+4+6*q,6,null,rgba(CYAN,.85*(1-q)));D.round(c,tr.x-1,tr.y-1,tr.w+2,tr.h+2,5,null,CYAN);}
    text(c,p,ix+106,cy+8,22,on>.5?WHITE:MUTED);push(rects,1,'row'+j,{x:ix+106,y:cy-11,w:measure(c,p,22),h:25});
    y+=RH2;});
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
window.EnvironmentDraw.clues=draw;
window.EnvironmentDraw.clues.dbg=s_dbg;
})();

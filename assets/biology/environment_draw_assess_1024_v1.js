/* Unit 11 lesson 3 · "assess" canvas (conservation-evidence tab, view 2), 2026-10-25. Assessment is not law (plan section 4, assess; P1).
 * Three steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options, no pictures (everything is drawn).
 * Always moving: cyan data dots run from the three data rows down a channel into the "risk" plate; the trend icon's dot slides along
 * its line, the range outline's dashes march, the threat arrow nudges; the scope ellipse breathes and its dashed edge turns; the
 * "≠" ring pulses; the answer icons blink (quadrat individuals, recapture tag, repeated survey sheets in turn).
 * Layout (as coral / timing): left = stage (x 16..636), right = step card (x 652..944, y 16..566).
 *   two cards side by side: left "risk assessment" (cyan = data / tracking evidence, plan 1.4), right "law and management"
 *   (green = protection measures). Between them (gap x 300..352) the yellow "≠" in step 2. Below the cards: question box and the
 *   cyan answer box "it needs data: quadrats, mark-recapture, repeated surveys" (recall ecology lessons 1 and 4).
 *  0 assessment: three data rows (population trend, range, threats in orange) appear one by one; dots carry data to "it speaks of: risk".
 *    The right card waits as a faint dashed outline with its name.
 *  1 law and management: the right card lights up; "rules: what may and may not be done"; a soft-edged ellipse labelled "scope"
 *    holds "✓ may do" and "✕ may not do"; plate "it speaks of: rules". The left card dims.
 *  2 not the same: both cards full; "≠" between them; question "how can an international body know numbers?" -> answer box.
 * Science (plan 4): no organisation names, no species, no category names or numbers, no laws; the gauge-free design avoids
 * inventing risk levels. Everything is schematic.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,INK=C.ink,YELLOW=C.yellow;
const CYAN=(K.COL&&K.COL.evidence)||'#55e9ff',GREEN=(K.COL&&K.COL.protect)||'#4ade80',ORANGE=(K.COL&&K.COL.pressure)||'#fb923c';
const FILL='rgba(11,26,21,.92)',CARDF='rgba(22,51,43,.92)';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('評估和法律不一樣','Assessment is not law'),
 short:[P('瀕危評估','Risk assessment'),P('法律與管理','Law and management'),P('不能畫等號','Not the same')],
 names:[P('瀕危評估：判斷滅絕風險','Risk assessment: judging extinction risk'),P('法律與管理：規範能做什麼','Law and management: what may be done'),P('兩者不能畫等號','The two cannot be equated')],
 assess:P('瀕危評估','Risk assessment'),
 assessSub:P('用資料判斷滅絕風險','Uses data to judge extinction risk'),
 rows:[P('族群趨勢','Population trend'),P('分布範圍','Range'),P('威脅','Threats')],
 risk:P('說的是：風險','It speaks of: risk'),
 law:P('法律與管理','Law and management'),
 lawSub:P('規範：可以做什麼、不可以做什麼','Rules: what may and may not be done'),
 scope:P('適用範圍','Scope'),
 may:P('可以做','May do'),
 mayNot:P('不可以做','May not do'),
 rules:P('說的是：規範','It speaks of: rules'),
 q:P('國際單位怎麼知道數量？','How can an international body know numbers?'),
 need:P('要有資料：','It needs data:'),
 tools:[P('樣方','Quadrats'),P('捉放法','Mark-recapture'),P('重複調查','Repeated surveys')],
 legAssess:P('青色：瀕危評估（看資料）','Cyan: risk assessment (uses data)'),
 legThreat:P('橘色箭頭：威脅','Orange arrow: threats'),
 legDots:P('青色小點：資料（示意）','Cyan dots: data (schematic)'),
 legLaw:P('綠色：法律與管理','Green: law and management'),
 legScope:P('柔邊圈：適用範圍（示意）','Soft ring: scope (schematic)'),
 legNeq:P('黃色 ≠：不能畫等號','Yellow ≠: not the same thing'),
 legData:P('青色：資料（追蹤證據）','Cyan: data (tracking evidence)'),
 schem:L('schematic','示意','Schematic'),
 noCat:P('不寫任何物種目前的等級','No current category for any species')
};

// ── geometry ─────────────────────────────────────────────────────────────
const LC={x:16,y:16,w:284,h:356},RC={x:352,y:16,w:284,h:356};
const NEQ={x:326,y:194};
const ROW0=LC.y+124,RH=56,CH=LC.x+LC.w-20;                 // first data row top, row height, data channel x
const PLY=LC.y+LC.h-14-32;                                  // y of the bottom plates
const ELL={x:RC.x+RC.w/2,y:230,rx:118,ry:64};               // scope ellipse
const QY=382,ANS={x:16,y:446,w:620,h:120};
const COLX=[119,326,533],ICY=506;
const CARD={x:652,y:16,w:292,h:550};

// per-step targets and [delay, duration] when entering a step
const TGT={l0:[1,1,1],l1:[1,1,1],l2:[1,1,1],lp:[1,1,1],lDim:[0,1,0],rOn:[0,1,1],rSub:[0,1,1],rEll:[0,1,1],rRows:[0,1,1],rp:[0,1,1],
  neq:[0,0,1],q:[0,0,1],ans:[0,0,1],a0:[0,0,1],a1:[0,0,1],a2:[0,0,1],link:[0,0,1]};
const SCHED=[{l0:[.4,.5],l1:[1,.5],l2:[1.6,.5],lp:[2.4,.5]},
  {lDim:[.2,.6],rOn:[.2,.6],rSub:[.7,.5],rEll:[1.3,.8],rRows:[2.1,.5],rp:[2.9,.5]},
  {lDim:[0,.6],neq:[.6,.5],q:[1.6,.5],ans:[2.6,.6],a0:[3,.4],a1:[3.4,.4],a2:[3.8,.4],link:[4.4,.5]}];

// ── helpers (as in coral / timing) ───────────────────────────────────────
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
const cwrap=(c,p,x,y,w,col,lh)=>{const r=colLines(c,p,w);r.forEach((q,i)=>text(c,q,x,y+i*lh,22,col));return r.length*lh;};
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22,vc=false,g=null}={}){
  g=g||boxGeo(c,p,maxW,size);const bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=vc?y-g.h/2:y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const plateW=(c,p)=>measure(c,p,22)+14;
function plate(c,p,x,y,{al='center',col=WHITE,stroke=null,h=32}={}){const w=plateW(c,p),bx=al==='right'?x-w:al==='left'?x:x-w/2;
  D.round(c,bx,y,w,h,10,FILL,stroke||rgba(col,.75));text(c,p,bx+w/2,y+h/2+8,22,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
function checkMark(c,x,y,col,s=1){K.sline(c,[[x-9*s,y],[x-3*s,y+7*s],[x+10*s,y-8*s]],col,4);}
function crossMark(c,x,y,col,s=1){K.sline(c,[[x-8*s,y-8*s],[x+8*s,y+8*s]],col,4);K.sline(c,[[x+8*s,y-8*s],[x-8*s,y+8*s]],col,4);}
function cardFrame(c,r,col,a,dashOut,t){
  if(dashOut>0.002)withA(c,dashOut,()=>{c.save();c.setLineDash([9,7]);c.lineDashOffset=-t*8;D.round(c,r.x,r.y,r.w,r.h,16,'rgba(22,51,43,.55)',rgba(MUTED,.7));c.restore();});
  if(a>0.002)withA(c,a,()=>{D.round(c,r.x,r.y,r.w,r.h,16,CARDF,rgba(col,.85));c.save();c.globalAlpha*=.5;D.round(c,r.x+3,r.y+3,r.w-6,r.h-6,13,null,rgba(col,.25));c.restore();});}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.assessSt||(s.assessSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const base=st.from>=0?st.from:Math.max(0,k-1),back=base>k;
  const V={};for(const q in TGT){const sc=back?(TGT[q][k]>TGT[q][base]?[.7,.6]:[0,.6]):(SCHED[k][q]||[0,.8]);V[q]=mix(TGT[q][base],TGT[q][k],smooth((tau-sc[0])/sc[1]));}
  // step 0 on a fresh start: the data rows come in one by one
  if(k===0&&!(st.from>=0&&back))['l0','l1','l2','lp'].forEach(q=>{const sc=SCHED[0][q];V[q]=smooth((tau-sc[0])/sc[1]);});
  s_dbg.V=V;
  leftCard(c,V,t,rects);
  rightCard(c,V,t,rects);
  middle(c,V,t,rects);
  bottom(c,V,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  text(c,T.schem,16,592,22,MUTED,'left');push(rects,1,'schem',{x:16,y:574,w:measure(c,T.schem,22),h:24});
  const aw=measure(c,T.noCat,22);text(c,T.noCat,CW-16,592,22,MUTED,'right');push(rects,1,'noCat',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── left card: risk assessment ───────────────────────────────────────────
function rowIcon(c,i,x,y,t){
  if(i===0){ // population trend: axes, a falling line, a dot sliding along it
    K.sline(c,[[x-20,y-18],[x-20,y+18],[x+22,y+18]],rgba(MUTED,.9),2.5);
    const pts=[[x-15,y-12],[x-4,y-6],[x+6,y+2],[x+17,y+10]];K.sline(c,pts,CYAN,3);
    pts.forEach(p=>circle(c,p[0],p[1],3,CYAN,null));
    const q=mod(t*.35),seg=Math.min(2,Math.floor(q*3)),f=q*3-seg,a=pts[seg],b=pts[seg+1];
    K.glow(c,mix(a[0],b[0],f),mix(a[1],b[1],f),11,CYAN,.6);circle(c,mix(a[0],b[0],f),mix(a[1],b[1],f),4.5,WHITE,null);
  }else if(i===1){ // range: a blob with marching dashes and a few records inside
    c.save();c.beginPath();for(let j=0;j<=28;j++){const a=j/28*Math.PI*2,r=17+3.5*Math.sin(a*3+1)+2*Math.cos(a*5);j?c.lineTo(x+r*1.25*Math.cos(a),y+r*Math.sin(a)):c.moveTo(x+r*1.25*Math.cos(a),y+r*Math.sin(a));}
    c.closePath();c.fillStyle=rgba(CYAN,.14);c.fill();c.setLineDash([6,4]);c.lineDashOffset=-t*9;c.strokeStyle=CYAN;c.lineWidth=2.5;c.stroke();c.restore();
    [[-8,-4],[5,-7],[9,5],[-3,7]].forEach(([dx,dy],j)=>circle(c,x+dx,y+dy,3,rgba(WHITE,.6+.4*Math.sin(t*2+j*1.6)),null));
  }else{ // threats: an orange arrow nudging towards a cyan organism dot
    const n=3*Math.sin(t*3);circle(c,x+12,y,9,rgba(CYAN,.25),CYAN,2.5);K.arrow(c,x-22+n,y,x+1+n,y,ORANGE,4);
  }}
function leftCard(c,V,t,rects){
  const r=LC,ix=r.x+14,iw=r.w-28,dim=mix(1,.45,V.lDim);
  withA(c,dim,()=>{
    cardFrame(c,r,CYAN,1,0,t);
    const tp=plate(c,T.assess,r.x+r.w/2,r.y+12,{col:CYAN,stroke:CYAN});push(rects,dim,'assess',tp);
    const sh=cwrap(c,T.assessSub,ix,r.y+78,iw,WHITE,26);push(rects,dim,'assessSub',{x:ix,y:r.y+58,w:iw,h:sh});
    const vs=[V.l0,V.l1,V.l2];
    // the data channel (drawn under the rows' ports)
    withA(c,V.lp,()=>{const pl=plateW(c,T.risk),px=r.x+r.w/2+pl/2;K.sline(c,[[CH,ROW0+RH/2],[CH,PLY+16],[px+2,PLY+16]],rgba(CYAN,.35),3);});
    T.rows.forEach((p,i)=>withA(c,vs[i],()=>{
      const top=ROW0+i*RH,cy=top+RH/2;
      rowIcon(c,i,ix+24,cy,t);
      const rows=colLines(c,p,CH-14-(ix+58)),n=rows.length,b0=cy-n*25/2+18;
      rows.forEach((q,j)=>text(c,q,ix+58,b0+j*25,22,i===2?ORANGE:WHITE,'left'));
      push(rects,vs[i],'row'+i,{x:ix+58,y:b0-19,w:Math.max(...rows.map(q=>measure(c,q,22))),h:(n-1)*25+25});
      K.sline(c,[[ix+58+Math.max(...rows.map(q=>measure(c,q,22)))+6,cy],[CH-7,cy]],rgba(CYAN,.25),2);
      circle(c,CH,cy,5,FILL,CYAN,2.5);}));
    // dots: data from each row down the channel into the plate
    if(V.lp>0.5){const pl=plateW(c,T.risk),px=r.x+r.w/2+pl/2,ey=PLY+16;
      for(let i=0;i<3;i++){if(vs[i]<1)continue;const y0=ROW0+i*RH+RH/2,len1=ey-y0,len2=CH-px,tot=len1+len2;
        for(let j=0;j<2;j++){const q=mod(t*.32+i*.21+j*.5),d=q*tot,a=Math.min(1,q*8)*(1-smooth((q-.9)/.1))*V.lp;
          const X=d<len1?CH:CH-(d-len1),Y=d<len1?y0+d:ey;circle(c,X,Y,4.5,rgba(CYAN,a),rgba(INK,.6*a),1.2);}}}
    withA(c,V.lp,()=>{const pp=plate(c,T.risk,r.x+r.w/2,PLY,{col:CYAN,stroke:CYAN});push(rects,V.lp*dim,'risk',pp);
      if(V.lp>=1){const u=.5+.5*Math.sin(t*2.4);D.round(c,pp.x-3,pp.y-3,pp.w+6,pp.h+6,12,null,rgba(CYAN,.25+.45*u));}});
  });
}

// ── right card: law and management ───────────────────────────────────────
function rightCard(c,V,t,rects){
  const r=RC,ix=r.x+14,iw=r.w-28;
  cardFrame(c,r,GREEN,V.rOn,1-V.rOn,t);
  const ta=mix(.45,1,V.rOn);
  withA(c,ta,()=>{const tp=plate(c,T.law,r.x+r.w/2,r.y+12,{col:V.rOn>.5?GREEN:MUTED,stroke:V.rOn>.5?GREEN:rgba(MUTED,.8)});push(rects,ta,'law',tp);});
  withA(c,V.rSub,()=>{const sh=cwrap(c,T.lawSub,ix,r.y+78,iw,WHITE,26);push(rects,V.rSub,'lawSub',{x:ix,y:r.y+58,w:iw,h:sh});});
  withA(c,V.rEll,()=>{
    const br=1+.04*Math.sin(t*1.6);
    // soft edge: radial glow squeezed into the ellipse
    c.save();c.translate(ELL.x,ELL.y);c.scale(1,ELL.ry/ELL.rx);const g=c.createRadialGradient(0,0,ELL.rx*.35,0,0,ELL.rx*1.12*br);
    g.addColorStop(0,rgba(GREEN,.22));g.addColorStop(.75,rgba(GREEN,.14));g.addColorStop(1,rgba(GREEN,0));c.fillStyle=g;c.beginPath();c.arc(0,0,ELL.rx*1.12*br,0,Math.PI*2);c.fill();c.restore();
    c.save();c.beginPath();c.ellipse(ELL.x,ELL.y,ELL.rx*br,ELL.ry*br,0,0,Math.PI*2);c.setLineDash([10,8]);c.lineDashOffset=-t*8;c.strokeStyle=rgba(GREEN,.85);c.lineWidth=2.5;c.stroke();c.restore();
    const sp=plate(c,T.scope,ELL.x,ELL.y-ELL.ry-16,{col:GREEN,stroke:GREEN});push(rects,V.rEll,'scope',sp);});
  withA(c,V.rRows,()=>{
    const w1=measure(c,T.may,22),w2=measure(c,T.mayNot,22),gw=34+Math.max(w1,w2),gx=ELL.x-gw/2;
    [[T.may,ELL.y-14,true],[T.mayNot,ELL.y+28,false]].forEach(([p,y,ok],i)=>{
      const wob=ok?0:1.5*Math.sin(t*4);
      if(ok)checkMark(c,gx+11,y-7,GREEN);else crossMark(c,gx+11+wob,y-7,WHITE,.9);
      text(c,p,gx+34,y,22,WHITE,'left');push(rects,V.rRows,'rule'+i,{x:gx+34,y:y-19,w:measure(c,p,22),h:25});});});
  withA(c,V.rp,()=>{const pp=plate(c,T.rules,r.x+r.w/2,PLY,{col:GREEN,stroke:GREEN});push(rects,V.rp,'rules',pp);
    if(V.rp>=1){const u=.5+.5*Math.sin(t*2.4+1.5);D.round(c,pp.x-3,pp.y-3,pp.w+6,pp.h+6,12,null,rgba(GREEN,.25+.45*u));}});
}

// ── middle: the "≠" ──────────────────────────────────────────────────────
function middle(c,V,t,rects){
  withA(c,V.neq,()=>{const {x,y}=NEQ,u=mod(t*.7),sc=mix(.6,1,smooth(V.neq*1.4));
    if(V.neq>=1)circle(c,x,y,24+10*u,null,rgba(YELLOW,.8*(1-u)),3);
    circle(c,x,y,24*sc,FILL,YELLOW,3);
    K.sline(c,[[x-11*sc,y-5*sc],[x+11*sc,y-5*sc]],YELLOW,4);K.sline(c,[[x-11*sc,y+6*sc],[x+11*sc,y+6*sc]],YELLOW,4);
    K.sline(c,[[x+6*sc,y-14*sc],[x-6*sc,y+15*sc]],YELLOW,4);});
}

// ── bottom: question and answer ──────────────────────────────────────────
function toolIcon(c,i,x,y,t){
  if(i===0){ // quadrat: a square frame with a grid; individuals inside blink as they are counted
    const s=22;D.round(c,x-s,y-s,2*s,2*s,3,rgba(CYAN,.1),CYAN);
    for(let j=1;j<3;j++){K.sline(c,[[x-s+j*s*2/3,y-s],[x-s+j*s*2/3,y+s]],rgba(CYAN,.5),1.5);K.sline(c,[[x-s,y-s+j*s*2/3],[x+s,y-s+j*s*2/3]],rgba(CYAN,.5),1.5);}
    const on=Math.floor(mod(t*1.2,5));[[-13,-12],[8,-14],[-4,2],[13,9],[-14,13]].forEach(([dx,dy],j)=>circle(c,x+dx,y+dy,4,j<=on?WHITE:rgba(WHITE,.35),null));
  }else if(i===1){ // mark-recapture: an animal dot with a cyan mark, released and caught again (arrow going round)
    const a0=t*1.4;c.save();c.beginPath();c.arc(x,y,22,a0,a0+Math.PI*1.45);c.strokeStyle=rgba(WHITE,.7);c.lineWidth=2.5;c.stroke();c.restore();
    const ax=x+22*Math.cos(a0+Math.PI*1.45),ay=y+22*Math.sin(a0+Math.PI*1.45),ta=a0+Math.PI*1.45+Math.PI/2;
    c.save();c.translate(ax,ay);c.rotate(ta);c.beginPath();c.moveTo(6,0);c.lineTo(-5,-6);c.lineTo(-5,6);c.closePath();c.fillStyle=rgba(WHITE,.85);c.fill();c.restore();
    K.ellipse(c,x,y,11,8,rgba(WHITE,.85),null);const u=.5+.5*Math.sin(t*4);K.glow(c,x+6,y-5,9,CYAN,.4+.4*u);circle(c,x+6,y-5,4,CYAN,INK,1.5);
  }else{ // repeated surveys: three sheets, the same check made again and again
    const on=Math.floor(mod(t*1.1,3));
    for(let j=0;j<3;j++){const sx=x-24+j*16,sy=y-18+j*4,hot=j===on;D.round(c,sx-10,sy-2,26,32,4,hot?rgba(CYAN,.3):FILL,hot?CYAN:rgba(CYAN,.6));
      checkMark(c,sx+3,sy+14,hot?WHITE:rgba(WHITE,.55),.55);}
  }}
function bottom(c,V,t,rects){
  withA(c,V.q,()=>{const qb=box(c,T.q,326,QY,{al:'center',maxW:620,stroke:WHITE});push(rects,V.q,'q',qb);
    withA(c,V.ans,()=>K.arrow(c,326,qb.y+qb.h+2,326,ANS.y-2,WHITE,3));});
  withA(c,V.ans,()=>{D.round(c,ANS.x,ANS.y,ANS.w,ANS.h,14,FILL,rgba(CYAN,.9));
    text(c,T.need,ANS.x+18,ANS.y+30,22,CYAN,'left');push(rects,V.ans,'need',{x:ANS.x+18,y:ANS.y+11,w:measure(c,T.need,22),h:25});});
  [V.a0,V.a1,V.a2].forEach((a,i)=>withA(c,a*V.ans,()=>{toolIcon(c,i,COLX[i],ICY,t);
    text(c,T.tools[i],COLX[i],ANS.y+ANS.h-12,22,WHITE,'center');const w=measure(c,T.tools[i],22);push(rects,a*V.ans,'tool'+i,{x:COLX[i]-w/2,y:ANS.y+ANS.h-31,w,h:25});}));
  // data feed back up into the assessment card (cyan dashes)
  withA(c,V.link,()=>{const x=ANS.x+24;c.save();c.setLineDash([7,6]);c.lineDashOffset=t*10;K.line(c,[[x,ANS.y-2],[x,LC.y+LC.h+16]],rgba(CYAN,.9),2.5);c.restore();
    K.arrow(c,x,LC.y+LC.h+18,x,LC.y+LC.h+3,CYAN,2.5);});
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){return[[['cyan',T.legAssess],['threat',T.legThreat],['dots',T.legDots]],[['green',T.legLaw],['scope',T.legScope]],[['neq',T.legNeq],['cyan',T.legData]]][k];}
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16;
  if(kind==='cyan'||kind==='green'){const col=kind==='cyan'?CYAN:GREEN;D.round(c,x+3,y+2,36,28,6,CARDF,col);D.round(c,x+9,y+8,24,6,3,rgba(col,.8),null);}
  else if(kind==='threat'){const n=2*Math.sin(t*3);K.arrow(c,x+2+n,ay,x+30+n,ay,ORANGE,4);}
  else if(kind==='dots'){K.sline(c,[[x+4,ay],[x+38,ay]],rgba(CYAN,.35),3);for(let i=0;i<2;i++){const q=mod(t*.5+i*.5);circle(c,x+4+q*34,ay,4.5,CYAN,null);}}
  else if(kind==='scope'){const b=1+.06*Math.sin(t*1.6);c.save();c.beginPath();c.ellipse(ax,ay,18*b,12*b,0,0,Math.PI*2);c.fillStyle=rgba(GREEN,.18);c.fill();c.setLineDash([5,4]);c.lineDashOffset=-t*8;c.strokeStyle=GREEN;c.lineWidth=2;c.stroke();c.restore();}
  else if(kind==='neq'){circle(c,ax,ay,15,FILL,YELLOW,2.5);K.sline(c,[[ax-7,ay-4],[ax+7,ay-4]],YELLOW,3);K.sline(c,[[ax-7,ay+4],[ax+7,ay+4]],YELLOW,3);K.sline(c,[[ax+4,ay-10],[ax-4,ay+10]],YELLOW,3);}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:WHITE});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  const RH2=34;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH2/2,rows=blines(c,p,iw-42),hh=RH2+(rows.length-1)*LH;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,2,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh;});
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
window.EnvironmentDraw.assess=draw;
window.EnvironmentDraw.assess.dbg=s_dbg;
})();

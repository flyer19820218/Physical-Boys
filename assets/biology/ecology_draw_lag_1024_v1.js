/* Ecology lesson 3 · "lag" canvas (predation tab, view 1), 2026-10-24. Why predator numbers follow prey numbers a step behind.
 * A schematic line chart only: x = time, y = number, no tick values or numbers anywhere ("Schematic" pill + "not measured data" line).
 * No food-chain arrow, no eaten/eater roles, no energy (lesson 2). The only arrowheads are the two axis ends and the lag bracket.
 * Pictures (K.SIZE, measured with PIL): EC4_vole 634x568, EC6_owl 383x836. Both are cut out with a 1-3 px pale rim (mean RGB ~200).
 * The chase-style flood fill would erase the light vole belly and owl face (PIL test), so here only light low-saturation pixels
 * within 2 px of transparency are cleared (PIL test: vole ~2.5k px, owl ~1.7k px, rim only).
 * Curves (u = 0..1 along the time axis): prey(u) = .5 + a(u)·cos(2π(u-.30)/.7), a = .36, shrinking 15 % after u = .6 (so the second
 * rise is not a copy of the first); owl(u) = .32 + .17·cos(2π(u-.45)/.7): the same shape shifted later (lag .15) and smaller.
 * Four steps, 8 s each; s.shown = step. Each step draws both curves on from the previous step's end to its own end
 * (E = .33 / .50 / .70 / 1) in 3 s, a dot rides each tip, then the dot keeps sliding along the newly drawn piece.
 *  0 prey rise (owl curve drawn at 45 % alpha): legend (icons + names), axes, "More food" tag by the rising mouse curve; ring at the mouse peak.
 *  1 predators follow: owl curve climbs to its peak; dashed drops from both peaks and a double-headed "Time lag" bracket.
 *  2 prey fall: mouse curve falls; "More eaten" tag with a dashed leader to the falling mouse curve; ring at the owl peak.
 *  3 predators fall later: owl curve falls ("Less food" tag); the chart shrinks upwards and a note box explains real cases.
 * Labels from K.LAB; new labels defined here as P(): NOT_DATA, EATEN, REAL_NOTE, and the two legend names built from LAB.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const tr=p=>D.tr(p);
// new labels (not in K.LAB)
const NOT_DATA=P('示意，不是量測資料','Schematic, not measured data');
const EATEN=P('被吃得多','More eaten');
const REAL_NOTE=P('現實中還有別的食物、疾病、遷移，也不是固定的週期','In reality there are other foods, disease and migration, and no fixed cycle');
const N=4,PER=8,CW=960,MOVE=.9,REV=3;
const WHITE=C.white,PREY=C.yellow,PRED=C.cyan,MUTED=C.muted;

// ── layout ────────────────────────────────────────────────────────────────
const X0=100,X1=860,UX0=112,UX1=848,Y_TOP=112;         // axes; curves run from UX0 to UX1
const BOT=[452,392];                                      // x-axis height: steps 0-2, step 3 (chart shrinks for the note box)
const NOTE={x:100,y:420,w:760,h:122};
const E=[.33,.47,.7,1];                                    // how far the curves have run at the end of each step
const PK_PREY=.30,PK_PRED=.45,TR_PRED=.80;
const prey=u=>.5+.36*(1-.15*smooth((u-.6)/.4))*Math.cos(2*Math.PI*(u-PK_PREY)/.7);
const pred=u=>.32+.17*Math.cos(2*Math.PI*(u-PK_PRED)/.7);

// ── picture rim cleanup (once per picture, only 2 px deep) ────────────────
const CLEAN={};
function cleaned(file){
  if(CLEAN[file])return CLEAN[file];const im=K.pic(K.src(file));if(!im)return null;
  try{const W=im.naturalWidth,H=im.naturalHeight,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,n=W*H,dep=new Uint8Array(n).fill(255),q=new Int32Array(n);let h=0,e=0;
    const light=i=>{const j=i*4,r=a[j],gg=a[j+1],b=a[j+2];return a[j+3]>=20&&(r+gg+b)/3>150&&Math.max(r,gg,b)-Math.min(r,gg,b)<70;};
    for(let i=0;i<n;i++)if(a[i*4+3]<20){dep[i]=0;q[e++]=i;}
    while(h<e){const i=q[h++];if(dep[i]>=2)continue;const x=i%W;
      for(const k of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(k>=0&&k<n&&dep[k]===255&&light(k)){dep[k]=dep[i]+1;q[e++]=k;}}
    for(let i=0;i<n;i++)if(dep[i]>0&&dep[i]<255)a[i*4+3]=0;
    g.putImageData(d,0,0);CLEAN[file]=cv;}catch(err){CLEAN[file]=im;}
  return CLEAN[file];
}
function picIn(c,file,r){const cv=cleaned(file);if(cv)c.drawImage(cv,r.x,r.y,r.w,r.h);else K.drawIn(c,file,r);}

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,size=22,minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,'rgba(11,26,21,.92)',rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');
  return{x:bx,y,w,h};
}
function ringAt(c,x,y,t,col){const u=mod(t*.7);circle(c,x,y,10+u*20,null,rgba(col,.85*(1-u)),3);circle(c,x,y,7,col,C.ink,2);}
function head(c,x,y,dir,col){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(x-dir*14,y-8);c.lineTo(x-dir*14,y+8);c.closePath();c.fillStyle=col;c.fill();c.restore();}
function headUp(c,x,y,col){c.save();c.beginPath();c.moveTo(x,y);c.lineTo(x-8,y+14);c.lineTo(x+8,y+14);c.closePath();c.fillStyle=col;c.fill();c.restore();}
// a curve from u=0 to u=end; dash [] for prey, long dash for the owl (so the two differ without colour too)
function curve(c,f,end,col,X,Y,dash){
  if(end<=0)return;c.save();c.lineCap='round';c.lineJoin='round';c.setLineDash(dash);
  c.beginPath();const n=Math.max(2,Math.ceil(end*240));for(let i=0;i<=n;i++){const u=end*i/n;i?c.lineTo(X(u),Y(f(u))):c.moveTo(X(u),Y(f(u)));}
  c.shadowColor=rgba(col,.55);c.shadowBlur=10;c.strokeStyle=col;c.lineWidth=5;c.stroke();c.restore();
}
function rider(c,x,y,col,t){glow(c,x,y,26,col,.45);circle(c,x,y,8,col,C.ink,2.5);K.pulse(c,x,y,t,col,9);}
function leader(c,p0,p1,col,t){c.save();c.lineCap='round';c.setLineDash([7,7]);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...p0);c.lineTo(...p1);c.strokeStyle=rgba(col,.85);c.lineWidth=2.5;c.stroke();c.restore();}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.lagSt||(s.lagSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;st.cv=k===3?1:0;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.c0=st.cv;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,mu=moving?smooth(x):1;
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d,s1);if(!moving)return now;const was=vis(st.from,9,s0,0,s1);return now>=was?now:mix(was,now,mu);};
  const cT=k===3?1:0;st.cv=st.from>=0?mix(st.c0??cT,cT,smooth(tau/MOVE)):cT;const cv=st.cv;

  // geometry (chart bottom moves up in step 3)
  const B=mix(BOT[0],BOT[1],cv),VT=150,X=u=>mix(UX0,UX1,u),Y=v=>B-v*(B-VT);
  // how far the curves have run: from the previous step's end to this step's end in REV s
  const e0=k?E[k-1]:0,rv=smooth(tau/REV),end=mix(e0,E[k],rv),drawing=rv<1;

  // ── legend: icon + line sample + name for each curve ──
  const nPrey=P(`${L('vole','田鼷鼠','Field mouse')[0]}（${L('prey','獵物','Prey')[0]}）`,`${L('vole','田鼷鼠','Field mouse')[1]} (${L('prey','獵物','Prey')[1].toLowerCase()})`);
  const nPred=P(`${L('owl','領角鴞','Collared scops owl')[0]}（${L('predator','掠食者','Predator')[0]}）`,`${L('owl','領角鴞','Collared scops owl')[1]} (${L('predator','掠食者','Predator')[1].toLowerCase()})`);
  withA(c,A(0,0,3),()=>{
    let cx=16;const vy=12,bob=2*Math.sin(t*2.2);
    picIn(c,'EC4_vole.png',{x:cx,y:vy+bob,w:80,h:80*568/634});cx+=90;
    K.sline(c,[[cx,52],[cx+34,52]],PREY,5);cx+=44;
    text(c,nPrey,cx,60,24,PREY);cx+=measure(c,nPrey,24)+40;
    withA(c,A(0,.4,3),()=>{
      const oh=84,ow=oh*383/836;picIn(c,'EC6_owl.png',{x:cx,y:8-bob,w:ow,h:oh});cx+=ow+10;
      c.save();c.setLineDash([14,9]);K.sline(c,[[cx,52],[cx+34,52]],PRED,5);c.restore();cx+=44;
      text(c,nPred,cx,60,24,PRED);
    });
  });

  // ── axes (no ticks, no numbers) ──
  withA(c,A(0,.2,3),()=>{
    K.sline(c,[[X0,B],[X0,Y_TOP+12]],WHITE,3);headUp(c,X0,Y_TOP,WHITE);
    K.sline(c,[[X0,B],[X1-12,B]],WHITE,3);head(c,X1,B,1,WHITE);
    text(c,L('number','數量','Number'),X0+14,Y_TOP+20,22,WHITE);
    text(c,L('time','時間','Time'),X1+10,B+8,22,WHITE);
    tag(c,L('schematic','示意','Schematic'),X1,Y_TOP-4,{al:'right',col:WHITE});
  });

  // ── the two curves with a dot riding each tip ──
  const curA=A(0,.5,3);
  withA(c,curA,()=>{
    const oa=.45+.55*A(1,0,3);                                 // owl curve dimmer in step 0 (focus on the mice)
    withA(c,oa,()=>curve(c,pred,end,PRED,X,Y,[16,10]));
    curve(c,prey,end,PREY,X,Y,[]);
    // rider: at the tip while drawing, then sliding along this step's piece (3 s loop)
    const ru=drawing?end:mix(e0,E[k],smooth(mod(t-st.T-REV,3)/3));
    withA(c,oa,()=>rider(c,X(ru),Y(pred(ru)),PRED,t+.4));
    rider(c,X(ru),Y(prey(ru)),PREY,t);
    // tips stay marked while the rider slides back
    if(!drawing){circle(c,X(E[k]),Y(prey(E[k])),6,PREY,C.ink,2);circle(c,X(E[k]),Y(pred(E[k])),6,PRED,C.ink,2);}
  });

  // ── peak / trough rings (appear once the curve reaches them) ──
  const ring=(u,f,col,s0,s1,ph)=>{if(k<s0||k>s1||end<u)return;withA(c,curA*(k===s0?clamp((end-u)/.03):1),()=>ringAt(c,X(u),Y(f(u)),t+ph,col));};
  ring(PK_PREY,prey,PREY,0,1,0);
  ring(PK_PRED,pred,PRED,1,2,.5);
  ring(TR_PRED,pred,PRED,3,3,.5);

  // ── step 0: more food beside the rising mouse curve ──
  withA(c,A(0,1.2,0),()=>{tag(c,L('moreFood','食物變多','More food'),X(.215),Y(.58),{col:PREY});});

  // ── step 1-3: time lag bracket between the two peaks ──
  withA(c,A(1,1.6,3),()=>{
    const xa=X(PK_PREY),xb=X(PK_PRED),yb=Y(prey(PK_PREY))-34;
    c.save();c.setLineDash([5,6]);c.lineDashOffset=-t*10;
    K.sline(c,[[xa,Y(prey(PK_PREY))-12],[xa,yb]],rgba(PREY,.8),2.5);K.sline(c,[[xb,Y(pred(PK_PRED))-12],[xb,yb]],rgba(PRED,.8),2.5);c.restore();
    const g=k===1?1+.06*Math.sin(t*3):1;
    K.sline(c,[[xa+12,yb],[xb-12,yb]],WHITE,3);head(c,xa,yb,-1,WHITE);head(c,xb,yb,1,WHITE);
    const lp=L('lag','時間差','Time lag');
    c.save();c.translate((xa+xb)/2,yb-26);c.scale(g,g);tag(c,lp,0,-20,{al:'center',col:WHITE,size:24,minX:-999,maxX:999});c.restore();
  });

  // ── step 2: more owls, more mice eaten ──
  withA(c,A(2,1.4,2),()=>{
    const p=tag(c,EATEN,X(.62),Y(.80),{col:PREY});
    const u=Math.min(end,.58);leader(c,[p.x+p.w*.3,p.y+p.h],[X(u),Y(prey(u))-10],PREY,t);
  });

  // ── step 3: owls have less food, fall later; note box ──
  withA(c,A(3,1.2,3),()=>{
    const p=tag(c,L('lessFood','食物變少','Less food'),X(.58),Y(.74),{col:PRED});
    const u=Math.min(end,.72);leader(c,[p.x+p.w*.6,p.y+p.h],[X(u),Y(pred(u))-10],PRED,t);
  });
  withA(c,A(3,1.8,3),()=>{
    D.round(c,NOTE.x,NOTE.y,NOTE.w,NOTE.h,16,'rgba(28,61,52,.95)',rgba(WHITE,.45+.25*Math.sin(t*2)));
    const rows=K.splitLines(c,tr(REAL_NOTE),NOTE.w-48,26),lh=36,h=rows.length*lh;
    K.wrap(c,REAL_NOTE,NOTE.x+NOTE.w/2,NOTE.y+NOTE.h/2-h/2+26*.95,NOTE.w-48,26,WHITE,lh,'center');
  });

  text(c,NOT_DATA,12,590,22,MUTED,'left');
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.lag=draw;
})();

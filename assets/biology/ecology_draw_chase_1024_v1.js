/* Ecology lesson 3 · "chase" canvas (predation tab, view 0), 2026-10-24. Who gains, who is harmed when a mantis catches a grasshopper.
 * Only the + / − on each side; no food-chain arrow, no eaten/eater labels, no energy (those are lesson 2).
 * Pictures (K.SIZE, measured with PIL): EC13_mantis_grasshopper 692x1280, EC5_mantis 803x760, EC4_grasshopper 788x446.
 * All three are cut out (alpha 0 corners, subject reaches the edges) but carry a 1-3 px light fringe (semi-transparent rim,
 * mean RGB ~200); on the dark board it shows as a pale outline, so light low-saturation pixels connected to transparency are
 * cleared once per picture (lum>150, max-min<70; PIL test: removes the rim, keeps the white foreleg spines).
 * EC13 anchors (picture pixels): grasshopper thorax (215,430), mantis abdomen (575,860).
 * Three steps, 8 s each; s.shown = step. Elements carry the step range they live in, so a step change fades only what changes.
 *  0 who is who: EC13 large in the middle (slow breathing sway); left column "Prey" + "Grasshopper" pills, right column
 *    "Predator" + "Mantis" pills, each with a dashed leader to the animal and a pulsing ring there.
 *  1 gains and losses: a big green "+" disc (glyph drawn as bars) pops in under the predator with "Gains", a big orange "−" disc under the prey
 *    with "Harmed"; the sign legend pill fades in at the bottom; the discs pulse.
 *  2 what signs mean: both discs shrink and move up (kept); left: a small card "A chase can miss" where a mantis lunges and
 *    a grasshopper hops away (loops every 3.2 s); right: the sign note in a box.
 * Labels from K.LAB; one new label MISS defined here as P(). The + / − glyphs are drawn as bars (not K.LAB plus/minus text) so both signs look equal.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const MISS=P('追捕也可能撲空','A chase can miss');           // new label (not in K.LAB)
const N=3,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,MUTED=C.muted;

// ── layout ────────────────────────────────────────────────────────────────
const PIC='EC13_mantis_grasshopper.png',BOX={x:350,y:16,w:260,h:460};
const PR=K.fitRect(PIC,BOX.x,BOX.y,BOX.w,BOX.h);                  // 248.9 x 460 at x 355.6
const ppt=(px,py)=>[PR.x+px/692*PR.w,PR.y+py/1280*PR.h];
const PREY_AT=ppt(215,430),PRED_AT=ppt(575,860);                    // grasshopper thorax, mantis abdomen
const LC=170,RC=790;                                                // column centres
const Y_ROLE=34,Y_NAME=92;
// sign disc: [cy, r] in steps 0-1 (big) and step 2 (compact)
const SIGN_BIG=[248,62],SIGN_SMALL=[196,42];
const CARD={x:20,y:300,w:300,h:180},NOTE={x:640,y:300,w:300,h:180};

// ── picture fringe cleanup (once per picture) ─────────────────────────────
const CLEAN={};
function cleaned(file){
  if(CLEAN[file])return CLEAN[file];const im=K.pic(K.src(file));if(!im)return null;
  try{const W=im.naturalWidth,H=im.naturalHeight,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,n=W*H,m=new Uint8Array(n),q=new Int32Array(n);let h=0,e=0;
    for(let i=0;i<n;i++){const j=i*4,r=a[j],gg=a[j+1],b=a[j+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
      if(a[j+3]<20){m[i]=2;q[e++]=i;}else if((r+gg+b)/3>150&&mx-mn<70)m[i]=1;}
    while(h<e){const i=q[h++],x=i%W;const nb=[x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W];
      for(const k of nb)if(k>=0&&k<n&&m[k]===1){m[k]=3;a[k*4+3]=0;q[e++]=k;}}
    g.putImageData(d,0,0);CLEAN[file]=cv;}catch(err){CLEAN[file]=im;}
  return CLEAN[file];
}
function picIn(c,file,r){const cv=cleaned(file);if(cv)c.drawImage(cv,r.x,r.y,r.w,r.h);else K.drawIn(c,file,r);}

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function leader(c,p0,p1,col,t){
  c.save();c.lineCap='round';c.setLineDash([8,7]);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...p0);c.lineTo(...p1);c.strokeStyle=rgba(col,.85);c.lineWidth=3;c.stroke();c.restore();
  circle(c,p1[0],p1[1],7,col,C.ink,2);K.pulse(c,p1[0],p1[1],t,col,8);
}
// a sign disc with a drawn glyph (bars, so + and − have the same weight in both languages); plus=true draws "+"
function signDisc(c,x,y,r,plus,col,t,pop,ring=1){
  const rr=r*(.4+.6*ease(pop))*(1+.03*Math.sin(t*2.6)),bw=rr*.95,bt=Math.max(8,rr*.2);
  glow(c,x,y,rr*1.7,col,.25);
  circle(c,x,y,rr,'rgba(11,26,21,.92)',col,5);
  const u=mod(t*.55);circle(c,x,y,rr+4+u*18*ring,null,rgba(col,.7*(1-u)),3);
  c.save();c.fillStyle=col;c.beginPath();c.roundRect(x-bw/2,y-bt/2,bw,bt,bt/2);if(plus)c.roundRect(x-bt/2,y-bw/2,bt,bw,bt/2);c.fill();c.restore();
}
// wrapped, centred text whose rows are balanced (no single orphan character); returns nothing
function balanced(c,p,cx,cy,maxW,size,col,lh){
  const str=D.tr(p),n=K.splitLines(c,str,maxW,size).length;let lo=40,hi=maxW;
  while(hi-lo>2){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}
  const h=n*lh;K.wrap(c,p,cx,cy-h/2+size*.95,hi,size,col,lh,'center');
}
// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.chaseSt||(s.chaseSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;st.cv=k===2?1:0;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.c0=st.cv;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d,s1);if(!moving)return now;const was=vis(st.from,9,s0,0,s1);return now>=was?now:mix(was,now,u);};
  // compactness of the sign discs (0 big, 1 small) moves smoothly between steps
  const cTarget=k===2?1:0;st.cv=st.from>=0?mix(st.c0??cTarget,cTarget,smooth(tau/MOVE)):cTarget;const cv=st.cv;

  // ── the picture: slow breathing sway about the stem foot ──
  withA(c,A(0,0,2),()=>{
    const sw=.006*Math.sin(t*1.3),sc=1+.008*Math.sin(t*1.7),fx=PR.x+PR.w*.6,fy=PR.y+PR.h;
    c.save();c.translate(fx,fy);c.rotate(sw);c.scale(sc,sc);c.translate(-fx,-fy);picIn(c,PIC,PR);c.restore();
  });

  // ── roles and names (all steps) ──
  const roleA=A(0,.5,2),nameA=A(0,1.1,2),leadA=A(0,1.6,2);
  const wG=measure(c,L('grasshopper','蚱蜢','Grasshopper'),22)+28,wM=measure(c,L('mantis','螳螂','Mantis'),22)+28;
  withA(c,leadA,()=>{
    leader(c,[LC+wG/2+4,Y_NAME+20],PREY_AT,WHITE,t);
    leader(c,[RC-wM/2-4,Y_NAME+20],PRED_AT,YELLOW,t+.5);
  });
  withA(c,roleA,()=>{
    const pp=tag(c,L('prey','獵物','Prey'),LC,Y_ROLE,{al:'center',col:WHITE,active:true,size:26,maxX:330});
    const pd=tag(c,L('predator','掠食者','Predator'),RC,Y_ROLE,{al:'center',col:YELLOW,active:true,size:26,minX:632});
    if(k===0){pulseRing(c,pp,t,WHITE);pulseRing(c,pd,t+.7,YELLOW);}
  });
  withA(c,nameA,()=>{
    tag(c,L('grasshopper','蚱蜢','Grasshopper'),LC,Y_NAME,{al:'center',col:WHITE,maxX:330});
    tag(c,L('mantis','螳螂','Mantis'),RC,Y_NAME,{al:'center',col:YELLOW,minX:632});
  });

  // ── signs (steps 1-2) ──
  const cy=mix(SIGN_BIG[0],SIGN_SMALL[0],cv),r=mix(SIGN_BIG[1],SIGN_SMALL[1],cv);
  const plusA=A(1,.3,2),minusA=A(1,1.0,2);
  const popP=k===1&&!moving?clamp((tau-.3)/.6):1,popM=k===1&&!moving?clamp((tau-1.0)/.6):1;
  withA(c,plusA,()=>{signDisc(c,RC,cy,r,true,GREEN,t,popP,1-cv*.6);
    text(c,L('gain','得益','Gains'),RC,cy+r+40,26,GREEN,'center');});
  withA(c,minusA,()=>{signDisc(c,LC,cy,r,false,ORANGE,t+.4,popM,1-cv*.6);
    text(c,L('loss','受害','Harmed'),LC,cy+r+40,26,ORANGE,'center');});
  withA(c,A(1,1.8,2),()=>{
    const lg=tag(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains  − harmed  0 no evident effect'),CW/2,494,{al:'center',col:WHITE});
    if(k===1)withA(c,.5,()=>pulseRing(c,lg,t,WHITE));
  });

  // ── step 2: a chase can miss (left card) and the sign note (right box) ──
  withA(c,A(2,.8,2),()=>{
    D.round(c,CARD.x,CARD.y,CARD.w,CARD.h,16,'rgba(28,61,52,.95)',rgba(WHITE,.42));
    text(c,MISS,CARD.x+CARD.w/2,CARD.y+34,22,YELLOW,'center');
    const T=3.2,q=mod(t,T)/T;                                       // loop: crouch, lunge + hop, land, rest
    const lunge=q<.25?0:q<.45?smooth((q-.25)/.2):q<.8?1:1-smooth((q-.8)/.2);
    const hop=q<.25?0:q<.7?smooth((q-.25)/.45):1,fade=q<.85?1:1-smooth((q-.85)/.15),fin=q<.05?smooth(q/.05):1;
    const gy=CARD.y+CARD.h-12;
    // grasshopper: starts in front of the mantis' forelegs, hops away to the right along an arc
    const gw=96,gh=gw*446/788,gx0=CARD.x+150,gx1=CARD.x+CARD.w-gw-12,gx=mix(gx0,gx1,hop),gyy=gy-gh-60*Math.sin(Math.PI*hop);
    if(hop>0&&hop<1){c.save();c.setLineDash([5,6]);c.beginPath();for(let i=0;i<=20;i++){const v=i/20*hop;const xx=mix(gx0,gx1,v)+gw/2,yy=gy-gh/2-60*Math.sin(Math.PI*v);i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.strokeStyle=rgba(WHITE,.55);c.lineWidth=2.5;c.stroke();c.restore();}
    withA(c,fade*fin,()=>picIn(c,'EC4_grasshopper.png',{x:gx,y:gyy,w:gw,h:gh}));
    // mantis: lunges a little forward and comes back
    const mw=124,mh=mw*760/803,mx=CARD.x+14+22*lunge;
    picIn(c,'EC5_mantis.png',{x:mx,y:gy-mh,w:mw,h:mh});
    // a small "miss" burst in front of the forelegs while the grasshopper is already gone
    if(lunge>.6&&hop>.4)withA(c,clamp((lunge-.6)/.4)*fade,()=>{const bx=mx+mw+6,by=gy-mh*.62;
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2+t*.6;K.sline(c,[[bx+9*Math.cos(a),by+9*Math.sin(a)],[bx+18*Math.cos(a),by+18*Math.sin(a)]],rgba(WHITE,.8),2.5);}});
  });
  withA(c,A(2,1.6,2),()=>{
    D.round(c,NOTE.x,NOTE.y,NOTE.w,NOTE.h,16,'rgba(28,61,52,.95)',rgba(YELLOW,.5+.25*Math.sin(t*2)));
    const p=L('signNote','正負號描述利害，不是死亡百分比','Signs describe effects, not death percentages');
    balanced(c,p,NOTE.x+NOTE.w/2,NOTE.y+NOTE.h/2,NOTE.w-36,24,WHITE,34);
  });

  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.chase=draw;
})();

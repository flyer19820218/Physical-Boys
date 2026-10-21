/* Fossils · "Forefoot bones" canvas (horse tab, view 1), 2026-10-21.
 * Five forefoot skeletons (foot_1..foot_5.png, AI illustrations cut at one scale) stand side by side at one scale.
 * The current one gets a wide slot with a yellow frame; its toes are counted one by one (numbered markers),
 * the middle toe is outlined in yellow, side toes / splints in cyan, the hoof is pointed out in orange.
 * Steps 3 and 4 compare the current foot with the one on its left. A toe-count strip runs along the bottom.
 * No morphing between feet: only highlighting and side-by-side comparison.
 * Every label position is a fraction of its picture, measured from the PNGs (alpha runs and dark tip regions).
 */
(()=>{'use strict';
const K=window.FossilKit,{P,C,text,dashed,circle,glow,stageClock,fade,ease,mix,clamp,measure,D,rgba,drawIn,arrow,line,splitLines,marker,MONO}=K;
const N=5,PER=6;

// All pictures share one scale S and stand on one base line.
const S=.84,BASE=404,X0=20;
// Width of each slot when it is not the current one; the current slot takes the rest of the 920 px.
const NW=[176,146,146,136,150],NSUM=NW.reduce((a,b)=>a+b,0),WC=i=>920-(NSUM-NW[i]);
const BONE='#e8dfc4';
const NAMES=[P(`始祖馬`,`Hyracotherium`),P(`中新馬`,`Mesohippus`),P(`草原古馬`,`Merychippus`),P(`上新馬`,`Pliohippus`),P(`現代馬`,`Modern horse`)];

// Middle toe outline, measured from the pictures: [row y, left x, right x] in picture pixels, top to bottom.
const MID2=[[226,43,66],[260,43,65],[310,44,65],[340,40,70],[370,43,67],[400,43,67],[440,44,67],[455,41,69],[465,43,67],[471,52,58]];
const MID3=[[188,34,64],[250,37,61],[310,35,64],[330,28,70],[360,30,68],[380,35,64],[400,31,67],[425,30,68],[440,24,74],[452,23,76],[462,28,71],[471,45,53]];
const MID4=[[186,18,50],[240,20,48],[300,19,50],[330,15,55],[350,12,58],[362,15,54],[380,19,50],[410,15,54],[430,7,62],[450,1,68],[462,4,65],[471,25,45]];
const MID5=[[168,28,68],[240,32,64],[280,29,67],[310,23,72],[330,19,77],[345,22,74],[370,28,68],[400,21,75],[420,9,87],[440,3,92],[452,1,94],[462,5,90],[471,35,57]];

// toes: [fx, fy] = bottom of each toe tip; roles: eq (all alike), side, mid.
// splints: [x, y, w, h] in picture pixels.  labels: side L/R, ly = label centre (fraction of height), tgt = leader target.
// cmp: tip level of the foot on the left vs the matching point here; off = arrow distance left of this foot.
const FEET=[
 {file:'foot_1.png',W:134,H:467,toes:[[.067,.914],[.308,.994],[.682,.994],[.924,.914]],roles:['eq','eq','eq','eq'],
  labels:[{side:'L',ly:.55,p:P(`四個趾，\n差不多粗`,`Four toes, about equally thick`),col:C.green,tgt:[.25,.75]},
          {side:'R',ly:.76,p:P(`小蹄`,`Small hooves`),col:C.orange,tgt:[.93,.895]}]},
 {file:'foot_2.png',W:112,H:472,toes:[[.102,.945],[.493,.994],[.887,.945]],roles:['side','mid','side'],mid:MID2,
  labels:[{side:'L',ly:.55,p:P(`側趾`,`Side toe`),col:C.cyan,tgt:[.268,.636]},
          {side:'R',ly:.60,p:P(`中間趾：\n較粗`,`Middle toe: thicker`),col:C.yellow,tgt:[.50,.60]}]},
 {file:'foot_3.png',W:100,H:472,toes:[[.092,.824],[.492,.994],[.898,.824]],roles:['side','mid','side'],mid:MID3,
  labels:[{side:'L',ly:.35,p:P(`側趾\n很細小`,`Thin side toe`),col:C.cyan,tgt:[.185,.61]},
          {side:'R',ly:.60,p:P(`中間趾：\n又長又粗`,`Middle toe: long and thick`),col:C.yellow,tgt:[.52,.62]},
          {side:'R',ly:.955,p:P(`蹄`,`Hoof`),col:C.orange,tgt:[.75,.955]}],
  cmp:{prevTip:[.887,.945],cur:[.092,.824],off:20,p:P(`比左邊短\n不碰地面`,`Shorter, off the ground`)}},
 {file:'foot_4.png',W:71,H:472,toes:[[.485,.994]],roles:['mid'],mid:MID4,splints:[[6,186,11,160],[51,196,11,150]],
  labels:[{side:'L',ly:.25,p:P(`退化的\n小骨`,`Splint bone`),col:C.cyan,tgt:[.155,.42]},
          {side:'R',ly:.40,p:P(`退化的\n小骨`,`Splint bone`),col:C.cyan,tgt:[.79,.45]},
          {side:'R',ly:.66,p:P(`中間趾：\n只剩一個`,`Middle toe: the only one`),col:C.yellow,tgt:[.70,.80]},
          {side:'R',ly:.955,p:P(`蹄`,`Hoof`),col:C.orange,tgt:[.95,.955]}],
  cmp:{prevTip:[.898,.824],cur:[.155,.73],off:14,p:P(`只剩小骨，\n沒有趾端`,`Only thin bones left, no toe tips`)}},
 {file:'foot_5.png',W:97,H:472,toes:[[.499,.994]],roles:['mid'],mid:MID5,splints:[[16,168,11,157],[68,168,11,162]],
  labels:[{side:'L',ly:.40,p:P(`退化的\n小骨`,`Splint bone`),col:C.cyan,tgt:[.225,.50]},
          {side:'R',ly:.40,p:P(`退化的\n小骨`,`Splint bone`),col:C.cyan,tgt:[.755,.50]},
          {side:'R',ly:.66,p:P(`只有\n一個趾`,`Just one toe`),col:C.yellow,tgt:[.73,.80]},
          {side:'R',ly:.955,p:P(`蹄`,`Hoof`),col:C.orange,tgt:[.94,.955]}]}];
const ROLE_COL={eq:C.green,side:C.cyan,mid:C.yellow};

// ── layout ─────────────────────────────────────────────────────────────────
// Slot widths ease from the previous step's layout to this one's, so the yellow frame slides.
function slots(s,k,t){
  if(s.feetK===undefined){s.feetK=k;s.feetFrom=k;s.feetT=t-9;}
  if(s.feetK!==k){s.feetFrom=s.feetK;s.feetK=k;s.feetT=t;}
  if(t<s.feetT)s.feetT=t;
  const u=ease((t-s.feetT)/.8),from=s.feetFrom;
  let x=X0;
  const list=FEET.map((f,i)=>{
    const w=mix(i===from?WC(i):NW[i],i===k?WC(i):NW[i],u),cx=x+w/2,fw=f.W*S,fh=f.H*S;
    const sl={x,w,cx,r:{x:cx-fw/2,y:BASE-fh,w:fw,h:fh},on:mix(i===from?1:0,i===k?1:0,u)};
    x+=w;return sl;});
  return{list,u};
}
const pt=(r,f)=>[r.x+f[0]*r.w,r.y+f[1]*r.h];
// Lines of a label: manual breaks (\n) first, then wrapped to the width.
const rowsOf=(c,p,w)=>D.tr(p).split('\n').flatMap(seg=>splitLines(c,seg,w,22));

// ── pieces ─────────────────────────────────────────────────────────────────
function midOutline(c,r,f,a,w){
  const L=[],R=[];
  f.mid.forEach(([y,xl,xr])=>{L.push([r.x+(xl-2)/f.W*r.w,r.y+y/f.H*r.h]);R.unshift([r.x+(xr+2)/f.W*r.w,r.y+y/f.H*r.h]);});
  c.save();c.globalAlpha*=a;c.lineJoin='round';c.beginPath();
  [...L,...R].forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();
  c.fillStyle=rgba(C.yellow,.10);c.fill();c.strokeStyle=C.yellow;c.lineWidth=w;c.stroke();c.restore();
}
function splintOutline(c,r,f,a){
  f.splints.forEach(([x,y,w,h])=>{
    c.save();c.globalAlpha*=a;
    D.round(c,r.x+(x-2)/f.W*r.w,r.y+y/f.H*r.h,(w+4)/f.W*r.w,h/f.H*r.h,5,rgba(C.cyan,.12),null);
    c.beginPath();c.roundRect(r.x+(x-2)/f.W*r.w,r.y+y/f.H*r.h,(w+4)/f.W*r.w,h/f.H*r.h,5);
    c.strokeStyle=C.cyan;c.lineWidth=2.5;c.stroke();c.restore();});
}
// A label in the empty zone beside the current foot, with a leader to the measured point on the picture.
function label(c,sl,lb,a){
  if(a<=0)return;
  const r=sl.r,L=lb.side==='L',x0=L?sl.x+6:r.x+r.w+14,x1=L?r.x-14:sl.x+sl.w-6,w=x1-x0;
  const rows=rowsOf(c,lb.p,w),lh=28,yc=r.y+lb.ly*r.h,top=yc-rows.length*lh/2;
  const [tx,ty]=pt(r,lb.tgt),sx=L?x1+6:x0-6;
  c.save();c.globalAlpha*=a;
  line(c,[[sx,yc],[tx,ty]],rgba(lb.col,.95),2);circle(c,tx,ty,4.5,lb.col,C.ink,1.5);
  rows.forEach((row,i)=>text(c,row,L?x1:x0,top+21+i*lh,22,lb.col,L?'right':'left'));
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {list,u}=slots(s,k,t),f=FEET[k],cur=list[k],r=cur.r;
  const out=held?1:1-fade(tau,PER-.45,.45);          // in Play all, the marks fade before the next step
  const settle=clamp((u-.6)/.4),pul=.5+.5*Math.sin(t*3.2);

  // comparison partner (steps 3 and 4): the foot on the left
  const prev=f.cmp?list[k-1]:null,ca=f.cmp?fade(tau,2.8,.7)*out*settle:0;

  // yellow frame on the current slot (it slides with the layout); every slot is clickable
  list.forEach((sl,i)=>{
    if(sl.on>.01){c.save();c.globalAlpha*=sl.on;D.round(c,sl.x+4,2,sl.w-8,464,16,rgba(C.yellow,.07),C.yellow);c.restore();}
    D.hit(sl.x,2,sl.w,530,'phase',i);});
  if(prev&&ca>0){const pr=prev.r;c.save();c.globalAlpha*=ca;c.setLineDash([7,6]);
    D.round(c,pr.x-8,pr.y-4,pr.w+16,pr.h+14,12,null,rgba(C.white,.75));c.restore();}

  // the five feet at one scale; the current one bright, the others faded
  list.forEach((sl,i)=>{
    const a=mix(.38,1,sl.on),pa=prev&&i===k-1?mix(a,.88,ca):a;
    if(sl.on>.5)glow(c,sl.cx,BASE-170,170,C.yellow,.10*sl.on);
    drawIn(c,FEET[i].file,sl.r,{alpha:pa});
    text(c,NAMES[i],sl.cx,458,22,sl.on>.5?C.yellow:rgba(C.white,.62),'center');});

  // outlines on the current foot: splints cyan, middle toe yellow (pulsing)
  const ma=fade(tau,.9,.6)*out*settle;
  if(f.splints)splintOutline(c,r,f,ma);
  if(f.mid&&ma>0){glow(c,...pt(r,[.5,.85]),80,C.yellow,.18*ma*(.6+.4*pul));midOutline(c,r,f,ma*(.55+.45*pul),2.5+1.5*pul);}

  // toes counted one by one: numbered markers just below each toe tip
  const T0=1.0,DT=.55,n=f.toes.length;
  let shown=0;
  f.toes.forEach((tp,i)=>{
    const a=fade(tau,T0+i*DT,.35)*settle*out;if(a<=0)return;shown=i+1;
    const [x,y]=pt(r,tp),pop=1+.35*(1-ease((tau-T0-i*DT)/.35));
    c.save();c.globalAlpha*=a;marker(c,x,y+17,i+1,null,13*pop,ROLE_COL[f.roles[i]]);c.restore();});
  // once all are counted, a ring walks over the toes again, one per second
  if(shown===n&&tau>T0+n*DT){const j=Math.floor(t)%n,[x,y]=pt(r,f.toes[j]);const q=(t*.8)%1;circle(c,x,y+17,15+q*9,null,rgba(ROLE_COL[f.roles[j]],.9*(1-q)*out),3);}

  // toe count beside the current foot
  const rcx=(r.x+r.w+12+cur.x+cur.w-8)/2,ta=settle*out;
  if(ta>0){c.save();c.globalAlpha*=ta;
    text(c,P(`趾數`,`Toes`),rcx,50,22,C.white,'center');
    if(shown>0)text(c,String(shown),rcx,110,52,C.yellow,'center',MONO);
    c.restore();}

  // labels with leaders
  f.labels.forEach((lb,i)=>label(c,cur,lb,fade(tau,1.6+i*.35,.6)*out*settle));

  // comparison with the foot on the left: where its side toe ends vs where it ends here
  if(prev&&ca>0){
    const [px,py]=pt(prev.r,f.cmp.prevTip),[qx,qy]=pt(r,f.cmp.cur),bx=r.x-f.cmp.off;
    c.save();c.globalAlpha*=ca;
    circle(c,px,py-4,8,null,C.cyan,2.5);
    dashed(c,[[px+10,py],[bx+6,py]],C.cyan,2.5,[7,6],-t*12);
    dashed(c,[[bx-6,qy],[qx-2,qy]],C.cyan,2.5,[5,5]);
    arrow(c,bx,py,bx,qy+2,C.cyan,3);
    const x1=bx-11,x0=prev.r.x+prev.r.w+14,rows=rowsOf(c,f.cmp.p,x1-x0);
    rows.forEach((row,i)=>text(c,row,x1,py-14-(rows.length-1-i)*28,22,C.cyan,'right'));
    c.restore();}

  // toe-count strip: one box per horse under its foot; arrows between boxes point forward in time
  const BY=470,BH=58;
  list.forEach((sl,i)=>{
    const bw=Math.min(sl.w-30,124),bx=sl.cx-bw/2,on=sl.on>.5,nt=FEET[i].toes.length;
    D.round(c,bx,BY,bw,BH,12,on?rgba(C.yellow,.14+.08*pul):'rgba(11,26,21,.7)',on?C.yellow:C.edge);
    for(let j=0;j<nt;j++)circle(c,sl.cx+(j-(nt-1)/2)*18,BY+15,6,on?BONE:rgba(BONE,.55),null);
    text(c,P(`${nt} 趾`,`${nt} ${nt>1?'toes':'toe'}`),sl.cx,BY+47,22,on?C.yellow:C.muted,'center');
    if(i<N-1){const nx=list[i+1],nbw=Math.min(nx.w-30,124);arrow(c,bx+bw+5,BY+BH/2,nx.cx-nbw/2-5,BY+BH/2,C.muted,2.5);}});

  // bottom row: what the arrows mean, then the colour key
  const TIME=P(`時間 →　愈往右愈接近現在`,`Time → closer to today`);
  const KEY=[[C.yellow,P(`中間趾`,`Middle toe`)],[C.cyan,P(`側趾／退化的小骨`,`Side toes / splints`)],[C.orange,P(`蹄`,`Hoof`)]];
  const tw=measure(c,TIME,22),ws=KEY.map(([,p])=>measure(c,p,22)+52),gap=12;
  let kx=480-(tw+30+ws.reduce((a,b)=>a+b,0)+gap*(KEY.length-1))/2;
  text(c,TIME,kx,573,22,C.muted);kx+=tw+30;
  KEY.forEach(([col,p],i)=>{D.round(c,kx,546,ws[i],40,20,'rgba(11,26,21,.9)',rgba(col,.8));
    circle(c,kx+22,566,8,null,col,3);text(c,p,kx+38,574,22,col);kx+=ws[i]+gap;});
}
window.FossilDraw.feet=draw;
})();

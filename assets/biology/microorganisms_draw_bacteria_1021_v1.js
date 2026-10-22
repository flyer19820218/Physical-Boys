/* Microorganisms · "Three bacterial shapes" canvas (cells tab, view 0), 2026-10-22.
 * The three groups of the MB1 illustration (cocci_cluster + cocci_chain, rods, spirals) stand in three columns.
 * Steps 1-3: the current column widens (the others shrink and dim), a caption says what the shape looks like,
 * and one single bacterium is ringed in cyan (the key below: "one bacterium, about 1 to a few µm, schematic").
 * Step 4: the rods and the spirals carry example cards (helpful / may make people sick); the cocci stay dim.
 * Column widths ease from one step to the next, so the pictures slide and grow instead of jumping.
 * Every ring / outline position is a fraction of its picture, measured from the PNGs:
 *   chain beads by a Hough circle fit on the cocci_chain alpha/grey image, the rod by the principal axis of
 *   its alpha component, the spiral outline by a contour of its alpha component (grown 6 px).
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,text,measure,splitLines,rgba,clamp,mix,ease,fade,stageClock,place,fitRect,drawIn,circle,line,glow}=K;
const N=4,PER=7,X0=20,TOT=920;

// Column widths per step (cocci, rods, spirals); the current one is wide.
const WIDTH=[[470,225,225],[225,470,225],[225,225,470],[170,400,350]];
const COLS=[
 {shape:P(`球狀`,`Round`),name:P(`球菌`,`Cocci`)},
 {shape:P(`桿狀`,`Rod-shaped`),name:P(`桿菌`,`Bacilli`)},
 {shape:P(`螺旋狀`,`Spiral`),name:P(`螺旋菌`,`Spirilla`)}];

// ── measured from the PNGs (fractions of each picture) ─────────────────────
// cocci_chain.png 272x580: Hough circles; bead 4 (right-hand side of the chain) is the one ringed.
const BEAD={x:210.5/272,y:312.5/580,r:54.3/272};
// rods.png 612x606: the lone rod at top left; principal-axis end points (extreme pixels) and half-width 42 px.
const ROD={a:[.361,.150],b:[.013,.304],hw:42/612};
// spirals.png 608x612: the long spiral at upper left, contour grown 6 px.
const SPIRAL=[[.595,.428],[.564,.414],[.523,.365],[.48,.395],[.456,.404],[.424,.391],[.387,.345],[.345,.377],[.329,.383],[.303,.375],[.263,.327],[.212,.356],[.181,.356],[.155,.341],[.122,.293],[.078,.281],[.068,.268],[.07,.252],[.094,.225],[.128,.219],[.158,.232],[.202,.28],[.25,.247],[.273,.241],[.298,.252],[.336,.294],[.375,.262],[.4,.258],[.423,.271],[.462,.317],[.51,.283],[.548,.282],[.58,.307],[.608,.348],[.648,.349],[.669,.369],[.668,.392],[.648,.413],[.625,.425]];

const CAP=[
 [P(`成堆：像一串葡萄`,`Clusters: like a bunch of grapes`),P(`連成鏈：像一串珠子`,`Chains: like a string of beads`)],
 [P(`像短短的小棒子，常常一大群聚在一起`,`Like short little sticks, often in large groups`)],
 [P(`彎彎曲曲，像一條小彈簧`,`Twisted and curved, like a tiny spring`)]];
const KEY_ONE=P(`圈起來的是一個細菌：約 1～數 µm`,`Ringed: one bacterium, about 1 to a few µm`);
const KEY_NOTE=P(`（AI 示意圖，非同比例）`,`(AI sketch, not to scale)`);
const GOOD=C.green,BAD=C.orange;
const CARDS=[
 {col:1,head:P(`同樣是桿狀（舉例）：`,`All rod-shaped (examples):`),items:[
   {title:P(`有些乳酸菌`,`Some lactic acid bacteria`),desc:P(`可以用來做優格`,`Used to make yogurt`),cols:[GOOD]},
   {title:P(`大腸桿菌`,`E. coli`),desc:P(`多數無害，只有少數菌株會讓人生病`,`Most strains harmless; only a few make people sick`),cols:[GOOD,BAD]}]},
 {col:2,head:P(`螺旋狀（舉例）：`,`Spiral (example):`),items:[
   {title:P(`幽門螺旋桿菌`,`Helicobacter pylori`),desc:P(`可能和胃病有關`,`May be linked to stomach disease`),cols:[BAD]}]}];
const LEGEND=[[GOOD,P(`有益`,`Helpful`)],[BAD,P(`可能\n讓人生病`,`May make people sick`)]];
const BANNER=P(`同一種外形，有益、有害的都有：只看外形，不能判斷好壞`,`One shape holds helpful and harmful kinds: shape alone cannot tell good from bad`);

// ── helpers ────────────────────────────────────────────────────────────────
// Wrapped rows. Chinese: no lonely last character; break after '，' or '：' nearest the middle when it fits.
function rowsOf(c,p,w,size=22){
  const str=D.tr(p);
  if(str.includes('\n')){const parts=str.split('\n');if(parts.every(q=>measure(c,q,size)<=w))return parts;return splitLines(c,str.replace(/\n/g,''),w,size);}
  const rows=splitLines(c,str,w,size);
  for(let i=0;i<rows.length-1;i++)if(/\($/.test(rows[i])){rows[i]=rows[i].slice(0,-1).trimEnd();rows[i+1]='('+rows[i+1];}
  if(rows.length!==2||/[A-Za-z]{3}/.test(str))return rows;
  const fits=r=>measure(c,r,size)<=w,mid=str.length/2;let best=null;
  for(let i=1;i<str.length-1;i++)if(/[，：、]/.test(str[i])){const a=str.slice(0,i+1),b=str.slice(i+1);if(fits(a)&&fits(b)&&(!best||Math.abs(i+1-mid)<Math.abs(best[0].length-mid)))best=[a,b];}
  if(best)return best;
  const h=Math.ceil(str.length/2),a=str.slice(0,h),b=str.slice(h);return fits(a)&&fits(b)?[a,b]:rows;
}
function track(s,key,k,t,dur){
  let o=s[key];if(!o||t<o.t){o=s[key]={k,from:k,t:t-9};}
  if(o.k!==k){o.from=o.k;o.k=k;o.t=t;}
  return{from:o.from,u:ease((t-o.t)/dur)};
}
function layout(from,k,u){
  let x=X0;
  return WIDTH[k].map((w1,i)=>{const w=mix(WIDTH[from][i],w1,u),sl={x,w,cx:x+w/2,on:mix(from===i?1:0,k===i&&k<3?1:0,u)};x+=w;return sl;});
}
function capsulePath(c,ax,ay,bx,by,hw){
  const ang=Math.atan2(by-ay,bx-ax),len=Math.hypot(bx-ax,by-ay);
  c.save();c.translate(ax,ay);c.rotate(ang);c.beginPath();c.roundRect(-4,-hw,len+8,hw*2,hw);c.restore();
}
function polyPath(c,r,pts){c.beginPath();pts.forEach(([fx,fy],i)=>{const x=r.x+fx*r.w,y=r.y+fy*r.h;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();}
// Ring one bacterium in cyan (pulsing), used as the key "one bacterium".
function ringOne(c,i,R,a,t){
  if(a<=0||!R)return;
  const pul=.5+.5*Math.sin(t*3.4);
  c.save();c.globalAlpha*=a;c.strokeStyle=C.cyan;c.lineWidth=3+1.5*pul;c.setLineDash([9,6]);c.lineDashOffset=-t*14;
  if(i===0){const r=R.chain;circle(c,r.x+BEAD.x*r.w,r.y+BEAD.y*r.h,BEAD.r*r.w+6+2*pul,null,C.cyan,3+1.5*pul);}
  else if(i===1){const r=R.pic;capsulePath(c,r.x+ROD.a[0]*r.w,r.y+ROD.a[1]*r.h,r.x+ROD.b[0]*r.w,r.y+ROD.b[1]*r.h,ROD.hw*r.w+6);c.stroke();}
  else{const r=R.pic;polyPath(c,r,SPIRAL);c.stroke();}
  c.restore();
}
function ringIcon(c,x,y,a){c.save();c.globalAlpha*=a;c.setLineDash([5,4]);circle(c,x,y,11,null,C.cyan,3);c.restore();}

// Pictures of one column inside its box; returns rects for rings and captions.
function pictures(c,i,sl,y0,h,alpha,t,focus){
  const bob=k=>Math.sin(t*1.25+i*2.1+k*1.3)*3;
  if(i===0){
    const pad=10,iw=sl.w-pad*2,wa=iw*.58,wb=iw-wa;
    const ra=fitRect('cocci_cluster.png',sl.x+pad,y0,wa-6,h),rb=fitRect('cocci_chain.png',sl.x+pad+wa+6,y0,wb-6,h);
    ra.y+=bob(0);rb.y+=bob(1);
    drawIn(c,'cocci_cluster.png',ra,{alpha});drawIn(c,'cocci_chain.png',rb,{alpha});
    return{cluster:ra,chain:rb,subs:[[sl.x+pad,wa-6],[sl.x+pad+wa+6,wb-6]]};
  }
  const file=i===1?'rods.png':'spirals.png',pad=12;
  const r=fitRect(file,sl.x+pad,y0,sl.w-pad*2,h);r.y+=bob(0);
  // the spirals stretch a little, like a spring, while they are the current shape
  if(i===2&&focus>0){const k=1+.018*focus*Math.sin(t*2.2),cx=r.x+r.w/2;r.w*=k;r.x=cx-r.w/2;}
  drawIn(c,file,r,{alpha});
  return{pic:r,subs:[[sl.x+pad,sl.w-pad*2]]};
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u}=track(s,'bactL',k,t,.9),L=layout(from,k,u);
  const out=held?1:1-fade(tau,PER-.45,.45);
  const settle=clamp((u-.55)/.45);
  // picture band: tall for steps 1-3, short in step 4 (room for the example cards)
  const bandH=(st)=>st===3?160:330,PH=mix(bandH(from),bandH(k),u),PY=86;

  L.forEach((sl,i)=>{
    const focus=sl.on;
    // column frame and header (two lines: shape, name)
    if(focus>.01){c.save();c.globalAlpha*=focus;D.round(c,sl.x+4,4,sl.w-8,PY+PH+(k<3?120:0)*focus,16,rgba(C.yellow,.06),rgba(C.yellow,.85));c.restore();}
    const hb=focus>.5;
    D.round(c,sl.x+8,8,sl.w-16,70,12,hb?rgba(C.yellow,.92):'rgba(11,26,21,.78)',hb?C.yellow:C.edge);
    text(c,COLS[i].shape,sl.cx,38,24,hb?C.ink:C.white,'center');
    text(c,COLS[i].name,sl.cx,68,22,hb?C.ink:C.muted,'center');
    D.hit(sl.x,0,sl.w,PY+PH+10,'phase',i);
    // pictures: the current one bright, the others faded (step 4: cocci faded, rods and spirals bright)
    const bright=k===3?(i===0?.4:1):mix(.42,1,focus);
    if(focus>.3)glow(c,sl.cx,PY+PH/2,Math.min(sl.w,PH)*.55,C.yellow,.07*focus);
    const R=pictures(c,i,sl,PY,PH,bright,t,focus);
    // steps 1-3: caption(s) under the current pictures, then the ring on one bacterium
    if(k<3&&i===k){
      const ca=fade(tau,.7,.6)*settle*out;
      if(ca>0){c.save();c.globalAlpha*=ca;
        CAP[i].forEach((p,j)=>{const [sx,sw]=R.subs[j];rowsOf(c,p,sw).forEach((row,m)=>text(c,row,sx+sw/2,PY+PH+34+m*28,22,C.yellow,'center'));});
        c.restore();}
      ringOne(c,i,R,fade(tau,1.5,.6)*settle*out,t);
    }
  });

  // steps 1-3: key at the bottom (cyan ring = one bacterium, size, schematic)
  if(k<3){
    const ka=fade(tau,1.5,.6)*settle*out,w1=measure(c,KEY_ONE,22),w2=measure(c,KEY_NOTE,22),tw=34+w1+10+w2,x0=480-tw/2;
    if(ka>0){c.save();c.globalAlpha*=ka;
      D.round(c,x0-16,540,tw+32,48,24,'rgba(11,26,21,.9)',rgba(C.cyan,.75));
      ringIcon(c,x0+11,564,1);text(c,KEY_ONE,x0+34,572,22,C.cyan);text(c,KEY_NOTE,x0+34+w1+10,572,22,C.muted);
      c.restore();}
    return;
  }

  // step 4: example cards under the rods and the spirals
  const top=PY+PH+16;
  CARDS.forEach((g,gi)=>{
    const sl=L[g.col],x=sl.x+12,w=sl.w-24;
    const ha=fade(tau,.6+gi*.9,.5)*settle*out;
    if(ha<=0)return;
    c.save();c.globalAlpha*=ha;text(c,g.head,x+2,top+22,22,C.white);c.restore();
    let y=top+36;
    g.items.forEach((it,j)=>{
      const a=fade(tau,.9+gi*.9+j*.5,.55)*settle*out,dy=(1-ease(a))*18;
      const tr=rowsOf(c,it.title,w-34),dr=rowsOf(c,it.desc,w-34),h=14+tr.length*28+dr.length*28+8;
      if(a>0){c.save();c.globalAlpha*=a;
        D.round(c,x,y+dy,w,h,12,'rgba(11,26,21,.88)',rgba(it.cols[it.cols.length-1],.7));
        // colour bar at the left: green helpful, orange may make people sick (E. coli: both)
        it.cols.forEach((col,m)=>{const bh=(h-16)/it.cols.length;D.round(c,x+8,y+dy+8+m*bh,8,bh-(m<it.cols.length-1?3:0),4,col,null);});
        tr.forEach((row,m)=>text(c,row,x+26,y+dy+33+m*28,22,it.cols.length>1?C.white:it.cols[0]));
        dr.forEach((row,m)=>text(c,row,x+26,y+dy+33+tr.length*28+m*28,22,C.white));
        c.restore();}
      y+=h+10;
    });
  });
  // legend in the free space under the faded cocci
  const la=fade(tau,.6,.5)*settle*out,lx=L[0].x+14,lw=L[0].w-28;
  if(la>0){c.save();c.globalAlpha*=la;let ly=top+22;
    LEGEND.forEach(([col,p])=>{D.round(c,lx,ly-15,8,20,4,col,null);rowsOf(c,p,lw-18).forEach((row,m)=>text(c,row,lx+16,ly+m*28,22,col));ly+=rowsOf(c,p,lw-18).length*28+12;});
    c.restore();}
  // conclusion banner
  const ba=fade(tau,2.9,.6)*settle*out;
  if(ba>0){
    const rows=rowsOf(c,BANNER,850,24),h=22+rows.length*32,y=590-h,pul=.5+.5*Math.sin(t*2.6);
    c.save();c.globalAlpha*=ba;
    D.round(c,40,y,880,h,16,rgba(C.yellow,.10+.05*pul),C.yellow);
    rows.forEach((row,m)=>text(c,row,480,y+36+m*32,24,C.yellow,'center'));
    c.restore();}
}
window.MicroDraw.bacteria=draw;
})();

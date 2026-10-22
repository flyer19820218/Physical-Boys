/* Fungi · "digest" canvas (Tab 1, view 1: external digestion), 2026-10-22.
 * Registers window.FungiDraw.digest; called as draw(ctx, state, t) on the 960x600 canvas. Sets s.shown (stage 0..2).
 * Everything is drawn in code (no PNG): a brown piece of food on the left (rotting wood with a dead leaf on it), one hypha
 *   lying across the middle (cream cell wall, both ends rounded, two cross-walls) whose left end rests against the food
 *   surface (it does not dig into the food). Outside the cell and inside the hypha have different background colours.
 * Step 1: big molecules (orange strings of 6 beads) sit on the food; one drifts to the hypha and keeps bumping against
 *   the outside of the cell wall (orange cross, "cannot enter whole").
 * Step 2: two strings slide off the food; a cyan "Pac-Man" enzyme comes out through the wall of the hypha and, OUTSIDE the
 *   cell wall, bites the strings bond by bond (short flash at each cut); each cut-off bead turns into a yellow small molecule.
 *   Held, the step repeats every 9 s (fade out, then the strings slide out again).
 * Step 3: small channels open in the wall; the yellow small molecules move down through them (arrows) into the hypha and
 *   gather in its compartments, which then send out a ring of light ("used for living and growing"). A pale row of three
 *   noun hints (decomposer / symbiont / parasite) is not interactive. Enzymes stay outside and are not absorbed.
 * Sizes are a sketch (corner note on every step). No chloroplasts, no photosynthesis arrows, no real scale or numbers.
 * The page shell owns the animation loop; this module draws one frame and keeps no timer.
 */
(()=>{'use strict';
const K=window.FungiKit,{P,C,D,text,measure,splitLines,rgba,clamp,mix,ease,smooth,fade,stageClock,circle,ellipse,line,arrow,glow,pill,mod,marker,rng,MONO,TAU}=K;
const N=3,PER=8,LOOP2=9;

// ── words (canvas labels; the first ten are verbatim from animation_specs.md) ──
const T={
 food:P(`落葉、枯木`,`Dead leaves, rotting wood`),
 big:P(`大分子`,`Large molecule`),
 noEnter:P(`整塊進不去`,`Cannot enter whole`),
 enzyme:P(`酵素`,`Enzyme`),
 small:P(`小分子`,`Small molecule`),
 outsideDig:P(`在細胞外分解`,`Digested outside the cell`),
 sketch:P(`分子與菌絲的大小只是示意`,`Sizes of molecules and hypha are a sketch`),
 absorb:P(`吸收小分子`,`Absorbing small molecules`),
 use:P(`用來維持生命與生長`,`Used for living and growing`),
 roles:[P(`分解者`,`Decomposer`),P(`共生`,`Symbiont`),P(`寄生`,`Parasite`)],
 outside:P(`細胞外`,`Outside the cell`),inside:P(`菌絲細胞內`,`Inside the hypha`),
 // names for the other things drawn (everything on the canvas gets a name)
 hypha:P(`菌絲`,`Hypha`),wall:P(`橫隔`,`Cross-wall`)};

// ── colours ────────────────────────────────────────────────────────────────
const OUT_BG='#123a35',IN_BG='#3a4428',WALL=C.white,WALL_DK='#c9bf9f';
const WOOD='#6b4526',WOOD_EDGE='#94653a',GRAIN='#55361d',LEAF='#a8692e',LEAF_DK='#7a4a1f';
const OR=C.orange,OR_DK='#b4521a',YE=C.yellow,YE_DK='#b88a06',CY=C.cyan;

// ── geometry ───────────────────────────────────────────────────────────────
// hypha: from x 300 to 900, centre y 350, outer half height 64, wall 10 px
const HX0=300,HX1=900,HY=350,HH=64,WT=10,TOP=HY-HH,BOT=HY+HH,IT=TOP+WT,IB=BOT-WT;
const SEPTA=[610,800];
const CH=[450,540,700];                                       // channels in the top wall (step 3)
const FOOD=[[44,150],[120,126],[222,134],[292,168],[306,262],[302,420],[280,494],[180,510],[70,498],[34,420],[28,262]];
// strings of big molecules lying on the food: x, y, angle, beads
const FOODCH=[[96,300,.3,6],[214,252,-.25,5],[118,412,.12,6],[214,388,.55,5],[178,466,-.1,6]];
const R=11,SP=22;                                             // bead radius and spacing
// step 1: the string that drifts to the wall
const TRAV={from:[244,300],to:[480,TOP-R]};
// step 2: two strings outside the cell, sliding off the food
const CHAINS=[{from:[240,236],to:[470,200],pore:480,off:0},{from:[250,290],to:[700,180],pore:700,off:.35}];
const CUT0=1.5,CUTD=.7;                                       // first cut, time between cuts
// scattered positions of the 12 small molecules after cutting (outside the cell, above the wall)
const SCAT=(()=>{const r=rng(1022),out=[];
  CHAINS.forEach((ch,ci)=>{for(let i=0;i<6;i++){const bx=ch.to[0]+(i-2.5)*SP;
    out.push([Math.max(380,Math.min(790,bx+(r()-.5)*70+(i-2.5)*8)),Math.max(152,Math.min(258,ch.to[1]+(r()-.5)*90+(ci?24:10)))]);}});
  return out;})();
// step 3: which channel and where inside each small molecule goes
const ABS=(()=>{const per={},out=[];
  SCAT.forEach((p,i)=>{let c=0;CH.forEach((x,j)=>{if(Math.abs(x-p[0])<Math.abs(CH[c]-p[0]))c=j;});out.push({i,c});});
  // balance: at most 5 molecules per channel
  out.sort((a,b)=>SCAT[a.i][0]-SCAT[b.i][0]);
  const T1=[[392,318],[418,344],[446,322],[474,350],[500,320],[528,346],[556,322],[582,348],[400,358],[560,360]],T2=[[640,322],[668,352],[700,326],[730,356],[760,328],[652,380],[742,384]];
  let a=0,b=0;
  out.forEach(o=>{per[o.c]=(per[o.c]||0);if(per[o.c]>=5)o.c=CH.findIndex((_,j)=>(per[j]||0)<5);per[o.c]++;o.rank=per[o.c]-1;
    o.tgt=o.c<2?T1[a++]:T2[b++];});
  return out;})();
const ABS_END=.5+4*.55+2*.18+2.0;                             // when the last molecule has arrived

// ── helpers ────────────────────────────────────────────────────────────────
function track(s,key,k,t,dur){
  let o=s[key];if(!o||t<o.t){o=s[key]={k,from:k,t:t-9};}
  if(o.k!==k){o.from=o.k;o.k=k;o.t=t;}
  return{from:o.from,u:ease((t-o.t)/dur)};
}
function rowsOf(c,p,w,size=22){return splitLines(c,D.tr(p),w,size);}
// A label: rows of text with the top at y; leaders from the nearest edge to targets [x, y, alpha].
function tag(c,p,x,y,{col=C.white,align='center',maxW=300,tgts=[],a=1,size=22,dot=true}={}){
  if(a<=.004)return null;
  const rows=rowsOf(c,p,maxW,size),lh=size+6,w=Math.max(...rows.map(r=>measure(c,r,size))),h=rows.length*lh;
  const x0=align==='left'?x:align==='right'?x-w:x-w/2;
  c.save();c.globalAlpha*=a;
  for(const [tx,ty,ta=1] of tgts){
    if(ta<=.004)continue;
    let sx,sy;
    if(tx<x0-4){sx=x0-6;sy=y+h*.5;}else if(tx>x0+w+4){sx=x0+w+6;sy=y+h*.5;}
    else if(ty>y+h){sx=tx;sy=y+h+4;}else{sx=tx;sy=y-4;}
    c.save();c.globalAlpha*=ta;line(c,[[sx,sy],[tx,ty]],rgba(col,.9),2);if(dot)circle(c,tx,ty,4.5,col,C.ink,1.5);c.restore();
  }
  rows.forEach((r,i)=>text(c,r,x,y+size-1+i*lh,size,col,align));
  c.restore();
  return{x0,y,w,h};
}
function smoothPath(c,pts){
  const n=pts.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  c.beginPath();const m0=mid(pts[n-1],pts[0]);c.moveTo(...m0);
  for(let i=0;i<n;i++){const p=pts[i],m=mid(p,pts[(i+1)%n]);c.quadraticCurveTo(p[0],p[1],m[0],m[1]);}
  c.closePath();
}
function hyphaPath(c,inset=0){c.beginPath();c.roundRect(HX0+inset,TOP+inset,HX1-HX0-2*inset,2*(HH-inset),HH-inset);}
function cross(c,x,y,r,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.lineCap='round';
  for(const w of [[r*.36,C.ink],[r*.22,OR]]){c.strokeStyle=w[1];c.lineWidth=w[0];c.beginPath();c.moveTo(x-r,y-r);c.lineTo(x+r,y+r);c.moveTo(x+r,y-r);c.lineTo(x-r,y+r);c.stroke();}
  c.restore();
}
// one bead: colour mixes from orange (u=0) to yellow (u=1)
function bead(c,x,y,u=0,r=R){
  const fill=u<=0?OR:u>=1?YE:mixHex(OR,YE,u),edge=u<=0?OR_DK:u>=1?YE_DK:mixHex(OR_DK,YE_DK,u);
  circle(c,x,y,r,fill,edge,2);circle(c,x-r*.32,y-r*.34,r*.3,'rgba(255,255,255,.55)',null);
}
function mixHex(a,b,u){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),f=s=>Math.round(mix(A>>s&255,B>>s&255,u));return `rgb(${f(16)},${f(8)},${f(0)})`;}
// a string of beads centred at (x, y) along angle ang; wiggle makes it move gently
function beadsOf(x,y,ang,n,t,seed=0,amp=2.2){
  const ca=Math.cos(ang),sa=Math.sin(ang);
  return [...Array(n)].map((_,i)=>{const d=(i-(n-1)/2)*SP,w=Math.sin(t*2.1+i*1.3+seed)*amp;return[x+ca*d-sa*w,y+sa*d+ca*w];});
}
function chain(c,pts,u=0,bonds=null){
  c.save();c.lineCap='round';
  for(let i=0;i<pts.length-1;i++){if(bonds&&!bonds[i])continue;line(c,[pts[i],pts[i+1]],u>0?mixHex(OR_DK,YE_DK,u):OR_DK,5);}
  pts.forEach(p=>bead(c,p[0],p[1],u));c.restore();
}
// the enzyme: a cyan "Pac-Man" facing angle dir; open 0..1
function enzyme(c,x,y,dir,open,r=17){
  const m=.08+.62*clamp(open);
  c.save();glow(c,x,y,r*1.9,CY,.35);
  c.beginPath();c.moveTo(x,y);c.arc(x,y,r,dir+m,dir-m+TAU);c.closePath();c.fillStyle=CY;c.fill();c.strokeStyle='#0e7490';c.lineWidth=2;c.stroke();
  const ex=x+Math.cos(dir-1.35)*r*.5,ey=y+Math.sin(dir-1.35)*r*.5;circle(c,ex,ey,2.6,C.ink,null);
  c.restore();
}
function flash(c,x,y,u){
  if(u<=0||u>=1)return;const a=1-u,r=10+u*22;
  c.save();c.globalAlpha*=a;glow(c,x,y,r+14,'#fff7c2',.9);
  c.strokeStyle='#fff7c2';c.lineWidth=3;c.lineCap='round';
  for(let i=0;i<8;i++){const q=i*TAU/8+.2;c.beginPath();c.moveTo(x+Math.cos(q)*r*.55,y+Math.sin(q)*r*.55);c.lineTo(x+Math.cos(q)*r,y+Math.sin(q)*r);c.stroke();}
  c.restore();
}

// ── the food: rotting wood with a dead leaf on it ──────────────────────────
function food(c,t){
  c.save();
  smoothPath(c,FOOD);c.fillStyle=WOOD;c.fill();c.lineWidth=3;c.strokeStyle=WOOD_EDGE;c.stroke();
  c.clip();
  // wood grain
  c.lineCap='round';
  for(let j=0;j<9;j++){const y0=150+j*42;c.beginPath();
    for(let x=20;x<=320;x+=10){const y=y0+Math.sin(x*.025+j*1.7)*9+Math.sin(x*.07+j)*3;x===20?c.moveTo(x,y):c.lineTo(x,y);}
    c.strokeStyle=rgba(GRAIN,.85);c.lineWidth=j%3?2:3.5;c.stroke();}
  // cracks
  c.strokeStyle='#3f2814';c.lineWidth=3;
  for(const cr of [[[60,330],[92,352],[86,380]],[[250,440],[226,470],[238,500]],[[262,196],[240,214]]]){c.beginPath();cr.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  c.restore();
  // dead leaf lying on the wood
  c.save();c.translate(150,206);c.rotate(-.32+Math.sin(t*.6)*.015);
  c.beginPath();c.moveTo(-82,0);c.quadraticCurveTo(-20,-46,74,-4);c.quadraticCurveTo(-10,40,-82,0);c.closePath();
  c.fillStyle=LEAF;c.fill();c.strokeStyle=LEAF_DK;c.lineWidth=2.5;c.stroke();
  c.lineCap='round';c.strokeStyle=LEAF_DK;c.lineWidth=2.5;c.beginPath();c.moveTo(-96,6);c.lineTo(70,-3);c.stroke();
  c.lineWidth=1.8;for(let i=0;i<5;i++){const x=-58+i*26;c.beginPath();c.moveTo(x,1);c.lineTo(x+16,-16+i*1.2);c.moveTo(x,1);c.lineTo(x+14,15-i*1.4);c.stroke();}
  // a few brown spots where it is rotting
  for(const [x,y,r] of [[-30,-8,5],[20,8,4],[42,-6,3.5]])circle(c,x,y,r,'#6b3f17',null);
  c.restore();
}

// ── the hypha (cell wall, inside, cross-walls); channels open in step 3 ────
function hypha(c,t,chA){
  c.save();
  hyphaPath(c);c.fillStyle=WALL;c.fill();
  hyphaPath(c,WT);c.fillStyle=IN_BG;c.fill();
  // slow streaming shade inside (cytoplasm), clipped to the inside
  c.save();hyphaPath(c,WT);c.clip();
  const sx=HX0+mod(t*30,HX1-HX0+300)-150,g=c.createLinearGradient(sx-150,0,sx+150,0);
  g.addColorStop(0,'rgba(242,236,217,0)');g.addColorStop(.5,'rgba(242,236,217,.07)');g.addColorStop(1,'rgba(242,236,217,0)');
  c.fillStyle=g;c.fillRect(HX0,IT,HX1-HX0,IB-IT);
  c.restore();
  // inner edge of the wall
  hyphaPath(c,WT);c.strokeStyle=WALL_DK;c.lineWidth=1.5;c.stroke();
  // cross-walls, each with a small central pore
  for(const x of SEPTA){c.fillStyle=WALL;c.fillRect(x-4,IT,8,HY-IT-9);c.fillRect(x-4,HY+9,8,IB-HY-9);}
  // channels in the top wall (step 3)
  if(chA>0){c.save();c.globalAlpha*=chA;
    for(const x of CH){c.fillStyle=IN_BG;c.fillRect(x-9,TOP-1,18,WT+2);c.fillStyle=WALL_DK;c.fillRect(x-12,TOP-2,4,WT+4);c.fillRect(x+8,TOP-2,4,WT+4);}
    c.restore();}
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u}=track(s,'_dL',k,t,1.0),out=held?1:1-fade(tau,PER-.5,.5);
  const only=(j,d=0)=>k===j?fade(tau,d,.5)*out:(from===j?1-u:0);
  const first=k===0&&from===0;
  const A1=only(0),A2=only(1),A3=only(2);
  const base=first?fade(tau,0,.8):1;

  // outside the cell: its own background colour
  c.save();c.globalAlpha*=base;
  const bg=c.createRadialGradient(600,300,60,600,300,560);bg.addColorStop(0,OUT_BG);bg.addColorStop(1,'#0f2e29');
  c.fillStyle=bg;c.fillRect(0,0,960,600);
  food(c,t);
  // big molecules lying on the food
  FOODCH.forEach(([x,y,a,n],i)=>chain(c,beadsOf(x,y,a,n,t,i*2.3,1.6)));
  hypha(c,t,A3*fade(k===2?tau:9,.2,.6));
  c.restore();

  // ── step 3 (inside): small molecules come in through the channels ──
  const s3=k===2?tau:(from===2?9:0);
  const inPos=[];
  if(A3>0){
    c.save();c.globalAlpha*=A3;
    // arrows along the channels
    const aa=fade(s3,.3,.5);
    if(aa>0){c.save();c.globalAlpha*=aa*(.65+.25*Math.sin(t*3));for(const x of CH)arrow(c,x,TOP-40,x,IT+20,YE,3);c.restore();}
    // light ring once the molecules have gathered
    const ga=fade(s3,ABS_END,.6);
    if(ga>0){c.save();hyphaPath(c,WT);c.clip();
      for(const [cx,cy] of [[488,338],[712,348]]){const q=mod(t*.55+(cx>600?.5:0));
        glow(c,cx,cy,110,YE,.28*ga);circle(c,cx,cy,28+q*92,null,rgba(YE,.85*ga*(1-q)),4);}
      c.restore();}
    ABS.forEach((o,j)=>{
      const st=.5+o.rank*.55+o.c*.18,p0=SCAT[o.i],x=CH[o.c],top=[x,TOP-R-6],inn=[x,IT+R+4];
      const u1=smooth((s3-st)/.7),u2=smooth((s3-st-.7)/.45),u3=smooth((s3-st-1.15)/.8);
      let p;
      if(u2<=0)p=[mix(p0[0],top[0],u1),mix(p0[1],top[1],u1)];
      else if(u3<=0)p=[x,mix(top[1],inn[1],u2)];
      else{const jx=Math.sin(t*1.7+j*2.1)*2.5*u3,jy=Math.cos(t*1.3+j*1.4)*2*u3;p=[mix(inn[0],o.tgt[0],u3)+jx,mix(inn[1],o.tgt[1],u3)+jy];}
      if(u2>0&&u2<1)glow(c,x,TOP+WT/2,20,YE,.5*Math.sin(u2*Math.PI));
      inPos[o.i]=p;bead(c,p[0],p[1],1,10);
    });
    c.restore();
  }

  // ── step 1: a big molecule tries to enter and is stopped by the wall ──
  if(A1>0){
    const s1=k===0?tau:9,mv=smooth((s1-.5)/2.0);
    const bump=s1>2.5?Math.abs(Math.sin((s1-2.5)*2.4))*-14:0;     // pushed back a little, again and again
    const cx=mix(TRAV.from[0],TRAV.to[0],mv),cy=mix(TRAV.from[1],TRAV.to[1],mv)+bump;
    const squash=s1>2.5?Math.max(0,1-Math.abs(Math.sin((s1-2.5)*2.4))*6):0;
    c.save();c.globalAlpha*=A1;
    const pts=beadsOf(cx,cy,mv*-.02,6,t,7,mix(1.6,.8,mv)*(1-squash*.5));
    chain(c,pts);
    if(squash>0){c.save();c.globalAlpha*=squash;glow(c,cx,TOP,40,OR,.55);c.restore();}
    c.restore();
    const xa=A1*(k===0?fade(tau,2.7,.4):1);
    cross(c,cx,TOP-R-34+bump*.3,12*(1+.06*Math.sin(t*4)),xa);
    tag(c,T.noEnter,560,TOP-R-48,{col:OR,align:'left',maxW:340,a:xa});
    s._trav=[pts[0][0],pts[0][1]-R];
  }

  // ── step 2: enzymes cut the strings OUTSIDE the cell wall ──
  let enzA=null,firstSingle=null,chainATop=null,chainAa=0;
  if(A2>0){
    const raw=k===1?tau:(from===1?9:0),ct=held&&k===1?mod(raw,LOOP2):raw,rep=held&&k===1&&raw>=LOOP2;
    const la=(rep?fade(ct,0,.4):1)*(held&&k===1?1-fade(ct,LOOP2-.7,.6):1);
    c.save();c.globalAlpha*=A2*la;
    CHAINS.forEach((ch,ci)=>{
      const sl=smooth(ct/1.1),cx=mix(ch.from[0],ch.to[0],sl),cy=mix(ch.from[1],ch.to[1],sl);
      const pts=beadsOf(cx,cy,0,6,t,ci*3,1.2);
      const cutT=j=>CUT0+ch.off+j*CUTD;                         // cut j splits bond 4-j
      const cutDone=j=>ct>=cutT(j);
      const bonds=[0,1,2,3,4].map(b=>!cutDone(4-b));
      // detached beads: bead i>=1 at cut 5-i, bead 0 at the last cut
      const detT=i=>cutT(i===0?4:5-i);
      const singles=[];
      for(let i=0;i<6;i++){const dt=ct-detT(i);
        if(dt>=0){const q=smooth(dt/1.5),tg=SCAT[ci*6+i],p=[mix(pts[i][0],tg[0],q)+Math.sin(t*1.4+i)*2*q,mix(pts[i][1],tg[1],q)+Math.cos(t*1.2+i*2)*2*q];
          singles.push([p,clamp(dt/.3)]);if(ci===1&&i===5)firstSingle=[p,clamp(dt/.4)];}}
      // the string still joined
      c.save();c.lineCap='round';
      for(let b=0;b<5;b++)if(bonds[b])line(c,[pts[b],pts[b+1]],OR_DK,5);
      for(let i=0;i<6;i++)if(ct<detT(i))bead(c,pts[i][0],pts[i][1],0);
      c.restore();
      singles.forEach(([p,uu])=>bead(c,p[0],p[1],uu,uu>=1?10:R));
      if(ci===0){chainATop=[pts[0][0],pts[0][1]-R];chainAa=1-fade(ct,detT(0),.3);}
      // the enzyme: comes out through the wall, then bites bond after bond
      const pore=ch.pore,em=smooth((ct-.6-ch.off)/.7);
      if(em>0){
        let j=0;for(let q=0;q<5;q++)if(ct>=cutT(q)+.2)j=q+1;
        const bx=b=>(pts[b][0]+pts[b+1][0])/2,by=b=>(pts[b][1]+pts[b+1][1])/2;
        let ex,ey;
        const tgtB=Math.min(4,4-Math.min(j,4)),prevB=Math.min(4,5-Math.min(j,5));
        const mvu=j===0?1:smooth((ct-cutT(j-1)-.2)/.3);
        const bxNow=j>=5?bx(0)-30:mix(bx(prevB),bx(tgtB),mvu),byNow=(j>=5?by(0):mix(by(prevB),by(tgtB),mvu))+27;
        ex=mix(pore,bxNow,em);ey=mix(IT+14,byNow,em)+(j>=5?Math.sin(t*2)*3:0);
        // a small cyan glow where it leaves the wall
        if(em<1)glow(c,pore,TOP+WT/2,26,CY,.6*Math.sin(em*Math.PI));
        let open=.5+.5*Math.sin(t*9);
        for(let q=0;q<5;q++){const d=ct-cutT(q);if(d>-.25&&d<.12)open=clamp(Math.abs(d)/.25);}
        enzyme(c,ex,ey,-Math.PI/2,open);
        if(ci===0)enzA=[ex,ey];
      }
      // flash at each cut
      for(let q=0;q<5;q++){const d=ct-cutT(q),b=4-q;flash(c,(pts[b][0]+pts[b+1][0])/2,(pts[b][1]+pts[b+1][1])/2,d/.4);}
    });
    c.restore();
    const ta=A2*la;
    if(enzA)tag(c,T.enzyme,312,TOP-40,{col:CY,align:'left',maxW:120,a:ta*(k===1?fade(tau,1.2,.4):1),tgts:[[enzA[0]-19,enzA[1]]]});
    if(firstSingle)tag(c,T.small,930,110,{col:YE,align:'right',maxW:220,a:ta*firstSingle[1],tgts:[[firstSingle[0][0]+6,firstSingle[0][1]-10]]});
  }

  // ── labels that stay ──
  c.save();c.globalAlpha*=base;
  tag(c,T.food,168,62,{col:'#e0b07a',maxW:290,tgts:[[168,150]]});
  // the label of the big molecules points at the food (always) and at the moving string (steps 1, 2)
  const bt=[[FOODCH[1][0]-30,FOODCH[1][1]-6,1]];
  if(A1>0&&s._trav)bt.push([s._trav[0],s._trav[1],A1*fade(k===0?tau:9,1,.5)]);
  if(A2>0&&chainATop)bt.push([chainATop[0],chainATop[1],A2*chainAa]);
  tag(c,T.big,330,110,{col:OR,align:'left',maxW:220,tgts:bt});
  text(c,T.outside,930,50,22,C.muted,'right');
  {const w=measure(c,T.inside,22);D.round(c,364,IB-34,w+16,30,10,IN_BG,null);text(c,T.inside,372,IB-11,22,'#e9e2c6','left');}
  tag(c,T.hypha,888,TOP-62,{col:C.white,maxW:120,size:22,tgts:[[868,TOP]]});
  tag(c,T.wall,SEPTA[1]+20,BOT+16,{col:WALL_DK,maxW:150,tgts:[[SEPTA[1],IB]],dot:false});
  text(c,T.sketch,20,574,22,C.muted,'left');
  c.restore();

  // headline of steps 2 and 3 (yellow key frame)
  const hp=(p,a)=>{if(a<=.004)return;c.save();c.globalAlpha*=a;const w=measure(c,p,24)+28;pill(c,p,560-w/2,34,{color:YE,size:24});c.restore();};
  hp(T.outsideDig,A2*(k===1?fade(tau,1.8,.5):1));
  hp(T.absorb,A3*(k===2?fade(tau,.6,.5):1));

  // step 3 labels: used for living and growing; three pale noun hints (not interactive)
  if(A3>0){
    const ga=A3*fade(s3,ABS_END+.3,.5);
    tag(c,T.use,570,BOT+16,{col:YE,maxW:320,a:ga,tgts:[[690,IB-4]]});
    const ra=A3*fade(s3,1.2,.6)*.85;
    if(ra>0){c.save();c.globalAlpha*=ra;
      const ws=T.roles.map(p=>measure(c,p,22)+28),gap=18,tot=ws.reduce((a,b)=>a+b,0)+gap*2;let x=600-tot/2;
      T.roles.forEach((p,i)=>{pill(c,p,x,494,{color:'#a7c4b5',size:22});x+=ws[i]+gap;});
      c.restore();}
  }

  // step markers (tap to jump to a step)
  for(let j=0;j<N;j++){const x=824+j*46,y=566;
    if(j===k)marker(c,x,y,j+1,null,14);
    else{circle(c,x,y,14,'rgba(11,26,21,.9)',rgba(C.muted,.8),2);c.save();c.font=MONO(20);c.fillStyle=C.muted;c.textAlign='center';c.textBaseline='middle';c.fillText(String(j+1),x,y+1);c.restore();}
    D.hit(x-23,y-24,46,48,'phase',j);}
}
window.FungiDraw.digest=draw;
})();

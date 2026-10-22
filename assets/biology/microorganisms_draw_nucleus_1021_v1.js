/* Microorganisms · "Where is the nucleus?" canvas (cells tab, view 1), 2026-10-22.
 * Step 1: one rod from the MB1 illustration (rods.png) flies out of its thumbnail, turns level and grows into a
 *   cross-section drawn in code in the same soft pink: cell wall, cell membrane, cytoplasm, a loop of DNA lying
 *   free in the middle (no nuclear envelope) and a waving flagellum.
 * Step 2: the Paramecium of MB2 (paramecium_c.png); its kidney-shaped nucleus is outlined in cyan, and a round
 *   zoom grows out of it: the nucleus enlarged, the envelope traced in cyan and DNA threads inside it.
 * Step 3: both side by side (the bacterium flies back in, the Paramecium slides right), with "has DNA",
 *   "nuclear envelope?" and the verdict (prokaryote / eukaryote), and "size is not the test".
 * DNA has the same colour and thread style in both cells. Real sizes are written; the pictures are not to scale.
 * Positions on the pictures are fractions measured from the PNGs: the rod by the principal axis of its alpha
 * component, the nucleus outline by a colour mask (grey-blue, darker than the cytoplasm) traced as a contour.
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,text,measure,splitLines,rgba,clamp,mix,ease,fade,stageClock,drawIn,pic,AI,SIZE,circle,line,glow,TAU}=K;
const N=3,PER=8;

// ── measured from the PNGs ─────────────────────────────────────────────────
// rods.png (612x606): the lone rod at top left. End points (extreme pixels) along its long axis, half-width 42 px.
const ROD={a:[220.9,90.9],b:[8.0,184.2],hw:42};
const ROD_C=[(ROD.a[0]+ROD.b[0])/2,(ROD.a[1]+ROD.b[1])/2],ROD_L=Math.hypot(ROD.a[0]-ROD.b[0],ROD.a[1]-ROD.b[1]);
const ROD_ANG=Math.atan2(ROD.b[1]-ROD.a[1],ROD.b[0]-ROD.a[0])-Math.PI;   // tilt of the rod in the picture
// paramecium_c.png (1051x590): nucleus outline (fractions), its centre, and where the cilia are (bottom left).
const PFILE='paramecium_c.png',[PW,PH]=SIZE[PFILE];
const NUC=[[.529,.6375],[.4967,.6299],[.4779,.6119],[.4667,.5932],[.4606,.5763],[.4581,.5559],[.4605,.5305],[.4661,.5136],[.4757,.4961],[.4862,.4863],[.5262,.4713],[.5415,.4593],[.556,.4373],[.5781,.3797],[.5938,.3576],[.608,.349],[.6194,.3485],[.6308,.3535],[.6422,.3659],[.6487,.378],[.6555,.4],[.6588,.4373],[.6519,.4881],[.6347,.539],[.6127,.5785],[.5823,.6135],[.5557,.6306]];
const NUC_C=[.5664,.5072],NUC_TOP=[.60,.36],NUC_BOT=[.53,.63],NUC_LR=[.635,.54],CILIA=[.30,.948];

// ── words ──────────────────────────────────────────────────────────────────
const T={
 thumb:P(`一個桿菌，放大剖開看（示意）`,`One rod, enlarged and cut open (schematic)`),
 wall:P(`細胞壁`,`Cell wall`),mem:P(`細胞膜`,`Cell membrane`),cyto:P(`細胞質`,`Cytoplasm`),
 dna:P(`DNA`,`DNA`),noEnv:P(`沒有核膜把 DNA 包起來`,`No nuclear envelope around the DNA`),flag:P(`鞭毛`,`Flagellum`),
 bsize:P(`細菌：約 1～數 µm（示意，非同比例）`,`Bacterium: about 1 to a few µm (schematic, not to scale)`),
 nuc:P(`細胞核`,`Nucleus`),cilia:P(`纖毛`,`Cilia`),zoom:P(`放大`,`Zoom`),
 env:P(`核膜`,`Nuclear envelope`),dnaIn:P(`DNA：在核膜裡面`,`DNA: inside the envelope`),
 psize:P(`草履蟲：約 150～300 µm（示意，非同比例）`,`Paramecium: about 150 to 300 µm (schematic, not to scale)`),
 bact:P(`細菌`,`Bacterium`),para:P(`草履蟲`,`Paramecium`),
 rows:[[[true,P(`有 DNA`,`Has DNA`)],[false,P(`沒有核膜`,`No nuclear envelope`)]],
       [[true,P(`有 DNA`,`Has DNA`)],[true,P(`有核膜（DNA 在細胞核裡）`,`Nuclear envelope: a nucleus`)]]],
 verdict:[P(`原核生物`,`Prokaryote`),P(`真核生物`,`Eukaryote`)],
 size1:P(`大小不是標準：草履蟲雖然小，也是真核生物`,`Size is not the test: a Paramecium is small, yet it is a eukaryote`),
 size2:P(`真實大小：細菌約 1～數 µm，草履蟲約 150～300 µm（畫面為示意，非同比例）`,`Real sizes: a bacterium is about 1 to a few µm, a Paramecium about 150 to 300 µm (the picture is schematic, not to scale)`)};
const DNA_COL='#7a3f97',DNA_CORE='#e2c3f2';
const PINK={hi:'#f9e6e0',lo:'#e2b7b0',wallT:'#dcaaa5',wallB:'#b98583',edge:'#7a5862',mem:'#f8e6df',memIn:'#c29190',flag:'#cf9b9c'};

// ── helpers ────────────────────────────────────────────────────────────────
function rowsOf(c,p,w,size=22){
  const str=D.tr(p),rows=splitLines(c,str,w,size);
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
// A label: rows of text with the top at y; align left/right/center at x. Leader from the nearest edge to tgt.
function tag(c,p,x,y,{col=C.white,align='center',maxW=260,tgt=null,a=1,size=22}={}){
  if(a<=0)return;
  const rows=rowsOf(c,p,maxW,size),lh=size+6,w=Math.max(...rows.map(r=>measure(c,r,size))),h=rows.length*lh;
  const x0=align==='left'?x:align==='right'?x-w:x-w/2;
  c.save();c.globalAlpha*=a;
  if(tgt){
    const [tx,ty]=tgt;let sx,sy;
    if(ty>y+h+2){sx=clamp((tx-x0)/w)*w+x0;sy=y+h+4;}else if(ty<y-2){sx=clamp((tx-x0)/w)*w+x0;sy=y-4;}
    else{sx=tx<x0?x0-6:x0+w+6;sy=y+h/2;}
    line(c,[[sx,sy],[tx,ty]],rgba(col,.92),2);circle(c,tx,ty,4.5,col,C.ink,1.5);
  }
  rows.forEach((r,i)=>text(c,r,align==='left'?x:align==='right'?x:x,y+size-1+i*lh,size,col,align));
  c.restore();
  return{x0,y,w,h};
}
function check(c,x,y,ok,a=1){
  c.save();c.globalAlpha*=a;circle(c,x,y,13,ok?C.green:C.orange,null);
  c.strokeStyle=C.ink;c.lineWidth=3.5;c.lineCap='round';c.beginPath();
  if(ok){c.moveTo(x-6,y);c.lineTo(x-1.5,y+5);c.lineTo(x+6.5,y-5);}else{c.moveTo(x-5,y-5);c.lineTo(x+5,y+5);c.moveTo(x+5,y-5);c.lineTo(x-5,y+5);}
  c.stroke();c.restore();
}

// ── the bacterial cell, drawn in code (soft pink, like the AI rods) ────────
const geo=(cx,cy,s)=>({cx,cy,s,a:230*s,r:86*s});
const capsule=(c,g,inset)=>{c.beginPath();c.roundRect(g.cx-g.a+inset,g.cy-g.r+inset,2*(g.a-inset),2*(g.r-inset),g.r-inset);};
function dnaPt(g,u,t){const s=g.s,ph=t*.7;return[g.cx-12*s+s*(104*Math.cos(u)+22*Math.cos(3*u+ph)),g.cy+s*(30*Math.sin(u)+13*Math.sin(5*u+ph*1.3))];}
function dnaLoop(c,g,t,glowA=0){
  c.save();c.lineJoin='round';c.lineCap='round';c.beginPath();
  for(let i=0;i<=160;i++){const [x,y]=dnaPt(g,i/160*TAU,t);i?c.lineTo(x,y):c.moveTo(x,y);}
  if(glowA>0){c.shadowColor=rgba(C.pink,.9);c.shadowBlur=14*glowA;}
  c.strokeStyle=DNA_COL;c.lineWidth=Math.max(2,6*g.s);c.stroke();c.shadowBlur=0;
  c.strokeStyle=DNA_CORE;c.lineWidth=Math.max(.8,1.8*g.s);c.stroke();c.restore();
}
const flagPt=(g,u,t)=>[g.cx+g.a-4*g.s+u*190*g.s,g.cy+10*g.s+16*g.s*Math.sin(TAU*1.6*u-t*5)*Math.min(1,u*4)];
function flagellum(c,g,t){
  const n=40,pts=[...Array(n+1)].map((_,i)=>flagPt(g,i/n,t));
  c.save();c.lineCap='round';c.lineJoin='round';
  for(const [col,extra] of [[PINK.edge,2.4],[PINK.flag,0]])for(let i=0;i<n;i++){
    c.beginPath();c.moveTo(...pts[i]);c.lineTo(...pts[i+1]);c.strokeStyle=col;c.lineWidth=Math.max(1,(7-4.6*i/n)*g.s+extra*g.s);c.stroke();}
  c.restore();
}
function cell(c,g,t,{alpha=1,dnaGlow=0}={}){
  if(alpha<=0)return;
  c.save();c.globalAlpha*=alpha;
  flagellum(c,g,t);
  // cell wall: the outer band
  capsule(c,g,0);let gr=c.createLinearGradient(0,g.cy-g.r,0,g.cy+g.r);gr.addColorStop(0,PINK.wallT);gr.addColorStop(1,PINK.wallB);
  c.fillStyle=gr;c.fill();c.strokeStyle=PINK.edge;c.lineWidth=2.5*Math.max(.6,g.s);c.stroke();
  // cytoplasm, rounded shading like the AI rods
  capsule(c,g,15*g.s);gr=c.createRadialGradient(g.cx-g.a*.35,g.cy-g.r*.45,4,g.cx,g.cy,g.a);gr.addColorStop(0,PINK.hi);gr.addColorStop(1,PINK.lo);c.fillStyle=gr;c.fill();
  // cell membrane: the light line just inside the wall
  capsule(c,g,14*g.s);c.strokeStyle=PINK.mem;c.lineWidth=4.5*g.s;c.stroke();
  capsule(c,g,17*g.s);c.strokeStyle=rgba(PINK.memIn,.8);c.lineWidth=1.3*g.s;c.stroke();
  dnaLoop(c,g,t,dnaGlow);
  c.restore();
}
// label anchor points on the cell
const P_WALL=g=>[g.cx-g.a+g.r+(g.r-6*g.s)*Math.cos(1.25*Math.PI),g.cy+(g.r-6*g.s)*Math.sin(1.25*Math.PI)];
const P_MEM=g=>[g.cx-90*g.s,g.cy-g.r+15*g.s];
const P_CYTO=g=>[g.cx-160*g.s,g.cy+34*g.s];
const P_DNA_TOP=(g,t)=>dnaPt(g,1.5*Math.PI,t),P_DNA_BOT=(g,t)=>dnaPt(g,.5*Math.PI,t);

// the lone rod of rods.png, clipped to its capsule, centre at (x,y), long axis turned by rot, length len
function rod(c,x,y,rot,len,alpha=1){
  const im=pic(AI+'rods.png');if(!im||alpha<=0)return;
  const k=len/ROD_L;
  c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(rot);c.scale(k,k);c.rotate(-ROD_ANG);c.translate(-ROD_C[0],-ROD_C[1]);
  const ang=Math.atan2(ROD.b[1]-ROD.a[1],ROD.b[0]-ROD.a[0]);
  c.save();c.translate(...ROD.a);c.rotate(ang);c.beginPath();c.roundRect(-3,-ROD.hw-3,ROD_L+6,ROD.hw*2+6,ROD.hw+3);c.restore();
  c.clip();c.drawImage(im,0,0);c.restore();
}

// ── the Paramecium ─────────────────────────────────────────────────────────
const prect=(x,y,w)=>({x,y,w,h:w*PH/PW});
const ppt=(r,f)=>[r.x+f[0]*r.w,r.y+f[1]*r.h];
function nucPath(c,map){c.beginPath();NUC.forEach((f,i)=>{const [x,y]=map(f);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();}
function nucOutline(c,r,a,t,w=3){
  if(a<=0)return;const pul=.5+.5*Math.sin(t*3.2);
  c.save();c.globalAlpha*=a;c.lineJoin='round';nucPath(c,f=>ppt(r,f));
  c.shadowColor=rgba(C.cyan,.9);c.shadowBlur=10+8*pul;c.strokeStyle=C.cyan;c.lineWidth=w+1.5*pul;c.stroke();c.restore();
}
// DNA threads inside the nucleus (clipped to the nucleus outline), same colour as the bacterial DNA.
function dnaThreads(c,map,sc,t){
  const [x0,y0]=map([.455,.345]),[x1,y1]=map([.665,.64]);
  c.save();nucPath(c,map);c.clip();c.lineCap='round';c.lineJoin='round';
  for(let j=0;j<5;j++){
    c.beginPath();
    for(let i=0;i<=60;i++){const u=i/60,x=mix(x0,x1,u),yb=mix(y0,y1,(j+.5)/5)+(u-.5)*-(y1-y0)*.35;
      const y=yb+sc*(9*Math.sin(u*TAU*2.2+j*1.7+t*.9)+5*Math.sin(u*TAU*5.3+j+t*.6));i?c.lineTo(x,y):c.moveTo(x,y);}
    c.strokeStyle=DNA_COL;c.lineWidth=4.2*sc;c.stroke();c.strokeStyle=DNA_CORE;c.lineWidth=1.3*sc;c.stroke();
  }
  c.restore();
}
// round zoom on the nucleus: centre (zx,zy), radius R, scale k (picture pixels → canvas)
function zoom(c,zx,zy,R,k,a,t){
  const im=pic(AI+PFILE);if(a<=0)return null;
  const cx=NUC_C[0]*PW,cy=NUC_C[1]*PH,map=f=>[zx+(f[0]*PW-cx)*k,zy+(f[1]*PH-cy)*k];
  c.save();c.globalAlpha*=a;
  circle(c,zx,zy,R,C.panel,null);
  c.save();c.beginPath();c.arc(zx,zy,R,0,TAU);c.clip();
  if(im)c.drawImage(im,zx-cx*k,zy-cy*k,PW*k,PH*k);
  dnaThreads(c,map,k,t);
  const pul=.5+.5*Math.sin(t*3.2);c.lineJoin='round';nucPath(c,map);c.shadowColor=rgba(C.cyan,.9);c.shadowBlur=10+8*pul;
  c.strokeStyle=C.cyan;c.lineWidth=4+2*pul;c.stroke();c.restore();
  circle(c,zx,zy,R,null,rgba(C.white,.85),3);
  c.restore();
  return map;
}

// ── layouts per step (eased between steps) ─────────────────────────────────
const CELL=[{x:500,y:330,s:1,a:1},{x:40,y:330,s:.62,a:0},{x:215,y:160,s:.5,a:1}];
const PA=prect(20,150,520),PB=prect(540,62,360);
const paraAt=(k,from)=>k===1?{...PA,a:1}:k===2?{...PB,a:1}:(from===2?{...prect(570,82,300),a:0}:{...prect(72,180,416),a:0});
const lerpR=(p,q,u)=>({x:mix(p.x,q.x,u),y:mix(p.y,q.y,u),w:mix(p.w,q.w,u),h:mix(p.h,q.h,u),a:mix(p.a,q.a,u)});
const ZC=[770,290],ZR=128,ZK=256/250;
const THUMB={x:24,y:16,w:200,h:112};

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u}=track(s,'nucL',k,t,1.0),out=held?1:1-fade(tau,PER-.45,.45),settle=clamp((u-.6)/.4);
  const L=(i,lab)=>fade(tau,lab,.5)*settle*out;    // label alpha, delayed

  // step 3: the two panels and their headings, drawn first so the pictures sit on top
  if(k===2)[[20,T.bact,0],[500,T.para,1]].forEach(([x,p,i])=>{
    const a=fade(tau,.2,.5)*out;c.save();c.globalAlpha*=a;D.round(c,x,8,440,460,16,'rgba(11,26,21,.35)',C.edge);
    const pw=measure(c,p,22)+44;D.round(c,x+220-pw/2,16,pw,40,20,'rgba(11,26,21,.92)',rgba(i?C.cyan:C.orange,.85));text(c,p,x+220,44,22,i?C.cyan:C.orange,'center');c.restore();
    D.hit(x,8,440,460,'phase',i);});
  // the Paramecium (all steps; hidden in step 1)
  const pr=lerpR(paraAt(from,k),paraAt(k,from),u);
  if(pr.a>.01){if(k>0&&u>.95)glow(c,pr.x+pr.w*NUC_C[0],pr.y+pr.h*NUC_C[1],pr.w*.3,C.cyan,.10);
    drawIn(c,PFILE,{x:pr.x,y:pr.y+Math.sin(t*1.1)*3,w:pr.w,h:pr.h},{alpha:pr.a});}
  const prB={...pr,y:pr.y+Math.sin(t*1.1)*3};

  if(k===0){
    // thumbnail of one AI rod; a copy flies out, turns level and grows into the section
    const g=geo(CELL[0].x,CELL[0].y,1);
    const ta=fade(tau,.0,.4);
    c.save();c.globalAlpha*=ta;D.round(c,THUMB.x,THUMB.y,THUMB.w,THUMB.h,12,'rgba(11,26,21,.75)',rgba(C.white,.55));c.restore();
    const tcx=THUMB.x+THUMB.w/2,tcy=THUMB.y+THUMB.h/2+Math.sin(t*1.3)*2;
    rod(c,tcx,tcy,ROD_ANG,150,ta);
    tag(c,T.thumb,THUMB.x+THUMB.w/2,THUMB.y+THUMB.h+8,{col:C.muted,maxW:200,a:ta*out});
    const fu=ease((tau-.35)/1.1),reveal=fade(tau,1.05,.5);
    if(tau>.35&&reveal<1){const fx=mix(tcx,g.cx,fu),fy=mix(tcy,g.cy,fu);rod(c,fx,fy,mix(ROD_ANG,0,fu),mix(150,2*g.a,fu),(1-reveal)*.95);}
    cell(c,g,t,{alpha:reveal*(held?1:mix(1,.0,fade(tau,PER-.45,.45))),dnaGlow:fade(tau,2.6,.5)*(.5+.5*Math.sin(t*3))});
    const la=i=>L(0,1.6+i*.38);
    tag(c,T.wall,232,214,{align:'right',tgt:P_WALL(g),a:la(0),maxW:180});
    tag(c,T.mem,400,166,{tgt:P_MEM(g),a:la(1),maxW:200});
    tag(c,T.cyto,232,446,{align:'right',tgt:P_CYTO(g),a:la(2),maxW:180});
    tag(c,T.dna,600,166,{col:C.pink,tgt:P_DNA_TOP(g,t),a:la(3),size:24});
    tag(c,T.noEnv,520,450,{col:C.orange,tgt:P_DNA_BOT(g,t),a:la(4),maxW:470});
    tag(c,T.flag,850,236,{tgt:flagPt(g,.55,t),a:la(5),maxW:160});
    tag(c,T.bsize,480,546,{col:C.muted,a:la(5),maxW:900});
  } else {
    // the cell drawn small (slides away in step 2, back in step 3)
    const cf=CELL[from],ct=CELL[k],cu=u;
    const g=geo(mix(cf.x,ct.x,cu),mix(cf.y,ct.y,cu),mix(cf.s,ct.s,cu));
    cell(c,g,t,{alpha:mix(cf.a,ct.a,cu),dnaGlow:k===2?fade(tau,1.6,.5)*(.5+.5*Math.sin(t*3)):0});
    if(k===2){
      // labels on the pictures
      tag(c,T.dna,215,276,{col:C.pink,tgt:P_DNA_BOT(g,t),a:L(0,1.2)});
      nucOutline(c,prB,L(0,1.2),t,2.5);
      tag(c,T.nuc,730,276,{col:C.cyan,tgt:ppt(prB,NUC_BOT),a:L(0,1.2)});
      // rows: has DNA / nuclear envelope, then the verdict
      [0,1].forEach(side=>{
        const x=side?520:40;
        T.rows[side].forEach(([ok,p],j)=>{const a=L(0,1.8+j*.6+side*.3),dy=(1-ease(a))*10;if(a<=0)return;
          check(c,x+30,340+j*46+dy,ok,a);c.save();c.globalAlpha*=a;rowsOf(c,p,370).forEach((r,m)=>text(c,r,x+54,348+j*46+dy+m*28,22,C.white));c.restore();});
        const va=L(0,3.2+side*.4),pop=1+.25*(1-ease(va)),col=side?C.cyan:C.orange,vw=measure(c,T.verdict[side],24)+40;
        if(va>0){c.save();c.globalAlpha*=va;c.translate(x+200,436);c.scale(pop,pop);
          D.round(c,-vw/2,-22,vw,44,22,col,C.white);text(c,T.verdict[side],0,9,24,C.ink,'center');c.restore();}
      });
      const ba=L(0,4.4);
      if(ba>0){const r1=rowsOf(c,T.size1,850,24),r2=rowsOf(c,T.size2,850),h=22+r1.length*32+r2.length*28,y=592-h,pul=.5+.5*Math.sin(t*2.6);
        c.save();c.globalAlpha*=ba;D.round(c,40,y,880,h,16,rgba(C.yellow,.09+.05*pul),C.yellow);
        r1.forEach((r,m)=>text(c,r,480,y+34+m*32,24,C.yellow,'center'));
        r2.forEach((r,m)=>text(c,r,480,y+34+r1.length*32+m*28-2,22,C.muted,'center'));c.restore();}
    }
  }

  if(k===1){
    // nucleus outline, then the zoom grows out of it
    nucOutline(c,prB,L(0,.9),t);
    const zu=ease((tau-1.1)/.8)*settle,[nx,ny]=ppt(prB,NUC_C);
    if(zu>0){
      const zx=mix(nx,ZC[0],zu),zy=mix(ny,ZC[1],zu),R=mix(18,ZR,zu),kk=mix(prB.w/PW,ZK,zu);
      // dashed lines from the nucleus to the zoom
      c.save();c.globalAlpha*=zu*out;c.setLineDash([7,6]);c.lineDashOffset=-t*10;
      line(c,[[nx+18,ny-26],[zx-R*.55,zy-R*.84]],rgba(C.white,.7),2);line(c,[[nx+22,ny+22],[zx-R*.55,zy+R*.84]],rgba(C.white,.7),2);c.restore();
      zoom(c,zx,zy,R,kk,out,t);
      if(zu>.98){
        const map=f=>[ZC[0]+(f[0]*PW-NUC_C[0]*PW)*ZK,ZC[1]+(f[1]*PH-NUC_C[1]*PH)*ZK];
        tag(c,T.zoom,612,272,{col:C.white,a:L(0,2.0)});
        tag(c,T.dnaIn,940,116,{align:'right',col:C.pink,tgt:map([.585,.47]),a:L(0,2.4),maxW:230});
        tag(c,T.env,940,436,{align:'right',col:C.cyan,tgt:map(NUC_LR),a:L(0,2.8),maxW:230});
      }
    }
    tag(c,T.nuc,ppt(prB,NUC_TOP)[0]-18,96,{col:C.cyan,tgt:ppt(prB,NUC_TOP),a:L(0,1.2),size:24});
    tag(c,T.cilia,120,474,{tgt:ppt(prB,CILIA),a:L(0,1.6)});
    tag(c,T.psize,480,546,{col:C.muted,a:L(0,3.0),maxW:900});
  }
}
window.MicroDraw.nucleus=draw;
})();

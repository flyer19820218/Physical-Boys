/* Prokaryotes and protists · "Nostoc and Oscillatoria" canvas (cyano tab, view 0), 2026-10-22.
 * Step 0  Nostoc (nostoc_chain.png) large, with a round zoom window on one pale cell: jelly sheath, ordinary cells,
 *         heterocysts (the three paler cells; Extra: nitrogen gas N2 drifts into one).
 * Step 1  Oscillatoria (oscillatoria.png) large; the thread sways and glides; zoom window on the disc-shaped cells.
 * Step 2  Both pictures shrink to the left; one Nostoc cell is drawn enlarged by code (same rounded teal look as the
 *         Gemini cells): light, photosynthetic pigments spread through the cell, no chloroplast.
 *         Card on the right: an algal cell (eukaryote) for comparison, chloroplasts highlighted.
 * Step 3  Same layout: DNA lies in the cell with no nuclear envelope -> no nucleus -> prokaryote; the card highlights the
 *         algal nucleus. "Called an alga, but still a prokaryote".
 * Pictures and labels move with an eased layout, so changing steps slides instead of jumping.
 * Every point on a picture is a fraction of its PNG, measured from the pixels (cell disks fitted to the pale cells,
 * the sheath edge found by walking out of a cell until the alpha drops, disc boundaries from the luminance along the thread).
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,TAU,text,measure,splitLines,circle,ellipse,glow,arrow,dashed,line,clamp,mix,ease,fade,rgba,rng,drawIn,stageClock,pill}=K;
const N=4,PER=7;
const NOS='nostoc_chain.png',OSC='oscillatoria.png';
const [NW,NH]=K.SIZE[NOS],[OW,OH]=K.SIZE[OSC];

// ── measured on the pictures (fractions of width, height) ───────────────────
// Nostoc: centres of the three paler cells (heterocysts), radius 0.034 W; ordinary cells; sheath edge points.
const HET=[[.5667,.2630],[.2528,.4891],[.0772,.7554]],HET_R=.034;
const NOS_CELL_A=[.6289,.2387];                 // ordinary cell next to the top heterocyst (zoom window)
const NOS_RIM_UL=[.2508,.4171];                 // outer edge of the sheath, upper-left side of the chain (main picture)
const NOS_CELL_Z=[.4624,.3166];                 // the ordinary cell drawn enlarged in steps 2 and 3
// zoom window of step 0: a 250 px square of the picture around the top heterocyst
const Z0={sx:565,sy:314,half:125};
const Z0_RIM=[595,368],Z0_CELL=[627,285];       // picture pixels: lower sheath edge; ordinary cell
// Oscillatoria: thread runs from the top-right tip to the bottom-left tip; one disc-shaped cell (centre, axis).
const OSC_TIP=[.96,.03],OSC_THREAD=[.364,.69],OSC_SWAY=[.856,.172];   // centre of the thread near the top
const Z1={sx:545,sy:619,half:120};             // zoom window of step 1, centred on one disc
const DISC={c:[545.4,619.2],len:100,thick:28.6,ax:[.757,.653]};   // across-the-thread direction

// ── layout per step (eased) ─────────────────────────────────────────────────
const LAY=[
 {nx:30,ny:22,nh:530,na:1, ox:30,oy:22,oh:530,oa:0, z0:1,z1:0,cell:0,card:0},
 {nx:30,ny:22,nh:530,na:0, ox:30,oy:22,oh:530,oa:1, z0:0,z1:1,cell:0,card:0},
 {nx:24,ny:24,nh:230,na:1, ox:24,oy:318,oh:200,oa:1, z0:0,z1:0,cell:1,card:1},
 {nx:24,ny:24,nh:230,na:1, ox:24,oy:318,oh:200,oa:1, z0:0,z1:0,cell:1,card:1}];
function follow(o,key,target,dt,rate){if(o[key]===undefined||!isFinite(o[key]))o[key]=target;else o[key]+=(target-o[key])*(1-Math.exp(-dt*rate));return o[key];}

// ── small helpers ──────────────────────────────────────────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(seg=>splitLines(c,seg,w,size));
// Text block (rows) at x, first baseline y. Returns {x0,x1,y0,y1}.
function block(c,p,x,y,{w=260,col=C.white,align='left',size=22,lh=28,a=1}={}){
  const rows=rowsOf(c,p,w,size);let mw=0;rows.forEach(r=>{mw=Math.max(mw,measure(c,r,size));});
  if(a>0){c.save();c.globalAlpha*=a;rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));c.restore();}
  const x0=align==='left'?x:align==='right'?x-mw:x-mw/2;
  return{x0,x1:x0+mw,y0:y-size*.82,y1:y+(rows.length-1)*lh+size*.25,n:rows.length};
}
function leader(c,from,to,col,a,dot=4.5){if(a<=0)return;c.save();c.globalAlpha*=a;line(c,[from,to],rgba(col,.95),2);circle(c,to[0],to[1],dot,col,C.ink,1.5);c.restore();}
function ring(c,x,y,r,col,t,a){if(a<=0)return;c.save();c.globalAlpha*=a;circle(c,x,y,r,null,col,2.5);const q=(t*.7)%1;circle(c,x,y,r+q*12,null,rgba(col,.8*(1-q)),2);c.restore();}

// Picture placement: rect from (x, y, h); Oscillatoria sways about its centre and glides along its axis.
const nosRect=L=>({x:L.nx,y:L.ny,w:L.nh*NW/NH,h:L.nh});
const oscRect=L=>({x:L.ox,y:L.oy,w:L.oh*OW/OH,h:L.oh});
const OSC_AX=(()=>{const dx=(OSC_TIP[0]-.05)*OW,dy=(OSC_TIP[1]-.96)*OH,n=Math.hypot(dx,dy);return[dx/n,dy/n];})();
function sway(t,r){return{th:.032*Math.sin(t*1.25),g:r.h/530*7*Math.sin(t*.8),cx:r.x+r.w/2,cy:r.y+r.h/2};}
function swayPt(sw,x,y){const dx=x-sw.cx,dy=y-sw.cy,cs=Math.cos(sw.th),sn=Math.sin(sw.th);return[sw.cx+dx*cs-dy*sn+OSC_AX[0]*sw.g,sw.cy+dx*sn+dy*cs+OSC_AX[1]*sw.g];}
const fp=(r,f)=>[r.x+f[0]*r.w,r.y+f[1]*r.h];

// Zoom window: a circle showing a square of the picture, enlarged. map(px,py) -> canvas.
function zoomWin(c,file,W,H,z,cx,cy,R,a){
  if(a<=0)return;
  c.save();c.globalAlpha*=a;
  circle(c,cx,cy,R,'rgba(11,26,21,.92)',null);
  drawIn(c,file,{x:cx-R,y:cy-R,w:2*R,h:2*R},{radius:R,crop:[(z.sx-z.half)/W,(z.sy-z.half)/H,2*z.half/W,2*z.half/H]});
  circle(c,cx,cy,R,null,rgba(C.white,.85),3);
  c.restore();
}
const zmap=(z,cx,cy,R)=>(px,py)=>[cx+(px-z.sx)*R/z.half,cy+(py-z.sy)*R/z.half];

// ── code-drawn cells (steps 2 and 3) ───────────────────────────────────────
// Pigment granules spread through the whole cell (not gathered anywhere).
const PIG=(()=>{const r=rng(7),out=[];while(out.length<70){const x=r()*2-1,y=r()*2-1;if(x*x+y*y<.78)out.push([x,y,r()*TAU,.6+r()*.6]);}return out;})();
function cyanoCell(c,x,y,r,t,{pig=1,lit=0,dna=0}={}){
  glow(c,x,y,r*1.25,'#55e9ff',.10);
  const g=c.createRadialGradient(x-r*.38,y-r*.42,r*.08,x,y,r);
  g.addColorStop(0,'#b4dcda');g.addColorStop(.35,'#78acb2');g.addColorStop(1,'#3f7581');
  circle(c,x,y,r,g,null);
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  // pigment granules: dark teal dots like the stipple on the Gemini cells; they light up when light shines (step 2)
  PIG.forEach(([u,v,ph,s])=>{
    const px=x+u*r*1.02,py=y+v*r*1.02,tw=.5+.5*Math.sin(t*2.2+ph);
    circle(c,px,py,4.6*s,rgba('#1d5650',.9*pig),null);circle(c,px,py,2.6*s,rgba('#3fae8a',.95*pig),null);
    if(lit>0){circle(c,px,py,7*s,rgba('#8ff5c9',.25*lit*tw*pig),null);circle(c,px,py,2.8*s,rgba('#b8ffd9',lit*(.35+.65*tw)*pig),null);}});
  c.restore();
  // DNA: a tangled loop in the middle of the cytoplasm, no envelope around it
  if(dna>0){c.save();c.globalAlpha*=dna;c.lineJoin='round';c.lineCap='round';
    [[.40,1.1,0],[.30,-.9,2.1]].forEach(([R0,sp,o])=>{c.beginPath();
      for(let i=0;i<=120;i++){const th=i/120*TAU,rr=r*R0*(.62+.22*Math.sin(3*th+t*sp*.6+o)+.14*Math.sin(7*th-t*.5+o));
        const px=x+Math.cos(th)*rr,py=y+Math.sin(th)*rr*.82;i?c.lineTo(px,py):c.moveTo(px,py);}
      c.closePath();c.strokeStyle=C.orange;c.lineWidth=3.2;c.stroke();});
    c.restore();}
  circle(c,x,y,r,null,'#2c5f68',4);
  c.save();c.beginPath();c.arc(x,y,r-5,Math.PI*1.08,Math.PI*1.45);c.strokeStyle=rgba('#e8fbff',.55);c.lineWidth=4;c.lineCap='round';c.stroke();c.restore();
}
// Algal cell (eukaryote) for comparison: cell wall, chloroplasts, nucleus with its envelope and DNA inside.
const CHL=[[-.55,-.25,.5],[-.2,.55,-.2],[.45,.42,.35],[.62,-.18,-.5],[.4,-.56,.3]];
function algaCell(c,x,y,rx,ry,t,hiChl,hiNuc){
  glow(c,x,y,rx*1.2,C.green,.08);
  const g=c.createRadialGradient(x-rx*.3,y-ry*.35,4,x,y,rx);g.addColorStop(0,'#5d8f6a');g.addColorStop(1,'#2f5a40');
  ellipse(c,x,y,rx,ry,g,null);
  CHL.forEach(([u,v,rot],i)=>{const cx=x+u*rx,cy=y+v*ry,pu=hiChl?.5+.5*Math.sin(t*3+i):0;
    if(hiChl)glow(c,cx,cy,30,C.green,.35*hiChl*(.5+.5*pu));
    ellipse(c,cx,cy,19,10,'#3fbf5f','#1d5e2e',2,rot);
    c.save();c.translate(cx,cy);c.rotate(rot);for(let k=-1;k<=1;k++)line(c,[[k*7,-6],[k*7,6]],'#1d5e2e',2);c.restore();});
  const nx=x-rx*.08,ny=y-ry*.05,pn=hiNuc?.5+.5*Math.sin(t*3):0;
  if(hiNuc)glow(c,nx,ny,46,C.pink,.35*hiNuc*(.5+.5*pn));
  circle(c,nx,ny,25,'#5a4b7e',null);
  c.save();c.beginPath();for(let i=0;i<=60;i++){const th=i/60*TAU,rr=12+4*Math.sin(4*th+t*.8);const px=nx+Math.cos(th)*rr,py=ny+Math.sin(th)*rr;i?c.lineTo(px,py):c.moveTo(px,py);}
  c.strokeStyle=C.orange;c.lineWidth=2.4;c.stroke();c.restore();
  circle(c,nx,ny,25,null,C.pink,2.5);circle(c,nx,ny,29,null,rgba(C.pink,.85),2);
  ellipse(c,x,y,rx,ry,null,'#9fd3a8',3.5);ellipse(c,x,y,rx-6,ry-6,null,rgba('#9fd3a8',.5),1.5);
  return{chl:[x+CHL[1][0]*rx,y+CHL[1][1]*ry],nuc:[nx,ny]};
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const dt=s.cyT===undefined?0:Math.max(0,Math.min(.1,t-s.cyT));s.cyT=t;
  const L=s.cyL||(s.cyL={});Object.entries(LAY[k]).forEach(([key,v])=>follow(L,key,v,dt,4.2));
  if(s.cyK!==k){s.cyFrom=s.cyK===undefined?k:s.cyK;s.cyK=k;}
  // presence of each step: rises on its step, falls quickly after it (snapped to 0, so old labels are really gone)
  const pres=s.cyP||(s.cyP=[0,0,0,0]);for(let j=0;j<N;j++){follow(pres,j,j===k?1:0,dt,9);if(Math.abs(pres[j]-(j===k?1:0))<.02)pres[j]=j===k?1:0;}
  // label alpha: on its own step it fades in from t0 (never before 0.45 s, when the previous step's labels are gone)
  const A=(j,t0)=>{const v=j===k?Math.min(pres[j],fade(tau,Math.max(.45,t0),.5)):pres[j];return v<.02?0:v;};
  // steps 2 and 3 share one layout: moving between them keeps it; coming from step 0 or 1 it fades in
  const c23=k>=2?(s.cyFrom>=2?1:fade(tau,.45,.5)):Math.max(pres[2],pres[3])>.02?Math.max(pres[2],pres[3]):0;
  const nr=nosRect(L),or=oscRect(L),sw=sway(t,or);
  const small=clamp((530-L.nh)/300);                                       // 0 = big pictures, 1 = thumbnails

  // ── pictures ──
  if(L.na>.01)drawIn(c,NOS,nr,{alpha:L.na});
  if(L.oa>.01){c.save();c.translate(sw.cx,sw.cy);c.rotate(sw.th);c.translate(-sw.cx+OSC_AX[0]*sw.g,-sw.cy+OSC_AX[1]*sw.g);drawIn(c,OSC,or,{alpha:L.oa});c.restore();}

  // names (big, top-left, steps 0 and 1)
  const nameA0=A(0,.5),nameA1=A(1,.5);
  if(nameA0>0){c.save();c.globalAlpha*=nameA0;text(c,P(`念珠藻`,`Nostoc`),40,62,30,C.yellow);text(c,P(`一種藍綠菌`,`a cyanobacterium`),40,94,22,C.muted);c.restore();}
  if(nameA1>0){c.save();c.globalAlpha*=nameA1;text(c,P(`顫藻`,`Oscillatoria`),40,62,30,C.yellow);text(c,P(`一種藍綠菌`,`a cyanobacterium`),40,94,22,C.muted);c.restore();}

  // ── step 0: Nostoc ──
  const a0=pres[0];
  if(a0>.01){
    const h=HET.map(f=>fp(nr,f)),hr=HET_R*nr.w;
    // the three pale cells: rings and one label
    const ha=A(0,.6);
    h.forEach(([x,y],i)=>ring(c,x,y,hr+5,C.yellow,t+i*.33,ha));
    const hb=block(c,P(`異形胞（顏色較淡）`,`Heterocysts (paler cells)`),250,446,{w:330,col:C.yellow,a:ha});
    leader(c,[hb.x0-6,hb.y0+10],[h[2][0]+hr+5,h[2][1]+3],C.yellow,ha,0);
    leader(c,[hb.x0+8,hb.y0-4],[h[1][0]+hr*.7+4,h[1][1]+hr*.7+4],C.yellow,ha,0);
    leader(c,[hb.x0+50,hb.y0-4],[h[0][0]+2,h[0][1]+hr+5],C.yellow,ha,0);
    block(c,P(`補充：負責固氮`,`Extra: they fix nitrogen`),250,446+hb.n*28,{w:330,col:C.green,a:A(0,1.0)});
    // jelly sheath on the main picture
    const sa=A(0,1.3),rim=fp(nr,NOS_RIM_UL);
    const sb=block(c,P(`膠質鞘`,`Jelly\nsheath`),40,250,{w:80,col:C.cyan,a:sa});
    leader(c,[sb.x1+6,250-8],rim,C.cyan,sa);
    // zoom window on the top heterocyst
    const za=Math.min(L.z0,A(0,.3)),ZC=[650,318],ZR=140,zm=zmap(Z0,ZC[0],ZC[1],ZR);
    if(za>0){
      const k0=nr.w/NW,sq={x:nr.x+(Z0.sx-Z0.half)*k0,y:nr.y+(Z0.sy-Z0.half)*k0,s:2*Z0.half*k0};
      c.save();c.globalAlpha*=za;c.setLineDash([6,5]);D.round(c,sq.x,sq.y,sq.s,sq.s,6,null,rgba(C.white,.9));c.restore();
      const e1=[ZC[0]+ZR*Math.cos(TAU*.6),ZC[1]+ZR*Math.sin(TAU*.6)],e2=[ZC[0]+ZR*Math.cos(TAU*.43),ZC[1]+ZR*Math.sin(TAU*.43)];
      c.save();c.globalAlpha*=za;dashed(c,[[sq.x+sq.s,sq.y],e1],rgba(C.white,.7),2,[6,6],-t*10);dashed(c,[[sq.x+sq.s,sq.y+sq.s],e2],rgba(C.white,.7),2,[6,6],-t*10);c.restore();
      block(c,P(`放大`,`Zoom`),436,146,{w:90,col:C.white,a:za});
      zoomWin(c,NOS,NW,NH,Z0,ZC[0],ZC[1],ZR,za);
      // nitrogen gas drifting into the heterocyst (Extra)
      const hz=zm(Z0.sx,Z0.sy),na=Math.min(za,A(0,1.6));
      if(na>0){c.save();c.beginPath();c.arc(ZC[0],ZC[1],ZR-2,0,TAU);c.clip();c.globalAlpha*=na;
        [[748,428],[712,454],[772,388],[680,462]].forEach(([x0,y0],i)=>{const q=((t*.32+i*.25)%1),u=ease(q),x=mix(x0,hz[0],u),y=mix(y0,hz[1]+12,u),al=Math.min(1,q*5)*(1-clamp((q-.78)/.22));
          c.save();c.globalAlpha*=al;circle(c,x-5,y,5.5,'#dbe9ff','#5f7c9c',1.5);circle(c,x+5,y,5.5,'#dbe9ff','#5f7c9c',1.5);c.restore();});
        c.restore();
        block(c,P(`氮氣 N₂`,`Nitrogen gas N₂`),ZC[0],ZC[1]+ZR+30,{w:220,col:'#dbe9ff',align:'center',a:na});}
      // labels on the zoom window
      const la=Math.min(za,A(0,.9));
      const hb2=block(c,P(`異形胞`,`Heterocyst`),ZC[0],ZC[1]-ZR-14,{w:200,col:C.yellow,align:'center',a:la});
      leader(c,[ZC[0],hb2.y1+4],[hz[0],hz[1]-39*.95],C.yellow,la);
      const cp=zm(...Z0_CELL),cb=block(c,P(`一般的細胞`,`Ordinary\ncell`),ZC[0]+ZR+12,cp[1]+8,{w:130,col:C.green,a:la});
      leader(c,[cb.x0-6,cp[1]],[cp[0]+16,cp[1]+6],C.green,la);
      const rp=zm(...Z0_RIM),rb=block(c,P(`膠質鞘`,`Jelly\nsheath`),ZC[0]+ZR+12,rp[1]+30,{w:130,col:C.cyan,a:la});
      leader(c,[rb.x0-6,rb.y0+8],rp,C.cyan,la);
    }
  }

  // ── step 1: Oscillatoria ──
  const a1=pres[1];
  if(a1>.01){
    const op=f=>swayPt(sw,...fp(or,f));
    const ta=A(1,.6),th=op(OSC_THREAD);
    const tb=block(c,P(`細胞一個個疊成一條細絲`,`Cells stacked one by one into a thread`),262,404,{w:300,col:C.green,a:ta});
    leader(c,[tb.x0-6,tb.y0+6],th,C.green,ta);
    // sway: a double-headed arc beyond the top tip; glide: a double arrow beside the lower thread
    const ma=A(1,1.2),tip=op(OSC_TIP);
    if(ma>0){c.save();c.globalAlpha*=ma;
      // sway: two arrows across the upper thread (one on each side), pulsing outward with the swing
      const up=op(OSC_SWAY),px=-OSC_AX[1],py=OSC_AX[0],sg=Math.sin(t*1.25);   // (px,py): across the thread, towards lower right
      [-1,1].forEach(sd=>{const o=40+(sd*sg>0?8*Math.abs(sg):0);arrow(c,up[0]+px*sd*o,up[1]+py*sd*o,up[0]+px*sd*(o+30),up[1]+py*sd*(o+30),C.orange,3);});
      text(c,P(`左右擺動`,`Sways`),up[0]+px*84,up[1]+py*84+8,22,C.orange);
      const g0=[175,506],g1=[232,441],gx=OSC_AX[0]*sw.g*1.6,gy=OSC_AX[1]*sw.g*1.6;
      arrow(c,(g0[0]+g1[0])/2+gx,(g0[1]+g1[1])/2+gy,g1[0]+gx,g1[1]+gy,C.orange,3);arrow(c,(g0[0]+g1[0])/2+gx,(g0[1]+g1[1])/2+gy,g0[0]+gx,g0[1]+gy,C.orange,3);
      text(c,P(`慢慢滑動`,`Glides slowly`),236,532,22,C.orange);
      c.restore();}
    // zoom window on the disc-shaped cells
    const za=Math.min(L.z1,A(1,.3)),ZC=[660,300],ZR=135,zm=zmap(Z1,ZC[0],ZC[1],ZR);
    if(za>0){
      const k1=or.w/OW,cs=[or.x+Z1.sx*k1,or.y+Z1.sy*k1],hs=Z1.half*k1;
      const q=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>swayPt(sw,cs[0]+u*hs,cs[1]+v*hs));
      c.save();c.globalAlpha*=za;c.setLineDash([6,5]);line(c,[...q,q[0]],rgba(C.white,.9),2);c.restore();
      const e1=[ZC[0]+ZR*Math.cos(TAU*.62),ZC[1]+ZR*Math.sin(TAU*.62)],e2=[ZC[0]+ZR*Math.cos(TAU*.40),ZC[1]+ZR*Math.sin(TAU*.40)];
      c.save();c.globalAlpha*=za;dashed(c,[q[1],e1],rgba(C.white,.7),2,[6,6],-t*10);dashed(c,[q[2],e2],rgba(C.white,.7),2,[6,6],-t*10);c.restore();
      zoomWin(c,OSC,OW,OH,Z1,ZC[0],ZC[1],ZR,za);
      // one disc outlined, pulsing
      const la=Math.min(za,A(1,.9)),dc=zm(...DISC.c),dl=DISC.len*ZR/Z1.half,dk=DISC.thick*ZR/Z1.half,ang=Math.atan2(DISC.ax[1],DISC.ax[0]),pu=.5+.5*Math.sin(t*3);
      if(la>0){c.save();c.globalAlpha*=la;c.translate(...dc);c.rotate(ang);c.beginPath();c.roundRect(-dl/2-3,-dk/2-2,dl+6,dk+4,dk/2);c.fillStyle=rgba(C.yellow,.12+.1*pu);c.fill();c.strokeStyle=C.yellow;c.lineWidth=2.5+1.5*pu;c.stroke();c.restore();}
      const end=[dc[0]+DISC.ax[0]*(dl/2+4),dc[1]+DISC.ax[1]*(dl/2+4)];
      const db=block(c,P(`圓盤狀的細胞`,`Disc-shaped\ncell`),ZC[0]+ZR+12,end[1]+16,{w:140,col:C.yellow,a:la});
      leader(c,[db.x0-6,end[1]+4],end,C.yellow,la);
    }
  }

  // ── steps 2 and 3: one cell enlarged; algal cell for comparison ──
  if(c23>0){
    const ca=Math.min(L.cell,c23),a23=c23;
    // thumbnail names (and "prokaryote" tags in step 3)
    const tn=small;
    if(tn>.05){c.save();c.globalAlpha*=tn*a23;
      // names sit at the thumbnails' final places (they fade, they do not ride along while the pictures resize)
      const nT=nosRect(LAY[2]),oT=oscRect(LAY[2]),nx=nT.x+nT.w/2,ox=oT.x+oT.w/2;
      text(c,P(`念珠藻`,`Nostoc`),nx,nT.y+nT.h+26,22,C.white,'center');text(c,P(`顫藻`,`Oscillatoria`),ox,oT.y+oT.h+26,22,C.white,'center');c.restore();
      const pa=A(3,1.4)*tn;if(pa>0){c.save();c.globalAlpha*=pa;text(c,P(`原核生物`,`Prokaryote`),nx,nT.y+nT.h+52,22,C.orange,'center');text(c,P(`原核生物`,`Prokaryote`),ox,oT.y+oT.h+52,22,C.orange,'center');c.restore();}}
    const CX=455,CY=286,CR=128*mix(.3,1,ease(ca));
    if(ca>0){
      // where the enlarged cell comes from: a box on one cell of the Nostoc thumbnail, dashed lines to the big cell
      const zc=fp(nr,NOS_CELL_Z),zr=HET_R*nr.w+5;
      c.save();c.globalAlpha*=ca;c.setLineDash([5,4]);D.round(c,zc[0]-zr,zc[1]-zr,2*zr,2*zr,4,null,C.white);c.restore();
      c.save();c.globalAlpha*=ca*.8;dashed(c,[[zc[0]+zr,zc[1]-zr],[CX+CR*Math.cos(-2.2),CY+CR*Math.sin(-2.2)]],C.white,2,[6,6],-t*10);dashed(c,[[zc[0]+zr,zc[1]+zr],[CX+CR*Math.cos(2.5),CY+CR*Math.sin(2.5)]],C.white,2,[6,6],-t*10);c.restore();
      block(c,P(`放大`,`Zoom`),262,218,{w:80,col:C.white,align:'center',a:ca});
      // light (step 2)
      const la=A(2,.7);
      if(la>0){const SX=622,SY=104;c.save();c.globalAlpha*=la;glow(c,SX,SY,46,C.yellow,.45);
        for(let i=0;i<10;i++){const an=i/10*TAU+t*.25;line(c,[[SX+Math.cos(an)*28,SY+Math.sin(an)*28],[SX+Math.cos(an)*38,SY+Math.sin(an)*38]],C.yellow,3);}
        circle(c,SX,SY,22,C.yellow,null);
        [-.95,-.62,-.3].forEach(an=>{const ex=CX+CR*Math.cos(an),ey=CY+CR*Math.sin(an);dashed(c,[[SX-18,SY+14],[ex,ey]],rgba(C.yellow,.9),3,[10,8],-t*24);});
        text(c,P(`光`,`Light`),SX,SY-50,22,C.yellow,'center');c.restore();}
      c.save();c.globalAlpha*=ca;cyanoCell(c,CX,CY,CR,t,{pig:1,lit:la,dna:A(3,.6)});c.restore();
      block(c,P(`一個念珠藻細胞（放大）`,`One Nostoc cell (enlarged)`),CX-30,132,{w:300,col:C.white,align:'center',a:ca});
      // below the cell: step 2 pigments; step 3 pigments + DNA
      const p2=A(2,1.1),p3=A(3,.9);
      let below=456;
      if(p2>0){const b=block(c,P(`光合作用的色素：散布在細胞內`,`Pigments for photosynthesis: spread through the cell`),CX,456,{w:380,col:C.green,align:'center',a:p2});
        leader(c,[CX,b.y0-4],[CX+CR*PIG[3][0]*1.02,CY+CR*PIG[3][1]*1.02],C.green,p2);below=Math.max(below,b.y1);}
      if(p3>0){const b1=block(c,P(`色素`,`Pigments`),330,456,{w:150,col:C.green,align:'center',a:p3});
        leader(c,[330,b1.y0-4],[CX+CR*PIG[3][0]*1.02,CY+CR*PIG[3][1]*1.02],C.green,p3);
        const b2=block(c,P(`DNA：沒有核膜包住`,`DNA: no nuclear envelope`),540,456,{w:220,col:C.orange,align:'center',a:p3});
        leader(c,[540,b2.y0-4],[CX+CR*.24,CY+CR*.2],C.orange,p3);below=Math.max(below,b1.y1,b2.y1);}
      // key sentence pills
      const kp2=A(2,1.8),kp3=A(3,1.6);
      if(kp2>0){c.save();c.globalAlpha*=kp2;K.cpill(c,P(`能行光合作用，但沒有葉綠體`,`Photosynthesis, but no chloroplasts`),CX,below+16,{color:C.yellow});c.restore();}
      if(kp3>0){c.save();c.globalAlpha*=kp3;K.cpill(c,P(`沒有細胞核 → 原核生物`,`No nucleus → a prokaryote`),CX,below+16,{color:C.yellow,active:true});c.restore();}
      const ka=A(3,2.2);if(ka>0){c.save();c.globalAlpha*=ka;text(c,P(`名字有「藻」，也是原核生物`,`Called an "alga", yet a prokaryote`),CX,66,24,C.yellow,'center');c.restore();}
    }
    // comparison card: an algal cell (eukaryote)
    const da=Math.min(L.card,c23);
    if(da>0){c.save();c.globalAlpha*=da;
      const X0=692,X1=940,MX=(X0+X1)/2,W=X1-X0-24;
      D.round(c,X0,24,X1-X0,524,16,'rgba(11,26,21,.78)',C.edge);
      let y=58;
      const b1=block(c,P(`比較：藻類的細胞`,`Compare: an algal cell`),MX,y,{w:W,col:C.white,align:'center'});y=b1.y1+26;
      const b2=block(c,P(`（真核生物）`,`(a eukaryote)`),MX,y,{w:W,col:C.muted,align:'center'});y=b2.y1+34;
      const hiN=A(3,.6),hiC=A(2,.6);
      const nb=block(c,P(`細胞核：\nDNA 有核膜包住`,`Nucleus: DNA wrapped in an envelope`),MX,y,{w:W,col:mixCol(hiN),align:'center'});
      const cyC=nb.y1+22+72,cells=algaCell(c,MX,cyC,96,72,t,hiC,hiN);
      leader(c,[MX,nb.y1+6],[cells.nuc[0]+2,cells.nuc[1]-30],C.pink,1);
      const cb=block(c,P(`葉綠體：\n色素集中在這裡`,`Chloroplasts: pigments gathered here`),MX,cyC+72+40,{w:W,col:mixCol(hiC,C.green),align:'center'});
      leader(c,[MX,cb.y0-6],[cells.chl[0],cells.chl[1]+11],C.green,1);
      c.restore();}
  }

  // footnote
  text(c,P(`AI 教學插圖（非實拍）；示意，非同比例`,`AI illustration (not a photo); schematic, not to scale`),940,588,22,C.muted,'right');
  // the thumbnails are clickable: each one opens its own step
  if(k>=2){D.hit(nr.x,nr.y,nr.w,nr.h,'phase',0);D.hit(or.x,or.y,or.w,or.h,'phase',1);}
}
function mixCol(u,base=C.pink){return u>.5?base:rgba(base,.6+.4*u*2);}
window.MicroDraw.cyano=draw;
})();

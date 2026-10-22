/* Fungi · "hyphae" canvas (Tab 1, view 0: the shape of hyphae), 2026-10-22.
 * Registers window.FungiDraw.hyphae; called as draw(ctx, state, t) on the 960x600 canvas. Sets s.shown (stage 0..3).
 * Picture: fungi_ai_1022/hyphae_a.png (AI teaching illustration, 1008x1129). Every position on the picture comes from
 *   fungi_ai_1022/measurements.json (PNG pixels) times the scale; the path of the highlighted hypha was traced by program
 *   along the tube from the free tip (38,802) to the free tip (909,174).
 * Step 1: the net fades in; one whole hypha is highlighted (light flowing along it) and named "one thin tube".
 * Step 2: three Y-shaped branches are ringed; a round close-up grows out of the picture (2.6x the PNG pixels) on the checked
 *   cross-walls (645,230), (608,253), (708,276); the whole net is outlined and named "mycelium".
 * Step 3: three free tips with open fraction >= 0.6 ((909,174), (992,701), (910,1034)) glow; a pale dashed extension grows
 *   in front of each tip (arrow pointing outwards) and a small dashed branch sprouts behind the new tip; then it starts again.
 * Step 4: the net shrinks to the left; on the right a brown plant root with root hairs is drawn in code; a big orange cross.
 * No real sizes, no numbers; the small dots inside the tubes are not named (see sources.md, "待老師看" 2).
 * The page shell owns the animation loop; this module draws one frame and keeps no timer.
 */
(()=>{'use strict';
const K=window.FungiKit,{P,C,D,text,measure,splitLines,rgba,clamp,mix,ease,smooth,fade,stageClock,drawIn,circle,ellipse,line,dashed,cpill,glow,mod,marker,arrow,MONO,TAU}=K;
const N=4,PER=7,PIC='hyphae_a.png',[PW,PH]=K.SIZE[PIC];

// ── words (canvas labels, verbatim from animation_specs.md) ────────────────
const T={
 tube:P(`菌絲（一根細管）`,`Hypha (one thin tube)`),
 thin:P(`很細，要用顯微鏡看`,`Very thin: needs a microscope`),
 ai:P(`AI 教學插圖，非顯微照片`,`AI teaching illustration, not a micrograph`),
 branch:P(`分枝`,`Branch`),wall:P(`橫隔`,`Cross-wall`),net:P(`菌絲體`,`Mycelium`),
 close:P(`局部放大`,`Close-up`),
 tip:P(`尖端`,`Growing tip`),newg:P(`新長出的部分`,`New growth`),
 sketch:P(`示意，不是真實的生長速度`,`A sketch, not the real growth rate`),
 hyph:P(`菌絲：從外界吸收有機養分`,`Hyphae: absorb organic nutrients from outside`),
 root:P(`植物的根：吸收水和無機鹽`,`Plant root: takes up water and mineral salts`),
 notRoot:P(`菌絲不是植物的根`,`Hyphae are not plant roots`)};
const ROOT='#9a6a3a',ROOT2='#b0814c',HAIR='#cfa36c';

// ── measured points (PNG pixels of hyphae_a.png) ───────────────────────────
// one whole hypha, traced along the tube from the free tip (38,802) to the free tip (909,174)
const HYPHA=[[38,802],[60,782],[81,760],[103,740],[126,720],[148,700],[168,678],[188,655],[207,631],[228,609],[250,589],[273,569],[298,552],
 [326,539],[350,520],[374,502],[394,479],[418,459],[440,437],[456,410],[487,397],[512,380],[537,361],[562,344],[588,328],[614,314],[641,300],
 [668,287],[697,279],[740,276],[770,268],[799,260],[826,246],[850,228],[873,209],[895,188],[909,174]];
const FORKS=[[749,275],[791,456],[732,724]];                 // y_forks_x_y_angle (clear Y shapes)
const SEPTA=[[645,230],[608,253],[708,276]];                  // septa_checked_by_eye_x_y inside the close-up
const ZC=[660,250],ZS=60;                                     // close-up source: centre and radius (PNG px)
// free tips with open fraction >= 0.6: position and outward direction (measured from the tube around each tip)
const TIPS=[{p:[909,174],d:[.72,-.69],len:62,side:1},{p:[992,701],d:[.99,.12],len:44,side:-1},{p:[910,1034],d:[.92,.4],len:56,side:-1}];
// picture layout per step: x, y, scale
const LAY=[[40,36,.44],[40,36,.44],[40,36,.44],[36,104,.29]];
// close-up circle (step 2)
const ZX=766,ZY=254,ZR=156;
// tip label and root (step 3, 4)
const TIPLAB=[612,236],RX=772,RY=104;

// ── helpers ────────────────────────────────────────────────────────────────
function track(s,key,k,t,dur){
  let o=s[key];if(!o||t<o.t){o=s[key]={k,from:k,t:t-9};}
  if(o.k!==k){o.from=o.k;o.k=k;o.t=t;}
  return{from:o.from,u:ease((t-o.t)/dur)};
}
function rowsOf(c,p,w,size=22){
  const str=D.tr(p),rows=splitLines(c,str,w,size);
  for(let i=0;i<rows.length-1;i++)if(/[（(]$/.test(rows[i])){rows[i]=rows[i].slice(0,-1).trimEnd();rows[i+1]=(/（/.test(str)?'（':'(')+rows[i+1];}
  return rows;
}
// A label: rows of text with the top at y; leaders from the nearest edge to each target in tgts.
function tag(c,p,x,y,{col=C.white,align='center',maxW=260,tgts=[],a=1,size=22,dot=true}={}){
  if(a<=.004)return null;
  const rows=rowsOf(c,p,maxW,size),lh=size+6,w=Math.max(...rows.map(r=>measure(c,r,size))),h=rows.length*lh;
  const x0=align==='left'?x:align==='right'?x-w:x-w/2;
  c.save();c.globalAlpha*=a;
  for(const [tx,ty] of tgts){
    let sx,sy;
    if(tx<x0-4){sx=x0-6;sy=clamp((ty-y)/h)*h*.6+y+h*.2;}else if(tx>x0+w+4){sx=x0+w+6;sy=clamp((ty-y)/h)*h*.6+y+h*.2;}
    else if(ty>y+h){sx=tx;sy=y+h+4;}else{sx=tx;sy=y-4;}
    line(c,[[sx,sy],[tx,ty]],rgba(col,.9),2);if(dot)circle(c,tx,ty,4.5,col,C.ink,1.5);
  }
  rows.forEach((r,i)=>text(c,r,x,y+size-1+i*lh,size,col,align));
  c.restore();
  return{x0,y,w,h};
}
const at=(L,p)=>[L.x+p[0]*L.sc,L.y+p[1]*L.sc];
// point at fraction f of a polyline
function along(pts,f){
  let tot=0;const seg=[];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d;}
  let r=clamp(f)*tot;for(let i=0;i<seg.length;i++){if(r<=seg[i]){const u=seg[i]?r/seg[i]:0;return[mix(pts[i][0],pts[i+1][0],u),mix(pts[i][1],pts[i+1][1],u)];}r-=seg[i];}
  return pts[pts.length-1];
}
function cross(c,x,y,r,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.lineCap='round';
  for(const w of [[r*.34,C.ink],[r*.22,C.orange]]){c.strokeStyle=w[1];c.lineWidth=w[0];c.beginPath();c.moveTo(x-r,y-r);c.lineTo(x+r,y+r);c.moveTo(x+r,y-r);c.lineTo(x-r,y+r);c.stroke();}
  c.restore();
}

// ── the plant root, drawn in code (brown, with root hairs) ─────────────────
const LAT=[...Array(6)].map((_,i)=>({y0:38+i*44,side:i%2?1:-1,len:118-i*13}));
function plantRoot(c,x,y,t,a,grow){
  if(a<=.004)return;
  c.save();c.globalAlpha*=a;c.translate(x,y);c.lineCap='round';c.lineJoin='round';
  const g=clamp(grow),mainEnd=[6,40+280*g];
  // stem stump on top
  c.beginPath();c.moveTo(-7,-14);c.lineTo(7,-14);c.lineTo(5,6);c.lineTo(-5,6);c.closePath();c.fillStyle=ROOT;c.fill();
  // main root (tapering)
  const mainPt=u=>[mix(0,mainEnd[0],u)+Math.sin(u*3)*-8,mainEnd[1]*u];
  for(let i=0;i<20;i++){const u0=i/20,u1=(i+1)/20,p0=mainPt(u0),p1=mainPt(u1);line(c,[p0,p1],ROOT,mix(10,3,u0));}
  // lateral roots and root hairs
  LAT.forEach((l,i)=>{
    const vis=clamp((g*320-l.y0)/80);if(vis<=0)return;
    const sw=Math.sin(t*.9+i*1.3)*.035,len=l.len*vis,p0=[mainPt(l.y0/mainEnd[1]*g)[0],l.y0];
    const pt=u=>{const ang=sw*u;const x0=l.side*len*u,y0=len*.62*u*u+len*.08*u;return[p0[0]+x0*Math.cos(ang)-y0*Math.sin(ang),p0[1]+x0*Math.sin(ang)+y0*Math.cos(ang)];};
    const pts=[...Array(13)].map((_,j)=>pt(j/12));
    for(let j=0;j<12;j++)line(c,[pts[j],pts[j+1]],ROOT2,mix(5,2,j/12));
    for(let j=3;j<12;j++){const q=pts[j],r=pts[j+1],dx=r[0]-q[0],dy=r[1]-q[1],n=Math.hypot(dx,dy)||1,nx=-dy/n,ny=dx/n,s=(j%2?1:-1),hl=8+3*Math.sin(t*1.7+j+i);
      line(c,[q,[q[0]+nx*s*hl+dx/n*2,q[1]+ny*s*hl+dy/n*2]],HAIR,1.8);}
  });
  // root hairs on the lower main root
  for(let j=10;j<19;j++){const q=mainPt(j/20*g+0.001),s=j%2?1:-1,hl=8+3*Math.sin(t*1.5+j);line(c,[q,[q[0]+s*hl,q[1]+3]],HAIR,1.8);}
  c.restore();
}

// ── step 2: the close-up on the cross-walls ────────────────────────────────
function zoom(c,L,tau,t,a){
  if(a<=.004)return null;
  const src=at(L,ZC),sr=ZS*L.sc,zu=ease((tau-.6)/1.1),zx=mix(src[0],ZX,zu),zy=mix(src[1],ZY,zu),R=mix(sr,ZR,zu),k=R/ZS;
  c.save();c.globalAlpha*=a;
  // source ring on the picture and the dashed lines to the close-up
  circle(c,src[0],src[1],sr,null,rgba(C.white,.9),3);
  c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*10;
  const ang=Math.atan2(zy-src[1],zx-src[0]);
  for(const d of [-1,1]){const q=ang+d*Math.PI/2;line(c,[[src[0]+sr*Math.cos(q),src[1]+sr*Math.sin(q)],[zx+R*Math.cos(q),zy+R*Math.sin(q)]],rgba(C.white,.6),2);}
  c.restore();
  circle(c,zx,zy,R,C.panel,null);
  c.save();c.beginPath();c.arc(zx,zy,R,0,TAU);c.clip();
  drawIn(c,PIC,{x:zx-R,y:zy-R,w:2*R,h:2*R},{crop:[(ZC[0]-ZS)/PW,(ZC[1]-ZS)/PH,2*ZS/PW,2*ZS/PH]});
  c.restore();
  circle(c,zx,zy,R,null,rgba(C.white,.9),3);
  // cross-walls: pulsing rings
  const ra=fade(tau,1.6,.5);
  const pts=SEPTA.map(p=>[zx+(p[0]-ZC[0])*k,zy+(p[1]-ZC[1])*k]);
  if(ra>0)pts.forEach((p,i)=>{const u=mod(t*.7+i*.33);c.save();c.globalAlpha*=ra;circle(c,p[0],p[1],15,null,C.yellow,3);circle(c,p[0],p[1],15+u*12,null,rgba(C.yellow,.8*(1-u)),2);c.restore();});
  c.restore();
  return{pts,ra};
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u}=track(s,'_hL',k,t,1.0),out=held?1:1-fade(tau,PER-.5,.5);
  const only=(j,d=0)=>k===j?fade(tau,d,.5)*out:(from===j?1-u:0);
  const first=k===0&&from===0;

  // the picture (steps 1–3 large, step 4 small on the left), breathing very slightly
  const a0=LAY[from],a1=LAY[k],br=Math.sin(t*.9)*.004;
  const L={x:mix(a0[0],a1[0],u),y:mix(a0[1],a1[1],u),sc:mix(a0[2],a1[2],u)*(1+br)};
  L.x-=PW*L.sc*br/2;L.y-=PH*L.sc*br/2;
  const pa=first?fade(tau,0,.9):1;
  drawIn(c,PIC,{x:L.x,y:L.y,w:PW*L.sc,h:PH*L.sc},{alpha:pa});

  // step 1: one whole hypha, highlighted, with light flowing along it
  const h1=only(0,.9);
  if(h1>0){
    const pts=HYPHA.map(p=>at(L,p));
    c.save();c.globalAlpha*=h1;c.lineCap='round';c.lineJoin='round';
    c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=rgba(C.yellow,.32);c.lineWidth=15;c.stroke();
    c.strokeStyle=rgba(C.yellow,.9);c.lineWidth=2;c.setLineDash([2,8]);c.lineDashOffset=-t*14;c.stroke();c.setLineDash([]);
    for(let j=0;j<3;j++){const q=along(pts,mod(t*.09+j/3));glow(c,q[0],q[1],13,C.yellow,.8);circle(c,q[0],q[1],3.2,'#fff7c2',null);}
    c.restore();
    const la=h1*(k===0?fade(tau,1.6,.5):1);
    tag(c,T.tube,530,92,{col:C.yellow,align:'left',maxW:390,size:26,a:la,tgts:[at(L,[850,228])]});
    tag(c,T.thin,530,150,{col:C.white,align:'left',maxW:390,a:h1*(k===0?fade(tau,2.4,.5):1)});
  }

  // AI note (steps 1, 2)
  const an=Math.max(only(0,1),only(1));
  if(an>0){c.save();c.globalAlpha*=an;text(c,T.ai,20,574,22,C.muted,'left');c.restore();}

  // step 2: branches, close-up on cross-walls, the whole mycelium
  const h2=only(1);
  if(h2>0){
    const ztau=k===1?tau:9;
    // the whole net, outlined
    const nx=L.x+PW*L.sc/2,ny=L.y+PH*L.sc/2,erx=PW*L.sc/2+8,ery=PH*L.sc/2+6;
    const na=h2*(k===1?fade(tau,3.4,.6):1);
    if(na>0){c.save();c.globalAlpha*=na;c.setLineDash([10,8]);c.lineDashOffset=-t*8;ellipse(c,nx,ny,erx,ery,null,rgba(C.yellow,.75),2.5);c.restore();
      const q=[nx+erx*Math.cos(.62),ny+ery*Math.sin(.62)];
      tag(c,T.net,536,452,{col:C.yellow,align:'left',size:26,a:na,tgts:[q]});}
    // branches
    const ba=h2*(k===1?fade(tau,.2,.5):1),fp=FORKS.map(p=>at(L,p));
    if(ba>0){c.save();c.globalAlpha*=ba;fp.forEach((p,i)=>{circle(c,p[0],p[1],13+Math.sin(t*2+i)*1.5,null,C.yellow,3);});c.restore();
      tag(c,T.branch,508,338,{col:C.yellow,align:'left',maxW:100,size:24,a:ba,dot:false,tgts:fp.map(p=>[p[0]+13,p[1]])});}
    const z=zoom(c,L,ztau,t,h2);
    if(z&&z.ra>0){
      tag(c,T.wall,ZX,40,{col:C.yellow,size:26,a:h2*z.ra,dot:false,tgts:z.pts.map(p=>[p[0],p[1]-15])});
      tag(c,T.close,ZX,ZY+ZR+10,{col:C.muted,a:h2*z.ra});
    }
  }

  // step 3: growing tips (dashed extension in front, a small dashed branch behind the new tip)
  const h3=only(2);
  if(h3>0){
    const g=k===2?mod(Math.max(0,tau-.8),4.2)/4.2:.75;           // one growth cycle
    const gu=smooth(g/.72),ga=1-smooth((g-.88)/.12);
    const tipPts=[];
    TIPS.forEach((tp,i)=>{
      const p=at(L,tp.p),[dx,dy]=tp.d,len=tp.len*gu,e=[p[0]+dx*len,p[1]+dy*len];tipPts.push(p);
      c.save();c.globalAlpha*=h3;
      glow(c,p[0],p[1],22,C.yellow,.45+.2*Math.sin(t*3+i));circle(c,p[0],p[1],9,null,C.yellow,3);
      c.globalAlpha*=ga;
      if(len>4){dashed(c,[p,e],rgba(C.white,.8),6,[8,7],-t*12);arrow(c,e[0]-dx*2,e[1]-dy*2,e[0]+dx*16,e[1]+dy*16,C.yellow,3.5);}
      // the small branch behind the new tip
      const bu=smooth((g-.35)/.4);
      if(bu>0){const b0=[p[0]+dx*tp.len*.42,p[1]+dy*tp.len*.42],an=Math.atan2(dy,dx)+tp.side*.75,bl=24*bu;
        dashed(c,[b0,[b0[0]+Math.cos(an)*bl,b0[1]+Math.sin(an)*bl]],rgba(C.white,.8),5,[6,6],-t*12);}
      c.restore();
    });
    const la=h3*(k===2?fade(tau,.5,.5):1);
    tag(c,T.tip,TIPLAB[0],TIPLAB[1],{col:C.yellow,align:'left',size:26,maxW:240,a:la,dot:false,tgts:tipPts.map((p,i)=>[p[0]-TIPS[i].d[0]*10,p[1]-TIPS[i].d[1]*10])});
    // legend for the dashed line, and the "sketch" note
    const lg=h3*(k===2?fade(tau,1.2,.5):1);
    if(lg>0){c.save();c.globalAlpha*=lg;dashed(c,[[614,440],[664,440]],rgba(C.white,.8),6,[8,7],-t*12);text(c,T.newg,676,448,22,C.white,'left');
      text(c,T.sketch,20,574,22,C.muted,'left');c.restore();}
  }

  // step 4: hyphae vs plant root
  const h4=only(3);
  if(h4>0){
    const rt=k===3?tau:9;
    plantRoot(c,RX,RY,t,h4,ease((rt-.3)/1.6));
    const la=h4*(k===3?fade(tau,1.2,.5):1);
    tag(c,T.hyph,36+PW*.29/2,456,{col:C.white,maxW:300,a:la});
    tag(c,T.root,RX,456,{col:'#e0b07a',maxW:300,a:la});
    const xa=h4*(k===3?fade(tau,2.0,.4):1),pu=1+.05*Math.sin(t*3);
    cross(c,480,236,40*pu,xa);
    tag(c,T.notRoot,480,300,{col:C.orange,maxW:260,size:26,a:xa});
  }

  // step markers (tap to jump to a step)
  for(let j=0;j<N;j++){const x=786+j*46,y=566;
    if(j===k)marker(c,x,y,j+1,null,14);
    else{circle(c,x,y,14,'rgba(11,26,21,.9)',rgba(C.muted,.8),2);c.save();c.font=MONO(20);c.fillStyle=C.muted;c.textAlign='center';c.textBaseline='middle';c.fillText(String(j+1),x,y+1);c.restore();}
    D.hit(x-23,y-24,46,48,'phase',j);}
}
window.FungiDraw.hyphae=draw;
})();

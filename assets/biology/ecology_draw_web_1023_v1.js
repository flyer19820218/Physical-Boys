/* Ecology lesson 2 · "web" canvas (food-links tab, view 1), 2026-10-23. From one food chain to a food web.
 * Stage: EC17_paddy_scene.jpg (1672x933, not cut out) cropped to cover the canvas and darkened with #11261f at 0.76,
 * so the picture cards and the white arrows stay clear.
 * Layout: five faint row bands, bottom-up = trophic levels (producer, primary, secondary, tertiary, quaternary consumer),
 * the level names in a left column (x 12..148). Every node is a small card (picture + name) at a fixed position (NODES).
 * The sparrow sits between the primary and secondary rows on the right: it is both.
 * Arrows (#f2ecd9) run from the eaten to the eater (= direction of energy flow); each has its own bend (EDGES) so it
 * goes round the cards instead of through them. Yellow dots flowing along an arrow = energy.
 * Pictures (K.SIZE): EC3_rice 590x1096 (three plants as a clump), EC4_grasshopper 788x446, EC4_vole 634x568,
 * EC5_frog 657x581, EC5_mantis 803x760, EC5_sparrow 723x612, EC6_snake 847x559, EC6_eagle 536x874.
 * PIL: all eight are opaque to their edges in alpha (alpha bbox = full image), so they are fitted by their full size.
 * Four steps, 8 s each; s.shown = step. Elements are cumulative; each one has the step it appears in (and, for the
 * step-2 labels, the last step it stays), so moving between steps fades only what changes.
 *  0 one chain: rice, grasshopper, frog, snake appear one after another, each arrow grows, dots flow along the chain.
 *  1 add the sparrow: arrows rice->sparrow "eats seeds: primary consumer" and grasshopper->sparrow "eats insects:
 *    secondary consumer"; the two take turns (3 s each) glowing together with their level name in the left column;
 *    "omnivore" pill on the sparrow; header "one animal, different positions". Older arrows dim.
 *  2 add more: mantis (grasshopper->mantis->frog), field mouse (rice->vole->snake), eagle (snake->eagle) appear in turn.
 *  3 the web: every arrow bright with dots flowing on all of them, "food web" header pill with a glow, caption
 *    "matter and energy pass to the eater" with a sample arrow.
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=8,CW=960,MOVE=1;
const WHITE='#f2ecd9',YELLOW=C.yellow,GREEN=C.green,MUTED=C.muted,DARK='#11261f';

// ── nodes (fixed positions) ────────────────────────────────────────────────
// Rows: top y and height of the card. Row 0 = producer (bottom) .. row 4 = quaternary consumer (top).
const ROWS=[{y:498,h:96},{y:380,h:80},{y:260,h:80},{y:140,h:80},{y:6,h:94}];
const LEVEL=[['producer','生產者','Producer'],['primary','初級消費者','Primary consumer'],['secondary','次級消費者','Secondary consumer'],
  ['tertiary','三級消費者','Tertiary consumer'],['quaternary','四級消費者','Quaternary consumer']];
// x = card centre; row (may be fractional: the sparrow sits between rows 1 and 2); step = the step it appears in; d = delay (s)
const NODES={
  rice:       {x:430,row:0,pic:'EC3_rice.png',step:0,d:0},
  grasshopper:{x:700,row:1,pic:'EC4_grasshopper.png',step:0,d:.5},
  frog:       {x:400,row:2,pic:'EC5_frog.png',step:0,d:1.0},
  snake:      {x:290,row:3,pic:'EC6_snake.png',step:0,d:1.5},
  sparrow:    {x:886,row:1.5,pic:'EC5_sparrow.png',step:1,d:0},
  mantis:     {x:620,row:2,pic:'EC5_mantis.png',step:2,d:0},
  vole:       {x:240,row:1,pic:'EC4_vole.png',step:2,d:.8},
  eagle:      {x:600,row:4,pic:'EC6_eagle.png',step:2,d:1.6}};
const NAMES={rice:['水稻','Rice'],grasshopper:['蚱蜢','Grasshopper'],frog:['澤蛙','Paddy field frog'],snake:['黑眉錦蛇','Black-browed ratsnake'],
  sparrow:['麻雀','Sparrow'],mantis:['螳螂','Mantis'],vole:['田鼷鼠','Field mouse'],eagle:['大冠鷲','Crested serpent eagle']};
const nameOf=id=>L(id,...NAMES[id]);
// Edges a->b (a is eaten by b). bend = sideways offset of the curve's control point (px, + = to the left of a->b).
const EDGES=[
  {a:'rice',b:'grasshopper',bend:-14,step:0,d:.4},
  {a:'grasshopper',b:'frog',bend:18,step:0,d:.9},
  {a:'frog',b:'snake',bend:16,step:0,d:1.4},
  {a:'rice',b:'sparrow',bend:-60,step:1,d:.5,tag:'seeds'},
  {a:'grasshopper',b:'sparrow',bend:22,step:1,d:.9,tag:'insects'},
  {a:'grasshopper',b:'mantis',bend:-10,step:2,d:.3},
  {a:'mantis',b:'frog',bend:-6,step:2,d:.5},
  {a:'rice',b:'vole',bend:22,step:2,d:1.1},
  {a:'vole',b:'snake',bend:-14,step:2,d:1.3},
  {a:'snake',b:'eagle',bend:-24,step:2,d:1.9}];

// composed from LAB pieces
const colon=(a,b)=>P(`${a[0]}：${b[0]}`,`${a[1]}: ${b[1].charAt(0).toLowerCase()+b[1].slice(1)}`);

// ── helpers ────────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
// card rectangle of a node (width follows the name so the longer English names fit)
function rowY(row){const i=Math.floor(row),f=row-i;if(f===0)return ROWS[i];const a=ROWS[i],b=ROWS[i+1];return{y:mix(a.y,b.y,f),h:80};}
function rect(c,id){const n=NODES[id],r=rowY(n.row),w=Math.max(132,measure(c,nameOf(id),22)+22);return{x:n.x-w/2,y:r.y,w,h:r.h,cx:n.x,cy:r.y+r.h/2};}
function card(c,id,t,{glowA=0}={}){
  const r=rect(c,id),n=NODES[id];
  if(glowA>0)withA(c,glowA,()=>glow(c,r.cx,r.cy,Math.max(r.w,r.h)*.7,YELLOW,.22+.06*Math.sin(t*2.4)));
  D.round(c,r.x,r.y,r.w,r.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
  const ph=r.h-32;
  if(id==='rice'){ // a clump of three rice plants
    [[-34,.86],[34,.86],[0,1]].forEach(([dx,s])=>K.place(c,n.pic,r.cx+dx-30,r.y+5+ph*(1-s),60,ph*s));
  }else K.place(c,n.pic,r.cx-62,r.y+5,124,ph);
  text(c,nameOf(id),r.cx,r.y+r.h-9,22,id==='rice'?GREEN:WHITE,'center');
  return r;
}
// where a ray from the card centre towards (tx,ty) leaves the card (plus a gap)
function exitPt(r,tx,ty,gap){const dx=tx-r.cx,dy=ty-r.cy,hw=r.w/2+gap,hh=r.h/2+gap,k=Math.min(hw/Math.abs(dx||1e-6),hh/Math.abs(dy||1e-6));return[r.cx+dx*k,r.cy+dy*k];}
function geom(c,e){
  const A=rect(c,e.a),B=rect(c,e.b),mx=(A.cx+B.cx)/2,my=(A.cy+B.cy)/2,dx=B.cx-A.cx,dy=B.cy-A.cy,l=Math.hypot(dx,dy);
  const q=[mx+dy/l*e.bend,my-dx/l*e.bend],p0=exitPt(A,q[0],q[1],4),p2=exitPt(B,q[0],q[1],7);
  const q2=[(p0[0]+p2[0])/2+dy/l*e.bend,(p0[1]+p2[1])/2-dx/l*e.bend];
  return{p0,q:q2,p2};
}
// a curved arrow drawn up to fraction g (0..1), head at the tip
function curve(c,G,g,col,w){
  if(g<=0.01)return;
  const n=Math.max(2,Math.round(28*g)),pts=[];for(let i=0;i<=n;i++)pts.push(K.bez(G.p0,G.q,G.p2,g*i/n));
  const tip=pts[n],prev=K.bez(G.p0,G.q,G.p2,Math.max(0,g-.06)),a=Math.atan2(tip[1]-prev[1],tip[0]-prev[0]),len=Math.hypot(G.p2[0]-G.p0[0],G.p2[1]-G.p0[1]),hl=Math.max(10,Math.min(15,len*.32)),hw=hl*.6;
  // stop the shaft under the head
  const shaft=pts.filter(p=>Math.hypot(p[0]-tip[0],p[1]-tip[1])>hl*.7);if(shaft.length<2)shaft.push([tip[0]-hl*.7*Math.cos(a),tip[1]-hl*.7*Math.sin(a)]);
  K.sline(c,[...shaft,[tip[0]-hl*.7*Math.cos(a),tip[1]-hl*.7*Math.sin(a)]],col,w);
  c.save();c.beginPath();c.moveTo(tip[0],tip[1]);c.lineTo(tip[0]-hl*Math.cos(a)+hw*Math.sin(a),tip[1]-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(tip[0]-hl*Math.cos(a)-hw*Math.sin(a),tip[1]-hl*Math.sin(a)+hw*Math.cos(a));c.closePath();c.fillStyle=col;c.fill();c.restore();
}
// yellow energy dots flowing from the eaten to the eater
// dots move at about px pixels a second; short arrows get one small dot so the white shaft stays visible
function flow(c,G,t,a,px=70){const len=Math.hypot(G.p2[0]-G.p0[0],G.p2[1]-G.p0[1]),n=Math.max(1,Math.round(len/110)),speed=Math.min(.9,px/len),gr=Math.min(13,4+len/9),r=len<70?3.5:4.5;
  for(let q=0;q<n;q++){const u=mod(t*speed+q/n),p=K.bez(G.p0,G.q,G.p2,u*.9);withA(c,a*Math.sin(u*Math.PI),()=>{glow(c,p[0],p[1],gr,YELLOW,.7);circle(c,p[0],p[1],r,'#fff7c2',null);});}}

// ── background ─────────────────────────────────────────────────────────────
// cover-crop: canvas 1.6:1, picture 1672x933 -> keep the full height, a centred 0.893 of the width
function stageBg(c,t){
  const [W,H]=K.SIZE['EC17_paddy_scene.jpg'],fw=(H*CW/600)/W,drift=.012*Math.sin(t*.12);
  K.drawIn(c,'EC17_paddy_scene.jpg',{x:0,y:0,w:CW,h:600},{crop:[(1-fw)/2+drift,0,fw,1]});
  c.save();c.fillStyle=rgba(DARK,.76);c.fillRect(0,0,CW,600);c.restore();
}
function bands(c,hi,t){
  ROWS.forEach((r,i)=>{
    D.round(c,6,r.y-5,CW-12,r.h+10,12,i%2?'rgba(242,236,217,.035)':'rgba(242,236,217,.06)',null);
    const on=hi[i]||0,lab=L(...LEVEL[i]),col=i===0?GREEN:WHITE;
    const rows=K.splitLines(c,K.D.tr(lab),128,22),lh=26,y0=r.y+r.h/2-(rows.length*lh)/2+19;
    if(on>0)withA(c,on,()=>{const pu=.5+.5*Math.sin(t*3);D.round(c,8,r.y-2,144,r.h+4,10,rgba(YELLOW,.12+.06*pu),rgba(YELLOW,.7+.3*pu));});
    K.wrap(c,lab,14,y0,128,22,on>.5?YELLOW:rgba(col,.92),lh);
  });
}

// ── frame ──────────────────────────────────────────────────────────────────
// alpha of an element that appears in step s0 (after delay d) and stays up to step s1, seen at step k, tau s into it
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.web||(s.web={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  // element alpha: new step's timing, but anything leaving fades out over MOVE
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d,s1);if(!moving)return now;const was=vis(st.from,9,s0,0,s1);return now>=was?now:mix(was,now,u);};
  // step-1 sparrow highlight: seeds (primary) and insects (secondary) take turns, 3 s each
  const sw=.5+.5*Math.sin(t*Math.PI/3),seedOn=smooth(clamp(sw*2.2-.6)),insOn=smooth(clamp((1-sw)*2.2-.6));
  const s1a=A(1,.3,1);

  stageBg(c,t);
  bands(c,{1:s1a*seedOn,2:s1a*insOn},t);

  // arrows (under the cards)
  const all=A(3,0);
  EDGES.forEach(e=>{
    const a=A(e.step,e.d);if(a<=0)return;
    const G=geom(c,e),g=k===e.step?clamp((tau-e.d)/.8):1,grow=moving&&vis(st.from,9,e.step,0)>0?1:ease(g);
    const fresh=k===e.step,hl=e.tag?(e.tag==='seeds'?seedOn:insOn)*s1a:0;
    const dim=k===3?1:fresh?.95:(k===1||k===2)?.5:.95;
    const al=a*mix(dim,1,Math.max(all,hl));
    withA(c,al,()=>curve(c,G,grow,WHITE,3.5+1.5*hl+.5*all));
    if(hl>0)withA(c,hl*a*.35,()=>curve(c,G,grow,YELLOW,9));
    // flowing energy dots: the current step's new arrows; every arrow in the web step
    const fl=k===3?all:fresh?(e.tag?.35+.65*hl:1)*clamp((tau-e.d-.8)/.5):0;
    if(fl>0)flow(c,G,t+e.d*1.7,a*fl,k===3?80:65);
  });

  // cards
  Object.keys(NODES).forEach(id=>{const n=NODES[id],a=A(n.step,n.d);if(a<=0)return;
    const fresh=k===n.step&&tau-n.d<3.5,ga=k===3?.5:fresh?clamp(1-(tau-n.d-2)/1.5):0;
    withA(c,a,()=>card(c,id,t,{glowA:ga}));});

  // sparrow: omnivore pill (from step 1 on), step-1 labels
  withA(c,A(1,.2),()=>{const r=rect(c,'sparrow');const p=tag(c,L('omnivore','雜食','Omnivore'),r.cx,r.y-46,{al:'center',col:YELLOW,active:k===1});if(k===1)withA(c,s1a,()=>pulseRing(c,p,t));});
  withA(c,s1a,()=>{
    const seeds=colon(L('eatsSeeds','吃種子','Eats seeds'),L('primary','初級消費者','Primary consumer'));
    const ins=colon(L('eatsInsects','吃昆蟲','Eats insects'),L('secondary','次級消費者','Secondary consumer'));
    const p1=tag(c,seeds,CW-12,520,{al:'right',col:WHITE,active:seedOn>.5,fill:'rgba(11,26,21,.92)'});
    const p2=tag(c,ins,CW-12,212,{al:'right',col:WHITE,active:insOn>.5});
    if(seedOn>.5)pulseRing(c,p1,t,YELLOW);if(insOn>.5)pulseRing(c,p2,t,YELLOW);
  });
  // top-right headers share one spot: each waits until the previous one has faded out (MOVE)
  withA(c,A(1,MOVE,1),()=>tag(c,L('sameEater','同一種動物，不同位置','One animal, different positions'),CW-12,12,{al:'right',col:YELLOW}));

  // headers: "food chain" in step 0, "food web" in step 3
  withA(c,A(0,MOVE,0),()=>tag(c,L('foodChain','食物鏈','Food chain'),CW-12,12,{al:'right',col:WHITE,active:true,size:26}));
  withA(c,A(3,.2),()=>{
    const p=tag(c,L('foodWeb','食物網','Food web'),CW-12,12,{al:'right',col:YELLOW,active:true,size:30});
    glow(c,p.x+p.w/2,p.y+p.h/2,p.w*.8,YELLOW,.14+.07*Math.sin(t*2.2));pulseRing(c,p,t);
    // caption with a sample arrow and a flowing dot: what the arrow and the dots mean
    // (placed right of the eagle card, above the snake row's free right side)
    const cap=L('matterEnergy','物質與能量傳向取食者','Matter and energy pass to the eater'),cw=232,x0=CW-12-cw;
    const G={p0:[CW-96,88],q:[CW-54,88],p2:[CW-12,88]};curve(c,G,1,WHITE,3.5);flow(c,G,t,1,45);
    K.wrap(c,cap,x0,124,cw,22,WHITE,27);
  });

  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.web=draw;
})();

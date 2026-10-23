/* Ecology lesson 2 · "remove" canvas (food-links tab, view 2), 2026-10-23. Take one species out of the paddy food web.
 * Same stage as "web" (ecology_draw_web_1023_v1.js): EC17_paddy_scene.jpg darkened, five row bands with the level names on the
 * left, the cards at the SAME positions and sizes as "web" so the web looks unchanged when students switch views.
 * Only the six nodes of K.WEB (rice, grasshopper, field mouse, frog, snake, eagle) and the six edges of K.WEB.edges.
 * Option s.rm 0..3 = rice, grasshopper, frog, snake; effects come from K.RM[s.rm] (direction only, never numbers).
 * Three steps, 9 s each; s.shown = step.
 *  0 the web: white arrows, yellow energy dots flowing on every arrow; "food web" pill top right.
 *  1 removed: the chosen card fades, a pink cross is drawn over it, "removed" pill; its arrows turn into faint dashes.
 *  2 knock-on: a cyan pulse runs along the arrow from the removed species to each DIRECT node (0.3 s), which gets a coloured
 *    outline and a badge pill [1][arrow][word]; about 2 s later the same happens for the LATER nodes (second wave starts from a
 *    direct node; nodes reached only through another later node come 0.8 s after that). Legend pills "1 direct effect",
 *    "2 knock-on effect" on the right appear with their wave.
 *    up = green outline + green up arrow + "increases"; down = orange outline + orange down arrow + "decreases";
 *    buffer = yellow dashed outline + yellow shield + "has other food, smaller effect".
 * Fixed notes: "direction only, not numbers" (bottom right, every step) and the AI note.
 * Switching s.rm redraws at once from the new option (no cross-fade from the previous option).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=3,PER=9,CW=960,MOVE=1;
const WHITE='#f2ecd9',YELLOW=C.yellow,GREEN=C.green,ORANGE=C.orange,PINK=C.pink,CYAN=C.cyan,MUTED=C.muted,DARK='#11261f';
const T_DIRECT=.3,T_LATER=2.4,T_HOP=.8,TRAVEL=.7;

// ── nodes: copied from ecology_draw_web_1023_v1.js (same positions / sizes) ──
const ROWS=[{y:498,h:96},{y:380,h:80},{y:260,h:80},{y:140,h:80},{y:6,h:94}];
const LEVEL=[['producer','生產者','Producer'],['primary','初級消費者','Primary consumer'],['secondary','次級消費者','Secondary consumer'],
  ['tertiary','三級消費者','Tertiary consumer'],['quaternary','四級消費者','Quaternary consumer']];
const NODES={
  rice:       {x:430,row:0,pic:'EC3_rice.png'},
  grasshopper:{x:700,row:1,pic:'EC4_grasshopper.png'},
  frog:       {x:400,row:2,pic:'EC5_frog.png'},
  snake:      {x:290,row:3,pic:'EC6_snake.png'},
  vole:       {x:240,row:1,pic:'EC4_vole.png'},
  eagle:      {x:600,row:4,pic:'EC6_eagle.png'}};
const NAMES={rice:['水稻','Rice'],grasshopper:['蚱蜢','Grasshopper'],frog:['澤蛙','Paddy field frog'],snake:['黑眉錦蛇','Black-browed ratsnake'],
  vole:['田鼷鼠','Field mouse'],eagle:['大冠鷲','Crested serpent eagle']};
const nameOf=id=>L(id,...NAMES[id]);
// same bends as "web"
const BEND={'rice>grasshopper':-14,'grasshopper>frog':18,'frog>snake':16,'rice>vole':22,'vole>snake':-14,'snake>eagle':-24};
const EDGES=((K.WEB&&K.WEB.edges)||[['rice','grasshopper'],['rice','vole'],['grasshopper','frog'],['frog','snake'],['vole','snake'],['snake','eagle']])
  .map(([a,b])=>({a,b,bend:BEND[a+'>'+b]||0}));
const RMDATA=()=>K.RM||[];
const RM_IDS=['rice','grasshopper','frog','snake'];
// where each node's effect badge goes: side of the card ('l' left, 'r' right: dy = pill top below the card top; 'b' just below the card: dx from its left edge)
const BADGE={rice:{side:'l',dy:42},grasshopper:{side:'b',dx:24},vole:{side:'r',dy:20},frog:{side:'r',dy:20},snake:{side:'r',dy:28},eagle:{side:'r',dy:27}};
const EFF={up:{col:GREEN,lab:()=>L('moreAfter','變多','Increases')},down:{col:ORANGE,lab:()=>L('lessAfter','變少','Decreases')},
  buffer:{col:YELLOW,lab:()=>L('bufferAfter','有別的食物，影響較小','Has other food, smaller effect')}};

// ── helpers (as in "web") ──────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function rowY(row){return ROWS[row];}
function rect(c,id){const n=NODES[id],r=rowY(n.row),w=Math.max(132,measure(c,nameOf(id),22)+22);return{x:n.x-w/2,y:r.y,w,h:r.h,cx:n.x,cy:r.y+r.h/2};}
function card(c,id,{noName=false}={}){
  const r=rect(c,id),n=NODES[id];
  D.round(c,r.x,r.y,r.w,r.h,12,'rgba(28,61,52,.94)',rgba(WHITE,.4));
  const ph=r.h-32;
  if(id==='rice'){[[-34,.86],[34,.86],[0,1]].forEach(([dx,s])=>K.place(c,n.pic,r.cx+dx-30,r.y+5+ph*(1-s),60,ph*s));}
  else K.place(c,n.pic,r.cx-62,r.y+5,124,ph);
  if(!noName)text(c,nameOf(id),r.cx,r.y+r.h-9,22,id==='rice'?GREEN:WHITE,'center');
  return r;
}
function exitPt(r,tx,ty,gap){const dx=tx-r.cx,dy=ty-r.cy,hw=r.w/2+gap,hh=r.h/2+gap,k=Math.min(hw/Math.abs(dx||1e-6),hh/Math.abs(dy||1e-6));return[r.cx+dx*k,r.cy+dy*k];}
function geom(c,e){
  const A=rect(c,e.a),B=rect(c,e.b),mx=(A.cx+B.cx)/2,my=(A.cy+B.cy)/2,dx=B.cx-A.cx,dy=B.cy-A.cy,l=Math.hypot(dx,dy);
  const q=[mx+dy/l*e.bend,my-dx/l*e.bend],p0=exitPt(A,q[0],q[1],4),p2=exitPt(B,q[0],q[1],7);
  const q2=[(p0[0]+p2[0])/2+dy/l*e.bend,(p0[1]+p2[1])/2-dx/l*e.bend];
  return{p0,q:q2,p2};
}
function curve(c,G,g,col,w,dash=null){
  if(g<=0.01)return;
  const n=Math.max(2,Math.round(28*g)),pts=[];for(let i=0;i<=n;i++)pts.push(K.bez(G.p0,G.q,G.p2,g*i/n));
  const tip=pts[n],prev=K.bez(G.p0,G.q,G.p2,Math.max(0,g-.06)),a=Math.atan2(tip[1]-prev[1],tip[0]-prev[0]),len=Math.hypot(G.p2[0]-G.p0[0],G.p2[1]-G.p0[1]),hl=Math.max(10,Math.min(15,len*.32)),hw=hl*.6;
  const shaft=pts.filter(p=>Math.hypot(p[0]-tip[0],p[1]-tip[1])>hl*.7);if(shaft.length<2)shaft.push([tip[0]-hl*.7*Math.cos(a),tip[1]-hl*.7*Math.sin(a)]);
  c.save();if(dash)c.setLineDash(dash);K.sline(c,[...shaft,[tip[0]-hl*.7*Math.cos(a),tip[1]-hl*.7*Math.sin(a)]],col,w);c.restore();
  c.save();c.beginPath();c.moveTo(tip[0],tip[1]);c.lineTo(tip[0]-hl*Math.cos(a)+hw*Math.sin(a),tip[1]-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(tip[0]-hl*Math.cos(a)-hw*Math.sin(a),tip[1]-hl*Math.sin(a)+hw*Math.cos(a));c.closePath();c.fillStyle=col;c.fill();c.restore();
}
function flow(c,G,t,a,px=70){const len=Math.hypot(G.p2[0]-G.p0[0],G.p2[1]-G.p0[1]),n=Math.max(1,Math.round(len/110)),speed=Math.min(.9,px/len),gr=Math.min(13,4+len/9),r=len<70?3.5:4.5;
  for(let q=0;q<n;q++){const u=mod(t*speed+q/n),p=K.bez(G.p0,G.q,G.p2,u*.9);withA(c,a*Math.sin(u*Math.PI),()=>{glow(c,p[0],p[1],gr,YELLOW,.7);circle(c,p[0],p[1],r,'#fff7c2',null);});}}
function stageBg(c,t){
  const [W,H]=K.SIZE['EC17_paddy_scene.jpg'],fw=(H*CW/600)/W,drift=.012*Math.sin(t*.12);
  K.drawIn(c,'EC17_paddy_scene.jpg',{x:0,y:0,w:CW,h:600},{crop:[(1-fw)/2+drift,0,fw,1]});
  c.save();c.fillStyle=rgba(DARK,.76);c.fillRect(0,0,CW,600);c.restore();
}
function bands(c){
  ROWS.forEach((r,i)=>{
    D.round(c,6,r.y-5,CW-12,r.h+10,12,i%2?'rgba(242,236,217,.035)':'rgba(242,236,217,.06)',null);
    const lab=L(...LEVEL[i]),col=i===0?GREEN:WHITE;
    const rows=K.splitLines(c,K.D.tr(lab),128,22),lh=26,y0=r.y+r.h/2-(rows.length*lh)/2+19;
    K.wrap(c,lab,14,y0,128,22,rgba(col,.92),lh);
  });
}

// ── effect glyphs ──────────────────────────────────────────────────────────
function upDown(c,x,y,dir,col,t){ // arrow centred at (x,y), 24 px tall, bobbing in its own direction
  const s=dir==='up'?-1:1,o=s*2.5*(.5+.5*Math.sin(t*4)),y0=y-s*11+o,y1=y+s*12+o;
  K.sline(c,[[x,y0],[x,y1-s*6]],col,4);
  c.beginPath();c.moveTo(x,y1);c.lineTo(x-8,y1-s*10);c.lineTo(x+8,y1-s*10);c.closePath();c.fillStyle=col;c.fill();
}
function shield(c,x,y,col,t){
  const k=1+.05*Math.sin(t*3);c.save();c.translate(x,y);c.scale(k,k);
  c.beginPath();c.moveTo(0,-13);c.lineTo(11,-8);c.lineTo(10,3);c.quadraticCurveTo(7,10,0,14);c.quadraticCurveTo(-7,10,-10,3);c.lineTo(-11,-8);c.closePath();
  c.fillStyle=rgba(col,.3);c.fill();c.strokeStyle=col;c.lineWidth=3;c.lineJoin='round';c.stroke();
  c.beginPath();c.moveTo(-4,0);c.lineTo(-1,4);c.lineTo(5,-4);c.strokeStyle=col;c.lineWidth=2.5;c.stroke();c.restore();
}
// numbered disc (1 = direct, 2 = knock-on); digit at 22 px
function num(c,x,y,n,col=CYAN){circle(c,x,y,14,col,null);c.save();c.font=K.MONO(22);c.fillStyle=C.deep;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// badge pill [n][glyph][word]; anchored at x on side ('l' = right edge at x, 'r' = left edge at x)
function badge(c,eff,n,x,y,side,t){
  const E=EFF[eff],lab=E.lab(),tw=measure(c,lab,22),w=tw+28+60,h=40,bx=Math.max(156,Math.min(CW-12-w,side==='l'?x-w:x));
  D.round(c,bx,y,w,h,h/2,'rgba(11,26,21,.94)',E.col);
  num(c,bx+20,y+h/2,n);
  if(eff==='buffer')shield(c,bx+48,y+h/2,E.col,t);else upDown(c,bx+48,y+h/2,eff,E.col,t);
  text(c,lab,bx+62+tw/2+2,y+h/2+22*.36,22,E.col,'center');
  return{x:bx,y,w,h};
}
function outline(c,r,eff,t){
  const col=EFF[eff].col;withA(c,.5,()=>glow(c,r.cx,r.cy,Math.max(r.w,r.h)*.75,col,.18+.08*Math.sin(t*2.6)));
  c.save();c.beginPath();c.roundRect(r.x-3,r.y-3,r.w+6,r.h+6,14);c.strokeStyle=col;c.lineWidth=4.5;
  if(eff==='buffer'){c.setLineDash([10,7]);c.lineDashOffset=-t*14;}c.stroke();c.restore();
}

// ── effect plan for one option: when each affected node lights up, and along which edge the pulse travels ─
const adj=(a,b)=>EDGES.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a));
function plan(rm){
  const R=RMDATA()[rm]||{id:RM_IDS[rm],direct:{},later:{}},gone=R.id,items=[];
  Object.entries(R.direct||{}).forEach(([id,eff])=>items.push({id,eff,n:1,from:gone,t0:T_DIRECT}));
  const lat=Object.entries(R.later||{}),placed=new Set(items.map(i=>i.id));let hop=0,left=lat.slice();
  while(left.length&&hop<5){const now=[];
    left.forEach(([id,eff])=>{const src=[...placed].find(p=>adj(p,id));if(src)now.push({id,eff,n:2,from:src,t0:T_LATER+hop*T_HOP});});
    if(!now.length){left.forEach(([id,eff])=>now.push({id,eff,n:2,from:null,t0:T_LATER+hop*T_HOP}));}
    now.forEach(i=>{items.push(i);placed.add(i.id);});left=left.filter(([id])=>!placed.has(id));hop++;}
  return{gone,items};
}

// ── frame ──────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.7);
function draw(c,s,t){
  const {k,tau}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const rm=Math.max(0,Math.min(3,s.rm|0)),st=s.rmv||(s.rmv={});
  if(st.k===undefined||st.rm!==rm){st.k=k;st.rm=rm;st.from=-1;st.T=t-9;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  // tau = seconds since the step began (s.start resets on every step / option change)
  const x=clamp((t-st.T)/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d,s1);if(!moving)return now;const was=vis(st.from,9,s0,0,s1);return now>=was?now:mix(was,now,u);};
  const {gone,items}=plan(rm);
  const rA=A(1,.2);                        // removal (steps 1-2)

  stageBg(c,t);
  bands(c);

  // arrows
  EDGES.forEach(e=>{
    const G=geom(c,e),cut=(e.a===gone||e.b===gone)?rA:0;
    withA(c,1-cut,()=>curve(c,G,1,WHITE,3.5));
    if(cut>0)withA(c,cut*.45,()=>curve(c,G,1,WHITE,2.5,[6,8]));
    withA(c,(1-cut)*(k===0?1:.55),()=>flow(c,G,t+(e.a.length+e.b.length)*.37,1,k===0?80:55));
  });
  // step 2: pulses travelling from the source to each affected node, then the arrow glows in the effect colour
  const wA=A(2,0,2);
  items.forEach(it=>{if(!it.from)return;const e=adj(it.from,it.id);if(!e)return;const G=geom(c,e),rev=e.a!==it.from,g=clamp((tau-it.t0)/TRAVEL),col=EFF[it.eff].col;
    withA(c,wA*clamp((tau-it.t0)/.2),()=>{
      if(g<1){const p=K.bez(G.p0,G.q,G.p2,rev?1-g:g);glow(c,p[0],p[1],18,CYAN,.9);circle(c,p[0],p[1],6,'#e8fdff',null);}
      else withA(c,.35+.15*Math.sin(t*3),()=>curve(c,G,1,col,8));});});

  // cards
  Object.keys(NODES).forEach(id=>{
    const r=rect(c,id);
    if(id===gone){withA(c,1-.68*rA,()=>card(c,id,{noName:rA>0}));withA(c,rA>0?mix(1,.75,rA):0,()=>text(c,nameOf(id),r.cx,r.y+r.h-9,22,id==='rice'?GREEN:WHITE,'center'));return;}
    card(c,id);
  });
  // effects on the cards
  items.forEach(it=>{if(!NODES[it.id])return;const a=wA*clamp((tau-it.t0-TRAVEL+.1)/.5);if(a<=0)return;
    const r=rect(c,it.id),B=BADGE[it.id];
    withA(c,a,()=>{outline(c,r,it.eff,t);if(B.side==='b')badge(c,it.eff,it.n,r.x+B.dx,r.y+r.h+4,'r',t);else badge(c,it.eff,it.n,B.side==='l'?r.x-8:r.x+r.w+8,r.y+B.dy,B.side,t);});});

  // removed: pink cross + pill
  withA(c,rA,()=>{const r0=rect(c,gone),r={x:r0.x,y:r0.y,w:r0.w,h:r0.h-30,cx:r0.cx,cy:r0.cy},g=k===1?clamp((tau-.3)/.6):1,m=6;
    const d1=[[r.x+m,r.y+m],[mix(r.x+m,r.x+r.w-m,g),mix(r.y+m,r.y+r.h-m,g)]],d2=[[r.x+r.w-m,r.y+m],[mix(r.x+r.w-m,r.x+m,clamp(g*2-1)),mix(r.y+m,r.y+r.h-m,clamp(g*2-1))]];
    K.sline(c,d1,PINK,7);if(g>.5)K.sline(c,d2,PINK,7);
    const p=tag(c,L('removed','被移走','Removed'),r.cx,r.y+r.h/2-20,{al:'center',col:PINK,active:true});pulseRing(c,p,t,PINK);});

  // headers
  withA(c,A(0,.2,0),()=>{const p=tag(c,L('foodWeb','食物網','Food web'),CW-12,12,{al:'right',col:YELLOW,active:true,size:30});
    glow(c,p.x+p.w/2,p.y+p.h/2,p.w*.8,YELLOW,.14+.07*Math.sin(t*2.2));pulseRing(c,p,t);});
  // legend for the two waves (right column, between the snake and frog rows)
  [[1,L('directEffect','直接影響','Direct effect'),T_DIRECT+TRAVEL-.1,236],[2,L('laterEffect','接著影響','Knock-on effect'),T_LATER+TRAVEL-.1,284]].forEach(([n,lab,t0,y])=>{
    const has=items.some(i=>i.n===n);if(!has)return;
    withA(c,wA*clamp((tau-t0)/.5),()=>{const tw=measure(c,lab,22),w=tw+28+34,bx=CW-12-w,fresh=tau-t0<3;
      D.round(c,bx,y,w,40,20,'rgba(11,26,21,.94)',rgba(CYAN,.9));num(c,bx+20,y+20,n);text(c,lab,bx+40+tw/2+4,y+20+22*.36,22,CYAN,'center');
      if(fresh)pulseRing(c,{x:bx,y,w,h:40},t,CYAN);});});

  // fixed notes
  tag(c,L('dirOnly','只示意方向，不是數字','Direction only, not numbers'),CW-12,522,{al:'right',col:WHITE});
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EcologyDraw.remove=draw;
})();

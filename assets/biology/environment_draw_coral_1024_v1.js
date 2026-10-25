/* Unit 11 lesson 2 · "coral" canvas (climate-ecological-change tab, view 2), 2026-10-25. Why corals turn white (plan section 3, coral).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (tentacles sway, algae jiggle, water specks
 * drift, a light sweep crosses the pictures, dashes march, arrows pulse). No options.
 * Pictures: environment_ai_1024/TH14a_coral_healthy.jpg and TH14b_coral_bleached.jpg (1024x572; TH14b is TH14a recoloured by program,
 * same composition), so the colony picture A is one rectangle that cross-fades TH14a -> TH14b.
 * Layout: left = stage (x 16..636), right = step card (x 652..944, y 16..566) as chain / shift. The colony picture A moves between
 * three layouts (eased over 1 s on every step change):
 *  steps 0-1: A small (300 x 168, top left) = "where"; a dashed frame on one branch (picture px [492,196,56,46], chosen with PIL on the
 *    central branch) is joined by dashed lines to the big ZOOM panel (620 x 370) drawn in code = "what": two coral polyps on a strip
 *    of skeleton, tissue tinted tan by green algae dots. Right of A: step 0 the mutualism mini diagram, step 1 the orange stress box.
 *  0 coral is an animal: polyp label (animal), algae label; arrows algae -> polyp "supply nutrients", polyp -> algae "give shelter".
 *  1 stress: orange heat waves come down into the zoom; half of the algae dots leave through the mouths and drift away, the rest fade
 *    (pigment); the tissue turns pale and the white skeleton shows through. Labels "Algae leave", "Pigment fades".
 *  2 bleaching: A grows to the full stage width (620 x 347) and TH14b fades in over TH14a; under it cause -> effect boxes.
 *  3 not death: A shrinks to the left (bleached); a white arrow to a second picture R that fades bleached -> colour with the caption
 *    "If the stress ends, the algae may return"; an orange arrow to a white dashed box "If the stress continues, death may follow";
 *    bottom box "It depends on stress and recovery conditions".
 * Colours (plan 1.4): stress = orange #fb923c (arrows, box, heat waves); uncertain / possible = white dashed box; algae = green dots
 * (#86d36b, named in the legend; not the chalk green of the unit's count bars). No temperatures, years, statistics or species results.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1;
const WHITE=C.white,MUTED=C.muted,ORANGE=K.COL.pressure,INK=C.ink;
const ALG='#86d36b',ALG_D='#2f5a22',TAN='#c98f4e',PALE='#ece4d0',SKEL='#e9e1cc';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/',TH14A=ENV+'TH14a_coral_healthy.jpg',TH14B=ENV+'TH14b_coral_bleached.jpg';
const PW=1024,PH=572;

// ── labels ────────────────────────────────────────────────────────────────
const AI=L('aiNote','AI 插圖，非實拍','AI illustration, not a photo');
const T={
 tab:P('珊瑚為什麼變白','Why corals turn white'),
 short:[P('珊瑚是動物','Coral is an animal'),P('壓力','Stress'),P('白化','Bleaching'),P('白化不等於死亡','Not the same as death')],
 names:[P('珊瑚蟲與共生藻','Coral polyps and symbiotic algae'),P('壓力：共生藻離開或色素減少','Stress: algae leave or pigment fades'),P('白化：珊瑚變白','Bleaching: the coral turns white'),P('要看壓力與恢復條件','It depends on stress and recovery conditions')],
 colony:P('珊瑚群體','Coral colony'),
 zoom:P('放大示意','Zoomed-in schematic'),
 polyp:P('珊瑚蟲（動物）','Coral polyp (animal)'),
 algae:P('共生藻','Symbiotic algae'),
 skel:P('骨骼','Skeleton'),
 mutual:P('互利共生','Mutualism'),
 algBox:P('共生藻','Algae'),
 polBox:P('珊瑚蟲','Polyp'),
 give:P('供應養分','Supply nutrients'),
 home:P('提供住處','Give shelter'),
 stress:P('壓力：例如水溫過高','Stress: for example, water too warm'),
 leave:P('共生藻離開','Algae leave'),
 pigment:P('色素減少','Pigment fades'),
 recol:P('白化圖：程式改色示意','Bleached picture: recoloured schematic'),
 links:[P('共生藻離開或色素減少','Algae leave or pigment fades'),P('珊瑚變白：白化','The coral turns white: bleaching')],
 notDeath:P('白化不等於死亡','Bleaching is not death'),
 bleached:P('白化','Bleached'),
 recover:P('壓力解除：共生藻可能回來','If the stress ends, the algae may return'),
 die:P('壓力持續：才可能死亡','If the stress continues, death may follow'),
 depends:P('要看壓力與恢復條件','It depends on stress and recovery conditions'),
 legAlg:P('綠色小點：共生藻','Green dots: symbiotic algae'),
 legPolyp:P('珊瑚蟲是動物','Coral polyps are animals'),
 legPress:P('橘色：壓力','Orange: stress'),
 legLeave:P('共生藻離開，顏色變淡','Algae leave; colour fades'),
 legFade:P('同一群珊瑚，淡入白化圖','Same colony, fading to the bleached picture'),
 legDash:P('白色虛線框：可能，不確定','White dashed box: possible, not certain'),
 schem:L('schematic','示意','Schematic'),
 ai:P(`珊瑚圖：${AI[0]}`,`Coral pictures: ${AI[1]}`)
};

// ── geometry ─────────────────────────────────────────────────────────────
const aspect=PH/PW;
const R=(x,y,w)=>({x,y,w,h:Math.round(w*aspect)});
const LAY=[R(16,16,300),R(16,16,300),R(16,16,620),R(16,186,290)];   // colony picture A per step
const ZOOM={x:16,y:196,w:620,h:370};
const SIDE={x:332,y:16,w:304,h:168};                                // right of the small picture (steps 0-1)
const FRAME=[492,196,56,46];                                        // zoomed spot on the picture (picture px)
const REC={x:376,y:16,w:260,h:Math.round(260*aspect)};             // step 3: recovery picture
const CARD={x:652,y:16,w:292,h:550};
const POLYPS=[{cx:160,ph:0},{cx:360,ph:1.7}];
const BASE=300,TOP=158;                                             // zoom-local: polyp base and rim
const colW=y=>mix(64,50,clamp((BASE-y)/(BASE-TOP)));                // half width of the column at height y

// per-step targets and [delay, duration] when entering a step
const TGT={zoom:[1,1,0,0],mut:[1,0,0,0],press:[0,1,0,0],leave:[0,1,1,1],pale:[0,1,1,1],bleach:[0,0,1,1],link:[0,0,1,0],fork:[0,0,0,1]};
const SCHED=[{},{press:[.6,.8],leave:[1.6,4],pale:[2,4]},{bleach:[1.4,3],link:[3.6,.6]},{fork:[.8,.6]}];

// fixed random positions: algae dots inside each column (zoom-local)
const R1=K.rng(7);
const DOTS=POLYPS.map((p,pi)=>Array.from({length:24},(_,i)=>{const y=TOP+14+R1()*(BASE-TOP-22),hw=colW(y)-10;
  return{x:p.cx+(R1()*2-1)*hw,y,ph:R1()*6,go:i%2===0,dx:(R1()*2-1)*40+(pi?60:30),dy:-40-R1()*70,del:R1()*.5};}));
const R2=K.rng(19),SPECK=Array.from({length:22},()=>({x:R2()*620,y:R2()*290,ph:R2()*6,v:.15+R2()*.2}));
const CUPS=Array.from({length:30},(_,i)=>({x:10+i*21+((i*7)%5),y:322+((i*13)%3)*16}));

// ── helpers (as in chain / shift) ────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、；])|(?<=[:,;] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh)=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=28,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22,vc=false,g=null}={}){
  g=g||boxGeo(c,p,maxW,size);const bx=al==='center'?x-g.w/2:al==='right'?x-g.w:x,by=vc?y-g.h/2:y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,g.w,g.h,g.rows.length>1?16:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+g.w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w:g.w,h:g.h};}
const plateW=(c,p)=>measure(c,p,22)+14;
function plate(c,p,x,y,{al='center',col=WHITE,stroke=null}={}){const w=plateW(c,p),h=32,bx=al==='right'?x-w:al==='left'?x:x-w/2;
  D.round(c,bx,y,w,h,10,FILL,stroke||rgba(col,.75));text(c,p,bx+w/2,y+24,22,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];};
const mixCol=(a,b,u)=>{const A=hex(a),B=hex(b);return`rgb(${A.map((v,i)=>Math.round(mix(v,B[i],clamp(u)))).join(',')})`;};
const mixR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
function sweep(c,r,t,speed=.11){const sw=mod(t*speed),sx=r.x-80+sw*(r.w+160),gr=c.createLinearGradient(sx-60,0,sx+60,0);
  gr.addColorStop(0,'rgba(242,236,217,0)');gr.addColorStop(.5,'rgba(242,236,217,.12)');gr.addColorStop(1,'rgba(242,236,217,0)');
  c.fillStyle=gr;c.fillRect(r.x,r.y,r.w,r.h);}
function heatWave(c,x,y0,len,t,a,amp=6){c.save();c.strokeStyle=rgba(ORANGE,a);c.lineWidth=3;c.lineCap='round';c.beginPath();
  for(let j=0;j<=len;j+=3){const px=x+Math.sin((j+t*40)/9)*amp;j?c.lineTo(px,y0+j):c.moveTo(px,y0+j);}c.stroke();c.restore();}

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const {k,tau:ct}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.coralSt||(s.coralSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ct);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  const base=st.from>=0?st.from:Math.max(0,k-1),back=base>k;
  const V={};for(const q in TGT){const sc=back?[0,.8]:(SCHED[k][q]||[0,.8]);V[q]=mix(TGT[q][base],TGT[q][k],smooth((tau-sc[0])/sc[1]));}
  s_dbg.V=V;
  const fromLay=st.from>=0?LAY[st.from]:LAY[k],A=mixR(fromLay,LAY[k],st.from>=0?smooth(x):1);
  // a fresh entry (play-all wrap or a held step) starts in place
  zoom(c,V,t,tau,k,A,rects);
  side(c,V,t,tau,k,rects);
  colony(c,V,t,tau,k,A,rects);
  links(c,V,t,tau,k,A,rects);
  fork(c,V,t,tau,k,A,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  text(c,T.schem,16,592,22,MUTED,'left');push(rects,1,'schem',{x:16,y:574,w:measure(c,T.schem,22),h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'ai',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── the colony picture A (TH14a -> TH14b) ────────────────────────────────
function colony(c,V,t,tau,k,A,rects){
  c.save();c.beginPath();c.roundRect(A.x,A.y,A.w,A.h,12);c.clip();c.fillStyle='#16332b';c.fillRect(A.x,A.y,A.w,A.h);
  K.drawIn(c,TH14A,A);
  if(V.bleach>0)K.drawIn(c,TH14B,A,{alpha:V.bleach});
  sweep(c,A,t);
  c.restore();
  D.round(c,A.x,A.y,A.w,A.h,12,null,C.edge);
  // zoom frame on the branch and dashed lines to the zoom panel
  withA(c,V.zoom,()=>{const sx=A.w/PW,fx=A.x+FRAME[0]*sx,fy=A.y+FRAME[1]*sx,fw=FRAME[2]*sx,fh=FRAME[3]*sx,pu=.5+.5*Math.sin(t*3);
    K.dashed(c,[[fx,fy+fh],[ZOOM.x+4,ZOOM.y+4]],rgba(WHITE,.55),2,[6,6],-t*8);
    K.dashed(c,[[fx+fw,fy+fh],[ZOOM.x+ZOOM.w-4,ZOOM.y+4]],rgba(WHITE,.55),2,[6,6],-t*8);
    D.round(c,fx-2,fy-2,fw+4,fh+4,4,null,rgba(WHITE,.7+.3*pu));});
  if(k<3||V.fork<1){const a=k===3?1-V.fork:1;withA(c,a,()=>{const q=plate(c,T.colony,A.x+8,A.y+8,{al:'left'});push(rects,a,'colony',q);});}
  // the bleached picture is a recoloured schematic
  const ra=k===2?clamp((tau-3.6)/.6):0;
  withA(c,ra,()=>{const q=plate(c,T.recol,A.x+8,A.y+A.h-40,{al:'left',col:WHITE});push(rects,ra,'recol',q);});
}

// ── zoom panel (steps 0-1) ───────────────────────────────────────────────
function zoom(c,V,t,tau,k,A,rects){
  if(V.zoom<=0.002)return;
  withA(c,V.zoom,()=>{
    const Z=ZOOM,G=(x,y)=>[Z.x+x,Z.y+y];
    c.save();c.beginPath();c.roundRect(Z.x,Z.y,Z.w,Z.h,12);c.clip();
    const wg=c.createLinearGradient(0,Z.y,0,Z.y+Z.h);wg.addColorStop(0,'#1f5866');wg.addColorStop(1,'#163f48');c.fillStyle=wg;c.fillRect(Z.x,Z.y,Z.w,Z.h);
    SPECK.forEach(p=>{const yy=mod(p.y-t*p.v*20,290),[X,Y]=G(p.x+Math.sin(t*.5+p.ph)*6,yy);circle(c,X,Y,1.8,rgba(WHITE,.28),null);});
    // heat waves (stress)
    withA(c,V.press,()=>{for(let i=0;i<6;i++){const x=40+i*92+((i*37)%20),q=mod(t*.35+i*.17),y=Z.y+q*170;heatWave(c,Z.x+x,y,46,t+i,(1-q)*.95);}});
    // skeleton strip with cups
    const [sx,sy]=G(0,BASE);c.fillStyle=SKEL;c.fillRect(sx,sy,Z.w,Z.h-BASE);
    CUPS.forEach(p=>{const [X,Y]=G(p.x,p.y);K.ellipse(c,X,Y,7,4,'#cfc4a8',null);});
    // tissue over the skeleton (tan -> transparent as the algae go)
    c.fillStyle=rgba(TAN,mix(.85,.12,V.pale));c.fillRect(sx,sy-8,Z.w,Z.h-BASE+8);
    POLYPS.forEach((p,pi)=>polyp(c,G,p,pi,V,t));
    c.restore();
    D.round(c,Z.x,Z.y,Z.w,Z.h,12,null,C.edge);
    // labels
    let q=plate(c,T.zoom,Z.x+8,Z.y+8,{al:'left',col:MUTED});push(rects,V.zoom,'zoomName',q);
    const p0=POLYPS[0],[px,py]=G(p0.cx,TOP-104);
    q=plate(c,T.polyp,px,py,{col:WHITE});push(rects,V.zoom,'polyp',q);
    // algae label at the right, leader to a dot of polyp 2
    const [ax,ay]=G(608,150),aq=plate(c,T.algae,ax,ay,{al:'right',col:ALG});push(rects,V.zoom,'algae',aq);
    const d=DOTS[1][3],[dx,dy]=G(d.x,d.y);K.sline(c,[[aq.x,aq.y+16],[dx+6,dy]],rgba(ALG,.85),2);circle(c,dx,dy,8,null,rgba(ALG,.9),2);
    q=plate(c,T.skel,G(608,0)[0],G(0,BASE+22)[1],{al:'right',col:MUTED});push(rects,V.zoom,'skel',q);
    // step 1 labels
    const la=k===1?clamp((tau-3)/.5):0;
    withA(c,la,()=>{let r=plate(c,T.leave,G(608,0)[0],G(0,58)[1],{al:'right',col:WHITE,stroke:ORANGE});push(rects,la,'leave',r);
      r=plate(c,T.pigment,G(608,0)[0],G(0,214)[1],{al:'right',col:WHITE,stroke:ORANGE});push(rects,la,'pigment',r);
      const dd=DOTS[1][5],[ex,ey]=G(dd.x,dd.y);K.sline(c,[[r.x,r.y+16],[ex+6,ey]],rgba(ORANGE,.8),2);});
  });
}
function polyp(c,G,p,pi,V,t){
  const tissue=mixCol(TAN,PALE,V.pale),ta=mix(.92,.42,V.pale);
  // column
  c.save();c.beginPath();
  const pts=[];for(let j=0;j<=12;j++){const y=mix(BASE,TOP,j/12);pts.push([p.cx-colW(y),y]);}
  for(let j=12;j>=0;j--){const y=mix(BASE,TOP,j/12);pts.push([p.cx+colW(y),y]);}
  pts.forEach(([x,y],i)=>{const [X,Y]=G(x,y);i?c.lineTo(X,Y):c.moveTo(X,Y);});c.closePath();
  c.save();c.globalAlpha*=ta;c.fillStyle=tissue;c.fill();c.restore();
  c.strokeStyle=rgba(WHITE,.85);c.lineWidth=2.5;c.stroke();c.restore();
  // skeleton cup lines seen through the tissue (stronger when pale)
  withA(c,.25+.6*V.pale,()=>{for(let j=1;j<5;j++){const y=BASE-j*26,[a1,b1]=G(p.cx-colW(y)+8,y),[a2,b2]=G(p.cx+colW(y)-8,y);K.sline(c,[[a1,b1],[a2,b2]],rgba(SKEL,.8),2);}});
  // tentacles around the rim
  for(let i=0;i<9;i++){const f=i/8,bx=p.cx-46+f*92,ang=-Math.PI/2+(f-.5)*2.2+Math.sin(t*1.3+p.ph+i*.8)*.18;
    const pts2=[];for(let j=0;j<=6;j++){const r=j*10,bend=Math.sin(t*1.6+p.ph+i)*.25*j/6;pts2.push(G(bx+Math.cos(ang+bend)*r,TOP+2+Math.sin(ang+bend)*r));}
    K.sline(c,pts2,rgba(WHITE,.85),7);K.sline(c,pts2,mixCol(TAN,PALE,V.pale),4);
    const [tx,ty]=pts2[6];circle(c,tx,ty,3.5,mixCol('#e6b47a',PALE,V.pale),null);}
  // mouth
  const [mx,my]=G(p.cx,TOP+2);K.ellipse(c,mx,my,18,6,'#7a5530',rgba(WHITE,.6),1.5);
  // step 1 held: a few more algae keep slipping out of the mouth
  if(V.press>0&&V.leave>=.95)for(let i=0;i<4;i++){const q=mod(t*.22+i/4+pi*.13),x=p.cx+q*(pi?150:90)+Math.sin(t+i)*4,y=TOP-6-q*(pi?70:110);
    const [X,Y]=G(x,y),a=V.press*(1-q)*clamp(q*6);circle(c,X,Y,4.6,rgba(ALG,a),rgba(ALG_D,.8*a),1.2);}
  // algae dots
  DOTS[pi].forEach((d,i)=>{let x=d.x+Math.sin(t*.9+d.ph)*2,y=d.y+Math.cos(t*.8+d.ph)*2,a=1,col=ALG;
    if(d.go){const q=clamp((V.leave-d.del*.5)/.6);
      if(q>0){const e1=smooth(q*2),e2=smooth(q*2-1);x=mix(mix(x,p.cx,e1),p.cx+d.dx,e2);y=mix(mix(y,TOP-4,e1),TOP-4+d.dy,e2);a=1-smooth((q-.7)/.3);}}
    else{a=mix(1,.38,V.pale);}
    if(a<=0.01)return;const [X,Y]=G(x,y);circle(c,X,Y,4.6,rgba(col,a),rgba(ALG_D,.8*a),1.2);});
}

// ── right of the small picture: mutualism (step 0) / stress (step 1) ─────
function side(c,V,t,tau,k,rects){
  const S=SIDE;
  withA(c,V.mut,()=>{
    const ta=k===0?clamp((tau-1)/.5):1;
    withA(c,ta,()=>{
      let q=plate(c,T.mutual,S.x+S.w/2,S.y,{col:ALG});push(rects,V.mut*ta,'mutual',q);
      const gA=boxGeo(c,T.algBox,140),gP=boxGeo(c,T.polBox,140),by=S.y+82;
      const qa=box(c,T.algBox,S.x,by,{g:gA,stroke:ALG,col:ALG});push(rects,V.mut*ta,'algBox',qa);
      const qp=box(c,T.polBox,S.x+S.w,by,{al:'right',g:gP,stroke:WHITE});push(rects,V.mut*ta,'polBox',qp);
      const x1=qa.x+qa.w+8,x2=qp.x-8,sh=3*Math.sin(t*3);
      K.arrow(c,x1+sh*.3,by+12,x2+sh,by+12,WHITE,3.5);K.arrow(c,x2-sh*.3,by+qa.h-12,x1-sh,by+qa.h-12,WHITE,3.5);
      const cx=(x1+x2)/2;
      const r1={x:cx-measure(c,T.give,22)/2,y:by-34,w:measure(c,T.give,22),h:26};text(c,T.give,cx,by-12,22,WHITE,'center');push(rects,V.mut*ta,'give',r1);
      const r2={x:cx-measure(c,T.home,22)/2,y:by+qa.h+4,w:measure(c,T.home,22),h:26};text(c,T.home,cx,by+qa.h+26,22,WHITE,'center');push(rects,V.mut*ta,'home',r2);
    });
  });
  withA(c,V.press,()=>{
    const g=boxGeo(c,T.stress,S.w-64),q=box(c,T.stress,S.x+64,S.y+20,{g,stroke:ORANGE,col:WHITE});push(rects,V.press,'stress',q);
    for(let i=0;i<3;i++)heatWave(c,S.x+14+i*16,S.y+18,60,t+i*.7,.95,4);
    // arrow down into the zoom panel
    const ax=q.x+q.w/2,a0=q.y+q.h+8,sh=4*Math.sin(t*3);K.arrow(c,ax,a0,ax,ZOOM.y-6+sh,ORANGE,4);
    if(q.h>0&&V.press>=1&&tau>1.4&&tau<5)ring(c,q,t,ORANGE);
  });
}

// ── step 2: cause -> effect under the big picture ────────────────────────
function links(c,V,t,tau,k,A,rects){
  if(V.link<=0.002)return;
  withA(c,V.link,()=>{
    const LY0=LAY[2].y+LAY[2].h;
    const g1=boxGeo(c,T.links[0],270),g2=boxGeo(c,T.links[1],290),gap=56,W=g1.w+gap+g2.w,x0=16+310-W/2,h=Math.max(g1.h,g2.h),LY=Math.round(LY0+(566-LY0-h)/2);
    const q1=box(c,T.links[0],x0,LY+(h-g1.h)/2,{g:g1,stroke:ORANGE});
    const q2=box(c,T.links[1],x0+g1.w+gap,LY+(h-g2.h)/2,{g:g2,stroke:WHITE});
    const ay=LY+h/2,sh=3*Math.sin(t*3);K.arrow(c,q1.x+q1.w+8+sh*.3,ay,q2.x-6+sh,ay,WHITE,4);
    push(rects,V.link,'link0',q1);push(rects,V.link,'link1',q2);
    if(V.link>=1&&tau>4.4&&tau<8)ring(c,q2,t,WHITE);
  });
}

// ── step 3: two outcomes ─────────────────────────────────────────────────
function fork(c,V,t,tau,k,A,rects){
  if(V.fork<=0.002)return;
  withA(c,V.fork,()=>{
    const a=V.fork;
    // tag above the bleached picture
    let q=plate(c,T.notDeath,A.x+A.w/2,A.y-44,{col:WHITE,stroke:WHITE});push(rects,a,'notDeath',q);
    const bq=plate(c,T.bleached,A.x+8,A.y+8,{al:'left'});push(rects,a,'bleached',bq);
    // recovery picture: bleached -> colour
    const Rr=REC,ru=smooth((tau-2.2)/2.4);
    c.save();c.beginPath();c.roundRect(Rr.x,Rr.y,Rr.w,Rr.h,12);c.clip();c.fillStyle='#16332b';c.fillRect(Rr.x,Rr.y,Rr.w,Rr.h);
    K.drawIn(c,TH14B,Rr);K.drawIn(c,TH14A,Rr,{alpha:ru});sweep(c,Rr,t+3);c.restore();
    D.round(c,Rr.x,Rr.y,Rr.w,Rr.h,12,null,C.edge);
    // returning algae: green dots drift into the picture
    withA(c,ru*(1-ru)*4,()=>{for(let i=0;i<7;i++){const q2=mod(t*.4+i/7);circle(c,Rr.x+Rr.w*.25+i*26,Rr.y+Rr.h*.15+q2*Rr.h*.5,4.5,rgba(ALG,1-q2),null);}});
    const g1=boxGeo(c,T.recover,300),q1=box(c,T.recover,Rr.x+Rr.w/2,Rr.y+Rr.h+10,{al:'center',g:g1,stroke:WHITE});push(rects,a,'recover',q1);
    // continued stress: dashed white box
    const g2=boxGeo(c,T.die,300),dy=Math.max(q1.y+q1.h+40,334),q2=box(c,T.die,Rr.x+Rr.w/2,dy,{al:'center',g:g2,stroke:WHITE,dash:[8,6],t});push(rects,a,'die',q2);
    // arrows from the bleached picture
    const ox=A.x+A.w+8,oy=A.y+A.h/2,sh=3*Math.sin(t*3);
    K.arrow(c,ox,oy-14,Rr.x-8+sh,Rr.y+Rr.h*.55,WHITE,4);
    K.arrow(c,ox,oy+14,q2.x-8+sh,q2.y+q2.h/2,ORANGE,4);
    // bottom: it depends
    const da=clamp((tau-4.6)/.6);
    withA(c,da,()=>{const g3=boxGeo(c,T.depends,600),q3=box(c,T.depends,16+310,486,{al:'center',g:g3,stroke:WHITE});push(rects,da*a,'depends',q3);if(da>=1)ring(c,q3,t,WHITE);});
  });
}

// ── step card (right) ─────────────────────────────────────────────────────
function legend(k){return[[['alg',T.legAlg],['polyp',T.legPolyp]],[['press',T.legPress],['leave',T.legLeave]],[['fade',T.legFade]],[['dash',T.legDash],['press',T.legPress]]][k];}
function legIcon(c,kind,x,y,t){
  if(kind==='alg'){[[10,10],[22,18],[32,8],[16,26],[30,26]].forEach(([dx,dy],i)=>circle(c,x+dx+Math.sin(t+i)*1.2,y+dy,4,ALG,ALG_D,1));}
  else if(kind==='polyp'){c.save();c.beginPath();c.moveTo(x+10,y+30);c.lineTo(x+14,y+12);c.lineTo(x+28,y+12);c.lineTo(x+32,y+30);c.closePath();c.fillStyle=TAN;c.fill();c.strokeStyle=WHITE;c.lineWidth=2;c.stroke();c.restore();
    for(let i=0;i<5;i++){const a=-Math.PI/2+(i/4-.5)*2+Math.sin(t*1.3+i)*.15;K.sline(c,[[x+15+i*3,y+12],[x+15+i*3+Math.cos(a)*10,y+12+Math.sin(a)*10]],TAN,3);}}
  else if(kind==='press'){for(let i=0;i<3;i++)heatWave(c,x+8+i*12,y,30,t+i*.6,.95,3);}
  else if(kind==='leave'){for(let i=0;i<4;i++){const q=mod(t*.4+i/4);circle(c,x+8+q*26,y+26-q*20,4,rgba(ALG,1-q),null);}}
  else if(kind==='fade'){const u=.5+.5*Math.sin(t*1.2);D.round(c,x+4,y+4,34,24,6,mixCol(TAN,PALE,u),rgba(WHITE,.6));}
  else if(kind==='dash'){c.save();c.setLineDash([6,4]);c.lineDashOffset=-t*8;D.round(c,x+4,y+4,34,24,6,null,WHITE);c.restore();}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:ORANGE});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  const RH=34;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH/2,rows=blines(c,p,iw-42),hh=RH+(rows.length-1)*LH;
    if(on>0)withA(c,on,()=>D.round(c,ix-6,y,iw+12,hh,12,'rgba(242,236,217,.10)',null));
    if(on<1)badge(c,j+1,ix+16,cy,0);withA(c,on,()=>badge(c,j+1,ix+16,cy,2,WHITE));
    rows.forEach((r,i)=>text(c,r,ix+42,cy+8+i*LH,22,on>.5?WHITE:MUTED));
    y+=hh;});
  y+=4;K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=8;
  const ty=y+22;
  if(moving&&st.from>=0)withA(c,1-clamp(x*2.5),()=>bwrap(c,T.names[st.from],ix,ty,iw,22,WHITE,28));
  const na=clamp((tau-(moving?MOVE*.6:0))/.5);
  const hh=blines(c,T.names[k],iw).length*28;withA(c,na,()=>bwrap(c,T.names[k],ix,ty,iw,22,WHITE,28));
  if(rects)rects.push({id:'cardTitle',x:ix,y:ty-22,w:iw,h:hh});
  const legs=legend(k),lhs=legs.map(([,p])=>Math.max(38,blines(c,p,iw-50).length*27+8));
  const ly=R.y+R.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+2,t);
    const h=bwrap(c,p,ix+50,yy+22,iw-50,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+50,y:yy+2,w:iw-50,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.coral=draw;
window.EnvironmentDraw.coral.dbg=s_dbg;
})();

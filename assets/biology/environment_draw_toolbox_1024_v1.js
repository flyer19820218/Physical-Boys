/* Unit 11 lesson 3 · "toolbox" canvas (conservation-evidence tab, view 1), 2026-10-25. Four tools used together (plan section 4, toolbox; P1).
 * Four steps, 9 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step. No options.
 * Always moving: the lit tool chip pulses, the sea particles drift, the tracking pings and signal arcs pulse, the protected zone breathes,
 * the patrol figures walk, the flags wave, the turtle swims along the route; in the end the four chips and their lines pulse together.
 * Layout (as turtle / casefile): left = stage (x 16..636, y 16..486), right = step card (x 652..944, y 16..566).
 *   The turtle is in the centre of the stage: SCN (x 138..514, y 84..418) shows the step's scene with the turtle at its centre.
 *   Four tool chips sit around it (left = research, right = protected area, bottom = community, top = cooperation); empty dashed slots
 *   show where they will go. In each step one chip flies in from its own side (clipped to the stage) and the scene shows that tool.
 *   All chips are drawn alike (white): the tools are not ranked. Colour only in the scene: cyan = tracking evidence, green = protection.
 *  0 research: drawn sea (schematic); CV1_green_turtle_tagged.png in the centre; cyan tracking pings appear one by one and join into the
 *    tracked path; cyan signal arcs from the tag; tags "tracking and surveys", "tag", "schematic".
 *  1 protected area: CV2_nesting_beach.jpg (crop x 150..746, rows 20..549); CV1_green_turtle_adult.png on the sand in the centre;
 *    a soft-edged green zone grows round the turtle and the nest pit; tags "a managed zone" (green), "schematic".
 *  2 community: the same CV2 crop (no fade); three drawn silhouettes (no faces) walk the shoreline; a small record mark pops up;
 *    tag "patrol and record".
 *  3 cooperation: drawn map: sea with two different coasts (sand left, rocky right), one abstract flag on each; the turtle swims a cyan
 *    route from one coast to the other; dashed double arrow "both ends work together". From 5 s: the scene dims, the turtle sits in the
 *    centre, the four chips and four lines to the turtle light up together; statement "use all four; one alone leaves a gap".
 * Science (plan 4): a source case, not a current list of laws; no categories, site totals, membership numbers or penalties; no numbers.
 * Pictures (alpha bbox = whole picture, measured with PIL): tagged 370x279 (tag disc at source px 183,17; faces right), adult 369x278
 * (faces right), CV2 1024x572 (nest pit at source px 712,168; shoreline picked once from the picture, source px below).
 * New labels (P(), not in K.LAB) are in T below.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,rgba,text,measure,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=9,CW=960,MOVE=1,FINAL=5;
const WHITE=C.white,MUTED=C.muted,INK=C.ink;
const GREEN=(K.COL&&K.COL.protect)||'#4ade80',CYAN=(K.COL&&K.COL.evidence)||'#55e9ff';
const FILL='rgba(11,26,21,.92)';
const ENV=K.ENV||'environment_ai_1024/';
const BEACH=ENV+'CV2_nesting_beach.jpg',ADULT=ENV+'CV1_green_turtle_adult.png',TAGGED=ENV+'CV1_green_turtle_tagged.png';

// ── labels ────────────────────────────────────────────────────────────────
const T={
 tab:P('四種工具一起用','Four tools used together'),
 short:[P('研究','Research'),P('保護區','Protected area'),P('社區參與','Community'),P('跨地區合作','Cooperation')],
 names:[P('工具一：研究','Tool 1: research'),P('工具二：保護區','Tool 2: a protected area'),P('工具三：社區參與','Tool 3: community participation'),P('工具四：跨地區合作','Tool 4: cooperation across regions')],
 track:P('追蹤、調查','Tracking and surveys'),tagL:P('標記','Tag'),
 zone:P('受管理的範圍','A managed zone'),
 patrol:P('巡視、記錄','Patrol and record'),
 coast:[P('海岸一','Coast 1'),P('海岸二','Coast 2')],both:P('兩端彼此配合','Both ends work together'),
 schem:L('schematic','示意','Schematic'),
 st:[P('研究：知道牠用了哪些地方','Research: learn which places it uses'),
  P('保護區：管理牠產卵的沙灘','A protected area: managing the beach where it nests'),
  P('社區：住在海邊的人巡視、記錄','Community: people by the coast patrol and record'),
  P('跨地區合作：路徑兩端的地方彼此配合','Cooperation: the places at both ends of the route work together'),
  P('四個工具一起用；單用一個，缺口還在','Use all four together; using just one leaves a gap')],
 leg:[[['path',P('青色：追蹤證據','Cyan: tracking evidence')],['tag',P('背甲上的標記','The tag on its shell')]],
      [['zone',P('綠色：保護範圍（示意）','Green: the protected zone (schematic)')],['beach',P('產卵的沙灘','The nesting beach')]],
      [['people',P('人形：簡化的剪影','Figures: simplified silhouettes')],['note',P('走過、看到，就記下來','Walk, watch, write it down')]],
      [['flags',P('旗標：路徑兩端的地方','Flags: the places at both ends')],['four',P('四個工具各補一塊','Each tool fills its own part')]]],
 foot:P('海岸、路線與範圍都是示意','Coasts, routes and zones are schematic'),
 ai:L('aiNote','AI 插圖，非實拍','AI illustration, not a photo')
};

// ── geometry ─────────────────────────────────────────────────────────────
const STAGE={x:16,y:16,w:620,h:470};
const SCN={x:138,y:84,w:376,h:334},CXY=[SCN.x+SCN.w/2,SCN.y+SCN.h/2];   // centre (326,251)
const CROP_SX=150,CROP_SY=20,CROP_SW=596,CROP_SH=529,SC=SCN.w/CROP_SW;
const CROP=[CROP_SX/1024,CROP_SY/572,CROP_SW/1024,CROP_SH/572];
const sx=X=>SCN.x+(X-CROP_SX)*SC,sy=Y=>SCN.y+(Y-CROP_SY)*SC;
const PIT={x:sx(712),y:sy(168)};
const SHORE=[[345,140],[300,230],[275,320],[250,420],[240,520]].map(([X,Y])=>[sx(X)+18,sy(Y)]);   // walking line on the wet sand (CV2)
const BEACH_T={x:CXY[0],y:CXY[1]+12,w:120};                          // adult turtle on the sand (steps 1, 2)
const ZONE={x:385,y:230,rx:135,ry:110};
const TAG_OFF=[(183-185)/370,(17-139.5)/370];                          // tag disc offset as a fraction of the picture width
// chips: slot centre, fly-in start, label side
const CH=[{x:72,y:226,from:[-70,226],side:'L'},{x:580,y:226,from:[720,226],side:'R'},{x:326,y:456,from:[326,560],side:'B'},{x:326,y:46,from:[326,-60],side:'T'}];
const CR=26;
const BOT=496;
const CARD={x:652,y:16,w:292,h:550};
const BG=['sea','beach','beach','map'];
// cooperation map
const F1={x:168,y:304},F2={x:490,y:214};                              // flag bases
const RA=[180,300],RB=[478,212];
function routePt(u){const dx=RB[0]-RA[0],dy=RB[1]-RA[1],l=Math.hypot(dx,dy),px=-dy/l,py=dx/l,w=30*Math.sin(Math.PI*2*u);
  return[mix(RA[0],RB[0],u)+px*w,mix(RA[1],RB[1],u)+py*w];}
const ARC=[[F1.x+10,F1.y-58],[322,96],[F2.x-10,F2.y-58]];

// ── helpers (as in turtle / casefile) ────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
const LH=26;
function balW(c,str,w,size){const n=K.splitLines(c,str,w,size).length;if(n<2)return w;let lo=w*.4,hi=w;
  for(let i=0;i<14;i++){const m=(lo+hi)/2;if(K.splitLines(c,str,m,size).length>n)lo=m;else hi=m;}return Math.ceil(hi)+1;}
function blines(c,p,w,size=22){const str=D.tr(p),zh=/[一-鿿]/.test(str),rows=[];let row='';
  for(const part of str.split(/(?<=[：，、；？])|(?<=[:,;?] )|​/)){
    if(measure(c,(row+part).trimEnd(),size)<=w){row+=part;continue;}
    if(row.trim())rows.push(row.trimEnd());
    if(measure(c,part.trimEnd(),size)<=w)row=part;
    else{const r=K.splitLines(c,part.trim(),zh?w:balW(c,part.trim(),w,size),size);row=r.pop();rows.push(...r);}}
  if(row.trim())rows.push(row.trimEnd());return rows;}
const bwrap=(c,p,x,y,w,size,col,lh,al='left')=>{const r=blines(c,p,w,size);r.forEach((q,i)=>text(c,q,x,y+i*lh,size,col,al));return r.length*lh;};
function greedy(c,str,w,size=22){const rows=[];let row='';for(const word of str.split(' ')){const tryR=row?row+' '+word:word;if(!row||measure(c,tryR,size)<=w)row=tryR;else{rows.push(row);row=word;}}if(row)rows.push(row);return rows;}
function greedyBal(c,str,w,size=22){const n=greedy(c,str,w,size).length;if(n<2)return greedy(c,str,w,size);let lo=w*.4,hi=w;for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(c,str,m,size).length>n)lo=m;else hi=m;}return greedy(c,str,Math.ceil(hi)+1,size);}
function ring(c,r,t,col){const u=mod(t*.7);D.round(c,r.x-6*u,r.y-6*u,r.w+12*u,r.h+12*u,Math.min(r.h/2,16)+6*u,null,rgba(col,.8*(1-u)));}
function badge(c,n,x,y,mode,col=WHITE){circle(c,x,y,15,mode===2?col:FILL,mode===2?col:rgba(MUTED,.6),2);
  c.save();c.font=K.MONO(22);c.fillStyle=mode===2?INK:MUTED;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function boxGeo(c,p,maxW,size=22){const pad=24,str=D.tr(p),rows=/[一-鿿]/.test(str)?blines(c,p,maxW-pad,size):greedyBal(c,str,maxW-pad,size);
  const lh=Math.round(size*1.2),w=Math.max(...rows.map(r=>measure(c,r,size)))+pad,h=Math.round(size*1.82)+(rows.length-1)*lh;return{rows,w,h,lh};}
function box(c,p,x,y,{maxW=600,al='left',stroke=WHITE,col=WHITE,fill=FILL,dash=null,t=0,size=22}={}){
  const g=boxGeo(c,p,maxW,size),w=g.w,bx=al==='center'?x-w/2:al==='right'?x-w:x,by=y;
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}D.round(c,bx,by,w,g.h,g.rows.length>1?14:Math.min(20,g.h/2),fill,stroke);if(dash)c.restore();
  g.rows.forEach((r,i)=>text(c,r,bx+w/2,by+Math.round(size*1.27)+i*g.lh,size,col,'center'));
  return{x:bx,y:by,w,h:g.h};}
const tagW=(c,p,size=22)=>measure(c,p,size)+28;
function tag(c,p,x,y,{al='left',col=WHITE,size=22,fill=FILL,dash=null,t=0,minX=SCN.x+4,maxX=SCN.x+SCN.w-4}={}){
  const w=tagW(c,p,size),h=size+18;let bx=al==='right'?x-w:al==='center'?x-w/2:x;bx=Math.max(minX,Math.min(bx,maxX-w));
  if(dash){c.save();c.setLineDash(dash);c.lineDashOffset=-t*10;}
  D.round(c,bx,y,w,h,h/2,fill,rgba(col,.95));if(dash)c.restore();
  text(c,p,bx+w/2,y+h/2+size*.36,size,col,'center');return{x:bx,y,w,h};}
const push=(rects,a,id,q)=>{if(rects&&a>=.99)rects.push({id,x:q.x,y:q.y,w:q.w,h:q.h});};
function sprite(c,f,x,y,w,{rot=0,a=1,shadow=.4}={}){const [W,H]=K.dim(f),h=w*H/W;
  withA(c,a,()=>{c.save();c.translate(x,y);c.rotate(rot);
    if(shadow>0){c.save();c.globalAlpha*=shadow;c.fillStyle=INK;c.filter='blur(5px)';c.beginPath();c.ellipse(0,h*.12,w/2,h/2.4,0,0,Math.PI*2);c.fill();c.restore();}
    K.drawIn(c,f,{x:-w/2,y:-h/2,w,h});c.restore();});}
const lead=(c,x1,y1,x2,y2,t,col=WHITE)=>{K.dashed(c,[[x1,y1],[x2,y2]],rgba(INK,.7),5,[8,6],-t*10);K.dashed(c,[[x1,y1],[x2,y2]],col,2.5,[8,6],-t*10);};
const qbez=(p,u)=>[(1-u)*(1-u)*p[0][0]+2*(1-u)*u*p[1][0]+u*u*p[2][0],(1-u)*(1-u)*p[0][1]+2*(1-u)*u*p[1][1]+u*u*p[2][1]];

// ── frame ─────────────────────────────────────────────────────────────────
const s_dbg={};
function draw(c,s,t){
  const ck=K.stageClock(s,t,N,PER),k=ck.k;
  s.shown=k;
  const st=s.toolSt||(s.toolSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-Math.max(0,ck.tau);st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=j=>j===k?(moving?clamp((x-.3)/.7):1):(moving&&j===st.from?1-clamp(x*1.6):0);
  const TT=j=>j===k?tau:99;
  const fin=k===3?smooth(clamp((tau-FINAL)/.8)):0;
  const rects=[];s_dbg.rects=rects;s_dbg.k=k;
  D.round(c,STAGE.x,STAGE.y,STAGE.w,STAGE.h,14,'rgba(22,51,43,.92)',C.edge);
  scene(c,k,st,moving,u,A,TT,t,rects,fin);
  chips(c,k,st,moving,u,tau,t,rects,fin);
  statement(c,k,st,moving,x,tau,t,rects);
  card(c,k,st,moving,x,u,tau,t,rects);
  const fw=measure(c,T.foot,22);text(c,T.foot,16,592,22,MUTED,'left');push(rects,1,'foot',{x:16,y:574,w:fw,h:24});
  const aw=measure(c,T.ai,22);text(c,T.ai,CW-16,592,22,MUTED,'right');push(rects,1,'aiNote',{x:CW-16-aw,y:574,w:aw,h:24});
}

// ── tool chips round the scene ───────────────────────────────────────────
function chipIcon(c,j,x,y,t,col=WHITE){
  c.save();c.lineCap='round';c.lineJoin='round';
  if(j===0){// a shell with a tag on it, two signal arcs
    c.beginPath();c.ellipse(x,y+8,15,8,0,Math.PI,0);c.closePath();c.strokeStyle=col;c.lineWidth=2.2;c.stroke();
    D.round(c,x-5,y-5,10,7,3,col,null);
    const v=mod(t*.9);for(let i=0;i<2;i++){c.beginPath();c.arc(x,y-4,7+i*6+3*v,-Math.PI*.8,-Math.PI*.2);c.strokeStyle=rgba(col,.9-.3*i);c.lineWidth=2.2;c.stroke();}}
  else if(j===1){// a soft zone round a small shell
    c.save();c.setLineDash([4,4]);c.lineDashOffset=-t*6;circle(c,x,y,16,rgba(col,.12),col,2.2);c.restore();
    K.ellipse(c,x,y+1,7,5,col,null);circle(c,x+8,y-1,2.6,col,null);}
  else if(j===2){// two people
    [[-7,0],[7,2]].forEach(([dx,dy],i)=>{const b=1.2*Math.sin(t*3+i*2);circle(c,x+dx,y-9+dy+b,4.2,col,null);
      c.beginPath();c.moveTo(x+dx-5,y+12+dy);c.quadraticCurveTo(x+dx-5,y-3+dy+b,x+dx,y-3+dy+b);c.quadraticCurveTo(x+dx+5,y-3+dy+b,x+dx+5,y+12+dy);c.closePath();c.fillStyle=col;c.fill();});}
  else {// two flags joined by a dashed arc
    const w=1.5*Math.sin(t*3);
    K.sline(c,[[x-12,y+12],[x-12,y-10]],col,2.2);c.beginPath();c.moveTo(x-12,y-10);c.lineTo(x-2,y-6+w);c.lineTo(x-12,y-2);c.closePath();c.fillStyle=col;c.fill();
    K.sline(c,[[x+12,y+12],[x+12,y-10]],col,2.2);c.beginPath();c.moveTo(x+12,y-10);c.lineTo(x+2,y-10+w);c.lineTo(x+5,y-6);c.lineTo(x+2,y-2+w);c.lineTo(x+12,y-2);c.closePath();c.fill();
    c.save();c.setLineDash([3,3]);c.lineDashOffset=-t*6;c.beginPath();c.moveTo(x-9,y+12);c.quadraticCurveTo(x,y+4,x+9,y+12);c.strokeStyle=col;c.lineWidth=2;c.stroke();c.restore();}
  c.restore();}
// label geometry of chip j (rows, box) for its slot
function chipGeo(c,j){const ch=CH[j],p=T.short[j];
  if(ch.side==='L'||ch.side==='R'){const rows=blines(c,p,108);return{cx:ch.x,cy:ch.y,rows,lx:ch.x,ly:ch.y+CR+30,al:'center',
      box:{x:ch.x-56,y:ch.y+CR+8,w:112,h:rows.length*LH+4}};}
  const lw=measure(c,p,22),tot=CR*2+12+lw,cx=ch.x-tot/2+CR;
  return{cx,cy:ch.y,rows:[D.tr(p)],lx:cx+CR+12,ly:ch.y+8,al:'left',box:{x:cx+CR+12,y:ch.y-14,w:lw,h:28}};}
function chipAt(c,j,dx,dy,t,{lit=0,a=1,rects=null}={}){const g=chipGeo(c,j);
  withA(c,a,()=>{c.save();c.translate(dx,dy);
    if(lit>0){K.glow(c,g.cx,g.cy,CR+20,WHITE,.35*lit);}
    circle(c,g.cx,g.cy,CR,FILL,WHITE,lit>0?3:2);
    chipIcon(c,j,g.cx,g.cy,t);
    g.rows.forEach((r,i)=>text(c,r,g.lx,g.ly+i*LH,22,WHITE,g.al));
    c.restore();});
  if(rects&&a>=.99&&!dx&&!dy){push(rects,1,'chip'+j,g.box);}
  return g;}
function chips(c,k,st,moving,u,tau,t,rects,fin){
  // empty dashed slots
  CH.forEach((ch,j)=>{const g=chipGeo(c,j);c.save();c.setLineDash([6,6]);c.lineDashOffset=-t*4;circle(c,g.cx,g.cy,CR,null,rgba(MUTED,.45),2);c.restore();});
  // final: four lines to the turtle, under the chips
  withA(c,fin,()=>CH.forEach((ch,j)=>{const g=chipGeo(c,j),dx=CXY[0]-g.cx,dy=CXY[1]-g.cy,l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l;
    const p0=[g.cx+ux*(CR+4),g.cy+uy*(CR+4)],p1=[CXY[0]-ux*84,CXY[1]-uy*64];
    K.sline(c,[p0,p1],rgba(INK,.7),7);K.sline(c,[p0,p1],WHITE,3);
    const v=mod(t*.6+j*.25);K.glow(c,mix(p0[0],p1[0],v),mix(p0[1],p1[1],v),10,WHITE,.8);}));
  const vis=(j,kk)=>j<=kk?1:0;
  CH.forEach((ch,j)=>{
    const g=chipGeo(c,j);
    if(j===k&&!(moving&&st.from===k)){// this step's tool flies in from its own side
      const f=smooth(clamp((tau-.2)/1.2)),dx=(ch.from[0]-ch.x)*(1-f),dy=(ch.from[1]-ch.y)*(1-f);
      if(f<1){c.save();c.beginPath();c.rect(STAGE.x,STAGE.y,STAGE.w,STAGE.h);c.clip();
        for(let i=1;i<=4;i++){const b=i*.06;K.glow(c,g.cx+dx+(ch.from[0]-ch.x)*b,g.cy+dy+(ch.from[1]-ch.y)*b,CR,WHITE,.22*(1-i/5));}
        chipAt(c,j,dx,dy,t,{lit:1});c.restore();}
      else{const lit=fin>0?1:1;chipAt(c,j,0,0,t,{lit,rects});
        if(tau<4||fin>0){const q=chipGeo(c,j);ring(c,{x:q.cx-CR,y:q.cy-CR,w:CR*2,h:CR*2},t,WHITE);}
        if(tau>1.4&&tau<2.2){const v=clamp((tau-1.4)/.8);circle(c,g.cx,g.cy,CR+v*24,null,rgba(WHITE,.9*(1-v)),3);}}
      return;}
    const a=moving&&st.from>=0?mix(vis(j,st.from),vis(j,k),u):vis(j,k);
    if(a<=0)return;
    const lit=fin;chipAt(c,j,0,0,t,{lit,a,rects});
    if(fin>0){const q=chipGeo(c,j);withA(c,fin,()=>ring(c,{x:q.cx-CR,y:q.cy-CR,w:CR*2,h:CR*2},t+j*.1,WHITE));}
  });
}

// ── scene (centre) ───────────────────────────────────────────────────────
function seaGrad(c,R,t){const g=c.createLinearGradient(0,R.y,0,R.y+R.h);g.addColorStop(0,'#2a7fa8');g.addColorStop(.55,'#155a7e');g.addColorStop(1,'#0d3550');
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();c.fillStyle=g;c.fillRect(R.x,R.y,R.w,R.h);
  for(let i=0;i<4;i++){const bx=R.x+40+i*100+16*Math.sin(t*.3+i);c.save();c.globalAlpha=.07+.04*Math.sin(t*.8+i*1.3);c.fillStyle=WHITE;
    c.beginPath();c.moveTo(bx-12,R.y);c.lineTo(bx+12,R.y);c.lineTo(bx+56,R.y+R.h);c.lineTo(bx+16,R.y+R.h);c.closePath();c.fill();c.restore();}
  for(let i=0;i<20;i++){const v=mod(t*.05+i*.383),px=R.x+mod(i*.618+.03*Math.sin(t*.4+i))*R.w,py=R.y+R.h*(1-v);circle(c,px,py,1.6+(i%3)*.7,rgba(WHITE,.35*Math.sin(Math.PI*v)),null);}
  c.restore();}
function mapBg(c,R,t){seaGrad(c,R,t);
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  // coast 1: sand, wavy edge
  c.beginPath();c.moveTo(R.x,R.y);for(let i=0;i<=20;i++){const y=R.y+R.h*i/20;c.lineTo(R.x+54+10*Math.sin(i*.9)+3*Math.sin(t*.8+i),y);}c.lineTo(R.x,R.y+R.h);c.closePath();
  c.fillStyle=C.sand;c.fill();c.strokeStyle=rgba(WHITE,.8);c.lineWidth=2.5;c.stroke();
  // coast 2: rocky, darker, with stones
  c.beginPath();c.moveTo(R.x+R.w,R.y);for(let i=0;i<=20;i++){const y=R.y+R.h*i/20;c.lineTo(R.x+R.w-44-12*Math.abs(Math.sin(i*1.3))-2*Math.sin(t*.8+i),y);}c.lineTo(R.x+R.w,R.y+R.h);c.closePath();
  c.fillStyle='#7d8a6e';c.fill();c.strokeStyle=rgba(WHITE,.8);c.lineWidth=2.5;c.stroke();
  for(let i=0;i<14;i++){const yy=R.y+12+i*23,xx=R.x+R.w-30+8*Math.sin(i*2.1);K.ellipse(c,xx,yy,7+3*(i%2),5,'#5d6655',rgba(INK,.5),1.5);}
  c.restore();}
function bg(c,id,t,a){withA(c,a,()=>{const R=SCN;
  if(id==='beach')K.drawIn(c,BEACH,R,{radius:14,crop:CROP});
  else if(id==='map')mapBg(c,R,t);
  else seaGrad(c,R,t);});}
function scene(c,k,st,moving,u,A,TT,t,rects,fin){
  const R=SCN,cur=BG[k],old=moving&&st.from>=0?BG[st.from]:cur;
  if(old!==cur){bg(c,old,t,1);bg(c,cur,t,u);}else bg(c,cur,t,1);
  // glints on the beach picture
  const aB=(cur==='beach'?(old===cur?1:u):0)+(old==='beach'&&old!==cur?1-u:0);
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();
  withA(c,aB,()=>{for(let i=0;i<5;i++){const v=mod(t*.18+i/5),gx=sx(160+150*mod(i*.43)+40*v),gy=sy(160+320*mod(i*.71)+30*v);K.glow(c,gx,gy,9,WHITE,.45*Math.sin(Math.PI*v));}});
  step0(c,A(0),TT(0),t,rects);
  step1(c,A(1),TT(1),t,rects);
  step2(c,A(2),TT(2),t,rects);
  step3(c,A(3),TT(3),t,rects,fin);
  c.restore();
  // beach turtle (steps 1 and 2 share it, so it does not fade between them)
  D.round(c,R.x,R.y,R.w,R.h,14,null,C.edge);
  tags(c,k,A,TT,t,rects,fin);
}
// 0: research
function step0(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const [cx,cy]=CXY,w=190,bob=2.5*Math.sin(t*1.4),rot=.03*Math.sin(t*.7);
  // pings: positions recorded one by one, joined into the tracked path
  const P0=[[150,402],[176,372],[166,338],[196,318],[214,290],[200,262],[226,246],[250,252]];
  const n=Math.floor(clamp((q-1.6)/2.4)*P0.length+1e-6),shown=P0.slice(0,Math.max(0,n));
  if(shown.length>1){K.sline(c,shown,rgba(INK,.6),6);K.dashed(c,shown,CYAN,3,[9,6],-t*8);}
  shown.forEach((p,i)=>{circle(c,p[0],p[1],6,CYAN,INK,2);if(i===shown.length-1){const v=mod(t*.9);circle(c,p[0],p[1],6+12*v,null,rgba(CYAN,.9*(1-v)),2.5);}});
  sprite(c,TAGGED,cx,cy+bob,w,{rot,shadow:.45});
  const tx=cx+TAG_OFF[0]*w,ty=cy+bob+TAG_OFF[1]*w;
  const s=clamp((q-2.6)/.5);withA(c,s,()=>{for(let i=0;i<3;i++){const v=mod(t*.7+i/3);c.beginPath();c.arc(tx,ty,8+26*v,-Math.PI*.85,-Math.PI*.15);c.strokeStyle=rgba(CYAN,.95*(1-v));c.lineWidth=3;c.stroke();}
    circle(c,tx,ty,7,null,CYAN,2.5);});
  s_dbg.tagPt=[tx,ty];});}
// 1: protected area
function zoneDraw(c,g,t){const br=1+.02*Math.sin(t*1.6),rx=ZONE.rx*g*br,ry=ZONE.ry*g*br;
  c.save();c.filter='blur(8px)';K.ellipse(c,ZONE.x,ZONE.y,rx,ry,rgba(GREEN,.22),rgba(GREEN,.9),10);c.restore();
  c.save();c.setLineDash([10,7]);c.lineDashOffset=-t*8;K.ellipse(c,ZONE.x,ZONE.y,rx,ry,null,rgba(GREEN,.95),3);c.restore();}
function step1(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const g=smooth(clamp((q-1.4)/1));if(g>0)zoneDraw(c,g,t);
  withA(c,clamp((q-1.6)/.4),()=>{const v=mod(t*.8);circle(c,PIT.x,PIT.y,9,null,WHITE,2.5);circle(c,PIT.x,PIT.y,9+9*v,null,rgba(WHITE,.8*(1-v)),2);});});}
// 2: community, silhouettes on the shoreline
function walkerPt(v){const n=SHORE.length-1,f=clamp(v)*n,i=Math.min(n-1,Math.floor(f)),r=f-i;return[mix(SHORE[i][0],SHORE[i+1][0],r),mix(SHORE[i][1],SHORE[i+1][1],r)];}
function person(c,x,y,t,ph,h=44){const sw=Math.sin(t*5+ph),hd=h*.13;
  c.save();c.lineCap='round';c.lineJoin='round';
  c.fillStyle=INK;c.strokeStyle=rgba(WHITE,.85);c.lineWidth=1.6;
  // legs
  [[sw,0],[-sw,1]].forEach(([s])=>{c.beginPath();c.moveTo(x,y-h*.42);c.lineTo(x+s*h*.16,y);c.lineWidth=h*.12;c.strokeStyle=INK;c.stroke();});
  // body
  c.beginPath();c.moveTo(x-h*.15,y-h*.38);c.quadraticCurveTo(x-h*.17,y-h*.78,x,y-h*.78);c.quadraticCurveTo(x+h*.17,y-h*.78,x+h*.15,y-h*.38);c.closePath();
  c.fillStyle=INK;c.fill();c.strokeStyle=rgba(WHITE,.85);c.lineWidth=1.6;c.stroke();
  c.beginPath();c.arc(x,y-h*.78-hd*1.1,hd,0,Math.PI*2);c.fill();c.stroke();
  c.restore();}
function step2(c,a,q,t,rects){if(a<=0)return;withA(c,a,()=>{
  const g=clamp((q-1.1)/.5);withA(c,g,()=>{
    const v=.5-.5*Math.cos(t*.07*Math.PI*2);
    for(let i=0;i<3;i++){const p=walkerPt(.2+.3*v+i*.24);
      person(c,p[0]+(i===1?10:0),p[1],t,i*1.7,i===1?48:54);
      if(i===0){// a small record mark pops above the lead walker now and then
        const w=mod(t*.33);if(w<.45){const e=clamp(w/.1)*(1-clamp((w-.35)/.1));withA(c,e,()=>{const nx=p[0]-46,ny=p[1]-60;
          D.round(c,nx,ny,26,30,4,WHITE,INK);K.sline(c,[[nx+6,ny+16],[nx+11,ny+22],[nx+20,ny+9]],CYAN,3);
          [0,1].forEach(r=>K.sline(c,[[nx+6,ny+6+r*0],[nx+20,ny+6]],rgba(INK,.6),1.5));});}}}});});}
// 3: cooperation: two coasts, one route, flags at both ends; then the final
function flag(c,b,t,kind,a){withA(c,a,()=>{const top=b.y-56,w=2*Math.sin(t*3+(kind?1:0));
  K.sline(c,[[b.x,b.y],[b.x,top]],rgba(INK,.8),6);K.sline(c,[[b.x,b.y],[b.x,top]],WHITE,3);
  c.save();c.beginPath();
  if(!kind){c.moveTo(b.x,top);c.lineTo(b.x+34,top+11+w);c.lineTo(b.x,top+22);}
  else{c.moveTo(b.x,top);c.lineTo(b.x-34,top+w);c.lineTo(b.x-24,top+11);c.lineTo(b.x-34,top+22+w);c.lineTo(b.x,top+22);}
  c.closePath();c.fillStyle=WHITE;c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();c.restore();
  circle(c,b.x,b.y,5,WHITE,INK,2);});}
function step3(c,a,q,t,rects,fin){if(a<=0)return;withA(c,a,()=>{
  const f1=clamp((q-1.4)/.4),f2=clamp((q-1.8)/.4);
  flag(c,F1,t,0,f1);flag(c,F2,t,1,f2);
  const r=clamp((q-1.6)/1.4),pts=[];for(let i=0;i<=40*r;i++)pts.push(routePt(i/40));
  if(pts.length>1){K.sline(c,pts,rgba(INK,.6),6);K.dashed(c,pts,CYAN,3,[9,6],-t*8);}
  // the double arrow "work together"
  const b=clamp((q-3)/.5);withA(c,b*(1-fin),()=>{const ap=[];for(let i=0;i<=30;i++)ap.push(qbez(ARC,i/30));
    K.dashed(c,ap,rgba(INK,.7),6,[10,7],-t*10);K.dashed(c,ap,WHITE,3,[10,7],-t*10);
    const e1=qbez(ARC,.06),e0=qbez(ARC,0),d1=qbez(ARC,.94),d0=qbez(ARC,1);K.arrow(c,e1[0],e1[1],e0[0],e0[1],WHITE,3);K.arrow(c,d1[0],d1[1],d0[0],d0[1],WHITE,3);});
  // turtle along the route, then to the centre for the final
  const m=mix(.08,.7,smooth(clamp((q-1)/3.4))),p=routePt(m),d=routePt(Math.min(1,m+.02)),rot=Math.atan2(d[1]-p[1],d[0]-p[0])*.6;
  const bob=2*Math.sin(t*1.6);
  // final: the scene dims, the turtle sits in the centre
  if(fin>0){c.save();c.globalAlpha*=.62*fin;c.fillStyle=INK;c.fillRect(SCN.x,SCN.y,SCN.w,SCN.h);c.restore();}
  const tx=mix(p[0],CXY[0],fin),ty=mix(p[1],CXY[1],fin)+bob,w=mix(96,170,fin);
  sprite(c,ADULT,tx,ty,w,{rot:rot*(1-fin),a:clamp((q-.6)/.5),shadow:.45});
  if(fin>0){const v=mod(t*.6);withA(c,fin,()=>{K.ellipse(c,CXY[0],CXY[1],92,72,null,WHITE,3);K.ellipse(c,CXY[0],CXY[1],92+16*v,72+14*v,null,rgba(WHITE,.8*(1-v)),2.5);});}
  s_dbg.turtle3=[tx,ty];});}
// turtle on the beach for steps 1 and 2 (no fade between them)
function beachTurtle(c,k,A,t){const a=Math.max(A(1),A(2));if(a<=0)return;
  const cr=.6*Math.sin(t*.9);sprite(c,ADULT,BEACH_T.x+cr*3,BEACH_T.y+cr,BEACH_T.w,{rot:-.12,a,shadow:.18});}
function tags(c,k,A,TT,t,rects,fin){
  const R=SCN;
  // beach turtle is drawn here, above step1's zone and step2's walkers
  c.save();c.beginPath();c.roundRect(R.x,R.y,R.w,R.h,14);c.clip();beachTurtle(c,k,A,t);c.restore();
  // step 0
  {const a=A(0),q=TT(0);
   withA(c,a*clamp((q-1.4)/.4),()=>{const r=tag(c,T.track,R.x+10,R.y+10,{col:CYAN});push(rects,a,'track',r);if(q>1.6&&q<4)ring(c,r,t,CYAN);});
   withA(c,a*clamp((q-1)/.4),()=>{const r=tag(c,T.schem,R.x+R.w-10,R.y+R.h-50,{al:'right',col:WHITE,dash:[7,5],t});push(rects,a,'schem0',r);});
   withA(c,a*clamp((q-2.8)/.4),()=>{const p=s_dbg.tagPt||[CXY[0],CXY[1]-63];const r=tag(c,T.tagL,R.x+R.w-10,R.y+62,{al:'right',col:WHITE});
     lead(c,r.x,r.y+r.h/2,p[0]+10,p[1]-4,t);push(rects,a,'tagL',r);if(q>3&&q<5.5)ring(c,r,t,WHITE);});}
  // step 1
  {const a=A(1),q=TT(1);
   withA(c,a*clamp((q-2)/.4),()=>{const r=tag(c,T.zone,R.x+10,R.y+10,{col:GREEN});push(rects,a,'zone',r);if(q>2.2&&q<5)ring(c,r,t,GREEN);});
   withA(c,a*clamp((q-2.4)/.4),()=>{const r=tag(c,T.schem,R.x+R.w-10,R.y+R.h-50,{al:'right',col:WHITE,dash:[7,5],t});push(rects,a,'schem1',r);});}
  // step 2
  {const a=A(2),q=TT(2);
   withA(c,a*clamp((q-1.6)/.4),()=>{const r=tag(c,T.patrol,R.x+10,R.y+10,{col:WHITE});push(rects,a,'patrol',r);if(q>1.8&&q<4.5)ring(c,r,t,WHITE);});}
  // step 3
  {const a=A(3),q=TT(3),nf=1-fin;
   withA(c,a*nf*clamp((q-1.4)/.4),()=>{const r=tag(c,T.coast[0],R.x+10,F1.y+14,{col:WHITE});push(rects,a*nf,'coast0',r);});
   withA(c,a*nf*clamp((q-1.8)/.4),()=>{const r=tag(c,T.coast[1],R.x+R.w-10,F2.y+44,{al:'right',col:WHITE});push(rects,a*nf,'coast1',r);});
   withA(c,a*nf*clamp((q-3)/.4),()=>{const r=tag(c,T.both,R.x+10,R.y+10,{col:WHITE});push(rects,a*nf,'both',r);if(q>3.2&&q<5)ring(c,r,t,WHITE);});
   withA(c,a*nf*clamp((q-1)/.4),()=>{const r=tag(c,T.schem,R.x+R.w-10,R.y+R.h-50,{al:'right',col:WHITE,dash:[7,5],t});push(rects,a*nf,'schem3',r);});}
}

// ── statement under the stage ────────────────────────────────────────────
function statement(c,k,st,moving,x,tau,t,rects){
  const cx=STAGE.x+STAGE.w/2,sd=[4.2,3.6,4,3.4];
  const idx=(kk,q)=>kk===3&&q>=FINAL?4:kk;
  const one=(kk,a,live)=>withA(c,a,()=>{
    const q=live?tau:99,i=idx(kk,q);
    let qa=live?clamp((tau-sd[kk])/.5):1;
    if(live&&kk===3&&tau>=FINAL-.4&&tau<FINAL+.6){qa=Math.abs(tau-FINAL-.1)/.5;qa=clamp(qa);}
    withA(c,qa,()=>{const b=box(c,T.st[i],cx,BOT,{maxW:STAGE.w,al:'center',stroke:WHITE,col:WHITE});
      if(live){push(rects,qa*a,'say',b);s_dbg.bottom=b.y+b.h;const s0=i===4?FINAL+.6:sd[kk]+.5;if(tau>s0&&tau<s0+3.5)ring(c,b,t,WHITE);}});});
  if(moving&&st.from>=0)one(st.from,1-clamp(x*2.5),false);
  one(k,moving?clamp((x-.4)/.6):1,true);
}

// ── step card (right) ─────────────────────────────────────────────────────
function legIcon(c,kind,x,y,t){
  const ax=x+21,ay=y+16,pul=.5+.5*Math.sin(t*2.4);
  if(kind==='path'){const pts=[[x+3,ay+8],[x+14,ay-2],[x+26,ay+4],[x+38,ay-6]];K.dashed(c,pts,CYAN,3,[6,4],-t*8);pts.forEach((p,i)=>circle(c,p[0],p[1],3.5,CYAN,null));}
  else if(kind==='tag'){circle(c,ax,ay,16,FILL,WHITE,2);chipIcon(c,0,ax+2,ay+3,t,CYAN);}
  else if(kind==='zone'){c.save();c.filter='blur(3px)';K.ellipse(c,ax,ay,19,13,rgba(GREEN,.25),GREEN,4);c.restore();c.save();c.setLineDash([5,4]);c.lineDashOffset=-t*6;K.ellipse(c,ax,ay,19,13,null,GREEN,2);c.restore();}
  else if(kind==='beach'){D.round(c,x+3,y+2,36,28,6,FILL,WHITE);K.drawIn(c,BEACH,{x:x+5,y:y+4,w:32,h:24},{radius:4,crop:[.45,.15,.4,.45]});}
  else if(kind==='people'){person(c,ax-7,ay+16,t,0,30);person(c,ax+9,ay+16,t,2,28);}
  else if(kind==='note'){D.round(c,x+9,y+1,24,30,4,WHITE,INK);K.sline(c,[[x+14,ay+1],[x+19,ay+7],[x+28,ay-6]],CYAN,3);}
  else if(kind==='flags'){chipIcon(c,3,ax,ay,t,WHITE);}
  else if(kind==='four'){[0,1,2,3].forEach(i=>circle(c,x+6+i*10,ay,4,WHITE,null));K.glow(c,ax,ay,18,WHITE,.25+.25*pul);}}
function card(c,k,st,moving,x,u,tau,t,rects){
  const R=CARD,ix=R.x+16,iw=R.w-32;
  D.round(c,R.x,R.y,R.w,R.h,14,'rgba(22,51,43,.95)',C.edge);
  const hr=box(c,T.tab,ix,R.y+12,{maxW:iw,stroke:WHITE});push(rects,1,'tab',hr);
  let y=R.y+12+hr.h+8;
  K.sline(c,[[ix,y],[ix+iw,y]],rgba(WHITE,.25),2);y+=6;
  const RH2=34;
  T.short.forEach((p,j)=>{
    const on=j===k?(moving?u:1):(moving&&j===st.from?1-u:0),cy=y+RH2/2,rows=blines(c,p,iw-42),hh=RH2+(rows.length-1)*LH;
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
  const legs=T.leg[k],lhs=legs.map(([,p])=>Math.max(50,blines(c,p,iw-54).length*27+12));
  const ly=R.y+R.h-8-lhs.reduce((a,b)=>a+b,0);
  s_dbg.title=ty+hh-22;s_dbg.legend=ly;
  const la=moving?clamp((x-.4)/.6):1;
  let yy=ly;
  withA(c,la,()=>legs.forEach(([kind,p],q)=>{
    legIcon(c,kind,ix,yy+4,t);
    const h=bwrap(c,p,ix+54,yy+22,iw-54,22,WHITE,27);push(rects,la,'leg'+q,{x:ix+54,y:yy+2,w:iw-54,h});yy+=lhs[q];}));
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.toolbox=draw;
window.EnvironmentDraw.toolbox.dbg=s_dbg;
})();

/* Unit 11 lesson 1 · "composition" canvas (species-diversity tab, view 1), 2026-10-24. Same number, different list (plan section 2, composition).
 * Four steps, 10 s each; s.shown = step. s.phase<0 plays all, s.phase>=0 holds a step (tiles breathe, dashes march, rings pulse).
 *  0 two lists: place C (left panel) and place D (right panel), 5 kinds each, one row per kind (picture tile + name);
 *    rows pop in one by one; a cyan "5 kinds" badge on each header.
 *  1 find shared: the rows fade out and back in (never sliding across each other) so the two shared kinds (grasshopper, paddy frog) sit at the top of both lists, face to face;
 *    white marching links with "=" join them; pills "only in C: 3", "shared: 2", "only in D: 3".
 *  2 combine: the two panels morph into two overlapping frames (C left, D right); the animals fade out and back in at their new places
 *    (shared kinds in the overlap, the two copies become one);
 *    cyan badges 1..8 pop on the tiles, cyan "together: 8 kinds"; then "if only C were protected": C's frame glows white,
 *    D's three own kinds dim inside a white dashed box, note "D's 3 own kinds are not on the list"; "same number, different composition".
 *  3 alternative paths (scene swaps out-then-in): C's 5 kinds as a small food web, white arrows eaten -> eater (as ecology lesson 2,
 *    no energy dots, no pyramid): grasshopper -> mantis, grasshopper -> frog, caterpillar -> frog, caterpillar -> sparrow, mantis -> sparrow.
 *    The grasshopper is removed (orange cross); its arrow to the frog fades; the frog's other food line (caterpillar -> frog)
 *    lights yellow "buffer"; the mantis has no other food in this web, so its line breaks (orange gap, "broken").
 *    Right panel: legend (arrow direction, buffer, broken) and "only links among these 5 kinds".
 * Colours: kinds = cyan (species diversity, plan 1.4). Each kind has its own outline colour, always shown with its name; same as "count"
 * (grasshopper yellow, caterpillar white, ladybird orange, snail violet, mantis periwinkle) except the paddy frog, which is red here
 * (pink is genetic diversity); new kinds: sparrow tan, field mouse grey. No green, cyan or pink outlines. Buffer yellow, removed/broken orange.
 * Pictures (K.SIZE, PIL: all cut out, alpha bbox = full image): EC4_grasshopper 788x446, EC4_caterpillar 633x331, EC5_mantis 803x760,
 * EC5_frog 657x581, EC5_sparrow 723x612, EC15_field_snail 655x350, EC4_vole 634x568, EC19_ladybird_aphids 1400x878 -> ladybird crop as in "count".
 * New labels (P(), not in K.LAB) are listed in T and NAME below. Lists and numbers are teaching examples, not survey data.
 */
(()=>{'use strict';
const K=window.EnvironmentKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,circle,glow}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
const N=4,PER=10,CW=960,MOVE=.8;
const WHITE=C.white,MUTED=C.muted,YELLOW=C.yellow,ORANGE=C.orange,KIND=K.COL.species;

// ── new labels ────────────────────────────────────────────────────────────
const T={
 placeC:P('地點 C','Place C'),placeD:P('地點 D','Place D'),
 five:P('5 種','5 kinds'),
 onlyC:P('只有 C：3 種','Only in C: 3'),onlyD:P('只有 D：3 種','Only in D: 3'),shared:P('相同：2 種','Shared: 2'),
 total:P('合起來：8 種','Together: 8 kinds'),
 protect:P('如果只保護 C：D 獨有的 3 種不在名單裡','If only C is protected, D\'s 3 own kinds are off the list'),
 off:P('不在名單裡','Off the list'),
 s0:P('種數一樣：都是 5 種','Same number: 5 kinds each'),
 s1:P('只有 2 種相同，各有 3 種是自己獨有','Only 2 shared; each place has 3 of its own'),
 s2:P('種數一樣，組成可以不同','Same number, different composition'),
 s3:P('種類多，不保證永遠穩定；要看有沒有替代的路','More kinds is no guarantee of stability: look for other paths'),
 web:P('地點 C 的小食物網','Food web of place C'),
 dir:P('被吃的 → 吃的','eaten → eater'),
 buf:P('緩衝','Buffer'),bufRow:P('黃線＝緩衝：牠還有別的食物','Yellow = buffer: it still has other food'),
 brk:P('斷了','Broken'),brkRow:P('橘色斷線：沒有替代的路','Orange break: no other path'),
 removed:P('移走','Removed'),
 only5:P('示意：只畫這 5 種之間的「誰吃誰」','Schematic: only who eats whom among these 5 kinds'),
 teach:P('示意：名單與數字為教學用','Schematic: lists and numbers are for teaching')
};
const NAME={gh:L('grasshopper','蚱蜢','Grasshopper'),cat:P('毛蟲','Caterpillar'),ma:L('mantis','螳螂','Mantis'),fr:P('澤蛙','Paddy frog'),
  sp:P('麻雀','Sparrow'),lb:P('瓢蟲','Ladybird'),sn:P('蝸牛','Snail'),vo:P('田鼷鼠','Field mouse')};
const COLR={gh:'#fde047',cat:'#f2ecd9',ma:'#8fb4ff',fr:'#f87171',sp:'#d6a77a',lb:'#fb923c',sn:'#c4b5fd',vo:'#aab3c2'};
const PIC={gh:['EC4_grasshopper.png'],cat:['EC4_caterpillar.png'],ma:['EC5_mantis.png'],fr:['EC5_frog.png'],sp:['EC5_sparrow.png'],
  sn:['EC15_field_snail.png'],vo:['EC4_vole.png'],lb:['EC19_ladybird_aphids.png',[770/1400,180/878,540/1400,360/878],1.5]};

// ── layout: steps 0-2 ─────────────────────────────────────────────────────
const LIST=[{C:['cat','gh','ma','sp','fr'],D:['lb','sn','fr','vo','gh']},      // step 0: as written down
            {C:['gh','fr','cat','ma','sp'],D:['gh','fr','lb','sn','vo']}];     // step 1: shared kinds on top
const ROW0=134,ROWH=62,TX={C:408,D:552},TILE=52;
const VEN={gh:[378,175],fr:[378,235],cat:[74,146],ma:[74,204],sp:[74,262],lb:[684,146],sn:[684,204],vo:[684,262]};
const SHARED=['gh','fr'],DONLY=['lb','sn','vo'];
const RECT=[{C:{x:24,y:96,w:428,h:318},D:{x:508,y:96,w:428,h:318}},{C:{x:20,y:96,w:612,h:250},D:{x:328,y:96,w:612,h:250}}];
const Y_HEAD=48,Y_SUB=[428,362],Y_TOT=414,Y_PROT=466,Y_ST=520;
const ENT=[];['C','D'].forEach(S=>LIST[0][S].forEach(sp=>ENT.push({S,sp})));
// position of an entity in layout j (0, 1 lists; 2 overlapping frames)
function pos(j,S,sp){if(j<=1)return[TX[S],ROW0+LIST[j][S].indexOf(sp)*ROWH];return VEN[sp];}

// ── layout: step 3 (food web) ─────────────────────────────────────────────
const WEB=['sp','ma','fr','gh','cat'];
const NODE={sp:[520,92],ma:[130,230],fr:[380,250],gh:[250,420],cat:[540,420]},WT=72;
const EDGE=[['gh','ma',[236,380],[146,316]],['gh','fr',[264,380],[362,336]],['cat','fr',[524,380],[398,336]],
            ['cat','sp',[540,380],[540,178]],['ma','sp',[170,214],[478,104]]];
const RP={x:624,y:20,w:316,h:480};
const tR=4.0,tB=4.8,tF=5.8,tS=7.0;              // step 3: removed, broken, buffer, statement

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',dash=null,dashOff=0}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=al==='right'?x-w:al==='center'?x-w/2:x;
  if(dash){D.round(c,bx,y,w,h,h/2,fill,null);c.save();c.setLineDash(dash);c.lineDashOffset=dashOff;D.round(c,bx,y,w,h,h/2,null,rgba(col,.9));c.restore();}
  else D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
const tagW=(c,p)=>measure(c,p,22)+28;
function ring(c,p,t,col){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function animal(c,sp,cx,cy,size,a=1){
  withA(c,a,()=>{
    D.round(c,cx-size/2,cy-size/2,size,size,10,'rgba(11,26,21,.82)',null);
    c.save();c.lineWidth=3;c.strokeStyle=COLR[sp];c.beginPath();c.roundRect(cx-size/2,cy-size/2,size,size,10);c.stroke();c.restore();
    const [f,crop,ar]=PIC[sp],pad=size*.1,bw=size-pad*2;
    if(crop){const w=bw,h=w/ar;K.drawIn(c,f,{x:cx-w/2,y:cy-h/2,w,h},{crop});}
    else K.place(c,f,cx-bw/2,cy-bw/2,bw,bw);
  });
}
function badge(c,n,x,y,col,ink=C.ink,r=14){circle(c,x,y,r,col,ink,2);c.save();c.font=K.MONO(22);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
function dashRect(c,r,col,t,w=2.5){c.save();c.setLineDash([8,6]);c.lineDashOffset=-t*14;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,8);c.stroke();c.restore();}
function frame(c,r,col,w,fill='rgba(22,51,43,.55)'){c.save();c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,14);c.fillStyle=fill;c.fill();c.lineWidth=w;c.strokeStyle=col;c.stroke();c.restore();}
const mixR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
// arrow from p0 to p1 drawn up to fraction g
function arrowTo(c,p0,p1,g,col,w){
  if(g<=.01)return;const tip=[mix(p0[0],p1[0],g),mix(p0[1],p1[1],g)],a=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]),hl=16,hw=10;
  const base=[tip[0]-hl*.7*Math.cos(a),tip[1]-hl*.7*Math.sin(a)];
  if(Math.hypot(tip[0]-p0[0],tip[1]-p0[1])>hl)K.sline(c,[p0,base],col,w);
  c.save();c.beginPath();c.moveTo(...tip);c.lineTo(tip[0]-hl*Math.cos(a)+hw*Math.sin(a),tip[1]-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(tip[0]-hl*Math.cos(a)-hw*Math.sin(a),tip[1]-hl*Math.sin(a)+hw*Math.cos(a));c.closePath();c.fillStyle=col;c.fill();c.restore();
}
function dashLine(c,p0,p1,col,w,off){c.save();c.lineCap='round';c.setLineDash([10,9]);c.lineDashOffset=-off;c.beginPath();c.moveTo(...p0);c.lineTo(...p1);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.restore();}
// a statement pill; wraps into a box when one line does not fit
function statement(c,p,y,col,t,on){
  const w1=tagW(c,p);
  if(w1<=CW-48){const r=tag(c,p,24,y,{col});if(on)ring(c,r,t,col);return;}
  const rows=K.splitLines(c,D.tr(p),CW-48-28,22),h=rows.length*30+14;
  D.round(c,24,y,CW-48,h,14,'rgba(11,26,21,.92)',rgba(col,.9));rows.forEach((r,i)=>text(c,r,40,y+30+i*30,22,col));
}

// ── frame ─────────────────────────────────────────────────────────────────
const vis=(k,tau,s0,d,s1=9)=>k<s0||k>s1?0:k>s0?1:ease((tau-d)/.6);
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const st=s.compSt||(s.compSt={});
  if(st.k===undefined){st.k=k;st.from=-1;st.T=t-20;st.start=s.start;}
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;st.start=s.start;}
  else if(st.start!==s.start){st.start=s.start;st.from=-1;st.T=t;}   // the same step clicked again: replay it
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(s0,d,s1)=>{const now=vis(k,tau,s0,d,s1);if(!moving)return now;const was=vis(st.from,20,s0,0,s1);return now>=was?now:mix(was,now,u);};
  const sc=j=>j>=3?1:0,swap=moving&&sc(st.from)!==sc(k);
  const listA=swap?(sc(k)===0?smooth(clamp(x*2-1)):1-smooth(clamp(x*2))):A(0,0,2);
  const webA=swap?(sc(k)===1?smooth(clamp(x*2-1)):1-smooth(clamp(x*2))):A(3,0,3);
  // layout index (0, 1, 2) now and before; positions mix between them while moving
  const lay=j=>Math.min(2,Math.max(0,j));
  const jT=lay(k),jF=st.from<0||st.from>=3?jT:lay(st.from),blend=(f)=>moving&&jF!==jT?f(jF,jT,u):f(jT,jT,1);
  const venU=blend((a,b,uu)=>mix(a===2?1:0,b===2?1:0,uu));      // 0 lists, 1 overlapping frames (frames morph smoothly)
  // the animals swap out-then-in between layouts (no gliding across each other): old place fades out, new place fades in
  const relay=moving&&jF!==jT,jE=relay&&x<.5?jF:jT,entF=relay?Math.abs(Math.cos(Math.PI*x)):1;

  // ── steps 0-2: two lists → overlapping frames ──
  if(listA>0)withA(c,listA,()=>{
    const RC={C:mixR(RECT[0].C,RECT[1].C,venU),D:mixR(RECT[0].D,RECT[1].D,venU)};
    // "only C" highlight (step 2, after tProt)
    const tProt=4.2,prot=k===2?clamp((tau-tProt)/.5):0;
    frame(c,RC.C,rgba(WHITE,.85),3);frame(c,RC.D,rgba(WHITE,.85),3);
    if(prot>0)withA(c,prot,()=>{glow(c,RC.C.x+RC.C.w/2,RC.C.y+RC.C.h/2,RC.C.w*.55,WHITE,.08+.04*Math.sin(t*2.4));frame(c,RC.C,WHITE,6,'rgba(0,0,0,0)');});
    // headers
    const hC=tag(c,T.placeC,RC.C.x,Y_HEAD,{col:WHITE,active:true});tag(c,T.five,hC.x+hC.w+10,Y_HEAD,{col:KIND});
    const hD=tag(c,T.placeD,RC.D.x+RC.D.w,Y_HEAD,{al:'right',col:WHITE,active:true});tag(c,T.five,hD.x-10,Y_HEAD,{al:'right',col:KIND});
    // shared links (step 1)
    const linkA=A(1,MOVE+.2,1)*(relay?(x<.5?entF:0):1);
    if(linkA>0)withA(c,linkA,()=>SHARED.forEach((sp,i)=>{const y=ROW0+i*ROWH;
      dashLine(c,[TX.C+TILE/2+4,y],[TX.D-TILE/2-4,y],WHITE,3,t*14+i*6);
      circle(c,480,y,15,'rgba(11,26,21,.95)',WHITE,2);text(c,'=',480,y+8,22,WHITE,'center',K.MONO);}));
    // entities
    const dimD=k===2?prot:0;
    ENT.forEach(({S,sp},i)=>{
      const p=pos(jE,S,sp);
      const pop=k===0?clamp((tau-(.4+i*.22))/.35):1;if(pop<=0)return;
      const br=1+.025*Math.sin(t*2+i*.7),a=entF*pop*(DONLY.includes(sp)?1-.65*dimD:1);
      animal(c,sp,p[0],p[1],TILE*br*(.6+.4*ease(pop)),a);
      // names: lists → C left of the tile, D right of it; frames → right of the tile (one name per shared kind)
      const nL=jE===2?0:1,nV=jE===2&&!(S==='D'&&SHARED.includes(sp))?1:0;
      withA(c,a*nL,()=>tag(c,NAME[sp],S==='C'?p[0]-TILE/2-10:p[0]+TILE/2+10,p[1]-20,{al:S==='C'?'right':'left',col:COLR[sp]}));
      withA(c,a*nV,()=>tag(c,NAME[sp],p[0]+TILE/2+10,p[1]-20,{col:COLR[sp]}));
    });
    // "off the list" box (step 2)
    if(prot>0)withA(c,prot,()=>{const r={x:642,y:112,w:288,h:228};dashRect(c,r,WHITE,t,3);
      tag(c,T.off,r.x+r.w-10,r.y+r.h-48,{al:'right',col:WHITE,dash:[7,5],dashOff:-t*10});});
    // numbered kinds 1..8 (step 2)
    const numA=A(2,0,2);
    if(numA>0)withA(c,numA,()=>['cat','ma','sp','gh','fr','lb','sn','vo'].forEach((sp,i)=>{
      const a=k===2?clamp((tau-(MOVE+.3+i*.22))/.25):1;if(a<=0)return;
      const [vx,vy]=VEN[sp];withA(c,a,()=>badge(c,i+1,vx-TILE/2+2,vy-TILE/2+2,KIND));}));
    // sub pills: only C / shared / only D (steps 1-2)
    const subA=A(1,MOVE+.6,2);
    if(subA>0)withA(c,subA,()=>{
      const items=[[T.onlyC,24,174,'l'],[T.shared,480,480,'c'],[T.onlyD,936,786,'r']],y=mix(Y_SUB[0],Y_SUB[1],venU);
      items.forEach(([p,x1,x2,al])=>{const w=tagW(c,p),l1=al==='l'?x1:al==='c'?x1-w/2:x1-w,l2=x2-w/2;
        tag(c,p,mix(l1,l2,venU),y,{col:KIND});});
    });
    // together: 8 kinds (step 2)
    const totA=A(2,MOVE+.3+8*.22+.2,2);
    if(totA>0)withA(c,totA,()=>{const w=tagW(c,T.total),r=tag(c,T.total,480-w/2,Y_TOT,{col:KIND,active:true});if(k===2&&!prot)ring(c,r,t,KIND);});
    if(prot>0)withA(c,prot,()=>{const w=tagW(c,T.protect);const r=tag(c,T.protect,Math.max(24,480-w/2),Y_PROT,{col:WHITE});ring(c,r,t+.3,WHITE);});
    // statements
    [[T.s0,KIND,0,3.0],[T.s1,WHITE,1,MOVE+1.6],[T.s2,KIND,2,tProt+1.2]].forEach(([p,col,j,d])=>{const a=A(j,d,j);
      withA(c,a,()=>statement(c,p,Y_ST,col,t,k===j));});
  });

  // ── step 3: the food web of C ──
  if(webA>0)withA(c,webA,()=>{
    const on=(t0)=>k===3?clamp((tau-t0)/.5):1;
    const rm=on(tR),bk=on(tB),bf=on(tF);
    // edges under the nodes
    EDGE.forEach(([a,b,p0,p1],i)=>{
      const g=k===3?clamp((tau-(MOVE+1.2+i*.35))/.5):1;if(g<=0)return;
      const fromGh=a==='gh';
      if(a==='gh'&&b==='ma'){                                    // the mantis' only food in this web: the line breaks
        if(bk<=0){arrowTo(c,p0,p1,g,WHITE,4);return;}
        const mx=(p0[0]+p1[0])/2,my=(p0[1]+p1[1])/2,gap=.14+.12*ease(bk),dx=p1[0]-p0[0],dy=p1[1]-p0[1];
        const q0=[mx-dx*gap,my-dy*gap],q1=[mx+dx*gap,my+dy*gap];
        K.sline(c,[p0,q0],rgba(ORANGE,mix(.9,.75,bk)),4);arrowTo(c,q1,p1,1,rgba(ORANGE,.75),4);
        withA(c,bk,()=>{const zx=mx,zy=my,s8=7+1.5*Math.sin(t*4);
          c.save();c.strokeStyle=ORANGE;c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(zx-s8,zy-s8);c.lineTo(zx+s8,zy+s8);c.moveTo(zx+s8,zy-s8);c.lineTo(zx-s8,zy+s8);c.stroke();c.restore();
          const r=tag(c,T.brk,zx-18,zy-6,{al:'right',col:ORANGE});if(k===3)ring(c,r,t+.2,ORANGE);});
        return;}
      if(fromGh&&rm>0){                                          // the grasshopper's other arrow fades to faint dashes
        withA(c,1-rm,()=>arrowTo(c,p0,p1,g,WHITE,4));withA(c,rm,()=>dashLine(c,p0,p1,rgba(WHITE,.35),3,t*10));return;}
      if(a==='cat'&&b==='fr'&&bf>0){                              // the frog's other food: buffer
        const pul=.5+.5*Math.sin(t*3);
        withA(c,bf,()=>{c.save();c.shadowColor=YELLOW;c.shadowBlur=14+8*pul;arrowTo(c,p0,p1,1,YELLOW,6+2*pul);c.restore();});
        withA(c,1-bf,()=>arrowTo(c,p0,p1,g,WHITE,4));
        withA(c,bf,()=>{const mx=(p0[0]+p1[0])/2,my=(p0[1]+p1[1])/2;const r=tag(c,T.buf,mx-16,my-4,{al:'right',col:YELLOW,active:true});if(k===3)ring(c,r,t,YELLOW);});
        return;}
      arrowTo(c,p0,p1,g,WHITE,4);
    });
    // nodes
    WEB.forEach((sp,i)=>{const a=k===3?clamp((tau-(MOVE+.1+i*.2))/.35):1;if(a<=0)return;
      const [x0,y0]=NODE[sp],br=1+.02*Math.sin(t*2+i),gone=sp==='gh'?rm:0;
      withA(c,a*(1-.65*gone),()=>{animal(c,sp,x0,y0,WT*br);tag(c,NAME[sp],x0,y0+WT/2+6,{al:'center',col:COLR[sp]});});
      if(gone>0)withA(c,gone,()=>{const s9=WT*.42;c.save();c.strokeStyle=ORANGE;c.lineWidth=6;c.lineCap='round';c.beginPath();
        c.moveTo(x0-s9,y0-s9);c.lineTo(x0+s9,y0+s9);c.moveTo(x0+s9,y0-s9);c.lineTo(x0-s9,y0+s9);c.stroke();c.restore();
        tag(c,T.removed,x0-WT/2-10,y0-20,{al:'right',col:ORANGE,active:true});});
    });
    // right panel: title + legend rows
    D.round(c,RP.x,RP.y,RP.w,RP.h,14,'rgba(22,51,43,.94)',C.edge);
    const ix=RP.x+16,tw=RP.w-32;let yy=RP.y+36;
    withA(c,on(MOVE),()=>{yy+=K.wrap(c,T.web,ix,yy,tw,22,WHITE,30)-30;});yy+=50;
    const rowsL=[[T.dir,WHITE,'arrow',MOVE+1.2],[T.bufRow,YELLOW,'buf',tF],[T.brkRow,ORANGE,'brk',tB]];
    rowsL.forEach(([p,col,kind,t0])=>{const a=on(t0),ty=yy;
      withA(c,a,()=>{const y=ty-8;
        if(kind==='arrow')arrowTo(c,[ix,y],[ix+44,y],1,WHITE,4);
        else if(kind==='buf'){c.save();c.shadowColor=YELLOW;c.shadowBlur=10;K.sline(c,[[ix,y],[ix+44,y]],YELLOW,6);c.restore();}
        else{K.sline(c,[[ix,y],[ix+14,y]],ORANGE,4);K.sline(c,[[ix+30,y],[ix+44,y]],ORANGE,4);}
        K.wrap(c,p,ix+56,ty,tw-56,22,col,30);});
      yy+=K.splitLines(c,D.tr(p),tw-56,22).length*30+24;});
    withA(c,on(MOVE+1.2),()=>K.wrap(c,T.only5,ix,RP.y+RP.h-88,tw,22,MUTED,30));
    // statement
    withA(c,A(3,tS,3),()=>statement(c,T.s3,Y_ST,WHITE,t,k===3));
  });

  // notes (all steps)
  text(c,T.teach,24,590,22,MUTED,'left');
  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),CW-12,590,22,MUTED,'right');
}
window.EnvironmentDraw=window.EnvironmentDraw||{};
window.EnvironmentDraw.composition=draw;
})();

/* Ecology lesson 3 · "resource" canvas (competition tab, view 1), 2026-10-24. The AMOUNT of one shared resource changes the pressure.
 * Option s.res: 0 scarce (default), 1 plentiful. Switching redraws at once from the new option (no cross-fade, nothing of the other left).
 * No food-chain arrow, no eaten/eater roles, no energy (lesson 2). Not the compete scene: a closer crop of EC9 with program-drawn sap.
 * Picture (K.SIZE, measured with PIL): EC9_beetles_sap 1400x1167, drawn cropped to x 40..1380, y 50..1140 (picture px).
 * EC9 rim cleanup as in compete: only light low-saturation pixels within 2 px of transparency are cleared.
 * EC9 anchors (picture px, PIL): upper sap pool centre (725,250) (wound x 600..850, y 110..400), lower sap run (705,900)
 *   (x 645..765, y 720..1085), drip tip (703,1090), rhino head (540,600), rhino elytra (150,600), stag head (930,640), stag elytra (1200,650).
 * Program sap on top of the picture: scarce = the picture's sap areas tinted bark-dry, one thin small wet spot, one slow bead;
 *   plentiful = big glossy amber pool and run, twinkling glints, a shine sliding down, many drops falling from the drip.
 * Three steps, 8 s each; s.shown = step. Elements carry the steps they live in; a step change fades only what changes.
 *  0 one resource, two rivals: sap pill + leader; option pill; name pills under the picture; dashed "want" lines from both heads;
 *    right card "Shared resource" with the amount of sap as drop icons (scarce 3, plentiful 12) and "Limited" / ENOUGH.
 *  1 what each gets: drops fly from the pool into each beetle's 4 portion cups (scarce 1 each, plentiful 4 each); competition
 *    pressure bar (high / low, no numbers, slight wobble); signs: scarce solid orange "− / −" + "Harmed", plentiful faint dashed
 *    "− / −" + LIGHT note; sign legend under the picture.
 *  2 the model is not a measurement: MODEL heading; 3 checklist rows with boxes ticked one by one (drawn, not clickable);
 *    a magnifier slowly scans the sap ("observe on site"); "Schematic" pill.
 * Labels from K.LAB; new labels defined here as P(): ENOUGH, LIGHT, MODEL, CHECK (3 rows), SIGNS2 (built from LAB.minus).
 */
(()=>{'use strict';
const K=window.EcologyKit,{P,C,D,clamp,mix,mod,smooth,ease,rgba,text,measure,glow,circle}=K;
const L=(k,zh,en)=>(K.LAB&&K.LAB[k])||P(zh,en);
// new labels (not in K.LAB)
const ENOUGH=P('夠分','Enough to share');
const LIGHT=P('− 比較輕，甚至看不出競爭','− is lighter, maybe no evident competition');
const MODEL=P('模型不是量測','The model is not a measurement');
const CHECK=[P('指出共用的資源','Name the shared resource'),P('確認它真的不足','Show it is really short'),P('到現場觀察','Observe on site')];
const N=3,PER=8,CW=960,MOVE=.8;
const WHITE=C.white,YELLOW=C.yellow,ORANGE=C.orange,MUTED=C.muted,SAP='#e0a04a',SAPL='#f6c56b';

// ── layout ────────────────────────────────────────────────────────────────
const EC9='EC9_beetles_sap.png',CR={x:40,y:50,w:1340,h:1090};
const KS=Math.min(572/CR.w,466/CR.h),PR={x:14,y:16+(466-CR.h*KS)/2,w:CR.w*KS,h:CR.h*KS};
const ep=(px,py)=>[PR.x+(px-CR.x)*KS,PR.y+(py-CR.y)*KS];
const POOL=ep(725,250),RUN=ep(705,900),DRIP=ep(703,1090),RH_HEAD=ep(540,600),RH_BODY=ep(150,600),ST_HEAD=ep(930,640),ST_BODY=ep(1200,650);
const RX0=606,RX1=948;                                              // right column
const CUPX=620,CUPS=4,CUPDX=52,ROWS=[{y:84,name:'rhinoBeetle',zh:'獨角仙',en:'Rhinoceros beetle'},{y:178,name:'stagBeetle',zh:'鍬形蟲',en:'Stag beetle'}];
const BAR={x:RX0+6,y:300,w:RX1-RX0-14,h:28};

// ── picture rim cleanup (once, only 2 px deep) ──
let CLEAN=null;
function cleaned(){
  if(CLEAN)return CLEAN;const im=K.pic(K.src(EC9));if(!im)return null;
  try{const W=im.naturalWidth,H=im.naturalHeight,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,W,H),a=d.data,n=W*H,dep=new Uint8Array(n).fill(255),q=new Int32Array(n);let h=0,e=0;
    const light=i=>{const j=i*4,r=a[j],gg=a[j+1],b=a[j+2];return a[j+3]>=20&&(r+gg+b)/3>150&&Math.max(r,gg,b)-Math.min(r,gg,b)<70;};
    for(let i=0;i<n;i++)if(a[i*4+3]<20){dep[i]=0;q[e++]=i;}
    while(h<e){const i=q[h++];if(dep[i]>=2)continue;const x=i%W;
      for(const k of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(k>=0&&k<n&&dep[k]===255&&light(k)){dep[k]=dep[i]+1;q[e++]=k;}}
    for(let i=0;i<n;i++)if(dep[i]<255)a[i*4+3]=0;
    g.putImageData(d,0,0);CLEAN=cv;}catch(err){CLEAN=im;}
  return CLEAN;
}
function picture(c){
  const cv=cleaned();
  if(!cv){K.drawIn(c,EC9,PR,{crop:[CR.x/1400,CR.y/1167,CR.w/1400,CR.h/1167]});return;}
  c.drawImage(cv,CR.x,CR.y,CR.w,CR.h,PR.x,PR.y,PR.w,PR.h);
}

// ── helpers ───────────────────────────────────────────────────────────────
const withA=(c,a,fn)=>{if(a<=0.002)return;c.save();c.globalAlpha*=Math.min(1,a);fn();c.restore();};
function tag(c,p,x,y,{al='left',col=WHITE,active=false,size=22,fill='rgba(11,26,21,.92)',minX=8,maxX=CW-8,dash=null}={}){
  const w=measure(c,p,size)+28,h=size+18,bx=Math.max(minX,Math.min(maxX-w,al==='right'?x-w:al==='center'?x-w/2:x));
  c.save();if(dash)c.setLineDash(dash);D.round(c,bx,y,w,h,h/2,active?col:fill,active?WHITE:rgba(col,.9));c.restore();
  text(c,p,bx+w/2,y+h/2+size*.36,size,active?C.deep:col,'center');
  return{x:bx,y,w,h};
}
function pulseRing(c,p,t,col=YELLOW){const u=mod(t*.7);D.round(c,p.x-6*u,p.y-6*u,p.w+12*u,p.h+12*u,p.h/2+6*u,null,rgba(col,.8*(1-u)));}
function dline(c,p0,p1,col,t,w=3,dash=[8,7]){
  c.save();c.lineCap='round';c.setLineDash(dash);c.lineDashOffset=-t*14;c.beginPath();c.moveTo(...p0);c.lineTo(...p1);c.strokeStyle=rgba(col,.85);c.lineWidth=w;c.stroke();c.restore();
}
function leader(c,p0,p1,col,t){dline(c,p0,p1,col,t);circle(c,p1[0],p1[1],7,col,C.ink,2);K.pulse(c,p1[0],p1[1],t,col,8);}
function drop(c,x,y,r,fill,stroke,w=2){                               // teardrop, (x,y) = centre of the round part
  c.beginPath();c.moveTo(x,y-r*1.9);c.bezierCurveTo(x+r*.35,y-r*1.25,x+r,y-r*.65,x+r,y);c.arc(x,y,r,0,Math.PI);c.bezierCurveTo(x-r,y-r*.65,x-r*.35,y-r*1.25,x,y-r*1.9);c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
  if(fill)circle(c,x-r*.38,y-r*.25,r*.22,rgba(WHITE,.75));
}
function cup(c,x,y,fill,t,ph){                                       // a schematic portion cup, top-left (x,y), 34 x 34
  const top=[[x,y],[x+34,y]],bot=[[x+29,y+34],[x+5,y+34]];
  c.save();c.beginPath();c.moveTo(...top[0]);c.lineTo(...top[1]);c.lineTo(...bot[0]);c.lineTo(...bot[1]);c.closePath();
  if(fill>0){c.save();c.clip();const lv=y+34-34*fill*(.86+.03*Math.sin(t*2.4+ph));
    const g=c.createLinearGradient(0,lv,0,y+34);g.addColorStop(0,SAPL);g.addColorStop(1,SAP);c.fillStyle=g;c.fillRect(x-2,lv,38,40);
    c.fillStyle=rgba(WHITE,.55);c.fillRect(x+5,lv+2,10,3);c.restore();
    c.strokeStyle=SAPL;c.lineWidth=3;c.stroke();}
  else{c.setLineDash([5,5]);c.strokeStyle=rgba(WHITE,.55);c.lineWidth=2.5;c.stroke();}
  c.restore();
}
function tick(c,x,y,col,u,w=5){                                      // drawn check mark, u = 0..1
  const pts=[[x-11,y],[x-3,y+9],[x+13,y-11]],L1=Math.hypot(8,9),L2=Math.hypot(16,20),d=clamp(u)*(L1+L2);if(d<=0)return;
  const p=d<=L1?K.lerpP(pts[0],pts[1],d/L1):K.lerpP(pts[1],pts[2],(d-L1)/L2);
  K.sline(c,d<=L1?[pts[0],p]:[pts[0],pts[1],p],col,w);
}
// soft ellipse with a radial gradient (canvas coords), stops = [[pos,colour],...]
function softEllipse(c,x,y,rx,ry,stops,rot=0){
  c.save();c.translate(x,y);c.rotate(rot);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);stops.forEach(([p,col])=>g.addColorStop(p,col));
  c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fill();c.restore();
}

// ── program-drawn sap ────────────────────────────────────────────────────
const R=K.rng(1024),GLINTS=Array.from({length:22},(_,i)=>{const up=i<14,a=R()*Math.PI*2,rr=Math.sqrt(R());
  return up?{x:POOL[0]+Math.cos(a)*rr*52,y:POOL[1]+Math.sin(a)*rr*48,ph:R()*6}:{x:RUN[0]+(R()-.5)*30,y:RUN[1]+(R()-.5)*120,ph:R()*6};});
function sapScarce(c,t){
  // the picture's wet areas look dried (bark tint), only a thin small spot stays wet
  const DRY='94,74,58';
  softEllipse(c,POOL[0],POOL[1]+4,60,62,[[0,`rgba(${DRY},.9)`],[.65,`rgba(${DRY},.74)`],[1,`rgba(${DRY},0)`]]);
  softEllipse(c,RUN[0],RUN[1],30,86,[[0,'rgba(104,86,70,.9)'],[.7,'rgba(104,86,70,.7)'],[1,'rgba(104,86,70,0)']]);
  softEllipse(c,DRIP[0],DRIP[1]-10,14,20,[[0,'rgba(104,86,70,.85)'],[1,'rgba(104,86,70,0)']]);
  const sx=POOL[0]+2,sy=POOL[1]+6,b=1+.06*Math.sin(t*2.2);
  softEllipse(c,sx,sy,18*b,12*b,[[0,rgba(SAPL,1)],[.55,rgba(SAP,.9)],[1,rgba(SAP,0)]]);
  for(const [dx,dy,ph] of [[-12,-8,0],[10,-6,2]])circle(c,sx+dx,sy+dy,2.6,rgba(SAP,.95),rgba(WHITE,.25+.5*Math.max(0,Math.sin(t*2.4+ph))),1.5);
  circle(c,sx-4,sy-3,2.4,rgba(WHITE,.55+.4*Math.max(0,Math.sin(t*3))));
  const q=mod(t/3.6);                                                // one slow bead
  if(q<.55){const r=1.5+3*q/.55;circle(c,sx+2,sy+10+r*.5,r,rgba(SAP,.95));}
  else{const v=(q-.55)/.45;withA(c,1-smooth(v),()=>drop(c,sx+2,sy+16+v*v*20,3.2,SAP));}
}
function sapPlenty(c,t){
  const b=1+.03*Math.sin(t*1.8);
  softEllipse(c,POOL[0],POOL[1]+6,74*b,70*b,[[0,rgba(SAPL,.78)],[.55,rgba(SAP,.62)],[1,rgba(SAP,0)]]);
  softEllipse(c,RUN[0],RUN[1],34,94,[[0,rgba(SAPL,.72)],[.6,rgba(SAP,.55)],[1,rgba(SAP,0)]]);
  softEllipse(c,DRIP[0],DRIP[1]-14,12,24,[[0,rgba(SAPL,.8)],[1,rgba(SAP,0)]]);
  const v=mod(t/2.6),sy=RUN[1]-90+v*170;                             // shine sliding down the run
  withA(c,Math.sin(v*Math.PI),()=>softEllipse(c,RUN[0],sy,12,22,[[0,rgba(WHITE,.6)],[1,rgba(WHITE,0)]]));
  GLINTS.forEach(g=>{const a=Math.max(0,Math.sin(t*2.6+g.ph));if(a>.05)circle(c,g.x,g.y,1.4+2*a,rgba(WHITE,.35+.6*a));});
  for(let i=0;i<4;i++){const q=mod(t/1.8+i/4),x=DRIP[0]+(i%2?3:-3);  // many drops from the drip
    if(q<.35){const r=2+4*q/.35;circle(c,x,DRIP[1]+r*.5,r,rgba(SAP,.95));}
    else{const u=(q-.35)/.65;withA(c,1-smooth(u),()=>drop(c,x,DRIP[1]+8+u*u*14,4.2,SAP));}}
  for(const [dx,ph] of [[-40,0],[38,.5]]){const q=mod(t/2.4+ph),x=POOL[0]+dx,y=POOL[1]+30+q*26;   // runs over the pool rim
    withA(c,Math.sin(q*Math.PI),()=>drop(c,x,y,3.6,SAPL));}
}

// ── frame ─────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k}=K.stageClock(s,t,N,PER);
  s.shown=k;
  const res=(s.res|0)===1?1:0,st=s.resSt||(s.resSt={});
  if(st.k===undefined||st.res!==res){st.k=k;st.res=res;st.from=-1;st.T=t-9;}   // option change: show the new option in full at once
  if(st.k!==k){st.from=st.k;st.k=k;st.T=t;}
  if(t<st.T){st.T=t;st.from=-1;}
  const tau=t-st.T,x=clamp(tau/MOVE),moving=st.from>=0&&x<1,u=moving?smooth(x):1;
  const A=(steps,d)=>{const inK=steps.includes(k),inF=st.from>=0&&steps.includes(st.from);
    const now=!inK?0:inF?1:ease((tau-d)/.7);
    if(!moving)return now;const was=inF?1:0;return now>=was?now:mix(was,now,u);};
  const plenty=res===1;

  // ── picture + program sap (all steps) ──
  picture(c);
  if(plenty)sapPlenty(c,t);else sapScarce(c,t);

  // ── always: sap pill with leader, option pill, names under the picture ──
  const sp=tag(c,L('sap','樹液','Tree sap'),RX0,16,{col:YELLOW});
  leader(c,[sp.x,sp.y+sp.h/2],[POOL[0]+(plenty?50:30),POOL[1]-(plenty?8:12)],YELLOW,t);
  const op=tag(c,plenty?L('plentiful','資源多','Plentiful'):L('scarce','資源少','Scarce'),RX1,16,{al:'right',col:plenty?C.green:ORANGE,active:true,minX:sp.x+sp.w+10});
  pulseRing(c,op,t,plenty?C.green:ORANGE);
  const nA=tag(c,L('rhinoBeetle','獨角仙','Rhinoceros beetle'),24,494,{col:WHITE});
  const nB=tag(c,L('stagBeetle','鍬形蟲','Stag beetle'),Math.max(nA.x+nA.w+16,380),494,{col:WHITE,maxX:RX0-8});
  leader(c,[nA.x+30,nA.y],RH_BODY,WHITE,t);leader(c,[nB.x+nB.w*.6,nB.y],ST_BODY,WHITE,t+.5);

  // ── step 0: one resource, two rivals ──
  withA(c,A([0],.4),()=>{
    for(const [h,o] of [[RH_HEAD,0],[ST_HEAD,.6]]){dline(c,h,POOL,WHITE,t+o,2.5,[5,7]);circle(c,h[0],h[1],6,WHITE,C.ink,2);K.pulse(c,h[0],h[1],t+o,WHITE,9);}
  });
  withA(c,A([0],.9),()=>{
    D.round(c,RX0,80,RX1-RX0,330,16,'rgba(28,61,52,.95)',rgba(WHITE,.35));
    text(c,L('sharedResource','共用的資源','Shared resource'),(RX0+RX1)/2,118,24,WHITE,'center');
    const n=plenty?12:3,cols=4,cx=(RX0+RX1)/2,dx=62,dy=66,y0=178;
    for(let i=0;i<n;i++){const r=i/cols|0,cI=i%cols,rowN=Math.min(cols,n-r*cols),px=cx+(cI-(rowN-1)/2)*dx,py=y0+r*dy+(plenty?0:dy);
      const g=k===0&&!moving?clamp((tau-1.3-i*.12)/.4):1,bob=2*Math.sin(t*2+i*.7);
      if(g>0)drop(c,px,py+bob,12*(.5+.5*ease(g)),SAP,SAPL,2);}
    const p=tag(c,plenty?ENOUGH:L('limited','有限','Limited'),cx,354,{al:'center',col:plenty?C.green:ORANGE,minX:RX0+8,maxX:RX1-8});
    if(k===0)pulseRing(c,p,t,plenty?C.green:ORANGE);
  });

  // ── step 1: what each gets, pressure, signs ──
  const get=plenty?4:1;
  withA(c,A([1],.3),()=>{
    ROWS.forEach((rw,ri)=>{
      text(c,L(rw.name,rw.zh,rw.en),RX0+4,rw.y+22,22,WHITE);
      for(let j=0;j<CUPS;j++){const cx=CUPX+j*CUPDX,cy=rw.y+38,t0=.6+(ri*get+j)*.35*(plenty?1:2.2);
        const full=j<get?(k===1&&!moving?clamp((tau-t0-.45)/.35):1):0;
        cup(c,cx,cy,full,t,j+ri);
        if(j<get&&k===1&&!moving){const g=clamp((tau-t0)/.5);   // a drop flies from the pool to this cup
          if(g>0&&g<1){const end=[cx+17,cy+8],mid=[mix(POOL[0],end[0],.5),Math.min(POOL[1],end[1])-60],p=K.bez(POOL,mid,end,smooth(g));drop(c,p[0],p[1],6,SAP,SAPL,1.5);}}}
    });
  });
  withA(c,A([1],1.4),()=>{
    text(c,L('pressure','競爭壓力','Competition pressure'),RX0+4,BAR.y-12,22,YELLOW);
    const target=plenty?.18:.88,g=k===1&&!moving?ease((tau-1.6)/1.4):1,f=clamp(target*g+.015*Math.sin(t*3.1));
    D.round(c,BAR.x,BAR.y,BAR.w,BAR.h,BAR.h/2,'rgba(11,26,21,.92)',rgba(WHITE,.6));
    if(f>.02){c.save();c.beginPath();c.roundRect(BAR.x+3,BAR.y+3,(BAR.w-6)*f,BAR.h-6,(BAR.h-6)/2);const gr=c.createLinearGradient(BAR.x,0,BAR.x+BAR.w,0);
      gr.addColorStop(0,YELLOW);gr.addColorStop(1,ORANGE);c.fillStyle=gr;c.fill();c.restore();
      const hx=BAR.x+3+(BAR.w-6)*f;glow(c,hx,BAR.y+BAR.h/2,22,YELLOW,.4+.2*Math.sin(t*4));}
  });
  const minus=D.tr(L('minus','−','−')),SIGNS2=P(`${minus} / ${minus}`,`${minus} / ${minus}`);
  withA(c,A([1],2.8),()=>{
    if(!plenty){
      const p=tag(c,SIGNS2,RX0+4,350,{col:ORANGE,active:true,size:28});pulseRing(c,p,t,ORANGE);glow(c,p.x+p.w/2,p.y+p.h/2,p.w*.8,ORANGE,.12+.06*Math.sin(t*2.4));
      text(c,L('loss','受害','Harmed'),p.x+p.w+16,p.y+p.h/2+9,24,ORANGE);
    }else{
      withA(c,.62+.12*Math.sin(t*2),()=>{const p=tag(c,SIGNS2,RX0+4,350,{col:ORANGE,size:28,fill:'rgba(11,26,21,.6)',dash:[7,6]});
        text(c,L('loss','受害','Harmed'),p.x+p.w+16,p.y+p.h/2+9,22,rgba(ORANGE,.9));});
      K.wrap(c,LIGHT,RX0+4,428,RX1-RX0-8,22,WHITE,30);
    }
  });
  withA(c,A([1],3.4),()=>{tag(c,L('signLegend','＋ 得益　− 受害　0 看不出明顯影響','+ gains · − harmed · 0 no evident effect'),14,548,{col:WHITE,maxX:660});});

  // ── step 2: the model is not a measurement ──
  withA(c,A([2],.3),()=>{
    D.round(c,RX0,80,RX1-RX0,354,16,'rgba(28,61,52,.95)',rgba(YELLOW,.45+.2*Math.sin(t*2)));
    K.wrap(c,MODEL,RX0+18,116,RX1-RX0-36,24,YELLOW,32);
    CHECK.forEach((p,i)=>{const y=190+i*78,bx=RX0+18,g=k===2&&!moving?clamp((tau-1.2-i*1.1)/.5):1;
      D.round(c,bx,y-17,34,34,7,'rgba(11,26,21,.9)',rgba(WHITE,.8));
      tick(c,bx+17,y,C.green,g);
      if(g>=1&&k===2){const v=mod(t*.6+i*.33);D.round(c,bx-4*v,y-17-4*v,34+8*v,34+8*v,8,null,rgba(C.green,.7*(1-v)));}
      K.wrap(c,p,bx+50,y+8,RX1-bx-60,22,WHITE,30);});
    // magnifier scanning the sap: observe on site
    const a=t*.7,mx=POOL[0]+Math.cos(a)*34,my=POOL[1]+12+Math.sin(a*1.3)*26;
    circle(c,mx,my,28,'rgba(242,236,217,.08)',WHITE,4);K.sline(c,[[mx+20,my+20],[mx+40,my+40]],WHITE,7);
  });
  withA(c,A([2],1.0),()=>{tag(c,L('schematic','示意','Schematic'),14,548,{col:MUTED});});

  text(c,L('aiNote','AI 插圖，非實拍','AI illustration, not a photo'),RX1,590,22,MUTED,'right');
}
window.EcologyDraw.resource=draw;
})();

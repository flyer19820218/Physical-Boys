/* Microorganisms · "Which kingdom is it?" canvas (food tab, view 0), 2026-10-22.
 * Four subjects, one per step: rain mushroom (prokaryotes), red alga / nori (protists), shiitake (fungi), reishi (fungi).
 * Left: the subject (AI illustrations). For the red alga, the alga on its rock is shown first, then an arrow to the
 * dried nori sheet made from red algae. Right: the three kingdoms as a three-way choice, then three evidence rows
 * revealed one by one (nucleus? photosynthesis? nutrients absorbed from outside, cell wall?). Each answer that rules
 * a kingdom out dims that card and marks it with an orange cross; finally the answer card turns solid yellow.
 * Ticks (green) = yes, crosses (orange) = no, as in the five-kingdom flow of naming_classification_1021_v1.js.
 * Step changes cross-fade: the old subject slides out, old answers fade, the cards ease back to neutral.
 * Reishi is taught for classification only (not as food); the rain mushroom for classification only (not for gathering).
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,clamp,mix,mod,ease,rgba,line,circle,text,measure,splitLines,glow,arrow,panel,fade,stageClock,place,fitRect,drawIn,FONT}=K;
const N=4,PER=9.5;
const YES=C.green,NO=C.orange;
const isEn=()=>D.tr([0,1])===1;

const KING=[P(`原核生物界`,`Prokaryotes`),P(`原生生物界`,`Protists`),P(`真菌界`,`Fungi`)];
const Q=[P(`有細胞核嗎？`,`Is there a nucleus?`),P(`能行光合作用嗎？`,`Can it photosynthesize?`),P(`從外界吸收養分、有細胞壁嗎？`,`Absorbs nutrients from outside? A cell wall?`)];
const SELF=P(`不是：養分靠光合作用自己製造`,`No: it makes its own food by photosynthesis`),WALL=P(`有細胞壁`,`It has a cell wall`),NUC=P(`有細胞核`,`Yes, it has a nucleus`);
// ev[i] = answer parts of evidence row i: [yes?, text]. out[i] = cards ruled out by that row.
const SUBJ=[
 {name:P(`雨來菇`,`Rain mushroom`),ans:0,
  pics:[{f:'nostoc_wet.png',box:[30,84,280,170],cap:P(`吸水後：膨脹、變綠`,`Soaked: swollen, green`),capY:284},
        {f:'nostoc_dry.png',box:[50,318,240,116],cap:P(`乾旱時：縮成黑色的殼`,`In drought: a black crust`),capY:468}],
  ev:[[[false,P(`沒有：DNA 沒有核膜包住`,`No: the DNA has no nuclear envelope`)]],
      [[true,P(`能，但沒有葉綠體`,`Yes, but it has no chloroplasts`)]],
      [[false,SELF],[true,WALL]]],
  out:[[1,2],[],[]],
  note:P(`名字有「菇」，卻是藍綠菌，不是蘑菇`,`Not a mushroom: it is a cyanobacterium`)},
 {name:P(`紅藻／紫菜`,`Red alga / nori`),ans:1,
  pics:[{f:'red_alga.png',box:[60,80,220,180],cap:P(`紅藻（長在石頭上）`,`Red alga on a rock`),capY:290},
        {f:'nori.png',box:[116,368,108,108],cap:P(`紫菜片`,`Nori sheet`),capY:504,t0:.9}],
  arrow:{x:92,y0:308,y1:356,p:P(`採收、加工成片`,`Harvested, made into sheets`)},
  ev:[[[true,NUC]],
      [[true,P(`能，有葉綠體`,`Yes, with chloroplasts`)]],
      [[false,SELF],[true,WALL]]],
  out:[[0],[2],[]],
  note:P(`紫菜是紅藻加工成片的，也是原生生物`,`Nori is red alga made into sheets: a protist too`)},
 {name:P(`香菇`,`Shiitake`),ans:2,
  pics:[{f:'shiitake.png',box:[40,150,260,260],cap:P(`香菇`,`Shiitake`),capY:446}],
  ev:[[[true,NUC]],
      [[false,P(`不能：沒有葉綠體`,`No: it has no chloroplasts`)]],
      [[true,P(`是：從外界吸收養分`,`Yes: it absorbs nutrients from outside`)],[true,WALL]]],
  out:[[0],[],[1]],
  note:P(`沒有葉綠體，靠吸收外界的養分生活`,`No chloroplasts: it lives on absorbed nutrients`)},
 {name:P(`靈芝`,`Reishi`),ans:2,
  pics:[{f:'reishi.png',box:[40,150,260,260],cap:P(`靈芝`,`Reishi`),capY:434}],
  ev:[[[true,NUC]],
      [[false,P(`不能：沒有葉綠體`,`No: it has no chloroplasts`)]],
      [[true,P(`是：從外界吸收養分`,`Yes: it absorbs nutrients from outside`)],[true,WALL]]],
  out:[[0],[],[1]],
  note:P(`名字或用途，都不能改變牠的分類`,`Its name or uses cannot change its kingdom`)}];

// timing inside a step (seconds)
const T_EV=[1.7,3.3,4.9],T_OUT=.55,T_ANS=6.5;
const evTime=(k,i)=>T_EV[i]+(SUBJ[k].arrow?.4:0),ansTime=k=>T_ANS+(SUBJ[k].arrow?.4:0);

// ── small drawing helpers (same look as the five-kingdom flow) ──────────────
function outline(c,x,y,w,h,r,color,lw=3,dash=null){c.save();if(dash)c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=lw;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}
function rpulse(c,x,y,w,h,t,color=C.yellow,r=12){const u=mod(t*.8);outline(c,x-u*10,y-u*10,w+u*20,h+u*20,r+u*6,rgba(color,.9*(1-u)),3);}
function sweep(c,x,y,w,h,t,r=12,a=.2,speed=.4){c.save();c.beginPath();c.roundRect(x,y,w,h,r);c.clip();const sx=x-60+mod(t*speed,1)*(w+120),g=c.createLinearGradient(sx-50,0,sx+50,0);g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,a));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(sx-50,y,100,h);c.restore();}
function tick(c,x,y,r=13,color=YES){circle(c,x,y,r,color,null);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x-r*.45,y+r*.02);c.lineTo(x-r*.1,y+r*.38);c.lineTo(x+r*.48,y-r*.36);c.stroke();c.restore();}
function cross(c,x,y,r=13,color=NO){circle(c,x,y,r,color,null);c.save();c.strokeStyle=C.deep;c.lineWidth=Math.max(2.5,r*.24);c.lineCap='round';c.beginPath();c.moveTo(x-r*.38,y-r*.38);c.lineTo(x+r*.38,y+r*.38);c.moveTo(x+r*.38,y-r*.38);c.lineTo(x-r*.38,y+r*.38);c.stroke();c.restore();}
// numbered disc with a 22 px digit
function num(c,x,y,n,color){circle(c,x,y,15,color,C.ink,2);c.save();c.font=K.MONO(22);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
// Line breaking: Chinese breaks only after 、：，；。 (words stay whole, no punctuation at a line start);
// English breaks only at spaces (so "E. coli" and "Paramecium," stay intact).
function wrapRows(c,str,w){
  c.save();c.font=K.FONT(22);const fits=s=>c.measureText(s).width<=w,rows=[];let row='';
  const zh=/[一-鿿]/.test(str),chunks=zh?(str.match(/[^、：，；。]+[、：，；。]?/g)||[str]):str.split(/(?<=\s)/);
  for(const ch of chunks){
    if(row&&!fits(row+ch.trimEnd())){rows.push(row.trimEnd());row='';}
    if(!fits(ch.trimEnd())&&zh){for(const g of Array.from(ch)){if(row&&!fits(row+g)&&!/[、：，；。）」]/.test(g)){rows.push(row);row='';}row+=g;}}
    else row+=ch;}
  if(row.trim())rows.push(row.trimEnd());c.restore();return rows;
}
const rowsOf=(c,p,w)=>D.tr(p).split('\n').flatMap(seg=>wrapRows(c,seg,w));

// ── layout (right side) ────────────────────────────────────────────────────
const RX=350,RW=582,CW=(RW-24)/3,CARD_Y=66,CARD_H=54,ROW_Y0=136,QX=RX+50,AW=RW-64,LH=32;
// Answer parts flow left to right and wrap to a new line when they do not fit.
function placeParts(c,parts){
  const items=[];let x=0,ln=0;
  parts.forEach(([ok,p])=>{const tw=measure(c,p,22),w=34+tw;
    if(x>0&&x+w>AW){ln++;x=0;}
    if(w>AW){const rows=rowsOf(c,p,AW-34);items.push({ok,rows,x:0,ln});ln+=rows.length;x=0;}
    else{items.push({ok,rows:[D.tr(p)],x,ln});x+=w+28;}});
  return{items,lines:x>0?ln+1:ln};
}
let LAY=null;
function layout(c){
  const key=isEn()?'en':'zh';if(LAY&&LAY.key===key)return LAY;
  const base=Q.map((q,i)=>{const qr=rowsOf(c,q,RW-64),al=Math.max(...SUBJ.map(s=>placeParts(c,s.ev[i]).lines));return{qr,al,h:30+(qr.length-1)*28+12+al*LH+10};});
  // spread the rows over the free height above the answer banner (content centred in each row)
  const banH=46+28*Math.max(...SUBJ.map(s=>rowsOf(c,s.note,RW-40).length)),banY=580-banH,free=banY-14-ROW_Y0-base.reduce((a,b)=>a+b.h,0)-20,extra=Math.max(0,free/3);
  let y=ROW_Y0;const rows=base.map(b=>{const pad=extra/2,r={y,h:b.h+extra,qr:b.qr,qTop:pad,aTop:pad+30+(b.qr.length-1)*28+12};y+=r.h+10;return r;});
  return LAY={key,rows,banH,banY:Math.max(y+4,banY)};
}

// ── state of the three cards at (k, tau): dim (0..1 ruled out) and ans (0..1 answer shown) ──
function cards(k,tau){
  const s=SUBJ[k];return[0,1,2].map(j=>{
    let dim=0;s.out.forEach((list,i)=>{if(list.includes(j))dim=Math.max(dim,ease((tau-evTime(k,i)-T_OUT)/.5));});
    const ans=j===s.ans?ease((tau-ansTime(k))/.5):0;return{dim,ans};});
}
function drawCards(c,st,t,appear){
  text(c,P(`這是哪一界？三選一`,`Which kingdom? Pick one of three`),RX,48,24,C.yellow);
  st.forEach(({dim,ans},j)=>{
    const x=RX+j*(CW+12),y=CARD_Y;
    c.save();c.globalAlpha*=appear*mix(1,.36,dim);
    D.round(c,x,y,CW,CARD_H,12,ans>0?`rgba(253,224,71,${(.12+.88*ans).toFixed(3)})`:'rgba(11,26,21,.85)',null);
    outline(c,x,y,CW,CARD_H,12,ans>.5?C.white:rgba(C.white,.75),ans>.5?3:2);
    const col=ans>.5?C.deep:C.white,rows=rowsOf(c,KING[j],CW-20);
    rows.forEach((r,q)=>text(c,r,x+CW/2,y+CARD_H/2+8+(q-(rows.length-1)/2)*26,22,col,'center'));
    c.restore();
    if(ans>.5){glow(c,x+CW/2,y+CARD_H/2,CW*.7,C.yellow,(.18+.08*Math.sin(t*3))*ans);rpulse(c,x,y,CW,CARD_H,t);}
    if(dim>0){c.save();c.globalAlpha*=appear*dim;cross(c,x+CW-4,y+4,13);c.restore();}
  });
}

// ── evidence rows ──────────────────────────────────────────────────────────
function drawRowFrames(c,k,tau,t,a){
  const L=layout(c);
  L.rows.forEach((r,i)=>{
    const tE=evTime(k,i),act=tau>=tE-.5&&tau<tE+1.3?Math.sin(Math.PI*clamp((tau-tE+.5)/1.8)):0;
    D.round(c,RX,r.y,RW,r.h,12,'rgba(11,26,21,.6)',null);
    outline(c,RX,r.y,RW,r.h,12,rgba(C.edge,1),2);
    if(act>0){c.save();c.globalAlpha*=a*act;D.round(c,RX,r.y,RW,r.h,12,rgba(C.yellow,.1),null);outline(c,RX,r.y,RW,r.h,12,C.yellow,3);sweep(c,RX,r.y,RW,r.h,t,12,.16,.7);c.restore();}
    num(c,RX+24,r.y+r.qTop+23,i+1,act>.3?C.yellow:C.white);
    r.qr.forEach((row,q)=>text(c,row,QX,r.y+r.qTop+30+q*28,22,act>.3?C.yellow:C.white));
  });
}
function drawAnswers(c,k,tau,t,a){
  const L=layout(c),s=SUBJ[k];
  L.rows.forEach((r,i)=>{
    const tE=evTime(k,i),v=ease((tau-tE)/.45),y0=r.y+r.aTop;
    if(v<1){c.save();c.globalAlpha*=a*(1-v);text(c,'?',QX+14,y0+24,24,rgba(C.muted,.8),'center');c.restore();}
    if(v<=0)return;
    const {items}=placeParts(c,s.ev[i]);
    c.save();c.globalAlpha*=a*v;
    items.forEach((it,q)=>{const iv=ease((tau-tE-q*.35)/.4);if(iv<=0)return;c.save();c.globalAlpha*=iv;
      const x=QX+it.x+(1-iv)*14,col=it.ok?YES:NO;
      (it.ok?tick:cross)(c,x+13,y0+(it.ln)*LH+16,13);
      it.rows.forEach((row,z)=>text(c,row,x+34,y0+(it.ln+z)*LH+24,22,col));
      c.restore();});
    c.restore();
  });
}

// ── answer banner ──────────────────────────────────────────────────────────
function drawBanner(c,k,tau,t,a){
  const L=layout(c),y=L.banY,BAN_H=L.banH,s=SUBJ[k],v=ease((tau-ansTime(k))/.5);
  c.save();c.globalAlpha*=a;
  if(v<1){c.save();c.globalAlpha*=1-v;c.setLineDash([8,7]);D.round(c,RX,y,RW,BAN_H,14,'rgba(11,26,21,.5)',rgba(C.muted,.55));c.setLineDash([]);
    text(c,P(`答案：？`,`Answer: ?`),RX+RW/2,y+BAN_H/2+9,24,rgba(C.muted,.9),'center');c.restore();}
  if(v>0){c.save();c.globalAlpha*=v;
    D.round(c,RX,y,RW,BAN_H,14,rgba(C.yellow,.13),C.yellow);sweep(c,RX,y,RW,BAN_H,t+.3,14,.14,.35);
    text(c,[`答案：${D.tr(KING[s.ans])}`,`Answer: ${D.tr(KING[s.ans])}`],RX+RW/2,y+32,26,C.yellow,'center');
    rowsOf(c,s.note,RW-40).forEach((r,q)=>text(c,r,RX+RW/2,y+62+q*28,22,C.white,'center'));
    c.restore();}
  c.restore();
}

// ── subject (left panel) ───────────────────────────────────────────────────
function drawSubject(c,k,tau,t,a,dx){
  const s=SUBJ[k],bob=3*Math.sin(t*1.6);
  c.save();c.globalAlpha*=a;c.translate(dx,0);
  text(c,s.name,170,58,30,C.yellow,'center');
  s.pics.forEach((p,i)=>{
    const pa=p.t0?ease((tau-p.t0)/.6):1;if(pa<=0)return;
    const [bx,by,bw,bh]=p.box,r=fitRect(p.f,bx,by,bw,bh),cy=r.y+r.h/2;
    c.save();c.globalAlpha*=pa;
    glow(c,r.x+r.w/2,cy,Math.max(r.w,r.h)*.62,C.white,.07+.03*Math.sin(t*2+i));
    drawIn(c,p.f,{x:r.x,y:r.y+bob*(i?-1:1)+(1-pa)*16,w:r.w,h:r.h});
    rowsOf(c,p.cap,276).forEach((row,q)=>text(c,row,170,p.capY+q*28,22,C.white,'center'));
    c.restore();});
  if(s.arrow){const ar=s.arrow,v=ease((tau-.5)/.6);if(v>0){c.save();c.globalAlpha*=v;
      const y1=mix(ar.y0,ar.y1,v);arrow(c,ar.x,ar.y0,ar.x,y1,C.pink,3.5);
      // a dot travels down the arrow while the step is on screen
      const q=mod(t*.6,1);if(v>=1){glow(c,ar.x,mix(ar.y0,ar.y1-14,q),10,C.pink,.8*(1-q));}
      rowsOf(c,ar.p,206).forEach((row,z,all)=>text(c,row,ar.x+18,(ar.y0+ar.y1)/2+8+(z-(all.length-1)/2)*27,22,C.pink));
      c.restore();}}
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  // remember the previous step so a change cross-fades instead of jumping
  const st=s.tb||(s.tb={}),key=k+'|'+(held?s.start:'loop');
  if(st.key!==key){if(st.key!==undefined&&t-st.lastT<.3&&t>=st.lastT){st.fromK=st.k;st.fromTau=st.tau;st.from=t;}else st.from=-99;st.key=key;}
  const x=clamp((t-st.from)/.55),xi=ease(x),fromOn=x<1;
  st.k=k;st.tau=tau;st.lastT=t;

  panel(c,20,20,300,560);panel(c,330,20,610,560);
  // left: subject, sliding
  if(fromOn)drawSubject(c,st.fromK,st.fromTau,t,1-xi,-50*xi);
  drawSubject(c,k,tau,t,fromOn?xi:1,fromOn?50*(1-xi):0);
  const NOTE=P(`AI 插圖，示意，非同比例`,`AI illustration,\nnot to scale`),nr=rowsOf(c,NOTE,270);
  nr.forEach((row,q)=>text(c,row,170,566-(nr.length-1-q)*26,22,C.muted,'center'));

  // right: cards (state eased from the previous step), evidence rows, answer
  const cs=cards(k,tau),cf=fromOn?cards(st.fromK,st.fromTau):null;
  const mixed=cs.map((q,j)=>fromOn?{dim:mix(cf[j].dim,q.dim,xi),ans:mix(cf[j].ans,q.ans,xi)}:q);
  drawCards(c,mixed,t,1);
  drawRowFrames(c,k,tau,t,1);
  if(fromOn)drawAnswers(c,st.fromK,st.fromTau,t,1-xi);
  drawAnswers(c,k,tau,t,fromOn?xi:1);
  if(fromOn)drawBanner(c,st.fromK,st.fromTau,t,1-xi);
  drawBanner(c,k,tau,t,fromOn?xi:1);

  // header nudge before the first evidence: a ring breathes around the question
  if(tau<evTime(k,0)){const w=measure(c,P(`這是哪一界？三選一`,`Which kingdom? Pick one of three`),24);glow(c,RX+w/2,40,w*.6,C.yellow,.08+.05*Math.sin(t*4));}
  // the left panel is a click target that replays the current step
  D.hit(20,20,300,560,'phase',k);
}
window.MicroDraw.table=draw;
})();

/* Fossils · horse tab, view 3 "Not a straight line", 2026-10-21.
 * A schematic branching tree (time → right, body size ↑). The yellow path is the selected series of five horses
 * (thumbnails at one common scale); grey-green branches are other, unnamed relatives. Step 3 picks out branches that
 * stayed small or shrank (cyan); step 4 marks most branch tips extinct (orange ✕) and leaves one green branch at "now".
 * The branching is a schematic only; no real genus names are put on the side branches.
 */
(()=>{'use strict';
const K=window.FossilKit,{P,C,text,measure,circle,sline,dashed,arrow,glow,pulse,stageClock,fade,ease,mix,clamp,mod,at,D,rgba,SIZE}=K;
const N=4,PER=7;

// ── frame ──────────────────────────────────────────────────────────────────
const AX=100,AB=490,AT=78,NOWX=880;            // y axis x, x axis y, top of y axis, "now" line
const MUTED=C.muted;

// ── geometry helpers ───────────────────────────────────────────────────────
// Catmull-Rom curve through the points, sampled densely.
function smoothPts(pts,seg=16){
  const out=[],n=pts.length;
  for(let i=0;i<n-1;i++){
    const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(n-1,i+2)];
    for(let j=0;j<seg;j++){
      const u=j/seg,u2=u*u,u3=u2*u,
        f=k=>.5*(2*p1[k]+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u3);
      out.push([f(0),f(1)]);
    }
  }
  out.push(pts[n-1].slice());
  return out;
}
// A sampled path with cumulative lengths.
function mkPath(pts){
  const s=smoothPts(pts),L=[0];
  for(let i=1;i<s.length;i++)L.push(L[i-1]+Math.hypot(s[i][0]-s[i-1][0],s[i][1]-s[i-1][1]));
  return{s,L,len:L[L.length-1]};
}
// Point at fraction g (0..1) of the length.
function pointAt(p,g){
  const d=clamp(g)*p.len;let i=1;
  while(i<p.L.length-1&&p.L[i]<d)i++;
  const seg=p.L[i]-p.L[i-1]||1,u=(d-p.L[i-1])/seg;
  return[mix(p.s[i-1][0],p.s[i][0],u),mix(p.s[i-1][1],p.s[i][1],u)];
}
// The first fraction g of the path, as a polyline.
function partial(p,g){
  if(g>=1)return p.s;
  const d=clamp(g)*p.len,out=[p.s[0]];
  for(let i=1;i<p.s.length&&p.L[i]<d;i++)out.push(p.s[i]);
  out.push(pointAt(p,g));return out;
}
// Fraction along the path of the sample nearest in x.
function fracAtX(p,x){
  let best=0,bd=1e9;
  p.s.forEach((q,i)=>{const d=Math.abs(q[0]-x);if(d<bd){bd=d;best=i;}});
  return p.L[best]/p.len;
}

// ── the selected series (yellow) ───────────────────────────────────────────
const HORSES=[
  {file:'horse_1_hyracotherium.png',name:P('始祖馬','Hyracotherium'),p:[180,448]},
  {file:'horse_2_mesohippus.png',name:P('中新馬','Mesohippus'),p:[340,420]},
  {file:'horse_3_merychippus.png',name:P('草原古馬','Merychippus'),p:[500,350]},
  {file:'horse_4_pliohippus.png',name:P('上新馬','Pliohippus'),p:[650,285]},
  {file:'horse_5_equus.png',name:P('現代馬','Equus'),p:[800,232]}];
const ROOT=[118,460],NOWPT=[NOWX,214];
const YEL=mkPath([ROOT,...HORSES.map(h=>h.p),NOWPT]);
HORSES.forEach(h=>{h.g=fracAtX(YEL,h.p[0]);});
const EQ_G=HORSES[4].g;
const TH=.3;                                     // one common scale for all five skeletons
const thumbW=h=>SIZE[h.file][0]*TH,thumbH=h=>SIZE[h.file][1]*TH;

// ── other branches (schematic, unnamed) ────────────────────────────────────
// par: parent path ('Y' = yellow series), x: where on the parent it splits off. t0: when it starts to grow in step 2.
const BR=[
  {id:'A',par:'Y',x:140,t0:.2,pts:[[220,470],[310,474],[400,472]],small:true},
  {id:'D',par:'Y',x:240,t0:.6,pts:[[262,400],[290,345],[345,305],[410,295]]},
  {id:'E',par:'A',x:250,t0:1.2,pts:[[300,452],[355,446]]},
  {id:'B',par:'Y',x:340,t0:1.4,pts:[[400,428],[470,446],[545,456]],small:true},
  {id:'C',par:'B',x:455,t0:2.4,pts:[[520,425],[590,428]]},
  {id:'G',par:'Y',x:505,t0:2.6,pts:[[565,372],[625,370],[670,378]]},
  {id:'F',par:'Y',x:545,t0:3.0,pts:[[575,262],[600,185],[645,130],[700,106]],up:true},
  {id:'L',par:'G',x:600,t0:3.6,pts:[[640,402],[690,418],[740,414]]},
  {id:'H',par:'Y',x:655,t0:4.0,pts:[[690,345],[745,378],[805,390]]}];
const BYID={Y:YEL};
BR.forEach(b=>{
  // peel off smoothly: the first short stretch follows the parent's direction, bent towards the branch
  const par=BYID[b.par],g0=fracAtX(par,b.x),start=pointAt(par,g0),ahead=pointAt(par,Math.min(1,g0+.02)),
    tx=ahead[0]-start[0],ty=ahead[1]-start[1],tl=Math.hypot(tx,ty)||1,
    dx=b.pts[0][0]-start[0],dy=b.pts[0][1]-start[1],dl=Math.hypot(dx,dy)||1,
    lead=[start[0]+9*tx/tl+11*dx/dl,start[1]+9*ty/tl+11*dy/dl];
  b.path=mkPath([start,lead,...b.pts]);BYID[b.id]=b.path;
  b.end=b.pts[b.pts.length-1];
});
// order in which the extinction marks appear (left to right by tip)
const EXT=BR.slice().sort((a,b)=>a.end[0]-b.end[0]);

// ── small drawing helpers ──────────────────────────────────────────────────
function cross(c,x,y,r,color,w=4){
  c.save();c.lineCap='round';c.strokeStyle=color;c.lineWidth=w;c.beginPath();
  c.moveTo(x-r,y-r);c.lineTo(x+r,y+r);c.moveTo(x+r,y-r);c.lineTo(x-r,y+r);c.stroke();c.restore();
}
function withAlpha(c,a,fn){if(a<=0)return;c.save();c.globalAlpha*=a;fn();c.restore();}
// A dark-backed box holding one or two lines of text, right edge at xr. Returns the box.
function labelBox(c,lines,xr,y,color,size=22){
  const w=Math.max(...lines.map(l=>measure(c,l,size)))+28,lh=size+8,h=lines.length*lh+14;
  D.round(c,xr-w,y,w,h,12,'rgba(11,26,21,.92)',rgba(color,.9));
  lines.forEach((l,i)=>text(c,l,xr-w/2,y+7+size+i*lh-2,size,color,'center'));
  return{x:xr-w,y,w,h};
}

// ── axes, "now" line, schematic tag ────────────────────────────────────────
function drawFrame(c){
  arrow(c,AX,AB,AX,AT,rgba(C.white,.75),3);
  arrow(c,AX,AB,NOWX+30,AB,rgba(C.white,.75),3);
  text(c,P('體型','Size'),AX,AT-14,22,C.white,'center');
  text(c,P('大','Big'),AX-12,AT+30,22,C.white,'right');
  text(c,P('小','Small'),AX-12,AB-10,22,C.white,'right');
  text(c,P('很久以前','Long ago'),AX+6,AB+30,22,C.white,'left');
  text(c,P('時間','Time'),(AX+NOWX)/2,AB+30,22,C.white,'center');
  dashed(c,[[NOWX,AT+10],[NOWX,AB]],rgba(C.white,.32),2,[6,8]);
  text(c,P('現在','Now'),NOWX,AB+30,22,C.white,'center');
  // the schematic tag (always visible)
  const tag=P('示意圖，不是真實的分支','Schematic, not the real branching'),w=measure(c,tag,22)+28,x=940-w;
  c.save();c.setLineDash([6,5]);D.round(c,x,12,w,40,20,'rgba(11,26,21,.9)',rgba(C.white,.75));c.restore();
  text(c,tag,x+w/2,40,22,C.white,'center');
}

// ── bottom row: clickable step labels that double as the colour key ───────
const KEY=[
  {label:P('挑出的系列','Selected series'),color:C.yellow,icon:'line',w:8},
  {label:P('其他分支（示意）','Other branches'),color:MUTED,icon:'line',w:5},
  {label:P('體型沒有變大','Did not get bigger'),color:C.cyan,icon:'line',w:7},
  {label:P('已滅絕','Died out'),color:C.orange,icon:'cross'}];
function drawKey(c,k,t){
  const ws=KEY.map(q=>measure(c,q.label,22)+28+36),gap=12,total=ws.reduce((a,b)=>a+b,0)+gap*(KEY.length-1);
  let x=480-total/2;const y=546,h=40;
  KEY.forEach((q,i)=>{
    const on=i===k,seen=i<=k,w=ws[i];
    D.round(c,x,y,w,h,20,on?rgba(q.color,.2):'rgba(11,26,21,.88)',on?q.color:rgba(C.edge,1));
    if(on){c.save();c.lineWidth=3;c.strokeStyle=q.color;c.beginPath();c.roundRect(x,y,w,h,20);c.stroke();c.restore();}
    withAlpha(c,seen?1:.45,()=>{
      const ix=x+16,iy=y+h/2;
      if(q.icon==='line')sline(c,[[ix,iy+5],[ix+12,iy-1],[ix+24,iy-5]],q.color,Math.min(q.w,6));
      else cross(c,ix+12,iy,7,q.color,3.5);
      text(c,q.label,x+44+(w-58)/2,y+h/2+8,22,on?q.color:(seen?C.white:MUTED),'center');
    });
    D.hit(x,y,w,h,'phase',i);
    x+=w+gap;
  });
}

// ── tree parts ─────────────────────────────────────────────────────────────
function drawBranch(c,b,g,color,w){if(g>0)sline(c,partial(b.path,g),color,w);}
function drawSeries(c,grow,alpha,k,t,lightG){
  withAlpha(c,alpha,()=>{
    sline(c,partial(YEL,grow),rgba(C.yellow,.25),16);   // soft halo under the series line
    sline(c,partial(YEL,grow),C.yellow,8);
  });
  HORSES.forEach((h,i)=>{
    const a=fade(grow,h.g-.02,.06);if(a<=0)return;
    const [x,y]=h.p,tw=thumbW(h),th=thumbH(h);
    withAlpha(c,a,()=>{
      at(c,h.file,x,y-12-th/2,tw,{alpha:alpha<1?mix(.55,1,alpha):1});
      withAlpha(c,alpha,()=>circle(c,x,y,8,C.yellow,C.ink,2.5));
    });
  });
}
// the small light running along the series, in the direction of time
function drawLight(c,maxG,t,color=C.yellow){
  if(maxG<=.05)return null;
  const g=mod(t/6)*maxG,[x,y]=pointAt(YEL,g);
  glow(c,x,y,22,color,.9);circle(c,x,y,5,C.white,null);
  return g;
}

function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  drawFrame(c);
  // when looping, fade the finished tree out before it starts again
  const out=(!held&&k===3)?1-fade(tau,PER-.7,.7):1;
  c.save();c.globalAlpha*=out;

  if(k===0){
    // the series alone: it grows from the bottom-left, then the light reads along it and names each horse
    const grow=ease(tau/2.4);
    drawSeries(c,grow,1,k,t);
    const g=grow>=1?drawLight(c,1,t-2.4):null;
    if(g!=null){
      let idx=-1;HORSES.forEach((h,i)=>{if(g>=h.g-.005)idx=i;});
      if(idx>=0){
        const h=HORSES[idx],[x,y]=h.p,a=fade(g,h.g-.005,.03);
        withAlpha(c,a,()=>{pulse(c,x,y,t,C.yellow,9);text(c,h.name,x+14,y+34,22,C.yellow,'left');});
      }
    }
  }else if(k===1){
    // other branches grow out one by one; the series steps back a little
    drawSeries(c,1,.6,k,t);
    BR.forEach(b=>{
      const g=ease((tau-b.t0)/1.0);
      drawBranch(c,b,g,MUTED,5);
      if(g>0&&g<1){const [x,y]=pointAt(b.path,g);glow(c,x,y,14,MUTED,.8);}
    });
    drawLight(c,1,t);
  }else if(k===2){
    // branches that stayed small or shrank (cyan); one branch went up
    const a=fade(tau,0,.8);
    drawSeries(c,1,.45,k,t);
    BR.forEach(b=>{
      const hi=b.small||b.up;
      drawBranch(c,b,1,rgba(MUTED,hi?(b.up?mix(.6,1,a):.6):mix(.9,.4,a)),b.up?mix(5,6,a):5);
    });
    withAlpha(c,a,()=>{
      BR.filter(b=>b.small).forEach((b,i)=>{
        drawBranch(c,b,1,rgba(C.cyan,.25),16);
        drawBranch(c,b,1,C.cyan,7);
        const [x,y]=pointAt(b.path,mod(t/3.2+i*.5));glow(c,x,y,16,C.cyan,.9);
      });
    });
    // "some got bigger" on the branch that rises to the top
    const F=BR.find(b=>b.up),fa=fade(tau,1.2,.7);
    withAlpha(c,fa,()=>{
      const [ex,ey]=F.end,lab=P('有的變大','Some got bigger'),w=measure(c,lab,22)+28;
      D.round(c,ex+12,ey-20,w,40,20,'rgba(11,26,21,.92)',rgba(C.white,.8));
      text(c,lab,ex+12+w/2,ey+8,22,C.white,'center');
    });
  }else{
    // most tips go extinct (orange crosses); only one green branch reaches "now"
    drawSeries(c,1,.8,k,t);
    EXT.forEach((b,i)=>{
      const ti=.4+i*.38,dead=fade(tau,ti,.5);
      drawBranch(c,b,1,rgba(MUTED,mix(.9,.45,dead)),5);
    });
    EXT.forEach((b,i)=>{
      const ti=.4+i*.38,u=ease((tau-ti)/.45);if(u<=0)return;
      const [x,y]=b.end;
      withAlpha(c,u,()=>{circle(c,x,y,13*u,'rgba(11,26,21,.85)',null);cross(c,x,y,9*mix(1.6,1,u),C.orange,4.5);});
    });
    // green: the branch with Equus, on to today
    const gG=ease((tau-3.9)/1.1);
    if(gG>0){
      const pts=partial(YEL,1).filter(q=>q[0]>=HORSES[4].p[0]-1),seg=[];
      const endX=mix(HORSES[4].p[0],NOWX,gG);pts.forEach(q=>{if(q[0]<=endX)seg.push(q);});
      seg.push(pointAt(YEL,mix(EQ_G,1,gG)));
      sline(c,seg,rgba(C.green,.3),18);sline(c,seg,C.green,9);
      const [x,y]=HORSES[4].p;circle(c,x,y,9,C.green,C.ink,2.5);
      if(gG>=1)pulse(c,NOWPT[0],NOWPT[1],t,C.green,8);
      withAlpha(c,fade(tau,4.6,.6),()=>{
        const box=labelBox(c,[P('今天：','Today: horses,'),P('馬、驢、斑馬','asses, zebras')],944,286,C.green);
        sline(c,[[NOWPT[0]+16,box.y],[NOWPT[0]+4,NOWPT[1]+13]],C.green,3);
      });
    }
    drawLight(c,gG>=1?1:EQ_G,t);
  }
  c.restore();
  drawKey(c,k,t);
}
window.FossilDraw.tree=draw;
})();

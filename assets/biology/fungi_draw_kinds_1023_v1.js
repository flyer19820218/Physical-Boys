/* Fungi · "kinds" canvas (Tab 3, view 2: kinds of mushroom fungi), 2026-10-23.
 * Registers window.FungiDraw.kinds; called as draw(ctx, state, t) on the 960x600 canvas. Sets s.shown (stage 0..1).
 * Pictures (AI teaching illustrations by the teacher with Gemini, fungi_ai_1022/; their sizes are added to K.SIZE below):
 *   shiitake.png, reishi.png, stinkhorn.png, woodear_log.png, woodear_dry.png, woodear_soaked.png.
 * Step 1: four columns (shiitake / reishi / stinkhorn / wood ear), each a picture, a name and one short feature; a yellow
 *   frame slides from column to column inside the step (a quarter of the time each); one summary line underneath.
 * Step 2: the wood-ear picture grows out of its column into a big picture on the left (wood ear / dead wood, leaders);
 *   on the right the dried wood ear, a pulsing "soak in water" arrow and the glass bowl of soaked wood ear; slow pale-cyan
 *   ripples on the water surface, masked (built once from the picture's own pixels) to the water so they never cover the
 *   wood ear or the glass.
 * Every step: "AI teaching illustration; sizes are a sketch", the orange warning (line-drawn triangle), tappable markers.
 * The page shell owns the animation loop; this module draws one frame and keeps no timer.
 */
(()=>{'use strict';
const K=window.FungiKit,{P,C,D,text,measure,splitLines,rgba,clamp,mix,ease,smooth,fade,stageClock,drawIn,fitRect,circle,ellipse,line,arrow,mod,marker,MONO,TAU}=K;
Object.assign(K.SIZE,{'shiitake.png':[462,450],'reishi.png':[505,440],'stinkhorn.png':[374,607],
  'woodear_log.png':[902,823],'woodear_dry.png':[489,299],'woodear_soaked.png':[636,467]});
const N=2,PER=10;
const SHII='shiitake.png',REI='reishi.png',STINK='stinkhorn.png',LOG='woodear_log.png',DRY='woodear_dry.png',SOAK='woodear_soaked.png';
const SZ=f=>K.SIZE[f];

// ── words (canvas labels; verbatim from the brief unless marked "added") ───
const T={
 all:P(`都由菌絲組成，看得見的是子實體`,`All are made of hyphae; what you see is the fruiting body`),
 ear:P(`木耳（長在枯木上）`,`Wood ear (on dead wood)`),wood:P(`枯木`,`Dead wood`),
 dry:P(`乾的：縮成小小一團`,`Dried: a small curled bunch`),soak:P(`泡水：吸水變軟、變大`,`Soaked: softens and swells`),
 soakArrow:P(`泡水`,`Soak in water`),
 ai:P(`AI 教學插圖，大小只是示意`,`AI teaching illustration; sizes are a sketch`),
 warn:P(`不要依圖採菇或吃野生的菇`,`Do not pick or eat wild mushrooms from a picture`)};
const COLS=[
 {name:P(`香菇`,`Shiitake`),pic:SHII,feat:P(`傘下：菌褶`,`Gills under\nthe cap`)},
 {name:P(`靈芝`,`Reishi`),pic:REI,feat:P(`質地硬，\n傘下：細小的孔`,`Hard; tiny pores\nunder the cap`)},
 {name:P(`竹蓀`,`Stinkhorn`),pic:STINK,feat:P(`細長的柄，\n頂端有網狀菌裙`,`Long stalk,\nnet-like skirt\non top`),tall:true},
 {name:P(`木耳`,`Wood ear`),pic:LOG,feat:P(`沒有傘，像耳朵`,`No cap;\near-shaped`)}];

// ── layout ─────────────────────────────────────────────────────────────────
const X0=20,GAP=12,CW=(920-3*GAP)/4,TOP=20,BOT=440,PIC_Y=32,PIC_H=208,NAME_Y=282;
const colX=j=>X0+j*(CW+GAP);
const picBox=j=>COLS[j].tall?{x:colX(j)+10,y:PIC_Y-8,w:CW-20,h:PIC_H+16}:{x:colX(j)+10,y:PIC_Y,w:CW-20,h:PIC_H};
const picRect=j=>{const b=picBox(j);return fitRect(COLS[j].pic,b.x,b.y,b.w,b.h);};
const BIG=fitRect(LOG,24,22,440,390);                        // step 2 log (left)
const LOG_EAR=[470,300],LOG_WOOD=[170,330];                  // PNG px: inside the wood-ear cluster / on the bark
const RX=720,RW=420;                                         // step 2 right column: centre x, label width
const DRYR=fitRect(DRY,RX-150,22,300,128);
const SOAKR=fitRect(SOAK,RX-150,256,300,190);
// water surface of woodear_soaked.png (PNG px): ellipse inside the rim; ripple centres sit on visible water
const WATER={cx:322,cy:172,rx:270,ry:66},RIP=[[330,192,0],[520,152,.37],[88,160,.7],[410,214,.18]];
const WARN_Y=494,AI_Y=560,MK_X=870,MK_DX=44,MK_Y=566;
const at=(r,f,p)=>[r.x+p[0]*r.w/SZ(f)[0],r.y+p[1]*r.h/SZ(f)[1]];
const lerpR=(a,b,u)=>({x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),w:mix(a.w,b.w,u),h:mix(a.h,b.h,u)});
const bobR=(r,dy)=>({x:r.x,y:r.y+dy,w:r.w,h:r.h});

// ── helpers ────────────────────────────────────────────────────────────────
function track(s,key,k,t,dur){
  let o=s[key];if(!o||t<o.t){o=s[key]={k,from:k,t:t-9};}
  if(o.k!==k){o.from=o.k;o.k=k;o.t=t;}
  return{from:o.from,u:ease((t-o.t)/dur)};
}
function rowsOf(c,p,w,size=22){
  const str=D.tr(p),out=[];
  for(const part of str.split('\n')){
    const rows=splitLines(c,part,w,size);
    for(let i=0;i<rows.length-1;i++)if(/[（(]$/.test(rows[i])){rows[i]=rows[i].slice(0,-1).trimEnd();rows[i+1]=(/（/.test(part)?'（':'(')+rows[i+1];}
    out.push(...rows);
  }
  return out;
}
// A label: rows with the top at y; leaders from the nearest side to each target.
function tag(c,p,x,y,{col=C.white,align='left',maxW=240,tgts=[],a=1,size=22,dot=true}={}){
  if(a<=.004)return null;
  const rows=rowsOf(c,p,maxW,size),lh=size+6,w=Math.max(...rows.map(r=>measure(c,r,size))),h=rows.length*lh;
  const x0=align==='left'?x:align==='right'?x-w:x-w/2;
  c.save();c.globalAlpha*=a;
  for(const [tx,ty] of tgts){
    let sx,sy;
    if(tx<x0-4){sx=x0-6;sy=y+Math.min(h/2,lh*.55);}else if(tx>x0+w+4){sx=x0+w+6;sy=y+Math.min(h/2,lh*.55);}
    else if(ty>y+h){sx=tx;sy=y+h+4;}else{sx=tx;sy=y-4;}
    line(c,[[sx,sy],[tx,ty]],'rgba(11,26,21,.55)',4.5);
    line(c,[[sx,sy],[tx,ty]],rgba(col,.92),2);if(dot)circle(c,tx,ty,4.5,col,C.ink,1.5);
  }
  rows.forEach((r,i)=>text(c,r,x,y+size-1+i*lh,size,col,align));
  c.restore();
  return{x0,y,w,h};
}
// The orange warning: a triangle drawn with lines (outline, bar and dot), then the words.
function warning(c,x,yTop,a){
  if(a<=.004)return;
  c.save();c.globalAlpha*=a;
  c.beginPath();c.moveTo(x+13,yTop+2);c.lineTo(x+26,yTop+25);c.lineTo(x,yTop+25);c.closePath();
  c.lineJoin='round';c.strokeStyle=C.orange;c.lineWidth=2.6;c.stroke();
  line(c,[[x+13,yTop+10],[x+13,yTop+17]],C.orange,2.6);circle(c,x+13,yTop+21,1.7,C.orange,null);
  text(c,T.warn,x+36,yTop+21,22,C.orange,'left');
  c.restore();
}
function notes(c,a){
  warning(c,20,WARN_Y,a);
  if(a>.004){c.save();c.globalAlpha*=a;text(c,T.ai,20,AI_Y,22,C.muted,'left');c.restore();}
}
const canvas=(w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;};
function outline(c,x,y,w,h,r,color,lw=3){c.save();c.strokeStyle=color;c.lineWidth=lw;c.beginPath();c.roundRect(x,y,w,h,r);c.stroke();c.restore();}

// ── step 1: four kinds, four shapes ────────────────────────────────────────
function step1(c,a,tau,t){
  if(a<=.004)return;
  c.save();c.globalAlpha*=a;
  // which column is lit: four slots per stage, the frame slides at the end of each slot
  const SLOT=(PER-.4)/4,q=mod(Math.max(0,tau-.4)/SLOT,4),j0=Math.floor(q),sl=smooth((q-j0-.84)/.16),j1=(j0+1)%4;
  const fx=j1===0?mix(colX(3),colX(0),sl):mix(colX(j0),colX(j1),sl);
  const lit=j=>j===j0?1-sl:(j===j1?sl:0);
  COLS.forEach((col,j)=>{const x=colX(j),o=lit(j),cx=x+CW/2,ap=fade(tau,j*.25,.5);
    if(ap<=.004)return;
    c.save();c.globalAlpha*=ap;
    D.round(c,x,TOP,CW,BOT-TOP,14,'rgba(22,51,43,.9)',null);
    if(o>.01){c.save();c.globalAlpha*=o;D.round(c,x,TOP,CW,BOT-TOP,14,rgba(C.yellow,.07+.03*Math.sin(t*2.6)),null);
      c.save();c.beginPath();c.roundRect(x,TOP,CW,BOT-TOP,14);c.clip();const sy=TOP-80+mod(t*.22)*(BOT-TOP+160),g=c.createLinearGradient(0,sy-70,0,sy+70);
      g.addColorStop(0,rgba(C.white,0));g.addColorStop(.5,rgba(C.white,.08));g.addColorStop(1,rgba(C.white,0));c.fillStyle=g;c.fillRect(x,sy-70,CW,140);c.restore();c.restore();}
    const bob=2.5*Math.sin(t*1.6+j*1.3);
    drawIn(c,col.pic,bobR(picRect(j),bob));
    text(c,col.name,cx,NAME_Y,26,o>.5?C.yellow:C.white,'center');
    line(c,[[x+16,NAME_Y+14],[x+CW-16,NAME_Y+14]],rgba(C.white,.2),2);
    const rows=rowsOf(c,col.feat,CW-30,22),pop=fade(tau,.6+j*.25,.4);
    c.save();c.globalAlpha*=pop;rows.forEach((row,i)=>text(c,row,cx,NAME_Y+46+i*28,22,C.white,'center'));c.restore();
    c.restore();});
  const fa=fade(tau,.4,.5);
  if(fa>0){c.save();c.globalAlpha*=fa;outline(c,fx,TOP,CW,BOT-TOP,14,C.yellow,3);
    const qq=mod(t*.8);outline(c,fx-qq*6,TOP-qq*6,CW+qq*12,BOT-TOP+qq*12,14+qq*4,rgba(C.yellow,.6*(1-qq)),2.5);c.restore();}
  const na=fade(tau,1.6,.5);
  if(na>0){c.save();c.globalAlpha*=na;text(c,T.all,480,474,24,C.yellow,'center');c.restore();}
  c.restore();
}

// ── step 2: wood ear, dry and soaked ───────────────────────────────────────
let WMASK=null,RIPC=null;
function waterMask(){
  if(WMASK)return WMASK;
  const im=K.pic(K.URL_OF(SOAK));if(!im)return null;
  const [W,H]=SZ(SOAK),cv=canvas(W,H),x=cv.getContext('2d');x.drawImage(im,0,0,W,H);
  let d;try{d=x.getImageData(0,0,W,H);}catch(e){return null;}
  const p=d.data;
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){const k=(py*W+px)*4;
    const e=Math.pow((px-WATER.cx)/WATER.rx,2)+Math.pow((py-WATER.cy)/WATER.ry,2);
    const inE=clamp((1-e)/.18),water=clamp((20-(p[k]-p[k+2]))/10)*clamp((p[k+3]-110)/60);
    p[k]=p[k+1]=p[k+2]=255;p[k+3]=Math.round(255*inE*water);}
  x.putImageData(d,0,0);
  return WMASK=cv;
}
function ripples(c,r,a,t){
  if(a<=.004)return;
  const m=waterMask();if(!m)return;
  const [W,H]=SZ(SOAK);if(!RIPC)RIPC=canvas(W,H);
  const x=RIPC.getContext('2d');x.globalCompositeOperation='source-over';x.clearRect(0,0,W,H);
  for(const [px,py,ph] of RIP)for(let n=0;n<2;n++){const u=mod(t*.28+ph+n*.5),rr=6+u*70;
    ellipse(x,px,py,rr,rr*.3,null,rgba(C.cyan,.75*(1-u)*clamp(u*6)),5);}
  // a few slow glints on the water
  for(let i=0;i<5;i++){const u=mod(t*.21+i*.2),gx=60+i*118+18*Math.sin(t*.5+i),gy=165+22*Math.sin(i*2.1);circle(x,gx,gy,4,rgba(C.cyan,.5*Math.sin(Math.PI*u)),null);}
  x.globalCompositeOperation='destination-in';x.drawImage(m,0,0);
  c.save();c.globalAlpha*=a*.8;c.drawImage(RIPC,r.x,r.y,r.w,r.h);c.restore();
}
function step2(c,a,tau,t){
  if(a<=.004)return;
  // the wood ear grows out of its column into the big picture on the left
  const gu=ease((tau-.05)/1.2),lr=bobR(lerpR(picRect(3),BIG,gu),2*Math.sin(t*1.2)*gu);
  drawIn(c,LOG,lr,{alpha:a});
  tag(c,T.wood,110,422,{col:'#d9c3a3',align:'center',maxW:130,a:a*fade(tau,1.5,.5),tgts:[at(lr,LOG,LOG_WOOD)]});
  tag(c,T.ear,204,422,{col:C.white,maxW:300,a:a*fade(tau,1.1,.5),tgts:[at(lr,LOG,LOG_EAR)]});
  // right column: dried -> soak -> soaked
  const da=a*fade(tau,1.9,.6),dr=bobR(DRYR,2*Math.sin(t*1.5+1));
  drawIn(c,DRY,dr,{alpha:da});
  tag(c,T.dry,RX,DRYR.y+DRYR.h+8,{col:C.white,align:'center',maxW:RW,a:a*fade(tau,2.3,.5)});
  const aa=a*fade(tau,2.7,.5);
  if(aa>0){const y1=196,y2=246+4*Math.sin(t*3),pa=.6+.4*Math.sin(t*3);
    c.save();c.globalAlpha*=aa*pa;arrow(c,RX,y1,RX,y2,C.white,4);c.restore();
    tag(c,T.soakArrow,RX+22,y1+8,{col:C.white,maxW:200,a:aa});}
  const sa=a*fade(tau,3.1,.6);
  drawIn(c,SOAK,SOAKR,{alpha:sa});
  ripples(c,SOAKR,sa*fade(tau,3.5,.8),t);
  tag(c,T.soak,RX,SOAKR.y+SOAKR.h+6,{col:C.white,align:'center',maxW:RW,a:a*fade(tau,3.5,.5)});
}

const STEPS=[step1,step2];

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u}=track(s,'_kL',k,t,.8),out=held?1:1-fade(tau,PER-.45,.45);
  if(from!==k&&u<1)STEPS[from](c,1-u,30,t);
  STEPS[k](c,(from!==k?u:1)*out,tau,t);
  notes(c,1);                                   // the same on both steps: drawn once, never cross-faded
  // step markers (tap to jump to a step)
  for(let j=0;j<N;j++){const x=MK_X+j*MK_DX,y=MK_Y;
    if(j===k)marker(c,x,y,j+1,null,14);
    else{circle(c,x,y,14,'rgba(11,26,21,.9)',rgba(C.muted,.8),2);c.save();c.font=MONO(20);c.fillStyle=C.muted;c.textAlign='center';c.textBaseline='middle';c.fillText(String(j+1),x,y+1);c.restore();}
    D.hit(x-MK_DX/2,y-22,MK_DX,44,'phase',j);}
}
window.FungiDraw.kinds=draw;
})();

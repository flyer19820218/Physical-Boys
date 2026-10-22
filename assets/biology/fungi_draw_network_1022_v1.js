/* Fungi · "network" canvas (Tab 3, view 0: soil cross-section), 2026-10-22.
 * Registers window.FungiDraw.network; called as draw(ctx, state, t) on the 960x600 canvas. Sets s.shown (stage 0..3).
 * Pictures (one canvas 1226x1302, stacked they give the original): fungi_ai_1022/mushroom_soil.png (whole),
 *   mushroom_cap_only.png (only the five mushrooms), mycelium_net_only.png (only soil and hyphae; its back edge of the ground
 *   is copied, see sources.md "待老師看" 10, so it is used in step 4 only). Scale 0.43, left side x 20–547, y 20–580.
 *   Every position comes from fungi_ai_1022/measurements.json or was measured by program on mushroom_soil.png (PNG px).
 * Step 1: the whole picture; "fruiting body" to the tallest cap; a dashed "ground" line along the top edge of the soil.
 * Step 2: a round close-up of the gills of the lying mushroom; grey-brown spores (drawn in code) drift out on the wind;
 *   a second close-up enlarges the spores (marked as an enlarged sketch); one spore falls on the ground and grows a short
 *   pale new hypha.
 * Step 3: the mushrooms are veiled to alpha 0.35; the white hyphae (a mask taken from the picture) light up from the hub
 *   (645,602) outwards, then a bright band keeps sweeping outwards; labels: hyphal net, dead leaf, rotting wood, soil, and
 *   (must have, sources.md "待老師看" 8) the brown thin lines are plant roots, not hyphae.
 * Step 4: mushroom_soil.png fades into mycelium_net_only.png + mushroom_cap_only.png; the caps float up and fade (their cut
 *   stem bases are faded out in a copy made once, so the cut is never seen); the hyphae glow; a very small new mushroom
 *   (drawn in code) grows above the hub.
 * Every step: a small warning "do not pick or eat wild mushrooms from a picture", an "AI sketch" note, tappable step markers.
 * The page shell owns the animation loop; this module draws one frame and keeps no timer.
 */
(()=>{'use strict';
const K=window.FungiKit,{P,C,D,text,measure,splitLines,rgba,clamp,mix,ease,smooth,fade,stageClock,drawIn,circle,ellipse,line,dashed,glow,mod,marker,arrow,rng,MONO,TAU}=K;
const N=4,PER=8,SOIL='mushroom_soil.png',CAPS='mushroom_cap_only.png',NET='mycelium_net_only.png',[PW,PH]=K.SIZE[SOIL];

// ── words (canvas labels; the first ones verbatim from animation_specs.md) ─
const T={
 fruit:P(`子實體（蕈類的菇）`,`Fruiting body\n(the mushroom)`),ground:P(`地面`,`Ground`),
 gills:P(`菌褶`,`Gills`),spores:P(`孢子（放大示意，肉眼看不見）`,`Spores (enlarged sketch; invisible to the naked eye)`),
 newHy:P(`新的菌絲`,`New hyphae`),
 net:P(`菌絲網`,`Hyphal net`),leaf:P(`落葉`,`Dead leaf`),wood:P(`朽木`,`Rotting wood`),soil:P(`土壤`,`Soil`),
 roots:P(`棕色細線：\n植物的根，不是菌絲`,`Brown thin lines:\nplant roots,\nnot hyphae`),
 hidden:P(`從地面上看不到這張網`,`You cannot see this net from above ground`),
 picked:P(`菇被採走`,`Mushrooms picked`),stay:P(`菌絲還在`,`The hyphae are still there`),
 later:P(`之後可能長出新的菇`,`New mushrooms may grow later`),
 warn:P(`不要依圖採菇或吃野生的菇`,`Do not pick or eat wild mushrooms from a picture`),
 // names added so that nothing on the canvas is unnamed
 wind:P(`風`,`Wind`),ai:P(`AI 插圖，示意`,`AI sketch`)};
const ROOTC='#e0b07a',SPORE='#a08c74',SPORE_D='#5a4a3a',CAPC='#8a5a3c',CAPD='#5c3a26',STEM='#efe4cc';

// ── layout and measured points (PNG pixels of the 1226x1302 canvas) ────────
const L={x:20,y:20,sc:.43};
const at=p=>[L.x+p[0]*L.sc,L.y+p[1]*L.sc];
const HUB=[645,602],TALL=[850,120],GILLS=[865,402];
// top edge of the soil (PNG), from measurements.json soil_top_edge_y_at_x plus the two ends measured on mushroom_soil.png
const GROUND=[[32,474],[60,471],[150,459],[250,457],[300,446],[400,452],[520,452],[640,452],[760,468],[900,460],[1000,452],[1100,458],[1190,476]];
const ROOTS=[[112,640],[198,640]];          // two brown plant roots on the left face (checked by colour)
const LEAF=[616,795],WOOD=[1070,872],SOILP=[1150,1047],NETP=[660,640],NETP4=[800,700];
const NEWM=[645,556];                       // base of the new small mushroom: on the top face, right above the hub
const LAND=[1037,470];                      // where the one spore lands (top face of the ground, right of the lying cap)
// right column
const RX=590;

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
// A label: rows of text with the top at y; leaders from the nearest edge to each target in tgts.
function tag(c,p,x,y,{col=C.white,align='left',maxW=340,tgts=[],a=1,size=22,dot=true}={}){
  if(a<=.004)return null;
  const rows=rowsOf(c,p,maxW,size),lh=size+6,w=Math.max(...rows.map(r=>measure(c,r,size))),h=rows.length*lh;
  const x0=align==='left'?x:align==='right'?x-w:x-w/2;
  c.save();c.globalAlpha*=a;
  for(const [tx,ty] of tgts){
    let sx,sy;
    if(tx<x0-4){sx=x0-6;sy=y+Math.min(h/2,lh*.55);}else if(tx>x0+w+4){sx=x0+w+6;sy=y+Math.min(h/2,lh*.55);}
    else if(ty>y+h){sx=tx;sy=y+h+4;}else{sx=tx;sy=y-4;}
    line(c,[[sx,sy],[tx,ty]],rgba(col,.9),2);if(dot)circle(c,tx,ty,4.5,col,C.ink,1.5);
  }
  rows.forEach((r,i)=>text(c,r,x,y+size-1+i*lh,size,col,align));
  c.restore();
  return{x0,y,w,h};
}
const canvas=(w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;};

// ── layers made once from the pictures ─────────────────────────────────────
// veil: the mushroom silhouette in board colour (step 3 dims the mushrooms to alpha 0.35 with it)
// capsCut: the mushrooms with their cut stem bases faded out (step 4, so the cut never shows while they float up)
// hy / hyGlow: the white hyphae of the picture (cream #f2ecd9) and a thickened copy for the glow; twinkle points
const G={};
function layers(){
  if(G.done)return G;
  const soil=K.pic(K.URL_OF(SOIL)),caps=K.pic(K.URL_OF(CAPS));
  if(!G.veil&&caps){const v=canvas(PW,PH),x=v.getContext('2d');x.drawImage(caps,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#11261f';x.fillRect(0,0,PW,PH);G.veil=v;}
  if(!G.capsCut&&caps){
    const v=canvas(PW,PH),x=v.getContext('2d');x.drawImage(caps,0,0);
    try{const im=x.getImageData(0,0,PW,PH),d=im.data;
      for(let px=360;px<800;px++){let bot=-1;for(let py=PH-1;py>=380;py--)if(d[(py*PW+px)*4+3]>40){bot=py;break;}
        if(bot<0)continue;for(let py=bot-60;py<=bot;py++){const k=(py*PW+px)*4;d[k+3]=Math.round(d[k+3]*clamp((bot-6-py)/44));}}
      x.putImageData(im,0,0);}catch(e){}
    G.capsCut=v;}
  if(!G.hy&&soil&&G.veil){
    const v=canvas(PW,PH),x=v.getContext('2d');x.drawImage(soil,0,0);G.pts=[];
    try{const im=x.getImageData(0,0,PW,PH),d=im.data,R=rng(1022),cm=G.veil.getContext('2d').getImageData(0,0,PW,PH).data;
      for(let py=0;py<PH;py++)for(let px=0;px<PW;px++){const k=(py*PW+px)*4,r=d[k],g=d[k+1],b=d[k+2],mn=Math.min(r,g,b),mx=Math.max(r,g,b);
        if(py>500&&d[k+3]>200&&mn>165&&mx-mn<50&&cm[k+3]<20){d[k]=242;d[k+1]=236;d[k+2]=217;d[k+3]=255;if(R()<.004)G.pts.push([px,py,R()]);}else d[k+3]=0;}
      x.putImageData(im,0,0);
      const gw=canvas(PW,PH),gx=gw.getContext('2d');gx.globalAlpha=.32;
      for(let a=0;a<8;a++)gx.drawImage(v,Math.round(Math.cos(a*TAU/8)*4),Math.round(Math.sin(a*TAU/8)*4));
      gx.globalAlpha=1;gx.drawImage(v,0,0);G.hy=v;G.hyGlow=gw;
    }catch(e){G.hy=null;G.hyFail=true;}
  }
  G.done=!!(G.veil&&G.capsCut&&(G.hy||G.hyFail));
  return G;
}
const picRect=(dy=0)=>({x:L.x,y:L.y+dy,w:PW*L.sc,h:PH*L.sc});
function layer(c,cv,a,dy=0){if(!cv||a<=.004)return;c.save();c.globalAlpha*=a;const r=picRect(dy);c.drawImage(cv,r.x,r.y,r.w,r.h);c.restore();}

// The hyphae light up from the hub: rev = reveal radius (canvas px), band = position of the sweeping band (canvas px)
function hyphaeLight(c,G,a,rev,band,t){
  if(a<=.004||!G.hy)return;
  const [hx,hy]=at(HUB),r=picRect();
  c.save();c.globalAlpha*=a;c.globalCompositeOperation='lighter';
  c.save();c.beginPath();c.arc(hx,hy,Math.max(1,rev),0,TAU);c.clip();
  c.globalAlpha*=.42;c.drawImage(G.hyGlow,r.x,r.y,r.w,r.h);c.restore();
  if(band>0){c.save();c.beginPath();c.arc(hx,hy,band+26,0,TAU);c.arc(hx,hy,Math.max(1,band-26),0,TAU,true);c.clip();
    c.globalAlpha*=.75;c.drawImage(G.hyGlow,r.x,r.y,r.w,r.h);c.restore();}
  c.restore();
  // twinkling points of light on the hyphae
  c.save();c.globalAlpha*=a;
  for(const [px,py,ph] of G.pts){const q=at([px,py]),d=Math.hypot(q[0]-hx,q[1]-hy);if(d>rev)continue;
    const w=.5+.5*Math.sin(t*2.2+ph*TAU);if(w<.55)continue;glow(c,q[0],q[1],7,C.white,(w-.55)*1.6);}
  c.restore();
}

// ── step 2: spores (drawn in code, grey-brown) ─────────────────────────────
const SP=[...Array(28)].map((_,i)=>{const R=rng(77+i*13);return{ph:R(),dx:(R()-.5)*44,dy:(R()-.5)*44,sp:.85+.3*R(),w:R()*TAU,r:1.8+.9*R()};});
function sporePos(o,age){
  const [gx,gy]=at(GILLS),x0=gx+o.dx*.6,y0=gy+o.dy*.6;
  return[x0+age*205*o.sp,y0-age*125*o.sp+Math.sin(age*7+o.w)*7];
}
function spores(c,a,tauS){
  if(a<=.004||tauS<=0)return;
  c.save();c.globalAlpha*=a;
  for(const o of SP){
    const st=o.ph*4.2;if(tauS<st)continue;
    const age=mod((tauS-st)/4.2),[x,y]=sporePos(o,age),fa=clamp(age/.08)*clamp((566-x)/26);
    if(fa<=0)continue;c.save();c.globalAlpha*=fa;circle(c,x,y,o.r,SPORE,rgba(SPORE_D,.9),1);c.restore();
  }
  c.restore();
}
function windArrows(c,a,t){
  if(a<=.004)return;
  c.save();c.globalAlpha*=a;
  const sh=mod(t*.6)*14;
  [[34,62,146,50],[44,104,140,96]].forEach(([x1,y1,x2,y2],i)=>{c.save();c.globalAlpha*=.55+.45*Math.sin(t*2+i);
    dashed(c,[[x1,y1],[x2-14,y2+1.4]],rgba(C.cyan,.9),3,[10,7],-t*18);arrow(c,x2-18,y2+1.6,x2+sh*.2,y2,C.cyan,3);c.restore();});
  c.restore();
}
// close-up circle of a piece of the picture (crop around src PNG point, radius sr PNG) at (zx,zy) radius R
function closeUp(c,file,src,sr,zx,zy,R,grow,a,t){
  if(a<=.004)return null;
  const s0=at(src),r0=sr*L.sc,u=ease(grow),x=mix(s0[0],zx,u),y=mix(s0[1],zy,u),rr=mix(r0,R,u);
  c.save();c.globalAlpha*=a;
  circle(c,s0[0],s0[1],r0,null,rgba(C.yellow,.95),3);
  c.save();c.setLineDash([7,6]);c.lineDashOffset=-t*10;
  const ang=Math.atan2(y-s0[1],x-s0[0]);
  for(const d of [-1,1]){const q=ang+d*Math.PI/2;line(c,[[s0[0]+r0*Math.cos(q),s0[1]+r0*Math.sin(q)],[x+rr*Math.cos(q),y+rr*Math.sin(q)]],rgba(C.yellow,.55),2);}
  c.restore();
  circle(c,x,y,rr,C.panel,null);
  if(file){c.save();c.beginPath();c.arc(x,y,rr,0,TAU);c.clip();
    drawIn(c,file,{x:x-rr,y:y-rr,w:2*rr,h:2*rr},{crop:[(src[0]-sr)/PW,(src[1]-sr)/PH,2*sr/PW,2*sr/PH]});c.restore();}
  c.restore();
  return{x,y,r:rr};
}
function sporeZoom(c,z,a,t){
  if(!z||a<=.004)return;
  c.save();c.globalAlpha*=a;c.beginPath();c.arc(z.x,z.y,z.r,0,TAU);c.clip();
  for(let i=0;i<7;i++){const R=rng(300+i),bx=(i/7)*2*z.r,by=(R()-.5)*.9*z.r,ph=R()*TAU;
    const x=z.x+mod(bx+t*9,2*z.r)-z.r,y=z.y+by+Math.sin(t*1.3+ph)*6,rot=ph+t*.4;
    ellipse(c,x,y,11,8,SPORE,SPORE_D,2,rot);ellipse(c,x-3,y-2.5,3.5,2.2,rgba('#e8dcc8',.6),null,0,rot);}
  c.restore();
  c.save();c.globalAlpha*=a;circle(c,z.x,z.y,z.r,null,rgba(C.yellow,.95),3);c.restore();
}

// ── step 4: a very small new mushroom (drawn in code) ──────────────────────
function newMushroom(c,g,a,t){
  if(a<=.004||g<=0)return null;
  const [bx,by]=at(NEWM),h=26*g,cw=24*g,sw=Math.sin(t*1.4)*.03;
  c.save();c.globalAlpha*=a;c.translate(bx,by);c.rotate(sw);
  ellipse(c,0,1,7*g+2,2.5,rgba('#3a2a1e',.55),null);
  c.beginPath();c.moveTo(-3.2*g,0);c.quadraticCurveTo(-2.4*g,-h*.6,-2.6*g,-h);c.lineTo(2.6*g,-h);c.quadraticCurveTo(2.4*g,-h*.6,3.2*g,0);c.closePath();
  c.fillStyle=STEM;c.fill();c.strokeStyle=CAPD;c.lineWidth=1.2;c.stroke();
  c.beginPath();c.moveTo(-cw/2,-h+1);c.quadraticCurveTo(-cw/2,-h-cw*.62,0,-h-cw*.62);c.quadraticCurveTo(cw/2,-h-cw*.62,cw/2,-h+1);c.closePath();
  c.fillStyle=CAPC;c.fill();c.strokeStyle=CAPD;c.lineWidth=1.6;c.stroke();
  ellipse(c,-cw*.16,-h-cw*.38,cw*.16,cw*.08,rgba('#c49a74',.7),null);
  c.restore();
  return[bx,by-h-cw*.3];
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u}=track(s,'_nL',k,t,.9),out=held?1:1-fade(tau,PER-.5,.5);
  const only=(j,d=0,dd=.5)=>k===j?fade(tau,d,dd)*out:(from===j?1-u:0);
  const lt=(j,d)=>k===j?fade(tau,d,.5)*out:(from===j?1-u:0);      // label alpha: appears at d seconds into its step
  const first=k===0&&from===0;
  const g=layers();

  // ── pictures ──
  const in4=k===3?ease(fade(tau,0,.6)):(from===3?1-u:0);          // weight of the step-4 layers
  const pa=first?fade(tau,0,.8):1;
  c.save();c.globalAlpha*=pa;
  if(in4<1)drawIn(c,SOIL,picRect());
  // step 3: the mushrooms dimmed to alpha 0.35 (board-coloured veil)
  const veil=(k===2?fade(tau,0,.8)*(held?1:1-fade(tau,PER-.5,.5)):0)+(from===2&&k!==2?1-u:0);
  if(in4<1)layer(c,g.veil,.65*clamp(veil)*(1-in4));
  if(in4>0){
    // step 4: the net-only picture below; the soil picture fades away on top of it (same pixels where both are drawn)
    c.save();c.globalAlpha*=in4;drawIn(c,NET,picRect());c.restore();
    const lift=k===3?ease((tau-.7)/2.0):1,capA=k===3?1-smooth((tau-.9)/1.7):0;
    if(capA>0)layer(c,g.capsCut,capA*in4,-lift*64);
  }
  c.restore();

  // ── step 3 / 4: the hyphae light up from the hub ──
  const h3=only(2),h4=k===3?fade(tau,2.2,.6)*out:(from===3?1-u:0);
  if(h3>0||h4>0){
    const tt=k===2?tau:(k===3?Math.max(0,tau-2.2):9),rev=k===2||k===3?mix(0,400,smooth((tt-.4)/2.6)):400;
    const band=tt>3.2?mod((tt-3.2)/3.4)*420:(tt>.4?rev:0);
    hyphaeLight(c,g,Math.max(h3,h4),rev,band,t);
  }

  // ── step 1: fruiting body, ground ──
  const h1=only(0,.5);
  if(h1>0){
    const gp=GROUND.map(p=>{const q=at(p);return[q[0],q[1]-3];});
    c.save();c.globalAlpha*=h1;dashed(c,gp,rgba(C.yellow,.95),3,[11,8],-t*12);c.restore();
    const tp=at(TALL);
    c.save();c.globalAlpha*=lt(0,1);K.pulse(c,tp[0],tp[1],t,C.yellow,8);c.restore();
    tag(c,T.fruit,RX,52,{col:C.yellow,size:26,maxW:345,a:lt(0,1),tgts:[tp]});
    tag(c,T.ground,RX,200,{col:C.yellow,size:24,a:lt(0,1.7),tgts:[gp[gp.length-1]]});
  }

  // ── step 2: gills, spores, the landing spore and its new hypha ──
  const h2=only(1,0);
  if(h2>0){
    const t2=k===1?tau:9;
    windArrows(c,h2*fade(t2,1.6,.5),t);
    tag(c,T.wind,34,122,{col:C.cyan,size:22,a:h2*fade(t2,1.6,.5)});
    spores(c,h2,Math.max(0,t2-1.8)+(k===1?0:6));
    // close-up of the gills
    const zg=closeUp(c,SOIL,GILLS,74,700,372,88,(t2-.2)/1.2,h2,t);
    if(zg){c.save();c.globalAlpha*=h2*fade(t2,1.2,.4);circle(c,zg.x,zg.y,zg.r,null,rgba(C.yellow,.95),3);c.restore();
      tag(c,T.gills,806,354,{col:C.yellow,size:24,maxW:130,a:h2*fade(t2,1.4,.5),tgts:[[752,372]]});}
    // close-up of a few spores (drawn larger)
    const sa=h2*fade(t2,2.8,.5);
    if(sa>0){const zs=closeUp(c,null,[(505-L.x)/L.sc,(118-L.y)/L.sc],34,700,96,62,(t2-2.8)/1.0,sa,t);sporeZoom(c,zs,sa,t);
      tag(c,T.spores,RX-4,168,{col:C.white,size:22,maxW:345,a:h2*fade(t2,3.6,.5)});}
    // the one spore that lands on the ground, and the new hypha that grows from it
    const [gx,gy]=at(GILLS),lp=at(LAND),fu=smooth((t2-2.2)/1.6);
    if(fu>0){
      const sx=mix(gx+30,lp[0],fu),sy=mix(gy+6,lp[1],fu)-Math.sin(fu*Math.PI)*24;
      c.save();c.globalAlpha*=h2;glow(c,sx,sy,12,C.yellow,.5);circle(c,sx,sy,3,SPORE,SPORE_D,1.2);
      if(fu<1)circle(c,sx,sy,8,null,rgba(C.yellow,.9),2);c.restore();
      const gu=smooth((t2-3.8)/1.6);
      if(gu>0){c.save();c.globalAlpha*=h2;c.lineCap='round';
        const br=[[[0,0],[5,9],[8,20],[14,28]],[[5,9],[-3,17],[-8,25]],[[8,20],[2,27]]];
        br.forEach((b,i)=>{const v=clamp(gu*1.6-i*.35);if(v<=0)return;const pts=b.map(([x,y])=>[lp[0]+x*v,lp[1]+y*v+2]);
          K.sline(c,pts,rgba('#f2ecd9',.88),2.4);});
        const tip=[lp[0]+14*gu,lp[1]+30*gu];glow(c,tip[0],tip[1],7,C.white,.35+.25*Math.sin(t*3));c.restore();}
      tag(c,T.newHy,RX,234,{col:C.white,size:22,a:h2*fade(t2,4.6,.5),tgts:[[lp[0]+8,lp[1]+16]]});
    }
  }

  // ── step 3: labels ──
  if(h3>0){
    tag(c,T.net,RX,262,{col:C.white,size:26,a:lt(2,1.6),tgts:[at(NETP)]});
    tag(c,T.leaf,RX,316,{col:'#e6c08a',size:22,a:lt(2,2.4),tgts:[at(LEAF)]});
    tag(c,T.wood,RX,380,{col:'#e6c08a',size:22,a:lt(2,2.8),tgts:[at(WOOD)]});
    tag(c,T.soil,RX,444,{col:'#e6c08a',size:22,a:lt(2,3.2),tgts:[at(SOILP)]});
    tag(c,T.roots,26,24,{col:ROOTC,size:22,maxW:220,a:lt(2,3.8),tgts:ROOTS.map(at)});
    tag(c,T.hidden,RX,60,{col:C.yellow,size:24,maxW:340,a:lt(2,4.6)});
  }

  // ── step 4: picked, the hyphae stay, a new mushroom ──
  const h4l=only(3,0);
  if(h4l>0){
    const t4=k===3?tau:9,lift=ease((t4-.7)/2.0);
    // upward arrows where the mushrooms were picked
    const aa=h4l*fade(t4,.7,.4)*(1-.6*fade(t4,3,.8));
    if(aa>0){c.save();c.globalAlpha*=aa;[[230,150],[330,118],[420,150]].forEach(([x,y],i)=>{const yy=y-lift*40-mod(t*.5+i*.3)*6;arrow(c,x,yy+34,x,yy,C.yellow,3.5);});c.restore();}
    tag(c,T.picked,RX,52,{col:C.yellow,size:24,a:h4l*fade(t4,1.0,.5),tgts:[at([470,452])]});
    tag(c,T.stay,RX,300,{col:C.white,size:24,maxW:345,a:h4l*fade(t4,2.6,.5),tgts:[at(NETP4)]});
    const mg=ease((t4-3.6)/1.6),mt=newMushroom(c,mg,h4l,t);
    if(mt){c.save();c.globalAlpha*=h4l*fade(t4,3.6,.4);K.pulse(c,mt[0],mt[1]+2,t,C.green,12);c.restore();
      tag(c,T.later,RX,196,{col:C.green,size:24,maxW:345,a:h4l*fade(t4,4.8,.5),tgts:[[mt[0]+14,mt[1]+4]]});}
  }

  // ── every step: warning, AI note, step markers ──
  c.save();c.globalAlpha*=pa;
  const wr=rowsOf(c,T.warn,316,22);
  const wTop=548-wr.length*28;
  c.beginPath();c.moveTo(RX+12,wTop+3);c.lineTo(RX+24,wTop+25);c.lineTo(RX,wTop+25);c.closePath();c.fillStyle=C.orange;c.fill();
  line(c,[[RX+12,wTop+10],[RX+12,wTop+17]],C.ink,2.6);circle(c,RX+12,wTop+21.5,1.6,C.ink,null);
  wr.forEach((r,i)=>text(c,r,RX+34,wTop+21+i*28,22,C.orange,'left'));
  text(c,T.ai,RX-4,574,22,C.muted,'left');
  c.restore();
  for(let j=0;j<N;j++){const x=786+j*46,y=566;
    if(j===k)marker(c,x,y,j+1,null,14);
    else{circle(c,x,y,14,'rgba(11,26,21,.9)',rgba(C.muted,.8),2);c.save();c.font=MONO(20);c.fillStyle=C.muted;c.textAlign='center';c.textBaseline='middle';c.fillText(String(j+1),x,y+1);c.restore();}
    D.hit(x-23,y-24,46,48,'phase',j);}
}
window.FungiDraw.network=draw;
})();

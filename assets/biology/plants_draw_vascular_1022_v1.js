/* Plants · "How does water go up?" canvas (groups tab, view 0), 2026-10-22.
 * moss.png (left) and sword_fern.png (right), the teacher's Gemini AI illustrations, stand on one soil line.
 * Both sway gently (drawn in 2 px canvas rows shifted by a wave that grows toward the top, so the base stays put).
 *  0 rain falls, the soil gets wet, drops bead on both plants;
 *  1 moss: a magnified circle (schematic, drawn here) joined by dashed lines to a spot on the moss: columns of cells,
 *    water enters from the surface and is handed up one cell at a time, stopping after a few cells. Drawn rhizoids
 *    under the moss are labelled "rhizoids (schematic)": they only anchor the moss and are not true roots
 *    (the picture itself shows no rhizoids, see plants_ai_1022/sources.md);
 *  2 fern: drawn roots (schematic) under the mound, translucent cyan pipes (vascular tissue, schematic) from the roots
 *    up along the rachis of every frond, with water dots flowing in them; the moss is dimmed;
 *  3 compare: dashed height marks (moss short, fern tall), water passed only a short way in the moss and all the way
 *    to the frond tips in the fern; "schematic, not real heights".
 * Rachis coordinates of the ten fronds were traced once from the PNG (dark ridge of the rachis, alpha > 128).
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,text,measure,splitLines,pill,cpill,circle,ellipse,glow,arrow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,pic,AI,SIZE,TAU}=K;
const LAB=()=>K.LAB||{};
const N=4,PER=7;
const WATER='#38bdf8',SOIL_TOP='#5a4430',SOIL_BOT='#2b2016';
const GY=470;   // soil line
// ── pictures and layout ────────────────────────────────────────────────────
const MF='moss.png',[MW,MH]=SIZE[MF],FF='sword_fern.png',[FW,FH]=SIZE[FF];
const SCM=.26,LM={ox:20,oy:480-760*SCM,sc:SCM};              // moss: soil clump (image y 760) on the soil line
const SCF=.317,LF={ox:760-600*SCF,oy:482-1075*SCF,sc:SCF};    // fern: foot of the mound (image y 1075) on the soil line
const MOSS_TOP=LM.oy+330*SCM, FERN_TOP=LF.oy+10*SCF;           // top of the leafy moss shoots / top frond tip
// rachis of every frond, image px (base → tip)
const FR=[[[592,920],[593,871],[585,823],[581,775],[578,727],[575,678],[572,630],[569,582],[565,533],[562,485],[557,437],[549,389],[545,341],[533,293],[522,246],[511,199],[498,152],[482,106],[460,63],[438,20],[430,10]],
[[562,905],[547,859],[534,812],[529,763],[518,716],[511,668],[502,620],[492,572],[478,526],[464,479],[447,434],[426,390],[405,346],[384,302],[361,260],[336,218],[308,178],[280,138],[250,103],[209,80],[185,75]],
[[555,900],[542,853],[525,808],[509,762],[489,718],[468,674],[445,632],[423,589],[395,550],[361,515],[328,479],[292,448],[253,419],[213,392],[170,370],[124,354],[76,347],[29,357],[8,371]],
[[560,900],[541,856],[508,821],[474,787],[440,753],[402,724],[360,700],[317,682],[271,672],[224,671],[178,679],[133,698],[97,730]],
[[565,890],[543,845],[502,820],[458,800],[412,813],[377,843],[351,884],[341,920]],
[[600,910],[608,862],[615,814],[621,766],[630,719],[640,671],[648,624],[660,577],[672,530],[685,484],[700,438],[714,391],[728,345],[743,299],[764,255],[788,213],[812,172],[840,133],[869,95],[904,60],[949,41],[962,40]],
[[620,885],[634,839],[646,792],[664,747],[678,700],[697,656],[716,611],[738,568],[762,526],[788,485],[816,446],[843,406],[875,370],[908,334],[941,300],[982,274],[1024,253],[1068,234],[1117,228],[1165,237]],
[[632,875],[661,836],[686,794],[709,751],[738,713],[768,674],[798,636],[828,598],[860,561],[895,527],[936,500],[980,480],[1026,464],[1074,455],[1123,458],[1170,473],[1190,488]],
[[628,880],[649,836],[675,794],[712,761],[756,740],[799,717],[844,699],[892,693],[941,689],[988,692],[1033,707],[1074,732],[1103,770],[1108,781]],
[[615,870],[642,832],[684,814],[732,805],[778,819],[811,855],[831,899],[840,935]]];
const CROWN=[596,935];
// drawn roots (schematic), image px of the fern: crown → tip (quadratic, control point in the middle)
const ROOTS=[[[560,1010],[470,1150]],[[575,1030],[520,1175]],[[600,1040],[612,1180]],[[625,1030],[690,1165]],[[640,1010],[760,1135]]];
// drawn rhizoids (schematic), canvas px under the moss soil clump
const RHZ=(()=>{const R=K.rng(11),a=[];for(let i=0;i<9;i++){const x=96+i*16+R()*6,len=22+R()*16;a.push([x,492,x+(R()-.5)*16,492+len*.55,x+(R()-.5)*22,492+len]);}return a;})();

// path lengths (image px) for the flowing dots
function cum(pts){const a=[0];for(let i=1;i<pts.length;i++)a.push(a[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return a;}
function rootPts(r){const out=[];for(let i=0;i<=10;i++){const u=1-i/10;out.push(K.bez(CROWN,r[0],r[1],u));}return out;}  // tip → crown
const PATHS=FR.map((f,i)=>{const pts=[...rootPts(ROOTS[i%ROOTS.length]),...f];return{pts,L:cum(pts),r0:11};});   // root tip → crown → frond base → tip
const FPATH=FR.map(f=>({pts:[CROWN,...f],L:cum([CROWN,...f])}));
function along(pp,d){const L=pp.L;if(d<=0)return pp.pts[0];const n=L.length-1;if(d>=L[n])return pp.pts[n];let i=1;while(L[i]<d)i++;const u=(d-L[i-1])/(L[i]-L[i-1]);return K.lerpP(pp.pts[i-1],pp.pts[i],u);}

// ── swaying pictures ───────────────────────────────────────────────────────
const swayM=(iy,t)=>{const q=clamp((720-iy)/720);return 4.5*q*q*Math.sin(t*1.25-iy/95);};
const swayF=(iy,t)=>{const q=clamp((930-iy)/930);return 6*q*q*Math.sin(t*.85-iy/280);};
const mp=(ix,iy,t)=>[LM.ox+ix*LM.sc+swayM(iy,t),LM.oy+iy*LM.sc];
const fp=(ix,iy,t)=>[LF.ox+ix*LF.sc+swayF(iy,t),LF.oy+iy*LF.sc];
function swayPic(c,file,L,W,H,sway,t,a){
  if(a<=0)return;const im=pic(AI+file);
  if(!im){c.save();c.setLineDash([6,6]);D.round(c,L.ox,L.oy,W*L.sc,H*L.sc,10,null,rgba(C.muted,.4));c.restore();return;}
  c.save();c.globalAlpha*=a;
  const y0=Math.ceil(L.oy),y1=Math.floor(L.oy+H*L.sc);
  for(let y=y0;y<y1;y+=2){const iy=(y-L.oy)/L.sc,ih=Math.min(2/L.sc,H-iy);if(ih<=0)break;
    c.drawImage(im,0,iy,W,ih,L.ox+sway(iy+ih/2,t),y,W*L.sc,Math.min(2,ih*L.sc));}
  c.restore();
}

// ── small helpers ──────────────────────────────────────────────────────────
// wrapped rows; an opening bracket left at the end of a row moves to the next row
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{const r=splitLines(c,sg,w,size);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}return r;});
function textBlock(c,p,x,y,w,col,{size=22,lh=29,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
// fitText: a label in a dark rounded box, measured first; one line if it fits in maxW, otherwise wrapped.
// align: 'left' (x = left edge), 'center' (x = centre), 'right' (x = right edge). Returns the box.
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22}={}){
  const one=measure(c,p,size);let rows,w;
  if(one+28<=maxW){rows=[D.tr(p)];w=one+28;}else{rows=rowsOf(c,p,maxW-28,size);w=Math.max(...rows.map(r=>measure(c,r,size)))+28;}
  const lh=size+7,h=rows.length*lh+11,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',active?C.white:rgba(col,.85));
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
// a label with a leader line to a target point
function tag(c,p,x,y,tx,ty,col,a,{w=200,align='left'}={}){
  if(a<=0)return;const rows=rowsOf(c,p,w),lw=Math.max(...rows.map(r=>measure(c,r,22)));
  c.save();c.globalAlpha*=a;
  const ex=align==='left'?(tx<x?x-8:x+lw+8):(tx<x-lw?x-lw-8:x+8),ey=y-8+(rows.length-1)*14;
  line(c,[[ex,ey],[tx,ty]],rgba(col,.9),2);circle(c,tx,ty,4.5,col,C.ink,1.5);
  rows.forEach((r,i)=>text(c,r,x,y+i*29,22,col,align));c.restore();
}
function drop(c,x,y,r,a){if(a<=0)return;c.save();c.globalAlpha*=a;c.beginPath();c.moveTo(x,y-r*1.7);c.quadraticCurveTo(x+r,y-r*.2,x,y+r);c.quadraticCurveTo(x-r,y-r*.2,x,y-r*1.7);c.fillStyle=rgba(WATER,.9);c.fill();c.strokeStyle=rgba(C.white,.8);c.lineWidth=1.2;c.stroke();c.restore();}
function waterDot(c,x,y,a,r=4){if(a<=0)return;glow(c,x,y,r*2.6,C.cyan,.55*a);circle(c,x,y,r,rgba(C.cyan,a),null);}

// ── soil and rain ──────────────────────────────────────────────────────────
function soil(c,wet,t){
  const g=c.createLinearGradient(0,GY,0,600);g.addColorStop(0,SOIL_TOP);g.addColorStop(1,SOIL_BOT);
  c.fillStyle=g;c.fillRect(0,GY,960,130);
  if(wet>0){const w=c.createLinearGradient(0,GY,0,600);w.addColorStop(0,rgba(WATER,.30*wet));w.addColorStop(.5,rgba(WATER,.12*wet));w.addColorStop(1,rgba(WATER,.04*wet));c.fillStyle=w;c.fillRect(0,GY,960,130);
    // glints of water between soil grains
    const R=K.rng(5);for(let i=0;i<40;i++){const x=R()*960,y=GY+8+R()*118,ph=R()*TAU,a=wet*(.25+.25*Math.sin(t*2+ph));circle(c,x,y,1.8+R()*1.4,rgba(C.cyan,a),null);}
    // thin puddles on the surface
    [[430,GY+4,60],[880,GY+5,40],[40,GY+4,30]].forEach(([x,y,rx],i)=>{ellipse(c,x,y,rx*wet,4*wet,rgba(WATER,.55),rgba(C.cyan,.5),1.5);
      const u=mod(t*.6+i*.37);ellipse(c,x+(i-1)*12,y,6+u*rx*.5*wet,1.5+u*2,null,rgba(C.white,.5*(1-u)*wet),1.2);});}
  line(c,[[0,GY],[960,GY]],'#7a5c3e',3);
  const R=K.rng(9);for(let i=0;i<70;i++){const x=R()*960,y=GY+6+R()*120;circle(c,x,y,1.2+R()*2.4,rgba('#9c7b55',.35+R()*.3),null);}
}
const RAIN=(()=>{const R=K.rng(3),a=[];for(let i=0;i<70;i++)a.push({x:R()*1010,ph:R(),sp:.9+R()*.4,len:12+R()*8});return a;})();
function rain(c,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  RAIN.forEach(d=>{const u=mod(t*d.sp*.75+d.ph),y=-30+u*(GY+30),x=d.x-u*50;
    line(c,[[x,y],[x-3,y+d.len]],rgba('#8fd8ff',.85),2.2);
    if(u>.93){const k=(u-.93)/.07;ellipse(c,x-3,GY+2,3+k*10,1+k*2.5,null,rgba(C.cyan,.8*(1-k)),1.5);}});
  c.restore();
}

// ── fern vascular tissue (schematic) ───────────────────────────────────────
function rootsDrawn(c,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  ROOTS.forEach(r=>{const pts=rootPts(r).map(([ix,iy])=>fp(ix,iy,0));K.sline(c,pts,'#3a2614',9);K.sline(c,pts,'#d8b98a',5);
    // fine side rootlets
    const m=pts[4],n=pts[6];K.sline(c,[m,[m[0]-9,m[1]+8]],'#d8b98a',1.6);K.sline(c,[n,[n[0]+9,n[1]+7]],'#d8b98a',1.6);});
  c.restore();
}
function pipes(c,t,a,{roots=true}={}){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.lineCap='round';c.lineJoin='round';
  const draw=(pts,w,col)=>{c.beginPath();pts.forEach(([ix,iy],i)=>{const [x,y]=fp(ix,iy,t);i?c.lineTo(x,y):c.moveTo(x,y);});c.strokeStyle=col;c.lineWidth=w;c.stroke();};
  // in the roots only a thin core line, so the drawn roots stay visible
  if(roots)PATHS.forEach(p=>draw(p.pts.slice(0,p.r0+1),2,rgba(C.cyan,.8)));
  FPATH.forEach(p=>draw(p.pts,8,rgba(C.cyan,.22)));
  FPATH.forEach(p=>draw(p.pts,2.4,rgba(C.cyan,.75)));
  c.restore();
}
function flow(c,t,a,{roots=true,speed=170}={}){
  if(a<=0)return;
  (roots?PATHS:FPATH).forEach((pp,i)=>{const tot=pp.L[pp.L.length-1],gap=120;
    for(let d=mod(t*speed+i*37,gap);d<tot;d+=gap){const [ix,iy]=along(pp,d),[x,y]=fp(ix,iy,t),edge=Math.min(1,d/30,(tot-d)/40);waterDot(c,x,y,a*edge,3.6);}});
}

// ── moss: magnified cells (schematic, step 1) ──────────────────────────────
const M={x:470,y:250,r:150},SRC=[500,560],SRC_R=15;
const CW=38,CH=30,FILM=M.y+M.r-30;   // cell size; top of the water film at the bottom of the circle
const COLS=(()=>{const R=K.rng(21),a=[];for(let x=M.x-M.r-CW/2,i=0;x<M.x+M.r;x+=CW,i++)a.push({x,off:i%2?CH/2:0,hops:3+Math.floor(R()*3),ph:R()*4.5,ch:[...Array(12)].map(()=>[R(),R(),R()])});return a;})();
const cellY=(col,j)=>FILM-4-CH*(j+1)+col.off;   // top of cell j (j=0 sits on the film)
function colWater(col,t){const T=6.4,q=mod(t+col.ph,T),hop=.75;const n=Math.min(col.hops,q/hop);const out=q>col.hops*hop+2.2?clamp(1-(q-col.hops*hop-2.2)/.6):1;return{n,out};}
function cells(c,t,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  c.beginPath();c.arc(M.x,M.y,M.r,0,TAU);c.save();c.clip();
  c.fillStyle='#173a2a';c.fillRect(M.x-M.r,M.y-M.r,M.r*2,M.r*2);
  // cells
  COLS.forEach(col=>{const {n,out}=colWater(col,t);
    for(let j=0;j<12;j++){const y=cellY(col,j);if(y+CH<M.y-M.r)break;
      D.round(c,col.x+1.5,y+1.5,CW-3,CH-3,6,'rgba(120,178,92,.92)',null);
      c.beginPath();c.roundRect(col.x+1.5,y+1.5,CW-3,CH-3,6);c.strokeStyle='#d6efb4';c.lineWidth=2;c.stroke();
      // water filling the cells it has reached
      const fill=clamp(n-j);if(fill>0){const wa=out*(1-j/(col.hops+2.5));c.fillStyle=rgba(C.cyan,.55*wa);c.beginPath();c.roundRect(col.x+3,y+CH-3-(CH-6)*fill,CW-6,(CH-6)*fill,4);c.fill();}
      const [r1,r2,r3]=col.ch[j];ellipse(c,col.x+8+r1*(CW-16),y+8+r2*(CH-16),4.2,2.6,r3*3,'#2f6b22',null);ellipse(c,col.x+10+r2*(CW-20),y+9+r3*(CH-18),4.2,2.6,r1*3,'#2f6b22',null);}
    // the moving drop between cells
    if(n<col.hops&&out>0){const j=Math.floor(n),u=n-j,y0=j===0?FILM+10:cellY(col,j-1)+CH/2,y1=cellY(col,j)+CH/2;waterDot(c,col.x+CW/2,mix(y0,y1,smooth(u)),out,4);}
  });
  // water film on the surface
  const g=c.createLinearGradient(0,FILM,0,M.y+M.r);g.addColorStop(0,rgba(WATER,.85));g.addColorStop(1,rgba(WATER,.55));
  c.beginPath();c.moveTo(M.x-M.r,FILM);for(let x=M.x-M.r;x<=M.x+M.r;x+=8)c.lineTo(x,FILM+2*Math.sin(t*2.4+x/18));c.lineTo(M.x+M.r,M.y+M.r);c.lineTo(M.x-M.r,M.y+M.r);c.closePath();c.fillStyle=g;c.fill();
  for(let i=0;i<7;i++){const x=M.x-M.r+30+i*42,u=mod(t*.5+i*.31);circle(c,x,FILM+12-u*8,2.2,rgba(C.white,.6*(1-u)),null);}
  c.restore();
  circle(c,M.x,M.y,M.r,null,C.white,3);
  c.restore();
}
function connector(c,t,a){
  if(a<=0)return;const [sx,sy]=mp(...SRC,t);
  c.save();c.globalAlpha*=a;circle(c,sx,sy,SRC_R,null,C.white,2.5);
  // tangent lines from the small circle to the big one
  const dx=M.x-sx,dy=M.y-sy,d=Math.hypot(dx,dy),base=Math.atan2(dy,dx),ang=Math.asin((M.r-SRC_R)/d);
  [1,-1].forEach(sg=>{const th=base+sg*(Math.PI/2+ang);const p1=[sx+SRC_R*Math.cos(th),sy+SRC_R*Math.sin(th)],p2=[M.x+M.r*Math.cos(th),M.y+M.r*Math.sin(th)];
    dashed(c,[p1,p2],rgba(C.white,.75),2,[7,6],-t*10);});
  c.restore();
}
function rhizoids(c,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  RHZ.forEach(([x0,y0,x1,y1,x2,y2])=>{c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(x1,y1,x2,y2);c.strokeStyle='#e7cfa6';c.lineWidth=1.8;c.stroke();});
  c.restore();
}

// ── moss: water passed a short way (step 3) ────────────────────────────────
const MCOLS=[70,105,140,175,210,245];
function mossRise(c,t,a){
  if(a<=0)return;
  MCOLS.forEach((x,i)=>{const T=5.2,q=mod(t+i*.83,T),hops=4+(i%3),n=Math.min(hops,q/.6),out=q>hops*.6+1.6?clamp(1-(q-hops*.6-1.6)/.5):1;
    const yy=GY-6-Math.floor(n)*13-smooth(n%1)*13*(n<hops?1:0);
    for(let j=0;j<Math.floor(n);j++)circle(c,x+swayM(700-j*50,t)*.3,GY-6-j*13,2.4,rgba(C.cyan,.5*a*out),null);
    waterDot(c,x,yy,a*out,3.6);});
}

// ── step overlays ──────────────────────────────────────────────────────────
// glints of water on the plants after rain (step 0)
const MBEAD=[[160,500],[260,430],[360,440],[460,380],[560,500],[610,410],[760,400],[860,470],[700,520],[310,560]];
const FBEAD=FR.flatMap((f,i)=>[f[Math.floor(f.length*.45)],f[Math.floor(f.length*.75)]].map(([x,y],j)=>[x+(j?14:-14),y+(i%2?10:-8)]));
function over0(c,a,tau,t){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  rain(c,t,1);
  const ba=fade(tau,1.2,.8);
  MBEAD.forEach(([ix,iy],i)=>{const [x,y]=mp(ix,iy,t),pu=.6+.4*Math.sin(t*2.2+i);drop(c,x,y,3.4,ba*pu);});
  FBEAD.forEach(([ix,iy],i)=>{const [x,y]=fp(ix,iy,t),pu=.6+.4*Math.sin(t*2+i*.7);drop(c,x,y,3.4,ba*pu);});
  const L=LAB();
  fitText(c,P(`雨`,`Rain`),24,22,200,'#8fd8ff');
  c.save();c.globalAlpha*=fade(tau,.6,.6);fitText(c,P(`土壤裡的水`,`Water in the soil`),430,494,250,C.cyan,{align:'center'});c.restore();
  c.save();c.globalAlpha*=ba;fitText(c,L.water||P(`水`,`Water`),430,404,200,C.cyan,{align:'center',active:true});
  text(c,P(`苔和蕨都吸到水`,`Both take up water`),430,385,22,C.white,'center');c.restore();
  c.restore();
}
function over1(c,a,tau,t){
  if(a<=0)return;
  connector(c,t,a);cells(c,t,a);
  c.save();c.globalAlpha*=a;
  const L=LAB();
  fitText(c,P(`蘚苔的細胞放大（示意）`,`Moss cells, magnified (schematic)`),M.x,40,420,C.white,{align:'center'});
  // right column on a dark card so the dimmed fern does not show through the words
  const lx=646;D.round(c,lx-12,96,960-lx-2,322,16,'rgba(11,26,21,.92)',rgba(C.edge,1));
  const top=COLS[Math.floor(COLS.length*.62)],film=[M.x+M.r*.55,FILM+12];
  tag(c,P(`細胞（示意）`,`Cells (schematic)`),lx,136,top.x+CW/2,cellY(top,6)+CH/2,'#a7e07c',fade(tau,.6,.5),{w:290});
  tag(c,L.water||P(`水`,`Water`),lx,390,...film,C.cyan,fade(tau,.9,.5),{w:290});
  c.save();c.globalAlpha*=fade(tau,1.4,.5);
  fitText(c,L.cellToCell||P(`一個細胞傳給下一個`,`Cell to cell`),lx,196,300,C.cyan,{active:true});
  textBlock(c,P(`水從身體表面進去，\n往上傳幾格就停了`,`Water enters through the surface and is handed up only a few cells`),lx,276,290,C.white);
  c.restore();
  // rhizoids
  c.save();c.globalAlpha*=fade(tau,1.8,.5);
  tag(c,L.rhizoid||P(`假根（示意）`,`Rhizoids (schematic)`),312,512,RHZ[7][4],RHZ[7][5]-6,'#e7cfa6',1,{w:240});
  textBlock(c,P(`只負責固定，不是真根`,`Only hold the moss in place; not true roots`),312,544,250,C.white);
  c.restore();
  c.restore();
}
function over2(c,a,tau,t){
  if(a<=0)return;
  const pa=fade(tau,.5,.8);
  pipes(c,t,a*pa);flow(c,t,a*fade(tau,1,.6));
  c.save();c.globalAlpha*=a;
  const L=LAB();
  c.save();c.globalAlpha*=pa;
  fitText(c,L.pipe||P(`像水管一路送上去`,`Piped all the way up`),306,96,260,C.cyan,{active:true});
  const v=fp(...FR[2][6],t);tag(c,L.vascular||P(`維管束（示意）`,`Vascular tissue (schematic)`),306,224,v[0],v[1],C.cyan,1,{w:280});
  const w=fp(...FR[3][4],t);tag(c,P(`水送到每片葉`,`Water reaches every leaf`),306,330,w[0],w[1],C.cyan,fade(tau,1.4,.5),{w:220});
  c.restore();
  const r=fp(...rootPts(ROOTS[0])[2],0);
  tag(c,P(`根（示意）`,`Roots (schematic)`),556,520,r[0],r[1],'#e7cfa6',fade(tau,.3,.5),{w:200,align:'right'});
  c.restore();
}
function over3(c,a,tau,t){
  if(a<=0)return;
  pipes(c,t,a*.85,{roots:false});flow(c,t,a*fade(tau,.4,.6),{roots:false,speed:190});mossRise(c,t,a*fade(tau,.4,.6));
  c.save();c.globalAlpha*=a;
  const L=LAB(),ha=fade(tau,.8,.6);
  c.save();c.globalAlpha*=ha;
  // height marks
  dashed(c,[[16,MOSS_TOP],[298,MOSS_TOP]],rgba(C.yellow,.9),2.5,[8,6]);
  arrow(c,300,GY-4,300,MOSS_TOP+4,C.yellow,3);
  dashed(c,[[566,FERN_TOP],[952,FERN_TOP]],rgba(C.yellow,.9),2.5,[8,6]);
  arrow(c,566,GY-4,566,FERN_TOP+4,C.yellow,3);
  c.restore();
  c.save();c.globalAlpha*=fade(tau,1.3,.5);
  fitText(c,L.short||P(`矮（示意）`,`Short (schematic)`),312,MOSS_TOP-50,246,C.yellow,{active:true});
  textBlock(c,P(`水傳得到的高度有限`,`Water is passed up only a short way`),312,MOSS_TOP+32,240,C.white);
  c.restore();
  c.save();c.globalAlpha*=fade(tau,1.8,.5);
  fitText(c,L.tall||P(`可以長高（示意）`,`Can grow tall (schematic)`),554,FERN_TOP+14,330,C.yellow,{active:true,align:'right'});
  textBlock(c,P(`維管束把水\n一直送到頂`,`Vascular tissue\npipes water to\nthe very top`),554,FERN_TOP+92,240,C.white,{align:'right'});
  c.restore();
  c.save();c.globalAlpha*=fade(tau,2.3,.5);
  fitText(c,P(`示意，非實際高度`,`Schematic, not real heights`),430,GY+60,400,C.muted,{align:'center'});
  c.restore();
  c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function track(s,k,t){
  if(s.vasK===undefined){s.vasK=k;s.vasFrom=k;s.vasT=t-9;}
  if(s.vasK!==k){s.vasFrom=s.vasK;s.vasK=k;s.vasT=t;}
  if(t<s.vasT)s.vasT=t;
  return{from:s.vasFrom,u:smooth((t-s.vasT)/.9),ov:smooth((t-s.vasT)/.5)};
}
const MA=[1,1,.3,1],FA=[1,.1,1,1];
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const {from,u,ov}=track(s,k,t);
  const out=held?1:1-fade(tau,PER-.45,.45);
  const oa=j=>(j===k?out*clamp((t-s.vasT-.35)/.6):0)+(j===from&&from!==k?1-ov:0);
  const wet=k===0?(held?.25+.75*smooth(clamp(tau/3)):smooth(clamp(tau/3))):1;
  soil(c,mix(from===0&&k!==0?1:wet,wet,u),t);
  const ma=mix(MA[from],MA[k],u),fa=mix(FA[from],FA[k],u);
  swayPic(c,MF,LM,MW,MH,swayM,t,ma);
  rhizoids(c,oa(1));
  swayPic(c,FF,LF,FW,FH,swayF,t,fa);
  rootsDrawn(c,oa(2));   // a cut-away view: drawn over the soil mound
  over0(c,oa(0),k===0?tau:9,t);
  over1(c,oa(1),k===1?tau:9,t);
  over2(c,oa(2),k===2?tau:9,t);
  over3(c,oa(3),k===3?tau:9,t);
  // plant names on the soil, last so nothing covers them
  const L=LAB();
  fitText(c,L.moss||P(`蘚苔`,`Moss`),155,548,240,C.green,{align:'center'});
  c.save();c.globalAlpha*=Math.max(.35,fa);
  fitText(c,L.swordFern||P(`腎蕨`,`Sword fern`),760,548,240,C.green,{align:'center'});
  c.restore();
}
window.PlantsDraw.vascular=draw;
})();

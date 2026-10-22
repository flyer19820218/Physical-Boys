/* Microorganisms · "Paramecium" canvas (protozoa tab, view 0), 2026-10-22.
 * One AI illustration (paramecium_c.png, Gemini) carries every step; the moving parts are drawn on top of it:
 *   step 1  cilia beat in a travelling wave all round the cell (the picture's own cilia are clipped away and
 *           redrawn in the same colour, so there is only one look); a zoom circle shows a few cilia rowing.
 *   step 2  food particles are swept into the oral groove, gather in its pocket and are wrapped into a new
 *           food vacuole drawn in the picture's own vacuole colours; the vacuoles of the picture are ringed.
 *   step 3  the two star-shaped contractile vacuoles contract in turn: the picture's own star is redrawn
 *           shrunk about its centre over a patch of cytoplasm colour (a plane fitted to the pixels around it),
 *           water drops leave the cell where the star is closest to the edge; water seeps in all round.
 *   step 4  the picture slides left and shrinks; a panel lists the four life activities with numbered markers
 *           on the picture, one row lit after another; row 4 shows a small cell dividing in two (schematic).
 * Step changes: labels of the old step fade out, the camera eases (0.9 s), labels of the new step fade in.
 * Every structure position below was measured from the PNG (alpha mask opened by 9 px to drop the cilia,
 * bluish components for the stars and the nucleus, Hough circles for the food vacuoles), in picture pixels.
 */
(()=>{'use strict';
const K=window.MicroKit,{P,C,D,text,measure,splitLines,circle,glow,arrow,dashed,line,marker,fade,ease,smooth,mix,clamp,mod,rgba,stageClock,pic,AI,SIZE,TAU,rng}=K;
const N=4,PER=8,FILE='paramecium_c.png',[IW,IH]=SIZE[FILE];
const R0={x:110,y:84,w:740},K0=R0.w/IW;                       // picture rect at camera scale 1
const VIEWS=[{s:1,dx:0,dy:0},{s:1,dx:0,dy:0},{s:1,dx:0,dy:0},{s:.78,dx:-66,dy:44}];

// ── measured geometry (picture pixels) ─────────────────────────────────────
const BODY=[[1011,106],[999,88],[982,74],[961,63],[916,48],[881,41],[839,37],[810,37],[801,39],[776,39],[732,45],[726,48],[669,61],[629,77],[620,79],[614,77],[609,78],[608,80],[603,81],[599,87],[595,88],[593,92],[561,108],[557,107],[551,109],[548,115],[509,135],[446,159],[402,169],[323,183],[269,200],[227,218],[183,245],[146,273],[102,317],[100,322],[87,336],[84,343],[77,350],[70,361],[48,403],[38,434],[38,455],[44,473],[61,491],[101,513],[120,521],[166,536],[191,542],[201,542],[220,546],[246,548],[291,548],[330,545],[379,537],[434,522],[484,504],[597,452],[620,445],[621,443],[637,436],[680,423],[738,400],[810,365],[874,324],[908,296],[931,274],[965,234],[980,212],[1003,172],[1012,145],[1014,116]];
// BODY dilated by 2 px: the picture is clipped to it, so the drawn cilia replace the picture's cilia
const CLIP=[[1013,105],[1001,87],[994,80],[986,76],[984,73],[961,61],[916,46],[907,45],[903,43],[900,44],[881,39],[839,35],[810,35],[785,38],[776,37],[732,43],[726,46],[708,49],[690,55],[680,56],[674,59],[669,59],[657,65],[634,72],[629,75],[624,75],[620,77],[614,75],[609,76],[601,80],[597,86],[593,87],[591,91],[561,106],[557,105],[549,108],[546,114],[530,121],[509,133],[446,157],[402,167],[367,172],[348,177],[323,181],[269,198],[225,217],[181,244],[144,272],[100,316],[98,321],[85,335],[82,342],[75,349],[68,360],[46,402],[41,414],[41,419],[36,433],[36,456],[42,474],[59,492],[101,515],[120,523],[166,538],[179,540],[191,544],[201,544],[205,546],[208,545],[220,548],[235,548],[246,550],[291,550],[330,547],[379,539],[393,534],[434,524],[460,515],[470,510],[484,506],[490,502],[513,493],[552,474],[589,459],[597,454],[608,451],[613,448],[620,447],[623,444],[637,438],[644,437],[655,432],[680,425],[687,421],[738,402],[812,366],[876,325],[910,297],[933,275],[967,235],[982,213],[1005,173],[1014,146],[1016,134],[1016,115]];
// star-shaped contractile vacuoles: outline (incl. dark rim), patch = outline dilated 3 px,
// plane = cytoplasm colour around it, per channel [mean, d/dx, d/dy] about the centre
const STARS=[
 {c:[224.0,396.8],off:0,
  poly:[[226,298],[222,299],[218,312],[219,353],[216,361],[210,368],[199,371],[154,357],[136,356],[134,358],[135,362],[142,366],[181,381],[190,387],[201,401],[200,409],[192,416],[177,423],[144,434],[135,440],[137,445],[145,445],[171,437],[197,426],[206,427],[209,436],[189,484],[188,491],[191,495],[194,494],[202,484],[224,432],[231,424],[235,422],[244,421],[251,423],[291,445],[303,449],[308,447],[305,441],[272,419],[264,411],[262,401],[265,394],[275,384],[312,360],[316,356],[317,351],[313,350],[306,352],[261,374],[252,375],[244,372],[236,363],[233,354],[231,308],[229,301]],
  patch:[[226,295],[219,298],[215,310],[216,353],[213,360],[208,366],[198,368],[155,354],[136,353],[131,357],[131,361],[134,365],[146,371],[177,382],[187,388],[198,402],[197,408],[190,414],[178,420],[146,430],[132,439],[132,442],[135,447],[146,448],[172,440],[196,429],[203,430],[206,436],[188,477],[185,487],[186,494],[191,498],[196,496],[205,485],[224,439],[230,429],[235,425],[249,425],[281,443],[302,452],[311,448],[306,438],[275,418],[267,410],[265,401],[268,395],[278,385],[313,363],[319,357],[320,350],[315,347],[305,349],[262,371],[251,372],[246,370],[239,362],[236,354],[234,306],[232,300]],
  plane:[[214.69,.0898,-.0326],[213.00,.0688,-.0234],[203.23,.0439,-.0129]]},
 {c:[852.0,168.6],off:.5,
  poly:[[906,90],[902,89],[886,105],[869,130],[858,141],[853,143],[846,141],[839,135],[822,108],[810,95],[804,95],[804,100],[810,113],[829,143],[829,149],[825,152],[818,152],[778,140],[772,140],[769,144],[775,149],[819,165],[825,171],[825,178],[813,189],[781,207],[774,214],[775,217],[783,217],[827,196],[842,196],[846,198],[852,206],[857,249],[861,259],[865,261],[868,255],[869,245],[866,207],[868,199],[873,193],[878,190],[889,189],[925,198],[943,198],[943,194],[938,190],[893,173],[883,165],[878,157],[879,143],[901,108],[906,96]],
  patch:[[909,89],[904,86],[900,87],[882,105],[867,128],[854,140],[848,139],[841,133],[826,108],[812,93],[802,93],[801,102],[808,116],[825,142],[826,148],[817,149],[779,137],[770,138],[767,141],[766,145],[777,153],[817,167],[822,172],[822,177],[810,188],[780,204],[771,213],[772,218],[775,220],[784,220],[826,199],[843,199],[849,207],[854,251],[858,260],[865,264],[868,262],[872,250],[869,206],[871,200],[876,194],[891,192],[924,201],[945,200],[946,193],[943,190],[934,185],[895,171],[885,163],[881,156],[882,144],[906,105],[909,98]],
  plane:[[211.42,-.1206,.058],[210.42,-.0921,.047],[201.41,-.0598,.0318]]}];
const FOODV=[[345.5,271.5,41],[690.5,140.5,42],[764.5,310.5,41.5],[434.5,426.5,37]];   // food vacuoles of the picture
const NUC=[594.5,296.8];                                                                 // kidney-shaped nucleus (centroid)
// oral groove: opening on the upper edge, down the narrow channel into the dotted pocket
const GROOVE=[[614,80],[590,118],[565,155],[540,192],[522,228]];
const POCKET=[516,240],NEWV=[606,180],NEWR=27;                                          // new food vacuole: forms in the pocket, then moves into the cytoplasm
const VAC={fill0:'#d6d3ca',fill1:'#bfbcb5',rim:'#74766f',dot:'#4b4a44'};               // colours sampled from the picture's food vacuoles
const CILIA='rgba(226,229,220,.92)',CYTO='#dcd9cc',RIM='#b9c9d2';

// ── geometry helpers ───────────────────────────────────────────────────────
function inPoly(x,y,poly){let o=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)o=!o;}return o;}
// cilia roots every ~11 px along the outline, with the outward normal and the tangent
const ROOTS=(()=>{const pts=BODY,out=[];let acc=0,next=0;const L=[];
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];L.push(Math.hypot(b[0]-a[0],b[1]-a[1]));}
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],l=L[i];
    while(next<=acc+l){const u=(next-acc)/l,x=mix(a[0],b[0],u),y=mix(a[1],b[1],u);let tx=(b[0]-a[0])/l,ty=(b[1]-a[1])/l,nx=ty,ny=-tx;
      if(inPoly(x+nx*6,y+ny*6,BODY)){nx=-nx;ny=-ny;}out.push({x,y,nx,ny,tx,ty,s:next});next+=11;}
    acc+=l;}
  // smooth the normals over neighbours so cilia fan out evenly round corners
  return out.map((r,i)=>{let nx=0,ny=0;for(let j=-2;j<=2;j++){const q=out[(i+j+out.length)%out.length];nx+=q.nx;ny+=q.ny;}const n=Math.hypot(nx,ny);return{...r,nx:nx/n,ny:ny/n,tx:-ny/n,ty:nx/n};});})();
function nearestEdge(p){let best=null,bd=1e9;ROOTS.forEach(r=>{const d=Math.hypot(r.x-p[0],r.y-p[1]);if(d<bd){bd=d;best=r;}});return best;}
STARS.forEach(s=>{s.exit=nearestEdge(s.c);});
// where water seeps in (fractions of the outline)
const SEEP=[.03,.17,.31,.47,.62,.77,.9].map(f=>ROOTS[Math.floor(f*ROOTS.length)]);

// camera: picture pixel -> canvas
function camAt(s,k,t){
  if(s.paK===undefined){s.paK=k;s.paFrom=k;s.paT=t-9;}
  if(s.paK!==k){s.paFrom=s.paK;s.paK=k;s.paT=t;}
  if(t<s.paT)s.paT=t;
  const u=ease((t-s.paT)/.9),a=VIEWS[s.paFrom],b=VIEWS[k];
  return{s:mix(a.s,b.s,u),dx:mix(a.dx,b.dx,u),dy:mix(a.dy,b.dy,u),u,from:s.paFrom,since:t-s.paT};
}
const M=(cam,x,y)=>[cam.dx+cam.s*(R0.x+x*K0),cam.dy+cam.s*(R0.y+y*K0)];
const MS=(cam,v)=>v*K0*cam.s;
function inPic(c,cam,fn){c.save();c.translate(cam.dx+cam.s*R0.x,cam.dy+cam.s*R0.y);c.scale(cam.s*K0,cam.s*K0);fn();c.restore();}
const path=(c,poly)=>{c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();};

// ── labels ─────────────────────────────────────────────────────────────────
// Text rows start at baseline y; a leader runs from the nearest side of the text box to each target.
function label(c,p,x,y,{align='left',col=C.yellow,a=1,to=[],w=300,size=22}={}){
  if(a<=0)return;
  const rows=D.tr(p).split('\n').flatMap(seg=>splitLines(c,seg,w,size)),lh=Math.round(size*1.3);
  const bw=Math.max(...rows.map(r=>measure(c,r,size))),bx=align==='left'?x:align==='right'?x-bw:x-bw/2,by=y-size*.8,bh=(rows.length-1)*lh+size*1.05;
  c.save();c.globalAlpha*=a;
  to.forEach(([tx,ty])=>{const sx=clamp2(tx,bx-6,bx+bw+6),sy=clamp2(ty,by-4,by+bh+4);
    if(Math.hypot(tx-sx,ty-sy)>8){line(c,[[sx,sy],[tx,ty]],rgba(col,.9),2);circle(c,tx,ty,4.5,col,C.ink,1.5);}});
  rows.forEach((r,i)=>text(c,r,align==='left'?x:align==='right'?x:x,y+i*lh,size,col,align));
  c.restore();
}
const clamp2=(v,a,b)=>Math.max(a,Math.min(b,v));

// ── picture layers ─────────────────────────────────────────────────────────
function picture(c,cam,a=1){
  const im=pic(AI+FILE);
  if(!im){const [x,y]=M(cam,0,0);c.save();c.setLineDash([6,6]);D.round(c,x,y,MS(cam,IW),MS(cam,IH),10,null,rgba(C.muted,.4));c.restore();return false;}
  inPic(c,cam,()=>{c.save();c.globalAlpha*=a;path(c,CLIP);c.clip();c.drawImage(im,0,0,IW,IH);c.restore();});
  return true;
}
// cilia: a travelling (metachronal) wave; amp lets a step make the beat stronger
function cilia(c,cam,t,amp=1,a=1){
  inPic(c,cam,()=>{c.save();c.globalAlpha*=a;c.strokeStyle=CILIA;c.lineWidth=2.3;c.lineCap='round';
    ROOTS.forEach(r=>{const ph=TAU*(1.25*t-r.s/150),th=(.32+.42*Math.sin(ph))*amp,L=27+3*Math.sin(r.s*.37);
      const dx=r.nx*Math.cos(th)+r.tx*Math.sin(th),dy=r.ny*Math.cos(th)+r.ty*Math.sin(th);
      const cx=r.nx*Math.cos(th*.4)+r.tx*Math.sin(th*.4),cy=r.ny*Math.cos(th*.4)+r.ty*Math.sin(th*.4);
      c.beginPath();c.moveTo(r.x-r.nx,r.y-r.ny);c.quadraticCurveTo(r.x+cx*L*.55,r.y+cy*L*.55,r.x+dx*L,r.y+dy*L);c.stroke();});
    c.restore();});
}
// contraction of star i at time t: 1 = full (as in the picture), down to .36 when emptied
function starScale(st,t){
  const p=mod(t/3.6-st.off);
  if(p<.6)return .36+.64*smooth(p/.6);
  if(p<.78)return 1;
  if(p<.9)return 1-.64*smooth((p-.78)/.12);
  return .36;
}
const contracting=(st,t)=>{const p=mod(t/3.6-st.off);return p>=.78&&p<.95?(p-.78)/.17:-1;};
function stars(c,cam,t,on){
  if(on<=0)return;
  const im=pic(AI+FILE);if(!im)return;
  STARS.forEach(st=>{
    const f=mix(1,starScale(st,t),on),[cx,cy]=st.c;
    if(f>.995)return;
    inPic(c,cam,()=>{
      // cover the picture's star with cytoplasm colour (plane fit), then redraw the star shrunk about its centre
      const pl=st.plane,gx=pl[0][1],gy=pl[0][2],gl=Math.hypot(gx,gy)||1,ux=gx/gl,uy=gy/gl,E=110;
      const col=d=>`rgb(${pl.map(ch=>Math.round(ch[0]+(ch[1]*ux+ch[2]*uy)*d)).join(',')})`;
      const g=c.createLinearGradient(cx-ux*E,cy-uy*E,cx+ux*E,cy+uy*E);g.addColorStop(0,col(-E));g.addColorStop(1,col(E));
      c.save();path(c,st.patch);c.fillStyle=g;c.fill();c.strokeStyle=g;c.lineWidth=2.5;c.globalAlpha*=.6;c.stroke();c.restore();
      c.save();c.translate(cx,cy);c.scale(f,f);c.translate(-cx,-cy);path(c,st.poly);c.clip();c.drawImage(im,0,0,IW,IH);c.restore();
    });
  });
}
function vacuole(c,x,y,r,a=1,dots=null){
  c.save();c.globalAlpha*=a;
  const g=c.createRadialGradient(x-r*.25,y-r*.3,r*.1,x,y,r);g.addColorStop(0,VAC.fill0);g.addColorStop(1,VAC.fill1);
  circle(c,x,y,r,g,VAC.rim,Math.max(1.2,r*.07));
  circle(c,x-r*.35,y-r*.4,r*.16,'rgba(242,236,217,.55)',null);
  if(dots)dots();
  c.restore();
}

// ── zoom circle: a few cilia rowing (step 1) ──────────────────────────────
function ciliaZoom(c,cam,t,a){
  if(a<=0)return;
  const src=ROOTS[Math.floor(ROOTS.length*.57)],[sx,sy]=M(cam,src.x+src.nx*12,src.y+src.ny*12),ZX=832,ZY=478,ZR=74;
  c.save();c.globalAlpha*=a;
  circle(c,sx,sy,13,null,C.yellow,2.5);
  const ang=Math.atan2(ZY-sy,ZX-sx),ox=Math.cos(ang),oy=Math.sin(ang);
  dashed(c,[[sx+ox*14,sy+oy*14],[ZX-ox*(ZR+3),ZY-oy*(ZR+3)]],rgba(C.yellow,.8),2,[6,5]);
  c.save();c.beginPath();c.arc(ZX,ZY,ZR,0,TAU);c.fillStyle='#16332b';c.fill();c.clip();
  // the cell surface along the bottom of the circle, cilia standing on it
  const base=ZY+34;
  c.fillStyle=CYTO;c.fillRect(ZX-ZR,base,ZR*2,ZR);c.fillStyle=RIM;c.fillRect(ZX-ZR,base-2,ZR*2,7);
  for(let i=0;i<7;i++){const bx=ZX-63+i*21,p=mod(1.1*t-i*.11);let phi,bend;
    if(p<.3){phi=-1+2*(p/.3);bend=0;}else{const q=(p-.3)/.7;phi=1-2*q;bend=Math.sin(Math.PI*q)*.9;}
    const L=52,tx=bx+L*Math.sin(phi),ty=base-L*Math.cos(phi),cx=bx+L*.5*Math.sin(phi-bend),cy=base-L*.5*Math.cos(phi-bend);
    c.beginPath();c.moveTo(bx,base);c.quadraticCurveTo(cx,cy,tx,ty);c.strokeStyle=CILIA;c.lineWidth=4;c.lineCap='round';c.stroke();}
  // water pushed along by the fast stroke
  const wx=ZX-40+mod(t*40,30);arrow(c,wx,ZY-44,wx+48,ZY-44,C.cyan,3);
  c.restore();
  circle(c,ZX,ZY,ZR,null,C.yellow,2.5);
  label(c,P(`纖毛（放大）`,`Cilia (zoomed in)`),ZX,ZY-ZR-12,{align:'center',col:C.yellow});
  label(c,P(`像小槳一樣推水`,`Row like oars,\npushing water`),ZX-ZR-14,ZY+ZR-30,{align:'right',col:C.cyan,w:200});
  c.restore();
}

// ── step overlays ──────────────────────────────────────────────────────────
const SIZE_NOTE=P(`示意，非同比例（真實約 150～300 µm）`,`Schematic, not to scale (real size about 150–300 µm)`);
function step0(c,cam,t,tau,a){
  if(a<=0)return;
  const top=ROOTS.reduce((b,r)=>r.y<b.y?r:b,ROOTS[0]);
  label(c,P(`纖毛`,`Cilia`),640,52,{col:C.yellow,a,to:[M(cam,top.x-60,top.y-14),M(cam,top.x+20,top.y-18)]});
  label(c,P(`細胞核`,`Nucleus`),420,560,{col:C.white,a,to:[M(cam,NUC[0]-30,NUC[1]+20)]});
  ciliaZoom(c,cam,t,a);
}
// food particles: ride the path from above the cell into the pocket, gather, are wrapped, move away, fade
const FOODP=Array.from({length:8},(_,i)=>{const r=rng(31+i);return{t0:.3+i*.42,sx:470+r()*90,sy:-40-r()*30,gx:(r()-.5)*22,gy:(r()-.5)*18,rot:r()*TAU};});
function foodPath(p){const pts=[[p.sx,p.sy],[560,20],...GROOVE,[POCKET[0]+p.gx,POCKET[1]+p.gy]];return pts;}
function alongPath(pts,u){const L=[];let tot=0;for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);L.push(l);tot+=l;}
  let d=clamp(u)*tot,i=0;while(i<L.length-1&&d>L[i]){d-=L[i];i++;}const f=L[i]?d/L[i]:0;return[mix(pts[i][0],pts[i+1][0],f),mix(pts[i][1],pts[i+1][1],f)];}
function bacterium(c,x,y,rot,col,sz){c.save();c.translate(x,y);c.rotate(rot);D.round(c,-sz,-sz*.48,sz*2,sz*.96,sz*.48,col,rgba('#0b1a15',.55));c.restore();}
function step1(c,cam,t,tau,a){
  if(a<=0)return;
  const q=mod(tau,PER),fadeOut=1-fade(q,7.3,.6),sc=cam.s*K0;
  const form=fade(q,4.5,.6),move=smooth(fade(q,5.2,1.3)),digest=fade(q,6.4,1.2);
  const vx=mix(POCKET[0],NEWV[0],move),vy=mix(POCKET[1],NEWV[1],move);
  // rings on the food vacuoles already in the picture
  FOODV.forEach(([x,y,r],i)=>{const [X,Y]=M(cam,x,y);c.save();c.globalAlpha*=a*.85;c.setLineDash([7,6]);c.lineDashOffset=-t*10;circle(c,X,Y,MS(cam,r)+6,null,C.orange,2.5);c.restore();});
  // the new vacuole (picture colours), particles inside it
  const [VX,VY]=M(cam,vx,vy);
  if(form>0)vacuole(c,VX,VY,MS(cam,NEWR)*ease(form),a*fadeOut);
  FOODP.forEach(p=>{
    const u=(q-p.t0)/2.3;if(u<0)return;
    let x,y;
    if(form<=0||u<1){[x,y]=alongPath(foodPath(p),ease(u));}else{x=vx+p.gx*.8;y=vy+p.gy*.8;}
    const [X,Y]=M(cam,x,y),col=digest>0?`rgb(${Math.round(mix(251,110,digest))},${Math.round(mix(146,100,digest))},${Math.round(mix(60,80,digest))})`:C.orange;
    c.save();c.globalAlpha*=a*fadeOut*(1-.5*digest);bacterium(c,X,Y,p.rot+t*.6*(u<1?1:0),col,Math.max(3.4,7*sc*1.4));c.restore();});
  // sweep arrow into the groove
  const [ox,oy]=M(cam,GROOVE[0][0],GROOVE[0][1]),[ax,ay]=M(cam,560,8);
  c.save();c.globalAlpha*=a*.9;dashed(c,[[ax,ay],[ox-4,oy-14]],rgba(C.orange,.85),2.5,[6,5],-t*14);arrow(c,ox-8,oy-26,ox-2,oy-8,C.orange,2.5);c.restore();
  // groove outline glow
  c.save();c.globalAlpha*=a*(.55+.45*Math.sin(t*3));c.strokeStyle=C.yellow;c.lineWidth=3;c.lineCap='round';c.lineJoin='round';c.beginPath();
  GROOVE.forEach((g,i)=>{const [X,Y]=M(cam,g[0],g[1]);i?c.lineTo(X,Y):c.moveTo(X,Y);});c.setLineDash([3,7]);c.stroke();c.restore();
  label(c,P(`食物（細菌等）`,`Food (bacteria etc.)`),620,42,{col:C.orange,a,to:[M(cam,575,0)]});
  label(c,P(`口溝`,`Oral groove`),300,150,{align:'right',col:C.yellow,a,to:[M(cam,548,180)]});
  label(c,P(`食物泡`,`Food vacuoles`),640,470,{col:C.orange,a,to:[[VX+MS(cam,NEWR)*.7,VY+MS(cam,NEWR)*.7],M(cam,764.5,340),M(cam,450,455)]});
  if(form>0&&move<1)label(c,P(`形成食物泡`,`A food vacuole forms`),300,190,{align:'right',col:C.orange,a:a*form*(1-move),to:[[VX-MS(cam,NEWR),VY]]});
}
function step2(c,cam,t,tau,a){
  if(a<=0)return;
  // water seeping in all round
  SEEP.forEach((r,i)=>{const u=mod(t*.55+i*.37),o=36-u*44,[x0,y0]=M(cam,r.x+r.nx*o,r.y+r.ny*o),[x1,y1]=M(cam,r.x+r.nx*(o-16),r.y+r.ny*(o-16));
    c.save();c.globalAlpha*=a*Math.sin(Math.PI*u);arrow(c,x0,y0,x1,y1,C.cyan,2.5);c.restore();});
  // contraction: ring flash + drops out where the star is closest to the edge
  STARS.forEach(st=>{
    const [cx,cy]=M(cam,...st.c),f=starScale(st,t),k=contracting(st,t);
    c.save();c.globalAlpha*=a*.9;circle(c,cx,cy,MS(cam,96)*(.55+.45*f),null,rgba(C.cyan,.75),2.5);c.restore();
    const e=st.exit,p=mod(t/3.6-st.off);
    for(let j=0;j<3;j++){const u=(mod(p-.8-j*.035))/.32;if(u>1)continue;
      const d0=-Math.hypot(e.x-st.c[0],e.y-st.c[1]),dd=mix(d0*.25,34,ease(u)),[X,Y]=M(cam,e.x+e.nx*dd,e.y+e.ny*dd);
      c.save();c.globalAlpha*=a*(1-u*u);circle(c,X,Y,4.5,C.cyan,rgba(C.white,.8),1.2);c.restore();}
    if(k>=0){c.save();c.globalAlpha*=a*(1-k);circle(c,cx,cy,MS(cam,70)*(1-k*.5),null,C.white,3);c.restore();}
  });
  const [L,Rr]=STARS,eR=Rr.exit;
  label(c,P(`伸縮泡`,`Contractile\nvacuole`),118,540,{align:'center',col:C.cyan,a,to:[M(cam,206,470)]});
  label(c,P(`伸縮泡`,`Contractile vacuole`),936,58,{align:'right',col:C.cyan,a,to:[M(cam,905,120)]});
  label(c,P(`多餘的水排出去`,`Extra water\npumped out`),560,52,{align:'right',col:C.cyan,a,to:[M(cam,eR.x+eR.nx*30-10,eR.y+eR.ny*30)]});
  label(c,P(`水不斷滲進細胞`,`Water keeps\nseeping in`),660,470,{col:C.cyan,a,to:[M(cam,SEEP[3].x+SEEP[3].nx*14,SEEP[3].y+SEEP[3].ny*14)]});
}
// row i of the step-4 panel: [title, sub, which structures light up]
const ROWS=[[P(`移動`,`Moving`),P(`纖毛擺動`,`Beating cilia`)],[P(`攝食`,`Feeding`),P(`口溝、食物泡`,`Oral groove, food vacuoles`)],
  [P(`排水`,`Removing water`),P(`伸縮泡`,`Contractile vacuoles`)],[P(`繁殖`,`Reproducing`),P(`細胞分裂成兩個`,`The cell splits into two`)]];
function division(c,x,y,t,a){
  // schematic fission of a small copy of the same picture: whole -> pinched -> two cells (loops every 4.4 s)
  const im=pic(AI+FILE);if(!im)return;
  const q=mod(t,4.4),w=96,h=w*IH/IW,pinch=smooth(fade(q,.8,1.2)),split=fade(q,2.2,.6),gap=pinch*16;
  c.save();c.globalAlpha*=a;
  if(split<1){c.save();c.globalAlpha*=1-split;
    [-1,1].forEach(sd=>{c.save();c.beginPath();c.ellipse(x+sd*(w*.27+gap/2),y,w*.31,h*.62,0,0,TAU);c.clip();c.drawImage(im,x-w/2+sd*gap/2,y-h/2,w,h);c.restore();});
    c.restore();}
  if(split>0){c.save();c.globalAlpha*=split;[-1,1].forEach(sd=>c.drawImage(im,x+sd*48-38,y-30*IH/IW*76/60/1.27,76,76*IH/IW));c.restore();}
  c.restore();
}
function step3(c,cam,t,tau,a){
  if(a<=0)return;
  const hi=Math.floor(mod(tau,8.8)/2.2),PX=616,PW=330;
  c.save();c.globalAlpha*=a;
  D.round(c,PX,22,PW,556,16,'rgba(11,26,21,.72)',C.edge);
  text(c,P(`一個細胞，做所有事`,`One cell does it all`),PX+PW/2,58,24,C.white,'center');
  let y=82;
  ROWS.forEach(([ti,sub],i)=>{
    const on=i===hi,rows=splitLines(c,D.tr(sub),PW-74,22),hgt=i===3?156:Math.max(96,40+rows.length*28+14);
    D.round(c,PX+10,y,PW-20,hgt-10,12,on?rgba(C.yellow,.16):'rgba(28,61,52,.55)',on?C.yellow:rgba(C.edge,.9));
    marker(c,PX+34,y+26,i+1,on?t:null,14,on?C.yellow:C.muted);
    text(c,ti,PX+58,y+34,24,on?C.yellow:C.white);
    rows.forEach((r,j)=>text(c,r,PX+58,y+64+j*28,22,on?C.white:C.muted));
    if(i===3)division(c,PX+PW/2+10,y+hgt-50,t,1);
    if(i<3)D.hit(PX+10,y,PW-20,hgt-10,'phase',i);
    y+=hgt;});
  c.restore();
  // numbered markers on the picture
  const top=ROOTS.reduce((b,r)=>r.y<b.y?r:b,ROOTS[0]);
  const spots=[[M(cam,top.x-120,top.y-26)],[M(cam,560,150),M(cam,NEWV[0]+60,NEWV[1]-40)],[M(cam,...STARS[0].c),M(cam,...STARS[1].c)]];
  spots.forEach((ps,i)=>ps.forEach(([x,y])=>{c.save();c.globalAlpha*=a;marker(c,x,y,i+1,i===hi?t:null,14,i===hi?C.yellow:C.muted);c.restore();}));
  label(c,P(`細胞核`,`Nucleus`),330,520,{align:'center',col:C.white,a,to:[M(cam,NUC[0]-20,NUC[1]+30)]});
}
const STEPS=[step0,step1,step2,step3];

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau}=stageClock(s,t,N,PER);
  s.shown=k;
  const cam=camAt(s,k,t),from=cam.from,since=cam.since;
  const aNew=from===k?1:fade(since,.35,.5),aOld=from===k?0:1-fade(since,0,.4);
  // the contractile vacuoles move in steps 3 and 4 (eased in and out with the step change)
  const starOn=(i=>i===2||i===3);
  const sOn=mix(starOn(from)?1:0,starOn(k)?1:0,cam.u);
  const cOn=mix(from===0?1.25:1,k===0?1.25:1,cam.u);
  const [gx,gy]=M(cam,560,300);glow(c,gx,gy,MS(cam,560),'#9fd3c8',.08+.02*Math.sin(t*1.3));
  if(picture(c,cam)){stars(c,cam,t,sOn);cilia(c,cam,t,cOn);}
  if(from!==k&&aOld>0)STEPS[from](c,cam,t,PER,aOld);
  STEPS[k](c,cam,t,tau,aNew);
  if(k!==3||from!==3)text(c,SIZE_NOTE,20,36,22,rgba(C.muted,(k===3?1-cam.u:1)*.95));
  if(k===3)text(c,SIZE_NOTE,20,36,22,rgba(C.muted,0));
}
window.MicroDraw.paramecium=draw;
})();

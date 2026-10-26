/* Plants · "Many ovules: one pollen tube for each ovule" canvas (water tab, view 2), 2026-10-23.
 * The ovary is ovary_multi.png (teacher's Gemini AI illustration, 607×1318: an ovary cut lengthwise, stigma and style on
 * top, 5 ovules in one column, each on a stalk from the placenta on the left wall). The pea pod is pea_pod.png
 * (AI illustration, 2007×716, 6 peas). Pollen grains, pollen tubes, sperm cells, egg, central cell, seeds, the fruit
 * colour, the number markers and the tube routes are schematic, drawn here. Positions on the pictures were measured
 * from their alpha channel and colours (see the constants below):
 *   ovary_multi.png: stigma lip y 8..50 (x 223..388 at y 25), style x 266..345 (y 80..240), ovary from y ~330,
 *     locule top y ~380 (x 250..360); placenta = pale wavy band x ~105..180 along the left wall, locule from x ~185;
 *     ovules (dark outline at x 300, top/bottom; right outline on the centre row): 1 y 430..526 x ..372,
 *     2 y 554..669 x ..365, 3 y 693..812 x ..362, 4 y 835..954 x ..368, 5 y 974..1086 x ..389; left end x ~250
 *     where the stalk joins; each has a small beak on the free right end = micropyle, tip at (380,506) (376,632)
 *     (373,767) (375,905) (390,1035); gaps between neighbouring ovules at x 300: y 540, 681, 823, 964.
 *     Tube routes (2026-10-26, measured from a tissue / cavity split of the picture bounded by its dark outlines):
 *     right edge of the placenta band ≈ x 242 (y 410..435), 227→188 (446..560), 172..176 (585..690), 151..163
 *     (746..870), 155..181 (896..1016); a cavity pocket sits above each ovule, its lower corner bulging into the band
 *     at (245,438) (190,560) (155,705) (151,855) (178,1010); below it the stalk runs to the ovule's left end (stalk
 *     mouths on the band at y 436..447, 579..585, 729..745, 879..897, 1023..1045). See ROUTE.
 *   pea_pod.png: 6 peas, centres (549,406) (780,422) (981,424) (1182,428) (1385,424) (1587,412), radius ~85.
 * Colours, the same in the whole lesson: sperm cells cyan #55e9ff, egg pink, central cell purple, pollen tube yellow.
 *  0 the ovary: stigma, style, ovary, placenta, 5 ovules numbered 1..5;
 *  1 zoom on the stigma: 5 pollen grains land, each grows one tube; tally pollen 5, tubes 5;
 *  2 zoom out: the 5 tubes go down the style and, as a bundle, down the placenta on the wall; each leaves the bundle
 *    by a smooth curve onto the stalk of its own ovule and follows the stalk and the ovule's surface to its micropyle;
 *  3 zoom on the ovules: tallies tick up (5 pollen, 5 tubes); ovule by ovule the tube releases 2 sperm cells,
 *    sperm 1 → egg, sperm 2 → central cell; tally sperm 10, unions 10 (5 eggs + 5 central cells); n ovules → n, 2n;
 *  4 fruit: state A all 5 fertilized → 5 seeds; state B (clearly switched, own heading) ovule 4 got no tube → no seed,
 *    4 seeds; pea pod: 6 peas = 6 ovules fertilized; one line: 1 ovule (rice) → 1 seed. Held: A and B alternate.
 * Idle motion: rings and markers pulse, grains and sperm shimmer, dots stream in the tubes, rings on fertilized cells,
 * seeds shine. Step texts live in plants_diversity_1022_v1.js (MU_*); the short step names are repeated here.
 */
(()=>{'use strict';
const K=window.PlantsKit,{P,C,D,text,measure,splitLines,circle,ellipse,glow,line,dashed,stageClock,fade,smooth,mix,clamp,mod,rgba,TAU}=K;
const N=5,PER=8;
const FILE='ovary_multi.png',[IW,IH]=K.SIZE[FILE];
const POD='pea_pod.png',[PW,PH]=K.SIZE[POD];
// colours
const EGG={fill:'#f9a8d4',edge:'#db2777',lab:C.pink};
const CEN={fill:'#e9d5ff',edge:'#9333ea',nuc:'#7e22ce',lab:'#d8b4fe'};
const TUBE=C.yellow,TUBE_EDGE='#a16207',GRAIN='#facc15',STRUCT='#efe6c8',PLAC='#a7e07c',OVL='#fdf4dc',FRUIT='#86c46a',SEED='#a3d977',WITHER='#c8a070';
// ── geometry of the picture (image px, measured) ───────────────────────────
const OVC=[[311,478],[307,611],[306,752],[309,894],[319,1030]];
const ORX=[61,58,56,59,70],ORY=[48,57,60,60,56];
const NUB=[[380,506],[376,632],[373,767],[375,905],[390,1035]];
const GX=[350,327,306,285,262],GY=-3,GR=11;          // pollen grain j serves ovule j (rightmost grain → top ovule)
const SL=[329,317,305,293,281];                       // lanes in the style
const EGGP=[],CENP=[];
OVC.forEach((c,j)=>{const n=NUB[j],d=Math.hypot(n[0]-c[0],n[1]-c[1]),u=[(n[0]-c[0])/d,(n[1]-c[1])/d];
  EGGP.push([c[0]+u[0]*(d-46),c[1]+u[1]*(d-46)]);CENP.push([c[0]-u[0]*14,c[1]-u[1]*14]);});
const PEAS=[[549,406],[780,422],[981,424],[1182,428],[1385,424],[1587,412]];
// ── cameras: image point (ix,iy) shown at screen (sx,sy), scale k ─────────
const CF={k:.445,ix:303,iy:659,sx:560,sy:300};
const CAM=[CF,{k:1,ix:305,iy:120,sx:600,sy:262},CF,{k:.7,ix:303,iy:780,sx:512,sy:300},{k:.42,ix:303,iy:659,sx:427,sy:300}];
let cam=CF;
const X=ix=>cam.sx+(ix-cam.ix)*cam.k,Y=iy=>cam.sy+(iy-cam.iy)*cam.k,S=(ix,iy)=>[X(ix),Y(iy)];
const lw=w=>w/cam.k;
// layout: left caption panel, stage on the right
const LP={x:12,y:10,w:274,h:580},LX=26,LW=246;

// ── small helpers (as in plants_draw_ovule_1022_v1.js) ─────────────────────
const rowsOf=(c,p,w,size=22)=>D.tr(p).split('\n').flatMap(sg=>{const r=splitLines(c,sg,w,size);
  for(let i=0;i<r.length-1;i++){const m=r[i].match(/\s*[(（「]$/);if(m&&r[i].length>m[0].length){r[i]=r[i].slice(0,-m[0].length);r[i+1]=m[0].trim()+r[i+1];}}
  for(let i=1;i<r.length;i++)while(/^[，。、；：！？）」,.;:!?)]/.test(r[i])&&r[i-1].length>1&&/[一-鿿]/.test(r[i-1])){r[i]=r[i-1].slice(-1)+r[i];r[i-1]=r[i-1].slice(0,-1);}return r;});
function textBlock(c,p,x,y,w,col,{size=22,lh=29,align='left'}={}){const rows=rowsOf(c,p,w,size);rows.forEach((r,i)=>text(c,r,x,y+i*lh,size,col,align));return rows.length*lh;}
function boxRows(c,p,maxW,size=22){const one=measure(c,p,size);
  if(one+28<=maxW&&!D.tr(p).includes('\n'))return{rows:[D.tr(p)],w:one+28};
  const rows=rowsOf(c,p,maxW-28,size);return{rows,w:Math.max(...rows.map(r=>measure(c,r,size)))+28};}
const boxH=(c,p,maxW,size=22)=>boxRows(c,p,maxW,size).rows.length*(size+7)+11;
function fitText(c,p,x,y,maxW,col,{align='left',active=false,size=22}={}){
  const {rows,w}=boxRows(c,p,maxW,size);
  const lh=size+7,h=rows.length*lh+11,bx=align==='center'?x-w/2:align==='right'?x-w:x;
  D.round(c,bx,y,w,h,Math.min(h/2,20),active?col:'rgba(11,26,21,.92)',active?C.white:rgba(col,.85));
  rows.forEach((r,i)=>text(c,r,bx+w/2,y+5+size*.9+i*lh,size,active?C.deep:col,'center'));
  return{x:bx,y,w,h};
}
// a boxed label with leader lines to one or more target points (screen px)
function tagBox(c,p,x,y,maxW,targets,col,a=1,o={}){
  if(a<=0)return null;c.save();c.globalAlpha*=a;
  const r=fitText(c,p,x,y,maxW,col,o);
  (Array.isArray(targets[0])?targets:[targets]).forEach(([tx,ty])=>{
    const ex=tx<r.x?r.x:tx>r.x+r.w?r.x+r.w:tx,ey=ty<r.y?r.y:ty>r.y+r.h?r.y+r.h:r.y+r.h/2;
    line(c,[[ex,ey],[tx,ty]],rgba(col,.95),2);circle(c,tx,ty,4.5,col,C.ink,1.5);});
  fitText(c,p,x,y,maxW,col,o);c.restore();return r;
}
const stepA=(held,tau,t0=0)=>held?fade(tau,t0,.5):fade(tau,t0,.5)*(1-fade(tau,PER-.4,.4));

// ── tube paths (image px): grain → style lane → along the placenta → its own stalk → over the ovule → its micropyle ─
// Catmull-Rom spline through pts; pre/post: extra points before the first / after the last (they set the end tangents)
function spline(pts,n=10,pre,post){const out=[];
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pre||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||post||p2;
    for(let j=0;j<n;j++){const u=j/n,u2=u*u,u3=u2*u;
      out.push([0,1].map(d=>.5*(2*p1[d]+(-p0[d]+p2[d])*u+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*u2+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*u3)));}}
  out.push(pts[pts.length-1]);return track(out);}
function track(out){const L=[0];for(let i=1;i<out.length;i++)L.push(L[i-1]+Math.hypot(out[i][0]-out[i-1][0],out[i][1]-out[i-1][1]));
  return{pts:out,L,len:L[L.length-1]};}
// ROUTE[j]: tube j below the style (x,y pairs about 12 px apart, after (SL[j],290)), measured on ovary_multi.png.
// The 5 tubes leave the style as one bundle, cross the top of the ovary and run down the placenta band on the left
// wall, 7.5 px apart, the tube of the top ovule outermost (7-9 px inside the band's edge, so its edge lies on the
// outline); below each stalk the rest close up to the edge again. Tube j follows the edge of the pocket above ovule j
// round its lower corner onto the stalk, rides up the ovule's shoulder onto its outer surface (7 px outside the
// outline), round the free end to the beak, and ends at the micropyle. Smooth (largest turn about 20° per 8 px of
// tube), never over another ovule or a number marker.
const ROUTE=[
 [327.6,301.9,324.7,313.6,320.2,324.7,314.2,335.1,306.8,344.6,298.6,353.3,289.7,361.3,280.4,369,271,376.4,261.6,384,252.7,392,244.5,400.8,238,410.9,235.5,422.5,238.4,434.1,245.9,443.3,256.6,448.6,268.5,448.6,279.4,443.7,289.3,436.8,299.7,430.8,311.2,427.5,323.1,427.4,334.7,430.5,345.4,435.9,355,443.1,363.4,451.7,370.2,461.6,375.3,472.4,379,483.9,381.6,495.6,382.6,507.5],
 [315.4,301.9,312.3,313.4,307.5,324.4,301.3,334.6,294,344.1,285.9,352.9,277.4,361.3,268.6,369.4,259.7,377.5,251,385.7,242.6,394.3,234.9,403.5,228,413.2,221.7,423.4,215.7,433.8,210.1,444.4,205.7,455.6,202.7,467.1,200,478.8,196.1,490.1,191,501,186.3,512,183.5,523.6,182.1,535.5,181.7,547.5,183.9,559.2,189.7,569.7,198.1,578.1,208.4,584.2,220,587,231.7,585.2,241.7,578.8,249.8,569.9,257.9,561.2,267.5,554,278.6,549.5,290.4,548,302.3,549.2,314,552,325.2,556.3,335.7,561.9,345.4,569,353.9,577.4,360.9,587.1,366.6,597.6,371.5,608.5,375.8,619.7,378.9,631.3],
 [303.2,301.8,299.8,313.2,294.8,324,288.4,334.1,281.1,343.5,273.2,352.5,264.9,361.1,256.5,369.6,248.1,378.1,239.9,386.8,232.1,395.7,224.8,405.2,218.2,415.1,211.9,425.3,205.9,435.6,200.6,446.3,196.8,457.6,194.1,469.3,191.1,480.8,186.7,491.9,181.7,502.7,177.3,513.8,174.1,525.4,171.3,537,168,548.4,164.1,559.7,160.7,571.2,158.5,582.9,158,594.8,158.8,606.7,160.1,618.6,160.6,630.5,159.5,642.4,157,654,153.9,665.6,152,677.4,151.3,689.3,149.4,701.1,151.1,712.8,157.6,722.7,166.8,730.2,177.4,735.7,188.9,739,200.7,739.4,211.9,735.5,220.9,727.7,227.6,717.8,234,707.8,242,698.9,251.9,692.3,263.1,688.2,274.9,686.4,286.8,686.3,298.7,687.7,310.3,690.5,321.4,694.7,331.9,700.4,341.4,707.6,349.8,716.1,356.9,725.7,363,735.9,368.6,746.5,373.3,757.4,375.9,769],
 [291,301.9,287.2,313.3,281.8,324.1,275.2,334.3,267.9,343.9,260.1,353.1,252.1,362.1,244,371.1,236,380.1,228.1,389.3,220.7,398.8,213.7,408.7,207.2,418.8,200.9,429.1,195,439.6,190.4,450.8,187.4,462.5,184.7,474.3,180.9,485.7,175.9,496.7,171.1,507.8,167.7,519.4,165,531.2,161.9,542.8,158,554.3,154.3,565.7,151.6,577.5,150.4,589.5,150.8,601.6,152,613.6,153,625.6,152.6,637.7,150.4,649.6,147.2,661.2,144.1,672.9,141.8,684.8,140.4,696.8,139.3,708.8,138.2,720.8,137.3,732.9,137,744.9,137.8,757,140,768.8,142.9,780.6,145.5,792.4,146.6,804.4,146.4,816.4,145.8,828.5,145.5,840.6,145,852.6,147.1,864.5,154,874.3,163.7,881.4,174.7,886.3,186.5,889,198.5,888.9,209.7,884.5,218.4,876.3,224.6,865.9,230.3,855.3,237.6,845.7,247,838.1,257.9,833,269.6,830.2,281.6,829,293.7,829.2,305.6,831,317.2,834.3,328.3,839.1,338.5,845.5,347.7,853.4,355.6,862.5,362.4,872.4,368.6,882.8,374.2,893.5,378.1,904.9],
 [278.8,301.8,274.8,313.2,269.3,323.9,262.8,334.1,255.7,343.9,248.2,353.3,240.6,362.7,232.8,371.9,225.2,381.2,217.7,390.7,210.6,400.5,203.9,410.5,197.5,420.7,191,430.9,185.3,441.5,181.3,452.9,178.7,464.7,175.9,476.4,171.6,487.7,166.4,498.6,162.1,509.9,159.3,521.6,156.8,533.4,153.4,545,149.4,556.3,145.8,567.9,143.6,579.7,142.8,591.8,143.4,603.8,144.7,615.8,145.5,627.8,144.7,639.9,142.1,651.6,138.8,663.3,135.9,675,133.9,686.9,132.6,698.9,131.5,710.9,130.5,722.9,129.7,734.9,129.5,747,130.6,759,132.9,770.8,135.9,782.5,138.3,794.4,139.1,806.4,138.6,818.4,137.7,830.5,137,842.5,136.7,854.6,136.9,866.7,137.6,878.7,138.6,890.7,140.2,902.7,142.8,914.4,146.9,925.8,151.8,936.8,156.6,947.9,160.4,959.4,163.3,971.1,166.3,982.7,168.6,994.6,170.5,1006.5,176.1,1017.1,185.2,1024.9,196.1,1030,207.9,1032.5,219.9,1031.7,230.7,1026.6,238.8,1017.7,244.1,1006.9,249.4,996.1,256.8,986.5,266.3,979.2,277.3,974.2,289,971.1,300.9,969.6,313,969.7,324.9,971.3,336.5,974.5,347.6,979.4,357.7,985.9,366.7,993.9,374.7,1003,381.9,1012.7,388.4,1022.8,393.2,1033.8]];
const PATHS=GX.map((g,j)=>{const s=SL[j];
  // the style part keeps its shape exactly: same points, and the same next point as before closes its last segment
  const nxt=j?[s-10,345]:[336,360],head=spline([[g,GY+6],[g,14],[s,70],[s,160],[s,290]],10,undefined,nxt);
  const R=[[s,290]];for(let i=0;i<ROUTE[j].length;i+=2)R.push([ROUTE[j][i],ROUTE[j][i+1]]);
  // leave (s,290) in the direction the style part arrives in (no corner)
  const dx=nxt[0]-s,dy=nxt[1]-160,dl=Math.hypot(dx,dy),c=Math.hypot(R[1][0]-s,R[1][1]-290);
  const tail=spline(R,6,[R[1][0]-2*c*dx/dl,R[1][1]-2*c*dy/dl]);
  return track(head.pts.concat(tail.pts.slice(1)));});
function along(path,d){d=Math.max(0,Math.min(path.len,d));const {pts,L}=path;let i=1;while(i<L.length-1&&L[i]<d)i++;
  const u=(d-L[i-1])/((L[i]-L[i-1])||1),a=pts[i-1],b=pts[i];return{x:mix(a[0],b[0],u),y:mix(a[1],b[1],u),ang:Math.atan2(b[1]-a[1],b[0]-a[0])};}
function partial(path,d){const out=[];for(let i=0;i<path.pts.length&&path.L[i]<d;i++)out.push(path.pts[i]);const e=along(path,d);out.push([e.x,e.y]);return out;}
// length of each tube down to y 200 in the style (end of step 1)
const L1=PATHS.map(p=>{let i=0;while(i<p.pts.length-1&&p.pts[i][1]<200)i++;return p.L[i];});
const LMAX=Math.max(...PATHS.map(p=>p.len));
// step 1 timing: landing order of the grains, landing time, tube start
const ORDER=[2,0,4,1,3],LAND=GX.map((_,j)=>1.4+.3*ORDER.indexOf(j)),TSTART=GX.map((_,j)=>3+.25*ORDER.indexOf(j));
// step 2: the tubes grow at one speed from L1 to their full length between 1.2 s and 6.4 s
const V2=Math.max(...PATHS.map((p,j)=>p.len-L1[j]))/5.2;
const ARRIVE=PATHS.map((p,j)=>1.2+(p.len-L1[j])/V2);
// step 3 timing
const TP=i=>.4+.2*i,TT=i=>.5+.2*i,TO=j=>1.7+.9*j,T_EGG=.5,T_CEN=.62;
// step 4: state B (ovule 4 not fertilized) for mod(tau,8) in [4,8)
const NOT=3;

// ── fruit canvas: a tinted copy of the picture (pod green, withered stigma and style, ovule bodies emptied) ─────
let fruitCv=null;
function fruitCanvas(){
  if(fruitCv)return fruitCv;const im=K.pic(K.AI+FILE);if(!im)return null;
  try{const cv=document.createElement('canvas');cv.width=IW;cv.height=IH;const g=cv.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,IW,IH),a=d.data;
    for(let y=0;y<IH;y++)for(let x=0;x<IW;x++){const i=(y*IW+x)*4;if(a[i+3]<8)continue;
      const l=(a[i]+a[i+1]+a[i+2])/765;
      if(y<335){const w=clamp((335-y)/30);a[i]=mix(mix(46,196,l),mix(70,178,l),w);a[i+1]=mix(mix(98,226,l),mix(50,138,l),w);a[i+2]=mix(mix(32,120,l),mix(26,86,l),w);continue;}
      let inOv=false;for(let j=0;j<5;j++){const ex=(x-OVC[j][0])/(ORX[j]+12),ey=(y-OVC[j][1])/(ORY[j]+8);if(ex*ex+ey*ey<1&&x>238){inOv=true;break;}}
      if(inOv){a[i]=60;a[i+1]=104;a[i+2]=50;continue;}
      a[i]=mix(46,196,l);a[i+1]=mix(98,226,l);a[i+2]=mix(32,120,l);}
    g.putImageData(d,0,0);fruitCv=cv;}catch(e){fruitCv=null;}
  return fruitCv;
}

// ── drawing in image px (inside the camera transform) ──────────────────────
function grain(c,x,y,t,i,a=1){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  glow(c,x,y,GR*2.2,GRAIN,.25+.15*Math.sin(t*2.6+i));
  circle(c,x,y,GR,GRAIN,TUBE_EDGE,lw(1.6));
  for(let j=0;j<7;j++){const th=j/7*TAU+i;circle(c,x+GR*.55*Math.cos(th),y+GR*.55*Math.sin(th),GR*.15,rgba('#854d0e',.7),null);}
  c.restore();
}
function tube(c,j,d,t,a=1,hi=0){
  if(d<=1||a<=0)return;const path=PATHS[j],pts=partial(path,d);c.save();c.globalAlpha*=a;
  if(hi>0)K.sline(c,pts,rgba(C.white,.55*hi),14);
  K.sline(c,pts,TUBE_EDGE,9);K.sline(c,pts,TUBE,6);
  for(let s=mod(t*60,34);s<d-6;s+=34){const p=along(path,s);circle(c,p.x,p.y,1.6,rgba(TUBE_EDGE,.9),null);}
  const tip=along(path,d);glow(c,tip.x,tip.y,lw(10),TUBE,.5+.3*Math.sin(t*3+j));c.restore();
}
function sperm(c,x,y,ang,t,ph,a=1){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const fl=.55+.45*Math.sin(t*4.2+ph),wx=Math.sin(t*3.3+ph)*lw(1),wy=Math.cos(t*2.7+ph)*lw(.8);
  glow(c,x+wx,y+wy,lw(11),C.cyan,.25+.35*fl);
  ellipse(c,x+wx,y+wy,lw(5.6),lw(3.6),C.cyan,C.ink,lw(1.1),ang);
  c.restore();
}
// the two sperm cells of tube j while the tube is d long (riding just behind the tip)
function spermInTube(j,d){const g=[GX[j],GY],out=[];
  for(let q=0;q<2;q++){const back=lw(13+12*q),u=clamp((d-back)/lw(12));const p=along(PATHS[j],Math.max(0,d-back));
    out.push({x:mix(g[0]+(q?3:-3),p.x,u),y:mix(g[1]+(q?3:-3),p.y,u),ang:u>0?p.ang:.6,q});}
  return out;}
function eggCell(c,j,t,a,fert){
  if(a<=0)return;const [x,y]=EGGP[j];c.save();c.globalAlpha*=a;
  if(fert>0)glow(c,x,y,30,C.pink,.45*fert*(.7+.3*Math.sin(t*2.4+j)));
  circle(c,x,y,12,EGG.fill,EGG.edge,lw(1.8));circle(c,x+1,y-1,4.5,rgba('#9d174d',.85),null);
  if(fert>0)circle(c,x,y,(16+2*Math.sin(t*2.4+j)),null,rgba(C.yellow,.9*fert),lw(2));
  c.restore();
}
function cenCell(c,j,t,a,fert){
  if(a<=0)return;const [x,y]=CENP[j];c.save();c.globalAlpha*=a;
  if(fert>0)glow(c,x,y,40,CEN.lab,.4*fert*(.7+.3*Math.sin(t*2.2+j)));
  ellipse(c,x,y,27,20,rgba(CEN.fill,.85),CEN.edge,lw(1.8));circle(c,x,y,5.5,CEN.nuc,null);
  if(fert>0)ellipse(c,x,y,31+2*Math.sin(t*2.2+j),24+2*Math.sin(t*2.2+j),null,rgba(C.yellow,.9*fert),lw(2));
  c.restore();
}
function seed(c,j,t,m){
  if(m<=0)return;const [x,y]=OVC[j],rx=mix(14,54,m),ry=mix(12,48,m);c.save();
  glow(c,x,y,rx*1.5,SEED,.18+.1*Math.sin(t*1.8+j));
  const g=c.createRadialGradient(x-rx*.35,y-ry*.4,rx*.1,x,y,rx);g.addColorStop(0,'#e3f5c4');g.addColorStop(.6,SEED);g.addColorStop(1,'#5f9a3c');
  ellipse(c,x,y,rx,ry,g,'#3f6d22',lw(2));
  // a shine that drifts over the seed
  const u=mod(t*.3+j*.2);ellipse(c,x-rx*.3+u*rx*.2,y-ry*.38,rx*.32,ry*.16,rgba(C.white,.45),null,1,-.4);
  c.restore();
}
function shrivel(c,j,t,a){
  if(a<=0)return;const [x,y]=OVC[j];c.save();c.globalAlpha*=a;
  c.beginPath();for(let i=0;i<=24;i++){const th=i/24*TAU,r=20+3*Math.sin(th*5+1);c.lineTo(x+r*Math.cos(th),y+r*.8*Math.sin(th));}c.closePath();
  c.fillStyle='#9a8a6a';c.fill();c.strokeStyle='#5c4d33';c.lineWidth=lw(1.6);c.stroke();
  c.setLineDash([lw(6),lw(5)]);c.lineDashOffset=-t*lw(10);ellipse(c,x,y,ORX[j],ORY[j],null,rgba(WITHER,.95),lw(2.2));c.restore();
}
function ring(c,x,y,rx,ry,t,col,a,rot=0){
  if(a<=0)return;c.save();c.globalAlpha*=a;c.setLineDash([lw(9),lw(7)]);c.lineDashOffset=-t*lw(14);
  c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.strokeStyle=col;c.lineWidth=lw(2.6);c.stroke();c.restore();
}

// ── screen-space pieces ────────────────────────────────────────────────────
function marker(c,n,x,y,a,t,r=15){
  if(a<=0)return;c.save();c.globalAlpha*=a;
  const u=mod(t*.7+n*.13);circle(c,x,y,r+1+u*8,null,rgba(C.yellow,.7*(1-u)),2);
  circle(c,x,y,r,C.yellow,C.ink,2);text(c,String(n),x,y+8,22,C.ink,'center',K.MONO);c.restore();
}
function flash(c,x,y,r0,u,col){if(u<=0||u>=1)return;circle(c,x,y,r0+u*34,null,rgba(col,.95*(1-u)),3);}
// a tally row in the left panel: label and number, then a row of icons (filled n of max)
function tally(c,lab,n,max,y,col,kind,a=1,n2=0){
  if(a<=0)return 0;c.save();c.globalAlpha*=a;
  const vs=String(n+n2),vw=measure(c,vs,26,K.MONO);const h=textBlock(c,lab,LX,y,LW-vw-14,col);
  text(c,vs,LX+LW,y,26,col,'right',K.MONO);
  const iy=y+h-10,sp=LW/10;
  for(let i=0;i<max;i++){const x=LX+10+i*sp,on=kind==='union'?(i<5?i<n:i-5<n2):i<n;c.save();c.globalAlpha*=on?1:.28;
    if(kind==='grain'){circle(c,x,iy,7,GRAIN,TUBE_EDGE,1.5);}
    else if(kind==='tube'){K.sline(c,[[x-4,iy-8],[x,iy],[x+3,iy+8]],TUBE_EDGE,6);K.sline(c,[[x-4,iy-8],[x,iy],[x+3,iy+8]],TUBE,3.5);}
    else if(kind==='sperm'){ellipse(c,x,iy,7,4.5,C.cyan,C.ink,1.2,-.4);}
    else if(kind==='union'){if(i<5)circle(c,x,iy,7,EGG.fill,EGG.edge,1.8);else ellipse(c,x,iy,8,6,CEN.fill,CEN.edge,1.8);}
    c.restore();}
  c.restore();return h+30;
}

// ── texts drawn on the canvas ──────────────────────────────────────────────
const SHORT=[P(`5 顆胚珠`,`Five ovules`),P(`花粉落下`,`Pollen lands`),P(`一管一胚珠`,`One tube each`),P(`算一算`,`Count`),P(`種子數`,`Seeds`)];
const STEPCOL=[STRUCT,GRAIN,TUBE,C.cyan,SEED];
const T={
 stigma:P(`柱頭`,`Stigma`),style:P(`花柱`,`Style`),ovary:P(`子房`,`Ovary`),placenta:P(`胎座`,`Placenta`),
 ovules:P(`胚珠 ×5\n（編號 1～5）`,`5 ovules\n(numbered 1–5)`),
 s0a:P(`1 個子房裡\n有 5 顆胚珠`,`1 ovary holds\n5 ovules`),s0b:P(`最多結 5 顆種子`,`At most 5 seeds`),
 pollen:P(`花粉 ×5（示意）`,`5 pollen grains (schematic)`),tubes:P(`花粉管 ×5（示意）`,`5 pollen tubes (schematic)`),
 rPollen:P(`花粉`,`Pollen grains`),rTube:P(`花粉管`,`Pollen tubes`),rSperm:P(`精細胞`,`Sperm cells`),
 oneOne:P(`1 粒花粉 → 1 條花粉管`,`1 pollen grain →\n1 pollen tube`),
 s2a:P(`每條花粉管\n只找 1 顆胚珠`,`Each pollen tube\nfinds 1 ovule`),
 arrived:n=>P(`到達珠孔：${n}／5`,`At a micropyle: ${n} / 5`),
 s2b:P(`5 條管 → 5 顆胚珠\n每顆 1 條，不重複`,`5 tubes → 5 ovules\n1 each, no repeats`),
 micro:P(`珠孔`,`Micropyle`),route:P(`路線：示意`,`Route: schematic`),sperm2:P(`每條管\n2 個精細胞`,`2 sperm cells\nin each tube`),
 unions:P(`結合`,`Unions`),
 unionsSum:(e,c2)=>P(`＝${e} 個卵\n＋${c2} 個中央細胞`,`= ${e} egg${e===1?'':'s'} +\n${c2} central cell${c2===1?'':'s'}`),
 rule:P(`n 顆胚珠全受精，至少要 n 粒花粉、2n 個精細胞`,`For n ovules all fertilized: at least n pollen grains and 2n sperm cells`),
 s1egg:P(`精細胞 1 → 卵`,`Sperm cell 1 → egg`),s2cen:P(`精細胞 2 → 中央細胞`,`Sperm cell 2 → central cell`),
 tubeS:P(`花粉管（示意）`,`Pollen tube (schematic)`),
 stateA:P(`情況一：5 顆全受精`,`Case 1: all 5 fertilized`),stateB:P(`情況二：第 4 顆沒有花粉管到達`,`Case 2: no tube reached ovule 4`),
 rOv:P(`胚珠`,`Ovules`),rFert:P(`受精`,`Fertilized`),rSeed:P(`種子`,`Seeds`),
 eqA:P(`5 顆全受精＝5 顆種子`,`All 5 fertilized\n= 5 seeds`),eqB:P(`4 顆受精＝4 顆種子`,`4 fertilized = 4 seeds`),
 rice:P(`子房只有 1 顆胚珠\n（像稻）\n→ 只結 1 顆種子`,`Ovary with 1 ovule\n(like rice)\n→ only 1 seed`),
 wither:P(`柱頭、花柱：枯萎`,`Stigma, style: wither`),fruit:P(`果實（子房變的）`,`Fruit (from the ovary)`),
 seeds:P(`種子（受精的胚珠變的）`,`Seeds (from fertilized ovules)`),
 noSeed:P(`第 4 顆沒受精：\n不會變成種子`,`Ovule 4 not fertilized:\nno seed`),
 pod:P(`豌豆莢（AI 插圖）`,`Pea pod (AI illustration)`),pod6:P(`6 顆豆＝6 顆胚珠受精`,`6 peas = 6 ovules fertilized`),
 noteAI:P(`子房圖：AI 插圖，\n非實拍`,`Ovary: AI illustration,\nnot a photo`),
 note:[P(`編號：示意`,`Numbers: schematic`),P(`花粉、花粉管：示意`,`Pollen, tubes: schematic`),P(`花粉管路線：示意`,`Tube routes: schematic`),
   P(`細胞：示意`,`Cells: schematic`),P(`種子、果實：示意`,`Seeds, fruit: schematic`)]
};
function notes(c,k){
  c.save();const h1=rowsOf(c,T.noteAI,LW).length,h2=rowsOf(c,T.note[k],LW).length,h=(h1+h2)*27;
  const y=LP.y+LP.h-14-h;textBlock(c,T.noteAI,LX,y+20,LW,C.muted,{lh:27});textBlock(c,T.note[k],LX,y+20+h1*27,LW,C.muted,{lh:27});c.restore();
  return y;
}
function eqRow(c,lab,val,y,col,valCol,a=1,bold=false){
  if(a<=0)return 0;c.save();c.globalAlpha*=a;
  const vw=measure(c,val,bold?28:24,K.MONO);const h=textBlock(c,lab,LX,y,LW-vw-14,col);
  text(c,val,LX+LW,y,bold?28:24,valCol,'right',K.MONO);c.restore();return Math.max(h,30);
}
// a banner at the bottom of the stage (x 300..948)
function banner(c,p,col,a){
  if(a<=0)return;c.save();c.globalAlpha*=a;const h=boxH(c,p,640);fitText(c,p,624,592-h,640,col,{align:'center'});c.restore();
}

// ── draw ───────────────────────────────────────────────────────────────────
function draw(c,s,t){
  const {k,tau,held}=stageClock(s,t,N,PER);
  s.shown=k;
  const prev=k>0?k-1:(held?0:4),e=smooth(fade(tau,0,1.4)),A=CAM[prev],B=CAM[k];
  cam={k:mix(A.k,B.k,e),ix:mix(A.ix,B.ix,e),iy:mix(A.iy,B.iy,e),sx:mix(A.sx,B.sx,e),sy:mix(A.sy,B.sy,e)};
  const a=stepA(held,tau,1.2),out=held?0:fade(tau,PER-.7,.6),keep=held?1:1-fade(tau,PER-.4,.4);
  // ── state ──
  const grainA=GX.map((_,j)=>k===0?0:1);
  const grainPos=GX.map((g,j)=>{if(k!==1)return[g,GY];const u=clamp((tau-(LAND[j]-1))/1);
    return[g+(1-u)*(30*Math.sin(j*2.3)+10*Math.sin(t*2+j)),mix(-300,GY,smooth(u))];});
  const tubeD=GX.map((_,j)=>k===1?mix(0,L1[j],smooth(fade(tau,TSTART[j],6.4-TSTART[j]))):k===2?Math.min(PATHS[j].len,L1[j]+V2*Math.max(0,tau-1.2)):k>=3?PATHS[j].len:0);
  const tubeA=k===4?1-fade(tau,.2,.8):1;
  // step 3 counts
  const np=k===3?GX.filter((_,i)=>tau>=TP(i)).length:5,nt=k===3?GX.filter((_,i)=>tau>=TT(i)).length:5;
  const rel=j=>k===3?tau>=TO(j):k===4,egg=j=>k===3?tau>=TO(j)+T_EGG:k===4,cen=j=>k===3?tau>=TO(j)+T_CEN:k===4;
  const ns=[0,1,2,3,4].filter(rel).length*2,ne=[0,1,2,3,4].filter(egg).length,nc=[0,1,2,3,4].filter(cen).length;
  // step 4: fruit and the two cases
  const m4=k===4?smooth(fade(tau,.3,2.3))*(held?1:1-out):0,q=mod(tau,8);
  const bB=k===4?smooth(fade(q,4,.5))*(1-smooth(fade(q,7.5,.5))):0;   // state B weight
  const bA=k===4?1-bB:0;
  const tB=k===4?fade(q,4.25,.25)*(1-fade(q,7.5,.25)):0,tA=k===4?(1-fade(q,4,.25))+fade(q,7.75,.25):0;   // texts: one case at a time

  // ── picture and schematic structures (image px) ──
  c.save();c.translate(cam.sx-cam.ix*cam.k,cam.sy-cam.iy*cam.k);c.scale(cam.k,cam.k);
  K.drawIn(c,FILE,{x:0,y:0,w:IW,h:IH});
  if(m4>0){const cv=fruitCanvas();if(cv){c.save();c.globalAlpha*=m4;c.drawImage(cv,0,0);c.restore();}}
  if(k===0){const rA=i=>fade(tau,.5+i*.6,.5)*(held?1:1-out);
    ring(c,305,24,96,30,t,STRUCT,rA(0));
    ring(c,305,190,52,120,t,STRUCT,rA(1));
    ring(c,145,760,40,300,t,PLAC,rA(3));
    OVC.forEach((o,j)=>ring(c,o[0],o[1],ORX[j]+10,ORY[j]+10,t,OVL,rA(4)*(.6+.4*Math.sin(t*2+j))));}
  // tubes, grains
  GX.forEach((_,j)=>{let hi=0;if(k===3){const u=(tau-TT(j))/.5;hi=u>0&&u<1?1-u:0;}if(k===2&&tau>ARRIVE[j]){const u=(tau-ARRIVE[j])/.8;hi=u<1?1-u:0;}
    tube(c,j,tubeD[j],t,tubeA,hi);});
  GX.forEach((_,j)=>{const ga=k===1?clamp((tau-(LAND[j]-1))/.25):k===4?1-fade(tau,.2,.8):grainA[j];
    if(k===1||k===2||k===4){grain(c,grainPos[j][0],grainPos[j][1],t,j,ga);}
    if(k===3){const u=(tau-TP(j))/.6;if(u>0&&u<1)circle(c,GX[j],GY,GR+u*20,null,rgba(GRAIN,1-u),lw(2));grain(c,GX[j],GY,t,j,1);}});
  // ovule cells (step 3), seeds and the shrivelled ovule (step 4)
  if(k===3||k===4){const cA=k===3?fade(tau,.2,.6):1-m4;
    OVC.forEach((_,j)=>{const fe=k===3?fade(tau,TO(j)+T_EGG,.3):1,fc=k===3?fade(tau,TO(j)+T_CEN,.3):1;cenCell(c,j,t,cA,fc);eggCell(c,j,t,cA,fe);});}
  if(k===4){OVC.forEach((_,j)=>{const sm=j===NOT?m4*bA:m4;seed(c,j,t,sm);});shrivel(c,NOT,t,m4*bB);}
  // sperm cells
  const sp=[];
  GX.forEach((_,j)=>{
    if(k===1||k===2){if(tubeD[j]>2||k===2)spermInTube(j,tubeD[j]).forEach(p=>sp.push({...p,j}));}
    else if(k===3){const t0=TO(j),tip=along(PATHS[j],PATHS[j].len);
      if(tau<t0)spermInTube(j,PATHS[j].len).forEach(p=>sp.push({...p,j}));
      else{const u1=smooth(clamp((tau-t0)/T_EGG)),u2=smooth(clamp((tau-t0)/T_CEN));
        if(u1<1)sp.push({x:mix(tip.x,EGGP[j][0],u1),y:mix(tip.y,EGGP[j][1],u1)-8*Math.sin(u1*Math.PI),ang:Math.PI,q:0,j});
        if(u2<1)sp.push({x:mix(tip.x,CENP[j][0],u2),y:mix(tip.y,CENP[j][1],u2)+10*Math.sin(u2*Math.PI),ang:Math.PI,q:1,j});}}});
  sp.forEach(p=>sperm(c,p.x,p.y,p.ang,t,p.j*1.3+p.q*2.1,k===1?clamp((tubeD[p.j])/lw(8)):1));
  if(k===3)GX.forEach((_,j)=>{const t0=TO(j),tip=along(PATHS[j],PATHS[j].len);
    const r=(tau-t0)/.8;if(r>0&&r<1)circle(c,tip.x,tip.y,8+r*30,null,rgba(TUBE,.95*(1-r)),lw(2.5));});
  c.restore();
  // screen-space flashes
  if(k===2)GX.forEach((_,j)=>flash(c,X(NUB[j][0]+4),Y(NUB[j][1]),6,(tau-ARRIVE[j])/.9,C.yellow));
  if(k===3)GX.forEach((_,j)=>{flash(c,X(EGGP[j][0]),Y(EGGP[j][1]),8,(tau-TO(j)-T_EGG)/.9,C.yellow);flash(c,X(CENP[j][0]),Y(CENP[j][1]),12,(tau-TO(j)-T_CEN)/.9,C.yellow);});

  // ── markers on the ovules ──
  if(k===0||k===2){const mA=k===0?fade(tau,3.0,.5)*(held?1:1-out):smooth(fade(tau,1.1,.4))*keep;
    OVC.forEach((o,j)=>{const al=k===2?mA*(tau>ARRIVE[j]?1:.55):mA;marker(c,j+1,X(o[0]-8),Y(o[1]),al,t,13);});}

  // ── left panel ──
  D.round(c,LP.x,LP.y,LP.w,LP.h,16,'rgba(11,26,21,.9)',C.edge);
  c.save();c.globalAlpha*=keep;fitText(c,SHORT[k],LX,LP.y+12,LW,STEPCOL[k],{active:true});c.restore();
  notes(c,k);
  if(k===0){
    c.save();c.globalAlpha*=a*fade(tau,3.3,.5);let y=textBlock(c,T.s0a,LX,100,LW,OVL)+100+12;
    c.globalAlpha=a*fade(tau,4.6,.5);fitText(c,T.s0b,LX,y,LW,C.yellow,{active:true});c.restore();
    tagBox(c,T.stigma,712,10,230,S(352,22),STRUCT,a*fade(tau,.5,.5));
    tagBox(c,T.style,712,90,230,S(343,190),STRUCT,a*fade(tau,1.1,.5));
    tagBox(c,T.ovary,712,190,230,S(588,700),FRUIT,a*fade(tau,1.7,.5));
    tagBox(c,T.ovules,712,300,230,OVC.map((o,j)=>S(NUB[j][0]-12,o[1]-ORY[j]*.55)),OVL,a*fade(tau,2.9,.5));
    tagBox(c,T.placenta,300,440,112,S(138,840),PLAC,a*fade(tau,2.3,.5));
  }
  if(k===1){
    const lp=GX.filter((_,j)=>tau>=LAND[j]).length,lt=GX.filter((_,j)=>tau>=TSTART[j]).length;
    c.save();c.globalAlpha*=keep;let y=96;
    y+=tally(c,T.rPollen,lp,5,y,GRAIN,'grain');y+=8;
    y+=tally(c,T.rTube,lt,5,y,TUBE,'tube');
    c.globalAlpha*=fade(tau,5.6,.5);textBlock(c,T.oneOne,LX,y+16,LW,C.white);c.restore();
    const gs=grainPos.map(p=>S(...p));
    tagBox(c,T.pollen,300,70,236,[gs[4],gs[0]],GRAIN,a*fade(tau,Math.max(...LAND)+.2,.5));
    tagBox(c,T.stigma,700,120,240,S(380,22),STRUCT,a*fade(tau,1.0,.5));
    tagBox(c,T.style,700,250,240,S(342,170),STRUCT,a*fade(tau,1.4,.5));
    {const j=4,p=along(PATHS[j],Math.max(10,tubeD[j]-6));tagBox(c,T.tubes,300,300,236,[S(p.x,p.y),S(along(PATHS[0],Math.max(10,tubeD[0]-6)).x,along(PATHS[0],Math.max(10,tubeD[0]-6)).y)],TUBE,a*fade(tau,TSTART[ORDER[4]]+.4,.5));}
  }
  if(k===2){
    const n=GX.filter((_,j)=>tau>=ARRIVE[j]).length;
    c.save();c.globalAlpha*=keep;let y=96;
    c.globalAlpha=keep*fade(tau,1,.5);y+=textBlock(c,T.s2a,LX,y,LW,TUBE)+14;
    c.globalAlpha=keep*fade(tau,1.6,.5);const r=fitText(c,D.tr(T.arrived(n)),LX,y,LW,C.yellow,{active:n===5});y=r.y+r.h+30;
    c.globalAlpha=keep*fade(tau,Math.max(...ARRIVE)+.3,.5);textBlock(c,T.s2b,LX,y,LW,C.white);c.restore();
    tagBox(c,T.tubes,712,40,230,S(SL[2]+14,200),TUBE,a*fade(tau,1.4,.5));
    tagBox(c,T.micro,712,250,230,S(NUB[0][0]+6,NUB[0][1]),C.yellow,a*fade(tau,ARRIVE[0],.5));
    {const j=4,ps=spermInTube(j,tubeD[j]),pp=ps[0];tagBox(c,T.sperm2,712,330,230,S(pp.x,pp.y),C.cyan,a*fade(tau,2.2,.5));}
    tagBox(c,T.placenta,300,300,112,S(118,840),PLAC,a*fade(tau,1.8,.5));   // beside the tubes on the band
    c.save();c.globalAlpha*=a*fade(tau,2.6,.5);fitText(c,T.route,712,500,230,C.muted);c.restore();
  }
  if(k===3){
    c.save();c.globalAlpha*=keep;let y=96;
    y+=tally(c,T.rPollen,np,5,y,GRAIN,'grain');
    y+=tally(c,T.rTube,nt,5,y,TUBE,'tube');
    y+=tally(c,T.rSperm,ns,10,y,C.cyan,'sperm');
    y+=tally(c,T.unions,ne,10,y,C.yellow,'union',1,nc);
    c.globalAlpha=keep*fade(tau,TO(0)+T_EGG,.3);
    textBlock(c,T.unionsSum(ne,nc),LX,y-2,LW,C.white);
    c.restore();
    banner(c,T.rule,C.yellow,stepA(held,tau,TO(4)+1.1));
    tagBox(c,T.tubeS,735,20,209,S(335,430.5),TUBE,a);   // on tube 1, over the top of ovule 1
    tagBox(c,T.s1egg,735,140,209,S(EGGP[1][0]+8,EGGP[1][1]),EGG.lab,a*fade(tau,TO(0),.5));
    tagBox(c,T.s2cen,735,228,209,S(CENP[2][0],CENP[2][1]-16),CEN.lab,a*fade(tau,TO(0)+.2,.5));
    tagBox(c,T.micro,735,340,209,S(NUB[2][0]+3,NUB[2][1]+2),C.yellow,a);
    // +2 per ovule when its sperm cells are released
    OVC.forEach((o,j)=>{const u=(tau-TO(j))/1.2;if(u<=0||u>=1)return;c.save();c.globalAlpha*=1-u;fitText(c,'+2',X(448),Y(o[1])-u*16-18,80,C.cyan);c.restore();});
  }
  if(k===4){
    c.save();c.globalAlpha*=keep;let y=78;
    // the case heading: A or B
    const hA=boxH(c,T.stateA,LW),hB=boxH(c,T.stateB,LW),hh=Math.max(hA,hB);
    if(tA>0){c.save();c.globalAlpha*=tA*fade(tau,.3,.5);fitText(c,T.stateA,LX,y,LW,SEED,{active:true});c.restore();}
    if(tB>0){c.save();c.globalAlpha*=tB;fitText(c,T.stateB,LX,y,LW,WITHER,{active:true});c.restore();}
    y+=hh+30;
    const nf=bB>.5?4:5;c.save();c.globalAlpha*=fade(tau,.8,.5);
    y+=eqRow(c,T.rOv,'5',y,OVL,OVL);
    y+=eqRow(c,T.rFert,String(nf),y,C.cyan,bB>.5?WITHER:C.cyan);
    y+=eqRow(c,T.rSeed,String(nf),y,SEED,bB>.5?WITHER:SEED,fade(tau,2.2,.5),true);c.restore();
    c.save();c.globalAlpha*=fade(tau,2.4,.5);if(tA>0){c.save();c.globalAlpha*=tA;textBlock(c,T.eqA,LX,y+8,LW,SEED);c.restore();}
    if(tB>0){c.save();c.globalAlpha*=tB;textBlock(c,T.eqB,LX,y+8,LW,WITHER);c.restore();}c.restore();
    y+=8+29*Math.max(rowsOf(c,T.eqA,LW).length,rowsOf(c,T.eqB,LW).length)+20;
    c.globalAlpha=keep*fade(tau,5.2,.5);textBlock(c,T.rice,LX,y,LW,C.muted);
    c.restore();
    const b=a*fade(tau,1.6,.6);
    tagBox(c,T.wither,575,14,368,S(345,150),WITHER,b);
    tagBox(c,T.fruit,575,74,368,S(425,380),FRUIT,b);
    if(tA>0)tagBox(c,T.seeds,575,134,368,OVC.map((o,j)=>S(o[0]+ORX[j]*.62,o[1]-ORY[j]*.3)),SEED,a*fade(tau,2.2,.5)*tA);
    if(tB>0)tagBox(c,T.noSeed,575,134,368,S(OVC[NOT][0]+ORX[NOT],OVC[NOT][1]),WITHER,a*tB);
    // pea pod
    const pa=a*fade(tau,1.2,.6),pr={x:578,y:410,w:362,h:362*PH/PW};
    if(pa>0){c.save();c.globalAlpha*=pa;K.drawIn(c,POD,pr);
      const pk=pr.w/PW;PEAS.forEach((p,i)=>{const x=pr.x+p[0]*pk,yy=pr.y+p[1]*pk;circle(c,x,yy,17+1.5*Math.sin(t*2+i),null,rgba(C.yellow,.9),2);
        marker(c,i+1,x,pr.y-4,1,t,14);});
      c.restore();
      tagBox(c,T.pod,578,320,362,[pr.x+40,pr.y+pr.h*.55],C.green,pa);
      c.save();c.globalAlpha*=pa*fade(tau,2,.5);const h=boxH(c,T.pod6,362);fitText(c,T.pod6,578,592-h,362,C.yellow,{active:true});c.restore();}
  }
}
window.PlantsDraw.multi=draw;
})();

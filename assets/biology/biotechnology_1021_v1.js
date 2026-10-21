/* Biotechnology · teacher-requested V5 remake, 2026-10-21.
 * Four tabs: fermentation (the teacher's Gemini dough, bread, yeast and fermented-food pictures; a magnified
 * view of yeast breaking down sugar), breeding (one wild cabbage, five vegetables; selection generation by
 * generation), gene transfer (human insulin made by bacteria; glowing zebrafish; impacts and Taiwan's rules)
 * and cloning (Dolly: nuclear transfer and who she takes after).
 * Pictures: biotech_ai_1021/ (AI illustrations, not photographs). The glowing fish keep their black
 * background and are drawn with the 'screen' blend, so black vanishes on the board and the glow stays.
 * Colours: an inserted gene and what it makes are yellow; the bacterial plasmid cyan; egg pink and sperm cyan
 * as in the other genetics units. Multiple-choice checks: genetics_quiz_1020_v1.js.
 * Replaces the biotechnology entry of genetics_lessons_1010_v1.js (left in that file, unused).
 */
(()=>{'use strict';
const B=window.LivingBook,D=B.D,P=(zh,en)=>[zh,en];
const C={white:'#f2ecd9',yellow:'#fde047',cyan:'#55e9ff',green:'#4ade80',orange:'#fb923c',pink:'#f472b6',panel:'#1c3d34',deep:'#0b1a15',muted:'#b9cbbd',edge:'#47675d',ink:'#0b1a15'};
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,u)=>a+(b-a)*u,mod=(n,d=1)=>((n%d)+d)%d,ease=u=>1-Math.pow(1-clamp(u),3),smooth=u=>{u=clamp(u);return u*u*(3-2*u);};
const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
const GENE=C.yellow,PLASMID=C.cyan,EGG=C.pink,SPERM=C.cyan,GLOW_G='#7dff6a',GLOW_R='#ff5c7c',FUNGUS=C.orange,BACT=C.cyan;

// ── drawing kit (same helpers as the other genetics units) ─────────────────
function line(c,pts,color,w=3){D.line(c,pts,color,w);}
function sline(c,pts,color,w){c.save();c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore();}
function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke,w=3,rot=0){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
const FONT=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
const MONO=size=>`700 ${size}px "JetBrains Mono", "Noto Sans TC", monospace`;
function text(c,p,x,y,size=22,color=C.white,align='left',font=FONT){c.save();c.font=font(size);c.fillStyle=color;c.textAlign=align;c.fillText(D.tr(p),x,y);c.restore();}
function measure(c,p,size,font=FONT){c.save();c.font=font(size);const w=c.measureText(D.tr(p)).width;c.restore();return w;}
function splitLines(c,str,maxW,size=22){
  c.save();c.font=FONT(size);
  const isEn=/[A-Za-z]/.test(str)&&!/[一-鿿]/.test(str),tokens=isEn?(str.match(/[A-Za-z0-9₁₂]+(?:['–-][A-Za-z0-9₁₂]+)*|\s+|[^A-Za-z0-9₁₂\s]/g)||[]):Array.from(str);
  const rows=[];let row='';
  for(const tk of tokens){if(c.measureText(row+tk).width>maxW&&row.trim()){rows.push(row.trimEnd());row=tk.trimStart();}else row+=tk;}
  if(row.trim())rows.push(row.trimEnd());
  c.restore();return rows;
}
function wrap(c,p,x,y,w,size=22,color=C.white,lh=Math.round(size*1.38),align='left'){
  const rows=splitLines(c,D.tr(p),w,size),PUNCT=/^[，。、；：！？）」』,.;:!?)]/;
  for(let i=1;i<rows.length;i++)while(PUNCT.test(rows[i])&&rows[i-1].length>1){
    if(/[A-Za-z]/.test(rows[i-1])&&!/[一-鿿]/.test(rows[i-1])){rows[i-1]+=rows[i][0];rows[i]=rows[i].slice(1).trimStart();}else{rows[i]=rows[i-1].slice(-1)+rows[i];rows[i-1]=rows[i-1].slice(0,-1);}}
  // an opening bracket never ends a line
  for(let i=0;i<rows.length-1;i++)while(/[（「『(]$/.test(rows[i])&&rows[i].length>1){rows[i+1]=rows[i].slice(-1)+rows[i+1];rows[i]=rows[i].slice(0,-1);}
  rows.filter(r=>r).forEach((r,i)=>text(c,r,x,y+i*lh,size,color,align));return rows.length*lh;}
function glow(c,x,y,r,color=C.cyan,a=.55){c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,1));g.addColorStop(1,rgba(color,0));c.globalAlpha*=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function arrow(c,x1,y1,x2,y2,color,w=3.5){
  const a=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1),hl=Math.min(16,Math.max(8,dist*.46)),hw=hl*.66;
  line(c,[[x1,y1],[x2-hl*.7*Math.cos(a),y2-hl*.7*Math.sin(a)]],color,w);
  c.save();c.beginPath();c.moveTo(x2,y2);
  c.lineTo(x2-hl*Math.cos(a)+hw*Math.sin(a),y2-hl*Math.sin(a)-hw*Math.cos(a));
  c.lineTo(x2-hl*Math.cos(a)-hw*Math.sin(a),y2-hl*Math.sin(a)+hw*Math.cos(a));
  c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function dashed(c,pts,color,w=2.5,dash=[7,6],off=0){c.save();c.setLineDash(dash);c.lineDashOffset=off;line(c,pts,color,w);c.restore();}
function panel(c,x,y,w,h,fill='#16332b'){D.round(c,x,y,w,h,16,fill,C.edge);}
function pill(c,p,x,y,{active=false,color=C.yellow,size=22,maxX=940,minX=20}={}){
  const w=measure(c,p,size)+28,h=size+18;x=Math.max(minX,Math.min(x,maxX-w));
  D.round(c,x,y,w,h,h/2,active?color:'rgba(11,26,21,.9)',active?C.white:rgba(color,.8));
  text(c,p,x+w/2,y+h/2+size*.36,size,active?C.deep:color,'center');
  return{x,y,w,h};
}
// A pill centred on x.
const cpill=(c,p,x,y,o={})=>pill(c,p,x-(measure(c,p,o.size||22)+28)/2,y,o);
function pulse(c,x,y,t,color=C.yellow,r=16){const u=mod(t*.8);circle(c,x,y,r+u*16,null,rgba(color,.9*(1-u)),3);}
const choice=(label,key,items)=>({label,items:items.map(([value,text])=>({key,value,label:text}))});
const steps=(short)=>choice(P('步驟','Step'),'phase',[[-1,P('連續播放','Play all')],...short.map((n,i)=>[i,n])]);
// A stage clock: loops through n stages, or eases into a held stage. tau = seconds since the stage began.
function stageClock(s,t,n,per=6){
  if(s.phase>=0)return{k:s.phase,u:ease((t-(s.start||0))/1.6),held:true,tau:t-(s.start||0)};
  const q=mod(t-(s.start||0),n*per)/per;return{k:Math.floor(q),u:q%1,held:false,tau:(q%1)*per};
}
const fade=(tau,t0,d=.6)=>clamp((tau-t0)/d);
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function marker(c,x,y,n,t,r=13,color=C.yellow){if(t!=null)pulse(c,x,y,t,color,r+2);circle(c,x,y,r,color,C.ink,2);c.save();c.font=MONO(20);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),x,y+1);c.restore();}
const lerpP=(a,b,u)=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];
function bez(p0,p1,p2,u){return[(1-u)*(1-u)*p0[0]+2*(1-u)*u*p1[0]+u*u*p2[0],(1-u)*(1-u)*p0[1]+2*(1-u)*u*p1[1]+u*u*p2[1]];}

// ── pictures ───────────────────────────────────────────────────────────────
const AI='assets/biology/biotech_ai_1021/',PICS={};
const SIZE={'brassica_broccoli.png':[220,280],'brassica_cabbage.png':[252,213],'brassica_cauliflower.png':[188,221],'brassica_kale.png':[217,304],'brassica_kohlrabi.png':[329,328],'brassica_wild.png':[238,469],
 'bread_loaf.png':[369,308],'dough_bowl.png':[386,284],'dough_risen.png':[386,284],'fish_green.png':[425,140],'fish_green_unlit.png':[425,140],'fish_plain.png':[425,140],'fish_red.png':[425,140],
 'food_bread.png':[271,215],'food_pickled_cabbage.png':[253,203],'food_soy_sauce.png':[229,292],'food_yogurt.png':[145,207],'lamb_dolly.png':[170,179],'sheep_black_face_egg.png':[255,245],
 'sheep_black_face_surrogate.png':[265,231],'sheep_white_face.png':[296,258],'yeast_cells.png':[648,480],'yeast_budding.png':[255,226],'yeast_single.png':[123,130],'yeast_small.png':[96,80],'yeast_pair.png':[125,101],'yeast_tall.png':[124,188]};
function pic(path){let im=PICS[path];if(!im){im=new Image();im.onload=()=>B.draw();im.onerror=()=>{im.failed=true;};im.src=path;PICS[path]=im;}return im.complete&&im.naturalWidth?im:null;}
// The box an image fills; known before the image loads, so layouts never jump.
function fitRect(file,bx,by,bw,bh){const [W,H]=SIZE[file],k=Math.min(bw/W,bh/H),w=W*k,h=H*k;return{x:bx+(bw-w)/2,y:by+(bh-h)/2,w,h};}
function drawIn(c,file,r,{alpha=1,flip=false,screen=false}={}){
  const im=pic(AI+file);
  if(!im){c.save();c.setLineDash([6,6]);D.round(c,r.x,r.y,r.w,r.h,10,null,rgba(C.muted,.4));c.restore();return r;}
  if(alpha<=0)return r;
  c.save();c.globalAlpha*=alpha;if(screen)c.globalCompositeOperation='screen';if(flip){c.translate(r.x*2+r.w,0);c.scale(-1,1);}
  c.drawImage(im,r.x,r.y,r.w,r.h);c.restore();return r;}
const place=(c,file,bx,by,bw,bh,o={})=>drawIn(c,file,fitRect(file,bx,by,bw,bh),o);
// Centre an image at (x, y) with a given width.
function at(c,file,x,y,w,o={}){if(o.screen&&file.startsWith('fish_')){const st=B.getState();y+=Math.sin((st.elapsed||0)*1.8+x*.03)*4;}const [W,H]=SIZE[file],h=w*H/W;return drawIn(c,file,{x:x-w/2,y:y-h/2,w,h},o);}
const pt=(r,fx,fy)=>[r.x+fx*r.w,r.y+fy*r.h];

// ── small icons ────────────────────────────────────────────────────────────
function sugar(c,x,y,s=9,a=1,edge='#fff3a8'){c.save();c.globalAlpha*=a;c.beginPath();for(let i=0;i<6;i++){const q=i*TAU/6-Math.PI/2;c[i?'lineTo':'moveTo'](x+Math.cos(q)*s,y+Math.sin(q)*s);}c.closePath();c.fillStyle='#f5c542';c.fill();c.strokeStyle=edge;c.lineWidth=1.8;c.stroke();c.restore();}
function co2(c,x,y,s=5,a=1){c.save();c.globalAlpha*=a;D.sphere(c,x-s*1.9,y,s,'#f472b6');D.sphere(c,x+s*1.9,y,s,'#f472b6');D.sphere(c,x,y,s*1.3,'#7d8f88');c.restore();}
function alcohol(c,x,y,s=5,a=1){c.save();c.globalAlpha*=a;D.sphere(c,x-s*1.6,y,s,'#7d8f88');D.sphere(c,x,y-s*.6,s,'#7d8f88');D.sphere(c,x+s*1.6,y+s*.2,s*.95,'#f472b6');D.sphere(c,x+s*2.6,y-s*.5,s*.6,C.white);c.restore();}
function lacticDot(c,x,y,a=1){c.save();c.globalAlpha*=a;circle(c,x,y,4.2,C.orange,rgba(C.white,.7),1.2);c.restore();}
// Insulin: two short chains of amino acids joined by bridges.
function insulin(c,x,y,s=1,a=1){c.save();c.globalAlpha*=a;c.translate(x,y);c.scale(s,s);
  line(c,[[-10,-5],[10,-5]],rgba(GENE,.8),2);line(c,[[-13,5],[13,5]],rgba(GENE,.8),2);line(c,[[-4,-5],[-4,5]],C.white,1.6);line(c,[[6,-5],[6,5]],C.white,1.6);
  [-10,-3.3,3.3,10].forEach(px=>circle(c,px,-5,3.3,GENE,C.ink,1));[-13,-6.5,0,6.5,13].forEach(px=>circle(c,px,5,3.3,'#facc15',C.ink,1));c.restore();}
// A DNA ladder from x0 to x1 (two strands with rungs).
function dna(c,x0,x1,y,col,ph=0,amp=8,w=3,a=1){
  if(x1<=x0)return;c.save();c.globalAlpha*=a;const n=Math.max(2,Math.round((x1-x0)/4)),A=[],Bq=[];
  for(let i=0;i<=n;i++){const x=mix(x0,x1,i/n),q=x/13+ph;A.push([x,y+amp*Math.sin(q)]);Bq.push([x,y-amp*Math.sin(q)]);}
  for(let x=x0+3;x<x1;x+=7){const q=x/13+ph;line(c,[[x,y+amp*Math.sin(q)],[x,y-amp*Math.sin(q)]],rgba(col,.55),1.6);}
  sline(c,A,col,w);sline(c,Bq,col,w);c.restore();}
function scissors(c,x,y,rot,open,a=1){c.save();c.globalAlpha*=a;c.translate(x,y);c.rotate(rot);
  [-1,1].forEach(sg=>{c.save();c.rotate(sg*open*.45);c.beginPath();c.moveTo(0,0);c.lineTo(34,sg*-3);c.lineTo(36,0);c.lineTo(0,sg*5);c.closePath();c.fillStyle='#dfe7e2';c.fill();c.strokeStyle=C.ink;c.lineWidth=1.5;c.stroke();
    ellipse(c,-20,sg*11,10,7,null,'#dfe7e2',4,sg*.4);c.restore();});
  circle(c,0,0,3,C.ink,null);c.restore();}
function spark(c,x,y,t,a=1){c.save();c.globalAlpha*=a*(.6+.4*Math.sin(t*20));c.beginPath();c.moveTo(x-6,y-22);c.lineTo(x+4,y-4);c.lineTo(x-3,y-2);c.lineTo(x+7,y+22);c.lineTo(x-4,y+3);c.lineTo(x+3,y+1);c.closePath();c.fillStyle=C.yellow;c.fill();c.restore();glow(c,x,y,30,C.yellow,.4*a);}

// ── Tab 1: fermentation ────────────────────────────────────────────────────
const FRAMES=[{file:'dough_bowl.png',name:P('揉好的麵團','Kneaded dough')},{file:'dough_risen.png',name:P('發酵後的麵團','Risen dough')},{file:'bread_loaf.png',name:P('烤好的麵包','Baked bread')}];
const FX=[50,370,690],FY=36,FW=220,FH=150;
const LX=40,LY=262,LW=560,LH=318;
const YEASTS=[{file:'yeast_budding.png',x:150,y:372,w:150},{file:'yeast_single.png',x:340,y:476,w:78},{file:'yeast_pair.png',x:478,y:350,w:110}];
const DOUGH_SHORT=[P('揉好','Kneaded'),P('分解醣','Sugar'),P('膨大','Rising'),P('烘烤','Baking')];
const DOUGH_NAMES=[P('揉好的麵團','Kneaded dough'),P('酵母菌分解醣','Yeast breaks down sugar'),P('二氧化碳讓麵團膨大','Carbon dioxide puffs the dough up'),P('烤成麵包','Baking')];
const DOUGH_TEXT=[
 P('麵粉、水、少許糖和酵母菌揉成麵團。放大看：酵母菌散布在麵團裡，周圍有醣（來自加入的糖和麵粉）。','Flour, water, a little sugar and yeast are kneaded into dough. Zoom in: yeast cells are scattered through the dough, surrounded by sugar (from the added sugar and the flour).'),
 P('酵母菌是單細胞的真菌。它把醣分解，得到生活需要的能量，同時放出二氧化碳；氧氣不夠時，還會產生酒精。這就是發酵作用。','Yeast is a single-celled fungus. It breaks sugar down for the energy it needs and gives off carbon dioxide; when oxygen runs short it also makes alcohol. This is fermentation.'),
 P('麵團有黏性和彈性，把二氧化碳包住，形成許多小氣泡。氣泡越來越多、越來越大，麵團就膨大、變蓬鬆。','Dough is sticky and stretchy, so it traps the carbon dioxide in many little bubbles. As the bubbles multiply and grow, the dough swells and turns fluffy.'),
 P('烘烤時，酵母菌被高溫殺死，酒精受熱揮發；氣泡的位置被固定下來，就是麵包裡的小孔洞。','In the oven the heat kills the yeast and the alcohol evaporates; the bubbles are set in place and become the little holes in the bread.')];
const SPECK=(()=>{const R=rng(41),o=[];for(let i=0;i<90;i++)o.push([LX+R()*LW,LY+R()*LH,1.2+R()*2.2,R()<.5]);return o;})();
const SUGARS=(()=>{const R=rng(7),o=[];for(let i=0;i<18;i++)o.push([LX+30+R()*(LW-60),LY+28+R()*(LH-56),R()*TAU,i%YEASTS.length]);return o;})();
const BUBBLES=[[255,318,34],[408,300,26],[560,444,30],[94,486,28],[246,506,36],[420,430,22],[560,300,20],[96,300,18]];
// The magnified dough: dough-coloured (pale crumb once baked) with flour specks.
function inLens(c,draw,baked){c.save();c.beginPath();c.roundRect(LX,LY,LW,LH,18);c.clip();
  c.fillStyle=baked?'#ead6ad':'#d6bb8c';c.fillRect(LX,LY,LW,LH);
  SPECK.forEach(([x,y,r,light])=>circle(c,x,y,r,light?'rgba(255,250,235,.5)':'rgba(120,85,45,.22)',null));
  draw();c.restore();D.round(c,LX,LY,LW,LH,18,null,rgba(C.white,.75));}
function drawDough(c,s,t){
  const {k,tau}=stageClock(s,t,4,6);s.shown=k;
  const rise=k<2?0:k===2?smooth(tau/3.5):1;
  // the three frames
  FRAMES.forEach((f,i)=>{const x=FX[i],active=(i===0&&k<2)||(i===1&&k===2)||(i===2&&k===3),done=i<(k<2?0:k-1);
    D.round(c,x,FY,FW,FH+44,14,active?rgba(C.yellow,.12):'rgba(11,26,21,.45)',active?C.yellow:C.edge);
    const a=active||done?1:.32;
    if(i===1&&k===2){place(c,'dough_bowl.png',x+10,FY+8,FW-20,FH-8,{alpha:1-rise});place(c,'dough_risen.png',x+10,FY+8,FW-20,FH-8,{alpha:rise});}
    else place(c,f.file,x+10,FY+8,FW-20,FH-8,{alpha:a});
    text(c,f.name,x+FW/2,FY+FH+30,22,active?C.yellow:rgba(C.white,a),'center');
    if(i<2){arrow(c,x+FW+12,FY+FH/2,x+FW+88,FY+FH/2,rgba(C.white,.75),3);text(c,i?P('烘烤','Bake'):P('發酵','Rise'),x+FW+50,FY+FH/2-14,22,C.muted,'center');}});
  // magnifier link from the active frame
  const fi=k<2?0:k===2?1:2,fx=FX[fi]+FW/2;
  dashed(c,[[fx-40,FY+FH+44],[LX+140,LY]],rgba(C.yellow,.6));dashed(c,[[fx+40,FY+FH+44],[LX+LW-140,LY]],rgba(C.yellow,.6));
  inLens(c,()=>{
    // the oven's heat: the dough glows warm from the edges
    if(k===3){c.save();c.globalAlpha=.55+.15*Math.sin(t*2);c.shadowColor=C.orange;c.shadowBlur=40;c.lineWidth=26;c.strokeStyle='rgba(251,146,60,.55)';c.beginPath();c.roundRect(LX-10,LY-10,LW+20,LH+20,24);c.stroke();c.restore();}
    // gas bubbles in the dough (growing in step 3, set as holes in step 4): a cavity with a stretched dough wall
    if(k>=2)BUBBLES.forEach(([x,y,r],i)=>{const g=k===3?1:smooth((tau-.3-i*.25)/2.8),rr=r*g;if(rr<1)return;
      circle(c,x,y,rr,k===3?'rgba(150,108,60,.55)':'rgba(110,78,42,.5)',k===3?'#f7ead0':'#f1deb8',3);
      c.save();c.beginPath();c.arc(x,y,rr*.78,Math.PI*1.05,Math.PI*1.55);c.strokeStyle='rgba(255,250,235,.6)';c.lineWidth=2.5;c.stroke();c.restore();
      if(k===2)for(let j=0;j<Math.round(rr/9);j++){const q=t*.9+j*2.1+i;co2(c,x+rr*.45*Math.cos(q),y+rr*.45*Math.sin(q*1.3),3.4,.95);}});
    // yeast (killed by the heat in step 4: faded)
    c.save();c.shadowColor='rgba(70,45,20,.55)';c.shadowBlur=8;YEASTS.forEach(y=>at(c,y.file,y.x,y.y,y.w,{alpha:k===3?.35:1}));c.restore();
    // sugar travelling into the yeast, CO2 and alcohol coming out
    SUGARS.forEach(([sx,sy,ph,yi],i)=>{const Y=YEASTS[yi];
      if(k===0){sugar(c,sx+3*Math.sin(t*1.3+ph),sy+3*Math.cos(t+ph),8,1,'#6b4a12');return;}
      if(k===3)return;
      const p=mod(t*.22+i/SUGARS.length);
      if(p<.5){const u=smooth(p/.5),q=lerpP([sx,sy],[Y.x,Y.y],u);sugar(c,q[0],q[1],8,1-u*.7,'#6b4a12');}
      else{const u=(p-.5)/.5,dir=ph,ox=Y.x+Math.cos(dir)*(Y.w*.3+u*90),oy=Y.y+Math.sin(dir)*(Y.w*.25+u*70);
        if(k===2){const bb=BUBBLES[i%BUBBLES.length],q=lerpP([Y.x,Y.y],[bb[0],bb[1]],smooth(u));co2(c,q[0],q[1],4,1-u*.6);}
        else if(i%3===2)alcohol(c,ox,oy,4.2,1-u);else co2(c,ox,oy,4.5,1-u*.8);}});
    if(k===3)for(let i=0;i<5;i++){const p=mod(t*.3+i/5),x=LX+90+i*95,y=LY+LH-40-p*240;alcohol(c,x+8*Math.sin(p*9),y,4.5,(1-p)*.9);}
    // labels inside the lens
    if(k<2){cpill(c,P('酵母菌','Yeast'),YEASTS[0].x,YEASTS[0].y+70,{color:C.white});}
    if(k===0)cpill(c,P('醣','Sugar'),SUGARS[3][0],SUGARS[3][1]+16,{color:'#f5c542'});
    if(k===2)cpill(c,P('二氧化碳的氣泡','CO₂ bubbles'),BUBBLES[0][0],BUBBLES[0][1]+44,{color:C.white});
    if(k===3){cpill(c,P('留下的孔洞','Holes left behind'),BUBBLES[1][0],BUBBLES[1][1]+34,{color:'#f7ead0'});cpill(c,P('酒精揮發','Alcohol evaporates'),LX+LW/2,LY+18,{color:C.white});cpill(c,P('高溫烘烤','Oven heat'),LX+LW-110,LY+LH-56,{color:C.orange,active:true});}
  },k===3);
  // legend: the fermentation flow
  panel(c,620,LY,310,LH);
  const hi=[[0,1],[0,1,2,3],[2],[3]][k],row=(i,y)=>{const on=hi.includes(i);if(on)D.round(c,630,y-28,290,44,10,rgba(C.yellow,.12),null);return on;};
  text(c,P('發酵作用','Fermentation'),775,LY+36,24,C.yellow,'center');
  let y=LY+82;
  row(0,y);at(c,'yeast_single.png',664,y-8,38);text(c,P('酵母菌（真菌）','Yeast (a fungus)'),696,y,22,C.white);
  y+=46;row(1,y);sugar(c,664,y-8,10);text(c,P('醣','Sugar'),696,y,22,C.white);
  y+=14;arrow(c,664,y,664,y+30,C.muted,3);text(c,P('分解','broken down'),696,y+24,22,C.muted);
  y+=66;row(2,y);co2(c,664,y-8,5);text(c,P('二氧化碳','Carbon dioxide'),696,y,22,C.white);
  y+=46;row(3,y);alcohol(c,656,y-8,5);text(c,P('酒精','Alcohol'),696,y,22,C.white);
  text(c,P('＋ 能量（給酵母菌用）','+ energy for the yeast'),775,y+44,22,C.muted,'center');
}
// fermented foods
const FOODS=[
 {file:'food_soy_sauce.png',name:P('醬油','Soy sauce'),microbe:P('麴菌','Koji mould'),kind:P('真菌（黴菌）','Fungus (a mould)'),kc:FUNGUS,draw:'koji',from:P('黃豆、小麥','Soybeans, wheat'),
  short:P('分解黃豆、小麥的蛋白質和澱粉，產生鮮味。','Breaks down the protein and starch in soybeans and wheat, making savoury flavour.'),
  text:P('麴菌把黃豆和小麥裡的蛋白質、澱粉分解，產生鮮味；加鹽水後，乳酸菌和酵母菌繼續發酵，產生香味。','Koji mould breaks down the protein and starch in soybeans and wheat, making savoury flavour; after brine is added, lactic acid bacteria and yeast keep fermenting and add aroma.')},
 {file:'food_yogurt.png',name:P('優格','Yogurt'),microbe:P('乳酸菌','Lactic acid bacteria'),kind:P('細菌','Bacteria'),kc:BACT,draw:'lacto',from:P('牛奶','Milk'),
  short:P('把牛奶裡的醣分解成乳酸：牛奶變酸、變濃稠。','Turns milk sugar into lactic acid: the milk sours and thickens.'),
  text:P('乳酸菌把牛奶裡的醣（乳糖）分解成乳酸。牛奶變酸，裡面的蛋白質凝結，變得濃稠。','Lactic acid bacteria turn the sugar in milk (lactose) into lactic acid. The milk turns sour and its protein sets, so it thickens.')},
 {file:'food_pickled_cabbage.png',name:P('泡菜','Pickled cabbage'),flowName:P('泡菜','Pickles'),microbe:P('乳酸菌','Lactic acid bacteria'),kind:P('細菌','Bacteria'),kc:BACT,draw:'lacto',from:P('蔬菜','Vegetables'),
  short:P('把蔬菜裡的醣分解成乳酸：泡菜變酸，比較耐放。','Turns sugar into lactic acid: the pickle sours and keeps longer.'),
  shortNote:P('補充：有些台式泡菜是加醋醃的，沒有經過發酵。','Extra: some Taiwanese pickles are just soaked in vinegar, with no fermentation.'),
  text:P('乳酸菌把蔬菜裡的醣分解成乳酸，泡菜變酸，壞菌也不容易生長，可以保存久一點。','Lactic acid bacteria turn the sugar in the vegetables into lactic acid, so the pickle turns sour and harmful microbes struggle to grow; it keeps longer.'),
  note:P('補充：有些台式泡菜是直接加醋醃的，酸味來自醋，沒有經過發酵。','Extra: some Taiwanese pickled cabbage is simply soaked in vinegar; the sourness comes from the vinegar, with no fermentation.')},
 {file:'food_bread.png',name:P('麵包','Bread'),microbe:P('酵母菌','Yeast'),kind:P('真菌','Fungus'),kc:FUNGUS,draw:'yeast',from:P('麵粉','Flour'),
  short:P('分解醣，放出二氧化碳，讓麵團膨大、變蓬鬆。','Breaks down sugar and gives off carbon dioxide, puffing up the dough.'),
  text:P('酵母菌分解醣，放出二氧化碳，讓麵團膨大、變蓬鬆（看「麵團發酵」）。饅頭、包子也是這樣做的。','Yeast breaks down sugar and gives off carbon dioxide, which puffs the dough up (see "Rising dough"). Steamed buns are made the same way.')}];
const FOOD_SHORT=FOODS.map(f=>f.name);
const RODS=(()=>{const R=rng(5),o=[];for(let i=0;i<7;i++){const x=(R()-.5)*170,y=(R()-.5)*150,a=R()*Math.PI,n=1+Math.floor(R()*3);o.push([x,y,a,n]);}return o;})();
function microbe(c,kind,cx,cy,t){
  if(kind==='yeast'){at(c,'yeast_budding.png',cx-40,cy-10,140);at(c,'yeast_pair.png',cx+62,cy+56,86);
    for(let i=0;i<6;i++){const p=mod(t*.35+i/6),x=cx-30+(i%3)*40+8*Math.sin(p*7+i),y=cy+40-p*150;co2(c,x,y,4,1-p);}return;}
  if(kind==='lacto'){
    for(let i=0;i<10;i++){const p=mod(t*.25+i/10),a=i*TAU/10;sugar(c,cx+Math.cos(a)*(118-p*70),cy+Math.sin(a)*(118-p*70),6,(1-p)*.9);}
    RODS.forEach(([x,y,a,n],i)=>{const wob=.12*Math.sin(t*2+i);for(let j=0;j<n;j++){const px=cx+x+Math.cos(a+wob)*j*38,py=cy+y+Math.sin(a+wob)*j*38;
      c.save();c.translate(px,py);c.rotate(a+wob);D.round(c,-18,-7,36,14,7,'#c4b5fd','#ede9fe');c.restore();}});
    for(let i=0;i<8;i++){const p=mod(t*.3+i/8),a=i*TAU/8+.4;lacticDot(c,cx+Math.cos(a)*(30+p*90),cy+Math.sin(a)*(30+p*90),1-p);}return;}
  // koji mould: threads (hyphae) and stalks topped with balls of spores
  c.save();c.strokeStyle='#e9e1c4';c.lineWidth=3;c.lineCap='round';
  [[-110,70,-40,40,30,62],[-60,90,0,50,80,80],[20,96,60,40,110,70]].forEach(([a,b,d,e,f,g])=>{c.beginPath();c.moveTo(cx+a,cy+b);c.quadraticCurveTo(cx+d,cy+e,cx+f,cy+g);c.stroke();});c.restore();
  [[-55,64,-50,-40],[10,56,14,-66],[70,64,74,-24]].forEach(([x0,y0,x1,y1],i)=>{line(c,[[cx+x0,cy+y0],[cx+x1,cy+y1]],'#e9e1c4',4);circle(c,cx+x1,cy+y1,13,'#d9e77a','#a3b247',2);
    for(let j=0;j<14;j++){const a=j*TAU/14;for(let m=1;m<=3;m++)circle(c,cx+x1+Math.cos(a)*(13+m*6),cy+y1+Math.sin(a)*(13+m*6),3,'#c8d96a',null);}
    for(let m=0;m<3;m++){const p=mod(t*.3+i/3+m/3);circle(c,cx+x1+18+p*70*Math.cos(m*2+i),cy+y1-6-p*50,4,rgba('#c8d96a',1-p),null);}});

}
function drawFoods(c,s,t){
  const {k}=stageClock(s,t,4,6);s.shown=k;
  FOODS.forEach((f,i)=>{const x=40+i*226,y=24,w=210,h=232,on=i===k;
    D.round(c,x,y,w,h,14,on?rgba(C.yellow,.12):'rgba(11,26,21,.45)',on?C.yellow:C.edge);
    place(c,f.file,x+12,y+12,w-24,164,{alpha:on?1:.6});
    text(c,f.name,x+w/2,y+208,24,on?C.yellow:C.white,'center');D.hit(x,y,w,h,'phase',i);});
  const f=FOODS[k],cx=162,cy=428,r=124;
  dashed(c,[[40+k*226+105,256],[cx,cy-r]],rgba(C.yellow,.6));
  c.save();c.beginPath();c.arc(cx,cy,r,0,TAU);c.clip();c.fillStyle='#10261f';c.fillRect(cx-r,cy-r,2*r,2*r);microbe(c,f.draw,cx,cy,t);c.restore();
  circle(c,cx,cy,r,null,C.yellow,4);
  // name every kind of thing drawn in the circle
  const KEY={koji:[[(c,x,y)=>{circle(c,x,y,7,'#d9e77a','#a3b247',1.5);},P('孢子','Spores'),'#d9e77a',cy-r+6],[(c,x,y)=>{line(c,[[x-9,y+5],[x,y-4],[x+9,y+3]],'#e9e1c4',3);},P('菌絲','Hyphae'),'#e9e1c4',cy+r-46]],
    lacto:[[(c,x,y)=>sugar(c,x,y,8),P('醣','Sugar'),'#f5c542',cy-r+6],[(c,x,y)=>lacticDot(c,x,y),P('乳酸','Lactic acid'),C.orange,cy+r-46]],
    yeast:[[(c,x,y)=>co2(c,x,y,4),P('二氧化碳','Carbon dioxide'),C.white,cy+r-46]]}[f.draw];
  KEY.forEach(([icon,p,col,y])=>{const w=measure(c,p,22)+28+30,x=cx-w/2;D.round(c,x,y,w,40,20,'rgba(11,26,21,.9)',rgba(col,.8));icon(c,x+22,y+20);text(c,p,x+40,y+28,22,col);});
  const X0=318,XR=916;panel(c,X0-18,290,XR-X0+38,290);
  text(c,f.microbe,X0,334,26,C.yellow);const pw=measure(c,f.microbe,26);
  pill(c,f.kind,X0+12+pw,308,{color:f.kc,active:true});
  // raw material → microbe → food (if a pill does not fit, it starts a new row behind its arrow)
  let fx=X0,fy=356;[[f.from,C.white,false],[f.microbe,f.kc,false],[f.flowName||f.name,C.yellow,true]].forEach(([p,col,act],i)=>{
    if(i){if(fx+12+42+measure(c,p,22)+28>XR){fx=X0;fy+=50;}else fx+=12;arrow(c,fx,fy+20,fx+30,fy+20,C.muted,3);fx+=42;}
    const r=pill(c,p,fx,fy,{color:col,active:act});fx=r.x+r.w;});
  const ty=fy+86,hh=wrap(c,f.short,X0,ty,XR-X0,22,C.white,32);
  if(f.shortNote)wrap(c,f.shortNote,X0,ty+hh+8,XR-X0,22,C.muted,30);
}
const FERM_TABS=[P('麵團發酵','Rising dough'),P('發酵食品','Fermented foods')];

// ── Tab 2: breeding ────────────────────────────────────────────────────────
const PARTS=[{name:P('頂芽','Terminal bud'),col:C.yellow,at:[.47,.03]},{name:P('花序','Flower clusters'),col:C.pink,at:[.27,.28]},{name:P('莖','Stem'),col:C.cyan,at:[.52,.66]},{name:P('葉','Leaves'),col:C.green,at:[.2,.86]}];
const VARS=[{file:'brassica_cabbage.png',name:P('高麗菜','Cabbage'),part:0,eat:P('葉包成的大頂芽','A huge leafy bud')},
 {file:'brassica_broccoli.png',name:P('青花菜','Broccoli'),part:1,eat:P('花序和花莖','Flower buds')},
 {file:'brassica_cauliflower.png',name:P('花椰菜','Cauliflower'),part:1,eat:P('白色的花序','White flowers')},
 {file:'brassica_kohlrabi.png',name:P('球莖甘藍','Kohlrabi'),part:2,eat:P('膨大的莖','A swollen stem')},
 {file:'brassica_kale.png',name:P('羽衣甘藍','Kale'),part:3,eat:P('大而捲的葉','Big curly leaves')}];
const VCARD=[[300,24],[510,24],[720,24],[300,308],[510,308]],VW=200,VH=268;
const FAM_SHORT=[P('頂芽','Bud'),P('花序','Flowers'),P('莖','Stem'),P('葉','Leaves'),P('同一種','One species')];
const FAM_NAMES=[P('挑頂芽大的','Selecting a big terminal bud'),P('挑花序大的','Selecting big flower clusters'),P('挑莖粗的','Selecting a thick stem'),P('挑葉子大的','Selecting big leaves'),P('都是同一種植物','All one species')];
const FAM_TEXT=[
 P('野生甘藍的莖頂端有頂芽。人們一代一代挑頂芽最大、葉片包得最緊的植株來繁殖，培育出高麗菜：我們吃的是葉片包成的大頂芽。','Wild cabbage has a terminal bud at the top of its stem. Generation after generation, people bred the plants with the biggest, tightest buds, giving cabbage: the head we eat is a giant bud of wrapped leaves.'),
 P('挑花序（一大叢花芽）長得又大又密的植株，培育出青花菜和花椰菜；我們吃的是還沒開的花芽和花莖。','Selecting plants with big, dense flower clusters gave broccoli and cauliflower; we eat the unopened flower buds and their stalks.'),
 P('挑莖的下半部比較粗的植株，一代一代留下來，莖越來越膨大，成為球莖甘藍。','Keeping the plants whose lower stem was a little thicker, generation after generation, made the stem swell into kohlrabi.'),
 P('挑葉子又大又多的植株，培育出羽衣甘藍；有些品種的葉子還特別捲。','Selecting plants with more and bigger leaves gave kale; some varieties have extra-curly leaves.'),
 P('這些蔬菜長得很不一樣，其實都是「甘藍」這一種植物的不同品種，彼此可以互相交配。品種不同，是人們挑選的部位不同。','These vegetables look very different, yet they are all varieties of one species, Brassica oleracea, and can interbreed. They differ because people selected different parts.')];
function drawFamily(c,s,t){
  const {k}=stageClock(s,t,5,6);s.shown=k;
  const wild=place(c,'brassica_wild.png',30,36,240,500);
  text(c,P('野生甘藍（祖先）','Wild cabbage (ancestor)'),150,574,22,C.white,'center');
  VARS.forEach((v,i)=>{const [x,y]=VCARD[i],on=k===4||v.part===k,col=PARTS[v.part].col;
    D.round(c,x,y,VW,VH,14,on?rgba(col,.12):'rgba(11,26,21,.45)',on?col:C.edge);
    place(c,v.file,x+10,y+10,VW-20,170,{alpha:on?1:.45});
    text(c,v.name,x+VW/2,y+212,24,on?C.white:C.muted,'center');
    if(on)cpill(c,v.eat,x+VW/2,y+224,{color:col,size:22,minX:x+2,maxX:x+VW-2});});
  // the summary card
  const [sx,sy]=[720,308];D.round(c,sx,sy,VW,VH,14,k===4?rgba(C.yellow,.14):'rgba(11,26,21,.45)',k===4?C.yellow:C.edge);
  wrap(c,P('都是同一種植物：甘藍。不同的是「品種」，彼此可以互相交配。','All one species, Brassica oleracea. Only the variety differs, and they can interbreed.'),sx+16,sy+44,VW-32,22,k===4?C.yellow:C.muted,32);
  // the part on the ancestor and links to the vegetables
  PARTS.forEach((p,i)=>{const [x,y]=pt(wild,...p.at),on=k===4||i===k;
    if(on&&k<4)VARS.forEach((v,j)=>{if(v.part!==i)return;const [cx0,cy0]=VCARD[j];dashed(c,[[x+14,y],[cx0,cy0+VH/2]],rgba(p.col,.75),2.5,[7,6],-t*18);});
    marker(c,x,y,i+1,on?t:null,13,on?p.col:rgba(p.col,.45));
    if(on&&k<4){const w=measure(c,p.name,22)+28;if(x+22+w<=290)pill(c,p.name,x+22,y-22,{color:p.col,active:true});else pill(c,p.name,x-w/2,y+18,{color:p.col,active:true,minX:24,maxX:290});}});
}
// Selection, generation by generation (kohlrabi as the example).
const GEN_MEAN=[9,14,19,28],GENS=GEN_MEAN.map((m,g)=>{const R=rng(31+g),o=[];for(let j=0;j<6;j++)o.push(g===3?m+(R()-.5)*4:m+(R()-.5)*10);return o;});
const GEN_LABEL=[P('第 1 代','Generation 1'),P('第 2 代','Generation 2'),P('第 3 代','Generation 3'),P('很多代以後','Many generations later')];
const PX0=236,PDX=84,ROW0=34,ROWH=134;
function plant(c,x,base,r,a=1){c.save();c.globalAlpha*=a;
  line(c,[[x,base],[x,base-40-r]],'#a7c97f',6);
  const by=base-6-r*.8;ellipse(c,x,by,r,r*.82,'#bcd994','#6d8f4a',2);
  const sw=Math.sin(B.getState().elapsed*1.6+x*.05)*3;
  [[-30,-58],[0,-72],[30,-58]].forEach(([dx,dy])=>{const tx=x+dx+sw,ty=by-r*.5+dy;line(c,[[x+dx*.15,by-r*.6],[tx,ty+10]],'#8fbf6a',3);ellipse(c,tx,ty,12,8,'#4f8f4a','#2f5f2e',1.5,dx*.02);});
  c.restore();}
function drawSelect(c,s,t){
  const {k,tau}=stageClock(s,t,4,6);s.shown=k;
  panel(c,690,24,250,300);
  wrap(c,P('育種的規則：每一代都留下莖最粗的 2 株，用它們的種子種出下一代。','The rule: each generation, keep the 2 plants with the thickest stems and sow their seeds for the next.'),708,62,214,22,C.white,32);
  for(let g=0;g<=k;g++){const top=ROW0+g*ROWH,base=top+112,cur=g===k,a=cur?fade(tau,0,.8):1;
    c.save();c.globalAlpha=a;
    wrap(c,GEN_LABEL[g],40,top+64,150,22,cur?C.yellow:C.muted,28);
    line(c,[[PX0-40,base+2],[PX0+5*PDX+40,base+2]],'#6b4f2a',4);
    const order=GENS[g].map((r,j)=>[r,j]).sort((p,q)=>q[0]-p[0]),pick=g<3?[order[0][1],order[1][1]]:[];
    const sel=cur?fade(tau,1.6,.6):1,drop=cur?fade(tau,2.6,.8):1;
    GENS[g].forEach((r,j)=>{const x=PX0+j*PDX,chosen=pick.includes(j);plant(c,x,base,r,g<3&&!chosen?1-.65*drop:1);
      if(chosen&&sel>0){c.save();c.globalAlpha*=sel;circle(c,x,base-40,46,null,C.yellow,3);c.restore();if(cur&&sel>.5)cpill(c,P('留下','Keep'),x,top-6,{color:C.yellow,active:true});}});
    // seeds of the chosen plants fall to the next row
    if(g<3&&cur&&k<3){const u=fade(tau,3.4,1.4);if(u>0&&u<1)pick.forEach((j,m)=>{for(let q=0;q<3;q++){const x0=PX0+j*PDX,x1=PX0+(m*3+q)*PDX,y=mix(base-20,base+ROWH-30,smooth(u));circle(c,mix(x0,x1,smooth(u)),y,5,'#8a6a3c',C.white,1.2);}});}
    c.restore();}
  if(k===3){const a=fade(tau,1,1);
    const r=place(c,'brassica_kohlrabi.png',710,340,220,200,{alpha:a});c.save();c.globalAlpha=a;text(c,P('球莖甘藍','Kohlrabi'),r.x+r.w/2,574,24,C.yellow,'center');c.restore();}
}
const SEL_SHORT=[P('第 1 代','Gen 1'),P('第 2 代','Gen 2'),P('第 3 代','Gen 3'),P('很多代後','Later')];
const SEL_TEXT=[
 P('第 1 代：同一種野生甘藍，每一株的莖粗細本來就不太一樣（這是變異）。農夫留下莖最粗的 2 株，收集它們的種子。','Generation 1: wild cabbage plants of one species already differ a little in stem thickness (variation). The farmer keeps the 2 thickest and collects their seeds.'),
 P('第 2 代：種子長成的植株，莖平均比上一代粗一點，但仍有粗有細。再一次留下最粗的 2 株。','Generation 2: grown from those seeds, the plants have slightly thicker stems on average, but still vary. Again the 2 thickest are kept.'),
 P('第 3 代：一代一代挑下去，莖越來越粗。挑選的是植物本來就有的差異，沒有在實驗室裡改動基因。','Generation 3: generation after generation the stems grow thicker. Only differences the plants already had are selected; no genes are altered in a lab.'),
 P('很多代以後：莖膨大成球，就是球莖甘藍。用同樣的方法挑不同的部位，就得到高麗菜、青花菜……這叫做育種。','Many generations later the stem swells into a ball: kohlrabi. Selecting other parts the same way gives cabbage, broccoli and the rest. This is breeding.')];
const BREED_TABS=[P('同一個祖先','One ancestor'),P('一代一代挑','Generation by generation')];

// ── Tab 3: gene transfer ───────────────────────────────────────────────────
const CX=190,CY=300,CR=150,NR=92,G0=168,G1=212;
const BX=650,BY=300,BW=380,BH=180,PX=762,PY=300,PR=36;
const LV=[[[340,290]],[[340,220],[340,360]],[[190,220],[490,220],[190,360],[490,360]],[[115,220],[265,220],[115,360],[265,360],[415,220],[565,220],[415,360],[565,360]]],BS=.34;
const PARENT=[null,[0,0],[0,0,1,1],[0,0,1,1,2,2,3,3]];
function chromo(c,x,y,r,a=1,s=1){c.save();c.globalAlpha*=a;c.beginPath();for(let i=0;i<=80;i++){const q=i/80*TAU,rr=r*(1+.22*Math.sin(5*q)+.14*Math.sin(3*q+1));c[i?'lineTo':'moveTo'](x+Math.cos(q)*rr*1.25,y+Math.sin(q)*rr*.8);}c.closePath();c.strokeStyle='#9fb8ad';c.lineWidth=2.5*s;c.stroke();c.restore();}
// Plasmid ring; gap = open angle at the top; gene = inserted (yellow) arc.
function plasmid(c,x,y,r,{gap=0,gene=0,w=7,a=1}={}){c.save();c.globalAlpha*=a;c.lineCap='round';const top=-Math.PI/2,half=.45;
  c.beginPath();c.arc(x,y,r,top+gap*half+(gene?half:0),top+TAU-gap*half-(gene?half:0));c.strokeStyle=PLASMID;c.lineWidth=w;c.stroke();
  if(gene){c.globalAlpha*=gene;c.beginPath();c.arc(x,y,r,top-half,top+half);c.strokeStyle=GENE;c.lineWidth=w;c.stroke();}c.restore();}
function bacterium(c,x,y,s,{a=1,gene=1,stretch=1}={}){c.save();c.globalAlpha*=a;c.translate(x,y);c.scale(s,s);
  const w=BW*stretch;D.round(c,-w/2,-BH/2,w,BH,BH/2,'rgba(127,209,185,.16)','#7fd1b9');c.lineWidth=3;
  chromo(c,-50,0,50,1,1/s>2?1.6:1);plasmid(c,PX-BX,0,PR,{gene,w:s<.6?10:7});c.restore();}
function cell(c,x,y,r,nr,{a=1,gene=1,cut=0,ph=0}={}){c.save();c.globalAlpha*=a;
  circle(c,x,y,r,'rgba(242,201,189,.13)','#f2c9bd',3);circle(c,x,y,nr,'rgba(196,181,253,.13)','#c4b5fd',2.5);
  const y0=y,gx0=x+(G0-CX),gx1=x+(G1-CX);
  dna(c,x-80,gx0-(cut?4:0),y0,C.white,ph);dna(c,gx1+(cut?4:0),x+80,y0,C.white,ph);if(!cut)dna(c,gx0,gx1,y0,GENE,ph,8,4);
  c.restore();}
const INS_SHORT=[P('找基因','Gene'),P('剪下','Cut'),P('接進質體','Insert'),P('繁殖','Multiply'),P('做胰島素','Insulin')];
const INS_NAMES=[P('人的胰島素基因','The human insulin gene'),P('把基因剪下來','Cutting out the gene'),P('接進細菌的質體','Into the bacterium\'s plasmid'),P('細菌大量繁殖','The bacteria multiply'),P('製造胰島素','Making insulin')];
const INS_TEXT=[
 P('人的細胞核裡有 DNA，其中一段是製造胰島素的基因（黃色）。胰島素由胰臟分泌，能讓血糖下降。','The nucleus of a human cell holds DNA; one stretch of it is the gene for making insulin (yellow). Insulin, released by the pancreas, lowers blood sugar.'),
 P('科學家把胰島素基因從人的 DNA 上剪下來。補充：真正負責「剪」的是特殊的酵素，高中會學。','Scientists cut the insulin gene out of human DNA. Extra: the real "scissors" are special enzymes, which you will meet in senior high.'),
 P('細菌除了自己的 DNA，還有小小的環狀 DNA，叫做質體。把質體剪開，接上胰島素基因，再放回大腸桿菌裡。','Besides its own DNA, a bacterium has small rings of DNA called plasmids. A plasmid is cut open, the insulin gene is joined in, and it goes back into an E. coli bacterium.'),
 P('細菌一分為二，繁殖得很快。每一個新細菌都帶著接上胰島素基因的質體。','Bacteria split in two and multiply fast. Every new bacterium carries the plasmid with the insulin gene.'),
 P('細菌照著這個基因，做出人的胰島素。純化後做成藥，給糖尿病患者使用。以前的胰島素要從豬、牛的胰臟取得，數量有限。','Following the gene, the bacteria make human insulin. Purified, it becomes medicine for people with diabetes. Insulin used to come from pig and cattle pancreases, and supplies were limited.')];
function drawInsulin(c,s,t){
  const {k,tau}=stageClock(s,t,5,6);s.shown=k;
  const ph=t*.6;
  if(k<=2){
    cell(c,CX,CY,CR,NR,{cut:k>=1&&tau>2.1||k===2,ph,gene:1});
    text(c,P('人的細胞','A human cell'),CX,CY-CR-16,24,C.white,'center');text(c,P('細胞核','Nucleus'),CX,CY-NR+34,22,C.muted,'center');
    text(c,'DNA',CX-80,CY+44,22,C.muted);
    const geneHome=[(G0+G1)/2,CY],geneDock=[PX,PY-PR-72];
    if(k===0){pulse(c,geneHome[0],geneHome[1],t,GENE,24);cpill(c,P('胰島素基因','Insulin gene'),geneHome[0],CY+NR+14,{color:GENE,active:true});line(c,[[geneHome[0],CY+NR+14],[geneHome[0],CY+14]],GENE,2);}
    if(k===1){const sn1=fade(tau,.2,.5),sn2=fade(tau,1.1,.5);
      if(tau<1.2)scissors(c,G0-30,CY-34,.9,1-Math.abs(Math.sin(fade(tau,.3,.6)*Math.PI))*.9+.1,sn1);
      else if(tau<2.1)scissors(c,G1+30,CY-34,Math.PI-.9,1-Math.abs(Math.sin(fade(tau,1.2,.6)*Math.PI))*.9+.1,sn2);
      const u=smooth(fade(tau,2.2,2.2)),q=bez(geneHome,[440,120],geneDock,u);
      if(tau>=2.1)dna(c,q[0]-22,q[0]+22,q[1],GENE,ph,8,4);
      }
    // bacterium
    const ba=k===0?.55:1;
    c.save();c.globalAlpha=ba;D.round(c,BX-BW/2,BY-BH/2,BW,BH,BH/2,'rgba(127,209,185,.16)','#7fd1b9');chromo(c,BX-60,BY,50);c.restore();
    text(c,P('大腸桿菌（一種細菌）','E. coli (a bacterium)'),BX-BW/2+6,BY-BH/2-16,24,rgba(C.white,ba),'left');
    let gap=0,gene=0;
    if(k===2){gap=smooth(fade(tau,.6,.8));const d=smooth(fade(tau,1.6,1.2)),m=fade(tau,2.9,.6);gene=m;
      if(tau<1.2)scissors(c,PX,PY-PR-30,Math.PI/2,1-Math.abs(Math.sin(fade(tau,.3,.6)*Math.PI))*.9+.1,1);
      if(m<1)dna(c,PX-22,PX+22,mix(PY-PR-72,PY-PR,d),GENE,ph,8*(1-m*.5),4,1-m);
      if(m>0)gap=1;}
    plasmid(c,PX,PY,PR,{gap,gene,a:ba});
    const pp=cpill(c,k===2&&tau>3.4?P('接上胰島素基因的質體','Plasmid + insulin gene'):P('質體','Plasmid'),PX,BY+BH/2+18,{color:PLASMID,active:k===2,maxX:944});
    line(c,[[PX,pp.y],[PX,PY+PR+6]],rgba(PLASMID,.8),2);
    cpill(c,P('細菌的 DNA','Bacterial DNA'),BX-150,BY+BH/2+18,{color:'#9fb8ad'});
    insStrip(c,k,t);return;}
  if(k===3){// the bacterium shrinks to the left, then splits 1 → 2 → 4 → 8
    const m=smooth(fade(tau,0,1)),s0=mix(1,BS,m),p0=lerpP([BX,BY],LV[0][0],m);
    if(tau<1){bacterium(c,p0[0],p0[1],s0);}
    else{const g=Math.min(2,Math.floor((tau-1)/1.2)),u=smooth((tau-1-g*1.2)/.8),lv=g+1,from=LV[g];
      LV[lv].forEach((q,i)=>{const par=from[PARENT[lv][i]],p=lerpP(par,q,u);bacterium(c,p[0],p[1],BS,{stretch:1+.25*(1-u)});});}
    cpill(c,P('一分為二，大量繁殖','Each splits in two'),340,110,{color:C.white});
    panel(c,660,150,270,300);wrap(c,P('每一個新細菌都帶著胰島素基因。','Every new bacterium carries the insulin gene.'),680,196,230,22,C.white,32);
    bacterium(c,795,380,.42);pulse(c,795+(PX-BX)*.42,380,t,GENE,14);
    insStrip(c,k,t);return;}
  // k === 4: insulin flows from every bacterium to purification and the vial
  LV[3].forEach(q=>bacterium(c,q[0],q[1],BS));
  const col=[720,170,64,150];D.round(c,col[0],col[1],col[2],col[3],14,'rgba(85,233,255,.08)',rgba(C.white,.8));
  for(let i=0;i<4;i++)line(c,[[col[0]+8,col[1]+40+i*32],[col[0]+col[2]-8,col[1]+40+i*32]],rgba(C.white,.35),2);
  text(c,P('純化','Purify'),col[0]+col[2]/2,col[1]-14,22,C.white,'center');
  // vial
  const vx=850,vy=380;D.round(c,vx-32,vy-60,64,110,12,'rgba(242,236,217,.10)',rgba(C.white,.85));D.round(c,vx-24,vy-18,48,60,8,rgba(GENE,.35),null);D.round(c,vx-20,vy-78,40,20,4,'#7d8f88',C.ink);
  for(let i=0;i<3;i++)insulin(c,vx-10+i*10,vy+8+(i%2)*14,.55,.9);
  cpill(c,P('胰島素藥劑','Insulin medicine'),vx,vy+60,{color:GENE,maxX:944});
  arrow(c,col[0]+col[2]/2,col[1]+col[3]+6,vx-38,vy-36,rgba(C.white,.75),3);
  LV[3].forEach((q,i)=>{for(let j=0;j<2;j++){const p=mod(t*.18+i/8+j*.5),dock=[col[0]+col[2]/2,col[1]+20],mid=[mix(q[0],dock[0],.5),q[1]-120];
    const xy=bez([q[0]+34,q[1]],mid,dock,smooth(p));insulin(c,xy[0],xy[1],.8,p<.9?1:(1-p)*10);}});
  cpill(c,P('胰島素','Insulin'),340,96,{color:GENE,active:true});
  text(c,P('給糖尿病患者使用','For people with diabetes'),930,vy+130,22,C.white,'right');
  insStrip(c,k,t);
}
// The whole process at the bottom, current step lit.
function insStrip(c,k,t){const w=168,gap=15,y=520;
  INS_SHORT.forEach((n,i)=>{const x=40+i*(w+gap),on=i===k,done=i<k;
    D.round(c,x,y,w,56,12,on?rgba(GENE,.16):'rgba(11,26,21,.6)',on?GENE:done?rgba(C.white,.45):C.edge);
    marker(c,x+24,y+28,i+1,on?t:null,12,on?GENE:done?C.white:C.muted);text(c,n,x+44,y+36,22,on?GENE:done?C.white:C.muted);
    if(i<4)arrow(c,x+w+1,y+28,x+w+gap-1,y+28,C.muted,2);});}
// glowing fish
function jelly(c,x,y,s,t,a=1){c.save();c.globalAlpha*=a;glow(c,x,y,70*s,GLOW_G,.35);
  for(let i=0;i<6;i++){const x0=x-30*s+i*12*s;c.beginPath();for(let j=0;j<=12;j++){const yy=y+6*s+j*7*s;c[j?'lineTo':'moveTo'](x0+5*s*Math.sin(t*2+i+j*.6),yy);}c.strokeStyle=rgba(GLOW_G,.7);c.lineWidth=2;c.stroke();}
  c.beginPath();c.ellipse(x,y+6*s,42*s,40*s,0,Math.PI,TAU);c.closePath();const g=c.createRadialGradient(x,y-10*s,4,x,y,46*s);g.addColorStop(0,'rgba(200,255,190,.9)');g.addColorStop(1,'rgba(125,255,106,.25)');c.fillStyle=g;c.fill();c.strokeStyle=GLOW_G;c.lineWidth=2;c.stroke();c.restore();}
function coral(c,x,y,s,a=1){c.save();c.globalAlpha*=a;c.strokeStyle=GLOW_R;c.lineCap='round';glow(c,x,y-30*s,60*s,GLOW_R,.25);
  const br=(x0,y0,ang,len,d)=>{if(d>3)return;const x1=x0+Math.cos(ang)*len,y1=y0+Math.sin(ang)*len;c.lineWidth=(6-d*1.3)*s;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();br(x1,y1,ang-.5,len*.7,d+1);br(x1,y1,ang+.45,len*.7,d+1);};
  br(x,y,-Math.PI/2,30*s,0);c.restore();}
function fishEgg(c,x,y,r,{a=1,glowA=0,stage=0}={}){c.save();c.globalAlpha*=a;circle(c,x,y,r,'rgba(242,236,217,.06)',rgba(C.white,.75),2);
  circle(c,x,y+r*.12,r*.7,'rgba(245,197,66,.35)',null);
  if(stage===0){c.beginPath();c.ellipse(x,y-r*.55,r*.32,r*.16,0,0,TAU);c.fillStyle='rgba(242,201,189,.85)';c.fill();}
  else{c.save();c.beginPath();c.arc(x,y+r*.12,r*.72,-2.6,.6);c.strokeStyle='rgba(242,201,189,.9)';c.lineWidth=r*.2;c.lineCap='round';c.stroke();c.restore();circle(c,x+r*.5,y-r*.2,r*.08,C.ink,null);}
  if(glowA>0)glow(c,x,y,r*1.1,GLOW_G,glowA*.5);c.restore();}
function needle(c,x0,y0,x1,y1,a=1){c.save();c.globalAlpha*=a;const ang=Math.atan2(y1-y0,x1-x0),L=Math.hypot(x1-x0,y1-y0);c.translate(x0,y0);c.rotate(ang);
  c.beginPath();c.moveTo(0,-9);c.lineTo(L*.7,-6);c.lineTo(L,0);c.lineTo(L*.7,6);c.lineTo(0,9);c.closePath();c.fillStyle='rgba(85,233,255,.15)';c.fill();c.strokeStyle=rgba(C.white,.8);c.lineWidth=1.6;c.stroke();c.restore();}
function lamp(c,x,y,on){D.round(c,x-70,y-16,140,30,10,'#2a3f38',C.muted);if(on>0){c.save();c.globalAlpha=on;const g=c.createLinearGradient(0,y,0,y+520);g.addColorStop(0,'rgba(80,140,255,.38)');g.addColorStop(1,'rgba(80,140,255,.05)');c.fillStyle=g;c.beginPath();c.moveTo(x-66,y+14);c.lineTo(x+66,y+14);c.lineTo(x+380,y+540);c.lineTo(x-380,y+540);c.closePath();c.fill();
  line(c,[[x-60,y+15],[x+60,y+15]],'#7fb0ff',4);c.restore();}}
const FISH_SHORT=[P('兩種生物','Two organisms'),P('注入受精卵','Inject'),P('長大','Grow'),P('照藍光','Blue light'),P('下一代','Offspring')];
const FISH_NAMES=[P('斑馬魚和水母','A zebrafish and a jellyfish'),P('把螢光基因注入受精卵','Injecting the glow gene into an egg'),P('長大的魚','The fish grows up'),P('照藍光，發出螢光','Glowing under blue light'),P('下一代也會發光','The offspring glow too')];
const FISH_TEXT=[
 P('一般的斑馬魚不會發光。有一種水母，身上有會發出綠色螢光的蛋白質，製造它的是「螢光基因」。','An ordinary zebrafish does not glow. A kind of jellyfish has a protein that gives off green light, made from its "glow gene".'),
 P('科學家用很細的玻璃針，把水母的螢光基因注入斑馬魚的受精卵。','Using a very fine glass needle, scientists inject the jellyfish glow gene into a fertilized zebrafish egg.'),
 P('受精卵分裂、發育，長成一條魚。牠全身的細胞都帶著螢光基因，平常看起來顏色淡淡的。','The egg divides and develops into a fish. Every cell in its body carries the glow gene; in normal light it looks pale.'),
 P('照到藍光（或紫外光），螢光蛋白就發出亮綠色的光。改用珊瑚的螢光基因，魚會發出紅光；沒有螢光基因的魚不會發光。','Under blue (or ultraviolet) light the glowing protein shines bright green. With a coral\'s glow gene instead, the fish glows red; a fish without a glow gene does not glow.'),
 P('螢光基因也在生殖細胞裡，會隨著精子和卵傳給下一代，所以小魚也會發光。2003 年，臺灣是全世界第一個開放基因轉殖螢光魚當觀賞魚販售的地方。','The glow gene is in the germ cells too, so it passes to the next generation through sperm and eggs, and the young glow as well. In 2003 Taiwan became the first place in the world to allow transgenic glowing fish to be sold as pets.')];
function geneBar(c,x,y,col,t,label){dna(c,x-60,x-16,y,C.muted,t*.6);dna(c,x-16,x+16,y,col,t*.6,8,4);dna(c,x+16,x+60,y,C.muted,t*.6);if(label)cpill(c,label,x,y+20,{color:col,maxX:944});}
function drawFish(c,s,t){
  const {k,tau}=stageClock(s,t,5,6);s.shown=k;
  if(k===0){
    at(c,'fish_plain.png',290,190,420,{screen:true});text(c,P('一般的斑馬魚','An ordinary zebrafish'),290,300,22,C.white,'center');text(c,P('不會發光','No glow'),290,332,22,C.muted,'center');
    jelly(c,760,170,1.25,t);text(c,P('水母','Jellyfish'),760,300,22,C.white,'center');
    geneBar(c,760,370,GLOW_G,t,P('螢光基因','Glow gene'));pulse(c,760,370,t,GLOW_G,18);
    return;}
  if(k===1){
    at(c,'fish_plain.png',200,110,260,{screen:true,alpha:.45});text(c,P('斑馬魚','Zebrafish'),200,180,22,C.muted,'center');
    jelly(c,820,110,.8,t,.8);
    const ex=420,ey=390,er=96;fishEgg(c,ex,ey,er);text(c,P('斑馬魚的受精卵','A fertilized zebrafish egg'),ex,ey+er+38,22,C.white,'center');
    const tip=[ex+18,ey-er*.55],tail=[720,250],nd=smooth(fade(tau,.3,1.2)),tp=lerpP([tip[0]+150,tip[1]-120],tip,nd);
    needle(c,tail[0],tail[1],tp[0],tp[1]);
    const g0=[820,190],u=smooth(fade(tau,1.2,1.3)),q=lerpP(g0,tail,u);
    if(u<1){dna(c,q[0]-16,q[0]+16,q[1],GLOW_G,t*.6,8,4);}
    if(tau>2.5)for(let i=0;i<6;i++){const p=mod(t*.6+i/6),xy=lerpP(tail,tp,p);circle(c,xy[0],xy[1],4,GLOW_G,null);}
    if(tau>3.3)glow(c,tip[0]-18,tip[1]+6,40,GLOW_G,.3*fade(tau,3.3,1));
    cpill(c,P('注射螢光基因','Inject the glow gene'),700,300,{color:GLOW_G,maxX:944});
    return;}
  if(k===2){
    const xs=[110,270,430],y=300,lab=[P('受精卵','Egg'),P('胚胎','Embryo'),P('小魚','Larva')];
    xs.forEach((x,i)=>{const a=fade(tau,i*.9,.6);c.save();c.globalAlpha=a;
      if(i<2)fishEgg(c,x,y,46,{stage:i});else{at(c,'fish_green_unlit.png',x,y,120,{screen:true});}
      text(c,lab[i],x,y+84,22,C.white,'center');c.restore();if(a>0&&i<2)arrow(c,x+56,y,x+104,y,rgba(C.white,.7*a),3);});
    const a=fade(tau,2.7,.8);if(a>0){arrow(c,500,y,546,y,rgba(C.white,.7*a),3);at(c,'fish_green_unlit.png',740,y,380,{screen:true,alpha:a});c.save();c.globalAlpha=a;text(c,P('長大的魚','Adult fish'),740,y+84,22,C.white,'center');c.restore();}
    cpill(c,P('全身的細胞都帶著螢光基因','Every cell carries the glow gene'),480,470,{color:GLOW_G});
    return;}
  if(k===3){
    const on=smooth(fade(tau,1,1.2));lamp(c,480,40,on);
    cpill(c,on>.5?P('藍光','Blue light'):P('開燈前','Light off'),480,64,{color:'#7fb0ff'});
    at(c,'fish_green_unlit.png',260,190,400,{screen:true,alpha:1-on});at(c,'fish_green.png',260,190,400,{screen:true,alpha:on});
    at(c,'fish_red.png',720,190,400,{screen:true,alpha:on});at(c,'fish_red.png',720,190,400,{screen:true,alpha:(1-on)*.25});
    at(c,'fish_plain.png',490,430,360,{screen:true});
    c.save();c.globalAlpha=.4+.6*on;
    text(c,P('水母的螢光基因：綠光','Jellyfish gene: green'),260,292,22,GLOW_G,'center');text(c,P('珊瑚的螢光基因：紅光','Coral gene: red'),720,292,22,GLOW_R,'center');c.restore();
    coral(c,880,360,1,on);
    text(c,P('沒有螢光基因：不會發光','No glow gene: no glow'),490,534,22,C.white,'center');
    return;}
  // k === 4: offspring
  lamp(c,480,30,1);
  at(c,'fish_green.png',250,120,300,{screen:true});at(c,'fish_green.png',710,120,300,{screen:true,flip:true});
  text(c,P('螢光魚爸媽','Glowing parents'),480,128,22,C.white,'center');
  const sp=[300,250],eg=[660,250];
  circle(c,eg[0],eg[1],24,rgba(EGG,.25),EGG,3);circle(c,eg[0],eg[1],7,GLOW_G,null);
  ellipse(c,sp[0],sp[1],13,9,rgba(SPERM,.3),SPERM,3);line(c,[[sp[0]-12,sp[1]],[sp[0]-50,sp[1]+6*Math.sin(t*6)]],SPERM,2.5);circle(c,sp[0]+1,sp[1],4.5,GLOW_G,null);
  text(c,P('精子','Sperm'),sp[0]-10,sp[1]+46,22,SPERM,'center');text(c,P('卵','Egg'),eg[0],eg[1]+52,22,EGG,'center');
  cpill(c,P('螢光基因跟著精子和卵傳下去','The glow gene travels in sperm and eggs'),480,186,{color:GLOW_G});
  for(let i=0;i<6;i++){const p=mod(t*.05+i/6),x=140+p*680,y=390+(i%3)*52+10*Math.sin(t*1.5+i);at(c,'fish_green.png',x,y,130,{screen:true,alpha:Math.min(1,Math.min(p,1-p)*8)});}
  text(c,P('小魚也會發光','The young glow too'),480,560,22,C.white,'center');
}
// impacts and rules
const IMPACT=[
 {title:P('好處','Benefits'),col:C.green,items:[P('大量製造藥物，例如胰島素','Make medicines in bulk, such as insulin'),P('作物抗蟲，少用農藥','Pest-resistant crops need less pesticide'),P('增加營養，例如黃金米','Add nutrients, as in Golden Rice')]},
 {title:P('疑慮','Concerns'),col:C.orange,items:[P('基因可能跑到野生植物','Genes may spread to wild plants'),P('被放生到野外，影響生態','Released animals may upset ecosystems'),P('食用安全：上市前要評估，仍有人擔心長期影響','Food safety: some worry about long-term effects')]},
 {title:P('臺灣怎麼管','Taiwan\'s rules'),col:C.cyan,items:[P('基改食品原料要先審查，才能進口、販售','GM ingredients need approval before sale'),P('用到基改原料的食品要標示','Foods with GM ingredients must be labelled'),P('學校午餐不能用基改食材','No GM ingredients in school lunches')]}];
function drawImpact(c,s,t){
  const {k}=stageClock(s,t,4,6);s.shown=k;
  IMPACT.forEach((g,i)=>{const x=36+i*302,y=24,w=286,h=446,on=k===3||i===k;
    c.save();c.globalAlpha=on?1:.5;D.round(c,x,y,w,h,16,on?rgba(g.col,.10):'rgba(11,26,21,.55)',on?g.col:C.edge);
    text(c,g.title,x+w/2,y+46,26,g.col,'center');
    let yy=y+96;g.items.forEach((it,j)=>{marker(c,x+26,yy-7,j+1,on?t+j*.3+i*.2:null,13,g.col);yy+=wrap(c,it,x+50,yy,w-66,22,C.white,32)+28;});
    c.restore();D.hit(x,y,w,h,'phase',i);});
  D.round(c,36,486,890,90,16,k===3?rgba(C.yellow,.12):'rgba(11,26,21,.55)',k===3?C.yellow:C.edge);
  wrap(c,P('判斷一項產品，要看它的證據：好處是什麼、有沒有風險、怎麼管理。不要只看「基因改造」四個字就說好或壞。','Judge each product by its evidence: what it offers, what the risks are, how it is managed. Not by the words "genetically modified" alone.'),60,522,842,22,k===3?C.yellow:C.muted,32);
}
const IMPACT_SHORT=[P('好處','Benefits'),P('疑慮','Concerns'),P('臺灣的規範','Taiwan\'s rules'),P('一起看','All')];
const IMPACT_TEXT=[
 P('好處：細菌大量製造胰島素等藥物；把細菌的抗蟲基因轉入玉米、棉花，可以少用農藥；黃金米多了能在體內轉成維生素 A 的物質（β-胡蘿蔔素）。','Benefits: bacteria make insulin and other medicines in bulk; maize and cotton given a bacterial pest-resistance gene need less pesticide; Golden Rice carries a substance the body turns into vitamin A (beta-carotene).'),
 P('疑慮：轉入的基因可能經由花粉傳到野生的親戚植物；螢光魚若被放生，可能影響生態；食用安全在上市前都要評估，但仍有人擔心長期的影響。','Concerns: an added gene may spread through pollen to wild relatives; glowing fish released into the wild may upset ecosystems; foods are assessed for safety before sale, but some people still worry about long-term effects.'),
 P('臺灣的規範：基因改造的食品原料要先通過審查，才能進口、販售；用到基改原料的食品要標示；學校午餐不能使用基改的生鮮食材和豆腐、豆漿這類初級加工品。','Taiwan\'s rules: GM food ingredients must pass a review before import or sale; foods made with GM ingredients must be labelled; school lunches may not use GM fresh ingredients or simple products made from them, such as tofu and soy milk.'),
 P('生物技術有好處也有疑慮。判斷一項產品，要看它的證據，不要只看「基因改造」四個字就說它好或壞。','Biotechnology brings benefits and concerns. Judge each product by its evidence, not by the label "GM" alone.')];
const GENE_TABS=[P('胰島素','Insulin'),P('螢光魚','Glowing fish'),P('影響與規範','Impacts and rules')];

// ── Tab 4: cloning ─────────────────────────────────────────────────────────
const SHEEP=[{file:'sheep_white_face.png',name:P('白臉羊','White-faced ewe'),role:P('提供細胞核','Gives the nucleus'),col:C.yellow,face:[.86,.2]},
 {file:'sheep_black_face_egg.png',name:P('黑臉羊','Black-faced ewe'),role:P('提供卵細胞','Gives the egg'),col:EGG,face:[.86,.26]},
 {file:'sheep_black_face_surrogate.png',name:P('黑臉羊','Black-faced ewe'),role:P('代理孕母','Surrogate mother'),col:C.cyan,face:[.86,.28],belly:[.5,.55]}];
const SX=[40,350,660],SY=24,SW=260,SH=176;
const sheepRect=i=>fitRect(SHEEP[i].file,SX[i],SY,SW,SH);
function drawSheepRow(c,k,t,hi=[]){
  SHEEP.forEach((sh,i)=>{const r=sheepRect(i),on=hi.includes(i);
    if(on)D.round(c,SX[i]-6,SY-6,SW+12,SH+80,14,rgba(sh.col,.10),sh.col);
    drawIn(c,sh.file,r);text(c,sh.name,SX[i]+SW/2,SY+SH+28,22,C.white,'center');
    cpill(c,sh.role,SX[i]+SW/2,SY+SH+38,{color:sh.col,active:on,minX:SX[i]-4,maxX:SX[i]+SW+4});});
}
const DONOR=[180,440],EGGP=[500,440];
function bodyCell(c,x,y,a=1,nuc=1){c.save();c.globalAlpha*=a;circle(c,x,y,62,'rgba(242,201,189,.16)','#f2c9bd',3);c.restore();if(nuc)nucleus(c,x,y,a*nuc,C.yellow,24);}
function nucleus(c,x,y,a=1,col=C.yellow,r=20){c.save();c.globalAlpha*=a;circle(c,x,y,r,rgba(col,.45),col,3);const k=r/20;for(let i=0;i<4;i++){const q=i*1.7;sline(c,[[x+(-8+Math.cos(q)*4)*k,y+(-6+i*4)*k],[x+(6+Math.sin(q)*4)*k,y+(-4+i*3)*k]],rgba(C.white,.8),2);}c.restore();}
function eggCell(c,x,y,{a=1,nuc=1,r=86}={}){c.save();c.globalAlpha*=a;circle(c,x,y,r+8,null,rgba(EGG,.45),2);circle(c,x,y,r,rgba(EGG,.16),EGG,3);c.restore();if(nuc>0)nucleus(c,x+22,y-18,a*nuc,'#a78bfa',20);}
function embryo(c,x,y,n,a=1,sc=1.25){const pos={2:[[-18,0],[18,0]],4:[[-18,-18],[18,-18],[-18,18],[18,18]],8:[[-30,-14],[-10,-24],[10,-24],[30,-14],[-30,14],[-10,24],[10,24],[30,14]]}[n].map(([a,b])=>[a*sc,b*sc]),r={2:26,4:20,8:14}[n]*sc;
  c.save();c.globalAlpha*=a;circle(c,x,y,72*sc,null,rgba(EGG,.45),2);pos.forEach(([dx,dy])=>{circle(c,x+dx,y+dy,r,rgba(EGG,.2),EGG,2);circle(c,x+dx,y+dy,r*.38,rgba(C.yellow,.6),C.yellow,1.5);});c.restore();}
const DOLLY_SHORT=[P('三隻羊','Three ewes'),P('取細胞核','Nucleus'),P('去核的卵','Egg'),P('融合、分裂','Fuse'),P('植入子宮','Implant'),P('桃莉出生','Dolly')];
const DOLLY_NAMES=[P('三隻羊','Three ewes'),P('取乳腺細胞的細胞核','A nucleus from an udder cell'),P('取卵細胞，去掉細胞核','An egg with its nucleus removed'),P('放入細胞核，開始分裂','Nucleus in; the cell starts dividing'),P('植入代理孕母','Into the surrogate mother'),P('桃莉羊出生','Dolly is born')];
const DOLLY_TEXT=[
 P('1996 年，英國的科學家用三隻羊複製出桃莉羊：一隻白臉羊、兩隻黑臉羊，每一隻的任務都不一樣。','In 1996 British scientists cloned Dolly using three ewes: one white-faced and two black-faced, each with a different job.'),
 P('從白臉羊的乳房取出乳腺細胞。它是體細胞，細胞核裡有這隻羊完整的遺傳物質。','An udder (mammary) cell was taken from the white-faced ewe. It is a body cell, and its nucleus holds the ewe\'s complete genetic material.'),
 P('從黑臉羊取出卵細胞，用很細的玻璃管吸走卵的細胞核，留下沒有細胞核的卵。','An egg was taken from a black-faced ewe, and its nucleus was sucked out with a very fine glass tube, leaving an egg with no nucleus.'),
 P('把乳腺細胞放到去核的卵旁邊，通電讓它們融合，白臉羊的細胞核就進入卵裡。這個細胞開始分裂：2 個、4 個、8 個……成為胚胎。','The udder cell was placed beside the empty egg and a pulse of electricity fused them, so the white-faced ewe\'s nucleus entered the egg. The cell began dividing, 2, 4, 8 cells, into an embryo.'),
 P('把胚胎放進另一隻黑臉羊（代理孕母）的子宮，讓牠懷孕。','The embryo was placed in the womb of the other black-faced ewe, the surrogate mother.'),
 P('代理孕母生下桃莉：白色的臉，跟提供細胞核的白臉羊一樣，不像黑臉羊。','The surrogate gave birth to Dolly, with a white face like the ewe that gave the nucleus, not like the black-faced ewes.')];
function drawDolly(c,s,t){
  const {k,tau}=stageClock(s,t,6,6);s.shown=k;
  const hi=[[0,1,2],[0],[1],[0,1],[2],[0,2]][k];drawSheepRow(c,k,t,hi);
  const r0=sheepRect(0),r1=sheepRect(1),r2=sheepRect(2),belly=pt(r2,.48,.6);
  if(k===0){[0,1,2].forEach(i=>dashed(c,[[SX[i]+SW/2,SY+SH+82],[480,362]],rgba(SHEEP[i].col,.7),2.5,[7,6],-t*18));text(c,P('生下來的小羊，會像哪一隻？','Which ewe will the lamb look like?'),480,400,30,C.yellow,'center');text(c,P('1996 年，英國','Britain, 1996'),480,450,22,C.muted,'center');return;}
  if(k>=1&&k<=3){
    // donor cell
    if(k===1){const u=smooth(fade(tau,0,1.4));dashed(c,[[SX[0]+SW/2,SY+SH+80],[DONOR[0],DONOR[1]-64]],rgba(C.yellow,.7),2.5,[7,6],-t*18);
      bodyCell(c,DONOR[0],DONOR[1],u);if(u>.5)pulse(c,DONOR[0],DONOR[1],t,C.yellow,22);
      cpill(c,P('乳腺細胞（體細胞）','Udder cell (body cell)'),DONOR[0],DONOR[1]+78,{color:C.yellow});
      line(c,[[DONOR[0]+26,DONOR[1]],[DONOR[0]+84,DONOR[1]]],C.yellow,2);text(c,P('細胞核','Nucleus'),DONOR[0]+90,DONOR[1]+8,22,C.yellow);}
    if(k===2){bodyCell(c,DONOR[0],DONOR[1],.55);
      dashed(c,[[SX[1]+SW/2,SY+SH+80],[EGGP[0],EGGP[1]-96]],rgba(EGG,.7),2.5,[7,6],-t*18);
      const out=smooth(fade(tau,1.2,1.4));eggCell(c,EGGP[0],EGGP[1],{nuc:1});
      const tube=[720,340],tip=lerpP(tube,[EGGP[0]+34,EGGP[1]-24],smooth(fade(tau,.4,.8)));
      needle(c,780,310,tip[0],tip[1]);
      if(out>0){c.save();c.beginPath();c.arc(EGGP[0],EGGP[1],86,0,TAU);c.fillStyle='rgba(16,38,31,1)';c.globalAlpha=out;c.fill();c.restore();eggCell(c,EGGP[0],EGGP[1],{nuc:0});const q=lerpP([EGGP[0]+22,EGGP[1]-18],[800,300],out);nucleus(c,q[0],q[1],1-out*.6,'#a78bfa',20);}
      cpill(c,out>.6?P('去核的卵細胞','Egg without a nucleus'):P('卵細胞','Egg cell'),EGGP[0],EGGP[1]+102,{color:EGG});}
    if(k===3){const m=smooth(fade(tau,0,1.4)),p=lerpP(DONOR,[EGGP[0]-140,EGGP[1]],m);
      const fuse=fade(tau,1.5,1);
      if(fuse<1){bodyCell(c,p[0],p[1],1-fuse,1);eggCell(c,EGGP[0],EGGP[1],{nuc:0});}
      if(tau>1.3&&tau<2.6){spark(c,EGGP[0]-80,EGGP[1]-60,t);spark(c,EGGP[0]-80,EGGP[1]+60,t+.3);}
      if(fuse>0&&tau<3){const q=lerpP(p,EGGP,fuse);eggCell(c,EGGP[0],EGGP[1],{nuc:0,a:fuse});nucleus(c,q[0],q[1],1);}
      if(tau>=3){const n=tau<3.8?2:tau<4.6?4:8;embryo(c,EGGP[0],EGGP[1],n);}
      cpill(c,tau<1.4?P('通電讓細胞融合','Electricity fuses the cells'):tau<3?P('細胞核進入卵','The nucleus enters the egg'):P('分裂成胚胎','Dividing into an embryo'),EGGP[0],EGGP[1]+102,{color:C.yellow,active:tau>=3});}
    return;}
  if(k===4){const u=smooth(fade(tau,.4,2.2)),q=bez(EGGP,[700,520],belly,u);
    if(u<1)embryo(c,q[0],q[1],8,1);
    if(u>.95){glow(c,belly[0],belly[1],60,C.cyan,.6);pulse(c,belly[0],belly[1],t,C.cyan,20);}
    cpill(c,P('胚胎放進子宮','Embryo into the womb'),belly[0],SY+SH+96,{color:C.cyan,maxX:944});
    return;}
  // k === 5: Dolly is born to the surrogate; compare faces
  const a=fade(tau,0,1),lr=fitRect('lamb_dolly.png',700,330,220,200);drawIn(c,'lamb_dolly.png',lr,{alpha:a});
  c.save();c.globalAlpha=a;text(c,P('桃莉','Dolly'),lr.x+lr.w/2,lr.y+lr.h+32,24,C.yellow,'center');c.restore();
  arrow(c,belly[0],SY+SH+84,lr.x+lr.w*.55,lr.y+6,rgba(C.cyan,.7*a),3);
  const f=fade(tau,1,.8);c.save();c.globalAlpha=f;
  faceCompare(c,0,t);c.restore();
}
const FACE={'sheep_white_face.png':[.84,.2],'sheep_black_face_egg.png':[.84,.24],'sheep_black_face_surrogate.png':[.85,.25],'lamb_dolly.png':[.8,.18]};
function face(c,file,cx,cy,r,col){const im=pic(AI+file);c.save();c.beginPath();c.arc(cx,cy,r,0,TAU);c.clip();c.fillStyle='#10261f';c.fillRect(cx-r,cy-r,2*r,2*r);
  if(im){const [fx,fy]=FACE[file],W=im.naturalWidth,H=im.naturalHeight,sd=W*.32;c.drawImage(im,fx*W-sd/2,fy*H-sd/2,sd,sd,cx-r,cy-r,2*r,2*r);}c.restore();circle(c,cx,cy,r,null,col,4);}
function sign(c,x,y,same,col){line(c,[[x-14,y-6],[x+14,y-6]],col,4);line(c,[[x-14,y+6],[x+14,y+6]],col,4);if(!same)line(c,[[x+9,y-16],[x-9,y+16]],col,4);}
// The face of sheep i beside Dolly's face (left part of the lab area).
function faceCompare(c,i,t,y=418,r=58,x0=110,x1=290){const sh=SHEEP[i],same=i===0,col=same?C.yellow:C.orange,xm=(x0+x1)/2;
  face(c,sh.file,x0,y,r,sh.col);face(c,'lamb_dolly.png',x1,y,r,C.yellow);sign(c,xm,y,same,col);
  text(c,sh.name,x0,y+r+30,22,C.white,'center');text(c,P('桃莉','Dolly'),x1,y+r+30,22,C.yellow,'center');
  pulse(c,x0,y,t,same?C.yellow:sh.col,r-4);pulse(c,x1,y,t+.4,C.yellow,r-4);
  cpill(c,same?P('一樣是白臉','Both white-faced'):P('臉的顏色不一樣','Different faces'),xm,y+r+40,{color:col,active:same});}
// who does Dolly take after
const GIFT=[{what:P('細胞核：遺傳物質','The nucleus (DNA)'),looks:P('決定長相：會','Sets her looks: yes'),col:C.yellow,w:9},
 {what:P('卵細胞的細胞質','Egg cytoplasm'),looks:P('決定長相：幾乎不會','Sets her looks: hardly'),col:EGG,w:4},
 {what:P('子宮：長大的地方','A womb to grow in'),looks:P('決定長相：不會','Sets her looks: no'),col:C.cyan,w:4}];
const WHO_SHORT=[P('白臉羊','White-faced'),P('黑臉羊（卵）','Egg donor'),P('代理孕母','Surrogate'),P('結論','Conclusion')];
const WHO_TEXT=[
 P('白臉羊給了桃莉細胞核。遺傳物質主要在細胞核裡，所以桃莉的性狀，幾乎都跟白臉羊一樣，包括白色的臉。','The white-faced ewe gave Dolly the nucleus. Genetic material is mainly in the nucleus, so nearly all of Dolly\'s traits match the white-faced ewe, including her white face.'),
 P('黑臉羊給了去核的卵，也就是卵的細胞質。補充：細胞質裡的粒線體有少量 DNA，所以桃莉和白臉羊並不是百分之百相同。','A black-faced ewe gave the egg with its nucleus removed, that is, the egg\'s cytoplasm. Extra: mitochondria in the cytoplasm hold a little DNA, so Dolly and the white-faced ewe are not 100% identical.'),
 P('代理孕母只提供讓胚胎長大的子宮，沒有給桃莉任何遺傳物質。','The surrogate only gave a womb for the embryo to grow in; she gave Dolly no genetic material.'),
 P('複製沒有精子和卵結合，屬於無性生殖。研究人員做了 277 次細胞核移植，只有桃莉一隻順利出生。','Cloning involves no union of sperm and egg, so it is asexual reproduction. The team carried out 277 nuclear transfers, and only Dolly was born.')];
function drawWho(c,s,t){
  const {k}=stageClock(s,t,4,6);s.shown=k;const hi=k===3?[0]:[k];
  drawSheepRow(c,k,t,hi);SHEEP.forEach((sh,i)=>D.hit(SX[i]-6,SY-6,SW+12,SH+80,'phase',i));
  const lr=fitRect('lamb_dolly.png',400,404,160,170);drawIn(c,'lamb_dolly.png',lr);text(c,P('桃莉','Dolly'),lr.x+lr.w+10,lr.y+lr.h-8,24,C.yellow);
  GIFT.forEach((g,i)=>{const on=k===i||(k===3&&i===0),x0=SX[i]+SW/2,y0=SY+SH+86,end=[[lr.x+24,lr.y+14],[lr.x+lr.w/2,lr.y],[lr.x+lr.w-24,lr.y+14]][i];
    c.save();c.globalAlpha=on?1:.35;
    D.round(c,SX[i]+6,y0,SW-12,74,12,'rgba(11,26,21,.75)',g.col);
    text(c,g.what,x0,y0+30,22,g.col,'center');text(c,g.looks,x0,y0+60,22,C.white,'center');
    arrow(c,i===1?end[0]:i===0?SX[0]+SW-24:SX[2]+40,y0+80,end[0],end[1]-4,g.col,g.w*.6+1);
    c.restore();});
  faceCompare(c,k===3?0:k,t,452,44,112,262);
  if(k===3){panel(c,640,404,300,172);
    const h=wrap(c,P('複製：沒有精子和卵結合，屬於無性生殖。','Cloning: no sperm meets an egg, so it is asexual reproduction.'),660,440,262,22,C.yellow,30);
    wrap(c,P('277 次細胞核移植，只有桃莉成功出生。','277 nuclear transfers; only Dolly was born.'),660,440+h+10,262,22,C.white,30);}
}
const CLONE_TABS=[P('桃莉怎麼來的','How Dolly was made'),P('桃莉像誰','Who she takes after')];

// ── tabs ───────────────────────────────────────────────────────────────────
const viewAct=(s,k,v)=>{s[k]=v;if(k==='view'){s.phase=-1;s.start=s.elapsed;}if(k==='phase')s.start=s.elapsed;};
const pick=(s)=>s.phase<0?(s.shown||0):s.phase;
const tabs=[
{id:'fermentation',title:P('麵團怎麼長大的？','How does dough rise?'),sub:P('發酵｜傳統生物技術','Fermentation · traditional'),
 hook:P('麵團放著不動，過一段時間竟然變成兩倍大。是誰在裡面吹氣？我們每天吃的醬油、優格，又是誰做出來的？','Left alone for a while, dough grows to twice its size. Who is blowing air into it? And who makes the soy sauce and yogurt we eat every day?'),
 body:P('生物技術：利用生物或生物的產物，來改善人類的生活。先看「麵團發酵」：放大看酵母菌在麵團裡做了什麼；再看「發酵食品」：不同的微生物，做出不同的食物。','Biotechnology means using living things, or what they make, to improve human life. First watch "Rising dough" to see what yeast does inside dough; then "Fermented foods": different microbes make different foods.'),
 reading:P('生物技術：利用生物或生物的產物，來改善人類的生活。發酵和育種利用生物本來就有的能力，是傳統的生物技術；基因轉殖、複製直接處理細胞或遺傳物質，是現代的生物技術。\n\n發酵作用：微生物分解醣等養分，得到能量，同時產生其他物質。酵母菌產生二氧化碳和酒精（麵包、饅頭、釀酒）；乳酸菌產生乳酸（優格、泡菜）；麴菌等黴菌分解蛋白質和澱粉（醬油、味噌）；醋酸菌把酒精變成醋酸（醋）。\n\n想一想：做麵包時，麵團放在溫暖的地方會發得比較快；放進冰箱，幾乎不會膨大。為什麼？','Biotechnology means using living things, or what they make, to improve human life. Fermentation and breeding use abilities organisms already have: traditional biotechnology. Gene transfer and cloning work directly on cells or genetic material: modern biotechnology.\n\nFermentation: microbes break down sugars and other nutrients for energy, making other substances as they do. Yeast makes carbon dioxide and alcohol (bread, steamed buns, wine); lactic acid bacteria make lactic acid (yogurt, pickles); koji and other moulds break down protein and starch (soy sauce, miso); acetic acid bacteria turn alcohol into vinegar.\n\nThink: dough rises faster somewhere warm and hardly at all in the fridge. Why?'),
 closure:P('發酵：微生物分解醣等養分，產生二氧化碳、酒精、乳酸等物質。人類利用酵母菌、乳酸菌、麴菌做出麵包、優格、醬油，這是最古老的生物技術。','Fermentation: microbes break down sugars and other nutrients, giving off carbon dioxide, alcohol, lactic acid and more. Using yeast, lactic acid bacteria and koji mould to make bread, yogurt and soy sauce is the oldest biotechnology.'),
 quiz:[
  {q:P('麵包裡的許多小孔洞，主要是怎麼來的？','Where do most of the little holes in bread come from?'),options:[P('酵母菌發酵產生的二氧化碳','Carbon dioxide made by yeast fermentation'),P('烤的時候水沸騰','Water boiling in the oven'),P('麵粉本來就有洞','Holes already in the flour'),P('乳酸菌產生的乳酸','Lactic acid from lactic acid bacteria')],answer:0,why:P('酵母菌分解醣放出二氧化碳，被麵團包成氣泡，烤好後留下孔洞。','Yeast breaks down sugar and gives off carbon dioxide, trapped as bubbles that become holes when baked.'),hint:P('看「麵團發酵」的第 3、4 步。','Watch steps 3 and 4 of "Rising dough".')},
  {q:P('優格的酸味，主要來自哪一種微生物？','Which microbe mainly gives yogurt its sour taste?'),options:[P('乳酸菌','Lactic acid bacteria'),P('酵母菌','Yeast'),P('麴菌','Koji mould'),P('病毒','A virus')],answer:0,why:P('乳酸菌把牛奶裡的乳糖分解成乳酸，所以優格是酸的。','Lactic acid bacteria turn the lactose in milk into lactic acid, so yogurt is sour.'),hint:P('切到「發酵食品」，點優格。','Switch to "Fermented foods" and tap the yogurt.')},
  {q:P('下列哪一種食物，「沒有」利用發酵製作？','Which food is NOT made by fermentation?'),options:[P('白飯','Plain boiled rice'),P('醬油','Soy sauce'),P('優格','Yogurt'),P('饅頭','Steamed buns')],answer:0,why:P('白飯只是把米煮熟；醬油用麴菌、優格用乳酸菌、饅頭用酵母菌發酵。','Rice is simply cooked; soy sauce uses koji mould, yogurt lactic acid bacteria and steamed buns yeast.'),hint:P('想想哪一個不需要微生物。','Which one needs no microbes?')}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P('觀察','View'),'view',FERM_TABS.map((n,i)=>[i,n])),steps(s.view===1?FOOD_SHORT:DOUGH_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);if(s.view===1){const f=FOODS[k];return{title:P(`${f.name[0]}：${f.microbe[0]}`,`${f.name[1]}: ${f.microbe[1]}`),text:f.note?P(f.text[0]+f.note[0],f.text[1]+' '+f.note[1]):f.text};}return{title:DOUGH_NAMES[k],text:DOUGH_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?drawFoods(c,s,t):drawDough(c,s,t)},
{id:'breeding',title:P('一種菜，六種樣子','One plant, many vegetables'),sub:P('育種｜傳統生物技術','Breeding · traditional'),
 hook:P('高麗菜、青花菜、花椰菜、球莖甘藍、羽衣甘藍，長得一點都不像，其實都是同一種植物。牠們的祖先長什麼樣子？人們又是怎麼把它變成這麼多種菜的？','Cabbage, broccoli, cauliflower, kohlrabi and kale look nothing alike, yet they are all one species. What did their ancestor look like, and how did people turn it into so many vegetables?'),
 body:P('先看「同一個祖先」：野生甘藍的哪個部位被挑大了；再看「一代一代挑」：人們怎麼一代一代留下想要的植株。','First, "One ancestor": which part of wild cabbage was bred bigger. Then "Generation by generation": how people kept the plants they wanted, one generation after another.'),
 reading:P('育種：人類挑選具有想要性狀的個體來繁殖，一代一代累積，培育出新的品種。同一種生物的個體之間，本來就有差異（變異），育種就是把想要的差異留下來。\n\n高麗菜、青花菜、花椰菜、球莖甘藍、羽衣甘藍，都是「甘藍」這一種植物的品種，可以互相交配。另一種常見的方法是雜交育種：讓兩個各有優點的品種交配，希望下一代同時具有兩者的優點，臺灣的許多稻米、水果新品種就是這樣培育的。\n\n補充：由人類挑選、決定留下哪些性狀，也叫做人擇。','Breeding: people choose individuals with the traits they want and breed them, generation after generation, to create new varieties. Individuals of one species already differ (variation); breeding keeps the differences people want.\n\nCabbage, broccoli, cauliflower, kohlrabi and kale are all varieties of one species, Brassica oleracea, and can interbreed. Another common method is cross-breeding: crossing two varieties with different strengths in the hope that the offspring have both. Many of Taiwan\'s new rice and fruit varieties were bred this way.\n\nExtra: people choosing which traits to keep is also called artificial selection.'),
 closure:P('育種是從同一種生物本來就有的差異中，一代一代挑出想要的性狀，培育出新品種；不是在實驗室裡直接改動基因。','Breeding picks out wanted traits, generation after generation, from the differences already present in one species, producing new varieties; it does not alter genes directly in a lab.'),
 quiz:[
  {q:P('高麗菜和青花菜的關係是？','How are cabbage and broccoli related?'),options:[P('同一種植物的不同品種','Different varieties of one species'),P('完全不同的物種','Completely different species'),P('青花菜是高麗菜開的花','Broccoli is the flower of a cabbage'),P('青花菜是生病的高麗菜','Broccoli is a diseased cabbage')],answer:0,why:P('它們都是「甘藍」這一種植物，人們挑選不同的部位，育成不同的品種。','Both are Brassica oleracea; selecting different parts gave different varieties.'),hint:P('看「同一個祖先」最後一步。','See the last step of "One ancestor".')},
  {q:P('球莖甘藍，我們吃的是哪個部位？','Which part of kohlrabi do we eat?'),options:[P('膨大的莖','A swollen stem'),P('根','The root'),P('花','The flowers'),P('果實','The fruit')],answer:0,why:P('人們一代一代挑莖粗的植株，莖膨大成球，就是球莖甘藍。','Picking thick-stemmed plants generation after generation swelled the stem into kohlrabi.'),hint:P('看「一代一代挑」。','Watch "Generation by generation".')},
  {q:P('想用育種培育出更甜的西瓜，應該怎麼做？','How would you breed sweeter watermelons?'),options:[P('每一代都挑最甜的西瓜留種，再種下一代','Each generation, save seeds from the sweetest melons and sow them'),P('每天替西瓜澆糖水','Water the plants with sugar water every day'),P('把糖水注射進西瓜','Inject sugar water into the melons'),P('把西瓜放在冰箱裡','Keep the melons in the fridge')],answer:0,why:P('澆糖水、注射糖水都不會遺傳；育種是挑選本身就比較甜的西瓜，讓牠們的種子繁殖下去。','Sugar water is not inherited; breeding keeps melons that are naturally sweeter and grows their seeds.'),hint:P('哪一種改變會傳給下一代？','Which change can be passed to the next generation?')}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P('觀察','View'),'view',BREED_TABS.map((n,i)=>[i,n])),steps(s.view===1?SEL_SHORT:FAM_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:GEN_LABEL[k],text:SEL_TEXT[k]}:{title:FAM_NAMES[k],text:FAM_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?drawSelect(c,s,t):drawFamily(c,s,t)},
{id:'gene-transfer',title:P('細菌也能做藥？','Bacteria that make medicine?'),sub:P('基因轉殖｜現代生物技術','Gene transfer · modern'),
 hook:P('有些糖尿病患者每天都要注射胰島素。以前的胰島素要從豬、牛的胰臟一點一點取出來；現在，工廠裡的細菌就能大量製造「人的」胰島素。細菌怎麼會做人的東西？','Some people with diabetes inject insulin every day. It used to be extracted bit by bit from pig and cattle pancreases; now bacteria in factories make human insulin in bulk. How can bacteria make something human?'),
 body:P('基因轉殖：把某種生物的基因，送進另一種生物的細胞裡，讓它表現出新的性狀。先看「胰島素」和「螢光魚」兩個例子，再看「影響與規範」。','Gene transfer puts a gene from one kind of organism into the cells of another, giving it a new trait. Watch two examples, "Insulin" and "Glowing fish", then "Impacts and rules".'),
 reading:P('基因轉殖（也叫基因改造）：把某種生物的基因，送進另一種生物的細胞裡，讓它表現出新的性狀。這樣得到的生物，叫做基因轉殖生物（基因改造生物）。\n\n胰島素：胰臟分泌的激素，能讓血糖下降。把人的胰島素基因接進細菌的質體，細菌就能照著這個基因做出人的胰島素，大量繁殖後大量生產。\n\n螢光魚：綠色螢光基因來自水母，紅色螢光基因來自珊瑚。2003 年，臺灣是全世界第一個開放基因轉殖螢光魚當觀賞魚販售的地方（最早上市的是臺灣大學團隊研發的螢光青鱂魚，圖中畫的是斑馬魚）。\n\n其他例子：轉入細菌抗蟲基因的玉米、棉花；能產生 β-胡蘿蔔素的黃金米。\n\n想一想：螢光魚如果被放生到河裡，可能會發生什麼事？','Gene transfer (genetic modification) puts a gene from one organism into the cells of another, giving it a new trait. The result is a transgenic (genetically modified) organism.\n\nInsulin is a hormone from the pancreas that lowers blood sugar. With the human insulin gene joined into a plasmid, bacteria follow that gene to make human insulin, and multiplying bacteria make a lot of it.\n\nGlowing fish: the green glow gene comes from a jellyfish, the red one from a coral. In 2003 Taiwan became the first place in the world to allow transgenic glowing fish to be sold as pets (the first on sale were glowing medaka developed at National Taiwan University; the pictures show zebrafish).\n\nOther examples: maize and cotton with a bacterial pest-resistance gene; Golden Rice, which makes beta-carotene.\n\nThink: what might happen if glowing fish were released into a river?'),
 closure:P('基因轉殖：把一種生物的基因送進另一種生物，讓它表現新的性狀。細菌得到人的胰島素基因，就做出人的胰島素；魚得到水母的螢光基因，就會發光。它有好處也有疑慮，臺灣用審查、標示等規範來管理。','Gene transfer moves a gene from one organism into another so it shows a new trait: bacteria with the human insulin gene make human insulin; fish with a jellyfish glow gene glow. It brings benefits and concerns, and Taiwan manages it with reviews, labels and other rules.'),
 quiz:[
  {q:P('細菌為什麼能製造人的胰島素？','Why can bacteria make human insulin?'),options:[P('細菌被送進了人的胰島素基因','They were given the human insulin gene'),P('細菌吃了人的胰臟','They ate a human pancreas'),P('細菌本來就會做','They always could'),P('細菌變成了人的細胞','They turned into human cells')],answer:0,why:P('人的胰島素基因接進質體、放進細菌，細菌照著基因做出胰島素；細菌還是細菌。','The human gene went into the bacteria on a plasmid, and they follow it to make insulin; they are still bacteria.'),hint:P('看「胰島素」第 3 步。','Watch step 3 of "Insulin".')},
  {q:P('螢光魚的下一代也會發光，最主要的原因是？','Why do the young of glowing fish glow too?'),options:[P('螢光基因也在生殖細胞裡，會遺傳','The glow gene is in the germ cells too, so it is inherited'),P('小魚吃了發光的飼料','The young eat glowing food'),P('水裡加了螢光劑','The water contains a glowing dye'),P('照藍光時，所有魚都會發光','All fish glow under blue light')],answer:0,why:P('螢光基因在每個細胞裡，包括生殖細胞，所以會隨精子和卵傳給下一代。','The gene is in every cell, germ cells included, so it passes on through sperm and eggs.'),hint:P('看「螢光魚」最後一步。','See the last step of "Glowing fish".')},
  {q:P('下列哪一項屬於基因轉殖？','Which of these is gene transfer?'),options:[P('把水母的螢光基因送進斑馬魚','Putting a jellyfish glow gene into zebrafish'),P('用酵母菌做麵包','Making bread with yeast'),P('挑最甜的西瓜留種','Saving seeds from the sweetest melons'),P('用乳酸菌做優格','Making yogurt with lactic acid bacteria')],answer:0,why:P('只有螢光魚是把一種生物的基因送進另一種生物；其他是發酵和育種。','Only the glowing fish involves moving a gene between organisms; the others are fermentation and breeding.'),hint:P('哪一個把「基因」搬到另一種生物裡？','Which one moves a gene into another organism?')}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P('觀察','View'),'view',GENE_TABS.map((n,i)=>[i,n])),steps(s.view===2?IMPACT_SHORT:s.view===1?FISH_SHORT:INS_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===2?{title:IMPACT_SHORT[k],text:IMPACT_TEXT[k]}:s.view===1?{title:FISH_NAMES[k],text:FISH_TEXT[k]}:{title:INS_NAMES[k],text:INS_TEXT[k]};},
 draw:(c,s,t)=>s.view===2?drawImpact(c,s,t):s.view===1?drawFish(c,s,t):drawInsulin(c,s,t)},
{id:'cloning',title:P('桃莉羊像誰？','Who does Dolly look like?'),sub:P('複製｜現代生物技術','Cloning · modern'),
 hook:P('桃莉羊有三個「媽媽」：一隻給細胞核、一隻給卵、一隻替牠懷孕。給卵的和懷孕的都是黑臉羊，桃莉生下來卻是白臉。為什麼？','Dolly had three "mothers": one gave a nucleus, one gave an egg, one carried her. The egg donor and the surrogate both had black faces, yet Dolly was born white-faced. Why?'),
 body:P('先看「桃莉怎麼來的」：細胞核怎麼搬進卵細胞；再看「桃莉像誰」：三隻羊各給了桃莉什麼。','First watch "How Dolly was made": how a nucleus was moved into an egg. Then "Who she takes after": what each of the three ewes gave Dolly.'),
 reading:P('1996 年，英國羅斯林研究所的科學家，把白臉羊（芬蘭多賽特羊）乳腺細胞的細胞核，放進黑臉羊（蘇格蘭黑臉羊）去核的卵細胞，培養成胚胎，再放進另一隻黑臉羊的子宮，生下了桃莉。桃莉是第一隻用成年動物的體細胞複製出來的哺乳動物。\n\n遺傳物質主要在細胞核裡，所以桃莉的性狀幾乎和白臉羊一樣。複製沒有精子和卵結合，屬於無性生殖。\n\n複製技術可以用來繁殖優良的家畜、保存瀕臨絕種的動物；但成功率很低（桃莉之前做了 277 次細胞核移植），複製動物也可能有健康問題，還有倫理上的爭議。臺灣的法律禁止用複製（無性生殖）的方式生育人類。','In 1996 scientists at the Roslin Institute in Britain put the nucleus of an udder cell from a white-faced Finn Dorset ewe into an egg, with its own nucleus removed, from a black-faced Scottish Blackface ewe. The embryo was placed in another black-faced ewe, who gave birth to Dolly, the first mammal cloned from an adult body cell.\n\nGenetic material is mainly in the nucleus, so Dolly\'s traits match the white-faced ewe almost exactly. Cloning involves no union of sperm and egg: it is asexual reproduction.\n\nCloning can multiply prize livestock or help save endangered animals, but success rates are low (277 nuclear transfers led to Dolly), clones may have health problems, and it raises ethical questions. Taiwan\'s law forbids producing a human by cloning (asexual reproduction).'),
 closure:P('複製：把體細胞的細胞核放進去核的卵細胞，培養成胚胎，再由代理孕母生下。遺傳物質主要在細胞核裡，所以複製出來的動物，性狀和提供細胞核的動物幾乎一樣。','Cloning: a body-cell nucleus is put into an egg whose nucleus was removed; the embryo grows and a surrogate gives birth. Genetic material is mainly in the nucleus, so the clone is almost identical to the nucleus donor.'),
 quiz:[
  {q:P('桃莉羊長得最像哪一隻羊？','Which ewe does Dolly look most like?'),options:[P('提供細胞核的白臉羊','The white-faced ewe that gave the nucleus'),P('提供卵細胞的黑臉羊','The black-faced ewe that gave the egg'),P('代理孕母','The surrogate mother'),P('三隻羊的平均','An average of all three')],answer:0,why:P('桃莉的細胞核來自白臉羊，所以長得像白臉羊。','Dolly\'s nucleus came from the white-faced ewe, so she looks like her.'),hint:P('看「桃莉怎麼來的」最後一步。','See the last step of "How Dolly was made".')},
  {q:P('為什麼桃莉像提供細胞核的那隻羊？','Why does Dolly resemble the ewe that gave the nucleus?'),options:[P('遺傳物質主要在細胞核裡','Genetic material is mainly in the nucleus'),P('卵的細胞質決定長相','The egg cytoplasm decides looks'),P('代理孕母的子宮決定長相','The surrogate\'s womb decides looks'),P('細胞核只負責細胞分裂','The nucleus only handles cell division')],answer:0,why:P('細胞核裡有完整的遺傳物質，決定了桃莉的性狀。','The nucleus holds the complete genetic material that sets Dolly\'s traits.'),hint:P('切到「桃莉像誰」。','Switch to "Who she takes after".')},
  {q:P('複製羊的過程，屬於哪一種生殖方式？','What kind of reproduction is cloning a sheep?'),options:[P('無性生殖：沒有精子和卵結合','Asexual: no sperm meets an egg'),P('有性生殖：精子和卵結合','Sexual: a sperm fertilizes an egg'),P('不算是生殖','It is not reproduction')],answer:0,why:P('桃莉的細胞核來自一隻羊的體細胞，沒有精子和卵結合，屬於無性生殖。','Dolly\'s nucleus came from one ewe\'s body cell, with no sperm and egg uniting: asexual reproduction.'),hint:P('桃莉的遺傳物質來自幾隻羊？','How many ewes did Dolly\'s genetic material come from?')}],
 sources:[],init:()=>({running:true,view:0,phase:-1,start:0}),
 controls:s=>[choice(P('觀察','View'),'view',CLONE_TABS.map((n,i)=>[i,n])),steps(s.view===1?WHO_SHORT:DOLLY_SHORT)],
 act:viewAct,
 explain:s=>{const k=pick(s);return s.view===1?{title:WHO_SHORT[k],text:WHO_TEXT[k]}:{title:DOLLY_NAMES[k],text:DOLLY_TEXT[k]};},
 draw:(c,s,t)=>s.view===1?drawWho(c,s,t):drawDolly(c,s,t)}
];
B.register({id:'biotechnology',title:P('生物技術：借用生命的能力','Biotechnology: using living systems'),subtitle:P('從麵包、蔬菜，到螢光魚和桃莉羊','From bread and vegetables to glowing fish and Dolly the sheep'),cover:'assets/covers/biology_biotechnology_1019_v1.jpg',
 assetDir:'assets/biology/genetics_originals_1010_v1/',family:P('遺傳與生物技術','Inheritance and biotechnology'),bookName:P('遺傳','Inheritance'),tabs});
})();

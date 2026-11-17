/* Teacher-authorized change: only the outdoor light-exposure shot.
 * Same plant/foil, same six-second action and sway; only dawn/dusk fades slow down.
 * AI background + deterministic time-lapse simulation, never documentary footage.
 * 2026-11-17: flowerpot + soil are a rigid layer (students saw the pot wobble); only stem/leaves sway. */
(function(root,factory){
 const base=typeof module==='object'&&module.exports?require('./photosynthesis_teacher_lab_1011_v1.js'):root.PhotosynthesisDraw;
 const out=factory(base);
 if(typeof module==='object'&&module.exports)module.exports=out;else root.PhotosynthesisDraw=out;
})(typeof window==='object'?window:globalThis,function(base){'use strict';
 const W=960,H=620,SW=384,SH=576,COLS=10,ROWS=22,cache=new WeakMap();
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),tr=(l,z,e)=>l==='zh'?z:e;
 const smooth=(a,b,n)=>{const p=clamp((n-a)/(b-a));return p*p*(3-2*p);};
 function lighting(progress){
  // Seven complete 24-hour cycles, starting at 08:00. The sun is never drawn.
  const p=clamp(progress),phase=(p*7+1/3)%1,elevation=Math.sin((phase-.25)*Math.PI*2);
  // Stretch each original dawn/dusk fade to twice its phase span, without slowing
  // the seven-day clock, wind motion, solar direction, or the six-second action.
  const dawnCenter=.25+(Math.asin(-.12)+Math.asin(.32))/(Math.PI*4),fadeCenter=phase<.5?dawnCenter:1-dawnCenter;
  const fadePhase=fadeCenter+(phase-fadeCenter)/2;
  const daylight=smooth(-.12,.32,Math.sin((fadePhase-.25)*Math.PI*2)),direct=smooth(0,.16,elevation);
  const dayPhase=clamp((phase-.25)*2),lightX=Math.cos(dayPhase*Math.PI),height=Math.max(0,elevation);
  return {phase,dayPhase,day:Math.min(7,Math.floor(p*7)+1),elevation,daylight,direct,lightX,
   shadowShear:lightX*(.18+1.16*(1-height)),shadowDepth:.045+.19*(1-height),
   shadowOpacity:.58*direct,warmth:direct*(1-smooth(.12,.75,height)),night:elevation<0};
 }
 function surface(c,images,w,h){
  const cv=images.canvasFactory?images.canvasFactory(w,h):typeof document!=='undefined'?document.createElement('canvas'):new OffscreenCanvas(w,h);
  cv.width=w;cv.height=h;return cv;
 }
 // Byte-equivalent leaf outline from the approved plant master (1024 × 1536).
 function samplePath(c){c.beginPath();c.moveTo(394,437);c.bezierCurveTo(377,407,379,360,347,337);c.bezierCurveTo(292,306,231,316,177,357);c.bezierCurveTo(105,412,71,493,67,579);c.bezierCurveTo(59,672,89,753,146,823);c.bezierCurveTo(161,859,183,891,188,916);c.bezierCurveTo(209,859,284,837,354,801);c.bezierCurveTo(438,755,483,672,493,586);c.bezierCurveTo(502,522,476,476,433,458);c.bezierCurveTo(412,450,402,446,394,437);c.closePath();}
 // 2026-11-17 pot fix: the potted-plant picture is split once into two layers.
 //  · foliage = stem + leaves (+ foil), the only layer that goes through the sway mesh
 //  · pot     = flowerpot + soil, drawn unwarped at a fixed offset, so it can never wobble.
 // The pot hidden behind the overhanging leaf / stem base is filled in from neighbouring pot pixels.
 const POT_TOP=330,STEM_X=198,STEM_Y=382;
 function splitLayers(c,images,raw){
  const rc=raw.getContext('2d'),src=rc.getImageData(0,0,SW,SH),d=src.data,fol=rc.createImageData(SW,SH),pot=rc.createImageData(SW,SH),F=fol.data,P=pot.data;
  // Plant tissue = greener than red AND clearly greener than blue (yellow-green stem included);
  // terracotta, dark soil and white perlite all fail one of the two tests.
  const g0=new Float32Array(SW*SH),G=new Float32Array(SW*SH);
  for(let y=POT_TOP-2;y<SH;y++)for(let x=0;x<SW;x++){const i=(y*SW+x)*4;g0[y*SW+x]=d[i+3]<8?0:smooth(-4,8,d[i+1]-d[i])*smooth(10,30,d[i+1]-d[i+2]);}
  // Grow the mask by one pixel so antialiased leaf/stem fringes leave the pot layer too.
  for(let y=POT_TOP-1;y<SH-1;y++)for(let x=1;x<SW-1;x++){let m=0;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)m=Math.max(m,g0[(y+yy)*SW+x+xx]);G[y*SW+x]=Math.min(1,m*1.6);}
  const avg=(row,x0,x1,k)=>{let s=0,n=0;for(let x=x0;x<=x1;x++)if(G[row/4+x]===0&&d[row+x*4+3]>128){s+=d[row+x*4+k];n++;}return n?s/n:-1;};
  for(let y=0;y<SH;y++){
   const row=y*SW*4,gr=y*SW;let xl=-1,xo=-1,last=-1;
   if(y>=POT_TOP){// pot span of this row: first/last run of opaque pot-or-soil pixels
    for(let x=0,run=0;x<SW;x++){const i=row+x*4,ok=d[i+3]>128&&G[gr+x]===0;run=ok?run+1:0;if(run>=4){if(xl<0)xl=x-3;xo=x;}if(d[i+3]>40)last=x;}
   }
   // The rim is left-right symmetric: where a leaf hides its right end, mirror the left end.
   const xr=xl<0?-1:Math.max(xo,Math.min(2*STEM_X-xl,last));
   for(let x=0;x<SW;x++){const i=row+x*4,a=d[i+3];if(!a)continue;
    const inPot=xl>=0&&x>=xl&&x<=xr,m=y<POT_TOP?1:inPot?G[gr+x]:(a>200||g0[gr+x]>0?1:0),top=1-smooth(POT_TOP-4,POT_TOP+4,y),w=Math.max(m,top);
    F[i]=d[i];F[i+1]=d[i+1];F[i+2]=d[i+2];F[i+3]=Math.round(a*w);
    if(y<POT_TOP||m>=1&&!inPot)continue;
    if(m<=0){P[i]=d[i];P[i+1]=d[i+1];P[i+2]=d[i+2];P[i+3]=a>=240?255:a;continue;}// near-opaque → opaque: no ground shadow shows through the pot
    // nearest real pot pixels to the left and right in this row (averaged over a few pixels)
    let l=x-1,r=x+1;while(l>=xl&&G[gr+l]>0)l--;while(r<=xo&&G[gr+r]>0)r++;
    const hasL=l>=xl,hasR=r<=xo,t=hasL&&hasR?(x-l)/(r-l):hasL?0:1;
    for(let k=0;k<3;k++){let A=hasL?avg(row,Math.max(xl,l-5),l,k):-1,B=hasR?avg(row,r,Math.min(xo,r+5),k):-1;if(A<0)A=B;if(B<0)B=A;const fill=A+(B-A)*t;P[i+k]=Math.round(d[i+k]+(fill-d[i+k])*m);}
    P[i+3]=Math.max(a,Math.round(255*Math.min(1,m*3)));
   }
  }
  const bare=surface(c,images,SW,SH),potCv=surface(c,images,SW,SH);bare.getContext('2d').putImageData(fol,0,0);potCv.getContext('2d').putImageData(pot,0,0);
  return {bare,pot:potCv};
 }
 function foilFront(tc,amount){
  tc.save();samplePath(tc);tc.clip();tc.beginPath();tc.rect(60,512,440*clamp(amount),219);tc.clip();
  const g=tc.createLinearGradient(60,512,500,731);
  [[0,'#788682'],[.22,'#e3e9e5'],[.47,'#8d9a95'],[.73,'#edf2ee'],[1,'#a5b4aa']].forEach(([p,col])=>g.addColorStop(p,col));
  tc.fillStyle=g;tc.fillRect(60,512,440,219);
  for(let i=0;i<29;i++){tc.beginPath();tc.moveTo(60+i*16,513);tc.lineTo(72+i*14,603);tc.lineTo(60+i*16,730);tc.strokeStyle=i%2?'rgba(242,247,239,.5)':'rgba(66,89,75,.28)';tc.lineWidth=1.2;tc.stroke();}tc.restore();
 }
 // Foliage texture with the foil in a given state. front/back: 0..1, slide: back-foil offset (master px),
 // noLeaf: the sample leaf has been removed. Foil is baked in BEFORE deformation: it cannot detach from the leaf.
 function paintFoliage(target,bare,front=1,back=1,noLeaf=false,slide=0){
  const tc=target.getContext('2d');tc.setTransform(1,0,0,1,0,0);tc.clearRect(0,0,SW,SH);tc.scale(SW/1024,SH/1536);
  if(back>0&&!noLeaf){tc.globalAlpha=clamp(back);tc.fillStyle='#718278';tc.beginPath();tc.roundRect(55+slide,510,450,223,8);tc.fill();tc.globalAlpha=1;}
  tc.drawImage(bare,0,0,1024,1536);
  if(noLeaf){tc.save();tc.globalCompositeOperation='destination-out';tc.translate(280,620);tc.scale(1.035,1.035);tc.translate(-280,-620);samplePath(tc);tc.fillStyle='#fff';tc.fill();tc.restore();}
  else if(front>0)foilFront(tc,front);
  tc.setTransform(1,0,0,1,0,0);return target;
 }
 function prepare(c,images){
  const im=images.pottedPlant;if(!im)return null;
  if(cache.has(im))return cache.get(im);
  const raw=surface(c,images,SW,SH),rc=raw.getContext('2d');rc.drawImage(im,0,0,SW,SH);
  let layers=null;try{layers=splitLayers(c,images,raw);}catch(e){layers=null;}
  // Fallback (pixel access blocked, e.g. file://): old behaviour, pot = rows below 455.
  const split=!!layers,bare=split?layers.bare:raw,pot=split?layers.pot:null;
  const texture=paintFoliage(surface(c,images,SW,SH),bare,1,1,false,0);
  const item={texture,bare,pot,split,dyn:surface(c,images,SW,SH),fol:surface(c,images,SW+32,SH+16),plant:surface(c,images,SW+32,SH+16),shadow:surface(c,images,SW+32,SH+16)};cache.set(im,item);return item;
 }
 // Texture variant for the foil-wrapping / leaf-removal shots (reuses one scratch canvas).
 function variant(item,front,back,noLeaf,slide){return paintFoliage(item.dyn,item.bare,front,back,noLeaf,slide||0);}
 function pose(x,y,t,amp=1){
  // Sway is anchored where the stem enters the soil: zero displacement there, growing up the flexible stem.
  // The flowerpot and soil are a separate rigid layer and never pass through this function.
  const flex=clamp((STEM_Y-y)/(STEM_Y-50)),sway=Math.sin(t*2.15)+.37*Math.sin(t*4.37+.7);
  let dx=22*Math.pow(flex,1.7)*sway,dy=1.6*flex*Math.sin(t*3.3);
  // Leaf flutter keeps its original strength, but fades to zero around the stem base.
  const leafFlex=clamp((455-y)/405)*smooth(8,64,Math.hypot(x-STEM_X,y-STEM_Y));
  const leaves=[[105,230,1.7],[279,241,3.6],[174,76,.4],[73,327,5.1],[291,347,2.5]];
  for(const [lx,ly,phase] of leaves){const influence=Math.exp(-((x-lx)**2/3000+(y-ly)**2/4200))*leafFlex;
   dx+=influence*5.5*Math.sin(t*6.3+phase);dy+=influence*7*Math.sin(t*4.8+phase);
  }
  return {x:x+dx*amp+16,y:y+dy*amp+8};
 }
 function triangle(c,im,s0,s1,s2,d0,d1,d2){
  const sx1=s1.x-s0.x,sy1=s1.y-s0.y,sx2=s2.x-s0.x,sy2=s2.y-s0.y,det=sx1*sy2-sx2*sy1;
  const dx1=d1.x-d0.x,dy1=d1.y-d0.y,dx2=d2.x-d0.x,dy2=d2.y-d0.y;
  const a=(dx1*sy2-dx2*sy1)/det,b=(dy1*sy2-dy2*sy1)/det,cc=(sx1*dx2-sx2*dx1)/det,d=(sx1*dy2-sx2*dy1)/det;
  const mx=(d0.x+d1.x+d2.x)/3,my=(d0.y+d1.y+d2.y)/3;
  c.save();c.beginPath();for(const [i,p] of [d0,d1,d2].entries()){const x=mx+(p.x-mx)*1.014,y=my+(p.y-my)*1.014;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.clip();
  c.transform(a,b,cc,d,d0.x-a*s0.x-cc*s0.y,d0.y-b*s0.x-d*s0.y);
  const minX=Math.max(0,Math.floor(Math.min(s0.x,s1.x,s2.x))-1),minY=Math.max(0,Math.floor(Math.min(s0.y,s1.y,s2.y))-1),maxX=Math.min(SW,Math.ceil(Math.max(s0.x,s1.x,s2.x))+1),maxY=Math.min(SH,Math.ceil(Math.max(s0.y,s1.y,s2.y))+1);
  c.drawImage(im,minX,minY,maxX-minX,maxY-minY,minX,minY,maxX-minX,maxY-minY);c.restore();
 }
 function applyLight(pc,light,t,moving){
  const {direct,dayPhase,lightX,warmth}=light;
  pc.save();pc.globalCompositeOperation='source-atop';
  // Light-facing side brightens; the opposite side darkens, including the flowerpot.
  const shade=pc.createLinearGradient(0,0,SW+32,0),right=lightX>=0;
  const lit=`rgba(255,${Math.round(234-35*warmth)},151,${.11*direct})`,dark=`rgba(14,34,25,${.22*direct*Math.abs(lightX)})`;
  shade.addColorStop(0,right?dark:lit);shade.addColorStop(.5,'rgba(255,234,177,0)');shade.addColorStop(1,right?lit:dark);pc.fillStyle=shade;pc.fillRect(0,0,SW+32,SH+16);
  // Soft patches on the surfaces, not cartoon rays drawn over them. They drift with the sun on everything,
  // but only the ones on the foliage shimmer with the breeze (moving=true): the pot must look rock-steady.
  for(let i=0;i<4;i++){const xx=60+dayPhase*260+i*45,yy=75+i*80+(moving?10*Math.sin(t*1.2+i):0),g=pc.createRadialGradient(xx,yy,1,xx,yy,60);g.addColorStop(0,`rgba(255,241,183,${.16*direct})`);g.addColorStop(1,'rgba(255,241,183,0)');pc.fillStyle=g;pc.fillRect(xx-60,yy-60,120,120);}pc.restore();
 }
 function plantFrame(item,t,light,o){
  const tex=o&&o.texture||item.texture,amp=o&&o.amp!=null?o.amp:1,limit=item.split?400:455;
  const pc=item.plant.getContext('2d');pc.clearRect(0,0,item.plant.width,item.plant.height);
  // Rigid flowerpot + soil first, unwarped, always at the same pixels; its lighting ignores the sway clock.
  if(item.split){pc.drawImage(item.pot,16,8);if(light)applyLight(pc,light,0,false);}
  const fc=item.split?item.fol.getContext('2d'):pc;if(item.split)fc.clearRect(0,0,item.fol.width,item.fol.height);
  const points=[];for(let row=0;row<=ROWS;row++){const line=[];for(let col=0;col<=COLS;col++){const x=col*SW/COLS,y=row*SH/ROWS;line.push({s:{x,y},d:pose(x,y,t,amp)});}points.push(line);}
  for(let row=0;row<ROWS;row++)if(row*SH/ROWS<limit)for(let col=0;col<COLS;col++){const a=points[row][col],b=points[row][col+1],cc=points[row+1][col+1],d=points[row+1][col];triangle(fc,tex,a.s,b.s,cc.s,a.d,b.d,cc.d);triangle(fc,tex,a.s,cc.s,d.s,a.d,cc.d,d.d);}
  if(item.split){if(light)applyLight(fc,light,t,true);pc.drawImage(item.fol,0,0);}
  else{pc.clearRect(0,463,SW+32,SH+16-463);pc.drawImage(item.texture,0,455,SW,SH-455,16,463,SW,SH-455);if(light)applyLight(pc,light,t,true);}
  const sc=item.shadow.getContext('2d');sc.clearRect(0,0,item.shadow.width,item.shadow.height);sc.drawImage(item.plant,0,0);sc.globalCompositeOperation='source-in';sc.fillStyle='#172b20';sc.fillRect(0,0,item.shadow.width,item.shadow.height);sc.globalCompositeOperation='source-over';return item.plant;
 }
 function background(c,image,light){
  const {direct,dayPhase,lightX,warmth}=light;
  c.clearRect(0,0,W,H);c.fillStyle='#1c3d34';c.fillRect(0,0,W,H);
  if(image){const s=Math.max(W/image.width,H/image.height),w=image.width*s,h=image.height*s;c.drawImage(image,(W-w)/2,(H-h)/2,w,h);}
  const sunX=480+570*lightX,sunY=-180;
  const glow=c.createRadialGradient(sunX,sunY,30,sunX,sunY,1000);glow.addColorStop(0,`rgba(255,${Math.round(236-50*warmth)},153,${.38*direct})`);glow.addColorStop(.6,`rgba(255,226,164,${.11*direct})`);glow.addColorStop(1,'rgba(255,230,180,0)');c.fillStyle=glow;c.fillRect(0,0,W,H);
  // Sunlight crossing the table: diffuse oblique bands that sweep with the solar direction.
  c.save();c.beginPath();c.rect(0,452,W,H-452);c.clip();c.filter='blur(12px)';
  const sweep=dayPhase*350;for(let i=0;i<5;i++){c.beginPath();c.moveTo(i*280-430+sweep,452);c.lineTo(i*280-310+sweep,452);c.lineTo(i*280-110+sweep,620);c.lineTo(i*280-230+sweep,620);c.closePath();c.fillStyle=`rgba(255,235,169,${.16*direct})`;c.fill();}c.restore();
 }
 const PLACE={x:307,y:70,scale:.865};
 // One outdoor frame. o: {p: 0..1 seven-day progress, t: sway time, texture, amp, plant:false to skip the plant,
 // captions:false to skip the time-lapse labels}. Pure function of its arguments.
 function outdoor(c,l,images,o){
  const light=lighting(o.p);
  background(c,images.sunlitGarden,light);
  const item=prepare(c,images),{x,y,scale}=PLACE;
  if(item&&o.plant!==false){const frame=plantFrame(item,o.t,light,o),baseX=208,baseY=574,groundX=x+baseX*scale,groundY=y+baseY*scale;
   // Project the same plant-and-pot silhouette from its real contact point.
   // Positive lightX means light on the right and a shadow extending to the left.
   c.save();c.beginPath();c.rect(0,400,960,220);c.clip();c.globalAlpha=light.shadowOpacity;c.filter=`blur(${2+4*(1-Math.max(0,light.elevation))}px)`;c.translate(groundX,groundY);c.transform(1,0,light.shadowShear,light.shadowDepth,0,0);c.drawImage(item.shadow,-baseX*scale,-baseY*scale,item.shadow.width*scale,item.shadow.height*scale);c.restore();
   // Contact shadow is fixed at the pot base while the foliage's cast shadow changes.
   c.save();c.fillStyle='rgba(21,39,26,.26)';c.filter='blur(5px)';c.beginPath();c.ellipse(groundX,groundY,65,8,0,0,Math.PI*2);c.fill();c.restore();
   c.drawImage(frame,x,y,frame.width*scale,frame.height*scale);
  }
  // Night affects the WHOLE scene, including the pot and foil, not only the backdrop.
  // Keep enough ambient detail to see the plant; direct sunlight/shadows vanish at night.
  c.fillStyle=`rgba(9,20,34,${.92*(1-light.daylight)})`;c.fillRect(0,0,W,H);
  const mask=c.createLinearGradient(0,0,0,620);mask.addColorStop(0,'rgba(11,26,21,.85)');mask.addColorStop(.17,'rgba(11,26,21,0)');mask.addColorStop(.82,'rgba(11,26,21,0)');mask.addColorStop(1,'rgba(11,26,21,.88)');c.fillStyle=mask;c.fillRect(0,0,960,620);
  if(o.captions===false)return light;
  // Top 0–30 px stays free for the progress bar.
  base.label(c,tr(l,'晝夜縮時 · 葉片隨風擺動','Day–night time-lapse · leaves in the breeze'),480,50,'#fde047',28);
  base.label(c,tr(l,'第 '+light.day+' 天 · '+(light.night?'夜晚':'白天'),'Day '+light.day+' · '+(light.night?'Night':'Daytime')),800,100,'#f2ecd9',24);
  base.label(c,tr(l,'5～7 天壓縮呈現 · AI 縮時模擬，非實拍','5–7 days compressed · AI time-lapse simulation, not footage'),480,598,'#f2ecd9',22);
  return light;
 }
 function lightExposure(c,u,l,images){
  const m=u.lab.motion,complete=u.lab.step===2&&!m,p=m?clamp(m.t/m.duration):complete?1:0,t=m?m.t:complete?6:0;
  if(!prepare(c,images)){base.lab(c,u,l,images);return;}
  outdoor(c,l,images,{p,t});
 }
 // Hold the outdoor final frame until the teacher starts the indoor leaf-removal action.
 function lab(c,u,l,images={}){if((u.lab.step===1||(u.lab.step===2&&!u.lab.motion))&&images.pottedPlant&&images.sunlitGarden){lightExposure(c,u,l,images);return;}base.lab(c,u,l,images);}
 return {...base,lab,sunlightPose:pose,sunlightLighting:lighting,sunlightKit:{SW,SH,PLACE,POT_TOP,STEM_X,STEM_Y,prepare,variant,plantFrame,lighting,outdoor,samplePath,foilFront}};
});

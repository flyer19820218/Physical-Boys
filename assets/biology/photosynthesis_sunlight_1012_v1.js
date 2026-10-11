/* Teacher-authorized change: only the outdoor light-exposure shot.
 * Same plant/foil, same six-second model action, same subsequent eight-step lab.
 * AI background + deterministic time-lapse simulation, never documentary footage. */
(function(root,factory){
 const base=typeof module==='object'&&module.exports?require('./photosynthesis_teacher_lab_1011_v1.js'):root.PhotosynthesisDraw;
 const out=factory(base);
 if(typeof module==='object'&&module.exports)module.exports=out;else root.PhotosynthesisDraw=out;
})(typeof window==='object'?window:globalThis,function(base){'use strict';
 const W=960,H=620,SW=384,SH=576,COLS=10,ROWS=22,cache=new WeakMap();
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),tr=(l,z,e)=>l==='zh'?z:e;
 function surface(c,images,w,h){
  const cv=images.canvasFactory?images.canvasFactory(w,h):typeof document!=='undefined'?document.createElement('canvas'):new OffscreenCanvas(w,h);
  cv.width=w;cv.height=h;return cv;
 }
 // Byte-equivalent leaf outline from the approved plant master (1024 × 1536).
 function samplePath(c){c.beginPath();c.moveTo(394,437);c.bezierCurveTo(377,407,379,360,347,337);c.bezierCurveTo(292,306,231,316,177,357);c.bezierCurveTo(105,412,71,493,67,579);c.bezierCurveTo(59,672,89,753,146,823);c.bezierCurveTo(161,859,183,891,188,916);c.bezierCurveTo(209,859,284,837,354,801);c.bezierCurveTo(438,755,483,672,493,586);c.bezierCurveTo(502,522,476,476,433,458);c.bezierCurveTo(412,450,402,446,394,437);c.closePath();}
 function prepare(c,images){
  const im=images.pottedPlant;if(!im)return null;
  if(cache.has(im))return cache.get(im);
  const texture=surface(c,images,SW,SH),tc=texture.getContext('2d');
  tc.scale(SW/1024,SH/1536);
  // Foil is baked into the texture BEFORE deformation: it cannot detach from the leaf.
  tc.fillStyle='#718278';tc.beginPath();tc.roundRect(55,510,450,223,8);tc.fill();
  tc.drawImage(im,0,0,1024,1536);tc.save();samplePath(tc);tc.clip();
  const g=tc.createLinearGradient(60,512,500,731);
  [[0,'#788682'],[.22,'#e3e9e5'],[.47,'#8d9a95'],[.73,'#edf2ee'],[1,'#a5b4aa']].forEach(([p,col])=>g.addColorStop(p,col));
  tc.fillStyle=g;tc.fillRect(60,512,440,219);
  for(let i=0;i<29;i++){tc.beginPath();tc.moveTo(60+i*16,513);tc.lineTo(72+i*14,603);tc.lineTo(60+i*16,730);tc.strokeStyle=i%2?'rgba(242,247,239,.5)':'rgba(66,89,75,.28)';tc.lineWidth=1.2;tc.stroke();}tc.restore();
  const item={texture,plant:surface(c,images,SW+32,SH+16),shadow:surface(c,images,SW+32,SH+16)};cache.set(im,item);return item;
 }
 function pose(x,y,t){
  // The flowerpot and soil stay perfectly fixed; displacement grows up the flexible stem.
  const flex=clamp((455-y)/405),sway=Math.sin(t*2.15)+.37*Math.sin(t*4.37+.7);
  let dx=22*flex*flex*sway,dy=1.6*flex*Math.sin(t*3.3);
  const leaves=[[105,230,1.7],[279,241,3.6],[174,76,.4],[73,327,5.1],[291,347,2.5]];
  for(const [lx,ly,phase] of leaves){const influence=Math.exp(-((x-lx)**2/3000+(y-ly)**2/4200))*flex;
   dx+=influence*5.5*Math.sin(t*6.3+phase);dy+=influence*7*Math.sin(t*4.8+phase);
  }
  return {x:x+dx+16,y:y+dy+8};
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
 function plantFrame(item,t,daylight,phase){
  const pc=item.plant.getContext('2d');pc.clearRect(0,0,item.plant.width,item.plant.height);
  const points=[];for(let row=0;row<=ROWS;row++){const line=[];for(let col=0;col<=COLS;col++){const x=col*SW/COLS,y=row*SH/ROWS;line.push({s:{x,y},d:pose(x,y,t)});}points.push(line);}
  for(let row=0;row<ROWS;row++)if(row*SH/ROWS<455)for(let col=0;col<COLS;col++){const a=points[row][col],b=points[row][col+1],cc=points[row+1][col+1],d=points[row+1][col];triangle(pc,item.texture,a.s,b.s,cc.s,a.d,b.d,cc.d);triangle(pc,item.texture,a.s,cc.s,d.s,a.d,cc.d,d.d);}
  // Stationary pot bypasses the mesh entirely: no triangulation seams across the ceramic.
  pc.clearRect(0,463,SW+32,SH+16-463);pc.drawImage(item.texture,0,455,SW,SH-455,16,463,SW,SH-455);
  pc.save();pc.globalCompositeOperation='source-atop';
  const shade=pc.createLinearGradient(0,0,SW,SH);shade.addColorStop(0,`rgba(255,218,137,${.11*daylight})`);shade.addColorStop(.52,'rgba(255,234,177,.03)');shade.addColorStop(1,`rgba(21,42,30,${.12*(1-daylight)})`);pc.fillStyle=shade;pc.fillRect(0,0,SW+32,SH+16);
  // Soft moving patches on the leaf surfaces, not cartoon rays drawn over them.
  for(let i=0;i<4;i++){const xx=60+phase*260+i*45,yy=75+i*80+10*Math.sin(t*1.2+i),g=pc.createRadialGradient(xx,yy,1,xx,yy,60);g.addColorStop(0,`rgba(255,241,183,${.16*daylight})`);g.addColorStop(1,'rgba(255,241,183,0)');pc.fillStyle=g;pc.fillRect(xx-60,yy-60,120,120);}pc.restore();
  const sc=item.shadow.getContext('2d');sc.clearRect(0,0,item.shadow.width,item.shadow.height);sc.drawImage(item.plant,0,0);sc.globalCompositeOperation='source-in';sc.fillStyle='#172b20';sc.fillRect(0,0,item.shadow.width,item.shadow.height);sc.globalCompositeOperation='source-over';return item.plant;
 }
 function background(c,image,daylight,phase){
  c.clearRect(0,0,W,H);c.fillStyle='#1c3d34';c.fillRect(0,0,W,H);
  if(image){const s=Math.max(W/image.width,H/image.height),w=image.width*s,h=image.height*s;c.drawImage(image,(W-w)/2,(H-h)/2,w,h);}
  c.fillStyle=`rgba(8,29,24,${.56*(1-daylight)})`;c.fillRect(0,0,W,H);
  const sunX=1050-990*phase,sunY=-160+70*Math.sin(phase*Math.PI);
  const glow=c.createRadialGradient(sunX,sunY,30,sunX,sunY,1000);glow.addColorStop(0,`rgba(255,224,153,${.4*daylight})`);glow.addColorStop(.6,`rgba(255,226,164,${.11*daylight})`);glow.addColorStop(1,'rgba(255,230,180,0)');c.fillStyle=glow;c.fillRect(0,0,W,H);
  // Sunlight crossing the table: diffuse oblique bands that sweep with the solar direction.
  c.save();c.beginPath();c.rect(0,452,W,H-452);c.clip();c.filter='blur(12px)';
  const sweep=phase*350;for(let i=0;i<5;i++){c.beginPath();c.moveTo(i*280-430+sweep,452);c.lineTo(i*280-310+sweep,452);c.lineTo(i*280-110+sweep,620);c.lineTo(i*280-230+sweep,620);c.closePath();c.fillStyle=`rgba(255,235,169,${.16*daylight})`;c.fill();}c.restore();
 }
 function lightExposure(c,u,l,images){
  const m=u.lab.motion,p=m?clamp(m.t/m.duration):0,t=m?m.t:0,phase=m?(p*7)%1:.35;
  const daylight=.2+.8*Math.pow(Math.max(0,Math.sin(Math.PI*phase)),.55);
  background(c,images.sunlitGarden,daylight,phase);
  const item=prepare(c,images),x=307,y=70,scale=.865;
  if(item){const frame=plantFrame(item,t,daylight,phase);
   c.save();c.beginPath();c.rect(0,452,960,168);c.clip();c.globalAlpha=.23*daylight;c.filter='blur(4px)';c.translate(480,571);c.transform(1,.03,(1-phase*2)*1.05,-.2,0,0);c.drawImage(item.shadow,-(192+16)*scale,-(566+8)*scale,item.shadow.width*scale,item.shadow.height*scale);c.restore();
   // Contact shadow is fixed at the pot base while the foliage's cast shadow changes.
   c.save();c.fillStyle='rgba(21,39,26,.26)';c.filter='blur(5px)';c.beginPath();c.ellipse(479,566,65,8,0,0,Math.PI*2);c.fill();c.restore();
   c.drawImage(frame,x,y,frame.width*scale,frame.height*scale);
  }else base.lab(c,u,l,images);
  const mask=c.createLinearGradient(0,0,0,620);mask.addColorStop(0,'rgba(11,26,21,.85)');mask.addColorStop(.17,'rgba(11,26,21,0)');mask.addColorStop(.82,'rgba(11,26,21,0)');mask.addColorStop(1,'rgba(11,26,21,.88)');c.fillStyle=mask;c.fillRect(0,0,960,620);
  base.label(c,tr(l,'陽光縮時 · 葉片隨風擺動','Sunlight time-lapse · leaves in the breeze'),480,34,'#fde047',28);
  const day=m?Math.min(7,Math.floor(p*7)+1):1;
  base.label(c,tr(l,'第 '+day+' 天','Day '+day),814,97,'#f2ecd9',24);
  base.label(c,tr(l,'5～7 天壓縮呈現 · AI 縮時模擬，非實拍','5–7 days compressed · AI time-lapse simulation, not footage'),480,598,'#f2ecd9',22);
 }
 function lab(c,u,l,images={}){if(u.lab.step===1&&images.pottedPlant&&images.sunlitGarden){lightExposure(c,u,l,images);return;}base.lab(c,u,l,images);}
 return {...base,lab,sunlightPose:pose};
});

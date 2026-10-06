/* Teacher-authorized revision, 2026-10-07. V1 retained; diffusion unchanged. */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gaussian(random) { return Math.sqrt(-2 * Math.log(Math.max(1e-10, random()))) * Math.cos(2 * Math.PI * random()); }
  function reflect(v) { v = ((v % 2) + 2) % 2; return v > 1 ? 2 - v : v; }
  function makeDiffusion(x = .16, y = .48, seed = 42) {
    const random = rng(seed);
    return { random, elapsed: 0, particles: Array.from({ length: 240 }, () => ({ x: reflect(x + .026 * gaussian(random)), y: reflect(y + .04 * gaussian(random)) })) };
  }
  function stepDiffusion(s, dt) {
    const sigma = Math.sqrt(2 * .012 * dt);
    for (const p of s.particles) { p.x = reflect(p.x + sigma * gaussian(s.random)); p.y = reflect(p.y + sigma * gaussian(s.random)); }
    s.elapsed += dt;
    return s;
  }
  function diffusionCounts(s) { const left = s.particles.filter(p => p.x < .5).length; return { left, right: s.particles.length - left }; }
  function makeOsmosis(external = 1) { return { external, volume: 1, elapsed: 0, flux: 0, insideSolute: 1 }; }
  function osmoticDrive(s) {
    // Qualitative reservoir model: internal impermeant solute is conserved;
    // wall-supported pressure increases on expansion and limits water entry.
    const pressure = Math.max(0, s.volume - 1.02) * 18;
    return s.insideSolute / s.volume - s.external - pressure;
  }
  function stepOsmosis(s, dt) {
    s.flux = .10 * osmoticDrive(s);
    s.volume = clamp(s.volume + s.flux * dt, .38, 1.16);
    s.elapsed += dt;
    return s;
  }
  function osmoticRates(s) { const drive = clamp(osmoticDrive(s), -1.5, 1.5); return { inward: .8 + Math.max(0, drive) * .5, outward: .8 + Math.max(0, -drive) * .5 }; }
  function makeRedCell(external=1){return {external,volume:1,elapsed:0,flux:0,insideSolute:1,lysed:false,lysisAt:null,release:0};}
  function redCellDrive(s){return s.lysed?0:s.insideSolute/s.volume-s.external;}
  function stepRedCell(s,dt){s.elapsed+=dt;if(s.lysed){s.release=1-Math.exp(-(s.elapsed-s.lysisAt)*.7);return s;}s.flux=.12*redCellDrive(s);s.volume=clamp(s.volume+s.flux*dt,.38,1.60);if(s.volume>=1.60){s.lysed=true;s.lysisAt=s.elapsed;s.flux=0;}return s;}
  function redCellRates(s){const drive=clamp(redCellDrive(s),-1.5,1.5);return {inward:.8+Math.max(0,drive)*.5,outward:.8+Math.max(0,-drive)*.5};}
  function advanceWater(s,dt,rates){s.inPhase=((s.inPhase||0)+dt*rates.inward*.14)%1;s.outPhase=((s.outPhase||0)+dt*rates.outward*.14)%1;}
  function fullscreenBox(w, h) {
    const portrait = h > w, areaW = portrait ? w - 32 : w - 340 - 32, areaH = portrait ? h * .62 - 142 : h - 178;
    return { portrait, width: Math.max(0, Math.min(areaW, areaH * 900 / 540)), height: Math.max(0, Math.min(areaW / (900 / 540), areaH)), left: portrait ? 16 : 356 };
  }
  const api = { rng, reflect, makeDiffusion, stepDiffusion, diffusionCounts, makeOsmosis, stepOsmosis, osmoticDrive, osmoticRates, fullscreenBox,makeRedCell,redCellDrive,stepRedCell,redCellRates };
  root.MatterTransport = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  const white = '#f2ecd9', teal = '#55e9ff', yellow = '#fde047', orange = '#fb923c';
  function disk(c, x, y, r, color) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
  function round(c, x, y, w, h, r, fill, stroke, lw = 2) { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } }
  function background(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1c3d34'); g.addColorStop(1, '#0b1a15'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
  function bench(c) {
    c.beginPath(); c.moveTo(36, 480); c.lineTo(118, 443); c.lineTo(788, 443); c.lineTo(864, 480); c.closePath(); c.fillStyle = '#85948f'; c.fill();
    c.fillStyle = '#647672'; c.fillRect(36, 480, 828, 17); c.strokeStyle = '#b9c7c0'; c.lineWidth = 2; c.stroke();
  }
  function drawDiffusion(c, s) {
    background(c, 900, 540); bench(c);
    const box = { x: 109, y: 204, w: 260, h: 225 };
    c.save(); round(c, 92, 110, 296, 333, 22, 'rgba(222,251,255,.06)', null); c.clip();
    c.fillStyle = 'rgba(96,182,205,.18)'; c.fillRect(box.x - 14, box.y, box.w + 28, box.h + 12);
    // Coarse-grained concentration made from the same microscopic particles.
    // It is a qualitative concentration image, not a fluid-dynamics calculation.
    c.save(); c.beginPath(); c.rect(box.x - 14, box.y, box.w + 28, box.h + 12); c.clip();
    for (const p of s.particles) {
      const x = box.x + p.x * box.w, y = box.y + p.y * box.h;
      const haze = c.createRadialGradient(x,y,0,x,y,31);
      haze.addColorStop(0,'rgba(244,96,123,.065)'); haze.addColorStop(.55,'rgba(244,96,123,.026)'); haze.addColorStop(1,'rgba(244,96,123,0)');
      c.fillStyle=haze; c.fillRect(x-31,y-31,62,62);
    }
    c.restore();
    c.restore();
    c.beginPath(); c.ellipse(240, 204, 143, 19, 0, 0, Math.PI * 2); c.fillStyle = 'rgba(125,223,240,.14)'; c.fill(); c.strokeStyle = 'rgba(184,239,242,.7)'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(90, 112); c.lineTo(102, 413); c.quadraticCurveTo(103, 440, 131, 441); c.lineTo(348, 441); c.quadraticCurveTo(374, 440, 377, 412); c.lineTo(389, 111); c.strokeStyle = '#cbf5f4'; c.lineWidth = 5; c.stroke();
    c.beginPath(); c.ellipse(239, 109, 151, 21, 0, 0, Math.PI * 2); c.strokeStyle = white; c.lineWidth = 4; c.stroke();
    c.beginPath(); c.moveTo(370, 90); c.lineTo(412, 71); c.lineTo(399, 104); c.lineTo(381, 116); c.strokeStyle = white; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke();
    c.beginPath(); c.moveTo(113, 137); c.lineTo(125, 395); c.quadraticCurveTo(125, 422, 148, 424); c.strokeStyle = 'rgba(242,255,255,.7)'; c.lineWidth = 7; c.lineCap = 'round'; c.stroke();
    for (let y = 154; y < 415; y += 47) { c.beginPath(); c.moveTo(300, y); c.lineTo(323, y); c.strokeStyle = '#bceced'; c.lineWidth = 3; c.stroke(); }
    c.save(); round(c, 487, 109, 346, 334, 17, '#15342d', '#5e9c91'); c.clip();
    c.fillStyle = 'rgba(85,233,255,.05)'; c.fillRect(487, 109, 346, 334);
    for (const p of s.particles) { disk(c, 499 + p.x * 322, 121 + p.y * 310, 3.1, '#fa788a'); }
    c.restore();
    c.setLineDash([5, 7]); c.beginPath(); c.moveTo(660, 114); c.lineTo(660, 438); c.strokeStyle = 'rgba(242,236,217,.28)'; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(416, 266); c.lineTo(469, 266); c.lineTo(459, 258); c.moveTo(469, 266); c.lineTo(459, 274); c.strokeStyle = teal; c.lineWidth = 3; c.stroke();
  }
  function waterMolecule(c,x,y,r=10,rotation=0){c.save();c.translate(x,y);c.rotate(rotation);const a=104.5*Math.PI/360,ox=Math.sin(a)*r*1.25,oy=-Math.cos(a)*r*1.25;
    disk(c,-ox,oy,r*.56,white);disk(c,ox,oy,r*.56,white);const g=c.createRadialGradient(-r*.3,-r*.3,1,0,0,r);g.addColorStop(0,'#ffc9df');g.addColorStop(.42,'#f472b6');g.addColorStop(1,'#b7326f');disk(c,0,0,r,g);disk(c,-r*.3,-r*.35,r*.17,'rgba(255,255,255,.6)');c.restore();}
  function arrow(c,x1,x2,y,color,alpha,phase){c.save();c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(x1,y);c.lineTo(x2,y);c.stroke();const d=x2>x1?-1:1;c.beginPath();c.moveTo(x2,y);c.lineTo(x2+d*18,y-12);c.lineTo(x2+d*18,y+12);c.closePath();c.fillStyle=color;c.fill();c.restore();
    // Molecules are painted AFTER both wall and membrane, so crossings stay visible.
    for(let k=0;k<5;k++){const t=(phase+k/5)%1;waterMolecule(c,x1+(x2-x1)*t,y,10,.14*Math.sin(t*8+k));}}
  function vacuoleOutline(v,n){const p=[],add=(x,y)=>p.push({x,y}),quad=(x0,y0,cx,cy,x1,y1)=>{for(let k=1;k<=14;k++){const t=k/14,u=1-t;add(u*u*x0+2*u*t*cx+t*t*x1,u*u*y0+2*u*t*cy+t*t*y1);}},l=v.x,r=v.x+v.w,t=v.y,b=v.y+v.h,rad=v.w*.055,notchRight=n.x+n.rx+11,nt=n.y-n.ry-11,nb=n.y+n.ry+11;
    add(l+rad,t);add(r-rad,t);quad(r-rad,t,r,t,r,t+rad);add(r,b-rad);quad(r,b-rad,r,b,r-rad,b);add(l+rad,b);quad(l+rad,b,l,b,l,b-rad);add(l,nb);quad(l,nb,notchRight,nb,notchRight,n.y);quad(notchRight,n.y,notchRight,nt,l,nt);add(l,t+rad);quad(l,t+rad,l,t,l+rad,t);return p;}
  function insideOutline(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
  function outlineArea(p){let a=0;for(let i=0;i<p.length;i++){const j=(i+1)%p.length;a+=p[i].x*p[j].y-p[j].x*p[i].y;}return Math.abs(a/2);}
  function traceVacuole(c,p){c.beginPath();p.forEach((v,k)=>k?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}
  // Teacher-authorized contour correction. Water amounts and flux equations stay unchanged.
  function deformPlantPoint(p,box,swell,shrink=0){const u=(p.x-box.x)/box.w,v=(p.y-box.y)/box.h,b=10*swell;
    const bump=(t,at,width)=>Math.exp(-(((t-at)/width)**2));
    return {x:p.x+b*(2*u-1)*Math.sin(Math.PI*v)+shrink*(30*bump(v,.28,.16)*(1-u)**2-25*bump(v,.65,.18)*u*u),
      y:p.y+b*(2*v-1)*Math.sin(Math.PI*u)+shrink*(28*bump(u,.68,.17)*(1-v)**2-24*bump(u,.32,.19)*v*v)};}
  function deformPlantOutline(points,box,swell,shrink=0){const result=[];for(let k=0;k<points.length;k++){const a=points[k],b=points[(k+1)%points.length],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/6));for(let j=0;j<steps;j++)result.push(deformPlantPoint({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps},box,swell,shrink));}return result;}
  function roundedPlantOutline(box,r){const p=[];for(const [x,y,a] of [[box.x+box.w-r,box.y+r,-Math.PI/2],[box.x+box.w-r,box.y+box.h-r,0],[box.x+r,box.y+box.h-r,Math.PI/2],[box.x+r,box.y+r,Math.PI]])for(let k=0;k<=16;k++)p.push({x:x+r*Math.cos(a+k/16*Math.PI/2),y:y+r*Math.sin(a+k/16*Math.PI/2)});return p;}
  function paintPlantBox(c,box,r,fill,stroke,lw){if(!box.outline)return round(c,box.x,box.y,box.w,box.h,r,fill,stroke,lw);traceVacuole(c,box.outline);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
  function plantGeometry(s){const swell=clamp((s.volume-1)/.072,0,1),stretch=1+.024*swell,wallW=350*stretch,wallH=350*stretch,x=585-wallW/2,y=265-wallH/2;
    const w=s.volume>=1?322+(wallW-14-322)*swell:322*Math.cbrt(s.volume),h=w,px=585-w/2,py=265-h/2,margin=.0375-.010*swell;
    const nucleus={x:px+w*.118,y:py+h*.70,rx:w*.085,ry:h*.09},vac={x:px+w*margin,y:py+h*margin,w:w*(1-2*margin),h:h*(1-2*margin)};
    vac.outline=vacuoleOutline(vac,nucleus);vac.area=outlineArea(vac.outline);
    const wall={x,y,w:wallW,h:wallH},membrane={x:px,y:py,w,h},shrink=clamp((1-s.volume)/.5,0,1),deformed=swell>0||shrink>0;
    if(deformed){membrane.outline=deformPlantOutline(roundedPlantOutline(membrane,28),membrane,swell,shrink);
      membrane.area=outlineArea(membrane.outline);vac.outline=deformPlantOutline(vac.outline,membrane,swell,shrink);vac.area=outlineArea(vac.outline);
      if(swell>0)wall.outline=deformPlantOutline(roundedPlantOutline(wall,32),wall,swell);
      nucleus.baseX=nucleus.x;nucleus.baseY=nucleus.y;const np=[];for(let k=0;k<96;k++){const a=k/96*Math.PI*2,dx=Math.cos(a)*nucleus.rx,dy=Math.sin(a)*nucleus.ry;np.push({x:nucleus.x+dx*Math.cos(-.1)-dy*Math.sin(-.1),y:nucleus.y+dx*Math.sin(-.1)+dy*Math.cos(-.1)});}nucleus.outline=deformPlantOutline(np,membrane,swell,shrink);Object.assign(nucleus,deformPlantPoint(nucleus,membrane,swell,shrink));
    }
    return {wall,membrane,vacuole:vac,nucleus,swell,shrink,deformed};}
  function drawOsmosis(c,s){background(c,900,540);const g=plantGeometry(s),wall=g.wall,m=g.membrane,v=g.vacuole,n=g.nucleus;
    const ext=c.createLinearGradient(0,80,0,440);ext.addColorStop(0,'rgba(94,182,203,.09)');ext.addColorStop(1,'rgba(94,182,203,.2)');round(c,60,65,780,420,26,ext,'#6a928a');
    c.setLineDash([8,7]);round(c,410,90,350,350,28,null,'rgba(242,236,217,.42)',2);c.setLineDash([]);
    paintPlantBox(c,wall,32,'rgba(217,250,227,.07)','#a8c691',9);
    const fill=c.createLinearGradient(m.x,m.y,m.x+m.w,m.y+m.h);fill.addColorStop(0,'rgba(190,221,171,.42)');fill.addColorStop(1,'rgba(101,181,163,.2)');paintPlantBox(c,m,28,fill,teal,4);
    const vg=c.createLinearGradient(v.x,v.y,v.x+v.w,v.y+v.h);vg.addColorStop(0,'rgba(193,176,225,.6)');vg.addColorStop(1,'rgba(136,154,212,.35)');traceVacuole(c,v.outline);c.fillStyle=vg;c.fill();c.strokeStyle='#c9b8f3';c.lineWidth=3;c.stroke();
    // The starting vacuole remains visible as a reference, not a second organelle.
    const initialVac=plantGeometry({volume:1}).vacuole;
    c.setLineDash([7,6]);traceVacuole(c,initialVac.outline);c.strokeStyle='rgba(242,236,217,.55)';c.lineWidth=2;c.stroke();c.setLineDash([]);
    const edge=.018-.007*g.swell,chloroplasts=[];for(let k=0;k<7;k++){const f=.14+k*.12;chloroplasts.push({x:m.x+m.w*f,y:m.y+m.h*edge,a:0},{x:m.x+m.w*f,y:m.y+m.h*(1-edge),a:0});}for(const f of [.16,.33,.49,.87])chloroplasts.push({x:m.x+m.w*edge,y:m.y+m.h*f,a:Math.PI/2},{x:m.x+m.w*(1-edge),y:m.y+m.h*f,a:Math.PI/2});
    for(const leaf of chloroplasts){if(Math.hypot(leaf.x-(n.baseX??n.x),leaf.y-(n.baseY??n.y))<n.ry+13)continue;c.save();if(g.deformed){const lp=[];for(let k=0;k<32;k++){const a=k/32*Math.PI*2,dx=10*Math.cos(a),dy=3.2*Math.sin(a);lp.push({x:leaf.x+dx*Math.cos(leaf.a)-dy*Math.sin(leaf.a),y:leaf.y+dx*Math.sin(leaf.a)+dy*Math.cos(leaf.a)});}traceVacuole(c,deformPlantOutline(lp,m,g.swell,g.shrink));}else{c.translate(leaf.x,leaf.y);c.rotate(leaf.a);c.beginPath();c.ellipse(0,0,10,3.2,0,0,Math.PI*2);}c.fillStyle='#77ad51';c.fill();c.strokeStyle='#b5d775';c.lineWidth=1;c.stroke();c.restore();}
    const random=rng(140);let count=0;for(let k=0;k<400&&count<24;k++){const sx=v.x+v.w*(.04+random()*.92),sy=v.y+v.h*(.04+random()*.92);if(!insideOutline(sx,sy,v.outline))continue;disk(c,sx,sy,3.4,orange);count++;}
    for(let k=0;k<s.external*28;k++){const sx=90+random()*700,sy=95+random()*350;if(sx>wall.x-20&&sx<wall.x+wall.w+20)continue;disk(c,sx,sy,3.4,orange);}
    if(n.outline)traceVacuole(c,n.outline);else{c.beginPath();c.ellipse(n.x,n.y,n.rx,n.ry,-.1,0,Math.PI*2);}const ng=c.createRadialGradient(n.x-n.rx*.3,n.y-n.ry*.3,1,n.x,n.y,n.ry);ng.addColorStop(0,'#c6a2e6');ng.addColorStop(1,'#78549e');c.fillStyle=ng;c.fill();c.strokeStyle='#d8b6f5';c.lineWidth=2;c.stroke();disk(c,n.x-3,n.y+2,n.rx*.34,'#513668');
    paintPlantBox(c,m,28,null,teal,4);paintPlantBox(c,wall,32,null,'#a8c691',8);
    arrow(c,130,m.x+m.w*.23,202,teal,.6,s.inPhase??s.elapsed*.14%1);arrow(c,m.x+m.w*.23,130,284,teal,.6,s.outPhase??s.elapsed*.14%1);
  }
  function redCellGeometry(s){return {x:580,y:265,r:122*Math.cbrt(s.volume),swell:clamp((s.volume-1)/.6,0,1),crenation:clamp((1-s.volume)/.5,0,1)};}
  function drawRedCell(c,s){background(c,900,540);round(c,60,65,780,420,26,'rgba(94,182,203,.10)','#6a928a');const g=redCellGeometry(s),{x,y,r}=g;
    c.setLineDash([8,7]);c.beginPath();c.arc(x,y,122,0,Math.PI*2);c.strokeStyle='rgba(242,236,217,.45)';c.lineWidth=2;c.stroke();c.setLineDash([]);
    c.save();c.beginPath();for(let k=0;k<=168;k++){const a=k/168*Math.PI*2,rr=r*(1+.10*g.crenation*Math.cos(a*14));k?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+rr,y);}c.closePath();const fill=c.createRadialGradient(x-r*.16,y-r*.2,r*.03,x,y,r*1.12);fill.addColorStop(0,g.swell>.8?'#ec8185':'#eda4a1');fill.addColorStop(.28,'#b33241');fill.addColorStop(.63,'#e06b75');fill.addColorStop(1,'#762a38');c.fillStyle=fill;c.globalAlpha=s.lysed?1-s.release*.92:1;c.fill();c.lineWidth=5;c.strokeStyle='#f1a3ab';if(!s.lysed)c.stroke();c.restore();
    if(!s.lysed){c.save();c.globalAlpha=(1-g.swell)*.8;c.beginPath();c.ellipse(x,y,r*.45,r*.33,-.1,0,Math.PI*2);const hollow=c.createRadialGradient(x,y,0,x,y,r*.5);hollow.addColorStop(0,'rgba(255,215,206,.8)');hollow.addColorStop(1,'rgba(236,157,157,0)');c.fillStyle=hollow;c.fill();c.restore();
      const random=rng(172);for(let k=0;k<18;k++){const a=random()*Math.PI*2,rr=Math.sqrt(random())*r*.72;disk(c,x+Math.cos(a)*rr,y+Math.sin(a)*rr,3.2,orange);}
      arrow(c,130,x-r*.44,205,teal,.6,s.inPhase??s.elapsed*.14%1);arrow(c,x-r*.44,130,284,teal,.6,s.outPhase??s.elapsed*.14%1);
    }else{c.save();c.globalAlpha=.6;c.beginPath();c.arc(x,y,r,.32,Math.PI*2-.38);c.strokeStyle='#f3acb4';c.lineWidth=4;c.stroke();c.restore();c.save();round(c,60,65,780,420,26);c.clip();const random=rng(171);for(let k=0;k<46;k++){const a=random()*Math.PI*2,rr=Math.sqrt(random())*(r+(150-r)*s.release)+s.release*60,px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;const haze=c.createRadialGradient(px,py,0,px,py,34);haze.addColorStop(0,`rgba(227,90,111,${.06+s.release*.06})`);haze.addColorStop(1,'rgba(227,90,111,0)');c.fillStyle=haze;c.fillRect(px-34,py-34,68,68);}
      for(let k=0;k<12;k++){const t=s.elapsed*.32+k*.59;waterMolecule(c,580+Math.sin(t*1.2)*160,265+Math.cos(t*.87)*130,8,t*.2);}c.restore();}
  }
  function starchGeometry(){const nodes=[],paths=[];let main=[];for(let k=0;k<32;k++){const p={x:-110+k*7.1,y:10+Math.sin(k*.42)*10};nodes.push(p);main.push(p);}paths.push(main);for(const at of [5,12,20,27]){const start=main[at],branch=[start];for(let k=1;k<=8;k++){const p={x:start.x+k*4.1,y:start.y-k*5.2+Math.sin(k*.6)*2};nodes.push(p);branch.push(p);}paths.push(branch);}return {nodes,paths};}
  function glucoseUnit(c,x,y,r=7){c.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;k?c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):c.moveTo(x+r,y);}c.closePath();c.fillStyle=orange;c.fill();c.strokeStyle='#ffd7a2';c.lineWidth=1;c.stroke();}
  function drawStarch(c,x,y){const g=starchGeometry();c.save();c.translate(x,y);c.strokeStyle='#e7b779';c.lineWidth=3;c.lineJoin='round';for(const path of g.paths){c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}for(const p of g.nodes)glucoseUnit(c,p.x,p.y,6);c.restore();}
  function drawChain(c, linked, count = 8) {
    background(c, 900, 360);
    const centers = Array.from({ length: count }, (_, k) => ({ x: 90 + k * 101, y: linked ? 178 + Math.sin(k * .9) * 28 : 170 + (k % 2 ? -42 : 42) }));
    if (linked) { c.beginPath(); centers.forEach((p, k) => k ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.strokeStyle = '#c6aa7a'; c.lineWidth = 6; c.stroke(); }
    for (const p of centers) { c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; k ? c.lineTo(p.x + Math.cos(a) * 28, p.y + Math.sin(a) * 28) : c.moveTo(p.x + Math.cos(a) * 28, p.y + Math.sin(a) * 28); } c.closePath(); const g = c.createLinearGradient(p.x - 20, p.y - 30, p.x + 20, p.y + 30); g.addColorStop(0, '#fbd999'); g.addColorStop(1, '#be7935'); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#ffd8a0'; c.stroke(); }
  }
  function drawMembrane(c, species, elapsed) {
    background(c, 900, 360);
    const channel = species === 'water' || species === 'glucose', blocked = species === 'starch';
    c.fillStyle = 'rgba(102,165,143,.1)'; c.fillRect(0, 132, 900, 96);
    for (let x = 28; x < 900; x += 27) {
      if (channel && x > 397 && x < 503) continue;
      disk(c, x, 138, 9, '#91cfc1'); disk(c, x, 222, 9, '#91cfc1');
      c.beginPath(); c.moveTo(x - 4, 148); c.lineTo(x - 6, 178); c.moveTo(x + 4, 148); c.lineTo(x + 6, 178); c.moveTo(x - 4, 212); c.lineTo(x - 6, 182); c.moveTo(x + 4, 212); c.lineTo(x + 6, 182); c.strokeStyle = '#678f84'; c.lineWidth = 3; c.stroke();
    }
    if (channel) { round(c, 402, 112, 28, 136, 12, '#5678a4', '#9fc9f2', 2); round(c, 470, 112, 28, 136, 12, '#5678a4', '#9fc9f2', 2); }
    if(blocked){for(let k=0;k<2;k++)drawStarch(c,235+k*425+Math.sin(elapsed*.55+k)*7,65+Math.sin(elapsed*.65+k)*8);return;}
    for (let k = 0; k < 9; k++) {
      const progress = (elapsed * .18 + k / 9) % 1, x = channel ? 450 : 78 + k * 90;
      const y = blocked ? 58 + Math.sin(elapsed * 1.1 + k) * 27 : (k % 2 ? 312 - progress * 270 : 42 + progress * 270);
      if(species==='water')waterMolecule(c,x,y,8,.18*Math.sin(elapsed+k));
      else if(species==='glucose')glucoseUnit(c,x,y,7);
      else disk(c,x,y,4,orange);
    }
  }
  Object.assign(api, { drawDiffusion, drawOsmosis, drawChain, drawMembrane,drawRedCell,waterMolecule,plantGeometry,redCellGeometry,starchGeometry,advanceWater,insideOutline,outlineArea });
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const bi = (zh, en, tag = 'p', cls = '') => `<${tag}${cls ? ` class="${cls}"` : ''} data-zh="${zh}" data-en="${en}">${zh}</${tag}>`;
  const btn = (id, zh, en, cls = 'action-btn') => `<button type="button" id="${id}" class="${cls}" data-zh="${zh}" data-en="${en}">${zh}</button>`;
  const hook = (zh, en) => `<div class="hook-box"><div class="xiaozhen-logo"><img src="assets/characters/xiaozhen/teaching.png" alt="曉臻老師"></div><div class="hook-content">${bi('曉臻老師說：','Ms. Xiaozhen asks:','div','hook-title')}${bi(zh,en,'div','hook-text')}</div></div>`;
  const closure = (zh,en) => bi(zh,en,'div','concept');
  const photo = (path, zh, en, author, source, license, licenseURL, noteZh, noteEn) => `<figure class="photo-card"><img src="${path}" alt="${zh}" data-alt-zh="${zh}" data-alt-en="${en}" loading="lazy"><figcaption>${bi(zh,en,'strong')}${bi(noteZh,noteEn)}</figcaption><div class="photo-credit">${author} · ${license} · <a href="${source}" data-zh="來源" data-en="Source">來源</a><a href="${licenseURL}" data-zh="授權" data-en="License">授權</a>${bi('原圖未變形、未改色；網頁等比例顯示。','No deformation or recoloring; proportionally displayed.','div')}</div></figure>`;
  const tabs = [
    ['材料從哪來？','Where do materials come from?','生命的組成','Materials of life'],
    ['小的變成大的','Small becomes large','小分子與大分子','Small and large molecules'],
    ['是牆，還是門？','A wall or a gateway?','細胞膜的選擇','Selective permeability'],
    ['沒攪拌也散開','Spreading without stirring','擴散作用','Diffusion'],
    ['蔬菜為什麼出水？','Why do vegetables lose water?','滲透作用','Osmosis']
  ];
  $('lessonTabs').innerHTML = tabs.map((t,k) => `<button type="button" class="tab-btn${k === 0 ? ' active' : ''}" data-tab="${k}" aria-pressed="${k === 0}"><span class="tab-main" data-zh="${t[0]}" data-en="${t[1]}">${t[0]}</span><span class="tab-sub" data-zh="${t[2]}" data-en="${t[3]}">${t[2]}</span></button>`).join('');
  const bodies = [
    hook('樹葉、你的手和一杯水，看起來不同，會不會用了相同的材料？','A leaf, your hand, and water look different. Can they share the same building materials?') +
    bi('生命是用什麼組成的？','What is life made of?','h2') + bi('先把層次分清楚：原子不是細胞，小分子也不是一個小生物。','Keep the levels distinct: an atom is not a cell, and a small molecule is not a tiny organism.','p','lead') +
    `<div class="material-path"><article class="material-card"><span class="number">01</span>${bi('原子','Atoms','h3')}<div class="atomic-set"><span>C</span><span>H</span><span>O</span><span>N</span></div>${bi('碳、氫、氧、氮等原子，是生命物質的重要材料。','Carbon, hydrogen, oxygen, and nitrogen atoms are important components of biological matter.')}</article><article class="material-card"><span class="number">02</span>${bi('小分子','Small molecules','h3')}<div class="atomic-set"><span>H₂O</span><span>O₂</span></div>${bi('例如水、氧氣、二氧化碳與葡萄糖；原子依特定方式連接。','Examples include water, oxygen, carbon dioxide, and glucose: atoms joined in specific arrangements.')}</article><article class="material-card"><span class="number">03</span>${bi('大分子','Macromolecules','h3')}${bi('澱粉、蛋白質、核酸等，含有許多原子；部分由小分子單元連接而成。','Starch, proteins, and nucleic acids contain many atoms; some are built from linked smaller units.')}</article><article class="material-card"><span class="number">04</span>${bi('細胞','Cells','h3')}${bi('物質組成膜與胞器等構造，形成能表現生命現象的基本單位。','Materials form membranes and organelles within cells, the basic units capable of life processes.')}</article></div>` +
    photo('assets/biology/photos/elodea_clear_v2.jpg','水蘊草葉細胞｜真實光學顯微照片','Elodea leaf cells | real light micrograph','Juan Carlos Fonseca Mata','https://commons.wikimedia.org/wiki/File:Chloroplasts_-_Microscopic_view_of_Elodea_canadensis.jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','細胞壁圍起的一整格才是一個細胞；綠色小顆粒是葉綠體，不是小分子。','An entire walled compartment is a cell; the green granules are chloroplasts, not small molecules.') +
    closure('原子 → 分子 → 細胞構造 → 細胞。不同層次不能混稱；細胞才是生命的基本單位。','Atoms → molecules → cellular structures → cells. These levels are not interchangeable; the cell is the basic unit of life.'),
    hook('白飯和葡萄糖都和醣類有關，為什麼一個能組成很長的分子？','Rice and glucose both involve carbohydrates. How can small units form a long molecule?') +
    bi('小分子如何變成大分子？','How do small units form large molecules?','h2') +
    `<div class="flow-compare"><article>${bi('葡萄糖 → 澱粉','Glucose → starch','h3')}${bi('許多葡萄糖單元可連接成澱粉。消化時，大分子分解成較小的分子，才方便吸收。','Many glucose units can join to form starch. Digestion breaks macromolecules into smaller molecules suitable for absorption.')}</article><article>${bi('胺基酸 → 蛋白質','Amino acids → proteins','h3')}${bi('蛋白質的基本小單元是胺基酸，不是葡萄糖；不同材料形成不同的大分子。','Proteins are built from amino acids, not glucose. Different building units form different macromolecules.')}</article></div>` +
    `<div class="board">${bi('用手切換：分散的小單元／連接的長鏈','Switch between separate units and a connected chain','h3')}<div class="molecule-tools">${btn('chainSeparate','分散的葡萄糖','Separate glucose units')}${btn('chainJoin','連接成長鏈','Join a long chain')}</div><canvas id="chainCanvas" class="chain-canvas" width="900" height="360" aria-label="葡萄糖單元與長鏈教學模型"></canvas><p id="chainStatus" class="status" aria-live="polite"></p>${bi('原創概念模型：六角形代表葡萄糖單元，不是完整化學結構；只畫長鏈的一小段。按鈕不是實際合成反應。','Original concept model: hexagons stand for glucose units, not full chemical structures. Only a short chain segment is shown; the button is not a real synthesis reaction.','p','model-note')}</div>` +
    closure('「小分子」和「大分子」是相對的材料層次，不是小細胞和大細胞；連接方式也影響物質的性質。','Small molecules and macromolecules are material levels, not small and large cells. Their linkage also affects their properties.'),
    hook('細胞沒有嘴巴，怎麼讓需要的物質進來，又不讓所有東西隨便穿過？','Without a mouth, how does a cell admit useful materials without letting everything pass freely?') +
    bi('細胞膜是牆，還是門？','Is a cell membrane a wall or a gateway?','h2') +
    bi('細胞膜包圍細胞，具有選擇性通透性。能不能通過，不只看大小，也和物質性質、膜上的運輸構造有關。','A cell membrane encloses the cell and is selectively permeable. Passage depends on more than size: chemical properties and membrane transport structures matter.') +
    `<div class="board">${bi('選一種物質，看看通過方式','Choose a material and explore its route','h3')}<div class="molecule-tools">${btn('memOxygen','氧氣','Oxygen')}${btn('memWater','水','Water')}${btn('memGlucose','葡萄糖','Glucose')}${btn('memStarch','澱粉','Starch')}</div><canvas id="membraneCanvas" class="chain-canvas" width="900" height="360" aria-label="細胞膜選擇性通透模型"></canvas><p id="membraneStatus" class="status" aria-live="polite"></p>${bi('原創膜剖面示意，不按真實比例。水的通道與葡萄糖的運輸蛋白在此以簡化通路表示；不是所有小分子都能直接穿膜。','Original membrane cross-section, not to scale. Water channels and glucose transport proteins are simplified pathways here; not every small molecule freely crosses the membrane.','p','model-note')}</div>` +
    closure('細胞膜控制物質進出；不是完全密封，也不是只按分子大小篩選的網子。','The membrane regulates exchange: it is neither sealed shut nor a simple size-only sieve.'),
    hook('一滴顏色放進水裡，沒有攪拌，為什麼最後連遠處也變色？','A drop of dye is added to water without stirring. Why can distant regions eventually become colored?') +
    bi('沒有攪拌，為什麼也會散開？','Why does a substance spread without stirring?','h2') +
    bi('粒子持續做不規則運動。整體看，較濃的地方向較稀的地方淨移動，直到分布較均勻；這是擴散作用。','Particles move randomly all the time. Overall, there is net movement from higher to lower concentration until the distribution becomes more uniform: diffusion.') +
    `<section id="diffusionLab" class="lab" style="--ar:1.6666667"><div class="lab-controls">${bi('擴散實驗臺','Diffusion lab','h3')}${bi('按下加入色素，再比較巨觀與微觀；也可以直接觸碰左側水中，改變加入的位置。','Add dye, then compare the macro and particle views. You can also touch the water on the left to change the starting position.')}<div class="control-row">${btn('diffAdd','加入一滴色素','Add a drop','action-btn primary')}${btn('diffPause','暫停','Pause')}${btn('diffReset','清水重置','Reset to clear water')}</div><div class="control-row">${btn('diffNormal','正常觀察速度','Normal viewing speed')}${btn('diffFast','加速觀察','Accelerated viewing')}${btn('diffFullscreen','⛶ 全螢幕操作','⛶ Expand lab')}</div><div class="readouts"><div class="readout">${bi('微觀左半邊','Left half of particle view','span')}<b id="diffLeft">0</b></div><div class="readout">${bi('微觀右半邊','Right half of particle view','span')}<b id="diffRight">0</b></div></div><p id="diffStatus" class="status" aria-live="polite"></p></div><div class="lab-view"><div class="view-labels">${bi('巨觀：色素分布','Macro: dye distribution','span')}${bi('微觀：溶質粒子模型','Micro: solute particle model','span')}</div><canvas id="diffusionCanvas" width="900" height="540" aria-label="擴散的巨觀與微觀畫面"></canvas>${bi('微觀左右只是等體積區域，沒有隔板；粒子可雙向跨越虛線。分布均勻後仍會運動。','The two halves have equal volume and no partition. Particles cross the dashed line in both directions and keep moving after becoming evenly distributed.','p','lab-caption')}</div></section>` +
    bi('原創定性模型：色素畫面由同一組粒子的平滑區域分布產生。粒子是代表符號，數目不是分子實際總數；時間加速，不模擬滴液對流或實際分子尺度。','Original qualitative model: the dye view is derived from the smoothed distribution of the same particles. Symbols are representative, not the real molecule count. Time is accelerated; drop-induced convection and real molecular scales are not modeled.','p','model-note') +
    closure('平衡 ≠ 停止。濃度相近時，雙向移動仍持續，只是整體沒有持續偏向一側。','Equilibrium does not mean stopping. Random movement continues in both directions without a sustained net movement to one side.'),
    hook('拌小黃瓜時加鹽，明明沒擠它，為什麼會慢慢出水？','Why does salted cucumber release water even when nobody squeezes it?') +
    bi('鹽為什麼能讓蔬菜出水？','Why does salt draw water out of vegetables?','h2') +
    bi('滲透作用是水通過選擇性通透膜的移動。在兩側壓力起初相近、溶質不能穿膜時，水會由較稀的溶液向較濃的溶液淨移動。','Osmosis is water movement across a selectively permeable membrane. With initially similar pressures and an impermeant solute, net water movement is from the more dilute toward the more concentrated solution.') +
    `<section id="osmosisLab" class="lab" style="--ar:1.6666667"><div class="lab-controls">
      ${bi('同樣清水，誰會脹破？','Same water: which cell can burst?','h3')}
      ${bi('必考：植物吸水膨脹，但不脹破；紅血球沒有細胞壁，清水中可脹破。','Exam focus: plant cells swell without bursting; RBCs lack a wall and can burst in fresh water.','p','exam-callout')}
      <div class="control-row cell-mode">${btn('osmPlant','植物細胞','Plant cell')}${btn('osmRedCell','紅血球','Red blood cell')}</div>
      ${bi('選細胞與外液，從相同初始濃度觀察。虛線是起始輪廓；破膜後不會因換水而自動修好。切換條件會用新的完整細胞重做。','Choose a cell and solution, starting at the same initial concentration. Dashes mark its initial outline. Changing conditions starts a new intact cell; a lysed cell is not repaired.')}
      <div class="control-row">${btn('osmPure','清水','Pure water')}${btn('osmSame','與細胞內一樣濃','Same initial concentration')}${btn('osmSalt','較濃的溶液','More concentrated solution')}</div>
      <div class="control-row">${btn('osmPause','暫停','Pause')}${btn('osmReset','重做本條件','Repeat this condition')}${btn('osmFullscreen','⛶ 全螢幕操作','⛶ Expand lab')}</div>
      <div class="readouts"><div class="readout">${bi('細胞內相對水量','Relative cell water content','span')}<b id="osmVolume">100%</b></div><div class="readout">${bi('目前淨移動','Current net movement','span')}<b id="osmDirection"></b></div></div><p id="osmStatus" class="status" aria-live="polite"></p></div>
      <div class="lab-view"><div class="membrane-key"><span id="osmLegend"></span>${bi('橘點：不透膜的溶質示意','Orange: impermeant solute symbols','span')}</div>
      <div class="water-key"><svg viewBox="0 0 80 58" width="80" height="58" role="img" aria-label="水分子示意"><circle cx="19" cy="17" r="12" fill="#f2ecd9"/><circle cx="61" cy="17" r="12" fill="#f2ecd9"/><circle cx="40" cy="34" r="21" fill="#f472b6"/></svg>${bi('米老鼠水分子：粉紅球是氧，兩顆白球是氫。青色粗箭頭只表示方向，不是水管。','Water molecule: pink oxygen with two white hydrogens. Thick cyan arrows indicate direction, not literal pipes.','span')}</div>
      <canvas id="osmosisCanvas" width="900" height="540" aria-label="植物細胞與紅血球滲透比較"></canvas><p id="osmCaption" class="lab-caption"></p><div class="cell-parts" id="osmParts"></div></div></section>` +
    bi('成熟植物細胞：大型中央液胞可佔細胞體積約80～90%，細胞質是周邊薄層，細胞核位在細胞質內，不在液胞中。','Mature plant cells can have a central vacuole occupying about 80–90% of cell volume. Cytoplasm forms a thin peripheral layer, with the nucleus outside the vacuole.','p','exam-callout') +
    bi('原創定性模型、非實拍：這是二維剖面，不能用面積測真實體積。水分子與器官構造不按同一比例。細胞壁只有限度伸展；液胞形變不與水量讀數等比。紅血球模型的破膜門檻與秒數不是生理量測；兩種細胞的顯示比例不同。','Original qualitative model, not a photograph: this two-dimensional section is not a volume measurement. Molecules and organelles are not at one scale. Wall extension is limited; vacuole deformation is not proportional to the water readout. RBC lysis thresholds and timing are not physiological measurements; the two cells use different display scales.','p','model-note') +
    `<div class="flow-compare osmosis-compare"><article>${bi('植物：吸水膨壓，不會像紅血球脹破','Plant: turgor, not RBC-style lysis','h3')}${bi('清水使液胞膨大、細胞膜貼緊細胞壁。細胞壁支撐膨壓，限制繼續吸水；水仍雙向移動。較濃外液會讓原生質體縮小，細胞壁不跟著縮小。','Fresh water enlarges the vacuole and presses the membrane against the wall. Wall-supported pressure limits uptake while water moves both ways. Concentrated outside solution shrinks the protoplast, not the wall.')}</article><article>${bi('紅血球：吸水 → 膨脹 → 溶血','RBC: uptake → swelling → hemolysis','h3')}${bi('人類成熟紅血球沒有細胞壁、沒有細胞核，也沒有植物式大液胞。清水中可吸水膨脹至破膜，血紅素釋出，稱為溶血；等濃度時大致維持雙凹圓盤，較濃外液時失水皺縮。','Mature human RBCs have no wall, nucleus, or large plant vacuole. In fresh water they may swell until the membrane ruptures, releasing hemoglobin: hemolysis. Isotonic conditions preserve the biconcave disc; concentrated outside solution causes crenation.')}</article></div>` +
    photo('assets/biology/photos/blood_smear_org_v1.jpg','紅血球觀察參考｜真實光學染色塗片','RBC observation reference | real stained light micrograph','Berkshire Community College Bioscience Image Library','https://commons.wikimedia.org/wiki/File:Connective_Tissue_Human_Blood_(39982278130).jpg','CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/','找大量淡粉紅、中央較淡而沒有深色細胞核的紅血球。此圖為來源100×、H&E染色塗片，不是清水溶血連拍；有深色細胞核的白血球不要認成紅血球。','Find numerous pale-pink RBCs with paler centers and no dark nuclei. This source is a 100× H&E-stained smear, not a sequence of freshwater hemolysis. Nucleated white blood cells are different.') +
    photo('assets/biology/photos/plasmolysis_rhoeo_v1.jpg','質壁分離｜真實光學顯微照片','Plasmolysis | real light micrograph','Krishna satya 333','https://commons.wikimedia.org/wiki/File:Observation_of_the_plasma_membrane_during_plasmolysis_in_Rhio_leaf_cells.jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','找細胞壁內縮小的紫色原生質體，以及它與細胞壁之間的空隙。不要把紫色當作所有植物細胞的通用顏色。','Find the shrunken purple protoplast and the gap between it and the cell wall. Purple is not the universal color of plant cells.') +
    `<details class="notes"><summary data-zh="考點整理：擴散和滲透怎麼分？" data-en="Exam focus: diffusion or osmosis?">考點整理：擴散和滲透怎麼分？</summary><div class="flow-compare"><article>${bi('擴散','Diffusion','h3')}${bi('看某種物質如何從較濃處向較稀處淨移動；不一定要有細胞膜。','Follow a substance moving net from higher to lower concentration; a cell membrane is not always required.')}</article><article>${bi('滲透','Osmosis','h3')}${bi('重點是「水」與「選擇性通透膜」。比較的是膜兩側的條件，不是說溶質穿進細胞。','Look for water and a selectively permeable membrane. Compare conditions across the membrane; do not confuse this with solute entering the cell.')}</article></div></details>` +
    closure('鹽讓外液變濃，水由細胞內向外淨移動；植物細胞膜可離開細胞壁。換清水後，細胞可重新吸水。','Salt makes the external solution more concentrated, producing net water loss and possible separation of membrane from wall. In fresh water, the cell can take up water again.')
  ];
  $('lessons').innerHTML = bodies.map((body,k) => `<section class="lesson" id="lesson${k}"${k ? ' hidden' : ''}>${body}</section>`).join('');
  // Photographs remain photographs: pan and pinch change only the display.
  document.querySelectorAll('.photo-card').forEach((card,index)=>{
    const image=card.querySelector('img'), view=document.createElement('div'); view.className='photo-viewport'; view.tabIndex=0;
    image.parentNode.insertBefore(view,image);view.appendChild(image);
    const reset=document.createElement('button');reset.type='button';reset.className='action-btn';reset.dataset.zh='照片回原圖';reset.dataset.en='Reset photograph';reset.textContent='照片回原圖';card.appendChild(reset);
    const hint=document.createElement('p');hint.className='model-note';hint.dataset.zh='單指拖曳、雙指縮放；只是數位放大，不是新拍攝倍率。';hint.dataset.en='Drag with one finger; pinch with two. Digital zoom is not a new microscope magnification.';hint.textContent=hint.dataset.zh;card.appendChild(hint);
    const points=new Map();let zoom=1,x=0,y=0,lastCenter=null,lastDistance=0;
    function paint(){const r=view.getBoundingClientRect();const maxX=r.width*(zoom-1)/2,maxY=r.height*(zoom-1)/2;x=clamp(x,-maxX,maxX);y=clamp(y,-maxY,maxY);image.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;}
    function geometry(){const a=[...points.values()];return a.length>1?{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}:a.length?{...a[0],d:0}:null;}
    view.addEventListener('pointerdown',e=>{e.preventDefault();view.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});lastCenter=geometry();lastDistance=lastCenter.d;});
    view.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=geometry();if(lastCenter){x+=g.x-lastCenter.x;y+=g.y-lastCenter.y;if(g.d&&lastDistance)zoom=clamp(zoom*g.d/lastDistance,1,4);}lastCenter=g;lastDistance=g.d;paint();});
    const release=e=>{points.delete(e.pointerId);lastCenter=geometry();lastDistance=lastCenter?.d||0;};view.addEventListener('pointerup',release);view.addEventListener('pointercancel',release);
    view.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.002),1,4);paint();},{passive:false});
    reset.addEventListener('click',()=>{zoom=1;x=0;y=0;points.clear();paint();});
    view.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){zoom=clamp(zoom+.25,1,4);paint();}if(e.key==='-'){zoom=clamp(zoom-.25,1,4);paint();}if(e.key==='Home'){zoom=1;x=0;y=0;paint();}});
  });
  let lang = 'zh', current = 0, raf = 0, last = 0, linked = false, species = 'oxygen', memTime = 0;
  let diff = makeDiffusion(), diffAdded = false, diffPaused = false, speed = 1;
  let osm = makeOsmosis(1), osmPaused = false, expanded = null, cellType='plant';
  const tr = (zh,en) => lang === 'zh' ? zh : en;
  function text(id, zh, en) { $(id).textContent = tr(zh,en); }
  function active(ids, chosen) { ids.forEach(id => { $(id).classList.toggle('active', id === chosen); $(id).setAttribute('aria-pressed', String(id === chosen)); }); }
  function updateStatus() {
    const counts = diffusionCounts(diff); $('diffLeft').textContent = diffAdded ? counts.left : 0; $('diffRight').textContent = diffAdded ? counts.right : 0;
    const difference = Math.abs(counts.left - counts.right);
    text('diffStatus', !diffAdded ? '目前是清水。請加入色素。' : difference < 40 ? '分布已較均勻，粒子仍在運動；瞬間數量仍會起伏。' : '觀察兩邊的粒子數量；擴散不需要攪拌。', !diffAdded ? 'Clear water. Add dye to begin.' : difference < 40 ? 'The distribution is more uniform, but particles still move and counts fluctuate.' : 'Compare particle counts on the two sides. Diffusion needs no stirring.');
    $('osmVolume').textContent = osm.lysed?tr('已破膜','Lysed'):`${Math.round(osm.volume * 100)}%`;
    const plant=cellType==='plant',drive=plant?osmoticDrive(osm):redCellDrive(osm),direction=drive>.025?'in':drive<-.025?'out':'balanced';
    text('osmDirection',osm.lysed?'膜已失去完整性':direction==='in'?'淨流入':direction==='out'?'淨流出':'接近平衡',osm.lysed?'Membrane ruptured':direction==='in'?'Net in':direction==='out'?'Net out':'Near balance');
    text('osmStatus',plant?(osm.external===0?'清水：液胞膨大、膜貼緊壁；壁的支撐膨壓使吸水減慢，不會脹破。':osm.external===1?'等濃度：水仍雙向移動，相對水量大致不變。':'較濃外液：水淨流出，液胞及原生質體縮小，細胞壁不跟著縮小。'):osm.lysed?'溶血：膜破裂，血紅素向周圍溶液擴散；不是爆炸，也不是細胞核飛出來。':osm.external===0?'清水：紅血球吸水膨脹，中央凹陷漸消失；繼續觀察到破膜。':osm.external===1?'等濃度：紅血球維持雙凹圓盤，水仍雙向移動。':'較濃外液：紅血球失水，逐漸皺縮。',plant?(osm.external===0?'Fresh water: vacuole expansion presses membrane against wall. Wall-supported turgor limits uptake without lysis.':osm.external===1?'Equal concentration: water moves both ways with little net change.':'Concentrated outside: vacuole and protoplast shrink; wall does not.'):osm.lysed?'Hemolysis: membrane ruptures and hemoglobin disperses. No explosion or ejected nucleus.':osm.external===0?'Fresh water: swelling reduces the central depression. Keep watching for membrane rupture.':osm.external===1?'Isotonic: the RBC remains a biconcave disc while water moves both ways.':'Concentrated outside: the RBC loses water and crenates.');
    text('osmLegend',plant?'淡綠：細胞壁 · 青色：細胞膜':'紅色：紅血球 · 淡紅邊界：細胞膜（沒有細胞壁）',plant?'Pale green: wall · Cyan: membrane':'Red: RBC · Pale red boundary: membrane (no wall)');
    text('osmCaption',plant?(osm.external===0?'看淡紫液胞超過內側起始虛線：吸水會膨大，但細胞壁支撐，植物細胞不脹破。':osm.external===1?'等濃度：液胞維持接近起始虛線；切清水可看吸水膨大但不脹破，切較濃外液可看失水縮小。':'較濃外液：淡紫液胞縮到內側起始虛線以內，膜與細胞壁分開；細胞壁不跟著縮。')+'外側虛線是起始細胞壁。米老鼠水分子持續雙向穿過細胞壁、細胞膜。':'完整膜時，米老鼠水分子雙向跨膜。破膜後不再畫正常滲透箭頭，而顯示血紅素擴散及膜殘影。',plant?(osm.external===0?'The pale vacuole expands beyond its inner dashed starting outline. The wall supports swelling without bursting. ':osm.external===1?'The vacuole stays near its starting outline. Choose fresh water for swelling without bursting, or concentrated solution for shrinking. ':'The vacuole shrinks inside its starting outline; membrane separates from wall, which does not shrink. ')+'Outer dashes mark the starting wall. Water moves both ways through wall and membrane.':'Across an intact membrane, water moves both ways. After rupture, arrows stop and hemoglobin disperses around a membrane ghost.');
    text('osmParts',plant?'紫色圓體：細胞核（在細胞質內） · 淡紫大區：液胞 · 綠色橢圓：葉綠體':'人類成熟紅血球：無細胞核、無細胞壁、無葉綠體、無植物式大液胞。',plant?'Purple oval: nucleus in cytoplasm · Large pale violet region: vacuole · Green ovals: chloroplasts':'Mature human RBC: no nucleus, wall, chloroplasts, or large plant vacuole.');
    text('chainStatus', linked ? '連接的葡萄糖單元：示意澱粉長鏈的一小段。' : '分散的葡萄糖單元：每一個六角形是一個小分子符號。', linked ? 'Linked glucose units: a short segment of a starch chain.' : 'Separate glucose units: each hexagon represents a small molecule.');
    const messages = { oxygen: ['氧氣可透過膜脂質層擴散，雙向移動。','Oxygen can diffuse through the lipid layer in both directions.'], water: ['水可通過細胞膜；許多細胞利用水通道加快通過。','Water crosses membranes; many cells use water channels to speed passage.'], glucose: ['葡萄糖通常需要膜上的運輸蛋白協助，不能只因為是小分子就直接穿過。','Glucose usually needs a transport protein; being small does not guarantee free passage.'], starch: ['澱粉不能像氧氣一樣直接穿過這個膜模型；通常須先分解成較小單元。','Starch cannot simply pass through this membrane model like oxygen; digestion first breaks it into smaller units.'] };
    text('membraneStatus', ...messages[species]);
    if(species==='starch')text('membraneStatus','大型澱粉由大量葡萄糖單元相連，不能直接穿過此膜。這裡畫支鏈澱粉局部結構，澱粉也含直鏈成分；不是幾顆獨立小粒子，也不是完整分子的真實比例。','Large starch polymers contain many linked glucose units and cannot cross this membrane directly. This branched fragment represents amylopectin; starch also contains amylose. It is neither separate small particles nor a complete molecule drawn to scale.');
    text('diffPause',diffPaused ? '繼續' : '暫停',diffPaused ? 'Resume' : 'Pause');
    text('osmPause',osmPaused ? '繼續' : '暫停',osmPaused ? 'Resume' : 'Pause');
  }
  function draw() {
    if (current === 1) drawChain($('chainCanvas').getContext('2d'), linked);
    if (current === 2) drawMembrane($('membraneCanvas').getContext('2d'), species, memTime);
    if (current === 3) { if (diffAdded) drawDiffusion($('diffusionCanvas').getContext('2d'), diff); else drawDiffusion($('diffusionCanvas').getContext('2d'), {particles:[]}); }
    if (current === 4) (cellType==='plant'?drawOsmosis:drawRedCell)($('osmosisCanvas').getContext('2d'), osm);
    updateStatus();
  }
  function tick(now) {
    raf = 0; const dt = last ? Math.min(.05, Math.max(0, (now - last) / 1000)) : 0; last = now;
    if (current === 2) memTime += dt;
    if (current === 3 && diffAdded && !diffPaused) stepDiffusion(diff, dt * speed);
    if (current === 4 && !osmPaused){const rates=cellType==='plant'?osmoticRates(osm):redCellRates(osm);advanceWater(osm,dt,rates);(cellType==='plant'?stepOsmosis:stepRedCell)(osm,dt);}
    draw(); if (!document.hidden && current >= 2) raf = requestAnimationFrame(tick);
  }
  function schedule() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; draw(); if (current >= 2 && !document.hidden) raf = requestAnimationFrame(tick); }
  function exitLab() { if (expanded) { expanded.classList.remove('is-expanded'); expanded = null; document.body.classList.remove('lab-open'); updateFullButtons(); } }
  function updateFullButtons() { for (const [id, labID] of [['diffFullscreen','diffusionLab'],['osmFullscreen','osmosisLab']]) { const open = expanded === $(labID); text(id, open ? '⛶ 返回頁面' : '⛶ 全螢幕操作', open ? '⛶ Return to page' : '⛶ Expand lab'); $(id).setAttribute('aria-expanded', String(open)); } }
  function full(labID) { const lab = $(labID); if (expanded === lab) return exitLab(); exitLab(); expanded = lab; lab.classList.add('is-expanded'); document.body.classList.add('lab-open'); updateFullButtons(); }
  function switchTab(k) { exitLab(); current = k; bodies.forEach((_,i) => { $('lesson' + i).hidden = i !== k; }); document.querySelectorAll('[data-tab]').forEach((b,i) => { b.classList.toggle('active', i === k); b.setAttribute('aria-pressed', String(i === k)); }); schedule(); }
  function setLang(next) {
    lang = next; document.documentElement.lang = next === 'zh' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-zh][data-en]').forEach(el => { el.textContent = el.dataset[next]; });
    document.querySelectorAll('[data-alt-zh]').forEach(el => { el.alt = next === 'zh' ? el.dataset.altZh : el.dataset.altEn; });
    document.querySelectorAll('img').forEach(el=>{if(!el.dataset.altZh)el.alt=tr('曉臻老師','Ms. Xiaozhen');});
    const canvasLabels={chainCanvas:['葡萄糖單元與長鏈教學模型','Glucose units and a molecular-chain concept model'],membraneCanvas:['細胞膜選擇性通透模型','Selective membrane permeability model'],diffusionCanvas:['擴散的巨觀與微觀畫面','Macro and micro diffusion views'],osmosisCanvas:['植物細胞膨脹不脹破與紅血球溶血比較模型','Plant swelling without bursting and RBC hemolysis comparison']};
    for(const [id,labels] of Object.entries(canvasLabels))$(id).setAttribute('aria-label',tr(...labels));
    document.querySelectorAll('.water-key').forEach(el=>el.querySelector('svg').setAttribute('aria-label',tr('水分子示意','Water molecule symbol')));
    document.querySelectorAll('[data-language]').forEach(b => { const on = b.dataset.language === next; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    $('introScreen').setAttribute('aria-label',tr('進入生命的材料與細胞膜教材','Enter the materials-of-life lesson'));
    $('lessonTabs').setAttribute('aria-label',tr('五個主分頁','Five main lesson tabs'));
    document.querySelectorAll('.floating-lang-container').forEach(el=>el.setAttribute('aria-label',tr('語言切換','Language selection')));
    document.title = tr('生命的材料與細胞膜｜Physical-Boys','The materials of life and cell membranes | Physical-Boys');
    updateFullButtons(); schedule();
  }
  const on = (id, fn) => $(id).addEventListener('click',fn);
  $('introScreen').addEventListener('click', () => { $('introScreen').hidden = true; });
  document.querySelectorAll('[data-language]').forEach(b => b.addEventListener('click',() => setLang(b.dataset.language)));
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click',() => switchTab(Number(b.dataset.tab))));
  on('chainSeparate',()=>{linked=false;active(['chainSeparate','chainJoin'],'chainSeparate');draw();});
  on('chainJoin',()=>{linked=true;active(['chainSeparate','chainJoin'],'chainJoin');draw();});
  for (const [id,value] of [['memOxygen','oxygen'],['memWater','water'],['memGlucose','glucose'],['memStarch','starch']]) on(id,()=>{species=value;active(['memOxygen','memWater','memGlucose','memStarch'],id);draw();});
  function addDye(x=.16,y=.48) { diff=makeDiffusion(x,y);diffAdded=true;diffPaused=false;schedule(); }
  on('diffAdd',()=>addDye()); on('diffReset',()=>{diff=makeDiffusion();diffAdded=false;diffPaused=false;draw();});
  on('diffPause',()=>{diffPaused=!diffPaused;draw();});
  on('diffNormal',()=>{speed=1;active(['diffNormal','diffFast'],'diffNormal');});
  on('diffFast',()=>{speed=4;active(['diffNormal','diffFast'],'diffFast');});
  $('diffusionCanvas').addEventListener('pointerdown',e=>{const r=$('diffusionCanvas').getBoundingClientRect(),x=(e.clientX-r.left)*900/r.width,y=(e.clientY-r.top)*540/r.height;if(x>=109&&x<=369&&y>=204&&y<=429)addDye(clamp((x-109)/260,.05,.95),clamp((y-204)/225,.05,.95));});
  function newOsm(value){return cellType==='plant'?makeOsmosis(value):makeRedCell(value);}
  function selectOsm(value,id) { osm=newOsm(value);osmPaused=false;active(['osmPure','osmSame','osmSalt'],id);schedule(); }
  function selectCell(type){cellType=type;osm=newOsm(osm.external);osmPaused=false;active(['osmPlant','osmRedCell'],type==='plant'?'osmPlant':'osmRedCell');schedule();}
  on('osmPlant',()=>selectCell('plant'));on('osmRedCell',()=>selectCell('redcell'));
  on('osmPure',()=>selectOsm(0,'osmPure'));on('osmSame',()=>selectOsm(1,'osmSame'));on('osmSalt',()=>selectOsm(2,'osmSalt'));
  on('osmReset',()=>{osm=newOsm(osm.external);osmPaused=false;schedule();});on('osmPause',()=>{osmPaused=!osmPaused;draw();});
  on('diffFullscreen',()=>full('diffusionLab'));on('osmFullscreen',()=>full('osmosisLab'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){exitLab();$('introScreen').hidden=true;}if(e.key==='Enter'&&document.activeElement===$('introScreen'))$('introScreen').hidden=true;});
  document.addEventListener('visibilitychange',schedule);
  active(['chainSeparate','chainJoin'],'chainSeparate');active(['memOxygen','memWater','memGlucose','memStarch'],'memOxygen');active(['diffNormal','diffFast'],'diffNormal');active(['osmPure','osmSame','osmSalt'],'osmSame');
  active(['osmPlant','osmRedCell'],'osmPlant');
  Object.assign(api,{switchTab,setLang,addDye,getState:()=>({current,lang,diff,osm,diffAdded,diffPaused,osmPaused,raf,linked,species,cellType}),setOsmosis:selectOsm,selectCell,exitLab});
  schedule();
})(typeof globalThis !== 'undefined' ? globalThis : window);

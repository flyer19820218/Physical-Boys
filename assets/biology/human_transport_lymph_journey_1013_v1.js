/* Teacher-authorised lymph lesson · redrawn 2026-10-14.
 * Overview map → capillary close-up → lymphatic-entry close-up → venous return.
 * Every picture is an original Canvas drawing; no textbook or web figure is
 * traced or displayed. Plasma water and small solutes seep out of capillaries
 * into spaces between cells (tissue fluid), slip through inward-opening flaps
 * into blind-ended lymph capillaries (lymph), pass lymph nodes and re-enter
 * the neck veins → superior vena cava → right atrium. Red cells never leave a
 * vessel. One shared LivingBook clock; times and scales are pedagogical.
 */
(function(root){
  'use strict';
  const C=root.HumanTransportCutaways;
  const P=(zh,en)=>[zh,en],BG='#11261f',INK='#f2ecd9',CYAN='#55e9ff',GREEN='#a6df80',ARROW_GREEN='#4ade80',YELLOW='#fde047',MUTED='#b9cbbd',VEIN_LABEL='#df8794';
  const clamp=n=>Math.max(0,Math.min(1,n)),mod=(n,d=1)=>((n%d)+d)%d,mix=(a,b,u)=>a+(b-a)*u,smooth=u=>{u=clamp(u);return u*u*(3-2*u);};
  const scatter=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const curve=(pts,n)=>C.geometry.curve(pts,n),at=C.geometry.at;
  const STEPS=Object.freeze([
    {id:0,name:P('先看全圖','Whole map'),duration:10,
      title:P('先看全圖：血漿 → 組織液 → 淋巴','The whole map: plasma → tissue fluid → lymph'),
      text:P('先找小動脈、微血管網與小靜脈：血液沿這條路流，紅血球一直留在血管裡。綠色的管道是淋巴管，伸進組織的起點是封閉的盲端，不和血管相通。\n\n藍色箭頭：血漿中的部分水與小分子由微血管滲出，到細胞之間成為組織液。綠色箭頭：組織液再滲入淋巴管，成為淋巴。淋巴最後經由靜脈回到血液。這是本站重畫的示意圖，大小與顏色用來區分構造，不是實際比例。',
        'Find the arteriole, capillary network and venule: blood follows this route and red cells stay inside the vessels. The green vessels are lymphatics; their starting ends in the tissue are closed blind ends, not connected to blood vessels.\n\nBlue arrows: some water and small solutes seep out of capillaries into spaces between cells as tissue fluid. Green arrows: tissue fluid seeps into lymphatics and becomes lymph, which finally returns to the blood through veins. This is a redrawn teaching diagram; sizes and colours identify structures and are not to scale.')},
    {id:1,name:P('放大微血管','Capillary close-up'),duration:12,
      title:P('放大一小段：水與小分子穿過微血管壁','A local close-up: water and small solutes cross the wall'),
      text:P('左邊是全圖與黃框；右邊是同一觀察位置的放大卡通，不是另一套循環。微血管壁主要由一層內皮細胞構成。這裡用放大的細胞間隙，示意水與小分子在壓力作用下由血漿進入細胞間，形成組織液。\n\n不是血管破裂，也不是整份血漿全漏出來。正常紅血球留在血管內，多數大蛋白也不會像水一樣自由通過；圖中的間隙與分子都不是實際比例。不同組織的微血管通透性也不完全相同。',
        'The whole map and yellow frame are on the left. The right-hand cartoon enlarges that observation site; it is not a different circulation. A capillary wall consists mainly of one endothelial-cell layer. Enlarged junction gaps represent pressure-driven passage of water and small solutes from plasma into spaces between cells, forming tissue fluid.\n\nThis is not a ruptured vessel or loss of all plasma. Normal red cells stay inside; most large proteins do not cross as freely as water. Gaps and molecules are not to scale, and permeability varies between tissues.')},
    {id:2,name:P('進入淋巴管','Into lymphatics'),duration:12,
      title:P('再放大盲端：組織液從「小門」滲入淋巴管','Closer: tissue fluid seeps in through flap doors'),
      text:P('淋巴管的起點是封閉的盲端，管壁由一層細胞構成，相鄰細胞的邊緣互相重疊。組織間的壓力比管內高時，重疊的邊緣被推開，像只往內開的小門，細胞之間的組織液慢慢滲進去；壓力反過來時，小門闔上，淋巴不會倒流回組織。\n\n液體不是從遠處直接飛進管內，而是在細胞之間一點一點移動，再從管壁的縫隙進入。在細胞之間叫組織液，進入淋巴管後才叫淋巴；之後沿著淋巴管流向較大的淋巴管。',
        'A lymphatic begins as a closed blind end. Its wall is one cell layer, and neighbouring cell edges overlap. When pressure in the tissue is higher than inside the vessel, the overlapping edges are pushed open like doors that only swing inward, and tissue fluid between the cells seeps in. When the pressure difference reverses, the doors close, so lymph does not flow back into the tissue.\n\nThe fluid does not fly in from far away; it moves gradually between cells and enters through gaps in the wall. Between cells it is tissue fluid; inside the lymphatic it is lymph, which then flows on to larger lymphatic vessels.')},
    {id:3,name:P('回到大靜脈','Back to vena cava'),duration:12,
      title:P('接上回程：淋巴管、淋巴結，再回到靜脈','The return: lymphatic vessels, nodes, then veins'),
      text:P('離開組織區後，淋巴沿較大的淋巴管運送，途中經過淋巴結。肌肉活動、呼吸及淋巴管本身的收縮等協助流動，管內瓣膜幫助維持單向；不是淋巴結充當幫浦把液體吸進去。\n\n淋巴最後注入頸根部的靜脈，接著隨靜脈血經上大靜脈回右心房。左側全圖是局部組織，右側是較遠處的回程示意，大小與距離不可直接相比。血漿 → 組織液 → 淋巴 → 靜脈血：位置換了，名稱跟著改變。',
        'Beyond the tissue region, lymph travels in larger lymphatic vessels and passes through lymph nodes. Muscle activity, breathing and lymphatic contractions help movement; valves help prevent backflow. A lymph node is not a suction pump.\n\nLymph enters veins at the root of the neck, then travels with venous blood through the superior vena cava to the right atrium. The map on the left shows local tissue; the right is a distant return route at a different scale. Plasma → tissue fluid → lymph → venous blood: the name changes with location.')}
  ]);
  const TOTAL=STEPS.reduce((n,s)=>n+s.duration,0);
  function phase(s,t){
    let elapsed=Math.max(0,t-(s.lymphStarted||0));
    if(s.lymphStep!=='auto'&&s.lymphStep!==undefined){const step=STEPS[Math.max(0,Math.min(3,Number(s.lymphStep)||0))];return{step,elapsed,auto:false};}
    elapsed%=TOTAL;for(const step of STEPS){if(elapsed<step.duration)return{step,elapsed,auto:true};elapsed-=step.duration;}
    return{step:STEPS[0],elapsed:0,auto:true};
  }

  // ── drawing helpers ───────────────────────────────────────────────────────
  const font=size=>`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;
  function text(ctx,D,p,x,y,size=22,color=INK,align='left'){ctx.save();ctx.font=font(size);ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(D.tr(p),x,y);ctx.restore();}
  function lines(ctx,D,p,w,size=22){ctx.save();ctx.font=font(size);const str=D.tr(p),units=/\s/.test(str)?str.split(/\s+/).map(a=>a+' '):Array.from(str),out=[];let row='';
    for(const u of units){if(row&&ctx.measureText(row+u).width>w){out.push(row.trim());row=u;}else row+=u;}if(row)out.push(row.trim());ctx.restore();return out;}
  function wrap(ctx,D,p,x,y,w,size=22,color=INK,align='left'){const rows=lines(ctx,D,p,w,size);rows.forEach((r,i)=>text(ctx,D,[r,r],x,y+28*i,size,color,align));return rows.length;}
  function chip(ctx,D,p,x,y,color=INK,align='left'){ctx.save();ctx.font=font(22);const w=ctx.measureText(D.tr(p)).width,left=align==='right'?x-w:align==='center'?x-w/2:x;
    ctx.fillStyle='rgba(17,38,31,.84)';ctx.beginPath();ctx.roundRect(left-7,y-21,w+14,29,8);ctx.fill();ctx.restore();text(ctx,D,p,x,y,22,color,align);}
  function stroke(ctx,pts,color,w){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0],p[1]));ctx.stroke();ctx.restore();}
  function arrow(ctx,pts,color,w=2.5,head=8){stroke(ctx,pts,color,w);const n=pts.length,a=pts[n-2],b=pts[n-1],ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
    ctx.save();ctx.translate(b[0],b[1]);ctx.rotate(ang);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(head*.9,0);ctx.lineTo(-head*.65,-head*.65);ctx.lineTo(-head*.65,head*.65);ctx.closePath();ctx.fill();ctx.restore();}
  function pointOn(pts,u){let total=0;const seg=[];for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);total+=l;}
    let d=clamp(u)*total,i=0;while(i<seg.length-1&&d>seg[i]){d-=seg[i];i++;}const f=seg[i]?d/seg[i]:0,a=pts[i],b=pts[i+1];return{x:mix(a[0],b[0],f),y:mix(a[1],b[1],f)};}
  const poly=route=>route.samples.map(p=>[p.x,p.y]);
  function ellipse(ctx,x,y,rx,ry,fill,strokeColor,rot=0){ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(strokeColor){ctx.strokeStyle=strokeColor;ctx.lineWidth=2;ctx.stroke();}}
  function tissueCell(ctx,x,y,r,rot){
    const g=ctx.createRadialGradient(x-r*.3,y-r*.35,1,x,y,r);g.addColorStop(0,'#fbf1c6');g.addColorStop(.7,'#ecdca0');g.addColorStop(1,'#c9b779');
    ellipse(ctx,x,y,r,r*.86,g,'#b4a26a',rot);ellipse(ctx,x+r*.12,y-r*.05,r*.3,r*.26,'#e6a0a0',null,rot);
  }
  function droplet(ctx,x,y,r,alpha=1){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x-r*.35,y-r*.35,.5,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#9fe6ff');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}

  // ── the whole-map model, in its own 800 × 400 coordinates ────────────────
  // Arteriole rises on the left, venule descends on the right, the capillary
  // network joins them; green blind-ended lymph capillaries lie between the
  // blood capillaries and drain into a collecting lymphatic that leaves right.
  function nearY(route,y){return route.samples.reduce((b,p)=>Math.abs(p.y-y)<Math.abs(b.y-y)?p:b);}
  function nearX(route,x){return route.samples.reduce((b,p)=>Math.abs(p.x-x)<Math.abs(b.x-x)?p:b);}
  const ARTERIOLE=curve([[150,412],[160,280],[186,120],[206,-12]],60);
  const VENULE=curve([[598,-12],[610,120],[640,280],[652,412]],60);
  const CAPS=[[66,58,-34],[146,138,28],[226,218,-24],[300,292,20]].map(([ay,vy,w])=>{const a=nearY(ARTERIOLE,ay),v=nearY(VENULE,vy);
    return curve([[a.x,a.y],[a.x+150,a.y+w],[v.x-150,v.y-w],[v.x,v.y]],60);});
  const LINKS=[[0,.36,1,.44],[0,.70,1,.64],[1,.28,2,.36],[1,.56,2,.66],[2,.46,3,.40],[2,.80,3,.74]].map(([i,u,j,v])=>{
    const a=at(CAPS[i],CAPS[i].length*u),b=at(CAPS[j],CAPS[j].length*v);
    return {route:curve([[a.x,a.y],[mix(a.x,b.x,.3)+12,mix(a.y,b.y,.3)],[mix(a.x,b.x,.7)-12,mix(a.y,b.y,.7)],[b.x,b.y]],24),oxygen:1-.75*(u+v)/2};});
  const COLLECT=curve([[214,358],[420,372],[600,346],[812,352]],80);
  const TIPS=Object.freeze([[262,258],[318,100],[430,180],[512,100],[572,258]]);
  const LCAPS=TIPS.map(([x,y],i)=>{const e=nearX(COLLECT,x+26+(i%2?12:0));return curve([[x,y],[x-16,y+(e.y-y)*.35],[e.x+12,y+(e.y-y)*.62],[e.x,e.y]],40);});
  const GAP_POINT=[92,214];
  const CELLS=(()=>{const out=[];let n=0;for(let gy=18;gy<420;gy+=46){const row=Math.round(gy/46);
    for(let gx=row%2?44:18;gx<820;gx+=52){n++;const x=gx+(scatter(n*3)-.5)*14,y=gy+(scatter(n*3+1)-.5)*12;
      if(Math.hypot(GAP_POINT[0]-x,GAP_POINT[1]-y)<30)continue;out.push({x,y,r:17+5*scatter(n*3+2),rot:scatter(n*7)*3});}}return out;})();
  function sideArrow(route,u,side,inward,len=30){
    // inward=false: from the vessel wall out into the tissue; true: from the
    // tissue to just outside a lymph-capillary wall.
    const d=route.length*u,p=at(route,d),wall=at(route,d,side*(inward?11:6)),n=[wall.x-p.x,wall.y-p.y],k=Math.hypot(...n)||1,nx=n[0]/k,ny=n[1]/k;
    const tx=Math.cos(p.angle),ty=Math.sin(p.angle),far=[wall.x+nx*len+tx*(inward?-8:8),wall.y+ny*len+ty*(inward?-8:8)];
    const mid=[mix(wall.x,far[0],.5)+tx*5,mix(wall.y,far[1],.5)+ty*5];
    return inward?[far,mid,[wall.x,wall.y]]:[[wall.x,wall.y],mid,far];
  }
  const LEAKS=[[0,.30,1],[0,.62,-1],[1,.46,-1],[2,.26,1],[2,.60,-1],[3,.50,1],[3,.22,-1]].map(([k,u,s])=>sideArrow(CAPS[k],u,s,false));
  const ENTRIES=[[0,.30,1],[1,.18,-1],[1,.62,1],[2,.38,-1],[3,.22,1],[4,.34,-1],[4,.62,1]].map(([k,u,s])=>sideArrow(LCAPS[k],u,s,true));
  function bloodTube(ctx,route,r,oxygenA,oxygenB){
    const ss=route.samples;stroke(ctx,poly(route),'#521722',r*2+3.5);
    for(let i=1;i<ss.length;i++){const u=i/ss.length,o=mix(oxygenA,oxygenB,u);stroke(ctx,[[ss[i-1].x,ss[i-1].y],[ss[i].x,ss[i].y]],`rgb(${Math.round(mix(132,214,o))},${Math.round(mix(34,58,o))},${Math.round(mix(52,58,o))})`,r*2);}
  }
  function bigVessel(ctx,route,r,fill,light){stroke(ctx,poly(route),'#4d1520',r*2+5);stroke(ctx,poly(route),fill,r*2);
    stroke(ctx,route.samples.map(p=>[p.x+p.nx*r*.42,p.y+p.ny*r*.42]),light,r*.5);}
  function drawMap(ctx,t){
    ctx.save();ctx.beginPath();ctx.roundRect(0,0,800,400,18);ctx.fillStyle='#2b5446';ctx.fill();ctx.clip();
    for(const c of CELLS)tissueCell(ctx,c.x,c.y,c.r,c.rot);
    // Lymph capillaries are blind tubes: round closed tips, joined to the collector.
    const lymph=[COLLECT,...LCAPS],rad=r=>r===COLLECT?9.5:7.2;
    for(const r of lymph)stroke(ctx,poly(r),'#3f6b35',rad(r)*2+4);
    for(const r of lymph)stroke(ctx,poly(r),'#8cbb6b',rad(r)*2);
    for(const r of lymph)stroke(ctx,poly(r).map(p=>[p[0]-1.5,p[1]-1.5]),'#c6e09e',rad(r)*.7);
    for(const [i,r] of LCAPS.entries())for(let k=0;k<2;k++)droplet(ctx,...Object.values(pointOn(poly(r),mod(t*.07+k/2+i*.17))),3.1);
    for(let k=0;k<6;k++){const p=pointOn(poly(COLLECT),mod(t*.05+k/6));droplet(ctx,p.x,p.y,3.4);}
    for(const l of LINKS)bloodTube(ctx,l.route,3.4,l.oxygen,l.oxygen);
    for(const c of CAPS)bloodTube(ctx,c,3.8,1,0);
    for(const [k,c] of CAPS.entries())C.geometry.cells(c,t+k*.7,[0],19,12,3.1).forEach(p=>C.render.rbc(ctx,p.x,p.y,p.r,1-.75*clamp(p.d/c.length),p.angle));
    // Plasma water leaves capillaries (blue); tissue fluid enters lymphatics (green).
    for(const [i,a] of LEAKS.entries()){arrow(ctx,a,CYAN,2.4,7);for(let k=0;k<2;k++){const u=mod(t*.22+k/2+i*.13),p=pointOn(a,u);droplet(ctx,p.x,p.y,2.9,Math.min(1,u*6,(1-u)*6));}}
    for(const [i,a] of ENTRIES.entries()){arrow(ctx,a,ARROW_GREEN,2.4,7);for(let k=0;k<2;k++){const u=mod(t*.2+k/2+i*.19),p=pointOn(a,u);droplet(ctx,p.x,p.y,2.9,Math.min(1,u*6,(1-u)*4));}}
    bigVessel(ctx,ARTERIOLE,20,'#cf3a3d','#ee7a72');bigVessel(ctx,VENULE,24,'#87283a','#a8495a');
    C.geometry.cells(ARTERIOLE,t,[-9,0,9],15,60,4.2).forEach(p=>C.render.rbc(ctx,p.x,p.y,p.r,1,p.angle));
    C.geometry.cells(VENULE,t,[-10,0,10],15,30,4.6).forEach(p=>C.render.rbc(ctx,p.x,p.y,p.r,.25,p.angle));
    // Blood-flow direction (chalk white, never black on the board).
    const beside=(route,d0,d1,lane)=>{const pts=[];for(let d=d0;d<=d1;d+=6){const q=at(route,d,lane);pts.push([q.x,q.y]);}return pts;};
    arrow(ctx,beside(ARTERIOLE,250,330,-36),INK,3,9);arrow(ctx,beside(VENULE,250,330,38),INK,3,9);
    arrow(ctx,beside(CAPS[1],CAPS[1].length*.40,CAPS[1].length*.56,-15),INK,2.6,8);
    ctx.restore();
    ctx.save();ctx.beginPath();ctx.roundRect(0,0,800,400,18);ctx.strokeStyle='#789b85';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  }
  function mapAt(ctx,t,x,y,k,frame,color){
    ctx.save();ctx.translate(x,y);ctx.scale(k,k);drawMap(ctx,t);
    if(frame){ctx.strokeStyle=color;ctx.lineWidth=2.6/k;ctx.setLineDash([6/k,4/k]);ctx.strokeRect(...frame);}
    ctx.restore();return{x,y,k,to:(px,py)=>[x+px*k,y+py*k]};
  }
  function zoomFrom(ctx,t,thumb,rect,dest,ease){
    const k0=thumb.k,x0=thumb.x+rect[0]*k0,y0=thumb.y+rect[1]*k0,k1=Math.min(dest[2]/rect[2],dest[3]/rect[3]);
    const x1=dest[0]+(dest[2]-rect[2]*k1)/2,y1=dest[1]+(dest[3]-rect[3]*k1)/2,k=mix(k0,k1,ease),x=mix(x0,x1,ease),y=mix(y0,y1,ease);
    ctx.save();ctx.globalAlpha=1-ease;ctx.beginPath();ctx.rect(x,y,rect[2]*k,rect[3]*k);ctx.clip();
    ctx.translate(x-rect[0]*k,y-rect[1]*k);ctx.scale(k,k);drawMap(ctx,t);ctx.restore();
  }
  const CAP_FOCUS=(()=>{const c=at(CAPS[2],CAPS[2].length*.5);return Object.freeze([c.x-46,c.y-30,92,60]);})();
  const TIP_FOCUS=Object.freeze([TIPS[2][0]-34,TIPS[2][1]-26,96,62]);
  const EXIT_FOCUS=Object.freeze([688,312,112,76]);

  // ── step 0: the whole map, labels, legend and the three-name flow chart ──
  const MAP0={x:150,y:100,k:.82};
  function overview(ctx,D,t){
    // Legend row: blood flow, plasma into tissue, tissue fluid into lymphatics.
    ctx.save();ctx.font=font(22);let x=24;
    for(const [color,p] of [[INK,P('血流方向','Blood flow')],[CYAN,P('血漿流入組織','Plasma into tissue')],[ARROW_GREEN,P('組織液流入淋巴管','Tissue fluid into lymphatics')]]){
      arrow(ctx,[[x,67],[x+34,67]],color,3,9);text(ctx,D,p,x+46,75,22,color);x+=46+ctx.measureText(D.tr(p)).width+30;}
    ctx.restore();
    const m=mapAt(ctx,t,MAP0.x,MAP0.y,MAP0.k);
    const leader=(label,target,y,side,color=INK)=>{
      const tx=side<0?24:936;ctx.save();ctx.font=font(22);const w=ctx.measureText(D.tr(label)).width;ctx.restore();
      const from=side<0?[tx+w+8,y-7]:[tx-w-8,y-7];stroke(ctx,[from,target],color+'cc',1.6);
      ctx.save();ctx.fillStyle=color;ctx.beginPath();ctx.arc(target[0],target[1],3.2,0,Math.PI*2);ctx.fill();ctx.restore();
      text(ctx,D,label,tx,y,22,color,side<0?'left':'right');
    };
    const cell=CELLS.reduce((b,c)=>Math.hypot(c.x-70,c.y-96)<Math.hypot(b.x-70,b.y-96)?c:b);
    leader(P('組織細胞','Tissue cell'),m.to(cell.x,cell.y),150,-1);
    leader(P('組織液','Tissue fluid'),m.to(...GAP_POINT),262,-1,CYAN);
    const a=nearY(ARTERIOLE,352);leader(P('小動脈','Arteriole'),m.to(a.x-14,a.y),400,-1,'#f08a84');
    const c0=at(CAPS[0],CAPS[0].length*.8);leader(P('微血管','Capillary'),m.to(c0.x,c0.y),150,1,'#f08a84');
    leader(P('盲端','Blind end'),m.to(TIPS[4][0],TIPS[4][1]-6),246,1,GREEN);
    const v=nearY(VENULE,300);leader(P('小靜脈','Venule'),m.to(v.x+18,v.y),330,1,VEIN_LABEL);
    const l=nearX(COLLECT,770);leader(P('淋巴管','Lymphatic'),m.to(l.x,l.y),410,1,GREEN);
    // Flow chart: the same water, named by where it is.
    const boxes=[[75,P('血漿','Plasma'),'#ef6b6b'],[410,P('組織液','Tissue fluid'),CYAN],[745,P('淋巴','Lymph'),GREEN]];
    for(const [bx,p,color] of boxes){D.round(ctx,bx,448,140,42,10,'#1c3d34',color);text(ctx,D,p,bx+70,477,22,color,'center');}
    arrow(ctx,[[221,469],[400,469]],CYAN,3,9);arrow(ctx,[[556,469],[735,469]],ARROW_GREEN,3,9);
    text(ctx,D,P('由微血管滲出','Out of capillaries'),310,500,22,CYAN,'center');
    text(ctx,D,P('滲入淋巴管','Into lymphatics'),645,500,22,ARROW_GREEN,'center');
    stroke(ctx,[[815,492],[815,540],[145,540],[145,504]],'#ef9a9a',2.6);arrow(ctx,[[145,516],[145,496]],'#ef9a9a',2.6,9);
    text(ctx,D,P('經由靜脈回到血液','Back to the blood via veins'),480,570,22,'#ef9a9a','center');
  }

  // ── step 1: capillary close-up (cartoon kept from the approved version) ──
  const GAP_X=591.5,LEAK=Object.freeze([[GAP_X,343],[GAP_X,389],[GAP_X,431],[621,453]]);
  function fluid(ctx,D,path,t,count=3,size=7){for(let i=0;i<count;i++){const u=mod(t*.12+i/count),p=pointOn(path,u);ctx.save();ctx.globalAlpha=Math.min(1,u*12,(1-u)*12);D.water(ctx,p.x,p.y,size);ctx.restore();}}
  function cartoon(ctx,D,t){
    D.round(ctx,361,153,575,374,16,'#1c3d34','#789b85');
    text(ctx,D,P('一層內皮細胞','One endothelial layer'),387,205,22,'#d4daa8');
    const g=ctx.createLinearGradient(0,248,0,376);g.addColorStop(0,'#f7edc5');g.addColorStop(1,'#e6d8a5');ctx.fillStyle=g;ctx.fillRect(382,249,543,128);
    // Static blood cells, irregular positions/tilts; no cell can leave the lumen.
    for(let i=0;i<37;i++){const x=398+(i*83.73)%488,y=269+(i*47.31)%65;C.render.rbc(ctx,x,y,8+(i%4)*.5,.8,Math.sin(i*2.63)*.55);}
    for(const y of [236,389])for(let i=0;i<13;i++){const x=382+i*42+(y===389&&i===5?9:0),w=y===389&&i===4?32:y===389&&i===5?30:39;D.round(ctx,x,y-11,w,22,7,'#d4daa8','#6c8b5b');ellipse(ctx,x+w*.54,y,3.5,2.6,'#879165');}
    text(ctx,D,P('紅血球留在血管內','Red cells stay inside'),401,363,22,'#762f3d');
    ctx.save();ctx.strokeStyle=YELLOW;ctx.lineWidth=2;ctx.beginPath();ctx.arc(GAP_X,389,17,0,Math.PI*2);ctx.stroke();ctx.restore();
    stroke(ctx,[[609,399],[650,421]],YELLOW,2);
    text(ctx,D,P('細胞間隙','Junction gap'),658,429,22,YELLOW);
    arrow(ctx,LEAK,CYAN,2.5,8);fluid(ctx,D,LEAK,t,3,7);
    text(ctx,D,P('水與小分子 → 組織液','Water + small solutes → tissue fluid'),387,494,22,CYAN);
  }
  const THUMB={x:24,y:178,k:.375};
  function closeup(ctx,D,t,elapsed){
    text(ctx,D,P('全圖的這一小段','This small part of the map'),24,158,22,YELLOW);
    const m=mapAt(ctx,t,THUMB.x,THUMB.y,THUMB.k,CAP_FOCUS,YELLOW);
    const [fx,fy]=m.to(CAP_FOCUS[0]+CAP_FOCUS[2],CAP_FOCUS[1]+CAP_FOCUS[3]/2);
    stroke(ctx,[[fx,fy],[342,fy],[361,237]],YELLOW,2);
    wrap(ctx,D,P('局部 → 放大','Local → enlarged'),24,380,300,24,YELLOW);
    wrap(ctx,D,P('不是另一根大血管；紅血球與間隙都不是實際比例。','Not a different large vessel; cells and gaps are not to scale.'),24,424,300,22);
    const u=clamp(elapsed/1.25),ease=u*u*(3-2*u);ctx.save();ctx.globalAlpha=ease;cartoon(ctx,D,t);ctx.restore();
    if(u<1)zoomFrom(ctx,t,m,CAP_FOCUS,[361,153,575,374],ease);
    wrap(ctx,D,P('不是破裂：血漿中的部分水與小分子穿過管壁。','Not a rupture: some plasma water and small solutes cross the wall.'),24,567,912,22);
  }

  // ── step 2: a blind-ended lymph capillary with inward-opening flaps ──────
  // Wall: one cell layer; neighbouring edges overlap. Each flap hinges on its
  // downstream side and swings only INTO the lumen. Open for 2 s of every 4 s.
  const LY={x0:452,end:950,cy:380,r:46,wall:12};
  const FLAPS=Object.freeze([...[540,650,760,870].map(x=>({x,top:true})),...[595,705,815].map(x=>({x,top:false}))]);
  const ENTRY_CELLS=Object.freeze([[480,255,27],[595,250,28],[705,258,27],[815,250,28],[910,256,26],[392,262,24],[470,488,27],[650,486,28],[388,480,24]]);
  function flapOpen(t){const u=mod(t,4);return smooth((u-.3)/.35)*smooth((2.3-u)/.35);}
  const DROPS=Array.from({length:14},(_,i)=>{const f=FLAPS[(i*3)%7],c=i%3,te=c*4+.65+1.1*scatter(i+41),gx=f.x-5;
    return Object.freeze({f,te,S:[gx+(scatter(i+7)-.5)*14,f.top?205:476],G:[gx,f.top?306:454],I:[gx,f.top?354:406],lane:f.top?346+10*scatter(i+3):404+10*scatter(i+5)});});
  function dropAt(dp,t){
    const rel=mod(t-dp.te+3,12)-3;
    if(rel<-2.6)return null;
    if(rel<0){const u=smooth((rel+2.6)/2.6);return{x:mix(dp.S[0],dp.G[0],u),y:mix(dp.S[1],dp.G[1],u),a:clamp((rel+2.6)/.4),inside:false};}
    if(rel<.45){const u=smooth(rel/.45);return{x:mix(dp.G[0],dp.I[0],u),y:mix(dp.G[1],dp.I[1],u),a:1,inside:u>.5};}
    const x=dp.I[0]+(rel-.45)*55;if(x>LY.end)return null;
    return{x,y:mix(dp.I[1],dp.lane,clamp((rel-.45)/.8)),a:1,inside:true};
  }
  function lymphCapillary(ctx,D,t){
    const {x0,end,cy,r,wall}=LY,open=flapOpen(t);
    ctx.save();ctx.beginPath();ctx.roundRect(361,153,575,374,16);ctx.fillStyle='#24493d';ctx.fill();ctx.strokeStyle='#789b85';ctx.lineWidth=2;ctx.stroke();ctx.clip();
    for(const [x,y,rr] of ENTRY_CELLS)tissueCell(ctx,x,y,rr,(x*.013)%3);
    // Lumen, then the wall in pieces, leaving a gap at every flap.
    ctx.beginPath();ctx.arc(x0,cy,r,Math.PI/2,Math.PI*1.5);ctx.lineTo(end,cy-r);ctx.lineTo(end,cy+r);ctx.closePath();
    const lumen=ctx.createLinearGradient(0,cy-r,0,cy+r);lumen.addColorStop(0,'#eef3cf');lumen.addColorStop(1,'#d9e6b0');ctx.fillStyle=lumen;ctx.fill();
    const wy=top=>top?cy-r-wall/2:cy+r+wall/2,ink='#4f7d43',body='#8cbb6b';
    const pieces=top=>{const gaps=FLAPS.filter(f=>f.top===top).map(f=>[f.x-22,f.x+20]).sort((a,b)=>a[0]-b[0]);const out=[];let s=x0;for(const [a,b] of gaps){out.push([s,a]);s=b;}out.push([s,end]);return out;};
    for(const top of [true,false])for(const [a,b] of pieces(top)){for(const [w,c] of [[wall+3,ink],[wall-1,body]])stroke(ctx,[[a,wy(top)],[b,wy(top)]],c,w);
      ellipse(ctx,(a+b)/2,wy(top),9,3.2,'#5f8f4c');}
    ctx.beginPath();ctx.arc(x0,cy,r+wall/2,Math.PI/2,Math.PI*1.5);ctx.strokeStyle=ink;ctx.lineWidth=wall+3;ctx.stroke();ctx.strokeStyle=body;ctx.lineWidth=wall-1;ctx.stroke();
    ellipse(ctx,x0-r-wall/2,cy,3.2,9,'#5f8f4c');
    // Fluid moves between the cells toward the gaps; only open flaps admit it.
    for(const f of FLAPS){if(open<.05)continue;const gx=f.x-5;arrow(ctx,f.top?[[gx,236],[gx,300]]:[[gx,486],[gx,460]],ARROW_GREEN+(open>.5?'':'99'),2.6,8);}
    for(const dp of DROPS){const q=dropAt(dp,t);if(!q)continue;ctx.save();ctx.globalAlpha=q.a;D.water(ctx,q.x,q.y,7);ctx.restore();}
    // Flaps: free edge on the upstream side, hinge downstream; swing inward.
    for(const f of FLAPS){const hx=f.x+20,hy=wy(f.top),ang=1.0*open,len=42,dir=f.top?1:-1;
      const tip=[hx-len*Math.cos(ang),hy+dir*len*Math.sin(ang)];
      for(const [w,c] of [[wall+3,ink],[wall-1,body]])stroke(ctx,[[hx,hy],tip],c,w);}
    text(ctx,D,P('盲端','Blind end'),x0-14,cy+8,22,'#3f6b35');
    text(ctx,D,P('淋巴：已在淋巴管內','Lymph: inside the vessel'),640,cy+8,22,'#3f6b35');
    ctx.restore();
    chip(ctx,D,P('組織液：在細胞之間','Tissue fluid: between cells'),378,194,CYAN);
    stroke(ctx,[[519,303],[529,321]],YELLOW,2);chip(ctx,D,P('小門','Flap'),466,311,YELLOW);
    chip(ctx,D,open>.5?P('組織間壓力較高 → 小門往內開','Tissue pressure higher → flaps open inward'):P('小門闔上 → 淋巴不倒流','Flaps closed → no backflow'),922,515,open>.5?ARROW_GREEN:INK,'right');
    return open;
  }
  function entry(ctx,D,t,elapsed){
    text(ctx,D,P('全圖的這一個盲端','This blind end on the map'),24,158,22,GREEN);
    const m=mapAt(ctx,t,THUMB.x,THUMB.y,THUMB.k,TIP_FOCUS,GREEN);
    const [fx,fy]=m.to(TIP_FOCUS[0]+TIP_FOCUS[2],TIP_FOCUS[1]+TIP_FOCUS[3]/2);
    stroke(ctx,[[fx,fy],[342,fy],[361,300]],GREEN,2);
    const n=wrap(ctx,D,P('組織間壓力 > 淋巴管內 → 小門往內開，組織液滲入。','Tissue pressure > lymph pressure → flaps open inward.'),24,372,300,22,ARROW_GREEN);
    wrap(ctx,D,P('壓力反過來 → 小門闔上，淋巴不會倒流。','Pressure reversed → flaps close; no backflow.'),24,372+n*28+14,300,22);
    const u=clamp(elapsed/1.25),ease=u*u*(3-2*u);ctx.save();ctx.globalAlpha=ease;const open=lymphCapillary(ctx,D,t);ctx.restore();
    if(u<1)zoomFrom(ctx,t,m,TIP_FOCUS,[361,153,575,374],ease);
    wrap(ctx,D,P('組織液是在細胞之間慢慢滲進去的，不是從遠處飛進來；進到管內才叫淋巴。','Tissue fluid seeps in between cells; it does not fly in. Inside, it is lymph.'),24,567,912,22,GREEN);
    return open;
  }

  // ── step 3: lymphatic with valves → node → neck vein → SVC → right atrium ─
  function chain(pieces,n=40){const samples=[];let length=0;for(const p of pieces){const r=curve(p,n);r.samples.forEach((q,i)=>{if(!samples.length||i)samples.push({...q,d:q.d+length});});length+=r.length;}return{samples,length};}
  // One continuous vein: horizontal neck vein, a true rounded bend, then the
  // superior vena cava straight down into the right atrium (no missing corner).
  function veinRoute(){
    const samples=[],push=(x,y,angle)=>{const last=samples[samples.length-1],d=last?last.d+Math.hypot(x-last.x,y-last.y):0;samples.push({x,y,nx:-Math.sin(angle),ny:Math.cos(angle),angle,d});};
    for(let x=556;x<=800;x+=8)push(x,182,0);
    for(let i=1;i<=18;i++){const a=-Math.PI/2+i/18*Math.PI/2;push(800+56*Math.cos(a),238+56*Math.sin(a),a+Math.PI/2);}
    for(let y=246;y<=470;y+=8)push(856,y,Math.PI/2);
    return{samples,length:samples[samples.length-1].d};
  }
  const VEIN=veinRoute();
  const LYMPH_RETURN=chain([[[300,296],[340,326],[392,370],[452,372]],[[452,372],[490,373],[556,372],[600,370]],[[600,370],[652,368],[662,320],[662,200]]]);
  const NODE=Object.freeze([526,372]);
  const JOIN_D=VEIN.samples.find(p=>p.x>=662).d;
  function atrium(ctx,D){
    ctx.beginPath();ctx.moveTo(800,452);ctx.bezierCurveTo(770,452,768,520,812,524);ctx.lineTo(902,524);ctx.bezierCurveTo(944,520,942,452,912,452);ctx.closePath();
    const g=ctx.createLinearGradient(0,452,0,524);g.addColorStop(0,'#9b3c48');g.addColorStop(1,'#6f2a36');ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle='#e8a48b';ctx.lineWidth=2.5;ctx.stroke();
    text(ctx,D,P('右心房','Right atrium'),856,497,22,INK,'center');
  }
  function lymphValves(ctx,t){
    const open=.55+.45*Math.sin(t*2.2);
    for(const d of [80,420]){const p=at(LYMPH_RETURN,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
      for(const s of [-1,1])stroke(ctx,[[-9,s*9],[7,s*9*mix(.12,.78,open)]],'#3f6b35',3.4);ctx.restore();}
  }
  function returning(ctx,D,t){
    text(ctx,D,P('組織區：從這裡出發','Local tissue: start here'),24,158,22,GREEN);
    const m=mapAt(ctx,t,24,178,.34,EXIT_FOCUS,GREEN);
    const [ex,ey]=m.to(EXIT_FOCUS[0]+EXIT_FOCUS[2],EXIT_FOCUS[1]+EXIT_FOCUS[3]/2);
    stroke(ctx,[[ex,ey],[300,296]],GREEN,2);
    // Lymphatic vessel with valves, the node, then the vein it empties into.
    const lp=poly(LYMPH_RETURN);stroke(ctx,lp,'#3f6b35',25);stroke(ctx,lp,'#8cbb6b',21);stroke(ctx,lp,'#e4eab9',13);
    lymphValves(ctx,t);
    ctx.save();ctx.translate(...NODE);ctx.beginPath();ctx.moveTo(-48,-6);ctx.bezierCurveTo(-46,-46,30,-44,46,-18);ctx.bezierCurveTo(56,0,44,34,4,36);ctx.bezierCurveTo(-30,38,-50,24,-48,-6);ctx.closePath();
    ctx.fillStyle='#91ad64';ctx.fill();ctx.strokeStyle='#c4dc98';ctx.lineWidth=2.5;ctx.stroke();
    for(const [x,y] of [[-28,-16],[-6,-24],[18,-20],[30,4],[-20,16],[6,18]]){ellipse(ctx,x,y,9,8,'#d5ddab');ellipse(ctx,x,y,4.5,4,'#8da976');}
    ctx.restore();
    C.render.tubes(ctx,[VEIN],[18],0,2);
    ctx.save();C.render.clipTubes(ctx,[VEIN],[18]);
    C.geometry.cells(VEIN,t,[-8,8],34,26,6).forEach(p=>C.render.rbc(ctx,p.x,p.y,p.r,.25,p.angle+p.tilt));ctx.restore();
    // Lymph droplets: along the lymphatic, through the node, into the vein,
    // then onward with venous blood down the vena cava into the atrium.
    for(let i=0;i<8;i++){const u=mod(t*.06+i/8),p=at(LYMPH_RETURN,u*LYMPH_RETURN.length);D.water(ctx,p.x,p.y,6);}
    for(let i=0;i<4;i++){const u=mod(t*.09+i/4),d=mix(JOIN_D,VEIN.length,u),p=at(VEIN,d,(i%2?5:-5));ctx.save();ctx.globalAlpha=Math.min(1,(1-u)*5);D.water(ctx,p.x,p.y,6);ctx.restore();}
    atrium(ctx,D);
    const lymphArrow=[];for(let d=100;d<=170;d+=7){const q=at(LYMPH_RETURN,d,-26);lymphArrow.push([q.x,q.y]);}arrow(ctx,lymphArrow,GREEN,3,9);
    const svc=[];for(let d=VEIN.length-170;d<=VEIN.length-70;d+=8){const q=at(VEIN,d,-40);svc.push([q.x,q.y]);}arrow(ctx,svc,INK,3,9);
    text(ctx,D,P('淋巴結','Lymph node'),NODE[0],318,22,GREEN,'center');
    wrap(ctx,D,P('淋巴管（有瓣膜）','Lymphatic vessel (with valves)'),310,452,340,22,GREEN);
    text(ctx,D,P('頸根部的靜脈','Vein at the neck root'),680,146,22,VEIN_LABEL,'center');
    const svcLabel=lines(ctx,D,P('上大靜脈','Superior vena cava'),118);svcLabel.forEach((r,i)=>text(ctx,D,[r,r],830,330+28*i,22,VEIN_LABEL,'right'));
    text(ctx,D,P('局部組織 ↗ 遠端回流（不同尺度）','Local tissue ↗ distant return (different scales)'),24,526,22,MUTED);
    wrap(ctx,D,P('組織液 → 淋巴管 → 淋巴結 → 頸根部的靜脈 → 上大靜脈 → 右心房','Tissue fluid → lymphatics → nodes → neck veins → vena cava → heart'),24,567,912,22,YELLOW);
  }
  function draw(ctx,s,t,D){
    const q=phase(s,t);let open=null;ctx.save();ctx.fillStyle=BG;ctx.fillRect(0,0,960,600);wrap(ctx,D,q.step.title,24,39,912,26,YELLOW);
    if(q.step.id===0)overview(ctx,D,t);else if(q.step.id===1)closeup(ctx,D,t,q.elapsed);else if(q.step.id===2)open=entry(ctx,D,t,q.elapsed);else returning(ctx,D,t);
    s.lymphTrace={step:q.step.id,auto:q.auto,directCapillaryReturn:false,redCellsOutsideBlood:0,originalDrawing:true,flapsOpen:open,
      returnTo:'neck veins → superior vena cava → right atrium'};
    D.status(q.step.id===2?(open>.5?P('組織間壓力較高 → 小門往內開，組織液滲入淋巴管。','Higher tissue pressure → flaps open inward; tissue fluid seeps in.'):P('壓力反過來 → 小門闔上，淋巴不倒流。','Pressure reversed → flaps closed; no backflow.')):
      P('全圖 → 微血管局部放大 → 盲端入口放大 → 追蹤淋巴回程。','Whole map → capillary close-up → blind-end entry → lymph return.'));
    ctx.restore();return s.lymphTrace;
  }
  function explain(s){const q=phase(s,s.elapsed||0);return{title:q.step.title,text:q.step.text};}
  root.HumanTransportLymphJourney=Object.freeze({draw,explain,phase,steps:STEPS,total:TOTAL,
    geometry:Object.freeze({capFocus:CAP_FOCUS,tipFocus:TIP_FOCUS,exitFocus:EXIT_FOCUS,leak:LEAK,capillaries:CAPS,lymphCapillaries:LCAPS,collector:COLLECT,lymphReturn:LYMPH_RETURN,vein:VEIN,flaps:FLAPS,drops:DROPS,dropAt,flapOpen})});
})(globalThis);

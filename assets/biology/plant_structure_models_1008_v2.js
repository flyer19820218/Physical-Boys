/* Original 4-1 models. Photographs are not deformed or claimed to be films. */
(function(root){
  'use strict';
  const C={paper:'#f7f5eb',ink:'#183c31',muted:'#4c685b',water:'#147a98',sugar:'#a55a12',growth:'#aa3272',green:'#3c8652',bark:'#62412e'};
  const sources={
    atlas:['plant_atlas_native2.png',89,'3-1','根、莖、葉剖面','Root, stem and leaf cutaway'],
    sunflower:['sunflower_section_native2_page.png',90,'3-2B','向日葵莖橫切面 · 光學顯微照片','Sunflower stem · light micrograph'],
    sunflowerBundle:['sunflower_bundle_native2_page.png',90,'3-2','向日葵單一維管束 · 光學顯微照片','Sunflower vascular bundle · light micrograph'],
    corn:['corn_section_native2_page.png',91,'3-3B','玉米莖橫切面 · 光學顯微照片','Maize stem · light micrograph'],
    cornBundle:['corn_bundle_native2_page.png',91,'3-3','玉米單一維管束 · 光學顯微照片','Maize vascular bundle · light micrograph'],
    trunk:['trunk_cutaway_native2.png',92,'3-4','樹皮與木材剖面示意','Bark and wood cutaway'],
    rings:['growth_rings_native2.png',92,'3-5A','真實木材年輪','Original wood growth rings'],
    wood:['wood_cells_native2_page.png',93,'3-5B','木材橫切面 · 光學顯微照片','Wood cross-section · light micrograph'],
    hollow:['hollow_maple_native2.png',93,'3-6','中空楓樹 · 實景照片','Hollow maple · original photograph']
  };
  const crops={whole:[0,0,2045,2514],leaf:[230,430,1110,760],stem:[390,1360,510,710],root:[420,2190,1625,324]};
  const routes={
    leaf:{water:[[1001,249],[733,281],[579,292],[419,336],[269,357]],sugar:[[292,418],[413,407],[522,369],[653,330],[835,274],[997,253]]},
    stem:{water:[[144,474],[154,310],[154,143],[156,8]],sugar:[[111,15],[111,192],[108,334],[128,465]]}
  };
  function tr(zh,en,lang){return lang==='en'?en:zh;}
  function text(ctx,s,x,y,size=24,color=C.ink,align='left'){ctx.fillStyle=color;ctx.font=`700 ${size}px "Noto Sans TC",sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}
  function wrap(ctx,s,x,y,width,size=22,color=C.ink){ctx.font=`600 ${size}px "Noto Sans TC",sans-serif`;let line='',dy=0;const parts=/[\u3400-\u9fff]/.test(s)?Array.from(s):s.split(/(?<=\s)/);for(const p of parts){if(ctx.measureText(line+p).width>width&&line){text(ctx,line.trim(),x,y+dy,size,color);dy+=size*1.4;line=p;}else line+=p;}if(line)text(ctx,line.trim(),x,y+dy,size,color);return dy+size*1.4;}
  function rounded(ctx,x,y,w,h,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function panel(ctx,x,y,w,h){ctx.fillStyle='#ffffff';rounded(ctx,x,y,w,h);ctx.fill();ctx.strokeStyle='#d6dfcf';ctx.lineWidth=2;ctx.stroke();}
  function imageFit(ctx,im,x,y,w,h,crop){const a=crop||[0,0,im.width,im.height];const s=Math.min(w/a[2],h/a[3]);const b={x:x+(w-a[2]*s)/2,y:y+(h-a[3]*s)/2,w:a[2]*s,h:a[3]*s,scale:s,crop:a};ctx.drawImage(im,...a,b.x,b.y,b.w,b.h);return b;}
  function map(b,x,y){return [b.x+(x-b.crop[0])*b.scale,b.y+(y-b.crop[1])*b.scale];}
  function focus(ctx,x,y,rx,ry,color){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.setLineDash([10,5]);ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  function atom(ctx,x,y,r,color){const g=ctx.createRadialGradient(x-r*.3,y-r*.4,r*.06,x,y,r);g.addColorStop(0,'#fff9ed');g.addColorStop(.28,color);g.addColorStop(1,color==='#f472b6'?'#92325e':'#abc1b7');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f8f5e8';ctx.lineWidth=1;ctx.stroke();}
  function water(ctx,x,y,s=1){atom(ctx,x-4*s,y-5*s,3*s,'#eaf1df');atom(ctx,x+4*s,y-5*s,3*s,'#eaf1df');atom(ctx,x,y,5*s,'#f472b6');}
  function polygon(ctx,x,y,r,n,color,rotation=-Math.PI/2){ctx.beginPath();for(let i=0;i<n;i++){const a=rotation+i*Math.PI*2/n;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#fff4d7';ctx.lineWidth=1.4;ctx.stroke();}
  function sugar(ctx,x,y,s=1){polygon(ctx,x-4.4*s,y,6*s,6,'#f6bc45');polygon(ctx,x+4.4*s,y,5.5*s,5,'#f0a429');}
  function along(points,t){const lens=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let distance=t*lens.reduce((a,b)=>a+b,0);for(let i=0;i<lens.length;i++){if(distance<=lens[i]){const q=distance/lens[i];return [points[i][0]+(points[i+1][0]-points[i][0])*q,points[i][1]+(points[i+1][1]-points[i][1])*q];}distance-=lens[i];}return points.at(-1);}
  // The teacher explicitly requested larger symbols and observable upward/downward phloem cases.
  // Reverse the stem route only: a mature source leaf still exports sugar along its petiole.
  const symbolScale={water:3.2,sugar:3};
  function transportPositions(part,type,t,sink='root'){
    const original=routes[part]?.[type];if(!original)return [];
    const p=type==='sugar'&&part==='stem'&&sink==='shoot'?[...original].reverse():original;
    return Array.from({length:4},(_,i)=>along(p,(t*.12+i/4)%1));
  }
  function molecules(ctx,b,part,type,t,sink){for(const [x,y] of transportPositions(part,type,t,sink)){const [dx,dy]=map(b,x+b.crop[0],y+b.crop[1]);(type==='water'?water:sugar)(ctx,dx,dy,symbolScale[type]);}}
  function scaleBar(ctx,b,pixels,label){const len=pixels*b.scale;const x=b.x+b.w-len-20,y=b.y+b.h-17;ctx.strokeStyle=C.ink;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len,y);ctx.stroke();text(ctx,label,x+len/2,y-19,22,C.ink,'center');}
  function network(ctx,images,state,lang,t){
    panel(ctx,12,50,162,575);panel(ctx,190,50,758,575);
    text(ctx,tr('整株定位','Plant context',lang),27,80,22);
    imageFit(ctx,images.atlas,22,103,142,295);
    water(ctx,53,448,3.2);text(ctx,tr('水','Water',lang),90,449,22,C.water);
    sugar(ctx,52,524,3);text(ctx,tr('蔗糖','Sucrose',lang),26,572,22,C.sugar);
    text(ctx,tr('放大剖面，追蹤運輸','Enlarged cutaway: follow transport',lang),20,28,24);
    const part=state.part==='root'?'root':state.part==='stem'?'stem':'leaf';
    const b=imageFit(ctx,images.atlas,207,90,724,490,crops[part]);
    text(ctx,tr(part==='leaf'?'葉的維管束':part==='stem'?'莖的維管束':'根與莖的連接',part==='leaf'?'Leaf vascular bundle':part==='stem'?'Stem vascular bundle':'Root–stem connection',lang),213,71,24);
    if(part!=='root'){
      const isWater=state.focus!=='phloem';
      const point=part==='leaf'?(isWater?[269,357]:[283,418]):(isWater?[155,290]:[107,290]);
      const [x,y]=map(b,point[0]+b.crop[0],point[1]+b.crop[1]);
      focus(ctx,x,y,part==='leaf'?75*b.scale:25*b.scale,part==='leaf'?45*b.scale:160*b.scale,isWater?C.water:C.sugar);
      molecules(ctx,b,part,isWater?'water':'sugar',t,state.sink);
      if(part==='stem'&&!isWater){
        const up=state.sink==='shoot';
        wrap(ctx,tr(up?'嫩芽需要養分':'成熟葉供應養分',up?'Growing shoot: sugar sink':'Mature leaf: sugar source',lang),722,162,203,22,C.sugar);
        wrap(ctx,tr(up?'成熟葉供應養分':'根部需要養分',up?'Mature leaf: sugar source':'Roots: sugar sink',lang),722,475,203,22,C.sugar);
      }
    }
    text(ctx,tr('藍色：木質部','Blue: xylem',lang),213,601,22,C.water);
    text(ctx,tr('橘色：韌皮部','Orange: phloem',lang),620,601,22,C.sugar);
    return [];
  }
  function positions(ctx,images,state,lang){
    const part=state.part==='stem'?'stem':'leaf';
    const b=imageFit(ctx,images.atlas,30,65,720,550,crops[part]);
    text(ctx,tr(part==='leaf'?'葉片剖面：朝上與朝下': '莖的剖面：中心與外側',part==='leaf'?'Leaf: upper and lower surfaces':'Stem: centre and outside',lang),24,28,26);
    const leaf=[{key:'xylem',x:269,y:357,rx:110,ry:42},{key:'phloem',x:283,y:418,rx:110,ry:29}];
    const stem=[{key:'xylem',x:155,y:290,rx:27,ry:155},{key:'phloem',x:107,y:290,rx:23,ry:155}];
    const spots=(part==='leaf'?leaf:stem).map(p=>{const [x,y]=map(b,p.x+b.crop[0],p.y+b.crop[1]);return {...p,x,y,rx:p.rx*b.scale,ry:p.ry*b.scale};});
    for(const p of spots)if(state.focus===p.key)focus(ctx,p.x,p.y,p.rx,p.ry,p.key==='xylem'?C.water:C.sugar);
    panel(ctx,755,140,188,320);
    wrap(ctx,tr(part==='leaf'?'上側':'靠近中心',part==='leaf'?'UPPER':'INNER',lang),775,181,145,24);
    text(ctx,tr('木質部','Xylem',lang),775,249,24,C.water);
    wrap(ctx,tr(part==='leaf'?'下側':'靠近外側',part==='leaf'?'LOWER':'OUTER',lang),775,331,145,24);
    text(ctx,tr('韌皮部','Phloem',lang),775,399,24,C.sugar);
    return spots;
  }
  function microscopy(ctx,images,state,lang){
    const kind=state.kind||'sunflower',bundle=state.detail==='bundle';
    text(ctx,tr(kind==='sunflower'?'向日葵：環狀排列':'玉米：散生排列',kind==='sunflower'?'Sunflower: a ring of bundles':'Maize: scattered bundles',lang),24,28,26);
    const wholeCrop=kind==='sunflower'?[230,248,592,570]:[95,140,610,535];
    imageFit(ctx,images[kind],20,65,bundle?310:585,bundle?360:540,wholeCrop);
    let spots=[];
    if(bundle){
      const b=imageFit(ctx,images[kind+'Bundle'],365,65,575,550);
      if(kind==='sunflower'){
        const definitions=[['phloem',300,270,72,59],['cambium',296,333,74,18],['xylem',295,385,91,58]];
        spots=definitions.map(([key,x,y,rx,ry])=>({key,x:b.x+x*b.scale,y:b.y+y*b.scale,rx:rx*b.scale,ry:ry*b.scale}));
      }else{
        spots=[{key:'phloem',x:b.x+283*b.scale,y:b.y+203*b.scale,rx:47*b.scale,ry:42*b.scale},{key:'xylem',x:b.x+282*b.scale,y:b.y+280*b.scale,rx:127*b.scale,ry:69*b.scale}];
      }
      const hit=spots.find(p=>p.key===state.focus);if(hit)focus(ctx,hit.x,hit.y,hit.rx,hit.ry,hit.key==='xylem'?C.water:hit.key==='phloem'?C.sugar:C.growth);
      scaleBar(ctx,b,kind==='sunflower'?54.76:80.94,'0.1 mm');
      wrap(ctx,tr('全切片 → 單一維管束','Whole section → one bundle',lang),30,466,310,22);
    }else{
      panel(ctx,630,85,310,460);
      wrap(ctx,tr(kind==='sunflower'?'注意：維管束圍成一圈。不是整個莖只有一條維管束。':'注意：維管束散布在莖內，不是沿同一個圓環排列。',kind==='sunflower'?'Look for separate bundles arranged in a ring. A stem does not contain just one bundle.':'Look for bundles across the stem, not on a single ring.',lang),651,122,265,24);
      wrap(ctx,tr('點左側「單一維管束」，繼續找木質部和韌皮部。','Choose “One bundle” to locate xylem and phloem.',lang),651,354,265,22);
    }
    return spots;
  }
  function annualRadii(phase){const completed=Math.floor(phase/2),half=phase-completed*2;const bands=[];let r=52;for(let y=0;y<completed;y++){bands.push({inner:r,outer:r+21,year:y+1,light:true});r+=21;bands.push({inner:r,outer:r+8,year:y+1,light:false});r+=8;}if(half>0){bands.push({inner:r,outer:r+21*Math.min(1,half),year:completed+1,light:true});r+=21*Math.min(1,half);if(half>1){bands.push({inner:r,outer:r+8*(half-1),year:completed+1,light:false});r+=8*(half-1);}}return {bands,r,completed};}
  function woodDisc(ctx,cx,cy,phase,selected=0,hollow=false){
    const {bands,r,completed}=annualRadii(phase);
    ctx.save();ctx.translate(cx,cy);
    const grain=ctx.createRadialGradient(-45,-70,20,0,0,r);grain.addColorStop(0,'#ead29e');grain.addColorStop(.6,'#d4ad76');grain.addColorStop(1,'#a77746');ctx.fillStyle=grain;ctx.beginPath();ctx.arc(0,0,r+27,0,Math.PI*2);ctx.fill();
    for(const band of bands){ctx.beginPath();ctx.arc(0,0,band.outer,0,Math.PI*2);ctx.arc(0,0,band.inner,Math.PI*2,0,true);ctx.fillStyle=band.light?'#dec294':'#946441';ctx.fill();ctx.strokeStyle='rgba(100,67,34,.25)';ctx.lineWidth=1;ctx.stroke();}
    // Fine grain is deterministic and static; it is not an invented measured ring.
    for(let i=0;i<52;i++){const a=i*Math.PI*2/52;ctx.strokeStyle='rgba(108,73,42,.16)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.cos(a)*45,Math.sin(a)*45);ctx.lineTo(Math.cos(a+.025)*(r+16),Math.sin(a+.025)*(r+16));ctx.stroke();}
    ctx.strokeStyle=C.growth;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,r+7,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#bb8f56';ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,r+16,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=C.bark;ctx.lineWidth=13;ctx.beginPath();ctx.arc(0,0,r+28,0,Math.PI*2);ctx.stroke();
    if(hollow){ctx.fillStyle='#11261f';ctx.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,rr=67+5*Math.sin(a*5);const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();}
    if(selected){const pair=bands.filter(b=>b.year===selected);if(pair.length){ctx.strokeStyle='#28b8dd';ctx.lineWidth=4;ctx.setLineDash([12,6]);for(const radius of [pair[0].inner,pair.at(-1).outer]){ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();}ctx.setLineDash([]);}}
    ctx.restore();return {bands,r,completed};
  }
  function growth(ctx,images,state,lang){
    const detail=state.detail||'model';
    if(detail==='wood'){
      text(ctx,tr('真實木材細胞：不是每條深色線都算一年','Real wood cells: a dark line alone is not one year',lang),22,28,24);
      const b=imageFit(ctx,images.wood,25,72,910,545);scaleBar(ctx,b,94.58,'0.2 mm');return [];
    }
    if(detail==='trunk'){
      text(ctx,tr('外側是樹皮，內側木質部堆積成木材','Bark outside; accumulated xylem becomes wood inside',lang),22,28,24);
      const b=imageFit(ctx,images.trunk,30,75,900,520);
      const nodes=[['bark',70,330,47,160],['phloem',235,330,32,130],['cambium',357,355,28,138],['xylem',530,320,90,140]].map(([key,x,y,rx,ry])=>({key,x:b.x+x*b.scale,y:b.y+y*b.scale,rx:rx*b.scale,ry:ry*b.scale}));
      const p=nodes.find(n=>n.key===state.focus);if(p)focus(ctx,p.x,p.y,p.rx,p.ry,p.key==='xylem'?C.water:p.key==='phloem'?C.sugar:p.key==='cambium'?C.growth:C.green);return nodes;
    }
    text(ctx,tr('左：逐季生長示意　右：課本年輪照片','Seasonal growth model / original ring photograph',lang),22,28,24);
    const result=woodDisc(ctx,262,306,state.phase||0,state.selectedYear||0);
    text(ctx,tr('形成層向內：新增木質部','Cambium inward: new xylem',lang),262,560,22,C.water,'center');
    text(ctx,tr('形成層向外：新增韌皮部','Cambium outward: new phloem',lang),262,592,22,C.sugar,'center');
    text(ctx,tr(`完成 ${result.completed} 組深淺年輪`,`${result.completed} complete light–dark pairs`,lang),262,624,22,C.ink,'center');
    imageFit(ctx,images.rings,520,62,415,548,[0,160,963,1044]);
    return result.bands.map(b=>({key:'year',year:b.year,cx:262,cy:306,inner:b.inner,outer:b.outer}));
  }
  function caseOutcome(kind,stage){return {rootFood:kind!=='girdled',waterFlow:kind!=='girdled'||stage<2,supportRisk:kind==='hollow',delay:kind==='girdled'&&stage<2};}
  // A longitudinal cut through nested layers, not two pipes on either side of a flat plank.
  // Both central old wood and outer conducting sapwood are xylem. Phloem is outside both.
  const trunkLayers={cx:704,top:192,bottom:489,
    bark:{r:180,ry:67,color:'#6d4933'},
    phloem:{r:165,ry:61,color:'#efb55a'},
    cambium:{r:148,ry:55,color:'#ba729b'},
    sapwood:{r:143,ry:53,color:'#d7eef0'},
    oldXylem:{r:90,ry:33,color:'#b78c56'}};
  const caseTracks={water:[592,816],sugar:[547,861],oldWood:[614,794],flowTop:209,flowBottom:473};
  function trunkSection(ctx,kind,hollowProgress){
    const L=trunkLayers,{cx,top,bottom}=L;
    // Paint largest-to-smallest nested faces; their edges line up with the top rings.
    for(const name of ['bark','phloem','cambium','sapwood','oldXylem']){
      const layer=L[name],g=ctx.createLinearGradient(cx-layer.r,0,cx+layer.r,0);
      g.addColorStop(0,layer.color);g.addColorStop(.48,name==='oldXylem'?'#d4b781':layer.color);g.addColorStop(1,layer.color);
      ctx.fillStyle=g;ctx.fillRect(cx-layer.r,top,layer.r*2,bottom-top);
    }
    // Wood grain exists in old and new xylem; it does not make the centre a transport route.
    for(let i=0;i<26;i++){const x=567+i*10.7;if(x>846)break;ctx.strokeStyle='rgba(111,80,42,.12)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,top);ctx.bezierCurveTo(x-3,285,x+4,420,x,489);ctx.stroke();}
    for(const name of ['bark','phloem','cambium','sapwood','oldXylem']){
      const layer=L[name];ctx.fillStyle=layer.color;ctx.beginPath();ctx.ellipse(cx,top,layer.r,layer.ry,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=name==='sapwood'?C.water:name==='phloem'?C.sugar:'rgba(68,43,23,.3)';ctx.lineWidth=name==='cambium'?1:2;ctx.stroke();
    }
    if(kind==='hollow'){
      const a=Math.max(0,Math.min(1,hollowProgress));
      if(a>0){
        const half=84*a,low=bottom-12,high=top+12;
        ctx.fillStyle='#11261f';ctx.beginPath();ctx.moveTo(cx-half,high);ctx.bezierCurveTo(cx-half-4,250,cx-half+6,427,cx-half,low);ctx.quadraticCurveTo(cx,low+18,cx+half,low);ctx.bezierCurveTo(cx+half-6,427,cx+half+4,250,cx+half,high);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.ellipse(cx,top,half,31*a,0,0,Math.PI*2);ctx.fill();
      }
    }
    if(kind==='girdled'){
      // Remove only bark/phloem/cambium at the wound; the exposed inner sapwood stays continuous.
      for(const x of [524,847]){ctx.fillStyle=C.paper;ctx.fillRect(x,311,37,46);ctx.strokeStyle='#bb453f';ctx.lineWidth=3;ctx.setLineDash([7,4]);ctx.strokeRect(x+1,310,35,48);}ctx.setLineDash([]);
    }
  }
  function cases(ctx,images,state,lang,t){
    const kind=state.kind||'normal',stage=state.stage||0,outcome=caseOutcome(kind,stage);
    text(ctx,tr('原圖觀察 + 樹幹分層運輸','Original evidence + layered trunk transport',lang),24,28,24);
    imageFit(ctx,kind==='hollow'?images.hollow:images.trunk,15,85,392,398);
    wrap(ctx,tr(kind==='hollow'?'課本的中空楓樹，樹冠仍有葉。':'木材就是木質部；中央老木與外側運輸區，工作不同。',kind==='hollow'?'The textbook maple has a hollow trunk and a leafy crown.':'Wood is xylem. Old central wood and the outer conducting zone have different roles.',lang),25,523,372,22);
    panel(ctx,426,60,522,568);
    text(ctx,tr('葉：製糖，供應根部','Leaf supplies sugars to roots',lang),690,89,24,C.ink,'center');
    trunkSection(ctx,kind,state.hollowProgress??1);
    const span=caseTracks.flowBottom-caseTracks.flowTop;
    for(let i=0;i<4;i++){
      const wy=caseTracks.flowBottom-((t*.12+i/4)%1)*span;
      if(outcome.waterFlow)for(const x of caseTracks.water)water(ctx,x,wy,2.8);
      const sy=caseTracks.flowTop+((t*.1+i/4)%1)*span;
      if(kind!=='girdled'||sy<290)for(const x of caseTracks.sugar)sugar(ctx,x,sy,2.5);
    }
    const progress=state.hollowProgress??1,hollow=kind==='hollow'&&progress>=.9;
    // During the short hollowing transition, leave the changing core unobscured.
    // Never draw dark text across a partly dark cavity.
    if(kind!=='hollow'||progress===0||progress>=.9){
      text(ctx,tr(hollow?'中心中空':'中央老化',hollow?'Hollow centre':'Old central',lang),704,315,22,hollow?'#f2ecd9':C.ink,'center');
      text(ctx,tr(hollow?'外側繼續運輸':'木質部',hollow?'Outer flow intact':'xylem',lang),704,350,22,hollow?'#f2ecd9':C.ink,'center');
      if(!hollow)text(ctx,tr('不再運水','No water flow',lang),704,385,22,C.ink,'center');
    }
    text(ctx,tr('根：吸水，也需要糖','Root absorbs water and needs sugars',lang),690,522,22,C.ink,'center');
    text(ctx,tr('外側木質部：水','Outer xylem: water',lang),444,563,22,C.water);
    text(ctx,tr('更外側韌皮部：糖','Outer phloem: sugars',lang),697,563,22,C.sugar);
    text(ctx,tr('同心層縱剖示意，非實際管徑','Layered cutaway; widths not to scale',lang),444,599,18,C.muted);
    return [];
  }
  function draw(ctx,images,kind,state,lang,t){ctx.clearRect(0,0,960,640);ctx.fillStyle=C.paper;ctx.fillRect(0,0,960,640);return ({network,positions,microscopy,growth,cases})[kind](ctx,images,state,lang,t)||[];}
  function fullscreenBox(w,h,ar=1.5){const portrait=h>w||w<=750;const availableW=portrait?w-20:w-24-340-16;const availableH=portrait?.65*h-195:h-300;const width=Math.max(0,Math.min(availableW,availableH*ar));return {width,height:width/ar,availableW,availableH,portrait};}
  const api={C,sources,crops,draw,annualRadii,caseOutcome,fullscreenBox,water,sugar,symbolScale,transportPositions,trunkLayers,caseTracks};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.PlantStructureModel=api;
})(typeof globalThis==='object'?globalThis:this);

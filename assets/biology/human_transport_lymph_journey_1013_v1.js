/* Teacher-authorised lymph lesson: source → local close-up → source → return.
 * Source PNGs stay unchanged. The close-up is an independent static cartoon;
 * only fluid symbols move. No damaged-wall hole or red-cell escape is drawn.
 * One shared LivingBook clock; times/scales are pedagogical, not measurements.
 */
(function(root){
  'use strict';
  const C=root.HumanTransportCutaways,G=root.HumanTransportCirculation;
  const P=(zh,en)=>[zh,en],BG='#11261f',INK='#f2ecd9',CYAN='#55e9ff',GREEN='#a6df80';
  const MEDIA='assets/biology/human_transport_media_1012_v1/',images=new Map();
  const clamp=n=>Math.max(0,Math.min(1,n)),mod=n=>((n%1)+1)%1;
  const FOCUS=Object.freeze([264,110,58,46]);
  const STEPS=Object.freeze([
    {id:0,name:P('先看原圖','Original map'),duration:8,
      title:P('先認識：微血管網旁，還有淋巴管','First: lymphatic vessels beside the capillary network'),
      text:P('先找原圖中的小動脈、微血管網與小靜脈：血液沿這條路流動。旁邊綠色的管道是淋巴管，伸入組織中的起始端是封閉的盲端，不是接到小動脈的另一條血管。\n\n接著放大黃框內的一小段微血管，看血漿中的部分水與小分子如何到細胞之間。原圖配色用來區分構造；不是把靜脈血或淋巴畫成真實顏色。',
        'Find the arteriole, capillary network and venule: blood follows that route. The green vessels are lymphatics. Their initial ends in tissue are closed blind ends, not another blood vessel joined to the arteriole.\n\nNext, enlarge the small capillary region in the yellow frame to see how some plasma water and small solutes reach spaces between cells. Source colours identify structures, not the true colours of blood or lymph.')},
    {id:1,name:P('放大微血管','Capillary close-up'),duration:12,
      title:P('放大一小段：水與小分子穿過微血管壁','A local close-up: water and small solutes cross the wall'),
      text:P('左邊保留原圖與黃框；右邊是同一觀察位置的放大卡通，不是另一套循環。微血管壁主要由一層內皮細胞構成。這裡用放大的細胞間隙，示意水與小分子在壓力作用下由血漿進入細胞間，形成組織液。\n\n不是血管破裂，也不是整份血漿全漏出來。正常紅血球留在血管內，多數大蛋白也不會像水一樣自由通過；圖中的間隙與分子都不是實際比例。不同組織的微血管通透性也不完全相同。',
        'The original map and yellow frame remain on the left. The right-hand cartoon enlarges that observation site; it is not a different circulation. A capillary wall consists mainly of one endothelial-cell layer. Enlarged junction gaps represent pressure-driven passage of water and small solutes from plasma into spaces between cells, forming tissue fluid.\n\nThis is not a ruptured vessel or loss of all plasma. Normal red cells stay inside; most large proteins do not cross as freely as water. Gaps and molecules are not to scale, and permeability varies between tissues.')},
    {id:2,name:P('進入淋巴管','Into lymphatics'),duration:10,
      title:P('回到原圖：組織液進入盲端淋巴管','Back to the map: tissue fluid enters initial lymphatics'),
      text:P('剛才離開微血管的液體，現在位在組織細胞之間。當周圍組織的壓力高於初始淋巴管內的壓力時，重疊的內皮細胞邊緣可像小門一樣被推開，讓組織液進入；壓力反過來時，入口有助於阻止倒流。\n\n液體在細胞間叫組織液；進入淋巴管後才叫淋巴。沿綠色箭頭看入口，再接著追蹤它經過淋巴結、回到靜脈的路線。',
        'Fluid that left the capillary now lies between tissue cells. When surrounding tissue pressure exceeds pressure inside an initial lymphatic, overlapping endothelial edges can open like small flaps, admitting tissue fluid. A reversed pressure difference helps close the entrance against backflow.\n\nIt is called tissue fluid between cells, and lymph after entering a lymphatic. Follow the green arrows at the entrances, then trace the route through lymph nodes back to veins.')},
    {id:3,name:P('回到大靜脈','Back to vena cava'),duration:12,
      title:P('接上回程：淋巴管、淋巴結，再回到靜脈','The return: lymphatic vessels, nodes, then veins'),
      text:P('離開組織區後，淋巴沿較大的淋巴管運送，途中經過淋巴結。肌肉活動、呼吸及淋巴管本身的收縮等協助流動，管內瓣膜幫助維持單向；不是淋巴結充當幫浦把液體吸進去。\n\n淋巴最後注入頸根部的靜脈，接著隨靜脈血經上大靜脈回右心房。左側原圖是局部組織，右側是較遠處的回程示意，大小與距離不可直接相比。血漿 → 組織液 → 淋巴 → 靜脈血：位置換了，名稱跟著改變。',
        'Beyond the tissue region, lymph travels in larger lymphatic vessels and passes through lymph nodes. Muscle activity, breathing and lymphatic contractions help movement; valves help prevent backflow. A lymph node is not a suction pump.\n\nLymph enters veins at the root of the neck, then travels with venous blood through the superior vena cava to the right atrium. The original on the left shows local tissue; the right is a distant return route at a different scale. Plasma → tissue fluid → lymph → venous blood: the name changes with location.')}
  ]);
  const TOTAL=STEPS.reduce((n,s)=>n+s.duration,0);
  function phase(s,t){
    let elapsed=Math.max(0,t-(s.lymphStarted||0));
    if(s.lymphStep!=='auto'&&s.lymphStep!==undefined){const step=STEPS[Math.max(0,Math.min(3,Number(s.lymphStep)||0))];return{step,elapsed,auto:false};}
    elapsed%=TOTAL;for(const step of STEPS){if(elapsed<step.duration)return{step,elapsed,auto:true};elapsed-=step.duration;}
    return{step:STEPS[0],elapsed:0,auto:true};
  }
  function picture(D){const file=MEDIA+(D.tr(P('zh','en'))==='zh'?'lymph_capillaries_seer_zh.png':'lymph_capillaries_seer_en.png');let im=images.get(file);if(!im&&typeof Image!=='undefined'){im=new Image();im.src=file;images.set(file,im);}return im;}
  function source(ctx,D,x,y,w,h){const im=picture(D),k=Math.min(w/520,h/288),b={x:x+(w-520*k)/2,y:y+(h-288*k)/2,w:520*k,h:288*k,k,im};
    if(im?.complete&&im.naturalWidth)ctx.drawImage(im,b.x,b.y,b.w,b.h);
    else{ctx.fillStyle='#1c3d34';ctx.fillRect(x,y,w,h);text(ctx,D,P('原圖載入中','Loading source image'),x+10,y+35);}
    return b;
  }
  function text(ctx,D,p,x,y,size=22,color=INK,align='left'){ctx.save();ctx.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(D.tr(p),x,y);ctx.restore();}
  function wrap(ctx,D,p,x,y,w,size=22,color=INK){ctx.save();ctx.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;const str=D.tr(p),units=/\s/.test(str)?str.split(/\s+/).map(a=>a+' '):Array.from(str);let row='',n=0;for(const u of units){if(row&&ctx.measureText(row+u).width>w){text(ctx,D,[row.trim(),row.trim()],x,y+28*n++,size,color);row=u;}else row+=u;}if(row)text(ctx,D,[row.trim(),row.trim()],x,y+28*n++,size,color);ctx.restore();}
  function line(ctx,path,color,w=2){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();path.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](...p));ctx.stroke();ctx.restore();}
  function ellipse(ctx,x,y,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function frame(ctx,D,b,color='#fde047',region=FOCUS){const [x,y,w,h]=region;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.setLineDash([6,4]);ctx.strokeRect(b.x+x*b.k,b.y+y*b.k,w*b.k,h*b.k);ctx.restore();}
  function arrows(ctx,path,color){line(ctx,path,color+'aa',2.5);const p=G.point(path,.65);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-6,-5);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();ctx.restore();}
  function fluid(ctx,D,path,t,count=3,size=7){for(let i=0;i<count;i++){const u=mod(t*.12+i/count),p=G.point(path,u);ctx.save();ctx.globalAlpha=Math.min(1,u*12,(1-u)*12);D.water(ctx,p.x,p.y,size);ctx.restore();}}
  function original(ctx,s,t,D,entering){
    const b=source(ctx,D,40,119,880,410);if(!entering){frame(ctx,D,b);const pulse=.6+.25*Math.sin(t*2);ctx.save();ctx.strokeStyle='#76b947';ctx.lineWidth=4;ctx.globalAlpha=pulse;ctx.beginPath();ctx.ellipse(b.x+215*b.k,b.y+221*b.k,83*b.k,35*b.k,-.25,0,Math.PI*2);ctx.stroke();ctx.restore();}
    else for(const route of [[[277,136],[278,146],[273,155]],[[322,166],[320,179],[307,186]],[[185,157],[184,172],[180,185]]]){const p=route.map(([x,y])=>[b.x+x*b.k,b.y+y*b.k]);arrows(ctx,p,'#47883c');fluid(ctx,D,p,t,2,5.5);}
    wrap(ctx,D,entering?P('組織間壓力較高 → 入口瓣打開 → 組織液進淋巴管','Higher tissue pressure → entry flaps open → fluid enters lymphatics'):P('血管網旁的綠色管道是淋巴管；黃框下一站放大看。','Green vessels beside the blood network are lymphatics. Next: enlarge the yellow frame.'),24,567,912,22,entering?GREEN:INK);
  }
  const GAP_X=591.5,LEAK=Object.freeze([[GAP_X,343],[GAP_X,389],[GAP_X,431],[621,453]]);
  function cartoon(ctx,D,t){
    D.round(ctx,361,153,575,374,16,'#1c3d34','#789b85');
    text(ctx,D,P('一層內皮細胞','One endothelial layer'),387,205,22,'#d4daa8');
    const g=ctx.createLinearGradient(0,248,0,376);g.addColorStop(0,'#f7edc5');g.addColorStop(1,'#e6d8a5');ctx.fillStyle=g;ctx.fillRect(382,249,543,128);
    // Static blood cells, irregular positions/tilts; no cell can leave the lumen.
    for(let i=0;i<37;i++){const x=398+(i*83.73)%488,y=269+(i*47.31)%65;C.render.rbc(ctx,x,y,8+(i%4)*.5,.8,Math.sin(i*2.63)*.55);}
    for(const y of [236,389])for(let i=0;i<13;i++){const x=382+i*42+(y===389&&i===5?9:0),w=y===389&&i===4?32:y===389&&i===5?30:39;D.round(ctx,x,y-11,w,22,7,'#d4daa8','#6c8b5b');ellipse(ctx,x+w*.54,y,3.5,2.6,'#879165');}
    text(ctx,D,P('紅血球留在血管內','Red cells stay inside'),401,363,22,'#762f3d');
    ctx.save();ctx.strokeStyle='#fde047';ctx.lineWidth=2;ctx.beginPath();ctx.arc(GAP_X,389,17,0,Math.PI*2);ctx.stroke();ctx.restore();
    line(ctx,[[609,399],[650,421]],'#fde047',2);
    text(ctx,D,P('細胞間隙','Junction gap'),658,429,22,'#fde047');
    arrows(ctx,LEAK,CYAN);fluid(ctx,D,LEAK,t,3,7);
    text(ctx,D,P('水與小分子 → 組織液','Water + small solutes → tissue fluid'),387,494,22,CYAN);
  }
  function closeup(ctx,s,t,D,elapsed){
    const b=source(ctx,D,24,167,300,190);frame(ctx,D,b);
    text(ctx,D,P('原圖的這一小段','This small source region'),24,143,22,'#fde047');
    const sx=b.x+(FOCUS[0]+FOCUS[2])*b.k,sy=b.y+(FOCUS[1]+FOCUS[3]/2)*b.k;
    line(ctx,[[sx,sy],[342,sy],[361,237]],'#fde047',2);
    wrap(ctx,D,P('局部 → 放大','Local → enlarged'),24,397,300,24,'#fde047');
    wrap(ctx,D,P('不是另一根大血管；紅血球與間隙都不是實際比例。','Not a different large vessel; cells and gaps are not to scale.'),24,441,300,22);
    const u=clamp(elapsed/1.25),ease=u*u*(3-2*u);ctx.save();ctx.globalAlpha=ease;cartoon(ctx,D,t);ctx.restore();
    // Zoom a true source crop before cross-fading to the explanatory cartoon.
    if(u<1&&b.im?.complete&&b.im.naturalWidth){const [x,y,w,h]=FOCUS,k=b.k+(326/h-b.k)*ease,xx=b.x+x*b.k+(420-(b.x+x*b.k))*ease,yy=b.y+y*b.k+(166-(b.y+y*b.k))*ease;ctx.save();ctx.globalAlpha=1-ease;ctx.drawImage(b.im,x,y,w,h,xx,yy,w*k,h*k);ctx.restore();}
    wrap(ctx,D,P('不是破裂：血漿中的部分水與小分子穿過管壁。','Not a rupture: some plasma water and small solutes cross the wall.'),24,567,912,22);
  }
  function route(pieces){const samples=[];let length=0;for(const p of pieces){const r=C.geometry.curve(p);r.samples.forEach((q,i)=>{if(!samples.length||i)samples.push({...q,d:q.d+length});});length+=r.length;}return{samples,length};}
  const COLLECTOR=route([[[306,365],[380,366],[441,359],[485,354]],[[485,354],[583,347],[683,368],[742,350]],[[742,350],[831,342],[853,255],[843,196]]]);
  const VEIN=C.geometry.curve([[758,196],[812,186],[877,198],[930,196]]);
  const CAVA=route([[[930,196],[930,260],[930,366],[930,453]],[[930,453],[925,453],[920,453],[913,453]]]);
  function tube(ctx,radius=10){const pts=COLLECTOR.samples.map(p=>[p.x,p.y]);line(ctx,pts,'#376c4b',radius*2+5);line(ctx,pts,'#8cbb6b',radius*2+1);line(ctx,pts,'#e4eab9',radius*2-5);}
  function node(ctx){ellipse(ctx,651,356,53,36,'#91ad64','#b8d58e');ellipse(ctx,665,356,23,17,'#dce3b0');for(let i=0;i<5;i++){const a=1.15+i*.74;ellipse(ctx,651+Math.cos(a)*34,356+Math.sin(a)*21,9,8,'#d5ddab');ellipse(ctx,651+Math.cos(a)*34,356+Math.sin(a)*21,5,4,'#8da976');}line(ctx,[[603,354],[631,360],[668,356],[700,355]],'#e4eab9',8);}
  function returning(ctx,s,t,D){
    const b=source(ctx,D,24,172,276,180);frame(ctx,D,b,GREEN,[164,180,85,76]);
    wrap(ctx,D,P('組織區：從這裡出發','Local tissue: start here'),24,146,300,22,GREEN);
    line(ctx,[[b.x+218*b.k,b.y+249*b.k],[286,356],[306,365]],GREEN,2);
    tube(ctx);node(ctx);
    for(const d of [113,320]){const p=C.geometry.at(COLLECTOR,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);line(ctx,[[-4,-8],[4,-3]],'#638846',2);line(ctx,[[-4,8],[4,3]],'#638846',2);ctx.restore();}
    C.render.tubes(ctx,[VEIN,CAVA],[18,18],0,2);ctx.save();C.render.clipTubes(ctx,[VEIN,CAVA],[18,18]);for(const [j,r]of [VEIN,CAVA].entries())C.geometry.cells(r,t+j*.7,[-7,7],36,25,6).forEach(p=>C.render.rbc(ctx,p.x,p.y,p.r,.25,p.angle+p.tilt));ctx.restore();
    // The lymphatic joins the vein inside its lumen, not beside its wall.
    tube(ctx);node(ctx);
    for(let i=0;i<7;i++){const p=C.geometry.at(COLLECTOR,mod(t*.065+i/7)*COLLECTOR.length);D.water(ctx,p.x,p.y,6);}
    const venousPath=[...VEIN.samples.filter(p=>p.x>=843).map(p=>[p.x,p.y]),...CAVA.samples.map(p=>[p.x,p.y])];fluid(ctx,D,venousPath,t,3,6);
    arrows(ctx,COLLECTOR.samples.map(p=>[p.x,p.y]),GREEN);arrows(ctx,CAVA.samples.map(p=>[p.x,p.y]),INK);
    text(ctx,D,P('淋巴管與瓣膜','Lymphatics + valves'),332,321,22,GREEN);
    text(ctx,D,P('淋巴結','Lymph node'),592,414,22,GREEN);
    wrap(ctx,D,P('頸根部的靜脈','Veins at neck root'),702,137,230,22,'#df8794');
    text(ctx,D,P('上大靜脈','Superior vena cava'),917,396,22,'#df8794','right');
    D.round(ctx,744,422,169,64,12,'#315847','#7ca889');text(ctx,D,P('右心房','Right atrium'),827,461,22,INK,'center');
    text(ctx,D,P('局部組織 ↗ 遠端回流（不同尺度）','Local tissue ↗ distant return (different scales)'),24,526,22,'#b9cbbd');
    wrap(ctx,D,P('組織液 → 淋巴管 → 淋巴結 → 靜脈 → 上大靜脈 → 心臟','Tissue fluid → lymphatics → nodes → veins → vena cava → heart'),24,567,912,22,'#fde047');
  }
  function draw(ctx,s,t,D){const q=phase(s,t);ctx.save();ctx.fillStyle=BG;ctx.fillRect(0,0,960,600);wrap(ctx,D,q.step.title,24,39,912,26,'#fde047');
    if(q.step.id===0)original(ctx,s,t,D,false);else if(q.step.id===1)closeup(ctx,s,t,D,q.elapsed);else if(q.step.id===2)original(ctx,s,t,D,true);else returning(ctx,s,t,D);
    s.lymphTrace={step:q.step.id,auto:q.auto,directCapillaryReturn:false,redCellsOutsideBlood:0,returnTo:'neck veins → superior vena cava → right atrium',sourceUnchanged:true,zoomSource:FOCUS};
    D.status(P('原圖 → 微血管局部放大 → 回原圖看入口 → 追蹤淋巴回程。','Original map → capillary close-up → entry on the map → lymph return.'));ctx.restore();return s.lymphTrace;
  }
  function explain(s){const q=phase(s,s.elapsed||0);return{title:q.step.title,text:q.step.text};}
  root.HumanTransportLymphJourney=Object.freeze({draw,explain,phase,steps:STEPS,total:TOTAL,geometry:Object.freeze({focus:FOCUS,leak:LEAK,collector:COLLECTOR,vein:VEIN,cava:CAVA})});
})(globalThis);

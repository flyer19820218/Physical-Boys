/* V5 microscope teaching model. Coordinates are specimen-space, not calibrated micrometres. */
(()=>{
  'use strict';
  let lang='zh',currentTab='scopeTypes',trackingRaf=0,lastTime=0;
  const $=id=>document.getElementById(id);
  const tr=(zh,en)=>lang==='en'?en:zh;
  const keys=['scopeLab','scopeInversion','scopeTracking'];
  let specimen='plant',glyph='F',toolIndex=0,toolAnswer=null;
  const states=Object.fromEntries(keys.map(id=>[id,{objective:4,lamp:80,coarse:id==='scopeLab'?2:0,fine:0,x:0,y:0,time:0,paused:false}]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const scale=s=>s.objective/4*2.7;
  const imagePoint=(s,x,y)=>({x:320-(x+s.x)*scale(s),y:320-(y+s.y)*scale(s)});
  const organism=s=>({x:-20+16*Math.sin(s.time*.48),y:12+12*Math.sin(s.time*.73),angle:Math.atan2(12*.73*Math.cos(s.time*.73),16*.48*Math.cos(s.time*.48))});
  const stageFactor=stage=>Math.min(1.25,((stage.clientHeight||220)-90)/90,Math.max(.5,((stage.clientWidth||600)-160)/110));
  function labels(el,zh,en){el.dataset.zh=zh;el.dataset.en=en;el.textContent=tr(zh,en);return el;}
  function button(zh,en,handler,className='action-btn'){
    const b=labels(document.createElement('button'),zh,en);b.type='button';b.className=className;b.addEventListener('click',handler);return b;
  }
  function makeControls(id){
    const host=$(id+'Controls'),s=states[id];
    const mag=document.createElement('div');mag.className='scope-control';
    const label=labels(document.createElement('label'),'更換物鏡（目鏡固定 10 倍）','Change objective (10× eyepiece)');label.htmlFor=id+'Objective';mag.append(label);
    const sel=document.createElement('select');sel.id=id+'Objective';
    [4,10,40].forEach(n=>{const opt=labels(document.createElement('option'),n+' 倍物鏡 → '+n*10+' 倍',n+'× objective → '+n*10+'×');opt.value=n;sel.append(opt);});
    sel.addEventListener('change',()=>{s.objective=Number(sel.value);$(id+'Coarse').disabled=s.objective===40;draw(id);});mag.append(sel);host.append(mag);
    function range(name,zh,en,min,max,step,value,noteZh,noteEn){
      const box=document.createElement('div');box.className='scope-control';
      const lab=labels(document.createElement('label'),zh,en);lab.htmlFor=id+name;
      const inp=document.createElement('input');inp.id=id+name;inp.type='range';inp.min=min;inp.max=max;inp.step=step;inp.value=value;
      inp.addEventListener('input',()=>{s[name.toLowerCase()]=Number(inp.value);draw(id);});
      box.append(lab,inp,labels(document.createElement('small'),noteZh,noteEn));host.append(box);
    }
    range('Lamp','光源／光圈：調整入射光','Light / diaphragm: adjust illumination',10,100,1,s.lamp,'先保持同樣照明，比較低倍與高倍。','Keep the same illumination first; compare low and high power.');
    range('Coarse','粗調節輪','Coarse focus',-6,6,1,s.coarse,'40 倍物鏡下鎖定粗調，避免撞壞玻片。','Coarse focus is locked with the 40× objective to protect the slide.');
    range('Fine','細調節輪','Fine focus',-4,4,.1,s.fine,'微調至輪廓清楚；高倍只使用細調。','Adjust until outlines are sharp; at high power use fine focus only.');
    const actions=document.createElement('div');actions.className='control-row';
    actions.append(button('重新開始','Reset',()=>reset(id)));
    if(id==='scopeTracking')actions.append(button('暫停游動','Pause swimming',()=>{s.paused=!s.paused;syncPause();stopTracking();draw(id);startTracking();},'action-btn primary'));
    host.after(actions);
  }
  function syncPause(){
    const b=$('scopeTrackingControls').nextElementSibling.querySelector('.primary');
    labels(b,states.scopeTracking.paused?'繼續游動':'暫停游動',states.scopeTracking.paused?'Resume swimming':'Pause swimming');
  }
  function reset(id){
    const s=states[id];Object.assign(s,{objective:4,lamp:80,coarse:id==='scopeLab'?2:0,fine:0,x:0,y:0,time:0,paused:false});
    ['Objective','Lamp','Coarse','Fine'].forEach(name=>{const el=$(id+name);el.value=s[name.toLowerCase()];el.disabled=false;});
    if(id==='scopeTracking'){syncPause();stopTracking();startTracking();}draw(id);
  }
  function move(id,dx,dy){const s=states[id];s.x=clamp(s.x+dx,-55,55);s.y=clamp(s.y+dy,-45,45);draw(id);}
  function makeStage(id){
    const stage=$(id+'Stage'),host=$(id+'Moves');
    const dirs=[['up','↑ 玻片向上','↑ Slide up',0,-4],['left','← 玻片向左','← Slide left',-4,0],['down','↓ 玻片向下','↓ Slide down',0,4],['right','→ 玻片向右','→ Slide right',4,0]];
    dirs.forEach(([cls,zh,en,dx,dy])=>host.append(button(zh,en,()=>move(id,dx,dy),cls)));
    let drag=null;
    stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;const s=states[id];drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,sx:s.x,sy:s.y,factor:stageFactor(stage)};stage.setPointerCapture(e.pointerId);e.preventDefault();});
    stage.addEventListener('pointermove',e=>{
      if(!drag||drag.pointer!==e.pointerId)return;
      const s=states[id];s.x=clamp(drag.sx+(e.clientX-drag.x)/drag.factor,-55,55);s.y=clamp(drag.sy+(e.clientY-drag.y)/drag.factor,-45,45);draw(id);
    });
    const end=e=>{if(drag&&drag.pointer===e.pointerId)drag=null;};
    stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',()=>drag=null);
    stage.addEventListener('keydown',e=>{const d={ArrowUp:[0,-4],ArrowDown:[0,4],ArrowLeft:[-4,0],ArrowRight:[4,0]}[e.key];if(d){e.preventDefault();move(id,...d);}});
  }
  function plantCell(ctx,x,y,r){
    ctx.save();ctx.translate(x,y);
    ctx.beginPath();ctx.roundRect(-r,-r*.8,r*2,r*1.6,r*.25);ctx.fillStyle='rgba(151,190,83,.38)';ctx.fill();ctx.strokeStyle='#4b713d';ctx.lineWidth=Math.max(.8,r*.06);ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,0,r*.55,r*.5,0,0,Math.PI*2);ctx.fillStyle='rgba(202,219,125,.35)';ctx.fill();
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.beginPath();ctx.ellipse(Math.cos(a)*r*.76,Math.sin(a)*r*.57,r*.12,r*.07,a,0,Math.PI*2);ctx.fillStyle='#578b48';ctx.fill();}
    ctx.beginPath();ctx.ellipse(r*.38,r*.24,r*.17,r*.13,.3,0,Math.PI*2);ctx.fillStyle='#6c617b';ctx.fill();ctx.restore();
  }
  function swimBody(ctx,r){
    const g=ctx.createLinearGradient(-r,0,r,0);g.addColorStop(0,'#719657');g.addColorStop(.5,'#b6d38e');g.addColorStop(1,'#568750');
    ctx.beginPath();ctx.ellipse(0,0,r,r*.48,0,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#315b3b';ctx.lineWidth=Math.max(.9,r*.05);ctx.stroke();
    for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(-r*.58+i*r*.22,Math.sin(i*2)*r*.16,r*.10,r*.06,.4,0,Math.PI*2);ctx.fillStyle='#5d9652';ctx.fill();}
    ctx.beginPath();ctx.ellipse(-r*.15,r*.04,r*.19,r*.15,0,0,Math.PI*2);ctx.fillStyle='#536c82';ctx.fill();
    ctx.beginPath();ctx.ellipse(r*.5,-r*.08,r*.13,r*.12,0,0,Math.PI*2);ctx.fillStyle='rgba(238,249,204,.8)';ctx.fill();
  }
  // A spherical algal colony: surface dots are individual cells, not organelles.
  function algalColony(ctx,r,daughter=false){
    const g=ctx.createRadialGradient(-r*.35,-r*.35,r*.08,0,0,r);
    g.addColorStop(0,'rgba(226,241,156,.35)');g.addColorStop(.7,'rgba(89,154,61,.16)');g.addColorStop(1,'rgba(48,110,52,.5)');
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#507844';ctx.lineWidth=Math.max(.7,r*.022);ctx.stroke();
    for(let i=0;i<(daughter?50:150);i++){
      const count=daughter?50:150,a=i*2.399963,rho=Math.sqrt((i+.5)/count)*r*.94;
      ctx.beginPath();ctx.ellipse(Math.cos(a)*rho,Math.sin(a)*rho,r*.025,r*.032,a,0,Math.PI*2);ctx.fillStyle='#4d7d37';ctx.fill();
    }
    if(!daughter)for(const [x,y,z] of [[-.32,-.2,.23],[.3,.24,.18],[-.16,.4,.12]]){ctx.save();ctx.translate(x*r,y*r);algalColony(ctx,z*r,true);ctx.restore();}
  }
  function diatom(ctx,r,disc){
    ctx.save();ctx.lineWidth=Math.max(.8,r*.025);ctx.strokeStyle='#796d38';
    const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'rgba(238,211,136,.7)');g.addColorStop(.5,'rgba(162,136,63,.42)');g.addColorStop(1,'rgba(244,216,151,.65)');
    ctx.beginPath();if(disc)ctx.arc(0,0,r,0,Math.PI*2);else{ctx.moveTo(-r,0);ctx.bezierCurveTo(-r*.35,-r*.55,r*.35,-r*.55,r,0);ctx.bezierCurveTo(r*.35,r*.55,-r*.35,r*.55,-r,0);}ctx.fillStyle=g;ctx.fill();ctx.stroke();
    ctx.save();ctx.clip();ctx.strokeStyle='rgba(105,90,44,.6)';ctx.lineWidth=Math.max(.6,r*.018);
    if(disc){
      for(let j=1;j<=4;j++){ctx.beginPath();ctx.arc(0,0,r*j/5,0,Math.PI*2);ctx.stroke();}
      for(let i=0;i<28;i++){const a=i*Math.PI*2/28;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.15,Math.sin(a)*r*.15);ctx.lineTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);ctx.stroke();}
    }else{
      for(let i=-8;i<=8;i++){const x=i*r/10;ctx.beginPath();ctx.moveTo(x,-r*.43);ctx.lineTo(x,r*.43);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(-r*.84,0);ctx.lineTo(r*.84,0);ctx.lineWidth=Math.max(.8,r*.035);ctx.stroke();
    }
    ctx.restore();ctx.restore();
  }
  // Seven-segment digits preserve the lecture's electronic-clock inversion exercise.
  function digitalDigits(ctx,unit){
    const digits={'2':[0,1,6,4,3],'5':[0,5,6,2,3],'0':[0,1,2,3,4,5]},segments=[[0,0,1,0],[1,0,1,1],[1,1,1,2],[0,2,1,2],[0,1,0,2],[0,0,0,1],[0,1,1,1]];
    ctx.lineWidth=unit*.13;ctx.lineCap='square';ctx.strokeStyle=ctx.fillStyle;
    for(const [digit,x] of [['2',-2.2],['5',-.2],['0',1.2]])for(const n of digits[digit]){const [a,b,c,d]=segments[n];ctx.beginPath();ctx.moveTo((a+x)*unit,(b-1)*unit);ctx.lineTo((c+x)*unit,(d-1)*unit);ctx.stroke();}
    for(const y of [-.35,.35]){ctx.beginPath();ctx.arc(-.65*unit,y*unit,unit*.075,0,Math.PI*2);ctx.fill();}
  }
  function draw(id){
    const s=states[id],ctx=$(id+'Canvas').getContext('2d'),k=scale(s),R=274;
    ctx.clearRect(0,0,640,640);ctx.fillStyle='#0b1a15';ctx.fillRect(0,0,640,640);
    ctx.save();ctx.beginPath();ctx.arc(320,320,R,0,Math.PI*2);ctx.clip();
    const illumination=s.lamp/100*Math.sqrt(4/s.objective),shade=Math.round(55+190*illumination);
    const g=ctx.createRadialGradient(300,290,50,320,320,R);g.addColorStop(0,`rgb(${shade},${shade+5},${Math.max(0,shade-12)})`);g.addColorStop(1,`rgb(${Math.round(shade*.8)},${Math.round(shade*.83)},${Math.round(shade*.76)})`);ctx.fillStyle=g;ctx.fillRect(0,0,640,640);
    ctx.save();ctx.filter=`blur(${Math.min(12,Math.abs(s.coarse+s.fine)*1.25*Math.sqrt(s.objective/4))}px)`;
    if(id==='scopeLab'){
      if(specimen==='plant'){for(let row=-5;row<=5;row++)for(let col=-5;col<=5;col++){
        const wx=col*16+(row%2)*7,wy=row*14;
        const p=imagePoint(s,wx,wy);if(Math.hypot(p.x-320,p.y-320)<R+10*k){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI);plantCell(ctx,0,0,7*k);ctx.restore();}
      }}
      else if(specimen==='algae')for(const [x,y,r] of [[0,0,20],[-48,-32,13],[49,25,16],[-37,47,9],[34,-45,11]]){const p=imagePoint(s,x,y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI);algalColony(ctx,r*k);ctx.restore();}
      else for(const [x,y,r,disc,a] of [[0,0,10,true,0],[-25,20,13,false,.65],[26,-14,15,false,-.4],[-38,-29,9,true,0],[40,35,8,true,0],[4,40,14,false,1.25],[-58,4,12,false,.25],[8,-46,8,true,0]]){const p=imagePoint(s,x,y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a+Math.PI);diatom(ctx,r*k,disc);ctx.restore();}
    }else if(id==='scopeInversion'){
      const p=imagePoint(s,-24,12);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI);ctx.font=`700 ${18*k}px "JetBrains Mono",monospace`;ctx.fillStyle='#473c2b';ctx.textAlign='center';ctx.textBaseline='middle';if(glyph==='digital')digitalDigits(ctx,7*k);else ctx.fillText(glyph,0,0);ctx.restore();
    }else{
      const o=organism(s),p=imagePoint(s,o.x,o.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(o.angle+Math.PI);swimBody(ctx,6*k);ctx.restore();
    }
    ctx.restore();ctx.restore();
    ctx.beginPath();ctx.arc(320,320,R+3,0,Math.PI*2);ctx.strokeStyle='#718f83';ctx.lineWidth=9;ctx.stroke();
    // Reticle is a fixed eyepiece reference; it is not part of the specimen.
    ctx.strokeStyle='rgba(73,74,58,.65)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(307,320);ctx.lineTo(333,320);ctx.moveTo(320,307);ctx.lineTo(320,333);ctx.stroke();
    const host=$(id+'Readout');host.replaceChildren();
    for(const text of [tr('總倍率：','Total: ')+s.objective*10+'×',tr('相對視野直徑：','Relative field diameter: ')+Math.round(4/s.objective*100)+'%',tr(Math.abs(s.coarse+s.fine)<.35?'已對焦':'調整至清楚',Math.abs(s.coarse+s.fine)<.35?'In focus':'Adjust focus')]){const el=document.createElement('span');el.textContent=text;host.append(el);}
    if(id!=='scopeLab'){
      const stage=$(id+'Stage'),glass=stage.querySelector('.glass-slide'),mark=stage.querySelector('.glass-sample');
      const stageScale=stageFactor(stage);
      glass.style.transform=`translate(${s.x*stageScale}px,${s.y*stageScale}px)`;
      const o=id==='scopeTracking'?organism(s):{x:-24,y:12,angle:0};
      mark.style.left=`calc(50% + ${o.x*1.25}px)`;mark.style.top=`calc(50% + ${o.y*1.25}px)`;
      mark.style.transform=`translate(-50%,-50%) rotate(${o.angle}rad)`;
      if(id==='scopeInversion'&&glyph!=='digital')mark.textContent=glyph;
      if(id==='scopeTracking'){
        const p=imagePoint(s,o.x,o.y),distance=Math.hypot(p.x-320,p.y-320);
        const message=s.paused?tr('游動已暫停；可以先練習把影像移到中央。','Swimming is paused; practice centering the image.'):distance>R+6*k?tr('離開視野了！先換低倍找回，再把影像移到中央。','Out of view! Switch to low power to find it, then center the image.'):distance<36?tr('已靠近中央！可以試換高倍，觀察追蹤是否變難。','Near the center! Try high power and compare tracking difficulty.'):tr('小生物正在游動；移動玻片，讓倒像保持在中央附近。','The organism is swimming; move the slide to keep its inverted image near the center.');
        if($('trackingStatus').textContent!==message)$('trackingStatus').textContent=message;
      }
    }
  }
  function stopTracking(){if(trackingRaf)cancelAnimationFrame(trackingRaf);trackingRaf=0;lastTime=0;}
  function startTracking(){
    if(trackingRaf||currentTab!=='scopeTracking'||states.scopeTracking.paused||document.hidden)return;
    function frame(now){
      trackingRaf=0;if(currentTab!=='scopeTracking'||states.scopeTracking.paused||document.hidden)return;
      if(lastTime)states.scopeTracking.time+=Math.min(.05,(now-lastTime)/1000);lastTime=now;draw('scopeTracking');trackingRaf=requestAnimationFrame(frame);
    }
    trackingRaf=requestAnimationFrame(frame);
  }
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
    stopTracking();currentTab=btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-selected',String(b===btn));});
    document.querySelectorAll('.lesson').forEach(p=>p.hidden=p.id!==currentTab);
    if(states[currentTab])draw(currentTab);startTracking();
  }));
  document.addEventListener('visibilitychange',()=>{stopTracking();startTracking();});
  window.addEventListener('pagehide',stopTracking);
  window.addEventListener('pageshow',startTracking);
  const parts=[
    ['目鏡','Eyepiece','眼睛靠近觀察的鏡片。本模型目鏡為 10 倍。','The lens you look through. This model uses a 10× eyepiece.'],
    ['物鏡','Objective','靠近標本的鏡片；轉動旋轉盤選擇低倍或高倍。總倍率＝目鏡倍率 × 物鏡倍率。','The lens near the specimen; use the nosepiece to select low or high power. Total magnification = eyepiece × objective.'],
    ['載物臺','Stage','放置並固定玻片。移動玻片時，目鏡中的影像向相反方向移動。','Holds the slide. Moving it makes the eyepiece image move in the opposite direction.'],
    ['調節輪','Focus knobs','粗調改變較大，細調作微調；高倍只能使用細調節輪。','Coarse focus makes larger changes; fine focus makes smaller adjustments. Use fine focus only at high power.'],
    ['光源與光圈','Light and diaphragm','調整進入標本的光線。高倍變暗時可增加照明；不是把標本染得更亮。','Control light passing through the specimen. Increase illumination if the high-power field is dark; this does not dye the specimen.']
  ];
  let selectedPart=0;
  function paintPart(){const p=parts[selectedPart];$('partStatus').textContent=tr(p[2],p[3]);$('partButtons').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===selectedPart);b.setAttribute('aria-pressed',String(i===selectedPart));});}
  parts.forEach((p,i)=>$('partButtons').append(button(p[0],p[1],()=>{selectedPart=i;paintPart();},'choice')));
  const specimens=[
    ['plant','植物細胞','Plant cells','先觀察規則排列的細胞，再提高倍率。示意圖中的細胞壁與內部構造，下一小單元會仔細介紹。','Observe regularly arranged cells, then increase magnification. Cell walls and internal structures are explored in the next unit.'],
    ['algae','球形綠藻群體','Spherical algal colonies','先找一個完整群體，再放大表面的小細胞。大球不是一個細胞；小球示意子群體。','Find a whole colony, then enlarge its surface cells. The large sphere is not one cell; the smaller spheres depict daughter colonies.'],
    ['diatoms','矽藻','Diatoms','低倍比較圓盤與舟形，高倍看外殼紋路。圖案只呈現典型特徵，不能用來鑑定物種。','Compare discs and boat-shaped forms at low power; inspect shell patterns at high power. Typical features are shown, not enough to identify a species.']
  ];
  function paintSpecimen(){const p=specimens.find(p=>p[0]===specimen);$('specimenNote').textContent=tr(p[3],p[4]);$('specimenButtons').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',specimens[i][0]===specimen);b.setAttribute('aria-pressed',String(specimens[i][0]===specimen));});}
  specimens.forEach(p=>$('specimenButtons').append(button(p[1],p[2],()=>{specimen=p[0];paintSpecimen();draw('scopeLab');},'choice')));
  const glyphs=[['F','字母 F','Letter F'],['b','字母 b','Letter b'],['digital','電子數字 2:50','Digital digits 2:50']];
  function paintGlyph(){
    $('glyphButtons').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',glyphs[i][0]===glyph);b.setAttribute('aria-pressed',String(glyphs[i][0]===glyph));});
    const mark=$('scopeInversionStage').querySelector('.glass-sample');mark.replaceChildren();
    if(glyph==='digital'){
      const c=document.createElement('canvas');c.width=140;c.height=62;c.style.width='110px';c.style.height='auto';
      const ctx=c.getContext('2d');ctx.translate(70,31);ctx.fillStyle='#fde047';digitalDigits(ctx,20);mark.append(c);
    }else mark.textContent=glyph;
  }
  glyphs.forEach(p=>$('glyphButtons').append(button(p[1],p[2],()=>{glyph=p[0];paintGlyph();draw('scopeInversion');},'choice')));
  const tools=[
    ['觀察蕨類葉背上的孢子囊堆外形。','Observe the surface shape of fern sori on a leaf.',0,'標本不透明，想看表面與立體形態，選解剖顯微鏡。','Choose a dissecting microscope for the opaque surface and its depth.'],
    ['觀察薄玻片中一滴池水裡的綠藻。','Observe green algae in a drop of pond water on a thin slide.',1,'標本薄且能透光，想看細胞與微小生物，選複式顯微鏡。','Choose a compound microscope for thin, light-transmitting specimens and microscopic organisms.'],
    ['研究光學顯微鏡難以分辨的細微構造。','Study fine structures beyond the resolving ability of a light microscope.',2,'需要更高解析度與特殊標本處理，使用電子顯微鏡。','Use an electron microscope when finer resolution and special specimen preparation are needed.']
  ];
  function paintTool(){const q=tools[toolIndex];$('toolQuestion').textContent=(toolIndex+1)+' / 3　'+tr(q[0],q[1]);$('toolFeedback').textContent=toolAnswer===null?tr('先選擇一種工具，再讀理由。','Select a tool, then read the reason.'):tr(toolAnswer===q[2]?'選對了！':'再比較一次：',toolAnswer===q[2]?'Good choice! ':'Compare again: ')+tr(q[3],q[4]);$('toolChoices').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===toolAnswer);b.setAttribute('aria-pressed',String(i===toolAnswer));});}
  [['解剖顯微鏡','Dissecting microscope'],['複式顯微鏡','Compound microscope'],['電子顯微鏡','Electron microscope']].forEach((p,i)=>$('toolChoices').append(button(p[0],p[1],()=>{toolAnswer=i;paintTool();},'choice')));
  $('toolNext').append(button('換一個觀察目標','Next observation target',()=>{toolIndex=(toolIndex+1)%tools.length;toolAnswer=null;paintTool();}));
  function setLang(next){
    lang=next;document.documentElement.lang=next==='zh'?'zh-Hant':'en';document.title=tr('顯微鏡與微小世界｜Physical-Boys','Microscopy and the Microscopic World | Physical-Boys');
    document.querySelectorAll('[data-zh][data-en]').forEach(el=>el.textContent=el.dataset[next]);
    $('langZh').classList.toggle('active',next==='zh');$('langEn').classList.toggle('active',next==='en');$('langZh').setAttribute('aria-pressed',String(next==='zh'));$('langEn').setAttribute('aria-pressed',String(next==='en'));
    $('introScreen').setAttribute('aria-label',tr('進入顯微鏡與微小世界','Enter Microscopy and the Microscopic World'));
    for(const [id,zh,en] of [
      ['scopeLabCanvas','倍率、亮度與調焦互動視野','Interactive field: magnification, light, and focus'],
      ['scopeInversionCanvas','玻片與影像的相反移動','Opposite movement of the slide and its image'],
      ['scopeTrackingCanvas','移動小生物的追蹤視野','Field for tracking a swimming organism'],
      ['scopeInversionStage','拖曳或按方向鍵移動玻片','Drag or use arrow keys to move the slide'],
      ['scopeTrackingStage','移動玻片追蹤小生物','Move the slide to track the organism']
    ])$(id).setAttribute('aria-label',tr(zh,en));
    document.querySelectorAll('[data-alt-zh][data-alt-en]').forEach(el=>el.alt=el.dataset[next==='zh'?'altZh':'altEn']);
    paintPart();paintSpecimen();paintGlyph();paintTool();syncPause();keys.forEach(draw);
  }
  keys.forEach(makeControls);makeStage('scopeInversion');makeStage('scopeTracking');
  $('langZh').addEventListener('click',()=>setLang('zh'));$('langEn').addEventListener('click',()=>setLang('en'));
  $('introScreen').addEventListener('click',()=>{$('introScreen').hidden=true;document.body.style.overflow='';$('langZh').focus();});
  document.body.style.overflow='hidden';setLang('zh');
})();

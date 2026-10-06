/* Photo-backed optical teaching model. Original microscopy and V1 procedures stay byte-identical. */
(()=>{
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const magnification=s=>s.objective*10;
 const fieldDiameter=s=>4/s.objective;
 // Qualitative lamp/diaphragm teaching response, NOT measured photometry.
 const transmission={4:1,10:.62,40:.28};
 const illumination=s=>clamp(Math.pow(s.lamp/45,1.65)*transmission[s.objective],.03,1);
 const focusError=s=>Math.abs(s.coarse+s.fine+({4:0,10:.15,40:.3}[s.objective]));
 const imageShift=s=>({x:-s.x*s.objective/4,y:-s.y*s.objective/4});
 const initial=()=>({objective:4,lamp:45,coarse:2.5,fine:0,x:-60,y:40,loaded:false,phase:0});
 function requirement(s){
  return [true,s.objective===4&&illumination(s)>=.5,s.objective===4&&focusError(s)<.3,
   s.objective===4&&Math.hypot(s.x,s.y)<9,s.objective===40,illumination(s)>=.75,
   s.objective===40&&focusError(s)<.25][s.phase]??false;
 }
 function drawScope(ctx,image,s){
  const W=720,C=360,R=316,k=s.objective/4,shift=imageShift(s);
  ctx.clearRect(0,0,W,W);ctx.fillStyle='#0b1a15';ctx.fillRect(0,0,W,W);
  ctx.save();ctx.beginPath();ctx.arc(C,C,R,0,Math.PI*2);ctx.clip();
  ctx.fillStyle='#e3e9dc';ctx.fillRect(0,0,W,W);
  if(s.loaded&&image){
   const base=R*2*1.36/Math.min(image.width,image.height),w=image.width*base*k,h=image.height*base*k;
   const blur=Math.min(18,focusError(s)*1.5*Math.sqrt(k)),left=C+shift.x-w/2,top=C+shift.y-h/2;
   ctx.save();
   if(blur<.01)ctx.drawImage(image,left,top,w,h);
   else if(typeof ctx.filter==='string'){ctx.filter=`blur(${blur}px)`;ctx.drawImage(image,left,top,w,h);}
   else{
    // Older iPad Canvas lacks filter. Weighted shifted draws approximate Gaussian defocus,
    // while leaving the eyepiece rim and reticle sharp. No source image is modified.
    const weights=[1,4,6,4,1];let sum=0;
    for(let row=0;row<5;row++)for(let col=0;col<5;col++){
     const weight=weights[row]*weights[col];sum+=weight;ctx.globalAlpha=weight/sum;
     ctx.drawImage(image,left+(col-2)*blur,top+(row-2)*blur,w,h);
    }
   }
   ctx.restore();
  }
  ctx.fillStyle=`rgba(11,26,21,${1-illumination(s)})`;ctx.fillRect(0,0,W,W);
  const vignette=ctx.createRadialGradient(C,C,R*.65,C,C,R);
  vignette.addColorStop(0,'rgba(11,26,21,0)');vignette.addColorStop(1,'rgba(11,26,21,.25)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,W,W);ctx.restore();
  ctx.beginPath();ctx.arc(C,C,R+4,0,Math.PI*2);ctx.lineWidth=7;ctx.strokeStyle='#8da99e';ctx.stroke();
  ctx.save();ctx.strokeStyle='#f2ecd9';ctx.lineWidth=1.5;ctx.shadowColor='#0b1a15';ctx.shadowBlur=3;
  ctx.beginPath();ctx.moveTo(C-10,C);ctx.lineTo(C+10,C);ctx.moveTo(C,C-10);ctx.lineTo(C,C+10);ctx.stroke();ctx.restore();
 }
 const API={clamp,magnification,fieldDiameter,illumination,focusError,imageShift,initial,requirement,drawScope};
 globalThis.CellsMicroscopeLabV4=API;if(typeof module!=='undefined')module.exports=API;
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id),tr=(zh,en)=>document.documentElement.lang==='en'?en:zh;
 const photoAPI=globalThis.CellsPhotosV4,bench=$('observeBench'),side=bench.querySelector('.scope-sidebar');
 const wrap=bench.querySelector('.lens-wrap'),title=wrap.querySelector('.lens-title'),oldCanvas=$('observeCanvas');
 const s=initial(),cache=new Map(),pending=new Set();let mode='lab',key='onion',image=null,slideDrag=null,photoGesture=null,z=1,px=0,py=0,lastPhase=-1;
 const photoPointers=new Map();
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
 function button(zh,en,fn){const b=el('button','action-btn',tr(zh,en));b.type='button';b.dataset.zh=zh;b.dataset.en=en;b.addEventListener('click',fn);return b;}
 function a(text,url){const n=el('a','',text);n.href=url;n.target='_blank';n.rel='noopener noreferrer';return n;}
 const choices=$('observeChoices'),legacy=el('div','cell-lab-legacy');
 for(const n of [...side.children])if(n!==choices)legacy.append(n);
 const modes=el('div','cell-media-tabs lab-mode-tabs');
 const modeButtons=[['lab','顯微鏡操作','Microscope lab'],['photo','原始照片','Original photo']].map(([value,zh,en])=>{
  const b=button(zh,en,()=>{mode=value;slideDrag=null;photoPointers.clear();photoGesture=null;stopLegacy();update();});modes.append(b);return b;
 });
 const panel=el('div','cell-scope-controls');
 const instrument=el('div','cell-scope-instrument'),instrumentImg=el('img');
 instrumentImg.src='assets/biology/compound_microscope_bresser_v3.jpg';instrumentImg.alt=tr('複式顯微鏡器材照片','Compound microscope photograph');instrumentImg.draggable=false;
 const instrumentText=el('p');instrument.append(instrumentImg,instrumentText);panel.append(instrument);
 const objectiveLabel=el('p','lab-objective-label'),objectives=el('div','lab-objectives');
 const objectiveButtons=[4,10,40].map(n=>{const b=button('', '',()=>{s.objective=n;slideDrag=null;update();});b.dataset.objective=String(n);objectives.append(b);return b;});
 panel.append(objectiveLabel,objectives);
 function range(id,min,max,step,value,fn){const label=el('label','cell-control'),text=el('span'),input=el('input');input.id=id;input.type='range';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(value);label.htmlFor=id;label.append(text,input);input.addEventListener('input',()=>{fn(+input.value);update();});panel.append(label);return {label,text,input};}
 const lamp=range('cellLabLamp',10,100,1,s.lamp,v=>s.lamp=v);
 const coarse=range('cellLabCoarse',-4,4,.5,s.coarse,v=>{if(s.objective!==40)s.coarse=v;});
 const fine=range('cellLabFine',-1,1,.05,s.fine,v=>s.fine=v);
 const focusBox=el('details','lab-adjustments'),focusSummary=el('summary');focusBox.append(focusSummary,coarse.label,fine.label);panel.append(focusBox);
 const stageLabel=el('summary','lab-stage-label'),stage=el('div','slide-control cell-lab-stage');stage.tabIndex=0;stage.setAttribute('role','group');
 const slide=el('div','glass-slide'),sample=el('span','lab-slide-sample');slide.append(sample);stage.append(slide);
 const direction=el('p','lab-direction');direction.setAttribute('role','status');
 const stageBox=el('details','lab-adjustments');stageBox.append(stageLabel,stage,direction);panel.append(stageBox);
 const status=el('div','status lab-coach');status.setAttribute('aria-live','polite');
 const progress=el('p','lab-progress'),next=button('裝上玻片','Place slide',()=>{
  if(s.phase>=7)return;
  if(requirement(s)){if(s.phase===0)s.loaded=true;s.phase++;update();}
  else{update();status.classList.add('needs-action');}
 });
 const reset=button('重新練習','Start again',()=>{Object.assign(s,initial());lamp.input.value='45';coarse.input.value='2.5';fine.input.value='0';slideDrag=null;z=1;px=py=0;photoPointers.clear();photoGesture=null;stopLegacy();update();});
 panel.prepend(progress,status,next);panel.append(reset);
 const workflow=el('details','lab-workflow'),workflowTitle=el('summary'),steps=el('ol');workflow.append(workflowTitle,steps);panel.append(workflow);
 const explanation=el('p','lab-model-note');panel.append(explanation);
 const credits=el('details','cell-photo-source-details'),creditTitle=el('summary'),creditBody=el('div','cell-photo-credit');credits.append(creditTitle,creditBody);
 const photoControls=el('div','cell-photo-controls'),photoZoom=el('span','cell-photo-zoom'),photoReset=button('回原圖','Reset image',()=>{z=1;px=py=0;photoPointers.clear();photoGesture=null;photoPosition();}),photoHelp=el('p');photoControls.append(photoZoom,photoReset,photoHelp);
 side.replaceChildren(modes,choices,panel,legacy,photoControls,credits);
 const scopeCanvas=el('canvas','scope-lens cell-lab-lens');scopeCanvas.id='cellLabLens';scopeCanvas.width=720;scopeCanvas.height=720;scopeCanvas.setAttribute('role','img');scopeCanvas.setAttribute('aria-labelledby','observeTitle');
 const readout=el('div','lab-readout');readout.setAttribute('role','status');
 const loadState=el('p','cell-image-state');loadState.hidden=true;
 const fieldHint=el('p','lab-field-hint');
 const photoFigure=el('figure','cell-photo-figure'),photoStage=el('div','cell-photo-stage'),photo=el('img');photo.draggable=false;photoStage.dataset.draggable='true';photoStage.append(photo);photoFigure.append(photoStage);
 wrap.append(fieldHint,scopeCanvas,photoFigure,readout,loadState);bench.classList.add('cell-microscope-lab');
 const tasks=[
  ['把薄玻片固定在載物臺','Fix the thin slide on the stage','先選低倍物鏡，再裝上已完成的薄玻片。從側面確認物鏡與玻片距離，不要碰撞。','Start with the low-power objective and place the prepared slide. Check clearance from the side; do not strike the slide.'],
  ['低倍找標本與照明','Find the specimen and light at low power','保持 40 倍，看到標本後確認；先找得到，再追求細節。','Stay at 40× and confirm when the specimen is visible. Locate it before looking for fine detail.'],
  ['低倍粗調，再細調','Coarse then fine focus at low power','看目鏡時調整粗調到接近清楚，再用細調讓細胞輪廓清楚。','Use coarse focus at low power, then fine focus for a clear outline.'],
  ['移動玻片，把中央區域置中','Move the slide to center the target area','拖曳玻片，把黃色定位點放回載物臺十字中央；目鏡影像與玻片移動方向相反。','Drag the slide so its yellow positioning dot is on the stage cross. The eyepiece image moves opposite to the slide.'],
  ['換成高倍物鏡','Switch to high power','切換 40 倍物鏡，總倍率成為 400 倍。視野縮小；已置中的區域仍在中央，不替你重設玻片位置。','Select the 40× objective for 400× total. The field narrows; the centered area stays centered. The slide is not automatically repositioned.'],
  ['高倍變暗，自己補光','Increase light after switching to high power','相同照明下，高倍視野明顯變暗。調整光源／光圈到足夠亮，不會自動替你補光。','At the same illumination, high power is noticeably darker. Adjust light/diaphragm until bright enough; there is no automatic compensation.'],
  ['高倍只用細調','Use fine focus only at high power','高倍粗調已鎖定。用細調讓輪廓清楚，再確認你辨認到的細胞構造。','Coarse focus is locked at high power. Fine-focus the image, then confirm the structures you can distinguish.']
 ];
 function stopLegacy(){if($('observeStream').checked){$('observeStream').checked=false;$('observeStream').dispatchEvent(new Event('change',{bubbles:true}));}}
 function selected(){const i=[...choices.querySelectorAll('button')].findIndex(b=>b.classList.contains('active'));return ['onion','cheek','elodea'][Math.max(0,i)];}
 function loadPhoto(){
  const nextKey=selected();if(nextKey!==key||!image){key=nextKey;image=null;photo.src=photoAPI.records[key].file;z=1;px=py=0;photoPointers.clear();photoGesture=null;}
  if(cache.has(key)){image=cache.get(key);return;}
  if(pending.has(key))return;
  const loadingKey=key,img=new Image();pending.add(loadingKey);img.onload=()=>{pending.delete(loadingKey);cache.set(loadingKey,img);if(key===loadingKey){image=img;loadState.hidden=true;draw();}};
  img.onerror=()=>{pending.delete(loadingKey);if(key===loadingKey){loadState.hidden=false;loadState.textContent=tr('照片未能載入，請確認本機素材完整。','Photo failed to load; check local assets.');}};img.src=photoAPI.records[loadingKey].file;
 }
 function photoPosition(){const r=photoStage.getBoundingClientRect();px=photoAPI.clampPan(px,r.width,z);py=photoAPI.clampPan(py,r.height,z);photo.style.transform=`translate(${px}px,${py}px) scale(${z})`;photoZoom.textContent=tr('照片數位放大：','Digital photo zoom: ')+Math.round(z*100)+'%';}
 function stageScale(){return Math.max(.3,Math.min(.7,((stage.clientWidth||300)-150)/180,((stage.clientHeight||180)-84)/180));}
 function draw(){
  drawScope(scopeCanvas.getContext('2d'),image,s);
  slide.style.transform=`translate(${s.x*stageScale()}px,${s.y*stageScale()}px)`;
  const values=[tr('總倍率：','Total: ')+magnification(s)+'×',tr('相對視野直徑：','Relative field diameter: ')+Math.round(fieldDiameter(s)*100)+'%',tr('示意亮度：','Model brightness: ')+Math.round(illumination(s)*100)+'%',tr(focusError(s)<.3?'已對焦':'需要調焦',focusError(s)<.3?'In focus':'Adjust focus')];
  readout.replaceChildren(...values.map(t=>el('span','',t)));
  scopeCanvas.setAttribute('aria-label',tr('顯微操作示意，','Microscope simulation, ')+values.join('，'));
 }
 function update(){
  loadPhoto();const r=photoAPI.records[key],lab=mode==='lab';
  bench.dataset.media=lab?'scope':mode;bench.style.setProperty('--ar',String(mode==='photo'?r.ratio:1));bench.style.setProperty('--photo-ar',String(r.ratio));photoStage.style.setProperty('--photo-ar',String(r.ratio));
  panel.hidden=!lab;legacy.hidden=true;oldCanvas.hidden=true;scopeCanvas.hidden=!lab;readout.hidden=!lab;photoFigure.hidden=mode!=='photo';photoControls.hidden=mode!=='photo';fieldHint.hidden=!lab||s.loaded;
  fieldHint.textContent=tr('先點左側「裝上玻片」，再從低倍開始。','Tap “Place slide” on the left, then start at low power.');
  modeButtons.forEach((b,i)=>{const on=['lab','photo'][i]===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));b.textContent=tr(b.dataset.zh,b.dataset.en);});
  title.textContent=tr(lab?'顯微鏡操作示意 · 以真實照片模擬視野':'真實顯微照片 · 原始影像',lab?'Microscope simulation · Real photo-backed field':'Real micrograph · Original image');
  instrumentText.textContent=tr('複式顯微鏡\n目鏡固定 10 倍','Compound microscope\n10× eyepiece');
  instrumentImg.alt=tr('複式顯微鏡器材照片','Compound microscope photograph');
  objectiveLabel.textContent=tr('轉動旋轉盤，更換物鏡','Rotate the nosepiece to change objective');
  objectiveButtons.forEach((b,i)=>{const n=[4,10,40][i];b.textContent=tr(n+' 倍物鏡\n總倍率 '+n*10+' 倍',n+'× objective\n'+n*10+'× total');b.disabled=!s.loaded;b.classList.toggle('active',n===s.objective);b.setAttribute('aria-pressed',String(n===s.objective));});
  lamp.text.textContent=tr('光源／光圈：','Light / diaphragm: ')+s.lamp+'%';coarse.text.textContent=tr(s.objective===40?'粗調節輪（高倍鎖定）':'粗調節輪（低倍使用）',s.objective===40?'Coarse focus (locked at high power)':'Coarse focus (low power only)');fine.text.textContent=tr('細調節輪','Fine focus');focusSummary.textContent=tr('調焦：粗調／細調節輪','Focus: coarse / fine knobs');
  if(lastPhase!==s.phase){focusBox.open=s.phase===2||s.phase===6;stageBox.open=s.phase===3;lastPhase=s.phase;}
  lamp.input.disabled=coarse.input.disabled=fine.input.disabled=!s.loaded;coarse.input.disabled=!s.loaded||s.objective===40;
  stageLabel.textContent=tr('觸控載物臺：拖曳玻片','Touch stage: drag the slide');stage.setAttribute('aria-label',tr('拖曳玻片，目鏡影像反向移動','Drag the slide; the eyepiece image moves oppositely'));slide.hidden=!s.loaded;
  if(!slideDrag)direction.textContent=tr('玻片向右 → 影像向左；玻片向上 → 影像向下。','Slide right → image left; slide up → image down.');
  progress.textContent=tr('操作流程：','Lab procedure: ')+Math.min(s.phase+1,7)+'/7';
  next.disabled=s.phase>=7;next.textContent=tr(s.phase===0?'裝上玻片':s.phase>=7?'操作完成':'確認這一步',s.phase===0?'Place slide':s.phase>=7?'Completed':'Confirm this step');reset.textContent=tr('重新練習','Start again');
  status.classList.remove('needs-action');status.replaceChildren(el('strong','',tr(s.phase>=7?'完成！可以比較三種標本。':tasks[s.phase][0],s.phase>=7?'Done! Compare the three specimens.':tasks[s.phase][1])),el('p','',tr(s.phase>=7?'記住：低倍找、置中、高倍補光與細調；移動玻片時，影像反向移動。':tasks[s.phase][2],s.phase>=7?'Remember: locate at low power, center, then light and fine-focus at high power. The image moves opposite to the slide.':tasks[s.phase][3])));
  workflowTitle.textContent=tr('查看完整操作流程','View the complete procedure');steps.replaceChildren(...tasks.map((t,i)=>el('li',i<s.phase?'done':i===s.phase?'current':'',tr(t[0],t[1]))));
  explanation.textContent=tr('光學操作示意：以同一張實拍模擬視野裁切、亮度與失焦，沒有新增細胞細節。40／100／400 倍是示意總倍率，非各倍率重新拍攝；亮度數值不是實測。玻片黃點只作定位參考，不是胞器。','Optical teaching model: the same real photo is cropped, dimmed, and defocused; no new cell detail is invented. 40/100/400× are simulated total powers, not separately acquired photos. Brightness is qualitative. The yellow slide dot is a positioning reference, not an organelle.');
  creditTitle.textContent=tr('照片與器材來源、授權','Photo and instrument sources / licenses');
  creditBody.replaceChildren(el('h4','',tr(r.zh,r.en)),el('p','',tr(r.noteZh,r.noteEn)),el('p','rights',r.author+' · '));
  creditBody.append(a(r.license,r.licenseUrl),document.createTextNode(' · '),a(tr('細胞照片原始來源','Original micrograph'),r.source),el('p','rights',tr('原圖檔未改；操作模式的顯示裁切、模擬亮度與失焦是教學處理，影像沿用原授權。','Original file unchanged; the simulated crop, light and defocus are teaching display adaptations. The image retains its original license.')),el('p','rights','Mark192 · '),a('CC BY-SA 2.5','https://creativecommons.org/licenses/by-sa/2.5/'),document.createTextNode(' · '),a(tr('器材照片來源','Instrument photo source'),'https://commons.wikimedia.org/wiki/File:Handelsuebliches_lichtmikroskop_der_marke_bresser.jpg'));
  photo.alt=tr(r.zh,r.en);photoReset.textContent=tr('回原圖','Reset image');photoHelp.textContent=tr('這是原始照片瀏覽：單指拖曳、雙指縮放，不是移動玻片。','Original photo browsing: one-finger pan and two-finger zoom, not slide movement.');
  draw();photoPosition();requestAnimationFrame(size);
 }
 function size(){if(bench.classList.contains('scope-full')){const view=bench.querySelector('.scope-view');bench.style.setProperty('--lab-h',Math.max(80,view.clientHeight-title.offsetHeight-readout.offsetHeight-(fieldHint.hidden?0:fieldHint.offsetHeight)-52)+'px');bench.style.setProperty('--photo-h',Math.max(80,view.clientHeight-title.offsetHeight-40)+'px');}photoPosition();}
 function beginSlide(e,host){if(mode!=='lab'||!s.loaded||slideDrag||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();slideDrag={id:e.pointerId,cx:e.clientX,cy:e.clientY,x:s.x,y:s.y,host,factor:host===stage?stageScale():host.getBoundingClientRect().width/720*s.objective/4};host.setPointerCapture?.(e.pointerId);}
 function moveSlide(e){if(!slideDrag||slideDrag.id!==e.pointerId)return;e.preventDefault();s.x=clamp(slideDrag.x+(e.clientX-slideDrag.cx)/slideDrag.factor,-90,90);s.y=clamp(slideDrag.y+(e.clientY-slideDrag.cy)/slideDrag.factor,-90,90);const dx=s.x-slideDrag.x,dy=s.y-slideDrag.y;direction.textContent=Math.abs(dx)>=Math.abs(dy)?tr(dx>=0?'玻片向右 → 目鏡影像向左':'玻片向左 → 目鏡影像向右',dx>=0?'Slide right → eyepiece image left':'Slide left → eyepiece image right'):tr(dy>=0?'玻片向下 → 目鏡影像向上':'玻片向上 → 目鏡影像向下',dy>=0?'Slide down → eyepiece image up':'Slide up → eyepiece image down');draw();}
 for(const host of [stage,scopeCanvas]){host.addEventListener('pointerdown',e=>beginSlide(e,host));host.addEventListener('pointermove',moveSlide);for(const type of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(type,e=>{if(slideDrag?.id===e.pointerId){slideDrag=null;update();}});}
 stage.addEventListener('keydown',e=>{if(!s.loaded)return;const d={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]}[e.key];if(d){e.preventDefault();s.x=clamp(s.x+d[0],-90,90);s.y=clamp(s.y+d[1],-90,90);draw();}});
 function photoPoint(e){const r=photoStage.getBoundingClientRect();return {x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2};}
 function baseline(){const p=[...photoPointers.values()];photoGesture=p.length>=2?{z,x:px,y:py,mid:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:p.length?{point:p[0],x:px,y:py}:null;}
 photoStage.addEventListener('pointerdown',e=>{if(mode!=='photo'||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();photoPointers.set(e.pointerId,photoPoint(e));photoStage.setPointerCapture?.(e.pointerId);baseline();});
 photoStage.addEventListener('pointermove',e=>{if(!photoPointers.has(e.pointerId)||!photoGesture)return;e.preventDefault();photoPointers.set(e.pointerId,photoPoint(e));const p=[...photoPointers.values()];if(p.length>=2){const v=photoAPI.pinchTransform(photoGesture,{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y));z=v.z;px=v.x;py=v.y;}else{px=photoGesture.x+p[0].x-photoGesture.point.x;py=photoGesture.y+p[0].y-photoGesture.point.y;}photoPosition();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])photoStage.addEventListener(type,e=>{photoPointers.delete(e.pointerId);baseline();});
 choices.addEventListener('click',()=>{stopLegacy();Object.assign(s,initial());lamp.input.value='45';coarse.input.value='2.5';fine.input.value='0';slideDrag=null;loadState.hidden=true;update();});
 for(const id of ['langZh','langEn'])$(id).addEventListener('click',update);
 document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',()=>{slideDrag=null;photoPointers.clear();photoGesture=null;if(b.dataset.tab==='cellObserve')update();}));
 bench.querySelector('.cell-full').addEventListener('click',()=>requestAnimationFrame(size));window.addEventListener('resize',size);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')requestAnimationFrame(size);});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(size).observe(bench.querySelector('.scope-view'));
 window.addEventListener('pagehide',()=>{slideDrag=null;photoPointers.clear();photoGesture=null;});
 API.state=s;API.update=update;update();
})();

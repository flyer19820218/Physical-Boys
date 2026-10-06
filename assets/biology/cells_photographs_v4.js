/* V4 photo layer; last tab is owned by cells_microscope_lab_v4.js. Shape/function is photo-only; science sources are unchanged. */
(()=>{
 'use strict';
 const ROOT='assets/biology/',PHOTOS=ROOT+'photos/';
 const common='https://commons.wikimedia.org/wiki/File:';
 const by='https://creativecommons.org/licenses/';
 const bcc='Berkshire Community College Bioscience Image Library';
 const records={
  neuron:{file:PHOTOS+'neuron_fluorescence_v2.jpg',ratio:2317/1992,zh:'神經細胞｜螢光顯微照片',en:'Neurons | Fluorescence micrograph',author:'ManuelSchottdorf',license:'CC BY-SA 4.0',licenseUrl:by+'by-sa/4.0/',source:common+'GFP_Neurons.png',noteZh:'培養的鼠大腦皮質神經細胞。綠色來自 GFP 螢光標記，不是神經細胞原本就會發亮；沿著亮起的細胞體找細長突起。',noteEn:'Cultured rat cortical neurons. Green comes from GFP labeling, not natural glowing cells. Follow the cell bodies and long processes.'},
  muscle:{file:PHOTOS+'muscle_v2.jpg',ratio:3264/1840,zh:'骨骼肌細胞｜光學顯微照片',en:'Skeletal muscle fibers | Light micrograph',author:bcc,license:'CC0 1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',source:common+'Muscle_Tissue_Skeletal_Muscle_Fibers_(40153601630).jpg',noteZh:'找細長肌纖維及橫紋。照片呈現細長肌纖維；肌纖維收縮時變短，帶動身體運動。原來源標示 200 倍。',noteEn:'Find the elongated fibers and striations. The photograph shows long muscle fibers; contraction shortens fibers to produce movement. Source reports 200×.'},
  redblood:{file:PHOTOS+'redblood_v2.jpg',ratio:1.2,zh:'紅血球｜掃描式電子顯微照片',en:'Red blood cells | Scanning electron micrograph',author:'Scootdive',license:'CC BY-SA 3.0',licenseUrl:by+'by-sa/3.0/',source:common+'Red_blood_cells_(2).jpg',noteZh:'表面立體感讓雙凹圓盤更容易辨認。電子顯微照片為灰階，不代表血液本來是灰色；原圖的比例尺與儀器資訊保留。',noteEn:'Surface relief reveals biconcave discs. Grayscale SEM does not imply gray blood. The original scale bar and instrument information are preserved.'},
  guard:{file:PHOTOS+'guard_optical_v3.jpg',ratio:2584/2578,zh:'保衛細胞與氣孔｜光學顯微照片',en:'Guard cells and stomata | Light micrograph',author:'Trương Minh Khải',license:'CC BY 4.0',licenseUrl:by+'by/4.0/',source:common+'Stomata_of_Tradescantia_spathacea_leaves.jpg',noteZh:'紫背萬年青葉片的光學顯微照片，原來源標示 400 倍。找氣孔兩側的保衛細胞，再放大看細胞內綠色的葉綠體顆粒；中間的狹縫是氣孔，不是第三個細胞。照片中的紫色是周圍葉片組織，不要當成葉綠體。',noteEn:'Light micrograph of Tradescantia spathacea leaf, reported at 400×. Find the guard cells on either side of each pore, then zoom in on green chloroplasts within them. The slit is a pore, not a third cell. Purple surrounding leaf tissue is not a chloroplast.'},
  onion:{file:PHOTOS+'onion_clear_v2.jpg',ratio:3264/1840,zh:'洋蔥鱗葉表皮｜光學顯微照片',en:'Onion bulb epidermis | Light micrograph',author:bcc,license:'CC0 1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',source:common+'Living_cells_of_onion_epidermis_(33605021164).jpg',noteZh:'像磚牆般相連的細胞輪廓；細胞裡也能找到較深的圓形細胞核。不是水蘊草，不應補上綠色葉綠體。原來源標示 120 倍；未交代染液種類。',noteEn:'Connected brick-like cell outlines with darker rounded nuclei. These are onion cells, not Elodea; no green chloroplasts are added. Source reports 120× but does not specify the stain.'},
  cheek:{file:PHOTOS+'cheek_v2.jpg',ratio:1198/1239,zh:'口腔皮膜細胞｜亞甲藍染色實拍',en:'Cheek epithelial cells | Methylene-blue micrograph',author:'Fritzmann2002',license:'CC BY-SA 4.0',licenseUrl:by+'by-sa/4.0/',source:common+'Human_Cheek_Cells_(Methylene_Blue_Stain).jpg',noteZh:'人的口腔細胞，原拍攝倍率 400 倍。染色後，細胞核呈較深的藍色；部分細胞互相重疊，外側沒有細胞壁。',noteEn:'Human cheek cells photographed at 400×. Darker blue nuclei stand out after staining. Some cells overlap; there is no cell wall.'},
  elodea:{file:PHOTOS+'elodea_clear_v2.jpg',ratio:4/3,zh:'水蘊草葉片｜葉綠體真實顯微照片',en:'Elodea leaf | Real chloroplast micrograph',author:'Juan Carlos Fonseca Mata',license:'CC BY-SA 4.0',licenseUrl:by+'by-sa/4.0/',source:common+'Chloroplasts_-_Microscopic_view_of_Elodea_canadensis.jpg',noteZh:'細胞壁圍起的一整格才是一個細胞；內部很多綠色小顆粒是葉綠體。照片本身不會流動；真實的胞質流動會攜帶葉綠體移動，靜態照片不能用來判定流動方向。原來源未標示拍攝倍率。',noteEn:'A whole wall-bounded compartment is one cell; its many green bodies are chloroplasts. The photograph is static. Cytoplasmic streaming carries chloroplasts; a still image cannot establish their movement direction. The source does not report magnification.'},
  plant:{file:ROOT+'plant_cutaway_ai_v2.jpg',ratio:1.5,zh:'植物細胞｜原創 AI 科學剖面',en:'Plant cell | Original AI scientific cutaway',author:'Physical-Boys · 內建 imagegen',ai:true,noteZh:'原創 AI 教學插圖，不是真實顯微照片。大液胞占主要空間；核、葉綠體與粒線體位於周邊胞質。顏色只做分類，尺寸不供量測。',noteEn:'Original AI teaching illustration, not a micrograph. A large central vacuole occupies most space; nucleus, chloroplasts, and mitochondria lie in peripheral cytoplasm. Colors classify structures; sizes are not for measurement.'},
  animal:{file:ROOT+'animal_cutaway_ai_v2.jpg',ratio:1.5,zh:'動物細胞｜原創 AI 科學剖面',en:'Animal cell | Original AI scientific cutaway',author:'Physical-Boys · 內建 imagegen',ai:true,noteZh:'原創 AI 教學插圖，不是真實顯微照片。紫色為核、橘色為粒線體、青色外層為膜；沒有植物的細胞壁、葉綠體或巨大中央液胞。小囊泡以液胞概念示意。',noteEn:'Original AI teaching illustration, not a micrograph. Purple nucleus, orange mitochondria, cyan outer membrane; no plant wall, chloroplasts, or giant central vacuole. Small vesicles illustrate the vacuole concept.'}
 };
 // Percent positions were checked against the two generated 1536×1024 images.
 const targets={plant:{nucleus:[17,39],membrane:[9.7,55],cytoplasm:[37.5,21.5],mitochondria:[44,19],vacuole:[62,45],wall:[35,83],chloroplast:[29,25]},animal:{nucleus:[34,36],membrane:[92,62],cytoplasm:[68,35],mitochondria:[83,59],vacuole:[85,43]}};
 function clampPan(value,size,zoom){const bound=Math.max(0,size*(zoom-1)/2);return Math.max(-bound,Math.min(bound,value));}
 function pinchTransform(start,mid,distance){
  const z=Math.max(1,Math.min(4,start.z*distance/Math.max(1,start.distance))),k=z/start.z;
  return {z,x:mid.x-(start.mid.x-start.x)*k,y:mid.y-(start.mid.y-start.y)*k};
 }
 const api={records,targets,clampPan,pinchTransform};globalThis.CellsPhotosV4=api;
 if(typeof module!=='undefined')module.exports=api;
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id),tr=(zh,en)=>document.documentElement.lang==='en'?en:zh;
 const viewers=[];
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
 function link(text,url){const a=el('a','',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
 function selected(id,keys){const i=[...$(id).querySelectorAll('button')].findIndex(b=>b.classList.contains('active'));return keys[Math.max(0,i)];}
 function credit(node,r){node.replaceChildren(el('h4','',tr(r.zh,r.en)),el('p','',tr(r.noteZh,r.noteEn)));const rights=el('p','rights');if(r.ai){rights.textContent=tr('製作：Physical-Boys／內建 imagegen。原創生成，非他人照片鏡像或改造。','Created for Physical-Boys with built-in imagegen. Original generation, not a flipped or modified third-party photograph.');rights.append(document.createTextNode(' · '),link(tr('製作紀錄','Generation record'),ROOT+'cell_image_prompts_v2.md'));}else{rights.append(document.createTextNode(tr('作者：','Author: ')+r.author+' · '),link(r.license,r.licenseUrl),document.createTextNode(' · '),link(tr('原始來源','Original source'),r.source));rights.append(el('span','',tr('。本教材僅等比例縮圖／JPEG 壓縮；未鏡像、未改變細胞形狀、未 AI 重畫。照片沿用原授權。',' — Proportional resizing/JPEG compression only. No mirroring, reshaping, or AI repainting. Images retain their original licenses.')));}node.append(rights);}
 function textButton(zh,en,fn){const b=el('button','action-btn',tr(zh,en));b.type='button';b.dataset.zh=zh;b.dataset.en=en;b.addEventListener('click',fn);b.setAttribute('aria-label',tr(zh,en));return b;}
 function makeViewer(benchId,canvasId,readKey,isStructure=false){
  const photoOnly=benchId==='shapeBench';
  const bench=$(benchId),canvas=$(canvasId),wrap=canvas.parentElement,sidebar=bench.querySelector('.scope-sidebar'),title=wrap.querySelector('.lens-title');
  const figure=el('figure','cell-photo-figure'),stage=el('div','cell-photo-stage'),image=el('img'),marker=el('span','cell-part-marker');
  image.decoding='async';image.draggable=false;marker.hidden=true;stage.append(image,marker);figure.append(stage);wrap.append(figure);
  const mode=el('div','cell-media-tabs'),photoButton=textButton(isStructure?'精美剖面':'真實照片',isStructure?'Detailed cutaway':'Real photograph',()=>setMode(true)),modelButton=textButton('操作模型','Interactive model',()=>setMode(false));if(!photoOnly){mode.append(photoButton,modelButton);sidebar.prepend(mode);}else{bench.classList.add('cell-touch-only');bench.dataset.photoOnly='true';}
  const credits=el('div','cell-photo-credit');
  const creditDetails=el('details','cell-photo-source-details'),creditSummary=el('summary');
  if(photoOnly){creditDetails.append(creditSummary,credits);sidebar.append(creditDetails);}else sidebar.append(credits);
  const controls=el('div','cell-photo-controls'),zoomText=el('span','cell-photo-zoom'),zoom=el('input');zoom.value='100';
  let z=1,x=0,y=0,onPhoto=true,lastKey=null,failed=false,gesture=null;
  const pointers=new Map();
  const reset=textButton('回原圖','Reset image',()=>{z=1;zoom.value='100';x=y=0;pointers.clear();gesture=null;position();});
  const help=el('p');
  controls.append(zoomText,reset,help);if(!isStructure)sidebar.append(controls);
  const fullPhoto=textButton('⛶ 全螢幕看細胞','⛶ View cells full screen',()=>bench.querySelector('.cell-full').click());
  fullPhoto.classList.add('cell-photo-open-full');if(photoOnly)wrap.prepend(fullPhoto);
  const modelNodes=[];
  if(benchId==='observeBench')for(const id of ['observeMag','observeLamp','observeFocus','observeStain','observeStream'])modelNodes.push($(id).closest('label'));
  if(benchId==='observeBench')modelNodes.push($('observeReset'),$('observeReadout'));
  function position(){const r=stage.getBoundingClientRect();x=clampPan(x,r.width,z);y=clampPan(y,r.height,z);image.style.transform=`translate(${x}px,${y}px) scale(${z})`;stage.dataset.draggable=String(!isStructure);stage.dataset.zoom=String(z);zoomText.textContent=tr('照片數位放大：','Digital image zoom: ')+Math.round(z*100)+'%';}
  function size(){if(bench.classList.contains('scope-full')){const view=bench.querySelector('.scope-view');bench.style.setProperty('--photo-h',Math.max(80,view.clientHeight-title.offsetHeight-40)+'px');}position();}
  function setMode(value){onPhoto=photoOnly||value;if(onPhoto&&benchId==='observeBench'&&$('observeStream').checked){$('observeStream').checked=false;$('observeStream').dispatchEvent(new Event('change',{bubbles:true}));}update();}
  function update(){
   const key=readKey(),r=records[key];if(key!==lastKey){lastKey=key;failed=false;image.src=r.file;z=1;zoom.value='100';x=y=0;pointers.clear();gesture=null;}image.alt=tr(r.zh,r.en);
   bench.dataset.media=onPhoto?'image':'model';canvas.hidden=onPhoto;figure.hidden=!onPhoto;controls.hidden=!onPhoto||isStructure;credits.hidden=!onPhoto;
   photoButton.textContent=tr(isStructure?'精美剖面':'真實照片',isStructure?'Detailed cutaway':'Real photograph');modelButton.textContent=tr('操作模型','Interactive model');photoButton.classList.toggle('active',onPhoto);modelButton.classList.toggle('active',!onPhoto);photoButton.setAttribute('aria-pressed',String(onPhoto));modelButton.setAttribute('aria-pressed',String(!onPhoto));
   title.textContent=tr(onPhoto?(isStructure?'原創 AI 科學插圖 · 非實拍':'真實顯微照片 · 保留原圖'):'互動教學模型 · 非實拍',onPhoto?(isStructure?'Original AI scientific illustration · Not a photograph':'Real micrograph · Original content retained'):'Interactive teaching model · Not a photograph');
   for(const n of modelNodes)n.hidden=onPhoto;
   if(benchId==='shapeBench')$('muscleControl').hidden=onPhoto||key!=='muscle';
   if(benchId==='observeBench'&&onPhoto){const n=$('observeInfo');n.replaceChildren(el('h4','',tr('這一次真的看到什麼？','What can you actually see?')),el('p','',tr('先看邊界，再找細胞核或葉綠體。拖曳與放大只是看照片，不會改變標本、染色或光學倍率。','Find boundaries, then nuclei or chloroplasts. Panning and zooming inspect the photograph; they do not change the specimen, staining, or optical magnification.')));}
   if(benchId==='shapeBench'&&onPhoto&&key==='muscle')$('shapeInfo').replaceChildren(el('h4','',tr('細長形狀，收縮產生運動','Long cells contract to produce movement')),el('p','',tr('細長肌纖維排列成束，收縮時變短，帶動身體運動。照片中的橫紋也是辨認骨骼肌的線索。','Long fibers form bundles and shorten during contraction to produce movement. Striations help identify skeletal muscle.')));
   credit(credits,r);if(failed)credits.prepend(el('p','cell-image-state',tr('圖片載入失敗，請確認照片資料夾完整；請重新載入或確認圖片檔案。','Image failed to load. Check the photo folder; reload or check the image files.')));
   creditSummary.textContent=tr('照片來源與授權','Photo source and license');reset.textContent=tr('回原圖','Reset image');fullPhoto.textContent=tr('⛶ 全螢幕看細胞','⛶ View cells full screen');
   const ratio=onPhoto?r.ratio:canvas.width/canvas.height;bench.style.setProperty('--ar',String(ratio));stage.style.setProperty('--photo-ar',String(r.ratio));bench.style.setProperty('--photo-ar',String(r.ratio));
   help.textContent=tr('單指拖曳，雙指張開或捏合縮放。這是照片數位放大，不是顯微鏡倍率；不同照片不能直接比較細胞大小。','Drag with one finger; spread or pinch two fingers to zoom. This is digital image zoom, not microscope power; cell sizes cannot be compared across photographs.');
   if(isStructure){const keys=Object.keys(globalThis.CellsDrawV1.parts),part=selected('partChoices',keys),xy=targets[key][part];marker.hidden=!xy;if(xy){marker.style.left=xy[0]+'%';marker.style.top=xy[1]+'%';marker.setAttribute('aria-label',tr('已選構造位置','Selected structure location'));}}
   position();requestAnimationFrame(size);
  }
  zoom.addEventListener('input',()=>{z=Number(zoom.value)/100;position();});
  image.addEventListener('error',()=>{failed=true;update();});image.addEventListener('load',()=>{failed=false;size();});
  function point(e){const r=stage.getBoundingClientRect();return {x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2};}
  function baseline(){
   const p=[...pointers.values()];
   if(p.length>=2)gesture={kind:'pinch',z,x,y,mid:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};
   else gesture=p.length?{kind:'drag',point:p[0],x,y}:null;
  }
  stage.addEventListener('pointerdown',e=>{
   if(isStructure||!onPhoto||(e.pointerType==='mouse'&&e.button!==0))return;
   e.preventDefault();pointers.set(e.pointerId,point(e));stage.setPointerCapture?.(e.pointerId);baseline();
  });
  stage.addEventListener('pointermove',e=>{
   if(!pointers.has(e.pointerId)||!gesture)return;e.preventDefault();pointers.set(e.pointerId,point(e));
   const p=[...pointers.values()];
   if(p.length>=2){const mid={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},v=pinchTransform(gesture,mid,Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y));z=v.z;x=v.x;y=v.y;}
   else{x=gesture.x+p[0].x-gesture.point.x;y=gesture.y+p[0].y-gesture.point.y;}
   zoom.value=String(Math.round(z*100));position();
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,e=>{pointers.delete(e.pointerId);baseline();});
  stage.addEventListener('wheel',e=>{
   if(isStructure||!onPhoto)return;e.preventDefault();const mid=point(e),v=pinchTransform({z,x,y,mid,distance:1},mid,Math.exp(-e.deltaY*.002));z=v.z;x=v.x;y=v.y;position();
  },{passive:false});
  if(isStructure)stage.addEventListener('click',e=>{const r=stage.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*100,py=(e.clientY-r.top)/r.height*100;let near=null,dist=9;for(const [part,p] of Object.entries(targets[readKey()])){const d=Math.hypot(px-p[0],py-p[1]);if(d<dist){dist=d;near=part;}}if(near){const i=Object.keys(globalThis.CellsDrawV1.parts).indexOf(near);$('partChoices').querySelectorAll('button')[i].click();}});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(size).observe(bench.querySelector('.scope-view'));
  viewers.push({update,size,bench});update();return {update,size};
 }
 const shapes=['neuron','muscle','redblood','guard','epidermis'];
 const shape=makeViewer('shapeBench','shapeCanvas',()=>{const s=selected('shapeChoices',shapes);return s==='epidermis'?'onion':s;});
 const structure=makeViewer('structureBench','structureCanvas',()=>selected('cellTypeChoices',['plant','animal']),true);
 // Last tab is initialized by the separate microscope lab; no duplicate photo viewer.
 $('shapeChoices').addEventListener('click',shape.update);$('cellTypeChoices').addEventListener('click',structure.update);$('partChoices').addEventListener('click',structure.update);
 // A genuine specimen image follows, not replaces, the retained mounting procedure.
 const gallery=$('cellPhotoGallery');
 function paintGallery(){gallery.replaceChildren();for(const r of Object.values(records).filter(r=>!r.ai)){const f=el('figure'),a=link('',r.file),img=el('img');img.src=r.file;img.alt=tr(r.zh,r.en);img.loading='lazy';img.decoding='async';a.append(img);f.append(a);const c=el('figcaption');c.append(el('strong','',tr(r.zh,r.en)),el('span','rights',r.author+' · '+r.license+' · '),link(tr('來源','Source'),r.source),document.createTextNode(' · '),link(tr('授權','License'),r.licenseUrl));f.append(c);gallery.append(f);}}
 function update(){viewers.forEach(v=>v.update());paintGallery();}
 for(const id of ['langZh','langEn'])$(id).addEventListener('click',update);
 document.querySelectorAll('.scope-language').forEach(b=>b.addEventListener('click',update));
 document.querySelectorAll('.cell-full,.tab-btn').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(()=>viewers.forEach(v=>v.size()))));
 window.addEventListener('resize',()=>viewers.forEach(v=>v.size()));paintGallery();
})();

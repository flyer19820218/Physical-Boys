/* Teacher-requested explanations and photograph display zoom. Teaching models stay untouched. */
(function(root){
 'use strict';
 const installed=new WeakMap();
 const needs={
  sun:['陽光：能量的來源','Sunlight: an energy source','綠色植物利用陽光進行光合作用，製造養分；動物再從食物取得物質與能量。','Green plants use sunlight in photosynthesis to make nutrients; animals obtain materials and energy from food.','看圖重點：觀察照到葉片的光。這不代表每一種生物都必須直接曬太陽。','Look for light reaching the leaves. Not every organism needs direct sunlight.'],
  air:['空氣：與氣體交換有關','Air: gas exchange','多數生物呼吸需要氧氣；植物進行光合作用需要二氧化碳。這兩種氣體的用途不同。','Most organisms need oxygen for respiration; plants need carbon dioxide for photosynthesis. The gases have different roles.','看圖重點：魚從水中取得溶解的氧氣，不是直接吸入空氣；陸地生物則與周圍空氣交換氣體。','Fish obtain dissolved oxygen from water, rather than breathing air directly. Land organisms exchange gases with the surrounding air.'],
  water:['水：生命活動的環境','Water: a medium for life','水是生物體的重要成分，也是許多生命活動進行的環境。植物由根吸收水；池塘中的生物也生活在水裡。','Water is a major component of organisms and a medium for many life processes. Plants absorb water through roots; aquatic organisms also live in it.','看圖重點：同一池水既是棲地，也供應生物所需的水；住在陸地的生物同樣需要水。','The pond is both a habitat and a source of water. Organisms on land need water too.'],
  nutrients:['養分：生長與維持的材料','Nutrients: materials for growth and maintenance','養分供應生長、修補及維持生命活動所需的物質；其中有些也能提供能量。動物由食物取得養分。','Nutrients supply materials for growth, repair and life processes; some also supply energy. Animals obtain nutrients from food.','看圖重點：綠色植物能自行製造養分，但仍需從環境吸收水與礦物質；不是直接從土壤吸收現成食物。','Green plants can make their own nutrients, but still absorb water and minerals from the environment. Soil is not a source of ready-made food.']
 };
 const parts=[
  {point:[.80,.10],zoom:2.5,text:['目鏡：眼睛觀看的位置','Eyepiece: where you look','目鏡位在鏡筒上端，是眼睛觀看影像的位置。目鏡與物鏡共同放大標本影像。','The eyepiece is at the top of the tube, where you view the image. It works with the objective to magnify the specimen.','辨認重點：找最上方、朝向眼睛的黑色鏡筒端。總倍率＝目鏡倍率 × 物鏡倍率。','Find the black upper end facing your eye. Total magnification = eyepiece power × objective power.']},
  {point:[.55,.47],zoom:2.7,text:['物鏡：靠近標本的鏡頭','Objective: the lens near the specimen','物鏡裝在可轉動的旋轉盤上，靠近載物臺上的標本。轉動旋轉盤，可以切換不同倍率的物鏡。','Objectives are mounted on a rotating nosepiece close to the specimen on the stage. Turn the nosepiece to select a different objective.','辨認重點：照片中的幾支短黑色鏡頭。先用低倍找目標、置中，再換高倍觀察。','Find the short black lenses. Locate and center the target at low power before switching to high power.']},
  {point:[.52,.62],zoom:2.25,text:['載物臺：放置玻片的平台','Stage: the platform for the slide','載物臺用來放置並固定玻片。移動玻片時，複式顯微鏡中的影像會往相反方向移動。','The stage holds the slide in place. When you move the slide, the image in a compound microscope moves in the opposite direction.','辨認重點：鏡頭下方的黑色平台與金屬夾具；要置中，先看影像偏在哪一側。','Find the black platform and metal slide holder beneath the lenses. Note which side the image is on before centering it.']},
  {point:[.16,.53],zoom:2.6,text:['調節輪：讓影像清楚','Focus knobs: bringing the image into focus','轉動調節輪可調整焦距。粗調移動量較大，細調移動量較小；高倍觀察時只使用細調。','Focus knobs adjust focus. Coarse focus moves farther and fine focus moves less. Use only fine focus at high power.','辨認重點：鏡身側面的黑色圓輪。不要把調焦和移動玻片混為一談。','Find the black wheels on the side of the instrument. Focusing is not the same as moving the slide.']},
  {point:[.52,.69],zoom:2.2,text:['光源與光圈：控制進入的光','Light and diaphragm: controlling illumination','光源提供照明，光圈控制通過標本的光量。高倍視野通常較暗，可適度增加照明。','The light source provides illumination and the diaphragm controls the light passing through the specimen. High-power views are usually dimmer, so illumination may need adjusting.','辨認重點：觀察載物臺下方的照明區。光圈藏在臺下，這張照片不易直接看見，不能把旁邊的調節輪當成光圈。','Look below the stage. The diaphragm is underneath and is not clearly visible in this photograph; the side focus knobs are not the diaphragm.']}
 ];
 function crop(point,zoom,aspect=4/3){
  const imageRatio=455/600,visibleHeight=imageRatio/aspect;
  return {zoom,x:Math.max(1-zoom,Math.min(0,.5-point[0]*zoom)),y:Math.max(visibleHeight-zoom,Math.min(0,visibleHeight/2-point[1]*zoom)),visibleHeight};
 }
 function install(doc){
  if(!doc.body.classList.contains('bio-compact-v1'))return null;
  if(installed.has(doc))return installed.get(doc);
  doc.body.classList.add('bio-explain-v2');
  const tr=(zh,en)=>doc.documentElement.lang==='en'?en:zh;
  const make=(tag,cls)=>{const n=doc.createElement(tag);n.className=cls||'';return n;};
  const label=(tag,cls,zh,en)=>{const n=make(tag,cls);n.dataset.zh=zh;n.dataset.en=en;n.textContent=tr(zh,en);return n;};
  const refresh=[];let needsSession=null,partsSession=null;
  const choices=doc.getElementById('needsGrid');
  if(choices){
   const picture=doc.querySelector('.habitat-image'),status=doc.getElementById('needStatus'),bench=make('div','board scope-workbench bio-needs-workbench'),head=make('div','scope-head'),tools=make('div','scope-head-tools');
   bench.id='needsWorkbench';bench.setAttribute('role','region');bench.style.setProperty('--ar',String(1672/940));
   const title=label('h3','','看棲地，認識生存條件','Explore a habitat and its survival conditions');title.id='needsWorkbenchTitle';bench.setAttribute('aria-labelledby',title.id);
   const full=label('button','action-btn primary bio-full-button','⛶ 全螢幕講解','⛶ Full screen');full.id='needsFull';full.type='button';full.setAttribute('aria-pressed','false');
   head.append(title,tools);tools.append(full);const view=make('div','bio-needs-view'),caption=make('div','bio-figure-notes bio-needs-caption'),topic=make('h4'),observe=make('p','bio-observe-note');
   choices.before(bench);bench.append(head,choices,view,caption);view.append(picture);caption.append(topic,status,observe);caption.tabIndex=0;choices.classList.add('bio-needs-toolbar');
   let selected='sun';
   function paint(){const t=needs[selected];topic.textContent=tr(t[0],t[1]);status.textContent=tr(t[2],t[3]);observe.textContent=tr(t[4],t[5]);caption.setAttribute('aria-label',tr('圖下解說','Explanation below the image'));}
   choices.addEventListener('click',e=>{const b=e.target.closest('[data-need]');if(b&&needs[b.dataset.need]){selected=b.dataset.need;paint();}});
   choices.querySelector('[data-need="sun"]').click();paint();refresh.push(paint);needsSession={bench,view,caption,full,paint};
  }
  const bench=doc.getElementById('scopeTypesWorkbench');
  if(bench){
   const picture=bench.querySelector('.scope-instrument'),frame=bench.querySelector('.scope-photo-frame'),side=bench.querySelector('.scope-sidebar'),caption=bench.querySelector('.bio-figure-notes'),status=doc.getElementById('partStatus'),buttons=doc.getElementById('partButtons');
   const viewport=make('div','bio-part-viewport'),overview=make('figure','bio-part-overview'),mini=make('div','bio-part-mini'),thumbnail=make('img'),marker=make('span','bio-part-crop-marker');
   picture.before(viewport);viewport.append(picture);viewport.setAttribute('role','img');picture.draggable=false;
   thumbnail.src=picture.getAttribute('src');thumbnail.alt=tr('整台顯微鏡：黃色框是右側放大範圍','Whole microscope: the yellow box is the enlarged region');thumbnail.draggable=false;mini.append(thumbnail,marker);overview.append(mini,label('figcaption','','黃色框＝放大範圍','Yellow box = enlarged region'));side.append(overview);
   const reset=label('button','action-btn bio-part-reset','看整台顯微鏡','View the whole microscope');reset.type='button';side.append(reset);
   const title=make('h4','bio-part-title'),observe=make('p','bio-observe-note'),note=label('p','bio-display-note','原照片局部放大，不是顯微鏡倍率；原圖檔未改，顯示裁切沿用原授權。','Digital crop of the original photograph, not microscope magnification. The source file is unchanged; display crops retain its license.');
   status.before(title);status.after(observe,note);let selected=0,whole=false;
   function paint(){
    const p=parts[selected],t=p.text,c=crop(p.point,p.zoom);title.textContent=tr(t[0],t[1]);status.textContent=tr(t[2],t[3]);observe.textContent=tr(t[4],t[5]);
    viewport.classList.toggle('bio-part-whole',whole);viewport.dataset.part=String(selected);viewport.dataset.zoom=String(whole?1:c.zoom);viewport.setAttribute('aria-label',tr(t[0],t[1]));
    picture.style.transform=whole?'none':`translate(${c.x*100}%,${c.y*100}%) scale(${c.zoom})`;
    marker.hidden=whole;marker.style.left=(-c.x/c.zoom*100)+'%';marker.style.top=(-c.y/c.zoom*100)+'%';marker.style.width=(100/c.zoom)+'%';marker.style.height=(c.visibleHeight/c.zoom*100)+'%';
    thumbnail.alt=tr('整台顯微鏡：黃色框是右側放大範圍','Whole microscope: the yellow box is the enlarged region');
   }
   buttons.addEventListener('click',e=>{const b=e.target.closest('button'),i=[...buttons.children].indexOf(b);if(i>=0&&i<parts.length){selected=i;whole=false;paint();}});
   reset.addEventListener('click',()=>{whole=true;paint();});paint();refresh.push(paint);partsSession={bench,viewport,picture,marker,reset,paint};
  }
  // Preserve all four original bilingual instructions; only bring the number inline.
  doc.querySelector('#scopeTracking .scope-steps')?.classList.add('bio-tracking-steps');
  for(const id of ['langZh','langEn'])doc.getElementById(id)?.addEventListener('click',()=>refresh.forEach(fn=>fn()));
  const session={needs:needsSession,parts:partsSession,refresh:()=>refresh.forEach(fn=>fn())};installed.set(doc,session);return session;
 }
 const api={install,crop,needs,parts};root.BiologyChapter1Explain=api;if(root.document)api.session=install(root.document);
})(typeof globalThis==='object'?globalThis:this);

/* Outer layout only: move original UI nodes; preserve models, image assets and handlers. */
(function(root){
 'use strict';
 const installed=new WeakMap();
 function install(doc){
  if(!doc.body.classList.contains('bio-compact-v2'))return null;
  if(installed.has(doc))return installed.get(doc);
  const tr=(zh,en)=>doc.documentElement.lang==='en'?en:zh;
  const make=(tag,cls)=>{const n=doc.createElement(tag);n.className=cls||'';return n;};
  const label=(tag,cls,zh,en)=>{const n=make(tag,cls);n.dataset.zh=zh;n.dataset.en=en;n.textContent=tr(zh,en);return n;};
  const sessions=[];
  function help(caption){const d=make('details','bio2-help');d.append(label('summary','','操作提示與來源','Operation tips and sources'));const box=make('div','bio2-help-body');d.append(box);caption.append(d);return box;}
  function group(toolbar,node,zh='',en=''){if(!node)return;const box=make('div','bio2-control-group');if(zh)box.append(label('span','bio2-group-label',zh,en));box.append(node);toolbar.append(box);return box;}
  function shell(bench,controls,view,full){
   bench.classList.add('bio2-bench');controls.classList.add('bio2-controls');view.classList.add('bio2-view');
   const head=make('header','bio2-head'),tools=make('div','bio2-head-tools'),heading=controls.querySelector('h3'),toolbar=make('div','bio2-toolbar'),media=make('div','bio2-media'),caption=make('div','bio2-caption');
   if(heading)head.append(heading);if(full)tools.append(full);head.append(tools);bench.prepend(head);controls.prepend(toolbar);view.prepend(media);view.append(caption);caption.tabIndex=0;
   const instructions=help(caption),s={bench,controls,view,head,tools,toolbar,media,caption,instructions,full,photoCaption:null,photoCard:null};sessions.push(s);return s;
  }
  function intoCaption(s,n){if(n)s.caption.insertBefore(n,s.caption.querySelector('.bio2-help'));}
  function prepareLab(bench){
   const controls=bench.querySelector('.lab-controls'),view=bench.querySelector('.lab-view');if(!controls||!view)return;
   const full=[...controls.querySelectorAll('button')].find(n=>/Fullscreen$|Expand$/.test(n.id)),s=shell(bench,controls,view,full),canvas=bench.querySelector('canvas');
   if(canvas){bench.style.setProperty('--ar',String(canvas.width/canvas.height));s.media.append(canvas);}
   const labels=view.querySelector('.view-labels');if(labels)s.media.prepend(labels);
   // Core explanations and live results are always directly below the principal image.
   let sectionHeading=null;
   for(const n of [...controls.children]){
    if(n===s.toolbar)continue;
    if(n.classList.contains('control-row')||n.classList.contains('lab-options')){
     if(!n.children.length){n.hidden=true;continue;}
     const cell=n.classList.contains('cell-mode'),speed=!!n.querySelector('#diffNormal'),solutions=!!n.querySelector('#osmPure');
     const g=group(s.toolbar,n,cell?'細胞種類':speed?'觀察速度':solutions?'外液條件':'',cell?'Cell type':speed?'Viewing speed':solutions?'External solution':'');
     if(sectionHeading){g.prepend(sectionHeading);sectionHeading=null;}
    }else if(n.classList.contains('lab-control')||n.tagName==='SELECT')group(s.toolbar,n);
    else if(['readouts','readout','equivalence','status','exam-callout'].some(c=>n.classList.contains(c)))intoCaption(s,n);
    else if(n.tagName==='H3'){if(sectionHeading)group(s.toolbar,sectionHeading);n.classList.add('bio2-group-label');sectionHeading=n;}
    else if(n.tagName==='P'||n.tagName==='SPAN')s.instructions.append(n);
    else group(s.toolbar,n);
   }
   if(sectionHeading)group(s.toolbar,sectionHeading);
   for(const n of [...view.children]){
    if(n===s.media||n===s.caption)continue;
    if(n.classList.contains('photo-card'))preparePhoto(s,n);
    else intoCaption(s,n);
   }
   if(bench.id==='travelLab'&&s.photoCard){
    const mode=make('div','bio2-media-switch'),ruler=label('button','action-btn active','尺規比較','Compare dimensions'),photo=label('button','action-btn','參考影像','Reference image');
    ruler.type=photo.type='button';mode.append(ruler,photo);group(s.toolbar,mode,'全螢幕主畫面','Fullscreen main view').classList.add('bio2-full-view-group');bench.dataset.bio2View='ruler';s.photoButton=photo;
    const pick=value=>{bench.dataset.bio2View=value;ruler.classList.toggle('active',value==='ruler');photo.classList.toggle('active',value==='photo');ruler.setAttribute('aria-pressed',String(value==='ruler'));photo.setAttribute('aria-pressed',String(value==='photo'));fit();};
    s.pickView=pick;ruler.addEventListener('click',()=>pick('ruler'));photo.addEventListener('click',()=>pick('photo'));pick('ruler');
   }
  }
  function preparePhoto(s,card){
   s.photoCard=card;card.classList.add('bio2-photo-card');const slot=make('div','bio2-photo-slot');slot.append(card);s.media.append(slot);s.photoCaption=make('div','bio2-photo-caption');intoCaption(s,s.photoCaption);
   for(const n of [...card.children])if(!n.classList.contains('photo-window')){
    if(n.classList.contains('control-row'))group(s.toolbar,n,'影像操作','Image controls');
    else if(n.tagName==='P'&&!n.id)s.instructions.append(n);
    else s.photoCaption.append(n);
   }
  }
  function prepareOrganization(bench){
   if(bench.classList.contains('org-hierarchy'))return;
   const controls=bench.querySelector('.org-controls'),view=bench.querySelector('.org-view'),key=bench.id.replace(/Viewer$/,''),s=shell(bench,controls,view,doc.getElementById(key+'Expand'));
   const reset=doc.getElementById(key+'Reset');if(reset)s.tools.append(reset);
   for(const n of [...controls.children]){
    if(n===s.toolbar)continue;
    if(n.classList.contains('org-function'))intoCaption(s,n);
    else if(n.tagName==='P')s.instructions.append(n);
    else if(n.classList.contains('control-row')&&!n.children.length)n.hidden=true;
    else group(s.toolbar,n,n.classList.contains('org-options')?'選擇觀察對象':'',n.classList.contains('org-options')?'Observation target':'');
   }
   const image=view.querySelector('.org-photo');if(image)s.media.append(image);
   for(const n of [...view.children])if(n!==s.media&&n!==s.caption)intoCaption(s,n);
  }
  for(const bench of doc.querySelectorAll('.lab'))prepareLab(bench);
  for(const bench of doc.querySelectorAll('.org-viewer'))prepareOrganization(bench);
  // Hierarchy viewers intentionally keep the teacher-approved full-width left-to-right flow.
  for(const bench of doc.querySelectorAll('.org-hierarchy'))bench.classList.add('bio2-hierarchy');
  function fit(){
   const pill=doc.querySelector('.floating-lang-container');
   for(const s of sessions){
    s.caption.setAttribute('aria-label',tr('圖下解說與讀值；可捲動','Explanations and readings below the figure; scroll when needed'));
    if(s.photoCaption)s.photoCaption.hidden=s.photoCard.hidden;
    if(s.photoButton){s.photoButton.disabled=s.photoCard.hidden;if(s.photoCard.hidden&&s.bench.dataset.bio2View==='photo')s.pickView('ruler');}
    // The original reference image is now above its explanation; only update the directional hint.
    if(s.bench.id==='toolsLab'){const n=doc.getElementById('toolsCaption');if(n)n.textContent=tr('圖中是真實參考影像，拍攝方式已註明；不是所選工具的模擬畫面。','The real reference image is labeled with its acquisition method; it is not a simulated view through the selected tool.');}
    if(!s.bench.classList.contains('is-expanded'))continue;
    const labels=s.media.querySelector('.view-labels'),h=Math.max(1,Math.floor(s.media.getBoundingClientRect().height-(labels?.getBoundingClientRect().height||0)-16));
    if(s.bench.style.getPropertyValue('--bio2-media-h')!==h+'px')s.bench.style.setProperty('--bio2-media-h',h+'px');
    if(pill)s.bench.style.setProperty('--bio2-lang-clearance',Math.ceil(pill.getBoundingClientRect().width+24)+'px');
   }
  }
  // Follow existing actions rather than introducing an animation clock or new physics state.
  for(const s of sessions){
   s.bench.addEventListener('click',fit);s.bench.addEventListener('input',fit);s.bench.addEventListener('change',fit);
   if(typeof root.ResizeObserver==='function'){const o=new root.ResizeObserver(fit);o.observe(s.media);o.observe(s.caption);o.observe(s.head);}
   if(typeof root.MutationObserver==='function'){const o=new root.MutationObserver(fit);o.observe(s.bench,{attributes:true,attributeFilter:['class','data-bio2-view']});if(s.photoCard)o.observe(s.photoCard,{attributes:true,attributeFilter:['hidden']});}
  }
  doc.querySelectorAll('[data-language],.tab-btn').forEach(n=>n.addEventListener('click',fit));root.addEventListener?.('resize',fit,{passive:true});fit();
  const session={sessions,fit};installed.set(doc,session);return session;
 }
 const api={install};root.BiologyChapter2Compact=api;if(root.document)api.session=install(root.document);
})(typeof globalThis==='object'?globalThis:this);

/* Display-only adapter. Original nodes and event handlers are moved, never cloned. */
(function(root){
 'use strict';
 const installed=new WeakMap();
 function install(doc){
  if(!doc.body.classList.contains('bio-compact-v1'))return null;
  if(installed.has(doc))return installed.get(doc);
  const tr=(zh,en)=>doc.documentElement.lang==='en'?en:zh;
  const make=(tag,cls)=>{const n=doc.createElement(tag);n.className=cls||'';return n;};
  const label=(tag,cls,zh,en)=>{const n=make(tag,cls);n.dataset.zh=zh;n.dataset.en=en;n.textContent=tr(zh,en);return n;};
  const sessions=[];
  function disclosure(caption){const details=make('details','bio-compact-help');details.append(label('summary','','操作提示與圖像來源','Tips and image sources'));const help=make('div','bio-compact-help-body');details.append(help);caption.append(details);return help;}
  function group(host,cls,zh,en,nodes){const items=nodes.filter(Boolean);if(!items.length)return null;const n=make('div','bio-control-group '+cls);if(zh)n.append(label('span','bio-group-label',zh,en));n.append(...items);host.append(n);return n;}
  function prepareScope(bench){
   if(bench.dataset.compactUi)return;
   const side=bench.querySelector('.scope-sidebar'),view=bench.querySelector('.scope-view');if(!side||!view)return;
   bench.dataset.compactUi='v1';const caption=make('div','bio-figure-notes');caption.tabIndex=0;view.append(caption);const help=disclosure(caption);
   const original=[...side.children],groups=make('div','bio-control-groups');side.prepend(groups);
   for(const selector of ['.scope-readouts','#partStatus','#specimenNote','#trackingStatus','#shapeInfo','#partInfo','#mountMaterial','#mountSteps','#mountInfo','.lab-progress','.lab-coach']){const n=bench.querySelector(selector);if(n)caption.insertBefore(n,caption.firstElementChild);}
   for(const node of original){
    if(node.parentElement!==side)continue;
    if(node.classList.contains('cell-lab-legacy'))continue;
    if(node.tagName==='P'||node.classList.contains('scope-side-details')||node.classList.contains('cell-photo-credit')||node.classList.contains('cell-photo-source-details')){help.append(node);continue;}
    if(node.classList.contains('scope-controls')){
     // syncPause() in microscope.js depends on the exact nextElementSibling relationship.
     const actions=node.nextElementSibling?.classList.contains('control-row')?node.nextElementSibling:null;
     for(const box of node.querySelectorAll('.scope-control')){const small=box.querySelector('small'),title=box.querySelector('label');if(small){const tip=make('div','bio-knob-tip');if(title)tip.append(label('strong','',title.dataset.zh||title.textContent,title.dataset.en||title.textContent));tip.append(small);help.append(tip);}}
     group(groups,'bio-dials','','',[node,actions]);continue;
    }
    if(node.classList.contains('stage-panel')){const p=node.querySelector('p');if(p)help.append(p);group(groups,'bio-stage-group','','',[node]);continue;}
    if(node.classList.contains('cell-photo-controls')){const p=node.querySelector('p');if(p)help.append(p);group(groups,'bio-photo-tools','','',[node]);continue;}
    if(node.classList.contains('cell-scope-controls')){compactLab(node,groups,help);continue;}
    if(node.id==='partButtons'||node.id==='partChoices')group(groups,'bio-parts','構造定位','Locate structures',[node]);
    else if(node.id==='shapeChoices')group(groups,'bio-specimen','細胞種類','Cell type',[node]);
    else if(['mountChoices','observeChoices'].includes(node.id))group(groups,'bio-specimen','選擇標本','Specimen',[node]);
    else if(node.id==='cellTypeChoices')group(groups,'bio-cell-type','細胞比較','Compare cells',[node]);
    else if(node.id==='mountNext')group(groups,'bio-main-actions','製作操作','Preparation controls',[node,original.find(n=>n.classList.contains('control-row'))]);
    else if(node.classList.contains('control-row')&&node.parentElement===side)group(groups,'bio-main-actions','操作','Controls',[node]);
    else group(groups,'','','',[node]);
   }
   for(const details of [...help.querySelectorAll('.cell-photo-source-details')])caption.append(details);
   sessions.push({bench,side,view,caption,help,groups});
  }
  function compactLab(panel,groups,help){
   const original=[...panel.children];panel.classList.add('bio-lab-groups');groups.append(panel);
   group(panel,'bio-main-actions','操作確認','Confirm step',original.filter(n=>n.tagName==='BUTTON'));
   group(panel,'bio-instrument','','',[panel.querySelector('.cell-scope-instrument')]);
   group(panel,'bio-objectives','','',[panel.querySelector('.lab-objective-label'),panel.querySelector('.lab-objectives')]);
   group(panel,'bio-lamp','','',[original.find(n=>n.tagName==='LABEL')]);
   group(panel,'bio-adjustments','','',original.filter(n=>n.classList.contains('lab-adjustments')));
   for(const n of original)if(n.classList.contains('lab-workflow')||n.classList.contains('lab-model-note'))help.append(n);
  }
  for(const bench of doc.querySelectorAll('.scope-workbench'))prepareScope(bench);
  function prepareIntro(){
   const choice=doc.getElementById('variableChoices');
   if(choice){const board=choice.closest('.board');board.classList.add('bio-intro-workbench');const head=make('div','bio-control-header'),title=board.querySelector('h3'),toolbar=make('div','bio-control-groups');board.prepend(head);head.append(title);group(toolbar,'bio-variable','操作變因','Manipulated variable',[choice]);group(toolbar,'bio-main-actions','觀察操作','Observation controls',[doc.getElementById('runExperiment').closest('.control-row')]);head.after(toolbar);const caption=make('div','bio-figure-notes'),status=doc.getElementById('experimentStatus'),question=board.querySelector('p');board.append(caption);caption.append(status);if(question&&question!==status)caption.append(question);}
   const range=doc.getElementById('bioRange');
   if(range){const controls=range.closest('.bio-control'),board=controls.closest('.board'),stage=board.querySelector('.bio-stage');board.classList.add('bio-intro-workbench');const head=make('div','bio-control-header');head.append(label('h3','','移動探測點，看生物圈','Move the probe through the biosphere'));board.prepend(head);controls.classList.add('bio-control-groups');head.after(controls);const caption=make('div','bio-figure-notes');stage.after(caption);caption.append(doc.getElementById('bioStatus'));const help=disclosure(caption),note=controls.querySelector('.scale-note');if(note)help.append(note);group(controls,'bio-range','','',[controls.querySelector('label'),range]);group(controls,'bio-altitudes','快速定位','Quick location',[controls.querySelector('.choice-row')]);}
   const needs=doc.getElementById('needsGrid');if(needs){needs.classList.add('bio-needs-toolbar');doc.querySelector('.habitat-image').before(needs);}
  }
  if(doc.body.dataset.biologyUnit==='intro')prepareIntro();
  function fit(){
   for(const s of sessions){
    s.caption.setAttribute('aria-label',tr('圖下解說；需要時可捲動','Figure explanation; scroll when needed'));
    if(!s.bench.classList.contains('scope-full'))continue;
    const visual=s.view.querySelector('.lens-wrap')||s.view.querySelector('.scope-photo-frame');if(!visual)continue;
    const text=[...visual.children].filter(n=>!n.hidden&&['lens-title','lab-readout','lab-field-hint','cell-image-state','photo-credit'].some(cls=>n.classList.contains(cls)));
    const height=Math.max(80,Math.floor(visual.getBoundingClientRect().height-text.reduce((a,n)=>a+n.getBoundingClientRect().height,0)-40)),value=height+'px';
    if(s.bench.style.getPropertyValue('--bio-visual-h')!==value)s.bench.style.setProperty('--bio-visual-h',value);
    const pill=doc.querySelector('.floating-lang-container');if(pill){const clearance=Math.ceil(pill.getBoundingClientRect().width+24)+'px';if(s.bench.style.getPropertyValue('--bio-lang-clearance')!==clearance)s.bench.style.setProperty('--bio-lang-clearance',clearance);}
   }
  }
  if(typeof root.ResizeObserver==='function'){const ro=new root.ResizeObserver(fit);for(const s of sessions){ro.observe(s.view);ro.observe(s.caption);const visual=s.view.querySelector('.lens-wrap')||s.view.querySelector('.scope-photo-frame');if(visual)ro.observe(visual);}}
  if(typeof root.MutationObserver==='function'){const mo=new root.MutationObserver(fit);for(const s of sessions)mo.observe(s.bench,{attributes:true,attributeFilter:['class','data-media']});}
  for(const id of ['langZh','langEn'])doc.getElementById(id)?.addEventListener('click',fit);
  root.addEventListener?.('resize',fit,{passive:true});fit();const session={sessions,fit};installed.set(doc,session);return session;
 }
 const api={install};if(typeof module==='object'&&module.exports)module.exports=api;
 root.BiologyChapter1Compact=api;if(root.document)api.session=install(root.document);
})(typeof globalThis==='object'?globalThis:this);

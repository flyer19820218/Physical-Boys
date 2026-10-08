/* Display-only adapter. Original nodes, handlers, image pixels and Canvas coordinates remain intact. */
(function(root){
 'use strict';
 const installed=new WeakMap();
 function install(doc){
  if(!doc.body.classList.contains('bio-compact-v3'))return null;
  if(installed.has(doc))return installed.get(doc);
  const prepared=new WeakMap();let sessions=[],busy=false;
  const resize=typeof root.ResizeObserver==='function'?new root.ResizeObserver(()=>fit()):null;
  const make=(tag,cls)=>{const n=doc.createElement(tag);n.className=cls||'';return n;};
  const tr=(zh,en)=>doc.documentElement.lang==='en'?en:zh;
  function group(s,n,heading){
   const box=make('div','bio3-group');if(heading){heading.classList.add('bio3-group-label');box.append(heading);}if(n)box.append(n);s.toolbar.append(box);return box;
  }
  function copyToCaption(s,n){if(n){n.classList.add('bio3-control-explanation');s.caption.append(n);}}
  function arrange(s,container){
   // Preserve label/input sibling relationships: the animal lesson reads previousElementSibling.
   const nodes=[...container.children];let heading=null;
   for(let i=0;i<nodes.length;i++){
    const n=nodes[i];if(n===s.toolbar||n===s.full||n===s.reset)continue;
    if(n.classList.contains('local-language')){n.hidden=true;continue;}
    if(n.classList.contains('control-block')||n.classList.contains('ps-control')&&n.tagName==='DIV'){
     arrange(s,n);n.hidden=true;continue;
    }
    if(n.tagName==='H3'){if(heading)group(s,null,heading);heading=n;continue;}
    if(n.tagName==='P'||n.id==='focus-nutrient-text'){
     if(heading){const wrap=make('div','bio3-explanation');wrap.append(heading,n);copyToCaption(s,wrap);heading=null;}
     else copyToCaption(s,n);continue;
    }
    if(n.tagName==='LABEL'&&['INPUT','SELECT'].includes(nodes[i+1]?.tagName)){
     const box=group(s,n,heading);box.append(nodes[++i]);heading=null;continue;
    }
    // An emptied fullscreen-only group must not leave a redundant toolbar title.
    if(n.classList.contains('ps-control')&&!n.children.length)continue;
    const box=group(s,n,heading);heading=null;
    if(n.classList.contains('lab-actions')||n.classList.contains('lab-progress')||n.classList.contains('ps-timeline'))box.classList.add('bio3-actions-group');
   }
   if(heading&&container.querySelector('button,input,select,ol'))group(s,null,heading);
  }
  function prepare(bench){
   if(prepared.has(bench))return prepared.get(bench);
   const controls=bench.querySelector('.lab-controls,.ps-controls,.an-controls'),view=bench.querySelector('.lab-view,.ps-view,.an-visual');if(!controls||!view)return null;
   const full=controls.querySelector('[data-expand],[data-action="fullscreen"]'),reset=controls.querySelector('[data-action="resetView"]');
   const head=make('header','bio3-head'),title=make('h3','bio3-title'),tools=make('div','bio3-head-tools'),toolbar=make('div','bio3-toolbar'),media=make('div','bio3-media'),caption=make('div','bio3-caption');
   const topic=bench.closest('.lesson')?.querySelector('h2');title.textContent=topic?.textContent||tr('互動觀察','Interactive observation');head.append(title,tools);if(full)tools.append(full);if(reset)tools.append(reset);
   bench.classList.add('bio3-bench');controls.classList.add('bio3-controls');view.classList.add('bio3-view');bench.prepend(head);controls.prepend(toolbar);view.prepend(media);caption.tabIndex=0;
   const s={bench,controls,view,head,tools,toolbar,media,caption,full,reset};prepared.set(bench,s);
   for(const n of [...view.children]){
    if(n===media)continue;
    if(n.tagName==='CANVAS'||n.classList.contains('an-stage')||n.classList.contains('ps-original-viewer'))media.append(n);
    else if(n.classList.contains('photo-box')){
     const credit=n.querySelector('figcaption');if(credit)caption.append(credit);media.append(n);
    }else caption.append(n);
   }
   arrange(s,controls);
   for(const n of [...bench.children])if(n.classList.contains('ps-credits'))caption.append(n);
   view.append(caption);
   // Watch only geometry/display changes, never the animated text/pixels inside the lesson.
   if(typeof root.MutationObserver==='function'){
    const o=new root.MutationObserver(fit);o.observe(bench,{attributes:true,attributeFilter:['class']});
    for(const n of media.children)o.observe(n,{attributes:true,attributeFilter:['hidden']});
   }
   return s;
  }
  function fit(){
   const pill=doc.querySelector('.floating-lang-container');
   for(const s of sessions){
    s.caption.setAttribute('aria-label',tr('圖下解說與觀察結果；可捲動','Explanations and observations below the figure; scroll when needed'));
    if(!s.bench.classList.contains('expanded'))continue;
    const height=Math.max(1,Math.floor(s.media.getBoundingClientRect().height-8));
    if(s.bench.style.getPropertyValue('--bio3-media-h')!==height+'px')s.bench.style.setProperty('--bio3-media-h',height+'px');
    if(pill)s.bench.style.setProperty('--bio3-lang-clearance',Math.ceil(pill.getBoundingClientRect().width+24)+'px');
   }
  }
  function scan(){
   if(busy)return;busy=true;
   try{
    const next=[...doc.querySelectorAll('.lab,.ps-lab,.an-lab')].map(prepare).filter(Boolean);
    if(resize){
     for(const s of sessions)if(!next.includes(s))for(const n of [s.media,s.head,s.caption])resize.unobserve(n);
     for(const s of next)if(!sessions.includes(s))for(const n of [s.media,s.head,s.caption])resize.observe(n);
    }
    sessions=next;fit();
   }finally{busy=false;}
  }
  const api={scan,fit,get sessions(){return sessions;}};installed.set(doc,api);
  // Language changes and animal actions rebuild all lesson nodes. Adapt the fresh nodes,
  // without replacing any core render function or introducing an animation clock.
  if(typeof root.MutationObserver==='function')new root.MutationObserver(scan).observe(doc.getElementById('lessons'),{childList:true});
  for(const name of ['click','input','change','keydown'])doc.addEventListener(name,scan);
  root.addEventListener?.('resize',fit,{passive:true});scan();return api;
 }
 const api={install};root.BiologyChapter3Compact=api;if(root.document)api.session=install(root.document);
})(typeof globalThis==='object'?globalThis:this);

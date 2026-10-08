/* V4: regroup the existing controls, never clone buttons or alter teaching logic. */
(function(root){
  'use strict';
  function fullscreenMetrics(w,h,captionHeight=160,ar=1.5){
    const portrait=h>w||w<=750;
    const controls=portrait?Math.max(210,Math.min(300,h*.24)):244;
    const caption=Math.max(0,Math.min(captionHeight,h*.24,180));
    const availableW=portrait?w-20:w-20-controls-10;
    const availableH=portrait?h-20-controls-10-8-caption:h-20-60-8-caption;
    const width=Math.max(0,Math.min(availableW,availableH*ar));
    return {portrait,controls,caption,availableW,availableH,width,height:width/ar};
  }
  function install(doc){
    const labs=Array.from(doc.querySelectorAll('[data-lab]'));
    if(!labs.length)return null;
    const slots=[],captions=[];
    for(const lab of labs){
      const stage=lab.querySelector('.ps-stage'),canvasWrap=lab.querySelector('.ps-canvas-wrap'),controls=lab.querySelector('.ps-controls');
      if(!stage||!canvasWrap||!controls||lab.dataset.largeStage==='v4')continue;
      lab.dataset.largeStage='v4';
      const slot=doc.createElement('div');slot.className='ps-canvas-slot';
      stage.insertBefore(slot,canvasWrap);slot.appendChild(canvasWrap);slots.push(slot);
      const caption=lab.querySelector('.ps-caption');
      if(caption){
        caption.tabIndex=0;caption.dataset.labelZh='圖下解說；需要時可捲動';caption.dataset.labelEn='Figure explanation; scroll when needed';caption.setAttribute('aria-label',doc.documentElement.lang==='en'?caption.dataset.labelEn:caption.dataset.labelZh);captions.push(caption);
        compactControls(doc,lab,controls,caption);
      }
    }
    const fit=()=>{
      for(const slot of slots){
        const lab=slot.parentElement.parentElement;
        if(!lab.classList.contains('is-expanded'))continue;
        const height=Math.floor(slot.getBoundingClientRect().height);
        if(height>0){
          const value=height+'px';
          if(slot.style.getPropertyValue('--ps-slot-height')!==value)slot.style.setProperty('--ps-slot-height',value);
        }
      }
    };
    let resizeObserver=null,mutationObserver=null;
    if(typeof root.ResizeObserver==='function'){
      resizeObserver=new root.ResizeObserver(fit);slots.forEach(slot=>resizeObserver.observe(slot));
    }
    if(typeof root.MutationObserver==='function'){
      mutationObserver=new root.MutationObserver(fit);labs.forEach(lab=>mutationObserver.observe(lab,{attributes:true,attributeFilter:['class']}));
    }
    if(typeof root.addEventListener==='function')root.addEventListener('resize',fit,{passive:true});
    fit();
    return {slots,captions,fit,resizeObserver,mutationObserver};
  }
  function bilingual(doc,tag,zh,en,classes){
    const node=doc.createElement(tag);node.className=classes||'';
    node.dataset.zh=zh;node.dataset.en=en;
    node.textContent=doc.documentElement.lang==='en'?en:zh;return node;
  }
  function compactControls(doc,lab,controls,caption){
    const original=Array.from(controls.children);
    const buttons=Array.from(controls.querySelectorAll('[data-action]'));
    const header=doc.createElement('div');header.className='ps-control-header';
    const tools=doc.createElement('div');tools.className='ps-control-tools';
    const title=controls.querySelector('h3');
    controls.insertBefore(header,controls.children[0]);
    if(title)header.appendChild(title);header.appendChild(tools);
    for(const action of ['expand','reset-view']){
      const button=buttons.find(node=>node.dataset.action===action);
      if(button)tools.appendChild(button);
    }
    const groups=doc.createElement('div');groups.className='ps-control-groups';controls.appendChild(groups);
    const details=doc.createElement('details');details.className='ps-help-details';
    details.appendChild(bilingual(doc,'summary','操作提示與原圖來源','Tips and original image sources'));
    const help=doc.createElement('div');help.className='ps-help-content';details.appendChild(help);
    for(const note of Array.from(controls.querySelectorAll('p')))help.appendChild(note);
    const labels={focus:['構造定位','Locate tissues'],part:['觀察位置','Location'],kind:['觀察標本','Specimen'],detail:['觀察範圍','View'],season:['生長操作','Growth controls'],stage:['後續操作','Sequence controls'],play:['動畫','Animation']};
    let pendingLabel=null;
    for(const node of original){
      if(node.classList.contains('control-label')){pendingLabel=node;continue;}
      if(node.dataset.sugarOptions!==undefined){
        node.classList.add('ps-control-group');node.dataset.controlGroup='sink';
        const label=node.querySelector('.control-label');if(label)label.classList.add('ps-group-label');
        groups.appendChild(node);continue;
      }
      const isRow=node.classList.contains('button-row');
      const action=isRow?node.querySelector('[data-action]'):node.dataset.action?node:null;
      if(!action||['expand','reset-view'].includes(action.dataset.action))continue;
      const key=action.dataset.action;
      const group=doc.createElement('div');group.className='ps-control-group';group.dataset.controlGroup=key;
      const label=pendingLabel||bilingual(doc,'span',...(lab.dataset.lab==='network'&&key==='focus'?['追蹤物質','Substance']:labels[key]||['操作','Controls']),'ps-group-label');
      label.classList.add('ps-group-label');group.appendChild(label);pendingLabel=null;
      if(isRow)group.appendChild(node);
      else{const row=doc.createElement('div');row.className='button-row';row.appendChild(node);group.appendChild(row);}
      groups.appendChild(group);
    }
    for(const selector of ['[data-feedback]','[data-steps]']){
      const result=lab.querySelector(selector);if(result)caption.appendChild(result);
    }
    const credit=lab.querySelector('[data-credit]');if(credit)help.appendChild(credit);
    caption.appendChild(details);
  }
  const api={fullscreenMetrics,install,compactControls};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.PlantStructureLayout=api;
  if(root.document)api.session=install(root.document);
})(typeof globalThis==='object'?globalThis:this);

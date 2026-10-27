(function(){'use strict';
 const A=window.AnimalData,D=window.AnimalDraw,J=window.AnimalJourney,F=window.AnimalStoryData,P=window.AnimalPolymer,O=window.AnimalOverview,Q=window.AnimalCuriosity,E=window.AnimalEvidence;
 const s={lang:'zh',page:0,k:0,station:0,route:0,step:0,elapsed:0,playing:false,scope:'station',expanded:false,absorb:'glucose',zoom:1,panX:0,panY:0,overview:'whole',overviewGroup:'tract',overviewOrgan:'mouth',useFocus:'cell'};
 const images={},pointers=new Map();let entered=false,raf=0,last=0,gesture=null;
 const $=id=>document.getElementById(id),tr=(z,e)=>s.lang==='zh'?z:e,T=a=>tr(...a),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const button=(action,pair,value='',active=false,primary=false,disabled=false)=>`<button type="button" class="action-btn${active?' active':''}${primary?' primary':''}" data-action="${action}" data-value="${esc(value)}" aria-pressed="${active}" ${disabled?'disabled':''}>${esc(T(pair))}</button>`;
 const stationHeading=pair=>s.lang==='en'?esc(T(pair)):T(pair).split('，').map((part,i,parts)=>`<span class="station-word">${esc(part+(i<parts.length-1?'，':''))}</span>`).join('<wbr>');
 const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0;};
 const current=()=>F.stops[s.station].steps[s.step],progress=()=>s.elapsed/current().seconds;
 const resetView=()=>{s.zoom=1;s.panX=0;s.panY=0;pointers.clear();gesture=null;};
 const nativeState=()=>({lang:s.lang,langIndex:s.lang==='zh'?0:1,nutrient:0,digestion:progress()<.5?0:1,organ:F.route[s.route][0],anatomyMode:'tract',anatomyView:'atlas',zoomOrgan:false,organProgress:1,fluid:0,fluidProgress:0,peristalsis:progress()*100,villusView:'original',absorb:s.absorb,absorbStage:-1,route:0,useProgress:progress()*100});
 function anatomyCredit(){return tr('原創 AI 解剖示意，非實拍；器官放大取自同一張圖。','Original AI anatomical illustration, not a photograph; zooms use this same image.')+` <a href="assets/biology/animal_nutrition_revision_1012_v1.md">${tr('生成紀錄','Generation record')}</a>`;}
 function histologyCredit(){return `OpenStax College · <a href="https://commons.wikimedia.org/wiki/File:2418_Histology_Small_IntestinesN.jpg">${tr('來源','Source')}</a> · <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a> · University of Michigan Medical School (Regents, 2012) · ${tr('保留真實切片；中文構造重繪、英文用原圖。','Real micrographs retained; Chinese structural drawing, original English plate.')}`;}
 /* 2026-10-27 teacher-authorized auto-play (controller only; original backed up in the scratchpad).
  * Both tabs play by themselves in one continuous loop. The drawings, scenes, step texts and step durations are the
  * existing ones; the old play/pause/slider/zoom/choice buttons are replaced by at most 5 numbered step buttons
  * that jump to the first sub-step of their group and keep playing. Choices (glands, absorbed molecules,
  * cell/mitochondrion) are now shown one after another automatically. */
 const SEQ0=[...F.route.map((r,i)=>({kind:'route',route:i,sec:2})),...O.groups.tract.map(id=>({kind:'organ',id,group:'tract',sec:O.tourSeconds})),{kind:'glandsWhole',id:'salivary',sec:O.tourSeconds},...O.groups.glands.map(id=>({kind:'organ',id,group:'glands',sec:O.tourSeconds}))];
 const SEQ1=[];F.stops.forEach((st,i)=>st.steps.forEach((v,j)=>{
  if(v.scene==='glands'&&i===3)['liver','gall','pancreas'].forEach(focus=>SEQ1.push({station:i,step:j,focus,sec:v.seconds}));
  else if(v.scene==='absorb')['glucose','amino','starch','protein'].forEach(absorb=>SEQ1.push({station:i,step:j,absorb,sec:v.seconds}));
  else SEQ1.push({station:i,step:j,sec:v.seconds});}));
 const span=(list,starts,labels)=>starts.map((a,g)=>({a,b:(g<starts.length-1?starts[g+1]:list.length)-1,label:labels[g]}));
 const SEQ=[SEQ0,SEQ1],GROUPS=[
  span(SEQ0,[0,SEQ0.findIndex(v=>v.id==='mouth'),SEQ0.findIndex(v=>v.id==='stomach'),SEQ0.findIndex(v=>v.id==='large'),SEQ0.findIndex(v=>v.kind==='glandsWhole')],[['整條路線','The whole route'],['口腔 → 咽 → 食道','Mouth → pharynx → esophagus'],['胃 → 小腸','Stomach → small intestine'],['大腸 → 直腸 → 肛門','Large intestine → rectum → anus'],['消化液來源','Fluid sources']]),
  span(SEQ1,[0,SEQ1.findIndex(v=>v.station===2),SEQ1.findIndex(v=>v.station===3),SEQ1.findIndex(v=>v.station===3&&F.stops[3].steps[v.step].id==='structure'),SEQ1.findIndex(v=>v.station===4)],[['口腔 → 食道','Mouth → esophagus'],['胃','Stomach'],['小腸：消化','Small intestine: digestion'],['小腸：吸收與利用','Small intestine: absorption and use'],['大腸 → 肛門','Large intestine → anus']])];
 const absorbNames={glucose:['葡萄糖','Glucose'],amino:['胺基酸','Amino acid'],starch:['完整澱粉','Whole starch'],protein:['完整蛋白質','Whole protein']};
 const group=()=>GROUPS[s.page].findIndex(g=>s.k>=g.a&&s.k<=g.b);
 function apply(k){const list=SEQ[s.page];k=((k%list.length)+list.length)%list.length;const v=list[k];s.k=k;s.elapsed=0;s.playing=true;resetView();
  if(s.page===0){if(v.kind==='route'){s.overview='whole';s.overviewGroup='tract';s.route=v.route;s.scope='route';}
   else if(v.kind==='glandsWhole'){s.overview='whole';s.overviewGroup='glands';s.overviewOrgan=v.id;s.scope='route';}
   else{s.overview='organ';s.overviewGroup=v.group;s.overviewOrgan=v.id;s.scope='organs';const r=F.route.findIndex(x=>x[0]===v.id);if(r>=0)s.route=r;}}
  else{s.station=v.station;s.step=v.step;s.focusOrgan=v.focus||null;s.absorb=v.absorb||'glucose';s.useFocus='cell';s.scope='station';}}
 function controls(){
  const cur=group();
  let out=`<div class="story-toolbar">${button('fullscreen',s.expanded?['× 返回教材','× Return to lesson']:['⛶ 全螢幕','⛶ Full screen'])}</div><div class="story-steps story-jumps" role="group" aria-label="${tr('步驟','Steps')}">${GROUPS[s.page].map((g,i)=>`<button type="button" class="action-btn${i===cur?' active':''}" data-action="jump" data-value="${i}"${i===cur?' aria-current="step"':''}>${i+1}　${esc(T(g.label))}</button>`).join('')}</div><p class="story-overview-hint">${tr('動畫會自動播放並重複；點步驟編號，可以跳到那一步。','The animation plays and repeats automatically. Tap a step number to jump to that step.')}</p>`;
  if(s.page===0){const v=SEQ0[s.k];return out+(v.kind==='organ'?`<p class="story-organ-progress">${esc(T(O.record(v.id).name))}</p>`:'')+`<p>${s.overviewGroup==='tract'?tr('食物依序走這條通道。','Food passes through these organs in sequence.'):tr('這些器官提供消化液，食物不穿過它們。','These organs supply fluids; food does not pass through them.')}</p>`;}
  const st=F.stops[s.station];
  if(current().scene==='absorb')out+=`<p class="story-location">${tr('追蹤養分：','Nutrient followed: ')}${esc(T(absorbNames[s.absorb]))}</p>`;
  if(current().scene==='glands')out+=`<p class="story-location">${esc(T(A.organs.find(o=>o.id===(s.focusOrgan||current().organ)).name))}</p>`;
  if(current().scene==='use')out+=`<p class="story-use-link">${tr('小腸先<span class="story-science-word">吸收</span> → 血液接著<span class="story-science-word">運送</span> → <span class="story-science-word">細胞</span>利用與<span class="story-science-word">呼吸作用</span>','First absorption → then transport in blood → cellular use and respiration')}</p>`;
  return out+`<p class="story-location">${esc(T(J.stations[s.station].title))} · ${esc(T(st.name))}${st.ph?' · '+esc(T(st.ph)):''}</p>`;
 }
 function panelCaption(){if(s.page===0){if(s.overview==='organ'||s.overviewGroup==='glands'){const o=O.record(s.overviewOrgan);return `<strong>${esc(T(o.name))} ｜ ${esc(T(o.copy[0]))}</strong><p>${esc(T(o.copy[1]))}</p>`;}const id=F.route[s.route][0],organ=A.organs.find(o=>o.id===id);return `<strong>${esc(T(F.route[s.route][1]))}</strong><p>${id==='rectum'?tr('糞便先在直腸暫存，再由肛門排出。','Feces are stored in the rectum, then pass through the anus.'):esc(T(organ.info))}</p>`;}
  return `<strong>${esc(T(current().label))}</strong><p>${esc(T(current().copy))}</p>`;
 }
 function render(){
  E.pause();
  pointers.clear();gesture=null;
  document.documentElement.lang=s.lang==='zh'?'zh-Hant':'en';document.title=tr('食物的旅程｜Physical-Boys','Food\'s journey | Physical-Boys');
  document.querySelectorAll('[data-zh]').forEach(el=>el.textContent=el.dataset[s.lang]);document.querySelectorAll('[data-language]').forEach(b=>{b.classList.toggle('active',b.dataset.language===s.lang);b.setAttribute('aria-pressed',b.dataset.language===s.lang);});
  const tabs=[[['先看整條路','See the whole route'],['消化道概論','Digestive tract overview']],[['跟著這一口','Follow this bite'],['逐站消化與吸收','Digestion and absorption at each stop']]];
  $('tabs').innerHTML=tabs.map((t,i)=>`<button type="button" id="story-tab-${i}" class="tab-btn${s.page===i?' active':''}" role="tab" aria-selected="${s.page===i}" aria-controls="story-lesson" tabindex="${s.page===i?0:-1}" data-action="page" data-value="${i}"><span class="tab-main">${esc(T(t[0]))}</span><span class="tab-sub">${esc(T(t[1]))}</span></button>`).join('');
  const hook=s.page===0?['食物會進入肝臟和胰臟嗎？先沿著精美解剖圖，把真正的食物通道走一遍。','Does food enter the liver or pancreas? Follow the anatomical illustration to find its actual passage.']:['同一口食物，到了新的一站，會遇到誰？動畫會一站一站自動播放，一起看器官、消化液與分子如何接力。','Who meets this bite at the next stop? The animation plays stop by stop: watch the organ, fluids and molecular changes connect.'];
  const curiosity=s.page===0&&s.overview==='organ'?Q.render(s.lang,s.overviewOrgan):'';
  const stations='',notesOpen=!!document.querySelector('.story-notes')?.open,sourcesOpen=!!document.querySelector('#sources details')?.open;
  $('lessons').innerHTML=`<section id="story-lesson" class="lesson" role="tabpanel" aria-labelledby="story-tab-${s.page}"><div class="hook-box"><div class="xiaozhen-logo"><img src="assets/characters/xiaozhen/teaching.png" alt="${tr('曉臻老師','Teacher Xiaozhen')}"></div><div><div class="hook-title">${tr('曉臻老師說：','Teacher Xiaozhen says:')}</div><div class="hook-text">${esc(T(hook))}</div></div></div>${stations}<div id="story-lab" class="an-lab${s.page===0?' overview-lab':''}${curiosity?' has-curiosity':''}${s.expanded?' expanded':''}" style="--ar:1.4545454545454546"><div class="an-controls">${controls()}</div><div class="an-visual"><div class="an-stage"><canvas id="storyScene" width="960" height="660" aria-label="${s.page===0?tr('消化道解剖與路線','Digestive anatomy and route'):esc(T(current().label))}"></canvas>${s.page===1&&current().scene==='use'?E.media(tr):''}</div>${curiosity}<div id="storyCaption" class="an-caption">${panelCaption()}</div><p id="storyCredit" class="an-credit">${s.page===0||['zoom','glands'].includes(current().scene)?anatomyCredit():current().scene==='structure'?histologyCredit():tr('原創動態教學模型，非實拍、非真實尺度與速率。','Original dynamic teaching model, not photographs, real scale or measured speeds.')}</p></div></div>${s.page===1?`<details class="story-notes"><summary>${tr('展開本站完整解說','Expand the complete stop explanation')}</summary>${J.stations[s.station].facts.map(p=>`<p>${esc(T(p))}</p>`).join('')}<p>${esc(T(J.stations[s.station].closure))}</p>${s.station===0?`<a href="biology_enzymes.html">${tr('回看澱粉酶與唾液實驗','Revisit enzymes and the saliva experiment')}</a>`:''}</details>`:`<div class="an-closure">${tr('口腔 → 咽 → 食道 → 胃 → 小腸 → 大腸 → 直腸 → 肛門','Mouth → pharynx → esophagus → stomach → small intestine → large intestine → rectum → anus')}</div>`}</section>`;
  $('sources').innerHTML=`<details><summary>${tr('圖像來源與科學核對','Image credits and scientific references')}</summary><p>${anatomyCredit()}</p><p>${histologyCredit()}</p><p>${tr('酵素外輪廓與四階段作用沿用既有單元；三種活性區依老師授權改為與受質局部吻合。澱粉分支鏈、蛋白質線性鏈的單元守恆；三腳脂質沿用原造型。皆為縮略教學模型。','Enzyme outlines and four action stages reuse the existing unit; matching active sites were teacher-authorized. Branched starch and linear protein conserve their units; fat reuses the original three-legged shape. These are abbreviated teaching models.')}</p><p><a href="assets/biology/animal_nutrition_sources_v2.md">${tr('既有素材授權紀錄','Existing asset licensing record')}</a> · <a href="assets/biology/animal_nutrition_story_revision_1012_v2.md">${tr('本版修改紀錄','This revision record')}</a> · <a href="assets/biology/animal_nutrition_overview_revision_1012_v3.md">${tr('器官放大修改紀錄','Organ enlargement revision record')}</a></p><p>${E.credit(1,tr)}</p><p>${E.credit(2,tr)}</p><p>OpenStax: <a href="https://openstax.org/books/biology-2e/pages/3-2-carbohydrates">${tr('澱粉與多醣','Starch and polysaccharides')}</a> · <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/23-7-chemical-digestion-and-absorption-a-closer-look">${tr('消化反應與吸收','Chemical digestion and absorption')}</a> · <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/23-3-the-mouth-pharynx-and-esophagus">${tr('口腔與食道','Mouth and esophagus')}</a> · <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/23-4-the-stomach">${tr('胃','Stomach')}</a> · <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/23-5-the-small-and-large-intestines">${tr('小腸與大腸','Intestines')}</a></p></details>`;
  if(notesOpen&&$('lessons').querySelector('.story-notes'))$('lessons').querySelector('.story-notes').open=true;if(sourcesOpen)$('sources').querySelector('details').open=true;
  document.body.classList.toggle('an-expanded',s.expanded);draw();
 }
 function overview(c){const ns=nativeState();ns.organ=F.route[s.route][0];D.anatomy(c,ns,tr,images);
  const p=window.AnimalAtlas.placement,point={x:p.x+530/1024*p.w,y:p.y+1340/1536*p.h},active=ns.organ==='rectum';
  c.strokeStyle=D.C.teal;c.lineWidth=2;c.beginPath();c.moveTo(699,606);c.lineTo(point.x,point.y);c.stroke();D.round(c,699,582,245,48,12,active?D.C.teal:D.C.deep,D.C.teal);D.text(c,tr('直腸','Rectum'),821,606,24,active?D.C.deep:D.C.teal,'center',229);c.beginPath();c.arc(point.x,point.y,active?8:5,0,Math.PI*2);c.fillStyle=D.C.teal;c.fill();
 }
 function zoom(c,st,p){D.bg(c);const id=st.organ||F.stops[s.station].id,im=images.atlas;if(!im)return;const to=F.crops[id],q=window.EnzymesModel.smooth(Math.min(1,p*3)),from=[0,0,1024,1536],crop=from.map((v,i)=>v+(to[i]-v)*q),scale=Math.min(810/crop[2],500/crop[3]),w=crop[2]*scale,h=crop[3]*scale;
  c.drawImage(im,...crop,480-w/2,325-h/2,w,h);const name=id==='rectum'?['直腸','Rectum']:A.organs.find(o=>o.id===id).name;D.text(c,T(name),480,38,32,D.C.yellow,'center',870);D.text(c,tr('同一張 AI 解剖圖取景放大 · 非實拍','Digital zoom of the same AI anatomical image · not a photograph'),480,624,22,D.C.muted,'center',910);
 }
 // Thin step-progress bar on the top edge (y 0–8), one segment per step button; drawn last so nothing covers it.
 function bar(c){const G=GROUPS[s.page],list=SEQ[s.page],n=G.length,w=960/n,cur=group(),g=G[cur];if(!g)return;let done=0,total=0;for(let i=g.a;i<=g.b;i++){total+=list[i].sec;if(i<s.k)done+=list[i].sec;}const f=Math.max(0,Math.min(1,(done+Math.min(s.elapsed,list[s.k].sec))/total));c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;for(let i=0;i<n;i++){c.fillStyle='rgba(242,236,217,.22)';c.fillRect(i*w+3,0,w-6,8);const x=i<cur?1:i===cur?f:0;if(x>0){c.fillStyle='#fde047';c.fillRect(i*w+3,0,(w-6)*x,8);}}c.restore();}
 function draw(){const cv=$('storyScene');if(!cv)return;const c=cv.getContext('2d');D.bg(c);c.save();c.translate(480+s.panX,330+s.panY);c.scale(s.zoom,s.zoom);c.translate(-480,-330);
  if(s.page===0){if(s.overview==='organ')O.draw(c,images,tr,s.overviewOrgan,s.elapsed);else if(s.overviewGroup==='glands'){const ns=nativeState();ns.anatomyMode='glands';ns.organ=s.overviewOrgan;D.anatomy(c,ns,tr,images);}else overview(c);}else{const st=current(),p=progress(),ns=nativeState();
   if(st.scene==='zoom')zoom(c,st,p);
   else if(st.scene==='glands'){ns.anatomyMode='glands';ns.organ=s.focusOrgan||st.organ;D.anatomy(c,ns,tr,images);}
   else if(st.scene==='chew')D.digestion(c,ns,tr,s.elapsed);
   else if(st.scene==='wave')D.peristalsis(c,ns,tr);
   else if(st.scene==='polymer')P.draw(c,p,tr,st);
   else if(st.scene==='fat'){if(st.fluid===3)P.lipid(c,p,tr);else{ns.nutrient=2;ns.fluid=st.fluid;ns.fluidProgress=p*100;D.secretions(c,ns,tr,s.elapsed);}}
   else if(st.scene==='structure')D.absorption(c,ns,tr,images,s.elapsed);
   else if(st.scene==='absorb'){ns.villusView='model';D.absorption(c,ns,tr,images,s.elapsed);}
   else if(st.scene==='use')E.draw(c,p,tr,images,s.useFocus);
  }c.restore();bar(c);
  if(s.page===1&&current().scene==='use')E.sync(progress(),tr,s.playing);
 }
 function advance(dt){if(!s.playing)return;s.elapsed+=dt;const v=SEQ[s.page][s.k];
  if(s.page===1&&current().scene==='use'){const p=progress();s.useFocus=E.phase(p)===2&&p>=.83?'mitochondrion':'cell';}
  if(s.elapsed>=v.sec){apply(s.k+1);render();}
 }
 // One RAF for the whole page: every start cancels the previous frame first; nothing runs behind the cover or while hidden.
 function frame(t){raf=0;if(!entered||document.hidden)return;const dt=last?Math.min((t-last)/1000,.1):0;last=t;advance(dt);draw();raf=requestAnimationFrame(frame);}
 function schedule(){stop();if(!entered||document.hidden)return;raf=requestAnimationFrame(frame);}
 const resume=schedule;
 function switchPage(i){stop();s.page=i;s.expanded=false;apply(0);render();schedule();}
 function jump(g){const G=GROUPS[s.page][g];if(!G)return;stop();apply(G.a);render();schedule();}
 document.addEventListener('click',ev=>{const b=ev.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action,v=b.dataset.value;
  if(a==='page'){if(+v!==s.page)switchPage(+v);}
  else if(a==='jump')jump(+v);
  else if(a==='fullscreen'){s.expanded=!s.expanded;render();schedule();}
 });
 document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>{s.lang=b.dataset.language;render();schedule();}));
 $('introScreen').addEventListener('click',()=>{if(entered)return;entered=true;$('introScreen').hidden=true;apply(0);render();schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();E.pause(false);}else schedule();});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&s.expanded){s.expanded=false;render();schedule();}if(ev.target.matches('[role="tab"]')&&['ArrowLeft','ArrowRight'].includes(ev.key)){ev.preventDefault();switchPage(1-s.page);$('story-tab-'+s.page).focus();}});
 apply(0);
 render();Promise.all(Object.entries({atlas:'assets/biology/animal_digestive_atlas_ai_1012_v1.png',histology:'assets/biology/animal_intestine_openstax_v1.jpg',cell:'assets/biology/animal_cutaway_ai_v2.jpg'}).map(([id,src])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{images[id]=im;resolve();};im.onerror=()=>{$('assetStatus').hidden=false;$('assetStatus').textContent=tr('圖片載入失敗：','Image failed to load: ')+src;resolve();};im.src=src;})).concat(document.fonts?[document.fonts.load('700 22px "Noto Sans TC"'),document.fonts.load('700 22px "JetBrains Mono"')]:[])).then(draw).catch(err=>{$('assetStatus').hidden=false;$('assetStatus').textContent=tr('字體載入失敗：','Font loading failed: ')+err.message;});
 window.AnimalStory={state:s,images,render,draw,apply,advance,progress,resume,schedule,stop,jump,switchPage,SEQ,GROUPS};
})();

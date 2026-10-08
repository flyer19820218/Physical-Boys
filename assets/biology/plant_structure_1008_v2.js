(function(){
  'use strict';
  const M=globalThis.PlantStructureModel;
  const PATH='assets/biology/ch4_plant_structure_1008_v1/';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bi=(zh,en,tag='span',attrs='')=>`<${tag} ${attrs} data-zh="${escape(zh)}" data-en="${escape(en)}">${escape(zh)}</${tag}>`;
  const btn=(zh,en,action,value='',classes='action-btn')=>bi(zh,en,'button',`type="button" class="${classes}" data-action="${action}" data-value="${value}"`);
  const title=(zh,en)=>bi(zh,en,'h3');
  const note=(zh,en)=>bi(zh,en,'p','class="ps-note"');
  const p=(zh,en)=>bi(zh,en,'p');
  const state={lang:'zh',tab:0,expanded:null,raf:0,last:0,time:0,loaded:false,images:{},errors:[],labs:{
    network:{part:'leaf',focus:'xylem',sink:'root',playing:false,zoom:1,dx:0,dy:0},
    positions:{part:'leaf',focus:'none',playing:false,zoom:1,dx:0,dy:0},
    microscopy:{kind:'sunflower',detail:'whole',focus:'none',playing:false,zoom:1,dx:0,dy:0,answer:null},
    growth:{detail:'model',focus:'none',phase:0,targetPhase:0,playing:false,selectedYear:0,zoom:1,dx:0,dy:0},
    cases:{kind:'normal',stage:0,playing:false,elapsed:0,prediction:null,hollowProgress:1,hollowStarted:false,zoom:1,dx:0,dy:0}
  }};
  const keys=Object.keys(state.labs);
  const pages=[
    {key:'network',main:['搭不同的管','Different pipelines'],sub:['木質部與韌皮部','Xylem and phloem'],heading:['水與養分，搭不同的管','Water and sugars use different pipelines'],hook:['同一株植物裡，水和糖一定搭同一條路嗎？先點木質部，再點韌皮部，看看它們各送什麼。','Must water and sugars travel along the same route? Select xylem and then phloem to follow their cargo.'],lead:['根、莖、葉之間有相連的維管束。木質部送水與礦物質；韌皮部送光合作用製造的養分。','Vascular bundles connect roots, stems and leaves. Xylem carries water and minerals; phloem carries sugars made by photosynthesis.'],closure:['維管束不是一根萬用管：木質部與韌皮部的運輸物質不同。','A vascular bundle is not one all-purpose pipe: xylem and phloem carry different substances.']},
    {key:'positions',main:['上下？內外？','Upper or inner?'],sub:['葉與莖的剖面','Leaf and stem sections'],heading:['葉裡看上下，莖裡看內外','Upper/lower in a leaf; inner/outer in a stem'],hook:['把葉和莖切開，同樣的木質部、韌皮部，還會排在同一個方向嗎？點圖上的藍色或橘色試試。','Cut open a leaf and a stem: are xylem and phloem arranged in the same direction? Tap the blue or orange tissues.'],lead:['先確認剖面的方向，再找管道。不要把「木質部在裡面」直接套到所有葉片。','Establish the section’s orientation before locating the tissues. Do not apply “xylem is inside” to every leaf diagram.'],closure:['本圖葉片：木質部靠上、韌皮部靠下；莖的維管束：木質部靠內、韌皮部靠外。','In this leaf, xylem is upper and phloem lower; in the stem bundles, xylem is inner and phloem outer.']},
    {key:'microscopy',main:['一圈或散開','Ring or scattered'],sub:['真實莖切片','Real stem micrographs'],heading:['排成一圈，還是散開？','A ring of bundles — or scattered bundles?'],hook:['這兩張真實莖切片，哪張像排隊，哪張像散坐？放大單一維管束，還能認出木質部嗎？','Which real stem section looks like a ring, and which is scattered? Can you still locate xylem in a single bundle?'],lead:['向日葵的莖內維管束呈環狀排列；玉米的維管束散布在莖內。先觀察全切片，再看單一維管束。','Sunflower stem bundles form a ring; maize bundles are scattered. Inspect the whole section before examining one bundle.'],closure:['排列方式看全切片；木質部、韌皮部和形成層的位置，要看單一維管束。','Use the whole section to judge arrangement; inspect one bundle to locate xylem, phloem and cambium.']},
    {key:'growth',main:['一年，長一圈？','A ring each year?'],sub:['形成層與年輪','Cambium and growth rings'],heading:['樹幹怎麼一年年變粗？','How does a trunk become thicker each year?'],hook:['數出十條深淺條紋，就代表這棵樹十歲嗎？先走完春夏、秋冬，再點一整組年輪。','Do ten individual light or dark stripes mean ten years? Complete both growth seasons, then select a whole ring pair.'],lead:['形成層能分裂：向內增生木質部，向外增生韌皮部。新的木質部逐年堆積，形成木材。','Cambium divides: new xylem is produced inward and new phloem outward. Accumulated xylem forms wood.'],closure:['一組淺色加深色才是一個年輪；形成層不是木質部，也不是韌皮部。','One light–dark pair is a growth ring; cambium is distinct from xylem and phloem.']},
    {key:'cases',main:['中空為何能活','A hollow tree lives?'],sub:['樹皮與運輸','Bark and transport'],heading:['中空能活，剝皮卻危險？','Why can a hollow tree live while girdling is dangerous?'],hook:['這棵楓樹有大樹洞，樹冠卻仍有葉。中心的老木，和外側運輸中的組織，工作一樣嗎？','This maple has a large hollow but a leafy crown. Does old central wood do the same work as the outer transport tissues?'],lead:['先預測根能不能持續收到養分，再播放後續。這是虛擬案例，不能拿真樹剝皮做實驗。','Predict whether roots keep receiving sugars, then observe the sequence. This is a virtual case: never strip bark from a living tree.'],closure:['中心中空不一定中斷運輸；環狀樹皮受損會破壞韌皮部，先影響根的養分供應，再可能影響吸水。','A hollow centre need not interrupt transport; girdling damages phloem, disrupting root sugar supply before water uptake may later fail.']}
  ];
  function controls(key){
    if(key==='network')return title('追蹤哪一種物質？','Which substance will you follow?')+`<div class="button-row">${btn('木質部：水','Xylem: water','focus','xylem')}${btn('韌皮部：蔗糖','Phloem: sucrose','focus','phloem')}</div><div class="ps-sugar-options" data-sugar-options hidden>`+bi('蔗糖可向上，也可向下','Sucrose can move up or down','span','class="control-label"')+`<div class="button-row">${btn('向上：送往嫩芽','Up: supply growing shoots','sink','shoot')}${btn('向下：送往根部','Down: supply roots','sink','root')}</div>`+note('按情境看莖內方向。不同篩管可分別向上或向下；不是同一條篩管同時對流。','Compare flow through the stem. Different sieve tubes can carry sap upward or downward; this is not opposing flow in one tube.')+`</div>`+bi('觀察位置','Location','span','class="control-label"')+`<div class="button-row">${btn('葉','Leaf','part','leaf')}${btn('莖','Stem','part','stem')}${btn('根','Root','part','root')}</div>`+btn('播放運輸','Play transport','play')+note('分子已特別放大供辨認，不代表真實比例。水用米老鼠形；蔗糖用相接的六角形與五角形，不畫化學鍵。','Symbols are deliberately enlarged, not to scale. Water uses a three-sphere shape; sucrose uses joined six- and five-sided rings without bond lines.');
    if(key==='positions')return title('先選剖面，再找構造','Choose a section, then locate tissues')+`<div class="button-row">${btn('葉片剖面','Leaf section','part','leaf')}${btn('莖的剖面','Stem section','part','stem')}</div><div class="button-row">${btn('找木質部','Locate xylem','focus','xylem')}${btn('找韌皮部','Locate phloem','focus','phloem')}${btn('隱藏定位框','Hide outlines','focus','none')}</div>`+p('也可以直接點圖上藍色或橘色的管道。','You can also tap the blue or orange tissues in the figure.')+note('定位框是另加的教學層，不改變課本原圖。','Focus outlines are separate teaching overlays; the original figure is unchanged.');
    if(key==='microscopy')return title('用真實影像找證據','Find evidence in real micrographs')+`<div class="button-row">${btn('向日葵','Sunflower','kind','sunflower')}${btn('玉米','Maize','kind','corn')}</div><div class="button-row">${btn('全切片','Whole section','detail','whole')}${btn('單一維管束','One bundle','detail','bundle')}</div><div class="button-row">${btn('木質部','Xylem','focus','xylem')}${btn('韌皮部','Phloem','focus','phloem')}${btn('形成層','Cambium','focus','cambium')}${btn('隱藏定位框','Hide outlines','focus','none')}</div>`+bi('先看圖：維管束怎麼排列？','Look first: how are the bundles arranged?','span','class="control-label"')+`<div class="button-row">${btn('環狀','Ring','answer','ring')}${btn('散生','Scattered','answer','scattered')}</div><div class="ps-feedback" data-feedback="microscopy" aria-live="polite"></div>`+note('全切片原書標示 40×；畫面縮放是數位顯示，不是改變光學倍率。染色顏色不能直接當作植物活體的原色。','The original whole-section figures are labelled 40×. Screen zoom is digital, not a change in optical magnification. Stained colours are not the colours of living tissue.');
    if(key==='growth')return title('讓形成層走過四季','Take cambium through the seasons')+`<div class="button-row">${btn('生長示意','Growth model','detail','model')}${btn('樹幹原圖','Trunk figure','detail','trunk')}${btn('真實木材細胞','Wood micrograph','detail','wood')}</div><div class="button-row">${btn('春夏／秋冬：下一季','Next growth season','season')}${btn('連續觀察','Play growth','play')}${btn('重新長一遍','Start again','growth-reset')}</div>`+`<div class="ps-feedback" data-feedback="growth" aria-live="polite"></div>`+bi('點構造／點一整組年輪','Select a tissue / tap one complete ring pair','span','class="control-label"')+`<div class="button-row">${btn('樹皮','Bark','focus','bark')}${btn('韌皮部','Phloem','focus','phloem')}${btn('形成層','Cambium','focus','cambium')}${btn('木質部','Xylem','focus','xylem')}</div>`+note('以季節明顯的木本植物為例；動畫壓縮時間，不代表真實生長速度，也不把照片中每一條紋直接算成年齡。','This model uses a woody plant with distinct seasons. Time is compressed; it is not a growth-rate measurement or an age estimate for the photographed tree.');
    return title('先預測，再看後續','Predict first, then observe')+`<div class="button-row">${btn('完整樹幹','Intact trunk','kind','normal')}${btn('中心中空','Hollow centre','kind','hollow')}${btn('環狀樹皮受損','Girdled bark','kind','girdled')}</div>`+bi('根能持續收到養分嗎？','Will roots keep receiving sugars?','span','class="control-label"')+`<div class="button-row">${btn('可以','Yes','predict','yes')}${btn('不可以','No','predict','no')}</div><div class="ps-feedback" data-feedback="cases" aria-live="polite"></div><div class="button-row">${btn('下一階段','Next stage','stage')}${btn('播放後續','Play sequence','play')}${btn('重看此案例','Restart case','case-reset')}</div><div class="ps-steps" data-steps></div>`+note('只改一個構造條件。環剝的影響有時間延遲；水分符號停止只表示後期根功能受損的情境，不是傷口立刻堵住木質部。','Only the structural condition changes. Girdling has a delayed effect; stopped water symbols represent later root impairment, not instant blockage of xylem at the wound.');
  }
  function extra(key){
    if(key==='network')return `<div class="ps-summary-grid"><article>${title('木質部：水與礦物質','Xylem: water and minerals')}${p('根吸收的水與礦物質，經木質部運送到莖、葉等處。本頁先看上行路線；水怎麼上行，下一小單元再驗證。','Water and minerals absorbed by roots travel through xylem to stems and leaves. This page follows upward transport; the next unit explores how it happens.')}</article><article>${title('韌皮部：有機養分','Phloem: organic nutrients')}${p('葉片光合作用製造的養分，可轉成蔗糖運往根、果實、嫩芽等需求部位。不是永遠向下：路線取決於供應與需求。','Sugars made in leaves can be transported as sucrose to roots, fruits and growing shoots. Transport is not always downward: the route depends on sources and sinks.')}</article></div>`;
    if(key==='positions')return `<div class="ps-summary-grid"><article>${title('先找方向，才背位置','Orient the section first')}${p('本圖葉片木質部靠近上表皮，韌皮部靠近下表皮；莖的維管束木質部靠近中心，韌皮部靠近外側。','In this leaf, xylem is nearer the upper epidermis and phloem nearer the lower. In the stem bundles, xylem is nearer the centre and phloem nearer the outside.')}</article><article>${title('一束裡，不只一種管道','A bundle includes different tissues')}${p('木質部和韌皮部合成維管束。部分植物在兩者之間有形成層，下一頁用真實切片找它。','Xylem and phloem make up a vascular bundle. Some plants have cambium between them; find it in the real sections on the next page.')}</article></div>`;
    if(key==='microscopy')return `<div class="ps-summary-grid"><article>${title('向日葵：環狀＋形成層','Sunflower: ring arrangement and cambium')}${p('各個維管束沿外圍排成一圈。木質部與韌皮部之間有形成層；具有形成層，不等於這株草本植物一定會長成大樹。','Separate bundles form a ring. Cambium lies between xylem and phloem; having cambium does not mean this herbaceous plant becomes a large tree.')}</article><article>${title('玉米：散生，通常無形成層','Maize: scattered bundles, normally no cambium')}${p('維管束散布在莖內；每束的木質部仍偏內側、韌皮部偏外側。此玉米維管束沒有向日葵那樣的形成層。','Bundles are scattered across the stem, with xylem toward the inner side and phloem toward the outer. These maize bundles lack the cambium seen in sunflower.')}</article></div>`;
    if(key==='growth')return `<div class="ps-summary-grid"><article>${title('春夏：細胞較大、木材較淺','Spring/summer: larger cells, lighter wood')}${p('在課本的季節情境中，溫暖、雨水較多時生長較快，形成較大的木質部細胞，木材顏色較淺。','In the textbook’s seasonal example, warm, wetter conditions support faster growth and larger xylem cells, producing lighter wood.')}</article><article>${title('秋冬：細胞較小、木材較深','Autumn/winter: smaller cells, darker wood')}${p('較冷、較乾時生長較慢，形成較小的木質部細胞，木材顏色較深。深淺相間的一組代表一個生長年。','Cooler, drier conditions support slower growth and smaller xylem cells, producing darker wood. One light–dark pair represents a growth year.')}</article></div><details class="ps-reading">${bi('進一步想：年輪一定都很明顯嗎？','Think further: are growth rings always distinct?','summary')}${p('季節變化不明顯的地方，有些木本植物的年輪不明顯。年輪寬度也受多種條件影響，不能只憑一圈就下精確的氣候結論。','Some woody plants in weakly seasonal environments have indistinct rings. Ring width is influenced by several conditions, so one ring alone is not a precise climate measurement.')}</details>`;
    return `<div class="ps-summary-grid"><article>${title('中空：要看外側管道是否完整','Hollow: are outer transport tissues intact?')}${p('中心較老的木質部可能已不負責運輸。外側仍有能運輸的木質部與韌皮部，樹木就可能繼續生長；但中空會降低支撐與安全性。','Older central xylem may no longer conduct. A tree can keep growing if its outer conducting xylem and phloem remain intact; a hollow can still weaken structural support.')}</article><article>${title('環狀受損：先斷根的養分供應','Girdling: root sugar supply fails first')}${p('樹皮包含韌皮部。環狀破壞韌皮部，使養分不能通過傷口送往根；根長期缺養分後可能受損，進而影響吸水，最後使枝葉枯萎。','Bark includes phloem. Girdling prevents sugars crossing the wound to roots. Prolonged sugar shortage can impair roots and water uptake, eventually causing shoots to wilt.')}</article></div><details class="ps-reading">${bi('樹木醫生的問題：中空的樹，需要照顧哪裡？','Tree-care question: what needs protection in a hollow tree?','summary')}${p('回到剖面圖，指出仍負責運輸的外側組織，再想想樹洞、樹皮傷口和支撐強度各代表什麼問題。真實樹木的照護與安全評估由專業人員進行。','Return to the cutaway and locate the conducting outer tissues. Consider the different issues raised by a hollow, bark injury and structural strength. Real tree care and safety assessment require qualified professionals.')}</details>`;
  }
  function mount(){
    document.getElementById('lessonTabs').innerHTML=pages.map((page,i)=>`<button type="button" class="tab-btn${i===0?' active':''}" data-tab="${i}" aria-pressed="${i===0}">${bi(...page.main,'span','class="tab-main"')}${bi(...page.sub,'span','class="tab-sub"')}</button>`).join('');
    document.getElementById('lessons').innerHTML=pages.map((page,i)=>`<section class="lesson" data-page="${i}"${i?' hidden':''}>${bi(...page.heading,'h2')}<div class="hook-box"><div class="xiaozhen-logo"><img src="assets/characters/xiaozhen/teaching.png" alt="曉臻老師" data-alt-zh="曉臻老師" data-alt-en="Teacher Xiaozhen"></div><div class="hook-content">${bi('曉臻老師說：','Teacher Xiaozhen asks:','div','class="hook-title"')}${bi(...page.hook,'div','class="hook-text"')}</div></div>${bi(...page.lead,'p','class="lead"')}<div class="ps-lab" id="lab-${page.key}" data-lab="${page.key}" style="--ar:1.5"><aside class="ps-controls">${btn('⛶ 全螢幕講解／操作','⛶ Full-screen exploration','expand','', 'full-btn')}${controls(page.key)}<div class="button-row">${btn('還原畫面','Reset view','reset-view')}</div>${note('單指拖曳、雙指縮放；點圖上的構造或左側名稱看解說。','Drag with one finger; pinch with two. Tap a structure or its name for an explanation.')}</aside><div class="ps-stage"><div class="ps-canvas-wrap"><canvas width="960" height="640" class="ps-canvas" tabindex="0" aria-label="${escape(page.heading[0])}" data-label-zh="${escape(page.heading[0])}" data-label-en="${escape(page.heading[1])}"></canvas></div><div class="ps-caption" aria-live="polite"><h3 data-caption-title></h3><p data-caption-text></p></div><div class="ps-credit" data-credit></div></div></div>${extra(page.key)}<div class="ps-closure">${bi('記住這一句：','Remember:','b')} ${bi(...page.closure)}</div></section>`).join('');
    document.getElementById('sourceList').innerHTML=Object.entries(M.sources).map(([key,s])=>`<div class="source-item"><a href="${PATH+s[0]}" target="_blank" rel="noopener"><img src="${PATH+s[0]}" alt="${escape(s[3])}" loading="lazy"></a><div>${bi(s[3],s[4],'strong')}${bi(`課本第 ${s[1]} 頁 · 圖 ${s[2]}`,`Textbook p. ${s[1]} · Fig. ${s[2]}`,'div')}<a href="${PATH+s[0]}" target="_blank" rel="noopener">${bi('開啟原圖','Open original image')}</a></div></div>`).join('');
    document.getElementById('sourceList').querySelectorAll('img').forEach((im,i)=>{const s=Object.values(M.sources)[i];im.dataset.altZh=s[3];im.dataset.altEn=s[4];});
    document.querySelectorAll('[data-tab]').forEach(e=>e.addEventListener('click',()=>switchTab(+e.dataset.tab)));
    document.querySelectorAll('[data-lang]').forEach(e=>e.addEventListener('click',()=>setLang(e.dataset.lang)));
    document.getElementById('introScreen').addEventListener('click',()=>{document.getElementById('introScreen').hidden=true;});
    document.querySelectorAll('[data-lab]').forEach(lab=>{
      const key=lab.dataset.lab,canvas=lab.querySelector('canvas');
      lab.querySelectorAll('[data-action]').forEach(e=>e.addEventListener('click',()=>act(key,e.dataset.action,e.dataset.value,e)));
      attachTouch(key,canvas);
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')exitExpanded();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){stopLoop();for(const key of keys)state.labs[key].playing=false;for(const view of pointers.values())view.clear();}else update();});
    applyLang();update();
  }
  const say=(zh,en)=>state.lang==='en'?en:zh;
  function applyLang(){
    document.documentElement.lang=state.lang==='en'?'en':'zh-Hant';
    document.title=say('植物的運輸構造｜自然科學','Plant transport structures | Science');
    document.querySelectorAll('[data-zh][data-en]').forEach(e=>e.textContent=e.dataset[state.lang]);
    document.querySelectorAll('[data-alt-zh]').forEach(e=>e.alt=state.lang==='en'?e.dataset.altEn:e.dataset.altZh);
    document.querySelectorAll('[data-label-zh]').forEach(e=>e.setAttribute('aria-label',state.lang==='en'?e.dataset.labelEn:e.dataset.labelZh));
    document.querySelectorAll('[data-lang]').forEach(e=>{e.classList.toggle('active',e.dataset.lang===state.lang);e.setAttribute('aria-pressed',String(e.dataset.lang===state.lang));});
    document.getElementById('introScreen').setAttribute('aria-label',say('進入植物的運輸構造','Enter plant transport structures'));
    document.getElementById('lessonTabs').setAttribute('aria-label',say('主分頁','Main sections'));
    document.querySelector('.floating-lang-container').setAttribute('aria-label',say('語言切換','Language'));
  }
  function setLang(lang){if(!['zh','en'].includes(lang))return;state.lang=lang;applyLang();update();}
  function switchTab(i){if(!pages[i])return;stopLoop();state.labs[keys[state.tab]].playing=false;exitExpanded();state.tab=i;state.last=0;document.querySelectorAll('[data-page]').forEach(e=>e.hidden=+e.dataset.page!==i);document.querySelectorAll('[data-tab]').forEach(e=>{e.classList.toggle('active',+e.dataset.tab===i);e.setAttribute('aria-pressed',String(+e.dataset.tab===i));});update();}
  let returnFocus=null;
  function exitExpanded(){if(state.expanded){document.getElementById('lab-'+state.expanded).classList.remove('is-expanded');state.expanded=null;document.body.classList.remove('ps-fullscreen-open');if(returnFocus)returnFocus.focus();returnFocus=null;update();}}
  function expand(key,button){if(state.expanded===key){exitExpanded();return;}exitExpanded();state.expanded=key;returnFocus=button;document.getElementById('lab-'+key).classList.add('is-expanded');document.body.classList.add('ps-fullscreen-open');update();}
  function act(key,action,value,button){const s=state.labs[key];
    if(action==='expand'){expand(key,button);return;}
    if(action==='reset-view'){s.zoom=1;s.dx=0;s.dy=0;}
    if(action==='focus'){
      s.focus=value;
      if(key==='microscopy')s.detail='bundle';
      if(key==='growth'){s.detail='trunk';s.playing=false;}
    }
    if(action==='part'){s.part=value;s.focus=key==='positions'?'none':s.focus;s.zoom=1;s.dx=0;s.dy=0;}
    if(action==='sink'&&key==='network'){s.sink=value;s.focus='phloem';s.part='stem';s.zoom=1;s.dx=0;s.dy=0;s.playing=true;state.time=0;state.last=0;}
    if(action==='kind'){s.kind=value;s.focus='none';s.zoom=1;s.dx=0;s.dy=0;if(key==='microscopy')s.answer=null;if(key==='cases'){s.stage=0;s.elapsed=0;s.prediction=null;s.playing=false;s.hollowProgress=1;s.hollowStarted=false;}}
    if(action==='detail'){s.detail=value;s.focus='none';s.zoom=1;s.dx=0;s.dy=0;if(key==='growth')s.playing=false;}
    if(action==='play'){
      if(key==='growth'){s.detail='model';if(s.phase>=10){s.phase=0;s.targetPhase=0;}s.targetPhase=10;}
      if(key==='network'&&s.part==='root')s.part='stem';
      if(key==='cases'&&s.kind==='hollow'&&!s.playing&&(!s.hollowStarted||s.stage>=2)){s.hollowProgress=0;s.hollowStarted=true;s.stage=0;s.elapsed=0;}
      s.playing=!s.playing;
      if(key==='cases'&&s.stage>=2){s.stage=0;s.elapsed=0;}
    }
    if(action==='season'){s.detail='model';s.targetPhase=Math.min(10,Math.floor(Math.max(s.phase,s.targetPhase))+1);s.playing=true;}
    if(action==='growth-reset'){s.phase=0;s.targetPhase=0;s.playing=false;s.selectedYear=0;s.detail='model';}
    if(action==='stage'){s.stage=Math.min(2,s.stage+1);s.elapsed=0;}
    if(action==='case-reset'){s.stage=0;s.elapsed=0;s.playing=false;s.prediction=null;s.hollowProgress=1;s.hollowStarted=false;}
    if(action==='answer')s.answer=value;
    if(action==='predict')s.prediction=value;
    update();ensureLoop();
  }
  function caption(key){const s=state.labs[key];
    if(key==='network'){
      if(s.part==='root')return [say('根和莖的維管束相連','Connected root and stem bundles'),say('水與礦物質從根進入植物的運輸路線；養分可送到根部供生長或儲存。按播放時切到莖的放大窗，看各自管道。','Roots connect to the transport network. Water and minerals enter here; sugars can arrive for growth or storage. Playing switches to the enlarged stem window.')];
      if(s.focus==='phloem')return s.part==='leaf'?[say('韌皮部：可向上，也可向下運輸蔗糖','Phloem carries sucrose upward or downward'),say('這片成熟葉先把蔗糖送出葉片。再按左側「向上／向下」，看莖內如何分別送往嫩芽或根部。','This mature leaf exports sucrose. Select an upward or downward case to follow stem transport toward growing shoots or roots.')]:[say(s.sink==='shoot'?'韌皮部向上：供應嫩芽':'韌皮部向下：供應根部',s.sink==='shoot'?'Upward phloem flow: supply shoots':'Downward phloem flow: supply roots'),say('蔗糖從供應部位送到需要或儲存養分的部位，方向可向上、也可向下。切換情境比較，不是同一條篩管同時雙向流。','Sucrose moves from a source to a site of use or storage. Flow can be upward or downward; switch cases to compare, not opposing flows in one sieve tube.')];
      return [say('木質部：運輸水與礦物質','Xylem carries water and minerals'),say('觀察放大的水分子沿藍色木質部前進。礦物質可溶在水中一起運送；不是把土壤整粒搬到葉子。','Follow enlarged water symbols along the blue xylem. Dissolved minerals can travel with water; whole soil particles are not carried to leaves.')];
    }
    if(key==='positions')return [say(s.focus==='none'?'先辨認剖面的方向':s.focus==='xylem'?'你選到木質部':'你選到韌皮部',s.focus==='none'?'Orient the section first':s.focus==='xylem'?'You selected xylem':'You selected phloem'),say(s.part==='leaf'?'這片葉的木質部靠上側，韌皮部靠下側。點圖上的管道，對照它們和上下表皮的關係。':'這段莖的木質部靠近莖中心，韌皮部偏外側。放大圖是同一條莖中的維管束，不是另一株植物。',s.part==='leaf'?'Xylem is on the upper side of this leaf and phloem on the lower. Tap the tissues and compare their positions with the leaf surfaces.':'Xylem lies nearer the stem centre and phloem nearer the outside. The enlarged bundle belongs to this stem, not a different plant.')];
    if(key==='microscopy'){
      if(s.focus==='cambium'&&s.kind==='corn')return [say('玉米這裡沒有形成層','No cambium in this maize bundle'),say('不要硬在木質部和韌皮部間找一條形成層。此玉米維管束沒有向日葵那樣的形成層。','Do not invent a cambium strip between xylem and phloem. This maize bundle lacks the cambium shown in sunflower.')];
      const labels={xylem:['木質部：找較大的管腔','Xylem: look for larger vessel spaces'],phloem:['韌皮部：在木質部外側','Phloem: outside the xylem'],cambium:['形成層：在兩者之間','Cambium: between the two tissues'],none:['先看排列，再看每一束','Arrangement first, then individual bundles']};
      return [say(...labels[s.focus]),say(s.detail==='whole'?(s.kind==='sunflower'?'一束一束的維管束排成環狀。點「單一維管束」，再找其中較大的木質部管腔。':'莖中央也散布維管束，不是只有外圍一圈。點「單一維管束」，再找木質部。'):s.focus==='xylem'?'較大的空腔是切開的木質部導管。影像的染色顏色不等於輸送物質的顏色。':s.focus==='phloem'?'韌皮部位於木質部外側。在這張還原成課本方向的照片裡，外側朝上方。':s.focus==='cambium'?'定位框標出木質部與韌皮部之間的薄層；此處可進行細胞分裂。':'直接點管腔或外側組織，也可用左側名稱顯示定位框。',s.detail==='whole'?(s.kind==='sunflower'?'Separate bundles form a ring. Select “One bundle” to locate the larger xylem vessel spaces.':'Bundles also occur toward the centre, not only on an outer ring. Select “One bundle” to locate xylem.'):s.focus==='xylem'?'Larger spaces are cross-sections of xylem vessels. Stain colours do not represent transported substances.':s.focus==='phloem'?'Phloem is outside xylem. In this page-oriented image, the outer side faces upward.':s.focus==='cambium'?'The outline marks the thin layer between xylem and phloem where cell division occurs.':'Tap the vessel spaces or outer tissue, or use the tissue buttons to show an outline.')];
    }
    if(key==='growth'){
      const labels={bark:['樹皮：外側的保護與運輸區','Bark: outer protection and transport'],phloem:['韌皮部：運送有機養分','Phloem: transports organic nutrients'],cambium:['形成層：向內木質部、向外韌皮部','Cambium: xylem inward, phloem outward'],xylem:['木質部：逐年堆積成木材','Xylem accumulates as wood']};
      if(s.detail==='trunk'&&labels[s.focus])return [say(...labels[s.focus]),say('虛線框只定位原圖部位；請看它與相鄰層的位置，再對照生長示意。樹皮包括韌皮部及其外側構造。','The dashed outline locates a tissue on the original figure. Compare adjacent layers, then return to the growth model. Bark includes phloem and the structures outside it.')];
      if(s.detail==='wood')return [say('放大看真實木材細胞','Inspect real wood cells'),say('左側是木材，右側靠近樹皮。木質部細胞大小與排列隨季節不同；用原圖觀察，不把每一道細胞壁算一年。','Wood is on the left and bark toward the right. Cell size and arrangement vary by growth season; individual cell walls are not annual rings.')];
      if(s.selectedYear)return [say(`你選到示意中的第 ${s.selectedYear} 年`, `You selected model year ${s.selectedYear}`),say('青色框圈出同一年形成的一組淺色和深色木材。要完成兩個生長季，才算一整組。','The cyan outlines enclose one light–dark wood pair formed in the same year. Both growth seasons are needed to complete the pair.')];
      return [say('從形成層向內，累積新木質部','New xylem accumulates inward from cambium'),say('按「下一季」：先出現較淺的木材，再出現較深的木材。這個橫切面放大了層的厚度；向外增生的韌皮部也存在，不拿它當年輪計數。','Choose “Next growth season”: lighter wood appears, followed by darker wood. Layer thickness is exaggerated in this section. New phloem also forms outward; it is not counted as a wood growth ring.')];
    }
    const out=M.caseOutcome(s.kind,s.stage);
    if(s.kind==='normal')return [say('完整管道，水與養分各走自己的路','Intact pathways carry water and sugars'),say('木質部上行送水；韌皮部把供應部位的養分送給根。只用這個供應情境示範，不表示所有養分都只能向下。','Xylem carries water upward; phloem supplies roots from a sugar source. This selected case does not mean sugars always travel downward.')];
    if(s.kind==='hollow')return [say('中央中空，外側運輸不停','Outer transport continues as the centre hollows'),say('按播放，中央老化木質部逐漸變成空洞；水仍沿外側木質部上行，蔗糖仍沿更外側的韌皮部送根。木材就是木質部，不是只有中央叫木質部；中空仍有支撐風險。','Play to hollow the old central xylem. Water still rises in the outer conducting xylem; sucrose still moves to roots in phloem farther outside. Wood is xylem, not only its centre. A hollow can still weaken support.')];
    return [say(s.stage===0?'第一階段：韌皮部中斷':s.stage===1?'第二階段：根長期缺養分':'後期情境：根受損，吸水受影響',s.stage===0?'Stage 1: phloem is interrupted':s.stage===1?'Stage 2: prolonged root sugar shortage':'Later: root impairment affects water uptake'),say(out.waterFlow?'蔗糖到傷口上方就無法再往根部通過。內側木質部最初仍能送水；根的功能不會在受傷一瞬間全部消失。':'根長期缺乏養分可能受損，吸水與上行供水進而受影響，枝葉可能枯萎。動畫以階段壓縮時間，不是精確死亡倒數。',out.waterFlow?'Sucrose cannot cross the wound toward the roots. Inner xylem can initially still carry water; root function does not disappear instantly.':'Prolonged sugar shortage can impair roots, reducing uptake and upward water supply. Shoots may wilt. Stages compress time; this is not a measured countdown.')];
  }
  function credit(key){let names=key==='network'||key==='positions'?['atlas']:key==='microscopy'?[state.labs[key].kind,state.labs[key].kind+'Bundle']:key==='growth'?[state.labs[key].detail==='wood'?'wood':state.labs[key].detail==='trunk'?'trunk':'rings']:[state.labs[key].kind==='hollow'?'hollow':'trunk'];return names.map(n=>{const s=M.sources[n];return `${say(s[3],s[4])} · ${say('課本第','p.')} ${s[1]} · ${say('圖','Fig.')} ${s[2]} <a href="${PATH+s[0]}" target="_blank" rel="noopener">${say('原圖','Original')}</a>`;}).join('<br>')+`<br>${say('課本圖像：老師回報已獲康軒同意；動態符號／年輪生長／虛擬案例為另加教學示意，非實拍影片。','Textbook images: permission reported by the teacher. Moving symbols, seasonal growth and virtual cases are separate teaching models, not filmed processes.')}`;}
  function update(){for(const key of keys){const s=state.labs[key],lab=document.getElementById('lab-'+key);if(!lab)continue;
      lab.querySelectorAll('[data-action]').forEach(e=>{
        const a=e.dataset.action,v=e.dataset.value;let active=['part','kind','detail','focus','sink'].includes(a)&&s[a]===v;
        if(a==='predict')active=s.prediction===v;if(a==='answer')active=s.answer===v;
        e.classList.toggle('active',active);e.setAttribute('aria-pressed',String(active));
        if(a==='expand')e.textContent=state.expanded===key?say('✕ 返回教材','✕ Return to lesson'):say('⛶ 全螢幕講解／操作','⛶ Full-screen exploration');
        if(a==='play')e.textContent=s.playing?say('暫停動畫','Pause animation'):say(key==='growth'?'連續觀察':key==='cases'?(s.kind==='hollow'?'播放：中心逐漸中空':'播放後續'):'播放運輸',key==='growth'?'Play growth':key==='cases'?(s.kind==='hollow'?'Play: hollow the centre':'Play sequence'):'Play transport');
        if(a==='season')e.disabled=s.targetPhase>=10;
        if(a==='stage')e.disabled=s.stage>=2;
      });
      if(key==='network')lab.querySelector('[data-sugar-options]').hidden=s.focus!=='phloem';
      const [heading,copy]=caption(key);lab.querySelector('[data-caption-title]').textContent=heading;lab.querySelector('[data-caption-text]').textContent=copy;lab.querySelector('[data-credit]').innerHTML=credit(key);
      if(key==='microscopy'){const feedback=lab.querySelector('[data-feedback]');feedback.textContent=s.answer===null?'':s.answer===(s.kind==='sunflower'?'ring':'scattered')?say('觀察正確。再點「單一維管束」，找木質部與韌皮部。','Correct observation. Now inspect one bundle to locate xylem and phloem.'):say('再看一次：判斷整張切片中的維管束位置，不是看一個管腔是否圓形。','Look again at bundle positions across the whole section, not the round shape of one vessel.');}
      if(key==='growth'){lab.querySelector('[data-feedback]').textContent=say(`完成 ${Math.floor(s.phase/2)} 年；${s.phase%2<1?'春夏的淺色木材':'秋冬的深色木材'}。`,`Complete years: ${Math.floor(s.phase/2)}. ${s.phase%2<1?'Lighter spring/summer wood':'Darker autumn/winter wood'}.`);}
      if(key==='cases'){
        lab.querySelector('[data-feedback]').textContent=s.prediction===null?'':s.prediction===(s.kind==='girdled'?'no':'yes')?say('預測符合此案例。按下一階段，看原因與時間先後。','Your prediction matches this case. Advance to observe cause and sequence.'):say('先對照外側韌皮部是否仍連續；不是只看樹幹有沒有洞。','Check whether outer phloem remains connected, not merely whether there is a hollow.');
        lab.querySelector('[data-steps]').innerHTML=[say('構造改變','Structure'),say('養分供應','Sugar supply'),say('後續影響','Later effects')].map((label,i)=>`<span class="${i===s.stage?'current':''}">${label}</span>`).join('');
      }
    }drawCurrent();}
  const hitAreas=new Map(),pointers=new Map(),touchStart=new Map();
  function drawCurrent(){const key=keys[state.tab],s=state.labs[key],canvas=document.getElementById('lab-'+key)?.querySelector('canvas');if(!canvas)return;const ctx=canvas.getContext('2d');
    if(!state.loaded){ctx.clearRect(0,0,960,640);ctx.fillStyle='#f7f5eb';ctx.fillRect(0,0,960,640);ctx.fillStyle='#183c31';ctx.font='700 26px "Noto Sans TC"';ctx.fillText(say(state.errors.length?'圖像載入失敗，請檢查素材路徑。':'課本原圖載入中…',state.errors.length?'Image load failed. Please check the asset paths.':'Loading textbook figures…'),28,60);return;}
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,960,640);ctx.translate(480+s.dx,320+s.dy);ctx.scale(s.zoom,s.zoom);ctx.translate(-480,-320);hitAreas.set(key,M.draw(ctx,state.images,key,s,state.lang,state.time));ctx.restore();
  }
  function stopLoop(){if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;state.last=0;}
  function ensureLoop(){if(state.raf||document.hidden||!state.loaded||!state.labs[keys[state.tab]].playing)return;state.raf=requestAnimationFrame(tick);}
  function tick(now){state.raf=0;if(document.hidden)return;const s=state.labs[keys[state.tab]];if(!s.playing)return;const dt=state.last?Math.min(.1,(now-state.last)/1000):0;state.last=now;state.time+=dt;
    if(keys[state.tab]==='growth'){s.phase=Math.min(s.targetPhase,s.phase+dt*.65);if(s.phase>=s.targetPhase)s.playing=false;update();}
    else if(keys[state.tab]==='cases'){s.elapsed+=dt;if(s.kind==='hollow')s.hollowProgress=Math.min(1,s.hollowProgress+dt/3);if(s.elapsed>=5&&s.stage<2){s.stage++;s.elapsed=0;update();}if(s.stage===2&&s.elapsed>=5){s.playing=false;update();}drawCurrent();}
    else drawCurrent();
    ensureLoop();
  }
  function tap(key,x,y){const s=state.labs[key],u=(x-480-s.dx)/s.zoom+480,v=(y-320-s.dy)/s.zoom+320;
    const area=(hitAreas.get(key)||[]).find(p=>p.key==='year'?Math.hypot(u-p.cx,v-p.cy)>=p.inner&&Math.hypot(u-p.cx,v-p.cy)<=p.outer:((u-p.x)/p.rx)**2+((v-p.y)/p.ry)**2<=1.4);
    if(area){if(area.key==='year'){s.selectedYear=area.year;s.playing=false;}else s.focus=area.key;update();}
    else if(key==='microscopy'&&s.detail==='whole'){s.detail='bundle';update();}
  }
  function attachTouch(key,canvas){const ps=new Map();pointers.set(key,ps);const coords=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*960/r.width,y:(e.clientY-r.top)*640/r.height};};let gesture=null;
    const snapshot=()=>{const list=[...ps.values()],s=state.labs[key];gesture=list.length>=2?{a:list[0],b:list[1],distance:Math.hypot(list[1].x-list[0].x,list[1].y-list[0].y),zoom:s.zoom,dx:s.dx,dy:s.dy}:list.length?{a:list[0],dx:s.dx,dy:s.dy}:null;};
    canvas.addEventListener('pointerdown',e=>{e.preventDefault();const c=coords(e);ps.set(e.pointerId,c);touchStart.set(key,{...c,moved:false,pinch:ps.size>1});canvas.setPointerCapture(e.pointerId);snapshot();});
    canvas.addEventListener('pointermove',e=>{if(!ps.has(e.pointerId))return;e.preventDefault();const c=coords(e);ps.set(e.pointerId,c);const s=state.labs[key],start=touchStart.get(key);if(start&&Math.hypot(c.x-start.x,c.y-start.y)>8)start.moved=true;const list=[...ps.values()];
      if(list.length>=2&&gesture?.distance){if(start)start.pinch=true;const mid={x:(list[0].x+list[1].x)/2,y:(list[0].y+list[1].y)/2},oldMid={x:(gesture.a.x+gesture.b.x)/2,y:(gesture.a.y+gesture.b.y)/2};s.zoom=Math.max(1,Math.min(4,gesture.zoom*Math.hypot(list[1].x-list[0].x,list[1].y-list[0].y)/gesture.distance));const factor=s.zoom/gesture.zoom;s.dx=mid.x-480-(oldMid.x-480-gesture.dx)*factor;s.dy=mid.y-320-(oldMid.y-320-gesture.dy)*factor;}
      else if(gesture){s.dx=gesture.dx+c.x-gesture.a.x;s.dy=gesture.dy+c.y-gesture.a.y;}
      s.dx=Math.max(-480*s.zoom,Math.min(480*s.zoom,s.dx));s.dy=Math.max(-320*s.zoom,Math.min(320*s.zoom,s.dy));drawCurrent();
    });
    const end=e=>{if(!ps.has(e.pointerId))return;const start=touchStart.get(key),c=coords(e);if(e.type==='pointerup'&&start&&!start.moved&&!start.pinch)tap(key,c.x,c.y);ps.delete(e.pointerId);snapshot();if(!ps.size)touchStart.delete(key);};
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
    canvas.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();const s=state.labs[key];s.zoom=Math.max(1,Math.min(4,s.zoom*(e.deltaY<0?1.1:.9)));drawCurrent();},{passive:false});
  }
  async function load(){await Promise.all(Object.entries(M.sources).map(([key,value])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{state.images[key]=im;resolve();};im.onerror=()=>{state.errors.push(value[0]);resolve();};im.src=PATH+value[0];})));state.loaded=!state.errors.length;update();ensureLoop();if(document.fonts){await document.fonts.ready;drawCurrent();}}
  globalThis.PlantStructure={state,setLang,switchTab,act,tap,drawCurrent,stopLoop,exitExpanded};
  mount();load();
})();

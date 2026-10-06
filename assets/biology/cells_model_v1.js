/* New third-unit UI and animation lifecycle. Existing microscope model is untouched. */
(()=>{
  'use strict';
  const D=globalThis.CellsDrawV1,$=id=>document.getElementById(id);
  let lang='zh',tab='cellShapes',shape='neuron',cellType='plant',part='nucleus',mount=D.mountInitial('onion');
  const obs={specimen:'onion',mag:100,lamp:80,focus:0,stain:true,streaming:false,time:0};
  let raf=0,last=0;
  const tr=(zh,en)=>lang==='en'?en:zh;
  const shapes=[
    ['neuron','神經細胞','Neuron','突起連接，傳遞訊息','Extensions connect and transmit signals','許多突起增加連接機會，長突起把訊息傳向遠方；圖示形狀不是每種神經細胞都相同。','Many extensions connect to other cells; long extensions transmit signals over distance. Neuron shapes vary.'],
    ['muscle','肌肉細胞','Muscle cell','細長形狀，收縮產生運動','Long cells contract to produce movement','肌肉細胞能收縮與舒張。動手拉動控制，觀察示意圖變短、變粗；不是細胞被擠壞。','Muscle cells contract and relax. Move the control to illustrate shortening and thickening, not damage.'],
    ['redblood','紅血球','Red blood cell','雙凹圓盤，運送氧氣','Biconcave disc carrying oxygen','人的成熟紅血球呈雙凹圓盤狀，有利氣體交換，並以血紅素運送氧氣；沒有細胞核。','Mature human red blood cells are biconcave, supporting gas exchange and oxygen transport by hemoglobin. They lack a nucleus.'],
    ['guard','保衛細胞','Guard cells','兩個半月形細胞，圍成氣孔','Two kidney-shaped cells surround a pore','圖示是兩個保衛細胞，中間開口是氣孔，不是第三個細胞；控制氣孔開閉，影響氣體交換與水分散失。','The diagram shows two guard cells; the opening is a stomatal pore, not a third cell. Opening and closing affects gas exchange and water loss.'],
    ['epidermis','表皮細胞','Epidermal cells','扁平相接，形成保護薄層','Flat cells form a protective layer','表皮細胞扁平相接，適合覆蓋與保護。圖示為植物表皮，不代表口腔細胞也有細胞壁。','Flat epidermal cells form a protective covering. This plant epidermis diagram does not imply cheek cells have walls.']
  ];
  const meta={
    nucleus:['細胞核','Nucleus','含遺傳物質，與細胞活動的調控有關。一般動植物細胞都有，但人的成熟紅血球是例外。','Contains genetic material and participates in regulating cell activities. Typical animal and plant cells have one; mature human red blood cells are an exception.'],
    membrane:['細胞膜','Cell membrane','包圍細胞，控制物質進出。植物的細胞膜在細胞壁內側，兩者不是同一層。','Surrounds the cell and regulates material exchange. In plants it lies inside the wall; the two are distinct.'],
    cytoplasm:['細胞質','Cytoplasm','細胞膜內、細胞核外的部分，包含胞器，是許多代謝反應進行的場所。','The region within the membrane but outside the nucleus, containing organelles and hosting many metabolic reactions.'],
    mitochondria:['粒線體','Mitochondrion','與細胞呼吸有關，將養分中的能量轉換成細胞能利用的形式；動植物細胞都有。','Involved in cellular respiration, converting energy in nutrients into forms cells can use. Present in animal and plant cells.'],
    vacuole:['液胞','Vacuole','可儲存水分與其他物質。成熟植物細胞常有大的中央液胞；本動物模型以較小液胞示意。','Stores water and other materials. Mature plant cells often have a large central vacuole; this animal model depicts smaller vacuoles.'],
    wall:['細胞壁','Cell wall','在細胞膜外側，提供支持與保護。植物細胞具有，動物細胞沒有。','Outside the membrane, providing support and protection. Plant cells have walls; animal cells do not.'],
    chloroplast:['葉綠體','Chloroplast','進行光合作用。常見於綠色葉片細胞，但不是每個植物細胞都有；本單元洋蔥鱗葉內表皮沒有。','Performs photosynthesis. Common in green leaf cells, not all plant cells; absent from the inner onion bulb epidermis studied here.']
  };
  const materials=[['onion','洋蔥鱗葉內表皮','Onion inner epidermis'],['cheek','口腔皮膜','Cheek epithelium'],['elodea','水蘊草葉片','Elodea leaf']];
  const steps=[['滴液','Add liquid'],['放置薄標本','Place a thin specimen'],['斜放蓋玻片','Lower coverslip at an angle'],['吸去多餘液體','Remove excess liquid'],['低倍開始觀察','Start at low power']];
  function button(zh,en,handler){const b=document.createElement('button');b.type='button';b.className='choice';b.dataset.zh=zh;b.dataset.en=en;b.textContent=tr(zh,en);b.addEventListener('click',handler);return b;}
  function active(container,value,get){$(container).querySelectorAll('button').forEach((b,i)=>{const on=get(i)===value;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});}
  function info(id,title,text){const el=$(id),h=document.createElement('h4'),p=document.createElement('p');h.textContent=title;p.textContent=text;el.replaceChildren(h,p);}
  function draw(which){
    if(which==='shape')D.drawShapes($('shapeCanvas').getContext('2d'),shape,+$('muscleAmount').value);
    if(which==='structure')D.drawStructure($('structureCanvas').getContext('2d'),cellType,part);
    if(which==='mount')D.drawMount($('mountCanvas').getContext('2d'),mount);
    if(which==='observe')D.drawObservation($('observeCanvas').getContext('2d'),obs);
  }
  function paintShape(){const s=shapes.find(p=>p[0]===shape);active('shapeChoices',shape,i=>shapes[i][0]);info('shapeInfo',tr(s[3],s[4]),tr(s[5],s[6]));$('muscleControl').hidden=shape!=='muscle';draw('shape');}
  function paintPart(){
    active('cellTypeChoices',cellType,i=>i?'animal':'plant');const keys=Object.keys(meta);
    $('partChoices').querySelectorAll('button').forEach((b,i)=>{b.disabled=!D.parts[keys[i]][cellType];b.classList.toggle('active',keys[i]===part);b.setAttribute('aria-pressed',String(keys[i]===part));});
    const m=meta[part];info('partInfo',tr(m[0],m[1]),tr(m[2],m[3]));draw('structure');
  }
  function paintMount(){
    active('mountChoices',mount.material,i=>materials[i][0]);
    $('mountMaterial').textContent=mount.material==='elodea'?tr('清水＋薄葉片；保留葉綠體原有綠色。','Water and a thin leaf; retain natural green chloroplasts.'):tr('依老師講義：先滴一滴亞甲藍，再放標本。','Follow the handout: methylene blue first, then the specimen.');
    const list=$('mountSteps');list.replaceChildren();steps.forEach((s,i)=>{const li=document.createElement('li');li.textContent=tr(...s);li.className=i<mount.step?'done':i===mount.step?'current':'';list.append(li);});
    const next=$('mountNext');next.disabled=mount.busy||mount.step>=5;
    next.textContent=mount.badCover?tr('重新斜放蓋玻片','Lower coverslip correctly'):mount.step>=5?tr('玻片完成','Slide complete'):tr(...steps[mount.step]);
    $('mountBadCover').disabled=mount.busy||mount.step!==2||mount.badCover;
    const msg=[
      ['乾淨載玻片準備好了。先滴一滴液體。','Clean slide ready. Add one drop first.'],
      [mount.material==='elodea'?'中央放一滴清水。取薄葉片。':'亞甲藍滴在中央。接著取少量薄標本。',mount.material==='elodea'?'A drop of water in the center. Select a thin leaf.':'Methylene blue in the center. Use a small, thin specimen.'],
      [mount.material==='onion'?'內表皮攤平，不要疊成多層。':'標本放入液滴，保持薄且分散。',mount.material==='onion'?'Spread the epidermis flat, not in multiple layers.':'Place the specimen in the drop, thin and dispersed.'],
      ['蓋玻片一邊先碰液滴，慢慢放下，減少包住空氣的機會。','Touch one coverslip edge to the drop and lower slowly to reduce trapped air.'],
      ['吸水紙從邊緣接觸多餘液體，不要把標本整個抽乾。','Touch excess liquid at the edge with absorbent paper. Do not dry the specimen out.'],
      ['完成！先用低倍找標本與調焦；下一頁比較三種細胞。','Done! Locate and focus at low power first; compare the three specimens on the next tab.']
    ];
    $('mountInfo').textContent=mount.badCover?tr('直接平放可能包住空氣；右側圓圈示意氣泡，不是細胞。按「重新斜放蓋玻片」比較。','Dropping flat can trap air. The circles represent bubbles, not cells. Lower the coverslip correctly to compare.'):tr(...msg[mount.step]);draw('mount');
  }
  function paintObservation(){
    active('observeChoices',obs.specimen,i=>materials[i][0]);const leaf=obs.specimen==='elodea';
    $('observeStain').disabled=leaf;$('observeStain').checked=obs.stain;$('observeStream').disabled=!leaf;$('observeStream').checked=obs.streaming;
    const m=materials.find(m=>m[0]===obs.specimen);
    const explanation=leaf?tr('先沿細胞壁找一個完整細胞，再數它內部的綠色葉綠體。胞質流動會帶著葉綠體沿周邊移動。','Locate a whole wall-bounded cell, then its green chloroplasts. Streaming cytoplasm carries chloroplasts around the periphery.'):obs.specimen==='onion'?tr('長方形細胞相接，核染色後較明顯；沒有葉綠體，仍然是植物細胞。','Rectangular cells join together. Staining improves nuclear contrast. These are plant cells without chloroplasts.'):tr('扁平、不規則細胞；染色使細胞核較清楚，外側沒有細胞壁。','Flat, irregular cells. Staining makes nuclei clearer; there is no cell wall.');
    info('observeInfo',tr(m[1],m[2]),explanation);
    $('observeReadout').textContent=tr('總倍率 ','Total power ')+obs.mag+'× · '+tr('相對視野直徑 ','Relative field diameter ')+(obs.mag===100?'100%':'25%');
    draw('observe');
  }
  function animated(){return !document.hidden&&((tab==='cellSlides'&&mount.busy)||(tab==='cellObserve'&&obs.specimen==='elodea'&&obs.streaming));}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
  function start(){if(!raf&&animated())raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;const dt=last?Math.min(.08,(now-last)/1000):0;last=now;
    if(tab==='cellSlides'&&mount.busy){mount.progress=Math.min(1,mount.progress+dt/.95);draw('mount');if(mount.progress===1){mount.busy=false;paintMount();}}
    if(tab==='cellObserve'&&obs.streaming){obs.time+=dt;draw('observe');}
    if(animated())raf=requestAnimationFrame(frame);else last=0;
  }
  shapes.forEach(s=>$('shapeChoices').append(button(s[1],s[2],()=>{shape=s[0];paintShape();})));
  $('muscleAmount').addEventListener('input',()=>draw('shape'));
  [['plant','植物細胞','Plant cell'],['animal','動物細胞','Animal cell']].forEach(s=>$('cellTypeChoices').append(button(s[1],s[2],()=>{cellType=s[0];if(!D.parts[part][cellType])part='nucleus';paintPart();})));
  Object.entries(meta).forEach(([key,m])=>{const b=button(m[0],m[1],()=>{part=key;paintPart();}),dot=document.createElement('span'),label=document.createElement('span');delete b.dataset.zh;delete b.dataset.en;dot.className='organelle-dot';dot.style.setProperty('--dot',D.parts[key].color);label.dataset.zh=m[0];label.dataset.en=m[1];label.textContent=tr(m[0],m[1]);b.replaceChildren(dot,label);$('partChoices').append(b);});
  $('structureCanvas').addEventListener('click',e=>{const c=$('structureCanvas'),r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;let nearest=null,dist=65;for(const [key,p] of Object.entries(D.parts)){const xy=p[cellType];if(xy){const d=Math.hypot(x-xy[0],y-xy[1]);if(d<dist){dist=d;nearest=key;}}}if(nearest){part=nearest;paintPart();}});
  materials.forEach(m=>{
    $('mountChoices').append(button(m[1],m[2],()=>{stop();mount=D.mountInitial(m[0]);paintMount();start();}));
    $('observeChoices').append(button(m[1],m[2],()=>{stop();obs.specimen=m[0];obs.streaming=false;obs.stain=m[0]!=='elodea';obs.time=0;paintObservation();start();}));
  });
  $('mountNext').addEventListener('click',()=>{mount=D.mountNext(mount);paintMount();start();});
  $('mountReset').addEventListener('click',()=>{stop();mount=D.mountInitial(mount.material);paintMount();start();});
  $('mountBadCover').addEventListener('click',()=>{if(mount.step===2&&!mount.busy){mount.badCover=true;paintMount();}});
  for(const [id,key] of [['observeMag','mag'],['observeLamp','lamp'],['observeFocus','focus']])$(id).addEventListener('input',()=>{obs[key]=+$(id).value;paintObservation();});
  $('observeStain').addEventListener('change',()=>{obs.stain=$('observeStain').checked;paintObservation();});
  $('observeStream').addEventListener('change',()=>{obs.streaming=$('observeStream').checked;stop();paintObservation();start();});
  $('observeReset').addEventListener('click',()=>{stop();Object.assign(obs,{mag:100,lamp:80,focus:0,stain:obs.specimen!=='elodea',streaming:false,time:0});$('observeMag').value='100';$('observeLamp').value='80';$('observeFocus').value='0';paintObservation();});
  document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',()=>{stop();if(mount.busy){mount.progress=1;mount.busy=false;paintMount();}tab=b.dataset.tab;document.querySelectorAll('.tab-btn').forEach(n=>{n.classList.toggle('active',n===b);n.setAttribute('aria-selected',String(n===b));});document.querySelectorAll('.lesson').forEach(n=>n.hidden=n.id!==tab);start();}));
  function setLang(next){lang=next;document.documentElement.lang=next==='en'?'en':'zh-Hant';document.title=tr('細胞與玻片製作｜Physical-Boys','Cells and Microscope Slides | Physical-Boys');document.querySelectorAll('[data-zh][data-en]').forEach(e=>e.textContent=e.dataset[next]);for(const id of ['langZh','langEn']){$(id).classList.toggle('active',id===(next==='zh'?'langZh':'langEn'));$(id).setAttribute('aria-pressed',String(id===(next==='zh'?'langZh':'langEn')));} $('introScreen').setAttribute('aria-label',tr('進入細胞與玻片製作','Enter Cells and Microscope Slides'));paintShape();paintPart();paintMount();paintObservation();}
  $('langZh').addEventListener('click',()=>setLang('zh'));$('langEn').addEventListener('click',()=>setLang('en'));
  $('introScreen').addEventListener('click',()=>{$('introScreen').hidden=true;document.body.style.overflow='';$('langZh').focus();});
  document.addEventListener('visibilitychange',()=>{stop();start();});window.addEventListener('pagehide',stop);window.addEventListener('pageshow',start);
  document.body.style.overflow='hidden';setLang('zh');
})();

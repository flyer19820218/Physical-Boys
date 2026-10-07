/* Original dimension models. Photos are separate, unchanged observation evidence. */
(function(root){
 'use strict';
 const P='assets/biology/photos/',C='https://commons.wikimedia.org/wiki/File:';
 const sources={
  virus:{file:'influenza_tem_scale_v2.jpg',author:'CDC / Dr. F. A. Murphy',title:'Influenza virions · PHIL 10072',license:'公共領域',enLicense:'Public domain',sourceUrl:'https://phil.cdc.gov/Details.aspx?pid=10072',url:'https://www.cdc.gov/other/agencymaterials.html',tag:'流感病毒：穿透式電子顯微照片，原來源已加色；不是自然顏色。',enTag:'Influenza virions: colorized TEM image; colors are not natural.'},
  whale:{file:'blue_whale_scale_v1.jpg',author:'NOAA Fisheries/Lisa Conger',title:'Blue-whale.jpg',license:'公共領域',enLicense:'Public domain',url:C+'Blue-whale.jpg',tag:'藍鯨：真實攝影。',enTag:'Blue whale: real photograph.'},
  ecoli:{file:'ecoli_sem_scale_v1.jpg',author:'CDC/Evangeline Sowers, Janice Carr',title:'Escherichia coli (SEM).jpg',license:'公共領域',enLicense:'Public domain',url:C+'Escherichia_coli_(SEM).jpg',tag:'掃描式電子顯微實拍，來源 12800×；原圖 2 μm 比例尺保留。灰階不是細菌自然顏色。',enTag:'SEM, source 12800×; the original 2 μm scale bar is preserved. Grayscale is not the bacterium’s natural color.'},
  paramecium:{file:'paramecium_org_v1.jpg',author:'MTadey',title:'Paramécium caudátum.jpg',license:'CC BY 4.0',enLicense:'CC BY 4.0',url:'https://creativecommons.org/licenses/by/4.0/',tag:'草履蟲：真實光學顯微照片。',enTag:'Paramecium: real light micrograph.'},
  elodea:{file:'elodea_clear_v2.jpg',author:'Juan Carlos Fonseca Mata',title:'Chloroplasts - Microscopic view of Elodea canadensis.jpg',license:'CC BY-SA 4.0',enLicense:'CC BY-SA 4.0',url:'https://creativecommons.org/licenses/by-sa/4.0/',tag:'水蘊草光學實拍：整格是細胞，綠色小顆粒是葉綠體。',enTag:'Elodea light micrograph: a whole compartment is a cell; the green granules are chloroplasts.'}
 };
 const sample=(zh,en,m,source,note,enNote)=>({zh,en,m,source,note,enNote});
 const samples=[
  sample('病毒','Virus',1e-7,'virus','直徑約 100 nm（尺寸例）。','Diameter ≈ 100 nm (size example).'),
  sample('黴漿菌','Mycoplasma',2e-7,null,'小型黴漿菌直徑約 0.2 μm。','Small mycoplasmas: diameter ≈ 0.2 μm.'),
  sample('大腸桿菌','E. coli',2e-6,'ecoli','長約 2 μm。','Length ≈ 2 μm.'),
  sample('葉綠體','Chloroplast',5e-6,'elodea','長約 5 μm；是細胞內的胞器。','Length ≈ 5 μm; an organelle inside a cell.'),
  sample('草履蟲','Paramecium',2e-4,'paramecium','長約 200 μm，也就是 0.2 mm。','Length ≈ 200 μm, or 0.2 mm.'),
  sample('成人身高例','Adult height example',1.72,null,'身高約 172 cm，也就是 1.72 m。','Height ≈ 172 cm, or 1.72 m.'),
  sample('大型藍鯨','Large blue whale',33,'whale','長約 33 m。','Length ≈ 33 m.')
 ];
 const units=[{id:'km',m:1e3,zh:'公里'},{id:'m',m:1,zh:'公尺'},{id:'cm',m:1e-2,zh:'公分'},{id:'mm',m:1e-3,zh:'毫米'},{id:'μm',m:1e-6,zh:'微米'},{id:'nm',m:1e-9,zh:'奈米'}];
 const modes=[{zh:'肉眼',en:'Unaided eye',resolution:1e-4},{zh:'一般光學',en:'Conventional light',resolution:2e-7},{zh:'電子顯微',en:'Electron microscopy',resolution:5e-9}];
 const tasks=[
  {zh:'找綠色葉綠體',en:'Identify green chloroplasts',sample:3,best:1,why:'需要看自然綠色與細胞內顆粒，一般光學顯微鏡很適合。電子顯微鏡可以看更細結構，但不是保留原生綠色的方法。',enWhy:'Light microscopy suits natural green color and intracellular granules. Electron microscopy can reveal finer structure but does not preserve natural green color.'},
  {zh:'看細菌表面細節',en:'Examine bacterial surface details',sample:2,best:2,why:'約 2 μm 的細菌整體可用光學顯微鏡辨認；想看更細的外部構造，電子顯微鏡較合適。不能說所有細菌都只能用電子顯微鏡看。',enWhy:'A roughly 2 μm bacterium can be recognized with light microscopy. Electron microscopy is more suitable for finer surface details; bacteria are not universally invisible to light microscopes.'},
  {zh:'辨認約 100 nm 病毒外形',en:'Resolve a roughly 100 nm virus',sample:0,best:2,why:'100 nm 小於本頁一般光學約 200 nm 的解析示意門檻；增加普通光學倍率不能憑空補出清楚外形。此處不討論超解析特殊技術。',enWhy:'100 nm is below the conventional-light model’s roughly 200 nm resolution threshold. More magnification alone cannot reveal a clear outline. Special super-resolution methods are outside this model.'},
  {zh:'看藍鯨整體外形',en:'Observe a whale’s overall form',sample:6,best:0,why:'觀察大型動物整體通常用肉眼或相機，不把整隻藍鯨放進顯微鏡。若研究牠的細胞，則是另一個尺度、另一個任務。',enWhy:'Use eyes or a camera for a large animal’s overall form. Its cells are a separate observation task at a different scale.'}
 ];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function scientific(value){if(!Number.isFinite(value)||value<=0)return null;const [coefficient,exponent]=value.toExponential(9).split('e');return {a:Number(coefficient),n:Number(exponent)};}
 function decimal(v){if(!Number.isFinite(v))return '—';if(v===0)return '0';return String(Number(v.toPrecision(10)));}
 function rulerLabel(v){if(v===0)return '0';if(Math.abs(v)>=.001&&Math.abs(v)<1e6)return String(Number(v.toPrecision(4)));const [a,n]=v.toExponential(3).split('e');return `${Number(a)}×10^${Number(n)}`;}
 function convert(m,id){return m/units.find(u=>u.id===id).m;}
 function physicalBar(m,span,width=880){return m/span*width;}
 function fullBox(w,h,ar=1.6){const portrait=h>w,aw=w-(portrait?32:372),ah=portrait?h*.6-180:h-220;return {left:portrait?16:356,width:Math.max(0,Math.min(aw,ah*ar)),height:Math.max(0,Math.min(aw/ar,ah))};}
 function resolvable(separation,mode){return separation>=modes[mode].resolution;}
 const api={sources,samples,units,modes,tasks,scientific,convert,rulerLabel,physicalBar,fullBox,resolvable};root.LifeScale=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof document==='undefined')return;
 let lang='zh',tab=0,expanded=null,focusBack=null;
 const state={selected:2,reference:1,logSpan:-5,unit:'μm',unitSample:2,science:1270,task:0,tool:null,separation:1e-7};
 const $=id=>document.getElementById(id),tr=(zh,en)=>lang==='zh'?zh:en;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const bi=(zh,en,tag='span',attrs='')=>`<${tag} data-zh="${esc(zh)}" data-en="${esc(en)}" ${attrs}>${esc(tr(zh,en))}</${tag}>`;
 const b=(id,zh,en,cls='action-btn')=>bi(zh,en,'button',`id="${id}" type="button" class="${cls}"`);
 const maths=v=>{const s=scientific(v);return s?`<span class="math-text">${decimal(s.a)} × 10<sup>${s.n}</sup></span>`:'—';};
 const num=(v,id)=>`${Math.abs(v)>=1e-6&&Math.abs(v)<1e9?decimal(v):maths(v)} ${id}`;
 const size=(m)=>{const id=m>=1?'m':m>=.01?'cm':m>=.001?'mm':m>=1e-6?'μm':'nm';return num(convert(m,id),id);};
 const options=(attr)=>samples.map((s,i)=>bi(s.zh+' · 約 '+plainSize(s.m),s.en+' · ≈ '+plainSize(s.m),'button',`type="button" class="choice" data-${attr}="${i}"`)).join('');
 const plainSize=m=>m===1.72?'172 cm':m>=1?decimal(m)+' m':m>=2e-7?decimal(m/1e-6)+' μm':decimal(m/1e-9)+' nm';
 const pick=(id)=>`<select id="${id}">${samples.map((s,i)=>bi(s.zh+' · 約 '+plainSize(s.m),s.en+' · ≈ '+plainSize(s.m),'option',`value="${i}"`)).join('')}</select>`;
 const closure=(zh,en)=>`<div class="concept">${bi('概念收束','Concept closure','strong')}${bi(zh,en,'p')}</div>`;
 const fact=(zh,en,txt,eng)=>`<article>${bi(zh,en,'h3')}${bi(txt,eng,'p')}</article>`;
 const controls=(key)=>b(key+'Expand','⛶ 全螢幕操作','⛶ Expand workspace');
 function photo(key){return `<figure class="photo-card" id="${key}Card">${bi('觀察目標 · 影像參考','Observation target · image reference','h3')}<div class="photo-window" id="${key}Photo" tabindex="0" role="group"><img id="${key}Image" alt="" draggable="false"><p id="${key}NoImage" hidden></p></div><p id="${key}Tag"></p><p class="credit" id="${key}Credit"></p><div class="control-row">${b(key+'PhotoReset','還原照片','Reset photo')}</div>${bi('單指拖曳、雙指縮放照片。','Drag with one finger; pinch to zoom the photo.','p')}</figure>`;}
 const pages=[
  ['一樣大？尺說了算','Same size? Ask the ruler','生命尺度旅行','A journey through scale','照片都放一樣大，藍鯨和黴漿菌就一樣大嗎？你會先看什麼？','If photos are displayed equally large, is a whale as big as Mycoplasma? What should you check first?'],
  ['數字變了，物體沒變','New number, same object','長度單位','Length units','172 公分和 1.72 公尺，哪一個人比較高？為什麼不能只比數字？','Who is taller: 172 centimeters or 1.72 meters? Why can’t you compare just the numbers?'],
  ['好多個零，怎麼讀？','How do we read all those zeros?','科學記號','Scientific notation','0.000002 公尺不容易讀，能不能把它寫短，卻不改變原來的大小？','Can we shorten 0.000002 meters without changing its value?'],
  ['想看什麼，用什麼？','What should we use to see it?','觀察工具','Observation tools','看一整隻藍鯨，和找細胞內的綠色顆粒，可以用同一種工具嗎？','Can the same tool show a whole whale and green granules inside a cell?']
 ];
 const contents=[
  ()=>`${bi('用同一把尺，比較生命大小','Compare sizes with the same ruler','h2')}${bi('每個物體都標出約略尺寸。黃色是你選的物體，青色是比較對象；兩條長度用同一把尺。','Each object has an approximate dimension. Yellow shows your selection; cyan shows the comparison. Both use the same ruler.','p','class="lead"')}<section class="lab" id="travelLab" style="--ar:1.6"><div class="lab-controls">${bi('你想從哪裡出發？','Where will you start?','h3')}<div class="lab-options">${options('sample')}</div><div class="lab-control">${bi('另一個比較對象','Comparison object','label','for="reference"')}${pick('reference')}</div><div class="lab-control">${bi('縮小世界 ← → 放大觀察','Zoom out ← → zoom in','label','for="zoomRange"')}<input id="zoomRange" type="range" min="-2" max="9" step=".01" value="5"></div><div class="control-row">${b('fitTravel','讓兩者都入鏡','Fit both dimensions')}${controls('travel')}</div><div class="readout" id="travelReadout"></div></div><div class="lab-view"><canvas id="travelCanvas" width="960" height="600" aria-label="同一尺規上的兩個長度"></canvas><figcaption id="travelCaption"></figcaption></div></section>${photo('travel')}<div class="facts">${fact('照片大，不一定物體大','A big photo need not show a big object','真實大小要看尺寸或校正比例尺，不看它在螢幕占幾公分。照片與尺上的代表值沒有逐張校正關係。','Use dimensions or calibrated scale bars, not the photo’s screen size. These representative values are not individually calibrated to the photos.')}${fact('每跨一大格，相差十倍','Each major step changes scale tenfold','1 m → 0.1 m → 0.01 m：視窗愈小，同一個物體就占得愈大；物體本身沒有長大。','1 m → 0.1 m → 0.01 m: a smaller window makes the same object occupy more of the view without growing.')}</div>${closure('先問「有多大」，再問「用什麼看」；不同照片不能只靠畫面尺寸比大小。','Ask “how big?” before “which tool?” Screen sizes alone cannot compare different photographs.')}`,
  ()=>`${bi('同一長度，六種寫法','One length, six ways to express it','h2')}${bi('換單位時，尺上的帶長度不變，讀值同時更新。','Changing the unit updates the readings without changing the dimension band.','p','class="lead"')}<section class="lab" id="unitsLab" style="--ar:1.6"><div class="lab-controls">${bi('選一個尺寸例','Choose a dimension example','h3')}${pick('unitSample')}<div class="lab-options">${units.map(u=>bi(u.zh+' '+u.id,u.id,'button',`class="choice" type="button" data-unit="${u.id}"`)).join('')}</div>${controls('units')}<div class="equivalence" id="unitValues"></div></div><div class="lab-view"><canvas id="unitsCanvas" width="960" height="600" aria-label="換單位不改變長度"></canvas><figcaption id="unitsCaption"></figcaption></div></section><div class="table-scroll"><table class="unit-table"><thead><tr>${bi('單位','Unit','th')}${bi('1 單位等於幾公尺？','One unit in meters','th')}</tr></thead><tbody>${units.map(u=>`<tr><td>${bi(u.zh,u.id)} ${u.id}</td><td>${maths(u.m)} m</td></tr>`).join('')}</tbody></table></div>${closure('單位越小，同一長度需要的「份數」越多。數字和單位必須一起讀。','A smaller unit requires more units for the same length. Always read the number with its unit.')}`,
  ()=>`${bi('把十倍關係，收進一個指數','Capture powers of ten in an exponent','h2')}${bi('正數的科學記號寫成 a × 10ⁿ，其中 1 ≤ a < 10。指數可以是零，也可以是負數。','Write a positive number as a × 10ⁿ with 1 ≤ a < 10. The exponent may be zero or negative.','p','class="lead"')}<div class="board">${bi('即時科學記號工作臺','Scientific notation workbench','h3')}${bi('輸入一個大於零的有限數值','Enter a positive finite number','label','for="scienceInput"')}<input class="science-input" id="scienceInput" type="number" min="0" step="any" value="1270"><div class="lab-options">${[1,100,500,1000,1270,.000002].map(v=>b('science'+String(v).replace('.','_'),String(v),String(v),'choice')).join('')}</div><div class="notation" id="scienceResult"></div><p id="scienceHint"></p></div><div class="facts">${fact('係數放在 1～10 之間','Keep the coefficient between 1 and 10','係數要大於或等於 1、小於 10；例如 1270 = 1.27 × 10³。大小沒有改變，只是寫法不同。','The coefficient is at least 1 and below 10; for example, 1270 = 1.27 × 10³. The value stays unchanged.')}${fact('很小的數，負指數','Small numbers use negative exponents','10⁻¹ 是十分之一，10⁻⁶ 是百萬分之一；負指數不是負長度。','10⁻¹ is one tenth and 10⁻⁶ is one millionth. A negative exponent does not mean a negative length.')}</div><section class="worksheet">${bi('換算練習：先自己寫','Conversion practice: try it yourself','h3')}<ol><li>${bi('17 個 1 元硬幣，如何用科學記號表示總金額？','Express the total value of seventeen one-dollar coins in scientific notation.')}<span class="blank" aria-hidden="true"></span></li><li>${bi('16420 個新生兒，如何用科學記號表示人數？','Express 16420 newborns in scientific notation.')}<span class="blank" aria-hidden="true"></span></li><li>${bi('身高範例：172 公分 = ______ × ______ 公分。','Height example: 172 cm = ______ × ______ cm.')}<span class="blank" aria-hidden="true"></span></li><li>${bi('大腸桿菌的長度約有 2 微米 = ______ × ______ 微米。','An E. coli cell is about 2 micrometers long = ______ × ______ micrometers.')}<span class="blank" aria-hidden="true"></span></li></ol>${bi('地球平均半徑約 6371 公里 = 6.371 × 10³ 公里。','Earth’s mean radius ≈ 6371 km = 6.371 × 10³ km.','p')}</section>${closure('科學記號是同一個數的另一種寫法，不是改變物體大小的按鈕。','Scientific notation is another way to write the same value, not a way to resize an object.')}`,
  ()=>`${bi('① 選目標 → ② 選工具 → ③ 看結果','① Choose a target → ② Choose a tool → ③ See the result','h2')}${bi('照片先讓你認識目標；再點選工具，比較它能看清楚什麼。','Use the reference photo to recognize the target, then choose a tool to compare what it can reveal.','p','class="lead"')}<section class="lab" id="toolsLab" style="--ar:1.6"><div class="lab-controls">${bi('① 想看什麼？','① What do you want to see?','h3')}<div class="lab-options">${tasks.map((t,i)=>bi(t.zh,t.en,'button',`class="choice" type="button" data-task="${i}"`)).join('')}</div>${bi('② 用什麼工具？','② Which tool?','h3')}<div class="lab-options">${modes.map((m,i)=>bi(m.zh,m.en,'button',`class="choice" type="button" data-tool="${i}"`)).join('')}</div>${controls('tools')}<div class="status" id="toolFeedback" aria-live="polite"></div></div><div class="lab-view"><div id="toolResult" class="tool-result" aria-live="polite"></div><div id="toolComparisons" class="tool-comparisons"></div><figcaption id="toolsCaption"></figcaption></div></section>${photo('tools')}<div class="facts">${fact('光學：看自然顏色','Light microscopy: natural color','葉綠體約 5 μm，光學顯微鏡能讓你看到綠色顆粒。','Chloroplasts are roughly 5 μm; light microscopy shows their green granules.')}${fact('電子：看更細的結構','Electron microscopy: finer structure','約 100 nm 的病毒外形，需要電子顯微鏡。電子照片的加色不是自然顏色。','A roughly 100 nm virus outline requires electron microscopy. Added colors are not natural colors.')}</div>${closure('不是選倍率最大的，而是選最符合觀察目的的工具。','Choose the tool that matches the observation goal, not just the highest magnification.')}`

 ];
 $('lessonTabs').innerHTML=pages.map((p,i)=>`<button id="tab${i}" class="tab-btn" type="button" data-tab="${i}">${bi(p[0],p[1],'span','class="tab-main"')}${bi(p[2],p[3],'span','class="tab-sub"')}</button>`).join('');
 $('lessons').innerHTML=pages.map((p,i)=>`<section id="lesson${i}" class="lesson" ${i?'hidden':''}><div class="hook-box"><div class="xiaozhen-logo"><img src="assets/characters/xiaozhen/teaching.png" alt="曉臻老師"></div><div class="hook-content"><div class="hook-title">${bi('曉臻老師說：','Teacher Xiaozhen asks:')}</div><div class="hook-text">${bi(p[4],p[5])}</div></div></div>${contents[i]()}</section>`).join('');
 const text=(id,zh,en)=>$(id).textContent=tr(zh,en);
 const active=(attr,v)=>document.querySelectorAll('[data-'+attr+']').forEach(e=>{const on=String(e.dataset[attr])===String(v);e.classList.toggle('active',on);e.setAttribute('aria-pressed',on);});
 function baseCanvas(id){const c=$(id),ctx=c.getContext('2d');ctx.clearRect(0,0,960,600);const g=ctx.createLinearGradient(0,0,960,600);g.addColorStop(0,'#23483d');g.addColorStop(1,'#0b1a15');ctx.fillStyle=g;ctx.fillRect(0,0,960,600);return ctx;}
 function line(ctx,x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
 function label(ctx,str,x,y,color='#f2ecd9',align='left'){ctx.font='700 26px "JetBrains Mono", "Noto Sans TC", sans-serif';ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,x,y);}
 function rulerText(ctx,str,x,y,align){if(!str.includes('^')){label(ctx,str,x,y,'#f2ecd9',align);return;}const [main,exponent]=str.split('^');ctx.font='700 26px "JetBrains Mono", "Noto Sans TC", sans-serif';const mainWidth=ctx.measureText(main).width;ctx.font='700 20px "JetBrains Mono", sans-serif';const width=mainWidth+ctx.measureText(exponent).width,start=align==='right'?x-width:align==='center'?x-width/2:x;label(ctx,main,start,y);ctx.font='700 20px "JetBrains Mono", sans-serif';ctx.fillText(exponent,start+mainWidth,y-10);}
 function ruler(ctx,span,unit){const start=40,width=880,y=470;line(ctx,start,y,start+width,y,'#b6c9bf',3);for(let i=0;i<=20;i++){const x=start+i*width/20;line(ctx,x,y,x,y+(i%5===0?24:12),'#b6c9bf',2);if(i%5===0){rulerText(ctx,rulerLabel(convert(span*i/20,unit)),x,530,i===0?'left':i===20?'right':'center');}}label(ctx,unit,920,574,'#55e9ff','right');}
 function band(ctx,m,span,y,color){const exact=physicalBar(m,span),shown=Math.min(exact,880);ctx.save();ctx.beginPath();ctx.rect(40,y-44,880,90);ctx.clip();if(exact>=1){const g=ctx.createLinearGradient(40,y-28,40,y+28);g.addColorStop(0,color);g.addColorStop(1,color+'77');ctx.fillStyle=g;ctx.fillRect(40,y-28,shown,56);line(ctx,40,y-30,40,y+30,'#f2ecd9',2);line(ctx,40+exact,y-30,40+exact,y+30,'#f2ecd9',2);}ctx.restore();return exact;}
 function travelUnit(span){return span>=1?'m':span>=.01?'cm':span>=.001?'mm':span>=1e-6?'μm':'nm';}
 function drawTravel(){
  const s=samples[state.selected],r=samples[state.reference],span=10**state.logSpan,ctx=baseCanvas('travelCanvas'),unit=travelUnit(span);
  ruler(ctx,span,unit);
  const a=band(ctx,s.m,span,180,'#fde047'),b=band(ctx,r.m,span,330,'#55e9ff');
  label(ctx,tr(s.zh,s.en)+' · ≈ '+plainSize(s.m),40,105,'#fde047');
  label(ctx,tr(r.zh,r.en)+' · ≈ '+plainSize(r.m),40,255,'#55e9ff');
  for(const [px,y,color] of [[a,180,'#fde047'],[b,330,'#55e9ff']]){
   if(px<1){line(ctx,40,y-24,40,y+24,color,4);label(ctx,tr('太小，在這把尺上只占不到一個像素','Too small: less than one pixel on this ruler'),65,y+9,color);}
   else if(px>880)label(ctx,tr('→ 超出畫面：點「讓兩者都入鏡」','→ Outside view: choose “Fit both dimensions”'),40,y+78,color);
  }
  const ratio=decimal(Math.max(s.m,r.m)/Math.min(s.m,r.m));
  $('travelReadout').innerHTML=`<strong>${esc(tr(s.zh,s.en))} · ${tr('約','≈')} ${plainSize(s.m)}</strong><p>${esc(tr(s.note,s.enNote))}</p><p>${esc(tr(r.zh,r.en))} · ${tr('約','≈')} ${plainSize(r.m)}</p><p>${tr('大者是小者的','Larger / smaller:')} <b>${ratio}</b> ${tr('倍','times')}</p>`;
  text('travelCaption','同一把尺，兩種長度。太小看不見時，可以點它的按鈕換一把更小的尺。尺寸是約略比較值，種類與個體會不同。','Two dimensions, one ruler. If one is too small, select it to use a smaller ruler. Dimensions are approximate examples and vary by species and individual.');
  active('sample',state.selected);$('reference').value=state.reference;$('zoomRange').value=-state.logSpan;
 }
 function drawUnits(){const s=samples[state.unitSample],span=s.m*1.4,ctx=baseCanvas('unitsCanvas');band(ctx,s.m,span,250,'#fde047');ruler(ctx,span,state.unit);label(ctx,tr('同一尺寸，不會因換單位改變','Same dimension, unchanged by unit'),40,105,'#fde047');
  $('unitValues').innerHTML=units.map(u=>`<div class="unit-value ${state.unit===u.id?'active':''}">${num(convert(s.m,u.id),u.id)}</div>`).join('');$('unitsCaption').innerHTML=`${esc(tr(s.zh,s.en))} = ${num(convert(s.m,state.unit),state.unit)}<br>${esc(tr(s.note,s.enNote))}`;active('unit',state.unit);$('unitSample').value=state.unitSample;
 }
 function drawScience(){const s=scientific(state.science);if(!s){text('scienceResult','請輸入大於零的有限數值。','Enter a positive finite number.');text('scienceHint','本工作臺示範正數；空白、零、負值或超出範圍不硬算。','This bench demonstrates positive numbers; blank, zero, negative, and out-of-range entries are not forced into a result.');return;}$('scienceResult').innerHTML=`${decimal(state.science)} = ${maths(state.science)}`;text('scienceHint',`係數 ${decimal(s.a)} 符合 1 ≤ a < 10；10 的指數是 ${s.n}。原值未變。`,`Coefficient ${decimal(s.a)} satisfies 1 ≤ a < 10; the exponent is ${s.n}. The value is unchanged.`);}
 const outcomes=[
  [
   ['只能看見葉片，分不出葉綠體。','You can see a leaf, but not individual chloroplasts.'],
   ['看得到綠色葉綠體顆粒。','Green chloroplast granules can be seen.'],
   ['可看更細結構，不能判讀自然綠色。','Finer structure can be seen, but not natural green color.']
  ],
  [
   ['看不到單一細菌。','An individual bacterium cannot be seen.'],
   ['可辨認桿狀外形，看不清細微表面。','Rod shapes can be recognized, but not fine surface details.'],
   ['可以觀察細菌的表面細節。','Fine bacterial surface details can be examined.']
  ],
  [
   ['看不到單一病毒。','An individual virus cannot be seen.'],
   ['一般光學分不清約 100 nm 病毒的外形。','Conventional light microscopy cannot resolve a roughly 100 nm virus outline.'],
   ['可以觀察病毒外形。','The virus outline can be examined.']
  ],
  [
   ['看得到整隻藍鯨的外形。','The form of a whole whale can be seen.'],
   ['不適合看整隻藍鯨；只能觀察小標本。','Not for a whole whale; use a small specimen.'],
   ['不適合看整隻藍鯨；用於細微標本。','Not for a whole whale; use a microscopic specimen.']
  ]
 ];
 function drawTools(){
  const t=tasks[state.task],m=state.tool;active('task',state.task);active('tool',m);
  $('toolResult').className='tool-result '+(m===null?'':m===t.best?'matched':'mismatch');
  $('toolResult').innerHTML=m===null?bi('③ 點一種工具，看看能看到什麼','③ Choose a tool to see what it reveals','h3'):
   `<h3>${esc(tr(modes[m].zh,modes[m].en))} · ${esc(tr(...outcomes[state.task][m]))}</h3><p>${esc(tr(m===t.best?'✓ 適合這個觀察目標':'這個目標，試試另一種工具',m===t.best?'✓ Suits this observation goal':'Try a different tool for this goal'))}</p>`;
  $('toolComparisons').innerHTML=modes.map((mode,i)=>`<button type="button" class="tool-option ${m===i?'chosen':''}" data-result-tool="${i}" aria-pressed="${m===i}"><strong>${esc(tr(mode.zh,mode.en))}</strong><span>${esc(tr(...outcomes[state.task][i]))}</span></button>`).join('');
  $('toolComparisons').querySelectorAll('[data-result-tool]').forEach(e=>e.addEventListener('click',()=>{state.tool=+e.dataset.resultTool;drawTools();}));
  text('toolFeedback',m===null?'先選一種工具。':m===t.best?'✓ 這個工具很適合！':'想想你要看的是整體、顏色，還是細節。',m===null?'Choose a tool.':m===t.best?'✓ A suitable tool!':'Consider whole form, natural color, or fine detail.');
  text('toolsCaption','下方是真實參考影像，拍攝方式已註明；不是所選工具的模擬畫面。','The real reference image below is labeled with its acquisition method; it is not a simulated view through the selected tool.');
 }
 const photoStates={travel:{scale:1,x:0,y:0,pointers:new Map()},tools:{scale:1,x:0,y:0,pointers:new Map()}};
 function transformPhoto(key){const v=photoStates[key];$(key+'Image').style.transform=`translate(${v.x}px,${v.y}px) scale(${v.scale})`;}
 function resetPhoto(key){Object.assign(photoStates[key],{scale:1,x:0,y:0,gesture:null});photoStates[key].pointers.clear();transformPhoto(key);}
 function showPhoto(key,source){
  const s=sources[source];resetPhoto(key);$(key+'Card').hidden=!s&&state.selected!==5;
  if(!s){
   $(key+'Image').hidden=true;$(key+'NoImage').hidden=false;
   $(key+'NoImage').innerHTML='<svg viewBox="1670 0 298 793" role="img" aria-label="'+tr('完整成人示意','Whole adult illustration')+'"><image href="assets/biology/organization_human_levels_ai_v3.png" width="1983" height="793"/></svg>';
   text(key+'Tag','成人身高例：約 172 cm。AI 教學示意，非實拍。','Adult height example: ≈ 172 cm. AI teaching illustration, not a photograph.');
   text(key+'Credit','Physical-Boys 原創 AI 圖；不代表平均身高。','Original Physical-Boys AI illustration; not an average height.');return;
  }
  $(key+'Image').src=P+s.file;$(key+'Image').alt=tr(s.tag,s.enTag);$(key+'Image').hidden=false;$(key+'NoImage').hidden=true;
  text(key+'Tag',s.tag,s.enTag);
  $(key+'Credit').innerHTML=`${esc(s.author)} · ${esc(tr(s.license,s.enLicense))} · <a href="${s.sourceUrl||C+encodeURIComponent(s.title.replaceAll(' ','_'))}">${tr('來源','Source')}</a> <a href="${s.url}">${tr('授權','License')}</a>`;
 }
 function selectSample(i){state.selected=i;state.reference=i===0?1:i===5?6:i-1;state.logSpan=clamp(Math.log10(Math.max(samples[i].m,samples[state.reference].m)*1.4),-9,2);drawTravel();showPhoto('travel',samples[i].source);}
 function selectTask(i){state.task=i;state.tool=null;drawTools();showPhoto('tools',samples[tasks[i].sample].source);}
 function expand(key,on){if(expanded){$(expanded+'Lab').classList.remove('is-expanded');text(expanded+'Expand','⛶ 全螢幕操作','⛶ Expand workspace');}expanded=on?key:null;document.body.classList.toggle('scale-open',on);if(on){focusBack=$(key+'Expand');$(key+'Lab').classList.add('is-expanded');text(key+'Expand','✕ 返回教材','✕ Return to lesson');$(key+'Expand').focus?.();}else{focusBack?.focus?.();focusBack=null;}clearPointers();}
 function clearPointers(){rulerPointers.clear();rulerGesture=null;Object.values(photoStates).forEach(v=>{v.pointers.clear();v.gesture=null;});}
 function switchTab(i){if(expanded)expand(expanded,false);tab=i;pages.forEach((_,j)=>{$('lesson'+j).hidden=i!==j;$('tab'+j).classList.toggle('active',i===j);$('tab'+j).setAttribute('aria-pressed',i===j);});clearPointers();redraw();}
 function redraw(){drawTravel();drawUnits();drawScience();drawTools();}
 function setLang(next){lang=next;document.documentElement.lang=next==='zh'?'zh-Hant':'en';document.querySelectorAll('[data-zh][data-en]').forEach(e=>e.textContent=e.dataset[next]);active('language',next);$('introScreen').setAttribute('aria-label',tr('進入教材','Enter lesson'));redraw();showPhoto('travel',samples[state.selected].source);showPhoto('tools',samples[tasks[state.task].sample].source);['travel','units','tools'].forEach(k=>text(k+'Expand',expanded===k?'✕ 返回教材':'⛶ 全螢幕操作',expanded===k?'✕ Return to lesson':'⛶ Expand workspace'));}
 const rulerPointers=new Map();let rulerGesture=null;
 function geometry(map){const a=[...map.values()];return a.length===1?{x:a[0].x,y:a[0].y,d:0}:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)};}
 function bindRuler(){const c=$('travelCanvas');c.addEventListener('pointerdown',e=>{e.preventDefault();c.setPointerCapture?.(e.pointerId);rulerPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});rulerGesture=geometry(rulerPointers);});c.addEventListener('pointermove',e=>{if(!rulerPointers.has(e.pointerId))return;e.preventDefault();rulerPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=geometry(rulerPointers);if(rulerGesture){const delta=g.d&&rulerGesture.d?-Math.log10(g.d/rulerGesture.d):-(g.x-rulerGesture.x)/Math.max(200,c.getBoundingClientRect().width)*3;state.logSpan=clamp(state.logSpan+delta,-9,2);drawTravel();}rulerGesture=g;});['pointerup','pointercancel','lostpointercapture'].forEach(n=>c.addEventListener(n,e=>{rulerPointers.delete(e.pointerId);rulerGesture=rulerPointers.size?geometry(rulerPointers):null;}));}
 function bindPhoto(key){const a=$(key+'Photo'),v=photoStates[key];a.addEventListener('pointerdown',e=>{e.preventDefault();a.setPointerCapture?.(e.pointerId);v.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});v.gesture=geometry(v.pointers);});a.addEventListener('pointermove',e=>{if(!v.pointers.has(e.pointerId))return;e.preventDefault();v.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=geometry(v.pointers);if(v.gesture){if(g.d&&v.gesture.d)v.scale=clamp(v.scale*g.d/v.gesture.d,1,4);v.x+=g.x-v.gesture.x;v.y+=g.y-v.gesture.y;const r=a.getBoundingClientRect();v.x=clamp(v.x,-r.width*v.scale*.65,r.width*v.scale*.65);v.y=clamp(v.y,-r.height*v.scale*.65,r.height*v.scale*.65);transformPhoto(key);}v.gesture=g;});['pointerup','pointercancel','lostpointercapture'].forEach(n=>a.addEventListener(n,e=>{v.pointers.delete(e.pointerId);v.gesture=v.pointers.size?geometry(v.pointers):null;}));$(key+'PhotoReset').addEventListener('click',()=>resetPhoto(key));$(key+'Image').addEventListener('error',()=>{$(key+'Image').hidden=true;$(key+'NoImage').hidden=false;text(key+'NoImage','照片載入失敗，請查看來源；不以 AI 假實拍代替。','Photo failed to load; check the source. No fabricated “photo” is substituted.');});}
 document.querySelectorAll('[data-sample]').forEach(e=>e.addEventListener('click',()=>selectSample(+e.dataset.sample)));
 document.querySelectorAll('[data-unit]').forEach(e=>e.addEventListener('click',()=>{state.unit=e.dataset.unit;drawTravel();drawUnits();}));
 document.querySelectorAll('[data-task]').forEach(e=>e.addEventListener('click',()=>selectTask(+e.dataset.task)));
 document.querySelectorAll('[data-tool]').forEach(e=>e.addEventListener('click',()=>{state.tool=+e.dataset.tool;drawTools();}));
 document.querySelectorAll('[data-tab]').forEach(e=>e.addEventListener('click',()=>switchTab(+e.dataset.tab)));
 document.querySelectorAll('[data-language]').forEach(e=>e.addEventListener('click',()=>setLang(e.dataset.language)));
 $('reference').value=state.reference;$('reference').addEventListener('change',()=>{state.reference=+$('reference').value;state.logSpan=clamp(Math.log10(Math.max(samples[state.selected].m,samples[state.reference].m)*1.4),-9,2);drawTravel();});
 $('zoomRange').addEventListener('input',()=>{state.logSpan=-Number($('zoomRange').value);drawTravel();});
 $('unitSample').addEventListener('change',()=>{state.unitSample=+$('unitSample').value;drawUnits();});
 $('scienceInput').addEventListener('input',()=>{state.science=$('scienceInput').value===''?NaN:Number($('scienceInput').value);drawScience();});
 for(const v of [1,100,500,1000,1270,.000002])$('science'+String(v).replace('.','_')).addEventListener('click',()=>{$('scienceInput').value=v;state.science=v;drawScience();});

 $('fitTravel').addEventListener('click',()=>{state.logSpan=clamp(Math.log10(Math.max(samples[state.selected].m,samples[state.reference].m)*1.4),-9,2);drawTravel();});['travel','units','tools'].forEach(k=>$(k+'Expand').addEventListener('click',()=>expand(k,expanded!==k)));
 $('introScreen').addEventListener('click',()=>$('introScreen').hidden=true);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded)expand(expanded,false);});document.addEventListener('visibilitychange',()=>{if(document.hidden)clearPointers();});
 ['travel','tools'].forEach(key=>$(key+'Lab').querySelector('.lab-view').appendChild($(key+'Card')));
 bindRuler();bindPhoto('travel');bindPhoto('tools');Object.assign(api,{selectSample,selectTask,setLang,switchTab,expand,redraw,getState:()=>({lang,tab,expanded,state,photoStates,rulerPointers})});switchTab(0);setLang('zh');
})(typeof globalThis!=='undefined'?globalThis:this);

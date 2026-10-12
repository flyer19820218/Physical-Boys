/* Teacher-authorized replacement of the terminal nutrient-use scene only.
 * Existing drawings and their coordinates remain untouched. */
(function(root){'use strict';
 const D=root.AnimalDraw,C=D.C;
 const phase=p=>Math.min(2,Math.floor(Math.max(0,Math.min(1,p))*3));
 const captions=[
  [['小腸吸收','Small-intestinal absorption'],['絨毛增加表面積。葡萄糖與胺基酸穿過上皮，進入微血管。','Villi increase surface area. Glucose and amino acids cross the epithelium into blood capillaries.']],
  [['血液運送・看真實血流','Transport: watch real blood flow'],['會移動的是紅血球；葡萄糖、胺基酸主要溶在血漿中，隨血流運送。這段實拍不是人體腸道，也看不到單個養分分子。','The moving cells are red blood cells. Glucose and amino acids travel mainly dissolved in plasma. This is not a human intestine; individual nutrient molecules are not visible.']],
  [['細胞利用・粒線體參與呼吸','Cell use: mitochondria and respiration'],['養分送到細胞後，可用來合成物質或供應能量。粒線體是有氧呼吸的重要場所；不是把整顆葡萄糖直接送進粒線體。','Cells use nutrients to build materials or obtain energy. Mitochondria are important sites of aerobic respiration; whole glucose is not simply delivered straight into them.']]
 ];
 const credits=[
  ['OpenStax College · 真實光學切片；保留原圖、局部取景。','OpenStax College · genuine light micrograph; digital crop only.'],
  ['Yujia Qi（UCLA）· 斑馬魚幼魚尾部血流實拍 · 受精後第 4 天 · CC BY 4.0。','Yujia Qi (UCLA) · actual zebrafish larval tail blood flow · 4 days post-fertilization · CC BY 4.0.'],
  ['Physical-Boys · 沿用原創 AI 細胞剖面，非實拍；粒線體取自同一張圖。','Physical-Boys · existing original AI cell cutaway, not a photograph; mitochondrion enlarged from the same image.']
 ];
 function credit(i,tr){return tr(...credits[i])+` <a href="assets/biology/animal_nutrition_evidence_sources_1012_v1.md">${tr('來源、授權與修改紀錄','Sources, licensing and changes')}</a>`;}
 function media(tr){return `<div id="useFishPanel" class="use-fish-panel" hidden><h2>${tr('真的有血球在流動','Real blood cells in motion')}</h2><video id="useFishVideo" controls playsinline muted preload="metadata" poster="assets/biology/fish_tail_bloodflow_1012_v2.jpg" aria-label="${tr('斑馬魚幼魚尾部血流顯微實拍','Microscopy of blood flow in a zebrafish larval tail')}"><source src="assets/biology/fish_tail_bloodflow_1012_v2.mp4" type="video/mp4"></video><p id="useFishStatus" hidden role="status"></p><p>${tr('斑馬魚幼魚尾部・顯微實拍','Zebrafish larval tail · real microscopy')}</p></div>`;}
 function fitted(c,im,source,area){if(!im)return;const scale=Math.min(area[2]/source[2],area[3]/source[3]),w=source[2]*scale,h=source[3]*scale;c.drawImage(im,...source,area[0]+(area[2]-w)/2,area[1]+(area[3]-h)/2,w,h);}
 const cellCrop=[0,0,1536,1024],mitochondrionCrop=[704,662,392,208];
 function draw(c,p,tr,images,focus='cell'){
  D.bg(c);const i=phase(p);
  D.text(c,tr(...captions[i][0]),480,35,30,C.yellow,'center',920);
  if(i===0){fitted(c,images.histology,[410,565,397,225],[45,85,870,490]);D.text(c,tr('絨毛・真實光學切片','Villi · genuine light micrograph'),480,600,24,C.teal,'center',910);}
  else if(i===1){D.text(c,tr('顯微實拍影片載入中','Loading the real microscopy video'),480,310,28,C.teal,'center',910);}
  else {const close=focus==='mitochondrion';fitted(c,images.cell,close?mitochondrionCrop:cellCrop,[35,70,890,500]);
   if(!close&&images.cell){/* Leader targets the bottom orange mitochondrion, not the nucleus. */
    c.strokeStyle=C.orange;c.lineWidth=3;c.beginPath();c.moveTo(645,602);c.lineTo(545,450);c.stroke();D.text(c,tr('橘色：粒線體','Orange: mitochondria'),650,602,24,C.orange,'center',420);}
   else D.text(c,tr('內膜摺疊形成嵴','Inner-membrane folds form cristae'),480,602,26,C.orange,'center',910);
  }
  if(i===2)D.text(c,tr('AI 剖面・非實拍','AI cutaway · not a photograph'),480,630,22,C.muted,'center',910);
  c.fillStyle=C.yellow;c.fillRect(25,650,910*Math.max(0,Math.min(1,p)),4);
 }
 let tracked=null,lastPhase=-1,lastPlaying=false,resumeTime=0,resumePlaying=false;
 function pause(keepPlaying=true){if(tracked){resumeTime=tracked.currentTime||0;resumePlaying=keepPlaying&&lastPhase===1&&!tracked.paused;tracked.pause?.();}tracked=null;lastPhase=-1;lastPlaying=false;}
 function play(tr){const v=typeof document==='undefined'?null:document.getElementById('useFishVideo');if(!v)return;v.muted=true;v.playbackRate=1;const result=v.play?.();result?.catch?.(()=>{const el=document.getElementById('useFishStatus');if(el){el.hidden=false;el.textContent=tr('請按影片的播放鍵看實拍。','Press the video play button to watch the footage.');}});}
 function sync(p,tr,playing){if(typeof document==='undefined')return;const panel=document.getElementById('useFishPanel'),cv=document.getElementById('storyScene'),v=document.getElementById('useFishVideo');if(!panel||!cv||!v)return;
  const i=phase(p),newVideo=v!==tracked,changed=newVideo||i!==lastPhase,playChanged=playing!==lastPlaying;
  if(newVideo){const restore=()=>{if(resumeTime&&Number.isFinite(v.duration))v.currentTime=Math.min(resumeTime,v.duration);};if(v.readyState>=1)restore();else v.addEventListener('loadedmetadata',restore,{once:true});v.addEventListener('error',()=>{const el=document.getElementById('useFishStatus');if(el){el.hidden=false;el.textContent=tr('實拍影片未載入，請檢查網路或重新開啟。','The real video could not load. Check the connection or reopen the page.');}});}
  tracked=v;panel.hidden=i!==1;cv.hidden=i===1;
  if(changed||playChanged){if(i===1&&(playing||newVideo&&resumePlaying))play(tr);else v.pause?.();}
  if(changed){const caption=document.getElementById('storyCaption'),cr=document.getElementById('storyCredit');if(caption){caption.innerHTML=`<strong>${tr(...captions[i][0])}</strong><p>${tr(...captions[i][1])}</p>`;}if(cr)cr.innerHTML=credit(i,tr);}
  document.querySelectorAll('[data-action="useView"]').forEach(b=>{const active=+b.dataset.value===i;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});lastPhase=i;lastPlaying=playing;
 }
 root.AnimalEvidence={phase,captions,credits,credit,media,draw,sync,pause,play,cellCrop,mitochondrionCrop};
})(typeof window==='undefined'?globalThis:window);

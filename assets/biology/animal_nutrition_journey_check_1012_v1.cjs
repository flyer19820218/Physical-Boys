/* Local source/Canvas and substitute-DOM tests, not a real iPad test. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const base=path.resolve(__dirname,'../..'),out='/private/tmp/biology_animal_journey_1012_v1';fs.mkdirSync(out,{recursive:true});
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8'),baseline='428a949';
const preserved=['animal_nutrition_data_v1.js','animal_nutrition_tour_v2.js','animal_nutrition_draw_v2.js','animal_nutrition_atlas_1012_v1.js','animal_nutrition_villus_1012_v1.js','animal_nutrition_structure_zh_1012_v1.js','animal_nutrition_v2.js','animal_nutrition_v1.css','animal_nutrition_v2.css','animal_digestive_original_v1.svg'];
for(const f of preserved)assert.equal(read(f),cp.execFileSync('git',['show',baseline+':assets/biology/'+f],{cwd:base,encoding:'utf8'}),f+' changed');
for(const f of ['animal_digestive_atlas_ai_1012_v1.png','animal_intestine_openstax_v1.jpg'])assert(fs.readFileSync(path.join(__dirname,f)).equals(cp.execFileSync('git',['show',baseline+':assets/biology/'+f],{cwd:base,maxBuffer:10*1024*1024})),f+' edited');
const html=fs.readFileSync(path.join(base,'biology_animal_nutrition.html'),'utf8');assert(!html.includes('class="eyebrow"'));assert(!html.includes('chapter3_compact_1008_v1.js'));assert.equal((html.match(/<h1\b/g)||[]).length,1);
for(const [,p]of html.matchAll(/(?:src|href)="(assets\/[^"?]+)(?:\?[^"]*)?"/g))assert(fs.existsSync(path.join(base,p)),p+' missing');
const harness=read('animal_nutrition_structure_zh_check_1012_v1.cjs').split("assert.equal(body.querySelectorAll('.lesson').length,6)")[0]
 .replace("app=fs.readFileSync(path.join(__dirname,'animal_nutrition_v2.js'),'utf8')","app=fs.readFileSync(path.join(__dirname,'animal_nutrition_journey_1012_v1.js'),'utf8')")
 .replace("const registry=new Map()","vm.runInContext(fs.readFileSync(path.join(__dirname,'animal_nutrition_journey_data_1012_v1.js'),'utf8'),box);\nconst registry=new Map()")
 .replace('window:{AnimalData:A,AnimalDraw:D,AnimalOrgans:box.AnimalOrgans}','window:{AnimalData:A,AnimalDraw:D,AnimalOrgans:box.AnimalOrgans,AnimalJourney:box.AnimalJourney}')
 .replace("out='/private/tmp/biology_animal_structure_zh_1012_v1'","out='/private/tmp/biology_animal_journey_1012_v1'");
const tests=`
(async()=>{
 const J=box.AnimalJourney;let actions=0,frames=0;
 const check=q=>{click(q);actions++;};
 assert.equal(body.querySelectorAll('.lesson').length,1);assert.equal(body.querySelectorAll('.hook-box').length,1);assert.equal(body.querySelectorAll('[role="tab"]').length,6);assert.equal(new Set(J.stations.map(s=>s.hook[0])).size,6);
 assert.equal(pending.size,0);get('introScreen').emit('click');run(.2);assert(get('introScreen').hidden);
 const images={anatomy:await loadImage(path.join(__dirname,'animal_digestive_original_v1.png')),atlas:await loadImage(path.join(__dirname,'animal_digestive_atlas_ai_1012_v1.png')),histology:await loadImage(path.join(__dirname,'animal_intestine_openstax_v1.jpg'))};
 for(const[id,m]of Object.entries(box.AnimalOrgans))images['organ_'+id]=await loadImage(path.join(base,m.src));Object.assign(U.images,images);
 for(const language of ['zh','en'])for(let n=0;n<3;n++){
  lang(language);U.station(0);check('[data-action="nutrient"][data-value="'+n+'"]');
  check('[data-action="digestion"][data-value="1"]');assert.equal(U.state.digestion,1);
  check('[data-action="mode"][data-value="fluid"]');assert.equal(U.state.fluid,0);assert.deepEqual(Array.from(J.fluidOptions(0)),[0]);
  check('[data-action="fluidStart"]');run(1);assert(U.state.fluidProgress>10&&U.state.fluidProgress<20);check('[data-action="play"]');const q=U.state.fluidProgress;run(1);assert.equal(U.state.fluidProgress,q);check('[data-action="play"]');
  for(let station=0;station<6;station++){
   U.station(station);assert.equal(U.state.nutrient,n);assert.equal(U.state.station,station);assert.equal(U.state.tab,J.modelFor[J.stations[station].defaultMode]);assert.equal(body.querySelectorAll('.lesson').length,1);
   for(const[mode]of J.stations[station].modes){U.mode(mode);
    if(mode==='use'&&n===2){assert.equal(U.state.nutrient,0);U.state.nutrient=2;}
    for(const cv of body.querySelectorAll('canvas')){assert.equal(cv.width,960);assert.equal(cv.height,660);}
    U.draw();frames++;
    check('[data-action="fullscreen"]');assert.equal(U.state.expanded,U.state.tab);assert(body.classList.contains('an-expanded'));check('[data-action="fullscreen"]');assert.equal(U.state.expanded,null);
    if(mode==='location')for(const organ of J.stations[station].organs){check('[data-action="organ"][data-value="'+organ+'"]');run(2);assert.equal(U.state.organProgress,1);U.draw();frames++;}
    if(mode==='fluid'){const options=J.fluidOptions(station);assert.deepEqual(body.querySelectorAll('[data-action="fluid"]').map(e=>+e.dataset.value),Array.from(options));for(const f of options){check('[data-action="fluid"][data-value="'+f+'"]');input('fluidProgress',100);U.draw();frames++;}}
    if(mode==='wave'){check('[data-action="restartWave"]');run(1);assert(U.state.peristalsis>8&&U.state.peristalsis<11);input('peristalsis',45);assert(!U.state.playing);assert.equal(U.state.peristalsis,45);check('[data-action="play"]');run(1);assert(U.state.peristalsis>53);}
    if(mode==='absorption')for(const view of ['original','photo','model']){check('[data-action="villusView"][data-value="'+view+'"]');U.draw();frames++;}
   }
  }
 }
 U.station(3);U.mode('absorption');for(const material of ['glucose','amino','water','starch','protein']){check('[data-action="absorb"][data-value="'+material+'"]');for(const stage of [-1,0,1,2]){check('[data-action="absorbStage"][data-value="'+stage+'"]');U.draw();frames++;}}
 for(const[n,absorb]of [[0,'glucose'],[1,'amino'],[2,'water']]){check('[data-action="nutrient"][data-value="'+n+'"]');assert.equal(U.state.absorb,absorb);if(n===2){assert.equal(U.state.villusView,'original');check('[data-action="villusView"][data-value="model"]');assert(U.caption().includes(U.state.lang==='zh'?'不是脂質吸收動畫':'not fat absorption'));}}
 U.station(5);check('[data-action="branch"]');assert.equal(U.state.station,3);assert.equal(U.state.mode,'use');check('[data-action="route"][data-value="1"]');assert.equal(U.state.nutrient,1);check('[data-action="nutrient"][data-value="2"]');assert.equal(U.state.mode,'fluid');assert.equal(U.state.fluid,2);
 U.station(0);check('[data-action="nutrient"][data-value="1"]');for(let i=1;i<6;i++){check('[data-action="station"][data-value="'+i+'"]');assert.equal(U.state.station,i);assert.equal(U.state.nutrient,1);}
 for(let i=4;i>=0;i--){check('[data-action="previous"]');assert.equal(U.state.station,i);assert.equal(U.state.nutrient,1);}
 U.station(0);check('[data-action="nutrient"][data-value="1"]');check('[data-action="fullscreen"]');
 const sequence=[[0,'fluid'],[1,'wave'],[2,'fluid'],[3,'fluid'],[3,'absorption'],[3,'use'],[4,'location'],[5,'location'],[0,'chew']];
 for(const[station,mode]of sequence){check('[data-action="next"]');assert.equal(U.state.station,station);assert.equal(U.state.mode,mode);assert.equal(U.state.nutrient,1);assert.equal(U.state.expanded,U.state.tab);}
 check('[data-action="fullscreen"]');U.station(1);const cvDrag=get('scene-3');pointer('pointerdown',cvDrag,1,300,300);pointer('pointermove',cvDrag,1,460,300);pointer('pointerup',cvDrag,1,460,300);assert.equal(U.state.peristalsis,50);assert(!U.state.playing);
 U.station(3);U.mode('absorption');const cvPinch=get('scene-4');pointer('pointerdown',cvPinch,1,300,300);pointer('pointerdown',cvPinch,2,500,300);pointer('pointermove',cvPinch,2,700,300);assert.equal(U.views[4].scale,2);pointer('pointercancel',cvPinch,2,700,300);pointer('pointerup',cvPinch,1,300,300);
 const raster=(fn,state,tr,time)=>{const cv=createCanvas(960,660);D[fn](cv.getContext('2d'),state,tr,...(fn==='anatomy'?[images]:fn==='absorption'?[images,time]:[time]));return Buffer.from(cv.getContext('2d').getImageData(0,0,960,660).data);};
 let animationChecks=0;for(const l of ['zh','en']){const tr=(z,e)=>l==='zh'?z:e,b={...U.state,lang:l,langIndex:l==='zh'?0:1,nutrient:0,digestion:0,fluid:0,fluidProgress:1,villusView:'model',absorb:'glucose',absorbStage:-1,peristalsis:0};
  assert(!raster('secretions',b,tr,0).equals(raster('secretions',{...b,fluidProgress:16},tr,1)));animationChecks++;
  assert(!raster('peristalsis',b,tr,0).equals(raster('peristalsis',{...b,peristalsis:9},tr,1)));animationChecks++;
  assert(!raster('absorption',b,tr,0).equals(raster('absorption',b,tr,1)));animationChecks++;
  assert(!raster('anatomy',{...b,anatomyView:'atlas',organ:'large',anatomyMode:'tract',zoomOrgan:true,organProgress:0},tr,0).equals(raster('anatomy',{...b,anatomyView:'atlas',organ:'large',anatomyMode:'tract',zoomOrgan:true,organProgress:.65},tr,1)));animationChecks++;
 }
 const report={baseline:'428a949',oneActiveStation:true,uniqueHooks:6,bilingualStations:12,controllerActions:actions,nativeRenderedScenes:frames,singleRAFVerified:true,nutrientPreservedOnNextPrevious:true,continuousNineNextActions:true,fullscreenPreservedAcrossNext:true,pinchAndBolusDrag:true,fluidsConfinedToActualSites:true,originalCanvas: [960,660],oneSecondAnimationPixelChecks:animationChecks,staticScenes:['chewing comparison','whole anatomy after organ pull-out','photos','Chinese / English structure','cell-use slider'],simulationOnly:true};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
`;
vm.runInNewContext(harness+tests,{require,__dirname,console,Buffer,process});
console.log('Original drawing modules, every numeric coordinate, original UI, styles and rasters byte-identical to '+baseline);

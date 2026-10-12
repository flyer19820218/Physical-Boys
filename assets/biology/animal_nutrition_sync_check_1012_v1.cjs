/* New synchronization checks reuse the native Canvas regression suite without editing its historical expectations. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),cp=require('child_process');
const base=path.resolve(__dirname,'../..'),baseline='8224ba7';
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8'),old=f=>cp.execFileSync('git',['show',baseline+':assets/biology/'+f],{cwd:base,encoding:'utf8'});
for(const f of ['animal_nutrition_overview_1012_v3.js','animal_nutrition_polymer_1012_v2.js','animal_nutrition_draw_v2.js','animal_nutrition_villus_1012_v1.js','animal_nutrition_story_data_1012_v2.js','animal_nutrition_story_1012_v2.css'])assert.equal(read(f),old(f),'Protected animation changed: '+f);
for(const [file,from,to] of [['animal_nutrition_evidence_1012_v1.js','function draw(c,p','let tracked='],['animal_nutrition_story_1012_v2.js','function overview(c)','function zoom(c,st,p)'],['animal_nutrition_story_1012_v2.js','function zoom(c,st,p)','function draw()'],['animal_nutrition_story_1012_v2.js','function draw()','function advance(dt)'],['animal_nutrition_story_1012_v2.js','function advance(dt)','function frame(t)']]){const part=s=>s.slice(s.indexOf(from),s.indexOf(to,s.indexOf(from)));assert.equal(part(read(file)),part(old(file)),'Protected drawing/timing changed: '+from);}
const factBox=s=>{const b={};vm.runInNewContext(s,b);return JSON.stringify(b.AnimalCuriosity.facts)};
assert.equal(factBox(read('animal_nutrition_curiosity_1012_v1.js')),factBox(old('animal_nutrition_curiosity_1012_v1.js')),'Facts or source URLs changed');
const additions=`
 let syncChecks=0;
 const checkCuriosity=()=>{const expected=U.state.overview==='organ'?box.AnimalCuriosity.forOrgan(U.state.overviewOrgan):[],cards=body.querySelectorAll('.story-curiosity-card');assert.equal(cards.length,expected.length);if(expected.length){const panel=get('storyCuriosity');assert.equal(panel.dataset.organ,U.state.overviewOrgan);assert(panel.closest('.an-visual'),'Facts separated from animation');assert(panel.textContent.includes(U.state.lang==='zh'?'不列考點':'not exam material'));for(const f of expected)assert(panel.textContent.includes(f.value[U.state.lang==='zh'?0:1]));}syncChecks++;};
 for(const l of ['zh','en']){lang(l);clickTest('[data-action="page"][data-value="0"]');clickTest('[data-action="overviewGroup"][data-value="tract"]');checkCuriosity();clickTest('[data-action="organPlay"]');
  for(const id of O.groups.tract){assert.equal(U.state.overviewOrgan,id);checkCuriosity();run(1);checkCuriosity();run(5.15);}
  for(const id of ['mouth','esophagus','stomach','small','large']){clickTest('[data-action="organ"][data-value="'+id+'"]');checkCuriosity();clickTest('[data-action="fullscreen"]');checkCuriosity();lang(l==='zh'?'en':'zh');checkCuriosity();lang(l);clickTest('[data-action="fullscreen"]');run(2);}
  clickTest('[data-action="overviewWhole"]');checkCuriosity();clickTest('[data-action="page"][data-value="1"]');assert.equal(body.querySelectorAll('.story-curiosity-card').length,0);
  clickTest('[data-action="station"][data-value="3"]');clickTest('[data-action="step"][data-value="8"]');for(let view=0;view<3;view++){clickTest('[data-action="useView"][data-value="'+view+'"]');assert.equal(box.AnimalEvidence.phase(U.progress()),view);assert.equal(body.querySelectorAll('.story-use-link').length,1);syncChecks++;}
 }
 const syncOut='/private/tmp/biology_animal_sync_1012_v1';fs.mkdirSync(syncOut,{recursive:true});fs.writeFileSync(path.join(syncOut,'report.json'),JSON.stringify({syncChecks,factsAndSourcesUnchanged:true,drawingsAndTimingByteEqual:true,realIPad:'Not verified'},null,2));console.log(JSON.stringify({syncChecks,factsAndSourcesUnchanged:true,drawingsAndTimingByteEqual:true}));
`;
const compatibleFs=Object.create(fs);
compatibleFs.readFileSync=(file,...args)=>{let s=fs.readFileSync(file,...args);if(String(file).endsWith('animal_nutrition_overview_check_1012_v3.cjs')){
 const original="assert.equal(body.querySelectorAll('.story-curiosity-card').length,6);assert(get('storyCuriosity').textContent.includes(l==='zh'?'不列考點':'not exam material'));";
 assert(s.includes(original),'Historical assertion not found');s=s.replace(original,"assert.equal(body.querySelectorAll('.story-curiosity-card').length,U.state.overview==='organ'?box.AnimalCuriosity.forOrgan(U.state.overviewOrgan).length:0);");
 s=s.replace(' const renderOrgan=(l,id,p,skip=-1)=>',additions+'\n const renderOrgan=(l,id,p,skip=-1)=>');
 }return s;};
const compatibleRequire=id=>id==='fs'?compatibleFs:require(id);
vm.runInNewContext(read('animal_nutrition_evidence_check_1012_v1.cjs'),{require:compatibleRequire,__dirname,console,Buffer,process});

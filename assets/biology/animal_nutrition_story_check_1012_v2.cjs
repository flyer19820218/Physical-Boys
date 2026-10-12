/* Native Canvas with real fonts, isolated DOM simulation. Browser QA is separate. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const dir=__dirname,base=path.resolve(dir,'../..'),out='/private/tmp/biology_animal_story_1012_v2';fs.mkdirSync(out,{recursive:true});
const preserved=['animal_nutrition_data_v1.js','animal_nutrition_draw_v2.js','animal_nutrition_atlas_1012_v1.js','animal_nutrition_villus_1012_v1.js','animal_nutrition_structure_zh_1012_v1.js','enzymes_model_v1.js','enzymes_model_v2.js','enzymes_geometry_v2.js','enzymes_draw_v2.js'];
for(const f of preserved){const now=fs.readFileSync(path.join(dir,f),'utf8'),before=cp.execFileSync('git',['show','37c742f:assets/biology/'+f],{cwd:base,encoding:'utf8'});assert.equal(f==='animal_nutrition_draw_v2.js'?now.replace('water,lipid,molecule','water,molecule'):now,before,f+' changed beyond the additive lipid export');}
for(const f of ['animal_digestive_atlas_ai_1012_v1.png','animal_intestine_openstax_v1.jpg'])assert(fs.readFileSync(path.join(dir,f)).equals(cp.execFileSync('git',['show','37c742f:assets/biology/'+f],{cwd:base,maxBuffer:10*1024*1024})),f+' edited');
const html=fs.readFileSync(path.join(base,'biology_animal_nutrition.html'),'utf8');for(const [,p]of html.matchAll(/(?:src|href)="(assets\/[^"?]+)(?:\?[^"]*)?"/g))assert(fs.existsSync(path.join(base,p)),p+' missing');assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(!html.includes('class="eyebrow"'));assert(!html.includes('animal_nutrition_journey_1012_v1.js'));
const newFiles=['animal_nutrition_polymer_1012_v2.js','animal_nutrition_story_data_1012_v2.js','animal_nutrition_story_1012_v2.js'];for(const f of newFiles)new vm.Script(fs.readFileSync(path.join(dir,f),'utf8'));
const extras=['animal_nutrition_journey_data_1012_v1.js','enzymes_model_v1.js','enzymes_model_v2.js','enzymes_geometry_v2.js','animal_nutrition_polymer_1012_v2.js','animal_nutrition_story_data_1012_v2.js'];
let harness=fs.readFileSync(path.join(dir,'animal_nutrition_structure_zh_check_1012_v1.cjs'),'utf8').split("assert.equal(body.querySelectorAll('.lesson').length,6)")[0]
 .replace("app=fs.readFileSync(path.join(__dirname,'animal_nutrition_v2.js'),'utf8')","app=fs.readFileSync(path.join(__dirname,'animal_nutrition_story_1012_v2.js'),'utf8')")
 .replace("const registry=new Map()",extras.map(f=>`vm.runInContext(fs.readFileSync(path.join(__dirname,'${f}'),'utf8'),box);`).join('\n')+'\nconst registry=new Map()')
 .replace('window:{AnimalData:A,AnimalDraw:D,AnimalOrgans:box.AnimalOrgans}', 'window:{AnimalData:A,AnimalDraw:D,AnimalOrgans:box.AnimalOrgans,AnimalAtlas:box.AnimalAtlas,AnimalJourney:box.AnimalJourney,AnimalStoryData:box.AnimalStoryData,AnimalPolymer:box.AnimalPolymer,EnzymesModel:box.EnzymesModel}')
 .replace('sandbox.window.AnimalLesson','sandbox.window.AnimalStory')
 .replace("out='/private/tmp/biology_animal_structure_zh_1012_v1'","out='/private/tmp/biology_animal_story_1012_v2'");
const tests=`
(async()=>{
 const F=box.AnimalStoryData,P=box.AnimalPolymer;let actions=0,renders=0;const clickTest=q=>{click(q);actions++;};
 const images={atlas:await loadImage(path.join(__dirname,'animal_digestive_atlas_ai_1012_v1.png')),histology:await loadImage(path.join(__dirname,'animal_intestine_openstax_v1.jpg'))};Object.assign(U.images,images);
 assert.equal(body.querySelectorAll('[role="tab"]').length,2);assert.equal(body.querySelectorAll('.lesson').length,1);assert.equal(pending.size,0);get('introScreen').emit('click');assert(get('introScreen').hidden);
 let unitCases=0;for(const kind of ['starch','protein'])for(const complete of [false,true])for(let i=0;i<=100;i++){
  const g=P.graph(i/100,complete,kind);assert.equal(g.positions.length,kind==='starch'?28:22);assert.equal(new Set(g.positions.map(p=>p.id)).size,g.unitCount);assert(g.positions.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));if(kind==='protein')assert(g.bonds.every(([a,b])=>b===a+1));unitCases++;
 }assert.equal(P.graph(0).bonds.length,27);assert.equal(P.graph(1).bonds.length,24);assert.equal(P.graph(1,true).bonds.length,0);
 let boundedTexts=0;const failures=[],samples=[];
 const raster=(l,kind,complete,p,skip=-1)=>{const cv=createCanvas(960,660),ctx=cv.getContext('2d'),records=[];let index=0;const fill=ctx.fillText.bind(ctx);ctx.fillText=(text,x,y)=>{const r={text,x,y,font:ctx.font,fillStyle:ctx.fillStyle,align:ctx.textAlign,baseline:ctx.textBaseline};records.push(r);const m=ctx.measureText(text),size=+ctx.font.match(/([0-9.]+)px/)[1],left=ctx.textAlign==='center'?x-m.width/2:x;if(skip<0){boundedTexts++;if(left<0||left+m.width>960||y-size/2<0||y+size/2>660)failures.push({l,kind,complete,p,...r,width:m.width});}if(index++!==skip)fill(text,x,y);};const translate=(z,e)=>l==='zh'?z:e;if(kind==='fat')P.lipid(ctx,p,translate);else P.draw(ctx,p,translate,{kind,complete});renders++;return {cv,records,pixels:ctx.getImageData(0,0,960,660).data};};
 for(const l of ['zh','en'])for(const kind of ['starch','protein','fat'])for(const complete of kind==='fat'?[false]:[false,true])for(const p of [0,.15,.3,.5,.59,.7,.8,.9,1]){const r=raster(l,kind,complete,p);if(l==='zh'&&!complete&&[0,.3,.7,1].includes(p)){fs.writeFileSync(path.join(out,kind+'_'+p+'.png'),r.cv.toBuffer('image/png'));if(kind==='starch')samples.push(r.cv);}}
 assert.equal(failures.length,0,JSON.stringify(failures));
 let visibilityChecks=0;const visibilityFailures=[];
 for(const l of ['zh','en'])for(const kind of ['starch','protein','fat'])for(const p of [0,.3,.7,1]){const full=raster(l,kind,false,p);for(let k=0;k<full.records.length;k++){
  const r=full.records[k],skip=raster(l,kind,false,p,k),mask=createCanvas(960,660),ctx=mask.getContext('2d');ctx.font=r.font;ctx.fillStyle='#ffffff';ctx.textAlign=r.align;ctx.textBaseline=r.baseline;ctx.fillText(r.text,r.x,r.y);const pixels=ctx.getImageData(0,0,960,660).data;let dead=0,maxDead=0,intended=0,visible=0;
  for(let x=0;x<960;x++){let want=0,see=0;for(let y=0;y<660;y++){const j=(y*960+x)*4;if(pixels[j+3]>32){want++;if(Math.max(...[0,1,2].map(c=>Math.abs(full.pixels[j+c]-skip.pixels[j+c])))>8)see++;}}intended+=want;visible+=see;if(want&&!see)maxDead=Math.max(maxDead,++dead);else dead=0;}
  if(maxDead>=4||visible===0)visibilityFailures.push({l,kind,p,text:r.text,maxDead,visible,intended});visibilityChecks++;
 }}assert.equal(visibilityFailures.length,0,JSON.stringify(visibilityFailures));
 for(const l of ['zh','en']){lang(l);clickTest('[data-action="page"][data-value="0"]');clickTest('[data-action="routePlay"]');run(18);assert.equal(U.state.route,7);assert(!U.state.playing);assert.equal(pending.size,0);
  clickTest('[data-action="page"][data-value="1"]');for(let station=0;station<6;station++){
   clickTest('[data-action="station"][data-value="'+station+'"]');assert.equal(U.state.step,0);assert(!U.state.playing);
   for(let step=0;step<F.stops[station].steps.length;step++){clickTest('[data-action="step"][data-value="'+step+'"]');clickTest('[data-action="segmentPlay"]');run(.2);assert(U.state.elapsed>0);const cv=get('storyScene'),before=Buffer.from(cv.getContext('2d').getImageData(0,0,960,660).data);run(1);const after=Buffer.from(cv.getContext('2d').getImageData(0,0,960,660).data);if(!['structure','glands','chew'].includes(F.stops[station].steps[step].scene))assert(!before.equals(after),'No motion '+l+'/'+station+'/'+step);
    clickTest('[data-action="pause"]');const elapsed=U.state.elapsed;run(1);assert.equal(U.state.elapsed,elapsed);clickTest('[data-action="fullscreen"]');assert(U.state.expanded);clickTest('[data-action="fullscreen"]');assert(!U.state.expanded);input('storyProgress',100);assert.equal(U.progress(),1);U.draw();
   }
   clickTest('[data-action="stationPlay"]');run(F.stops[station].steps.reduce((n,v)=>n+v.seconds,0)+2);assert.equal(U.state.step,F.stops[station].steps.length-1);assert(!U.state.playing);assert.equal(pending.size,0);
  }
 }
 clickTest('[data-action="station"][data-value="3"]');clickTest('[data-action="step"][data-value="7"]');for(const id of ['glucose','amino','starch','protein']){clickTest('[data-action="absorb"][data-value="'+id+'"]');assert.equal(U.state.absorb,id);U.draw();}
 clickTest('[data-action="station"][data-value="1"]');clickTest('[data-action="step"][data-value="1"]');clickTest('[data-action="segmentPlay"]');run(.2);document.hidden=true;emit('visibilitychange',{});assert.equal(pending.size,0);document.hidden=false;emit('visibilitychange',{});run(.2);assert(U.state.playing);
 const cv=get('storyScene');pointer('pointerdown',cv,1,300,300);pointer('pointerdown',cv,2,500,300);pointer('pointermove',cv,2,700,300);assert.equal(U.state.zoom,2);pointer('pointerup',cv,1,300,300);pointer('pointerup',cv,2,700,300);clickTest('[data-action="resetView"]');assert.equal(U.state.zoom,1);
 const contact=createCanvas(1920,1320);samples.forEach((cv,i)=>contact.getContext('2d').drawImage(cv,(i%2)*960,Math.floor(i/2)*660));fs.writeFileSync(path.join(out,'starch_contact.png'),contact.toBuffer('image/png'));
 const report={preservedBaseline:'37c742f',preservedFiles:${JSON.stringify(preserved)},mainTabs:2,overviewRouteStops:8,detailedStations:6,detailedSegments:F.stops.map(s=>s.steps.length),unitConservationCases:unitCases,starchUnits:28,proteinUnits:22,polymerNativeRenders:renders,labelBoundsChecks:boundedTexts,textVisibilityChecks:visibilityChecks,visibilityFailures,controllerActions:actions,singleRAF:true,pauseAndCompletion:true,bilingual:true,pinchPan:true,actualBrowserAndPhysicalIPad:'Separate browser validation required; physical iPad not verified'};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});`;
vm.runInNewContext(harness+tests,{require,__dirname,console,Buffer,process});

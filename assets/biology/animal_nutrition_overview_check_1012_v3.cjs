/* Extend the previously verified story suite; native Canvas and substitute DOM are not real iPad tests. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),cp=require('child_process');
const base=path.resolve(__dirname,'../..');
for(const f of ['animal_nutrition_draw_v2.js','animal_nutrition_atlas_1012_v1.js','animal_nutrition_story_data_1012_v2.js','animal_nutrition_polymer_1012_v2.js','animal_nutrition_story_1012_v2.css'])assert.equal(fs.readFileSync(path.join(__dirname,f),'utf8'),cp.execFileSync('git',['show','d51e0be:assets/biology/'+f],{cwd:base,encoding:'utf8'}),'Protected module changed: '+f);
for(const f of ['animal_digestive_atlas_ai_1012_v1.png','animal_intestine_openstax_v1.jpg'])assert(fs.readFileSync(path.join(__dirname,f)).equals(cp.execFileSync('git',['show','d51e0be:assets/biology/'+f],{cwd:base,maxBuffer:10*1024*1024})),'Original image changed: '+f);
for(const f of ['animal_nutrition_overview_1012_v3.js','animal_nutrition_curiosity_1012_v1.js','animal_nutrition_story_1012_v2.js'])new vm.Script(fs.readFileSync(path.join(__dirname,f),'utf8'));
const old=cp.execFileSync('git',['show','d51e0be:assets/biology/animal_nutrition_story_1012_v2.js'],{cwd:base,encoding:'utf8'}),now=fs.readFileSync(path.join(__dirname,'animal_nutrition_story_1012_v2.js'),'utf8');
for(const [start,end]of [['function overview(c)','function zoom(c,st,p)'],['function zoom(c,st,p)','function draw()']]){
 const extract=s=>{const a=s.indexOf(start),b=s.indexOf(end,a+1);assert(a>=0&&b>a,'Drawing function boundary not found');return s.slice(a,b)};
 assert.equal(extract(now),extract(old),'Original drawing function changed: '+start);
}
let suite=fs.readFileSync(path.join(__dirname,'animal_nutrition_story_check_1012_v2.cjs'),'utf8')
 .replace("'animal_nutrition_story_data_1012_v2.js'];","'animal_nutrition_story_data_1012_v2.js','animal_nutrition_overview_1012_v3.js','animal_nutrition_curiosity_1012_v1.js'];")
 .replace('AnimalPolymer:box.AnimalPolymer,EnzymesModel:box.EnzymesModel','AnimalPolymer:box.AnimalPolymer,AnimalOverview:box.AnimalOverview,AnimalCuriosity:box.AnimalCuriosity,EnzymesModel:box.EnzymesModel');
const extra=`
 const O=box.AnimalOverview,organOut='/private/tmp/biology_animal_overview_1012_v3';fs.mkdirSync(organOut,{recursive:true});
 const overviewReport={manualZooms:0,tourGroups:0,diagramLabelTaps:0,pixelMovement:0,sourceAspectCases:0,labelVisibilityChecks:0,originalFunctionsUnchanged:true};
 for(const l of ['zh','en']){lang(l);clickTest('[data-action="page"][data-value="0"]');
  assert.equal(body.querySelectorAll('.story-curiosity-card').length,6);assert(get('storyCuriosity').textContent.includes(l==='zh'?'不列考點':'not exam material'));
  for(const group of ['tract','glands']){
   clickTest('[data-action="overviewGroup"][data-value="'+group+'"]');
   for(const id of O.groups[group]){
    clickTest('[data-action="organ"][data-value="'+id+'"]');assert.equal(U.state.overviewOrgan,id);assert.equal(U.state.overview,'organ');assert(U.state.playing);assert.equal(U.state.scope,'organ');
    const cv=get('storyScene'),before=Buffer.from(cv.getContext('2d').getImageData(0,0,960,660).data);run(1);const after=Buffer.from(cv.getContext('2d').getImageData(0,0,960,660).data);assert(!before.equals(after),'Zoom not moving '+l+'/'+id);overviewReport.pixelMovement++;
    run(1);assert(!U.state.playing);assert.equal(pending.size,0);assert.equal(U.state.elapsed,O.zoomSeconds);assert(get('storyCaption').textContent.includes(O.record(id).name[l==='zh'?0:1]));overviewReport.manualZooms++;
    const end=O.layout(id,O.zoomSeconds),magnification=end.dest.w/end.crop[2]/(box.AnimalAtlas.placement.w/1024);assert(magnification>=2,'Organ not enlarged '+id);assert(end.point.x>=end.dest.x&&end.point.x<=end.dest.x+end.dest.w&&end.point.y>=end.dest.y&&end.point.y<=end.dest.y+end.dest.h);
    if(l==='zh')fs.writeFileSync(path.join(organOut,id+'.png'),cv.canvas.toBuffer('image/png'));
   }
   clickTest('[data-action="organPlay"]');run(2);clickTest('[data-action="pause"]');const t=U.state.elapsed;run(1);assert.equal(U.state.elapsed,t);assert.equal(pending.size,0);clickTest('[data-action="pause"]');run(O.tourSeconds*O.groups[group].length+2);assert.equal(U.state.overviewOrgan,O.groups[group].at(-1));assert(!U.state.playing);assert.equal(pending.size,0);overviewReport.tourGroups++;
   clickTest('[data-action="organPrevious"]');assert.equal(U.state.overviewOrgan,O.groups[group].at(-2));run(2);clickTest('[data-action="organNext"]');assert.equal(U.state.overviewOrgan,O.groups[group].at(-1));run(2);
   clickTest('[data-action="overviewWhole"]');const ns={anatomyMode:group==='tract'?'tract':'glands',anatomyView:'atlas',zoomOrgan:false,organ:U.state.overviewOrgan},labels=D.anatomyLabels(ns).concat(group==='tract'?[{id:'rectum',x:699,y:582,w:245,h:48}]:[]);
   for(const b of labels){if(U.state.overview==='organ')clickTest('[data-action="overviewWhole"]');const cv=get('storyScene');pointer('pointerdown',cv,92,b.x+b.w/2,b.y+b.h/2);pointer('pointerup',cv,92,b.x+b.w/2,b.y+b.h/2);assert.equal(U.state.overviewOrgan,b.id);assert.equal(U.state.overview,'organ');run(2);overviewReport.diagramLabelTaps++;}
  }
  clickTest('[data-action="routePlay"]');run(18);assert.equal(U.state.route,7);assert(!U.state.playing);assert.equal(U.state.overview,'whole');
  clickTest('[data-action="organ"][data-value="stomach"]');run(2);clickTest('[data-action="page"][data-value="1"]');clickTest('[data-action="page"][data-value="0"]');assert.equal(U.state.overviewOrgan,'stomach');assert.equal(U.state.elapsed,O.zoomSeconds);assert(!U.state.playing);
 }
 const renderOrgan=(l,id,p,skip=-1)=>{const cv=createCanvas(960,660),ctx=cv.getContext('2d'),texts=[];const original=ctx.drawImage.bind(ctx),fill=ctx.fillText.bind(ctx);ctx.drawImage=(...args)=>{const im=args[0],source=args.length===9?args[3]/args[4]:im.width/im.height,dest=args.length===9?args[7]/args[8]:args[3]/args[4];assert(Math.abs(source-dest)<1e-7,'Image stretched '+id);if(skip<0)overviewReport.sourceAspectCases++;original(...args);};let index=0;ctx.fillText=(text,x,y)=>{const r={text,x,y,font:ctx.font,align:ctx.textAlign,baseline:ctx.textBaseline};texts.push(r);const m=ctx.measureText(text),left=ctx.textAlign==='center'?x-m.width/2:x;assert(left>=0&&left+m.width<=960,'Label overflow '+id+'/'+text);if(index++!==skip)fill(text,x,y);};O.draw(ctx,images,(z,e)=>l==='zh'?z:e,id,p);return {cv,texts,pixels:ctx.getImageData(0,0,960,660).data};};
 for(const l of ['zh','en'])for(const id of [...O.groups.tract,...O.groups.glands])for(const p of [0,.6,1.2]){
  const full=renderOrgan(l,id,p);for(let i=0;i<full.texts.length;i++){const r=full.texts[i],missing=renderOrgan(l,id,p,i),mask=createCanvas(960,660),ctx=mask.getContext('2d');ctx.font=r.font;ctx.fillStyle='#ffffff';ctx.textAlign=r.align;ctx.textBaseline=r.baseline;ctx.fillText(r.text,r.x,r.y);const alpha=ctx.getImageData(0,0,960,660).data;let dead=0,maxDead=0,visible=0;for(let x=0;x<960;x++){let wanted=0,seen=0;for(let y=0;y<660;y++){const j=(y*960+x)*4;if(alpha[j+3]>32){wanted++;if(Math.max(...[0,1,2].map(k=>Math.abs(full.pixels[j+k]-missing.pixels[j+k])))>8)seen++;}}visible+=seen;if(wanted&&!seen)maxDead=Math.max(maxDead,++dead);else dead=0;}assert(visible>0&&maxDead<4,'Invisible label '+l+'/'+id+'/'+r.text);overviewReport.labelVisibilityChecks++;}
 }
 fs.writeFileSync(path.join(organOut,'report.json'),JSON.stringify(overviewReport,null,2));console.log(JSON.stringify(overviewReport,null,2));
`;
assert(suite.includes('AnimalOverview:box.AnimalOverview')&&suite.includes('AnimalCuriosity:box.AnimalCuriosity'),'Harness injection missing');
suite=suite.replace(' const report={preservedBaseline:',extra+'\n const report={preservedBaseline:');
vm.runInNewContext(suite,{require,__dirname,console,Buffer,process});

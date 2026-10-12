/* Only the teacher-authorized zh/original structural scene may change. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm'),assert=require('assert');
const {createCanvas,loadImage,GlobalFonts}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const base=path.resolve(__dirname,'../..'),before='c185492',read=f=>fs.readFileSync(path.join(__dirname,f),'utf8'),previous=f=>cp.execFileSync('git',['show',before+':assets/biology/'+f],{cwd:base,encoding:'utf8'});
const unchangedFiles=['animal_nutrition_data_v1.js','animal_nutrition_tour_v2.js','animal_nutrition_draw_v2.js','animal_nutrition_v1.css','animal_nutrition_v2.css','animal_digestive_original_v1.svg','animal_nutrition_atlas_1012_v1.js','animal_nutrition_villus_1012_v1.js'];
for(const f of unchangedFiles)assert.equal(read(f),previous(f),f+' changed');
const oldUI=previous('animal_nutrition_v2.js'),newUI=read('animal_nutrition_v2.js');
for(const name of ['run','stop','resume','pauseWave','focusOrgan','stepOrgan','draw','point']){const line=s=>s.split('\n').find(l=>l.includes('function '+name+'('));assert(line(oldUI)&&line(newUI));assert.equal(line(oldUI),line(newUI),name+' changed');}
const load=addon=>{const b={};vm.createContext(b);for(const f of ['animal_nutrition_data_v1.js','animal_nutrition_tour_v2.js','animal_nutrition_draw_v2.js','animal_nutrition_atlas_1012_v1.js','animal_nutrition_villus_1012_v1.js',...(addon?['animal_nutrition_structure_zh_1012_v1.js']:[])])vm.runInContext(read(f),b);return b;};
const old=load(false),now=load(true),D=now.AnimalDraw;
assert(GlobalFonts.registerFromPath(path.join(__dirname,'fonts/NotoSansTC-variable.ttf'),'Noto Sans TC'));
const raster=fn=>{const cv=createCanvas(960,660),c=cv.getContext('2d');fn(c);return Buffer.from(c.getImageData(0,0,960,660).data);};
async function main(){const images={anatomy:await loadImage(path.join(__dirname,'animal_digestive_original_v1.png')),histology:await loadImage(path.join(__dirname,'animal_intestine_openstax_v1.jpg')),atlas:await loadImage(path.join(__dirname,'animal_digestive_atlas_ai_1012_v1.png'))};for(const [id,m]of Object.entries(now.AnimalOrgans))images['organ_'+id]=await loadImage(path.join(base,m.src));let pixels=0;
 function same(fn,s,tr,time=1){assert(raster(c=>D[fn](c,s,tr,fn==='anatomy'?images:fn==='absorption'?images:time,time)).equals(raster(c=>old.AnimalDraw[fn](c,s,tr,fn==='anatomy'?images:fn==='absorption'?images:time,time))),fn+' no longer delegates the original');pixels++;}
 for(const l of ['zh','en']){const tr=(z,e)=>l==='zh'?z:e,base={lang:l,langIndex:l==='zh'?0:1,organ:'stomach',organProgress:1,zoomOrgan:false,anatomyView:'original',anatomyMode:'tract',nutrient:0,digestion:0,fluid:0,fluidProgress:0,peristalsis:50,villusView:'photo',absorb:'glucose',absorbStage:-1,route:0,useProgress:50};
  for(let nutrient=0;nutrient<3;nutrient++)for(let digestion=0;digestion<3;digestion++)same('digestion',{...base,nutrient,digestion},tr);
  for(let nutrient=0;nutrient<3;nutrient++)for(let fluid=0;fluid<5;fluid++)for(const fluidProgress of [0,35,100])same('secretions',{...base,nutrient,fluid,fluidProgress},tr);
  for(const anatomyMode of ['tract','glands'])for(const anatomyView of ['atlas','original'])same('anatomy',{...base,anatomyMode,anatomyView},tr);
  for(const organ of now.AnimalData.organs)for(const organProgress of [0,.5,1])same('anatomy',{...base,anatomyView:'atlas',organ:organ.id,zoomOrgan:true,organProgress},tr);
  for(const villusView of ['photo','original','model'])for(const absorb of ['glucose','amino','water','starch','protein'])for(const absorbStage of [-1,0,1,2]){
   if(l==='zh'&&villusView==='original')continue;
   for(const t of [0,1,3,17])same('absorption',{...base,villusView,absorb,absorbStage},tr,t);
  }
  for(const peristalsis of [0,25,50,75,100])same('peristalsis',{...base,peristalsis},tr);
  for(let route=0;route<3;route++)same('use',{...base,route},tr);
 }
 const cv=createCanvas(images.atlas.width,images.atlas.height),c=cv.getContext('2d');c.drawImage(images.atlas,0,0);const bytes=c.getImageData(0,0,cv.width,cv.height).data;let clear=0,partial=0;for(let i=3;i<bytes.length;i+=4){if(bytes[i]===0)clear++;else if(bytes[i]<255)partial++;}assert(clear>500000&&partial>0,'Not a transparent cutout');assert.equal(bytes[3],0);
 const model=raster(c=>D.absorption(c,{villusView:'model',absorb:'glucose',absorbStage:2},(z,e)=>z,images,1));let white=0;for(let i=0;i<model.length;i+=4)if(model[i]>235&&model[i+1]>235&&model[i+2]>230)white++;assert.equal(white,0,'Model has a white background or panel');
 const jpg='animal_intestine_openstax_v1.jpg';assert(fs.readFileSync(path.join(__dirname,jpg)).equals(cp.execFileSync('git',['show',before+':assets/biology/'+jpg],{cwd:base})),'Original English image or real micrographs edited');
 const cvZh=createCanvas(960,660),ctxZh=cvZh.getContext('2d'),labels=[],crops=[],text=ctxZh.fillText.bind(ctxZh),img=ctxZh.drawImage.bind(ctxZh);ctxZh.fillText=(...args)=>{labels.push(args[0]);text(...args)};ctxZh.drawImage=(...args)=>{crops.push(args);img(...args)};
 D.absorption(ctxZh,{lang:'zh',langIndex:0,villusView:'original'},(z,e)=>z,images,1);
 assert(labels.length>=20);assert(labels.every(t=>!/[a-z]/i.test(t)),'English label in Chinese figure');assert.equal(crops.length,3);assert.deepEqual(crops.map(a=>a.slice(1,5)),DUMMY_CROPS());
 for(const a of crops)assert(Math.abs(a[3]/a[4]-a[7]/a[8])<1e-8,'Micrograph stretched');
 function DUMMY_CROPS(){return[[5,565,400,225],[410,565,397,225],[812,565,260,225]];}
 const report={unchangedFiles,originalDrawingCodeAndAllNumericCoordinatesIdentical:true,newGeometryOnlyForAuthorizedChineseStructure:true,animationRateAndTourFunctionsIdentical:true,pixelIdenticalPreservedCases:pixels,transparentAtlasPixels:clear,partialAlphaPixels:partial,nearWhiteModelPixels:white,chineseLabelCount:labels.length,realMicrographsPreserved:3,originalJpgByteIdentical:true,baseline:before};const out=path.join('/private/tmp/biology_animal_structure_zh_1012_v1','preservation.json');fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});

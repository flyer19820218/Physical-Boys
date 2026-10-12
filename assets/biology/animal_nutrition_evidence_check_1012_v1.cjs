/* Real native raster tests plus the existing controller/organ regression suite.
 * Real video decoding, browser playback and iPad CSS are verified separately. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process'),crypto=require('crypto');
const {createCanvas,loadImage,GlobalFonts}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const base=path.resolve(__dirname,'../..'),out='/private/tmp/biology_animal_evidence_1012_v1';fs.mkdirSync(out,{recursive:true});
for(const name of ['NotoSansTC','JetBrainsMono'])assert(GlobalFonts.registerFromPath(path.join(__dirname,'fonts',name+'-variable.ttf'),name==='NotoSansTC'?'Noto Sans TC':'JetBrains Mono'));
for(const f of ['animal_nutrition_draw_v2.js','animal_nutrition_villus_1012_v1.js','animal_nutrition_polymer_1012_v2.js','animal_nutrition_story_data_1012_v2.js','animal_nutrition_overview_1012_v3.js','animal_nutrition_story_1012_v2.css'])assert.equal(fs.readFileSync(path.join(__dirname,f),'utf8'),cp.execFileSync('git',['show','8c6f45d:assets/biology/'+f],{cwd:base,encoding:'utf8'}),'Protected code changed: '+f);
for(const f of ['animal_cutaway_ai_v2.jpg','animal_intestine_openstax_v1.jpg'])assert(fs.readFileSync(path.join(__dirname,f)).equals(cp.execFileSync('git',['show','8c6f45d:assets/biology/'+f],{cwd:base,maxBuffer:10e6})),'Original image changed: '+f);
let overview=fs.readFileSync(path.join(__dirname,'animal_nutrition_overview_check_1012_v3.cjs'),'utf8')
 .replace("'animal_nutrition_curiosity_1012_v1.js'];", "'animal_nutrition_curiosity_1012_v1.js','animal_nutrition_evidence_1012_v1.js'];")
 .replace('AnimalCuriosity:box.AnimalCuriosity,','AnimalCuriosity:box.AnimalCuriosity,AnimalEvidence:box.AnimalEvidence,');
assert(overview.includes('AnimalEvidence:box.AnimalEvidence'));
vm.runInNewContext(overview,{require,__dirname,console,Buffer,process});
const box={};vm.createContext(box);for(const f of ['animal_nutrition_data_v1.js','animal_nutrition_draw_v2.js','animal_nutrition_evidence_1012_v1.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),box);
(async()=>{
 const E=box.AnimalEvidence,images={cell:await loadImage(path.join(__dirname,'animal_cutaway_ai_v2.jpg')),histology:await loadImage(path.join(__dirname,'animal_intestine_openstax_v1.jpg'))};
 assert.equal(E.phase(0),0);assert.equal(E.phase(.5),1);assert.equal(E.phase(1),2);
 let renders=0,aspectCases=0,labelCases=0;
 for(const lang of ['zh','en'])for(const focus of ['cell','mitochondrion'])for(const p of [0,.15,.34,.5,.67,.85,1]){
  const cv=createCanvas(960,660),c=cv.getContext('2d'),fill=c.fillText.bind(c),draw=c.drawImage.bind(c);
  c.fillText=(t,x,y)=>{const m=c.measureText(t),size=+c.font.match(/([\d.]+)px/)[1],left=c.textAlign==='center'?x-m.width/2:x;assert(left>=0&&left+m.width<=960&&y-size/2>=0&&y+size/2<=660,'Label clipped '+t);labelCases++;fill(t,x,y);};
  c.drawImage=(...a)=>{assert(Math.abs(a[3]/a[4]-a[7]/a[8])<1e-7,'Image distorted');aspectCases++;draw(...a);};
  E.draw(c,p,(z,e)=>lang==='zh'?z:e,images,focus);renders++;
  if(lang==='zh'&&[0,.85].includes(p))fs.writeFileSync(path.join(out,focus+'_'+E.phase(p)+'.png'),cv.toBuffer('image/png'));
 }
 const report={nativeRenders:renders,imageAspectCases:aspectCases,labelBoundsCases:labelCases,originalDrawingsAndImagesUnchanged:true,video:'Browser playback/decoding checked separately',physicalIPad:'Not verified'};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

/* Scoped cute three-legged lipid + separation regression. Native Canvas, not iPad/Safari. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const {createCanvas,GlobalFonts}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const repo=path.resolve(__dirname,'../..'),before='0257e46',drawPath='assets/biology/animal_nutrition_draw_v2.js';
const previous=f=>cp.execFileSync('git',['show',before+':'+f],{cwd:repo,encoding:'utf8'});
const data=fs.readFileSync(path.join(__dirname,'animal_nutrition_data_v1.js'),'utf8');
const load=source=>{const box={};vm.createContext(box);vm.runInContext(data,box);vm.runInContext(source,box);return box;};
const old=load(previous(drawPath)),now=load(fs.readFileSync(path.join(repo,drawPath),'utf8')),D=now.AnimalDraw;
assert(GlobalFonts.registerFromPath(path.join(__dirname,'fonts/NotoSansTC-variable.ttf'),'Noto Sans TC'));
const image=fn=>{const cv=createCanvas(960,660),c=cv.getContext('2d');fn(c);return Buffer.from(c.getImageData(0,0,960,660).data);};
let unchanged=0;
for(const key of Object.keys(old.AnimalDraw).filter(k=>typeof old.AnimalDraw[k]==='function'&&!['molecule','secretions'].includes(k)))assert.equal(D[key].toString(),old.AnimalDraw[key].toString(),key+' changed');
for(const f of ['animal_nutrition_data_v1.js','animal_nutrition_tour_v2.js','animal_nutrition_v2.js','animal_nutrition_v1.css','animal_nutrition_v2.css'])assert.equal(fs.readFileSync(path.join(__dirname,f),'utf8'),previous('assets/biology/'+f),f+' changed');
for(const n of [0,1])for(const small of [false,true])for(const phase of [0,.4,1,3]){assert(image(c=>D.molecule(c,n,480,330,phase,small)).equals(image(c=>old.AnimalDraw.molecule(c,n,480,330,phase,small))),'Other molecular symbols changed');unchanged++;}
for(const lang of ['zh','en']){const tr=(z,e)=>lang==='zh'?z:e,base={langIndex:lang==='zh'?0:1,nutrient:0,digestion:0,fluid:0,fluidProgress:0};
 for(const nutrient of [0,1])for(const digestion of [0,1,2]){const s={...base,nutrient,digestion};assert(image(c=>D.digestion(c,s,tr,1)).equals(image(c=>old.AnimalDraw.digestion(c,s,tr,1))));unchanged++;}
 for(const nutrient of [0,1,2])for(let fluid=0;fluid<5;fluid++)for(const fluidProgress of [0,35,100]){const effect=now.AnimalData.fluidEffect(nutrient,fluid);if(nutrient===2&&!(effect===2&&fluidProgress>=5))continue;const s={...base,nutrient,fluid,fluidProgress};assert(image(c=>D.secretions(c,s,tr,1)).equals(image(c=>old.AnimalDraw.secretions(c,s,tr,1))),'Oil droplets or other nutrients changed');unchanged++;}
}
function parts(fn){const c=createCanvas(960,660).getContext('2d'),begin=c.beginPath.bind(c),move=c.moveTo.bind(c),fill=c.fill.bind(c),result=[];let start;
 c.beginPath=()=>{start=null;begin();};c.moveTo=(x,y)=>{if(!start){const t=c.getTransform();start={x:t.a*x+t.c*y+t.e,y:t.b*x+t.d*y+t.f};}move(x,y);};c.fill=(...args)=>{if(typeof c.fillStyle!=='string'&&start)result.push(start);fill(...args);};fn(c);return result;
}
const attached=parts(c=>D.molecule(c,2,480,322)),detached=parts(c=>D.secretions(c,{nutrient:2,fluid:3,fluidProgress:100,langIndex:0},(z,e)=>z,1));
assert.equal(attached.length,4,'One body and exactly three legs');assert.equal(detached.length,4,'Nothing vanishes during digestion');
assert.deepEqual(attached.slice(0,3).map(p=>p.x),[440,470,500]);assert.deepEqual(detached.slice(0,3).map(p=>p.x),[488,525,562]);assert(attached[3].x===432&&detached[3].x===377,'Body survives with the same path and smile');
const out='/private/tmp/animal_lipid_cute_1012_v2';fs.mkdirSync(out,{recursive:true});const contact=createCanvas(1920,1320),cc=contact.getContext('2d');let frames=0;
for(const lang of ['zh','en']){let last;
 for(let progress=0;progress<=100;progress+=5){const state={nutrient:2,fluid:3,fluidProgress:progress,langIndex:lang==='zh'?0:1},cv=createCanvas(960,660),ctx=cv.getContext('2d');D.secretions(ctx,state,(z,e)=>lang==='zh'?z:e,1);const raster=Buffer.from(ctx.getImageData(0,0,960,660).data);
  if(progress>=10&&progress<=90)assert(!raster.equals(last),'Feet must move apart, not jump between still frames');last=raster;frames++;
  if(lang==='zh'&&[0,35,70,100].includes(progress)){const at=[0,35,70,100].indexOf(progress);cc.drawImage(cv,(at%2)*960,Math.floor(at/2)*660);fs.writeFileSync(path.join(out,'lipid_'+progress+'.png'),cv.toBuffer('image/png'));}
  assert.equal(parts(c=>D.secretions(c,state,(z,e)=>lang==='zh'?z:e,1)).length,4,'One body and three feet at every frame');
 }
}
fs.writeFileSync(path.join(out,'contact.png'),contact.toBuffer('image/png'));
assert(!image(c=>D.molecule(c,2,480,330)).equals(image(c=>old.AnimalDraw.molecule(c,2,480,330))),'Lipid symbol must visibly change');
console.log(JSON.stringify({threeFeet:3,oneBody:1,conservedPartsEveryFrame:4,bilingualSeparationFrames:frames,unchangedPixelCases:unchanged,otherDrawingFunctionsIdentical:true,dataUIRatesAndCSSUnchanged:true,oilDropletsUnchanged:true,contact:path.join(out,'contact.png')},null,2));

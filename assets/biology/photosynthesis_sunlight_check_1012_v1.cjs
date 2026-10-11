/* Native render regression checks; not a claim of real iPad/Safari testing. */
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {createCanvas,loadImage,GlobalFonts}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const M=require('./photosynthesis_model_v1.js'),D=require('./photosynthesis_sunlight_1012_v1.js'),old=require('./photosynthesis_teacher_lab_1011_v1.js');
const dir='/private/tmp/photosynthesis_sunlight_1012_v1';fs.mkdirSync(dir,{recursive:true});
assert(GlobalFonts.registerFromPath(path.join(__dirname,'fonts/NotoSansTC-variable.ttf'),'Noto Sans TC'));
assert(GlobalFonts.registerFromPath(path.join(__dirname,'fonts/JetBrainsMono-variable.ttf'),'JetBrains Mono'));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async()=>{
 const images={canvasFactory:createCanvas,pottedPlant:await loadImage(path.join(__dirname,'photosynthesis_potted_bean_ai_1011_v1.png')),sunlitGarden:await loadImage(path.join(__dirname,'photosynthesis_sunlit_garden_ai_1012_v1.png'))};
 const bounds=[],render=(u,l,draw=D,file)=>{const cv=createCanvas(960,620),c=cv.getContext('2d'),fill=c.fillText.bind(c);c.fillText=(txt,x,y)=>{const w=c.measureText(txt).width,left=c.textAlign==='center'?x-w/2:x;if(left<0||left+w>960||y<10||y>610)bounds.push({txt,x,y,w,l});fill(txt,x,y);};draw.lab(c,u,l,images);if(file)fs.writeFileSync(path.join(dir,file+'.png'),cv.toBuffer('image/png'));return Buffer.from(c.getImageData(0,0,960,620).data);};
 const pixelDifference=(a,b,roi=[0,0,960,620])=>{let n=0;const [x,y,w,h]=roi;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=(yy*960+xx)*4;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])n++;}return n;};
 let unchanged=0;
 for(const lang of ['zh','en'])for(const step of [0,2,3,4,5,6,7,8])for(const t of [null,0,1,3.9]){const u=M.create();u.tab=4;u.lab.step=step;if(t!==null&&step<8)u.lab.motion={step,t,duration:4};assert(render(u,lang).equals(render(u,lang,old)),'Outside the authorized light exposure: '+step);unchanged++;}
 for(const key of Object.keys(old).filter(k=>k!=='lab'))assert.strictEqual(D[key],old[key],'Changed inherited function '+key);
 const poses=[];for(const y of [455,500,550,576])for(const x of [0,100,200,384]){const a=D.sunlightPose(x,y,0),b=D.sunlightPose(x,y,1);assert.deepEqual(a,b,'Pot must not sway');poses.push({x,y});}
 const s0=D.sunlightPose(170,100,0),s1=D.sunlightPose(170,100,1);assert(Math.hypot(s0.x-s1.x,s0.y-s1.y)>5,'Upper stem must bend');
 const l0=D.sunlightPose(100,230,0),l1=D.sunlightPose(100,230,1);assert(Math.hypot(l0.x-l1.x,l0.y-l1.y)>1,'Leaf must move independently');
 const changes=[];let renderMs=0,count=0;
 for(const lang of ['zh','en'])for(let k=0;k<36;k++){const u=M.create();u.tab=4;u.lab.step=1;u.lab.motion={step:1,t:k/6,duration:6};const start=performance.now();render(u,lang,D,'sun_'+lang+'_'+String(k).padStart(2,'0'));renderMs+=performance.now()-start;count++;}
 for(const lang of ['zh','en']){const u=M.create();u.tab=4;u.lab.step=1;u.lab.motion={step:1,t:1,duration:6};const a=render(u,lang);u.lab.motion.t=2;const b=render(u,lang);const leafPixels=pixelDifference(a,b,[330,95,300,370]);assert(leafPixels>1000);changes.push({lang,leafPixels,scenePixels:pixelDifference(a,b)});u.paused=true;const paused=render(u,lang);M.tick(u,1);assert(paused.equals(render(u,lang)),'Paused frame must be byte-identical');}
 assert.deepEqual(bounds,[],'Canvas label bounds');
 const u=M.create();u.tab=4;u.lab.prediction='light';for(let step=0;step<8;step++){assert(M.act(u.lab,'next'));assert.equal(u.lab.motion.duration,step===1?6:4);M.tick(u,u.lab.motion.duration);assert.equal(u.lab.step,step+1);}M.act(u.lab,'reset');assert.equal(u.lab.step,0);assert.equal(u.lab.prediction,null);
 assert.equal(hash(path.join(__dirname,'photosynthesis_model_v1.js')),'603e78d63458f283141ac5ae8542b0de1e677f6a76cbf287cc87dd4370c6cdf9');
 const app=fs.readFileSync(path.join(__dirname,'photosynthesis_v9.js'),'utf8');assert(app.includes("sunlitGarden:'assets/biology/photosynthesis_sunlit_garden_ai_1012_v1.png'"));
 const sheet=createCanvas(1920,1240),sc=sheet.getContext('2d');for(const [i,name] of ['sun_zh_03','sun_zh_15','sun_zh_28','sun_en_15'].entries())sc.drawImage(await loadImage(path.join(dir,name+'.png')),(i%2)*960,Math.floor(i/2)*620);fs.writeFileSync(path.join(dir,'contact.png'),sheet.toBuffer('image/png'));
 const report={unchangedNonSunlightRenders:unchanged,checkedFixedPotPoints:poses.length,renderedTimelapseFrames:count,meanNativeRenderMs:renderMs/count,changes,pausedByteIdentical:true,modelUnchanged:true,modelEightActionsPassed:true,canvasTextBoundsFailures:bounds.length,background:'Original built-in ImageGen asset; AI simulation, not filmed footage',browser:'Native checks only; actual browser tests reported separately'};
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

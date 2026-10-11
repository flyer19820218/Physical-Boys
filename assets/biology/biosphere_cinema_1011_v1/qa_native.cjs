'use strict';
// This is a native Canvas test, NOT a browser/WebGL/iPad test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const modules='/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {createCanvas,loadImage,GlobalFonts}=require(modules+'@napi-rs/canvas');
const sharp=require(modules+'sharp');
const api=require('../biosphere_cinema_1011_v1.js'),base=__dirname,output=path.join(base,'qa_20s_apple');
async function main(){
 fs.mkdirSync(output,{recursive:true});
 GlobalFonts.registerFromPath(path.join(base,'../fonts/NotoSansTC-variable.ttf'),'Noto Sans TC');
 GlobalFonts.registerFromPath(path.join(base,'../fonts/JetBrainsMono-variable.ttf'),'JetBrains Mono');
 const assets={};for(const [key,file] of Object.entries({micro:'paramecium_1800.jpg',habitat:'mallard_1920.jpg',earth:'earth_july_4096.jpg'}))assets[key]=await loadImage(path.join(base,file));
 const globe=createCanvas(2560,1440),g=api.softwareGlobe(globe,assets.earth,createCanvas),s=api.sceneAt(api.DURATION);g.render(s);
 // Do not rewrite the already reviewed runtime fallback as part of a QA run.
 assets.fallback=await loadImage(path.join(base,'earth_globe_fallback.png'));
 const canvas=createCanvas(1280,720),renderer=new api.Renderer(canvas,assets,{createCanvas,renderer:'software'});
 const stamps=[0,2,3.5,4,5,7,8.2,9,10,12,13,14.2,15,16,17.5,18.5,19.2,20];
 const pixels=[];
 for(const time of stamps){renderer.draw(time);fs.writeFileSync(path.join(output,`frame_${String(time).replace('.','_')}.png`),canvas.toBuffer('image/png'));}
 for(const time of [1,3,5,8,10,13,15,18]){
  renderer.draw(time);const before=canvas.getContext('2d').getImageData(0,0,1280,720).data;
  renderer.draw(time+1);const after=canvas.getContext('2d').getImageData(0,0,1280,720).data;let delta=0,changed=0;
  for(let i=0;i<before.length;i+=4){const d=Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2]);delta+=d;if(d>12)changed++;}
  assert(changed>100,`Animation stuck near ${time}s`);pixels.push({time,changedPixels:changed,meanChannelDelta:delta/(1280*720*3)});
 }
 const end=api.sceneAt(20),close=api.sceneAt(10);
 assert.equal(end.magnification,1);assert.equal(close.magnification,4);
 assert(Math.abs((end.outer-end.inner)/end.radius-20/6371)<1e-12);
 assert(Math.abs((close.outer-close.inner)/close.radius-80/6371)<1e-12);
 let last=Infinity;for(let t=31*20/48;t<=44*20/48;t+=.04){const r=api.sceneAt(t).radius;assert(r<=last+1e-8);last=r;}
 assert.equal(api.sceneAt(-4).time,0);assert.equal(api.sceneAt(99).time,20);
 assert.equal(api.DURATION,20);assert.equal(end.appleAlpha,1);assert.equal(close.appleAlpha,0);
 assert.equal(api.APPLE_DIAMETER_MM,100);assert(Math.abs(api.APPLE_LAYER_MM-.15696123057604772)<1e-12);
 for(const shot of api.SHOTS)assert(shot.at>=0&&shot.at<=20&&shot.end<=20);
 const report={kind:'Native Canvas, not browser',renderer:renderer.mode,dimensions:[1280,720],duration:20,
   endRadiusPx:end.radius,endLayerThicknessPx:end.bandPx,scaled10cmGlobeThicknessMm:api.APPLE_LAYER_MM,finalAppleVisible:true,
   closeUpMagnification:close.magnification,monotonicRetreat:true,oneSecondPixelChecks:pixels,
   constraints:'No CSS layout, real browser fonts, WebGL shader or physical iPad test performed.',
   files:Object.fromEntries(['paramecium_1800.jpg','mallard_1920.jpg','earth_july_4096.jpg','earth_globe_fallback.png'].map(f=>[f,{bytes:fs.statSync(path.join(base,f)).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(base,f))).digest('hex')}]))};
 fs.writeFileSync(path.join(output,'native_report.json'),JSON.stringify(report,null,2)+'\n');
 const sheets=[['frame_0.png','frame_5.png','frame_10.png','frame_20.png'],['frame_3_5.png','frame_4.png','frame_8_2.png','frame_9.png'],['frame_13.png','frame_15.png','frame_17_5.png','frame_19_2.png']];
 for(let n=0;n<sheets.length;n++){
  const sheet=createCanvas(1280,760),c=sheet.getContext('2d');c.fillStyle='#11261f';c.fillRect(0,0,1280,760);
  for(let i=0;i<4;i++){const x=(i%2)*640,y=Math.floor(i/2)*380;c.drawImage(await loadImage(path.join(output,sheets[n][i])),x,y,640,360);c.fillStyle='#f2ecd9';c.font='16px "JetBrains Mono"';c.fillText(sheets[n][i],x+10,y+376);}
  fs.writeFileSync(path.join(output,`contact_${n}.png`),sheet.toBuffer('image/png'));
 }
 console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});

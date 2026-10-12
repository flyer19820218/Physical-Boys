/* Mechanical decoding of the licensed GIF: original pixels and order retained. */
const fs=require('node:fs');
const path=require('node:path');
const modules=process.env.CODEX_NODE_MODULES||'/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(modules,'sharp'));
(async()=>{
  const folder=__dirname,src=path.join(folder,'heart_valves_original.gif');
  const meta=await sharp(src,{animated:true}).metadata();
  const {data,info}=await sharp(src,{animated:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const frameBytes=meta.width*meta.pageHeight*4;
  const tiles=[];
  for(let i=0;i<meta.pages;i++){
    const raw=data.subarray(i*frameBytes,(i+1)*frameBytes);
    const input=await sharp(raw,{raw:{width:meta.width,height:meta.pageHeight,channels:4}}).png().toBuffer();
    tiles.push({input,left:(i%5)*meta.width,top:Math.floor(i/5)*meta.pageHeight});
    if(i===0) await sharp(input).toFile(path.join(folder,'heart_valves_first.png'));
  }
  await sharp({create:{width:meta.width*5,height:meta.pageHeight*Math.ceil(meta.pages/5),channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(tiles).webp({lossless:true}).toFile(path.join(folder,'heart_valves_frames.webp'));
  fs.writeFileSync(path.join(folder,'heart_valves_frames.json'),JSON.stringify({source:'heart_valves_original.gif',width:meta.width,height:meta.pageHeight,columns:5,frames:meta.pages,delay:meta.delay,loop:meta.loop,author:'RWhitwam; adapted from CG_Heart.gif / DrJanaOfficial',license:'CC BY-SA 4.0',url:'https://commons.wikimedia.org/wiki/File:Heart_valves_animated.gif',processing:'Decoded original pixel frames into a lossless sprite sheet; timing/order retained in metadata.'},null,2));
  console.log(JSON.stringify({frames:meta.pages,width:meta.width,height:meta.pageHeight,seconds:meta.delay.reduce((a,b)=>a+b,0)/1000,rawChannels:info.channels}));
})().catch(e=>{console.error(e);process.exitCode=1});

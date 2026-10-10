/* Integrated native Canvas + simulated DOM QA, not browser or physical iPad certification. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const harness=require('./homeostasis_reproduction_native_dom_1009_v1.cjs');
const manifest=JSON.parse(read('assets/biology/ecosphere_manifest_1010_v1.json'));
const out=process.env.BIOLOGY_QA_OUTPUT||fs.mkdtempSync('/private/tmp/biology-ecosphere-qa-');fs.mkdirSync(out,{recursive:true});
const report={scope:'Bundled real-font native Canvas and simulated DOM. Browser CSS, browser fonts, real touch and physical iPad not certified.',units:[],bounds:[],visibility:[],assets:[],protected:[]};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function env(book,u){const E=harness.environment(read(u.file)),timers=new Map();let serial=0;E.context.setTimeout=(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;};E.context.clearTimeout=id=>timers.delete(id);E.context.matchMedia=()=>({matches:true});
 for(const f of ['ch4_cinematic_cover_1009_v1','new_books_shell_1010_v1','new_books_models_1010_v1','ecosphere_models_1010_v1',book.id+'_lessons_1010_v1'])E.run(read('assets/biology/'+f+'.js'),f);
 const screen=E.document.getElementById('introScreen');assert.equal(screen.textContent.trim(),'');assert(E.document.querySelector('main').inert);for(let i=0;i<60;i++)E.advance();assert.equal(E.context.LivingBook.getState().elapsed||0,0);const pic=screen.querySelector('.cover-image');pic.complete=true;pic.naturalWidth=1000;pic.dispatchEvent(new E.Ev('load'));screen.click();assert(screen.hidden&&!E.document.querySelector('main').inert);return Object.assign(E,{B:E.context.LivingBook});}
function bounds(B,c,name){const raw=c.fillText.bind(c);c.fillText=function(str,x,y,max){const m=this.measureText(str),w=m.width,left=this.textAlign==='center'?x-w/2:this.textAlign==='right'?x-w:x,top=y-m.actualBoundingBoxAscent,bottom=y+m.actualBoundingBoxDescent;report.bounds.push({name,str,left,right:left+w,top,bottom,font:this.font});assert(left>=0&&left+w<=960.5&&top>=0&&bottom<=600.5,name+' canvas overflow: '+str);raw(str,x,y,max);};try{B.draw();}finally{c.fillText=raw;}}
function audit(B,c,name){const raw=c.fillText.bind(c),lines=[],intents=[],pixels=()=>c.getImageData(0,0,960,600).data;
 c.fillText=function(str,x,y,max){const a=new Uint8ClampedArray(pixels());raw(str,x,y,max);const b=pixels(),columns=new Set();for(let yy=0;yy<600;yy++)for(let xx=0;xx<960;xx++){const k=(yy*960+xx)*4;if(a[k]!==b[k]||a[k+1]!==b[k+1]||a[k+2]!==b[k+2])columns.add(xx);}lines.push({str,x,y,font:this.font});intents.push(columns);};
 B.draw();const full=new Uint8ClampedArray(pixels());c.fillText=raw;
 try{for(let omit=0;omit<lines.length;omit++){let index=0;c.fillText=function(str,x,y,max){if(index++!==omit)raw(str,x,y,max);};B.draw();const skipped=pixels();let run=0,longest=0,visible=0;
  for(const xx of [...intents[omit]].sort((a,b)=>a-b)){let seen=false;for(let yy=0;yy<600;yy++){const k=(yy*960+xx)*4;if(full[k]!==skipped[k]||full[k+1]!==skipped[k+1]||full[k+2]!==skipped[k+2]){seen=true;break;}}if(seen){visible++;run=0;}else{run++;longest=Math.max(longest,run);}}
  assert(visible>0&&longest<4,name+' hidden text: '+lines[omit].str);report.visibility.push({name,...lines[omit],visibleColumns:visible,maxInvisibleRun:longest});}}finally{c.fillText=raw;B.draw();}}
function variants(tab){const initial=tab.init(),list=[[]],seen=new Set();
 for(const g of tab.controls(initial))for(const it of g.items){if(['angle','pitch','spin'].includes(it.key))continue;for(const v of it.input?[it.input.min,it.input.max]:[it.value]){const sig=JSON.stringify([it.key,v]);if(!seen.has(sig)){seen.add(sig);list.push([[it.key,v]]);const s=tab.init();tab.act(s,it.key,v);for(const q of tab.controls(s))for(const j of q.items){if(['angle','pitch','spin'].includes(j.key)||j.key===it.key)continue;for(const vv of j.input?[j.input.min,j.input.max]:[j.value])list.push([[it.key,v],[j.key,vv]]);}}}
 }
 return list;
}
async function main(){
 for(const f of ['living_book_1008_v1.css','ch4_refinement_1009_v1.css','ch4_cinematic_cover_1009_v1.css','ch4_cinematic_cover_1009_v1.js','new_books_shell_1010_v1.js','new_books_models_1010_v1.js','new_books_1010_v1.css','genetics_lessons_1010_v1.js','biodiversity_lessons_1010_v1.js']){const file='assets/biology/'+f;assert.equal(hash(cp.execFileSync('git',['show','8880d4a:'+file],{cwd:root})),hash(read(file)));report.protected.push(file);}
 for(const book of manifest.books){const sources=JSON.parse(read(book.assets+'source_manifest.json'));for(const q of sources.images){assert.equal(hash(fs.readFileSync(path.join(root,book.assets,q.file))),q.sha256);report.assets.push(book.assets+q.file);}
  for(const u of book.units){if(process.argv.length>2&&!process.argv.slice(2).includes(u.id))continue;const E=env(book,u),B=E.B,id=n=>E.document.getElementById(n),can=id('lessonCanvas'),ctx=can.getContext('2d'),spec=B.modules[u.id],entry={id:u.id,tabs:[],states:0};await wait(120);
   for(let i=0;i<spec.tabs.length;i++){B.setTab(i);const tab=B.getTab(),cases=variants(tab);for(const k of ['title','sub','hook','body','reading','closure','record'])assert(tab[k][0]&&tab[k][1],u.id+'/'+tab.id+' bilingual '+k);
    for(const lang of ['zh','en']){B.setLanguage(lang);id('resetButton').click();await wait(20);const name=u.id+'/'+tab.id+'/'+lang;bounds(B,ctx,name);audit(B,ctx,name);fs.writeFileSync(path.join(out,u.id+'_'+tab.id+'_'+lang+'.png'),can.canvas.toBuffer('image/png'));
     assert(!/第[一二三四五六七八九十\d]+[章節單元]/.test(id('title').textContent+id('eyebrow').textContent+id('lessonTabs').textContent));
     for(const pairs of cases){id('resetButton').click();for(const [k,v]of pairs)B.action(k,v);await wait(2);bounds(B,ctx,name+'/'+JSON.stringify(pairs));assert(id('captionText').textContent.length>20);entry.states++;}
     id('resetButton').click();await wait(30);B.draw();const before=hash(ctx.getImageData(0,0,960,600).data);E.advance();for(let f=0;f<60;f++)E.advance();if(!tab.noPause)assert.notEqual(hash(ctx.getImageData(0,0,960,600).data),before,name+' stalled at 1 second');B.getState().running=false;B.draw();const frozen=hash(ctx.getImageData(0,0,960,600).data);for(let f=0;f<60;f++)E.advance();assert.equal(hash(ctx.getImageData(0,0,960,600).data),frozen,name+' pause failed');
     B.setFull(true);assert(id('bench').classList.contains('expanded'));id('fullButton').click();assert(!id('bench').classList.contains('expanded'));B.setFull(true);E.emit('keydown',{key:'Escape'});assert(!id('bench').classList.contains('expanded'));
     if(tab.pics?.length){for(let p=0;p<tab.pics.length;p++){if(tab.modelKind)B.action('view',1);const gallery=tab.controls(B.getState()).some(g=>g.items.some(it=>it.key==='pick'));B.action(gallery?'pick':'photo',p);await wait(20);bounds(B,ctx,name+'/original'+p);fs.writeFileSync(path.join(out,u.id+'_'+tab.id+'_original'+p+'_'+lang+'.png'),can.canvas.toBuffer('image/png'));}}
    }
    id('recordInput').value='保留觀察';id('recordInput').dispatchEvent(new E.Ev('input'));B.setLanguage('zh');assert.equal(id('recordInput').value,'保留觀察');id('resetButton').click();assert.equal(id('recordInput').value,'保留觀察');entry.tabs.push({id:tab.id,states:cases.length,staticOriginal:!!tab.noPause});
   }
   for(const m of read(u.file).matchAll(/(?:src|href)="([^"#]+)"/g)){const p=m[1].split('?')[0];if(!/^https?:/.test(p))assert(fs.existsSync(path.join(root,p)),u.id+' missing '+p);}report.units.push(entry);console.log('PASS '+u.id+' ('+entry.states+' states)');
  }
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,units:report.units.length,tabs:report.units.reduce((n,u)=>n+u.tabs.length,0),states:report.units.reduce((n,u)=>n+u.states,0),visibleLines:report.visibility.length,assets:report.assets.length,protected:report.protected.length}));
}
main().catch(e=>{fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e.stack,recentBounds:report.bounds.slice(-40)},null,2));console.error(e.stack);console.error('QA output '+out);process.exitCode=1;});

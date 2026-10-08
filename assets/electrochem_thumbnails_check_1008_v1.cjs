/* Homepage-only source and asset validation; not a browser or iPad check. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),vm=require('vm'),{execFileSync}=require('child_process');
const {loadImage}=require('/Users/lvyanjun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const plan=JSON.parse(read('assets/covers/electrochem_thumbnails_release_1008_v1.json'));
const baseline='6f65cf4',old=execFileSync('git',['show',baseline+':index.html'],{cwd:root,encoding:'utf8'}),current=read('index.html');
const cards=s=>[...s.matchAll(/<a class="card" href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)].map(m=>({raw:m[0],href:m[1],attrs:m[2],body:m[3],title:m[3].match(/<span class="card-title">([\s\S]*?)<\/span>/)[1],sub:m[3].match(/<span class="card-sub">([\s\S]*?)<\/span>/)[1]}));
async function main(){
 const a=cards(old),b=cards(current);assert.equal(a.length,99);assert.equal(b.length,99);let unchanged=0;
 for(let i=0;i<a.length;i++){assert.deepEqual([b[i].href,b[i].attrs,b[i].title,b[i].sub],[a[i].href,a[i].attrs,a[i].title,a[i].sub]);const e=plan.entries.find(e=>e.unit+'.html'===b[i].href);if(e){assert(b[i].body.includes('src="'+e.thumbnail+'"'));assert(!b[i].body.includes('cover-unavailable'));}else{assert.equal(b[i].raw,a[i].raw);unchanged++;}}
 assert.equal(unchanged,94);
 let restored=current;for(const e of plan.entries){const before=a.find(c=>c.href===e.unit+'.html'),after=b.find(c=>c.href===e.unit+'.html');restored=restored.replace(after.raw,before.raw);}
 const credit=/<details class="cover-source-note">[\s\S]*?<\/details>/;assert(!credit.test(current),'Teacher requested no production-note panel in the student homepage');restored=restored.replace('  <footer>',old.match(credit)[0]+'\n  <footer>').replace('static-covers-electrochem-1008-v6','static-covers-magnetism-1008-v5');assert.equal(restored,old,'All source outside five cards, removed production note and version tag is byte-identical');
 const scriptBodies=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.deepEqual(scriptBodies(current),scriptBodies(old));scriptBodies(current).forEach(s=>new vm.Script(s));
 assert(current.includes('assets/index_static_covers_ipad3_1008_v2.css'));assert(!/<(?:video|audio)\b/.test(current));
 const tracked=new Set(execFileSync('git',['-c','core.quotePath=false','ls-files'],{cwd:root,encoding:'utf8'}).trim().split('\n')),allowed=new Set([...plan.entries.map(e=>e.thumbnail),'assets/covers/electrochem_cover_notes_1008_v1.md']);
 for(const m of current.matchAll(/\b(?:src|href)="([^"]+)"/g)){const ref=m[1];if(/^(?:https?:|mailto:|#)/.test(ref))continue;const f=decodeURIComponent(ref.split(/[?#]/)[0]);assert(fs.existsSync(path.join(root,f)),f+' exists');assert(tracked.has(f)||allowed.has(f),f+' is tracked or in this release');}
 for(const e of plan.entries){assert.equal(hash(e.thumbnail),e.sha256);const image=await loadImage(path.join(root,e.thumbnail));assert.equal(image.width,plan.thumbnailWidth);assert.equal(image.height,plan.thumbnailHeight);}
 assert.equal(execFileSync('git',['show',baseline+':assets/index_static_covers_ipad3_1008_v2.css'],{cwd:root,encoding:'utf8'}),read('assets/index_static_covers_ipad3_1008_v2.css'));
 const report={baseline,homepageCards:99,newThumbnails:5,otherCardsByteIdentical:unchanged,originalInlineScriptsByteIdentical:true,productionNotePanelRemoved:true,thumbnailDimensions:[960,640],thumbnailHashMatches:5,threeColumnCssUnchanged:true,scope:'Homepage thumbnails and removal of the production-note panel; no lesson body or full opening-cover publication',limitations:'Source and native image decoding only; no actual browser or iPad verification'};
 fs.writeFileSync('/private/tmp/electrochem_thumbnails_release_1008_v1_qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});

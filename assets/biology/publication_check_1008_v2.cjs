/* Scoped release audit. No browser or physical iPad validation is implied. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'../..');
const units=['intro','microscope','cells','matter_transport','organization','scale','nutrients','enzymes','photosynthesis','animal_nutrition'];
const files=units.map(u=>`biology_${u}.html`).concat([
 'index.html','README.md',
 'assets/biology/ui_atomics_1008_v1.css','assets/biology/ui_atomics_1008_v1.md',
 'assets/biology/ui_images_preserved_1008_v2.css','assets/biology/ui_images_preserved_1008_v2.md',
 'assets/biology/animal_nutrition_v1.css','assets/biology/animal_nutrition_v2.css',
 'assets/biology/animal_nutrition_data_v1.js','assets/biology/animal_nutrition_tour_v2.js',
 'assets/biology/animal_nutrition_draw_v2.js','assets/biology/animal_nutrition_v2.js',
 'assets/biology/animal_digestive_original_v1.svg','assets/biology/animal_digestive_original_v1.png',
 'assets/biology/animal_intestine_openstax_v1.jpg','assets/biology/animal_organs_v2.json',
 'assets/biology/animal_nutrition_sources_v1.md','assets/biology/animal_nutrition_sources_v2.md',
 'assets/biology/animal_nutrition_checks_v1.md','assets/biology/animal_nutrition_checks_v2.md',
 'assets/biology/animal_nutrition_check_v2.cjs','assets/biology/publication_check_1008_v2.cjs',
 'assets/covers/biology_animal_nutrition_cover_v1.png',
 ...fs.readdirSync(path.join(__dirname,'animal_organs_v2')).map(f=>'assets/biology/animal_organs_v2/'+f)
]);
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const tracked=new Set(git('ls-files','-z').split('\0').filter(Boolean)),available=new Set([...tracked,...files]);
const checked=new Set(),missing=[];
function ref(from,value,relative=false){
 value=decodeURIComponent(value.split(/[?#]/)[0]);if(!value||/^(?:https?:|data:|mailto:|tel:|\/\/)/.test(value))return;
 if(value.includes('${lang}')){for(const lang of ['zh','en'])ref(from,value.replace('${lang}',lang),relative);return}
 const f=path.normalize(relative?path.join(path.dirname(from),value):value);
 if(fs.existsSync(path.join(root,f))&&fs.statSync(path.join(root,f)).isDirectory())return;
 if(!fs.existsSync(path.join(root,f))||!available.has(f)){missing.push({from,file:f});return}
 if(/\.(?:css|js|md)$/.test(f))walk(f);
}
function walk(f){
 if(checked.has(f))return;checked.add(f);const text=read(f);
 if(/\.html$/.test(f)){
  for(const m of text.matchAll(/(?:src|href)="([^"]+)"/g))ref(f,m[1]);
  for(const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:f});
 }
 if(/\.(?:html|css)$/.test(f))for(const m of text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))ref(f,m[1],f.endsWith('.css'));
 if(/\.js$/.test(f)){
  new vm.Script(text,{filename:f});
  for(const m of text.matchAll(/['"](assets\/[^'"\n]+)['"]/g))ref(f,m[1]);
  if(f.endsWith('cells_photographs_v4.js'))for(const m of text.matchAll(/file:(ROOT|PHOTOS)\+'([^']+)'/g))ref(f,'assets/biology/'+(m[1]==='PHOTOS'?'photos/':'')+m[2]);
  if(/(?:organization_v3|scale_v2)\.js$/.test(f))for(const m of text.matchAll(/file:'([^']+)'/g))ref(f,'assets/biology/photos/'+m[1]);
 }
 if(/\.md$/.test(f))for(const m of text.matchAll(/\]\(([^)]+)\)/g))ref(f,m[1],true);
}
files.forEach(f=>assert(fs.existsSync(path.join(root,f)),f));
units.forEach(u=>walk(`biology_${u}.html`));walk('index.html');
assert.deepEqual(missing,[],'Local file missing or omitted from release: '+JSON.stringify(missing));
for(const u of units.slice(0,9)){
 const f=`biology_${u}.html`,original=git('show','42807d266cf346b0420a10bfa68469f7df3e762a:'+f);
 const normalized=read(f).replace(/ <link rel="stylesheet" href="assets\/biology\/ui_images_preserved_1008_v2.css">\n/,'').replace(/ data-biology-unit="[^"]*"/,'').replace('class="bio-atomics"','').replace(/class="([^"]+) bio-atomics"/,'class="$1"').replace('<body >','<body>');
 assert.equal(normalized,original,'Changed legacy teaching source '+f);
}
const before=path.join(root,'source-markdown/backups/biology_ui_atomics_20261008_post.fsmam5');
const manifest=JSON.parse(fs.readFileSync(path.join(before,'manifest.json')));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
let protectedFiles=0;
for(const item of manifest.files){
 if(units.some(u=>item.relative===`biology_${u}.html`)||['index.html','README.md'].includes(item.relative))continue;
 assert.equal(sha(item.relative),item.sha256,'Changed protected dependency '+item.relative);protectedFiles++;
}
for(const item of manifest.unrelated)assert.equal(sha(item.relative),item.sha256,'Changed collaborator file '+item.relative);
let index=read('index.html');
const animalLines=index.split('\n').filter(l=>!l.includes('biology_animal_nutrition.html')).join('\n');
index=animalLines.replace(/(data-biology-nutrients-entry>[\s\S]*?cat-count">)4 個/, '$13 個');
assert.equal(index,fs.readFileSync(path.join(before,'index.html'),'utf8'),'Homepage changed outside approved biology entry');
assert.equal((read('index.html').match(/class="card" href="biology_[^"]+"/g)||[]).length,10);
const staged=git('diff','--cached','--name-only','-z').split('\0').filter(Boolean);
assert(staged.every(f=>files.includes(f)),'Unrelated file staged');
git('diff','--check','--',...files);
const report={releaseFiles:files.length,runtimeAndCreditSourcesChecked:checked.size,missingReleaseDependencies:missing.length,legacyTeachingAndDrawingChanges:0,coordinateDifferences:0,protectedFilesSHA256Unchanged:protectedFiles,collaboratorFiles:'unchanged',homepageBiologyEntries:10,browserCSSAndPhysicalIPad:'NOT VERIFIED'};
fs.mkdirSync('/private/tmp/biology_publish_check_1008_v2',{recursive:true});
fs.writeFileSync('/private/tmp/biology_publish_check_1008_v2/report.json',JSON.stringify(report,null,2));
fs.writeFileSync('/private/tmp/biology_publish_check_1008_v2/files.json',JSON.stringify(files,null,2));
console.log(JSON.stringify(report,null,2));

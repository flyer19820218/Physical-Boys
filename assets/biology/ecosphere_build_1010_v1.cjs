/* Mechanical assembly of new ecology/environment pages. Published engines stay untouched. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const c={document:{body:{dataset:{book:'metadata'}}},LivingBook:{D:{tr:p=>Array.isArray(p)?p[0]:String(p)}}};c.window=c;vm.createContext(c);
for(const p of ['new_books_models_1010_v1','ecosphere_models_1010_v1','ecology_lessons_1010_v1'])vm.runInContext(read('assets/biology/'+p+'.js'),c);
const books=[{id:'ecology',name:'生物圈',family:'生命與環境',units:c.NewEcologyUnits,scratch:'/private/tmp/biology_ecology_1010_v1.8zEAlQ',data:'ecology_lessons_1010_v1'}];
if(process.argv.includes('--environment')){
 vm.runInContext(read('assets/biology/environment_lessons_1010_v1.js'),c);
 books.push({id:'environment',name:'人類與環境',family:'人類與環境',units:c.NewEnvironmentUnits,scratch:'/private/tmp/biology_environment_1010_v1.VJfzTu',data:'environment_lessons_1010_v1'});
}
const template=read('biology_mendel_inheritance.html'),escape=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const manifest={version:'1010_v1',scope:'New lessons only; textbook originals and added models are separate',books:[]};
for(const book of books){
 const dir='assets/biology/'+book.id+'_originals_1010_v1/',metadata=JSON.parse(fs.readFileSync(path.join(book.scratch,'large_objects.json'),'utf8')),source=JSON.parse(fs.readFileSync(path.join(book.scratch,'source_info.json'),'utf8'));
 fs.mkdirSync(path.join(root,dir),{recursive:true});
 const used=[...new Set([...read('assets/biology/'+book.data+'.js').matchAll(/['"](Im\d+_\d+\.png)['"]/g)].map(m=>m[1]))];
 const images=used.map(file=>{const m=metadata.find(q=>q.file===file);if(!m)throw Error('No original metadata: '+file);const bytes=fs.readFileSync(path.join(book.scratch,'images',file));fs.writeFileSync(path.join(root,dir,file),bytes);
  return {...m,pageVerification:'Reviewed in rendered original-page and image contact sheets; printed pages verified against source PDF',author:null,authorStatus:'Individual creator not confirmed; do not infer',publisher:'康軒',source:book.name+'.pdf',permission:'Website use permission reported by the teacher; not an open-content license',modification:'Original extracted raster bytes unchanged; proportional display resizing and camera presentation only',sha256:hash(bytes)};});
 write(dir+'source_manifest.json',JSON.stringify({...source,permission:'Teacher reports permission from the textbook publisher for this educational website. Individual creators and edition are unconfirmed where not specified.',images},null,2)+'\n');
 const entries=[];
 for(const u of book.units){
  const file='biology_'+u.id+'.html',cover=dir+u.cover;
  const nav=book.units.map(q=>`      <a href="biology_${q.id}.html" data-zh="${escape(q.title[0])}" data-en="${escape(q.title[1])}">${escape(q.title[0])}</a>`).join('\n')+'\n      <a href="index.html" data-zh="← 自然科學首頁" data-en="← Science home">← 自然科學首頁</a>';
  let html=template.replace(/遺傳：消失的表徵去哪了？/g,u.title[0]).replace(/遺傳與生物技術/g,book.family)
   .replace(/assets\/biology\/genetics_originals_1010_v1\/Im707_873.png/g,cover)
   .replace('data-book="genetics" data-unit="mendel_inheritance"',`data-book="${book.id}" data-unit="${u.id}"`)
   .replace('--tab-count:4','--tab-count:'+u.tabs.length)
   .replace(/(<nav class="chapter-nav"[^>]*>)[\s\S]*?<\/nav>/,'$1\n'+nav+'\n    </nav>')
   .replace('assets/biology/genetics_originals_1010_v1/source_manifest.json',dir+'source_manifest.json')
   .replace(/      <p><a href="https:\/\/www.genome.gov[^\n]*\n/,'')
   .replace('  <script src="assets/biology/genetics_lessons_1010_v1.js"></script>',`  <script src="assets/biology/ecosphere_models_1010_v1.js"></script>\n  <script src="assets/biology/${book.data}.js"></script>`)
   .replace('</title>','</title>\n  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">');
  write(file,html);
  const preview=file.replace('.html','_living_book_preview_1010_v1.html');
  if(!fs.existsSync(path.join(root,preview)))write(preview,html);
  entries.push({id:u.id,file,preview,title:u.title,subtitle:u.subtitle,cover,tabs:u.tabs.length});
 }
 manifest.books.push({id:book.id,name:book.name,family:book.family,assets:dir,images:images.length,units:entries});
}
write('assets/biology/ecosphere_manifest_1010_v1.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest.books.map(q=>({book:q.id,units:q.units.length,tabs:q.units.reduce((n,u)=>n+u.tabs,0),images:q.images})),null,2));

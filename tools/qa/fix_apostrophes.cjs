// 把英文字串裡的彎撇號 ’ ‘ 換成直撇號 '（Noto Sans TC 把彎撇號畫成全形寬，會出現空縫）。
// 只動 HTML 的 data-en／title／aria-label 屬性、英文文字節點，以及 JS 字串（單引號字串內自動加 \'）；
// 中文字串、正則表示式、註解、on* 事件屬性都不動。彎雙引號 “ ” 不處理。
// 用法：node tools/qa/fix_apostrophes.cjs <專案根目錄>          （只預覽）
//       node tools/qa/fix_apostrophes.cjs <專案根目錄> --write   （實際寫入）
const fs=require('fs'),path=require('path');
let acorn;for(const m of ['acorn','espree','/opt/node-tools/node_modules/acorn']){try{acorn=require(m);break;}catch(e){}}
if(!acorn)throw new Error('找不到 acorn：請先 npm i acorn');
const root=process.argv[2],WRITE=process.argv.includes('--write');
const CUR=/[‘’]/g,CJK=/[　-鿿＀-￯]/,LAT=/[A-Za-z0-9]/;
const skipDir=/^(local-backups|output|node_modules|\.git)$/;
function walk(d,out=[]){for(const n of fs.readdirSync(d,{withFileTypes:true})){if(skipDir.test(n.name))continue;const p=path.join(d,n.name);if(n.isDirectory())walk(p,out);else if(/\.(html|js)$/.test(n.name))out.push(p);}return out;}
// convert apostrophes in `s`; esc(c) gives replacement; english => convert all when no CJK present
function conv(s,esc,forceAll){const hasCJK=CJK.test(s);let n=0;
  const r=s.replace(CUR,(m,i)=>{const prev=s[i-1]||'',next=s[i+1]||'';const ok=forceAll||!hasCJK||LAT.test(prev)||LAT.test(next);if(!ok)return m;n++;return esc;});return [r,n];}
function jsEdits(src,offset=0){const edits=[];let ast;
  try{ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'script',allowHashBang:true,allowReturnOutsideFunction:true});}
  catch(e){try{ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'module'});}catch(e2){return {edits,err:e2.message};}}
  (function visit(n){if(!n||typeof n.type!=='string'){if(Array.isArray(n))n.forEach(visit);return;}
    if(n.type==='Literal'&&typeof n.value==='string'&&!n.regex){const raw=src.slice(n.start,n.end),d=raw[0];if(CUR.test(raw)){CUR.lastIndex=0;
        if(/\\[‘’]/.test(raw)){edits.push({err:'backslash before curly',at:n.start+offset});}else{
        const [r,c]=conv(raw.slice(1,-1),d==="'"?"\\'":"'");if(c)edits.push({s:n.start+offset+1,e:n.end+offset-1,r,c});}}CUR.lastIndex=0;}
    else if(n.type==='TemplateElement'){const raw=src.slice(n.start,n.end);if(CUR.test(raw)){CUR.lastIndex=0;if(/\\[‘’]/.test(raw)){edits.push({err:'backslash before curly',at:n.start+offset});}else{const [r,c]=conv(raw,"'");if(c)edits.push({s:n.start+offset,e:n.end+offset,r,c});}}CUR.lastIndex=0;}
    for(const k of Object.keys(n)){if(k==='type'||k==='start'||k==='end')continue;visit(n[k]);}})(ast);
  return {edits};}
function htmlEdits(src){const edits=[],errs=[];
  const re=/<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<\/?[A-Za-z][^>]*>|[^<]+|</g;let m;
  while((m=re.exec(src))){const t=m[0];
    if(t.startsWith('<!--')||/^<style/i.test(t))continue;
    if(/^<script/i.test(t)){const attrs=m[1]||'',code=m[2]||'';if(/type\s*=\s*["']?(?!module|text\/javascript|application\/javascript)[^"'\s>]+/i.test(attrs)||!CUR.test(code)){CUR.lastIndex=0;continue;}CUR.lastIndex=0;
      const off=m.index+t.indexOf('>')+1;const r=jsEdits(code,off);r.edits.forEach(e=>e.err?errs.push(e):edits.push(e));if(r.err)errs.push({err:'script parse: '+r.err,at:off});continue;}
    if(t[0]==='<'){ // tag: attributes
      const ar=/([A-Za-z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;let a;while((a=ar.exec(t))){const name=a[1].toLowerCase();if(/^on/.test(name)||/^(style|href|src|class|id|for|type|name|onclick)$/.test(name))continue;
        const val=a[3]!==undefined?a[3]:a[4],dq=a[3]!==undefined;if(!CUR.test(val)){CUR.lastIndex=0;continue;}CUR.lastIndex=0;
        const forceAll=name==='data-en'||name==='aria-label'&&!CJK.test(val)||name==='title'&&!CJK.test(val)||name==='alt'&&!CJK.test(val);
        const [r,c]=conv(val,dq?"'":'&#39;',name==='data-en');if(c){const vs=m.index+a.index+a[0].indexOf(dq?'"':"'")+1;edits.push({s:vs,e:vs+val.length,r,c});}}
      continue;}
    // text node: needs Latin letters and no CJK, else adjacency only
    if(CUR.test(t)){CUR.lastIndex=0;const hasLat=/[A-Za-z]/.test(t);const [r,c]=conv(t,"'",false);if(c&&hasLat)edits.push({s:m.index,e:m.index+t.length,r,c});CUR.lastIndex=0;}
  }
  return {edits,errs};}
let totalEdits=0,changedFiles=0;const report=[],problems=[];
for(const f of walk(root)){const src=fs.readFileSync(f,'utf8');if(!/[‘’]/.test(src))continue;
  let res;if(f.endsWith('.js')){const r=jsEdits(src);res={edits:r.edits.filter(e=>!e.err),errs:[...r.edits.filter(e=>e.err),...(r.err?[{err:'parse: '+r.err}]:[])]};}else res=htmlEdits(src);
  res.errs.forEach(e=>problems.push(path.relative(root,f)+': '+e.err+(e.at!==undefined?' @'+e.at:'')));
  if(!res.edits.length)continue;
  res.edits.sort((a,b)=>b.s-a.s);let out=src,cnt=0;for(const e of res.edits){out=out.slice(0,e.s)+e.r+out.slice(e.e);cnt+=e.c;}
  totalEdits+=cnt;changedFiles++;report.push([path.relative(root,f),cnt]);if(WRITE)fs.writeFileSync(f,out);}
report.sort((a,b)=>b[1]-a[1]);
console.log((WRITE?'WROTE':'DRY RUN')+`: ${totalEdits} apostrophes in ${changedFiles} files`);console.log(report.slice(0,15).map(x=>x.join(' ')).join('\n'));
console.log('problems:',problems.length?'\n'+problems.join('\n'):'none');

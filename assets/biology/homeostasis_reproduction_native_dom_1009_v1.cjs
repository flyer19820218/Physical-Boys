/* Source protection + native Canvas + lightweight DOM/event model.
 * NOT a browser, CSS computed-style, screenshot, touch-hit-test or physical-iPad check. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const {createCanvas,Image,GlobalFonts}=require('@napi-rs/canvas');
const base=path.resolve(__dirname,'../..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
for(const [file,family] of [['NotoSansTC-variable.ttf','Noto Sans TC'],['JetBrainsMono-variable.ttf','JetBrains Mono']])assert(GlobalFonts.registerFromPath(path.join(__dirname,'fonts',file),family));
const decode=s=>String(s).replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const camel=s=>s.replace(/-([a-z])/g,(_,s)=>s.toUpperCase());
function environment(html){
 const queue=new Map(),events={},registry=new Map();let rid=1,now=0,document;
 class Ev{constructor(type,opts={}){this.type=type;Object.assign(this,{bubbles:false,...opts});}preventDefault(){}stopPropagation(){this.stopped=true;}}
 class El{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.childNodes=[];this.dataset={};this.attrs={};this.events={};this.style={setProperty(k,v){this[k]=v;},getPropertyValue(k){return this[k]||'';}};this.className='';this.hidden=false;this.disabled=false;this._value='';this.width=640;this.height=640;this.classList={contains:n=>this.className.split(/\s+/).includes(n),toggle:(n,on)=>{const set=new Set(this.className.split(/\s+/).filter(Boolean));if(on===undefined)on=!set.has(n);on?set.add(n):set.delete(n);this.className=[...set].join(' ');return on;},add:(...names)=>names.forEach(n=>this.classList.toggle(n,true)),remove:(...names)=>names.forEach(n=>this.classList.toggle(n,false))};}
  set id(v){this._id=v;registry.set(v,this);}get id(){return this._id||'';}
  get children(){return this.childNodes.filter(e=>e.tagName!=='#TEXT');}get firstElementChild(){return this.children[0]||null;}
  get nextElementSibling(){return this.parentElement?.children[this.parentElement.children.indexOf(this)+1]||null;}
  get isConnected(){let n=this;while(n.parentElement)n=n.parentElement;return n===root;}
  set value(v){this._value=String(v);}get value(){return this._value||((this.tagName==='SELECT'&&this.children[0]?.value)||'');}
  setAttribute(k,v){v=decode(v);this.attrs[k]=v;if(k==='id')this.id=v;if(k==='class')this.className=v;if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true;if(k==='checked')this.checked=true;if(k==='width'||k==='height')this[k]=+v;if(k==='lang')this.lang=v;if(['value','type','src','href'].includes(k))this[k]=v;if(k.startsWith('data-'))this.dataset[camel(k.slice(5))]=v;}
  getAttribute(k){return k==='id'?this.id:k==='class'?this.className:k.startsWith('data-')?this.dataset[camel(k.slice(5))]??null:this.attrs[k]??null;}
  removeAttribute(k){delete this.attrs[k];if(k==='hidden')this.hidden=false;}
  appendChild(e){if(typeof e==='string')e=new Text(e);e.remove();this.childNodes.push(e);e.parentElement=this;return e;}
  append(...nodes){nodes.forEach(n=>this.appendChild(n));}prepend(...nodes){for(const n of [...nodes].reverse())this.insertBefore(n,this.childNodes[0]);}
  insertBefore(e,b){e.remove();const i=b?this.childNodes.indexOf(b):-1;this.childNodes.splice(i<0?this.childNodes.length:i,0,e);e.parentElement=this;return e;}
  before(...nodes){nodes.forEach(n=>this.parentElement.insertBefore(n,this));}after(...nodes){const p=this.parentElement,anchor=p.childNodes[p.childNodes.indexOf(this)+1];nodes.forEach(n=>p.insertBefore(n,anchor));}
  remove(){if(this.parentElement){const p=this.parentElement;p.childNodes.splice(p.childNodes.indexOf(this),1);this.parentElement=null;}}
  replaceChildren(...nodes){this.childNodes.forEach(n=>n.parentElement=null);this.childNodes=[];this.append(...nodes);}
  set textContent(v){this.replaceChildren(new Text(String(v)));}get textContent(){return this.childNodes.map(n=>n.textContent).join('');}
  set innerHTML(v){this.replaceChildren();parse(v,this);}get innerHTML(){return this.textContent;}
  matches(s){return s.split(',').some(q=>{q=q.trim();const parts=q.split(/\s+(?![^\[]*\])/),simple=parts.pop();if(!matchSimple(this,simple))return false;let p=this.parentElement;for(let i=parts.length-1;i>=0;i--){while(p&&!matchSimple(p,parts[i]))p=p.parentElement;if(!p)return false;p=p.parentElement;}return true;});}
  querySelectorAll(s){const found=[];for(const e of this.children){if(e.matches(s))found.push(e);found.push(...e.querySelectorAll(s));}return found;}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){let n=this;while(n){if(n.matches(s))return n;n=n.parentElement;}return null;}
  removeEventListener(n,fn){this.events[n]=(this.events[n]||[]).filter(f=>f!==fn);}blur(){if(document.activeElement===this)document.activeElement=document.body;}addEventListener(n,fn){(this.events[n]??=[]).push(fn);}dispatchEvent(e){e.target??=this;e.currentTarget=this;for(const fn of this.events[e.type]||[])fn(e);if(e.bubbles&&!e.stopped)this.parentElement?.dispatchEvent(e);return true;}
  click(){if(!this.disabled)this.dispatchEvent(new Ev('click',{bubbles:true}));}focus(){document.activeElement=this;}setPointerCapture(){}scrollIntoView(){}
  get clientWidth(){return this._rect?.width||640;}get clientHeight(){return this._rect?.height||640;}get offsetHeight(){return this.hidden?0:this._rect?.height||22;}
  getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}getClientRects(){return this.hidden?[]:[this.getBoundingClientRect()];}
  getContext(){if(!this.canvas)this.canvas=createCanvas(this.width,this.height);return this.canvas.getContext('2d');}
 }
 class Text extends El{constructor(v){super('#text');this._text=v;}get textContent(){return this._text;}set textContent(v){this._text=v;}}
 function matchSimple(e,s){if(e.tagName==='#TEXT')return false;const tag=s.match(/^[\w-]+/)?.[0];if(tag&&e.tagName!==tag.toUpperCase())return false;const id=s.match(/#([\w-]+)/)?.[1];if(id&&e.id!==id)return false;for(const m of s.matchAll(/\.([\w-]+)/g))if(!e.classList.contains(m[1]))return false;for(const m of s.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)){const v=e.getAttribute(m[1]);if(v===null||(m[2]!==undefined&&v!==m[2]))return false;}return true;}
 function parse(s,parent){const stack=[parent],voids=new Set(['META','LINK','IMG','INPUT','BR','HR','SOURCE']);for(const token of s.match(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*(?:"[^"\n]*"[^>]*)?>|[^<]+/g)||[]){if(token.startsWith('<!--')||token.startsWith('<!'))continue;if(token.startsWith('</')){const tag=token.match(/^<\/([\w-]+)/)[1].toUpperCase();let i=stack.length-1;while(i>0&&stack[i].tagName!==tag)i--;if(i>0)stack.length=i;}else if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const e=new El(tag),attrs=token.slice(tag.length+1,-1);for(const a of attrs.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))e.setAttribute(a[1],a[2]??a[3]??a[4]??'');stack.at(-1).append(e);if(!voids.has(e.tagName)&&!token.endsWith('/>'))stack.push(e);}else stack.at(-1).append(new Text(decode(token)));}}
 const root=new El('root');parse(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/g,''),root);const body=root.querySelector('body');
 document={body,documentElement:root.querySelector('html'),hidden:false,activeElement:body,createElement:tag=>new El(tag),createTextNode:v=>new Text(v),getElementById:id=>registry.get(id),querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s),addEventListener:(n,f)=>(events[n]??=[]).push(f),removeEventListener:(n,f)=>{events[n]=(events[n]||[]).filter(q=>q!==f);}};
 class LocalImage extends Image{set src(v){this._src=v;super.src=fs.readFileSync(path.join(base,v));}get src(){return this._src;}}
 const sandbox={document,Image:LocalImage,Event:Ev,console,performance:{now:()=>now},requestAnimationFrame:f=>{const id=rid++;queue.set(id,f);return id;},cancelAnimationFrame:id=>queue.delete(id),addEventListener:(n,f)=>(events['window:'+n]??=[]).push(f),ResizeObserver:class{observe(){}},MutationObserver:class{observe(){}}};sandbox.window=sandbox;
 const context=vm.createContext(sandbox),run=(code,file)=>vm.runInContext(code,context,{filename:file});
 return {document,body,context,queue,run,Ev,emit:(type,event={})=>(events[type]||[]).forEach(fn=>fn(new Ev(type,event))),advance:(duration=16.67)=>{now+=duration;const current=[...queue.entries()];for(const [id,fn] of current){if(queue.delete(id))fn(now);}},now:()=>now};
}

module.exports={environment};

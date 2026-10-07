/* Original qualitative teaching model; never an experimental rate measurement. */
(function(root){'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
 const pairs=[{id:'amylase',zh:'唾液澱粉酶',en:'Salivary amylase',target:'starch',substrate:['澱粉','Starch'],product:['麥芽糖等較小的糖','Maltose and smaller sugars'],color:'#55e9ff'},
 {id:'protease',zh:'蛋白酶',en:'Protease',target:'protein',substrate:['蛋白質','Protein'],product:['較小的胜肽','Smaller peptides'],color:'#f472b6'},
 {id:'lipase',zh:'脂肪酶',en:'Lipase',target:'fat',substrate:['脂質','Lipids'],product:['較小的分解產物','Smaller breakdown products'],color:'#fb923c'}];
 function tempRate(t){return t<=37?Math.pow(clamp((t+5)/42,0,1),1.65):Math.exp(-Math.pow((t-37)/12,2));}
 const phSpecs=[{id:'stomach',zh:'胃的蛋白酶',en:'Stomach protease',center:2,width:1.8,color:'#fb923c'}, {id:'saliva',zh:'唾液澱粉酶',en:'Salivary amylase',center:7,width:1.6,color:'#55e9ff'}, {id:'intestine',zh:'小腸酵素示例',en:'Intestinal enzyme example',center:8.5,width:1.5,color:'#4ade80'}];
 const phRate=(p,id)=>{const s=phSpecs.find(x=>x.id===id);return Math.exp(-Math.pow((p-s.center)/s.width,2));};
 function create(){return {tab:0,mode:'break',phase:0,running:false,cycles:0,enzyme:'amylase',substrate:'starch',feedback:null,temp:37,damaged:false,ph:7,phEnzyme:'saliva',expanded:null,lab:createLab()};}
 function createLab(records=[]){return {step:0,prediction:null,motion:null,paused:false,volumes:[0,0],starch:[false,false],benedict:[false,false],denatured:[false,false],conversion:[0,0],heatProgress:0,settle:0,records,recorded:false};}
 function can(s,a){if(a==='reset')return true;if(s.motion)return false;return {prepare:s.step===0&&s.prediction!==null,boil:s.step===1,cool:s.step===2,starchA:s.step===3&&!s.starch[0],starchB:s.step===3&&!s.starch[1],digest:s.step===4,benA:s.step===5&&!s.benedict[0],benB:s.step===5&&!s.benedict[1],detect:s.step===6,record:s.step===7&&!s.recorded}[a]===true;}
 function act(s,a){if(!can(s,a))return false;if(a==='reset'){const records=s.records;Object.assign(s,createLab(records));return true;}if(a==='record'){s.records.push({prediction:s.prediction,positive:[false,true]});s.recorded=true;return true;}s.paused=false;s.motion={type:a,t:0,duration:['boil','digest','detect'].includes(a)?8:2.2};return true;}
 function advance(s,dt){if(!s.motion||s.paused)return;const m=s.motion;m.t=Math.min(m.duration,m.t+clamp(dt,0,.15));const p=m.t/m.duration;
 if(m.type==='digest')s.conversion[1]=.88*smooth(p);
 if(m.type==='detect')s.heatProgress=p;
 if(m.t<m.duration)return;
 if(m.type==='prepare'){s.volumes=[2,2];s.step=1;}
 if(m.type==='boil'){s.denatured[0]=true;s.step=2;}
 if(m.type==='cool')s.step=3;
 if(m.type.startsWith('starch')){const i=m.type.endsWith('A')?0:1;s.starch[i]=true;s.volumes[i]+=2;if(s.starch.every(Boolean))s.step=4;}
 if(m.type==='digest')s.step=5;
 if(m.type.startsWith('ben')){const i=m.type.endsWith('A')?0:1;s.benedict[i]=true;s.volumes[i]+=2;if(s.benedict.every(Boolean))s.step=6;}
 if(m.type==='detect'){s.denatured=[true,true];s.step=7;}
 s.motion=null;
 }
 function tick(u,dt){if(!u.running)return;u.phase+=clamp(dt,0,.15)/4;if(u.phase>=1){u.phase=1;if(u.tab===0||pairs.find(p=>p.id===u.enzyme).target===u.substrate)u.cycles++;u.running=false;}}
 const labTitles=[['等量唾液','Equal saliva'],['只煮甲組','Boil A only'],['冷卻再加澱粉','Cool before starch'],['等量澱粉','Equal starch'],['溫水中作用','React in warm water'],['加入本氏液','Add Benedict’s'],['共同加熱檢驗','Heat both to test'],['比較結果','Compare results']];
 function fullBox(w,h){const portrait=h>w;const availW=portrait?w-16:w-372,availH=portrait?h*.57-148:h-156;return {width:Math.min(availW,availH*960/620),height:Math.min(availW*620/960,availH),left:portrait?8:356};}
 const api={clamp,smooth,pairs,phSpecs,tempRate,phRate,create,createLab,can,act,advance,tick,labTitles,fullBox};root.EnzymesModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

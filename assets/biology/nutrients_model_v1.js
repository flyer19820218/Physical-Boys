/* Original, deterministic teaching model. Timings are compressed, NOT lab measurements. */
(function(root){
 'use strict';
 const nutrients=[
 {id:'carb',zh:'醣類',en:'Carbohydrates',energy:4,color:'#fde047',photo:'rice',role:['提供能量，也能構成生物的部分構造，例如植物細胞壁的纖維素。','Supply energy and form some biological structures, such as cellulose in plant cell walls.'],example:['飯、麵、地瓜；醣類不等於只有甜味的糖。','Rice, noodles and sweet potatoes; carbohydrates include more than sweet sugars.']},
 {id:'protein',zh:'蛋白質',en:'Proteins',energy:4,color:'#f472b6',photo:'egg',role:['提供組成肌肉等構造的材料，也是許多酵素的主要成分；也能提供能量。','Build structures such as muscles, form many enzymes, and can supply energy.'],example:['蛋、豆、魚、肉；蛋也含脂質，不是只有蛋白質。','Eggs, beans, fish and meat; eggs also contain lipids.']},
 {id:'fat',zh:'脂質',en:'Lipids',energy:9,color:'#fb923c',photo:'oil',role:['儲存能量、參與細胞膜構成；皮下脂肪能減少熱散失。','Store energy and form membranes; fat under the skin reduces heat loss.'],example:['食用油、堅果；每克脂質的熱量較高。','Cooking oils and nuts; lipids provide more energy per gram.']},
 {id:'water',zh:'水',en:'Water',energy:0,color:'#55e9ff',photo:'water',role:['作為體內物質的溶劑，幫助運輸與反應；不能提供熱量。','Acts as a solvent for transport and reactions; supplies no food energy.'],example:['飲水、蔬果中的水；零熱量不代表不重要。','Drinking water and water in foods; zero calories does not mean unimportant.']},
 {id:'mineral',zh:'礦物質',en:'Minerals',energy:0,color:'#a5b4fc',photo:'produce',role:['參與構造和生理調節，例如鈣是骨骼的重要成分，鐵參與血紅素構成。','Contribute to structures and regulation: calcium in bones and iron in hemoglobin.'],example:['不同食物提供不同礦物質，不能只吃一種。','Different foods supply different minerals; variety matters.']},
 {id:'vitamin',zh:'維生素',en:'Vitamins',energy:0,color:'#4ade80',photo:'produce',role:['調節生理機能；缺乏維生素 A 可能影響暗處視力，缺乏 C 可能造成壞血病。','Regulate functions: vitamin A deficiency can impair dim-light vision; vitamin C deficiency can cause scurvy.'],example:['蔬菜、水果等；需求少，但仍不可缺。','Vegetables, fruits and other foods; small required amounts still matter.']}
 ];
 const photos={
 rice:{file:'nutrients_rice_v1.jpg',author:'JFVelasquez Floro',license:'CC0 1.0',source:'https://commons.wikimedia.org/wiki/File:1723Cooked_rice.jpg',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/'},
 banana:{file:'nutrients_banana_v1.jpg',author:'Steve Hopson',license:'CC BY-SA 2.5',source:'https://commons.wikimedia.org/wiki/File:Bananas.jpg',licenseUrl:'https://creativecommons.org/licenses/by-sa/2.5/'},
 egg:{file:'nutrients_egg_v1.jpg',author:'Sun Ladder',license:'CC BY-SA 3.0',source:'https://commons.wikimedia.org/wiki/File:Chicken_egg_2009-06-04.jpg',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
 oil:{file:'nutrients_oil_v1.jpg',author:'Lemone',license:'CC BY-SA 4.0',source:'https://commons.wikimedia.org/wiki/File:Olive_oil_from_Oneglia.jpg',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
 water:{file:'nutrients_water_v1.jpg',author:'Alabama Extension / Margaret Barse',license:'CC0 1.0',source:'https://commons.wikimedia.org/wiki/File:Glass_of_Water_(50838445027).jpg',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/'},
 produce:{file:'nutrients_produce_v1.jpg',author:'Keith Weller / USDA ARS',license:'Public domain',source:'https://commons.wikimedia.org/wiki/File:Foods.jpg',licenseUrl:'https://www.ars.usda.gov/oc/images/photos/'}
 };
 const samples=[
 {id:'starch',zh:'1% 澱粉液',en:'1% starch',starch:true,sugar:0,clear:true},
 {id:'glucose',zh:'1% 葡萄糖液',en:'1% glucose',starch:false,sugar:1,clear:true},
 {id:'sucrose',zh:'蔗糖液',en:'Sucrose',starch:false,sugar:0,clear:true},
 {id:'rice',zh:'熟米飯研磨液',en:'Ground cooked rice',starch:true,sugar:0,clear:false},
 {id:'banana',zh:'成熟香蕉研磨液',en:'Ripe banana extract',starch:false,sugar:0.6,clear:false},
 {id:'water',zh:'清水',en:'Water',starch:false,sugar:0,clear:true}
 ];
 const foods=[
 {id:'rice',zh:'飯／全穀',en:'Rice / grains',photo:'rice',group:'grain',nutrients:['carb','protein','water']},
 {id:'egg',zh:'蛋／蛋白質來源',en:'Egg / protein source',photo:'egg',group:'protein',nutrients:['protein','fat','water','mineral','vitamin']},
 {id:'produce',zh:'蔬菜',en:'Vegetables',photo:'produce',group:'vegetable',nutrients:['carb','water','mineral','vitamin']},
 {id:'banana',zh:'香蕉／水果',en:'Banana / fruit',photo:'banana',group:'fruit',nutrients:['carb','water','mineral','vitamin']},
 {id:'oil',zh:'食用油',en:'Cooking oil',photo:'oil',group:'oil',nutrients:['fat']},
 {id:'water',zh:'飲水',en:'Water',photo:'water',group:'water',nutrients:['water']}
 ];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 function energy(c,p,f){return c*4+p*4+f*9;}
 function createLab(kind){return {kind,sample:kind==='iodine'?'starch':'glucose',prepared:false,prediction:null,reagents:[false,false],mixed:false,inBath:false,temperature:22,heat:0,settle:0,complete:false,held:false,tool:{x:830,y:220},motion:null,elapsed:0,paused:false,records:[],recorded:false};}
 function sampleOf(lab){return samples.find(s=>s.id===lab.sample);}
 function positive(lab){const s=sampleOf(lab);return lab.kind==='iodine'?s.starch:s.sugar>0;}
 function reaction(lab,target){
  if(!lab.reagents[target])return 0;
  if(lab.kind==='iodine')return 1;
  return lab.mixed? smooth((lab.heat-0.1)/0.9):0;
 }
 function targets(lab){
  if(lab.kind==='iodine')return [{x:285,y:425},{x:495,y:425}];
  const move=lab.motion?.type==='bath'?smooth(lab.motion.t/2.2):lab.inBath?1:0;
  return [{x:280+350*move,y:170-45*move},{x:440+340*move,y:170-45*move}];
 }
 function liquidLevel(lab,target){return 412-(lab.reagents[target]?138:70)-(lab.inBath?34:0);}
 function can(lab,action){
  if(action==='reset')return true;
  if(lab.motion)return false;
  if(action==='prepare')return !lab.prepared&&lab.prediction!==null;
  if(action==='pick')return lab.prepared&&!lab.reagents.every(Boolean);
  if(action==='a'||action==='b')return lab.prepared&&!lab.reagents[action==='a'?0:1];
  if(action==='mix')return lab.kind==='benedict'&&lab.reagents.every(Boolean)&&!lab.mixed;
  if(action==='bath')return lab.kind==='benedict'&&lab.mixed&&!lab.inBath;
  if(action==='heat')return lab.kind==='benedict'&&lab.inBath&&!lab.complete;
  if(action==='record')return lab.complete&&!lab.recorded;
  return false;
 }
 function act(lab,action){
  if(!can(lab,action))return false;
  if(action==='prepare'){lab.prepared=true;return true;}
  if(action==='pick'){lab.held=true;lab.tool={x:lab.kind==='iodine'?835:95,y:290};return true;}
  if(action==='a'||action==='b'){
   const target=action==='a'?0:1,loc=targets(lab)[target];
   lab.motion={type:'reagent',target,t:0,from:{...lab.tool},to:{x:loc.x,y:lab.kind==='iodine'?260:160},direct:lab.held};lab.held=false;
  }
  if(action==='mix')lab.motion={type:'mix',t:0};
  if(action==='bath')lab.motion={type:'bath',t:0};
  if(action==='heat'){lab.paused=false;lab.motion={type:'heat',t:0};}
  if(action==='record'){
   lab.records.push({sample:lab.sample,prediction:lab.prediction,positive:positive(lab),kind:lab.kind,control:false});lab.recorded=true;
  }
  return true;
 }
 function advance(lab,dt){
  if(lab.paused)return;
  dt=clamp(dt,0,0.1);lab.elapsed+=dt;
  const m=lab.motion;if(!m){if(lab.complete)lab.settle=Math.min(1,lab.settle+dt/2);return;}
  m.t+=dt;
  if(m.type==='reagent'&&m.t>=1.7)lab.reagents[m.target]=true;
  if(m.type==='reagent'&&m.t>=2.4){lab.motion=null;lab.tool={x:830,y:220};if(lab.kind==='iodine'&&lab.reagents.every(Boolean))lab.complete=true;}
  if(m.type==='mix'&&m.t>=2.2){lab.mixed=true;lab.motion=null;}
  if(m.type==='bath'&&m.t>=2.2){lab.inBath=true;lab.motion=null;}
  if(m.type==='heat'){
   lab.temperature=22+78*smooth(m.t/4);
   if(lab.temperature>=80)lab.heat=Math.min(1,lab.heat+dt/5.5);
   if(m.t>=10&&lab.heat>=1){lab.complete=true;lab.motion=null;lab.temperature=100;}
  }
 }
 function reset(lab){const records=lab.records,sample=lab.sample;Object.assign(lab,createLab(lab.kind),{records,sample});}
 function dropTarget(lab,x,y){const points=targets(lab);return points.findIndex(p=>Math.abs(x-p.x)<58&&y<p.y&&y>p.y-165);}
 function fullBox(w,h,ar=960/620){const landscape=w>h;const availableW=w-(landscape?340:0)-(landscape?32:16),availableH=landscape?h-156:h*.57-148;const width=Math.max(1,Math.min(availableW,availableH*ar));return {width,height:width/ar,left:(landscape?340:0)+(availableW-width)/2+(landscape?16:8)};}
 const api={nutrients,photos,samples,foods,energy,clamp,smooth,createLab,sampleOf,positive,reaction,targets,liquidLevel,can,act,advance,reset,dropTarget,fullBox};
 if(typeof module!=='undefined')module.exports=api;root.NutrientsModel=api;
})(typeof window!=='undefined'?window:globalThis);

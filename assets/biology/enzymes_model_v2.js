/* V2 changes the authorized molecular animation only; lab and rate models stay V1. */
(function(root){'use strict';
 const base=root.EnzymesModel||(typeof require!=='undefined'?require('./enzymes_model_v1.js'):null);
 function create(){return {...base.create(),dragPoint:null};}
 function tick(u,dt){if(!u.running)return;u.phase=Math.min(1,u.phase+base.clamp(dt,0,.15)/8);if(u.phase===1){if(u.tab===0||base.pairs.find(p=>p.id===u.enzyme).target===u.substrate)u.cycles++;u.running=false;}}
 const api={...base,create,tick};root.EnzymesModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

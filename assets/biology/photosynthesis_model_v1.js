/* Original qualitative teaching model, not a calibrated photosynthesis-rate simulation. */
(function(root,factory){const M=factory();if(typeof module==='object'&&module.exports)module.exports=M;else root.PhotosynthesisModel=M;})(typeof window==='object'?window:globalThis,function(){'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const steps=[['雙面遮光','Cover both sides'],['照光等待','Expose to light'],['取葉、除鋁箔','Remove leaf and foil'],['沸水軟化','Soften in boiling water'],['酒精隔水褪色','Ethanol in a water bath'],['熱水沖洗','Rinse in warm water'],['平放培養皿','Place flat in a dish'],['滴碘液、觀察','Add iodine and observe']];
 const create=()=>({tab:0,expanded:null,t:0,paused:false,light:true,water:true,co2:true,route:'water',part:0,photo:'diagram',zoom:1,pan:{x:0,y:0},gate:65,environment:'normal',formula:'net',lab:{step:0,motion:null,prediction:null},evidence:'light',answer:null});
 const can=(s)=>s.step<8&&!s.motion&&(s.step!==0||s.prediction!==null);
 function act(s,a){if(a==='reset'){s.step=0;s.motion=null;s.prediction=null;return true;}if(a!=='next'||!can(s))return false;s.motion={step:s.step,t:0,duration:s.step===1?6:4};return true;}
 function tick(u,dt){if(u.paused)return;u.t+=dt;if(u.tab===4&&u.lab.motion){const m=u.lab.motion;m.t+=dt;if(m.t>=m.duration){u.lab.step=m.step+1;u.lab.motion=null;}}}
 const progress=s=>s.motion?clamp(s.motion.t/s.motion.duration,0,1):0;
 const active=u=>u.light&&u.water&&u.co2;
 function fullBox(w,h,ar=960/620){const wide=w>h,left=wide?356:16,availableW=w-left-16,availableH=wide?h-212:h*.57-212,width=Math.min(availableW,availableH*ar);return {left,width,height:width/ar};}
 return {create,clamp,steps,can,act,tick,progress,active,fullBox};
});

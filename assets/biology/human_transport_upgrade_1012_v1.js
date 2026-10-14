/* Scoped registration glue: only human. Existing shared shell stays intact.
 * Teacher authorised the new drawings, branching circuit and lymph branch
 * removal. Original experiment timers/actions/records remain byte-identical.
 */
(function(root){
  'use strict';
  const B=root.LivingBook,T=root.HumanTransportTeaching,C=root.HumanTransportCutaways;
  const G=root.HumanTransportCirculation,V=root.HumanTransportValveMedia,X=root.HumanTransportExchanges,J=root.HumanTransportLymphJourney;
  if(!B||!T||!C||!G||!V||!X||!J)throw new Error('Human transport upgrade dependencies are missing.');
  const P=(a,b)=>[a,b], group=(label,items)=>({label,items}), item=(label,key,value)=>({label,key,value});
  const originalRegister=B.register,originals={},sounds=new WeakMap();let audio;
  function enableSound(){const A=root.AudioContext||root.webkitAudioContext;if(!A)return false;try{audio=audio||new A();audio.resume();return true;}catch{return false;}}
  function tone(sound){if(!audio||audio.state!=='running')return;const at=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(sound==='S1'?72:96,at);osc.frequency.exponentialRampToValueAtTime(sound==='S1'?44:66,at+.12);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.27,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.15);osc.connect(gain);gain.connect(audio.destination);osc.start(at);osc.stop(at+.16);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
  function playEvents(s,q){let memo=sounds.get(s);if(!memo){memo=new Set();sounds.set(s,memo);}if(!s.sound||!s.running||s.auto===false||s.cutawayPhase||root.document?.hidden)return;for(const e of q.events||[]){if(e.sound&&!memo.has(e.id)){tone(e.sound);memo.add(e.id);}}if(memo.size>20){const ids=[...memo].slice(-8);memo.clear();ids.forEach(id=>memo.add(id));}}
  function text(ctx,D,p,x,y,size=22,color='#f2ecd9'){ctx.save();ctx.font=`700 ${size}px "Noto Sans TC", "JetBrains Mono", sans-serif`;ctx.fillStyle=color;ctx.fillText(D.tr(p),x,y);ctx.restore();}
  function largePulse(ctx,s,t,D){
    text(ctx,D,P('心室射血，動脈壁把脈波傳出去','Ventricular ejection sends a wave along artery walls'),24,36,26,'#fde047');
    const phase=((t%2.8)+2.8)%2.8;
    D.round(ctx,24,64,166,62,12,phase<1.18?'#683c39':'#214638','#b38c78');
    text(ctx,D,P(phase<1.18?'射血進動脈':'回彈、持續流動',phase<1.18?'Ejection':'Recoil / flow'),40,102,22);
    D.line(ctx,[[190,95],[300,95],[340,154]],'#fb923c',5);
    text(ctx,D,P('看管壁，不是追一顆紅血球。','Watch the wall, not one travelling red cell.'),332,99,22);
    C.pulseDraw(ctx,s,t,{...D,pulseBounds:{x:24,y:147,w:912,h:322}});
    text(ctx,D,P('脈波到達手腕時，管壁向外擴張，再回復。','At the wrist, the passing wave expands the wall; it then recoils.'),24,518,22);
    text(ctx,D,P('血球同時向前流，但跑得比脈波慢。','Blood cells move forward too, but more slowly than the wave.'),24,554,22,'#55e9ff');
    text(ctx,D,P('教學模型・請切換「一分鐘紀錄」量自己的心搏與脈搏。','Teaching model · use “One-minute records” for your own counts.'),24,589,20,'#b9cbbd');
    D.status(P('壓力波讓管壁依序擴張；動畫不會自動填入實測紀錄。','A pressure wave expands the wall in sequence; no model counts are saved as measurements.'));
  }
  function install(spec){
    const next=T.apply(spec);next.tabs=next.tabs.map(tab=>({...tab}));
    for(const tab of spec.tabs)originals[tab.id]=tab;
    const heart=next.tabs.find(x=>x.id==='heart'),oldHeart=originals.heart;
    heart.init=()=>({...oldHeart.init(),view:'medical',sound:false});
    heart.controls=s=>[
      group(P('瓣膜與位置','Valves and position'),[item(P('兩瓣醫學動畫','Two-valve medical animation'),'view','medical'),item(P('開關與心音','Valves and sounds'),'view','heart'),item(P('人體位置','Body position'),'view','body')]),
      ...oldHeart.controls(s).slice(1),
      group(P('進階拆慢看','Extra slow phases'),[item(P('等容收縮（兩瓣關）','Isovolumetric contraction'),'cutawayPhase','isovolumetric-contraction'),item(P('等容舒張（兩瓣關）','Isovolumetric relaxation'),'cutawayPhase','isovolumetric-relaxation')]),
      group(P('教學合成心音','Synthesized teaching sounds'),[item(s.sound?P('關閉心音','Mute sounds'):P('開啟 S1／S2 心音','Enable S1 / S2'),'sound',!s.sound)])
    ];
    heart.act=(s,key,value)=>{
      if(key==='sound'){s.sound=!!value&&enableSound();s.view='heart';s.auto=true;s.cutawayPhase=null;s.running=true;return;}
      if(key==='cutawayPhase'){s.cutawayPhase=value;s.view='heart';s.auto=false;s.running=true;return;}
      if(key==='phase'||key==='action'){s.cutawayPhase=null;s.view='heart';}
      if(key==='view'&&value==='medical')s.sound=false;
      oldHeart.act(s,key,value);
    };
    heart.draw=(ctx,s,t,D)=>{if(s.view==='medical')return V.draw(ctx,s,t,D);const q=C.heartDraw(ctx,s,t,D);playEvents(s,q);return q;};
    heart.explain=s=>{
      if(s.view==='medical')return{title:P('房室瓣與半月瓣：先看形狀','AV and semilunar valves: first observe their shapes'),text:P('上窗是房室瓣中的二尖瓣（原圖 C）；下窗是半月瓣中的主動脈瓣（原圖 A）。兩窗同格播放，保留原影像順序並放慢。\n\n切到「開關與心音」，用同步教學剖面對照：房室瓣關閉 → S1；半月瓣關閉 → S2。一組「咚咚」是一次心搏。這段醫學動畫沒有配上推測的心音。','The upper window shows the mitral AV valve (C); the lower shows the aortic semilunar valve (A). Both show the same slowed source frame.\n\nChoose “Valves and sounds” for the synchronized teaching cutaway: AV closure → S1; semilunar closure → S2. One lub-dub pair is one heartbeat. No guessed sound timing is added to this medical animation.')};
      const selected=oldHeart.explain(s),phase=C.heartExplain(s);
      return{title:selected.title,text:phase.text.map((p,i)=>(selected.text[i].split('\n\n')[0])+'\n\n'+p+'\n\n'+T.copy.heart.modelNote[i])};
    };
    heart.check=s=>({...oldHeart.check(s),valves:s.cutawayTimeline?{avOpen:s.cutawayTimeline.avOpen,slOpen:s.cutawayTimeline.slOpen}:null,oneS1S2PairOneBeat:true,medicalAnimationIsCG:true});
    next.tabs.find(x=>x.id==='vessels').draw=C.vesselsDraw;
    const blood=next.tabs.find(x=>x.id==='blood'),oldBloodControls=blood.controls,oldBloodExplain=blood.explain;
    blood.draw=C.bloodDraw;
    blood.controls=s=>[...oldBloodControls(s).map(g=>({...g,items:g.items.filter(i=>!(i.key==='view'&&i.value==='focus'&&s.component==='plasma')).map(i=>i.key==='view'&&i.value==='focus'?{...i,label:({rbc:P('放大紅血球','Enlarge red cell'),wbc:P('放大白血球','Enlarge white cell'),platelet:P('放大血小板','Enlarge platelet')})[s.component]}:i)})),...(s.task==='repair'?[group(P('止血：完整播放／分段看','Hemostasis: play / inspect'),[
      item(P('重播完整止血','Replay hemostasis'),'repairStage','auto'),
      ...C.hemostasisStages.map(p=>item(p.name,'repairStage',p.id))
    ])]:[])];
    blood.act=(s,k,v)=>{
      if(k==='repairStage'){
        s.repairStage=v;s.repair=v==='auto'?0:C.hemostasisStages.find(p=>p.id===v).progress;s.running=true;return;
      }
      originals.blood.act(s,k,v);
      // Plasma has no distinct cell crop; never show two identical smear views.
      if(s.component==='plasma'&&s.view==='focus')s.view='smear';
      if(k==='action'&&v==='repair'){s.repairStage='auto';s.running=true;}
    };
    blood.explain=s=>s.task==='repair'?C.hemostasisExplain(s):oldBloodExplain(s);
    const circulation=next.tabs.find(x=>x.id==='circulation'),oldCircle=originals.circulation;
    circulation.init=()=>({...oldCircle.init(),organ:'tissue',exchange:null,substance:'all',exchangeSpeed:1,lungView:'gas',kidneyView:'cells'});
    circulation.controls=s=>[
      group(P('完整路線／六大物質交換區','Whole circuit / six exchange regions'),[item(P('完整封閉路線','Complete closed circuit'),'view','loop'),...X.zones.map(z=>item(z.name,'exchange',z.id))]),
      ...(s.view==='exchange'?[
        ...(s.exchange==='lung'?[group(P('肺：兩種不同的交換','Lungs: two kinds of exchange'),[
          item(P('肺泡與空氣換氣','Alveolar gas exchange'),'lungView','gas'),
          item(P('肺細胞也要葡萄糖','Lung cells need glucose'),'lungView','cells')
        ])]:[]),
        ...(s.exchange==='kidney'?[group(P('主課程／延伸閱讀（不考）','Main lesson / optional non-exam reading'),[
          item(P('腎細胞物質交換','Kidney-cell exchanges'),'kidneyView','cells'),
          item(P('延伸閱讀：過濾與再吸收','Extra: filtration / reabsorption'),'kidneyView','extension')
        ])]:[]),
        group(P('追蹤哪種物質？','Which substance?'),[item(P('一起看交換','All exchanges'),'substance','all'),...Object.entries(X.species).filter(([k])=>X.flows(s.exchange,s.lungView,s.kidneyView).some(f=>f.kind===k)).map(([k,v])=>item(v.name,'substance',k))]),
        group(P('放慢看穿過界面','Slow the crossing'),[item(P('慢速','Slow'),'exchangeSpeed',.5),item(P('標準','Normal'),'exchangeSpeed',1)])
      ]:[...oldCircle.controls(s).slice(1),group(P('選器官供血支路','Choose an organ supply branch'),G.organs.map(o=>item(o.name,'organ',o.id)))])
    ];
    circulation.act=(s,k,v)=>{if(k==='exchange'){s.exchange=v;s.view='exchange';s.substance='all';s.running=true;}else if(k==='lungView'||k==='kidneyView'){s[k]=v;s.substance='all';s.running=true;}else if(k==='organ'){s.organ=v;s.exchange=null;s.view='loop';s.travel=0;s.running=true;}else if(k==='substance'||k==='exchangeSpeed'){s[k]=v;}else{if(k==='view'&&v==='loop')s.exchange=null;oldCircle.act(s,k,v);}};
    circulation.draw=(ctx,s,t,D)=>s.view==='exchange'?X.draw(ctx,s,t,D):s.view==='loop'?G.draw(ctx,s,t,D):oldCircle.draw(ctx,s,t,D);
    circulation.explain=s=>s.view==='exchange'?X.explain(s):s.view==='loop'?G.explain(s):oldCircle.explain(s);
    circulation.check=s=>({...oldCircle.check(s),graph:G.graph,organ:s.organ,portalReturnsViaLiver:true,coronaryReturnsViaSinus:true,exchange:s.exchangeTrace||null});
    const lymph=next.tabs.find(x=>x.id==='lymph');
    lymph.draw=J.draw;
    lymph.explain=J.explain;
    lymph.controls=s=>[group(P('原圖與放大，串起完整回程','Map and close-up: follow the complete return'),[
      item(P('自動播放完整旅程','Autoplay the journey'),'lymphStep','auto'),
      ...J.steps.map(p=>item(p.name,'lymphStep',p.id))
    ])];
    const oldLymphAct=lymph.act;
    lymph.act=(s,k,v)=>{if(k==='lymphStep'){s.lymphStep=v;s.lymphStarted=s.elapsed||0;s.running=true;}else if(oldLymphAct)oldLymphAct(s,k,v);else s[k]=v;};
    const oldLymphInit=lymph.init;
    lymph.init=()=>({...oldLymphInit(),lymphStep:'auto',lymphStarted:0});
    const experiment=next.tabs.find(x=>x.id==='experiment'),oldExp=originals.experiment;
    const modes=group(P('先看模型，再做實驗','Model, then your experiment'),[
      item(P('動脈脈搏剖面','Arterial pulse cutaway'),'view','pulse'),
      item(P('一分鐘紀錄','One-minute records'),'view','records'),
      item(P('魚尾血流模擬','Fish-tail model'),'view','fish')]);
    experiment.controls=s=>s.view==='pulse'?[modes]:[modes,...oldExp.controls(s).slice(1)];
    experiment.draw=(ctx,s,t,D)=>{
      if(s.view==='pulse')return largePulse(ctx,s,t,D);
      // Shorten only the English footer UI; keep native timer/drawing source intact.
      const recordD={...D,text(c,p,x,y,o){
        if(Array.isArray(p)&&p[1]==='Screen pause does not stop the real clock. A lub-dub pair counts once. Examples are separate.')p=[p[0],'Pause stops the model, not the timer. One lub-dub = one beat.'];
        return D.text(c,p,x,y,o);
      }};
      oldExp.draw(ctx,s,t,s.view==='fish'?D:recordD);
      if(s.view!=='fish')C.pulseDraw(ctx,s,t,D);
    };
    experiment.explain=s=>s.view==='pulse'?{title:P('射入動脈的不是一顆球，而是一股血','A bolus of blood, not one cell'),text:T.copy.experiment.caption.map((p,i)=>p+'\n\n'+T.copy.experiment.modelNote[i])}:originals.experiment.explain(s);
    // Preserve native one-minute timer/records and fish interactions unchanged.
    next.reviewNotes=P('依老師授權重繪重點模型；原實時計時、紀錄與魚尾操作保留。瓣膜原動畫授權與修正驗證另列於來源。','Teacher-authorized model redraws; original real timers, records and fish controls retained. Animation licences and checks are documented.');
    return next;
  }
  B.register=function(spec){return originalRegister.call(B,spec?.id==='human'?install(spec):spec);};
  if(root.document){
    const credit=document.getElementById('humanUpgradeCredits');
    if(credit)new MutationObserver(()=>{
      const en=document.documentElement.lang==='en';credit.querySelectorAll('[data-zh][data-en]').forEach(n=>{n.textContent=n.dataset[en?'en':'zh'];});
    }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  // Fullscreen (landscape): move the controls and the caption into one left
  // column so the canvas can use the full height on the right. Moves the same
  // nodes (ids unchanged) and puts them back on exit or in portrait.
  if(root.document){
    const bench=document.getElementById('bench'),landscape=root.matchMedia?root.matchMedia('(orientation: landscape)'):null;
    if(bench){
      const side=document.createElement('div');side.className='side-column';
      const sync=()=>{
        const controls=document.getElementById('controls'),workspace=bench.querySelector('.workspace'),caption=bench.querySelector('.caption');
        if(!controls||!workspace||!caption)return;
        const want=bench.classList.contains('expanded')&&(!landscape||landscape.matches);
        if(want&&side.parentNode!==bench){bench.insertBefore(side,workspace);side.append(controls,caption);}
        else if(!want&&side.parentNode===bench){bench.insertBefore(controls,workspace);workspace.append(caption);side.remove();}
      };
      new MutationObserver(sync).observe(bench,{attributes:true,attributeFilter:['class']});
      if(landscape)(landscape.addEventListener?landscape.addEventListener('change',sync):landscape.addListener(sync));
    }
  }
  root.HumanTransportUpgrade=Object.freeze({version:'1012_v1',originals,install,largePulse});
})(globalThis);

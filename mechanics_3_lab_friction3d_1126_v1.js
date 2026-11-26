/* mechanics_3_lab_friction3d_1126_v1.js — 「動手做｜3D 摩擦力虛擬實驗室」實驗台（#frictionLabCanvas，邏輯 1000×650，2x 高解析）
 *
 * 契約：window.W5Lab.friction3d = { activate(), deactivate(), relang(), _state() }
 * 本檔載入時自己把實驗台 DOM 附加到 #tab3 最後（在所有 .sub-view 之後），並注入 <style id="lab-friction3d-css">；自給自足。
 * 依賴頁面全域 tr('中文','English')（沒有時退回中文）。
 *
 * ★ 老師親手做的功能：3D 投影引擎與物理數字「原樣搬家」自舊版（/home/claude/mech3_old.html 的 3D 摩擦力虛擬實驗室），沒有改寫：
 *   木塊 200 gw、每顆砝碼 50 gw；muS 0.20／0.35／0.55、muK 0.15／0.27／0.42（光滑塑膠／木板／粗砂紙）；
 *   最大靜摩擦力 ＝ muS × N、動摩擦力 ＝ muK × N；拉動手感（拉力 ＝ 沿秤方向位移 × 0.48，上限 150；滑動位移 ＝ (拉力 − 動摩擦) × 1.25，上限 185）；
 *   鏡頭（yaw 0.78／pitch 0.42／distance 930／focal 850）與全部繪圖座標。
 *   只改了：①面板版面與掛載方式（AGENTS 3.5）；②onclick 改 addEventListener；③畫布 2x 高解析（ctx.setTransform，座標不變）；
 *   ④畫布內標籤字 18px → 20px；⑤舊版常駐 RAF 迴圈取消（每次狀態改變本來就直接重畫，靜止時 0 成本）；
 *   ⑥結果框多一行「測得峰值」；⑦畫布右上「彈簧秤」小面板加寬並把標題放大到 20px（英文標題原本 17px 會超出框）；⑧結果文字記下中英兩版，relang() 時可重畫。
 * 動畫只在使用者操作時重畫，沒有常駐 RAF。
 */
(function () {
  'use strict';
  window.W5Lab = window.W5Lab || {};

  const KEY = 'friction3d', TAB = 'tab3';
  const LW = 1000, LH = 650, DPR = 2;                  /* 畫布邏輯座標與輸出解析度倍率 */
  const tr = (zh, en) => (typeof window.tr === 'function' ? window.tr(zh, en) : zh);

  /* ═════════ 舊版引擎（原樣搬家）═════════ */
    function drawArrow(ctx, fromX, fromY, toX, toY, color, width) {
        if(Math.abs(fromX - toX) < 1 && Math.abs(fromY - toY) < 1) return;
        let headlen = width * 2.5; 
        let dx = toX - fromX;
        let dy = toY - fromY;
        let angle = Math.atan2(dy, dx);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }    const frictionMaterials = {
        acrylic: { zh: '光滑塑膠', en: 'Smooth acrylic', muS: .20, muK: .15, top: 'rgba(191,239,255,.78)', side: '#4a7180', line: 'rgba(85,233,255,.48)' },
        wood: { zh: '木板', en: 'Wood', muS: .35, muK: .27, top: '#a56a3b', side: '#5a351f', line: 'rgba(253,224,71,.30)' },
        sandpaper: { zh: '粗砂紙', en: 'Coarse sandpaper', muS: .55, muK: .42, top: '#4d5352', side: '#282d2c', line: 'rgba(242,236,217,.26)' }
    };
    const frictionFaces = [
        { zh: '大面', en: 'Large face', dims: [180, 78, 112], area: '180 × 112' },
        { zh: '中面', en: 'Medium face', dims: [180, 112, 78], area: '180 × 78' },
        { zh: '小面', en: 'Small face', dims: [112, 180, 78], area: '112 × 78' }
    ];
    const frictionTasks = [
        { titleZh: '自由探索｜先把器材玩懂', titleEn: 'Free Play | Learn the apparatus', textZh: '轉動視角看看實驗桌，再切換到拉動模式。你可以任意換材質、翻木塊、加減砝碼，觀察什麼會改變臨界讀數。', textEn: 'Orbit around the table, then switch to Pull. Change the material, block face, and masses to see what changes the threshold.' },
        { titleZh: '任務 1｜抓住剛要滑動的瞬間', titleEn: 'Task 1 | Capture the threshold', textZh: '使用木板、大面、0 顆砝碼。緩慢水平拉動，觀察靜摩擦力如何跟著拉力增加；木塊一滑動就記錄峰值。', textEn: 'Use wood, the large face, and no extra masses. Pull slowly and record the peak as the block begins to slide.' },
        { titleZh: '任務 2｜材質偵探', titleEn: 'Task 2 | Material detective', textZh: '固定大面與 0 顆砝碼，分別測光滑塑膠、木板、粗砂紙。找出哪一種材質的最大靜摩擦力最大。', textEn: 'Keep the large face and zero extra masses. Test acrylic, wood, and sandpaper to find the largest maximum static friction.' },
        { titleZh: '任務 3｜翻面迷思', titleEn: 'Task 3 | The contact-area myth', textZh: '固定木板材質與 0 顆砝碼，把同一木塊翻成大、中、小三個面。三次測量會告訴你接觸面積是否影響結果。', textEn: 'Keep the wood surface and no extra masses. Test all three faces of the same block to investigate contact area.' },
        { titleZh: '任務 4｜越重越難拉？', titleEn: 'Task 4 | Does heavier mean harder?', textZh: '固定木板與大面，依序測 0、1、2 顆砝碼。比較最大靜摩擦力與總重量的關係。', textEn: 'Keep wood and the large face. Test 0, 1, and 2 masses, then compare maximum static friction with total weight.' }
    ];
    const frictionLab = {
        initialized: false, task: 0, material: 'wood', face: 0, extraMasses: 0,
        pull: 0, friction: 0, peak: null, sliding: false, blockOffset: 0,
        tool: 'orbit', yaw: .78, pitch: .42, distance: 930,
        pointers: new Map(), drag: null, records: [], frames: 0
    };
    let frictionAnimId = null;
    let frictionFacesQueue = [];
    let frictionLabelsQueue = [];

    function fv(x=0, y=0, z=0) { return { x, y, z }; }
    function fadd(a,b) { return fv(a.x+b.x, a.y+b.y, a.z+b.z); }
    function fsub(a,b) { return fv(a.x-b.x, a.y-b.y, a.z-b.z); }
    function fscale(a,s) { return fv(a.x*s, a.y*s, a.z*s); }
    function fdot(a,b) { return a.x*b.x + a.y*b.y + a.z*b.z; }
    function fcross(a,b) { return fv(a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x); }
    function fnorm(a) { const d = Math.hypot(a.x,a.y,a.z) || 1; return fscale(a,1/d); }
    function fclamp(v,min,max) { return Math.max(min, Math.min(max,v)); }

    function frictionCamera() {
        const cp = Math.cos(frictionLab.pitch);
        const camera = fv(
            frictionLab.distance * cp * Math.cos(frictionLab.yaw),
            95 + frictionLab.distance * Math.sin(frictionLab.pitch),
            frictionLab.distance * cp * Math.sin(frictionLab.yaw)
        );
        const target = fv(0, 18, 0);
        const forward = fnorm(fsub(target, camera));
        const right = fnorm(fcross(forward, fv(0,1,0)));
        const up = fnorm(fcross(right, forward));
        return { camera, forward, right, up, focal: 850 };
    }

    function frictionProject(point) {
        const basis = frictionCamera();
        const r = fsub(point, basis.camera);
        const depth = fdot(r, basis.forward);
        const scale = basis.focal / Math.max(90, depth);
        return { x: 500 + fdot(r,basis.right)*scale, y: 335 - fdot(r,basis.up)*scale, depth, scale };
    }

    function queueFrictionFace(points, fill, stroke='rgba(242,236,217,.22)', lineWidth=1.3) {
        const projected = points.map(frictionProject);
        const depth = projected.reduce((sum,p)=>sum+p.depth,0)/projected.length;
        frictionFacesQueue.push({ projected, depth, fill, stroke, lineWidth });
    }

    function queueFrictionCuboid(cx, bottom, cz, dx, dy, dz, colors) {
        const x0=cx-dx/2, x1=cx+dx/2, y0=bottom, y1=bottom+dy, z0=cz-dz/2, z1=cz+dz/2;
        const p = [fv(x0,y0,z0),fv(x1,y0,z0),fv(x1,y0,z1),fv(x0,y0,z1),fv(x0,y1,z0),fv(x1,y1,z0),fv(x1,y1,z1),fv(x0,y1,z1)];
        queueFrictionFace([p[0],p[1],p[5],p[4]], colors.front || colors.side);
        queueFrictionFace([p[1],p[2],p[6],p[5]], colors.side);
        queueFrictionFace([p[2],p[3],p[7],p[6]], colors.back || colors.side);
        queueFrictionFace([p[3],p[0],p[4],p[7]], colors.side);
        queueFrictionFace([p[4],p[5],p[6],p[7]], colors.top);
    }

    function queueFrictionCylinder(cx, bottom, cz, radius, height, color, segments=18) {
        const lower=[], upper=[];
        for(let i=0;i<segments;i++) {
            const a=Math.PI*2*i/segments;
            lower.push(fv(cx+Math.cos(a)*radius,bottom,cz+Math.sin(a)*radius));
            upper.push(fv(cx+Math.cos(a)*radius,bottom+height,cz+Math.sin(a)*radius));
        }
        for(let i=0;i<segments;i++) queueFrictionFace([lower[i],lower[(i+1)%segments],upper[(i+1)%segments],upper[i]], color, 'rgba(242,236,217,.20)', .8);
        queueFrictionFace(upper, color, 'rgba(253,224,71,.48)', 1.2);
    }

    function frictionLine3D(ctx, points, color, width=3, dash=[]) {
        const ps=points.map(frictionProject);
        ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.setLineDash(dash); ctx.beginPath();
        ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke(); ctx.restore();
    }

    function frictionArrow3D(ctx, from, to, color, width=5) {
        const a=frictionProject(from), b=frictionProject(to);
        drawArrow(ctx,a.x,a.y,b.x,b.y,color,width);
    }

    function frictionLabel(point, text, color) { frictionLabelsQueue.push({ point, text, color }); }

    function drawFrictionLabel(ctx, item) {
        const p=frictionProject(item.point);
        ctx.save(); ctx.font='900 20px "JetBrains Mono", "Noto Sans TC", sans-serif';
        const pad=10, w=ctx.measureText(item.text).width+pad*2, h=36;
        ctx.fillStyle='rgba(5,27,22,.72)'; ctx.strokeStyle=item.color; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(p.x-w/2,p.y-h/2,w,h,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=item.color; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(item.text,p.x,p.y+1); ctx.restore();
    }

    function frictionPhysics() {
        const mat=frictionMaterials[frictionLab.material];
        const normal=200+frictionLab.extraMasses*50;
        return { normal, maxStatic: mat.muS*normal, kinetic: mat.muK*normal };
    }

    function currentFriction() {
        const phy=frictionPhysics();
        return frictionLab.sliding ? phy.kinetic : Math.min(frictionLab.pull,phy.maxStatic);
    }

    function drawFrictionLab() {
        const canvas=document.getElementById('frictionLabCanvas');
        if(!canvas) return;
        const ctx=canvas.getContext('2d');
        ctx.setTransform(DPR,0,0,DPR,0,0);
        ctx.clearRect(0,0,LW,LH);
        const grad=ctx.createRadialGradient(510,235,40,500,340,670);
        grad.addColorStop(0,'#214b40'); grad.addColorStop(1,'#071a16'); ctx.fillStyle=grad; ctx.fillRect(0,0,1000,650);

        frictionFacesQueue=[]; frictionLabelsQueue=[];
        const mat=frictionMaterials[frictionLab.material];
        queueFrictionCuboid(0,-30,0,780,30,430,{top:mat.top,side:mat.side,front:mat.side});
        [[-315,-238],[-315,238],[315,-238],[315,238]].forEach(([x,z])=>queueFrictionCuboid(x,-270,z,46,240,46,{top:'#60746d',side:'#354a43'}));

        const dims=frictionFaces[frictionLab.face].dims;
        const blockX=-115+frictionLab.blockOffset;
        const blockRight=blockX+dims[0]/2;
        const hookY=4+dims[1]*.52;
        const scaleStart=blockRight+25;
        const handleX=scaleStart+210+frictionLab.pull*1.35;

        frictionFacesQueue.sort((a,b)=>b.depth-a.depth).forEach(face=>{
            ctx.beginPath(); face.projected.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath();
            ctx.fillStyle=face.fill; ctx.fill(); ctx.strokeStyle=face.stroke; ctx.lineWidth=face.lineWidth; ctx.stroke();
        });

        // 桌面紋理：隨視角一起投影，讓材質是真正貼在 3D 平面上。
        if(frictionLab.material==='sandpaper') {
            for(let x=-350;x<=350;x+=45) for(let z=-190;z<=190;z+=43) {
                const p=frictionProject(fv(x,2,z)); ctx.fillStyle='rgba(242,236,217,.25)'; ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fill();
            }
        } else {
            for(let z=-180;z<=180;z+=42) frictionLine3D(ctx,[fv(-370,2,z),fv(370,2,z)],mat.line,frictionLab.material==='wood'?2:1);
        }

        // 器材在桌面紋理之後繪製，避免紋理穿過木塊。
        frictionFacesQueue=[];
        queueFrictionCuboid(blockX,4,0,dims[0],dims[1],dims[2],{top:'#c68a4d',side:'#8b542e',front:'#9d6136',back:'#714125'});
        for(let i=0;i<frictionLab.extraMasses;i++) queueFrictionCylinder(blockX,6+dims[1]+i*26,0,35,23,'#c89b31');
        queueFrictionCuboid(scaleStart+90,hookY-18,0,170,36,42,{top:'rgba(226,238,235,.78)',side:'rgba(93,121,115,.76)',front:'rgba(210,228,223,.65)'});
        queueFrictionCylinder(handleX,hookY-24,0,24,48,'#fb923c',20);
        frictionFacesQueue.sort((a,b)=>b.depth-a.depth).forEach(face=>{
            ctx.beginPath(); face.projected.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath();
            ctx.fillStyle=face.fill; ctx.fill(); ctx.strokeStyle=face.stroke; ctx.lineWidth=face.lineWidth; ctx.stroke();
        });

        // 木紋與實驗繩線。
        for(let y=20;y<dims[1];y+=22) frictionLine3D(ctx,[fv(blockX-dims[0]/2,y, -dims[2]/2-.4),fv(blockX+dims[0]/2,y,-dims[2]/2-.4)],'rgba(70,32,15,.34)',1.2);
        frictionLine3D(ctx,[fv(blockRight,hookY,0),fv(scaleStart+5,hookY,0)],'#f2ecd9',3);
        const spring=[];
        for(let i=0;i<=16;i++) spring.push(fv(scaleStart+14+i*9.2,hookY+(i%2?7:-7),0));
        frictionLine3D(ctx,spring,'#233a34',2.2);
        frictionLine3D(ctx,[fv(scaleStart+175,hookY,0),fv(handleX,hookY,0)],'#f2ecd9',3);

        const phy=frictionPhysics();
        if(frictionLab.pull>1) frictionArrow3D(ctx,fv(blockX,hookY+36,0),fv(blockX+Math.min(150,frictionLab.pull*1.15),hookY+36,0),'#fde047',5);
        if(currentFriction()>1) frictionArrow3D(ctx,fv(blockX,hookY+14,0),fv(blockX-Math.min(150,currentFriction()*1.15),hookY+14,0),'#f472b6',5);

        frictionLabel(fv(-310,18,165),tr(mat.zh,mat.en),'#55e9ff');
        frictionLabel(fv(blockX,28+dims[1]+frictionLab.extraMasses*26,0),`${200+frictionLab.extraMasses*50} g`,'#fde047');
        frictionLabel(fv(blockX,6,-dims[2]/2-26),tr(`${frictionFaces[frictionLab.face].zh} ${frictionFaces[frictionLab.face].area}`,`${frictionFaces[frictionLab.face].en} ${frictionFaces[frictionLab.face].area}`),'#f472b6');
        frictionLabel(fv(handleX,hookY+58,0),tr('抓住沿秤拉','DRAG ALONG SCALE'),'#fb923c');
        frictionLabelsQueue.forEach(item=>drawFrictionLabel(ctx,item));

        // 半透明懸浮式彈簧秤面板。
        ctx.save(); ctx.fillStyle='rgba(5,27,22,.60)'; ctx.strokeStyle='rgba(85,233,255,.55)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(646,118,318,106,13); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#55e9ff'; ctx.font='900 20px "Noto Sans TC",sans-serif'; ctx.textAlign='center'; ctx.fillText(tr('彈簧秤｜水平拉力','SPRING SCALE | HORIZONTAL'),805,145);
        ctx.strokeStyle='rgba(242,236,217,.28)'; ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(711,184); ctx.lineTo(899,184); ctx.stroke();
        ctx.strokeStyle='#fde047'; ctx.beginPath(); ctx.moveTo(711,184); ctx.lineTo(711+188*fclamp(frictionLab.pull/150,0,1),184); ctx.stroke();
        ctx.fillStyle='#f2ecd9'; ctx.font='900 22px "JetBrains Mono",monospace'; ctx.fillText(`${frictionLab.pull.toFixed(1)} gw`,805,214); ctx.restore();

        updateFrictionReadouts();
    }

    function updateFrictionReadouts() {
        const phy=frictionPhysics();
        frictionLab.friction=currentFriction();
        const pull=document.getElementById('frictionPullReadout');
        const friction=document.getElementById('frictionForceReadout');
        const peak=document.getElementById('frictionPeakReadout');
        if(pull) pull.textContent=`${frictionLab.pull.toFixed(1)} gw`;
        if(friction) friction.textContent=`${frictionLab.friction.toFixed(1)} gw`;
        if(peak) peak.textContent=frictionLab.peak===null?'—':`${frictionLab.peak.toFixed(1)} gw`;
        const peakRes=document.getElementById('frictionPeakResult');
        if(peakRes) peakRes.textContent=frictionLab.peak===null?'—':`${frictionLab.peak.toFixed(1)} gw`;
        const state=document.getElementById('frictionStateText');
        if(state) {
            if(frictionLab.tool==='orbit') state.textContent=tr('360° 觀察模式｜拖動畫面翻轉實驗桌','Orbit mode | Drag to inspect the apparatus');
            else if(frictionLab.sliding) state.textContent=tr(`已滑動｜摩擦力降為動摩擦力 ${phy.kinetic.toFixed(1)} gw`,`Sliding | Friction dropped to kinetic friction ${phy.kinetic.toFixed(1)} gw`);
            else if(frictionLab.peak!==null&&frictionLab.pull>0) state.textContent=tr('木塊已停住｜重新進入靜摩擦，摩擦力跟著拉力變化','Block stopped | Static friction once again matches the pull');
            else state.textContent=tr('拉動模式｜抓住橘色把手，沿著彈簧秤方向慢慢拉','Pull mode | Grab the orange handle and drag slowly along the scale');
        }
        const record=document.getElementById('frictionRecordBtn');
        if(record) record.disabled=frictionLab.peak===null;
    }

    function initFrictionLab() {
        if(!frictionLab.initialized) {
            frictionLab.initialized=true;
            bindFrictionCanvas();
            selectFrictionTask(0);
            setFrictionTool('orbit');
        }
        updateFrictionUI(false);
        drawFrictionLab();
    }

    /* 舊版常駐 RAF 迴圈：所有狀態改變（拖曳、按鈕、滾輪）本來就直接 drawFrictionLab()，
       常駐迴圈只是重複畫同一張；改成「不跑迴圈」，靜止時 0 成本。 */
    function runFrictionLoop() { drawFrictionLab(); }

    function selectFrictionTask(index) {
        frictionLab.task=index;
        document.querySelectorAll('.friction-task-btn').forEach((btn,i)=>btn.classList.toggle('active',i===index));
        if(index===1) { frictionLab.material='wood'; frictionLab.face=0; frictionLab.extraMasses=0; }
        if(index===2) { frictionLab.material='acrylic'; frictionLab.face=0; frictionLab.extraMasses=0; }
        if(index===3) { frictionLab.material='wood'; frictionLab.face=0; frictionLab.extraMasses=0; }
        if(index===4) { frictionLab.material='wood'; frictionLab.face=0; frictionLab.extraMasses=0; }
        resetFrictionTrial();
        updateFrictionUI(false);
    }

    function setFrictionTool(tool) {
        frictionLab.tool=tool;
        document.getElementById('frictionOrbitTool')?.classList.toggle('active',tool==='orbit');
        document.getElementById('frictionPullTool')?.classList.toggle('active',tool==='pull');
        const canvas=document.getElementById('frictionLabCanvas');
        canvas?.classList.toggle('orbit-mode',tool==='orbit');
        canvas?.classList.toggle('pull-mode',tool==='pull');
        updateFrictionReadouts();
    }

    function setFrictionMaterial(material) { frictionLab.material=material; resetFrictionTrial(); updateFrictionUI(false); }
    function setFrictionFace(face) { frictionLab.face=face; resetFrictionTrial(); updateFrictionUI(false); }
    function changeFrictionMass(step) { frictionLab.extraMasses=fclamp(frictionLab.extraMasses+step,0,3); resetFrictionTrial(); updateFrictionUI(false); }

    function resetFrictionTrial() {
        frictionLab.pull=0; frictionLab.friction=0; frictionLab.peak=null; frictionLab.sliding=false; frictionLab.blockOffset=0; frictionLab.drag=null;
        updateFrictionReadouts(); drawFrictionLab();
    }

    function resetFrictionView() { frictionLab.yaw=.78; frictionLab.pitch=.42; frictionLab.distance=930; drawFrictionLab(); }

    function updateFrictionUI(redraw=true) {
        const task=frictionTasks[frictionLab.task];
        const title=document.getElementById('frictionTaskTitle');
        const text=document.getElementById('frictionTaskText');
        if(title) title.textContent=tr(task.titleZh,task.titleEn);
        if(text) text.textContent=tr(task.textZh,task.textEn);
        ['acrylic','wood','sandpaper'].forEach((m,i)=>document.getElementById(['surfaceAcrylic','surfaceWood','surfaceSand'][i])?.classList.toggle('active',frictionLab.material===m));
        [0,1,2].forEach(i=>document.getElementById(['faceLarge','faceMedium','faceSmall'][i])?.classList.toggle('active',frictionLab.face===i));
        const mass=document.getElementById('frictionMassOutput'); if(mass) mass.textContent=`${frictionLab.extraMasses*50} g`;
        renderFrictionRecords();
        if(redraw) drawFrictionLab();
    }

    function recordFrictionTrial() {
        if(frictionLab.peak===null) return;
        frictionLab.records.push({ task:frictionLab.task, material:frictionLab.material, face:frictionLab.face, extra:frictionLab.extraMasses, total:200+frictionLab.extraMasses*50, peak:frictionLab.peak });
        renderFrictionRecords();
        evaluateFrictionTask();
    }

    function renderFrictionRecords() {
        const body=document.getElementById('frictionRecordBody'); if(!body) return;
        if(!frictionLab.records.length) {
            body.innerHTML=`<tr><td colspan="5">${tr('尚未記錄；先完成一次拉動。','No records yet. Complete one pull first.')}</td></tr>`;
            return;
        }
        body.innerHTML=frictionLab.records.slice(-8).map((r,i)=>`<tr><td>${Math.max(1,frictionLab.records.length-7+i)}</td><td>${tr(frictionMaterials[r.material].zh,frictionMaterials[r.material].en)}</td><td>${tr(frictionFaces[r.face].zh,frictionFaces[r.face].en)}</td><td>${r.total} g</td><td class="math-text">${r.peak.toFixed(1)} gw</td></tr>`).join('');
    }

    let frictionResultPair=null;
    function R(zh,en) { return [zh,en]; }
    function setFrictionResult(pair) {
        frictionResultPair=pair;
        const el=document.getElementById('frictionResult'); if(el) el.textContent=tr(pair[0],pair[1]);
    }
    function evaluateFrictionTask() {
        if(!document.getElementById('frictionResult')) return;
        const records=frictionLab.records.filter(r=>r.task===frictionLab.task);
        if(frictionLab.task===0) setFrictionResult(R('自由探索紀錄成功！換一個條件再量一次，找出規律。','Free-play trial recorded. Change one condition and look for a pattern.'));
        if(frictionLab.task===1) setFrictionResult(R('完成！靜摩擦力會配合外力增加，但只到最大值；開始滑動後，讀數下降成動摩擦力。','Complete! Static friction adjusts up to a maximum; after sliding begins, the reading drops to kinetic friction.'));
        if(frictionLab.task===2) {
            const set=new Set(records.filter(r=>r.face===0&&r.extra===0).map(r=>r.material));
            setFrictionResult(set.size===3?R('任務完成：接觸面的材質與表面狀況會改變最大靜摩擦力；粗砂紙在本模型中最大。','Task complete: Surface material and condition change maximum static friction; sandpaper is largest in this model.'):R(`已完成 ${set.size}/3 種材質；保持大面與 0 顆砝碼，繼續量測。`,`Completed ${set.size}/3 materials. Keep the large face and zero masses.`));
        }
        if(frictionLab.task===3) {
            const set=new Set(records.filter(r=>r.material==='wood'&&r.extra===0).map(r=>r.face));
            setFrictionResult(set.size===3?R('任務完成：三個面測得相同峰值。在相同材質、相同正向力的乾摩擦近似下，接觸面積不影響最大靜摩擦力。','Task complete: All three faces give the same peak. In this dry-friction model, contact area does not affect maximum static friction when materials and normal force stay the same.'):R(`已完成 ${set.size}/3 個接觸面；把同一木塊再翻一面。`,`Completed ${set.size}/3 faces. Flip the same block again.`));
        }
        if(frictionLab.task===4) {
            const set=new Set(records.filter(r=>r.material==='wood'&&r.face===0&&r.extra<=2).map(r=>r.extra));
            setFrictionResult(set.size===3?R('任務完成：總重量增加，正向力增加，最大靜摩擦力也依比例增加。你已經從數據找出 fₛ,max = μₛN。','Task complete: More weight means greater normal force and proportionally greater maximum static friction. Your data reveal fₛ,max = μₛN.'):R(`已完成 ${set.size}/3 組重量；請測 0、1、2 顆砝碼。`,`Completed ${set.size}/3 loads. Test 0, 1, and 2 masses.`));
        }
    }

    function bindFrictionCanvas() {
        const canvas=document.getElementById('frictionLabCanvas'); if(!canvas) return;
        const point=e=>{ const r=canvas.getBoundingClientRect(); return { x:(e.clientX-r.left)*LW/r.width, y:(e.clientY-r.top)*LH/r.height }; };
        canvas.addEventListener('pointerdown',e=>{
            e.preventDefault(); canvas.setPointerCapture(e.pointerId); const p=point(e); frictionLab.pointers.set(e.pointerId,p);
            const dims=frictionFaces[frictionLab.face].dims, blockX=-115+frictionLab.blockOffset, start=blockX+dims[0]/2+25, hookY=4+dims[1]*.52, handleX=start+210+frictionLab.pull*1.35;
            const hp=frictionProject(fv(handleX,hookY,0)); const near=Math.hypot(p.x-hp.x,p.y-hp.y)<88;
            if(frictionLab.tool==='pull'&&near) {
                const axisEnd=frictionProject(fv(handleX+100,hookY,0));
                const axisLength=Math.hypot(axisEnd.x-hp.x,axisEnd.y-hp.y)||1;
                frictionLab.drag={type:'pull',id:e.pointerId,startX:p.x,startY:p.y,startPull:frictionLab.pull,startBlockOffset:frictionLab.blockOffset,axisX:(axisEnd.x-hp.x)/axisLength,axisY:(axisEnd.y-hp.y)/axisLength};
            }
            else frictionLab.drag={type:'orbit',id:e.pointerId,x:p.x,y:p.y,yaw:frictionLab.yaw,pitch:frictionLab.pitch};
        });
        canvas.addEventListener('pointermove',e=>{
            if(!frictionLab.pointers.has(e.pointerId)) return; e.preventDefault(); const p=point(e); frictionLab.pointers.set(e.pointerId,p);
            if(!frictionLab.drag||frictionLab.drag.id!==e.pointerId) return;
            if(frictionLab.drag.type==='orbit') {
                frictionLab.yaw=frictionLab.drag.yaw-(p.x-frictionLab.drag.x)*.006;
                frictionLab.pitch=fclamp(frictionLab.drag.pitch+(p.y-frictionLab.drag.y)*.004,-.15,1.12);
            } else {
                const alongScale=(p.x-frictionLab.drag.startX)*frictionLab.drag.axisX+(p.y-frictionLab.drag.startY)*frictionLab.drag.axisY;
                frictionLab.pull=fclamp(frictionLab.drag.startPull+alongScale*.48,0,150);
                const phy=frictionPhysics();
                if(frictionLab.sliding&&frictionLab.pull<phy.kinetic) {
                    // 拉力低於動摩擦力時，木塊先減速至停止；停住後重新由靜摩擦力平衡拉力。
                    frictionLab.sliding=false;
                    frictionLab.drag.startBlockOffset=frictionLab.blockOffset;
                } else if(frictionLab.pull>phy.maxStatic) {
                    frictionLab.sliding=true; frictionLab.peak=phy.maxStatic;
                    // 同一次拉動中木塊只會前進，不會因把手慢慢收回而倒著滑。
                    const nextOffset=fclamp(frictionLab.drag.startBlockOffset+(frictionLab.pull-phy.kinetic)*1.25,0,185);
                    frictionLab.blockOffset=Math.max(frictionLab.blockOffset,nextOffset);
                }
            }
            drawFrictionLab();
        });
        const end=e=>{
            frictionLab.pointers.delete(e.pointerId);
            if(frictionLab.drag?.id!==e.pointerId) return;
            const releasedPull=frictionLab.drag.type==='pull';
            frictionLab.drag=null;
            if(releasedPull) {
                frictionLab.pull=0;
                frictionLab.friction=0;
                frictionLab.sliding=false;
                drawFrictionLab();
            }
        };
        canvas.addEventListener('pointerup',end); canvas.addEventListener('pointercancel',end);
        canvas.addEventListener('wheel',e=>{ e.preventDefault(); frictionLab.distance=fclamp(frictionLab.distance+e.deltaY*.65,610,1450); drawFrictionLab(); },{passive:false});
    }
  /* ═════════ 對外操作（取代舊版 onclick）═════════ */
  const api = {
    selectTask: selectFrictionTask, setTool: setFrictionTool, setMaterial: setFrictionMaterial, setFace: setFrictionFace,
    changeMass: changeFrictionMass, resetTrial: resetFrictionTrial, resetView: resetFrictionView, record: recordFrictionTrial
  };

  /* ═════════ 塞進頁面 ═════════ */
  const CSS = `
#lab-friction3d.lab-desk{max-width:1080px;margin:28px auto 10px;background:var(--bg-panel,#17332a);border:2px solid var(--chalk-coral,#ff8040);border-radius:16px;padding:22px 24px 24px;color:#f6f3ea;font-size:22px;box-sizing:border-box;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,.45)}
#lab-friction3d h2{margin:0 0 4px;font-size:32px;line-height:1.3;color:#4dd2ff}
#lab-friction3d .lab-sub{margin:0 0 12px;font-size:22px;line-height:1.55;color:#f6f3ea}
#lab-friction3d .friction-mission{padding:12px 18px;border:2px dashed #ffe066;border-radius:12px;background:rgba(255,224,102,.055);margin-bottom:12px}
#lab-friction3d .friction-mission strong{display:block;color:#ffe066;font-size:24px;line-height:1.4}
#lab-friction3d .friction-mission p{margin:4px 0 0;font-size:22px;line-height:1.55}
#lab-friction3d .friction-canvas-shell{position:relative;width:100%;overflow:hidden;border:2px solid rgba(77,210,255,.55);border-radius:14px;background:radial-gradient(circle at 50% 30%,#173d34,#0d201a 72%)}
#lab-friction3d #frictionLabCanvas{display:block;width:100%;height:auto;aspect-ratio:1000/650;touch-action:none;outline:none}
#lab-friction3d #frictionLabCanvas.orbit-mode{cursor:grab}
#lab-friction3d #frictionLabCanvas.pull-mode{cursor:ew-resize}
#lab-friction3d .friction-hud{position:absolute;top:12px;left:12px;right:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;pointer-events:none}
#lab-friction3d .friction-stat{padding:6px 12px 8px;border:1px solid rgba(246,243,234,.28);border-radius:11px;background:rgba(11,26,21,.72)}
#lab-friction3d .friction-stat .k{display:block;color:#a3b8b0;font-size:20px;font-weight:700;line-height:1.3}
#lab-friction3d .friction-stat .v{display:block;color:#ffe066;font:700 26px/1.25 'JetBrains Mono',monospace}
#lab-friction3d .friction-state-pill{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);max-width:calc(100% - 24px);padding:7px 18px;border:1px solid rgba(246,243,234,.3);border-radius:999px;background:rgba(11,26,21,.8);color:#4dd2ff;font-size:20px;font-weight:700;line-height:1.35;text-align:center;pointer-events:none}
#lab-friction3d .result-box{border:2px dashed #ffe066;border-radius:10px;padding:12px 18px;margin-top:10px;background:rgba(255,224,102,.05);font-size:22px;line-height:1.55;text-align:left}
#lab-friction3d .result-box .friction-result{font-weight:700;color:#f6f3ea;min-height:34px}
#lab-friction3d .result-box .friction-peakline{margin-top:4px;color:#a3b8b0}
#lab-friction3d .result-box .friction-peakline b{font-family:'JetBrains Mono',monospace;color:#ffe066;font-size:24px}
#lab-friction3d .friction-notebook{margin-top:10px;overflow-x:auto;border:1px solid rgba(246,243,234,.25);border-radius:12px}
#lab-friction3d .friction-notebook table{width:100%;border-collapse:collapse;min-width:640px}
#lab-friction3d .friction-notebook th,#lab-friction3d .friction-notebook td{padding:8px 10px;border-bottom:1px solid rgba(246,243,234,.15);text-align:center;font-size:22px;line-height:1.35}
#lab-friction3d .friction-notebook th{color:#4dd2ff;background:rgba(11,26,21,.72)}
#lab-friction3d .friction-notebook td{color:#f6f3ea;font-family:'JetBrains Mono','Noto Sans TC',monospace}
#lab-friction3d .lab-note{margin:10px 2px 0;color:#a3b8b0;font-size:20px;line-height:1.5}
#lab-friction3d .lab-note b{color:#4dd2ff}
#lab-friction3d .lab-controls{display:flex;flex-direction:column;gap:8px;margin-top:12px}
#lab-friction3d .friction-task-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}
#lab-friction3d .friction-tools,#lab-friction3d .friction-choice-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
#lab-friction3d .friction-task-btn,#lab-friction3d .friction-tool-btn,#lab-friction3d .friction-choice-btn,#lab-friction3d .friction-record-btn{font:inherit;font-size:18px;font-weight:700;line-height:1.3;min-height:44px;padding:4px 14px;border-radius:10px;background:#11261f;color:#f6f3ea;border:2px solid rgba(246,243,234,.4);cursor:pointer;touch-action:manipulation}
#lab-friction3d .friction-task-btn:hover,#lab-friction3d .friction-tool-btn:hover,#lab-friction3d .friction-choice-btn:hover,#lab-friction3d .friction-record-btn:hover{border-color:#ffe066}
#lab-friction3d .friction-task-btn{padding:4px 8px}
#lab-friction3d .friction-task-btn.active{color:#0d201a;background:#ff8040;border-color:#ff8040}
#lab-friction3d .friction-tool-btn.active,#lab-friction3d .friction-choice-btn.active{color:#0d201a;background:#4dd2ff;border-color:#4dd2ff}
#lab-friction3d .friction-tools{justify-content:flex-start}
#lab-friction3d .friction-setup-grid{display:grid;grid-template-columns:1.6fr 1.1fr .9fr;gap:10px;align-items:stretch}
#lab-friction3d .friction-setup-group{padding:8px 12px 10px;border:1px solid rgba(246,243,234,.2);border-radius:12px;background:rgba(11,26,21,.45)}
#lab-friction3d .friction-setup-group>strong{display:block;color:#ff8040;font-size:22px;line-height:1.35;margin-bottom:6px}
#lab-friction3d .friction-choice-btn{flex:1 1 auto}
#lab-friction3d .friction-mass-control{display:flex;align-items:center;justify-content:center;gap:8px}
#lab-friction3d .friction-mass-control .friction-choice-btn{flex:0 0 52px;padding:4px 0}
#lab-friction3d .friction-mass-control output{min-width:86px;color:#ffe066;font:700 24px 'JetBrains Mono',monospace;text-align:center}
#lab-friction3d .friction-record-btn{width:100%;border-color:#33cc99;color:#33cc99}
#lab-friction3d .friction-record-btn:disabled{opacity:.42;cursor:not-allowed}
@media (max-width:820px){#lab-friction3d .friction-setup-grid{grid-template-columns:1fr}#lab-friction3d .friction-hud{gap:6px;top:8px;left:8px;right:8px}#lab-friction3d .friction-stat{padding:4px 8px 6px}#lab-friction3d .friction-stat .k{font-size:16px}#lab-friction3d .friction-stat .v{font-size:20px}#lab-friction3d .friction-state-pill{font-size:16px;bottom:8px;padding:5px 12px}}
@media (max-width:640px){#lab-friction3d.lab-desk{padding:14px 12px 16px}#lab-friction3d h2{font-size:26px}}
`;
  const B = (id, cls, fn, zh, en, extra) =>
    `<button${id ? ` id="${id}"` : ''} class="${cls}" type="button" data-act="${fn}" data-zh="${zh}" data-en="${en}"${extra || ''}>${tr(zh, en)}</button>`;
  const S = (zh, en, tag) => `<${tag || 'span'} data-zh="${zh}" data-en="${en}">${tr(zh, en)}</${tag || 'span'}>`;

  function buildHTML() {
    const mission = frictionTasks[0];
    return (
      S('🔧 動手做｜3D 摩擦力虛擬實驗室', '🔧 Try it | 3D Virtual Friction Lab', 'h2') +
      `<p class="lab-sub" data-zh="先認識器材，再像真正實驗一樣控制變因。用手指水平拉動彈簧秤，找出木塊剛開始滑動前的最大讀數。" data-en="Meet the apparatus first, then control variables as in a real experiment. Pull the spring scale horizontally and find the highest reading just before the block starts moving.">${tr('先認識器材，再像真正實驗一樣控制變因。用手指水平拉動彈簧秤，找出木塊剛開始滑動前的最大讀數。', 'Meet the apparatus first, then control variables as in a real experiment. Pull the spring scale horizontally and find the highest reading just before the block starts moving.')}</p>` +
      `<div class="friction-mission"><strong id="frictionTaskTitle">${tr(mission.titleZh, mission.titleEn)}</strong><p id="frictionTaskText">${tr(mission.textZh, mission.textEn)}</p></div>` +
      `<div class="friction-canvas-shell">` +
        `<canvas id="frictionLabCanvas" width="${LW * DPR}" height="${LH * DPR}" aria-label="可旋轉與拉動的三維摩擦力實驗"></canvas>` +
        `<div class="friction-hud">` +
          `<div class="friction-stat"><span class="k" data-zh="彈簧秤讀數" data-en="Scale reading">${tr('彈簧秤讀數', 'Scale reading')}</span><span class="v" id="frictionPullReadout">0.0 gw</span></div>` +
          `<div class="friction-stat"><span class="k" data-zh="摩擦力" data-en="Friction">${tr('摩擦力', 'Friction')}</span><span class="v" id="frictionForceReadout">0.0 gw</span></div>` +
          `<div class="friction-stat"><span class="k" data-zh="測得峰值" data-en="Measured peak">${tr('測得峰值', 'Measured peak')}</span><span class="v" id="frictionPeakReadout">—</span></div>` +
        `</div>` +
        `<div class="friction-state-pill" id="frictionStateText">${tr('360° 觀察模式｜拖動畫面翻轉實驗桌', 'Orbit mode | Drag to inspect the apparatus')}</div>` +
      `</div>` +
      `<div class="result-box">` +
        `<div class="friction-result" id="frictionResult" data-zh="提示：靜摩擦力不是固定值；它會隨拉力增加，直到最大值。" data-en="Hint: Static friction is not fixed. It rises with the pull up to a maximum.">${tr('提示：靜摩擦力不是固定值；它會隨拉力增加，直到最大值。', 'Hint: Static friction is not fixed. It rises with the pull up to a maximum.')}</div>` +
        `<div class="friction-peakline">${S('測得峰值（最大靜摩擦力）：', 'Measured peak (max static friction): ')}<b id="frictionPeakResult">—</b></div>` +
      `</div>` +
      `<div class="friction-notebook" aria-label="實驗紀錄表"><table><thead><tr>` +
        ['次數|Trial', '材質|Material', '木塊接觸面|Block face', '總質量|Total mass', '最大靜摩擦力|Max static friction'].map(s => { const [z, e] = s.split('|'); return `<th data-zh="${z}" data-en="${e}">${tr(z, e)}</th>`; }).join('') +
      `</tr></thead><tbody id="frictionRecordBody"></tbody></table></div>` +
      `<div class="lab-note" id="frictionSteps">` +
        S('① 選好條件', '① Set conditions', 'b') + S('：換桌面、翻木塊或加砝碼；一次只改一個變因。', ': change the surface, flip the block, or add masses, one variable at a time.') + '<br>' +
        S('② 慢慢水平拉', '② Pull slowly', 'b') + S('：切到「拉彈簧秤」，抓住橘色把手沿著彈簧秤方向拉。', ': choose Pull Scale, grab the orange handle, and drag along the scale.') + '<br>' +
        S('③ 抓住峰值', '③ Capture the peak', 'b') + S('：木塊開始滑動時，峰值就是最大靜摩擦力；按下記錄。', ': when the block starts sliding, the peak is the maximum static friction. Record it.') +
      `</div>` +
      `<div class="lab-note" data-zh="模型範圍：木塊受水平拉力；在相同材質、相同正向力與一般乾摩擦近似下，比較接觸面積。真實材料的表面狀況、磨耗與污染也可能影響結果。" data-en="Model scope: The block is pulled horizontally. Contact area is compared under the same materials and normal force using an ideal dry-friction approximation. Surface condition, wear, and contamination can affect real results.">${tr('模型範圍：木塊受水平拉力；在相同材質、相同正向力與一般乾摩擦近似下，比較接觸面積。真實材料的表面狀況、磨耗與污染也可能影響結果。', 'Model scope: The block is pulled horizontally. Contact area is compared under the same materials and normal force using an ideal dry-friction approximation. Surface condition, wear, and contamination can affect real results.')}</div>` +
      `<div class="lab-controls">` +
        `<div class="friction-task-strip" role="tablist" aria-label="摩擦力實驗任務">` +
          B('frictionTask0', 'friction-task-btn active', 'task0', '先玩｜自由探索', 'Explore | Free Play') +
          B('frictionTask1', 'friction-task-btn', 'task1', '任務 1｜臨界瞬間', 'Task 1 | The Threshold') +
          B('frictionTask2', 'friction-task-btn', 'task2', '任務 2｜三種材質', 'Task 2 | 3 Materials') +
          B('frictionTask3', 'friction-task-btn', 'task3', '任務 3｜木塊翻面', 'Task 3 | Flip the Block') +
          B('frictionTask4', 'friction-task-btn', 'task4', '任務 4｜逐顆加重', 'Task 4 | Add Masses') +
        `</div>` +
        `<div class="friction-tools">` +
          B('frictionOrbitTool', 'friction-tool-btn active', 'orbit', '🌐 360° 觀察', '🌐 Orbit View') +
          B('frictionPullTool', 'friction-tool-btn', 'pull', '🤏 拉彈簧秤', '🤏 Pull Scale') +
          B('', 'friction-tool-btn', 'resetView', '🎥 重設視角', '🎥 Reset View') +
          B('', 'friction-tool-btn', 'resetTrial', '↺ 重做本次', '↺ Reset Trial') +
        `</div>` +
        `<div class="friction-setup-grid">` +
          `<div class="friction-setup-group">${S('桌面材質', 'Surface material', 'strong')}<div class="friction-choice-row">` +
            B('surfaceAcrylic', 'friction-choice-btn', 'mat:acrylic', '光滑塑膠', 'Smooth acrylic') +
            B('surfaceWood', 'friction-choice-btn active', 'mat:wood', '木板', 'Wood') +
            B('surfaceSand', 'friction-choice-btn', 'mat:sandpaper', '粗砂紙', 'Coarse sandpaper') +
          `</div></div>` +
          `<div class="friction-setup-group">${S('同一木塊的接觸面', 'Face of the same block', 'strong')}<div class="friction-choice-row">` +
            B('faceLarge', 'friction-choice-btn active', 'face:0', '大面', 'Large') +
            B('faceMedium', 'friction-choice-btn', 'face:1', '中面', 'Medium') +
            B('faceSmall', 'friction-choice-btn', 'face:2', '小面', 'Small') +
          `</div></div>` +
          `<div class="friction-setup-group">${S('上方砝碼（每顆 50 g）', 'Top masses (50 g each)', 'strong')}<div class="friction-mass-control">` +
            `<button class="friction-choice-btn" type="button" data-act="mass:-1" aria-label="${tr('減少砝碼', 'Remove a mass')}">−</button>` +
            `<output id="frictionMassOutput">0 g</output>` +
            `<button class="friction-choice-btn" type="button" data-act="mass:1" aria-label="${tr('增加砝碼', 'Add a mass')}">＋</button>` +
          `</div></div>` +
        `</div>` +
        B('frictionRecordBtn', 'friction-record-btn', 'record', '📋 木塊滑動後，記錄最大靜摩擦力', '📋 Record after the block starts sliding', ' disabled') +
      `</div>`
    );
  }

  function onAct(e) {
    const btn = e.target.closest && e.target.closest('[data-act]'); if (!btn || btn.disabled) return;
    const a = btn.getAttribute('data-act'), [k, v] = a.split(':');
    if (/^task\d$/.test(a)) api.selectTask(+a.slice(4));
    else if (a === 'orbit' || a === 'pull') api.setTool(a);
    else if (a === 'resetView') api.resetView();
    else if (a === 'resetTrial') api.resetTrial();
    else if (a === 'record') api.record();
    else if (k === 'mat') api.setMaterial(v);
    else if (k === 'face') api.setFace(+v);
    else if (k === 'mass') api.changeMass(+v);
  }

  let host = null, on = false;
  function activate() {
    if (!host) return;
    on = true;
    initFrictionLab();
  }
  function deactivate() { on = false; }
  function relang() {
    if (!host) return;
    host.querySelectorAll('[data-zh][data-en]').forEach(el => { el.innerHTML = tr(el.getAttribute('data-zh'), el.getAttribute('data-en')); });
    const state = document.getElementById('frictionStateText'); if (state) state.removeAttribute('data-zh');
    if (frictionResultPair) setFrictionResult(frictionResultPair);
    document.getElementById('frictionLabCanvas')?.setAttribute('aria-label', tr('可旋轉與拉動的三維摩擦力實驗', 'Rotatable and pullable 3D friction experiment'));
    updateFrictionUI(false); drawFrictionLab();
  }
  function _state() {
    const phy = frictionPhysics();
    return {
      on, task: frictionLab.task, material: frictionLab.material, face: frictionLab.face, extraMasses: frictionLab.extraMasses,
      tool: frictionLab.tool, pull: frictionLab.pull, friction: frictionLab.friction, peak: frictionLab.peak, sliding: frictionLab.sliding,
      blockOffset: frictionLab.blockOffset, yaw: frictionLab.yaw, pitch: frictionLab.pitch, distance: frictionLab.distance,
      records: frictionLab.records.map(r => Object.assign({}, r)), normal: phy.normal, maxStatic: phy.maxStatic, kinetic: phy.kinetic,
      running: false
    };
  }

  function inject() {
    if (document.getElementById('lab-' + KEY)) return;
    const tab = document.getElementById(TAB); if (!tab) return;
    if (!document.getElementById('lab-' + KEY + '-css')) {
      const st = document.createElement('style'); st.id = 'lab-' + KEY + '-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    host = document.createElement('div'); host.className = 'lab-desk'; host.id = 'lab-' + KEY;
    host.innerHTML = buildHTML();
    tab.appendChild(host);
    host.addEventListener('click', onAct);
    initFrictionLab();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawFrictionLab());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();

  window.W5Lab[KEY] = Object.assign({ activate, deactivate, relang, _state }, api, { _draw: drawFrictionLab, _lab: frictionLab, _project: frictionProject });
})();

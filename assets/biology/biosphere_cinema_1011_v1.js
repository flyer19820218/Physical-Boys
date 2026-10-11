/* Physical-Boys: a scale-transition model, using attributed photographs and NASA data.
 * Deliberately does not auto-mount: call BiosphereCinema.mount() AFTER the chapter1 adapters.
 * No dependencies; WebGL sphere with a matching software renderer and a local-image fallback.
 */
(function (root) {
  'use strict';
  const WIDTH = 1280, HEIGHT = 720, DURATION = 20, STORY_DURATION = 48, EARTH_KM = 6371;
  // Compress the existing camera path in time, without changing its geometry.
  const seconds = storySeconds => storySeconds * DURATION / STORY_DURATION;
  const APPLE_DIAMETER_MM = 100, LIVING_LAYER_KM = 20;
  const APPLE_LAYER_MM = LIVING_LAYER_KM / (2 * EARTH_KM) * APPLE_DIAMETER_MM;
  const scriptURL = root.document?.currentScript?.src || '';
  const sessions = new WeakMap();
  const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
  const mix = (a,b,t) => a+(b-a)*t;
  const smooth = (a,b,v) => { const t=clamp((v-a)/(b-a)); return t*t*(3-2*t); };
  const radians = d => d*Math.PI/180;
  const SHOTS = [
    {at:0, end:seconds(10), zh:'水中的小生命', en:'Microscopic life', title:['草履蟲：小到肉眼難以分辨','Paramecium: life beyond the unaided eye'],
      text:['這是草履蟲（Paramecium caudatum）的真實顯微照片。先看身體的輪廓與內部，再讓鏡頭退回水面。照片只做數位運鏡；不表示草履蟲真的在這樣移動。','This is a real micrograph of Paramecium caudatum. Notice its outline and interior, then pull back toward the water. The camera moves across a still photograph; this is not recorded swimming.'],
      tag:['顯微照片 · 草履蟲','Micrograph · Paramecium'], scale:['顯微尺度','Microscopic scale']},
    {at:seconds(12), end:seconds(21), zh:'眼前的生物', en:'Life around us', title:['一隻鴨，和牠生活的水域','A duck and the water it lives in'],
      text:['這是綠頭鴨的雌鳥（Anas platyrhynchos），拍攝於 Cedar Mill 濕地。同樣是生命，草履蟲與鴨卻有截然不同的大小；牠們都離不開周遭的環境。','A female mallard (Anas platyrhynchos), photographed at Cedar Mill Wetlands. A paramecium and a duck are very different in size, yet both depend on their surroundings.'],
      tag:['實拍 · 綠頭鴨與濕地','Photograph · Mallard and wetland'], scale:['肉眼觀察尺度','Everyday scale']},
    {at:seconds(24), end:seconds(34), zh:'薄薄的生物圈', en:'The living layer', title:['向上約 10 公里，向下約 10 公里','About 10 km above, about 10 km below'],
      text:['以海平面為 0，這裡用上、下各約 10 公里比較生物圈的尺度。近景把厚度放大 4 倍，方便觀察；這不是生命分布的硬邊界，也不表示每個深度都有同樣多的生物。','Sea level is zero. We use about 10 km above and below it to compare the scale of the biosphere. This close-up exaggerates thickness fourfold for clarity. These are not hard limits of life, nor is life equally abundant at every depth.'],
      tag:['局部剖面 · 厚度放大 4 倍','Local section · Thickness ×4'], scale:['上下合計約 20 km','About 20 km from top to bottom']},
    {at:seconds(44), end:DURATION, zh:'我們的地球', en:'Our whole Earth', title:['生命住在「蘋果皮」般的薄層','Life lives in an apple-peel-thin layer'],
      text:['如果地球縮成直徑 10 公分、蘋果般大小，上下合計約 20 公里的範圍就只有約 0.16 毫米厚。相對整顆地球，生物圈就像薄薄的蘋果皮！蘋果是比例比喻，不代表真正果皮固定有這個厚度。地球綠色薄層已恢復比例；藍色光暈只是光影。','If Earth were apple-sized, 10 cm across, the roughly 20 km layer would be only about 0.16 mm thick. Compared with the whole planet, the biosphere is like a thin apple peel! This is a scale analogy, not a measurement of actual apple skin. Earth’s green layer is back to scale; its blue glow is lighting.'],
      tag:['衛星合成紋理 · 立體地球','Satellite mosaic · 3D Earth'], scale:['地球直徑約 12,742 km','Earth diameter ≈ 12,742 km']}
  ];
  function sceneAt(time, yaw=0, pitch=0) {
    const t=clamp(Number(time)||0,0,DURATION);
    const storyTime=t*STORY_DURATION/DURATION;
    const microOut=smooth(7,12,storyTime), habitatOut=smooth(18,23,storyTime), retreat=smooth(31,44,storyTime);
    const radius=Math.exp(mix(Math.log(14000),Math.log(258),retreat));
    const magnification=mix(4,1,retreat);
    const center={x:WIDTH*.5, y:mix(radius+HEIGHT*.48,HEIGHT*.49,retreat)};
    // The end state uses actual +/-10 km relative radii, never a minimum thick ring.
    const outer=radius*(1+10/EARTH_KM*magnification), inner=radius*(1-10/EARTH_KM*magnification);
    const boundaryX=WIDTH*.73;
    const atX=r=>center.y-Math.sqrt(Math.max(0,r*r-(boundaryX-center.x)**2));
    return {time:t, storyTime, microOut,habitatOut,retreat,radius,magnification,center,outer,inner,
      appleAlpha:smooth(44,46,storyTime),
      longitude:radians(-105+12*clamp((storyTime-21)/27))+yaw,
      latitude:radians(18)+pitch,
      shot:storyTime<10?0:storyTime<21?1:storyTime<34?2:3,
      ruler:{x:boundaryX,top:atX(outer),middle:atX(radius),bottom:atX(inner),alpha:smooth(21,23,storyTime)*(1-smooth(31,34,storyTime))},
      bandPx:outer-inner};
  }
  const VERTEX = `attribute vec2 position;
    varying vec2 pixelUV;
    void main(){pixelUV=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const FRAGMENT = `precision highp float;
    varying vec2 pixelUV;
    uniform sampler2D earthMap;
    uniform vec2 size;
    uniform vec2 center;
    uniform float radius;
    uniform vec2 orientation;
    void main(){
      vec2 p=vec2(pixelUV.x*size.x,(1.-pixelUV.y)*size.y);
      vec2 q=(p-center)/radius;
      float rr=dot(q,q);
      if(rr>1.){gl_FragColor=vec4(0.);return;}
      vec3 n=vec3(q.x,-q.y,sqrt(max(0.,1.-rr)));
      float ca=cos(orientation.y),sa=sin(orientation.y);
      vec3 v=vec3(n.x,n.y*ca+n.z*sa,n.z*ca-n.y*sa);
      float lon=atan(v.x,v.z)+orientation.x;
      vec2 uv=vec2(fract(.5+lon/6.28318530718),.5-asin(clamp(v.y,-1.,1.))/3.14159265359);
      vec3 color=texture2D(earthMap,uv).rgb;
      vec3 light=normalize(vec3(-.58,.34,.74));
      float day=max(0.,dot(n,light));
      float illumination=.11+.89*pow(day,.7);
      color*=illumination;
      // A restrained blue limb is light scattering, not the biosphere boundary.
      float rim=pow(1.-n.z,3.)*(.15+.85*day);
      color=mix(color,vec3(.17,.48,.64),rim*.45);
      gl_FragColor=vec4(color,1.);
    }`;

  function createWebGL(canvas, image) {
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
    if(!gl)throw new Error('WebGL unavailable');
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
    const program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,VERTEX),fs=compile(gl.FRAGMENT_SHADER,FRAGMENT);
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
    if(gl.getError()!==gl.NO_ERROR)throw new Error('Earth texture could not be uploaded');
    const uniform=name=>gl.getUniformLocation(program,name);
    const u={size:uniform('size'),center:uniform('center'),radius:uniform('radius'),orientation:uniform('orientation')};
    gl.uniform1i(uniform('earthMap'),0);
    return {canvas,render(s){
      gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.size,WIDTH,HEIGHT);gl.uniform2f(u.center,s.center.x,s.center.y);
      gl.uniform1f(u.radius,s.radius);gl.uniform2f(u.orientation,s.longitude,s.latitude);gl.drawArrays(gl.TRIANGLES,0,6);
      if(gl.isContextLost())throw new Error('WebGL context lost');
    },destroy(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);}};
  }

  // Same sphere/UV/light equations as the shader. Used for genuine non-browser QA and fallback.
  function softwareGlobe(canvas,image,factory) {
    const map=factory(2048,1024),mc=map.getContext('2d');mc.drawImage(image,0,0,2048,1024);
    const pixels=mc.getImageData(0,0,2048,1024).data;
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,out=ctx.createImageData(w,h);
    return {canvas,render(s){
      const data=out.data;data.fill(0);const ca=Math.cos(s.latitude),sa=Math.sin(s.latitude);
      const sample=(x,y,k)=>pixels[((clamp(y,0,1023)*2048+((x%2048+2048)%2048))*4)+k];
      for(let py=0;py<h;py++)for(let px=0;px<w;px++){
        const nx=((px+.5)*WIDTH/w-s.center.x)/s.radius,ny=-((py+.5)*HEIGHT/h-s.center.y)/s.radius;
        const rr=nx*nx+ny*ny;if(rr>1)continue;
        const nz=Math.sqrt(1-rr),wy=ny*ca+nz*sa,wz=nz*ca-ny*sa;
        const lon=Math.atan2(nx,wz)+s.longitude;
        const u=((.5+lon/(2*Math.PI))%1+1)%1,v=.5-Math.asin(clamp(wy,-1,1))/Math.PI;
        const tx=u*2048-.5,ty=v*1024-.5,ix=Math.floor(tx),iy=Math.floor(ty),fx=tx-ix,fy=ty-iy;
        const day=Math.max(0,(-.58*nx+.34*ny+.74*nz)/Math.hypot(.58,.34,.74));
        const illumination=.11+.89*Math.pow(day,.7),rim=Math.pow(1-nz,3)*(.15+.85*day)*.45;
        const at=(py*w+px)*4;
        for(let k=0;k<3;k++){
          const top=mix(sample(ix,iy,k),sample(ix+1,iy,k),fx),bottom=mix(sample(ix,iy+1,k),sample(ix+1,iy+1,k),fx);
          data[at+k]=mix(mix(top,bottom,fy)*illumination,[.17,.48,.64][k]*255,rim);
        }
        data[at+3]=255;
      }
      ctx.putImageData(out,0,0);
    },destroy(){}};
  }

  function imageView(ctx,image,cx,cy,w,h,zoom=1,round=0) {
    ctx.save();
    ctx.beginPath();ctx.roundRect(cx-w/2,cy-h/2,w,h,Math.min(w,h)*round);ctx.clip();
    const ratio=Math.max(w/image.width,h/image.height)*zoom,dw=image.width*ratio,dh=image.height*ratio;
    ctx.drawImage(image,cx-dw*.5,cy-dh*.5,dw,dh);ctx.restore();
  }
  function ring(ctx,cx,cy,outer,inner,color) {
    ctx.beginPath();ctx.arc(cx,cy,outer,0,Math.PI*2);ctx.arc(cx,cy,inner,Math.PI*2,0,true);
    ctx.fillStyle=color;ctx.fill('evenodd');
  }
  // A recognizable cut apple, not a literal measurement of real fruit skin.
  // Its rim is intentionally enlarged; the numeric comparison remains exact.
  function drawApple(ctx,alpha) {
    if(alpha<=0)return;
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(1075,355);
    const outline=()=>{ctx.beginPath();ctx.moveTo(0,-68);ctx.bezierCurveTo(-40,-95,-92,-68,-84,-7);ctx.bezierCurveTo(-81,57,-37,84,0,69);ctx.bezierCurveTo(39,84,80,49,83,-8);ctx.bezierCurveTo(91,-68,38,-95,0,-68);ctx.closePath();};
    const skin=ctx.createLinearGradient(-80,-70,85,65);skin.addColorStop(0,'#f88b68');skin.addColorStop(.4,'#d83d39');skin.addColorStop(1,'#7b202a');
    outline();ctx.fillStyle=skin;ctx.shadowColor='rgba(8,22,18,.4)';ctx.shadowBlur=15;ctx.shadowOffsetY=10;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.save();outline();ctx.clip();ctx.beginPath();ctx.rect(0,-100,110,200);ctx.clip();
    const flesh=ctx.createRadialGradient(28,-25,6,40,18,115);flesh.addColorStop(0,'#fff5ce');flesh.addColorStop(1,'#ddc18d');
    ctx.fillStyle=flesh;ctx.fillRect(0,-100,110,200);ctx.strokeStyle='#c93936';ctx.lineWidth=5;outline();ctx.stroke();
    ctx.strokeStyle='#bd9661';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,-62);ctx.bezierCurveTo(12,-20,8,36,15,65);ctx.stroke();
    for(const [x,y,rotation] of [[17,-9,-.35],[20,16,.4]]){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.fillStyle='#765034';ctx.beginPath();ctx.ellipse(0,0,3.7,7,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.restore();
    ctx.strokeStyle='#916549';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-69);ctx.quadraticCurveTo(-8,-87,3,-102);ctx.stroke();
    const leaf=ctx.createLinearGradient(8,-110,58,-85);leaf.addColorStop(0,'#82c583');leaf.addColorStop(1,'#387e57');ctx.fillStyle=leaf;ctx.beginPath();ctx.moveTo(3,-92);ctx.quadraticCurveTo(20,-121,61,-100);ctx.quadraticCurveTo(30,-72,3,-92);ctx.fill();
    ctx.strokeStyle='#a6d4a0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(4,-92);ctx.lineTo(53,-99);ctx.stroke();ctx.restore();
  }
  class Renderer {
    constructor(canvas,assets,options={}) {
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.assets=assets;this.options=options;
      this.factory=options.createCanvas||((w,h)=>{const c=canvas.ownerDocument.createElement('canvas');c.width=w;c.height=h;return c;});
      this.mode='software';this.globe=null;this.error=null;
      if(options.renderer!=='software')try{
        const c=this.factory(WIDTH,HEIGHT);this.globe=createWebGL(c,assets.earth);this.mode='webgl';
      }catch(error){this.error=error;}
      if(!this.globe)this.useSoftware();
    }
    useSoftware(){
      try {this.globe=softwareGlobe(this.factory(960,540),this.assets.earth,this.factory);this.mode='software';}
      catch(error){this.error=error;this.globe=null;this.mode='still';}
    }
    draw(time,yaw=0,pitch=0,probe=0) {
      const s=sceneAt(time,yaw,pitch),ctx=this.ctx;
      ctx.save();ctx.setTransform(this.canvas.width/WIDTH,0,0,this.canvas.height/HEIGHT,0,0);
      const sky=ctx.createLinearGradient(0,0,0,HEIGHT);sky.addColorStop(0,'#0b1a20');sky.addColorStop(.6,'#132d38');sky.addColorStop(1,'#12353b');
      ctx.fillStyle=sky;ctx.fillRect(0,0,WIDTH,HEIGHT);
      if(s.habitatOut>0){
        // Camera retreats over a curved horizon into an orthographically rendered 3D globe.
        const glow=ctx.createRadialGradient(s.center.x,s.center.y,s.radius*.998,s.center.x,s.center.y,s.radius+Math.min(48,s.radius*.08));
        glow.addColorStop(0,'rgba(93,203,222,0)');glow.addColorStop(.24,'rgba(93,203,222,.22)');glow.addColorStop(1,'rgba(93,203,222,0)');
        ctx.fillStyle=glow;ctx.fillRect(0,0,WIDTH,HEIGHT);
        if(this.globe){
          try {this.globe.render(s);ctx.drawImage(this.globe.canvas,0,0,WIDTH,HEIGHT);}
          catch(error){this.error=error;this.globe.destroy();this.globe=null;this.useSoftware();if(this.globe){this.globe.render(s);ctx.drawImage(this.globe.canvas,0,0,WIDTH,HEIGHT);}}
        }
        if(!this.globe&&this.assets.fallback){ctx.drawImage(this.assets.fallback,s.center.x-s.radius,s.center.y-s.radius,2*s.radius,2*s.radius);}
        // The cutaway shows the below-sea-level part; the shell's thickness returns to scale.
        const band=ctx.createLinearGradient(0,s.center.y-s.outer,0,s.center.y-s.inner);
        band.addColorStop(0,'rgba(84,231,181,.60)');band.addColorStop(.48,'rgba(177,249,207,.24)');band.addColorStop(.52,'rgba(27,183,182,.66)');band.addColorStop(1,'rgba(22,136,172,.72)');
        ring(ctx,s.center.x,s.center.y,s.outer,s.inner,band);
        if(s.retreat<.45){
          ctx.save();ctx.globalAlpha=1-smooth(.15,.45,s.retreat);ctx.strokeStyle='rgba(209,251,230,.8)';ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(s.center.x,s.center.y,s.radius,Math.PI,Math.PI*2);ctx.stroke();ctx.restore();
        }
        if(s.ruler.alpha>0){
          const r=s.ruler;ctx.save();ctx.globalAlpha=r.alpha;ctx.lineWidth=2;ctx.strokeStyle='#eaf7df';
          ctx.beginPath();ctx.moveTo(r.x,r.top);ctx.lineTo(r.x,r.bottom);
          for(const y of [r.top,r.middle,r.bottom]){ctx.moveTo(r.x-13,y);ctx.lineTo(r.x+13,y);}ctx.stroke();
          // The point is tied to the same radial altitude model as the three labelled levels.
          const y=mix(r.middle,probe>=0?r.top:r.bottom,Math.abs(probe)/10);
          ctx.fillStyle='#fde047';ctx.beginPath();ctx.arc(r.x,y,7,0,Math.PI*2);ctx.fill();
          ctx.restore();
        }
      }
      // Nested photographic windows provide visual continuity across the changes in scale.
      if(s.habitatOut<1){
        const scale=Math.exp(Math.log(.018)*s.habitatOut);
        const cx=mix(WIDTH*.5,WIDTH*.5,s.habitatOut),cy=mix(HEIGHT*.5,HEIGHT*.48,s.habitatOut);
        const zoom=mix(1.3,1,clamp((s.storyTime-8)/10));
        imageView(ctx,this.assets.habitat,cx,cy,WIDTH*scale,HEIGHT*scale,zoom,.42*s.habitatOut);
      }
      if(s.microOut<1){
        const scale=Math.exp(Math.log(.012)*s.microOut),cx=mix(WIDTH*.5,WIDTH*.27,s.microOut),cy=mix(HEIGHT*.5,HEIGHT*.61,s.microOut);
        imageView(ctx,this.assets.micro,cx,cy,WIDTH*scale,HEIGHT*scale,mix(1.2,1,clamp(s.storyTime/7)),.48*s.microOut);
        if(s.microOut>0){ctx.save();ctx.strokeStyle='rgba(237,250,235,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(cx-WIDTH*scale/2,cy-HEIGHT*scale/2,WIDTH*scale,HEIGHT*scale,HEIGHT*scale*.48*s.microOut);ctx.stroke();ctx.restore();}
      }
      // Subtle lens vignette; no text is drawn into the image, so captions remain accessible.
      const vignette=ctx.createRadialGradient(WIDTH*.5,HEIGHT*.47,HEIGHT*.28,WIDTH*.5,HEIGHT*.47,WIDTH*.62);
      vignette.addColorStop(0,'rgba(11,26,21,0)');vignette.addColorStop(1,'rgba(11,26,21,.4)');ctx.fillStyle=vignette;ctx.fillRect(0,0,WIDTH,HEIGHT);
      drawApple(ctx,s.appleAlpha);
      ctx.restore();return s;
    }
    destroy(){this.globe?.destroy();}
  }

  function mount(options={}) {
    const doc=options.document||root.document;
    const section=typeof options.target==='string'?doc.querySelector(options.target):(options.target||doc.getElementById('biosphere'));
    if(!section)throw new Error('BiosphereCinema: #biosphere was not found');
    if(sessions.has(section))return sessions.get(section);
    const oldBoard=section.querySelector('.board'),oldLead=section.querySelector(':scope > .lead');
    const base=options.assetBase||new URL('biosphere_cinema_1011_v1/',scriptURL||doc.baseURI).href;
    const make=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
    const tr=(zh,en)=>doc.documentElement.lang.startsWith('en')?en:zh;
    const label=(node,zh,en)=>{node.dataset.zh=zh;node.dataset.en=en;node.textContent=tr(zh,en);return node;};
    const button=(cls,zh,en)=>{const n=label(make('button',cls),zh,en);n.type='button';return n;};
    const shell=make('section','bc-shell');shell.setAttribute('aria-label',tr('從小生命拉遠到地球','From microscopic life to Earth'));
    shell.style.setProperty('--ar','1.77777778');
    const header=make('div','bc-heading'),heading=label(make('h3'),'把鏡頭慢慢拉遠','Pull the camera back');
    const headTools=make('div','bc-head-tools'),full=button('bc-button bc-full-button','⛶ 全螢幕','⛶ Full screen');
    const language=make('div','bc-language'),zh=button('bc-button','中文','中文'),en=button('bc-button','EN','EN');
    language.append(zh,en);headTools.append(language,full);header.append(heading,headTools);
    const selectors=make('div','bc-shots');selectors.setAttribute('role','group');
    const shotButtons=SHOTS.map((shot,i)=>{const b=button('bc-shot',shot.zh,shot.en);b.addEventListener('click',()=>{pause();seek(shot.at);});selectors.append(b);return b;});
    const view=make('div','bc-view'),stage=make('div','bc-stage'),canvas=make('canvas','bc-canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',tr('四鏡頭尺度旅行，解說在圖下方','Four-shot scale journey. Explanation follows the image.'));
    const badges=make('div','bc-badges'),tag=make('span','bc-image-tag'),scaleLabel=make('span','bc-scale-tag');badges.append(tag,scaleLabel);
    const ruler=make('div','bc-ruler'),levels=[10,0,-10].map(alt=>{const n=make('span','bc-level');ruler.append(n);return n;});
    const loading=label(make('div','bc-loading'),'正在準備真實影像…','Preparing the real imagery…');loading.setAttribute('role','status');
    const errorBox=make('div','bc-error');errorBox.hidden=true;
    const errorText=make('p'),retry=button('bc-button','重新載入影像','Retry images');errorBox.append(errorText,retry);
    const hint=label(make('span','bc-drag-hint'),'拖曳地球，換個角度看看','Drag Earth to change your viewpoint');hint.hidden=true;
    const appleNote=make('aside','bc-apple-note');appleNote.hidden=true;
    appleNote.append(label(make('strong'),'蘋果大小的地球','An apple-sized Earth'),label(make('span'),'直徑 10 公分','Diameter 10 cm'),label(make('b'),'薄層約 0.16 毫米','Layer ≈ 0.16 mm'),label(make('small'),'果皮示意・厚度放大','Peel illustration · Rim enlarged'));
    stage.append(canvas,badges,ruler,loading,errorBox,hint,appleNote);
    const caption=make('div','bc-caption'),title=make('h4'),body=make('p');caption.append(title,body);
    const probeTools=make('div','bc-probe-tools'),probeLabel=label(make('span'),'探測位置','Probe location');probeTools.append(probeLabel);
    const probeButtons=[10,0,-10].map(alt=>{const b=button('bc-button',alt===0?'海平面':`${alt>0?'+':'−'}10 km`,alt===0?'Sea level':`${alt>0?'+':'−'}10 km`);b.addEventListener('click',()=>{probe=alt;paint();});probeTools.append(b);return b;});
    caption.append(probeTools);view.append(stage,caption);
    const transport=make('div','bc-transport'),play=button('bc-button bc-play','▶ 播放拉遠','▶ Play journey'),replay=button('bc-button','↺ 重播','↺ Replay');
    const sliderLabel=make('label','bc-slider-label'),sliderText=label(make('span'),'鏡頭進度','Camera timeline'),slider=make('input','bc-timeline');slider.type='range';slider.min='0';slider.max=String(DURATION);slider.step='.05';slider.value='0';
    sliderLabel.append(sliderText,slider);const clock=make('output','bc-clock');transport.append(play,sliderLabel,clock,replay);
    const sources=make('details','bc-sources');sources.append(label(make('summary'),'影像來源與尺度說明','Image sources and scale notes'));
    const disclosure=label(make('p'),'這是不同來源影像串成的尺度旅行模型，並非從同一隻生物連續拍攝到太空。顯微與實拍視野沒有已知比例尺，不可用畫面直接量測生物大小。地球紋理是衛星合成資料；運鏡、剖面與光影由本教材製作。','This scale-transition model connects images from different sources; it is not one continuous recording from an organism to space. The photos have no calibrated scale bars, so screen size cannot measure organism size. Earth uses a satellite mosaic; the camera, cutaway, and lighting are educational rendering.');sources.append(disclosure);
    const credits=[
      {name:['草履蟲顯微照片','Paramecium micrograph'],author:'MTadey',url:'https://commons.wikimedia.org/wiki/File:Param%C3%A9cium_caud%C3%A1tum.jpg',license:'CC BY 4.0',legal:'https://creativecommons.org/licenses/by/4.0/'},
      {name:['綠頭鴨與濕地水面','Mallard and wetland'],author:'CEKeech',url:'https://commons.wikimedia.org/wiki/File:On_a_Golden_Pond,_230821_DSCN1974.jpg',license:'CC0 1.0',legal:'https://creativecommons.org/publicdomain/zero/1.0/'},
      {name:['地球：Blue Marble Next Generation，2004 年 7 月','Earth: Blue Marble Next Generation, July 2004'],author:'NASA Earth Observatory / Reto Stöckli',url:'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/',license:['NASA 影像使用規範','NASA image-use guidelines'],legal:'https://www.nasa.gov/nasa-brand-center/images-and-media/'}
    ];
    for(const c of credits){const p=make('p'),a=label(make('a'),...c.name);a.href=c.url;a.target='_blank';a.rel='noopener';const l=make('a');l.href=c.legal;l.target='_blank';l.rel='noopener';if(Array.isArray(c.license))label(l,...c.license);else l.textContent=c.license;p.append(a,doc.createTextNode(' · '+c.author+' · '),l);sources.append(p);}
    sources.append(label(make('p'),'素材等比例縮圖；照片在顯示時有裁切、平移與縮放，未重畫生物。地球紋理投影至球面並加上照明。','Assets are proportionally resized. Photos are cropped, panned and zoomed in the display; organisms are not redrawn. The Earth texture is projected onto a lit sphere.'));
    sources.append(label(make('p'),'蘋果剖面為本教材繪製的比例比喻，非實拍；果皮邊緣放大示意，不是厚度量測。換算：20 ÷ 12,742 × 100 mm ≈ 0.16 mm。','The apple cutaway is an original educational illustration, not a photograph. Its rim is enlarged, not measured. Scale conversion: 20 ÷ 12,742 × 100 mm ≈ 0.16 mm.'));
    const meanSource=make('p'),meanLink=label(make('a'),'地球平均半徑資料：NASA Earth Fact Sheet','Mean-radius data: NASA Earth Fact Sheet');meanLink.href='https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html';meanLink.target='_blank';meanLink.rel='noopener';meanSource.append(meanLink);sources.append(meanSource);
    shell.append(header,selectors,view,transport,sources);
    // Preserve every old ID for paintBio()/language switching and preserve event handlers.
    const oldState=oldBoard?{hidden:oldBoard.hidden,inert:oldBoard.inert,aria:oldBoard.getAttribute('aria-hidden')}:null;
    const leadHidden=oldLead?.hidden;
    if(oldBoard){oldBoard.before(shell);oldBoard.hidden=true;oldBoard.inert=true;oldBoard.setAttribute('aria-hidden','true');oldBoard.classList.add('bc-legacy-board');}else section.append(shell);
    if(oldLead)oldLead.hidden=true;
    let renderer=null,time=0,playing=false,raf=0,lastStamp=0,lastDraw=0,probe=0,yaw=0,pitch=0,disposed=false,loadVersion=0;
    let isFull=false,origin=null,focusBefore=null,overflowBefore='',nativeEntered=false,fullRevision=0;
    const removers=[];
    function listen(n,type,fn,options){n.addEventListener(type,fn,options);removers.push(()=>n.removeEventListener(type,fn,options));}
    const reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)');
    function active(){const cover=doc.getElementById('introScreen');return !doc.hidden&&!section.hidden&&(!cover||cover.hidden||cover.style.display==='none')&&shell.isConnected;}
    function paint(){
      const s=renderer?renderer.draw(time,yaw,pitch,probe):sceneAt(time,yaw,pitch),shot=SHOTS[s.shot];
      label(title,...shot.title);label(body,...shot.text);label(tag,...shot.tag);label(scaleLabel,...shot.scale);
      if(s.storyTime>=31&&s.storyTime<44){
        label(tag,'持續拉遠 · 薄層回到比例','Pulling back · Layer returns to scale');
        if(s.shot===3){
          label(title,'越退越遠，薄層越難看見','Pull back: the living layer becomes harder to see');
          label(body,'鏡頭正從局部退到整顆地球，綠色薄層的厚度逐漸恢復比例。最後停住，比較這個範圍與地球的大小。','The camera pulls from a local view to the whole Earth, while the green layer gradually returns to scale. The final shot holds so you can compare the layer with the planet.');
        }
      }
      appleNote.hidden=s.appleAlpha===0;appleNote.style.opacity=String(s.appleAlpha);
      for(let i=0;i<4;i++){shotButtons[i].classList.toggle('active',i===s.shot);shotButtons[i].setAttribute('aria-pressed',String(i===s.shot));}
      ruler.style.opacity=String(s.ruler.alpha);ruler.hidden=s.ruler.alpha===0;
      for(let i=0;i<3;i++){
        const zhText=['＋10 km','海平面 0','−10 km'][i],enText=['+10 km','Sea level 0','−10 km'][i];label(levels[i],zhText,enText);
        levels[i].style.top=([s.ruler.top,s.ruler.middle,s.ruler.bottom][i]/HEIGHT*100)+'%';levels[i].style.left=(s.ruler.x/WIDTH*100+2)+'%';
      }
      probeTools.hidden=s.shot!==2;probeButtons.forEach((b,i)=>{const on=[10,0,-10][i]===probe;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
      hint.hidden=s.storyTime<44||playing||renderer?.mode==='still';
      slider.value=String(time);slider.setAttribute('aria-valuetext',`${tr(shot.zh,shot.en)} · ${Math.floor(time)} / ${DURATION} ${tr('秒','seconds')}`);
      clock.textContent=`${String(Math.floor(time)).padStart(2,'0')} / ${DURATION} s`;
      label(play,playing?'Ⅱ 暫停':reduced?.matches?'▶ 播放拉遠':'▶ 播放拉遠',playing?'Ⅱ Pause':'▶ Play journey');play.setAttribute('aria-pressed',String(playing));
      if(renderer)shell.dataset.renderer=renderer.mode;
      fit();
    }
    function pause(){playing=false;if(raf)root.cancelAnimationFrame(raf);raf=0;lastStamp=0;paint();}
    function seek(value){time=clamp(Number(value)||0,0,DURATION);paint();}
    function animate(stamp){
      raf=0;if(!playing||disposed)return;if(!active()){pause();return;}
      // Use elapsed time: a slow rendering device must not stretch a 20s film to a minute.
      // Visibility/tab handlers pause the clock before returning from the background.
      if(lastStamp)time=Math.min(DURATION,time+Math.max(0,(stamp-lastStamp)/1000));lastStamp=stamp;
      const interval=renderer?.mode==='software'?80:30;
      if(stamp-lastDraw>=interval||time>=DURATION){paint();lastDraw=stamp;}
      if(time>=DURATION){pause();return;}raf=root.requestAnimationFrame(animate);
    }
    function start(){if(!renderer||!active())return;if(playing)return;if(time>=DURATION){time=0;yaw=0;pitch=0;}playing=true;lastStamp=0;paint();raf=root.requestAnimationFrame(animate);}
    function fit(){
      if(!isFull)return;const h=view.clientHeight-caption.offsetHeight-12;if(h>0)stage.style.setProperty('--bc-available-h',h+'px');
    }
    function exitNative(){const native=doc.fullscreenElement||doc.webkitFullscreenElement;if(native!==shell)return;const exit=doc.exitFullscreen||doc.webkitExitFullscreen;try{Promise.resolve(exit?.call(doc)).catch(()=>{});}catch{}}
    function closeFull(){
      if(!isFull)return;isFull=false;nativeEntered=false;fullRevision++;shell.classList.remove('bc-full');shell.removeAttribute('aria-modal');shell.setAttribute('role','region');
      stage.style.removeProperty('--bc-available-h');doc.body.style.overflow=overflowBefore;exitNative();
      if(origin?.parentNode){origin.replaceWith(shell);origin=null;}label(full,'⛶ 全螢幕','⛶ Full screen');full.setAttribute('aria-pressed','false');focusBefore?.focus?.({preventScroll:true});
    }
    function openFull(){
      if(isFull)return;isFull=true;const revision=++fullRevision;focusBefore=doc.activeElement;overflowBefore=doc.body.style.overflow;
      origin=doc.createComment('Biosphere cinema fullscreen return');shell.before(origin);doc.body.append(shell);doc.body.style.overflow='hidden';
      shell.classList.add('bc-full');shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');label(full,'✕ 離開全螢幕','✕ Exit full screen');full.setAttribute('aria-pressed','true');full.focus({preventScroll:true});fit();
      const request=shell.requestFullscreen||shell.webkitRequestFullscreen;
      try{Promise.resolve(request?.call(shell)).then(()=>{
        if(!isFull){exitNative();return;}
        // A delayed response from an older opening must not close a newer session.
        if(revision!==fullRevision)return;
        nativeEntered=(doc.fullscreenElement||doc.webkitFullscreenElement)===shell;fit();
      }).catch(()=>{});}catch{}
    }
    function syncLanguage(){
      for(const n of shell.querySelectorAll('[data-zh][data-en]'))n.textContent=tr(n.dataset.zh,n.dataset.en);
      // A translated label must not remove its nested input.
      if(!slider.isConnected)sliderLabel.append(slider);
      label(full,isFull?'✕ 離開全螢幕':'⛶ 全螢幕',isFull?'✕ Exit full screen':'⛶ Full screen');
      shell.setAttribute('aria-label',tr('從小生命拉遠到地球','From microscopic life to Earth'));
      canvas.setAttribute('aria-label',tr('四鏡頭尺度旅行，解說在圖下方','Four-shot scale journey. Explanation follows the image.'));
      zh.setAttribute('aria-pressed',String(!doc.documentElement.lang.startsWith('en')));en.setAttribute('aria-pressed',String(doc.documentElement.lang.startsWith('en')));paint();
    }
    function setLanguage(next){const host=doc.getElementById(next==='en'?'langEn':'langZh');if(host)host.click();else doc.documentElement.lang=next==='en'?'en':'zh-Hant';syncLanguage();}
    const imageFiles={micro:'paramecium_1800.jpg',habitat:'mallard_1920.jpg',earth:'earth_july_4096.jpg',fallback:'earth_globe_fallback.png'};
    function loadImage(file){return new Promise((resolve,reject)=>{const image=new root.Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(file));image.src=new URL(file,base).href;});}
    async function load(){
      const version=++loadVersion;pause();loading.hidden=false;errorBox.hidden=true;play.disabled=true;replay.disabled=true;
      try{
        const pairs=await Promise.all(Object.entries(imageFiles).map(async([key,file])=>[key,await loadImage(file)]));
        if(disposed||version!==loadVersion)return;
        renderer?.destroy();renderer=new Renderer(canvas,Object.fromEntries(pairs));loading.hidden=true;play.disabled=false;replay.disabled=false;shell.dataset.ready='true';paint();
        return controller;
      }catch(error){
        if(disposed||version!==loadVersion)return;loading.hidden=true;errorBox.hidden=false;shell.dataset.ready='error';
        label(errorText,'影像尚未載入，無法播放這段尺度旅行。請確認素材檔案已放入網站，再重新載入。','An image did not load, so this journey cannot play. Check that the assets are present on the website, then retry.');
        shell.dataset.loadError=error.message;return null;
      }
    }
    listen(play,'click',()=>playing?pause():start());listen(replay,'click',()=>{pause();yaw=0;pitch=0;seek(0);start();});
    listen(slider,'input',()=>{const requested=Number(slider.value);pause();seek(requested);});listen(full,'click',()=>isFull?closeFull():openFull());listen(retry,'click',load);
    listen(zh,'click',()=>setLanguage('zh'));listen(en,'click',()=>setLanguage('en'));
    let drag=null;
    listen(canvas,'pointerdown',e=>{if(time<seconds(34))return;pause();drag={x:e.clientX,y:e.clientY,yaw,pitch,id:e.pointerId};canvas.setPointerCapture?.(e.pointerId);});
    listen(canvas,'pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw=drag.yaw+(e.clientX-drag.x)/Math.max(1,canvas.clientWidth)*3;pitch=clamp(drag.pitch+(e.clientY-drag.y)/Math.max(1,canvas.clientHeight)*1.5,-1,1);paint();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,event,()=>{drag=null;});
    listen(doc,'keydown',e=>{
      if(!isFull)return;if(e.key==='Escape'){e.preventDefault();closeFull();return;}
      if(e.key==='Tab'){
        const all=[...shell.querySelectorAll('button,input,a[href],summary')].filter(n=>!n.disabled&&n.getClientRects().length),first=all[0],last=all.at(-1);
        if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first?.focus();}
      }
    });
    for(const event of ['fullscreenchange','webkitfullscreenchange'])listen(doc,event,()=>{const native=doc.fullscreenElement||doc.webkitFullscreenElement;if(native===shell){nativeEntered=true;fit();}else if(isFull&&nativeEntered)closeFull();});
    listen(doc,'visibilitychange',()=>{if(!active())pause();});listen(root,'resize',fit,{passive:true});listen(root,'pagehide',()=>{pause();closeFull();});
    const observers=[];
    if(root.MutationObserver){
      const langObserver=new root.MutationObserver(syncLanguage);langObserver.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});observers.push(langObserver);
      const visibilityObserver=new root.MutationObserver(()=>{if(!active()){pause();closeFull();}});visibilityObserver.observe(section,{attributes:true,attributeFilter:['hidden','class','style']});const cover=doc.getElementById('introScreen');if(cover)visibilityObserver.observe(cover,{attributes:true,attributeFilter:['hidden','style','class']});observers.push(visibilityObserver);
    }
    if(root.ResizeObserver){const observer=new root.ResizeObserver(fit);observer.observe(view);observer.observe(caption);observers.push(observer);}
    if(reduced)listen(reduced,'change',()=>{if(reduced.matches)pause();});
    const controller={element:shell,canvas,seek,play:start,pause,setLanguage,openFullscreen:openFull,closeFullscreen:closeFull,
      get state(){return {time,playing,renderer:renderer?.mode||'loading',fullscreen:isFull,shot:sceneAt(time).shot};},
      destroy(){pause();closeFull();disposed=true;loadVersion++;renderer?.destroy();removers.forEach(remove=>remove());observers.forEach(o=>o.disconnect());shell.remove();if(oldBoard){oldBoard.hidden=oldState.hidden;oldBoard.inert=oldState.inert;oldBoard.classList.remove('bc-legacy-board');if(oldState.aria===null)oldBoard.removeAttribute('aria-hidden');else oldBoard.setAttribute('aria-hidden',oldState.aria);}if(oldLead)oldLead.hidden=leadHidden;sessions.delete(section);}
    };
    sessions.set(section,controller);syncLanguage();controller.ready=load();return controller;
  }
  const api={mount,Renderer,sceneAt,SHOTS,WIDTH,HEIGHT,DURATION,EARTH_KM,APPLE_DIAMETER_MM,APPLE_LAYER_MM,VERTEX,FRAGMENT,softwareGlobe};
  root.BiosphereCinema=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);

/* ht3d_page_human_transport_1122_v1.js — 把 3D 醫學版接到 biology_human_transport.html（外層加法）
 *
 * 只用既有檔案公開的介面，不改它們：
 *   window.LivingBook（getTab／getState／setTab／D）、window.setMode、window.HTLesson（takeover／show）、
 *   window.HumanTransportExchanges.draw（放大窗直接呼叫現成的小腸絨毛／肝臟交換動畫）。
 * 進入 3D：HTLesson.takeover(true) 讓老師講解的 2D 佇列停手，並把 2D 狀態 running=false（引擎既有的暫停條件，
 *          2D 時鐘不再前進、不再重畫）；2D 畫布隱藏、控制列隱藏，3D 自己的 5 個步驟鈕接手。
 * 回到 2D：釋放 WebGL、takeover(false)，再呼叫原本的 setMode(目前模式) 讓 2D 照原樣重新開始。
 * 預設仍是「經典 2D 版」；老師看過再決定換預設（DEFAULT_3D）。
 * 對外介面 window.HT3D（有聲講解之後會用）：scenes, go(scene, step, ms, {after}), pause, resume, isPlaying, getState, setLang, dispose。
 */
const VER = '20261123-h2';
const DEFAULT_3D = false;
const CORE = './ht3d_core_1122_v1.js?v=' + VER;
const REGISTRY = './ht3d_scenes_1122_v1.js?v=' + VER;
let SCENES = {};   // boot() 讀入場景清單（ht3d_scenes_1122_v1.js）
const TAB_ID = 'circulation';

const $ = (id) => document.getElementById(id);
const LB = () => window.LivingBook;
const tabId = () => { try { return LB().getTab().id; } catch (e) { return null; } };
const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'zh');
const tr = (p) => (Array.isArray(p) ? p[lang() === 'en' ? 1 : 0] : String(p ?? ''));
const teacher = () => document.body.classList.contains('mode-teacher');
const isLite = () => /[?&]ht3d=lite\b/.test(location.search) || (window.matchMedia && matchMedia('(pointer:coarse)').matches) || sessionStorage.getItem('ht3d-lite') === '1';

const S = { pref: DEFAULT_3D ? '3d' : '2d', scene: null, active: false, viewer: null, token: 0, sceneMod: null, step: 0, self: false, ready: false, voiceBusy: false, error: null };

/* ---------- DOM ---------- */
let toggle, stage, stepsBar, sceneBar, loading, toast, credits, schematicP;
function el(tag, cls, html) { const n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; }
function bi(n, zh, en) { n.dataset.zh = zh; n.dataset.en = en; n.textContent = lang() === 'en' ? en : zh; return n; }
function buildDom() {
  const mount = $('ht3dToggleMount') || document.querySelector('.head-actions');
  toggle = el('div', 'ht3d-toggle'); toggle.setAttribute('role', 'group'); toggle.setAttribute('aria-label', '3D / 2D');
  const b3 = bi(el('button', 'ht3d-tbtn'), '🫀 3D 醫學版', '🫀 3D medical view'); b3.type = 'button'; b3.dataset.v = '3d';
  const b2 = bi(el('button', 'ht3d-tbtn'), '經典 2D 版', 'Classic 2D'); b2.type = 'button'; b2.dataset.v = '2d';
  toggle.append(b3, b2); mount.append(toggle);
  toggle.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; setPref(b.dataset.v); });
  stage = el('div', 'ht3d-stage'); stage.hidden = true; $('media').append(stage);
  loading = el('div', 'ht3d-loading', '<div class="ht3d-load-txt"></div><div class="ht3d-bar"><i></i></div>'); stage.append(loading);
  stepsBar = el('div', 'pt-steps ht3d-steps'); stepsBar.setAttribute('role', 'group'); stepsBar.hidden = true;
  $('ptSteps').after(stepsBar);
  sceneBar = el('div', 'ht3d-scenes'); sceneBar.setAttribute('role', 'group'); sceneBar.hidden = true; stepsBar.before(sceneBar);
  sceneBar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) selectScene(b.dataset.scene); });
  toast = el('div', 'ht3d-toast'); toast.hidden = true; $('bench').append(toast);
  credits = el('div', 'ht3d-credits');
  const p1 = bi(el('p'), '3D 醫學版的解剖模型：“Z-Anatomy — The libre 3D atlas of anatomy”, CC BY-SA 4.0, based on “BodyParts3D, © The Database Center for Life Science”, licensed under CC Attribution 4.0 International (CC BY-SA 2.1 Japan when Z-Anatomy adapted it). Adapted for Svitylo 3D Anatomy Atlas. 本站再挑選結構、簡化、壓縮並重新上色（有修改），整份 3D 資料以 CC BY-SA 4.0 提供。',
    '3D anatomy: “Z-Anatomy — The libre 3D atlas of anatomy”, CC BY-SA 4.0, based on “BodyParts3D, © The Database Center for Life Science”, licensed under CC Attribution 4.0 International (CC BY-SA 2.1 Japan when Z-Anatomy adapted it). Adapted for Svitylo 3D Anatomy Atlas. This site selected, simplified, compressed and recoloured the structures (modified); the 3D data are shared under CC BY-SA 4.0.');
  const p2 = bi(el('p'), '腎臟外形：Human Reference Atlas 3D Reference Organ（Browne K., Schlehlein H.），CC BY 4.0。',
    'Kidney shape: Human Reference Atlas 3D Reference Organ (Browne K., Schlehlein H.), CC BY 4.0.');
  const p3 = bi(el('p'), '小分支為示意：小動脈、腸壁微血管、小靜脈、肝臟內的路徑，以及下腔靜脈接到右心房的那一小段，是程式生成的示意，不是解剖資料；血球放大、速度為教學示意。中心線由網格自動估算。',
    'Small branches are schematic: the arterioles, gut-wall capillaries, venules, routes inside the liver and the short link from the inferior vena cava into the right atrium are generated diagrams, not anatomical data. Cells are enlarged and speeds are illustrative. Centrelines are estimated automatically from the meshes.');
  const p4 = el('p'); p4.innerHTML = '<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> · <a href="https://github.com/Z-Anatomy/Models-of-human-anatomy" target="_blank" rel="noopener">Z-Anatomy</a> · <a href="assets/biology/anatomy3d/sources.md" target="_blank" rel="noopener" data-zh="3D 資料來源與改作說明" data-en="3D sources and changes">3D 資料來源與改作說明</a>';
  schematicP = p3; schematicP.dataset.zh0 = p3.dataset.zh; schematicP.dataset.en0 = p3.dataset.en;
  credits.append(p1, p2, p3, p4);
  $('figureCredits').after(credits);
}
function syncToggle() {
  if (!toggle) return;
  toggle.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === (S.active || S.pref === '3d' ? '3d' : '2d'); b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
}
/* ---------- 場景選單（只有 2 個以上場景才顯示） ---------- */
function buildSceneBar() {
  sceneBar.replaceChildren();
  Object.entries(SCENES).forEach(([id, d]) => { const b = bi(el('button', 'ht3d-sbtn'), d.label[0], d.label[1]); b.type = 'button'; b.dataset.scene = id; sceneBar.append(b); });
  syncSceneBar();
}
function syncSceneBar() {
  if (!sceneBar) return;
  sceneBar.hidden = !(S.active && Object.keys(SCENES).length > 1);
  sceneBar.querySelectorAll('button').forEach((b) => { const on = b.dataset.scene === S.scene; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
}
function showToast(zh, en, ms = 7000) { bi(toast, zh, en); toast.hidden = false; clearTimeout(showToast.t); showToast.t = setTimeout(() => { toast.hidden = true; }, ms); }

/* ---------- 步驟鈕與說明 ---------- */
function stepsDef() { return S.sceneMod ? S.sceneMod.STEPS : []; }
function buildSteps() {
  stepsBar.replaceChildren();
  stepsDef().forEach((st, i) => {
    const b = el('button', 'pt-step'); b.type = 'button'; b.dataset.k = String(i);
    const n = el('b'); n.textContent = String(i + 1);
    const t = bi(el('span'), st.btn[0], st.btn[1]);
    b.append(n, t); b.addEventListener('click', () => { if (!S.viewer) return; if (teacher()) S.viewer.playFrom(i); else S.viewer.playStep(i); syncPause(); });
    stepsBar.append(b);
  });
  markStep(S.step);
}
function markStep(k) { stepsBar.querySelectorAll('.pt-step').forEach((b) => b.classList.toggle('on', +b.dataset.k === k)); }
function resolve(p) { return typeof p === 'function' ? p(window.HumanTransportExchanges) : p; }
function caption(k) {
  const st = stepsDef()[k]; if (!st) return;
  const title = resolve(st.title), parts = st.text.map((x) => resolve(x.p));
  $('captionTitle').textContent = tr(title);
  $('captionText').textContent = parts.map((p) => tr(p)).join(lang() === 'en' ? '\n' : '\n');
  $('liveStatus').textContent = tr(S.sceneMod.SCENE.status);
}
function syncPause() {
  const b = $('ptPause'); if (!b || !S.active) return;
  const playing = S.viewer && S.viewer.isPlaying();
  b.textContent = playing ? (lang() === 'en' ? '⏸ Pause' : '⏸ 暫停') : (lang() === 'en' ? '▶ Resume' : '▶ 繼續');
}

/* ---------- 2D 引擎的暫停／還原（只用公開介面） ---------- */
function takeover(on) { const H = window.HTLesson; if (!H) return; S.self = true; try { H.takeover(on); } finally { S.self = false; } }
function freeze2D() { try { const s = LB().getState(); if (s) s.running = false; } catch (e) { /* ignore */ } }

/* ---------- 啟用／停用 ---------- */
async function activate(sceneId) {
  const want = sceneId && SCENES[sceneId] ? sceneId : (S.scene || Object.keys(SCENES)[0]);
  if (S.active) return want === S.scene ? S.ready : switchScene(want);
  S.active = true; S.error = null; const token = ++S.token;
  document.body.classList.add('ht3d-on'); stage.hidden = false; stepsBar.hidden = false; loading.hidden = false;
  takeover(true); freeze2D(); syncToggle();
  setLoad(0);
  return loadScene(want, token);
}
/* 換場景：釋放目前這個 3D、載入另一個（舞台、切換鈕、2D 暫停狀態都不動） */
async function switchScene(id) {
  const token = ++S.token;
  if (S.viewer) { S.viewer.dispose(); S.viewer = null; }
  S.ready = false; stage.querySelectorAll('.ht3d-layers').forEach((n) => n.remove());
  loading.hidden = false; setLoad(0);
  return loadScene(id, token);
}
function selectScene(id) { if (!SCENES[id]) return; if (S.active) switchScene(id); else { S.scene = id; syncSceneBar(); } }
async function loadScene(id, token) {
  S.scene = id; syncSceneBar();
  let core, mod;
  try {
    [core, mod] = await Promise.all([import(CORE), import(SCENES[id].file + '?v=' + VER)]);
  } catch (e) { return fail(token, e); }
  if (token !== S.token) return false;
  S.sceneMod = mod; buildSteps(); S.step = 0; caption(0);
  { const sc = mod.SCENE.schematic; const p = schematicP; if (p) { p.dataset.zh = sc ? sc[0] : p.dataset.zh0; p.dataset.en = sc ? sc[1] : p.dataset.en0; p.textContent = lang() === 'en' ? p.dataset.en : p.dataset.zh; } }
  const X = window.HumanTransportExchanges;
  const D2 = LB() && LB().D ? LB().D : {};
  const D = Object.assign({}, D2, { tr: (p) => (Array.isArray(p) ? p[S.viewer && S.viewer.lang === 'en' ? 1 : lang() === 'en' ? 1 : 0] : String(p ?? '')), hit() {}, status() {} });
  const winState = { exchange: 'intestine', substance: 'all', exchangeSpeed: 1, lungView: 'gas', kidneyView: 'cells' };
  let viewer;
  try {
    viewer = await core.createViewer({
      host: stage, scene: mod.SCENE, lite: isLite(), lang: lang(), onProgress: setLoad,
      ariaLabel: lang() === 'en' ? '3D blood circulation: ' + mod.SCENE.name[1] : '3D 血液循環：' + mod.SCENE.name[0],
      drawInset: (ctx, kind, t) => { if (!X) return; const kf = kind === 'kidney_filter'; winState.exchange = kf ? 'kidney' : kind; winState.kidneyView = kf ? 'extension' : 'cells'; X.draw(ctx, winState, t, D); }
    });
  } catch (e) { return fail(token, e); }
  if (token !== S.token) { viewer.dispose(); return false; }
  S.viewer = viewer; loading.hidden = true; syncSceneBar();
  viewer.setHandlers({
    onStep: (k) => { S.step = k; markStep(k); caption(k); syncPause(); },
    onEnd: () => syncPause()
  });
  watchFps();
  if (teacher()) viewer.playFrom(0); else viewer.playStep(0);
  syncPause(); S.ready = true;
  return true;
}
function setLoad(f) {
  const pct = Math.round(f * 100);
  loading.querySelector('.ht3d-load-txt').textContent = (lang() === 'en' ? 'Loading the 3D model… ' : '3D 模型載入中… ') + pct + '%';
  loading.querySelector('i').style.width = pct + '%';
}
function fail(token, e) {
  if (token !== S.token) return false;
  console.warn('[HT3D] 3D 載入失敗，退回 2D：', e && e.message);
  S.error = String(e && e.message || e);
  showToast('3D 模型暫時無法顯示（' + (S.error === 'webgl' ? '這台裝置不支援 WebGL' : '載入失敗') + '），已切回經典 2D 版。',
    'The 3D model could not be shown (' + (S.error === 'webgl' ? 'WebGL is not available' : 'loading failed') + '); switched back to the classic 2D view.');
  S.pref = '2d'; deactivate('toggle'); return false;
}
function deactivate(reason) {
  if (!S.active) return;
  S.token++; S.active = false; S.ready = false;
  if (S.viewer) { S.viewer.dispose(); S.viewer = null; }
  stage.querySelectorAll('.ht3d-layers').forEach((n) => n.remove());
  stage.hidden = true; stepsBar.hidden = true; sceneBar.hidden = true; loading.hidden = true;
  document.body.classList.remove('ht3d-on'); syncToggle();
  takeover(false);
  if (reason === 'toggle' && tabId() === TAB_ID && S.origSetMode) S.origSetMode(teacher() ? 'teacher' : 'student');   // 2D 照原樣重新開始
}
function setPref(v) {
  S.pref = v === '3d' ? '3d' : '2d'; syncToggle();
  if (S.pref === '3d' && tabId() === TAB_ID) activate(); else if (S.pref === '2d') deactivate('toggle');
}

/* FPS 太低：降粒子數，下次自動用 lite 版 glb */
function watchFps() {
  const v = S.viewer; let n = 0;
  const iv = setInterval(() => {
    if (!S.viewer || S.viewer !== v) return clearInterval(iv);
    if (!v.isPlaying() || v.stats.frames < 40) return;
    n++;
    if (v.stats.fps && v.stats.fps < 24 && !v.lite) { v.setBudget(1200); sessionStorage.setItem('ht3d-lite', '1'); S.lowFps = v.stats.fps; clearInterval(iv); }
    if (n > 6) clearInterval(iv);
  }, 1000);
}

/* ---------- 與頁面既有機制接線 ---------- */
function wire() {
  // 模式切換：包一層，原本的 setMode 先跑（它在 takeover 時不會動 2D），3D 再依模式從第 1 步開始
  S.origSetMode = window.setMode;
  window.setMode = function (m) {
    S.origSetMode(m);
    if (S.active && S.viewer) { if (m === 'teacher') S.viewer.playFrom(0); else S.viewer.playStep(0); syncPause(); }
  };
  // 有聲講解（或其他程式）接手 2D：先退出 3D
  const H = window.HTLesson;
  if (H) {
    const show = H.show, take = H.takeover;
    H.show = function () { if (S.active) { S.pref = '2d'; deactivate('voice'); } return show.apply(this, arguments); };
    H.takeover = function (on) { if (!S.self && on && S.active) { S.pref = '2d'; deactivate('voice'); } return take.apply(this, arguments); };
  }
  // 老師講解的暫停／重播鈕：3D 時由 3D 接手（capture 階段攔下，不讓 2D 收到）
  document.addEventListener('click', (e) => {
    if (!S.active) return;
    const t = e.target.closest && e.target.closest('#ptPause, #ptReplay, #resetButton');
    if (!t) return;
    e.stopPropagation(); e.preventDefault();
    if (!S.viewer) return;
    if (t.id === 'ptPause') { if (S.viewer.isPlaying()) S.viewer.pause(); else S.viewer.resume(); }
    else { S.viewer.resetCamera(); if (teacher()) S.viewer.playFrom(0); else S.viewer.playStep(0); }
    syncPause();
  }, true);
  // 換分頁：離開循環分頁就停用並釋放 3D；回來且偏好 3D 就恢復
  $('lessonTabs').addEventListener('click', () => setTimeout(sync, 0));
  // 語言：引擎 render() 會重寫說明；我們在它之後更新 3D 的說明、標籤、步驟鈕
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    setTimeout(() => {
      bi(toggle.children[0], '🫀 3D 醫學版', '🫀 3D medical view'); bi(toggle.children[1], '經典 2D 版', 'Classic 2D');
      if (!S.active) return;
      freeze2D();
      if (S.viewer) S.viewer.setLang(lang());
      sceneBar.querySelectorAll('button').forEach((b) => { b.textContent = lang() === 'en' ? b.dataset.en : b.dataset.zh; });
      if (schematicP) schematicP.textContent = lang() === 'en' ? schematicP.dataset.en : schematicP.dataset.zh;
      if (S.sceneMod) { buildSteps(); caption(S.step); }
      syncPause();
    }, 0);
  }));
  setInterval(sync, 400);
}
function sync() {
  const on = tabId() === TAB_ID;
  document.body.classList.toggle('ht3d-circ', on);
  if (S.active && !on) deactivate('tab');
  else if (!S.active && on && S.pref === '3d' && $('introScreen') && $('introScreen').hidden) activate();
  else if (S.active) freeze2D();
}

/* ---------- 對外介面 ---------- */
window.HT3D = {
  get scenes() { return Object.keys(SCENES); },
  /** 跳到某場景、第 step 步（1 起算）、第 ms 毫秒；after：'loop'（預設：鏡頭停在最後一格、血流繼續）或 'stop' */
  async go(scene = 'small_intestine', step = 1, ms = 0, opts = {}) {
    if (!SCENES[scene]) throw new Error('unknown scene ' + scene + '（可用：' + Object.keys(SCENES).join(', ') + '）');
    if (tabId() !== TAB_ID) { const i = LB().modules.human.tabs.findIndex((t) => t.id === TAB_ID); LB().setTab(i); }
    S.pref = '3d'; syncToggle();
    const ok = await activate(scene); if (!ok && !S.viewer) return null;
    S.viewer.go(Math.max(0, Math.min(stepsDef().length - 1, step - 1)), ms, opts.after || 'loop'); syncPause();
    return window.HT3D.getState();
  },
  pause() { if (S.viewer) { S.viewer.pause(); syncPause(); } },
  resume() { if (S.viewer) { S.viewer.resume(); syncPause(); } },
  isPlaying() { return !!(S.viewer && S.viewer.isPlaying()); },
  getState() { return { active: S.active, scene: S.scene, ready: !!S.viewer, pref: S.pref, error: S.error, lowFps: S.lowFps || null, ...(S.viewer ? { ...S.viewer.getState(), position: S.viewer.position(), stats: { ...S.viewer.stats } } : {}) }; },
  setLang(l) { const b = document.querySelector('[data-lang="' + (l === 'en' ? 'en' : 'zh') + '"]'); if (b) b.click(); },
  dispose() { S.pref = '2d'; deactivate('toggle'); },
  _debug: { viewer: () => S.viewer, lumen: (n) => S.viewer && S.sceneMod ? S.viewer.lumenCheck(n || 200, S.sceneMod.LUMEN_MESH) : null, sample: (n) => S.viewer && S.viewer.sampleParticles(n || 50) }
};

async function boot() {
  if (!LB() || !LB().getTab || typeof window.setMode !== 'function' || !window.HTLesson || !$('media')) return setTimeout(boot, 60);
  try { SCENES = (await import(REGISTRY)).SCENES; } catch (e) { console.warn('[HT3D] 讀不到場景清單，3D 不啟用：', e && e.message); return; }
  S.scene = Object.keys(SCENES)[0];
  buildDom(); buildSceneBar(); wire(); syncToggle(); sync();
}
boot();

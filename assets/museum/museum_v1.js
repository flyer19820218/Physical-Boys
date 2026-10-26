// 伽利略星球入口：載入資料、建立畫面層、（可用時）建立 3D 場景、處理網址路由。
// 改版時請同步更新 index.html（首頁）、本檔與下面兩個 import 的 ?v= 版本字串。
import { createUI } from './ui.js?v=20261026o';
import { startLaunch } from './launch.js?v=20261026o';
import { loadNarration } from './narration.js?v=20261026o';

const VERSION = '20261026o';

const CONFIG = {
  // 舊版清單（原本的首頁）。伽利略星球已經是 index.html。
  classicUrl: 'index_classic.html',
  // 課程在新分頁開啟（沿用目前首頁行為；3D 狀態不會因為上課而丟掉）。
  lessonTarget: '_blank',
  dataUrl: 'assets/museum/data/lessons.json',
};

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';
const QUALITY = params.get('q'); // low | mid | high
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadLang() {
  try {
    const v = localStorage.getItem('galileo.lang');
    if (v === 'zh' || v === 'en') return v;
  } catch (e) { /* 隱私模式等情況：忽略 */ }
  return 'zh'; // 預設繁體中文
}
function saveLang(l) {
  try { localStorage.setItem('galileo.lang', l); } catch (e) { /* ignore */ }
}

// 開場（煙霧＋歡迎詞＋太空梭飛進來）：每次重新開啟網頁都播一次（同一分頁內從課程按回首頁不重播）；
// 直接連到某一館時不播。?intro=1 強制播放、?intro=0 不播。
const INTRO_KEY = 'galileo.introAt';
const INTRO_GAP = 0; // 0 = 每次重新開啟網頁都播（同一分頁內回到首頁不重播，由 sessionStorage 擋）
function shouldIntro() {
  const q = params.get('intro');
  if (q === '0') return false;
  if (q === '1') return true;
  if (reducedMotion) return false;
  const h = location.hash.replace(/^#\/?/, '');
  if (h && h !== 'planet') return false;
  try {
    if (sessionStorage.getItem('galileo.introSeen') === '1') return false;
    const t = +localStorage.getItem(INTRO_KEY) || 0;
    if (Date.now() - t < INTRO_GAP) return false;
  } catch (e) { /* ignore */ }
  return true;
}
const launch = shouldIntro() ? startLaunch({ lang: loadLang() }) : null;
// 開場旁白（BreezyVoice 錄的中文）：只有中文介面才播；還沒有音檔就是 null，開場照舊無聲
const narrP = loadLang() === 'zh' && params.get('voice') !== '0'
  ? loadNarration({ base: 'assets/museum/audio/', ver: VERSION })
  : Promise.resolve(null);
let narrReady = null;
narrP.then(n => { narrReady = n; });

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(label + ' timeout')), ms)),
  ]);
}

async function main() {
  let scene = null;
  let launchDone = !launch;
  function endLaunch() {
    if (launchDone) return;
    launchDone = true;
    document.body.classList.remove('launching');
    try { sessionStorage.setItem('galileo.introSeen', '1'); localStorage.setItem(INTRO_KEY, String(Date.now())); } catch (e) { /* ignore */ }
  }
  if (launch) launch.onSkip(() => { if (narrReady) narrReady.stop(); launch.skip(); if (scene) scene.skipIntro(); endLaunch(); });
  async function runLaunch() {
    if (!launch || launchDone) return;
    const flying = !!(scene && scene.beginIntro());
    await launch.minShown;
    if (launchDone) { if (scene) scene.skipIntro(); return; }
    const narr = flying ? await narrP : null;
    if (launchDone) return;
    if (narr) {
      // 有旁白：等使用者按「出發」→ 旁白開始 → 倒數 3、2、1 → 念到「出發」那一刻煙霧散開、開始飛
      launch.showGo(() => {
        let launched = false;
        const doLaunch = () => {
          if (launched || launchDone) return;
          launched = true;
          launch.part(() => scene.playIntro(endLaunch), 0);
        };
        narr.play(null, c => {
          if (c.role === 'count') launch.count(c.sub);
          else if (c.role === 'launch') doLaunch();
        }).then(ok => { if (!ok) doLaunch(); });
        const lc = narr.cues.lines.find(c => c.role === 'launch');
        setTimeout(doLaunch, ((lc ? lc.start : 6) + 4) * 1000); // 保險：音檔卡住也會出發
      });
      await launch.done;
      return;
    }
    launch.part(() => { if (flying) scene.playIntro(endLaunch); });
    await launch.done;
    if (!flying) endLaunch();
  }

  const res = await fetch(CONFIG.dataUrl + '?v=' + VERSION);
  if (!res.ok) throw new Error('lessons.json ' + res.status);
  const data = await res.json();
  try {
    const sr = await fetch(CONFIG.dataUrl.replace('lessons.json', 'scientists.json') + '?v=' + VERSION);
    if (sr.ok) data.scientists = await sr.json();
  } catch (e) { /* 沒有科學家簡介也能用 */ }

  let route = { mode: 'planet' };

  const parseHash = () => {
    const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const [a, b] = raw.split('/');
    const hall = data.halls.find(h => h.id === a);
    if (!hall) return { mode: 'planet' };
    const unit = hall.units.find(u => u.id === b);
    return { mode: 'hall', hall: hall.id, unit: unit ? unit.id : null };
  };
  const go = target => { location.hash = target === 'planet' ? '#planet' : '#' + target; };
  const replaceHash = (hallId, unitId) => {
    try { history.replaceState(null, '', '#' + hallId + (unitId ? '/' + unitId : '')); } catch (e) { /* ignore */ }
  };

  const ui = createUI({
    data,
    config: CONFIG,
    lang: loadLang(),
    handlers: {
      onPickHall: id => go(id),
      onBack: () => go('planet'),
      onLang: l => { saveLang(l); ui.setLang(l); },
      onUnitChange: (unitId, via) => {
        if (route.mode !== 'hall') return;
        route.unit = unitId;
        ui.setFocusUnit(unitId);
        if (scene) scene.focusUnit(unitId, false);
        replaceHash(route.hall, unitId);
      },
      onSheetFraction: (f, axis) => { if (scene) scene.setSheetFraction(f, axis); },
    },
  });

  function apply(r, instant) {
    route = r;
    if (r.mode === 'planet') {
      ui.showPlanet();
      if (scene) scene.flyToPlanet(instant);
    } else {
      const unit = ui.showHall(r.hall, r.unit);
      route.unit = unit;
      ui.setFocusUnit(unit);
      if (scene) {
        scene.flyToHall(r.hall, instant);
        scene.focusUnit(unit, true);
      }
    }
    document.body.classList.remove('booting');
  }

  window.addEventListener('hashchange', () => apply(parseHash(), false));
  apply(parseHash(), true); // 先把畫面層顯示出來；3D 好了再接上

  // ---- 3D 場景（失敗就退回簡易模式，畫面層本身是完整可用的） ----
  const canvas = document.getElementById('scene');
  const debugEl = document.getElementById('debug');
  try {
    const modP = withTimeout(import('./scene.js?v=' + VERSION), 20000, 'scene import');
    if (launch && !launchDone) await launch.textShown;
    const mod = await modP;
    scene = await mod.createScene({
      canvas,
      halls: data.halls,
      scientists: data.scientists || {},
      reducedMotion,
      quality: QUALITY,
      debugEl: DEBUG ? debugEl : null,
      handlers: {
        onInteract: () => document.body.classList.add('touched'),
        onHallPick: id => go(id),
        onStatuePick: id => ui.showScientist(id),
        onShuttlePick: () => { // 點太空梭：再飛一次（有旁白就從「出發」開始念）
          if (route.mode !== 'planet' || !launchDone || !scene.beginIntro()) return;
          document.body.classList.add('launching');
          const done = () => document.body.classList.remove('launching');
          const narr = loadLang() === 'zh' ? narrReady : null;
          if (!narr) { scene.playIntro(done); return; }
          let go = false;
          const fly = () => { if (!go) { go = true; scene.playIntro(done); } };
          narr.play('06', c => { if (c.role === 'launch') fly(); }).then(ok => { if (!ok) fly(); });
          setTimeout(fly, 1500);
        },
        onUnitPick: (hallId, unitId) => go(hallId + '/' + unitId),
        onExhibitPick: unitId => {
          if (route.mode !== 'hall') return;
          route.unit = unitId;
          ui.scrollToUnit(unitId, true);
          ui.setFocusUnit(unitId);
          replaceHash(route.hall, unitId);
        },
        onFocusChange: unitId => { // 在館內拖曳展品轉盤時
          if (route.mode !== 'hall') return;
          route.unit = unitId;
          ui.scrollToUnit(unitId, true);
          ui.setFocusUnit(unitId);
          replaceHash(route.hall, unitId);
        },
        onFrame: info => {
          if (info.plates) ui.setPlates(info.plates);
          if (info.focus) ui.placeFocusLabel(info.focus.x, info.focus.y, info.focus.show);
        },
        onContextLost: () => failTo2D('webglcontextlost'),
      },
    });
    scene.setSheetFraction(0);
    ui.reportSheet();
    apply(route, true);
    if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone) {
      let seen = false;
      try { seen = localStorage.getItem('galileo.iosHint') === '1'; localStorage.setItem('galileo.iosHint', '1'); } catch (e) { /* ignore */ }
      if (!seen) ui.notice(ui.strings().ios, 7000);
    }
    runLaunch();
  } catch (err) {
    console.warn('[galileo] 3D 無法使用，改用簡易模式：', err);
    failTo2D(String(err && err.message || err));
  }

  function failTo2D() {
    if (scene && scene.destroy) { try { scene.destroy(); } catch (e) { /* ignore */ } }
    scene = null;
    ui.setNo3D(true);
    apply(route, true);
    const box = document.createElement('span');
    box.append(ui.strings().no3d + ' ');
    const a = document.createElement('a');
    a.href = CONFIG.classicUrl;
    a.textContent = ui.strings().classicLink;
    box.appendChild(a);
    ui.notice(box, 9000);
    runLaunch();
  }

  // 提供給檢查腳本與除錯用
  window.__galileo = {
    version: VERSION,
    get route() { return route; },
    get has3D() { return !!scene; },
    data,
    get scene() { return scene; },
    get ui() { return ui; },
  };
}

main().catch(err => {
  console.error('[galileo] 啟動失敗', err);
  if (launch) launch.skip();
  document.body.classList.remove('launching');
  const n = document.getElementById('notice');
  if (n) {
    n.hidden = false;
    n.textContent = '載入失敗，請改用舊版清單。 ';
    const a = document.createElement('a');
    a.href = CONFIG.classicUrl;
    a.textContent = '舊版清單';
    n.appendChild(a);
  }
  document.body.classList.remove('booting');
});

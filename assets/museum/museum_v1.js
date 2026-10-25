// 伽利略星球入口：載入資料、建立畫面層、（可用時）建立 3D 場景、處理網址路由。
// 改版時請同步更新 index_museum.html、本檔與下面兩個 import 的 ?v= 版本字串。
import { createUI } from './ui.js?v=20261026i';

const VERSION = '20261026i';

const CONFIG = {
  // 舊版清單的位置。新首頁取代 index.html 之後，請改成 'index_classic.html'。
  classicUrl: 'index.html',
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

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(label + ' timeout')), ms)),
  ]);
}

async function main() {
  const res = await fetch(CONFIG.dataUrl + '?v=' + VERSION);
  if (!res.ok) throw new Error('lessons.json ' + res.status);
  const data = await res.json();

  let scene = null;
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
    const mod = await withTimeout(import('./scene.js?v=' + VERSION), 20000, 'scene import');
    scene = await mod.createScene({
      canvas,
      halls: data.halls,
      reducedMotion,
      quality: QUALITY,
      debugEl: DEBUG ? debugEl : null,
      handlers: {
        onInteract: () => document.body.classList.add('touched'),
        onHallPick: id => go(id),
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
  }

  // 提供給檢查腳本與除錯用
  window.__galileo = {
    version: VERSION,
    get route() { return route; },
    get has3D() { return !!scene; },
    data,
  };
}

main().catch(err => {
  console.error('[galileo] 啟動失敗', err);
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

// 伽利略星球的畫面層：館名牌、底部卡片、單元跳轉、搜尋、語言切換、提示。
// 不依賴 three.js；沒有 3D 時這一層就是完整的退路畫面。

const STR = {
  zh: {
    title: '伽利略星球',
    sub: 'Galileo Planet',
    hint3d: '拖曳轉動星球，點選一座館',
    hint2d: '點選一座館',
    hall: n => n + '館',
    lessons: n => n + ' 課',
    back: '回星球',
    classic: '舊版清單',
    search: '搜尋課程',
    searchPh: '輸入課名或關鍵字',
    noResult: '找不到相關課程',
    open: '進入 ›',
    star: '重點',
    collapse: '收合或展開課程卡片',
    prev: '上一張',
    next: '下一張',
    units: '單元',
    no3d: '這台裝置無法顯示 3D 星球，已改用簡易模式。',
    classicLink: '舊版清單',
    ios: '小提醒：按 Safari 的「分享」→「加入主畫面」，之後從主畫面打開會更像 App。',
  },
  en: {
    title: 'Galileo Planet',
    sub: '伽利略星球',
    hint3d: 'Drag to spin the planet, then tap a hall',
    hint2d: 'Tap a hall',
    hall: n => n + ' Hall',
    lessons: n => n + (n === 1 ? ' lesson' : ' lessons'),
    back: 'Back to planet',
    classic: 'Classic list',
    search: 'Search lessons',
    searchPh: 'Type a title or keyword',
    noResult: 'No matching lessons',
    open: 'Open ›',
    star: 'Key lesson',
    collapse: 'Collapse or expand the lesson cards',
    prev: 'Previous',
    next: 'Next',
    units: 'Units',
    no3d: '3D is not available on this device, so a simple mode is shown.',
    classicLink: 'Classic list',
    ios: 'Tip: tap Safari Share → Add to Home Screen for an app-like view.',
  },
};

const $ = id => document.getElementById(id);

export function createUI({ data, config, lang, handlers }) {
  const body = document.body;
  const app = $('app');
  const sheet = $('sheet');
  const cardsEl = $('cards');
  const chipsEl = $('chips');
  const plates = $('plates');
  const focusLabel = $('focusLabel');
  const searchPanel = $('searchPanel');
  const searchInput = $('searchInput');
  const searchResults = $('searchResults');
  const btnSearch = $('btnSearch');
  const btnBack = $('btnBack');
  const noticeEl = $('notice');

  const state = {
    lang,
    hall: null,        // 目前的館物件
    cards: [],         // [{el, unitId, lesson}]
    firstCard: {},     // unitId -> 卡片索引
    activeIndex: -1,
    lockUntil: 0,
    focusUnit: null,
    no3d: false,
  };

  const T = () => STR[state.lang];
  const pick = obj => obj[state.lang] || obj.zh;

  // ---------- 館名牌 ----------
  const plateEls = {};
  data.halls.forEach(h => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'plate is-hidden';
    b.dataset.hall = h.id;
    b.style.setProperty('--hall-color', h.color);
    b.innerHTML = '<span class="plate-name"></span><span class="plate-sub"></span>';
    b.addEventListener('click', () => handlers.onPickHall(h.id));
    plates.appendChild(b);
    plateEls[h.id] = b;
  });
  const hallCount = h => h.units.reduce((n, u) => n + u.lessons.length, 0);
  function renderPlates() {
    data.halls.forEach(h => {
      const b = plateEls[h.id];
      b.querySelector('.plate-name').textContent = T().hall(pick(h));
      b.querySelector('.plate-sub').textContent = pick(h.sub) + ' · ' + T().lessons(hallCount(h));
    });
  }

  // ---------- 卡片與單元跳轉 ----------
  function renderHall() {
    const h = state.hall;
    app.style.setProperty('--hall-color', h.color);
    document.documentElement.style.setProperty('--hall-color', h.color);
    $('sheetTitle').innerHTML = '';
    const t = document.createElement('span');
    t.textContent = T().hall(pick(h));
    const sm = document.createElement('small');
    sm.textContent = pick(h.sub) + ' · ' + T().lessons(hallCount(h));
    $('sheetTitle').append(t, sm);

    chipsEl.textContent = '';
    cardsEl.textContent = '';
    state.cards = [];
    state.firstCard = {};
    h.units.forEach(u => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.dataset.unit = u.id;
      chip.textContent = u.emoji + ' ' + pick(u);
      chip.addEventListener('click', () => {
        scrollToUnit(u.id, true);
        handlers.onUnitChange(u.id, 'chip');
      });
      chipsEl.appendChild(chip);

      u.lessons.forEach((l, i) => {
        const a = document.createElement('a');
        a.className = 'card';
        a.href = l.file;
        a.target = config.lessonTarget || '_blank';
        a.rel = 'noopener';
        a.dataset.unit = u.id;

        const art = document.createElement('span');
        art.className = 'card-art';
        if (l.cover) {
          const img = document.createElement('img');
          img.src = l.cover;
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          art.appendChild(img);
        } else {
          art.textContent = u.emoji;
        }
        if (l.star) {
          const s = document.createElement('span');
          s.className = 'star';
          s.textContent = '★';
          s.title = T().star;
          art.appendChild(s);
        }

        const bodyEl = document.createElement('span');
        bodyEl.className = 'card-body';
        const unit = document.createElement('span');
        unit.className = 'card-unit';
        unit.textContent = u.emoji + ' ' + pick(u);
        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = pick(l).title;
        const blurb = document.createElement('p');
        blurb.className = 'card-blurb';
        blurb.textContent = pick(l).blurb;
        const go = document.createElement('span');
        go.className = 'card-go';
        go.textContent = T().open;
        bodyEl.append(unit, title, blurb, go);

        a.append(art, bodyEl);
        cardsEl.appendChild(a);
        if (i === 0) state.firstCard[u.id] = state.cards.length;
        state.cards.push({ el: a, unitId: u.id, lesson: l });
      });
    });
    state.activeIndex = -1;
  }

  function setActive(index, notify) {
    if (index < 0 || index >= state.cards.length || index === state.activeIndex) return;
    const prevUnit = state.activeIndex >= 0 ? state.cards[state.activeIndex].unitId : null;
    if (state.activeIndex >= 0) state.cards[state.activeIndex].el.classList.remove('active');
    state.activeIndex = index;
    const c = state.cards[index];
    c.el.classList.add('active');
    chipsEl.querySelectorAll('.chip').forEach(ch => {
      const on = ch.dataset.unit === c.unitId;
      ch.classList.toggle('active', on);
      if (on && prevUnit !== c.unitId) {
        const left = ch.offsetLeft - (chipsEl.clientWidth - ch.offsetWidth) / 2;
        chipsEl.scrollTo({ left, behavior: 'smooth' });
      }
    });
    if (notify && prevUnit !== c.unitId) handlers.onUnitChange(c.unitId, 'scroll');
  }

  function computeActive() {
    if (!state.cards.length) return;
    const max = cardsEl.scrollWidth - cardsEl.clientWidth;
    if (cardsEl.scrollLeft >= max - 2) { setActive(state.cards.length - 1, true); return; }
    let best = 0, bestD = Infinity;
    state.cards.forEach((c, i) => {
      const d = Math.abs(c.el.offsetLeft - (cardsEl.scrollLeft + 16));
      if (d < bestD) { bestD = d; best = i; }
    });
    setActive(best, true);
  }

  let scrollTimer = 0;
  cardsEl.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (performance.now() < state.lockUntil) return;
      computeActive();
    }, 110);
  }, { passive: true });

  function scrollToIndex(index, smooth) {
    const c = state.cards[index];
    if (!c) return;
    state.lockUntil = performance.now() + (smooth ? 800 : 200);
    cardsEl.scrollTo({ left: Math.max(0, c.el.offsetLeft - 16), behavior: smooth ? 'smooth' : 'auto' });
    setActive(index, false);
  }
  function scrollToUnit(unitId, smooth) {
    const i = state.firstCard[unitId];
    if (i !== undefined) scrollToIndex(i, smooth);
  }
  function step(dir) {
    const next = Math.min(state.cards.length - 1, Math.max(0, state.activeIndex + dir));
    scrollToIndex(next, true);
    handlers.onUnitChange(state.cards[next].unitId, 'arrow');
  }
  $('cardPrev').addEventListener('click', () => step(-1));
  $('cardNext').addEventListener('click', () => step(1));
  cardsEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  // ---------- 收合 ----------
  const handle = $('sheetHandle');
  handle.addEventListener('click', () => {
    const collapsed = sheet.classList.toggle('collapsed');
    handle.setAttribute('aria-expanded', String(!collapsed));
  });
  function reportSheet() {
    const f = sheet.hidden ? 0 : Math.max(0, (window.innerHeight - sheet.getBoundingClientRect().top) / window.innerHeight);
    handlers.onSheetFraction && handlers.onSheetFraction(f);
  }
  if ('ResizeObserver' in window) new ResizeObserver(reportSheet).observe(sheet);
  sheet.addEventListener('transitionend', reportSheet);
  window.addEventListener('resize', reportSheet);

  // ---------- 搜尋 ----------
  const norm = s => String(s).toLowerCase();
  function haystack(u, l) {
    return norm([l.zh.title, l.zh.blurb, l.en.title, l.en.blurb, u.zh, u.en].join(' '));
  }
  function runSearch() {
    const q = norm(searchInput.value).trim();
    searchResults.textContent = '';
    if (!q || !state.hall) return;
    const terms = q.split(/\s+/);
    let n = 0;
    state.cards.forEach((c, i) => {
      if (n >= 40) return;
      const u = state.hall.units.find(x => x.id === c.unitId);
      const hay = haystack(u, c.lesson);
      if (!terms.every(t => hay.includes(t))) return;
      n++;
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      const t = document.createElement('span');
      t.className = 'r-title';
      t.textContent = pick(c.lesson).title;
      const un = document.createElement('span');
      un.className = 'r-unit';
      un.textContent = u.emoji + ' ' + pick(u);
      b.append(t, un);
      b.addEventListener('click', () => {
        closeSearch();
        scrollToIndex(i, true);
        handlers.onUnitChange(c.unitId, 'search');
        sheet.classList.remove('collapsed');
        handle.setAttribute('aria-expanded', 'true');
      });
      li.appendChild(b);
      searchResults.appendChild(li);
    });
    if (!n) {
      const li = document.createElement('li');
      li.className = 'none';
      li.textContent = T().noResult;
      searchResults.appendChild(li);
    }
  }
  function openSearch() {
    searchPanel.hidden = false;
    btnSearch.setAttribute('aria-expanded', 'true');
    searchInput.focus();
    runSearch();
  }
  function closeSearch() {
    searchPanel.hidden = true;
    btnSearch.setAttribute('aria-expanded', 'false');
    searchInput.blur();
  }
  btnSearch.addEventListener('click', () => (searchPanel.hidden ? openSearch() : closeSearch()));
  let composing = false;
  searchInput.addEventListener('compositionstart', () => { composing = true; });
  searchInput.addEventListener('compositionend', () => { composing = false; runSearch(); });
  searchInput.addEventListener('input', () => { if (!composing) runSearch(); });
  searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });
  document.addEventListener('pointerdown', e => {
    if (searchPanel.hidden) return;
    if (searchPanel.contains(e.target) || btnSearch.contains(e.target)) return;
    closeSearch();
  });

  // ---------- 其他按鈕 ----------
  btnBack.addEventListener('click', () => handlers.onBack());
  $('linkClassic').href = config.classicUrl;
  document.querySelectorAll('#langSwitch button').forEach(b => {
    b.addEventListener('click', () => handlers.onLang(b.dataset.lang));
  });

  // ---------- 對外介面 ----------
  function applyStrings() {
    const s = T();
    document.documentElement.lang = state.lang === 'zh' ? 'zh-Hant' : 'en';
    document.title = state.lang === 'zh' ? '伽利略星球｜自然科學' : 'Galileo Planet | Natural Science';
    $('introTitle').textContent = s.title;
    $('introSub').textContent = s.sub;
    $('hint').textContent = state.no3d ? s.hint2d : s.hint3d;
    btnBack.setAttribute('aria-label', s.back);
    btnBack.title = s.back;
    btnSearch.setAttribute('aria-label', s.search);
    btnSearch.title = s.search;
    searchInput.placeholder = s.searchPh;
    searchInput.setAttribute('aria-label', s.search);
    $('linkClassic').title = s.classicLink;
    $('linkClassic').setAttribute('aria-label', s.classicLink);
    $('linkClassic').querySelector('.classic-text').textContent = s.classic;
    handle.setAttribute('aria-label', s.collapse);
    $('cardPrev').setAttribute('aria-label', s.prev);
    $('cardNext').setAttribute('aria-label', s.next);
    chipsEl.setAttribute('aria-label', s.units);
    document.querySelectorAll('#langSwitch button').forEach(b => {
      const on = b.dataset.lang === state.lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    renderPlates();
    if (state.focusUnit) setFocusUnit(state.focusUnit);
  }

  function setLang(next) {
    state.lang = next;
    const keep = state.activeIndex;
    applyStrings();
    if (state.hall) {
      renderHall();
      scrollToIndex(Math.max(0, keep), false);
      runSearch();
    }
  }

  function showPlanet() {
    state.hall = null;
    state.focusUnit = null;
    body.classList.remove('at-hall');
    sheet.hidden = true;
    focusLabel.hidden = true;
    btnBack.hidden = true;
    btnSearch.hidden = true;
    closeSearch();
    handlers.onSheetFraction && handlers.onSheetFraction(0);
  }

  function showHall(hallId, unitId) {
    const h = data.halls.find(x => x.id === hallId);
    if (!h) return false;
    state.hall = h;
    body.classList.add('at-hall');
    renderHall();
    sheet.hidden = false;
    sheet.classList.remove('collapsed');
    handle.setAttribute('aria-expanded', 'true');
    btnBack.hidden = false;
    btnSearch.hidden = false;
    const target = unitId && state.firstCard[unitId] !== undefined ? unitId : h.units[0].id;
    // 先讓版面算出來，再捲到該單元
    requestAnimationFrame(() => {
      scrollToUnit(target, false);
      reportSheet();
    });
    return target;
  }

  function setFocusUnit(unitId) {
    state.focusUnit = unitId;
    if (!state.hall) return;
    const u = state.hall.units.find(x => x.id === unitId);
    if (u) focusLabel.textContent = u.emoji + ' ' + pick(u);
  }
  function placeFocusLabel(x, y, show) {
    focusLabel.hidden = !show || !state.hall;
    if (!focusLabel.hidden) focusLabel.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0) translate(-50%,-100%)';
  }
  function setPlates(items) {
    items.forEach(it => {
      const el = plateEls[it.id];
      if (!el) return;
      el.classList.toggle('is-hidden', !it.show);
      el.style.transform = 'translate3d(' + Math.round(it.x) + 'px,' + Math.round(it.y) + 'px,0) translate(-50%,-115%)';
    });
  }
  function setNo3D(flag) {
    state.no3d = flag;
    body.classList.toggle('no-3d', flag);
    Object.values(plateEls).forEach(el => { el.style.transform = ''; el.classList.remove('is-hidden'); });
    applyStrings();
  }
  function notice(content, ms) {
    noticeEl.textContent = '';
    if (typeof content === 'string') noticeEl.textContent = content;
    else noticeEl.appendChild(content);
    noticeEl.hidden = false;
    if (ms) setTimeout(() => { noticeEl.hidden = true; }, ms);
  }
  function showPlates(show) {
    // 3D 還沒載入完成前先不顯示館名牌，避免位置跳動
    if (!state.no3d) Object.values(plateEls).forEach(el => el.classList.toggle('is-hidden', !show));
  }

  applyStrings();

  return {
    setLang, showPlanet, showHall, scrollToUnit, setFocusUnit, placeFocusLabel, setPlates, setNo3D,
    notice, showPlates, strings: () => T(), reportSheet,
    get lang() { return state.lang; },
    get hall() { return state.hall; },
  };
}

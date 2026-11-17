// 段考章節與上課進度總覽（外層模組；不更動開場動畫與 3D 星球核心）
// 依臺灣 108 課綱編排：分一上、一下、二上、二下、三上、三下共 6 學期，涵蓋全部 34 個單元。

const SEMESTERS = [
  {
    id: '7a',
    tabZh: '🌱 一上｜生物',
    tabEn: '🌱 7A · Biology',
    titleZh: '🌱 國一上學期｜生物（含恆定性）',
    titleEn: '🌱 Grade 7 Fall | Biology (incl. Homeostasis)',
    metaZh: '6 個單元・每次段考約 2 個單元（依各校進度彈性調整）',
    metaEn: '6 units · ~2 units per exam (adjusted by school)',
    units: [
      { id: 'biology-01' },
      { id: 'biology-02' },
      { id: 'biology-03' },
      { id: 'biology-04' },
      { id: 'biology-05' },
      { id: 'biology-06', noteZh: '上學期結尾', noteEn: 'Fall finale' },
    ],
  },
  {
    id: '7b',
    tabZh: '🌸 一下｜生物',
    tabEn: '🌸 7B · Biology',
    titleZh: '🌸 國一下學期｜生物（恆定性之後）',
    titleEn: '🌸 Grade 7 Spring | Biology (Post-Homeostasis)',
    metaZh: '5 個單元・每次段考約 2 個單元（依各校進度彈性調整）',
    metaEn: '5 units · ~2 units per exam (adjusted by school)',
    units: [
      { id: 'biology-07' },
      { id: 'biology-08' },
      { id: 'biology-09' },
      { id: 'biology-10' },
      { id: 'biology-11' },
    ],
  },
  {
    id: '8a',
    tabZh: '⚗️ 二上｜理化',
    tabEn: '⚗️ 8A · Phys & Chem',
    titleZh: '⚗️ 國二上學期｜理化（測量・物質・聲光熱・原子）',
    titleEn: '⚗️ Grade 8 Fall | Physics & Chemistry',
    metaZh: '6 個單元・每次段考約 2 個單元（依各校進度彈性調整）',
    metaEn: '6 units · ~2 units per exam (adjusted by school)',
    units: [
      { id: 'physics-01' },
      { id: 'chemistry-01' },
      { id: 'physics-02' },
      { id: 'physics-03' },
      { id: 'physics-04' },
      { id: 'chemistry-02' },
    ],
  },
  {
    id: '8b',
    tabZh: '🧪 二下｜理化',
    tabEn: '🧪 8B · Phys & Chem',
    titleZh: '🧪 國二下學期｜理化（化學反應・酸鹼・有機・力與壓力）',
    titleEn: '🧪 Grade 8 Spring | Physics & Chemistry',
    metaZh: '6 個單元・每次段考約 2 個單元（依各校進度彈性調整）',
    metaEn: '6 units · ~2 units per exam (adjusted by school)',
    units: [
      { id: 'chemistry-03' },
      { id: 'chemistry-04' },
      { id: 'chemistry-05' },
      { id: 'chemistry-06' },
      { id: 'chemistry-07' },
      { id: 'physics-05' },
    ],
  },
  {
    id: '9a',
    tabZh: '📐 三上｜理化與地科',
    tabEn: '📐 9A · Phys & Earth',
    titleZh: '📐 國三上學期｜理化與地科（運動・牛頓・功與能・電學・地質天文）',
    titleEn: '📐 Grade 9 Fall | Physics & Earth Science',
    metaZh: '7 個單元・依各校會考總複習時程彈性調整',
    metaEn: '7 units · Paced flexibly before CAP review',
    units: [
      { id: 'physics-06' },
      { id: 'physics-07' },
      { id: 'physics-08' },
      { id: 'physics-09' },
      { id: 'earth-01' },
      { id: 'earth-02' },
      { id: 'earth-03', noteZh: '部分版本在三下', noteEn: 'In 9B for some editions' },
    ],
  },
  {
    id: '9b',
    tabZh: '🌍 三下｜理化與地科',
    tabEn: '🌍 9B · Chem, Phys & Earth',
    titleZh: '🌍 國三下學期｜理化與地科（電化學・電與磁・天氣與氣候）',
    titleEn: '🌍 Grade 9 Spring | Chem, Physics & Earth Science',
    metaZh: '4 個單元・依各校會考總複習時程彈性調整',
    metaEn: '4 units · Paced flexibly before CAP review',
    units: [
      { id: 'chemistry-08' },
      { id: 'physics-10' },
      { id: 'earth-04' },
      { id: 'earth-05' },
    ],
  },
];

const COPY = {
  zh: {
    navTitle: '上課進度與段考章節',
    modalTitle: '🗓️ 段考章節與上課進度',
    modalSub: '依臺灣 108 課綱編排・分三個年級上下學期（各校依實際教學調整段考時程，每次段考約 2 個單元）',
    close: '關閉',
    lessonCount: n => n + ' 課',
    flyBtn: '🪐 飛往此單元',
  },
  en: {
    navTitle: 'Pacing Guide & Exam Chapters',
    modalTitle: '🗓️ Exam Chapters & Pacing Guide',
    modalSub: 'Taiwan 108 Curriculum across 6 semesters (~2 units per exam, adjusted by school)',
    close: 'Close',
    lessonCount: n => n + (n === 1 ? ' lesson' : ' lessons'),
    flyBtn: '🪐 Fly to unit',
  },
};

const VALID_SEMS = new Set(SEMESTERS.map(s => s.id));

export function createSchedule({ data, lang, onFlyToUnit, onOpenChange }) {
  const modal = document.getElementById('scheduleModal');
  const titleEl = document.getElementById('scheduleTitle');
  const subEl = document.getElementById('scheduleSub');
  const tabsEl = document.getElementById('scheduleTabs');
  const bodyEl = document.getElementById('scheduleBody');
  const closeBtn = document.getElementById('scheduleClose');
  const linkBtn = document.getElementById('linkSchedule');

  const unitMap = new Map();
  (data.halls || []).forEach(hall => {
    (hall.units || []).forEach(unit => {
      unitMap.set(unit.id, { hall, unit });
    });
  });

  const state = {
    lang: lang === 'en' ? 'en' : 'zh',
    sem: '7a',
    expanded: new Set(),
  };

  function T() {
    return COPY[state.lang];
  }

  function renderNav() {
    const t = T();
    if (linkBtn) {
      linkBtn.title = t.navTitle;
      linkBtn.setAttribute('aria-label', t.navTitle);
    }
  }

  function renderTabs() {
    if (!tabsEl) return;
    tabsEl.textContent = '';

    SEMESTERS.forEach(sem => {
      const b = document.createElement('button');
      b.type = 'button';
      const active = state.sem === sem.id;
      b.className = 'sch-tab' + (active ? ' active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(active));
      b.textContent = state.lang === 'en' ? sem.tabEn : sem.tabZh;
      b.addEventListener('click', () => {
        state.sem = sem.id;
        renderTabs();
        renderBody();
      });
      tabsEl.appendChild(b);
    });
  }

  function renderBody() {
    if (!bodyEl) return;
    const t = T();
    bodyEl.textContent = '';

    const sem = SEMESTERS.find(s => s.id === state.sem) || SEMESTERS[0];
    const semBlock = document.createElement('section');
    semBlock.className = 'sch-grade';

    const semHead = document.createElement('div');
    semHead.className = 'sch-grade-head';
    const h3 = document.createElement('h3');
    h3.textContent = state.lang === 'en' ? sem.titleEn : sem.titleZh;
    const meta = document.createElement('span');
    meta.className = 'sch-grade-meta';
    meta.textContent = state.lang === 'en' ? sem.metaEn : sem.metaZh;
    semHead.append(h3, meta);
    semBlock.appendChild(semHead);

    const list = document.createElement('ul');
    list.className = 'sch-unit-list';

    sem.units.forEach(item => {
      const resolved = unitMap.get(item.id);
      if (!resolved) return;
      const { hall, unit } = resolved;

      const li = document.createElement('li');
      const isOpen = state.expanded.has(unit.id);
      li.className = 'sch-unit' + (isOpen ? ' open' : '');
      li.style.setProperty('--hall-color', hall.color);

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'sch-unit-btn';
      trigger.setAttribute('aria-expanded', String(isOpen));

      const left = document.createElement('span');
      left.className = 'sch-unit-main';

      const badge = document.createElement('span');
      badge.className = 'sch-hall-tag';
      badge.textContent = hall[state.lang] || hall.zh;
      left.appendChild(badge);

      const name = document.createElement('span');
      name.className = 'sch-unit-name';
      name.textContent = `${unit.emoji} ${unit[state.lang] || unit.zh}`;
      left.appendChild(name);

      if (item.noteZh) {
        const note = document.createElement('span');
        note.className = 'sch-unit-note';
        note.textContent = '· ' + (state.lang === 'en' ? item.noteEn : item.noteZh);
        left.appendChild(note);
      }

      const right = document.createElement('span');
      right.className = 'sch-unit-right';
      right.innerHTML = `<span>${t.lessonCount(unit.lessons.length)}</span><span class="sch-caret" aria-hidden="true">▾</span>`;

      trigger.append(left, right);

      const detail = document.createElement('div');
      detail.className = 'sch-unit-detail';

      const lessonsWrap = document.createElement('div');
      lessonsWrap.className = 'sch-lessons';
      unit.lessons.forEach((l, idx) => {
        const a = document.createElement('a');
        a.className = 'sch-lesson-link';
        a.href = l.file;
        a.target = '_blank';
        a.rel = 'noopener';
        const lCopy = l[state.lang] || l.zh;
        a.textContent = `${idx + 1}. ${lCopy.title}`;
        lessonsWrap.appendChild(a);
      });
      detail.appendChild(lessonsWrap);

      const flyBtn = document.createElement('button');
      flyBtn.type = 'button';
      flyBtn.className = 'sch-fly-btn';
      flyBtn.textContent = t.flyBtn;
      flyBtn.addEventListener('click', () => {
        close();
        if (onFlyToUnit) onFlyToUnit(hall.id, unit.id);
      });
      detail.appendChild(flyBtn);

      trigger.addEventListener('click', () => {
        const nextOpen = li.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(nextOpen));
        if (nextOpen) state.expanded.add(unit.id);
        else state.expanded.delete(unit.id);
      });

      li.append(trigger, detail);
      list.appendChild(li);
    });

    semBlock.appendChild(list);
    bodyEl.appendChild(semBlock);
  }

  function renderAll() {
    const t = T();
    if (titleEl) titleEl.textContent = t.modalTitle;
    if (subEl) subEl.textContent = t.modalSub;
    if (closeBtn) closeBtn.setAttribute('aria-label', t.close);
    renderNav();
    renderTabs();
    renderBody();
  }

  function open(semKey) {
    if (!modal) return;
    if (semKey && VALID_SEMS.has(semKey)) state.sem = semKey;
    renderAll();
    modal.hidden = false;
    if (closeBtn) closeBtn.focus();
    if (onOpenChange) onOpenChange(true);
  }

  function close() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (onOpenChange) onOpenChange(false);
  }

  function setLang(nextLang) {
    state.lang = nextLang === 'en' ? 'en' : 'zh';
    renderAll();
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) close();
    });
  }
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && !modal.hidden) close();
  });

  if (linkBtn) {
    linkBtn.addEventListener('click', e => {
      e.preventDefault();
      open();
    });
  }

  renderAll();

  return {
    open,
    close,
    setLang,
    isOpen: () => Boolean(modal && !modal.hidden),
  };
}

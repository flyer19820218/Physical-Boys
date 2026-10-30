/* ==================================================================
   biology_intro｜老師講解／學生操作（2026-10-30）
   外層加法：不改頁面原有的任何程式；老師模式＝替老師點原本的按鈕。
     麵團怎麼膨起來？  自動示範：先看「改水」「改糖」為什麼不行，再改「酵母菌」並開始觀察
     生命靠什麼撐下去？ 依序點陽光、空氣、水、養分
     地球那麼大，生命住哪？ 鏡頭拉遠動畫自動從頭播；點鏡頭編號跳到那一段並接著播
     不會跑，也是活的？ 是問答題，老師模式不自動作答（留給同學討論）
   必須放在 BiosphereCinema.mount() 之後載入。
   ================================================================== */
(function (root) {
  'use strict';
  const doc = root.document, TM = root.TeachMode, tr = TM.tr;
  const $ = s => doc.querySelector(s);
  const click = s => { const n = $(s); if (n && !n.disabled) n.click(); };
  const tabOf = () => { const b = doc.querySelector('.tab-btn.active'); return b ? b.dataset.tab : ''; };
  const inlineBar = id => b => { b.classList.add('teach-inline'); const h = $('#' + id + ' h2'); (h || $('#' + id)).after(b); };

  /* ── 麵團怎麼膨起來？ ── */
  const method = TM.sequence({
    mount: inlineBar('method'),
    reset() { click('#resetExperiment'); },
    doneNote: ['✔ 示範完畢；按「從頭重播」可再看一次', '✔ Done. Press Replay to watch again'],
    steps: [
      { hold: 2,  note: ['💬 想一想：要知道酵母菌有沒有造成氣泡，該改變哪一個變因？', '💬 Which variable should we change to test yeast?'] },
      { hold: 7,  run: () => click('[data-choice="water"]'), note: ['先試試改變「水量」…', 'Try changing the amount of water first…'] },
      { hold: 7,  run: () => click('[data-choice="sugar"]'), note: ['再試試改變「糖量」…', 'Now try changing the amount of sugar…'] },
      { hold: 6,  run: () => click('[data-choice="yeast"]'), note: ['改成「有沒有酵母菌」，兩組只差這一項', 'Change only “yeast or no yeast”'] },
      { hold: 12, run: () => click('#runExperiment'), note: ['觀察氣球：哪一組膨脹？', 'Watch the balloons: which one inflates?'] }
    ]
  });

  /* ── 生命靠什麼撐下去？ ── */
  const needs = TM.sequence({
    mount: inlineBar('needs'),
    doneNote: ['✔ 四個要素都看過了；按「從頭重播」可再看一次', '✔ All four covered. Press Replay to watch again'],
    steps: [
      { hold: 9, run: () => click('[data-need="sun"]'), note: ['☀️ 陽光', '☀️ Sunlight'] },
      { hold: 9, run: () => click('[data-need="air"]'), note: ['💨 空氣', '💨 Air'] },
      { hold: 9, run: () => click('[data-need="water"]'), note: ['💧 水', '💧 Water'] },
      { hold: 9, run: () => click('[data-need="nutrients"]'), note: ['🍃 養分', '🍃 Nutrients'] }
    ]
  });

  /* ── 地球那麼大，生命住哪？（生物圈鏡頭拉遠動畫） ── */
  const cine = {
    get j() { return root.biosphereJourney; },
    mount(b) {
      b.classList.add('bc-teachbar');
      const j = this.j; if (!j) return;
      const shell = j.element, t = shell.querySelector('.bc-transport');
      (t || shell.querySelector('.bc-view')).after(b);
      /* 點鏡頭編號：原本的處理會「暫停＋跳過去」，老師模式接著從那裡繼續播 */
      shell.querySelectorAll('.bc-shot').forEach(btn => btn.addEventListener('click', () => { if (this.on) this.j.play(); }));
    },
    on: false,
    enter() { this.on = true; const j = this.j; if (!j) return; j.seek(0); j.play(); },
    exit() { this.on = false; const j = this.j; if (!j) return; j.pause(); j.seek(0); },
    tick() { /* 動畫自己有時間軸；這裡不需要做事 */ },
    restart() { this.enter(); },
    togglePause() { const j = this.j; if (!j) return; if (j.state.playing) j.pause(); else j.play(); },
    isPaused() { const s = this.j && this.j.state; return !!s && !s.playing && !this.done(); },
    done() { const s = this.j && this.j.state; return !!s && !s.playing && s.time >= root.BiosphereCinema.DURATION - 0.05; },
    progress() { const s = this.j && this.j.state; return s ? Math.min(1, s.time / root.BiosphereCinema.DURATION) : 0; },
    note() {
      return this.done()
        ? tr('✔ 播完了：可以拖曳地球換角度；按「從頭重播」或點鏡頭編號回到任一段', '✔ Done: drag the Earth to look around; press Replay or tap a shot number to revisit')
        : '';
    }
  };

  TM.create({
    insertBefore: $('nav.tabs'),
    getTab: tabOf,
    tabButtons: Array.from(doc.querySelectorAll('.tab-btn')),
    drivers: { method, needs, biosphere: cine }
  });
})(window);

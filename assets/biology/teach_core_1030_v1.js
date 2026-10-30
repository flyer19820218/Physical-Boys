/* ==================================================================
   老師講解／學生操作 雙模式｜共用核心（2026-10-30，AGENTS 10.7）
   外層加法：不改任何原有動畫、引擎、題庫；老師模式只是「替老師按那些按鈕」。
   用法（每課一支設定檔）：
     TeachMode.create({
       insertBefore: 元素,            // 模式列放在這個元素前面
       getTab: () => 目前分頁 id,
       tabButtons: [按鈕…],           // 點了就代表切分頁
       drivers: { 分頁id: driver, … } // 沒有動畫的分頁不用列
     });
   driver：{ mount(bar), enter(), tick(dt), exit(), progress(), note(), done(),
             togglePause?(), isPaused?(), restart?() }
   ================================================================== */
(function (root) {
  'use strict';
  const doc = root.document;
  const isEn = () => (doc.documentElement.lang || '').toLowerCase().startsWith('en');
  const tr = (zh, en) => (isEn() ? en : zh);
  const el = (tag, cls, html) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

  /* 依「步驟清單」做成 driver：每步先執行 run()，停 hold 秒再下一步；播完停在結論 */
  function sequence(opts) {
    let i = 0, t = 0, finished = false;
    const steps = opts.steps, total = steps.reduce((a, s) => a + s.hold, 0);
    const run = k => { try { steps[k].run && steps[k].run(); } catch (e) { /* 單步失敗不中斷講解 */ } };
    const d = {
      mount: opts.mount,
      enter() { try { opts.reset && opts.reset(); } catch (e) {} i = 0; t = 0; finished = false; run(0); },
      tick(dt) {
        if (finished) return;
        t += dt;
        if (t >= steps[i].hold) {
          t = 0; i++;
          if (i >= steps.length) { i = steps.length - 1; finished = true; t = steps[i].hold; return; }
          run(i);
        }
      },
      exit() { try { opts.reset && opts.reset(); } catch (e) {} finished = false; },
      progress() {
        if (finished) return 1;
        let done = 0; for (let k = 0; k < i; k++) done += steps[k].hold;
        return Math.min(1, (done + t) / total);
      },
      note() {
        if (finished) return opts.doneNote ? tr(...opts.doneNote) : '';
        const n = steps[i].note; return n ? tr(...n) : '';
      },
      done() { return finished; }
    };
    return d;
  }

  function create(cfg) {
    const S = { on: false, paused: false, raf: 0, last: 0, cur: null };
    const drivers = cfg.drivers || {};

    /* ── 模式列（長相與地科範本相同） ── */
    const bar = el('div', 'mode-bar');
    bar.id = 'modeBar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', '使用模式');
    bar.innerHTML =
      '<div class="mode-row">' +
      '<button class="mode-pill active" id="mode-student" type="button" aria-pressed="true" data-zh="✋ 學生操作" data-en="✋ Student: hands-on">✋ 學生操作</button>' +
      '<button class="mode-pill" id="mode-teacher" type="button" aria-pressed="false" data-zh="👩‍🏫 老師講解" data-en="👩‍🏫 Teacher: guided tour">👩‍🏫 老師講解</button>' +
      '</div>' +
      '<div class="mode-hint" data-zh="老師講解：按下去就自動從頭連續播放，可暫停、重播，也可以點步驟編號跳到那一步。學生操作：維持原本的互動。" data-en="Teacher: press it and everything plays through on its own; pause, replay, or tap a step number to jump. Student: the original hands-on activities.">老師講解：按下去就自動從頭連續播放，可暫停、重播，也可以點步驟編號跳到那一步。學生操作：維持原本的互動。</div>';
    cfg.insertBefore.parentNode.insertBefore(bar, cfg.insertBefore);
    const bStudent = bar.querySelector('#mode-student'), bTeacher = bar.querySelector('#mode-teacher');
    bStudent.addEventListener('click', () => setMode('student'));
    bTeacher.addEventListener('click', () => setMode('teacher'));

    /* ── 每個有動畫的分頁一條控制列 ── */
    Object.keys(drivers).forEach(id => {
      const d = drivers[id];
      const b = el('div', 'teach-bar');
      b.dataset.tab = id;
      b.innerHTML = '<button type="button" class="teach-btn" data-act="pause"></button><button type="button" class="teach-btn" data-act="replay"></button><div class="teach-track"><div class="teach-fill"></div></div><div class="teach-note" aria-live="polite"></div>';
      b.addEventListener('click', e => {
        const btn = e.target.closest('.teach-btn'); if (!btn || !S.on) return;
        if (btn.dataset.act === 'pause') {
          if (d.togglePause) d.togglePause(); else S.paused = !S.paused;
        } else { S.paused = false; (d.restart || d.enter).call(d); }
        paint(true);
      });
      d.bar = b; d.mount(b);
    });

    const active = () => drivers[cfg.getTab()] || null;
    const pausedOf = d => (d.isPaused ? d.isPaused() : S.paused);

    function paint(force) {
      const d = active(); if (!d || !d.bar) return;
      const live = !!d.done && d.done();
      const paused = pausedOf(d);
      const pct = Math.round(d.progress() * 100);
      const note = paused && !live ? tr('⏸ 已暫停', '⏸ Paused') : d.note();
      const pauseTxt = paused ? tr('▶ 繼續', '▶ Resume') : tr('⏸ 暫停', '⏸ Pause');
      const sig = [note, pct, pauseTxt, live, isEn()].join('|');
      if (!force && d.bar._sig === sig) return;
      d.bar._sig = sig;
      const pb = d.bar.querySelector('[data-act="pause"]'), rb = d.bar.querySelector('[data-act="replay"]');
      pb.textContent = pauseTxt; pb.disabled = live;
      rb.textContent = tr('↺ 從頭重播', '↺ Replay'); rb.classList.toggle('hot', live);
      d.bar.querySelector('.teach-fill').style.width = pct + '%';
      d.bar.querySelector('.teach-note').textContent = note;
    }

    function tick() {
      if (!S.on) return;
      S.raf = root.requestAnimationFrame(tick);
      const now = root.performance.now() / 1000, dt = Math.min(0.1, Math.max(0, now - (S.last || now))); S.last = now;
      const d = active();
      if (d !== S.cur) { switchTo(d); return; }
      if (d && !doc.hidden && !pausedOf(d)) d.tick(dt);
      paint(false);
    }
    function switchTo(d) {
      if (S.cur && S.cur.exit) S.cur.exit();
      S.cur = d; S.paused = false;
      if (d) d.enter();
      paint(true);
    }

    function setMode(m) {
      const teacher = m === 'teacher';
      if (teacher === S.on) return;
      bStudent.classList.toggle('active', !teacher); bStudent.setAttribute('aria-pressed', String(!teacher));
      bTeacher.classList.toggle('active', teacher); bTeacher.setAttribute('aria-pressed', String(teacher));
      doc.body.classList.toggle('mode-teacher', teacher);
      S.on = teacher;
      root.cancelAnimationFrame(S.raf);
      if (teacher) { S.last = 0; S.cur = null; switchTo(active()); S.raf = root.requestAnimationFrame(tick); }
      else { if (S.cur && S.cur.exit) S.cur.exit(); S.cur = null; S.paused = false; }   // 回到學生操作：還原成原本一進來的樣子
    }

    /* 切分頁：交給 tick 偵測（getTab 變了就換 driver）；點了分頁鈕後下一幀就會處理 */
    (cfg.tabButtons || []).forEach(b => b.addEventListener('click', () => { if (S.on) setTimeout(() => { if (S.on && active() !== S.cur) switchTo(active()); }, 60); }));

    return { setMode, state: S, drivers, paint, get on() { return S.on; } };
  }

  root.TeachMode = { create, sequence, tr, el };
})(window);

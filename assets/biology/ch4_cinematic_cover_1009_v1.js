/* Only mounts and dismisses the wordless cover; owns no lesson animation clock. */
(() => {
  'use strict';
  const framing = {
    structure: { x: '48%', y: '57%', dx: '.6%', dy: '-.8%', scale: '1.18' },
    plant: { x: '55%', y: '60%', dx: '-1.2%', dy: '-.8%', scale: '1.18' },
    human: { x: '41%', y: '50%', dx: '1.1%', dy: '.4%', scale: '1.16' },
    immune: { x: '56%', y: '53%', dx: '-.8%', dy: '-.4%', scale: '1.18' },
  };
  function mount(screen, spec, enterLesson) {
    if (!screen || screen.dataset.coverMounted) return;
    screen.dataset.coverMounted = 'true';
    screen.classList.add('living-cover');
    const shot = framing[spec.id] || framing.plant;
    for (const [name, value] of Object.entries({
      '--cover-focus-x': shot.x, '--cover-focus-y': shot.y,
      '--cover-drift-x': shot.dx, '--cover-drift-y': shot.dy,
      '--cover-end-scale': shot.scale,
    })) screen.style.setProperty(name, value);

    const root = document.documentElement;
    const main = document.querySelector('main.wrap');
    const oldAriaHidden = main && main.getAttribute('aria-hidden');
    const oldInert = main && main.inert;
    root.classList.add('has-living-cover');
    if (main) { main.inert = true; main.setAttribute('aria-hidden', 'true'); }

    let leaving = false, finished = false, timer;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      screen.removeEventListener('transitionend', transitionEnd);
      document.removeEventListener('keydown', escapeCover);
      root.classList.remove('has-living-cover');
      screen.hidden = true;
      screen.setAttribute('aria-hidden', 'true');
      screen.tabIndex = -1;
      if (main) {
        main.inert = oldInert;
        if (oldAriaHidden === null) main.removeAttribute('aria-hidden');
        else main.setAttribute('aria-hidden', oldAriaHidden);
      }
      screen.blur();
      enterLesson();
      const target = document.getElementById('title');
      if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    }
    function transitionEnd(event) {
      if (leaving && event.target === screen && event.propertyName === 'opacity') finish();
    }
    function dismiss() {
      if (leaving || finished) return;
      leaving = true;
      screen.classList.add('cover-leaving');
      if (reduced) finish();
      else timer = setTimeout(finish, 820); // Fallback when a WebKit transition is interrupted.
    }
    function escapeCover(event) {
      if (event.key === 'Escape' && !finished) { event.preventDefault(); dismiss(); }
    }
    screen.addEventListener('click', dismiss);
    screen.addEventListener('transitionend', transitionEnd);
    document.addEventListener('keydown', escapeCover);

    const picture = screen.querySelector('.cover-image');
    const ready = () => { if (!finished) screen.classList.add('cover-ready'); };
    const failed = () => {
      console.error('Living-book cover failed to load:', spec.cover);
      finish(); // Never trap students on an empty cover.
    };
    if (picture) {
      picture.addEventListener('load', ready, { once: true });
      picture.addEventListener('error', failed, { once: true });
      if (picture.complete) {
        if (picture.naturalWidth > 0) ready();
        else failed();
      }
    } else failed();
    if (!finished) screen.focus({ preventScroll: true });
  }
  window.LivingBookCover = { mount };
})();

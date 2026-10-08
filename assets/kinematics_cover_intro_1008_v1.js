/* Only dismisses the cover and translates its attribution. Does not start any lesson RAF. */
(() => {
  const intro = document.getElementById('introScreen');
  const credit = document.querySelector('[data-kinematics-cover-credit]');
  const root = document.documentElement;
  const language = () => {
    const english = root.lang === 'en' || document.getElementById('btn-lang-en')?.classList.contains('active');
    if (credit) credit.textContent = credit.dataset[english ? 'en' : 'zh'];
    if (intro) intro.setAttribute('aria-label', english ? 'AI concept cover. Tap to enter the lesson.' : 'AI 情境封面；點一下進入教材。');
  };
  document.querySelectorAll('#btn-lang-zh, #btn-lang-en').forEach(button => button.addEventListener('click', language));
  language();
  if (!intro) return;
  const picture = intro.querySelector('img');
  const previousFocus = document.activeElement;
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    root.classList.remove('kinematics-cover-open');
    intro.classList.add('cover-dismissed');
    intro.setAttribute('aria-hidden', 'true');
    intro.tabIndex = -1;
    if (previousFocus && previousFocus !== document.body && previousFocus.isConnected) previousFocus.focus({preventScroll:true});
    else intro.blur();
    setTimeout(() => intro.remove(), 420);
  };
  intro.addEventListener('click', dismiss);
  intro.addEventListener('keydown', event => {
    if (['Enter', ' ', 'Escape'].includes(event.key)) {
      event.preventDefault();
      dismiss();
    }
  });
  if (!picture) {dismiss();return;}
  picture.addEventListener('error', dismiss);
  if (picture.complete && picture.naturalWidth === 0) {dismiss();return;}
  root.classList.add('kinematics-cover-open');
  intro.focus({preventScroll:true});
})();

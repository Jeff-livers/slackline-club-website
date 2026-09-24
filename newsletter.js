(function () {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const success = document.getElementById('newsletter-success');
  const error = document.getElementById('newsletter-error');
  const button = form.querySelector('button[type="submit"]');
  const buttonDefaultText = button.textContent;
  const emailInput = document.getElementById('newsletter-email');

  // iOS/Android overlay the keyboard on top of the viewport instead of resizing
  // it, and the hero is an overflow:hidden 100dvh panel, so a focused field near
  // the bottom just gets covered. Measure the covered strip and hand it to CSS.
  const vv = window.visualViewport;
  if (vv && emailInput) {
    const root = document.documentElement;

    const syncKeyboardInset = () => {
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty('--kb-inset', covered + 'px');
      root.classList.toggle('keyboard-open', covered > 100);
      if (covered > 100) window.scrollTo(0, 0);
    };

    const clearKeyboardInset = () => {
      root.style.setProperty('--kb-inset', '0px');
      root.classList.remove('keyboard-open');
    };

    emailInput.addEventListener('focus', () => {
      // The keyboard animates in, so the first measurement lands after a beat.
      setTimeout(syncKeyboardInset, 100);
      setTimeout(syncKeyboardInset, 400);
    });
    emailInput.addEventListener('blur', clearKeyboardInset);
    vv.addEventListener('resize', () => {
      if (document.activeElement === emailInput) syncKeyboardInset();
      else clearKeyboardInset();
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.disabled = true;
    button.textContent = 'Sending…';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        form.hidden = true;
        success.hidden = false;
        success.focus();
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      error.textContent = "Something went wrong — try again";
      error.hidden = false;
      button.disabled = false;
      button.textContent = buttonDefaultText;
      emailInput.focus();
    }
  });
})();

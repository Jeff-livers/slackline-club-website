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
  // the bottom just gets covered. Rather than fight Safari's own scrolling, pin
  // the hero content to the visual viewport and follow it while the keyboard is up.
  const vv = window.visualViewport;
  if (vv && emailInput) {
    const root = document.documentElement;
    let tracking = false;
    let frame = 0;

    const apply = () => {
      frame = 0;
      // Keyboard height is the layout/visual viewport gap. offsetTop is *not*
      // part of it -- that's how far Safari has scrolled the visual viewport,
      // which we mirror below rather than subtract.
      const keyboard = window.innerHeight - vv.height;
      root.style.setProperty('--vv-height', vv.height + 'px');
      root.style.setProperty('--vv-top', vv.offsetTop + 'px');
      root.classList.toggle('keyboard-open', tracking && keyboard > 100);
    };

    // vv scroll/resize fire rapidly while typing; coalesce onto a frame.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const stop = () => {
      tracking = false;
      root.classList.remove('keyboard-open');
    };

    emailInput.addEventListener('focus', () => {
      tracking = true;
      // The keyboard animates in, so the first measurement lands after a beat.
      schedule();
      setTimeout(schedule, 150);
      setTimeout(schedule, 400);
    });
    emailInput.addEventListener('blur', stop);
    // 'scroll' matters as much as 'resize': typing scrolls the visual viewport
    // without resizing it, which is what made this go stale mid-entry.
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
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

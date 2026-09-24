(function () {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const success = document.getElementById('newsletter-success');
  const error = document.getElementById('newsletter-error');
  const button = form.querySelector('button[type="submit"]');
  const buttonDefaultText = button.textContent;
  const emailInput = document.getElementById('newsletter-email');

  // The hero is a snap panel, and mandatory snapping fights the browser's own
  // scroll-into-view when the keyboard covers the field. Release it while typing
  // and let the browser handle the rest.
  if (emailInput) {
    emailInput.addEventListener('focus', () => {
      document.documentElement.classList.add('editing');
      setTimeout(() => emailInput.scrollIntoView({ block: 'center' }), 300);
    });
    emailInput.addEventListener('blur', () => {
      document.documentElement.classList.remove('editing');
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

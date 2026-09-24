(function () {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const success = document.getElementById('newsletter-success');
  const error = document.getElementById('newsletter-error');
  const button = form.querySelector('button[type="submit"]');
  const buttonDefaultText = button.textContent;
  const emailInput = document.getElementById('newsletter-email');

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

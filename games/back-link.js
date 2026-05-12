(() => {
  const backLinks = document.querySelectorAll('[data-back-link]');

  backLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (window.history.length <= 1) return;

      event.preventDefault();
      window.history.back();
    });
  });
})();

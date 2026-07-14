/**
 * Légende du dock — titre de section au survol / focus
 */
(function () {
  function initDock() {
    const dock = document.querySelector('.app-dock');
    const caption = document.getElementById('dockCaption');
    if (!dock || !caption) return;

    let hideTimer;

    const show = (item) => {
      clearTimeout(hideTimer);
      const text = item.getAttribute('aria-label');
      if (!text) return;
      caption.textContent = text;
      caption.classList.add('is-visible');
      caption.removeAttribute('aria-hidden');
    };

    const hide = () => {
      hideTimer = setTimeout(() => {
        caption.classList.remove('is-visible');
        caption.setAttribute('aria-hidden', 'true');
      }, 100);
    };

    dock.querySelectorAll('.app-dock-item').forEach((item) => {
      item.addEventListener('mouseenter', () => show(item));
      item.addEventListener('mouseleave', hide);
      item.addEventListener('focus', () => show(item));
      item.addEventListener('blur', hide);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDock);
  } else {
    initDock();
  }
})();

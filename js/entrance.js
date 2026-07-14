/**
 * Vircène — animation d'entrée après connexion
 */
(function (global) {
  const ENTRANCE_KEY = 'vircene_entrance';
  const WELCOME_KEY = 'vircene_welcome';

  function shouldPlay() {
    try {
      return sessionStorage.getItem(ENTRANCE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function consume() {
    try {
      sessionStorage.removeItem(ENTRANCE_KEY);
    } catch { /* ignore */ }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildOverlay(session) {
    const welcome = (() => {
      try {
        return sessionStorage.getItem(WELCOME_KEY) === '1';
      } catch {
        return false;
      }
    })();

    const name = (session && session.firstName) ? escapeHtml(session.firstName) : '';
    const greeting = welcome ? 'Bienvenue' : 'Bonjour';
    const title = name
      ? `${greeting}, <em>${name}</em>`
      : greeting;
    const subtitle = welcome
      ? 'Ton espace skincare est prêt.'
      : 'Content·e de te retrouver.';
    const slogan = 'Une routine. Pas une tendance.';

    const el = document.createElement('div');
    el.className = 'vir-entrance';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Connexion réussie');
    el.innerHTML = `
      <div class="vir-entrance-aura" aria-hidden="true">
        <div class="vir-entrance-glow vir-entrance-glow--1"></div>
        <div class="vir-entrance-glow vir-entrance-glow--2"></div>
        <div class="vir-entrance-grain"></div>
        <div class="vir-entrance-particles">
          <span class="vir-entrance-particle"></span>
          <span class="vir-entrance-particle"></span>
          <span class="vir-entrance-particle"></span>
          <span class="vir-entrance-particle"></span>
          <span class="vir-entrance-particle"></span>
          <span class="vir-entrance-particle"></span>
        </div>
      </div>
      <div class="vir-entrance-stage">
        <div class="vir-entrance-core">
          <span class="vir-entrance-pulse" aria-hidden="true"></span>
          <span class="vir-entrance-ring" aria-hidden="true"></span>
          <span class="vir-entrance-ring vir-entrance-ring--2" aria-hidden="true"></span>
          <div class="vir-entrance-orb">
            <span class="vir-entrance-orb-shine" aria-hidden="true"></span>
            <img src="assets/logo/vircene-monogram-gold.svg" width="80" height="60" alt="">
          </div>
        </div>
        <p class="vir-entrance-badge">
          <span class="vir-entrance-badge-dot" aria-hidden="true"></span>
          Connecté
        </p>
        <div class="vir-entrance-copy vir-entrance-copy--1">
          <p class="vir-entrance-kicker">Vircène</p>
          <h2 class="vir-entrance-title">${title}</h2>
        </div>
        <div class="vir-entrance-copy vir-entrance-copy--2">
          <p class="vir-entrance-sub">${subtitle}</p>
        </div>
        <div class="vir-entrance-copy vir-entrance-copy--3">
          <p class="vir-entrance-slogan">${slogan}</p>
        </div>
      </div>
      <p class="vir-entrance-hint">Touche pour continuer</p>
      <div class="vir-entrance-progress" aria-hidden="true"><span></span></div>
    `;
    return el;
  }

  function revealApp() {
    const root = document.documentElement;
    root.classList.remove('is-entrance-pending');
    root.classList.add('is-entrance-reveal');
    global.setTimeout(() => root.classList.remove('is-entrance-reveal'), 1000);
  }

  function play(session) {
    if (!shouldPlay()) return Promise.resolve();
    consume();

    const reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 1400 : 3600;
    const exitMs = reduced ? 320 : 680;
    const el = buildOverlay(session || {});
    document.body.appendChild(el);

    return new Promise((resolve) => {
      let finished = false;
      const startedAt = Date.now();

      const finish = () => {
        if (finished) return;
        finished = true;
        el.classList.add('is-exit');
        global.setTimeout(() => {
          el.remove();
          revealApp();
          resolve();
        }, exitMs);
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('is-active'));
      });

      const timer = global.setTimeout(finish, duration);

      el.addEventListener('click', () => {
        if (Date.now() - startedAt > 800) finish();
      });

      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
          event.preventDefault();
          if (Date.now() - startedAt > 400) finish();
        }
      });

      global.setTimeout(() => {
        el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }, 120);

      el.addEventListener('transitionend', () => {
        if (el.classList.contains('is-exit')) global.clearTimeout(timer);
      });
    });
  }

  global.VirceneEntrance = {
    shouldPlay,
    play
  };
})(window);

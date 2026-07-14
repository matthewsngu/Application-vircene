/**
 * Vircène — utilitaires site (cookies, newsletter, nav mobile, liens)
 */
(function (global) {
  const COOKIE_KEY = 'vircene_cookie_consent';
  const cfg = () => global.VIRCENE_CONFIG || {};

  function homeUrl() {
    const page = cfg().site?.homePage || 'index.html';
    return new URL(page, global.location.href).pathname.split('/').pop() || 'index.html';
  }

  function legalUrl(page) {
    return page;
  }

  function initCookieBanner() {
    if (global.localStorage.getItem(COOKIE_KEY)) return;

    const banner = document.createElement('div');
    banner.className = 'vc-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentement cookies');
    banner.innerHTML =
      '<p>Nous utilisons des cookies essentiels au fonctionnement du site et, avec ton accord, des cookies de mesure d\'audience. ' +
      '<a href="cookies.html">En savoir plus</a></p>' +
      '<div class="vc-cookie-actions">' +
      '<button type="button" class="vc-cookie-btn vc-cookie-btn--accept" data-cookie="accept">Tout accepter</button>' +
      '<button type="button" class="vc-cookie-btn vc-cookie-btn--prefs" data-cookie="essential">Essentiels uniquement</button>' +
      '</div>';

    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('is-visible'));

    banner.addEventListener('click', e => {
      const btn = e.target.closest('[data-cookie]');
      if (!btn) return;
      const choice = btn.getAttribute('data-cookie');
      global.localStorage.setItem(COOKIE_KEY, choice);
      banner.classList.remove('is-visible');
      setTimeout(() => banner.remove(), 500);
      if (choice === 'accept') initAnalytics();
    });
  }

  function initAnalytics() {
    const domain = cfg().analytics?.plausibleDomain;
    if (!domain) return;
    if (document.querySelector('script[data-plausible]')) return;
    const s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-plausible', '1');
    s.dataset.domain = domain;
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
  }

  function initNewsletterForms() {
    document.querySelectorAll('[data-newsletter-form]').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const btn = form.querySelector('button[type="submit"]');
        const email = input?.value?.trim();
        if (!email) return;

        const endpoint = cfg().newsletter?.endpoint;
        const original = btn?.textContent;

        try {
          if (endpoint) {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, source: 'vircene-landing' })
            });
            if (!res.ok) throw new Error('newsletter_failed');
          } else {
            const mail = cfg().newsletter?.fallbackMailto || cfg().site?.contactEmail;
            global.open('mailto:' + mail + '?subject=Inscription newsletter&body=' + encodeURIComponent(email), '_self');
          }
          if (btn) btn.textContent = 'Merci ✦';
          if (input) input.value = '';
        } catch {
          if (btn) btn.textContent = 'Réessaye';
          setTimeout(() => { if (btn && original) btn.textContent = original; }, 2500);
        }
      });
    });
  }

  function initMobileNav() {
    const navFloat = document.getElementById('navFloat');
    if (!navFloat) return;

    const inner = navFloat.querySelector('.nav-inner');
    const links = navFloat.querySelector('.nav-links');
    const navEnd = inner?.querySelector('.nav-end') || inner;
    if (!inner || !links || document.getElementById('navMenuBtn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-menu-btn';
    btn.id = 'navMenuBtn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'navMobilePanel');
    btn.setAttribute('aria-label', 'Ouvrir le menu');
    btn.innerHTML = '<span></span><span></span>';

    const panel = document.createElement('div');
    panel.className = 'nav-mobile-panel';
    panel.id = 'navMobilePanel';
    panel.hidden = true;

    function close() {
      btn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      document.body.classList.remove('nav-open');
    }

    function bindPanelLinks() {
      panel.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', close);
      });
    }

    function refreshMobileNav() {
      panel.innerHTML = links.outerHTML.replace('nav-links', 'nav-mobile-links');
      bindPanelLinks();
    }

    refreshMobileNav();
    navEnd.appendChild(btn);
    navFloat.querySelector('.nav-pill')?.appendChild(panel);

    btn.addEventListener('click', function () {
      refreshMobileNav();
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
      document.body.classList.toggle('nav-open', !open);
    });

    global.VirceneSite = global.VirceneSite || {};
    global.VirceneSite.refreshMobileNav = refreshMobileNav;
  }

  function fixHomeLinks() {
    const home = homeUrl();
    document.querySelectorAll('a[data-home-link]').forEach(a => {
      a.setAttribute('href', home);
    });
  }

  function boot() {
    fixHomeLinks();
    initCookieBanner();
    initNewsletterForms();
    initMobileNav();
    const consent = global.localStorage.getItem(COOKIE_KEY);
    if (consent === 'accept') initAnalytics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.VirceneSite = { homeUrl, legalUrl, initAnalytics };
})(window);

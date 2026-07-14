/* Injecte l'avatar de compte flottant + menu de navigation sur les pages qui l'incluent */
(function () {
  function readSession() {
    try {
      if (window.VirceneAuth && typeof VirceneAuth.readSession === 'function') {
        return VirceneAuth.readSession();
      }
    } catch (e) {}
    return null;
  }

  function devPremiumFromConfig(session) {
    if (!session?.email) return false;
    const dev = window.VIRCENE_CONFIG?.dev;
    if (!dev?.grantPremium) return false;
    const email = String(session.email).trim().toLowerCase();
    return (dev.premiumTestUsers || []).some(function (user) {
      return String(user.email || '').trim().toLowerCase() === email;
    });
  }

  function isPremium(session) {
    if (!session) return false;
    if (session.plan === 'premium') return true;
    if (devPremiumFromConfig(session)) return true;
    try {
      if (window.VirceneAuth?.isPremiumSession) {
        return window.VirceneAuth.isPremiumSession(session);
      }
      if (window.VircenePaywall && typeof VircenePaywall.isPremium === 'function') {
        return VircenePaywall.isPremium(session);
      }
    } catch (e) {}
    return false;
  }

  function resolveInitial(session) {
    try {
      if (session) {
        const base = (session.firstName || session.email || 'V').trim();
        if (base) return base.charAt(0).toUpperCase();
      }
    } catch (e) {}
    return 'V';
  }

  function buildMenuHtml(session) {
    const premium = isPremium(session);
    let html = '';
    if (premium) {
      html += '<a href="account.html">Gérer mon abonnement</a>';
    } else {
      html += '<a href="account.html">S\'abonner</a>';
    }
    html += '<button type="button" class="vc-account-menu-logout" data-action="logout">Déconnexion</button>';
    return html;
  }

  function syncLandingNav(session) {
    const loggedIn = Boolean(session);
    const premium = loggedIn && isPremium(session);
    const free = loggedIn && !premium;

    document.body.classList.toggle('is-logged-in', loggedIn);
    document.body.classList.toggle('is-premium-user', premium);
    document.body.classList.toggle('is-free-user', free);

    const navMount = document.getElementById('navAccountMount');
    if (navMount) navMount.hidden = !loggedIn;

    document.querySelectorAll('.nav-login-link').forEach(function (link) {
      link.hidden = loggedIn;
    });
    document.querySelectorAll('.nav-links__sep--login').forEach(function (sep) {
      sep.hidden = loggedIn;
    });

    document.querySelectorAll('.nav-subscribe-link').forEach(function (link) {
      if (premium) {
        link.hidden = true;
        return;
      }
      link.hidden = false;
      link.setAttribute('href', free ? 'account.html' : '#tarifs');
    });
  }

  function bindLogout(root) {
    root.querySelector('[data-action="logout"]')?.addEventListener('click', async function () {
      if (window.VirceneAuth?.logout) {
        await window.VirceneAuth.logout();
      }
      window.location.href = 'index.html';
    });
  }

  function getMountTarget() {
    const selector = document.body.getAttribute('data-account-badge-mount');
    if (selector) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    const navMount = document.querySelector('#navAccountMount');
    if (navMount) return navMount;
    return document.body;
  }

  function isNavMount(target) {
    return target?.id === 'navAccountMount' || target?.classList?.contains('nav-account-mount');
  }

  function revealNavMount() {
    const mount = document.getElementById('navAccountMount');
    if (mount) mount.hidden = false;
  }

  function getExistingBadge(mount) {
    if (mount?.querySelector) {
      const inMount = mount.querySelector('.vc-account-badge');
      if (inMount) return inMount;
    }
    return document.querySelector('.vc-account-badge');
  }

  function dedupeBadges(mount) {
    const badges = [...document.querySelectorAll('.vc-account-badge')];
    if (badges.length <= 1) return badges[0] || null;

    const preferred = mount?.querySelector?.('.vc-account-badge')
      || document.getElementById('navAccountMount')?.querySelector('.vc-account-badge')
      || document.getElementById('diorHeaderProfile')?.querySelector('.vc-account-badge')
      || badges[0];

    badges.forEach(function (badge) {
      if (badge !== preferred) badge.remove();
    });
    return preferred;
  }

  function updateAccountBadge(session) {
    const mount = getMountTarget();
    const badge = dedupeBadges(mount);
    if (!badge || !session) return;

    const premium = isPremium(session);
    badge.classList.toggle('vc-account-badge--free', !premium);
    badge.classList.toggle('vc-account-badge--nav', isNavMount(badge.parentElement));

    const avatar = badge.querySelector('.vc-account-avatar');
    if (avatar) {
      avatar.setAttribute('aria-label', premium ? 'Mon profil Premium' : 'Mon profil');
      const initial = avatar.querySelector('span');
      if (initial) initial.textContent = resolveInitial(session);
    }

    const menu = badge.querySelector('.vc-account-menu');
    if (menu) {
      menu.innerHTML = buildMenuHtml(session);
      bindLogout(badge);
    }
  }

  let initPromise;

  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async function () {
      let session = readSession();
      if (window.VirceneAuth?.resolveAuthOnLoad) {
        try {
          session = (await window.VirceneAuth.resolveAuthOnLoad()) || session;
        } catch (_) { /* ignore */ }
      }

      syncLandingNav(session);
      window.VirceneSite?.refreshMobileNav?.();

      if (!session) return;

      revealNavMount();
      const mount = getMountTarget();
      const existing = getExistingBadge(mount);
      if (existing) {
        updateAccountBadge(session);
        return;
      }

      const premium = isPremium(session);
      const badge = document.createElement('div');
      badge.className = 'vc-account-badge';
      if (!premium) {
        badge.classList.add('vc-account-badge--free');
      }
      if (isNavMount(mount)) {
        badge.classList.add('vc-account-badge--nav');
      }
      if (document.body.hasAttribute('data-account-badge-mount')) {
        badge.classList.add('vc-account-badge--header');
      }
      if (document.body.hasAttribute('data-account-badge-light')) {
        badge.classList.add('vc-account-badge--light');
      }

      const accountLabel = premium ? 'Mon profil Premium' : 'Mon profil';

      badge.innerHTML =
        '<a class="vc-account-avatar" href="profile.html" aria-label="' + accountLabel + '">' +
          '<span>' + resolveInitial(session) + '</span>' +
        '</a>' +
        '<nav class="vc-account-menu" aria-label="Navigation">' +
          buildMenuHtml(session) +
        '</nav>';

      bindLogout(badge);
      mount.appendChild(badge);
      dedupeBadges(mount);
    })();

    try {
      await initPromise;
    } finally {
      initPromise = null;
    }
  }

  async function refresh(sessionHint) {
    let session = sessionHint || readSession();
    if (window.VirceneAuth?.resolveAuthOnLoad) {
      try {
        session = (await window.VirceneAuth.resolveAuthOnLoad()) || session;
      } catch (_) { /* ignore */ }
    }
    session = window.VirceneAuth?.readSession?.() || session;
    syncLandingNav(session);
    window.VirceneSite?.refreshMobileNav?.();

    const mount = getMountTarget();
    dedupeBadges(mount);

    if (getExistingBadge(mount)) {
      updateAccountBadge(session);
      return session;
    }
    if (session) await init();
    return session;
  }

  let bootPromise;

  async function boot() {
    if (bootPromise) return bootPromise;
    bootPromise = (async function () {
      if (window.VirceneAuth?.resolveAuthOnLoad) {
        try {
          await window.VirceneAuth.resolveAuthOnLoad();
        } catch (_) { /* ignore */ }
      }
      await init();
    })();
    return bootPromise;
  }

  window.VirceneAccountBadge = { refresh: refresh, boot: boot };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('load', function () {
    refresh().catch(function () { /* ignore */ });
  });
})();

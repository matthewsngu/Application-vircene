/**
 * Landing — parcours compatibilité : compte → questionnaire → résultats (overlay).
 */
(function () {
  'use strict';

  const overlay = document.getElementById('landingDiagOverlay');
  const root = document.getElementById('diagRoot');
  const closeBtn = document.getElementById('landingDiagClose');
  const heroBtn = document.getElementById('heroCompatBtn');
  const REGISTER_URL = 'register.html?flow=compat';
  const LOGIN_URL = 'login.html?flow=compat';

  if (!overlay || !root || !window.VirceneDiagnostic) return;

  let isOpen = false;

  function readSession() {
    return window.VirceneAuth?.readSession?.() || null;
  }

  function setPageScrollLocked(locked) {
    document.body.classList.toggle('landing-diag-open', locked);
    const lenis = window.__virceneLenis;
    if (!lenis) return;
    if (locked) lenis.stop();
    else lenis.start();
  }

  function closeOverlay() {
    if (!isOpen) return;
    isOpen = false;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    setPageScrollLocked(false);
    root.innerHTML = '';
    overlay.scrollTop = 0;
  }

  function openOverlay() {
    if (isOpen) return;
    isOpen = true;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.scrollTop = 0;
    setPageScrollLocked(true);
    root.innerHTML = '';

    const session = readSession();

    window.VirceneDiagnostic.boot({
      skipIntro: true,
      hideFootNote: true,
      questionnaireOnly: true,
      productScanAfter: true,
      userId: session ? session.id : null,
      onExit: closeOverlay,
      onComplete: function (payload) {
        try {
          sessionStorage.setItem('vircene_landing_diag', JSON.stringify(payload));
          sessionStorage.removeItem('vircene_open_questionnaire');
        } catch (_) { /* ignore */ }
        if (session && window.VirceneDiagnostic.saveDiagnostic) {
          window.VirceneDiagnostic.saveDiagnostic(session.id, payload);
        }
        closeOverlay();
      }
    });
  }

  function startCompatFunnel() {
    if (readSession()) {
      openOverlay();
      return;
    }
    try {
      sessionStorage.setItem('vircene_compat_funnel', '1');
    } catch (_) { /* ignore */ }
    window.location.href = REGISTER_URL;
  }

  function shouldAutoOpenQuestionnaire() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('questionnaire') === '1') return true;
    try {
      return sessionStorage.getItem('vircene_open_questionnaire') === '1';
    } catch (_) {
      return false;
    }
  }

  function cleanQuestionnaireUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('questionnaire')) return;
    params.delete('questionnaire');
    const qs = params.toString();
    const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
    const next = path.split('/').pop() || 'index.html';
    window.history.replaceState({}, '', qs ? next + '?' + qs : next);
  }

  heroBtn?.addEventListener('click', function (e) {
    e.preventDefault();
    startCompatFunnel();
  });

  closeBtn?.addEventListener('click', closeOverlay);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeOverlay();
  });

  if (shouldAutoOpenQuestionnaire()) {
    cleanQuestionnaireUrl();
    function tryAutoOpen() {
      if (readSession()) {
        openOverlay();
      } else {
        try { sessionStorage.removeItem('vircene_open_questionnaire'); } catch (_) { /* ignore */ }
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryAutoOpen);
    } else {
      requestAnimationFrame(tryAutoOpen);
    }
  }
})();

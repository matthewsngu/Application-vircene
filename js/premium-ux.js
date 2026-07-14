/**
 * Vircène — Couche présentation premium (scroll, reveals, topbar glass)
 */
(function (global) {
  'use strict';

  const REVEAL =
    '.app-card,.routine-step,.product-card:not(.product-add),.peau-product,' +
    '.profile-field,.profile-upgrade,.ig-product-row,.compare-wrap,' +
    '.advisor-action,.advisor-orb-wrap,.advisor-greeting,.advisor-title,.advisor-sub,' +
    '.home-activity-card,.home-activity-day,' +
    '.skin-health-card,.skin-dashboard-card,.tracking-activity-card,.tracking-hero,.skin-overview-card,' +
    '.day-card,' +
    '.today-advice-card,.today-env-card,.today-score-card';

  let observer;

  function getObserver() {
    if (observer) return observer;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    return observer;
  }

  function bindReveal(root) {
    var scope = root || document;
    var obs = getObserver();
    var els = scope.querySelectorAll(REVEAL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        el.style.setProperty('--reveal-i', String(i % 8));
      }
      if (!el.classList.contains('is-visible')) {
        obs.observe(el);
      }
    }
  }

  function initTopbar() {
    var topbar = document.querySelector('.app-topbar');
    if (!topbar || topbar.dataset.scrollBound) return;
    topbar.dataset.scrollBound = '1';
    function onScroll() {
      topbar.classList.toggle('is-scrolled', window.scrollY > 18);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function watchAdvisorMessages() {
    var thread = document.getElementById('advisorThread');
    if (!thread || thread.dataset.revealWatch) return;
    thread.dataset.revealWatch = '1';
    var obs = getObserver();
    var addMsg = function (el) {
      if (!el || !el.classList || !el.classList.contains('advisor-msg')) return;
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal', 'reveal--msg');
      obs.observe(el);
    };
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) addMsg(node);
        });
      });
    }).observe(thread, { childList: true });
  }

  function init() {
    if (document.body.dataset.premiumUx) return;
    document.body.dataset.premiumUx = '1';
    initTopbar();
    bindReveal(document);
    watchAdvisorMessages();
    document.addEventListener('vircene:view-change', function () {
      var active = document.querySelector('.app-view.is-active');
      if (active) bindReveal(active);
    });
  }

  global.VircenePremiumUX = { init: init, refresh: bindReveal };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);

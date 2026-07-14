/**
 * Vircène — Stripe Payment Links
 */
(function (global) {
  const cfg = () => global.VIRCENE_CONFIG?.stripe || {};

  function isEnabled() {
    return Boolean(cfg().enabled && cfg().paymentLinks?.monthly);
  }

  function getPaymentLink(plan) {
    const links = cfg().paymentLinks || {};
    return links[plan] || links.monthly || '';
  }

  function checkoutUrl(plan, session) {
    const link = getPaymentLink(plan || 'monthly');
    if (!link) return 'account.html?upgrade=' + encodeURIComponent(plan || 'monthly');
    const url = new URL(link);
    if (session?.email) url.searchParams.set('prefilled_email', session.email);
    return url.toString();
  }

  function portalUrl() {
    return cfg().customerPortal || 'account.html';
  }

  function bindPremiumLinks() {
    document.querySelectorAll('[data-stripe-plan]').forEach(el => {
      el.addEventListener('click', e => {
        const plan = el.getAttribute('data-stripe-plan') || 'monthly';
        const session = global.VirceneAuth?.readSession?.();

        if (!session) {
          e.preventDefault();
          sessionStorage.setItem('vircene_checkout_plan', plan);
          global.location.href = 'register.html?plan=' + encodeURIComponent(plan);
          return;
        }

        const target = checkoutUrl(plan, session);
        if (el.tagName === 'A') {
          el.setAttribute('href', target);
        } else {
          e.preventDefault();
          global.location.href = target;
        }
      });
    });
  }

  global.VirceneStripe = {
    isEnabled,
    checkoutUrl,
    portalUrl,
    getPaymentLink,
    bindPremiumLinks
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindPremiumLinks);
  } else {
    bindPremiumLinks();
  }
})(window);

/**
 * Vircène — Paywall dur (Premium requis)
 */
(function (global) {
  const cfg = () => global.VIRCENE_CONFIG || {};

  function isPremium(session) {
    if (!session) return false;
    if (cfg().dev?.grantPremium) return true;
    return session.plan === 'premium';
  }

  function getCheckoutPlan(fallback) {
    const params = new URLSearchParams(global.location.search);
    return params.get('plan') || params.get('upgrade') || fallback || 'monthly';
  }

  function checkoutDestination(session, plan) {
    if (global.VirceneStripe?.checkoutUrl) {
      return global.VirceneStripe.checkoutUrl(plan || 'monthly', session);
    }
    return 'account.html?upgrade=' + encodeURIComponent(plan || 'monthly');
  }

  function redirectToCheckout(session, plan) {
    global.location.replace(checkoutDestination(session, plan));
  }

  function requirePremiumOrRedirect(session) {
    if (!session) {
      global.location.replace('login.html');
      return null;
    }
    if (!isPremium(session)) {
      redirectToCheckout(session, getCheckoutPlan('monthly'));
      return null;
    }
    return session;
  }

  global.VircenePaywall = {
    isPremium,
    getCheckoutPlan,
    checkoutDestination,
    redirectToCheckout,
    requirePremiumOrRedirect
  };
})(window);

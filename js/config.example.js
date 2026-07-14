window.VIRCENE_CONFIG = {
  supabase: {
    url: 'https://TON_PROJECT_REF.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  stripe: {
    enabled: false,
    monthlyPrice: 4.99,
    paymentLinks: {
      monthly: 'https://buy.stripe.com/test_...'
    },
    customerPortal: 'https://billing.stripe.com/p/login/...'
  },
  dev: {
    grantPremium: false
  }
};

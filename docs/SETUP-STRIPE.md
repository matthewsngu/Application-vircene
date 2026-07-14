# Configurer Stripe — Vircène

Prix unique : **4,99 €/mois**.

## 1. Produit Stripe

1. [Dashboard Stripe](https://dashboard.stripe.com) → mode **Test**
2. **Products** → **Add product**
   - Nom : Vircène Premium
   - Price : **4,99 EUR** / month (recurring)

## 2. Payment Link

1. **Payment Links** → **New**
2. Sélectionne le price 4,99 €/mois
3. Copie l'URL → `js/config.js` :

```js
stripe: {
  enabled: true,
  monthlyPrice: 4.99,
  paymentLinks: {
    monthly: 'https://buy.stripe.com/test_...'
  },
  customerPortal: 'https://billing.stripe.com/p/login/...'
}
```

## 3. Customer Portal

**Settings → Billing → Customer portal** → Enable → copie l'URL de login.

## 4. Webhook Netlify

1. Déploie sur Netlify (connecte le repo `vircene`)
2. **Developers → Webhooks → Add endpoint**
   - URL : `https://TON-SITE.netlify.app/.netlify/functions/stripe-webhook`
   - Events :
     - `checkout.session.completed`
     - `customer.subscription.deleted`
3. Copie le **Signing secret**

## 5. Variables Netlify

**Site settings → Environment variables** :

| Variable | Valeur |
|----------|--------|
| `STRIPE_SECRET_KEY` | sk_test_… ou sk_live_… |
| `STRIPE_WEBHOOK_SECRET` | whsec_… |
| `SUPABASE_URL` | https://xxx.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (Settings → API) |

## 6. Test paiement

Carte test : `4242 4242 4242 4242` · date future · CVC quelconque.

Parcours :

1. Inscription → redirect Payment Link
2. Paiement
3. Vérifier `profiles.plan = premium` dans Supabase
4. `account.html` → « Premium actif »

## 7. Dev sans Stripe

Dans `js/config.js` :

```js
dev: { grantPremium: true }
```

**Jamais en production.**

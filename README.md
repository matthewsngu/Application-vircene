# Vircène

SaaS skincare intelligent — projet v2.

## Prévisualiser

```bash
cd ~/Projects/vircene
python3 scripts/dev-server.py
# → http://localhost:3000
```

## Configuration

1. Copie `js/config.example.js` → `js/config.js`
2. [Supabase](docs/SETUP-SUPABASE.md) — auth + base de données
3. [Stripe](docs/SETUP-STRIPE.md) — abonnement 4,99 €/mois

## Structure

```
vircene/
├── index.html              Landing
├── login.html / register.html
├── account.html            Abonnement
├── js/auth.js              Supabase auth
├── js/stripe.js            Payment Links
├── js/paywall.js           Gating Premium
├── supabase/migrations/    Schéma profiles
└── netlify/functions/      Webhook Stripe
```

## Stack

- Front : HTML / CSS / JS statique
- Auth + DB : Supabase
- Paiement : Stripe Payment Links + webhook Netlify

## Docs

- [Identité](docs/BRAND.md)
- [Setup Supabase](docs/SETUP-SUPABASE.md)
- [Setup Stripe](docs/SETUP-STRIPE.md)
- [Hub projet](VIRCENE-PROJET.md)

# Vircène — Hub entrepreneurial

## Vision
- **Produit :** SaaS skincare intelligent (analyse peau, scan produits, compatibilité actifs, routine, suivi)
- **Positionnement :** L'alternative accessible au dermatologue
- **Modèle :** Paywall dur — Premium **4,99 €/mois**
- **Slogan :** Une routine. Pas une tendance.

## État actuel (v2)
- [x] Landing + design system
- [x] Auth Supabase (email, Google, reset password)
- [x] Stripe Payment Links + webhook Netlify
- [x] Page compte / abonnement
- [ ] App produit (scan, routine, suivi)
- [x] Pages légales (mentions, CGU, confidentialité, cookies)
- [ ] Déploiement prod

## Stack
| Couche | Choix |
|--------|-------|
| Front | HTML / CSS / JS |
| Auth + DB | Supabase |
| Paiement | Stripe (4,99 €/mois) |
| Hébergement | Netlify |

## Prochaines actions
1. Créer projet Supabase → `docs/SETUP-SUPABASE.md`
2. Coller clés dans `js/config.js`
3. Créer Payment Link Stripe 4,99 € → `docs/SETUP-STRIPE.md`
4. Déployer sur Netlify + variables d'environnement webhook

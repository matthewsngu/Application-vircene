# Configurer Supabase — Vircène

## 1. Créer le projet

1. [Dashboard Supabase](https://supabase.com/dashboard) → **New project**
2. Nom : `vircene` · Région : **Frankfurt (EU)**

## 2. Clés API

**Project Settings → API** → copier dans `js/config.js` :

```js
supabase: {
  url: 'https://XXXX.supabase.co',
  anonKey: 'eyJ...'
}
```

Copie `js/config.example.js` → `js/config.js` si ce n'est pas déjà fait.

## 3. Migration SQL

**SQL Editor** → coller le contenu de :

`supabase/migrations/20260614120000_profiles.sql`

→ **Run**

## 4. Google OAuth

1. **Authentication → Providers → Google** → Enable
2. Créer des credentials dans [Google Cloud Console](https://console.cloud.google.com/)
3. **Authentication → URL Configuration** :
   - Site URL : `http://localhost:3000`
   - Redirect URLs :
     - `http://localhost:3000/auth-callback.html`
     - `http://localhost:3000/**`

## 5. Email

**Authentication → Email** → activer la confirmation email (recommandé en prod).

## 6. Tester en local

```bash
cd ~/Projects/vircene
python3 scripts/dev-server.py
```

Ouvre `http://localhost:3000` → inscription / connexion / Google.

## 7. Prod

Ajoute aussi tes URLs prod dans Supabase :

- `https://ton-domaine.fr/auth-callback.html`
- `https://ton-domaine.fr/**`

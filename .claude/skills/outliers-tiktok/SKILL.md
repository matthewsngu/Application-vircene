---
name: outliers-tiktok
description: Machine à vues TikTok pour une influenceuse IA. Repère les vidéos "outliers" de la niche (celles qui font 3x+ la normale de leur compte), décortique pourquoi elles marchent, réécrit un script original dans la voix de l'influenceuse, produit la vidéo avec Higgsfield, prépare la publication TikTok puis suit les résultats et réécrit le hook si ça flop. Utiliser quand l'utilisateur dit "/outliers-tiktok", "trouve-moi des outliers", "nouvelle vidéo TikTok", "qu'est-ce qui marche dans ma niche", "check mes stats TikTok".
---

# /outliers-tiktok

Pipeline complet en 6 étapes. Dossier de travail : `tiktok-studio/` à la racine du repo.
Scripts : `.claude/skills/outliers-tiktok/scripts/`.

Parle en français, phrases courtes. À chaque étape, montre le résultat et attends le feu vert
avant de dépenser des crédits (Higgsfield, Apify) ou de publier.

## Règles de contenu (non négociables)

- **On s'inspire du format, jamais des images.** Une vidéo outlier sert à comprendre l'angle, le hook,
  la structure, le rythme. On ne télécharge pas la vidéo d'une autre personne pour la republier,
  et on ne colle pas le visage de l'influenceuse sur le corps ou la voix d'une vraie personne.
  Ça viole les droits du créateur, ça usurpe son image, et TikTok l'enterre ("contenu non original")
  ou bannit le compte. Si l'utilisateur le demande, explique-le en une phrase et propose la
  version originale générée (étape 4).
- **Script réécrit, pas copié.** Mêmes ressorts, mots différents, exemples différents.
- **Étiquette IA activée** à chaque publication (obligatoire sur TikTok pour un visage réaliste généré).
- Pas d'allégations santé/produit invérifiables (ex. "guérit l'acné").

## Étape 0 — Setup (premier lancement seulement)

Si `tiktok-studio/config.json` n'existe pas :
1. Copie `tiktok-studio/config.example.json` vers `config.json`.
2. Pose au maximum 3 questions groupées : niche + public ; ton et tics de langage de l'influenceuse ;
   5 à 15 comptes ou hashtags de la niche (si l'utilisateur n'en a pas, propose-en via WebSearch
   et fais-les valider).
3. Si l'influenceuse n'a pas encore de fiche personnage Higgsfield, propose de la créer
   (`ai_influencer_prepare` → `ai_influencer_generate`) et note le `job_id` dans
   `persona.higgsfield.characterSheetJobId`. Même chose pour la voix (`create_voice`) → `voiceId`.

## Étape 1 — Scan de la niche

**Mode Apify (recommandé, automatique).** Il faut une clé Apify (compte gratuit, ~5 $ de crédit offert/mois).
- En session cloud : si aucun appel à `api.apify.com` n'a encore marché, appelle
  `request_credential` (host `api.apify.com`, type bearer) pour que l'utilisateur colle sa clé
  dans le formulaire sécurisé. Ne jamais demander la clé dans le chat.
- Lance :
  ```bash
  node .claude/skills/outliers-tiktok/scripts/fetch-apify.mjs \
    --config tiktok-studio/config.json --out tiktok-studio/scans/$(date +%F).json
  ```

**Mode manuel (sans outil).** L'utilisateur colle des liens TikTok avec les vues et les abonnés
qu'il voit dans l'appli. Range-les dans `tiktok-studio/scans/<date>.csv` au format de
`manual-scan.example.csv` (`url,account,views,followers,caption`). "480k", "1,2M" sont acceptés.
Astuce à lui donner : sur un profil, les vues sont affichées sous chaque vignette ; repérer
celles qui dépassent largement les autres.

## Étape 2 — Détection des outliers

```bash
node .claude/skills/outliers-tiktok/scripts/outliers.mjs tiktok-studio/scans/<fichier> \
  --min-ratio 3 --min-views 20000 --top 10
```
Utilise les seuils de `config.thresholds`. Ratio = vues / médiane du compte (≥ 5 vidéos du compte),
sinon vues / abonnés. Présente le top sous forme de liste numérotée et demande lesquels creuser
(par défaut : les 3 premiers).

## Étape 3 — Décortiquer + réécrire

Pour chaque outlier choisi :
1. Analyse : si possible, `video_analysis_create` (Higgsfield) sur l'URL ; sinon lis la légende et
   demande à l'utilisateur de décrire les 3 premières secondes.
2. Remplis `tiktok-studio/scripts-video/<date>-<slug>.md` :
   ```markdown
   # <titre de travail>
   Source : <url> — <vues> (x<ratio>)
   ## Pourquoi ça a marché
   - Hook (0-2 s) : …
   - Promesse / tension : …
   - Structure : …
   - Format : face cam / liste / avant-après / POV / storytime … — durée …
   - Texte à l'écran, son, rythme des coupes : …
   ## Script v1 (voix de <persona>)
   HOOK (0-2 s) : … (≤ 12 mots, une question ou une affirmation qui choque)
   CORPS : … (phrases de 4-10 mots, une idée par plan)
   CTA : … (commentaire > follow : « Dis-moi en commentaire… »)
   Texte à l'écran : …
   Plans : 1. … 2. … 3. …
   Légende + 3-5 hashtags : …
   ```
3. Vise 20-40 s. Le hook doit être lisible sans le son. Montre le script et itère avec l'utilisateur.

## Étape 4 — Production (Higgsfield)

Charge les outils Higgsfield via ToolSearch (`+Higgsfield`) et suis leurs instructions
(`get_workflow_instructions` sans argument pour une vidéo multi-plans).
- Plans de l'influenceuse : génère des plans **originaux** à partir de sa fiche personnage
  (`characterSheetJobId`) : décor, cadrage et gestes décrits dans le script. Format 9:16.
- Voix : `generate_audio` avec `voiceId`, texte = script.
- Avant de lancer : affiche le devis de crédits et attends l'accord.
- Une fois monté : `virality_predictor` sur la vidéo. Si le hook est jugé faible, propose une v2 du
  hook avant publication.

## Étape 5 — Publication

1. `tiktok_accounts` (sinon `tiktok_connect`).
2. Son : propose 3 sons de `tiktok_music_trending` cohérents avec le ton ; `tiktok_music_tune` si besoin.
3. `tiktok_prepare_publish` avec légende, hashtags, **étiquette contenu IA activée**. Montre le
   récapitulatif, publie seulement après un « oui » explicite. Vérifie avec `tiktok_publish_status`.
4. Ajoute une ligne dans `tiktok-studio/journal.csv`.

## Étape 6 — Suivi et itération

À 24 h, 72 h et 7 j (propose `send_later` pour se le rappeler) :
1. Scanne le compte de l'influenceuse :
   `fetch-apify.mjs --profiles <handle> --per 30 --out tiktok-studio/scans/moi-<date>.json`
   (ou vues saisies à la main).
2. Compare la vidéo à la médiane du compte et complète `journal.csv`
   (verdict : `outlier` ≥ 3x, `ok` 1-3x, `flop` < 1x).
3. Si `flop` à 72 h : écris un **Script v2** dans le même fichier, en changeant d'abord le hook
   (puis le format si v2 floppe aussi), et relance l'étape 4.
4. Une fois par semaine : résume ce qui marche (hooks, formats, durées des vidéos `outlier` du
   journal) et mets à jour `persona` / les comptes surveillés dans `config.json`.

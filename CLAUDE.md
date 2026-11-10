# Notes pour Claude

## Vidéos « histoires » (dossiers `video-tiktok-*`)

- **Toutes les histoires sont en anglais**, pour le TikTok américain (décision de l'utilisateur).
- Format : vertical 1080×1920, 60 i/s, 61–65 s (au-dessus d'une minute pour le programme de rémunération TikTok).
- Texte important dans la zone sûre TikTok : écran x 60–940, y 230–1500.
- Style : vectoriel plat, tout dessiné en code (pas d'images générées). Partir du dernier projet `video-tiktok-*` comme modèle.
- Voix : Chatterbox en local (gratuit), clone de la démo « Julian » de la bibliothèque Higgsfield de l'utilisateur.
  Partir du `tools/voice.py` le plus récent : pas de découpe aux deux-points, marge de 60 ms aux attaques,
  et chaque essai est transcrit pour vérifier qu'aucun mot n'a été avalé. Vérifier la voix finale avec
  faster-whisper **sans** `vad_filter` (le filtre avale des mots et crée de fausses alertes).
- Chaque cut est ancré sur un mot du script avec son numéro d'occurrence ; `tools/render.py check` signale les ancres ambiguës.
- Faits : uniquement des faits vérifiables ; signaler ce qui vient de récits non prouvés.
- Se remettre en question en permanence (planches contact, transcription de la voix, scan des cuts) avant de livrer.
- Avant d'écrire les scènes, vérifier qu'aucune fonction locale ne porte le même nom qu'une fonction du kit commun (`cash`, `cheque`…).

## Skills vidéo installés (`.claude/skills/`) et leçons retenues

- Remotion (`remotion-*`), HyperFrames (`hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`,
  `style-sampling`, `reverse-any-video`, `remotion-to-hyperframes`, `slideshow`, `figma`), doctrines de mouvement
  (`motion-doctrine`, `cut-the-curve`, `seam-craft`, `captions-overlay`), `impeccable` (critique de design) et
  Chrome DevTools (`chrome-devtools*`, nécessite le serveur MCP). yt-dlp est installé dans le venv.
- Sous-titres (captions-overlay) : une ligne mot par mot en surimpression (« rail »), un seul mot-pic agrandi
  par temps fort (« embed », rare et espacé), sans réserver de bande vide ; sur TikTok, la placer au-dessus
  de la zone de légende (écran y ≈ 1300–1450).
- Mouvement (motion-doctrine) : une direction dominante pour les transitions, jamais d'aller-retour ;
  une pause de 0,3–0,75 s avant chaque révélation ; entrées ≤ 0,8 s ; pas d'easing bounce/elastic ;
  à tout instant quelque chose de significatif doit être en mouvement (révélation, caméra, compteur).

## Format qui marche (retours de l'utilisateur)
- Les **dilemmes « tu prends quoi ? »** (A ou B, calcul ou conséquence surprenante, question finale « Comment A or B ») font parler : continuer dans ce format (ex. « $1M now or a penny doubled »).
- Hook dès la 1re seconde, dilemme clair, fin sur une question qui divise.
- Qualité visuelle : moteur HQ (`video-tiktok-penny/film/engine-hq.js` : glTF animés, Poly Haven CC0, HDRI, post-traitement, typo fine Inter/Garamond). Personnages : chaque modèle garde ses propres animations (les clips d'un autre squelette tordent le corps) ; Michelle accepte les clips du Soldier sans la rotation des hanches.
- Rendu : ~3,6 s/image sans GPU ; le conteneur s'arrête quand la session est inactive → `tools/render_chunks.py` (morceaux de 120 images, reprise automatique) + surveillance active (Monitor). Fichiers > 100 Mo interdits sur GitHub : pousser une copie CRF 22.

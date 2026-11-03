# Notes pour Claude

## Vidéos « histoires » (dossiers `video-tiktok-*`)

- **Toutes les histoires sont en anglais**, pour le TikTok américain (décision de l'utilisateur).
- Format : vertical 1080×1920, 60 i/s, 61–65 s (au-dessus d'une minute pour le programme de rémunération TikTok).
- Texte important dans la zone sûre TikTok : écran x 60–940, y 230–1500.
- Style : vectoriel plat, tout dessiné en code (pas d'images générées). Partir du dernier projet `video-tiktok-*` comme modèle.
- Voix : Chatterbox en local (gratuit), clone de la démo « Julian » de la bibliothèque Higgsfield de l'utilisateur.
- Chaque cut est ancré sur un mot du script avec son numéro d'occurrence ; `tools/render.py check` signale les ancres ambiguës.
- Faits : uniquement des faits vérifiables ; signaler ce qui vient de récits non prouvés.
- Se remettre en question en permanence (planches contact, transcription de la voix, scan des cuts) avant de livrer.

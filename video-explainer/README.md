# « 11 jours sans dormir » — explainer 60 s

Film en canvas HTML : chaque image est une fonction pure du temps (`window.seek(t)`).
Les cuts sont rattachés à des **mots** du script (`T('mot', occurrence)`), pas à des secondes.

## État
- Minutage : **estimé** (190 mots/min, `timing/words.json`, source `estimate`). Pas de voix off pour l'instant.
- Décors et personnages : **provisoires, dessinés en code**. Les vraies images (prompts dans `prompts/PROMPTS.md`)
  se déposent dans `film/assets/plates/PLxx.png` ; elles remplacent automatiquement les décors provisoires.
- Son : SFX Mixkit calés sur leur pic + musique Mixkit (piste 565), mix normalisé à -14 LUFS.

## Commandes (Python du venv avec Playwright, librosa, OpenCV)
```
python tools/estimate_timing.py 61                 # minutage estimé depuis script.txt
python tools/render.py check                       # vérifie chaque cut / exporte events, shots, wipes
python tools/render.py contact preview/contact-1.png 16 0 30.5
python tools/render.py video out.mp4               # final : 60 i/s, 6 sous-images de flou, CRF 16
python tools/mix.py out.mp4 out-son.mp4 [--voice voix.wav]
python tools/scan_cuts.py out-son.mp4              # sauts imprévus / sauts d'une image
```
Avec une voix : remplacer `timing/words.json` par les timestamps faster-whisper (même format `{w, s, e}`).

# Prompts images — « 11 jours sans dormir »

Pack de prompts à coller dans ton générateur d'images.
**Joins les 4 images de référence** (`ref-1.png` à `ref-4.png`) à chaque génération : elles servent uniquement pour le **rendu** (matière pâte à modeler / jouet vinyle, lumière, profondeur de champ). Les personnages de la référence ne doivent **pas** être copiés : tous les personnages ci-dessous sont originaux.

## Réglages pour toutes les images

- Format **3840 × 2160** (16:9), ou la plus grande taille 16:9 disponible.
- Une image par prompt. Nomme chaque fichier avec son code (`PL01.png`, `C-RANDY-A.png`…).
- Colle toujours le **bloc STYLE** en tête du prompt, puis le prompt spécifique.

### Bloc STYLE (à coller en premier, à chaque fois)

```
Stylized 3D render in the exact rendering style of the reference images: soft clay / matte vinyl toy materials, rounded chunky shapes, gentle subsurface scattering, warm cinematic studio lighting with a soft rim light, subtle bounce light, shallow depth of field. Muted palette: dusty blue-grey, slate teal (blue-leaning), warm beige, navy, soft violet, with small warm amber accent lights. Characters have salmon-pink skin, oversized heads, small bodies, simple glossy black dot eyes, minimal features. Absolutely no text, letters, numbers, logos or symbols anywhere in the image.
```

---

## A. Plaques de décor (13) — VIDES

Ajoute ce bloc après le STYLE pour **chaque plaque** :

```
Empty set, no people, no characters, no animals. Straight-on frontal camera at eye level, symmetrical composition, wide 16:9 shot. Leave a large open, uncluttered floor area across the lower-middle of the frame where characters will be added later. Every sign, board, screen and paper is completely blank: a plain clean surface with no marks at all. Generous margin around the whole set so the camera can drift slightly.
```

| Code | Plan(s) | Prompt spécifique |
|---|---|---|
| PL01 | P1, P2, P23 | A cosy modern teenage bedroom at night. A bed on the left-centre seen from the side, a bedside table with a digital alarm clock whose display is blank and dark, a large cork board on the back wall with one big blank white card pinned in the middle, a window with deep blue night sky, warm lamp glow. |
| PL02 | P3, P4 | A night road seen from the side (profile view), asphalt strip along the bottom third, a tall road sign on a pole on the left with a blank white panel, a large lit roadside billboard on the right with a blank white surface, street lamps, distant city lights blurred. |
| PL03 | P6 | A small theatre stage with navy velvet curtains, a single strong spotlight making a bright empty circle on the wooden floor centre, a signboard on a pole to the right of the circle with a blank white panel. |
| PL04 | P7 | A 1960s Californian high school front, low beige stucco building, palm trees, double entrance doors open in the centre, a long blank sign panel above the entrance, wide sunny sidewalk in front, late December soft light. |
| PL05 | P8 | A 1963 high-school gymnasium set up for a science fair, wooden floor, poster tables along the sides, a large blank whiteboard hanging from ceiling chains in the centre. |
| PL06 | P9, P10, P11 | A 1960s family living room, a long sofa in the centre against the back wall, wood panelling, a standing lamp, three small blank white signboards on wooden stands placed in front: one left, one centre-right, one far right. |
| PL07 | P13, P22 | A 1960s classroom, a very large empty dark green-grey chalkboard filling the back wall (completely clean), a teacher's desk to one side, wooden student desks in the foreground edges. |
| PL08 | P14 | A 1960s sleep research lab, a big vintage EEG machine with a paper chart roll, a large rounded CRT monitor with a blank grey screen, one chair in front of the machine, cables, soft clinical light. |
| PL09 | P15 | A room dominated by a huge mechanical split-flap counter on the back wall like an old train station board, with 4 large blank flap windows, a long empty floor in front. |
| PL10 | P16 | A sunny 1964 San Diego street, sidewalk, palm trees, parked 1960s cars, a street name sign on a pole in the centre-right with a blank plate. |
| PL11 | P17 | A 1960s high-school American football field in daylight, bleachers in the back, a signboard on a post on the right with a blank white panel. |
| PL12 | P18, P19 | A 1960s kitchen, pastel cabinets, a table, a whiteboard on an easel in the centre-left, completely blank. |
| PL13 | P20, P21 | A 1960s teenage bedroom by day, a bed seen from the side in the centre, a round wall clock, a large blank cork board on the wall above the bed. |

> Les titres (P5, P12) et le wipe sont dessinés en code : pas d'image à générer.

---

## B. Feuilles de personnages (sur fond vert)

Ajoute ce bloc après le STYLE pour **chaque personnage** :

```
One single character, full body, centred, standing on a solid flat chroma-key green background (#00B140), evenly lit, no cast shadow, no floor, no other objects. Nothing green or yellow-green on the character (no green clothes, no green eyes, no green reflections). Clear gaps between legs and between body parts.
```

Pour les versions marquées **SANS BRAS**, ajoute aussi :

```
The character has NO ARMS and NO HANDS at all: just smooth, rounded shoulder sockets on each side of the torso, like a toy with the arms removed. Do not draw arms.
```

> Si ton modèle dessine quand même des bras, garde l'image : je les retire à la découpe et je redessine des bras en code. Ça prend juste un peu plus de temps.

### Personnages

**Toi** (le spectateur) — ado d'aujourd'hui, cheveux bruns en bataille, sweat à capuche bleu-gris ardoise, pantalon marine.

| Code | Pose |
|---|---|
| C-TOI-A | Assis, vu de profil (tourné vers la droite), jambes allongées devant lui comme dans un lit, tenant un téléphone à deux mains près du visage, air fatigué. |
| C-TOI-B | **SANS BRAS**, de face, debout, regard droit vers la caméra. |
| C-TOI-C | Assis vu de profil (vers la droite), mains sur un volant invisible, en train de bâiller (il sera placé dans la voiture). |

**Randy Gardner** (17 ans, 1963) — cheveux blonds courts coupés en brosse, pull col en V marine sur chemise beige, pantalon chino beige, chaussures marron.

| Code | Pose |
|---|---|
| C-RANDY-A | **SANS BRAS**, de face, debout, souriant, énergique. |
| C-RANDY-B | Vu de profil (vers la droite) **en train de marcher**, jambe gauche en avant, bras le long du corps. |
| C-RANDY-C | Allongé sur le dos, vu de profil, endormi, yeux fermés, comme posé sur un lit (sans le lit). |
| C-RANDY-D | **SANS BRAS**, de face, portant un casque de football américain bleu-gris, en position de joueur, genoux fléchis. |
| C-RANDY-E | **SANS BRAS**, assis sur une chaise invisible de face, électrodes et petits fils collés sur la tête, yeux grands ouverts, cernes. |
| C-RANDY-F | **SANS BRAS**, assis de face sur un canapé invisible, affalé, paupières lourdes. |

**Bruce** (ami, 17 ans) — lunettes rondes, cheveux châtains, pull violet doux, pantalon gris.

| Code | Pose |
|---|---|
| C-BRUCE-A | **SANS BRAS**, de face, debout. |
| C-BRUCE-B | **SANS BRAS**, vu de trois-quarts profil (tourné vers la gauche), surpris. |

**Joe** (ami, 17 ans) — cheveux noirs ondulés, veste bleu-gris poussiéreux, t-shirt blanc, jean marine.

| Code | Pose |
|---|---|
| C-JOE-A | **SANS BRAS**, de face, debout. |
| C-JOE-B | **SANS BRAS**, vu de trois-quarts profil (tourné vers la droite), surpris. |

**William Dement** (chercheur, ~35 ans) — blouse blanche de labo, chemise et cravate marine dessous, cheveux bruns coiffés en arrière, lunettes à monture noire.

| Code | Pose |
|---|---|
| C-DEMENT-A | **SANS BRAS**, de face, debout. |
| C-DEMENT-B | Vu de profil (vers la droite) **en train de marcher**, jambe droite en avant, bras le long du corps. |

**Élèves** (figurants, 1963)

| Code | Pose |
|---|---|
| C-ELEVE-1 | Lycéenne, jupe beige et gilet bleu-gris, cheveux bruns en queue de cheval, vue de profil (vers la gauche) en train de marcher. |
| C-ELEVE-2 | Lycéen, chemise blanche et pantalon marine, vu de profil (vers la gauche) en train de marcher, sac de livres en bandoulière. |

---

## C. Accessoires (sur fond vert, même bloc fond vert que les personnages)

| Code | Prompt spécifique |
|---|---|
| A-VOITURE | A small modern hatchback car in dusty blue-grey, seen exactly from the side (profile, facing right), driver window open and empty, no driver. |
| A-ROUE | One single car wheel of that same car, seen exactly from the side, perfectly circular. |
| A-SABLIER | A large empty hourglass with a wooden frame, front view, no sand inside. |
| A-ICONES | Four separate chunky 3D icons spaced apart in a row: an alarm clock, a pillow, a steering wheel, a wine glass. |

---

**Total : 13 plaques + 18 personnages + 4 accessoires = 35 images.**
Dépose-les ici une fois générées (en vrac, je trie grâce aux codes).

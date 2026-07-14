/**
 * Vircène — moteur de diagnostic routine (MVP règles + prompt système IA)
 */
(function (global) {
  'use strict';

  /** Prompt système — à brancher sur l'API IA en production */
  const DIAGNOSTIC_SYSTEM_PROMPT = `RÔLE
Tu es l'experte skincare de Vircène. Tu analyses la routine d'une utilisatrice et tu lui expliques, avec précision, pourquoi elle n'obtient pas le résultat qu'elle attend pour sa préoccupation.

TON
- Experte calme et raffinée. Chaleureuse, jamais familière, jamais alarmiste. Comme une esthéticienne haut de gamme.
- Phrases courtes et claires. Zéro jargon non expliqué.
- Tu rassures : un problème de routine se corrige, ce n'est pas grave.

CE QU'ON TE DONNE
- La préoccupation principale (ex : teint terne, imperfections…).
- La routine actuelle : produits du matin, produits du soir, dans l'ordre d'application, avec la fréquence.
- Si dispo : type de peau, sensibilités, objectif.

TA MISSION
Identifier LA raison principale (parfois une 2e secondaire) pour laquelle la routine ne donne pas le résultat attendu. Cherche en priorité, dans cet ordre :
1. Les conflits d'actifs (deux ingrédients qui ne doivent pas se superposer, ou qui s'annulent).
2. Les erreurs d'ordre d'application (un produit qui empêche un autre d'agir, ex : une texture trop riche posée sur un actif qui devait pénétrer).
3. La surcharge ou la fréquence (trop d'actifs forts, peau agressée, effet inverse).
4. Le manque d'une étape clé pour SA préoccupation précise (ex : pas de protection le matin alors qu'elle vise les taches).

RÈGLES IMPORTANTES
- Sois précise et concrète : nomme les produits/ingrédients EN CAUSE, pas de conseil générique type "utilisez moins de produits".
- Vise l'effet "ah, c'était donc ça" : privilégie l'explication que l'utilisatrice ne pouvait pas deviner seule.
- Explique le POURQUOI en une phrase simple (le mécanisme), pour qu'elle comprenne, pas seulement qu'elle obéisse.
- Ne diagnostique jamais de pathologie médicale. Si tu repères des signes qui dépassent la cosmétique (acné sévère, plaques, douleur), invite avec douceur à consulter un dermatologue.
- N'invente jamais une interaction si tu n'es pas sûre. En cas de doute, reste sur ce qui est établi.

FORMAT DE RÉPONSE (court, aéré, jamais un pavé)
1. UNE phrase qui reformule sa préoccupation avec bienveillance.
2. "Voici ce qui freine vos résultats :" + le diagnostic principal, en nommant le(s) produit(s) concerné(s) et le mécanisme en une phrase simple.
3. (Optionnel) un second point plus léger s'il existe.
4. "Ce qu'on ajuste :" la correction concrète — quoi changer dans l'ordre, la fréquence, ou quel type de produit remplacer.
5. Une phrase de clôture qui ouvre le suivi : rappeler qu'on vérifiera ensemble, en photo, si l'ajustement porte ses fruits.`;

  const INTENTION_LEADS = {
    nette: 'Voici ta routine pour révéler une peau plus nette.',
    lumineux: 'Voici ta routine pour révéler ton éclat.',
    apaisee: 'Voici ta routine pour apaiser et révéler ta peau.',
    selfcare: 'Voici ta routine, pensée pour révéler le meilleur de ta peau.'
  };

  function intentionLead(state) {
    return INTENTION_LEADS[state.intention] || null;
  }

  function hasIntention(state, ...ids) {
    return ids.includes(state.intention);
  }

  const CONCERN_META = {
    imperfections: {
      label: 'tes imperfections',
      short: 'Imperfections, boutons',
      missingHint: 'un nettoyage doux et une régularité suffisante'
    },
    sebum: {
      label: 'ton excès de sébum',
      short: 'Sébum, brillance',
      missingHint: 'un équilibre matifiant sans agresser la barrière cutanée'
    },
    teint: {
      label: 'ton manque d\'éclat',
      short: 'Teint terne',
      missingHint: 'une protection le matin et des actifs éclaircissants bien absorbés'
    },
    pores: {
      label: 'ton grain de peau',
      short: 'Pores, grain',
      missingHint: 'des actifs qui pénètrent vraiment, sans être neutralisés par une texture trop riche'
    },
    taches: {
      label: 'tes marques',
      short: 'Taches, marques',
      missingHint: 'une protection solaire quotidienne — sans elle, les taches reviennent'
    },
    rougeurs: {
      label: 'tes rougeurs',
      short: 'Peau réactive',
      missingHint: 'des soins apaisants et une routine allégée pour ne pas sur-solliciter'
    },
    secheresse: {
      label: 'tes tiraillements',
      short: 'Sécheresse',
      missingHint: 'un soin réparateur le soir, quand la peau se reconstruit'
    },
    ridules: {
      label: 'tes ridules',
      short: 'Ridules, fermeté',
      missingHint: 'des actifs ciblés appliqués dans le bon ordre, sans être bloqués par une texture trop riche'
    },
    cernes: {
      label: 'tes cernes',
      short: 'Cernes, poches',
      missingHint: 'des soins légers matin et soir, plus une protection solaire quotidienne'
    },
    maintenance: {
      label: 'l\'entretien de ta peau',
      short: 'Entretien quotidien',
      missingHint: 'une base simple et régulière : nettoyer, hydrater, protéger'
    },
    other: {
      label: 'ta préoccupation',
      short: 'Préoccupation personnelle',
      missingHint: 'une routine plus cohérente avec ce que tu attends'
    }
  };

  function concernIds(state) {
    if (state.concernIds && state.concernIds.length) return state.concernIds;
    if (state.concernId) return [state.concernId];
    return [];
  }

  function primaryConcernId(state) {
    if (state.maintenance || state.concernId === 'maintenance') return 'maintenance';
    const ids = concernIds(state);
    return ids[0] || state.concernId || 'other';
  }

  function hasConcern(state, ...ids) {
    const set = new Set(concernIds(state));
    if (state.maintenance || state.concernId === 'maintenance') return ids.includes('maintenance');
    return ids.some((id) => set.has(id));
  }

  function concernMeta(state) {
    if (state.maintenance || state.concernId === 'maintenance') {
      return CONCERN_META.maintenance;
    }
    if (state.concernId === 'other') {
      return {
        ...CONCERN_META.other,
        label: state.concernCustom ? `« ${state.concernCustom} »` : CONCERN_META.other.label
      };
    }
    const primary = primaryConcernId(state);
    if (state.concernIds && state.concernIds.length > 1) {
      const base = CONCERN_META[primary] || CONCERN_META.other;
      return {
        ...base,
        label: 'tes préoccupations peau'
      };
    }
    return CONCERN_META[primary] || CONCERN_META.other;
  }

  function noteBlob(state) {
    return [
      state.morningNote,
      state.eveningNote,
      state.favoriteProduct,
      state.concernCustom
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function hasActif(notes, patterns) {
    return patterns.some((p) => notes.includes(p));
  }

  function stepCount(ids) {
    return ids.filter((id) => id !== 'none').length;
  }

  function productPhrase(ids) {
    const map = {
      cleanser: 'nettoyant',
      serum: 'sérum',
      cream: 'crème',
      spf: 'protection solaire',
      micellar: 'démaquillant',
      toner: 'tonique',
      eyecream: 'contour des yeux',
      exfoliant: 'exfoliant',
      none: 'aucun produit pour l\'instant'
    };
    const labels = ids.map((id) => map[id]).filter(Boolean);
    if (!labels.length) return 'peu d\'étapes';
    return labels.join(', ');
  }

  function routinesMatch(morning, evening) {
    const am = (morning || []).filter((id) => id !== 'none').slice().sort().join('|');
    const pm = (evening || []).filter((id) => id !== 'none').slice().sort().join('|');
    return Boolean(am) && am === pm;
  }

  function combinedProductIds(morning, evening) {
    const seen = new Set();
    const out = [];
    [...(morning || []), ...(evening || [])].forEach((id) => {
      if (!id || id === 'none' || seen.has(id)) return;
      seen.add(id);
      out.push(id);
    });
    return out;
  }

  /**
   * Analyse locale (MVP) — même structure que la réponse IA attendue.
   * @returns {{ lead, primary, secondary?, adjust, outro }}
   */
  function buildDiagnostic(state) {
    const meta = concernMeta(state);
    const primaryId = primaryConcernId(state);
    const notes = noteBlob(state);
    const morning = state.morning || [];
    const evening = state.evening || [];
    const freq = state.frequency;

    const retinol = hasActif(notes, ['rétinol', 'retinol', 'retinal', 'retino']);
    const acids = hasActif(notes, ['aha', 'bha', 'acide', 'exfol', 'glycol', 'salicy', 'lactique', 'glicolique']);
    const vitC = hasActif(notes, ['vitamine c', 'vit c', 'ascorb', 'vit c']);
    const niacin = hasActif(notes, ['niacin', 'niacinamide']);

    const noSpfAm = !morning.includes('spf');
    const serumAm = morning.includes('serum');
    const serumPm = evening.includes('serum');
    const creamPm = evening.includes('cream');
    const creamAm = morning.includes('cream');
    const noneAm = morning.includes('none');
    const nonePm = evening.includes('none');
    const lowFreq = freq === 'rarely' || freq === 'sometimes';
    const daily = freq === 'daily';
    const richEvening = serumPm && creamPm;
    const loadedRoutine = stepCount(morning) + stepCount(evening) >= 5;
    const shortSleep = state.sleep === 'short';
    const lowHydration = state.hydration === 'rare';
    const highStress = state.stress === 'pressure';
    const reactiveSkin = hasConcern(state, 'rougeurs', 'secheresse')
      || state.skinType === 'sensible';
    const drySkin = state.skinType === 'seche';
    const oilySkin = state.skinType === 'grasse';

    const lead = intentionLead(state)
      || `Tu cherches à améliorer ${meta.label} — c'est un point de départ très clair.`;

    let primary = null;
    let secondary = null;
    let adjust = null;

    // Type de peau — peau sensible + actifs forts
    if (!primary && state.skinType === 'sensible' && (retinol || acids) && daily) {
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: 'Peau sensible et actifs puissants (exfoliant ou rétinoïde) appliqués souvent : la barrière s\'irrite avant que les actifs puissent faire leur effet — d\'où rougeurs ou inconfort.'
      };
      adjust = 'On espace les actifs forts, on privilégie des textures apaisantes et on réintroduit un seul actif à la fois, deux fois par semaine maximum.';
    } else if (!primary && drySkin && richEvening && hasConcern(state, 'teint', 'ridules', 'secheresse')) {
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: 'Peau sèche : une crème très riche le soir peut empêcher les actifs plus légers de pénétrer — tu nourris la surface, mais les actifs ciblés peinent à agir en profondeur.'
      };
      adjust = 'On laisse le sérum poser quelques minutes, puis on choisit une crème plus légère les soirs où tu utilises un actif ciblé.';
    } else if (!primary && oilySkin && creamPm && !serumPm && hasConcern(state, 'sebum', 'pores', 'imperfections')) {
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: 'Peau grasse avec une crème émolliente le soir sans actif ciblé : la texture peut enrichir le film superficiel et entretenir brillances et pores bouchés.'
      };
      adjust = 'On privilégie des textures gel ou fluide le soir, et on garde la crème plus riche pour les nuits sans actif exfoliant ou rétinoïde.';
    }

    // 0 — Mode de vie (stress + peau réactive / routine chargée)
    if (!primary && highStress && reactiveSkin && (retinol || acids || loadedRoutine)) {
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: 'Période chargée et peau réactive : empiler les actifs forts en ce moment peut irriter plus qu\'aider — ta peau a besoin de douceur avant d\'intensifier.'
      };
      adjust = 'On garde une routine simple et apaisante : nettoyant doux, hydratation légère, un seul actif ciblé si besoin — le reste peut attendre.';
    } else if (!primary && highStress && loadedRoutine && daily) {
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: 'Tu es sous pression en ce moment et ta routine reste assez chargée chaque jour. Dans ces périodes, simplifier aide souvent la peau à se stabiliser — moins d\'actifs, plus de constance sur l\'essentiel.'
      };
      adjust = 'On réduit à trois gestes : nettoyer, hydrater, protéger le matin — et on réintroduit le reste quand tu te sens plus sereine.';
    }

    // 1 — Conflits d'actifs (notes explicites uniquement)
    if (retinol && acids) {
      primary = {
        title: 'Voici ce qui freine vos résultats :',
        body: 'Vous combinez vraisemblablement un rétinoïde et un exfoliant acide. Les deux accélèrent le renouvellement de la peau : appliqués trop près l\'un de l\'autre, ils peuvent irriter et donner l\'impression que rien ne progresse — alors que la peau est sursollicitée.'
      };
      adjust = 'On espace les deux (exfoliant certains soirs, rétinoïde les autres), et on allège les soirs où les deux pourraient se croiser.';
    } else if (vitC && niacin && serumAm && daily) {
      primary = {
        title: 'Voici ce qui freine vos résultats :',
        body: 'Vous mentionnez vitamine C et niacinamide le matin. Ce n\'est pas un duo interdit — mais à forte concentration et tous les jours, certaines peaux réagissent par rougeurs ou tiraillements, ce qui masque l\'effet recherché.'
      };
      adjust = 'On alterne les matins (vitamine C un jour, niacinamide le lendemain) ou on baisse la fréquence, le temps de voir comment votre peau répond.';
    }

    // 2 — Ordre / texture
    if (!primary && richEvening && hasConcern(state, 'teint', 'pores', 'taches', 'ridules', 'imperfections', 'sebum')) {
      const sameRoutine = routinesMatch(morning, evening);
      const routineIds = sameRoutine ? combinedProductIds(morning, evening) : evening;
      const timing = sameRoutine ? 'Dans ta routine' : 'Le soir';
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: `${timing}, tu enchaînes ${productPhrase(routineIds)}. Si ta crème est riche ou occlusive, elle peut former un film qui empêche ton sérum — éclaircissant ou exfoliant — de pénétrer en profondeur. Résultat : tu appliques l'actif, mais une partie de son effet est neutralisée.`
      };
      adjust = 'On laisse le sérum poser quelques minutes, on réserve la crème la plus riche aux autres soirs, ou on choisit une texture plus légère les jours d\'actifs ciblés.';
    }

    // 3 — Surcharge / fréquence
    if (!primary && loadedRoutine && daily && hasConcern(state, 'imperfections', 'pores', 'sebum', 'rougeurs')) {
      primary = {
        title: 'Voici ce qui freine vos résultats :',
        body: 'Votre routine compte beaucoup d\'étapes, appliquées chaque jour. Sur une peau qui réagit déjà, cette charge peut irriter plus qu\'elle n\'améliore — d\'où la persistance des imperfections ou de la texture irrégulière.'
      };
      adjust = 'On simplifie : nettoyant, un seul actif ciblé, hydratation, protection le matin. On réintroduit les autres étapes une par une, toutes les deux ou trois semaines.';
    }

    // 4 — Étape manquante selon préoccupation (priorité intention)
    if (!primary && hasIntention(state, 'lumineux') && noSpfAm) {
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: 'Tu vises un teint plus lumineux, mais le matin je ne vois pas de protection solaire. Sans cette étape, l\'éclat peine à tenir — les marques et le teint terne se réactivent dès l\'exposition.'
      };
      adjust = 'On ajoute une protection légère chaque matin — c\'est souvent le geste qui change le plus les choses sur l\'éclat.';
    } else if (!primary && hasIntention(state, 'nette') && !morning.includes('cleanser') && !evening.includes('cleanser') && !noneAm) {
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: 'Tu vises une peau plus nette, mais je ne vois pas de nettoyant dans ta routine. Les résidus de sébum et de pollution peuvent encombrer les pores — et entretenir les imperfections malgré les soins appliqués ensuite.'
      };
      adjust = 'On ajoute un nettoyant doux matin et/ou soir, sans frotter : c\'est la base qui permet aux autres produits d\'agir.';
    } else if (!primary && hasIntention(state, 'apaisee') && loadedRoutine && daily) {
      primary = {
        title: 'Voici ce qui freine tes résultats :',
        body: 'Tu cherches une peau plus apaisée, mais ta routine reste assez chargée chaque jour. Trop d\'étapes peut irriter une peau réactive — l\'effet inverse de ce que tu attends.'
      };
      adjust = 'On simplifie : nettoyant doux, un seul soin ciblé, hydratation légère. On réintroduit le reste une étape à la fois.';
    } else if (!primary && hasConcern(state, 'taches', 'teint', 'cernes') && noSpfAm) {
      primary = {
        title: 'Voici ce qui freine vos résultats :',
        body: `Vous visez ${meta.label}, mais le matin je ne vois pas de protection solaire dans votre routine. Sans cette étape, les actifs éclaircissants peinent à tenir : les marques et le teint terne se réactivent dès l'exposition.`
      };
      adjust = 'On ajoute une protection légère chaque matin — c\'est souvent le geste qui change le plus les choses sur le long terme.';
    } else if (!primary && hasConcern(state, 'secheresse') && !creamPm && !nonePm) {
      primary = {
        title: 'Voici ce qui freine vos résultats :',
        body: 'Le soir, il manque un soin nourrissant ou réparateur. C\'est pourtant la fenêtre où la peau se reconstruit : sans crème ou baume adapté, les tiraillements reviennent, même avec un bon nettoyant.'
      };
      adjust = 'On termine le soir par une crème ou un baume légèrement plus riche, sur peau encore humide, au moins quatre soirs par semaine.';
    } else if (!primary && hasConcern(state, 'imperfections', 'sebum') && !morning.includes('cleanser') && !evening.includes('cleanser') && !noneAm) {
      primary = {
        title: 'Voici ce qui freine vos résultats :',
        body: 'Je ne vois pas de nettoyant dans votre routine actuelle. Les résidus de sébum, de maquillage ou de pollution peuvent encombrer les pores — et entretenir les imperfections malgré les soins appliqués ensuite.'
      };
      adjust = 'On ajoute un nettoyant doux matin et/ou soir, sans frotter : c\'est la base qui permet aux autres produits d\'agir.';
    }

    // Régularité
    if (!primary && lowFreq) {
      primary = {
        title: 'Voici ce qui freine vos résultats :',
        body: `Votre routine reste légère et peu régulière. Ce n'est pas un défaut — mais pour ${meta.label}, la constance compte autant que les produits : la peau a besoin de répétition pour répondre.`
      };
      adjust = 'On fixe un minimum réaliste — par exemple cinq jours sur sept — avec seulement trois gestes : nettoyer, traiter, hydrater.';
    }

    // Fallback par préoccupation
    if (!primary) {
      const fallbacks = {
        teint: {
          body: 'Le matin, si une crème épaisse précède ou suit un sérum éclaircissant, l\'actif peine à pénétrer. Le teint reste terne — non par manque de produits, mais par ordre ou texture mal adaptés.',
          fix: 'On applique le sérum sur peau propre, on attend une minute, puis une crème légère — et une protection chaque matin.'
        },
        imperfections: {
          body: 'Trop d\'actifs en même temps, ou appliqués trop souvent, peut irriter la peau et entretenir l\'inflammation — l\'effet inverse de ce que vous cherchez.',
          fix: 'On garde un seul actif ciblé par période (matin ou soir), on observe deux semaines, puis on ajuste.'
        },
        pores: {
          body: 'Sans exfoliation douce ou actif régulateur bien absorbé, la texture peine à s\'affiner — surtout si une crème riche vient ensuite limiter la pénétration.',
          fix: 'On introduit un actif texture (exfoliant doux ou niacinamide) le soir, avant une hydratation légère.'
        },
        taches: {
          body: 'Les soins ciblant les marques demandent de la constance et une protection quotidienne. Sans elle, la peau continue de marquer autant qu\'elle efface.',
          fix: 'Protection le matin, actif ciblé le soir — dans cet ordre, sans exception les jours de soleil.'
        },
        secheresse: {
          body: 'Les tiraillements viennent souvent d\'un manque d\'occlusion le soir : la peau perd son eau pendant la nuit, malgré un sérum hydratant seul.',
          fix: 'Sérum hydratant, puis crème ou baume plus riche — c\'est la combinaison qui tient l\'hydratation.'
        },
        sebum: {
          body: 'Sans nettoyant adapté ni régulation douce, le sébum s\'accumule en surface — la brillance revient vite, même avec des soins par ailleurs bien choisis.',
          fix: 'Nettoyant doux matin et soir, puis un actif régulateur léger quelques soirs par semaine — on observe avant d\'en ajouter.'
        },
        rougeurs: {
          body: 'Une routine trop chargée ou des actifs trop forts peut entretenir les rougeurs — la peau réagit avant de progresser.',
          fix: 'On simplifie, on espace les actifs puissants, et on privilégie des textures apaisantes le temps de stabiliser.'
        },
        ridules: {
          body: 'Les actifs fermeté demandent de pénétrer : une crème trop riche appliquée trop tôt peut limiter leur effet.',
          fix: 'Sérum ciblé sur peau propre, pause d\'une minute, puis hydratation légère — régularité avant intensité.'
        },
        cernes: {
          body: 'Sans protection le matin, le contour des yeux marque plus vite — les soins éclaircissants peinent à tenir.',
          fix: 'Protection quotidienne + soin contour le soir, appliqué du bout des doigts sans frotter.'
        },
        maintenance: {
          body: 'Ta routine actuelle semble encore incomplète pour entretenir la peau sereinement — souvent il manque une étape simple ou une cadence plus régulière.',
          fix: 'On fixe trois gestes : nettoyer, hydrater, protéger le matin — et on les tient cinq jours sur sept.'
        },
        other: {
          body: 'Ta routine actuelle ne semble pas encore alignée avec ce que tu attends — souvent à cause d\'un ordre, d\'une fréquence, ou d\'une étape clé absente.',
          fix: 'On reprend ensemble matin et soir, une étape à la fois, pour reconstruire une base cohérente.'
        }
      };
      const fb = fallbacks[primaryId] || fallbacks.other;
      primary = {
        title: 'Voici ce qui freine vos résultats :',
        body: fb.body
      };
      adjust = fb.fix;
    }

    // Second point léger
    if (shortSleep && !secondary) {
      secondary = 'Tu as peu dormi ces temps-ci — ce soir, privilégie une texture réconfortante plutôt qu\'un actif agressif.';
    } else if (lowHydration && !secondary) {
      secondary = 'Pense à t\'hydrater régulièrement — une peau bien hydratée de l\'intérieur répond mieux à ta routine.';
    } else if (creamAm && serumAm && !secondary) {
      secondary = 'Le matin, crème et sérum ensemble peuvent suffire — vérifiez que la crème n\'est pas appliquée avant le sérum actif.';
    } else if (daily && lowFreq === false && freq === 'often' && !secondary) {
      secondary = 'Vous êtes presque régulière : stabiliser à la même cadence aidera à mieux lire ce qui fonctionne.';
    }

    const outro = 'On refait le point dans deux semaines — photo à l\'appui — pour voir si l\'ajustement porte ses fruits.';

    return {
      lead,
      primary,
      secondary,
      adjust,
      outro,
      meta
    };
  }

  global.VirceneDiagnosticEngine = {
    DIAGNOSTIC_SYSTEM_PROMPT,
    buildDiagnostic,
    concernMeta,
    intentionLead
  };
})(window);

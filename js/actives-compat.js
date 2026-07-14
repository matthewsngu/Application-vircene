/**
 * Vircène — Moteur de compatibilité d'actifs skincare
 */
(function (global) {
  'use strict';

  const ACTIVES = [
    { id: 'retinol', label: 'Rétinol', hint: 'Soir' },
    { id: 'vitamine-c', label: 'Vitamine C', hint: 'Matin' },
    { id: 'niacinamide', label: 'Niacinamide', hint: 'Matin · soir' },
    { id: 'aha', label: 'AHA', hint: 'Soir' },
    { id: 'bha', label: 'BHA', hint: 'Soir' },
    { id: 'benzoyl', label: 'Peroxyde de benzoyle', hint: 'Ciblé' },
    { id: 'acide-azelaique', label: 'Acide azélaïque', hint: 'Matin · soir' },
    { id: 'peptides', label: 'Peptides', hint: 'Matin · soir' },
    { id: 'ceramides', label: 'Céramides', hint: 'Matin · soir' },
    { id: 'vitamine-e', label: 'Vitamine E', hint: 'Matin · soir' }
  ];

  const RULES = [
    {
      a: 'retinol', b: 'aha', status: 'avoid',
      title: 'Rétinol + AHA',
      summary: 'Deux actifs exfoliants le même soir sur-sollicitent la peau.',
      why: 'Le rétinol accélère le renouvellement cellulaire en profondeur. Les AHA (acides de fruits) dissolvent les cellules mortes en surface. Cumulés, ils multiplient l\'agression chimique sur la barrière cutanée.',
      onSkin: 'Rougeurs, desquamation, tiraillements, brûlures ou peau qui « brille » d\'inflammation.',
      tip: 'Alterne les soirs : rétinol un jour, AHA le lendemain — jamais dans la même routine.'
    },
    {
      a: 'retinol', b: 'bha', status: 'avoid',
      title: 'Rétinol + BHA',
      summary: 'Exfoliation profonde + renouvellement = barrière fragilisée.',
      why: 'Le BHA (acide salicylique) pénètre dans les pores et exfolie. Le rétinol stimule le turnover cellulaire. Ensemble, la peau n\'a pas le temps de se réparer entre deux agressions.',
      onSkin: 'Rougeurs persistantes, peau qui pèle, sensation de brûlure, réactivité accrue aux autres produits.',
      tip: 'BHA le matin (ou un soir sur deux), rétinol un autre soir — espace d\'au moins 24 h.'
    },
    {
      a: 'retinol', b: 'benzoyl', status: 'avoid',
      title: 'Rétinol + Peroxyde de benzoyle',
      summary: 'Le benzoyle dégrade le rétinol et irrite fortement.',
      why: 'Le peroxyde de benzoyle est un oxydant puissant : il tue les bactéries de l\'acné mais déstabilise aussi le rétinol (molécule fragile). Les deux ensemble perdent en efficacité et irritent.',
      onSkin: 'Sécheresse extrême, rougeurs, desquamation, parfois eczéma de contact sur les zones traitées.',
      tip: 'Benzoyle le matin sur zones ciblées, rétinol le soir — ou choisis l\'un selon ta priorité (acné vs anti-âge).'
    },
    {
      a: 'retinol', b: 'vitamine-c', status: 'caution',
      title: 'Rétinol + Vitamine C',
      summary: 'Pas interdit, mais à séparer matin et soir.',
      why: 'Le rétinol travaille la nuit (photosensible, instable à la lumière). La vitamine C protège le jour (antioxydant). Appliqués ensemble ou à la suite immédiate, certains actifs s\'annulent partiellement et les peaux sensibles réagissent.',
      onSkin: 'Picotements, rougeurs ou effet « chauffant » si les deux sont empilés sur une peau réactive.',
      tip: 'Vitamine C le matin + SPF, rétinol le soir — c\'est la combinaison la plus sûre et la plus efficace.'
    },
    {
      a: 'vitamine-c', b: 'niacinamide', status: 'caution',
      title: 'Vitamine C + Niacinamide',
      summary: 'Souvent compatibles, mais peuvent irriter à forte concentration.',
      why: 'L\'acide ascorbique fonctionne à pH acide (≈3–3,5) ; la niacinamide est stable vers pH neutre. Le mythe d\'une incompatibilité chimique totale est infondé, mais à 10–20 % chacun, l\'empilement peut provoquer un flush (rougeur passagère) chez certaines peaux.',
      onSkin: 'Rougeur soudaine, picotements ou sensation de chaleur — surtout si les deux séruns sont appliqués l\'un sur l\'autre sans pause.',
      tip: 'Teste d\'abord à faible dose, ou espace : vitamine C le matin, niacinamide le soir pendant 1–2 semaines.'
    },
    {
      a: 'vitamine-c', b: 'aha', status: 'caution',
      title: 'Vitamine C + AHA',
      summary: 'Double acidité = irritation et barrière fragilisée.',
      why: 'Vitamine C et AHA abaissent tous deux le pH cutané. Cumulés dans la même routine, ils dépassent ce que la barrière peut tolérer — surtout sans protection solaire ensuite.',
      onSkin: 'Tiraillements, rougeurs, peau qui brûle au toucher, sensibilité accrue au froid ou au vent.',
      tip: 'Vitamine C le matin avec SPF ; réserve l\'AHA au soir, jamais dans la même routine.'
    },
    {
      a: 'vitamine-c', b: 'bha', status: 'caution',
      title: 'Vitamine C + BHA',
      summary: 'pH acide cumulé — risque d\'irritation.',
      why: 'Les deux actifs nécessitent un environnement acide pour être efficaces. Appliqués ensemble, le pH trop bas peut irriter sans gain d\'efficacité supplémentaire.',
      onSkin: 'Rougeurs, sécheresse, pores qui « tirent », réactivité aux parfums ou alcool dans les autres produits.',
      tip: 'Vitamine C le matin, BHA le soir — laisse 12 h minimum entre les deux.'
    },
    {
      a: 'vitamine-c', b: 'benzoyl', status: 'avoid',
      title: 'Vitamine C + Peroxyde de benzoyle',
      summary: 'Le benzoyle oxyde la vitamine C — les deux s\'annulent.',
      why: 'Le peroxyde de benzoyle est un oxydant : il neutralise l\'acide ascorbique avant qu\'elle n\'agisse sur les radicaux libres et l\'éclat. Tu perds les bénéfices des deux actifs.',
      onSkin: 'Peu d\'effet visible sur taches/éclat, sécheresse locale sur les zones au benzoyle.',
      tip: 'Benzoyle le matin sur boutons ciblés ; vitamine C sur le reste du visage un autre moment (ou jour alterné).'
    },
    {
      a: 'aha', b: 'bha', status: 'caution',
      title: 'AHA + BHA',
      summary: 'Double exfoliation — efficace mais risqué.',
      why: 'AHA travaille la surface (texture, taches) ; BHA pénètre les pores (points noirs, acné). Ensemble, c\'est une exfoliation totale que seules les peaux très tolérantes supportent quotidiennement.',
      onSkin: 'Desquamation, rougeurs, barrière abîmée si la routine n\'est pas compensée par une hydratation riche.',
      tip: 'Alterne les soirs (AHA lundi, BHA mercredi) ou choisis l\'acide adapté à ton besoin principal.'
    },
    {
      a: 'benzoyl', b: 'aha', status: 'caution',
      title: 'Peroxyde de benzoyle + AHA',
      summary: 'Deux actifs agressifs — barrière en danger.',
      why: 'Le benzoyle libère de l\'oxygène actif (antibactérien) ; l\'AHA exfolie mécaniquement. Sur une peau déjà inflammée (acné), ce duo assèche et irrite sans accélérer la guérison.',
      onSkin: 'Peau qui pèle, zones blanches desséchées, sensation de tightness après rinçage.',
      tip: 'Applique le benzoyle uniquement sur les boutons ; garde l\'AHA pour le reste du visage, un soir sur deux.'
    },
    {
      a: 'benzoyl', b: 'bha', status: 'caution',
      title: 'Peroxyde de benzoyle + BHA',
      summary: 'Combo anti-acné classique, mais dessèche fortement.',
      why: 'Fréquent dans les traitements acné, ce duo attaque l\'acné par deux voies (antibactérien + exfoliant pore). Efficace à court terme, mais la barrière cutanée souffre si tu n\'hydrates pas suffisamment.',
      onSkin: 'Sécheresse marquée, desquamation autour des zones traitées, peau qui devient réactive au froid.',
      tip: 'Hydrate généreusement après (céramides, panthénol) et limite à 3–4 soirs par semaine au début.'
    },
    {
      a: 'retinol', b: 'acide-azelaique', status: 'caution',
      title: 'Rétinol + Acide azélaïque',
      summary: 'Duo puissant sur taches et texture — à introduire doucement.',
      why: 'Les deux agissent sur le renouvellement cellulaire et les hyperpigmentations. Efficaces ensemble, mais cumulent l\'effet « actif » sur une peau qui n\'est pas encore habituée.',
      onSkin: 'Picotements les premiers jours, rougeurs localisées, peau légèrement desquamée.',
      tip: 'Introduis l\'azélaïque 2–3 soirs/semaine d\'abord, puis monte progressivement. Crème apaisante par-dessus.'
    },
    {
      a: 'niacinamide', b: 'aha', status: 'ok',
      title: 'Niacinamide + AHA',
      summary: 'Bonne synergie — exfoliation + apaisement.',
      why: 'L\'AHA renouvelle la surface cutanée ; la niacinamide régule l\'inflammation et renforce la barrière. La niacinamide compense souvent l\'irritation liée aux acides.',
      onSkin: 'Texture plus lisse, pores affinés, moins de rougeurs qu\'avec un acide seul — si la barrière est hydratée.',
      tip: 'AHA d\'abord (sur peau sèche), attends 2–3 min, puis niacinamide — ou l\'inverse selon ta tolérance.'
    },
    {
      a: 'peptides', b: 'aha', status: 'caution',
      title: 'Peptides + AHA',
      summary: 'Le pH acide peut réduire l\'efficacité des peptides.',
      why: 'Les peptides sont des chaînes d\'acides aminés fragiles : un pH très acide (AHA) peut les dénaturer avant absorption. Tu risques de payer pour un actif qui n\'atteint pas ses cibles.',
      onSkin: 'Peu d\'irritation, mais effet anti-âge des peptides potentiellement réduit.',
      tip: 'Peptides le matin sur peau calme ; AHA le soir — jamais empilés dans la même routine.'
    },
    {
      a: 'ceramides', b: 'retinol', status: 'ok',
      title: 'Céramides + Rétinol',
      summary: 'Combo idéal — actif + réparation de barrière.',
      why: 'Le rétinol stimule le collagène et le renouvellement ; les céramides reconstituent le « ciment » lipidique de la barrière. C\'est la combinaison recommandée pour profiter du rétinol sans sécheresse.',
      onSkin: 'Moins de tiraillements qu\'avec le rétinol seul, peau plus confortable le lendemain.',
      tip: 'Sérum rétinol d\'abord, crème aux céramides par-dessus 2–3 min après — ou crème mixte si peau sensible.'
    },
    {
      a: 'ceramides', b: 'niacinamide', status: 'ok',
      title: 'Céramides + Niacinamide',
      summary: 'Synergie barrière + régulation — très bien tolérée.',
      why: 'La niacinamide stimule la production de céramides naturelles ; les céramides topiques renforcent la barrière. Les deux se complètent sans conflit de pH.',
      onSkin: 'Peau plus souple, moins de tiraillements, teint plus uniforme avec le temps.',
      tip: 'Niacinamide en sérum, crème céramides par-dessus — matin et soir sans restriction.'
    }
  ];

  const ACTIVE_MAP = Object.fromEntries(ACTIVES.map((a) => [a.id, a]));

  function pairKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function findRule(a, b) {
    const key = pairKey(a, b);
    return RULES.find((rule) => pairKey(rule.a, rule.b) === key) || null;
  }

  function defaultRule(a, b) {
    const left = ACTIVE_MAP[a]?.label || a;
    const right = ACTIVE_MAP[b]?.label || b;
    return {
      a, b,
      status: 'ok',
      title: `${left} + ${right}`,
      summary: 'Aucun conflit majeur connu entre ces actifs.',
      why: 'Ces actifs n\'interagissent pas de façon problématique quand ils sont espacés (matin/soir) ou utilisés à des concentrations modérées.',
      onSkin: 'Routine généralement bien tolérée — observe tout de même ta peau 48 h après introduction.',
      tip: 'Suis l\'ordre d\'application proposé et hydrate toujours après les actifs actifs.'
    };
  }

  function analyze(selectedIds) {
    const ids = [...new Set(selectedIds)].filter((id) => ACTIVE_MAP[id]);
    const pairs = [];

    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const rule = findRule(ids[i], ids[j]) || defaultRule(ids[i], ids[j]);
        pairs.push(rule);
      }
    }

    const order = { avoid: 0, caution: 1, ok: 2 };
    pairs.sort((x, y) => order[x.status] - order[y.status]);

    const hasAvoid = pairs.some((p) => p.status === 'avoid');
    const hasCaution = pairs.some((p) => p.status === 'caution');

    let summary = 'Tous les duos sélectionnés sont compatibles.';
    if (hasAvoid) summary = 'Au moins un duo est à éviter dans la même routine.';
    else if (hasCaution) summary = 'Certains duos demandent de l’attention ou un espacement.';

    return { ids, pairs, summary, hasAvoid, hasCaution };
  }

  global.VirceneActivesCompat = {
    ACTIVES,
    analyze,
    findRule
  };
})(typeof window !== 'undefined' ? window : global);

/**
 * Vircène — Analyse routine (scores compatibilité + peau)
 */
(function (global) {
  'use strict';

  const ACTIVE_TO_COMPAT = {
    vitc: 'vitamine-c',
    retinol: 'retinol',
    aha: 'aha',
    bha: 'bha',
    niacinamide: 'niacinamide',
    bpo: 'benzoyl',
    creme: 'ceramides',
    ha: null,
    spf: null
  };

  const ACTIVE_META = {
    vitc: { label: 'Vitamine C', timing: 'matin', hint: 'Antioxydant · éclat' },
    niacinamide: { label: 'Niacinamide', timing: 'matin-soir', hint: 'Sébum · pores · apaisant' },
    ha: { label: 'Acide hyaluronique', timing: 'matin-soir', hint: 'Hydratation en profondeur' },
    creme: { label: 'Hydratation / Céramides', timing: 'matin-soir', hint: 'Barrière cutanée' },
    spf: { label: 'SPF', timing: 'matin', hint: 'Dernière étape du matin' },
    retinol: { label: 'Rétinol', timing: 'soir', hint: 'Anti-âge · renouvellement' },
    aha: { label: 'AHA', timing: 'soir', hint: 'Exfoliation douce' },
    bha: { label: 'BHA', timing: 'soir', hint: 'Pores · texture' },
    bpo: { label: 'Peroxyde de benzoyle', timing: 'soir', hint: 'Anti-imperfections ciblé' }
  };

  const ROUTINE_ORDER = {
    matin: { vitc: 1, niacinamide: 2, ha: 3, creme: 4, spf: 5 },
    soir: { bha: 1, aha: 1, bpo: 2, niacinamide: 3, retinol: 4, ha: 4, creme: 5 }
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function productsForCompatId(products, compatId) {
    return products.filter(function (p) {
      return ACTIVE_TO_COMPAT[p.active] === compatId;
    });
  }

  function productLine(product) {
    if (!product) return '';
    return (product.brand || '') + (product.name ? ' — ' + product.name : '');
  }

  function enrichPairs(pairs, products) {
    return pairs.map(function (pair) {
      const prodsA = productsForCompatId(products, pair.a);
      const prodsB = productsForCompatId(products, pair.b);
      const labelA = ACTIVE_MAP_LABEL[pair.a] || pair.a;
      const labelB = ACTIVE_MAP_LABEL[pair.b] || pair.b;
      const title = pair.title || (labelA + ' + ' + labelB);
      let productContext = '';

      if (prodsA.length && prodsB.length) {
        productContext = productLine(prodsA[0]) + ' ↔ ' + productLine(prodsB[0]);
      } else if (prodsA.length || prodsB.length) {
        productContext = productLine(prodsA[0] || prodsB[0]);
      }

      return Object.assign({}, pair, {
        title: title,
        productContext: productContext,
        productsA: prodsA,
        productsB: prodsB
      });
    });
  }

  const ACTIVE_MAP_LABEL = {
    'vitamine-c': 'Vitamine C',
    retinol: 'Rétinol',
    aha: 'AHA',
    niacinamide: 'Niacinamide',
    benzoyl: 'Peroxyde de benzoyle',
    ceramides: 'Céramides',
    bha: 'BHA',
    'acide-azelaique': 'Acide azélaïque',
    peptides: 'Peptides',
    'vitamine-e': 'Vitamine E'
  };

  function compatIds(products) {
    const ids = [];
    products.forEach(function (p) {
      const id = ACTIVE_TO_COMPAT[p.active];
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  function productTags(products) {
    const tags = [];
    const actives = products.map(function (p) { return p.active; });
    if (actives.indexOf('niacinamide') !== -1 || actives.indexOf('vitc') !== -1 || actives.indexOf('retinol') !== -1) {
      tags.push('Actifs détectés ✓');
    }
    if (actives.indexOf('creme') !== -1 || actives.indexOf('ha') !== -1) {
      tags.push('Hydratation ✓');
    }
    if (actives.indexOf('spf') !== -1) tags.push('SPF ✓');
    return tags.length ? tags : ['Routine détectée ✓'];
  }

  function activeMeta(active) {
    return ACTIVE_META[active] || { label: active, timing: 'matin-soir', hint: '' };
  }

  function sortForPeriod(products, period) {
    const orderMap = ROUTINE_ORDER[period] || {};
    return products.slice().sort(function (a, b) {
      const oa = orderMap[a.active] != null ? orderMap[a.active] : 50;
      const ob = orderMap[b.active] != null ? orderMap[b.active] : 50;
      return oa - ob;
    });
  }

  function buildRoutineOrder(products, pairs) {
    const morning = [];
    const evening = [];
    const notes = [];

    products.forEach(function (p) {
      const meta = activeMeta(p.active);
      const timing = meta.timing || 'matin-soir';
      if (timing.indexOf('matin') !== -1) morning.push(p);
      if (timing.indexOf('soir') !== -1) evening.push(p);
    });

    const sortedMorning = sortForPeriod(morning, 'matin').map(function (p, i) {
      const meta = activeMeta(p.active);
      return {
        step: i + 1,
        brand: p.brand,
        name: p.name,
        active: p.active,
        activeLabel: meta.label,
        hint: meta.hint,
        photoUrl: p.photoUrl || ''
      };
    });

    const sortedEvening = sortForPeriod(evening, 'soir').map(function (p, i) {
      const meta = activeMeta(p.active);
      return {
        step: i + 1,
        brand: p.brand,
        name: p.name,
        active: p.active,
        activeLabel: meta.label,
        hint: meta.hint,
        photoUrl: p.photoUrl || ''
      };
    });

    (pairs || []).forEach(function (pair) {
      if (pair.status === 'avoid' && pair.tip) {
        notes.push(pair.tip);
      }
    });

    const hasSpf = products.some(function (p) { return p.active === 'spf'; });
    const hasStrongEvening = products.some(function (p) {
      return p.active === 'retinol' || p.active === 'aha' || p.active === 'bpo';
    });
    if (hasStrongEvening && !hasSpf) {
      notes.push('Pense au SPF le matin si tu utilises des actifs exfoliants ou le rétinol le soir.');
    }

    return {
      morning: sortedMorning,
      evening: sortedEvening,
      notes: notes.filter(function (n, i, arr) { return arr.indexOf(n) === i; }).slice(0, 4)
    };
  }

  function summaryBySkinScore(score) {
    if (score >= 10) return 'Parfaitement aligné avec ton type de peau.';
    if (score >= 9) return 'Très bonne adéquation avec ton profil.';
    if (score >= 8) return 'Bien adapté — un ou deux détails à peaufiner.';
    if (score >= 7) return 'Correct, mais pas encore optimal pour ta peau.';
    if (score >= 6) return 'Plusieurs choix peu adaptés à ton profil.';
    if (score >= 5) return 'Écart notable avec les besoins de ta peau.';
    return 'Routine peu alignée avec ton type de peau.';
  }

  function buildSkinScoreSummary(skinScore, skinType, products) {
    const list = products || [];
    const strongActives = list.some(function (p) {
      return p.active === 'retinol' || p.active === 'aha' || p.active === 'bpo';
    });
    const hasNiacinamide = list.some(function (p) { return p.active === 'niacinamide'; });
    const hasHydration = list.some(function (p) { return p.active === 'creme' || p.active === 'ha'; });

    if (!skinType) {
      return 'Complète ton profil peau pour affiner ce score.';
    }
    if (skinType === 'sensible' && strongActives) {
      return 'Actifs puissants sur peau sensible — à espacer pour limiter les irritations.';
    }
    if (skinType === 'grasse' && hasNiacinamide && skinScore >= 8) {
      return 'Bons actifs régulateurs pour ta peau grasse.';
    }
    if (skinType === 'seche' && hasHydration && skinScore >= 8) {
      return 'Hydratation cohérente avec ta peau sèche.';
    }
    if (skinType === 'seche' && !hasHydration) {
      return 'Manque d\'étapes nourrissantes pour ta peau sèche.';
    }
    if (skinType === 'grasse' && !hasNiacinamide && strongActives) {
      return 'Textures ou actifs à surveiller sur peau grasse.';
    }
    if (skinType === 'mixte' && skinScore >= 8) {
      return 'Routine équilibrée pour une peau mixte.';
    }

    return summaryBySkinScore(skinScore);
  }

  function buildCompatScoreTipLines(analysis) {
    analysis = analysis || {};
    const score = analysis.compatScore;
    if (score == null) return [];

    const alertCount = analysis.alertCount || 0;
    const avoidCount = analysis.avoidCount || 0;
    const synergyCount = analysis.synergyCount || 0;
    const productCount = analysis.productCount || 0;
    const lines = [];

    if (score >= 10) {
      lines.push('Note 10/10 : aucun conflit ni alerte entre tes actifs.');
    } else if (score >= 9) {
      lines.push('Note ' + score + '/10 : compatible, avec un léger point de vigilance.');
    } else if (score >= 8) {
      lines.push('Note ' + score + '/10 : globalement OK, quelques associations à surveiller.');
    } else if (score >= 7) {
      lines.push('Note ' + score + '/10 : espacer certains duos matin et soir.');
    } else if (score >= 6) {
      lines.push('Note ' + score + '/10 : plusieurs actifs à ne pas cumuler.');
    } else {
      lines.push('Note ' + score + '/10 : incompatibilités qui limitent l\'efficacité.');
    }

    if (avoidCount) {
      lines.push(avoidCount + ' duo' + (avoidCount > 1 ? 's' : '') + ' à séparer — certains actifs s\'annulent ou irritent.');
    } else if (alertCount) {
      lines.push(alertCount + ' point' + (alertCount > 1 ? 's' : '') + ' d\'attention — ne pas enchaîner ces actifs sur la même routine.');
    } else if (synergyCount) {
      lines.push(synergyCount + ' synergie' + (synergyCount > 1 ? 's' : '') + ' : tes actifs se renforcent mutuellement.');
    } else if (productCount < 2) {
      lines.push('Peu d\'actifs à croiser : compatibilité maximale par défaut.');
    } else {
      lines.push('Tous les duos testés sont sûrs — respecte l\'ordre d\'application proposé.');
    }

    return lines;
  }

  function buildAnalysis(products, state) {
    state = state || {};
    const compat = global.VirceneActivesCompat;
    const ids = compatIds(products);
    let pairs = [];
    let hasAvoid = false;
    let hasCaution = false;

    if (compat && ids.length >= 2) {
      const result = compat.analyze(ids);
      pairs = enrichPairs(result.pairs || [], products);
      hasAvoid = result.hasAvoid;
      hasCaution = result.hasCaution;
    }

    let compatScore = 10;
    pairs.forEach(function (pair) {
      if (pair.status === 'avoid') compatScore -= 2;
      else if (pair.status === 'caution') compatScore -= 1;
    });
    compatScore = Math.max(4, Math.min(10, compatScore));

    let skinScore = 7;
    const skinType = state.skinType;
    const strongActives = products.some(function (p) {
      return p.active === 'retinol' || p.active === 'aha' || p.active === 'bpo';
    });

    if (skinType === 'grasse' && products.some(function (p) { return p.active === 'niacinamide'; })) skinScore += 1;
    if (skinType === 'seche' && products.some(function (p) { return p.active === 'creme' || p.active === 'ha'; })) skinScore += 1;
    if (skinType === 'sensible' && strongActives) skinScore -= 2;
    if (skinType === 'mixte') skinScore += 0.5;
    skinScore = Math.max(4, Math.min(10, Math.round(skinScore)));
    const skinScoreSummary = buildSkinScoreSummary(skinScore, skinType, products);

    const alertCount = pairs.filter(function (p) { return p.status === 'avoid' || p.status === 'caution'; }).length;
    const synergyCount = pairs.filter(function (p) { return p.status === 'ok'; }).length;
    const avoidCount = pairs.filter(function (p) { return p.status === 'avoid'; }).length;
    const routineLabel = (state.morning && state.morning.length) ? 'routine matin' : 'routine soir';
    const routineOrder = buildRoutineOrder(products, pairs);

    const statusTags = productTags(products);
    if (avoidCount) statusTags.push('À séparer');
    else if (alertCount) statusTags.push('À espacer');
    else if (synergyCount) statusTags.push('Synergies ✓');
    statusTags.push('Ordre routine OK');
    if (alertCount > 0) {
      statusTags.push('Alertes ' + alertCount);
    }

    let compatSummary = 'Tes actifs se complètent bien — suis l\'ordre proposé.';
    if (avoidCount) {
      compatSummary = avoidCount + ' duo' + (avoidCount > 1 ? 's' : '') + ' à séparer : certains actifs s\'annulent ou irritent ensemble.';
    } else if (alertCount) {
      compatSummary = alertCount + ' point' + (alertCount > 1 ? 's' : '') + ' d\'attention — espace matin et soir pour limiter les irritations.';
    } else if (synergyCount) {
      compatSummary = synergyCount + ' synergie' + (synergyCount > 1 ? 's' : '') + ' détectée' + (synergyCount > 1 ? 's' : '') + ' entre tes actifs.';
    }

    const headline = alertCount
      ? alertCount + ' point' + (alertCount > 1 ? 's' : '') + ' d\'attention sur tes actifs'
      : 'Tes actifs semblent bien s\'accorder';

    const productScores = products.map(function (p) {
      return scoreProductProfitability(p, state, pairs);
    });

    const avgProfit = productScores.length
      ? Math.round(productScores.reduce(function (sum, item) { return sum + item.score; }, 0) / productScores.length * 10) / 10
      : 0;

    return {
      compatScore: compatScore,
      skinScore: skinScore,
      skinScoreSummary: skinScoreSummary,
      alertCount: alertCount,
      avoidCount: avoidCount,
      synergyCount: synergyCount,
      pairs: pairs,
      hasAvoid: hasAvoid,
      hasCaution: hasCaution,
      routineLabel: routineLabel,
      routineOrder: routineOrder,
      compatSummary: compatSummary,
      statusTags: statusTags,
      headline: headline,
      productCount: products.length,
      productScores: productScores,
      avgProfitScore: avgProfit,
      compatScoreTipLines: buildCompatScoreTipLines({
        compatScore: compatScore,
        alertCount: alertCount,
        avoidCount: avoidCount,
        synergyCount: synergyCount,
        productCount: products.length
      })
    };
  }

  function scoreProductProfitability(product, state, pairs) {
    let score = 7;
    const skinType = state.skinType;
    const active = product.active;

    if (skinType === 'grasse' && (active === 'niacinamide' || active === 'bpo')) score += 1.5;
    if (skinType === 'seche' && (active === 'creme' || active === 'ha')) score += 1.5;
    if (skinType === 'sensible' && (active === 'retinol' || active === 'aha' || active === 'bpo')) score -= 2;
    if (skinType === 'mixte' && (active === 'niacinamide' || active === 'spf')) score += 0.8;
    if (active === 'spf') score += 0.5;
    if (active === 'retinol' && skinType === 'mature') score += 1;

    const conflict = (pairs || []).some(function (pair) {
      return pair.status === 'avoid' || pair.status === 'caution';
    });
    if (conflict) score -= 0.8;

    score = Math.max(3, Math.min(10, Math.round(score * 10) / 10));

    let verdict = 'Rentabilité moyenne';
    if (score >= 8.5) verdict = 'Très rentable pour ta peau';
    else if (score >= 7) verdict = 'Bon rapport efficacité / profil';
    else if (score >= 5.5) verdict = 'Rentabilité limitée';
    else verdict = 'Peu adapté à ton profil';

    return {
      score: score,
      verdict: verdict,
      detail: 'Efficacité actifs · Adéquation profil · Synergie routine'
    };
  }

  global.VirceneRoutineAnalysis = {
    buildAnalysis: buildAnalysis,
    buildRoutineOrder: buildRoutineOrder,
    buildSkinScoreSummary: buildSkinScoreSummary,
    buildCompatScoreTipLines: buildCompatScoreTipLines,
    summaryBySkinScore: summaryBySkinScore,
    activeMeta: activeMeta,
    ACTIVE_META: ACTIVE_META,
    escapeHtml: escapeHtml
  };
})(window);

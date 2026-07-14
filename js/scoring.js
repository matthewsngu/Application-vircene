/**
 * Vircène — Moteur d'analyse d'ingrédients (méthode façon Yuka)
 *
 * Expose un objet global `VirceneScoring` :
 *   - VirceneScoring.lookupIngredient(name)
 *   - VirceneScoring.analyze(ingredientNames)
 *   - VirceneScoring.SEED_PRODUCTS
 *   - VirceneScoring.RISK_META / .BANDS / .INGREDIENTS
 *
 * Principe : chaque ingrédient est classé en 4 niveaux de risque
 *   rouge  = à risque         (pastille rouge)
 *   orange = risque modéré    (pastille orange)
 *   jaune  = risque faible    (pastille jaune)
 *   vert   = sans risque      (pastille verte)
 *
 * La note est tirée vers le bas par le PIRE ingrédient :
 *   - un ingrédient rouge plafonne la note dans la bande 0–24 (À éviter).
 *   - un ingrédient orange plafonne la note dans la bande 25–49 (Médiocre).
 *   - sinon (pire = jaune ou vert) la note part de 100 et descend selon le
 *     malus cumulé des effets ; les produits à seules réserves mineures
 *     peuvent donc rester dans la bande verte 75–100 (Excellent), comme la
 *     référence Mixa (86/100). Plancher à 50 pour le cas jaune/vert.
 *
 * Malus déterministe par effet (cumulé sur tous les ingrédients) :
 *   cancérigène = 8, perturbateur endocrinien = 8, polluant = 5,
 *   allergène = 4, irritant = 3. Les ingrédients « sans risque » (effets
 *   vides) ne retirent rien.
 */
(function (global) {
  'use strict';

  // ─── Métadonnées des 4 niveaux de risque ───
  var RISK_META = {
    rouge:  { color: '#E0524F', riskLabel: 'À risque',      rank: 0 },
    orange: { color: '#E08A3C', riskLabel: 'Risque modéré', rank: 1 },
    jaune:  { color: '#E6C24A', riskLabel: 'Risque faible', rank: 2 },
    vert:   { color: '#4FA361', riskLabel: 'Sans risque',   rank: 3 }
  };

  // ─── Bandes de note → libellé + couleur globale ───
  var BANDS = {
    rouge:  { floor: 0,  cap: 24,  label: 'À éviter',  color: '#E0524F' },
    orange: { floor: 25, cap: 49,  label: 'Médiocre',  color: '#E08A3C' },
    jaune:  { floor: 50, cap: 74,  label: 'Bon',       color: '#E6C24A' },
    vert:   { floor: 75, cap: 100, label: 'Excellent', color: '#4FA361' }
  };

  // ─── Poids des effets (malus) ───
  var EFFECT_MALUS = {
    'cancérigène': 8,
    'perturbateur endocrinien': 8,
    'polluant': 5,
    'allergène': 4,
    'irritant': 3
  };

  // ─── Base d'ingrédients (~50 entrées, alias FR / INCI) ───
  var INGREDIENTS = [
    // ——— Sans risque (vert) ———
    { name: 'Eau', aliases: ['aqua', 'water'], level: 'vert', effects: [],
      info: 'Solvant de base, totalement inerte pour la peau.', source: 'INCI / ANSM' },
    { name: 'Glycérine', aliases: ['glycerin', 'glycerol', 'glycérine'], level: 'vert', effects: [],
      info: 'Humectant naturel qui retient l’eau dans la peau.', source: 'CIR (Cosmetic Ingredient Review)' },
    { name: 'Alcool cétylique', aliases: ['cetyl alcohol', 'alcool cetylique'], level: 'vert', effects: [],
      info: 'Alcool gras émollient, ne dessèche pas la peau.', source: 'CIR' },
    { name: 'Alcool cétéarylique', aliases: ['cetearyl alcohol'], level: 'vert', effects: [],
      info: 'Alcool gras texturant et adoucissant, bien toléré.', source: 'CIR' },
    { name: 'Beurre de karité', aliases: ['butyrospermum parkii butter', 'butyrospermum parkii', 'shea butter', 'extrait de beurre de karité', 'karité'], level: 'vert', effects: [],
      info: 'Beurre végétal nourrissant riche en acides gras.', source: 'INCI' },
    { name: 'Stéarate de glycéryle', aliases: ['glyceryl stearate', 'stearate de glyceryle'], level: 'vert', effects: [],
      info: 'Émulsifiant doux d’origine végétale.', source: 'CIR' },
    { name: 'Acide citrique', aliases: ['citric acid', 'acide citrique'], level: 'vert', effects: [],
      info: 'Régulateur de pH issu des agrumes, à faible dose.', source: 'EFSA' },
    { name: 'Caprylyl glycol', aliases: ['caprylyl glycol'], level: 'vert', effects: [],
      info: 'Hydratant et conservateur doux bien toléré.', source: 'CIR' },
    { name: 'Pentaerythrityl tetra-di-t-butyl hydroxyhydrocinnamate', aliases: ['pentaerythrityl tetra-di-t-butyl hydroxyhydrocinnamate', 'pentaerythrityl tetrakis'], level: 'vert', effects: [],
      info: 'Antioxydant qui protège la formule de l’oxydation.', source: 'CIR' },
    { name: 'Tocophérol', aliases: ['tocopherol', 'vitamine e', 'tocophérol'], level: 'vert', effects: [],
      info: 'Vitamine E antioxydante, protège la barrière cutanée.', source: 'CIR' },
    { name: 'Acétate de tocophéryle', aliases: ['tocopheryl acetate', 'vitamine e acetate'], level: 'vert', effects: [],
      info: 'Forme stable de vitamine E, antioxydante.', source: 'CIR' },
    { name: 'Gomme xanthane', aliases: ['xanthan gum', 'gomme xanthane'], level: 'vert', effects: [],
      info: 'Gélifiant naturel issu de fermentation.', source: 'EFSA' },
    { name: 'Hydroxyde de sodium', aliases: ['sodium hydroxide', 'soude'], level: 'vert', effects: [],
      info: 'Régulateur de pH neutralisé dans la formule finale.', source: 'CIR' },
    { name: 'Aloe vera', aliases: ['aloe barbadensis leaf juice', 'aloe barbadensis', 'aloe vera'], level: 'vert', effects: [],
      info: 'Gel végétal apaisant et hydratant.', source: 'INCI' },
    { name: 'Panthénol', aliases: ['panthenol', 'provitamine b5', 'panthénol'], level: 'vert', effects: [],
      info: 'Provitamine B5 réparatrice et apaisante.', source: 'CIR' },
    { name: 'Niacinamide', aliases: ['niacinamide', 'vitamine b3'], level: 'vert', effects: [],
      info: 'Vitamine B3 qui régule le sébum et apaise.', source: 'CIR' },
    { name: 'Acide hyaluronique', aliases: ['sodium hyaluronate', 'hyaluronic acid', 'acide hyaluronique'], level: 'vert', effects: [],
      info: 'Hydratant puissant qui repulpe la peau.', source: 'INCI' },
    { name: 'Squalane', aliases: ['squalane'], level: 'vert', effects: [],
      info: 'Émollient végétal proche du sébum naturel.', source: 'CIR' },
    { name: 'Allantoïne', aliases: ['allantoin', 'allantoine'], level: 'vert', effects: [],
      info: 'Actif apaisant et cicatrisant.', source: 'CIR' },
    { name: 'Bisabolol', aliases: ['bisabolol'], level: 'vert', effects: [],
      info: 'Extrait apaisant dérivé de la camomille.', source: 'CIR' },

    { name: 'Acide salicylique (BHA)', aliases: ['salicylic acid', 'salicylic', 'acide salicylique', 'beta hydroxy acid', 'bha', 'betaine salicylate'], level: 'jaune', effects: ['irritant'],
      info: 'Exfoliant BHA cosmétique — affine les pores et les imperfections. Peut irriter les peaux sensibles ; à espacer avec rétinol/AHA et toujours SPF le jour.', source: 'CIR / règlement UE cosmétique' },
    { name: 'Acide polyhydroxy (PHA)', aliases: ['pha', 'gluconolactone', 'lactobionic acid', 'acide lactobionique', 'galactose'], level: 'vert', effects: [],
      info: 'Exfoliant doux, en général bien toléré y compris sur peaux sensibles.', source: 'CIR' },

    // ——— Risque faible (jaune) ———
    { name: 'Diméthicone', aliases: ['dimethicone', 'dimethicone'], level: 'jaune', effects: ['polluant'],
      info: 'Silicone occlusif, sûr pour la peau mais peu biodégradable.', source: 'ECHA' },
    { name: 'PEG-40 Stearate', aliases: ['peg-40 stearate', 'peg 40 stearate'], level: 'jaune', effects: ['irritant', 'allergène'],
      info: 'Émulsifiant éthoxylé ; léger risque d’irritation et trace de contaminants.', source: 'CIR' },
    { name: 'Phénoxyéthanol', aliases: ['phenoxyethanol', 'phenoxyethanol'], level: 'jaune', effects: ['irritant'],
      info: 'Conservateur courant, irritant possible à forte dose.', source: 'ANSM' },
    { name: 'Cyclopentasiloxane', aliases: ['cyclopentasiloxane'], level: 'jaune', effects: ['polluant'],
      info: 'Silicone volatil persistant dans l’environnement.', source: 'ECHA' },
    { name: 'Parfum', aliases: ['parfum', 'fragrance'], level: 'jaune', effects: ['allergène'],
      info: 'Mélange odorant pouvant contenir des allergènes.', source: 'SCCS' },
    { name: 'Linalool', aliases: ['linalool'], level: 'jaune', effects: ['allergène'],
      info: 'Composant parfumant allergène à déclaration obligatoire.', source: 'SCCS' },
    { name: 'Limonène', aliases: ['limonene', 'limonène', 'd-limonene'], level: 'jaune', effects: ['allergène'],
      info: 'Parfum d’agrume allergène à déclaration obligatoire.', source: 'SCCS' },
    { name: 'Citronellol', aliases: ['citronellol'], level: 'jaune', effects: ['allergène'],
      info: 'Composant parfumant allergène reconnu.', source: 'SCCS' },
    { name: 'Laureth sulfate de sodium', aliases: ['sodium laureth sulfate', 'sles'], level: 'jaune', effects: ['irritant'],
      info: 'Tensioactif moussant, légèrement irritant.', source: 'CIR' },
    { name: 'EDTA disodique', aliases: ['disodium edta', 'edta', 'tetrasodium edta'], level: 'jaune', effects: ['polluant'],
      info: 'Chélateur peu biodégradable.', source: 'ECHA' },
    { name: 'Benzoate de sodium', aliases: ['sodium benzoate', 'benzoate de sodium'], level: 'jaune', effects: ['irritant'],
      info: 'Conservateur doux, irritant possible chez les peaux sensibles.', source: 'EFSA' },
    { name: 'Sorbate de potassium', aliases: ['potassium sorbate', 'sorbate de potassium'], level: 'jaune', effects: ['irritant'],
      info: 'Conservateur doux bien toléré dans la plupart des cas.', source: 'EFSA' },

    // ——— Risque modéré (orange) ———
    { name: 'Méthylparabène', aliases: ['methylparaben', 'methylparabene'], level: 'orange', effects: ['perturbateur endocrinien'],
      info: 'Conservateur paraben, suspecté perturbateur endocrinien.', source: 'SCCS' },
    { name: 'Propylparabène', aliases: ['propylparaben', 'propylparabene'], level: 'orange', effects: ['perturbateur endocrinien'],
      info: 'Paraben à chaîne plus longue, sous surveillance.', source: 'SCCS' },
    { name: 'Lauryl sulfate de sodium', aliases: ['sodium lauryl sulfate', 'sls'], level: 'orange', effects: ['irritant'],
      info: 'Tensioactif puissant, irritant pour la barrière cutanée.', source: 'CIR' },
    { name: 'BHT', aliases: ['bht', 'butylated hydroxytoluene'], level: 'orange', effects: ['perturbateur endocrinien'],
      info: 'Antioxydant de synthèse suspecté perturbateur endocrinien.', source: 'SCCS' },
    { name: 'Cocamidopropyl bétaïne', aliases: ['cocamidopropyl betaine', 'cocamidopropyl betaïne'], level: 'orange', effects: ['allergène', 'irritant'],
      info: 'Tensioactif doux mais allergène fréquent.', source: 'CIR' },
    { name: 'Chlorhydrate d’aluminium', aliases: ['aluminum chlorohydrate', 'aluminium chlorohydrate'], level: 'orange', effects: ['polluant', 'irritant'],
      info: 'Sel d’aluminium des anti-transpirants, controversé.', source: 'ANSM' },
    { name: 'Palmitate de rétinyle', aliases: ['retinyl palmitate'], level: 'orange', effects: ['irritant'],
      info: 'Dérivé de vitamine A, photosensibilisant et irritant.', source: 'SCCS' },
    { name: 'Octinoxate', aliases: ['ethylhexyl methoxycinnamate', 'octinoxate'], level: 'orange', effects: ['perturbateur endocrinien'],
      info: 'Filtre UV chimique suspecté perturbateur endocrinien.', source: 'SCCS' },

    // ——— À risque (rouge) ———
    { name: 'Butylated hydroxyanisole', aliases: ['butylated hydroxyanisole', 'bha antioxydant'], level: 'rouge', effects: ['perturbateur endocrinien', 'cancérigène'],
      info: 'Antioxydant de synthèse (E320) — classé perturbateur endocrinien et cancérogène possible par le CIRC. Restreint ou déconseillé dans l’UE.', source: 'CIRC / SCCS (UE)' },
    { name: 'Triclosan', aliases: ['triclosan'], level: 'rouge', effects: ['perturbateur endocrinien', 'polluant'],
      info: 'Antibactérien perturbateur endocrinien et polluant aquatique.', source: 'SCCS' },
    { name: 'Méthylisothiazolinone', aliases: ['methylisothiazolinone', 'mit', 'mi'], level: 'rouge', effects: ['allergène', 'irritant'],
      info: 'Conservateur fortement allergène, responsable d’eczémas de contact.', source: 'SCCS' },
    { name: 'Méthylchloroisothiazolinone', aliases: ['methylchloroisothiazolinone', 'cmit'], level: 'rouge', effects: ['allergène', 'irritant'],
      info: 'Conservateur très allergène, usage restreint.', source: 'SCCS' },
    { name: 'Oxybenzone', aliases: ['benzophenone-3', 'oxybenzone', 'benzophenone 3'], level: 'rouge', effects: ['perturbateur endocrinien', 'polluant'],
      info: 'Filtre UV perturbateur endocrinien et toxique pour les coraux.', source: 'SCCS' },
    { name: 'Formaldéhyde', aliases: ['formaldehyde', 'formaldehyde', 'methylene glycol'], level: 'rouge', effects: ['cancérigène', 'irritant'],
      info: 'Conservateur cancérogène avéré, interdit en l’état.', source: 'CIRC' },
    { name: 'Lilial', aliases: ['butylphenyl methylpropional', 'lilial'], level: 'rouge', effects: ['perturbateur endocrinien', 'allergène'],
      info: 'Parfum reprotoxique, interdit dans l’UE depuis 2022.', source: 'ECHA' },
    { name: 'Goudron de houille', aliases: ['coal tar', 'goudron de houille'], level: 'rouge', effects: ['cancérigène'],
      info: 'Dérivé cancérogène, usage très restreint.', source: 'CIRC' }
  ];

  var UNKNOWN_MALUS = 2;
  var UNKNOWN_LEVEL = 'jaune';

  // ─── Index normalisé pour la recherche ───
  function normalize(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // retire les accents
      .replace(/[’']/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  var INDEX = {};
  var loadPromise = null;
  var dbVersion = 0;

  function rebuildIndex() {
    INDEX = {};
    INGREDIENTS.forEach(function (ing) {
      INDEX[normalize(ing.name)] = ing;
      (ing.aliases || []).forEach(function (alias) {
        INDEX[normalize(alias)] = ing;
      });
    });
  }

  rebuildIndex();

  function mergeIngredients(extra) {
    var seen = {};
    INGREDIENTS.forEach(function (ing) {
      seen[normalize(ing.name)] = true;
    });
    (extra || []).forEach(function (ing) {
      if (!ing || !ing.name || seen[normalize(ing.name)]) return;
      INGREDIENTS.push(ing);
      seen[normalize(ing.name)] = true;
    });
    rebuildIndex();
    dbVersion += 1;
  }

  function loadDatabase() {
    if (loadPromise) return loadPromise;
    var url = (global.VIRCENE_CONFIG && global.VIRCENE_CONFIG.assets && global.VIRCENE_CONFIG.assets.ingredientsExtra)
      || 'data/ingredients-extra.json';
    loadPromise = fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (data && data.ingredients) mergeIngredients(data.ingredients);
      })
      .catch(function () { /* noyau embarqué suffit */ })
      .then(function () { return dbVersion; });
    return loadPromise;
  }

  // Index CosIng — lazy-load uniquement quand des inconnus sont rencontrés
  var cosingPromise = null;
  var cosingLoaded = false;

  function loadCosingIndex() {
    if (cosingLoaded || cosingPromise) return cosingPromise || Promise.resolve();
    var url = (global.VIRCENE_CONFIG && global.VIRCENE_CONFIG.assets && global.VIRCENE_CONFIG.assets.ingredientsCosing)
      || 'data/ingredients-cosing-index.json';
    cosingPromise = fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data) return;
        // L'index CosIng est un objet { "nom normalisé": {...} }
        var entries = [];
        Object.keys(data).forEach(function (k) {
          var entry = data[k];
          if (entry && entry.name) entries.push(entry);
        });
        if (entries.length) mergeIngredients(entries);
        cosingLoaded = true;
      })
      .catch(function () { cosingLoaded = true; /* fichier absent — pas bloquant */ });
    return cosingPromise;
  }

  loadDatabase();

  function lookupIngredient(name) {
    var key = normalize(name);
    if (INDEX[key]) return INDEX[key];
    // tente une correspondance partielle (ex. "parfum (fragrance)")
    for (var i = 0; i < INGREDIENTS.length; i++) {
      var ing = INGREDIENTS[i];
      var keys = [ing.name].concat(ing.aliases || []);
      for (var k = 0; k < keys.length; k++) {
        var nk = normalize(keys[k]);
        if (nk.length > 2 && (key.indexOf(nk) !== -1 || nk.indexOf(key) !== -1)) {
          return ing;
        }
      }
    }
    return {
      name: String(name || '').trim() || 'Ingrédient',
      level: UNKNOWN_LEVEL,
      effects: [],
      info: 'Absent de notre base INCI — score prudent en attendant enrichissement. Tu peux activer l’analyse IA des inconnus dans la config.',
      source: 'Vircène — non répertorié',
      unknown: true
    };
  }

  // Expose pour usage externe (ex. scoring.loadCosingIndex())
  function loadCosingIndexPublic() { return loadCosingIndex(); }

  function logUnknownIngredient(rawName) {
    try {
      var key = 'vircene_unknown_ingredients';
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      var norm = normalize(rawName);
      if (!norm || list.some(function (e) { return e.norm === norm; })) return;
      list.push({ norm: norm, name: String(rawName || '').trim(), at: new Date().toISOString() });
      if (list.length > 200) list = list.slice(-200);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) { /* ignore */ }
  }

  function positionWeight(index) {
    if (index < 3) return 1.35;
    if (index < 8) return 1.1;
    return 0.9;
  }

  function malusFor(effects) {
    return (effects || []).reduce(function (sum, eff) {
      return sum + (EFFECT_MALUS[eff] || 0);
    }, 0);
  }

  function worstLevel(items) {
    var worst = 'vert';
    items.forEach(function (it) {
      if (RISK_META[it.level].rank < RISK_META[worst].rank) worst = it.level;
    });
    return worst;
  }

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  function bandForScore(score) {
    if (score <= BANDS.rouge.cap) return 'rouge';
    if (score <= BANDS.orange.cap) return 'orange';
    if (score <= BANDS.jaune.cap) return 'jaune';
    return 'vert';
  }

  function buildRiskExplanation(item) {
    if (!item || item.level === 'vert') return '';
    var parts = [];
    if (item.effects && item.effects.length) {
      parts.push('Préoccupations : ' + item.effects.join(', ') + '.');
    }
    if (item.info) parts.push(item.info);
    if (item.source) {
      parts.push('Source réglementaire : ' + item.source + '.');
    }
    return parts.join(' ');
  }

  function buildProductAvoidSummary(analysis) {
    var risky = (analysis.ingredients || []).filter(function (i) {
      return i.level === 'rouge' || i.level === 'orange';
    });
    if (!risky.length) return '';
    return risky.map(function (ing) {
      return ing.name + ' — ' + buildRiskExplanation(ing);
    }).join(' ');
  }

  function analyze(ingredientNames, options) {
    options = options || {};
    var names = Array.isArray(ingredientNames) ? ingredientNames : [];

    var items = names
      .map(function (n) { return String(n || '').trim(); })
      .filter(function (n) { return n.length > 0; })
      .map(function (n, index) {
        var rec = lookupIngredient(n);
        if (rec.unknown) logUnknownIngredient(n);
        var meta = RISK_META[rec.level] || RISK_META.vert;
        return {
          name: rec.unknown ? n : rec.name,
          rawName: n,
          level: rec.level,
          color: meta.color,
          riskLabel: rec.unknown ? 'Non répertorié' : meta.riskLabel,
          effects: rec.effects || [],
          info: rec.info || '',
          source: rec.source || null,
          unknown: !!rec.unknown,
          position: index + 1,
          positionWeight: positionWeight(index)
        };
      });

    var totalMalus = items.reduce(function (sum, it) {
      var base = malusFor(it.effects);
      if (it.unknown) base += UNKNOWN_MALUS;
      return sum + base * (it.positionWeight || 1);
    }, 0);

    var worst = items.length ? worstLevel(items) : 'vert';
    var score;

    if (worst === 'rouge') {
      // un ingrédient à risque plafonne dans la bande rouge
      score = clamp(BANDS.rouge.cap - totalMalus, BANDS.rouge.floor, BANDS.rouge.cap);
    } else if (worst === 'orange') {
      // pire = risque modéré → bande orange
      score = clamp(BANDS.orange.cap - totalMalus, BANDS.orange.floor, BANDS.orange.cap);
    } else {
      // pire = jaune ou vert → région haute, départ à 100 moins le malus
      score = clamp(100 - totalMalus, BANDS.jaune.floor, 100);
    }

    score = Math.round(score);
    var band = bandForScore(score);

    // tri par risque décroissant (rouge → orange → jaune → vert), stable
    var sorted = items
      .map(function (it, i) { return { it: it, i: i }; })
      .sort(function (a, b) {
        var d = RISK_META[a.it.level].rank - RISK_META[b.it.level].rank;
        return d !== 0 ? d : a.i - b.i;
      })
      .map(function (x) { return x.it; });

    var knownCount = items.filter(function (it) { return !it.unknown; }).length;
    var confidence = items.length ? Math.round((knownCount / items.length) * 100) : 0;
    var unknownCount = items.length - knownCount;

    return {
      score: score,
      band: band,
      label: BANDS[band].label,
      color: BANDS[band].color,
      ingredients: sorted,
      avoidSummary: buildProductAvoidSummary({ ingredients: sorted }),
      confidence: confidence,
      knownCount: knownCount,
      unknownCount: unknownCount,
      ingredientCount: items.length,
      dbVersion: dbVersion
    };
  }

  function reanalyze(analysis, ingredientNames) {
    var names = ingredientNames
      || (analysis && analysis.ingredients
        ? analysis.ingredients.map(function (i) { return i.rawName || i.name; })
        : []);
    return analyze(names);
  }

  // ─── Produits de démo ───
  var SEED_PRODUCTS = [
    {
      id: 'mixa-lait-corps',
      name: 'Lait corps Nutritif Satinant',
      brand: 'Mixa',
      emoji: '🧴',
      ingredients: [
        'Aqua', 'Glycerin', 'Dimethicone', 'Cetyl Alcohol',
        'Butyrospermum Parkii Butter', 'PEG-40 Stearate', 'Glyceryl Stearate',
        'Citric Acid', 'Caprylyl Glycol',
        'Pentaerythrityl Tetra-di-t-butyl Hydroxyhydrocinnamate',
        'Tocopherol', 'Xanthan Gum', 'Sodium Hydroxide'
      ]
    },
    {
      id: 'cerave-creme',
      name: 'Crème hydratante barrière',
      brand: 'CeraVe',
      emoji: '🧴',
      ingredients: [
        'Aqua', 'Glycerin', 'Cetearyl Alcohol', 'Caprylyl Glycol',
        'Niacinamide', 'Sodium Hyaluronate', 'Phenoxyethanol', 'Dimethicone',
        'Tocopherol', 'Disodium EDTA'
      ]
    },
    {
      id: 'ordinary-vitc',
      name: 'Sérum vitamine C 15%',
      brand: 'The Ordinary',
      emoji: '💧',
      ingredients: [
        'Aqua', 'Niacinamide', 'Squalane', 'Glycerin', 'Panthenol',
        'Sodium Hyaluronate', 'Citric Acid', 'Parfum', 'Limonene', 'Linalool'
      ]
    },
    {
      id: 'demo-rouge',
      name: 'Crème éclaircissante (exemple à risque)',
      brand: 'Démo',
      emoji: '⚠️',
      ingredients: [
        'Aqua', 'Glycerin', 'Parfum', 'Methylparaben', 'BHA',
        'Methylisothiazolinone', 'Dimethicone'
      ]
    }
  ];

  // ─── Score d'évolution peau (suivi photo) ───
  // Le score global = moyenne arrondie des 4 piliers (0–100).
  // Le delta global = score actuel − score de la période précédente (même règle).
  var EVOLUTION_PILLARS = [
    { key: 'hydratation', label: 'Hydratation' },
    { key: 'texture', label: 'Texture' },
    { key: 'eclat', label: 'Éclat' },
    { key: 'barriere', label: 'Barrière' }
  ];

  /** Jeu démo : moyenne 72 (4 piliers), baseline 64, delta +8 */
  var EVOLUTION_DEMO = {
    periodLabel: 'ta première photo',
    current: { hydratation: 78, texture: 71, eclat: 67, barriere: 72 },
    previous: { hydratation: 70, texture: 65, eclat: 57, barriere: 64 }
  };

  function clampEvolution(n) {
    return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  }

  function meanPillarScores(scores) {
    var sum = 0;
    var count = 0;
    EVOLUTION_PILLARS.forEach(function (p) {
      if (scores[p.key] == null) return;
      sum += clampEvolution(scores[p.key]);
      count += 1;
    });
    return count ? clampEvolution(sum / count) : 0;
  }

  /**
   * @param {{ periodLabel?: string, current: Object, previous: Object }} snapshot
   * @returns {{ total, previous, delta, periodLabel, metrics }}
   */
  function computeEvolution(snapshot) {
    if (!snapshot || !snapshot.current || !snapshot.previous) {
      return { total: 0, previous: 0, delta: 0, periodLabel: '', metrics: [] };
    }

    var total = meanPillarScores(snapshot.current);
    var previous = meanPillarScores(snapshot.previous);
    var metrics = EVOLUTION_PILLARS.map(function (p) {
      var value = clampEvolution(snapshot.current[p.key]);
      var prev = clampEvolution(snapshot.previous[p.key]);
      return {
        key: p.key,
        label: p.label,
        value: value,
        previous: prev,
        delta: value - prev
      };
    });

    return {
      total: total,
      previous: previous,
      delta: total - previous,
      periodLabel: snapshot.periodLabel || 'la période précédente',
      metrics: metrics
    };
  }

  var INSIGHT_TIPS = {
    hydratation: 'Ton hydratation est ton point faible ce mois-ci — on a renforcé ta routine du soir.',
    texture: 'Ta texture peut encore progresser — garde ta phase réparatrice le soir.',
    eclat: 'Ton éclat est ton point faible ce mois-ci — on a ajusté ta routine matin.',
    barriere: 'Ta barrière est ton point faible ce mois-ci — on a renforcé ta routine du soir.'
  };

  function buildEvolutionInsight(report) {
    if (!report.metrics || !report.metrics.length) {
      return { tip: 'Continue ta routine — la régularité paie.' };
    }
    var sorted = report.metrics.slice().sort(function (a, b) { return a.value - b.value; });
    var weakest = sorted[0];
    var strongest = sorted[sorted.length - 1];
    return {
      weakest: weakest,
      strongest: strongest,
      tip: INSIGHT_TIPS[weakest.key] || 'Continue ta routine — la régularité paie.'
    };
  }

  function visualBarWidth(value, metrics) {
    var vals = metrics.map(function (m) { return m.value; });
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    if (max === min) return 100;
    return Math.round(36 + ((value - min) / (max - min)) * 64);
  }

  global.VirceneScoring = {
    INGREDIENTS: INGREDIENTS,
    RISK_META: RISK_META,
    BANDS: BANDS,
    EFFECT_MALUS: EFFECT_MALUS,
    SEED_PRODUCTS: SEED_PRODUCTS,
    normalize: normalize,
    lookupIngredient: lookupIngredient,
    analyze: analyze,
    reanalyze: reanalyze,
    loadDatabase: loadDatabase,
    loadCosingIndex: loadCosingIndexPublic,
    ready: loadDatabase(),
    buildRiskExplanation: buildRiskExplanation,
    buildProductAvoidSummary: buildProductAvoidSummary,
    logUnknownIngredient: logUnknownIngredient
  };

  global.VirceneEvolution = {
    PILLARS: EVOLUTION_PILLARS,
    DEMO: EVOLUTION_DEMO,
    clamp: clampEvolution,
    mean: meanPillarScores,
    compute: computeEvolution,
    buildInsight: buildEvolutionInsight,
    visualBarWidth: visualBarWidth
  };
})(typeof window !== 'undefined' ? window : this);

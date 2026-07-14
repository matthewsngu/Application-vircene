/**
 * Vircène — Classification IA optionnelle des INCI inconnus (cache local)
 * Désactivé par défaut — api.classifyIngredient: true dans config.js
 */
(function (global) {
  'use strict';

  var CACHE_KEY = 'vircene_ingredient_ai_cache';

  function readCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function writeCache(cache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (_) { /* quota */ }
  }

  function isEnabled() {
    // Activé si le flag config est à true OU si l'utilisatrice a un compte Premium actif
    if (global.VIRCENE_CONFIG?.api?.classifyIngredient === true) return true;
    if (global.VircenePaywall?.isPremium && global.VirceneAuth?.readSession) {
      return global.VircenePaywall.isPremium(global.VirceneAuth.readSession());
    }
    return false;
  }

  function endpoint() {
    return global.VIRCENE_CONFIG?.api?.classifyIngredientUrl || '/.netlify/functions/classify-ingredient';
  }

  function normalize(name) {
    return global.VirceneScoring?.normalize?.(name) || String(name || '').toLowerCase().trim();
  }

  async function classifyUnknowns(names) {
    if (!isEnabled() || !names.length) return {};

    var cache = readCache();
    var pending = [];
    names.forEach(function (name) {
      var key = normalize(name);
      if (!key || cache[key]) return;
      pending.push(name);
    });
    if (!pending.length) return cache;

    try {
      var token = null;
      if (global.VirceneAuth?.getAccessToken) {
        token = await global.VirceneAuth.getAccessToken();
      }
      var headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      var res = await fetch(endpoint(), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ names: pending.slice(0, 8) }),
      });
      if (!res.ok) return cache;
      var data = await res.json();
      (data.results || []).forEach(function (row) {
        var key = normalize(row.name);
        if (key) cache[key] = row;
      });
      writeCache(cache);
    } catch (_) { /* ignore */ }

    return cache;
  }

  async function analyzeWithAI(ingredientNames) {
    if (!global.VirceneScoring?.analyze) return null;
    var names = (ingredientNames || []).filter(Boolean);
    if (!isEnabled()) return global.VirceneScoring.analyze(names);

    var unknowns = names.filter(function (n) {
      var rec = global.VirceneScoring.lookupIngredient(n);
      return rec && rec.unknown;
    });
    if (unknowns.length) await classifyUnknowns(unknowns);

    var cache = readCache();
    var enriched = names.map(function (n) {
      var key = normalize(n);
      return cache[key] ? { name: n, ai: cache[key] } : n;
    });

    var base = global.VirceneScoring.analyze(names);
    base.ingredients = base.ingredients.map(function (ing) {
      var key = normalize(ing.rawName || ing.name);
      var ai = cache[key];
      if (!ai || !ing.unknown) return ing;
      var meta = global.VirceneScoring.RISK_META[ai.level] || global.VirceneScoring.RISK_META.jaune;
      return Object.assign({}, ing, {
        level: ai.level,
        color: meta.color,
        riskLabel: meta.riskLabel,
        effects: ai.effects || [],
        info: ai.info || ing.info,
        source: ai.source || 'OpenAI / Vircène',
        unknown: false,
        aiClassified: true,
      });
    });
    return base;
  }

  global.VirceneIngredientAI = {
    isEnabled: isEnabled,
    classifyUnknowns: classifyUnknowns,
    analyzeWithAI: analyzeWithAI,
  };
})(window);

/**
 * Vircène — Synchronisation scan → vitrine « Mes produits »
 */
(function (global) {
  'use strict';

  function productKey(brand, name) {
    return String(brand || '').trim().toLowerCase() + '|' + String(name || '').trim().toLowerCase();
  }

  function fallbackAnalysis(ingredients) {
    const list = (ingredients || []).map(function (ing) {
      return {
        name: ing,
        level: 'vert',
        riskLabel: 'Sans risque',
        effects: [],
        info: 'Ingrédient détecté au scan.',
        source: 'Scan'
      };
    });
    return {
      score: 82,
      label: 'Bon',
      color: '#4FA361',
      band: 'vert',
      ingredients: list
    };
  }

  function scanToVitrineEntry(scanProduct, scannedAt) {
    const ingredients = scanProduct.ingredients || [];
    const analysis = global.VirceneScoring?.analyze
      ? global.VirceneScoring.analyze(ingredients)
      : fallbackAnalysis(ingredients);

    return {
      name: scanProduct.name || '',
      brand: scanProduct.brand || '',
      emoji: '',
      imageUrl: scanProduct.photoUrl || scanProduct.imageUrl || '',
      active: scanProduct.active || '',
      description: scanProduct.description || '',
      ingredientNames: ingredients,
      source: 'scan',
      scannedAt: scannedAt || new Date().toISOString(),
      analysis: analysis
    };
  }

  /**
   * Remplace la vitrine par les produits du dernier scan (showcase synchronisée).
   */
  function syncScanToVitrine(userId, scannedProducts, scannedAt) {
    if (!userId || !global.VirceneUserData?.saveProducts) return [];

    const at = scannedAt || new Date().toISOString();
    const entries = (scannedProducts || [])
      .map(function (p) { return scanToVitrineEntry(p, at); })
      .filter(function (p) { return p.brand && p.name; });

    if (!entries.length) return global.VirceneUserData.getProducts(userId) || [];

    global.VirceneUserData.saveProducts(userId, entries);
    return entries;
  }

  /** Au chargement app : réaligne la vitrine sur le dernier scan sauvegardé. */
  function loadVitrineFromScan(userId) {
    const scan = global.VirceneUserData?.getScanAnalysis?.(userId);
    if (scan?.products?.length) {
      return syncScanToVitrine(userId, scan.products, scan.scannedAt);
    }
    return global.VirceneUserData?.getProducts?.(userId) || [];
  }

  global.VirceneProductSync = {
    syncScanToVitrine: syncScanToVitrine,
    loadVitrineFromScan: loadVitrineFromScan,
    scanToVitrineEntry: scanToVitrineEntry,
    productKey: productKey
  };
})(window);

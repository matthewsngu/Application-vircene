/**
 * Vircène — Sync cloud (Supabase REST API)
 *
 * Stratégie :
 *  - Lecture : localStorage d'abord (rapide), Supabase en fallback si stale
 *  - Écriture : localStorage immédiatement + Supabase en arrière-plan (fire-and-forget)
 *  - Photos stripées avant envoi cloud (trop lourdes)
 *  - Pas d'import() : utilise fetch + JWT via VirceneAuth.getAccessToken()
 */
(function (global) {
  'use strict';

  var SYNC_KEY = 'vircene_cloud_sync_ts_';
  var STALE_MS = 60 * 60 * 1000; // re-pull si > 1h sans sync

  /* ── Utilitaires ────────────────────────────────────────────── */

  function getUserId() {
    return global.VirceneAuth?.readSession?.()?.id || null;
  }

  function lastSyncTs(userId) {
    try { return parseInt(localStorage.getItem(SYNC_KEY + userId) || '0', 10); } catch (_) { return 0; }
  }

  function markSynced(userId) {
    try { localStorage.setItem(SYNC_KEY + userId, String(Date.now())); } catch (_) {}
  }

  function isStale(userId) {
    return Date.now() - lastSyncTs(userId) > STALE_MS;
  }

  function getSupabaseConfig() {
    const cfg = global.VIRCENE_CONFIG?.supabase || {};
    if (!cfg.url || !cfg.anonKey) return null;
    return cfg;
  }

  async function getToken() {
    try {
      if (global.VirceneAuth?.getAccessToken) {
        return await global.VirceneAuth.getAccessToken();
      }
    } catch (_) {}
    return null;
  }

  /* Supprime les dataUrl/photoUrl des produits avant envoi cloud */
  function stripPhotos(products) {
    if (!Array.isArray(products)) return products;
    return products.map(function (p) {
      var copy = Object.assign({}, p);
      delete copy.photoUrl;
      delete copy.dataUrl;
      delete copy.imageUrl;
      return copy;
    });
  }

  function stripScanPhotos(scan) {
    if (!scan) return scan;
    var copy = Object.assign({}, scan);
    if (Array.isArray(copy.products)) copy.products = stripPhotos(copy.products);
    return copy;
  }

  /* ── Push (upsert via REST) ─────────────────────────────────── */

  async function push(userId, fields) {
    if (!userId) return;
    try {
      const cfg   = getSupabaseConfig();
      const token = await getToken();
      if (!cfg || !token) return;

      const payload = Object.assign(
        { user_id: userId, updated_at: new Date().toISOString() },
        fields
      );

      await fetch(`${cfg.url}/rest/v1/user_data`, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });
      markSynced(userId);
    } catch (_) { /* silencieux — localStorage reste la source de vérité */ }
  }

  /* ── Pull (select via REST) ─────────────────────────────────── */

  async function pull(userId) {
    if (!userId) return null;
    try {
      const cfg   = getSupabaseConfig();
      const token = await getToken();
      if (!cfg || !token) return null;

      const res = await fetch(
        `${cfg.url}/rest/v1/user_data?user_id=eq.${encodeURIComponent(userId)}&limit=1`,
        {
          headers: {
            apikey: cfg.anonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (!data) return null;
      markSynced(userId);
      return data;
    } catch (_) {
      return null;
    }
  }

  /* ── API publique ───────────────────────────────────────────── */

  /**
   * Pousse un ou plusieurs champs en arrière-plan (ne bloque pas).
   * Appeler après chaque saveXxx de user-data.js
   */
  function pushField(field, value) {
    const userId = getUserId();
    if (!userId) return;
    const stripped =
      field === 'products'           ? stripPhotos(value)    :
      field === 'scan_analysis'      ? stripScanPhotos(value) :
      field === 'face_scan_history'  ? value                 :
      value;
    const payload = {};
    payload[field] = stripped;
    push(userId, payload); // fire-and-forget
  }

  /**
   * Charge les données cloud et les retourne si stale.
   * Le appelant (app.js) fusionne dans localStorage si pertinent.
   */
  async function pullIfNeeded(userId) {
    if (!userId || !isStale(userId)) return null;
    const remote = await pull(userId);
    if (!remote) return null;
    return remote;
  }

  global.VirceneCloudSync = {
    pushField,
    pullIfNeeded,
    push,
    pull,
    stripPhotos,
    stripScanPhotos,
  };
})(window);

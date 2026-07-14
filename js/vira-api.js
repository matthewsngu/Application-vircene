/**
 * Vircène — Client API Vira (mock ↔ live)
 * Workflow : docs/AI-WORKFLOW.md — api.mode dans config.js
 */
(function (global) {
  'use strict';

  function apiConfig() {
    const cfg = global.VIRCENE_CONFIG?.api || {};
    return {
      mode: cfg.mode || 'live',
      viraChat: cfg.viraChat || '/.netlify/functions/vira-chat',
      faceScan: cfg.faceScan || '/.netlify/functions/face-scan',
      timeoutMs: cfg.timeoutMs || 28000,
    };
  }

  function apiMode() {
    return apiConfig().mode;
  }

  function useMock() {
    return apiMode() === 'mock';
  }

  function loadProfileContext(session) {
    if (!session?.id) return null;
    const ctx = { firstName: session.firstName || '' };

    // Diagnostic questionnaire
    try {
      const raw = localStorage.getItem('vircene_user_' + session.id + '_diagnostic');
      if (raw) {
        const d = JSON.parse(raw);
        ctx.skinType = d.skinType || d.skin_type || '';
        ctx.concerns = Array.isArray(d.concernIds) ? d.concernIds : [];
      }
    } catch { /* ignore */ }

    // Vitrine (produits scannés) — max 8 pour limiter les tokens
    try {
      const ud = global.VirceneUserData;
      if (ud) {
        const products = ud.getProducts?.(session.id);
        if (Array.isArray(products) && products.length) {
          ctx.vitrine = products.slice(0, 8).map((p) => ({
            name: [p.brand, p.name].filter(Boolean).join(' '),
            active: p.active || '',
            ingredients: (p.ingredients || []).slice(0, 5),
          }));
        }

        // Dernière analyse de routine
        const routine = ud.getRoutine?.(session.id);
        if (routine?.skinScore != null) {
          ctx.routineScore = {
            skinScore: routine.skinScore,
            compatScore: routine.compatScore,
            alertCount: routine.alertCount || 0,
            summary: routine.skinScoreSummary || '',
          };
        }

        // Dernière analyse de scan INCI
        const scan = ud.getScanAnalysis?.(session.id);
        if (scan) {
          const sessions = Object.values(scan).sort((a, b) =>
            (b.scannedAt || '').localeCompare(a.scannedAt || '')
          );
          const last = sessions[0];
          if (last?.analysis) {
            ctx.lastScanAnalysis = {
              skinScore: last.analysis.skinScore,
              compatScore: last.analysis.compatScore,
              alertCount: last.analysis.alertCount || 0,
              scannedAt: last.scannedAt || '',
            };
          }
        }
      }
    } catch { /* ignore — données optionnelles */ }

    return ctx;
  }

  async function getAuthHeader() {
    try {
      if (global.VirceneAuth && global.VirceneAuth.getAccessToken) {
        const token = await global.VirceneAuth.getAccessToken();
        if (token) return { Authorization: 'Bearer ' + token };
      }
    } catch (_) {}
    return {};
  }

  async function postJson(url, payload) {
    const { timeoutMs } = apiConfig();
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    const authHeaders = await getAuthHeader();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || ('HTTP ' + res.status));
      }
      return res.json();
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  async function chat(options) {
    options = options || {};
    if (useMock() && global.VirceneAIMocks?.chat) {
      return global.VirceneAIMocks.chat(options);
    }
    const { viraChat } = apiConfig();
    return postJson(viraChat, {
      message: options.message,
      history: options.history || [],
      scanContext: options.scanContext || null,
      profile: options.profile || null,
    });
  }

  async function analyzeFace(imageDataUrl) {
    if (useMock() && global.VirceneAIMocks?.analyzeFace) {
      return global.VirceneAIMocks.analyzeFace(imageDataUrl);
    }
    const { faceScan } = apiConfig();
    return postJson(faceScan, { image: imageDataUrl });
  }

  global.VirceneViraAPI = {
    chat,
    analyzeFace,
    loadProfileContext,
    apiConfig,
    apiMode,
    useMock,
  };
})(window);

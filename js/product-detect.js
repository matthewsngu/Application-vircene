/**
 * Vircène — Détection produits (API vision + mock + fallback démo)
 */
(function (global) {
  'use strict';

  const DEMO_PRODUCTS = [
    {
      brand: 'The Ordinary',
      name: 'Vitamin C Suspension 23%',
      active: 'vitc',
      ingredients: ['Ascorbic Acid', 'Squalane', 'Dimethicone'],
      description: 'Vitamine C pure pour l\'éclat — matin uniquement.'
    },
    {
      brand: 'The Ordinary',
      name: 'Niacinamide 10%',
      active: 'niacinamide',
      ingredients: ['Niacinamide', 'Zinc PCA', 'Glycerine'],
      description: 'Régule le sébum et resserre l\'apparence des pores.'
    },
    {
      brand: 'La Roche-Posay',
      name: 'Toleriane Crème',
      active: 'creme',
      ingredients: ['Glycerine', 'Niacinamide', 'Ceramides'],
      description: 'Hydrate et renforce la barrière cutanée sans parfum.'
    }
  ];

  const MAX_PAYLOAD_CHARS = 4_500_000;

  function isMockMode() {
    return global.VIRCENE_CONFIG?.api?.mode === 'mock';
  }

  function resolveDetectUrl() {
    return global.VIRCENE_CONFIG?.api?.detectProducts || '/.netlify/functions/detect-products';
  }

  function demoFromUrls(urls) {
    const count = Math.min(urls.length, DEMO_PRODUCTS.length);
    return DEMO_PRODUCTS.slice(0, count).map(function (p, i) {
      return Object.assign({}, p, { photoIndex: i, photoUrl: urls[i] });
    });
  }

  function compressDataUrl(dataUrl) {
    return new Promise(function (resolve) {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
        resolve(dataUrl);
        return;
      }
      if (dataUrl.length < 350000) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = function () {
        try {
          const maxSide = 1280;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch (_) {
          resolve(dataUrl);
        }
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  async function prepareImages(images) {
    const raw = (images || [])
      .map(function (img) { return img.dataUrl || img; })
      .filter(Boolean)
      .slice(0, 3);
    const compressed = await Promise.all(raw.map(compressDataUrl));
    return compressed;
  }

  async function detectProducts(images) {
    const urls = await prepareImages(images);

    if (!urls.length) {
      return {
        products: DEMO_PRODUCTS.map(function (p, i) {
          return Object.assign({}, p, { photoIndex: i });
        }),
        source: 'demo-empty'
      };
    }

    if (isMockMode() && global.VirceneAIMocks?.detectProducts) {
      console.info('[Vircène] detect-products → mock');
      return global.VirceneAIMocks.detectProducts(urls);
    }

    const endpoint = resolveDetectUrl();
    const payload = JSON.stringify({ images: urls });
    if (payload.length > MAX_PAYLOAD_CHARS) {
      console.warn('[Vircène] detect-products: image trop lourde après compression');
      return { products: demoFromUrls(urls), source: 'demo', apiError: 'Image trop lourde' };
    }

    try {
      console.info('[Vircène] detect-products →', endpoint);
      const timeoutMs = global.VIRCENE_CONFIG?.api?.timeoutMs || 45000;
      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
      let authHeader = {};
      try {
        if (global.VirceneAuth && global.VirceneAuth.getAccessToken) {
          const token = await global.VirceneAuth.getAccessToken();
          if (token) authHeader = { Authorization: 'Bearer ' + token };
        }
      } catch (_) {}
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader),
        body: payload,
        signal: controller.signal
      });
      clearTimeout(timer);

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        data = {};
      }

      if (!res.ok) {
        console.warn('[Vircène] detect-products HTTP', res.status, data);
        const errMsg = data.error || ('HTTP ' + res.status);
        const hint = /quota|billing|credit|insufficient|payment|funds/i.test(String(errMsg))
          ? errMsg
          : (errMsg === 'Détection indisponible'
            ? 'OpenAI a refusé la requête — vérifie tes crédits sur platform.openai.com/billing'
            : errMsg);
        return {
          products: demoFromUrls(urls),
          source: 'demo',
          apiError: hint
        };
      }

      const products = (data.products || []).map(function (p, i) {
        return Object.assign({}, p, { photoIndex: i, photoUrl: urls[i] || urls[0] });
      });

      console.info('[Vircène] detect-products OK —', products.length, 'produit(s)');
      return { products: products, source: 'api', apiError: products.length ? '' : 'Aucun produit reconnu sur la photo' };
    } catch (err) {
      console.warn('[Vircène] detect-products échec:', err);
      return {
        products: demoFromUrls(urls),
        source: 'demo',
        apiError: err && err.message ? err.message : 'Réseau'
      };
    }
  }

  global.VirceneProductDetect = {
    detectProducts: detectProducts,
    DEMO_PRODUCTS: DEMO_PRODUCTS
  };
})(window);

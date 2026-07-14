/**
 * Vircène — Compatibilité produits (analyse-cutanee.html)
 * Scanner Cal AI → API vision → scores compatibilité
 */
(function (global) {
  'use strict';

  let scanDestroy = null;

  function getRoot() {
    return document.getElementById('analyseRoot');
  }

  function clearRoot() {
    if (scanDestroy) {
      scanDestroy();
      scanDestroy = null;
    }
    const root = getRoot();
    if (root) root.replaceChildren();
  }

  function mountScreen(element) {
    element.classList.add('is-active', 'is-visible');
    getRoot().appendChild(element);
  }

  function skinContextFromSession(session) {
    const raw = global.VirceneDiagnostic?.loadDiagnostic?.(session.id);
    if (!raw) return {};
    return {
      skinType: raw.skinType || raw.skin_type || '',
      morning: raw.morning || raw.routineMorning || [],
      evening: raw.evening || raw.routineEvening || [],
      concernIds: raw.concerns || raw.concernIds || []
    };
  }

  function showError(message) {
    const root = getRoot();
    if (!root) return;
    document.body.classList.remove('analyse-has-results');
    root.innerHTML = '<div class="analyse-error"><p>' + String(message || 'Erreur de chargement') + '</p></div>';
  }

  function showLoading() {
    const root = getRoot();
    if (!root) return;
    root.innerHTML = '<div class="analyse-error">Chargement du scanner…</div>';
  }

  function showPremiumGate(session) {
    const root = getRoot();
    if (!root) return;
    document.body.classList.remove('analyse-has-results');
    const checkout = global.VircenePaywall?.checkoutDestination?.(session, 'monthly')
      || global.VirceneStripe?.checkoutUrl?.('monthly', session)
      || 'account.html?upgrade=monthly';
    root.innerHTML = `
      <div class="analyse-error">
        <p><strong>Premium requis</strong></p>
        <p>Le scan produits et l'analyse IA sont réservés aux abonnés.</p>
        <p style="margin-top:20px">
          <a class="diag-hero-pill diag-hero-pill--dark" href="${checkout.replace(/"/g, '&quot;')}" style="display:inline-block;text-decoration:none">
            S'abonner — 4,99 €/mois
          </a>
        </p>
      </div>`;
  }

  function mountScanner(session, skinContext) {
    clearRoot();
    document.body.classList.remove('analyse-has-results');

    if (!global.VirceneProductScan?.createScreen) {
      getRoot().innerHTML = '<p class="analyse-error">Scanner indisponible.</p>';
      return;
    }

    const scan = global.VirceneProductScan.createScreen({
      maxProducts: 3,
      standalone: true,
      onBack: function () {
        global.location.href = 'app.html?view=accueil';
      },
      onComplete: function (photos) {
        mountAnalyzing(photos, session, skinContext);
      }
    });

    scanDestroy = scan.destroy;
    mountScreen(scan.element);
  }

  function mountAnalyzing(photos, session, skinContext) {
    clearRoot();

    if (!global.VirceneRoutineResults?.createAnalyzingScreen) {
      mountResults({ products: [], analysis: {} }, session, skinContext);
      return;
    }

    const analyzing = global.VirceneRoutineResults.createAnalyzingScreen(Object.assign({
      photos: photos,
      onComplete: function (data) {
        mountResults(data, session, skinContext);
      }
    }, skinContext));

    mountScreen(analyzing.element);
  }

  function persistScan(session, data) {
    if (!data.products?.length || !global.VirceneUserData?.saveScanAnalysis) return;
    const scannedAt = new Date().toISOString();
    const prepare = global.VirceneScanPhotos?.prepareProductsForStorage
      || function (products) { return Promise.resolve(products || []); };

    prepare(data.products).then(function (storedProducts) {
      try {
        global.VirceneUserData.saveScanAnalysis(session.id, {
          products: storedProducts,
          analysis: data.analysis || {},
          scannedAt: scannedAt
        });
        global.VirceneProductSync?.syncScanToVitrine?.(session.id, storedProducts, scannedAt);
      } catch (err) {
        console.warn('[Vircène analyse] Sauvegarde scan ignorée (quota local):', err);
      }
    });
  }

  function mountResults(data, session, skinContext) {
    clearRoot();

    try {
      document.body.classList.add('analyse-has-results');
      persistScan(session, data);

      if (!global.VirceneRoutineResults?.createResultsScreen) {
        showError('Résultats indisponibles.');
        return;
      }

      const results = global.VirceneRoutineResults.createResultsScreen(Object.assign({
        products: data.products || [],
        analysis: data.analysis || {},
        onBack: function () {
          mountScanner(session, skinContext);
        },
        onDone: function () {
          global.location.href = 'app.html?view=analyse';
        }
      }, skinContext));

      mountScreen(results.element);
      results.element.classList.add('is-revealed');

      if (data.source && data.source !== 'api') {
        const notice = document.createElement('p');
        notice.className = 'analyse-source-notice';
        if (data.source === 'mock') {
          notice.textContent = 'Mode démo — mets api.mode sur live pour lire ta vraie étiquette.';
        } else if (data.apiError) {
          notice.textContent = 'API : ' + data.apiError + ' — résultats de secours affichés.';
        } else {
          notice.textContent = 'API indisponible — résultats de secours. Redémarre le serveur dev ou teste sur vircene.netlify.app.';
        }
        results.element.querySelector('.rr-shell')?.prepend(notice);
      } else if (data.apiError) {
        const notice = document.createElement('p');
        notice.className = 'analyse-source-notice';
        notice.textContent = data.apiError;
        results.element.querySelector('.rr-shell')?.prepend(notice);
      }

      const footer = document.createElement('div');
      footer.className = 'analyse-results-footer';
      footer.innerHTML = `
        <button type="button" class="analyse-results-rescan" data-action="rescan">Rescanner</button>
        <button type="button" class="analyse-results-done diag-hero-pill diag-hero-pill--dark" data-action="done">Mon analyse →</button>
      `;
      results.element.querySelector('.rr-shell')?.appendChild(footer);

      footer.querySelector('[data-action="rescan"]')?.addEventListener('click', function () {
        mountScanner(session, skinContext);
      });
      footer.querySelector('[data-action="done"]')?.addEventListener('click', function () {
        global.location.href = 'app.html?view=analyse';
      });
    } catch (err) {
      document.body.classList.remove('analyse-has-results');
      const detail = err && err.message ? ' (' + err.message + ')' : '';
      showError('Impossible d\'afficher les résultats' + detail + '. Recharge la page ou rescanne.');
      console.error('[Vircène analyse]', err);
    }
  }

  async function init() {
    showLoading();
    try {
      let session = global.VirceneAuth?.readSession?.();
      if (!session && global.VirceneAuth?.resolveAuthOnLoad) {
        try {
          session = await global.VirceneAuth.resolveAuthOnLoad();
        } catch {
          session = null;
        }
      }
      if (!session) {
        global.location.replace('login.html?next=analyse-cutanee.html');
        return;
      }

      const premium = global.VircenePaywall?.isPremium?.(session)
        || global.VirceneAuth?.isPremiumSession?.(session);
      if (!premium) {
        global.VirceneAuth.requirePremiumOrRedirect(session);
        setTimeout(function () {
          if (global.location.pathname.indexOf('analyse-cutanee') !== -1) {
            showPremiumGate(session);
          }
        }, 600);
        return;
      }

      const skinContext = skinContextFromSession(session);
      mountScanner(session, skinContext);
    } catch (err) {
      showError('Erreur au démarrage du scanner.');
      console.error('[Vircène analyse]', err);
    }
  }

  global.VirceneAnalyseCutanee = { init: init };
})(window);

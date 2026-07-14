/**
 * Vircène — Analyse routine (page 1) + résultats / paywall (page 2)
 */
(function (global) {
  'use strict';

  const esc = global.VirceneRoutineAnalysis?.escapeHtml || function (s) { return String(s || ''); };
  const MIN_ANALYZE_MS = 8000;
  const LOAD_TICK_MS = 48;

  const LOAD_PHASES = [
    {
      label: 'Lecture des étiquettes',
      status: 'Vircène décode les listes INCI de tes produits…'
    },
    {
      label: 'Reconnaissance des produits',
      status: 'Identification des formules et des actifs clés…'
    },
    {
      label: 'Croisement des actifs',
      status: 'Analyse des synergies et incompatibilités…'
    },
    {
      label: 'Score de compatibilité',
      status: 'Calcul du score avec ton profil peau…'
    }
  ];

  function formatTime() {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function isUnlocked() {
    if (global.VircenePaywall?.isPremium) {
      const session = global.VirceneAuth?.readSession?.();
      if (session && global.VircenePaywall.isPremium(session)) return true;
    }
    try {
      return global.location.search.indexOf('unlocked=1') !== -1;
    } catch (_) {
      return false;
    }
  }

  function subscribeUrl() {
    const session = global.VirceneAuth?.readSession?.();
    if (session && global.VircenePaywall && !global.VircenePaywall.isPremium(session)) {
      return global.VircenePaywall.checkoutDestination(session, 'monthly');
    }
    try {
      sessionStorage.setItem('vircene_checkout_plan', 'monthly');
    } catch (_) { /* ignore */ }
    return 'register.html?plan=monthly';
  }

  function buildAnalysis(products, options) {
    return global.VirceneRoutineAnalysis.buildAnalysis(products, {
      skinType: options.skinType,
      morning: options.morning,
      evening: options.evening,
      concernIds: options.concernIds
    });
  }

  function detectProducts(photos) {
    return global.VirceneProductDetect.detectProducts(photos).catch(function () {
      return {
        products: (global.VirceneProductDetect.DEMO_PRODUCTS || []).slice(0, Math.max(photos.length, 1)).map(function (p, i) {
          return Object.assign({}, p, {
            photoIndex: i,
            photoUrl: photos[i] && (photos[i].dataUrl || photos[i])
          });
        })
      };
    });
  }

  function renderHeroPhotos(products) {
    return products.map(function (p, i) {
      const src = p.photoUrl || '';
      return `
        <div class="rr-hero-item" style="--rr-i:${i}">
          <img src="${esc(src)}" alt="" loading="lazy" />
        </div>
      `;
    }).join('');
  }

  function alertTooltipLines(analysis) {
    return (analysis.pairs || [])
      .filter(function (p) { return p.status === 'avoid' || p.status === 'caution'; })
      .map(function (p) {
        const title = p.title || 'Interaction';
        const detail = p.summary || p.why || p.body || '';
        return title + ' — ' + detail;
      });
  }

  function wrapHoverTip(innerHtml, lines) {
    if (!lines || !lines.length) return innerHtml;
    const items = lines.map(function (line) {
      return '<li>' + esc(line) + '</li>';
    }).join('');
    return (
      '<span class="rr-hover-tip" tabindex="0" role="button" aria-label="' + esc(lines.join('. ')) + '">' +
        innerHtml +
        '<span class="rr-hover-tip__pop" role="tooltip">' +
          '<ul class="rr-hover-tip__list">' + items + '</ul>' +
        '</span>' +
      '</span>'
    );
  }

  function renderStatusTags(tags, analysis) {
    const tooltipLines = alertTooltipLines(analysis || {});
    return tags.map(function (tag) {
      const isAlert = tag.indexOf('Alertes') === 0;
      const isWarn = tag.indexOf('À espacer') === 0 || tag.indexOf('À séparer') === 0 || tag.indexOf('Ordre à') === 0;
      const cls = isAlert ? ' rr-tag--alert' : (isWarn ? ' rr-tag--warn' : ' rr-tag--ok');
      const chip = '<span class="rr-tag' + cls + '">' + esc(tag) + '</span>';
      if ((isAlert || isWarn) && tooltipLines.length) {
        return wrapHoverTip(chip, tooltipLines);
      }
      return chip;
    }).join('');
  }

  function renderProductProfitability(products, productScores) {
    const scores = productScores || [];
    return products.map(function (p, i) {
      const profit = scores[i] || { score: 7, verdict: 'Analyse en cours', detail: '' };
      const pct = Math.round(profit.score * 10);
      const tone = profit.score >= 8 ? ' rr-profit-row--high' : (profit.score >= 6 ? ' rr-profit-row--mid' : ' rr-profit-row--low');
      return `
        <article class="rr-profit-row${tone}">
          <div class="rr-profit-thumb">
            <img src="${esc(p.photoUrl || '')}" alt="" loading="lazy" />
          </div>
          <div class="rr-profit-body">
            <h3 class="rr-profit-name">${esc(p.brand)} — ${esc(p.name)}</h3>
            <div class="rr-profit-score-row">
              <span class="rr-profit-score">${esc(String(profit.score).replace('.', ','))}<span>/10</span></span>
              <div class="rr-profit-bar" aria-hidden="true"><span class="rr-profit-bar-fill" style="width:${pct}%"></span></div>
            </div>
            <p class="rr-profit-verdict">${esc(profit.verdict)}</p>
            <p class="rr-profit-detail">${esc(profit.detail)}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  function activeMeta(active) {
    return global.VirceneRoutineAnalysis?.activeMeta?.(active) || { label: active, timing: 'matin-soir', hint: '' };
  }

  function timingLabel(timing) {
    if (timing === 'matin') return 'Matin';
    if (timing === 'soir') return 'Soir';
    if (timing === 'matin-soir') return 'Matin · Soir';
    return timing;
  }

  function renderCompatHero(analysis) {
    return `
      <div class="rr-compat-hero">
        <p class="rr-compat-hero-score">${esc(String(analysis.compatScore || '—'))}<span>/10</span></p>
        <div class="rr-compat-hero-copy">
          <p class="rr-compat-hero-title">${esc(analysis.headline || '')}</p>
          <p class="rr-compat-hero-sub">${esc(analysis.compatSummary || '')}</p>
        </div>
      </div>
      <div class="rr-tags">${renderStatusTags(analysis.statusTags || [], analysis)}</div>
    `;
  }

  function renderActivesSection(products) {
    return products.map(function (p) {
      const meta = activeMeta(p.active);
      const chips = (p.ingredients || []).slice(0, 4).map(function (ing) {
        return `<span class="rr-ing-chip">${esc(ing)}</span>`;
      }).join('');
      return `
        <article class="rr-active-card">
          <div class="rr-active-thumb">
            <img src="${esc(p.photoUrl || '')}" alt="" loading="lazy" />
          </div>
          <div class="rr-active-body">
            <div class="rr-active-top">
              <h3 class="rr-active-name">${esc(p.brand)} — ${esc(p.name)}</h3>
              <span class="rr-active-badge">${esc(meta.label)}</span>
            </div>
            <p class="rr-active-timing">${esc(timingLabel(meta.timing))}${meta.hint ? ' · ' + esc(meta.hint) : ''}</p>
            <div class="rr-ing-chips">${chips}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  function pairStatusLabel(status) {
    if (status === 'avoid') return 'S\'annulent';
    if (status === 'caution') return 'Attention';
    return 'Synergie';
  }

  function pairDetailBlock(label, text) {
    if (!text) return '';
    return `
      <div class="rr-pair-detail">
        <p class="rr-pair-detail-label">${esc(label)}</p>
        <p class="rr-pair-detail-text">${esc(text)}</p>
      </div>
    `;
  }

  function renderCompatSection(pairs) {
    if (!pairs.length) {
      return `
        <p class="rr-compat-intro">Chaque duo d'actifs a été croisé pour détecter synergies, incompatibilités et précautions.</p>
        <p class="rr-pair-empty">Aucun conflit majeur entre tes actifs — tu peux suivre l'ordre proposé.</p>
      `;
    }

    const avoid = pairs.filter(function (p) { return p.status === 'avoid'; });
    const caution = pairs.filter(function (p) { return p.status === 'caution'; });
    const ok = pairs.filter(function (p) { return p.status === 'ok'; });

    function renderGroup(groupPairs, groupLabel) {
      if (!groupPairs.length) return '';
      return `
        <div class="rr-pair-group">
          <h3 class="rr-pair-group-title">${esc(groupLabel)}</h3>
          ${groupPairs.map(function (pair) { return renderPairCard(pair); }).join('')}
        </div>
      `;
    }

    return `
      <p class="rr-compat-intro">Chaque duo d'actifs a été croisé : pourquoi ça interagit, ce que tu peux ressentir sur ta peau, et quoi faire concrètement.</p>
      ${renderGroup(avoid, 'À séparer — actifs qui s\'annulent')}
      ${renderGroup(caution, 'Attention — à espacer ou tester')}
      ${renderGroup(ok, 'Synergies — se marient bien')}
    `;
  }

  function renderPairCard(pair) {
    const cls = pair.status === 'avoid'
      ? ' rr-pair--avoid'
      : (pair.status === 'caution' ? ' rr-pair--caution' : ' rr-pair--ok');
    const badgeCls = pair.status === 'avoid'
      ? ' rr-pair-badge--avoid'
      : (pair.status === 'caution' ? ' rr-pair-badge--caution' : ' rr-pair-badge--ok');
    const summary = pair.summary || pair.body || '';
    const why = pair.why || '';
    const onSkin = pair.onSkin || '';
    const action = pair.tip || '';

    return `
      <article class="rr-pair${cls}">
        <div class="rr-pair-head">
          <div class="rr-pair-head-copy">
            <p class="rr-pair-title">${esc(pair.title)}</p>
            ${pair.productContext ? `<p class="rr-pair-products">${esc(pair.productContext)}</p>` : ''}
          </div>
          <span class="rr-pair-badge${badgeCls}">${esc(pairStatusLabel(pair.status))}</span>
        </div>
        ${summary ? `<p class="rr-pair-summary">${esc(summary)}</p>` : ''}
        <div class="rr-pair-details">
          ${pairDetailBlock('Pourquoi', why)}
          ${pairDetailBlock('Sur ta peau', onSkin)}
          ${pairDetailBlock('Que faire', action)}
        </div>
      </article>
    `;
  }

  function renderPairs(pairs) {
    return renderCompatSection(pairs);
  }

  function renderRoutineTimeline(steps, periodLabel) {
    if (!steps.length) {
      return `<p class="rr-order-empty">Aucun produit prévu pour le ${esc(periodLabel.toLowerCase())}.</p>`;
    }
    return `
      <ol class="rr-order-list">
        ${steps.map(function (step) {
          return `
            <li class="rr-order-step">
              <span class="rr-order-num" aria-hidden="true">${step.step}</span>
              <div class="rr-order-body">
                <p class="rr-order-active">${esc(step.activeLabel)}</p>
                <p class="rr-order-product">${esc(step.brand)} — ${esc(step.name)}</p>
                ${step.hint ? `<p class="rr-order-hint">${esc(step.hint)}</p>` : ''}
              </div>
            </li>
          `;
        }).join('')}
      </ol>
    `;
  }

  function renderRoutineOrder(analysis) {
    const order = analysis.routineOrder || { morning: [], evening: [], notes: [] };
    const notes = (order.notes || []).map(function (note) {
      return `<li class="rr-order-note">${esc(note)}</li>`;
    }).join('');

    return `
      <div class="rr-order-grid">
        <section class="rr-order-block">
          <h3 class="rr-order-period">Matin</h3>
          ${renderRoutineTimeline(order.morning || [], 'Matin')}
        </section>
        <section class="rr-order-block">
          <h3 class="rr-order-period">Soir</h3>
          ${renderRoutineTimeline(order.evening || [], 'Soir')}
        </section>
      </div>
      ${notes ? `<ul class="rr-order-notes">${notes}</ul>` : ''}
    `;
  }

  function renderLockedResults(products, analysis) {
    const preview = products.slice(0, 2).map(function (p) {
      const meta = activeMeta(p.active);
      return `<span class="rr-lock-chip">${esc(meta.label)}</span>`;
    }).join('');
    const pairCount = (analysis.pairs || []).length;
    return `
      <div class="rr-results">
        ${renderCompatHero(analysis)}
        <h2 class="rr-section-title">Tes actifs</h2>
        <div class="rr-lock-preview">${preview}</div>
        <p class="rr-lock-teaser">
          ${esc(String(pairCount))} interaction${pairCount > 1 ? 's' : ''} analysée${pairCount > 1 ? 's' : ''}
          · ordre matin / soir personnalisé
        </p>
      </div>
    `;
  }

  function renderUnlockedResults(products, analysis) {
    return `
      <div class="rr-results">
        ${renderCompatHero(analysis)}
        <div class="rr-score-block rr-score-block--skin">
          <div class="rr-score-icon rr-score-icon--skin" aria-hidden="true">♥</div>
          <div class="rr-score-copy">
            <p class="rr-score-label">Adapté à ton profil peau</p>
            <div class="rr-skin-row">
              <span class="rr-score-value rr-score-value--sm">${esc(String(analysis.skinScore || '—') + '/10')}</span>
              <div class="rr-progress"><span class="rr-progress-fill" style="width:${(analysis.skinScore || 0) * 10}%"></span></div>
            </div>
            ${analysis.skinScoreSummary ? '<p class="rr-skin-hint">' + esc(analysis.skinScoreSummary) + '</p>' : ''}
          </div>
        </div>
        <h2 class="rr-section-title">Tes actifs</h2>
        <div class="rr-actives">${renderActivesSection(products)}</div>
        <h2 class="rr-section-title">Compatibilité entre actifs</h2>
        <div class="rr-pairs">${renderPairs(analysis.pairs || [])}</div>
        <h2 class="rr-section-title">Ordre d'application</h2>
        ${renderRoutineOrder(analysis)}
      </div>
    `;
  }

  function renderLoadPhotos(photos) {
    return photos.map(function (photo, i) {
      const src = photo.dataUrl || photo;
      return `
        <div class="rr-load-photo" style="--rr-i:${i}">
          <img src="${esc(src)}" alt="" />
        </div>
      `;
    }).join('');
  }

  /** Page 1 — écran d'analyse plein écran */
  function createAnalyzingScreen(options) {
    options = options || {};
    const photos = options.photos || [];
    const onComplete = typeof options.onComplete === 'function' ? options.onComplete : function () {};

    const el = document.createElement('section');
    el.className = 'diag-screen diag-screen--routine-analyzing';
    el.dataset.screen = 'routineAnalyzing';

    el.innerHTML = `
      <div class="rr-loading">
        <div class="rr-load-inner">
          <p class="rr-load-kicker">Analyse de ta routine</p>
          <h2 class="rr-load-title">On décrypte tes produits</h2>
          ${photos.length ? `<div class="rr-load-photos">${renderLoadPhotos(photos)}</div>` : ''}
          <ol class="rr-load-steps" data-load-steps>
            ${LOAD_PHASES.map(function (phase, i) {
              return '<li' + (i === 0 ? ' class="is-active"' : '') + ' data-step="' + i + '">' + esc(phase.label) + '</li>';
            }).join('')}
          </ol>
          <div class="rr-load-bar" aria-hidden="true"><span class="rr-load-bar-fill" data-load-bar style="width:0"></span></div>
          <p class="rr-loading-sub" data-load-status>${esc(LOAD_PHASES[0].status)}</p>
        </div>
      </div>
    `;

    const loadSteps = el.querySelectorAll('[data-load-steps] li');
    const loadBar = el.querySelector('[data-load-bar]');
    const loadStatus = el.querySelector('[data-load-status]');
    let loadProgressTimer = null;
    let finished = false;
    const startedAt = Date.now();
    let pendingData = null;

    function setStepVisual(activeIndex) {
      loadSteps.forEach(function (item, i) {
        item.classList.toggle('is-active', i === activeIndex);
        item.classList.toggle('is-done', i < activeIndex);
      });
      const phase = LOAD_PHASES[activeIndex];
      if (loadStatus && phase) loadStatus.textContent = phase.status;
    }

    function setBarProgress(ratio) {
      if (!loadBar) return;
      const clamped = Math.max(0, Math.min(ratio, 1));
      loadBar.style.width = (clamped * 100).toFixed(2) + '%';
    }

    function startLoadProgress() {
      const phaseDuration = MIN_ANALYZE_MS / LOAD_PHASES.length;
      let currentStep = 0;
      let phaseStart = Date.now();

      setStepVisual(0);
      setBarProgress(0);

      loadProgressTimer = setInterval(function () {
        if (finished) return;

        const now = Date.now();
        const phaseElapsed = now - phaseStart;
        const phaseRatio = Math.min(phaseElapsed / phaseDuration, 1);
        const overallRatio = (currentStep + phaseRatio) / LOAD_PHASES.length;

        setBarProgress(overallRatio);

        if (phaseRatio >= 1 && currentStep < LOAD_PHASES.length - 1) {
          currentStep += 1;
          phaseStart = now;
          setStepVisual(currentStep);
        }
      }, LOAD_TICK_MS);
    }

    function stopLoadProgress() {
      if (loadProgressTimer) {
        clearInterval(loadProgressTimer);
        loadProgressTimer = null;
      }
      loadSteps.forEach(function (item) {
        item.classList.add('is-done');
        item.classList.remove('is-active');
      });
      setBarProgress(1);
      if (loadStatus) {
        loadStatus.textContent = 'Analyse terminée — préparation de tes résultats…';
      }
    }

    function tryFinish() {
      if (finished || !pendingData) return;
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_ANALYZE_MS - elapsed);
      setTimeout(function () {
        if (finished) return;
        finished = true;
        stopLoadProgress();
        el.classList.add('is-complete');
        setTimeout(function () {
          onComplete(pendingData);
        }, 520);
      }, wait);
    }

    startLoadProgress();

    detectProducts(photos).then(function (result) {
      const products = result.products || [];
      pendingData = {
        products: products,
        analysis: buildAnalysis(products, options),
        source: result.source || 'api',
        apiError: result.apiError || ''
      };
      tryFinish();
    });

    return { element: el };
  }

  function compatScoreTipLines(analysis) {
    if (analysis.compatScoreTipLines && analysis.compatScoreTipLines.length) {
      return analysis.compatScoreTipLines;
    }
    const build = global.VirceneRoutineAnalysis?.buildCompatScoreTipLines;
    return build ? build(analysis) : [];
  }

  function renderMetaAlerts(analysis) {
    const alertCount = analysis.alertCount || 0;
    const synergyCount = analysis.synergyCount || 0;
    const tooltipLines = alertTooltipLines(analysis);
    const optimChip = synergyCount > 0
      ? '<span class="rr-meta-chip rr-meta-chip--optim">' + esc(synergyCount + ' synergie' + (synergyCount > 1 ? 's' : '')) + '</span>'
      : (alertCount === 0
        ? wrapHoverTip(
          '<span class="rr-meta-chip rr-meta-chip--optim">Routine compatible</span>',
          compatScoreTipLines(analysis)
        )
        : '');

    let conflictChip;
    if (alertCount > 0) {
      const inner =
        '<span class="rr-meta-chip rr-meta-chip--conflict">' +
        esc(alertCount + ' alerte' + (alertCount > 1 ? 's' : '')) +
        '</span>';
      conflictChip = wrapHoverTip(inner, tooltipLines);
    } else {
      conflictChip = '<span class="rr-meta-chip rr-meta-chip--ok">Aucun conflit</span>';
    }

    return '<div class="rr-meta-alerts">' + optimChip + conflictChip + '</div>';
  }

  /** Page 2 — révélation + résultats floutés + paywall */
  function createResultsScreen(options) {
    options = options || {};
    const products = options.products || [];
    const analysis = options.analysis || {};
    const onDone = typeof options.onDone === 'function' ? options.onDone : function () {};
    const unlocked = isUnlocked();

    const el = document.createElement('section');
    el.className = 'diag-screen diag-screen--routine-results';
    el.dataset.screen = 'routineResults';

    el.innerHTML = `
      <div class="rr-shell">
        <header class="rr-head">
          <button type="button" class="rr-head-btn" data-action="back" aria-label="Retour">←</button>
          <h1 class="rr-head-title">Routine</h1>
          <button type="button" class="rr-head-btn rr-head-btn--ghost" data-action="share" aria-label="Partager">↗</button>
        </header>
        <div class="rr-hero" data-hero>${renderHeroPhotos(products)}</div>
        <div class="rr-card">
          <div class="rr-card-meta">
            <span class="rr-meta-time">${esc(formatTime())}</span>
            <span class="rr-meta-dot" aria-hidden="true">·</span>
            <span class="rr-meta-count">${esc(products.length + ' produit' + (products.length > 1 ? 's' : '') + ' scanné' + (products.length > 1 ? 's' : ''))}</span>
          </div>
          ${renderMetaAlerts(analysis)}
          <div class="rr-card-inner${unlocked ? ' is-unlocked' : ''}">
            ${unlocked ? renderUnlockedResults(products, analysis) : renderLockedResults(products, analysis)}
            <div class="rr-paywall" data-paywall${unlocked ? ' hidden' : ''}>
              <div class="rr-paywall-card">
                <p class="rr-paywall-kicker">L'instant Vircène</p>
                <h2 class="rr-paywall-title">Ton analyse est prête</h2>
                <p class="rr-paywall-lead">${esc(analysis.compatSummary || analysis.headline || '')}</p>
                <p class="rr-paywall-price">4,99&nbsp;€<span>/mois</span></p>
                <button type="button" class="diag-hero-pill diag-hero-pill--dark rr-paywall-cta" data-action="subscribe">
                  Débloquer mon analyse
                </button>
                <p class="rr-paywall-note">Sans engagement · Annulable à tout moment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('is-revealed');
      });
    });

    const analysisData = { products: products, analysis: analysis };

    el.querySelector('[data-action="subscribe"]')?.addEventListener('click', function () {
      if (typeof options.onSubscribe === 'function') options.onSubscribe();
      global.location.href = subscribeUrl();
    });

    el.querySelector('[data-action="back"]')?.addEventListener('click', function () {
      if (unlocked) {
        onDone(analysisData);
        return;
      }
      if (typeof options.onBack === 'function') options.onBack();
    });

    el.querySelector('[data-action="share"]')?.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({
          title: 'Ma routine Vircène',
          text: 'J\'ai scanné ma routine skincare avec Vircène.',
          url: global.location.href
        }).catch(function () { /* ignore */ });
      }
    });

    return { element: el };
  }

  /** Compat — ancien appel unique */
  function createScreen(options) {
    options = options || {};
    const photos = options.photos || [];
    const el = document.createElement('div');
    el.style.display = 'none';
    document.body.appendChild(el);

    const analyzing = createAnalyzingScreen(Object.assign({}, options, {
      onComplete: function (data) {
        el.remove();
        const results = createResultsScreen(Object.assign({}, options, {
          products: data.products,
          analysis: data.analysis
        }));
        if (options._mountTarget) {
          options._mountTarget.replaceChildren(results.element);
        }
      }
    }));

    return analyzing;
  }

  global.VirceneRoutineResults = {
    createAnalyzingScreen: createAnalyzingScreen,
    createResultsScreen: createResultsScreen,
    createScreen: createScreen,
    isUnlocked: isUnlocked
  };
})(window);

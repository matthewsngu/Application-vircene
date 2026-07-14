/**
 * Vircène — Page « Mon analyse » (synthèse du scan produits)
 */
(function (global) {
  'use strict';

  const esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  function activeMeta(active) {
    return global.VirceneRoutineAnalysis?.activeMeta?.(active) || {
      label: active,
      timing: 'matin-soir',
      hint: ''
    };
  }

  function timingLabel(timing) {
    if (timing === 'matin') return 'Matin';
    if (timing === 'soir') return 'Soir';
    if (timing === 'matin-soir') return 'Matin · Soir';
    return timing;
  }

  function formatScanDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return '';
    }
  }

  function pairStatusLabel(status) {
    if (status === 'avoid') return 'S\'annulent';
    if (status === 'caution') return 'Attention';
    return 'Synergie';
  }

  function pairStatusClass(status) {
    if (status === 'avoid') return 'ma-pair--avoid';
    if (status === 'caution') return 'ma-pair--caution';
    return 'ma-pair--ok';
  }

  function renderEmpty() {
    return `
      <div class="peau-main__panel mon-analyse-panel">
        <p class="peau-panel-title">Mon analyse</p>
        <p class="peau-lead">Ta synthèse après scan de produits</p>
        <div class="mon-analyse-empty">
          <p>Tu n'as pas encore scanné de produits. Lance un scan pour voir tes actifs, leur compatibilité et l'ordre d'application.</p>
          <a href="analyse-cutanee.html" class="app-scan-btn app-scan-btn--primary mon-analyse-cta">Scanner mes produits</a>
        </div>
      </div>
    `;
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

  function compatScoreTipLines(analysis) {
    if (analysis.compatScoreTipLines && analysis.compatScoreTipLines.length) {
      return analysis.compatScoreTipLines;
    }
    const build = global.VirceneRoutineAnalysis?.buildCompatScoreTipLines;
    return build ? build(analysis) : [];
  }

  function renderMetaChips(analysis) {
    const alertCount = analysis.alertCount || 0;
    const synergyCount = analysis.synergyCount || 0;
    const tooltipLines = alertTooltipLines(analysis);
    const chips = [];

    if (alertCount === 0) {
      chips.push('<span class="ma-chip ma-chip--ok">Aucun conflit</span>');
    } else {
      const inner = '<span class="ma-chip ma-chip--warn">' + esc(alertCount + ' alerte' + (alertCount > 1 ? 's' : '')) + '</span>';
      chips.push(wrapHoverTip(inner, tooltipLines));
    }
    if (synergyCount > 0) {
      chips.push('<span class="ma-chip ma-chip--gold">' + esc(synergyCount + ' synergie' + (synergyCount > 1 ? 's' : '')) + '</span>');
    } else if (alertCount === 0) {
      const inner = '<span class="ma-chip ma-chip--gold">Routine compatible</span>';
      chips.push(wrapHoverTip(inner, compatScoreTipLines(analysis)));
    }
    return chips.join('');
  }

  function renderActives(products, userId) {
    return products.map(function (p) {
      const meta = activeMeta(p.active);
      const ings = (p.ingredients || []).slice(0, 3).map(function (ing) {
        return '<span class="ma-ing">' + esc(ing) + '</span>';
      }).join('');
      const photo = global.VirceneScanPhotos?.resolveProductPhoto?.(p, userId) || '';
      const thumb = photo
        ? '<img src="' + esc(photo) + '" alt="" loading="lazy">'
        : '<span class="ma-active-fallback">' + esc((p.brand || '?').charAt(0)) + '</span>';
      return `
        <article class="ma-active">
          <div class="ma-active-thumb${photo ? ' ma-active-thumb--photo' : ''}">${thumb}</div>
          <div class="ma-active-body">
            <p class="ma-active-brand">${esc(p.brand)}</p>
            <p class="ma-active-name">${esc(p.name)}</p>
            <span class="ma-active-badge">${esc(meta.label)}</span>
            <p class="ma-active-timing">${esc(timingLabel(meta.timing))}</p>
            <div class="ma-active-ings">${ings}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderPairDetail(label, text) {
    if (!text) return '';
    return `
      <div class="ma-pair-detail">
        <p class="ma-pair-detail-label">${esc(label)}</p>
        <p class="ma-pair-detail-text">${esc(text)}</p>
      </div>
    `;
  }

  function renderPairs(pairs) {
    if (!pairs.length) {
      return '<p class="ma-muted">Aucun duo d\'actifs à comparer — ajoute des produits avec des actifs distincts.</p>';
    }

    const groups = [
      { key: 'avoid', title: 'À séparer', items: pairs.filter(function (p) { return p.status === 'avoid'; }) },
      { key: 'caution', title: 'Attention', items: pairs.filter(function (p) { return p.status === 'caution'; }) },
      { key: 'ok', title: 'Synergies', items: pairs.filter(function (p) { return p.status === 'ok'; }) }
    ];

    return groups.map(function (group) {
      if (!group.items.length) return '';
      return `
        <div class="ma-pair-group">
          <h3 class="ma-section-sub">${esc(group.title)}</h3>
          ${group.items.map(function (pair) {
            return `
              <article class="ma-pair ${pairStatusClass(pair.status)}">
                <div class="ma-pair-head">
                  <div>
                    <p class="ma-pair-title">${esc(pair.title)}</p>
                    ${pair.productContext ? '<p class="ma-pair-products">' + esc(pair.productContext) + '</p>' : ''}
                  </div>
                  <span class="ma-pair-badge">${esc(pairStatusLabel(pair.status))}</span>
                </div>
                ${pair.summary ? '<p class="ma-pair-summary">' + esc(pair.summary) + '</p>' : ''}
                <div class="ma-pair-details">
                  ${renderPairDetail('Pourquoi', pair.why || pair.body)}
                  ${renderPairDetail('Sur ta peau', pair.onSkin)}
                  ${renderPairDetail('Que faire', pair.tip)}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  }

  function renderOrderBlock(label, steps) {
    if (!steps.length) {
      return '<p class="ma-muted">Aucun produit pour le ' + esc(label.toLowerCase()) + '.</p>';
    }
    return `
      <ol class="ma-order-list">
        ${steps.map(function (step) {
          return `
            <li class="ma-order-step">
              <span class="ma-order-num">${step.step}</span>
              <div>
                <p class="ma-order-active">${esc(step.activeLabel)}</p>
                <p class="ma-order-product">${esc(step.brand)} — ${esc(step.name)}</p>
              </div>
            </li>
          `;
        }).join('')}
      </ol>
    `;
  }

  function renderOrder(analysis) {
    const order = analysis.routineOrder || { morning: [], evening: [], notes: [] };
    const notes = (order.notes || []).map(function (n) {
      return '<li>' + esc(n) + '</li>';
    }).join('');
    return `
      <div class="ma-order-grid">
        <div class="ma-order-col">
          <h3 class="ma-section-sub">Matin</h3>
          ${renderOrderBlock('Matin', order.morning || [])}
        </div>
        <div class="ma-order-col">
          <h3 class="ma-section-sub">Soir</h3>
          ${renderOrderBlock('Soir', order.evening || [])}
        </div>
      </div>
      ${notes ? '<ul class="ma-order-notes">' + notes + '</ul>' : ''}
    `;
  }

  function skinScoreHint(analysis, products, userId) {
    if (analysis.skinScoreSummary) return analysis.skinScoreSummary;
    const score = analysis.skinScore;
    if (score == null) return '';
    const skinType = global.VirceneAuth?.readSession?.()?.skinType
      || global.VirceneAuth?.readSession?.()?.skin_type
      || '';
    const build = global.VirceneRoutineAnalysis?.buildSkinScoreSummary;
    if (build) return build(score, skinType, products);
    const fallback = global.VirceneRoutineAnalysis?.summaryBySkinScore;
    return fallback ? fallback(score) : '';
  }

  function renderData(data, userId) {
    const products = data.products || [];
    const analysis = data.analysis || {};
    const scannedAt = formatScanDate(data.scannedAt);
    const count = products.length;
    const skinHint = skinScoreHint(analysis, products, userId);

    return `
      <div class="peau-main__panel mon-analyse-panel">
        <p class="peau-panel-title">Mon analyse</p>
        <p class="peau-lead">${esc(count + ' produit' + (count > 1 ? 's' : '') + ' scanné' + (count > 1 ? 's' : ''))}${scannedAt ? ' · ' + esc(scannedAt) : ''}</p>

        <div class="ma-hero">
          <p class="ma-hero-score">${esc(String(analysis.compatScore || '—'))}<span>/10</span></p>
          <div class="ma-hero-copy">
            <p class="ma-hero-title">${esc(analysis.headline || 'Synthèse de ta routine')}</p>
            <p class="ma-hero-sub">${esc(analysis.compatSummary || '')}</p>
            <div class="ma-chips">${renderMetaChips(analysis)}</div>
          </div>
        </div>

        <div class="ma-skin-score">
          <div class="ma-skin-score__head">
            <span>Adapté à ton profil</span>
            <strong>${esc(String(analysis.skinScore || '—') + '/10')}</strong>
          </div>
          ${skinHint ? '<p class="ma-skin-score__hint">' + esc(skinHint) + '</p>' : ''}
        </div>

        <section class="ma-section">
          <h2 class="ma-section-title">Tes actifs</h2>
          <div class="ma-actives">${renderActives(products, userId)}</div>
        </section>

        <section class="ma-section">
          <h2 class="ma-section-title">Compatibilité entre actifs</h2>
          <p class="ma-section-lead">Pourquoi ces actifs interagissent, ce que tu peux ressentir, et comment les utiliser.</p>
          ${renderPairs(analysis.pairs || [])}
        </section>

        <section class="ma-section">
          <h2 class="ma-section-title">Ordre d'application</h2>
          ${renderOrder(analysis)}
        </section>

        <div class="ma-footer-actions">
          <a href="analyse-cutanee.html" class="peau-product-add">Rescanner mes produits →</a>
        </div>
      </div>
    `;
  }

  function render(rootEl, userId) {
    if (!rootEl) return;
    const data = global.VirceneUserData?.getScanAnalysis?.(userId);
    rootEl.innerHTML = data && data.products && data.products.length
      ? renderData(data, userId)
      : renderEmpty();
  }

  global.VirceneMonAnalyse = { render: render };
})(window);

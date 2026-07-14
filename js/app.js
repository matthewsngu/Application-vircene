/**
 * Vircène — App (après connexion)
 */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const GOAL_LABELS = {
    eclat: 'Éclat & glass skin',
    acne: 'Points noirs & acné',
    taches: 'Taches & hyperpigmentation',
    antiage: 'Anti-âge & rides',
    hydratation: 'Hydratation & barrière'
  };

  const SKIN_LABELS = {
    normale: 'Normale',
    seche: 'Sèche',
    grasse: 'Grasse',
    mixte: 'Mixte',
    sensible: 'Sensible'
  };

  const ROUTINE = {
    matin: [
      { step: 'Nettoyant doux', product: 'Huile nettoyante Anua', tag: 'Étape 1' },
      { step: 'Sérum vitamine C', product: 'The Ordinary 15%', tag: 'Éclat' },
      { step: 'Crème hydratante', product: 'CeraVe barrière', tag: 'Barrière' },
      { step: 'SPF 50', product: 'À ajouter', tag: 'Protection' }
    ],
    soir: [
      { step: 'Démaquillage', product: 'Huile nettoyante Anua', tag: 'Étape 1' },
      { step: 'Nettoyant', product: 'Nettoyant doux', tag: 'Étape 2' },
      { step: 'Crème hydratante', product: 'CeraVe barrière', tag: 'Réparation' }
    ]
  };

  const DISCLAIMER =
    'Information cosmétique à but informatif — il ne s’agit pas d’un avis médical. ' +
    'En cas de doute, d’allergie ou de réaction, demande conseil à un professionnel de santé.';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function riskDot(level, large) {
    const lvl = level || 'vert';
    return `<span class="risk-dot risk-dot--${lvl}${large ? ' risk-dot--lg' : ''}"></span>`;
  }

  function hasScoring() {
    return typeof window.VirceneScoring !== 'undefined';
  }

  async function bootstrap() {
    let session = VirceneAuth.readSession();

    if (!session || (VirceneAuth.hasOAuthReturn && VirceneAuth.hasOAuthReturn())) {
      try {
        const resolved = await VirceneAuth.resolveAuthOnLoad();
        if (resolved) session = resolved;
      } catch {
        if (!session) session = null;
      }
    }

    if (!session) {
      const returnTo = window.location.pathname.replace(/^\//, '') + window.location.search;
      window.location.replace('login.html?next=' + encodeURIComponent(returnTo));
      return;
    }

    if (root.VircenePaywall && !root.VircenePaywall.isPremium(session)) {
      root.VircenePaywall.redirectToCheckout(session, 'monthly');
      return;
    }

    if (root.VirceneEntrance?.shouldPlay?.()) {
      await root.VirceneEntrance.play(session);
    }

    if (root.VirceneScoring?.ready) {
      await root.VirceneScoring.ready;
    }

  async function analyzeIngredients(names) {
    if (root.VirceneIngredientAI?.isEnabled?.()) {
      return await root.VirceneIngredientAI.analyzeWithAI(names);
    }
    return root.VirceneScoring.analyze(names);
  }

  async function refreshProductsAnalysis() {
    if (!hasScoring()) return;
    var changed = false;
    const updated = [];
    for (const p of userProducts) {
      const names = p.ingredientNames || (p.analysis?.ingredients || []).map(function (i) {
        return i.rawName || i.name;
      });
      if (!names.length) {
        updated.push(p);
        continue;
      }
      const next = await analyzeIngredients(names);
      if (next && (next.dbVersion !== p.analysis?.dbVersion || next.confidence !== p.analysis?.confidence)) {
        changed = true;
        updated.push(Object.assign({}, p, { analysis: next }));
      } else {
        updated.push(p);
      }
    }
    if (changed) {
      userProducts = updated;
      persistProducts();
    }
  }

  const els = {
    greetingTime: document.getElementById('greetingTime'),
    greetingName: document.getElementById('greetingName'),
    greetingNote: document.getElementById('greetingNote'),
    planBadge: document.getElementById('planBadge'),
    scoreRing: null,
    scoreText: document.getElementById('scoreText'),
    scoreDelta: document.getElementById('scoreDelta'),
    scoreContext: document.getElementById('scoreContext'),
    scoreBreakdown: document.getElementById('scoreBreakdown'),
    productsGrid: document.getElementById('productsGrid'),
    productsCount: document.getElementById('productsCount'),
    routineList: document.getElementById('routineList'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profileSkin: document.getElementById('profileSkin'),
    profileGoals: document.getElementById('profileGoals'),
    profileAbout: document.getElementById('profileAbout')
  };

  // Produits utilisateur — persistés localement
  const defaultSeeds = hasScoring()
    ? await Promise.all(
      VirceneScoring.SEED_PRODUCTS.filter(p => p.id !== 'demo-rouge').slice(0, 2).map(async (p) => ({
        name: p.name,
        brand: p.brand,
        emoji: p.emoji,
        ingredientNames: p.ingredients,
        analysis: await analyzeIngredients(p.ingredients)
      }))
    )
    : [];

  // Tente un pull cloud si localStorage est vide ou périmé
  if (root.VirceneCloudSync) {
    const remote = await root.VirceneCloudSync.pullIfNeeded(session.id).catch(() => null);
    if (remote) {
      if (remote.products?.length && !root.VirceneUserData?.getProducts(session.id)?.length) {
        root.VirceneUserData?.saveProducts(session.id, remote.products);
      }
      if (remote.scan_analysis && !root.VirceneUserData?.getScanAnalysis(session.id)) {
        root.VirceneUserData?.saveScanAnalysis(session.id, remote.scan_analysis);
      }
      if (remote.activity?.length && !root.VirceneUserData?.getActivityLog(session.id)?.length) {
        root.VirceneUserData?.saveActivityLog(session.id, remote.activity);
      }
      if (remote.routine && !root.VirceneUserData?.getRoutine(session.id)) {
        root.VirceneUserData?.saveRoutine(session.id, remote.routine);
      }
    }
  }

  let userProducts = root.VirceneProductSync?.loadVitrineFromScan?.(session.id)
    || root.VirceneUserData?.getProducts(session.id);
  if (!userProducts || !userProducts.length) {
    userProducts = defaultSeeds;
    if (root.VirceneUserData) VirceneUserData.saveProducts(session.id, userProducts);
  } else {
    await refreshProductsAnalysis();
  }

  let userPhotos = root.VirceneUserData?.getPhotos(session.id) || [];

  function persistProducts() {
    if (root.VirceneUserData) VirceneUserData.saveProducts(session.id, userProducts);
  }

  function persistPhotos() {
    if (root.VirceneUserData) VirceneUserData.savePhotos(session.id, userPhotos);
  }

  function addProductEntry(name, brand, emoji, analysis, imageUrl, ingredientNames) {
    userProducts.push({
      name,
      brand,
      emoji,
      analysis,
      imageUrl: imageUrl || '',
      ingredientNames: ingredientNames || (analysis?.ingredients || []).map(function (i) {
        return i.rawName || i.name;
      })
    });
    persistProducts();
    renderProducts();
    return true;
  }

  function productDetailHero(p) {
    if (p.imageUrl) {
      return `<img class="prod-detail__img" src="${escapeHtml(p.imageUrl)}" alt="">`;
    }
    const glyph = p.emoji || (p.brand || p.name || '?').charAt(0).toUpperCase();
    const isEmoji = p.emoji && /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(p.emoji);
    return `
      <div class="prod-detail__pedestal">
        ${isEmoji
          ? `<span class="prod-detail__glyph prod-detail__glyph--emoji">${escapeHtml(glyph)}</span>`
          : `<span class="prod-detail__glyph">${escapeHtml(glyph)}</span>`}
      </div>`;
  }

  function buildProductTileHtml(p, index) {
    const a = p.analysis;
    const glyph = p.emoji || (p.brand || p.name || '?').charAt(0).toUpperCase();
    const isEmoji = p.emoji && /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(p.emoji);
    const thumbInner = p.imageUrl
      ? `<img class="prod-tile__photo" src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">`
      : (isEmoji
        ? `<span class="prod-tile__emoji">${escapeHtml(glyph)}</span>`
        : `<span class="prod-tile__initial">${escapeHtml(glyph)}</span>`);
    return `
      <button type="button" class="prod-tile" data-product-index="${index}">
        <span class="prod-tile__thumb" aria-hidden="true">
          ${thumbInner}
        </span>
        <span class="prod-tile__info">
          <span class="prod-tile__brand">${escapeHtml(p.brand)}</span>
          <span class="prod-tile__name">${escapeHtml(p.name)}</span>
        </span>
        <span class="prod-tile__score">
          ${riskDot(a.band, true)}
          <span class="prod-tile__score-num">${a.score}</span>
          <span class="prod-tile__score-label" style="color:${escapeHtml(a.color || '#4caf7a')}">${escapeHtml(a.label)}</span>
        </span>
        <svg class="prod-tile__chev" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
  }

  function ingredientWhyText(ing) {
    if (!ing || ing.level === 'vert') return '';
    if (root.VirceneScoring?.buildRiskExplanation) {
      return root.VirceneScoring.buildRiskExplanation(ing);
    }
    return ing.info || '';
  }

  function buildProductDetailIngredientsHtml(analysis) {
    const a = analysis;
    let visible = a.ingredients.filter((i) => i.level !== 'vert');
    let collapsed = a.ingredients.filter((i) => i.level === 'vert');
    if (!visible.length && collapsed.length) {
      visible = collapsed.slice(0, 3);
      collapsed = collapsed.slice(3);
    }

    const row = (ing) => {
      const why = ingredientWhyText(ing);
      return `
      <li class="prod-detail__ing${why ? ' prod-detail__ing--has-why' : ''}">
        <div class="prod-detail__ing-row">
          <span class="prod-detail__ing-name">${escapeHtml(ing.name)}</span>
          <span class="prod-detail__ing-risk">${riskDot(ing.level)}<span>${escapeHtml(ing.riskLabel)}</span></span>
        </div>
        ${why ? `<p class="prod-detail__ing-why">${escapeHtml(why)}</p>` : ''}
      </li>`;
    };

    const visibleHtml = visible.map(row).join('');
    const collapsedHtml = collapsed.length ? `
      <li class="prod-detail__ing prod-detail__ing--more">
        <button type="button" class="prod-detail__ing-toggle" data-detail-more-toggle>
          <span class="prod-detail__ing-name">${collapsed.length} autre${collapsed.length > 1 ? 's' : ''} ingrédient${collapsed.length > 1 ? 's' : ''}</span>
          <span class="prod-detail__ing-risk">${riskDot('vert')}<span>Sans risque</span></span>
          <svg class="prod-detail__ing-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <ul class="prod-detail__ing-sublist" data-detail-more-list hidden>${collapsed.map(row).join('')}</ul>
      </li>` : '';

    return visibleHtml + collapsedHtml;
  }

  function productDetailSummary(analysis) {
    const risky = analysis.ingredients.filter((i) => i.level === 'rouge' || i.level === 'orange');
    if (analysis.band === 'rouge' || analysis.score <= 24) {
      if (analysis.avoidSummary) return analysis.avoidSummary;
      if (risky.length) {
        return risky.map((ing) => `${ing.name} : ${ingredientWhyText(ing) || ing.riskLabel}`).join(' ');
      }
      return 'Ce produit contient des ingrédients classés à risque selon les référentiels européens (SCCS, ANSM, ECHA).';
    }
    if (analysis.score >= 85) {
      return 'Formulation globalement sûre — peu d’ingrédients à surveiller pour une utilisation quotidienne.';
    }
    if (analysis.score >= 70) {
      return risky.length
        ? `${risky.length} ingrédient${risky.length > 1 ? 's' : ''} mérite${risky.length > 1 ? 'nt' : ''} une attention particulière : ${risky.map((i) => i.name).join(', ')}.`
        : 'Bonne tolérance attendue — quelques actifs à garder en tête selon ta routine.';
    }
    if (risky.length) {
      return risky.map((ing) => `${ing.name} — ${ingredientWhyText(ing) || ing.riskLabel}`).join(' ');
    }
    return 'Plusieurs ingrédients présentent un risque modéré ou élevé — vérifie la compatibilité avec ta peau.';
  }

  function buildProductDetailHtml(p) {
    const a = p.analysis;
    const ingredientsHtml = buildProductDetailIngredientsHtml(a);

    return `
      <div class="prod-detail__hero">
        <button type="button" class="prod-detail__back" data-detail-close aria-label="Retour">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="prod-detail__hero-visual">
          ${productDetailHero(p)}
        </div>
      </div>
      <div class="prod-detail__sheet">
        <div class="prod-detail__handle" aria-hidden="true"></div>
        <div class="prod-detail__head">
          <div>
            <p class="prod-detail__brand">${escapeHtml(p.brand)}</p>
            <h1 class="prod-detail__name">${escapeHtml(p.name)}</h1>
          </div>
        </div>
        <div class="prod-detail__rating" aria-label="Score ${a.score} sur 100">
          <svg class="prod-detail__star" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01L12 2z"/></svg>
          <span class="prod-detail__rating-score">${a.score}<span>/100</span></span>
          <span class="prod-detail__rating-label" style="color:${escapeHtml(a.color || '#4caf7a')}">${escapeHtml(a.label)}</span>
        </div>
        <div class="prod-detail__score-row">
          <p class="prod-detail__score-big">${a.score}<span>/100</span></p>
          <p class="prod-detail__ing-count">${a.ingredients.length} ingrédient${a.ingredients.length > 1 ? 's' : ''} analysé${a.ingredients.length > 1 ? 's' : ''}${a.confidence != null ? ` · confiance ${a.confidence}%` : ''}</p>
        </div>
        ${a.unknownCount > 0 ? `<p class="prod-detail__confidence-note">${a.unknownCount} ingrédient${a.unknownCount > 1 ? 's' : ''} non répertorié${a.unknownCount > 1 ? 's' : ''} — score prudent.</p>` : ''}
        <section class="prod-detail__section">
          <h2 class="prod-detail__section-title">Analyse</h2>
          <p class="prod-detail__summary">${escapeHtml(productDetailSummary(a))}</p>
          ${(a.band === 'rouge' || a.band === 'orange') ? `<p class="prod-detail__avoid-note">Évaluation basée sur les référentiels UE (SCCS, ANSM, ECHA, CIR) — à adapter selon ton type de peau.</p>` : ''}
        </section>
        <section class="prod-detail__section">
          <h2 class="prod-detail__section-title">Ingrédients</h2>
          <ul class="prod-detail__ing-list">${ingredientsHtml}</ul>
        </section>
        <p class="prod-detail__disclaimer">${escapeHtml(DISCLAIMER)}</p>
      </div>`;
  }

  let productDetailEl = null;

  function ensureProductDetail() {
    if (!productDetailEl) {
      productDetailEl = document.createElement('div');
      productDetailEl.id = 'productDetail';
      productDetailEl.className = 'prod-detail';
      productDetailEl.setAttribute('role', 'dialog');
      productDetailEl.setAttribute('aria-modal', 'true');
      productDetailEl.setAttribute('aria-label', 'Détail produit');
      productDetailEl.hidden = true;
      document.body.appendChild(productDetailEl);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productDetailEl && !productDetailEl.hidden) closeProductDetail();
      });
    }
    return productDetailEl;
  }

  function openProductDetail(index) {
    const p = userProducts[index];
    if (!p) return;
    const el = ensureProductDetail();
    el.innerHTML = buildProductDetailHtml(p);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    document.body.classList.add('has-product-detail');
    el.querySelector('[data-detail-close]')?.addEventListener('click', closeProductDetail);
    el.querySelector('[data-detail-more-toggle]')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const list = btn.closest('.prod-detail__ing--more')?.querySelector('[data-detail-more-list]');
      if (!list) return;
      const open = list.hidden;
      list.hidden = !open;
      btn.classList.toggle('is-open', open);
    });
  }

  function closeProductDetail() {
    if (!productDetailEl) return;
    productDetailEl.classList.remove('is-open');
    productDetailEl.hidden = true;
    document.body.classList.remove('has-product-detail');
  }

  function productHeroHtml(p) {
    if (p.imageUrl) {
      return `<img class="prod-card__img" src="${escapeHtml(p.imageUrl)}" alt="">`;
    }
    const glyph = p.emoji || (p.brand || p.name || '?').charAt(0).toUpperCase();
    const isEmoji = p.emoji && /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(p.emoji);
    return `
      <div class="prod-card__visual" aria-hidden="true">
        ${isEmoji
          ? `<span class="prod-card__emoji">${escapeHtml(glyph)}</span>`
          : `<span class="prod-card__initial">${escapeHtml(glyph)}</span>`}
      </div>`;
  }

  function buildIngredientListHtml(analysis) {
    const a = analysis;
    let visible = a.ingredients.filter(i => i.level !== 'vert');
    let collapsed = a.ingredients.filter(i => i.level === 'vert');
    if (!visible.length && collapsed.length) {
      visible = collapsed.slice(0, 2);
      collapsed = collapsed.slice(2);
    }

    const row = (ing) => {
      const why = ingredientWhyText(ing);
      return `
      <div class="prod-ing${why ? ' prod-ing--has-why' : ''}">
        <div class="prod-ing__row">
          <span class="prod-ing__name">${escapeHtml(ing.name)}</span>
          <span class="prod-ing__risk">${riskDot(ing.level)}<span>${escapeHtml(ing.riskLabel)}</span></span>
        </div>
        ${why ? `<p class="prod-ing__why">${escapeHtml(why)}</p>` : ''}
      </div>`;
    };

    const visibleHtml = visible.map(row).join('');
    const collapsedHtml = collapsed.length ? `
      <button type="button" class="prod-ing-more" data-more-toggle>
        <span class="prod-ing-more__main">
          <span class="prod-ing__name">${collapsed.length} autre${collapsed.length > 1 ? 's' : ''} ingrédient${collapsed.length > 1 ? 's' : ''}</span>
          <span class="prod-ing__risk">${riskDot('vert')}<span>Sans risque</span></span>
        </span>
        <svg class="prod-ing-more__chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="prod-ing-more-list" data-more-list hidden>${collapsed.map(row).join('')}</div>
    ` : '';

    return `
      <div class="prod-card__compo">
        <h3 class="prod-card__compo-title">Composition</h3>
        <div class="prod-card__ing-list">${visibleHtml}${collapsedHtml}</div>
      </div>`;
  }

  function buildProductCardHtml(p, options) {
    options = options || {};
    const a = p.analysis;
    const footerBtn = options.addButton ? `
      <button type="button" class="prod-card__cta" data-add-product>Ajouter à mes produits</button>
    ` : '';

    return `
      <article class="prod-card${options.modal ? ' prod-card--modal' : ''}" data-product-card>
        <div class="prod-card__hero">
          ${productHeroHtml(p)}
          <div class="prod-card__score">
            ${riskDot(a.band, true)}
            <span class="prod-card__score-num">${a.score}<span>/100</span></span>
            <span class="prod-card__score-label" style="color:${escapeHtml(a.color || '#4caf7a')}">${escapeHtml(a.label)}</span>
          </div>
        </div>
        <div class="prod-card__body">
          <p class="prod-card__brand">${escapeHtml(p.brand)}</p>
          <h3 class="prod-card__name">${escapeHtml(p.name)}</h3>
          ${buildIngredientListHtml(a)}
          ${footerBtn}
        </div>
      </article>`;
  }

  function bindProductCardInteractions(root) {
    if (!root) return;
    root.querySelectorAll('[data-more-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = btn.nextElementSibling;
        const open = !btn.classList.contains('is-open');
        btn.classList.toggle('is-open', open);
        if (list) list.hidden = !open;
      });
    });
  }

  function greet() {
    const hour = new Date().getHours();
    const time = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const name = session.firstName || 'toi';
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    if (els.greetingTime) els.greetingTime.textContent = time;
    if (els.greetingName) els.greetingName.textContent = ' ' + displayName;
    if (els.greetingNote) {
      els.greetingNote.textContent = 'Ta peau mérite une routine qui te ressemble.';
    }

    const todayDate = document.getElementById('todayDate');
    const skinHealthDate = document.getElementById('skinHealthDate');
    const dayCardMeta = document.getElementById('dayCardMeta');
    const trackingGreetingTime = document.getElementById('trackingGreetingTime');
    const trackingGreetingName = document.getElementById('trackingGreetingName');
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    if (todayDate) todayDate.textContent = dateStr;
    if (skinHealthDate) {
      if (document.body.classList.contains('is-tracking-view')) {
        updateActivityDayLabels(getSelectedActivityDay());
      } else {
        skinHealthDate.textContent = dateStr;
      }
    }
    if (dayCardMeta && !document.body.classList.contains('is-tracking-view')) {
      const city = root.VirceneDailyContext?.last?.city;
      dayCardMeta.textContent = city
        ? (root.VirceneDailyContext?.formatDayMeta?.(city) || `${dateFormatted} · ${city}`)
        : dateFormatted;
    }
    if (trackingGreetingTime) trackingGreetingTime.textContent = time;
    if (trackingGreetingName) trackingGreetingName.textContent = displayName;
  }

  function formatDelta(n) {
    if (n === 0) return '0';
    const sign = n > 0 ? '+' : '';
    return `${sign}${n}`;
  }

  const TRACKING_METRICS = [
    { key: 'hydratation', label: 'Hydratation' },
    { key: 'texture', label: 'Texture' },
    { key: 'eclat', label: 'Éclat' },
    { key: 'barriere', label: 'Barrière' }
  ];

  // Convertit un résultat de Face Scan en scores numériques pour le suivi.
  function deriveScoresFromScan(scan) {
    let hydratation = 65;
    let texture = 65;
    let eclat = 62;
    let barriere = 65;

    const skin = scan.skin || '';
    const concerns = Array.isArray(scan.concerns) ? scan.concerns : [];

    // Ajustements type de peau
    if (skin === 'sèche')        { hydratation -= 15; barriere -= 10; }
    if (skin === 'grasse')       { texture -= 10;     eclat    +=  5; }
    if (skin === 'mixte')        { texture -=  5; }
    if (skin === 'sensible')     { barriere -= 15; }
    if (skin === 'déshydratée')  { hydratation -= 20; }

    // Ajustements préoccupations
    if (concerns.includes('déshydratation'))      hydratation -= 15;
    if (concerns.includes('rougeurs'))            barriere    -= 15;
    if (concerns.includes('acné'))                { texture -= 10; eclat -= 5; }
    if (concerns.includes('brillance'))           texture     -=  8;
    if (concerns.includes('cernes'))              eclat       -= 10;
    if (concerns.includes('taches'))              eclat       -= 12;
    if (concerns.includes('pores'))               texture     -= 12;
    if (concerns.includes('texture irrégulière')) texture     -= 15;
    if (concerns.includes('ridules'))             { eclat -= 8; barriere -= 8; }

    // Ridules
    if (scan.ridules === 'marqué')  { eclat -= 10; barriere -= 5; }
    else if (scan.ridules === 'modéré') { eclat -= 5;  barriere -= 3; }
    else if (scan.ridules === 'faible') { eclat -= 2; }

    const clamp = (n) => Math.max(30, Math.min(95, Math.round(n)));
    return {
      hydratation: clamp(hydratation),
      texture:     clamp(texture),
      eclat:       clamp(eclat),
      barriere:    clamp(barriere),
    };
  }

  function enrichSnapshotScores(scores) {
    const clamp = n => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    const h = clamp(scores.hydratation);
    const t = clamp(scores.texture);
    const e = clamp(scores.eclat);
    const barriere = scores.barriere != null
      ? clamp(scores.barriere)
      : clamp(Math.round((h + t) / 2));
    return { hydratation: h, texture: t, eclat: e, barriere };
  }

  function formatPhotoLabel(photos) {
    if (!photos.length) return 'Prends ta première photo de suivi';
    const latest = photos[photos.length - 1];
    const at = latest.at ? new Date(latest.at) : new Date();
    const today = new Date();
    const sameDay = at.toDateString() === today.toDateString();
    const dateLabel = sameDay
      ? 'Aujourd\'hui'
      : at.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `Dernière photo : ${dateLabel}`;
  }

  function findWeakestMetric(metrics) {
    if (!metrics.length) return null;
    return metrics.reduce((a, b) => (a.value <= b.value ? a : b));
  }

  function renderTrackingBars(metrics) {
    const weakest = findWeakestMetric(metrics);
    return metrics.map((m) => {
      const isWeakest = weakest && m.key === weakest.key;
      return `
        <div class="skin-health-bar${isWeakest ? ' skin-health-bar--focus' : ''}" role="img" aria-label="${escapeHtml(m.label)} ${m.value} sur 100">
          <span class="skin-health-bar-label">${escapeHtml(m.label)}</span>
          <div class="skin-health-bar-track" aria-hidden="true">
            <div class="skin-health-bar-fill${isWeakest ? ' skin-health-bar-fill--accent' : ''}" style="--bar-w:${m.value}%"></div>
          </div>
          <span class="skin-health-bar-pct">${m.value}<span class="skin-health-bar-unit">%</span></span>
        </div>`;
    }).join('');
  }

  function renderEmptyTrackingBars() {
    return TRACKING_METRICS.map((m) => `
      <div class="skin-health-bar" aria-hidden="true">
        <span class="skin-health-bar-label">${escapeHtml(m.label)}</span>
        <div class="skin-health-bar-track">
          <div class="skin-health-bar-fill" style="--bar-w:0%"></div>
        </div>
        <span class="skin-health-bar-pct">—</span>
      </div>`).join('');
  }

  function isTrackingDemo() {
    return !userPhotos.length && !!root.VirceneEvolution?.DEMO;
  }

  function getEvolutionSnapshot() {
    // Priorité 1 : historique réel des scans faciaux
    const scanHistory = root.VirceneUserData?.getFaceScanHistory?.(session.id) || [];
    if (scanHistory.length >= 2) {
      // Déjà trié par insertion (le plus récent en premier — voir saveFaceScanEntry)
      const current = enrichSnapshotScores(deriveScoresFromScan(scanHistory[0]));
      const previous = enrichSnapshotScores(deriveScoresFromScan(scanHistory[1]));
      const diffMs = Math.abs((scanHistory[0].timestamp || 0) - (scanHistory[1].timestamp || 0));
      const diffDays = Math.round(diffMs / 86400000);
      const periodLabel = diffDays <= 1 ? 'hier'
        : diffDays <= 7  ? 'la semaine dernière'
        : diffDays <= 31 ? `il y a ${diffDays} jours`
        : 'ton scan précédent';
      return { periodLabel, current, previous };
    }
    if (scanHistory.length === 1) {
      const current = enrichSnapshotScores(deriveScoresFromScan(scanHistory[0]));
      return { periodLabel: 'premier scan', current, previous: current };
    }

    // Priorité 2 : données démo (si pas encore de scans réels)
    if (isTrackingDemo()) {
      const demo = Object.assign({}, root.VirceneEvolution.DEMO, { periodLabel: 'ta dernière photo' });
      demo.current = enrichSnapshotScores(demo.current);
      demo.previous = enrichSnapshotScores(demo.previous);
      return demo;
    }
    if (!userPhotos.length) return null;
    if (root.VirceneEvolution && userPhotos.length >= 2) {
      const demo = Object.assign({}, root.VirceneEvolution.DEMO, { periodLabel: 'ta dernière photo' });
      demo.current = enrichSnapshotScores(demo.current);
      demo.previous = enrichSnapshotScores(demo.previous);
      return demo;
    }
    const base = { hydratation: 62, texture: 58, eclat: 55 };
    const scores = enrichSnapshotScores(base);
    return {
      periodLabel: 'ta première photo',
      current: scores,
      previous: scores
    };
  }

  function computeEvolutionReport(snapshot) {
    if (root.VirceneEvolution) {
      const report = root.VirceneEvolution.compute(snapshot);
      const metrics = TRACKING_METRICS.map(p => {
        const found = report.metrics.find(m => m.key === p.key);
        if (found) return Object.assign({ label: p.label }, found);
        const value = Math.max(0, Math.min(100, Math.round(Number(snapshot.current[p.key]) || 0)));
        const prev = Math.max(0, Math.min(100, Math.round(Number(snapshot.previous[p.key]) || 0)));
        return { key: p.key, label: p.label, value, previous: prev, delta: value - prev };
      });
      return Object.assign({}, report, { metrics });
    }
    const clamp = n => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    const metrics = TRACKING_METRICS.map(p => {
      const value = clamp(snapshot.current[p.key]);
      const prev = clamp(snapshot.previous[p.key]);
      return { key: p.key, label: p.label, value, previous: prev, delta: value - prev };
    });
    const mean = vals => clamp(vals.reduce((a, b) => a + b, 0) / vals.length);
    const total = mean(metrics.map(m => m.value));
    const previous = mean(metrics.map(m => m.previous));
    return {
      total,
      previous,
      delta: total - previous,
      periodLabel: snapshot.periodLabel,
      metrics
    };
  }

  function renderScore() {
    const selectedDay = getSelectedActivityDay();
    const todayKey = activityDateKey(new Date());
    const snapshot = getSnapshotForSelectedDay();
    const photoLabel = document.getElementById('scorePhotoLabel');
    const scoreDeltaEl = document.getElementById('scoreDelta');

    updateActivityDayLabels(selectedDay);

    if (!snapshot) {
      if (els.scoreText) {
        els.scoreText.textContent = '—';
        els.scoreText.classList.add('is-empty');
      }
      if (photoLabel) photoLabel.textContent = formatPhotoLabel(userPhotos);
      if (scoreDeltaEl) {
        scoreDeltaEl.hidden = true;
        scoreDeltaEl.textContent = '';
      }
      if (els.scoreContext) {
        els.scoreContext.textContent = 'Ton score d\'évolution apparaîtra après ta première photo dans Suivi.';
      }
      if (els.scoreBreakdown) els.scoreBreakdown.innerHTML = renderEmptyTrackingBars();
      renderSkinOverview(null);
      return;
    }

    const report = computeEvolutionReport(snapshot);
    const insight = root.VirceneEvolution?.buildInsight
      ? root.VirceneEvolution.buildInsight(report)
      : null;

    if (els.scoreText) {
      els.scoreText.textContent = `${report.total}%`;
      els.scoreText.classList.remove('is-empty');
      els.scoreText.setAttribute('aria-label', `Score global ${report.total} sur 100`);
    }
    if (photoLabel) {
      photoLabel.textContent = selectedDay.key === todayKey
        ? (isTrackingDemo()
          ? 'Dernière photo : Aujourd\'hui · exemple'
          : formatPhotoLabel(userPhotos))
        : `Photo du ${selectedDay.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
    }

    if (scoreDeltaEl) {
      if (report.delta !== 0 && (userPhotos.length >= 2 || isTrackingDemo())) {
        const pts = `${formatDelta(report.delta)} pt${Math.abs(report.delta) === 1 ? '' : 's'}`;
        scoreDeltaEl.textContent = `${pts} depuis ${report.periodLabel}`;
        scoreDeltaEl.classList.toggle('is-down', report.delta < 0);
        scoreDeltaEl.hidden = false;
      } else {
        scoreDeltaEl.hidden = true;
        scoreDeltaEl.textContent = '';
      }
    }

    if (els.scoreContext) {
      els.scoreContext.textContent = insight?.tip
        || 'La barrière cutanée reprend du terrain. Garde ta routine du soir cette semaine.';
    }

    if (els.scoreBreakdown) {
      els.scoreBreakdown.innerHTML = renderTrackingBars(report.metrics);
    }
    renderSkinOverview(snapshot ? report : null, selectedDay);
  }

  function buildProgressDatesForDay(count, endDate) {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - (count - 1) * 7);
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i * 7);
      return d;
    });
  }

  function buildChartPath(values, width, height, padX, padTop, padBottom, yMin, yMax) {
    const innerW = width - padX * 2;
    const innerH = height - padTop - padBottom;
    const range = yMax - yMin || 1;
    const pts = values.map((v, i) => {
      const x = padX + (i / Math.max(values.length - 1, 1)) * innerW;
      const y = padTop + innerH - ((v - yMin) / range) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(' L ')}`;
  }

  function buildProgressSeries(report) {
    const count = 6;
    const values = [];
    for (let i = 0; i < count; i += 1) {
      values.push(Math.round(report.previous + (report.total - report.previous) * (i / (count - 1))));
    }
    values[count - 1] = report.total;
    values[0] = report.previous;
    return values;
  }

  function buildProgressDates(count) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - (count - 1) * 7);
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i * 7);
      return d;
    });
  }

  function formatChartDate(date) {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  function renderProgressChart(report, selectedDay) {
    const values = buildProgressSeries(report);
    const endDate = selectedDay?.date || new Date();
    const dates = buildProgressDatesForDay(values.length, endDate);
    const delta = report.delta || 0;
    const deltaSign = delta > 0 ? '+' : '';
    const yMin = 0;
    const yMax = 100;
    const chartW = 320;
    const chartH = 148;
    const padX = 28;
    const padTop = 14;
    const padBottom = 28;
    const innerW = chartW - padX * 2;
    const innerH = chartH - padTop - padBottom;
    const range = yMax - yMin;
    const goldPath = buildChartPath(values, chartW, chartH, padX, padTop, padBottom, yMin, yMax);
    const lastIdx = values.length - 1;
    const lastX = padX + (lastIdx / Math.max(values.length - 1, 1)) * innerW;
    const lastY = padTop + innerH - ((values[lastIdx] - yMin) / range) * innerH;
    const yTicks = [0, 50, 100];
    const startLabel = formatChartDate(dates[0]);
    const endLabel = formatChartDate(dates[lastIdx]);

    return `
      <section class="skin-dash-progress skin-dash-progress--bare" aria-labelledby="skinProgressTitle">
        <div class="skin-dash-section-head">
          <div class="skin-dash-section-intro">
            <p class="skin-dash-section-kicker">Progression dans le temps</p>
            <h3 class="skin-dash-section-title" id="skinProgressTitle">Score global peau</h3>
          </div>
          <span class="skin-dash-legend">
            <span class="skin-dash-legend-swatch" aria-hidden="true"></span>
            Courbe d'évolution
          </span>
        </div>
        <div class="skin-overview-chart-wrap">
            <svg class="skin-overview-chart" viewBox="0 0 ${chartW} ${chartH}" role="img" aria-label="Courbe du score global peau de ${startLabel} à ${endLabel}, ${report.total} sur 100">
              <defs>
                <linearGradient id="skinChartGold" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#C88620"/>
                  <stop offset="100%" stop-color="#E8A030"/>
                </linearGradient>
              </defs>
              <g class="skin-overview-chart-grid">
                ${yTicks.map((tick) => {
                  const y = padTop + innerH - ((tick - yMin) / range) * innerH;
                  return `
                    <line x1="${padX}" y1="${y.toFixed(1)}" x2="${chartW - padX}" y2="${y.toFixed(1)}"/>
                    <text class="skin-chart-axis-y" x="${padX - 6}" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="middle">${tick}</text>`;
                }).join('')}
              </g>
              <path class="skin-overview-chart-line skin-overview-chart-line--gold" d="${goldPath}"/>
              <circle class="skin-overview-chart-dot-ring" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="5"/>
              <circle class="skin-overview-chart-dot" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="2.5"/>
              <text class="skin-chart-axis-x" x="${padX}" y="${chartH - 8}" text-anchor="start">${escapeHtml(startLabel)}</text>
              <text class="skin-chart-axis-x" x="${chartW - padX}" y="${chartH - 8}" text-anchor="end">${escapeHtml(endLabel)}</text>
            </svg>
            <div class="skin-overview-tooltip" role="status" style="--tip-x:${((lastX / chartW) * 100).toFixed(1)}%; --tip-y:${((lastY / chartH) * 100).toFixed(1)}%;">
              <strong>${deltaSign}${Math.abs(delta)} pt${Math.abs(delta) === 1 ? '' : 's'}</strong>
              <span>Progression peau</span>
            </div>
          </div>
      </section>`;
  }

  function renderRoutineTable(report, selectedDay) {
    const hydratation = report.metrics.find(m => m.key === 'hydratation')?.value ?? 0;
    const barriere = report.metrics.find(m => m.key === 'barriere')?.value ?? 0;
    const todayKey = activityDateKey(new Date());
    const daySuffix = selectedDay && selectedDay.key !== todayKey
      ? ` — ${selectedDay.label}`
      : '';
    const routines = [
      { name: 'Routine matin', efficiency: Math.min(98, 88 + Math.round(hydratation / 12)), hydration: hydratation, protection: Math.min(95, barriere + 8) },
      { name: 'Routine soir', efficiency: Math.min(96, 84 + Math.round(barriere / 10)), hydration: Math.max(0, hydratation - 6), protection: barriere },
      { name: 'Soin actif', efficiency: Math.min(94, 80 + Math.round(report.total / 14)), hydration: Math.round((hydratation + barriere) / 2), protection: Math.max(0, barriere - 4) }
    ];

    return `
      <section class="skin-overview-routines" aria-labelledby="skinRoutinesTitle">
        <p class="skin-dash-section-kicker">Performance routine</p>
        <h4 class="skin-dash-section-title skin-dash-section-title--sub" id="skinRoutinesTitle">Efficacité matin · soir · soin actif${escapeHtml(daySuffix)}</h4>
        <div class="skin-dash-panel skin-dash-panel--table">
          <div class="skin-overview-table-wrap">
            <table class="skin-overview-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Routine</th>
                <th scope="col">Efficacité</th>
                <th scope="col">Hydrat.</th>
                <th scope="col">Protect.</th>
              </tr>
            </thead>
            <tbody>
              ${routines.map((r, i) => `
                <tr>
                  <td>${String(i + 1).padStart(2, '0')}</td>
                  <td class="is-name">${escapeHtml(r.name)}</td>
                  <td>${r.efficiency.toFixed(1)}%</td>
                  <td>${r.hydration}%</td>
                  <td>${r.protection}%</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        </div>
      </section>`;
  }

  function renderSkinOverview(report, selectedDay) {
    const wrap = document.getElementById('skinOverviewBody');
    if (!wrap) return;

    if (!report || !report.total) {
      wrap.innerHTML = `
        <section class="skin-dash-progress skin-dash-progress--empty" aria-labelledby="skinProgressTitle">
          <p class="skin-dash-section-kicker">Progression dans le temps</p>
          <h3 class="skin-dash-section-title" id="skinProgressTitle">Score global peau</h3>
          <div class="skin-dash-panel">
            <p class="skin-overview-empty">Prends une photo de suivi pour voir ta courbe d'évolution.</p>
          </div>
        </section>`;
      return;
    }

    wrap.innerHTML = renderProgressChart(report, selectedDay);
  }

  function renderProducts() {
    if (!els.productsGrid) return;
    const count = userProducts.length;
    if (els.productsCount) {
      els.productsCount.textContent = `${count} produit${count > 1 ? 's' : ''}`;
    }

    els.productsGrid.innerHTML = userProducts.map((p, i) => buildProductTileHtml(p, i)).join('') + `
      <button type="button" class="peau-product-add" id="addProduct">Ajouter un produit →</button>
    `;

    els.productsGrid.querySelectorAll('[data-product-index]').forEach((btn) => {
      btn.addEventListener('click', () => openProductDetail(Number(btn.dataset.productIndex)));
    });
    bindProductCardInteractions(els.productsGrid);
    document.getElementById('addProduct')?.addEventListener('click', openProductModal);
    if (root.VircenePremiumUX && els.productsGrid) {
      VircenePremiumUX.refresh(els.productsGrid.closest('.app-view') || document);
    }
    renderProfile();
  }

  const KNOWN_ACTIVES = new Set(['vitc', 'retinol', 'aha', 'bha', 'niacinamide', 'ha', 'bpo', 'creme', 'spf']);

  // Retourne les étapes dynamiques (depuis les vrais produits) ou le fallback statique.
  function getDynamicRoutineSteps(period) {
    if (root.VirceneRoutineAnalysis?.buildRoutineOrder && Array.isArray(userProducts)) {
      const withActive = userProducts.filter((p) => p.active && KNOWN_ACTIVES.has(p.active));
      if (withActive.length >= 1) {
        const order = root.VirceneRoutineAnalysis.buildRoutineOrder(withActive, []);
        const steps = period === 'soir' ? order.evening : order.morning;
        if (steps && steps.length) {
          return { steps, notes: order.notes || [], isDynamic: true };
        }
      }
    }
    return { steps: ROUTINE[period] || ROUTINE.matin, notes: [], isDynamic: false };
  }

  function buildRoutineStepsHtml(steps, limit) {
    const list = limit ? steps.slice(0, limit) : steps;
    return list.map((s, i) => {
      // Discriminant : l'ancien format a toujours un champ `product` (string).
      // Le nouveau format (buildRoutineOrder) a `name` / `brand` / `activeLabel`.
      const isDynamic = s.product === undefined;
      const title = isDynamic ? (s.activeLabel || s.active || '') : s.step;
      const subtitle = isDynamic
        ? ([s.brand, s.name].filter(Boolean).join(' — ') || '—')
        : (s.product || '');
      const tag = isDynamic ? (s.hint || s.activeLabel || '') : (s.tag || '');
      const photoHtml = isDynamic && s.photoUrl
        ? `<img class="routine-step-photo" src="${escapeHtml(s.photoUrl)}" alt="" loading="lazy">`
        : '';
      return `
        <div class="routine-step${isDynamic && s.photoUrl ? ' routine-step--photo' : ''}">
          ${photoHtml}
          <div class="routine-step-num">${i + 1}</div>
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(subtitle)}</p>
          </div>
          <span class="routine-step-tag">${escapeHtml(tag)}</span>
        </div>
      `;
    }).join('');
  }

  function activityDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  let selectedActivityDayKey = activityDateKey(new Date());

  function formatActivityDayFull(date) {
    const raw = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function getSelectedActivityDay() {
    const todayKey = activityDateKey(new Date());
    const key = selectedActivityDayKey || todayKey;
    const days = getActivityWeekDays();
    const match = days.find((d) => d.key === key);
    if (match) return match;
    selectedActivityDayKey = todayKey;
    return days.find((d) => d.key === todayKey) || days[0];
  }

  function getSnapshotForSelectedDay() {
    const base = getEvolutionSnapshot();
    if (!base) return null;

    const day = getSelectedActivityDay();
    const todayKey = activityDateKey(new Date());
    if (day.key === todayKey) return base;

    const days = getActivityWeekDays();
    const dayIdx = days.findIndex((d) => d.key === day.key);
    if (dayIdx < 0) return base;

    const shifts = { hydratation: 2, texture: 1, eclat: 3, barriere: 1 };
    const current = {};
    const previous = {};
    TRACKING_METRICS.forEach((p) => {
      const baseVal = base.current[p.key] || 0;
      const offset = (days.length - 1 - dayIdx) * 2;
      current[p.key] = Math.max(45, Math.min(98, baseVal - offset - (shifts[p.key] || 2) * (6 - dayIdx)));
      previous[p.key] = Math.max(40, current[p.key] - (4 + dayIdx % 3));
    });

    return {
      ...base,
      current: enrichSnapshotScores(current),
      previous: enrichSnapshotScores(previous),
      periodLabel: day.date.toLocaleDateString('fr-FR', { weekday: 'long' })
    };
  }

  function selectActivityDay(key) {
    const todayKey = activityDateKey(new Date());
    const days = getActivityWeekDays();
    const match = days.find((d) => d.key === key);
    if (!match || key > todayKey) return;
    selectedActivityDayKey = match.key;
    renderDailyActivity();
    renderScore();
  }

  function updateActivityDayLabels(selectedDay) {
    const todayKey = activityDateKey(new Date());
    const dayLabel = formatActivityDayFull(selectedDay.date);
    const skinHealthDate = document.getElementById('skinHealthDate');
    const dayCardMeta = document.getElementById('dayCardMeta');
    const activityTitle = document.getElementById('trackingActivityTitle');
    const snapshotKicker = document.getElementById('skinSnapshotKicker');

    if (skinHealthDate) skinHealthDate.textContent = dayLabel;
    if (dayCardMeta) {
      const city = root.VirceneDailyContext?.last?.city;
      dayCardMeta.textContent = city
        ? (root.VirceneDailyContext?.formatDayMeta?.(city) || `${dayLabel} · ${city}`)
        : dayLabel;
    }
    if (activityTitle) {
      activityTitle.textContent = selectedDay.key === todayKey
        ? 'Activité du jour'
        : `Activité — ${selectedDay.label}`;
    }
    if (snapshotKicker) {
      snapshotKicker.textContent = selectedDay.key === todayKey
        ? 'Instantané du jour'
        : `Instantané — ${selectedDay.label}`;
    }
  }

  function getActivityWeekDays(ref) {
    const cursor = new Date(ref || Date.now());
    const dow = cursor.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(cursor);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(cursor.getDate() + mondayOffset);
    const labels = ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'];
    return labels.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return { label, date, key: activityDateKey(date) };
    });
  }

  function getDemoActivityLog() {
    const todayKey = activityDateKey(new Date());
    return getActivityWeekDays()
      .filter((day) => day.key < todayKey)
      .slice(-4)
      .map((day) => day.key);
  }

  function renderDailyActivity() {
    const wrap = document.getElementById('trackingActivityWeek');
    if (!wrap) return;

    let log = root.VirceneUserData?.getActivityLog(session.id) || [];
    if (!log.length && isTrackingDemo()) log = getDemoActivityLog();
    const todayKey = activityDateKey(new Date());
    const checkSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    wrap.innerHTML = getActivityWeekDays().map((day) => {
      const isToday = day.key === todayKey;
      const isFuture = day.key > todayKey;
      const isDone = log.includes(day.key);
      const isSelected = day.key === (selectedActivityDayKey || todayKey);
      let stateClass = 'is-missed';
      if (isFuture) stateClass = 'is-future';
      else if (isToday && isDone) stateClass = 'is-today is-done';
      else if (isToday) stateClass = 'is-today';
      else if (isDone) stateClass = 'is-done';
      if (isSelected) stateClass += ' is-selected';

      const aria = isSelected
        ? `Jour sélectionné — ${day.label}`
        : isDone
          ? `Routine faite — ${day.label}`
          : isToday
            ? `Aujourd'hui — ${day.label}`
            : day.label;

      return `<button type="button" class="home-activity-day ${stateClass}" data-activity-day="${day.key}"${isFuture ? ' disabled' : ''} aria-label="${escapeHtml(aria)}" aria-pressed="${isSelected ? 'true' : 'false'}" role="listitem">
        <span class="home-activity-day-label">${day.label}</span>
        <span class="home-activity-day-mark" data-activity-toggle aria-label="Marquer la routine ${day.label}">${isDone ? checkSvg : ''}</span>
      </button>`;
    }).join('');

    wrap.querySelectorAll('[data-activity-day]:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('[data-activity-toggle]')) return;
        selectActivityDay(btn.dataset.activityDay);
      });
      btn.querySelector('[data-activity-toggle]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.activityDay;
        if (!key || key > todayKey) return;
        if (root.VirceneUserData) VirceneUserData.toggleActivityDay(session.id, key);
        renderDailyActivity();
      });
    });

    root.VircenePremiumUX?.refresh?.(wrap);
  }

  function renderHomeRoutines() {
    const matinEl = document.getElementById('homeRoutineMatin');
    const soirEl = document.getElementById('homeRoutineSoir');
    const matin = getDynamicRoutineSteps('matin');
    const soir = getDynamicRoutineSteps('soir');
    if (matinEl) matinEl.innerHTML = buildRoutineStepsHtml(matin.steps, 3);
    if (soirEl) soirEl.innerHTML = buildRoutineStepsHtml(soir.steps, 3);
  }

  function setRoutinePeriod(period) {
    document.querySelectorAll('.routine-tab').forEach(t => {
      t.classList.toggle('is-active', t.dataset.period === period);
    });
    const wrap = document.querySelector('.routine-view-wrap');
    if (wrap) {
      wrap.classList.remove('routine-view-wrap--matin', 'routine-view-wrap--soir');
      wrap.classList.add(`routine-view-wrap--${period}`);
    }
    renderRoutine(period);
  }

  function renderRoutine(period) {
    if (!els.routineList) return;
    const { steps, notes, isDynamic } = getDynamicRoutineSteps(period);

    let html = '';
    if (!steps.length) {
      html = '<p class="routine-empty">Scanne tes produits pour générer ta routine.</p>';
    } else {
      html = buildRoutineStepsHtml(steps);
      if (isDynamic && notes.length) {
        html += '<div class="routine-notes">'
          + notes.map((n) => `<p class="routine-note"><span class="routine-note-icon" aria-hidden="true">⚠</span>${escapeHtml(n)}</p>`).join('')
          + '</div>';
      }
    }

    els.routineList.innerHTML = html;
    if (root.VircenePremiumUX && els.routineList) {
      VircenePremiumUX.refresh(els.routineList.closest('.app-view') || document);
    }
  }

  function getScoreTotal() {
    const snapshot = getEvolutionSnapshot();
    if (!snapshot) return null;
    return computeEvolutionReport(snapshot).total;
  }

  function renderProfile() {
    const goals = (session.goals || []).map(g => GOAL_LABELS[g] || g);

    if (els.profileName) {
      els.profileName.textContent = `${session.firstName || ''} ${session.lastName || ''}`.trim() || '—';
    }
    if (els.profileEmail) els.profileEmail.textContent = session.email || '—';
    if (els.profileSkin) {
      els.profileSkin.textContent = SKIN_LABELS[session.skinType] || 'Non renseigné';
    }
    if (els.profileGoals) {
      els.profileGoals.innerHTML = goals.length
        ? goals.map(g => `<span class="profile-goal">${escapeHtml(g)}</span>`).join('')
        : '<span class="profile-value">Aucun objectif sélectionné</span>';
    }
    if (els.profileAbout) {
      els.profileAbout.textContent = session.about || '—';
    }
    if (els.planBadge) {
      const premium = root.VircenePaywall?.isPremium?.(session);
      els.planBadge.textContent = premium ? 'Premium' : 'Gratuit';
    }

    const topbarAvatar = document.getElementById('topbarProfileAvatar');
    const initial = (session.firstName || session.email || 'V').trim().charAt(0).toUpperCase() || 'V';
    if (topbarAvatar) topbarAvatar.textContent = initial;

    const topbarAccountLink = document.getElementById('topbarAccountLink');
    if (topbarAccountLink) {
      const premium = root.VircenePaywall?.isPremium?.(session);
      topbarAccountLink.textContent = premium ? 'Gérer mon abonnement' : 'S\'abonner';
    }
  }

  // ─── Modale ───
  let modal = null;

  function ensureModal() {
    if (modal) return modal;
    const el = document.createElement('div');
    el.className = 'vir-modal';
    el.id = 'virModal';
    el.innerHTML = '<div class="vir-modal-panel"><button type="button" class="vir-modal-close" aria-label="Fermer">×</button><div class="vir-modal-content"></div></div>';
    document.body.appendChild(el);
    el.addEventListener('click', e => {
      if (e.target === el) closeModal();
    });
    el.querySelector('.vir-modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && el.classList.contains('is-open')) closeModal();
    });
    modal = el;
    return el;
  }

  function openModal(html) {
    const el = ensureModal();
    el.querySelector('.vir-modal-content').innerHTML = html;
    el.classList.add('is-open');
    return el;
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
  }

  // ─── Choix / saisie d'un produit à analyser ───
  function openProductModal() {
    if (!hasScoring()) {
      alert('Le moteur d’analyse n’a pas pu être chargé.');
      return;
    }
    const seedBtns = VirceneScoring.SEED_PRODUCTS.map(p => `
      <button type="button" class="scan-seed-btn" data-seed="${escapeHtml(p.id)}">
        <span class="seed-name">${escapeHtml(p.name)}</span>
        <span class="seed-brand">${escapeHtml(p.brand)}</span>
      </button>
    `).join('');

    const html = `
      <div class="scan-modal">
        <p class="scan-modal-kicker">Produits</p>
        <h2 class="scan-modal-title">Ajouter un produit</h2>
        <p class="scan-intro">Colle la liste INCI ou choisis un exemple ci-dessous pour analyser la composition.</p>
        <div class="scan-seed-grid">${seedBtns}</div>
        <div class="scan-divider"><span>ou</span></div>
        <div class="scan-field">
          <label class="scan-field-label" for="scanIngredients">Liste INCI</label>
          <p class="scan-field-hint">Séparée par des virgules ou des retours à la ligne</p>
          <textarea class="scan-textarea" id="scanIngredients" placeholder="Aqua, Glycerin, Dimethicone, Parfum…"></textarea>
        </div>
        <button type="button" class="scan-analyze-btn" id="scanAnalyzeBtn">Analyser la composition</button>
        <p class="detail-disclaimer">${escapeHtml(DISCLAIMER)}</p>
      </div>
    `;

    const el = openModal(html);

    el.querySelectorAll('[data-seed]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const seed = VirceneScoring.SEED_PRODUCTS.find(p => p.id === btn.dataset.seed);
        if (seed) {
          const analysis = await analyzeIngredients(seed.ingredients);
          openDetail(seed.name, seed.brand, seed.emoji, analysis, seed.imageUrl);
        }
      });
    });

    el.querySelector('#scanAnalyzeBtn')?.addEventListener('click', async () => {
      const raw = el.querySelector('#scanIngredients').value || '';
      const names = raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
      if (!names.length) {
        alert('Colle au moins un ingrédient pour lancer l’analyse.');
        return;
      }
      const analysis = await analyzeIngredients(names);
      openDetail('Produit analysé', 'Composition personnalisée', '', analysis);
    });
  }

  // ─── Détail produit (hero + score + composition) ───
  function openDetail(name, brand, emoji, analysis, imageUrl) {
    const product = { name, brand, emoji, analysis, imageUrl: imageUrl || '' };
    const html = buildProductCardHtml(product, { modal: true, addButton: true });
    const el = openModal(html);
    const panel = el.querySelector('.vir-modal-panel');
    if (panel) panel.classList.add('vir-modal-panel--product');

    bindProductCardInteractions(el);

    el.querySelector('[data-add-product]')?.addEventListener('click', () => {
      if (addProductEntry(name, brand, emoji, analysis, imageUrl)) closeModal();
    });
  }

  function bindPeauHero() {
    document.querySelectorAll('.peau-hero__chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.closest('.peau-hero__chips')?.querySelectorAll('.peau-hero__chip').forEach(c => {
          c.classList.toggle('is-active', c === chip);
        });
      });
    });

    document.querySelectorAll('[data-peau-hero-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-peau-hero-tab]').forEach(b => {
          b.classList.toggle('is-active', b === btn);
        });
        const tab = btn.dataset.peauHeroTab;
        if (tab === 'produits' || tab === 'suivi') switchView('peau');
        else if (tab === 'routine') switchView('routine');
        else if (tab === 'analyse') switchView('analyse');
      });
    });

    document.querySelector('.peau-hero__trend-close')?.addEventListener('click', () => {
      document.querySelector('.peau-hero__trend')?.remove();
    });

    document.getElementById('peauHeroSearchBtn')?.addEventListener('click', () => {
      window.location.href = 'compatibilite-actifs';
    });
  }

  function resolveInitialView() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const allowed = ['aujourdhui', 'accueil', 'peau', 'analyse', 'produits', 'suivi', 'profil'];
    if (view === 'hub' || view === 'routine') return 'aujourdhui';
    if (view && allowed.includes(view)) return view;
    return 'accueil';
  }

  function switchView(viewId) {
    if (viewId === 'produits' || viewId === 'suivi') viewId = 'peau';
    document.querySelectorAll('.app-view').forEach(v => {
      v.classList.toggle('is-active', v.id === `view-${viewId}`);
    });
    document.querySelectorAll('[data-view]').forEach(link => {
      link.classList.toggle('is-active', link.dataset.view === viewId);
    });
    document.body.classList.toggle('is-accueil-view', viewId === 'accueil');
    document.body.classList.toggle('is-peau-view', viewId === 'peau' || viewId === 'analyse');
    document.body.classList.toggle('is-analyse-view', viewId === 'analyse');
    document.body.classList.toggle('is-tracking-view', viewId === 'aujourdhui');
    document.dispatchEvent(new CustomEvent('vircene:view-change', { detail: { viewId } }));
    if (viewId === 'profil') {
      renderProfile();
    }
    if (viewId === 'analyse') {
      root.VirceneMonAnalyse?.render?.(document.getElementById('monAnalyseRoot'), session.id);
      if (els.greetingNote) {
        els.greetingNote.textContent = 'Synthèse de ton dernier scan — actifs, compatibilité et ordre.';
      }
    } else if (viewId === 'accueil' && els.greetingNote) {
      els.greetingNote.textContent = 'On croise tes actifs pour une routine sans conflit.';
    } else if (viewId === 'peau') {
      userProducts = root.VirceneProductSync?.loadVitrineFromScan?.(session.id) || userProducts;
      renderProducts();
      if (els.greetingNote) {
        els.greetingNote.textContent = 'Ta vitrine skincare — produits et suivi en un coup d\'œil.';
      }
    } else if (viewId === 'aujourdhui' && els.greetingNote) {
      els.greetingNote.textContent = root.VirceneDailyContext?.last?.primaryAdvice
        || root.VirceneDailyContext?.last?.climateAdvice?.detail
        || root.VirceneDailyContext?.last?.advice
        || 'Suis l\'évolution de ta peau, semaine après semaine.';
    }
    requestAnimationFrame(() => {
      const active = document.querySelector('.app-view.is-active');
      if (active && root.VircenePremiumUX) VircenePremiumUX.refresh(active);
      if (viewId === 'aujourdhui') {
        document.querySelectorAll('.day-card.reveal').forEach((el) => el.classList.add('is-visible'));
      }
    });
  }

  function bindNav() {
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        switchView(el.dataset.view);
      });
    });

    document.getElementById('addProductCta')?.addEventListener('click', () => {
      switchView('peau');
      openProductModal();
    });

    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault();
        await VirceneAuth.logout();
        window.location.replace('login.html');
      });
    });

    document.querySelectorAll('.routine-tab').forEach(tab => {
      tab.addEventListener('click', () => setRoutinePeriod(tab.dataset.period));
    });

    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.goto;
        const routinePeriod = btn.dataset.routinePeriod;
        const openProductAfter = btn.hasAttribute('data-open-product');
        if (openProductAfter) { switchView('peau'); openProductModal(); return; }
        if (view === 'suivi') { switchView('suivi'); return; }
        if (view === 'routine' && routinePeriod) {
          switchView('routine');
          setRoutinePeriod(routinePeriod);
          return;
        }
        if (view) switchView(view);
      });
    });
  }

  function showWelcomeToast() {
    if (!VirceneAuth.consumeWelcome || !VirceneAuth.consumeWelcome()) return;
    const name = session.firstName ? `, ${session.firstName}` : '';
    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="app-toast-mark">✦</span>
      <div class="app-toast-body">
        <strong>Bienvenue sur Vircène${name} !</strong>
        <span>Ton compte a bien été créé. Un e-mail de bienvenue arrive dans ta boîte.</span>
      </div>
      <button type="button" class="app-toast-close" aria-label="Fermer">×</button>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const dismiss = () => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 400);
    };
    toast.querySelector('.app-toast-close')?.addEventListener('click', dismiss);
    setTimeout(dismiss, 6000);
  }

  function revealProfile() {
    const profil = document.getElementById('view-profil');
    const btn = document.getElementById('appProfileReveal');
    if (!profil || !btn || !profil.classList.contains('app-profile--veiled')) return;
    profil.classList.remove('app-profile--veiled');
    profil.classList.add('app-profile--revealed');
    btn.disabled = true;
    profil.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  function resetProfileVeil() {
    const profil = document.getElementById('view-profil');
    const btn = document.getElementById('appProfileReveal');
    if (!profil) return;
    profil.classList.add('app-profile--veiled');
    profil.classList.remove('app-profile--revealed');
    if (btn) btn.disabled = false;
  }

  function initAppProfileVeil() {
    const btn = document.getElementById('appProfileReveal');
    if (!btn) return;
    btn.addEventListener('click', revealProfile);
  }

  greet();
  renderDailyActivity();
  renderScore();
  renderHomeRoutines();
  renderProducts();
  renderRoutine('matin');
  renderProfile();
  bindNav();
  bindPeauHero();
  const bootParams = new URLSearchParams(window.location.search);
  switchView(resolveInitialView());
  if (root.VirceneDailyContext) VirceneDailyContext.init();
  if (bootParams.get('produit') === '1') {
    switchView('peau');
    openProductModal();
  }
  showWelcomeToast();
  }

  bootstrap();
})();

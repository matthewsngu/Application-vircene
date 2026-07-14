/**
 * Vircène — Accueil 2 & onboarding diagnostic conversationnel
 */
(function (global) {
  'use strict';

  const CONCERN_MAX = 3;
  const FLOW_TOTAL = 7;

  const SKIN_TYPES = [
    {
      id: 'seche',
      label: 'Sèche',
      hint: 'Tiraillements, sensation de manque de confort, peau qui tiraille après la douche.'
    },
    {
      id: 'mixte',
      label: 'Mixte',
      hint: 'Zone T plus brillante, joues plus confortables — deux textures sur le visage.'
    },
    {
      id: 'grasse',
      label: 'Grasse',
      hint: 'Brillance en cours de journée, pores visibles, maquillage qui file.'
    },
    {
      id: 'sensible',
      label: 'Sensible',
      hint: 'Rougeurs, picotements ou réactions aux parfums et aux actifs forts.'
    }
  ];

  const INTENTIONS = [
    { id: 'nette', label: 'Une peau nette' },
    { id: 'lumineux', label: 'Un teint lumineux' },
    { id: 'apaisee', label: 'Une peau apaisée, sans tiraillements' },
    { id: 'selfcare', label: 'Prendre soin de moi, simplement' }
  ];

  function progressHtml() {
    return '';
  }

  const INTRO_SCREENS = [
    {
      id: 'intro-stat-1',
      type: 'stat',
      highlight: '1 femme sur 2',
      rest: 'trouve sa routine inefficace.',
      source: 'Étude OnePoll, 2 000 femmes'
    },
    {
      id: 'intro-text-2',
      type: 'text',
      paragraphs: [
        {
          text: 'Tu prends soin de ta peau, et pourtant tu ne vois pas vraiment la différence.',
          spacious: true
        },
        {
          text: 'Tu te dis peut-être que tu n\'as pas encore trouvé les bons produits.',
          spacious: true
        }
      ]
    },
    {
      id: 'intro-text-3',
      type: 'text',
      body: 'La plupart des déceptions ne viennent pas des produits, mais de la façon dont ils s\'associent.'
    },
    {
      id: 'intro-stat-2',
      type: 'stat',
      highlight: '7 personnes sur 10',
      rest: 'achètent leurs produits sans comprendre ce qu\'il y a dedans.',
      source: 'Étude Vitabiotics, 2 000 femmes'
    },
    {
      id: 'intro-text-5',
      type: 'text',
      paragraphs: [
        {
          text: 'On va décoder ensemble la composition réelle de chacun de tes produits, leurs actifs et ce qui se passe quand ils se rencontrent : lesquels se renforcent, lesquels se gênent.',
          emphasis: ['décoder', 'actifs', 'se rencontrent'],
          spacious: true,
          extraSpacious: true
        },
        'Chaque ingrédient, chaque association, chaque interaction.'
      ]
    },
    {
      id: 'intro-cta',
      type: 'cta',
      body: 'Tu va pouvoir comprendre ta peau, et lui donner ce dont elle a vraiement besoin.',
      cta: 'on y va'
    }
  ];

  function hapticSelect() {
    try {
      if (navigator.vibrate) navigator.vibrate(10);
    } catch { /* ignore */ }
  }

  function introParagraphHtml(p) {
    if (typeof p === 'string') {
      return `<p class="diag-intro-text">${escapeHtml(p)}</p>`;
    }
    let html = escapeHtml(p.text);
    if (p.emphasis) {
      p.emphasis.forEach((word) => {
        const esc = escapeHtml(word);
        html = html.split(esc).join(`<strong class="diag-intro-strong">${esc}</strong>`);
      });
    }
    const classes = ['diag-intro-text'];
    if (p.spacious) classes.push('diag-intro-text--spacious');
    if (p.extraSpacious) classes.push('diag-intro-text--extra-spacious');
    return `<p class="${classes.join(' ')}">${html}</p>`;
  }

  function introStatHtml(slide) {
    if (slide.highlight && slide.rest) {
      return `
      <h1 class="diag-intro-stat">
        <span class="diag-intro-stat-accent">${escapeHtml(slide.highlight)}</span><span class="diag-intro-stat-rest"> ${escapeHtml(slide.rest)}</span>
      </h1>
    `;
    }
    return `<h1 class="diag-intro-stat">${escapeHtml(slide.title || '')}</h1>`;
  }

  function introParagraphsHtml(paragraphs) {
    return `<div class="diag-intro-stack">${paragraphs.map((p) =>
      introParagraphHtml(p)
    ).join('')}</div>`;
  }

  const SUN_DECO = `<img class="diag-concern-deco__img" src="assets/diagnostic/deco-sun-fabulous.png" alt="" width="280" height="280" loading="lazy">`;

  const WAVES_DECO = `<img class="diag-concern-deco__img" src="assets/diagnostic/deco-waves-fabulous.png?v=99" alt="" width="420" height="96" loading="lazy">`;

  const SAND_DECO = `<img class="diag-concern-deco__img" src="assets/diagnostic/deco-sand-fabulous.png" alt="" width="360" height="238" loading="lazy">`;

  const FLOW_DECO = `
    <span class="diag-concern-deco diag-concern-deco--sun" aria-hidden="true">${SUN_DECO}</span>
    <span class="diag-concern-deco diag-concern-deco--waves" aria-hidden="true">${WAVES_DECO}</span>
    <span class="diag-concern-deco diag-concern-deco--sand" aria-hidden="true">${SAND_DECO}</span>
  `;

  const CONCERNS = [
    {
      id: 'imperfections',
      label: 'Imperfections, boutons',
      welcome: 'On va regarder tes imperfections ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    },
    {
      id: 'sebum',
      label: 'Excès de sébum, brillance',
      welcome: 'On va équilibrer ta peau ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    },
    {
      id: 'pores',
      label: 'Pores, grain de peau',
      welcome: 'On va affiner ton grain de peau ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    },
    {
      id: 'teint',
      label: 'Teint terne, éclat',
      welcome: 'On va travailler ton éclat ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    },
    {
      id: 'taches',
      label: 'Taches, marques',
      welcome: 'On va adresser tes marques ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    },
    {
      id: 'rougeurs',
      label: 'Rougeurs, peau réactive',
      welcome: 'On va apaiser ta peau réactive ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    },
    {
      id: 'secheresse',
      label: 'Tiraillements, sécheresse',
      welcome: 'On va nourrir ta peau ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    },
    {
      id: 'ridules',
      label: 'Ridules, fermeté',
      welcome: 'On va travailler ta fermeté ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    },
    {
      id: 'cernes',
      label: 'Cernes, poches',
      welcome: 'On va traiter tes cernes ensemble.\nD\'abord, montre-moi ta routine actuelle.'
    }
  ];

  const MAINTENANCE_OPTION = {
    id: 'maintenance',
    label: 'Rien de précis, je veux entretenir ma peau',
    welcome: 'On va entretenir ta peau ensemble.\nD\'abord, montre-moi ta routine actuelle.'
  };

  const CONCERN_ICONS = {
    imperfections: '<circle cx="9" cy="9" r="6.5"/><circle cx="11.5" cy="7" r="1"/><circle cx="6.5" cy="11" r="0.75"/>',
    sebum: '<path d="M9 3.5c2.5 4 4 6.5 4 9a4 4 0 0 1-8 0c0-2.5 1.5-5 4-9z"/>',
    pores: '<circle cx="5" cy="5" r="1.2"/><circle cx="9" cy="5" r="1.2"/><circle cx="13" cy="5" r="1.2"/><circle cx="5" cy="9" r="1.2"/><circle cx="9" cy="9" r="1.2"/><circle cx="13" cy="9" r="1.2"/><circle cx="5" cy="13" r="1.2"/><circle cx="9" cy="13" r="1.2"/><circle cx="13" cy="13" r="1.2"/>',
    teint: '<path d="M9 2.5v2M9 13.5v2M2.5 9h2M13.5 9h2M4.4 4.4l1.4 1.4M12.2 12.2l1.4 1.4M4.4 13.6l1.4-1.4M12.2 5.8l1.4-1.4"/><circle cx="9" cy="9" r="3"/>',
    taches: '<circle cx="6.5" cy="7" r="1.5"/><circle cx="11.5" cy="8.5" r="1"/><circle cx="8" cy="12.5" r="1.25"/>',
    rougeurs: '<path d="M2.5 9c1.5-2 3-3 6.5-3s5 1 6.5 3"/><path d="M3.5 11.5c1.2-1.5 2.8-2.2 5.5-2.2s4.3.7 5.5 2.2"/>',
    secheresse: '<path d="M3 14h12"/><path d="M5.5 14V8.5l2-2.5 2 3 2-2 1.5 2V14"/><path d="M5 6.5l1-1.5M11 5.5l1-1"/>',
    ridules: '<path d="M3 11c2-1.5 4-1.5 6 0s4 1.5 6 0"/><path d="M3 8.5c2-1 3.5-1 5.5 0s3.5 1 5.5 0"/>',
    cernes: '<path d="M3.5 9.5c1.2-1.8 2.8-2.8 5.5-2.8s4.3 1 5.5 2.8"/><circle cx="9" cy="9.5" r="1.2"/><path d="M5 13.5c1.2.8 2.5 1.2 4 1.2s2.8-.4 4-1.2"/>',
    maintenance: '<path d="M9 3.2C7 6.2 5 8.5 5 11a4 4 0 0 0 8 0c0-2.5-2-4.8-4-7.8z"/><path d="M9 3.2v9.5"/>'
  };

  function concernIconSvg(id) {
    const paths = CONCERN_ICONS[id] || CONCERN_ICONS.imperfections;
    return `<svg class="diag-concern-icon" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  const ROUTINE_PRODUCTS = [
    { id: 'cleanser', label: 'Nettoyant' },
    { id: 'serum', label: 'Sérum' },
    { id: 'cream', label: 'Crème hydratante' },
    { id: 'spf', label: 'Protection solaire' },
    { id: 'micellar', label: 'Démaquillant / eau micellaire' },
    { id: 'toner', label: 'Tonique' },
    { id: 'eyecream', label: 'Contour des yeux' },
    { id: 'exfoliant', label: 'Exfoliant' }
  ];

  const FREQUENCY_CHIPS = [
    { id: 'daily', label: 'Tous les jours, sans faute' },
    { id: 'often', label: 'Souvent, quand j\'y pense' },
    { id: 'sometimes', label: 'Ça dépend des jours' },
    { id: 'rarely', label: 'Pas encore une vraie habitude' }
  ];

  const ANALYZE_MESSAGES = [
    'On lit ta peau…',
    'On croise tes préoccupations et ta routine…',
    'On vérifie les compatibilités d\'actifs…',
    'Presque prêt.'
  ];

  const LANDING_ANALYZE_MESSAGES = [
    'Analyse en cours…',
    'On enregistre ton profil cutané…',
    'On prépare la lecture de tes produits…',
    'Encore un instant.'
  ];

  /**
   * Sons · quiet luxury — phrase pentatonique ascendante.
   * Étape N = N chimes (1→7) : tu entends où tu en es et quand ça se termine.
   */
  const PROGRESS_MELODY = [329.63, 392, 440, 493.88, 587.33, 659.25, 783.99];
  const CHIME_GAP = 0.1;
  let stepAudioCtx = null;
  let stepAudioOut = null;

  function stepSoundEnabled() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function resumeStepAudio() {
    if (!stepSoundEnabled()) return null;
    const Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return null;
    if (!stepAudioCtx) {
      stepAudioCtx = new Ctx();
      stepAudioOut = stepAudioCtx.createGain();
      stepAudioOut.gain.value = 0.64;
      stepAudioOut.connect(stepAudioCtx.destination);
    }
    if (stepAudioCtx.state === 'suspended') stepAudioCtx.resume();
    return stepAudioCtx;
  }

  function playLuxuryTone(ctx, start, freq, peak, duration, resolved) {
    const osc = ctx.createOscillator();
    const toneGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const dest = stepAudioOut || ctx.destination;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (resolved) {
      osc.frequency.exponentialRampToValueAtTime(freq * 1.012, start + 0.12);
    } else {
      osc.frequency.exponentialRampToValueAtTime(freq * 1.004, start + 0.06);
    }

    filter.type = 'lowpass';
    filter.Q.value = 0.38;
    filter.frequency.setValueAtTime(resolved ? 2600 : 2000, start);
    filter.frequency.exponentialRampToValueAtTime(resolved ? 1100 : 880, start + duration);

    toneGain.gain.setValueAtTime(0.0001, start);
    toneGain.gain.linearRampToValueAtTime(Math.max(peak, 0.0001), start + (resolved ? 0.036 : 0.03));
    toneGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(filter);
    filter.connect(toneGain);
    toneGain.connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function playStepProgressSound(stepNum) {
    const ctx = resumeStepAudio();
    if (!ctx) return;

    const step = Math.min(Math.max(stepNum, 1), FLOW_TOTAL);
    const now = ctx.currentTime + 0.01;
    const isFinale = step === FLOW_TOTAL;

    for (let i = 0; i < step; i += 1) {
      const t = now + i * CHIME_GAP;
      const freq = PROGRESS_MELODY[i] ?? PROGRESS_MELODY[PROGRESS_MELODY.length - 1];
      const isLast = i === step - 1;
      const resolved = isFinale && isLast;
      const peak = resolved ? 0.052 : 0.038 + i * 0.002;
      const duration = resolved ? 0.68 : 0.36;
      playLuxuryTone(ctx, t, freq, peak, duration, resolved);
    }
  }

  const LIFESTYLE_QUESTIONS = [
    {
      key: 'sleep',
      label: 'Tu dors combien, en général ?',
      options: [
        { id: 'short', label: 'Moins de 6h' },
        { id: 'ok', label: '6 à 8h' },
        { id: 'long', label: 'Plus de 8h' }
      ]
    },
    {
      key: 'hydration',
      label: 'Tu bois assez d\'eau ?',
      options: [
        { id: 'rare', label: 'Rarement' },
        { id: 'ok', label: 'Ça va' },
        { id: 'often', label: 'Souvent' }
      ]
    },
    {
      key: 'stress',
      label: 'Ton niveau de stress en ce moment ?',
      options: [
        { id: 'calm', label: 'Plutôt calme' },
        { id: 'variable', label: 'Variable' },
        { id: 'pressure', label: 'Sous pression' }
      ]
    }
  ];

  const PROGRESS_HINTS = [
    '',
    'On y voit déjà plus clair…',
    'Encore un instant…',
    'Presque terminé…'
  ];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function labelsFromIds(ids, pool) {
    return ids
      .map((id) => pool.find((item) => item.id === id)?.label)
      .filter(Boolean);
  }

  function diagnosticKey(userId) {
    return 'vircene_user_' + (userId || 'anon') + '_diagnostic';
  }

  function saveDiagnostic(userId, data) {
    try {
      localStorage.setItem(diagnosticKey(userId), JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
    } catch { /* ignore */ }
  }

  function loadDiagnostic(userId) {
    try {
      const raw = localStorage.getItem(diagnosticKey(userId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function applySavedToState(state, saved) {
    if (!saved) return;
    if (saved.intention != null) state.intention = saved.intention;
    if (saved.skinType != null) state.skinType = saved.skinType;
    if (Array.isArray(saved.concernIds)) state.concernIds = saved.concernIds.slice();
    if (saved.maintenance != null) state.maintenance = saved.maintenance;
    if (saved.concernId != null) state.concernId = saved.concernId;
    if (saved.concernCustom != null) state.concernCustom = saved.concernCustom;
    if (Array.isArray(saved.morning)) state.morning = saved.morning.slice();
    if (Array.isArray(saved.evening)) state.evening = saved.evening.slice();
    if (saved.frequency != null) state.frequency = saved.frequency;
    if (saved.morningNote != null) state.morningNote = saved.morningNote;
    if (saved.eveningNote != null) state.eveningNote = saved.eveningNote;
    if (saved.favoriteProduct != null) state.favoriteProduct = saved.favoriteProduct;
    if (saved.favoriteDeclined != null) state.favoriteDeclined = saved.favoriteDeclined;
    if (saved.sleep != null) state.sleep = saved.sleep;
    if (saved.hydration != null) state.hydration = saved.hydration;
    if (saved.stress != null) state.stress = saved.stress;
  }

  function routineSummaryLabels(ids, note) {
    const list = Array.isArray(ids) ? ids : [];
    if (!list.length || list.includes('none')) {
      const trimmed = (note || '').trim();
      return trimmed ? [trimmed] : ['Rien pour l\'instant'];
    }
    const labels = labelsFromIds(list, ROUTINE_PRODUCTS);
    const trimmed = (note || '').trim();
    if (trimmed) labels.push('Note : ' + trimmed);
    return labels.length ? labels : ['Rien de précisé'];
  }

  function mergeRoutineIds(morningIds, eveningIds) {
    const merged = [];
    const seen = new Set();
    [...(morningIds || []), ...(eveningIds || [])].forEach(function (id) {
      if (!id || seen.has(id)) return;
      seen.add(id);
      merged.push(id);
    });
    if (!merged.length) return [];
    if (merged.includes('none') && merged.length > 1) {
      return merged.filter(function (id) { return id !== 'none'; });
    }
    return merged;
  }

  function mergeRoutineNotes(morningNote, eveningNote) {
    const parts = [];
    const seen = new Set();
    [morningNote, eveningNote].forEach(function (note) {
      const trimmed = (note || '').trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      parts.push(trimmed);
    });
    return parts.join(' · ');
  }

  function mergeRoutineSummaryLabels(morningIds, eveningIds, morningNote, eveningNote) {
    const mergedIds = mergeRoutineIds(morningIds, eveningIds);
    const mergedNote = mergeRoutineNotes(morningNote, eveningNote);
    const labels = routineSummaryLabels(mergedIds, mergedNote);
    const seen = new Set();
    return labels.filter(function (label) {
      const key = label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function formatDiagnosticSummary(data) {
    if (!data) return null;

    const intention = INTENTIONS.find((item) => item.id === data.intention);
    const concerns = [];
    const concernSeen = new Set();
    function pushConcern(label) {
      const key = String(label || '').toLowerCase();
      if (!key || concernSeen.has(key)) return;
      concernSeen.add(key);
      concerns.push(label);
    }
    if (data.maintenance) pushConcern(MAINTENANCE_OPTION.label);
    (data.concernIds || []).forEach((id) => {
      const concern = CONCERNS.find((item) => item.id === id);
      if (concern) pushConcern(concern.label);
    });

    const lifestyle = LIFESTYLE_QUESTIONS.map((question) => {
      const value = data[question.key];
      const option = question.options.find((item) => item.id === value);
      return {
        label: question.label,
        value: option ? option.label : '—'
      };
    });

    const frequency = FREQUENCY_CHIPS.find((item) => item.id === data.frequency);

    const skinType = SKIN_TYPES.find((item) => item.id === data.skinType);

    return {
      skinType: skinType ? skinType.label : '—',
      skinTypeHint: skinType ? skinType.hint : null,
      intention: intention ? intention.label : '—',
      concerns: concerns.length ? concerns : ['—'],
      routine: mergeRoutineSummaryLabels(data.morning, data.evening, data.morningNote, data.eveningNote),
      morning: mergeRoutineSummaryLabels(data.morning, data.evening, data.morningNote, data.eveningNote),
      evening: [],
      lifestyle,
      frequency: frequency ? frequency.label : '—',
      report: data.report || null,
      savedAt: data.savedAt || null
    };
  }

  function boot(options) {
    options = options || {};
    const root = document.getElementById('diagRoot');
    if (!root) return;

    const skipIntro = Boolean(options.skipIntro);
    const returnUrl = options.returnUrl || 'analyse-cutanee';

    // Landing overlay : questionnaire → analyse → scan produits (défaut si non précisé)
    if (options.questionnaireOnly && skipIntro && options.hideFootNote && options.productScanAfter == null) {
      options.productScanAfter = true;
    }

    const state = {
      skinType: null,
      intention: null,
      concernIds: [],
      maintenance: false,
      concernId: null,
      concernCustom: '',
      morning: [],
      evening: [],
      frequency: null,
      morningNote: '',
      eveningNote: '',
      favoriteProduct: '',
      favoriteDeclined: false,
      sleep: null,
      hydration: null,
      stress: null,
      screen: 'intro',
      introIndex: 0,
      convIndex: 0,
      convSelections: []
    };

    if (options.restoreFromSaved && options.userId) {
      applySavedToState(state, loadDiagnostic(options.userId));
    }

    if (skipIntro) {
      state.screen = 'skinType';
      state.introIndex = INTRO_SCREENS.length - 1;
    }

    let activeScreen = null;
    let transitionLock = false;
    let analyzingTimer = null;
    let analyzingMessageInterval = null;
    let productScanCleanup = null;

    function cleanupProductScan() {
      if (productScanCleanup) {
        productScanCleanup();
        productScanCleanup = null;
      }
    }

    function analyzeMessages() {
      return options.productScanAfter ? LANDING_ANALYZE_MESSAGES : ANALYZE_MESSAGES;
    }

    function skinTypeSummaryHtml() {
      if (!options.productScanAfter || !state.skinType) return '';
      const item = SKIN_TYPES.find((entry) => entry.id === state.skinType);
      if (!item) return '';
      return `
        <div class="diag-analyze-skin">
          <p class="diag-analyze-skin-kicker">Type de peau enregistré</p>
          <p class="diag-analyze-skin-value">${escapeHtml(item.label)}</p>
          <p class="diag-analyze-skin-hint">${escapeHtml(item.hint)}</p>
        </div>
      `;
    }

    function clearAnalyzingTimers() {
      if (analyzingTimer) {
        clearTimeout(analyzingTimer);
        analyzingTimer = null;
      }
      if (analyzingMessageInterval) {
        clearInterval(analyzingMessageInterval);
        analyzingMessageInterval = null;
      }
    }

    function stepBackHtml() {
      return '<button type="button" class="diag-step-back" data-action="step-back">← Étape précédente</button>';
    }

    function bindStepBack(el) {
      el.querySelector('[data-action="step-back"]')?.addEventListener('click', goBack);
    }

    function convSelectionsForStep(step) {
      if (!step) return [];
      if (step.id === 'lifestyle') {
        return [state.sleep, state.hydration, state.stress].filter(Boolean);
      }
      if (step.id === 'frequency' && state.frequency) return [state.frequency];
      if (step.id === 'favorite') {
        if (state.favoriteProduct) return ['yes'];
        if (state.favoriteDeclined) return ['no'];
      }
      return [];
    }

    function goBack() {
      if (transitionLock) return;

      if (state.screen === 'concern') {
        state.screen = 'intention';
        transitionTo(renderIntention);
        return;
      }

      if (state.screen === 'intention') {
        state.screen = 'skinType';
        transitionTo(renderSkinType);
        return;
      }

      if (state.screen === 'skinType') {
        if (skipIntro) {
          if (typeof options.onExit === 'function') {
            options.onExit();
          } else {
            window.location.href = returnUrl;
          }
          return;
        }
        state.screen = 'intro';
        state.introIndex = INTRO_SCREENS.length - 1;
        transitionTo(renderIntro);
        return;
      }

      if (state.screen === 'intro' && state.introIndex > 0) {
        state.introIndex -= 1;
        transitionTo(renderIntro);
        return;
      }

      if (state.screen === 'conversation') {
        if (state.convIndex > 0) {
          state.convIndex -= 1;
          const prevStep = getConvSteps()[state.convIndex];
          state.convSelections = convSelectionsForStep(prevStep);
          transitionTo(renderConversation);
        } else {
          state.screen = 'concern';
          transitionTo(renderConcern);
        }
        return;
      }

      if (state.screen === 'analyzing' || state.screen === 'result' || state.screen === 'closing') {
        clearAnalyzingTimers();
        state.screen = 'conversation';
        const steps = getConvSteps();
        state.convIndex = Math.max(0, steps.length - 1);
        state.convSelections = convSelectionsForStep(steps[state.convIndex]);
        transitionTo(renderConversation);
        return;
      }

      if (state.screen === 'productScan') {
        cleanupProductScan();
        clearAnalyzingTimers();
        state.screen = 'analyzing';
        transitionTo(renderAnalyzing);
        return;
      }

      if (state.screen === 'routineResults') {
        goProductScan(state.pendingReport || emptyReport());
      }
    }

    root.innerHTML = `
      <div class="diag-ambient" aria-hidden="true">
        <span class="diag-orb diag-orb--1"></span>
        <span class="diag-orb diag-orb--2"></span>
        <span class="diag-orb diag-orb--3"></span>
      </div>
      <div class="diag-immersive">
        <div class="diag-deco-layer" aria-hidden="true">${FLOW_DECO}</div>
        <div class="diag-watermark" aria-hidden="true">
          <span class="diag-watermark__mark"></span>
        </div>
        <div class="diag-hero-content">
          <div
            class="diag-flow-progress"
            id="diagFlowProgress"
            role="progressbar"
            aria-valuemin="1"
            aria-valuemax="${FLOW_TOTAL}"
            aria-valuenow="1"
            aria-label="Étape 1 sur ${FLOW_TOTAL}"
            hidden
          >
            <div class="diag-flow-progress__track">
              <div class="diag-flow-progress__fill" id="diagFlowProgressFill"></div>
            </div>
          </div>
          <div class="diag-stage" id="diagStage"></div>
        </div>
      </div>
      ${options.hideFootNote ? '' : '<p class="diag-foot-note">Conseil cosmétique à visée informative — ne remplace pas un avis médical.</p>'}
    `;

    const stage = document.getElementById('diagStage');
    const flowProgress = document.getElementById('diagFlowProgress');
    const flowProgressFill = document.getElementById('diagFlowProgressFill');
    root.addEventListener('pointerdown', () => { resumeStepAudio(); }, { once: true, passive: true });

    function getCurrentFlowStep() {
      switch (state.screen) {
        case 'skinType': return 1;
        case 'intention': return 2;
        case 'concern': return 3;
        case 'conversation': {
          const steps = getConvSteps();
          const step = steps[state.convIndex];
          if (!step) return FLOW_TOTAL;
          if (step.stepNum) return step.stepNum;
          if (step.id === 'favorite') return 6;
          return 0;
        }
        default: return 0;
      }
    }

    function setFlowProgress(step) {
      if (!flowProgress || !flowProgressFill) return;
      if (!step || step < 1) {
        flowProgress.hidden = true;
        return;
      }
      flowProgress.hidden = false;
      flowProgress.setAttribute('aria-valuenow', String(step));
      flowProgress.setAttribute('aria-label', `Étape ${step} sur ${FLOW_TOTAL}`);
      flowProgressFill.style.width = ((step / FLOW_TOTAL) * 100) + '%';
    }

    function transitionTo(renderFn) {
      if (transitionLock) return;
      transitionLock = true;

      if (activeScreen && activeScreen.dataset.screen === 'productScan') {
        cleanupProductScan();
      }

      const next = renderFn();
      if (!next) {
        transitionLock = false;
        return;
      }
      next.classList.add('is-active');

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = reducedMotion ? 200 : 300;

      function revealScreen(screen) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => screen.classList.add('is-visible'));
        });
      }

      if (!activeScreen) {
        stage.appendChild(next);
        revealScreen(next);
        activeScreen = next;
        setFlowProgress(getCurrentFlowStep());
        transitionLock = false;
        return;
      }

      const prev = activeScreen;
      prev.classList.add('is-leaving');
      prev.classList.remove('is-visible');
      stage.appendChild(next);
      revealScreen(next);

      setTimeout(() => {
        prev.remove();
        activeScreen = next;
        setFlowProgress(getCurrentFlowStep());
        transitionLock = false;
      }, duration);
    }

    function advanceIntro() {
      if (transitionLock) return;
      if (state.introIndex >= INTRO_SCREENS.length - 1) return;
      state.introIndex += 1;
      transitionTo(renderIntro);
    }

    function startQuestionnaire() {
      state.screen = 'skinType';
      transitionTo(renderSkinType);
    }

    function goIntention() {
      state.screen = 'intention';
      transitionTo(renderIntention);
    }

    function renderIntro() {
      const slide = INTRO_SCREENS[state.introIndex];
      const isTap = slide.type !== 'cta';
      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--intro';
      el.dataset.screen = 'intro';
      if (!isTap) el.classList.add('diag-screen--intro-cta');

      let bodyHtml = '';
      if (slide.type === 'stat') {
        bodyHtml = `
          <div class="diag-intro-body diag-intro-body--stat">
            ${introStatHtml(slide)}
            <p class="diag-intro-source">${escapeHtml(slide.source)}</p>
          </div>
        `;
      } else if (slide.type === 'cta') {
        bodyHtml = `
          <div class="diag-intro-body diag-intro-body--cta">
            <p class="diag-intro-text diag-intro-text--lead">${escapeHtml(slide.body)}</p>
            <button type="button" class="diag-hero-pill diag-hero-pill--cta diag-intro-cta" data-action="intro-start">${escapeHtml(slide.cta)}</button>
          </div>
        `;
      } else {
        const paragraphs = slide.paragraphs || (slide.body ? [slide.body] : []);
        const split = paragraphs.length > 1;
        bodyHtml = `
          <div class="diag-intro-body${split ? ' diag-intro-body--split' : ''}">
            ${introParagraphsHtml(paragraphs)}
          </div>
        `;
      }

      el.innerHTML = `
        ${isTap ? `
          <button type="button" class="diag-intro-tap" data-action="intro-advance" aria-label="Tape pour continuer">
            ${bodyHtml}
          </button>
          <p class="diag-intro-hint" aria-hidden="true">
            <span class="diag-intro-hint__chev" aria-hidden="true">›</span>
            Tape pour continuer
          </p>
        ` : bodyHtml}
      `;

      if (isTap) {
        const tapBtn = el.querySelector('[data-action="intro-advance"]');
        tapBtn?.addEventListener('click', advanceIntro);
      } else {
        el.querySelector('[data-action="intro-start"]')?.addEventListener('click', () => {
          hapticSelect();
          startQuestionnaire();
        });
      }

      return el;
    }

    function renderSkinType() {
      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--skin-type';
      el.dataset.screen = 'skinType';
      el.innerHTML = `
        <div class="diag-hero-head">
          ${progressHtml(1)}
          <h1 class="diag-hero-title">Ton type de peau&nbsp;?</h1>
          <p class="diag-hero-sub">On personnalise chaque analyse à partir de ça.</p>
          <p class="diag-concern-hint">Choisis ce qui te ressemble le plus</p>
        </div>
        <div class="diag-hero-stack diag-hero-stack--skin" role="radiogroup" aria-label="Type de peau">
          ${SKIN_TYPES.map((item, i) => `
            <button
              type="button"
              class="diag-hero-pill diag-hero-pill--skin"
              data-skin-type="${item.id}"
              style="--pill-i:${i}"
              aria-pressed="false"
            >
              <span class="diag-skin-pill__copy">
                <span class="diag-hero-pill__label">${escapeHtml(item.label)}</span>
                <span class="diag-hero-pill__hint">${escapeHtml(item.hint)}</span>
              </span>
            </button>
          `).join('')}
        </div>
      `;

      el.querySelectorAll('[data-skin-type]').forEach((btn) => {
        if (state.skinType && btn.dataset.skinType === state.skinType) {
          btn.classList.add('is-selected');
          btn.setAttribute('aria-pressed', 'true');
        }
        btn.addEventListener('click', () => {
          hapticSelect();
          state.skinType = btn.dataset.skinType;
          state.screen = 'intention';
          el.querySelectorAll('[data-skin-type]').forEach((b) => {
            b.classList.toggle('is-selected', b === btn);
            b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
          });
          playStepProgressSound(1);
          setTimeout(() => goIntention(), 220);
        });
      });

      return el;
    }

    function renderIntention() {
      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--intention';
      el.dataset.screen = 'intention';
      el.innerHTML = `
        <div class="diag-hero-head">
          ${progressHtml(2)}
          <h1 class="diag-hero-title">C'est quoi, ta plus belle peau pour toi ?</h1>
          <p class="diag-hero-sub">Pas de mauvaise réponse. On part de ton envie.</p>
        </div>
        <div class="diag-hero-stack diag-hero-stack--concern" role="radiogroup" aria-label="Ton intention">
          ${INTENTIONS.map((item, i) => `
            <button
              type="button"
              class="diag-hero-pill"
              data-intention="${item.id}"
              style="--pill-i:${i}"
              aria-pressed="false"
            >${escapeHtml(item.label)}</button>
          `).join('')}
        </div>
      `;

      el.querySelectorAll('[data-intention]').forEach((btn) => {
        if (state.intention && btn.dataset.intention === state.intention) {
          btn.classList.add('is-selected');
          btn.setAttribute('aria-pressed', 'true');
        }
        btn.addEventListener('click', () => {
          hapticSelect();
          state.intention = btn.dataset.intention;
          state.screen = 'concern';
          el.querySelectorAll('[data-intention]').forEach((b) => {
            b.classList.toggle('is-selected', b === btn);
            b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
          });
          playStepProgressSound(2);
          setTimeout(() => goConcern(), 220);
        });
      });

      return el;
    }

    function renderConcern() {
      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--concern';
      el.dataset.screen = 'concern';

      const selected = new Set(state.concernIds);
      let maintenanceOn = state.maintenance;

      el.innerHTML = `
        <div class="diag-hero-head diag-hero-head--concern">
          ${progressHtml(3)}
          <div class="diag-hero-title-wrap">
            <h1 class="diag-hero-title">On va révéler le meilleur de ta peau</h1>
          </div>
          <p class="diag-hero-sub">Sur quoi on se concentre ?</p>
          <p class="diag-concern-hint">Choisis-en <span class="diag-concern-hint__n">3 maximum</span></p>
        </div>
        <div class="diag-hero-stack diag-hero-stack--concern" role="group" aria-label="Préoccupations peau">
          ${CONCERNS.map((c, i) => `
            <button
              type="button"
              class="diag-hero-pill"
              data-concern="${c.id}"
              style="--pill-i:${i}"
              aria-pressed="false"
            >${escapeHtml(c.label)}</button>
          `).join('')}
        </div>
        <div class="diag-concern-alt">
          <p class="diag-concern-or" aria-hidden="true">ou</p>
          <button
            type="button"
            class="diag-hero-pill diag-hero-pill--exit"
            data-action="maintenance"
            aria-pressed="false"
          >${escapeHtml(MAINTENANCE_OPTION.label)}</button>
        </div>
        <div class="diag-hero-actions diag-hero-actions--concern">
          <button type="button" class="diag-hero-pill diag-hero-pill--cta" data-action="concern-continue" disabled>Continuer</button>
          ${stepBackHtml()}
        </div>
      `;

      const continueBtn = el.querySelector('[data-action="concern-continue"]');
      const exitBtn = el.querySelector('[data-action="maintenance"]');

      function syncUI() {
        const atMax = selected.size >= CONCERN_MAX;

        el.querySelectorAll('[data-concern]').forEach((btn) => {
          const id = btn.dataset.concern;
          const isSel = selected.has(id);
          const blocked = !maintenanceOn && atMax && !isSel;

          btn.classList.toggle('is-selected', isSel);
          btn.classList.toggle('is-disabled', blocked);
          btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
          btn.disabled = blocked;
        });

        exitBtn.classList.toggle('is-selected', maintenanceOn);
        exitBtn.setAttribute('aria-pressed', maintenanceOn ? 'true' : 'false');

        const canContinue = maintenanceOn || selected.size > 0;
        continueBtn.disabled = !canContinue;
      }

      el.querySelectorAll('[data-concern]').forEach((btn) => {
        btn.addEventListener('click', () => {
          hapticSelect();
          const id = btn.dataset.concern;
          if (maintenanceOn) maintenanceOn = false;

          if (selected.has(id)) selected.delete(id);
          else if (selected.size < CONCERN_MAX) selected.add(id);

          syncUI();
        });
      });

      exitBtn.addEventListener('click', () => {
        hapticSelect();
        if (maintenanceOn) {
          maintenanceOn = false;
        } else {
          selected.clear();
          maintenanceOn = true;
        }
        syncUI();
      });

      continueBtn.addEventListener('click', () => {
        if (!maintenanceOn && selected.size === 0) return;

        state.concernIds = Array.from(selected);
        state.maintenance = maintenanceOn;
        state.concernId = maintenanceOn ? 'maintenance' : (state.concernIds[0] || null);
        state.concernCustom = '';
        state.screen = 'conversation';
        state.convIndex = 0;
        playStepProgressSound(3);
        goConversation();
      });

      syncUI();
      bindStepBack(el);
      return el;
    }

    function getConvSteps() {
      const needsFavorite = state.concernId === 'other'
        || !!(state.morningNote && state.morningNote.trim())
        || !!(state.eveningNote && state.eveningNote.trim());

      const steps = [
        {
          id: 'morning',
          stepNum: 4,
          type: 'routine',
          question: 'Raconte-moi ton matin',
          subtitle: 'Dis-moi ce que tu utilises',
          pool: ROUTINE_PRODUCTS
        },
        {
          id: 'evening',
          stepNum: 5,
          type: 'routine',
          question: 'Et le soir ?',
          subtitle: 'Dis-moi ce que tu utilises',
          pool: ROUTINE_PRODUCTS
        },
        {
          id: 'lifestyle',
          stepNum: 6,
          type: 'lifestyle',
          question: 'Et ton mode de vie ?',
          subtitle: 'Ta peau vit avec toi — ça compte aussi.'
        }
      ];

      if (needsFavorite) {
        steps.push({
          id: 'favorite',
          question: 'Y a-t-il un produit que tu aimes particulièrement ?',
          multi: false,
          pool: [
            { id: 'yes', label: 'Oui, je précise' },
            { id: 'no', label: 'Pas vraiment' }
          ],
          optional: true
        });
      }

      steps.push({
        id: 'frequency',
        stepNum: 7,
        type: 'frequency',
        question: 'Où tu en es avec ta routine ?',
        subtitle: 'Encore une, et on révèle ta peau.',
        pool: FREQUENCY_CHIPS
      });

      return steps;
    }

    function renderRoutineStep(step) {
      const isMorning = step.id === 'morning';
      const savedIds = isMorning ? (state.morning || []) : (state.evening || []);
      const savedNote = isMorning ? state.morningNote : state.eveningNote;
      const selected = new Set(savedIds.filter((id) => id !== 'none'));
      let noneOn = savedIds.includes('none');
      let customOpen = !!(savedNote && savedNote.trim());

      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--routine';
      el.dataset.screen = 'conversation';
      el.innerHTML = `
        <div class="diag-hero-head diag-hero-head--concern">
          ${progressHtml(step.stepNum)}
          <h1 class="diag-hero-title">${escapeHtml(step.question)}</h1>
          <p class="diag-hero-sub">${escapeHtml(step.subtitle)}</p>
        </div>
        <div class="diag-hero-stack diag-hero-stack--routine" role="group" aria-label="${escapeHtml(step.subtitle)}">
          ${step.pool.map((chip, i) => `
            <button
              type="button"
              class="diag-hero-pill diag-hero-pill--routine"
              data-product="${chip.id}"
              style="--pill-i:${i}"
              aria-pressed="false"
            >
              <span class="diag-hero-pill__label">${escapeHtml(chip.label)}</span>
              <span class="diag-hero-pill__check" aria-hidden="true"></span>
            </button>
          `).join('')}
        </div>
        <div class="diag-routine-alt">
          <p class="diag-concern-or" aria-hidden="true">ou</p>
          <button
            type="button"
            class="diag-hero-pill diag-hero-pill--exit"
            data-action="routine-none"
            aria-pressed="false"
          >Rien pour l'instant</button>
          <button type="button" class="diag-routine-add" data-action="toggle-custom" aria-expanded="false">
            + Ajouter autre chose
          </button>
          <div class="diag-hero-extra diag-routine-custom" id="diagRoutineCustom"${customOpen ? '' : ' hidden'}>
            <textarea
              class="diag-hero-input"
              id="diagRoutineCustomInput"
              rows="2"
              placeholder="Quel produit utilises-tu ?"
            >${escapeHtml(savedNote || '')}</textarea>
          </div>
        </div>
        <div class="diag-hero-actions diag-hero-actions--concern">
          <button type="button" class="diag-hero-pill diag-hero-pill--cta" data-action="routine-continue" disabled>Continuer</button>
          ${stepBackHtml()}
        </div>
      `;

      const noneBtn = el.querySelector('[data-action="routine-none"]');
      const addBtn = el.querySelector('[data-action="toggle-custom"]');
      const customWrap = el.querySelector('#diagRoutineCustom');
      const customInput = el.querySelector('#diagRoutineCustomInput');
      const continueBtn = el.querySelector('[data-action="routine-continue"]');

      function syncUI() {
        el.querySelectorAll('[data-product]').forEach((btn) => {
          const id = btn.dataset.product;
          const isSel = selected.has(id);
          const blocked = noneOn;

          btn.classList.toggle('is-selected', isSel);
          btn.classList.toggle('is-disabled', blocked);
          btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
          btn.disabled = blocked;
        });

        noneBtn.classList.toggle('is-selected', noneOn);
        noneBtn.setAttribute('aria-pressed', noneOn ? 'true' : 'false');

        addBtn.setAttribute('aria-expanded', customOpen ? 'true' : 'false');
        customWrap.hidden = !customOpen;

        const customNote = (customInput?.value || '').trim();
        const canContinue = noneOn || selected.size > 0 || customNote.length > 0;
        continueBtn.disabled = !canContinue;
      }

      el.querySelectorAll('[data-product]').forEach((btn) => {
        btn.addEventListener('click', () => {
          hapticSelect();
          const id = btn.dataset.product;
          if (noneOn) noneOn = false;

          if (selected.has(id)) selected.delete(id);
          else selected.add(id);

          syncUI();
        });
      });

      noneBtn.addEventListener('click', () => {
        hapticSelect();
        if (noneOn) {
          noneOn = false;
        } else {
          selected.clear();
          noneOn = true;
          customOpen = false;
          if (customInput) customInput.value = '';
        }
        syncUI();
      });

      addBtn.addEventListener('click', () => {
        customOpen = !customOpen;
        if (customOpen) {
          if (noneOn) noneOn = false;
          customInput?.focus();
        }
        syncUI();
      });

      customInput?.addEventListener('input', syncUI);

      continueBtn.addEventListener('click', () => {
        const customNote = (customInput?.value || '').trim();
        if (!noneOn && selected.size === 0 && !customNote) return;

        const ids = noneOn ? ['none'] : Array.from(selected);
        if (isMorning) {
          state.morning = ids;
          state.morningNote = noneOn ? '' : customNote;
        } else {
          state.evening = ids;
          state.eveningNote = noneOn ? '' : customNote;
        }
        state.convIndex += 1;
        state.convSelections = [];
        playStepProgressSound(isMorning ? 4 : 5);
        goConversation();
      });

      syncUI();
      bindStepBack(el);
      return el;
    }

    function renderLifestyleStep(step) {
      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--lifestyle';
      el.dataset.screen = 'conversation';
      el.innerHTML = `
        <div class="diag-hero-head diag-hero-head--concern diag-hero-head--lifestyle">
          ${progressHtml(step.stepNum)}
          <h1 class="diag-hero-title">${escapeHtml(step.question)}</h1>
          <p class="diag-hero-sub">${escapeHtml(step.subtitle)}</p>
        </div>
        <div class="diag-lifestyle-stack">
          ${LIFESTYLE_QUESTIONS.map((q) => `
            <fieldset class="diag-lifestyle-q">
              <legend class="diag-lifestyle-q__label">${escapeHtml(q.label)}</legend>
              <div class="diag-segment" role="radiogroup" aria-label="${escapeHtml(q.label)}" data-lifestyle-group="${q.key}">
                ${q.options.map((opt) => `
                  <button
                    type="button"
                    class="diag-segment__btn"
                    data-lifestyle-key="${q.key}"
                    data-value="${opt.id}"
                    aria-pressed="false"
                  ><span class="diag-segment__text">${escapeHtml(opt.label)}</span></button>
                `).join('')}
              </div>
            </fieldset>
          `).join('')}
        </div>
        <div class="diag-hero-actions diag-hero-actions--concern diag-hero-actions--lifestyle">
          <button type="button" class="diag-hero-pill diag-hero-pill--cta" data-action="lifestyle-continue" disabled>Continuer</button>
          <button type="button" class="diag-hero-skip" data-action="lifestyle-skip">Passer</button>
          ${stepBackHtml()}
        </div>
      `;

      const continueBtn = el.querySelector('[data-action="lifestyle-continue"]');
      const selections = {
        sleep: state.sleep,
        hydration: state.hydration,
        stress: state.stress
      };

      function syncSegmentUI() {
        el.querySelectorAll('.diag-segment__btn').forEach((btn) => {
          const key = btn.dataset.lifestyleKey;
          const val = btn.dataset.value;
          const on = selections[key] === val;
          btn.classList.toggle('is-selected', on);
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        const complete = LIFESTYLE_QUESTIONS.every((q) => selections[q.key]);
        continueBtn.disabled = !complete;
      }

      el.querySelectorAll('.diag-segment__btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          hapticSelect();
          selections[btn.dataset.lifestyleKey] = btn.dataset.value;
          syncSegmentUI();
        });
      });

      function advanceLifestyle() {
        state.sleep = selections.sleep;
        state.hydration = selections.hydration;
        state.stress = selections.stress;
        state.convIndex += 1;
        state.convSelections = [];
        playStepProgressSound(6);
        goConversation();
      }

      continueBtn.addEventListener('click', () => {
        if (continueBtn.disabled) return;
        advanceLifestyle();
      });

      el.querySelector('[data-action="lifestyle-skip"]')?.addEventListener('click', () => {
        state.sleep = null;
        state.hydration = null;
        state.stress = null;
        state.convIndex += 1;
        state.convSelections = [];
        goConversation();
      });

      syncSegmentUI();
      bindStepBack(el);
      return el;
    }

    function renderFrequencyStep(step) {
      const selectedId = state.frequency || null;

      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--routine diag-screen--frequency';
      el.dataset.screen = 'conversation';
      el.innerHTML = `
        <div class="diag-hero-head diag-hero-head--concern">
          ${progressHtml(step.stepNum)}
          <h1 class="diag-hero-title">${escapeHtml(step.question)}</h1>
          <p class="diag-hero-sub">${escapeHtml(step.subtitle)}</p>
        </div>
        <div class="diag-hero-stack diag-hero-stack--routine" role="radiogroup" aria-label="${escapeHtml(step.question)}">
          ${step.pool.map((chip, i) => `
            <button
              type="button"
              class="diag-hero-pill diag-hero-pill--routine${selectedId === chip.id ? ' is-selected' : ''}"
              data-frequency="${chip.id}"
              style="--pill-i:${i}"
              aria-pressed="${selectedId === chip.id ? 'true' : 'false'}"
            >
              <span class="diag-hero-pill__label">${escapeHtml(chip.label)}</span>
              <span class="diag-hero-pill__check" aria-hidden="true"></span>
            </button>
          `).join('')}
        </div>
        <div class="diag-step-nav diag-step-nav--sticky">${stepBackHtml()}</div>
      `;

      el.querySelectorAll('[data-frequency]').forEach((btn) => {
        btn.addEventListener('click', () => {
          hapticSelect();
          const id = btn.dataset.frequency;
          state.frequency = id;
          el.querySelectorAll('[data-frequency]').forEach((b) => {
            const on = b.dataset.frequency === id;
            b.classList.toggle('is-selected', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          state.convIndex += 1;
          try { playStepProgressSound(7); } catch (_) { /* ignore */ }
          setTimeout(() => finishFlow(), 240);
        });
      });

      bindStepBack(el);
      return el;
    }

    function renderConversation() {
      const steps = getConvSteps();
      const step = steps[state.convIndex];
      if (!step) {
        finishFlow();
        return null;
      }

      if (step.type === 'routine') {
        return renderRoutineStep(step);
      }

      if (step.type === 'lifestyle') {
        return renderLifestyleStep(step);
      }

      if (step.type === 'frequency') {
        return renderFrequencyStep(step);
      }

      const progress = PROGRESS_HINTS[Math.min(state.convIndex, PROGRESS_HINTS.length - 1)];
      const selected = new Set(
        state.convSelections.length ? state.convSelections : convSelectionsForStep(step)
      );

      const el = document.createElement('section');
      el.className = 'diag-screen';
      el.dataset.screen = 'conversation';
      el.innerHTML = `
        <div class="diag-hero-head">
          ${step.stepNum ? progressHtml(step.stepNum) : ''}
          <h1 class="diag-hero-title">${escapeHtml(step.question)}</h1>
          ${progress ? `<p class="diag-hero-sub">${escapeHtml(progress)}</p>` : ''}
        </div>
        <div class="diag-hero-stack diag-hero-stack--tight" role="group" aria-label="${escapeHtml(step.question)}">
          ${step.pool.map((chip) => `
            <button type="button" class="diag-hero-pill${selected.has(chip.id) ? ' is-selected' : ''}" data-chip="${chip.id}">${escapeHtml(chip.label)}</button>
          `).join('')}
        </div>
        <div class="diag-hero-extra" id="diagConvNote" hidden>
          <textarea class="diag-hero-input" id="diagConvNoteInput" rows="2" placeholder="Précise en quelques mots…"></textarea>
        </div>
        <div class="diag-hero-actions diag-hero-actions--concern" id="diagConvFoot" hidden>
          ${step.optional ? '<button type="button" class="diag-hero-skip" data-action="skip">Passer</button>' : ''}
          <button type="button" class="diag-hero-pill diag-hero-pill--cta" data-action="conv-next">Continuer</button>
        </div>
        <div class="diag-step-nav diag-step-nav--sticky">${stepBackHtml()}</div>
      `;

      const noteWrap = el.querySelector('#diagConvNote');
      const noteInput = el.querySelector('#diagConvNoteInput');
      const foot = el.querySelector('#diagConvFoot');

      if (step.id === 'favorite') {
        if (selected.has('yes')) {
          noteWrap.hidden = false;
          noteInput.value = state.favoriteProduct || '';
          foot.hidden = false;
        } else if (selected.has('no')) {
          noteWrap.hidden = true;
          foot.hidden = true;
        }
      }

      function syncFoot() {
        if (step.multi) {
          foot.hidden = selected.size === 0;
          return;
        }
        foot.hidden = true;
      }

      el.querySelectorAll('[data-chip]').forEach((btn) => {
        btn.addEventListener('click', () => {
          hapticSelect();
          const id = btn.dataset.chip;
          if (step.multi) {
            if (selected.has(id)) selected.delete(id);
            else selected.add(id);
            btn.classList.toggle('is-selected', selected.has(id));
            if (id === 'custom' || id === 'yes') {
              noteWrap.hidden = !selected.has(id);
              if (selected.has(id)) noteInput?.focus();
            } else if (id !== 'custom') {
              if (!selected.has('custom') && !selected.has('yes')) noteWrap.hidden = true;
            }
            syncFoot();
          } else {
            selected.clear();
            selected.add(id);
            el.querySelectorAll('[data-chip]').forEach((b) => b.classList.toggle('is-selected', b.dataset.chip === id));
            if (id === 'yes') {
              noteWrap.hidden = false;
              noteInput?.focus();
              foot.hidden = false;
            } else {
              noteWrap.hidden = true;
              commitConversationStep(Array.from(selected), '');
            }
          }
        });
      });

      el.querySelector('[data-action="conv-next"]')?.addEventListener('click', () => {
        const note = (noteInput?.value || '').trim();
        commitConversationStep(Array.from(selected), note);
      });

      el.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
        state.convIndex += 1;
        state.convSelections = [];
        goConversation();
      });

      syncFoot();
      bindStepBack(el);
      return el;

      function commitConversationStep(ids, note) {
        if (step.id === 'morning') {
          state.morning = ids;
          state.morningNote = note;
        } else if (step.id === 'evening') {
          state.evening = ids;
          state.eveningNote = note;
        } else if (step.id === 'favorite') {
          if (ids[0] === 'yes') {
            state.favoriteProduct = note;
            state.favoriteDeclined = false;
          } else {
            state.favoriteProduct = '';
            state.favoriteDeclined = ids[0] === 'no';
          }
        }
        state.convIndex += 1;
        state.convSelections = [];
        goConversation();
      }
    }

    function startAnalyzeMessages() {
      const screenEl = activeScreen;
      if (!screenEl) return;

      const msgEl = screenEl.querySelector('#diagAnalyzeMsg');
      const halo = screenEl.querySelector('.diag-analyze-halo');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (halo) halo.classList.toggle('is-static', reduced);

      let idx = 0;

      function showMessage(i, animate) {
        if (!msgEl) return;
        const messages = analyzeMessages();
        const text = messages[i];
        if (!animate || reduced) {
          msgEl.textContent = text;
          return;
        }
        msgEl.classList.add('is-changing');
        setTimeout(() => {
          msgEl.textContent = text;
          msgEl.classList.remove('is-changing');
        }, 200);
      }

      showMessage(0, false);

      analyzingMessageInterval = setInterval(() => {
        idx += 1;
        const messages = analyzeMessages();
        if (idx < messages.length) {
          showMessage(idx, true);
        } else {
          clearInterval(analyzingMessageInterval);
          analyzingMessageInterval = null;
        }
      }, 900);
    }

    function finishAnalyzingTransition(report) {
      clearAnalyzingTimers();
      if (options.productScanAfter) {
        goProductScan(report);
        return;
      }
      if (options.questionnaireOnly) {
        finishFlow();
        return;
      }
      if (report) {
        state.screen = 'result';
        transitionTo(() => renderResult(report));
      } else {
        state.screen = 'closing';
        transitionTo(renderClosing);
      }
    }

    function renderAnalyzing() {
      const messages = analyzeMessages();
      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--analyzing';
      el.dataset.screen = 'analyzing';
      el.innerHTML = `
        ${skinTypeSummaryHtml()}
        <div class="diag-analyze-stage">
          <div class="diag-analyze-halo" aria-hidden="true">
            <span class="diag-analyze-ring"></span>
            <span class="diag-analyze-core"></span>
          </div>
          <p class="diag-analyze-msg" id="diagAnalyzeMsg" aria-live="polite">${escapeHtml(messages[0])}</p>
        </div>
        <div class="diag-step-nav diag-step-nav--sticky">${stepBackHtml()}</div>
      `;
      bindStepBack(el);
      return el;
    }

    function goProductScan(report) {
      if (!global.VirceneProductScan) {
        completeFlow(report || emptyReport());
        return;
      }
      state.screen = 'productScan';
      state.pendingReport = report;
      transitionTo(() => {
        cleanupProductScan();
        const scan = global.VirceneProductScan.createScreen({
          onBack: () => {
            state.screen = 'analyzing';
            transitionTo(renderAnalyzing);
          },
          onComplete: (photos) => {
            state.productPhotos = photos;
            goRoutineAnalyzing(state.pendingReport || emptyReport());
          }
        });
        productScanCleanup = scan.destroy;
        return scan.element;
      });
    }

    function routineResultsOptions(report) {
      return {
        skinType: state.skinType,
        morning: state.morning,
        evening: state.evening,
        concernIds: state.concernIds,
        report: report,
        onBack: () => goProductScan(report),
        onRescan: () => goProductScan(report),
        onSubscribe: () => {
          try {
            sessionStorage.setItem('vircene_landing_diag', JSON.stringify(buildPayload(report)));
          } catch (_) { /* ignore */ }
        },
        onDone: (data) => {
          if (data && data.products) {
            state.detectedProducts = data.products;
            state.routineAnalysis = data.analysis;
          }
          completeFlow(report);
        }
      };
    }

    function goRoutineAnalyzing(report) {
      if (!global.VirceneRoutineResults?.createAnalyzingScreen) {
        goRoutineResults(report);
        return;
      }
      state.screen = 'routineAnalyzing';
      state.pendingReport = report;
      transitionTo(() => {
        cleanupProductScan();
        const analyzing = global.VirceneRoutineResults.createAnalyzingScreen({
          photos: state.productPhotos || [],
          skinType: state.skinType,
          morning: state.morning,
          evening: state.evening,
          concernIds: state.concernIds,
          onComplete: (data) => {
            state.detectedProducts = data.products;
            state.routineAnalysis = data.analysis;
            goRoutineResults(report, data);
          }
        });
        return analyzing.element;
      });
    }

    function goRoutineResults(report, data) {
      if (!global.VirceneRoutineResults?.createResultsScreen) {
        completeFlow(report);
        return;
      }
      state.screen = 'routineResults';
      state.pendingReport = report;
      const payload = data || {
        products: state.detectedProducts || [],
        analysis: state.routineAnalysis || {}
      };
      transitionTo(() => {
        const result = global.VirceneRoutineResults.createResultsScreen(Object.assign({
          products: payload.products,
          analysis: payload.analysis
        }, routineResultsOptions(report)));
        return result.element;
      });
    }

    function emptyReport() {
      return {
        lead: '',
        primary: { title: '', body: '' },
        adjust: '',
        outro: ''
      };
    }

    function renderResult(report) {
      const el = document.createElement('section');
      el.className = 'diag-screen diag-screen--result';
      el.dataset.screen = 'result';
      el.innerHTML = `
        <div class="diag-hero-sheet">
          <p class="diag-sheet-lead">${escapeHtml(report.lead)}</p>
          <div class="diag-sheet-block">
            <p class="diag-sheet-kicker">${escapeHtml(report.primary.title)}</p>
            <p class="diag-sheet-body">${escapeHtml(report.primary.body)}</p>
          </div>
          ${report.secondary ? `
            <div class="diag-sheet-block">
              <p class="diag-sheet-body">${escapeHtml(report.secondary)}</p>
            </div>
          ` : ''}
          <div class="diag-sheet-block">
            <p class="diag-sheet-kicker">Ce qu'on ajuste</p>
            <p class="diag-sheet-body">${escapeHtml(report.adjust)}</p>
          </div>
          <p class="diag-sheet-outro">${escapeHtml(report.outro)}</p>
          <button type="button" class="diag-hero-pill diag-hero-pill--dark" data-action="finish">${
            options.preview
              ? 'Retour à l\'app'
              : (skipIntro ? 'Retour à mon analyse' : 'Entrer dans Vircène')
          }</button>
        </div>
        <div class="diag-step-nav">${stepBackHtml()}</div>
      `;

      el.querySelector('[data-action="finish"]')?.addEventListener('click', () => {
        completeFlow(report);
      });

      bindStepBack(el);
      return el;
    }

    function buildPayload(report) {
      return {
        skinType: state.skinType,
        intention: state.intention,
        concernIds: state.concernIds,
        maintenance: state.maintenance,
        concernId: state.concernId,
        concernCustom: state.concernCustom,
        morning: state.morning,
        evening: state.evening,
        frequency: state.frequency,
        morningNote: state.morningNote,
        eveningNote: state.eveningNote,
        favoriteProduct: state.favoriteProduct,
        sleep: state.sleep,
        hydration: state.hydration,
        stress: state.stress,
        productPhotos: state.productPhotos || [],
        detectedProducts: state.detectedProducts || [],
        routineAnalysis: state.routineAnalysis || null,
        report: report ? {
          lead: report.lead,
          primary: report.primary && report.primary.body ? report.primary.body : (report.primary || ''),
          secondary: report.secondary || null,
          adjust: report.adjust,
          outro: report.outro
        } : null
      };
    }

    function completeFlow(report) {
      const payload = buildPayload(report);
      if (options.userId) saveDiagnostic(options.userId, payload);
      if (typeof options.onComplete === 'function') {
        options.onComplete(payload);
      } else if (options.preview) {
        window.location.href = 'app.html';
      }
    }

    function goAnalyzing() {
      if (options.questionnaireOnly && !options.productScanAfter) {
        finishFlow();
        return;
      }
      clearAnalyzingTimers();
      state.screen = 'analyzing';

      // Fallback local (règles statiques), toujours disponible
      const localReport = global.VirceneDiagnosticEngine
        ? global.VirceneDiagnosticEngine.buildDiagnostic(state)
        : null;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const minDuration = reduced ? 2600 : 3400;

      transitionTo(renderAnalyzing);
      setTimeout(() => startAnalyzeMessages(), 480);

      // Temps d'affichage minimum (pour l'animation)
      const delayPromise = new Promise(function (res) {
        analyzingTimer = setTimeout(res, minDuration);
      });

      // Appel IA — fallback silencieux sur le rapport local
      const diagUrl = (global.VIRCENE_CONFIG && global.VIRCENE_CONFIG.api && global.VIRCENE_CONFIG.api.diagnosticAi)
        || '/.netlify/functions/diagnostic-ai';
      const diagHeaders = { 'Content-Type': 'application/json' };
      try {
        if (global.VirceneAuth && global.VirceneAuth.getAccessToken) {
          const tok = await global.VirceneAuth.getAccessToken();
          if (tok) diagHeaders['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const apiPromise = fetch(diagUrl, {
        method: 'POST',
        headers: diagHeaders,
        body: JSON.stringify({ state: state }),
      })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
        .catch(function (err) {
          console.warn('[Vircène diagnostic-ai] fallback local :', err.message);
          return localReport;
        });

      Promise.all([apiPromise, delayPromise]).then(function (results) {
        if (state.screen !== 'analyzing') return; // annulé (retour arrière)
        finishAnalyzingTransition(results[0] || localReport);
      });
    }

    function goConcern() {
      state.screen = 'concern';
      transitionTo(renderConcern);
    }

    function goConversation() {
      state.screen = 'conversation';
      const el = renderConversation();
      if (el) transitionTo(() => el);
      else finishFlow();
    }

    function finishFlow() {
      if (options.questionnaireOnly && !options.productScanAfter) {
        const report = global.VirceneDiagnosticEngine
          ? global.VirceneDiagnosticEngine.buildDiagnostic(state)
          : null;
        completeFlow(report || emptyReport());
        return;
      }
      if (options.productScanAfter) {
        const report = global.VirceneDiagnosticEngine
          ? global.VirceneDiagnosticEngine.buildDiagnostic(state)
          : emptyReport();
        goProductScan(report);
        return;
      }
      goAnalyzing();
    }

    function renderClosing() {
      const el = document.createElement('section');
      el.className = 'diag-screen';
      el.dataset.screen = 'closing';
      el.innerHTML = `
        <div class="diag-hero-head">
          <h1 class="diag-hero-title">Merci.\nVotre première lecture se prépare — la suite vous attend dans l'app.</h1>
        </div>
        <button type="button" class="diag-hero-pill diag-hero-pill--cta" data-action="finish">${options.preview ? 'Retour à l\'app' : 'Entrer dans Vircène'}</button>
        <div class="diag-step-nav">${stepBackHtml()}</div>
      `;
      el.querySelector('[data-action="finish"]')?.addEventListener('click', () => {
        completeFlow({ lead: '', primary: { title: '', body: '' }, adjust: '', outro: '' });
      });
      bindStepBack(el);
      return el;
    }

    transitionTo(skipIntro ? renderSkinType : renderIntro);
  }

  global.VirceneDiagnostic = {
    boot,
    CONCERNS,
    INTENTIONS,
    SKIN_TYPES,
    saveDiagnostic,
    loadDiagnostic,
    formatDiagnosticSummary,
    ROUTINE_PRODUCTS,
    FREQUENCY_CHIPS,
    LIFESTYLE_QUESTIONS
  };
})(window);

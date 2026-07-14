/**
 * Vircène — Réponses IA mock (étape 4 du workflow).
 * Copier ici une vraie réponse API après 1 appel test, puis construire l'UI sans payer.
 * mode: 'mock' dans js/config.js → api
 */
(function (global) {
  'use strict';

  /** Face Scan — réponse type (à remplacer par ta vraie réponse API) */
  const MOCK_FACE_SCAN = {
    skin: 'sèche',
    concerns: ['rougeurs', 'déshydratation', 'ridules'],
    ridules: 'modéré',
    viraHtml:
      '<p>Merci d\u2019avoir partag\u00e9 \u2728 D\u2019apr\u00e8s ton scan, ta peau semble plut\u00f4t ' +
      '<strong>s\u00e8che</strong>, avec des <strong>rougeurs</strong> et une ' +
      '<strong>d\u00e9shydratation</strong> comme pr\u00e9occupations principales. ' +
      'On note aussi un niveau mod\u00e9r\u00e9 de <strong>ridules</strong>.</p>' +
      '<p>Une peau s\u00e8che produit moins de s\u00e9bum — d\u2019o\u00f9 les tiraillements. ' +
      'Les rougeurs traduisent souvent une barri\u00e8re un peu fragilis\u00e9e. ' +
      'La d\u00e9shydratation, elle, se traite avec de l\u2019hydratation en profondeur.</p>' +
      '<p>Bonne nouvelle : c\u2019est un profil tr\u00e8s courant, et on l\u2019apaise facilement ' +
      'avec une routine douce et cibl\u00e9e.</p>',
    tags: ['Rougeurs', 'Déshydratation', 'Ridules'],
    meText: 'J\u2019ai fait un scan de mon visage \uD83D\uDCF8',
    summary: { skin: 'sèche', concerns: ['rougeurs', 'déshydratation'], ridules: 'modéré' },
    source: 'mock',
  };

  /** Chat Vira — réponses par intention (à enrichir avec vraies réponses API) */
  const MOCK_CHAT_REPLIES = [
    {
      match: /conseil/i,
      replyHtml:
        '<p>Voici mes conseils pour ta peau \u2728</p><ul>' +
        '<li>Nettoie en douceur — pas d\u2019eau br\u00fblante ni de savons d\u00e9capants.</li>' +
        '<li>Hydrate : acide hyaluronique + glyc\u00e9rine le matin.</li>' +
        '<li>Renforce ta barri\u00e8re avec des c\u00e9ramides le soir.</li>' +
        '<li>Apaise les rougeurs : niacinamide, panth\u00e9nol ou centella.</li>' +
        '<li>SPF tous les matins, m\u00eame en hiver.</li></ul>',
    },
    {
      match: /produit/i,
      replyHtml:
        '<p>Pour ton profil, je te conseille ces familles :</p><ul>' +
        '<li><strong>Nettoyant doux</strong> sans sulfates</li>' +
        '<li><strong>S\u00e9rum hydratant</strong> \u00e0 l\u2019acide hyaluronique</li>' +
        '<li><strong>Cr\u00e8me barri\u00e8re</strong> aux c\u00e9ramides</li>' +
        '<li><strong>SPF 50</strong> texture confortable</li></ul>' +
        '<p>Ajoute-les dans \u00ab Mes produits \u00bb : je v\u00e9rifierai leur composition.</p>',
    },
    {
      match: /routine/i,
      replyHtml:
        '<p>Voici une routine de d\u00e9part, tout en douceur :</p>' +
        '<p><strong>Matin</strong> : nettoyant doux \u2192 s\u00e9rum hydratant \u2192 cr\u00e8me \u2192 SPF.</p>' +
        '<p><strong>Soir</strong> : nettoyant doux \u2192 niacinamide \u2192 soin riche c\u00e9ramides.</p>' +
        '<p>On l\u2019ajustera ensemble au fil de ton \u00e9volution \u2726</p>',
    },
  ];

  const MOCK_CHAT_DEFAULT =
    '<p>Je suis l\u00e0 pour t\u2019aider \u2726 Pose-moi une question sur ta peau, ta routine, ' +
    'ou lance un Face Scan pour partir sur des bases solides.</p>';

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function mockChat(options) {
    options = options || {};
    const message = String(options.message || '');
    const scanContext = options.scanContext;

    let replyHtml = MOCK_CHAT_DEFAULT;
    if (scanContext?.skin && /scan|visage|peau/i.test(message)) {
      replyHtml =
        '<p>D\u2019apr\u00e8s ton scan (peau <strong>' + scanContext.skin + '</strong>, ' +
        (scanContext.concerns || []).join(', ') + '), dis-moi ce que tu veux approfondir : ' +
        'conseils, produits ou routine ?</p>';
    } else {
      for (var i = 0; i < MOCK_CHAT_REPLIES.length; i++) {
        if (MOCK_CHAT_REPLIES[i].match.test(message)) {
          replyHtml = MOCK_CHAT_REPLIES[i].replyHtml;
          break;
        }
      }
    }

    return delay(650 + Math.min(message.length * 8, 400)).then(function () {
      return { replyHtml: replyHtml, source: 'mock' };
    });
  }

  /** Product Scan — réponse validée ChatGPT (routine Yepoda + Anua + TO) */
  const MOCK_PRODUCT_SCAN = {
    products: [
      {
        brand: 'Yepoda',
        name: 'The Bubble Double',
        active: 'bha',
        ingredients: ['Salicylic Acid', 'Pomegranate'],
        description: 'Mousse nettoyante à l\'acide salicylique et à la grenade pour nettoyer la peau en douceur et désincruster les pores — à utiliser matin et soir avant le reste de ta routine.'
      },
      {
        brand: 'Yepoda',
        name: 'The Purify Hero',
        active: 'bha',
        ingredients: ['BHA'],
        description: 'Sérum exfoliant au BHA naturel, étape 4 de ta routine Yepoda — à utiliser matin et soir pour affiner le grain de peau.'
      },
      {
        brand: 'Yepoda',
        name: 'The Day Light',
        active: 'creme',
        ingredients: ['Rose Water', 'Mugwort', 'Niacinamide'],
        description: 'Crème hydratante sans huile à l\'eau de rose, à l\'armoise et à la niacinamide — parfaite pour apaiser et hydrater la peau en journée.'
      },
      {
        brand: 'Anua',
        name: 'Niacinamide 10 + TXA 4 Serum',
        active: 'niacinamide',
        ingredients: ['Niacinamide', 'TXA'],
        description: 'Sérum concentré en niacinamide et TXA pour unifier le teint et atténuer l\'apparence des taches, matin ou soir.'
      },
      {
        brand: 'Anua',
        name: 'Zero-cast Moisturizing Finish Sunscreen SPF 50 PA++++',
        active: 'spf',
        ingredients: ['SPF 50'],
        description: 'Protection solaire SPF50 PA++++ au fini hydratant et sans trace blanche — la dernière étape de ta routine du matin.'
      },
      {
        brand: 'The Ordinary',
        name: 'Alpha Arbutin 2% + HA',
        active: 'ha',
        ingredients: ['Alpha Arbutin', 'HA'],
        description: 'Sérum haute concentration à l\'alpha-arbutine et à l\'acide hyaluronique pour cibler les taches pigmentaires et unifier le teint.'
      }
    ],
    source: 'mock',
  };

  function mockDetectProducts(urls) {
    const count = Math.max(1, Math.min((urls && urls.length) || 1, MOCK_PRODUCT_SCAN.products.length));
    const products = MOCK_PRODUCT_SCAN.products.slice(0, count).map(function (p, i) {
      return Object.assign({}, p, {
        photoIndex: i,
        photoUrl: (urls && urls[i]) || (urls && urls[0]) || ''
      });
    });
    return delay(900 + products.length * 120).then(function () {
      return { products: products, source: 'mock' };
    });
  }

  function mockFaceScan() {
    return delay(1200).then(function () {
      return Object.assign({}, MOCK_FACE_SCAN);
    });
  }

  global.VirceneAIMocks = {
    chat: mockChat,
    analyzeFace: mockFaceScan,
    detectProducts: mockDetectProducts,
    MOCK_FACE_SCAN: MOCK_FACE_SCAN,
    MOCK_PRODUCT_SCAN: MOCK_PRODUCT_SCAN,
  };
})(window);

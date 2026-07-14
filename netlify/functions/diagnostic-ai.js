/**
 * Vircène — Diagnostic routine IA
 * POST { state: { skinType, intention, concernIds, morning, evening, frequency,
 *                 morningNote?, eveningNote?, sleep?, stress?, hydration?,
 *                 detectedProducts?, favoriteProduct? } }
 * Retourne { lead, primary: { title, body }, secondary?, adjust, outro }
 */
const { OPENAI_MODEL } = require('../lib/prompts');
const { verifyPremium } = require('../lib/auth');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const SKIN_TYPE_LABELS = {
  seche: 'sèche',
  grasse: 'grasse',
  mixte: 'mixte',
  normale: 'normale',
  sensible: 'sensible',
};

const INTENTION_LABELS = {
  nette: 'une peau plus nette (imperfections, pores)',
  lumineux: 'un teint plus lumineux (éclat, taches)',
  apaisee: 'une peau plus apaisée (rougeurs, sensibilités)',
  selfcare: 'entretenir et optimiser sa routine',
};

const CONCERN_LABELS = {
  imperfections: 'imperfections / boutons',
  sebum: 'excès de sébum / brillance',
  teint: 'teint terne / manque d\'éclat',
  pores: 'pores dilatés / grain de peau',
  taches: 'taches / marques',
  cernes: 'cernes',
  rougeurs: 'rougeurs / sensibilités',
  secheresse: 'sécheresse / tiraillements',
  ridules: 'ridules / fermeté',
  maintenance: 'entretien général',
};

const PRODUCT_LABELS = {
  cleanser: 'nettoyant',
  toner: 'tonique / essence',
  serum: 'sérum',
  moisturizer: 'crème hydratante',
  spf: 'protection solaire',
  retinol: 'rétinoïde',
  aha: 'exfoliant AHA',
  bha: 'exfoliant BHA',
  vitc: 'vitamine C',
  niacinamide: 'niacinamide',
  ha: 'acide hyaluronique',
  bpo: 'peroxyde de benzoyle',
  creme: 'crème / soin',
  oil: 'huile',
  mask: 'masque',
};

const FREQ_LABELS = {
  daily: 'tous les jours',
  often: '5 à 6 jours/semaine',
  sometimes: '3 à 4 jours/semaine',
  rarely: '1 à 2 jours/semaine',
};

const SYSTEM_PROMPT = `RÔLE
Tu es l'experte skincare de Vircène. Tu analyses la routine d'une utilisatrice et tu lui expliques, avec précision, pourquoi elle n'obtient pas le résultat qu'elle attend.

TON
- Experte calme et raffinée. Chaleureuse, jamais familière, jamais alarmiste.
- Phrases courtes et claires. Zéro jargon non expliqué.
- Tu rassures : un problème de routine se corrige, ce n'est pas grave.
- Toujours "tu" (tutoiement).

TA MISSION
Identifier LA raison principale (parfois une 2e secondaire) pour laquelle la routine ne donne pas le résultat attendu. Cherche dans cet ordre :
1. Conflits d'actifs (deux ingrédients qui s'annulent ou ne doivent pas se superposer).
2. Erreurs d'ordre d'application (texture trop riche avant un actif, etc.).
3. Surcharge ou fréquence excessive (peau agressée).
4. Étape clé manquante pour SA préoccupation précise.

RÈGLES
- Sois précise : nomme les produits/ingrédients EN CAUSE, pas de conseil générique.
- Vise l'effet "ah, c'était donc ça".
- Explique le POURQUOI en une phrase (le mécanisme).
- Ne diagnostique jamais de pathologie médicale.
- N'invente pas d'interactions incertaines.

FORMAT DE RÉPONSE — JSON strict, rien d'autre :
{
  "lead": "<1 phrase qui reformule sa préoccupation avec bienveillance>",
  "primary": {
    "title": "Voici ce qui freine tes résultats :",
    "body": "<diagnostic principal, nommant produit(s) et mécanisme, 2-3 phrases max>"
  },
  "secondary": "<optionnel, 1 phrase légère si un 2e point existe, sinon null>",
  "adjust": "<correction concrète : quoi changer dans l'ordre, la fréquence ou le type de produit, 2-3 phrases>",
  "outro": "On refait le point dans deux semaines — photo à l'appui — pour voir si l'ajustement porte ses fruits."
}`;

function buildUserMessage(state) {
  const lines = [];

  const skin = SKIN_TYPE_LABELS[state.skinType] || state.skinType || 'non précisé';
  lines.push(`Type de peau : ${skin}`);

  const intention = INTENTION_LABELS[state.intention] || state.intention || 'non précisé';
  lines.push(`Objectif : ${intention}`);

  const concerns = (state.concernIds || [])
    .map((id) => CONCERN_LABELS[id] || id)
    .filter(Boolean);
  if (concerns.length) lines.push(`Préoccupations : ${concerns.join(', ')}`);

  const freq = FREQ_LABELS[state.frequency] || state.frequency || 'non précisé';
  lines.push(`Fréquence : ${freq}`);

  const morningProds = (state.morning || []).map((id) => PRODUCT_LABELS[id] || id).filter(Boolean);
  if (morningProds.length) lines.push(`Routine matin : ${morningProds.join(' → ')}`);
  else lines.push('Routine matin : non renseignée');

  const eveningProds = (state.evening || []).map((id) => PRODUCT_LABELS[id] || id).filter(Boolean);
  if (eveningProds.length) lines.push(`Routine soir : ${eveningProds.join(' → ')}`);
  else lines.push('Routine soir : non renseignée');

  if (state.morningNote) lines.push(`Détail routine matin : "${state.morningNote}"`);
  if (state.eveningNote) lines.push(`Détail routine soir : "${state.eveningNote}"`);
  if (state.favoriteProduct) lines.push(`Produit favori : "${state.favoriteProduct}"`);

  // Produits réels scannés
  const scanned = (state.detectedProducts || []).filter((p) => p && p.name);
  if (scanned.length) {
    lines.push('Produits scannés :');
    scanned.forEach((p) => {
      const ings = (p.ingredients || []).slice(0, 5).join(', ');
      lines.push(`  - ${p.brand || ''} ${p.name} (actif : ${p.active || '?'}${ings ? ', INCI : ' + ings : ''})`);
    });
  }

  // Mode de vie
  if (state.sleep === 'short') lines.push('Mode de vie : peu de sommeil en ce moment');
  if (state.hydration === 'rare') lines.push('Mode de vie : hydratation insuffisante');
  if (state.stress === 'pressure') lines.push('Mode de vie : période de stress / pression');

  return lines.join('\n');
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS,
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method Not Allowed' });

  const premium = await verifyPremium(event.headers['authorization'] || event.headers['Authorization']);
  if (!premium) return jsonResponse(403, { error: 'Accès réservé aux membres Premium.' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonResponse(503, { error: 'OPENAI_API_KEY manquante' });

  let state;
  try {
    const body = JSON.parse(event.body || '{}');
    state = body.state || body;
  } catch {
    return jsonResponse(400, { error: 'JSON invalide' });
  }

  if (!state.skinType && !state.intention && !state.concernIds?.length) {
    return jsonResponse(400, { error: 'Données questionnaire insuffisantes' });
  }

  const userMessage = buildUserMessage(state);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 600,
        temperature: 0.5,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return jsonResponse(502, { error: data.error?.message || 'OpenAI HTTP ' + res.status });
    }

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return jsonResponse(502, { error: 'Réponse OpenAI vide' });

    const report = JSON.parse(raw);

    // Normalise pour être compatible avec renderResult() côté client
    return jsonResponse(200, {
      lead: report.lead || '',
      primary: {
        title: report.primary?.title || 'Voici ce qui freine tes résultats :',
        body: report.primary?.body || '',
      },
      secondary: report.secondary || null,
      adjust: report.adjust || '',
      outro: report.outro || 'On refait le point dans deux semaines — photo à l\'appui — pour voir si l\'ajustement porte ses fruits.',
    });
  } catch (err) {
    console.error('[diagnostic-ai]', err);
    return jsonResponse(502, { error: err.message || 'Diagnostic indisponible' });
  }
};

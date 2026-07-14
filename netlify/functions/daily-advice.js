/**
 * Vircène — Conseil du jour IA
 * POST { weather: { temp, humidity, uv, aqi, isDay, weatherText, phase },
 *        profile: { skinType?, concerns?: string[], vitrine?: {name,active}[] } }
 * Retourne { advice: string, trigger: string }
 * Conçu pour être rapide : max_tokens 150, temperature 0.4
 */
const { OPENAI_MODEL } = require('../lib/prompts');
const { verifyPremium } = require('../lib/auth');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const PHASE_LABELS = {
  morning: 'matin',
  afternoon: 'après-midi',
  evening: 'soir',
};

const SKIN_LABELS = {
  seche: 'sèche',
  grasse: 'grasse',
  mixte: 'mixte',
  normale: 'normale',
  sensible: 'sensible',
  deshydratee: 'déshydratée',
};

const SYSTEM_PROMPT = `Tu es l'experte skincare de Vircène. Génère UN conseil skincare quotidien ultra-court et personnalisé.

RÈGLES
- Ton direct, chaleureux. Tutoiement.
- Conseil unique, concret, actionnable aujourd'hui.
- Nomme les conditions météo ET le profil peau quand pertinent.
- Jamais de diagnostic médical. Jamais de conseil générique sans lien avec les données fournies.

FORMAT — JSON strict, rien d'autre :
{
  "advice": "<1 phrase courte qui connecte météo + profil peau — max 15 mots>",
  "trigger": "<span class=\\"day-trigger\\">Label</span> → action courte."
}

Exemples attendus :
- advice: "Ta peau sèche + air sec ce matin : double la couche d'hydratant avant le SPF."
- advice: "Chaleur + peau grasse : gel léger ce soir, évite les textures épaisses."
- trigger: "<span class=\\"day-trigger\\">UV élevé</span> → réapplique ton SPF maintenant."
- trigger: "<span class=\\"day-trigger\\">Air chargé</span> → ta vitamine C bloque les radicaux libres."`;

function buildUserMessage(weather, profile) {
  const lines = [];

  const phase = PHASE_LABELS[weather.phase] || weather.phase || 'journée';
  lines.push(`Moment : ${phase}`);
  lines.push(`Météo : ${weather.temp}°C, humidité ${weather.humidity}%, UV ${weather.uv}, AQI ${weather.aqi}${weather.weatherText ? ' (' + weather.weatherText + ')' : ''}`);
  lines.push(`Nuit/jour : ${weather.isDay ? 'jour' : 'nuit'}`);

  if (profile) {
    const skin = SKIN_LABELS[profile.skinType] || profile.skinType;
    if (skin) lines.push(`Type de peau : ${skin}`);

    const concerns = Array.isArray(profile.concerns) ? profile.concerns.filter(Boolean) : [];
    if (concerns.length) lines.push(`Préoccupations : ${concerns.join(', ')}`);

    const vitrine = Array.isArray(profile.vitrine) ? profile.vitrine.filter((p) => p.active) : [];
    if (vitrine.length) {
      lines.push('Actifs en routine : ' + vitrine.map((p) => p.active).join(', '));
    }
  }

  return lines.join('\n');
}

function jsonResponse(statusCode, body) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method Not Allowed' });

  const premium = await verifyPremium(event.headers['authorization'] || event.headers['Authorization']);
  if (!premium) return jsonResponse(403, { error: 'Accès réservé aux membres Premium.' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonResponse(503, { error: 'OPENAI_API_KEY manquante' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'JSON invalide' });
  }

  const weather = body.weather || {};
  const profile = body.profile || null;

  // Refuse si pas de données météo utiles
  if (weather.temp == null && weather.humidity == null) {
    return jsonResponse(400, { error: 'Données météo insuffisantes' });
  }

  const userMessage = buildUserMessage(weather, profile);

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
        max_tokens: 150,
        temperature: 0.4,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return jsonResponse(502, { error: data.error?.message || 'OpenAI HTTP ' + res.status });
    }

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return jsonResponse(502, { error: 'Réponse OpenAI vide' });

    const parsed = JSON.parse(raw);
    return jsonResponse(200, {
      advice: typeof parsed.advice === 'string' ? parsed.advice.trim() : '',
      trigger: typeof parsed.trigger === 'string' ? parsed.trigger.trim() : '',
    });
  } catch (err) {
    console.error('[daily-advice]', err);
    return jsonResponse(502, { error: err.message || 'Service indisponible' });
  }
};

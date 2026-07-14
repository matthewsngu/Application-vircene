/**
 * Vircène — Face Scan IA (analyse visuelle peau)
 * POST { image: dataURL }
 * Prompt : netlify/lib/prompts.js — Env : OPENAI_API_KEY
 */
const {
  SKIN_TYPES,
  CONCERNS,
  RIDULES,
  FACE_SCAN_PROMPT,
  OPENAI_MODEL,
} = require('../lib/prompts');
const { verifyPremium } = require('../lib/auth');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  const premium = await verifyPremium(event.headers['authorization'] || event.headers['Authorization']);
  if (!premium) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Accès réservé aux membres Premium.' }) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'OPENAI_API_KEY manquante' }) };
  }

  let image;
  try {
    image = JSON.parse(event.body || '{}').image;
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
  }
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Image invalide' }) };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: FACE_SCAN_PROMPT },
            { type: 'image_url', image_url: { url: image, detail: 'low' } },
          ],
        }],
        response_format: { type: 'json_object' },
        max_tokens: 650,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenAI face-scan', res.status, errText);
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Analyse indisponible' }) };
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    const skin = SKIN_TYPES.includes(parsed.skin) ? parsed.skin : 'normale';
    const concerns = (parsed.concerns || []).filter((c) => CONCERNS.includes(c)).slice(0, 4);
    const ridules = RIDULES.includes(parsed.ridules) ? parsed.ridules : 'modéré';
    const viraHtml = String(parsed.viraHtml || '').trim();
    const tags = (parsed.tags || concerns).slice(0, 4).map(String);

    if (!viraHtml) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Analyse vide' }) };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        skin,
        concerns,
        ridules,
        viraHtml,
        tags,
        meText: 'J\u2019ai fait un scan de mon visage \uD83D\uDCF8',
        summary: { skin, concerns, ridules },
        source: 'openai',
      }),
    };
  } catch (err) {
    console.error('face-scan', err);
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Erreur serveur' }) };
  }
};

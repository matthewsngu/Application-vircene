/**
 * Détection produits skincare — API vision OpenAI.
 * Prompt : netlify/lib/prompts.js — Env : OPENAI_API_KEY
 */
const { ACTIVE_KEYS, PRODUCT_SCAN_PROMPT, OPENAI_MODEL } = require('../lib/prompts');
const { verifyPremium } = require('../lib/auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS),
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const premium = await verifyPremium(event.headers['authorization'] || event.headers['Authorization']);
  if (!premium) {
    return jsonResponse(403, { error: 'Accès réservé aux membres Premium.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(503, { error: 'OPENAI_API_KEY manquante sur Netlify' });
  }

  let images;
  try {
    images = (JSON.parse(event.body).images || []).slice(0, 3);
  } catch (e) {
    return jsonResponse(400, { error: 'Corps JSON invalide' });
  }
  if (!images.length) {
    return jsonResponse(400, { error: 'Aucune image' });
  }

  const content = [
    { type: 'text', text: PRODUCT_SCAN_PROMPT },
    ...images.map((url) => ({ type: 'image_url', image_url: { url, detail: 'low' } })),
  ];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      const msg = data.error?.message || data.error?.code || ('OpenAI HTTP ' + res.status);
      console.error('[detect-products] OpenAI error:', msg);
      return jsonResponse(502, { error: msg });
    }

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return jsonResponse(502, { error: 'Réponse OpenAI vide' });
    }

    const parsed = JSON.parse(raw);
    const products = (parsed.products || [])
      .filter((p) => p && ACTIVE_KEYS.includes(p.active))
      .slice(0, 6);

    return jsonResponse(200, { products });
  } catch (err) {
    console.error('[detect-products]', err);
    return jsonResponse(502, { error: err.message || 'Détection indisponible' });
  }
};

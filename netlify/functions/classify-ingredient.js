/**
 * Détection produits skincare — API vision OpenAI.
 * Prompt : netlify/lib/prompts.js — Env : OPENAI_API_KEY
 */
const { ACTIVE_KEYS, PRODUCT_SCAN_PROMPT, OPENAI_MODEL } = require('../lib/prompts');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CLASSIFY_PROMPT =
  'Tu classes un ingrédient cosmétique INCI pour Vircène (méthode type Yuka, UE). ' +
  'Réponds UNIQUEMENT en JSON strict : ' +
  '{"level":"vert|jaune|orange|rouge","effects":["cancérigène"|"perturbateur endocrinien"|"polluant"|"allergène"|"irritant"],"info":"<2 phrases FR>","source":"<SCCS|ANSM|ECHA|CIR|UE>"} ' +
  '— vert=sans risque connu, jaune=faible, orange=modéré, rouge=à éviter/interdit UE. Pas de texte hors JSON.';

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS),
    body: JSON.stringify(body),
  };
}

async function verifyPremium(authHeader) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return false;

  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=plan&limit=1`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0 && rows[0].plan === 'premium';
  } catch (_) {
    return false;
  }
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

  let names;
  try {
    const body = JSON.parse(event.body);
    names = (body.names || body.ingredients || []).slice(0, 8);
  } catch (e) {
    return jsonResponse(400, { error: 'Corps JSON invalide' });
  }
  if (!names.length) {
    return jsonResponse(400, { error: 'Aucun ingrédient' });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{
          role: 'user',
          content: CLASSIFY_PROMPT + '\n\nIngrédients à classer :\n' + names.map((n) => '- ' + n).join('\n'),
        }],
        response_format: { type: 'json_object' },
        max_tokens: 600,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      const msg = data.error?.message || ('OpenAI HTTP ' + res.status);
      return jsonResponse(502, { error: msg });
    }
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return jsonResponse(502, { error: 'Réponse OpenAI vide' });
    const parsed = JSON.parse(raw);
    const results = names.map(function (name) {
      const entry = Array.isArray(parsed.results)
        ? parsed.results.find((r) => r && (r.name === name || r.ingredient === name))
        : null;
      const level = ['vert', 'jaune', 'orange', 'rouge'].includes(entry?.level) ? entry.level : (parsed.level || 'jaune');
      return {
        name: name,
        level: level,
        effects: entry?.effects || parsed.effects || [],
        info: entry?.info || parsed.info || 'Classé par IA — à confirmer.',
        source: entry?.source || parsed.source || 'OpenAI / Vircène',
      };
    });
    return jsonResponse(200, { results: results });
  } catch (err) {
    console.error('[classify-ingredient]', err);
    return jsonResponse(502, { error: err.message || 'Classification indisponible' });
  }
};

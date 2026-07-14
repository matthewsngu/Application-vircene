/**
 * Vircène — Chat Vira (conseiller skincare IA)
 * POST { message, history?, scanContext?, profile? }
 * Prompt : netlify/lib/prompts.js — Env : OPENAI_API_KEY
 */
const {
  VIRA_CHAT_SYSTEM,
  buildViraUserMessage,
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

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  const message = String(body.message || '').trim().slice(0, 2000);
  if (!message) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Message vide' }) };
  }

  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const scanContext = body.scanContext || null;
  const profile = body.profile || null;

  const userContext = buildViraUserMessage(message, profile, scanContext);

  const messages = [{ role: 'system', content: VIRA_CHAT_SYSTEM }];
  history.forEach((turn) => {
    if (!turn || !turn.content) return;
    const role = turn.role === 'assistant' ? 'assistant' : 'user';
    messages.push({ role, content: String(turn.content).slice(0, 1500) });
  });
  messages.push({ role: 'user', content: userContext });

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 700,
        temperature: 0.65,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenAI error', res.status, errText);
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Réponse IA indisponible' }) };
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    const replyHtml = String(parsed.replyHtml || parsed.reply || '').trim();
    if (!replyHtml) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Réponse vide' }) };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ replyHtml, source: 'openai' }),
    };
  } catch (err) {
    console.error('vira-chat', err);
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Erreur serveur' }) };
  }
};

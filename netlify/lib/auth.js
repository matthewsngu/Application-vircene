/**
 * Vircène — Vérification Premium côté Netlify Functions
 * Vérifie le JWT Supabase et contrôle le plan 'premium' dans la table profiles.
 */

'use strict';

async function verifyPremium(authHeader) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return false;

  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=plan&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0 && rows[0].plan === 'premium';
  } catch (_) {
    return false;
  }
}

module.exports = { verifyPremium };

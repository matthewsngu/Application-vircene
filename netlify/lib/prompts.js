/**
 * Prompts IA Vircène — source unique côté serveur (Netlify Functions).
 * Étape 1–2 du workflow : tester ces textes dans ChatGPT/Claude avant de brancher l'API.
 * Voir docs/AI-WORKFLOW.md
 */

const SKIN_TYPES = ['sèche', 'grasse', 'mixte', 'normale', 'sensible', 'déshydratée'];
const CONCERNS = ['rougeurs', 'déshydratation', 'ridules', 'acné', 'brillance', 'cernes', 'taches', 'pores', 'texture irrégulière'];
const RIDULES = ['faible', 'modéré', 'marqué', 'aucun'];

const VIRA_CHAT_SYSTEM =
  'Tu es Vira, conseillère skincare bienveillante de Vircène. Tu réponds en français, ton chaleureux et clair, ' +
  'sans jargon inutile. Tu donnes des conseils cosmétiques informatifs — jamais de diagnostic médical. ' +
  'Utilise des listes à puces HTML (<ul><li>) quand c\'est utile. Réponds en JSON strict : ' +
  '{"replyHtml":"<paragraphes HTML courts, max 4 blocs>"}. Pas de texte hors JSON.';

function buildViraUserMessage(message, profile, scanContext) {
  const contextLines = [];
  if (profile?.firstName) contextLines.push('Prénom : ' + profile.firstName);
  if (profile?.skinType) contextLines.push('Type de peau déclaré : ' + profile.skinType);
  if (profile?.concerns?.length) contextLines.push('Préoccupations : ' + profile.concerns.join(', '));

  // Dernier Face Scan
  if (scanContext?.skin) {
    contextLines.push(
      'Dernier Face Scan — peau : ' + scanContext.skin
        + (scanContext.concerns?.length ? ', préoccupations : ' + scanContext.concerns.join(', ') : '')
        + (scanContext.ridules ? ', ridules : ' + scanContext.ridules : '')
    );
  }

  // Vitrine (produits scannés)
  if (Array.isArray(profile?.vitrine) && profile.vitrine.length) {
    const lines = profile.vitrine.map((p) => {
      const ings = (p.ingredients || []).slice(0, 4).join(', ');
      return '  - ' + (p.name || '?') + (p.active ? ' [' + p.active + ']' : '') + (ings ? ' — ' + ings : '');
    });
    contextLines.push('Produits dans sa vitrine :\n' + lines.join('\n'));
  }

  // Score routine actuelle
  if (profile?.routineScore) {
    const rs = profile.routineScore;
    contextLines.push(
      'Analyse routine — score peau : ' + rs.skinScore + '/100'
      + ', compatibilité : ' + rs.compatScore + '/100'
      + (rs.alertCount ? ', alertes actifs : ' + rs.alertCount : '')
      + (rs.summary ? ' — ' + rs.summary : '')
    );
  }

  // Dernier scan INCI (si différent du Face Scan)
  if (profile?.lastScanAnalysis) {
    const la = profile.lastScanAnalysis;
    contextLines.push(
      'Dernier scan INCI — score peau : ' + (la.skinScore ?? '?')
      + ', compatibilité : ' + (la.compatScore ?? '?')
      + (la.alertCount ? ', alertes : ' + la.alertCount : '')
      + (la.scannedAt ? ' (' + la.scannedAt.slice(0, 10) + ')' : '')
    );
  }

  return contextLines.length
    ? 'Contexte utilisateur :\n' + contextLines.join('\n') + '\n\nQuestion : ' + message
    : message;
}

const FACE_SCAN_PROMPT =
  'Tu analyses un selfie skincare (pas un diagnostic médical). ' +
  'Décris ce que tu observes de façon prudente et bienveillante en français. ' +
  'Réponds UNIQUEMENT en JSON strict : ' +
  '{"skin":"<une valeur parmi ' + SKIN_TYPES.join('|') + '>",' +
  '"concerns":["<1 à 4 valeurs parmi ' + CONCERNS.join('|') + '>],' +
  '"ridules":"<une valeur parmi ' + RIDULES.join('|') + '>",' +
  '"viraHtml":"<2 ou 3 paragraphes HTML <p> avec <strong> pour les termes clés, ton rassurant>",' +
  '"tags":["<2 à 4 labels courts pour UI, ex Rougeurs, Déshydratation>"]}. ' +
  'Si le visage est illisible, skin="normale", concerns=[], ridules="aucun", viraHtml explique de reprendre une photo nette.';

const OPENAI_MODEL = 'gpt-4o-mini';

const ACTIVE_KEYS = ['vitc', 'retinol', 'aha', 'bha', 'niacinamide', 'ha', 'bpo', 'creme', 'spf'];

const PRODUCT_SCAN_PROMPT =
  'Identifie chaque produit de soin visible sur ces photos (étiquettes INCI). Réponds UNIQUEMENT en JSON strict : ' +
  '{"products":[{"brand":"...","name":"...","active":"<une valeur parmi ' + ACTIVE_KEYS.join('|') + '>",' +
  '"ingredients":["...","...","..."],"description":"<une phrase courte en français, ton rassurant>"}]} ' +
  '— "active" = actif dominant (vitc=vitamine C, bha=acide salicylique/BHA, aha=acides de fruits, creme=crème hydratante/céramides, ha=acide hyaluronique, spf=solaire). ' +
  'Salicylic Acid/BHA → bha (jamais aha). Glycolic/Lactic/Mandelic → aha. ' +
  '"ingredients" = 3 à 6 ingrédients clés lisibles sur l\'étiquette. Si illisible, ignore le produit. Pas de texte hors JSON.';

module.exports = {
  SKIN_TYPES,
  CONCERNS,
  RIDULES,
  ACTIVE_KEYS,
  VIRA_CHAT_SYSTEM,
  buildViraUserMessage,
  FACE_SCAN_PROMPT,
  PRODUCT_SCAN_PROMPT,
  OPENAI_MODEL,
};

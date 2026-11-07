#!/usr/bin/env node
// Détecte les vidéos "outliers" : celles qui font beaucoup plus de vues que la normale
// de leur compte.
//
// Entrée : un JSON produit par fetch-apify.mjs, OU un CSV rempli à la main avec les colonnes
//   url,account,views,followers,caption
// (followers et caption sont facultatifs).
//
// Usage :
//   node outliers.mjs tiktok-studio/scans/2026-11-07.json [--min-ratio 3] [--min-views 20000] [--top 10]
//
// Calcul :
// - Si on a au moins 5 vidéos du même compte : ratio = vues / médiane des vues du compte.
// - Sinon (vidéo trouvée via un hashtag, ou saisie à la main) : ratio = vues / abonnés.
// Sortie : tableau trié dans le terminal + JSON sur stdout avec --json.

import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage : node outliers.mjs <scan.json|scan.csv> [--min-ratio 3] [--min-views 20000] [--top 10] [--json]");
  process.exit(1);
}
const opt = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? Number(process.argv[i + 1]) : def;
};
const minRatio = opt("min-ratio", 3);
const minViews = opt("min-views", 20000);
const top = opt("top", 10);
const asJson = process.argv.includes("--json");

function parseCsv(text) {
  const [head, ...rows] = text.trim().split(/\r?\n/);
  const cols = head.split(",").map((c) => c.trim().toLowerCase());
  return rows.filter(Boolean).map((row) => {
    const cells = row.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
    const o = Object.fromEntries(cols.map((c, i) => [c, cells[i]?.trim()]));
    const num = (v) => (v ? Number(String(v).replace(/[\s,]/g, "").replace(/k$/i, "e3").replace(/m$/i, "e6")) : null);
    return { url: o.url, account: (o.account || "").replace(/^@/, ""), views: num(o.views) || 0, followers: num(o.followers), caption: o.caption || "" };
  });
}

const raw = fs.readFileSync(file, "utf8");
const videos = file.endsWith(".csv") ? parseCsv(raw) : JSON.parse(raw);

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const byAccount = new Map();
for (const v of videos) {
  if (!byAccount.has(v.account)) byAccount.set(v.account, []);
  byAccount.get(v.account).push(v.views);
}

const scored = videos
  .map((v) => {
    const own = byAccount.get(v.account) || [];
    let baseline = null;
    let basis = null;
    if (own.length >= 5) {
      baseline = median(own);
      basis = "médiane du compte";
    } else if (v.followers) {
      baseline = v.followers;
      basis = "abonnés";
    }
    const ratio = baseline ? v.views / Math.max(baseline, 1) : null;
    const engagement = v.views && v.likes !== undefined ? ((v.likes || 0) + (v.comments || 0) * 2 + (v.shares || 0) * 3 + (v.saves || 0) * 3) / v.views : null;
    return { ...v, baseline, basis, ratio, engagement };
  })
  .filter((v) => v.ratio !== null && v.ratio >= minRatio && v.views >= minViews)
  .sort((a, b) => b.ratio - a.ratio)
  .slice(0, top);

if (asJson) {
  process.stdout.write(JSON.stringify(scored, null, 2));
} else if (!scored.length) {
  console.log(`Aucun outlier (ratio ≥ ${minRatio}, vues ≥ ${minViews}). Baisse --min-ratio ou --min-views, ou ajoute des comptes.`);
} else {
  const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + " M" : n >= 1e3 ? (n / 1e3).toFixed(1) + " k" : String(Math.round(n)));
  console.log(`${scored.length} outlier(s) — ratio ≥ ${minRatio}, vues ≥ ${fmt(minViews)}\n`);
  scored.forEach((v, i) => {
    console.log(`${i + 1}. @${v.account} — ${fmt(v.views)} vues — x${v.ratio.toFixed(1)} vs ${v.basis} (${fmt(v.baseline)})`);
    if (v.engagement !== null) console.log(`   engagement pondéré : ${(v.engagement * 100).toFixed(1)} %`);
    if (v.caption) console.log(`   « ${v.caption.slice(0, 110).replace(/\s+/g, " ")} »`);
    console.log(`   ${v.url}\n`);
  });
}

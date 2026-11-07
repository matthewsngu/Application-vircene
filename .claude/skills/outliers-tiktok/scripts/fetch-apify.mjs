#!/usr/bin/env node
// Récupère les vidéos TikTok récentes de comptes et/ou hashtags via l'acteur Apify
// "clockworks/tiktok-scraper" et écrit le résultat brut en JSON.
//
// Usage :
//   node fetch-apify.mjs --config tiktok-studio/config.json --out tiktok-studio/scans/2026-11-07.json
//   node fetch-apify.mjs --profiles moncompte --per 30 --out tiktok-studio/scans/moi.json
//
// Authentification : en-tête "Authorization: Bearer <token>".
// - En session cloud Claude Code, le proxy injecte la vraie clé pour api.apify.com
//   (enregistrée via request_credential) : APIFY_TOKEN peut rester une valeur factice.
// - En local : export APIFY_TOKEN=apify_api_xxx

import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1] ?? true]);
    return acc;
  }, [])
);

const list = (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim().replace(/^[@#]/, "")).filter(Boolean) : []);

let profiles = list(args.profiles);
let hashtags = list(args.hashtags);
let per = Number(args.per || 30);

if (args.config) {
  const cfg = JSON.parse(fs.readFileSync(args.config, "utf8"));
  profiles = profiles.length ? profiles : (cfg.watch?.accounts || []).map((s) => s.replace(/^@/, ""));
  hashtags = hashtags.length ? hashtags : (cfg.watch?.hashtags || []).map((s) => s.replace(/^#/, ""));
  per = Number(args.per || cfg.watch?.videosPerAccount || 30);
}

if (!profiles.length && !hashtags.length) {
  console.error("Rien à scanner : donne --profiles, --hashtags ou --config.");
  process.exit(1);
}
if (!args.out) {
  console.error("--out est requis.");
  process.exit(1);
}

const token = process.env.APIFY_TOKEN || "apify_api_placeholder";
const input = {
  profiles,
  hashtags,
  resultsPerPage: per,
  profileScrapeSections: ["videos"],
  profileSorting: "latest",
  shouldDownloadVideos: false,
  shouldDownloadCovers: false,
  shouldDownloadSubtitles: false,
};

const url = "https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?timeout=280";
console.error(`Scan Apify : ${profiles.length} compte(s), ${hashtags.length} hashtag(s), ${per} vidéos chacun…`);

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(input),
});

if (!res.ok) {
  console.error(`Erreur Apify ${res.status} : ${(await res.text()).slice(0, 500)}`);
  process.exit(2);
}

const items = await res.json();
const videos = items
  .filter((v) => v.webVideoUrl || v.id)
  .map((v) => ({
    url: v.webVideoUrl,
    account: v.authorMeta?.name,
    followers: v.authorMeta?.fans ?? null,
    views: v.playCount ?? 0,
    likes: v.diggCount ?? 0,
    comments: v.commentCount ?? 0,
    shares: v.shareCount ?? 0,
    saves: v.collectCount ?? 0,
    duration: v.videoMeta?.duration ?? null,
    createdAt: v.createTimeISO || (v.createTime ? new Date(v.createTime * 1000).toISOString() : null),
    caption: v.text || "",
    music: v.musicMeta?.musicName || null,
    source: v.input || null,
  }));

fs.mkdirSync(path.dirname(args.out), { recursive: true });
fs.writeFileSync(args.out, JSON.stringify(videos, null, 2));
console.error(`${videos.length} vidéos enregistrées dans ${args.out}`);

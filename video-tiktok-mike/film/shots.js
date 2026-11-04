/* "Mike the Headless Chicken" (Fruita, Colorado, 1945) — vertical 9:16 for US TikTok, flat vector, drawn in code.
 * Plates are 2160×3840. TikTok safe zone (screen 60–940 × 230–1500) = plate 120–1880 × 460–3000:
 * signs live in the top half of it, faces in the bottom half. Cuts are anchored on words.
 */
window.buildFilm = (A) => {
  const { T, C, PW, PH, clamp, lerp, spring, hash, typeText, redX, withPop, puff, mark,
    drawChar, dateCard, titleCard, inkFor, textRect, roundRect, blob, tube } = A;

  const P = {
    sky: '#cddbe4', navy: C.navy, teal: C.teal, blue: C.blueGrey, violet: C.violet, beige: '#d9c3a5', cream: '#efe6d6',
    brick: '#b9826b', road: '#8a8d93', wood: '#a07a58', dark: '#3b3f4a', gold: '#d8b25a', money: '#8fb08a', paper: '#f6f1e4', red: '#c96a5a',
  };
  const CH = {
    you: { skin: C.skin, top: '#5d7387', bottom: P.navy, hair: '#4a3426', seed: 1 },
    ronald: { skin: C.skin, top: P.navy, bottom: '#4b5568', hair: '#5a3b28', seed: 2 },
    pass1: { skin: C.skin, top: P.violet, bottom: '#6b6f78', hair: '#2e2420', seed: 3 },
    pass2: { skin: C.skin, top: P.beige, bottom: P.navy, hair: '#8a5a3a', hairStyle: 'tail', seed: 4 },
    pass3: { skin: C.skin, top: P.teal, bottom: '#3a3f4a', hair: '#c9a46a', seed: 5 },
    rel1: { skin: C.skin, top: P.red, bottom: P.navy, hair: '#6a4630', hairStyle: 'tail', seed: 6 },
    rel2: { skin: C.skin, top: P.blue, bottom: '#3a3f4a', hair: '#3a2a20', glasses: true, seed: 7 },
    rel3: { skin: C.skin, top: P.gold, bottom: P.navy, hair: '#1f1b1b', seed: 8 },
    nurse: { skin: C.skin, top: '#e9eef2', bottom: '#e9eef2', hair: '#3a2a20', hairStyle: 'tail', seed: 9 },
    reader: { skin: C.skin, top: P.violet, bottom: P.navy, hair: '#7a5233', glasses: true, seed: 10 },
  };
  const LEG = 300, K = 1.1, FEET = 3250;
  const walkX = (x0, dir, k, lt) => x0 + dir * (1.5 * LEG * k / 0.9) * lt;
  const ronald = (age, extra = {}) => ({
    hair: age < 0.35 ? '#5a3b28' : age < 0.7 ? '#8c7a6a' : '#d4d1cb',
    age: clamp((age - 0.3) / 0.7), hunch: 0.13 * clamp((age - 0.55) / 0.45), ...extra,
  });

  /* ─── scenery kit (flat, portrait) ─── */
  const rect = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const room = (g, wall, floor, ground) => { rect(g, wall, -200, -200, PW + 400, floor + 200); rect(g, ground, -200, floor, PW + 400, PH - floor + 200); rect(g, 'rgba(0,0,0,0.06)', -200, floor, PW + 400, 40); };
  const cloud = (g, x, y, s, t) => { const dx = ((x + t * 25) % (PW + 900)) - 450; [[0, 0, 1], [0.9, -0.25, 1.15], [1.9, 0, 0.9]].forEach(([ox, oy, r]) => { g.fillStyle = '#e7eef3'; g.beginPath(); g.arc(dx + ox * 100 * s, y + oy * 100 * s, 100 * s * r, 0, 7); g.fill(); }); };
  const windows = (g, x, y, w, h, rows, cols, col = '#e8eef2') => { const gw = w / cols, gh = h / rows; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) roundRect(g, x + c * gw + gw * 0.18, y + r * gh + gh * 0.18, gw * 0.64, gh * 0.6, 12, col); };
  const building = (g, x, y, w, h, col, rows, cols, roof) => {
    roundRect(g, x, y, w, h, 16, col);
    if (roof) { g.fillStyle = roof; g.beginPath(); g.moveTo(x - 40, y + 4); g.lineTo(x + w / 2, y - h * 0.18); g.lineTo(x + w + 40, y + 4); g.fill(); }
    windows(g, x + w * 0.06, y + h * 0.08, w * 0.88, h * 0.62, rows, cols);
  };
  const door = (g, x, y, w, h, col = P.teal) => { roundRect(g, x, y, w, h, 18, col); blob(g, x + w * 0.8, y + h * 0.55, 14, 14, P.gold); };
  const tree = (g, x, y, s = 1) => { roundRect(g, x - 26 * s, y - 360 * s, 52 * s, 360 * s, 16, P.wood); [[-110, -420, 170], [100, -440, 160], [0, -560, 190]].forEach(([dx, dy, r]) => blob(g, x + dx * s, y + dy * s, r * s, r * s * 0.92, '#7f9a7e')); };
  const car = (g, x, y, k = 1, col = P.blue) => {
    roundRect(g, x - 560 * k, y - 400 * k, 1120 * k, 270 * k, 110 * k, col);
    roundRect(g, x - 330 * k, y - 600 * k, 640 * k, 240 * k, 100 * k, col);
    roundRect(g, x - 270 * k, y - 560 * k, 240 * k, 170 * k, 50 * k, '#dfe8ee'); roundRect(g, x + 10 * k, y - 560 * k, 240 * k, 170 * k, 50 * k, '#dfe8ee');
    [-340, 340].forEach((dx) => { blob(g, x + dx * k, y - 120 * k, 120 * k, 120 * k, '#2c2e35'); blob(g, x + dx * k, y - 120 * k, 50 * k, 50 * k, '#9aa3ad'); });
  };
  const broom = (g, hand, foot, mop = false) => { tube(g, hand, foot, 26, P.wood); if (mop) blob(g, foot[0], foot[1], 90, 34, '#d9d4c7'); else roundRect(g, foot[0] - 110, foot[1] - 20, 220, 50, 20, P.gold); };
  const certStack = (g, x, y, n, w = 420) => { for (let i = 0; i < n; i++) roundRect(g, x - w / 2 + (hash(i) - 0.5) * 18, y - (i + 1) * 22, w, 26, 6, i % 2 ? P.paper : '#e9dfc8'); };
  const cash = (g, x, y, s = 1) => { roundRect(g, x - 120 * s, y - 60 * s, 240 * s, 120 * s, 16 * s, P.money); blob(g, x, y, 34 * s, 34 * s, '#6f9069'); };
  const bag = (g, x, y, s = 1) => { blob(g, x, y, 130 * s, 120 * s, P.beige); roundRect(g, x - 50 * s, y - 160 * s, 100 * s, 60 * s, 20 * s, P.beige); g.fillStyle = P.navy; g.font = `800 ${120 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', x, y + 8 * s); };
  const broomIcon = (g, x, y, s = 1) => { g.save(); g.translate(x, y); g.rotate(-0.4); tube(g, [0, -150 * s], [0, 110 * s], 26 * s, P.wood); roundRect(g, -90 * s, 90 * s, 180 * s, 70 * s, 20 * s, P.gold); g.restore(); };
  const snowball = (g, x, y, r, rot) => { blob(g, x, y, r, r, '#f3f6f8'); g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#d9e2e8'; [[0.4, 0.2, 0.18], [-0.35, -0.3, 0.14], [0.1, -0.55, 0.1]].forEach(([a, b, c]) => { g.beginPath(); g.arc(a * r, b * r, c * r, 0, 7); g.fill(); }); g.restore(); };
  const piggy = (g, x, y, s = 1) => { blob(g, x, y, 260 * s, 200 * s, '#e9a7a0'); blob(g, x + 230 * s, y - 20 * s, 80 * s, 70 * s, '#e9a7a0'); rect(g, '#c98a83', x - 60 * s, y - 210 * s, 120 * s, 22 * s); [-150, 100].forEach((d) => roundRect(g, x + d * s, y + 150 * s, 60 * s, 110 * s, 20 * s, '#e9a7a0')); blob(g, x + 120 * s, y - 70 * s, 14 * s, 18 * s, '#1b1b24'); };
  const board = (g, r, ink = '#fbfaf6', frame = '#8a7660') => { roundRect(g, r[0] - 24, r[1] - 24, r[2] + 48, r[3] + 48, 30, frame); roundRect(g, r[0], r[1], r[2], r[3], 14, ink); };
  const popBoard = (g, s, r, text, t0, opt = {}) => { // a board that springs in, then gets typed on
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, t0, () => board(g, r, opt.bg, opt.frame));
    if (s.t > t0 + 0.2) typeText(g, text, r, t0 + 0.2, s.t, { color: opt.ink });
  };
  const cheque = (g, s, x, y, amount, t0) => withPop(g, x, y, s.t, t0, () => {
    roundRect(g, x - 560, y - 240, 1120, 480, 30, '#fbfaf6'); rect(g, '#e3ecd9', x - 560, y - 240, 1120, 100);
    typeText(g, amount, [x - 500, y - 90, 1000, 230], t0 + 0.15, s.t, { size: 150 });
  }, 'squash');

  /* ─── cast for this story ─── */
  Object.assign(CH, {
    lloyd: { skin: C.skin, top: '#8a4a3a', bottom: '#3b4a66', hair: '#6a4630', seed: 81 },
    clara: { skin: C.skin, top: P.violet, bottom: P.navy, hair: '#c9a46a', hairStyle: 'tail', seed: 82 },
    fan1: { skin: C.skin, top: P.gold, bottom: P.navy, hair: '#3a2a20', seed: 83 },
    fan2: { skin: C.skin, top: P.teal, bottom: '#3a3f4a', hair: '#1f1b1b', hairStyle: 'tail', seed: 84 },
  });
  const OVERALLS = { top: '#3b5a86', bottom: '#3b5a86', cap: '#c96a5a' };

  /* Mike: a plump flat chicken. headless=true → a small rounded neck stump (no gore). */
  const chicken = (g, x, y, s, t, opt = {}) => {
    const step = opt.walk ? Math.sin(t * 9) : 0, bob = opt.walk ? Math.abs(Math.sin(t * 9)) * 12 * s : 0;
    const f = opt.face || 1;
    g.save(); g.translate(x, y - bob); g.scale(f, 1);
    [[-40, step], [40, -step]].forEach(([dx, ph]) => { // legs
      tube(g, [dx * s, -120 * s], [dx * s + ph * 30 * s, 0], 18 * s, '#e3a03a');
      tube(g, [dx * s + ph * 30 * s, 0], [dx * s + ph * 30 * s + 50 * s, 6 * s], 14 * s, '#e3a03a');
    });
    blob(g, -60 * s, -260 * s, 90 * s, 120 * s, '#f4f1ea', -0.6); // tail
    blob(g, 10 * s, -230 * s, 190 * s, 150 * s, '#f6f3ec');      // body
    blob(g, 0, -220 * s, 110 * s, 70 * s, '#e9e4da', 0.2);       // wing
    if (opt.headless) {
      tube(g, [110 * s, -300 * s], [150 * s, -400 * s], 70 * s, '#f6f3ec'); // neck
      blob(g, 150 * s, -410 * s, 38 * s, 22 * s, '#e9c9b8');                // healed stump
    } else {
      tube(g, [110 * s, -300 * s], [150 * s, -420 * s], 70 * s, '#f6f3ec');
      blob(g, 165 * s, -460 * s, 70 * s, 66 * s, '#f6f3ec');
      blob(g, 150 * s, -540 * s, 40 * s, 26 * s, '#d64a3a'); // comb
      g.fillStyle = '#e3a03a'; g.beginPath(); g.moveTo(225 * s, -470 * s); g.lineTo(275 * s, -455 * s); g.lineTo(225 * s, -440 * s); g.fill();
      blob(g, 185 * s, -470 * s, 10 * s, 12 * s, '#1b1b24');
    }
    g.restore();
  };
  const axe = (g, x, y, rot, s = 1) => { g.save(); g.translate(x, y); g.rotate(rot); tube(g, [0, 0], [0, -320 * s], 30 * s, P.wood); g.fillStyle = '#9aa3ad'; g.beginPath(); g.moveTo(-10 * s, -330 * s); g.lineTo(-130 * s, -360 * s); g.lineTo(-120 * s, -230 * s); g.lineTo(-10 * s, -260 * s); g.fill(); g.restore(); };
  const dropper = (g, x, y, s = 1, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); roundRect(g, -16 * s, -160 * s, 32 * s, 150 * s, 10 * s, '#cddbe4'); blob(g, 0, -170 * s, 30 * s, 34 * s, '#d64a3a'); g.restore(); };
  const ticket = (g, x, y, s = 1) => { roundRect(g, x - 170 * s, y - 80 * s, 340 * s, 160 * s, 16 * s, '#f4c46a'); blob(g, x - 170 * s, y, 22 * s, 22 * s, '#c9b08a'); blob(g, x + 170 * s, y, 22 * s, 22 * s, '#c9b08a'); g.fillStyle = C.ink; g.font = `800 ${80 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('25¢', x, y + 4 * s); };
  const magazine = (g, x, y, s, title, col) => { roundRect(g, x - 160 * s, y - 220 * s, 320 * s, 440 * s, 10 * s, col); rect(g, '#fbfaf6', x - 140 * s, y - 120 * s, 280 * s, 260 * s); chicken(g, x, y + 120 * s, 0.4 * s, 0, { headless: true });
    g.fillStyle = '#fbfaf6'; g.font = `800 ${70 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, x, y - 170 * s); };
  const syringe = (g, x, y, s = 1) => { roundRect(g, x - 150 * s, y - 30 * s, 260 * s, 60 * s, 14 * s, '#e9eef2'); rect(g, '#9aa3ad', x + 110 * s, y - 6 * s, 90 * s, 12 * s); rect(g, '#5d6670', x - 200 * s, y - 40 * s, 50 * s, 80 * s); };
  const bunting = (g, y, t) => { for (let i = 0; i < 12; i++) { const x = i * 190 + 40; g.fillStyle = ['#d64a3a', P.gold, '#4f7c86'][i % 3]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 150, y); g.lineTo(x + 75, y + 140 + Math.sin(t * 3 + i) * 10); g.fill(); } };

  /* ─── plates (2160×3840) ─── */
  const farm = (g, t) => { room(g, '#cfe0ea', 2900, '#9bb07a'); cloud(g, 300, 1300, 0.9, t); g.fillStyle = '#b9826b'; g.beginPath(); g.moveTo(1150, 2100); g.lineTo(1650, 1650); g.lineTo(2150, 2100); g.fill(); roundRect(g, 1200, 2080, 900, 820, 10, '#c96a5a'); door(g, 1520, 2450, 260, 450, '#8a4a3a');
    for (let i = 0; i < 7; i++) roundRect(g, 60 + i * 160, 2600, 30, 300, 6, P.wood); rect(g, P.wood, 40, 2680, 1100, 24); };
  const plates = {
    KITCHEN: { paint: (g) => { room(g, '#e8d9c0', 2700, '#a58a6a'); roundRect(g, 100, 2300, 1960, 600, 30, '#c9b08a'); }, signs: {} },
    FARM: { paint: (g, t) => farm(g, t), signs: {} },
    STAGE: { paint: (g) => { room(g, '#2b2238', 3000, '#6a5040'); rect(g, '#b8322e', -200, -200, 330, 3400); rect(g, '#b8322e', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.55)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 600], pole: 1150 } } },
    VET: { paint: (g) => { room(g, '#dfe8ee', 2850, '#b9c4cc'); roundRect(g, 200, 2500, 1760, 350, 30, '#f4f1ea'); }, signs: {} },
    TOUR: { paint: (g, t) => { room(g, '#cfe0ea', 2900, '#c9b48f'); g.fillStyle = '#e9d9b8'; g.beginPath(); g.moveTo(80, 1700); g.lineTo(1080, 900); g.lineTo(2080, 1700); g.fill(); rect(g, '#d64a3a', 160, 1700, 1840, 1200); for (let i = 0; i < 6; i++) rect(g, '#f4f1ea', 160 + i * 340, 1700, 170, 1200); bunting(g, 1650, t); }, signs: {} },
    WORKSHOP: { paint: (g) => { room(g, '#2f2a38', 2950, '#4a4250'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.25)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); }, signs: {} },
    MOTEL: { paint: (g) => { room(g, '#2f3d55', 2850, '#5d4a3c'); windows(g, 260, 500, 900, 700, 1, 2, '#41557a'); roundRect(g, 1200, 2350, 800, 500, 60, '#6d5a7e'); blob(g, 1700, 900, 120, 120, '#f4e2a8'); }, signs: {} },
    FESTIVAL: { paint: (g, t) => { room(g, '#cfe0ea', 2900, '#9bb07a'); bunting(g, 1350, t); bunting(g, 1700, t + 1); for (let i = 0; i < 18; i++) blob(g, (i * 137) % 2160, 400 + (i * 263) % 700, 40, 40, ['#d64a3a', P.gold, '#4f7c86'][i % 3]); }, signs: {} },
  };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);
  const HB = [260, 650, 1500, 760];
  const hook = (g, s, xOn) => { board(g, HB); typeText(g, "NO HEAD =\nNO LIFE", HB, T('you', 1), s.t); if (xOn) redX(g, HB, T('wrong'), s.t); };

  // P1/P2 — hook: Mike walks in, headless, on the very first words
  shot('P1', 0, 'KITCHEN', full(40), (g, s) => {
    hook(g, s, false);
    drawChar(g, CH.you, { x: 1500, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, smile: 0.5, arms: [{ to: [1200, 2300], hand: 'point' }, null] });
    chicken(g, walkX(200, 1, 0.5, s.lt), FEET, 1.1, s.t, { headless: true, walk: true });
  });
  shot('P2', T('wrong'), 'KITCHEN', cam(1050, 2300, 1.3, 1.36, 0, 0), (g, s) => {
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1500, y: FEET - 120 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1, arms: [{ to: [1150, 2150], hand: 'open' }, { to: [1850, 2150], hand: 'open' }] });
    chicken(g, walkX(200 + 0.5 * 300 * 1.5 / 0.9 * (T('wrong')), 1, 0.5, s.lt), FEET, 1.1, s.t, { headless: true, walk: true });
    mark(g, 1500, 1850 - 120 * j, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: 18 months, and rich
  const p3 = (g, s) => {
    const r = [260, 620, 1500, 820]; board(g, r);
    typeText(g, '18 MONTHS\nWITH NO HEAD', [r[0] + 60, r[1] + 60, r[2] - 120, 440], T('eighteen'), s.t);
    typeText(g, '...AND RICH', [r[0] + 60, r[1] + 560, r[2] - 120, 200], T('rich'), s.t);
    chicken(g, 1080, FEET, 1.6, s.t, { headless: true, walk: true });
    if (s.t > T('rich')) for (let i = 0; i < 5; i++) { const t0 = T('rich') + i * 0.12; withPop(g, 400 + i * 340, 2200, s.t, t0, () => cash(g, 400 + i * 340, 2200 - ((s.t - t0) * 200) % 200, 0.8)); }
  };
  shot('P3', T('in', 1), 'FARM', full(40), p3);
  shot('P3b', T('and', 1), 'FARM', cam(1080, 2750, 1.8, 1.86, 0, 0), p3);

  // P4 — subject under a spotlight
  shot('P4', T('his', 2), 'STAGE', full(30), (g, s) => {
    typeText(g, 'MIKE', plates.STAGE.signs.name.r, T('mike', 1) - 0.1, s.t);
    withPop(g, 1080, FEET, s.t, s.t0 + 0.05, () => chicken(g, 1080, FEET, 2.0, s.t, { headless: true }), 'squash');
  });

  // P5 — origin: Fruita, Colorado, Sept 1945; the axe; Mike gets up
  const origin = (g, s, wide) => {
    if (wide) { board(g, [280, 1000, 1100, 400]); typeText(g, 'FRUITA\nCOLORADO', [280, 1000, 1100, 400], T('fruita') + 0.05, s.t); dateCard(g, 'SEPT\n1945', s.t, T('september')); }
    const sw = clamp((s.t - T('swings')) / 0.35);
    drawChar(g, CH.lloyd, { x: 1500, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, ...OVERALLS, arms: [{ to: [1250, 2050 + sw * 500], hand: 'fist' }, null] });
    axe(g, 1250, 2050 + sw * 500, -0.4 + sw * 1.9, 1.1);
    if (s.t < T('swings') + 0.3) chicken(g, 700, FEET, 1.3, s.t, {});
    else { puff(g, 700, FEET - 500, 420, s.t, T('swings') + 0.3); chicken(g, s.t > T('up') ? walkX(700, -1, 0.5, s.t - T('up')) : 700, FEET, 1.3, s.t, { headless: true, walk: s.t > T('up'), face: -1 }); }
    if (s.t > T('up')) mark(g, 1500, 1850, '!', s.t, T('up'));
  };
  shot('P5', T('fruita'), 'FARM', full(40), (g, s) => origin(g, s, true));
  shot('P5b', T('farmer'), 'FARM', cam(1080, 2350, 1.3, 1.36, 0, 0), (g, s) => origin(g, s, false));
  shot('P5c', T('but'), 'FARM', full(20), (g, s) => origin(g, s, true));

  // P6 — the axe missed three things (x-ray of the neck, each lands on its label)
  const xray = (g, s, upTo) => {
    roundRect(g, 330, 1300, 1500, 1500, 40, '#1d2a3a');
    g.save(); g.globalAlpha = 0.9; chicken(g, 1080, 2650, 1.9, s.t, { headless: true }); g.restore();
    popBoard(g, s, [200, 650, 820, 300], 'JUGULAR\nVEIN', T('jugular'));
    if (s.t > T('jugular')) tube(g, [1300, 2000], [1370, 1840], 26, '#6a6ad0'); // vein in blue: diagram, not gore
    if (upTo >= 2) { popBoard(g, s, [1140, 650, 820, 300], 'ONE EAR', T('ear')); if (s.t > T('ear')) blob(g, 1330, 1880, 30, 30, '#e9c9b8'); }
    if (upTo >= 3) { popBoard(g, s, [430, 1000, 1300, 260], 'BRAIN STEM', T('brain', 1)); if (s.t > T('brain', 1)) blob(g, 1350, 1870, 40, 26, '#f4c46a'); }
  };
  shot('P6', T('the', 1), 'VET', full(30), (g, s) => xray(g, s, 1));
  shot('P6b', T('one', 1), 'VET', cam(1300, 1850, 1.5, 1.56, 0, 0), (g, s) => xray(g, s, 2));
  shot('P6c', T('and', 3), 'VET', full(0), (g, s) => xray(g, s, 3));

  // P7 — title
  shot('P7', T('so', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'HOW DOES A\nCHICKEN LIVE\nWITH NO HEAD?', s.t, s.lt, T('so', 1), { size: 84 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('head', 2) + i * 0.12, 140, C.white));
    g.restore();
  });

  // P8 — the brain stem runs the basics
  shot('P8', T('in', 2), 'VET', full(30), (g, s) => {
    popBoard(g, s, [330, 650, 1500, 300], 'BRAIN STEM =', T('in', 2) + 0.1);
    [['BREATHING', T('breathing')], ['HEARTBEAT', T('heartbeat')], ['WALKING', T('walking', 2)]].forEach(([w, t0], i) => popBoard(g, s, [430, 1050 + i * 300, 1300, 240], w, t0));
    chicken(g, 1080, FEET, 1.3, s.t, { headless: true, walk: s.t > T('walking', 2) });
  });
  // P9 — fed with an eyedropper; grows
  const feed = (g, s) => {
    const grow = clamp((s.t - T('growing')) / 2.2);
    if (s.t > T('growing')) popBoard(g, s, [330, 650, 1500, 360], '2.5 LB → 8 LB', T('growing'));
    chicken(g, 1300, FEET, 1.3 + 0.9 * grow, s.t, { headless: true });
    drawChar(g, CH.lloyd, { x: 550, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, ...OVERALLS, smile: 0.6, arms: [null, { to: [1050, 2200], hand: 'fist' }] });
    if (grow < 0.2) { dropper(g, 1100, 2280, 1.2, 0.8); for (let i = 0; i < 3; i++) blob(g, 1200, 2330 + ((s.t * 300 + i * 60) % 180), 12, 16, '#f4f1ea'); }
  };
  shot('P9', T('lloyd', 2), 'KITCHEN', full(30), feed);
  shot('P9b', T('milk'), 'KITCHEN', cam(1250, 2450, 1.6, 1.66, 0, 0), feed); // the dropper and Mike
  shot('P9c', T('and', 6), 'KITCHEN', full(10), feed);

  // P10 — the tour: 25¢ tickets, crowds, magazines
  const tour = (g, s) => {
    withPop(g, 1080, 2650, s.t, T('tour') - 0.1, () => roundRect(g, 760, 2600, 640, 300, 30, P.wood), 'squash');
    chicken(g, 1080, 2600, 1.1, s.t, { headless: true, walk: true });
    if (s.t > T('paid', 1)) withPop(g, 1080, 1250, s.t, T('twenty-five'), () => ticket(g, 1080, 1250, 1.6), 'squash');
    [[CH.fan1, 350, 0], [CH.fan2, 1800, 0.2]].forEach(([c, x, d]) => { const j = Math.max(0, Math.sin(Math.PI * clamp((s.t - T('see', 1) - d) / 0.45))); drawChar(g, c, { x, y: FEET - j * 200, k: 0.9, face: x < 1080 ? 1 : -1, pose: 'stand', t: s.t, smile: 0.9, look: 0 }); });
  };
  shot('P10', T('the', 4), 'TOUR', full(30), tour);
  shot('P10x', T('people'), 'TOUR', cam(1080, 1700, 1.3, 1.36, 0, 0), tour); // the ticket
  shot('P10b', T('time'), 'TOUR', full(10), (g, s) => {
    tour(g, s);
    withPop(g, 700, 1300, s.t, T('time'), () => magazine(g, 700, 1300, 1.3, 'TIME', '#b8322e'), 'squash');
    withPop(g, 1450, 1300, s.t, T('life'), () => magazine(g, 1450, 1300, 1.3, 'LIFE', '#d64a3a'), 'squash');
  });
  // P11 — the counter: $4,500 a month
  shot('P11', T('the', 5), 'WORKSHOP', full(30), (g, s) => {
    const r = [240, 700, 1500, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('climbs'), b = T('month', 1, 'e');
    const v = Math.round(4500 * Math.pow(clamp((s.t - a) / (b - a)), 1.2) / 10) * 10;
    A.ev('ding', b);
    if (s.t >= a) { g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.26}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$' + v.toLocaleString('en-US') + ' / MO', r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore(); }
    chicken(g, 1080, FEET, 1.6, s.t, { headless: true });
  });

  // P12 — twist: choking in a motel; the syringe left behind
  const motel = (g, s) => {
    popBoard(g, s, [330, 1450, 1500, 300], 'MOTEL, 1947', T('motel') - 0.1);
    const shake = s.t > T('choking') ? Math.sin(s.t * 40) * 14 : 0;
    chicken(g, 1500 + shake, 2380, 0.9, s.t, { headless: true });
    drawChar(g, CH.lloyd, { x: 650, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, ...OVERALLS, look: 1, eyesClosed: s.t < T('choking') });
    if (s.t > T('choking')) mark(g, 650, 1850, '!', s.t, T('choking'));
  };
  shot('P12', T('and', 9), 'MOTEL', full(30), motel);
  shot('P12x', T('mike', 4), 'MOTEL', cam(1500, 2450, 1.7, 1.76, 0, 0), motel);
  shot('P12b', T('the', 7), 'TOUR', full(20), (g, s) => {
    roundRect(g, 760, 2600, 640, 300, 30, P.wood);
    withPop(g, 1080, 2550, s.t, T('syringe'), () => syringe(g, 1080, 2550, 1.6), 'squash');
    popBoard(g, s, [330, 1050, 1500, 420], 'LEFT AT\nTHE LAST SHOW', T('left'));
  });
  // P13 — the festival
  shot('P13', T('today'), 'FESTIVAL', full(30), (g, s) => {
    popBoard(g, s, [280, 620, 1600, 520], 'MIKE THE HEADLESS\nCHICKEN FESTIVAL', T('today') + 0.05);
    chicken(g, 1080, FEET, 1.8, s.t, { headless: true });
    [[CH.fan1, 350], [CH.clara, 1800]].forEach(([c, x], i) => { const j = Math.abs(Math.sin(s.t * 6 + i)); drawChar(g, c, { x, y: FEET - j * 120, k: 0.9, face: x < 1080 ? 1 : -1, pose: 'stand', t: s.t, smile: 1, arms: [{ to: [x - 200, 1900], hand: 'open' }, { to: [x + 200, 1900], hand: 'open' }] }); });
  });

  // P14 — the question; viewer reacts; sign holds to the end (loops back to the hook)
  const finale = (g, s) => {
    hook(g, s, true);
    popBoard(g, s, [260, 1600, 1500, 560], 'WOULD YOU HAVE\nPAID TO SEE HIM?', T('so', 2) + 0.05);
    const up = s.t > T('honest');
    drawChar(g, CH.you, { x: 1500, y: FEET + 150, k: K, face: -1, pose: 'stand', t: s.t, look: up ? 0 : -0.8, smile: up ? 0.4 : 0, arms: up ? [{ to: [1280, 2300], hand: 'open' }, { to: [1850, 2400], hand: 'point' }] : null });
    chicken(g, 650, FEET + 150, 1.1, s.t, { headless: true, walk: true });
    mark(g, 1850, 2250, '?', s.t, T('see', 2));
  };
  shot('P14', T('so', 2), 'KITCHEN', full(30), finale);
  shot('P14b', T('paid', 2), 'KITCHEN', cam(1150, 2200, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('fruita'), T('the', 1), T('the', 4), T('and', 9), T('so', 2)];
  return { plates, shots, wipes, end: A.duration };
};

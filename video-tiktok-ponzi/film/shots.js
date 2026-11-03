/* "Charles Ponzi" (Boston, 1920) — vertical 9:16 for US TikTok, flat vector, drawn in code.
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
    ponzi: { skin: C.skin, top: '#e9e4da', bottom: '#3b3f4a', hair: '#2e2420', seed: 61 },
    inv1: { skin: C.skin, top: P.violet, bottom: P.navy, hair: '#6a4630', hairStyle: 'tail', seed: 62 },
    inv2: { skin: C.skin, top: P.blue, bottom: '#3a3f4a', hair: '#1f1b1b', seed: 63 },
    inv3: { skin: C.skin, top: P.gold, bottom: P.navy, hair: '#c9a46a', seed: 64 },
    inv4: { skin: C.skin, top: P.teal, bottom: '#4b4038', hair: '#7a5a40', glasses: true, seed: 65 },
    reporter: { skin: C.skin, top: '#6d5a48', bottom: '#3b3f4a', hair: '#3a2a20', glasses: true, seed: 66 },
  });
  const PZ = { tophat: '#2a2a30', mustache: '#2e2420' };
  const ponzi = (g, s, x, extra = {}) => drawChar(g, CH.ponzi, { x, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, smile: 0.7, ...PZ, ...extra });
  const coupon = (g, x, y, s = 1, col = '#e9d9a8') => { roundRect(g, x - 160 * s, y - 100 * s, 320 * s, 200 * s, 14 * s, col); g.save(); g.strokeStyle = '#b89a5a'; g.lineWidth = 8 * s; g.setLineDash([16 * s, 12 * s]); g.strokeRect(x - 140 * s, y - 80 * s, 280 * s, 160 * s); g.restore(); blob(g, x - 70 * s, y, 34 * s, 34 * s, '#b8322e'); for (let i = 0; i < 3; i++) rect(g, '#b89a5a', x - 20 * s, y - 40 * s + i * 34 * s, 130 * s, 12 * s); };
  const stamp = (g, x, y, s = 1) => { roundRect(g, x - 70 * s, y - 90 * s, 140 * s, 180 * s, 8 * s, '#fbfaf6'); roundRect(g, x - 50 * s, y - 70 * s, 100 * s, 140 * s, 6 * s, '#4f7c86'); blob(g, x, y - 10 * s, 26 * s, 26 * s, '#efe6d6'); };
  const bill = (g, x, y, s = 1, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); roundRect(g, -120 * s, -60 * s, 240 * s, 120 * s, 14 * s, P.money); blob(g, 0, 0, 32 * s, 32 * s, '#6f9069'); g.restore(); };
  const calc = (g, x, y, s = 1) => { roundRect(g, x - 120 * s, y - 160 * s, 240 * s, 320 * s, 24 * s, '#3b3f4a'); roundRect(g, x - 90 * s, y - 130 * s, 180 * s, 70 * s, 10 * s, '#bfe8a0'); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) roundRect(g, x - 85 * s + c * 62 * s, y - 40 * s + r * 62 * s, 46 * s, 46 * s, 8 * s, '#e9e4da'); };
  const rocket = (g, x, y, s = 1) => { g.fillStyle = P.red; g.beginPath(); g.moveTo(x, y - 160 * s); g.quadraticCurveTo(x + 80 * s, y - 40 * s, x + 60 * s, y + 90 * s); g.lineTo(x - 60 * s, y + 90 * s); g.quadraticCurveTo(x - 80 * s, y - 40 * s, x, y - 160 * s); g.fill(); blob(g, x, y - 30 * s, 30 * s, 30 * s, '#cddbe4'); blob(g, x, y + 130 * s, 40 * s, 50 * s, P.gold); };
  const newspaper = (g, x, y, w, h) => { roundRect(g, x, y, w, h, 10, '#efe9dc'); for (let i = 0; i < 6; i++) rect(g, '#cfc7b4', x + w * 0.08, y + h * (0.5 + i * 0.07), w * 0.84, 10); };
  const bankFacade = (g, x, y, w, h, col = '#e6d8bc') => { g.fillStyle = col; g.beginPath(); g.moveTo(x - 20, y); g.lineTo(x + w / 2, y - h * 0.22); g.lineTo(x + w + 20, y); g.fill(); roundRect(g, x, y, w, h, 10, col); for (let i = 0; i < 4; i++) roundRect(g, x + w * 0.1 + i * w * 0.22, y + h * 0.12, w * 0.1, h * 0.8, 10, P.cream); };

  /* ─── plates (2160×3840) ─── */
  const plates = {
    PARLOR: { paint: (g) => { room(g, '#d8c7a8', 2700, '#9a8468'); roundRect(g, 120, 2350, 1920, 550, 30, P.wood); }, signs: { board: { r: [260, 650, 1500, 760] } } },
    BOSTON: { paint: (g, t) => { room(g, '#d6dde3', 2900, P.road); cloud(g, 300, 1400, 0.8, t); [[-60, 1600, 820, P.brick], [780, 1450, 640, '#a86a52'], [1440, 1700, 800, P.brick]].forEach(([x, y, w, c]) => { roundRect(g, x, y, w, 2900 - y, 10, c); windows(g, x + w * 0.08, y + 80, w * 0.84, 700, 3, 2, '#e8dcc8'); }); }, signs: {} },
    STAGE: { paint: (g) => { room(g, '#2b2238', 3000, '#6a5040'); rect(g, '#3d6a4a', -200, -200, 330, 3400); rect(g, '#3d6a4a', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.55)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 600], pole: 1150 } } },
    OFFICE: { paint: (g) => { room(g, '#c9b8a0', 2750, '#8a6a4c'); roundRect(g, 200, 2350, 1760, 500, 20, P.wood); roundRect(g, 1600, 1200, 400, 600, 20, '#a9c3d9'); }, signs: {} },
    MAP: { paint: (g) => { room(g, '#5d7f99', 2900, '#4a5d6e'); blob(g, 650, 1500, 520, 700, '#b9c9a0'); blob(g, 1650, 1700, 420, 560, '#c9b48f'); }, signs: {} },
    WORKSHOP: { paint: (g) => { room(g, '#2f2a38', 2950, '#4a4250'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.25)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); }, signs: {} },
    CLASS: { paint: (g) => { room(g, P.blue, 2850, '#8a6a4c'); }, signs: { chalk: { kind: 'chalk', r: [150, 480, 1780, 1720], frame: P.wood } } },
    STREET: { paint: (g, t) => { room(g, '#d6dde3', 2950, P.road); bankFacade(g, 200, 1500, 1760, 1450); }, signs: {} },
    RIO: { paint: (g, t) => { room(g, '#f2c9a0', 2900, '#c9b48f'); g.fillStyle = '#7f9a7e'; g.beginPath(); g.moveTo(-200, 2300); g.quadraticCurveTo(500, 900, 1100, 2000); g.quadraticCurveTo(1500, 1300, 2360, 2300); g.lineTo(2360, 2900); g.lineTo(-200, 2900); g.fill(); rect(g, '#5d7f99', -200, 2500, PW + 400, 400); }, signs: {} },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);
  const close = (x, y) => cam(x, y, 1.6, 1.66, 0, 0); // tight on faces/hands: no boards in frame

  // P1/P2 — hook
  const hook = (g, s, xOn) => { typeOn(g, 'PARLOR', 'board', 'SCAMMERS =\nGENIUSES', T('you', 1), s.t); if (xOn) redX(g, S('PARLOR', 'board').r, T('wrong'), s.t); };
  shot('P1', 0, 'PARLOR', full(40), (g, s) => { hook(g, s, false); drawChar(g, CH.you, { x: 1250, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -0.6, arms: [{ to: [950, 2300], hand: 'point' }, null] }); });
  shot('P2', T('wrong'), 'PARLOR', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1250, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [880, 2150], hand: 'open' }, { to: [1620, 2150], hand: 'open' }] });
    mark(g, 1250, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: +50% in 45 days, 40,000 people
  const p3 = (g, s) => {
    const r = [260, 620, 1500, 820]; board(g, r);
    typeText(g, '+50%\nIN 45 DAYS', [r[0] + 60, r[1] + 60, r[2] - 120, 440], T('fifty'), s.t);
    typeText(g, '40,000 BELIEVED', [r[0] + 60, r[1] + 560, r[2] - 120, 200], T('forty', 1), s.t);
    [CH.inv1, CH.inv2, CH.inv3, CH.inv4].forEach((c, i) => withPop(g, 300 + i * 520, FEET, s.t, T('forty', 1) + i * 0.12, () => drawChar(g, c, { x: 300 + i * 520, y: FEET, k: 0.85, face: 1, pose: 'stand', t: s.t, smile: 0.8 }), 'squash'));
  };
  shot('P3', T('in', 1), 'BOSTON', full(40), p3);
  shot('P3b', T('forty', 1), 'BOSTON', cam(1080, 2750, 1.9, 1.96, 0, 0), p3);

  // P4 — subject
  shot('P4', T('his', 1), 'STAGE', full(30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'CHARLES\nPONZI', T('charles') - 0.1, s.t);
    withPop(g, 1000, FEET, s.t, s.t0 + 0.05, () => ponzi(g, s, 1000, { k: 1.2, smile: 0.9, arms: [{ to: [700, 1500 + Math.sin(s.t * 6) * 30], hand: 'open' }, null] }), 'squash');
  });

  // P5 — origin: Boston 1919, broke; finds a postal coupon
  const origin = (g, s) => {
    board(g, [280, 1000, 1000, 340]); typeText(g, 'BOSTON', [280, 1000, 1000, 340], T('boston') + 0.05, s.t);
    dateCard(g, '1919', s.t, T('1919'));
    const broke = s.t > T('broke');
    ponzi(g, s, 1250, { smile: broke ? 0 : 0.5, tophat: null, arms: broke ? [{ to: [950, 2450], hand: 'open' }, { to: [1550, 2450], hand: 'open' }] : null });
    if (broke && s.t < T('then')) withPop(g, 1250, 1900, s.t, T('broke'), () => { g.fillStyle = C.ink; g.font = '800 160px Montserrat'; g.textAlign = 'center'; g.fillText('$0', 1250, 1960); });
  };
  shot('P5', T('boston'), 'BOSTON', full(40), origin);
  const find = (g, s) => {
    withPop(g, 1080, 2100, s.t, T('coupon', 1) - 0.1, () => coupon(g, 1080, 2100, 1.6), 'squash');
    if (s.t > T('stamps') - 0.1) withPop(g, 1500, 2550, s.t, T('stamps') - 0.1, () => stamp(g, 1500, 2550, 1.4));
    drawChar(g, CH.ponzi, { x: 700, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, ...PZ, tophat: null, look: 0.6, arms: [null, { to: [900, 2250], hand: 'point' }] });
  };
  shot('P5b', T('then'), 'OFFICE', close(1080, 2300), find);
  shot('P5x', T('trade'), 'OFFICE', full(10), find);
  // P5c — cheaper in Italy, worth more in America (map with two prices)
  shot('P5c', T('cheaper'), 'MAP', full(30), (g, s) => {
    popBoard(g, s, [200, 650, 820, 300], 'ITALY\n1¢', T('italy') - 0.1);
    popBoard(g, s, [1140, 650, 820, 300], 'USA\n6¢', T('america') - 0.1);
    coupon(g, 650, 1700, 1.0);
    const p = clamp((s.t - T('worth')) / 0.9);
    coupon(g, lerp(650, 1650, p), 1700 - Math.sin(p * Math.PI) * 300, 1.0);
  });

  // P6 — the pitch: three parts
  const pitch = (g, s, upTo) => {
    popBoard(g, s, [200, 650, 820, 300], 'A REAL\nCOUPON', T('real', 1) - 0.1);
    withPop(g, 600, 1300, s.t, T('real', 1), () => coupon(g, 600, 1300, 1.1), 'squash');
    if (upTo >= 2) { popBoard(g, s, [1140, 650, 820, 300], 'SIMPLE\nMATH', T('simple')); withPop(g, 1550, 1300, s.t, T('math'), () => calc(g, 1550, 1300, 1.1)); }
    if (upTo >= 3) { popBoard(g, s, [430, 1650, 1300, 300], 'FAST MONEY', T('fast')); withPop(g, 1500, 2350, s.t, T('fast'), () => rocket(g, 1500, 2350, 1.1), 'squash'); }
    ponzi(g, s, 650, { y: FEET + 50, smile: 0.9, arms: [null, { to: [950, 2200 + Math.sin(s.t * 5) * 30], hand: 'open' }] });
  };
  shot('P6', T('his', 2), 'OFFICE', full(30), (g, s) => pitch(g, s, 1));
  shot('P6b', T('a', 5), 'OFFICE', cam(1300, 1300, 1.15, 1.19, 0, 20), (g, s) => pitch(g, s, 2));
  shot('P6c', T('and', 1), 'OFFICE', full(0), (g, s) => pitch(g, s, 3));

  // P7 — title
  shot('P7', T('so', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'SO HOW DID\nIT WORK?', s.t, s.lt, T('so', 1), { size: 96 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('work') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P8 — no real profit: the coupon plan was impossible
  shot('P8', T('there'), 'CLASS', full(30), (g, s) => {
    const r = S('CLASS', 'chalk').r;
    typeOn(g, 'CLASS', 'chalk', 'REAL PROFIT', T('there') + 0.05, s.t, { r: [r[0] + 150, r[1] + 120, r[2] - 300, 300] });
    redX(g, [r[0] + 150, r[1] + 120, r[2] - 300, 300], T('profit', 2), s.t);
    typeOn(g, 'CLASS', 'chalk', 'BUY MILLIONS\nOF COUPONS?', T('buying'), s.t, { r: [r[0] + 150, r[1] + 600, r[2] - 300, 500] });
    redX(g, [r[0] + 150, r[1] + 600, r[2] - 300, 500], T('impossible'), s.t);
  });
  // P9 — the machine: new money pays old investors (chain of people passing cash)
  const chain = (g, s) => {
    const r = S('CLASS', 'chalk').r;
    typeOn(g, 'CLASS', 'chalk', 'NEW MONEY', T('new', 1) - 0.1, s.t, { r: [r[0] + 100, r[1] + 100, r[2] - 200, 260] });
    typeOn(g, 'CLASS', 'chalk', '→ OLD INVESTORS', T('investors', 2) - 0.2, s.t, { r: [r[0] + 100, r[1] + 420, r[2] - 200, 260] });
    const xs = [320, 820, 1340, 1840];
    [CH.inv4, CH.inv1, CH.inv2, CH.inv3].forEach((c, i) => {
      const on = s.t >= T('instead') + i * 0.25;
      if (on) drawChar(g, c, { x: xs[i], y: FEET, k: 0.8, face: -1, pose: 'stand', t: s.t, smile: i < 2 && s.t > T('rich') ? 1 : 0.4 });
    });
    for (let i = 0; i < 3; i++) { const t0 = T('paid') + i * 0.5; if (s.t > t0) { const p = ((s.t - t0) % 1.5) / 1.5; bill(g, lerp(xs[3 - i], xs[2 - i], p), 2550 - Math.sin(p * Math.PI) * 200, 0.7, p * 3); } }
  };
  shot('P9', T('instead'), 'CLASS', full(30), chain);
  shot('P9b', T('they'), 'CLASS', close(1080, 2550), chain);
  shot('P9c', T('and', 2), 'CLASS', full(10), (g, s) => { chain(g, s); for (let i = 0; i < 8; i++) { const t0 = T('poured') + i * 0.12; if (s.t > t0) bill(g, 200 + hash(i) * 1760, Math.min(2900, 1800 + (s.t - t0) * 1600), 0.6, i); } });
  // P10 — counter: $1M a week → $15M
  const counter = (g, s) => {
    const r = [240, 700, 1500, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    popBoard(g, s, [430, 1450, 1300, 260], '$1M A WEEK', T('week') - 0.2);
    const a = T('climbs'), b = T('dollars', 2, 'e');
    const v = Math.round(15000000 * Math.pow(clamp((s.t - a) / (b - a)), 1.4) / 1000) * 1000;
    A.ev('ding', b);
    if (s.t >= a) { g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.28}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('$' + v.toLocaleString('en-US'), r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore(); }
    ponzi(g, s, 1080, { smile: 1, y: FEET + 100 });
  };
  shot('P10', T('at'), 'WORKSHOP', full(30), counter);
  shot('P10b', T('the', 1), 'WORKSHOP', cam(1080, 1250, 1.15, 1.19, 0, 20), counter); // on the counter

  // P11 — August 1920: a newspaper investigates; run on the bank
  shot('P11', T('august'), 'OFFICE', full(30), (g, s) => {
    dateCard(g, 'AUG\n1920', s.t, T('august'));
    newspaper(g, 330, 1100, 1500, 1100);
    typeText(g, 'PONZI:\nWHERE IS\nTHE MONEY?', [400, 1150, 1360, 600], T('newspaper') - 0.05, s.t);
    drawChar(g, CH.reporter, { x: 1600, y: FEET + 50, k: 1.0, face: -1, pose: 'stand', t: s.t, arms: [{ to: [1300, 2400], hand: 'fist', scribble: true }, null] });
  });
  const run = (g, s) => {
    popBoard(g, s, [330, 900, 1500, 420], 'MONEY GONE', T('gone') - 0.1);
    [CH.inv1, CH.inv2, CH.inv3, CH.inv4].forEach((c, i) => {
      const x = walkX(2300 + i * 300, -1, 0.9, Math.min(1.8, s.t - T('investors', 3)));
      drawChar(g, c, { x, y: FEET + (i % 2) * 80, k: 0.9, face: -1, pose: s.t - T('investors', 3) < 1.8 ? 'walk' : 'stand', walkT: s.t * 1.5 + i * 0.2, t: s.t, look: -1,
        arms: s.t > T('gone') ? [{ to: [x - 240, 2200], hand: 'open' }, { to: [x + 240, 2200], hand: 'open' }] : null });
    });
  };
  shot('P11b', T('investors', 3), 'STREET', full(30), run);
  shot('P11c', T('six'), 'STREET', full(0), (g, s) => {
    run(g, s);
    { const t0 = T('collapse'); if (s.t >= t0) { A.ev('hit', t0); withPop(g, 1080, 2000, s.t, t0, () => { g.save(); g.translate(1080, 2000); g.rotate(-0.12); g.strokeStyle = C.red; g.lineWidth = 26; g.strokeRect(-600, -150, 1200, 300); g.fillStyle = C.red; g.font = '800 150px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('6 BANKS FAIL', 0, 10); g.restore(); }, 'squash'); } }
  });

  // P12 — twist: died poor in Brazil; his name lives on
  const rio = (g, s) => {
    popBoard(g, s, [330, 700, 1500, 420], 'BRAZIL', T('brazil') - 0.1);
    ponzi(g, s, 1080, { tophat: null, smile: 0, hair: '#d4d1cb', mustache: '#d4d1cb', age: 1, hunch: 0.12 });
    withPop(g, 1080, 1700, s.t, T('seventy-five') - 0.05, () => { g.fillStyle = C.ink; g.font = '800 200px Montserrat'; g.textAlign = 'center'; g.fillText('$75', 1080, 1760); });
  };
  shot('P12', T('and', 3), 'RIO', full(30), rio);
  shot('P12x', T('with', 2), 'RIO', cam(1080, 2350, 1.5, 1.56, 0, 0), rio);
  const legacy = (g, s) => {
    typeOn(g, 'STAGE', 'name', 'PONZI\nSCHEME', T('name', 2), s.t);
    withPop(g, 1080, 1900, s.t, T('name', 2), () => { g.fillStyle = P.gold; g.font = '800 200px Montserrat'; g.textAlign = 'center'; g.fillText('★', 1080, 1960); });
  };
  shot('P12b', T('but'), 'STAGE', full(30), legacy);
  shot('P12c', T('today'), 'STAGE', cam(1080, 1350, 1.2, 1.25, 0, 20), legacy);

  // P13 — the question; viewer reacts
  const finale = (g, s) => {
    typeOn(g, 'PARLOR', 'board', 'SCAMMERS =\nGENIUSES', T('you', 1), s.t);
    redX(g, S('PARLOR', 'board').r, T('wrong'), s.t);
    popBoard(g, s, [260, 1600, 1500, 560], 'WOULD YOU\nHAVE INVESTED?', T('so', 2) + 0.05);
    const up = s.t > T('honest');
    drawChar(g, CH.you, { x: 1300, y: FEET + 150, k: K, face: -1, pose: 'stand', t: s.t, look: up ? 0 : -0.8, smile: up ? 0.3 : 0, arms: up ? [{ to: [1080, 2300], hand: 'open' }, { to: [1650, 2400], hand: 'point' }] : null });
    mark(g, 1650, 2250, '?', s.t, T('invested'));
  };
  shot('P13', T('so', 2), 'PARLOR', full(30), finale);
  shot('P13b', T('would'), 'PARLOR', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('boston'), T('his', 2), T('august'), T('and', 3), T('so', 2)];
  return { plates, shots, wipes, end: A.duration };
};

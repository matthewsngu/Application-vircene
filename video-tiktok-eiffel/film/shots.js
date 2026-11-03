/* "The man who sold the Eiffel Tower" (Victor Lustig, 1925) — vertical 9:16 for US TikTok, flat vector, drawn in code.
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
    lustig: { skin: C.skin, top: '#26262c', bottom: '#26262c', hair: '#2e2420', seed: 51 },
    poisson: { skin: C.skin, top: '#7a6a58', bottom: '#4b4038', hair: '#5a4a3a', glasses: true, seed: 52 },
    dealer2: { skin: C.skin, top: '#5d6670', bottom: '#3b3f4a', hair: '#1f1b1b', seed: 53 },
    dealer3: { skin: C.skin, top: '#6b4e3a', bottom: '#3b3f4a', hair: '#c9a46a', seed: 54 },
    cop: { skin: C.skin, top: P.navy, bottom: P.navy, hair: '#1f1b1b', seed: 55 },
  });
  const LUS = { tophat: '#1d1d22', mustache: '#2e2420' };
  const lustig = (g, s, x, extra = {}) => drawChar(g, CH.lustig, { x, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, smile: 0.5, ...LUS, ...extra });
  const eiffel = (g, x, y, h, col = '#7a6a5a') => { // flat Eiffel Tower silhouette
    const w = h * 0.42; g.fillStyle = col; g.beginPath();
    g.moveTo(x - w / 2, y); g.quadraticCurveTo(x - w * 0.12, y - h * 0.4, x - w * 0.06, y - h * 0.86); g.lineTo(x, y - h);
    g.lineTo(x + w * 0.06, y - h * 0.86); g.quadraticCurveTo(x + w * 0.12, y - h * 0.4, x + w / 2, y); g.lineTo(x + w * 0.2, y);
    g.quadraticCurveTo(x, y - h * 0.2, x - w * 0.2, y); g.closePath(); g.fill();
    rect(g, col, x - w * 0.3, y - h * 0.32, w * 0.6, h * 0.03); rect(g, col, x - w * 0.16, y - h * 0.6, w * 0.32, h * 0.025);
  };
  const tophatIcon = (g, x, y, s = 1) => { rect(g, '#1d1d22', x - 80 * s, y - 150 * s, 160 * s, 150 * s); rect(g, '#1d1d22', x - 130 * s, y - 10 * s, 260 * s, 26 * s); rect(g, '#8a2a2a', x - 80 * s, y - 40 * s, 160 * s, 22 * s); };
  const cashIcon = (g, x, y, s = 1) => { [0, 1, 2].forEach((i) => roundRect(g, x - 120 * s + i * 10 * s, y - 60 * s - i * 22 * s, 240 * s, 110 * s, 14 * s, i % 2 ? '#7fa37a' : P.money)); };
  const newspaper = (g, x, y, w, h) => { roundRect(g, x, y, w, h, 10, '#efe9dc'); for (let i = 0; i < 6; i++) rect(g, '#cfc7b4', x + w * 0.08, y + h * (0.5 + i * 0.07), w * 0.84, 10); };
  const letterhead = (g, x, y, s = 1) => { roundRect(g, x - 150 * s, y - 200 * s, 300 * s, 400 * s, 10 * s, '#fbfaf6'); blob(g, x, y - 120 * s, 50 * s, 50 * s, '#b8322e'); for (let i = 0; i < 5; i++) rect(g, '#d9d4c7', x - 110 * s, y - 30 * s + i * 50 * s, 220 * s, 12 * s); };
  const chandelier = (g, x, y, s = 1) => { tube(g, [x, y - 200 * s], [x, y - 60 * s], 12 * s, P.gold); blob(g, x, y, 170 * s, 50 * s, P.gold); for (let i = -3; i <= 3; i++) blob(g, x + i * 50 * s, y + 70 * s, 16 * s, 34 * s, '#f4e2a8'); };
  const envelope = (g, x, y, s = 1) => { roundRect(g, x - 150 * s, y - 95 * s, 300 * s, 190 * s, 12 * s, '#e9dcc0'); g.fillStyle = '#d7c7a6'; g.beginPath(); g.moveTo(x - 150 * s, y - 95 * s); g.lineTo(x, y + 10 * s); g.lineTo(x + 150 * s, y - 95 * s); g.fill(); };
  const suitcase = (g, x, y) => { roundRect(g, x - 120, y - 300, 240, 300, 30, '#a0522d'); roundRect(g, x - 50, y - 350, 100, 60, 20, '#3b3f4a'); };
  const bubbleTalk = (g, s, x, y, w, h, text, t0) => withPop(g, x + w / 2, y + h / 2, s.t, t0, () => {
    roundRect(g, x, y, w, h, 40, '#fbfaf6'); g.fillStyle = '#fbfaf6'; g.beginPath(); g.moveTo(x + 80, y + h - 4); g.lineTo(x + 40, y + h + 60); g.lineTo(x + 150, y + h - 4); g.fill();
    if (s.t > t0 + 0.15) typeText(g, text, [x + 30, y + 20, w - 60, h - 40], t0 + 0.15, s.t);
  });
  const bars = (g, x, y, w, h) => { rect(g, '#2c2e35', x, y, w, 30); rect(g, '#2c2e35', x, y + h - 30, w, 30); for (let i = 0; i <= 6; i++) rect(g, '#3b3f4a', x + (w * i) / 6 - 14, y, 28, h); };

  /* ─── plates (2160×3840) ─── */
  const paris = (g, t, sky = '#d9e2ea') => { room(g, sky, 2900, '#b9ab94'); cloud(g, 300, 1300, 0.8, t); eiffel(g, 1650, 2300, 1600, '#8a7a68');
    [[60, 1950, 620], [700, 2050, 560]].forEach(([x, y, w]) => { roundRect(g, x, y, w, 2900 - y, 10, '#e6d8bc'); g.fillStyle = '#6d7a86'; g.fillRect(x - 20, y - 120, w + 40, 130); windows(g, x + 40, y + 60, w - 80, 500, 2, 2, '#cddbe4'); }); };
  const plates = {
    MARKET: { paint: (g) => { room(g, '#d8c7a8', 2700, '#9a8468'); roundRect(g, 120, 2350, 1920, 550, 30, P.wood); }, signs: { board: { r: [260, 650, 1500, 760] } } },
    PARIS: { paint: (g, t) => paris(g, t), signs: {} },
    STAGE: { paint: (g) => { room(g, '#2b2238', 3000, '#6a5040'); rect(g, '#7a2e3a', -200, -200, 330, 3400); rect(g, '#7a2e3a', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.55)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 600], pole: 1150 } } },
    CAFE: { paint: (g, t) => { paris(g, t); g.fillStyle = '#b8322e'; for (let i = 0; i < 9; i++) { g.fillRect(i * 260, 2250, 130, 120); } rect(g, '#e9e4da', 0, 2250, 2160, 20); blob(g, 1450, 2950, 240, 50, '#d9d4c7'); roundRect(g, 1430, 2950, 40, 250, 10, '#5d6670'); }, signs: {} },
    SUITE: { paint: (g) => { room(g, '#7a2e3a', 2850, '#d8c6a6'); for (let x = 0; x < PW; x += 240) rect(g, x % 480 ? '#cdb994' : '#e3d3b0', x, 2850, 240, 1000); chandelier(g, 1080, 420, 1.3); roundRect(g, 200, 2450, 1760, 400, 20, P.wood); }, signs: {} },
    WORKSHOP: { paint: (g) => { room(g, '#2f2a38', 2950, '#4a4250'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.25)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); }, signs: {} },
    STATION: { paint: (g, t) => { room(g, '#cfd6dc', 2900, '#8a8d93'); for (let i = 0; i < 5; i++) roundRect(g, i * 480, 600, 60, 2300, 10, '#5d6670'); g.fillStyle = '#4b5563'; g.beginPath(); g.moveTo(-200, 700); g.quadraticCurveTo(1080, 200, 2360, 700); g.lineTo(2360, 780); g.quadraticCurveTo(1080, 280, -200, 780); g.fill(); roundRect(g, 1250, 2200, 900, 600, 40, '#2c4a3e'); windows(g, 1300, 2260, 800, 260, 1, 3, '#f4e2a8'); }, signs: {} },
    PRISON: { paint: (g) => { room(g, '#5d6670', 2850, '#4a4f5a'); for (let r = 0; r < 12; r++) for (let c = 0; c < 6; c++) roundRect(g, c * 380 - (r % 2) * 190, r * 240, 360, 220, 16, r % 2 ? '#6d7680' : '#66707a'); }, signs: {} },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);

  // P1/P2 — hook: "you can't sell what you don't own" → red X
  const hook = (g, s, xOn) => { typeOn(g, 'MARKET', 'board', "CAN'T SELL WHAT\nYOU DON'T OWN", T('you', 1), s.t); if (xOn) redX(g, S('MARKET', 'board').r, T('wrong'), s.t); };
  shot('P1', 0, 'MARKET', full(40), (g, s) => { hook(g, s, false); drawChar(g, CH.you, { x: 1250, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -0.6, arms: [{ to: [950, 2300], hand: 'open' }, null] }); });
  shot('P2', T('wrong'), 'MARKET', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1250, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [880, 2150], hand: 'open' }, { to: [1620, 2150], hand: 'open' }] });
    mark(g, 1250, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: con man, tower, cash pop one per word; SOLD / AGAIN?
  const p3 = (g, s) => {
    const r = [260, 620, 1500, 820]; board(g, r);
    [['hat', T('con')], ['tower', T('eiffel', 1)], ['cash', T('sold')]].forEach(([k, t0], i) => {
      const x = r[0] + 280 + i * 470, y = r[1] + 300;
      withPop(g, x, y, s.t, t0, () => (k === 'hat' ? tophatIcon(g, x, y + 80, 1.1) : k === 'tower' ? eiffel(g, x, y + 180, 360, '#7a6a5a') : cashIcon(g, x, y + 40, 1)));
    });
    typeText(g, 'SOLD... TWICE?', [r[0] + 60, r[1] + 520, r[2] - 120, 240], T('again', 1) - 0.3, s.t);
    lustig(g, s, walkX(400, 1, K, s.lt * 0.6), { pose: 'walk', walkT: s.lt });
  };
  shot('P3', T('in', 1), 'PARIS', full(40), p3);
  shot('P3b', T('then'), 'PARIS', cam(1060, 1250, 1.15, 1.19, 0, 20), p3);

  // P4 — subject under the spotlight
  shot('P4', T('his', 1), 'STAGE', full(30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'VICTOR\nLUSTIG', T('victor') - 0.1, s.t);
    withPop(g, 1000, FEET, s.t, s.t0 + 0.05, () => lustig(g, s, 1000, { k: 1.2, smile: 0.8, arms: [{ to: [700, 1500 + Math.sin(s.t * 6) * 30], hand: 'open' }, null] }), 'squash');
  });

  // P5 — origin: Paris, 1925; the newspaper says the tower is rusting
  const cafe = (g, s, wide = true) => {
    if (wide) { board(g, [280, 1000, 1000, 340]); typeText(g, 'PARIS', [280, 1000, 1000, 340], T('paris') + 0.05, s.t); }
    dateCard(g, '1925', s.t, T('1925', 2));
    newspaper(g, 200, 1550, 820, 1100);
    typeText(g, 'EIFFEL TOWER\nRUSTING', [240, 1590, 740, 400], T('newspaper'), s.t);
    roundRect(g, 900, 2780, 1100, 80, 20, P.wood); if (s.lustigOn !== false) lustig(g, s, 1550, { pose: 'sit', y: 2900, face: -1, look: -0.8, arms: [{ to: [1050, 2300], hand: 'point' }, null] });
  };
  shot('P5', T('paris'), 'CAFE', full(40), cafe);
  shot('P5x', T('lustig', 2), 'CAFE', cam(650, 2100, 1.5, 1.56, 0, 0), (g, s) => cafe(g, { ...s, lustigOn: false }, false)); // newspaper only // close on the newspaper // close on the newspaper
  shot('P5y', T('costs'), 'CAFE', cam(1500, 2500, 1.6, 1.66, 0, 0), (g, s) => cafe(g, s, false)); // close on Lustig // close on Lustig thinking
  shot('P5b', T('he', 2), 'CAFE', cam(1080, 1920, 1.02, 1.06, 0, 10), (g, s) => { cafe(g, s); mark(g, 1550, 2050, '!', s.t, T('idea')); });

  // P6 — three things, each landing on its label
  const kit = (g, s, upTo) => {
    popBoard(g, s, [220, 650, 800, 300], 'FAKE\nLETTERHEAD', T('fake'));
    withPop(g, 600, 1400, s.t, T('fake'), () => letterhead(g, 600, 1400, 1.1), 'squash');
    if (upTo >= 2) { popBoard(g, s, [1060, 650, 800, 300], 'LUXURY\nSUITE', T('luxury')); withPop(g, 1460, 1250, s.t, T('luxury'), () => chandelier(g, 1460, 1250, 1.0)); }
    if (upTo >= 3) bubbleTalk(g, s, 330, 1800, 1300, 300, 'A GOOD STORY', T('good') - 0.1);
    lustig(g, s, 1080, { y: FEET + 50, look: 0, smile: 0.8 });
  };
  shot('P6', T('he', 3), 'SUITE', full(30), (g, s) => kit(g, s, 1));
  shot('P6b', T('luxury'), 'SUITE', cam(1080, 1500, 1.12, 1.16, 0, 20), (g, s) => kit(g, s, 2));
  shot('P6c', T('and', 2), 'SUITE', full(0), (g, s) => kit(g, s, 3));

  // P7 — title
  shot('P7', T('so', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'SO HOW DID HE\nPULL IT OFF?', s.t, s.lt, T('so', 1), { size: 92 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('off') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P8 — the secret meeting at the Hôtel de Crillon
  const meeting = (g, s, secret) => {
    popBoard(g, s, [300, 650, 1500, 400], 'HÔTEL DE\nCRILLON', T('hôtel') - 0.1);
    if (secret) popBoard(g, s, [330, 1150, 1440, 300], 'TOP SECRET', T('secrecy') - 0.2);
    [[CH.poisson, 1350, 0], [CH.dealer2, 1650, 1], [CH.dealer3, 1950, 2]].forEach(([c, x, i]) =>
      drawChar(g, c, { x: x - 150, y: FEET + 60, k: 0.9, face: -1, pose: 'stand', t: s.t, look: -1, nod: secret ? 2 : 1 }));
    lustig(g, s, 520, { look: 1, arms: [null, { to: [900, 2150 + Math.sin(s.t * 5) * 30], hand: secret ? 'point' : 'open' }] });
  };
  shot('P8', T('he', 5), 'SUITE', full(30), (g, s) => meeting(g, s, false));
  shot('P8x', T('secret'), 'SUITE', cam(1500, 2500, 1.5, 1.56, 0, 0), (g, s) => meeting(g, s, false)); // the dealers
  shot('P8b', T('he', 6), 'SUITE', cam(700, 2550, 1.6, 1.66, 0, 0), (g, s) => meeting(g, s, true));
  // P9 — counter: 7,300 tons of iron
  shot('P8c', T('in', 2), 'SUITE', full(10), (g, s) => meeting(g, s, true));
  shot('P9', T('seven'), 'WORKSHOP', full(30), (g, s) => {
    const r = [300, 700, 1400, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('seven'), b = T('iron', 1, 'e');
    const v = Math.round(7300 * Math.pow(clamp((s.t - a) / (b - a)), 1.3) / 10) * 10;
    A.ev('ding', b);
    g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.3}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(v.toLocaleString('en-US') + ' TONS', r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore();
    eiffel(g, 1080, 3300, 1500, '#6a5a4a');
  });

  // P10 — Poisson wants it; the bribe convinces him; he pays
  const deal = (g, s, stage) => {
    if (stage === 0) popBoard(g, s, [300, 650, 1500, 400], 'ANDRÉ POISSON', T('one'));
    if (stage >= 1) popBoard(g, s, [300, 650, 1500, 400], 'A BRIBE?', T('bribe') - 0.1);
    if (stage >= 2) popBoard(g, s, [330, 1150, 1440, 360], 'ONLY A REAL\nOFFICIAL ASKS', T('only'));
    drawChar(g, CH.poisson, { x: 1450, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -1, smile: stage === 0 ? 0.9 : stage >= 3 ? 0.4 : 0,
      arms: stage >= 3 ? [{ to: [1100, 2350], hand: 'open' }, null] : null });
    lustig(g, s, 650, { look: 1, arms: stage >= 1 ? [null, { to: [950, 2300 + Math.sin(s.t * 14) * 15], hand: 'fist' }] : null });
    if (stage >= 3) withPop(g, 1050, 2300, s.t, T('pays'), () => cashIcon(g, 1050, 2300, 0.9), 'squash');
    if (stage === 0) withPop(g, 1450, 1850, s.t, T('badly'), () => mark(g, 1450, 1850, '!', s.t, T('badly')));
  };
  shot('P10', T('one'), 'SUITE', full(30), (g, s) => deal(g, s, 0));
  shot('P10b', T('when'), 'SUITE', cam(1050, 2500, 1.4, 1.46, 0, 0), (g, s) => deal(g, s, 1));
  shot('P10c', T('only'), 'SUITE', full(20), (g, s) => deal(g, s, 2));
  shot('P10d', T('poisson', 3), 'SUITE', cam(1080, 2640, 1.6, 1.66, 0, 0), (g, s) => deal(g, s, 3));

  // P11 — flees to Vienna; Poisson too ashamed to call the police
  shot('P11', T('lustig', 4), 'STATION', full(30), (g, s) => {
    popBoard(g, s, [300, 900, 1500, 420], 'VIENNA', T('vienna') - 0.1);
    const x = walkX(300, 1, K, Math.min(1.6, s.lt));
    lustig(g, s, x, { pose: s.lt < 1.6 ? 'walk' : 'stand', walkT: s.lt, smile: 1, arms: [null, { to: [x + 260, 2950], hand: 'fist' }] });
    suitcase(g, x + 300, FEET);
  });
  shot('P11b', T('poisson', 4), 'SUITE', full(30), (g, s) => {
    popBoard(g, s, [300, 650, 1500, 400], 'TOO ASHAMED', T('ashamed') - 0.1);
    drawChar(g, CH.poisson, { x: 1080, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, eyesClosed: true, tilt: 0.2, nod: 0.3, arms: [{ to: [800, 2350], hand: 'fist' }, { to: [1360, 2350], hand: 'fist' }] });
    bubbleTalk(g, s, 1250, 1400, 620, 240, 'police?', T('police') - 0.1);
  });

  // P12 — twist: he comes back and tries to sell it again
  const again = (g, s) => {
    popBoard(g, s, [300, 650, 1500, 460], 'FOR SALE...\nAGAIN', T('again', 2) - 0.3);
    lustig(g, s, walkX(200, 1, K, Math.min(1.4, (s.t - T('and', 3)))), { pose: (s.t - T('and', 3)) < 1.4 ? 'walk' : 'stand', walkT: (s.t - T('and', 3)), smile: 1, arms: (s.t - T('and', 3)) > 1.4 ? [{ to: [600, 1900], hand: 'open' }, null] : null });
  };
  shot('P12', T('and', 3), 'PARIS', full(30), again);
  shot('P12x', T('lustig', 5), 'PARIS', cam(1080, 1300, 1.15, 1.19, 0, 20), again);
  // P13 — died in prison; death certificate: apprentice salesman
  const prison = (g, s) => {
    lustig(g, s, 1080, { y: FEET, smile: 0, hair: '#d4d1cb', age: 1, hunch: 0.1, mustache: '#d4d1cb', tophat: null });
    bars(g, 300, 1550, 1560, 1800);
    withPop(g, 1080, 1100, s.t, T('certificate') - 0.2, () => { roundRect(g, 330, 620, 1500, 900, 16, '#f2ead6'); rect(g, '#2b2d42', 380, 680, 1400, 8); });
    typeText(g, 'DEATH CERTIFICATE', [380, 720, 1400, 200], T('certificate'), s.t);
    typeText(g, 'JOB: APPRENTICE\nSALESMAN', [380, 980, 1400, 440], T('apprentice') - 0.1, s.t);
  };
  shot('P13', T('he', 7), 'PRISON', full(30), prison);
  shot('P13x', T('his', 2), 'PRISON', cam(1080, 1300, 1.12, 1.16, 0, 20), prison); // the certificate

  // P14 — the question; viewer reacts; sign holds to the end
  const finale = (g, s) => {
    typeOn(g, 'MARKET', 'board', "CAN'T SELL WHAT\nYOU DON'T OWN", T('you', 1), s.t);
    redX(g, S('MARKET', 'board').r, T('wrong'), s.t);
    popBoard(g, s, [260, 1600, 1500, 560], 'WOULD YOU HAVE\nBOUGHT IT?', T('so', 2) + 0.05);
    const up = s.t > T('honest');
    drawChar(g, CH.you, { x: 1300, y: FEET + 150, k: K, face: -1, pose: 'stand', t: s.t, look: up ? 0 : -0.8, smile: up ? 0.3 : 0, arms: up ? [{ to: [1080, 2300], hand: 'open' }, { to: [1650, 2400], hand: 'point' }] : null });
    mark(g, 1650, 2250, '?', s.t, T('bought'));
  };
  shot('P14', T('so', 2), 'MARKET', full(30), finale);
  shot('P14b', T('would', 2), 'MARKET', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('paris'), T('he', 3), T('lustig', 4), T('and', 3), T('so', 2)];
  return { plates, shots, wipes, end: A.duration };
};

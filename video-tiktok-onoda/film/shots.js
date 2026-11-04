/* "The soldier who fought for 29 more years" (Hiroo Onoda) — vertical 9:16 for US TikTok, flat vector, drawn in code.
 * Applies the installed skills: captions-overlay (rail + scarce embeds), motion-doctrine (one transition
 * direction, stillness before the climax, no dead moments).
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
    onoda: { skin: C.skin, top: '#6b7048', bottom: '#5a5e3c', hair: '#1f1b1b', seed: 91 },
    soldier2: { skin: C.skin, top: '#6b7048', bottom: '#5a5e3c', hair: '#2e2420', seed: 92 },
    soldier3: { skin: C.skin, top: '#6b7048', bottom: '#5a5e3c', hair: '#3a2a20', seed: 93 },
    taniguchi: { skin: C.skin, top: '#5d6670', bottom: '#3b3f4a', hair: '#d4d1cb', glasses: true, seed: 94 },
    suzuki: { skin: C.skin, top: '#c96a5a', bottom: P.navy, hair: '#1f1b1b', seed: 95 },
  });
  const CAPG = '#5a6040'; // army cap
  const onoda = (g, s, x, extra = {}) => drawChar(g, CH.onoda, { x, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, cap: CAPG, ...extra });
  const rifle = (g, x, y, rot = -0.5, s = 1) => { g.save(); g.translate(x, y); g.rotate(rot); tube(g, [0, 0], [0, -420 * s], 22 * s, '#3b3f4a'); roundRect(g, -30 * s, -40 * s, 60 * s, 220 * s, 20 * s, P.wood); g.restore(); };
  const leaflet = (g, x, y, rot, s = 1) => { g.save(); g.translate(x, y); g.rotate(rot); roundRect(g, -110 * s, -75 * s, 220 * s, 150 * s, 8 * s, '#fbfaf6'); rect(g, '#cfc7b4', -80 * s, -40 * s, 160 * s, 12 * s); rect(g, '#cfc7b4', -80 * s, 0, 120 * s, 10 * s); g.restore(); };
  const plane = (g, x, y, s = 1) => { roundRect(g, x - 300 * s, y - 50 * s, 600 * s, 100 * s, 50 * s, '#8a9bb5'); g.fillStyle = '#6f8299'; g.beginPath(); g.moveTo(x - 40 * s, y); g.lineTo(x - 150 * s, y + 190 * s); g.lineTo(x + 30 * s, y); g.fill(); g.beginPath(); g.moveTo(x + 230 * s, y - 30 * s); g.lineTo(x + 290 * s, y - 160 * s); g.lineTo(x + 180 * s, y - 30 * s); g.fill(); };
  const palm = (g, x, y, s = 1) => { tube(g, [x, y], [x + 40 * s, y - 900 * s], 50 * s, '#8a6a4c'); [[-1, -0.2], [1, -0.2], [-0.6, -0.7], [0.6, -0.7], [0, -1]].forEach(([dx, dy]) => blob(g, x + 40 * s + dx * 200 * s, y - 900 * s + dy * 110 * s, 220 * s, 55 * s, '#4f7a4a', dx * 0.5)); };
  const fern = (g, x, y, s = 1) => { for (let i = -2; i <= 2; i++) blob(g, x + i * 60 * s, y - 80 * s - Math.abs(i) * -10 * s, 70 * s, 160 * s, i % 2 ? '#3f6a3e' : '#4f7a4a', i * 0.3); };
  const scroll = (g, x, y, s = 1) => { roundRect(g, x - 220 * s, y - 150 * s, 440 * s, 300 * s, 10 * s, '#f2ead6'); rect(g, '#b8322e', x - 30 * s, y + 60 * s, 60 * s, 60 * s); for (let i = 0; i < 4; i++) rect(g, '#cfc7b4', x - 170 * s, y - 100 * s + i * 40 * s, 340 * s, 10 * s); };
  const backpack = (g, x, y, s = 1) => { roundRect(g, x - 90 * s, y - 140 * s, 180 * s, 260 * s, 50 * s, '#4f7c86'); roundRect(g, x - 60 * s, y - 40 * s, 120 * s, 90 * s, 20 * s, '#3f6670'); };
  const hut = (g, x, y, s = 1) => { roundRect(g, x - 200 * s, y - 280 * s, 400 * s, 280 * s, 10 * s, '#a07a58'); g.fillStyle = '#c9b06a'; g.beginPath(); g.moveTo(x - 260 * s, y - 270 * s); g.lineTo(x, y - 480 * s); g.lineTo(x + 260 * s, y - 270 * s); g.fill(); };
  const books = (g, x, y, s = 1) => { const cols = ['#b8322e', P.teal, P.gold, P.violet, P.navy, '#7f9a7e']; for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) roundRect(g, x + i * 90 * s, y + r * 260 * s, 70 * s, 220 * s, 8 * s, cols[(i + r) % cols.length]); };

  /* ─── plates (2160×3840) ─── */
  const jungle = (g, t, dark = 0) => {
    room(g, dark ? '#3f5a48' : '#7fa88a', 2900, '#5d7048');
    palm(g, 200, 2900, 1.2); palm(g, 1950, 2900, 1.1); palm(g, 1500, 2950, 0.9);
    [150, 600, 1100, 1700, 2050].forEach((x, i) => fern(g, x, 2950, 1.3 + (i % 2) * 0.3));
  };
  const plates = {
    HOME: { paint: (g) => { room(g, '#d8c7a8', 2700, '#9a8468'); roundRect(g, 120, 2350, 1920, 550, 30, P.wood); }, signs: {} },
    JUNGLE: { paint: (g, t) => jungle(g, t), signs: {} },
    NIGHT: { paint: (g, t) => jungle(g, t, 1), signs: {} },
    STAGE: { paint: (g) => { room(g, '#2b2238', 3000, '#6a5040'); rect(g, '#3f5a48', -200, -200, 330, 3400); rect(g, '#3f5a48', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.55)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 600], pole: 1150 } } },
    BEACH: { paint: (g, t) => { room(g, '#cfe0ea', 2300, '#5d8fb0'); cloud(g, 300, 400, 1, t); rect(g, '#e9d9a8', -200, 2700, PW + 400, 1200); g.fillStyle = '#5d8a5a'; g.beginPath(); g.ellipse(1080, 2330, 1300, 260, 0, Math.PI, 0); g.fill(); palm(g, 1750, 2750, 1.0); }, signs: {} },
    WORKSHOP: { paint: (g) => { room(g, '#2f2a38', 2950, '#4a4250'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.25)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); }, signs: {} },
    VILLAGE: { paint: (g, t) => { room(g, '#9fb3a6', 2900, '#8a7a5a'); hut(g, 500, 2900, 1.2); hut(g, 1650, 2850, 1.0); palm(g, 1080, 2950, 0.9); }, signs: {} },
    BOOKSHOP: { paint: (g) => { room(g, '#c9b39a', 2800, '#8a6a4c'); books(g, 180, 1500, 1.0); roundRect(g, 200, 2550, 1760, 300, 20, P.wood); }, signs: {} },
    SKY: { paint: (g, t) => { room(g, '#cfe0ea', 3400, '#5d8fb0'); cloud(g, 200, 600, 1.4, t * 3); cloud(g, 1300, 1500, 1.1, t * 3); cloud(g, 600, 2500, 1.3, t * 3); }, signs: {} },
  };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);
  const HB = [260, 650, 1500, 760];
  const hook = (g, s, xOn) => { board(g, HB); typeText(g, 'WAR OVER =\nFIGHTING STOPS', HB, T('you', 1), s.t); if (xOn) redX(g, HB, T('wrong'), s.t); };

  // P1/P2 — hook
  shot('P1', 0, 'HOME', full(40), (g, s) => { hook(g, s, false); drawChar(g, CH.you, { x: 1250, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -0.6, arms: [{ to: [950, 2300], hand: 'point' }, null] }); });
  shot('P2', T('wrong'), 'HOME', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1250, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [880, 2150], hand: 'open' }, { to: [1620, 2150], hand: 'open' }] });
    mark(g, 1250, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: a soldier still creeping through the jungle; 29 YEARS
  const p3 = (g, s) => {
    popBoard(g, s, [330, 650, 1500, 420], '29 YEARS\nAFTER THE WAR', T('twenty-nine') - 0.1);
    const lt3 = s.t - T('one', 1), x = Math.min(1250, walkX(250, 1, K, lt3));
    onoda(g, s, x, { pose: x < 1250 ? 'walk' : 'stand', walkT: lt3, look: 0.6, arms: [{ to: [x + 220, 2400], hand: 'fist' }, null] });
    rifle(g, x + 220, 2450, 0.9, 1.0);
  };
  shot('P3', T('one', 1), 'JUNGLE', full(40), p3);
  shot('P3b', T('after'), 'JUNGLE', cam(1350, 2550, 1.5, 1.56, 0, 0), p3);

  // P4 — subject under a spotlight
  shot('P4', T('his', 1), 'STAGE', full(30), (g, s) => {
    typeText(g, 'HIROO\nONODA', plates.STAGE.signs.name.r, T('hiroo') - 0.1, s.t);
    withPop(g, 1000, FEET, s.t, s.t0 + 0.05, () => { onoda(g, s, 1000, { k: 1.2, smile: 0, arms: [null, { to: [1250, 2400], hand: 'fist' }] }); rifle(g, 1250, 2450, 0.15, 1.2); }, 'squash');
  });

  // P5 — origin: Lubang Island, Dec 1944; ordered never to surrender
  const beach = (g, s, wide) => {
    if (wide) { board(g, [280, 1000, 1200, 400]); typeText(g, 'LUBANG ISLAND\nPHILIPPINES', [280, 1000, 1200, 400], T('lubang'), s.t); dateCard(g, 'DEC\n1944', s.t, T('december')); }
    onoda(g, s, 1250, { y: FEET, look: -0.4 });
    if (s.t > T('ordered')) withPop(g, 700, 2350, s.t, T('ordered'), () => scroll(g, 700, 2350, 0.9), 'squash');
    if (s.t > T('surrender', 1) - 0.1) popBoard(g, s, [430, 1500, 1300, 260], 'NEVER SURRENDER', T('surrender', 1) - 0.1);
  };
  shot('P5', T('lubang'), 'BEACH', full(40), (g, s) => beach(g, s, true));
  shot('P5b', T('onoda', 2), 'BEACH', cam(1000, 2400, 1.35, 1.41, 0, 0), (g, s) => beach(g, s, false));

  // P6 — three things: rifle, uniform, orders (each lands on its label)
  const kit = (g, s, upTo) => {
    popBoard(g, s, [200, 650, 820, 300], 'A RIFLE', T('rifle'));
    withPop(g, 600, 1500, s.t, T('rifle'), () => rifle(g, 600, 1650, -0.3, 1.1), 'squash');
    if (upTo >= 2) { popBoard(g, s, [1140, 650, 820, 300], 'A UNIFORM', T('uniform')); withPop(g, 1550, 1450, s.t, T('uniform'), () => roundRect(g, 1350, 1250, 400, 520, 90, '#6b7048'), 'squash'); }
    if (upTo >= 3) { popBoard(g, s, [430, 1000, 1300, 260], 'HIS ORDERS', T('orders')); withPop(g, 1080, 2000, s.t, T('orders'), () => scroll(g, 1080, 2000, 1.0), 'squash'); }
    onoda(g, s, 1080, { y: FEET + 120, k: 1.0, look: 0 });
  };
  shot('P6', T('in', 1), 'JUNGLE', full(30), (g, s) => kit(g, s, 1));
  shot('P6b', T('a', 3), 'JUNGLE', cam(1080, 1650, 1.08, 1.1, 0, 0), (g, s) => kit(g, s, 2));
  shot('P6c', T('and', 2), 'JUNGLE', full(0), (g, s) => kit(g, s, 3));

  // P7 — title
  shot('P7', T('so', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'HOW DO YOU MISS\nTHE END OF A WAR?', s.t, s.lt, T('so', 1), { size: 84 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('war', 3) + i * 0.12, 140, C.white));
    g.restore();
  });

  // P8 — leaflets: the war is over → he decides they're fake
  const leaflets = (g, s) => {
    const a = T('planes');
    plane(g, lerp(-400, 2600, clamp((s.t - a + 0.4) / 2.5)), 500, 1.2);
    for (let i = 0; i < 9; i++) { const t0 = a + 0.2 + i * 0.15; if (s.t > t0) leaflet(g, 200 + hash(i) * 1760, Math.min(2850, 600 + (s.t - t0) * 900), Math.sin(s.t * 2 + i) * 0.6, 0.9); }
    popBoard(g, s, [330, 1050, 1500, 360], 'THE WAR\nIS OVER', T('leaflets', 1) + 0.1);
    if (s.t > T('fake')) redX(g, [330, 1050, 1500, 360], T('fake'), s.t);
    onoda(g, s, 1080, { look: 0, smile: 0, arms: s.t > T('decides') ? [{ to: [800, 2250], hand: 'open' }, null] : null });
  };
  shot('P8', T('in', 2), 'JUNGLE', full(30), leaflets);
  shot('P8b', T('onoda', 3), 'JUNGLE', cam(1080, 2600, 1.6, 1.66, 0, 0), leaflets);
  // P9 — more leaflets, newspapers, letters: "an enemy trick"
  const letters = (g, s) => {
    const items = [[T('leaflets', 2), 'leaf'], [T('newspapers'), 'news'], [T('letters'), 'letter']];
    items.forEach(([t0, k], i) => withPop(g, 450 + i * 620, 1500, s.t, t0, () => (k === 'leaf' ? leaflet(g, 450 + i * 620, 1500, -0.1, 1.3) : k === 'news' ? (roundRect(g, 450 + i * 620 - 180, 1300, 360, 420, 10, '#efe9dc'), rect(g, '#2b2d42', 450 + i * 620 - 140, 1340, 280, 30)) : (roundRect(g, 450 + i * 620 - 170, 1380, 340, 230, 10, '#e9dcc0'))), 'squash'));
    if (s.t > T('trick')) popBoard(g, s, [430, 650, 1300, 300], 'ENEMY TRICK', T('trick') - 0.15);
    if (!s.noOnoda) onoda(g, s, 1080, { tilt: Math.sin(s.t * 6) * 0.12 * (s.t > T('thinks') ? 1 : 0), smile: 0 });
  };
  shot('P9', T('more'), 'NIGHT', full(30), letters);
  shot('P9x', T('even'), 'NIGHT', cam(1600, 1650, 1.4, 1.46, 0, 0), (g, s) => letters(g, { ...s, noOnoda: true })); // close on the family letters
  shot('P9b', T('he', 2), 'NIGHT', cam(1080, 2650, 1.6, 1.66, 0, 0), (g, s) => { letters(g, s); if (s.t > T('trick') - 0.15) popBoard(g, s, [600, 1980, 960, 230], 'ENEMY TRICK', T('trick') - 0.15); }); // close: he shakes his head
  // P10 — his men surrender or die, one by one; his raids kill villagers (stated soberly)
  shot('P10', T('his', 4), 'JUNGLE', full(30), (g, s) => {
    [[CH.soldier2, 600, T('surrender', 2)], [CH.soldier3, 1550, T('one', 3)]].forEach(([c, x, t0]) => { if (s.t < t0) drawChar(g, c, { x, y: FEET, k: 1.0, face: x < 1080 ? 1 : -1, pose: 'stand', t: s.t, cap: CAPG }); else puff(g, x, 2500, 380, s.t, t0); });
    onoda(g, s, 1080, { smile: 0, look: 0 });
    popBoard(g, s, [430, 650, 1300, 300], 'ONE BY ONE', T('one', 2) - 0.1);
  });
  shot('P10b', T('his', 5), 'VILLAGE', full(30), (g, s) => {
    popBoard(g, s, [330, 650, 1500, 460], 'HIS RAIDS KILLED\nLOCAL VILLAGERS', T('raids') - 0.1);
  });
  // P11 — counter: over 10,000 days; Onoda ages
  shot('P11', T('the', 7), 'WORKSHOP', full(30), (g, s) => {
    const r = [240, 700, 1500, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('climbs'), b = T('days', 1, 'e') + 0.2;
    const p = clamp((s.t - a) / (b - a)), v = Math.round(10600 * Math.pow(p, 1.2) / 10) * 10;
    A.ev('ding', b);
    if (s.t >= a) { g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.28}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(v.toLocaleString('en-US') + ' DAYS', r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore(); }
    onoda(g, s, 1080, { hair: p > 0.6 ? '#8c8a84' : '#1f1b1b', age: p, hunch: 0.1 * p, smile: 0 });
  });

  // P12 — 1974: Norio Suzuki finds him; he won't leave without an order
  const meet = (g, s) => {
    dateCard(g, '1974', s.t, T('1974'));
    const x = s.t < T('finds') ? walkX(-100, 1, K, s.t - T('1974')) : walkX(-100, 1, K, T('finds') - T('1974'));
    drawChar(g, CH.suzuki, { x: Math.min(x, 650), y: FEET, k: K, face: 1, pose: x < 650 && s.t < T('finds') ? 'walk' : 'stand', walkT: s.t, t: s.t, smile: s.t > T('finds') ? 0.8 : 0.3 });
    backpack(g, Math.min(x, 650) - 150, 2650, 1.0);
    onoda(g, s, 1500, { face: -1, hair: '#8c8a84', age: 1, hunch: 0.1, look: -1, smile: 0 });
    if (s.t > T('finds')) mark(g, 650, 1850, '!', s.t, T('finds'));
    if (s.t > T('but')) popBoard(g, s, [330, 650, 1500, 460], 'ONLY WITH AN ORDER\nFROM MY COMMANDER', T('commander', 1) - 0.4);
  };
  shot('P12', T('1974'), 'JUNGLE', full(30), meet);
  shot('P12x', T('goes'), 'JUNGLE', cam(1080, 2400, 1.25, 1.3, 0, 0), meet);
  shot('P12b', T('but'), 'JUNGLE', cam(1300, 2500, 1.45, 1.5, 0, 0), meet);

  // P13 — "And here's the twist." + the dramatic comma (0.7 s of stillness in the voice)
  shot('P13', T('and', 4), 'STAGE', full(30), (g, s) => {
    typeText(g, 'PLOT\nTWIST', plates.STAGE.signs.name.r, T('and', 4) + 0.1, s.t);
  });
  // P14 — his old commander sells books; flies in; reads the order; the war ends
  shot('P14', T('his', 7), 'BOOKSHOP', full(30), (g, s) => {
    popBoard(g, s, [330, 650, 1500, 360], 'NOW: BOOKSELLER', T('sells') - 0.1);
    drawChar(g, CH.taniguchi, { x: 1080, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, smile: 0.4, arms: [{ to: [820, 2350], hand: 'open' }, null] });
  });
  shot('P14b', T('he', 3), 'SKY', full(0), (g, s) => { plane(g, lerp(-500, 2700, clamp((s.t - T('he', 3)) / 1.6)), 1900, 1.8); });
  const order = (g, s) => {
    drawChar(g, CH.taniguchi, { x: 650, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, arms: [{ to: [880, 2300], hand: 'fist' }, { to: [960, 2300], hand: 'fist' }] });
    scroll(g, 920, 2250, 0.8);
    const ends = s.t > T('ends', 2) - 0.1;
    onoda(g, s, 1500, { face: -1, hair: '#8c8a84', age: 1, hunch: ends ? 0 : 0.1, look: -1, smile: 0, arms: ends ? [{ to: [1350, 1700], hand: 'open' }, null] : null });
    if (ends) popBoard(g, s, [330, 650, 1500, 460], 'THE WAR\nIS OVER', T('war', 5) - 0.1);
  };
  shot('P14c', T('reads'), 'JUNGLE', full(30), order);
  shot('P14d', T('and', 5), 'JUNGLE', cam(1300, 2300, 1.3, 1.36, 0, 0), order);

  // P15 — the question; viewer reacts; sign holds to the end
  const finale = (g, s) => {
    hook(g, s, true);
    popBoard(g, s, [260, 1600, 1500, 560], 'WHAT WOULD IT TAKE\nTO CONVINCE YOU?', T('so', 2) + 0.05);
    const up = s.t > T('take');
    drawChar(g, CH.you, { x: 1300, y: FEET + 150, k: K, face: -1, pose: 'stand', t: s.t, look: up ? 0 : -0.8, smile: up ? 0.3 : 0, arms: up ? [{ to: [1080, 2300], hand: 'open' }, { to: [1650, 2400], hand: 'point' }] : null });
    mark(g, 1650, 2250, '?', s.t, T('convince'));
  };
  shot('P15', T('so', 2), 'HOME', full(30), finale);
  shot('P15b', T('take'), 'HOME', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  // one transition vocabulary (motion-doctrine): hard cuts + the same splash wipe at chapter boundaries
  const wipes = [T('lubang'), T('in', 1), T('1974'), T('and', 4), T('so', 2)];
  return { plates, shots, wipes, end: A.duration, captions: true, embeds: [['wrong', 1], ['twenty-nine', 1], ['fake', 1], ['books', 1]] };
};

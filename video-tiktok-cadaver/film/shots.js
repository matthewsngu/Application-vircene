/* "The Cadaver Synod" (Rome, 897) — vertical 9:16 for US TikTok, flat vector, drawn in code.
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
    stephen: { skin: C.skin, top: '#f2f0ea', bottom: '#f2f0ea', hair: '#5a4a3a', seed: 31 },
    corpse: { skin: '#c3c7b0', top: '#8d8f86', bottom: '#8d8f86', hair: '#a9ab9c', seed: 32 },
    deacon: { skin: C.skin, top: '#6b4e3a', bottom: '#6b4e3a', hair: '#2e2420', seed: 33 },
    newpope: { skin: C.skin, top: '#f2f0ea', bottom: '#f2f0ea', hair: '#d4d1cb', seed: 34 },
    digger1: { skin: C.skin, top: '#6d5a48', bottom: '#4b4038', hair: '#3a2a20', seed: 35 },
    digger2: { skin: C.skin, top: '#5a6048', bottom: '#4b4038', hair: '#7a5a40', seed: 36 },
  });
  const ROBED = { top: '#b8322e', bottom: '#f2f0ea' }; // papal robes put on the corpse
  const corpse = (g, s, x, y, k, robed, extra = {}) => drawChar(g, CH.corpse, { x, y, k, face: 1, pose: 'sit', t: s.t, eyesClosed: true, nod: 0.2, tilt: 0.12, ...(robed ? ROBED : {}), ...(robed ? { mitre: '#f2f0ea' } : {}), ...extra });
  const throne = (g, x, y, k = 1) => { roundRect(g, x - 330 * k, y - 1200 * k, 660 * k, 1200 * k, 60 * k, '#7a2e3a'); roundRect(g, x - 260 * k, y - 1120 * k, 520 * k, 760 * k, 40 * k, '#9b3a48'); roundRect(g, x - 380 * k, y - 420 * k, 760 * k, 120 * k, 30 * k, P.gold); };
  const speech = (g, s, x, y, w, h, text, t0) => withPop(g, x + w / 2, y + h / 2, s.t, t0, () => {
    roundRect(g, x, y, w, h, 40, '#fbfaf6'); g.fillStyle = '#fbfaf6'; g.beginPath(); g.moveTo(x + 80, y + h - 4); g.lineTo(x + 40, y + h + 60); g.lineTo(x + 150, y + h - 4); g.fill();
    if (s.t > t0 + 0.15) typeText(g, text, [x + 30, y + 20, w - 60, h - 40], t0 + 0.15, s.t);
  });
  const coffin = (g, x, y, k = 1, open = 0) => { g.fillStyle = '#6b4a32'; g.beginPath(); g.moveTo(x - 140 * k, y - 600 * k); g.lineTo(x + 140 * k, y - 600 * k); g.lineTo(x + 200 * k, y - 380 * k); g.lineTo(x + 120 * k, y); g.lineTo(x - 120 * k, y); g.lineTo(x - 200 * k, y - 380 * k); g.fill(); rect(g, '#8a6448', x - 20 * k, y - 520 * k, 40 * k, 300 * k); rect(g, '#8a6448', x - 90 * k, y - 450 * k, 180 * k, 40 * k); };
  const mitreIcon = (g, x, y, s = 1) => { g.fillStyle = '#f2f0ea'; g.beginPath(); g.moveTo(x - 90 * s, y + 100 * s); g.quadraticCurveTo(x - 110 * s, y - 40 * s, x, y - 140 * s); g.quadraticCurveTo(x + 110 * s, y - 40 * s, x + 90 * s, y + 100 * s); g.fill(); rect(g, P.gold, x - 92 * s, y + 70 * s, 184 * s, 26 * s); rect(g, P.gold, x - 10 * s, y - 120 * s, 20 * s, 200 * s); };
  const gavel = (g, x, y, s = 1) => { g.save(); g.translate(x, y); g.rotate(-0.6); roundRect(g, -150 * s, -55 * s, 300 * s, 110 * s, 30 * s, '#8a5a3a'); tube(g, [0, 40 * s], [0, 260 * s], 34 * s, '#a07a58'); g.restore(); };
  const hand3 = (g, x, y, s = 1) => { // blessing hand: three raised fingers
    blob(g, x, y + 60 * s, 110 * s, 120 * s, C.skin);
    [-60, 0, 60].forEach((dx, i) => tube(g, [x + dx * s, y], [x + dx * s, y - (170 + (i === 1 ? 30 : 0)) * s], 50 * s, C.skin));
    tube(g, [x + 100 * s, y + 70 * s], [x + 150 * s, y + 10 * s], 46 * s, C.skin);
  };
  const stamp = (g, s, x, y, text, t0) => { // big red stamp that slams down (squash), with a hit
    if (s.t < t0) return; A.ev('hit', t0);
    withPop(g, x, y, s.t, t0, () => { g.save(); g.translate(x, y); g.rotate(-0.12); g.strokeStyle = C.red; g.lineWidth = 26; g.strokeRect(-460, -150, 920, 300);
      g.fillStyle = C.red; g.font = '800 200px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 10); g.restore(); }, 'squash');
  };
  const bars = (g, x, y, w, h) => { rect(g, '#2c2e35', x, y, w, 30); rect(g, '#2c2e35', x, y + h - 30, w, 30); for (let i = 0; i <= 6; i++) rect(g, '#3b3f4a', x + (w * i) / 6 - 14, y, 28, h); };
  const candle = (g, x, y, t) => { roundRect(g, x - 30, y - 260, 60, 260, 12, '#f2ead6'); blob(g, x, y - 300 + Math.sin(t * 9 + x) * 6, 26, 44, '#f4c46a'); };

  /* ─── plates (2160×3840) ─── */
  const plates = {
    COURT: { paint: (g) => { room(g, '#8a6a4c', 2700, '#6a5040'); for (let i = 0; i < 9; i++) rect(g, '#7a5c40', i * 260, 0, 16, 2700); roundRect(g, 120, 2400, 900, 500, 30, '#5a4030'); },
      signs: { board: { r: [260, 650, 1500, 760] } } },
    THRONE: { paint: (g, t) => { room(g, '#5a2a3a', 2800, '#b89a6a'); for (let x = 0; x < PW; x += 240) rect(g, x % 480 ? '#a88a5a' : '#c4a676', x, 2800, 240, 1040); [260, 1900].forEach((x) => candle(g, x, 2800, t)); },
      signs: {}, boardR: [260, 650, 1500, 700] }, // boards are drawn per shot: no blank board on the wall
    STAGE: { paint: (g) => { room(g, '#2b2238', 3000, '#6a5040'); rect(g, '#5a2a3a', -200, -200, 330, 3400); rect(g, '#5a2a3a', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.55)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 560], pole: 1180 } } },
    ROME: { paint: (g, t) => { room(g, '#e6d3b3', 2900, '#b9a07a'); cloud(g, 300, 1500, 0.8, t);
        building(g, 60, 1800, 700, 1100, '#d9a07a', 3, 2, P.brick); building(g, 1400, 1700, 760, 1200, '#e0b48a', 3, 2, P.brick);
        for (let i = 0; i < 4; i++) roundRect(g, 820 + i * 150, 1900, 80, 1000, 20, P.cream); rect(g, P.cream, 780, 1840, 640, 80); },
      signs: { sign: { r: [280, 860, 1500, 520], pole: 0 } } },
    GRAVE: { paint: (g, t) => { room(g, '#1f2a44', 2700, '#3b4a3a'); for (let i = 0; i < 24; i++) blob(g, hash(i) * 2160, hash(i * 5) * 1200, 6, 6, '#f4e2a8'); blob(g, 1700, 500, 160, 160, '#efe6c8');
        [[300, 2700], [800, 2650], [1850, 2700]].forEach(([x, y]) => { roundRect(g, x - 130, y - 380, 260, 380, 120, '#8d8f86'); rect(g, '#6d6f66', x - 60, y - 280, 120, 24); });
        g.fillStyle = '#2a2018'; g.beginPath(); g.ellipse(1250, 3000, 520, 140, 0, 0, 7); g.fill(); },
      signs: {} },
    BASILICA: { paint: (g, t) => { room(g, P.sky, 2950, '#b9a07a'); cloud(g, 1300, 280, 0.9, t); roundRect(g, 160, 1300, 1840, 1650, 16, '#e6d8bc');
        g.fillStyle = '#c9b48f'; g.beginPath(); g.moveTo(80, 1310); g.lineTo(1080, 800); g.lineTo(2080, 1310); g.fill(); for (let i = 0; i < 5; i++) roundRect(g, 300 + i * 360, 1800, 120, 1150, 20, P.cream); },
      signs: { sign: { r: [300, 1320, 1500, 320] } } },
    HALL: { paint: (g, t) => { room(g, '#4a3a4e', 2850, '#a89070'); for (let i = 0; i < 3; i++) { roundRect(g, 140 + i * 680, 900, 520, 1950, 260, '#5e4a62'); } [200, 1960].forEach((x) => candle(g, x, 2850, t)); }, signs: {} },
    WORKSHOP: { paint: (g) => { room(g, '#2f2a38', 2950, '#4a4250'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.25)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); }, signs: {} },
    RIVER: { paint: (g, t) => { room(g, '#cfd9e0', 2400, '#b9a07a'); rect(g, '#5d7f99', -200, 2400, PW + 400, 900); for (let i = 0; i < 8; i++) rect(g, '#7f9db3', ((i * 400 + t * 60) % 2600) - 200, 2500 + (i % 3) * 220, 260, 20);
        rect(g, '#b9a07a', -200, 3300, PW + 400, 600); g.fillStyle = '#c9b48f'; g.beginPath(); g.moveTo(-200, 2300); g.quadraticCurveTo(1080, 1800, 2360, 2300); g.lineTo(2360, 2400); g.quadraticCurveTo(1080, 1950, -200, 2400); g.fill(); },
      signs: { sign: { r: [300, 650, 1500, 520], pole: 0 } } },
    PRISON: { paint: (g) => { room(g, '#5d6670', 2850, '#4a4f5a'); for (let r = 0; r < 12; r++) for (let c = 0; c < 6; c++) roundRect(g, c * 380 - (r % 2) * 190, r * 240, 360, 220, 16, r % 2 ? '#6d7680' : '#66707a'); }, signs: { sign: { r: [280, 650, 1500, 520] } } },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);
  const stephen = (g, s, x, extra = {}) => drawChar(g, CH.stephen, { x, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, mitre: '#f2f0ea', ...extra });

  // P1/P2 — hook: "death closes the case" → red X
  const hook = (g, s, xOn) => { typeOn(g, 'COURT', 'board', 'DEATH =\nCASE CLOSED', T('you', 1), s.t); if (xOn) redX(g, S('COURT', 'board').r, T('wrong'), s.t); };
  shot('P1', 0, 'COURT', full(40), (g, s) => { hook(g, s, false); drawChar(g, CH.you, { x: 1300, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -0.6, arms: [{ to: [1000, 2350], hand: 'point' }, null] }); });
  shot('P2', T('wrong'), 'COURT', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1300, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [930, 2150], hand: 'open' }, { to: [1670, 2150], hand: 'open' }] });
    mark(g, 1300, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: mitre, corpse, gavel pop one per word; GUILTY stamp
  const p3 = (g, s) => {
    const r = plates.THRONE.boardR; board(g, r);
    [['mitre', T('pope', 1)], ['coffin', T('corpse', 1)], ['gavel', T('trial', 1)]].forEach(([k, t0], i) => {
      const x = r[0] + 280 + i * 470, y = r[1] + 330;
      withPop(g, x, y, s.t, t0, () => (k === 'mitre' ? mitreIcon(g, x, y, 1.1) : k === 'coffin' ? coffin(g, x, y + 260, 0.55) : gavel(g, x, y, 1)));
    });
    throne(g, 1080, 3000, 0.9); corpse(g, s, 1080, 2900, 0.9, false);
    stamp(g, s, 1080, 2100, 'GUILTY', T('guilty', 1));
  };
  shot('P3', T('in', 1), 'THRONE', full(40), p3);
  shot('P3b', T('corpse', 1), 'THRONE', cam(1080, 2100, 1.12, 1.16, 0, 20), p3);

  // P4 — the subject under a spotlight
  shot('P4', T('this'), 'STAGE', full(30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'THE CADAVER\nSYNOD', T('cadaver') - 0.1, s.t);
    withPop(g, 1080, 3000, s.t, s.t0 + 0.05, () => { throne(g, 1080, 3100, 0.95); corpse(g, s, 1080, 3000, 0.95, true); }, 'squash');
  });

  // P5 — origin: Rome, January 897; Stephen wants revenge
  const p5 = (g, s) => {
    const lt = s.t - T('rome', 1); // continuous across P5/P5x
    typeOn(g, 'ROME', 'sign', 'ROME', T('rome', 1) + 0.05, s.t);
    dateCard(g, 'JAN\n897', s.t, T('897', 2));
    drawChar(g, CH.pass2, { x: walkX(2000, -1, 0.9, lt), y: 3150, k: 0.9, face: -1, pose: 'walk', walkT: lt, t: s.t });
    stephen(g, s, walkX(300, 1, K, Math.min(lt, 2)), { pose: lt < 2 ? 'walk' : 'stand', walkT: lt, arms: s.t > T('revenge') ? [{ to: [600, 1900], hand: 'fist' }, null] : null });
  };
  shot('P5', T('rome', 1), 'ROME', full(40), p5);
  shot('P5x', T('pope', 2), 'ROME', cam(900, 2640, 1.6, 1.66, 0, 0), p5);
  // P5b — dug up from his grave (night), P5c — carried into the Lateran basilica
  shot('P5b', T('so', 1), 'GRAVE', full(30), (g, s) => {
    const up = clamp((s.t - T('dug')) / 0.8);
    coffin(g, 1250, 3050 - up * 380, 1.1);
    if (s.t > T('dug') + 0.2) puff(g, 1250, 3000, 380, s.t, T('dug') + 0.2);
    const dig = Math.sin(s.t * 6) * 80;
    drawChar(g, CH.digger1, { x: 520, y: FEET, k: 1.0, face: 1, pose: 'stand', t: s.t, arms: [{ to: [820, 2500 + dig], hand: 'fist' }, { to: [880, 2650 + dig], hand: 'fist' }] });
    tube(g, [840, 2550 + dig], [1050, 3050 + dig], 26, P.wood);
  });
  shot('P5c', T('carried'), 'BASILICA', full(30), (g, s) => {
    typeOn(g, 'BASILICA', 'sign', 'LATERAN BASILICA', T('lateran') - 0.1, s.t);
    const x = walkX(250, 1, 0.95, s.lt);
    drawChar(g, CH.digger1, { x, y: FEET, k: 0.95, face: 1, pose: 'walk', walkT: s.lt, t: s.t, arms: [{ to: [x + 250, 2450], hand: 'fist' }, null] });
    drawChar(g, CH.digger2, { x: x + 700, y: FEET, k: 0.95, face: 1, pose: 'walk', walkT: s.lt + 0.45, t: s.t, arms: [{ to: [x + 450, 2450], hand: 'fist' }, null] });
    g.save(); g.translate(x + 350, 2500); g.rotate(Math.PI / 2); coffin(g, 0, 300, 0.85); g.restore();
  });

  // P6 — the corpse gets three things (each lands on its label)
  const hall = (g, s, upTo) => {
    const thr = s.t >= T('throne');
    withPop(g, 1080, 3000, s.t, T('throne'), () => throne(g, 1080, 3100, 0.95), 'squash');
    corpse(g, s, thr ? 1080 : 1650, thr ? 3000 : 3250, 0.95, s.t >= T('papal'), thr ? {} : { pose: 'lie', face: 1 });
    if (s.t > T('papal')) puff(g, 1080, 2500, 380, s.t, T('papal'));
    popBoard(g, s, [200, 650, 820, 300], 'PAPAL\nROBES', T('papal'));
    if (upTo >= 2) popBoard(g, s, [1060, 650, 800, 300], 'A THRONE', T('throne'));
    if (upTo >= 3) {
      popBoard(g, s, [330, 1050, 1500, 300], 'A DEACON TO\nSPEAK FOR HIM', T('deacon', 1));
      const dx = walkX(2300, -1, 0.95, Math.max(0, Math.min(1.6, s.t - T('deacon', 1))));
      drawChar(g, CH.deacon, { x: dx, y: FEET + 80, k: 0.95, face: -1, pose: s.t < T('deacon', 1) + 1.6 ? 'walk' : 'stand', walkT: s.t, t: s.t });
    }
  };
  shot('P6', T('the', 4), 'HALL', full(30), (g, s) => hall(g, s, 1));
  shot('P6b', T('a', 4), 'HALL', cam(1080, 1450, 1.12, 1.16, 0, 30), (g, s) => hall(g, s, 2));
  shot('P6c', T('and', 3), 'HALL', full(0), (g, s) => hall(g, s, 3));

  // P7 — title
  shot('P7', T('so', 2), null, null, (g, s) => {
    titleCard(g, 'purple', 'SO HOW DOES\nTHE TRIAL WORK?', s.t, s.lt, T('so', 2), { size: 88 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('work') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P8 — mechanism 1: Stephen screams the charges at the body
  const trial = (g, s) => {
    const r = plates.THRONE.boardR; board(g, r);
    typeText(g, 'CHARGES', [r[0] + 60, r[1] + 40, r[2] - 120, 200], T('charges') - 0.1, s.t);
    typeText(g, 'BISHOP OF ANOTHER\nCITY → POPE', [r[0] + 60, r[1] + 270, r[2] - 120, 380], T('bishop'), s.t);
    throne(g, 1500, 3100, 0.85); corpse(g, s, 1500, 3000, 0.85, true);
    const yell = s.t < T('the', 9) ? 0.6 + 0.4 * Math.abs(Math.sin(s.t * 10)) : 0;
    stephen(g, s, 560, { yawn: yell, look: 1, arms: [null, { to: [1050, 2150 + Math.sin(s.t * 12) * 40], hand: 'point' }] });
  };
  shot('P8', T('stephen', 2), 'THRONE', full(30), trial);
  const crime = (g, s) => { trial(g, s); redX(g, [plates.THRONE.boardR[0] + 60, plates.THRONE.boardR[1] + 270, plates.THRONE.boardR[2] - 120, 380], T('law'), s.t); };
  shot('P8b', T('the', 8), 'THRONE', cam(1080, 1500, 1.12, 1.16, 0, 20), crime);
  shot('P8c', T('bishop'), 'THRONE', cam(1400, 2640, 1.6, 1.66, 0, 0), crime); // close on the accused corpse
  shot('P8x', T('against'), 'THRONE', full(10), crime);
  // P9 — the deacon answers; the dead man says nothing
  const answer = (g, s) => {
    throne(g, 1350, 3100, 0.9); corpse(g, s, 1350, 3000, 0.9, true);
    const shake = Math.sin(s.t * 30) * 6;
    drawChar(g, CH.deacon, { x: 600 + shake, y: FEET + 60, k: 0.95, face: 1, pose: 'stand', t: s.t, look: 0.8, arms: [{ to: [880, 2350], hand: 'open' }, null] });
    speech(g, s, 260, 1500, 900, 260, 'Um... he...', T('answer'));
    speech(g, s, 1100, 1700, 700, 240, '...', T('nothing') - 0.1);
  };
  shot('P9', T('the', 9), 'HALL', full(30), answer);
  shot('P9b', T('the', 10), 'HALL', cam(1300, 2300, 1.3, 1.36, 0, 10), answer);
  // P10 — mechanism 3: the counter rolls to 270 days in the grave; then the verdict
  shot('P10', T('nine'), 'WORKSHOP', full(30), (g, s) => {
    const r = [300, 700, 1400, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('nine'), b = T('seventy', 1, 'e');
    const v = Math.round(270 * Math.pow(clamp((s.t - a) / (b - a)), 1.2));
    A.ev('ding', b);
    g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.34}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(v + ' DAYS', r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore();
    coffin(g, 1080, 3100, 1.2);
  });
  shot('P10b', T('verdict'), 'THRONE', full(20), (g, s) => {
    throne(g, 1080, 3100, 0.95); corpse(g, s, 1080, 3000, 0.95, true);
    stamp(g, s, 1080, 1250, 'GUILTY', T('guilty', 2));
  });

  // P11 — punishment: three blessing fingers, then the Tiber
  const p11 = (g, s) => {
    popBoard(g, s, [330, 700, 1500, 500], '3 FINGERS\nCUT OFF', T('fingers') - 0.1);
    withPop(g, 1080, 2000, s.t, T('three', 2), () => hand3(g, 1080, 2000, 1.6));
    redX(g, [780, 1550, 600, 700], T('blessed'), s.t);
    corpse(g, s, 1600, 3250, 0.8, false, { pose: 'lie' });
  };
  shot('P11', T('they'), 'HALL', full(30), p11);
  shot('P11x', T('rip'), 'HALL', cam(1080, 2640, 1.5, 1.56, 0, 0), p11);
  shot('P11b', T('throw'), 'RIVER', full(30), (g, s) => {
    typeOn(g, 'RIVER', 'sign', 'TIBER RIVER', T('tiber') - 0.15, s.t);
    const p = clamp((s.t - T('throw')) / 0.9);
    if (p < 1) corpse(g, s, lerp(600, 1300, p), lerp(1900, 2650, p) - Math.sin(p * Math.PI) * 300, 0.7, false, { pose: 'lie', tilt: p * 3 });
    if (p >= 1) puff(g, 1300, 2600, 340, s.t, T('throw') + 0.9);
  });
  // P12 — Rome is horrified
  shot('P12', T('rome', 2), 'ROME', full(30), (g, s) => {
    typeOn(g, 'ROME', 'sign', 'ROME', T('rome', 1), s.t);
    const tn = T('horrified');
    [[CH.pass1, 520, 0], [CH.pass2, 1080, 0.08], [CH.pass3, 1640, 0.16]].forEach(([c, x, d]) => {
      const j = Math.max(0, Math.sin(Math.PI * clamp((s.t - tn - d) / 0.45)));
      drawChar(g, c, { x, y: FEET - j * 240, k: 0.95, face: x < 1080 ? 1 : -1, pose: 'stand', t: s.t, arms: [{ to: [x - 240, 2300 - j * 200], hand: 'open' }, { to: [x + 240, 2300 - j * 200], hand: 'open' }] });
      mark(g, x, 1950 - j * 240, '!', s.t, tn + d, 130);
    });
  });

  // P13 — twist: Stephen himself, imprisoned and strangled
  const p13 = (g, s) => {
    typeOn(g, 'PRISON', 'sign', 'PRISON', T('prison') - 0.1, s.t);
    stephen(g, s, 1080, { look: 0, smile: 0, eyesClosed: s.t > T('strangled') + 0.3, tilt: s.t > T('strangled') + 0.3 ? 0.3 : 0 });
    bars(g, 300, 1450, 1560, 1900);
    if (s.t > T('strangled')) popBoard(g, s, [430, 1550, 1300, 300], 'STRANGLED', T('strangled'));
  };
  shot('P13', T('and', 5), 'PRISON', full(30), p13);
  shot('P13x', T('thrown'), 'PRISON', cam(1080, 2000, 1.25, 1.3, 0, 10), p13);
  // P13b — the next popes ban trials of the dead
  shot('P13b', T('and', 7), 'THRONE', full(30), (g, s) => {
    popBoard(g, s, [260, 650, 1500, 700], 'NO TRIALS\nFOR THE DEAD', T('ban') - 0.1);
    drawChar(g, CH.newpope, { x: 1080, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, mitre: '#f2f0ea', look: 0.2, arms: [{ to: [760, 1900], hand: 'open' }, null] });
  });

  // P14 — the question; viewer reacts; sign holds to the end
  const finale = (g, s) => {
    typeOn(g, 'COURT', 'board', 'DEATH =\nCASE CLOSED', T('you', 1), s.t);
    redX(g, S('COURT', 'board').r, T('wrong'), s.t);
    popBoard(g, s, [260, 1600, 1500, 560], 'WHO WAS REALLY\nON TRIAL?', T('so', 3) + 0.05);
    const up = s.t > T('really');
    drawChar(g, CH.you, { x: 1300, y: FEET + 150, k: K, face: -1, pose: 'stand', t: s.t, look: up ? 0 : -0.8, smile: up ? 0.2 : 0, arms: up ? [{ to: [1080, 2300], hand: 'open' }, { to: [1650, 2400], hand: 'point' }] : null });
    mark(g, 1650, 2250, '?', s.t, T('day'));
  };
  shot('P14', T('so', 3), 'COURT', full(30), finale);
  shot('P14b', T('really'), 'COURT', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('rome', 1), T('the', 4), T('they'), T('and', 5), T('so', 3)];
  return { plates, shots, wipes, end: A.duration };
};

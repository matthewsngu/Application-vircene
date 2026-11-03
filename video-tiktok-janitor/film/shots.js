/* "The janitor who left $8 million" — vertical 9:16 for US TikTok, flat vector, drawn in code.
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

  /* ─── plates ─── */
  const plates = {
    OFFICE: { paint: (g) => { room(g, '#c9b8a0', 2700, '#8a6a4c'); roundRect(g, 80, 2450, 900, 450, 30, P.wood); roundRect(g, 1780, 2250, 160, 650, 30, '#7f9a7e'); blob(g, 1860, 2180, 150, 130, '#7f9a7e'); },
      signs: { board: { r: [260, 650, 1500, 760] } } },
    STREET: { paint: (g, t) => { room(g, P.sky, 2900, P.road); cloud(g, 300, 300, 1, t); building(g, -60, 1550, 900, 1350, P.brick, 3, 2); building(g, 1450, 1350, 900, 1550, P.beige, 4, 2); tree(g, 1050, 2900, 1.1); },
      signs: { bill: { r: [300, 620, 1400, 820], pole: 1460 } } },
    CORNER: { paint: (g, t) => { room(g, '#c3d3df', 2900, P.road); cloud(g, 1200, 260, 0.9, t); building(g, 100, 1700, 1960, 1200, P.teal, 3, 4); },
      signs: { sign: { r: [300, 650, 1400, 600], pole: 450 } } },
    STAGE: { paint: (g) => { room(g, P.navy, 3000, '#8a6a4c'); rect(g, '#3a2e4f', -200, -200, 330, 3400); rect(g, '#3a2e4f', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.6)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 600], pole: 1150 } } },
    TOWN: { paint: (g, t) => { room(g, P.sky, 2900, P.road); cloud(g, 200, 1400, 0.8, t); building(g, 60, 1800, 700, 1100, P.beige, 3, 2, P.brick); building(g, 820, 1650, 700, 1250, P.teal, 3, 2); building(g, 1580, 1900, 620, 1000, P.violet, 2, 2, P.navy); door(g, 1040, 2480, 260, 420); },
      signs: { town: { r: [280, 860, 1500, 560], pole: 0 } } },
    STATION: { paint: (g) => { room(g, '#d8d0c0', 2950, '#9a9da3'); roundRect(g, 80, 1500, 2000, 120, 20, P.red); rect(g, '#c4b8a6', 160, 1620, 60, 1330); rect(g, '#c4b8a6', 1940, 1620, 60, 1330); roundRect(g, 1700, 2200, 160, 750, 30, P.red); },
      signs: { sign: { r: [280, 620, 1500, 600] } } },
    STORE: { paint: (g) => { room(g, '#e9e1d2', 2800, '#cfc6b6'); for (let i = 0; i < 2; i++) { roundRect(g, 120 + i * 1020, 1400, 900, 1350, 20, i ? P.beige : P.cream); windows(g, 170 + i * 1020, 1480, 800, 900, 3, 2, i ? P.violet : P.teal); }
        for (let x = 0; x < PW; x += 240) rect(g, x % 480 ? '#c2b9a8' : '#d6cdbd', x, 2800, 240, 1040); },
      signs: { sign: { r: [260, 620, 1600, 600] } } },
    GARAGE: { paint: (g) => { room(g, '#b7aa98', 2900, '#8d8478'); for (let i = 0; i < 5; i++) rect(g, '#a99c8a', i * 520, 0, 20, 2900); roundRect(g, 1150, 1900, 950, 80, 20, P.wood); roundRect(g, 1200, 1980, 60, 920, 10, P.wood); roundRect(g, 2000, 1980, 60, 920, 10, P.wood); }, signs: {} },
    CLASS: { paint: (g) => { room(g, P.blue, 2850, '#8a6a4c'); roundRect(g, 1500, 2550, 600, 300, 20, P.wood); },
      signs: { chalk: { kind: 'chalk', r: [150, 480, 1780, 1720], frame: P.wood } } },
    HILL: { paint: (g, t) => { room(g, '#c3d3df', 3900, '#e9eff3'); cloud(g, 1300, 300, 1, t);
        g.fillStyle = '#eef3f6'; g.beginPath(); g.moveTo(-200, 1450); g.quadraticCurveTo(900, 1900, 2400, 3500); g.lineTo(2400, 4000); g.lineTo(-200, 4000); g.fill();
        g.fillStyle = '#dde6ec'; g.beginPath(); g.moveTo(-200, 1600); g.quadraticCurveTo(900, 2050, 2400, 3650); g.lineTo(2400, 4000); g.lineTo(-200, 4000); g.fill();
        blob(g, 300, 1500, 80, 150, '#7f9a7e'); blob(g, 1100, 1950, 80, 150, '#7f9a7e'); },
      signs: { sign: { r: [260, 520, 1500, 760], pole: 300 } } },
    WORKSHOP: { paint: (g) => { room(g, '#3d4658', 2950, '#4a4f5a'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.3)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); },
      signs: { screen: { kind: 'screen', r: [260, 860, 1550, 760], frame: '#8a7660' } } },
    VAULT: { paint: (g) => { room(g, '#7b8794', 2950, '#5d6670'); for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) roundRect(g, 60 + c * 420, 80 + r * 400, 380, 360, 16, '#a9b3bc'); },
      signs: { screen: { kind: 'screen', r: [260, 860, 1550, 620], frame: '#5d6670' } } },
    LIVING: { paint: (g) => { room(g, '#c9b39a', 2750, '#8a6a4c'); roundRect(g, 160, 2250, 1840, 550, 90, P.teal); },
      signs: { frame: { r: [360, 650, 1400, 620], frame: P.gold } } },
    HOSPITAL: { paint: (g, t) => { room(g, P.sky, 2950, P.road); cloud(g, 300, 250, 0.9, t); building(g, 140, 750, 1880, 2200, '#e9eef2', 5, 4); door(g, 830, 2450, 500, 500, P.teal); rect(g, P.red, 1040, 560, 80, 240); rect(g, P.red, 960, 640, 240, 80); },
      signs: { sign: { r: [300, 900, 1500, 360] } } },
    LIBRARY: { paint: (g, t) => { room(g, P.sky, 2950, P.road); cloud(g, 1500, 250, 0.9, t); roundRect(g, 140, 1250, 1880, 1700, 16, P.beige);
        g.fillStyle = P.brick; g.beginPath(); g.moveTo(60, 1260); g.lineTo(1080, 700); g.lineTo(2100, 1260); g.fill(); for (let i = 0; i < 4; i++) roundRect(g, 330 + i * 450, 1700, 120, 1250, 20, P.cream); },
      signs: { sign: { r: [300, 980, 1500, 300] } } },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const ageAt = (t) => clamp((t - T('his', 3)) / (T('million', 2) - T('his', 3))) * 0.7 + 0.3;

  // P1/P2 — hook, played literally; red X on the belief
  const hook = (g, s, xOn) => {
    typeOn(g, 'OFFICE', 'board', 'BIG SALARY\n= MILLIONAIRE', T('you', 1), s.t);
    if (xOn) redX(g, S('OFFICE', 'board').r, T('wrong'), s.t);
  };
  shot('P1', 0, 'OFFICE', cam(1080, 1920, 1.0, 1.04, 0, 40), (g, s) => {
    hook(g, s, false);
    drawChar(g, CH.you, { x: 1150, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -0.6, arms: [{ to: [850, 2350], hand: 'open' }, { to: [930, 2320], hand: 'open' }] });
    roundRect(g, 760, 2200, 200, 270, 10, P.paper);
    typeText(g, '$40K', [770, 2260, 180, 90], 0.3, s.t, { size: 60 });
  });
  shot('P2', T('wrong'), 'OFFICE', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1150, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [780, 2150], hand: 'open' }, { to: [1520, 2150], hand: 'open' }] });
    mark(g, 1150, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: icons pop one per word
  shot('P3', T('a', 3), 'STREET', cam(1080, 1920, 1.02, 1.06, 0, 40), (g, s) => {
    const b = S('STREET', 'bill').r;
    [['broom', 'janitor'], ['cash', 'eight'], ['bag', 'dollars']].forEach(([k, w], i) => {
      const x = b[0] + b[2] * (0.2 + i * 0.3), y = b[1] + b[3] * 0.32;
      withPop(g, x, y, s.t, w === 'eight' ? T('eight', 1) : w === 'dollars' ? T('dollars', 1) : T(w), () => (k === 'broom' ? broomIcon(g, x, y, 0.85) : k === 'cash' ? cash(g, x, y, 1.0) : bag(g, x, y, 0.75)));
    });
    typeOn(g, 'STREET', 'bill', '$8,000,000', T('million', 1), s.t, { r: [b[0] + 60, b[1] + b[3] * 0.6, b[2] - 120, b[3] * 0.32] });
    drawChar(g, CH.ronald, { x: 900, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, ...ronald(0.85), arms: [{ to: [1150, 2650], hand: 'fist' }, { to: [1180, 2820], hand: 'fist' }] });
    broom(g, [1160, 2650], [1330, FEET]);
  });
  // P4 — "Nobody had a clue": passers-by shrug and move on
  shot('P4', T('nobody'), 'CORNER', cam(1080, 1920, 1.03, 1.07, 0, -30), (g, s) => {
    typeOn(g, 'CORNER', 'sign', 'NOBODY\nKNEW', T('nobody') + 0.05, s.t);
    const sh = Math.sin(clamp((s.t - T('clue')) / 0.5) * Math.PI);
    drawChar(g, CH.pass1, { x: walkX(200, 1, 1.0, s.lt), y: FEET + 60, k: 1.0, face: 1, pose: 'walk', walkT: s.lt, t: s.t });
    drawChar(g, CH.pass2, { x: 1250, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, arms: [{ to: [1000, 2350 - sh * 140], hand: 'open' }, { to: [1500, 2350 - sh * 140], hand: 'open' }] });
  });

  // P5 — the subject under a spotlight
  shot('P5', T('his', 1), 'STAGE', cam(1080, 1920, 1.02, 1.06, 0, 30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'RONALD\nREAD', T('ronald', 1), s.t);
    withPop(g, 1000, FEET, s.t, s.t0 + 0.05, () => drawChar(g, CH.ronald, { x: 1000, y: FEET, k: 1.2, face: 1, pose: 'stand', t: s.t, cap: P.navy, smile: 0.8, ...ronald(0.2),
      arms: [{ to: [650, 1900 + Math.sin(s.lt * 9) * 50], hand: 'open' }, null] }), 'squash');
  });

  // P6 — origin: real place on its own sign, date card, people coming and going
  shot('P6', T('born'), 'TOWN', cam(1080, 1920, 1.02, 1.06, 0, 40), (g, s) => {
    typeOn(g, 'TOWN', 'town', 'BRATTLEBORO\nVERMONT', T('brattleboro'), s.t);
    drawChar(g, CH.pass2, { x: walkX(1170, -1, 0.9, s.lt), y: 3150, k: 0.9, face: -1, pose: 'walk', walkT: s.lt, t: s.t });
    drawChar(g, CH.pass1, { x: walkX(200, 1, 1.0, s.lt), y: 3300, k: 1.0, face: 1, pose: 'walk', walkT: s.lt + 0.3, t: s.t });
    dateCard(g, '1921', s.t, T('1921'));
  });
  // P7 — 25 years at the gas station
  shot('P7', T('he', 1), 'STATION', cam(1080, 1920, 1.02, 1.06, 0, 40), (g, s) => {
    typeOn(g, 'STATION', 'sign', 'GAS STATION\n25 YEARS', T('twenty-five'), s.t);
    car(g, 820, 3200, 0.95, P.violet);
    drawChar(g, CH.ronald, { x: 1550, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, cap: P.navy, ...ronald(0.15),
      arms: [{ to: [1150, 2650], hand: 'fist', scribble: true }, { to: [1200, 2700], hand: 'fist', scribble: true }] });
  });
  // P8 — 17 years cleaning a department store
  shot('P8', T('then'), 'STORE', cam(1080, 1920, 1.02, 1.06, 0, 40), (g, s) => {
    typeOn(g, 'STORE', 'sign', 'DEPARTMENT STORE\n17 YEARS', T('seventeen'), s.t);
    drawChar(g, CH.pass3, { x: walkX(-100, 1, 0.95, s.lt), y: 3150, k: 0.95, face: 1, pose: 'walk', walkT: s.lt, t: s.t });
    const sw = Math.sin(s.t * 3) * 120;
    drawChar(g, CH.ronald, { x: 1050, y: FEET + 50, k: K, face: 1, pose: 'stand', t: s.t, top: '#7d8590', ...ronald(0.4),
      arms: [{ to: [1250 + sw * 0.4, 2700], hand: 'fist' }, { to: [1300 + sw * 0.5, 2900], hand: 'fist' }] });
    broom(g, [1270 + sw * 0.4, 2700], [1450 + sw, FEET + 50], true);
  });

  // P9–P11 — the three things, each landing on its label (labels pop with the object)
  const garage = (g, s, upTo) => {
    popBoard(g, s, [250, 2000, 860, 330], 'USED CAR', T('car'));
    const cy = s.t < T('car') ? -3000 : -900 * (1 - spring(s.t - T('car'), 2.2, 0.45));
    car(g, 1080, 3400 + cy, 0.85, '#9aa7b4');
    if (s.t > T('car') + 0.35) puff(g, 1080, 3400, 300, s.t, T('car') + 0.35);
    if (upTo >= 2) {
      popBoard(g, s, [250, 650, 860, 400], 'OLD COAT\n+ SAFETY PINS', T('coat'));
      withPop(g, 1550, 900, s.t, T('coat'), () => {
        tube(g, [1400, 650], [1700, 650], 18, P.dark); roundRect(g, 1380, 670, 340, 600, 80, '#7b6a58');
        [760, 900, 1040].forEach((y) => { g.strokeStyle = '#c9ced4'; g.lineWidth = 10; g.beginPath(); g.moveTo(1530, y); g.lineTo(1590, y + 20); g.stroke(); blob(g, 1530, y, 12, 12, '#c9ced4'); });
      }, 'squash');
    }
    if (upTo >= 3) {
      popBoard(g, s, [250, 1350, 860, 330], 'SOLID STOCKS', T('stocks', 1));
      if (s.t >= T('stocks', 1)) { A.ev('pop', T('stocks', 1)); certStack(g, 1600, 1900, Math.min(14, Math.floor((s.t - T('stocks', 1)) * 40))); }
    }
  };
  shot('P9', T('his', 2), 'GARAGE', cam(1080, 2650, 1.4, 1.46, 0, 0), (g, s) => {
    popBoard(g, s, [560, 1560, 900, 330], '3 THINGS', T('three'));
    garage(g, s, 1);
    drawChar(g, CH.ronald, { x: 1450, y: FEET + 200, k: 0.95, face: -1, pose: 'stand', t: s.t, look: -1, smile: s.t > T('car') + 0.3 ? 0.5 : 0, ...ronald(0.5),
      arms: s.t < T('car') ? [{ to: [1050, 2300], hand: 'point' }, null] : null });
  });
  shot('P10', T('an'), 'GARAGE', cam(1080, 1300, 1.12, 1.16, 0, 30), (g, s) => garage(g, s, 2));
  shot('P11', T('and', 1), 'GARAGE', cam(1080, 1920, 1.0, 1.03, 0, 0), (g, s) => garage(g, s, 3));

  // P12 — title
  shot('P12', T('so', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'SO HOW DOES\nIT WORK?', s.t, s.lt, T('so', 1), { size: 96 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('work') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P13 — mechanism 1: the dividend loop on a blackboard
  const chalkboard = (g, s) => {
    const r = S('CLASS', 'chalk').r;
    typeOn(g, 'CLASS', 'chalk', 'STOCKS', T('stocks', 2), s.t, { r: [r[0] + 250, r[1] + 100, 1280, 260] });
    typeOn(g, 'CLASS', 'chalk', 'DIVIDENDS', T('dividends'), s.t, { r: [r[0] + 250, r[1] + 600, 1280, 260] });
    const k1 = clamp((s.t - T('paid')) / 0.5), k2 = clamp((s.t - T('reinvested')) / 0.6);
    g.save(); g.strokeStyle = C.chalk; g.lineWidth = 18; g.lineCap = 'round';
    if (k1 > 0) { g.beginPath(); g.moveTo(r[0] + 890, r[1] + 380); g.lineTo(r[0] + 890, r[1] + 380 + 200 * k1); g.stroke(); }
    if (k2 > 0) { // return arrow dividends → stocks, curving round the right side
      const a0 = [r[0] + 1560, r[1] + 730], c = [r[0] + 1760, r[1] + 480], a1 = [r[0] + 1560, r[1] + 230];
      g.beginPath(); g.moveTo(a0[0], a0[1]);
      for (let i = 1; i <= 30 * k2; i++) { const u = i / 30; g.lineTo((1 - u) * (1 - u) * a0[0] + 2 * (1 - u) * u * c[0] + u * u * a1[0], (1 - u) * (1 - u) * a0[1] + 2 * (1 - u) * u * c[1] + u * u * a1[1]); }
      g.stroke();
    }
    g.restore();
    const sp = [r[0] + 100, r[1] + 1100, 700, 240], re = [r[0] + 880, r[1] + 1100, 780, 240];
    typeOn(g, 'CLASS', 'chalk', 'SPEND', T('never', 1) - 0.1, s.t, { r: sp });
    redX(g, sp, T('spent', 2), s.t);
    typeOn(g, 'CLASS', 'chalk', 'REINVEST', T('reinvested'), s.t, { r: re });
    drawChar(g, CH.ronald, { x: 1350, y: FEET + 200, k: 0.95, face: -1, pose: 'stand', t: s.t, ...ronald(ageAt(s.t)), arms: [{ to: [1000, 2150], hand: 'point' }, null] });
  };
  shot('P13', T('his', 3), 'CLASS', cam(1080, 1920, 1.0, 1.04, 0, 40), chalkboard);
  shot('P13b', T('ronald', 2), 'CLASS', cam(1150, 1500, 1.15, 1.19, 0, 30), chalkboard);

  // P14 — mechanism 2: the snowball doubles every ten years
  const hill = (g, s) => {
    const a = T('at', 2), b = T('million', 2);
    const p = clamp((s.t - a) / (b - a)), dbl = Math.min(6, Math.floor(p * 7));
    for (let d = 1; d <= 6; d++) A.ev('ding', a + (d / 7) * (b - a));
    const x = lerp(150, 1750, p), y = 1450 + (x + 200) * 0.6 + 0.00025 * x * x;
    const r = 110 * Math.pow(2, dbl / 2.4) * (1 + 0.12 * ((p * 7) % 1));
    const sr = S('HILL', 'sign').r;
    typeOn(g, 'HILL', 'sign', '×2 EVERY\n10 YEARS', T('doubles'), s.t, { r: [sr[0] + 40, sr[1] + 30, sr[2] - 80, sr[3] * 0.52] });
    typeOn(g, 'HILL', 'sign', '$1 → $64', T('sixty-four'), s.t, { r: [sr[0] + 40, sr[1] + sr[3] * 0.58, sr[2] - 80, sr[3] * 0.36] });
    snowball(g, x, y - r, r, x / Math.max(30, r));
    if (dbl > 0) { g.save(); g.fillStyle = C.ink; g.font = `800 ${Math.max(70, r * 0.5)}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('×' + Math.pow(2, dbl), x, y - r); g.restore(); }
  };
  shot('P14', T('at', 2), 'HILL', cam(1080, 1920, 1.0, 1.04, 0, 60), hill);
  shot('P14b', T('over'), 'HILL', cam(1080, 1700, 1.2, 1.26, 0, 60), hill);

  // P15 — 2008: Lehman collapses, he keeps going; then the counter
  shot('P15', T('even', 1), 'WORKSHOP', cam(1080, 1920, 1.02, 1.06, 0, 30), (g, s) => {
    typeOn(g, 'WORKSHOP', 'screen', 'LEHMAN\nBROTHERS', T('lehman'), s.t);
    redX(g, S('WORKSHOP', 'screen').r, T('collapsed'), s.t);
    dateCard(g, '2008', s.t, T('2008'));
    const sw = Math.sin(s.t * 3) * 100;
    drawChar(g, CH.ronald, { x: 1000, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, top: '#7d8590', ...ronald(ageAt(s.t)),
      arms: [{ to: [1200 + sw * 0.4, 2650], hand: 'fist' }, { to: [1260 + sw * 0.5, 2850], hand: 'fist' }] });
    broom(g, [1220 + sw * 0.4, 2650], [1400 + sw, FEET]);
  });
  shot('P15b', T('the', 1), 'WORKSHOP', cam(1080, 1920, 1.0, 1.04, 0, 30), (g, s) => {
    const r = [200, 700, 1680, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('counter'), b = T('million', 2, 'e');
    const v = Math.round(8000000 * Math.pow(clamp((s.t - a) / (b - a)), 1.6) / 1000) * 1000;
    A.ev('ding', b);
    g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.34}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('$' + v.toLocaleString('en-US'), r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore();
    drawChar(g, CH.ronald, { x: 1080, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, top: '#7d8590', ...ronald(ageAt(s.t)), smile: 0.4 });
  });

  // P16 — June 2014: the safe deposit box, five inches of certificates
  const vault = (g, s) => {
    dateCard(g, 'JUNE\n2014', s.t, T('june'));
    const open = clamp((s.t - T('safe')) / 0.5);
    roundRect(g, 200, 1900, 1000, 650, 20, '#6d7782');
    g.save(); g.translate(200, 1900); g.scale(1 - 0.85 * open, 1); roundRect(g, 0, 0, 1000, 650, 20, '#9aa5b0'); blob(g, 780, 325, 75, 75, '#c9ced4'); g.restore();
    if (open > 0.6) certStack(g, 700, 2520, Math.min(18, Math.floor((s.t - T('safe') - 0.3) * 30)), 700);
    typeOn(g, 'VAULT', 'screen', '5 INCHES OF\nCERTIFICATES', T('five'), s.t);
    drawChar(g, CH.rel2, { x: 1380, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -1, arms: [{ to: [1000, 2350], hand: 'point' }, null] });
  };
  shot('P16', T('june'), 'VAULT', cam(1080, 1920, 1.02, 1.06, 0, 30), vault);
  shot('P16b', T('in', 3), 'VAULT', cam(1000, 1700, 1.25, 1.31, 0, 30), vault);
  // P17 — even his family is stunned
  shot('P17', T('even', 2), 'LIVING', cam(1080, 1920, 1.02, 1.06, 0, 30), (g, s) => {
    typeOn(g, 'LIVING', 'frame', 'RONALD?!', T('even', 2) + 0.1, s.t);
    const tn = T('stunned');
    [[CH.rel1, 520, 0], [CH.rel2, 1080, 0.08], [CH.rel3, 1640, 0.16]].forEach(([c, x, d]) => {
      const j = Math.max(0, Math.sin(Math.PI * clamp((s.t - tn - d) / 0.45)));
      drawChar(g, c, { x, y: FEET - j * 240, k: 0.95, face: x < 1080 ? 1 : -1, pose: 'stand', t: s.t,
        arms: [{ to: [x - 240, 2300 - j * 200], hand: 'open' }, { to: [x + 240, 2300 - j * 200], hand: 'open' }] });
      mark(g, x, 1950 - j * 240, '!', s.t, tn + d, 130);
    });
  });

  // P18 — the twist loops to the hook: no big salary, just time
  const twist = (g, s) => {
    const r = S('OFFICE', 'board').r, top = [r[0] + 60, r[1] + 50, r[2] - 120, r[3] * 0.42];
    typeText(g, 'BIG SALARY?', top, T('and', 2) + 0.1, s.t);
    redX(g, top, T('never', 2), s.t);
    typeText(g, 'TIME', [r[0] + 60, r[1] + r[3] * 0.52, r[2] - 120, r[3] * 0.42], T('time'), s.t);
  };
  shot('P18', T('and', 2), 'OFFICE', cam(1100, 1300, 1.08, 1.12, 0, 20), twist);
  shot('P18b', T('just'), 'STAGE', cam(1080, 1920, 1.02, 1.06, 0, 30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'JUST\nTIME', T('just') + 0.05, s.t);
    withPop(g, 1450, 1750, s.t, T('time'), () => { // wall clock, hands racing: decades passing
      blob(g, 1450, 1750, 260, 260, P.gold); blob(g, 1450, 1750, 215, 215, '#fbfaf6');
      const sp = (s.t - T('time')) * 14;
      g.save(); g.strokeStyle = C.ink; g.lineCap = 'round';
      g.lineWidth = 26; g.beginPath(); g.moveTo(1450, 1750); g.lineTo(1450 + Math.sin(sp / 12) * 120, 1750 - Math.cos(sp / 12) * 120); g.stroke();
      g.lineWidth = 16; g.beginPath(); g.moveTo(1450, 1750); g.lineTo(1450 + Math.sin(sp) * 180, 1750 - Math.cos(sp) * 180); g.stroke();
      g.restore(); blob(g, 1450, 1750, 22, 22, C.ink);
    }, 'squash');
    drawChar(g, CH.ronald, { x: 820, y: FEET, k: 1.15, face: 1, pose: 'stand', t: s.t, smile: 0.8, ...ronald(1), look: 0.6 });
  });
  // P19 — the bequests
  shot('P19', T('and', 3), 'HOSPITAL', cam(1080, 1920, 1.02, 1.06, 0, 30), (g, s) => {
    typeOn(g, 'HOSPITAL', 'sign', 'BRATTLEBORO\nHOSPITAL', T('and', 3) + 0.1, s.t);
    cheque(g, s, 1050, 1800, '$4,800,000', T('hospital'));
    const cl = Math.abs(Math.sin(s.t * 12)) * 60;
    drawChar(g, CH.nurse, { x: 1500, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, smile: 0.8,
      arms: s.t > T('hospital') + 0.3 ? [{ to: [1460, 2350 + cl], hand: 'open' }, { to: [1540, 2350 + cl], hand: 'open' }] : null });
  });
  shot('P19b', T('and', 4), 'LIBRARY', cam(1080, 1920, 1.02, 1.06, 0, 30), (g, s) => {
    typeOn(g, 'LIBRARY', 'sign', 'LIBRARY', T('and', 4) + 0.1, s.t);
    cheque(g, s, 1000, 1820, '$1,200,000', T('library'));
    drawChar(g, CH.reader, { x: 1450, y: FEET + 120, k: K, face: s.t > T('library') + 0.2 ? -1 : 1, pose: 'stand', t: s.t, look: -1 });
    mark(g, 1450, 2150, '!', s.t, T('library') + 0.25);
  });

  // P20 — the question; the viewer from the hook reacts; the sign holds to the end
  const finale = (g, s) => {
    typeOn(g, 'OFFICE', 'board', 'BIG SALARY\n= MILLIONAIRE', T('you', 1), s.t);
    redX(g, S('OFFICE', 'board').r, T('wrong'), s.t);
    popBoard(g, s, [260, 1600, 1500, 560], 'HOW MUCH\nWOULD YOU SAVE?', T('so', 2) + 0.05);
    withPop(g, 500, 3050, s.t, T('aside') - 0.1, () => piggy(g, 500, 3050, 0.75), 'squash');
    const rx = s.t > T('today');
    drawChar(g, CH.you, { x: 1300, y: FEET + 150, k: K, face: -1, pose: 'stand', t: s.t, look: rx ? 0 : -1, smile: rx ? 0.5 : 0,
      arms: rx ? [{ to: [1050, 2350], hand: 'open' }, { to: [1650, 2500], hand: 'point' }] : null });
    mark(g, 1650, 2250, '?', s.t, T('how', 2));
  };
  shot('P20', T('so', 2), 'OFFICE', cam(1080, 1920, 1.02, 1.06, 0, 30), finale);
  shot('P20b', T('how', 2), 'OFFICE', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('born'), T('his', 2), T('june'), T('and', 2), T('so', 2)];
  return { plates, shots, wipes, end: A.duration };
};

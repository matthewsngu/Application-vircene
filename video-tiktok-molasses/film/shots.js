/* "The Great Molasses Flood" (Boston, 1919) — vertical 9:16 for US TikTok, flat vector, drawn in code.
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
    worker: { skin: C.skin, top: '#6d5a48', bottom: '#3b3f4a', hair: '#3a2a20', seed: 41 },
    painter: { skin: C.skin, top: '#e9e4da', bottom: '#5d6670', hair: '#7a5a40', seed: 42 },
    exec: { skin: C.skin, top: P.navy, bottom: P.navy, hair: '#c9c6c0', glasses: true, seed: 43 },
    judge: { skin: C.skin, top: '#1d1d22', bottom: '#1d1d22', hair: '#d4d1cb', glasses: true, seed: 44 },
  });
  const MOL = '#5a3218', MOL2 = '#7a4a24'; // molasses browns
  const molassesWave = (g, x0, top, t, w = 3000) => { // brown wall with a rolling, wavy crest
    g.fillStyle = MOL; g.beginPath(); g.moveTo(x0 - w, PH + 200); g.lineTo(x0 - w, top);
    for (let x = x0 - w; x <= x0; x += 40) g.lineTo(x, top + Math.sin(x * 0.012 + t * 8) * 40 + (x > x0 - 300 ? (x - (x0 - 300)) * 0.5 : 0));
    g.lineTo(x0, PH + 200); g.fill();
    g.fillStyle = MOL2; for (let i = 0; i < 6; i++) blob(g, x0 - 120 - i * 380, top + 90 + Math.sin(t * 6 + i) * 30, 120, 40, MOL2);
  };
  const molassesWaveL = (g, xf, top, t) => {
    g.fillStyle = MOL; g.beginPath(); g.moveTo(PW + 400, PH + 200); g.lineTo(PW + 400, top);
    for (let x = PW + 400; x >= xf; x -= 40) g.lineTo(x, top + Math.sin(x * 0.012 + t * 8) * 40 + (x < xf + 300 ? (xf + 300 - x) * 0.5 : 0));
    g.lineTo(xf, PH + 200); g.fill();
    for (let i = 0; i < 6; i++) blob(g, xf + 120 + i * 380, top + 90 + Math.sin(t * 6 + i) * 30, 120, 40, MOL2);
  };
  const goo = (g, y, t) => { g.fillStyle = MOL; g.beginPath(); g.moveTo(-200, PH + 200); g.lineTo(-200, y); for (let x = -200; x <= PW + 200; x += 60) g.lineTo(x, y + Math.sin(x * 0.01 + t * 2) * 18); g.lineTo(PW + 200, PH + 200); g.fill(); };
  const tank = (g, x, y, w, h, col, t, burst = 0) => { // riveted steel tank
    if (burst <= 0) {
      roundRect(g, x - w / 2, y - h, w, h, 30, col);
      for (let r = 1; r < 6; r++) rect(g, 'rgba(0,0,0,0.12)', x - w / 2, y - h + (h * r) / 6, w, 10);
      g.fillStyle = col; g.beginPath(); g.ellipse(x, y - h, w / 2, 60, 0, Math.PI, 0); g.fill();
      return;
    }
    for (let i = 0; i < 6; i++) { // plates flying apart
      const a = (i / 6) * Math.PI * 2 + 0.3, d = burst * 900;
      g.save(); g.translate(x + Math.cos(a) * d, y - h / 2 + Math.sin(a) * d * 0.6); g.rotate(a + burst * 3); roundRect(g, -w / 6, -h / 4, w / 3, h / 2, 10, col); g.restore();
    }
  };
  const drip = (g, x, y, t, i) => { const yy = y + ((t * 220 + i * 90) % 300); blob(g, x, yy, 18, 28, MOL); };
  const clock = (g, x, y, r) => { blob(g, x, y, r, r, P.gold); blob(g, x, y, r * 0.82, r * 0.82, '#fbfaf6'); g.save(); g.strokeStyle = C.ink; g.lineCap = 'round'; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - r * 0.6); g.moveTo(x, y); g.lineTo(x + r * 0.3, y + r * 0.35); g.stroke(); g.restore(); };
  const barrel = (g, x, y, s = 1) => { roundRect(g, x - 100 * s, y - 130 * s, 200 * s, 260 * s, 50 * s, '#8a5a3a'); rect(g, '#5a3a2a', x - 100 * s, y - 70 * s, 200 * s, 20 * s); rect(g, '#5a3a2a', x - 100 * s, y + 50 * s, 200 * s, 20 * s); blob(g, x, y - 140 * s, 60 * s, 18 * s, MOL); };
  const waveIcon = (g, x, y, s = 1) => { g.fillStyle = MOL; g.beginPath(); g.moveTo(x - 140 * s, y + 90 * s); g.quadraticCurveTo(x - 140 * s, y - 120 * s, x + 40 * s, y - 110 * s); g.quadraticCurveTo(x - 40 * s, y - 40 * s, x + 30 * s, y + 10 * s); g.quadraticCurveTo(x + 100 * s, y + 40 * s, x + 140 * s, y + 90 * s); g.fill(); };
  const syrupBottle = (g, x, y, s = 1) => { roundRect(g, x - 60 * s, y - 200 * s, 120 * s, 220 * s, 40 * s, '#b06a2a'); roundRect(g, x - 25 * s, y - 260 * s, 50 * s, 70 * s, 14 * s, '#e9e4da'); };
  const elevated = (g, x0, bend, t) => { // elevated railway girder on posts; bends when hit
    for (let i = 0; i < 5; i++) roundRect(g, x0 + i * 480, 1500, 60, 1450, 10, '#4b5563');
    g.save(); g.translate(x0 + 1000, 1480); g.rotate(bend * 0.25); rect(g, '#5d6670', -1100, -60, 2200, 120); for (let i = -10; i <= 10; i++) rect(g, '#4b5563', i * 100, -60, 14, 120); g.restore();
  };

  /* ─── plates (2160×3840) ─── */
  const brick = (g, x, y, w, h, col) => { roundRect(g, x, y, w, h, 10, col); windows(g, x + w * 0.08, y + h * 0.08, w * 0.84, h * 0.6, 3, 2, '#e8dcc8'); };
  const plates = {
    KITCHEN: { paint: (g) => { room(g, '#e8d9c0', 2700, '#a58a6a'); roundRect(g, 100, 2300, 1960, 600, 30, '#c9b08a'); roundRect(g, 1600, 1300, 400, 600, 20, '#a9c3d9'); }, signs: { board: { r: [260, 650, 1500, 760] } } },
    STREET: { paint: (g, t) => { room(g, '#d6dde3', 2900, P.road); cloud(g, 300, 300, 1, t); brick(g, -60, 1500, 900, 1400, P.brick); brick(g, 1400, 1350, 900, 1550, '#a86a52'); },
      signs: { bill: { r: [300, 620, 1400, 820], pole: 1460 } } },
    STAGE: { paint: (g) => { room(g, '#2b2238', 3000, '#6a5040'); rect(g, '#5a3218', -200, -200, 330, 3400); rect(g, '#5a3218', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.55)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 600], pole: 1150 } } },
    HARBOR: { paint: (g, t) => { room(g, '#d6dde3', 2900, P.road); cloud(g, 300, 1500, 0.8, t); rect(g, '#5d7f99', -200, 2500, 900, 400); brick(g, 60, 1900, 560, 600, P.brick); }, signs: {} },
    CITY: { paint: (g, t) => { room(g, '#d6dde3', 2950, P.road); brick(g, -60, 1300, 800, 1650, P.brick); brick(g, 760, 1500, 700, 1450, '#a86a52'); brick(g, 1460, 1250, 800, 1700, P.brick); }, signs: {} },
    WORKSHOP: { paint: (g) => { room(g, '#2f2a38', 2950, '#4a4250'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.25)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); }, signs: {} },
    BROWNHARBOR: { paint: (g, t) => { room(g, '#cfd6dc', 2300, '#b9a07a'); g.fillStyle = MOL2; g.fillRect(-200, 2300, PW + 400, 1700); for (let i = 0; i < 8; i++) rect(g, MOL, ((i * 400 + t * 50) % 2600) - 200, 2400 + (i % 3) * 300, 300, 22); roundRect(g, 1300, 1900, 700, 420, 30, '#5d6670'); }, signs: { sign: { r: [280, 650, 1500, 480], pole: 0 } } },
    OFFICE: { paint: (g) => { room(g, '#c9b8a0', 2700, '#8a6a4c'); roundRect(g, 80, 2450, 900, 450, 30, P.wood); }, signs: { board: { r: [260, 650, 1500, 760] } } },
    COURT: { paint: (g) => { room(g, '#8a6a4c', 2850, '#6a5040'); for (let i = 0; i < 9; i++) rect(g, '#7a5c40', i * 260, 0, 16, 2850); }, signs: { board: { r: [280, 650, 1500, 640] } } },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);

  // P1/P2 — hook: "syrup is harmless" → red X
  const hook = (g, s, xOn) => { typeOn(g, 'KITCHEN', 'board', 'SYRUP =\nHARMLESS', T('you', 1), s.t); if (xOn) redX(g, S('KITCHEN', 'board').r, T('wrong'), s.t); };
  shot('P1', 0, 'KITCHEN', full(40), (g, s) => { hook(g, s, false); drawChar(g, CH.you, { x: 1250, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, smile: 0.6, arms: [{ to: [930, 2250], hand: 'fist' }, null] }); syrupBottle(g, 900, 2350, 1.1); });
  shot('P2', T('wrong'), 'KITCHEN', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1250, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [880, 2150], hand: 'open' }, { to: [1620, 2150], hand: 'open' }] });
    mark(g, 1250, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: wave, molasses, Boston pop one per word; "21 DEAD"
  const p3 = (g, s) => {
    const b = S('STREET', 'bill').r;
    [['wave', T('wave', 1)], ['barrel', T('molasses', 1)], ['clock', T('boston')]].forEach(([k, t0], i) => {
      const x = b[0] + 260 + i * 440, y = b[1] + 260;
      withPop(g, x, y, s.t, t0, () => (k === 'wave' ? waveIcon(g, x, y, 1.1) : k === 'barrel' ? barrel(g, x, y, 0.85) : clock(g, x, y, 120)));
    });
    typeOn(g, 'STREET', 'bill', '21 DEAD', T('killed'), s.t, { r: [b[0] + 60, b[1] + b[3] * 0.6, b[2] - 120, b[3] * 0.32] });
    const wp = clamp((s.t - T('swept')) / 1.6);
    if (wp > 0) molassesWave(g, lerp(-200, 2600, wp), 2500, s.t);
    drawChar(g, CH.pass1, { x: walkX(500, 1, K, s.lt * 1.4), y: FEET, k: K, face: 1, pose: 'walk', walkT: s.lt * 1.4, t: s.t, look: -1 });
  };
  shot('P3', T('in', 1), 'STREET', full(40), p3);
  shot('P3b', T('and', 1), 'STREET', cam(1100, 1300, 1.15, 1.19, 0, 20), p3);

  // P4 — subject under a spotlight
  shot('P4', T('this'), 'STAGE', full(30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'THE GREAT\nMOLASSES FLOOD', T('great') - 0.1, s.t);
    withPop(g, 1080, 3100, s.t, s.t0 + 0.05, () => tank(g, 1080, 3100, 700, 1200, '#8d939b', s.t), 'squash');
  });

  // P5 — origin: Boston's North End, January 1919; the tank by the harbor; people walking past
  const harbor = (g, s) => {
    board(g, [280, 860, 1500, 480]); typeText(g, "NORTH END\nBOSTON", [280, 860, 1500, 480], T("boston's") + 0.05, s.t);
    tank(g, 1450, 2900, 1100, 1700, '#8d939b', s.t);
    dateCard(g, 'JAN\n1919', s.t, T('january', 1));
    const lt = s.t - T("boston's");
    drawChar(g, CH.pass2, { x: walkX(200, 1, 0.95, lt), y: 3250, k: 0.95, face: 1, pose: 'walk', walkT: lt, t: s.t });
    drawChar(g, CH.worker, { x: walkX(2100, -1, 1.0, lt), y: 3350, k: 1.0, face: -1, pose: 'walk', walkT: lt + 0.4, t: s.t, cap: '#3b3f4a' });
  };
  shot('P5', T("boston's"), 'HARBOR', full(40), harbor);
  const tall = (g, s) => { harbor(g, s); popBoard(g, s, [650, 1760, 850, 280], '50 FT TALL', T('fifty', 1)); };
  shot('P5b', T('next'), 'HARBOR', cam(1200, 2640, 1.6, 1.66, 0, 0), tall);
  shot('P5c', T('full'), 'HARBOR', full(20), (g, s) => { tall(g, s); popBoard(g, s, [700, 2100, 850, 260], 'FOR ALCOHOL', T('alcohol') - 0.1); });
  shot('P5d', T('people', 2), 'HARBOR', cam(1080, 2640, 1.6, 1.66, 0, 0), (g, s) => { tall(g, s); popBoard(g, s, [700, 2100, 850, 260], 'FOR ALCOHOL', T('alcohol') - 0.1); });

  // P6 — the tank's three problems (each lands on its label); then it's painted brown
  const problems = (g, s, upTo) => {
    const brown = clamp((s.t - T('painted')) / 1.0);
    const hx = (v) => Math.round(v).toString(16).padStart(2, '0');
    const col = '#' + hx(lerp(141, 110, brown)) + hx(lerp(147, 74, brown)) + hx(lerp(155, 40, brown));
    tank(g, 1300, 3000, 1000, 1500, col, s.t);
    popBoard(g, s, [200, 650, 820, 300], 'THIN\nWALLS', T('walls'));
    if (upTo >= 2) { popBoard(g, s, [1060, 650, 820, 300], 'LEAKY\nSEAMS', T('seams')); if (brown < 0.8) for (let i = 0; i < 4; i++) drip(g, 900 + i * 250, 1750, s.t, i); }
    if (upTo >= 3) popBoard(g, s, [430, 1050, 1300, 300], 'NEVER TESTED', T('tested'));
  };
  shot('P6', T('the', 3), 'HARBOR', full(30), (g, s) => problems(g, s, 1));
  shot('P6b', T('seams'), 'HARBOR', cam(1250, 1650, 1.15, 1.19, 0, 20), (g, s) => problems(g, s, 2));
  shot('P6c', T('and', 2), 'HARBOR', full(0), (g, s) => problems(g, s, 3));
  shot('P6d', T('the', 4), 'HARBOR', cam(1150, 2700, 1.5, 1.56, 0, 0), (g, s) => {
    problems(g, s, 3);
    const sw = Math.sin(s.t * 6) * 120;
    drawChar(g, CH.painter, { x: 600, y: FEET + 100, k: 1.0, face: 1, pose: 'stand', t: s.t, cap: '#e9e4da', arms: [{ to: [880, 2300 + sw], hand: 'fist' }, null] });
    roundRect(g, 860, 2240 + sw, 60, 160, 16, '#6e4a28');
    popBoard(g, s, [560, 1720, 1100, 280], 'TO HIDE LEAKS', T('hide'));
  });

  // P7 — title
  shot('P7', T('so', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'SO HOW DOES\nSYRUP KILL?', s.t, s.lt, T('so', 1), { size: 96 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('kill', 2) + i * 0.12, 140, C.white));
    g.restore();
  });

  // P8 — mechanism 1: at lunchtime the tank bursts
  shot('P8', T('at', 1), 'HARBOR', full(30), (g, s) => {
    withPop(g, 600, 1700, s.t, T('lunchtime') - 0.1, () => clock(g, 600, 1700, 200));
    const b = clamp((s.t - T('bursts')) / 0.6);
    tank(g, 1450, 2900, 1100, 1700, '#6e4a28', s.t, b);
    if (b > 0) { // molasses gushes out of the tank's base and spreads (no instant flat layer)
      const e = 1 - Math.pow(1 - b, 3);
      g.fillStyle = MOL; g.beginPath(); g.ellipse(1450, 2950, 250 + 2200 * e, 90 + 520 * e, 0, Math.PI, 0); g.fill();
      g.fillRect(1450 - 250 - 2200 * e, 2950, 2 * (250 + 2200 * e), PH);
      puff(g, 1450, 2200, 600, s.t, T('bursts'));
    }
  });
  // P9 — mechanism 2: heavier than water, the wave hits at 35 mph, 25 ft high; then the elevated railway bends
  const street = (g, s) => {
    popBoard(g, s, [200, 650, 820, 300], '35 MPH', T('thirty-five') - 0.1);
    popBoard(g, s, [1060, 650, 820, 300], '25 FT HIGH', T('twenty-five') - 0.1);
    const wp = clamp((s.t - T('wave', 2)) / 2.2);
    const bend = clamp((s.t - T('bends')) / 0.5);
    elevated(g, 100, bend, s.t);
    const x1 = walkX(1300, -1, K, Math.min(1.8, s.t - T('molasses', 4))), x2 = walkX(1800, -1, 1.0, Math.min(1.8, s.t - T('molasses', 4)));
    drawChar(g, CH.pass3, { x: x1, y: FEET, k: K, face: -1, pose: 'walk', walkT: s.t * 1.6, t: s.t, look: 1 });
    drawChar(g, CH.worker, { x: x2, y: FEET + 80, k: 1.0, face: -1, pose: 'walk', walkT: s.t * 1.6 + 0.3, t: s.t, cap: '#3b3f4a', look: 1 });
    molassesWaveL(g, lerp(2400, -300, wp), lerp(2600, 1700, wp), s.t);
  };
  const streetBoards = (g) => { board(g, [200, 650, 820, 300]); board(g, [1060, 650, 820, 300]); };
  shot('P9', T('molasses', 4), 'CITY', full(30), (g, s) => street(g, s));
  shot('P9x', T('so', 2), 'CITY', cam(1300, 2500, 1.35, 1.41, 0, 0), (g, s) => street(g, s));
  shot('P9y', T('up'), 'CITY', full(10), (g, s) => street(g, s)); // wide: how high the wave is
  shot('P9b', T('it', 4), 'CITY', cam(1080, 1800, 1.15, 1.19, 0, 20), (g, s) => street(g, s));
  // P10 — the counter climbs: 2,300,000 gallons
  shot('P10', T('the', 9), 'WORKSHOP', full(30), (g, s) => {
    const r = [240, 700, 1500, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('climbs'), b = T('gallons', 1, 'e');
    const v = Math.round(2300000 * Math.pow(clamp((s.t - a) / (b - a)), 1.4) / 1000) * 1000;
    A.ev('ding', b);
    g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.22}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(v.toLocaleString('en-US'), r[0] + r[2] / 2, r[1] + r[3] * 0.38); g.fillText('GALLONS', r[0] + r[2] / 2, r[1] + r[3] * 0.72); g.restore();
    barrel(g, 700, 3000, 1.6); barrel(g, 1080, 3000, 1.6); barrel(g, 1460, 3000, 1.6);
  });
  // P10b — the cold air thickens it: people stuck like flies in honey
  const stuck = (g, s) => {
    popBoard(g, s, [330, 650, 1500, 560], 'COLD AIR =\nTHICKER', T('cold') - 0.1);
    [[CH.pass1, 560, 0], [CH.pass2, 1080, 1], [CH.worker, 1600, 2]].forEach(([c, x, i]) => {
      const wig = Math.sin(s.t * 5 + i) * 120;
      drawChar(g, c, { x, y: FEET, k: 1.0, face: i === 1 ? 1 : -1, pose: 'stand', t: s.t, arms: [{ to: [x - 260, 2000 + wig], hand: 'open' }, { to: [x + 260, 2000 - wig], hand: 'open' }] });
    });
    goo(g, 2650, s.t);
  };
  shot('P10b', T('then'), 'CITY', full(30), stuck);
  shot('P10c', T('people', 3), 'CITY', cam(1080, 2640, 1.5, 1.56, 0, 0), stuck);

  // P11 — the toll; P11b — the harbor stays brown
  shot('P11', T('twenty-one', 2), 'OFFICE', full(30), (g, s) => {
    typeOn(g, 'OFFICE', 'board', '21 DEAD\n150 HURT', T('twenty-one', 2) + 0.05, s.t);
    [520, 1080, 1640].forEach((x, i) => drawChar(g, [CH.pass1, CH.pass2, CH.pass3][i], { x, y: FEET, k: 0.95, face: 1, pose: 'stand', t: s.t, nod: 0.4, tilt: 0.12, eyesClosed: (s.t + i) % 3 < 1.2 }));
  });
  shot('P11b', T('the', 11), 'BROWNHARBOR', full(30), (g, s) => {
    typeOn(g, 'BROWNHARBOR', 'sign', 'BROWN FOR\nMONTHS', T('brown', 2) - 0.1, s.t);
    drawChar(g, CH.worker, { x: 700, y: 2300, k: 0.85, face: 1, pose: 'stand', t: s.t, cap: '#3b3f4a', look: 1, arms: [{ to: [1000, 1900], hand: 'point' }, null] });
  });

  // P12 — twist: the company blamed anarchists; a court said the tank was unsafe
  shot('P12', T('and', 4), 'OFFICE', full(30), (g, s) => {
    typeOn(g, 'OFFICE', 'board', 'BLAME:\nANARCHISTS', T('blamed') - 0.1, s.t);
    drawChar(g, CH.exec, { x: 1250, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, arms: [{ to: [900, 1700], hand: 'point' }, null] });
  });
  shot('P12b', T('six'), 'COURT', full(30), (g, s) => {
    typeOn(g, 'COURT', 'board', 'THE TANK WAS\nUNSAFE', T('ruled'), s.t);
    popBoard(g, s, [500, 1550, 1150, 300], 'ANARCHISTS', T('six'));
    redX(g, [500, 1550, 1150, 300], T('unsafe'), s.t); // the anarchist story, struck out (drawn on top)
    drawChar(g, CH.judge, { x: 1080, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, look: 0.3 });
  });

  // P13 — the question; viewer reacts; sign holds to the end
  const finale = (g, s) => {
    typeOn(g, 'KITCHEN', 'board', 'SYRUP =\nHARMLESS', T('you', 1), s.t);
    redX(g, S('KITCHEN', 'board').r, T('wrong'), s.t);
    popBoard(g, s, [260, 1600, 1500, 560], 'WHAT TANK IS\nNEAR YOU?', T('so', 3) + 0.05);
    const look = s.t > T('standing') ? Math.sin(s.t * 3) : -0.5;
    drawChar(g, CH.you, { x: 1300, y: FEET + 150, k: K, face: -1, pose: 'stand', t: s.t, look, arms: s.t > T('near') ? [{ to: [1080, 2300], hand: 'open' }, { to: [1650, 2400], hand: 'point' }] : null });
    syrupBottle(g, 800, 2900, 1.0);
    mark(g, 1650, 2250, '?', s.t, T('now'));
  };
  shot('P13', T('so', 3), 'KITCHEN', full(30), finale);
  shot('P13b', T('near'), 'KITCHEN', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T("boston's"), T('the', 3), T('twenty-one', 2), T('and', 4), T('so', 3)];
  return { plates, shots, wipes, end: A.duration };
};

/* "Frank Abagnale: the impostor's impostor" — vertical 9:16 for US TikTok, flat vector, drawn in code.
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
    frank: { skin: C.skin, top: '#5d7387', bottom: P.navy, hair: '#3a2a20', seed: 71 },
    researcher: { skin: C.skin, top: P.violet, bottom: P.navy, hair: '#6a4630', hairStyle: 'tail', glasses: true, seed: 72 },
    guard: { skin: C.skin, top: P.navy, bottom: P.navy, hair: '#1f1b1b', seed: 73 },
  });
  // Frank's three roles, as outfit overrides
  const ROLE = {
    pilot: { top: '#2c3e5c', bottom: '#2c3e5c', cap: '#2c3e5c' },
    doctor: { top: '#f4f1ea', bottom: '#5d6670' },
    lawyer: { top: '#26262c', bottom: '#26262c' },
    prisoner: { top: '#e08a3a', bottom: '#e08a3a' },
  };
  const frank = (g, s, x, role, extra = {}) => drawChar(g, CH.frank, { x, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, smile: 0.7, ...(ROLE[role] || {}), ...extra });
  const pilotCap = (g, x, y, s = 1) => { blob(g, x, y, 150 * s, 70 * s, '#2c3e5c'); rect(g, '#1d2a40', x - 160 * s, y + 30 * s, 320 * s, 30 * s); blob(g, x, y - 10 * s, 28 * s, 28 * s, P.gold); };
  const stetho = (g, x, y, s = 1) => { g.save(); g.strokeStyle = '#3b3f4a'; g.lineWidth = 18 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 80 * s, y - 120 * s); g.quadraticCurveTo(x - 90 * s, y + 80 * s, x, y + 90 * s); g.quadraticCurveTo(x + 90 * s, y + 80 * s, x + 80 * s, y - 120 * s); g.stroke(); g.restore(); blob(g, x, y + 140 * s, 50 * s, 50 * s, '#9aa3ad'); };
  const gavel = (g, x, y, s = 1) => { g.save(); g.translate(x, y); g.rotate(-0.6); roundRect(g, -150 * s, -55 * s, 300 * s, 110 * s, 30 * s, '#8a5a3a'); tube(g, [0, 40 * s], [0, 260 * s], 34 * s, '#a07a58'); g.restore(); };
  const cheque2 = (g, x, y, s = 1, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); roundRect(g, -200 * s, -90 * s, 400 * s, 180 * s, 12 * s, '#e3ecd9'); rect(g, '#9ab08a', -170 * s, -50 * s, 220 * s, 14 * s); rect(g, '#9ab08a', -170 * s, 0, 340 * s, 10 * s); rect(g, '#9ab08a', 60 * s, 40 * s, 110 * s, 10 * s); g.restore(); };
  const plane = (g, x, y, s = 1) => { roundRect(g, x - 420 * s, y - 70 * s, 840 * s, 140 * s, 70 * s, '#e9eef2'); g.fillStyle = '#c9d2da'; g.beginPath(); g.moveTo(x - 60 * s, y); g.lineTo(x - 200 * s, y + 260 * s); g.lineTo(x + 40 * s, y); g.fill(); g.beginPath(); g.moveTo(x - 320 * s, y - 40 * s); g.lineTo(x - 400 * s, y - 220 * s); g.lineTo(x - 260 * s, y - 40 * s); g.fill(); for (let i = 0; i < 6; i++) blob(g, x - 160 * s + i * 80 * s, y - 10 * s, 20 * s, 20 * s, '#7fa3c9'); };
  const book = (g, x, y, s = 1) => { roundRect(g, x - 170 * s, y - 230 * s, 340 * s, 460 * s, 16 * s, '#b8322e'); rect(g, '#8a2a2a', x - 170 * s, y - 230 * s, 40 * s, 460 * s); };
  const clapper = (g, x, y, s = 1) => { roundRect(g, x - 200 * s, y - 60 * s, 400 * s, 240 * s, 14 * s, '#26262c'); g.save(); g.translate(x - 200 * s, y - 70 * s); g.rotate(-0.25); rect(g, '#26262c', 0, -50 * s, 400 * s, 50 * s); for (let i = 0; i < 4; i++) rect(g, '#f2f0ea', 30 * s + i * 100 * s, -50 * s, 40 * s, 50 * s); g.restore(); };
  const records = (g, x, y, w, h) => { for (let i = 0; i < 3; i++) roundRect(g, x + i * 30, y + i * 30, w, h, 10, i === 2 ? '#fbfaf6' : '#e9e1cf'); for (let k = 1; k < 7; k++) rect(g, '#cfc7b4', x + 60 + 60, y + 60 + k * (h / 8), w - 180, 12); };
  const bars = (g, x, y, w, h) => { rect(g, '#2c2e35', x, y, w, 30); rect(g, '#2c2e35', x, y + h - 30, w, 30); for (let i = 0; i <= 6; i++) rect(g, '#3b3f4a', x + (w * i) / 6 - 14, y, 28, h); };
  const mask = (g, x, y, s = 1) => { blob(g, x, y, 170 * s, 200 * s, '#f2f0ea'); blob(g, x - 60 * s, y - 30 * s, 34 * s, 22 * s, '#26262c'); blob(g, x + 60 * s, y - 30 * s, 34 * s, 22 * s, '#26262c'); g.save(); g.strokeStyle = '#26262c'; g.lineWidth = 12 * s; g.beginPath(); g.arc(x, y + 60 * s, 60 * s, 0.2, Math.PI - 0.2); g.stroke(); g.restore(); };

  /* ─── plates (2160×3840) ─── */
  const plates = {
    CINEMA: { paint: (g) => { room(g, '#3a2e4f', 2750, '#5a4060'); roundRect(g, 160, 500, 1840, 1100, 20, '#e9e4da'); for (let i = 0; i < 4; i++) roundRect(g, 140 + i * 480, 2550, 400, 300, 60, '#8a2a3a'); }, signs: {} },
    AIRPORT: { paint: (g, t) => { room(g, '#cfe0ea', 2900, '#9a9da3'); cloud(g, 300, 400, 1, t); plane(g, 1080 + Math.sin(t * 0.5) * 40, 1700, 1.6); roundRect(g, 0, 2350, 2160, 60, 0, '#7a7d83'); }, signs: {} },
    STAGE: { paint: (g) => { room(g, '#2b2238', 3000, '#6a5040'); rect(g, '#2c3e5c', -200, -200, 330, 3400); rect(g, '#2c3e5c', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.55)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 600], pole: 1150 } } },
    NYC: { paint: (g, t) => { room(g, '#f2c9a0', 2900, '#9a9da3'); for (let i = 0; i < 9; i++) roundRect(g, i * 250 - 40, 1500 + hash(i) * 700, 230, 1500, 10, i % 2 ? '#8a7d96' : '#9b8aa8'); }, signs: {} },
    WARDROBE: { paint: (g) => { room(g, '#c9b39a', 2800, '#8a6a4c'); tube(g, [120, 1400], [2040, 1400], 26, P.dark); }, signs: {} },
    HOSPITAL: { paint: (g) => { room(g, '#dfe8ee', 2850, '#b9c4cc'); roundRect(g, 1300, 2200, 700, 400, 40, '#f4f1ea'); roundRect(g, 1250, 2550, 800, 80, 20, '#9aa3ad'); }, signs: {} },
    COURT: { paint: (g) => { room(g, '#8a6a4c', 2850, '#6a5040'); for (let i = 0; i < 9; i++) rect(g, '#7a5c40', i * 260, 0, 16, 2850); roundRect(g, 1250, 2200, 800, 650, 20, '#5a4030'); }, signs: {} },
    WORKSHOP: { paint: (g) => { room(g, '#2f2a38', 2950, '#4a4250'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.25)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); }, signs: {} },
    ARCHIVE: { paint: (g) => { room(g, '#b9ab94', 2850, '#8a7a64'); for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) roundRect(g, 80 + c * 520, 200 + r * 420, 480, 380, 16, '#a89878'); roundRect(g, 200, 2400, 1760, 450, 20, P.wood); }, signs: {} },
    PRISON: { paint: (g) => { room(g, '#5d6670', 2850, '#4a4f5a'); for (let r = 0; r < 12; r++) for (let c = 0; c < 6; c++) roundRect(g, c * 380 - (r % 2) * 190, r * 240, 360, 220, 16, r % 2 ? '#6d7680' : '#66707a'); }, signs: {} },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);
  const close = (x, y) => cam(x, y, 1.6, 1.66, 0, 0);

  // P1/P2 — hook: "If Hollywood filmed it, it's true" → red X
  const HB = [260, 650, 1500, 760];
  const hook = (g, s, xOn) => { board(g, HB); typeText(g, 'MOVIE =\nTRUE STORY', HB, T('you', 1), s.t); if (xOn) redX(g, HB, T('wrong'), s.t); };
  const p1 = (g, s) => { hook(g, s, false); drawChar(g, CH.you, { x: 1250, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -0.6, smile: 0.6, arms: [{ to: [950, 2300], hand: 'point' }, null] }); };
  shot('P1', 0, 'CINEMA', full(40), p1);
  shot('P1b', T('hollywood'), 'CINEMA', cam(1080, 1200, 1.2, 1.25, 0, 20), p1);
  shot('P2', T('wrong'), 'CINEMA', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1250, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [880, 2150], hand: 'open' }, { to: [1620, 2150], hand: 'open' }] });
    mark(g, 1250, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: pilot / doctor / lawyer pop one per word; fake checks
  const p3 = (g, s) => {
    const r = [260, 620, 1500, 820]; board(g, r);
    [['cap', T('pilot', 1)], ['stetho', T('doctor', 1)], ['gavel', T('lawyer')]].forEach(([k, t0], i) => {
      const x = r[0] + 280 + i * 470, y = r[1] + 300;
      withPop(g, x, y, s.t, t0, () => (k === 'cap' ? pilotCap(g, x, y, 1) : k === 'stetho' ? stetho(g, x, y - 30, 1) : gavel(g, x, y, 0.8)));
    });
    typeText(g, 'MILLIONS IN\nFAKE CHECKS', [r[0] + 60, r[1] + 520, r[2] - 120, 260], T('cashed'), s.t);
    const role = s.t < T('doctor', 1) ? 'pilot' : s.t < T('lawyer') ? 'doctor' : 'lawyer';
    if (s.t >= T('pilot', 1)) puff(g, 1080, 2700, 380, s.t, T(role === 'pilot' ? 'pilot' : role, 1));
    frank(g, s, 1080, s.t < T('pilot', 1) ? null : role, { smile: 0.9 });
  };
  shot('P3', T('a', 3), 'NYC', full(40), p3);
  shot('P3b', T('doctor', 1), 'NYC', cam(1080, 2600, 1.5, 1.56, 0, 0), p3);
  shot('P3c', T('and', 2), 'NYC', full(20), p3);

  // P4 — subject under the spotlight
  shot('P4', T('his', 1), 'STAGE', full(30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'FRANK\nABAGNALE', T('frank', 1) - 0.1, s.t);
    withPop(g, 1000, FEET, s.t, s.t0 + 0.05, () => frank(g, s, 1000, 'pilot', { k: 1.2, smile: 1, arms: [{ to: [700, 1500 + Math.sin(s.t * 6) * 30], hand: 'open' }, null] }), 'squash');
  });

  // P5 — origin: New York, 1960s; runs away at sixteen
  const origin = (g, s) => {
    if (!s.tight) { board(g, [280, 1000, 1000, 340]); typeText(g, 'NEW YORK', [280, 1000, 1000, 340], T('new') + 0.05, s.t); dateCard(g, '1960s', s.t, T('1960s')); }
    const lt = s.t - T('ran', 1);
    const x = lt > 0 ? walkX(900, 1, K, Math.min(lt, 1.0)) : 900;
    drawChar(g, CH.frank, { x, y: FEET, k: K * 0.9, face: 1, pose: lt > 0 && lt < 1 ? 'walk' : 'stand', walkT: Math.max(0, lt), t: s.t, smile: 0.5, arms: [null, { to: [x + 220, 2900], hand: 'fist' }] });
    roundRect(g, x + 180, 2700, 180, 220, 30, '#a0522d');
    if (s.t > T('sixteen') - 0.1) popBoard(g, s, [820, 1640, 860, 260], 'AGE 16', T('sixteen') - 0.1);
  };
  shot('P5', T('new'), 'NYC', full(40), origin);
  shot('P5b', T('ran', 1), 'NYC', cam(1300, 2300, 1.25, 1.3, 0, 0), (g, s) => origin(g, { ...s, tight: true }));

  // P6 — the legend: three costumes on a rail, each landing on its label
  const rail = (g, s, upTo) => {
    const items = [['pilot', 'PILOT\nUNIFORM', T('three'), 470], ['doctor', "DOCTOR'S\nCOAT", T("doctor's"), 1080], ['lawyer', 'LAW\nDEGREE', T('law'), 1690]];
    items.slice(0, upTo).forEach(([role, label, t0, x]) => {
      withPop(g, x, 1650, s.t, t0, () => { tube(g, [x - 160, 1420], [x + 160, 1420], 16, P.dark); roundRect(g, x - 180, 1440, 360, 620, 90, ROLE[role].top); }, 'squash');
      popBoard(g, s, [x - 200, 650, 400, 300], label, t0);
    });
    if (upTo >= 3 && s.t > T('never')) redX(g, [1490, 650, 400, 300], T('never'), s.t);
  };
  shot('P6', T('his', 2), 'WARDROBE', full(30), (g, s) => rail(g, s, 1));
  shot('P6b', T('a', 8), 'WARDROBE', full(20), (g, s) => rail(g, s, 2));
  shot('P6c', T('and', 3), 'WARDROBE', cam(1080, 1500, 1.1, 1.14, 0, 0), (g, s) => rail(g, s, 3));

  // P7 — title
  shot('P7', T('so', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'SO HOW DID\nTHE STORY WORK?', s.t, s.lt, T('so', 1), { size: 88 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('work') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P8 — "He said..." claims, each in a speech bubble (claims, not facts)
  const claim = (g, s, plate, role, text, t0) => {
    popBoard(g, s, [330, 650, 1500, 420], text, t0);
    withPop(g, 1600, 1200, s.t, t0 + 0.2, () => { g.fillStyle = C.ink; g.font = '800 120px Montserrat'; g.textAlign = 'center'; g.fillText('"HE SAID"', 1080, 1250); });
    frank(g, s, 750, role, { smile: 0.9, look: 0.6, arms: [{ to: [450, 1900 + Math.sin(s.t * 6) * 30], hand: 'open' }, null] });
  };
  shot('P8', T('he', 4), 'AIRPORT', full(30), (g, s) => claim(g, s, 'AIRPORT', 'pilot', '1,000,000 MILES\nFOR FREE', T('flew')));
  shot('P8b', T('he', 6), 'HOSPITAL', full(30), (g, s) => claim(g, s, 'HOSPITAL', 'doctor', 'HOSPITAL WARD\nGEORGIA', T('hospital')));
  shot('P8c', T('and', 4), 'COURT', full(30), (g, s) => claim(g, s, 'COURT', 'lawyer', 'BAR EXAM\nLOUISIANA', T('bar')));
  // P9 — counter: $2,500,000 in fake checks
  const counter = (g, s) => {
    const r = [240, 700, 1500, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('climbs'), b = T('checks', 2, 'e');
    const v = Math.round(2500000 * Math.pow(clamp((s.t - a) / (b - a)), 1.3) / 1000) * 1000;
    A.ev('ding', b);
    if (s.t >= a) { g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.28}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$' + v.toLocaleString('en-US'), r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore(); }
    for (let i = 0; i < 7; i++) { const t0 = a + 0.2 + i * 0.25; if (s.t > t0) cheque2(g, 300 + hash(i) * 1560, Math.min(2850, 1600 + (s.t - t0) * 1800), 0.9, (hash(i * 3) - 0.5) * 0.8); }
  };
  shot('P9', T('the', 4), 'WORKSHOP', full(30), counter);
  shot('P9b', T('fake', 2), 'WORKSHOP', cam(1080, 2400, 1.3, 1.36, 0, 0), counter); // the checks raining down
  // P10 — book, then Spielberg movie
  const fame = (g, s) => {
    withPop(g, 600, 1900, s.t, T('book'), () => book(g, 600, 1900, 1.4), 'squash');
    if (s.t > T('book') + 0.1) typeText(g, 'CATCH ME\nIF YOU CAN', [380, 1650, 440, 300], T('book') + 0.1, s.t, { color: '#fbfaf6' });
    withPop(g, 1550, 1950, s.t, T('movie', 2), () => clapper(g, 1550, 1950, 1.4), 'squash');
    if (s.t > T('steven')) popBoard(g, s, [330, 650, 1500, 420], 'SPIELBERG +\nDICAPRIO', T('steven'));
  };
  shot('P10', T('he', 8), 'CINEMA', full(30), fame);
  shot('P10b', T('steven'), 'CINEMA', cam(1080, 1500, 1.15, 1.19, 0, 20), fame);

  // P11 — the truth: real fraud, real time; then the records
  shot('P11', T('frank', 3), 'PRISON', full(30), (g, s) => {
    popBoard(g, s, [330, 650, 1500, 420], 'REAL FRAUD\nREAL TIME', T('real', 1) - 0.1);
    frank(g, s, 1080, 'prisoner', { smile: 0 });
    bars(g, 300, 1550, 1560, 1800);
  });
  const archive = (g, s) => {
    dateCard(g, '2020', s.t, T('2020'));
    records(g, 400, 1100, 1200, 1100);
    typeText(g, 'PRISON\nRECORDS', [460, 1160, 1080, 380], T('records') - 0.2, s.t);
    drawChar(g, CH.researcher, { x: 1650, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -1, arms: [{ to: [1300, 2300], hand: 'point' }, null] });
  };
  shot('P11b', T('but', 2), 'ARCHIVE', full(30), archive);
  shot('P11c', T('during'), 'PRISON', full(20), (g, s) => {
    popBoard(g, s, [330, 650, 1500, 460], 'CON CAREER?\nIN PRISON', T('con', 1) - 0.1);
    frank(g, s, 1080, 'prisoner', { smile: 0, look: 0 });
    bars(g, 300, 1550, 1560, 1800);
    if (s.t > T('prison', 1) - 0.1) mark(g, 1600, 1850, '!', s.t, T('prison', 1) - 0.1);
  });

  // P12 — twist: the con was the life story itself (mask comes off)
  const twist = (g, s) => {
    typeOn(g, 'STAGE', 'name', 'THE BIGGEST\nCON?', T('and', 8) + 0.1, s.t);
    const off = clamp((s.t - T('own')) / 0.6);
    frank(g, s, 1000, null, { k: 1.2, smile: 0.4 });
    if (off < 1) mask(g, 1000 + off * 600, 2280 - off * 700 - Math.sin(off * Math.PI) * 200, 1.35 - off * 0.3);
  };
  shot('P12', T('and', 8), 'STAGE', full(30), twist);
  shot('P12b', T('may'), 'STAGE', cam(1000, 2450, 1.5, 1.56, 0, 0), twist);

  // P13 — the question; viewer reacts; sign holds to the end
  const finale = (g, s) => {
    hook(g, s, true);
    popBoard(g, s, [260, 1600, 1500, 560], 'HOW MANY LEGENDS\nARE A ROLE?', T('so', 2) + 0.05);
    const up = s.t > T('legends');
    drawChar(g, CH.you, { x: 1300, y: FEET + 150, k: K, face: -1, pose: 'stand', t: s.t, look: up ? 0 : -0.8, smile: up ? 0.3 : 0, arms: up ? [{ to: [1080, 2300], hand: 'open' }, { to: [1650, 2400], hand: 'point' }] : null });
    mark(g, 1650, 2250, '?', s.t, T('role'));
  };
  shot('P13', T('so', 2), 'CINEMA', full(30), finale);
  shot('P13b', T('legends'), 'CINEMA', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('new'), T('his', 2), T('frank', 3), T('and', 8), T('so', 2)];
  return { plates, shots, wipes, end: A.duration };
};

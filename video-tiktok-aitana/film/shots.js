/* "The influencer who doesn't exist" (Aitana López) — vertical 9:16 for US TikTok, flat vector, drawn in code.
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
    aitana: { skin: C.skin, top: P.navy, bottom: P.violet, hair: '#e98bb5', hairStyle: 'tail', seed: 11 },
    ruben: { skin: C.skin, top: P.teal, bottom: P.navy, hair: '#2e2420', glasses: true, seed: 12 },
    model: { skin: C.skin, top: P.red, bottom: '#3a3f4a', hair: '#c9a46a', hairStyle: 'tail', seed: 13 },
    actor: { skin: C.skin, top: '#26262c', bottom: '#26262c', hair: '#3a2a20', glasses: true, seed: 14 },
    blank: { skin: '#c9ced4', top: '#b9bfc6', bottom: '#b9bfc6', hair: '#c9ced4', seed: 15 },
    fan1: { skin: C.skin, top: P.gold, bottom: P.navy, hair: '#6a4630', hairStyle: 'tail', seed: 16 },
    fan2: { skin: C.skin, top: P.blue, bottom: '#3a3f4a', hair: '#1f1b1b', seed: 17 },
  });

  /* Aitana is not real: she glitches — horizontal bands of her drawing slip sideways. */
  const glitchChar = (g, ch, st, amount) => {
    if (amount <= 0.01) { drawChar(g, ch, st); return; }
    const bands = 9, top = st.y - 1350 * (st.k || 1), h = 1400 * (st.k || 1);
    for (let i = 0; i < bands; i++) {
      const y0 = top + (h * i) / bands, off = (hash(i * 7 + Math.floor(st.t * 18)) - 0.5) * 160 * amount;
      g.save(); g.beginPath(); g.rect(st.x - 900, y0, 1800, h / bands + 1); g.clip(); g.translate(off, 0);
      drawChar(g, ch, st); g.restore();
    }
  };
  // Pixel dissolve: square tiles of the plate colour eat the character (she "doesn't exist").
  const dissolve = (g, x, y, w, h, p, col) => {
    if (p <= 0) return; const n = 14, cw = w / n, chh = h / n; g.fillStyle = col;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (hash(i * 31 + j * 17) < p) g.fillRect(x + i * cw, y + j * chh, cw + 1, chh + 1);
  };
  const phone = (g, x, y, w, h, screen = '#f4f6f8') => { roundRect(g, x, y, w, h, w * 0.12, '#23262d'); roundRect(g, x + w * 0.06, y + h * 0.05, w * 0.88, h * 0.9, w * 0.06, screen); };
  const bubble = (g, s, x, y, w, h, text, t0, left = true, col = '#fbfaf6') => withPop(g, x + w / 2, y + h / 2, s.t, t0, () => {
    roundRect(g, x, y, w, h, 40, col);
    g.fillStyle = col; g.beginPath(); const tx = left ? x + 60 : x + w - 60; g.moveTo(tx - 30, y + h - 4); g.lineTo(tx + (left ? -40 : 40), y + h + 50); g.lineTo(tx + 30, y + h - 4); g.fill();
    if (s.t > t0 + 0.15) typeText(g, text, [x + 30, y + 20, w - 60, h - 40], t0 + 0.15, s.t);
  });
  const heart = (g, x, y, r, col = '#e46a7a') => { g.fillStyle = col; g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.5); g.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); g.fill(); };
  const euro = (g, x, y, s = 1) => { blob(g, x, y, 120 * s, 120 * s, P.gold); g.fillStyle = '#9c7a2e'; g.font = `800 ${140 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('€', x, y + 6 * s); };
  const calendar = (g, x, y, s = 1) => { roundRect(g, x - 120 * s, y - 110 * s, 240 * s, 220 * s, 24 * s, '#fbfaf6'); rect(g, C.orange, x - 120 * s, y - 110 * s, 240 * s, 60 * s); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) rect(g, C.orange, x - 85 * s + i * 65 * s, y - 20 * s + j * 60 * s, 40 * s, 40 * s); };
  const portrait = (g, x, y, w, h, t) => { // flat "photo" of Aitana used on screens and billboards
    roundRect(g, x, y, w, h, 20, '#f2d7e2');
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    drawChar(g, CH.aitana, { x: x + w / 2, y: y + h * 1.55, k: h / 900, face: 1, pose: 'stand', t, smile: 0.7 });
    g.restore();
  };

  /* ─── plates (2160×3840) ─── */
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
    TOWN: { paint: (g, t) => { room(g, '#cfe0ea', 2900, '#c9b49a'); cloud(g, 200, 1500, 0.8, t);
        building(g, 60, 1800, 700, 1100, '#e7c9a0', 3, 2, P.brick); building(g, 820, 1650, 700, 1250, '#d9a58a', 3, 2); building(g, 1580, 1900, 620, 1000, P.beige, 2, 2, P.brick);
        [380, 1900].forEach((x) => { roundRect(g, x - 22, 2200, 44, 700, 16, P.wood); [[-1, -0.3], [1, -0.3], [-0.6, -0.8], [0.6, -0.8], [0, -1]].forEach(([dx, dy]) => blob(g, x + dx * 160, 2200 + dy * 90, 170, 50, '#7f9a7e', dx * 0.5)); }); },
      signs: { town: { r: [280, 860, 1500, 560], pole: 0 } } },
    AGENCY: { paint: (g) => { room(g, '#d6cbbb', 2800, '#9b8670'); roundRect(g, 1250, 1500, 800, 800, 20, '#e8eef2'); windows(g, 1250, 1500, 800, 800, 2, 2, '#cddbe4'); roundRect(g, 100, 2350, 1100, 450, 30, P.wood); },
      signs: { board: { r: [260, 650, 1500, 600] } } },
    STUDIO: { paint: (g) => { room(g, '#ece6dc', 2950, '#d7cfc3'); g.fillStyle = '#e2dbcf'; g.beginPath(); g.moveTo(-200, 2950); g.quadraticCurveTo(1080, 2700, 2360, 2950); g.fill(); }, signs: {} },
    PLAN: { paint: (g) => { room(g, P.blue, 2850, '#8a6a4c'); }, signs: { board: { r: [200, 560, 1640, 1500] } } },
    DESK: { paint: (g) => { room(g, '#3d4658', 2850, '#4a4f5a'); roundRect(g, 120, 2400, 1920, 120, 20, P.wood); roundRect(g, 1000, 2250, 160, 160, 20, '#2c2e35'); }, signs: { screen: { kind: 'screen', r: [200, 700, 1760, 1500], frame: '#2c2e35' } } },
    FEED: { paint: (g) => { room(g, '#c9b39a', 2750, '#8a6a4c'); roundRect(g, 160, 2300, 1840, 500, 90, P.teal); }, signs: {} },
    LOFT: { paint: (g, t) => { room(g, '#2f3d55', 2850, '#5d4a3c'); windows(g, 200, 400, 1760, 1300, 2, 3, '#41557a'); for (let i = 0; i < 18; i++) blob(g, 260 + hash(i) * 1640, 500 + hash(i * 3) * 1100, 8, 8, '#f4e2a8'); roundRect(g, 200, 2400, 1700, 450, 90, '#6d5a7e'); }, signs: {} },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);

  // P1/P2 — hook: "influencers are real people" → red X
  const hook = (g, s, xOn) => {
    typeOn(g, 'OFFICE', 'board', 'INFLUENCERS\n= REAL PEOPLE', T('you', 1), s.t);
    if (xOn) redX(g, S('OFFICE', 'board').r, T('wrong'), s.t);
  };
  const youPhone = (g, s, x, extra = {}) => { // the viewer, scrolling
    drawChar(g, CH.you, { x, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -0.5, arms: [{ to: [x - 300, 2330], hand: 'open' }, { to: [x - 240, 2300], hand: 'open' }], ...extra });
    phone(g, x - 400, 2120, 190, 340); portrait(g, x - 385, 2150, 160, 280, s.t);
  };
  shot('P1', 0, 'OFFICE', full(40), (g, s) => { hook(g, s, false); youPhone(g, s, 1250); });
  shot('P2', T('wrong'), 'OFFICE', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1250, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [880, 2150], hand: 'open' }, { to: [1620, 2150], hand: 'open' }] });
    mark(g, 1250, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: her face on a billboard, money icons pop one per word
  const p3 = (g, s) => {
    const b = S('STREET', 'bill').r;
    withPop(g, b[0] + 260, b[1] + 300, s.t, T('barcelona', 1), () => portrait(g, b[0] + 60, b[1] + 60, 400, 500, s.t), 'squash');
    withPop(g, b[0] + 760, b[1] + 230, s.t, T('ten', 1), () => euro(g, b[0] + 760, b[1] + 230, 0.9));
    withPop(g, b[0] + 1120, b[1] + 230, s.t, T('month', 1), () => calendar(g, b[0] + 1120, b[1] + 230, 0.9));
    typeOn(g, 'STREET', 'bill', '€10,000\n/ MONTH', T('euros', 1), s.t, { r: [b[0] + 520, b[1] + 420, b[2] - 580, b[3] - 470] });
    drawChar(g, CH.pass1, { x: walkX(300, 1, K, s.lt), y: FEET, k: K, face: 1, pose: 'walk', walkT: s.lt, t: s.t, look: -1 });
  };
  shot('P3', T('an'), 'STREET', full(40), p3);
  shot('P3b', T('ten', 1), 'STREET', cam(1100, 1300, 1.15, 1.19, 0, 20), p3);
  // P4 — "and she doesn't exist": she glitches and dissolves
  shot('P4', T('and', 1), 'CORNER', full(-30), (g, s) => {
    typeOn(g, 'CORNER', 'sign', "SHE DOESN'T\nEXIST", T('and', 1) + 0.05, s.t);
    const gl = clamp((s.t - T('exist') + 0.3) / 0.4);
    // dissolve by clipping: she is only drawn inside the tiles that remain, so the real set shows through
    const dp = clamp((s.t - T('exist')) / 0.7), n = 14, X0 = 640, Y0 = 1800, cw = 880 / n, chh = 1500 / n;
    g.save(); g.beginPath();
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (hash(i * 31 + j * 17) >= dp) g.rect(X0 + i * cw, Y0 + j * chh, cw + 1, chh + 1);
    g.rect(-500, -500, PW + 1000, Y0 + 500 - 1); // everything above the dissolve box stays
    g.clip();
    glitchChar(g, CH.aitana, { x: 1080, y: FEET, k: 1.15, face: 1, pose: 'stand', t: s.t, smile: 0.6 }, gl);
    g.restore();
  });

  // P5 — subject under the spotlight
  shot('P5', T('her', 1), 'STAGE', full(30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'AITANA\nLÓPEZ', T('aitana'), s.t);
    withPop(g, 1000, FEET, s.t, s.t0 + 0.05, () => glitchChar(g, CH.aitana, { x: 1000, y: FEET, k: 1.2, face: 1, pose: 'stand', t: s.t, smile: 0.8,
      arms: [{ to: [700, 1950 + Math.sin(s.lt * 9) * 50], hand: 'open' }, null] }, (s.lt % 1.6) < 0.12 ? 0.5 : 0), 'squash');
  });

  // P6 — origin: Barcelona, 2023, people walking by
  shot('P6', T('barcelona', 2), 'TOWN', full(40), (g, s) => {
    typeOn(g, 'TOWN', 'town', 'BARCELONA', T('barcelona', 2) + 0.05, s.t);
    drawChar(g, CH.pass2, { x: walkX(1170, -1, 0.9, s.lt), y: 3150, k: 0.9, face: -1, pose: 'walk', walkT: s.lt, t: s.t });
    drawChar(g, CH.pass3, { x: walkX(150, 1, 1.0, s.lt), y: 3300, k: 1.0, face: 1, pose: 'walk', walkT: s.lt + 0.3, t: s.t });
    dateCard(g, '2023', s.t, T('2023'));
  });
  // P7 — Rubén's agency; a human model cancels and storms out, her ego inflating
  const p7 = (g, s) => {
    typeOn(g, 'AGENCY', 'board', 'MODEL AGENCY\nSHOOT TODAY', T('rubén') + 0.05, s.t);
    redX(g, [S('AGENCY', 'board').r[0] + 60, S('AGENCY', 'board').r[1] + 300, S('AGENCY', 'board').r[2] - 120, 260], T('cancel'), s.t);
    drawChar(g, CH.ruben, { x: 880, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, look: 1, arms: s.t > T('cancel') ? [{ to: [600, 2050], hand: 'open' }, { to: [1160, 2050], hand: 'open' }] : null });
    const ego = 1 + 0.35 * clamp((s.t - T('egos')) / 0.4);
    const mx = s.t < T('cancel') ? 1560 : walkX(1560, 1, K, s.t - T('cancel'));
    drawChar(g, CH.model, { x: mx, y: FEET, k: K * ego, face: s.t < T('cancel') ? -1 : 1, pose: s.t < T('cancel') ? 'stand' : 'walk', walkT: s.t, t: s.t, look: 1 });
  };
  shot('P7', T('rubén'), 'AGENCY', full(30), p7);
  shot('P7b', T("he's"), 'AGENCY', cam(1250, 2640, 1.6, 1.66, 0, 0), p7);
  // P8 — "so he decides to build his own"
  shot('P8', T('so', 1), 'AGENCY', cam(1000, 1500, 1.25, 1.3, 0, 30), (g, s) => {
    typeText(g, "LET'S BUILD\nOUR OWN", S('AGENCY', 'board').r, T('build'), s.t);
    drawChar(g, CH.ruben, { x: 1250, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, smile: 0.7, arms: [{ to: [900, 1500], hand: 'point' }, null] });
    mark(g, 1250, 1830, '!', s.t, T('decides'));
  });

  // P9–P11 — three things, each landing on its label; the blank mannequin becomes Aitana
  const studio = (g, s, upTo) => {
    const hairOn = s.t >= T('pink'), alive = s.t >= T('whole');
    const st = { x: 1080, y: FEET, k: 1.15, face: 1, pose: 'stand', t: s.t, nod: alive ? 1 : 0, eyesClosed: !alive && s.t < T('personality'), smile: s.t >= T('personality') ? 0.6 : 0,
      ...(hairOn ? { hair: '#e98bb5' } : {}) };
    drawChar(g, alive ? CH.aitana : { ...CH.blank, hairStyle: hairOn ? 'tail' : undefined }, st);
    if (s.t > T('pink')) puff(g, 1080, 2050, 220, s.t, T('pink'));
    if (alive) puff(g, 1080, 2500, 420, s.t, T('whole'));
    popBoard(g, s, [200, 620, 780, 280], 'PINK HAIR', T('pink'));
    if (upTo >= 2) {
      popBoard(g, s, [1020, 620, 840, 280], 'PERSONALITY', T('personality'));
      [['heart', 1550, 1250], ['heart', 1750, 1450], ['heart', 1400, 1500]].forEach(([k, x, y], i) => withPop(g, x, y, s.t, T('personality') + 0.15 * i, () => heart(g, x, y, 70)));
    }
    if (upTo >= 3) {
      popBoard(g, s, [560, 1050, 1040, 300], 'A WHOLE LIFE', T('whole'));
      withPop(g, 500, 1500, s.t, T('life', 1), () => calendar(g, 500, 1500, 1));
    }
  };
  shot('P9', T('his', 2), 'STUDIO', full(30), (g, s) => studio(g, s, 1));
  shot('P10', T('a', 3), 'STUDIO', cam(1060, 1450, 1.12, 1.16, 0, 30), (g, s) => studio(g, s, 2));
  shot('P11', T('and', 3), 'STUDIO', full(0), (g, s) => studio(g, s, 3));

  // P12 — title
  shot('P12', T('so', 2), null, null, (g, s) => {
    titleCard(g, 'purple', 'SO HOW DOES\nIT WORK?', s.t, s.lt, T('so', 2), { size: 96 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('work') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P13 — mechanism 1: the team plans her week
  const p13 = (g, s) => {
    const r = S('PLAN', 'board').r;
    typeText(g, 'HER WEEK', [r[0] + 80, r[1] + 60, r[2] - 160, 220], T('every', 1) + 0.05, s.t);
    [['MON  GYM', 'gym'], ['WED  CONCERT', 'concert'], ['SAT  TRIP', 'trip']].forEach(([txt, w], i) =>
      typeText(g, txt, [r[0] + 120, r[1] + 380 + i * 330, r[2] - 240, 220], T(w) - 0.1, s.t));
    drawChar(g, CH.ruben, { x: 1500, y: FEET + 100, k: 1.0, face: -1, pose: 'stand', t: s.t, arms: [{ to: [1250, 2000], hand: 'fist', scribble: true }, null] });
  };
  shot('P13', T('every', 1), 'PLAN', full(30), p13);
  shot('P13b', T('concert'), 'PLAN', cam(1000, 1350, 1.2, 1.25, 0, 20), p13);
  // P14 — mechanism 2: the machine. AI generates the photo, pixels resolve into her face
  const screenShot = (g, s, phase) => {
    const r = S('DESK', 'screen').r;
    const img = [r[0] + 260, r[1] + 300, r[2] - 520, r[3] - 420];
    typeText(g, phase === 'ai' ? 'AI: GENERATE PHOTO' : 'PHOTOSHOP', [r[0] + 80, r[1] + 50, r[2] - 160, 180], phase === 'ai' ? T('artificial') : T('photoshop') - 0.2, s.t, { color: '#bfe8ff' });
    const res = clamp((s.t - T('generates')) / 0.9);
    if (s.t > T('generates')) {
      portrait(g, img[0], img[1], img[2], img[3], s.t);
      dissolve(g, img[0], img[1], img[2], img[3], 1 - res, '#20262c'); // pixels resolving
    }
    if (phase === 'ps') { // retouch brush scribbling over the photo
      const bx = img[0] + img[2] * (0.5 + 0.3 * Math.sin(s.t * 5)), by = img[1] + img[3] * (0.35 + 0.15 * Math.cos(s.t * 7));
      blob(g, bx, by, 34, 34, '#ffffff'); tube(g, [bx, by], [bx + 120, by + 180], 22, P.gold);
    }
  };
  shot('P14', T('artificial'), 'DESK', full(30), (g, s) => screenShot(g, s, 'ai'));
  shot('P14b', T('designers'), 'DESK', cam(1080, 1450, 1.15, 1.2, 0, 30), (g, s) => screenShot(g, s, 'ps'));
  // P15 — captions and replies on her phone
  shot('P15', T('then'), 'FEED', full(30), (g, s) => {
    phone(g, 380, 520, 1400, 2300, '#f4f6f8');
    portrait(g, 480, 640, 1200, 900, s.t);
    typeText(g, 'Leg day. Done.', [500, 1580, 1160, 160], T('captions') - 0.1, s.t);
    bubble(g, s, 500, 1850, 900, 200, 'so pretty', T('answer'), true, '#e3ecf3');
    bubble(g, s, 760, 2150, 900, 200, 'thank you!', T('fans') + 0.1, false, '#f2d7e2');
  });
  // P16 — brands pay per post; the counter climbs to €10,000
  const p16 = (g, s) => {
    const r = [300, 700, 1400, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('brands'), b = T('month', 2, 'e');
    const v = Math.round(10000 * Math.pow(clamp((s.t - a) / (b - a)), 1.4) / 10) * 10;
    A.ev('ding', b);
    g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.36}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('€' + v.toLocaleString('en-US'), r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore();
    for (let i = 0; i < 6; i++) { const t0 = a + 0.4 + i * 0.45; if (s.t > t0) { const yy = Math.min(2900, 1500 + (s.t - t0) * 2600); euro(g, 500 + i * 230, yy, 0.6); A.ev('pop', t0); } }
    glitchChar(g, CH.aitana, { x: 1500, y: FEET, k: 1.05, face: -1, pose: 'stand', t: s.t, smile: 0.8 }, (s.lt % 1.9) < 0.1 ? 0.5 : 0);
  };
  shot('P16', T('brands'), 'AGENCY', full(30), p16);
  shot('P16b', T('the', 4), 'AGENCY', cam(1070, 1350, 1.15, 1.19, 0, 0), p16);

  // P17 — followers: hundreds of thousands, and many never notice
  const fans = (g, s) => {
    typeText(g, '100K+\nFOLLOWERS', [260, 620, 1500, 600], T('hundred') - 0.1, s.t);
    [[CH.fan1, 520, 0], [CH.fan2, 1080, 0.15], [CH.pass2, 1640, 0.3]].forEach(([c, x, d]) => {
      drawChar(g, c, { x, y: FEET, k: 0.95, face: 1, pose: 'stand', t: s.t, look: -0.4, smile: 0.6, arms: [{ to: [x - 140, 2350], hand: 'open' }, { to: [x - 80, 2330], hand: 'open' }] });
      phone(g, x - 240, 2160, 160, 290); portrait(g, x - 228, 2190, 136, 240, s.t);
      withPop(g, x, 1950, s.t, T('follow', 1) + d, () => heart(g, x + 60, 1900 - ((s.t * 120) % 200), 50));
    });
  };
  shot('P17', T('over'), 'FEED', full(30), (g, s) => { board(g, [260, 620, 1500, 600]); fans(g, s); });
  shot('P17b', T('many', 1), 'FEED', cam(1080, 2560, 1.5, 1.56, 0, 0), (g, s) => {
    board(g, [260, 620, 1500, 600]); fans(g, s);
    popBoard(g, s, [450, 1680, 1080, 360], "THEY DON'T KNOW", T('realize'));
  });

  // P18 — twist: a famous actor slides into her DMs
  const p18 = (g, s) => {
    drawChar(g, CH.actor, { x: 1450, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, smile: 0.5, arms: [{ to: [1150, 2330], hand: 'open' }, { to: [1210, 2300], hand: 'open' }] });
    phone(g, 380, 520, 1300, 1500, '#f4f6f8');
    typeText(g, 'NEW MESSAGE', [480, 600, 1100, 160], T('well-known') - 0.1, s.t);
    bubble(g, s, 480, 900, 1000, 260, 'Dinner this week?', T('dms'), false, '#cfe3f5');
    portrait(g, 480, 1300, 420, 560, s.t);
  };
  shot('P18', T('and', 5), 'LOFT', full(30), p18);
  shot('P18c', T('slid'), 'LOFT', cam(1030, 1250, 1.25, 1.3, 0, 20), p18);
  shot('P18b', T('he', 2), 'LOFT', cam(1080, 1700, 1.2, 1.25, 0, 20), (g, s) => {
    const j = Math.sin(Math.PI * clamp((s.t - T('computer')) / 0.45));
    drawChar(g, CH.actor, { x: 1300, y: FEET - 160 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1, arms: [{ to: [950, 2000 - 200 * j], hand: 'open' }, { to: [1650, 2000 - 200 * j], hand: 'open' }] });
    popBoard(g, s, [360, 900, 1300, 520], 'MADE BY\nA COMPUTER', T('made'));
    mark(g, 1300, 1900 - 160 * j, '!', s.t, T('computer'));
  });

  // P19 — the question; the viewer looks up from the phone; sign holds to the end
  const finale = (g, s) => {
    typeOn(g, 'OFFICE', 'board', 'INFLUENCERS\n= REAL PEOPLE', T('you', 1), s.t);
    redX(g, S('OFFICE', 'board').r, T('wrong'), s.t);
    popBoard(g, s, [260, 1600, 1500, 560], 'HOW MANY\nARE REAL?', T('so', 3) + 0.05);
    const up = s.t > T('many', 2);
    youPhone(g, s, 1300, { look: up ? 0 : -0.6, smile: up ? 0.3 : 0 });
    mark(g, 1650, 2250, '?', s.t, T('real', 3) - 0.3);
  };
  shot('P19', T('so', 3), 'OFFICE', full(30), finale);
  shot('P19b', T('follow', 2), 'OFFICE', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('barcelona', 2), T('his', 2), T('over'), T('and', 5), T('so', 3)];
  return { plates, shots, wipes, end: A.duration };
};

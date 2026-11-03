/* "The fake heiress" (Anna Sorokin / "Anna Delvey") — vertical 9:16 for US TikTok, flat vector, drawn in code.
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

  /* ─── cast for this story ─── */
  Object.assign(CH, {
    anna: { skin: C.skin, top: '#26262c', bottom: '#26262c', hair: '#8a5a3a', hairStyle: 'tail', glasses: true, seed: 21 },
    teen: { skin: C.skin, top: P.blue, bottom: P.navy, hair: '#8a5a3a', hairStyle: 'tail', seed: 22 },
    friend: { skin: C.skin, top: P.violet, bottom: P.navy, hair: '#c9a46a', hairStyle: 'tail', seed: 23 },
    clerk: { skin: C.skin, top: '#7a2e3a', bottom: '#26262c', hair: '#2e2420', seed: 24 },
    banker: { skin: C.skin, top: P.blue, bottom: '#3a3f4a', hair: '#7a6a5a', glasses: true, seed: 25 },
    cop: { skin: C.skin, top: P.navy, bottom: P.navy, hair: '#1f1b1b', seed: 26 },
    judge: { skin: C.skin, top: '#1d1d22', bottom: '#1d1d22', hair: '#d4d1cb', glasses: true, seed: 27 },
  });
  const suitcase = (g, x, y) => { roundRect(g, x - 120, y - 300, 240, 300, 30, '#a0522d'); roundRect(g, x - 50, y - 350, 100, 60, 20, '#3b3f4a'); };
  const hotelIcon = (g, x, y, s = 1) => { roundRect(g, x - 110 * s, y - 120 * s, 220 * s, 240 * s, 16 * s, P.beige); windows(g, x - 100 * s, y - 110 * s, 200 * s, 160 * s, 3, 3, '#f4e2a8'); };
  const cloche = (g, x, y, s = 1) => { g.fillStyle = '#c9ced4'; g.beginPath(); g.arc(x, y + 40 * s, 120 * s, Math.PI, 0); g.fill(); rect(g, '#9aa3ad', x - 150 * s, y + 40 * s, 300 * s, 24 * s); blob(g, x, y - 90 * s, 20 * s, 20 * s, '#9aa3ad'); };
  const bankIcon = (g, x, y, s = 1) => { g.fillStyle = P.cream; g.beginPath(); g.moveTo(x - 140 * s, y - 50 * s); g.lineTo(x, y - 140 * s); g.lineTo(x + 140 * s, y - 50 * s); g.fill(); for (let i = 0; i < 4; i++) rect(g, P.cream, x - 120 * s + i * 72 * s, y - 40 * s, 30 * s, 140 * s); rect(g, P.cream, x - 140 * s, y + 100 * s, 280 * s, 24 * s); };
  const dress = (g, x, y) => { tube(g, [x - 120, y], [x + 120, y], 14, P.dark); g.fillStyle = '#26262c'; g.beginPath(); g.moveTo(x - 60, y + 20); g.lineTo(x + 60, y + 20); g.lineTo(x + 130, y + 380); g.lineTo(x - 130, y + 380); g.fill(); };
  const bill = (g, x, y, rot) => { g.save(); g.translate(x, y); g.rotate(rot); roundRect(g, -110, -55, 220, 110, 12, P.money); g.fillStyle = '#4e6e49'; g.font = '800 60px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('100', 0, 4); g.restore(); };
  const paper = (g, x, y, w, h) => { roundRect(g, x, y, w, h, 10, '#fbfaf6'); for (let i = 1; i < 6; i++) rect(g, '#d9d4c7', x + w * 0.12, y + (h * i) / 7, w * 0.76, 10); };
  const siren = (g, x, y, t) => { const on = Math.floor(t * 6) % 2; blob(g, x - 70, y, 50, 34, on ? '#d62828' : '#7a2a2a'); blob(g, x + 70, y, 50, 34, on ? '#3a3a9a' : '#4f7cd6'); };

  /* ─── plates (2160×3840) ─── */
  const night = (g, t) => { room(g, '#1f2a44', 2900, '#3b3f4a'); for (let i = 0; i < 26; i++) blob(g, hash(i) * 2160, hash(i * 5) * 900, 6, 6, '#f4e2a8'); };
  const plates = {
    OFFICE: { paint: (g) => { room(g, '#c9b8a0', 2700, '#8a6a4c'); roundRect(g, 80, 2450, 900, 450, 30, P.wood); roundRect(g, 1780, 2250, 160, 650, 30, '#7f9a7e'); blob(g, 1860, 2180, 150, 130, '#7f9a7e'); },
      signs: { board: { r: [260, 650, 1500, 760] } } },
    NYNIGHT: { paint: (g, t) => { night(g, t); building(g, -60, 1500, 820, 1400, '#3d4a66', 6, 3); building(g, 800, 1250, 620, 1650, '#4a3d5e', 7, 2); building(g, 1460, 1600, 760, 1300, '#3d4a66', 5, 3); for (let i = 0; i < 3; i++) rect(g, '#f4e2a8', 0, 2860, 2160, 6); },
      signs: { sign: { r: [300, 620, 1400, 760], pole: 0 } } },
    STAGE: { paint: (g) => { room(g, P.navy, 3000, '#8a6a4c'); rect(g, '#5a2a3a', -200, -200, 330, 3400); rect(g, '#5a2a3a', 2030, -200, 330, 3400);
        const rg = g.createRadialGradient(1080, 3150, 0, 1080, 3150, 900); rg.addColorStop(0, 'rgba(255,236,200,0.6)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 2200, 2160, 1700); },
      signs: { name: { r: [330, 650, 1400, 560], pole: 1180 } } },
    MOSCOW: { paint: (g, t) => { room(g, '#dfe7ee', 2900, '#e9eef2'); cloud(g, 900, 1500, 0.9, t); roundRect(g, 300, 2000, 1560, 900, 20, '#b9826b');
        [[560, 1900, 200], [1080, 1700, 260], [1600, 1900, 200]].forEach(([x, y, r]) => { blob(g, x, y, r, r * 1.1, P.gold); roundRect(g, x - r * 0.7, y + r * 0.6, r * 1.4, 400, 20, '#d8c6a6'); }); },
      signs: { sign: { r: [280, 860, 1500, 520], pole: 0 } } },
    GERMANY: { paint: (g, t) => { room(g, P.sky, 2900, '#9a9da3'); cloud(g, 300, 1500, 0.8, t);
        [[80, 1900], [800, 1800], [1480, 1950]].forEach(([x, y], i) => { roundRect(g, x, y, 620, 2900 - y, 10, P.cream); g.fillStyle = '#9b5b45'; g.beginPath(); g.moveTo(x - 30, y + 4); g.lineTo(x + 310, y - 380); g.lineTo(x + 650, y + 4); g.fill();
          for (let k = 0; k < 4; k++) rect(g, '#7a5a40', x + k * 200, y, 26, 2900 - y); rect(g, '#7a5a40', x, y + 300, 620, 26); windows(g, x + 40, y + 360, 540, 400, 1, 2, '#cddbe4'); }); },
      signs: { sign: { r: [280, 860, 1500, 520], pole: 0 } } },
    NYC: { paint: (g, t) => { room(g, '#f2c9a0', 2900, '#9a9da3'); for (let i = 0; i < 9; i++) roundRect(g, i * 250 - 40, 1500 + hash(i) * 700, 230, 1500, 10, i % 2 ? '#8a7d96' : '#9b8aa8'); },
      signs: { sign: { r: [280, 860, 1500, 520], pole: 0 } } },
    LOBBY: { paint: (g) => { room(g, '#7a2e3a', 2850, '#d8c6a6'); for (let x = 0; x < PW; x += 240) rect(g, x % 480 ? '#cdb994' : '#e3d3b0', x, 2850, 240, 1000);
        blob(g, 1080, 300, 260, 80, P.gold); for (let i = -3; i <= 3; i++) blob(g, 1080 + i * 80, 400, 22, 40, '#f4e2a8'); roundRect(g, 200, 2350, 1760, 500, 20, P.wood); },
      signs: {} }, // boards in the lobby spring in per shot: no blank board on the wall
    BANK: { paint: (g) => { room(g, '#d9d3c7', 2850, '#a9a090'); for (let i = 0; i < 4; i++) roundRect(g, 160 + i * 520, 1300, 180, 1550, 20, P.cream); roundRect(g, 200, 2450, 1760, 400, 20, P.wood); },
      signs: { screen: { kind: 'screen', r: [280, 650, 1500, 560], frame: '#5d6670' } } },
    MOROCCO: { paint: (g, t) => { room(g, '#f0c48a', 2900, '#d9a066'); for (let i = 0; i < 3; i++) { const x = 160 + i * 660; roundRect(g, x, 1600, 520, 1300, 260, '#b5603e'); roundRect(g, x + 60, 1700, 400, 1200, 200, '#f6d9a8'); }
        [[150, 2900], [2010, 2900]].forEach(([x, y]) => { roundRect(g, x - 20, y - 900, 40, 900, 16, P.wood); [[-1, -0.2], [1, -0.2], [-0.5, -0.7], [0.5, -0.7]].forEach(([dx, dy]) => blob(g, x + dx * 180, y - 900 + dy * 100, 190, 50, '#7f9a7e', dx * 0.5)); }); },
      signs: {} },
    WORKSHOP: { paint: (g) => { room(g, '#3d4658', 2950, '#4a4f5a'); const rg = g.createRadialGradient(1080, 400, 0, 1080, 400, 1500); rg.addColorStop(0, 'rgba(255,236,200,0.3)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 2950); }, signs: {} },
    POLICE: { paint: (g, t) => { night(g, t); building(g, 100, 1700, 1960, 1200, '#3d4a66', 3, 4); }, signs: { sign: { r: [280, 860, 1500, 520], pole: 0 } } },
    COURT: { paint: (g) => { room(g, '#8a6a4c', 2850, '#6a5040'); for (let i = 0; i < 9; i++) rect(g, '#7a5c40', i * 260, 0, 16, 2850); roundRect(g, 300, 2000, 1560, 850, 20, '#5a4030'); },
      signs: { board: { r: [280, 860, 1500, 520] } } },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const full = (dy = 30) => cam(1080, 1920, 1.02, 1.06, 0, dy);
  const anna = (g, s, x, extra = {}) => drawChar(g, CH.anna, { x, y: FEET, k: K, face: 1, pose: 'stand', t: s.t, smile: 0.5, ...extra });

  // P1/P2 — hook: "you need money to live rich" → red X
  const hook = (g, s, xOn) => { typeOn(g, 'OFFICE', 'board', 'NEED MONEY\nTO LIVE RICH', T('you', 1), s.t); if (xOn) redX(g, S('OFFICE', 'board').r, T('wrong'), s.t); };
  const youPhone = (g, s, x, extra = {}) => { drawChar(g, CH.you, { x, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, look: -0.5, arms: [{ to: [x - 300, 2330], hand: 'open' }, { to: [x - 240, 2300], hand: 'open' }], ...extra }); phone(g, x - 400, 2120, 190, 340, '#e9dcc8'); };
  shot('P1', 0, 'OFFICE', full(40), (g, s) => { hook(g, s, false); youPhone(g, s, 1250); });
  shot('P2', T('wrong'), 'OFFICE', cam(1050, 1500, 1.35, 1.41, 0, 30), (g, s) => {
    hook(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('wrong')) / 0.4));
    drawChar(g, CH.you, { x: 1250, y: FEET - 100 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1.2, arms: [{ to: [880, 2150], hand: 'open' }, { to: [1620, 2150], hand: 'open' }] });
    mark(g, 1250, 1850, '!', s.t, T('wrong') + 0.06);
  });

  // P3 — stakes: hotels, restaurants, banks pop one per word; "almost no money"
  const p3 = (g, s) => {
    const r = S('NYNIGHT', 'sign').r; board(g, r);
    [['hotel', T('hotels', 1)], ['food', T('restaurants')], ['bank', T('banks', 1)]].forEach(([k, t0], i) => {
      const x = r[0] + 260 + i * 440, y = r[1] + 230;
      withPop(g, x, y, s.t, t0, () => (k === 'hotel' ? hotelIcon(g, x, y, 0.9) : k === 'food' ? cloche(g, x, y, 0.9) : bankIcon(g, x, y, 0.9)));
    });
    typeText(g, 'ALMOST NO MONEY', [r[0] + 60, r[1] + 480, r[2] - 120, 220], T('almost'), s.t);
    anna(g, s, walkX(400, 1, K, s.lt * 0.6), { pose: 'walk', walkT: s.lt });
  };
  shot('P3', T('a', 2), 'NYNIGHT', full(40), p3);
  shot('P3b', T('restaurants'), 'NYNIGHT', cam(1000, 1250, 1.15, 1.19, 0, 20), p3);

  // P4/P5 — subject under the spotlight; the name gets crossed out: she was Anna Sorokin
  const stage = (g, s) => {
    typeOn(g, 'STAGE', 'name', 'ANNA\nDELVEY', T('anna', 1), s.t);
    redX(g, S('STAGE', 'name').r, T("wasn't"), s.t);
    popBoard(g, s, [380, 1420, 1300, 360], 'ANNA SOROKIN', T('anna', 2));
    withPop(g, 1000, FEET, s.t, T('her', 2) + 0.05, () => anna(g, s, 1000, { k: 1.2, smile: 0.7, arms: [{ to: [700, 1950 + Math.sin(s.t * 9) * 40], hand: 'open' }, null] }), 'squash');
  };
  shot('P4', T('her', 2), 'STAGE', full(30), stage);
  shot('P5', T('except'), 'STAGE', cam(1080, 1600, 1.2, 1.25, 0, 20), stage);

  // P6 — origin: born near Moscow, 1991; then a small German town
  shot('P6', T('born'), 'MOSCOW', full(40), (g, s) => {
    typeOn(g, 'MOSCOW', 'sign', 'NEAR MOSCOW', T('moscow') - 0.15, s.t);
    dateCard(g, '1991', s.t, T('1991'));
    drawChar(g, CH.pass2, { x: walkX(150, 1, 0.95, s.lt), y: 3250, k: 0.95, face: 1, pose: 'walk', walkT: s.lt, t: s.t });
  });
  shot('P6b', T('she', 2), 'GERMANY', full(40), (g, s) => {
    typeOn(g, 'GERMANY', 'sign', 'SMALL GERMAN\nTOWN', T('german', 1) - 0.1, s.t);
    drawChar(g, CH.teen, { x: walkX(200, 1, 1.0, s.lt), y: FEET, k: 1.0, face: 1, pose: 'walk', walkT: s.lt, t: s.t });
    drawChar(g, CH.pass3, { x: walkX(2000, -1, 0.95, s.lt), y: 3150, k: 0.95, face: -1, pose: 'walk', walkT: s.lt + 0.4, t: s.t });
  });
  // P7 — 2013: New York, a new name, a new story
  shot('P7', T('in', 2), 'NYC', full(40), (g, s) => {
    typeOn(g, 'NYC', 'sign', 'NEW YORK', T('new', 2) - 0.1, s.t);
    dateCard(g, '2013', s.t, T('2013'));
    const x = walkX(250, 1, K, Math.min(s.lt, 2.2));
    anna(g, s, x, { pose: s.lt < 2.2 ? 'walk' : 'stand', walkT: s.lt, arms: [null, { to: [x + 260, 2950], hand: 'fist' }] });
    suitcase(g, x + 300, FEET);
  });
  shot('P7b', T('a', 7), 'NYC', cam(1080, 1500, 1.2, 1.25, 0, 20), (g, s) => {
    popBoard(g, s, [360, 860, 1300, 560], 'GERMAN HEIRESS\n$60M TRUST FUND', T('a', 7));
    anna(g, s, 1100, { smile: 0.9, look: 0.3, arms: [{ to: [800, 2200], hand: 'open' }, { to: [1400, 2200], hand: 'open' }] });
    [0, 1, 2].forEach((i) => withPop(g, 700 + i * 380, 1600, s.t, T('trust') + i * 0.1, () => blob(g, 700 + i * 380, 1600 - ((s.t * 90) % 120), 30, 30, P.gold)));
  });

  // P8–P10 — her act: three parts, each landing on its label
  const lobby = (g, s, upTo) => {
    popBoard(g, s, [200, 650, 820, 300], 'DESIGNER\nCLOTHES', T('designer'));
    withPop(g, 600, 1020, s.t, T('designer'), () => dress(g, 600, 1020), 'squash');
    if (upTo >= 2) {
      popBoard(g, s, [1020, 650, 800, 300], '$100 TIPS', T('hundred-dollar'));
      drawChar(g, CH.clerk, { x: 1650, y: FEET, k: 1.0, face: -1, pose: 'stand', t: s.t, smile: 0.9, arms: [{ to: [1350, 2150], hand: 'open' }, null] });
      [0, 1, 2].forEach((i) => { const t0 = T('hundred-dollar') + 0.15 * i; if (s.t > t0) { const p = clamp((s.t - t0) / 0.6); bill(g, lerp(900, 1380, p), lerp(2300, 2100, p) - Math.sin(p * Math.PI) * 300, p * 6 + i); } });
    }
    if (upTo >= 3) {
      popBoard(g, s, [330, 1480, 1500, 330], 'PRIVATE ART CLUB\nPARK AVENUE', T('art'));
    }
    anna(g, s, 900, { look: 1, smile: 0.7 });
  };
  shot('P8', T('her', 3), 'LOBBY', full(30), (g, s) => lobby(g, s, 1));
  shot('P9', T('hundred-dollar'), 'LOBBY', cam(1200, 1700, 1.15, 1.19, 0, 20), (g, s) => lobby(g, s, 2));
  shot('P10', T('a', 9), 'LOBBY', full(0), (g, s) => lobby(g, s, 3));

  // P11 — title
  shot('P11', T('so', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'SO HOW DID\nIT WORK?', s.t, s.lt, T('so', 1), { size: 96 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[160, 520], [820, 1300], [700, 420]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('work') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P12 — mechanism 1: pure confidence; hotels on "pay later"
  shot('P12', T('pure'), 'STAGE', full(30), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'PURE\nCONFIDENCE', T('pure') + 0.05, s.t);
    anna(g, s, walkX(720, 1, K, s.lt * 0.7), { pose: 'walk', walkT: s.lt, smile: 0.9 });
  });
  shot('P12b', T('she', 4), 'LOBBY', full(30), (g, s) => {
    popBoard(g, s, [280, 650, 1500, 560], 'PAY LATER', T('pay') - 0.1);
    drawChar(g, CH.clerk, { x: 1600, y: FEET, k: 1.0, face: -1, pose: 'stand', t: s.t, smile: 0.6, nod: 3 });
    anna(g, s, 750, { look: 1, arms: [{ to: [1100, 2200], hand: 'open' }, null] });
  });
  // P13 — mechanism 2: fake documents, a $22M loan request
  const p13 = (g, s) => {
    typeOn(g, 'BANK', 'screen', 'LOAN REQUEST\n$22,000,000', T('asked'), s.t);
    withPop(g, 1000, 2350, s.t, T('fake') - 0.05, () => { paper(g, 800, 2050, 400, 500); }, 'squash');
    redX(g, [800, 2050, 400, 500], T('documents'), s.t);
    drawChar(g, CH.banker, { x: 1600, y: FEET, k: 1.0, face: -1, pose: 'stand', t: s.t, look: -1 });
    anna(g, s, 560, { k: 1.0, arms: [null, { to: [800, 2250], hand: 'point' }] });
  };
  shot('P13', T('she', 5), 'BANK', full(30), p13);
  shot('P13b', T('and', 6), 'BANK', cam(1050, 1500, 1.15, 1.19, 0, 20), p13);
  // P14 — mechanism 3: Morocco, a friend stuck with the bill
  const p14 = (g, s) => {
    const rp = clamp((s.t - T('sixty-two-thousand-dollar') + 0.2) / 0.8);
    roundRect(g, 1250, 900, 640, 300 + 900 * rp, 10, '#fbfaf6'); // receipt unrolling
    typeText(g, '$62,000', [1290, 960, 560, 200], T('sixty-two-thousand-dollar'), s.t);
    const j = Math.sin(Math.PI * clamp((s.t - T('bill', 1)) / 0.45));
    drawChar(g, CH.friend, { x: 1500, y: FEET - 150 * j, k: K, face: -1, pose: 'stand', t: s.t, look: -1, arms: [{ to: [1250, 2000 - 200 * j], hand: 'open' }, { to: [1800, 2000 - 200 * j], hand: 'open' }] });
    mark(g, 1500, 1850 - 150 * j, '!', s.t, T('bill', 1));
    anna(g, s, walkX(820, -1, K, Math.max(0, s.t - T('morocco'))), { face: -1, pose: s.t > T('morocco') ? 'walk' : 'stand', walkT: s.t });
  };
  shot('P14', T('a', 12), 'MOROCCO', full(30), p14);
  shot('P14b', T('bill', 1), 'MOROCCO', cam(1250, 1700, 1.25, 1.3, 0, 20), p14);
  // P15 — the bill climbs: $275,000
  shot('P15', T('the', 1), 'WORKSHOP', full(30), (g, s) => {
    const r = [300, 700, 1400, 640];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => board(g, r, '#22252a'));
    const a = T('climbs'), b = T('dollars', 1, 'e');
    const v = Math.round(275000 * Math.pow(clamp((s.t - a) / (b - a)), 1.3) / 100) * 100;
    A.ev('ding', b);
    g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.34}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('$' + v.toLocaleString('en-US'), r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore();
    anna(g, s, 1080, { smile: 0.4 });
  });

  // P16 — October 2017: arrested in a sting; 2019: convicted
  shot('P16', T('october'), 'POLICE', full(30), (g, s) => {
    dateCard(g, 'OCT\n2017', s.t, T('october'));
    typeOn(g, 'POLICE', 'sign', 'ARRESTED', T('arrest'), s.t);
    roundRect(g, 1300, 2500, 760, 420, 60, '#e9eef2'); siren(g, 1680, 2470, s.t);
    drawChar(g, CH.cop, { x: 1500, y: FEET, k: K, face: -1, pose: 'stand', t: s.t, cap: P.navy, arms: [{ to: [1100, 2300], hand: 'open' }, null] });
    anna(g, s, 750, { smile: 0, look: 1, arms: [{ to: [700, 2550], hand: 'fist' }, { to: [800, 2550], hand: 'fist' }] });
  });
  shot('P16b', T('in', 6), 'COURT', full(30), (g, s) => {
    dateCard(g, '2019', s.t, T('2019'));
    typeOn(g, 'COURT', 'board', 'GUILTY\nGRAND LARCENY', T('convicts'), s.t);
    drawChar(g, CH.judge, { x: 1080, y: 2250, k: 0.85, face: 1, pose: 'stand', t: s.t, look: 0.4 });
    roundRect(g, 300, 2000, 1560, 850, 20, '#5a4030'); // bench in front of the judge
    anna(g, s, 1500, { face: -1, look: -1, smile: 0 });
  });

  // P17 — twist: Netflix paid her for the story
  const p17 = (g, s) => {
    popBoard(g, s, [280, 650, 1500, 480], 'FOR HER STORY', T('story', 2) - 0.2);
    cheque(g, s, 1080, 1600, '$320,000', T('three', 2));
    anna(g, s, 1080, { smile: 1, arms: [{ to: [800, 2050], hand: 'open' }, { to: [1360, 2050], hand: 'open' }] });
  };
  shot('P17', T('and', 7), 'LOBBY', full(30), p17);
  shot('P17b', T('netflix'), 'LOBBY', cam(1080, 1700, 1.2, 1.25, 0, 20), p17);

  // P18 — the question; the viewer reacts; sign holds to the end
  const finale = (g, s) => {
    typeOn(g, 'OFFICE', 'board', 'NEED MONEY\nTO LIVE RICH', T('you', 1), s.t);
    redX(g, S('OFFICE', 'board').r, T('wrong'), s.t);
    popBoard(g, s, [260, 1600, 1500, 560], 'WOULD YOU HAVE\nBELIEVED HER?', T('so', 2) + 0.05);
    const up = s.t > T('honest');
    youPhone(g, s, 1300, { look: up ? 0 : -0.6, smile: up ? 0.3 : 0 });
    mark(g, 1650, 2250, '?', s.t, T('believed'));
  };
  shot('P18', T('so', 2), 'OFFICE', full(30), finale);
  shot('P18b', T('would'), 'OFFICE', cam(1050, 2100, 1.25, 1.31, 0, 20), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('born'), T('her', 3), T('october'), T('and', 7), T('so', 2)];
  return { plates, shots, wipes, end: A.duration };
};

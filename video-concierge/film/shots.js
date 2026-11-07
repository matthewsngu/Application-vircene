/* « Le concierge à 8 millions » — flat vector, everything drawn in code.
 * Every cut is anchored on a word: T('mot', occurrence). Occurrences were listed
 * from the script before writing (il ×6, et ×4, à ×4, en ×4, le ×4...).
 */
window.buildFilm = (A) => {
  const { T, C, PW, PH, clamp, lerp, easeOut, spring, hash, typeText, redX, withPop, puff, mark,
    drawChar, dateCard, titleCard, inkFor, textRect, roundRect, blob, tube } = A;

  /* ─── palette (muted: dusty blue-grey, slate teal, warm beige, navy, soft violet) ─── */
  const P = {
    sky: '#cddbe4', sky2: '#b9cbd8', night: '#2f3d55', beige: '#d9c3a5', cream: '#efe6d6', navy: C.navy,
    teal: C.teal, blue: C.blueGrey, violet: C.violet, brick: '#b9826b', grass: '#93a98c', road: '#8a8d93',
    wood: '#a07a58', dark: '#3b3f4a', gold: '#d8b25a', money: '#8fb08a', paper: '#f6f1e4', red: '#c96a5a',
  };

  /* ─── characters ─── */
  const CH = {
    toi: { skin: C.skin, top: '#5d7387', bottom: P.navy, hair: '#4a3426', seed: 1 },
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
  const LEG = 300;
  const walkX = (x0, dir, k, lt) => x0 + dir * (1.5 * LEG * k / 0.9) * lt;

  // Ronald ages along the story: 0 = young mechanic, 1 = 92-year-old.
  const ronald = (age, extra = {}) => ({
    hair: age < 0.35 ? '#5a3b28' : age < 0.7 ? '#8c7a6a' : '#d4d1cb',
    age: clamp((age - 0.3) / 0.7), hunch: 0.13 * clamp((age - 0.55) / 0.45), ...extra,
  });

  /* ─── scenery kit (flat) ─── */
  const rect = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const sky = (g, col = P.sky, floor = 1500, ground = P.road) => {
    rect(g, col, -200, -200, PW + 400, floor + 200);
    rect(g, A.C && ground, -200, floor, PW + 400, PH - floor + 200);
    rect(g, 'rgba(0,0,0,0.06)', -200, floor, PW + 400, 40);
  };
  const cloud = (g, x, y, s, t) => {
    const dx = ((x + t * 25) % (PW + 900)) - 450;
    [[0, 0, 1], [0.9, -0.25, 1.15], [1.9, 0, 0.9]].forEach(([ox, oy, r]) => { g.fillStyle = '#e7eef3'; g.beginPath(); g.arc(dx + ox * 110 * s, y + oy * 110 * s, 110 * s * r, 0, 7); g.fill(); });
  };
  const windows = (g, x, y, w, h, rows, cols, col = '#e8eef2') => {
    const gw = w / cols, gh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      roundRect(g, x + c * gw + gw * 0.18, y + r * gh + gh * 0.18, gw * 0.64, gh * 0.6, 12, col);
    }
  };
  const building = (g, x, y, w, h, col, rows = 2, cols = 4, roof = null) => {
    roundRect(g, x, y, w, h, 16, col);
    if (roof) { g.fillStyle = roof; g.beginPath(); g.moveTo(x - 40, y + 4); g.lineTo(x + w / 2, y - h * 0.22); g.lineTo(x + w + 40, y + 4); g.fill(); }
    windows(g, x + w * 0.05, y + h * 0.08, w * 0.9, h * 0.6, rows, cols);
  };
  const door = (g, x, y, w, h, col = P.teal) => { roundRect(g, x, y, w, h, 18, col); blob(g, x + w * 0.8, y + h * 0.55, 14, 14, P.gold); };
  const tree = (g, x, y, s = 1) => {
    roundRect(g, x - 26 * s, y - 360 * s, 52 * s, 360 * s, 16, P.wood);
    [[-110, -420, 170], [100, -440, 160], [0, -560, 190]].forEach(([dx, dy, r]) => blob(g, x + dx * s, y + dy * s, r * s, r * s * 0.92, '#7f9a7e'));
  };
  const lamp = (g, x, y, h = 900) => { roundRect(g, x - 16, y - h, 32, h, 10, P.dark); blob(g, x, y - h, 50, 36, '#f4e2a8'); };
  const car = (g, x, y, t, k = 1, col = P.blue, spin = 1) => {
    roundRect(g, x - 560 * k, y - 400 * k, 1120 * k, 270 * k, 110 * k, col);
    roundRect(g, x - 330 * k, y - 600 * k, 640 * k, 240 * k, 100 * k, col);
    roundRect(g, x - 270 * k, y - 560 * k, 240 * k, 170 * k, 50 * k, '#dfe8ee');
    roundRect(g, x + 10 * k, y - 560 * k, 240 * k, 170 * k, 50 * k, '#dfe8ee');
    [-340, 340].forEach((dx) => {
      blob(g, x + dx * k, y - 120 * k, 120 * k, 120 * k, '#2c2e35');
      g.save(); g.translate(x + dx * k, y - 120 * k); g.rotate(t * 7 * spin);
      g.fillStyle = '#9aa3ad'; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillRect(-8 * k, 0, 16 * k, 60 * k); }
      g.restore();
    });
  };
  const broom = (g, hand, foot, mop = false) => { // handle from hand to foot
    tube(g, hand, foot, 26, P.wood);
    if (mop) blob(g, foot[0], foot[1], 90, 34, '#d9d4c7'); else roundRect(g, foot[0] - 110, foot[1] - 20, 220, 50, 20, P.gold);
  };
  const certStack = (g, x, y, n, w = 420) => { for (let i = 0; i < n; i++) roundRect(g, x - w / 2 + (hash(i) - 0.5) * 18, y - (i + 1) * 22, w, 26, 6, i % 2 ? P.paper : '#e9dfc8'); };
  const cash = (g, x, y, s = 1) => { roundRect(g, x - 120 * s, y - 60 * s, 240 * s, 120 * s, 16 * s, P.money); blob(g, x, y, 34 * s, 34 * s, shadeDot(P.money)); };
  const shadeDot = (c) => '#6f9069';
  const bag = (g, x, y, s = 1) => { blob(g, x, y, 130 * s, 120 * s, P.beige); roundRect(g, x - 50 * s, y - 160 * s, 100 * s, 60 * s, 20 * s, P.beige);
    g.fillStyle = P.navy; g.font = `800 ${120 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', x, y + 8 * s); };
  const broomIcon = (g, x, y, s = 1) => { g.save(); g.translate(x, y); g.rotate(-0.4); tube(g, [0, -150 * s], [0, 110 * s], 26 * s, P.wood); roundRect(g, -90 * s, 90 * s, 180 * s, 70 * s, 20 * s, P.gold); g.restore(); };
  const snowball = (g, x, y, r, rot) => { blob(g, x, y, r, r, '#f3f6f8'); g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#d9e2e8'; [[0.4, 0.2, 0.18], [-0.35, -0.3, 0.14], [0.1, -0.55, 0.1]].forEach(([a, b, c]) => { g.beginPath(); g.arc(a * r, b * r, c * r, 0, 7); g.fill(); }); g.restore(); };
  const cheque = (g, x, y, amount, t, t0, kind = 'squash') => withPop(g, x, y, t, t0, () => {
    roundRect(g, x - 520, y - 220, 1040, 440, 30, '#fbfaf6');
    rect(g, '#e3ecd9', x - 520, y - 220, 1040, 90);
    typeText(g, amount, [x - 460, y - 80, 920, 200], t0 + 0.15, t, { size: 120 });
  }, kind);
  const piggy = (g, x, y, s = 1) => { blob(g, x, y, 260 * s, 200 * s, '#e9a7a0'); blob(g, x + 230 * s, y - 20 * s, 80 * s, 70 * s, '#e9a7a0');
    rect(g, '#c98a83', x - 60 * s, y - 210 * s, 120 * s, 22 * s); [-150, 100].forEach((d) => roundRect(g, x + d * s, y + 150 * s, 60 * s, 110 * s, 20 * s, '#e9a7a0')); blob(g, x + 120 * s, y - 70 * s, 14 * s, 18 * s, '#1b1b24'); };

  /* ─── plates (3840×2160), painted in code + blank signs written on in code ─── */
  const plates = {
    OFFICE: { paint: (g, t) => { sky(g, '#c9b8a0', 1480, '#8a6a4c'); roundRect(g, 300, 1250, 1300, 420, 30, P.wood); roundRect(g, 3500, 1150, 160, 520, 30, '#7f9a7e'); blob(g, 3580, 1080, 140, 120, '#7f9a7e'); },
      signs: { board: { r: [400, 230, 1500, 760] } } },
    STREET: { paint: (g, t) => { sky(g, P.sky, 1560, P.road); cloud(g, 600, 260, 1, t); cloud(g, 2500, 380, 0.8, t);
        building(g, -60, 640, 1150, 920, P.brick, 2, 3, null); building(g, 2650, 560, 1300, 1000, P.beige, 2, 4, null); tree(g, 1250, 1560, 1.1); lamp(g, 3600, 1560); },
      signs: { bill: { r: [1450, 300, 1150, 640], pole: 620 }, sign: { r: [2780, 1150, 760, 300], pole: 0 } } },
    STAGE: { paint: (g, t) => { sky(g, P.navy, 1600, '#8a6a4c'); rect(g, '#3a2e4f', -200, -200, 760, 2000); rect(g, '#3a2e4f', 3280, -200, 760, 2000);
        const rg = g.createRadialGradient(1750, 1750, 0, 1750, 1750, 800); rg.addColorStop(0, 'rgba(255,236,200,0.6)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(900, 900, 1700, 1700); },
      signs: { name: { r: [2620, 650, 900, 420], pole: 900 } } },
    TOWN: { paint: (g, t) => { sky(g, P.sky, 1580, P.road); cloud(g, 300, 220, 1, t);
        building(g, 120, 700, 900, 880, P.beige, 2, 3, P.brick); building(g, 1150, 600, 1000, 980, P.teal, 3, 3); building(g, 2300, 760, 800, 820, P.violet, 2, 2, P.navy); door(g, 1520, 1200, 260, 380); tree(g, 3400, 1580, 1); },
      signs: { town: { r: [2450, 300, 1200, 380], pole: 0 } } },
    STATION: { paint: (g, t) => { sky(g, '#d8d0c0', 1620, '#9a9da3'); roundRect(g, 200, 380, 2300, 120, 20, P.red); rect(g, '#c4b8a6', 300, 500, 60, 1120); rect(g, '#c4b8a6', 2340, 500, 60, 1120);
        roundRect(g, 2700, 700, 1000, 920, 20, P.cream); door(g, 3050, 1160, 300, 460, P.blue); roundRect(g, 900, 1180, 160, 440, 30, P.red); roundRect(g, 1300, 1180, 160, 440, 30, P.red); },
      signs: { sign: { r: [2750, 300, 900, 360] } } },
    STORE: { paint: (g, t) => { sky(g, '#e9e1d2', 1500, '#cfc6b6'); for (let i = 0; i < 4; i++) { roundRect(g, 150 + i * 960, 700, 700, 760, 20, i % 2 ? P.beige : P.cream); windows(g, 190 + i * 960, 760, 620, 520, 3, 2, i % 2 ? P.violet : P.teal); }
        for (let x = 0; x < PW; x += 240) rect(g, x % 480 ? '#c2b9a8' : '#d6cdbd', x, 1500, 240, 660); },
      signs: { sign: { r: [1100, 180, 1640, 380] } } },
    GARAGE: { paint: (g, t) => { sky(g, '#b7aa98', 1500, '#8d8478'); for (let i = 0; i < 7; i++) rect(g, '#a99c8a', i * 600, 0, 20, 1500);
        roundRect(g, 2500, 1080, 1250, 90, 20, P.wood); roundRect(g, 2560, 1170, 70, 420, 10, P.wood); roundRect(g, 3620, 1170, 70, 420, 10, P.wood); roundRect(g, 260, 260, 900, 560, 20, '#8f8270'); },
      signs: {} },
    CLASS: { paint: (g, t) => { sky(g, P.blue, 1560, '#8a6a4c'); roundRect(g, 2950, 1300, 700, 400, 20, P.wood); },
      signs: { chalk: { kind: 'chalk', r: [520, 200, 2800, 1100], frame: P.wood } } },
    HILL: { paint: (g, t) => { sky(g, '#c3d3df', 2100, '#e9eff3'); cloud(g, 200, 240, 1.2, t); cloud(g, 2200, 160, 0.9, t);
        g.fillStyle = '#eef3f6'; g.beginPath(); g.moveTo(-200, 600); g.quadraticCurveTo(1600, 900, 4040, 1900); g.lineTo(4040, 2400); g.lineTo(-200, 2400); g.fill();
        g.fillStyle = '#dde6ec'; g.beginPath(); g.moveTo(-200, 700); g.quadraticCurveTo(1600, 1000, 4040, 2000); g.lineTo(4040, 2400); g.lineTo(-200, 2400); g.fill();
        [500, 1500].forEach((x) => { blob(g, x, 760 + x * 0.12, 90, 160, '#7f9a7e'); }); },
      signs: { sign: { r: [2300, 200, 1200, 620], pole: 640 } } },
    WORKSHOP: { paint: (g, t) => { sky(g, '#3d4658', 1600, '#4a4f5a'); const rg = g.createRadialGradient(1920, 200, 0, 1920, 200, 1300); rg.addColorStop(0, 'rgba(255,236,200,0.35)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, PW, 1600); },
      signs: { screen: { kind: 'screen', r: [2300, 260, 1250, 640], frame: '#8a7660' } } },
    VAULT: { paint: (g, t) => { sky(g, '#7b8794', 1560, '#5d6670'); for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) roundRect(g, 120 + c * 400, 120 + r * 330, 360, 290, 16, '#a9b3bc'); },
      signs: { screen: { kind: 'screen', r: [2450, 1050, 1150, 420], frame: '#5d6670' } } },
    LIVING: { paint: (g, t) => { sky(g, '#c9b39a', 1460, '#8a6a4c'); roundRect(g, 900, 1020, 2000, 500, 90, P.teal); roundRect(g, 3300, 900, 300, 620, 20, P.wood); },
      signs: { frame: { r: [1350, 250, 1100, 520], frame: P.gold } } },
    HOSPITAL: { paint: (g, t) => { sky(g, P.sky, 1600, P.road); cloud(g, 400, 220, 1, t); building(g, 500, 520, 2840, 1080, '#e9eef2', 3, 7); door(g, 1700, 1150, 440, 450, P.teal); rect(g, P.red, 1880, 340, 80, 240); rect(g, P.red, 1800, 420, 240, 80); },
      signs: { sign: { r: [1000, 560, 1840, 280] } } },
    LIBRARY: { paint: (g, t) => { sky(g, P.sky, 1600, P.road); cloud(g, 2600, 200, 1, t); roundRect(g, 500, 640, 2840, 960, 16, P.beige);
        g.fillStyle = P.brick; g.beginPath(); g.moveTo(400, 650); g.lineTo(1920, 260); g.lineTo(3440, 650); g.fill(); for (let i = 0; i < 6; i++) roundRect(g, 700 + i * 480, 960, 110, 640, 20, P.cream); },
      signs: { sign: { r: [1100, 680, 1640, 240] } } },
  };
  const S = (pl, name) => plates[pl].signs[name];
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => { const s = S(pl, name); return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt }); };

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });
  const ageAt = (t) => clamp((t - T('ses', 1)) / (T('millions', 2) - T('ses', 1))) * 0.7 + 0.3; // mid → old during the mechanism

  // P1 — hook: the big-salary belief, played literally
  const office = (g, s, xOn) => {
    typeOn(g, 'OFFICE', 'board', 'GROS SALAIRE\n= MILLIONNAIRE', T('gros', 1), s.t);
    if (xOn) redX(g, S('OFFICE', 'board').r, T('faux'), s.t);
  };
  shot('P1', 0, 'OFFICE', cam(1700, 1080, 1.04, 1.08, 120, 0), (g, s) => {
    office(g, s, false);
    drawChar(g, CH.toi, { x: 2300, y: 1900, k: 0.95, face: -1, pose: 'stand', t: s.t, look: -0.6,
      arms: [{ to: [2050, 1180], hand: 'open' }, { to: [2120, 1150], hand: 'open' }] });
    roundRect(g, 1960, 1060, 180, 240, 10, P.paper); // pay slip in hands
    typeText(g, '2 000 €', [1965, 1120, 170, 80], 0.4, s.t, { size: 40 });
  });
  shot('P2', T('faux'), 'OFFICE', cam(1300, 760, 1.5, 1.57, 50, 0), (g, s) => {
    office(g, s, true);
    const j = Math.sin(Math.PI * clamp((s.t - T('faux')) / 0.4));
    drawChar(g, CH.toi, { x: 2300, y: 1900 - 90 * j, k: 0.95, face: -1, pose: 'stand', t: s.t, look: -1.2,
      arms: [{ to: [2000, 1000], hand: 'open' }, { to: [2600, 1000], hand: 'open' }] });
    mark(g, 2300, 820, '!', s.t, T('faux') + 0.06);
  });

  // P3 — stakes: one shocking line, icons popping one per word
  shot('P3', T('un', 2), 'STREET', cam(2000, 900, 1.08, 1.13, 80, 0), (g, s) => {
    const b = S('STREET', 'bill').r;
    [['broom', 'concierge'], ['cash', 'huit'], ['bag', 'dollars']].forEach(([k, w], i) => {
      const x = b[0] + b[2] * (0.2 + i * 0.3), y = b[1] + b[3] * 0.34;
      withPop(g, x, y, s.t, T(w), () => (k === 'broom' ? broomIcon(g, x, y, 0.9) : k === 'cash' ? cash(g, x, y, 1.1) : bag(g, x, y, 0.8)));
    });
    typeOn(g, 'STREET', 'bill', '8 000 000 $', T('millions', 1), s.t, { r: [b[0] + 60, b[1] + b[3] * 0.62, b[2] - 120, b[3] * 0.3] });
    drawChar(g, CH.ronald, { x: 900, y: 1950, k: 0.85, face: 1, pose: 'stand', t: s.t, ...ronald(0.85), arms: [{ to: [1150, 1450], hand: 'fist' }, { to: [1180, 1600], hand: 'fist' }] });
    broom(g, [1160, 1450], [1300, 1940]);
  });
  // P4 — "personne ne s'en doutait": passers-by shrug and move on
  shot('P4', T('personne'), 'STREET', cam(2600, 1150, 1.12, 1.17, -100, 0), (g, s) => {
    typeOn(g, 'STREET', 'sign', 'PERSONNE\nNE SAVAIT', T('personne') + 0.05, s.t);
    const sh = Math.sin(clamp((s.t - T('doutait')) / 0.5) * Math.PI);
    drawChar(g, CH.pass1, { x: walkX(1400, 1, 0.8, s.lt), y: 1950, k: 0.8, face: 1, pose: 'walk', walkT: s.lt, t: s.t });
    drawChar(g, CH.pass2, { x: 2350, y: 1950, k: 0.8, face: -1, pose: 'stand', t: s.t, arms: [{ to: [2150, 1250 - sh * 120], hand: 'open' }, { to: [2550, 1250 - sh * 120], hand: 'open' }] });
    drawChar(g, CH.pass3, { x: walkX(3900, -1, 0.8, s.lt), y: 1980, k: 0.8, face: -1, pose: 'walk', walkT: s.lt + 0.4, t: s.t });
  });

  // P5 — subject under a spotlight
  shot('P5', T('il', 1), 'STAGE', cam(1920, 1150, 1.05, 1.09, -60, 0), (g, s) => {
    typeOn(g, 'STAGE', 'name', 'RONALD\nREAD', T('ronald', 1), s.t);
    withPop(g, 1750, 1720, s.t, s.t0 + 0.05, () => drawChar(g, CH.ronald, { x: 1750, y: 1720, k: 1, face: 1, pose: 'stand', t: s.t, cap: P.navy, smile: 0.8, ...ronald(0.2),
      arms: [{ to: [1420, 520 + Math.sin(s.lt * 9) * 50], hand: 'open' }, null] }), 'squash');
  });

  // P6 — origin: real place on its own sign, date card, people in and out
  shot('P6', T('né'), 'TOWN', cam(1920, 1100, 1.02, 1.06, 100, 0), (g, s) => {
    typeOn(g, 'TOWN', 'town', 'BRATTLEBORO\nVERMONT', T('brattleboro'), s.t);
    drawChar(g, CH.pass2, { x: walkX(1650, -1, 0.7, s.lt), y: 1820, k: 0.7, face: -1, pose: 'walk', walkT: s.lt, t: s.t });
    drawChar(g, CH.pass1, { x: walkX(900, 1, 0.75, s.lt), y: 1880, k: 0.75, face: 1, pose: 'walk', walkT: s.lt + 0.3, t: s.t });
    drawChar(g, CH.pass3, { x: walkX(2900, -1, 0.72, s.lt), y: 1850, k: 0.72, face: -1, pose: 'walk', walkT: s.lt + 0.6, t: s.t });
    dateCard(g, '1921', s.t, T('1921'));
  });
  // P7 — 25 years at the gas station (young Ronald under the hood)
  shot('P7', T('il', 2), 'STATION', cam(2050, 1150, 1.04, 1.08, 0, 0), (g, s) => {
    typeOn(g, 'STATION', 'sign', 'STATION-SERVICE\n25 ANS', T('vingt-cinq'), s.t);
    car(g, 1700, 1700, s.t * 0, 1, P.violet, 0);
    drawChar(g, CH.ronald, { x: 2350, y: 1720, k: 0.85, face: -1, pose: 'stand', t: s.t, cap: P.navy, ...ronald(0.15),
      arms: [{ to: [1950, 1250], hand: 'fist', scribble: true }, { to: [2000, 1300], hand: 'fist', scribble: true }] });
  });
  // P8 — 17 years mopping a department store
  shot('P8', T('puis'), 'STORE', cam(1920, 1150, 1.04, 1.08, 80, 0), (g, s) => {
    typeOn(g, 'STORE', 'sign', 'GRAND MAGASIN\n17 ANS', T('dix-sept'), s.t);
    drawChar(g, CH.pass3, { x: walkX(400, 1, 0.75, s.lt), y: 1850, k: 0.75, face: 1, pose: 'walk', walkT: s.lt, t: s.t });
    drawChar(g, CH.pass2, { x: walkX(3500, -1, 0.75, s.lt), y: 1880, k: 0.75, face: -1, pose: 'walk', walkT: s.lt + 0.5, t: s.t });
    const sw = Math.sin(s.t * 3) * 120;
    drawChar(g, CH.ronald, { x: 1920, y: 1950, k: 0.9, face: 1, pose: 'stand', t: s.t, top: '#7d8590', ...ronald(0.4),
      arms: [{ to: [2100 + sw * 0.4, 1350], hand: 'fist' }, { to: [2160 + sw * 0.5, 1550], hand: 'fist' }] });
    broom(g, [2120 + sw * 0.4, 1350], [2300 + sw, 1950], true);
  });

  // P9–P11 — the three things, each landing on its label
  const garage = (g, s, upTo) => {
    const label = (r, text, t0) => { // label board pops in with its object, then the name is typed
      withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, t0, () => { roundRect(g, r[0] - 20, r[1] - 20, r[2] + 40, r[3] + 40, 24, '#8a7660'); roundRect(g, r[0], r[1], r[2], r[3], 12, '#fbfaf6'); });
      if (s.t > t0 + 0.2) typeText(g, text, r, t0 + 0.2, s.t);
    };
    label([200, 400, 880, 300], "VOITURE\nD'OCCASION", T('voiture'));
    if (upTo >= 2) label([1700, 260, 900, 300], 'MANTEAU\n+ ÉPINGLES', T('manteau'));
    if (upTo >= 3) label([2700, 400, 900, 300], 'ACTIONS\nSOLIDES', T('actions', 1));
    const cy = s.t < T('voiture') ? -3000 : -900 * (1 - spring(s.t - T('voiture'), 2.2, 0.45));
    car(g, 1050, 1900 + cy, s.t * 0, 0.85, '#9aa7b4', 0);
    if (s.t > T('voiture') + 0.35) puff(g, 1050, 1900, 300, s.t, T('voiture') + 0.35);
    withPop(g, 2150, 900, s.t, T('manteau'), () => { // coat on a hanger, held by pins
      tube(g, [2000, 700], [2300, 700], 18, P.dark); roundRect(g, 1980, 720, 340, 560, 80, '#7b6a58');
      [800, 940, 1080].forEach((y) => { g.strokeStyle = '#c9ced4'; g.lineWidth = 10; g.beginPath(); g.moveTo(2130, y); g.lineTo(2190, y + 20); g.stroke(); blob(g, 2130, y, 12, 12, '#c9ced4'); });
    }, 'squash');
    if (s.t >= T('actions', 1)) { A.ev('pop', T('actions', 1)); certStack(g, 3150, 1080, Math.min(14, Math.floor((s.t - T('actions', 1)) * 40))); }
  };
  const ron9 = (g, s) => drawChar(g, CH.ronald, { x: 1650, y: 1950, k: 0.8, face: s.t < T('voiture') + 0.3 ? -1 : 1, pose: 'stand', t: s.t, look: -1, smile: s.t > T('voiture') + 0.3 ? 0.5 : 0, ...ronald(0.5),
    arms: s.t < T('voiture') ? [{ to: [1350, 1050], hand: 'point' }, null] : null });
  shot('P9', T('sa', 1), 'GARAGE', cam(1250, 1100, 1.2, 1.26, 60, 0), (g, s) => { garage(g, s, 1); ron9(g, s); });
  shot('P10', T('un', 4), 'GARAGE', cam(2150, 800, 2.0, 2.06, 20, 0), (g, s) => garage(g, s, 2));
  shot('P11', T('et', 1), 'GARAGE', cam(1920, 1080, 1.0, 1.03, 0, 0), (g, s) => {
    garage(g, s, 3);
    drawChar(g, CH.ronald, { x: 1650, y: 1950, k: 0.8, face: 1, pose: 'stand', t: s.t, smile: 0.6, ...ronald(0.5), arms: [null, { to: [2950, 1050], hand: 'point' }] });
  });

  // P12 — title
  shot('P12', T('alors', 1), null, null, (g, s) => {
    titleCard(g, 'purple', 'ALORS, COMMENT\nÇA MARCHE ?', s.t, s.lt, T('alors', 1), { size: 92 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[260, 300], [1650, 760], [1500, 250]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('marche') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P13 — mechanism 1: the dividend loop on a blackboard
  const board = (g, s) => {
    const r = S('CLASS', 'chalk').r;
    typeOn(g, 'CLASS', 'chalk', 'ACTIONS', T('ses', 1), s.t, { r: [r[0] + 100, r[1] + 120, 900, 220] });
    typeOn(g, 'CLASS', 'chalk', 'DIVIDENDES', T('dividendes'), s.t, { r: [r[0] + 1700, r[1] + 120, 1000, 220] });
    // chalk arrows drawn progressively: actions → dividendes (top), dividendes → actions (loop back, bottom)
    const k1 = clamp((s.t - T('versent')) / 0.5), k2 = clamp((s.t - T('réinvestit')) / 0.6);
    g.save(); g.strokeStyle = C.chalk; g.lineWidth = 16; g.lineCap = 'round';
    if (k1 > 0) { g.beginPath(); g.moveTo(r[0] + 1050, r[1] + 230); g.lineTo(r[0] + 1050 + 600 * k1, r[1] + 230); g.stroke(); }
    if (k2 > 0) { // curved return arrow dividendes → actions, drawn between the two text rows
      const a0 = [r[0] + 2200, r[1] + 380], c = [r[0] + 1400, r[1] + 600], a1 = [r[0] + 550, r[1] + 380];
      g.beginPath(); g.moveTo(a0[0], a0[1]);
      for (let i = 1; i <= 30 * k2; i++) { const u = i / 30; g.lineTo((1 - u) * (1 - u) * a0[0] + 2 * (1 - u) * u * c[0] + u * u * a1[0], (1 - u) * (1 - u) * a0[1] + 2 * (1 - u) * u * c[1] + u * u * a1[1]); }
      g.stroke();
    }
    g.restore();
    typeOn(g, 'CLASS', 'chalk', 'DÉPENSER', T('dépense') - 0.3, s.t, { r: [r[0] + 300, r[1] + 640, 900, 240] });
    redX(g, [r[0] + 300, r[1] + 640, 900, 240], T('pas'), s.t);
    typeOn(g, 'CLASS', 'chalk', 'RÉINVESTIR', T('réinvestit'), s.t, { r: [r[0] + 1450, r[1] + 640, 900, 240] });
    drawChar(g, CH.ronald, { x: 3150, y: 1960, k: 0.85, face: -1, pose: 'stand', t: s.t, ...ronald(ageAt(s.t)),
      arms: [{ to: [2750, 1000], hand: 'point' }, null] });
  };
  shot('P13', T('ses', 1), 'CLASS', cam(1920, 950, 1.06, 1.1, -60, 0), board);
  shot('P13b', T('ronald', 2), 'CLASS', cam(2000, 1000, 1.35, 1.41, 0, 0), board);

  // P14 — mechanism 2: the snowball doubles every ten years
  const hill = (g, s) => {
    const a = T('à', 1), b = T('millions', 2);
    const p = clamp((s.t - a) / (b - a));
    const doublings = Math.min(6, Math.floor(p * 7));
    for (let d = 1; d <= 6; d++) A.ev('ding', a + (d / 7) * (b - a));
    const x = lerp(200, 3300, p), y = 600 + (x + 200) * 0.32 + 0.0001 * (x * x) * 0.3;
    const r = 95 * Math.pow(2, doublings / 2.4) * (1 + 0.15 * ((p * 7) % 1));
    const sr = S('HILL', 'sign').r;
    typeOn(g, 'HILL', 'sign', '×2 TOUS\nLES 10 ANS', T('double'), s.t, { r: [sr[0] + 40, sr[1] + 30, sr[2] - 80, sr[3] * 0.5] });
    typeOn(g, 'HILL', 'sign', '1 $ → 64 $', T('soixante-quatre'), s.t, { r: [sr[0] + 40, sr[1] + sr[3] * 0.56, sr[2] - 80, sr[3] * 0.38] });
    snowball(g, x, Math.min(y, 2000) - r, r, x / Math.max(30, r));
    g.save(); g.fillStyle = C.ink; g.font = `800 ${Math.max(60, r * 0.5)}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (doublings > 0) g.fillText('×' + Math.pow(2, doublings), x, Math.min(y, 2000) - r); g.restore();
  };
  shot('P14', T('à', 1), 'HILL', cam(1500, 1000, 1.02, 1.06, 200, 0), hill);
  shot('P14b', T('en', 3), 'HILL', cam(2600, 1100, 1.2, 1.25, 120, 0), hill);

  // P15 — 2008: Lehman Brothers collapses, he keeps going; then the counter
  shot('P15', T('même', 1), 'WORKSHOP', cam(2700, 1050, 1.25, 1.31, -60, 0), (g, s) => {
    typeOn(g, 'WORKSHOP', 'screen', 'LEHMAN\nBROTHERS', T('lehman'), s.t);
    redX(g, S('WORKSHOP', 'screen').r, T("s'effondre"), s.t);
    dateCard(g, '2008', s.t, T('2008'));
    const sw = Math.sin(s.t * 3) * 100;
    drawChar(g, CH.ronald, { x: 1900, y: 1960, k: 0.9, face: 1, pose: 'stand', t: s.t, top: '#7d8590', ...ronald(ageAt(s.t)),
      arms: [{ to: [2080 + sw * 0.4, 1380], hand: 'fist' }, { to: [2140 + sw * 0.5, 1560], hand: 'fist' }] });
    broom(g, [2100 + sw * 0.4, 1380], [2280 + sw, 1960]);
  });
  shot('P15b', T('le', 3), 'WORKSHOP', cam(1920, 900, 1.04, 1.09, 0, 20), (g, s) => {
    const r = [520, 260, 2800, 760];
    withPop(g, r[0] + r[2] / 2, r[1] + r[3] / 2, s.t, s.t0, () => { roundRect(g, r[0] - 24, r[1] - 24, r[2] + 48, r[3] + 48, 30, '#8a7660'); roundRect(g, r[0], r[1], r[2], r[3], 14, '#22252a'); });
    const a = T('compteur'), b = T('millions', 2, 'e');
    const v = Math.round(8000000 * Math.pow(clamp((s.t - a) / (b - a)), 1.6) / 1000) * 1000;
    A.ev('ding', b);
    const txt = v.toLocaleString('fr-FR').replace(/ | /g, ' ') + ' $';
    g.save(); g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.42}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, r[0] + r[2] / 2, r[1] + r[3] / 2); g.restore();
    drawChar(g, CH.ronald, { x: 1920, y: 1980, k: 0.75, face: 1, pose: 'stand', t: s.t, top: '#7d8590', ...ronald(ageAt(s.t)), look: 0, smile: 0.4 });
  });

  // P16 — June 2014: the safe, 12 cm of certificates
  const vault = (g, s) => {
    dateCard(g, 'JUIN\n2014', s.t, T('juin'));
    const open = clamp((s.t - T('coffre')) / 0.5);
    roundRect(g, 1100, 1000, 900, 560, 20, '#6d7782'); // open safe box
    g.save(); g.translate(1100, 1000); g.scale(1 - 0.85 * open, 1); roundRect(g, 0, 0, 900, 560, 20, '#9aa5b0'); blob(g, 700, 280, 70, 70, '#c9ced4'); g.restore();
    if (open > 0.6) certStack(g, 1550, 1520, Math.min(18, Math.floor((s.t - T('coffre') - 0.3) * 30)), 640);
    typeOn(g, 'VAULT', 'screen', '12 CM DE\nCERTIFICATS', T('douze'), s.t);
    drawChar(g, CH.rel2, { x: 1980, y: 1960, k: 0.85, face: -1, pose: 'stand', t: s.t, look: -1, arms: [{ to: [1650, 1300], hand: 'point' }, null] });
  };
  shot('P16', T('juin'), 'VAULT', cam(1920, 1100, 1.04, 1.09, 80, 0), vault);
  shot('P16b', T('dans', 4), 'VAULT', cam(2250, 1150, 1.4, 1.47, 0, 0), vault);
  // P17 — even his family are stunned
  shot('P17', T('même', 2), 'LIVING', cam(1920, 1100, 1.06, 1.1, -80, 0), (g, s) => {
    typeOn(g, 'LIVING', 'frame', 'RONALD ?!', T('même', 2) + 0.1, s.t);
    const tn = T('nues');
    [[CH.rel1, 1100, 0], [CH.rel2, 1920, 0.08], [CH.rel3, 2750, 0.16]].forEach(([c, x, d]) => {
      const j = Math.max(0, Math.sin(Math.PI * clamp((s.t - tn - d) / 0.45)));
      drawChar(g, c, { x, y: 1950 - j * 240, k: 0.85, face: x < 1920 ? 1 : -1, pose: 'stand', t: s.t, look: 0,
        arms: [{ to: [x - 260, 1000 - j * 200], hand: 'open' }, { to: [x + 260, 1000 - j * 200], hand: 'open' }] });
      mark(g, x, 820 - j * 240, '!', s.t, tn + d);
    });
  });

  // P18 — twist that loops to the hook: no big salary, just time
  const twist = (g, s) => {
    const r = S('OFFICE', 'board').r;
    typeText(g, 'GROS SALAIRE ?', [r[0] + 60, r[1] + 60, r[2] - 120, r[3] * 0.4], T('et', 2) + 0.1, s.t);
    redX(g, [r[0] + 60, r[1] + 60, r[2] - 120, r[3] * 0.4], T('jamais'), s.t);
    typeText(g, 'LE TEMPS', [r[0] + 60, r[1] + r[3] * 0.52, r[2] - 120, r[3] * 0.42], T('temps'), s.t);
  };
  shot('P18', T('et', 2), 'OFFICE', cam(1150, 650, 1.45, 1.52, 40, 0), twist);
  shot('P18b', T('juste'), 'OFFICE', cam(1150, 820, 1.8, 1.88, 30, 0), twist);
  // P19 — the bequests
  shot('P19', T('et', 3), 'HOSPITAL', cam(1920, 1050, 1.03, 1.07, 60, 0), (g, s) => {
    typeOn(g, 'HOSPITAL', 'sign', 'HÔPITAL DE BRATTLEBORO', T('et', 3) + 0.1, s.t);
    cheque(g, 1920, 1250, '4 800 000 $', s.t, T("l'hôpital"));
    const cl = Math.abs(Math.sin(s.t * 12)) * 60;
    [[CH.nurse, 900, 1], [CH.rel3, 2950, -1]].forEach(([c, x, f]) => drawChar(g, c, { x, y: 1980, k: 0.8, face: f, pose: 'stand', t: s.t, smile: 0.8,
      arms: s.t > T("l'hôpital") + 0.3 ? [{ to: [x - 40, 1180 + cl], hand: 'open' }, { to: [x + 40, 1180 + cl], hand: 'open' }] : null }));
  });
  shot('P19b', T('à', 4), 'LIBRARY', cam(1920, 1050, 1.03, 1.07, -60, 0), (g, s) => {
    typeOn(g, 'LIBRARY', 'sign', 'BIBLIOTHÈQUE', T('à', 4) + 0.1, s.t);
    cheque(g, 1920, 1250, '1 200 000 $', s.t, T('bibliothèque'));
    drawChar(g, CH.reader, { x: 3000, y: 1980, k: 0.8, face: s.t > T('bibliothèque') + 0.2 ? -1 : 1, pose: 'stand', t: s.t, look: -1 });
    mark(g, 3000, 860, '!', s.t, T('bibliothèque') + 0.25);
  });

  // P20 — the question; the viewer from the hook reacts; sign holds to the end
  const finale = (g, s) => {
    typeOn(g, 'OFFICE', 'board', 'GROS SALAIRE\n= MILLIONNAIRE', T('gros', 1), s.t);
    redX(g, S('OFFICE', 'board').r, T('faux'), s.t);
    const b2 = [2600, 300, 1050, 580], t2 = T('alors', 2) + 0.05;
    withPop(g, b2[0] + b2[2] / 2, b2[1] + b2[3] / 2, s.t, t2, () => { roundRect(g, b2[0] - 24, b2[1] - 24, b2[2] + 48, b2[3] + 48, 30, '#8a7660'); roundRect(g, b2[0], b2[1], b2[2], b2[3], 14, '#fbfaf6'); });
    if (s.t > t2 + 0.25) typeText(g, 'ET TOI,\nCOMBIEN ?', b2, t2 + 0.25, s.t);
    withPop(g, 3150, 1680, s.t, T('côté') - 0.1, () => piggy(g, 3150, 1680, 0.7), 'squash');
    const rx = s.t > T('aujourd\'hui');
    drawChar(g, CH.toi, { x: 2300, y: 1950, k: 0.95, face: -1, pose: 'stand', t: s.t, look: rx ? 0 : -1, smile: rx ? 0.5 : 0,
      arms: rx ? [{ to: [2120, 900], hand: 'open' }, { to: [2650, 1150], hand: 'point' }] : null });
    mark(g, 2550, 800, '?', s.t, T('combien'));
  };
  shot('P20', T('alors', 2), 'OFFICE', cam(2000, 1000, 1.03, 1.07, 40, 0), finale);
  shot('P20b', T('combien'), 'OFFICE', cam(2880, 820, 2.0, 2.06, 0, 0), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  const wipes = [T('né'), T('sa', 1), T('juin'), T('et', 2), T('alors', 2)];
  return { plates, shots, wipes, end: A.duration };
};

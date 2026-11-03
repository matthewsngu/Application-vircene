/* « 11 jours sans dormir » — one function per shot.
 * Cuts are anchored on words (T('mot', occurrence)), never on fixed seconds,
 * so swapping estimated timings for faster-whisper ones re-times everything.
 */
window.buildFilm = (A) => {
  const { T, C, PW, PH, clamp, lerp, easeOut, spring, hash, typeText, redX, withPop, puff, mark,
    drawChar, dateCard, titleCard, inkFor, textRect, roundRect, blob, tube } = A;

  /* ─── characters (placeholders until sprite sheets arrive) ─── */
  const CH = {
    toi: { skin: C.skin, top: '#5d7387', bottom: C.navy, hair: '#4a3426', seed: 1 },
    randy: { skin: C.skin, top: C.navy, bottom: '#c9b08a', hair: '#e0bd6a', seed: 2 },
    bruce: { skin: C.skin, top: C.violet, bottom: '#7d8288', hair: '#7a5233', glasses: true, seed: 3 },
    joe: { skin: C.skin, top: C.blueGrey, bottom: C.navy, hair: '#1f1b1b', seed: 4 },
    dement: { skin: C.skin, top: C.navy, bottom: '#3a3f4a', hair: '#4a3426', glasses: true, coat: true, seed: 5 },
    eleve1: { skin: C.skin, top: C.blueGrey, bottom: '#c9b08a', hair: '#6a4630', hairStyle: 'tail', seed: 6 },
    eleve2: { skin: C.skin, top: '#efe9dd', bottom: C.navy, hair: '#2e2420', seed: 7 },
  };
  const LEG = 300; // leg length at k=1 → walk speed = 1.5 legs per 0.9 s cycle
  const walkX = (x0, dir, k, lt) => x0 + dir * (1.5 * LEG * k / 0.9) * lt;

  /* ─── plates: placeholder geometry + blank sign rectangles (plate px) ─── */
  const plates = {
    PL01: { wall: '#4d5c7c', ground: '#76665a', floor: 1450, lights: [[2350, 1050, 700]],
      props: [[400, 1200, 1700, 450, '#8a9bb5', 60], [450, 1080, 420, 200, '#e9e4da', 80], [2150, 1300, 420, 450, '#9b7b5c', 30], [2950, 250, 700, 800, '#1f2a44', 20]],
      signs: { card1: { kind: 'cork', r: [700, 230, 900, 560] }, card2: { kind: 'cork', r: [1800, 230, 900, 560] }, clock: { kind: 'screen', r: [2220, 1150, 280, 120], frame: '#3a3a40' } } },
    PL02: { wall: '#222c42', ground: '#383c44', floor: 1640, lights: [[1500, 300, 500], [3300, 300, 500]],
      props: [[-100, 1880, 4040, 30, '#d9c3a5', 0]],
      signs: { road: { r: [250, 420, 760, 420], pole: 1250 }, board: { r: [1900, 220, 1700, 820], pole: 640 } } },
    PL03: { wall: '#2c3e5c', ground: '#8a6a4c', floor: 1600, lights: [[1750, 1750, 800]],
      props: [[-100, -100, 700, 2000, '#3a2e4f', 0], [3240, -100, 700, 2000, '#3a2e4f', 0]],
      signs: { name: { r: [2650, 650, 860, 420], pole: 900 } } },
    PL04: { wall: '#a9c3d9', ground: '#cbbfae', floor: 1620,
      props: [[300, 560, 3240, 1080, '#d9c3a5', 40], [1640, 1060, 560, 580, '#4f7c86', 20], [120, 700, 90, 950, '#8a6a4c', 40], [3640, 700, 90, 950, '#8a6a4c', 40]],
      signs: { school: { r: [1020, 660, 1800, 300] } } },
    PL05: { wall: '#c9b08a', ground: '#b8895c', floor: 1520,
      props: [[200, 1250, 900, 300, '#6f8299', 20], [2740, 1250, 900, 300, '#6f8299', 20]],
      signs: { board: { r: [1250, 230, 1500, 760] } } },
    PL06: { wall: '#8f7c6a', ground: '#6a5646', floor: 1450, lights: [[3400, 600, 600]],
      props: [[1050, 1000, 1740, 520, '#4f7c86', 90]],
      signs: { s1: { r: [250, 560, 640, 260], pole: 1000 }, s2: { r: [2330, 520, 600, 250], pole: 1060 }, s3: { r: [3000, 480, 780, 340], pole: 1060 } } },
    PL07: { wall: '#6f8299', ground: '#8a6a4c', floor: 1560,
      props: [[2950, 1300, 700, 400, '#9b7b5c', 20]],
      signs: { chalk: { kind: 'chalk', r: [600, 220, 2640, 1080], frame: '#8a6a4c' } } },
    PL08: { wall: '#9fb0b8', ground: '#5d6670', floor: 1560,
      props: [[300, 650, 1300, 950, '#c9c0b0', 40], [450, 780, 1000, 380, '#f4f1ea', 10]],
      signs: { screen: { kind: 'screen', r: [2050, 300, 1500, 860], frame: '#c9c0b0' } } },
    PL09: { wall: '#2c3e5c', ground: '#454a55', floor: 1600, lights: [[1920, 200, 1200]],
      signs: { flap: { kind: 'flap', r: [620, 260, 2600, 900], frame: '#8a7660' } } },
    PL10: { wall: '#a9c3d9', ground: '#cbbfae', floor: 1560,
      props: [[0, 700, 1500, 860, '#d9c3a5', 30], [2600, 800, 1300, 760, '#c9b08a', 30], [200, 1380, 700, 260, '#8e7cc3', 80]],
      signs: { street: { r: [2250, 520, 900, 260], pole: 1000 } } },
    PL11: { wall: '#a9c3d9', ground: '#71906c', floor: 1450,
      props: [[0, 900, 3840, 520, '#8a9bb5', 0]],
      signs: { field: { r: [2450, 480, 1100, 560], pole: 700 } } },
    PL12: { wall: '#e8d9c0', ground: '#a58a6a', floor: 1500,
      props: [[2500, 1250, 1100, 300, '#d9a0a0', 30], [2400, 500, 1300, 500, '#a9c3d9', 30]],
      signs: { board: { r: [400, 260, 1700, 1000], pole: 300 } } },
    PL13: { wall: '#c9b8a0', ground: '#8a6a4c', floor: 1450, lights: [[3200, 500, 700]],
      props: [[1100, 1250, 1640, 400, '#8e7cc3', 60], [1150, 1130, 380, 180, '#efe9dd', 70]],
      signs: { board: { kind: 'cork', r: [1300, 200, 1240, 700] } } },
  };
  const S = (pl, name) => plates[pl].signs[name];
  // Type on a blank sign of the plate (always the plate's own rectangle).
  const typeOn = (g, pl, name, text, t0, t, opt = {}) => {
    const s = S(pl, name);
    return typeText(g, text, opt.r || textRect(s), t0, t, { color: inkFor(s), ...opt });
  };
  const signPop = (g, pl, name, t, t0) => { const s = S(pl, name); puff(g, s.r[0] + s.r[2] / 2, s.r[1] + s.r[3] / 2, s.r[2] * 0.4, t, t0); };

  /* ─── small drawn props ─── */
  function car(g, x, y, t, k = 1) {
    roundRect(g, x - 620 * k, y - 430 * k, 1240 * k, 300 * k, 120 * k, C.blueGrey);
    roundRect(g, x - 380 * k, y - 640 * k, 720 * k, 260 * k, 110 * k, C.blueGrey);
    g.fillStyle = '#1f2a44'; g.beginPath(); g.roundRect(x - 300 * k, y - 600 * k, 560 * k, 190 * k, 60 * k); g.fill();
    [-380, 380].forEach((dx) => {
      blob(g, x + dx * k, y - 120 * k, 130 * k, 130 * k, '#2a2a30');
      g.save(); g.translate(x + dx * k, y - 120 * k); g.rotate(t * 9);
      g.fillStyle = '#9aa3ad'; for (let i = 0; i < 3; i++) { g.rotate(Math.PI * 2 / 3); g.fillRect(-10 * k, 0, 20 * k, 70 * k); }
      g.restore();
    });
  }
  function icon(g, kind, x, y, r) {
    g.save(); g.translate(x, y);
    if (kind === 'clock') { blob(g, 0, 0, r, r, C.orange); blob(g, 0, 0, r * 0.78, r * 0.78, '#fbfaf6'); g.strokeStyle = C.ink; g.lineCap = 'round'; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.55); g.moveTo(0, 0); g.lineTo(r * 0.4, 0); g.stroke(); }
    if (kind === 'pillow') { roundRect(g, -r, -r * 0.6, r * 2, r * 1.2, r * 0.5, C.violet); }
    if (kind === 'wheel') { g.strokeStyle = C.navy; g.lineWidth = r * 0.25; g.beginPath(); g.arc(0, 0, r * 0.85, 0, 7); g.stroke(); g.lineWidth = r * 0.18; for (let i = 0; i < 3; i++) { const a = i * 2.094 + 1.57; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); g.stroke(); } blob(g, 0, 0, r * 0.25, r * 0.25, C.navy); }
    if (kind === 'glass') { g.fillStyle = '#c8d8e8'; g.beginPath(); g.moveTo(-r * 0.6, -r); g.lineTo(r * 0.6, -r); g.quadraticCurveTo(r * 0.6, 0, 0, r * 0.1); g.quadraticCurveTo(-r * 0.6, 0, -r * 0.6, -r); g.fill(); g.fillStyle = '#b0384a'; g.beginPath(); g.moveTo(-r * 0.5, -r * 0.6); g.lineTo(r * 0.5, -r * 0.6); g.quadraticCurveTo(r * 0.45, 0, 0, r * 0.05); g.quadraticCurveTo(-r * 0.45, 0, -r * 0.5, -r * 0.6); g.fill(); g.fillStyle = '#c8d8e8'; g.fillRect(-r * 0.06, 0, r * 0.12, r * 0.8); g.fillRect(-r * 0.4, r * 0.75, r * 0.8, r * 0.12); }
    g.restore();
  }
  function chalkHourglass(g, x, y, s, fill) {
    g.save(); g.strokeStyle = C.chalk; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - s, y - s * 1.3); g.lineTo(x + s, y - s * 1.3); g.lineTo(x + s * 0.1, y); g.lineTo(x + s, y + s * 1.3); g.lineTo(x - s, y + s * 1.3); g.lineTo(x - s * 0.1, y); g.closePath(); g.stroke();
    // sand (adénosine) piling up at the bottom
    const h = s * 1.2 * clamp(fill);
    g.fillStyle = '#f4d58a'; g.beginPath();
    g.moveTo(x - s * 0.92, y + s * 1.25); g.lineTo(x + s * 0.92, y + s * 1.25);
    g.lineTo(x + s * 0.92 - h * 0.7, y + s * 1.25 - h); g.lineTo(x - s * 0.92 + h * 0.7, y + s * 1.25 - h); g.closePath(); g.fill();
    if (fill > 1) { // overflow spills out
      const o = clamp(fill - 1);
      g.beginPath(); g.ellipse(x + s * 1.3, y + s * 1.3, s * 0.7 * o, s * 0.18 * o, 0, 0, 7); g.fill();
    }
    g.restore();
  }
  function tick(g, x, y, s, t, t0) {
    const k = clamp((t - t0) / 0.18); if (k <= 0) return;
    A.ev('ding', t0);
    g.save(); g.strokeStyle = '#7ed08a'; g.lineWidth = 24; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - s, y);
    const m = [x - s * 0.3, y + s * 0.7], e = [x + s, y - s * 0.8];
    if (k < 0.4) g.lineTo(lerp(x - s, m[0], k / 0.4), lerp(y, m[1], k / 0.4));
    else { g.lineTo(m[0], m[1]); g.lineTo(lerp(m[0], e[0], (k - 0.4) / 0.6), lerp(m[1], e[1], (k - 0.4) / 0.6)); }
    g.stroke(); g.restore();
  }

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, plate, cam, draw) => shots.push({ id, t0, plate, cam, draw });
  const cam = (x, y, z0, z1, dx = 0, dy = 0) => ({ x, y, z0, z1, dx, dy });

  // Sign rect helpers for the hook room (the old card keeps its X to the end)
  const hookCard = (g, t) => { typeOn(g, 'PL01', 'card1', 'JE RATTRAPERAI\nDEMAIN', T('rattrape'), t); typeOn(g, 'PL01', 'clock', '03:47', 0.15, t, { cps: 34 }); };
  const toiPhone = (st) => ({ ...st, arms: [{ to: [st.x + 330 * st.k, st.y - 640 * st.k], hand: 'open' }, { to: [st.x + 360 * st.k, st.y - 600 * st.k], hand: 'open' }] });
  const phone = (g, st) => { g.save(); g.translate(st.x + 400 * st.k, st.y - 660 * st.k); g.rotate(-0.35); roundRect(g, -40 * st.k, -75 * st.k, 80 * st.k, 150 * st.k, 16 * st.k, '#22252b'); g.fillStyle = '#9fd3ff'; g.fillRect(-30 * st.k, -62 * st.k, 60 * st.k, 118 * st.k); g.restore(); };

  // P1 — 0 s: the hook, played literally
  shot('P1', 0, 'PL01', cam(1700, 1100, 1.06, 1.1, 120, 0), (g, s) => {
    hookCard(g, s.t);
    const st = toiPhone({ x: 1050, y: 1520, k: 0.9, face: 1, pose: 'sit', t: s.t, tired: true, yawn: clamp(Math.sin((s.lt - 0.3) * 2.2)) * 0.8 });
    drawChar(g, CH.toi, st); phone(g, st);
  });
  // P2 — "Faux." red X on the denial line
  shot('P2', T('faux'), 'PL01', cam(1250, 700, 1.55, 1.62, 60, 20), (g, s) => {
    hookCard(g, s.t);
    redX(g, S('PL01', 'card1').r, T('faux'), s.t);
    const j = spring(s.t - T('faux'), 3, 0.3);
    drawChar(g, CH.toi, { x: 1050, y: 1520 - 80 * Math.sin(Math.PI * clamp((s.t - T('faux')) / 0.35)), k: 0.9, face: 1, pose: 'sit', t: s.t, look: -1.2 * j, tilt: -0.08 * j,
      arms: [{ to: [1050 - 200, 1520 - 900], hand: 'open' }, { to: [1050 + 320, 1520 - 950], hand: 'open' }] });
    mark(g, 1150, 380, '!', s.t, T('faux') + 0.08);
  });

  // P3 — stakes: road sign + icons popping one per word
  shot('P3', T('après'), 'PL02', cam(1600, 1100, 1.0, 1.04, 300, 0), (g, s) => {
    typeOn(g, 'PL02', 'road', '17 H\nSANS DORMIR', T('dix-sept'), s.t);
    const b = S('PL02', 'board').r;
    [['clock', 'dix-sept'], ['pillow', 'dormir']].forEach(([k, w], i) =>
      withPop(g, b[0] + b[2] * (0.22 + i * 0.28), b[1] + b[3] / 2, s.t, T(w), () => icon(g, k, b[0] + b[2] * (0.22 + i * 0.28), b[1] + b[3] / 2, 200)));
    const x = 1500 + s.lt * 120;
    drawChar(g, CH.toi, { x: x + 80, y: 1700, k: 0.6, face: 1, pose: 'sit', t: s.t, tired: true, yawn: 0.6 * clamp(Math.sin(s.lt * 2.5)),
      arms: [{ to: [x + 330, 1300], hand: 'fist' }, { to: [x + 360, 1320], hand: 'fist' }] });
    car(g, x, 1900, s.t, 1);
  });
  // P4 — "...comme avec un demi-gramme d'alcool"
  shot('P4', T('conduis'), 'PL02', cam(2600, 1000, 1.18, 1.24, 120, 0), (g, s) => {
    const b = S('PL02', 'board').r;
    [['clock', 'dix-sept'], ['pillow', 'dormir'], ['wheel', 'conduis']].forEach(([k, w], i) =>
      withPop(g, b[0] + b[2] * (0.2 + i * 0.22), b[1] + b[3] * 0.32, s.t, T(w), () => icon(g, k, b[0] + b[2] * (0.2 + i * 0.22), b[1] + b[3] * 0.32, 150)));
    withPop(g, b[0] + b[2] * 0.86, b[1] + b[3] * 0.32, s.t, T("d'alcool"), () => icon(g, 'glass', b[0] + b[2] * 0.86, b[1] + b[3] * 0.32, 160), 'squash');
    typeOn(g, 'PL02', 'board', '= 0,5 g/L D\'ALCOOL', T('demi-gramme'), s.t, { r: [b[0] + 60, b[1] + b[3] * 0.58, b[2] - 120, b[3] * 0.36] });
    const x = 2300 + s.lt * 140, sw = Math.sin(s.lt * 3.2) * 0.05;
    g.save(); g.translate(x, 1900); g.rotate(sw); g.translate(-x, -1900);
    drawChar(g, CH.toi, { x: x + 80, y: 1700, k: 0.6, face: 1, pose: 'sit', t: s.t, eyesClosed: s.lt % 1.4 > 0.9,
      arms: [{ to: [x + 330, 1300], hand: 'fist' }, { to: [x + 360, 1320], hand: 'fist' }] });
    car(g, x, 1900, s.t, 1); g.restore();
  });

  // P5 — title "11 JOURS"
  shot('P5', T('alors', 1), null, null, (g, s) => titleCard(g, 'red', '11 JOURS', s.t, s.lt, T('onze')));
  // P6 — subject under a spotlight, name typed on the sign
  shot('P6', T("c'est"), 'PL03', cam(1920, 1150, 1.05, 1.09, -80, 0), (g, s) => {
    typeOn(g, 'PL03', 'name', 'RANDY\nGARDNER', T('randy', 1), s.t);
    const t0 = s.t0;
    withPop(g, 1750, 1700, s.t, t0 + 0.05, () => drawChar(g, CH.randy, { x: 1750, y: 1700, k: 1, face: 1, pose: 'stand', t: s.t,
      arms: [{ to: [1750 - 330, 1700 - 1200 + Math.sin(s.lt * 9) * 60], hand: 'open' }, null] }), 'squash');
  });

  // P7 — origin: the real place, date card, people coming and going
  shot('P7', T('décembre'), 'PL04', cam(1920, 1200, 1.02, 1.06, 100, 0), (g, s) => {
    typeOn(g, 'PL04', 'school', 'POINT LOMA HIGH SCHOOL\nSAN DIEGO', T('lycée'), s.t);
    drawChar(g, CH.eleve1, { x: walkX(1900, -1, 0.62, s.lt), y: 1800, k: 0.62, face: -1, pose: 'walk', walkT: s.lt, t: s.t });
    drawChar(g, CH.eleve2, { x: walkX(2350, 1, 0.66, s.lt), y: 1840, k: 0.66, face: 1, pose: 'walk', walkT: s.lt + 0.3, t: s.t });
    drawChar(g, CH.randy, { x: walkX(400, 1, 0.75, s.lt), y: 1900, k: 0.75, face: 1, pose: 'walk', walkT: s.lt + 0.15, t: s.t });
    dateCard(g, '28 DÉC.\n1963', s.t, T('décembre'));
  });
  // P8 — the plan: beat the record
  shot('P8', T('randy', 2), 'PL05', cam(1920, 1050, 1.04, 1.08, -60, 0), (g, s) => {
    const r = S('PL05', 'board').r;
    typeOn(g, 'PL05', 'board', 'RECORD : 260 H', T('record'), s.t, { r: [r[0] + 60, r[1] + 60, r[2] - 120, r[3] * 0.4] });
    drawChar(g, CH.randy, { x: 1000, y: 1880, k: 0.95, face: 1, pose: 'stand', t: s.t,
      arms: [{ to: [1350, 650], hand: 'point' }, null] });
  });
  shot('P8b', T('pour', 1), 'PL05', cam(2000, 700, 1.5, 1.56, 50, 0), (g, s) => {
    const r = S('PL05', 'board').r;
    typeOn(g, 'PL05', 'board', 'RECORD : 260 H', T('record'), s.t, { r: [r[0] + 60, r[1] + 60, r[2] - 120, r[3] * 0.4] });
    const end = typeOn(g, 'PL05', 'board', 'OBJECTIF : 264 H', T('pour', 1) + 0.1, s.t, { r: [r[0] + 60, r[1] + r[3] * 0.5, r[2] - 120, r[3] * 0.4] });
    const writing = s.t < end;
    drawChar(g, CH.randy, { x: 1150, y: 1880, k: 0.95, face: 1, pose: 'stand', t: s.t,
      arms: [{ to: [writing ? 1300 + (s.t - T('pour', 1)) * 900 : 1450, 820], hand: 'fist', scribble: writing }, null] });
  });

  // P9–P11 — the team, each one landing on his name
  const living = (g, s, upTo) => {
    drawChar(g, CH.randy, { x: 1900, y: 1560, k: 0.8, face: 1, pose: 'sit', t: s.t, tired: true, eyesClosed: (s.t % 2.2) > 1.5, tilt: 0.12 * Math.sin(s.t * 1.3) });
    typeOn(g, 'PL06', 's1', 'BRUCE', T('bruce'), s.t);
    if (upTo >= 2) typeOn(g, 'PL06', 's2', 'JOE', T('joe'), s.t);
    if (upTo >= 3) typeOn(g, 'PL06', 's3', 'WILLIAM DEMENT\nSTANFORD', T('william'), s.t);
  };
  const land = (t, t0, h = 900) => (t < t0 ? -h * 3 : -h * (1 - Math.min(1, spring(t - t0, 2.2, 0.45))));
  shot('P9', T('une', 1), 'PL06', cam(1500, 1150, 1.08, 1.12, 120, 0), (g, s) => {
    living(g, s, 1);
    drawChar(g, CH.bruce, { x: 900, y: 1900 + land(s.t, T('bruce')), k: 0.8, face: 1, pose: 'stand', t: s.t,
      arms: [{ to: [1700, 1150], hand: 'open' }, null] });
    puff(g, 900, 1900, 260, s.t, T('bruce') + 0.25);
  });
  shot('P10', T('joe'), 'PL06', cam(2450, 1050, 1.35, 1.41, 60, 0), (g, s) => {
    living(g, s, 2);
    drawChar(g, CH.bruce, { x: 900, y: 1900, k: 0.8, face: 1, pose: 'stand', t: s.t });
    drawChar(g, CH.joe, { x: 2600, y: 1900 + land(s.t, T('joe')), k: 0.8, face: -1, pose: 'stand', t: s.t,
      arms: [{ to: [2150 + Math.sin(s.t * 14) * 40, 1050], hand: 'open' }, null] });
    puff(g, 2600, 1900, 260, s.t, T('joe') + 0.25);
  });
  shot('P11', T('chercheur'), 'PL06', cam(1920, 1080, 1.0, 1.03, 0, 0), (g, s) => {
    living(g, s, 3);
    drawChar(g, CH.bruce, { x: 900, y: 1900, k: 0.8, face: 1, pose: 'stand', t: s.t, look: 1 });
    drawChar(g, CH.joe, { x: 2600, y: 1900, k: 0.8, face: -1, pose: 'stand', t: s.t, look: 1 });
    const arrive = Math.min(s.lt, 1.6);
    drawChar(g, CH.dement, { x: walkX(4100, -1, 0.85, arrive), y: 1950, k: 0.85, face: -1, pose: s.lt < 1.6 ? 'walk' : 'stand', walkT: s.lt, t: s.t,
      arms: s.lt < 1.6 ? null : [null, { to: [3400, 1500 - Math.sin((s.lt - 1.6) * 6) * 30], hand: 'open' }] });
  });

  // P12 — "Alors, comment ça marche ?"
  shot('P12', T('alors', 2), null, null, (g, s) => {
    titleCard(g, 'purple', 'ALORS, COMMENT\nÇA MARCHE ?', s.t, s.lt, T('alors', 2), { size: 92 });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    [[260, 300], [1650, 760], [1500, 250]].forEach(([x, y], i) => mark(g, x, y, '?', s.t, T('marche') + i * 0.12, 140, C.white));
    g.restore();
  });

  // P13 — mechanism #1: blackboard, adenosine fills the hourglass
  const fillAt = (t) => clamp((t - T('chaque')) / (T('déborde') - T('chaque'))) * 1.0 + clamp((t - T('déborde')) / 1.2) * 0.6;
  shot('P13', T('chaque'), 'PL07', cam(1920, 1000, 1.02, 1.06, -80, 0), (g, s) => {
    const r = S('PL07', 'chalk').r;
    typeOn(g, 'PL07', 'chalk', 'ADÉNOSINE', T("l'adénosine"), s.t, { r: [r[0] + 80, r[1] + 80, r[2] * 0.55, r[3] * 0.35] });
    chalkHourglass(g, r[0] + r[2] * 0.78, r[1] + r[3] * 0.5, 260, fillAt(s.t));
    drawChar(g, CH.dement, { x: 1500, y: 1960, k: 0.95, face: 1, pose: 'stand', t: s.t,
      arms: [null, { to: [r[0] + r[2] * 0.6, r[1] + r[3] * 0.62], hand: 'fist', scribble: true }] });
  });
  shot('P13b', T('comme', 2), 'PL07', cam(1920, 760, 1.3, 1.36, 40, 0), (g, s) => {
    const r = S('PL07', 'chalk').r;
    typeOn(g, 'PL07', 'chalk', 'ADÉNOSINE', T("l'adénosine"), s.t, { r: [r[0] + 80, r[1] + 80, r[2] * 0.55, r[3] * 0.35] });
    chalkHourglass(g, r[0] + r[2] * 0.78, r[1] + r[3] * 0.5, 260, fillAt(s.t));
  });

  // P14 — mechanism #2: the machine. Eyes open ≠ awake.
  const machine = (g, s) => {
    const r = S('PL08', 'screen').r;
    const top = [r[0] + 60, r[1] + 50, r[2] - 120, r[3] * 0.42], bot = [r[0] + 60, r[1] + r[3] * 0.52, r[2] - 120, r[3] * 0.4];
    typeOn(g, 'PL08', 'screen', 'MICRO-SOMMEIL\n3 s', T('secondes'), s.t, { r: bot });
    typeOn(g, 'PL08', 'screen', 'YEUX OUVERTS\n= ÉVEILLÉ', T('quand') + 0.1, s.t, { r: top });
    redX(g, top, T('ouverts'), s.t);
    // EEG paper trace dips during the micro-sleep
    g.save(); g.strokeStyle = C.ink; g.lineWidth = 8; g.beginPath();
    for (let x = 0; x <= 1000; x += 10) {
      const tt = s.t - (1000 - x) / 600;
      const slow = tt > T('morceaux') && tt < T('morceaux') + 1.4;
      const y = 970 + (slow ? Math.sin(tt * 9) * 120 : Math.sin(tt * 55) * 30 + Math.sin(tt * 91) * 20);
      x ? g.lineTo(450 + x, y) : g.moveTo(450 + x, y);
    }
    g.stroke(); g.restore();
    const ms = s.t > T('morceaux') && s.t < T('morceaux') + 1.4;
    drawChar(g, CH.randy, { x: 1700, y: 1900, k: 0.9, face: 1, pose: 'sit', t: s.t, wires: true, tired: true, nod: ms ? 4 : 1, tilt: ms ? 0.15 : 0 });
  };
  shot('P14', T('quand'), 'PL08', cam(1920, 1080, 1.03, 1.07, 100, 0), machine);
  shot('P14b', T('morceaux'), 'PL08', cam(2200, 900, 1.4, 1.47, 80, 0), machine);
  // P15 — mechanism #3: the counter rolls to 264
  shot('P15', T('le', 4), 'PL09', cam(1920, 1000, 1.02, 1.07, 0, 30), (g, s) => {
    const r = S('PL09', 'flap').r;
    const a = T('grimpe'), b = T('heures', 2, 'e');
    const v = 264 * Math.pow(clamp((s.t - a) / (b - a)), 0.8);
    for (let d = 24; d <= 264; d += 24) { const td = a + Math.pow(d / 264, 1 / 0.8) * (b - a); if (td < s.t + 99) A.ev('ding', td); }
    const digits = String(Math.floor(v)).padStart(3, '0') + 'H';
    const cw = r[2] / 4;
    g.save(); g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.clip();
    for (let i = 0; i < 4; i++) {
      const x = r[0] + i * cw;
      g.fillStyle = i % 2 ? '#2a2d33' : '#26292f'; g.fillRect(x + 20, r[1] + 20, cw - 40, r[3] - 40);
      g.fillStyle = '#111'; g.fillRect(x + 20, r[1] + r[3] / 2 - 6, cw - 40, 12);
      const roll = i === 2 && v < 264 && v > 0 ? (v % 1) : 0;
      g.fillStyle = '#f6f1e4'; g.font = `800 ${r[3] * 0.7}px Montserrat`; g.textAlign = 'center';
      g.fillText(digits[i], x + cw / 2, r[1] + r[3] * 0.75 - roll * r[3] * 0.5);
    }
    g.restore();
    const lap = (s.lt % 3.2) / 3.2, dir = lap < 0.5 ? 1 : -1, ph = lap < 0.5 ? lap * 2 : (1 - lap) * 2;
    drawChar(g, CH.randy, { x: 900 + ph * 2000, y: 1950, k: 0.75, face: dir, pose: 'walk', walkT: s.lt, t: s.t, tired: true });
  });

  // P16 — what it leads to: the street sign becomes a person
  shot('P16', T('au'), 'PL10', cam(2100, 1080, 1.04, 1.09, -100, 0), (g, s) => {
    const r = S('PL10', 'street').r;
    typeOn(g, 'PL10', 'street', 'PALM ST.', s.t0 + 0.15, s.t);
    withPop(g, r[0] + r[2] / 2, r[1] - 120, s.t, T('devient'), () => {
      g.fillStyle = '#1b1b24'; [-1, 1].forEach((d) => { g.beginPath(); g.ellipse(r[0] + r[2] / 2 + d * 120, r[1] - 120, 34, 46, 0, 0, 7); g.fill(); });
    }, 'squash');
    drawChar(g, CH.randy, { x: 1500, y: 1900, k: 0.85, face: 1, pose: 'stand', t: s.t, tired: true,
      arms: [{ to: [2200, 1150 + Math.sin(s.t * 8) * 40], hand: 'open' }, null] });
    const j = Math.max(0, Math.sin(Math.PI * clamp((s.t - T('personne')) / 0.45)));
    drawChar(g, CH.bruce, { x: 700, y: 1900 - j * 220, k: 0.75, face: 1, pose: 'stand', t: s.t,
      arms: [{ to: [500, 900], hand: 'open' }, { to: [900, 900], hand: 'open' }] });
    mark(g, 700, 750, '!', s.t, T('personne') + 0.05);
  });
  // P17 — he believes he's a pro footballer (wrong idea → red X)
  shot('P17', T('croit'), 'PL11', cam(1900, 1100, 1.05, 1.1, 60, 0), (g, s) => {
    typeOn(g, 'PL11', 'field', 'FOOTBALLEUR\nPRO ?', T('croit'), s.t);
    redX(g, S('PL11', 'field').r, T('professionnel', 1, 'e') - 0.1, s.t);
    drawChar(g, CH.randy, { x: 1500, y: 1800 + Math.abs(Math.sin(s.t * 5)) * -30, k: 0.9, face: 1, pose: 'stand', t: s.t, helmet: true,
      arms: [{ to: [1250, 1150], hand: 'fist' }, { to: [1800, 1100], hand: 'fist' }] });
    drawChar(g, CH.joe, { x: 600, y: 1850, k: 0.7, face: 1, pose: 'stand', t: s.t, look: s.t > T('professionnel') ? 1 : -1 });
  });
  // P18 — counting down by sevens: stops at 65
  shot('P18', T('compter'), 'PL12', cam(1500, 1050, 1.06, 1.1, 80, 0), (g, s) => {
    const r = S('PL12', 'board').r;
    const span = T('soixante-cinq') - T('rebours');
    const end = typeText(g, '100, 93, 86,\n79, 72, 65…', [r[0] + 60, r[1] + 60, r[2] - 120, r[3] - 120], T('rebours'), s.t, { cps: 21 / span, color: C.ink });
    drawChar(g, CH.dement, { x: 2350, y: 1900, k: 0.85, face: -1, pose: 'stand', t: s.t,
      arms: [{ to: [1950, 1050], hand: 'point' }, null] });
    drawChar(g, CH.randy, { x: 3100, y: 1900, k: 0.85, face: -1, pose: 'stand', t: s.t, tired: true, look: -0.5 });
    mark(g, 3100, 750, '?', s.t, T("s'arrête"));
    void end;
  });
  // P19 — reactions
  shot('P19', T('il', 3), 'PL12', cam(2980, 1280, 2.2, 2.28, -30, 0), (g, s) => {
    const r = S('PL12', 'board').r;
    typeText(g, '100, 93, 86,\n79, 72, 65…', [r[0] + 60, r[1] + 60, r[2] - 120, r[3] - 120], T('rebours'), s.t, { cps: 21 / (T('soixante-cinq') - T('rebours')), color: C.ink });
    const turned = s.t > T('oublié');
    drawChar(g, CH.randy, { x: 2960, y: 1900, k: 0.85, face: -1, pose: 'stand', t: s.t, tired: true, look: Math.sin(s.t * 1.7) });
    drawChar(g, CH.bruce, { x: 2470, y: 1950, k: 0.8, face: turned ? 1 : -1, pose: 'stand', t: s.t, look: turned ? 1 : -1 });
    drawChar(g, CH.joe, { x: 3450, y: 1950, k: 0.8, face: turned ? -1 : 1, pose: 'stand', t: s.t, look: turned ? -1 : 1 });
    mark(g, 2470, 900, '!', s.t, T('oublié'));
    mark(g, 3450, 900, '!', s.t, T('oublié') + 0.1);
  });

  // P20 — the twist: he finally sleeps
  shot('P20', T('le', 5), 'PL13', cam(1920, 1100, 1.05, 1.1, 60, 0), (g, s) => {
    dateCard(g, '8 JANV.\n1964', s.t, T('le', 5));
    const drop = s.t < T("s'endort") ? -900 : -900 * (1 - spring(s.t - T("s'endort"), 2.4, 0.5));
    if (s.t >= T("s'endort")) { A.ev('pop', T("s'endort")); drawChar(g, CH.randy, { x: 2650, y: 1330 + drop, k: 0.75, face: 1, pose: 'lie', t: s.t, eyesClosed: true, nod: 0.3 }); }
    else drawChar(g, CH.randy, { x: walkX(300, 1, 0.8, s.lt), y: 1900, k: 0.8, face: 1, pose: 'walk', walkT: s.lt, t: s.t, tired: true });
  });
  shot('P21', T('pour', 2), 'PL13', cam(1920, 800, 1.35, 1.42, 40, 0), (g, s) => {
    const r = textRect(S('PL13', 'board'));
    typeText(g, '11 JOURS PERDUS', [r[0], r[1], r[2], r[3] * 0.45], T('pour', 2), s.t);
    typeText(g, '→ 14 H DE SOMMEIL', [r[0], r[1] + r[3] * 0.5, r[2], r[3] * 0.45], T('quatorze'), s.t);
    drawChar(g, CH.randy, { x: 2650, y: 1330, k: 0.75, face: 1, pose: 'lie', t: s.t, eyesClosed: true, nod: 0.3 });
  });
  // P22 — the brain keeps deep sleep, erases the rest
  const twist = (g, s) => {
    const r = S('PL07', 'chalk').r;
    const a = [r[0] + 80, r[1] + 80, r[2] * 0.7, r[3] * 0.38], b = [r[0] + 80, r[1] + r[3] * 0.55, r[2] * 0.7, r[3] * 0.38];
    typeOn(g, 'PL07', 'chalk', 'SOMMEIL PROFOND', T('garde'), s.t, { r: a });
    tick(g, r[0] + r[2] * 0.86, a[1] + a[3] / 2, 120, s.t, T('profond', 1, 'e'));
    typeOn(g, 'PL07', 'chalk', 'LE RESTE', T('efface') - 0.05, s.t, { r: b });
    const er = clamp((s.t - T('reste', 1, 'e')) / 0.6); // sponge wipes "LE RESTE"
    if (er > 0) {
      g.fillStyle = '#3d4a45'; g.fillRect(b[0], b[1], b[2] * er, b[3]);
      roundRect(g, b[0] + b[2] * er - 90, b[1] + b[3] / 2 - 60, 180, 120, 30, '#e7c35a');
    }
    drawChar(g, CH.dement, { x: 3300, y: 1960, k: 0.9, face: -1, pose: 'stand', t: s.t,
      arms: [{ to: er > 0 ? [b[0] + b[2] * er, b[1] + b[3] / 2] : [2900, 900], hand: 'fist', scribble: er <= 0 && s.t < T('reste') }, null] });
  };
  shot('P22', T('ton', 3), 'PL07', cam(1920, 900, 1.08, 1.13, 0, 0), twist);
  shot('P22b', T('il', 6), 'PL07', cam(1500, 700, 1.7, 1.78, 60, 0), twist);

  // P23 — the question; the viewer from the hook reacts; sign holds to the end
  const finale = (g, s) => {
    typeOn(g, 'PL01', 'card1', 'JE RATTRAPERAI\nDEMAIN', T('rattrape'), s.t);
    redX(g, S('PL01', 'card1').r, T('faux'), s.t);
    typeOn(g, 'PL01', 'clock', '03:48', s.t0, s.t, { cps: 34 });
    typeOn(g, 'PL01', 'card2', "TU L'AS VRAIMENT\nRATTRAPÉE ?", T('alors', 3) + 0.15, s.t);
    const rx = s.t > T('vraiment');
    drawChar(g, CH.toi, { x: 1500, y: 1950, k: 0.95, face: 1, pose: 'stand', t: s.t, look: rx ? 0 : 1.2, tired: true,
      arms: rx ? [{ to: [1350, 900], hand: 'open' }, { to: [1800 + Math.sin(s.t * 3) * 20, 1100], hand: 'point' }]
        : [{ to: [1700, 1150], hand: 'open' }, { to: [1750, 1120], hand: 'open' }] });
    mark(g, 1700, 820, '?', s.t, T('rattrapée'));
  };
  shot('P23', T('alors', 3), 'PL01', cam(1800, 1000, 1.04, 1.08, 40, 0), finale);
  shot('P23b', T("l'as"), 'PL01', cam(1950, 820, 1.3, 1.38, 60, 0), finale);

  shots.sort((a, b) => a.t0 - b.t0);
  // Big-section wipes (white splash, 0.2 s in / 0.2 s out) on the cut words
  const wipes = [T('alors', 1), T('une', 1), T('au', 1), T('le', 5), T('alors', 3)];
  return { plates, shots, wipes, end: A.duration };
};

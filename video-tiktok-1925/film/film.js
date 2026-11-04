/* "$1,000 in 1925 vs today" — blocky 3D first-person what-if, vertical 1080×1920.
 * Same genre as the user's reference (POV shopping, money counter, PURCHASED stamps, italic captions),
 * own design and story. Skills applied: captions-overlay (rail = spoken sentence), motion-doctrine
 * (one transition vocabulary: hard cuts + a white flash at the era change; stillness before the reveal).
 */
window.buildFilm = (A) => {
  const { THREE, T, W, H, clamp, lerp, ease, easeOut, spring, hash, ev, box, sign, person, walkPose, idlePose, mat, buildHands, setHeld, poseHands, hudText, money } = A;

  /* ─── palettes ─── */
  const P25 = { brick: '#a8644e', brick2: '#8f5543', stone: '#cdbb9c', road: '#6f6a64', walk: '#b8ab96', wood: '#8a5a3a', cream: '#efe4cc', green: '#3e5a46', black: '#26262c' };
  const PNOW = { glass: '#5c86a8', glass2: '#7aa3c2', concrete: '#c9cdd2', road: '#4a4d52', walk: '#b9bcc0', white: '#eef1f4', dark: '#2b2f36' };
  const people25 = [
    { body: '#4b4038', legs: '#3b3530', hat: '#2b2622', hair: '#3a2a20' }, { body: '#7a6a58', legs: '#4b4038', hat: '#5a4a3a', hair: '#6a4630' },
    { body: '#8a3a3a', legs: '#3b3530', hair: '#c9a46a' }, { body: '#3e5a46', legs: '#2b2f36', hat: '#26262c', hair: '#1f1b1b' },
  ];
  const peopleNow = [
    { body: '#e0e4ea', legs: '#2c3e5c', hair: '#3a2a20' }, { body: '#c96a5a', legs: '#26262c', hair: '#1f1b1b' },
    { body: '#4f7c86', legs: '#5d6670', hair: '#c9a46a' }, { body: '#d8b25a', legs: '#2c3e5c', hair: '#6a4630' },
  ];

  /* ─── reusable props ─── */
  function modelT(g, x, z, ry = 0, s = 1) {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; c.scale.setScalar(s); g.add(c);
    box(c, 1.5, 0.45, 3.2, P25.black, 0, 0.75, 0); box(c, 1.4, 0.8, 1.3, P25.black, 0, 1.35, 0.3); box(c, 1.42, 0.08, 1.4, P25.black, 0, 1.8, 0.3);
    box(c, 1.2, 0.55, 0.05, '#a9c3d9', 0, 1.45, -0.36, { mat: { roughness: 0.2 } }); box(c, 1.2, 0.5, 1.0, P25.black, 0, 1.1, -1.05);
    [[-0.8, -1.1], [0.8, -1.1], [-0.8, 1.15], [0.8, 1.15]].forEach(([dx, dz]) => { const w = box(c, 0.16, 0.75, 0.75, '#1a1a1e', dx, 0.38, dz); w.rotation.x = Math.PI / 4; box(c, 0.18, 0.25, 0.25, '#c9b08a', dx, 0.38, dz); });
    box(c, 0.25, 0.25, 0.1, '#e8dfb0', -0.45, 1.05, -1.58); box(c, 0.25, 0.25, 0.1, '#e8dfb0', 0.45, 1.05, -1.58);
    return c;
  }
  function modernCar(g, x, z, ry = 0, col = '#c0392b') {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
    box(c, 1.8, 0.6, 4.2, col, 0, 0.6, 0); box(c, 1.6, 0.55, 2.2, col, 0, 1.15, 0.1);
    box(c, 1.62, 0.42, 2.0, '#1f2a36', 0, 1.18, 0.1, { mat: { roughness: 0.15 } });
    [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]].forEach(([dx, dz]) => box(c, 0.25, 0.62, 0.62, '#18181c', dx, 0.31, dz));
    box(c, 0.4, 0.12, 0.05, '#f4f6f8', -0.55, 0.75, -2.11); box(c, 0.4, 0.12, 0.05, '#f4f6f8', 0.55, 0.75, -2.11);
    return c;
  }
  function lamp(g, x, z, modern = false) { box(g, 0.14, 4.2, 0.14, modern ? '#5d6670' : '#2b2f36', x, 2.1, z); box(g, modern ? 0.9 : 0.4, 0.3, 0.4, modern ? '#5d6670' : '#2b2f36', x + (modern ? 0.4 : 0), 4.3, z); box(g, 0.3, 0.15, 0.3, '#fff2c0', x + (modern ? 0.6 : 0), 4.12, z, { mat: { emissive: '#fff2c0', emissiveIntensity: 0.6 } }); }
  function facade(g, x, z, w, h, col, side, signTxt, opt = {}) { // side: -1 left of road (faces +x), 1 right (faces -x)
    box(g, 6, h, w, col, x, h / 2, z);
    const fx = x - side * 3.01;
    for (let fy = 2.2; fy < h - 0.8; fy += 2.4) for (let k = -1; k <= 1; k++) if (!(fy < 3 && k === 0)) box(g, 0.1, 1.2, w * 0.18, opt.modern ? PNOW.glass2 : '#cfe0e8', fx, fy + (fy < 3 ? 0.4 : 0), z + k * w * 0.3, { cast: false, mat: { roughness: 0.25 } });
    box(g, 0.12, 2.4, w * 0.28, opt.door || P25.wood, fx, 1.2, z);
    if (signTxt) sign(g, signTxt, w * 0.82, 1.1, fx - side * 0.05, Math.min(h - 0.8, 3.6), z, { ry: -side * Math.PI / 2, bg: opt.signBg || '#f4ecd8', fg: opt.signFg || '#2b2d42', glow: opt.glow });
  }
  function room(g, w, d, h, wall, floor, opt = {}) {
    box(g, w, 0.2, d, floor, 0, -0.1, -d / 2 + 2, { cast: false });
    box(g, w, h, 0.2, wall, 0, h / 2, -d + 2, { cast: false }); box(g, 0.2, h, d, wall, -w / 2, h / 2, -d / 2 + 2, { cast: false }); box(g, 0.2, h, d, wall, w / 2, h / 2, -d / 2 + 2, { cast: false });
    if (opt.ceiling) box(g, w, 0.2, d, opt.ceiling, 0, h, -d / 2 + 2, { cast: false });
  }

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, sky, extra = {}) => { const group = new THREE.Group(); sets[name] = { group, sky, ...extra }; return group; };

  // 1925 main street: shops on both sides, Model Ts, people in hats
  const crowd25 = [];
  {
    const g = mk('STREET25', '#bcd3e3', { sun: [14, 24, 6], fogNear: 30, fogFar: 110 });
    box(g, 8, 0.1, 140, P25.road, 0, 0, -50, { cast: false }); box(g, 3, 0.25, 140, P25.walk, -5.5, 0.12, -50, { cast: false }); box(g, 3, 0.25, 140, P25.walk, 5.5, 0.12, -50, { cast: false });
    for (let i = 0; i < 40; i++) box(g, 0.12, 0.02, 1.4, '#e8dfc8', 0, 0.06, -i * 3.5, { cast: false });
    const names = [['FORD', 'MOTOR CARS'], ['DRUG STORE', 'SODA FOUNTAIN'], ['GRAND THEATRE'], ['U.S. POST OFFICE'], ['BAKERY'], ['HARDWARE'], ['HOTEL'], ['BANK']];
    for (let i = 0; i < 8; i++) {
      const z = -6 - i * 8;
      facade(g, -10, z, 7.6, 7 + (i % 3) * 2, i % 2 ? P25.brick : P25.brick2, -1, names[i], { glow: i === 2 ? 0.35 : 0 });
      facade(g, 10, z - 4, 7.6, 6 + ((i + 1) % 3) * 2.5, i % 2 ? P25.stone : P25.brick, 1, names[(i + 4) % 8]);
      lamp(g, -4.3, z - 2); lamp(g, 4.3, z - 6);
    }
    [[-2.2, -18], [2.4, -30], [-2.3, -44], [2.2, -60]].forEach(([x, z], i) => modelT(g, x, z, i % 2 ? Math.PI : 0));
    for (let i = 0; i < 10; i++) crowd25.push({ p: person(g, people25[i % 4], (i % 2 ? 5.2 : -5.2) + (hash(i) - 0.5) * 1.2, -8 - i * 6.5, { ry: i % 2 ? 0 : Math.PI }), dir: i % 2 ? 1 : -1, seed: i });
    sets.STREET25.update = (s) => crowd25.forEach((c) => { c.p.root.position.z += 0; walkPose(c.p, s.t + c.seed); c.p.root.position.z = -8 - c.seed * 6.5 + c.dir * ((s.t * 1.1) % 12); });
  }
  // Ford showroom: Model T on a platform, price sign, salesman
  let salesman;
  {
    const g = mk('FORD', '#e8dcc4', { sun: [6, 14, 8], hemi: 1.6 });
    room(g, 14, 18, 6, '#e9dcc0', '#8a5a3a', { ceiling: '#efe4cc' });
    box(g, 6, 0.3, 6, '#b89a6a', 0, 0.15, -7); modelT(g, 0, -7, Math.PI * 0.8);
    sign(g, ['FORD', 'MODEL T'], 6, 1.6, 0, 4.4, -15.85, { bg: '#26262c', fg: '#efe4cc' });
    sign(g, '$260', 2.2, 1.1, 3.6, 1.6, -5, { bg: '#f4ecd8', fg: '#b8322e', ry: -0.5 }); box(g, 0.08, 1.2, 0.08, P25.wood, 3.6, 0.6, -5);
    for (let i = 0; i < 3; i++) box(g, 0.1, 3, 3.2, '#cfe0e8', -6.9, 2.6, -3 - i * 4, { cast: false, mat: { roughness: 0.2 } });
    salesman = person(g, { body: '#3b3f4a', legs: '#26262c', hair: '#3a2a20' }, -2.6, -5.2, { ry: 0.6 });
    sets.FORD.update = (s) => { idlePose(salesman, s.t, 1); salesman.armR.rotation.x = -0.9 - Math.sin(s.t * 3) * 0.1; };
  }
  // Drug store soda fountain: counter + crates of soda bottles stacking up
  const crates25 = [];
  {
    const g = mk('SODA', '#f0e2c8', { sun: [5, 14, 8], hemi: 1.6 });
    room(g, 14, 16, 6, '#d8e6dc', '#e9e1cf', { ceiling: '#f4ecd8' });
    for (let x = -6; x <= 6; x += 1) box(g, 1, 0.02, 16, x % 2 ? '#2b2d42' : '#f4ecd8', x, 0.01, -6, { cast: false });
    box(g, 8, 1.1, 1.2, '#f4f1ea', 0, 0.55, -9); box(g, 8.2, 0.12, 1.4, '#b8322e', 0, 1.16, -9);
    for (let i = -3; i <= 3; i++) { box(g, 0.12, 0.8, 0.12, '#c9ced4', i * 1.1, 0.4, -7.7); box(g, 0.5, 0.12, 0.5, '#b8322e', i * 1.1, 0.86, -7.7); }
    sign(g, ['SODA FOUNTAIN'], 7, 1.2, 0, 4.6, -13.85, { bg: '#b8322e', fg: '#f4ecd8' }); sign(g, ['COLA  5¢'], 3.4, 1.2, 4.2, 3.2, -13.85, { bg: '#f4ecd8', fg: '#b8322e' });
    for (let i = 0; i < 40; i++) { const c = new THREE.Group(); g.add(c); box(c, 0.9, 0.45, 0.6, '#b8322e', 0, 0.225, 0); for (let k = 0; k < 4; k++) box(c, 0.12, 0.3, 0.12, '#5a3a2a', -0.3 + k * 0.2, 0.55, 0, { cast: false }); c.position.set(-2.6 + (i % 6) * 1.05, Math.floor(i / 6) % 4 * 0.75, -4.5 - Math.floor(i / 24) * 0.8); crates25.push(c); }
  }
  // Grand Theatre: marquee + ticket booth + tickets piling up
  const tickets = [];
  {
    const g = mk('CINEMA', '#d9c7aa', { sun: [10, 18, 12] });
    box(g, 30, 0.1, 30, '#b8ab96', 0, 0, -8, { cast: false });
    box(g, 16, 11, 2, '#8f5543', 0, 5.5, -14); box(g, 13, 1.8, 3.2, '#d8b25a', 0, 5.4, -12.2);
    sign(g, ['GRAND THEATRE'], 11, 1.5, 0, 5.4, -10.58, { bg: '#26262c', fg: '#ffd96a', glow: 0.5 });
    sign(g, ['NOW SHOWING', 'THE GOLD RUSH'], 6, 2.4, 0, 8.4, -12.95, { bg: '#f4ecd8', fg: '#2b2d42' });
    box(g, 2.4, 2.8, 2, '#b8322e', 0, 1.4, -11.6); box(g, 1.6, 1.0, 0.1, '#cfe0e8', 0, 1.9, -10.58, { cast: false, mat: { roughness: 0.2 } });
    sign(g, ['TICKETS 25¢'], 2.4, 0.6, 0, 3.15, -10.58, { bg: '#f4ecd8', fg: '#b8322e' });
    for (let i = 0; i < 60; i++) { const tk = box(g, 0.32, 0.02, 0.18, i % 2 ? '#e8b84a' : '#f4c46a', (hash(i) - 0.5) * 2.2, 0.03 + Math.floor(i / 12) * 0.022, -9 + (hash(i * 3) - 0.5) * 1.2, { cast: false }); tk.rotation.y = hash(i * 7) * 3; tickets.push(tk); }
    for (let i = 0; i < 4; i++) person(g, people25[i], -5 + i * 3.3, -8.5 - (i % 2), { ry: 0 });
  }
  // Post office: counter, stamps, letters
  const letters = [];
  {
    const g = mk('POST', '#e7dcc4', { sun: [5, 14, 8], hemi: 1.6 });
    room(g, 14, 16, 6, '#c9d6cf', '#8a6a4c', { ceiling: '#efe4cc' });
    box(g, 10, 1.2, 1.2, P25.wood, 0, 0.6, -8); box(g, 10, 0.1, 1.4, '#6a4a34', 0, 1.25, -8);
    for (let i = 0; i < 5; i++) box(g, 0.1, 1.8, 0.1, '#c9b06a', -4 + i * 2, 2.2, -8.5);
    sign(g, ['U.S. POST OFFICE'], 8, 1.2, 0, 4.6, -13.85, { bg: '#2c3e5c', fg: '#f4ecd8' }); sign(g, ['STAMPS 2¢'], 3, 1, -4, 3.2, -13.85, { bg: '#f4ecd8', fg: '#2c3e5c' });
    person(g, { body: '#2c3e5c', legs: '#26262c', hat: '#2c3e5c', hair: '#3a2a20' }, 0.5, -9.4, { ry: 0 });
    for (let i = 0; i < 50; i++) { const l = box(g, 0.34, 0.015, 0.22, '#f4f1ea', (hash(i) - 0.5) * 2.4, 1.32 + Math.floor(i / 10) * 0.016, -7.6 + (hash(i * 5) - 0.5) * 0.6, { cast: false }); l.rotation.y = (hash(i * 9) - 0.5) * 0.6; letters.push(l); }
  }
  // Today: modern street with glass towers
  const crowdNow = [];
  {
    const g = mk('STREETNOW', '#c6d8e6', { sun: [14, 26, 4], fogNear: 35, fogFar: 130 });
    box(g, 10, 0.1, 160, PNOW.road, 0, 0, -60, { cast: false }); box(g, 3.5, 0.25, 160, PNOW.walk, -6.7, 0.12, -60, { cast: false }); box(g, 3.5, 0.25, 160, PNOW.walk, 6.7, 0.12, -60, { cast: false });
    for (let i = 0; i < 40; i++) { box(g, 0.15, 0.02, 2, '#f4f6f8', -1.6, 0.06, -i * 4, { cast: false }); box(g, 0.15, 0.02, 2, '#f4f6f8', 1.6, 0.06, -i * 4, { cast: false }); }
    const names = [['AUTO SALES'], ['SUPERMARKET'], ['CINEMA 12'], ['POST OFFICE']];
    for (let i = 0; i < 8; i++) {
      const z = -8 - i * 10;
      facade(g, -12, z, 9, 14 + (i % 3) * 8, i % 2 ? PNOW.glass : PNOW.concrete, -1, names[i % 4], { modern: true, door: PNOW.dark, signBg: '#ffffff', signFg: '#2b2f36' });
      facade(g, 12, z - 5, 9, 18 + ((i + 1) % 3) * 9, i % 2 ? PNOW.concrete : PNOW.glass, 1, null, { modern: true, door: PNOW.dark });
      lamp(g, -5, z, true); lamp(g, 5, z - 5, true);
    }
    ['#c0392b', '#ecf0f1', '#2c3e5c', '#7f8c8d'].forEach((c, i) => modernCar(g, i % 2 ? 3 : -3, -16 - i * 14, i % 2 ? Math.PI : 0, c));
    for (let i = 0; i < 10; i++) crowdNow.push({ p: person(g, peopleNow[i % 4], (i % 2 ? 6.4 : -6.4) + (hash(i) - 0.5), -8 - i * 7, { ry: i % 2 ? 0 : Math.PI }), dir: i % 2 ? 1 : -1, seed: i });
    sets.STREETNOW.update = (s) => crowdNow.forEach((c) => { walkPose(c.p, s.t + c.seed); c.p.root.position.z = -8 - c.seed * 7 + c.dir * ((s.t * 1.2) % 12); });
  }
  // Today: car dealership
  {
    const g = mk('DEALER', '#eef1f4', { sun: [6, 16, 10], hemi: 1.7 });
    room(g, 16, 18, 7, '#f4f6f8', '#d7dbe0', { ceiling: '#ffffff' });
    box(g, 6, 0.2, 7, '#c9ced4', 0, 0.1, -7); modernCar(g, 0, -7, Math.PI * 0.8, '#2c6fb0');
    sign(g, ['NEW CARS'], 6, 1.2, 0, 5, -15.85, { bg: '#2b2f36', fg: '#ffffff' });
    sign(g, '$17,000', 2.8, 1.1, 3.8, 1.7, -4.6, { bg: '#ffffff', fg: '#b8322e', ry: -0.5 }); box(g, 0.08, 1.2, 0.08, '#5d6670', 3.8, 0.6, -4.6);
    person(g, { body: '#2b2f36', legs: '#2b2f36', hair: '#1f1b1b' }, -2.8, -5, { ry: 0.6 });
  }
  // Today: supermarket cola fridges
  {
    const g = mk('STORE', '#eef1f4', { sun: [6, 16, 10], hemi: 1.7 });
    room(g, 16, 18, 6, '#f4f6f8', '#e1e4e8', { ceiling: '#ffffff' });
    for (let k = -2; k <= 2; k++) { box(g, 2.6, 4.2, 1.2, '#dfe6ec', k * 2.8, 2.1, -12); for (let r = 0; r < 5; r++) for (let b = 0; b < 6; b++) box(g, 0.25, 0.6, 0.25, '#b8322e', k * 2.8 - 1 + b * 0.4, 0.6 + r * 0.8, -11.5, { cast: false }); box(g, 2.6, 4.2, 0.05, '#cfe8f4', k * 2.8, 2.1, -11.35, { cast: false, mat: { roughness: 0.1, transparent: true, opacity: 0.35 } }); }
    sign(g, ['COLA  $2.29'], 4, 1, 0, 4.9, -11.3, { bg: '#ffffff', fg: '#b8322e' });
  }
  // Today: multiplex lobby
  {
    const g = mk('MULTIPLEX', '#2a2433', { sun: [4, 12, 8], hemi: 1.2, sunI: 1.4 });
    room(g, 16, 18, 7, '#3b3246', '#5a3a4a', { ceiling: '#2a2433' });
    box(g, 10, 1.2, 1.2, '#2b2f36', 0, 0.6, -10);
    for (let i = 0; i < 3; i++) sign(g, i === 1 ? ['TICKETS', '$11.75'] : ['SCREEN ' + (i + 4), 'NOW SHOWING'], 3.6, 2, -4.2 + i * 4.2, 4, -15.85, { bg: '#1b1b24', fg: i === 1 ? '#ffd96a' : '#bfe8ff', glow: 0.6 });
    for (let i = 0; i < 4; i++) person(g, peopleNow[i], -4 + i * 2.6, -12 + (i % 2), { ry: Math.PI });
  }
  // Today: post office
  {
    const g = mk('POSTNOW', '#eef1f4', { sun: [6, 16, 10], hemi: 1.7 });
    room(g, 14, 16, 6, '#e8edf2', '#c9ced4', { ceiling: '#ffffff' });
    box(g, 10, 1.2, 1.2, '#5d6670', 0, 0.6, -8); box(g, 10, 0.1, 1.4, '#c9ced4', 0, 1.25, -8);
    sign(g, ['POST OFFICE'], 6, 1.1, 0, 4.6, -13.85, { bg: '#2c3e5c', fg: '#ffffff' }); sign(g, ['STAMP 78¢'], 3, 1, 4, 3.2, -13.85, { bg: '#ffffff', fg: '#2c3e5c' });
    person(g, { body: '#2c3e5c', legs: '#26262c', hair: '#1f1b1b' }, -0.5, -9.4, { ry: 0 });
  }
  // Reveal studio: 1925 $1,000 vs its value today
  let stackOld, stackNew, melt;
  {
    const g = mk('STUDIO', '#2b2f3a', { sun: [6, 16, 10], hemi: 1.1, sunI: 2.0, fogNear: 40, fogFar: 120 });
    box(g, 40, 0.1, 40, '#3a3f4c', 0, 0, -8, { cast: false });
    stackOld = new THREE.Group(); stackOld.position.set(-1.3, 0, -7); g.add(stackOld); box(stackOld, 1.0, 0.4, 0.5, '#7fa36a', 0, 0.2, 0); box(stackOld, 0.3, 0.41, 0.51, '#e9e4d2', 0, 0.2, 0);
    sign(g, ['1925', '$1,000'], 2.0, 1.0, -1.3, 1.6, -7, { bg: '#26262c', fg: '#f4ecd8' });
    stackNew = new THREE.Group(); stackNew.position.set(1.6, 0, -7); g.add(stackNew);
    for (let i = 0; i < 18; i++) { box(stackNew, 1.0, 0.4, 0.5, '#7fa36a', ((i % 3) - 1) * 1.05, 0.2 + Math.floor(i / 6) * 0.42, (Math.floor(i / 3) % 2) * 0.55 - 0.27); }
    sign(g, ['TODAY', '$18,300'], 2.4, 1.2, 1.6, 2.6, -7.3, { bg: '#26262c', fg: '#7ee08a' });
    melt = new THREE.Group(); melt.position.set(0, 0, -5.5); g.add(melt); box(melt, 1.2, 0.5, 0.6, '#7fa36a', 0, 0.25, 0); box(melt, 0.35, 0.51, 0.61, '#e9e4d2', 0, 0.25, 0);
  }

  /* ─── money & stamps timeline ─── */
  const buys25 = () => [[T('purchased', 1), 260, 'FORD MODEL T'], [T('purchased', 2), 50, '1,000 BOTTLES OF COLA'], [T('purchased', 3), 25, '100 MOVIE TICKETS'], [T('purchased', 4), 10, '500 STAMPS']];
  const declines = () => [[T('declined', 1), 17000, 'NEW CAR'], [T('declined', 2), 2000, '1,000 BOTTLES OF COLA'], [T('declined', 3), 1100, '100 MOVIE TICKETS']];
  function moneyAt(t) {
    const today = T('today', 1);
    if (t < today) { let m = 1000; buys25().forEach(([t0, c]) => { m -= c * easeOut((t - t0) / 0.6); }); return m; }
    const tb = T('almost', 2); return 1000 - 390 * easeOut((t - tb) / 0.6);
  }

  /* ─── HUD ─── */
  function stamp(g, t, t0, title, sub, col) {
    ev(col === '#ff5a4a' ? 'hit' : 'ding', t0);
    const d = t - t0; if (d < 0 || d > 2.2) return;
    const k = spring(d, 2.4, 0.42), fade = d > 1.9 ? 1 - (d - 1.9) / 0.3 : 1;
    g.save(); g.globalAlpha = fade; g.translate(W / 2, 380); g.scale(k, k);
    hudText(g, title, 0, 0, '130px Anton', col, { align: 'center', stroke: 14, strokeColor: 'rgba(10,15,10,0.8)' });
    hudText(g, sub, 0, 70, '800 40px Montserrat', '#ffffff', { align: 'center', shadow: 12 });
    g.restore();
  }
  function hud(g, s) {
    const t = s.t, today = T('today', 1), reveal = T("here's");
    const now = t >= today;
    if (t < reveal) {
      hudText(g, 'YEAR', 80, 860, '800 30px Montserrat', 'rgba(255,255,255,0.9)', { shadow: 10 });
      hudText(g, now ? 'TODAY' : '1925', 80, 950, '90px Anton', '#ffffff', { stroke: 10 });
      const m = moneyAt(t);
      hudText(g, money(m), 80, 1080, '120px Anton', '#7ee08a', { stroke: 14 });
      const evs = now ? [[T('almost', 2), 390]] : buys25().map(([t0, c]) => [t0, c]);
      evs.forEach(([t0, c]) => { const d = t - t0; if (d > 0 && d < 1.6) hudText(g, '-' + money(c), 80, 1150, '62px Anton', '#ff5a4a', { stroke: 10 }); });
      if (now) declines().forEach(([t0, c]) => { const d = t - t0; if (d > 0 && d < 1.6) { hudText(g, 'NEED ' + money(c), 80, 1150, '62px Anton', '#ff5a4a', { stroke: 10 }); } });
    }
    buys25().forEach(([t0, , item]) => stamp(g, t, t0, 'PURCHASED', item, '#7ee08a'));
    declines().forEach(([t0, , item]) => stamp(g, t, t0, 'DECLINED', item, '#ff5a4a'));
    stamp(g, t, T('barely'), 'PURCHASED', '500 STAMPS', '#7ee08a');
  }

  /* ─── shots (camera = first person; hands visible when shopping) ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update) => shots.push({ id, t0, set, cam, update });
  const pov = (x, y, z, lx, ly, lz, fov = 62) => ({ pos: [x, y, z], look: [lx, ly, lz], fov });
  const walk = (s, z0, speed = 1.3) => { const z = z0 - s.lt * speed; return { z, bob: Math.sin(s.lt * 8) * 0.04 }; };
  const era = (now, sleeve) => { buildHands(sleeve); setHeld(now ? 'card' : 'cash'); };
  let curEra = null;
  const handsFor = (now) => { const k = now ? 'now' : 'old'; if (curEra !== k) { era(now, now ? '#3d5a80' : '#5a4a3a'); curEra = k; } };
  const give = (s, t0) => clamp(Math.sin(Math.PI * clamp((s.t - t0 + 0.35) / 0.7)));

  // hook + "spend it twice": walking down the 1925 street, cash in hand
  shot('P1', 0, 'STREET25', (s) => { const w = walk(s, 6, 1.4); return pov(0.3, 1.65 + w.bob, w.z, -0.4, 1.6, w.z - 10); }, (s) => { handsFor(false); poseHands(s.t); });
  shot('P1b', T('wrong'), 'STREET25', (s) => { const w = walk(s, 0, 1.0); return pov(-0.5, 1.65 + w.bob, w.z, -6, 4.5, w.z - 8); }, (s) => { handsFor(false); poseHands(s.t); }); // look up at the shops
  shot('P2', T('so', 1), 'STREET25', (s) => { const a = ease(s.p); return { ...pov(0, 1.65, -2 - s.lt, lerp(-8, 8, a) * 0.2, 1.8, -12 - s.lt), fov: 70 }; }, (s) => { handsFor(false); poseHands(s.t); });
  shot('P3', T('america'), 'STREET25', (s) => { const w = walk(s, -2, 1.6); return pov(-2.2, 1.65 + w.bob, w.z, -9, 2.4, w.z - 6); }, (s) => { handsFor(false); poseHands(s.t); });
  // Ford dealer
  shot('P4', T('walk'), 'FORD', (s) => pov(0, 1.65, 1.5 - s.lt * 0.8, 0, 1.2, -7), (s) => { handsFor(false); poseHands(s.t, give(s, T('purchased', 1))); });
  shot('P4b', T('model'), 'FORD', (s) => pov(3.2, 1.5, -2.6 - s.lt * 0.2, 0, 1.2, -7), (s) => { handsFor(false); poseHands(s.t, give(s, T('purchased', 1))); });
  // soda fountain: crates stack up as you buy a thousand
  shot('P5', T('a', 4), 'SODA', (s) => pov(0, 1.65, 1 - s.lt * 0.4, 0, 1.3, -9), (s) => { handsFor(false); poseHands(s.t, give(s, T('purchased', 2))); const n = Math.floor(40 * clamp((s.t - T('buy', 1)) / 1.4)); crates25.forEach((c, i) => (c.visible = i < n)); });
  shot('P5b', T('purchased', 2), 'SODA', (s) => pov(-1.5, 2.6, -0.5, -0.2, 0.8, -5), (s) => { handsFor(false); poseHands(s.t, give(s, T('purchased', 2))); crates25.forEach((c) => (c.visible = true)); });
  // cinema: tickets pile up
  shot('P6', T('movie', 1), 'CINEMA', (s) => pov(0, 1.7, -1 - s.lt * 0.6, 0, 4.5, -12), (s) => { handsFor(false); poseHands(s.t, give(s, T('purchased', 3))); const n = Math.floor(60 * clamp((s.t - T('hundred', 2)) / 1.2)); tickets.forEach((tk, i) => (tk.visible = i < n)); });
  shot('P6x', T('you', 4), 'CINEMA', (s) => pov(-0.8, 1.5, -6.2, 0, 0.1, -9), (s) => { handsFor(false); poseHands(s.t, give(s, T('purchased', 3))); const n = Math.floor(60 * clamp((s.t - T('hundred', 2)) / 1.2)); tickets.forEach((tk, i) => (tk.visible = i < n)); });
  shot('P6b', T('purchased', 3), 'CINEMA', (s) => pov(0.5, 2.2, -5.5, 0, 0.2, -9), (s) => { handsFor(false); poseHands(s.t, give(s, T('purchased', 3))); tickets.forEach((tk) => (tk.visible = true)); });
  // post office
  shot('P7', T('stamp', 1), 'POST', (s) => pov(0, 1.65, 0.5 - s.lt * 0.5, 0, 1.4, -8), (s) => { handsFor(false); poseHands(s.t, give(s, T('purchased', 4))); const n = Math.floor(50 * clamp((s.t - T('five', 2)) / 1.2)); letters.forEach((l, i) => (l.visible = i < n)); });
  // still $655 in your pocket: back on the street, looking at the cash
  shot('P8', T('and', 2), 'STREET25', (s) => pov(0, 1.65, -20 - s.lt * 0.3, -0.2, 1.4, -30), (s) => { handsFor(false); poseHands(s.t, 0.7); });
  // era flip → today
  shot('P9', T('now'), 'STREETNOW', (s) => { const w = walk(s, 6, 1.4); return pov(0.5, 1.65 + w.bob, w.z, -0.5, 1.8, w.z - 10); }, (s) => { handsFor(true); poseHands(s.t); });
  shot('P10', T('cheapest'), 'DEALER', (s) => pov(0, 1.65, 1.5 - s.lt * 0.6, 0, 1.2, -7), (s) => { handsFor(true); poseHands(s.t, give(s, T('declined', 1))); });
  shot('P11', T('a', 10), 'STORE', (s) => pov(0, 1.65, 0 - s.lt * 0.8, 0, 2.2, -12), (s) => { handsFor(true); poseHands(s.t, give(s, T('declined', 2))); });
  shot('P12', T('a', 11), 'MULTIPLEX', (s) => pov(0, 1.65, 0 - s.lt * 0.6, 0, 3.6, -15), (s) => { handsFor(true); poseHands(s.t, give(s, T('declined', 3))); });
  shot('P13', T('five', 3), 'POSTNOW', (s) => pov(0, 1.65, 0.5 - s.lt * 0.5, 0, 1.4, -8), (s) => { handsFor(true); poseHands(s.t, give(s, T('barely'))); });
  // the reveal: stillness, then the two stacks; then the melt
  shot('P13b', T('your', 2), 'POSTNOW', (s) => pov(1.6, 1.7, -3.6 - s.lt * 0.2, -0.3, 1.5, -8), (s) => { handsFor(true); poseHands(s.t, give(s, T('barely'))); });
  shot('P14', T("here's"), 'STUDIO', (s) => ({ ...pov(0, 2.0, 0.5 - ease(s.p) * 1.0, 0.1, 1.2, -7), hands: false }), (s) => { const k = clamp((s.t - T('worth')) / 1.2); stackNew.scale.set(1, Math.max(0.01, easeOut(k)), 1); stackNew.visible = k > 0; melt.visible = false; });
  shot('P14b', T('worth'), 'STUDIO', (s) => ({ ...pov(1.2, 1.8, -2.4 - s.lt * 0.3, 1.6, 1.3, -7), hands: false }), (s) => { const k = clamp((s.t - T('worth')) / 1.2); stackNew.scale.set(1, Math.max(0.01, easeOut(k)), 1); stackNew.visible = k > 0; melt.visible = false; });
  shot('P15', T('your', 3), 'STUDIO', (s) => ({ ...pov(0, 1.7, -1.6 - s.lt * 0.15, 0, 0.3, -5.5), hands: false }), (s) => { stackNew.visible = true; stackNew.scale.set(1, 1, 1); melt.visible = true; const m = clamp((s.t - T('melted') + 0.1) / 0.9); melt.scale.set(1 + 0.6 * m, Math.max(0.05, 1 - 0.95 * m), 1 + 0.6 * m); });
  // the question: back in 1925 street, cash in hand
  shot('P16', T('so', 2), 'STREET25', (s) => pov(0, 1.65, -20 - s.lt * 0.2, 0.2, 1.4, -30), (s) => { handsFor(false); poseHands(s.t, 0.7); });

  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, wipes: [T('now')], end: A.duration };
};

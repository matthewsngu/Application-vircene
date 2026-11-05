/* "What if you had to spend Elon Musk's fortune?" — blocky 3D first-person what-if, vertical 1080×1920.
 * Upgrade over the 1925 film: ACES tone mapping, gradient skies + env reflections, sun shadows that follow
 * the camera, instanced fleets / crowds / cities (thousands of objects), crane and orbit camera moves.
 * Figures (checked Nov 2026): net worth ≈ $865B (Bloomberg, Nov 4 2026); Gulfstream G700 ≈ $80M list;
 * Burj Khalifa ≈ $1.5B build cost; all 32 NFL teams ≈ $299B (Sportico 2026, avg $9.34B); Twitter $44B (2022);
 * SpaceX ≈ 4/5 of his net worth (Forbes, Nov 2026); US population ≈ 340M → ≈ $2,500 each.
 */
window.buildFilm = (A) => {
  const { THREE, T, W, H, clamp, lerp, ease, easeOut, spring, hash, ev, box, sign, person, walkPose, idlePose, mat, buildHands, setHeld, poseHands, hudText, money, instanced } = A;

  const MB = { metalness: 0.25, roughness: 0.3 }, GL = { metalness: 0.6, roughness: 0.08 };
  const peopleCols = [
    { body: '#e0e4ea', legs: '#2c3e5c', hair: '#3a2a20' }, { body: '#c96a5a', legs: '#26262c', hair: '#1f1b1b' },
    { body: '#4f7c86', legs: '#5d6670', hair: '#c9a46a' }, { body: '#d8b25a', legs: '#2c3e5c', hair: '#6a4630' },
    { body: '#6b5b95', legs: '#26262c', hair: '#1f1b1b', skin: '#a8754f' }, { body: '#2f8f6f', legs: '#3b3530', hair: '#3a2a20', skin: '#c68a5e' },
  ];
  const skinTones = ['#f1c7a5', '#e8b48f', '#c68a5e', '#a8754f', '#7a4f33'];
  const crowdCols = ['#c0392b', '#ecf0f1', '#2c6fb0', '#f1c40f', '#1f3b63', '#e67e22', '#27ae60', '#8e44ad', '#d35454', '#f4f6f8'];

  /* ─── part lists (shared by single objects and instanced fleets) ─── */
  function addParts(g, parts) { parts.forEach((p) => { const m = box(g, p.w, p.h, p.d, p.c, p.x, p.y, p.z, { mat: p.mat || {}, cast: p.cast }); m.rotation.set(p.rx || 0, p.ry || 0, 0); }); return g; }
  function jetParts(col = '#f2f4f7', acc = '#1f3b63') {
    const P = []; const add = (w, h, d, c, x, y, z, o = {}) => P.push({ w, h, d, c, x, y, z, mat: MB, ...o });
    add(2.6, 2.6, 20, col, 0, 3.2, 0); add(2.3, 2.3, 2, col, 0, 3.15, 11); add(1.8, 1.7, 1.6, col, 0, 3.0, 12.8); add(1.1, 1.0, 1.2, col, 0, 2.9, 14.2);
    add(1.95, 0.45, 0.9, '#141b26', 0, 3.75, 12.3, { mat: GL, rx: -0.5 });
    add(2.2, 2.1, 2.2, col, 0, 3.4, -11.1); add(1.5, 1.5, 2.2, col, 0, 3.7, -13.3); add(0.8, 0.9, 1.6, col, 0, 3.9, -15.1);
    add(2.64, 0.18, 24, acc, 0, 2.55, -0.5);
    for (let i = 0; i < 7; i++) { add(0.06, 0.6, 0.75, '#141b26', 1.3, 3.55, 7 - i * 2.0, { mat: GL, cast: false }); add(0.06, 0.6, 0.75, '#141b26', -1.3, 3.55, 7 - i * 2.0, { mat: GL, cast: false }); }
    add(13, 0.32, 4.2, col, 7.4, 2.3, -1.4, { ry: 0.35 }); add(13, 0.32, 4.2, col, -7.4, 2.3, -1.4, { ry: -0.35 });
    add(0.25, 2.0, 1.4, acc, 13.5, 3.2, -3.8); add(0.25, 2.0, 1.4, acc, -13.5, 3.2, -3.8);
    [-1, 1].forEach((sx) => { add(1.4, 1.4, 3.8, '#e3e6ea', 2.4 * sx, 4.0, -8.6); add(1.05, 1.05, 0.1, '#1a1d22', 2.4 * sx, 4.0, -6.68, { cast: false }); add(1.2, 0.35, 1.6, col, 1.7 * sx, 3.85, -8.6); });
    add(0.4, 5.2, 3.4, col, 0, 6.6, -13.6, { rx: -0.38 }); add(0.42, 1.3, 2.6, acc, 0, 7.4, -14.0, { rx: -0.38 });
    add(8.5, 0.28, 2.3, col, 0, 9.0, -15.3);
    add(0.25, 1.5, 0.25, '#9aa0a8', 0, 1.15, 11.2); add(0.35, 0.8, 0.8, '#15161a', 0, 0.4, 11.2);
    [-1, 1].forEach((sx) => { add(0.3, 1.4, 0.3, '#9aa0a8', 1.9 * sx, 1.2, -1.5); add(0.5, 0.9, 1.0, '#15161a', 1.9 * sx, 0.45, -1.5); });
    return P;
  }
  const palletParts = () => [
    { w: 1.6, h: 0.18, d: 1.2, c: '#a07850', x: 0, y: 0.09, z: 0 },
    { w: 1.5, h: 1.1, d: 1.1, c: '#6f9a5e', x: 0, y: 0.73, z: 0, mat: { roughness: 0.9 } },
    { w: 1.52, h: 0.16, d: 1.12, c: '#e9e4d2', x: 0, y: 0.5, z: 0, cast: false }, { w: 1.52, h: 0.16, d: 1.12, c: '#e9e4d2', x: 0, y: 0.98, z: 0, cast: false },
    { w: 0.12, h: 1.12, d: 1.12, c: '#d8b25a', x: 0, y: 0.73, z: 0, cast: false },
  ];
  // tiny blocky spectator / resident for instanced crowds (body tinted per instance)
  const minifig = (k = 1) => [
    { w: 0.42 * k, h: 0.55 * k, d: 0.26 * k, c: '#fff', tint: true, x: 0, y: 0.75 * k, z: 0, cast: false },
    { w: 0.34 * k, h: 0.34 * k, d: 0.34 * k, c: '#fff', tint: true, x: 0, y: 1.2 * k, z: 0, cast: false },
    { w: 0.38 * k, h: 0.5 * k, d: 0.24 * k, c: '#2c3e5c', x: 0, y: 0.25 * k, z: 0, cast: false },
  ];
  function tower(g, x, z, Ht = 170, s = 1) {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t);
    const glass = { metalness: 0.75, roughness: 0.12 }, silver = { metalness: 0.6, roughness: 0.25 };
    box(t, 34, 5, 34, '#d8c8a8', 0, 2.5, 0); box(t, 26, 3, 26, '#c9b896', 0, 6.5, 0);
    const N = 12, th = (Ht * 0.78) / N;
    for (let k = 0; k < N; k++) {
      const f = k / N, L = 13 * (1 - f * 0.85), w = 6 * (1 - f * 0.5), y = 8 + k * th + th / 2;
      const c = k % 3 === 2 ? '#c9d3dc' : '#9fc3d8', m = k % 3 === 2 ? silver : glass;
      box(t, 6.5 * (1 - f * 0.5), th, 6.5 * (1 - f * 0.5), '#b9cbd8', 0, y, 0, { mat: silver });
      [0, 2.094, 4.189].forEach((a, j) => { const LL = L * (1 - (j === (k % 3) ? 0.18 : 0)); const mm = box(t, w, th * 0.97, LL, c, Math.sin(a) * LL / 2, y, Math.cos(a) * LL / 2, { mat: m }); mm.rotation.y = a; });
    }
    const top = 8 + N * th;
    box(t, 2.4, Ht * 0.12, 2.4, '#d6dde4', 0, top + Ht * 0.06, 0, { mat: silver }); box(t, 1.4, Ht * 0.1, 1.4, '#e3e8ed', 0, top + Ht * 0.17, 0, { mat: silver });
    box(t, 0.6, Ht * 0.08, 0.6, '#eef1f4', 0, top + Ht * 0.26, 0, { mat: silver });
    return t;
  }
  function hangarProps(g) { // ladder steps + chocks + tool carts: small things that give scale
    for (let i = 0; i < 5; i++) box(g, 1.2, 0.2, 0.5, '#d8b25a', 3.2, 0.3 + i * 0.4, 8.6 - i * 0.45);
    box(g, 0.1, 2.4, 2.6, '#9aa0a8', 3.85, 1.2, 7.7); box(g, 0.1, 2.4, 2.6, '#9aa0a8', 2.55, 1.2, 7.7);
    [[0, 12.2], [2.3, -0.2], [-2.3, -0.2]].forEach(([x, z]) => box(g, 0.6, 0.35, 0.4, '#e2572c', x, 0.18, z + 0.9));
    box(g, 1.6, 1.0, 0.9, '#b8322e', -14, 0.5, 2); box(g, 1.6, 0.1, 0.9, '#2b2f36', -14, 1.05, 2);
  }

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, sky, extra = {}) => { const group = new THREE.Group(); sets[name] = { group, sky, ...extra }; return group; };

  // VAULT: a hall of cash pallets (~$865B worth of "money"), round vault door at the back
  let vaultPallets, vaultN = 0, stockX, stockT, stockXS, stockTS;
  {
    const g = mk('VAULT', '#3a3f4c', { skyTop: '#22252e', sun: [8, 30, 14], sunI: 1.9, hemi: 1.15, hemiSky: '#e8eeff', hemiGround: '#4a4236', fogNear: 30, fogFar: 140, exposure: 1.25, shadow: 40, ground: '#2a2a30', sunColor: '#fff0d8' });
    box(g, 70, 0.2, 90, '#565b66', 0, -0.1, -30, { cast: false, mat: { roughness: 0.25, metalness: 0.2 } });
    box(g, 70, 20, 0.6, '#454a55', 0, 10, -75, { cast: false }); box(g, 0.6, 20, 90, '#454a55', -35, 10, -30, { cast: false }); box(g, 0.6, 20, 90, '#454a55', 35, 10, -30, { cast: false });
    for (let z = 10; z > -75; z -= 10) { box(g, 70, 0.6, 0.8, '#30343c', 0, 19.5, z, { cast: false }); box(g, 60, 0.12, 0.5, '#fff6e0', 0, 19.1, z, { cast: false, mat: { emissive: '#fff6e0', emissiveIntensity: 1.2 } }); }
    for (let x = -30; x <= 30; x += 10) { box(g, 1.2, 20, 1.2, '#3c414b', x, 10, -74); }
    // vault door
    const door = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 1.2, 48), mat('#a9b2bd', { metalness: 0.85, roughness: 0.25 })); door.rotation.x = Math.PI / 2; door.position.set(0, 8, -74.1); door.castShadow = true; g.add(door);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.6, 32), mat('#d8b25a', { metalness: 0.9, roughness: 0.2 })); hub.rotation.x = Math.PI / 2; hub.position.set(0, 8, -73.6); g.add(hub);
    for (let k = 0; k < 6; k++) { const sp = box(g, 0.5, 5.6, 0.5, '#d8b25a', 0, 8, -73.2, { mat: { metalness: 0.9, roughness: 0.2 } }); sp.rotation.z = k * Math.PI / 6; }
    sign(g, ['VAULT 01'], 6, 1.2, 0, 16.2, -74.3, { bg: '#22252e', fg: '#d8b25a' });
    // pallets: grid 2 high, aisles
    const list = [];
    for (let row = 0; row < 26; row++) for (let col = -9; col <= 9; col++) { if (col === 0) continue; for (let lv = 0; lv < 3; lv++) list.push({ x: col * 2.6 + Math.sign(col) * 0.8, y: lv * 1.32, z: 2 - row * 2.6, row, col, lv }); }
    vaultN = list.length;
    vaultPallets = instanced(g, palletParts(), list.length); vaultPallets.list = list;
    list.forEach((o, i) => vaultPallets.place(i, o)); vaultPallets.done();
    // the "not cash" reveal: SpaceX ≈ 4/5, Tesla most of the rest
    stockX = new THREE.Group(); stockX.position.set(-5, 0, -30); g.add(stockX);
    box(stockX, 9, 1, 9, '#2f4a72', 0, 0.5, 0, { mat: { metalness: 0.55, roughness: 0.22 } });
    stockXS = sign(g, ['SPACEX', 'SHARES'], 8, 3.2, -5, 2, -25.44, { bg: '#0f1622', fg: '#ffffff', glow: 0.5 });
    stockT = new THREE.Group(); stockT.position.set(6, 0, -30); g.add(stockT);
    box(stockT, 6, 1, 6, '#b8322e', 0, 0.5, 0, { mat: { metalness: 0.5, roughness: 0.25 } });
    stockTS = sign(g, ['TESLA', 'SHARES'], 5.6, 2.1, 6, 1.4, -26.94, { bg: '#3a0f12', fg: '#ffffff', glow: 0.5 });
  }
  const showPallets = (frac, vanish = -1, t = 0) => { // frac: share of pallets left; vanish: time pallets shrink away (front rows first)
    const L = vaultPallets.list, n = Math.round(vaultN * frac);
    L.forEach((o, i) => {
      // spending empties the near rows first: the camera sees the gap, then what's left
      const keep = (L.length - 1 - i) < n;
      let s = keep ? 1 : 0;
      if (keep && vanish >= 0) s = 1 - easeOut((t - vanish - o.row * 0.035 - hash(i) * 0.15) / 0.35);
      vaultPallets.place(i, { ...o, s: Math.max(0.0001, s), hide: s <= 0.001 });
    });
    vaultPallets.done();
  };
  const showStocks = (k) => {
    const kx = easeOut(k), kt = easeOut(clamp(k * 1.3 - 0.2));
    stockX.visible = stockT.visible = stockXS.visible = stockTS.visible = k > 0;
    stockX.scale.set(1, Math.max(0.01, 26 * kx), 1); stockT.scale.set(1, Math.max(0.01, 6.5 * kt), 1);
    stockXS.position.y = Math.max(1.7, 26 * kx * 0.45); stockTS.position.y = Math.max(1.1, 6.5 * kt * 0.55);
  };

  // HANGAR: one jet, glossy floor, open door onto a golden-hour apron
  let salesman;
  {
    const g = mk('HANGAR', '#ffd9a8', { skyTop: '#7fb0e0', sun: [-10, 14, -20], sunI: 3.0, sunColor: '#ffd9a8', hemi: 1.0, hemiSky: '#e6f0ff', hemiGround: '#6b6258', fogNear: 60, fogFar: 220, shadow: 30, exposure: 1.05 });
    box(g, 60, 0.2, 70, '#9aa2ab', 0, -0.1, -10, { cast: false, mat: { roughness: 0.15, metalness: 0.2 } }); box(g, 62, 0.4, 64, '#4a515c', 0, 18.8, -8, { cast: false });
    for (let x = -24; x <= 24; x += 8) box(g, 0.15, 0.02, 60, '#e8c64a', x, 0.01, -10, { cast: false });
    for (let z = 22; z > -38; z -= 2) { box(g, 0.5, 18, 2, z % 4 === 0 ? '#c9ced4' : '#bfc4ca', -30, 9, z, { cast: false }); box(g, 0.5, 18, 2, z % 4 === 0 ? '#c9ced4' : '#bfc4ca', 30, 9, z, { cast: false }); }
    for (let z = 22; z > -40; z -= 6) { box(g, 60, 1, 0.8, '#8a929c', 0, 18, z, { cast: false }); box(g, 40, 0.15, 0.6, '#fffaf0', 0, 17.4, z, { cast: false, mat: { emissive: '#fffaf0', emissiveIntensity: 1.0 } }); }
    // back wall only above the door: the apron and sunset show through
    box(g, 60, 6, 0.5, '#bfc4ca', 0, 15, -40, { cast: false });
    box(g, 300, 0.1, 200, '#9aa0a8', 0, -0.05, -140, { cast: false });
    box(g, 300, 0.12, 200, '#7a9a5a', 0, -0.06, -260, { cast: false });
    for (let i = 0; i < 6; i++) box(g, 0.3, 0.02, 40, '#e8c64a', -20 + i * 8, 0.02, -80, { cast: false });
    const j = new THREE.Group(); j.position.set(0, 0, -6); g.add(j); addParts(j, jetParts('#f4f6f8', '#1f3b63'));
    hangarProps(g);
    sign(g, ['GULFSTREAM G700'], 9, 1.4, 0, 13.5, -39.7, { bg: '#1f3b63', fg: '#ffffff', glow: 0.3 });
    const st = new THREE.Group(); st.position.set(4.6, 0, 12); g.add(st); box(st, 0.1, 1.2, 0.1, '#2b2f36', 0, 0.6, 0); sign(st, ['$80,000,000'], 2.2, 0.8, 0, 1.55, 0, { bg: '#ffffff', fg: '#1f3b63', ry: -0.35 });
    salesman = person(g, { body: '#1f2633', legs: '#1f2633', hair: '#1f1b1b' }, -2.6, 11.5, { ry: 0.5 });
    sets.HANGAR.update = (s) => { idlePose(salesman, s.t, 1); salesman.armR.rotation.x = -1.0 - Math.sin(s.t * 2.5) * 0.12; };
  }

  // TARMAC: the fleet of 100 jets
  let fleet;
  {
    const g = mk('TARMAC', '#ffd2a0', { skyTop: '#6fa0d8', sun: [-30, 18, -40], sunI: 3.2, sunColor: '#ffcf9a', hemi: 0.95, hemiSky: '#dfeaff', hemiGround: '#6b6258', fogNear: 160, fogFar: 700, shadow: 60, exposure: 1.05 });
    box(g, 420, 0.1, 520, '#a3a8ae', 0, -0.05, -160, { cast: false });
    box(g, 1400, 0.08, 1400, '#7d9c5a', 0, -0.1, -300, { cast: false });
    for (let r = 0; r < 10; r++) box(g, 360, 0.02, 0.5, '#e8c64a', 0, 0.01, 18 - r * 36, { cast: false });
    for (let c = 0; c < 11; c++) box(g, 0.4, 0.02, 380, '#f4f6f8', -150 + c * 30, 0.01, -150, { cast: false });
    // terminal + tower on the left
    box(g, 30, 14, 160, '#d7dbe0', -230, 7, -120); box(g, 30.5, 4, 160, '#5c86a8', -230, 9, -120, { cast: false, mat: GL });
    box(g, 6, 50, 6, '#d7dbe0', -205, 25, -40); box(g, 12, 6, 12, '#5c86a8', -205, 53, -40, { mat: GL }); box(g, 13, 1, 13, '#2b2f36', -205, 56.5, -40);
    const parts = jetParts('#f4f6f8', '#1f3b63');
    fleet = instanced(g, parts, 100);
    for (let i = 0; i < 100; i++) fleet.place(i, { x: -135 + (i % 10) * 30, z: -(Math.floor(i / 10)) * 36, ry: 0 });
    fleet.done();
  }

  // DESERT: one supertall tower, then five; low city, palms, roads
  const towers = [];
  {
    const g = mk('DESERT', '#ffd7a1', { skyTop: '#5f97d6', sun: [40, 30, 30], sunI: 3.0, sunColor: '#ffd9a8', hemi: 1.0, hemiSky: '#cfe2ff', hemiGround: '#a8865a', fogNear: 250, fogFar: 1100, fog: '#f2d2a8', shadow: 160, exposure: 1.0, ground: '#c9a676' });
    box(g, 2400, 0.1, 2400, '#e2c38f', 0, -0.05, -300, { cast: false });
    for (let k = -4; k <= 4; k++) { box(g, 10, 0.06, 1200, '#4a4d52', k * 70, 0.02, -300, { cast: false }); box(g, 1200, 0.06, 10, '#4a4d52', 0, 0.02, -k * 70 - 80, { cast: false }); }
    const city = []; for (let i = 0; i < 420; i++) { const a = hash(i) * Math.PI * 2, r = 70 + hash(i * 3.1) * 520; const x = Math.cos(a) * r, z = -80 + Math.sin(a) * r * 0.9; if (Math.abs(x % 70) < 9 || Math.abs((z + 80) % 70) < 9) continue; if ([[0, -80], [-120, -40], [125, -55], [-80, -230], [95, -250]].some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 34)) continue; city.push({ x, z, h: 6 + Math.pow(hash(i * 7.7), 3) * 55, w: 8 + hash(i * 2.3) * 12 }); }
    const blocks = instanced(g, [{ w: 1, h: 1, d: 1, c: '#fff', tint: true, x: 0, y: 0.5, z: 0 }], city.length);
    const bc = ['#e9dcc4', '#d8c8a8', '#c9d3dc', '#b9cbd8', '#f1e7d4', '#9fc3d8'];
    city.forEach((b, i) => { blocks.meshes[0].m.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(b.x, 0, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.w)).multiply(new THREE.Matrix4().makeTranslation(0, 0.5, 0))); blocks.color(i, 0, bc[i % bc.length]); });
    blocks.done();
    const palms = []; for (let i = 0; i < 160; i++) palms.push({ x: (i % 2 ? 1 : -1) * (8 + (i % 4 > 1 ? 70 : 0)), z: 40 - Math.floor(i / 4) * 12 });
    const pt = instanced(g, [{ w: 0.6, h: 7, d: 0.6, c: '#8a6a4c', x: 0, y: 3.5, z: 0 }, { w: 4.5, h: 0.6, d: 1.4, c: '#3f7a3a', x: 0, y: 7, z: 0 }, { w: 1.4, h: 0.6, d: 4.5, c: '#4a8a42', x: 0, y: 7.1, z: 0 }], palms.length);
    palms.forEach((o, i) => pt.place(i, { ...o, ry: hash(i) })); pt.done();
    towers.push(tower(g, 0, -80, 170));
    [[-120, -40], [125, -55], [-80, -230], [95, -250]].forEach(([x, z]) => towers.push(tower(g, x, z, 170)));
    box(g, 120, 0.4, 70, '#6fb4d8', 0, 0.1, -10, { cast: false, mat: { roughness: 0.1, metalness: 0.3 } }); // fountain lake
  }
  const raiseTowers = (t) => towers.forEach((tw, i) => { if (i === 0) return; const k = easeOut((t - T('five', 1) + 0.25 - i * 0.18) / 0.9); tw.visible = k > 0; tw.scale.set(1, Math.max(0.01, k), 1); });

  // STADIUM: elliptical bowl, ~2,700 instanced fans doing the wave, floodlights at dusk
  let fans, fanList = [];
  {
    const g = mk('STADIUM', '#f0a070', { skyTop: '#3a3f7a', sun: [-60, 20, -40], sunI: 2.2, sunColor: '#ffb27a', hemi: 1.2, hemiSky: '#c9d4ff', hemiGround: '#3a5a3a', fogNear: 150, fogFar: 600, shadow: 70, exposure: 1.1, ground: '#3a5a3a' });
    box(g, 600, 0.1, 600, '#3d4a3a', 0, -0.06, 0, { cast: false });
    box(g, 76, 0.1, 36, '#4f9a4a', 0, 0, 0, { cast: false });
    for (let k = 0; k < 12; k++) box(g, 5, 0.02, 34, k % 2 ? '#56a650' : '#4a9045', -27.5 + k * 5, 0.06, 0, { cast: false });
    for (let k = 0; k <= 12; k++) box(g, 0.25, 0.03, 34, '#f4f6f8', -30 + k * 5, 0.08, 0, { cast: false });
    box(g, 8, 0.03, 34, '#b8322e', -34, 0.07, 0, { cast: false }); box(g, 8, 0.03, 34, '#1f3b63', 34, 0.07, 0, { cast: false });
    [-38.5, 38.5].forEach((x) => { box(g, 0.3, 6, 0.3, '#f1c40f', x, 3, -2.8); box(g, 0.3, 6, 0.3, '#f1c40f', x, 3, 2.8); box(g, 0.3, 0.3, 5.6, '#f1c40f', x, 3, 0); });
    const A0 = 46, B0 = 26, SEG = 72, ROWS = 16;
    const rows = instanced(g, [{ w: 1, h: 1, d: 1, c: '#fff', tint: true, x: 0, y: 0, z: 0 }], SEG * ROWS);
    let n = 0;
    for (let sg = 0; sg < SEG; sg++) {
      const a = (sg / SEG) * Math.PI * 2;
      for (let r = 0; r < ROWS; r++) {
        const A = A0 + r * 1.0, B = B0 + r * 1.0, x = Math.cos(a) * A, z = Math.sin(a) * B;
        const tx = -Math.sin(a) * A, tz = Math.cos(a) * B, len = Math.hypot(tx, tz) * (Math.PI * 2 / SEG) * 1.06;
        const ry = Math.atan2(-tz, tx), y = 1.2 + r * 0.62;
        rows.meshes[0].m.setMatrixAt(n, new THREE.Matrix4().compose(new THREE.Vector3(x, y / 2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(len, y, 1.05)));
        rows.color(n++, 0, r % 2 ? '#3a4150' : '#454c5c');
        for (let f = 0; f < 3; f++) { const u = (f - 1) / 3; fanList.push({ x: x + tx / Math.hypot(tx, tz) * len * u, y, z: z, ry: ry + Math.PI / 2 * 0 , a, r, seed: hash(n * 3 + f) }); }
      }
    }
    rows.done();
    // face the field
    fanList.forEach((f) => { f.ry = Math.atan2(-f.x, -f.z); });
    fans = instanced(g, minifig(1.05), fanList.length);
    fanList.forEach((f, i) => { fans.color(i, 0, crowdCols[Math.floor(f.seed * 10)]); fans.color(i, 1, skinTones[Math.floor(hash(i) * 5)]); });
    // rim + floodlight towers
    for (let sg = 0; sg < SEG; sg++) { const a = (sg / SEG) * Math.PI * 2, A = A0 + ROWS + 0.5, B = B0 + ROWS + 0.5; const m = box(g, 4.4, 3, 1.2, '#2b2f36', Math.cos(a) * A, 1.2 + ROWS * 0.62 + 1.5, Math.sin(a) * B); m.rotation.y = Math.atan2(-Math.cos(a) * B, -Math.sin(a) * A); }
    [[-50, -38], [50, -38], [-50, 38], [50, 38]].forEach(([x, z]) => { box(g, 1.2, 30, 1.2, '#5d6670', x, 15, z); box(g, 8, 4, 1, '#2b2f36', x, 31, z, { ry: Math.atan2(-x, -z) }); box(g, 7.4, 3.4, 0.3, '#ffffff', x - Math.sign(x) * 0.4, 31, z - Math.sign(z) * 0.4, { ry: Math.atan2(-x, -z), cast: false, mat: { emissive: '#ffffff', emissiveIntensity: 2.2 } }); });
    sign(g, ['NFL'], 10, 4, 0, 18, -44, { bg: '#1f3b63', fg: '#ffffff', glow: 0.6 });
    sets.STADIUM.update = (s) => { // the wave runs around the bowl
      const wave = (s.t * 1.4) % (Math.PI * 2);
      fanList.forEach((f, i) => { let d = Math.abs(f.a - wave); d = Math.min(d, Math.PI * 2 - d); const up = Math.max(0, 1 - d / 0.35); const bob = Math.abs(Math.sin(s.t * 6 + f.seed * 20)) * 0.06; fans.place(i, { x: f.x, y: f.y + up * 0.5 + bob, z: f.z, ry: f.ry, sy: 1 + up * 0.25 }); });
      fans.done();
    };
  }

  // LEAGUE: 32 stadiums from above, one per team colour
  {
    const g = mk('LEAGUE', '#bcd8f0', { skyTop: '#5f97d6', sun: [40, 50, 20], sunI: 2.8, hemi: 1.1, fogNear: 350, fogFar: 1300, shadow: 260, exposure: 1.0, ground: '#7d9c5a' });
    box(g, 3000, 0.1, 3000, '#7d9c5a', 0, -0.05, 0, { cast: false });
    const teamCols = ['#c0392b', '#1f3b63', '#f1c40f', '#27ae60', '#e67e22', '#8e44ad', '#2c6fb0', '#d35454', '#16a085', '#2b2f36', '#b8860b', '#5d6670', '#e84393', '#0b6e4f', '#7f1d1d', '#1e40af'];
    const SEG = 18, segs = [], fields = [], roofs = [];
    for (let i = 0; i < 32; i++) {
      const cx = -315 + (i % 8) * 90, cz = -(Math.floor(i / 8)) * 90 + 120;
      fields.push({ x: cx, z: cz });
      for (let s = 0; s < SEG; s++) { const a = s / SEG * Math.PI * 2; segs.push({ x: cx + Math.cos(a) * 30, z: cz + Math.sin(a) * 20, ry: Math.atan2(-Math.cos(a) * 20, -Math.sin(a) * 30), team: i }); }
    }
    const fld = instanced(g, [{ w: 40, h: 0.3, d: 20, c: '#4f9a4a', x: 0, y: 0.15, z: 0, cast: false }, { w: 4, h: 0.32, d: 20, c: '#f4f6f8', x: 0, y: 0.16, z: 0, cast: false }], 32);
    fields.forEach((f, i) => fld.place(i, f)); fld.done();
    const st = instanced(g, [{ w: 11.5, h: 9, d: 7, c: '#fff', tint: true, x: 0, y: 4.5, z: 0 }, { w: 11.5, h: 1, d: 7.4, c: '#e9ecef', x: 0, y: 9.5, z: 0 }], segs.length);
    segs.forEach((s, i) => { st.place(i, s); st.color(i, 0, teamCols[s.team % 16]); }); st.done();
    const roads = []; for (let i = 0; i < 9; i++) { roads.push({ x: -360 + i * 90, z: -30, w: 6, d: 520 }); } for (let i = 0; i < 6; i++) roads.push({ x: 0, z: 165 - i * 90, w: 820, d: 6 });
    roads.forEach((r) => box(g, r.w, 0.1, r.d, '#4a4d52', r.x, 0.02, r.z, { cast: false }));
    const trees = []; for (let i = 0; i < 700; i++) trees.push({ x: -400 + hash(i) * 800, z: -260 + hash(i * 1.7) * 500 });
    const tr = instanced(g, [{ w: 0.8, h: 3, d: 0.8, c: '#6a4a34', x: 0, y: 1.5, z: 0 }, { w: 5, h: 5, d: 5, c: '#3f7a3a', x: 0, y: 5, z: 0 }], trees.length);
    trees.forEach((o, i) => { const ok = fields.every((f) => Math.abs(f.x - o.x) > 38 || Math.abs(f.z - o.z) > 28); tr.place(i, { ...o, s: 0.7 + hash(i * 5) * 0.6, hide: !ok }); }); tr.done();
  }

  // TWITTER HQ: city street, HQ at the end
  const walkers = [];
  {
    const g = mk('TWITTER', '#cfe0ee', { skyTop: '#7fb0e0', sun: [30, 40, 20], sunI: 2.6, hemi: 1.1, fogNear: 60, fogFar: 260, shadow: 40, exposure: 1.0 });
    box(g, 14, 0.1, 200, '#4a4d52', 0, 0, -60, { cast: false }); box(g, 5, 0.25, 200, '#b9bcc0', -9.5, 0.12, -60, { cast: false }); box(g, 5, 0.25, 200, '#b9bcc0', 9.5, 0.12, -60, { cast: false });
    for (let i = 0; i < 30; i++) box(g, 0.2, 0.02, 2.4, '#f4f6f8', 0, 0.06, 10 - i * 5, { cast: false });
    for (let i = 0; i < 9; i++) {
      [-1, 1].forEach((sd) => {
        const h = 16 + hash(i * 3 + sd) * 30, z = 4 - i * 12, x = sd * 19;
        box(g, 14, h, 11, i % 2 ? '#d7dbe0' : '#c9b8a0', x, h / 2, z);
        for (let fy = 3; fy < h - 1; fy += 3) box(g, 0.2, 1.6, 9, '#5c86a8', x - sd * 7.02, fy, z, { cast: false, mat: GL });
      });
    }
    // HQ: art-deco block closing the street
    box(g, 44, 36, 14, '#d8ccb6', 0, 18, -96); box(g, 30, 8, 12, '#cbbfa8', 0, 40, -96); box(g, 16, 6, 10, '#bfb39c', 0, 47, -96);
    for (let x = -18; x <= 18; x += 4) box(g, 1.6, 30, 0.3, '#5c86a8', x, 19, -88.9, { cast: false, mat: GL });
    sign(g, ['TWITTER'], 22, 4.4, 0, 30, -88.7, { bg: '#1d9bf0', fg: '#ffffff', glow: 0.4 });
    box(g, 10, 5, 1, '#2b2f36', 0, 2.5, -88.9);
    for (let i = 0; i < 14; i++) walkers.push({ p: person(g, peopleCols[i % 6], (i % 2 ? 9 : -9) + (hash(i) - 0.5) * 2, -6 - i * 6, { ry: i % 2 ? 0 : Math.PI }), dir: i % 2 ? 1 : -1, seed: i });
    for (let i = 0; i < 6; i++) { const c = new THREE.Group(); c.position.set(i % 2 ? 3 : -3, 0, -20 - i * 14); c.rotation.y = i % 2 ? Math.PI : 0; g.add(c); const col = ['#c0392b', '#ecf0f1', '#2c3e5c', '#f1c40f', '#7f8c8d', '#27ae60'][i]; box(c, 1.8, 0.6, 4.2, col, 0, 0.6, 0, { mat: MB }); box(c, 1.6, 0.55, 2.2, '#1f2a36', 0, 1.15, 0.1, { mat: GL }); [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]].forEach(([dx, dz]) => box(c, 0.25, 0.62, 0.62, '#18181c', dx, 0.31, dz)); }
    sets.TWITTER.update = (s) => walkers.forEach((c) => { walkPose(c.p, s.t + c.seed); c.p.root.position.z = -6 - c.seed * 6 + c.dir * ((s.t * 1.2) % 10); });
  }

  // FURNACE: cash pallets ride a conveyor into a glowing furnace
  let belt;
  {
    const g = mk('FURNACE', '#2a2026', { skyTop: '#16121a', sun: [10, 20, 10], sunI: 1.0, hemi: 0.6, hemiSky: '#ffd0a0', hemiGround: '#201818', fogNear: 30, fogFar: 120, shadow: 30, exposure: 1.15, ground: '#201818', sunColor: '#ffd0a0', fillI: 0.25 });
    box(g, 60, 0.2, 80, '#3a3438', 0, -0.1, -20, { cast: false, mat: { roughness: 0.4 } });
    box(g, 60, 20, 0.5, '#2e282c', 0, 10, -50, { cast: false }); box(g, 0.5, 20, 80, '#2e282c', -20, 10, -20, { cast: false }); box(g, 0.5, 20, 80, '#2e282c', 20, 10, -20, { cast: false });
    // furnace
    box(g, 14, 12, 10, '#4a3f3a', 0, 6, -38); box(g, 8, 6, 0.4, '#ff7a1a', 0, 3.5, -32.9, { cast: false, mat: { emissive: '#ff6a00', emissiveIntensity: 2.5 } });
    box(g, 4, 14, 4, '#4a3f3a', 0, 19, -40);
    const glow = new THREE.PointLight(0xff7a2a, 60, 50, 1.6); glow.position.set(0, 3, -28); g.add(glow);
    // conveyor
    box(g, 4, 1.2, 34, '#2b2f36', 0, 0.6, -16); for (let z = 0; z > -33; z -= 1) box(g, 3.8, 0.2, 0.25, '#5d6670', 0, 1.25, z, { cast: false });
    box(g, 0.3, 0.5, 34, '#d8b25a', -2.1, 1.4, -16, { cast: false }); box(g, 0.3, 0.5, 34, '#d8b25a', 2.1, 1.4, -16, { cast: false });
    belt = instanced(g, palletParts(), 14);
    sign(g, ['$1,600,000', 'EVERY MINUTE'], 10, 4, -8, 12, -49.6, { bg: '#16121a', fg: '#ff8a3a', glow: 0.8 });
    sets.FURNACE.update = (s) => { for (let i = 0; i < 14; i++) { const z = 1 - ((s.t * 3.2 + i * 2.6) % 36); belt.place(i, { x: 0, y: 1.35, z, s: z < -32 ? 0.0001 : 1 }); } belt.done(); };
  }

  // NIGHT: same furnace building outside at 3 a.m.; chimney still glowing, houses asleep
  {
    const g = mk('NIGHT', '#1a2448', { skyTop: '#05070f', sun: [-20, 30, -10], sunI: 0.5, sunColor: '#9fb4ff', hemi: 0.45, hemiSky: '#5a6aa8', hemiGround: '#101018', fogNear: 80, fogFar: 300, shadow: 40, exposure: 1.2, ground: '#101018', fillI: 0.15 });
    box(g, 600, 0.1, 600, '#1d2430', 0, -0.05, -100, { cast: false });
    box(g, 40, 16, 24, '#3a3440', 0, 8, -60); box(g, 5, 30, 5, '#3a3440', 10, 23, -64);
    box(g, 4, 2, 4, '#ff7a1a', 10, 38.5, -64, { cast: false, mat: { emissive: '#ff6a00', emissiveIntensity: 3 } });
    for (let x = -16; x <= 16; x += 4) box(g, 2, 2.4, 0.2, '#ffb35a', x, 10, -47.9, { cast: false, mat: { emissive: '#ff9a3a', emissiveIntensity: 1.6 } });
    const gl = new THREE.PointLight(0xff8a3a, 400, 80, 1.6); gl.position.set(0, 6, -44); g.add(gl);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: '#f4f1e0', fog: false })); moon.position.set(-90, 140, -400); g.add(moon);
    const sg = new THREE.BufferGeometry(); const pos = []; for (let i = 0; i < 900; i++) { const a = hash(i) * Math.PI * 1.2 - Math.PI * 0.1, e = 0.15 + hash(i * 2.2) * 1.2; pos.push(Math.cos(a) * 900 * Math.cos(e) - 450 + 450, 900 * Math.sin(e), -Math.abs(Math.sin(a)) * 900 * Math.cos(e)); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })));
    for (let i = 0; i < 8; i++) { const x = -40 + i * 11, z = -18 - (i % 2) * 6; box(g, 7, 4.5, 7, '#4a4f60', x, 2.25, z); const r1 = box(g, 7.4, 0.5, 4.6, '#3a2f38', x, 5.2, z - 1.6); r1.rotation.x = 0.6; const r2 = box(g, 7.4, 0.5, 4.6, '#3a2f38', x, 5.2, z + 1.6); r2.rotation.x = -0.6; box(g, 1.2, 1.2, 0.1, '#20263a', x - 1.6, 2.4, z + 3.52, { cast: false }); }
  }

  // SUBURB: rows of houses and residents; checks rain down; jets fly over at the end
  let checks, sky, residents = [], crowdA, crowdList = [];
  {
    const g = mk('SUBURB', '#cfe6f6', { skyTop: '#6fa8e0', sun: [30, 40, 25], sunI: 2.8, hemi: 1.15, hemiSky: '#e6f0ff', hemiGround: '#c8d2c0', fogNear: 120, fogFar: 520, shadow: 50, exposure: 1.0, ground: '#c8d0d8' });
    box(g, 1400, 0.1, 1400, '#79a64e', 0, -0.05, -200, { cast: false });
    box(g, 10, 0.08, 800, '#4a4d52', 0, 0.01, -200, { cast: false });
    for (let i = 0; i < 60; i++) box(g, 0.2, 0.02, 2.4, '#f4f6f8', 0, 0.06, 20 - i * 8, { cast: false });
    box(g, 2.4, 0.15, 800, '#c9ccd0', -6.2, 0.07, -200, { cast: false }); box(g, 2.4, 0.15, 800, '#c9ccd0', 6.2, 0.07, -200, { cast: false });
    for (let k = 1; k < 8; k++) box(g, 800, 0.08, 8, '#4a4d52', 0, 0.015, 30 - k * 70, { cast: false });
    const houses = []; for (let side = -1; side <= 1; side += 2) for (let col = 0; col < 6; col++) for (let i = 0; i < 40; i++) { const x = side * (16 + col * 24), z = 14 - i * 14; if (((z - 30) % 70 + 70) % 70 < 10) continue; houses.push({ x, z, ry: side > 0 ? -Math.PI / 2 : Math.PI / 2, s: 0.9 + hash(i * 3 + col) * 0.25, i }); }
    const roofCols = ['#8a3a3a', '#3a3f4c', '#6a4630', '#2c3e5c', '#5d4037'], wallCols = ['#f4ecd8', '#e8edf2', '#f1e0c6', '#dfe8dc', '#f4d9c6', '#d9e2ec'];
    const hp = instanced(g, [
      { w: 9, h: 4.6, d: 8, c: '#fff', tint: true, x: 0, y: 2.3, z: 0 },
      { w: 9.6, h: 0.5, d: 5.3, c: '#fff', tint: true, x: 0, y: 5.6, z: -2.0, rx: 0.62 }, { w: 9.6, h: 0.5, d: 5.3, c: '#fff', tint: true, x: 0, y: 5.6, z: 2.0, rx: -0.62 },
      { w: 1.3, h: 2.3, d: 0.1, c: '#5a3a2a', x: -2, y: 1.15, z: 4.02, cast: false }, { w: 1.5, h: 1.3, d: 0.1, c: '#9fc3d8', x: 1.8, y: 2.6, z: 4.02, cast: false, mat: GL },
      { w: 8, h: 0.1, d: 6, c: '#86b85a', x: 0, y: 0.03, z: 7, cast: false },
      { w: 0.2, h: 1.1, d: 0.2, c: '#5d6670', x: 3.5, y: 0.55, z: 9.6 }, { w: 0.5, h: 0.45, d: 0.7, c: '#2c3e5c', x: 3.5, y: 1.25, z: 9.6 },
    ], houses.length);
    houses.forEach((o, i) => { hp.place(i, o); hp.color(i, 0, wallCols[i % 6]); const rc = roofCols[Math.floor(hash(i * 1.3) * 5)]; hp.color(i, 1, rc); hp.color(i, 2, rc); }); hp.done();
    const trees = []; houses.forEach((h, i) => { if (i % 2 === 0) trees.push({ x: h.x + (h.x > 0 ? -7 : 7), z: h.z - 5 }); });
    const tr = instanced(g, [{ w: 0.5, h: 2.6, d: 0.5, c: '#6a4a34', x: 0, y: 1.3, z: 0 }, { w: 3.4, h: 3.4, d: 3.4, c: '#4f8a3a', x: 0, y: 4, z: 0 }, { w: 2.2, h: 2.2, d: 2.2, c: '#5a9a42', x: 0.4, y: 5.6, z: 0.3 }], trees.length);
    trees.forEach((o, i) => tr.place(i, { ...o, s: 0.8 + hash(i) * 0.5 })); tr.done();
    // residents on the sidewalks, everyone looking up (instanced) + a few hero people near camera
    for (let i = 0; i < 600; i++) { const side = i % 2 ? 1 : -1; crowdList.push({ x: side * (6 + hash(i) * 2.4), z: 16 - (i >> 1) * 1.6 - hash(i * 3) * 0.8, seed: hash(i * 7) }); }
    crowdA = instanced(g, minifig(1), crowdList.length);
    crowdList.forEach((f, i) => { crowdA.place(i, { ...f, ry: f.x > 0 ? -Math.PI / 2 : Math.PI / 2 }); crowdA.color(i, 0, crowdCols[i % 10]); crowdA.color(i, 1, skinTones[Math.floor(f.seed * 5)]); }); crowdA.done();
    for (let i = 0; i < 6; i++) residents.push(person(g, peopleCols[i], (i % 2 ? 3.4 : -3.4) + (hash(i) - 0.5), 8 - i * 3.2, { ry: i % 2 ? -0.9 : 0.9 }));
    // falling checks
    checks = instanced(g, [{ w: 1.0, h: 0.03, d: 0.45, c: '#cfe8c8', x: 0, y: 0, z: 0, cast: false, mat: { emissive: '#203020', emissiveIntensity: 0.3 } }, { w: 0.6, h: 0.035, d: 0.06, c: '#2c6f3a', x: -0.1, y: 0, z: 0.08, cast: false }], 500);
    // the fleet flying over at the end
    sky = instanced(g, jetParts('#f4f6f8', '#1f3b63'), 12, { cast: false });
    const SUB = sets.SUBURB;
    SUB.update = (s) => {
      const t = s.t, ts = T('split');
      for (let i = 0; i < 500; i++) {
        const st = ts + 0.3 + hash(i) * 2.6, k = t - st, x = (hash(i * 1.9) - 0.5) * 70, z0 = 20 - hash(i * 2.7) * 180;
        const y = 60 - k * 9; const on = k > 0 && y > 0.05;
        checks.place(i, { x: x + Math.sin(k * 2 + i) * 2, y: Math.max(0.05, y), z: z0 + Math.cos(k * 1.6 + i) * 1.5, ry: k * 2 + i, rx: Math.sin(k * 3 + i) * 0.6, hide: !(k > 0) });
      }
      checks.done();
      residents.forEach((p, i) => { idlePose(p, t, i); p.head.rotation.x = -0.35; const up = clamp((t - ts - 0.5) / 1.0); p.armL.rotation.x = -2.6 * up * (0.8 + 0.2 * Math.sin(t * 3 + i)); p.armR.rotation.x = -2.6 * up * (0.8 + 0.2 * Math.cos(t * 3 + i)); });
      const tj = T('so', 4) - 0.2;
      for (let i = 0; i < 12; i++) { const k = t - tj; sky.place(i, { x: -20 + (i % 4) * 26 - (i >> 2) * 10, y: 70 + (i >> 2) * 8, z: 100 - k * 55 - (i >> 2) * 40, ry: Math.PI, s: 0.9, hide: k < 0 }); }
      sky.done();
    };
  }

  /* ─── money timeline ─── */
  const START = 865e9;
  const buys = () => [
    [T('purchased', 1), 80e6, 'GULFSTREAM G700', 0.6],
    [T('eight', 2), 7.92e9, '99 MORE JETS', 0.8],
    [T('five', 1), 7.5e9, '5 SUPERTALL TOWERS', 0.8],
    [T('three', 1), 300e9, 'ALL 32 NFL TEAMS', 1.4],
    [T('forty-four'), 44e9, 'TWITTER', 0.9],
  ];
  const moneyAt = (t) => buys().reduce((m, [t0, c, , d]) => m - c * easeOut((t - t0) / d), START);
  const short = (v) => v >= 1e9 ? '$' + parseFloat((v / 1e9).toFixed(1)) + 'B' : '$' + Math.round(v / 1e6) + 'M';

  /* ─── HUD ─── */
  function fitText(g, text, font, size, maxW) { g.font = `${size}px ${font}`; const w = g.measureText(text).width; return w > maxW ? size * maxW / w : size; }
  function stamp(g, t, t0, title, sub, col, dur = 2.1) {
    ev(col === '#ff5a4a' ? 'hit' : 'ding', t0);
    const d = t - t0; if (d < 0 || d > dur) return;
    const k = spring(d, 2.4, 0.42), fade = d > dur - 0.3 ? 1 - (d - (dur - 0.3)) / 0.3 : 1;
    g.save(); g.globalAlpha = fade; g.translate(W / 2 - 40, 380); g.scale(k, k);
    const fs = fitText(g, title, 'Anton', 130, 820);
    hudText(g, title, 0, 0, `${fs}px Anton`, col, { align: 'center', stroke: 14, strokeColor: 'rgba(10,15,10,0.8)' });
    const ss = Math.min(44, 44 * 820 / Math.max(1, (g.font = '800 44px Montserrat', g.measureText(sub).width)));
    hudText(g, sub, 0, 72, `800 ${ss}px Montserrat`, '#ffffff', { align: 'center', shadow: 12, stroke: 6 });
    g.restore();
  }
  function bigLine(g, t, t0, t1, text, col, y, size = 110) { // centred statement card (no counter)
    if (t < t0 || t > t1) return; const k = easeOut((t - t0) / 0.35), f = t > t1 - 0.25 ? (t1 - t) / 0.25 : 1;
    g.save(); g.globalAlpha = clamp(f); g.translate(W / 2 - 40, y + (1 - k) * 40);
    const fs = fitText(g, text, 'Anton', size, 840); hudText(g, text, 0, 0, `${fs}px Anton`, col, { align: 'center', stroke: 14, strokeColor: 'rgba(10,15,10,0.8)' }); g.restore();
  }
  function hud(g, s) {
    const t = s.t, catchT = T("here's"), burnT = T('to', 3);
    if (t < burnT) {
      const m = moneyAt(t), txt = money(m);
      hudText(g, "ELON'S FORTUNE", 80, 960, '800 32px Montserrat', 'rgba(255,255,255,0.92)', { shadow: 10, stroke: 5 });
      // "didn't even flinch": the counter pulses, and we show how little moved
      const fl = T('counter'), pulse = t > fl && t < fl + 1.6 ? Math.sin(clamp((t - fl) / 1.6) * Math.PI) : 0;
      const fs = fitText(g, txt, 'Anton', 112 * (1 + 0.08 * pulse), 860);
      hudText(g, txt, 80, 1080, `${fs}px Anton`, '#7ee08a', { stroke: 14 });
      buys().forEach(([t0, c]) => { const d = t - t0; if (d > 0 && d < 1.8) hudText(g, '-' + money(c), 80, 1150, '58px Anton', '#ff5a4a', { stroke: 10 }); });
      if (t > fl && t < T('so', 1)) hudText(g, 'ONLY 0.009% GONE', 80, 880, '58px Anton', '#ffd23f', { stroke: 10 });
      const sp = T("you've");
      if (t > sp && t < burnT && t > T('forty-four') + 1.8) hudText(g, 'SPENT ≈ $360B · LEFT ' + short(m), 80, 1150, '50px Anton', '#ffd23f', { stroke: 10 });
    }
    buys().forEach(([t0, , item], i) => stamp(g, t, t0, 'PURCHASED', item + '  ·  -' + short(buys()[i][1]), '#7ee08a'));
    // burn: a year clock racing
    if (t >= burnT && t < catchT) {
      const k = clamp((t - burnT) / (catchT - 0.3 - burnT)), day = Math.max(1, Math.ceil(365 * Math.pow(k, 2.2)));
      hudText(g, 'DAY ' + day + ' / 365', 80, 960, '800 40px Montserrat', '#ffffff', { stroke: 6 });
      const burned = Math.min(865e9, 1.6457e6 * 525600 * Math.pow(k, 2.2));
      hudText(g, 'BURNED ' + money(burned), 80, 1080, `${fitText(g, 'BURNED ' + money(burned), 'Anton', 96, 860)}px Anton`, '#ff8a3a', { stroke: 12 });
      hudText(g, '$1.6M EVERY MINUTE', 80, 1150, '54px Anton', '#ffd23f', { stroke: 10 });
    }
    stamp(g, t, T('none'), 'NOT CASH', 'MOSTLY SPACEX + TESLA SHARES', '#ff5a4a', T('split') - T('none') - 0.1);
    bigLine(g, t, T('split') + 0.1, T('every', 2), '$865B ÷ 340M PEOPLE', '#ffffff', 400, 100);
    bigLine(g, t, T('every', 2), T('so', 4) - 0.05, '≈ $2,500 EACH', '#7ee08a', 400, 140);
    if (t >= T('so', 4)) {
      bigLine(g, t, T('so', 4), 1e9, '100 JETS', '#ffffff', 330, 120);
      bigLine(g, t, T('or', 1) , 1e9, 'OR', '#ffd23f', 430, 70);
      bigLine(g, t, T('check'), 1e9, '$2,500 EACH?', '#7ee08a', 545, 120);
    }
  }

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update) => shots.push({ id, t0, set, cam, update });
  const pov = (x, y, z, lx, ly, lz, fov = 62, extra = {}) => ({ pos: [x, y, z], look: [lx, ly, lz], fov, ...extra });
  let handsReady = false;
  const hands = (t, g = 0) => { if (!handsReady) { buildHands('#1d2330'); setHeld('card'); handsReady = true; } poseHands(t, g); };
  const give = (s, t0) => clamp(Math.sin(Math.PI * clamp((s.t - t0 + 0.35) / 0.7)));
  const orbit = (cx, cz, r, a, y, ly, fov = 55, extra = {}) => pov(cx + Math.sin(a) * r, y, cz + Math.cos(a) * r, cx, ly, cz, fov, extra);
  const vault = (frac) => () => { showPallets(frac); showStocks(0); };

  // hook: the vault, crane up over the cash
  shot('V1', 0, 'VAULT', (s) => { const k = ease(s.p); return { ...pov(0, 1.7 + k * 9, 12 - k * 10, 0, 2 + k * 2, -40), hands: false }; }, vault(1));
  shot('V2', T('about', 1), 'VAULT', (s) => { const k = ease(s.p); return { ...pov(-12 + k * 8, 4.2, 6 - k * 10, -4 + k * 6, 1.2, -16), hands: false, fov: 58 }; }, vault(1));
  shot('V3', T('rule'), 'VAULT', (s) => pov(0, 1.7, 4 - s.lt * 1.6, 0, 1.5, -40), (s) => { vault(1)(); hands(s.t); });
  // the first jet
  shot('H1', T('first'), 'HANGAR', (s) => { const k = ease(s.p); return { ...pov(-12 + k * 5, 0.7, 25 - k * 2, -1, 0.4, 6), hands: false, fov: 62 }; });
  shot('H2', T('gulfstream'), 'HANGAR', (s) => pov(1.2, 1.7, 24 - s.lt * 1.2, 0, 0.6, 10), (s) => hands(s.t, give(s, T('purchased', 1))));
  shot('H3', T('purchased', 1), 'HANGAR', (s) => pov(1.2, 1.7, 24 - (T('purchased', 1) - T('gulfstream')) * 1.2 - s.lt * 0.4, 0, 0.6, 10), (s) => hands(s.t, give(s, T('purchased', 1))));
  shot('H4', T('counter'), 'HANGAR', (s) => ({ ...orbit(0, -4, 30, -0.9 + s.lt * 0.25, 2.5 + s.lt * 0.5, -2.5, 58), hands: false }));
  // a hundred of them
  shot('J1', T('so', 1), 'TARMAC', (s) => { const k = ease(s.p); return { ...pov(-150 + k * 20, 4 + k * 70, 40 - k * 10, -40, 0, -170), hands: false, fov: 55 }; });
  shot('J2', T('still', 1), 'TARMAC', (s) => ({ ...pov(-120 + s.lt * 9, 3, 34, -60 + s.lt * 9, 6, -60), hands: false, fov: 60, shadow: 50 }));
  // supertall towers
  shot('D1', T('next'), 'DESERT', (s) => { const k = ease(s.p); return { ...pov(30, 2, -30 + k * 6, 0, lerp(30, 175, k), -80), hands: false, fov: 72 }; }, (s) => raiseTowers(-1));
  shot('D2', T('burj'), 'DESERT', (s) => ({ ...orbit(0, -80, 140, 0.4 + s.lt * 0.14, 140, 120, 52), hands: false }), (s) => raiseTowers(-1));
  shot('D3', T('so', 2), 'DESERT', (s) => { const k = ease(s.p); return { ...pov(10, 70 + k * 30, 260 - k * 30, 0, 70, -140), hands: false, fov: 58 }; }, (s) => raiseTowers(s.t));
  shot('D4', T('still', 2), 'DESERT', (s) => { const k = ease(s.p); return { ...pov(0, 100 + k * 330, 230 + k * 160, 0, 40, -140), hands: false, fov: 58 }; }, (s) => raiseTowers(1e9));
  // the whole NFL
  shot('S1', T('buy', 2), 'STADIUM', (s) => { const k = ease(s.p); return { ...pov(-2 + k * 8, 1.6 + k * 16, 10 + k * 4, 0, 6 + k * 2, -40), hands: false, fov: 66 }; });
  shot('S2', T('all', 2), 'LEAGUE', (s) => { const k = ease(s.p); return { ...pov(-280 + k * 60, 60 + k * 230, 220 + k * 120, -20, 0, -40), hands: false, fov: 55 }; });
  // Twitter
  shot('X1', T('then'), 'TWITTER', (s) => pov(0.8, 1.7, 2 - s.lt * 2.2, 0, 14 - s.lt * 1.5, -90), (s) => hands(s.t, give(s, T('forty-four'))));
  shot('X2', T('he'), 'TWITTER', (s) => ({ ...pov(-6 + s.lt * 2, 1.2 + s.lt * 2, -40 - s.lt * 4, 0, 30, -90, 64), hands: false }));
  // what's left
  shot('V4', T("you've"), 'VAULT', (s) => { const k = ease(s.p); return { ...pov(14 - k * 10, 14 - k * 4, 10, -2, 0, -36), hands: false, fov: 60 }; }, vault(505.5 / 865));
  shot('V4b', T('and', 3), 'VAULT', (s) => ({ ...pov(-1.2, 1.7, -22 - s.lt * 1.4, 0.5, 1.6, -64), hands: false, fov: 60 }), vault(505.5 / 865));
  // burning $1.6M a minute
  shot('F1', T('to', 3), 'FURNACE', (s) => ({ ...pov(5 - s.lt * 0.6, 3.2, 6 - s.lt * 2.2, 0, 1.6, -30), hands: false, fov: 60 }));
  shot('F2', T('one', 4), 'FURNACE', (s) => ({ ...pov(-4, 2.0 + s.lt * 0.3, -20 - s.lt * 1.2, 0, 2.2, -33), hands: false, fov: 56 }));
  shot('N1', T('nonstop'), 'NIGHT', (s) => { const k = ease(s.p); return { ...pov(-30 + k * 16, 2.5 + k * 4, 30 - k * 14, 0, 12 + k * 6, -60), hands: false, fov: 58 }; });
  // the catch: the cash isn't real cash
  shot('C1', T("here's"), 'VAULT', (s) => ({ ...pov(0, 3.2, 14 - s.lt * 0.6, 0, 2.6, -30), hands: false, fov: 62 }), (s) => { showPallets(1, T('none'), s.t); showStocks(0); });
  shot('C2', T('most', 1), 'VAULT', (s) => { const k = ease(s.p); return { ...pov(-18 + k * 8, 4 + k * 10, 12, -1, 12, -30), hands: false, fov: 64 }; }, (s) => { showPallets(1, T('none'), s.t); showStocks(clamp((s.t - T('most', 1)) / 1.4)); });
  // split it across America
  shot('U1', T('split'), 'SUBURB', (s) => { const k = ease(s.p); return { ...pov(0, 2 + k * 40, 26 + k * 10, 0, 0, -120), hands: false, fov: 60 }; });
  shot('U2', T('every', 2), 'SUBURB', (s) => ({ ...pov(1.5 - s.lt * 0.3, 1.5, 15 - s.lt * 0.8, -1, 2.6, 0), hands: false, fov: 58 }));
  shot('U3', T('so', 4), 'SUBURB', (s) => { const k = ease(s.p); return { ...pov(0, 1.7, 20 - s.lt * 1.0, 0, lerp(8, 50, k), -60), hands: false, fov: 66 }; });

  shot('U4', T('tell'), 'SUBURB', (s) => { const k = ease(s.p); return { ...pov(-30 + k * 10, 40 + k * 20, 60 - k * 20, 0, 20, -80), hands: false, fov: 58 }; });

  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, wipes: [], end: A.duration };
};

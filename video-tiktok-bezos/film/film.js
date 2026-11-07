/* "What if you had to spend Jeff Bezos's fortune?" — blocky 3D first-person what-if, vertical 1080×1920.
 * Figures: ≈ $375B (Bloomberg, Nov 4 2026); New Shepard seat auctioned for $28M (2021); superyacht Koru reportedly
 * ≈ $500M with support vessel Abeona (helipad); Warner estate, Beverly Hills, $165M (2020); The Washington Post,
 * $250M (2013); Lakers sale at a record $10B valuation (2025); Amazon bought Whole Foods for $13.7B (2017);
 * $375B ÷ $1M/day = 375,000 days ≈ 1,027 years; Amazon market value ≈ $3T (2026).
 */
window.buildFilm = (A) => {
  const { THREE, T, W, H, clamp, lerp, ease, easeOut, spring, hash, ev, box, sign, person, walkPose, idlePose, mat, buildHands, setHeld, poseHands, hudText, money, instanced, camera } = A;
  const MB = { metalness: 0.25, roughness: 0.3 }, GL = { metalness: 0.6, roughness: 0.08 };
  const crowdCols = ['#552583', '#fdb927', '#ffffff', '#552583', '#fdb927', '#2b2f36', '#c96a5a', '#4f7c86'];
  const skinTones = ['#f1c7a5', '#e8b48f', '#c68a5e', '#a8754f', '#7a4f33'];
  const peopleCols = [{ body: '#e0e4ea', legs: '#2c3e5c' }, { body: '#c96a5a', legs: '#26262c' }, { body: '#4f7c86', legs: '#5d6670', hair: '#c9a46a' }, { body: '#d8b25a', legs: '#2c3e5c' }];
  const minifig = (k = 1) => [
    { w: 0.42 * k, h: 0.55 * k, d: 0.26 * k, c: '#fff', tint: true, x: 0, y: 0.75 * k, z: 0, cast: false },
    { w: 0.34 * k, h: 0.34 * k, d: 0.34 * k, c: '#fff', tint: true, x: 0, y: 1.2 * k, z: 0, cast: false },
    { w: 0.38 * k, h: 0.5 * k, d: 0.24 * k, c: '#2c3e5c', x: 0, y: 0.25 * k, z: 0, cast: false },
  ];
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const glowTex = canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,220,160,0.8)'); gr.addColorStop(0.6, 'rgba(255,140,60,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const sprite = (g, color, s, x, y, z, op = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.scale.setScalar(s); sp.position.set(x, y, z); g.add(sp); return sp; };
  const palm = (g, x, z, h = 9) => { box(g, 0.5, h, 0.5, '#8a6a4c', x, h / 2, z); [0, 1.05, 2.1].forEach((a) => { const l = box(g, 5, 0.3, 1.2, '#3f7a3a', x, h + 0.1, z); l.rotation.y = a; l.rotation.z = 0.15; }); };

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, sky, extra = {}) => { const group = new THREE.Group(); sets[name] = { group, sky, ...extra }; return group; };

  // WAREHOUSE: a fulfillment center where every box is full of cash
  let belt;
  {
    const g = mk('WAREHOUSE', '#3a3f4c', { skyTop: '#2a2e38', sun: [10, 30, 12], sunI: 1.8, hemi: 1.15, hemiSky: '#eef2ff', hemiGround: '#4a4236', fogNear: 30, fogFar: 150, exposure: 1.2, shadow: 40, ground: '#2a2a30' });
    box(g, 80, 0.2, 120, '#8a929c', 0, -0.1, -40, { cast: false, mat: { roughness: 0.3, metalness: 0.15 } });
    for (let z = 10; z > -95; z -= 12) { box(g, 80, 0.5, 0.6, '#30343c', 0, 18, z, { cast: false }); box(g, 70, 0.12, 0.4, '#fff6e0', 0, 17.7, z, { cast: false, mat: { emissive: '#fff6e0', emissiveIntensity: 1.3 } }); }
    for (let x = -36; x <= 36; x += 6) box(g, 0.08, 0.02, 120, '#f1c40f', x + 3, 0.01, -40, { cast: false });
    // racks: uprights + shelves + boxes (instanced)
    const ups = [], shelves = [], boxes = [];
    for (let r = 0; r < 8; r++) { const x = (r < 4 ? -1 : 1) * (5 + (r % 4) * 6); for (let z = 6; z > -90; z -= 4) { ups.push({ x: x - 1.2, z }); ups.push({ x: x + 1.2, z }); for (let lv = 0; lv < 5; lv++) { shelves.push({ x, y: 0.4 + lv * 2.6, z: z - 2 }); for (let k = 0; k < 3; k++) if (hash(r * 999 + z * 7 + lv * 3 + k) > 0.12) boxes.push({ x: x + (k - 1) * 0.75, y: 0.42 + lv * 2.6, z: z - 2 + (hash(r + z + k) - 0.5) * 2.2, s: 0.8 + hash(r * 3 + z + lv + k) * 0.5, ry: (hash(k + z) - 0.5) * 0.3, $: hash(r + lv * 9 + k * 5 + z) > 0.5 }); } } }
    const up = instanced(g, [{ w: 0.18, h: 13.5, d: 0.18, c: '#e2572c', x: 0, y: 6.75, z: 0 }], ups.length); ups.forEach((o, i) => up.place(i, o)); up.done();
    const sh = instanced(g, [{ w: 2.6, h: 0.12, d: 4, c: '#5d6670', x: 0, y: 0, z: 0, cast: false }], shelves.length); shelves.forEach((o, i) => sh.place(i, o)); sh.done();
    const bx = instanced(g, [{ w: 0.7, h: 0.6, d: 0.7, c: '#c8a070', x: 0, y: 0.3, z: 0 }, { w: 0.72, h: 0.12, d: 0.72, c: '#6f9a5e', x: 0, y: 0.38, z: 0, cast: false }, { w: 0.2, h: 0.605, d: 0.705, c: '#e9dcc4', x: 0, y: 0.3, z: 0, cast: false }], boxes.length);
    boxes.forEach((o, i) => bx.place(i, o)); bx.done();
    // conveyor in the aisle with cash boxes
    box(g, 1.6, 0.9, 120, '#2b2f36', 0, 0.45, -40); box(g, 1.4, 0.05, 120, '#4a4d52', 0, 0.92, -40, { cast: false });
    belt = instanced(g, [{ w: 0.8, h: 0.55, d: 0.8, c: '#c8a070', x: 0, y: 0.27, z: 0 }, { w: 0.82, h: 0.1, d: 0.82, c: '#6f9a5e', x: 0, y: 0.35, z: 0, cast: false }], 30);
    sign(g, ['$375,000,000,000'], 14, 2.2, 0, 15, -99, { bg: '#22252e', fg: '#7ee08a', glow: 0.8 });
    box(g, 80, 20, 0.5, '#3c414b', 0, 10, -100, { cast: false });
    sets.WAREHOUSE.update = (s) => { for (let i = 0; i < 30; i++) belt.place(i, { x: 0, y: 0.95, z: 8 - ((s.t * 2.4 + i * 3.6) % 108) }); belt.done(); };
  }

  // LAUNCH: West Texas pad, a stubby white rocket lifting off
  let rocket, flame, smoke;
  {
    const g = mk('LAUNCH', '#f0c9a0', { skyTop: '#5f97d6', sun: [40, 30, 10], sunI: 3.0, sunColor: '#ffe0b0', hemi: 1.0, hemiSky: '#cfe2ff', hemiGround: '#a8865a', fogNear: 200, fogFar: 900, fog: '#f2d2a8', shadow: 60, ground: '#c9a676' });
    box(g, 2000, 0.1, 2000, '#d8b888', 0, -0.05, -300, { cast: false });
    for (let i = 0; i < 120; i++) box(g, 1 + hash(i) * 2, 0.6 + hash(i * 2) * 1.2, 1 + hash(i * 3) * 2, '#8a9a5a', (hash(i * 5) - 0.5) * 400, 0.3, -hash(i * 7) * 400 + 60);
    box(g, 30, 1, 30, '#9aa0a8', 0, 0.5, 0); box(g, 6, 50, 6, '#5d6670', -10, 25, 0); for (let y = 6; y < 50; y += 6) box(g, 7, 0.4, 7, '#e2572c', -10, y, 0);
    rocket = new THREE.Group(); g.add(rocket);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 30, 32), mat('#f4f6f8', MB)); body.position.y = 16; body.castShadow = true; rocket.add(body);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 1.2, 32), mat('#2c3e5c', MB)); ring.position.y = 30; rocket.add(ring);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.5, 6, 32), mat('#f4f6f8', MB)); cap.position.y = 34; cap.castShadow = true; rocket.add(cap);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f4f6f8', MB)); tip.position.y = 37; rocket.add(tip);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; box(rocket, 0.9, 1.3, 0.2, '#1b2430', Math.cos(a) * 3.0, 34.5, Math.sin(a) * 3.0, { cast: false, mat: GL }).lookAt(Math.cos(a) * 20, 34.5, Math.sin(a) * 20); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; const f = box(rocket, 0.4, 5, 3, '#d7dbe0', Math.cos(a) * 4.2, 4, Math.sin(a) * 4.2); f.rotation.y = -a; }
    sign(rocket, ['NEW SHEPARD'], 6, 1.2, 0, 22, 3.52, { bg: '#f4f6f8', fg: '#2c3e5c' });
    flame = sprite(rocket, '#ffb050', 14, 0, -1, 0); flame.visible = false;
    smoke = instanced(g, [{ w: 1, h: 1, d: 1, c: '#f4f1ea', x: 0, y: 0, z: 0, cast: false, mat: { roughness: 1 } }], 90);
    sets.LAUNCH.update = (s) => {
      const lt = s.t - T('ride'), k = Math.max(0, lt); const y = k > 0.4 ? Math.pow(k - 0.4, 2) * 6 : 0;
      rocket.position.y = y; flame.visible = lt > 0; flame.scale.setScalar(12 + Math.sin(s.t * 40) * 2);
      for (let i = 0; i < 90; i++) { const a = hash(i) * Math.PI * 2, age = k - hash(i * 3) * 1.5; const r = Math.max(0, age) * (6 + hash(i * 5) * 10); smoke.place(i, { x: Math.cos(a) * r, y: 1 + Math.max(0, age) * 1.5 * hash(i * 7), z: Math.sin(a) * r, s: age > 0 ? 2 + age * 3 : 0.0001, hide: age <= 0 }); }
      smoke.done();
    };
  }

  // CAPSULE: inside, the Earth curving below the windows
  {
    const g = mk('CAPSULE', '#000004', { skyTop: '#000000', sun: [30, 10, 20], sunI: 2.4, hemi: 0.5, hemiSky: '#a0b8ff', hemiGround: '#101018', fogNear: 4000, fogFar: 9000, ground: '#000000', shadow: 8, exposure: 1.1 });
    box(g, 6, 0.2, 6, '#e8edf2', 0, -0.1, 0, { cast: false });
    for (let k = 1; k < 6; k++) { const a = k / 6 * Math.PI * 2; const p = box(g, 2.6, 3.2, 0.2, k === 0 ? '#e8edf2' : '#dfe6ec', Math.sin(a) * 2.8, 1.6, -Math.cos(a) * 2.8, { cast: false }); p.rotation.y = -a; }
    box(g, 2.8, 0.5, 0.3, '#d7dbe0', 0, 0.25, -2.8, { cast: false }); box(g, 2.8, 0.4, 0.3, '#d7dbe0', 0, 3.0, -2.8, { cast: false }); box(g, 0.3, 3.2, 0.3, '#d7dbe0', -1.3, 1.6, -2.8, { cast: false }); box(g, 0.3, 3.2, 0.3, '#d7dbe0', 1.3, 1.6, -2.8, { cast: false });
    for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.9; const s = box(g, 0.9, 0.2, 0.9, '#2c3e5c', Math.sin(a) * 1.5, 0.7, -Math.cos(a) * 1.5 + 0.4); s.rotation.y = -a; }
    const earth = new THREE.Mesh(new THREE.SphereGeometry(400, 64, 32), new THREE.MeshStandardMaterial({ color: '#2e6fb0', roughness: 0.6, fog: false })); earth.position.set(0, -420, -300); g.add(earth);
    for (let i = 0; i < 120; i++) { const th = hash(i) * Math.PI * 2, ph = Math.acos(2 * hash(i * 1.7) - 1); const v = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)); const m = box(g, 40 + hash(i * 3) * 50, 1, 40 + hash(i * 5) * 50, i % 3 ? '#4f8a3a' : '#e8dcc4', earth.position.x + v.x * 401, earth.position.y + v.y * 401, earth.position.z + v.z * 401, { cast: false }); m.lookAt(earth.position.clone().add(v.clone().multiplyScalar(800))); m.rotateX(Math.PI / 2); }
    sprite(g, '#7fb0ff', 1000, 0, -380, -300, 0.5);
    const sg = new THREE.BufferGeometry(); const pos = []; for (let i = 0; i < 1200; i++) { const a = hash(i) * Math.PI * 2, b = Math.acos(2 * hash(i * 3.1) - 1); pos.push(Math.sin(b) * Math.cos(a) * 2000, Math.abs(Math.cos(b)) * 2000, Math.sin(b) * Math.sin(a) * 2000); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, fog: false })));
  }

  // YACHT: the sailing superyacht + its support yacht with a helipad, at sunset
  let heli;
  {
    const g = mk('YACHT', '#ffc890', { skyTop: '#5a7fc0', sun: [-60, 18, -80], sunI: 3.0, sunColor: '#ffc890', hemi: 1.0, hemiSky: '#cfe2ff', hemiGround: '#1f5f8a', fogNear: 200, fogFar: 1200, fog: '#f2c8a0', shadow: 90, ground: '#1f5f8a', exposure: 1.05 });
    box(g, 3000, 0.1, 3000, '#1f5f8a', 0, -0.05, -500, { cast: false, mat: { roughness: 0.1, metalness: 0.4 } });
    sprite(g, '#ffd8a0', 200, -400, 80, -700, 0.9);
    const y = new THREE.Group(); g.add(y);
    // hull: 127 m long (scale 1 unit = 1 m)
    for (let k = 0; k < 12; k++) { const z = 60 - k * 10.5, w = k < 3 ? 6 + k * 3.4 : (k > 10 ? 12 : 16); box(y, w, 6, 10.6, '#1b2433', 0, 2, z, { mat: MB }); }
    box(y, 15.5, 0.6, 110, '#c9a46a', 0, 5.2, -5, { mat: { roughness: 0.6 } });
    box(y, 10, 4, 34, '#f4f6f8', 0, 8, -18, { mat: MB }); box(y, 10.2, 1.2, 34.2, '#1b2433', 0, 8.5, -18, { cast: false, mat: GL }); box(y, 7, 3, 16, '#f4f6f8', 0, 11.5, -16, { mat: MB });
    [30, -6, -42].forEach((z, i) => { box(y, 0.8, 70 - i * 4, 0.8, '#eef1f4', 0, 5 + (70 - i * 4) / 2, z, { mat: MB }); box(y, 0.4, 0.4, 24, '#c9ced4', 0, 12, z - 12); const sl = box(y, 0.2, 52 - i * 4, 22, '#f8f4ea', 0.6, 14 + (52 - i * 4) / 2, z - 11, { mat: { roughness: 0.9 } }); sl.rotation.x = 0.02; });
    // support yacht
    const s2 = new THREE.Group(); s2.position.set(90, 0, -120); s2.rotation.y = 0.2; g.add(s2);
    box(s2, 14, 5, 75, '#f4f6f8', 0, 1.5, 0, { mat: MB }); box(s2, 12, 4, 30, '#eef1f4', 0, 6, 10, { mat: MB }); box(s2, 12.2, 1, 30.2, '#1b2433', 0, 6.5, 10, { cast: false, mat: GL });
    box(s2, 13, 0.4, 14, '#5d6670', 0, 4.2, -26); sign(s2, ['H'], 6, 6, 0, 4.45, -26, { bg: '#5d6670', fg: '#f1c40f' }).rotation.x = -Math.PI / 2;
    heli = new THREE.Group(); heli.position.set(0, 4.4, -26); s2.add(heli); box(heli, 2.6, 2.2, 6, '#2c3e5c', 0, 1.4, 0); box(heli, 0.5, 0.5, 6, '#2c3e5c', 0, 1.8, -5); box(heli, 1.4, 1, 1.6, '#1b2430', 0, 1.8, 2.6, { mat: GL }); const rotor = box(heli, 12, 0.1, 0.4, '#1b1b24', 0, 2.8, 0); heli.userData.rotor = rotor;
    sets.YACHT.update = (s) => { rotor.rotation.y = s.t * 8; };
    // wake
    for (let i = 0; i < 30; i++) box(g, 3 + i * 0.6, 0.05, 6, '#e8f4fa', (i % 2 ? 1 : -1) * (8 + i * 0.8), 0.02, -70 - i * 6, { cast: false, mat: { roughness: 0.6 } });
  }

  // MANSION: Beverly Hills estate
  {
    const g = mk('MANSION', '#cfe6f6', { skyTop: '#5f9fe0', sun: [30, 40, 25], sunI: 3.0, sunColor: '#fff0d8', hemi: 1.1, hemiSky: '#e6f0ff', hemiGround: '#6a8a4a', fogNear: 150, fogFar: 700, shadow: 70, ground: '#6f9a4a' });
    box(g, 1200, 0.1, 1200, '#79a64e', 0, -0.05, -200, { cast: false });
    for (let i = 0; i < 20; i++) box(g, 120, 30 + hash(i) * 50, 60, '#8aa060', -400 + i * 45, 0, -500 - hash(i * 2) * 100, { cast: false });
    const m = new THREE.Group(); m.position.set(0, 0, -60); g.add(m);
    box(m, 60, 12, 26, '#f4f1ea', 0, 6, 0); box(m, 24, 8, 20, '#f4f1ea', -36, 4, 6); box(m, 24, 8, 20, '#f4f1ea', 36, 4, 6);
    box(m, 62, 1.2, 28, '#c9b896', 0, 12.6, 0); box(m, 26, 1, 22, '#c9b896', -36, 8.5, 6); box(m, 26, 1, 22, '#c9b896', 36, 8.5, 6);
    for (let x = -10; x <= 10; x += 4) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 11, 16), mat('#ffffff')); c.position.set(x, 5.5, 14); c.castShadow = true; m.add(c); }
    box(m, 24, 1.2, 4, '#f4f1ea', 0, 11.4, 14.2);
    for (let x = -26; x <= 26; x += 4) for (let y = 3; y < 11; y += 4.5) if (Math.abs(x) > 12) box(m, 2, 2.6, 0.2, '#9fc3d8', x, y, 13.05, { mat: GL, cast: false });
    box(m, 4, 6, 0.2, '#5a3a2a', 0, 3, 13.1);
    box(g, 30, 0.3, 14, '#6fb4d8', 0, 0.1, -20, { cast: false, mat: { roughness: 0.05, metalness: 0.3 } }); box(g, 32, 0.2, 16, '#e8e2d4', 0, 0.05, -20, { cast: false });
    box(g, 8, 0.12, 80, '#e8e2d4', 0, 0.06, 20, { cast: false });
    for (let i = 0; i < 12; i++) palm(g, (i % 2 ? 1 : -1) * 7, 50 - i * 6, 11);
    box(g, 60, 3, 1, '#e8e2d4', -34, 1.5, 58); box(g, 60, 3, 1, '#e8e2d4', 34, 1.5, 58); box(g, 8, 4, 0.3, '#2b2f36', 0, 2, 58);
  }

  // POST: the newspaper building + presses
  {
    const g = mk('POST', '#d8e4ee', { skyTop: '#8fb4d8', sun: [30, 40, 20], sunI: 2.6, hemi: 1.1, fogNear: 60, fogFar: 300, shadow: 40 });
    box(g, 14, 0.1, 200, '#4a4d52', 0, 0, -60, { cast: false }); box(g, 5, 0.25, 200, '#b9bcc0', -9.5, 0.12, -60, { cast: false }); box(g, 5, 0.25, 200, '#b9bcc0', 9.5, 0.12, -60, { cast: false });
    for (let i = 0; i < 8; i++) [-1, 1].forEach((sd) => { const h = 18 + hash(i * 3 + sd) * 20; box(g, 14, h, 11, i % 2 ? '#d7dbe0' : '#c9b8a0', sd * 19, h / 2, 4 - i * 12); for (let fy = 3; fy < h - 1; fy += 3) box(g, 0.2, 1.6, 9, '#5c86a8', sd * 12, fy, 4 - i * 12, { cast: false, mat: GL }); });
    box(g, 44, 30, 14, '#cfd4da', 0, 15, -96); for (let x = -18; x <= 18; x += 3) box(g, 1.8, 26, 0.3, '#5c86a8', x, 15, -88.9, { cast: false, mat: GL });
    sign(g, ['The Washington Post'], 30, 3.6, 0, 26, -88.6, { bg: '#ffffff', fg: '#1b1b24', font: 'EB Garamond', weight: 500 });
    for (let i = 0; i < 4; i++) { const st = box(g, 1.2, 1.4, 0.8, '#1f3b63', -7 + (i % 2) * 14, 0.7, -10 - i * 6); sign(g, ['POST'], 1, 0.4, -7 + (i % 2) * 14, 1.1, -9.59 - i * 6, { bg: '#ffffff', fg: '#1b1b24' }); }
    for (let i = 0; i < 10; i++) person(g, peopleCols[i % 4], (i % 2 ? 9 : -9) + (hash(i) - 0.5) * 2, -6 - i * 6, { ry: i % 2 ? 0 : Math.PI });
  }

  // ARENA: the Lakers court, purple and gold crowd
  let fans, fanList = [];
  {
    const g = mk('ARENA', '#1b1424', { skyTop: '#120e18', sun: [5, 40, 10], sunI: 2.4, sunColor: '#fff6e0', hemi: 0.9, hemiSky: '#ffffff', hemiGround: '#3a2a20', fogNear: 60, fogFar: 200, shadow: 40, ground: '#2a2028', exposure: 1.15 });
    box(g, 28, 0.2, 15, '#d8a868', 0, 0, 0, { cast: false, mat: { roughness: 0.35 } });
    box(g, 0.15, 0.03, 15, '#ffffff', 0, 0.11, 0, { cast: false }); const cc = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.85, 48), mat('#ffffff')); cc.rotation.x = -Math.PI / 2; cc.position.y = 0.12; g.add(cc);
    [-1, 1].forEach((sd) => { box(g, 5.8, 0.03, 4.9, '#552583', sd * 11.1, 0.11, 0, { cast: false }); box(g, 0.2, 3.5, 0.2, '#2b2f36', sd * 14.6, 1.75, 0); box(g, 0.1, 1.1, 1.8, '#ffffff', sd * 13.9, 3.4, 0, { mat: { transparent: true, opacity: 0.6 } }); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 6, 24), mat('#e2572c')); rim.rotation.x = Math.PI / 2; rim.position.set(sd * 13.55, 3.05, 0); g.add(rim); });
    box(g, 60, 0.2, 40, '#2a2028', 0, -0.1, 0, { cast: false });
    // tiered stands on 4 sides
    const rows = 14; let n = 0; const stand = instanced(g, [{ w: 1, h: 1, d: 1, c: '#fff', tint: true, x: 0, y: 0, z: 0 }], 4 * rows);
    for (let side = 0; side < 4; side++) for (let r = 0; r < rows; r++) {
      const along = side < 2, len = (along ? 32 : 19) + r * 1.6, off = (along ? 9 : 16) + r * 0.9, y = 0.6 + r * 0.6;
      const o = along ? { x: 0, z: (side ? 1 : -1) * off } : { x: (side === 2 ? 1 : -1) * off, z: 0 };
      stand.meshes[0].m.setMatrixAt(n, new THREE.Matrix4().compose(new THREE.Vector3(o.x, y / 2, o.z), new THREE.Quaternion(), new THREE.Vector3(along ? len : 0.9, y, along ? 0.9 : len)));
      stand.color(n++, 0, r % 2 ? '#3a2a48' : '#45325a');
      const cnt = Math.floor(len / 0.62); for (let k = 0; k < cnt; k++) { const u = (k + 0.5) / cnt - 0.5; fanList.push(along ? { x: u * len, y, z: o.z, ry: side ? Math.PI : 0, side } : { x: o.x, y, z: u * len, ry: side === 2 ? -Math.PI / 2 : Math.PI / 2, side }); }
    }
    stand.done();
    fans = instanced(g, minifig(0.95), fanList.length);
    fanList.forEach((f, i) => { fans.color(i, 0, crowdCols[Math.floor(hash(i) * 8)]); fans.color(i, 1, skinTones[Math.floor(hash(i * 3) * 5)]); });
    // jumbotron
    const jb = new THREE.Group(); jb.position.set(0, 16, 0); g.add(jb); box(jb, 8, 4.4, 8, '#1b1b24', 0, 0, 0);
    [0, 1, 2, 3].forEach((k) => { const sg = sign(jb, ['LAKERS'], 7.4, 3.6, Math.sin(k * Math.PI / 2) * 4.02, 0, Math.cos(k * Math.PI / 2) * 4.02, { bg: '#552583', fg: '#fdb927', glow: 1.0, ry: k * Math.PI / 2 }); });
    for (let k = 0; k < 12; k++) box(g, 3, 0.4, 0.8, '#fff6e0', -15 + (k % 6) * 6, 22, k < 6 ? -8 : 8, { cast: false, mat: { emissive: '#fff6e0', emissiveIntensity: 2 } });
    sets.ARENA.update = (s) => { fanList.forEach((f, i) => { const j = Math.max(0, Math.sin(s.t * 7 + hash(i) * 20)) * 0.12 * (hash(i * 7) > 0.5 ? 1 : 0.3); fans.place(i, { x: f.x, y: f.y + j, z: f.z, ry: f.ry }); }); fans.done(); jb.rotation.y = s.t * 0.2; };
  }

  // GROCERY: Whole Foods aisles of produce
  {
    const g = mk('GROCERY', '#eef1f4', { skyTop: '#f4f1ea', sun: [6, 16, 10], sunI: 2.0, hemi: 1.3, fogNear: 40, fogFar: 120, shadow: 24, ground: '#c9b8a0' });
    box(g, 30, 0.2, 60, '#c9b8a0', 0, -0.1, -20, { cast: false, mat: { roughness: 0.5 } }); box(g, 30, 8, 0.4, '#e8e2d4', 0, 4, -50, { cast: false }); box(g, 30, 0.3, 60, '#3a3f4c', 0, 8, -20, { cast: false });
    sign(g, ['WHOLE FOODS MARKET'], 16, 2.2, 0, 6.4, -49.7, { bg: '#00674b', fg: '#ffffff' });
    const bins = []; for (let r = 0; r < 4; r++) for (let z = 0; z > -40; z -= 2.2) bins.push({ x: -9 + r * 6, z: z - 2, c: ['#c0392b', '#f1c40f', '#27ae60', '#e67e22', '#8e44ad', '#2ecc71'][Math.floor(hash(r * 31 + z) * 6)] });
    const bt = instanced(g, [{ w: 3.2, h: 1.0, d: 2.0, c: '#8a5a3a', x: 0, y: 0.5, z: 0 }, { w: 3.0, h: 0.4, d: 1.8, c: '#fff', tint: true, x: 0, y: 1.15, z: 0, cast: false }], bins.length);
    bins.forEach((o, i) => { bt.place(i, o); bt.color(i, 1, o.c); }); bt.done();
    for (let k = 0; k < 8; k++) box(g, 4, 0.1, 0.6, '#fff6e0', -12 + k * 3.5, 7.8, -10 - (k % 3) * 10, { cast: false, mat: { emissive: '#fff6e0', emissiveIntensity: 1.6 } });
    for (let i = 0; i < 8; i++) person(g, peopleCols[i % 4], -6 + (i % 4) * 6 + 1.6, -6 - i * 4, { ry: hash(i) * 6 });
  }

  // YEARS: a castle on a hill while a thousand years race by
  let skyDome, sunS, pile;
  {
    const g = mk('YEARS', '#8fb4d8', { skyTop: '#4f7fc0', sun: [30, 40, 20], sunI: 2.4, hemi: 1.0, fogNear: 200, fogFar: 900, shadow: 60, ground: '#6f9a4a' });
    box(g, 2000, 0.1, 2000, '#6f9a4a', 0, -0.05, -400, { cast: false });
    const c = new THREE.Group(); c.position.set(0, 0, -120); g.add(c);
    box(c, 60, 14, 50, '#8a7a68', 0, 7, 0); [[-30, -25], [30, -25], [-30, 25], [30, 25]].forEach(([x, z]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.5, 26, 16), mat('#9a8a78')); t.position.set(x, 13, z); t.castShadow = true; c.add(t); const r = new THREE.Mesh(new THREE.ConeGeometry(6, 9, 16), mat('#6a2a2a')); r.position.set(x, 30.5, z); c.add(r); });
    box(c, 16, 30, 16, '#9a8a78', 0, 15, -6); for (let x = -28; x <= 28; x += 4) box(c, 2, 2, 2, '#8a7a68', x, 15, 25);
    skyDome = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 12), new THREE.MeshBasicMaterial({ color: '#8fb4d8', side: THREE.BackSide, fog: false })); g.add(skyDome);
    sunS = sprite(g, '#fff0c0', 120, 0, 300, -900);
    pile = instanced(g, [{ w: 1.5, h: 1.1, d: 1.1, c: '#6f9a5e', x: 0, y: 0.55, z: 0 }, { w: 1.52, h: 0.18, d: 1.12, c: '#e9dcc4', x: 0, y: 0.55, z: 0, cast: false }], 400);
    pile.list = []; for (let i = 0; i < 400; i++) pile.list.push({ x: (i % 20 - 10) * 1.6, y: Math.floor(i / 100) * 1.12, z: -20 - Math.floor((i % 100) / 20) * 1.2 });
    sets.YEARS.update = (s) => {
      const k = clamp((s.t - T('year')) / (T('twist') - 0.5 - T('year'))), day = s.t * 9;
      const sky = new THREE.Color('#0a0f2a').lerp(new THREE.Color('#8fb4d8'), 0.5 + 0.5 * Math.sin(day)); skyDome.material.color.copy(sky); sunS.position.set(Math.cos(day) * 800, Math.sin(day) * 500, -900); sunS.visible = Math.sin(day) > -0.1;
      const left = Math.round(400 * (1 - Math.max(0, k))); pile.list.forEach((o, i) => pile.place(i, { ...o, hide: i >= left })); pile.done();
    };
  }

  // AMAZON: glass spheres campus — worth ~$3 trillion
  {
    const g = mk('AMAZON', '#b8cfe0', { skyTop: '#6f9fd0', sun: [30, 40, 20], sunI: 2.6, hemi: 1.1, fogNear: 150, fogFar: 700, shadow: 60 });
    box(g, 1200, 0.1, 1200, '#9aa0a8', 0, -0.05, -200, { cast: false });
    [[-14, 0, 13], [14, -4, 15], [0, -24, 18]].forEach(([x, z, r]) => {
      const sp = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), new THREE.MeshStandardMaterial({ color: '#cfe8f4', metalness: 0.5, roughness: 0.08, transparent: true, opacity: 0.55, envMapIntensity: 1.2 })); sp.position.set(x, r * 0.7, z); g.add(sp);
      const fr = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r * 1.002, 2)), new THREE.LineBasicMaterial({ color: '#2b2f36' })); fr.position.copy(sp.position); g.add(fr);
      for (let i = 0; i < 6; i++) { box(g, 2, 4 + hash(i + x) * 4, 2, '#3f7a3a', x + (hash(i * 3 + x) - 0.5) * r, 2 + hash(i) * 2, z + (hash(i * 5 + z) - 0.5) * r); }
    });
    for (let i = 0; i < 12; i++) { const h = 40 + hash(i) * 80; box(g, 22, h, 22, i % 2 ? '#5c86a8' : '#7a9ab8', -130 + i * 24, h / 2, -110 - (i % 3) * 30, { mat: GL }); }
    sign(g, ['AMAZON'], 30, 6, 0, 60, -108.5, { bg: '#1b1b24', fg: '#ff9900', glow: 0.6 });
  }

  /* ─── money timeline ─── */
  const START = 375e9;
  const buys = () => [
    [T('purchased'), 28e6, 'ONE SEAT ON NEW SHEPARD', 0.6],
    [T('five', 1), 500e6, 'SUPERYACHT (REPORTED)', 0.8],
    [T('sixty-five'), 165e6, 'BEVERLY HILLS MANSION', 0.7],
    [T('fifty', 1), 250e6, 'THE WASHINGTON POST', 0.7],
    [T('ten'), 10e9, 'LOS ANGELES LAKERS', 1.0],
    [T('fourteen'), 13.7e9, 'WHOLE FOODS', 1.0],
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
    g.font = '800 44px Montserrat'; const ss = Math.min(44, 44 * 820 / Math.max(1, g.measureText(sub).width));
    hudText(g, sub, 0, 72, `800 ${ss}px Montserrat`, '#ffffff', { align: 'center', shadow: 12, stroke: 6 });
    g.restore();
  }
  function bigLine(g, t, t0, t1, text, col, y, size = 110) {
    if (t < t0 || t > t1) return; const k = easeOut((t - t0) / 0.35), f = t > t1 - 0.25 ? (t1 - t) / 0.25 : 1;
    g.save(); g.globalAlpha = clamp(f); g.translate(W / 2 - 40, y + (1 - k) * 40);
    const fs = fitText(g, text, 'Anton', size, 840); hudText(g, text, 0, 0, `${fs}px Anton`, col, { align: 'center', stroke: 14, strokeColor: 'rgba(10,15,10,0.8)' }); g.restore();
  }
  function hud(g, s) {
    const t = s.t, yearT = T('year'), twistT = T("here's", 2);
    if (t < T('so', 2)) {
      let m = moneyAt(t), label = "BEZOS'S FORTUNE", col = '#7ee08a';
      if (t >= T("here's", 1) && t < twistT) { // a million a day since the year 1000
        const k = clamp((t - yearT) / (twistT - 0.4 - yearT)); m = START * (1 - k); const year = Math.round(1000 + 1026 * k);
        label = '$1,000,000 A DAY · SINCE YEAR 1000'; col = '#ffd23f';
        if (t >= yearT) hudText(g, 'YEAR ' + year, 80, 880, '70px Anton', '#ffffff', { stroke: 10 });
      }
      hudText(g, label, 80, 960, '800 32px Montserrat', 'rgba(255,255,255,0.92)', { shadow: 10, stroke: 5 });
      const txt = money(m); hudText(g, txt, 80, 1080, `${fitText(g, txt, 'Anton', 112, 860)}px Anton`, col, { stroke: 14 });
      buys().forEach(([t0, c]) => { const d = t - t0; if (d > 0 && d < 1.8) hudText(g, '-' + money(c), 80, 1150, '58px Anton', '#ff5a4a', { stroke: 10 }); });
      if (t > T("you've") && t < T("here's", 1)) hudText(g, 'SPENT ≈ $25B · STILL 93% LEFT', 80, 1150, '52px Anton', '#ffd23f', { stroke: 10 });
    }
    buys().forEach(([t0, c, item]) => stamp(g, t, t0, 'PURCHASED', item + '  ·  -' + short(c), '#7ee08a'));
    stamp(g, t, T("couldn't"), 'DECLINED', 'AMAZON IS WORTH ≈ $3,000,000,000,000', '#ff5a4a', 2.6);
    bigLine(g, t, T('so', 2), 1e9, 'WHAT WOULD YOU', '#ffffff', 330, 120);
    bigLine(g, t, T('so', 2) + 0.25, 1e9, 'BUY FIRST?', '#7ee08a', 470, 140);
  }

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update) => shots.push({ id, t0, set, cam, update });
  const pov = (x, y, z, lx, ly, lz, fov = 62, extra = {}) => ({ pos: [x, y, z], look: [lx, ly, lz], fov, ...extra });
  let handsReady = false;
  const hands = (t, g = 0) => { if (!handsReady) { buildHands('#1d2330'); setHeld('card'); handsReady = true; } poseHands(t, g); };
  const give = (s, t0) => clamp(Math.sin(Math.PI * clamp((s.t - t0 + 0.35) / 0.7)));
  const orbit = (cx, cy, cz, r, a, y, ly, fov = 55) => pov(cx + Math.sin(a) * r, y, cz + Math.cos(a) * r, cx, ly, cz, fov, { hands: false });

  shot('W1', 0, 'WAREHOUSE', (s) => { const k = ease(s.p); return { ...pov(-2.2, 1.7 + k * 12, 10 - k * 8, -2, -1 + k * 3, -60, 60), hands: false }; });
  shot('W2', T('about', 1), 'WAREHOUSE', (s) => ({ ...pov(-8 + s.lt * 2, 6.5, 4 - s.lt * 1.4, 4, 4.5, -20, 58), hands: false }));
  shot('W3', T('rule'), 'WAREHOUSE', (s) => pov(-2.2, 1.7, 6 - s.lt * 1.6, -1, 1.4, -60), (s) => hands(s.t));
  shot('L1', T('first', 1), 'LAUNCH', (s) => { const k = ease(s.p); return { ...pov(lerp(60, 50, k), lerp(4, 8, k), lerp(70, 60, k), 0, lerp(18, 26, k), 0, 50), hands: false }; });
  shot('L2', T('someone'), 'LAUNCH', (s) => ({ ...pov(30, 6, 46, 0, 30, 0, 52), hands: false }));
  shot('C1', T('purchased'), 'CAPSULE', (s) => pov(0.3, 1.6, 0.6 - s.lt * 0.15, 0, 0.6, -6), (s) => hands(s.t, give(s, T('purchased'))));
  shot('Y1', T('next'), 'YACHT', (s) => { const k = ease(s.p); return { ...pov(lerp(-110, -70, k), lerp(8, 30, k), lerp(140, 110, k), 0, 20, -10, 50), hands: false }; });
  shot('Y2', T('support'), 'YACHT', (s) => ({ ...orbit(90, 0, -120, 110, 0.9 + s.lt * 0.12, 30, -6, 50) }));
  shot('M1', T('then', 1), 'MANSION', (s) => pov(0.8, 1.7, 56 - s.lt * 4, 0, 6, -60), (s) => hands(s.t, give(s, T('sixty-five'))));
  shot('N1', T('buy', 1), 'POST', (s) => pov(0.6, 1.7, 2 - s.lt * 2.4, 0, 18 - s.lt * 1.5, -90), (s) => hands(s.t, give(s, T('fifty', 1))));
  shot('N2', T('he', 1), 'POST', (s) => ({ ...pov(-6 + s.lt * 2, 1.2 + s.lt * 2, -40 - s.lt * 4, 0, 26, -90, 64), hands: false }));
  shot('A1', T('still', 1), 'ARENA', (s) => { const k = ease(s.p); return { ...pov(-2, 1.6 + k * 5, 6 + k * 4, 0, 4, -14, 66), hands: false }; });
  shot('A2', T('lakers'), 'ARENA', (s) => ({ ...orbit(0, 0, 0, 24, 0.6 + s.lt * 0.15, 10 + s.lt, 3, 60) }));
  shot('F1', T('then', 2), 'GROCERY', (s) => pov(-0.5, 2.4, 4 - s.lt * 2.0, 0, 0.2, -30), (s) => hands(s.t, give(s, T('fourteen'))));
  shot('V1', T("you've"), 'WAREHOUSE', (s) => { const k = ease(s.p); return { ...pov(14 - k * 10, 14 - k * 4, 10, -2, 2, -50, 60), hands: false }; });
  shot('T1', T("here's", 1), 'YEARS', (s) => { const k = ease(s.p); return { ...pov(lerp(-60, -20, k), lerp(10, 20, k), lerp(60, 30, k), 0, 12, -100, 55), hands: false }; });
  shot('T2', T('run'), 'YEARS', (s) => ({ ...pov(30 - s.lt * 4, 6, 10, 0, 3, -30, 58), hands: false }));
  shot('Z1', T("here's", 2), 'AMAZON', (s) => { const k = ease(s.p); return { ...pov(lerp(-40, -10, k), lerp(4, 30, k), lerp(70, 60, k), 0, lerp(14, 30, k), -40, 58), hands: false }; });
  shot('Z2', T('worth'), 'AMAZON', (s) => ({ ...pov(0, 2 + s.lt * 6, 90 + s.lt * 10, 0, 40, -100, 54), hands: false }));
  shot('E1', T('so', 2), 'WAREHOUSE', (s) => pov(-2.2, 1.7, 2 - s.lt * 0.6, -1, 1.6, -60), (s) => hands(s.t));
  shot('E2', T('tell'), 'WAREHOUSE', (s) => { const k = ease(s.p); return { ...pov(-2.2, 1.7 + k * 10, 4 - k * 2, -1, 1, -60, 60), hands: false }; });

  shot('Y1b', T('reportedly'), 'YACHT', (s) => ({ ...pov(40 - s.lt * 3, 12 + s.lt, 70, 0, 18, -20, 52), hands: false }));
  shot('V1b', T('still', 2), 'WAREHOUSE', (s) => ({ ...pov(-1.2, 1.7, -22 - s.lt * 1.4, 0.5, 1.6, -64, 60), hands: false }));
  shot('T1b', T('year'), 'YEARS', (s) => ({ ...pov(-14 + s.lt * 2, 3.5, 6 - s.lt * 1.0, 2, 4, -60, 58), hands: false }));

  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, wipes: [], end: A.duration };
};

/* "While you watch this video, Elon Musk gets richer" — real-time counter, blocky 3D, vertical 1080×1920.
 * Rate: Bloomberg (Nov 4 2026) $865B, +88.1% year over year → ≈ $405B gained in a year ≈ $12,834 per second
 * (an average of paper gains, not a salary). Same Bloomberg page: −$33.5B that day.
 * Prices: new Tesla ≈ $40k; US median household income ≈ $80k (Census); federal minimum wage $7.25/h;
 * typical US home ≈ $400k (NAR median); Lamborghini Revuelto ≈ $600k.
 */
window.buildFilm = (A) => {
  const { THREE, T, W, H, clamp, lerp, ease, easeOut, spring, hash, ev, box, sign, person, walkPose, idlePose, mat, hudText, money, instanced, camera } = A;
  const MB = { metalness: 0.3, roughness: 0.28 }, GL = { metalness: 0.6, roughness: 0.08 };
  const RATE = 405e9 / 31557600; // $ per second
  const earned = (t) => RATE * Math.max(0, t);
  const crossAt = (v) => v / RATE; // video time when the counter passes v
  const peopleCols = [{ body: '#e0e4ea', legs: '#2c3e5c' }, { body: '#c96a5a', legs: '#26262c' }, { body: '#4f7c86', legs: '#5d6670', hair: '#c9a46a' }, { body: '#d8b25a', legs: '#2c3e5c' }];
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const glowTex = canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,230,180,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const sprite = (g, color, s, x, y, z, op = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.scale.setScalar(s); sp.position.set(x, y, z); g.add(sp); return sp; };
  function car(g, x, z, ry, col, low = false) {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
    if (!low) { box(c, 1.9, 0.6, 4.6, col, 0, 0.62, 0, { mat: MB }); box(c, 1.7, 0.55, 2.6, col, 0, 1.18, -0.1, { mat: MB }); box(c, 1.72, 0.45, 2.64, '#1b2430', 0, 1.2, -0.1, { cast: false, mat: GL }); box(c, 0.5, 0.12, 0.05, '#ff2a2a', -0.6, 0.75, -2.31, { cast: false, mat: { emissive: '#ff2a2a', emissiveIntensity: 1.2 } }); box(c, 0.5, 0.12, 0.05, '#ff2a2a', 0.6, 0.75, -2.31, { cast: false, mat: { emissive: '#ff2a2a', emissiveIntensity: 1.2 } }); }
    else { box(c, 2.1, 0.5, 4.7, col, 0, 0.5, 0, { mat: MB }); box(c, 1.6, 0.42, 1.8, col, 0, 0.92, -0.3, { mat: MB }); box(c, 1.62, 0.36, 1.6, '#14161c', 0, 0.95, -0.25, { cast: false, mat: GL }); const w = box(c, 1.9, 0.25, 0.5, col, 0, 0.7, 2.2, { mat: MB }); w.rotation.x = 0.35; box(c, 2.2, 0.1, 0.6, '#14161c', 0, 1.0, -2.2); }
    [[-1.02, -1.5], [1.02, -1.5], [-1.02, 1.5], [1.02, 1.5]].forEach(([dx, dz]) => { box(c, 0.28, 0.72, 0.72, '#16171c', dx, 0.36, dz); box(c, 0.3, 0.32, 0.32, '#c9ced4', dx, 0.36, dz, { cast: false, mat: { metalness: 0.8 } }); });
    box(c, 0.5, 0.1, 0.05, '#f4f6f8', -0.6, 0.72, low ? 2.36 : 2.31, { cast: false, mat: { emissive: '#ffffff', emissiveIntensity: 1 } }); box(c, 0.5, 0.1, 0.05, '#f4f6f8', 0.6, 0.72, low ? 2.36 : 2.31, { cast: false, mat: { emissive: '#ffffff', emissiveIntensity: 1 } });
    return c;
  }
  function house(g, x, z, ry, wall = '#f1e7d4', roof = '#8a3a3a') {
    const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; g.add(h);
    box(h, 10, 4.6, 8, wall, 0, 2.3, 0); const r1 = box(h, 10.6, 0.5, 5.3, roof, 0, 5.6, -2.0); r1.rotation.x = 0.62; const r2 = box(h, 10.6, 0.5, 5.3, roof, 0, 5.6, 2.0); r2.rotation.x = -0.62;
    box(h, 1.3, 2.3, 0.1, '#5a3a2a', -2, 1.15, 4.02); box(h, 1.6, 1.3, 0.1, '#9fc3d8', 2, 2.6, 4.02, { mat: GL }); box(h, 3, 2.4, 0.1, '#d7dbe0', 3.4, 1.2, 4.02);
    box(h, 9, 0.1, 6, '#86b85a', 0, 0.03, 7, { cast: false });
    return h;
  }

  /* ─── the phone you're holding: its screen shows the live counter ─── */
  const phoneCv = document.createElement('canvas'); phoneCv.width = 512; phoneCv.height = 1024; const pg = phoneCv.getContext('2d');
  const phoneTex = new THREE.CanvasTexture(phoneCv); phoneTex.colorSpace = THREE.SRGBColorSpace;
  const phone = new THREE.Group(); camera.add(phone); phone.position.set(0.02, -0.17, -0.5); phone.rotation.set(-0.25, 0, 0);
  box(phone, 0.16, 0.32, 0.016, '#15161a', 0, 0, 0, { cast: false, mat: { metalness: 0.6, roughness: 0.3 } });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.145, 0.3), new THREE.MeshBasicMaterial({ map: phoneTex, fog: false })); scr.position.z = 0.0085; phone.add(scr);
  box(phone, 0.05, 0.2, 0.06, '#e8b48f', 0.09, -0.04, -0.02, { cast: false }); box(phone, 0.05, 0.2, 0.06, '#e8b48f', -0.09, -0.06, -0.02, { cast: false });
  box(phone, 0.07, 0.2, 0.07, '#1d2330', 0.1, -0.2, -0.03, { cast: false }); box(phone, 0.07, 0.2, 0.07, '#1d2330', -0.1, -0.22, -0.03, { cast: false });
  function drawPhone(t) {
    const g = pg; g.fillStyle = '#0b0d12'; g.fillRect(0, 0, 512, 1024);
    g.fillStyle = '#1b1f2a'; g.fillRect(0, 0, 512, 80); g.fillStyle = '#ffffff'; g.font = '700 34px Montserrat'; g.textAlign = 'center'; g.fillText('LIVE', 256, 55);
    g.fillStyle = '#ff3a4a'; g.beginPath(); g.arc(190, 44, 10, 0, 6.3); g.fill();
    g.fillStyle = '#7ee08a'; g.font = '110px Anton'; g.fillText('$' + Math.round(earned(t)).toLocaleString('en-US'), 256, 520, 480);
    g.fillStyle = '#c9ced4'; g.font = '700 30px Montserrat'; g.fillText('EARNED SINCE YOU', 256, 600); g.fillText('STARTED WATCHING', 256, 640);
    for (let i = 0; i < 16; i++) { const h = 30 + 120 * (i / 15) + Math.sin(t * 3 + i) * 8; g.fillStyle = '#2f8f6f'; g.fillRect(40 + i * 28, 900 - h, 20, h); }
    phoneTex.needsUpdate = true;
  }

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, sky, extra = {}) => { const group = new THREE.Group(); sets[name] = { group, sky, ...extra }; return group; };

  // BEDROOM: night, you on your bed watching your phone
  let sleeper;
  {
    const g = mk('BEDROOM', '#1a2238', { skyTop: '#0a0f20', sun: [-10, 20, -12], sunI: 0.8, sunColor: '#9fb4ff', hemi: 0.45, hemiSky: '#8090c0', hemiGround: '#1a1418', fogNear: 20, fogFar: 60, shadow: 10, ground: '#1a1418', exposure: 1.2, fillI: 0.1 });
    box(g, 10, 0.2, 10, '#5a4030', 0, -0.1, -2, { cast: false }); box(g, 10, 4, 0.3, '#2c3450', 0, 2, -7, { cast: false }); box(g, 0.3, 4, 10, '#28304a', -5, 2, -2, { cast: false }); box(g, 0.3, 4, 10, '#28304a', 5, 2, -2, { cast: false });
    box(g, 2.4, 1.8, 0.1, '#0a1230', -1.6, 2.2, -6.84, { cast: false, mat: { emissive: '#1a2a60', emissiveIntensity: 0.6 } }); sprite(g, '#e8eeff', 0.7, -1.2, 2.6, -6.8, 0.9);
    box(g, 3.2, 0.5, 4.4, '#e8e2d4', 0.8, 0.45, -3.5); box(g, 3.2, 0.9, 0.3, '#5a3a2a', 0.8, 0.9, -5.6); box(g, 1.2, 0.25, 0.7, '#ffffff', 0.2, 0.8, -5.0); box(g, 3.25, 0.3, 2.6, '#3d5a80', 0.8, 0.75, -2.6);
    box(g, 0.8, 0.8, 0.8, '#6a4630', 3.0, 0.4, -5.4); box(g, 0.4, 0.5, 0.4, '#f4ecd8', 3.0, 1.05, -5.4, { mat: { emissive: '#ffd890', emissiveIntensity: 1.2 } });
    const lamp = new THREE.PointLight(0xffd890, 6, 8, 1.6); lamp.position.set(3.0, 1.5, -5.0); g.add(lamp);
    sleeper = person(g, { body: '#3d5a80', legs: '#3d5a80', hair: '#3a2a20' }, 0.3, -3.6, { ry: Math.PI }); sleeper.root.rotation.x = -Math.PI / 2; sleeper.root.position.set(0.3, 0.95, -5.2);
    sets.BEDROOM.update = (s) => { drawPhone(s.t); };
  }

  // TANK: a glass tank in a studio, filling with cash as the counter climbs
  let tankCash, chute;
  {
    const g = mk('TANK', '#e8edf2', { skyTop: '#c9d3dc', sun: [8, 20, 12], sunI: 2.2, hemi: 1.2, fogNear: 40, fogFar: 120, shadow: 14, ground: '#c9ced4', exposure: 1.05 });
    box(g, 60, 0.2, 60, '#d7dbe0', 0, -0.1, -10, { cast: false, mat: { roughness: 0.25 } });
    box(g, 6.2, 0.3, 6.2, '#2b2f36', 0, 0.15, -6); const glass = box(g, 6, 8, 6, '#cfe8f4', 0, 4.3, -6, { cast: false, mat: { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2 } });
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([x, z]) => box(g, 0.12, 8, 0.12, '#9aa0a8', x, 4.3, -6 + z, { mat: { metalness: 0.8 } }));
    tankCash = instanced(g, [{ w: 0.9, h: 0.3, d: 0.45, c: '#6f9a5e', x: 0, y: 0, z: 0 }, { w: 0.2, h: 0.31, d: 0.46, c: '#e9dcc4', x: 0, y: 0, z: 0, cast: false }], 360);
    chute = instanced(g, [{ w: 0.9, h: 0.04, d: 0.45, c: '#7fa36a', x: 0, y: 0, z: 0, cast: false }], 40);
    box(g, 1.2, 1.2, 1.2, '#5d6670', 0, 12.6, -6); box(g, 0.8, 3, 0.8, '#5d6670', 0, 10.4, -6);
    sets.TANK.update = (s) => {
      const fill = clamp(Math.log10(1 + earned(s.t)) / Math.log10(1 + 800000)); const n = Math.round(360 * fill);
      for (let i = 0; i < 360; i++) { const lay = Math.floor(i / 36), k = i % 36; tankCash.place(i, { x: -2.4 + (k % 6) * 0.95, y: 0.45 + lay * 0.32, z: -8.4 + Math.floor(k / 6) * 0.95, ry: hash(i) * 0.4 - 0.2, hide: i >= n }); }
      tankCash.done();
      for (let i = 0; i < 40; i++) { const y = 9 - ((s.t * 6 + i * 0.6) % (9 - 0.45 - Math.floor(n / 36) * 0.32)); chute.place(i, { x: (hash(i) - 0.5) * 2, y, z: -6 + (hash(i * 3) - 0.5) * 2, rx: s.t * 3 + i, ry: i }); }
      chute.done();
    };
  }

  // DEALER: a brand new electric sedan, $40k
  {
    const g = mk('DEALER', '#eef1f4', { skyTop: '#dfe6ec', sun: [6, 16, 10], sunI: 2.2, hemi: 1.4, fogNear: 30, fogFar: 90, shadow: 12, exposure: 1.05 });
    box(g, 20, 0.2, 20, '#e1e4e8', 0, -0.1, -4, { cast: false, mat: { roughness: 0.15, metalness: 0.2 } }); box(g, 20, 7, 0.3, '#f4f6f8', 0, 3.5, -12, { cast: false });
    box(g, 6, 0.2, 7, '#c9ced4', 0, 0.1, -5); car(g, 0, -5, Math.PI * 0.8, '#c0392b');
    const st = new THREE.Group(); st.position.set(3.2, 0, -2.4); g.add(st); box(st, 0.08, 1.2, 0.08, '#5d6670', 0, 0.6, 0); sign(st, ['$40,000'], 1.8, 0.7, 0, 1.5, 0, { bg: '#ffffff', fg: '#c0392b', ry: -0.4 });
    for (let k = 0; k < 5; k++) box(g, 3, 0.12, 0.5, '#ffffff', -6 + k * 3, 6.8, -6, { cast: false, mat: { emissive: '#ffffff', emissiveIntensity: 1.2 } });
  }

  // FAMILY: a suburban family, ~$80k a year
  const fam = [];
  {
    const g = mk('FAMILY', '#cfe6f6', { skyTop: '#6fa8e0', sun: [30, 40, 25], sunI: 2.8, hemi: 1.15, hemiSky: '#e6f0ff', hemiGround: '#c8d2c0', fogNear: 80, fogFar: 300, shadow: 30, ground: '#c8d0d8' });
    box(g, 400, 0.1, 400, '#79a64e', 0, -0.05, -100, { cast: false }); box(g, 8, 0.08, 400, '#4a4d52', 0, 0.01, -100, { cast: false });
    house(g, 12, -6, -Math.PI / 2); house(g, 12, -22, -Math.PI / 2, '#e8edf2', '#3a3f4c'); house(g, -12, -10, Math.PI / 2, '#dfe8dc', '#2c3e5c'); house(g, -12, -26, Math.PI / 2, '#f4d9c6', '#6a4630');
    [[5.4, -4.6], [6.2, -6.0], [5.2, -7.2], [6.6, -8.2]].forEach(([x, z], i) => { const p = person(g, peopleCols[i], x, z, { ry: -Math.PI / 2, s: i > 1 ? 0.7 : 1 }); fam.push(p); });
    sets.FAMILY.update = (s) => fam.forEach((p, i) => { idlePose(p, s.t, i); p.armR.rotation.x = -2.6 + Math.sin(s.t * 6 + i) * 0.4; });
  }

  // DINER: minimum wage, the wall clock spinning
  let clockHand, worker;
  {
    const g = mk('DINER', '#f4ecd8', { skyTop: '#f4ecd8', sun: [6, 14, 10], sunI: 2.2, hemi: 1.2, fogNear: 30, fogFar: 80, shadow: 10, ground: '#c9b8a0' });
    box(g, 14, 0.2, 12, '#e9e1cf', 0, -0.1, -4, { cast: false }); for (let x = -6; x <= 6; x += 1) box(g, 1, 0.02, 12, x % 2 ? '#2b2d42' : '#f4ecd8', x, 0.01, -4, { cast: false });
    box(g, 14, 6, 0.3, '#c0392b', 0, 3, -9, { cast: false }); box(g, 8, 1.1, 1.2, '#f4f1ea', 0, 0.55, -5); box(g, 8.2, 0.12, 1.4, '#c9ced4', 0, 1.16, -5, { mat: { metalness: 0.7 } });
    box(g, 3, 0.2, 1.4, '#2b2f36', -1.5, 1.4, -7.4); for (let i = 0; i < 4; i++) box(g, 0.4, 0.08, 0.4, '#7a4a2e', -2.4 + i * 0.6, 1.55, -7.4);
    sign(g, ['$7.25 / HOUR'], 3.4, 1.0, 2.6, 4.2, -8.8, { bg: '#ffffff', fg: '#c0392b' });
    const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32), mat('#ffffff')); ck.rotation.x = Math.PI / 2; ck.position.set(-2.6, 4.2, -8.8); g.add(ck);
    clockHand = box(g, 0.06, 0.7, 0.04, '#1b1b24', -2.6, 4.2, -8.7, { cast: false }); clockHand.geometry = clockHand.geometry.clone(); clockHand.geometry.translate(0, 0.35, 0);
    worker = person(g, { body: '#c0392b', legs: '#26262c', hat: '#f4f1ea', hair: '#3a2a20' }, -1.5, -6.4, { ry: Math.PI * 0.05 });
    sets.DINER.update = (s) => { clockHand.rotation.z = -s.t * 12; idlePose(worker, s.t, 1); worker.armR.rotation.x = -1.2 + Math.abs(Math.sin(s.t * 6)) * 0.6; };
  }

  // HOUSE: the typical American house, SOLD the moment the counter passes $400k
  let soldSign;
  {
    const g = mk('HOUSE', '#cfe6f6', { skyTop: '#6fa8e0', sun: [30, 40, 25], sunI: 2.8, hemi: 1.15, hemiSky: '#e6f0ff', hemiGround: '#c8d2c0', fogNear: 80, fogFar: 300, shadow: 24, ground: '#c8d0d8' });
    box(g, 400, 0.1, 400, '#79a64e', 0, -0.05, -100, { cast: false }); box(g, 3, 0.06, 12, '#c9ccd0', 3.4, 0.01, 6, { cast: false });
    house(g, 0, -4, 0, '#f1e7d4', '#5d4037');
    [[-8, -2], [8, -6], [-9, -12]].forEach(([x, z]) => { box(g, 0.5, 2.6, 0.5, '#6a4a34', x, 1.3, z); box(g, 3.4, 3, 3.4, '#4f8a3a', x, 4, z); });
    const ps = new THREE.Group(); ps.position.set(-3, 0, 8); g.add(ps); box(ps, 0.12, 2, 0.12, '#ffffff', 0, 1, 0); box(ps, 1.6, 0.1, 0.1, '#ffffff', 0.7, 1.9, 0);
    sign(ps, ['FOR SALE', '$400,000'], 1.4, 0.9, 0.8, 1.35, 0.06, { bg: '#ffffff', fg: '#2c3e5c' });
    soldSign = sign(ps, ['SOLD'], 1.4, 0.5, 0.8, 0.75, 0.07, { bg: '#c0392b', fg: '#ffffff' });
    sets.HOUSE.update = (s) => { const k = spring(s.t - crossAt(400000), 3, 0.5); soldSign.visible = k > 0.01; soldSign.scale.setScalar(Math.max(0.01, k)); };
  }

  // GARAGE: a covered supercar, unveiled when the counter passes $600k
  let cover, lambo;
  {
    const g = mk('GARAGE', '#14121c', { skyTop: '#0a0910', sun: [4, 14, 8], sunI: 1.6, hemi: 0.6, hemiSky: '#b0a0ff', hemiGround: '#14121c', fogNear: 20, fogFar: 60, shadow: 10, ground: '#14121c', exposure: 1.2 });
    box(g, 16, 0.2, 16, '#2b2f36', 0, -0.1, -4, { cast: false, mat: { roughness: 0.12, metalness: 0.4 } }); box(g, 16, 6, 0.3, '#1b1b24', 0, 3, -10, { cast: false });
    for (let k = 0; k < 4; k++) box(g, 0.1, 0.1, 10, ['#ff3ab0', '#3ad8ff'][k % 2], -6 + k * 4, 5.6, -4, { cast: false, mat: { emissive: ['#ff3ab0', '#3ad8ff'][k % 2], emissiveIntensity: 3 } });
    box(g, 12, 0.12, 0.12, '#ff3ab0', 0, 0.2, -9.8, { cast: false, mat: { emissive: '#ff3ab0', emissiveIntensity: 3 } });
    lambo = car(g, 0, -4, Math.PI * 0.85, '#f1c40f', true);
    cover = box(g, 2.6, 1.4, 5.2, '#7a7f8a', 0, 0.7, -4, { mat: { roughness: 1 } });
    const pl = new THREE.PointLight(0xff3ab0, 10, 14, 1.6); pl.position.set(-3, 3, -2); g.add(pl); const pl2 = new THREE.PointLight(0x3ad8ff, 10, 14, 1.6); pl2.position.set(3, 3, -6); g.add(pl2);
    sets.GARAGE.update = (s) => { const k = easeOut(clamp((s.t - crossAt(600000)) / 0.7)); cover.position.set(k * 1.5, 0.7 + k * 6, -4 - k * 2); cover.rotation.set(k * 1.2, 0, k * 0.8); cover.visible = k < 0.98; };
  }

  // CITY: night to sunrise over a skyline (tonight → tomorrow)
  let sunC, skyDome;
  {
    const g = mk('CITY', '#1a2448', { skyTop: '#05070f', sun: [-30, 10, -40], sunI: 1.4, sunColor: '#ffb070', hemi: 0.7, fogNear: 120, fogFar: 500, shadow: 60, ground: '#101018' });
    box(g, 800, 0.1, 800, '#1d2430', 0, -0.05, -200, { cast: false });
    const bl = []; for (let i = 0; i < 220; i++) { const x = (hash(i) - 0.5) * 300, z = -40 - hash(i * 2) * 300; bl.push({ x, z, h: 8 + Math.pow(hash(i * 3), 2) * 70, w: 8 + hash(i * 4) * 8 }); }
    const bk = instanced(g, [{ w: 1, h: 1, d: 1, c: '#fff', tint: true, x: 0, y: 0.5, z: 0 }], bl.length);
    bl.forEach((b, i) => { bk.meshes[0].m.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(b.x, 0, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.w)).multiply(new THREE.Matrix4().makeTranslation(0, 0.5, 0))); bk.color(i, 0, ['#3a4258', '#2c3448', '#4a5068'][i % 3]); }); bk.done();
    const win = []; for (let i = 0; i < 900; i++) { const b = bl[i % bl.length]; win.push({ x: b.x + (hash(i * 7) - 0.5) * b.w * 0.8, y: 2 + hash(i * 9) * (b.h - 3), z: b.z + b.w / 2 + 0.05 }); }
    const wn = instanced(g, [{ w: 1.0, h: 1.2, d: 0.1, c: '#ffd890', x: 0, y: 0, z: 0, cast: false, mat: { emissive: '#ffb050', emissiveIntensity: 1.6 } }], win.length); win.forEach((o, i) => wn.place(i, o)); wn.done();
    skyDome = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), new THREE.MeshBasicMaterial({ color: '#0a0f20', side: THREE.BackSide, fog: false })); g.add(skyDome);
    sunC = sprite(g, '#ffc070', 160, 0, -60, -700);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 12), new THREE.MeshBasicMaterial({ color: '#f4f1e0', fog: false })); moon.position.set(-160, 200, -700); g.add(moon); g.userData.moon = moon;
    sets.CITY.update = (s) => { const k = clamp((s.t - T('tomorrow') + 0.6) / 2.4); skyDome.material.color.copy(new THREE.Color('#0a0f20').lerp(new THREE.Color('#f0a070'), ease(k))); sunC.position.y = lerp(-80, 120, ease(k)); moon.visible = k < 0.6; };
  }

  // CRASH: a 3D price chart that climbs, then drops hard
  let bars;
  {
    const g = mk('CRASH', '#0c0f18', { skyTop: '#05070c', sun: [10, 20, 20], sunI: 1.4, hemi: 0.6, fogNear: 40, fogFar: 140, shadow: 30, ground: '#0c0f18', exposure: 1.15 });
    box(g, 120, 0.1, 60, '#141824', 0, -0.05, -10, { cast: false });
    for (let k = 0; k < 8; k++) box(g, 100, 0.03, 0.06, '#232a3a', 0, 0.02, -k * 4, { cast: false });
    bars = instanced(g, [{ w: 1.2, h: 1, d: 1.2, c: '#fff', tint: true, x: 0, y: 0.5, z: 0, mat: { emissive: '#000000' } }], 40);
    sets.CRASH.update = (s) => {
      const drop = T('lost'); for (let i = 0; i < 40; i++) { let h = 4 + i * 0.5 + Math.sin(i * 1.7) * 1.2; const red = i >= 34; if (red) { const k = easeOut(clamp((s.t - drop + 0.2 - (i - 34) * 0.08) / 0.6)); h = h - k * (h * 0.55); }
        bars.place(i, { x: -24 + i * 1.4, y: 0, z: -6, sy: h }); bars.color(i, 0, red && s.t > drop - 0.2 ? '#ff3a4a' : '#2fd08f'); }
      bars.done();
    };
  }

  /* ─── HUD ─── */
  function fitText(g, text, font, size, maxW) { g.font = `${size}px ${font}`; const w = g.measureText(text).width; return w > maxW ? size * maxW / w : size; }
  function stamp(g, t, t0, title, sub, col, dur = 2.1, snd = 'ding') {
    ev(snd, t0);
    const d = t - t0; if (d < 0 || d > dur) return;
    const k = spring(d, 2.4, 0.42), fade = d > dur - 0.3 ? 1 - (d - (dur - 0.3)) / 0.3 : 1;
    g.save(); g.globalAlpha = fade; g.translate(W / 2 - 40, 380); g.scale(k, k);
    const fs = fitText(g, title, 'Anton', 124, 820);
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
    const t = s.t;
    // the live counter runs the whole film (it's the point)
    const v = earned(t), txt = money(v), catchT = T('catch');
    hudText(g, 'MUSK EARNED SINCE YOU STARTED WATCHING', 80, 960, `800 ${fitText(g, 'MUSK EARNED SINCE YOU STARTED WATCHING', 'Montserrat', 30, 840)}px Montserrat`, 'rgba(255,255,255,0.92)', { shadow: 10, stroke: 5 });
    hudText(g, txt, 80, 1080, `${fitText(g, txt, 'Anton', 120, 840)}px Anton`, t > catchT ? '#ffd23f' : '#7ee08a', { stroke: 14 });
    hudText(g, '≈ $12,800 / SECOND', 80, 1150, '50px Anton', 'rgba(255,255,255,0.85)', { stroke: 10 });
    stamp(g, t, T('tesla'), 'NEW TESLA ✓', '≈ $40,000 · EARNED IN ~3 SECONDS', '#7ee08a');
    stamp(g, t, T('family'), 'A FAMILY\'S YEAR ✓', '≈ $80,000 · EARNED IN ~6 SECONDS', '#7ee08a');
    stamp(g, t, T('minimum'), '$7.25 / HOUR', 'FEDERAL MINIMUM WAGE', '#ffd23f', 2.0, 'pop');
    stamp(g, t, crossAt(400000), 'HOUSE ✓', '$400,000 · RIGHT NOW', '#7ee08a', 2.2);
    stamp(g, t, crossAt(600000), 'LAMBORGHINI ✓', '$600,000 · RIGHT NOW', '#7ee08a', 2.2);
    const lamboBusy = t > crossAt(600000) - 0.5 && t < crossAt(600000) + 2.2;
    if (!lamboBusy) bigLine(g, t, T('tonight'), T('tomorrow') - 0.05, '8 HOURS ≈ $370,000,000', '#ffffff', 400, 100);
    if (!lamboBusy) bigLine(g, t, T('tomorrow'), catchT - 0.05, '24 HOURS ≈ $1,100,000,000', '#7ee08a', 400, 100);
    stamp(g, t, T('lost'), '-$33,500,000,000', 'IN ONE DAY THIS WEEK (BLOOMBERG)', '#ff5a4a', 2.6, 'hit');
    bigLine(g, t, T('so', 1), 1e9, 'HIS MONEY', '#ffffff', 330, 120);
    bigLine(g, t, T('so', 1) + 0.25, 1e9, 'WITH HIS RISK?', '#ffd23f', 470, 120);
  }

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update) => shots.push({ id, t0, set, cam, update });
  const pov = (x, y, z, lx, ly, lz, fov = 62, extra = {}) => ({ pos: [x, y, z], look: [lx, ly, lz], fov, hands: false, ...extra });
  const phoneOn = (on) => { phone.visible = on; };

  shot('P1', 0, 'BEDROOM', (s) => { phoneOn(true); return pov(0.6, 1.6, -1.2 + s.lt * 0.05, 0.6, 1.25, -3.2, 58); });
  shot('P2', T('counter'), 'BEDROOM', (s) => { phoneOn(true); return pov(0.6, 1.6 - s.lt * 0.04, -1.3, 0.6, 1.0, -2.2, 34); });
  shot('K1', T('over'), 'TANK', (s) => { phoneOn(false); const k = ease(s.p); return pov(lerp(9, 6, k), lerp(5, 7, k), lerp(8, 3, k), 0, 3.4, -6, 55); });
  shot('K2', T('roughly'), 'TANK', (s) => { phoneOn(false); return pov(-4 + s.lt * 0.6, 9.5, -1.5, 0, 2, -6.5, 55); });
  shot('D1', T('ten', 1), 'DEALER', (s) => { phoneOn(false); return pov(6.5 - s.lt * 0.4, 2.6, 3.0 - s.lt * 0.3, 0, -1.6, -5, 54); });
  shot('F1', T('family'), 'FAMILY', (s) => { phoneOn(false); return pov(-2 + s.lt * 0.4, 2.0, 2 - s.lt * 0.6, 6, 1.4, -6.5, 56); });
  shot('W1', T('earn'), 'DINER', (s) => { phoneOn(false); return pov(1.4, 1.8, 2 - s.lt * 0.5, -1.2, 1.8, -8, 58); });
  shot('H1', T('now'), 'HOUSE', (s) => { phoneOn(false); const k = ease(s.p); return pov(lerp(-8, -4, k), 2.2, lerp(22, 14, k), -1, 2.2, 0, 56); });
  shot('L1', T('lamborghini'), 'GARAGE', (s) => { phoneOn(false); return pov(5 - s.lt * 0.2, 1.7, 3 - s.lt * 0.2, 0, 0.4, -4, 52); });
  shot('K3', T('by', 2), 'TANK', (s) => { phoneOn(false); return pov(7 - s.lt * 0.8, 3 + s.lt * 0.5, 6, 0, 3.6, -6, 55); });
  shot('N1', T('tonight'), 'BEDROOM', (s) => { phoneOn(false); return pov(-3.4 + s.lt * 0.2, 2.8, 0.8, 0.6, 0.8, -4.4, 60); });
  shot('C1', T('by', 3), 'CITY', (s) => { phoneOn(false); return pov(0, 30 - s.lt * 2, 60, 0, 40, -300, 55); });
  shot('X1', T('catch'), 'CRASH', (s) => { phoneOn(false); const k = ease(s.p); return pov(lerp(-30, 10, k), 10, 18, lerp(-20, 22, k), 8, -6, 56); });
  shot('X2', T('lost'), 'CRASH', (s) => { phoneOn(false); return pov(14 + s.lt * 0.6, 8 - s.lt * 0.5, 10, 24, 6, -6, 52); });
  shot('E1', T('so', 1), 'BEDROOM', (s) => { phoneOn(true); return pov(0.6, 1.6, -1.2, 0.6, 1.25, -3.2, 58); });
  shot('E2', T('tell'), 'BEDROOM', (s) => { phoneOn(false); return pov(-3.4, 2.4 + s.lt * 0.2, 1.2, 0.6, 1.0, -4.4, 58); });

  shot('P1b', T('getting'), 'BEDROOM', (s) => { phoneOn(true); return pov(0.4, 1.7, -1.0 - s.lt * 0.05, 0.6, 1.2, -2.6, 46); });
  shot('D2', T('already'), 'DEALER', (s) => { phoneOn(false); return pov(-5.5 + s.lt * 0.4, 2.0, 0.0, 0, -1.2, -5, 54); });
  shot('W2', T('federal'), 'DINER', (s) => { phoneOn(false); return pov(-1.0, 3.2, -4.6 - s.lt * 0.3, -2.4, 4.0, -8.8, 50); });
  shot('H2', T('give'), 'HOUSE', (s) => { phoneOn(false); return pov(-1.4, 1.5, 11.5 - s.lt * 0.3, -2.2, 1.3, 8, 48); });
  shot('L2', T('before'), 'GARAGE', (s) => { phoneOn(false); return pov(-4.5 + s.lt * 0.4, 1.8, 1.5, 0, 0.4, -4, 54); });
  { const tl = crossAt(600000); shot('L3', tl - 0.5, 'GARAGE', (s) => { phoneOn(false); return pov(3.5 - s.lt * 0.3, 1.5, 2.6, 0, 0.5, -4, 50); }); shots.push({ id: 'Lx', t0: tl + 1.9, set: '__prev', cam: null }); }
  shot('K4', T('quarters'), 'TANK', (s) => { phoneOn(false); return pov(-6 + s.lt * 0.5, 5.5, 1, 0, 3, -6, 55); });
  shot('N2', T('sleep'), 'BEDROOM', (s) => { phoneOn(false); return pov(1.2, 1.9, -1.0 - s.lt * 0.1, -1.4, 2.3, -6.8, 50); });
  shot('X1b', T('stock'), 'CRASH', (s) => { phoneOn(false); return pov(-10 + s.lt * 2, 4, 12, 4 + s.lt * 2, 6, -6, 56); });

  shots.sort((a, b) => a.t0 - b.t0);
  for (let i = shots.length - 2; i >= 0; i--) if (shots[i + 1].t0 - shots[i].t0 < 0.25) shots.splice(i, 1);
  shots.forEach((sh, i) => { if (sh.set === '__prev') { const prev = shots.slice(0, i).reverse().find((x) => x.id !== 'L3' && x.set !== '__prev'); sh.set = prev.set; sh.cam = prev.cam; sh.update = prev.update; sh.id = prev.id + 'r'; } });
  return { sets, shots, hud, wipes: [], end: A.duration };
};

/* "Fall into a black hole" — blocky 3D first-person trip into Sagittarius A*, vertical 1080×1920.
 * Facts: Sgr A* ≈ 4 million solar masses (EHT 2022; 4.3 M from stellar orbits), ≈ 27,000 ly away; first image
 * released May 12, 2022 (EHT); Parker Solar Probe ≈ 192 km/s (Dec 2024) → ≈ 42 million years; light can orbit at the
 * photon sphere; a distant observer sees the infaller redden and freeze; stellar-mass holes spaghettify before
 * the horizon, supermassive ones after; NASA Goddard's 2024 simulation of an Sgr A*-sized hole: ≈ 12.8 s left
 * after crossing the horizon.
 */
window.buildFilm = (A) => {
  const { THREE, T, W, H, clamp, lerp, ease, easeOut, spring, hash, ev, box, sign, person, walkPose, idlePose, mat, buildHands, setHeld, poseHands, hudText, instanced, camera } = A;
  const GL = { metalness: 0.6, roughness: 0.08 };

  /* ─── textures ─── */
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const glowTex = canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,230,190,0.8)'); gr.addColorStop(0.5, 'rgba(255,170,90,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  // accretion disk: radial heat gradient + orbit streaks (texture u = angle, v = radius on a RingGeometry via custom UVs)
  const diskTex = canvasTex(1024, 1024, (g, w) => {
    const c = w / 2; for (let r = 0; r < c; r += 1) { const k = r / c; const a = k < 0.28 ? 0 : Math.pow(1 - (k - 0.28) / 0.72, 1.6); const col = `rgba(${255},${Math.round(150 + 105 * (1 - k))},${Math.round(60 + 180 * Math.pow(1 - k, 3))},${a})`; g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke(); }
    for (let i = 0; i < 900; i++) { const r = c * (0.3 + Math.pow(Math.random(), 1.4) * 0.68), a0 = Math.random() * 6.28, len = 0.2 + Math.random() * 0.8; g.strokeStyle = `rgba(255,${200 + Math.random() * 55},${150 + Math.random() * 100},${0.15 + Math.random() * 0.35})`; g.lineWidth = 1 + Math.random() * 2.5; g.beginPath(); g.arc(c, c, r, a0, a0 + len); g.stroke(); }
    for (let i = 0; i < 400; i++) { const r = c * (0.3 + Math.random() * 0.68), a0 = Math.random() * 6.28, len = 0.1 + Math.random() * 0.5; g.strokeStyle = `rgba(90,20,0,${0.15 + Math.random() * 0.3})`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); g.arc(c, c, r, a0, a0 + len); g.stroke(); }
  });
  const haloTex = canvasTex(512, 512, (g, w) => { const c = w / 2; const gr = g.createRadialGradient(c, c, c * 0.5, c, c, c); gr.addColorStop(0, 'rgba(255,250,235,0)'); gr.addColorStop(0.04, 'rgba(255,250,235,1)'); gr.addColorStop(0.12, 'rgba(255,200,120,0.9)'); gr.addColorStop(0.45, 'rgba(255,120,40,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const add = (map, opacity = 1, color = '#ffffff') => new THREE.MeshBasicMaterial({ map, transparent: true, opacity, color, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  function stars(g, n, R, seed = 1, size = 2) { const geo = new THREE.BufferGeometry(); const pos = [], col = []; const c = new THREE.Color(); for (let i = 0; i < n; i++) { const a = hash(i * 1.3 + seed) * Math.PI * 2, b = Math.acos(2 * hash(i * 2.7 + seed) - 1); pos.push(Math.sin(b) * Math.cos(a) * R, Math.cos(b) * R, Math.sin(b) * Math.sin(a) * R); c.set(['#ffffff', '#cfe0ff', '#ffe8c8', '#ffd0a0'][i % 4]); col.push(c.r, c.g, c.b); } geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const p = new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, fog: false })); g.add(p); return p; }
  // black hole: shadow sphere + flat disk + camera-facing lensed halo + photon ring
  function blackHole(g, s = 1) {
    const bh = new THREE.Group(); bh.scale.setScalar(s); g.add(bh);
    const shadow = new THREE.Mesh(new THREE.SphereGeometry(2, 48, 24), new THREE.MeshBasicMaterial({ color: '#000000', fog: false })); bh.add(shadow);
    const ringGeo = new THREE.RingGeometry(2.6, 10, 128, 1); const uv = ringGeo.attributes.uv, pos = ringGeo.attributes.position; for (let i = 0; i < uv.count; i++) { uv.setXY(i, pos.getX(i) / 20 + 0.5, pos.getY(i) / 20 + 0.5); }
    const disk = new THREE.Mesh(ringGeo, add(diskTex, 1)); disk.rotation.x = -Math.PI / 2; bh.add(disk);
    const halo = new THREE.Mesh(new THREE.RingGeometry(2.02, 4.6, 96, 1), add(haloTex, 0.95)); { const u2 = halo.geometry.attributes.uv, p2 = halo.geometry.attributes.position; for (let i = 0; i < u2.count; i++) u2.setXY(i, p2.getX(i) / 9.2 + 0.5, p2.getY(i) / 9.2 + 0.5); } bh.add(halo);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffb070', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); glow.scale.setScalar(34); bh.add(glow);
    return { bh, disk, halo, shadow, glow, update(t) { disk.rotation.z = t * 0.35; halo.quaternion.copy(camera.quaternion); } };
  }
  function astronaut(g, x, y, z, ry = 0) {
    const p = person(g, { body: '#eef1f4', legs: '#d7dbe0', hair: '#eef1f4', skin: '#eef1f4' }, x, z, { ry }); p.root.position.y = y;
    box(p.head, 0.56, 0.56, 0.56, '#f4f6f8', 0, 0.22, 0, { cast: false }); box(p.head, 0.4, 0.26, 0.05, '#d8a83a', 0, 0.22, 0.28, { cast: false, mat: { metalness: 0.9, roughness: 0.15 } });
    box(p.root, 0.44, 0.5, 0.22, '#c9ced4', 0, 1.1, -0.25); box(p.root, 0.1, 0.1, 0.02, '#e2572c', 0.12, 1.2, 0.15, { cast: false });
    return p;
  }

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, sky, extra = {}) => { const group = new THREE.Group(); sets[name] = { group, sky, ...extra }; return group; };
  const SPACE = { skyTop: '#000002', sun: [10, 20, 30], sunI: 1.2, hemi: 0.25, hemiSky: '#a0b8ff', hemiGround: '#000000', fogNear: 9000, fogFar: 12000, ground: '#000000', fillI: 0.15, exposure: 1.05, shadow: 20 };

  // COCKPIT: your ship, a big window onto space
  let cockGal, cockBH;
  {
    const g = mk('COCKPIT', '#000003', { ...SPACE, sunI: 1.4, hemi: 0.5, lamp: 0 });
    box(g, 8, 0.2, 6, '#2b2f36', 0, -0.1, 0, { cast: false }); box(g, 8, 0.2, 6, '#22262e', 0, 3.2, 0, { cast: false });
    box(g, 0.3, 3.4, 6, '#2b2f36', -3.8, 1.6, 0, { cast: false }); box(g, 0.3, 3.4, 6, '#2b2f36', 3.8, 1.6, 0, { cast: false });
    // window frame (big opening at z=-3)
    box(g, 8, 0.6, 0.3, '#3a3f4c', 0, 0.3, -3, { cast: false }); box(g, 8, 0.4, 0.3, '#3a3f4c', 0, 3.0, -3, { cast: false }); box(g, 0.25, 3.2, 0.3, '#3a3f4c', 0, 1.6, -3.05, { cast: false });
    // console
    box(g, 6, 0.9, 1.2, '#3a3f4c', 0, 0.45, -2.2); const c2 = box(g, 6, 0.1, 1.0, '#2b2f36', 0, 1.0, -2.0, { cast: false }); c2.rotation.x = -0.4;
    for (let i = 0; i < 9; i++) box(g, 0.25, 0.04, 0.2, ['#e2572c', '#27ae60', '#f1c40f'][i % 3], -2.2 + i * 0.55, 1.08, -1.95, { cast: false, mat: { emissive: ['#e2572c', '#27ae60', '#f1c40f'][i % 3], emissiveIntensity: 1.5 } });
    sign(g, ['TARGET: SGR A*'], 1.6, 0.5, -1.5, 1.25, -2.38, { bg: '#06121c', fg: '#7fe8ff', glow: 1.2, ry: 0 });
    sign(g, ['DIST 27,000 LY'], 1.6, 0.5, 1.5, 1.25, -2.38, { bg: '#06121c', fg: '#ffd23f', glow: 1.2 });
    stars(g, 2500, 900, 3);
    cockGal = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffd8a8', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); cockGal.scale.set(260, 120, 1); cockGal.position.set(0, 60, -800); g.add(cockGal);
    const b = blackHole(g, 6); b.bh.position.set(0, 18, -150); b.bh.rotation.z = 0.12; b.bh.rotation.x = 0.15; cockBH = b;
    const lamp = new THREE.PointLight(0x7fe8ff, 4, 6, 1.6); lamp.position.set(0, 1.4, -1.2); g.add(lamp);
    sets.COCKPIT.update = (s) => { const end = s.t > T('so', 4) - 0.1; cockGal.visible = !end; cockBH.bh.visible = end; cockBH.update(s.t); };
  }

  // GALAXY: 40k-star spiral, Earth marker, Sgr A* at the core
  let earthMark, coreMark, route;
  {
    const g = mk('GALAXY', '#000000', { ...SPACE });
    const n = 40000, pos = [], col = [], c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const arm = i % 4, r = Math.pow(hash(i * 1.1), 0.7) * 500, a = arm * Math.PI / 2 + r * 0.012 + (hash(i * 2.3) - 0.5) * (0.5 + 60 / (r + 20));
      const th = (hash(i * 3.7) - 0.5) * (r < 80 ? 40 : 10);
      pos.push(Math.cos(a) * r, th, Math.sin(a) * r);
      c.set(r < 90 ? '#ffd8a8' : (i % 5 === 0 ? '#ffb0c8' : (i % 3 ? '#cfe0ff' : '#ffffff'))); col.push(c.r, c.g, c.b);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, opacity: 0.9 })));
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffd8a8', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); core.scale.set(260, 160, 1); g.add(core);
    stars(g, 2000, 2000, 7);
    earthMark = new THREE.Group(); earthMark.position.set(330, 0, 120); g.add(earthMark);
    const em = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#7fe8ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); em.scale.setScalar(26); earthMark.add(em);
    coreMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ff8a5a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); coreMark.scale.setScalar(40); g.add(coreMark);
    route = box(g, 1, 1.4, 1, '#ffd23f', 0, 0, 0, { cast: false, mat: { emissive: '#ffd23f', emissiveIntensity: 2 } });
    const L = Math.hypot(330, 120); route.scale.set(1.6, 1.6, L); route.position.set(165, 0, 60); route.lookAt(330, 0, 120);
  }
  const showRoute = (k) => { route.visible = k > 0; const L = Math.hypot(330, 120) * Math.max(0.001, k); route.scale.z = L; route.position.set(330 - 330 * k / 2, 0, 120 - 120 * k / 2); };

  // SUNS: one Sun vs 4 million suns (a block of glowing spheres stands in)
  let sunBlock, oneSun;
  {
    const g = mk('SUNS', '#000000', { ...SPACE });
    stars(g, 2500, 900, 11);
    oneSun = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffd24a', fog: false })); oneSun.position.set(0, 0, 0); g.add(oneSun);
    const sg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffb02a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sg.scale.setScalar(6); oneSun.add(sg);
    const N = 20, n = N * N * N; sunBlock = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }), n); sunBlock.frustumCulled = false;
    const m4 = new THREE.Matrix4(), cc = new THREE.Color(); let i = 0;
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) { m4.makeTranslation(6 + x, -N / 2 + y, -N / 2 + z); sunBlock.setMatrixAt(i, m4); sunBlock.setColorAt(i, cc.set(['#ffd24a', '#ffb02a', '#ffe08a'][(x + y + z) % 3])); i++; }
    g.add(sunBlock); sunBlock.userData.n = n;
  }

  // WARP: skipping 40 million years
  let streaks;
  {
    const g = mk('WARP', '#020010', { ...SPACE, skyTop: '#000000' });
    const list = []; for (let i = 0; i < 700; i++) { const a = hash(i) * Math.PI * 2, r = 4 + hash(i * 2) * 40; list.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z0: -hash(i * 3) * 600, c: ['#ffffff', '#7fe8ff', '#b0a0ff', '#ffd8a8'][i % 4] }); }
    streaks = instanced(g, [{ w: 0.12, h: 0.12, d: 1, c: '#fff', tint: true, x: 0, y: 0, z: 0, cast: false, mat: { emissive: '#ffffff', emissiveIntensity: 1.2 } }], list.length);
    list.forEach((o, i) => streaks.color(i, 0, o.c)); streaks.list = list;
    sets.WARP.update = (s) => { const v = 60 + s.lt * 260; streaks.list.forEach((o, i) => { const z = ((o.z0 + s.lt * v) % 600 + 600) % 600 - 600; streaks.place(i, { x: o.x, y: o.y, z, s: 1, sy: 1 }); streaks.meshes[0].m.getMatrixAt(i, _m); _m.scale(new THREE.Vector3(1, 1, 4 + v * 0.15)); streaks.meshes[0].m.setMatrixAt(i, _m); }); streaks.done(); };
  }
  const _m = new THREE.Matrix4();

  // PROBE: the fastest spacecraft ever, crawling across the stars
  let probe;
  {
    const g = mk('PROBE', '#000000', { ...SPACE, sunI: 2.4, sun: [40, 10, 20] });
    stars(g, 3000, 900, 5);
    probe = new THREE.Group(); g.add(probe);
    box(probe, 2.4, 2.4, 0.3, '#eef1f4', 0, 0, 1.2); box(probe, 1.2, 1.2, 2, '#d8a83a', 0, 0, 0, { mat: { metalness: 0.8, roughness: 0.3 } });
    box(probe, 4, 0.05, 0.8, '#2c3e5c', 2.6, 0, -0.2, { mat: GL }); box(probe, 4, 0.05, 0.8, '#2c3e5c', -2.6, 0, -0.2, { mat: GL }); box(probe, 0.1, 0.1, 1.6, '#9aa0a8', 0, 0.9, -0.6);
    const sunS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffe08a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sunS.scale.setScalar(80); sunS.position.set(160, 40, 80); g.add(sunS);
  }

  // BH: Sagittarius A* (the hero set) + an astronaut falling in, seen from outside
  let BH, faller, photons;
  {
    const g = mk('BH', '#000000', { ...SPACE, sun: [0, 2, 0], sunI: 1.5, sunColor: '#ffb070', hemi: 0.3 });
    stars(g, 4000, 1200, 13, 2.2);
    for (let i = 0; i < 6; i++) { const nb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: ['#5a2a8a', '#2a4a8a', '#8a3a5a'][i % 3], transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); nb.scale.setScalar(300 + hash(i) * 300); nb.position.set((hash(i * 2) - 0.5) * 1200, (hash(i * 3) - 0.5) * 600, -600 - hash(i * 4) * 300); g.add(nb); }
    BH = blackHole(g, 1); BH.bh.rotation.z = 0.12;
    faller = astronaut(g, 0, 0, 0); faller.root.scale.setScalar(0.08);
    photons = instanced(g, [{ w: 0.08, h: 0.08, d: 0.5, c: '#fffbe8', x: 0, y: 0, z: 0, cast: false, mat: { emissive: '#fff0c0', emissiveIntensity: 3 } }], 60);
    sets.BH.update = (s) => { BH.update(s.t); };
  }

  // STATION: your friends watch from far away
  let friends = [], farFaller, stBH;
  {
    const g = mk('STATION', '#000000', { ...SPACE, sunI: 1.6, hemi: 0.6, sun: [5, 10, 8] });
    stars(g, 2500, 900, 17);
    box(g, 10, 0.2, 8, '#3a3f4c', 0, -0.1, 0, { cast: false }); box(g, 10, 0.2, 8, '#2b2f36', 0, 3.4, 0, { cast: false });
    box(g, 10, 0.6, 0.3, '#5d6670', 0, 0.3, -3.5, { cast: false }); box(g, 10, 0.5, 0.3, '#5d6670', 0, 3.1, -3.5, { cast: false });
    for (let x = -3; x <= 3; x += 3) box(g, 0.25, 3, 0.3, '#5d6670', x, 1.6, -3.5, { cast: false });
    [[-1.6, 0.4], [0, 0.0], [1.6, 0.3]].forEach(([x, z], i) => friends.push(person(g, [{ body: '#2c6fb0', legs: '#26262c' }, { body: '#c96a5a', legs: '#2c3e5c', hair: '#c9a46a' }, { body: '#27ae60', legs: '#26262c' }][i], x, z - 1.5, { ry: Math.PI })));
    const tel = box(g, 0.3, 0.3, 1.6, '#d7dbe0', 2.6, 1.4, -2.4); tel.rotation.x = 0.3;
    const b = blackHole(g, 5); b.bh.position.set(0, 20, -160); b.bh.rotation.z = 0.12; stBH = b;
    farFaller = astronaut(g, 0, 0, 0); farFaller.root.scale.setScalar(2.2);
    sets.STATION.update = (s) => { stBH.update(s.t); friends.forEach((f, i) => { idlePose(f, s.t, i); f.head.rotation.x = -0.25; }); };
  }

  // SMALL: a stellar-mass black hole: spaghettification
  let noodle, smallBH;
  {
    const g = mk('SMALL', '#000000', { ...SPACE, sun: [0, 2, 4], sunI: 1.5, sunColor: '#ffb070' });
    stars(g, 3000, 900, 19);
    smallBH = blackHole(g, 0.5); smallBH.bh.rotation.z = -0.2;
    noodle = astronaut(g, 0, 0, 0);
    sets.SMALL.update = (s) => smallBH.update(s.t * 3);
  }

  // INSIDE: past the horizon, every path leads to the center
  let tunnel;
  {
    const g = mk('INSIDE', '#000000', { ...SPACE, hemi: 0.1 });
    tunnel = new THREE.Group(); g.add(tunnel);
    for (let i = 0; i < 60; i++) { const k = i / 60; const r = 6 * (1 - k * 0.92); const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06 + 0.1 * (1 - k), 6, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7a2a').lerp(new THREE.Color('#2a0a3a'), k), fog: false })); m.position.z = -i * 4; tunnel.add(m); }
    const lines = []; for (let i = 0; i < 300; i++) lines.push({ a: hash(i) * Math.PI * 2, r: 2 + hash(i * 2) * 4, z0: -hash(i * 3) * 240 });
    const ln = instanced(g, [{ w: 0.05, h: 0.05, d: 3, c: '#ffd8a8', x: 0, y: 0, z: 0, cast: false, mat: { emissive: '#ffb070', emissiveIntensity: 2 } }], lines.length);
    const sing = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sing.scale.setScalar(30); sing.position.z = -250; g.add(sing);
    sets.INSIDE.update = (s) => { lines.forEach((o, i) => { const z = ((o.z0 + s.t * 40) % 240 + 240) % 240 - 240; const sh = 1 + z / 260; ln.place(i, { x: Math.cos(o.a + s.t * 0.3) * o.r * sh, y: Math.sin(o.a + s.t * 0.3) * o.r * sh, z }); }); ln.done(); tunnel.rotation.z = s.t * 0.2; };
  }

  /* ─── HUD ─── */
  function fitText(g, text, font, size, maxW) { g.font = `${size}px ${font}`; const w = g.measureText(text).width; return w > maxW ? size * maxW / w : size; }
  function stamp(g, t, t0, title, sub, col = '#ffd23f', dur = 2.2, snd = 'ding') {
    ev(snd, t0);
    const d = t - t0; if (d < 0 || d > dur) return;
    const k = spring(d, 2.4, 0.42), fade = d > dur - 0.3 ? 1 - (d - (dur - 0.3)) / 0.3 : 1;
    g.save(); g.globalAlpha = fade; g.translate(W / 2 - 40, 380); g.scale(k, k);
    const fs = fitText(g, title, 'Anton', 124, 820);
    hudText(g, title, 0, 0, `${fs}px Anton`, col, { align: 'center', stroke: 14, strokeColor: 'rgba(5,5,15,0.85)' });
    g.font = '800 44px Montserrat'; const ss = Math.min(44, 44 * 820 / Math.max(1, g.measureText(sub).width));
    hudText(g, sub, 0, 72, `800 ${ss}px Montserrat`, '#ffffff', { align: 'center', shadow: 12, stroke: 6 });
    g.restore();
  }
  function bigLine(g, t, t0, t1, text, col, y, size = 110) {
    if (t < t0 || t > t1) return; const k = easeOut((t - t0) / 0.35), f = t > t1 - 0.25 ? (t1 - t) / 0.25 : 1;
    g.save(); g.globalAlpha = clamp(f); g.translate(W / 2 - 40, y + (1 - k) * 40);
    const fs = fitText(g, text, 'Anton', size, 840); hudText(g, text, 0, 0, `${fs}px Anton`, col, { align: 'center', stroke: 14, strokeColor: 'rgba(5,5,15,0.85)' }); g.restore();
  }
  const fmt = (v) => Math.round(v).toLocaleString('en-US');
  // distance to the horizon after the skip: 150 million km → 0 at "cross" (log ease)
  const distKm = (t) => { const a = T('glowing'), b = T('cross'); const k = clamp((t - a) / (b - a)); return Math.max(0, Math.pow(10, lerp(8.18, 4, ease(k))) * (1 - easeOut(clamp((t - (b - 0.6)) / 0.6)))); };
  function helmet(g, a = 1) { // visor rim for POV shots
    g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(8,10,14,0.92)'; g.beginPath(); g.rect(0, 0, W, H); g.ellipse(W / 2, H * 0.47, W * 0.62, H * 0.5, 0, 0, Math.PI * 2, true); g.fill('evenodd');
    g.strokeStyle = 'rgba(200,220,255,0.18)'; g.lineWidth = 6; g.beginPath(); g.ellipse(W / 2, H * 0.47, W * 0.62, H * 0.5, 0, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  function hud(g, s, sh) {
    const t = s.t;
    if (sh.helmet) helmet(g);
    const crossT = T('cross'), insideT = T('inside');
    if (t < T('glowing')) {
      hudText(g, 'DISTANCE TO SGR A*', 80, 960, '800 32px Montserrat', 'rgba(255,255,255,0.92)', { shadow: 10, stroke: 5 });
      hudText(g, '27,000 LIGHT-YEARS', 80, 1080, `${fitText(g, '27,000 LIGHT-YEARS', 'Anton', 110, 840)}px Anton`, '#7fe8ff', { stroke: 14 });
      if (t > T('fastest') && t < T('skip')) hudText(g, 'AT 192 KM/S: ~40 MILLION YEARS', 80, 1150, '50px Anton', '#ffd23f', { stroke: 10 });
    } else if (t < crossT + 0.05) {
      const d = distKm(t);
      hudText(g, 'DISTANCE TO EVENT HORIZON', 80, 960, '800 32px Montserrat', 'rgba(255,255,255,0.92)', { shadow: 10, stroke: 5 });
      const txt = fmt(d) + ' KM'; hudText(g, txt, 80, 1080, `${fitText(g, txt, 'Anton', 112, 840)}px Anton`, '#ffd23f', { stroke: 14 });
      if (t > T('strange') - 0.1) { // two clocks: yours vs what far-away friends see
        const mine = (t - T('strange')) * 60; const seen = Math.min(mine, 60 * 6 * (1 - Math.exp(-(t - T('strange')) / 1.6)));
        const clk = (v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
        hudText(g, `YOUR CLOCK ${clk(mine)}   ·   THEY SEE ${clk(seen)}`, 80, 1150, `${fitText(g, `YOUR CLOCK ${clk(mine)}   ·   THEY SEE ${clk(seen)}`, 'Anton', 46, 840)}px Anton`, '#ffffff', { stroke: 10 });
      }
    } else if (t < T('so', 4) && sh.set !== 'SMALL') {
      hudText(g, 'INSIDE THE EVENT HORIZON', 80, 960, '800 32px Montserrat', '#ff8a7a', { shadow: 10, stroke: 5 });
      if (t < T("nasa's")) hudText(g, 'NO WAY OUT', 80, 1080, '112px Anton', '#ff5a4a', { stroke: 14 });
      else if (t < T('so', 4)) { const left = Math.min(13, Math.max(0, 13 - (t - T('thirteen')) * 1.0)); hudText(g, `00:${String(Math.ceil(left)).padStart(2, '0')} LEFT`, 80, 1080, '112px Anton', '#ff5a4a', { stroke: 14 }); }
    }
    stamp(g, t, T('sagittarius'), 'SAGITTARIUS A*', 'THE BLACK HOLE AT THE CENTER OF THE MILKY WAY', '#ffd23f');
    stamp(g, t, T('heavier'), '× 4,000,000', 'THE MASS OF OUR SUN', '#ffd23f');
    stamp(g, t, T('skip'), '+40,000,000 YEARS', 'SKIPPING AHEAD', '#7fe8ff', 2.0, 'pop');
    stamp(g, t, T('photographed'), 'FIRST PHOTO: 2022', 'EVENT HORIZON TELESCOPE', '#ffd23f');
    stamp(g, t, T('loop'), 'LIGHT ORBITS HERE', 'THE PHOTON SPHERE', '#ffd23f');
    stamp(g, t, T('freeze'), 'FROZEN', 'TIME DILATION: THEY NEVER SEE YOU FALL IN', '#ff8a7a', 2.4, 'pop');
    stamp(g, t, T('cross'), 'POINT OF NO RETURN', 'YOU CROSSED THE EVENT HORIZON', '#ff5a4a', 2.4, 'hit');
    stamp(g, t, T('spaghettification'), 'SPAGHETTIFICATION', 'REAL SCIENCE WORD', '#ffd23f', 2.0, 'pop');
    stamp(g, t, T('thirteen'), '≈ 13 SECONDS', 'NASA SIMULATION (2024)', '#ff5a4a', 2.0, 'hit');
    bigLine(g, t, T('so', 4), 1e9, 'WOULD YOU', '#ffffff', 330, 130);
    bigLine(g, t, T('so', 4) + 0.25, 1e9, 'JUMP IN?', '#ffd23f', 480, 150);
  }

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update, extra = {}) => shots.push({ id, t0, set, cam, update, ...extra });
  const pov = (x, y, z, lx, ly, lz, fov = 62, extra = {}) => ({ pos: [x, y, z], look: [lx, ly, lz], fov, ...extra });
  let handsReady = false;
  const gloves = (t, g = 0) => { if (!handsReady) { buildHands('#eef1f4'); setHeld('none'); handsReady = true; } poseHands(t, g); };
  const orbitBH = (r, a, y, ly = 0, fov = 50) => pov(Math.sin(a) * r, y, Math.cos(a) * r, 0, ly, 0, fov, { hands: false });
  const stretch = (t) => { const k = easeOut(clamp((t - T('small')) / 3.0)); noodle.root.position.set(0.5, 2.0 - k * 0.5, 1.0); noodle.root.scale.set(0.4 * Math.max(0.3, 1 - k * 0.7), 0.4 * (1 + k * 3.5), 0.4 * Math.max(0.3, 1 - k * 0.7)); noodle.root.rotation.set(0.15, 0.6, 0.1); };
  const resetFaller = () => { faller.root.visible = false; photons.meshes[0].m.visible = false; };

  shot('P1', 0, 'COCKPIT', (s) => pov(0.3, 1.7, 1.6 - s.lt * 0.25, 0, 1.9, -20, 60), (s) => gloves(s.t));
  shot('P2', T("here's", 1), 'COCKPIT', (s) => ({ ...pov(-2.8, 2.6, 2.2 - s.lt * 0.3, 0.4, 1.8, -12, 64), hands: false }));
  shot('G1', T('target'), 'GALAXY', (s) => { const k = ease(s.p); showRoute(0); return { ...pov(lerp(500, 260, k), lerp(420, 160, k), lerp(600, 320, k), 0, 0, 0, 55), hands: false }; });
  shot('S1', T('heavier'), 'SUNS', (s) => { const k = ease(s.p); return { ...pov(lerp(-3, -50, k), lerp(1, 18, k), lerp(8, 60, k), lerp(2, 18, k), 0, 0, 55), hands: false }; });
  shot('G2', T('twenty-seven'), 'GALAXY', (s) => { showRoute(easeOut(clamp(s.lt / 1.6))); return { ...pov(260 - s.lt * 8, 520 - s.lt * 10, 260, 150, 0, 40, 55), hands: false }; });
  shot('R1', T('fastest'), 'PROBE', (s) => { probe.position.set(-6 + s.lt * 0.5, 0, 0); probe.rotation.y = 1.2; return { ...pov(-2, 2.5, 12, -4 + s.lt * 0.5, 0, 0, 50), hands: false }; });
  shot('W1', T('skip'), 'WARP', (s) => ({ ...pov(0, 0, 0, 0, 0, -10, 72 + s.lt * 6), hands: false }));
  shot('B1', T('glowing'), 'BH', (s) => { resetFaller(); return orbitBH(lerp(60, 34, ease(s.p)), 0.3 + s.lt * 0.08, lerp(10, 5, ease(s.p)), -5, 50); });
  shot('B2', T('photographed'), 'BH', (s) => { resetFaller(); return orbitBH(44 - s.lt * 2, 0.6, 34 - s.lt, -4, 34); });
  shot('F1', T('now', 1), 'BH', (s) => { resetFaller(); const k = ease(s.p); return { ...pov(lerp(3, 1.5, k), lerp(5, 2.4, k), lerp(30, 14, k), 0, lerp(-6, -3, k), 0, 62), hands: false }; }, null, { helmet: true });
  shot('F2', T('gravity'), 'BH', (s) => { resetFaller(); const m = photons.meshes[0].m; m.visible = true; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2 + s.t * 2.2; photons.place(i, { x: Math.cos(a) * 3.0, y: Math.sin(a * 1) * 0.0 + Math.sin(a) * 0.4, z: Math.sin(a) * 3.0, ry: -a }); } photons.done(); return orbitBH(11 - s.lt * 0.6, 0.2 + s.lt * 0.15, 2.4, -2.4, 56); });
  shot('O1', T('strange'), 'STATION', (s) => { farFaller.root.visible = false; return { ...pov(0.4, 2.0, 2.6 - s.lt * 0.2, 0, 8, -80, 60), hands: false }; });
  shot('O2', T('slow'), 'BH', (s) => { // the faller, seen from afar: slows, reddens, freezes at the edge
    photons.meshes[0].m.visible = false; faller.root.visible = true; const k = 1 - Math.exp(-s.lt / 0.9);
    faller.root.position.set(0.4, 2.35 + 3 * (1 - k), 6 - 3.6 * k); faller.root.rotation.set(0.3 * s.lt * (1 - k), 0.4, 0.2);
    const red = clamp(s.lt / 2.4); faller.root.traverse((o) => { if (o.isMesh) { if (!o.userData.base) { o.userData.base = o.material; o.material = o.material.clone(); } o.material.color.copy(new THREE.Color('#ffffff').lerp(new THREE.Color('#ff2a10'), red)); o.material.emissive = new THREE.Color('#ff2a10').multiplyScalar(red * 0.4); o.material.transparent = true; o.material.opacity = 1 - 0.75 * clamp((s.lt - 1.2) / 1.6); } });
    return orbitBH(16, 0.15, 3.0, 2.2, 30); });
  shot('X1', T('feel'), 'BH', (s) => { resetFaller(); const k = ease(s.p); return { ...pov(0.6 * (1 - k), lerp(2.6, 0.6, k), lerp(9, 2.6, k), 0, 0, 0, 66), hands: false }; }, null, { helmet: true });
  shot('X2', T('cross'), 'BH', (s) => { resetFaller(); const k = ease(clamp(s.lt / 1.6)); return { ...pov(0, lerp(0.6, 0.1, k), lerp(2.6, 1.2, k), 0, lerp(0, 3, k), lerp(0, 20, k), 66), hands: false }; }, null, { helmet: true });
  shot('K1', T('small'), 'SMALL', (s) => { stretch(s.t); return orbitBH(7, 0.5 + s.lt * 0.08, 2.4, 1.6, 56); });
  shot('K2', T('this', 1), 'BH', (s) => { resetFaller(); return { ...pov(0.2, 0.4 - s.lt * 0.1, 1.4 - s.lt * 0.15, 0, 4, 20, 66) }; }, (s) => gloves(s.t, 0.2 + 0.1 * Math.sin(s.t * 3)), { helmet: true });
  shot('I1', T('inside'), 'INSIDE', (s) => ({ ...pov(0, 0, 4 - s.lt * 6, 0, 0, -100, 70), hands: false }), null, { helmet: true });
  shot('I2', T("nasa's"), 'INSIDE', (s) => ({ ...pov(0.5, 0.3, -20 - s.lt * 8, 0, 0, -120, 64) }), (s) => gloves(s.t, 0.6), { helmet: true });
  shot('E1', T('so', 4), 'COCKPIT', (s) => pov(0.2, 1.7, 1.4 - s.lt * 0.2, 0, 2.6, -20, 60), (s) => gloves(s.t));
  shot('E2', T('tell'), 'COCKPIT', (s) => ({ ...pov(-2.6, 2.7, 2.4 - s.lt * 0.3, 0.3, 2.2, -12, 64), hands: false }));

  shot('G1b', T('monster'), 'GALAXY', (s) => { const k = ease(s.p); showRoute(0); return { ...pov(lerp(200, 60, k), lerp(120, 30, k), lerp(240, 90, k), 0, 0, 0, 55), hands: false }; });
  shot('F2b', T('loop'), 'BH', (s) => { resetFaller(); const m = photons.meshes[0].m; m.visible = true; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2 + s.t * 2.2; photons.place(i, { x: Math.cos(a) * 3.0, y: Math.sin(a) * 0.4, z: Math.sin(a) * 3.0, ry: -a }); } photons.done(); return orbitBH(7 - s.lt * 0.3, 1.2 + s.lt * 0.2, 0.8, -0.6, 60); });
  shot('O3', T('they', 1), 'STATION', (s) => { farFaller.root.visible = true; farFaller.root.position.set(-3, 22, -138); farFaller.root.rotation.set(0.4, 0.5, 0.2); farFaller.root.traverse((o) => { if (o.isMesh) { if (!o.userData.r) { o.userData.r = 1; o.material = o.material.clone(); } o.material.color.set('#ff3a20'); o.material.emissive = new THREE.Color('#ff2a10'); o.material.emissiveIntensity = 0.5; } }); return { ...pov(1.5, 2.2, 0.4 - s.lt * 0.2, -1.2, 9, -80, 44), hands: false }; });
  shot('K1b', T('scientists'), 'SMALL', (s) => { stretch(s.t); return orbitBH(5.4 - s.lt * 0.2, 0.9 + s.lt * 0.1, 2.0, 1.6, 58); });
  shot('K3', T('now', 2), 'BH', (s) => { resetFaller(); return { ...pov(0, 0.6, 3.4 - s.lt * 0.3, 0, -0.4, 0, 70), hands: false }; }, null, { helmet: true });
  shot('I1b', T('not'), 'INSIDE', (s) => ({ ...pov(1.2, 0.8, -10 - s.lt * 7, 0, 0, -110, 62), hands: false }), null, { helmet: true });
  shot('I2b', T('thirteen'), 'INSIDE', (s) => ({ ...pov(0, 0, -40 - s.lt * 12, 0, 0, -150, 76), hands: false }), null, { helmet: true });

  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, wipes: [], end: A.duration };
};

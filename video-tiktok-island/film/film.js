/* "FLIGHT 417" — Part 1. Original survival mini-series, ends on a dilemma (comment A or B).
 * Cast (glTF, mixamo rigs, clips shared between them): Dad = Soldier.glb, Emma = HVGirl.glb, Grace = Michelle.glb,
 * Pilot = Xbot.glb (navy). Props are procedural + Poly Haven CC0 (fern, shrub, boulder). HDRIs from Poly Haven.
 */
window.FILM_ASSETS = {
  models: [['dad', 'hq/assets/Soldier.glb'], ['emma', 'hq/assets/HVGirl.glb'], ['grace', 'hq/assets/Michelle.glb'], ['xbot', 'hq/assets/Xbot.glb'],
    ['fern', 'hq/assets/fern_02/fern_02_1k.gltf'], ['shrub', 'hq/assets/shrub_01/shrub_01_1k.gltf'], ['boulder', 'hq/assets/namaqualand_boulder_02/namaqualand_boulder_02_1k.gltf']],
  hdr: [['night', 'hq/assets/dikhololo_night.hdr'], ['dawn', 'hq/assets/spruit_sunrise.hdr']],
};
window.buildFilm = (A) => {
  const { THREE, X, W, H, clamp, lerp, ease, easeOut, smooth, hash, ev, ASSETS, instance, LINES, camera } = A;
  const RB = X.RoundedBoxGeometry;
  const L = (i, edge = 's') => LINES[i - 1][edge];
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const add = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, ...o });
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const flameTex = canvasTex(128, 256, (g) => { const gr = g.createRadialGradient(64, 170, 4, 64, 150, 120); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.25, 'rgba(255,190,80,0.95)'); gr.addColorStop(0.6, 'rgba(255,90,20,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(64, 150, 50, 110, 0, 0, 6.3); g.fill(); });
  const glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,200,140,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const smokeTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(40,40,44,0.75)'); gr.addColorStop(1, 'rgba(40,40,44,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const sprite = (g, tex, color, s, pos, blend = true, op = 1) => { const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity: op, depthWrite: false, blending: blend ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false }); const sp = new THREE.Sprite(m); sp.scale.set(s[0], s[1], 1); sp.position.set(...pos); g.add(sp); return sp; };

  /* ─── shared animation clips (mixamo rigs): in-place (root position tracks removed) ─── */
  const inPlace = (clip, name, hipsRot = true) => { const c = clip.clone(); c.name = name; c.tracks = c.tracks.filter((tr) => !/Hips\.position$/.test(tr.name) && (hipsRot || !/Hips\.quaternion$/.test(tr.name))); return c; };
  const SRC = (k, n) => ASSETS.models[k].animations.find((a) => a.name === n);
  const CLIPS = { idle: inPlace(SRC('xbot', 'idle'), 'idle'), walk: inPlace(SRC('xbot', 'walk'), 'walk'), run: inPlace(SRC('xbot', 'run'), 'run'), sruns: inPlace(SRC('dad', 'Run'), 'sruns'), sidle: inPlace(SRC('dad', 'Idle'), 'sidle'), swalk: inPlace(SRC('dad', 'Walk'), 'swalk'), hidle: inPlace(SRC('emma', 'Idle'), 'hidle'), hwalk: inPlace(SRC('emma', 'Walking'), 'hwalk'),
    xidle: inPlace(SRC('xbot', 'idle'), 'xidle', false), xrun: inPlace(SRC('xbot', 'run'), 'xrun', false), xwalk: inPlace(SRC('xbot', 'walk'), 'xwalk', false), nidle: inPlace(SRC('dad', 'Idle'), 'nidle', false), nrun: inPlace(SRC('dad', 'Run'), 'nrun', false), nwalk: inPlace(SRC('dad', 'Walk'), 'nwalk', false) };
  const ADD = {}; ['sad_pose', 'agree', 'headShake', 'sneak_pose'].forEach((n) => { const c = SRC('xbot', n).clone(); THREE.AnimationUtils.makeClipAdditive(c); ADD[n] = c; });
  function actor(key, height, opt = {}) {
    const a = instance(key, opt); const r = a.root;
    Object.entries(CLIPS).forEach(([n, c]) => { a.actions[n] = a.mixer.clipAction(c); });
    Object.entries(ADD).forEach(([n, c]) => { const ac = a.mixer.clipAction(c); ac.blendMode = THREE.AdditiveAnimationBlendMode; a.actions[n] = ac; });
    r.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(r); const k = height / Math.max(0.01, bb.max.y - bb.min.y); r.scale.multiplyScalar(k);
    const wrap = new THREE.Group(); wrap.add(r); a.wrap = wrap; return a;
  }

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, extra) => { const group = new THREE.Group(); sets[name] = { group, ...extra }; return group; };
  const plight = (g, col, I, pos, dist = 12) => { const l = new THREE.PointLight(col, I, dist, 2); l.position.set(...pos); g.add(l); return l; };
  const spot = (g, col, I, pos, target, angle = 0.5, pen = 0.6, shadow = false) => { const l = new THREE.SpotLight(col, I, 80, angle, pen, 2); l.position.set(...pos); l.target.position.set(...target); g.add(l, l.target); if (shadow) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.radius = 3; l.shadow.bias = -0.0003; } return l; };

  // CABIN — night, turbulence, masks drop
  let cDad, cEmma, masks = [], cFlash = [], cabinLights = [], emLights = [];
  {
    const g = mk('CABIN', { env: 'night', envI: 0.15, bg: '#05060a', fog: ['#0b0c12', 6, 22], exposure: 1.0, bloom: 0.3 });
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 40, 48, 1, true), std({ color: '#e7e2d6', roughness: 0.7, side: THREE.BackSide })); shell.rotation.x = Math.PI / 2; shell.position.set(0, 1.1, -12); g.add(shell);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 40), std({ color: '#34405a', roughness: 0.95 })); floor.position.set(0, -0.05, -12); floor.receiveShadow = true; g.add(floor);
    const aisle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.012, 40), std({ color: '#4a3a5a', roughness: 0.9 })); aisle.position.set(0, 0.006, -12); g.add(aisle);
    const seatBack = new RB(0.5, 0.78, 0.13, 3, 0.05), cushion = new RB(0.5, 0.13, 0.5, 3, 0.05), head = new RB(0.46, 0.22, 0.14, 2, 0.04);
    const fab = std({ color: '#2a3c66', roughness: 0.92 }), cover = std({ color: '#eef0f2', roughness: 0.8 });
    for (let z = 3; z > -26; z -= 0.86) for (const x of [-1.32, -0.8, 0.8, 1.32]) {
      const b = new THREE.Mesh(seatBack, fab); b.position.set(x, 0.85, z - 0.2); b.rotation.x = -0.12; b.castShadow = b.receiveShadow = true; g.add(b);
      const c = new THREE.Mesh(cushion, fab); c.position.set(x, 0.45, z + 0.08); c.castShadow = c.receiveShadow = true; g.add(c);
      const h = new THREE.Mesh(head, cover); h.position.set(x, 1.17, z - 0.24); h.rotation.x = -0.12; g.add(h);
      if (hash(z * 7 + x) > 0.45 && !(Math.abs(z + 2.16) < 0.3 && x < 0)) { const hd = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), std({ color: ['#3a2a20', '#1f1b1b', '#c9a46a', '#6a4630'][Math.floor(hash(z + x) * 4)], roughness: 0.8 })); hd.position.set(x, 1.32, z - 0.05); g.add(hd); }
    }
    for (const sd of [-1, 1]) { const bin = new THREE.Mesh(new RB(0.9, 0.42, 40, 3, 0.06), std({ color: '#f2f0ea', roughness: 0.5 })); bin.position.set(sd * 1.35, 2.05, -12); g.add(bin); const strip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 40), new THREE.MeshBasicMaterial({ color: '#ffe6c0' })); strip.position.set(sd * 0.85, 2.3, -12); g.add(strip); }
    for (let z = 3; z > -26; z -= 0.86) for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.32), std({ color: '#0a0f1e', emissive: '#9fb8ff', emissiveIntensity: 0, roughness: 0.2 })); w.position.set(sd * 2.0, 1.25, z); w.rotation.y = -sd * Math.PI / 2; g.add(w); cFlash.push(w); }
    for (let z = 2; z > -24; z -= 4) { cabinLights.push(plight(g, 0xffe2b0, 2.5, [0, 2.2, z], 6)); emLights.push(plight(g, 0xff2a20, 0, [0, 0.2, z - 1], 5)); }
    const lightning = plight(g, 0xb8ccff, 0, [-2.6, 1.5, -2], 14); cFlash.push(lightning);
    for (let k = 0; k < 8; k++) { const m = new THREE.Group(); const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.07, 16), std({ color: '#f1c40f', roughness: 0.5 })); cup.position.y = -0.5; const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 6), std({ color: '#d8dde6' })); tube.position.y = -0.25; m.add(cup, tube); m.position.set(k % 2 ? -0.75 : -1.25, 1.85, -1.6 - Math.floor(k / 2) * 0.86 + 0.86); g.add(m); masks.push(m); }
    cEmma = actor('emma', 1.62); cEmma.wrap.position.set(-1.32, -0.5, -2.08); g.add(cEmma.wrap);
    cDad = actor('dad', 1.83); cDad.wrap.position.set(-0.8, -0.56, -2.08); g.add(cDad.wrap);
    sets.CABIN.update = (s) => {
      const t = s.t, br = L(1);
      const f = Math.pow(Math.max(0, Math.sin(t * 9.1) * Math.sin(t * 3.3 + 1) * Math.sin(t * 1.7)), 6);
      cFlash.forEach((w) => { if (w.isLight) w.intensity = f * 120; else w.material.emissiveIntensity = f * 3; });
      const alarm = t > br - 0.6; cabinLights.forEach((l, i) => (l.intensity = alarm ? (Math.sin(t * 20 + i) > 0.6 ? 0.2 : 1.6) : 2.5)); emLights.forEach((l) => (l.intensity = alarm ? 3 + 3 * Math.abs(Math.sin(t * 5)) : 0));
      masks.forEach((m, i) => { const k = clamp((t - br + 0.4 - i * 0.05) / 0.35); m.position.y = lerp(1.85 + 0.6, 1.85, easeOut(k)); m.visible = k > 0; m.rotation.z = Math.sin(t * 6 + i) * 0.25 * k; m.rotation.x = Math.cos(t * 5 + i) * 0.2 * k; });
      cEmma.act([['hidle', 1, t * 1.6]]); cDad.act([['sidle', 1, t * 1.4 + 2]]);
      cDad.wrap.rotation.y = -0.15; cEmma.wrap.rotation.y = 0.2;
    };
  }

  // SKY — the plane dives into the storm
  let plane, engFire, rain;
  {
    const g = mk('SKY', { env: 'night', envI: 0.25, bg: '#04060b', fog: ['#070a12', 20, 160], exposure: 1.1, bloom: 0.5 });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000, 1, 1), std({ color: '#0a1624', roughness: 0.15, metalness: 0.4 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -40; g.add(sea);
    plane = new THREE.Group(); g.add(plane);
    const white = std({ color: '#eef1f4', roughness: 0.35, metalness: 0.2 });
    const fus = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 22, 8, 24), white); fus.rotation.x = Math.PI / 2; plane.add(fus);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 22, 24, 1, true, Math.PI * 0.4, Math.PI * 0.2), std({ color: '#1f4a8a', side: THREE.DoubleSide })); stripe.rotation.x = Math.PI / 2; plane.add(stripe);
    for (const sd of [-1, 1]) { const w = new THREE.Mesh(new RB(13, 0.3, 3.6, 2, 0.12), white); w.position.set(sd * 7.5, -0.6, 0.5); w.rotation.y = sd * 0.3; plane.add(w); const en = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 3, 16), std({ color: '#c9ced4', metalness: 0.6, roughness: 0.3 })); en.rotation.x = Math.PI / 2; en.position.set(sd * 5, -1.3, -0.2); plane.add(en); }
    const fin = new THREE.Mesh(new RB(0.3, 4.5, 3.4, 2, 0.1), white); fin.position.set(0, 2.6, 11.5); fin.rotation.x = 0.4; plane.add(fin);
    for (const sd of [-1, 1]) { const tw = new THREE.Mesh(new RB(5, 0.2, 1.8, 2, 0.08), white); tw.position.set(sd * 2.6, 0.8, 11.8); plane.add(tw); }
    for (let k = 0; k < 18; k++) for (const sd of [-1, 1]) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.32), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); wdw.position.set(sd * 1.48, 0.35, -8 + k * 0.9); wdw.rotation.y = sd * Math.PI / 2; plane.add(wdw); }
    engFire = sprite(plane, flameTex, '#ffa040', [2.2, 5], [5, -1.3, 2.5]); const engL = plight(plane, 0xff8030, 60, [5, -1.0, 2], 20);
    rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 1.4, 0.02), new THREE.MeshBasicMaterial({ color: '#8fa0c0', transparent: true, opacity: 0.35 }), 800); rain.frustumCulled = false; g.add(rain);
    const lightning = new THREE.DirectionalLight(0xc8d8ff, 0); lightning.position.set(-30, 60, -20); g.add(lightning);
    sets.SKY.update = (s) => {
      const t = s.t, k = clamp(s.lt / 2.4);
      plane.position.set(0, 30 - k * k * 60, -k * 80); plane.rotation.set(0.25 + k * 0.5, 0, Math.sin(t * 6) * 0.08 + k * 0.4);
      engFire.scale.set(2.2 + Math.sin(t * 40) * 0.4, 5 + Math.sin(t * 33) * 1, 1); engL.intensity = 50 + Math.sin(t * 30) * 20;
      lightning.intensity = Math.pow(Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 2.1)), 8) * 8;
      const M = new THREE.Matrix4(); for (let i = 0; i < 800; i++) { const x = (hash(i) - 0.5) * 80, z = plane.position.z + (hash(i * 3) - 0.5) * 80, y = plane.position.y + 20 - ((t * 40 + hash(i * 7) * 60) % 60); M.makeRotationX(0.3); M.setPosition(x, y, z); rain.setMatrixAt(i, M); } rain.instanceMatrix.needsUpdate = true;
    };
  }

  // shared nature helpers
  function palm(g, x, z, h = 7, lean = 0.2, rot = 0) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = rot; g.add(p);
    const bark = std({ color: '#7a6248', roughness: 0.95 }); let px = 0, py = 0;
    for (let k = 0; k < 9; k++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.16 - k * 0.008, 0.19 - k * 0.008, h / 9, 10), bark); const a = lean * (k / 9) * (k / 9) * 3; px += Math.sin(a) * h / 9; py += Math.cos(a) * h / 9; seg.position.set(px, py - h / 18, 0); seg.rotation.z = -a; seg.castShadow = true; p.add(seg); }
    const leaf = std({ color: '#2f5a2a', roughness: 0.8, side: THREE.DoubleSide });
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3.2, 1, 6), leaf); const pos = lf.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setZ(i, -Math.pow((y + 1.6) / 3.2, 2) * 1.1); } lf.geometry.computeVertexNormals(); lf.geometry.translate(0, 1.6, 0); lf.position.set(px, py, 0); lf.rotation.set(-1.1, a, 0, 'YXZ'); lf.castShadow = true; p.add(lf); }
    return p;
  }

  // BEACH — night, the wreck burning, explosion
  let bDad, bEmma, bGrace, flames = [], fireLights = [], smokes = [], boom, boomL, sea, beam, embers;
  {
    const g = mk('BEACH', { env: 'night', envI: 0.5, bg: 'hdr', bgI: 0.5, bgBlur: 0.05, fog: ['#0b1220', 30, 140], exposure: 0.95, bloom: 0.2 });
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 80, 80), std({ color: '#8f8068', roughness: 1 })); { const p = sand.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (hash(i * 1.3) - 0.5) * 0.15 + Math.sin(p.getX(i) * 0.08) * 0.3); sand.geometry.computeVertexNormals(); } sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; g.add(sand);
    sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 300, 120, 60), std({ color: '#0d2236', roughness: 0.08, metalness: 0.3 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.05, -175); g.add(sea);
    // the wreck: broken fuselage + wing
    const hull = std({ color: '#cfd4da', roughness: 0.45, metalness: 0.3 }), burnt = std({ color: '#2a2622', roughness: 0.9 });
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 12, 28, 1, true, 0, Math.PI * 1.6), hull); fus.material.side = THREE.DoubleSide; fus.rotation.set(Math.PI / 2, 0.4, 0.25); fus.position.set(-3, 1.4, -18); fus.castShadow = fus.receiveShadow = true; g.add(fus);
    const tail = new THREE.Mesh(new RB(0.35, 5, 4, 2, 0.1), hull); tail.position.set(-6, 3, -24); tail.rotation.set(0.5, 0.4, 0.3); tail.castShadow = true; g.add(tail);
    const wing = new THREE.Mesh(new RB(10, 0.35, 3.4, 2, 0.12), burnt); wing.position.set(4, 0.6, -15); wing.rotation.set(0.1, -0.6, 0.15); wing.castShadow = wing.receiveShadow = true; g.add(wing);
    for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.2 + hash(i) * 0.9, 0.05, 0.2 + hash(i * 2) * 0.7), i % 3 ? hull : burnt); d.position.set((hash(i * 3) - 0.5) * 20, 0.05, -10 - hash(i * 5) * 16); d.rotation.set(0, hash(i) * 6, (hash(i * 7) - 0.5) * 0.5); d.castShadow = true; g.add(d); }
    for (let i = 0; i < 26; i++) { const f = sprite(g, flameTex, '#ff9a50', [1.5, 3], [-5 + hash(i) * 10, 1.2, -16 - hash(i * 2) * 6], true, 0.55); f.userData = { x: f.position.x, z: f.position.z, ph: hash(i * 9) * 10, s: 0.8 + hash(i * 4) * 1.4 }; flames.push(f); }
    for (let i = 0; i < 3; i++) fireLights.push(plight(g, 0xff7a2a, 40, [-3 + i * 3, 2, -15], 40));
    for (let i = 0; i < 18; i++) { const s = sprite(g, smokeTex, '#ffffff', [6, 6], [0, 5, -18], false, 0.6); s.userData.ph = hash(i * 13) * 10; smokes.push(s); }
    embers = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(600 * 3), 3)), new THREE.PointsMaterial({ color: '#ffb060', size: 3, sizeAttenuation: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(embers);
    boom = sprite(g, glowTex, '#ffb060', [1, 1], [-3, 3, -18]); boom.visible = false; boomL = plight(g, 0xffa050, 0, [-3, 4, -14], 80);
    [[-14, -6, 8, 0.3], [-11, -10, 7, -0.25], [12, -8, 9, 0.35], [15, -14, 7, -0.2], [-18, -22, 9, 0.2], [20, -26, 8, -0.3], [9, 4, 6, 0.4]].forEach(([x, z, h, l], i) => palm(g, x, z, h, l, hash(i) * 6));
    const moon = sprite(g, glowTex, '#c8d8ff', [30, 30], [-60, 70, -260], true, 0.6);
    bDad = actor('dad', 1.83); g.add(bDad.wrap); bEmma = actor('emma', 1.62); g.add(bEmma.wrap); bGrace = actor('grace', 1.68); g.add(bGrace.wrap);
    beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 9, 24, 1, true), add({ color: '#fff4d8', opacity: 0.12, side: THREE.DoubleSide })); beam.geometry.translate(0, -4.5, 0); g.add(beam);
    const torch = new THREE.SpotLight(0xfff4d8, 60, 30, 0.25, 0.5, 2); g.add(torch, torch.target); beam.userData.torch = torch;
    sets.BEACH.update = (s) => {
      const t = s.t, bt = L(7, 'e') + 0.5; // explosion
      const pos = sea.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, Math.sin(x * 0.12 + t * 1.3) * 0.25 + Math.sin(y * 0.2 - t * 1.7) * 0.2); } pos.needsUpdate = true; sea.geometry.computeVertexNormals();
      const big = t > bt ? 1 + 1.5 * Math.exp(-(t - bt) * 0.8) : 1;
      flames.forEach((f) => { const u = f.userData, fl = 0.75 + 0.25 * Math.sin(t * 14 + u.ph) + 0.15 * Math.sin(t * 23 + u.ph * 2); f.scale.set(0.9 * u.s * Math.min(big, 1.6), 2.0 * u.s * fl * Math.min(big, 1.6), 1); f.position.y = 1.0 + 1.1 * u.s * fl * big; });
      fireLights.forEach((l, i) => (l.intensity = (40 + 18 * Math.sin(t * 17 + i * 2) * Math.sin(t * 7 + i)) * big));
      smokes.forEach((sm, i) => { const k = ((t * 0.25 + sm.userData.ph) % 1); sm.position.set(-3 + Math.sin(i) * 2 + k * 6, 3 + k * 16, -18 - k * 4); const sc = 4 + k * 12; sm.scale.set(sc, sc, 1); sm.material.opacity = 0.55 * (1 - k); });
      const ep = embers.geometry.attributes.position; for (let i = 0; i < 600; i++) { const k = (t * 0.4 + hash(i)) % 1; ep.setXYZ(i, -4 + hash(i * 3) * 8 + Math.sin(t + i) * k * 2, 1 + k * 12, -16 - hash(i * 5) * 6); } ep.needsUpdate = true;
      const bk = t - bt; boom.visible = bk > 0 && bk < 2.5; if (boom.visible) { const sc = 4 + easeOut(bk / 0.6) * 22; boom.scale.set(sc, sc, 1); boom.material.opacity = 0.8 * (1 - smooth(bk / 2.0)); } boomL.intensity = bk > 0 ? 600 * Math.exp(-bk * 3) : 0;
      // actors
      const t4 = L(5), t6 = L(7);
      if (t < t6) { bDad.wrap.position.set(2.5, 0, -6); bDad.wrap.rotation.y = -0.6 + Math.sin(t * 2) * 0.4; bDad.act([['sidle', 1, t]]); bEmma.wrap.position.set(-1.5, 0, -10); bEmma.wrap.rotation.y = 0.8; bEmma.act([['hidle', 1, t]]); }
      else { const k = t - t6; bDad.wrap.position.set(lerp(1.2, 0.8, clamp(k / 4)), 0, -9 + k * 4.2); bDad.wrap.rotation.y = 0; bDad.act([['sruns', 1, t * 1.05]]); bEmma.wrap.position.set(-0.8, 0, -9.6 + k * 4.0); bEmma.wrap.rotation.y = 0; bEmma.act([['hwalk', 1, t * 2.0]]); }
      bGrace.wrap.position.set(6, 0, 12); bGrace.wrap.rotation.y = Math.PI - 0.4; bGrace.act([['nidle', 1, t]]);
      // her flashlight
      const hand = new THREE.Vector3(5.75, 1.25, 11.6); beam.position.copy(hand); beam.lookAt(0 + Math.sin(t * 3) * 1.5, 0, 0); beam.rotateX(-Math.PI / 2); beam.userData.torch.position.copy(hand); beam.userData.torch.target.position.set(Math.sin(t * 3) * 1.5, 0, 0);
    };
  }

  function captainHat(a) { let head = null; a.root.traverse((o) => { if (o.isBone && /Head$/.test(o.name)) head = o; }); if (!head) return; const hat = new THREE.Group(); const k = 1 / a.root.scale.x; const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.07, 20), std({ color: '#1b2438', roughness: 0.6 })); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 20, 1, false, -0.9, 1.8), std({ color: '#0e121c', roughness: 0.3 })); brim.position.set(0, -0.03, 0.03); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.018, 20), std({ color: '#d8b25a', metalness: 1, roughness: 0.3 })); band.position.y = -0.02; hat.add(crown, brim, band); a.root.updateMatrixWorld(true); const ws = new THREE.Vector3(); head.getWorldScale(ws); const kk = 1 / ws.x; hat.scale.setScalar(kk); hat.position.set(0, 0.16 * kk, 0.01 * kk); head.add(hat); }
  function lie(g, a, pos, yaw) { const o = new THREE.Group(); o.position.set(...pos); o.rotation.y = yaw; a.wrap.rotation.set(Math.PI / 2, Math.PI, 0); o.add(a.wrap); g.add(o); return o; }
  // JUNGLE — dawn, the pilot pinned under a wing section
  let jDad, jGrace, jPilot, jWing;
  {
    const g = mk('JUNGLE', { env: 'dawn', envI: 0.5, bg: 'hdr', bgI: 0.6, bgBlur: 0.25, fog: ['#a8a088', 6, 45], exposure: 0.9, bloom: 0.25 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 60, 60), std({ color: '#4a3e2a', roughness: 1 })); { const p = ground.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (hash(i * 2.1) - 0.5) * 0.3); ground.geometry.computeVertexNormals(); } ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
    const sun = new THREE.DirectionalLight(0xffd8a0, 2.6); sun.position.set(-20, 18, -30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 100 }); g.add(sun);
    for (let i = 0; i < 70; i++) { const f = instance(i % 3 ? 'fern' : 'shrub'); const a = hash(i * 3.3) * Math.PI * 2, r = 3.4 + hash(i * 1.7) * 14; f.root.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 2); f.root.rotation.y = hash(i) * 6; f.root.scale.setScalar(1.5 + hash(i * 9) * 2); g.add(f.root); }
    [[-5, -6, 9, 0.2], [4, -9, 10, -0.3], [-8, 2, 8, 0.3], [7, 1, 9, -0.2], [-2, -14, 11, 0.1], [10, -12, 9, 0.35]].forEach(([x, z, h, l], i) => palm(g, x, z, h, l, hash(i + 4) * 6));
    const bd = instance('boulder'); bd.root.position.set(3, 0, -4); bd.root.scale.setScalar(2.2); g.add(bd.root);
    for (let k = 0; k < 5; k++) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 30), add({ color: '#ffe6b0', opacity: 0.06, side: THREE.DoubleSide })); sh.position.set(-4 + k * 2.5, 10, -6); sh.rotation.set(0, 0.4, 0.55); g.add(sh); }
    jWing = new THREE.Group(); jWing.position.set(0.9, 0.28, -0.75); g.add(jWing); { const w = new THREE.Mesh(new RB(4.2, 0.22, 1.8, 2, 0.08), std({ color: '#c9ced4', roughness: 0.5, metalness: 0.4 })); w.position.set(-2.0, 0, 0); w.castShadow = w.receiveShadow = true; jWing.add(w); const st = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.05, 0.25), std({ color: '#1f4a8a' })); st.position.set(-2.0, 0.12, 0.5); jWing.add(st); }
    jPilot = actor('xbot', 1.8, { tint: '#6d7c9c' }); captainHat(jPilot); jPilot.wrap.position.set(-0.7, -0.62, -1.1); jPilot.wrap.rotation.y = 0.55; g.add(jPilot.wrap);
    jDad = actor('dad', 1.83); g.add(jDad.wrap); jGrace = actor('grace', 1.68); g.add(jGrace.wrap);
    sets.JUNGLE.update = (s) => {
      const t = s.t, lift = easeOut(clamp((t - (L(13, 'e') - 0.35)) / 0.8));
      jWing.rotation.z = lift * 0.9; jPilot.act([['idle', 1, t * 0.3], ['sad_pose', 1, 0.5]]);
      const walking = t < L(11); jDad.wrap.position.set(walking ? -3 + (t - L(10)) * 0.7 : -1.6, 0, walking ? 3 - (t - L(10)) * 0.9 : -1.6); jDad.wrap.rotation.y = walking ? 2.6 : 1.4; jDad.act(walking ? [['swalk', 1, t]] : [['sidle', 1, t]]);
      jGrace.wrap.position.set(walking ? -1.5 + (t - L(10)) * 0.6 : -2.2, 0, walking ? 2 - (t - L(10)) * 0.8 : -0.2); jGrace.wrap.rotation.y = walking ? 2.6 : 1.9; jGrace.act(walking ? [['nwalk', 1, t + 0.4]] : [['nidle', 1, t]]);
    };
  }

  // CAVE — night, campfire, two bottles of water
  let kDad, kEmma, kGrace, kPilot, kFire = [], kLight, bottles = [];
  {
    const g = mk('CAVE', { env: 'night', envI: 0.25, bg: '#030305', fog: ['#070505', 5, 18], exposure: 1.0, bloom: 0.15 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 40, 40), std({ color: '#3a3430', roughness: 1 })); { const p = ground.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (hash(i * 3.1) - 0.5) * 0.12); ground.geometry.computeVertexNormals(); } ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
    for (let i = 0; i < 30; i++) { const b = instance('boulder'); const lay = i % 2, a = Math.PI * 0.9 + (i / 29) * Math.PI * 1.2, r = 5.6 + hash(i) * 0.8 - lay * 0.4; b.root.position.set(Math.cos(a) * r, -0.2 + lay * 1.3, Math.sin(a) * r); b.root.rotation.set(0, a + Math.PI / 2 + (hash(i * 3) - 0.5) * 0.6, (hash(i * 5) - 0.5) * 0.3); b.root.scale.setScalar(1.6 + hash(i * 7) * 0.8); g.add(b.root); }
    const roof = new THREE.Mesh(new THREE.SphereGeometry(7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#2a2420', roughness: 1, side: THREE.BackSide })); roof.position.y = -0.5; g.add(roof);
    for (let k = 0; k < 6; k++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 8), std({ color: '#3a2618', roughness: 1 })); lg.rotation.set(Math.PI / 2 - 0.3, k / 6 * Math.PI * 2, 0); lg.position.set(Math.cos(k) * 0.15, 0.12, Math.sin(k) * 0.15); g.add(lg); }
    for (let i = 0; i < 9; i++) { const f = sprite(g, flameTex, '#ffb070', [0.4, 0.8], [(hash(i) - 0.5) * 0.3, 0.4, (hash(i * 2) - 0.5) * 0.3], true, 0.7); f.userData.ph = hash(i * 5) * 10; kFire.push(f); }
    kLight = plight(g, 0xff8a3a, 35, [0, 0.8, 0], 14); plight(g, 0x5a6aa0, 4, [0, 3, 3], 12); kLight.castShadow = true; kLight.shadow.mapSize.set(1024, 1024); kLight.shadow.bias = -0.002;
    const glass = new THREE.MeshPhysicalMaterial({ color: '#d8f0ff', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.55, thickness: 0.1 });
    for (let k = 0; k < 2; k++) { const b = new THREE.Group(); b.position.set(-0.9 + k * 0.16, 0, 0.9); const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 20), glass); shell.position.y = 0.12; const water = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.16, 20), std({ color: '#5aa8d8', roughness: 0.1, transparent: true, opacity: 0.8 })); water.position.y = 0.08; const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12), std({ color: '#2c6fb0' })); cap.position.y = 0.255; const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.07, 20, 1, true), std({ color: '#2c6fb0', side: THREE.DoubleSide })); lab.position.y = 0.12; b.add(shell, water, cap, lab); g.add(b); bottles.push(b); }
    const beacon = new THREE.Group(); beacon.position.set(1.2, 0, 0.9); g.add(beacon); { const bx = new THREE.Mesh(new RB(0.32, 0.16, 0.2, 2, 0.02), std({ color: '#e2572c', roughness: 0.4 })); bx.position.y = 0.08; const an = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 6), std({ color: '#2b2f36' })); an.position.set(0.1, 0.36, 0); const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3020' })); led.position.set(-0.08, 0.17, 0.1); beacon.add(bx, an, led); beacon.userData.led = led; }
    kPilot = actor('xbot', 1.8, { tint: '#6d7c9c' }); captainHat(kPilot); kPilot.wrap.position.set(1.75, -0.62, 0.35); kPilot.wrap.rotation.y = -1.9; g.add(kPilot.wrap);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12), std({ color: '#d8d0c0', roughness: 0.9 })); band.visible = false; band.position.set(2.25, 0.18, 0.5); band.rotation.z = Math.PI / 2; band.rotation.y = 0.5; g.add(band); const blood = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), std({ color: '#8a1a1a', roughness: 0.6 })); blood.visible = false; blood.position.set(2.25, 0.26, 0.5); blood.scale.set(1.3, 0.3, 1); g.add(blood);
    kDad = actor('dad', 1.83); kDad.wrap.position.set(0.9, -0.55, 1.5); kDad.wrap.rotation.y = -2.4; g.add(kDad.wrap);
    kEmma = actor('emma', 1.62); kEmma.wrap.position.set(-1.0, -0.55, -0.6); kEmma.wrap.rotation.y = 0.9; g.add(kEmma.wrap);
    kGrace = actor('grace', 1.68); kGrace.wrap.position.set(-1.2, -0.6, 1.1); kGrace.wrap.rotation.y = 2.2; g.add(kGrace.wrap);
    sets.CAVE.update = (s) => {
      const t = s.t;
      kFire.forEach((f, i) => { const fl = 0.7 + 0.3 * Math.sin(t * 15 + f.userData.ph) + 0.15 * Math.sin(t * 27 + i); f.scale.set(0.35 * fl, 0.75 * fl, 1); f.position.y = 0.22 + 0.32 * fl; });
      kLight.intensity = 32 + 9 * Math.sin(t * 13) * Math.sin(t * 7.7);
      kDad.act([['sidle', 1, t]]); kEmma.act([['hidle', 1, t + 1]]); kGrace.act([['nidle', 1, t + 2]]); kPilot.act([['idle', 1, t * 0.3], ['sad_pose', 1, 0.5]]);
      bottles.forEach((b, i) => { b.rotation.y = 0.3 + i; }); const led = s.t % 1.2 < 0.15; const bc = sets.CAVE.group.children.find((c) => c.userData && c.userData.led); if (bc) bc.userData.led.visible = led;
    };
  }

  /* ─── HUD + captions (series look) ─── */
  const COL = { DAD: '#7fb0ff', EMMA: '#ffd23f', GRACE: '#7ee0c0', PILOT: '#ff9a6a', CAPTAIN: '#ff6a5a', NARRATOR: '#ffffff' };
  const KEY = { brace: '#ff5a4a', impact: '#ff5a4a', emma: '#ffd23f', run: '#ff5a4a', trapped: '#ff5a4a', water: '#7fd8ff', infected: '#ff5a4a', beacon: '#ffd23f', thirsty: '#7fd8ff', nobody: '#ff5a4a', daughter: '#ffd23f', home: '#7fd8ff', a: '#ffd23f', b: '#ffd23f', plane: '#ff5a4a', leg: '#ff5a4a', three: '#ffd23f', hurt: '#ff5a4a', dad: '#7fb0ff' };
  function pill(g, x, y, text, opt = {}) { g.save(); g.font = `700 ${opt.size || 22}px Inter`; g.letterSpacing = '2px'; const w = g.measureText(text).width + 36; g.fillStyle = opt.bg || 'rgba(10,12,18,0.62)'; g.beginPath(); g.roundRect(x - (opt.align === 'center' ? w / 2 : 0), y - 30, w, 44, 10); g.fill(); if (opt.border) { g.strokeStyle = opt.border; g.lineWidth = 3; g.stroke(); } g.fillStyle = opt.color || '#ffffff'; g.textAlign = opt.align === 'center' ? 'center' : 'left'; g.fillText(text, x + (opt.align === 'center' ? 0 : 18), y); g.restore(); }
  const where = (t) => t < L(5) - 0.2 ? 'FLIGHT 417 • 21:14 • OVER THE PACIFIC' : t < L(10) ? 'DAY 1 • 05:52 • UNKNOWN ISLAND' : t < L(15) - 0.2 ? 'DAY 1 • 06:40 • JUNGLE' : 'DAY 2 • 21:30 • CAVE';
  function hud(g, s) {
    const t = s.t; if (t >= L(23) - 0.2) return endCard(g, t);
    pill(g, 60, 250, where(t)); pill(g, 940, 250, 'PART 1', { color: '#ff5a4a', border: '#ff5a4a', bg: 'rgba(10,12,18,0.4)', align: 'center' });
    let badge = null;
    if (t < L(5) - 0.2) badge = `⚠ ALTITUDE ${Math.max(0, Math.round(9800 - Math.max(0, t - L(1) + 1.5) * 1350)).toLocaleString('en-US')} FT`;
    else if (t < L(7, 'e') + 0.5) badge = `⚠ FIRE • ${Math.max(4, Math.round(18 - (t - L(5)) * 2))} M`;
    else if (t >= L(15) - 0.2) badge = '⚠ WATER • 2 BOTTLES';
    if (badge) pill(g, 540, 330, badge, { align: 'center', bg: 'rgba(160,20,20,0.85)', border: '#ff6a5a', size: 26 });
    ev('hit', L(1)); ev('whoosh', L(4, 'e') + 0.6); ev('hit', L(7, 'e') + 0.5); ev('ding', L(17));
    // crash flash
    const ct = L(4, 'e') + 1.4; if (t > ct - 0.1 && t < L(5) - 0.05) { const k = t < ct ? (t - ct + 0.1) / 0.1 : 1 - (t - ct) / (L(5) - 0.05 - ct); g.fillStyle = `rgba(255,255,255,${clamp(k)})`; g.fillRect(0, 0, W, H); if (t > ct + 0.25) { g.fillStyle = `rgba(0,0,0,${clamp((t - ct - 0.25) / 0.3)})`; g.fillRect(0, 0, W, H); } }
    const bt = L(7, 'e') + 0.5; if (t > bt && t < bt + 0.35) { g.fillStyle = `rgba(255,220,180,${0.8 * (1 - (t - bt) / 0.35)})`; g.fillRect(0, 0, W, H); }
  }
  function endCard(g, t) {
    const k = easeOut((t - L(23) + 0.2) / 0.5); g.fillStyle = `rgba(4,4,6,${0.82 * k})`; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = k; g.textAlign = 'center';
    g.font = '700 24px Inter'; g.letterSpacing = '6px'; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText('FLIGHT 417 · PART 1', W / 2, 360);
    g.letterSpacing = '0px'; g.font = '900 64px Inter'; g.fillStyle = '#ffffff'; g.fillText('YOUR DAUGHTER,', W / 2, 470); g.fillText('OR THE ONLY MAN', W / 2, 545); g.fillText('WHO CAN GET YOU', W / 2, 620); g.fillStyle = '#7fd8ff'; g.fillText('HOME?', W / 2, 695);
    const opt = (y, l, txt, c) => { g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.roundRect(120, y - 62, 840, 96, 16); g.fill(); g.strokeStyle = c; g.lineWidth = 3; g.stroke(); g.textAlign = 'left'; g.font = '900 52px Inter'; g.fillStyle = c; g.fillText(l, 160, y); g.font = '800 34px Inter'; g.fillStyle = '#ffffff'; g.fillText(txt, 230, y - 4); g.textAlign = 'center'; };
    opt(830, 'A', 'GIVE THE WATER TO THE PILOT', '#ffd23f'); opt(950, 'B', 'KEEP IT FOR EMMA', '#7fd8ff');
    g.font = '900 46px Inter'; g.fillStyle = '#ffffff'; g.fillText('COMMENT A OR B', W / 2, 1100);
    const f = clamp((t - L(23, 'e') + 0.1) / 0.3); if (f > 0) { g.globalAlpha = k * f; g.strokeStyle = '#ff4a3a'; g.lineWidth = 4; g.beginPath(); g.roundRect(230, 1150, 620, 110, 14); g.stroke(); g.fillStyle = '#ff4a3a'; g.font = '900 50px Inter'; g.fillText('FOLLOW FOR PART 2', W / 2, 1222); }
    g.restore();
  }
  function captions(g, t) {
    const li = LINES.findIndex((l) => t >= l.s - 0.05 && t < l.e + 0.35); if (li < 0 || LINES[li].speaker === 'NARRATOR') return;
    const ln = LINES[li], ws = A.WORDS.filter((w) => w.s >= ln.s - 0.01 && w.e <= ln.e + 0.01);
    g.save(); g.textAlign = 'center'; g.font = '700 24px Inter'; g.letterSpacing = '4px'; g.fillStyle = COL[ln.speaker]; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 10; g.fillText(ln.speaker === 'CAPTAIN' ? 'CAPTAIN (RADIO)' : ln.speaker, W / 2, 1268);
    g.letterSpacing = '0px'; const size = 58; g.font = `900 ${size}px Inter`;
    const shown = ws.filter((w) => t >= w.s - 0.04); const toks = shown.slice(-5); // rolling window of the last words (ref look)
    const txts = toks.map((w) => w.w.toUpperCase()); const sp = g.measureText(' ').width; const widths = txts.map((x) => g.measureText(x).width);
    let total = widths.reduce((a, b) => a + b, 0) + sp * Math.max(0, txts.length - 1); const sc = total > 900 ? 900 / total : 1; g.font = `900 ${size * sc}px Inter`;
    let x = W / 2 - total * sc / 2; g.textAlign = 'left';
    txts.forEach((tx, i) => { const key = tx.toLowerCase().replace(/[^a-z']/g, ''); g.fillStyle = KEY[key] || '#ffffff'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.strokeText(tx, x, 1340); g.fillText(tx, x, 1340); x += (widths[i] + sp) * sc; });
    g.restore();
  }

  /* ─── shots: handheld, always moving ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update, extra = {}) => shots.push({ id, t0, set, cam, update, ...extra });
  const shake = (t, a = 0.02) => [Math.sin(t * 13.1) * a + Math.sin(t * 5.3) * a * 0.6, Math.sin(t * 11.7 + 1) * a + Math.sin(t * 3.9) * a * 0.5, 0];
  const C = (pos, look, fov = 50, t = 0, amp = 0.02, extra = {}) => { const sh = shake(t, amp); return { pos: [pos[0] + sh[0], pos[1] + sh[1], pos[2]], look: [look[0] + sh[0] * 2, look[1] + sh[1] * 2, look[2]], fov, roll: Math.sin(t * 7.3) * amp * 0.6, ...extra }; };

  shot('C1', 0, 'CABIN', (s) => C([0.1, 1.6, -9 + s.lt * 0.5], [0, 1.15, 3], 55, s.t, 0.04, { aperture: 0.001 }));
  shot('C2', L(2) - 0.1, 'CABIN', (s) => C([-1.2, 1.18, -1.58], [-1.25, 0.92, -2.4], 64, s.t, 0.02, { aperture: 0.004 }));
  shot('C3', L(3), 'CABIN', (s) => C([-0.75, 1.2, -1.6], [-0.85, 0.95, -2.4], 64, s.t, 0.05, { aperture: 0.004 }), null, { blur: 3 });
  shot('X1', L(4) - 0.1, 'SKY', (s) => { const k = clamp(s.lt / 2.4), py = 30 - k * k * 60, pz = -k * 80; return C([16 - k * 6, py + 7 - k * 3, pz + 26 - k * 8], [0, py - 1, pz - 4], 52, s.t, 0.12); }, null, { blur: 3, blurSpan: 1 / 60 });
  shot('B1', L(5) - 0.05, 'BEACH', (s) => C([4.2, 1.6, -2.4 - s.lt * 0.2], [2.4, 1.4, -6.2], 44, s.t, 0.03, { aperture: 0.002 }));
  shot('B2', L(6), 'BEACH', (s) => C([0.6, 1.2, -6.4], [-1.5, 1.0, -10], 42, s.t, 0.03, { aperture: 0.002 }));
  shot('B3', L(7), 'BEACH', (s) => { const z = -9 + Math.max(0, s.t - L(7)) * 4.1; return C([0.2, 1.4, z + 3.2], [0.2, 1.3, z - 6], 52, s.t, 0.07); }, null, { blur: 3 });
  shot('B4', L(8) - 0.1, 'BEACH', (s) => C([3.5, 1.7, 15 - s.lt * 0.3], [6, 1.4, 12], 44, s.t, 0.03, { aperture: 0.002 }));
  shot('B5', L(9), 'BEACH', (s) => C([8, 1.7, 15], [3, 1.4, 6], 46, s.t, 0.025));
  shot('J1', L(10), 'JUNGLE', (s) => C([-4.5 + s.lt * 0.5, 1.6, 6 - s.lt * 0.6], [-1, 1.2, 0], 48, s.t, 0.04, { aperture: 0.0015 }), null, { blur: 2 });
  shot('J2', L(11), 'JUNGLE', (s) => C([0.5, 1.15, 0.9 - s.lt * 0.05], [-0.7, 1.0, -1.1], 40, s.t, 0.02, { aperture: 0.004 }));
  shot('J3', L(13), 'JUNGLE', (s) => C([1.8, 1.5, 2.6], [-1.0, 0.8, -1.0], 48, s.t, 0.05), null, { blur: 2 });
  shot('J2b', L(12), 'JUNGLE', (s) => C([-1.3, 1.05, 0.2 + s.lt * 0.04], [-0.7, 1.0, -1.1], 36, s.t, 0.015, { aperture: 0.005 }));
  shot('J4', L(14), 'JUNGLE', (s) => C([-3.2 + s.lt * 0.3, 1.5, 1.4], [-0.6, 0.6, -0.8], 44, s.t, 0.02, { aperture: 0.002 }));
  shot('K0', L(15) - 0.1, 'CAVE', (s) => C([0.3, 1.6 - s.lt * 0.1, 4.2 - s.lt * 0.2], [0, 0.5, 0], 52, s.t, 0.008, { aperture: 0.002 }));
  shot('K0b', L(16), 'CAVE', (s) => C([-0.15, 1.0, 0.35], [-1.2, 0.92, 1.1], 44, s.t, 0.01, { aperture: 0.003 }));
  shot('K1', L(17) - 0.1, 'CAVE', (s) => C([-0.7, 0.45, 1.6 - s.lt * 0.05], [-0.85, 0.14, 0.9], 34, s.t, 0.01, { aperture: 0.01 }));
  shot('K2', L(18), 'CAVE', (s) => C([0.1, 1.25, 2.9 - s.lt * 0.08], [1.4, 0.5, 0.6], 46, s.t, 0.015, { aperture: 0.002 }));
  shot('K3', L(19), 'CAVE', (s) => C([0.65, 1.1, 1.0], [1.75, 0.98, 0.35], 40, s.t, 0.012, { aperture: 0.004 }));
  shot('K4', L(20), 'CAVE', (s) => C([0.25, 0.95, -1.35], [-1.0, 0.85, -0.6], 42, s.t, 0.012, { aperture: 0.004 }));
  shot('K5', L(21), 'CAVE', (s) => C([0.2, 1.0, 2.9 - s.lt * 0.12], [0.85, 0.85, 1.5], 36, s.t, 0.01, { aperture: 0.004 }));
  shot('K6', L(22), 'CAVE', (s) => C([0.55, 1.15, 0.0 - s.lt * 0.05], [1.75, 0.98, 0.35], 38, s.t, 0.01, { aperture: 0.004 }));
  shot('E1', L(23) - 0.2, 'CAVE', (s) => C([0, 1.4, 4 - s.lt * 0.1], [0, 0.4, 0], 50, s.t, 0.005, { aperture: 0.004 }));

  window.__A = { cEmma, cDad, bDad, bEmma, bGrace, kEmma, kDad, THREE };
  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, captions, end: A.duration };
};

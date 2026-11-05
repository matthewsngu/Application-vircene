/* "How deep can you dig?" — blocky 3D first-person descent, vertical 1080×1920.
 * One dominant direction (down) for the whole film (motion-doctrine): every shot's camera sinks.
 * Facts: Arsenalna (Kyiv) 105.5 m ≈ 346 ft; Eiffel Tower 330 m ≈ 1,083 ft; deepest caves ≈ 2.2 km ≈ 7,250 ft
 * (Veryovkina 2,212 m); Mponeng gold mine ≈ 4 km, virgin rock ≈ 66 °C / 151 °F; Kola SG-3 12,262 m (7.6 mi),
 * drilled 1970–1989, ≈ 23 cm (9 in) wide, ≈ 180 °C (356 °F) at the bottom, 24 species of plankton microfossils;
 * the "well to hell" screams were a hoax; Baltic crust there ≈ 35 km → ≈ 1/3; Earth radius 6,371 km (3,959 mi).
 */
window.buildFilm = (A) => {
  const { THREE, T, W, H, clamp, lerp, ease, easeOut, spring, hash, ev, box, sign, person, walkPose, idlePose, mat, buildHands, setHeld, poseHands, hudText, instanced } = A;
  const GL = { metalness: 0.6, roughness: 0.08 };

  /* ─── helpers ─── */
  function beam(g, a, b, t, c, opt = {}) { // box from point a to point b
    g.updateWorldMatrix(true, false); const A3 = new THREE.Vector3(...a), B3 = new THREE.Vector3(...b), len = A3.distanceTo(B3);
    const m = box(g, t, t, len, c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, opt); m.lookAt(B3.applyMatrix4(g.matrixWorld)); return m;
  }
  const strata = ['#7a5a3e', '#8a6a48', '#6e5440', '#9a8064', '#857a6c', '#6f6a64', '#5e5a58', '#77706a', '#4f4c4c', '#625c58'];
  // Cutaway slab (front face z=0) covering x0..x1, yTop..yBot, minus rectangular holes [x0,x1,y0(top),y1(bottom)].
  function slab(g, o) {
    const ys = new Set([o.yTop, o.yBot]); o.holes.forEach((h) => { ys.add(h[2]); ys.add(h[3]); });
    // strata bands
    let y = o.yTop, k = 0; while (y > o.yBot) { ys.add(y); y -= o.band * (0.6 + hash(k++ * 3.3) * 0.9); } ys.add(o.yBot);
    const Y = [...ys].filter((v) => v <= o.yTop && v >= o.yBot).sort((a, b) => b - a);
    for (let i = 0; i < Y.length - 1; i++) {
      const top = Y[i], bot = Y[i + 1], mid = (top + bot) / 2; if (top - bot < 1e-3) continue;
      const hs = o.holes.filter((h) => mid < h[2] && mid > h[3]).sort((a, b) => a[0] - b[0]);
      let x = o.x0; const segs = []; hs.forEach((h) => { if (h[0] > x) segs.push([x, h[0]]); x = Math.max(x, h[1]); }); if (x < o.x1) segs.push([x, o.x1]);
      const col = o.col ? o.col(mid, i) : strata[Math.floor(hash(Math.round(mid * 7)) * strata.length)];
      segs.forEach(([a, b]) => box(g, b - a, top - bot, o.depth, col, (a + b) / 2, mid, -o.depth / 2, { cast: false, mat: { roughness: 0.95 } }));
    }
    // pebbles on the face
    const peb = []; for (let i = 0; i < o.pebbles; i++) { const x = lerp(o.x0, o.x1, hash(i * 1.37 + o.seed)), yy = lerp(o.yTop, o.yBot, hash(i * 2.71 + o.seed)); if (o.holes.some((h) => x > h[0] - 0.5 && x < h[1] + 0.5 && yy < h[2] + 0.5 && yy > h[3] - 0.5)) continue; peb.push({ x, y: yy, z: 0.02, s: o.pebble * (0.5 + hash(i * 5.1) * 1.2), ry: hash(i) }); }
    const pb = instanced(g, [{ w: 1, h: 0.7, d: 0.4, c: '#fff', tint: true, x: 0, y: 0, z: 0, cast: false }], peb.length);
    peb.forEach((p, i) => { pb.place(i, p); pb.color(i, 0, ['#4a4440', '#a89a88', '#5e5652', '#c2b49c', '#3a3634'][i % 5]); }); pb.done();
  }
  function minerMan(g, x, z, ry) { const p = person(g, { body: '#e2572c', legs: '#2c3e5c', hair: '#3a2a20', hat: '#f1c40f', skin: '#a8754f' }, x, z, { ry }); box(p.head, 0.12, 0.1, 0.06, '#fff6d0', 0, 0.5, 0.28, { cast: false, mat: { emissive: '#fff6d0', emissiveIntensity: 2 } }); return p; }

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, sky, extra = {}) => { const group = new THREE.Group(); sets[name] = { group, sky, ...extra }; return group; };

  // YARD: backyard, the hole (6 ft deep), dirt pile, tombstone joke
  let dirtPile;
  {
    const g = mk('YARD', '#cfe6f6', { skyTop: '#5f9fe0', sun: [20, 30, 12], sunI: 2.8, hemi: 1.1, hemiSky: '#e6f0ff', hemiGround: '#6a5a40', fogNear: 60, fogFar: 260, shadow: 20, ground: '#6f9a4a' });
    const HW = 1.1, D = 1.83;
    box(g, 100, 0.3, 50, '#79a64e', 0, -0.15, -25 - HW, { cast: false }); box(g, 100, 0.3, 50, '#79a64e', 0, -0.15, 25 + HW, { cast: false });
    box(g, 50, 0.3, 2 * HW, '#79a64e', -25 - HW, -0.15, 0, { cast: false }); box(g, 50, 0.3, 2 * HW, '#79a64e', 25 + HW, -0.15, 0, { cast: false });
    // hole walls with roots and stones
    box(g, 2 * HW, D, 0.3, '#6e4f33', 0, -D / 2, -HW - 0.15, { cast: false }); box(g, 2 * HW, D, 0.3, '#6e4f33', 0, -D / 2, HW + 0.15, { cast: false });
    box(g, 0.3, D, 2 * HW, '#755538', -HW - 0.15, -D / 2, 0, { cast: false }); box(g, 0.3, D, 2 * HW, '#755538', HW + 0.15, -D / 2, 0, { cast: false });
    box(g, 2 * HW, 0.2, 2 * HW, '#5a4030', 0, -D - 0.1, 0, { cast: false });
    for (let i = 0; i < 26; i++) { const sd = i % 4, a = (hash(i) - 0.5) * 2 * HW * 0.9, y = -0.2 - hash(i * 3) * (D - 0.4); const s = 0.08 + hash(i * 7) * 0.12; const c = i % 3 ? '#8a7a68' : '#d8c8a8'; if (sd === 0) box(g, s * 2, s, 0.05, c, a, y, -HW + 0.01); else if (sd === 1) box(g, s * 2, s, 0.05, c, a, y, HW - 0.01); else if (sd === 2) box(g, 0.05, s, s * 2, c, -HW + 0.01, y, a); else box(g, 0.05, s, s * 2, c, HW - 0.01, y, a); }
    // dirt pile
    dirtPile = new THREE.Group(); dirtPile.position.set(2.6, 0, -0.4); g.add(dirtPile);
    for (let i = 0; i < 14; i++) box(dirtPile, 1.6 - i * 0.09, 0.14, 1.4 - i * 0.08, i % 2 ? '#6e4f33' : '#7a5a3e', (hash(i) - 0.5) * 0.2, 0.07 + i * 0.1, (hash(i * 2) - 0.5) * 0.2);
    // tombstone (the joke)
    const ts = new THREE.Group(); ts.position.set(-0.4, 0, -HW - 0.6); g.add(ts); box(ts, 1.0, 1.2, 0.2, '#9aa0a8', 0, 0.6, 0); sign(ts, ['R.I.P.'], 0.8, 0.35, 0, 0.85, 0.105, { bg: '#9aa0a8', fg: '#3a3f4c' });
    // house, fence, trees
    const hs = new THREE.Group(); hs.position.set(-4, 0, -16); g.add(hs);
    box(hs, 12, 5, 8, '#f1e7d4', 0, 2.5, 0); const r1 = box(hs, 12.8, 0.4, 5, '#8a3a3a', 0, 6.0, -2); r1.rotation.x = 0.65; const r2 = box(hs, 12.8, 0.4, 5, '#8a3a3a', 0, 6.0, 2); r2.rotation.x = -0.65;
    box(hs, 1.4, 2.4, 0.1, '#5a3a2a', 2, 1.2, 4.02); box(hs, 1.6, 1.3, 0.1, '#9fc3d8', -2.5, 2.6, 4.02, { mat: GL }); box(hs, 1.6, 1.3, 0.1, '#9fc3d8', 4.5, 2.6, 4.02, { mat: GL });
    for (let x = -20; x <= 20; x += 1.2) box(g, 0.12, 1.4, 0.1, '#e8e2d4', x, 0.7, -24);
    box(g, 42, 0.12, 0.08, '#e8e2d4', 0, 1.1, -24); box(g, 42, 0.12, 0.08, '#e8e2d4', 0, 0.4, -24);
    [[-12, -8], [9, -12], [14, 4], [-10, 8]].forEach(([x, z], i) => { box(g, 0.5, 2.6, 0.5, '#6a4a34', x, 1.3, z); box(g, 3.4, 3, 3.4, '#4f8a3a', x, 4, z); box(g, 2.2, 2, 2.2, '#5a9a42', x + 0.4, 5.6, z + 0.3); });
  }

  // SUBWAY: cutaway slab, a station at 350 ft (≈106 m) beside your shaft
  let train, digLightS;
  {
    const g = mk('SUBWAY', '#3a3230', { skyTop: '#a8c8e8', sun: [10, 30, 40], sunI: 2.2, hemi: 1.2, hemiSky: '#ffffff', hemiGround: '#6a5a4a', fogNear: 80, fogFar: 220, shadow: 60, ground: '#4a4038', exposure: 1.05 });
    const st = [-6, 22, -94, -107.5];
    slab(g, { x0: -40, x1: 40, yTop: 0, yBot: -150, depth: 8, band: 4, holes: [st], pebbles: 900, pebble: 0.5, seed: 1 });
    // surface city on top
    for (let i = 0; i < 14; i++) { const h = 6 + hash(i) * 24; box(g, 4 + hash(i * 2) * 3, h, 6, ['#d7dbe0', '#c9b8a0', '#b9cbd8'][i % 3], -36 + i * 5.6, h / 2, -4); }
    box(g, 80, 0.6, 9, '#79a64e', 0, 0.3, -4, { cast: false });
    // station interior (recessed into the slab)
    box(g, 28, 13.5, 0.5, '#e8dcc4', 8, -100.75, -8, { cast: false });
    for (let x = -4; x <= 20; x += 4) { box(g, 1.2, 10, 0.6, '#c9b896', x, -102, -7.6); }
    box(g, 28, 1.2, 8, '#d8c8a8', 8, -107, -4, { cast: false }); box(g, 12, 0.8, 7, '#e9dcc4', 13, -106, -4);
    for (let x = -4; x <= 20; x += 3) box(g, 1.6, 0.15, 0.6, '#fff6e0', x, -95.2, -4, { cast: false, mat: { emissive: '#fff6e0', emissiveIntensity: 1.6 } });
    const lamp = new THREE.PointLight(0xfff0d0, 120, 40, 1.5); lamp.position.set(8, -97, -2); g.add(lamp);
    train = new THREE.Group(); g.add(train);
    for (let c = 0; c < 3; c++) { box(train, 9.6, 3.4, 3, '#2c6fb0', c * 10, -104.6, -5.5); box(train, 9.6, 0.5, 3.05, '#f1c40f', c * 10, -105.8, -5.5); for (let w = 0; w < 4; w++) box(train, 1.4, 1.1, 0.06, '#cfe8f4', c * 10 - 3.6 + w * 2.4, -104.2, -3.97, { cast: false, mat: { emissive: '#cfe8f4', emissiveIntensity: 0.5 } }); }
    for (let i = 0; i < 6; i++) person(g, [{ body: '#c96a5a', legs: '#26262c' }, { body: '#4f7c86', legs: '#2c3e5c' }, { body: '#d8b25a', legs: '#26262c' }][i % 3], 9 + i * 1.8, -1.5 - (i % 2) * 0.8, { ry: Math.PI * 0.1, s: 1 }).root.position.y = -105.6;
    sign(g, ['ARSENALNA'], 7, 1.8, 10, -97.5, -7.7, { bg: '#1f3b63', fg: '#ffffff', glow: 0.5 });
    // your shaft: a dark slot that grows with the dig + the digger's light at the bottom
    digLightS = { shaft: box(g, 2.2, 1, 0.3, '#16110e', -16, -0.5, 0.1, { cast: false }), glow: box(g, 2.0, 0.4, 0.35, '#ffd890', -16, -1, 0.12, { cast: false, mat: { emissive: '#ffd890', emissiveIntensity: 2 } }) };
  }
  const shaftTo = (o, d) => { o.shaft.scale.y = d; o.shaft.position.y = -d / 2; o.glow.position.y = -d + 0.3; };

  // EIFFEL: deeper slab, an x-ray Eiffel Tower standing upside... no: standing, its tip below the grass
  let digLightE;
  {
    const g = mk('EIFFEL', '#2e2826', { skyTop: '#a8c8e8', sun: [10, 30, 40], sunI: 2.0, hemi: 1.2, hemiSky: '#ffffff', hemiGround: '#5a4a3a', fogNear: 300, fogFar: 900, shadow: 200, ground: '#4a4038' });
    slab(g, { x0: -200, x1: 200, yTop: 0, yBot: -420, depth: 20, band: 14, holes: [], pebbles: 1400, pebble: 2.2, seed: 2 });
    box(g, 400, 3, 30, '#79a64e', 0, 1.5, -10, { cast: false });
    for (let i = 0; i < 30; i++) { const h = 10 + hash(i) * 40; box(g, 8 + hash(i * 2) * 6, h, 14, ['#d7dbe0', '#c9b8a0', '#b9cbd8'][i % 3], -190 + i * 13, 3 + h / 2, -12); }
    const tw = new THREE.Group(); tw.position.set(30, -335, 3); g.add(tw); tw.updateMatrixWorld(true);
    const gold = { emissive: '#ffb02a', emissiveIntensity: 1.6, roughness: 0.5 };
    const lv = [[0, 125], [57, 70], [115, 42], [276, 16], [300, 6], [330, 0.6]];
    for (let i = 0; i < lv.length - 1; i++) {
      const [y0, w0] = lv[i], [y1, w1] = lv[i + 1];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz], k) => {
        beam(tw, [sx * w0 / 2, y0, sz * w0 / 4], [sx * w1 / 2, y1, sz * w1 / 4], i < 3 ? 2.4 : 1.4, '#ffcf5a', { mat: gold, cast: false });
      });
      if (i < 3) { // lattice X bracing on the front face
        const n = i === 2 ? 5 : 3;
        for (let j = 0; j < n; j++) { const a = j / n, b = (j + 1) / n, ya = lerp(y0, y1, a), yb = lerp(y0, y1, b), wa = lerp(w0, w1, a), wb = lerp(w0, w1, b);
          beam(tw, [-wa / 2, ya, w0 / 4], [wb / 2, yb, w1 / 4], 0.9, '#ffcf5a', { mat: gold, cast: false }); beam(tw, [wa / 2, ya, w0 / 4], [-wb / 2, yb, w1 / 4], 0.9, '#ffcf5a', { mat: gold, cast: false }); }
      }
      box(tw, w1 * 1.1 + 2, 1.6, 2, '#ffcf5a', 0, y1, w1 / 4, { mat: gold, cast: false });
    }
    // base arch
    for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI; box(tw, 6, 1.6, 2, '#ffcf5a', Math.cos(a) * 40, 10 + Math.sin(a) * 22, 125 / 4, { mat: gold, cast: false }); }
    digLightE = { shaft: box(g, 4, 1, 0.5, '#16110e', -60, -0.5, 0.2, { cast: false }), glow: box(g, 3.6, 1.2, 0.6, '#ffd890', -60, -1, 0.25, { cast: false, mat: { emissive: '#ffd890', emissiveIntensity: 2 } }) };
  }

  // CAVE: you rappel into a wet chamber with a headlamp
  {
    const g = mk('CAVE', '#050506', { skyTop: '#020203', sun: [0, 30, 0], sunI: 0.0, hemi: 0.05, hemiSky: '#8090a0', hemiGround: '#000000', fogNear: 4, fogFar: 40, fog: '#020203', lamp: 45, fillI: 0, ground: '#101010', exposure: 1.2 });
    const rocks = []; for (let z = 6; z > -50; z -= 1.6) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r = 6 + hash(z * 3 + k) * 3 + (k > 10 ? 2 : 0); rocks.push({ x: Math.cos(a) * r * 1.3, y: Math.sin(a) * r + 2, z: z + hash(k * 5 + z) * 0.8, s: 2.2 + hash(k + z * 7) * 2, ry: hash(k * 9 + z), rx: hash(k * 3 - z) }); }
    const rk = instanced(g, [{ w: 1, h: 1, d: 1, c: '#fff', tint: true, x: 0, y: 0, z: 0, mat: { roughness: 0.55 } }], rocks.length);
    rocks.forEach((o, i) => { rk.place(i, o); rk.color(i, 0, ['#5e5652', '#6f6660', '#4a4440', '#7a7068', '#3e3a38'][Math.floor(hash(i * 1.7) * 5)]); }); rk.done();
    const tites = []; for (let i = 0; i < 140; i++) tites.push({ x: (hash(i) - 0.5) * 14, z: 4 - hash(i * 2.1) * 50, up: i % 3 === 0, s: 0.6 + hash(i * 3) * 1.2 });
    const st = instanced(g, [{ w: 0.5, h: 1.2, d: 0.5, c: '#a89a88', x: 0, y: -0.6, z: 0, mat: { roughness: 0.3 } }, { w: 0.32, h: 1.0, d: 0.32, c: '#b8aa98', x: 0, y: -1.6, z: 0, mat: { roughness: 0.3 } }, { w: 0.14, h: 0.8, d: 0.14, c: '#c9bca8', x: 0, y: -2.4, z: 0, mat: { roughness: 0.25 } }], tites.length);
    tites.forEach((o, i) => st.place(i, o.up ? { x: o.x, y: -3.6, z: o.z, s: o.s, rx: Math.PI } : { x: o.x, y: 8.6 - hash(i) * 1.5, z: o.z, s: o.s })); st.done();
    box(g, 30, 0.4, 60, '#3a3634', 0, -4, -20, { cast: false }); box(g, 9, 0.1, 14, '#2a4050', 1, -3.75, -14, { cast: false, mat: { roughness: 0.05, metalness: 0.6 } });
    box(g, 0.05, 30, 0.05, '#e2572c', 0.6, 8, -2.4, { cast: false });
  }

  // MINE: a cage shaft down, then a hot gold-mine tunnel with miners
  const miners = [];
  {
    const g = mk('MINE', '#2a1a10', { skyTop: '#140c08', sun: [5, 20, 10], sunI: 0.6, sunColor: '#ffb070', hemi: 0.5, hemiSky: '#ffb070', hemiGround: '#2a1a10', fogNear: 10, fogFar: 70, fog: '#3a2414', lamp: 30, fillI: 0.1, ground: '#2a1a10', exposure: 1.15, shadow: 20 });
    // tunnel along -z
    box(g, 7, 0.4, 90, '#5a4636', 0, -0.2, -40, { cast: false });
    const wall = []; for (let z = 6; z > -86; z -= 1.2) for (let k = 0; k < 9; k++) { const a = Math.PI * (k / 8), r = 3.6 + hash(z * 5 + k) * 0.8; wall.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.95 + 0.3, z, s: 1.6 + hash(k + z) * 0.6, ry: hash(z + k * 3), rx: hash(z * 2 + k) }); }
    const wk = instanced(g, [{ w: 1, h: 1, d: 1, c: '#fff', tint: true, x: 0, y: 0, z: 0 }], wall.length);
    wall.forEach((o, i) => { wk.place(i, o); wk.color(i, 0, ['#6a5040', '#7a5a44', '#5a4434', '#8a6a4c'][i % 4]); }); wk.done();
    const flecks = []; for (let i = 0; i < 300; i++) { const a = Math.PI * hash(i), r = 3.0; flecks.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.95 + 0.3, z: 4 - hash(i * 3.3) * 88, s: 0.6 + hash(i) * 0.6, ry: hash(i * 7) }); }
    const fk = instanced(g, [{ w: 0.18, h: 0.1, d: 0.12, c: '#ffd24a', x: 0, y: 0, z: 0, cast: false, mat: { emissive: '#ffb02a', emissiveIntensity: 1.4, metalness: 0.8, roughness: 0.3 } }], flecks.length);
    flecks.forEach((o, i) => fk.place(i, o)); fk.done();
    for (let z = 4; z > -86; z -= 4) { box(g, 0.35, 3.4, 0.35, '#8a5a3a', -2.8, 1.5, z); box(g, 0.35, 3.4, 0.35, '#8a5a3a', 2.8, 1.5, z); box(g, 6.2, 0.4, 0.4, '#7a4a2e', 0, 3.3, z); box(g, 0.5, 0.2, 0.3, '#fff0c0', 0, 3.05, z, { cast: false, mat: { emissive: '#ffd890', emissiveIntensity: 2 } }); }
    for (let i = 0; i < 3; i++) { const pl = new THREE.PointLight(0xffc080, 40, 18, 1.6); pl.position.set(0, 2.8, -4 - i * 12); g.add(pl); }
    box(g, 0.12, 0.08, 90, '#9aa0a8', -0.7, 0.05, -40, { cast: false, mat: { metalness: 0.8, roughness: 0.3 } }); box(g, 0.12, 0.08, 90, '#9aa0a8', 0.7, 0.05, -40, { cast: false, mat: { metalness: 0.8, roughness: 0.3 } });
    for (let z = 4; z > -86; z -= 0.8) box(g, 1.9, 0.08, 0.25, '#5a3a24', 0, 0.0, z, { cast: false });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 90, 12), mat('#c9ced4', { metalness: 0.6, roughness: 0.35 })); pipe.rotation.x = Math.PI / 2; pipe.position.set(2.3, 2.6, -40); g.add(pipe);
    [[-10, 0], [-26, 1]].forEach(([z, k]) => { const c = new THREE.Group(); c.position.set(0, 0, z); g.add(c); box(c, 1.6, 1.0, 2.4, '#5d6670', 0, 0.85, 0, { mat: { metalness: 0.5, roughness: 0.5 } }); for (let i = 0; i < 6; i++) box(c, 0.4, 0.3, 0.4, i % 2 ? '#ffd24a' : '#6a5040', -0.5 + (i % 3) * 0.5, 1.45, -0.6 + Math.floor(i / 3) * 1.0, { mat: i % 2 ? { emissive: '#ffb02a', emissiveIntensity: 0.6, metalness: 0.8 } : {} }); [[-0.6, -0.8], [0.6, -0.8], [-0.6, 0.8], [0.6, 0.8]].forEach(([dx, dz]) => box(c, 0.15, 0.4, 0.4, '#2b2f36', dx, 0.25, dz)); });
    [[-1.6, -7, 0.4], [1.7, -14, -0.6], [-1.4, -20, 0.2], [1.5, -31, -0.3]].forEach(([x, z, ry]) => miners.push(minerMan(g, x, z, ry)));
    // cage shaft at x=200: rock walls rushing past
    const sw = []; for (let y = 10; y > -240; y -= 1.4) for (let k = 0; k < 4; k++) { const sx = k < 2 ? (k ? 1 : -1) * 2.8 : 0, sz = k < 2 ? 0 : (k === 2 ? 1 : -1) * 2.8; sw.push({ x: 200 + sx + (hash(y + k) - 0.5) * 0.4, y, z: sz + (hash(y * 2 + k) - 0.5) * 0.4, s: 1.6 + hash(y * 3 + k) * 0.5, ry: hash(y + k * 9) }); }
    const swk = instanced(g, [{ w: 1.5, h: 1.5, d: 1.5, c: '#fff', tint: true, x: 0, y: 0, z: 0 }], sw.length);
    sw.forEach((o, i) => { swk.place(i, o); swk.color(i, 0, ['#5a4434', '#6a5040', '#4a3a2e'][i % 3]); }); swk.done();
    for (let y = 0; y > -240; y -= 30) { box(g, 3, 2.6, 0.2, '#ffd890', 200, y, -2.0, { cast: false, mat: { emissive: '#ffb050', emissiveIntensity: 1.4 } }); }
  }
  // the cage moves with the camera (built on the fly in the shot)
  const cage = new THREE.Group(); sets.MINE.group.add(cage);
  for (let k = 0; k < 7; k++) { box(cage, 0.06, 2.6, 0.06, '#c9ced4', -1.2 + k * 0.4, 1.3, -1.2, { cast: false, mat: { metalness: 0.7 } }); }
  box(cage, 2.6, 0.08, 0.08, '#c9ced4', 0, 2.5, -1.2, { cast: false }); box(cage, 2.6, 0.08, 0.08, '#c9ced4', 0, 0.2, -1.2, { cast: false });
  box(cage, 2.6, 0.1, 2.6, '#5d6670', 0, 0, 0, { cast: false });

  // KOLA: the welded cap in the ruin + the drilling tower in the snow
  let ruler;
  {
    const g = mk('KOLA', '#c9ced4', { skyTop: '#8a96a4', sun: [-20, 25, 10], sunI: 1.6, sunColor: '#e6eeff', hemi: 1.1, hemiSky: '#dfe8f4', hemiGround: '#6a6460', fogNear: 30, fogFar: 160, shadow: 14, ground: '#9aa0a8', exposure: 1.05 });
    box(g, 30, 0.2, 30, '#8a8680', 0, -0.1, -5, { cast: false, mat: { roughness: 0.95 } });
    for (let i = 0; i < 40; i++) box(g, 0.3 + hash(i) * 0.8, 0.1 + hash(i * 2) * 0.3, 0.3 + hash(i * 3) * 0.6, i % 3 ? '#7a7670' : '#5e5a56', (hash(i * 5) - 0.5) * 14, 0.08, -2 - hash(i * 7) * 12);
    box(g, 14, 6, 0.4, '#a8a29a', 0, 3, -12); box(g, 0.4, 6, 14, '#a29c94', -7, 3, -5); box(g, 0.4, 3, 14, '#a29c94', 7, 1.5, -5);
    box(g, 4, 2.4, 0.5, '#f4f6f8', -2, 3.6, -11.9, { cast: false, mat: { emissive: '#ffffff', emissiveIntensity: 0.8 } });
    sign(g, ['SG-3'], 2.4, 0.9, 3, 4.2, -11.78, { bg: '#a8a29a', fg: '#7a2a20' });
    // the cap
    const cap = new THREE.Group(); cap.position.set(0, 0, -3); g.add(cap);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.25, 32), mat('#8f8a82', { roughness: 0.9 })); col.position.y = 0.12; col.castShadow = col.receiveShadow = true; cap.add(col);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 32), mat('#8a4a2a', { roughness: 0.7, metalness: 0.4 })); lid.position.y = 0.29; lid.castShadow = lid.receiveShadow = true; cap.add(lid);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; box(cap, 0.07, 0.06, 0.07, '#5a3a24', Math.cos(a) * 0.38, 0.35, Math.sin(a) * 0.38, { mat: { metalness: 0.5, roughness: 0.6 } }); }
    box(cap, 0.3, 0.02, 0.05, '#c9a46a', 0, 0.335, 0.1, { cast: false }); box(cap, 0.3, 0.02, 0.05, '#c9a46a', 0, 0.335, -0.1, { cast: false });
    ruler = new THREE.Group(); ruler.position.set(0, 0.36, 0.0); cap.add(ruler);
    box(ruler, 0.234, 0.012, 0.06, '#f1c40f', 0, 0, 0.32, { cast: false }); for (let k = 0; k <= 9; k++) box(ruler, 0.004, 0.014, k % 3 ? 0.02 : 0.035, '#1b1b24', -0.117 + k * 0.026, 0.002, 0.3, { cast: false });
    // tower in the tundra at x=300
    box(g, 600, 0.2, 400, '#eef2f6', 300, -0.12, -100, { cast: false });
    const tw = new THREE.Group(); tw.position.set(300, 0, -60); g.add(tw); tw.updateMatrixWorld(true);
    box(tw, 30, 12, 20, '#c96a4a', 0, 6, 0); box(tw, 30.2, 1, 20.2, '#8a3a2a', 0, 12.4, 0);
    const lvl = [[12, 10], [30, 7], [50, 4], [62, 2]];
    for (let i = 0; i < lvl.length - 1; i++) { const [y0, w0] = lvl[i], [y1, w1] = lvl[i + 1]; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => beam(tw, [sx * w0 / 2, y0, sz * w0 / 2], [sx * w1 / 2, y1, sz * w1 / 2], 0.5, '#5d6670')); for (let j = 0; j < 3; j++) { const a = j / 3, b = (j + 1) / 3; beam(tw, [-lerp(w0, w1, a) / 2, lerp(y0, y1, a), w0 / 2 * (1 - a) + w1 / 2 * a], [lerp(w0, w1, b) / 2, lerp(y0, y1, b), w0 / 2 * (1 - b) + w1 / 2 * b], 0.3, '#5d6670'); } }
    for (let i = 0; i < 6; i++) box(g, 8, 4, 8, '#b8b2aa', 280 + i * 10, 2, -30 - (i % 2) * 12);
    const snow = []; for (let i = 0; i < 500; i++) snow.push({ x: 300 + (hash(i) - 0.5) * 80, y: hash(i * 2) * 40, z: -10 - hash(i * 3) * 60 });
    const sn = instanced(g, [{ w: 0.12, h: 0.12, d: 0.12, c: '#ffffff', x: 0, y: 0, z: 0, cast: false, mat: { emissive: '#ffffff', emissiveIntensity: 0.4 } }], snow.length);
    sets.KOLA.update = (s) => { snow.forEach((o, i) => sn.place(i, { x: o.x + Math.sin(s.t + i) * 0.5, y: ((o.y - s.t * 2) % 40 + 40) % 40, z: o.z })); sn.done(); };
  }

  // BORE: inside the 9-inch hole, falling, the rock heating to 350 °F
  {
    const g = mk('BORE', '#100806', { skyTop: '#100806', sun: [0, 30, 0], sunI: 0.0, hemi: 0.15, hemiSky: '#ff8040', hemiGround: '#100806', fogNear: 8, fogFar: 70, fog: '#1a0a06', lamp: 25, fillI: 0, ground: '#100806', exposure: 1.2 });
    const N = 120, L = 4;
    for (let i = 0; i < N; i++) {
      const k = i / N, c = new THREE.Color('#6f6a64').lerp(new THREE.Color('#3a2a24'), Math.min(1, k * 1.5)), const e = new THREE.Color('#ff5a10').multiplyScalar(Math.pow(k, 2.6) * 0.7);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.0 + (i % 3 === 0 ? -0.06 : 0), 1.0, L, 20, 1, true), new THREE.MeshStandardMaterial({ color: c, emissive: e, roughness: 0.8, side: THREE.BackSide }));
      m.position.y = -i * L - L / 2; g.add(m);
    }
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24), new THREE.MeshStandardMaterial({ color: '#ff7a20', emissive: '#ff5a10', emissiveIntensity: 2 })); bottom.rotation.x = -Math.PI / 2; bottom.position.y = -N * L; g.add(bottom);
    const gl = new THREE.PointLight(0xff6a20, 30, 30, 1.6); gl.position.y = -N * L + 3; g.add(gl);
  }

  // KITCHEN: that's your oven
  {
    const g = mk('KITCHEN', '#f4ecd8', { skyTop: '#f4ecd8', sun: [8, 14, 12], sunI: 2.2, hemi: 1.2, fogNear: 30, fogFar: 80, shadow: 8, ground: '#c9b8a0' });
    box(g, 12, 0.2, 10, '#c9b896', 0, -0.1, -3, { cast: false }); box(g, 12, 6, 0.3, '#e8dcc4', 0, 3, -4.2, { cast: false });
    for (let x = -5; x <= 5; x += 0.5) for (let y = 1.2; y < 2.6; y += 0.5) box(g, 0.46, 0.46, 0.05, (x * 2 + y * 2) % 2 ? '#f4f1ea' : '#dfe8ec', x, y + 0.9, -4.02, { cast: false });
    box(g, 2.4, 2.2, 1.6, '#d7dbe0', 0, 1.1, -3.2, { mat: { metalness: 0.5, roughness: 0.3 } }); box(g, 1.9, 1.1, 0.05, '#2a1a10', 0, 1.0, -2.39, { cast: false });
    box(g, 1.7, 0.9, 0.06, '#ff8a3a', 0, 1.0, -2.38, { cast: false, mat: { emissive: '#ff6a10', emissiveIntensity: 1.8 } });
    box(g, 0.9, 0.06, 0.6, '#d8a050', 0, 0.75, -2.9, { cast: false }); box(g, 1.8, 0.1, 0.1, '#c9ced4', 0, 1.75, -2.3, { mat: { metalness: 0.8 } });
    sign(g, ['350°F'], 0.7, 0.3, 0.7, 2.0, -2.38, { bg: '#1b1b24', fg: '#ff8a3a', glow: 0.8 });
    box(g, 3, 1.1, 1.6, '#8a5a3a', -2.8, 0.55, -3.2); box(g, 3, 0.1, 1.7, '#f4f1ea', -2.8, 1.15, -3.2); box(g, 3, 1.1, 1.6, '#8a5a3a', 2.8, 0.55, -3.2); box(g, 3, 0.1, 1.7, '#f4f1ea', 2.8, 1.15, -3.2);
    const ol = new THREE.PointLight(0xff8a3a, 6, 6, 1.6); ol.position.set(0, 1.0, -1.8); g.add(ol);
  }

  // FOSSIL: microscopic plankton in the rock
  const plank = [];
  {
    const g = mk('FOSSIL', '#06222a', { skyTop: '#020a10', sun: [5, 10, 10], sunI: 1.0, sunColor: '#bfefff', hemi: 0.6, hemiSky: '#6fe0ff', hemiGround: '#02080a', fogNear: 6, fogFar: 40, fog: '#04161c', ground: '#02080a', exposure: 1.2, fillI: 0.2 });
    const core = new THREE.IcosahedronGeometry(0.5, 1);
    for (let i = 0; i < 34; i++) {
      const p = new THREE.Group(); p.position.set((hash(i) - 0.5) * 10, (hash(i * 2) - 0.5) * 14, -2 - hash(i * 3) * 26); g.add(p);
      const col = ['#7fe8ff', '#b0ffcf', '#ffd890'][i % 3];
      const m = new THREE.Mesh(core, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.6, transparent: true, opacity: 0.75, roughness: 0.3, wireframe: i % 2 === 0 })); m.scale.setScalar(0.6 + hash(i * 5)); p.add(m);
      const n = 10 + (i % 3) * 4; for (let k = 0; k < n; k++) { const v = new THREE.Vector3(hash(i * 13 + k) - 0.5, hash(i * 17 + k) - 0.5, hash(i * 19 + k) - 0.5).normalize(); beam(p, [0, 0, 0], [v.x * 1.3, v.y * 1.3, v.z * 1.3], 0.04, col, { cast: false, mat: { emissive: col, emissiveIntensity: 0.8 } }); }
      plank.push(p);
    }
    const dust = []; for (let i = 0; i < 400; i++) dust.push({ x: (hash(i * 1.1) - 0.5) * 16, y: (hash(i * 2.2) - 0.5) * 20, z: -hash(i * 3.3) * 30 });
    const ds = instanced(g, [{ w: 0.05, h: 0.05, d: 0.05, c: '#bfefff', x: 0, y: 0, z: 0, cast: false, mat: { emissive: '#bfefff', emissiveIntensity: 1 } }], dust.length); dust.forEach((o, i) => ds.place(i, o)); ds.done();
    sets.FOSSIL.update = (s) => plank.forEach((p, i) => { p.rotation.set(s.t * 0.3 + i, s.t * 0.4 + i * 2, 0); p.position.y += 0; });
  }

  // HOAX: a tape recorder and the "sounds from hell" that were never real
  let reels = [], bars;
  {
    const g = mk('HOAX', '#1a1418', { skyTop: '#0a0809', sun: [2, 12, 6], sunI: 2.4, sunColor: '#ffe0c0', hemi: 0.35, fogNear: 10, fogFar: 40, shadow: 6, ground: '#1a1418', fillI: 0.15, exposure: 1.1 });
    box(g, 10, 0.2, 6, '#4a3226', 0, 0.9, -3, { mat: { roughness: 0.6 } }); box(g, 30, 0.2, 30, '#1a1418', 0, -0.1, -3, { cast: false });
    box(g, 3.2, 1.0, 2.0, '#3a3a40', 0, 1.5, -3.2); box(g, 3.0, 0.05, 1.8, '#c9ced4', 0, 2.02, -3.2, { mat: { metalness: 0.7 } });
    [-0.8, 0.8].forEach((x) => { const r = new THREE.Group(); r.position.set(x, 2.1, -3.3); g.add(r); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 32), mat('#2b2f36', { metalness: 0.6 })); r.add(d); for (let k = 0; k < 3; k++) { const sp = box(r, 0.1, 0.07, 1.1, '#9aa0a8', 0, 0.02, 0, { cast: false }); sp.rotation.y = k * Math.PI / 3; } reels.push(r); });
    box(g, 2.4, 0.3, 0.05, '#1b1b24', 0, 1.3, -2.18, { cast: false });
    bars = instanced(g, [{ w: 0.14, h: 1, d: 0.1, c: '#ff5a4a', x: 0, y: 0.5, z: 0, cast: false, mat: { emissive: '#ff3a2a', emissiveIntensity: 1.2 } }], 32);
    sets.HOAX.update = (s) => { reels.forEach((r) => (r.rotation.y = -s.t * 3)); for (let i = 0; i < 32; i++) { const h = 0.1 + Math.abs(Math.sin(s.t * 9 + i * 0.7) * Math.sin(s.t * 3.3 + i * 0.31)) * 1.6; bars.place(i, { x: -2.4 + i * 0.155, y: 2.6, z: -4.6, sy: h * 0.7 }); } bars.done(); };
  }

  // CRUST: scale cross-section, 1 unit = 100 m; crust ≈ 35 km, Kola reaches 12.3 km
  {
    const g = mk('CRUST', '#9fc3e8', { skyTop: '#4f7fc0', sun: [20, 40, 30], sunI: 2.0, hemi: 1.1, fogNear: 700, fogFar: 2600, shadow: 300, ground: '#6a5a4a' });
    const lay = [[0, 40, '#8a7a68'], [40, 120, '#77706a'], [120, 230, '#625c58'], [230, 350, '#4f4c4c']];
    lay.forEach(([a, b, c]) => box(g, 1200, b - a, 40, c, 0, -(a + b) / 2, -20, { cast: false }));
    box(g, 1200, 260, 40, '#c0502a', 0, -350 - 130, -20, { cast: false, mat: { emissive: '#ff5a10', emissiveIntensity: 0.5 } });
    box(g, 1200, 4, 42, '#79a64e', 0, 2, -20, { cast: false });
    box(g, 2.5, 123, 1, '#ff3a2a', 0, -61.5, 0.6, { cast: false, mat: { emissive: '#ff3a2a', emissiveIntensity: 2 } });
    sign(g, ['KOLA HOLE', '12 KM'], 70, 26, 70, -60, 0.6, { bg: '#1b1b24', fg: '#ff8a7a' });
    sign(g, ['CRUST ≈ 35 KM'], 120, 22, -150, -200, 0.6, { bg: '#2b2f36', fg: '#ffffff' });
    sign(g, ['MANTLE'], 90, 22, 150, -420, 0.6, { bg: '#7a2a10', fg: '#ffd2a0' });
    for (let i = 0; i < 40; i++) { const h = 2 + hash(i) * 8; box(g, 4, h, 6, '#d7dbe0', -600 + i * 30, 4 + h / 2, -20); }
  }

  // EARTH: cutaway planet, 1 unit = 100 km
  let earth;
  {
    const g = mk('EARTH', '#000000', { skyTop: '#000000', sun: [40, 20, 30], sunI: 2.6, hemi: 0.35, hemiSky: '#a0b8ff', hemiGround: '#000000', fogNear: 4000, fogFar: 6000, shadow: 80, ground: '#000000', fillI: 0.2, exposure: 1.1 });
    earth = new THREE.Group(); g.add(earth);
    const layers = [[63.71, '#2e6fb0', 0], [63.36, '#c0502a', 0.3], [50, '#e0702a', 0.5], [34.8, '#ffb02a', 1.2], [12.2, '#fff0a0', 2.5]];
    layers.forEach(([r, c, e], i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 32, Math.PI, Math.PI * 1.5), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: e, roughness: 0.7, side: THREE.DoubleSide })); earth.add(m);
      const f1 = new THREE.Mesh(new THREE.CircleGeometry(r, 64, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: e * 1.2 + (i ? 0.2 : 0), roughness: 0.8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -i, polygonOffsetUnits: -i * 4 }));
      f1.rotation.y = -Math.PI / 2; earth.add(f1);
      const f2 = f1.clone(); f2.rotation.set(0, 0, 0); earth.add(f2);
    });
    // continents (blocky green patches) on the surface
    for (let i = 0; i < 160; i++) { const th = hash(i) * Math.PI * 2, ph = Math.acos(2 * hash(i * 1.7) - 1); const v = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)); if (v.x > 0 && v.z > 0) continue; const m = box(earth, 6 + hash(i * 3) * 8, 0.5, 6 + hash(i * 5) * 8, i % 4 ? '#4f8a3a' : '#c9b896', v.x * 63.8, v.y * 63.8, v.z * 63.8, { cast: false }); m.lookAt(v.clone().multiplyScalar(200)); m.rotateX(Math.PI / 2); }
    // you are here: a pin at the top
    box(earth, 0.6, 3, 0.6, '#ff3a2a', 0, 65.5, 0, { cast: false, mat: { emissive: '#ff3a2a', emissiveIntensity: 2 } });
    sign(earth, ['YOU ARE HERE'], 18, 4, 0, 72, 0, { bg: '#1b1b24', fg: '#ff8a7a', glow: 0.6 });
    const sg = new THREE.BufferGeometry(); const pos = []; for (let i = 0; i < 1500; i++) { const a = hash(i) * Math.PI * 2, b = Math.acos(2 * hash(i * 3.1) - 1); pos.push(Math.sin(b) * Math.cos(a) * 2000, Math.cos(b) * 2000, Math.sin(b) * Math.sin(a) * 2000); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, fog: false })));
    sets.EARTH.update = (s) => { earth.rotation.y = -0.6 + s.t * 0.02; };
  }

  /* ─── depth timeline ─── */
  const FT = 3.28084;
  const keys = () => [[T('six'), 1.83], [T('three', 1), 106.7], [T('eleven'), 335.3], [T('seven', 1), 2134], [T('two', 1), 4023], [T('seven', 2), 12262]];
  function depthAt(t) {
    const K = keys(); if (t < K[0][0]) return 1.83 * easeOut(t / K[0][0]) * 0.9;
    let d = 1.83; for (let i = 1; i < K.length; i++) { const [tk, dk] = K[i], p = clamp((t - (tk - 0.8)) / 0.8); if (p > 0) d = lerp(K[i - 1][1], dk, ease(p)); } return d;
  }
  const fmt = (v) => Math.round(v).toLocaleString('en-US');

  /* ─── HUD ─── */
  function fitText(g, text, font, size, maxW) { g.font = `${size}px ${font}`; const w = g.measureText(text).width; return w > maxW ? size * maxW / w : size; }
  function stamp(g, t, t0, title, sub, col = '#ffd23f', dur = 2.2, snd = 'ding') {
    ev(snd, t0);
    const d = t - t0; if (d < 0 || d > dur) return;
    const k = spring(d, 2.4, 0.42), fade = d > dur - 0.3 ? 1 - (d - (dur - 0.3)) / 0.3 : 1;
    g.save(); g.globalAlpha = fade; g.translate(W / 2 - 40, 380); g.scale(k, k);
    const fs = fitText(g, title, 'Anton', 124, 820);
    hudText(g, title, 0, 0, `${fs}px Anton`, col, { align: 'center', stroke: 14, strokeColor: 'rgba(10,10,15,0.85)' });
    g.font = '800 44px Montserrat'; const ss = Math.min(44, 44 * 820 / Math.max(1, g.measureText(sub).width));
    hudText(g, sub, 0, 72, `800 ${ss}px Montserrat`, '#ffffff', { align: 'center', shadow: 12, stroke: 6 });
    g.restore();
  }
  function bigLine(g, t, t0, t1, text, col, y, size = 110) {
    if (t < t0 || t > t1) return; const k = easeOut((t - t0) / 0.35), f = t > t1 - 0.25 ? (t1 - t) / 0.25 : 1;
    g.save(); g.globalAlpha = clamp(f); g.translate(W / 2 - 40, y + (1 - k) * 40);
    const fs = fitText(g, text, 'Anton', size, 840); hudText(g, text, 0, 0, `${fs}px Anton`, col, { align: 'center', stroke: 14, strokeColor: 'rgba(10,10,15,0.85)' }); g.restore();
  }
  function hud(g, s) {
    const t = s.t, centerT = T('center');
    if (t < centerT) {
      const d = depthAt(t), ft = d * FT;
      hudText(g, 'DEPTH', 80, 960, '800 32px Montserrat', 'rgba(255,255,255,0.92)', { shadow: 10, stroke: 5 });
      const big = fmt(ft) + ' FT';
      hudText(g, big, 80, 1080, `${fitText(g, big, 'Anton', 120, 760)}px Anton`, '#ffd23f', { stroke: 14 });
      let line = fmt(d) + ' m';
      if (t > T('rock', 1) - 0.2 && t < T('seven', 2)) line += '  ·  ROCK 151°F';
      if (t > T('bottom') - 0.2) line += '  ·  ROCK 356°F';
      hudText(g, line, 80, 1150, '54px Anton', t > T('rock', 1) - 0.2 ? '#ff8a5a' : '#ffffff', { stroke: 10 });
      // side gauge (log scale), right edge inside the safe zone
      const y0 = 300, y1 = 1240, x = 915, f = Math.log10(1 + d) / Math.log10(12263);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 6, y0, 12, y1 - y0);
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#79a64e'); gr.addColorStop(0.35, '#9a8064'); gr.addColorStop(0.75, '#6f6a64'); gr.addColorStop(1, '#ff5a10');
      g.fillStyle = gr; g.fillRect(x - 4, y0, 8, (y1 - y0) * f);
      keys().forEach(([, dk]) => { const fy = y0 + (y1 - y0) * Math.log10(1 + dk) / Math.log10(12263); g.fillStyle = d >= dk - 0.01 ? '#ffd23f' : 'rgba(255,255,255,0.5)'; g.fillRect(x - 14, fy - 2, 28, 4); });
      const my = y0 + (y1 - y0) * f; g.beginPath(); g.arc(x, my, 13, 0, Math.PI * 2); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#1b1b24'; g.stroke();
    }
    stamp(g, t, T('grave'), 'A GRAVE', '6 FEET DOWN');
    stamp(g, t, T('subway'), 'SUBWAY STATION', 'ARSENALNA, KYIV · ~350 FT');
    stamp(g, t, T('eiffel'), 'EIFFEL TOWER', '1,083 FT TALL · FITS IN YOUR HOLE');
    stamp(g, t, T('caves'), 'DEEPEST CAVES', '~7,250 FT · VERYOVKINA, GEORGIA');
    stamp(g, t, T('mine', 1), 'DEEPEST MINE', 'MPONENG GOLD MINE · ~2.5 MILES');
    stamp(g, t, T('kola'), 'DEEPEST HOLE EVER', 'KOLA SUPERDEEP BOREHOLE · 7.6 MI');
    stamp(g, t, T('took'), '1970 → 1989', 'ABOUT 20 YEARS OF DRILLING', '#ffffff', 2.0, 'pop');
    stamp(g, t, T('nine'), '9 INCHES', 'THAT\'S HOW WIDE IT IS', '#ffffff', 2.0, 'pop');
    stamp(g, t, T('oven'), '356°F', 'A NORMAL OVEN SETTING', '#ff8a3a', 1.6);
    stamp(g, t, T('fossils'), 'MICROFOSSILS', '24 SPECIES OF PLANKTON', '#7fe8ff', 2.2, 'pop');
    stamp(g, t, T('hoax'), 'HOAX', 'THE "WELL TO HELL" SCREAMS WERE FAKE', '#ff5a4a', 2.2, 'hit');
    stamp(g, t, T('third'), '~1/3 OF THE CRUST', '12 KM OUT OF ~35 KM', '#ffd23f');
    bigLine(g, t, T('center') + 0.1, T('you', 5) - 0.05, 'CENTER: 3,959 MILES', '#ffffff', 400, 110);
    bigLine(g, t, T('you', 5), T('so', 1) - 0.05, 'YOU: 7.6 MILES = 0.2%', '#ffd23f', 400, 110);
    ev('hit', T('zero'));
    bigLine(g, t, T('so', 1), 1e9, 'HOW DEEP', '#ffffff', 330, 130);
    bigLine(g, t, T('so', 1) + 0.25, 1e9, 'WOULD YOU GO?', '#ffd23f', 470, 120);
  }

  /* ─── shots (everything sinks) ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update) => shots.push({ id, t0, set, cam, update });
  const pov = (x, y, z, lx, ly, lz, fov = 62, extra = {}) => ({ pos: [x, y, z], look: [lx, ly, lz], fov, ...extra });
  let handsReady = false;
  const dig = (t, speed = 1) => { if (!handsReady) { buildHands('#3d5a80'); setHeld('shovel'); handsReady = true; } poseHands(t, Math.pow(Math.abs(Math.sin(t * 3.2 * speed)), 2)); };
  const pileAt = (t) => { const k = clamp(depthAt(t) / 1.83); dirtPile.scale.set(1, Math.max(0.05, k), 1); };

  shot('Y1', 0, 'YARD', (s) => pov(0.2, 1.7 - s.lt * 0.25, 2.1, 0, -1.2, -0.4, 66), (s) => { dig(s.t); pileAt(s.t); });
  shot('Y2', T('how', 1), 'YARD', (s) => { const k = ease(s.p); return { ...pov(6 - k * 4, 22 - k * 14, 10 - k * 6, 0, -1, 0, 58), hands: false }; }, (s) => pileAt(s.t));
  shot('G1', T('six'), 'YARD', (s) => ({ ...pov(0.3, -0.25 - s.lt * 0.05, 0.6, -0.2, 3, -2.4, 70), hands: false }), (s) => pileAt(s.t));
  shot('G2', T('keep'), 'YARD', (s) => pov(0, 0.2 - s.lt * 0.6, 0.5, 0, -3, -0.2, 70), (s) => { dig(s.t, 1.6); pileAt(s.t); });
  shot('S1', T('three', 1), 'SUBWAY', (s) => { const d = depthAt(s.t); shaftTo(digLightS, d); return { ...pov(-6, lerp(-20, -98, ease(s.p)), 46, -2, lerp(-28, -104, ease(s.p)), 0, 60), hands: false }; });
  shot('S2', T('you', 3), 'SUBWAY', (s) => { shaftTo(digLightS, depthAt(s.t)); train.position.x = -34 + s.lt * 12; return { ...pov(8, -99 - s.lt * 0.6, 14, 10, -103, -6, 58), hands: false }; });
  shot('E1', T('eleven'), 'EIFFEL', (s) => { const k = ease(s.p); shaftTo(digLightE, depthAt(s.t)); return { ...pov(-20, lerp(-20, -300, k), 360, 10, lerp(-120, -330, k), 0, 60), hands: false }; });
  shot('E2', T('hide'), 'EIFFEL', (s) => { shaftTo(digLightE, depthAt(s.t)); return { ...pov(40, 10 - s.lt * 4, 60, 30, -20 - s.lt * 4, 0, 58), hands: false }; });
  shot('C1', T('seven', 1), 'CAVE', (s) => ({ ...pov(0, 7 - s.lt * 2.2, 0, 0.2, -2 - s.lt * 0.5, -14, 66), hands: false }));
  shot('C2', T('total'), 'CAVE', (s) => { const off = s.lt > 0.35 && s.lt < 1.5; return { ...pov(0.3, 1 - s.lt * 0.5, -2, -0.5, -1.5, -16, 66), hands: false, lamp: off ? 0 : 45 * (1 - 0.6 * Math.max(0, Math.sin(s.lt * 40)) * (s.lt < 0.35 ? 1 : 0)) }; });
  shot('M1', T('two', 1), 'MINE', (s) => { const y = -s.lt * 14; cage.position.set(200, y - 1.6, 0); cage.visible = true; return { ...pov(200, y, 0.6, 200, y - 0.9, -3, 70), hands: false }; });
  shot('M2', T('gold'), 'MINE', (s) => { cage.visible = false; miners.forEach((m, i) => { walkPose(m, s.t + i); }); return { ...pov(0.4, 2.0 - s.lt * 0.12, 3 - s.lt * 1.4, 0, 1.0, -20, 62), hands: false }; });
  shot('M3', T('rock', 1), 'MINE', (s) => { cage.visible = false; miners.forEach((m, i) => idlePose(m, s.t, i)); return { ...pov(-0.4, 1.8 - s.lt * 0.15, -11 - s.lt * 0.6, -2.2, 1.0, -15.5, 56), hands: false }; });
  shot('K1', T('seven', 2), 'KOLA', (s) => { const k = ease(s.p); ruler.visible = false; return { ...pov(1.2 - k * 0.8, 3.2 - k * 1.6, 1.4 - k * 2.4, 0, 0, -3.2, 60), hands: false }; });
  shot('K1b', T('deepest', 4), 'KOLA', (s) => ({ ...pov(0.6, 1.4 - s.lt * 0.2, -2.0, 0, 0.2, -3.0, 54), hands: false }));
  shot('K2', T('took'), 'KOLA', (s) => ({ ...pov(240 + s.lt * 4, 30 - s.lt * 3, 30, 300, 20, -60, 60), hands: false }));
  shot('K3', T('nine'), 'KOLA', (s) => { ruler.visible = true; return { ...pov(0.05, 1.2 - s.lt * 0.25, -2.4, 0, 0.3, -3.05, 50), hands: false }; });
  shot('B1', T('bottom'), 'BORE', (s) => { const k = clamp(s.p); const y = lerp(-20, -460, Math.pow(k, 1.4)); return { ...pov(0, y, 0, 0.001, y - 10, -0.6, 70), hands: false }; });
  shot('O1', T('oven'), 'KITCHEN', (s) => ({ ...pov(0.4, 2.4 - s.lt * 0.5, 1.6 - s.lt * 0.6, 0, 0.9, -2.6, 58), hands: false }));
  shot('F1', T('scientists'), 'FOSSIL', (s) => ({ ...pov(0.5, 4 - s.lt * 1.6, 4, 0, -2 - s.lt * 1.6, -14, 60), hands: false }));
  shot('H1', T('no'), 'HOAX', (s) => ({ ...pov(1.8, 4.4 - s.lt * 0.4, 3.6 - s.lt * 0.3, 0, 2.0, -3.4, 56), hands: false }));
  shot('R1', T("here's"), 'CRUST', (s) => { const k = ease(s.p); return { ...pov(lerp(20, 60, k), lerp(-40, -150, k), lerp(160, 700, k), 0, lerp(-50, -230, k), 0, 55), hands: false }; });
  shot('W1', T('center'), 'EARTH', (s) => { const k = ease(s.p); return { ...pov(lerp(8, 160, k), lerp(78, 60, k), lerp(14, 200, k), 0, lerp(66, 0, k), 0, 52), hands: false }; });
  shot('W2', T('you', 5), 'EARTH', (s) => ({ ...pov(Math.sin(0.7 + s.lt * 0.08) * 230, 70 - s.lt * 4, Math.cos(0.7 + s.lt * 0.08) * 230, 0, -4, 0, 50), hands: false }));
  shot('Z1', T('so', 1), 'YARD', (s) => pov(0.2, 1.7, 2.1 - s.lt * 0.1, 0, -1.5, -0.3, 66), (s) => { dig(s.t, 0.6); pileAt(1e9); });
  shot('Z2', T('tell'), 'YARD', (s) => { const k = ease(s.p); return { ...pov(1, 2.5 + k * 1, 4 - k * 1, 0, -1.8, -0.3, 62), hands: false }; }, (s) => pileAt(1e9));

  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, wipes: [], end: A.duration };
};

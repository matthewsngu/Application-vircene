/* "$1 million now, or a penny doubled every day for 30 days?" — blocky 3D game-show what-if, vertical 1080×1920.
 * Math: day n = $0.01 × 2^(n−1). Day 10 $5.12 · 15 $163.84 · 20 $5,242.88 · 25 $167,772.16 · 27 $671,088.64 ·
 * 28 $1,342,177.28 · 29 $2,684,354.56 · 30 $5,368,709.12 · 48 $1,407,374,883,553.28 (> Musk's ≈ $865B, Bloomberg Nov 2026).
 * Cash props: a $10,000 brick = 100 × $100 bills; a pallet of $100 bills ≈ $100M (stand-in scale).
 */
window.buildFilm = (A) => {
  const { THREE, T, W, H, clamp, lerp, ease, easeOut, spring, hash, ev, box, sign, person, walkPose, idlePose, mat, hudText, instanced, camera } = A;
  const MB = { metalness: 0.3, roughness: 0.28 }, GL = { metalness: 0.6, roughness: 0.08 };
  const val = (d) => 0.01 * Math.pow(2, d - 1);
  const DAYS = () => [[2, 1], [3, 2], [4, 5], [5, 10], [6, 15], [7, 20], [8, 25], [9, 27], [10, 28], [11, 29], [12, 30], [13, 48]].map(([n, d]) => [T('day', n), d]);
  function dayAt(t) { // integer day, rolling up through the skipped days just before each key
    const K = DAYS(); if (t < K[0][0]) return 0; let d = 1;
    for (let i = 1; i < K.length; i++) { const [tk, dk] = K[i], prev = K[i - 1][1], p = clamp((t - (tk - 0.5)) / 0.5); if (p > 0) d = Math.round(lerp(prev, dk, p)); }
    return d;
  }
  const fmt = (v) => v < 1 ? `${Math.round(v * 100)}¢` : '$' + v.toLocaleString('en-US', { minimumFractionDigits: v < 1000 ? 2 : 0, maximumFractionDigits: v < 1000 ? 2 : 0 });
  const crowdCols = ['#c0392b', '#ecf0f1', '#2c6fb0', '#f1c40f', '#1f3b63', '#e67e22', '#27ae60', '#8e44ad'];
  const skinTones = ['#f1c7a5', '#e8b48f', '#c68a5e', '#a8754f', '#7a4f33'];
  const minifig = (k = 1) => [{ w: 0.42 * k, h: 0.55 * k, d: 0.26 * k, c: '#fff', tint: true, x: 0, y: 0.75 * k, z: 0, cast: false }, { w: 0.34 * k, h: 0.34 * k, d: 0.34 * k, c: '#fff', tint: true, x: 0, y: 1.2 * k, z: 0, cast: false }, { w: 0.38 * k, h: 0.5 * k, d: 0.24 * k, c: '#2c3e5c', x: 0, y: 0.25 * k, z: 0, cast: false }];
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const glowTex = canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,200,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const sprite = (g, color, s, x, y, z, op = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.scale.setScalar(s); sp.position.set(x, y, z); g.add(sp); return sp; };
  const copper = { metalness: 0.85, roughness: 0.28 };
  const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20);
  const brickParts = () => [{ w: 0.62, h: 0.24, d: 0.3, c: '#7fa36a', x: 0, y: 0.12, z: 0 }, { w: 0.14, h: 0.245, d: 0.305, c: '#e9dcc4', x: 0, y: 0.12, z: 0, cast: false }];
  // brick stack layout: a growing pyramid-ish block
  const brickSlot = (i, ox) => { const per = 10 * 6; const lv = Math.floor(i / per), k = i % per; return { x: ox + (k % 10) * 0.64 - 2.9, y: lv * 0.25, z: -Math.floor(k / 10) * 0.32 }; };

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, sky, extra = {}) => { const group = new THREE.Group(); sets[name] = { group, sky, ...extra }; return group; };

  // STAGE: game show — briefcase vs one penny
  let fans, fanList = [], bigPenny;
  {
    const g = mk('STAGE', '#120e1c', { skyTop: '#07060c', sun: [2, 20, 10], sunI: 2.0, sunColor: '#fff6e0', hemi: 0.7, hemiSky: '#b0a0ff', hemiGround: '#1a1424', fogNear: 40, fogFar: 120, shadow: 16, ground: '#1a1424', exposure: 1.2 });
    box(g, 60, 0.2, 60, '#1a1424', 0, -0.1, -10, { cast: false });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.4, 0.6, 64), mat('#2b2f3a', { metalness: 0.5, roughness: 0.2 })); disc.position.set(0, 0.3, -6); disc.receiveShadow = true; g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.08, 6, 96), new THREE.MeshBasicMaterial({ color: '#ffd23f' })); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.62, -6); g.add(ring);
    // podiums
    [-3.4, 3.4].forEach((x, i) => { box(g, 2.6, 2.2, 2.6, i ? '#c0392b' : '#2c6fb0', x, 1.7, -6, { mat: MB }); box(g, 2.8, 0.2, 2.8, '#ffd23f', x, 2.85, -6, { mat: { metalness: 0.8, roughness: 0.25 } }); });
    // briefcase full of cash (left)
    const bc = new THREE.Group(); bc.position.set(-3.4, 2.95, -6); g.add(bc);
    box(bc, 1.8, 0.35, 1.2, '#1b1b24', 0, 0.18, 0, { mat: MB }); const lid = box(bc, 1.8, 0.12, 1.2, '#1b1b24', 0, 0.7, -0.62, { mat: MB }); lid.rotation.x = -1.2;
    for (let k = 0; k < 12; k++) box(bc, 0.5, 0.14, 0.26, '#7fa36a', -0.6 + (k % 3) * 0.6, 0.38, -0.4 + Math.floor(k / 3) * 0.27, { cast: false });
    sign(g, ['$1,000,000'], 2.4, 0.8, -3.4, 1.6, -4.68, { bg: '#1b1b24', fg: '#7ee08a', glow: 0.8 });
    // the penny (right)
    bigPenny = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 48), mat('#b8733a', copper)); bigPenny.rotation.x = Math.PI / 2; bigPenny.position.set(3.4, 4.0, -6); bigPenny.castShadow = true; g.add(bigPenny);
    box(g, 0.08, 1.0, 0.08, '#c9ced4', 3.4, 3.4, -6, { mat: { metalness: 0.8 } });
    sign(g, ['1¢ × 2 EVERY DAY'], 2.4, 0.8, 3.4, 1.6, -4.68, { bg: '#1b1b24', fg: '#ffb070', glow: 0.8 });
    sprite(g, '#fff0c0', 7, -3.4, 7, -6, 0.5); sprite(g, '#fff0c0', 7, 3.4, 7, -6, 0.5);
    // LED wall
    box(g, 30, 12, 0.4, '#0b0a12', 0, 6, -18, { cast: false });
    sign(g, ['$1,000,000', 'OR', '1¢ DOUBLED'], 14, 7, 0, 8, -17.75, { bg: '#0b0a12', fg: '#ffd23f', glow: 1.2 });
    for (let k = 0; k < 10; k++) { const b = box(g, 0.3, 8, 0.3, ['#ff3ab0', '#3ad8ff'][k % 2], -14 + k * 3.1, 4, -17.6, { cast: false, mat: { emissive: ['#ff3ab0', '#3ad8ff'][k % 2], emissiveIntensity: 2.5 } }); }
    // crowd on risers behind camera sides
    for (let r = 0; r < 6; r++) for (let k = 0; k < 26; k++) { const side = k < 13 ? -1 : 1, kk = k % 13; fanList.push({ x: side * (11 + r * 1.0), y: 0.2 + r * 0.55, z: -12 + kk * 1.4, ry: side > 0 ? -Math.PI / 2 : Math.PI / 2 }); }
    fanList.forEach((f, i) => box(g, 1.0, f.y + 0.01, 1.4, '#2a2436', f.x, f.y / 2, f.z, { cast: false }));
    fans = instanced(g, minifig(0.95), fanList.length);
    fanList.forEach((f, i) => { fans.color(i, 0, crowdCols[Math.floor(hash(i) * 8)]); fans.color(i, 1, skinTones[Math.floor(hash(i * 3) * 5)]); });
    sets.STAGE.update = (s) => { bigPenny.rotation.z = s.t * 1.6; fanList.forEach((f, i) => fans.place(i, { ...f, y: f.y + Math.max(0, Math.sin(s.t * 7 + hash(i) * 20)) * 0.12 })); fans.done(); };
  }

  // TABLE: pennies piling up (up to 16,384 coins on day 15)
  let coins;
  {
    const g = mk('TABLE', '#2a2026', { skyTop: '#18121a', sun: [4, 14, 8], sunI: 2.2, sunColor: '#ffe6c0', hemi: 0.6, fogNear: 10, fogFar: 40, shadow: 6, ground: '#2a2026', exposure: 1.2 });
    box(g, 14, 0.4, 8, '#7a4a2e', 0, -0.2, -2, { mat: { roughness: 0.5 } }); box(g, 40, 0.2, 40, '#1a1418', 0, -3, -2, { cast: false });
    const lampL = new THREE.PointLight(0xffd890, 20, 14, 1.6); lampL.position.set(0, 4, -1); g.add(lampL);
    const N = 16384; coins = new THREE.InstancedMesh(coinGeo, mat('#b8733a', copper), N); coins.castShadow = true; coins.receiveShadow = true; coins.frustumCulled = false; g.add(coins);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(0.18, 0.18, 0.18);
    const slot = []; // a heap: pile radius grows with count
    for (let i = 0; i < N; i++) { const r = Math.sqrt(i / N) * 3.2, a = i * 2.39996, h = Math.max(0, 1.6 * (1 - r / 3.3)) * hash(i * 1.7); slot.push([Math.cos(a) * r * 1.3, 0.02 + h + (i < 16 ? 0 : 0), Math.sin(a) * r * 0.8 - 1.6, hash(i) * 0.6, hash(i * 3) * 6]); }
    for (let i = 0; i < 16; i++) slot[i] = [-0.9 + (i % 8) * 0.24, 0.02 + Math.floor(i / 8) * 0.016, 0.4, 0, 0];
    coins.userData.set = (n) => { for (let i = 0; i < N; i++) { const [x, y, z, rx, ry] = slot[i]; if (i < n) { E.set(rx, ry, 0); Q.setFromEuler(E); M.compose(P.set(x, y, z), Q, S); } else M.makeScale(0, 0, 0); coins.setMatrixAt(i, M); } coins.instanceMatrix.needsUpdate = true; };
    sets.TABLE.update = (s) => { const d = dayAt(s.t); const n = d < 1 ? 0 : Math.min(N, Math.round(val(d) * 100)); coins.userData.set(n); };
  }

  // FRIEND: your friend drives off in a Lamborghini
  let friendCar, friend;
  {
    const g = mk('FRIEND', '#cfe6f6', { skyTop: '#5f9fe0', sun: [30, 40, 25], sunI: 2.8, hemi: 1.1, fogNear: 80, fogFar: 300, shadow: 24 });
    box(g, 400, 0.1, 400, '#9aa0a8', 0, -0.05, -100, { cast: false }); for (let i = 0; i < 20; i++) box(g, 0.2, 0.02, 3, '#f4f6f8', 0, 0.01, 10 - i * 8, { cast: false });
    box(g, 30, 8, 14, '#eef1f4', -20, 4, -20); box(g, 30.2, 5, 0.3, '#5c86a8', -20, 3, -12.9, { cast: false, mat: GL }); sign(g, ['SUPERCARS'], 12, 2, -20, 7, -12.7, { bg: '#1b1b24', fg: '#ffd23f' });
    friendCar = new THREE.Group(); g.add(friendCar);
    box(friendCar, 2.1, 0.5, 4.7, '#f1c40f', 0, 0.5, 0, { mat: MB }); box(friendCar, 1.6, 0.42, 1.8, '#f1c40f', 0, 0.92, -0.3, { mat: MB }); box(friendCar, 1.62, 0.36, 1.6, '#14161c', 0, 0.95, -0.25, { cast: false, mat: GL });
    box(friendCar, 2.2, 0.1, 0.6, '#14161c', 0, 1.0, -2.2); [[-1.05, -1.5], [1.05, -1.5], [-1.05, 1.5], [1.05, 1.5]].forEach(([dx, dz]) => { box(friendCar, 0.28, 0.72, 0.72, '#16171c', dx, 0.36, dz); box(friendCar, 0.3, 0.32, 0.32, '#c9ced4', dx, 0.36, dz, { cast: false }); });
    friend = person(g, { body: '#2c6fb0', legs: '#26262c', hair: '#3a2a20' }, 0, 0, { ry: 0 }); friend.root.scale.setScalar(0.6); friendCar.add(friend.root); friend.root.position.set(0, 0.7, -0.2);
    sets.FRIEND.update = (s) => { const lt = s.t - T('lamborghini'); const k = Math.max(0, lt - 0.3); friendCar.position.set(4, 0, 6 - k * k * 6); friend.armR.rotation.x = -2.8; };
  }

  // RACE: two piles of $10k bricks — FRIEND (100 bricks) vs YOU
  let mine, theirs;
  {
    const g = mk('RACE', '#2a2e3a', { skyTop: '#16181f', sun: [6, 22, 14], sunI: 2.2, hemi: 0.9, fogNear: 30, fogFar: 110, shadow: 22, ground: '#20232c', exposure: 1.2 });
    box(g, 60, 0.2, 60, '#3a3f4c', 0, -0.1, -10, { cast: false, mat: { roughness: 0.25, metalness: 0.2 } });
    for (let z = 4; z > -40; z -= 8) { box(g, 50, 0.12, 0.5, '#fff6e0', 0, 12, z, { cast: false, mat: { emissive: '#fff6e0', emissiveIntensity: 1.2 } }); }
    box(g, 0.2, 0.02, 30, '#ffd23f', 0, 0.01, -10, { cast: false });
    theirs = instanced(g, brickParts(), 100); for (let i = 0; i < 100; i++) theirs.place(i, brickSlot(i, -4.2)); theirs.done();
    mine = instanced(g, brickParts(), 560);
    sign(g, ['FRIEND · $1,000,000'], 6, 1.2, -4.2, 6, -6, { bg: '#1b1b24', fg: '#ffffff', glow: 0.5 }); sign(g, ['YOU · PENNY'], 6, 1.2, 4.2, 6, -6, { bg: '#1b1b24', fg: '#ffb070', glow: 0.5 });
    sets.RACE.update = (s) => { const d = dayAt(s.t); const n = Math.min(560, Math.floor(val(d) / 10000)); const part = (val(d) % 10000) / 10000; for (let i = 0; i < 560; i++) mine.place(i, i < n ? brickSlot(i, 4.2) : (i === n && d >= 18 ? { ...brickSlot(i, 4.2), sy: Math.max(0.05, part) } : { hide: true })); mine.done(); };
  }

  // MOUNTAIN: day 48 — $1.4 trillion as 14,000 pallets ($100M each)
  {
    const g = mk('MOUNTAIN', '#ffd2a0', { skyTop: '#6fa0d8', sun: [-30, 18, -40], sunI: 3.0, sunColor: '#ffcf9a', hemi: 1.0, fogNear: 300, fogFar: 1400, shadow: 120, ground: '#9aa0a8' });
    box(g, 3000, 0.1, 3000, '#c9b896', 0, -0.05, -300, { cast: false });
    const n = 14000, pal = instanced(g, [{ w: 1.6, h: 0.18, d: 1.2, c: '#a07850', x: 0, y: 0.09, z: 0 }, { w: 1.5, h: 1.3, d: 1.1, c: '#6f9a5e', x: 0, y: 0.83, z: 0 }], n);
    for (let i = 0; i < n; i++) { const a = i * 2.39996, r = Math.sqrt(i) * 1.15, h = Math.max(0, 22 - r * 0.33); const lv = Math.floor(hash(i * 3.1) * (h / 1.5 + 1)); pal.place(i, { x: Math.cos(a) * r, y: lv * 1.5, z: Math.sin(a) * r - 120, ry: hash(i) * 0.3 }); }
    pal.done();
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
    const t = s.t, d = dayAt(t), endT = T('so', 1);
    if (d >= 1 && t < endT) {
      const v = val(d), win = v > 1e6;
      hudText(g, `DAY ${d}`, 80, 880, '74px Anton', '#ffffff', { stroke: 10 });
      hudText(g, 'YOUR PENNY', 80, 960, '800 32px Montserrat', 'rgba(255,255,255,0.92)', { shadow: 10, stroke: 5 });
      const txt = fmt(v); hudText(g, txt, 80, 1080, `${fitText(g, txt, 'Anton', 120, 840)}px Anton`, win ? '#7ee08a' : '#ffb070', { stroke: 14 });
      // race bars: you vs friend (linear, so the penny looks like nothing until the end)
      const max = 5.4e6, x0 = 80, wMax = 820, y = 1130;
      const fw = wMax * 1e6 / max, yw = Math.min(wMax, wMax * v / max);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x0, y, wMax, 44);
      g.fillStyle = '#7ea0e0'; g.fillRect(x0, y, fw, 20); g.fillStyle = win ? '#7ee08a' : '#ffb070'; g.fillRect(x0, y + 24, Math.max(3, yw), 20);
      hudText(g, 'FRIEND $1M', x0 + fw + 10, y + 18, '800 18px Montserrat', '#cfe0ff');
      hudText(g, 'YOU', x0 + Math.max(3, yw) + 10, y + 42, '800 18px Montserrat', '#ffffff');
    }
    stamp(g, t, T('lamborghini'), 'FRIEND: LAMBORGHINI', 'MEANWHILE YOU HAVE $5.12', '#7ea0e0', 2.0, 'pop');
    stamp(g, t, T('losing'), 'LOSING', 'DAY 20 · $5,242.88 vs $1,000,000', '#ff5a4a', 2.0, 'hit');
    stamp(g, t, T('passed'), 'YOU PASS HIM', 'DAY 28 · $1,342,177.28', '#7ee08a', 2.2);
    stamp(g, t, T('times'), '$5,368,709.12', 'DAY 30 · 5.4× THE MILLION', '#7ee08a', 2.4);
    stamp(g, t, T('musk'), '$1,407,374,883,553', 'DAY 48 · MORE THAN ELON MUSK', '#ffd23f', Math.min(2.4, T('so', 1) - T('musk') - 0.05));
    bigLine(g, t, endT, 1e9, 'WOULD YOU HAVE', '#ffffff', 330, 120);
    bigLine(g, t, endT + 0.25, 1e9, 'TAKEN THE $1M?', '#ffd23f', 470, 120);
  }

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update) => shots.push({ id, t0, set, cam, update });
  const pov = (x, y, z, lx, ly, lz, fov = 62, extra = {}) => ({ pos: [x, y, z], look: [lx, ly, lz], fov, hands: false, ...extra });
  const raceCam = (s, x, y, z, lx, ly, lz, fov = 56) => pov(x, y + 1.0, z + 1.5, lx, ly - 2.6, lz, fov);

  shot('S1', 0, 'STAGE', (s) => { const k = ease(s.p); return pov(0, 3.6 + k * 0.4, 6 - k * 3, 0, 3.4, -6, 58); });
  shot('S2', T('penny'), 'STAGE', (s) => pov(1.4, 4.2, -1.6 + s.lt * 0.1, 3.4, 3.7, -6, 46));
  shot('S3', T('pick'), 'STAGE', (s) => pov(-1.8 - s.lt * 0.3, 3.8, -2.6, -3.4, 3.2, -6, 44));
  shot('S4', T('most'), 'STAGE', (s) => { const k = ease(s.p); return pov(lerp(-8, 8, k), 6, 8, 0, 2.8, -8, 60); });
  shot('C1', T('day', 2), 'TABLE', (s) => pov(0.2, 1.4 - s.lt * 0.05, 2.6, -0.4, 0.1, 0.2, 42));
  shot('C1b', T('day', 4), 'TABLE', (s) => pov(-1.6 + s.lt * 0.2, 1.0, 1.8, -0.2, 0.05, 0.3, 40));
  shot('C2', T('day', 5), 'TABLE', (s) => pov(2.4 - s.lt * 0.2, 2.2, 2.6, -0.2, 0.2, -0.6, 48));
  shot('L1', T('your', 1), 'FRIEND', (s) => pov(-4 + s.lt * 0.4, 1.8, 14, 4, 0.8, 0, 50));
  shot('C3', T('day', 6), 'TABLE', (s) => { const k = ease(s.p); return pov(lerp(3, 5, k), lerp(3, 6, k), lerp(4, 7, k), 0, 0.4, -1.6, 52); });
  shot('R1', T('day', 7), 'RACE', (s) => raceCam(s, 1.2 - s.lt * 0.2, 2.6, 7.5, 0.4, 0.5, -1, 50));
  shot('R1b', T('weeks'), 'RACE', (s) => raceCam(s, -6.5 + s.lt * 0.5, 2.2, 3.5, -2, 0.5, -1, 50));
  shot('R2', T('day', 8), 'RACE', (s) => raceCam(s, 6.5 - s.lt * 0.4, 2.4, 4.5, 2.5, 0.5, -1, 52));
  shot('R3', T('day', 9), 'RACE', (s) => raceCam(s, 0, 4.0 + s.lt * 0.2, 12, 0, 0.6, -1, 56));
  shot('R4', T('day', 10), 'RACE', (s) => raceCam(s, 0.3, 1.6 + s.lt * 0.4, 7.5, 0.6, 1.0, -1, 56));
  shot('R4b', T('day', 11), 'RACE', (s) => raceCam(s, 8 - s.lt * 0.4, 3.2, 6.5, 2.5, 1.0, -1, 52));
  shot('R5', T('day', 12), 'RACE', (s) => { const k = ease(s.p); return raceCam(s, lerp(1, 3, k), lerp(3, 4.5, k), lerp(9, 12, k), 1.2, 1.2, -1.2, 54); });
  shot('R5b', T('more', 1), 'RACE', (s) => raceCam(s, 4.2 + s.lt * 0.2, 4.5, 4.0, 4.2, 1.2, -1.2, 58));
  shot('R6', T('almost'), 'RACE', (s) => raceCam(s, -7 + s.lt * 1.0, 3, 8, 2.5, 1.6, -1.2, 50));
  shot('M1', T('and', 3), 'MOUNTAIN', (s) => { const k = ease(s.p); return pov(lerp(60, 140, k), lerp(20, 120, k), lerp(40, 160, k), 0, 6, -120, 52); });
  shot('E1', T('so', 1), 'STAGE', (s) => pov(0, 3.8, 3 - s.lt * 0.6, 0, 3.4, -6, 56));
  shot('E2', T('tell'), 'STAGE', (s) => pov(-6 + s.lt * 1.4, 7, 10, 0, 3, -6, 58));

  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, wipes: [], end: A.duration };
};

/* "$1 million now, or a penny doubled every day for 30 days?" — HQ version.
 * Real-scale props: a US cent is 19.05 mm × 1.52 mm; a $10,000 strap of $100 bills is 156 × 66 × ~11 mm
 * ($1M = 100 straps, it fits in a suitcase); a pallet of $100 bills ≈ $100M.
 * Math: day n = $0.01 × 2^(n−1) → day 30 $5,368,709.12; day 48 $1.407 trillion (> Musk's ≈ $865B, Bloomberg Nov 2026).
 */
window.FILM_ASSETS = {
  models: [['xbot', 'hq/assets/Xbot.glb'], ['michelle', 'hq/assets/Michelle.glb'], ['car', 'hq/assets/ferrari.glb'],
    ['table', 'hq/assets/WoodenTable_01/WoodenTable_01_1k.gltf'], ['lamp', 'hq/assets/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf'], ['case', 'hq/assets/vintage_suitcase/vintage_suitcase_1k.gltf']],
  hdr: [['studio', 'hq/assets/studio.hdr'], ['sky', 'hq/assets/desert.hdr']],
};
window.buildFilm = (A) => {
  const { THREE, X, T, W, H, clamp, lerp, ease, easeOut, smooth, hash, ev, ASSETS, instance, label, figure, rule } = A;
  const RB = X.RoundedBoxGeometry;
  const val = (d) => 0.01 * Math.pow(2, d - 1);
  const DAYS = () => [[2, 1], [3, 2], [4, 5], [5, 10], [6, 15], [7, 20], [8, 25], [9, 27], [10, 28], [11, 29], [12, 30], [13, 48]].map(([n, d]) => [T('day', n), d]);
  function dayAt(t) { const K = DAYS(); if (t < K[0][0]) return 0; let d = 1; for (let i = 1; i < K.length; i++) { const [tk, dk] = K[i], prev = K[i - 1][1], p = clamp((t - (tk - 0.5)) / 0.5); if (p > 0) d = Math.round(lerp(prev, dk, p)); } return d; }
  const money = (v, cents = true) => v < 1 ? `${Math.round(v * 100)}¢` : '$' + v.toLocaleString('en-US', { minimumFractionDigits: cents && v < 1e4 ? 2 : 0, maximumFractionDigits: cents && v < 1e4 ? 2 : 0 });
  const std = (o) => new THREE.MeshStandardMaterial(o);
  function canvasTex(w, h, draw, srgb = true) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

  /* ─── materials: generic currency look (no real banknote design) ─── */
  const billTex = canvasTex(512, 220, (g) => { g.fillStyle = '#cfd9c4'; g.fillRect(0, 0, 512, 220); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(70,100,80,${0.08 + hash(i) * 0.1})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, i * 4); g.bezierCurveTo(170, i * 4 + 30, 340, i * 4 - 30, 512, i * 4 + 10); g.stroke(); } g.strokeStyle = '#56735e'; g.lineWidth = 5; g.strokeRect(12, 12, 488, 196); g.fillStyle = 'rgba(86,115,94,0.55)'; g.beginPath(); g.ellipse(300, 110, 58, 72, 0, 0, 6.3); g.fill(); g.fillStyle = '#4a6652'; g.font = '600 52px Garamond'; g.fillText('100', 30, 70); g.fillText('100', 400, 196); g.font = '500 20px Garamond'; g.fillText('ONE HUNDRED', 40, 190); });
  const edgeTex = canvasTex(16, 64, (g) => { for (let y = 0; y < 64; y += 2) { g.fillStyle = (y / 2) % 2 ? '#dfe6d6' : '#b9c6ad'; g.fillRect(0, y, 16, 2); } });
  const bandTex = canvasTex(256, 64, (g) => { g.fillStyle = '#d6a93a'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#5a4a20'; g.font = '600 28px Inter'; g.textAlign = 'center'; g.fillText('$10,000', 128, 42); });
  const edge = std({ map: edgeTex, roughness: 0.85 }), face = std({ map: billTex, roughness: 0.7 });
  const strapMats = [edge, edge, face, face, edge, edge];
  const strapGeo = new THREE.BoxGeometry(0.156, 0.011, 0.066);
  const bandGeo = new THREE.BoxGeometry(0.04, 0.0115, 0.0665); const bandMat = std({ map: bandTex, roughness: 0.6 });
  function straps(parent, n) { const a = new THREE.InstancedMesh(strapGeo, strapMats, n), b = new THREE.InstancedMesh(bandGeo, bandMat, n); [a, b].forEach((m) => { m.castShadow = m.receiveShadow = true; m.frustumCulled = false; parent.add(m); }); return { a, b, n }; }
  const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _P = new THREE.Vector3(), _S = new THREE.Vector3(1, 1, 1), _Z = new THREE.Matrix4().makeScale(0, 0, 0);
  function layStraps(st, count, cols, rows, origin, partial = 0) { // neat stack of straps (cols × rows per layer); `partial` = loose bills on top
    for (let i = 0; i < st.n; i++) {
      if (i === count && partial > 0.004) { const per = cols * rows, lv = Math.floor(i / per), k = i % per; _M.compose(_P.set(origin[0] + (k % cols) * 0.16, origin[1] + lv * 0.0112 + 0.0055 * partial, origin[2] + Math.floor(k / cols) * 0.069), _Q.identity(), new THREE.Vector3(1, partial, 1)); st.a.setMatrixAt(i, _M); st.b.setMatrixAt(i, _Z); continue; }
      if (i >= count) { st.a.setMatrixAt(i, _Z); st.b.setMatrixAt(i, _Z); continue; }
      const per = cols * rows, lv = Math.floor(i / per), k = i % per;
      _Q.setFromEuler(_E.set(0, (hash(i) - 0.5) * 0.05, 0)); _M.compose(_P.set(origin[0] + (k % cols) * 0.16, origin[1] + 0.0055 + lv * 0.0112, origin[2] + Math.floor(k / cols) * 0.069), _Q, _S);
      st.a.setMatrixAt(i, _M); st.b.setMatrixAt(i, _M);
    }
    st.a.instanceMatrix.needsUpdate = st.b.instanceMatrix.needsUpdate = true;
  }
  const coinFace = canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, '#e0a070'); gr.addColorStop(1, '#94522c'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#6a3a20'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 116, 0, 6.3); g.stroke(); g.fillStyle = '#6e3c22'; g.font = '500 92px Garamond'; g.textAlign = 'center'; g.fillText('1¢', 128, 150); g.font = '500 22px Garamond'; g.fillText('ONE CENT', 128, 205); });
  const copperEdge = std({ color: '#c07a46', metalness: 1, roughness: 0.32 }), copperFace = std({ map: coinFace, color: '#ffd2a8', metalness: 1, roughness: 0.34 });
  const coinGeo = new THREE.CylinderGeometry(0.009525, 0.009525, 0.00152, 28);

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, extra) => { const group = new THREE.Group(); sets[name] = { group, ...extra }; return group; };
  const spot = (g, col, I, pos, target, angle = 0.5, pen = 0.6, shadow = false) => { const l = new THREE.SpotLight(col, I, 60, angle, pen, 2); l.position.set(...pos); l.target.position.set(...target); g.add(l, l.target); if (shadow) { l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.radius = 3; l.shadow.bias = -0.0002; } return l; };

  // STUDIO: game-show stage. Left podium: the friend's $1M (100 straps). Right podium: your pile.
  let you, friend, myStack, bigPenny, ledTex, ledCv;
  {
    const g = mk('STUDIO', { env: 'studio', envI: 0.3, bg: '#07060c', fog: ['#07060c', 9, 30], exposure: 0.85, bloom: 0.12 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 96), std({ color: '#141019', roughness: 0.16, metalness: 0.4 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.22, 128), std({ color: '#25212e', roughness: 0.22, metalness: 0.6 })); disc.position.y = 0.11; disc.castShadow = disc.receiveShadow = true; g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.025, 8, 200), new THREE.MeshBasicMaterial({ color: '#ffcf5a' })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.225; g.add(ring);
    [[-1.3, '#1d355c'], [1.3, '#6e1a26']].forEach(([x, col]) => {
      const b = new THREE.Mesh(new RB(1.1, 1.0, 1.1, 6, 0.06), std({ color: col, roughness: 0.38, metalness: 0.15 })); b.position.set(x, 0.72, -0.9); b.castShadow = b.receiveShadow = true; g.add(b);
      const top = new THREE.Mesh(new RB(1.18, 0.06, 1.18, 4, 0.02), std({ color: '#d8b25a', roughness: 0.22, metalness: 1 })); top.position.set(x, 1.25, -0.9); top.castShadow = top.receiveShadow = true; g.add(top);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: x < 0 ? '#7fb0ff' : '#ffb070' })); strip.position.set(x, 0.3, -0.33); g.add(strip);
    });
    const fr = straps(g, 100); layStraps(fr, 100, 5, 4, [-1.3 - 0.32, 1.28, -0.9 - 0.1]);
    myStack = straps(g, 560);
    const cs = instance('case'); cs.root.rotation.y = -0.4; cs.root.updateMatrixWorld(true); { const bb = new THREE.Box3().setFromObject(cs.root); const sz = bb.getSize(new THREE.Vector3()); const k = 0.45 / Math.max(sz.x, sz.z); cs.root.scale.setScalar(k); cs.root.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(cs.root); cs.root.position.set(-1.3 + 0.3 - (b2.min.x + b2.max.x) / 2, 1.28 - b2.min.y, -0.75 - (b2.min.z + b2.max.z) / 2); } g.add(cs.root);
    // the display penny
    bigPenny = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 96), [copperEdge, copperFace, copperFace]); bigPenny.rotation.x = Math.PI / 2; bigPenny.position.set(1.3, 1.62, -0.9); bigPenny.castShadow = true; g.add(bigPenny);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 16), std({ color: '#c9ced4', metalness: 1, roughness: 0.2 })); stem.position.set(1.3, 1.44, -0.9); g.add(stem);
    // LED wall + neon columns
    ledCv = document.createElement('canvas'); ledCv.width = 1024; ledCv.height = 512; ledTex = new THREE.CanvasTexture(ledCv); ledTex.colorSpace = THREE.SRGBColorSpace;
    const led = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), new THREE.MeshBasicMaterial({ map: ledTex, color: '#9a9a9a' })); led.position.set(0, 3.6, -7); g.add(led);
    for (let k = 0; k < 12; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5, 12), new THREE.MeshBasicMaterial({ color: k % 2 ? '#ff4fc0' : '#4fd8ff', toneMapped: false })); const a = Math.PI * (0.15 + 0.7 * k / 11); c.position.set(-Math.cos(a) * 7, 2.5, -Math.sin(a) * 5 - 1); g.add(c); }
    spot(g, 0xfff0dc, 70, [2.5, 7, 4.5], [0, 1, -0.5], 0.45, 0.7, true);
    spot(g, 0xffe4c4, 30, [-1.3, 6, -0.5], [-1.3, 1.2, -0.9], 0.18, 0.5);
    spot(g, 0xffe4c4, 30, [1.3, 6, -0.5], [1.3, 1.2, -0.9], 0.18, 0.5);
    spot(g, 0x7fa8ff, 45, [-5, 4, -5], [0, 1.2, 0], 0.5, 0.8);
    spot(g, 0xff7ad0, 30, [5, 3, -5], [0, 1.2, 0], 0.5, 0.8);
    you = instance('xbot', { tint: '#8d939e', additive: ['agree', 'headShake', 'sad_pose', 'sneak_pose'] }); you.root.position.set(0.0, 0.22, 0.35); g.add(you.root);
    friend = instance('michelle'); friend.root.position.set(-2.35, 0.22, -0.2); friend.root.rotation.y = 0.5; g.add(friend.root);
    sets.STUDIO.update = (s) => {
      const t = s.t, d = dayAt(t);
      bigPenny.rotation.z = t * 0.9;
      const v = d >= 1 ? val(d) : 0, n = Math.min(560, Math.floor(v / 10000)); layStraps(myStack, n, 6, 4, [1.3 - 0.4, 1.28, -0.9 - 0.1], n < 560 ? (v % 10000) / 10000 : 0);
      // you: idle; head shake on "Most people grab the million"; sad when losing; agree when you pass him
      const sad = t > T('losing') - 0.3 && t < T('day', 10) - 0.2, cheer = t > T('passed') - 0.2 && t < T('so', 1);
      const sadW = sad ? clamp((t - T('losing') + 0.3) / 0.4) : 0, shakeW = t > T('most') && t < T('most') + 2.2 ? Math.sin(Math.PI * clamp((t - T('most')) / 2.2)) : 0, agreeW = cheer ? Math.sin(Math.PI * clamp((t - T('passed') + 0.2) / 2.4)) : 0;
      you.act([['idle', 1, t], ['sad_pose', sadW, 0.5], ['headShake', shakeW, t - T('most')], ['agree', agreeW, t - T('passed')]]);
      friend.pose('SambaDance', t + 3);
      drawLED(t);
    };
  }
  function drawLED(t) {
    const g = ledCv.getContext('2d'); g.fillStyle = '#05040a'; g.fillRect(0, 0, 1024, 512);
    for (let y = 0; y < 512; y += 4) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(0, y, 1024, 1); }
    g.textAlign = 'center'; g.fillStyle = '#ffd98a'; g.font = '500 120px Garamond'; g.fillText('$1,000,000', 512, 200);
    g.font = '600 34px Inter'; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText('O R', 512, 270);
    g.font = '500 110px Garamond'; g.fillStyle = '#ffb27a'; g.fillText('1¢ × 2 × 30 days', 512, 400);
    ledTex.needsUpdate = true;
  }

  // TABLE: real-size pennies piling up under a desk lamp
  let coins, coinSlots = [];
  {
    const g = mk('TABLE', { env: 'studio', envI: 0.15, bg: '#0a0807', fog: ['#0a0807', 1.2, 4], exposure: 0.85, bloom: 0.1 });
    const room = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), std({ color: '#1a1412', roughness: 0.9 })); room.rotation.x = -Math.PI / 2; room.receiveShadow = true; g.add(room);
    const tb = instance('table'); g.add(tb.root);
    const lp = instance('lamp'); lp.root.position.set(0.55, 0.55, -0.12); lp.root.rotation.y = -2.2; g.add(lp.root);
    const bulb = spot(g, 0xffd7a0, 2.2, [0.42, 0.98, -0.05], [0.0, 0.55, 0.05], 0.75, 0.8, true);
    spot(g, 0x8fb0ff, 0.8, [-1.5, 1.4, 1.5], [0, 0.55, 0], 0.6, 0.9);
    const N = 16384; coins = new THREE.InstancedMesh(coinGeo, [copperEdge, copperFace, copperFace], N); coins.castShadow = coins.receiveShadow = true; coins.frustumCulled = false; g.add(coins);
    for (let i = 0; i < N; i++) { // a heap: newest coins land on top/outside
      if (i < 16) { coinSlots.push([-0.12 + (i % 8) * 0.024, 0.551 + Math.floor(i / 8) * 0.0016, 0.12, 0, 0]); continue; }
      const r = Math.sqrt(i / N) * 0.17 + hash(i * 9) * 0.01, a = i * 2.39996, hgt = Math.max(0, 0.07 * (1 - r / 0.18)) * (0.4 + 0.6 * hash(i * 1.7));
      coinSlots.push([0.02 + Math.cos(a) * r * 1.2, 0.551 + hgt, -0.02 + Math.sin(a) * r * 0.9, (hash(i) - 0.5) * 0.7, hash(i * 3) * 6]);
    }
    sets.TABLE.update = (s) => { const d = dayAt(s.t); const n = d < 1 ? 0 : Math.min(N, Math.round(val(d) * 100)); for (let i = 0; i < N; i++) { if (i >= n) { coins.setMatrixAt(i, _Z); continue; } const [x, y, z, rx, ry] = coinSlots[i]; _Q.setFromEuler(_E.set(rx, ry, 0)); _M.compose(_P.set(x, y, z), _Q, _S); coins.setMatrixAt(i, _M); } coins.instanceMatrix.needsUpdate = true; };
  }

  // SHOWROOM: the friend's supercar + the friend dancing
  let friend2, car;
  {
    const g = mk('SHOWROOM', { env: 'studio', envI: 0.5, bg: '#2a2d33', fog: ['#2a2d33', 12, 40], exposure: 0.85, bloom: 0.1 });
    const fl = new THREE.Mesh(new THREE.CircleGeometry(40, 96), std({ color: '#5a5f68', roughness: 0.12, metalness: 0.3 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 10, 96, 1, true, Math.PI * 0.6, Math.PI * 0.8), std({ color: '#3a3e46', roughness: 0.9, side: THREE.BackSide })); wall.position.set(0, 5, 2); g.add(wall);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.3, 0.16, 96), std({ color: '#f4f5f7', roughness: 0.3 })); plinth.position.y = 0.08; plinth.receiveShadow = true; g.add(plinth);
    car = instance('car'); car.root.position.set(0, 0.16, 0); car.root.rotation.y = 2.4; g.add(car.root);
    car.root.traverse((o) => { if (o.isMesh && o.material && /body/i.test(o.material.name || '')) { o.material = o.material.clone(); o.material.color.set('#f1b400'); } });
    friend2 = instance('michelle'); friend2.root.position.set(1.8, 0.16, 1.4); friend2.root.rotation.y = -0.6; g.add(friend2.root);
    spot(g, 0xffffff, 90, [3, 8, 5], [0, 0.6, 0], 0.5, 0.8, true);
    spot(g, 0xbcd0ff, 35, [-5, 5, 3], [0, 0.8, 0], 0.6, 0.9);
    sets.SHOWROOM.update = (s) => { friend2.pose('SambaDance', s.t); car.root.rotation.y = 2.4 + s.lt * 0.08; };
  }

  // DESERT: day 48 — 14,074 pallets of $100M
  let you3;
  {
    const g = mk('DESERT', { env: 'sky', envI: 0.6, bg: 'hdr', bgBlur: 0.0, bgI: 0.7, fog: ['#c9b89a', 160, 1200], exposure: 0.75, bloom: 0.08 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), std({ color: '#cdb48a', roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
    const sun = new THREE.DirectionalLight(0xffe2b8, 2.0); sun.position.set(-120, 160, 80); sun.target.position.set(0, 0, -40); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 600 }); sun.shadow.bias = -0.0004; g.add(sun, sun.target);
    const palletTop = canvasTex(256, 256, (gg) => { gg.fillStyle = '#7f9474'; gg.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 32) { gg.fillStyle = (x + y) % 64 ? '#9cb08e' : '#86997a'; gg.fillRect(x + 1, y + 1, 30, 14); gg.fillStyle = '#d6a93a'; gg.fillRect(x + 13, y + 1, 6, 14); } });
    const palletSide = canvasTex(256, 256, (gg) => { for (let y = 0; y < 256; y += 3) { gg.fillStyle = (y / 3) % 2 ? '#a9b998' : '#6f8566'; gg.fillRect(0, y, 256, 3); } gg.fillStyle = '#8a6a44'; gg.fillRect(0, 226, 256, 30); for (let x = 0; x < 256; x += 64) { gg.fillStyle = '#5a4430'; gg.fillRect(x + 4, 238, 24, 18); } });
    const pm = [std({ map: palletSide, roughness: 0.85 }), std({ map: palletSide, roughness: 0.85 }), std({ map: palletTop, roughness: 0.8 }), std({ map: palletTop }), std({ map: palletSide, roughness: 0.85 }), std({ map: palletSide, roughness: 0.85 })];
    const n = 14074, pl = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 1.1, 1.0), pm, n); pl.castShadow = pl.receiveShadow = true; pl.frustumCulled = false; g.add(pl);
    // a stepped pyramid of pallets: 14,074 × $100M ≈ $1.4 trillion
    { let i = 0, side = 44, lv = 0; while (i < n && side > 0) { for (let a = 0; a < side && i < n; a++) for (let c = 0; c < side && i < n; c++) { _Q.setFromEuler(_E.set(0, (hash(i) - 0.5) * 0.04, 0)); _M.compose(_P.set((a - side / 2 + 0.5) * 1.25, 0.55 + lv * 1.1, -40 + (c - side / 2 + 0.5) * 1.05), _Q, _S); pl.setMatrixAt(i++, _M); } side -= 2; lv++; } for (; i < n; i++) pl.setMatrixAt(i, _Z); }
    you3 = instance('xbot', { tint: '#8d939e', additive: ['agree', 'headShake', 'sad_pose', 'sneak_pose'] }); you3.root.position.set(1.2, 0, -10.0); you3.root.rotation.y = Math.PI * 0.95; g.add(you3.root);
    sets.DESERT.update = (s) => you3.pose('idle', s.t);
  }

  /* ─── HUD (thin labels + serif figures, reference style) ─── */
  function card(g, t, t0, dur, small, big, col = '#ffffff', snd = 'ding') {
    ev(snd, t0); const d = t - t0; if (d < 0 || d > dur) return;
    const a = Math.min(easeOut(d / 0.35), 1 - smooth((d - dur + 0.35) / 0.35));
    g.save(); g.globalAlpha = a; const y = 360 + (1 - easeOut(d / 0.35)) * 18;
    label(g, small, W / 2, y - 92, { align: 'center', size: 22, color: 'rgba(255,255,255,0.85)' });
    figure(g, big, W / 2, y, { align: 'center', size: 104, color: col, max: 900 });
    g.restore();
  }
  function hud(g, s) {
    const t = s.t, d = dayAt(t), endT = T('so', 1);
    if (d >= 1 && t < endT) {
      const v = val(d), win = v > 1e6;
      label(g, `DAY ${d} · YOUR PENNY`, 80, 900);
      figure(g, money(v), 74, 1020, { size: 124, color: win ? '#bff0c8' : '#ffffff' });
      // progress: you vs the friend's $1M (linear: the penny is invisible until the very end)
      const x0 = 80, wMax = 840, y = 1072, max = 5.4e6;
      rule(g, x0, y, wMax, 'rgba(255,255,255,0.22)', 2);
      const fx = x0 + wMax * 1e6 / max; rule(g, fx - 1, y - 10, 2, 'rgba(160,190,255,0.9)', 22); label(g, 'FRIEND $1M', fx + 8, y - 4, { size: 16, track: 3, color: 'rgba(170,200,255,0.9)' });
      const yx = Math.min(wMax, wMax * v / max); rule(g, x0, y, Math.max(2, yx), win ? '#bff0c8' : '#ffc89a', 4);
    }
    card(g, t, T('lamborghini'), 2.0, 'MEANWHILE · YOUR FRIEND', 'New supercar', '#ffffff', 'pop');
    card(g, t, T('losing'), 2.0, 'DAY 20 · YOU vs FRIEND', '$5,242 vs $1,000,000', '#ffc0b0', 'hit');
    card(g, t, T('passed'), 2.2, 'DAY 28 · YOU PASS HIM', '$1,342,177', '#bff0c8');
    card(g, t, T('times'), 2.4, 'DAY 30', '$5,368,709', '#bff0c8');
    card(g, t, T('musk'), Math.min(2.4, endT - T('musk') - 0.05), 'DAY 48 · MORE THAN ELON MUSK', '$1.4 trillion', '#ffe7a0');
    if (t >= endT) { const a = easeOut((t - endT) / 0.4); g.save(); g.globalAlpha = a; label(g, 'BE HONEST', W / 2, 260, { align: 'center' }); figure(g, 'Would you have', W / 2, 380, { align: 'center', size: 100 }); figure(g, 'taken the million?', W / 2, 490, { align: 'center', size: 100, color: '#ffe7a0' }); g.restore(); }
  }

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update) => shots.push({ id, t0, set, cam, update });
  const C = (pos, look, fov = 40, extra = {}) => ({ pos, look, fov, ...extra });
  const dolly = (s, a, b, la, lb, fov = 40, extra = {}) => { const k = ease(s.p); return C(a.map((v, i) => lerp(v, b[i], k)), la.map((v, i) => lerp(v, lb[i], k)), fov, extra); };

  shot('S1', 0, 'STUDIO', (s) => dolly(s, [0, 1.7, 6.5], [0, 1.6, 4.6], [0, 1.35, -0.6], [0, 1.4, -0.6], 38));
  shot('S2', T('penny'), 'STUDIO', (s) => dolly(s, [1.75, 1.75, 0.2], [1.6, 1.68, -0.15], [1.3, 1.6, -0.9], [1.3, 1.6, -0.9], 30, { aperture: 0.004 }));
  shot('S3', T('pick'), 'STUDIO', (s) => dolly(s, [-0.6, 1.75, 0.6], [-0.8, 1.7, 0.3], [-1.3, 1.32, -0.9], [-1.3, 1.32, -0.9], 32, { aperture: 0.004 }));
  shot('S4', T('most'), 'STUDIO', (s) => dolly(s, [1.6, 1.5, 3.8], [1.1, 1.55, 3.4], [0, 1.2, 0.0], [0, 1.25, 0.0], 36, { aperture: 0.002 }));
  shot('C1', T('day', 2), 'TABLE', (s) => dolly(s, [-0.05, 0.64, 0.32], [-0.02, 0.62, 0.27], [-0.06, 0.552, 0.12], [-0.05, 0.552, 0.12], 30, { aperture: 0.03 }));
  shot('C1b', T('day', 4), 'TABLE', (s) => dolly(s, [0.25, 0.66, 0.36], [0.2, 0.65, 0.33], [-0.03, 0.552, 0.12], [-0.03, 0.552, 0.12], 32, { aperture: 0.025 }));
  shot('C2', T('day', 5), 'TABLE', (s) => dolly(s, [0.36, 0.78, 0.48], [0.3, 0.76, 0.44], [0.02, 0.58, -0.02], [0.02, 0.58, -0.02], 34, { aperture: 0.015 }));
  shot('F1', T('your', 1), 'SHOWROOM', (s) => dolly(s, [5.2, 1.2, 5.0], [4.2, 1.4, 4.4], [0.4, 0.8, 0.2], [0.6, 0.9, 0.4], 36, { aperture: 0.001 }));
  shot('C3', T('day', 6), 'TABLE', (s) => dolly(s, [0.5, 0.95, 0.75], [0.62, 1.12, 0.9], [0.02, 0.58, -0.02], [0.02, 0.57, -0.02], 34, { aperture: 0.008 }));
  shot('R1', T('day', 7), 'STUDIO', (s) => dolly(s, [0.62, 1.42, -0.45], [0.66, 1.4, -0.55], [0.92, 1.285, -0.98], [0.92, 1.285, -0.98], 30, { aperture: 0.02 }));
  shot('R1b', T('weeks'), 'STUDIO', (s) => dolly(s, [1.4, 1.5, 3.6], [1.0, 1.5, 3.3], [0.1, 1.15, 0.0], [0.1, 1.1, 0.0], 36, { aperture: 0.002 }));
  shot('R2', T('day', 8), 'STUDIO', (s) => dolly(s, [0.2, 1.75, 1.2], [0.4, 1.72, 1.0], [1.0, 1.3, -0.9], [1.0, 1.3, -0.9], 34, { aperture: 0.003 }));
  shot('R3', T('day', 9), 'STUDIO', (s) => dolly(s, [0, 2.0, 2.6], [0, 1.95, 2.3], [0, 1.3, -0.9], [0, 1.3, -0.9], 36, { aperture: 0.002 }));
  shot('R4', T('day', 10), 'STUDIO', (s) => dolly(s, [1.9, 1.45, 0.4], [1.8, 1.5, 0.2], [1.2, 1.32, -0.9], [1.2, 1.34, -0.9], 34, { aperture: 0.003 }));
  shot('R4b', T('day', 11), 'STUDIO', (s) => dolly(s, [-0.6, 2.2, 3.4], [-0.2, 2.1, 3.1], [0.5, 1.1, -0.6], [0.5, 1.1, -0.6], 38, { aperture: 0.0015 }));
  shot('R5', T('day', 12), 'STUDIO', (s) => dolly(s, [1.1, 1.5, 0.3], [1.05, 1.62, 0.15], [1.3, 1.36, -0.9], [1.3, 1.38, -0.9], 32, { aperture: 0.004 }));
  shot('R5b', T('more', 1), 'STUDIO', (s) => dolly(s, [-2.6, 2.4, 3.6], [-2.0, 2.3, 3.2], [0, 1.2, -0.6], [0, 1.2, -0.6], 38, { aperture: 0.0015 }));
  shot('R6', T('almost'), 'STUDIO', (s) => dolly(s, [2.4, 1.4, 1.6], [1.8, 1.45, 1.2], [1.3, 1.34, -0.9], [1.3, 1.34, -0.9], 34, { aperture: 0.003 }));
  shot('M1', T('and', 3), 'DESERT', (s) => dolly(s, [2.6, 1.6, -6.2], [-38, 30, 34], [1.2, 1.4, -10.4], [0, 8, -40], 44, { aperture: 0.0006 }));
  shot('E1', T('so', 1), 'STUDIO', (s) => dolly(s, [0, 1.45, 4.2], [0, 1.45, 3.6], [0, 1.15, 0.0], [0, 1.15, 0.0], 36, { aperture: 0.002 }));
  shot('E2', T('tell'), 'STUDIO', (s) => dolly(s, [-3, 3.0, 6], [-1.5, 2.6, 5.2], [0, 1.2, -0.6], [0, 1.2, -0.6], 40));

  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, end: A.duration };
};

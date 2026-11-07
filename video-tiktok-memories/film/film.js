/* "$5 million, but you lose all your memories" — dilemma (comment A or B). HQ engine.
 * Hypothetical scenario: no factual claims except general ones in the script.
 */
window.FILM_ASSETS = {
  models: [['you', 'hq/assets/Xbot.glb'], ['stranger', 'hq/assets/Soldier.glb'], ['mom', 'hq/assets/Michelle.glb'],
    ['table', 'hq/assets/WoodenTable_01/WoodenTable_01_1k.gltf'], ['lamp', 'hq/assets/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf']],
  hdr: [['studio', 'hq/assets/studio.hdr'], ['sky', 'hq/assets/sky.hdr'], ['night', 'hq/assets/dikhololo_night.hdr']],
};
window.buildFilm = (A) => {
  const { THREE, X, T, W, H, clamp, lerp, ease, easeOut, smooth, hash, ev, ASSETS, instance, label, figure, rule, camera } = A;
  const RB = X.RoundedBoxGeometry;
  const std = (o) => new THREE.MeshStandardMaterial(o);
  function canvasTex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  const glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,230,190,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _P = new THREE.Vector3(), _S = new THREE.Vector3(1, 1, 1), _Z = new THREE.Matrix4().makeScale(0, 0, 0);
  const inPlace = (clip, name, hipsRot = true) => { const c = clip.clone(); c.name = name; c.tracks = c.tracks.filter((tr) => !/Hips\.position$/.test(tr.name) && (hipsRot || !/Hips\.quaternion$/.test(tr.name))); return c; };
  const SRC = (k, n) => ASSETS.models[k].animations.find((a) => a.name === n);
  function actor(key, height, extra = {}) { const a = instance(key); Object.entries(extra).forEach(([n, c]) => { a.actions[n] = a.mixer.clipAction(c); }); a.root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(a.root); a.root.scale.multiplyScalar(height / Math.max(0.01, bb.max.y - bb.min.y)); a.wrap = new THREE.Group(); a.wrap.add(a.root); return a; }

  /* ─── money (generic currency look, no real banknote design) ─── */
  const billTex = canvasTex(512, 220, (g) => { g.fillStyle = '#cfd9c4'; g.fillRect(0, 0, 512, 220); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(70,100,80,${0.08 + hash(i) * 0.1})`; g.beginPath(); g.moveTo(0, i * 4); g.bezierCurveTo(170, i * 4 + 30, 340, i * 4 - 30, 512, i * 4 + 10); g.stroke(); } g.strokeStyle = '#56735e'; g.lineWidth = 5; g.strokeRect(12, 12, 488, 196); g.fillStyle = 'rgba(86,115,94,0.55)'; g.beginPath(); g.ellipse(300, 110, 58, 72, 0, 0, 6.3); g.fill(); g.fillStyle = '#4a6652'; g.font = '600 52px Garamond'; g.fillText('100', 30, 70); g.fillText('100', 400, 196); });
  const edgeTex = canvasTex(16, 64, (g) => { for (let y = 0; y < 64; y += 2) { g.fillStyle = (y / 2) % 2 ? '#dfe6d6' : '#b9c6ad'; g.fillRect(0, y, 16, 2); } });
  const bandTex = canvasTex(256, 64, (g) => { g.fillStyle = '#d6a93a'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#5a4a20'; g.font = '600 28px Inter'; g.textAlign = 'center'; g.fillText('$10,000', 128, 42); });
  const edge = std({ map: edgeTex, roughness: 0.85 }), face = std({ map: billTex, roughness: 0.7 });

  /* ─── memory paintings (procedural, no real people) ─── */
  const sil = (g, x, y, s, col = '#1a1622') => { g.fillStyle = col; g.beginPath(); g.arc(x, y - 52 * s, 13 * s, 0, 6.3); g.fill(); g.beginPath(); g.roundRect(x - 15 * s, y - 38 * s, 30 * s, 42 * s, 10 * s); g.fill(); g.fillRect(x - 11 * s, y, 8 * s, 30 * s); g.fillRect(x + 3 * s, y, 8 * s, 30 * s); };
  const ART = {
    steps: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2d8b0'); gr.addColorStop(1, '#c99a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(90,60,40,0.55)'; g.beginPath(); g.ellipse(120 + i * 55, 300 - i * 30 + (i % 2) * 18, 9, 15, 0.3, 0, 6.3); g.fill(); } [['#e2572c', 'A'], ['#2c6fb0', 'B'], ['#27ae60', 'C']].forEach(([c, l], i) => { g.fillStyle = c; g.fillRect(330 + i * 44, 250 - (i === 1 ? 40 : 0), 40, 40); g.fillStyle = '#fff'; g.font = '700 28px Inter'; g.fillText(l, 341 + i * 44, 280 - (i === 1 ? 40 : 0)); }); },
    kitchen: (g, w, h) => { g.fillStyle = '#3a2a22'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(150, 120, 10, 150, 120, 220); gr.addColorStop(0, '#ffe3a8'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffdca0'; g.fillRect(90, 60, 120, 110); g.strokeStyle = '#3a2a22'; g.lineWidth = 6; g.strokeRect(90, 60, 120, 110); g.beginPath(); g.moveTo(150, 60); g.lineTo(150, 170); g.stroke(); g.fillStyle = '#6a4a34'; g.fillRect(0, 280, w, 104); g.fillStyle = '#9aa0a8'; g.beginPath(); g.roundRect(300, 220, 120, 70, 10); g.fill(); for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(330 + i * 30, 210); g.bezierCurveTo(310 + i * 30, 170, 350 + i * 30, 150, 330 + i * 30, 110); g.stroke(); } },
    bike: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(0.6, '#ffd8a0'); gr.addColorStop(1, '#3a3040'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffeec8'; g.beginPath(); g.arc(380, 200, 50, 0, 6.3); g.fill(); g.fillStyle = '#2a2230'; g.fillRect(0, 300, w, 84); g.strokeStyle = '#1a1622'; g.lineWidth = 7; [[180, 290], [280, 290]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 34, 0, 6.3); g.stroke(); }); g.beginPath(); g.moveTo(180, 290); g.lineTo(225, 240); g.lineTo(280, 290); g.lineTo(240, 290); g.lineTo(225, 240); g.stroke(); sil(g, 228, 222, 0.8); },
    kiss: (g, w, h) => { g.fillStyle = '#0e1430'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(260, 70, 5, 260, 140, 230); gr.addColorStop(0, '#ffe6a0'); gr.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a34'; g.fillRect(256, 60, 8, 240); g.fillStyle = '#ffe6a0'; g.fillRect(244, 52, 32, 14); sil(g, 222, 300, 1.1, '#0a0a14'); sil(g, 248, 300, 1.0, '#0a0a14'); g.fillStyle = '#1a1e30'; g.fillRect(0, 330, w, 60); },
    friend: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd0ff'); gr.addColorStop(1, '#e8f4d8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#7ab65a'; g.fillRect(0, 300, w, 84); g.strokeStyle = '#6a4a34'; g.lineWidth = 8; g.beginPath(); g.moveTo(110, 300); g.lineTo(150, 70); g.lineTo(370, 70); g.lineTo(410, 300); g.stroke(); g.lineWidth = 3; [200, 320].forEach((x, i) => { g.beginPath(); g.moveTo(x, 70); g.lineTo(x + (i ? 20 : -20), 230); g.stroke(); sil(g, x + (i ? 20 : -20), 250, 0.8); }); },
    birthday: (g, w, h) => { g.fillStyle = '#1a1018'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(256, 210, 10, 256, 210, 220); gr.addColorStop(0, 'rgba(255,200,120,0.9)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#f4ecd8'; g.beginPath(); g.roundRect(156, 220, 200, 90, 14); g.fill(); g.fillStyle = '#e2879a'; g.fillRect(156, 250, 200, 16); for (let i = 0; i < 5; i++) { g.fillStyle = ['#7fb0ff', '#ffd23f', '#7ee0c0', '#ff9a6a', '#c9a0ff'][i]; g.fillRect(180 + i * 36, 186, 8, 34); g.fillStyle = '#ffe6a0'; g.beginPath(); g.ellipse(184 + i * 36, 178, 6, 11, 0, 0, 6.3); g.fill(); } },
    song: (g, w, h) => { g.fillStyle = '#1c1630'; g.fillRect(0, 0, w, h); g.fillStyle = '#0a0a10'; g.beginPath(); g.arc(220, 200, 130, 0, 6.3); g.fill(); for (let r = 40; r < 128; r += 8) { g.strokeStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.arc(220, 200, r, 0, 6.3); g.stroke(); } g.fillStyle = '#e2572c'; g.beginPath(); g.arc(220, 200, 36, 0, 6.3); g.fill(); g.fillStyle = '#ffd23f'; g.font = '700 70px Garamond'; g.fillText('♪', 380, 140); g.fillText('♫', 410, 280); },
    family: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffb07a'); gr.addColorStop(0.65, '#ffe0b0'); gr.addColorStop(1, '#5a7aa0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#4a6a90'; g.fillRect(0, 290, w, 94); [[150, 1.1], [215, 1.05], [275, 0.7], [320, 0.6]].forEach(([x, s]) => sil(g, x, 280, s, '#2a2030')); g.strokeStyle = '#2a2030'; g.lineWidth = 5; g.beginPath(); g.moveTo(165, 255); g.lineTo(200, 255); g.moveTo(230, 260); g.lineTo(262, 262); g.stroke(); },
  };
  const ORDER = [['steps', 'first', 1], ['kitchen', 'smell', 1], ['bike', 'bike', 1], ['kiss', 'kiss', 1], ['friend', "friend's", 1], ['birthday', 'birthday', 1], ['song', 'song', 1], ['family', 'people', 1]];

  /* ─── sets ─── */
  const sets = {};
  const mk = (name, extra) => { const group = new THREE.Group(); sets[name] = { group, ...extra }; return group; };
  const spot = (g, col, I, pos, target, angle = 0.5, pen = 0.6, shadow = false) => { const l = new THREE.SpotLight(col, I, 60, angle, pen, 2); l.position.set(...pos); l.target.position.set(...target); g.add(l, l.target); if (shadow) { l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.radius = 3; l.shadow.bias = -0.0002; } return l; };

  // OFFICE — night, one lamp, the briefcase and the contract
  let briefcase, stranger, pen;
  {
    const g = mk('OFFICE', { env: 'studio', envI: 0.12, bg: '#050407', fog: ['#050407', 2.5, 9], exposure: 1.0, bloom: 0.15 });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std({ color: '#1c1614', roughness: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
    const tb = instance('table'); tb.root.scale.set(1.2, 1.4, 1.4); g.add(tb.root);
    const lp = instance('lamp'); lp.root.position.set(-0.75, 0.77, -0.25); lp.root.rotation.y = 0.6; g.add(lp.root);
    spot(g, 0xffd8a0, 4.5, [-0.55, 1.35, -0.1], [0, 0.77, 0.05], 0.8, 0.8, true);
    spot(g, 0x8fa8ff, 0.8, [1.5, 2.4, -2.5], [0, 1.4, -1.4], 0.6, 0.9);
    briefcase = new THREE.Group(); g.add(briefcase);
    const leather = std({ color: '#1b1b20', roughness: 0.45, metalness: 0.1 });
    const base = new THREE.Mesh(new RB(0.46, 0.08, 0.32, 3, 0.02), leather); base.position.y = 0.04; base.castShadow = true; briefcase.add(base);
    const lid = new THREE.Mesh(new RB(0.46, 0.02, 0.32, 3, 0.01), leather); lid.position.set(0, 0.2, -0.16); lid.rotation.x = -1.35; lid.geometry.translate(0, 0, -0.16); lid.position.z = -0.16 + 0.16; briefcase.add(lid);
    for (let i = 0; i < 18; i++) { const k = i % 6, lv = Math.floor(i / 6); const st = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.064), [edge, edge, face, face, edge, edge]); st.position.set(-0.15 + (k % 3) * 0.15, 0.085 + lv * 0.012, -0.08 + Math.floor(k / 3) * 0.12); briefcase.add(st); const b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.0125, 0.0645), std({ map: bandTex })); b.position.copy(st.position); briefcase.add(b); }
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.297), std({ map: canvasTex(420, 594, (c) => { c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, 420, 594); c.fillStyle = '#2b2b30'; c.font = '700 26px Garamond'; c.textAlign = 'center'; c.fillText('AGREEMENT', 210, 60); c.font = '400 14px Garamond'; c.textAlign = 'left'; for (let i = 0; i < 22; i++) c.fillRect(40, 100 + i * 18, 340 - (i % 4) * 30, 3); c.font = 'italic 500 16px Garamond'; c.fillText('Upon signature, all memories of the undersigned', 40, 520); c.fillText('are permanently erased.', 40, 540); c.fillRect(40, 570, 200, 2); }), roughness: 0.9 })); paper.rotation.x = -Math.PI / 2; paper.rotation.z = 0.15; paper.position.set(0.32, 0.772, 0.12); paper.receiveShadow = true; g.add(paper);
    pen = new THREE.Group(); g.add(pen); const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 12), std({ color: '#0e0e12', metalness: 0.6, roughness: 0.3 })); pb.rotation.z = Math.PI / 2; pen.add(pb); const nib = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.006, 0.02, 12), std({ color: '#d8b25a', metalness: 1, roughness: 0.2 })); nib.rotation.z = Math.PI / 2; nib.position.x = 0.08; pen.add(nib); pen.position.set(0.32, 0.778, 0.24);
    stranger = actor('stranger', 1.85, { sidle: inPlace(SRC('stranger', 'Idle'), 'sidle') }); stranger.wrap.position.set(0, 0, -1.25); stranger.wrap.rotation.y = Math.PI; g.add(stranger.wrap);
    stranger.root.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.35); } });
    sets.OFFICE.update = (s) => { const k = easeOut(clamp((s.t - 0.2) / 1.6)); briefcase.position.set(0, 0.772, lerp(-0.7, 0.05, k)); briefcase.rotation.y = lerp(0.4, 0, k); stranger.act([['sidle', 1, s.t]]); const w = clamp((s.t - T('second')) / 1.6); pen.position.set(0.3 + Math.sin(w * 30) * 0.02 * (w > 0 && w < 1 ? 1 : 0), 0.79 + (w > 0 && w < 1 ? 0.004 : 0), 0.2 - w * 0.06); pen.rotation.y = 0.6; };
  }

  // MEMORIES — a corridor of framed memories in the dark; each one dissolves as it's named
  let frames = [], dust;
  {
    const g = mk('MEMORIES', { env: 'night', envI: 0.3, bg: '#04050c', fog: ['#04050c', 4, 22], exposure: 1.1, bloom: 0.35 });
    const goldMat = std({ color: '#c9a45a', metalness: 1, roughness: 0.25 });
    ORDER.forEach(([key], i) => {
      const fr = new THREE.Group(); const side = i % 2 ? 1 : -1; fr.position.set(side * 0.75, 1.55 + (hash(i) - 0.5) * 0.3, -i * 2.2 - 1.5); fr.rotation.y = -side * 0.45; g.add(fr);
      const tex = canvasTex(512, 384, ART[key]);
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35 })); fr.add(pic);
      const border = new THREE.Mesh(new RB(1.32, 1.02, 0.05, 2, 0.015), goldMat.clone()); border.material.transparent = true; border.position.z = -0.03; fr.add(border);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffd8a0', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(2.4, 2, 1); halo.position.z = -0.1; fr.add(halo);
      frames.push({ fr, pic, border, halo, key });
    });
    const N = 1500, pos = new Float32Array(N * 3); dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), new THREE.PointsMaterial({ color: '#ffe6b8', size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(dust);
    const kl = new THREE.PointLight(0xffd8a0, 6, 10, 2); g.add(kl); sets.MEMORIES.kl = kl;
    sets.MEMORIES.update = (s) => {
      const t = s.t;
      frames.forEach((f, i) => { const [, w, n] = ORDER[i]; const t0 = T(w, n) + 0.5, k = clamp((t - t0) / 1.4); const flick = t > T('erased') && t < T('erased') + 1.2 ? (Math.sin(t * 60 + i) > 0.3 ? 0.4 : 1) : 1; const op = (1 - smooth(k)) * flick; f.pic.material.opacity = op; f.border.material.opacity = op; f.halo.material.opacity = 0.25 * op; f.fr.scale.setScalar(1 + k * 0.15); f.fr.position.y += 0; f.k = k; });
      const p = dust.geometry.attributes.position; for (let j = 0; j < 1500; j++) { const i = j % frames.length, f = frames[i], k = f.k || 0; const fx = f.fr.position.x, fy = f.fr.position.y, fz = f.fr.position.z; const r = (hash(j) - 0.5), q = (hash(j * 2) - 0.5); const drift = k * (1 + hash(j * 3) * 2.5); p.setXYZ(j, fx + r * 1.2 + drift * (hash(j * 5) - 0.5) * 2, fy + q * 0.9 + drift * 1.2, fz + drift * (hash(j * 7) - 0.5)); } p.needsUpdate = true;
      dust.material.opacity = 0.8;
      let cz = frames[0].fr.position.z; for (let i = 1; i < frames.length; i++) cz = lerp(cz, frames[i].fr.position.z, smooth(clamp((t - T(ORDER[i - 1][1], ORDER[i - 1][2]) - 1.2) / 0.8))); sets.MEMORIES.kl.position.set(0, 1.8, cz + 1.2);
    };
  }

  // BEDROOM — morning; a woman you don't recognize sits by your bed
  let mom;
  {
    const g = mk('BEDROOM', { env: 'sky', envI: 0.45, bg: '#cfc6b8', fog: ['#cfc6b8', 6, 20], exposure: 0.72, bloom: 0.3 });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), std({ color: '#b8a088', roughness: 0.4 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), std({ color: '#c4b39c', roughness: 0.9 })); wall.position.set(0, 2.5, -2.4); g.add(wall);
    { const wr = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), std({ color: '#b9a892', roughness: 0.9 })); wr.position.set(2.0, 2.5, 0); wr.rotation.y = -Math.PI / 2; g.add(wr); const wf = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), std({ color: '#b9a892', roughness: 0.9 })); wf.position.set(0, 2.5, 2.6); wf.rotation.y = Math.PI; g.add(wf); const wl = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), std({ color: '#b9a892', roughness: 0.9 })); wl.position.set(-2.6, 2.5, 0); wl.rotation.y = Math.PI / 2; g.add(wl); const fr = new THREE.Mesh(new RB(0.9, 0.7, 0.04, 3, 0.01), std({ color: '#3a2a1e' })); fr.position.set(1.97, 1.6, -0.4); fr.rotation.y = -Math.PI / 2; g.add(fr); const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.58), std({ color: '#c9b49a' })); ph.position.set(1.94, 1.6, -0.4); ph.rotation.y = -Math.PI / 2; g.add(ph); }
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), new THREE.MeshBasicMaterial({ color: '#ffffff' })); win.position.set(1.4, 1.9, -2.38); g.add(win);
    for (let k = 0; k < 2; k++) { const mu = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.3, 0.06), std({ color: '#d8d0c4' })); mu.position.set(0.8 + k * 1.2, 1.9, -2.35); g.add(mu); }
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.8, 8, 1), std({ color: '#d9c8b0', roughness: 0.95, side: THREE.DoubleSide })); { const p = curtain.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 25) * 0.04); curtain.geometry.computeVertexNormals(); } curtain.position.set(-0.05, 1.7, -2.3); g.add(curtain);
    const sun = new THREE.DirectionalLight(0xfff2dc, 3.2); sun.position.set(4, 5, -6); sun.target.position.set(0, 0.5, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); g.add(sun, sun.target);
    const bed = new THREE.Mesh(new RB(1.8, 0.45, 2.2, 4, 0.08), std({ color: '#d8cfc0', roughness: 0.9 })); bed.position.set(-0.6, 0.35, -0.6); bed.castShadow = bed.receiveShadow = true; g.add(bed);
    const duvet = new THREE.Mesh(new RB(1.86, 0.14, 1.4, 4, 0.06), std({ color: '#9fb0c0', roughness: 0.95 })); duvet.position.set(-0.6, 0.62, -0.2); duvet.castShadow = duvet.receiveShadow = true; g.add(duvet);
    const head = new THREE.Mesh(new RB(1.9, 1.2, 0.12, 4, 0.05), std({ color: '#8a6a4c', roughness: 0.6 })); head.position.set(-0.6, 0.9, -1.75); g.add(head);
    const pil = new THREE.Mesh(new RB(0.7, 0.16, 0.42, 4, 0.08), std({ color: '#ffffff', roughness: 0.9 })); pil.position.set(-0.6, 0.66, -1.35); g.add(pil);
    const ns = new THREE.Mesh(new RB(0.5, 0.55, 0.45, 3, 0.03), std({ color: '#8a6a4c', roughness: 0.5 })); ns.position.set(0.7, 0.28, -1.45); g.add(ns);
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.2, 20), std({ color: '#ffffff', roughness: 0.2 })); vase.position.set(0.7, 0.65, -1.45); g.add(vase);
    for (let k = 0; k < 5; k++) { const fl2 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), std({ color: ['#e2879a', '#ffd23f', '#ffffff'][k % 3] })); fl2.position.set(0.7 + (hash(k) - 0.5) * 0.12, 0.8 + hash(k * 2) * 0.08, -1.45 + (hash(k * 3) - 0.5) * 0.12); g.add(fl2); }
    mom = instance('you', { tint: '#cfae94', additive: ['sad_pose', 'headShake'] }); mom.wrap = new THREE.Group(); mom.wrap.add(mom.root); mom.wrap.scale.setScalar(0.92); mom.wrap.position.set(0.6, -0.4, -0.35); mom.wrap.rotation.y = -1.35; g.add(mom.wrap);
    const chair = new THREE.Mesh(new RB(0.5, 0.45, 0.5, 3, 0.04), std({ color: '#6a4a34', roughness: 0.6 })); chair.position.set(0.6, 0.22, -0.35); g.add(chair);
    sets.BEDROOM.update = (s) => { const t = s.t, sh = t > T('none') - 0.2 && t < T('none') + 1.6 ? Math.sin(Math.PI * clamp((t - T('none') + 0.2) / 1.8)) : 0; mom.act([['idle', 1, t * 0.6], ['sad_pose', 1, 0.5], ['headShake', sh, t - T('none') + 0.2]]); };
  }

  /* ─── HUD ─── */
  function hud(g, s) {
    const t = s.t, endT = T('so', 1);
    if (t < endT) {
      const gone = ORDER.reduce((a, [, w, n]) => a + clamp((t - T(w, n) - 0.5) / 1.4), 0) / ORDER.length;
      if (t > T('five', 1) - 0.1) { label(g, 'THE OFFER', 80, 268); figure(g, '$5,000,000', 76, 350, { size: 84, color: '#e8f0d0' }); }
      if (t > T('erased') - 0.2) { const mem = Math.round(100 * (1 - gone)); label(g, `MEMORIES · ${mem}%`, 80, 402, { color: 'rgba(255,220,180,0.9)' }); rule(g, 80, 420, 840, 'rgba(255,255,255,0.22)', 2); rule(g, 80, 420, 840 * (1 - gone), '#ffcf9a', 3); }
    }
    ev('hit', T('erased')); ev('pop', T('mother'));
    if (t >= endT) {
      const k = easeOut((t - endT) / 0.5); g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(4,4,8,0.78)'; g.fillRect(0, 0, W, H);
      label(g, 'BE HONEST', W / 2, 330, { align: 'center' });
      const opt = (y, a, txt, sub, c, t0) => { const q = easeOut((t - t0) / 0.4); if (q <= 0) return; g.save(); g.globalAlpha = k * q; g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.roundRect(110, y - 96, 860, 170, 18); g.stroke(); figure(g, a, 160, y + 10, { size: 120, color: c }); figure(g, txt, 270, y - 10, { size: 56, max: 680 }); label(g, sub, 272, y + 40, { size: 20 }); g.restore(); };
      opt(560, 'A', 'Take the $5 million', 'START OVER, RICH', '#e8f0d0', T('a', 6)); opt(800, 'B', 'Keep every memory', 'EVEN THE BAD ONES', '#ffcf9a', T('b', 1));
      const c = easeOut((t - T('comment')) / 0.4); if (c > 0) { g.globalAlpha = k * c; figure(g, 'Comment A or B', W / 2, 1010, { align: 'center', size: 84 }); }
      g.restore();
    }
  }

  /* ─── shots ─── */
  const shots = [];
  const shot = (id, t0, set, cam, update, extra = {}) => shots.push({ id, t0, set, cam, update, ...extra });
  const shake = (t, a) => [Math.sin(t * 2.1) * a + Math.sin(t * 5.3) * a * 0.3, Math.sin(t * 1.7 + 1) * a, 0];
  const C = (pos, look, fov = 40, t = 0, amp = 0.004, extra = {}) => { const sh = shake(t, amp); return { pos: [pos[0] + sh[0], pos[1] + sh[1], pos[2]], look: [look[0] + sh[0], look[1] + sh[1], look[2]], fov, ...extra }; };
  const mz = (i) => frames[i].fr.position;

  shot('O1', 0, 'OFFICE', (s) => C([0.05, 1.18, 0.95 - s.lt * 0.04], [0, 0.8, -0.15], 44, s.t, 0.004, { aperture: 0.006 }));
  shot('O2', T('five', 1), 'OFFICE', (s) => C([0.12, 1.0, 0.42 - s.lt * 0.03], [0, 0.8, 0.02], 38, s.t, 0.003, { aperture: 0.02 }));
  shot('O3', T('just', 1), 'OFFICE', (s) => C([0.1, 1.15, 0.8], [0, 1.55, -1.25], 32, s.t, 0.003, { aperture: 0.004 }));
  shot('O4', T('second'), 'OFFICE', (s) => C([0.36, 1.05, 0.5], [0.32, 0.77, 0.14], 34, s.t, 0.003, { aperture: 0.02 }));
  shot('M0', T('all', 1) - 0.1, 'MEMORIES', (s) => C([0, 1.6, 2.4 - s.lt * 0.4], [0, 1.5, -8], 50, s.t, 0.006, { aperture: 0.001 }));
  ORDER.forEach(([key, w, n], i) => shot('M' + (i + 1), T(w, n) - 0.15, 'MEMORIES', (s) => { const p = mz(i); const side = i % 2 ? 1 : -1; return C([p.x - side * 0.9 + s.lt * 0.05 * side, p.y + 0.05, p.z + 2.0 - s.lt * 0.25], [p.x, p.y, p.z], 40, s.t, 0.005, { aperture: 0.004 }); }));
  shot('B1', T('wake'), 'BEDROOM', (s) => C([-1.5 + s.lt * 0.05, 1.55, 1.9 - s.lt * 0.06], [0.15, 0.8, -0.6], 46, s.t, 0.004, { aperture: 0.002 }));
  shot('B2', T('woman'), 'BEDROOM', (s) => C([-0.95, 1.2, 1.25 - s.lt * 0.05], [0.4, 0.95, -0.45], 40, s.t, 0.004, { aperture: 0.003 }));
  shot('B2b', T('crying'), 'BEDROOM', (s) => C([2.2 - s.lt * 0.05, 1.3, 0.9], [0.3, 0.9, -0.7], 36, s.t, 0.003, { aperture: 0.004 }));
  shot('B3', T('stories'), 'BEDROOM', (s) => C([-1.3, 1.3, -1.35 + s.lt * 0.03], [0.5, 1.0, -0.35], 34, s.t, 0.004, { aperture: 0.004 }));
  shot('F1', T('five', 2), 'OFFICE', (s) => C([0.3 - s.lt * 0.04, 1.3, 0.9], [0, 0.8, 0], 40, s.t, 0.004, { aperture: 0.004 }));
  shot('F2', T('family'), 'BEDROOM', (s) => C([-0.1 + s.lt * 0.05, 1.5, 2.1 - s.lt * 0.05], [0.2, 0.85, -0.6], 44, s.t, 0.004, { aperture: 0.003 }));
  shot('F3', T('some'), 'OFFICE', (s) => C([-0.6 + s.lt * 0.08, 1.4, 1.4], [0, 0.85, 0], 44, s.t, 0.004, { aperture: 0.003 }));
  shot('E1', T('so', 1), 'MEMORIES', (s) => C([0, 1.6, 3 - s.lt * 0.2], [0, 1.5, -8], 50, s.t, 0.004, { aperture: 0.002 }));

  shots.sort((a, b) => a.t0 - b.t0);
  return { sets, shots, hud, end: A.duration };
};

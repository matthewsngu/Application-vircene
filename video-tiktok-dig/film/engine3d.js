/* 3D blocky first-person engine (Three.js) + 2D HUD overlay.
 * Same window contract as the 2D engine: READY, END, SHOTS, EV, WIPES, seek(t), seekBlur(t,n,span).
 * Every frame is a pure function of time t.
 */
(() => {
  const W = 1080, H = 1920;
  const out = document.getElementById('c');
  const ctx = out.getContext('2d');
  const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, W / H, 0.1, 2500);
  scene.add(camera);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.35); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dd, 2.4); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun); scene.add(sun.target);
  const lamp = new THREE.SpotLight(0xfff0d0, 0, 80, 0.55, 0.45, 1.0); lamp.position.set(0.15, 0.05, 0); camera.add(lamp); lamp.target.position.set(0, -0.15, -1); camera.add(lamp.target); // headlamp
  const fill = new THREE.DirectionalLight(0xbcd4ff, 0.5); scene.add(fill); scene.add(fill.target); // cool bounce from the shadow side
  /* image-based light: a tiny gradient "sky dome" baked into a PMREM env map, so metal and glass reflect something */
  const pmrem = new THREE.PMREMGenerator(renderer); const ENVS = new Map();
  function envMap(top, bottom, panel) {
    const k = top + bottom + panel; if (ENVS.has(k)) return ENVS.get(k);
    const sc = new THREE.Scene(); const geo = new THREE.SphereGeometry(10, 32, 16); const col = []; const a = new THREE.Color(top), b = new THREE.Color(bottom), c = new THREE.Color();
    for (let i = 0; i < geo.attributes.position.count; i++) { const y = geo.attributes.position.getY(i) / 10; c.copy(b).lerp(a, Math.max(0, Math.min(1, y * 0.7 + 0.5))); col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    sc.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const pm = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(panel).multiplyScalar(3) })); pm.position.set(2, 9, -2); sc.add(pm);
    const tex = pmrem.fromScene(sc, 0.03).texture; ENVS.set(k, tex); return tex;
  }
  const SKIES = new Map();
  function skyTex(top, bottom) {
    const k = top + bottom; if (SKIES.has(k)) return SKIES.get(k);
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.62, bottom); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; SKIES.set(k, tx); return tx;
  }
  const vig = document.createElement('canvas'); vig.width = W; vig.height = H;
  { const g = vig.getContext('2d'); const gr = g.createRadialGradient(W / 2, H * 0.45, H * 0.28, W / 2, H * 0.45, H * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.42)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }

  /* ─── math ─── */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => { p = clamp(p); return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const easeOut = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const spring = (t, f = 2.6, d = 0.4) => { if (t <= 0) return 0; const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - d * d); return 1 - Math.exp(-d * w * t) * (Math.cos(wd * t) + (d * w / wd) * Math.sin(wd * t)); };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ─── words / events ─── */
  let WORDS = [];
  const norm = (w) => w.toLowerCase().replace(/’/g, "'").replace(/[^\p{L}\p{N}'-]/gu, '');
  function T(word, n = 1, edge = 's') { const key = norm(word); let k = 0; for (const w of WORDS) if (norm(w.w) === key && ++k === n) return w[edge]; throw new Error(`mot introuvable: ${word} #${n}`); }
  const EV = new Map();
  const ev = (type, t) => { if (isFinite(t)) EV.set(`${type}@${t.toFixed(3)}`, { type, t: +t.toFixed(3) }); };

  /* ─── builders (blocky, flat-coloured, no outlines) ─── */
  const MATS = new Map();
  const mat = (c, extra = {}) => { const k = c + JSON.stringify(extra); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, envMapIntensity: 0.7, ...extra })); return MATS.get(k); };
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  function box(parent, w, h, d, c, x, y, z, opt = {}) {
    const m = new THREE.Mesh(BOX, opt.material || mat(c, opt.mat || {}));
    m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = opt.cast !== false; m.receiveShadow = true;
    if (opt.ry) m.rotation.y = opt.ry; parent.add(m); return m;
  }
  /* Instancing: one InstancedMesh per part, N copies of a multi-box object (jets, crowds, houses). */
  const _M1 = new THREE.Matrix4(), _M2 = new THREE.Matrix4(), _M3 = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _Q2 = new THREE.Quaternion(), _E = new THREE.Euler(), _V = new THREE.Vector3(), _S = new THREE.Vector3(), _C = new THREE.Color();
  function instanced(parent, parts, n, opt = {}) {
    const meshes = parts.map((p) => {
      const m = new THREE.InstancedMesh(BOX, p.material || mat(p.tint ? '#ffffff' : p.c, p.mat || {}), n);
      m.castShadow = opt.cast !== false && p.cast !== false; m.receiveShadow = true; m.frustumCulled = false; parent.add(m); return { m, p };
    });
    const api = {
      n, meshes,
      place(i, o) { // o: {x, y, z, ry, rx, s, sy, hide}
        _Q.setFromEuler(_E.set(o.rx || 0, o.ry || 0, o.rz || 0)); const s = o.hide ? 0.0001 : (o.s || 1);
        _M1.compose(_V.set(o.x || 0, o.y || 0, o.z || 0), _Q, _S.set(s, o.hide ? 0.0001 : s * (o.sy || 1), s));
        meshes.forEach(({ m, p }) => {
          _Q2.setFromEuler(_E.set(p.rx || 0, p.ry || 0, 0)); _M2.compose(_V.set(p.x || 0, (p.y || 0) + (p.dy ? p.dy(i, o) : 0), p.z || 0), _Q2, _S.set(p.w, p.h, p.d));
          m.setMatrixAt(i, _M3.multiplyMatrices(_M1, _M2));
        });
      },
      color(i, part, c) { meshes[part].m.setColorAt(i, _C.set(c)); },
      done() { meshes.forEach(({ m }) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }); },
    };
    return api;
  }
  function textTexture(lines, opt = {}) {
    const cw = opt.w || 1024, ch = opt.h || 256, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d'); g.fillStyle = opt.bg || '#f4ecd8'; g.fillRect(0, 0, cw, ch);
    if (opt.border) { g.strokeStyle = opt.border; g.lineWidth = ch * 0.06; g.strokeRect(ch * 0.04, ch * 0.04, cw - ch * 0.08, ch * 0.08 > 0 ? ch - ch * 0.08 : ch); }
    const L = Array.isArray(lines) ? lines : [lines];
    let size = opt.size || ch * 0.6 / L.length; g.font = `${opt.weight || 800} ${size}px ${opt.font || 'Anton'}`;
    const wid = Math.max(...L.map((l) => g.measureText(l).width)); if (wid > cw * 0.88) { size *= cw * 0.88 / wid; g.font = `${opt.weight || 800} ${size}px ${opt.font || 'Anton'}`; }
    g.fillStyle = opt.fg || '#2b2d42'; g.textAlign = 'center'; g.textBaseline = 'middle';
    L.forEach((l, i) => g.fillText(l, cw / 2, ch / 2 + (i - (L.length - 1) / 2) * size * 1.12));
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
  }
  function sign(parent, lines, w, h, x, y, z, opt = {}) {
    const tx = textTexture(lines, { w: 1024, h: Math.round(1024 * h / w), ...opt });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9, emissive: opt.glow ? 0xffffff : 0x000000, emissiveMap: opt.glow ? tx : null, emissiveIntensity: opt.glow || 0 }));
    m.position.set(x, y, z); if (opt.ry) m.rotation.y = opt.ry; parent.add(m); return m;
  }
  /* Blocky person; returns {root, armL, armR, legL, legR, head} for animation. */
  function person(parent, c, x, z, opt = {}) {
    const root = new THREE.Group(); root.position.set(x, 0, z); if (opt.ry) root.rotation.y = opt.ry; parent.add(root);
    const s = opt.s || 1;
    const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-0.12 * s, 0.75 * s, 0); legR.position.set(0.12 * s, 0.75 * s, 0);
    box(legL, 0.2 * s, 0.75 * s, 0.22 * s, c.legs, 0, -0.375 * s, 0); box(legR, 0.2 * s, 0.75 * s, 0.22 * s, c.legs, 0, -0.375 * s, 0);
    root.add(legL, legR);
    box(root, 0.5 * s, 0.65 * s, 0.28 * s, c.body, 0, 1.08 * s, 0);
    const head = new THREE.Group(); head.position.set(0, 1.42 * s, 0); root.add(head);
    box(head, 0.42 * s, 0.42 * s, 0.42 * s, c.skin || '#e8b48f', 0, 0.21 * s, 0);
    box(head, 0.44 * s, 0.12 * s, 0.44 * s, c.hair || '#3a2a20', 0, 0.42 * s, 0);
    if (c.hat) { box(head, 0.55 * s, 0.04 * s, 0.55 * s, c.hat, 0, 0.46 * s, 0); box(head, 0.36 * s, 0.16 * s, 0.36 * s, c.hat, 0, 0.55 * s, 0); }
    box(head, 0.07 * s, 0.07 * s, 0.02 * s, '#1b1b24', -0.1 * s, 0.24 * s, 0.215 * s, { cast: false }); box(head, 0.07 * s, 0.07 * s, 0.02 * s, '#1b1b24', 0.1 * s, 0.24 * s, 0.215 * s, { cast: false });
    const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.34 * s, 1.36 * s, 0); armR.position.set(0.34 * s, 1.36 * s, 0);
    box(armL, 0.16 * s, 0.6 * s, 0.18 * s, c.body, 0, -0.3 * s, 0); box(armR, 0.16 * s, 0.6 * s, 0.18 * s, c.body, 0, -0.3 * s, 0);
    box(armL, 0.15 * s, 0.13 * s, 0.17 * s, c.skin || '#e8b48f', 0, -0.62 * s, 0); box(armR, 0.15 * s, 0.13 * s, 0.17 * s, c.skin || '#e8b48f', 0, -0.62 * s, 0);
    root.add(armL, armR);
    return { root, armL, armR, legL, legR, head };
  }
  function walkPose(p, t, speed = 1) { const a = Math.sin(t * 7 * speed) * 0.6; p.legL.rotation.x = a; p.legR.rotation.x = -a; p.armL.rotation.x = -a * 0.8; p.armR.rotation.x = a * 0.8; }
  function idlePose(p, t, seed = 0) { p.head.rotation.y = Math.sin(t * 0.9 + seed) * 0.25; p.armL.rotation.x = 0; p.armR.rotation.x = 0; p.legL.rotation.x = 0; p.legR.rotation.x = 0; }

  /* First-person hands, parented to the camera. */
  const hands = new THREE.Group(); camera.add(hands);
  const handL = new THREE.Group(), handR = new THREE.Group(); hands.add(handL, handR);
  function buildHands(sleeve) {
    [handL, handR].forEach((h) => { while (h.children.length) h.remove(h.children[0]); });
    box(handR, 0.16, 0.16, 0.7, sleeve, 0, 0, 0.1, { cast: false }); box(handR, 0.15, 0.12, 0.16, '#e8b48f', 0, 0.01, -0.3, { cast: false });
    box(handL, 0.16, 0.16, 0.7, sleeve, 0, 0, 0.1, { cast: false }); box(handL, 0.15, 0.12, 0.16, '#e8b48f', 0, 0.01, -0.3, { cast: false });
    handR.add(cashMesh); // clearing the hand detached the held object: re-attach it
  }
  const cashMesh = new THREE.Group(); handR.add(cashMesh);
  function setHeld(kind) {
    while (cashMesh.children.length) cashMesh.remove(cashMesh.children[0]);
    if (kind === 'cash') { box(cashMesh, 0.34, 0.09, 0.18, '#7fa36a', 0, 0.11, -0.4, { cast: false }); box(cashMesh, 0.09, 0.095, 0.185, '#e9e4d2', 0, 0.111, -0.4, { cast: false }); }
    if (kind === 'shovel') { box(cashMesh, 0.05, 0.05, 1.0, '#9a6b3f', 0, 0.02, -0.55, { cast: false }); box(cashMesh, 0.22, 0.03, 0.26, '#8a929c', 0, 0.0, -1.15, { cast: false, mat: { metalness: 0.7, roughness: 0.35 } }); box(cashMesh, 0.14, 0.06, 0.05, '#2b2f36', 0, 0.02, -0.02, { cast: false }); }
    if (kind === 'card') { box(cashMesh, 0.3, 0.02, 0.19, '#15161a', 0, 0.1, -0.42, { cast: false, mat: { metalness: 0.8, roughness: 0.3 } }); box(cashMesh, 0.07, 0.022, 0.05, '#d8b25a', -0.07, 0.101, -0.42, { cast: false, mat: { metalness: 0.9, roughness: 0.25 } }); }
  }
  function poseHands(t, give = 0) { // give 0..1: right hand reaches forward (paying). Only the right hand is in frame.
    const bob = Math.sin(t * 1.6) * 0.006;
    handL.visible = false;
    handR.scale.setScalar(0.55);
    handR.position.set(0.11 + 0.02 * give, -0.2 + bob + 0.05 * give, -0.5 - 0.12 * give); handR.rotation.set(0.55 - 0.3 * give, -0.35, 0.15);
  }

  /* ─── HUD (2D) ─── */
  function hudText(g, text, x, y, font, fill, opt = {}) {
    g.font = font; g.textAlign = opt.align || 'left'; g.textBaseline = 'alphabetic';
    if (opt.stroke) { g.lineJoin = 'round'; g.lineWidth = opt.stroke; g.strokeStyle = opt.strokeColor || 'rgba(10,20,10,0.85)'; g.strokeText(text, x, y); }
    if (opt.shadow) { g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = opt.shadow; g.shadowOffsetY = 3; }
    g.fillStyle = fill; g.fillText(text, x, y); g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  }
  const money = (v) => '$' + Math.round(v).toLocaleString('en-US');

  /* ─── assembly ─── */
  let FILM = null, CAP = [];
  function shotAt(t) { const S = FILM.shots; for (let i = S.length - 1; i >= 0; i--) if (t >= S[i].t0) return i; return 0; }
  function drawFrame(t) {
    const i = shotAt(t), sh = FILM.shots[i];
    const t1 = i + 1 < FILM.shots.length ? FILM.shots[i + 1].t0 : FILM.end;
    const s = { t, lt: t - sh.t0, p: clamp((t - sh.t0) / Math.max(0.01, t1 - sh.t0)), t0: sh.t0, t1 };
    Object.values(FILM.sets).forEach((st) => (st.group.visible = st === FILM.sets[sh.set]));
    const set = FILM.sets[sh.set];
    const c = sh.cam(s);
    const top = set.skyTop || set.sky;
    scene.background = skyTex(top, set.sky); scene.fog = new THREE.Fog(set.fog || set.sky, set.fogNear || 25, set.fogFar || 90);
    scene.environment = envMap(top, set.ground || '#6b6258', set.sunColor || '#fff2dd'); 
    renderer.toneMappingExposure = set.exposure || 1.0;
    // the sun's shadow box follows what the camera looks at, so shadows stay sharp in huge sets
    const L = c.look, dir = new THREE.Vector3(...(set.sun || [12, 22, 10])).normalize(), ext = c.shadow || set.shadow || 30;
    const fx = lerp(c.pos[0], L[0], 0.5), fz = lerp(c.pos[2], L[2], 0.5);
    sun.target.position.set(fx, 0, fz); sun.position.set(fx + dir.x * 80, dir.y * 80, fz + dir.z * 80);
    Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 200 }); sun.shadow.camera.updateProjectionMatrix();
    fill.position.set(fx - dir.x * 50, 30, fz - dir.z * 50); fill.target.position.set(fx, 0, fz); fill.intensity = set.fillI ?? 0.5;
    hemi.color.set(set.hemiSky || '#ffffff'); hemi.groundColor.set(set.hemiGround || '#8a7a66');
    hemi.intensity = set.hemi ?? 1.0; lamp.intensity = c.lamp ?? set.lamp ?? 0; sun.intensity = set.sunI ?? 2.6; sun.color.set(set.sunColor || '#fff2dd');
    camera.position.set(...c.pos); camera.lookAt(...c.look); if (c.roll) camera.rotation.z += c.roll;
    camera.fov = c.fov || 62; camera.updateProjectionMatrix();
    hands.visible = c.hands !== false;
    if (set.update) set.update(s, sh);
    if (sh.update) sh.update(s);
    renderer.render(scene, camera);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glc, 0, 0); ctx.drawImage(vig, 0, 0);
    FILM.hud(ctx, s, sh);
    drawCaptions(ctx, t);
    FILM.wipes.forEach((tc) => wipe(ctx, t, tc));
  }

  /* captions: the spoken sentence in italic serif (reference look), current word brighter (captions-overlay rail) */
  function buildCaptions() {
    const groups = []; let cur = [];
    WORDS.forEach((w, i) => {
      cur.push(w); const nxt = WORDS[i + 1];
      const brk = /[.?!]$/.test(w.w) || !nxt || nxt.s - w.e >= 0.35 || cur.length >= 7 || (/[,:]$/.test(w.w) && cur.length >= 3);
      if (brk) { groups.push(cur); cur = []; }
    });
    CAP = groups.map((g, i) => ({ words: g, start: Math.max(0.1, g[0].s - 0.06), end: Math.min(g[g.length - 1].e + 0.35, groups[i + 1] ? groups[i + 1][0].s - 0.03 : 1e9) }));
  }
  function drawCaptions(g, t) {
    const grp = CAP.find((c) => t >= c.start && t < c.end); if (!grp) return;
    const cy = 1300, size = 58; g.font = `500 italic ${size}px "EB Garamond"`;
    const words = grp.words.map((w) => ({ ...w, txt: w.w }));
    const sp = g.measureText(' ').width; const lines = [[]]; let lw = 0;
    words.forEach((w) => { const ww = g.measureText(w.txt).width; if (lw + ww > 860 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ ...w, ww }); lw += ww + sp; });
    lines.forEach((ln, li) => {
      const total = ln.reduce((a, w) => a + w.ww, 0) + sp * (ln.length - 1); let x = W / 2 - total / 2;
      const y = cy + (li - (lines.length - 1) / 2) * size * 1.15;
      ln.forEach((w) => {
        const on = t >= w.s && t < w.e + 0.05;
        hudText(g, w.txt, x, y, `500 italic ${size}px "EB Garamond"`, on ? '#ffffff' : 'rgba(255,255,255,0.78)', { shadow: 14 });
        if (on) { g.fillStyle = '#ffd23f'; g.fillRect(x, y + 8, w.ww, 4); }
        x += w.ww + sp;
      });
    });
  }
  function wipe(g, t, tc) { // white flash-cut between eras (0.2 s in / 0.2 s out)
    const d = t - tc; if (d < -0.2 || d > 0.2) return;
    if (d < -0.199) ev('whoosh', tc - 0.2);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - Math.abs(d) / 0.2; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.restore();
  }

  function seekBlur(t, n = 1, span = 1 / 120) { drawFrame(t); }

  async function init() {
    const words = await (await fetch('../timing/words.json')).json(); WORDS = words.words;
    await Promise.all(['800 40px Montserrat', '40px Anton', 'italic 500 40px "EB Garamond"'].map((f) => document.fonts.load(f)));
    FILM = window.buildFilm({ THREE, T, instanced, renderer, camera, W, H, clamp, lerp, ease, easeOut, spring, hash, ev, box, sign, textTexture, person, walkPose, idlePose, mat, scene, buildHands, setHeld, poseHands, hudText, money, duration: words.duration });
    Object.values(FILM.sets).forEach((st) => scene.add(st.group));
    buildCaptions();
    // register sound events: the HUD alone is enough (no WebGL render needed)
    FILM.shots.forEach((sh, i) => { const t1 = i + 1 < FILM.shots.length ? FILM.shots[i + 1].t0 : FILM.end; for (let k = 0; k <= 3; k++) { const t = lerp(sh.t0, t1 - 0.001, k / 3); FILM.hud(ctx, { t, lt: t - sh.t0, p: k / 3, t0: sh.t0, t1 }, sh); } });
    FILM.wipes.forEach((tc) => ev('whoosh', tc - 0.2));
    window.EV = [...EV.values()].sort((a, b) => a.t - b.t);
    window.END = FILM.end; window.SHOTS = FILM.shots.map((s) => ({ id: s.id, t0: s.t0 })); window.WIPES = FILM.wipes;
    window.seek = (t) => drawFrame(t); window.seekBlur = seekBlur;
    drawFrame(0); window.READY = true;
  }
  init().catch((e) => { window.ERROR = String(e && e.stack || e); console.error(e); });
})();

/* HQ engine: Three.js r160 + glTF assets (rigged characters, Poly Haven CC0 props), HDRI lighting,
 * post-processing (GTAO ambient occlusion, bloom, depth of field), elegant HUD typography.
 * Same window contract as the other engines: READY, END, SHOTS, EV, WIPES, seek(t), seekBlur(t, n, span).
 * Every frame is a pure function of time t (animation mixers are set to absolute times).
 */
(() => {
  const W = 1080, H = 1920, S = 0.75; // internal render scale, upscaled on the 2D canvas
  const out = document.getElementById('c'); const ctx = out.getContext('2d');
  const glc = document.createElement('canvas'); glc.width = Math.round(W * S); glc.height = Math.round(H * S);
  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(glc.width, glc.height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 6000); scene.add(camera);
  const pmrem = new THREE.PMREMGenerator(renderer);

  /* ─── math ─── */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => { p = clamp(p); return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const easeOut = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ─── words / events ─── */
  let WORDS = [];
  const norm = (w) => w.toLowerCase().replace(/’/g, "'").replace(/[^\p{L}\p{N}'-]/gu, '');
  function T(word, n = 1, edge = 's') { const key = norm(word); let k = 0; for (const w of WORDS) if (norm(w.w) === key && ++k === n) return w[edge]; throw new Error(`mot introuvable: ${word} #${n}`); }
  const EV = new Map(); const ev = (type, t) => { if (isFinite(t)) EV.set(`${type}@${t.toFixed(3)}`, { type, t: +t.toFixed(3) }); };

  /* ─── assets ─── */
  const gltf = new X.GLTFLoader(); const draco = new X.DRACOLoader(); draco.setDecoderPath('hq/draco/'); gltf.setDRACOLoader(draco);
  const rgbe = new X.RGBELoader();
  const ASSETS = { models: {}, envs: {}, hdrs: {} };
  async function loadAssets(list) {
    await Promise.all((list.models || []).map(async ([k, url]) => { ASSETS.models[k] = await gltf.loadAsync(url); }));
    await Promise.all((list.hdr || []).map(async ([k, url]) => { const t = await rgbe.loadAsync(url); t.mapping = THREE.EquirectangularReflectionMapping; ASSETS.hdrs[k] = t; ASSETS.envs[k] = pmrem.fromEquirectangular(t).texture; }));
  }
  function instance(key, opt = {}) { // deep clone (skinned meshes included) with shadows on
    const src = ASSETS.models[key]; const root = X.SkeletonUtils.clone(src.scene);
    root.traverse((o) => { if (o.isMesh) { o.castShadow = opt.cast !== false; o.receiveShadow = true; if (opt.tint && o.material) { o.material = o.material.clone(); o.material.color.set(opt.tint); } } });
    const mixer = new THREE.AnimationMixer(root); const actions = {};
    const additive = new Set(opt.additive || []);
    (src.animations || []).forEach((a) => {
      if (additive.has(a.name)) { const c = a.clone(); THREE.AnimationUtils.makeClipAdditive(c); actions[a.name] = mixer.clipAction(c); actions[a.name].blendMode = THREE.AdditiveAnimationBlendMode; }
      else actions[a.name] = mixer.clipAction(a);
    });
    // act([[name, weight, localTime], ...]): absolute, deterministic pose (each clip at its own time)
    const act = (list) => { Object.values(actions).forEach((ac) => { ac.enabled = false; }); list.forEach(([n, w, lt]) => { const ac = actions[n]; if (!ac || w <= 0) return; ac.enabled = true; ac.play(); ac.setEffectiveWeight(w); const d = ac.getClip().duration; ac.time = d > 0 ? ((Math.max(0, lt) % d) + d) % d : 0; }); mixer.update(0); };
    return { root, mixer, actions, act, pose(name, t) { act([[name, 1, t]]); } };
  }

  /* ─── post-processing ─── */
  const rt = new THREE.WebGLRenderTarget(glc.width, glc.height, { samples: 4, type: THREE.HalfFloatType });
  const composer = new X.EffectComposer(renderer, rt);
  composer.addPass(new X.RenderPass(scene, camera));
  const AO = new URLSearchParams(location.search).get('ao') === '1'; if (AO) { const gtao = new X.GTAOPass(scene, camera, glc.width, glc.height); gtao.updateGtaoMaterial({ radius: 0.4, distanceExponent: 1.4, thickness: 1, scale: 1.0 }); composer.addPass(gtao); }
  const bloom = new X.UnrealBloomPass(new THREE.Vector2(glc.width, glc.height), 0.25, 0.5, 0.92); composer.addPass(bloom);
  const bokeh = new X.BokehPass(scene, camera, { focus: 5, aperture: 0.0, maxblur: 0.008 }); composer.addPass(bokeh);
  composer.addPass(new X.OutputPass());

  /* ─── overlays: vignette + fine grain ─── */
  const vig = document.createElement('canvas'); vig.width = W; vig.height = H;
  { const g = vig.getContext('2d'); const gr = g.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H * 0.46, H * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.38)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const grains = [0, 1, 2, 3].map((k) => { const c = document.createElement('canvas'); c.width = 270; c.height = 480; const g = c.getContext('2d'); const im = g.createImageData(270, 480); for (let i = 0; i < im.data.length; i += 4) { const v = Math.floor(hash(i * 0.37 + k * 101) * 255); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 10; } g.putImageData(im, 0, 0); return c; });

  /* ─── HUD typography (thin, letterspaced labels + serif figures) ─── */
  function label(g, text, x, y, opt = {}) { g.save(); g.font = `${opt.weight || 600} ${opt.size || 22}px Inter`; g.letterSpacing = `${opt.track ?? 4}px`; g.textAlign = opt.align || 'left'; g.fillStyle = opt.color || 'rgba(255,255,255,0.78)'; g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 10; g.fillText(text, x, y); g.restore(); }
  function figure(g, text, x, y, opt = {}) { g.save(); let size = opt.size || 120; g.font = `500 ${size}px Garamond`; const w = g.measureText(text).width, max = opt.max || 860; if (w > max) { size *= max / w; g.font = `500 ${size}px Garamond`; } g.textAlign = opt.align || 'left'; g.fillStyle = opt.color || '#ffffff'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 24; g.shadowOffsetY = 2; g.fillText(text, x, y); g.restore(); return size; }
  function rule(g, x, y, w, col = 'rgba(255,255,255,0.3)', h = 2) { g.fillStyle = col; g.fillRect(x, y, w, h); }

  /* ─── captions: plain serif, centred (reference look) ─── */
  let CAP = [];
  function buildCaptions() {
    const groups = []; let cur = [];
    WORDS.forEach((w, i) => { cur.push(w); const nxt = WORDS[i + 1]; const brk = /[.?!]$/.test(w.w) || !nxt || nxt.s - w.e >= 0.35 || cur.length >= 6 || (/[,:]$/.test(w.w) && cur.length >= 3); if (brk) { groups.push(cur); cur = []; } });
    CAP = groups.map((g, i) => ({ words: g, start: Math.max(0.05, g[0].s - 0.06), end: Math.min(g[g.length - 1].e + 0.35, groups[i + 1] ? groups[i + 1][0].s - 0.03 : 1e9) }));
  }
  function drawCaptions(g, t) {
    const grp = CAP.find((c) => t >= c.start && t < c.end); if (!grp) return;
    const size = 56; g.save(); g.font = `500 italic ${size}px "EB Garamond"`;
    const sp = g.measureText(' ').width; const lines = [[]]; let lw = 0;
    grp.words.forEach((w) => { const ww = g.measureText(w.w).width; if (lw + ww > 800 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ ...w, ww }); lw += ww + sp; });
    const k = easeOut((t - grp.start) / 0.25);
    lines.forEach((ln, li) => {
      const total = ln.reduce((a, w) => a + w.ww, 0) + sp * (ln.length - 1); let x = W / 2 - total / 2; const y = 1320 + (li - (lines.length - 1) / 2) * size * 1.12 + (1 - k) * 10;
      ln.forEach((w) => { const on = t >= w.s - 0.02; g.fillStyle = on ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.55)'; g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = 16; g.fillText(w.w, x, y); x += w.ww + sp; });
    });
    g.restore();
  }

  /* ─── frame ─── */
  let FILM = null;
  function shotAt(t) { const S_ = FILM.shots; for (let i = S_.length - 1; i >= 0; i--) if (t >= S_[i].t0) return i; return 0; }
  const acc = document.createElement('canvas'); acc.width = W; acc.height = H; const actx = acc.getContext('2d');
  function drawFrame(t) {
    const i = shotAt(t), sh = FILM.shots[i];
    const n = sh.blur || 1, span = sh.blurSpan || 1 / 90; // motion blur: average n sub-frames over `span` seconds
    if (n <= 1) { render3D(t); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glc, 0, 0, W, H); }
    else { actx.globalAlpha = 1; for (let k = 0; k < n; k++) { render3D(Math.max(sh.t0, t - span * k / (n - 1))); actx.globalAlpha = 1 / (k + 1); actx.drawImage(glc, 0, 0, W, H); } ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(acc, 0, 0); }
    overlay(t, i);
  }
  function render3D(t) {
    const i = shotAt(t), sh = FILM.shots[i]; const t1 = i + 1 < FILM.shots.length ? FILM.shots[i + 1].t0 : FILM.end;
    const s = { t, lt: t - sh.t0, p: clamp((t - sh.t0) / Math.max(0.01, t1 - sh.t0)), t0: sh.t0, t1 };
    Object.values(FILM.sets).forEach((st) => (st.group.visible = st === FILM.sets[sh.set]));
    const set = FILM.sets[sh.set];
    scene.environment = ASSETS.envs[set.env] || null; scene.environmentIntensity = set.envI ?? 1;
    scene.background = set.bg === 'hdr' ? ASSETS.hdrs[set.env] : new THREE.Color(set.bg || '#000000'); scene.backgroundBlurriness = set.bgBlur ?? 0; scene.backgroundIntensity = set.bgI ?? 1;
    scene.fog = set.fog ? new THREE.Fog(set.fog[0], set.fog[1], set.fog[2]) : null;
    renderer.toneMappingExposure = set.exposure ?? 1;
    const c = window.__CAMOVR ? { ...sh.cam(s), ...window.__CAMOVR, aperture: 0 } : sh.cam(s);
    camera.position.set(...c.pos); camera.up.set(0, 1, 0); camera.lookAt(...c.look); if (c.roll) camera.rotateZ(c.roll);
    camera.fov = c.fov || 40; camera.updateProjectionMatrix();
    // depth of field: focus on the look point unless told otherwise
    const fdist = c.focus ?? new THREE.Vector3(...c.pos).distanceTo(new THREE.Vector3(...c.look));
    bokeh.uniforms.focus.value = fdist; bokeh.uniforms.aperture.value = c.aperture ?? 0.0006; bokeh.enabled = (c.aperture ?? 0.0006) > 0;
    bloom.strength = set.bloom ?? 0.25;
    if (set.update) set.update(s, sh); if (sh.update) sh.update(s);
    composer.render();
  }
  function overlay(t, i) {
    const sh = FILM.shots[i]; const t1 = i + 1 < FILM.shots.length ? FILM.shots[i + 1].t0 : FILM.end;
    const s = { t, lt: t - sh.t0, p: clamp((t - sh.t0) / Math.max(0.01, t1 - sh.t0)), t0: sh.t0, t1 };
    ctx.drawImage(vig, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(grains[Math.floor(t * 24) % 4], 0, 0, W, H);
    FILM.hud(ctx, s, sh); if (FILM.captions) FILM.captions(ctx, t); else drawCaptions(ctx, t);
  }
  function seekBlur(t, n = 1, span = 1 / 120) { drawFrame(t); }

  async function init() {
    const words = await (await fetch('../timing/words.json')).json(); WORDS = words.words;
    let LINES = []; try { LINES = await (await fetch('../timing/lines.json')).json(); } catch (e) { /* no dialogue */ }
    await Promise.all(['500 40px Garamond', '600 20px Inter', '700 20px Inter', '800 20px Inter', '900 20px Inter', 'italic 500 40px "EB Garamond"'].map((f) => document.fonts.load(f)));
    await loadAssets(window.FILM_ASSETS || {});
    FILM = window.buildFilm({ THREE, X, T, W, H, clamp, lerp, ease, easeOut, smooth, hash, ev, scene, camera, renderer, ASSETS, instance, label, figure, rule, WORDS, LINES, glc, duration: words.duration });
    Object.values(FILM.sets).forEach((st) => scene.add(st.group));
    buildCaptions();
    FILM.shots.forEach((sh, i) => { const t1 = i + 1 < FILM.shots.length ? FILM.shots[i + 1].t0 : FILM.end; for (let k = 0; k <= 3; k++) { const t = lerp(sh.t0, t1 - 0.001, k / 3); FILM.hud(ctx, { t, lt: t - sh.t0, p: k / 3, t0: sh.t0, t1 }, sh); } });
    window.EV = [...EV.values()].sort((a, b) => a.t - b.t);
    window.END = FILM.end; window.SHOTS = FILM.shots.map((s) => ({ id: s.id, t0: s.t0 })); window.WIPES = [];
    window.seek = (t) => drawFrame(t); window.seekBlur = seekBlur;
    drawFrame(0); window.READY = true;
  }
  init().catch((e) => { window.ERROR = String(e && e.stack || e); console.error(e); });
})();

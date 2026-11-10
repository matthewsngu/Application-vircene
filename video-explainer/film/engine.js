/* Explainer engine — every frame is a pure function of time.
 * Coordinates: plates and everything on them live in "plate px" (3840x2160),
 * drawn through one camera transform. Screen-space UI (date card, wipe) is 1920x1080.
 */
(() => {
  const W = 1920, H = 1080, PW = 3840, PH = 2160;
  const PX = PW / W; // plate px per screen px at zoom 1

  const C = {
    ink: '#2b2d42', red: '#d62828', orange: '#f4a261', white: '#ffffff',
    titleRed: '#e2552f', titlePurple: '#5b3fa6', gear: '#6a4cb6',
    blueGrey: '#6f8299', teal: '#4f7c86', beige: '#d9c3a5', navy: '#2c3e5c',
    violet: '#8e7cc3', skin: '#f2a08a', chalk: '#eeeee4',
  };

  /* ───────────── math ───────────── */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const easeOut = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const easeInOut = (p) => { p = clamp(p); return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  // Damped spring 0→1 with overshoot; t in seconds since start.
  const spring = (t, freq = 2.6, damp = 0.32) => {
    if (t <= 0) return 0;
    const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - damp * damp);
    return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp * w / wd) * Math.sin(wd * t));
  };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ───────────── timing (words) ───────────── */
  let WORDS = [];
  const norm = (w) => w.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}'’-]/gu, '').replace(/’/g, "'");
  // T('alors', 2) → start time of the 2nd "alors". Cuts always land on a real word.
  function T(word, n = 1, edge = 's') {
    const key = norm(word);
    let k = 0;
    for (const w of WORDS) if (norm(w.w) === key && ++k === n) return w[edge];
    throw new Error(`mot introuvable: ${word} #${n}`);
  }
  // Times of each letter-ish word inside a phrase starting at word (for per-word pops).
  function wordsFrom(word, n, count) {
    const key = norm(word); let k = 0, i = -1;
    for (let j = 0; j < WORDS.length; j++) if (norm(WORDS[j].w) === key && ++k === n) { i = j; break; }
    return WORDS.slice(i, i + count).map((w) => w.s);
  }

  /* ───────────── events (for SFX) ───────────── */
  const EV = new Map();
  const ev = (type, t) => { if (isFinite(t)) EV.set(`${type}@${t.toFixed(3)}`, { type, t: +t.toFixed(3) }); };

  /* ───────────── canvas + camera ───────────── */
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const acc = document.createElement('canvas'); acc.width = W; acc.height = H;
  const actx = acc.getContext('2d');

  // cam = {x, y, z0, z1, dx, dy}: centre in plate px, zoom (>=1) drifting z0→z1, pan dx/dy (plate px) over the shot.
  function applyCamera(g, cam, p) {
    const z = Math.max(1, lerp(cam.z0, cam.z1, easeInOut(p)));
    const s = (W / PW) * z;
    const vw = W / s, vh = H / s;
    let cx = cam.x + lerp(0, cam.dx || 0, easeInOut(p));
    let cy = cam.y + lerp(0, cam.dy || 0, easeInOut(p));
    cx = clamp(cx, vw / 2, PW - vw / 2); // never show past the plate edges
    cy = clamp(cy, vh / 2, PH - vh / 2);
    g.setTransform(s, 0, 0, s, W / 2 - cx * s, H / 2 - cy * s);
    return s;
  }

  /* ───────────── images ───────────── */
  const IMG = {};
  function loadImage(key, src) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => { IMG[key] = im; res(); };
      im.onerror = () => res(); // missing → placeholder art
      im.src = src;
    });
  }

  /* ───────────── text typed on world objects ───────────── */
  const FONT = 'Montserrat';
  const CPS = 30; // letters per second (spec 26-34)
  // Lays text out inside rect r=[x,y,w,h] (plate px); returns letter positions.
  function layout(g, text, r, maxSize) {
    const lines = text.split('\n');
    let size = maxSize || r[3] * 0.62 / lines.length;
    g.font = `800 ${size}px ${FONT}`;
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > r[2] * 0.86) size *= (r[2] * 0.86) / widest;
    size = Math.min(size, r[3] * 0.8 / (lines.length * 1.12));
    g.font = `800 ${size}px ${FONT}`;
    const lh = size * 1.12, top = r[1] + r[3] / 2 - (lh * lines.length) / 2 + size * 0.82;
    const out = [];
    lines.forEach((line, li) => {
      const lw = g.measureText(line).width;
      let x = r[0] + r[2] / 2 - lw / 2;
      for (const ch of line) {
        const cw = g.measureText(ch).width;
        out.push({ ch, x, y: top + li * lh, cw });
        x += cw;
      }
    });
    return { size, letters: out };
  }

  // typeText: each letter arrives 1.45x bigger, 0.7em to the right, settles in 0.18 s.
  function typeText(g, text, r, t0, t, opt = {}) {
    const color = opt.color || C.ink;
    const cps = opt.cps || CPS;
    const L = layout(g, text, r, opt.size);
    let i = 0;
    L.letters.forEach((l) => {
      if (l.ch === ' ') { i++; return; }
      const tl = t0 + i / cps; i++;
      if (i % 2 === 0) ev('type', tl);
      const p = (t - tl) / 0.18;
      if (p < 0) return;
      const e = easeOut(p);
      const sc = lerp(1.45, 1, e), off = lerp(0.7 * L.size, 0, e);
      g.save();
      g.translate(l.x + l.cw / 2 + off, l.y - L.size * 0.35);
      g.scale(sc, sc);
      g.fillStyle = color;
      g.font = `800 ${L.size}px ${FONT}`;
      g.textAlign = 'center';
      g.fillText(l.ch, 0, L.size * 0.35);
      g.restore();
    });
    return t0 + i / cps;
  }

  // Red X: two round strokes, 0.11 s each, 30 screen px thick.
  function redX(g, r, t0, t) {
    ev('hit', t0);
    const pad = Math.min(r[2], r[3]) * 0.08;
    const a = [r[0] + pad, r[1] + pad], b = [r[0] + r[2] - pad, r[1] + r[3] - pad];
    const c = [r[0] + r[2] - pad, r[1] + pad], d = [r[0] + pad, r[1] + r[3] - pad];
    g.save();
    g.strokeStyle = C.red; g.lineCap = 'round'; g.lineWidth = 30 * PX;
    [[a, b, t0], [c, d, t0 + 0.11]].forEach(([p, q, ts]) => {
      const k = clamp((t - ts) / 0.11);
      if (k <= 0) return;
      g.beginPath(); g.moveTo(p[0], p[1]);
      g.lineTo(lerp(p[0], q[0], k), lerp(p[1], q[1], k)); g.stroke();
    });
    g.restore();
  }

  /* ───────────── arrivals: spring / squash / white puff (never fades) ───────────── */
  function popScale(t, t0) { return t < t0 ? 0 : spring(t - t0, 2.4, 0.38); }
  function withPop(g, cx, cy, t, t0, fn, kind = 'spring') {
    if (t < t0) return;
    ev('pop', t0);
    const k = popScale(t, t0);
    g.save(); g.translate(cx, cy);
    if (kind === 'squash') {
      const q = Math.sin(clamp((t - t0) / 0.35) * Math.PI) * 0.22;
      g.scale(k * (1 + q), k * (1 - q));
    } else g.scale(k, k);
    g.translate(-cx, -cy); fn(); g.restore();
  }
  // White puff: circles that grow then shrink to nothing.
  function puff(g, cx, cy, rad, t, t0) {
    const p = (t - t0) / 0.45;
    if (p < 0 || p > 1) return;
    g.save(); g.fillStyle = C.white;
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + hash(i + t0) * 0.6;
      const d = rad * (0.4 + 0.9 * easeOut(p));
      const r = rad * 0.32 * Math.sin(Math.PI * clamp(p * 1.1)) * (0.7 + 0.5 * hash(i * 3 + t0));
      if (r <= 0) continue;
      g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, r, 0, 7); g.fill();
    }
    g.restore();
  }

  // "!" or "?" bubble popping over a head
  function mark(g, x, y, ch, t, t0, size = 150, col) {
    withPop(g, x, y, t, t0, () => {
      g.save(); g.translate(x, y); g.rotate(Math.sin((t - t0) * 6) * 0.08);
      g.fillStyle = col || (ch === '!' ? C.red : C.ink);
      g.font = `800 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineJoin = 'round';
      g.fillText(ch, 0, 0); g.restore();
    }, 'squash');
  }

  /* ───────────── rig: clay characters with IK arms + walk ───────────── */
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const m = f < 0 ? 0 : 255, a = Math.abs(f);
    r = Math.round(r + (m - r) * a); gg = Math.round(gg + (m - gg) * a); b = Math.round(b + (m - b) * a);
    return `rgb(${r},${gg},${b})`;
  };

  // Rounded clay capsule from p to q with soft highlight (no outlines).
  function tube(g, p, q, w, col) {
    g.lineCap = 'round';
    g.strokeStyle = shade(col, -0.18); g.lineWidth = w;
    g.beginPath(); g.moveTo(p[0], p[1] + w * 0.06); g.lineTo(q[0], q[1] + w * 0.06); g.stroke();
    g.strokeStyle = col; g.lineWidth = w * 0.84;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
    g.strokeStyle = shade(col, 0.22); g.lineWidth = w * 0.24;
    g.beginPath(); g.moveTo(p[0] - w * 0.14, p[1] - w * 0.16); g.lineTo(q[0] - w * 0.14, q[1] - w * 0.16); g.stroke();
  }
  function blob(g, x, y, rx, ry, col, rot = 0) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = shade(col, -0.16); g.beginPath(); g.ellipse(0, ry * 0.05, rx, ry, 0, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.ellipse(-rx * 0.03, -ry * 0.03, rx * 0.95, ry * 0.93, 0, 0, 7); g.fill();
    g.fillStyle = shade(col, 0.25); g.beginPath(); g.ellipse(-rx * 0.35, -ry * 0.4, rx * 0.3, ry * 0.18, -0.5, 0, 7); g.fill();
    g.restore();
  }
  function roundRect(g, x, y, w, h, r, col) {
    g.fillStyle = shade(col, -0.15);
    g.beginPath(); g.roundRect(x, y + h * 0.02, w, h, r); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(x + w * 0.02, y, w * 0.96, h * 0.97, r); g.fill();
    g.fillStyle = shade(col, 0.18); g.beginPath(); g.roundRect(x + w * 0.1, y + h * 0.06, w * 0.25, h * 0.5, r * 0.6); g.fill();
  }

  // Two-bone IK: shoulder S → target, upper 118 / lower 112 (x k), bend side ±1.
  function ik(S, Tg, L1, L2, bend) {
    const dx = Tg[0] - S[0], dy = Tg[1] - S[1];
    const d = clamp(Math.hypot(dx, dy), 1, L1 + L2 - 0.5);
    const a = Math.atan2(dy, dx);
    const cosA = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const e = a + bend * Math.acos(cosA);
    const E = [S[0] + Math.cos(e) * L1, S[1] + Math.sin(e) * L1];
    const ang = Math.atan2(Tg[1] - E[1], Tg[0] - E[0]);
    const Hd = [E[0] + Math.cos(ang) * L2, E[1] + Math.sin(ang) * L2];
    return { E, Hd, ang };
  }
  function mitten(g, Hd, ang, hand, k, col) {
    g.save(); g.translate(Hd[0], Hd[1]); g.rotate(ang);
    const r = 30 * k;
    if (hand === 'fist') blob(g, r * 0.4, 0, r, r * 0.95, col);
    else if (hand === 'point') {
      blob(g, r * 0.4, 0, r * 0.9, r * 0.8, col);
      tube(g, [r * 0.9, -r * 0.2], [r * 2.3, -r * 0.2], r * 0.55, col);
    } else {
      const open = hand === 'open' ? 1 : 0.4;
      blob(g, r * 0.7, 0, r * 1.25, r * 0.9 * (0.8 + 0.25 * open), col);
      tube(g, [r * 0.3, -r * 0.5], [r * (0.6 + 0.4 * open), -r * (1.0 + 0.5 * open)], r * 0.55, col);
    }
    g.restore();
  }

  // Blink 0.14 s every 2.7–4.2 s (deterministic per seed).
  function blinking(t, seed) {
    let tt = hash(seed) * 2.7;
    for (let i = 0; i < 60 && tt < t + 1; i++) {
      if (t >= tt && t < tt + 0.14) return true;
      tt += 2.7 + hash(seed * 7 + i) * 1.5;
    }
    return false;
  }

  /* Character spec: {skin, top, bottom, hair, hairStyle, glasses, coat, seed}
   * State: {x, y (feet), k (scale; 1 = 918 px sprite), face:±1, pose:'stand'|'walk'|'sit'|'lie',
   *         t, walkT, arms:[L,R] each {to:[x,y] world | null, hand}, nod, eyesClosed, scribble, helmet, wires} */
  function drawChar(g, ch, st) {
    const k = st.k || 1, t = st.t;
    const legL = 300 * k, thigh = legL * 0.52, shin = legL * 0.48;
    g.save();
    g.translate(st.x, st.y);
    if (st.pose === 'lie') g.rotate(-Math.PI / 2 * (st.face || 1));
    const f = st.face || 1;

    // ---- legs + hips ----
    let hipY = -legL, feet = [];
    const hipX = 0;
    if (st.pose === 'walk') {
      const ph = (st.walkT / 0.9) * Math.PI * 2;
      const legs = [0, Math.PI].map((o) => {
        const s = Math.sin(ph + o);
        const th = 0.42 * s;
        const swing = Math.cos(ph + o) > 0; // moving forward = swing phase
        const knee = swing ? 0.75 * Math.pow(Math.cos(ph + o), 2) * Math.abs(s) * 1.3 : 0;
        return { th, knee };
      });
      // hips drop so the planted foot stays on the floor
      const fy = legs.map(({ th, knee }) => Math.cos(th) * thigh + Math.cos(th - knee) * shin);
      hipY = -Math.max(...fy);
      feet = legs.map(({ th, knee }) => {
        const Kx = f * Math.sin(th) * thigh, Ky = hipY + Math.cos(th) * thigh;
        return { K: [Kx, Ky], F: [Kx + f * Math.sin(th - knee) * shin, Ky + Math.cos(th - knee) * shin] };
      });
    } else if (st.pose === 'sit') {
      hipY = -shin;
      feet = [-1, 1].map((o) => ({ K: [f * thigh + o * 18 * k, hipY], F: [f * thigh + o * 18 * k, 0] }));
    } else {
      feet = [-1, 1].map((o) => ({ K: [o * 55 * k, -legL * 0.5], F: [o * 60 * k, 0] }));
    }
    feet.forEach(({ K, F }, i) => {
      const hx = hipX + (st.pose === 'stand' ? (i ? 50 : -50) * k : 0);
      tube(g, [hx, hipY], K, 88 * k, ch.bottom);
      tube(g, K, F, 80 * k, ch.bottom);
      blob(g, F[0] + f * 22 * k, F[1] - 14 * k, 58 * k, 30 * k, ch.shoes || '#5a4335');
    });

    // ---- torso ----
    const tw = 330 * k, th = 330 * k;
    const tx = -tw / 2, ty = hipY - th + 30 * k;
    const bob = st.pose === 'walk' ? 0 : Math.sin(t * 2.1 + (ch.seed || 0)) * 4 * k; // breathing
    roundRect(g, tx, ty + bob, tw, th, 110 * k, ch.top);
    if (ch.coat) { // lab coat flaps
      g.fillStyle = shade('#f4f1ea', -0.05);
      g.beginPath(); g.roundRect(tx - 10 * k, ty + bob, tw * 0.36, th * 1.25, 60 * k); g.fill();
      g.beginPath(); g.roundRect(tx + tw * 0.66 + 10 * k, ty + bob, tw * 0.36, th * 1.25, 60 * k); g.fill();
    }
    const shoulders = [[tx + 30 * k, ty + 80 * k + bob], [tx + tw - 30 * k, ty + 80 * k + bob]];

    // ---- arms (code-drawn IK tubes, mitten hands) ----
    let arms = [...(st.arms || [null, null])];
    const side = (a) => (a && a.to ? a.to[0] - st.x : 0);
    if (arms[0] && arms[1]) { if (side(arms[0]) > side(arms[1])) arms = [arms[1], arms[0]]; }
    else if (arms[0] && side(arms[0]) > 0) arms = [null, arms[0]];
    else if (arms[1] && side(arms[1]) < 0) arms = [arms[1], null];
    shoulders.forEach((S, i) => {
      const a = arms[i];
      let tgt;
      if (a && a.to) tgt = [a.to[0] - st.x, a.to[1] - st.y]; // world → local
      else tgt = [S[0] + (i ? 40 : -40) * k, S[1] + 210 * k]; // rest
      if (a && a.scribble) { tgt = [tgt[0] + Math.sin(t * 23) * 8, tgt[1] + Math.cos(t * 31) * 8]; }
      const { E, Hd, ang } = ik(S, tgt, 118 * k * 1.5, 112 * k * 1.5, i ? -1 : 1);
      blob(g, S[0], S[1], 40 * k, 40 * k, ch.top); // shoulder socket
      tube(g, S, E, 36 * k * 1.6, ch.coat ? '#f4f1ea' : ch.top);
      tube(g, E, Hd, 34 * k * 1.6, ch.coat ? '#f4f1ea' : ch.top);
      mitten(g, Hd, ang, a ? a.hand : 'rest', k, ch.skin);
    });
    // ---- head (big) with nod ±0.035 rad ---- (drawn last: never covered by arms)
    const hr = 230 * k;
    const neck = [0, ty + 10 * k + bob];
    const nod = (st.nod ?? 1) * 0.035 * Math.sin(t * 2.4 + (ch.seed || 0) * 3);
    g.save(); g.translate(neck[0], neck[1]); g.rotate(nod + (st.tilt || 0));
    blob(g, 0, -hr * 0.92, hr * 1.08, hr, ch.skin);
    // hair
    g.fillStyle = ch.hair;
    g.beginPath(); g.ellipse(0, -hr * 1.55, hr * 0.98, hr * 0.5, 0, Math.PI, 0); g.fill();
    if (ch.hairStyle === 'tail') { g.beginPath(); g.ellipse(-f * hr * 1.05, -hr * 1.2, hr * 0.22, hr * 0.45, f * 0.4, 0, 7); g.fill(); }
    if (st.helmet) {
      g.save(); g.beginPath(); g.rect(-hr * 1.4, -hr * 2.4, hr * 2.8, hr * 1.25); g.clip();
      blob(g, 0, -hr * 1.05, hr * 1.16, hr * 1.02, C.blueGrey); g.restore();
      g.strokeStyle = '#d9d9de'; g.lineWidth = 16 * k; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-hr * 0.9, -hr * 0.55); g.quadraticCurveTo(0, -hr * 0.15, hr * 0.9, -hr * 0.55); g.stroke();
    }
    // eyes (dots), blink 0.14 s
    const closed = st.eyesClosed || blinking(t, ch.seed || 1);
    const ex = hr * 0.36, ey = -hr * 0.92, look = (st.look || 0) * hr * 0.12 + f * hr * 0.06;
    g.fillStyle = '#1b1b24';
    [-1, 1].forEach((s) => {
      if (closed) { g.fillRect(s * ex + look - 26 * k, ey, 52 * k, 9 * k); }
      else { g.beginPath(); g.ellipse(s * ex + look, ey, 22 * k, 30 * k, 0, 0, 7); g.fill(); }
    });
    if (st.tired) { g.fillStyle = shade(ch.skin, -0.25); [-1, 1].forEach((s) => { g.beginPath(); g.ellipse(s * ex + look, ey + 48 * k, 34 * k, 10 * k, 0, 0, 7); g.fill(); }); }
    if (ch.glasses) {
      g.strokeStyle = '#26262e'; g.lineWidth = 10 * k;
      [-1, 1].forEach((s) => { g.beginPath(); g.arc(s * ex + look, ey, 52 * k, 0, 7); g.stroke(); });
    }
    if (st.wires) {
      g.strokeStyle = C.red; g.lineWidth = 8 * k; g.lineCap = 'round';
      [-0.5, 0, 0.5].forEach((a) => {
        const sx = Math.sin(a) * hr * 0.8, sy = -hr * 1.82 + Math.abs(a) * hr * 0.2;
        g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx - f * hr * 0.8, sy - hr * 0.5, -f * hr * 1.9, -hr * 1.1 + a * 60); g.stroke();
        blob(g, sx, sy, 14 * k, 14 * k, '#c9c0b0');
      });
    }
    if (st.yawn) { g.fillStyle = '#5a2a2a'; g.beginPath(); g.ellipse(look, -hr * 0.45, 46 * k, 60 * k * st.yawn, 0, 0, 7); g.fill(); }
    g.restore();

    g.restore();
  }

  /* ───────────── placeholder plates (until real 4K plates are dropped in) ───────────── */
  function drawPlate(g, p, t) {
    const im = IMG['plate:' + p.id];
    if (im) { g.drawImage(im, 0, 0, PW, PH); }
    else {
      const wall = g.createLinearGradient(0, 0, 0, p.floor);
      wall.addColorStop(0, shade(p.wall, 0.1)); wall.addColorStop(1, shade(p.wall, -0.12));
      g.fillStyle = wall; g.fillRect(-200, -200, PW + 400, p.floor + 200);
      const fl = g.createLinearGradient(0, p.floor, 0, PH);
      fl.addColorStop(0, shade(p.ground, -0.1)); fl.addColorStop(1, shade(p.ground, 0.08));
      g.fillStyle = fl; g.fillRect(-200, p.floor, PW + 400, PH - p.floor + 200);
      (p.props || []).forEach((pr) => roundRect(g, pr[0], pr[1], pr[2], pr[3], pr[5] ?? 40, pr[4]));
      (p.lights || []).forEach((l) => {
        const rg = g.createRadialGradient(l[0], l[1], 0, l[0], l[1], l[2]);
        rg.addColorStop(0, 'rgba(255,236,200,0.55)'); rg.addColorStop(1, 'rgba(255,236,200,0)');
        g.fillStyle = rg; g.fillRect(l[0] - l[2], l[1] - l[2], l[2] * 2, l[2] * 2);
      });
    }
    // Blank signs/boards: placeholder drawing only when no real plate.
    if (!im) Object.values(p.signs || {}).forEach((s) => {
      if (s.pole) roundRect(g, s.r[0] + s.r[2] / 2 - 30, s.r[1] + s.r[3], 60, s.pole, 20, '#7a6a5a');
      const base = { white: '#fbfaf6', chalk: '#3d4a45', screen: '#20262c', cork: '#c79a63', flap: '#22252a' }[s.kind || 'white'];
      roundRect(g, s.r[0] - 24, s.r[1] - 24, s.r[2] + 48, s.r[3] + 48, 30, s.frame || '#8a7660');
      g.fillStyle = base; g.beginPath(); g.roundRect(s.r[0], s.r[1], s.r[2], s.r[3], 14); g.fill();
      if (s.kind === 'cork') { g.fillStyle = '#fbfaf6'; g.fillRect(s.r[0] + s.r[2] * 0.1, s.r[1] + s.r[3] * 0.12, s.r[2] * 0.8, s.r[3] * 0.76); }
    });
  }
  const inkFor = (s) => ({ chalk: C.chalk, screen: '#bfe8ff', flap: '#f6f1e4' }[s.kind] || C.ink);
  const textRect = (s) => s.kind === 'cork'
    ? [s.r[0] + s.r[2] * 0.1, s.r[1] + s.r[3] * 0.12, s.r[2] * 0.8, s.r[3] * 0.76] : s.r;

  /* ───────────── screen-space pieces ───────────── */
  // Date card: white 330x120 top-left, orange calendar.
  function dateCard(g, text, t, t0) {
    if (t < t0) return;
    ev('pop', t0);
    const k = spring(t - t0, 2.2, 0.4);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.translate(48 + 165, 48 + 60); g.scale(k, k); g.translate(-165, -60);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.roundRect(4, 8, 330, 120, 18); g.fill();
    g.fillStyle = C.white; g.beginPath(); g.roundRect(0, 0, 330, 120, 18); g.fill();
    g.fillStyle = C.orange; g.beginPath(); g.roundRect(20, 22, 76, 76, 12); g.fill();
    g.fillStyle = C.white; g.fillRect(28, 46, 60, 44);
    g.fillStyle = C.orange; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g.fillRect(34 + i * 18, 52 + j * 18, 12, 12);
    g.fillStyle = '#c9773d'; g.fillRect(36, 14, 10, 20); g.fillRect(70, 14, 10, 20);
    g.restore();
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    if (k > 0.6) typeText(g, text, [48 + 104, 48 + 18, 214, 84], t0 + 0.15, t, { size: 40 });
    else typeText(g, text, [48 + 104, 48 + 18, 214, 84], t0 + 0.15, -1, { size: 40 });
    g.restore();
  }

  // White splash wipe: 0.2 s in (covers), 0.2 s out (opens), centred on the cut time.
  function splashPath(g, cx, cy, r, seed) {
    g.moveTo(cx + r, cy);
    for (let i = 1; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const n = 1 + 0.16 * Math.sin(a * 5 + seed) + 0.09 * Math.sin(a * 11 + seed * 2) + 0.05 * Math.sin(a * 17 + seed * 3);
      g.lineTo(cx + Math.cos(a) * r * n, cy + Math.sin(a) * r * n);
    }
    g.closePath();
  }
  function wipe(g, t, tc) {
    const d = t - tc;
    if (d < -0.2 || d > 0.2) return;
    if (d < -0.199) ev('whoosh', tc - 0.2);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    const R = 1400, seed = tc * 13;
    g.fillStyle = C.white; g.beginPath();
    if (d < 0) { // in: splash grows from the right side + droplets
      const p = easeOut((d + 0.2) / 0.2);
      splashPath(g, W * 0.62, H * 0.5, R * p, seed);
      for (let i = 0; i < 7; i++) splashPath(g, W * (0.15 + hash(i + seed) * 0.8), H * hash(i * 5 + seed), 90 * p * (0.5 + hash(i)), seed + i);
      g.fill();
    } else { // out: a splash-shaped hole opens
      const p = easeOut(d / 0.2);
      g.rect(0, 0, W, H); splashPath(g, W * 0.4, H * 0.5, R * p * 1.1, seed + 1);
      g.fill('evenodd');
    }
    g.restore();
  }

  // Title cards on flat colour (#e2552f + drifting lighter puffs, or #5b3fa6 + gears).
  function gear(g, x, y, r, teeth, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.18;
      const a2 = a + Math.PI / (teeth * 2);
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); g.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr);
    }
    g.closePath(); g.fill();
    g.fillStyle = C.titlePurple; g.beginPath(); g.arc(0, 0, r * 0.35, 0, 7); g.fill();
    g.restore();
  }
  function titleCard(g, kind, text, t, lt, t0, opts = {}) {
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    const z = 1 + 0.03 * lt; // camera drift 3 %
    g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    if (kind === 'red') {
      g.fillStyle = C.titleRed; g.fillRect(-100, -100, W + 200, H + 200);
      g.fillStyle = shade(C.titleRed, 0.14);
      for (let i = 0; i < 9; i++) {
        const x = ((hash(i) * W + lt * (30 + hash(i * 2) * 50)) % (W + 400)) - 200, y = hash(i * 9) * H;
        [0, 1, 2].forEach((j) => { g.beginPath(); g.arc(x + j * 70, y + (j === 1 ? -30 : 0), 70 + 30 * hash(i + j), 0, 7); g.fill(); });
      }
    } else {
      g.fillStyle = C.titlePurple; g.fillRect(-100, -100, W + 200, H + 200);
      gear(g, 220, 880, 230, 12, lt * 0.25, C.gear);
      gear(g, 560, 1010, 140, 9, -lt * 0.25 * 230 / 140, C.gear);
      gear(g, 1720, 160, 200, 11, lt * 0.2, C.gear);
    }
    typeText(g, text, [160, 360, W - 320, 360], t0, t, { color: C.white, size: opts.size || 94 });
    g.restore();
  }

  /* ───────────── film assembly ───────────── */
  let FILM = null;
  function shotAt(t) {
    const S = FILM.shots;
    for (let i = S.length - 1; i >= 0; i--) if (t >= S[i].t0) return i;
    return 0;
  }
  function drawFrame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const i = shotAt(t), sh = FILM.shots[i];
    const t1 = i + 1 < FILM.shots.length ? FILM.shots[i + 1].t0 : FILM.end;
    const lt = t - sh.t0, p = clamp(lt / Math.max(0.01, t1 - sh.t0));
    if (sh.plate) {
      const plate = FILM.plates[sh.plate];
      applyCamera(g, sh.cam || { x: PW / 2, y: PH / 2, z0: 1.0, z1: 1.03 }, p);
      drawPlate(g, plate, t);
    }
    sh.draw(g, { t, lt, p, t0: sh.t0, t1, plate: sh.plate && FILM.plates[sh.plate] });
    g.setTransform(1, 0, 0, 1, 0, 0);
    FILM.wipes.forEach((tc) => wipe(g, t, tc));
  }

  // Motion blur: n sub-samples across `span` seconds, running average (no 8-bit additive loss).
  function seekBlur(t, n = 6, span = 1 / 120) {
    if (n <= 1) { drawFrame(ctx, t); return; }
    for (let i = 0; i < n; i++) {
      drawFrame(actx, t - span / 2 + (span * i) / (n - 1));
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(acc, 0, 0);
    }
    ctx.globalAlpha = 1;
  }

  async function init() {
    const words = await (await fetch('../timing/words.json')).json();
    WORDS = words.words;
    await document.fonts.load(`800 40px ${FONT}`);
    FILM = window.buildFilm({ T, wordsFrom, C, PW, PH, W, H, PX, clamp, lerp, easeOut, easeInOut, spring, hash,
      typeText, redX, withPop, puff, mark, drawChar, dateCard, titleCard, inkFor, textRect, roundRect, blob, tube, ev, IMG,
      duration: words.duration });
    await Promise.all([
      ...Object.keys(FILM.plates).map((id) => loadImage('plate:' + id, `assets/plates/${id}.png`)),
    ]);
    // Dry pass: every helper registers its events when its shot is drawn once.
    FILM.shots.forEach((s, i) => {
      const t1 = i + 1 < FILM.shots.length ? FILM.shots[i + 1].t0 : FILM.end;
      for (let k = 0; k <= 4; k++) drawFrame(actx, lerp(s.t0, t1 - 0.001, k / 4));
    });
    FILM.wipes.forEach((tc) => ev('whoosh', tc - 0.2));
    window.EV = [...EV.values()].sort((a, b) => a.t - b.t);
    window.END = FILM.end;
    window.SHOTS = FILM.shots.map((s) => ({ id: s.id, t0: s.t0 }));
    window.WIPES = FILM.wipes;
    window.seek = (t) => drawFrame(ctx, t);
    window.seekBlur = seekBlur;
    drawFrame(ctx, 0);
    window.READY = true;
  }
  init().catch((e) => { window.ERROR = String(e && e.stack || e); console.error(e); });
})();

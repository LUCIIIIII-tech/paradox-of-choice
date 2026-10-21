// What If You Could Hear Everyone's Thoughts? A 16:9 long-form "what if" story, 1920x1080. Deterministic in t: window.renderAt(t).
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
// Look and engine from ../puyat and ../huling-tren: every scene is drawn in its true colours, then darkened, and only the lights
// bring the colour back. Thoughts float as glowing bubbles that type themselves out word by word. Smooth camera, no glitches.
const W = 1920, H = 1080, CX = W / 2, CY = H / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'); let g = cv.getContext('2d');
const LANG = new URLSearchParams(location.search).get('lang') || 'tl';     // tl (default) | en
const SUF = LANG === 'tl' ? '' : '.' + LANG;
const TL = await (await fetch(`timeline${SUF}.json`)).json();
const ANCH = LANG === 'tl' ? await (await fetch('anchors.tl.json')).json() : {};     // cue words are written in English; Tagalog maps them
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
window.DUR = TL.dur;
// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const ei = t => Math.pow(clamp(t), 3);
const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const OL = '#07080f', INK = '#f4f1ea', RED = '#ff3150', AMB = '#ffb357', YEL = '#ffc94d', CYAN = '#52d8ff', MAG = '#ff4f9a', MOON = '#a9c2ff', GRN = '#6dffa8', PUR = '#9a7bff';
const C = { amb: '255,170,80', warm: '255,214,160', cyan: '82,216,255', mag: '255,79,154', moon: '140,170,255', red: '255,49,80', grn: '109,255,168', pur: '154,123,255', white: '255,255,255' };
const SKIN = ['#f3d3b6', '#d5a385', '#93634e'], HAIRC = ['#14111c', '#2a2436', '#4c4364'], HOODC = ['#5a86c8', '#34558f', '#1c2d55'], JEANC = ['#43547c', '#2a3452', '#161c30'];
const REDHOOD = ['#d4545e', '#a2343f', '#5e1a24'], GRNHOOD = ['#5fb08a', '#3b7d60', '#1f4836'];
const DIM = { night: '#323a6c', warm: '#5a4566', dawn: '#6a4a72', purple: '#3c2c5c', red: '#5c1c2c', teal: '#2a4a5c', deep: '#262c56' };
const RIMM = 'rgba(150,180,255,.55)';
const wordAt = (id, t) => { const l = LN[id]; if (!l || !l.words) return -1; let k = -1; l.words.forEach((w, i) => { if (t >= w[1] - .02) k = i; }); return k; };
const norm = s => s.toLowerCase().replace(/[^a-z0-9'ñ]/g, '');
const wordT = (id, w) => { w = ANCH[`${id}:${w}`] || w; const l = LN[id]; const x = l && l.words && l.words.find(v => norm(v[0]).startsWith(norm(w))); return x ? x[1] : (l ? l.t0 : 0); };
const span = id => LN[id].t1 - LN[id].t0;
let ZK = 1, BLACK = 0;      // ZK: a smooth push-in on the second half of long lines; BLACK: a blackout over everything but the captions
function reset() { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0; g.shadowColor = 'transparent'; g.filter = 'none'; g.setLineDash([]); }
function cam(cx, cy, z = 1, rot = 0, shake = 0, t = 0) {     // shake is smooth (sines), never random per frame
  reset(); g.translate(CX, CY);
  if (shake) g.translate(Math.sin(t * 43) * shake + Math.sin(t * 27) * shake * .5, Math.cos(t * 37) * shake * .8);
  g.scale(z * ZK, z * ZK); if (rot) g.rotate(rot); g.translate(-cx, -cy);
}
function fill(c) { reset(); g.fillStyle = c; g.fillRect(0, 0, W, H); }
function grad(top, bot, y0 = -700, y1 = 2300) { g.fillStyle = lg(0, y0, 0, y1, [top, bot]); g.fillRect(-900, y0 - 900, W + 1800, y1 - y0 + 1800); }
function lg(x0, y0, x1, y1, cols) { const gr = g.createLinearGradient(x0, y0, x1, y1); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); return gr; }
function rg(x, y, r0, r1, cols, x1 = x, y1 = y) { const gr = g.createRadialGradient(x, y, r0, x1, y1, r1); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); return gr; }
function path(pts) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); }
function line(pts, w = 10, c = INK) { path(pts); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
function curve(p0, c, p1, w, col = INK) { g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(...c, ...p1); g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
function circ(x, y, r, c, stroke = 0) { g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, TAU); if (stroke) { g.strokeStyle = c; g.lineWidth = stroke; g.stroke(); } else { g.fillStyle = c; g.fill(); } }
function ell(x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function fs(fillc, lw = 0, sc = OL) { g.fillStyle = fillc; g.fill(); if (lw) { g.strokeStyle = sc; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); } }
function glow(x, y, r, c, a) { if (a <= 0 || r <= 0) return; g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(x, y, 0, r, [`rgba(${c},${a})`, `rgba(${c},${a * .3})`, `rgba(${c},0)`]); g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); }
function beam(pts, x0, y0, x1, y1, c, a) { g.save(); g.globalCompositeOperation = 'screen'; path(pts); g.closePath(); g.fillStyle = lg(x0, y0, x1, y1, [`rgba(${c},${a})`, `rgba(${c},0)`]); g.fill(); g.restore(); }
function cshadow(x, y, rx, ry, a = .5) { g.save(); g.translate(x, y); g.scale(1, ry / rx); g.fillStyle = rg(0, 0, 0, rx, [`rgba(0,0,0,${a})`, 'rgba(0,0,0,0)']); g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
function motes(x0, y0, x1, y1, n, t, c, a, seed = 0) { g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < n; i++) { const p = (hash(i * 3.1 + seed) + t * .025 * (1 + hash(i + seed))) % 1, x = lerp(x0, x1, hash(i * 7.3 + seed)) + Math.sin(t * .6 + i) * 18, y = lerp(y0, y1, p); circ(x, y, 1.4 + 2.2 * hash(i + 1 + seed), `rgba(${c},${a * Math.sin(Math.PI * p) * (.5 + .5 * Math.sin(t * 1.3 + i))})`); } g.restore(); }
function text(s, x, y, size, c = INK, font = 'Anton', align = 'center', stroke = 0, alpha = 1, sc = OL) {
  g.save(); g.globalAlpha *= alpha; g.font = `${size}px ${font}`; g.textAlign = align; g.textBaseline = 'middle';
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = sc; g.lineJoin = 'round'; g.strokeText(s, x, y); }
  g.fillStyle = c; g.fillText(s, x, y); g.restore();
}
function star(x, y, r, c, n = 5) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fillStyle = c; g.fill(); }
function moon(x, y, r, c = '#fff1c4') { g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); g.beginPath(); g.rect(x - r, y - r, 2 * r, 2 * r); g.arc(x + r * .45, y - r * .3, r * .85, 0, TAU); g.fillStyle = c; g.fill('evenodd'); g.restore(); }
function fullMoon(x, y, r) { glow(x, y, r * 4, C.moon, .35); circ(x, y, r, rg(x - r * .3, y - r * .3, r * .1, r, ['#fbf6e8', '#d9dcef'])); for (const [a, b, c] of [[.3, -.2, .18], [-.35, .1, .14], [.05, .4, .1], [-.1, -.45, .08]]) circ(x + a * r, y + b * r, c * r, 'rgba(150,155,185,.45)'); }

// ---------- lighting: draw lit, darken, let the lights bring the colour back ----------
let LIGHTS = [];
function L(x, y, r, c = null, a = 1, ga = .2) { const m = g.getTransform(), s = Math.hypot(m.a, m.b); LIGHTS.push({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, r: r * s, c, a, ga }); }
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const LIT = mk(W, H), MASK = mk(W, H), lc = LIT.getContext('2d'), mc = MASK.getContext('2d');
function lightPass(dim = DIM.night) {
  lc.globalCompositeOperation = 'copy'; lc.drawImage(cv, 0, 0); lc.globalCompositeOperation = 'source-over';
  reset(); g.globalCompositeOperation = 'multiply'; g.fillStyle = dim; g.fillRect(0, 0, W, H); reset();
  mc.globalCompositeOperation = 'source-over'; mc.clearRect(0, 0, W, H);
  for (const l of LIGHTS) { const gr = mc.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(.4, `rgba(0,0,0,${l.a * .7})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); mc.fillStyle = gr; mc.fillRect(l.x - l.r, l.y - l.r, 2 * l.r, 2 * l.r); }
  mc.globalCompositeOperation = 'source-in'; mc.drawImage(LIT, 0, 0); mc.globalCompositeOperation = 'source-over';
  g.drawImage(MASK, 0, 0);
  for (const l of LIGHTS) if (l.c) { reset(); glow(l.x, l.y, l.r, l.c, l.ga); }
  LIGHTS = [];
}
function keep() { const m = g.getTransform(); return () => g.setTransform(m); }   // remember the camera for the post-light pass

// ---------- textures, painted once ----------
function paint(c, fn) { const old = g; g = c.getContext('2d'); fn(c.width, c.height); g = old; return c; }
const TEX = {};
TEX.floorTop = paint(mk(1600, 2700), (w, h) => {     // walnut planks seen from above
  for (let i = 0, x = 0; x < w; x += 130, i++) {
    g.fillStyle = `hsl(${20 + 7 * hash(i)},${34 + 10 * hash(i + 1)}%,${27 + 7 * hash(i + 2)}%)`; g.fillRect(x, 0, 130, h);
    for (let k = 0; k < 17; k++) { const ph = hash(i * 17 + k) * 6, xx = x + 5 + k * 7.3; g.beginPath(); for (let y = 0; y <= h; y += 30) g.lineTo(xx + Math.sin(y * .004 + ph) * 5 + Math.sin(y * .015 + ph * 2) * 1.8, y); g.strokeStyle = `rgba(${hash(k + i) > .5 ? '255,220,180' : '25,10,5'},${.05 + .07 * hash(k * 3 + i)})`; g.lineWidth = 1 + 2.2 * hash(k + i * 5); g.stroke(); }
    for (let k = 0; k < 2; k++) { const kx = x + 30 + hash(i * 3 + k) * 70, ky = hash(i * 7 + k) * h; for (let r = 3; r < 24; r += 4) { ell(kx, ky, r * .7, r * 1.7); g.strokeStyle = 'rgba(25,10,5,.2)'; g.lineWidth = 1.6; g.stroke(); } }
    for (let y = hash(i) * 700; y < h; y += 700 + 500 * hash(i + y)) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y, 130, 3); g.fillStyle = 'rgba(255,220,180,.07)'; g.fillRect(x, y + 3, 130, 2); }
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(255,220,180,.07)'; g.fillRect(x + 3, 0, 2, h);
  }
});
TEX.wall = paint(mk(1800, 1800), (w, h) => {         // damask wallpaper with faint stripes and a fine paper grain
  g.fillStyle = '#3a4266'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 90) { g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(x, 0, 30, h); g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(x + 30, 0, 4, h); }
  for (let y = 40, r = 0; y < h; y += 150, r++) for (let x = (r % 2) * 75 + 20; x < w; x += 150) {
    g.save(); g.translate(x, y); g.strokeStyle = 'rgba(220,225,255,.09)'; g.lineWidth = 3;
    for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(0, -42); g.bezierCurveTo(sg * 44, -30, sg * 32, 14, 0, 42); g.stroke(); g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(sg * 22, 0, 0, 16); g.stroke(); g.beginPath(); g.moveTo(sg * 10, 30); g.quadraticCurveTo(sg * 40, 40, sg * 30, 60); g.stroke(); }
    circ(0, -50, 4, 'rgba(220,225,255,.1)'); g.restore();
  }
  for (let i = 0; i < 60000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,255' : '0,0,0'},.035)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.7) * h, 2, 2); }
});
TEX.floorFront = paint(mk(1900, 1000), (w, h) => {   // boards running toward a vanishing point, with grain
  g.fillStyle = lg(0, 0, 0, h, ['#3b2a21', '#4a3428']); g.fillRect(0, 0, w, h);
  const vx = w / 2, vy = -1600;
  for (let k = -16; k <= 16; k++) { const xb = vx + k * 150; for (let j = 0; j < 6; j++) { g.beginPath(); g.moveTo(lerp(vx, xb + j * 22, (0 - vy) / (h - vy)), 0); g.lineTo(xb + j * 22 + Math.sin(k + j) * 6, h); g.strokeStyle = `rgba(${(j + k) % 2 ? '255,220,180' : '20,8,4'},.06)`; g.lineWidth = 1 + 2 * hash(k * 7 + j); g.stroke(); } g.beginPath(); g.moveTo(lerp(vx, xb, (0 - vy) / (h - vy)), 0); g.lineTo(xb, h); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3; g.stroke(); }
  for (let r = 0, y = 30; y < h; r++, y += 40 + r * 18) for (let k = -16; k <= 16; k++) if (hash(r * 31 + k) > .6) { const u = (y - vy) / (h - vy), x0 = vx + (k * 150 - (w / 2 - vx)) * u, x1 = x0 + 150 * u; g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x0, y, x1 - x0, 2 + u * 2); }
  for (let i = 0; i < 30000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,230,200' : '0,0,0'},.04)`; g.fillRect(hash(i * 1.7) * w, hash(i * 3.1) * h, 2, 2); }
});
TEX.rugTop = paint(mk(1000, 560), (w, h) => {        // an oval rug with a border pattern and fringe
  const cx = w / 2, cy = h / 2;
  for (const sg of [-1, 1]) for (let k = 0; k < 40; k++) { const a = (k / 40 - .5) * 1.2, x = cx + sg * 470 * Math.cos(a), y = cy + 240 * Math.sin(a); line([[x, y], [x + sg * 22, y + Math.sin(k) * 3]], 3, '#cbb894'); }
  ell(cx, cy, 470, 240); g.fillStyle = '#6a2a3c'; g.fill();
  const cols = ['#c49a45', '#273556', '#e2d3b0', '#6a2a3c', '#c49a45', '#3a4d7a'];
  cols.forEach((c, k) => { ell(cx, cy, 455 - k * 52, 228 - k * 26); g.strokeStyle = c; g.lineWidth = k % 2 ? 10 : 16; g.stroke(); });
  for (let k = 0; k < 36; k++) { const a = k / 36 * TAU; g.save(); g.translate(cx + Math.cos(a) * 395, cy + Math.sin(a) * 198); g.rotate(a); path([[0, -12], [9, 0], [0, 12], [-9, 0]]); g.closePath(); g.fillStyle = '#e2d3b0'; g.fill(); g.restore(); }
  ell(cx, cy, 160, 72); g.fillStyle = '#273556'; g.fill(); ell(cx, cy, 100, 40); g.strokeStyle = '#c49a45'; g.lineWidth = 8; g.stroke();
  g.save(); ell(cx, cy, 470, 240); g.clip(); for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,240,220' : '0,0,0'},.07)`; g.fillRect(hash(i * 1.9) * w, hash(i * 4.3) * h, 2, 2); } g.restore();
});
TEX.city = paint(mk(2400, 900), (w, h) => {           // a far skyline with a few lit windows
  let x = 0, i = 0;
  while (x < w) { const bw = 80 + 150 * hash(i * 1.7), bh = 220 + 600 * hash(i * 3.3), top = h - bh;
    g.fillStyle = `rgb(${16 + 10 * hash(i)},${19 + 10 * hash(i)},${38 + 16 * hash(i)})`; g.fillRect(x, top, bw, bh); g.fillStyle = 'rgba(160,180,255,.08)'; g.fillRect(x, top, 3, bh);
    if (hash(i * 5) > .6) { const ah = 40 + 60 * hash(i); line([[x + bw / 2, top], [x + bw / 2, top - ah]], 3, '#151a30'); circ(x + bw / 2, top - ah, 4, 'rgba(255,70,70,.9)'); }
    for (let wy = top + 14; wy < h - 10; wy += 22) for (let wx = x + 8; wx < x + bw - 12; wx += 16) { const r = hash(wx * 1.31 + wy * 7.13); if (r > .8) { g.fillStyle = r > .95 ? 'rgba(130,220,255,.75)' : `rgba(255,${185 + 45 * hash(wx)},${105 + 50 * hash(wy)},${.55 + .4 * hash(wx + wy)})`; g.fillRect(wx, wy, 8, 11); } }
    x += bw + 3; i++; }
});
TEX.brick = paint(mk(900, 1300), (w, h) => {          // old brick for the street
  g.fillStyle = '#3a2228'; g.fillRect(0, 0, w, h);
  for (let r = 0, y = 0; y < h; y += 34, r++) for (let x = (r % 2) * -45; x < w; x += 90) { const v = hash(x * 3.1 + y * 1.7); g.fillStyle = `rgb(${92 + 40 * v},${46 + 18 * v},${44 + 14 * v})`; g.fillRect(x + 3, y + 3, 84, 28); g.fillStyle = 'rgba(255,220,200,.08)'; g.fillRect(x + 3, y + 3, 84, 4); }
  for (let i = 0; i < 30000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,230,220' : '0,0,0'},.06)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2, 2); }
});
TEX.paper = paint(mk(960, 540), (w, h) => { const id = g.createImageData(w, h); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (hash(i * .0731) - .5) * 70; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); });

// ---------- more palette ----------
const ZSKIN = ['#bcc6a8', '#8c9a7e', '#4c5846'], SHIRT = ['#ecebe4', '#b9b7ae', '#6e6c66'], SUIT = ['#4a4a58', '#2c2c36', '#15151b'], COAT = ['#9a6a86', '#6a4260', '#3a2236'];
C.fluo = '205,245,228'; C.blue = '70,120,255'; C.fire = '255,130,40';
TEX.tiles = paint(mk(1200, 900), (w, h) => {          // white metro tiles, grimy
  g.fillStyle = '#5a5e62'; g.fillRect(0, 0, w, h);
  for (let y = 0, r = 0; y < h; y += 46, r++) for (let x = (r % 2) * -40; x < w; x += 80) { const v = hash(x * 1.7 + y * 3.1); rr(x + 3, y + 3, 74, 40, 4); g.fillStyle = `rgb(${205 + 30 * v},${210 + 28 * v},${206 + 26 * v})`; g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 6, y + 6, 66, 5); }
  for (let i = 0; i < 40; i++) { const x = hash(i * 3.3) * w, y = hash(i * 5.1) * h; g.fillStyle = rg(x, y, 0, 60 + 80 * hash(i), ['rgba(60,50,30,.25)', 'rgba(60,50,30,0)']); g.fillRect(x - 140, y - 140, 280, 280); }
  for (let i = 0; i < 30000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,255' : '0,0,0'},.05)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2, 2); }
});
TEX.lino = paint(mk(1900, 800), (w, h) => {           // speckled train / store floor
  g.fillStyle = lg(0, 0, 0, h, ['#5c6266', '#6e7478']); g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70000; i++) { const v = hash(i); g.fillStyle = v > .66 ? 'rgba(230,235,240,.35)' : v > .33 ? 'rgba(20,24,30,.35)' : 'rgba(120,140,150,.3)'; g.fillRect(hash(i * 1.7) * w, hash(i * 3.3) * h, 2 + 2 * hash(i * 9), 2); }
});

// ---------- characters ----------
function shape(P, x0, x1, cols, o = {}) {
  const { lx = -1, rim = null, rw = 6, ol = 4 } = o;
  P(); g.fillStyle = lg(lx < 0 ? x0 : x1, 0, lx < 0 ? x1 : x0, 0, cols); g.fill();
  if (rim) { g.save(); P(); g.clip(); g.translate(lx * rw, 0); P(); g.lineWidth = rw * 2; g.strokeStyle = rim; g.stroke(); g.restore(); }
  if (ol) { P(); g.lineWidth = ol; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke(); }
}
function limb(pts, w, cols, lx = -1) { line(pts, w + w * .26 + 4, OL); line(pts, w, cols[1]); g.save(); g.translate(lx * w * .2, -w * .04); line(pts, w * .34, cols[0]); g.restore(); g.save(); g.translate(-lx * w * .3, 0); line(pts, w * .2, cols[2]); g.restore(); }
function hand(x, y, r, ang, o = {}) {
  const { sg = 1, grip = 0, skin = SKIN, twitch = 0 } = o;
  g.save(); g.translate(x, y); g.rotate(ang);
  for (let i = 0; i < 4; i++) { const fy = (i - 1.5) * r * .38, Lf = r * (1.05 - Math.abs(i - 1.3) * .17) * (1 - grip * .5) * (1 + twitch * .25 * Math.sin(i * 2.1 + 1)); g.save(); g.translate(r * .3, fy); g.rotate(twitch * .35 * Math.sin(i * 1.7)); rr(0, -r * .17, Lf, r * .34, r * .17); fs(skin[1], r * .1); g.restore(); }
  ell(0, 0, r * .72, r * .8); fs(lg(-r, -r, r, r, [skin[0], skin[2]]), r * .1);
  g.save(); g.rotate(-sg * .95); rr(r * .15, -r * .16, r * .72, r * .32, r * .16); fs(skin[1], r * .1); g.restore();
  g.restore();
}
function shoe(x, y, s, col = ['#525873', '#23263a']) {
  g.save(); g.translate(x, y);
  rr(-s, -s * .3, s * 2, s * .34, s * .16); fs('#c9c2b6', s * .12);
  g.beginPath(); g.moveTo(-s * .92, -s * .26); g.quadraticCurveTo(-s * .85, -s * .95, 0, -s * .98); g.quadraticCurveTo(s * .85, -s * .95, s * .92, -s * .26); g.closePath(); fs(lg(0, -s, 0, 0, col), s * .12);
  for (let k = 0; k < 3; k++) line([[-s * .28, -s * (.76 - k * .16)], [s * .28, -s * (.76 - k * .16)]], s * .07, 'rgba(230,230,240,.6)');
  g.restore();
}
// a detailed eye. eyes: open | wide | shut | dead (milky, veined, no life)
function eye(ex, ey, er, sg, o) {
  const { eyes = 'open', look = 0, lookY = 0, tired = 0, lid = null, iris = '#6a4a33', skin = SKIN } = o, dead = eyes === 'dead';
  g.fillStyle = rg(ex, ey, er * .4, er * 1.9, [`rgba(70,30,55,${.12 + .35 * tired + (dead ? .35 : 0)})`, 'rgba(70,30,55,0)']); g.fillRect(ex - er * 2, ey - er * 2, er * 4, er * 4);
  if (tired > .05) for (let k = 0; k < (tired > .5 ? 2 : 1); k++) {
    const yy = ey + er * (.95 + k * .4), dep = er * (.32 + .32 * tired);
    g.save(); g.globalAlpha = clamp(tired * 1.4) * (k ? .55 : .9); g.beginPath(); g.moveTo(ex - er, yy); g.quadraticCurveTo(ex, yy + dep * 1.6, ex + er, yy); g.quadraticCurveTo(ex, yy + dep * .5, ex - er, yy); g.fillStyle = dead ? '#3a3448' : '#5b3a6e'; g.fill(); g.restore();
    curve([ex - er * .85, yy + er * .06], [ex, yy + dep * 1.45], [ex + er * .85, yy + er * .06], er * .07, `rgba(55,20,55,${.65 * tired})`);
  }
  if (eyes === 'shut') {
    g.beginPath(); g.moveTo(ex - er * 1.05, ey); g.quadraticCurveTo(ex, ey + er * .75, ex + er * 1.05, ey); g.lineWidth = er * .15; g.strokeStyle = OL; g.lineCap = 'round'; g.stroke();
    for (let k = 0; k < 4; k++) { const u = .2 + k * .2, px = ex - er * 1.05 + 2.1 * er * u, py = ey + er * .75 * 2 * u * (1 - u); line([[px, py], [px + sg * er * .06, py + er * .24]], er * .06, OL); }
    return;
  }
  const Hh = er * (eyes === 'wide' || dead ? 1.0 : .76);
  const A = () => { g.beginPath(); g.moveTo(ex - er * 1.05, ey + er * .05); g.bezierCurveTo(ex - er * .6, ey - Hh * 1.25, ex + er * .6, ey - Hh * 1.25, ex + er * 1.05, ey - er * .02); g.bezierCurveTo(ex + er * .6, ey + Hh * 1.0, ex - er * .6, ey + Hh * 1.0, ex - er * 1.05, ey + er * .05); g.closePath(); };
  A(); g.fillStyle = rg(ex, ey, er * .15, er * 1.2, dead ? ['#efe9d2', '#a8987c'] : ['#f7f2eb', '#cdbfb6']); g.fill();
  g.save(); A(); g.clip();
  if (tired > .45 || dead) { g.strokeStyle = `rgba(190,30,50,${dead ? .75 : (tired - .45) * 1.3})`; g.lineWidth = er * (dead ? .035 : .025); for (let i = 0; i < (dead ? 14 : 8); i++) { const sd = i % 2 ? -1 : 1, yy = ey + (hash(i * 3 + sg) - .5) * er * .9; g.beginPath(); g.moveTo(ex + sd * er, yy); g.quadraticCurveTo(ex + sd * er * .6, yy + (hash(i) - .5) * er * .4, ex + sd * er * .3, yy + (hash(i + 2) - .5) * er * .6); g.stroke(); } }
  const ir = er * (eyes === 'wide' ? .47 : dead ? .5 : .54), ix = ex + look * er * .42, iy = ey + lookY * er * .3 + er * .03;
  circ(ix, iy, ir, rg(ix, iy, ir * .12, ir, dead ? ['#ffffff', '#d4dde2', '#93a0aa'] : ['#c79058', iris, '#1e130c']));
  if (!dead) for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; line([[ix + Math.cos(a) * ir * .38, iy + Math.sin(a) * ir * .38], [ix + Math.cos(a) * ir * .86, iy + Math.sin(a) * ir * .86]], er * .022, 'rgba(255,220,170,.22)'); }
  circ(ix, iy, ir, dead ? 'rgba(120,130,140,.5)' : 'rgba(20,10,5,.7)', er * .05);
  circ(ix, iy, ir * (dead ? .14 : eyes === 'wide' ? .3 : .44), dead ? '#7a848e' : '#050305');
  if (dead) circ(ix - ir * .3, iy - ir * .3, ir * .1, 'rgba(255,255,255,.5)'); else { circ(ix - ir * .36, iy - ir * .38, ir * .22, 'rgba(255,255,255,.95)'); circ(ix + ir * .32, iy + ir * .3, ir * .09, 'rgba(255,255,255,.7)'); }
  g.fillStyle = lg(0, ey - Hh, 0, ey - Hh * .15, ['rgba(40,18,30,.55)', 'rgba(40,18,30,0)']); g.fillRect(ex - er * 1.2, ey - Hh * 1.3, er * 2.4, Hh * 1.2);
  const dr = eyes === 'wide' || dead ? 0 : clamp(lid ?? tired * .55);
  if (dr > 0) { const ly = ey - Hh * 1.0 + Hh * 1.9 * dr; g.beginPath(); g.moveTo(ex - er * 1.3, ey - Hh * 1.5); g.lineTo(ex + er * 1.3, ey - Hh * 1.5); g.lineTo(ex + er * 1.3, ly); g.quadraticCurveTo(ex, ly + Hh * .28, ex - er * 1.3, ly); g.closePath(); g.fillStyle = lg(0, ey - Hh, 0, ly, [skin[1], skin[2]]); g.fill(); g.beginPath(); g.moveTo(ex - er * 1.3, ly); g.quadraticCurveTo(ex, ly + Hh * .28, ex + er * 1.3, ly); g.strokeStyle = OL; g.lineWidth = er * .13; g.stroke(); }
  g.restore();
  g.beginPath(); g.moveTo(ex - er * 1.05, ey + er * .05); g.bezierCurveTo(ex - er * .6, ey - Hh * 1.25, ex + er * .6, ey - Hh * 1.25, ex + er * 1.05, ey - er * .02); g.strokeStyle = OL; g.lineWidth = er * .15; g.lineCap = 'round'; g.stroke();
  for (let k = 0; k < 3; k++) { const ox = ex + sg * er * (1.0 - k * .16), oy = ey - er * (.05 + k * .22); line([[ox, oy], [ox + sg * er * .22, oy - er * .14]], er * .06, OL); }
  g.beginPath(); g.moveTo(ex - er, ey + er * .08); g.bezierCurveTo(ex - er * .6, ey + Hh * .98, ex + er * .6, ey + Hh * .98, ex + er, ey); g.strokeStyle = dead ? 'rgba(150,30,40,.8)' : 'rgba(60,20,30,.75)'; g.lineWidth = er * (dead ? .09 : .06); g.stroke();
  curve([ex - er * .8, ey - Hh * 1.15], [ex, ey - Hh * 1.6], [ex + er * .9, ey - Hh * 1.05], er * .05, 'rgba(110,55,55,.55)');
}
// the face: egg-shaped head, light from lx, a coloured rim on the far side, ears, nose, mouth, tousled hair; zombie = grey veins and blood
function face(x, y, r, o = {}) {
  const { t = 0, tired = 0, eyes = 'open', mouth = 0, smile = 0, sweat = 0, lx = -1, rim = null, ears = 1, hair = HAIRC, skin = SKIN, zombie = 0 } = o;
  const P = () => { g.beginPath(); g.moveTo(x, y - r); g.bezierCurveTo(x + r * .6, y - r, x + r, y - r * .6, x + r, y - r * .05); g.bezierCurveTo(x + r, y + r * .55, x + r * .55, y + r * .98, x, y + r * .98); g.bezierCurveTo(x - r * .55, y + r * .98, x - r, y + r * .55, x - r, y - r * .05); g.bezierCurveTo(x - r, y - r * .6, x - r * .6, y - r, x, y - r); g.closePath(); };
  if (ears) for (const sg of [-1, 1]) { const ex = x + sg * r * .95, ey = y + r * .12; ell(ex, ey, r * .17, r * .25, sg * .15); fs(sg === lx ? skin[1] : skin[2], r * .05); curve([ex - sg * r * .02, ey - r * .14], [ex + sg * r * .1, ey], [ex - sg * r * .01, ey + r * .14], r * .035, 'rgba(90,40,40,.6)'); }
  P(); g.fillStyle = rg(x + lx * r * .4, y - r * .4, r * .1, r * 1.3, [skin[0], skin[1], skin[2]]); g.fill();
  g.save(); P(); g.clip();
  g.beginPath(); g.rect(x - 2 * r, y - 2 * r, 4 * r, 4 * r); g.arc(x + lx * r * .25, y - r * .15, r * 1.0, 0, TAU); g.fillStyle = 'rgba(70,25,45,.3)'; g.fill('evenodd');
  g.fillStyle = lg(0, y + r * .7, 0, y + r, ['rgba(70,25,45,0)', 'rgba(70,25,45,.25)']); g.fillRect(x - r, y + r * .7, 2 * r, r * .3);
  if (zombie) {
    for (const sg of [-1, 1]) { g.fillStyle = rg(x + sg * r * .5, y + r * .42, 0, r * .3, ['rgba(40,30,40,.45)', 'rgba(40,30,40,0)']); g.fillRect(x + sg * r * .5 - r * .35, y + r * .1, r * .7, r * .7); }
    for (let i = 0; i < 8; i++) { const sg = i % 2 ? 1 : -1; let px = x + sg * r * (.95 - .1 * hash(i)), py = y - r * (.3 - .25 * hash(i * 3)); const pts = [[px, py]]; for (let k = 0; k < 5; k++) { px -= sg * r * (.07 + .04 * hash(i + k)); py += (hash(i * 7 + k) - .5) * r * .14; pts.push([px, py]); } line(pts, r * .022, 'rgba(60,20,60,.5)'); }
    for (let i = 0; i < 9; i++) { ell(x + (hash(i * 4.4) - .5) * r * 1.4, y + (hash(i * 2.2) - .5) * r * 1.2, r * (.05 + .07 * hash(i)), r * (.04 + .05 * hash(i + 1)), i); g.fillStyle = 'rgba(70,60,40,.22)'; g.fill(); }
  }
  if (rim) { g.globalAlpha = .8; g.translate(lx * r * .045, 0); P(); g.lineWidth = r * .08; g.strokeStyle = rim; g.stroke(); }
  g.restore();
  P(); g.strokeStyle = OL; g.lineWidth = r * .055; g.stroke();
  if (!zombie) for (const sg of [-1, 1]) { const bx = x + sg * r * .55, by = y + r * .38; g.fillStyle = rg(bx, by, 0, r * .26, ['rgba(230,90,100,.26)', 'rgba(230,90,100,0)']); g.fillRect(bx - r * .3, by - r * .3, r * .6, r * .6); }
  curve([x - lx * r * .02, y + r * .14], [x - lx * r * .14, y + r * .34], [x + lx * r * .07, y + r * .37], r * .045, 'rgba(110,55,50,.85)');
  circ(x + lx * r * .04, y + r * .26, r * .035, 'rgba(255,240,225,.45)');
  for (const sg of [-1, 1]) {
    const ex = x + sg * r * .37, ey = y + r * .03, er = r * .21;
    eye(ex, ey, er, sg, o);
    const wor = eyes === 'wide' || tired > .65 ? 1 : 0, by = ey - er * (eyes === 'wide' || eyes === 'dead' ? 1.95 : 1.7), ix = ex - sg * er * .95, ox = ex + sg * er * 1.1;
    g.beginPath(); g.moveTo(ix, by + (wor ? -er * .35 : eyes === 'dead' ? er * .25 : er * .1)); g.quadraticCurveTo(ex, by - er * .35, ox, by + er * (.2 + .15 * wor)); g.strokeStyle = hair[0]; g.lineWidth = r * .085; g.lineCap = 'round'; g.stroke();
  }
  const my = y + r * .6;
  if (mouth > .05) {
    const mw = r * (.15 + .07 * mouth), mh = r * (.06 + .26 * mouth), mc_ = my + mh * .3;
    ell(x, mc_, mw, mh); g.fillStyle = '#2a0812'; g.fill();
    g.save(); ell(x, mc_, mw, mh); g.clip();
    if (zombie) { g.fillStyle = '#d8ccb0'; for (let k = 0; k < 7; k++) { const tx = x - mw + (k + .5) * mw * 2 / 7; path([[tx - mw * .13, mc_ - mh], [tx + mw * .13, mc_ - mh], [tx + (hash(k) - .5) * mw * .1, mc_ - mh * (.45 + .2 * hash(k + 3))]]); g.closePath(); g.fill(); path([[tx - mw * .12, mc_ + mh], [tx + mw * .12, mc_ + mh], [tx, mc_ + mh * (.5 + .2 * hash(k + 7))]]); g.closePath(); g.fill(); } }
    else { g.fillStyle = '#efe6da'; g.fillRect(x - mw, mc_ - mh, mw * 2, mh * .34); ell(x, mc_ + mh * .85, mw * .7, mh * .45); g.fillStyle = '#b8455a'; g.fill(); }
    g.restore();
    ell(x, mc_, mw, mh); g.strokeStyle = zombie ? '#3a1018' : OL; g.lineWidth = r * .05; g.stroke();
  } else if (smile) { curve([x - r * .2, my - r * .05], [x, my + r * .14], [x + r * .2, my - r * .05], r * .055, '#4a1a22'); curve([x - r * .08, my + r * .13], [x, my + r * .17], [x + r * .08, my + r * .13], r * .03, 'rgba(150,60,60,.5)'); }
  else { const dn = tired * r * .05; g.beginPath(); g.moveTo(x - r * .17, my + dn); g.quadraticCurveTo(x, my - r * .04, x + r * .17, my + dn); g.strokeStyle = zombie ? '#2a1418' : '#4a1a22'; g.lineWidth = r * .05; g.lineCap = 'round'; g.stroke(); curve([x - r * .08, my + r * .08], [x, my + r * .12], [x + r * .08, my + r * .08], r * .03, 'rgba(120,50,50,.45)'); }
  if (zombie) { g.beginPath(); g.moveTo(x + r * .15, my + r * .02); g.quadraticCurveTo(x + r * .2, my + r * .2, x + r * .17, my + r * .34); g.quadraticCurveTo(x + r * .13, my + r * .2, x + r * .1, my + r * .04); g.closePath(); g.fillStyle = '#5a0a14'; g.fill(); }
  // hair: tousled clumps over the crown, a side-swept fringe, irregular strands, a soft lit edge
  const HP = () => {
    g.beginPath(); g.moveTo(x - r * 1.04, y - r * .02);
    const NB = 9; for (let i = 1; i <= NB; i++) { const a0 = Math.PI * (1 + (i - .5) / NB), a1 = Math.PI * (1 + i / NB), bump = 1.3 + .12 * hash(i * 3.7);
      g.quadraticCurveTo(x + Math.cos(a0) * r * (1.18 + .08 * hash(i)), y - r * .06 + Math.sin(a0) * r * bump, x + Math.cos(a1) * r * 1.05, y - r * .06 + Math.sin(a1) * r * 1.2); }
    g.quadraticCurveTo(x + r * 1.0, y - r * .38, x + r * .82, y - r * .5);
    const F = 7, st = 1.68 / F; for (let i = 0; i < F; i++) { const u0 = .82 - i * st, u2 = u0 - st; g.quadraticCurveTo(x + r * (u0 - .02), y - r * .47, x + r * (u0 - .13 - .05 * hash(i)), y - r * (.37 + .09 * hash(i * 2.3))); g.quadraticCurveTo(x + r * (u2 + .03), y - r * .5, x + r * u2, y - r * .57); }
    g.quadraticCurveTo(x - r * .98, y - r * .42, x - r * 1.04, y - r * .02); g.closePath(); };
  HP(); g.fillStyle = rg(x + lx * r * .35, y - r * .95, r * .1, r * 1.4, [hair[1], hair[0], '#08070c']); g.fill();
  g.save(); HP(); g.clip();
  for (let i = 0; i < 22; i++) { const a = Math.PI * (1.02 + .96 * hash(i * 5.3)), ln = .55 + .35 * hash(i * 2.1), ox = x + r * .08 * Math.cos(i), oy = y - r * 1.05; curve([ox, oy], [ox + Math.cos(a) * r * ln * .55 + r * .1, oy + Math.sin(a) * r * ln * .3 + r * .35], [x + Math.cos(a) * r * (.95 + .1 * hash(i)), y - r * .1 + Math.sin(a) * r * .55], r * (.02 + .02 * hash(i)), `rgba(0,0,5,${.35 + .3 * hash(i + 9)})`); }
  for (let i = 0; i < 9; i++) { const a = Math.PI * (lx < 0 ? 1.12 + .3 * hash(i) : 1.58 + .3 * hash(i)), ox = x + Math.cos(a) * r * .55, oy = y - r * .62 + Math.sin(a) * r * .5; curve([ox, oy], [ox + Math.cos(a) * r * .2, oy + Math.sin(a) * r * .18], [ox + Math.cos(a + .3) * r * .34, oy + Math.sin(a + .3) * r * .3], r * .022, `rgba(150,145,190,${.25 + .2 * hash(i)})`); }
  if (rim) { g.globalAlpha = .45; g.translate(lx * r * .05, 0); HP(); g.lineWidth = r * .07; g.strokeStyle = rim; g.stroke(); }
  g.restore();
  HP(); g.strokeStyle = OL; g.lineWidth = r * .05; g.lineJoin = 'round'; g.stroke();
  if (tired > .55) for (let k = 0; k < 4; k++) { const a = -2.5 + k * .45; curve([x + Math.cos(a) * r * 1.05, y - r * .1 + Math.sin(a) * r * 1.15], [x + Math.cos(a) * r * 1.32, y - r * .1 + Math.sin(a) * r * 1.38 + Math.sin(t * 2 + k) * 3], [x + Math.cos(a + .22) * r * 1.4, y - r * .1 + Math.sin(a + .22) * r * 1.42], r * .03, hair[0]); }
  if (sweat > 0) for (let i = 0; i < 2; i++) {
    const p = ((t * .4 + i * .5) % 1), sx = x + (i ? .8 : -.76) * r, sy = y - r * .4 + p * r * .7;
    g.save(); g.globalAlpha = sweat * (1 - p); g.beginPath(); g.moveTo(sx, sy - r * .13); g.quadraticCurveTo(sx + r * .08, sy, sx, sy + r * .05); g.quadraticCurveTo(sx - r * .08, sy, sx, sy - r * .13); fs('#a9d8ff', r * .025); circ(sx - r * .02, sy - r * .02, r * .015, '#fff'); g.restore();
  }
}
// a person, front view. (x, y) = feet. outfit hoodie | shirt (white shirt + tie). arms: down | out | phone | reach | rub | up.
// sit 0..1, walk = phase or null, slump 0..1 (head bowed), bandage = a bloody bandage on the right hand, longHair, twitch (fingers)
function person(x, y, h, o = {}) {
  const { t = 0, walk = null, arms = 'down', sit = 0, sway = 0, hood = HOODC, lx = -1, rim = null, ground = 1, skin = SKIN, outfit = 'hoodie', slump = 0, bandage = 0, longHair = 0, legs = JEANC, twitch = 0, zombie = 0 } = o;
  const lw = h * .052, sw = walk === null ? 0 : Math.sin(walk), bob = walk === null ? 0 : Math.abs(Math.cos(walk)) * h * .012, br = zombie ? 0 : Math.sin(t * 2.1) * h * .004;
  const hip = [x, y - h * .42 + sit * h * .16 - bob], neck = [x + sway * h * .04, y - h * .71 - bob + sit * h * .1 - br], hc = [x + sway * h * .09, y - h * .855 - bob + sit * h * .1 - br + slump * h * .05];
  if (ground) cshadow(x, y, h * .2, h * .028, .6);
  for (const sg of [-1, 1]) {
    let k, f;
    if (sit) { k = [x + sg * h * .1, hip[1] + h * .06]; f = [x + sg * h * .12, hip[1] + h * .3]; }
    else { f = [x + sg * h * .07 + sg * sw * h * .1, y - Math.max(0, -sg * sw) * h * .03]; k = [(hip[0] + f[0]) / 2 + sg * h * .015, (hip[1] + f[1]) / 2]; }
    limb([[hip[0] + sg * h * .055, hip[1]], k, f], lw * 1.2, legs, lx);
    line([[k[0] - h * .02, k[1]], [k[0] + h * .02, k[1] + h * .01]], h * .004, 'rgba(0,0,10,.35)');
    shoe(f[0] + sg * h * .012, f[1], h * .05, outfit === 'shirt' ? ['#3a2a22', '#140c08'] : undefined);
  }
  if (outfit === 'hoodie') { ell(neck[0], neck[1] + h * .012, h * .105, h * .05); fs(hood[2], h * .007); }
  rr(neck[0] - h * .032, neck[1] - h * .05, h * .064, h * .08, h * .02); g.fillStyle = skin[2]; g.fill();
  const P = () => { g.beginPath(); g.moveTo(neck[0] - h * .125, neck[1] + h * .03); g.quadraticCurveTo(neck[0], neck[1] - h * .025, neck[0] + h * .125, neck[1] + h * .03); g.quadraticCurveTo(neck[0] + h * .15, neck[1] + h * .06, hip[0] + h * .13, hip[1] + h * .02); g.lineTo(hip[0] + h * .125, hip[1] + h * .05); g.quadraticCurveTo(hip[0], hip[1] + h * .075, hip[0] - h * .125, hip[1] + h * .05); g.lineTo(hip[0] - h * .13, hip[1] + h * .02); g.quadraticCurveTo(neck[0] - h * .15, neck[1] + h * .06, neck[0] - h * .125, neck[1] + h * .03); g.closePath(); };
  shape(P, x - h * .15, x + h * .15, hood, { lx, rim, rw: h * .011, ol: h * .008 });
  g.save(); P(); g.clip();
  for (const sg of [-1, 1]) curve([neck[0] + sg * h * .1, neck[1] + h * .08], [neck[0] + sg * h * .05, neck[1] + h * .16], [neck[0] + sg * h * .085, neck[1] + h * .24], h * .006, 'rgba(0,0,10,.35)');
  curve([x - h * .06, hip[1] - h * .02], [x, hip[1] - h * .035], [x + h * .07, hip[1] - h * .015], h * .005, 'rgba(0,0,10,.3)');
  if (outfit === 'hoodie') {
    g.fillStyle = 'rgba(0,0,10,.22)'; g.fillRect(x - h * .2, hip[1] + h * .015, h * .4, h * .07);
    for (let k = -10; k <= 10; k++) line([[x + k * h * .012, hip[1] + h * .02], [x + k * h * .012, hip[1] + h * .07]], h * .002, 'rgba(0,0,10,.25)');
    g.beginPath(); g.moveTo(x - h * .085, hip[1] - h * .095); g.lineTo(x + h * .085, hip[1] - h * .095); g.lineTo(x + h * .1, hip[1] - h * .01); g.lineTo(x - h * .1, hip[1] - h * .01); g.closePath(); g.fillStyle = 'rgba(0,0,10,.12)'; g.fill(); g.strokeStyle = 'rgba(0,0,10,.45)'; g.lineWidth = h * .004; g.stroke();
  } else {
    for (let k = 0; k < 5; k++) circ(neck[0] + h * .004, neck[1] + h * (.09 + k * .05), h * .005, 'rgba(0,0,0,.35)');
    if (zombie) for (let k = 0; k < 6; k++) { ell(x + (hash(k * 3.1) - .5) * h * .2, neck[1] + h * (.06 + .2 * hash(k * 1.7)), h * (.012 + .02 * hash(k)), h * (.01 + .03 * hash(k + 2)), k); g.fillStyle = `rgba(110,10,20,${.5 + .3 * hash(k)})`; g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - h * .2, hip[1] + h * .01, h * .4, h * .02);
  }
  if (o.stain > 0) { const sx = neck[0] + h * .03, sy = neck[1] + h * .15, R = h * .1 * o.stain; g.beginPath(); for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, r = R * (.75 + .3 * Math.sin(a * 3 + 1) + .15 * Math.sin(a * 7)); g.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r * 1.2); } g.closePath(); g.fillStyle = 'rgba(110,62,30,.82)'; g.fill(); g.strokeStyle = 'rgba(70,36,14,.7)'; g.lineWidth = h * .004; g.stroke();
    for (let k = 0; k < 6; k++) { const a = hash(k * 3.3) * TAU, d = R * (1.1 + .5 * hash(k)); circ(sx + Math.cos(a) * d, sy + Math.sin(a) * d * 1.2, h * .006 * o.stain * (1 + hash(k + 1)), 'rgba(110,62,30,.8)'); }
    for (let k = 0; k < 3; k++) { const dx = sx + (k - 1) * R * .5, L_ = R * (.6 + .5 * hash(k * 7)); line([[dx, sy + R * .9], [dx + 2, sy + R * .9 + L_]], h * .008, 'rgba(110,62,30,.75)'); } }
  g.restore();
  if (outfit === 'hoodie') for (const sg of [-1, 1]) { const a = [neck[0] + sg * h * .025, neck[1] + h * .035], b = [neck[0] + sg * h * .032 + Math.sin(t * 2 + sg) * h * .003, neck[1] + h * .13]; line([a, b], h * .006, '#d8d4cc'); rr(b[0] - h * .004, b[1], h * .008, h * .016, h * .003); g.fillStyle = '#9a968e'; g.fill(); }
  else { for (const sg of [-1, 1]) { path([[neck[0], neck[1] + h * .035], [neck[0] + sg * h * .06, neck[1] + h * .005], [neck[0] + sg * h * .045, neck[1] + h * .06]]); g.closePath(); fs(SHIRT[0], h * .005); }
    path([[neck[0] - h * .014, neck[1] + h * .045], [neck[0] + h * .014, neck[1] + h * .045], [neck[0] + h * .022 + sway * h * .01, neck[1] + h * .2], [neck[0] + sway * h * .01, neck[1] + h * .23], [neck[0] - h * .022 + sway * h * .01, neck[1] + h * .2]]); g.closePath(); fs(lg(neck[0] - h * .02, 0, neck[0] + h * .02, 0, ['#8a2a34', '#4a1018']), h * .004); }
  const shs = [[neck[0] - h * .115, neck[1] + h * .06], [neck[0] + h * .115, neck[1] + h * .06]], wv = Math.sin(t * 7) * h * .02;
  const drawArms = () => [-1, 1].forEach((sg, i) => {
    const s0 = shs[i]; let e, hd;
    if (arms === 'out') { e = [s0[0] + sg * h * .15, s0[1] + h * .03 + sg * wv]; hd = [s0[0] + sg * h * .3, s0[1] - h * .01 + sg * wv * 1.5]; }
    else if (arms === 'reach') { const r2 = Math.sin(t * 3 + sg) * h * .015; e = [s0[0] + sg * h * .1, s0[1] - h * .02 + r2]; hd = [s0[0] + sg * h * .18, s0[1] - h * .1 + r2]; }
    else if (arms === 'phone' && sg > 0) { e = [s0[0] + h * .1, s0[1] + h * .13]; hd = [hc[0] + h * .12, hc[1] + h * .03]; }
    else if (arms === 'up') { e = [s0[0] + sg * h * .1, s0[1] - h * .13]; hd = [s0[0] + sg * h * .08, s0[1] - h * .3]; }
    else if (arms === 'rub') { e = [s0[0] + sg * h * .09, s0[1] + h * .08]; hd = [hc[0] + sg * h * .055, hc[1] + h * .02]; }
    else if (arms === 'hold' && sg > 0) { e = [s0[0] + h * .06, s0[1] + h * .17]; hd = [s0[0] - h * .03, s0[1] + h * .14]; }
    else if (arms === 'wave' && sg > 0) { const wv2 = Math.sin(t * 8) * h * .025; e = [s0[0] + h * .13, s0[1] + h * .02]; hd = [s0[0] + h * .15 + wv2, s0[1] - h * .17]; }
    else if (arms === 'lap') { e = [s0[0] + sg * h * .05, s0[1] + h * .15]; hd = [x + sg * h * .07, hip[1] + h * .02]; }
    else { const s2 = walk === null ? 0 : -sg * sw; e = [s0[0] + sg * h * .04 + s2 * h * .05, s0[1] + h * .15]; hd = [s0[0] + sg * h * .05 + s2 * h * .1, s0[1] + h * .3]; }
    limb([s0, e, hd], lw, hood, lx);
    const dx = hd[0] - e[0], dy = hd[1] - e[1], d = Math.hypot(dx, dy) || 1, c0 = [hd[0] - dx / d * h * .028, hd[1] - dy / d * h * .028];
    line([c0, hd], lw + 5, OL); line([c0, hd], lw * .92, hood[outfit === 'shirt' ? 0 : 2]);
    const hx_ = hd[0] + dx / d * h * .015, hy_ = hd[1] + dy / d * h * .015;
    hand(hx_, hy_, h * .03, Math.atan2(dy, dx), { sg: sg * (dy > 0 ? 1 : -1), skin, twitch: sg > 0 ? twitch : 0 });
    if (bandage && sg > 0) { g.save(); g.translate(hx_, hy_); g.rotate(Math.atan2(dy, dx)); for (let k = 0; k < 3; k++) { rr(-h * .025 + k * h * .012, -h * .03, h * .014, h * .06, h * .005); fs(k === 1 ? '#d8d2c4' : '#ece6da', h * .003); } ell(h * .004, -h * .006, h * .016, h * .013); g.fillStyle = 'rgba(150,10,25,.85)'; g.fill(); g.restore(); }
    if (arms === 'phone' && sg > 0) { rr(hx_ - h * .02, hy_ - h * .05, h * .04, h * .075, h * .008); fs('#15161f', h * .004); }
    if (arms === 'hold' && sg > 0 && o.cup) { g.save(); g.translate(hx_ - h * .005, hy_ - h * .01); g.rotate(o.cupTilt || 0); rr(-h * .026, -h * .06, h * .052, h * .07, h * .008); fs(lg(-h * .026, 0, h * .026, 0, ['#f4efe6', '#c9c0b0']), h * .004); rr(-h * .028, -h * .068, h * .056, h * .014, h * .004); fs('#3a2a22', h * .003); g.fillStyle = '#8a5a3a'; g.fillRect(-h * .026, -h * .035, h * .052, h * .016); g.restore(); }
  });
  if (arms !== 'rub') drawArms();
  if (longHair) {     // shoulder-length hair falling behind the face, with strands
    const hx = hc[0], hy = hc[1], r = h * .14, hcol = o.hair || HAIRC;
    const LP = () => { g.beginPath(); g.moveTo(hx - r * 1.02, hy - r * .35); g.bezierCurveTo(hx - r * 1.4, hy + r * .5, hx - r * 1.32, hy + r * 1.25, hx - r * 1.12, hy + r * 1.72); g.quadraticCurveTo(hx - r * .8, hy + r * 1.95, hx - r * .5, hy + r * 1.5); g.lineTo(hx + r * .5, hy + r * 1.5); g.quadraticCurveTo(hx + r * .8, hy + r * 1.95, hx + r * 1.12, hy + r * 1.72); g.bezierCurveTo(hx + r * 1.32, hy + r * 1.25, hx + r * 1.4, hy + r * .5, hx + r * 1.02, hy - r * .35); g.closePath(); };
    LP(); g.fillStyle = lg(hx - r * 1.3, 0, hx + r * 1.3, 0, [hcol[0], hcol[1], hcol[2] || hcol[1], hcol[1], hcol[0]]); g.fill();
    g.save(); LP(); g.clip(); for (let k = 0; k < 16; k++) { const sg = k % 2 ? 1 : -1, u = hash(k * 3.7); curve([hx + sg * r * (.9 + .3 * u), hy - r * .2], [hx + sg * r * (1.3 + .1 * u), hy + r * .8], [hx + sg * r * (.8 + .4 * hash(k)), hy + r * 1.75], r * .03, `rgba(0,0,5,${.25 + .25 * hash(k + 4)})`); } g.restore();
    LP(); g.strokeStyle = OL; g.lineWidth = h * .006; g.stroke(); }
  if (slump > 0) {
    g.save(); g.translate(hc[0], hc[1]); g.scale(1, 1 - .16 * slump); face(0, 0, h * .14, { ...o, lx, rim, eyes: slump > .5 ? 'shut' : o.eyes });
    g.fillStyle = lg(0, -h * .04, 0, h * .14, ['rgba(5,6,12,0)', `rgba(5,6,12,${.85 * slump})`]); g.beginPath(); g.ellipse(0, h * .02, h * .145, h * .14, 0, 0, TAU); g.fill(); g.restore();
  } else face(hc[0], hc[1], h * .14, { ...o, lx, rim });
  if (arms === 'rub') drawArms();
}
// a passenger running past: a solid silhouette with a lit edge, seen from the side
function runner(x, y, h, ph, o = {}) {
  const { col = '#0b0d16', rim = 'rgba(205,245,228,.55)', dir = -1, lean = .22, alpha = 1 } = o; if (alpha <= 0) return;
  const s = Math.sin(ph);
  const draw = (c, ox, oy) => {
    g.save(); g.translate(x + ox, y + oy); g.scale(dir, 1); g.strokeStyle = c; g.fillStyle = c; g.lineCap = 'round'; g.lineJoin = 'round';
    const hip = [0, -h * .47], sh = [h * lean * .4, -h * .78];
    for (const sg of [-1, 1]) { const a = sg * s * .75, k = [hip[0] + Math.sin(a) * h * .24, hip[1] + Math.cos(a) * h * .24], f = [k[0] + Math.sin(a - .6 - Math.max(0, sg * s) * .9) * h * .25, k[1] + Math.cos(a - .6) * h * .25]; g.lineWidth = h * .075; path([hip, k, f]); g.stroke(); g.lineWidth = h * .06; path([f, [f[0] + h * .07, f[1]]]); g.stroke(); }
    path([[sh[0] - h * .09, sh[1] - h * .02], [sh[0] + h * .08, sh[1]], [hip[0] + h * .08, hip[1] + h * .04], [hip[0] - h * .1, hip[1] + h * .04]]); g.closePath(); g.fill();
    for (const sg of [-1, 1]) { const a = -sg * s * .9, e = [sh[0] + Math.sin(a) * h * .16, sh[1] + Math.cos(a) * h * .16], hd = [e[0] + Math.sin(a + 1.2) * h * .15, e[1] + Math.cos(a + 1.2) * h * .12]; g.lineWidth = h * .058; path([sh, e, hd]); g.stroke(); }
    circ(sh[0] + h * .05, sh[1] - h * .1, h * .075, c);
    g.restore();
  };
  g.save(); g.globalAlpha *= alpha; if (rim) draw(rim, -3, -2); draw(col, 0, 0); g.restore();
}

// the bedroom, front view: wallpaper, wainscoting, a painting, a shelf, the clock, the window and curtains, the bed, the lamp
function room(t, o = {}) {
  const { sky = 'night', lamp = 1, bedX = 0, ghost = 0, clock = 3, tint = null } = o, back_ = keep();
  g.drawImage(TEX.wall, -500, -560);
  if (tint) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(-500, -560, 1800, 1810); g.restore(); }
  g.fillStyle = '#2a3150'; g.fillRect(-500, 1000, 1800, 236); if (tint) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(-500, 1000, 1800, 236); g.restore(); }
  for (let x = -480; x < 1300; x += 190) { rr(x, 1030, 160, 170, 6); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 5; g.stroke(); rr(x + 3, 1033, 160, 170, 6); g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 2; g.stroke(); }
  line([[-500, 1000], [1300, 1000]], 10, '#20263f'); line([[-500, 995], [1300, 995]], 3, 'rgba(255,255,255,.12)');
  g.drawImage(TEX.floorFront, -410, 1236);
  g.fillStyle = '#1f2438'; g.fillRect(-500, 1212, 1800, 34); line([[-500, 1214], [1300, 1214]], 3, 'rgba(255,255,255,.14)');
  g.fillStyle = lg(0, 1246, 0, 1300, ['rgba(0,0,0,.5)', 'rgba(0,0,0,0)']); g.fillRect(-500, 1246, 1800, 60);
  // a painting: the moon over a dark sea
  g.save(); g.translate(250, 470); g.rotate(-.025); cshadow(10, 14, 120, 150, .5);
  rr(-105, -135, 210, 270, 6); fs(lg(-105, -135, 105, 135, ['#a8894c', '#5a4320', '#a8894c']), 5); rr(-88, -118, 176, 236, 3); fs(lg(0, -118, 0, 118, ['#0c1838', '#24345e', '#0a1226']), 3);
  fullMoon(20, -50, 22); for (let k = 0; k < 6; k++) line([[-80, 30 + k * 14], [80, 30 + k * 14]], 2, `rgba(170,190,255,${.12 + .05 * k})`); line([[20, 30], [20, 110]], 10, 'rgba(230,230,255,.18)');
  g.restore();
  // the wall clock
  cshadow(548, 340, 80, 80, .5); circ(540, 330, 74, lg(470, 260, 610, 400, ['#c9a45a', '#6a5024'])); circ(540, 330, 74, OL, 6); circ(540, 330, 62, rg(530, 320, 5, 64, ['#f6f1e4', '#cfc6b0']));
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; line([[540 + Math.sin(a) * 50, 330 - Math.cos(a) * 50], [540 + Math.sin(a) * 58, 330 - Math.cos(a) * 58]], k % 3 ? 3 : 6, OL); }
  const ha = clock / 12 * TAU, ma = (clock % 1) * TAU, sa = t * TAU / 4; line([[540, 330], [540 + Math.sin(ha) * 30, 330 - Math.cos(ha) * 30]], 7, OL); line([[540, 330], [540 + Math.sin(ma) * 46, 330 - Math.cos(ma) * 46]], 4, OL); line([[540, 330], [540 + Math.sin(sa) * 50, 330 - Math.cos(sa) * 50]], 2, RED); circ(540, 330, 6, '#c9a45a');
  // the window
  const wx = 790, wy = 620, ww = 310, wh = 380;
  g.save(); rr(wx - ww / 2, wy - wh / 2, ww, wh, 8); g.clip();
  if (sky === 'night') { grad('#0b1744', '#2c2f6e', wy - wh / 2, wy + wh / 2); for (let i = 0; i < 22; i++) star(wx - 145 + hash(i * 3) * 290, wy - 185 + hash(i * 7) * 230, 2 + 3 * hash(i), `rgba(255,255,255,${.5 + .4 * Math.sin(t * 2 + i)})`); fullMoon(wx + 70, wy - 100, 40); for (let k = 0; k < 3; k++) { ell(wx - 80 + k * 90 + Math.sin(t * .2 + k) * 10, wy - 40 + k * 30, 70, 14); g.fillStyle = 'rgba(160,175,230,.13)'; g.fill(); } }
  else { g.fillStyle = lg(0, wy - wh / 2, 0, wy + wh / 2, ['#2a2660', '#a24a6c', '#f2a35e']); g.fillRect(wx - ww, wy - wh, ww * 2, wh * 2); circ(wx - 30, wy + 140, 64, '#ffe9b0'); glow(wx - 30, wy + 140, 260, '255,200,140', .6); for (let k = 0; k < 3; k++) { ell(wx - 60 + k * 70, wy - 60 + k * 40, 80, 12); g.fillStyle = 'rgba(255,170,150,.28)'; g.fill(); } }
  g.drawImage(TEX.city, 300, 280, 1000, 620, wx - ww / 2 - 10, wy + wh / 2 - 175, 330, 205);
  if (ghost > 0) { g.save(); g.globalAlpha = ghost; g.fillStyle = '#05020a'; ell(wx + 40, wy + 50, 52, 70); g.fill(); g.beginPath(); g.moveTo(wx - 60, wy + 200); g.quadraticCurveTo(wx + 40, wy + 80, wx + 140, wy + 200); g.fill(); for (const sg of [-1, 1]) circ(wx + 40 + sg * 20, wy + 44, 6, '#fff'); g.restore(); }
  for (let k = 0; k < 2; k++) beam([[wx - 140 + k * 90, wy - 190], [wx - 100 + k * 90, wy - 190], [wx - 20 + k * 90, wy + 190], [wx - 60 + k * 90, wy + 190]], wx, wy - 190, wx, wy + 190, C.white, .05);
  g.restore();
  rr(wx - ww / 2, wy - wh / 2, ww, wh, 8); g.strokeStyle = OL; g.lineWidth = 30; g.stroke(); g.strokeStyle = '#4a4058'; g.lineWidth = 20; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 3; g.stroke();
  for (const [a, b] of [[[wx, wy - wh / 2], [wx, wy + wh / 2]], [[wx - ww / 2, wy], [wx + ww / 2, wy]]]) { line([a, b], 16, OL); line([a, b], 9, '#4a4058'); }
  rr(wx - 185, wy + wh / 2 + 4, 370, 26, 6); fs(lg(0, wy + wh / 2, 0, wy + wh / 2 + 30, ['#5a5068', '#2a2436']), 5);
  cshadow(wx, wy + wh / 2 + 40, 180, 14, .5);
  // velvet curtains with folds
  for (const sg of [-1, 1]) {
    const cx = wx + sg * 212, sw_ = Math.sin(t * .9 + sg) * 8, top = wy - 255, bot = wy + 290;
    g.beginPath(); g.moveTo(cx - 58, top); g.bezierCurveTo(cx - 46 + sw_, top + 200, cx - 68 + sw_, bot - 120, cx - 50 + sw_ * 2, bot); g.lineTo(cx + 58 + sw_ * 2, bot); g.bezierCurveTo(cx + 48 + sw_, bot - 150, cx + 58, top + 200, cx + 58, top); g.closePath();
    const cg = g.createLinearGradient(cx - 60, 0, cx + 60, 0); [['#2a0f22', 0], ['#7a2a4c', .14], ['#3a1430', .3], ['#9a3a5e', .48], ['#3a1430', .66], ['#7a2a4c', .84], ['#2a0f22', 1]].forEach(([c, p]) => cg.addColorStop(p, c)); g.fillStyle = cg; g.fill(); g.strokeStyle = OL; g.lineWidth = 6; g.stroke();
    for (let k = 0; k < 9; k++) circ(cx - 50 + k * 12.5, top + 6, 5, '#b8a060');
  }
  line([[wx - 290, wy - 258], [wx + 290, wy - 258]], 12, OL); line([[wx - 290, wy - 258], [wx + 290, wy - 258]], 7, '#b8a060'); for (const sg of [-1, 1]) circ(wx + sg * 295, wy - 258, 13, rg(wx + sg * 295 - 4, wy - 262, 1, 13, ['#f0dca0', '#806830']));
  // a floating shelf with books, a plant and a candle
  const sx = bedX + 40;
  cshadow(sx + 160, 835, 180, 10, .5);
  for (let k = 0; k < 7; k++) { const bw = 22 + 10 * hash(k + 3), bh = 90 + 40 * hash(k * 5); rr(sx + 20 + k * 30, 820 - bh, bw, bh, 3); fs(['#2c4a6a', '#7a2a34', '#c49a45', '#3b5a4a', '#5a3a6a', '#8a5a3a', '#2a3a5a'][k], 3); line([[sx + 22 + k * 30, 820 - bh + 14], [sx + 18 + k * 30 + bw, 820 - bh + 14]], 3, 'rgba(255,230,180,.35)'); }
  rr(sx + 250, 760, 46, 60, 6); fs('#b46a48', 3); for (let k = 0; k < 6; k++) curve([sx + 273, 762], [sx + 273 + (k - 2.5) * 16, 720], [sx + 273 + (k - 2.5) * 26 + Math.sin(t * .8 + k) * 3, 700 - (k % 2) * 22], 6, '#3b6a48');
  rr(sx, 820, 320, 18, 4); fs(lg(0, 820, 0, 838, ['#7a5038', '#3a2219']), 4);
  // the bed
  const bx = bedX;
  cshadow(bx + 190, 1262, 400, 28, .65);
  rr(bx - 132, 900, 112, 360, 28); fs(lg(bx - 132, 0, bx - 20, 0, ['#7a4e36', '#3e2418']), 7); rr(bx - 116, 940, 80, 140, 14); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.stroke(); rr(bx - 112, 944, 80, 140, 14); g.strokeStyle = 'rgba(255,220,180,.12)'; g.lineWidth = 2; g.stroke();
  rr(bx - 100, 1150, 600, 62, 14); fs(lg(0, 1150, 0, 1212, ['#5a3828', '#2a1810']), 6);
  rr(bx - 96, 1060, 584, 100, 22); fs(lg(0, 1060, 0, 1160, ['#dfe4f0', '#9aa3bc']), 5); g.setLineDash([9, 7]); line([[bx - 80, 1135], [bx + 470, 1135]], 2.5, 'rgba(60,70,100,.4)'); g.setLineDash([]);
  rr(bx - 96, 986, 160, 86, 36); fs(rg(bx - 30, 1010, 10, 120, ['#ffffff', '#d6dbe7', '#9aa3bc']), 5); curve([bx - 70, 1030], [bx - 16, 1022], [bx + 40, 1036], 2.5, 'rgba(60,70,100,.3)');
  const DP = () => { g.beginPath(); g.moveTo(bx + 30, 1052); g.bezierCurveTo(bx + 150, 1022, bx + 330, 1040, bx + 478, 1060); g.lineTo(bx + 492, 1196); g.bezierCurveTo(bx + 330, 1210, bx + 160, 1192, bx + 18, 1200); g.closePath(); };
  DP(); g.fillStyle = lg(0, 1030, 0, 1200, ['#4a8aa6', '#2b5a74', '#173846']); g.fill();
  g.save(); DP(); g.clip(); for (let k = 0; k < 7; k++) curve([bx + 60 + k * 64, 1046], [bx + 80 + k * 64, 1120], [bx + 50 + k * 66, 1200], 3, 'rgba(5,15,25,.4)'); g.setLineDash([10, 8]); for (let k = 0; k < 3; k++) line([[bx + 30, 1090 + k * 36], [bx + 490, 1094 + k * 36]], 2.5, 'rgba(200,230,255,.18)'); g.setLineDash([]); g.restore();
  DP(); g.strokeStyle = OL; g.lineWidth = 6; g.stroke();
  for (const lx2 of [bx - 80, bx + 470]) { rr(lx2 - 9, 1205, 18, 46, 4); fs('#2a1810', 3); }
  // the nightstand and lamp
  const nx = bx + 520;
  cshadow(nx + 75, 1250, 110, 14, .6);
  rr(nx, 1108, 150, 140, 12); fs(lg(nx, 0, nx + 150, 0, ['#7a4e36', '#4a2c1f']), 6); line([[nx + 10, 1175], [nx + 140, 1175]], 3, 'rgba(0,0,0,.4)'); circ(nx + 75, 1145, 7, rg(nx + 72, 1142, 1, 7, ['#f0dca0', '#806830'])); circ(nx + 75, 1210, 7, rg(nx + 72, 1207, 1, 7, ['#f0dca0', '#806830']));
  rr(nx + 14, 1090, 64, 18, 3); fs('#2c4a6a', 3); rr(nx + 104, 1060, 26, 48, 4); fs('rgba(180,210,240,.35)', 2);
  ell(nx + 75, 1090, 30, 10); fs('#c9c2b6', 3); rr(nx + 62, 1040, 26, 52, 10); fs(lg(nx + 62, 0, nx + 88, 0, ['#e6dfd2', '#8c857a']), 4); line([[nx + 75, 1040], [nx + 75, 1010]], 6, OL);
  g.beginPath(); g.moveTo(nx + 15, 1012); g.lineTo(nx + 135, 1012); g.lineTo(nx + 108, 930); g.lineTo(nx + 42, 930); g.closePath(); fs(lg(nx + 15, 0, nx + 135, 0, lamp ? ['#ffd28a', '#f0b060', '#b87a3a'] : ['#8a7050', '#6a5038', '#4a3828']), 5);
  for (let k = 1; k < 6; k++) line([[nx + 15 + k * 20, 1012], [nx + 42 + k * 11, 930]], 1.5, 'rgba(120,70,30,.25)');
  // lights
  if (lamp) L(nx + 75, 990, 560, C.amb, lamp, .3 * lamp);
  L(wx, wy, sky === 'night' ? 380 : 520, sky === 'night' ? C.moon : '255,190,140', 1, sky === 'night' ? .16 : .3);
  if (sky === 'night') L(wx - 230, 1400, 380, null, .5);
  return () => {
    back_();
    if (lamp) { g.save(); g.globalAlpha = lamp; g.beginPath(); g.moveTo(nx + 15, 1012); g.lineTo(nx + 135, 1012); g.lineTo(nx + 108, 930); g.lineTo(nx + 42, 930); g.closePath(); g.fillStyle = lg(0, 930, 0, 1012, ['rgba(255,220,150,.55)', 'rgba(255,240,200,.85)']); g.fill(); g.restore(); glow(nx + 75, 1000, 160, C.warm, .55 * lamp); beam([[nx + 20, 1012], [nx + 130, 1012], [nx + 220, 1240], [nx - 70, 1240]], nx + 75, 1012, nx + 75, 1240, C.amb, .18 * lamp); }
    if (sky === 'night') { beam([[wx - 150, wy + 190], [wx + 150, wy + 190], [wx - 40, 1560], [wx - 520, 1500]], wx - 100, wy + 190, wx - 300, 1500, C.moon, .1); motes(wx - 500, wy + 100, wx + 60, 1450, 34, t, C.moon, .55, 3); }
    else beam([[wx - 150, wy + 190], [wx + 150, wy + 190], [wx - 60, 1580], [wx - 560, 1520]], wx - 100, wy + 190, wx - 300, 1500, '255,180,130', .14);
  };
}
// a glowing brain: hemispheres, gyri, cerebellum, a soft specular; wash = the cleaning wave, dirt = the build-up
function brain(x, y, s, t, o = {}) {
  const { dirt = 0, wash = -1, sick = 0 } = o;
  g.save(); g.translate(x, y); g.scale(s, s);
  const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, r = 200 + 14 * Math.sin(a * 11) + 8 * Math.sin(a * 5 + 1); pts.push([Math.cos(a) * r * 1.2, Math.sin(a) * r * .85 - (Math.sin(a) > 0 ? Math.sin(a) * 20 : 0)]); }
  const BP = () => { path(pts); g.closePath(); };
  ell(150, 150, 95, 60, .3); fs(rg(140, 140, 10, 100, sick ? ['#b88a8a', '#6a4a52'] : ['#e8a0b8', '#9a4a6a']), 6); for (let k = 0; k < 5; k++) curve([80 + k * 10, 120 + k * 12], [150, 110 + k * 14], [220 - k * 6, 130 + k * 12], 3, 'rgba(80,20,40,.45)');
  rr(60, 150, 50, 110, 20); fs(sick ? '#8a6a6a' : '#c9788e', 5);
  BP(); g.fillStyle = rg(-60, -80, 20, 300, sick ? ['#d8a8a8', '#a87880', '#5a3a42'] : ['#ffc0d4', '#e07898', '#7a2a4a']); g.fill();
  g.save(); BP(); g.clip();
  for (let k = 0; k < 46; k++) { let px = (hash(k * 3.1) - .5) * 480, py = (hash(k * 5.7) - .5) * 320, a = hash(k) * TAU; const pts_ = [[px, py]]; for (let j = 0; j < 14; j++) { a += Math.sin(j * 1.7 + k) * .9; px += Math.cos(a) * 15; py += Math.sin(a) * 15; pts_.push([px, py]); }
    g.save(); g.translate(-3, -3); path(pts_); g.strokeStyle = 'rgba(255,215,230,.35)'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); g.restore(); path(pts_); g.strokeStyle = 'rgba(95,18,48,.6)'; g.lineWidth = 5; g.stroke(); }
  line([[-10, -190], [8, -90], [-8, 10], [6, 120]], 8, 'rgba(90,20,45,.6)');
  if (wash >= 0) { const wx = lerp(-340, 660, wash); g.save(); g.beginPath(); g.moveTo(wx - 300, 260); for (let yy = 260; yy >= -260; yy -= 20) g.lineTo(wx + Math.sin(yy * .03 + t * 5) * 30, yy); for (let yy = -260; yy <= 260; yy += 20) g.lineTo(wx - 300 + Math.sin(yy * .03 + t * 5 + 2) * 30, yy); g.closePath(); g.fillStyle = lg(wx - 300, 0, wx, 0, ['rgba(30,110,255,0)', 'rgba(60,170,255,.85)']); g.fill(); g.restore(); g.save(); g.globalCompositeOperation = 'source-atop'; g.beginPath(); for (let yy = 260; yy >= -260; yy -= 20) g.lineTo(wx + Math.sin(yy * .03 + t * 5) * 30, yy); g.strokeStyle = 'rgba(200,240,255,.9)'; g.lineWidth = 8; g.stroke(); g.restore();
    for (let k = 0; k < 18; k++) { const bx = wx - 20 - hash(k) * 280, by = -220 + hash(k * 3) * 440 - ((t * 80 + k * 30) % 80); circ(bx, by, 5 + 6 * hash(k + 1), 'rgba(200,240,255,.8)', 3); } }
  for (let k = 0; k < Math.floor(dirt * 46); k++) { const dx = (hash(k * 7.3) - .5) * 420, dy = (hash(k * 3.9) - .5) * 300, r = 10 + 16 * hash(k); g.save(); g.shadowColor = 'rgba(200,170,40,.8)'; g.shadowBlur = 14; ell(dx, dy, r, r * .8, k); g.fillStyle = k % 3 ? '#a08a2a' : '#6a8a2a'; g.fill(); g.restore(); ell(dx, dy, r, r * .8, k); g.strokeStyle = 'rgba(30,20,10,.6)'; g.lineWidth = 3; g.stroke(); circ(dx - r * .3, dy - r * .3, r * .2, 'rgba(255,240,180,.5)'); }
  g.fillStyle = rg(-120, -140, 10, 200, ['rgba(255,255,255,.35)', 'rgba(255,255,255,0)']); g.fillRect(-300, -300, 400, 300);
  g.restore();
  BP(); g.strokeStyle = OL; g.lineWidth = 9; g.lineJoin = 'round'; g.stroke();
  g.restore();
}

// ---------- this story's palette, words and textures ----------
const SKINS = [SKIN, ['#e8b894', '#c08a68', '#7a5038'], ['#c48a64', '#9a6444', '#5a3624'], ['#8a5a3e', '#6a4028', '#3a2214']];
const HAIRS = [HAIRC, ['#3a2418', '#5a3a28', '#7a5038'], ['#1a1410', '#2e2218', '#423226'], ['#6a6464', '#9a9490', '#c4bebb']];
const MOMC = ['#d08a5a', '#a05a3a', '#5a2a1e'], FRIC = ['#7ac0a0', '#4a8a70', '#24503e'], CRUC = ['#e888a8', '#b85278', '#6a2444'], MANC = ['#7a7a88', '#4c4c58', '#24242c'], BOSSC = ['#5a6078', '#3a3e52', '#1c1e2a'];
const TOPS = [['#c9a14a', '#9a7428', '#5a420e'], ['#5aa0a0', '#367474', '#1a4040'], ['#b06a8a', '#844060', '#4a1e34'], ['#7a8ab8', '#4e5c8a', '#262e50'], ['#a8b06a', '#7a8440', '#424a1c'], ['#c87060', '#984438', '#56201a']];
C.gold = '255,206,110'; C.rose = '255,120,170'; C.ice = '200,225,255';
const GOLD = '#ffce6e', ROSE = '#ff78aa';
const TX = {
  en: { t1: 'WHAT IF YOU COULD HEAR', t2: "EVERYONE'S THOUGHTS?", q: 'QUESTION', comment: 'COMMENT YOUR ANSWER', plus: '+1 POINT', score: 'YOUR SCORE', play: 'PLAY ALONG', aloud: 'ANSWER OUT LOUD',
        name: '[ YOUR NAME ]', until: 'UNTIL MIDNIGHT', secret: 'THE SECRET', bear: ["DON'T THINK ABOUT", 'A WHITE BEAR'], here: 'HERE', away: 'ELSEWHERE', noticed: 'PEOPLE WHO NOTICED',
        boss: 'THE BOSS', you: 'YOU', friend: 'BEST FRIEND', crush: 'YOUR CRUSH', bro: 'LITTLE BROTHER', mom: 'MOM', think: 'WHAT YOU THINK', truth: 'THE TRUTH', likeQ: 'HOW MUCH THEY LIKE YOU',
        inside: 'YOUR INSIDE', reel: 'THEIR HIGHLIGHT REEL', voice: 'INNER VOICE', pics: 'PICTURES & FEELINGS', bin: 'BREATHE IN', bout: 'BREATHE OUT', welcome: "YOU'RE WELCOME",
        say: ['SAY THE THING', 'WEAR THE SHIRT', 'TALK TO THE PERSON'], mon: ['MOM', 'BROTHER', 'BOSS', 'CRUSH'], next: 'WATCH NEXT', sub: 'SUBSCRIBE', end: ['YOUR SCORE', '? / 4'],
        chat1: 'thanks for lunch!!', chat2: 'ok.', busy: 'BUSY, NOT ANGRY', rem: 'REMEMBER THIS', feel: 'HOW NERVOUS YOU FEEL', look: 'HOW NERVOUS YOU LOOK', station: 'CENTRAL', whose: 'whose thoughts would you hear first?', innerWords: 'okay, first I need to... wait, did I...', ans: 'ANSWER', nerv: "THEY'RE NERVOUS", nobody: 'NOBODY IS WATCHING', countries: '13 COUNTRIES', hi: 'HI!', cw: 'comments', next2: 'WHAT HAPPENS TO YOUR BRAIN', next3: 'WHEN YOU NEVER SLEEP' },
  tl: { t1: 'PAANO KUNG MARIRINIG MO', t2: 'ANG ISIP NG LAHAT?', q: 'TANONG', comment: 'I-COMMENT ANG SAGOT MO', plus: '+1 PUNTOS', score: 'SCORE MO', play: 'SUMABAY KA', aloud: 'SUMAGOT NANG MALAKAS',
        name: '[ PANGALAN MO ]', until: 'HANGGANG HATINGGABI', secret: 'ANG SIKRETO', bear: ["'WAG MONG ISIPIN", 'ANG PUTING OSO'], here: 'NANDITO', away: 'LUMILIPAD', noticed: 'NAKAPANSIN',
        boss: 'ANG BOSS', you: 'IKAW', friend: 'BEST FRIEND', crush: 'CRUSH MO', bro: 'KAPATID', mom: 'NANAY', think: 'AKALA MO', truth: 'ANG TOTOO', likeQ: 'GAANO KA NILA KAGUSTO',
        inside: 'ANG LOOB MO', reel: 'HIGHLIGHT REEL NILA', voice: 'BOSES SA ISIP', pics: 'LARAWAN AT PAKIRAMDAM', bin: 'HUMINGA', bout: 'IBUGA', welcome: 'WALANG ANUMAN',
        say: ['SABIHIN MO NA', 'ISUOT MO NA', 'KAUSAPIN MO NA'], mon: ['NANAY', 'KAPATID', 'BOSS', 'CRUSH'], next: 'PANOORIN SUNOD', sub: 'MAG-SUBSCRIBE', end: ['SCORE MO', '? / 4'],
        chat1: 'thank you sa lunch!!', chat2: 'ok.', busy: 'BUSY, HINDI GALIT', rem: 'TANDAAN MO ITO', feel: 'GAANO KA KINAKABAHAN', look: 'GAANO KA HALATA', station: 'CENTRAL', whose: 'kaninong isip ang gusto mong unang marinig?', innerWords: 'okay, una kailangan ko... teka, nai-...',
        ans: 'SAGOT', nerv: 'KINAKABAHAN SIYA', nobody: 'WALANG NAKATINGIN', countries: '13 BANSA', hi: 'HI!', cw: 'comments', next2: 'ANO ANG NANGYAYARI SA UTAK', next3: 'KAPAG HINDI KA NATUTULOG' },
}[LANG] || {};
const QT = {
  en: { q1: ['HOW MANY THOUGHTS DOES A', 'PERSON HAVE IN ONE DAY?'], q2: ['WHAT IS THE PERSON NEXT TO YOU', 'MOST LIKELY THINKING ABOUT?'], q3: ['THEY GUESSED HALF THE ROOM WOULD NOTICE', 'THE SHIRT. HOW MANY ACTUALLY DID?'],
        q4: ['WHAT IS YOUR CRUSH', 'THINKING RIGHT NOW?'], q5: ['EVER HAD A RANDOM DARK THOUGHT', "YOU'D NEVER ACT ON?"], q6: ['DO YOU HEAR THIS SENTENCE', 'IN YOUR HEAD?'] },
  tl: { q1: ['ILANG ISIP ANG DUMADAAN', 'SA ISANG TAO SA ISANG ARAW?'], q2: ['ANO ANG MALAMANG NA', 'INIISIP NG KATABI MO?'], q3: ['AKALA NILA KALAHATI NG KWARTO ANG MAKAKAPANSIN.', 'ILAN ANG TALAGANG NAKAPANSIN?'],
        q4: ['ANO ANG INIISIP', 'NG CRUSH MO NGAYON?'], q5: ['NAGKAROON KA NA BA NG MADILIM NA ISIP', 'NA HINDING-HINDI MO GAGAWIN?'], q6: ['NARIRINIG MO BA ANG PANGUNGUSAP', 'NA ITO SA ISIP MO?'] },
}[LANG] || {};
const FRAG = {
  en: ['where are my keys', 'so tired...', 'is it Friday yet?', "I'm starving", 'did I lock it?', 'ugh, Monday', 'I miss her', 'what time is it?', "don't forget milk", 'five more minutes',
       'I need coffee', 'am I late?', 'he never texted back', 'is that rain?', 'I love this song', 'what was her name?', "I can't do this", 'just breathe', 'pizza tonight?', 'stop overthinking',
       'does he like me?', 'my feet hurt', 'call mom later', 'I look tired', 'why did I say that?', 'payday soon', 'I hope it works', 'so many emails', 'what if I fail?', 'nice weather'],
  tl: ['nasaan susi ko', "pagod na 'ko...", 'Biyernes na ba?', "gutom na 'ko", 'na-lock ko ba?', 'Lunes na naman', 'miss ko na siya', 'anong oras na?', "'wag kalimutan gatas", 'limang minuto pa',
       'kailangan ko ng kape', "late na ba 'ko?", 'di pa rin nag-reply', 'uulan ba?', "ganda ng kantang 'to", 'ano nga pangalan niya?', "kaya ko ba 'to?", 'hinga lang', 'pizza mamaya?', "'wag mag-overthink",
       'gusto kaya niya ako?', 'sakit ng paa ko', 'tawagan si mama', 'mukha akong pagod', "bakit ko sinabi 'yon?", 'sweldo na', 'sana gumana', 'dami kong email', 'paano kung bumagsak ako?', 'ganda ng panahon'],
}[LANG] || [];
const MOMF = { en: ['work at nine', 'is he eating?', 'electric bill', 'dentist?', 'so tired', 'call grandma', 'rice, eggs, soap', 'am I a good mom?', 'my knee hurts', 'bus fare'],
  tl: ['trabaho alas nuwebe', 'kumakain ba siya?', 'bayad sa kuryente', 'dentista?', 'pagod na ako', 'tawagan si lola', 'bigas, itlog, sabon', 'mabuti ba akong nanay?', 'sakit ng tuhod ko', 'pamasahe'] }[LANG] || [];
const KIDF = { en: ['math test...', "don't ask", "she'll find out", "I'm so dumb", 'just eat', 'two more days', 'hide the paper', 'act normal'],
  tl: ['math test...', "'wag magtanong", 'malalaman niya', 'ang hina ko', 'kain lang', 'dalawang araw pa', 'itago ang papel', 'umarte nang normal'] }[LANG] || [];
const WORRY = { en: ['are they mad?', 'what did I do?', 'was I annoying?', 'should I say sorry?'], tl: ['galit ba siya?', "ano'ng ginawa ko?", 'nakakainis ba ako?', 'mag-sorry ba ako?'] }[LANG] || [];
const COMPL = { en: ['cool jacket', 'nice smile', 'she seems kind', 'great laugh', 'love that hair', 'good vibes', 'he looks smart', 'nice voice', 'so stylish', 'cute bag'],
  tl: ['astig ng jacket', 'ganda ng ngiti', 'mukhang mabait', 'cute tumawa', 'ganda ng buhok', 'good vibes', 'mukhang matalino', 'ganda ng boses', 'ang porma', 'cute ng bag'] }[LANG] || [];
const ECHO = { en: ['I hope they like me', "I hope I'm enough", "I'm scared", 'please like me', 'am I enough?', "don't see me shake"],
  tl: ['sana gusto nila ako', 'sana sapat ako', 'takot ako', 'sana tanggap nila ako', 'sapat ba ako?', "'wag nilang makitang nanginginig ako"] }[LANG] || [];
TEX.plaster = paint(mk(2600, 900), (w, h) => { g.fillStyle = '#cdb595'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,244,226' : '70,46,24'},.05)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2 + 2 * hash(i * 5), 2); } for (let k = 0; k < 14; k++) { const x = hash(k * 4.1) * w, y = hash(k * 7.7) * h; g.fillStyle = rg(x, y, 0, 200, ['rgba(90,60,30,.08)', 'rgba(90,60,30,0)']); g.fillRect(x - 200, y - 200, 400, 400); } });
TEX.checker = paint(mk(2600, 420), (w, h) => { for (let r = 0, y = 0; y < h; r++) { const th = 40 + r * 16; for (let c = 0, x = -((r * 30) % 120); x < w; c++, x += 120) { g.fillStyle = (r + c) % 2 ? '#d8d2c6' : '#2a2a32'; g.fillRect(x, y, 120, th); } y += th; } for (let i = 0; i < 30000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,255' : '0,0,0'},.05)`; g.fillRect(hash(i * 1.7) * w, hash(i * 3.3) * h, 2, 2); } });
TEX.concrete = paint(mk(2600, 600), (w, h) => { g.fillStyle = '#5a5a62'; g.fillRect(0, 0, w, h); for (let i = 0; i < 80000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '230,230,240' : '10,10,20'},.08)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2 + 2 * hash(i), 2); } for (let x = 0; x < w; x += 260) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 0, 3, h); } for (let k = 0; k < 20; k++) { const x = hash(k * 4.1) * w, y = hash(k * 7.7) * h; g.fillStyle = rg(x, y, 0, 160, ['rgba(20,20,30,.2)', 'rgba(20,20,30,0)']); g.fillRect(x - 160, y - 160, 320, 320); } });

// ---------- thought bubbles: a glowing cloud that types its words as they are heard ----------
function cloud(x, y, w, h, seed = 0) {      // a scalloped cloud around an ellipse
  const rx = w / 2, ry = h / 2, n = Math.max(8, Math.round(Math.PI * (rx + ry) / 64)), P_ = a => [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
  g.beginPath(); g.moveTo(...P_(0));
  for (let i = 1; i <= n; i++) {
    const a0 = (i - 1) / n * TAU, a1 = i / n * TAU, p0 = P_(a0), p1 = P_(a1), am = (a0 + a1) / 2, pm = P_(am);
    let nx = Math.cos(am) / rx, ny = Math.sin(am) / ry; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
    const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * (.5 + .12 * Math.sin(i * 2.7 + seed));
    g.quadraticCurveTo(pm[0] + nx * d, pm[1] + ny * d, p1[0], p1[1]);
  }
  g.closePath();
}
function wrapWords(ws, maxw) {
  const sp = g.measureText(' ').width, lines = []; let cur = null;
  ws.forEach((w, i) => { const ww = g.measureText(w).width; if (!cur || (cur.items.length && cur.w + sp + ww > maxw)) { cur = { items: [], w: 0 }; lines.push(cur); } const x = cur.items.length ? cur.w + sp : 0; cur.items.push({ w, i, x }); cur.w = x + ww; });
  return lines;
}
// ws: the words; shown: how many are visible; tx, ty: where the trailing dots point (the thinker's head); pic: a drawing inside (pw x ph)
function bubble(x, y, ws, shown, o = {}) {
  const { tx = null, ty = null, col = C.gold, size = 46, maxw = 600, a = 1, k = 1, seed = 0, lastT = 1, ink = '#fbf6ee', glowA = 1, pic = null, pw = 0, ph = 0, fill_ = 'rgba(12,14,30,.86)' } = o;
  if (a <= .003 || k <= .01) return;
  g.save(); g.font = `600 ${size}px Caveat`;
  const lines = ws.length ? wrapWords(ws, maxw) : [], lh = size * 1.0;
  const tw = Math.max(pw, size * 1.6, ...lines.map(l => l.w)), th = lines.length * lh + ph;
  const bw = tw + size * 1.5, bh = th + size * 1.2;
  g.globalAlpha *= a; const A0 = g.globalAlpha;
  if (tx !== null) for (let i = 0; i < 3; i++) { const u = .4 + i * .2, px = lerp(x, tx, u), py = lerp(y + bh * .3 * k, ty, u), r = size * (.3 - i * .07) * Math.max(.4, k); circ(px, py, r, fill_); circ(px, py, r, `rgba(${col},.9)`, 2.5); }
  g.translate(x, y); g.scale(k, k);
  cloud(0, 0, bw, bh, seed); g.fillStyle = fill_; g.fill();
  g.save(); g.clip(); g.fillStyle = rg(-bw * .2, -bh * .5, 0, bw * .7, [`rgba(${col},.28)`, `rgba(${col},0)`]); g.fillRect(-bw, -bh, 2 * bw, 2 * bh); g.restore();
  if (glowA) { g.shadowColor = `rgba(${col},${.9 * glowA})`; g.shadowBlur = 22; }
  g.strokeStyle = `rgba(${col},.95)`; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke(); g.shadowBlur = 0;
  if (pic) pic(0, -th / 2 + ph / 2, pw, ph);
  g.font = `600 ${size}px Caveat`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = ink;
  lines.forEach((l, li) => { const ly = -th / 2 + ph + lh * (li + .5); l.items.forEach(it => { if (it.i >= shown) return; const f = it.i === shown - 1 ? lastT : 1; g.globalAlpha = A0 * clamp(f * 1.6); g.fillText(it.w, -l.w / 2 + it.x, ly + (1 - eo(f)) * size * .2); }); });
  g.restore();
}
// a spoken thought (a narrator line with fx: thought): the bubble types the words as the narrator says them
function thought(id, t, x, y, o = {}) {
  const l = LN[id]; if (!l || !l.words) return;
  const [i0, i1] = o.part || [0, l.words.length], ws = l.words.slice(i0, i1); if (!ws.length) return;
  const tOn = ws[0][1] - .3, tOff = o.until ?? (l.t1 + (o.hold ?? .8));
  if (t < tOn || t > tOff + .45) return;
  const a = ss(seg(t, tOn, tOn + .25)) * (1 - ss(seg(t, tOff, tOff + .45)));
  let shown = 0, lastT = 1; ws.forEach((w, i) => { if (t >= w[1] - .04) { shown = i + 1; lastT = seg(t, w[1] - .04, w[1] + .16); } });
  const k = back(seg(t, tOn, tOn + .4), 1.5) * (o.k ?? 1), bob = Math.sin(t * 1.3 + (o.seed || 0)) * 6;
  bubble(x, y + bob, ws.map(w => w[0]), shown, { ...o, a: a * (o.a ?? 1), k, lastT });
}
const parts = id => { const l = LN[id], r = []; if (!l || !l.words) return r; let a = 0; l.words.forEach((w, i) => { if (/[.?!]$/.test(w[0]) || i === l.words.length - 1) { r.push([a, i + 1]); a = i + 1; } }); return r; };
const BCOL = [C.gold, C.cyan, C.rose, C.pur, C.grn, C.amb];
function murmur(x, y, s, txt, a, col = C.gold, o = {}) { if (a <= .01) return; bubble(x, y, txt.split(' '), 99, { size: s, maxw: s * 8, a, col, seed: x * .01, glowA: 0, ...o }); }
// a field of background thoughts drifting up; t0 = when they start appearing, rate = seconds between new ones
function swarm(t, n, x0, y0, x1, y1, a, o = {}) {
  const { seed = 0, list = FRAG, s0 = 24, s1 = 36, t0 = -99, rate = .05, rise = 16, col = null, avoid = null } = o; if (a <= .01) return;
  for (let i = 0; i < n; i++) {
    const on = t0 + i * rate; if (t < on) continue;
    const p = (hash(i * 4.1 + seed) + (t - on) * rise / (y1 - y0 + 1)) % 1, x = lerp(x0, x1, hash(i * 7.7 + seed)) + Math.sin(t * .5 + i) * 20, y = lerp(y1, y0, p);
    const av = avoid ? ss(seg(Math.hypot(x - avoid[0], y - avoid[1]), avoid[2] * .7, avoid[2])) : 1;
    murmur(x, y, lerp(s0, s1, hash(i * 2.3 + seed)), list[(i + seed) % list.length], a * av * Math.sin(Math.PI * p) * ss(seg(t, on, on + .35)), col || BCOL[i % BCOL.length]);
  }
}
// little glowing orbs rising (thoughts seen from far away)
function risers(t, n, x0, x1, ybot, ytop, a, seed = 0, col = C.gold, sz = 1) {
  if (a <= .01) return; g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) { const sp = .04 + .06 * hash(i + seed), p = (hash(i * 3.3 + seed) + t * sp) % 1, x = lerp(x0, x1, hash(i * 9.1 + seed)) + Math.sin(t * .8 + i) * 14, y = lerp(ybot, ytop, p), r = (4 + 9 * hash(i * 1.7 + seed)) * (1 + p * .6) * sz, al = a * Math.sin(Math.PI * Math.min(1, p * 1.2));
    if (al <= .01) continue; circ(x, y, r, `rgba(${col},${al * .22})`); circ(x, y, r, `rgba(${col},${al * .85})`, 2); circ(x - r * .35, y - r * .35, r * .22, `rgba(255,255,255,${al * .7})`); }
  g.restore();
}
// sound rings spreading from a point (a voice arriving)
function rings(x, y, t, t0, col, n = 3, r1 = 420) { if (t < t0) return; for (let k = 0; k < n; k++) { const p = (t - t0) * .8 - k * .33; if (p < 0 || p > 1) continue; g.beginPath(); g.arc(x, y, 30 + r1 * eo(p), 0, TAU); g.strokeStyle = `rgba(${col},${.5 * (1 - p)})`; g.lineWidth = 4; g.stroke(); } }

// ---------- overlays: glass, the stat cards, name tags, the clock, the captions ----------
function glass(x, y, w, h, r, border, bw = 4, glowc = null) {
  rr(x, y, w, h, r); g.fillStyle = 'rgba(8,10,22,.8)'; g.fill();
  g.save(); if (glowc) { g.shadowColor = glowc; g.shadowBlur = 26; } rr(x, y, w, h, r); g.strokeStyle = border; g.lineWidth = bw; g.stroke(); g.restore();
  rr(x + bw, y + bw, w - 2 * bw, h * .45, r * .8); g.fillStyle = 'rgba(255,255,255,.04)'; g.fill();
}
function tag(s, x, y, col, rgbc, k = 1, size = 44) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(k, k); g.font = `${size}px Anton`; const w = g.measureText(s).width + 50;
  glass(-w / 2, -size * .78, w, size * 1.56, 20, col, 3, `rgba(${rgbc},.7)`); path([[-13, size * .78], [0, size * .78 + 22], [13, size * .78]]); g.closePath(); g.fillStyle = col; g.fill();
  text(s, 0, 3, size, col, 'Anton'); g.restore();
}
function pill(s, x, y, size, col, rgbc, k = 1, sub = null) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); g.font = `${size}px Anton`; const w = g.measureText(s).width + size * 1.3;
  glass(-w / 2, -size * .8, w, size * 1.6, size * .8, col, 4, `rgba(${rgbc},.8)`);
  g.save(); g.shadowColor = `rgba(${rgbc},.9)`; g.shadowBlur = 18; text(s, 0, 4, size, col, 'Anton'); g.restore();
  if (sub) text(sub, 0, size * 1.25, size * .5, '#c9cde0', 'Anton');
  g.restore();
}
const STATC = [[AMB, C.amb], [CYAN, C.cyan], [PUR, C.pur], [GRN, C.grn], [MAG, C.mag], [RED, C.red], [ROSE, C.rose], [GOLD, C.gold]];
const shotEnd = t0 => { const s = SHOTS.find(s => t0 >= s[0] && t0 < s[1]); return s ? s[1] : TL.dur; };
let NOSTAT = 0;
function statCard(t, cx = W - 450, cy = 165, ks = 1) {
  let i = -1; if (NOSTAT) return;
  TL.lines.forEach(l => { if (!l.stat) return; i++; const end = Math.min(l.t1 + 3.5, shotEnd(l.t0)); if (t >= l.t0 && t < end) draw(l, i, end); });
  function draw(l, idx, end) {
    const p = t - l.t0, k = back(seg(p, .05, .35), 1.8) * ks, a = clamp(seg(p, .05, .2) * 1.5) * (1 - ss(seg(t, end - .35, end))), [lab, big, src] = l.stat, [col, rgbc] = STATC[idx % STATC.length];
    reset(); g.save(); g.translate(cx, cy); g.scale(k, k); g.globalAlpha = a;
    glass(-380, -95, 760, 190, 24, `rgba(${rgbc},.7)`, 3, `rgba(${rgbc},.6)`);
    rr(-380, -95, 12, 190, [24, 0, 0, 24]); g.fillStyle = col; g.fill();
    text(lab, 8, -56, 32, '#c9cde0', 'Anton');
    g.font = '80px Anton'; const sc = Math.min(1, 690 / g.measureText(big).width) * lerp(1.18, 1, eo(seg(p, .2, .5)));
    g.save(); g.translate(8, 10); g.scale(sc, sc); g.shadowColor = `rgba(${rgbc},.9)`; g.shadowBlur = 28; text(big, 0, 0, 80, col, 'Anton'); g.restore();
    g.font = '500 24px sans-serif'; g.fillStyle = '#8f95ad'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(src, 8, 68);
    g.restore();
  }
}
function clockIcon(x, y, r, hr, col) {
  circ(x, y, r, 'rgba(255,255,255,.08)'); circ(x, y, r, col, 4);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; line([[x + Math.sin(a) * r * .7, y - Math.cos(a) * r * .7], [x + Math.sin(a) * r * .86, y - Math.cos(a) * r * .86]], 2, col); }
  const ha = hr / 12 * TAU, ma = (hr % 1) * TAU; line([[x, y], [x + Math.sin(ha) * r * .5, y - Math.cos(ha) * r * .5]], 5, '#fff'); line([[x, y], [x + Math.sin(ma) * r * .74, y - Math.cos(ma) * r * .74]], 3, col); circ(x, y, 4, '#fff');
}
const hours = s => { const m = s.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; return +m[1] % 12 + (/PM/i.test(m[3]) ? 12 : 0) + +m[2] / 60; };
// the time of day: a big card when the hour changes, then it settles in the corner
function clockHUD(t, shot) {
  if (['title', 'outro', 'quiz', 'montage'].includes(shot)) return;
  let cur = null, t0 = 0, prev = null; for (const l of TL.lines) { if (l.t0 > t) break; if (l.clock) { prev = cur; cur = l.clock; t0 = l.t0; } }
  if (!cur) return;
  const p = t - t0, big = 1 - ss(seg(p, 1.7, 2.3)), h1 = hours(cur), h0 = prev ? hours(prev) : h1 - 1, hr = lerp(h0, h1 + (h1 < h0 ? 24 : 0), eo(seg(p, 0, 1.3)));
  const x = lerp(60, CX, big), y = lerp(62, 170, big), k = lerp(.6, 1.12, big) * back(seg(p, 0, .4), 1.7);
  reset(); g.save(); g.translate(x, y); g.scale(k, k);
  g.font = '72px Anton'; const tw = g.measureText(cur).width, w = tw + 150, x0 = lerp(0, -w / 2, big);
  glass(x0, -52, w, 104, 52, `rgba(${C.gold},.75)`, 4, `rgba(${C.gold},.7)`);
  clockIcon(x0 + 56, 0, 31, hr, GOLD);
  g.save(); g.shadowColor = 'rgba(255,206,110,.8)'; g.shadowBlur = 10 + 14 * big; text(cur, x0 + 104 + tw / 2, 4, 72, '#fff', 'Anton'); g.restore();
  g.restore();
}
// captions: word by word (4 at a time), the current word pops, key words gold (red on the dark lines); thoughts show in their bubble instead
const REDCAP = ['platform'];
function captions(t) {
  let last = null; for (const l of TL.lines) { if (l.t0 - .02 > t) break; last = l; }      // only the line being spoken (no overlap at the joins)
  for (const l of last ? [last] : []) {
    if (!l.words || l.fx === 'thought' || l.q || t < l.t0 - .02 || t > l.t1 + .25) continue;
    const k = wordAt(l.id, t); if (k < 0) continue;
    const N = 4, a = Math.floor(k / N) * N, ws = l.words.slice(a, Math.min(l.words.length, a + N));
    const keys = (l.key || []).map(norm), red = REDCAP.includes(l.shot), kc = red ? RED : YEL, kg = red ? 'rgba(255,49,80,.85)' : 'rgba(255,190,80,.8)';
    const size = 72, gap = 30, up = w => w.toUpperCase(); reset(); g.font = `${size}px Anton`;
    const widths = ws.map(w => g.measureText(up(w[0])).width), total = widths.reduce((s, v) => s + v, 0) + gap * (ws.length - 1), sc = Math.min(1, 1500 / total);
    let x = CX - total * sc / 2; const y = 978;
    ws.forEach((w, i) => {
      const idx = a + i; if (idx > k) { x += (widths[i] + gap) * sc; return; }
      const isKey = keys.some(kk => kk && norm(w[0]).startsWith(kk)), pop = idx === k ? back(seg(t, w[1], w[1] + .12), 2.2) : 1, s = sc * (idx === k ? lerp(1.12, 1, seg(t, w[1], w[1] + .16)) : 1);
      g.save(); g.translate(x + widths[i] * sc / 2, y); g.scale(s, s); g.globalAlpha = clamp(pop * 1.2);
      g.font = `${size}px Anton`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 16; g.lineWidth = 13; g.strokeStyle = OL; g.lineJoin = 'round'; g.strokeText(up(w[0]), 0, 0); g.shadowBlur = 0;
      if (isKey) { g.shadowColor = kg; g.shadowBlur = 24; }
      g.fillStyle = isKey ? kc : '#ffffff'; g.fillText(up(w[0]), 0, 0); g.restore();
      x += (widths[i] + gap) * sc;
    });
  }
}

// ---------- places (each returns a post-light step: the emissive things, beams and dust) ----------
// a city at dawn (or dusk): layered sky, the sun on the horizon, two rows of skyline; thoughts rise from the windows
function cityView(t, o = {}) {
  const { night = 0, sunY = 760, orbs = 1, n = 70 } = o, back_ = keep();
  g.fillStyle = lg(0, -300, 0, 820, night ? ['#03040e', '#0a0e2c', '#1e1a44', '#3a2450'] : ['#0e1236', '#3a2a5e', '#a04a6a', '#f2a35e']); g.fillRect(-600, -500, 3120, 1400);
  if (night) { for (let i = 0; i < 160; i++) star(-500 + hash(i * 3.1) * 2900, -400 + hash(i * 7.3) * 900, 1.5 + 2.5 * hash(i), `rgba(255,255,255,${.35 + .45 * Math.sin(t * 1.5 + i)})`); fullMoon(1500, 160, 46); }
  else { circ(1320, sunY, 80, '#ffe9b0'); for (let k = 0; k < 5; k++) { ell(300 + k * 380 + Math.sin(t * .1 + k) * 30, 300 + 60 * hash(k), 220, 22); g.fillStyle = `rgba(255,170,150,${.18 + .1 * hash(k + 3)})`; g.fill(); } }
  g.drawImage(TEX.city, 0, 0, 2400, 900, -500, 300, 2900, 720);
  g.save(); g.globalAlpha = .9; g.drawImage(TEX.city, 600, 0, 1800, 900, -600, 420, 3200, 760); g.restore();
  g.fillStyle = lg(0, 900, 0, 1300, ['rgba(8,8,20,.0)', 'rgba(8,8,20,.9)']); g.fillRect(-600, 900, 3120, 400);
  if (night) { L(1500, 160, 700, C.moon, .8, .15); L(CX, 900, 1500, '255,170,110', .5, .12); }
  else { L(1320, sunY, 1100, '255,190,130', 1, .35); L(CX, 300, 1400, null, .5); }
  return () => { back_(); if (!night) glow(1320, sunY, 700, '255,200,140', .45); if (orbs) risers(t, n, -400, 2300, 1000, -200, orbs, 3, C.gold, 1.2); };
}
// the hallway outside your room: wallpaper, your door, family photos, a console table with a lamp
function hallway(t) {
  const back_ = keep();
  g.drawImage(TEX.wall, -300, -500, 2600, 1520); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#c8a088'; g.fillRect(-300, -500, 2600, 1520); g.restore();
  g.fillStyle = '#4a3a3a'; g.fillRect(-300, 760, 2600, 260); for (let x = -280; x < 2300; x += 210) { rr(x, 790, 180, 190, 6); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 5; g.stroke(); }
  line([[-300, 760], [2300, 760]], 10, '#2a2020'); g.drawImage(TEX.floorFront, -300, 1010, 2600, 600);
  // your door
  rr(380, 120, 420, 900, 6); fs('#2a1c18', 0); rr(400, 140, 380, 880, 4); fs(lg(400, 0, 780, 0, ['#6a4632', '#8a5e44', '#5a3a2a']), 6);
  for (const [yy, hh] of [[180, 320], [560, 400]]) { rr(440, yy, 300, hh, 6); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 6; g.stroke(); rr(444, yy + 4, 300, hh, 6); g.strokeStyle = 'rgba(255,220,180,.12)'; g.lineWidth = 2; g.stroke(); }
  circ(735, 600, 16, rg(730, 595, 2, 16, ['#f0dca0', '#806830'])); circ(735, 600, 16, OL, 3);
  g.fillStyle = 'rgba(255,200,140,.5)'; g.fillRect(400, 1012, 380, 6);
  // photos
  for (const [px, py, pw2, ph2, c1] of [[930, 220, 180, 230, '#6a8ab0'], [1150, 260, 150, 190, '#b07a6a'], [1000, 500, 220, 160, '#7aa07a']]) { cshadow(px + pw2 / 2 + 8, py + ph2 / 2 + 10, pw2 * .6, ph2 * .6, .4); rr(px, py, pw2, ph2, 4); fs('#b8a070', 4); rr(px + 12, py + 12, pw2 - 24, ph2 - 24, 2); fs(lg(0, py, 0, py + ph2, [c1, '#2a2a3a']), 2); circ(px + pw2 * .4, py + ph2 * .55, pw2 * .14, 'rgba(240,210,180,.7)'); circ(px + pw2 * .65, py + ph2 * .6, pw2 * .11, 'rgba(240,210,180,.6)'); }
  // console table and lamp
  rr(1520, 700, 380, 26, 6); fs('#5a3a2a', 4); for (const lx2 of [1540, 1860]) { rr(lx2, 724, 18, 290, 4); fs('#3a2418', 3); }
  ell(1700, 700, 46, 12); fs('#c9c2b6', 3); rr(1684, 600, 32, 100, 12); fs(lg(1684, 0, 1716, 0, ['#e6dfd2', '#8c857a']), 4);
  path([[1610, 600], [1790, 600], [1752, 480], [1648, 480]]); g.closePath(); fs(lg(1610, 0, 1790, 0, ['#ffd28a', '#f0b060', '#b87a3a']), 5);
  L(1700, 560, 900, C.amb, 1, .3); L(590, 1040, 300, '255,200,140', .5, .1); L(1000, 400, 900, null, .35);
  return () => { back_(); path([[1610, 600], [1790, 600], [1752, 480], [1648, 480]]); g.closePath(); g.fillStyle = 'rgba(255,236,190,.7)'; g.fill(); glow(1700, 560, 260, C.warm, .5); beam([[1610, 600], [1790, 600], [1960, 1010], [1440, 1010]], 1700, 600, 1700, 1010, C.amb, .14); motes(1200, 300, 1900, 1000, 26, t, C.warm, .5, 2); };
}
// the kitchen: plaster wall, a window of morning sun, cabinets, the stove, the fridge, the breakfast table under a pendant lamp
function kitchenSet(t) {
  const back_ = keep();
  g.drawImage(TEX.plaster, -340, -200);
  // window
  g.save(); rr(210, 110, 500, 430, 8); g.clip(); g.fillStyle = lg(0, 110, 0, 540, ['#7aa8d8', '#cfe0ea', '#ffd8a8']); g.fillRect(210, 110, 500, 430); glow(300, 170, 380, '255,240,200', .9);
  g.drawImage(TEX.city, 200, 300, 1400, 600, 160, 380, 600, 260); curve([700, 160], [520, 210], [380, 150], 14, '#3a2e24'); for (let k = 0; k < 9; k++) { ell(400 + k * 34, 160 + Math.sin(k) * 24, 26, 12, k); g.fillStyle = k % 2 ? '#4a6a3a' : '#3a5a2e'; g.fill(); } g.restore();
  rr(210, 110, 500, 430, 8); g.strokeStyle = OL; g.lineWidth = 28; g.stroke(); g.strokeStyle = '#f0e8da'; g.lineWidth = 18; g.stroke(); line([[460, 110], [460, 540]], 14, '#f0e8da'); line([[210, 325], [710, 325]], 12, '#f0e8da');
  rr(180, 540, 560, 30, 6); fs('#e8dccb', 4); for (let k = 0; k < 3; k++) { rr(240 + k * 150, 490, 60, 50, 10); fs(['#b46a48', '#6a8a5a', '#c49a45'][k], 3); for (let j = 0; j < 4; j++) curve([270 + k * 150, 492], [270 + k * 150 + (j - 1.5) * 14, 462], [270 + k * 150 + (j - 1.5) * 22, 446], 5, '#3b6a48'); }
  // fridge
  rr(770, 90, 210, 880, 22); fs(lg(770, 0, 980, 0, ['#c4ccd2', '#eef2f4', '#a8b0b6']), 6); line([[775, 400], [975, 400]], 5, 'rgba(0,0,0,.35)'); for (const yy of [200, 470]) { rr(940, yy, 14, 140, 6); fs('#8a9298', 3); }
  rr(800, 470, 110, 90, 4); fs('#f8f4e8', 3); for (let k = 0; k < 3; k++) circ(830 + k * 26, 505, 10, ['#e05050', '#50a0e0', '#e0c040'][k]); line([[815, 540], [895, 535]], 4, '#50a050');
  // cabinets, hood, backsplash, counter
  for (let k = 0; k < 4; k++) { const cx0 = 1010 + k * 240; if (k === 2) continue; rr(cx0, 60, 228, 280, 8); fs(lg(cx0, 0, cx0 + 228, 0, ['#8a5a3a', '#a06a46', '#7a4e32']), 5); rr(cx0 + 22, 82, 184, 236, 6); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 5; g.stroke(); circ(cx0 + (k % 2 ? 30 : 198), 300, 8, '#d8c090'); }
  path([[1480, 60], [1720, 60], [1760, 300], [1440, 300]]); g.closePath(); fs(lg(1440, 0, 1760, 0, ['#8a9298', '#dfe4e8', '#7a8288']), 5);
  g.save(); rr(980, 380, 1400, 262, 0); g.clip(); g.drawImage(TEX.tiles, 980, 380, 1400, 262); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#f0dcc0'; g.fillRect(980, 380, 1400, 262); g.restore();
  rr(980, 640, 1400, 36, 6); fs(lg(0, 640, 0, 676, ['#e8e0d4', '#a89e90']), 5);
  for (let k = 0; k < 5; k++) { const bx = 1000 + k * 200; rr(bx, 680, 188, 290, 8); fs(lg(bx, 0, bx + 188, 0, ['#8a5a3a', '#a06a46', '#7a4e32']), 5); rr(bx + 20, 700, 148, 60, 5); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 4; g.stroke(); rr(bx + 20, 780, 148, 170, 5); g.stroke(); line([[bx + 74, 730], [bx + 114, 730]], 6, '#d8c090'); }
  // stove top, pan, kettle
  rr(1470, 620, 300, 22, 4); fs('#2a2a30', 3); ell(1560, 616, 90, 18); fs('#1a1a20', 4); rr(1640, 606, 160, 12, 6); fs('#3a3a40', 3); ell(1560, 612, 70, 12); fs('#e8e0c0', 0); circ(1540, 612, 14, '#ffc43a'); circ(1585, 610, 12, '#ffc43a');
  rr(1820, 560, 90, 80, 30); fs(lg(1820, 0, 1910, 0, ['#c84a3a', '#e8705a', '#9a3020']), 5); curve([1830, 590], [1790, 570], [1800, 545], 8, '#9a3020');
  // floor
  g.drawImage(TEX.checker, -340, 970);
  g.fillStyle = lg(0, 970, 0, 1040, ['rgba(0,0,0,.5)', 'rgba(0,0,0,0)']); g.fillRect(-340, 970, 2600, 70);
  // pendant lamp
  line([[560, -100], [560, 270]], 4, '#1a1a20'); path([[470, 360], [650, 360], [610, 270], [510, 270]]); g.closePath(); fs(lg(470, 0, 650, 0, ['#2a4a3a', '#4a7a5a', '#1e3428']), 5);
  L(380, 330, 900, '255,226,180', 1, .25); L(560, 420, 560, C.amb, .9, .22); L(1560, 640, 340, C.fire, .45, .12); L(1300, 500, 1300, null, .45);
  return () => {
    back_(); ell(560, 362, 70, 14); g.fillStyle = 'rgba(255,240,200,.9)'; g.fill(); glow(560, 370, 240, C.warm, .55);
    beam([[260, 130], [460, 130], [1100, 1040], [520, 1040]], 360, 130, 800, 1040, '255,230,190', .13); motes(300, 200, 1200, 1000, 40, t, C.warm, .5, 5);
    for (let k = 0; k < 4; k++) { const p = (t * .35 + k / 4) % 1; circ(1560 + Math.sin(t * 1.5 + k) * 20 * p, 600 - p * 260, 18 + p * 50, `rgba(255,255,255,${.12 * (1 - p)})`); }
  };
}
// the breakfast table in front of everything
function breakfastTable() {
  cshadow(560, 1030, 460, 30, .5); for (const lx2 of [220, 900]) { rr(lx2 - 12, 830, 24, 210, 6); fs('#4a2e20', 3); }
  ell(560, 820, 470, 74); fs(lg(0, 750, 0, 900, ['#f4ece0', '#c8bca8']), 6);
  g.save(); ell(560, 820, 470, 74); g.clip(); for (let k = -8; k <= 8; k++) line([[560 + k * 60, 740], [560 + k * 66, 900]], 8, 'rgba(200,90,80,.25)'); for (let j = 0; j < 3; j++) line([[60, 790 + j * 26], [1060, 790 + j * 26]], 8, 'rgba(200,90,80,.2)'); g.restore();
  g.beginPath(); g.moveTo(90, 820); g.quadraticCurveTo(560, 960, 1030, 820); g.lineTo(1020, 900); g.quadraticCurveTo(560, 1010, 100, 900); g.closePath(); fs(lg(0, 830, 0, 960, ['#e8dccb', '#b8a890']), 5);
  ell(420, 800, 90, 22); fs('#f8f4ec', 4); ell(420, 796, 60, 13); fs('#e8c070', 0); for (let k = 0; k < 5; k++) circ(395 + k * 12, 794 + (k % 2) * 4, 6, '#c88a3a');
  rr(640, 740, 54, 64, 8); fs(lg(640, 0, 694, 0, ['#5a8ad0', '#3a5a9a']), 4); curve([694, 756], [716, 772], [694, 790], 6, '#3a5a9a');
  rr(760, 730, 40, 76, 6); fs('rgba(255,190,90,.75)', 4); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(766, 736, 8, 60);
}

const S = {};
// ---------- the quiz: the question, three cards, a countdown ring, the reveal ----------
const QCOL = { q1: [AMB, C.amb], q2: [CYAN, C.cyan], q3: [MAG, C.mag], q4: [ROSE, C.rose], q5: [RED, C.red], q6: [PUR, C.pur] };
const QS = TL.lines.filter(l => l.q);
function curQ(t) { let q = QS[0]; for (const l of QS) if (l.t0 <= t + .05) q = l; return q; }
function stage(t, rgbc) {
  grad('#04050d', '#0c0f22', -200, 1300);
  g.save(); for (let k = -14; k <= 14; k++) line([[CX + k * 40, 690], [CX + k * 280, 1200]], 2, `rgba(${rgbc},.16)`); for (let j = 0; j < 9; j++) { const y = 690 + Math.pow(j / 9, 1.7) * 520; line([[-200, y], [2120, y]], 2, `rgba(${rgbc},.12)`); } g.restore();
  for (const sx of [380, 1540]) beam([[sx - 30, -60], [sx + 30, -60], [CX + (sx - CX) * .25 + 360, 1100], [CX + (sx - CX) * .25 - 360, 1100]], sx, -60, sx, 1100, rgbc, .07);
  glow(CX, 560, 1000, rgbc, .14); risers(t, 46, -60, 1980, 1150, -80, .45, 7, rgbc);
  g.save(); g.globalAlpha = .06; for (let k = 0; k < 7; k++) { const x = hash(k * 3.7) * W, y = ((hash(k * 5.1) * H - t * 20 * (1 + hash(k))) % (H + 300) + H + 300) % (H + 300) - 150; text('?', x, y, 160 + 140 * hash(k), `rgb(${rgbc})`, 'Anton'); } g.restore();
}
S.quiz = (t, u) => {
  const q = curQ(t), qi = QS.indexOf(q), [col, rgbc] = QCOL[q.id] || [AMB, C.amb];
  const idx = TL.lines.indexOf(q), cd = TL.lines.slice(idx + 1, idx + 3).find(l => l.count), rv = TL.lines.slice(idx + 1, idx + 4).find(l => l.reveal !== undefined);
  const tc0 = cd ? cd.t0 : 1e9, tc1 = cd ? cd.t1 : 1e9, trv = rv && q.ans >= 0 ? rv.t0 : 1e9, rev = t >= trv, counting = t >= tc0 && t < tc1;
  cam(CX, CY, lerp(1.06, 1, eo(seg(t, q.t0, q.t0 + 1.2))) * (counting ? 1 + .03 * seg(t, tc0, tc1) : 1));
  stage(t, rgbc); reset();
  const k0 = back(seg(t, q.t0, q.t0 + .35), 1.6), up = rev ? eo(seg(t, trv, trv + .5)) : 0;
  pill(`${TX.q} ${qi + 1}`, CX, 106 - 30 * up, 50, col, rgbc, k0 * (1 - .15 * up));
  (QT[q.id] || []).forEach((s, i) => { const a = seg(t, q.t0 + .15 + i * .12, q.t0 + .45 + i * .12); if (a <= 0) return; g.font = '74px Anton'; const sc = Math.min(1, 1640 / g.measureText(s).width) * (1 - .12 * up); g.save(); g.translate(CX, 230 + i * 88 + (1 - eo(a)) * 30 - 40 * up); g.scale(sc, sc); g.globalAlpha = a; text(s, 0, 0, 74, '#fff', 'Anton', 'center', 12); g.restore(); });
  const n = q.q.length, cw = n === 3 ? 480 : 560, gap = 70, x0 = CX - (n * cw + (n - 1) * gap) / 2, cy = 560 - 50 * up;
  q.q.forEach((s, i) => {
    const ap = back(seg(t, q.t0 + .5 + i * .2, q.t0 + .85 + i * .2), 1.7); if (ap <= 0) return;
    const ok = i === q.ans, rk = rev ? eo(seg(t, trv, trv + .35)) : 0, pulse = counting ? 1 + .02 * Math.sin((t - tc0) * TAU + i * 2) : 1;
    const sc = ap * pulse * (ok ? 1 + .07 * rk : 1 - .08 * rk), x = x0 + i * (cw + gap) + cw / 2, win = ok && rev;
    g.save(); g.translate(x, cy); g.scale(sc, sc); g.globalAlpha = ok || !rev ? 1 : 1 - .65 * rk;
    const bc = win ? GRN : col, brg = win ? C.grn : rgbc;
    glass(-cw / 2, -110, cw, 220, 30, bc, win ? 6 : 4, `rgba(${brg},${win ? 1 : .5})`);
    circ(-cw / 2 + 54, -56, 32, `rgba(${brg},.2)`); circ(-cw / 2 + 54, -56, 32, bc, 4); text('ABC'[i], -cw / 2 + 54, -53, 40, bc, 'Anton');
    g.font = '92px Anton'; const ts = Math.min(1, (cw - 150) / g.measureText(s).width);
    g.save(); g.translate(30, 16); g.scale(ts, ts); if (win) { g.shadowColor = `rgba(${C.grn},.95)`; g.shadowBlur = 30; } text(s, 0, 0, 92, win ? '#c4ffdc' : '#fff', 'Anton'); g.restore();
    if (win) { const ck = back(seg(t, trv + .15, trv + .45), 2); g.save(); g.translate(cw / 2 - 20, -100); g.scale(ck, ck); circ(0, 0, 40, GRN); line([[-17, 0], [-5, 13], [18, -14]], 9, '#06200f'); g.restore(); }
    g.restore();
    if (win) { const pk = back(seg(t, trv + .35, trv + .7), 1.8) * (1 - ss(seg(t, trv + 3.2, trv + 3.6))); pill(TX.plus, x, cy + 170, 40, GRN, C.grn, pk); }
  });
  // countdown
  if (cd && t >= tc0 - .05 && t < tc1 + .45) {
    const r_ = tc1 - t, left = Math.max(1, Math.ceil(r_ - 1e-6)), last = r_ < 1, since = Math.ceil(r_ - 1e-6) - r_, p = clamp((t - tc0) / (tc1 - tc0));
    const kk = back(seg(t, tc0 - .05, tc0 + .25), 1.8) * (1 - ss(seg(t, tc1, tc1 + .4))), cc = last ? RED : col, crg = last ? C.red : rgbc;
    g.save(); g.translate(CX, 840); g.scale(kk, kk);
    circ(0, 0, 96, 'rgba(8,10,22,.88)'); circ(0, 0, 90, 'rgba(255,255,255,.1)', 12);
    g.beginPath(); g.arc(0, 0, 90, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p)); g.strokeStyle = cc; g.lineWidth = 12; g.lineCap = 'round'; g.shadowColor = `rgba(${crg},.9)`; g.shadowBlur = 22; g.stroke(); g.shadowBlur = 0;
    const nk = 1 + .28 * (1 - eo(seg(since, 0, .25))); g.save(); g.scale(nk, nk); text(String(left), 0, 6, 112, last ? '#ff8a96' : '#fff', 'Anton'); g.restore();
    g.restore();
    if (q.ans >= 0) pill(TX.aloud, CX, 990, 36, '#fff', C.white, kk * .9);
  }
  // opinion questions: comment your answer
  if (q.ans < 0) { const tcm = Math.min(wordT(q.id, TX.cw), tc0), ck = back(seg(t, tcm, tcm + .35), 1.7); if (t >= tcm && !(cd && t >= tc0 - .05 && t < tc1 + .45)) pill(TX.comment, CX, 840, 52, col, rgbc, ck); }
  // a stat from the reveal line, under the cards
  if (rev) statCard(t, CX, 850, .95);
};

// ---------- shots ----------
// 1. the hook: dawn in your room. You wake... a voice, then another, then hundreds. Then your own name.
S.wake = (t, u) => {
  const a1 = LN.c01, tw = wordT('c01', 'wrong'), tv = wordT('c02', 'voice'), ta = wordT('c02', 'another'), th = wordT('c02', 'hundreds'), tnb = wordT('c02b', 'neighbors'), tnm = wordT('c02b', 'name'), t4 = LN.c04.t0, tth = wordT('c04', "They're"), tmid = wordT('c04', 'midnight');
  const second = t >= t4, z = !second ? (t < LN.c02.t0 ? lerp(1.12, 1.3, ss(seg(t, a1.t0, tw + .5))) : lerp(1.3, 1.42, ss(seg(t, LN.c02.t0, LN.c02b.t1)))) : lerp(1.14, 1.28, ss(seg(t, t4, LN.c04.t1)));
  const jolt = t > tw && t < tw + .7 ? 7 * (1 - seg(t, tw, tw + .7)) : 0;
  cam(second ? 420 : lerp(380, 300, ss(seg(t, a1.t0, LN.c02b.t1))), second ? 820 : 840, z, 0, jolt, t);
  const post = room(t, { sky: 'dawn', lamp: 0, clock: 6.9 });
  const hearing = t > tv;
  person(210, 1250, 560, { t, sit: 1, arms: t > tnm || second ? 'rub' : hearing ? 'lap' : 'lap', eyes: t > tw ? 'wide' : 'open', look: t > tnm && !second ? -.8 : t > tv ? .7 * Math.sin(t * .9) : .2, lookY: -.2, tired: .35, sweat: t > th ? .5 : 0, lx: 1, rim: 'rgba(255,190,150,.55)' });
  lightPass(DIM.dawn); post();
  rings(800, 560, t, tv, C.gold, 3, 360); rings(-200, 700, t, ta, C.cyan, 3, 500); if (t > th) for (let k = 0; k < 4; k++) rings(-300 + k * 500, 300 + (k % 2) * 500, t, th + k * .15, BCOL[k], 2, 600);
  if (!second) {
    murmur(780, 470, 30, FRAG[3], ss(seg(t, tv, tv + .3)) * (1 - .6 * seg(t, th, th + .6)), C.gold);
    murmur(-60, 640, 30, FRAG[0], ss(seg(t, ta, ta + .3)) * (1 - .6 * seg(t, th, th + .6)), C.cyan);
    swarm(t, 36, -400, 280, 1200, 1300, (1 - .55 * seg(t, tnb, tnb + 1)), { t0: th - .1, rate: .045, seed: 4, avoid: [210, 760, 230] });
    if (t > tnm - .25) { const k = back(seg(t, tnm - .25, tnm + .15), 1.6); reset(); bubble(1250, 250, [TX.name], 1, { size: 64, col: C.gold, k, tx: 1500, ty: 420, seed: 2, ink: GOLD }); }
  } else {
    swarm(t, 44, -350, 260, 1250, 1300, ss(seg(t, t4, t4 + .6)), { t0: t4 - 2, rate: .02, seed: 9, s0: 26, s1: 40, avoid: [210, 760, 250] });
    if (t > tth) { const p = seg(t, tth, tth + .9); g.save(); g.globalCompositeOperation = 'screen'; circ(210, 760, 60 + 900 * eo(p), `rgba(${C.gold},${.35 * (1 - p)})`, 18); g.restore(); }
    reset(); pill(TX.until, CX, 150, 52, GOLD, C.gold, back(seg(t, tmid, tmid + .35), 1.7));
  }
};
// 2. a voice that never spoke out loud: your mom outside your door
S.mom = (t, u) => {
  const l = LN.c03;
  cam(lerp(1080, 1180, ss(seg(t, l.t0, l.t1 + .6))), 560, lerp(1.02, 1.14, ss(seg(t, l.t0 - .3, l.t1 + .6))));
  const post = hallway(t);
  person(1240, 1020, 800, { t, hood: MOMC, legs: JEANC, longHair: 1, hair: HAIRS[1], arms: 'down', eyes: 'open', look: -.9, lookY: .1, tired: .45, lx: 1, skin: SKINS[1], rim: 'rgba(255,200,150,.5)' });
  lightPass('#5a4256'); post();
  thought('c03', t, 880, 220, { tx: 1170, ty: 330, col: C.amb, size: 52, maxw: 520, seed: 1 });
  tag(TX.mom, 1470, 330, AMB, C.amb, back(seg(t, l.t0 + .2, l.t0 + .5), 1.8) * (1 - seg(t, l.t1 - .2, l.t1 + .2)), 40);
};
// 3. the promise: the whole city waking, thoughts rising from every window; a locked secret; play along
S.promise = (t, u) => {
  const tse = wordT('c05', 'secret'), tfo = wordT('c05', 'forever'), t6 = LN.c06.t0, tti = wordT('c06', 'timer'), tpo = wordT('c06', 'point');
  cam(CX, lerp(520, 470, ss(seg(u, 0, 8))), lerp(1.12, 1.0, eo(seg(u, 0, 2.5))) * (t > t6 ? 1 + .05 * seg(t, t6, LN.c06.t1) : 1));
  const post = cityView(t, { orbs: 1, n: 90 });
  lightPass('#5a4a78'); post();
  // the secret: a golden bubble with a lock
  const sk = back(seg(t, tse - .2, tse + .3), 1.5) * (1 - ss(seg(t, t6 + .3, t6 + .8)));
  if (sk > 0) {
    const sy = 430 + Math.sin(t * 1.2) * 8, gl = t > tfo ? .6 + .4 * Math.sin((t - tfo) * 5) : .5;
    bubble(CX, sy, [], 0, { size: 90, pw: 260, ph: 200, col: C.gold, k: sk, seed: 5, pic: (x, y) => {
      g.save(); g.translate(x, y); g.shadowColor = `rgba(${C.gold},${gl})`; g.shadowBlur = 40; rr(-70, -10, 140, 110, 18); fs(lg(-70, 0, 70, 0, ['#e8b84a', '#ffe08a', '#b8842a']), 5); g.beginPath(); g.arc(0, -10, 46, Math.PI, 0); g.strokeStyle = '#d8a84a'; g.lineWidth = 18; g.stroke(); g.shadowBlur = 0;
      circ(0, 34, 14, '#3a2a10'); rr(-5, 34, 10, 34, 4); g.fillStyle = '#3a2a10'; g.fill(); g.restore(); } });
    reset(); pill(TX.secret, CX, 690, 44, GOLD, C.gold, back(seg(t, tse, tse + .35), 1.7) * (1 - ss(seg(t, t6, t6 + .4))));
  }
  // play along: the ring timer and +1 point
  const c7 = LN.c07, out7 = c7 ? 1 - ss(seg(t, c7.t0, c7.t0 + .4)) : 1;
  if (t > t6 && out7 > 0) {
    reset(); const pk = back(seg(t, t6 + .1, t6 + .45), 1.6) * out7; pill(TX.play, CX, 220, 70, GOLD, C.gold, pk);
    const rk = back(seg(t, tti - .3, tti + .1), 1.7) * out7; if (rk > 0) { const p = clamp((t - tti) / 3.5); g.save(); g.translate(CX - 240, 560); g.scale(rk, rk); circ(0, 0, 96, 'rgba(8,10,22,.88)'); circ(0, 0, 90, 'rgba(255,255,255,.1)', 12); g.beginPath(); g.arc(0, 0, 90, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p)); g.strokeStyle = AMB; g.lineWidth = 12; g.lineCap = 'round'; g.stroke(); text(String(Math.max(1, 5 - Math.floor(p * 5))), 0, 6, 110, '#fff', 'Anton'); g.restore(); }
    const ok = back(seg(t, tpo - .2, tpo + .2), 1.8) * out7; if (ok > 0) { g.save(); g.translate(CX + 240, 560); g.scale(ok, ok); glass(-190, -96, 380, 192, 40, GRN, 5, `rgba(${C.grn},.9)`); g.save(); g.shadowColor = `rgba(${C.grn},.9)`; g.shadowBlur = 26; text(TX.plus, 0, 6, 76, '#c4ffdc', 'Anton'); g.restore(); g.restore(); }
  }
  // ...but one thought you'll wish you never heard
  if (c7 && t > c7.t0 - .1) { reset(); const dk = ss(seg(t, c7.t0, c7.t0 + .8)); g.fillStyle = `rgba(28,0,10,${.5 * dk})`; g.fillRect(0, 0, W, H);
    const tt7 = wordT('c07', 'thought'), k = back(seg(t, tt7 - .3, tt7 + .1), 1.5); bubble(CX, 430, ['. . .'], 1, { size: 90, col: C.red, k, seed: 9, glowA: .6 + .4 * Math.sin(t * 6), ink: '#ff9aa6' }); }
};
// 4. the title, inside a thought
S.title = (t, u) => {
  cam(CX, 500, lerp(1.0, 1.06, seg(u, 0, 3.2)));
  const post = cityView(t, { night: 1, orbs: 1, n: 120 });
  lightPass('#3a3264'); post();
  reset(); const k = back(seg(u, .0, .4), 1.4), z = 1 + .02 * Math.sin(t * 2.4);
  g.save(); g.translate(CX, 470); g.scale(k * z, k * z);
  for (let i = 0; i < 3; i++) { const r = 34 - i * 9, px = -30 - i * 60, py = 330 + i * 70; circ(px, py, r, 'rgba(12,14,30,.9)'); circ(px, py, r, GOLD, 4); }
  cloud(0, 0, 1460, 520, 3); g.fillStyle = 'rgba(10,12,28,.9)'; g.fill(); g.save(); g.shadowColor = `rgba(${C.gold},1)`; g.shadowBlur = 40; g.strokeStyle = GOLD; g.lineWidth = 7; g.stroke(); g.restore();
  g.save(); cloud(0, 0, 1460, 520, 3); g.clip(); g.fillStyle = rg(-300, -250, 0, 900, [`rgba(${C.gold},.25)`, `rgba(${C.gold},0)`]); g.fillRect(-800, -300, 1600, 600); g.restore();
  g.font = '96px Anton'; const s1 = Math.min(1, 1150 / g.measureText(TX.t1).width); g.font = '150px Anton'; const s2 = Math.min(1, 1250 / g.measureText(TX.t2).width);
  g.save(); g.translate(0, -88); g.scale(s1, s1); text(TX.t1, 0, 0, 96, '#f4f1ea', 'Anton', 'center', 0); g.restore();
  g.save(); g.translate(0, 62); g.scale(s2, s2); g.shadowColor = 'rgba(255,190,80,.95)'; g.shadowBlur = 40; text(TX.t2, 0, 0, 150, GOLD, 'Anton', 'center', 0); g.restore();
  g.restore();
};
// 5. 7:00 AM, the kitchen: mom smiles; her head is a storm of little worries; your brother says nothing and thinks everything
S.kitchen = (t, u) => {
  const t1 = LN.h01, ts = wordT('h01', 'smiles'), t2 = LN.h02.t0, t2b = LN.h02b.t0, t2c = LN.h02c.t0, t3 = LN.h03.t0, tev = wordT('h02c', 'everything'), tlo = wordT('h03', 'loud');
  const F = [[lerp(820, 1150, ss(seg(t, t1.t0, ts))), 560, lerp(1.0, 1.18, ss(seg(t, t1.t0, ts + .5)))], [1420, 470, 1.32], [600, 560, 1.4], [700, 560, 1.15], [1250, 520, lerp(1.0, .94, ss(seg(t, t3, LN.h03.t1)))]];
  const fi = t < t2 ? 0 : t < t2b ? 1 : t < t2c ? 2 : t < t3 ? 3 : 4, fp = ss(seg(t, [t1.t0, t2, t2b, t2c, t3][fi], [t1.t0, t2, t2b, t2c, t3][fi] + .9)), A = F[Math.max(0, fi - 1)], B = F[fi];
  cam(lerp(A[0], B[0], fi ? fp : 1), lerp(A[1], B[1], fi ? fp : 1), lerp(A[2], B[2], fi ? fp : 1));
  const post = kitchenSet(t);
  person(1500, 1010, 760, { t, hood: MOMC, legs: JEANC, longHair: 1, hair: HAIRS[1], arms: 'down', eyes: 'open', smile: t > ts && t < t2 + .3 ? 1 : 0, look: t > ts ? -.6 : -.2, tired: .5, lx: -1, skin: SKINS[1], rim: 'rgba(255,214,160,.5)' });
  person(560, 1010, 640, { t, sit: 1, hood: GRNHOOD, arms: 'lap', eyes: 'open', look: .1, lookY: .7, tired: .2, lx: -1, skin: SKINS[1], hair: HAIRS[2], rim: 'rgba(255,214,160,.45)' });
  breakfastTable();
  lightPass('#5a4652'); post();
  // mom's thoughts, one small bubble per worry, all around her head
  const MP = [[1180, 180], [1790, 200], [1210, 420], [1800, 450]];
  parts('h02').forEach((pr, i) => thought('h02', t, MP[i % 4][0], MP[i % 4][1], { part: pr, tx: 1500, ty: 320, col: C.amb, size: 44, maxw: 380, seed: i, until: LN.h03.t1 + .4, a: t > t2b && t < t3 ? .35 : 1 }));
  thought('h02b', t, 880, 330, { tx: 640, ty: 450, col: C.cyan, size: 46, maxw: 440, seed: 3, until: LN.h02c.t1 + .3 });
  if (t > tev - .2) KIDF.forEach((s, i) => { const a = ss(seg(t, tev - .2 + i * .1, tev + .1 + i * .1)) * (1 - ss(seg(t, t3 + .3, t3 + .8))); const ang = -2.9 + i * .38; murmur(560 + Math.cos(ang) * 330, 470 + Math.sin(ang) * 230, 28, s, a, C.cyan); });
  if (t > tlo - .3) MOMF.forEach((s, i) => { const a = ss(seg(t, tlo - .3 + i * .07, tlo + i * .07)); const ang = -3.0 + i * .33 + Math.sin(t * .6 + i) * .05, r = 380 + 60 * hash(i); murmur(1500 + Math.cos(ang) * r, 380 + Math.sin(ang) * r * .7, 30, s, a, i % 2 ? C.amb : C.gold); });

};
const STUB = name => (t, u) => { cam(CX, CY); grad('#0a0c1e', '#1a1030'); reset(); text(name.toUpperCase(), CX, CY, 120, '#555', 'Anton'); };

// ---------- the train ----------
const RIMC = 'rgba(190,240,225,.5)';
const wi = (id, w) => { w = ANCH[`${id}:${w}`] || w; const l = LN[id]; if (!l || !l.words) return 0; const k = l.words.findIndex(v => norm(v[0]).startsWith(norm(w))); return k < 0 ? 0 : k; };
const tunnelX = (k, t) => ((t * 900 + k * 830) % 3400) - 1000;
const WINS = [[-640, -200], [-100, 420], [520, 1040], [1700, 2140]];
// the subway car, seen straight on: ceiling lights, ads, windows onto the tunnel, straps, the doors, the bench, the floor
function trainCar16(t, o = {}) {
  const { lights = 1, door = 0 } = o, back_ = keep();
  g.fillStyle = lg(0, 140, 0, 330, ['#8e9a9e', '#c4ced0']); g.fillRect(-1000, 0, 3300, 340);
  for (const lx2 of [-560, -60, 440, 940, 1440, 1940]) { rr(lx2 - 170, 200, 340, 38, 14); fs('#dfe9e6', 4); }
  g.fillStyle = lg(0, 330, 0, 1240, ['#c9d2d4', '#9aa6aa']); g.fillRect(-1000, 330, 3300, 920);
  line([[-1000, 336], [2300, 336]], 6, 'rgba(0,0,0,.35)');
  const ads = [['#24406a', '#e8b84a'], ['#5a2440', '#f0e0d0'], ['#1e4a3e', '#ffd28a'], ['#3a2a5a', '#7ad0e8']];
  for (let k = 0; k < 8; k++) { const ax = -800 + k * 400; if (ax > 1000 && ax < 1600) continue; rr(ax, 375, 330, 120, 8); fs(lg(ax, 0, ax + 330, 0, [ads[k % 4][0], '#101420']), 4); circ(ax + 70, 435, 38, ads[k % 4][1]); for (const [yy, ww, aa] of [[405, 170, .75], [432, 120, .45], [452, 140, .35]]) { rr(ax + 130, yy, ww, yy === 405 ? 16 : 11, 5); g.fillStyle = `rgba(255,255,255,${aa})`; g.fill(); } }
  line([[-1000, 535], [2300, 535]], 14, OL); line([[-1000, 533], [2300, 533]], 8, '#c8ccd2'); line([[-1000, 530], [2300, 530]], 2, 'rgba(255,255,255,.7)');
  for (let k = 0; k < 25; k++) { const sx = -900 + k * 130, a = .14 * Math.sin(t * 1.4 + k * .35) + .05 * Math.sin(t * 3.1 + k); g.save(); g.translate(sx, 538); g.rotate(a); line([[0, 0], [0, 70]], 10, '#2a2c36'); circ(0, 92, 22, OL, 12); circ(0, 92, 22, '#d8dade', 7); g.restore(); }
  for (const [wx0, wx1] of WINS) {
    g.save(); rr(wx0, 570, wx1 - wx0, 300, 26); g.clip();
    g.fillStyle = lg(0, 570, 0, 870, ['#05070c', '#0e1218']); g.fillRect(wx0, 570, wx1 - wx0, 300);
    for (let k = 0; k < 7; k++) { const yy = 610 + k * 38, off = (t * 1600 + k * 300) % 400; line([[wx0 - off, yy], [wx1, yy]], 2, 'rgba(120,140,150,.12)'); }
    for (let k = 0; k < 4; k++) { const sx = tunnelX(k, t); if (sx > wx0 - 300 && sx < wx1 + 300) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = lg(sx - 260, 0, sx + 40, 0, ['rgba(180,230,255,0)', 'rgba(220,245,255,.9)']); rr(sx - 260, 660, 300, 14, 7); g.fill(); g.restore(); } }
    g.globalAlpha = .12; g.fillStyle = '#c9d2d4'; g.fillRect(wx0, 790, wx1 - wx0, 80); g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,255,255,.04)'; path([[wx0 + 30, 570], [wx0 + 110, 570], [wx0 + 30, 870], [wx0 - 50, 870]]); g.closePath(); g.fill();
    g.restore();
    rr(wx0, 570, wx1 - wx0, 300, 26); g.strokeStyle = OL; g.lineWidth = 22; g.stroke(); g.strokeStyle = '#a8b0b6'; g.lineWidth = 13; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.stroke();
  }
  // the doors: a lit platform outside when open, two panels sliding into the wall
  g.save(); rr(1120, 380, 470, 980, 10); g.clip();
  g.drawImage(TEX.tiles, 1100, 380, 520, 600); g.fillStyle = '#2a2c34'; g.fillRect(1100, 980, 520, 400); g.fillStyle = '#c8a82a'; g.fillRect(1100, 980, 520, 18);
  for (const sg of [-1, 1]) { const x0 = sg < 0 ? 1120 - 235 * door : 1355 + 235 * door; rr(x0, 380, 235, 980, 6); fs(lg(x0, 0, x0 + 235, 0, ['#b8c0c6', '#e8ecef', '#9aa2a8']), 6); rr(x0 + 40, 470, 155, 330, 14); fs('rgba(20,26,30,.85)', 5); line([[sg < 0 ? x0 + 235 : x0, 380], [sg < 0 ? x0 + 235 : x0, 1360]], 10, '#1a1c22'); }
  g.restore();
  rr(1120, 380, 470, 980, 10); g.strokeStyle = OL; g.lineWidth = 18; g.stroke(); g.strokeStyle = '#8a929a'; g.lineWidth = 10; g.stroke();
  for (let k = 0; k < 10; k++) { const bx = -980 + k * 220; if (bx + 212 > 1110 && bx < 1600) continue; rr(bx, 960, 212, 290, 24); fs(lg(bx, 0, bx + 212, 0, ['#3a6ea0', '#28507a', '#1a3656']), 5); line([[bx + 20, 1000], [bx + 192, 1000]], 3, 'rgba(255,255,255,.12)'); for (let j = 0; j < 4; j++) line([[bx + 30, 1040 + j * 50], [bx + 182, 1040 + j * 50]], 2, 'rgba(0,0,0,.18)'); }
  for (const [s0, s1] of [[-1000, 1110], [1600, 2300]]) { rr(s0, 1240, s1 - s0, 56, 16); fs(lg(0, 1240, 0, 1296, ['#3f78ac', '#1e3a5c']), 5); g.fillStyle = '#20242c'; g.fillRect(s0, 1296, s1 - s0, 60); }
  g.drawImage(TEX.lino, -1000, 1356, 3300, 800); g.fillStyle = lg(0, 1356, 0, 1460, ['rgba(0,0,0,.55)', 'rgba(0,0,0,0)']); g.fillRect(-1000, 1356, 3300, 104);
  for (const px of [-700, 1100, 1610]) { line([[px, 60], [px, 2100]], 34, OL); g.fillStyle = lg(px - 13, 0, px + 13, 0, ['#8a9098', '#f4f6f8', '#6a7078']); g.fillRect(px - 13, 60, 26, 2040); }
  L(560, 250, 1400, C.fluo, .95 * lights, .12 * lights); L(560, 1000, 1100, null, .55 * lights); if (door > 0) L(1355, 700, 500, C.fluo, .8 * door, .1);
  for (let k = 0; k < 4; k++) { const sx = tunnelX(k, t); if (sx > -700 && sx < 2200) L(sx - 100, 700, 300, '190,230,255', .5, .1); }
  return () => { back_(); for (const lx2 of [-560, -60, 440, 940, 1440, 1940]) { rr(lx2 - 160, 206, 320, 26, 10); g.fillStyle = `rgba(240,255,250,${.35 + .6 * lights})`; g.fill(); glow(lx2, 219, 260, C.fluo, .3 * lights); } };
}
const PAX = [
  { x: -300, hood: TOPS[0], skin: SKINS[1], hair: HAIRS[0], longHair: 1, arms: 'phone', look: .8 },
  { x: 0, hood: TOPS[3], skin: SKINS[0], hair: HAIRS[3], arms: 'lap', tired: .65 },
  { x: 300, hood: TOPS[2], skin: SKINS[2], hair: HAIRS[2], longHair: 1, arms: 'lap', look: .3 },
  { x: 600, outfit: 'shirt', hood: SHIRT, legs: SUIT, skin: SKINS[3], hair: HAIRS[2], arms: 'lap', look: -.5 },
  { x: 900, hood: TOPS[1], skin: SKINS[0], hair: HAIRS[1], arms: 'phone', look: -.8 },
];
const STAND = { x: 1355, hood: TOPS[5], skin: SKINS[2], hair: HAIRS[1], longHair: 1 };
function passengers16(t, o = {}) {
  const { look = [], standLook = -.2, standLookY = 0, smile = 0 } = o;
  PAX.forEach((p, i) => person(p.x, 1396, 600, { t: t + i * 1.3, sit: 1, ...p, eyes: 'open', tired: p.tired || .2, lx: p.x < 600 ? 1 : -1, rim: RIMC, look: look[i] ?? p.look ?? 0 }));
  person(STAND.x, 1440, 860, { t: t + 4, ...STAND, arms: 'down', eyes: 'open', look: standLook, lookY: standLookY, smile, tired: .2, lx: -1, rim: RIMC });
}
const HEAD = i => i < 5 ? [PAX[i].x, 880] : [STAND.x, 640];
// little pictures inside the drifting bubbles
const PICS = {
  beach: (x, y, w, h) => { g.save(); g.translate(x, y); rr(-w / 2, -h / 2, w, h, 14); g.clip(); g.fillStyle = lg(0, -h / 2, 0, h / 2, ['#5ab0e8', '#cfeaf2']); g.fillRect(-w / 2, -h / 2, w, h); circ(w * .25, -h * .15, h * .17, '#ffe07a'); g.fillStyle = '#2a8ac0'; g.fillRect(-w / 2, h * .05, w, h * .2); g.fillStyle = '#f0d8a0'; g.fillRect(-w / 2, h * .25, w, h * .3); curve([-w * .3, h * .3], [-w * .32, -h * .05], [-w * .22, -h * .25], 6, '#7a5030'); for (let k = 0; k < 5; k++) curve([-w * .22, -h * .25], [-w * .22 + Math.cos(k * 1.2) * w * .12, -h * .4], [-w * .22 + Math.cos(k * 1.25) * w * .2, -h * .2 + Math.sin(k) * h * .05], 6, '#3a8a3a'); g.restore(); },
  pizza: (x, y, w, h) => { g.save(); g.translate(x, y); path([[-w * .35, -h * .35], [w * .35, -h * .35], [0, h * .42]]); g.closePath(); fs('#f2c25a', 4); line([[-w * .37, -h * .36], [w * .37, -h * .36]], 14, '#c8843a'); for (const [a, b] of [[-.12, -.15], [.12, -.12], [0, .1], [-.05, -.02]]) circ(a * w, b * h, h * .07, '#c8302a'); g.restore(); },
  dog: (x, y, w, h) => { g.save(); g.translate(x, y); const r = h * .36; for (const sg of [-1, 1]) { ell(sg * r * .95, -r * .1, r * .32, r * .62, sg * .3); fs('#7a4a2a', 3); } circ(0, 0, r, '#c8945a'); circ(0, 0, r, OL, 3); ell(0, r * .35, r * .48, r * .36); fs('#f0dcc0', 3); ell(0, r * .2, r * .17, r * .12); fs('#1a1010', 0); for (const sg of [-1, 1]) { circ(sg * r * .38, -r * .15, r * .12, '#1a1010'); circ(sg * r * .38 - 2, -r * .19, r * .04, '#fff'); } ell(0, r * .62, r * .12, r * .14); fs('#e86a7a', 2); g.restore(); },
  heart: (x, y, w, h) => { g.save(); g.translate(x, y); const s = h * .4; g.beginPath(); g.moveTo(0, s * .9); g.bezierCurveTo(-s * 1.6, -s * .2, -s * .6, -s * 1.3, 0, -s * .45); g.bezierCurveTo(s * .6, -s * 1.3, s * 1.6, -s * .2, 0, s * .9); g.closePath(); g.shadowColor = 'rgba(255,80,120,.9)'; g.shadowBlur = 20; fs('#ff5a86', 4); g.restore(); },
  plane: (x, y, w, h) => { g.save(); g.translate(x, y); g.rotate(-.25); ell(0, 0, w * .38, h * .1); fs('#e8ecf0', 3); path([[-w * .05, 0], [-w * .2, -h * .38], [w * .05, -h * .38], [w * .12, 0]]); g.closePath(); fs('#c8d0d8', 3); path([[-w * .3, 0], [-w * .38, -h * .2], [-w * .28, -h * .2], [-w * .2, 0]]); g.closePath(); fs('#c8d0d8', 3); for (let k = 0; k < 4; k++) circ(w * (.05 + k * .07), -h * .02, 4, '#5a8ac0'); g.restore(); for (let k = 0; k < 3; k++) circ(x - w * .42 - k * 18, y + h * .14 + k * 6, 5 - k, 'rgba(255,255,255,.6)'); },
};
function coin(x, y, r, spin, k = 1, win = 0) {
  if (k <= 0) return; const c = Math.cos(spin), sx = Math.max(.05, Math.abs(c)), front = c >= 0;
  g.save(); g.translate(x, y); g.scale(k, k);
  g.save(); g.scale(sx, 1); circ(-6 * Math.sign(c || 1), 6, r, '#8a5a10'); circ(0, 0, r, rg(-r * .3, -r * .3, r * .1, r, front ? ['#fff0b0', '#f0c050', '#b07a18'] : ['#e8f0f8', '#b8c4d0', '#6a7888'])); circ(0, 0, r, OL, 6); circ(0, 0, r * .82, front ? 'rgba(120,80,10,.5)' : 'rgba(40,50,70,.5)', 5);
  text(front ? TX.here : TX.away, 0, 6, r * (front ? .44 : .3), front ? '#5a3a0a' : '#2a3448', 'Anton'); g.restore();
  if (win) { g.save(); g.globalCompositeOperation = 'screen'; glow(0, 0, r * 2.2, C.grn, .5 * win); g.restore(); }
  g.restore();
}
// 6. 8:00 AM, the packed train. The doors close... (and later: one thought out of hundreds is about you: "nice shoes")
S.train = (t, u) => {
  const t1 = LN.t01, tcl = wordT('t01', 'close'), b = LN.t03b, c = LN.t03c, d = LN.t03d, tnv = wordT('t03d', 'Most');
  const doorP = t < b.t0 ? 1 - ss(seg(t, tcl - .1, tcl + .5)) : 0;
  let cx = 560, cy = 880, z = lerp(1.08, 1.0, eo(seg(t, t1.t0, t1.t0 + 2)));
  if (t >= b.t0) { const k1 = ss(seg(t, b.t0 + .3, b.t1)), k2 = ss(seg(t, c.t0 - .2, c.t0 + .6)), k3 = ss(seg(t, d.t0 + .2, d.t0 + 1.2)); cx = lerp(lerp(560, 1150, k1), 1000, k2 * (1 - k3)); cy = lerp(lerp(880, 760, k1), 1040, k2 * (1 - k3)); z = lerp(lerp(1.0, 1.25, k1), .95, k2); if (k3 > 0) { cx = lerp(cx, 1150, k3); cy = lerp(cy, 780, k3); z = lerp(z, 1.3, k3); } }
  cam(cx, cy, z, 0, t > tcl && t < tcl + .5 ? 3 * (1 - seg(t, tcl, tcl + .5)) : 0, t);
  const post = trainCar16(t, { door: doorP });
  passengers16(t, { standLook: t > c.t0 - .3 && t < d.t0 + .6 ? -.2 : t > d.t0 ? -.8 : -.2, standLookY: t > c.t0 - .3 && t < d.t0 + .6 ? .9 : 0, smile: t > d.t0 ? 1 : 0 });
  if (t > c.t0 - 1) for (const [sx, sy, sg] of [[860, 1500, -1], [1080, 1515, 1]]) { g.save(); g.translate(sx, sy); g.scale(sg, 1); shoe(0, 0, 120, ['#e85a5a', '#9a2a2a']); g.restore(); }
  L(560, 950, 300, null, .3);
  lightPass('#2c3a48'); post();
  // one thought out of hundreds: the others fade, hers stays
  if (t >= b.t0) swarm(t, 30, -500, 300, 1700, 1100, .5 * (1 - ss(seg(t, b.t0 + .8, b.t1))), { seed: 11, s0: 22, s1: 30 });
  thought('t03c', t, 1040, 640, { tx: 1290, ty: 640, col: C.rose, size: 56, maxw: 400, seed: 6, until: d.t0 + 2.2 });
  // the compliments nobody says out loud
  if (t > tnv - .3) COMPL.forEach((s, i) => { const on = tnv - .3 + i * .18, p = seg(t, on, on + 2.4); if (p <= 0 || p >= 1) return; murmur(800 + (hash(i * 3.1) - .5) * 1000, 820 - (hash(i * 5.3) - .5) * 360 - p * 60, 30, s, Math.sin(Math.PI * p) * .9, C.rose); });

};
// 7. the doors close and the car fills with thoughts: everyone's own little crisis. Then a wall of noise.
const NOISEMAP = [[3, 600, 700], [3, 660, 560], [0, -300, 700], [4, 900, 560], [2, 300, 560], [1, 0, 700]];
S.noise = (t, u) => {
  const a = LN.t02, b = LN.t03, tw = wordT('t03', 'noise'), tst = wordT('t03', 'slowly');
  const z = t < b.t0 ? lerp(1.0, 1.04, seg(t, a.t0, a.t1)) : lerp(1.04, .9, ss(seg(t, b.t0, tw + .8)));
  cam(560, lerp(860, 840, seg(t, b.t0, b.t1)), z * (t > tst ? 1 + .12 * ss(seg(t, tst, b.t1 + .3)) : 1));
  const post = trainCar16(t);
  passengers16(t, { look: [.9 * Math.sin(t * .7), -.3, .5, -.2 + .4 * Math.sin(t * 1.3), -.8] });
  L(560, 950, 300, null, .3);
  lightPass('#2c3a48'); post();
  parts('t02').forEach((pr, i) => { const [pi, x, y] = NOISEMAP[i] || NOISEMAP[0], [hx, hy] = HEAD(pi); thought('t02', t, x, y, { part: pr, tx: hx, ty: hy, col: BCOL[i % BCOL.length], size: 42, maxw: 330, seed: i, until: b.t1 + .2, a: t > tw ? .55 : 1 }); });
  swarm(t, 60, -700, 250, 1800, 1250, ss(seg(t, tw - .3, tw + .3)) * (1 - .6 * ss(seg(t, tst, tst + 1))), { t0: tw - .4, rate: .025, seed: 2, s0: 24, s1: 38 });
};
// 8. their minds aren't even on the train: beaches, dogs, pizza... and a coin: is yours still here?
const DRIFT = [['beach', -300, 660], ['dog', 0, 760], ['pizza', 300, 660], ['plane', 600, 760], ['heart', 900, 660]];
S.drift = (t, u) => {
  const a = LN.t04, b = LN.t05, tff = wordT('t05', 'fifty'), tst = wordT('t05', 'Still'), tgo = wordT('t05', 'Good');
  cam(lerp(500, 560, seg(u, 0, 6)), 850, lerp(1.05, .98, ss(seg(t, a.t0, a.t1))));
  const post = trainCar16(t);
  passengers16(t, { look: [.2, -.1, .3, -.2, .1] });
  L(560, 950, 300, null, .3);
  lightPass('#2c3a48'); post();
  DRIFT.forEach(([pic, x, y], i) => { const on = a.t0 + .4 + i * .35, k = back(seg(t, on, on + .4), 1.6), al = ss(seg(t, on, on + .3)) * (1 - .7 * ss(seg(t, b.t0, b.t0 + .6))); if (al <= 0) return; const [hx, hy] = HEAD(i); bubble(x, y + Math.sin(t * 1.2 + i) * 6, [], 0, { pic: PICS[pic], pw: 170, ph: 120, size: 34, col: BCOL[i], k, a: al, tx: hx, ty: hy, seed: i }); });
  if (t > b.t0) {
    reset(); g.fillStyle = `rgba(4,5,14,${.6 * ss(seg(t, b.t0, b.t0 + .5))})`; g.fillRect(0, 0, W, H);
    const k = back(seg(t, tff - .3, tff + .1), 1.6), toss = seg(t, tff, tst + .2), y = 470 - Math.sin(Math.PI * toss) * 180, spin = toss < 1 ? toss * 9 * TAU + .3 : 0;
    coin(CX, y, 170, spin, k, t > tgo ? ss(seg(t, tgo, tgo + .3)) : 0);
    if (t > tgo) { const ck = back(seg(t, tgo, tgo + .3), 2); g.save(); g.translate(CX + 150, 330); g.scale(ck, ck); circ(0, 0, 44, GRN); line([[-19, 0], [-6, 14], [20, -15]], 10, '#06200f'); g.restore(); }
  }
};
// ---------- the white bear: a snowy forest at night ----------
function pine(x, y, h, col, snow = .7) {
  line([[x, y], [x, y - h * .15]], h * .05, '#1a1210');
  for (let k = 0; k < 5; k++) { const yy = y - h * (.12 + k * .17), w = h * (.36 - k * .06); path([[x - w, yy], [x, yy - h * .3], [x + w, yy]]); g.closePath(); g.fillStyle = col; g.fill(); if (snow) { path([[x - w * .5, yy - h * .15], [x, yy - h * .3], [x + w * .5, yy - h * .15], [x + w * .2, yy - h * .12], [x, yy - h * .17], [x - w * .25, yy - h * .12]]); g.closePath(); g.fillStyle = `rgba(230,240,255,${snow})`; g.fill(); } }
}
function polarBear(x, y, s, t, o = {}) {
  const { tilt = 0, a = 1 } = o; if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y);
  const FUR = ['#f6f3ea', '#d8d4c8', '#a8a49a'];
  cshadow(0, 0, s * .6, s * .08, .45);
  for (const sg of [-1, 1]) { ell(sg * s * .32, -s * .18, s * .26, s * .2); fs(lg(sg * s * .1, 0, sg * s * .6, 0, FUR), s * .012); }
  ell(0, -s * .5, s * .46, s * .5); fs(rg(-s * .12, -s * .7, s * .05, s * .62, FUR), s * .012);
  for (let k = 0; k < 40; k++) { const a_ = hash(k) * TAU, r = s * (.15 + .3 * hash(k * 3)), px = Math.cos(a_) * r, py = -s * .5 + Math.sin(a_) * r * 1.05; line([[px, py], [px + Math.cos(a_ + 1.2) * s * .03, py + s * .04]], s * .007, 'rgba(120,120,130,.35)'); }
  for (const sg of [-1, 1]) { rr(sg * s * .18 - s * .1, -s * .45, s * .2, s * .42, s * .1); fs(lg(sg * s * .08, 0, sg * s * .3, 0, FUR), s * .012); ell(sg * s * .18, -s * .03, s * .14, s * .07); fs(FUR[1], s * .012); for (let c = -1; c <= 1; c++) line([[sg * s * .18 + c * s * .05, -s * .05], [sg * s * .18 + c * s * .055, s * .02]], s * .012, '#3a3632'); }
  g.save(); g.translate(0, -s * 1.02); g.rotate(tilt);
  for (const sg of [-1, 1]) { circ(sg * s * .2, -s * .17, s * .075, FUR[1]); circ(sg * s * .2, -s * .17, s * .075, OL, s * .01); circ(sg * s * .2, -s * .165, s * .035, '#8a8078'); }
  ell(0, 0, s * .29, s * .25); fs(rg(-s * .08, -s * .1, s * .02, s * .32, FUR), s * .012);
  ell(0, s * .1, s * .15, s * .11); fs(rg(0, s * .06, s * .02, s * .16, ['#fffdf6', '#d8d2c4']), s * .01);
  ell(0, s * .05, s * .06, s * .042); fs('#141012', 0); circ(-s * .018, s * .036, s * .012, 'rgba(255,255,255,.7)');
  curve([0, s * .09], [0, s * .14], [0, s * .15], s * .012, '#3a3632'); curve([-s * .06, s * .17], [0, s * .2], [s * .06, s * .17], s * .012, '#3a3632');
  for (const sg of [-1, 1]) { circ(sg * s * .11, -s * .05, s * .033, '#120e10'); circ(sg * s * .11 - s * .01, -s * .06, s * .011, '#fff'); }
  g.restore(); g.restore();
}
S.bear = (t, u) => {
  const a = LN.wb1, cd = LN.wb1c, b = LN.wb2, c = LN.wb3, tch = wordT('wb1', 'challenge'), tdid = wordT('wb2', "didn't"), tpu = wordT('wb3', 'push'), tre = wordT('wb3', 'Remember');
  const show = t < cd.t0 ? 0 : t < b.t0 ? .15 + .55 * seg(t, cd.t0, cd.t1) : 1, close = ss(seg(t, b.t0, tdid + .4));
  cam(CX, lerp(560, 560, close), lerp(1.0, 1.0 + .45 * close, 1) * (t > c.t0 ? lerp(1, .82, ss(seg(t, c.t0, tpu + .5))) : 1));
  const back_ = keep();
  g.fillStyle = lg(0, -200, 0, 900, ['#02040e', '#0a1430', '#1c2c52']); g.fillRect(-600, -400, 3120, 1400);
  for (let i = 0; i < 120; i++) star(-500 + hash(i * 3.1) * 2900, -300 + hash(i * 7.3) * 700, 1.2 + 2 * hash(i), `rgba(220,235,255,${.3 + .4 * Math.sin(t * 1.4 + i)})`);
  fullMoon(1500, 150, 54);
  for (let i = 0; i < 16; i++) pine(-500 + i * 190 + 60 * hash(i), 760, 380 + 160 * hash(i * 3), '#0e1a2c', .35);
  g.fillStyle = 'rgba(150,180,220,.18)'; g.fillRect(-600, 600, 3120, 220);
  for (let i = 0; i < 11; i++) pine(-560 + i * 300 + 80 * hash(i + 9), 840, 520 + 200 * hash(i * 5), '#14243a', .55);
  g.fillStyle = lg(0, 780, 0, 1100, ['#c8d6ea', '#8ea2c2']); g.beginPath(); g.moveTo(-600, 840); for (let x = -600; x <= 2520; x += 60) g.lineTo(x, 820 + Math.sin(x * .006) * 18 + Math.sin(x * .017) * 8); g.lineTo(2520, 1400); g.lineTo(-600, 1400); g.closePath(); g.fill();
  polarBear(CX, 900, 560, t, { a: show, tilt: t > b.t0 ? .12 * Math.sin((t - b.t0) * 1.4) : 0 });
  for (const [x, h_] of [[-260, 1100], [2180, 1150], [120, 900], [1800, 950]]) pine(x, 1120, h_, '#0a1424', .5);
  L(1500, 150, 900, C.moon, .9, .2); L(CX, 700, 800, C.ice, .7 * show, .12);
  lightPass('#2a3a62'); back_();
  for (let k = 0; k < 4; k++) { const p = (t * .03 + k / 4) % 1; g.fillStyle = `rgba(200,215,240,${.12 * Math.sin(Math.PI * p)})`; ell(-400 + p * 2800, 760 + k * 50, 700, 60); g.fill(); }
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 140; i++) { const p = (hash(i * 3.3) + t * (.05 + .05 * hash(i))) % 1, x = -400 + hash(i * 7.7) * 2700 + Math.sin(t * .8 + i) * 30, y = -200 + p * 1400; circ(x, y, 1.5 + 3 * hash(i), `rgba(240,245,255,${.5 + .3 * hash(i + 2)})`); } g.restore();
  // the challenge
  reset();
  if (t > tch && t < b.t0 + .3) { const k = back(seg(t, tch, tch + .4), 1.6) * (1 - ss(seg(t, b.t0, b.t0 + .3))); g.save(); g.translate(CX, 170); g.scale(k, k); text(TX.bear[0], 0, -48, 70, '#fff', 'Anton', 'center', 12); g.save(); g.shadowColor = 'rgba(200,225,255,.95)'; g.shadowBlur = 30; text(TX.bear[1], 0, 46, 104, '#e8f2ff', 'Anton', 'center', 14); g.restore(); g.restore(); }
  if (t >= cd.t0 - .05 && t < cd.t1 + .45) { const r_ = cd.t1 - t, left = Math.max(1, Math.ceil(r_ - 1e-6)), since = Math.ceil(r_ - 1e-6) - r_, p = clamp((t - cd.t0) / (cd.t1 - cd.t0)), kk = back(seg(t, cd.t0 - .05, cd.t0 + .25), 1.8) * (1 - ss(seg(t, cd.t1, cd.t1 + .4)));
    g.save(); g.translate(CX, 830); g.scale(kk, kk); circ(0, 0, 96, 'rgba(8,10,22,.88)'); circ(0, 0, 90, 'rgba(255,255,255,.1)', 12); g.beginPath(); g.arc(0, 0, 90, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p)); g.strokeStyle = r_ < 1 ? RED : '#cfe4ff'; g.lineWidth = 12; g.lineCap = 'round'; g.shadowColor = 'rgba(200,225,255,.9)'; g.shadowBlur = 20; g.stroke(); g.shadowBlur = 0; const nk = 1 + .28 * (1 - eo(seg(since, 0, .25))); g.scale(nk, nk); text(String(left), 0, 6, 112, '#fff', 'Anton'); g.restore(); }
  // push it away... it comes back: little bear thoughts popping up again and again
  if (t > tpu - .2) for (let i = 0; i < 9; i++) { const per = 1.6, ph = ((t - tpu + i * .53) % per + per) % per, k = back(seg(ph, 0, .35), 2) * (1 - ss(seg(ph, 1.2, 1.5))), x = 260 + hash(i * 3.7) * 1400, y = 200 + hash(i * 5.3) * 520; if (t - tpu + i * .53 < 0) continue;
    bubble(x, y, [], 0, { pw: 120, ph: 110, size: 30, col: C.ice, k: k * .9, seed: i, glowA: 0, pic: (px, py) => polarBear(px, py + 50, 90, t) }); }
  if (t > tre) pill(TX.rem || 'REMEMBER THIS', CX, 150, 48, '#cfe4ff', C.ice, back(seg(t, tre, tre + .35), 1.7));
};
// ---------- the office ----------
function officeSet(t, o = {}) {
  const { boss = 1 } = o, back_ = keep();
  g.fillStyle = '#3a4050'; g.fillRect(-600, -300, 3120, 1400);
  // the window wall: a grey-blue morning city
  g.save(); rr(-500, 60, 2900, 560, 0); g.clip(); g.fillStyle = lg(0, 60, 0, 620, ['#8aa6c8', '#c8d4dc']); g.fillRect(-500, 60, 2900, 560); g.drawImage(TEX.city, 0, 100, 2400, 800, -500, 200, 2900, 560); g.fillStyle = 'rgba(200,215,230,.3)'; g.fillRect(-500, 60, 2900, 560);
  for (let y = 70; y < 330; y += 22) { g.fillStyle = 'rgba(230,236,240,.75)'; g.fillRect(-500, y, 2900, 12); } g.restore();
  for (let x = -500; x < 2500; x += 360) { g.fillStyle = '#2a2e3a'; g.fillRect(x - 10, 50, 20, 580); }
  g.fillStyle = '#2a2e3a'; g.fillRect(-600, 600, 3120, 30); g.fillStyle = '#c8ccd4'; g.fillRect(-600, 0, 3120, 56);
  for (const lx2 of [-200, 400, 1000, 1600, 2200]) { rr(lx2 - 160, 14, 320, 26, 6); fs('#f4f8fa', 3); }
  g.fillStyle = lg(0, 630, 0, 1100, ['#4a5060', '#5a6070']); g.fillRect(-600, 630, 3120, 800);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '200,210,230' : '0,0,10'},.08)`; g.fillRect(-600 + hash(i * 1.3) * 3120, 630 + hash(i * 2.9) * 470, 3, 3); }
  // the boss's glass office
  if (boss) { g.save(); g.fillStyle = 'rgba(160,200,230,.12)'; g.fillRect(1560, 120, 520, 820); g.restore(); rr(1700, 560, 280, 26, 6); fs('#5a3a2a', 4); for (const lx2 of [1715, 1950]) { rr(lx2, 584, 16, 200, 4); fs('#3a2418', 3); } rr(1880, 500, 70, 60, 8); fs('#d8d0c0', 3); }
  L(CX, 300, 1500, '220,232,255', .9, .1); L(CX, 800, 1200, null, .45);
  return () => { back_(); for (const lx2 of [-200, 400, 1000, 1600, 2200]) { glow(lx2, 27, 300, '230,240,255', .3); } if (boss) { g.save(); g.globalAlpha = .35; for (const x of [1560, 2080]) line([[x, 120], [x, 940]], 8, '#c8d8e8'); line([[1560, 120], [2080, 120]], 8, '#c8d8e8'); g.fillStyle = 'rgba(255,255,255,.07)'; path([[1600, 140], [1680, 140], [1620, 920], [1560, 920]]); g.closePath(); g.fill(); g.restore(); } };
}
function desk(x, y, w, laptop = 1, t = 0) {
  cshadow(x, y + 250, w * .55, 20, .45); rr(x - w / 2, y, w, 26, 6); fs(lg(0, y, 0, y + 26, ['#e8e2d6', '#a8a090']), 4); g.fillStyle = '#2a2e3a'; g.fillRect(x - w / 2 + 10, y + 26, w - 20, 230);
  if (laptop) { path([[x - 90, y], [x + 90, y], [x + 80, y - 120], [x - 80, y - 120]]); g.closePath(); fs(lg(x - 90, 0, x + 90, 0, ['#9aa2aa', '#d8dde2', '#8a929a']), 4); circ(x, y - 62, 10, 'rgba(255,255,255,.5)'); }
}
// 9. 9:00 AM: you walk into work... and spill coffee all over your shirt. Everyone will see. Everyone will judge.
S.stain = (t, u) => {
  const a = LN.s01, b = LN.s02, tsp = wordT('s01', 'spill'), tdr = wordT('s02', 'drops'), tev = wordT('s02', 'Everyone'), tju = wordT('s02', 'judge');
  const walkIn = seg(t, a.t0, tsp - .2), st = ss(seg(t, tsp + .05, tsp + .7)), dark = ss(seg(t, tev - .2, tev + .6));
  const z = t < b.t0 ? lerp(1.0, 1.15, ss(seg(t, a.t0, tsp + .3))) : lerp(1.6, 1.25, ss(seg(t, tdr + .3, tev + .8)));
  cam(lerp(820, 900, walkIn), t < b.t0 ? 560 : lerp(500, 560, ss(seg(t, tdr, tev + .8))), z, 0, t > tsp && t < tsp + .5 ? 4 * (1 - seg(t, tsp, tsp + .5)) : 0, t);
  const post = officeSet(t, { boss: 0 });
  for (const [x, w] of [[300, 360], [1500, 360]]) desk(x, 760, w);
  const px = lerp(700, 900, eo(walkIn));
  person(px, 1060, 860, { t, walk: walkIn < 1 ? t * 7 : null, outfit: 'shirt', hood: SHIRT, legs: SUIT, arms: 'hold', cup: 1, cupTilt: t > tsp ? -1.3 * ss(seg(t, tsp - .1, tsp + .15)) : 0, stain: st, eyes: t > tsp ? 'wide' : 'open', look: t > tsp ? 0 : .3, lookY: t > tsp + .2 ? .8 : 0, sweat: t > tdr ? 1 : 0, mouth: t > tsp && t < tsp + .8 ? .5 : 0, tired: .2, lx: -1, rim: 'rgba(220,232,255,.5)' });
  if (t > tsp - .05 && t < tsp + .9) { const p = seg(t, tsp - .05, tsp + .9); for (let k = 0; k < 16; k++) { const a_ = -2.2 + hash(k) * 1.6, v = 160 + 200 * hash(k * 3), x = px - 30 + Math.cos(a_) * v * p, y = 640 + Math.sin(a_) * v * p + 600 * p * p; circ(x, y, 8 * (1 - p * .5) * (.6 + hash(k + 1)), `rgba(110,62,30,${.9 * (1 - p)})`); } }
  L(px, 600, 520, null, .6 + .4 * dark);
  lightPass('#3a4256'); post();
  if (dark > 0) {
    reset(); g.fillStyle = rg(CX, 500, 160, 760, ['rgba(4,3,10,0)', `rgba(4,3,10,${.88 * dark})`]); g.fillRect(0, 0, W, H);
    const red = ss(seg(t, tju - .2, tju + .4));
    for (let i = 0; i < 22; i++) { const on = tev + i * .06, k = ss(seg(t, on, on + .3)); if (k <= 0) continue; const ang = hash(i * 3.3) * TAU, r = 520 + 330 * hash(i * 5.1), x = CX + Math.cos(ang) * r * 1.35, y = 520 + Math.sin(ang) * r * .7, s = 22 + 18 * hash(i), bl = Math.max(0, Math.sin(t * 1.3 + i * 2.1) - .96) * 25;
      g.save(); g.translate(x, y); for (const sg of [-1, 1]) { const ex = sg * s * 1.3, open = k * (1 - clamp(bl)) * (1 - .35 * red); g.beginPath(); g.moveTo(ex - s, 0); g.quadraticCurveTo(ex, -s * open, ex + s, 0); g.quadraticCurveTo(ex, s * open, ex - s, 0); g.closePath(); g.fillStyle = red ? `rgba(255,${200 - 150 * red},${200 - 150 * red},.9)` : 'rgba(235,235,245,.9)'; g.shadowColor = red ? 'rgba(255,40,60,.9)' : 'rgba(200,210,255,.7)'; g.shadowBlur = 16; g.fill(); g.shadowBlur = 0; circ(ex + (CX - x) * .01, (520 - y) * .01, s * .42 * open, '#0a0608'); } g.restore(); }
  }
};
// 10. the office: everyone lost in their own head. Nobody noticed. And the boss... is faking it.
const OFF = [[560, 'sit', TOPS[3], SKINS[2], HAIRS[0], 0], [880, 'sit', TOPS[4], SKINS[0], HAIRS[1], 1], [1200, 'sit', TOPS[2], SKINS[3], HAIRS[2], 1], [1420, 'stand', TOPS[1], SKINS[1], HAIRS[1], 0]];
S.office = (t, u) => {
  const a = LN.s03, b = LN.s04, bb = LN.s04b, c = LN.s04c, tfa = wordT('s04c', 'faking');
  const s5 = LN.s05 || { t0: 1e9 }, F = [[900, 540, 1.0], [400, 520, 1.25], [1640, 450, 1.45], [1600, 520, 1.15], [1120, 450, 1.25]], fi = t < b.t0 ? 0 : t < bb.t0 ? 1 : t < c.t0 ? 2 : t < s5.t0 ? 3 : 4, ts_ = [a.t0, b.t0, bb.t0, c.t0, s5.t0][fi], fp = ss(seg(t, ts_, ts_ + 1)), A = F[Math.max(0, fi - 1)], B = F[fi];
  cam(lerp(A[0], B[0], fi ? fp : 1), lerp(A[1], B[1], fi ? fp : 1), lerp(A[2], B[2], fi ? fp : 1) * (fi === 0 ? lerp(1.05, 1, eo(seg(t, a.t0, a.t0 + 1.5))) : 1));
  const post = officeSet(t);
  person(1760, 920, 560, { t, outfit: 'shirt', hood: BOSSC, legs: SUIT, skin: SKINS[0], hair: HAIRS[3], arms: t > bb.t0 ? 'rub' : 'down', eyes: t > bb.t0 ? 'wide' : 'open', look: -.4, sweat: t > bb.t0 ? .6 : 0, tired: .5, lx: -1, rim: 'rgba(220,232,255,.5)' });
  person(230, 1080, 800, { t, outfit: 'shirt', hood: SHIRT, legs: SUIT, arms: 'down', stain: 1, eyes: 'open', look: t > b.t0 ? 0 : .7, lookY: t > b.t0 ? .5 : 0, tired: .2, lx: -1, rim: 'rgba(220,232,255,.5)' });
  OFF.forEach(([x, pose, top, sk, hr, ph], i) => { if (pose === 'sit') person(x, 1040, 640, { t: t + i, sit: 1, hood: top, skin: sk, hair: hr, longHair: ph, arms: 'lap', eyes: 'open', look: i % 2 ? .3 : -.3, lookY: .5, tired: .3, lx: -1, rim: 'rgba(220,232,255,.45)' }); else person(x, 1060, 800, { t: t + i, hood: top, skin: sk, hair: hr, arms: 'hold', cup: 1, eyes: 'open', look: t > s5.t0 ? -1 : -.6, lookY: t > s5.t0 ? 0 : .2, sweat: t > s5.t0 ? .7 : 0, tired: .3, lx: -1, rim: 'rgba(220,232,255,.45)' }); });
  for (const [x, w] of [[560, 280], [880, 280], [1200, 280]]) desk(x, 800, w);
  L(1760, 500, 420, null, .5);
  lightPass('#3a4256'); post();
  const OP = [[560, 330], [880, 250], [1200, 330], [1430, 200]];
  parts('s03').forEach((pr, i) => { const [x, y] = OP[i % 4], [hx] = [OFF[i % 4][0]]; thought('s03', t, x, y, { part: pr, tx: hx, ty: OFF[i % 4][1] === 'sit' ? 480 : 380, col: BCOL[(i + 1) % 6], size: 40, maxw: 300, seed: i, until: b.t1 + .3 }); });
  thought('s04b', t, 1380, 330, { tx: 1700, ty: 430, col: C.pur, size: 40, maxw: 380, seed: 4, until: c.t1 + .3 });
  if (t > c.t0) tag(TX.boss, 1760, 840, PUR, C.pur, back(seg(t, c.t0 + .1, c.t0 + .4), 1.8) * (1 - ss(seg(t, s5.t0, s5.t0 + .3))), 40);
  thought('s05b', t, 1130, 190, { tx: 1360, ty: 310, col: C.grn, size: 46, maxw: 380, seed: 5 });
  if (t > b.t0) { reset(); const k = back(seg(t, b.t0 + .2, b.t0 + .5), 1.7) * (1 - ss(seg(t, bb.t0, bb.t0 + .3))); pill(`${TX.noticed}: 0`, CX, 860, 52, GRN, C.grn, k); }
};

// ---------- the café ----------
function cafeSet(t) {
  const back_ = keep();
  for (const x of [-500, 400, 1300, 2200]) g.drawImage(TEX.brick, 0, 0, 900, 1300, x, -300, 900, 1300);
  g.fillStyle = 'rgba(40,20,20,.25)'; g.fillRect(-600, -300, 3120, 1300);
  // the big window onto the street at noon
  g.save(); rr(520, 80, 880, 540, 10); g.clip();
  g.fillStyle = lg(0, 80, 0, 620, ['#8cc0ec', '#e8f2f8']); g.fillRect(520, 80, 880, 540);
  for (const [bx, bw, bt, bc] of [[540, 300, 150, '#d8b890'], [860, 230, 220, '#b8a0a8'], [1110, 300, 120, '#c8c0a0']]) { g.fillStyle = bc; g.fillRect(bx, bt, bw, 620 - bt); for (let wy = bt + 30; wy < 560; wy += 70) for (let wx = bx + 24; wx < bx + bw - 40; wx += 64) { rr(wx, wy, 40, 46, 3); fs('rgba(60,80,110,.75)', 0); } }
  g.fillStyle = '#6a6a72'; g.fillRect(520, 560, 880, 60); for (let k = 0; k < 3; k++) { const px = ((t * 60 + k * 330) % 1100) + 420; ell(px, 520, 16, 18); g.fillStyle = 'rgba(30,30,40,.8)'; g.fill(); rr(px - 22, 536, 44, 70, 14); g.fill(); }
  for (let k = 0; k < 8; k++) { ell(1280 + Math.cos(k) * 70, 200 + Math.sin(k * 1.7) * 50, 70, 50); g.fillStyle = k % 2 ? '#5a8a4a' : '#4a7a3a'; g.fill(); } line([[1290, 260], [1300, 620]], 16, '#4a3020');
  g.fillStyle = 'rgba(255,255,255,.1)'; path([[620, 80], [760, 80], [560, 620], [420, 620]]); g.closePath(); g.fill();
  g.restore();
  rr(520, 80, 880, 540, 10); g.strokeStyle = OL; g.lineWidth = 30; g.stroke(); g.strokeStyle = '#3a2418'; g.lineWidth = 20; g.stroke(); line([[960, 80], [960, 620]], 14, '#3a2418'); line([[520, 330], [1400, 330]], 10, '#3a2418');
  // shelf of cups and plants, a chalk menu
  rr(-120, 420, 520, 20, 4); fs('#5a3a22', 3); for (let k = 0; k < 6; k++) { rr(-90 + k * 80, 370, 50, 50, 8); fs(['#e8e2d6', '#c8504a', '#e8e2d6', '#4a7ab0', '#e8c060', '#e8e2d6'][k], 3); } for (let k = 0; k < 2; k++) { rr(-80 + k * 380, 300, 60, 70, 8); fs('#b46a48', 3); for (let j = 0; j < 5; j++) curve([-50 + k * 380, 302], [-50 + k * 380 + (j - 2) * 18, 260], [-50 + k * 380 + (j - 2) * 28, 236], 6, '#3b6a48'); }
  rr(1520, 130, 360, 460, 10); fs('#1e2420', 10); for (let k = 0; k < 7; k++) { rr(1560, 200 + k * 52, 150 + 100 * hash(k), 10, 5); g.fillStyle = 'rgba(240,240,230,.55)'; g.fill(); rr(1790, 200 + k * 52, 50, 10, 5); g.fill(); }
  g.drawImage(TEX.floorFront, -500, 860, 2900, 700); g.fillStyle = lg(0, 860, 0, 960, ['rgba(0,0,0,.5)', 'rgba(0,0,0,0)']); g.fillRect(-600, 860, 3120, 100);
  for (const bx of [180, 540, 1380, 1740]) { line([[bx, -300], [bx, 210]], 3, '#1a1414'); rr(bx - 9, 196, 18, 18, 3); fs('#3a3030', 2); }
  L(960, 350, 1200, '255,250,235', 1, .18); for (const bx of [180, 540, 1380, 1740]) L(bx, 235, 380, C.amb, .85, .25); L(960, 820, 1000, null, .45);
  return () => { back_(); for (const bx of [180, 540, 1380, 1740]) { ell(bx, 232, 16, 22); g.fillStyle = 'rgba(255,230,170,.95)'; g.fill(); glow(bx, 232, 150, C.warm, .5); } beam([[560, 600], [1360, 600], [1500, 1000], [420, 1000]], 960, 600, 960, 1000, '255,250,230', .08); motes(500, 200, 1500, 900, 30, t, C.warm, .45, 8); };
}
function cafeTable() {
  cshadow(960, 1060, 380, 26, .5); rr(946, 860, 28, 190, 6); fs('#2a1c16', 3); ell(960, 1052, 120, 16); fs('#2a1c16', 3);
  ell(960, 846, 400, 62); fs(lg(0, 790, 0, 910, ['#e8d8c0', '#a88e70']), 6); g.beginPath(); g.moveTo(560, 846); g.quadraticCurveTo(960, 940, 1360, 846); g.lineTo(1360, 866); g.quadraticCurveTo(960, 962, 560, 866); g.closePath(); fs('#7a5a40', 4);
  for (const [cx, sg] of [[790, 1], [1130, -1]]) { ell(cx, 838, 64, 16); fs('#f4f0e8', 3); rr(cx - 34, 790, 68, 48, 10); fs(lg(cx - 34, 0, cx + 34, 0, ['#f4f0e8', '#c8c0b0']), 4); ell(cx, 792, 32, 8); fs('#a8744a', 2); curve([cx - 10, 792], [cx, 786], [cx + 10, 792], 2, '#f4e8d8'); curve([cx + sg * 34, 800], [cx + sg * 54, 812], [cx + sg * 34, 826], 6, '#c8c0b0'); }
  ell(960, 836, 80, 18); fs('#f8f4ec', 3); path([[920, 826], [1000, 816], [990, 790], [930, 800]]); g.closePath(); fs('#e8b8c8', 3); line([[925, 800], [992, 790]], 6, '#fff');
}
// 11. noon: lunch with your best friend. Halfway through your story: am I boring them? They're thinking the exact same thing.
S.lunch = (t, u) => {
  const a = LN.l01, b = LN.l02, c = LN.l03, tpa = wordT('l01', 'panic'), tam = wordT('l01', 'Am'), tsa = wordT('l03', 'same');
  const F = [[960, 560, 1.02], [720, 520, 1.3], [1220, 510, 1.3], [960, 520, 1.02]], fi = t < tpa ? 0 : t < b.t0 ? 1 : t < c.t0 ? 2 : 3, ts_ = [a.t0, tpa, b.t0, c.t0][fi], fp = ss(seg(t, ts_, ts_ + 1)), A = F[Math.max(0, fi - 1)], B = F[fi];
  cam(lerp(A[0], B[0], fi ? fp : 1), lerp(A[1], B[1], fi ? fp : 1), lerp(A[2], B[2], fi ? fp : 1));
  const post = cafeSet(t);
  const talking = t < tpa ? .35 + .3 * Math.sin(t * 11) * Math.sin(t * 3.7) : 0;
  person(640, 1080, 680, { t, sit: 1, arms: 'lap', eyes: t > tpa ? 'wide' : 'open', look: .8, mouth: Math.max(0, talking), sweat: t > tpa && t < c.t0 ? .7 : 0, smile: t > tsa ? 1 : 0, tired: .2, lx: 1, rim: 'rgba(255,214,160,.5)' });
  person(1280, 1080, 680, { t: t + 2, sit: 1, hood: FRIC, skin: SKINS[2], hair: HAIRS[2], arms: 'lap', eyes: 'open', look: -.8, smile: t < b.t0 || t > tsa ? 1 : 0, sweat: t > b.t0 && t < tsa ? .5 : 0, tired: .2, lx: -1, rim: 'rgba(255,214,160,.5)' });
  cafeTable();
  lightPass('#5a4048'); post();
  const i0 = wi('l01', 'Am'), lend = (LN.l03b || c).t1 + .7; thought('l01', t, 480, 250, { part: [i0, LN.l01.words.length], tx: 620, ty: 450, col: C.cyan, size: 48, maxw: 360, seed: 1, until: lend });
  thought('l02', t, 1450, 230, { tx: 1290, ty: 440, col: C.grn, size: 46, maxw: 400, seed: 2, until: lend });
  if (t > tsa - .1) { const p = ss(seg(t, tsa - .1, tsa + .5)); g.save(); g.globalCompositeOperation = 'screen'; g.setLineDash([14, 14]); g.lineDashOffset = -t * 60; line([[650, 250], [lerp(650, 1290, p), lerp(250, 230, p)]], 6, `rgba(${C.gold},.9)`); g.setLineDash([]); if (p >= 1) glow(960, 240, 200, C.gold, .4 + .2 * Math.sin(t * 6)); g.restore(); }
};
// 12. the liking gap: they like you more than you think
S.gap = (t, u) => {
  const a = LN.l04, b = LN.l05, tun = wordT('l04', 'underestimate'), tli = wordT('l04', 'liking');
  cam(960, 540, 1.06); const post = cafeSet(t); person(640, 1080, 680, { t, sit: 1, arms: 'lap', eyes: 'open', look: .8, smile: 1, lx: 1 }); person(1280, 1080, 680, { t: t + 2, sit: 1, hood: FRIC, skin: SKINS[2], hair: HAIRS[2], arms: 'lap', eyes: 'open', look: -.8, smile: 1, lx: -1 }); cafeTable();
  lightPass('#3a2a3a'); post();
  reset(); g.fillStyle = 'rgba(6,6,16,.62)'; g.fillRect(0, 0, W, H);
  const base = 830, bars = [[TX.think, 230, CYAN, C.cyan, tun], [TX.truth, 470, GRN, C.grn, tli]];
  text(TX.likeQ, CX, 330, 56, '#fff', 'Anton', 'center', 10, ss(seg(t, a.t0, a.t0 + .4)));
  bars.forEach(([lab, hgt, col, rgbc, ton], i) => { const x = 760 + i * 400, p = eo(seg(t, ton - .2, ton + .8)); if (t < a.t0 + .3) return; const hh = hgt * p;
    rr(x - 110, base - hh, 220, Math.max(1, hh), 18); g.save(); g.shadowColor = `rgba(${rgbc},.8)`; g.shadowBlur = 30; g.fillStyle = lg(0, base - hh, 0, base, [col, `rgba(${rgbc},.35)`]); g.fill(); g.restore();
    text(lab, x, base + 52, 40, col, 'Anton', 'center', 0, ss(seg(t, a.t0 + .3, a.t0 + .7)));
    if (p > .1) { for (let k = 0; k < Math.round(hgt / 90 * p); k++) PICS.heart(x, base - 50 - k * 80, 0, 70); } });
  const gp = ss(seg(t, tli + .6, tli + 1.2)); if (gp > 0) { g.save(); g.globalAlpha = gp; g.setLineDash([12, 10]); line([[870, base - 230], [1050, base - 230]], 4, '#fff'); line([[870, base - 470], [1050, base - 470]], 4, '#fff'); g.setLineDash([]); line([[1010, base - 236], [1010, base - 464]], 5, GOLD); text('GAP', 940, base - 350, 50, GOLD, 'Anton', 'center', 8); g.restore(); }
  if (t > b.t0) for (let k = 0; k < 14; k++) { const p = (t - b.t0) * .35 + hash(k), q = p % 1; PICS.heart(200 + hash(k * 3.1) * 1520, 1080 - q * 900, 0, 40 + 30 * hash(k)); }
};
// ---------- 1:30 PM: the text ----------
function chat(t, x, y, s, o = {}) {
  const { sent = 0, typing = 0, reply = 0, red = 0 } = o;
  g.save(); g.translate(x, y); g.scale(s, s);
  cshadow(0, 520, 300, 40, .5); rr(-250, -500, 500, 1000, 64); fs('#0e0e14', 8); rr(-232, -482, 464, 964, 50); g.fillStyle = '#f2f2f6'; g.fill();
  g.save(); rr(-232, -482, 464, 964, 50); g.clip();
  g.fillStyle = '#e2e2ea'; g.fillRect(-232, -482, 464, 140); circ(-160, -392, 36, '#7ac0a0'); circ(-160, -400, 14, '#f0dcc0'); text(TX.friend, -100, -392, 36, '#2a2a30', 'Anton', 'left');
  const msg = (mx, my, w, txt, mine, k = 1, glowc = null) => { if (k <= 0) return; g.save(); g.translate(mx, my); g.scale(k, k); if (glowc) { g.shadowColor = glowc; g.shadowBlur = 30; } rr(mine ? -w : 0, -44, w, 88, 36); g.fillStyle = mine ? '#3a8af0' : '#ffffff'; g.fill(); g.shadowBlur = 0; g.font = '500 44px sans-serif'; g.textBaseline = 'middle'; g.textAlign = mine ? 'right' : 'left'; g.fillStyle = mine ? '#fff' : '#1a1a20'; g.fillText(txt, mine ? -24 : 24, 2); g.restore(); };
  msg(-210, -260, 250, '', false); rr(-186, -268, 180, 14, 7); g.fillStyle = '#c8c8d0'; g.fill(); msg(210, -170, 220, '', true); rr(10, -178, 170, 14, 7); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill();
  g.font = '500 44px sans-serif'; msg(210, -40, g.measureText(TX.chat1).width + 50, TX.chat1, true, back(sent, 1.6));
  if (typing) { msg(-210, 90, 130, '', false); for (let i = 0; i < 3; i++) circ(-172 + i * 28, 90 - Math.max(0, Math.sin(t * 9 - i)) * 8, 9, '#9a9aa4'); }
  g.font = '500 44px sans-serif'; msg(-210, 90, g.measureText(TX.chat2).width + 50, TX.chat2, false, back(reply, 1.8), red ? `rgba(255,60,80,${red})` : null);
  g.restore(); rr(-240, 440, 480, 30, 10); g.restore();
}
// 12b. 1:30 PM: "thanks for lunch!!"... "ok." Just ok. Are they mad? (They're running into a meeting.)
S.text = (t, u) => {
  const a = LN.x01, b = LN.x02, c = LN.x03, tfr = wordT('x01', 'friend'), trp = wordT('x01', 'reply'), tok = wordT('x01', 'ok'), tma = wordT('x01', 'mad'), tbu = wordT('x03', 'busy'), two = wordT('x03', 'worst');
  cam(CX, CY, lerp(1.04, 1, eo(seg(u, 0, 1.2)))); grad('#070814', '#141030', -200, 1300); glow(1450, 560, 650, '160,190,255', .22);
  const fr = ss(seg(t, b.t0 - .3, b.t0 + .4)) * (1 - ss(seg(t, c.t0 - .2, c.t0 + .5)));
  if (fr < 1) { g.save(); g.globalAlpha = 1 - fr; glow(560, 600, 420, C.cyan, .15); face(560, 620, 200, { t, eyes: t > tok ? 'wide' : 'open', look: .8, lookY: .3, sweat: t > tma ? .8 : 0, tired: .2, lx: 1, rim: 'rgba(160,190,255,.55)' }); g.restore(); }
  if (fr > 0) { g.save(); g.globalAlpha = fr; glow(560, 600, 420, C.grn, .15); person(560, 1080, 840, { t, walk: t * 9, hood: FRIC, skin: SKINS[2], hair: HAIRS[2], arms: 'phone', eyes: 'open', look: .3, lx: 1, rim: 'rgba(122,192,160,.6)' }); g.restore(); }
  chat(t, 1450, 560, .95, { sent: seg(t, tfr + .2, tfr + .5), typing: t > trp - .9 && t < tok - .1, reply: seg(t, tok - .1, tok + .2), red: t > tma ? .7 * (1 - fr) : 0 });
  reset();
  const WP = [[300, 170], [840, 160], [250, 330], [880, 320]];
  WORRY.forEach((s, i) => { const on = tma - .2 + i * .25, al = ss(seg(t, on, on + .3)) * (1 - ss(seg(t, b.t0 - .2, b.t0 + .2))) + (t > two ? .45 * ss(seg(t, two + i * .1, two + .3 + i * .1)) : 0); murmur(WP[i][0], WP[i][1], 40, s, al, C.red, { tx: 560, ty: 440 }); });
  thought('x02', t, 940, 210, { tx: 640, ty: 300, col: C.grn, size: 50, maxw: 460, seed: 3 });
  pill(TX.busy, CX, 120, 52, GRN, C.grn, back(seg(t, tbu - .1, tbu + .25), 1.7) * (1 - ss(seg(t, two - .2, two + .2))));
};
// ---------- the park at golden hour ----------
function tree(x, y, s, col = ['#3a6a3a', '#24482a'], rimc = 'rgba(255,190,110,.5)') {
  line([[x, y], [x + s * .02, y - s * .55]], s * .09, '#3a2618'); for (const sg of [-1, 1]) line([[x, y - s * .35], [x + sg * s * .18, y - s * .6]], s * .04, '#3a2618');
  for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, px = x + Math.cos(a) * s * .28, py = y - s * .75 + Math.sin(a) * s * .2, r = s * (.2 + .06 * hash(k + x)); circ(px, py, r, k % 2 ? col[0] : col[1]); }
  circ(x, y - s * .78, s * .26, col[0]); g.save(); g.globalCompositeOperation = 'screen'; circ(x + s * .18, y - s * .9, s * .14, rimc); g.restore();
}
function parkSet(t) {
  const back_ = keep();
  g.fillStyle = lg(0, -200, 0, 700, ['#2a1e4a', '#8a3a6a', '#e8705a', '#ffc070']); g.fillRect(-600, -400, 3120, 1100);
  circ(1480, 600, 90, '#fff0c0');
  for (let k = 0; k < 5; k++) { ell(200 + k * 420, 200 + 50 * hash(k), 260, 26); g.fillStyle = `rgba(255,160,140,${.25 + .1 * hash(k + 2)})`; g.fill(); }
  g.save(); g.globalAlpha = .85; g.drawImage(TEX.city, 0, 300, 2400, 600, -500, 430, 2900, 260); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#a05a6a'; g.fillRect(-500, 430, 2900, 260); g.restore();
  g.fillStyle = lg(0, 640, 0, 1100, ['#5a7a3a', '#3a5a2a', '#24401c']); g.fillRect(-600, 640, 3120, 700);
  for (let i = 0; i < 9; i++) tree(-420 + i * 330 + 80 * hash(i), 690, 360 + 120 * hash(i * 3), ['#3a6040', '#24402a']);
  path([[900, 650], [1020, 650], [1700, 1300], [220, 1300]]); g.closePath(); g.fillStyle = lg(0, 650, 0, 1300, ['#c8a882', '#a88a68']); g.fill();
  for (let k = 0; k < 9; k++) { const p = k / 9, y = 650 + p * p * 650, w = 60 + p * 700; line([[960 - w, y], [960 + w, y]], 2 + 3 * p, 'rgba(90,60,40,.25)'); }
  for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) { const p = .25 + k * .3, x = 960 + sg * (90 + p * 760), y = 650 + p * p * 650, s = .35 + p * .9; line([[x, y], [x, y - 360 * s]], 10 * s, '#1a1a20'); circ(x, y - 370 * s, 20 * s, '#fff0c8'); }
  for (let k = 0; k < 2; k++) { const x = k ? 1560 : 260, y = 900; rr(x - 120, y - 70, 240, 22, 6); fs('#6a4a30', 3); rr(x - 120, y - 30, 240, 20, 6); fs('#6a4a30', 3); for (const sg of [-1, 1]) line([[x + sg * 100, y - 20], [x + sg * 100, y + 20]], 8, '#1a1a20'); }
  L(1480, 600, 1300, '255,190,120', 1, .4); L(960, 900, 1000, null, .5);
  for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) { const p = .25 + k * .3, s = .35 + p * .9; L(960 + sg * (90 + p * 760), 650 + p * p * 650 - 370 * s, 200 * s + 60, C.warm, .7, .25); }
  return () => { back_(); glow(1480, 600, 900, '255,200,140', .45); motes(-200, 300, 2100, 1100, 50, t, '255,220,160', .55, 4); };
}
// 13. 3:00 PM: they walk toward you. (Question four.) They're nervous too. You say hi. You both laugh.
S.crush = (t, u) => {
  const a = LN.r01, b = LN.r02, c = LN.r03, d = LN.r04, tlk = wordT('r01', 'like'), tha = wordT('r02', 'hair'), tbs = wordT('r03', 'barely'), thi = wordT('r04', 'hi'), thi2 = wordT('r04', 'They'), tla = wordT('r04', 'laugh'), tkn = wordT('r04', 'know');
  const meet = t >= d.t0, walkP = seg(t, a.t0, a.t1 + .3);
  cam(meet ? 960 : 960, meet ? 560 : lerp(560, 520, walkP), meet ? lerp(1.15, 1.0, eo(seg(t, d.t0, d.t0 + 1.2))) * (t > tkn ? 1 + .05 * seg(t, tkn, d.t1 + .8) : 1) : t < b.t0 ? lerp(1.0, 1.08, walkP) : lerp(1.2, 1.32, seg(t, b.t0, c.t1)));
  const post = parkSet(t);
  if (!meet) {
    if (t < b.t0) { const p = eo(walkP), y = lerp(720, 1060, p), h = lerp(260, 760, p); person(960, y, h, { t, walk: p < .98 ? t * 6 : null, hood: CRUC, skin: SKINS[1], hair: HAIRS[1], longHair: 1, eyes: 'open', look: 0, smile: p > .6 ? 1 : 0, lx: 1, rim: 'rgba(255,200,140,.6)' }); }
    else person(960, 1120, 860, { t, hood: CRUC, skin: SKINS[1], hair: HAIRS[1], longHair: 1, arms: t > tha - .2 && t < c.t0 + .3 ? 'rub' : 'down', eyes: 'open', look: .6 * Math.sin(t * 2.2), sweat: t < c.t0 + 2 ? .9 : .3, smile: 0, mouth: 0, tired: .1, lx: 1, rim: 'rgba(255,200,140,.6)' });
  } else {
    const laugh = t > tla ? clamp(.4 + .4 * Math.sin(t * 9)) * (1 - seg(t, tkn, tkn + .5)) : 0;
    person(700, 1080, 780, { t, arms: t > thi - .1 && t < thi + 1.2 ? 'wave' : 'down', eyes: 'open', look: .8, smile: t > tkn ? 1 : 0, mouth: laugh, lx: 1, rim: 'rgba(255,200,140,.6)' });
    person(1220, 1080, 780, { t: t + 1, hood: CRUC, skin: SKINS[1], hair: HAIRS[1], longHair: 1, arms: t > thi2 - .1 && t < thi2 + 1.2 ? 'wave' : 'down', eyes: 'open', look: -.8, smile: t > tkn ? 1 : 0, mouth: laugh, lx: -1, rim: 'rgba(255,200,140,.6)' });
  }
  lightPass('#6a3a5a'); post();
  if (!meet) { if (t > tlk && t < b.t0) tag(TX.crush, 960, lerp(720, 1060, eo(walkP)) - lerp(260, 760, eo(walkP)) * 1.08, ROSE, C.rose, back(seg(t, tlk, tlk + .35), 1.8), 40); }
  thought('r02', t, 1420, 230, { tx: 1060, ty: 330, col: C.rose, size: 48, maxw: 420, seed: 3, until: c.t0 + .6 });
  if (meet) {
    for (const [tt_, x] of [[thi, 700], [thi2, 1220]]) { const k = back(seg(t, tt_ - .1, tt_ + .2), 1.8) * (1 - ss(seg(t, tt_ + 1.4, tt_ + 1.8))); if (k <= 0) continue; g.save(); g.translate(x + (x < CX ? 150 : -150), 330); g.scale(k, k); rr(-110, -60, 220, 120, 40); fs('#fffaf0', 5); path([[x < CX ? -60 : 60, 56], [x < CX ? -100 : 100, 110], [x < CX ? -10 : 10, 56]]); g.closePath(); fs('#fffaf0', 0); text(TX.hi, 0, 6, 72, '#2a1a2a', 'Anton'); g.restore(); }
    if (t > tla) { g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 12; k++) { const p = ((t - tla) * .6 + hash(k)) % 1; star(960 + (hash(k * 3) - .5) * 600, 400 - p * 300, 14 * Math.sin(Math.PI * p), '#ffe8a0'); } g.restore(); }
    if (t > tkn) glow(960, 560, 900, C.gold, .25 * ss(seg(t, tkn, tkn + .6)));
  }
  reset();
  // the answer to question four, and the nerves you feel vs the nerves they see
  if (t > c.t0 && t < c.t1 + .5) {
    const k = back(seg(t, c.t0, c.t0 + .35), 1.7) * (1 - ss(seg(t, c.t1, c.t1 + .4)));
    pill(`${TX.ans}: ${TX.nerv}`, 560, 130, 46, GRN, C.grn, k); pill(TX.plus, 560, 225, 34, GRN, C.grn, back(seg(t, c.t0 + .3, c.t0 + .6), 1.7) * (1 - ss(seg(t, c.t0 + 3, c.t0 + 3.4))));
    const mk = ss(seg(t, wordT('r03', 'nerves') - .2, wordT('r03', 'nerves') + .3)) * (1 - ss(seg(t, c.t1, c.t1 + .4)));
    if (mk > 0) [[TX.feel || 'HOW NERVOUS YOU FEEL', 300, 1, RED, C.red, 0], [TX.look || 'HOW NERVOUS YOU LOOK', 1620, .12, GRN, C.grn, 1]].forEach(([lab, x, lv, col, rgbc, i]) => {
      const fillP = i ? eo(seg(t, tbs, tbs + .6)) * lv : eo(seg(t, wordT('r03', 'written'), wordT('r03', 'face') + .3)) * lv; g.save(); g.globalAlpha = mk;
      rr(x - 50, 330, 100, 480, 50); fs('rgba(8,10,22,.8)', 4, `rgba(${rgbc},.8)`); rr(x - 38, 342 + 456 * (1 - fillP), 76, Math.max(1, 456 * fillP), 38); g.save(); g.shadowColor = `rgba(${rgbc},.9)`; g.shadowBlur = 24; g.fillStyle = col; g.fill(); g.restore();
      lab.split(' ').reduce((acc, w, j, arr) => { if (j % 2 === 0) acc.push(arr.slice(j, j + 2).join(' ')); return acc; }, []).forEach((s, j) => text(s, x, 860 + j * 40, 34, '#fff', 'Anton', 'center', 8)); g.restore(); });
  }
};
// ---------- the evening platform ----------
function platformSet(t, o = {}) {
  const { train = -1, head = 0 } = o, back_ = keep();
  for (let x = -700; x < 2700; x += 1200) g.drawImage(TEX.tiles, x, -160, 1200, 960);
  g.fillStyle = 'rgba(20,30,40,.25)'; g.fillRect(-700, -200, 3400, 1000);
  g.fillStyle = '#20262c'; g.fillRect(-700, 20, 3400, 40); rr(1260, 70, 640, 110, 10); fs('#123a2a', 6); text(TX.station || 'CENTRAL', 1580, 127, 78, '#e8f0e8', 'Anton');
  for (const px of [-260, 1760]) { rr(px, 330, 300, 400, 6); fs(lg(px, 0, px + 300, 0, ['#2a3a6a', '#6a2a4a']), 5); circ(px + 150, 470, 70, 'rgba(255,200,120,.6)'); rr(px + 40, 600, 220, 20, 6); g.fillStyle = 'rgba(255,255,255,.6)'; g.fill(); }
  rr(240, 640, 260, 26, 6); fs('#5a3a2a', 3); for (const lx2 of [260, 470]) line([[lx2, 666], [lx2, 790]], 10, '#1a1a20');
  g.fillStyle = lg(0, 790, 0, 900, ['#5a5a62', '#74747c']); g.fillRect(-700, 790, 3400, 110);
  g.fillStyle = '#d8b02a'; g.fillRect(-700, 878, 3400, 22); for (let x = -690; x < 2700; x += 24) circ(x, 889, 4, 'rgba(120,90,10,.6)');
  g.fillStyle = '#2a2a30'; g.fillRect(-700, 900, 3400, 40); g.fillStyle = '#0c0c10'; g.fillRect(-700, 940, 3400, 500);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '150,140,130' : '40,36,32'},.5)`; g.fillRect(-700 + hash(i * 1.3) * 3400, 960 + hash(i * 2.9) * 200, 4, 3); }
  for (const ry of [1010, 1090]) { line([[-700, ry], [2700, ry]], 12, '#3a3a40'); line([[-700, ry - 4], [2700, ry - 4]], 3, 'rgba(220,220,230,.55)'); }
  for (let x = -700; x < 2700; x += 90) { rr(x, 1000, 40, 110, 4); fs('rgba(60,40,30,.6)', 0); }
  for (const lx2 of [-200, 500, 1200, 1900]) { rr(lx2 - 180, -20, 360, 26, 8); fs('#e8f0ec', 3); }
  L(960, 0, 1500, C.fluo, .75, .1); L(960, 600, 1300, null, .4); if (head > 0) L(-200, 950, 900 * head + 50, '255,240,200', head, .35);
  return () => {
    back_(); for (const lx2 of [-200, 500, 1200, 1900]) glow(lx2, -7, 300, C.fluo, .3);
    if (head > 0) { glow(-150, 980, 700 * head, '255,240,210', .7 * head); beam([[-150, 960], [-150, 1000], [1400, 1160], [1400, 760]], -150, 980, 1400, 980, '255,240,210', .2 * head); }
    if (train >= 0) { const x = lerp(-2600, 2400, train); g.save(); rr(x - 1400, 600, 2800, 520, 40); fs(lg(0, 600, 0, 1120, ['#d8dde2', '#9aa2aa', '#5a626a']), 10); g.fillStyle = '#2a5a9a'; g.fillRect(x - 1390, 980, 2780, 40); for (let w = 0; w < 7; w++) { rr(x - 1300 + w * 380, 680, 260, 200, 18); fs('#f4f0d8', 6); } circ(x + 1300, 1000, 40, '#fff8d8'); glow(x + 1300, 1000, 500, '255,240,200', .8); g.restore();
      g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 18; k++) { const y = 620 + hash(k) * 480; line([[x - 1600 - 600 * hash(k * 3), y], [x - 1400, y]], 3, 'rgba(255,255,255,.25)'); } g.restore(); }
  };
}
// 14. 6:00 PM, the platform: a thought that makes your blood run cold. The man behind you. He steps back, horrified by his own mind.
S.platform = (t, u) => {
  const a = LN.d01, b = LN.d02, c = LN.d03, d = LN.d04, e = LN.d05, tco = wordT('d01', 'cold'), tbh = wordT('d03', 'behind'), tst = wordT('d03', 'stops'), ttu = wordT('d03', 'turn'), tho = wordT('d04', 'horrified'), tne = wordT('d05', 'never');
  const F = [[960, 560, 1.0], [1080, 470, 1.55], [990, 520, 1.25], [1120, 480, 1.4], [1000, 540, 1.15]], fi = t < b.t0 ? 0 : t < c.t0 ? 1 : t < d.t0 ? 2 : t < e.t0 ? 3 : 4, ts_ = [a.t0, b.t0, c.t0, d.t0, e.t0][fi], fp = ss(seg(t, ts_, ts_ + (fi === 2 ? .5 : 1))), A = F[Math.max(0, fi - 1)], B = F[fi];
  cam(lerp(A[0], B[0], fi ? fp : 1), lerp(A[1], B[1], fi ? fp : 1), lerp(A[2], B[2], fi ? fp : 1) * (fi === 0 ? lerp(1.04, 1.1, seg(t, a.t0, a.t1)) : 1), 0, t > tst && t < tst + .6 ? 3 * (1 - seg(t, tst, tst + .6)) : 0, t);
  const back_p = ss(seg(t, d.t0, tho + .3)), head = ss(seg(t, tne - 1.2, e.t1 + .15)), train = t > e.t1 - .5 ? seg(t, e.t1 - .5, e.t1 + .4) : -1;
  const post = platformSet(t, { head, train });
  for (const [x, h, sk, top] of [[200, 420, SKINS[2], TOPS[3]], [1560, 450, SKINS[0], TOPS[0]], [1760, 430, SKINS[3], TOPS[4]]]) person(x, 800, h, { t: t + x, hood: top, skin: sk, arms: 'phone', eyes: 'open', look: .3, lx: -1, rim: RIMC });
  const pale = back_p, manSkin = [0, 1, 2].map(i => SKINS[0][i]);
  person(lerp(1050, 1160, back_p), lerp(800, 775, back_p), lerp(530, 480, back_p), { t, hood: MANC, skin: pale ? ['#f0e4dc', '#c8b8b0', '#8a7a78'] : manSkin, hair: HAIRS[2], arms: t > tho - .2 ? 'rub' : 'down', eyes: t > d.t0 ? 'wide' : 'open', look: t > d.t0 ? .1 : -.6, lookY: t < d.t0 ? .4 : 0, mouth: t > tho ? .3 : 0, sweat: t > d.t0 ? 1 : 0, tired: .4, lx: -1, rim: 'rgba(200,220,255,.5)' });
  person(900, 870, 640, { t, arms: 'down', eyes: t > tst ? 'wide' : 'open', look: t > ttu ? 1 : t > tbh ? .5 : -.1, sweat: t > tst ? 1 : 0, tired: .3, lx: 1, rim: 'rgba(200,220,255,.55)' });
  const redP = t > b.t0 && t < d.t0 ? .6 + .4 * Math.sin((t - b.t0) * 7) : 0;
  if (redP) L(1080, 450, 700, C.red, redP, .3);
  lightPass(t > tco ? '#2a2c4a' : '#323a52'); post();
  thought('d02', t, 1420, 210, { tx: 1110, ty: 330, col: C.red, size: 60, maxw: 460, seed: 2, until: c.t0 + 1.2, ink: '#ffd8dc' });
  thought('d05', t, 1500, 250, { tx: 1210, ty: 330, col: C.ice, size: 50, maxw: 440, seed: 4 });
  if (t > b.t0 && t < d.t0) { reset(); const beat = Math.pow(Math.max(0, Math.sin((t - b.t0) * TAU * 1.1)), 8); g.fillStyle = rg(CX, CY, 300, 1100, ['rgba(0,0,0,0)', `rgba(120,0,15,${.25 + .3 * beat})`]); g.fillRect(0, 0, W, H); }
  if (train >= 0) { reset(); g.fillStyle = `rgba(255,250,235,${.22 * Math.sin(Math.PI * clamp(train * 1.4 - .2))})`; g.fillRect(0, 0, W, H); }
};
// 15. intrusive thoughts: a dark cloud pops out of the brain... 94 in 100 people have them
S.intrusive = (t, u) => {
  const a = LN.d06, b = LN.d07, tin = wordT('d06', 'intrusive'), tpo = wordT('d06', 'pops'), tni = wordT('d07', 'ninety'), tth = wordT('d07', 'thirteen'), tpr = wordT('d07', 'Being');
  cam(CX, CY, lerp(1.06, 1.0, eo(seg(u, 0, 1.5))));
  grad('#08061a', '#1a1238', -200, 1300);
  for (let i = 0; i < 60; i++) circ(hash(i * 3.3) * W, hash(i * 1.7) * H, 1 + 2 * hash(i), `rgba(255,255,255,${.25 + .35 * Math.sin(t * 2 + i)})`);
  const calm = ss(seg(t, tpr, tpr + 1)), bx = t > b.t0 ? lerp(760, 560, ss(seg(t, b.t0, b.t0 + 1))) : 760;
  glow(bx, 600, 560, calm ? C.cyan : C.mag, .25 + .1 * calm);
  brain(bx, 620, 1.05, t, {});
  if (calm) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = calm * .5; brain(bx, 620, 1.05, t, {}); g.restore(); glow(bx, 620, 420, C.cyan, .3 * calm); }
  // the storm cloud
  const ck = back(seg(t, tin - .2, tin + .3), 1.5) * (1 - .7 * calm), fl = Math.pow(Math.max(0, Math.sin(t * 2.3) * Math.sin(t * 5.1)), 6);
  if (ck > 0) { g.save(); g.translate(bx - 120, 190); g.scale(ck, ck); for (let i = 0; i < 3; i++) circ(90 + i * 40, 140 + i * 45, 26 - i * 7, '#2a2438'); cloud(0, 0, 420, 220, 7); g.fillStyle = lg(0, -110, 0, 110, ['#4a4458', '#1e1a28']); g.fill(); g.save(); g.shadowColor = `rgba(${C.red},${.4 + .5 * fl})`; g.shadowBlur = 30; g.strokeStyle = `rgba(${C.red},.7)`; g.lineWidth = 4; g.stroke(); g.restore();
    path([[10, -20], [-30, 50], [5, 45], [-20, 120], [50, 20], [15, 25], [40, -20]]); g.closePath(); g.fillStyle = `rgba(255,${220 - 80 * fl},120,${.6 + .4 * fl})`; g.shadowColor = 'rgba(255,200,80,.9)'; g.shadowBlur = 20 * fl; g.fill(); g.restore(); }
  if (t > tpo) for (let k = 0; k < 5; k++) { const p = seg(t, tpo + k * .12, tpo + .5 + k * .12); if (p <= 0 || p >= 1) continue; circ(bx + 200 + k * 60, 400 - p * 200, 20 * (1 - p), `rgba(120,100,150,${1 - p})`); }
  // 94 in 100
  if (t > b.t0) {
    reset(); NOSTAT = 1; const gx = 1100, gy = 300;
    for (let i = 0; i < 100; i++) { const on = tni + i * .012, k = back(seg(t, b.t0 + .3 + i * .008, b.t0 + .6 + i * .008), 1.6), lit = t > on && i < 94; if (k <= 0) continue; const x = gx + (i % 10) * 64, y = gy + Math.floor(i / 10) * 62, col = lit ? AMB : '#3a3e52';
      g.save(); g.translate(x, y); g.scale(k, k); if (lit) { g.shadowColor = 'rgba(255,170,80,.8)'; g.shadowBlur = 12; } circ(0, -12, 10, col); rr(-12, 0, 24, 26, 10); g.fillStyle = col; g.fill(); g.restore(); }
    const n = Math.min(94, Math.round(94 * seg(t, tni, tni + 1.2))); if (t > tni) text(`${n} / 100`, gx + 290, 200, 84, AMB, 'Anton', 'center', 10);
    pill(TX.countries, gx + 290, 90, 36, CYAN, C.cyan, back(seg(t, tth - .1, tth + .25), 1.7));
  }
};
// 16. 10:00 PM: home, alone. The noise is gone. For the first time all day, your own mind.
S.night = (t, u) => {
  const a = LN.n01, tno = wordT('n01', 'noise'), tow = wordT('n01', 'own');
  cam(lerp(400, 330, ss(seg(u, 0, 6))), 840, lerp(1.12, 1.35, ss(seg(t, a.t0, a.t1 + .5))));
  const post = room(t, { sky: 'night', lamp: 1, clock: 10 });
  person(230, 1250, 560, { t, sit: 1, arms: 'lap', eyes: 'open', look: .1, lookY: .5, tired: .6, lx: 1, rim: 'rgba(140,170,255,.5)' });
  lightPass(DIM.night); post();
  swarm(t, 18, -300, 300, 1100, 1300, .5 * (1 - ss(seg(t, tno - .2, tno + .8))), { seed: 21, s0: 24, s1: 32 });
  if (t > tow - .2) { const k = back(seg(t, tow - .2, tow + .2), 1.6), dots = Math.floor((t - tow) * 2.5) % 4; bubble(420, 600, ['.'.repeat(Math.max(1, dots))], 1, { size: 60, maxw: 200, pw: 90, col: C.moon, k, tx: 260, ty: 760, seed: 3 }); }
};
// ---------- the phone ----------
const POSTS = [['#ff9a5a', '#5a2a6a', 'sunset'], ['#f0d0e0', '#c86a8a', 'cake'], ['#7ac8f0', '#f0d8a0', 'beach'], ['#d8e8f0', '#4a6a9a', 'couple'], ['#2a2a3a', '#e8c040', 'car'], ['#a8d8a0', '#3a7a4a', 'gym']];
const BEHIND = { en: ['took 47 tries', 'I feel so alone', 'we fought all day', "can't afford this", 'nobody came', 'filter, obviously'], tl: ["47 tries bago 'to", 'ang lungkot ko', 'nag-away kami buong araw', "di ko afford 'to", 'walang dumating', 'naka-filter, syempre'] }[LANG] || [];
function postPic(kind, x, y, w, h, c1, c2) {
  g.save(); rr(x, y, w, h, 10); g.clip(); g.fillStyle = lg(0, y, 0, y + h, [c1, c2]); g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h / 2;
  if (kind === 'sunset' || kind === 'beach') { circ(cx + w * .2, cy - h * .05, h * .16, '#ffe8a0'); g.fillStyle = 'rgba(30,60,120,.6)'; g.fillRect(x, cy + h * .15, w, h * .4); }
  if (kind === 'cake') { rr(cx - w * .22, cy - h * .05, w * .44, h * .3, 10); fs('#fff4f0', 3); rr(cx - w * .22, cy - h * .05, w * .44, h * .08, 10); fs('#e86a8a', 0); for (let k = 0; k < 3; k++) { line([[cx - w * .12 + k * w * .12, cy - h * .05], [cx - w * .12 + k * w * .12, cy - h * .2]], 6, '#f8f0c0'); circ(cx - w * .12 + k * w * .12, cy - h * .23, 6, '#ffb040'); } }
  if (kind === 'couple') { for (const sg of [-1, 1]) { circ(cx + sg * w * .12, cy - h * .1, h * .12, sg < 0 ? '#e8b894' : '#c48a64'); rr(cx + sg * w * .12 - h * .14, cy + h * .03, h * .28, h * .4, 30); g.fillStyle = sg < 0 ? '#e86a8a' : '#4a6aa0'; g.fill(); } PICS.heart(cx, cy - h * .32, 0, h * .2); }
  if (kind === 'car') { rr(cx - w * .32, cy, w * .64, h * .18, 20); fs('#e8c040', 3); path([[cx - w * .2, cy], [cx - w * .12, cy - h * .14], [cx + w * .14, cy - h * .14], [cx + w * .22, cy]]); g.closePath(); fs('#c8a030', 3); for (const sg of [-1, 1]) circ(cx + sg * w * .2, cy + h * .19, h * .07, '#1a1a20'); }
  if (kind === 'gym') { line([[cx - w * .3, cy], [cx + w * .3, cy]], 10, '#3a3a40'); for (const sg of [-1, 1]) rr(cx + sg * w * .3 - 14, cy - h * .15, 28, h * .3, 6), fs('#2a2a30', 2); }
  g.restore();
}
function phone(t, x, y, s, scroll, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  cshadow(0, 520, 300, 40, .5); rr(-250, -500, 500, 1000, 64); fs('#0e0e14', 8); rr(-232, -482, 464, 964, 50); g.fillStyle = '#f4f4f6'; g.fill();
  g.save(); rr(-232, -482, 464, 964, 50); g.clip();
  for (let i = 0; i < 6; i++) { const py = -440 + i * 560 - scroll % (560 * 6) + (i * 560 - scroll < -1000 ? 560 * 6 : 0), [c1, c2, kind] = POSTS[i];
    circ(-180, py + 10, 22, c2); rr(-145, py, 140, 14, 7); g.fillStyle = '#2a2a30'; g.fill(); rr(-145, py + 22, 90, 10, 5); g.fillStyle = '#9a9aa0'; g.fill();
    postPic(kind, -220, py + 50, 440, 400, c1, c2);
    PICS.heart(-195, py + 490, 0, 44); rr(-160, py + 482, 120, 14, 7); g.fillStyle = '#2a2a30'; g.fill(); }
  g.restore();
  rr(-60, -470, 120, 24, 12); g.fillStyle = '#0e0e14'; g.fill();
  g.restore();
}
// 17. you open your phone: perfect photos, perfect lives... and what you heard behind them
S.scroll = (t, u) => {
  const a = LN.n01b, b = LN.n01c, tbe = wordT('n01b', 'behind'), tin = wordT('n01c', 'inside'), thl = wordT('n01c', 'highlight'), tlo = wordT('n01c', 'lose');
  cam(CX, CY, 1); grad('#05060e', '#0e1020', -200, 1300); glow(CX, 560, 700, '160,190,255', .25);
  const side = ss(seg(t, b.t0, b.t0 + .8)), px = lerp(CX, 1380, side), sc = lerp(1.02, .86, side) * lerp(.96, 1, eo(seg(u, 0, .6)));
  phone(t, px, 560, sc * 1.0, (t - a.t0) * 140 * (1 - .8 * ss(seg(t, tbe - .5, tbe + .5))));
  if (t > tbe - .2 && t < b.t0 + .6) BEHIND.forEach((s, i) => { const on = tbe - .2 + i * .22, k = back(seg(t, on, on + .35), 1.6) * (1 - ss(seg(t, b.t0, b.t0 + .5))); if (k <= 0) return; const sg = i % 2 ? 1 : -1; murmur(px + sg * (420 + 60 * hash(i)), 200 + i * 130, 38, s, 1, BCOL[i], { k, tx: px + sg * 240, ty: 220 + i * 130 }); });
  if (side > 0) {
    reset(); const d_ = LN.n01d, pf = d_ ? 1 - ss(seg(t, d_.t0 - .1, d_.t0 + .4)) : 1, ik = back(seg(t, tin - .2, tin + .2), 1.6) * pf, hk = back(seg(t, thl - .2, thl + .2), 1.6) * pf, dim = ss(seg(t, tlo, tlo + .6));
    if (ik > 0) { g.save(); g.translate(520, 520); g.scale(ik * (1 - .1 * dim), ik * (1 - .1 * dim)); g.globalAlpha = 1 - .4 * dim; glass(-330, -300, 660, 600, 30, 'rgba(255,255,255,.4)', 3); for (let k = 0; k < 26; k++) { const pts = []; let x = 0, y = 0, a = hash(k) * TAU; for (let j = 0; j < 16; j++) { a += (hash(k * 16 + j) - .5) * 2.4; x = clamp(x + Math.cos(a) * 40, -260, 260); y = clamp(y + Math.sin(a) * 40, -200, 200); pts.push([x, y]); } line(pts, 3, `rgba(${BCOL[k % 6]},.55)`); } text(TX.inside, 0, 250, 48, '#fff', 'Anton', 'center', 8); g.restore(); }
    if (hk > 0) { g.save(); g.translate(1380, 140); g.scale(hk, hk); pill(TX.reel, 0, 0, 44, GOLD, C.gold, 1); g.restore(); for (let k = 0; k < 6; k++) { const p = (t * .3 + k / 6) % 1; star(1380 + (hash(k * 3) - .5) * 600, 900 - p * 700, 18 * Math.sin(Math.PI * p) * hk, '#ffe08a'); } }
    if (t > thl + .4) text('VS', 960, 520, 90, '#fff', 'Anton', 'center', 12, ss(seg(t, thl + .4, thl + .7)) * pf);
  }
  if (LN.n01d) thought('n01d', t, 560, 400, { col: C.moon, size: 56, maxw: 560, seed: 4, until: LN.n01e ? LN.n01e.t1 + .5 : undefined, a: LN.n01e ? 1 - .5 * ss(seg(t, LN.n01e.t0, LN.n01e.t0 + .5)) : 1 });
  if (LN.n01e && t > LN.n01e.t0) BEHIND.forEach((s, i) => { const on = wordT('n01e', 'Nobody') - .3 + i * .15, k = back(seg(t, on, on + .35), 1.6); if (k <= 0) return; murmur(1380 + (i % 2 ? 1 : -1) * (330 + 40 * hash(i)), 180 + i * 140, 34, s, 1, BCOL[i], { k, tx: 1380 + (i % 2 ? 1 : -1) * 190, ty: 200 + i * 140 }); });
};
// 18. not everyone has a voice in their head: words vs pictures
S.inner = (t, u) => {
  const a = LN.n02, tno = wordT('n02', 'Not'), tpi = wordT('n02', 'pictures');
  cam(CX, CY, lerp(1.05, 1.0, eo(seg(u, 0, 1.2)))); grad('#060814', '#14102c', -200, 1300);
  glow(560, 620, 500, C.cyan, .18); glow(1200, 620, 500, C.mag, .18 * ss(seg(t, tno, tno + .6)));
  face(560, 660, 170, { t, eyes: 'open', look: .3, lx: 1, rim: 'rgba(82,216,255,.6)' });
  const rk = ss(seg(t, tno - .1, tno + .5)); g.save(); g.globalAlpha = rk; face(1200, 660, 170, { t: t + 1, eyes: 'open', look: -.3, lx: -1, skin: SKINS[2], hair: HAIRS[1], rim: 'rgba(255,79,154,.6)' }); g.restore();
  for (let k = 0; k < 3; k++) { const p = ((t - a.t0) * .7 + k / 3) % 1; g.beginPath(); g.arc(560, 620, 200 + p * 220, -2.4, -.75); g.strokeStyle = `rgba(${C.cyan},${.45 * (1 - p)})`; g.lineWidth = 4; g.stroke(); }
  bubble(330, 280, (TX.innerWords || 'okay first I need to... wait, did I...').split(' '), 99, { size: 40, maxw: 360, col: C.cyan, k: back(seg(t, a.t0, a.t0 + .4), 1.6), tx: 470, ty: 470, seed: 1 });
  const pk = back(seg(t, tpi - .3, tpi + .1), 1.6); if (pk > 0) bubble(1600, 470, [], 0, { pw: 300, ph: 150, size: 34, col: C.mag, k: pk, tx: 1340, ty: 560, seed: 2, pic: (x, y) => { PICS.beach(x - 80, y, 140, 110); PICS.heart(x + 90, y - 20, 0, 70); for (let k = 0; k < 6; k++) circ(x + 60 + Math.cos(t * 2 + k) * 50, y + 40 + Math.sin(t * 2 + k) * 20, 8, `rgba(${BCOL[k]},.8)`); } });
  reset(); text(TX.voice, 560, 900, 46, CYAN, 'Anton', 'center', 8); text(TX.pics, 1200, 900, 46, MAG, 'Anton', 'center', 8, rk);
};
// 19. you're breathing manually now. You're welcome.
S.breathe = (t, u) => {
  const a = LN.n03, tma = wordT('n03', 'manually'), twe = wordT('n03', 'welcome');
  cam(CX, CY, 1); grad('#03100e', '#0a2420', -200, 1300);
  const ph = Math.max(0, t - tma + .6), br = .5 - .5 * Math.cos(ph * TAU / 3.2), k = back(seg(t, tma - .6, tma - .2), 1.5);
  for (let i = 4; i >= 0; i--) circ(CX, 500, (150 + 120 * br) * k * (1 + i * .18), `rgba(80,220,190,${.06 + (i ? 0 : .12)})`);
  circ(CX, 500, (150 + 120 * br) * k, 'rgba(120,255,220,.85)', 6); glow(CX, 500, 500 * k, '80,220,190', .3);
  text(Math.sin(ph * TAU / 3.2) >= 0 ? TX.bin : TX.bout, CX, 506, 56, '#e8fff8', 'Anton', 'center', 0, k);
  const wk = back(seg(t, twe - .2, twe + .2), 1.7); if (wk > 0) { reset(); g.save(); g.translate(1560, 300); g.scale(wk, wk); circ(0, 0, 90, '#ffd84a'); circ(0, 0, 90, OL, 6); circ(-30, -20, 12, OL); curve([10, -20], [30, -30], [50, -18], 7, OL); curve([-40, 30], [0, 62], [42, 26], 8, OL); g.restore(); pill(TX.welcome, 1560, 460, 40, GOLD, C.gold, wk); }
};
// ---------- the rooftop at midnight ----------
function rooftopSet(t, o = {}) {
  const post0 = cityView(t, { night: 1, orbs: o.orbs ?? 1, n: o.n ?? 150 }), back_ = keep();
  g.drawImage(TEX.concrete, -600, 860, 3200, 500); g.fillStyle = '#8a8a92'; g.fillRect(-600, 840, 3200, 26); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(-600, 840, 3200, 4);
  rr(-420, 620, 360, 230, 10); fs(lg(-420, 0, -60, 0, ['#7a8088', '#4a5058']), 5); for (let k = 0; k < 8; k++) line([[-400, 650 + k * 24], [-80, 650 + k * 24]], 3, 'rgba(0,0,0,.35)');
  rr(1980, 380, 260, 330, 30); fs(lg(1980, 0, 2240, 0, ['#5a4a3a', '#3a2e24']), 5); for (const lx2 of [2000, 2220]) line([[lx2, 700], [lx2, 860]], 12, '#2a2420');
  g.beginPath(); g.moveTo(-600, 760); for (let x = -600; x <= 2600; x += 40) g.lineTo(x, 760 + Math.sin((x + 600) / 3200 * Math.PI) * 50); g.strokeStyle = '#1a1a20'; g.lineWidth = 3; g.stroke();
  L(CX, 900, 1000, '255,190,120', .5, .1);
  return () => { post0(); back_(); for (let x = -560, k = 0; x <= 2560; x += 80, k++) { const y = 760 + Math.sin((x + 600) / 3200 * Math.PI) * 50 + 14, on = .7 + .3 * Math.sin(t * 2 + k); circ(x, y, 7, `rgba(255,220,150,${on})`); glow(x, y, 60, C.warm, .35 * on); } };
}
// 20. 11:59 PM: the voices fade. One last thought, from every direction at once. The secret.
S.midnight = (t, u) => {
  const a = LN.m01, b = LN.m02, c = LN.m03, tfa = wordT('m01', 'fade'), tla = wordT('m01', 'last'), tse = wordT('m03', 'secret'), tev = wordT('m03', 'Everyone');
  cam(CX, lerp(520, 560, seg(u, 0, 8)), lerp(1.0, 1.12, ss(seg(t, a.t0, b.t1))) * (t > c.t0 ? lerp(1, .95, ss(seg(t, c.t0, c.t1))) : 1));
  const post = rooftopSet(t, { orbs: lerp(1, .25, ss(seg(t, tfa - .3, tfa + 1))) * (t > tev ? 4 : 1), n: 150 });
  person(CX, 1080, 640, { t, sit: 1, arms: 'lap', eyes: 'open', look: 0, lookY: -.3, tired: .4, lx: -1, rim: 'rgba(255,214,160,.5)' });
  L(CX, 700, 500, C.warm, .7, .15);
  lightPass('#2a2a50'); post();
  const gold = t > tse ? ss(seg(t, tse, tse + .5)) : 0;
  // the last thought arrives from every side
  if (t > tla - .3) ECHO.concat(ECHO).forEach((s, i) => { const ang = i / 12 * TAU + .3, p = eo(seg(t, tla - .3 + i * .08, tla + 1.6 + i * .08)), r = lerp(1200, 330 + 60 * hash(i), p), x = CX + Math.cos(ang) * r * 1.4, y = 470 + Math.sin(ang) * r * .75; murmur(x, y, 32, s, ss(seg(t, tla - .3 + i * .08, tla + i * .08)) * (b.t0 < t ? .75 : 1), gold ? C.gold : BCOL[i % 6], { glowA: gold }); });
  thought('m02', t, CX, 300, { tx: CX, ty: 480, col: C.gold, size: 58, maxw: 700, seed: 3, until: c.t1 + .5, ink: '#fff6e0' });
  reset(); pill(TX.secret, CX, 860, 54, GOLD, C.gold, back(seg(t, tse - .1, tse + .25), 1.7));
};
// 21. mom, your brother, your boss, your crush: everyone, worried about the same thing
const MON = [['mom,', MOMC, 1, HAIRS[1], SKINS[1], C.amb, { en: 'is he okay?', tl: 'okay lang kaya siya?' }], ['brother,', GRNHOOD, 0, HAIRS[2], SKINS[1], C.cyan, { en: "please don't ask", tl: "'wag sanang magtanong" }], ['boss,', BOSSC, 0, HAIRS[3], SKINS[0], C.pur, { en: "I'm faking it", tl: 'nagkukunwari lang ako' }], ['crush,', CRUC, 1, HAIRS[1], SKINS[1], C.rose, { en: "don't say anything weird", tl: "'wag kang mag-weird" }]];
S.montage = (t, u) => {
  const a = LN.m03b; cam(CX, CY, 1); grad('#05060e', '#100c22', -200, 1300); reset();
  MON.forEach(([w, top, lh, hr, sk, col, th], i) => {
    const tw = wordT('m03b', w.replace(',', '')), on = back(seg(t, tw - .5, tw - .1), 1.4); if (on <= 0) return;
    const active = t > tw - .4 && (i === 3 || t < wordT('m03b', MON[i + 1][0].replace(',', '')) - .4), x0 = 40 + (i % 2) * 940, y0 = 40 + Math.floor(i / 2) * 500, pw = 900, ph = 470;
    g.save(); g.translate(x0 + pw / 2, y0 + ph / 2); g.scale(on, on); g.translate(-pw / 2, -ph / 2);
    rr(0, 0, pw, ph, 26); g.save(); g.clip();
    g.fillStyle = lg(0, 0, 0, ph, ['#1a1830', `rgba(${col},.35)`]); g.fillRect(0, 0, pw, ph); glow(250, 300, 360, col, .3);
    person(250, ph + 330, 620, { t: t + i, hood: top, outfit: i === 2 ? 'shirt' : 'hoodie', legs: SUIT, skin: sk, hair: hr, longHair: lh, arms: i === 2 ? 'rub' : 'down', eyes: active ? 'open' : 'open', look: .5, tired: .5, sweat: i >= 2 ? .6 : 0, lx: 1, rim: `rgba(${col},.6)` });
    bubble(620, 200, th[LANG] ? th[LANG].split(' ') : [], 99, { size: 46, maxw: 380, col, tx: 350, ty: 200, seed: i, k: 1 });
    g.fillStyle = `rgba(4,4,12,${active ? 0 : .55})`; g.fillRect(0, 0, pw, ph); g.restore();
    rr(0, 0, pw, ph, 26); g.strokeStyle = active ? `rgba(${col},1)` : 'rgba(255,255,255,.2)'; g.lineWidth = active ? 6 : 3; if (active) { g.shadowColor = `rgba(${col},.9)`; g.shadowBlur = 30; } g.stroke(); g.shadowBlur = 0;
    text(TX.mon[i], 840, 420, 54, active ? `rgb(${col})` : '#8a8aa0', 'Anton', 'right', 8);
    g.restore();
  });
};
// 22. nobody is watching you as closely as you think. Say the thing. Wear the shirt. Talk to the person. Midnight.
S.secret = (t, u) => {
  const a = LN.m04, b = LN.m05, c = LN.m06, tno = wordT('m05', 'Nobody'), tsa = wordT('m05', 'say'), twe = wordT('m05', 'Wear'), tta = wordT('m05', 'Talk'), tgo = wordT('m06', 'gone'), tkn = wordT('m06', 'know');
  const quiet = ss(seg(t, tgo - .3, tgo + 1.2));
  cam(CX, lerp(560, 500, ss(seg(t, a.t0, c.t1))), lerp(1.12, 1.0, ss(seg(t, a.t0, b.t1))) * (t > c.t0 ? lerp(1, .92, ss(seg(t, tkn, c.t1 + 1))) : 1));
  const post = rooftopSet(t, { orbs: 1 - quiet * .85, n: 170 });
  person(CX, 1090, 760, { t, arms: 'down', eyes: 'open', look: 0, lookY: -.2, smile: t > b.t0 ? 1 : 0, tired: .2, lx: -1, rim: 'rgba(255,214,160,.55)' });
  L(CX, 700, 600, C.warm, .7, .15);
  lightPass('#2a2a50'); post();
  swarm(t, 30, -400, 100, 2300, 800, .55 * (1 - ss(seg(t, b.t0, b.t0 + 1))), { seed: 31, list: ECHO, s0: 24, s1: 32, avoid: [CX, 520, 300] });
  if (t > a.t0) { g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 40; i++) { const p = ((t - a.t0) * .05 + hash(i * 3.3)) % 1, x = -300 + hash(i * 7.7) * 2500, y = lerp(700, -250, p); if (p < .7) { circ(x, y, 9, `rgba(${C.gold},${.6 * (1 - quiet)})`, 2); } else star(x, y, 6 + 4 * Math.sin(t * 3 + i), `rgba(255,240,200,${.8 * (1 - quiet * .5)})`); } g.restore(); }
  reset();
  pill(TX.nobody, CX, 120, 52, GOLD, C.gold, back(seg(t, tno, tno + .3), 1.7) * (1 - ss(seg(t, tsa - .2, tsa + .2))));
  TX.say.forEach((s, i) => { const tt_ = [tsa, twe, tta][i], k = back(seg(t, tt_ - .15, tt_ + .2), 1.8) * (1 - ss(seg(t, c.t0, c.t0 + .4))); pill(s, [430, CX, 1490][i], 150, 46, [CYAN, ROSE, GRN][i], [C.cyan, C.rose, C.grn][i], k); });
  if (t > tkn) glow(CX, 500, 900, C.gold, .25 * ss(seg(t, tkn, tkn + .8)));
};
// 23. the end: your score, your answers, whose thoughts you'd hear first... and what to watch next
S.outro = (t, u) => {
  const a = LN.o01, tsc = wordT('o01', 'score'), tan = wordT('o01', 'answers'), twh = wordT('o01', 'whose'), tne = wordT('o01', 'next');
  cam(CX, 520, 1.0); const post = cityView(t, { night: 1, orbs: .5, n: 80 }); lightPass('#26244a'); post();
  reset(); g.fillStyle = 'rgba(4,5,14,.55)'; g.fillRect(0, 0, W, H);
  const sk = back(seg(t, tsc - .2, tsc + .2), 1.6);
  if (sk > 0) { g.save(); g.translate(500, 330); g.scale(sk, sk); glass(-330, -170, 660, 340, 36, GOLD, 5, `rgba(${C.gold},.8)`); text(TX.end[0], 0, -95, 52, '#fff', 'Anton'); g.save(); g.shadowColor = `rgba(${C.gold},.95)`; g.shadowBlur = 36; text(TX.end[1], 0, 40, 150, GOLD, 'Anton'); g.restore(); g.restore(); }
  const ak = back(seg(t, tan - .2, tan + .2), 1.6); if (ak > 0) { pill('Q5: ?   Q6: ?', 500, 590, 40, '#fff', C.white, ak); }
  const wk = back(seg(t, twh - .3, twh + .1), 1.6); if (wk > 0) bubble(500, 820, (TX.whose || "whose thoughts would you hear first?").split(' '), 99, { size: 50, maxw: 560, col: C.rose, k: wk, seed: 4 });
  // the end screen: next video and subscribe (YouTube end-screen elements go here)
  const nk = back(seg(t, tne - .3, tne + .1), 1.5);
  if (nk > 0) { g.save(); g.translate(1410, 440); g.scale(nk, nk); rr(-380, -214, 760, 428, 20); g.save(); g.clip(); g.fillStyle = lg(0, -214, 0, 214, ['#1a1030', '#3a1830']); g.fillRect(-380, -214, 760, 428); eye(-200, 0, 100, 1, { eyes: 'wide', tired: 1, iris: '#5a3a2a' }); g.save(); g.font = '34px Anton'; const s1 = Math.min(1, 380 / g.measureText(TX.next2).width); g.font = '44px Anton'; const s2 = Math.min(1, 380 / g.measureText(TX.next3).width); g.translate(140, -30); g.save(); g.scale(s1, s1); text(TX.next2, 0, 0, 34, '#fff', 'Anton', 'center', 6); g.restore(); g.translate(0, 56); g.scale(s2, s2); text(TX.next3, 0, 0, 44, '#ff6a7a', 'Anton', 'center', 6); g.restore(); g.restore(); rr(-380, -214, 760, 428, 20); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.stroke(); g.restore(); pill(TX.next, 1410, 160, 40, '#fff', C.white, nk); }
  const ck = back(seg(t, a.t1 - .2, a.t1 + .3), 1.6); if (ck > 0) { g.save(); g.translate(1410, 860); g.scale(ck, ck); circ(0, 0, 120, 'rgba(8,10,22,.85)'); circ(0, 0, 120, RED, 6); text(TX.sub, 0, 6, 40, '#fff', 'Anton'); g.restore(); }
};

function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .2; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .5) { reset(); g.fillStyle = rg(CX, CY, H * .38, W * .62, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }

// ---------- frame ----------
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }   // same scene continues: no restart
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
for (const s of SHOTS) if (!S[s[2]]) S[s[2]] = STUB(s[2]);
const NOPUNCH = ['quiz', 'title', 'montage', 'outro', 'scroll', 'gap', 'breathe', 'inner', 'intrusive', 'kitchen', 'mom'];
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  const ln = TL.lines.find(l => l.words && t >= l.t0 && t < l.t1 + .2);
  ZK = 1; BLACK = 0; NOSTAT = 0;
  if (ln && ln.t1 - ln.t0 > 2.6 && !NOPUNCH.includes(sh[2])) { const mid = ln.words[Math.floor(ln.words.length / 2)][1]; ZK = 1 + .06 * eo(seg(t, mid, mid + .4)); }
  S[sh[2]](t, u);
  bloom();
  vignette(sh[2] === 'platform' ? .65 : .5);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .06; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  clockHUD(t, sh[2]);
  if (!['quiz', 'outro'].includes(sh[2])) statCard(t);
  if (BLACK) { reset(); g.fillStyle = `rgba(0,0,0,${BLACK})`; g.fillRect(0, 0, W, H); }
  captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

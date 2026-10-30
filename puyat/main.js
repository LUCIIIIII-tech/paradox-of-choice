// Puyat (what sleep loss does to you): a dark, painterly cartoon psychology reel, 1080x1920. Deterministic in t: window.renderAt(t).
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
// Look: every scene is drawn in its true colours, then darkened, and only the lights (lamp amber, screen cyan, moon blue,
// neon magenta, danger red) bring the colour back where they fall. Smooth camera only: no glitches, no jitter, no flicker.
const W = 1080, H = 1920, CX = W / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'); let g = cv.getContext('2d');
const LANG = new URLSearchParams(location.search).get('lang') || 'tl';     // tl (default) | en
const SUF = LANG === 'tl' ? '' : '.' + LANG;
const TL = await (await fetch(`timeline${SUF}.json`)).json();
const ANCH = SUF ? await (await fetch(`anchors${SUF}.json`)).json() : {};
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
const TX = {
  tl: { t1: 'PAANO KUNG HINDI KA NA', t2: 'MAKATULOG?', nico: 'NICO', cat: 'MINGMING', stamp: ['TOTOONG', 'NANGYARI'], paper: ['BINATILYO, 11 ARAW', 'NA HINDI NATULOG'],
        bottle: 'TULOG', where: 'NASAAN?', share: ['I-SHARE MO', 'SA LAGING PUYAT'], day: 'ARAW', file: 'KASO #264' },
  en: { t1: 'WHAT IF YOU COULD', t2: 'NEVER SLEEP?', nico: 'NICO', cat: 'MINGMING', stamp: ['THIS REALLY', 'HAPPENED'], paper: ['TEEN STAYS AWAKE', 'FOR 11 DAYS'],
        bottle: 'SLEEP', where: 'WHERE?', share: ['SEND THIS', 'TO A NIGHT OWL'], day: 'DAY', file: 'CASE #264' },
}[LANG];
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
const wordT = (id, w) => { w = ANCH[`${id}:${w}`] || w; const l = LN[id]; const x = l && l.words && l.words.find(v => v[0].toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(w.toLowerCase())); return x ? x[1] : (l ? l.t0 : 0); };
const span = id => LN[id].t1 - LN[id].t0;

let ZK = 1, BLACK = 0;      // ZK: a smooth push-in on the second half of long lines; BLACK: a blackout over everything but the captions
function reset() { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0; g.shadowColor = 'transparent'; g.filter = 'none'; g.setLineDash([]); }
function cam(cx, cy, z = 1, rot = 0, shake = 0, t = 0) {     // shake is smooth (sines), never random per frame
  reset(); g.translate(CX, 900);
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
TEX.paper = paint(mk(540, 960), (w, h) => { const id = g.createImageData(w, h); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (hash(i * .0731) - .5) * 70; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); });

// ---------- characters ----------
// a shaded fill: light->dark across the shape, plus a coloured rim on the far side
function shape(P, x0, x1, cols, o = {}) {
  const { lx = -1, rim = null, rw = 6, ol = 4 } = o;
  P(); g.fillStyle = lg(lx < 0 ? x0 : x1, 0, lx < 0 ? x1 : x0, 0, cols); g.fill();
  if (rim) { g.save(); P(); g.clip(); g.translate(lx * rw, 0); P(); g.lineWidth = rw * 2; g.strokeStyle = rim; g.stroke(); g.restore(); }
  if (ol) { P(); g.lineWidth = ol; g.strokeStyle = OL; g.lineJoin = 'round'; g.stroke(); }
}
// a limb with a lit edge and a shaded edge
function limb(pts, w, cols, lx = -1) { line(pts, w + w * .26 + 4, OL); line(pts, w, cols[1]); g.save(); g.translate(lx * w * .2, -w * .04); line(pts, w * .34, cols[0]); g.restore(); g.save(); g.translate(-lx * w * .3, 0); line(pts, w * .2, cols[2]); g.restore(); }
function hand(x, y, r, ang, o = {}) {
  const { sg = 1, grip = 0 } = o;
  g.save(); g.translate(x, y); g.rotate(ang);
  for (let i = 0; i < 4; i++) { const fy = (i - 1.5) * r * .38, Lf = r * (1.05 - Math.abs(i - 1.3) * .17) * (1 - grip * .5); rr(r * .3, fy - r * .17, Lf, r * .34, r * .17); fs(SKIN[1], r * .1); }
  ell(0, 0, r * .72, r * .8); fs(lg(-r, -r, r, r, [SKIN[0], SKIN[2]]), r * .1);
  g.save(); g.rotate(-sg * .95); rr(r * .15, -r * .16, r * .72, r * .32, r * .16); fs(SKIN[1], r * .1); g.restore();
  g.restore();
}
function shoe(x, y, s) {
  g.save(); g.translate(x, y);
  rr(-s, -s * .3, s * 2, s * .34, s * .16); fs('#c9c2b6', s * .12);
  g.beginPath(); g.moveTo(-s * .92, -s * .26); g.quadraticCurveTo(-s * .85, -s * .95, 0, -s * .98); g.quadraticCurveTo(s * .85, -s * .95, s * .92, -s * .26); g.closePath(); fs(lg(0, -s, 0, 0, ['#525873', '#23263a']), s * .12);
  for (let k = 0; k < 3; k++) line([[-s * .28, -s * (.76 - k * .16)], [s * .28, -s * (.76 - k * .16)]], s * .07, 'rgba(230,230,240,.6)');
  g.restore();
}
// a close, detailed eye: socket shade, bags, almond sclera, iris fibres, catchlights, lid shadow, drooping lid, lashes, crease
function eye(ex, ey, er, sg, o) {
  const { eyes = 'open', look = 0, lookY = 0, tired = 0, lid = null, iris = '#6a4a33' } = o;
  g.fillStyle = rg(ex, ey, er * .4, er * 1.9, [`rgba(70,30,55,${.12 + .35 * tired})`, 'rgba(70,30,55,0)']); g.fillRect(ex - er * 2, ey - er * 2, er * 4, er * 4);
  if (tired > .05) for (let k = 0; k < (tired > .5 ? 2 : 1); k++) {
    const yy = ey + er * (.95 + k * .4), dep = er * (.32 + .32 * tired);
    g.save(); g.globalAlpha = clamp(tired * 1.4) * (k ? .55 : .9); g.beginPath(); g.moveTo(ex - er, yy); g.quadraticCurveTo(ex, yy + dep * 1.6, ex + er, yy); g.quadraticCurveTo(ex, yy + dep * .5, ex - er, yy); g.fillStyle = '#5b3a6e'; g.fill(); g.restore();
    curve([ex - er * .85, yy + er * .06], [ex, yy + dep * 1.45], [ex + er * .85, yy + er * .06], er * .07, `rgba(55,20,55,${.65 * tired})`);
  }
  if (eyes === 'shut') {
    g.beginPath(); g.moveTo(ex - er * 1.05, ey); g.quadraticCurveTo(ex, ey + er * .75, ex + er * 1.05, ey); g.lineWidth = er * .15; g.strokeStyle = OL; g.lineCap = 'round'; g.stroke();
    for (let k = 0; k < 4; k++) { const u = .2 + k * .2, px = ex - er * 1.05 + 2.1 * er * u, py = ey + er * .75 * 2 * u * (1 - u); line([[px, py], [px + sg * er * .06, py + er * .24]], er * .06, OL); }
    return;
  }
  const Hh = er * (eyes === 'wide' ? 1.0 : .76);
  const A = () => { g.beginPath(); g.moveTo(ex - er * 1.05, ey + er * .05); g.bezierCurveTo(ex - er * .6, ey - Hh * 1.25, ex + er * .6, ey - Hh * 1.25, ex + er * 1.05, ey - er * .02); g.bezierCurveTo(ex + er * .6, ey + Hh * 1.0, ex - er * .6, ey + Hh * 1.0, ex - er * 1.05, ey + er * .05); g.closePath(); };
  A(); g.fillStyle = rg(ex, ey, er * .15, er * 1.2, ['#f7f2eb', '#cdbfb6']); g.fill();
  g.save(); A(); g.clip();
  if (tired > .45) { g.strokeStyle = `rgba(205,40,60,${(tired - .45) * 1.3})`; g.lineWidth = er * .025; for (let i = 0; i < 8; i++) { const sd = i % 2 ? -1 : 1, yy = ey + (hash(i * 3 + sg) - .5) * er * .9; g.beginPath(); g.moveTo(ex + sd * er, yy); g.quadraticCurveTo(ex + sd * er * .6, yy + (hash(i) - .5) * er * .4, ex + sd * er * .35, yy + (hash(i + 2) - .5) * er * .6); g.stroke(); } }
  const ir = er * (eyes === 'wide' ? .47 : .54), ix = ex + look * er * .42, iy = ey + lookY * er * .3 + er * .03;
  circ(ix, iy, ir, rg(ix, iy, ir * .12, ir, ['#c79058', iris, '#1e130c']));
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; line([[ix + Math.cos(a) * ir * .38, iy + Math.sin(a) * ir * .38], [ix + Math.cos(a) * ir * .86, iy + Math.sin(a) * ir * .86]], er * .022, 'rgba(255,220,170,.22)'); }
  circ(ix, iy, ir, 'rgba(20,10,5,.7)', er * .05);
  circ(ix, iy, ir * (eyes === 'wide' ? .3 : .44), '#050305');
  circ(ix - ir * .36, iy - ir * .38, ir * .22, 'rgba(255,255,255,.95)'); circ(ix + ir * .32, iy + ir * .3, ir * .09, 'rgba(255,255,255,.7)');
  g.fillStyle = lg(0, ey - Hh, 0, ey - Hh * .15, ['rgba(40,18,30,.55)', 'rgba(40,18,30,0)']); g.fillRect(ex - er * 1.2, ey - Hh * 1.3, er * 2.4, Hh * 1.2);
  const dr = eyes === 'wide' ? 0 : clamp(lid ?? tired * .55);
  if (dr > 0) { const ly = ey - Hh * 1.0 + Hh * 1.9 * dr; g.beginPath(); g.moveTo(ex - er * 1.3, ey - Hh * 1.5); g.lineTo(ex + er * 1.3, ey - Hh * 1.5); g.lineTo(ex + er * 1.3, ly); g.quadraticCurveTo(ex, ly + Hh * .28, ex - er * 1.3, ly); g.closePath(); g.fillStyle = lg(0, ey - Hh, 0, ly, [SKIN[1], SKIN[2]]); g.fill(); g.beginPath(); g.moveTo(ex - er * 1.3, ly); g.quadraticCurveTo(ex, ly + Hh * .28, ex + er * 1.3, ly); g.strokeStyle = OL; g.lineWidth = er * .13; g.stroke(); }
  g.restore();
  g.beginPath(); g.moveTo(ex - er * 1.05, ey + er * .05); g.bezierCurveTo(ex - er * .6, ey - Hh * 1.25, ex + er * .6, ey - Hh * 1.25, ex + er * 1.05, ey - er * .02); g.strokeStyle = OL; g.lineWidth = er * .15; g.lineCap = 'round'; g.stroke();
  for (let k = 0; k < 3; k++) { const ox = ex + sg * er * (1.0 - k * .16), oy = ey - er * (.05 + k * .22); line([[ox, oy], [ox + sg * er * .22, oy - er * .14]], er * .06, OL); }
  g.beginPath(); g.moveTo(ex - er, ey + er * .08); g.bezierCurveTo(ex - er * .6, ey + Hh * .98, ex + er * .6, ey + Hh * .98, ex + er, ey); g.strokeStyle = 'rgba(60,20,30,.75)'; g.lineWidth = er * .06; g.stroke();
  curve([ex - er * .8, ey - Hh * 1.15], [ex, ey - Hh * 1.6], [ex + er * .9, ey - Hh * 1.05], er * .05, 'rgba(110,55,55,.55)');
}
// the face: egg-shaped head, light from lx, coloured rim on the far side, ears, nose, mouth, layered hair
function face(x, y, r, o = {}) {
  const { t = 0, tired = 0, eyes = 'open', mouth = 0, smile = 0, sweat = 0, lx = -1, rim = null, ears = 1, hair = HAIRC } = o;
  const P = () => { g.beginPath(); g.moveTo(x, y - r); g.bezierCurveTo(x + r * .6, y - r, x + r, y - r * .6, x + r, y - r * .05); g.bezierCurveTo(x + r, y + r * .55, x + r * .55, y + r * .98, x, y + r * .98); g.bezierCurveTo(x - r * .55, y + r * .98, x - r, y + r * .55, x - r, y - r * .05); g.bezierCurveTo(x - r, y - r * .6, x - r * .6, y - r, x, y - r); g.closePath(); };
  if (ears) for (const sg of [-1, 1]) { const ex = x + sg * r * .95, ey = y + r * .12; ell(ex, ey, r * .17, r * .25, sg * .15); fs(sg === lx ? SKIN[1] : SKIN[2], r * .05); curve([ex - sg * r * .02, ey - r * .14], [ex + sg * r * .1, ey], [ex - sg * r * .01, ey + r * .14], r * .035, 'rgba(90,40,40,.6)'); }
  P(); g.fillStyle = rg(x + lx * r * .4, y - r * .4, r * .1, r * 1.3, [SKIN[0], SKIN[1], SKIN[2]]); g.fill();
  g.save(); P(); g.clip();
  g.beginPath(); g.rect(x - 2 * r, y - 2 * r, 4 * r, 4 * r); g.arc(x + lx * r * .25, y - r * .15, r * 1.0, 0, TAU); g.fillStyle = 'rgba(70,25,45,.3)'; g.fill('evenodd');
  g.fillStyle = lg(0, y + r * .7, 0, y + r, ['rgba(70,25,45,0)', 'rgba(70,25,45,.25)']); g.fillRect(x - r, y + r * .7, 2 * r, r * .3);
  if (rim) { g.globalAlpha = .8; g.translate(lx * r * .045, 0); P(); g.lineWidth = r * .08; g.strokeStyle = rim; g.stroke(); }
  g.restore();
  P(); g.strokeStyle = OL; g.lineWidth = r * .055; g.stroke();
  for (const sg of [-1, 1]) { const bx = x + sg * r * .55, by = y + r * .38; g.fillStyle = rg(bx, by, 0, r * .26, ['rgba(230,90,100,.26)', 'rgba(230,90,100,0)']); g.fillRect(bx - r * .3, by - r * .3, r * .6, r * .6); }
  curve([x - lx * r * .02, y + r * .14], [x - lx * r * .14, y + r * .34], [x + lx * r * .07, y + r * .37], r * .045, 'rgba(110,55,50,.85)');
  circ(x + lx * r * .04, y + r * .26, r * .035, 'rgba(255,240,225,.45)');
  for (const sg of [-1, 1]) {
    const ex = x + sg * r * .37, ey = y + r * .03, er = r * .21;
    eye(ex, ey, er, sg, o);
    const wor = eyes === 'wide' || tired > .65 ? 1 : 0, by = ey - er * (eyes === 'wide' ? 1.95 : 1.7), ix = ex - sg * er * .95, ox = ex + sg * er * 1.1;
    g.beginPath(); g.moveTo(ix, by + (wor ? -er * .35 : er * .1)); g.quadraticCurveTo(ex, by - er * .35, ox, by + er * (.2 + .15 * wor)); g.strokeStyle = hair[0]; g.lineWidth = r * .085; g.lineCap = 'round'; g.stroke();
  }
  const my = y + r * .6;
  if (mouth > .05) {
    const mw = r * (.15 + .05 * mouth), mh = r * (.06 + .24 * mouth), mc_ = my + mh * .3;
    ell(x, mc_, mw, mh); g.fillStyle = '#2a0812'; g.fill();
    g.save(); ell(x, mc_, mw, mh); g.clip(); g.fillStyle = '#efe6da'; g.fillRect(x - mw, mc_ - mh, mw * 2, mh * .34); ell(x, mc_ + mh * .85, mw * .7, mh * .45); g.fillStyle = '#b8455a'; g.fill(); g.restore();
    ell(x, mc_, mw, mh); g.strokeStyle = OL; g.lineWidth = r * .05; g.stroke();
  } else if (smile) { curve([x - r * .2, my - r * .05], [x, my + r * .14], [x + r * .2, my - r * .05], r * .055, '#4a1a22'); curve([x - r * .08, my + r * .13], [x, my + r * .17], [x + r * .08, my + r * .13], r * .03, 'rgba(150,60,60,.5)'); }
  else { const dn = tired * r * .05; g.beginPath(); g.moveTo(x - r * .17, my + dn); g.quadraticCurveTo(x, my - r * .04, x + r * .17, my + dn); g.strokeStyle = '#4a1a22'; g.lineWidth = r * .05; g.lineCap = 'round'; g.stroke(); curve([x - r * .08, my + r * .08], [x, my + r * .12], [x + r * .08, my + r * .08], r * .03, 'rgba(120,50,50,.45)'); }
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
// Nico, front view. (x, y) = feet. arms: down | hold (a mug) | out | type | up | rub. sit 0..1, walk = phase or null, sway -1..1
function nico(x, y, h, o = {}) {
  const { t = 0, walk = null, arms = 'down', sit = 0, sway = 0, hood = HOODC, lx = -1, rim = null, mug = 0, ground = 1 } = o;
  const lw = h * .052, sw = walk === null ? 0 : Math.sin(walk), bob = walk === null ? 0 : Math.abs(Math.cos(walk)) * h * .012, br = Math.sin(t * 2.1) * h * .004;
  const hip = [x, y - h * .42 + sit * h * .16 - bob], neck = [x + sway * h * .04, y - h * .71 - bob + sit * h * .1 - br], hc = [x + sway * h * .09, y - h * .855 - bob + sit * h * .1 - br];
  if (ground) cshadow(x, y, h * .2, h * .028, .6);
  for (const sg of [-1, 1]) {
    let k, f;
    if (sit) { k = [x + sg * h * .1, hip[1] + h * .06]; f = [x + sg * h * .12, hip[1] + h * .3]; }
    else { f = [x + sg * h * .07 + sg * sw * h * .1, y - Math.max(0, -sg * sw) * h * .03]; k = [(hip[0] + f[0]) / 2 + sg * h * .015, (hip[1] + f[1]) / 2]; }
    limb([[hip[0] + sg * h * .055, hip[1]], k, f], lw * 1.2, JEANC, lx);
    line([[k[0] - h * .02, k[1]], [k[0] + h * .02, k[1] + h * .01]], h * .004, 'rgba(0,0,10,.35)');
    shoe(f[0] + sg * h * .012, f[1], h * .05);
  }
  ell(neck[0], neck[1] + h * .012, h * .105, h * .05); fs(hood[2], h * .007);
  rr(neck[0] - h * .032, neck[1] - h * .05, h * .064, h * .08, h * .02); g.fillStyle = SKIN[2]; g.fill();
  const P = () => { g.beginPath(); g.moveTo(neck[0] - h * .125, neck[1] + h * .03); g.quadraticCurveTo(neck[0], neck[1] - h * .025, neck[0] + h * .125, neck[1] + h * .03); g.quadraticCurveTo(neck[0] + h * .15, neck[1] + h * .06, hip[0] + h * .13, hip[1] + h * .02); g.lineTo(hip[0] + h * .125, hip[1] + h * .05); g.quadraticCurveTo(hip[0], hip[1] + h * .075, hip[0] - h * .125, hip[1] + h * .05); g.lineTo(hip[0] - h * .13, hip[1] + h * .02); g.quadraticCurveTo(neck[0] - h * .15, neck[1] + h * .06, neck[0] - h * .125, neck[1] + h * .03); g.closePath(); };
  shape(P, x - h * .15, x + h * .15, hood, { lx, rim, rw: h * .011, ol: h * .008 });
  g.save(); P(); g.clip();
  g.fillStyle = 'rgba(0,0,10,.22)'; g.fillRect(x - h * .2, hip[1] + h * .015, h * .4, h * .07);
  for (let k = -10; k <= 10; k++) line([[x + k * h * .012, hip[1] + h * .02], [x + k * h * .012, hip[1] + h * .07]], h * .002, 'rgba(0,0,10,.25)');
  for (const sg of [-1, 1]) curve([neck[0] + sg * h * .1, neck[1] + h * .08], [neck[0] + sg * h * .05, neck[1] + h * .16], [neck[0] + sg * h * .085, neck[1] + h * .24], h * .006, 'rgba(0,0,10,.35)');
  curve([x - h * .06, hip[1] - h * .02], [x, hip[1] - h * .035], [x + h * .07, hip[1] - h * .015], h * .005, 'rgba(0,0,10,.3)');
  g.beginPath(); g.moveTo(x - h * .085, hip[1] - h * .095); g.lineTo(x + h * .085, hip[1] - h * .095); g.lineTo(x + h * .1, hip[1] - h * .01); g.lineTo(x - h * .1, hip[1] - h * .01); g.closePath(); g.fillStyle = 'rgba(0,0,10,.12)'; g.fill(); g.strokeStyle = 'rgba(0,0,10,.45)'; g.lineWidth = h * .004; g.stroke();
  g.setLineDash([h * .008, h * .006]); line([[x - h * .078, hip[1] - h * .085], [x + h * .078, hip[1] - h * .085]], h * .003, 'rgba(255,255,255,.2)'); g.setLineDash([]);
  g.restore();
  for (const sg of [-1, 1]) { const a = [neck[0] + sg * h * .025, neck[1] + h * .035], b = [neck[0] + sg * h * .032 + Math.sin(t * 2 + sg) * h * .003, neck[1] + h * .13]; line([a, b], h * .006, '#d8d4cc'); rr(b[0] - h * .004, b[1], h * .008, h * .016, h * .003); g.fillStyle = '#9a968e'; g.fill(); }
  const shs = [[neck[0] - h * .115, neck[1] + h * .06], [neck[0] + h * .115, neck[1] + h * .06]], wv = Math.sin(t * 7) * h * .02;
  const drawArms = () => [-1, 1].forEach((sg, i) => {
    const s0 = shs[i]; let e, hd;
    if (arms === 'hold' && sg > 0) { e = [s0[0] + sg * h * .06, s0[1] + h * .17]; hd = [s0[0] - sg * h * .05, s0[1] + h * .12]; }
    else if (arms === 'out') { e = [s0[0] + sg * h * .15, s0[1] + h * .03 + sg * wv]; hd = [s0[0] + sg * h * .3, s0[1] - h * .01 + sg * wv * 1.5]; }
    else if (arms === 'type') { e = [s0[0] + sg * h * .07, s0[1] + h * .18]; hd = [s0[0] - sg * h * .02 + Math.sin(t * 22 + sg) * h * .01, s0[1] + h * .24]; }
    else if (arms === 'up') { e = [s0[0] + sg * h * .1, s0[1] - h * .13]; hd = [s0[0] + sg * h * .08, s0[1] - h * .3]; }
    else if (arms === 'rub') { e = [s0[0] + sg * h * .09, s0[1] + h * .08]; hd = [hc[0] + sg * h * .055, hc[1] + h * .02 + Math.sin(t * 9 + sg) * h * .01]; }
    else { const s2 = walk === null ? 0 : -sg * sw; e = [s0[0] + sg * h * .04 + s2 * h * .05, s0[1] + h * .15]; hd = [s0[0] + sg * h * .05 + s2 * h * .1, s0[1] + h * .3]; }
    limb([s0, e, hd], lw, hood, lx);
    const dx = hd[0] - e[0], dy = hd[1] - e[1], d = Math.hypot(dx, dy) || 1, c0 = [hd[0] - dx / d * h * .028, hd[1] - dy / d * h * .028];
    line([c0, hd], lw + 5, OL); line([c0, hd], lw * .92, hood[2]);
    hand(hd[0] + dx / d * h * .015, hd[1] + dy / d * h * .015, h * .03, Math.atan2(dy, dx), { sg: sg * (dy > 0 ? 1 : -1), grip: arms === 'hold' && sg > 0 ? 1 : 0 });
    if (mug && sg > 0 && arms === 'hold') mugAt(hd[0] + h * .005, hd[1] - h * .01, h * .085, t);
  });
  if (arms !== 'rub') drawArms();
  face(hc[0], hc[1], h * .14, { ...o, lx, rim });
  if (arms === 'rub') drawArms();
}
function mugAt(x, y, s, t, steam = 1) {   // a ceramic mug: body, rim, coffee, handle, a drip, steam
  g.save(); g.translate(x, y);
  circ(s * .55, -s * .45, s * .26, OL, s * .16); circ(s * .55, -s * .45, s * .26, '#a8353f', s * .09);
  rr(-s * .5, -s * .9, s, s * .9, s * .12); fs(lg(-s * .5, 0, s * .5, 0, ['#d9535f', '#a8353f', '#5e1a24']), s * .07);
  ell(0, -s * .9, s * .5, s * .12); fs('#efe0d0', s * .06); ell(0, -s * .9, s * .4, s * .08); g.fillStyle = '#3a2216'; g.fill();
  line([[-s * .25, -s * .85], [-s * .27, -s * .55]], s * .05, 'rgba(60,30,20,.7)');
  g.restore();
  if (steam) for (let k = 0; k < 3; k++) { const p = (t * .35 + k / 3) % 1; g.save(); g.globalAlpha = .45 * Math.sin(Math.PI * p); curve([x - s * .15 + k * s * .15, y - s * .95 - p * s * .8], [x + Math.sin(t * 2 + k) * s * .3, y - s * 1.3 - p * s * .9], [x + k * s * .1, y - s * 1.6 - p * s], s * .05, '#e8ecf5'); g.restore(); }
}
// Mingming: a curled orange tabby with stripes, fur, a tucked paw; awake = glowing eyes
function cat(x, y, s, o = {}) {
  const { t = 0, awake = 0, look = 0, flip = 1 } = o;
  g.save(); g.translate(x, y); g.scale(s * flip, s); const br = Math.sin(t * 2.2) * 2.5;
  const TP = () => { g.beginPath(); g.moveTo(58, 10); g.bezierCurveTo(112, 30, 92, 64, 40, 62); g.bezierCurveTo(0, 60, -30, 58, -54, 46); };
  TP(); g.lineCap = 'round'; g.strokeStyle = OL; g.lineWidth = 31; g.stroke(); g.strokeStyle = '#b8642a'; g.lineWidth = 22; g.stroke(); g.save(); g.translate(0, -4); TP(); g.strokeStyle = 'rgba(255,190,120,.35)'; g.lineWidth = 7; g.stroke(); g.restore();
  for (let k = 0; k < 4; k++) { const px = 90 - k * 30, py = 44 + k * 6; line([[px, py - 9], [px - 6, py + 9]], 5, 'rgba(90,35,10,.6)'); }
  ell(0, 4, 84, 48 + br); g.fillStyle = rg(-20, -24, 10, 105, ['#f2a65c', '#c9712e', '#7a3e18'], 0, 4); g.fill();
  g.save(); ell(0, 4, 84, 48 + br); g.clip();
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 22 - 10, -44 - br); g.quadraticCurveTo(i * 22 + 8, -22, i * 22 - 2, -2); g.lineTo(i * 22 + 6, -4); g.quadraticCurveTo(i * 22 + 14, -24, i * 22 - 2, -46 - br); g.closePath(); g.fillStyle = 'rgba(105,42,14,.55)'; g.fill(); }
  ell(-10, 36, 72, 22); g.fillStyle = 'rgba(255,228,195,.35)'; g.fill();
  g.restore();
  ell(0, 4, 84, 48 + br); g.strokeStyle = OL; g.lineWidth = 6; g.stroke();
  for (let k = 0; k < 20; k++) { const a = Math.PI * 1.05 + k / 20 * Math.PI * .9, px = Math.cos(a) * 84, py = 4 + Math.sin(a) * (48 + br); line([[px, py], [px + Math.cos(a + .3) * 8, py + Math.sin(a + .3) * 8]], 2.6, OL); }
  ell(-40, 42, 22, 12); fs('#e8b07a', 4); for (let k = -1; k <= 1; k++) line([[-40 + k * 8, 35], [-40 + k * 8, 43]], 2, 'rgba(26,10,5,.6)');
  const hx = -66, hy = -14 - br * .5;
  for (const sg of [-1, 1]) { path([[hx + sg * 34, hy - 12], [hx + sg * 27, hy - 60], [hx + sg * 4, hy - 34]]); g.closePath(); fs('#c9712e', 6); path([[hx + sg * 27, hy - 22], [hx + sg * 24, hy - 46], [hx + sg * 12, hy - 32]]); g.closePath(); g.fillStyle = '#e89aa0'; g.fill(); for (let k = 0; k < 3; k++) line([[hx + sg * (20 + k * 3), hy - 26], [hx + sg * (18 + k * 4), hy - 38]], 1.5, 'rgba(255,240,230,.7)'); }
  g.beginPath(); g.moveTo(hx - 40, hy); g.quadraticCurveTo(hx - 42, hy - 36, hx, hy - 38); g.quadraticCurveTo(hx + 42, hy - 36, hx + 40, hy); for (let k = 0; k <= 4; k++) g.lineTo(hx + 40 - k * 4, hy + 10 + (k % 2) * 8); g.quadraticCurveTo(hx, hy + 40, hx - 24, hy + 26); for (let k = 0; k <= 4; k++) g.lineTo(hx - 24 - k * 4, hy + 18 - (k % 2) * 8); g.closePath();
  fs(rg(hx - 12, hy - 18, 4, 48, ['#f4ad66', '#cf7632', '#8a4a1c']), 6);
  for (const sg of [-1, 1]) line([[hx + sg * 8, hy - 34], [hx + sg * 6, hy - 22]], 4, 'rgba(105,42,14,.6)');
  for (const sg of [-1, 1]) {
    if (awake) { ell(hx + sg * 15, hy - 4, 10, 12); fs(rg(hx + sg * 15, hy - 4, 1, 12, ['#f4ffa8', '#b4dc3c', '#5c7a14']), 3); ell(hx + sg * 15 + look * 3, hy - 4, 2.6, 9); g.fillStyle = OL; g.fill(); circ(hx + sg * 15 - 3, hy - 8, 2.2, '#fff'); }
    else { curve([hx + sg * 15 - 9, hy - 4], [hx + sg * 15, hy + 4], [hx + sg * 15 + 9, hy - 4], 4, OL); }
    for (let k = 0; k < 3; k++) line([[hx + sg * 14, hy + 10 + k * 3], [hx + sg * 46, hy + 4 + k * 8]], 1.6, 'rgba(255,245,235,.75)');
  }
  path([[hx - 6, hy + 6], [hx + 6, hy + 6], [hx, hy + 12]]); g.closePath(); g.fillStyle = '#e07a8a'; g.fill();
  curve([hx, hy + 12], [hx - 4, hy + 18], [hx - 9, hy + 15], 2, OL); curve([hx, hy + 12], [hx + 4, hy + 18], [hx + 9, hy + 15], 2, OL);
  g.restore();
  if (awake) for (const sg of [-1, 1]) glow(x + (hx + sg * 15) * s * flip, y + (hy - 4) * s, 34 * s, '190,240,90', .35);
}
// the shadow figure: tall, thin, smoky, two pin-point eyes
function shadow(x, y, h, o = {}) {
  const { t = 0, eyes = 1, alpha = 1, hunch = .25 } = o;
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); const s = h / 900; g.scale(s, s);
  const sway = Math.sin(t * 1.3) * 8, hx = sway + 60 * hunch, hy = -800;
  for (let i = 0; i < 18; i++) { const side = i % 2 ? 1 : -1, y0 = -760 + (i / 18) * 760, x0 = side * 66 + sway; const wv = Math.sin(t * 2 + i) * 30, Ls = 60 + 60 * hash(i); g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo(x0 + side * Ls * .5, y0 - 20 + wv, x0 + side * Ls, y0 - 60, x0 + side * Ls * 1.3 + wv, y0 - 120); g.strokeStyle = `rgba(4,2,10,${.4 + .3 * hash(i + 4)})`; g.lineWidth = 10 + 10 * hash(i + 2); g.lineCap = 'round'; g.stroke(); }
  g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 40; g.fillStyle = '#050208'; ell(hx, hy, 72, 100, hunch * .6); g.fill();
  g.beginPath(); g.moveTo(-95 + sway, -700); g.quadraticCurveTo(sway, -770, 105 + sway + 40 * hunch, -690); g.quadraticCurveTo(80, -500, 66, -330); g.lineTo(58, 0); g.lineTo(16, 0); g.lineTo(0, -290); g.lineTo(-16, 0); g.lineTo(-58, 0); g.quadraticCurveTo(-80, -500, -95 + sway, -700); g.closePath(); g.fill();
  g.strokeStyle = '#050208'; g.lineWidth = 30; g.lineCap = 'round';
  for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(sg * 85 + sway, -680); g.quadraticCurveTo(sg * 140, -440, sg * 120, -150); g.stroke(); g.lineWidth = 9; for (let k = 0; k < 4; k++) { const a = Math.PI / 2 + sg * (-.35 + k * .22) + Math.sin(t * 3 + k) * .05; g.beginPath(); g.moveTo(sg * 120, -150); g.quadraticCurveTo(sg * 120 + Math.cos(a) * 60, -150 + Math.sin(a) * 60, sg * 120 + Math.cos(a + sg * .3) * 120, -150 + Math.sin(a + sg * .3) * 120); g.stroke(); } g.lineWidth = 30; }
  g.shadowBlur = 0;
  if (eyes > 0) for (const sg of [-1, 1]) { glow(hx + sg * 28, hy - 10, 70, C.white, .4 * eyes); circ(hx + sg * 28, hy - 10, 8 * eyes + 3, '#fff'); }
  g.restore();
}

// ---------- places (each returns a post-light step: the emissive things, beams and dust) ----------
// the bedroom from above (the hook, the loop, the phone): Nico on his back, staring up at you
function topDown(t, o = {}) {
  const { eyes = 'wide', tired = .35, look = 0, phone = 1 } = o, back_ = keep();
  g.drawImage(TEX.floorTop, -260, -420);
  g.drawImage(TEX.rugTop, 40, 1225);
  for (const [sx, sy, r_] of [[250, 1330, -.3], [330, 1362, -.1]]) { g.save(); g.translate(sx, sy); g.rotate(r_); cshadow(4, 6, 34, 60, .5); ell(0, 0, 28, 58); fs('#5d6178', 4); ell(0, -16, 22, 26); g.fillStyle = '#7d819a'; g.fill(); for (let k = 0; k < 5; k++) line([[-14 + k * 7, -34], [-14 + k * 7, -4]], 1.5, 'rgba(255,255,255,.12)'); g.restore(); }
  // nightstands
  for (const nx of [120, 960]) { cshadow(nx + 12, 600, 125, 135, .55); rr(nx - 100, 470, 200, 230, 18); fs(lg(nx - 100, 470, nx + 100, 700, ['#7a4e36', '#4a2c1f']), 6); rr(nx - 88, 482, 176, 206, 12); g.strokeStyle = 'rgba(255,220,180,.13)'; g.lineWidth = 3; g.stroke(); for (let k = 0; k < 7; k++) curve([nx - 85, 495 + k * 30], [nx, 505 + k * 30 + 6 * Math.sin(k)], [nx + 85, 492 + k * 30], 1.5, 'rgba(25,10,5,.25)'); }
  // left: two books and the lamp seen from above
  g.save(); g.translate(78, 640); g.rotate(-.2); rr(-46, -30, 92, 60, 4); fs('#2c4a6a', 4); rr(-40, -24, 80, 48, 3); g.fillStyle = '#e8e0d0'; g.fill(); g.restore();
  g.save(); g.translate(86, 628); g.rotate(.15); rr(-42, -26, 84, 52, 4); fs('#7a2a34', 4); line([[-30, -10], [30, -10]], 3, '#c9a85a'); g.restore();
  circ(130, 560, 84, rg(130, 560, 10, 84, ['#fff6dc', '#f0d49a', '#a88454'])); circ(130, 560, 84, OL, 6); circ(130, 560, 60, 'rgba(120,80,40,.35)', 4); circ(130, 560, 26, '#fff9e6');
  // right: the clock, the phone, a glass of water
  rr(885, 498, 150, 82, 14); fs(lg(0, 498, 0, 580, ['#2a2b36', '#111219']), 5); rr(895, 508, 130, 62, 8); g.fillStyle = '#07070b'; g.fill();
  if (phone) { g.save(); g.translate(950, 642); g.rotate(.25); rr(-40, -64, 80, 128, 14); fs('#15161f', 5); g.restore(); }
  circ(1010, 660, 26, 'rgba(180,210,240,.35)'); circ(1010, 660, 26, 'rgba(230,240,255,.7)', 3); circ(1002, 652, 7, 'rgba(255,255,255,.6)');
  // the bed
  cshadow(552, 870, 360, 600, .55);
  rr(240, 330, 600, 1060, 34); fs(lg(240, 0, 840, 0, ['#5a3828', '#3a2219', '#5a3828']), 8);
  rr(256, 346, 568, 1028, 24); g.strokeStyle = 'rgba(255,220,180,.15)'; g.lineWidth = 3; g.stroke();
  rr(232, 300, 616, 64, 22); fs(lg(0, 300, 0, 364, ['#6a4430', '#3a2219']), 7); line([[262, 332], [818, 332]], 3, 'rgba(255,220,180,.18)');
  for (const [px, py] of [[252, 318], [828, 318], [252, 1376], [828, 1376]]) { circ(px, py, 28, rg(px - 8, py - 8, 2, 28, ['#8a5a40', '#3a2219'])); circ(px, py, 28, OL, 5); }
  rr(264, 362, 552, 1006, 22); fs('#b7c1d6', 5);
  for (let k = 0; k < 5; k++) curve([290 + k * 12, 600 + k * 40], [330, 640 + k * 50], [300, 700 + k * 45], 3, 'rgba(60,70,100,.3)');
  rr(322, 396, 436, 206, 72); fs(rg(540, 470, 40, 260, ['#ffffff', '#dfe3ee', '#a9b0c6']), 6);
  rr(342, 414, 396, 170, 60); g.setLineDash([8, 7]); g.strokeStyle = 'rgba(80,90,120,.35)'; g.lineWidth = 2.5; g.stroke(); g.setLineDash([]);
  cshadow(540, 535, 160, 110, .35);
  ell(540, 448, 140, 92); g.fillStyle = HAIRC[0]; g.fill();
  for (let k = 0; k < 9; k++) { const a = Math.PI * (1.05 + k * .1); curve([540 + Math.cos(a) * 90, 470 + Math.sin(a) * 60], [540 + Math.cos(a) * 140, 470 + Math.sin(a) * 105], [540 + Math.cos(a + .1) * 155, 470 + Math.sin(a + .1) * 118], 7, HAIRC[1]); }
  rr(505, 600, 70, 80, 20); g.fillStyle = SKIN[2]; g.fill();
  face(540, 520, 105, { t, eyes, tired, look, lookY: -.2, sweat: eyes === 'wide' ? .6 : 0, lx: 1, rim: 'rgba(82,216,255,.5)' });
  const DP = () => { g.beginPath(); g.moveTo(262, 690); g.quadraticCurveTo(540, 655, 818, 690); g.lineTo(824, 1372); g.lineTo(256, 1372); g.closePath(); };
  DP(); g.fillStyle = lg(262, 0, 818, 0, ['#3f7a96', '#2b5a74', '#1b3c50']); g.fill();
  g.save(); DP(); g.clip();
  for (let k = -12; k < 12; k++) { line([[262 + k * 70, 690], [262 + k * 70 + 680, 1372]], 2, 'rgba(10,25,40,.35)'); line([[818 - k * 70, 690], [818 - k * 70 - 680, 1372]], 2, 'rgba(10,25,40,.35)'); }
  for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) { const cx = 262 + j * 92 + (i % 2) * 46, cy = 720 + i * 72; g.fillStyle = rg(cx - 8, cy - 8, 2, 40, ['rgba(255,255,255,.1)', 'rgba(255,255,255,0)']); g.fillRect(cx - 40, cy - 40, 80, 80); }
  for (const lx2 of [455, 625]) { g.fillStyle = rg(lx2, 1080, 10, 200, ['rgba(255,255,255,.12)', 'rgba(255,255,255,0)']); g.fillRect(lx2 - 120, 820, 240, 520); }
  for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) curve([540 + sg * 270, 760 + k * 150], [540 + sg * 230, 800 + k * 150], [540 + sg * 268, 860 + k * 150], 4, 'rgba(5,15,25,.45)');
  g.restore();
  DP(); g.strokeStyle = OL; g.lineWidth = 7; g.stroke();
  g.beginPath(); g.moveTo(262, 690); g.quadraticCurveTo(540, 655, 818, 690); g.lineTo(818, 748); g.quadraticCurveTo(540, 714, 262, 748); g.closePath(); fs(lg(0, 670, 0, 750, ['#eef1f7', '#b8c0d4']), 6);
  line([[268, 744], [812, 744]], 3, 'rgba(60,70,100,.4)');
  for (const sg of [-1, 1]) { const s0 = [540 + sg * 128, 712], e = [540 + sg * 160, 800], hd = [540 + sg * 102, 900]; limb([s0, e, hd], 46, HOODC, 1); line([[540 + sg * 112, 878], hd], 51, OL); line([[540 + sg * 112, 878], hd], 41, HOODC[2]); hand(540 + sg * 96, 918, 26, Math.atan2(hd[1] - e[1], hd[0] - e[0]), { sg: -sg }); }
  cat(600, 1200, 1.05, { t });
  // lights: the lamp, the phone on his face, the moonlight patch
  L(130, 560, 560, C.amb, 1, .32); L(950, 640, 330, C.cyan, .9, .22); L(540, 520, 300, C.cyan, .55, .1); L(400, 980, 470, null, .45);
  return () => {
    back_();
    text('3:00', 960, 540, 54, RED, 'Anton'); glow(960, 540, 130, C.red, .45);
    if (phone) { g.save(); g.translate(950, 642); g.rotate(.25); rr(-33, -56, 66, 112, 10); g.fillStyle = lg(0, -56, 0, 56, ['#5fdcff', '#2a6cff']); g.fill(); text('3:00', 0, -30, 22, '#fff', 'Anton'); rr(-26, -6, 52, 16, 5); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); rr(-26, 16, 52, 16, 5); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(); g.restore(); glow(950, 642, 220, C.cyan, .35); }
    glow(130, 560, 120, C.warm, .6); circ(130, 560, 22, '#fffbe8');
    const qp = (u, v) => { const P0 = [60, 740], P1 = [520, 630], P2 = [700, 1190], P3 = [250, 1310]; const a = [lerp(P0[0], P1[0], u), lerp(P0[1], P1[1], u)], b = [lerp(P3[0], P2[0], u), lerp(P3[1], P2[1], u)]; return [lerp(a[0], b[0], v), lerp(a[1], b[1], v)]; };
    for (const [u0, u1] of [[0, .47], [.53, 1]]) for (const [v0, v1] of [[0, .47], [.53, 1]]) beam([qp(u0, v0), qp(u1, v0), qp(u1, v1), qp(u0, v1)], 200, 700, 600, 1250, C.moon, .17);
    beam([[-300, -300], [200, -300], [700, 1190], [60, 740]], -100, -200, 400, 900, C.moon, .06);
    motes(100, 300, 700, 1300, 40, t, C.moon, .5);
  };
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

// ---------- overlays: the frame-1 title, the counter, the stat cards, name tags ----------
function glass(x, y, w, h, r, border, bw = 4, glowc = null) {
  rr(x, y, w, h, r); g.fillStyle = 'rgba(8,10,22,.78)'; g.fill();
  g.save(); if (glowc) { g.shadowColor = glowc; g.shadowBlur = 26; } rr(x, y, w, h, r); g.strokeStyle = border; g.lineWidth = bw; g.stroke(); g.restore();
  rr(x + bw, y + bw, w - 2 * bw, h * .45, r * .8); g.fillStyle = 'rgba(255,255,255,.04)'; g.fill();
}
function title(t, a = 1) {
  if (a <= 0) return; reset(); g.globalAlpha = a; const k = 1 + .015 * Math.sin(t * 3);
  g.save(); g.translate(CX, 300); g.scale(k, k);
  glass(-480, -150, 960, 300, 36, 'rgba(255,179,87,.55)', 3, 'rgba(255,179,87,.6)');
  text(TX.t1, 0, -62, 90, '#f4f1ea', 'Anton', 'center', 12);
  g.save(); g.shadowColor = 'rgba(255,170,80,.9)'; g.shadowBlur = 34; text(TX.t2, 0, 62, 150, YEL, 'Anton', 'center', 14); g.restore();
  g.restore(); g.globalAlpha = 1;
}
function counter(t) {
  const on = (t >= LN.l03.t0 && t < LN.l10.t0) || (t >= LN.l12.t0 && t < LN.l14.t0); if (!on) return;
  let cur = null, t0 = 0; for (const l of TL.lines) { if (l.t0 > t) break; if (l.counter) { cur = l.counter; t0 = l.t0; } }
  if (!cur) return;
  const k = back(seg(t, t0, t0 + .3), 2), hi = 1 - seg(t, t0, t0 + .6);
  reset(); g.save(); g.translate(CX, 160); g.scale(k, k);
  g.font = '72px Anton'; const w = g.measureText(cur).width + 150;
  glass(-w / 2, -52, w, 104, 52, `rgba(255,179,87,${.6 + .4 * hi})`, 4, 'rgba(255,170,80,.8)');
  const cx = -w / 2 + 58; circ(cx, 0, 28, 'rgba(255,179,87,.15)'); circ(cx, 0, 28, AMB, 4); const a = t * 6; line([[cx, 0], [cx + Math.sin(a) * 19, -Math.cos(a) * 19]], 4, AMB); line([[cx, 0], [cx, -14]], 4, '#fff');
  g.save(); g.shadowColor = `rgba(255,200,120,${.4 + .5 * hi})`; g.shadowBlur = 20; text(cur, 30, 4, 72, '#fff', 'Anton'); g.restore();
  g.restore();
}
const STATC = [[AMB, C.amb], [RED, C.red], [PUR, C.pur], [CYAN, C.cyan], [GRN, C.grn], [MAG, C.mag], [AMB, C.amb], [CYAN, C.cyan]];
function statCard(t) {
  let i = -1;
  TL.lines.forEach((l, k) => { if (!l.stat) return; i++; const nx = TL.lines[k + 1], end = nx ? nx.t0 : TL.dur; if (t >= l.t0 && t < end) draw(l, i); });
  function draw(l, idx) {
    const p = t - l.t0, k = back(seg(p, .05, .35), 1.8), [lab, big, src] = l.stat, [col, rgbc] = STATC[idx % STATC.length];
    reset(); g.save(); g.translate(CX, 380); g.scale(k, k); g.globalAlpha = clamp(seg(p, .05, .2) * 1.5);
    glass(-450, -105, 900, 210, 26, `rgba(${rgbc},.7)`, 3, `rgba(${rgbc},.6)`);
    rr(-450, -105, 12, 210, [26, 0, 0, 26]); g.fillStyle = col; g.fill();
    text(lab, 8, -62, 38, '#c9cde0', 'Anton');
    g.font = '96px Anton'; const sc = Math.min(1, 800 / g.measureText(big).width) * lerp(1.18, 1, eo(seg(p, .2, .5)));
    g.save(); g.translate(8, 12); g.scale(sc, sc); g.shadowColor = `rgba(${rgbc},.9)`; g.shadowBlur = 30; text(big, 0, 0, 96, col, 'Anton'); g.restore();
    g.font = '500 27px sans-serif'; g.fillStyle = '#8f95ad'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(src, 8, 76);
    g.restore();
  }
}
function tag(s, x, y, col, rgbc, k = 1) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(k, k); g.font = '50px Anton'; const w = g.measureText(s).width + 50;
  glass(-w / 2, -38, w, 76, 22, col, 3, `rgba(${rgbc},.7)`); path([[-14, 38], [0, 62], [14, 38]]); g.closePath(); g.fillStyle = col; g.fill();
  text(s, 0, 3, 50, col, 'Anton'); g.restore();
}
// ---------- captions: word by word, the current word pops, key words amber (red on the scary lines) ----------
const REDCAP = ['para', 'whisper'];
function captions(t) {
  for (const l of TL.lines) {
    if (!l.words || t < l.t0 - .02 || t > l.t1 + .25) continue;
    const k = wordAt(l.id, t); if (k < 0) continue;
    const a = Math.floor(k / 3) * 3, ws = l.words.slice(a, Math.min(l.words.length, a + 3));
    const keys = (l.key || []).map(x => x.toLowerCase().replace(/[^a-z0-9':-]/g, ''));
    const kc = REDCAP.includes(l.shot) ? RED : YEL, kg = REDCAP.includes(l.shot) ? 'rgba(255,49,80,.85)' : 'rgba(255,170,80,.8)';
    const size = 96, gap = 44; reset();
    g.font = `${size}px Anton`;
    const up = w => w.toUpperCase();
    const widths = ws.map(w => g.measureText(up(w[0])).width);
    const total = widths.reduce((s, v) => s + v, 0) + gap * (ws.length - 1);
    const sc = Math.min(1, 980 / total);
    let x = CX - total * sc / 2; const y = 1480;
    ws.forEach((w, i) => {
      const idx = a + i; if (idx > k) { x += (widths[i] + gap) * sc; return; }
      const isKey = keys.some(kk => w[0].toLowerCase().replace(/[^a-z0-9':-]/g, '').startsWith(kk));
      const pop = idx === k ? back(seg(t, w[1], w[1] + .12), 2.2) : 1;
      const s = sc * (idx === k ? lerp(1.12, 1, seg(t, w[1], w[1] + .16)) : 1);
      g.save(); g.translate(x + widths[i] * sc / 2, y); g.scale(s, s); g.globalAlpha = clamp(pop * 1.2);
      g.font = `${size}px Anton`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 18; g.lineWidth = 16; g.strokeStyle = OL; g.lineJoin = 'round'; g.strokeText(up(w[0]), 0, 0); g.shadowBlur = 0;
      if (isKey) { g.shadowColor = kg; g.shadowBlur = 26; }
      g.fillStyle = isKey ? kc : '#ffffff'; g.fillText(up(w[0]), 0, 0);
      g.restore();
      x += (widths[i] + gap) * sc;
    });
  }
}

// ---------- shots ----------
const S = {};
// 1. the hook: from above, Nico wide awake at 3 AM, staring right at you. The title is up from frame 1.
S.awake = (t, u) => {
  const tk = wordT('l01', 'makakatulog'), hit = t > tk;
  cam(CX, hit ? 650 : 760, hit ? lerp(1.3, 1.18, eo(seg(t, tk, tk + .6))) : lerp(1.0, 1.1, seg(t, 0, tk)), 0, hit ? 9 * (1 - seg(t, tk, tk + .45)) : 0, t);
  const post = topDown(t, { eyes: 'wide', tired: .35, look: hit ? Math.sin(t * 5) * .25 : 0 });
  lightPass(DIM.night); post();
};
// 2. the open loop: a case file under a desk lamp, a red stamp... then "may mas malala pa" bleeds red
S.loop1 = (t, u) => {
  const ts = wordT('l02', 'totoong'), tm = wordT('l02', 'malala'), bad = t > tm;
  cam(CX, 900, lerp(1.1, 1, eo(seg(u, 0, .8))), -.02, (t > ts ? 7 * (1 - seg(t, ts, ts + .35)) : 0) + (bad ? 9 * (1 - seg(t, tm, tm + .45)) : 0), t);
  g.drawImage(TEX.floorTop, -300, -500); const back_ = keep();
  // things on the desk: a pen, a coffee ring, a second sheet
  g.save(); g.translate(900, 1330); g.rotate(.7); rr(-110, -9, 220, 18, 9); fs('#1d2a4a', 3); rr(70, -9, 40, 18, 5); g.fillStyle = '#c9a45a'; g.fill(); g.restore();
  circ(170, 1300, 70, 'rgba(60,30,15,.35)', 8); circ(176, 1296, 62, 'rgba(60,30,15,.15)', 4);
  g.save(); g.translate(560, 960); g.rotate(.08); cshadow(14, 20, 420, 330, .55); rr(-380, -300, 760, 600, 10); fs('#d8cfbd', 4); g.restore();
  // the folder
  g.save(); g.translate(540, 920); g.rotate(-.05);
  cshadow(16, 22, 420, 340, .6);
  rr(-370, -340, 300, 80, 14); fs('#b8894a', 6); text(TX.file, -220, -305, 40, '#3a2410', 'Anton');
  rr(-370, -290, 740, 580, 18); fs(lg(-370, -290, 370, 290, ['#e0b06a', '#c08a48', '#a8743a']), 7);
  rr(-340, -262, 680, 524, 6); fs(lg(0, -262, 0, 262, ['#f2ecdf', '#d8cfbc']), 3);
  for (let k = 0; k < 12; k++) line([[-20, -200 + k * 36], [300 - 90 * hash(k), -200 + k * 36]], 9, 'rgba(30,25,40,.28)');
  rr(-310, -230, 250, 300, 4); fs('#f7f4ec', 3); rr(-292, -212, 214, 214, 2); g.fillStyle = lg(0, -212, 0, 2, ['#1a2240', '#0c1020']); g.fill();
  g.save(); rr(-292, -212, 214, 214, 2); g.clip(); face(-185, -96, 74, { t, tired: .5, eyes: 'open', lx: 1, rim: RIMM }); rr(-245, -10, 120, 40, 10); g.fillStyle = HOODC[1]; g.fill(); g.restore();
  text(TX.nico, -185, 35, 40, '#2a2436', 'Anton');
  g.save(); g.translate(-200, -238); g.rotate(-.1); line([[-14, -30], [-14, 30], [14, 30], [14, -22], [-6, -22], [-6, 18]], 6, '#9aa0b0'); g.restore();
  if (t > ts) { const kk = lerp(1.8, 1, eo(seg(t, ts, ts + .18))); g.save(); g.translate(40, 120); g.rotate(-.16); g.scale(kk, kk); g.globalAlpha = clamp(seg(t, ts, ts + .08)) * .92;
    rr(-300, -110, 600, 220, 18); g.strokeStyle = '#c4122e'; g.lineWidth = 14; g.stroke(); rr(-280, -92, 560, 184, 12); g.strokeStyle = '#c4122e'; g.lineWidth = 4; g.stroke();
    text(TX.stamp[0], 0, -40, 86, '#c4122e', 'Anton'); text(TX.stamp[1], 0, 52, 86, '#c4122e', 'Anton');
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 160; i++) circ(-290 + hash(i * 3.3) * 580, -100 + hash(i * 5.1) * 200, 2 + 3 * hash(i), 'rgba(0,0,0,.6)'); g.restore(); }
  g.restore();
  L(560, 860, 680, C.amb, 1, .2); if (bad) L(540, 900, 1000, C.red, .6 * ss(seg(t, tm, tm + .4)), .35);
  lightPass(bad ? '#4a2234' : DIM.warm); back_();
  if (bad) { reset(); const k2 = back(seg(t, tm, tm + .25), 2); g.save(); g.translate(880, 640); g.scale(k2, k2); g.shadowColor = 'rgba(255,49,80,.95)'; g.shadowBlur = 50; text('?', 0, 0, 300, '#ff5068', 'Anton', 'center', 14); g.restore(); }
};
// 3. meet Nico (and Mingming): tired, but sleep won't come. A soft "Zzz" drifts to him... and flies away on "ayaw"
S.hero = (t, u) => {
  const tn = wordT('l03', 'Nico'), tp = wordT('l03', 'Pagod'), ta = wordT('l03', 'ayaw');
  cam(560, 900, lerp(1.12, 1.0, eo(seg(u, 0, .9))));
  const post = room(t, { sky: 'night', clock: 0, bedX: 150 });
  cat(300, 1040, .9, { t });
  nico(560, 1270, 560, { t, sit: 1, tired: .35, arms: t > tp && t < ta ? 'rub' : 'down', eyes: t > ta ? 'wide' : 'open', look: t > ta ? -.6 : 0, lx: 1, rim: RIMM });
  L(600, 860, 300, C.warm, .8, .08);
  lightPass(DIM.night); post();
  tag(TX.nico, 560, 610, YEL, C.amb, back(seg(t, tn, tn + .3), 1.8)); tag(TX.cat, 300, 880, AMB, C.amb, back(seg(t, tn + .5, tn + .8), 1.8));
  const p = seg(t, tp, ta), away = seg(t, ta, ta + .9);
  const zx = lerp(900, 650, eo(p)) + lerp(0, 480, ei(away)), zy = lerp(520, 650, eo(p)) - lerp(0, 380, ei(away));
  if (p > 0) for (let k = 0; k < 3; k++) { g.save(); g.shadowColor = 'rgba(140,170,255,.9)'; g.shadowBlur = 24; text('Z', zx + k * 46, zy - k * 50 + Math.sin(t * 3 + k) * 8, 68 - k * 12, '#cfdcff', 'Anton', 'center', 6, 1 - away); g.restore(); }
};
// 4. hour 17: at the desk, coffee piling up, the laptop light on his face... his brain like one drink in
S.h17 = (t, u) => {
  const tal = wordT('l04', 'alak');
  cam(CX, 920, lerp(1.0, 1.06, seg(u, 0, span('l04'))), t > tal ? Math.sin(t * 2.2) * .015 : 0);
  g.drawImage(TEX.wall, -500, -560); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#7fb8b8'; g.fillRect(-500, -560, 1800, 1810); g.restore(); const back_ = keep();
  // a small window with the city at night
  g.save(); rr(70, 430, 240, 300, 6); g.clip(); grad('#0a1438', '#26306a', 430, 730); fullMoon(250, 500, 22); g.drawImage(TEX.city, 600, 200, 900, 700, 60, 520, 270, 210); g.restore();
  rr(70, 430, 240, 300, 6); g.strokeStyle = OL; g.lineWidth = 24; g.stroke(); g.strokeStyle = '#3e4a5a'; g.lineWidth = 15; g.stroke(); line([[190, 430], [190, 730]], 12, '#3e4a5a'); line([[70, 580], [310, 580]], 12, '#3e4a5a');
  // shelves: books, a plant, a trophy
  for (const sy of [600, 800]) { rr(700, sy, 340, 18, 4); fs(lg(0, sy, 0, sy + 18, ['#7a5038', '#3a2219']), 4); cshadow(870, sy + 22, 180, 8, .5); }
  for (let k = 0; k < 8; k++) { const bh = 90 + 50 * hash(k * 2.3); rr(712 + k * 30, 600 - bh, 26, bh, 3); fs(['#2c4a6a', '#7a2a34', '#c49a45', '#3b5a4a', '#5a3a6a', '#8a5a3a', '#2a3a5a', '#6a6a7a'][k], 3); }
  rr(960, 740, 50, 60, 6); fs('#b46a48', 3); for (let k = 0; k < 5; k++) curve([985, 742], [985 + (k - 2) * 16, 700], [985 + (k - 2) * 26 + Math.sin(t + k) * 3, 680 - (k % 2) * 20], 6, '#3b6a48');
  rr(730, 730, 90, 70, 6); fs('#c9a45a', 3); circ(775, 715, 22, '#c9a45a'); circ(775, 715, 22, OL, 3);
  g.fillStyle = '#1e2234'; g.fillRect(-500, 1250, 1800, 1100);
  nico(CX, 1385, 560, { t, sit: 1, arms: 'type', tired: .55, sway: t > tal ? Math.sin(t * 2.6) * .6 : 0, look: Math.sin(t * .7) * .2, lx: 1, rim: 'rgba(82,216,255,.6)', ground: 0 });
  // the laptop from behind, with a moon sticker
  rr(330, 1056, 420, 154, 16); fs(lg(330, 0, 750, 0, ['#6a7080', '#3a3e4c', '#262a36']), 6); line([[340, 1062], [740, 1062]], 3, 'rgba(255,255,255,.25)'); circ(600, 1120, 26, '#d9c27a'); circ(612, 1112, 22, '#3a3e4c');
  // the desk
  rr(60, 1200, 960, 60, 14); fs(lg(0, 1200, 0, 1260, ['#8a5a3a', '#5a3622']), 6); line([[70, 1206], [1010, 1206]], 3, 'rgba(255,220,180,.25)');
  for (const lx2 of [140, 940]) { rr(lx2 - 14, 1260, 28, 160, 6); fs('#3a2216', 4); }
  g.save(); g.translate(820, 1196); g.rotate(-.05); rr(-70, -6, 140, 8, 2); fs('#e8e4d8', 2); g.restore(); g.save(); g.translate(840, 1190); g.rotate(.1); rr(-60, -6, 120, 8, 2); fs('#d8d4c8', 2); g.restore();
  const cups = 1 + Math.min(3, Math.floor(seg(t, LN.l04.t0, LN.l04.t1) * 4));
  for (let k = 0; k < cups; k++) mugAt(150 + k * 62, 1200, 58, t, k === cups - 1 ? 1 : 0);
  // the desk lamp (articulated)
  line([[960, 1200], [985, 1060], [905, 960]], 14, OL); line([[960, 1200], [985, 1060], [905, 960]], 7, '#3a4258'); circ(985, 1060, 10, '#5a6278'); ell(960, 1196, 46, 10); fs('#2a3042', 4);
  g.save(); g.translate(890, 955); g.rotate(-.5); path([[-50, 0], [50, 0], [26, -50], [-26, -50]]); g.closePath(); fs(lg(-50, 0, 50, 0, ['#4a8a6a', '#2a5a44']), 5); g.restore();
  L(540, 1000, 400, C.cyan, 1, .3); L(860, 1170, 460, C.amb, .95, .24); L(190, 580, 250, C.moon, .7, .12);
  lightPass(DIM.night); back_();
  beam([[850, 990], [930, 960], [1010, 1220], [700, 1220]], 890, 980, 860, 1220, C.amb, .2); glow(888, 985, 70, C.warm, .7);
  glow(540, 1050, 300, C.cyan, .18); line([[340, 1058], [740, 1058]], 5, 'rgba(160,235,255,.65)');
  if (t > tal) { const kk = back(seg(t, tal, tal + .35), 1.8), bx = 880, by = 760 + Math.sin(t * 2.4) * 10; g.save(); g.translate(bx, by); g.scale(kk, kk); g.rotate(Math.sin(t * 2) * .12); g.shadowColor = 'rgba(255,79,154,.95)'; g.shadowBlur = 28;
    path([[-62, -92], [62, -92], [8, -4], [8, 70], [40, 90], [-40, 90], [-8, 70], [-8, -4]]); g.closePath(); g.strokeStyle = MAG; g.lineWidth = 8; g.stroke();
    path([[-46, -76], [46, -76], [6, -18], [-6, -18]]); g.closePath(); g.fillStyle = 'rgba(255,79,154,.35)'; g.fill(); g.beginPath(); g.arc(32, -92, 13, 0, TAU); g.strokeStyle = YEL; g.lineWidth = 6; g.stroke(); g.restore(); }
};
// 5. hour 24: sunrise. Still up, swaying, his vision going soft. (Easter egg: for half a second, something stands in the window.)
const EGG = () => [LN.l05.t0 + span('l05') * .38, LN.l05.t0 + span('l05') * .38 + .5];
S.h24 = (t, u, soft = 1) => {
  cam(600, 900, 1.02 + .03 * Math.sin(t * 1.3), Math.sin(t * 1.7) * .02);
  const [e0, e1] = EGG(), ga = ss(seg(t, e0, e0 + .1)) * (1 - ss(seg(t, e1 - .1, e1)));
  const post = room(t, { sky: 'dawn', lamp: .5, ghost: ga, clock: 6.2, tint: '#c9a0b0' });
  cat(230, 1040, .9, { t, awake: 1, look: 1 });
  nico(470, 1340, 600, { t, arms: 'hold', mug: 1, tired: .8, sway: Math.sin(t * 2.2), look: .3, lx: 1, rim: 'rgba(255,170,130,.6)' });
  L(470, 820, 330, C.warm, .8, .1); L(230, 1030, 160, null, .7);
  lightPass(DIM.dawn); post();
  if (soft) { const bl = .5 + .5 * Math.sin(t * 1.6); lc.globalCompositeOperation = 'copy'; lc.drawImage(cv, 0, 0); lc.globalCompositeOperation = 'source-over'; reset(); g.globalAlpha = .4 * bl; g.filter = 'blur(6px)'; g.drawImage(LIT, 0, 0); reset(); }
};
// 6. day 2: microsleep at the wheel, at night. POV: the road in the headlights, his eyes in the mirror; the lids close... black
const BLINKS = () => { const Ln = LN.l06, d = Ln.t1 - Ln.t0; return [[Ln.t0 + d * .22, .38], [Ln.t0 + d * .5, .55], [Ln.t0 + d * .78, .42]]; };
S.micro = (t, u) => {
  const bl = BLINKS(); let lid = 0, drift = 0;
  bl.forEach(([b, d], i) => { lid = Math.max(lid, ss(seg(t, b - .32, b)) * (1 - ss(seg(t, b + d, b + d + .16)))); drift += (i + 1) * 42 * ss(seg(t, b, b + d)) * (1 - ss(seg(t, b + d + .1, b + d + .8))); });
  if (lid > .999) BLACK = 1;
  const last = bl[2], onc = ss(seg(t, last[0] + last[1] - .2, last[0] + last[1] + .4)) * (1 - ss(seg(t, last[0] + last[1] + .6, last[0] + last[1] + 1.1)));
  const jolt = bl.reduce((s, [b, d]) => s + Math.max(0, 1 - Math.abs(t - (b + d + .05)) / .25), 0);
  // outside: sky, far city, hills, road (drifts as he drifts)
  reset(); g.translate(CX + drift + Math.sin(t * 40) * 6 * jolt, 900); g.rotate(drift * .0008); g.translate(-CX, -900);
  grad('#050818', '#1a2046', -400, 840);
  for (let i = 0; i < 50; i++) circ(hash(i * 3.7) * W, 520 + hash(i * 1.9) * 260, 1 + 1.5 * hash(i), `rgba(255,255,255,${.3 + .3 * Math.sin(t + i)})`);
  g.drawImage(TEX.city, 0, 500, 2400, 400, -200, 760, 1480, 90);
  glow(300, 820, 400, C.amb, .2);
  g.fillStyle = '#090c1a'; g.beginPath(); g.moveTo(-400, 840); for (let x = -400; x <= W + 400; x += 30) g.lineTo(x, 830 - 50 * Math.sin(x * .005 + 2) ** 2 - 20 * hash(Math.floor(x / 30))); g.lineTo(W + 400, 900); g.lineTo(-400, 900); g.fill();
  g.fillStyle = '#0c1020'; g.fillRect(-400, 840, W + 800, 900);
  path([[518, 840], [562, 840], [1350, 1720], [-270, 1720]]); g.closePath(); g.fillStyle = lg(0, 840, 0, 1700, ['#101218', '#2a2c36']); g.fill();
  for (const sg of [-1, 1]) line([[540 + sg * 21, 840], [540 + sg * 790, 1720]], 9, 'rgba(230,230,240,.75)');
  for (let k = 0; k < 8; k++) { const p = ((k / 8) + t * .9) % 1, z = p * p, y0 = 840 + z * 880, y1 = 840 + Math.min(1, (p + .045) ** 2) * 880; line([[540, y0], [540, y1]], 3 + 22 * z, '#e8c45a'); }
  for (let k = 0; k < 5; k++) { const p = ((k / 5) + t * .55) % 1, z = p * p, y = 840 + z * 880; for (const sg of [-1, 1]) { const x = 540 + sg * (50 + z * 1150); line([[x, y], [x, y - 30 - z * 300]], 3 + 12 * z, '#cfd2dc'); circ(x, y - 30 - z * 300, 4 + 9 * z, sg < 0 ? '#ffb040' : '#ff4040'); } }
  if (onc > 0) for (const sg of [-1, 1]) circ(470 + sg * 40 * (1 + onc * 2), 850 + onc * 60, 5 + 30 * onc, '#fffbe8');
  L(540, 1250, 640, C.warm, .9, .14); if (onc > 0) L(470, 880, 500 * onc, C.white, onc, .5 * onc);
  // inside: the car (does not drift)
  reset();
  g.fillStyle = '#0a0b14'; g.beginPath(); g.moveTo(-10, 1260); g.quadraticCurveTo(CX, 1205, W + 10, 1260); g.lineTo(W + 10, H); g.lineTo(-10, H); g.fill(); line([[-10, 1258], [W + 10, 1258]], 3, 'rgba(160,190,255,.12)');
  rr(150, 1290, 260, 120, 26); fs('#05060c', 5);
  g.beginPath(); g.arc(540, 1650, 345, Math.PI * 1.06, Math.PI * 1.94); g.strokeStyle = OL; g.lineWidth = 76; g.stroke(); g.strokeStyle = '#23253a'; g.lineWidth = 58; g.stroke(); g.strokeStyle = 'rgba(150,170,220,.2)'; g.lineWidth = 6; g.beginPath(); g.arc(540, 1650, 362, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  for (let k = 0; k < 30; k++) { const a = Math.PI * (1.08 + k * .028); line([[540 + Math.cos(a) * 320, 1650 + Math.sin(a) * 320], [540 + Math.cos(a) * 340, 1650 + Math.sin(a) * 340]], 2, 'rgba(0,0,0,.4)'); }
  for (const sg of [-1, 1]) { const hx = 540 + sg * 290, hy = 1440; limb([[540 + sg * 560, 1760], [540 + sg * 420, 1600], [hx, hy]], 62, HOODC, -sg); hand(hx, hy - 6, 34, sg < 0 ? -.9 : Math.PI + .9, { sg: -sg, grip: 1 }); }
  g.fillStyle = '#07080f'; path([[-10, -10], [190, -10], [190, 520], [60, 1270], [-10, 1270]]); g.closePath(); g.fill(); path([[W + 10, -10], [W - 190, -10], [W - 190, 520], [W - 60, 1270], [W + 10, 1270]]); g.closePath(); g.fill();
  g.fillRect(-10, -10, W + 20, 530); for (let i = 0; i < 1500; i++) { g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(hash(i * 1.3) * W, hash(i * 2.1) * 510, 2, 2); }
  line([[-10, 520], [W + 10, 520]], 4, 'rgba(160,190,255,.1)');
  line([[540, 520], [540, 548]], 14, '#1a1c28'); rr(325, 545, 430, 140, 28); fs(lg(0, 545, 0, 685, ['#2a2c3a', '#11121a']), 6);
  g.save(); rr(340, 558, 400, 114, 18); g.clip(); g.fillStyle = lg(0, 558, 0, 672, ['#3a3040', '#1e1824']); g.fillRect(340, 558, 400, 114);
  for (const sg of [-1, 1]) eye(540 + sg * 82, 612, 34, sg, { eyes: 'open', tired: .95, lid: lerp(.45, 1, lid), look: .1 });
  g.restore();
  const af = Math.sin(t * 2.3) * .25; g.save(); g.translate(540, 690); g.rotate(af); line([[0, -5], [0, 50]], 2, '#c9c2b6'); path([[0, 50], [-24, 100], [-10, 100], [-28, 140], [28, 140], [10, 100], [24, 100]]); g.closePath(); fs('#3a8a5a', 3); g.restore();
  L(540, 612, 230, C.cyan, .8, .08); L(280, 1350, 260, C.cyan, 1, .2);
  lightPass(DIM.deep);
  // the dash: speedometer arc, needle, numbers
  g.save(); g.shadowColor = 'rgba(82,216,255,.9)'; g.shadowBlur = 16; g.beginPath(); g.arc(280, 1390, 90, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = CYAN; g.lineWidth = 5; g.stroke();
  for (let k = 0; k <= 8; k++) { const a = Math.PI * (1.1 + k * .1); line([[280 + Math.cos(a) * 78, 1390 + Math.sin(a) * 78], [280 + Math.cos(a) * 90, 1390 + Math.sin(a) * 90]], 3, CYAN); }
  const na = Math.PI * (1.1 + .5 + Math.sin(t * .7) * .02 - drift * .001); line([[280, 1390], [280 + Math.cos(na) * 80, 1390 + Math.sin(na) * 80]], 5, '#ff6a50'); text('80', 280, 1365, 40, '#dff8ff', 'Anton'); g.restore();
  for (const [px, py, c] of [[440, 1330, C.amb], [470, 1330, C.grn]]) { circ(px, py, 6, `rgb(${c})`); glow(px, py, 30, c, .5); }
  beam([[300, 1250], [780, 1250], [600, 860], [480, 860]], 540, 1250, 540, 860, C.warm, .1);
  if (onc > 0) { glow(470 + drift, 870, 700 * onc, C.white, .55 * onc); }
  if (lid > 0) { const hg = H / 2 * lid; for (const sg of [-1, 1]) { const y0 = sg < 0 ? 0 : H; g.fillStyle = '#000'; g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.lineTo(W, y0 - sg * hg * .9); g.quadraticCurveTo(CX, y0 - sg * hg * 1.25, 0, y0 - sg * hg * .9); g.closePath(); g.fill(); } }
};
// 7-8. day 3: things that aren't there. The wallpaper breathes, hands creep on the walls, the floor rolls, the portraits change
S.halluc = (t, u) => {
  const tf = wordT('l08', 'Gumagalaw'), tm = wordT('l08', 'Nagbabago'), fl = ss(seg(t, tf, tf + .6));
  cam(CX, 900, lerp(1.0, 1.08, seg(u, 0, 6)));
  const br = 1 + .03 * Math.sin(t * 1.6); g.save(); g.translate(CX, 600); g.scale(br, 1 / br); g.translate(-CX, -600); g.drawImage(TEX.wall, -500, -560); g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#b090d8'; g.fillRect(-500, -560, 1800, 1810); g.restore(); const back_ = keep();
  for (const sg of [-1, 1]) { const reach = 120 + 140 * ss(seg(u, .3, 3)) + Math.sin(t * .9 + sg) * 30, hy = 820 + sg * 120; g.save(); g.translate(sg < 0 ? -40 + reach : W + 40 - reach, hy); g.scale(-sg, 1); g.fillStyle = 'rgba(5,2,12,.75)'; g.beginPath(); g.moveTo(-400, -40); g.lineTo(0, -30); g.lineTo(0, 30); g.lineTo(-400, 50); g.fill(); for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, -24 + k * 16); g.quadraticCurveTo(70, -40 + k * 22 + Math.sin(t * 2 + k) * 6, 150 - Math.abs(k - 1.5) * 20, -46 + k * 30); g.strokeStyle = 'rgba(5,2,12,.75)'; g.lineWidth = 12; g.lineCap = 'round'; g.stroke(); } g.restore(); }
  g.fillStyle = '#2a2342'; g.fillRect(-500, 1000, 1800, 210); line([[-500, 1000], [1300, 1000]], 10, '#1c1830');
  for (let r_ = 0; r_ < 10; r_++) for (let c = -8; c < 8; c++) {
    const y0 = 1210 + r_ * r_ * 9 + r_ * 40, y1 = 1210 + (r_ + 1) * (r_ + 1) * 9 + (r_ + 1) * 40, wv = Math.sin(c * .7 + t * 2.4 + r_ * .5) * 16 * (r_ + 1) * .3 * fl, wv2 = Math.sin((c + 1) * .7 + t * 2.4 + r_ * .5) * 16 * (r_ + 1) * .3 * fl;
    const k0 = 1 + r_ * .35, k1 = 1 + (r_ + 1) * .35;
    path([[CX + c * 90 * k0, y0 + wv], [CX + (c + 1) * 90 * k0, y0 + wv2], [CX + (c + 1) * 90 * k1, y1 + wv2], [CX + c * 90 * k1, y1 + wv]]); g.closePath(); g.fillStyle = (r_ + c) % 2 ? '#3a6a70' : '#5a3460'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.stroke();
  }
  line([[-500, 1210], [1300, 1210]], 8, OL);
  [[200, 700, '#b8955a'], [540, 640, '#c9a45a'], [880, 700, '#a8854a']].forEach(([x, y, col], i) => {
    cshadow(x + 10, y + 16, 130, 160, .55);
    rr(x - 118, y - 148, 236, 296, 10); fs(lg(x - 118, y - 148, x + 118, y + 148, [col, '#4a3618', col]), 6);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; circ(x + Math.cos(a) * 112, y + Math.sin(a) * 142, 7, '#806830'); }
    rr(x - 92, y - 120, 184, 240, 4); fs(lg(0, y - 120, 0, y + 120, ['#3a4a6a', '#1a2238']), 3);
    const m = ss(seg(t, tm + i * .15, tm + i * .15 + .7)), wob = Math.sin(t * 3 + i) * m;
    g.save(); rr(x - 92, y - 120, 184, 240, 4); g.clip(); rr(x - 60, y + 50, 120, 80, 30); g.fillStyle = ['#7a2a34', '#2c4a6a', '#3b5a4a'][i]; g.fill();
    ell(x, y - 10, 58 + 8 * wob, 66 - 4 * wob); fs(rg(x - 14, y - 30, 6, 80, [SKIN[0], SKIN[1], SKIN[2]]), 4);
    ell(x, y - 64, 62, 26); g.fillStyle = HAIRC[1]; g.fill();
    for (const sg of [-1, 1]) { const er = 8 + 20 * m, exx = x + sg * (20 + 6 * m), eyy = y - 16 - 6 * m; ell(exx, eyy, er, er * (1 + .4 * wob)); fs('#f2ece2', 3); circ(exx, eyy, 3 + 6 * m, OL); if (m > .3) glow(exx, eyy, er * 2, C.red, .3 * m); }
    if (m > .1) { ell(x, y + 26 + 10 * m, 12 + 12 * m, 5 + 26 * m); fs('#2a0812', 3); for (let k = 0; k < 5; k++) { const tx = x - 10 - 10 * m + k * (5 + 5 * m), ty = y + 26 + 10 * m - 5 - 22 * m; path([[tx - 3, ty], [tx + 3, ty], [tx, ty + 10 * m]]); g.closePath(); g.fillStyle = '#efe6da'; g.fill(); } } else curve([x - 16, y + 24], [x, y + 32], [x + 16, y + 24], 4, '#4a1a22');
    g.restore();
  });
  for (let i = 0; i < 9; i++) { const tb = LN.l07.t0 + .4 + i * .25; if (t < tb) continue; const bx = 100 + hash(i * 4.1) * 880 + Math.sin(t * 1.6 + i) * 50, by = 420 + hash(i * 2.7) * 560 + Math.cos(t * 1.3 + i) * 34, ang = Math.atan2(-Math.sin(t * 1.3 + i) * 1.3 * 34, Math.cos(t * 1.6 + i) * 1.6 * 50) + Math.PI / 2;
    g.save(); g.translate(bx, by); g.rotate(ang); for (const sg of [-1, 1]) for (let k = -1; k <= 1; k++) line([[0, k * 9], [sg * 15, k * 11], [sg * 26, k * 14 + Math.sin(t * 16 + k + i) * 4]], 3, OL); ell(0, 0, 13, 19); fs(rg(-4, -6, 1, 20, ['#5a6a8a', '#1a1a2a']), 3); line([[0, -12], [0, 18]], 2, 'rgba(0,0,0,.6)'); ell(0, -20, 8, 6); g.fillStyle = OL; g.fill(); circ(-4, -10, 3, 'rgba(255,255,255,.5)'); g.restore(); }
  nico(CX, 1420, 600, { t, tired: .9, eyes: 'wide', look: Math.sin(t * 2.4), sweat: 1, arms: fl > .5 ? 'out' : 'down', sway: Math.sin(t * 2.2) * fl, lx: -1, rim: 'rgba(109,255,168,.5)' });
  L(CX, 1050, 640, C.pur, 1, .26); L(540 + 380 * Math.sin(t * .7), 720, 420, C.grn, .7, .16); L(540, 670, 330, null, .6);
  lightPass(DIM.purple); back_();
  motes(0, 300, W, 1400, 30, t * 1.5, C.grn, .6, 9);
};
// 9. day 4: a wet neon street at night. Something follows him. He looks back... nothing.
S.para = (t, u) => {
  const ts = wordT('l09', 'sumusunod'), tb = ts + .35, lookB = t > tb, nx = 380 + u * 60;
  cam(nx + 60, 940, lerp(1.0, 1.06, seg(u, 0, span('l09'))));
  grad('#0a0a22', '#2a1a48', -500, 1150);
  g.drawImage(TEX.city, (nx - 400) * -.2 - 300, 0, 2400, 900, -500, 300, 2400, 900);
  const back_ = keep();
  for (let i = 0; i < 6; i++) { const bx = -400 + i * 330, top = 380 + 220 * hash(i * 3.3); g.drawImage(TEX.brick, 0, 0, 320, 1150 - top, bx, top, 320, 1150 - top); g.fillStyle = 'rgba(10,8,25,.35)'; g.fillRect(bx, top, 320, 1150 - top); rr(bx - 6, top - 20, 332, 24, 4); fs('#2a1c2a', 3);
    for (let wy = top + 40; wy < 880; wy += 130) for (let wx = bx + 40; wx < bx + 300; wx += 120) { const lit = hash(wx * 7 + wy) > .55; rr(wx, wy, 70, 90, 4); fs(lit ? lg(0, wy, 0, wy + 90, ['#ffd08a', '#c07838']) : '#141626', 4); if (lit) line([[wx + 35, wy], [wx + 35, wy + 90]], 3, 'rgba(40,20,10,.5)'); line([[wx - 6, wy + 94], [wx + 76, wy + 94]], 6, '#3a2a30'); }
    if (hash(i * 9) > .4) { rr(bx + 220, top + 160, 64, 46, 4); fs('#8a8c98', 3); for (let k = 0; k < 4; k++) line([[bx + 226, top + 170 + k * 9], [bx + 278, top + 170 + k * 9]], 2, '#4a4c58'); } }
  path([[-400, 330], [-100, 350], [300, 362], [700, 352], [1100, 340], [1500, 330]]); g.strokeStyle = '#0c0c14'; g.lineWidth = 3; g.stroke();
  // storefronts: a shutter and a lit convenience store
  rr(-60, 900, 420, 250, 4); fs('#141626', 4); for (let k = 0; k < 12; k++) line([[-55, 910 + k * 20], [355, 910 + k * 20]], 3, 'rgba(255,255,255,.06)');
  rr(560, 900, 460, 250, 4); fs(lg(0, 900, 0, 1150, ['#c8f0ff', '#6ab8d8']), 4); for (let k = 0; k < 3; k++) { rr(580, 930 + k * 70, 420, 10, 2); g.fillStyle = '#3a5a6a'; g.fill(); for (let j = 0; j < 12; j++) { rr(590 + j * 34, 900 + k * 70, 22, 30, 3); g.fillStyle = ['#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c'][(j + k) % 4]; g.fill(); } }
  g.fillStyle = '#3a3448'; g.fillRect(-500, 1150, 2400, 110); g.fillStyle = '#1a1828'; g.fillRect(-500, 1260, 2400, 900); line([[-500, 1150], [1900, 1150]], 6, OL); line([[-500, 1262], [1900, 1262]], 8, '#4a445a');
  for (let x = -400; x < 1900; x += 140) line([[x, 1150], [x - 60, 1260]], 3, 'rgba(255,255,255,.08)');
  for (const px of [-120, 380, 980]) { ell(px, 1210, 110, 16); g.fillStyle = 'rgba(120,140,200,.12)'; g.fill(); }
  for (const lx2 of [100, 760, 1400]) { line([[lx2, 1150], [lx2, 690]], 16, OL); line([[lx2, 1150], [lx2, 690]], 9, '#2a2c3a'); line([[lx2, 700], [lx2 + 76, 700]], 12, OL); path([[lx2 + 50, 700], [lx2 + 104, 700], [lx2 + 94, 722], [lx2 + 60, 722]]); g.closePath(); fs('#2a2c3a', 4); }
  const fa = lookB ? 1 - ss(seg(t, tb, tb + .12)) : ss(seg(t, LN.l09.t0 + .3, LN.l09.t0 + 1));
  g.save(); g.globalAlpha = .55 * fa; g.fillStyle = rg(nx - 330, 950, 20, 340, ['rgba(255,79,154,.9)', 'rgba(255,79,154,0)']); g.fillRect(nx - 680, 600, 700, 700); g.restore();
  shadow(nx - 330, 1250, 560, { t, alpha: fa, eyes: fa });
  nico(nx, 1250, 520, { t, walk: lookB ? null : t * 7, tired: 1, eyes: lookB ? 'wide' : 'open', look: lookB ? -1 : .2, sweat: lookB ? 1 : .4, sway: lookB ? -.4 : 0, lx: 1, rim: 'rgba(255,79,154,.65)' });
  for (const lx2 of [100, 760, 1400]) L(lx2 + 77, 980, 420, C.amb, .95, .22);
  L(150, 830, 280, C.mag, .9, .3); L(790, 1020, 380, C.cyan, 1, .3); L(nx, 1000, 260, null, .5); L(nx - 330, 930, 330, C.mag, .9 * fa, .3 * fa);
  lightPass('#2c2a58'); back_();
  for (const lx2 of [100, 760, 1400]) { glow(lx2 + 77, 722, 60, C.warm, .9); beam([[lx2 + 58, 722], [lx2 + 96, 722], [lx2 + 230, 1255], [lx2 - 76, 1255]], lx2 + 77, 722, lx2 + 77, 1255, C.amb, .14); beam([[lx2 + 50, 1262], [lx2 + 104, 1262], [lx2 + 120, 1700], [lx2 + 34, 1700]], lx2 + 77, 1262, lx2 + 77, 1700, C.amb, .14); }
  for (const [sx, sy, rgbc, col, s_] of [[150, 830, C.mag, MAG, '24/7'], [790, 860, C.cyan, CYAN, 'OPEN']]) { rr(sx - 110, sy - 50, 220, 100, 18); g.fillStyle = 'rgba(5,5,15,.85)'; g.fill(); g.save(); g.shadowColor = `rgba(${rgbc},1)`; g.shadowBlur = 30; rr(sx - 110, sy - 50, 220, 100, 18); g.strokeStyle = col; g.lineWidth = 7; g.stroke(); text(s_, sx, sy + 4, 60, '#fff', 'Anton'); g.restore(); glow(sx, sy, 260, rgbc, .25); beam([[sx - 90, 1262], [sx + 90, 1262], [sx + 70, 1640], [sx - 70, 1640]], sx, 1262, sx, 1640, rgbc, .16); }
  reset(); g.strokeStyle = 'rgba(190,210,255,.28)'; g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i < 160; i++) { const x = (hash(i * 3.3) * (W + 300) - t * 120 + 3000) % (W + 300) - 150, y = (hash(i * 7.1) * (H + 200) + t * 1500 * (1 + .3 * hash(i))) % (H + 200) - 100; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 34); g.stroke(); }
};
// 10. the whisper: a close-up; a black head with long fingers leans in at his ear
S.whisper = (t, u) => {
  cam(CX, 880, lerp(1.0, 1.22, ei(seg(u, 0, span('l10') + .15))));
  grad('#1a0a24', '#08040c', -500, 2300); const back_ = keep();
  shape(() => { rr(300, 1180, 520, 420, 140); }, 300, 820, HOODC, { lx: 1, rim: 'rgba(255,60,90,.6)', rw: 8, ol: 6 });
  face(560, 900, 300, { t, tired: 1, eyes: 'wide', look: -1, sweat: 1, ears: 1, lx: 1, rim: 'rgba(255,60,90,.75)' });
  const p = eo(seg(u, 0, span('l10')));
  g.save(); g.translate(lerp(-260, 70, p), 860);
  g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = 40; g.fillStyle = '#040206'; ell(-100, -30, 200, 250, .15); g.fill(); g.shadowBlur = 0;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(20, 80 + k * 30); g.bezierCurveTo(110, 60 + k * 40, 170, 90 + k * 30, 210 + k * 12, 120 + k * 32 + Math.sin(t * 2 + k) * 6); g.strokeStyle = '#040206'; g.lineWidth = 18 - k * 2; g.lineCap = 'round'; g.stroke(); }
  for (const sg of [-1, 1]) { glow(-40 + sg * 30, -70, 40, C.white, .5); circ(-40 + sg * 30, -70, 6, '#fff'); }
  g.restore();
  L(700, 850, 520, C.warm, .8, .06); L(300, 900, 420, C.red, .8, .3);
  lightPass('#2a1430'); back_();
  for (let k = 0; k < 3; k++) { const q_ = (t * 1.2 + k / 3) % 1; g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = (1 - q_) * p * .7; g.beginPath(); g.moveTo(lerp(-200, 60, p) + 190, 880); g.bezierCurveTo(250 + q_ * 30, 820 - q_ * 40, 230, 940 + q_ * 30, 262, 905); g.strokeStyle = 'rgba(255,120,150,.9)'; g.lineWidth = 6 - k; g.stroke(); g.restore(); }
};
// 11. the scare: a detailed face, a fast smooth zoom, a red flare (no glitch)
S.scare = (t, u) => {
  if (u < .05) { fill('#fff'); return; }
  fill('#0a0003'); reset(); g.fillStyle = rg(CX, 900, 80, 1100, ['rgba(150,10,35,.95)', 'rgba(40,0,8,1)']); g.fillRect(0, 0, W, H);
  const z = lerp(1.7, 1.0, eo(seg(u, .05, .25))); reset(); g.translate(CX + Math.sin(t * 40) * 14 * (1 - u), 900 + Math.cos(t * 33) * 12 * (1 - u)); g.scale(z, z); g.translate(-CX, -900);
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, wv = Math.sin(t * 6 + i) * 30; g.beginPath(); g.moveTo(CX + Math.cos(a) * 470, 950 + Math.sin(a) * 690); g.quadraticCurveTo(CX + Math.cos(a) * 600 + wv, 950 + Math.sin(a) * 820, CX + Math.cos(a + .2) * 720, 950 + Math.sin(a + .2) * 920); g.strokeStyle = '#050002'; g.lineWidth = 44; g.lineCap = 'round'; g.stroke(); }
  ell(CX, 950, 520, 760); g.fillStyle = rg(CX - 100, 700, 50, 800, ['#2a1418', '#100608', '#040102']); g.fill(); ell(CX, 1750, 700, 400); g.fillStyle = '#040102'; g.fill();
  g.save(); ell(CX, 950, 520, 760); g.clip(); for (let i = 0; i < 26; i++) { const sx = CX + (hash(i) - .5) * 900, sy = 500 + hash(i * 3) * 900; g.beginPath(); g.moveTo(sx, sy); for (let k = 1; k < 5; k++) g.lineTo(sx + (hash(i * 7 + k) - .5) * 120 * k / 2, sy + k * 30); g.strokeStyle = 'rgba(120,20,30,.4)'; g.lineWidth = 3; g.stroke(); }
  for (const sg of [-1, 1]) { ell(CX + sg * 190, 760, 190, 150, sg * .2); g.fillStyle = 'rgba(0,0,0,.6)'; g.fill(); } g.restore();
  for (const sg of [-1, 1]) {
    const ex = CX + sg * 190, ey = 760;
    glow(ex, ey, 260, C.white, .3); ell(ex, ey, 120, 80, sg * .25); g.fillStyle = rg(ex, ey, 10, 120, ['#ffffff', '#e8d8d0', '#b09088']); g.fill();
    g.save(); ell(ex, ey, 120, 80, sg * .25); g.clip(); g.strokeStyle = 'rgba(200,20,30,.75)'; g.lineWidth = 3; for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(ex + sg * 120, ey + (hash(k) - .5) * 90); g.quadraticCurveTo(ex + sg * 80, ey + (hash(k + 9) - .5) * 60, ex + sg * 30, ey + (hash(k + 4) - .5) * 40); g.stroke(); } g.restore();
    circ(ex, ey, 30, rg(ex, ey, 2, 30, ['#ff8a5a', '#d4102a', '#4a0008'])); circ(ex, ey, 9, '#000'); circ(ex - 9, ey - 9, 6, 'rgba(255,255,255,.9)');
  }
  const mo = lerp(.5, 1.3, eo(seg(u, .05, .4))), my = 1180, mw = 240, mh = 200 * mo;
  ell(CX, my, mw + 16, mh + 14); g.fillStyle = '#5a0a18'; g.fill(); ell(CX, my, mw, mh); g.fillStyle = rg(CX, my, 10, mw, ['#000000', '#1a0004', '#3a0610']); g.fill();
  for (const sg of [-1, 1]) for (let i = 0; i < 11; i++) { const x = CX - mw * .92 + i * mw * .184, yb = my + sg * mh * Math.sqrt(Math.max(0, 1 - ((x - CX) / mw) ** 2)) * .9, Lt = 50 + 34 * hash(i + sg * 3); g.beginPath(); g.moveTo(x - 17, yb); g.quadraticCurveTo(x - 6, yb - sg * Lt * .6, x + (hash(i) - .5) * 8, yb - sg * Lt); g.quadraticCurveTo(x + 6, yb - sg * Lt * .6, x + 17, yb); g.closePath(); g.fillStyle = lg(0, yb, 0, yb - sg * Lt, ['#8a6a4a', '#f2eadc']); g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; g.stroke(); }
  for (let k = 0; k < 3; k++) { const dx = CX - 120 + k * 110; curve([dx, my - mh * .6], [dx + 6, my], [dx - 4, my + mh * .5 * (.6 + .4 * Math.sin(t * 3 + k))], 3, 'rgba(220,200,200,.4)'); }
  if (u > .9) fill('#000');
};
// 12. back to the facts: a CRT TV in a dark room powers on: "TOTOONG NANGYARI"
S.hookback = (t, u) => {
  const tt_ = wordT('l11', 'totoong');
  cam(CX, 900, lerp(1.08, 1.0, eo(seg(u, 0, 1))));
  g.drawImage(TEX.wall, -500, -560); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#8890b0'; g.fillRect(-500, -560, 1800, 1810); g.restore();
  g.drawImage(TEX.floorFront, -410, 1236); const back_ = keep();
  cshadow(540, 1250, 420, 30, .7);
  rr(160, 1080, 760, 170, 14); fs(lg(0, 1080, 0, 1250, ['#6a4430', '#3a2219']), 6); for (const x of [200, 540, 880]) circ(x, 1165, 8, '#c9a45a');
  rr(190, 520, 700, 560, 40); fs(lg(190, 0, 890, 0, ['#7a5236', '#4a2e1e', '#6a4430']), 8);
  rr(222, 552, 520, 440, 60); fs('#14161e', 6);
  for (let k = 0; k < 5; k++) line([[780, 600 + k * 30], [860, 600 + k * 30]], 6, 'rgba(0,0,0,.5)');
  for (const yy of [790, 890]) { circ(820, yy, 30, rg(810, yy - 10, 2, 30, ['#d8d0c0', '#6a6458'])); circ(820, yy, 30, OL, 4); line([[820, yy], [820 + 20 * Math.cos(t * .3 + yy), yy + 20 * Math.sin(t * .3 + yy)]], 4, OL); }
  line([[440, 520], [340, 380]], 6, '#9a9aa8'); line([[480, 520], [600, 370]], 6, '#9a9aa8');
  L(482, 772, 620, C.cyan, 1, .3);
  lightPass('#2a2e52'); back_();
  const on = eo(seg(u, 0, .3)), sx = 482, sy = 772;
  g.save(); rr(240, 570, 484, 404, 50); g.clip();
  g.fillStyle = '#05060c'; g.fillRect(240, 570, 484, 404);
  const hh = 404 * on; g.fillStyle = rg(sx, sy, 20, 300, ['#3a6ad8', '#1a2a6a', '#080c22']); g.fillRect(240, sy - hh / 2, 484, Math.max(4, hh));
  if (u < .32) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(240, sy - 3, 484, 6); }
  if (t > tt_) { const kk = lerp(1.4, 1, eo(seg(t, tt_, tt_ + .2))); g.save(); g.translate(sx, sy); g.scale(kk, kk); g.shadowColor = 'rgba(255,255,255,.8)'; g.shadowBlur = 24; text(TX.stamp[0], 0, -56, 96, '#ffffff', 'Anton'); g.shadowColor = 'rgba(255,49,80,.9)'; text(TX.stamp[1], 0, 56, 96, '#ff5068', 'Anton'); g.restore(); }
  for (let y = 570; y < 974; y += 6) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(240, y + (t * 30 % 6), 484, 2); }
  g.fillStyle = rg(sx - 100, sy - 120, 10, 400, ['rgba(255,255,255,.12)', 'rgba(255,255,255,0)']); g.fillRect(240, 570, 484, 404);
  g.restore();
  glow(sx, sy, 500 * on, C.cyan, .25 * on);
};
// 13. 1964: a newspaper slides under a banker's lamp; calendar pages tear off the wall, day after day
S.record = (t, u) => {
  const Ln = LN.l12;
  cam(CX, 900, lerp(1.04, 1.0, seg(u, 0, span('l12'))));
  g.drawImage(TEX.wall, -500, -560); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#c0a888'; g.fillRect(-500, -560, 1800, 1810); g.restore();
  g.drawImage(TEX.floorTop, 0, 0, 1600, 900, -300, 1000, 1700, 960); const back_ = keep();
  line([[-500, 1000], [1600, 1000]], 10, '#2a1810');
  const p = eo(seg(u, 0, .7)); g.save(); g.translate(lerp(-200, 470, p), 1220); g.rotate(lerp(-.5, -.06, p));
  cshadow(16, 24, 400, 300, .6);
  rr(-380, -300, 760, 600, 6); fs(lg(-380, -300, 380, 300, ['#efe2c2', '#d9c8a0', '#c4b088']), 5);
  text('1964', -300, -258, 46, '#3a2a18', 'Anton', 'left'); line([[-350, -226], [350, -226]], 5, '#3a2a18'); line([[-350, -218], [350, -218]], 2, '#3a2a18');
  text(TX.paper[0], 0, -170, 68, '#2a1c10', 'Anton'); text(TX.paper[1], 0, -102, 68, '#8a1a1a', 'Anton');
  rr(-350, -60, 300, 330, 3); fs('#c9b890', 4); g.save(); rr(-350, -60, 300, 330, 3); g.clip(); g.fillStyle = lg(0, -60, 0, 270, ['#8a7a60', '#4a3e30']); g.fillRect(-350, -60, 300, 330); g.filter = 'grayscale(.8) sepia(.5)'; nico(-200, 260, 280, { t, tired: .7, hood: REDHOOD, lx: -1, ground: 0 }); g.filter = 'none'; g.restore();
  for (let k = 0; k < 9; k++) line([[-20, -40 + k * 36], [350 - 90 * hash(k + 9), -40 + k * 36]], 9, 'rgba(40,30,20,.35)');
  g.restore();
  // the banker's lamp
  cshadow(860, 1110, 120, 14, .6); ell(860, 1100, 80, 18); fs('#806830', 4); line([[860, 1100], [860, 900]], 10, OL); line([[860, 1100], [860, 900]], 5, '#c9a45a');
  g.beginPath(); g.moveTo(720, 900); g.quadraticCurveTo(860, 820, 1000, 900); g.lineTo(980, 930); g.lineTo(740, 930); g.closePath(); fs(lg(0, 830, 0, 930, ['#3aa06a', '#1a5a3a']), 5);
  // the calendar on the wall
  const pages = 11, tA = Ln.t0 + .5, dt = (span('l12') - .6) / (pages - 1), n = Math.min(pages, 1 + Math.floor(Math.max(0, t - tA) / dt));
  const page = (k, x, y, r) => { g.save(); g.translate(x, y); g.rotate(r); rr(-110, -125, 220, 250, 10); fs(lg(0, -125, 0, 125, ['#f4efe4', '#d8d0c0']), 5); g.fillStyle = '#9a1a26'; g.fillRect(-106, -121, 212, 56); text(TX.day, 0, -92, 36, '#fff', 'Anton'); text(String(k), 0, 30, 120, '#2a2436', 'Anton'); rr(-110, -125, 220, 250, 10); g.strokeStyle = OL; g.lineWidth = 5; g.stroke(); for (let j = 0; j < 5; j++) circ(-80 + j * 40, -125, 7, '#9a9aa8'); g.restore(); };
  cshadow(320, 800, 140, 150, .45); page(n, 300, 760, -.03);
  for (let k = 1; k < n; k++) { const a = seg(t, tA + k * dt, tA + k * dt + .8); if (a >= 1) continue; page(k, 300 + a * 420 * (k % 2 ? 1 : -.4), 760 + a * a * 700, -.03 + a * 3.5 * (k % 2 ? 1 : -1)); }
  L(820, 1150, 560, C.amb, 1, .26); L(300, 760, 330, C.warm, .8, .1);
  lightPass(DIM.warm); back_();
  beam([[730, 930], [990, 930], [1150, 1500], [520, 1500]], 860, 930, 860, 1500, C.amb, .14); glow(860, 935, 120, C.warm, .5);
};
// 14. he started forgetting... and once believed he was a famous football player (a dream of a night stadium)
S.football = (t, u) => {
  const tf = wordT('l13', 'football') - .5, tn = wordT('l13', 'Nakakalimot');
  cam(CX, 900, lerp(1.06, 1, eo(seg(u, 0, .6))));
  room(t, { sky: 'night', lamp: 0, bedX: -300, tint: '#8a9ac8' });
  nico(330, 1330, 600, { t, tired: .85, hood: REDHOOD, eyes: t > tf ? 'wide' : 'open', look: .8, lookY: -.6, smile: t > tf ? 1 : 0, lx: 1, rim: 'rgba(120,255,170,.5)' });
  for (let k = 0; k < 6; k++) { const tk = tn + k * .3, px = 330 + (k - 2.5) * 46, py = 735 + (k % 2) * 34, col = ['#e8d27a', '#e89aa8', '#8ad0e8', '#9ae0a8', '#e8b07a', '#e8e4d8'][k]; const a = t < tk ? 0 : seg(t, tk, tk + 1.2); if (a >= 1) continue; g.save(); g.translate(px + a * 120 * (k % 2 ? 1 : -1), py + a * a * 800); g.rotate((k - 2.5) * .12 + a * 4); rr(-30, -30, 60, 60, 3); fs(col, 3); line([[-18, -10], [18, -10]], 3, 'rgba(0,0,0,.3)'); line([[-18, 4], [10, 4]], 3, 'rgba(0,0,0,.3)'); g.restore(); }
  L(330, 820, 360, C.warm, .8, .08);
  const b = back(seg(t, tf, tf + .4), 1.6);
  if (b > 0) L(760, 470, 420 * b, C.grn, 1, .2);
  lightPass(DIM.night);
  if (b <= 0) return;
  cam(CX, 900, lerp(1.06, 1, eo(seg(u, 0, .6))));
  for (let k = 0; k < 3; k++) circ(470 + k * 50, 700 - k * 50, (14 + k * 10) * b, 'rgba(230,240,255,.9)');
  const CL = () => { g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.arc(Math.cos(a) * 250, Math.sin(a) * 170, 70, a - 1.2, a + 1.2); } g.closePath(); };
  g.save(); g.translate(760, 470); g.scale(b, b);
  g.save(); g.shadowColor = 'rgba(200,230,255,.6)'; g.shadowBlur = 40; CL(); g.fillStyle = 'rgba(230,240,255,.92)'; g.fill(); g.restore();
  g.save(); ell(0, 0, 250, 170); g.clip(); grad('#060a1a', '#16204a', -170, 20); for (let i = 0; i < 40; i++) circ(-250 + hash(i) * 500, -40 + hash(i * 3) * 50, 4, `hsl(${hash(i * 5) * 360},50%,60%)`);
  g.fillStyle = lg(0, 0, 0, 170, ['#2f9a4a', '#1a6a32']); g.beginPath(); g.moveTo(-300, 170); g.lineTo(-200, 10); g.lineTo(200, 10); g.lineTo(300, 170); g.fill(); for (let k = -4; k <= 4; k++) line([[k * 45, 10], [k * 70, 170]], 3, 'rgba(255,255,255,.6)');
  for (const sg of [-1, 1]) { line([[sg * 200, 20], [sg * 200, -120]], 6, '#2a2c3a'); rr(sg * 200 - 30, -150, 60, 34, 4); fs('#fffbe0', 3); glow(sg * 200, -134, 140, C.warm, .7); beam([[sg * 200 - 20, -120], [sg * 200 + 20, -120], [sg * 40, 160], [-sg * 120, 160]], sg * 200, -120, 0, 160, C.warm, .2); }
  nico(0, 140, 210, { t, hood: ['#e84a5a', '#b8303e', '#6a1a24'], arms: 'up', smile: 1, tired: 0, lx: -1, ground: 0 });
  ell(0, 140 - 210 * .87, 34, 31); fs(lg(-34, 0, 34, 0, ['#e84a5a', '#8a1a24']), 5); line([[-30, 140 - 210 * .84], [30, 140 - 210 * .84]], 6, '#f4f1ea'); line([[-20, 140 - 210 * .8], [20, 140 - 210 * .8]], 3, '#9a9aa8');
  text('23', 0, 140 - 210 * .52, 30, '#fff', 'Anton', 'center', 5);
  g.save(); g.translate(0, 140 - 210 * 1.22); g.rotate(-.4); ell(0, 0, 30, 19); fs(lg(-30, 0, 30, 0, ['#a0602d', '#5a3214']), 4); line([[-14, 0], [14, 0]], 3, '#fff'); for (let k = -2; k <= 2; k++) line([[k * 5, -4], [k * 5, 4]], 2, '#fff'); g.restore();
  g.restore();
  CL(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 5; g.stroke();
  g.restore();
};
// 15. a real disease where you can't sleep at all: a hospital room at night, a monitor, and the DNA that carries it
S.disease = (t, u) => {
  const tf = wordT('l14', 'Fatal');
  cam(CX, 900, lerp(1.0, 1.06, seg(u, 0, span('l14'))));
  g.drawImage(TEX.wall, -500, -560); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#9ad0c8'; g.fillRect(-500, -560, 1800, 1810); g.restore();
  g.fillStyle = '#d8e0e0'; g.fillRect(-500, 1250, 1800, 900); for (let x = -500; x < 1300; x += 120) line([[x, 1250], [x - 200, 2100]], 3, 'rgba(0,0,0,.15)'); line([[-500, 1250], [1300, 1250]], 8, '#5a6a6a'); const back_ = keep();
  rr(600, 470, 300, 330, 6); g.fillStyle = '#0a1430'; g.fill(); for (let k = 0; k < 14; k++) { rr(600, 470 + k * 24, 300, 14, 2); fs('#c8d0d4', 2); }
  rr(600, 470, 300, 330, 6); g.strokeStyle = OL; g.lineWidth = 10; g.stroke();
  rr(110, 560, 270, 210, 18); fs('#1a1e26', 7); rr(126, 576, 238, 150, 8); g.fillStyle = '#040a08'; g.fill(); line([[245, 770], [245, 830]], 10, OL); rr(195, 826, 100, 14, 6); fs('#2a2e36', 4);
  line([[930, 1250], [930, 520]], 10, '#8a96a2'); line([[880, 520], [980, 520]], 6, '#8a96a2'); rr(880, 530, 100, 150, 24); fs('rgba(210,240,255,.55)', 5); rr(892, 590, 76, 80, 16); g.fillStyle = 'rgba(140,200,255,.5)'; g.fill(); line([[930, 680], [930, 720]], 4, '#c8d0d4'); curve([930, 720], [880, 900], [700, 1000], 3, '#c8d0d4');
  cshadow(590, 1250, 380, 26, .6);
  rr(230, 940, 70, 310, 16); fs(lg(230, 0, 300, 0, ['#c8d0d4', '#7a8692']), 5); rr(880, 1000, 64, 250, 16); fs(lg(880, 0, 944, 0, ['#c8d0d4', '#7a8692']), 5);
  rr(250, 1040, 690, 140, 26); fs(lg(0, 1040, 0, 1180, ['#f4f6f8', '#a8b4c0']), 6);
  for (let k = 0; k < 6; k++) line([[480 + k * 70, 1180], [480 + k * 70, 1250]], 6, '#8a96a2'); line([[460, 1250], [900, 1250]], 6, '#8a96a2'); line([[460, 1180], [900, 1180]], 6, '#8a96a2');
  rr(300, 990, 180, 80, 32); fs(rg(380, 1010, 10, 110, ['#ffffff', '#d6dbe7', '#9aa3bc']), 5);
  face(390, 955, 80, { t, tired: 1, eyes: 'wide', look: .3, lookY: -.6, lx: 1, rim: 'rgba(109,255,168,.5)' });
  g.beginPath(); g.moveTo(440, 1040); g.bezierCurveTo(560, 1010, 760, 1020, 930, 1040); g.lineTo(930, 1176); g.lineTo(440, 1176); g.closePath(); fs(lg(0, 1010, 0, 1176, ['#9ad0e8', '#4a8aa8']), 6);
  L(245, 650, 360, C.grn, 1, .24); L(750, 640, 420, C.moon, .8, .14); L(390, 960, 260, C.grn, .6, .08);
  const d = back(seg(t, tf, tf + .5), 1.5); if (d > 0) L(700, 720, 420 * d, C.cyan, .8, .15);
  lightPass('#2a3a50'); back_();
  for (let k = 0; k < 12; k++) beam([[600, 470 + k * 24 + 14], [900, 470 + k * 24 + 14], [480 - k * 10, 1040 + k * 18], [100 - k * 12, 1000 + k * 18]], 750, 480 + k * 24, 300, 1040, C.moon, .045);
  g.save(); rr(126, 576, 238, 150, 8); g.clip(); g.shadowColor = 'rgba(109,255,168,1)'; g.shadowBlur = 12; g.strokeStyle = GRN; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= 230; x += 3) { const ph = ((x / 230 - t * .8) % 1 + 1) % 1, sp = ph > .45 && ph < .55 ? Math.sin((ph - .45) / .1 * TAU) * 50 : 0; g.lineTo(130 + x, 670 - sp); } g.stroke(); text('92', 330, 600, 30, GRN, 'Anton'); g.restore();
  if (d > 0) { g.save(); g.translate(700, 720); g.scale(d, d); for (let i = 0; i < 12; i++) { const y = -190 + i * 34, a = t * 2.2 + i * .5, x1 = Math.sin(a) * 90, x2 = -x1, z = Math.cos(a); line([[x1, y], [x2, y]], 4, `rgba(${i % 2 ? C.cyan : C.mag},.6)`); g.save(); g.shadowColor = `rgba(${C.cyan},1)`; g.shadowBlur = 16; circ(x1, y, 10 + 3 * z, CYAN); g.shadowColor = `rgba(${C.mag},1)`; circ(x2, y, 10 - 3 * z, MAG); g.restore(); } g.restore(); glow(700, 720, 300 * d, C.cyan, .18); }
};
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
// 16. while you sleep, your brain washes itself (a blue wave sweeps through)
S.brainclean = (t, u) => {
  const tn = wordT('l15', 'nililinis');
  cam(CX, 900, lerp(1.0, 1.06, seg(u, 0, span('l15'))));
  grad('#060a22', '#141a46', -500, 2300);
  for (let i = 0; i < 70; i++) circ(hash(i * 3.3) * W * 1.2 - 60, -100 + hash(i * 1.7) * 1700, 1 + 2 * hash(i), `rgba(255,255,255,${.3 + .4 * Math.sin(t * 2 + i)})`);
  glow(300, 600, 500, C.pur, .18); glow(800, 1200, 500, C.cyan, .12); moon(860, 600, 60);
  glow(CX, 980, 520, t > tn ? C.cyan : C.mag, .25);
  brain(CX, 980, 1.25, t, { wash: t > tn ? seg(t, tn, tn + 2.0) : -1 });
  if (t > tn + .3) for (let k = 0; k < 10; k++) { const a = seg(t, tn + .3 + k * .12, tn + .9 + k * .12); if (a > 0 && a < 1) { glow(300 + hash(k) * 480, 800 + hash(k * 2) * 360, 50, C.white, .6 * Math.sin(Math.PI * a)); star(300 + hash(k) * 480, 800 + hash(k * 2) * 360, 18 * Math.sin(Math.PI * a), '#fff'); } }
};
// 17. skip sleep... the junk piles up
S.dirt = (t, u) => {
  const td = wordT('l16', 'naiipon');
  cam(CX, 900, lerp(1.0, 1.1, seg(u, 0, span('l16'))), 0, t > td ? 2.5 : 0, t);
  grad('#1a0610', '#3a0a1a', -500, 2300);
  const pulse = .5 + .5 * Math.sin(t * 5); glow(CX, 980, 640, C.red, .2 + .2 * pulse);
  brain(CX, 980, 1.25, t, { sick: t > td ? 1 : 0, dirt: seg(t, td - .2, LN.l16.t1) });
  g.save(); g.translate(CX, 540); g.globalAlpha = .6 + .4 * pulse; g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 30; path([[0, -80], [92, 74], [-92, 74]]); g.closePath(); g.strokeStyle = RED; g.lineWidth = 9; g.lineJoin = 'round'; g.stroke(); text('!', 0, 18, 100, RED, 'Anton'); g.restore();
};
// 18. sleep isn't a luxury, it's your strongest medicine: an amber bottle labelled TULOG under a spotlight
S.medicine = (t, u) => {
  const tg = wordT('l17', 'gamot'), tl = wordT('l17', 'luho');
  cam(CX, 900, lerp(1.08, 1, eo(seg(u, 0, .6))));
  g.drawImage(TEX.wall, -500, -560); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#a090c0'; g.fillRect(-500, -560, 1800, 1810); g.restore();
  rr(-200, 1260, 1480, 70, 8); fs(lg(0, 1260, 0, 1330, ['#7a5038', '#3a2219']), 6); g.fillStyle = '#120e1a'; g.fillRect(-500, 1330, 1800, 900); const back_ = keep();
  const open = t > tg ? eo(seg(t, tg, tg + .3)) : 0;
  cshadow(CX + 20, 1262, 240, 22, .7);
  for (let k = 0; k < 5; k++) { const px = 230 + k * 40 + (k % 2) * 14, py = 1250 - (k % 2) * 8; ell(px, py, 18, 10, k); fs(lg(px - 18, 0, px + 18, 0, ['#f4f1ea', '#a8a49a']), 3); line([[px - 12, py], [px + 12, py]], 2, 'rgba(0,0,0,.25)'); }
  g.save(); g.translate(CX, 1000); g.rotate(-.04);
  rr(-200, -260, 400, 520, 50); fs(lg(-200, 0, 200, 0, ['#e8902a', '#b8601a', '#5a2a08']), 8);
  rr(-170, -240, 60, 470, 30); g.fillStyle = 'rgba(255,230,180,.25)'; g.fill(); rr(130, -220, 22, 420, 11); g.fillStyle = 'rgba(255,230,180,.15)'; g.fill();
  rr(-172, -110, 344, 232, 14); fs(lg(0, -110, 0, 122, ['#f4f1ea', '#d8d0c0']), 6); moon(-96, 0, 48, '#3a3a7a'); text(TX.bottle, 44, 4, 88, '#1a1830', 'Anton'); line([[-150, 80], [150, 80]], 3, 'rgba(0,0,0,.2)'); line([[-150, 96], [80, 96]], 3, 'rgba(0,0,0,.2)');
  g.save(); g.translate(0, -290 - open * 170); g.rotate(open * .9); rr(-175, -60, 350, 100, 24); fs(lg(0, -60, 0, 40, ['#f4f1ea', '#b8b4aa']), 8); for (let k = -3; k <= 3; k++) line([[k * 44, -50], [k * 44, 30]], 5, 'rgba(0,0,0,.25)'); g.restore();
  g.restore();
  L(CX, 980, 560, C.warm, 1, .2);
  lightPass(DIM.purple); back_();
  beam([[CX - 90, -400], [CX + 90, -400], [CX + 330, 1300], [CX - 330, 1300]], CX, -400, CX, 1300, C.warm, .13); motes(CX - 300, 200, CX + 300, 1250, 30, t, C.warm, .6, 4);
  if (t > tl - .5 && open <= 0) { const kk = back(seg(t, tl - .5, tl - .2), 1.8), lx = seg(t, tl, tl + .5); g.save(); g.translate(CX, 540); g.scale(kk, kk);
    g.save(); g.shadowColor = 'rgba(82,216,255,1)'; g.shadowBlur = 30; path([[-110, -40], [-60, -100], [60, -100], [110, -40], [0, 100]]); g.closePath(); g.fillStyle = 'rgba(82,216,255,.25)'; g.fill(); g.strokeStyle = CYAN; g.lineWidth = 7; g.stroke(); line([[-110, -40], [110, -40]], 5, CYAN); line([[-30, -100], [-40, -40], [0, 100], [40, -40], [30, -100]], 4, 'rgba(160,235,255,.7)'); g.restore();
    if (lx > 0) { g.save(); g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 24; line([[-150, -150], [-150 + 300 * eo(lx), -150 + 300 * eo(lx)]], 20, RED); g.restore(); }
    g.restore(); }
  if (open > 0) for (let k = 0; k < 14; k++) { const a = seg(t, tg + k * .05, tg + 1.4 + k * .05); if (a <= 0) continue; const ang = -Math.PI / 2 + (hash(k) - .5) * 2.2, dd = a * (380 + 200 * hash(k + 3)); const x = CX + Math.cos(ang) * dd, y = 700 + Math.sin(ang) * dd + a * a * 500; glow(x, y, 60, C.amb, .5); if (k % 2) moon(x, y, 32, '#ffe08a'); else star(x, y, 28, '#fff6d0'); }
};
// 19. 7 to 9 hours, every night: Nico asleep, a battery filling above him
S.seven = (t, u) => {
  const Ln = LN.l18, p = seg(t, Ln.t0 + .2, Ln.t1);
  cam(560, 900, 1);
  const post = room(t, { sky: 'night', lamp: 0, clock: 7 + 2 * p, bedX: 260, tint: '#90c8c0' });
  face(255, 1000, 64, { t, eyes: 'shut', smile: 1, lx: 1, rim: RIMM });
  cat(560, 1050, .75, { t, flip: -1 });
  L(300, 1000, 300, C.moon, .8, .08); L(560, 700, 360, C.grn, .7, .14);
  lightPass(DIM.night); post();
  for (let k = 0; k < 3; k++) { g.save(); g.shadowColor = 'rgba(140,170,255,.9)'; g.shadowBlur = 20; text('Z', 340 + k * 40, 900 - k * 50 - (t * 30 % 30), 50 - k * 8, '#cfdcff', 'Anton', 'center', 5); g.restore(); }
  g.save(); g.translate(560, 700); g.shadowColor = 'rgba(109,255,168,.9)'; g.shadowBlur = 30; rr(-230, -100, 440, 200, 30); g.strokeStyle = GRN; g.lineWidth = 9; g.stroke(); rr(214, -40, 36, 80, 10); g.fillStyle = GRN; g.fill(); g.shadowBlur = 0;
  const n = Math.min(5, Math.floor(p * 5.999) + 1), segc = n === 5 ? ['#a8ffc8', '#3ac87a'] : [['#ff8a8a', '#c43a4a'], ['#ffb87a', '#c8742a'], ['#ffe08a', '#c8a42a'], ['#a8ffc8', '#3ac87a'], ['#a8ffc8', '#3ac87a']][n - 1];
  for (let k = 0; k < n; k++) { rr(-205 + k * 82, -76, 70, 152, 14); g.fillStyle = lg(0, -76, 0, 76, segc); g.fill(); }
  g.shadowColor = 'rgba(109,255,168,.9)'; g.shadowBlur = 16; text(`${Math.round(20 + 80 * p)}%`, 0, 160, 66, '#eafff2', 'Anton'); g.restore();
};
// 20. POV: you, on your phone, watching this
S.pov = (t, u) => {
  cam(CX, 900, lerp(1.1, 1, eo(seg(u, 0, .6))));
  grad('#0a0c1c', '#14102a', -500, 2300);
  for (let i = 0; i < 14; i++) { const bx = hash(i * 3.3) * W, by = 200 + hash(i * 7.7) * 1400; glow(bx, by, 40 + 60 * hash(i), i % 3 ? C.amb : C.pur, .12); }
  const back_ = keep();
  limb([[790, 2150], [720, 1600], [680, 1330]], 120, HOODC, -1);
  g.save(); g.translate(CX, 860); g.rotate(-.04); rr(-252, -482, 504, 964, 62); fs(lg(-252, 0, 252, 0, ['#3a3c4a', '#15161f']), 10); rr(-238, -468, 476, 936, 52); g.fillStyle = '#05060a'; g.fill(); g.restore();
  limb([[180, 2150], [250, 1450], [320, 1180]], 120, HOODC, 1);
  for (let k = 0; k < 4; k++) { g.save(); g.translate(318 + k * 4, 1080 + k * 55); g.rotate(-.1); rr(-20, -22, 70, 42, 20); fs(lg(-20, 0, 50, 0, [SKIN[0], SKIN[2]]), 6); g.restore(); }
  for (let k = 0; k < 3; k++) { g.save(); g.translate(770 - k * 2, 1110 + k * 60); g.rotate(.1); rr(-50, -22, 70, 42, 20); fs(lg(-50, 0, 20, 0, [SKIN[2], SKIN[0]]), 6); g.restore(); }
  L(CX, 860, 700, C.cyan, 1, .14);
  lightPass('#262a50'); back_();
  g.save(); g.translate(CX, 860); g.rotate(-.04);
  g.save(); rr(-226, -446, 452, 892, 42); g.clip(); g.translate(-226, -446); g.scale(452 / W, 892 / 1700); g.translate(0, -90);
  const post = topDown(t, { eyes: 'wide', tired: .4 }); LIGHTS = []; g.globalCompositeOperation = 'multiply'; g.fillStyle = '#4a5490'; g.fillRect(-300, -400, 1700, 2600); g.globalCompositeOperation = 'source-over'; post();
  glow(130, 560, 500, C.amb, .3); g.restore();
  text('2:47', 0, -410, 40, '#fff', 'Anton'); rr(-200, 404, 400, 10, 5); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(); rr(-200, 404, 400 * ((t * .2) % 1), 10, 5); g.fillStyle = RED; g.fill();
  g.restore();
  glow(CX, 860, 650, C.cyan, .16);
};
// 21. how many hours have you been awake? A twin-bell alarm clock rattling; a timer racing
S.hours = (t, u) => {
  cam(CX, 900, back(seg(u, 0, .3), 1.8) * .2 + .8);
  grad('#140810', '#2a0c18', -500, 2300); glow(CX, 800, 700, C.red, .25);
  const sh = Math.sin(t * 46) * 7, back_ = keep();
  g.save(); g.translate(CX + sh, 800); g.rotate(Math.sin(t * 46) * .03);
  for (const sg of [-1, 1]) line([[sg * 30, -270], [sg * 140, -232]], 10, '#9aa0b0');
  for (const sg of [-1, 1]) { g.save(); g.translate(sg * 155, -235); g.rotate(sg * .5); ell(0, 0, 76, 62); fs(rg(-20, -20, 5, 80, ['#f4f6fa', '#a8b0c0', '#4a5060']), 7); g.restore(); }
  line([[0, -270], [Math.sin(t * 46) * 60, -300]], 8, '#9aa0b0'); circ(Math.sin(t * 46) * 60, -300, 12, '#c8ccd8');
  for (const sg of [-1, 1]) line([[sg * 150, 210], [sg * 200, 300]], 18, '#4a5060');
  circ(0, 0, 272, rg(-80, -80, 20, 280, ['#ff5a6a', '#c4122e', '#5a0010'])); circ(0, 0, 272, OL, 10);
  circ(0, 0, 228, rg(-40, -40, 10, 230, ['#ffffff', '#e8e4dc', '#b8b0a4'])); circ(0, 0, 228, '#8a8478', 6);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; text(String(k || 12), Math.sin(a) * 182, -Math.cos(a) * 182 + 3, 40, '#2a2436', 'Anton'); }
  const a = t * 7; line([[0, 0], [Math.sin(a) * 170, -Math.cos(a) * 170]], 5, RED); line([[0, 0], [Math.sin(a / 12) * 110, -Math.cos(a / 12) * 110]], 14, '#2a2436'); line([[0, 0], [Math.sin(a / 3) * 150, -Math.cos(a / 3) * 150]], 9, '#2a2436'); circ(0, 0, 16, '#c9a45a');
  g.fillStyle = rg(-120, -120, 10, 200, ['rgba(255,255,255,.35)', 'rgba(255,255,255,0)']); g.beginPath(); g.arc(0, 0, 228, 0, TAU); g.fill();
  g.restore();
  L(CX, 800, 560, C.warm, 1, .16);
  lightPass(DIM.red); back_();
  const secs = 16 * 3600 + 42 * 60 + (Math.floor(u * 37) * 11) % 3600, hh = Math.floor(secs / 3600), mm = Math.floor(secs / 60) % 60, s_ = secs % 60;
  reset(); glass(CX - 290, 1160, 580, 150, 30, 'rgba(255,49,80,.7)', 4, 'rgba(255,49,80,.8)'); g.save(); g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 26; text(`${hh}:${String(mm).padStart(2, '0')}:${String(s_).padStart(2, '0')}`, CX, 1240, 106, '#ff6a7a', 'Anton'); g.restore();
};
// 22. the easter egg: the sunrise shot again, frozen; a magnifier sweeps it; "NASAAN?"
const CV2 = mk(W, H), g2 = CV2.getContext('2d');
S.egg = (t, u) => {
  const t0 = LN.l05.t0 + .2; ZK = 1;
  S.h24(t0, t0 - LN.l05.t0, 0); reset(); g2.globalCompositeOperation = 'copy'; g2.drawImage(cv, 0, 0);
  g.fillStyle = 'rgba(5,6,16,.45)'; g.fillRect(0, 0, W, H);
  const mx = CX + Math.sin(u * 1.8) * 300, my = 860 + Math.cos(u * 1.3) * 220;
  g.save(); g.beginPath(); g.arc(mx, my, 150, 0, TAU); g.clip(); g.translate(mx, my); g.scale(1.6, 1.6); g.translate(-mx, -my); g.drawImage(CV2, 0, 0); g.restore();
  reset(); g.fillStyle = rg(mx - 50, my - 60, 10, 150, ['rgba(255,255,255,.18)', 'rgba(255,255,255,0)']); g.beginPath(); g.arc(mx, my, 150, 0, TAU); g.fill();
  circ(mx, my, 150, OL, 24); circ(mx, my, 150, lg(mx - 150, my - 150, mx + 150, my + 150, ['#e8e4dc', '#8a8478']), 12); limb([[mx + 110, my + 110], [mx + 240, my + 240]], 30, ['#9a6a3a', '#6a4424', '#3a2210'], -1);
  g.save(); g.shadowColor = 'rgba(255,170,80,.9)'; g.shadowBlur = 34; text(TX.where, CX, 330, 170, YEL, 'Anton', 'center', 16); g.restore();
  const b = back(seg(t, wordT('l21', 'Comment'), wordT('l21', 'Comment') + .3), 2);
  if (b > 0) { g.save(); g.translate(CX, 1240); g.scale(b, b); glass(-220, -80, 440, 160, 40, 'rgba(255,255,255,.6)', 4, 'rgba(255,255,255,.5)'); path([[-120, 78], [-160, 140], [-60, 78]]); g.closePath(); g.fillStyle = 'rgba(8,10,22,.78)'; g.fill(); g.save(); g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 20; text('0:??', 0, 4, 100, '#ff6a7a', 'Anton'); g.restore(); g.restore(); }
};
// 23. share it with the friend who never sleeps
S.cta = (t, u) => {
  cam(CX, 900, 1);
  grad('#0c0a20', '#1e1236', -500, 2300);
  for (let i = 0; i < 18; i++) { const bx = hash(i * 3.3) * W + Math.sin(t * .4 + i) * 30, by = 300 + hash(i * 7.7) * 1300 + Math.cos(t * .3 + i) * 20; glow(bx, by, 50 + 80 * hash(i), [C.amb, C.pur, C.mag][i % 3], .14); }
  const back_ = keep();
  nico(300, 1320, 520, { t, smile: 1, tired: 0, arms: 'out', lx: 1, rim: 'rgba(255,179,87,.6)' });
  nico(780, 1320, 520, { t, hood: GRNHOOD, tired: 1, mouth: .5 + .5 * Math.sin(t * 3), eyes: 'open', sway: Math.sin(t * 2) * .5, lx: -1, rim: 'rgba(154,123,255,.6)' });
  L(300, 1000, 420, C.amb, 1, .14); L(780, 1000, 420, C.pur, 1, .14);
  lightPass(DIM.night);
  const k = back(seg(u, 0, .3), 1.8);
  reset(); g.save(); g.translate(CX, 420); g.scale(k, k); glass(-430, -150, 860, 300, 36, 'rgba(255,179,87,.6)', 3, 'rgba(255,179,87,.7)'); text(TX.share[0], 0, -50, 100, '#fff', 'Anton'); g.save(); g.shadowColor = 'rgba(255,170,80,.9)'; g.shadowBlur = 26; text(TX.share[1], 0, 62, 80, YEL, 'Anton'); g.restore(); g.restore();
  back_(); const b = Math.sin(t * 4) * 14; g.save(); g.translate(540, 800 + b); g.rotate(-.2); g.shadowColor = 'rgba(255,179,87,1)'; g.shadowBlur = 30; g.beginPath(); g.moveTo(-110, 60); g.quadraticCurveTo(-90, -60, 50, -60); g.lineTo(50, -110); g.lineTo(140, -30); g.lineTo(50, 50); g.lineTo(50, 0); g.quadraticCurveTo(-60, 0, -110, 60); g.closePath(); g.fillStyle = 'rgba(255,179,87,.25)'; g.fill(); g.strokeStyle = AMB; g.lineWidth = 8; g.lineJoin = 'round'; g.stroke(); g.restore();
};
// 24. the loop: back in bed, eyes shut... they snap open (= frame 1)
S.loop = (t, u) => {
  const op = u > .55;
  cam(CX, 760, op ? 1.0 : lerp(1.16, 1.06, seg(u, 0, .55)));
  const post = topDown(t, { eyes: op ? 'wide' : 'shut', tired: .35 });
  lightPass(DIM.night); post();
};

function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .22; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }

// ---------- frame ----------
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }   // same scene continues: no restart
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
const NOPUNCH = ['micro', 'scare', 'hookback', 'egg', 'pov', 'hours', 'cta', 'record', 'awake'];
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  const ln = TL.lines.find(l => l.words && t >= l.t0 && t < l.t1 + .2);
  ZK = 1; BLACK = 0;
  if (ln && ln.t1 - ln.t0 > 2.4 && !NOPUNCH.includes(sh[2])) { const mid = ln.words[Math.floor(ln.words.length / 2)][1]; ZK = 1 + .08 * eo(seg(t, mid, mid + .35)); }
  S[sh[2]](t, u);
  bloom();
  vignette(sh[2] === 'scare' ? .7 : .55);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'awake') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .55, .75)));
  counter(t);
  if (!['scare', 'egg', 'cta'].includes(sh[2])) statCard(t);
  if (BLACK) { reset(); g.fillStyle = `rgba(0,0,0,${BLACK})`; g.fillRect(0, 0, W, H); }
  if (!['scare', 'cta'].includes(sh[2])) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('80px Creepster')]).then(() => true);

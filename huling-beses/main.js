// Ang Huling Beses (imagine your phone buzzing at dinner: 'this is the last dinner with all of you'): an Art Deco Pinoy reel, 1080x1920.
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
// Engine from ../nanay and ../elnino; the look is new: flat Art Deco shapes in maroon, teal and gold, sunbursts and stepped arches,
// geometric figures with gold edges, and the notifications as gold-framed cards. No light pass here: the deco palette carries the mood.
const W = 1080, H = 1920, CX = W / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'); let g = cv.getContext('2d');
const LANG = new URLSearchParams(location.search).get('lang') || 'tl';     // tl (default) | en
const SUF = LANG === 'tl' ? '' : '.' + LANG;
const TL = await (await fetch(`timeline${SUF}.json`)).json();
const ANCH = SUF ? await (await fetch(`anchors${SUF}.json`)).json() : {};
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
const TX = {
  tl: { t1: 'IMAGINE', t2: 'ANG HULING BESES',
        share: ['I-COMMENT MO', 'ANG HULING BESES NA HINDI MO ALAM'], share2: ['I-SHARE MO', 'SA KASABAY MONG KUMAIN MAMAYA'], cal: '2026' },
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
const wordTx = (id, w) => { w = ANCH[`${id}:${w}`] || w; const l = LN[id]; const x = l && l.words && l.words.find(v => v[0].toLowerCase().replace(/[^a-z0-9']/g, '') === w.toLowerCase()); return x ? x[1] : (l ? l.t0 : 0); };
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
  if (o.back) {      // seen from behind: ears, the nape, a full head of hair with a lit edge
    for (const sg of [-1, 1]) { ell(x + sg * r * .95, y + r * .12, r * .17, r * .25, sg * .15); fs(skin[1], r * .05); }
    ell(x, y + r * .05, r * 1.0, r * 1.02); g.fillStyle = rg(x + lx * r * .35, y - r * .6, r * .1, r * 1.4, [hair[1], hair[0], '#06050a']); g.fill(); g.strokeStyle = OL; g.lineWidth = r * .055; g.stroke();
    for (let i = 0; i < 16; i++) { const a = Math.PI * (1.05 + .9 * hash(i * 3.3)); curve([x + Math.cos(a) * r * .2, y - r * .7], [x + Math.cos(a) * r * .7, y - r * .2 + Math.sin(a) * r * .3], [x + Math.cos(a) * r * .9, y + r * .55], r * .03, `rgba(0,0,5,${.3 + .3 * hash(i)})`); }
    if (rim) { g.save(); ell(x, y + r * .05, r * 1.0, r * 1.02); g.clip(); g.translate(lx * r * .06, 0); ell(x, y + r * .05, r * 1.0, r * 1.02); g.lineWidth = r * .1; g.strokeStyle = rim; g.stroke(); g.restore(); }
    if (o.cap) cap(x, y, r, o.cap, lx, 1);
    return;
  }
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
  if (o.glasses) { for (const sg of [-1, 1]) { ell(x + sg * r * .37, y + r * .04, r * .29, r * .24); g.fillStyle = 'rgba(180,210,255,.12)'; g.fill(); g.strokeStyle = OL; g.lineWidth = r * .05; g.stroke(); } line([[x - r * .09, y], [x + r * .09, y]], r * .045, OL); }
  const my = y + r * .6;
  if (mouth > .05) {
    const mw = r * (.15 + .07 * mouth), mh = r * (.06 + .26 * mouth), mc_ = my + mh * .3;
    ell(x, mc_, mw, mh); g.fillStyle = '#2a0812'; g.fill();
    g.save(); ell(x, mc_, mw, mh); g.clip();
    if (zombie) { g.fillStyle = '#c8c0a8'; for (let k = 0; k < 7; k++) { const tx = x - mw + (k + .5) * mw * 2 / 7; path([[tx - mw * .13, mc_ - mh], [tx + mw * .13, mc_ - mh], [tx + (hash(k) - .5) * mw * .1, mc_ - mh * (.45 + .2 * hash(k + 3))]]); g.closePath(); g.fill(); path([[tx - mw * .12, mc_ + mh], [tx + mw * .12, mc_ + mh], [tx, mc_ + mh * (.5 + .2 * hash(k + 7))]]); g.closePath(); g.fill(); } }
    else { g.fillStyle = '#efe6da'; g.fillRect(x - mw, mc_ - mh, mw * 2, mh * .34); ell(x, mc_ + mh * .85, mw * .7, mh * .45); g.fillStyle = '#b8455a'; g.fill(); }
    g.restore();
    ell(x, mc_, mw, mh); g.strokeStyle = zombie ? '#3a1018' : OL; g.lineWidth = r * .05; g.stroke();
  } else if (smile) { curve([x - r * .2, my - r * .05], [x, my + r * .14], [x + r * .2, my - r * .05], r * .055, '#4a1a22'); curve([x - r * .08, my + r * .13], [x, my + r * .17], [x + r * .08, my + r * .13], r * .03, 'rgba(150,60,60,.5)'); }
  else { const dn = tired * r * .05; g.beginPath(); g.moveTo(x - r * .17, my + dn); g.quadraticCurveTo(x, my - r * .04, x + r * .17, my + dn); g.strokeStyle = zombie ? '#2a1418' : '#4a1a22'; g.lineWidth = r * .05; g.lineCap = 'round'; g.stroke(); curve([x - r * .08, my + r * .08], [x, my + r * .12], [x + r * .08, my + r * .08], r * .03, 'rgba(120,50,50,.45)'); }
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
  if (o.cap) cap(x, y, r, o.cap, lx);
  if (tired > .55) for (let k = 0; k < 4; k++) { const a = -2.5 + k * .45; curve([x + Math.cos(a) * r * 1.05, y - r * .1 + Math.sin(a) * r * 1.15], [x + Math.cos(a) * r * 1.32, y - r * .1 + Math.sin(a) * r * 1.38 + Math.sin(t * 2 + k) * 3], [x + Math.cos(a + .22) * r * 1.4, y - r * .1 + Math.sin(a + .22) * r * 1.42], r * .03, hair[0]); }
  if (sweat > 0) for (let i = 0; i < 2; i++) {
    const p = ((t * .4 + i * .5) % 1), sx = x + (i ? .8 : -.76) * r, sy = y - r * .4 + p * r * .7;
    g.save(); g.globalAlpha = sweat * (1 - p); g.beginPath(); g.moveTo(sx, sy - r * .13); g.quadraticCurveTo(sx + r * .08, sy, sx, sy + r * .05); g.quadraticCurveTo(sx - r * .08, sy, sx, sy - r * .13); fs('#a9d8ff', r * .025); circ(sx - r * .02, sy - r * .02, r * .015, '#fff'); g.restore();
  }
}
// a cap (the guard's): a dome over the hair, a brim and a badge (back = no brim or badge)
function cap(x, y, r, cc, lx, back = 0) {
  g.beginPath(); g.ellipse(x, y - r * .42, r * 1.08, r * .72, 0, Math.PI, TAU); g.closePath(); fs(lg(x - r, 0, x + r, 0, lx < 0 ? cc : [cc[2], cc[1], cc[0]]), r * .05);
  if (back) return; ell(x, y - r * .4, r * 1.14, r * .16); fs(cc[2], r * .04); circ(x, y - r * .74, r * .13, '#d9b45a'); circ(x, y - r * .74, r * .13, OL, r * .03);
}
// a person, front view. (x, y) = feet. outfit hoodie | shirt (white shirt + tie). arms: down | out | phone | reach | rub | up.
// sit 0..1, walk = phase or null, slump 0..1 (head bowed), bandage = a bloody bandage on the right hand, longHair, twitch (fingers)
function person(x, y, h, o = {}) {
  const { t = 0, walk = null, arms = 'down', sit = 0, sway = 0, hood = HOODC, lx = -1, rim = null, ground = 1, skin = SKIN, outfit = 'hoodie', slump = 0, bandage = 0, longHair = 0, legs = JEANC, twitch = 0, zombie = 0 } = o;
  const bk = o.back, lw = h * .052, sw = walk === null ? 0 : Math.sin(walk), bob = walk === null ? 0 : Math.abs(Math.cos(walk)) * h * .012, br = zombie ? 0 : Math.sin(t * 2.1) * h * .004;
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
    if (bk) { for (const sg of [-1, 1]) curve([x + sg * h * .02, neck[1] + h * .1], [x + sg * h * .05, neck[1] + h * .2], [x + sg * h * .03, hip[1] - h * .03], h * .004, 'rgba(0,0,10,.25)'); }
    g.fillStyle = 'rgba(0,0,10,.22)'; g.fillRect(x - h * .2, hip[1] + h * .015, h * .4, h * .07);
    for (let k = -10; k <= 10; k++) line([[x + k * h * .012, hip[1] + h * .02], [x + k * h * .012, hip[1] + h * .07]], h * .002, 'rgba(0,0,10,.25)');
    if (!bk) { g.beginPath(); g.moveTo(x - h * .085, hip[1] - h * .095); g.lineTo(x + h * .085, hip[1] - h * .095); g.lineTo(x + h * .1, hip[1] - h * .01); g.lineTo(x - h * .1, hip[1] - h * .01); g.closePath(); g.fillStyle = 'rgba(0,0,10,.12)'; g.fill(); g.strokeStyle = 'rgba(0,0,10,.45)'; g.lineWidth = h * .004; g.stroke(); }
  } else {
    if (!bk) for (let k = 0; k < 5; k++) circ(neck[0] + h * .004, neck[1] + h * (.09 + k * .05), h * .005, 'rgba(0,0,0,.35)');
    if (zombie) for (let k = 0; k < 6; k++) { ell(x + (hash(k * 3.1) - .5) * h * .2, neck[1] + h * (.06 + .2 * hash(k * 1.7)), h * (.012 + .02 * hash(k)), h * (.01 + .03 * hash(k + 2)), k); g.fillStyle = `rgba(110,10,20,${.5 + .3 * hash(k)})`; g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - h * .2, hip[1] + h * .01, h * .4, h * .02);
  }
  g.restore();
  if (bk) { if (outfit === 'hoodie') { ell(neck[0], neck[1] + h * .045, h * .09, h * .062); fs(lg(neck[0] - h * .09, 0, neck[0] + h * .09, 0, hood), h * .006); } else { rr(neck[0] - h * .05, neck[1] + h * .005, h * .1, h * .03, h * .01); fs(SHIRT[1], h * .004); } }
  else if (outfit === 'hoodie') for (const sg of [-1, 1]) { const a = [neck[0] + sg * h * .025, neck[1] + h * .035], b = [neck[0] + sg * h * .032 + Math.sin(t * 2 + sg) * h * .003, neck[1] + h * .13]; line([a, b], h * .006, '#d8d4cc'); rr(b[0] - h * .004, b[1], h * .008, h * .016, h * .003); g.fillStyle = '#9a968e'; g.fill(); }
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
    else if (arms === 'offer' && sg > 0) { e = [s0[0] + h * .13, s0[1] + h * .07]; hd = [s0[0] + h * .27, s0[1] + h * .05]; }
    else if (arms === 'shh' && sg > 0) { e = [s0[0] + h * .07, s0[1] + h * .15]; hd = [hc[0] + h * .02, hc[1] + h * .07]; }
    else if (arms === 'oath') { if (sg < 0) { e = [s0[0] - h * .12, s0[1] - h * .02]; hd = [s0[0] - h * .12, s0[1] - h * .21]; } else { e = [s0[0] + h * .03, s0[1] + h * .15]; hd = [s0[0] - h * .03, s0[1] + h * .24]; } }   // right hand up, left hand on the Bible
    else if (arms === 'lap') { e = [s0[0] + sg * h * .05, s0[1] + h * .15]; hd = [x + sg * h * .07, hip[1] + h * .02]; }
    else { const s2 = walk === null ? 0 : -sg * sw; e = [s0[0] + sg * h * .04 + s2 * h * .05, s0[1] + h * .15]; hd = [s0[0] + sg * h * .05 + s2 * h * .1, s0[1] + h * .3]; }
    limb([s0, e, hd], lw, hood, lx);
    const dx = hd[0] - e[0], dy = hd[1] - e[1], d = Math.hypot(dx, dy) || 1, c0 = [hd[0] - dx / d * h * .028, hd[1] - dy / d * h * .028];
    line([c0, hd], lw + 5, OL); line([c0, hd], lw * .92, hood[outfit === 'shirt' ? 0 : 2]);
    const hx_ = hd[0] + dx / d * h * .015, hy_ = hd[1] + dy / d * h * .015;
    hand(hx_, hy_, h * .03, Math.atan2(dy, dx), { sg: sg * (dy > 0 ? 1 : -1), skin, twitch: sg > 0 ? twitch : 0 });
    if (bandage && sg > 0) { g.save(); g.translate(hx_, hy_); g.rotate(Math.atan2(dy, dx)); for (let k = 0; k < 3; k++) { rr(-h * .025 + k * h * .012, -h * .03, h * .014, h * .06, h * .005); fs(k === 1 ? '#d8d2c4' : '#ece6da', h * .003); } ell(h * .004, -h * .006, h * .016, h * .013); g.fillStyle = 'rgba(150,10,25,.85)'; g.fill(); g.restore(); }
    if (arms === 'phone' && sg > 0) { rr(hx_ - h * .02, hy_ - h * .05, h * .04, h * .075, h * .008); fs('#15161f', h * .004); }
  });
  if (arms !== 'rub' && arms !== 'shh') drawArms();
  if (longHair) { rr(hc[0] - h * .155, hc[1] - h * .08, h * .31, h * .27, h * .1); g.fillStyle = lg(0, hc[1] - h * .08, 0, hc[1] + h * .19, [o.hair ? o.hair[1] : HAIRC[1], '#08070c']); g.fill(); g.strokeStyle = OL; g.lineWidth = h * .006; g.stroke(); }
  if (slump > 0) {
    g.save(); g.translate(hc[0], hc[1]); g.scale(1, 1 - .16 * slump); face(0, 0, h * .14, { ...o, lx, rim, eyes: slump > .5 ? 'shut' : o.eyes });
    g.fillStyle = lg(0, -h * .04, 0, h * .14, ['rgba(5,6,12,0)', `rgba(5,6,12,${.85 * slump})`]); g.beginPath(); g.ellipse(0, h * .02, h * .145, h * .14, 0, 0, TAU); g.fill(); g.restore();
  } else face(hc[0], hc[1], h * .14, { ...o, lx, rim });
  if (arms === 'rub' || arms === 'shh') drawArms();
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
// a zombie shuffling: hunched silhouette, arms forward, pale eyes
function shambler(x, y, h, t, o = {}) {
  const { col = '#0a0a10', eyes = 1, alpha = 1, rim = null, ph = 0 } = o; if (alpha <= 0) return;
  const sw = Math.sin(t * 2.2 + ph), tilt = .2 + .08 * Math.sin(t * 1.3 + ph);
  const draw = (c, ox, oy) => {
    g.save(); g.translate(x + ox, y + oy); g.fillStyle = c; g.strokeStyle = c; g.lineCap = 'round';
    for (const sg of [-1, 1]) { g.lineWidth = h * .075; path([[sg * h * .05, -h * .46], [sg * h * .07 + sg * sw * h * .03, -h * .24], [sg * h * .08 + sg * sw * h * .05, 0]]); g.stroke(); }
    path([[-h * .13, -h * .78], [h * .13, -h * .76], [h * .1, -h * .44], [-h * .11, -h * .44]]); g.closePath(); g.fill();
    for (const sg of [-1, 1]) { g.lineWidth = h * .055; path([[sg * h * .12, -h * .74], [sg * h * .16, -h * .62 + sg * sw * h * .02], [sg * h * .12, -h * .55 - h * .06]]); g.stroke(); }
    g.save(); g.translate(0, -h * .86); g.rotate(tilt); ell(0, 0, h * .075, h * .085); g.fill(); for (let k = 0; k < 5; k++) { g.lineWidth = h * .01; path([[-h * .06 + k * h * .03, -h * .06], [-h * .07 + k * h * .03 + Math.sin(t + k) * h * .01, h * .04]]); g.stroke(); } g.restore();
    g.restore();
  };
  g.save(); g.globalAlpha *= alpha; if (rim) draw(rim, -3, -2); draw(col, 0, 0);
  if (eyes > 0) for (const sg of [-1, 1]) { const ex = x + Math.cos(tilt) * sg * h * .028 - Math.sin(tilt) * 0, ey = y - h * .87 + sg * tilt * h * .028; glow(ex, ey, h * .05, '230,240,220', .5 * eyes); circ(ex, ey, h * .009, '#f0f4e8'); }
  g.restore();
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
  g.font = '90px Anton'; const s1 = Math.min(1, 880 / g.measureText(TX.t1).width); g.font = '150px Anton'; const s2 = Math.min(1, 880 / g.measureText(TX.t2).width);
  g.save(); g.translate(0, -62); g.scale(s1, s1); text(TX.t1, 0, 0, 90, '#f4f1ea', 'Anton', 'center', 12); g.restore();
  g.save(); g.translate(0, 62); g.scale(s2, s2); g.shadowColor = 'rgba(255,60,80,.9)'; g.shadowBlur = 34; text(TX.t2, 0, 0, 150, '#ff5068', 'Anton', 'center', 14); g.restore();
  g.restore(); g.globalAlpha = 1;
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
const REDCAP = [];
function captions(t) {
  let last = null; for (const l of TL.lines) { if (l.t0 - .02 > t) break; last = l; }      // only the line being spoken (no overlap at the joins)
  for (const l of last ? [last] : []) {
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



// ---------- the story: event times come from words in the script, so the picture follows the narrator ----------
function T(id) { return LN[id].t0; } function E(id) { return LN[id].t1; }
const wx = (id, w) => wordT(id, w);
const mixHex = (a, b, u) => { const p = h => h[0] === '#' ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).map(Number), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };   // nests
const flick = t => .86 + .09 * Math.sin(t * 13) + .05 * Math.sin(t * 31 + 1);
const YOU = { hood: ['#4a6a9a', '#34507a', '#1c2c48'], legs: ['#3a3e4a', '#26282f', '#121318'], skin: ['#c48a64', '#9a6444', '#5a3624'], hair: HAIRC };
const NANAY = { hood: ['#c87a8a', '#a05a6a', '#5a2a3a'], legs: ['#7a5a6a', '#5a4050', '#2e2028'], skin: ['#d0a080', '#a87656', '#62402a'], hair: ['#d8d4d0', '#a8a4a0', '#6a6662'], glasses: 1 };
const KID = { hood: ['#f2c430', '#c89a20', '#6a5010'], legs: JEANC, skin: ['#d0a080', '#a87656', '#62402a'], hair: HAIRC };
// the days: which number hangs over Nanay in each scene (and in the counter up top)

// ---------- pieces ----------
function sky(t, o = {}) {
  const d = o.dusk || 0, n = o.night || 0;
  grad(mixHex(mixHex('#7ab0e0', '#e0784a', d), '#0a1028', n), mixHex(mixHex('#d8eaf4', '#f6b060', d), '#1c2448', n), -400, 1300);
  if (o.sun) { const [sx, sy] = o.sun, r = o.sr || 80; glow(sx, sy, r * 6, '255,200,140', .55); circ(sx, sy, r, '#fff0d0'); L(sx, sy, r * 14, C.warm, .95, .22); }
  if (n > .5) for (let i = 0; i < 140; i++) circ(hash(i * 3.7) * W, hash(i * 5.1) * 1000 - 100, 1 + 1.5 * hash(i), `rgba(225,232,255,${.3 + .5 * hash(i + 1)})`);
}
// the number over someone's head: a soft glowing figure with ARAW under it
function badge(x, y, n, k = 1, big = 1) { if (k <= 0) return; const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  big *= 1.3; y -= 60 * big; g.save(); g.globalAlpha *= k; g.translate(x, y - 10 * (1 - k)); g.scale(big, big); glow(0, 0, 140, '255,236,190', .5); g.shadowColor = 'rgba(255,220,160,.9)'; g.shadowBlur = 24;
  text(s, 0, 0, 70, '#fff6e0', 'Anton', 'center', 0); g.shadowBlur = 0; text('ARAW', 0, 46, 24, 'rgba(255,240,210,.85)', 'Anton'); g.restore(); L(x, y, 200 * big, C.warm, .6 * k, .3 * k); }
function headOf(x, y, h) { return [x, y - h * .855, h * .14]; }
function bun(x, y, h, col = NANAY.hair[1]) { const [hx, hy, r] = headOf(x, y, h); circ(hx + r * .1, hy - r * 1.02, r * .38, col); circ(hx + r * .1, hy - r * 1.02, r * .38, 'rgba(0,0,0,.25)', r * .04); }
function nanay(x, y, h, o = {}) { person(x, y, h, { ...NANAY, ...o }); if (!o.back) bun(x, y, h); else { const [hx, hy, r] = headOf(x, y, h); circ(hx, hy - r * .7, r * .42, NANAY.hair[1]); } }
function room(t, o = {}) {                      // inside the house: a painted wall, a window, the wooden floor
  g.fillStyle = lg(0, 0, 0, 1400, [o.wall || '#d8c8a0', mixHex(o.wall || '#d8c8a0', '#4a3a28', .45)]); g.fillRect(-400, -400, 1900, 1800);
  if (o.win) { const [a, b, c, d] = o.win; g.save(); g.beginPath(); g.rect(a, b, c - a, d - b); g.clip(); (o.outside || (() => sky(t, {})))(a, b, c, d); g.restore(); g.strokeStyle = '#5a3a22'; g.lineWidth = 22; g.strokeRect(a, b, c - a, d - b); line([[(a + c) / 2, b], [(a + c) / 2, d]], 10, '#5a3a22'); }
  g.fillStyle = lg(0, o.floor || 1400, 0, 2100, ['#8a6a46', '#3a2814']); g.fillRect(-400, o.floor || 1400, 1900, 900); for (let k = -10; k <= 10; k++) line([[540 + k * 60, o.floor || 1400], [540 + k * 160, 2300]], 4, 'rgba(0,0,0,.25)');
}
function kitchen(t, o = {}) {                   // Nanay's kitchen: the window, the shelf of jars, the two-burner stove, the pot
  room(t, { wall: o.wall || '#d6c49a', win: [620, 320, 980, 760], outside: o.outside });
  g.fillStyle = '#6a4a2a'; g.fillRect(120, 560, 400, 16); for (let k = 0; k < 5; k++) { rr(140 + k * 74, 470, 52, 90, 10); g.fillStyle = ['#c8a050', '#8ab060', '#d87a4a', '#c8c0a0', '#9a6a3a'][k]; g.fill(); }
  rr(80, 1180, 920, 60, 8); fs('#8a7a6a', 4); g.fillStyle = '#6a5a4a'; g.fillRect(80, 1240, 920, 300);
  if (o.pot !== 0) { rr(300, 1100, 240, 90, 10); fs('#3a3a40', 3); ell(420, 1102, 120, 22); g.fillStyle = o.cold ? '#4a4a50' : '#9a7a4a'; g.fill(); if (!o.cold) { for (let k = 0; k < 2; k++) { const p = ((t * .5) + k * .5) % 1; curve([400 + 30 * k, 1090], [400 + 30 * Math.sin(t + k), 1000 - 80 * p], [420 + 20 * Math.sin(t * .7 + k), 900 - 160 * p], 8, `rgba(240,240,250,${.3 * (1 - p)})`); } L(420, 1200, 300, C.fire, .7, .2); } }
  if (o.bulb !== 0) { line([[540, -400], [540, 200]], 4, '#222'); ell(540, 230, 24, 32); g.fillStyle = o.cold ? '#6a6a60' : '#fff4c8'; g.fill(); if (!o.cold) L(540, 260, 1400, C.warm, .95, .25); }
}
function bench(x, y, w) { rr(x - w / 2, y - 20, w, 30, 6); fs('#7a5232', 3); for (const dx of [-w / 2 + 30, w / 2 - 40]) { g.fillStyle = '#5a3a22'; g.fillRect(x + dx, y + 10, 14, 120); } }
function houseFront(t, x, y, s, lit = 1) { const w = 7 * s, h = 3.2 * s; g.fillStyle = '#d8c8a0'; g.fillRect(x - w / 2, y - h, w, h); path([[x - w / 2 - .5 * s, y - h], [x, y - h - 2 * s], [x + w / 2 + .5 * s, y - h]]); g.closePath(); g.fillStyle = '#7a3a2a'; g.fill();
  rr(x - w * .35, y - h * .75, w * .22, h * .35, 4); g.fillStyle = lit ? '#ffd890' : '#3a4a5a'; g.fill(); if (lit) L(x - w * .24, y - h * .57, w * .6, C.warm, .8 * lit, .25); rr(x + w * .1, y - h * .7, w * .16, h * .7, 3); g.fillStyle = '#5a3a22'; g.fill(); }
function town(t, o = {}) {                      // a Manila street at golden hour: buildings, a jeepney, wires
  sky(t, { dusk: o.dusk ?? .6, sun: [800, 860], sr: 70 });
  [[-60, 420, 300, '#6a5a6a'], [240, 520, 280, '#5a6a72'], [520, 460, 300, '#72604a'], [820, 500, 320, '#5e5a6c']].forEach(([x, top, w, col], i) => { g.fillStyle = col; g.fillRect(x, top, w, 1400 - top);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const lit = hash(i * 7 + r * 3 + c) > .45; rr(x + 30 + c * (w - 90) / 2, top + 50 + r * 190, 70, 110, 4); g.fillStyle = lit ? '#ffd890' : '#2a2a34'; g.fill(); if (lit) L(x + 65 + c * (w - 90) / 2, top + 105 + r * 190, 140, C.warm, .7, .12); } });
  for (let k = 0; k < 6; k++) curve([-60, 380 + k * 14], [540, 470 + k * 20], [1140, 380 + k * 16], 2.5, '#141418');
  g.fillStyle = lg(0, 1400, 0, 2100, ['#5a5450', '#2a2622']); g.fillRect(-400, 1400, 1900, 800);
  if (o.jeep !== 0) { const jx = ((t * 60) % 1700) - 400; rr(jx, 1200, 360, 200, 20); fs('#d8d8d0', 4); rr(jx + 20, 1220, 320, 70, 8); g.fillStyle = '#3a4a5a'; g.fill(); g.fillStyle = '#c8302a'; g.fillRect(jx, 1300, 360, 16); for (const dx of [70, 290]) circ(jx + dx, 1400, 36, '#141414'); text('CUBAO', jx + 180, 1200, 30, '#2a2a6a', 'Anton'); }
}
function heart(x, y, s, col) { g.beginPath(); g.moveTo(x, y + s * .3); g.bezierCurveTo(x - s, y - s * .4, x - s * .5, y - s * 1.1, x, y - s * .5); g.bezierCurveTo(x + s * .5, y - s * 1.1, x + s, y - s * .4, x, y + s * .3); g.fillStyle = col; g.fill(); }
function notes(t, x, y, a = 1) { for (let k = 0; k < 3; k++) { const p = ((t * .35) + k / 3) % 1; g.save(); g.globalAlpha = a * Math.sin(Math.PI * p); text('♪', x + 60 * Math.sin(t + k * 2) + k * 30, y - p * 260, 60, '#fff2d0', 'serif'); g.restore(); } }
function tears(x, y, r, t, a = 1) { for (const sg of [-1, 1]) { const p = ((t * .5) + (sg > 0 ? .5 : 0)) % 1; g.save(); g.globalAlpha = a * (1 - p * .5); g.beginPath(); const tx = x + sg * r * .36, ty = y + r * .2 + p * r * .7; g.moveTo(tx, ty - r * .08); g.quadraticCurveTo(tx + r * .06, ty + r * .04, tx, ty + r * .07); g.quadraticCurveTo(tx - r * .06, ty + r * .04, tx, ty - r * .08); g.fillStyle = '#bfe6ff'; g.fill(); g.restore(); } }


// ---------- the family ----------
const TATAY = { hood: ['#c8b48a', '#a08a64', '#5a4a30'], legs: ['#5a5040', '#3a3428', '#1e1a14'], skin: ['#a8724e', '#80523a', '#4a2e1e'], hair: ['#3a3430', '#2a2420', '#141010'] };
const ATE = { hood: ['#2a9a8a', '#1e7a6a', '#0e4038'], legs: ['#3a3e4a', '#26282f', '#121318'], skin: ['#d0a080', '#a87656', '#62402a'], hair: ['#1a1012', '#120a0c', '#060404'], longHair: 1 };
const LOLA = { hood: ['#8a6a9a', '#6a4a7a', '#3a2a4a'], legs: ['#5a4a6a', '#3a2e46', '#1e1828'], skin: ['#e0b090', '#b8866a', '#704a36'], hair: ['#e8e6e2', '#b8b4ae', '#76726c'], glasses: 1 };
const KIDS = [['#f2c430', '#c89a20', '#6a5010'], ['#d84a3a', '#a8302a', '#5a1a14'], ['#3ab86a', '#2a8a4a', '#144a26'], ['#9a6ad8', '#7a4ab0', '#3a2260']];
// the family at the table: Tatay, Nanay, Ate behind it, the table across the bottom
function familyAtTable(t, o = {}) {
  person(240, 1760, 900, { t, ...TATAY, eyes: 'open', mouth: o.mouth0 ?? .2 + .25 * Math.abs(Math.sin(t * 8)), smile: 1, look: .4, lx: 1, rim: 'rgba(255,220,170,.5)' });
  nanay(540, 1740, 880, { t, arms: o.nArms || 'offer', eyes: 'open', smile: 1, look: o.nLook ?? .3, lx: 1, rim: 'rgba(255,220,170,.5)' });
  person(840, 1760, 880, { t, ...ATE, eyes: o.ateEyes || 'shut', mouth: o.ateMouth ?? .5 + .2 * Math.abs(Math.sin(t * 11)), smile: 1, look: -.3, lx: -1, rim: 'rgba(255,220,170,.5)' });
}
function dinnerTable(y = 1380, o = {}) {
  rr(-60, y, 1200, 80, 10); fs('#7a5232'); g.fillStyle = '#5a3a22'; g.fillRect(-60, y + 80, 1200, 700);
  for (const [x, s] of [[200, 1], [540, 1.1], [880, 1]]) { ell(x, y + 12, 120 * s, 28 * s); fs('#f4f4f0', 3); ell(x, y + 4, 70 * s, 16 * s); fs(o.cold ? '#d8d0c0' : '#fff8e8'); }
  if (o.food !== 0) { ell(540, y - 30, 110, 60); fs('#f6f0e4', 3); for (let i = 0; i < 30; i++) circ(470 + 140 * hash(i), y - 60 + 50 * hash(i + 3), 4, '#fff'); ell(320, y - 10, 80, 26); fs('#8a3a22', 3); ell(760, y - 10, 80, 26); fs('#4a7a3a', 3); if (!o.cold) for (const x of [320, 760]) { const p = (t_ * .5) % 1; curve([x, y - 20], [x + 20 * Math.sin(t_ + x), y - 90 * p - 40], [x, y - 180 * p - 40], 6, `rgba(240,240,250,${.25 * (1 - p)})`); } }
}
let t_ = 0;
function phoneOnTable(x, y, s, lit = 0, buzz = 0) { const bz = buzz * Math.sin(t_ * 80) * 5; rr(x - 60 * s + bz, y - 110 * s, 120 * s, 220 * s, 16 * s); fs('#0c0c10', 4); rr(x - 50 * s + bz, y - 98 * s, 100 * s, 196 * s, 10 * s); g.fillStyle = lit ? '#bfe8ff' : '#1a1e2a'; g.fill(); if (lit) L(x, y, 420 * s, C.cyan, .9 * lit, .4 * lit); }
function bell(x, y, s, col = YEL) { g.beginPath(); g.moveTo(x - s, y + s * .6); g.quadraticCurveTo(x - s * .9, y - s * .9, x, y - s); g.quadraticCurveTo(x + s * .9, y - s * .9, x + s, y + s * .6); g.closePath(); g.fillStyle = col; g.fill(); circ(x, y + s * .8, s * .22, col); }
// the notification: a glass card with a bell, sliding down from the top, ringing as it lands
function notif(t, t0, t1, msg, label = 'NGAYON', y0 = 470) {
  const k = ss(seg(t, t0, t0 + .35)) * (1 - ss(seg(t, t1 + .1, t1 + .45))); if (k <= 0) return; reset(); g.save(); g.translate(CX, y0 - 80 * (1 - k)); g.globalAlpha = k;
  const w = 900, h = 250; glass(-w / 2, -h / 2, w, h, 34, 'rgba(255,201,77,.75)', 4, 'rgba(255,201,77,.6)');
  const sh = 1 + .12 * Math.sin(t * 30) * Math.exp(-(t - t0) * 3); g.save(); g.translate(-w / 2 + 80, -10); g.rotate(.25 * Math.sin(t * 25) * Math.exp(-(t - t0) * 3)); g.scale(sh, sh); bell(0, 0, 34); g.restore();
  text(label, -w / 2 + 150, -h / 2 + 52, 30, '#ffd98a', 'Anton', 'left'); g.font = '600 46px sans-serif'; g.fillStyle = '#f4f1ea'; g.textAlign = 'left'; g.textBaseline = 'middle';
  const words = msg.split(' '), lines = []; let cur = ''; for (const wd of words) { const tr = cur ? cur + ' ' + wd : wd; if (g.measureText(tr).width > w - 220) { lines.push(cur); cur = wd; } else cur = tr; } lines.push(cur);
  lines.slice(0, 3).forEach((l, i) => g.fillText(l, -w / 2 + 150, -h / 2 + 108 + i * 54)); g.restore();
}

// ---------- shots ----------
const S = {}, dim = { warm: '#a8886a', room: '#9a8070', night: '#1a2040', dusk: '#a8786a', cold: '#6a7484' };
const NOTE = { hook: ['h1', 'Ito na ang huling hapunan na buo kayo.'], jeep: ['n1', 'Huling beses kang binuhat ni Tatay.', 'MAY 2009'], kalye: ['n2', 'Huling beses kayong naglaro ng barkada sa kalye.', 'HUNYO 2011'], lola: ['n3', 'Huling beses kang tinawag ni Lola sa palayaw mo.', 'DISYEMBRE 2014'],
  payong: ['n4', 'Huling beses kang sinundo ni Nanay sa eskwela.', 'AGOSTO 2008'], barkada: ['n5', 'Huling litrato na kumpleto ang barkada.', 'MARSO 2017'] };
const W_VIB = wx('h1', 'nag-vibrate');
const nightOut = (a, b, c, d) => sky(t_, { night: 1 });
// the hook: dinner, the family laughing; your phone by the plate buzzes and lights up
S.hook = (t, u) => { t_ = t; const z = ss(seg(u, 0, 5)); cam(CX, lerp(900, 980, z), lerp(1, 1.08, z), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut }); familyAtTable(t); dinnerTable(1380);
  const lit = ss(seg(t, W_VIB - .05, W_VIB + .2)); phoneOnTable(860, 1660, 1.2, lit, t > W_VIB - .05 && t < W_VIB + 1.6 ? 1 : 0); lightPass(dim.warm); };
// the table, one by one: Tatay talking, Nanay serving, Ate laughing; then you, the only one who knows
S.table = (t, u) => { t_ = t; const f = id => ss(seg(t, wx('h2', id) - .2, wx('h2', id) + .3)), you = ss(seg(t, wx('h2', 'walang') - .2, wx('h2', 'walang') + .5));
  if (you < .5) { const fx = 540 + (f('tatay') * (1 - f('nanay'))) * (240 - 540) + (f('ate')) * (840 - 540); cam(fx, 1000, 1.25, 0, 0, t); kitchen(t, { pot: 0, outside: nightOut }); familyAtTable(t); dinnerTable(1380); lightPass(dim.warm); return; }
  cam(CX, 900, lerp(1.1, 1.0, you), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut }); person(540, 2250, 1450, { t, ...YOU, eyes: 'open', tired: .4, look: -.2, lookY: .3, lx: 1, rim: 'rgba(255,220,170,.5)' }); dinnerTable(1650, { food: 0 }); phoneOnTable(820, 1800, 1.3, .8); lightPass(dim.warm); };
// then they come, one after another
const FLOOD = ['Huling beses kang binuhat ni Tatay.', 'Huling laro sa kalye.', 'Huling tawag ni Lola sa palayaw mo.', 'Huling sundo ni Nanay.', 'Huling litratong kumpleto ang barkada.', 'Huling "Ingat ka, anak."', 'Huling Simbang Gabi na sabay-sabay.', 'Huling sakay sa balikat ni Tatay.'];
S.flood = (t, u) => { t_ = t; cam(CX, 900, 1 + .03 * seg(u, 0, 6), 0, 0, t); grad('#141828', '#06070c', 0, 1920);
  person(540, 2350, 1500, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(150,200,255,.5)' }); L(540, 900, 1300, C.cyan, .6, .1); lightPass('#30343e');
  FLOOD.forEach((m, i) => { const t0 = T('n0') + .2 + i * .45, p = t - t0; if (p < 0) return; const y = 300 + i * 150, x = 540 + (i % 2 ? 50 : -50), k = ss(seg(p, 0, .3)); reset(); g.save(); g.globalAlpha = k * (1 - .5 * seg(p, 2, 4)); g.translate(x, y - 40 * (1 - k));
    glass(-400, -55, 800, 110, 26, 'rgba(255,201,77,.6)', 3); bell(-350, 0, 22); g.font = '600 36px sans-serif'; g.fillStyle = '#f4f1ea'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(m, -310, 2); g.restore(); }); };
// a jeepney at night: Tatay holding you asleep on his lap, nine years old; the street lights sliding past
S.jeep = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 1.2, t); g.fillStyle = '#2a3038'; g.fillRect(-400, -400, 1900, 2600);
  for (let k = 0; k < 4; k++) { rr(80 + k * 240, 560, 200, 300, 14); g.fillStyle = '#0a1018'; g.fill(); for (let j = 0; j < 2; j++) { const lx = 80 + k * 240 + ((t * 300 + j * 110 + k * 50) % 200); circ(lx, 640 + j * 80, 10, '#ffd890'); L(lx, 640 + j * 80, 120, C.amb, .8, .3); } }
  g.fillStyle = '#c8302a'; g.fillRect(-400, 880, 1900, 24); text('BACLARAN • LIBERTAD', 540, 470, 40, '#ffc94d', 'Anton', 'center', 8); rr(-100, 1500, 1300, 80, 10); fs('#7a2a2a');
  person(560, 2000, 1150, { t, ...TATAY, eyes: 'open', lid: .4, smile: 1, lookY: .7, look: -.2, arms: 'lap', lx: 1, rim: 'rgba(255,210,150,.6)' });
  g.save(); g.translate(470, 1480); g.rotate(-1.2); person(0, 300, 560, { t, ...KID, ground: 0, eyes: 'shut', arms: 'down', lx: 1 }); g.restore(); L(540, 700, 900, C.amb, .55, .1); lightPass('#4a4a5a'); };
// the street at dusk: the barkada playing, a mother calling from a window
S.kalye = (t, u) => { t_ = t; const call = ss(seg(t, wx('n2', 'tinawag') - .2, wx('n2', 'tinawag') + .3)); cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t); town(t, { dusk: .9, jeep: 0 });
  if (call > 0) { reset(); } KIDS.forEach((hood, i) => person(160 + i * 250 + 30 * Math.sin(t * 2 + i), 1840, 620, { t, walk: t * 7 + i, hood, legs: JEANC, skin: YOU.skin, hair: HAIRC, arms: i % 2 ? 'up' : 'down', eyes: 'open', mouth: .4, smile: 1, lx: 1 }));
  lightPass(dim.dusk); if (call > 0) { reset(); g.globalAlpha = call; text('"KAKAIN NA!"', 300, 820, 60, '#fff', 'Anton', 'center', 10); reset(); } };
// Lola on the porch calling your nickname; you walking away, earphones in
S.lola = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.05, seg(u, 0, 7)), 0, 0, t); room(t, { wall: '#c8b48a', win: [100, 420, 480, 900], outside: (a, b, c, d) => sky(t, { dusk: .4 }), floor: 1450 });
  person(300, 1900, 960, { t, ...LOLA, longHair: 0, sit: .7, arms: 'out', eyes: 'open', mouth: t < wx('n3', 'hindi') ? .3 + .2 * Math.abs(Math.sin(t * 7)) : 0, tired: t > wx('n3', 'hindi') ? .5 : 0, look: .7, lx: 1 }); bun(300, 1900 + 960 * .16 * .7, 960, LOLA.hair[1]);
  person(lerp(760, 880, seg(u, 0, 8)), 2000, 1100, { t, ...YOU, back: 1, walk: t * 4, lx: -1 }); line([[790, 1150], [800, 1400]], 3, '#eee');
  lightPass(dim.room); reset(); text('"TOTOY!"', 300, 760, 64, '#ffc94d', 'Anton', 'center', 10); reset(); };
// the school gate in the rain: Nanay with the umbrella; you, small and embarrassed; the classmates laughing
S.payong = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t); sky(t, { night: .3 }); g.fillStyle = '#8a8a7a'; g.fillRect(-400, 700, 1900, 600); g.fillStyle = '#3a3a3a'; g.fillRect(-400, 1300, 1900, 900);
  rr(100, 520, 880, 120, 10); fs('#2a5a3a', 4); text('PAARALANG ELEMENTARYA', 540, 580, 44, '#fff', 'Anton'); for (const x of [140, 940]) { g.fillStyle = '#6a6a5a'; g.fillRect(x - 30, 640, 60, 700); }
  nanay(330, 1900, 980, { t, arms: 'up', eyes: 'open', smile: 1, look: .5, lx: 1 }); g.save(); g.translate(330, 820); path([[-260, 120], [0, -50], [260, 120]]); g.closePath(); g.fillStyle = '#c8302a'; g.fill(); for (let k = -3; k <= 3; k++) line([[0, -50], [k * 86, 120]], 2, 'rgba(0,0,0,.25)'); line([[0, -50], [0, 300]], 6, '#222'); g.restore();
  person(690, 1900, 640, { t, ...KID, eyes: 'open', lookY: .8, tired: .3, mouth: 0, lx: -1 }); KIDS.slice(1, 3).forEach((hood, i) => person(880 + i * 130, 1880, 600, { t, hood, legs: JEANC, skin: YOU.skin, hair: HAIRC, eyes: 'shut', mouth: .5, smile: 1, lx: -1 }));
  lightPass('#7a7a80'); reset(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 180; i++) { const y = ((hash(i) * 2000 + t * 1600) % 2100) - 100, x = hash(i * 3.3) * 1100; line([[x, y], [x - 8, y + 50]], 2, 'rgba(200,220,255,.35)'); } reset(); };
// the last photo with the whole barkada; half of them fade, a little plane over each
S.barkada = (t, u) => { t_ = t; const half = ss(seg(t, wx('n5', 'kalahati') - .2, wx('n5', 'kalahati') + .8)); cam(CX, 900, lerp(1, 1.05, seg(u, 0, 7)), -.02, 0, t); grad('#3a2a22', '#1a120c', -400, 2300);
  rr(140, 700, 800, 860, 10); fs('#f6efe0', 4); rr(180, 740, 720, 640, 4); g.fillStyle = lg(0, 740, 0, 1380, ['#f0b878', '#a8604a']); g.fill();
  g.save(); g.beginPath(); g.rect(180, 740, 720, 640); g.clip(); [[260, 1], [380, 0], [500, 1], [620, 0], [740, 1], [840, 0]].forEach(([x, gone], i) => { g.save(); if (gone) g.globalAlpha = 1 - .65 * half; person(x, 1720, 800, { t, hood: KIDS[i % 4], legs: JEANC, skin: YOU.skin, hair: HAIRC, longHair: i % 2, eyes: 'open', smile: 1, mouth: .3, arms: i === 2 ? 'up' : 'down', lx: 1 }); g.restore();
    if (gone && half > .5) { g.save(); g.globalAlpha = half; g.translate(x, 860); path([[-30, 0], [30, 0], [0, -14]]); g.closePath(); g.fillStyle = '#fff'; g.fill(); line([[-14, -4], [-24, -24]], 4, '#fff'); line([[14, -4], [24, -24]], 4, '#fff'); g.restore(); } }); g.restore();
  g.save(); g.font = '600 50px Caveat'; g.fillStyle = '#3a2a2a'; g.textAlign = 'center'; g.fillText('barkada 4ever, 2017', 540, 1460); g.restore(); L(540, 1000, 1000, C.warm, .8, .1); lightPass(dim.room); };
// ordinary: a hug, a dinner, a text: "sige, bukas na lang"
S.ordinary = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.04, seg(u, 0, 10)), 0, 0, t); grad('#1e2232', '#0a0c14', -400, 2300);
  [[200, 'yakap'], [540, 'hapunan'], [880, 'bukas']].forEach(([x, w], i) => { const k = t >= T('r2') ? ss(seg(t, wx('r2', w) - .2, wx('r2', w) + .2)) : .3; g.save(); g.globalAlpha = .35 + .65 * k;
    rr(x - 150, 640, 300, 740, 20); g.fillStyle = ['#7a4a3a', '#8a6a46', '#2a3a5a'][i]; g.fill(); g.strokeStyle = 'rgba(255,201,77,.7)'; g.lineWidth = 4; g.stroke(); g.save(); g.beginPath(); g.rect(x - 150, 640, 300, 740); g.clip();
    if (i === 0) { nanay(x - 30, 1400, 560, { t, arms: 'out', eyes: 'shut', smile: 1, lx: 1 }); person(x + 40, 1420, 600, { t, ...YOU, back: 1, arms: 'out', lx: 1 }); }
    if (i === 1) { person(x, 1380, 560, { t, ...TATAY, eyes: 'open', smile: 1, mouth: .3, lx: 1 }); g.fillStyle = '#7a5232'; g.fillRect(x - 150, 1200, 300, 200); }
    if (i === 2) { rr(x - 110, 900, 220, 300, 24); fs('#0c0c10', 4); rr(x - 96, 930, 192, 120, 16); g.fillStyle = '#2c6a8a'; g.fill(); g.font = '500 26px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('Sige, bukas', x, 975); g.fillText('na lang', x, 1010); L(x, 1000, 300, C.cyan, .8, .2); }
    g.restore(); g.restore(); }); L(540, 1000, 1100, C.warm, .7, .05); lightPass('#5a5a68'); };
// the share, before the ending: the house at night, one window lit, you outside
S.cta = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)), 0, 0, t); sky(t, { night: 1 }); g.fillStyle = '#141a14'; g.fillRect(-400, 1300, 1900, 900); houseFront(t, 540, 1500, 120, 1);
  person(540, 2350, 1300, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(255,220,170,.4)' }); lightPass(dim.night); };
// the twist: by the door, Ate's suitcase and the balikbayan box; the ticket: MNL → DXB
S.suitcase = (t, u) => { t_ = t; const tk = ss(seg(t, wx('e1', 'dubai') - .4, wx('e1', 'dubai') + .3)); cam(CX, lerp(900, 980, ss(seg(u, 0, 7))), lerp(1, 1.1, ss(seg(u, 0, 7))), 0, 0, t); room(t, { wall: '#b8a07a' });
  rr(620, 420, 340, 980, 6); fs('#5a3a22', 4); circ(900, 920, 14, '#c8a050');
  rr(200, 1000, 320, 460, 26); fs('#2a4a6a', 4); line([[260, 1000], [260, 1460]], 4, '#c8a050'); line([[460, 1000], [460, 1460]], 4, '#c8a050'); rr(310, 950, 100, 60, 14); fs('#141414'); circ(240, 1470, 20, '#141414'); circ(480, 1470, 20, '#141414');
  rr(560, 1200, 320, 280, 4); fs('#c8985a', 3); g.fillStyle = '#e8d090'; g.fillRect(560, 1300, 320, 30); text('BALIKBAYAN', 720, 1410, 34, '#4a2a12', 'Anton');
  if (tk > 0) { g.save(); g.globalAlpha = tk; g.translate(360, 860 - 30 * (1 - tk)); g.rotate(-.08); rr(-200, -70, 400, 140, 10); fs('#f4ecd8', 3, '#c8a050'); text('MNL  →  DXB', 0, -18, 52, '#7a1e2e', 'Anton'); text('BUKAS, 6:40 AM', 0, 38, 30, '#4a3a2a', 'Anton'); g.restore(); }
  L(540, 400, 1300, C.warm, .8, .15); lightPass(dim.room); };
// Nanay notices: "why are you crying?"; "nothing, 'Nay. more rice, please"
S.cry = (t, u) => { t_ = t; const kanin = t > wx('e2', 'pahingi') - .1; cam(CX, lerp(900, 1000, ss(seg(u, 0, 6))), lerp(1, 1.12, ss(seg(u, 0, 6))), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut });
  nanay(280, 1780, 960, { t, eyes: 'open', tired: .3, mouth: t < wx('e2', 'wala') ? .25 + .2 * Math.abs(Math.sin(t * 8)) : 0, smile: t > wx('e2', 'wala') ? 1 : 0, look: .6, lx: 1 });
  person(790, 1820, 1000, { t, ...YOU, eyes: kanin ? 'shut' : 'open', smile: kanin ? 1 : 0, mouth: 0, tired: .5, look: -.5, arms: kanin ? 'offer' : 'down', lx: -1 }); const [hx, hy, r] = headOf(790, 1820, 1000); tears(hx, hy, r, t, 1);
  dinnerTable(1380); lightPass(dim.warm); };
// midnight: the clock at twelve, the food gone cold, nobody's left the table
S.midnight = (t, u) => { t_ = t; cam(CX, 900, lerp(1.05, 1.0, ss(seg(u, 0, 8))), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut, bulb: 1 });
  circ(240, 380, 90, '#f4f4f0'); circ(240, 380, 90, '#3a2a1a', 8); line([[240, 380], [240, 310]], 8, '#222'); line([[240, 380], [244, 320]], 5, '#222');
  [[150, TATAY, .5], [400, null, .3], [660, ATE, .5], [910, YOU, .45]].forEach(([x, who, m], i) => { if (!who) nanay(x, 1740, 820, { t: t + i, eyes: 'open', smile: 1, mouth: m * Math.abs(Math.sin(t * 9 + i)), look: .5, lx: 1 }); else person(x, 1760, 820, { t: t + i, ...who, eyes: i % 2 ? 'shut' : 'open', smile: 1, mouth: m * Math.abs(Math.sin(t * 10 + i)), look: i < 2 ? .5 : -.5, lx: i < 2 ? 1 : -1 }); });
  dinnerTable(1380, { cold: 1 }); lightPass(dim.warm); };
// put the phone down: your hand turning it face down on the table; the family soft behind
S.phone = (t, u) => { t_ = t; const p = ss(seg(t, wx('end', 'ibaba') - .1, wx('end', 'ibaba') + .6)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut });
  familyAtTable(t); reset(); g.filter = 'blur(7px)'; g.drawImage(cv, 0, 0); reset(); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t); dinnerTable(1300, { food: 0 });   // blur the room once, as a picture
  g.save(); g.translate(540, 1680); g.scale(1, lerp(1, .3, p)); phoneOnTable(0, 0, 1.6, 1 - p); g.restore(); hand(540 + 140, 1700, 90, Math.PI + .3, { sg: -1, skin: YOU.skin }); lightPass(dim.warm); };
S.endcard = (t, u) => { grad('#000', '#050508', 0, 1920); };

// ---------- overlays ----------
function bigCard(t, t0, top, bottom, col = YEL, glowc = 'rgba(255,170,80,1)') {
  const k = back(seg(t, t0, t0 + .3), 1.7); if (k <= 0) return; reset(); g.save(); g.translate(CX, 600); g.scale(k, k);
  glass(-440, -150, 880, 300, 44, 'rgba(255,255,255,.65)', 4, 'rgba(255,255,255,.45)');
  g.font = '86px Anton'; const s1 = Math.min(1, 800 / g.measureText(top).width); g.save(); g.translate(0, -44); g.scale(s1, s1); text(top, 0, 0, 86, '#fff', 'Anton'); g.restore();
  g.font = '70px Anton'; const s2 = Math.min(1, 800 / g.measureText(bottom).width); g.save(); g.translate(0, 62); g.scale(s2, s2); g.shadowColor = glowc; g.shadowBlur = 24; text(bottom, 0, 0, 70, col, 'Anton'); g.restore(); g.restore();
}
const W_COMMENT = wx('cta', 'icomment'), W_SHARE = wx('cta', 'ishare');
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .24; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  ZK = 1; S[sh[2]](t, u);
  bloom(); vignette(.55);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'hook') { title(t, 1 - ss(seg(t, W_VIB - .3, W_VIB))); notif(t, W_VIB, E('h1') + .6, NOTE.hook[1]); }
  const n = NOTE[sh[2]]; if (n && sh[2] !== 'hook') notif(t, T(n[0]) - .05, E(n[0]), n[1], n[2]);
  if (sh[2] === 'cta') { if (t < W_SHARE - .1) bigCard(t, W_COMMENT - .1, TX.share[0], TX.share[1]); else bigCard(t, W_SHARE - .1, TX.share2[0], TX.share2[1]); }
  if (sh[2] === 'endcard') { const k = ss(seg(u, .2, .9)); reset(); g.globalAlpha = k; text('BAKA', 540, 900, 90, '#ffd98a', 'Anton', 'center', 10); g.shadowColor = 'rgba(255,200,140,.9)'; g.shadowBlur = 30; text("ITO NA 'YON.", 540, 1040, 130, '#fff', 'Anton', 'center', 12); reset(); }
  else captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

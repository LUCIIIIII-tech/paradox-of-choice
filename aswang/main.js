// Aswang sa Probinsya (3 a.m. in the province, a brownout, and Lola's 5 rules against the aswang): a dark, painterly Pinoy kababalaghan reel, 1080x1920.
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
// Look and engine from ../tsunami (and ../puyat, ../huling-tren): every scene is drawn in its true colours, then darkened, and only the lights
// (warm shop windows, ceiling lamps, phone screens, the red emergency strobes, the green EXIT sign) bring the colour back. Smooth camera, no glitches.
const W = 1080, H = 1920, CX = W / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'); let g = cv.getContext('2d');
const LANG = new URLSearchParams(location.search).get('lang') || 'tl';     // tl (default) | en
const SUF = LANG === 'tl' ? '' : '.' + LANG;
const TL = await (await fetch(`timeline${SUF}.json`)).json();
const ANCH = SUF ? await (await fetch(`anchors${SUF}.json`)).json() : {};
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
const TX = {
  tl: { t1: 'ASWANG SA PROBINSYA', t2: '5 RULES NI LOLA', rule: 'RULE #', rules: ['MAKINIG SA TIK-TIK', 'HUWAG KANG SASAGOT', 'TINGNAN ANG MATA', 'BAWANG, ASIN, BUNTOT PAGI', 'ASIN SA KALAHATI'],
        share: ['I-SHARE MO', 'SA PINSAN MONG MATATAKUTIN'], five: '5 RULES NI LOLA', cal: '2026' },
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
const REDCAP = ['hook', 'roof', 'call', 'eye', 'floor', 'grove', 'loop', 'end', 'nanay'];
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
const W_STOP = wordT('h1', 'tumigil'), W_ASW = wordT('h1', 'aswang'), W_BROWN = wordT('s1', 'Brownout'), W_FIVE = wordT('s3', '5'), W_KAPIT = wordT('s4', 'kapitbahay'),
  W_MAHINA = wordT('r1', 'mahina'), W_TURN = wordT('r2b', 'katabi'), W_ASW3 = wordT('r3b', 'aswang'), W_NAKA = wordT('mid', 'nakatingin'), W_SHARE = wordT('cta', 'i-share'),
  W_ASIN = wordT('r4', 'asin'), W_PAGI = wordT('r4', 'pagi'), W_MANAN = wordT('r5', 'manananggal'), W_HANAP = wordT('r5', 'Hanapin'), W_TILA = wordT('dawn', 'tumilaok'),
  W_TAHIMIK = wordT('end', 'tumahimik');
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
const flick = t => .86 + .09 * Math.sin(t * 13) + .05 * Math.sin(t * 31 + 1);       // a kerosene flame breathing
const HB = { hood: ['#ff9a4a', '#e0672a', '#7a3212'], legs: ['#4a5878', '#2c3652', '#161c30'], skin: ['#c48a64', '#9a6444', '#5a3624'], hair: HAIRC };     // you: the orange hoodie
const LOLA = { hood: ['#a8607a', '#7e3e56', '#46202e'], legs: ['#4a4038', '#2e2822', '#16120e'], skin: ['#d8a888', '#b0805e', '#6a4630'], hair: ['#e8e6e2', '#b8b4ae', '#76726c'], glasses: 1 };
const NANAY = { skin: ['#d0a080', '#a87656', '#62402a'], hair: ['#2a1d14', '#1d1410', '#0b0807'] };
const PALE = ['#e6ddd4', '#c4b6aa', '#857468'];

// ---------- textures for the province: woven bamboo (sawali), nipa thatch, a banig mat ----------
TEX.sawali = paint(mk(240, 240), (w, h) => {
  g.fillStyle = '#8a6a3e'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const x = c * 30, y = r * 30, hz = (r + c) % 2;
    g.fillStyle = hz ? 'rgba(255,220,160,.12)' : 'rgba(40,22,8,.22)'; g.fillRect(x + 1, y + 1, 28, 28);
    for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(30,16,6,.25)'; if (hz) g.fillRect(x, y + 3 + k * 7, 30, 1.5); else g.fillRect(x + 3 + k * 7, y, 1.5, 30); } }
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,230,190' : '0,0,0'},.06)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2, 2); }
});
TEX.nipa = paint(mk(300, 300), (w, h) => {
  g.fillStyle = '#6a5634'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 10; r++) { const y = r * 30; g.fillStyle = 'rgba(20,12,4,.35)'; g.fillRect(0, y, w, 4);
    for (let i = 0; i < 70; i++) { const x = hash(r * 97 + i) * w; line([[x, y + 3], [x + (hash(i + r) - .5) * 6, y + 30]], 1.5 + 1.5 * hash(i * 3 + r), `rgba(${hash(i * 7 + r) > .5 ? '210,180,120' : '40,26,10'},.4)`); } }
});
TEX.banig = paint(mk(200, 200), (w, h) => {
  g.fillStyle = '#c8a46a'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) { g.fillStyle = (r + c) % 2 ? 'rgba(160,40,60,.35)' : 'rgba(255,240,200,.15)'; g.fillRect(c * 20 + 1, r * 20 + 1, 18, 18); }
  for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(40,90,120,.3)'; g.fillRect(0, k * 20 + 9, w, 2); }
});
const pat = c => g.createPattern(c, 'repeat');

// ---------- the night outside ----------
function sky(t, o = {}) {
  const d = o.dawn || 0;
  grad(mixHex('#050817', '#3c5c8c', d), mixHex('#1c2648', '#f2a66a', d), -600, 1600);
  if (d < 1) for (let i = 0; i < 170; i++) { const x = hash(i * 3.7) * W, y = hash(i * 5.1) * 1200 - 150; circ(x, y, .7 + 1.5 * hash(i), `rgba(225,232,255,${(1 - d) * (.25 + .55 * hash(i + 1) * (.6 + .4 * Math.sin(t * 1.4 + i)))})`); }
  if (o.moon !== 0) { const [mx, my] = o.moonAt || [820, 560], r = o.mr || 74; fullMoon(mx, my, r); L(mx, my, 760, C.moon, .55 * (1 - d * .7), .22 * (1 - d)); }
  if (d > 0) { g.fillStyle = rg(540, 1350, 0, 1000, [`rgba(255,190,120,${.55 * d})`, 'rgba(255,190,120,0)']); g.fillRect(-600, -200, 2300, 2400); L(540, 1300, 1300, C.amb, .75 * d, .3 * d); }
}
function palm(x, y, h, t, k = 0, col = '#03050b') {          // a coconut palm in silhouette
  const sw = Math.sin(t * .6 + k) * h * .012, tx = x + h * .13 + sw, ty = y - h;
  g.beginPath(); g.moveTo(x - h * .028, y); g.quadraticCurveTo(x + h * .015, y - h * .55, tx - h * .013, ty); g.lineTo(tx + h * .013, ty); g.quadraticCurveTo(x + h * .06, y - h * .55, x + h * .028, y); g.closePath(); g.fillStyle = col; g.fill();
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .4 + Math.sin(t * .9 + i + k) * .05, Lf = h * (.3 + .08 * hash(i + k)), ex = tx + Math.cos(a) * Lf, ey = ty + Math.sin(a) * Lf * .5 + Lf * .45 * Math.abs(Math.cos(a)), cx = tx + Math.cos(a) * Lf * .55, cy = ty + Math.sin(a) * Lf * .55 - Lf * .12;
    curve([tx, ty], [cx, cy], [ex, ey], h * .008, col);
    for (let j = 1; j < 13; j++) { const u = j / 13, px = (1 - u) * (1 - u) * tx + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * ty + 2 * (1 - u) * u * cy + u * u * ey; for (const sg of [-1, 1]) line([[px, py], [px + sg * h * .018 * (1 - u * .4), py + h * .055 * (1 - u * .5)]], h * .005, col); } }
  for (let i = 0; i < 3; i++) circ(tx + (i - 1) * h * .015, ty + h * .02, h * .014, col);
}
function banana(x, y, h, t, k = 0, col = '#040806') {        // a banana plant: a thick stem, big torn leaves
  g.beginPath(); g.moveTo(x - h * .05, y); g.lineTo(x - h * .03, y - h * .55); g.lineTo(x + h * .03, y - h * .55); g.lineTo(x + h * .05, y); g.closePath(); g.fillStyle = col; g.fill();
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .5 + Math.sin(t * .8 + i + k) * .05, len = h * (.42 + .1 * hash(i * 2 + k)), by = y - h * .55;
    g.save(); g.translate(x, by); g.rotate(a + .25 * Math.sign(Math.cos(a)) * Math.abs(Math.cos(a))); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .17, len, 0); g.quadraticCurveTo(len * .5, len * .13, 0, 0); g.fillStyle = col; g.fill();
    g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 3; for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(len * j / 6, -len * .13 * Math.sin(Math.PI * j / 6)); g.lineTo(len * j / 6 + 5, 0); g.stroke(); } g.restore(); }
}
function ground(t, y0 = 1560, o = {}) {
  g.fillStyle = lg(0, y0, 0, 2200, o.day ? ['#5a4630', '#3a2a1a'] : ['#3a3a44', '#16161c']); g.fillRect(-400, y0, 1900, 900); if (!o.day) L(540, y0 + 120, 900, C.moon, .5, .08);
  for (let i = 0; i < 90; i++) { const x = hash(i * 4.3) * 1400 - 160, y = y0 + 10 + hash(i * 6.1) * 480, s = 8 + 14 * hash(i); for (let k = 0; k < 4; k++) line([[x + k * 4, y], [x + k * 4 + (k - 1.5) * 4, y - s]], 2.5, o.day ? '#4a5a2a' : '#10160e'); }
}
function fence(y, t, x0 = -100, x1 = 1180, col = '#0a0806') {   // a bamboo fence
  for (let x = x0; x < x1; x += 46) { g.fillStyle = col; g.fillRect(x, y - 150 - 12 * hash(x), 16, 160 + 12 * hash(x)); }
  for (const yy of [y - 120, y - 60]) { g.fillStyle = col; g.fillRect(x0, yy, x1 - x0, 12); }
}
// the house on stilts: woven bamboo walls, a window with a prop-up shutter, a ladder, a thick nipa roof. (x, y) = the ground under its middle; s = px per metre
function kubo(x, y, s, t, o = {}) {
  const w = 4.4 * s, fh = 1.3 * s, wh = 2.1 * s, x0 = x - w / 2, fy = y - fh, wy = fy - wh, lit = o.lit ?? 1;
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x0 + 6, fy, w - 12, fh);
  for (const u of [.04, .36, .64, .96]) { g.fillStyle = '#2e2214'; g.fillRect(x0 + u * w - .07 * s, fy - 4, .14 * s, fh + 4); }
  if (o.under) o.under(x0, fy, w, fh);
  g.fillStyle = '#3e2c1a'; g.fillRect(x0 - .1 * s, fy - .14 * s, w + .2 * s, .18 * s);
  g.save(); g.translate(x0, wy); g.fillStyle = pat(TEX.sawali); g.fillRect(0, 0, w, wh); g.restore();
  for (const u of [0, 1]) { g.fillStyle = '#2e2010'; g.fillRect(x0 + u * w - .08 * s, wy - .1 * s, .16 * s, wh + .1 * s); }
  const wx0 = x0 + .55 * s, wx1 = wx0 + 1.3 * s, wy0 = wy + .5 * s, wy1 = wy0 + .9 * s;
  g.fillStyle = lit > 0 ? mixHex('#120a06', '#ffb060', lit * flick(t)) : '#0a0806'; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  if (lit > 0) L((wx0 + wx1) / 2, (wy0 + wy1) / 2, 2.4 * s, C.amb, .9 * lit, .35 * lit);
  path([[wx0 - .1 * s, wy0], [wx1 + .1 * s, wy0], [wx1 + .25 * s, wy0 - .55 * s], [wx0 + .05 * s, wy0 - .55 * s]]); g.closePath(); g.fillStyle = '#4a3420'; g.fill();
  line([[wx1, wy1], [wx1 + .25 * s, wy0 - .5 * s]], .05 * s, '#1e1408'); g.strokeStyle = '#1e1408'; g.lineWidth = .08 * s; g.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  const dx0 = x0 + w - 1.35 * s, dx1 = dx0 + .8 * s; g.fillStyle = '#1e140a'; g.fillRect(dx0, wy + .35 * s, dx1 - dx0, wh - .35 * s);
  line([[dx0, fy], [dx0 + .45 * s, y]], .08 * s, '#2e2010'); line([[dx1, fy], [dx1 + .45 * s, y]], .08 * s, '#2e2010');
  for (let k = 1; k < 4; k++) { const u = k / 4; line([[lerp(dx0, dx0 + .45 * s, u), lerp(fy, y, u)], [lerp(dx1, dx1 + .45 * s, u), lerp(fy, y, u)]], .06 * s, '#2e2010'); }
  const ry = wy - .05 * s, rh = 2.2 * s, ov = .7 * s;
  const R = () => { g.beginPath(); g.moveTo(x0 - ov, ry + .35 * s); g.lineTo(x - .3 * s, ry - rh); g.lineTo(x + .3 * s, ry - rh); g.lineTo(x0 + w + ov, ry + .35 * s); g.closePath(); };
  R(); g.save(); g.clip(); g.translate(x0, ry - rh); g.fillStyle = pat(TEX.nipa); g.fillRect(-ov - 10, 0, w + 2 * ov + 20, rh + .4 * s); g.restore();
  R(); g.fillStyle = lg(0, ry - rh, 0, ry + .35 * s, ['rgba(0,0,0,0)', 'rgba(0,0,0,.35)']); g.fill();
  line([[x0 - ov, ry + .35 * s], [x0 + w + ov, ry + .35 * s]], .1 * s, '#1e1408'); line([[x - .3 * s, ry - rh], [x + .3 * s, ry - rh]], .12 * s, '#2e2010');
  return { ridge: [x, ry - rh], win: [wx0, wy0, wx1, wy1] };
}
function dog(x, y, s, t, p, dir = 1, col = '#0e0a08') {        // an askal in silhouette: p 0 = barking, 1 = cowering
  if (col === '#0e0a08') { g.save(); g.translate(-4, -4); dog(x, y, s, t, p, dir, 'rgba(170,190,255,.75)'); g.restore(); }
  const bark = p < .5 ? Math.abs(Math.sin(t * 9)) : 0, bob = bark * s * .03;
  g.save(); g.translate(x, y); g.scale(dir, 1);
  for (const lx of [-.32, -.22, .22, .32]) line([[lx * s, -.42 * s + p * .1 * s], [lx * s + p * .05 * s, 0]], .07 * s, col);
  ell(0, -.5 * s + p * .12 * s, .42 * s, .16 * s); g.fillStyle = col; g.fill();
  curve([.4 * s, -.55 * s + p * .1 * s], [.56 * s, -.78 * s + p * .55 * s], [.6 * s, -.9 * s + p * .82 * s], .05 * s, col);
  const hx = -.5 * s, hy = -.8 * s + p * .42 * s - bob;
  line([[-.3 * s, -.56 * s + p * .1 * s], [hx + .05 * s, hy + .05 * s]], .14 * s, col); ell(hx, hy, .14 * s, .11 * s); g.fill();
  path([[hx - .1 * s, hy - .03 * s], [hx - .3 * s, hy + .02 * s - .05 * s * bark], [hx - .28 * s, hy + .06 * s], [hx - .08 * s, hy + .07 * s]]); g.closePath(); g.fill();
  path([[hx + .02 * s, hy - .08 * s], [hx + .06 * s + p * .12 * s, hy - .27 * s + p * .21 * s], [hx + .12 * s, hy - .06 * s]]); g.closePath(); g.fill();
  if (col === '#0e0a08') circ(hx - .05 * s, hy - .02 * s, .018 * s, 'rgba(255,220,160,.9)');
  g.restore();
}
// a dark thing crouched on a roof: folded bat wings, long clawed arms, hair in the wind, a long tongue, a twitching head; red eyes
function crouched(x, y, s, t, e = 1, col = '#020205') {
  if (col === '#020205') { g.save(); g.translate(-4, -5); crouched(x, y, s, t, 0, 'rgba(170,190,255,.55)'); g.restore(); }
  const jerk = Math.max(0, Math.sin(t * 1.3) - .93) * 14, tilt = .22 * Math.sin(t * .5) + .5 * Math.sin(t * 40) * Math.min(1, jerk), hx = -.04 * s + Math.sin(t * .6) * .03 * s, hy = -.97 * s;
  g.save(); g.translate(x, y); g.fillStyle = col;
  for (const sg of [-1, 1]) { path([[sg * .12 * s, -.78 * s], [sg * .5 * s, -1.5 * s], [sg * .6 * s, -1.08 * s], [sg * .82 * s, -1.32 * s], [sg * .74 * s, -.74 * s], [sg * .46 * s, -.45 * s]]); g.closePath(); g.fill(); }
  g.beginPath(); g.moveTo(-.45 * s, 0); g.quadraticCurveTo(-.52 * s, -.62 * s, -.1 * s, -.86 * s); g.quadraticCurveTo(.36 * s, -.96 * s, .46 * s, -.5 * s); g.lineTo(.5 * s, 0); g.closePath(); g.fill();
  for (const sg of [-1, 1]) { line([[sg * .26 * s, -.52 * s], [sg * .5 * s, -.2 * s], [sg * .56 * s, .02 * s]], .085 * s, col); for (let k = 0; k < 4; k++) curve([sg * .56 * s, .02 * s], [sg * (.6 + k * .04) * s, .08 * s], [sg * (.58 + k * .05) * s, .16 * s], .018 * s, col); }
  g.save(); g.translate(hx, hy); g.rotate(tilt); ell(0, 0, .17 * s, .2 * s); g.fill();
  for (let k = 0; k < 16; k++) { const a = (k / 15 - .5) * 1.7; curve([Math.sin(a) * .15 * s, -.1 * s], [Math.sin(a) * .4 * s + Math.sin(t * 2 + k) * .06 * s, .32 * s], [Math.sin(a) * .34 * s + Math.sin(t * 1.6 + k) * .1 * s, .85 * s], .045 * s, col); }
  if (e > 0) { for (const sg of [-1, 1]) { circ(sg * .065 * s, .01 * s, .026 * s, `rgba(255,60,50,${e})`); circ(sg * .065 * s, .01 * s, .01 * s, `rgba(255,220,200,${e})`); }
    curve([-.07 * s, .1 * s], [0, .14 * s], [.07 * s, .1 * s], .012 * s, `rgba(180,20,30,${e})`); curve([0, .12 * s], [.06 * s + Math.sin(t * 2) * .05 * s, .5 * s], [.02 * s + Math.sin(t * 1.3) * .08 * s, .82 * s], .025 * s, `rgba(110,10,24,${e})`); }
  g.restore(); g.restore();
  if (e > 0) for (const sg of [-1, 1]) L(x + hx + sg * .065 * s, y + hy, .32 * s, C.red, .95 * e, .7 * e);
}
// the manananggal: the upper half, flying on bat wings; long black hair, red eyes, a ragged waist
function manananggal(x, y, s, t, o = {}) {
  const fl = Math.sin(t * (o.rate || 6.5)), skin = '#6a625c', sc = o.scream ?? .4; g.save(); g.translate(x, y); g.rotate(o.tilt || 0);
  for (const sg of [-1, 1]) { g.save(); g.scale(sg, 1); g.rotate(-.15 - .5 * fl); const F = [[1.55, -.55], [1.75, .05], [1.4, .5], [.85, .78]];
    g.beginPath(); g.moveTo(.15 * s, -.22 * s); F.forEach(([fx, fy], i) => { const nx = F[i + 1]; if (!i) g.lineTo(fx * s, fy * s); if (nx) g.quadraticCurveTo((fx + nx[0]) / 2 * s * .78, (fy + nx[1]) / 2 * s * .78, nx[0] * s, nx[1] * s); });
    g.lineTo(.15 * s, .32 * s); g.closePath(); g.fillStyle = 'rgba(12,8,14,.97)'; g.fill(); for (const [fx, fy] of F) line([[.15 * s, -.18 * s], [fx * s, fy * s]], .028 * s, '#241c26'); g.restore(); }
  g.fillStyle = skin; g.beginPath(); g.moveTo(-.22 * s, -.3 * s); g.quadraticCurveTo(0, -.42 * s, .22 * s, -.3 * s); g.lineTo(.17 * s, .34 * s); g.lineTo(-.17 * s, .34 * s); g.closePath(); g.fill();
  for (let k = 0; k < 7; k++) { const xx = -.16 * s + k * .053 * s; curve([xx, .32 * s], [xx + Math.sin(t * 3 + k) * .03 * s, .48 * s], [xx + Math.sin(t * 2 + k) * .05 * s, (.58 + .2 * hash(k)) * s], .026 * s, '#2a080c'); }
  for (const sg of [-1, 1]) { line([[sg * .2 * s, -.25 * s], [sg * .4 * s, .05 * s], [sg * .32 * s, .3 * s]], .07 * s, skin); for (let k = 0; k < 3; k++) line([[sg * .32 * s, .3 * s], [sg * (.29 + k * .04) * s, .41 * s]], .02 * s, '#e0d8d0'); }
  const hy = -.56 * s;
  for (let k = 0; k < 16; k++) { const a = (k / 15 - .5) * 1.4; curve([Math.sin(a) * .15 * s, hy - .12 * s], [Math.sin(a) * .32 * s, hy + .2 * s], [Math.sin(a) * .36 * s + Math.sin(t * 4 + k) * .05 * s, hy + (.62 + .2 * hash(k)) * s], .045 * s, '#050406'); }
  ell(0, hy, .16 * s, .19 * s); g.fillStyle = skin; g.fill(); ell(0, hy - .1 * s, .17 * s, .12 * s); g.fillStyle = '#050406'; g.fill();
  for (const sg of [-1, 1]) { circ(sg * .06 * s, hy - .01 * s, .032 * s, '#ff3b30'); circ(sg * .06 * s, hy - .01 * s, .012 * s, '#ffe0d0'); }
  curve([0, hy + .12 * s], [.15 * s + Math.sin(t * 3) * .1 * s, hy + .55 * s], [.05 * s + Math.sin(t * 2.2) * .15 * s, hy + (1.05 + .1 * Math.sin(t * 4)) * s], .028 * s, '#7a0a1a');
  ell(0, hy + .1 * s, .05 * s, .02 * s + .07 * s * sc); g.fillStyle = '#1a0306'; g.fill(); for (const sg of [-1, 1]) path([[sg * .035 * s, hy + .08 * s], [sg * .02 * s, hy + .08 * s + .03 * s], [sg * .01 * s, hy + .08 * s]]), g.fillStyle = '#eee', g.fill();
  g.restore(); for (const sg of [-1, 1]) L(x + sg * .06 * s, y + hy, .35 * s, C.red, .95, .6);
}
function lowerHalf(x, y, s, t, smoke = 0) {     // the legs and skirt she left standing
  const skin = ['#9a8478', '#76625a', '#46382e'];
  for (const sg of [-1, 1]) limb([[x + sg * .08 * s, y - .5 * s], [x + sg * .09 * s, y - .25 * s], [x + sg * .1 * s, y]], .075 * s, skin);
  g.beginPath(); g.moveTo(x - .2 * s, y - .95 * s); g.lineTo(x + .2 * s, y - .95 * s); g.lineTo(x + .29 * s, y - .42 * s); g.lineTo(x - .29 * s, y - .42 * s); g.closePath(); g.fillStyle = lg(x - .3 * s, 0, x + .3 * s, 0, ['#d6cfbf', '#aaa190', '#6a6458']); g.fill(); g.strokeStyle = OL; g.lineWidth = .015 * s; g.stroke();
  for (let k = 0; k < 6; k++) line([[x - .22 * s + k * .09 * s, y - .44 * s], [x - .2 * s + k * .08 * s, y - .9 * s]], .006 * s, 'rgba(0,0,0,.25)');
  for (let k = 0; k < 8; k++) { const xx = x - .19 * s + k * .054 * s; curve([xx, y - .95 * s], [xx + .01 * s, y - 1.0 * s], [xx + Math.sin(t * 2 + k) * .02 * s, y - (1.03 + .05 * hash(k)) * s], .026 * s, '#3a0a10'); }
  glow(x, y - .97 * s, .3 * s, '255,40,60', .3); L(x, y - .97 * s, .7 * s, C.red, .5, .2); cshadow(x, y, .4 * s, .06 * s, .6);
  if (smoke > 0) for (let k = 0; k < 10; k++) { const p = (t * .5 + k / 10) % 1; circ(x + Math.sin(k * 2.3 + t) * .12 * s * p, y - .98 * s - p * .8 * s, (.05 + .12 * p) * s, `rgba(200,200,210,${.35 * smoke * (1 - p)})`); }
}
function rooster(x, y, s, t, crow = 0) {      // on the fence, in silhouette
  const col = '#0a0604'; g.save(); g.translate(x, y);
  ell(0, -.3 * s, .28 * s, .2 * s); g.fillStyle = col; g.fill();
  for (let k = 0; k < 5; k++) curve([.2 * s, -.38 * s], [.5 * s, -(.8 + k * .08) * s], [(.45 + k * .05) * s, -(.25 - k * .05) * s], .05 * s, col);
  const hx = -.25 * s, hy = -.6 * s - crow * .12 * s; line([[-.15 * s, -.4 * s], [hx, hy]], .12 * s, col); circ(hx, hy, .09 * s, col);
  path([[hx - .07 * s, hy - .02 * s], [hx - .2 * s, hy - .02 * s - crow * .05 * s], [hx - .07 * s, hy + .03 * s]]); g.closePath(); g.fill();
  for (let k = 0; k < 3; k++) circ(hx - .02 * s + k * .04 * s, hy - .1 * s, .035 * s, '#3a0606');
  line([[-.05 * s, -.12 * s], [-.05 * s, 0]], .03 * s, col); line([[.05 * s, -.12 * s], [.05 * s, 0]], .03 * s, col); g.restore();
}

function mist(t, y0, a = .2) {
  reset(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) { const x = ((hash(i * 3.1) * 1600 + t * (14 + 10 * hash(i))) % 1900) - 400, y = y0 + (hash(i * 5.7) - .3) * 260, w = 500 + 400 * hash(i);
    g.fillStyle = rg(x, y, 0, w, [`rgba(150,170,210,${a * (.5 + .5 * hash(i + 2))})`, 'rgba(150,170,210,0)']); g.save(); g.translate(x, y); g.scale(1, .22); g.translate(-x, -y); g.fillRect(x - w, y - w, 2 * w, 2 * w); g.restore(); }
  reset();
}
// ---------- inside the kubo ----------
function gasera(x, y, s, t, a = 1) {            // a kerosene lamp: a small green bottle, a wick, a flame
  rr(x - .5 * s, y - .9 * s, s, .9 * s, .2 * s); fs(lg(x - .5 * s, 0, x + .5 * s, 0, ['#4a5a44', '#7a8a6a', '#2a3426']), .05 * s);
  line([[x, y - .9 * s], [x, y - 1.1 * s]], .08 * s, '#3a2a1a');
  if (a > 0) { const f = flick(t), fh = 1.0 * s * f * a; g.beginPath(); g.moveTo(x, y - 1.1 * s - fh); g.quadraticCurveTo(x + .32 * s, y - 1.1 * s - fh * .3, x, y - 1.05 * s); g.quadraticCurveTo(x - .32 * s, y - 1.1 * s - fh * .3, x, y - 1.1 * s - fh); g.fillStyle = '#ffd27a'; g.fill();
    glow(x, y - 1.4 * s, 2.5 * s, '255,190,110', .7 * a); L(x, y - 1.3 * s, 17 * s * f * (.6 + .4 * a), C.amb, .95 * a, .4 * a); }
}
function rosary(x, y, s) { for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; circ(x + Math.cos(a) * 1.4 * s, y + Math.sin(a) * .9 * s, .16 * s, '#e8e0f0'); } line([[x, y + .9 * s], [x, y + 1.9 * s]], .12 * s, '#e8e0f0'); line([[x - .35 * s, y + 1.35 * s], [x + .35 * s, y + 1.35 * s]], .12 * s, '#e8e0f0'); }
// the room: a woven bamboo wall, a slatted floor, the window to the night, a little altar, the store calendar, the lamp
function room(t, o = {}) {
  const lamp = o.lamp ?? 1;
  g.save(); g.fillStyle = pat(TEX.sawali); g.fillRect(-400, -400, 1900, 2000); g.restore();
  g.fillStyle = 'rgba(30,18,8,.25)'; g.fillRect(-400, -400, 1900, 2000);
  for (const x of [-60, 1140]) { g.fillStyle = '#2e2010'; g.fillRect(x - 30, -400, 60, 2000); }
  g.fillStyle = '#2e2010'; g.fillRect(-400, 180, 1900, 40);
  const fy = o.floorY || 1380; g.fillStyle = '#4a321c'; g.fillRect(-400, fy, 1900, 900);
  for (let k = -12; k <= 12; k++) { const xb = 540 + k * 120; line([[540 + k * 60, fy], [xb + k * 90, 2300]], 6, 'rgba(10,6,2,.7)'); }
  if (o.win) { const [a, b, c, d] = o.win; g.save(); g.beginPath(); g.rect(a, b, c - a, d - b); g.clip(); g.translate(0, 0); sky(t, { moonAt: o.moonAt || [a + (c - a) * .7, b + (d - b) * .3], mr: 46 }); if (o.outside) o.outside(a, b, c, d); g.restore();
    g.strokeStyle = '#2a1a0a'; g.lineWidth = 26; g.strokeRect(a, b, c - a, d - b); line([[a + (c - a) / 2, b], [a + (c - a) / 2, d]], 12, '#2a1a0a');
    path([[a - 30, b], [c + 30, b], [c + 70, b - 120], [a + 10, b - 120]]); g.closePath(); g.fillStyle = '#3e2a16'; g.fill(); line([[c, d - 20], [c + 60, b - 110]], 10, '#1e1206'); }
  if (o.altar) { const [x, y] = o.altar; g.fillStyle = '#3e2a16'; g.fillRect(x - 90, y, 180, 16); line([[x, y - 120], [x, y - 10]], 10, '#d8c8a0'); line([[x - 35, y - 90], [x + 35, y - 90]], 10, '#d8c8a0'); circ(x + 60, y - 18, 10, '#f0e0c0'); if (lamp > 0) L(x + 60, y - 40, 120, C.amb, .6 * lamp, .3 * lamp); }
  if (o.cal) { const [x, y] = o.cal; rr(x - 70, y, 140, 190, 6); g.fillStyle = '#ece4d4'; g.fill(); g.fillStyle = '#b02a2a'; g.fillRect(x - 70, y, 140, 60); text(TX.cal, x, y + 32, 34, '#fff', 'Anton'); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) g.fillStyle = 'rgba(40,30,20,.5)', g.fillRect(x - 58 + c * 20, y + 78 + r * 26, 12, 12); }
  if (o.bulb !== undefined) { const on = o.bulb; line([[540, -400], [540, 260]], 4, '#1a1a1a'); ell(540, 290, 22, 30); g.fillStyle = on > 0 ? '#fff4c8' : '#5a5040'; g.fill(); if (on > 0) { glow(540, 290, 260, '255,236,190', .7 * on); L(540, 300, 1300, C.warm, .95 * on, .3 * on); } }
  if (lamp > 0 && o.lampAt) gasera(o.lampAt[0], o.lampAt[1], o.lampS || 34, t, lamp);
}
function kulambo(x0, y0, x1, y1, t, o = {}) {   // a mosquito net over the sleepers
  g.save(); g.fillStyle = pat(TEX.banig); g.fillRect(x0, y1 - 70, x1 - x0, 90); g.restore();
  for (const [u, who] of o.sleepers || []) { const x = lerp(x0, x1, u), y = y1 - 60;
    rr(x - 40, y - 70, 260, 90, 40); fs(lg(0, y - 70, 0, y + 20, who.blanket || ['#7a3a5a', '#4a1e34']), 4);
    for (let k = 0; k < 4; k++) line([[x - 20 + k * 60, y - 66], [x - 30 + k * 60, y + 16]], 6, 'rgba(255,220,140,.35)');
    g.save(); g.translate(x - 70, y - 40); g.rotate(-Math.PI / 2 + .15); face(0, 0, 52, { eyes: 'shut', skin: who.skin || NANAY.skin, hair: who.hair || NANAY.hair, lx: 1, t, rim: 'rgba(255,200,150,.4)' }); g.restore(); }
  const sag = 14 * Math.sin(t * .5);
  g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0 + 10, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + 40 + sag, x1 - 10, y0); g.lineTo(x1, y1); g.closePath(); g.fillStyle = 'rgba(255,214,228,.2)'; g.fill();
  g.save(); g.clip(); for (let x = x0; x < x1; x += 9) line([[x, y0], [x, y1]], 1, 'rgba(255,240,245,.14)'); for (let y = y0; y < y1; y += 9) line([[x0, y], [x1, y]], 1, 'rgba(255,240,245,.1)'); g.restore();
  g.strokeStyle = 'rgba(255,230,240,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0 + 10, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + 40 + sag, x1 - 10, y0); g.lineTo(x1, y1); g.stroke();
  for (const x of [x0 + 10, x1 - 10]) line([[x, y0], [x + (x < 540 ? -40 : 40), y0 - 160]], 3, 'rgba(240,230,220,.5)');
}
function garlic(x, y, s, n = 6) {               // a braid of garlic bulbs
  line([[x, y], [x, y + n * .55 * s]], .12 * s, '#b8a070');
  for (let k = 0; k < n; k++) { const yy = y + .3 * s + k * .52 * s, sg = k % 2 ? 1 : -1; g.beginPath(); g.moveTo(x + sg * .15 * s, yy - .25 * s); g.quadraticCurveTo(x + sg * .55 * s, yy, x + sg * .2 * s, yy + .28 * s); g.quadraticCurveTo(x - sg * .1 * s, yy + .1 * s, x + sg * .15 * s, yy - .25 * s); fs('#efe6d4', .03 * s); for (let j = 0; j < 3; j++) curve([x + sg * .17 * s, yy - .2 * s], [x + sg * (.25 + j * .08) * s, yy], [x + sg * .2 * s, yy + .25 * s], .015 * s, 'rgba(160,120,140,.45)'); }
}
function pagi(x, y, len, ang, s = 1) {           // a stingray tail whip
  g.save(); g.translate(x, y); g.rotate(ang); rr(-14 * s, -10 * s, 70 * s, 20 * s, 8 * s); fs('#3a2a1a', 3);
  g.beginPath(); g.moveTo(56 * s, -7 * s); g.quadraticCurveTo(len * .5, -14 * s, len, 0); g.quadraticCurveTo(len * .5, 10 * s, 56 * s, 7 * s); g.closePath(); g.fillStyle = lg(0, 0, len, 0, ['#5a4a3a', '#8a7a62', '#4a3e30']); g.fill();
  for (let k = 0; k < 18; k++) circ(70 * s + k * (len - 90 * s) / 18, 0, 2.5 * s, 'rgba(230,220,200,.6)'); path([[len * .62, -6 * s], [len * .7, -16 * s], [len * .68, -4 * s]]); g.closePath(); g.fillStyle = '#d8ccb4'; g.fill(); g.restore();
}

// ---------- shots ----------
const S = {};
const dim = { night: '#0e1226', room: '#140c10', dark: '#0c080c', day: '#8a7c74' };
// the hook: the kubo under the full moon; the dog barks, then stops and cowers; on the ridge something crouched, eyes red
function hookScene(t, k) {        // k = seconds since frame 1 (negative in the loop's lead-in)
  const quiet = k > 0 ? ss(seg(k, W_STOP, W_STOP + .4)) : 0, e = .55 + .45 * (k > 0 ? ss(seg(k, W_ASW - .2, W_ASW + .2)) : 0);
  cam(lerp(540, 590, ss(seg(k, -2.2, 8))), lerp(900, 860, ss(seg(k, -2.2, 8))), lerp(1, 1.12, ss(seg(k, -2.2, 8))), 0, 0, t);
  sky(t, { moonAt: [600, 830], mr: 210 }); palm(60, 1960, 1450, t, 1); palm(1060, 1960, 1250, t, 2); banana(170, 1960, 680, t, 3);
  ground(t, 1880); const k1 = kubo(600, 2050, 190, t, { lit: .35 }); crouched(k1.ridge[0] + 10, k1.ridge[1] + 50, 300, t, e);
  banana(1010, 2080, 700, t, 4); fence(2000, t, -100, 1180, '#08070a'); dog(290, 1910, 210, t, quiet); L(290, 1790, 240, C.moon, .5, .05);
  lightPass(dim.night); mist(t, 1820, .22);
}
S.hook = (t, u) => hookScene(t, u);
S.loop = (t, u) => hookScene(t, u - (TL.dur - T('tail')));
// a vacation at Lola's: no signal (the phone up high), then the bulb dies
S.arrive = (t, u) => { const on = t < W_BROWN ? 1 : 0; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 5)));
  room(t, { bulb: on, lamp: t > W_BROWN + .6 ? ss(seg(t, W_BROWN + .6, W_BROWN + 1.4)) : 0, lampAt: [860, 1330], cal: [880, 520], altar: [230, 600] });
  person(520, 1900, 1150, { t, ...HB, arms: on ? 'up' : 'down', eyes: on ? 'open' : 'wide', lookY: on ? -.8 : 0, look: on ? 0 : .5, lx: 1, rim: 'rgba(255,200,150,.6)' });
  if (on) { const px = 520 + 1150 * .195, py = 1900 - 1150 * 1.01; rr(px - 28, py - 50, 56, 100, 10); fs('#111', 4); g.fillStyle = '#9ad8ff'; g.fillRect(px - 22, py - 42, 44, 82); text('NO SIGNAL', px, py, 11, '#13304a', 'Anton'); L(px, py, 300, C.cyan, .8, .3); }
  lightPass(on ? '#4a3a34' : dim.dark); };
// everyone asleep under the kulambo, except Lola: the rosary, the window
S.kubo = (t, u) => { cam(lerp(560, 520, seg(u, 0, 6)), 900, lerp(1.02, 1.08, seg(u, 0, 6)));
  room(t, { win: [560, 420, 980, 900], lampAt: [470, 1390], lampS: 36, altar: [200, 560], cal: [330, 300], outside: (a, b, c, d) => { banana(c - 60, d + 60, 520, t, 5); palm(a + 40, d + 120, 700, t, 6); } });
  kulambo(-60, 1060, 520, 1500, t, { sleepers: [[.18, { skin: NANAY.skin, hair: NANAY.hair }], [.62, { skin: SKIN, hair: HAIRC, blanket: ['#2f5d8a', '#1a3a5a'] }]] });
  rr(640, 1560, 330, 40, 8); fs('#4a3018', 4); for (const x of [665, 945]) { g.fillStyle = '#3a2410'; g.fillRect(x - 10, 1595, 20, 150); }
  person(800, 1730, 820, { t, ...LOLA, sit: .8, arms: 'lap', eyes: 'open', look: .7, lx: -1, rim: 'rgba(255,190,130,.55)' }); rosary(800, 1730 - 820 * .42 + 820 * .8 * .16 + 10, 24);
  lightPass(dim.room); };
// Lola leans in and whispers: five rules
S.whisper = (t, u) => { cam(CX, 900, lerp(1.0, 1.12, seg(u, 0, 6)));
  room(t, { lampAt: [300, 1500], lampS: 40, altar: [880, 520] });
  person(560, 2350, 1500, { t, ...LOLA, arms: 'lap', eyes: 'open', look: -.25, mouth: .18 + .12 * Math.abs(Math.sin(t * 9)) * (t < W_FIVE + 3 ? 1 : 0), lx: -1, rim: 'rgba(255,190,130,.6)' });
  lightPass(dim.room); if (t > W_FIVE - .1) tag(TX.five, CX, 470, YEL, C.amb, 1.7 * back(seg(t, W_FIVE - .1, W_FIVE + .2), 1.8) * (1 - ss(seg(t, E('s3') + .1, E('s3') + .4)))); };
// not every aswang looks like a monster: the kind neighbour at the gate with a covered bowl; on "kapitbahay" her shadow on the wall has wings
S.neighbor = (t, u) => { const w = ss(seg(t, W_KAPIT - .3, W_KAPIT + .6)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)));
  sky(t, { dawn: .32, moonAt: [900, 260], mr: 40 });
  g.save(); g.translate(0, 300); g.fillStyle = pat(TEX.sawali); g.fillRect(-400, 0, 1900, 1400); g.restore(); g.fillStyle = 'rgba(40,24,10,.3)'; g.fillRect(-400, 300, 1900, 1400);
  for (const x of [-20, 1100]) { g.fillStyle = '#2e2010'; g.fillRect(x - 30, 300, 60, 1400); } g.fillStyle = '#2e2010'; g.fillRect(-400, 290, 1900, 34);
  g.save(); g.translate(700, 1700); g.globalAlpha = .55; g.fillStyle = '#120a08'; ell(0, -1030, 95, 110); g.fill(); rr(-150, -930, 300, 640, 90); g.fill(); rr(-120, -320, 240, 330, 30); g.fill(); g.restore();
  if (w > 0) { g.save(); g.globalAlpha = .6 * w; manananggal(700, 1020, 330 * (.6 + .4 * w), t * .3, { rate: 2 }); g.restore(); LIGHTS.pop(); LIGHTS.pop(); }
  fence(1700, t, -100, 1180, '#1e140a'); ground(t, 1690, { day: 1 });
  const h = 900, x = 540, y = 1860; person(x, y, h, { t, hood: ['#e8c45a', '#c09a34', '#6a521a'], legs: ['#4a3e5a', '#2e263a', '#16121e'], skin: ['#d8a888', '#b0805e', '#6a4630'], hair: NANAY.hair, longHair: 1, arms: 'lap', eyes: 'open', smile: 1, lx: 1, rim: 'rgba(255,200,150,.6)' });
  const by = y - h * .42 + h * .02; ell(x, by, 120, 40); fs('#d8d0c0', 4); ell(x, by - 18, 112, 34); fs('#b8b0a0', 4); circ(x, by - 46, 14, '#8a8070');
  if (w > 0) for (const sg of [-1, 1]) { const ex = x + sg * h * .052, ey = y - h * .855 + h * .005; circ(ex, ey, h * .012, `rgba(255,60,50,${w})`); L(ex, ey, h * .08, C.red, .9 * w, .6 * w); }
  L(x - 200, 900, 1100, C.amb, .75, .08); lightPass('#5a4a50'); };
// rule 1: under the roof, the thatch above; the tik-tik; on "mahina" the nipa sags right over you, bits rain down
S.roof = (t, u) => { const near = ss(seg(t, W_MAHINA - .2, W_MAHINA + .6)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, near * 2.5, t);
  g.save(); g.fillStyle = pat(TEX.nipa); g.fillRect(-400, -400, 1900, 1500); g.restore(); g.fillStyle = 'rgba(10,6,2,.35)'; g.fillRect(-400, -400, 1900, 1500);
  for (let k = -3; k <= 3; k++) line([[540 + k * 150, -400], [540 + k * 260, 1100]], 26, '#3a2812');
  for (let y = -200; y < 1100; y += 170) line([[-400, y], [1500, y]], 18, '#3a2812');
  const sx = lerp(-200, 560, ss(seg(t, T('r1') + .5, W_MAHINA + .3))), sy = 450;
  g.fillStyle = rg(sx, sy, 0, 320 + 120 * near, ['rgba(0,0,0,.85)', 'rgba(0,0,0,0)']); g.fillRect(sx - 500, sy - 500, 1000, 1000);
  if (near > 0) for (let k = 0; k < 40; k++) { const p = ((t - W_MAHINA) * .8 + hash(k)) % 1; circ(560 + (hash(k * 3) - .5) * 300, sy + p * 1200, 3 + 3 * hash(k), `rgba(200,170,110,${.8 * near * (1 - p)})`); }
  g.fillStyle = '#2a1c10'; g.fillRect(-400, 1100, 1900, 60);
  if (near > 0) { for (let k = 0; k < 4; k++) { const fx = 470 + k * 50, len = 260 * near * (1 - .15 * Math.abs(k - 1.5)); line([[fx, 640], [fx + (k - 1.5) * 10, 640 + len]], 20, '#0a0606'); curve([fx + (k - 1.5) * 10, 640 + len], [fx + (k - 1.5) * 14, 660 + len], [fx + (k - 1.5) * 20, 655 + len], 6, '#d8ccc0'); }
    circ(790, 720, 16, `rgba(255,60,50,${near})`); circ(790, 720, 6, `rgba(255,220,200,${near})`); L(790, 720, 100, C.red, near, .7 * near); }
  gasera(820, 1900, 38, t, 1 - .45 * near); L(540, 500, 900, C.amb, .45 * (1 - .5 * near), .05);
  person(540, 2650, 1500, { t, ...HB, eyes: 'wide', lookY: -1, look: .2 * Math.sin(t), sweat: 1, mouth: .25 + .25 * near, lx: 1, rim: 'rgba(255,200,150,.6)' });
  lightPass(dim.room); };
// rule 2: someone outside calls your name; at the window, a shape in the banana grove
S.call = (t, u) => { const up = ss(seg(t, wordT('r2', 'pangalan'), wordT('r2', 'Nanay') + .3)); cam(lerp(540, 600, seg(u, 0, 7)), 900, lerp(1, 1.1, seg(u, 0, 7)));
  room(t, { win: [180, 380, 900, 1060], lampAt: [930, 1480], lampS: 34, moonAt: [760, 520], outside: (a, b, c, d) => { banana(a + 120, d + 80, 560, t, 8); banana(c - 90, d + 120, 640, t, 9);
    const fx = a + 210, fy = lerp(d + 260, d - 230, up); for (let k = 0; k < 18; k++) { const xx = fx - 190 + k * 22; curve([xx, fy - 150], [xx + Math.sin(t + k) * 10, fy + 80], [xx + Math.sin(t * .7 + k) * 16, fy + 360], 16, '#050406'); }
    face(fx, fy, 170, { t, eyes: 'dead', skin: ['#8a8480', '#5e5856', '#2e2a28'], hair: ['#050406', '#050406', '#020203'], mouth: .2 + .25 * up, zombie: 1, lx: 1, ears: 0 });
    for (let k = 0; k < 9; k++) { const xx = fx - 150 + k * 37; curve([xx, fy - 175], [xx + 6, fy - 40], [xx - 10 + Math.sin(t + k) * 8, fy + 30 + 60 * hash(k)], 14, '#050406'); }
    for (const sg of [-1, 1]) L(fx + sg * 63, fy + 5, 70, C.red, .9 * up, .6 * up); } });
  person(640, 2350, 1450, { t, ...HB, back: 1, eyes: 'wide', lx: 1, rim: 'rgba(255,190,140,.6)' });
  lightPass(dim.room); };
// "because Nanay is asleep right next to you": you turn; the kulambo, Nanay asleep
S.nanay = (t, u) => { cam(CX, 900, lerp(1.05, 1.15, seg(u, 0, 2.5)), 0, 0, t);
  room(t, { lampAt: [900, 1500], lampS: 38, altar: [860, 500] });
  g.save(); g.fillStyle = pat(TEX.banig); g.fillRect(-100, 1300, 1300, 700); g.restore(); rr(330, 1080, 520, 300, 120); fs('#ece4f0', 4);
  g.save(); g.translate(560, 1220); g.rotate(-Math.PI / 2 + .2); face(0, 0, 165, { eyes: 'shut', skin: NANAY.skin, hair: NANAY.hair, lx: 1, t, rim: 'rgba(255,200,150,.45)' }); g.restore();
  rr(560, 1260, 700, 420, 140); fs(lg(0, 1260, 0, 1680, ['#7a3a5a', '#4a1e34']), 6); for (let k = 0; k < 5; k++) line([[620 + k * 120, 1270], [600 + k * 120, 1670]], 12, 'rgba(255,220,140,.3)');
  kulambo(-80, 700, 1160, 1700, t, {});
  person(200, 2200, 1300, { t, ...HB, eyes: 'wide', look: .9, sweat: 1, mouth: .3, lx: 1, rim: 'rgba(255,200,150,.6)' });
  lightPass(dim.room); };
// rule 3: a knock; a pale woman at the door asking for water
S.visitor = (t, u) => { cam(CX, 900, lerp(1, 1.1, seg(u, 0, 6)));
  room(t, { lampAt: [180, 1560], lampS: 40 });
  const open = ss(seg(t, T('r3') + 1.2, T('r3') + 2.2)), d0 = 300, d1 = 840, dt = 300, db = 1500;
  g.save(); g.beginPath(); g.rect(d0, dt, d1 - d0, db - dt); g.clip(); sky(t, { moonAt: [760, 420], mr: 40 }); ground(t, 1360);
  const ugly = ss(seg(t, E('r3') - .25, E('r3') + .15)); person(570, 1640, 1150, { t, hood: ['#efece6', '#c8c4bc', '#7a766e'], legs: ['#8a8680', '#5a5650', '#2a2622'], skin: PALE, hair: ['#08070a', '#050406', '#020203'], longHair: 1, arms: 'offer', eyes: ugly > .5 ? 'dead' : 'open', smile: 1, mouth: ugly > .5 ? .6 : 0, zombie: ugly > .5 ? 1 : 0, sway: .3 * ugly, lx: -1, rim: 'rgba(255,200,150,.7)' });
  if (ugly > .5) for (const sg of [-1, 1]) L(570 + sg * 60 + 1150 * .09 * .3, 1640 - 1150 * .855, 60, C.red, .9, .6);
  const hx = 570 + 1150 * .385, hy = 1640 - 1150 * .6; rr(hx - 34, hy - 70, 68, 76, 10); fs('#b0b4b8', 4); g.restore();
  g.fillStyle = '#2a1a0c'; g.fillRect(d0, dt, (d1 - d0) * (1 - open * .82), db - dt); g.strokeStyle = '#1a1006'; g.lineWidth = 30; g.strokeRect(d0, dt, d1 - d0, db - dt);
  L(570, 1000, 600, C.amb, .8, .1); lightPass(dim.room); };
// her eye, close: your reflection in it is upside down; on "aswang" the pupil narrows to a red slit
S.eye = (t, u) => { const sl = ss(seg(t, W_ASW3 - .1, W_ASW3 + .3)); cam(CX, 960, lerp(1, 1.12, seg(u, 0, 4)), 0, sl * 2, t);
  fill('#0a0606'); g.fillStyle = rg(540, 960, 50, 900, [PALE[0], PALE[1], '#2a2220']); g.fillRect(-400, -200, 1900, 2400);
  const ex = 540, ey = 960, er = 330; eye(ex, ey, er, 1, { eyes: 'wide', look: 0, iris: '#4a3a2a', skin: PALE });
  curve([ex - er * 1.2, ey - er * 1.55], [ex, ey - er * 2.05], [ex + er * 1.25, ey - er * 1.35], er * .16, '#0a0806');
  const ir = er * .47, ix = ex, iy = ey + er * .03;
  g.save(); g.beginPath(); g.arc(ix, iy, ir * .96, 0, TAU); g.clip(); g.globalAlpha = .75; g.fillStyle = 'rgba(255,190,110,.25)'; g.fillRect(ix - ir, iy - ir, 2 * ir, 2 * ir);
  g.translate(ix, iy); g.rotate(Math.PI); person(0, ir * .95, ir * 1.75, { t, ...HB, ground: 0, lx: 1 }); g.restore();
  glow(ix - ir * .3, iy - ir * .35, ir * .25, '255,200,120', .6);
  if (sl > 0) { ell(ix, iy, ir * (.3 - .22 * sl), ir * .8); g.fillStyle = `rgba(150,10,20,${sl})`; g.fill(); L(ix, iy, ir * 1.6, C.red, .9 * sl, .5 * sl); }
  L(ex, ey, 900, C.warm, .8, .05); lightPass(dim.room); };
// 3:30: something under the house: the bamboo floor, the gaps, and in one of them, eyes
S.floor = (t, u) => { const e = ss(seg(t, E('mid') - .5, E('mid') + .05)); cam(540, lerp(900, 980, seg(u, 0, 6)), lerp(1, 1.25, ss(seg(u, 0, 6))));
  fill('#020203'); if (e > 0) { g.save(); g.globalAlpha = e; face(600, 1010, 300, { t, eyes: 'dead', skin: ['#7a7470', '#504a48', '#24201e'], hair: ['#050406', '#050406', '#020203'], mouth: .4, zombie: 1, lx: 1, ears: 0 }); g.restore(); L(600, 1010, 520, C.red, .45 * e, .15 * e); }
  for (let k = 0; k < 16; k++) { const y = -100 + k * 140; rr(-200, y, 1500, 108, 30); fs(lg(0, y, 0, y + 122, ['#b0905a', '#8a6a3a', '#5a4220']), 4);
    for (let j = 0; j < 5; j++) line([[-200, y + 20 + j * 20], [1300, y + 24 + j * 20]], 2, 'rgba(60,40,20,.35)'); for (let x = 0; x < 1300; x += 420) { g.fillStyle = 'rgba(40,26,10,.6)'; g.fillRect(x + (k % 3) * 80, y, 10, 122); } }
  g.save(); g.fillStyle = pat(TEX.banig); g.fillRect(-200, -100, 1500, 520); g.restore(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-200, -100, 1500, 520);
  hand(380, 470, 60, 1.4, { skin: HB.skin });
  if (e > 0) { for (const sg of [-1, 1]) { const ex = 600 + sg * 111, ey = 1022; circ(ex, ey, 14, `rgba(255,70,50,${e})`); L(ex, ey, 90, C.red, e, .7 * e); }
    for (let k = 0; k < 4; k++) { const fx = 330 + k * 34, len = 150 * e; line([[fx, 1162], [fx - 6 + k * 3, 1162 - len]], 18, '#5a5250'); curve([fx - 6 + k * 3, 1162 - len], [fx - 12 + k * 3, 1150 - len], [fx - 16 + k * 3, 1158 - len], 6, '#d8ccc0'); } }
  gasera(860, 400, 30, t, .8); lightPass('#1a120e'); };
// share it, before the last two rules: you, under the blanket in the kulambo, eyes wide
S.cta = (t, u) => { cam(CX, 900, lerp(1, 1.06, seg(u, 0, 5)));
  room(t, { lampAt: [880, 1500], lampS: 34, lamp: .8 });
  person(540, 2200, 1350, { t, ...HB, eyes: 'wide', look: .4 * Math.sin(t * .8), sweat: 1, arms: 'rub', lx: 1, rim: 'rgba(255,200,150,.6)' });
  rr(80, 1500, 920, 500, 60); fs(lg(0, 1500, 0, 2000, ['#7a3a5a', '#4a1e34']), 6); for (let k = 0; k < 6; k++) line([[120 + k * 150, 1510], [100 + k * 150, 1990]], 10, 'rgba(255,220,140,.3)');
  kulambo(-60, 300, 1140, 2000, t, {}); lightPass(dim.room); };
// rule 4: garlic on the window, salt along the door, and Lola takes the stingray tail off the wall
S.garlic = (t, u) => { const s_ = ss(seg(t, W_ASIN - .1, W_ASIN + .8)), pg = ss(seg(t, W_PAGI - .3, W_PAGI + .3)); cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)));
  room(t, { win: [70, 720, 470, 1180], lampAt: [600, 1470], lampS: 34, moonAt: [300, 860] });
  garlic(270, 660, 56, 8); L(270, 900, 260, C.moon, .7, .05);
  g.fillStyle = '#1e140a'; g.fillRect(680, 300, 330, 1100); g.strokeStyle = '#120a04'; g.lineWidth = 24; g.strokeRect(680, 300, 330, 1100);
  for (let k = 0; k < 90; k++) { const p = k / 90; if (p > s_) break; circ(680 + p * 330 + Math.sin(k * 7.1) * 4, 1405 + Math.sin(k * 3.3) * 5, 3 + 2 * hash(k), '#f4f2ec'); }
  if (s_ > 0) L(845, 1400, 220, C.white, .6 * s_, .2 * s_);
  if (pg < .5) pagi(520, 760, 380, .12);
  person(400, 1900, 1050, { t, ...LOLA, arms: pg > .5 ? 'out' : 'down', eyes: 'open', look: .5, lx: -1, rim: 'rgba(255,190,130,.6)' });
  if (pg >= .5) pagi(400 + 1050 * .415, 1900 - 1050 * .66, 420, -1.15 - .12 * Math.sin(t * 2.5), 1.1);
  lightPass(dim.room); };
// rule 5: the banana grove under the moon; the upper half flies across the moon; then, down among the trunks, the half she left
S.grove = (t, u) => { const down = ss(seg(t, W_HANAP - .2, W_HANAP + 1.4)); cam(CX, lerp(820, 1080, down), lerp(1, 1.1, down));
  sky(t, { moonAt: [560, 520], mr: 120 });
  const fx = lerp(1300, -300, seg(t, W_MANAN - .6, W_MANAN + 2.4)); if (t > W_MANAN - .6 && t < W_MANAN + 2.4) manananggal(fx, 560 + 80 * Math.sin(t * 1.3), 230, t, { tilt: -.15, scream: .8 });
  for (const [x, h, k] of [[60, 900, 1], [300, 760, 2], [820, 820, 3], [1040, 950, 4]]) banana(x, 1640, h, t, k);
  for (let k = 0; k < 6; k++) { const ex = 100 + hash(k * 7.3) * 880, ey = 1260 + hash(k * 3.1) * 300, a = clamp(Math.sin(t * .7 + k * 2) * 2); if (a > 0) for (const sg of [-1, 1]) { circ(ex + sg * 9, ey, 4, `rgba(255,60,50,${a})`); L(ex + sg * 9, ey, 26, C.red, a, .5 * a); } }
  ground(t, 1620); lowerHalf(560, 1700, 360, t); lightPass(dim.night); mist(t, 1650, .2); };
// sprinkle salt and ash: the jar, the white stream, smoke coming off the cut
S.salt = (t, u) => { const pour = ss(seg(t, T('r5b') + .2, T('r5b') + .8)); cam(560, 1050, lerp(1.15, 1.25, seg(u, 0, 5)));
  sky(t, { moonAt: [300, 500], mr: 70 }); banana(900, 1500, 900, t, 5); banana(150, 1500, 800, t, 6); ground(t, 1460);
  lowerHalf(520, 1700, 560, t, pour);
  const jx = 860, jy = 620; g.save(); g.translate(jx, jy); g.rotate(-1.1 * pour); rr(-60, -90, 120, 170, 20); fs('rgba(220,230,240,.55)', 5); g.fillStyle = '#f4f2ec'; g.fillRect(-52, -10, 104, 80); g.restore();
  person(1080, 2500, 1500, { t, ...HB, arms: 'out', eyes: 'wide', lx: -1, rim: 'rgba(170,190,255,.6)' });
  if (pour > 0) for (let k = 0; k < 120; k++) { const p = ((t * 1.2 + hash(k)) % 1), x = lerp(jx - 80, 520 + (hash(k * 3) - .5) * 120, p), y = lerp(jy + 40, 1150, p) - Math.sin(Math.PI * p) * 60; circ(x, y, 2.5 + 2 * hash(k), k % 4 ? `rgba(245,243,236,${pour})` : `rgba(120,120,125,${pour})`); }
  L(jx, jy, 300, C.white, .6 * pour, .2 * pour); lightPass(dim.night); mist(t, 1500, .2); };
// all night she screams in the sky... until the rooster crows: the sky turns to dawn, she flees
S.dawn = (t, u) => { const d = ss(seg(t, T('dawn') + .8, E('dawn') + 1.2)), cr = ss(seg(t, E('dawn') - .1, E('dawn') + .3)) * (1 - ss(seg(t, E('dawn') + 1.4, E('dawn') + 2.0))); cam(CX, 900, 1);
  sky(t, { dawn: d, moonAt: [760, 420], mr: 64 });
  const a = t * .9, mx = 540 + Math.cos(a) * 280, my = 560 + Math.sin(a * 1.3) * 120 - d * 900; if (d < .95) { g.save(); g.globalAlpha = 1 - d; manananggal(mx, my, 170 * (1 - .4 * d), t, { scream: .9, tilt: Math.sin(a) * .3 }); g.restore(); }
  palm(80, 1620, 1050, t, 7); banana(990, 1640, 700, t, 8); g.save(); g.translate(260, 0); kubo(600, 1600, 110, t, { lit: 0 }); g.restore();
  ground(t, 1600); fence(1700, t); rooster(300, 1560, 330, t, cr);
  lightPass(mixHex('#1c2240', '#8a7468', d)); };
// in the morning: footprints in the mud, leading to the neighbour's house; her window curtain moves
S.morning = (t, u) => { cam(CX, lerp(950, 880, seg(u, 0, 6)), lerp(1, 1.1, seg(u, 0, 6)));
  sky(t, { dawn: 1, moon: 0 }); palm(1030, 1300, 900, t, 9); kubo(760, 1240, 70, t, { lit: 0 });
  const peek = ss(seg(t, wordT('s5', 'kapitbahay') - .2, wordT('s5', 'kapitbahay') + .5)); if (peek > 0) { const wx = 760 - 154 + 45, wy = 1240 - 91 - 147 + 35 + 31; circ(wx + 30, wy + 14, 13 * peek, '#c09070'); for (const sg of [-1, 1]) circ(wx + 30 + sg * 4, wy + 12, 2, '#200'); }
  g.fillStyle = lg(0, 1240, 0, 2200, ['#6a5034', '#3a2818']); g.fillRect(-400, 1240, 1900, 1000);
  for (let i = 0; i < 40; i++) { const x = hash(i * 4.1) * 1300 - 100, y = 1260 + hash(i * 2.3) * 900; ell(x, y, 40 + 60 * hash(i), 8 + 10 * hash(i)); g.fillStyle = 'rgba(30,20,10,.3)'; g.fill(); }
  for (let k = 0; k < 14; k++) { const p = k / 14, x = lerp(420, 700, p) + (k % 2 ? 26 : -26) * (1 - p * .6), y = lerp(1950, 1260, Math.pow(p, .8)), s = lerp(1, .3, p) * 40, show = seg(t, T('s5') + .2 + k * .12, T('s5') + .5 + k * .12);
    if (show <= 0) continue; g.save(); g.globalAlpha = show; ell(x, y, s * .5, s * .9); g.fillStyle = 'rgba(25,15,8,.75)'; g.fill(); for (let j = 0; j < 5; j++) circ(x - s * .3 + j * s * .15, y - s * 1.0 - (j === 0 ? s * .1 : 0), s * .1, 'rgba(25,15,8,.75)'); g.restore(); }
  lightPass(dim.day); };
// so if the dogs go quiet tonight: the yard again, two dogs barking; they stop
S.end = (t, u) => { const q = ss(seg(t, W_TAHIMIK - .1, W_TAHIMIK + .4)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 4)));
  sky(t, { moonAt: [280, 600] }); palm(980, 1580, 1100, t, 3); banana(150, 1560, 600, t, 2); kubo(560, 1560, 120, t, { lit: .4 }); ground(t, 1540); fence(1720, t);
  dog(330, 1720, 180, t, q, 1); dog(760, 1730, 170, t + .4, q, -1); lightPass(dim.night); mist(t, 1650, .22); };

// ---------- overlays: rule cards (danger red) and the share card ----------
function ruleCard(t, t0, t1, n, label) {
  const k = back(seg(t, t0, t0 + .28), 2.2) * (1 - ss(seg(t, t1 + .1, t1 + .35))); if (k <= 0) return;
  reset(); g.save(); g.translate(CX, 470); g.scale(k, k); glass(-420, -140, 840, 280, 34, RED, 5, 'rgba(255,49,80,.8)');
  text(`${TX.rule}${n}`, 0, -70, 54, '#ff8a96', 'Anton'); g.font = '96px Anton'; const sc = Math.min(1, 760 / g.measureText(label).width);
  g.save(); g.translate(0, 34); g.scale(sc, sc); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 30; text(label, 0, 0, 96, '#fff', 'Anton'); g.restore(); g.restore();
}
function bigCard(t, t0, top, bottom, col = YEL, glowc = 'rgba(255,170,80,1)') {
  const k = back(seg(t, t0, t0 + .3), 1.7); if (k <= 0) return; reset(); g.save(); g.translate(CX, 600); g.scale(k, k);
  glass(-440, -150, 880, 300, 44, 'rgba(255,255,255,.65)', 4, 'rgba(255,255,255,.45)');
  g.font = '86px Anton'; const s1 = Math.min(1, 800 / g.measureText(top).width); g.save(); g.translate(0, -44); g.scale(s1, s1); text(top, 0, 0, 86, '#fff', 'Anton'); g.restore();
  g.font = '70px Anton'; const s2 = Math.min(1, 800 / g.measureText(bottom).width); g.save(); g.translate(0, 62); g.scale(s2, s2); g.shadowColor = glowc; g.shadowBlur = 24; text(bottom, 0, 0, 70, col, 'Anton'); g.restore(); g.restore();
}

// ---------- the rule cards (RULE #n up top, from the rule's first word to the end of its beat) ----------
const RULES = [['r1', 'r1'], ['r2', 'r2b'], ['r3', 'r3b'], ['r4', 'r4'], ['r5', 'r5b']];
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .24; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  ZK = 1;
  S[sh[2]](t, u);
  bloom(); vignette(.6);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'hook') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .3, .8)));
  RULES.forEach(([a, b], i) => { if (t >= T(a) && t < E(b) + .5) ruleCard(t, T(a), E(b), i + 1, TX.rules[i]); });
  if (sh[2] === 'cta') bigCard(t, W_SHARE - .1, TX.share[0], TX.share[1]);
  if (sh[2] !== 'loop') captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

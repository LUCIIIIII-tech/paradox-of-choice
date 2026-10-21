// Huling Tren (The Last Train): a dark, painterly zombie-outbreak scenario reel, 1080x1920. Deterministic in t: window.renderAt(t).
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
// Look and engine from ../puyat: every scene is drawn in its true colours, then darkened, and only the lights (fluorescent
// green-white, siren red and blue, fire orange, emergency red, screen cyan) bring the colour back. Smooth camera, no glitches.
const W = 1080, H = 1920, CX = W / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'); let g = cv.getContext('2d');
const LANG = new URLSearchParams(location.search).get('lang') || 'tl';     // tl (default) | en
const SUF = LANG === 'tl' ? '' : '.' + LANG;
const TL = await (await fetch(`timeline${SUF}.json`)).json();
const ANCH = SUF ? await (await fetch(`anchors${SUF}.json`)).json() : {};
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
const TX = {
  tl: { t1: 'ANG KATABI MO SA TREN...', t2: 'HINDI HUMIHINGA', you: 'IKAW', calling: 'TUMATAWAG...', mom: 'NANAY', fail: 'HINDI MAKONTAK', bitten: 'NAKAGAT',
        bias: "HINDI 'TO TOTOO", where: 'NASAAN?', share: ['I-TAG MO', 'ANG ISASAMA MO'], safe: 'LIGTAS', exit: 'EXIT' },
  en: { t1: 'THE MAN NEXT TO YOU...', t2: "ISN'T BREATHING", you: 'YOU', calling: 'CALLING...', mom: 'MOM', fail: 'NO ANSWER', bitten: 'BITTEN',
        bias: "THIS ISN'T REAL", where: 'WHERE?', share: ['TAG THE ONE', "YOU'D BRING"], safe: 'SAFE', exit: 'EXIT' },
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
  if (arms !== 'rub') drawArms();
  if (longHair) { rr(hc[0] - h * .155, hc[1] - h * .08, h * .31, h * .27, h * .1); g.fillStyle = lg(0, hc[1] - h * .08, 0, hc[1] + h * .19, [o.hair ? o.hair[1] : HAIRC[1], '#08070c']); g.fill(); g.strokeStyle = OL; g.lineWidth = h * .006; g.stroke(); }
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
function counter(t) {
  const on = t >= LN.l04.t0 && t < LN.scare.t0; if (!on) return;
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
const REDCAP = ['snap', 'panic', 'knock'];
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


// ---------- places (each returns a post-light step: the emissive things, beams and dust) ----------
const RIMC = 'rgba(190,240,225,.5)';
const EGG = () => { const l = LN.l01, d = l.t1 - l.t0; return [l.t0 + d * .6, l.t0 + d * .6 + .45]; };
const tunnelX = (k, t) => ((t * 900 + k * 830) % 2500) - 700;     // the lamps in the tunnel streaking past the windows
// the subway car, seen straight on: ceiling lights, ads, windows onto the tunnel, straps, poles, the bench, the floor
function trainCar(t, o = {}) {
  const { lights = 1, red = 0, egg = 0 } = o, back_ = keep();
  g.fillStyle = lg(0, 140, 0, 330, ['#8e9a9e', '#c4ced0']); g.fillRect(-500, 60, 2100, 280);
  for (const lx2 of [-240, 260, 760, 1260]) { rr(lx2 - 170, 200, 340, 38, 14); fs('#dfe9e6', 4); }
  g.fillStyle = lg(0, 330, 0, 1240, ['#c9d2d4', '#9aa6aa']); g.fillRect(-500, 330, 2100, 920);
  line([[-500, 336], [1600, 336]], 6, 'rgba(0,0,0,.35)');
  const ads = [['#24406a', '#e8b84a'], ['#5a2440', '#f0e0d0'], ['#1e4a3e', '#ffd28a'], ['#3a2a5a', '#7ad0e8']];
  for (let k = 0; k < 4; k++) { const ax = -150 + k * 380; rr(ax, 375, 330, 120, 8); fs(lg(ax, 0, ax + 330, 0, [ads[k][0], '#101420']), 4); circ(ax + 70, 435, 38, ads[k][1]); for (const [yy, ww, aa] of [[405, 170, .75], [432, 120, .45], [452, 140, .35]]) { rr(ax + 130, yy, ww, yy === 405 ? 16 : 11, 5); g.fillStyle = `rgba(255,255,255,${aa})`; g.fill(); } }
  line([[-500, 535], [1600, 535]], 14, OL); line([[-500, 533], [1600, 533]], 8, '#c8ccd2'); line([[-500, 530], [1600, 530]], 2, 'rgba(255,255,255,.7)');
  for (let k = 0; k < 14; k++) { const sx = -330 + k * 130, a = .14 * Math.sin(t * 1.4 + k * .35) + .05 * Math.sin(t * 3.1 + k); g.save(); g.translate(sx, 538); g.rotate(a); line([[0, 0], [0, 70]], 10, '#2a2c36'); circ(0, 92, 22, OL, 12); circ(0, 92, 22, '#d8dade', 7); g.restore(); }
  for (const [wx0, wx1] of [[60, 500], [580, 1020]]) {
    g.save(); rr(wx0, 570, wx1 - wx0, 300, 26); g.clip();
    g.fillStyle = lg(0, 570, 0, 870, ['#05070c', '#0e1218']); g.fillRect(wx0, 570, wx1 - wx0, 300);
    for (let k = 0; k < 7; k++) { const yy = 610 + k * 38, off = (t * 1600 + k * 300) % 400; line([[wx0 - off, yy], [wx1, yy]], 2, 'rgba(120,140,150,.12)'); }
    for (let k = 0; k < 4; k++) { const sx = tunnelX(k, t); if (sx > wx0 - 300 && sx < wx1 + 300) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = lg(sx - 260, 0, sx + 40, 0, ['rgba(180,230,255,0)', 'rgba(220,245,255,.9)']); rr(sx - 260, 660, 300, 14, 7); g.fill(); g.restore(); } }
    g.globalAlpha = .12; g.fillStyle = '#c9d2d4'; g.fillRect(wx0, 790, wx1 - wx0, 80); g.globalAlpha = 1;
    if (egg > 0 && wx0 === 60) { g.save(); g.globalAlpha = egg * .85; g.fillStyle = 'rgba(150,170,175,.6)'; ell(230, 640, 34, 42); g.fill(); path([[170, 870], [190, 700], [230, 682], [270, 700], [290, 870]]); g.closePath(); g.fill(); for (const sg of [-1, 1]) circ(230 + sg * 12, 636, 4, 'rgba(255,255,255,.95)'); g.restore(); }
    g.fillStyle = 'rgba(255,255,255,.04)'; path([[wx0 + 30, 570], [wx0 + 110, 570], [wx0 + 30, 870], [wx0 - 50, 870]]); g.closePath(); g.fill();
    g.restore();
    rr(wx0, 570, wx1 - wx0, 300, 26); g.strokeStyle = OL; g.lineWidth = 22; g.stroke(); g.strokeStyle = '#a8b0b6'; g.lineWidth = 13; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.stroke();
  }
  for (let k = 0; k < 8; k++) { const bx = -260 + k * 220; rr(bx, 960, 212, 290, 24); fs(lg(bx, 0, bx + 212, 0, ['#3a6ea0', '#28507a', '#1a3656']), 5); line([[bx + 20, 1000], [bx + 192, 1000]], 3, 'rgba(255,255,255,.12)'); for (let j = 0; j < 4; j++) line([[bx + 30, 1040 + j * 50], [bx + 182, 1040 + j * 50]], 2, 'rgba(0,0,0,.18)'); }
  rr(-500, 1240, 2100, 56, 16); fs(lg(0, 1240, 0, 1296, ['#3f78ac', '#1e3a5c']), 5);
  g.fillStyle = '#20242c'; g.fillRect(-500, 1296, 2100, 60); line([[-500, 1298], [1600, 1298]], 3, 'rgba(255,255,255,.15)');
  g.drawImage(TEX.lino, -420, 1356); g.fillStyle = lg(0, 1356, 0, 1460, ['rgba(0,0,0,.55)', 'rgba(0,0,0,0)']); g.fillRect(-500, 1356, 2100, 104);
  for (const px of [30, 1050]) { line([[px, 60], [px, 2100]], 34, OL); g.fillStyle = lg(px - 13, 0, px + 13, 0, ['#8a9098', '#f4f6f8', '#6a7078']); g.fillRect(px - 13, 60, 26, 2040); }
  L(540, 250, 950, C.fluo, .95 * lights, .12 * lights); L(540, 1000, 700, null, .55 * lights);
  for (let k = 0; k < 4; k++) { const sx = tunnelX(k, t); if (sx > -100 && sx < 1180) L(sx - 100, 700, 300, '190,230,255', .5, .1); }
  if (red > 0) L(540, 400, 1200, C.red, red, .35 * red);
  return () => {
    back_();
    for (const lx2 of [-240, 260, 760, 1260]) { rr(lx2 - 160, 206, 320, 26, 10); g.fillStyle = `rgba(240,255,250,${.35 + .6 * lights})`; g.fill(); glow(lx2, 219, 260, C.fluo, .3 * lights); }
    if (red > 0) for (const lx2 of [260, 760]) { circ(lx2, 165, 20, `rgba(255,40,60,${red})`); glow(lx2, 165, 160, C.red, .6 * red); }
  };
}
// the three on the bench: a woman on her phone, you, and the man in the white shirt
function passengers(t, o = {}) {
  const { slump = 1, manEyes = 'shut', twitch = 0, youEyes = 'open', look = .45, fear = 0, manMouth = 0, scream = 0 } = o;
  person(130, 1396, 560, { t, sit: 1, hood: COAT, legs: SUIT, longHair: 1, arms: scream ? 'rub' : 'phone', eyes: scream ? 'wide' : 'open', look: .9, mouth: scream, lx: 1, rim: RIMC });
  person(420, 1396, 600, { t, sit: 1, arms: 'lap', eyes: youEyes, look, tired: .25, sweat: fear, lx: 1, rim: RIMC });
  person(720, 1396, 600, { t, sit: 1, outfit: 'shirt', hood: SHIRT, legs: SUIT, skin: ZSKIN, zombie: 1, slump, eyes: manEyes, mouth: manMouth, arms: 'lap', bandage: 1, twitch, lx: -1, rim: RIMC, tired: .6 });
}
// a detailed zombie face filling the frame (the scare)
function zface(t, u) {
  const x = CX, y = 860, r = 440, mo = lerp(.4, 1.25, eo(seg(u, .05, .35)));
  for (let i = 0; i < 26; i++) { const a = -Math.PI * (.05 + .9 * i / 25), wv = Math.sin(t * 5 + i) * 18; curve([x + Math.cos(a) * r * .8, y - r * .2 + Math.sin(a) * r * .9], [x + Math.cos(a) * r * 1.2 + wv, y - r * .1 + Math.sin(a) * r * 1.15], [x + Math.cos(a) * r * 1.05, y + r * .4 + Math.sin(a) * r * .2], 10, '#08070a'); }
  ell(x, y + r * 1.5, r * 1.1, r * .7); g.fillStyle = '#1a1416'; g.fill();
  const P = () => { g.beginPath(); g.moveTo(x, y - r); g.bezierCurveTo(x + r * .62, y - r, x + r, y - r * .55, x + r * .95, y); g.bezierCurveTo(x + r * .92, y + r * .6, x + r * .5, y + r * 1.05, x, y + r * 1.05); g.bezierCurveTo(x - r * .5, y + r * 1.05, x - r * .92, y + r * .6, x - r * .95, y); g.bezierCurveTo(x - r, y - r * .55, x - r * .62, y - r, x, y - r); g.closePath(); };
  P(); g.fillStyle = rg(x - r * .25, y - r * .35, r * .1, r * 1.3, ZSKIN); g.fill();
  g.save(); P(); g.clip();
  for (let i = 0; i < 26; i++) { ell(x + (hash(i * 4.4) - .5) * r * 1.6, y + (hash(i * 2.2) - .5) * r * 1.8, r * (.04 + .1 * hash(i)), r * (.03 + .08 * hash(i + 1)), i); g.fillStyle = `rgba(${hash(i + 5) > .5 ? '60,70,40' : '90,40,50'},${.18 + .2 * hash(i + 2)})`; g.fill(); }
  for (let i = 0; i < 14; i++) { const sg = i % 2 ? 1 : -1; let px = x + sg * r * (.9 - .2 * hash(i)), py = y - r * (.5 - .9 * hash(i * 3)); const pts = [[px, py]]; for (let k = 0; k < 6; k++) { px -= sg * r * (.05 + .04 * hash(i + k)); py += (hash(i * 7 + k) - .5) * r * .12; pts.push([px, py]); } line(pts, r * .012, 'rgba(50,15,50,.55)'); }
  for (const sg of [-1, 1]) { g.fillStyle = rg(x + sg * r * .38, y - r * .02, r * .1, r * .42, ['rgba(20,10,20,.75)', 'rgba(20,10,20,0)']); g.fillRect(x + sg * r * .38 - r * .45, y - r * .45, r * .9, r * .9); g.fillStyle = rg(x + sg * r * .55, y + r * .45, 0, r * .35, ['rgba(20,15,20,.5)', 'rgba(20,15,20,0)']); g.fillRect(x + sg * r * .55 - r * .4, y + r * .05, r * .8, r * .8); }
  g.restore();
  P(); g.strokeStyle = OL; g.lineWidth = 10; g.stroke();
  for (const sg of [-1, 1]) eye(x + sg * r * .38, y - r * .04, r * .2, sg, { eyes: 'dead', skin: ZSKIN });
  for (const sg of [-1, 1]) curve([x + sg * r * .14, y - r * .32], [x + sg * r * .38, y - r * .44], [x + sg * r * .62, y - r * .3], r * .06, '#2a2a22');
  for (const sg of [-1, 1]) { ell(x + sg * r * .06, y + r * .3, r * .04, r * .07, sg * .3); g.fillStyle = '#140a0c'; g.fill(); }
  const my = y + r * .62, mw = r * .42, mh = r * .2 * mo;
  ell(x, my, mw + 14, mh + 12); g.fillStyle = '#4a0e18'; g.fill();
  ell(x, my, mw, mh); g.fillStyle = rg(x, my, 5, mw, ['#000', '#1a0306', '#3a0810']); g.fill();
  g.save(); ell(x, my, mw, mh); g.clip();
  for (const sg of [-1, 1]) for (let i = 0; i < 10; i++) { const tx = x - mw * .9 + i * mw * .2, yb = my + sg * mh * Math.sqrt(Math.max(0, 1 - ((tx - x) / mw) ** 2)), Lt = (34 + 30 * hash(i + sg * 3)) * (hash(i * 7 + sg) > .15 ? 1 : .3); g.beginPath(); g.moveTo(tx - 16, yb); g.quadraticCurveTo(tx - 6, yb - sg * Lt * .6, tx + (hash(i) - .5) * 8, yb - sg * Lt); g.quadraticCurveTo(tx + 7, yb - sg * Lt * .6, tx + 16, yb); g.closePath(); g.fillStyle = lg(0, yb, 0, yb - sg * Lt, ['#6a5a3a', '#d8ccae']); g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; g.stroke(); }
  g.restore();
  for (let k = 0; k < 4; k++) { const dx = x - mw * .7 + k * mw * .45; curve([dx, my + mh * .6], [dx + 6, my + mh + 30], [dx - 2, my + mh + 50 + 40 * (.6 + .4 * Math.sin(t * 3 + k))], 5, 'rgba(110,10,25,.85)'); }
  curve([x + mw * .9, my - 10], [x + mw * 1.2, my - 40], [x + mw * 1.35, my - 30], 6, '#3a0810');
}

// ---------- overlays specific to this reel ----------
function icons(t, t0) {   // 20 people: 3 stay calm, 15 freeze, 2 panic (Leach, 2004)
  for (let i = 0; i < 20; i++) {
    const a = back(seg(t, t0 + i * .04, t0 + i * .04 + .25), 2); if (a <= 0) continue;
    const x = 225 + (i % 10) * 70, y = 610 + Math.floor(i / 10) * 92, kind = i < 3 ? 1 : i >= 18 ? 2 : 0, col = kind === 1 ? GRN : kind === 2 ? RED : '#8a90a0';
    g.save(); g.translate(x, y); g.scale(a, a); if (kind) { g.shadowColor = col; g.shadowBlur = 18; }
    circ(0, -18, 13, col); rr(-15, -2, 30, 36, 12); g.fillStyle = col; g.fill(); g.restore();
  }
}

// ---------- shots ----------
const S = {};
// 1. the hook: the last train home. The man beside you hasn't breathed in a while. (Easter egg: someone in the window behind you.)
S.train = (t, u, eggOn = 1) => {
  const L1 = LN.l01, th = wordT('l01', 'humihinga'), [e0, e1] = EGG(), ea = eggOn * ss(seg(t, e0, e0 + .1)) * (1 - ss(seg(t, e1 - .1, e1)));
  cam(lerp(540, 650, ss(seg(t, 0, L1.t1))), lerp(900, 990, ss(seg(t, th - .5, th + .6))), lerp(1.0, 1.24, ss(seg(t, 0, L1.t1 + .2))), Math.sin(t * 1.1) * .006);
  const post = trainCar(t, { egg: ea });
  passengers(t, { slump: 1 });
  L(720, 1000, 330, null, .5);
  lightPass('#2c3a44'); post();
  tag(TX.you, 420, 830, AMB, C.amb, back(seg(t, .5, .8), 1.8) * (1 - seg(t, 2.6, 2.9)));
};
// 2. his bandaged hand on his knee... a finger moves
S.hand = (t, u) => {
  const tg = wordT('l02', 'gumalaw'), tw = t > tg ? Math.max(0, Math.sin((t - tg) * 9)) * Math.exp(-(t - tg) * .6) : 0;
  const lights = 1 - .45 * Math.sin(Math.PI * seg(t, tg - .2, tg + .9)) ** 2;
  cam(766, 1258, lerp(4.4, 4.9, seg(u, 0, span('l02') + .3)), .02);
  const post = trainCar(t, { lights }); passengers(t, { slump: 1, twitch: tw });
  for (let k = 0; k < 3; k++) { const p = (u * .7 + k / 3) % 1; circ(778, 1262 + p * 120, 3.5 * (1 - p * .5), `rgba(140,10,25,${.9 * (1 - p)})`); }
  L(770, 1250, 160, null, .7);
  lightPass('#26323c'); post();
};
// 3. the open loop: the train from outside, roaring through the tunnel; "...hindi ang mga zombie" turns it red
S.loop1 = (t, u) => {
  const th = wordT('l03', 'hindi'), bad = t > th;
  cam(CX, 920, lerp(1.08, 1, eo(seg(u, 0, 1))), 0, bad ? 8 * (1 - seg(t, th, th + .45)) : 0, t);
  grad('#06080c', '#12161c', -500, 2300); const back_ = keep();
  for (let k = 0; k < 9; k++) line([[-500, 420 + k * 26], [1600, 420 + k * 26]], 3, 'rgba(90,100,110,.25)');
  g.fillStyle = '#0c0f14'; g.fillRect(-500, 1290, 2100, 800);
  for (let k = 0; k < 2; k++) { line([[-500, 1320 + k * 50], [1600, 1320 + k * 50]], 10, '#5a5e66'); line([[-500, 1317 + k * 50], [1600, 1317 + k * 50]], 3, 'rgba(255,255,255,.35)'); }
  const off = -((t * 700) % 1500);
  for (let c = -1; c < 2; c++) {
    const bx = off + c * 1500;
    rr(bx, 720, 1440, 560, 40); fs(lg(0, 720, 0, 1280, ['#d8dde2', '#9aa2aa', '#6a727a']), 8);
    g.fillStyle = '#2a5a9a'; g.fillRect(bx + 10, 1120, 1420, 40); g.fillStyle = '#c4262e'; g.fillRect(bx + 10, 1160, 1420, 12);
    for (let w = 0; w < 5; w++) { const wx = bx + 70 + w * 280; rr(wx, 800, 220, 200, 20); fs(lg(0, 800, 0, 1000, ['#f4f0d8', '#d8e8e0']), 6);
      g.save(); rr(wx, 800, 220, 200, 20); g.clip(); for (let p = 0; p < 2; p++) { const px = wx + 60 + p * 100, ph = hash(w * 7 + c * 3 + p); if (ph > .35) { ell(px, 900, 26, 30); g.fillStyle = 'rgba(20,24,30,.85)'; g.fill(); rr(px - 40, 930, 80, 80, 26); g.fill(); } } g.restore(); }
    rr(bx + 1250, 780, 150, 330, 10); fs('#b8c0c6', 5); rr(bx + 1270, 800, 110, 150, 8); fs('#e8ecd8', 4);
    for (const wb of [200, 1200]) { rr(bx + wb - 120, 1270, 240, 50, 14); fs('#1a1c22', 5); circ(bx + wb - 60, 1300, 30, '#3a3c44'); circ(bx + wb + 60, 1300, 30, '#3a3c44'); }
  }
  for (let k = 0; k < 3; k++) { const lx2 = ((k * 600 - t * 300) % 1800 + 1800) % 1800 - 300; circ(lx2, 380, 14, '#fff6d8'); }
  L(540, 900, 900, '230,240,220', .9, .1); for (let k = 0; k < 3; k++) { const lx2 = ((k * 600 - t * 300) % 1800 + 1800) % 1800 - 300; L(lx2, 380, 360, C.warm, .6, .25); }
  if (bad) L(540, 900, 1100, C.red, .7 * ss(seg(t, th, th + .4)), .4);
  lightPass(bad ? '#3a1a24' : '#262c34'); back_();
  for (let k = 0; k < 14; k++) { const y = 700 + hash(k) * 620, x = ((hash(k * 3) * 1400 - t * 2200) % 1400 + 1400) % 1400 - 200; line([[x, y], [x + 180 + 120 * hash(k + 1), y]], 2, 'rgba(255,255,255,.18)'); }
  if (bad) { reset(); const k2 = back(seg(t, th, th + .25), 2); g.save(); g.translate(880, 600); g.scale(k2, k2); g.shadowColor = 'rgba(255,49,80,.95)'; g.shadowBlur = 50; text('?', 0, 0, 300, '#ff5068', 'Anton', 'center', 14); g.restore(); }
};
// 4. his head snaps up: white eyes
S.snap = (t, u) => {
  const tt_ = wordT('l04', 'tumingala'), up = t > tt_, k = up ? eo(seg(t, tt_, tt_ + .18)) : 0;
  cam(lerp(700, 690, k), lerp(1000, 930, k), up ? lerp(3.4, 2.6, eo(seg(t, tt_, tt_ + .5))) : lerp(2.4, 2.7, seg(u, 0, tt_ - LN.l04.t0)), 0, up ? 14 * (1 - seg(t, tt_, tt_ + .5)) : 0, t);
  const post = trainCar(t, { lights: .8, red: up ? .35 : 0 });
  passengers(t, { slump: 1 - k, manEyes: up ? 'dead' : 'shut', manMouth: up ? .35 + .1 * Math.sin(t * 4) : 0, youEyes: up ? 'wide' : 'open', look: up ? .9 : .45, fear: up ? .8 : 0 });
  L(720, 960, 260, up ? C.red : null, .8, .2);
  lightPass(up ? '#3a2430' : '#2a3640'); post();
};
// 5. someone screams at the end of the car; everyone runs; the man gets up
S.panic = (t, u) => {
  const ts = wordT('l05', 'sumigaw'), tr = wordT('l05', 'nagtakbuhan'), red = ss(seg(t, ts, ts + .5));
  cam(540, 960, lerp(1.08, 1.0, eo(seg(u, 0, .6))), 0, t > tr ? 4 : 0, t);
  const post = trainCar(t, { lights: lerp(1, .4, red), red });
  const scream = t > ts ? clamp(.6 + .4 * Math.sin(t * 7)) : 0;
  person(130, 1396, 560, { t, sit: 1, hood: COAT, legs: SUIT, longHair: 1, arms: scream ? 'rub' : 'phone', eyes: scream ? 'wide' : 'open', look: .9, mouth: scream, lx: 1, rim: RIMC });
  person(420, 1396, 600, { t, sit: 1, arms: 'lap', eyes: 'wide', look: 1, sweat: 1, lx: 1, rim: RIMC });
  const st = ss(seg(t, ts, tr + .6));
  if (st < .5) person(720, 1396, 600, { t, sit: 1, outfit: 'shirt', hood: SHIRT, legs: SUIT, skin: ZSKIN, zombie: 1, eyes: 'dead', mouth: .4, arms: 'lap', bandage: 1, lx: -1, rim: RIMC });
  else person(740 - 60 * st, 1420, 640, { t, outfit: 'shirt', hood: SHIRT, legs: SUIT, skin: ZSKIN, zombie: 1, eyes: 'dead', mouth: .5 + .2 * Math.sin(t * 5), arms: 'reach', bandage: 1, lx: -1, rim: 'rgba(255,60,80,.55)', sway: Math.sin(t * 2.5) * .5 });
  for (let i = 0; i < 9; i++) { const st0 = tr + i * .12; if (t < st0) continue; const x = 1250 - (t - st0) * (900 + 200 * hash(i)), h = 560 + 160 * hash(i * 3); runner(x, 1520 + hash(i) * 120, h, (t - st0) * 12 + i, { rim: 'rgba(255,90,100,.5)' }); }
  L(130, 960, 260, null, .6); L(720, 900, 300, C.red, .6 * st, .2);
  lightPass('#30222c'); post();
};
// 6-7. you freeze. Everyone streaks past. 75% of people freeze in a real disaster.
S.freeze = (t, u) => {
  const beat = .5 + .5 * Math.sin(t * TAU * 1.4), t7 = LN.l07.t0;
  cam(420, 960, lerp(1.6, 1.85, seg(u, 0, 6)));
  const post = trainCar(t, { lights: .35, red: .55 });
  person(420, 1396, 600, { t, sit: 1, arms: 'lap', eyes: 'wide', look: 0, sweat: 1, tired: .2, lx: 1, rim: 'rgba(255,90,100,.6)' });
  for (let i = 0; i < 6; i++) { const ph = (u * .55 + i / 6) % 1, x = lerp(1100, -300, ph), h = 640 + 90 * hash(i); for (let k = 4; k >= 0; k--) runner(x + k * 60, 1760, h, u * 10 + i, { alpha: k ? .07 : .32, rim: 'rgba(255,90,100,.25)' }); }
  L(420, 980, 300, C.warm, .6, .06);
  lightPass('#2a1e28'); post();
  reset(); g.fillStyle = rg(CX, 950, 300, 1100, ['rgba(0,0,0,0)', `rgba(120,0,15,${.25 + .25 * beat})`]); g.fillRect(0, 0, W, H);
  if (t > t7 + .4) icons(t, t7 + .5);
};
// 8. the doors open onto a dark platform. Run.
S.doors = (t, u) => {
  const tr = wordT('l08', 'Tumakbo'), open = eo(seg(u, .05, .7)), run = t > tr ? ei(seg(t, tr, tr + .9)) : 0;
  cam(540, 950, 1 + run * .9, 0, run ? 3 : 0, t);
  g.drawImage(TEX.tiles, -100, 380); const back_ = keep();
  g.fillStyle = '#1a1c22'; g.fillRect(-300, 1180, 1700, 900); g.fillStyle = '#c8a82a'; g.fillRect(-300, 1180, 1700, 26);
  rr(650, 640, 300, 110, 10); fs('#0c2a18', 5); text(TX.exit, 800, 697, 80, '#7dffb0', 'Anton');
  for (const lx2 of [180, 900]) { circ(lx2, 470, 26, '#5a0a10'); }
  shambler(700, 1180, 430, t, { eyes: open, alpha: .9, ph: 1 });
  const dw = 330 * open;
  for (const sg of [-1, 1]) { const x0 = sg < 0 ? 210 - dw : 540 + dw; rr(x0, 380, 330, 900, 10); fs(lg(x0, 0, x0 + 330, 0, ['#b8c0c6', '#e8ecef', '#9aa2a8']), 8); rr(x0 + 60, 470, 210, 330, 16); fs('rgba(20,26,30,.85)', 6); line([[sg < 0 ? x0 + 330 : x0, 380], [sg < 0 ? x0 + 330 : x0, 1280]], 18, '#1a1c22'); }
  g.fillStyle = '#9aa6aa'; g.fillRect(-300, 300, 1700, 80); g.fillRect(-300, 300, 210, 1000); g.fillRect(870, 300, 600, 1000);
  g.fillStyle = '#c4ced0'; g.fillRect(-300, 1280, 1700, 40);
  L(540, 800, 600 * open + 50, C.red, .9, .25); L(800, 697, 260, C.grn, .9 * open, .2); L(540, 360, 600, C.fluo, .6, .08);
  lightPass('#2a1c24'); back_();
  for (const lx2 of [180, 900]) { circ(lx2, 470, 18, `rgba(255,40,60,${.6 + .4 * Math.sin(t * 3)})`); glow(lx2, 470, 200, C.red, .5); }
  if (run > 0) { reset(); g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 40; k++) { const a = hash(k) * TAU, r0 = 200 + ((hash(k * 3) * 900 + t * 2400) % 900); g.strokeStyle = `rgba(255,255,255,${.25 * run})`; g.lineWidth = 3; g.beginPath(); g.moveTo(CX + Math.cos(a) * r0, 950 + Math.sin(a) * r0); g.lineTo(CX + Math.cos(a) * (r0 + 160), 950 + Math.sin(a) * (r0 + 160)); g.stroke(); } g.restore(); }
};
// 9. outside: sirens, roadblocks, a car burning; you call home and no one answers
S.city = (t, u) => {
  const tn = wordT('l09', 'sumasagot'), fail = t > tn, sir = Math.sin(t * 5);
  cam(560, 940, lerp(1.06, 1.0, eo(seg(u, 0, 1))));
  grad('#06070e', '#1a1424', -500, 1150); g.drawImage(TEX.city, 200, 0, 2200, 900, -400, 280, 1900, 780); const back_ = keep();
  for (const [bx, w_, top] of [[-300, 360, 380], [880, 420, 420]]) { g.drawImage(TEX.brick, 0, 0, w_, 1150 - top, bx, top, w_, 1150 - top); g.fillStyle = 'rgba(10,8,20,.35)'; g.fillRect(bx, top, w_, 1150 - top); for (let wy = top + 50; wy < 900; wy += 130) for (let wx = bx + 40; wx < bx + w_ - 60; wx += 120) { rr(wx, wy, 70, 90, 4); fs(hash(wx + wy) > .7 ? '#c08a4a' : '#141626', 4); } rr(bx + 40, 950, w_ - 80, 200, 4); fs('#1a1c26', 4); for (let k = 0; k < 9; k++) line([[bx + 45, 960 + k * 20], [bx + w_ - 45, 960 + k * 20]], 3, 'rgba(255,255,255,.06)'); }
  g.fillStyle = '#22202c'; g.fillRect(-500, 1150, 2100, 900); path([[460, 1150], [660, 1150], [1100, 1900], [20, 1900]]); g.closePath(); g.fillStyle = '#2c2a38'; g.fill();
  for (let k = 0; k < 6; k++) { const p = k / 6, y = 1150 + p * p * 760; line([[560, y], [560, y + 20 + p * 60]], 4 + 10 * p, 'rgba(230,220,180,.5)'); }
  for (let i = 0; i < 5; i++) shambler(470 + i * 60 + Math.sin(t * .4 + i) * 10, 1160 + i * 6, 120 + i * 8, t, { eyes: .8, ph: i, alpha: .9 });
  g.save(); g.translate(250, 1220); rr(-150, -110, 300, 110, 30); fs('#e8e8ee', 6); rr(-100, -170, 190, 70, 24); fs('#1a1c26', 5); rr(-70, -205, 130, 30, 8); fs('#1a1c26', 4); rr(-56, -200, 50, 20, 6); g.fillStyle = sir > 0 ? '#ff3150' : '#4a0a14'; g.fill(); rr(8, -200, 50, 20, 6); g.fillStyle = sir < 0 ? '#4a8aff' : '#0a1a4a'; g.fill(); circ(-90, 0, 32, '#1a1a20'); circ(90, 0, 32, '#1a1a20'); g.fillStyle = '#1a2a6a'; g.fillRect(-150, -70, 300, 16); g.restore();
  for (let k = 0; k < 5; k++) { const bx = 650 + k * 70; line([[bx, 1240], [bx, 1180]], 10, '#3a3020'); } rr(630, 1170, 330, 34, 6); g.fillStyle = '#e8e4d8'; g.fill(); for (let k = 0; k < 6; k++) { path([[640 + k * 55, 1170], [670 + k * 55, 1170], [650 + k * 55, 1204], [620 + k * 55, 1204]]); g.closePath(); g.fillStyle = '#d4342e'; g.fill(); }
  g.save(); g.translate(880, 1150); g.rotate(-.12); rr(-160, -90, 320, 90, 26); fs('#3a3a44', 6); circ(-100, -110, 30, '#1a1a20'); circ(100, -110, 30, '#1a1a20'); g.restore();
  person(420, 1500, 660, { t, arms: 'phone', eyes: fail ? 'wide' : 'open', look: .4, sweat: .6, tired: .2, lx: 1, rim: 'rgba(255,80,100,.5)' });
  L(225, 1020, 520, C.red, .55 + .45 * sir, .3 * (.5 + .5 * sir)); L(290, 1020, 520, C.blue, .55 - .45 * sir, .3 * (.5 - .5 * sir));
  L(880, 1050, 380, C.fire, .9 + .1 * Math.sin(t * 9), .35); L(420, 900, 260, C.cyan, .8, .1);
  lightPass('#262236'); back_();
  for (let k = 0; k < 7; k++) { const fx = 860 + (k - 3) * 22, fh = 70 + 50 * Math.sin(t * 7 + k * 1.7) ** 2; g.save(); g.globalCompositeOperation = 'screen'; path([[fx - 22, 1060], [fx + Math.sin(t * 6 + k) * 10, 1060 - fh], [fx + 22, 1060]]); g.closePath(); g.fillStyle = lg(0, 1060, 0, 1060 - fh, ['rgba(255,140,40,.9)', 'rgba(255,220,120,0)']); g.fill(); g.restore(); }
  for (let k = 0; k < 6; k++) { const p = (t * .25 + k / 6) % 1; circ(880 + Math.sin(t + k) * 30 + p * 60, 1020 - p * 520, 50 + p * 120, `rgba(40,36,48,${.4 * (1 - p)})`); }
  const sa = Math.sin(t * .8) * .5; beam([[CX + sa * 600 - 20, -200], [CX + sa * 600 + 20, -200], [CX + sa * 400 + 260, 1500], [CX + sa * 400 - 260, 1500]], CX, -200, CX, 1500, '220,230,255', .12);
  for (const [c, ph] of [[C.red, 0], [C.blue, Math.PI]]) { const a = .5 + .5 * Math.sin(t * 5 + ph); glow(ph ? 950 : 100, 700, 500, c, .18 * a); }
  reset(); const pk = back(seg(u, .2, .5), 1.6); if (pk > 0) { g.save(); g.translate(820, 640); g.scale(pk, pk); glass(-170, -120, 340, 240, 30, fail ? 'rgba(255,49,80,.8)' : 'rgba(82,216,255,.7)', 4, fail ? 'rgba(255,49,80,.8)' : 'rgba(82,216,255,.7)');
    circ(0, -50, 34, fail ? '#5a1a24' : '#2a4a6a'); text(TX.mom, 0, 15, 44, '#fff', 'Anton'); text(fail ? TX.fail : TX.calling, 0, 70, 34, fail ? '#ff6a7a' : '#9fe8ff', 'Anton'); g.restore(); }
};
// 10. one bite becomes two, two become four... the whole city in days
const MAPPTS = []; for (let i = 0; i < 700; i++) { const a = hash(i * 3.7) * TAU, r = Math.pow(hash(i * 1.9), .7) * 470; MAPPTS.push({ x: 540 + Math.cos(a) * r * 1.05, y: 920 + Math.sin(a) * r * .85, d: r + hash(i * 5.3) * 120 }); }
MAPPTS.sort((a, b) => a.d - b.d);
function cityMap(t, n, o = {}) {
  grad('#070a12', '#0c111c', -500, 2300);
  for (let gx = -6; gx <= 6; gx++) for (let gy = -6; gy <= 6; gy++) { const bx = 540 + gx * 90 + (gy % 2) * 18, by = 920 + gy * 80; if (Math.hypot(bx - 540, (by - 920) * 1.2) > 560) continue; rr(bx - 38, by - 32, 76, 64, 8); fs((gx * 7 + gy * 3) % 9 === 0 ? '#12301e' : '#1a202c', 0); g.strokeStyle = 'rgba(140,160,200,.12)'; g.lineWidth = 2; g.stroke(); }
  g.beginPath(); g.moveTo(-100, 640); g.bezierCurveTo(300, 760, 380, 1060, 700, 1100); g.bezierCurveTo(900, 1120, 1000, 1300, 1200, 1350); g.strokeStyle = '#0e2a44'; g.lineWidth = 60; g.stroke(); g.strokeStyle = 'rgba(80,140,200,.2)'; g.lineWidth = 3; g.setLineDash([20, 30]); g.lineDashOffset = -t * 40; g.stroke(); g.setLineDash([]);
  circ(540, 920, 16, 'rgba(255,255,255,.8)', 4);
  g.save(); g.globalCompositeOperation = 'screen'; const nn = Math.min(MAPPTS.length, Math.floor(n));
  for (let i = 0; i < nn; i++) { const p = MAPPTS[i]; glow(p.x, p.y, 34, C.red, .45); circ(p.x, p.y, 4.5, '#ff6a78'); }
  g.restore();
  if (nn > 20) { g.fillStyle = `rgba(160,10,30,${.35 * nn / MAPPTS.length})`; g.fillRect(-500, -500, 2100, 2900); }
}
S.map = (t, u) => {
  const t2 = wordT('l10', 'dalawa'), t4 = wordT('l10', 'apat'), tl_ = wordT('l10', 'lungsod');
  const n = t < t2 ? 1 : t < t4 ? 2 : Math.min(1e6, 4 * Math.pow(2, (t - t4) / Math.max(.12, (tl_ - t4) / 9.5)));
  cam(540, 920, lerp(1.35, 1.0, eo(seg(u, 0, span('l10')))));
  cityMap(t, Math.min(700, n));
  reset(); g.save(); g.translate(CX, 1250); glass(-260, -70, 520, 140, 30, 'rgba(255,49,80,.75)', 4, 'rgba(255,49,80,.8)'); text(TX.bitten, -110, 4, 44, '#ffb0b8', 'Anton'); g.save(); g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 20; text(Math.floor(n).toLocaleString('en-US'), 95, 4, 76, '#ff6a7a', 'Anton'); g.restore(); g.restore();
};
// 11. a whole country: the cities fall first (Cornell's zombie simulation)
const CITIES = [[540, 980], [380, 1180], [720, 1210], [820, 960], [640, 760], [300, 960], [880, 1180], [520, 1330], [760, 1350]];
const ROADS = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 7], [2, 6], [2, 8], [3, 6], [1, 5], [7, 8]];
const CDIST = [0, 1, 1, 1, 1, 1, 2, 2, 2];
function land(t, ti) {
  grad('#04070e', '#081020', -500, 2300);
  g.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU, r = 430 + 40 * Math.sin(a * 3 + 1) + 22 * Math.sin(a * 7 + 2) + 10 * Math.sin(a * 13); g.lineTo(540 + Math.cos(a) * r * 1.0, 1000 + Math.sin(a) * r * 1.08); } g.closePath();
  g.fillStyle = lg(0, 560, 0, 1460, ['#16261c', '#1c2a20']); g.fill(); g.strokeStyle = 'rgba(120,180,220,.35)'; g.lineWidth = 4; g.stroke();
  for (let k = 0; k < 9; k++) { const mx = 230 + k * 34 + (k % 2) * 14, my = 720 + k * 22; path([[mx - 40, my + 40], [mx, my - 40 - 20 * hash(k)], [mx + 40, my + 40]]); g.closePath(); g.fillStyle = '#2a3a30'; g.fill(); path([[mx, my - 40 - 20 * hash(k)], [mx + 40, my + 40], [mx + 10, my + 40]]); g.closePath(); g.fillStyle = '#1a261e'; g.fill(); path([[mx - 10, my - 20 - 16 * hash(k)], [mx, my - 40 - 20 * hash(k)], [mx + 10, my - 22 - 16 * hash(k)]]); g.closePath(); g.fillStyle = '#c8d0d8'; g.fill(); }
  for (const [a, b] of ROADS) { const inf = clamp(((t - ti) / .55 - Math.min(CDIST[a], CDIST[b])) / 1); line([CITIES[a], CITIES[b]], 4, 'rgba(200,190,150,.35)'); if (inf > 0) { const [x0, y0] = CITIES[CDIST[a] <= CDIST[b] ? a : b], [x1, y1] = CITIES[CDIST[a] <= CDIST[b] ? b : a]; line([[x0, y0], [lerp(x0, x1, inf), lerp(y0, y1, inf)]], 6, '#ff3150'); } }
  CITIES.forEach(([x, y], i) => { const inf = clamp(((t - ti) / .55 - CDIST[i]) * 2); glow(x, y, 120, inf > 0 ? C.red : C.amb, inf > 0 ? .5 * inf + .1 : .35); circ(x, y, 10, inf > 0 ? '#ff5068' : '#ffd08a'); });
}
S.sim = (t, u) => {
  cam(540, 1000, lerp(2.2, 1.0, eo(seg(u, 0, .9))));
  land(t, LN.l11.t0 + .5);
};
// 12. the safest place: far from people (moonlit mountains, a cabin)
S.safe = (t, u) => {
  const tm = wordT('l12', 'Malayo');
  cam(540, 950, lerp(1.25, 1.0, eo(seg(t, tm - .3, tm + 1.2))));
  grad('#060a1e', '#1a2448', -500, 1200); for (let i = 0; i < 80; i++) circ(hash(i * 3.3) * 1400 - 160, -200 + hash(i * 1.7) * 1000, 1 + 1.8 * hash(i), `rgba(255,255,255,${.3 + .4 * Math.sin(t * 2 + i)})`);
  fullMoon(800, 520, 52); const back_ = keep();
  for (const [base, col, amp, sd] of [[900, '#1a2442', 180, 1], [1000, '#141c34', 140, 2], [1100, '#0e1428', 110, 3]]) { g.beginPath(); g.moveTo(-500, 2000); for (let x = -500; x <= 1600; x += 40) g.lineTo(x, base - amp * (.5 + .5 * Math.sin(x * .004 * sd + sd)) - 40 * hash(Math.floor(x / 40) + sd * 99)); g.lineTo(1600, 2000); g.closePath(); g.fillStyle = col; g.fill(); }
  for (let i = 0; i < 26; i++) { const tx = -200 + hash(i * 2.7) * 1500, ty = 1180 + hash(i * 5.3) * 180, th_ = 120 + 80 * hash(i); for (let k = 0; k < 4; k++) { path([[tx - th_ * (.32 - k * .06), ty - k * th_ * .22], [tx, ty - th_ * (.4 + k * .2)], [tx + th_ * (.32 - k * .06), ty - k * th_ * .22]]); g.closePath(); g.fillStyle = k % 2 ? '#0e2018' : '#12281e'; g.fill(); } }
  g.fillStyle = '#0a1018'; g.fillRect(-500, 1300, 2100, 800); g.beginPath(); g.moveTo(-500, 1420); g.bezierCurveTo(200, 1380, 600, 1500, 1600, 1440); g.lineTo(1600, 1520); g.bezierCurveTo(600, 1580, 200, 1460, -500, 1500); g.closePath(); g.fillStyle = '#16284a'; g.fill();
  g.save(); g.translate(560, 1280); rr(-110, -110, 220, 110, 6); fs('#3a2a1e', 5); path([[-140, -110], [0, -200], [140, -110]]); g.closePath(); fs('#2a1c14', 5); rr(60, -180, 26, 50, 3); fs('#2a1c14', 3); rr(-70, -80, 50, 46, 4); fs('#ffc066', 3); rr(20, -80, 50, 46, 4); fs('#ffc066', 3); g.restore();
  for (let k = 0; k < 5; k++) { const p = (t * .2 + k / 5) % 1; circ(633 + Math.sin(t + k) * 14, 1100 - p * 260, 14 + 30 * p, `rgba(160,170,190,${.25 * (1 - p)})`); }
  L(800, 520, 900, C.moon, .9, .14); L(560, 1230, 300, C.amb, 1, .35); L(300, 1000, 600, C.moon, .5, .06);
  lightPass('#2a3460'); back_();
  for (let k = 0; k < 6; k++) line([[740 + k * 6, 1430 + k * 14], [860 - k * 6, 1430 + k * 14]], 3, `rgba(220,230,255,${.35 - k * .05})`);
  reset(); tag(TX.safe, 560, 1000, GRN, C.grn, back(seg(t, tm, tm + .3), 1.8));
};
// 13. day 3: hiding in a dark grocery; the water is almost gone
S.grocery = (t, u) => {
  const tw = wordT('l13', 'tubig');
  cam(lerp(540, 760, ss(seg(t, tw - .4, tw + .6))), lerp(930, 1100, ss(seg(t, tw - .4, tw + .6))), lerp(1.0, 1.35, ss(seg(t, tw - .4, tw + .6))));
  grad('#0a0c12', '#14161e', -500, 2300); const back_ = keep();
  const vy = 860;
  g.drawImage(TEX.lino, 0, 0, 1900, 800, -420, vy, 1900, 1100);
  for (const sg of [-1, 1]) for (let k = 0; k < 7; k++) { const z0 = k / 7, z1 = (k + 1) / 7, x0 = 540 + sg * (60 + 900 * (1 - z0) ** 1.6), x1 = 540 + sg * (60 + 900 * (1 - z1) ** 1.6), h0 = 40 + 720 * (1 - z0) ** 1.6, h1 = 40 + 720 * (1 - z1) ** 1.6;
    path([[x0, vy + 10 * (1 - z0) ** 1.6 * 40], [x1, vy + 10 * (1 - z1) ** 1.6 * 40], [x1, vy - h1], [x0, vy - h0]]); g.closePath(); g.fillStyle = '#2a2e38'; g.fill();
    for (let s_ = 0; s_ < 5; s_++) { const f = s_ / 5, ya = vy - h0 * f, yb = vy - h1 * f; line([[x0, ya], [x1, yb]], 3 + 6 * (1 - z0), '#4a4e5a'); for (let p = 0; p < 4; p++) { const u0 = p / 4 + .03, xa = lerp(x0, x1, u0), ha = lerp(h0, h1, u0) * .16, yy = lerp(ya, yb, u0); if (hash(k * 31 + s_ * 7 + p + (sg > 0 ? 100 : 0)) > .35) { rr(xa - ha * .3, yy - ha, ha * .55, ha * .95, 2); g.fillStyle = ['#7a3a3a', '#3a5a7a', '#8a7a3a', '#3a6a4a', '#6a4a7a'][(k + s_ + p) % 5]; g.fill(); } } } }
  rr(470, 600, 140, 56, 6); fs('#0a2414', 3); text(TX.exit, 540, 630, 44, '#7dffb0', 'Anton');
  for (let i = 0; i < 3; i++) shambler(500 + i * 40, 860, 110, t, { eyes: .7, ph: i, alpha: .8 });
  person(250, 1420, 560, { t, sit: 1, arms: 'lap', eyes: 'wide', look: .7, sweat: .5, tired: .6, lx: 1, rim: 'rgba(125,255,176,.4)' });
  g.save(); g.translate(800, 1330); rr(-170, -60, 340, 110, 10); fs('#5a4a3a', 5); for (let k = 0; k < 4; k++) line([[-170 + k * 113, -60], [-170 + k * 113, 50]], 3, 'rgba(0,0,0,.4)');
  for (const bx of [-110, -20]) { rr(bx - 26, -200, 52, 150, 16); fs('rgba(160,210,240,.55)', 4); rr(bx - 14, -228, 28, 30, 6); fs('#2a6ab0', 3); rr(bx - 26, -150, 52, 50, 4); g.fillStyle = 'rgba(255,255,255,.65)'; g.fill(); line([[bx - 14, -190], [bx - 14, -70]], 4, 'rgba(255,255,255,.5)'); } g.restore();
  L(540, 630, 280, C.grn, .9, .2); L(300, 1100, 320, C.warm, .7, .06); L(800, 1230, 260, null, .6);
  lightPass('#1e2230'); back_();
  beam([[330, 1180], [350, 1150], [620, 860], [520, 860]], 340, 1170, 560, 860, C.warm, .2); glow(340, 1170, 50, C.warm, .7);
};
// 14-16. a knock at the back door; a voice: "help me, I'm not bitten"; you open it...
S.knock = (t, u) => {
  const tk = wordT('l14', 'kumatok'), tb = wordT('l16', 'Binuksan'), sil = ss(seg(t, tk - .4, tk));
  let shake = 0; for (let k = 0; k < 3; k++) { const kt = tk + .05 + k * .26; shake += Math.max(0, 1 - Math.abs(t - kt) / .06); }
  const open = t > tb ? eo(seg(t, tb + .4, LN.l16.t1 + .1)) : 0;
  cam(540, 940, lerp(1.0, 1.2, ss(seg(t, LN.l15.t0, LN.l16.t1))), 0, 0, t);
  g.drawImage(TEX.tiles, -100, 300); g.fillStyle = 'rgba(30,30,40,.4)'; g.fillRect(-500, -500, 2100, 2900); const back_ = keep();
  g.fillStyle = '#1a1c22'; g.fillRect(-500, 1300, 2100, 800);
  rr(320, 500, 440, 810, 8); fs('#0a0a0e', 6);
  g.save(); g.translate(330 + shake * 4, 510); const dw = 420 * (1 - .85 * open);
  if (open > 0) { g.fillStyle = '#12060a'; g.fillRect(0, 0, 420, 790); shambler(260, 790, 700, t, { eyes: 1, alpha: 1, rim: 'rgba(255,60,80,.6)' }); }
  rr(0, 0, dw, 790, 6); fs(lg(0, 0, dw, 0, ['#4a5a56', '#36443f', '#26302c']), 6);
  for (const ry of [30, 760]) for (let k = 0; k < 6; k++) circ(20 + k * (dw - 40) / 5, ry, 4, 'rgba(0,0,0,.4)');
  rr(dw * .12, 420, dw * .76, 34, 10); fs('#9aa4a8', 4);
  if (dw > 150) { g.save(); rr(dw * .2, 90, dw * .6, 230, 4); g.clip(); g.fillStyle = lg(0, 90, 0, 320, ['#6a1a24', '#3a0a12']); g.fillRect(0, 90, dw, 230);
    if (sil > 0) { g.save(); g.filter = 'blur(7px)'; g.globalAlpha = sil; ell(dw * .5, 200, 60, 70); g.fillStyle = '#08040a'; g.fill(); g.fillRect(dw * .5 - 100, 260, 200, 80); if (t > LN.l15.t0) { ell(dw * .66, 170 + Math.sin(t * 2) * 4, 34, 44); g.fill(); } g.restore(); }
    g.strokeStyle = 'rgba(200,200,210,.25)'; g.lineWidth = 2; for (let k = -10; k < 20; k++) { line([[dw * .2 + k * 22, 90], [dw * .2 + k * 22 + 230, 320]], 2, 'rgba(200,200,210,.2)'); line([[dw * .8 - k * 22, 90], [dw * .8 - k * 22 - 230, 320]], 2, 'rgba(200,200,210,.2)'); }
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(dw * .2, 90, dw * .6, 230); g.restore(); rr(dw * .2, 90, dw * .6, 230, 4); g.strokeStyle = OL; g.lineWidth = 8; g.stroke(); }
  g.restore();
  line([[540, 300], [540, 400]], 3, '#2a2a30'); circ(540, 410, 16, '#ffe0a0');
  if (t > tb - .3) { const r2 = eo(seg(t, tb - .3, tb + .3)), hx = lerp(1000, 700, r2), hy = lerp(1260, 945, r2); limb([[hx + 420, hy + 760], [hx + 250, hy + 380], [hx + 60, hy + 60]], 150, HOODC, -1); line([[hx + 100, hy + 110], [hx + 50, hy + 50]], 160, OL); line([[hx + 100, hy + 110], [hx + 50, hy + 50]], 140, HOODC[2]); hand(hx, hy, 70, Math.PI + .85, { sg: 1, grip: .6 }); }
  L(540, 420, 520, C.warm, .8, .2); L(540, 700, 380, C.red, .8, .3); if (open > 0) L(560, 900, 600 * open, C.red, open, .35);
  lightPass('#241c26'); back_(); glow(540, 410, 90, C.warm, .7);
};
// 17. the scare
S.scare = (t, u) => {
  if (u < .05) { fill('#fff'); return; }
  fill('#0a0003'); reset(); g.fillStyle = rg(CX, 900, 80, 1100, ['rgba(150,10,35,.95)', 'rgba(40,0,8,1)']); g.fillRect(0, 0, W, H);
  const z = lerp(1.8, 1.0, eo(seg(u, .05, .25))); reset(); g.translate(CX + Math.sin(t * 40) * 14 * (1 - u), 900 + Math.cos(t * 33) * 12 * (1 - u)); g.scale(z, z); g.translate(-CX, -900);
  zface(t, u);
  if (u > .9) fill('#000');
};
// 18. the real zombies: a quiet jungle at night
function leaf(x, y, len, wid, ang, col = ['#2e6a3a', '#1a4424']) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -wid, len, 0); g.quadraticCurveTo(len * .5, wid, 0, 0); g.closePath(); fs(lg(0, -wid, 0, wid, col), 4);
  line([[0, 0], [len * .97, 0]], 4, 'rgba(160,220,160,.35)'); for (let k = 1; k < 9; k++) { const px = len * k / 9; for (const sg of [-1, 1]) curve([px, 0], [px + len * .05, sg * wid * .25], [px + len * .1, sg * wid * .55 * Math.sin(Math.PI * k / 9)], 2, 'rgba(160,220,160,.25)'); }
  g.restore();
}
S.hookback = (t, u) => {
  const tz = wordT('l17', 'zombie');
  cam(lerp(540, 640, ss(seg(t, tz - .2, LN.l17.t1))), lerp(950, 1020, ss(seg(t, tz - .2, LN.l17.t1))), lerp(1.0, 1.5, ss(seg(t, tz - .2, LN.l17.t1 + .3))));
  grad('#030a08', '#0a1a14', -500, 2300); const back_ = keep();
  for (let i = 0; i < 18; i++) leaf(-200 + hash(i * 3.3) * 1500, 300 + hash(i * 5.1) * 1300, 300 + 300 * hash(i), 70 + 60 * hash(i + 1), hash(i * 7) * TAU, i % 2 ? ['#1e4a2a', '#0e2a18'] : ['#2a5a34', '#143a20']);
  leaf(300, 1100, 620, 150, -.35);
  g.save(); g.translate(650, 1000); g.rotate(-.35); for (let k = 0; k < 3; k++) { circ(80 + k * 140, -40 + k * 20, 9, 'rgba(220,240,255,.7)'); circ(77 + k * 140, -43 + k * 20, 3, '#fff'); } g.restore();
  L(700, 700, 950, C.moon, .9, .16); L(640, 1020, 360, null, .8);
  lightPass('#1a3226'); back_();
  beam([[600, -300], [760, -300], [900, 1500], [380, 1500]], 680, -300, 640, 1500, C.moon, .1);
  for (let i = 0; i < 22; i++) { const x = hash(i * 2.3) * 1100 + Math.sin(t * .7 + i) * 40, y = 400 + hash(i * 4.1) * 1100 + Math.cos(t * .5 + i) * 30, a = .5 + .5 * Math.sin(t * 3 + i * 2); glow(x, y, 18, '200,255,120', .7 * a); circ(x, y, 2.5, `rgba(230,255,170,${a})`); }
  motes(0, 400, W, 1500, 30, t, '200,220,255', .3);
};
// 19. Ophiocordyceps: a fungus enters an ant, steers it up a leaf... and grows out of its head
function ant(x, y, s, t, o = {}) {
  const { walk = 0, jerk = 0, bite = 0, stalk = 0, ang = 0 } = o;
  g.save(); g.translate(x, y); g.rotate(ang + jerk * .12 * Math.sin(t * 13)); g.scale(s, s);
  for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) { const ph = walk * TAU + k * 2.1 + (sg > 0 ? Math.PI : 0), lx0 = -20 + k * 30, sw = Math.sin(ph) * 14 * (1 - bite); line([[lx0, 6], [lx0 + sw + sg * 4 - 10, 34], [lx0 + sw * 1.5 + (k - 1) * 18, 62]], 5, '#1a0e0a'); }
  ell(-70, 0, 46, 30, .1); fs(rg(-80, -12, 4, 50, ['#5a3020', '#2a140c', '#100604']), 3); for (let k = 0; k < 3; k++) curve([-100 + k * 22, -24], [-94 + k * 22, 0], [-100 + k * 22, 24], 2, 'rgba(255,200,160,.15)');
  ell(-14, 0, 22, 16); fs(rg(-18, -6, 2, 24, ['#5a3020', '#2a140c']), 3);
  ell(18, -6, 28, 18, -.2); fs(rg(14, -12, 2, 30, ['#6a3424', '#2a140c']), 3);
  ell(52, -14, 24, 22); fs(rg(46, -22, 2, 26, ['#6a3424', '#1a0a06']), 3); circ(60, -20, 6, '#0a0606'); circ(58, -22, 2, 'rgba(255,255,255,.6)');
  for (const sg of [-1, 1]) { const ma = bite ? .1 : .5 + .2 * Math.sin(t * 6); line([[70, -6], [88, -6 + sg * 10 * ma], [96, -2 + sg * 2]], 4, '#1a0e0a'); }
  for (const sg of [-1, 1]) line([[56, -32], [74 + sg * 6, -64], [100 + sg * 10, -60 + Math.sin(t * 4 + sg) * 6]], 3, '#1a0e0a');
  if (stalk > 0) { const L2 = 230 * stalk; g.beginPath(); g.moveTo(48, -30); g.bezierCurveTo(40, -30 - L2 * .4, 70, -30 - L2 * .7, 52, -30 - L2); g.strokeStyle = '#8a6a3a'; g.lineWidth = 9; g.lineCap = 'round'; g.stroke(); g.strokeStyle = 'rgba(255,230,170,.5)'; g.lineWidth = 3; g.stroke();
    if (stalk > .7) { const k = (stalk - .7) / .3; ell(52, -30 - L2, 12 * k + 2, 18 * k + 2); fs(rg(50, -34 - L2, 1, 20, ['#ffd08a', '#c8742a']), 3); glow(52, -30 - L2, 70 * k, '255,190,90', .6 * k); } }
  g.restore();
}
S.ant = (t, u) => {
  const Ln = LN.l18, tf = wordT('l18', 'fungus'), tk = wordT('l18', 'kinokontrol'), tu = wordT('l18', 'ulo'), p = seg(t, tk - .2, tu - .3);
  cam(lerp(520, 660, p), lerp(1150, 820, p), lerp(1.25, 1.45, seg(u, 0, span('l18'))));
  grad('#050c08', '#0c1a12', -500, 2300); const back_ = keep();
  for (let i = 0; i < 8; i++) leaf(-300 + hash(i * 3.3) * 1600, 200 + hash(i * 5.1) * 1600, 400, 110, hash(i * 7) * TAU, ['#14301c', '#0a1e10']);
  line([[300, 1700], [520, 1180], [640, 700]], 26, '#2a4a24'); line([[300, 1700], [520, 1180], [640, 700]], 8, 'rgba(160,220,140,.3)');
  leaf(640, 700, 520, 160, -.5, ['#3a7a44', '#1e4a28']);
  const ax = p < 1 ? lerp(470, 640, p) : 650, ay = p < 1 ? lerp(1330, 720, p) : 735;
  ant(ax, ay, 1.7, t, { walk: t * (t > tk ? 2.6 : 1.6), jerk: t > tk ? 1 : 0, bite: t > tu - .3 ? 1 : 0, stalk: seg(t, tu, Ln.t1 + .2), ang: p < 1 ? -1.25 : -.3 });
  L(620, 800, 700, C.moon, .9, .12); L(ax, ay, 360, '255,200,120', t > tu ? .9 : .7, t > tu ? .25 : .05);
  lightPass('#1a2e22'); back_();
  if (t > tf - .2) for (let i = 0; i < 26; i++) { const sp = (t - tf + i * .07) * .6 % 1, sx = lerp(900 - hash(i) * 600, ax, Math.min(1, sp * 1.4)), sy = lerp(400 + hash(i * 3) * 400, ay, Math.min(1, sp * 1.4)); glow(sx, sy, 16, '200,255,140', .5 * (1 - sp)); circ(sx, sy, 2.5, 'rgba(220,255,170,.8)'); }
  if (t > tu + .6) for (let i = 0; i < 30; i++) { const sp = ((t - tu - .6) * .5 + i / 30) % 1, a = hash(i) * TAU; const sx = ax + 20 + Math.cos(a) * sp * 380, sy = ay - 260 + Math.sin(a) * sp * 300 - sp * 80; glow(sx, sy, 14, '255,200,110', .6 * (1 - sp)); }
};
// 20. rabies under the microscope: bullet-shaped viruses; they shy from water; spread by a bite
S.rabies = (t, u) => {
  const tw = wordT('l19', 'tubig'), tk = wordT('l19', 'kagat');
  cam(540, 930, lerp(1.1, 1.0, eo(seg(u, 0, 1))));
  grad('#05050a', '#0a0a14', -500, 2300);
  g.save(); g.beginPath(); g.arc(540, 930, 400, 0, TAU); g.clip(); g.fillStyle = rg(540, 930, 40, 420, ['#2a0a18', '#160610', '#08030a']); g.fillRect(100, 500, 900, 900);
  for (let i = 0; i < 7; i++) { const cx = 300 + hash(i * 3.1) * 480, cy = 640 + hash(i * 5.7) * 560; circ(cx, cy, 90 + 50 * hash(i), 'rgba(255,120,160,.06)'); circ(cx, cy, 90 + 50 * hash(i), 'rgba(255,140,170,.18)', 3); circ(cx + 10, cy - 8, 18, 'rgba(255,140,170,.15)'); }
  const dropOn = t > tw ? eo(seg(t, tw, tw + .5)) : 0, dx = 540, dyy = lerp(500, 900, dropOn);
  for (let i = 0; i < 16; i++) {
    let vx = 300 + hash(i * 7.7) * 480 + Math.sin(t * .6 + i) * 30, vy = 660 + hash(i * 2.9) * 540 + Math.cos(t * .5 + i * 2) * 26;
    if (dropOn > 0) { const ddx = vx - dx, ddy = vy - 900, dd = Math.hypot(ddx, ddy) + 1, push = 220 * dropOn * Math.exp(-dd / 260); vx += ddx / dd * push; vy += ddy / dd * push; }
    g.save(); g.translate(vx, vy); g.rotate(hash(i) * TAU + t * .3 * (i % 2 ? 1 : -1)); g.shadowColor = 'rgba(255,60,90,.9)'; g.shadowBlur = 16;
    g.beginPath(); g.moveTo(-34, -12); g.lineTo(18, -12); g.arc(18, 0, 12, -Math.PI / 2, Math.PI / 2); g.lineTo(-34, 12); g.closePath(); g.fillStyle = 'rgba(255,90,110,.35)'; g.fill(); g.strokeStyle = '#ff6a80'; g.lineWidth = 3; g.stroke(); g.shadowBlur = 0;
    for (let k = 0; k < 7; k++) { line([[-30 + k * 8, -12], [-30 + k * 8, -18]], 2, 'rgba(255,140,160,.8)'); line([[-30 + k * 8, 12], [-30 + k * 8, 18]], 2, 'rgba(255,140,160,.8)'); } g.restore();
  }
  if (dropOn > 0) { g.beginPath(); g.moveTo(dx, dyy - 70); g.bezierCurveTo(dx + 50, dyy - 10, dx + 44, dyy + 40, dx, dyy + 44); g.bezierCurveTo(dx - 44, dyy + 40, dx - 50, dyy - 10, dx, dyy - 70); g.fillStyle = 'rgba(82,180,255,.55)'; g.fill(); g.strokeStyle = '#9fe0ff'; g.lineWidth = 4; g.stroke(); circ(dx - 14, dyy, 8, 'rgba(255,255,255,.7)'); glow(dx, dyy, 160, C.cyan, .3); }
  if (t > tk) { const a = eo(seg(t, tk, tk + .3)); for (const sg of [-1, 1]) for (let k = 0; k < 7; k++) { const ang = Math.PI * (.15 + k * .7 / 6), r2 = 200; const px = 540 + Math.cos(ang) * r2 * 1.2, py = 930 + sg * (Math.sin(ang) * r2 * .5 - 30); g.save(); g.globalAlpha = a; g.shadowColor = 'rgba(255,30,50,1)'; g.shadowBlur = 20; ell(px, py, 12, 20, sg * (ang - Math.PI / 2) * .5); g.fillStyle = '#c4102a'; g.fill(); g.restore(); } }
  g.restore();
  circ(540, 930, 400, OL, 30); circ(540, 930, 400, lg(140, 530, 940, 1330, ['#9aa0aa', '#4a5058']), 16); circ(540, 930, 386, 'rgba(255,255,255,.12)', 3);
};
// 21. the twist: it isn't the zombie that kills you; it's the brain that says "this isn't real"
S.twist = (t, u) => {
  const tu = wordT('l20', 'utak'), tz = wordT('l20', 'zombie'), crack = seg(t, tu, tu + .5);
  cam(540, 960, lerp(1.0, 1.1, seg(u, 0, span('l20'))));
  grad('#0a0c12', '#05060a', -500, 2300);
  g.save(); rr(140, 520, 800, 520, 30); g.clip(); g.fillStyle = lg(0, 520, 0, 1040, ['#05070c', '#0e1218']); g.fillRect(140, 520, 800, 520); shambler(780, 1040, 460, t, { alpha: .35 + .5 * ss(seg(t, tz - .2, tz + .4)), col: 'rgba(150,170,175,.4)', eyes: .9 }); g.restore();
  rr(140, 520, 800, 520, 30); g.strokeStyle = OL; g.lineWidth = 20; g.stroke(); g.strokeStyle = '#8a9298'; g.lineWidth = 11; g.stroke();
  const back_ = keep();
  shape(() => { rr(310, 1250, 460, 420, 140); }, 310, 770, HOODC, { lx: 1, rim: 'rgba(255,90,100,.5)', rw: 8, ol: 6 });
  face(540, 1060, 220, { t, eyes: 'wide', look: -.2, lookY: -.5, sweat: .8, tired: .3, lx: 1, rim: 'rgba(255,90,100,.55)' });
  L(540, 1060, 420, C.warm, .8, .08); L(540, 650, 400, crack > 0 ? C.red : C.cyan, .7, .18);
  lightPass('#1e1e2a'); back_();
  const b = back(seg(u, .2, .5), 1.6); if (b > 0) { g.save(); g.translate(540, 700); g.scale(b, b); for (let k = 0; k < 3; k++) circ(-30 + k * 30, 210 + k * 50, 10 + k * 6, 'rgba(230,240,255,.85)');
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.arc(Math.cos(a) * 280, Math.sin(a) * 110, 60, a - 1.2, a + 1.2); } g.closePath(); g.fillStyle = 'rgba(235,240,250,.94)'; g.fill();
    text(TX.bias, 0, 6, 76, '#1a1830', 'Anton');
    if (crack > 0) { g.strokeStyle = '#c4102a'; g.lineWidth = 6; g.lineCap = 'round'; for (let k = 0; k < 4; k++) { const pts = [[-30 + k * 20, -110]]; for (let j = 1; j < 6; j++) pts.push([pts[j - 1][0] + (hash(k * 9 + j) - .5) * 60, -110 + j * 44 * crack]); path(pts); g.stroke(); } }
    g.restore(); }
};
// 22. POV: where you are right now, and the nearest door. The handle turns.
S.pov = (t, u) => {
  const tp = wordT('l21', 'pinto');
  cam(540, 930, lerp(1.25, 1.45, seg(u, 0, span('l21'))));
  g.drawImage(TEX.wall, -500, -560); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#6a6a88'; g.fillRect(-500, -560, 1800, 1810); g.restore(); const back_ = keep();
  path([[-500, -500], [400, 560], [400, 1260], [-500, 2300]]); g.closePath(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); path([[1580, -500], [680, 560], [680, 1260], [1580, 2300]]); g.closePath(); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
  path([[400, 1260], [680, 1260], [1580, 2300], [-500, 2300]]); g.closePath(); g.fillStyle = '#2a1e18'; g.fill();
  rr(430, 640, 220, 600, 6); fs(lg(430, 0, 650, 0, ['#5a3a2a', '#3a2418']), 6); rr(455, 670, 170, 240, 4); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 4; g.stroke(); rr(455, 950, 170, 260, 4); g.stroke();
  const turn = t > tp ? .6 * eo(seg(t, tp, tp + .8)) : 0; g.save(); g.translate(615, 960); g.rotate(turn); rr(-6, -6, 34, 12, 6); fs('#c9a45a', 2); g.restore(); circ(615, 960, 9, '#c9a45a');
  g.fillStyle = `rgba(255,220,160,${.5})`; g.fillRect(440, 1236, 200, 6); if (t > tp + .4) { g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(500, 1236, 70, 6); }
  L(540, 900, 640, null, .75); L(540, 1240, 220, C.warm, .8, .25);
  lightPass('#262840'); back_();
  g.save(); g.shadowColor = 'rgba(109,255,168,1)'; g.shadowBlur = 24; rr(430, 640, 220, 600, 6); g.strokeStyle = `rgba(109,255,168,${.5 + .3 * Math.sin(t * 4)})`; g.lineWidth = 5; g.stroke(); g.restore();
  g.setLineDash([30, 26]); g.lineDashOffset = -t * 60; path([[540, 2100], [540, 1260]]); g.strokeStyle = 'rgba(109,255,168,.6)'; g.lineWidth = 10; g.stroke(); g.setLineDash([]);
};
// 23. the easter egg: the train again, frozen; a magnifier sweeps it; "NASAAN?"
const CV2 = mk(W, H), g2 = CV2.getContext('2d');
S.egg = (t, u) => {
  const t0 = LN.l01.t0 + .3; ZK = 1;
  S.train(t0, t0, 0); reset(); g2.globalCompositeOperation = 'copy'; g2.drawImage(cv, 0, 0);
  g.fillStyle = 'rgba(5,6,16,.45)'; g.fillRect(0, 0, W, H);
  const mx = CX + Math.sin(u * 1.8) * 300, my = 860 + Math.cos(u * 1.3) * 220;
  g.save(); g.beginPath(); g.arc(mx, my, 150, 0, TAU); g.clip(); g.translate(mx, my); g.scale(1.6, 1.6); g.translate(-mx, -my); g.drawImage(CV2, 0, 0); g.restore();
  reset(); g.fillStyle = rg(mx - 50, my - 60, 10, 150, ['rgba(255,255,255,.18)', 'rgba(255,255,255,0)']); g.beginPath(); g.arc(mx, my, 150, 0, TAU); g.fill();
  circ(mx, my, 150, OL, 24); circ(mx, my, 150, lg(mx - 150, my - 150, mx + 150, my + 150, ['#e8e4dc', '#8a8478']), 12); limb([[mx + 110, my + 110], [mx + 240, my + 240]], 30, ['#9a6a3a', '#6a4424', '#3a2210'], -1);
  g.save(); g.shadowColor = 'rgba(255,170,80,.9)'; g.shadowBlur = 34; text(TX.where, CX, 330, 170, YEL, 'Anton', 'center', 16); g.restore();
  const b = back(seg(t, wordT('l22', 'Comment'), wordT('l22', 'Comment') + .3), 2);
  if (b > 0) { g.save(); g.translate(CX, 1240); g.scale(b, b); glass(-220, -80, 440, 160, 40, 'rgba(255,255,255,.6)', 4, 'rgba(255,255,255,.5)'); path([[-120, 78], [-160, 140], [-60, 78]]); g.closePath(); g.fillStyle = 'rgba(8,10,22,.78)'; g.fill(); g.save(); g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 20; text('0:??', 0, 4, 100, '#ff6a7a', 'Anton'); g.restore(); g.restore(); }
};
// 24. tag the one you'd bring: two survivors back to back, the dead closing in
S.cta = (t, u) => {
  cam(CX, 940, lerp(1.06, 1, eo(seg(u, 0, 1))));
  grad('#06070e', '#141026', -500, 1150); g.drawImage(TEX.city, 0, 0, 2400, 900, -500, 300, 2100, 850); g.fillStyle = '#16141e'; g.fillRect(-500, 1150, 2100, 900); const back_ = keep();
  for (let i = 0; i < 6; i++) { const sg = i % 2 ? 1 : -1, k = Math.floor(i / 2); shambler(540 + sg * (330 + k * 110 - u * 20), 1180 + k * 26, 380 - k * 50, t, { eyes: 1, ph: i, rim: 'rgba(255,80,100,.35)' }); }
  person(450, 1420, 600, { t, arms: 'out', eyes: 'wide', look: -1, lx: -1, rim: 'rgba(255,179,87,.6)' });
  person(640, 1420, 600, { t, hood: REDHOOD, arms: 'down', eyes: 'wide', look: 1, lx: 1, rim: 'rgba(82,216,255,.5)' });
  line([[760, 1280], [880, 1080]], 18, OL); line([[760, 1280], [880, 1080]], 12, '#8a6a4a');
  L(540, 1100, 520, C.amb, .9, .12); L(300, 1000, 360, C.red, .6, .2); L(800, 1000, 360, C.red, .6, .2);
  lightPass('#1e1a2c'); back_();
  beam([[330, 1060], [350, 1040], [-200, 900], [-200, 1200]], 340, 1050, -200, 1050, C.warm, .2);
  const k = back(seg(u, 0, .3), 1.8);
  reset(); g.save(); g.translate(CX, 420); g.scale(k, k); glass(-430, -150, 860, 300, 36, 'rgba(255,179,87,.6)', 3, 'rgba(255,179,87,.7)'); text(TX.share[0], 0, -50, 100, '#fff', 'Anton'); g.save(); g.shadowColor = 'rgba(255,170,80,.9)'; g.shadowBlur = 26; text(TX.share[1], 0, 62, 80, YEL, 'Anton'); g.restore(); g.restore();
};
// 25. the loop: back on the train... his finger moves (= frame 1)
S.loop = (t, u) => {
  const tw = u > .55 ? Math.max(0, Math.sin((u - .55) * 9)) : 0;
  cam(540, 900, 1.0, Math.sin(t * 1.1) * .006);
  const post = trainCar(t); passengers(t, { slump: 1, twitch: tw });
  L(720, 1000, 330, null, .5);
  lightPass('#2c3a44'); post();
};

function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .22; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }

// ---------- frame ----------
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }   // same scene continues: no restart
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
const NOPUNCH = ['train', 'hand', 'snap', 'scare', 'doors', 'map', 'sim', 'egg', 'cta', 'pov', 'loop'];
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
  if (sh[2] === 'train') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .55, .75)));
  counter(t);
  if (!['scare', 'egg', 'cta'].includes(sh[2])) statCard(t);
  if (BLACK) { reset(); g.fillStyle = `rgba(0,0,0,${BLACK})`; g.fillRect(0, 0, W, H); }
  if (!['scare', 'cta'].includes(sh[2])) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('80px Creepster')]).then(() => true);

// Blackout (What if the whole world lost power?): a dark, painterly "what if" reel, 1080x1920. Deterministic in t: window.renderAt(t).
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
// Look and engine from ../puyat and ../huling-tren: every scene is drawn in its true colours, then darkened, and only the lights
// (candles, phone screens, fire, the aurora, a generator's red lamp) bring the colour back. Smooth camera, no glitches.
const W = 1080, H = 1920, CX = W / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'); let g = cv.getContext('2d');
const LANG = new URLSearchParams(location.search).get('lang') || 'tl';     // tl (default) | en
const SUF = LANG === 'tl' ? '' : '.' + LANG;
const TL = await (await fetch(`timeline${SUF}.json`)).json();
const ANCH = SUF ? await (await fetch(`anchors${SUF}.json`)).json() : {};
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
const TX = {
  tl: { t1: 'PAANO KUNG MAWALAN NG', t2: 'KURYENTE ANG MUNDO?', stamp: 'MUNTIK NANG MANGYARI', nosvc: 'WALANG SIGNAL', calling: 'TUMATAWAG...', mom: 'MAMA', fail: 'HINDI MAKONTAK', atm: 'OFFLINE', closed: 'SARADO',
        sold: 'UBOS NA', gen: 'GENERATOR', fuel: 'GASOLINA', truth: 'ANG TOTOO', meet: 'TAGPUAN', battery: 'ILANG % NA LANG?', last: 'ILANG ARAW KA TATAGAL?', share: ['I-SHARE MO', 'SA KASAMA MO'],
        alert: ['EMERGENCY ALERT', 'SOLAR STORM WARNING'], one8: '1 SA 8', kit: ['TUBIG', 'FLASHLIGHT', 'DE-LATA', 'CASH'], days: 'ARAW', nine: '9 ARAW', you: 'IKAW', earth: 'EARTH', storm: 'SOLAR STORM', years: 'SA LOOB NG 10 TAON' },
  en: { t1: 'WHAT IF THE WHOLE WORLD', t2: 'LOST POWER?', stamp: 'IT ALMOST HAPPENED', nosvc: 'NO SERVICE', calling: 'CALLING...', mom: 'MOM', fail: 'NO ANSWER', atm: 'OFFLINE', closed: 'CLOSED',
        sold: 'SOLD OUT', gen: 'GENERATOR', fuel: 'FUEL', truth: 'THE TRUTH', meet: 'MEETING POINT', battery: 'WHAT % ARE YOU AT?', last: 'HOW MANY DAYS WOULD YOU LAST?', share: ['SEND THIS', "TO YOUR PERSON"],
        alert: ['EMERGENCY ALERT', 'SOLAR STORM WARNING'], one8: '1 IN 8', kit: ['WATER', 'FLASHLIGHT', 'CANNED FOOD', 'CASH'], days: 'DAYS', nine: '9 DAYS', you: 'YOU', earth: 'EARTH', storm: 'SOLAR STORM', years: 'EVERY 10 YEARS' },
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
  const on = t >= LN.l06.t0 && t < LN.l13.t0; if (!on) return;
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
const REDCAP = ['hook', 'dark', 'hospital', 'miss'];
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



// ---------- places ----------
const S = {};
C.candle = '255,170,70'; C.aur = '90,255,170'; C.aur2 = '255,90,140'; C.sun = '255,190,90';
const RIMC = 'rgba(190,210,255,.5)';
// the skyline at night: lit windows that go dark column by column (dark(k) = 0..1 for column k)
function skyline(t, o = {}) {
  const { dark = () => 0, stars = .4, moonA = 1 } = o;
  g.fillStyle = lg(0, -400, 0, 1500, ['#03040e', '#0b1030', '#1c1a44', '#2a1e44']); g.fillRect(-600, -600, 2300, 2300);
  for (let i = 0; i < 160; i++) star(-400 + hash(i * 3.1) * 1900, -300 + hash(i * 7.3) * 1100, 1.2 + 2.4 * hash(i), `rgba(255,255,255,${stars * (.4 + .5 * Math.sin(t * 1.4 + i))})`);
  if (moonA) { g.save(); g.globalAlpha = moonA; fullMoon(820, 140, 46); g.restore(); }
  g.drawImage(TEX.city, 0, 0, 2400, 900, -500, 520, 2100, 900);
  g.drawImage(TEX.city, 700, 100, 1700, 800, -560, 760, 2200, 1000);
  for (let k = 0; k < 18; k++) { const d = dark(k); if (d <= 0) continue; g.save(); g.globalAlpha = d * .9; g.fillStyle = '#04050c'; g.fillRect(-560 + k * 125, 520, 126, 1300); g.restore(); }
  g.fillStyle = lg(0, 1500, 0, 1800, ['rgba(4,4,12,0)', 'rgba(4,4,12,1)']); g.fillRect(-600, 1500, 2300, 500);
}
// a dark room wall with a window onto the dead city
function roomWall(t, o = {}) {
  const { win = 1, lit = 0 } = o, back_ = keep();
  g.drawImage(TEX.wall, -500, -500); g.fillStyle = '#2a3150'; g.fillRect(-500, 1260, 2100, 900);
  if (win) {
    g.save(); rr(300, 260, 520, 640, 10); g.clip(); g.translate(300, 260); g.scale(.5, .5); skyline(t, { dark: () => 1 - lit, stars: .8 }); g.restore();
    rr(300, 260, 520, 640, 10); g.strokeStyle = OL; g.lineWidth = 28; g.stroke(); g.strokeStyle = '#4a4058'; g.lineWidth = 18; g.stroke(); line([[560, 260], [560, 900]], 14, '#4a4058'); line([[300, 580], [820, 580]], 12, '#4a4058');
  }
  return back_;
}
function candle(x, y, s, t, o = {}) {
  const fl = 1 + .08 * Math.sin(t * 13) + .05 * Math.sin(t * 29);
  rr(x - 16 * s, y - 70 * s, 32 * s, 70 * s, 6 * s); fs(lg(x - 16 * s, 0, x + 16 * s, 0, ['#f4ecd8', '#c8bca0']), 3);
  line([[x, y - 70 * s], [x, y - 82 * s]], 3, '#2a2420');
  L(x, y - 100 * s, 420 * s * fl, C.candle, .95, .3);
  return () => { g.save(); g.translate(x, y - 96 * s); g.scale(fl, fl); g.beginPath(); g.moveTo(0, -30 * s); g.quadraticCurveTo(13 * s, -4 * s, 0, 12 * s); g.quadraticCurveTo(-13 * s, -4 * s, 0, -30 * s); g.fillStyle = lg(0, -30 * s, 0, 12 * s, ['#fff6d0', '#ffb040', '#ff7020']); g.fill(); g.restore(); glow(x, y - 96 * s, 160 * s, C.candle, .6); };
}
function phoneHeld(x, y, s, scr, o = {}) {   // a phone seen from the front, screen colour scr (null = off)
  g.save(); g.translate(x, y); g.scale(s, s); rr(-70, -140, 140, 280, 20); fs('#101016', 4); rr(-60, -128, 120, 256, 12); g.fillStyle = scr || '#05050a'; g.fill();
  if (o.text) { text(o.text, 0, -10, o.size || 22, o.col || '#ff6a7a', 'Anton'); }
  g.restore();
}
// ---------- shots ----------
// 1. the hook: the city at night... every light goes out, block by block
S.hook = (t, u) => {
  const tm = wordT('l01b', 'mamamatay');
  cam(540, 900, lerp(1.18, 1.0, eo(seg(u, 0, 1.6))) * (t > tm ? 1 + .06 * eo(seg(t, tm, tm + .5)) : 1), 0, t > tm && t < tm + .8 ? 12 * (1 - seg(t, tm, tm + .8)) : 0, t);
  const dark = k => ss(seg(t, tm + .04 * Math.abs(k - 8) * 1.4, tm + .1 + .04 * Math.abs(k - 8) * 1.4)), back_ = keep();
  skyline(t, { dark });
  const lit = 1 - ss(seg(t, tm, tm + .8)), pulse = .5 + .5 * Math.sin(t * 9);
  person(540, 2080, 1150, { t, arms: 'phone', eyes: t > tm ? 'wide' : 'open', look: .35, lookY: .2, sweat: t > LN.l01b.t0 ? .6 : 0, tired: .2, lx: 1, rim: t > tm ? 'rgba(140,170,255,.5)' : 'rgba(255,90,110,.6)' });
  L(540, 1050, 1500, C.amb, .95 * lit + .08, .2 * lit); L(540, 700, 1100, '255,150,110', .5 * lit, .1);
  if (t < tm + .3) L(640, 1180, 420, C.red, (.6 + .4 * pulse) * lit, .3 * lit); else L(820, 140, 900, C.moon, .5, .1);
  L(820, 140, 600, C.moon, .8, .12);
  lightPass('#2c2c5a'); back_();
  if (t > tm - .05 && t < tm + .5) { const p = seg(t, tm - .05, tm + .5); glow(540, 1150, 900, '160,200,255', .7 * (1 - p)); }
  // frame 1: an emergency alert slides down over the city, pulsing red
  const ak = eo(seg(t, 0, .35)) * (1 - ss(seg(t, tm + .6, tm + 1.0)));
  if (ak > 0) { reset(); g.save(); g.translate(CX, lerp(420, 640, ak)); g.globalAlpha = ak; glass(-470, -110, 940, 220, 36, `rgba(255,49,80,${.6 + .4 * pulse})`, 5, `rgba(255,49,80,${.5 + .5 * pulse})`);
    g.save(); g.translate(-370, 0); path([[0, -62], [64, 52], [-64, 52]]); g.closePath(); g.fillStyle = RED; g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 30 * pulse; g.fill(); g.shadowBlur = 0; text('!', 0, 14, 72, '#1a0006', 'Anton'); g.restore();
    text(TX.alert[0], 60, -40, 46, '#ff8a96', 'Anton'); text(TX.alert[1], 60, 30, 66, '#fff', 'Anton'); g.restore(); }
  if (t > tm) { reset(); g.fillStyle = `rgba(80,0,10,${.25 * (1 - seg(t, tm, tm + 1.5))})`; g.fillRect(0, 0, W, H); }
};
// 2. it almost happened: a file, a red stamp
S.stamp = (t, u) => {
  const tmu = wordT('l02', 'Muntik'), k = t > tmu ? eo(seg(t, tmu, tmu + .14)) : 0;
  cam(540, 960, lerp(1.05, 1.15, seg(u, 0, span('l02'))), 0, t > tmu && t < tmu + .4 ? 8 * (1 - seg(t, tmu, tmu + .4)) : 0, t);
  const back_ = keep(); g.fillStyle = '#2a1c16'; g.fillRect(-600, -600, 2300, 2400);
  for (let i = 0; i < 9; i++) line([[-600, -200 + i * 260], [1700, -150 + i * 260]], 4, 'rgba(0,0,0,.3)');
  g.save(); g.translate(540, 980); g.rotate(-.04); cshadow(20, 30, 420, 560, .6); rr(-380, -520, 760, 1040, 8); fs('#e8dcc0', 4);
  rr(-380, -560, 260, 60, 8); fs('#d8c8a0', 3); text('NASA · 2012', 0, -440, 54, '#3a2a20', 'Anton');
  for (let i = 0; i < 12; i++) { rr(-300, -340 + i * 58, 520 + 80 * hash(i), 14, 7); g.fillStyle = 'rgba(40,30,20,.45)'; g.fill(); }
  circ(0, 380, 120, 'rgba(255,170,60,.2)'); for (let k2 = 0; k2 < 12; k2++) { const a = k2 / 12 * TAU; line([[Math.cos(a) * 130, 380 + Math.sin(a) * 130], [Math.cos(a) * 170, 380 + Math.sin(a) * 170]], 6, 'rgba(255,150,50,.5)'); } circ(0, 380, 90, 'rgba(255,180,70,.6)');
  if (k > 0) { g.save(); g.translate(0, -60); g.rotate(-.18); g.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); g.globalAlpha = k * .92; rr(-330, -80, 660, 160, 10); g.strokeStyle = '#d42a38'; g.lineWidth = 12; g.stroke(); text(TX.stamp, 0, 6, 76, '#d42a38', 'Anton'); g.restore(); }
  g.restore();
  L(540, 700, 900, C.amb, 1, .2); lightPass('#3a2a3a'); back_();
  const red = ss(seg(t, wordT('l02', 'ulit') - .2, wordT('l02', 'ulit') + .5)); if (red) { reset(); g.fillStyle = `rgba(120,0,20,${.35 * red})`; g.fillRect(0, 0, W, H); }
};
// 3. 9 PM: you on your phone in bed... the screen dies
S.phone = (t, u) => {
  const tw = wordT('l03', 'wala'), off = t > tw - .25;
  cam(540, 900, lerp(1.0, 1.12, seg(u, 0, span('l03'))));
  const back_ = roomWall(t, { lit: off ? 0 : 1 });
  person(540, 1500, 900, { t, sit: 1, arms: 'phone', eyes: off ? 'wide' : 'open', look: .3, tired: .3, lx: 1, rim: RIMC });
  if (!off) { L(640, 620, 520, C.cyan, .9, .25); L(560, 580, 1500, null, .45); } else L(560, 580, 500, C.moon, .25);
  lightPass('#262a4a'); back_();
  if (!off) glow(650, 640, 140, C.cyan, .4);
  BLACK = off ? .55 * (1 - seg(t, tw + .3, tw + 1.2)) + .25 : 0;
};
// 4. no lights, no signal: the whole city is dead
S.dark = (t, u) => {
  cam(540, 900, lerp(1.12, 1.0, eo(seg(u, 0, 1.5))));
  const back_ = roomWall(t, { lit: 0 });
  person(540, 1560, 1000, { t, arms: 'phone', eyes: 'wide', look: .4, sweat: .6, tired: .2, lx: 1, rim: 'rgba(140,170,255,.55)' });
  L(650, 560, 420, C.cyan, .6, .2); L(560, 600, 500, C.moon, .4, .08);
  lightPass('#1e2242'); back_();
  reset(); const k = back(seg(u, .3, .6), 1.8); g.save(); g.translate(CX, 380); g.scale(k, k); glass(-300, -80, 600, 160, 30, 'rgba(255,49,80,.8)', 4, 'rgba(255,49,80,.8)');
  for (let i = 0; i < 4; i++) { rr(-240 + i * 30, 30 - i * 22, 20, 22 + i * 22, 4); g.fillStyle = 'rgba(255,255,255,.18)'; g.fill(); } line([[-250, -50], [-120, 40]], 6, '#ff5068'); text(TX.nosvc, 60, 4, 64, '#ff6a7a', 'Anton'); g.restore();
};
// 5. the cause: a solar storm leaps off the sun toward the Earth
S.sun = (t, u) => {
  const ts = wordT('l05', 'Solar'), th = wordT('l05', 'diretso'), fly = seg(t, ts, th + .3);
  cam(540, 900, lerp(1.0, 1.08, seg(u, 0, span('l05'))), 0, t > th && t < th + .6 ? 8 * (1 - seg(t, th, th + .6)) : 0, t);
  grad('#02020a', '#060418', -600, 2400); for (let i = 0; i < 200; i++) circ(-400 + hash(i * 3.3) * 1900, -500 + hash(i * 1.7) * 2700, 1 + 1.8 * hash(i), `rgba(255,255,255,${.3 + .4 * hash(i + 2)})`);
  const sx = 260, sy = 420; glow(sx, sy, 900, C.sun, .5); circ(sx, sy, 300, rg(sx - 60, sy - 60, 40, 300, ['#fff6c8', '#ffb040', '#e85a10']));
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + t * .05, r0 = 300, h_ = 30 + 40 * Math.sin(t * 2 + i * 1.7) ** 2; curve([sx + Math.cos(a) * r0, sy + Math.sin(a) * r0], [sx + Math.cos(a + .05) * (r0 + h_ * 1.6), sy + Math.sin(a + .05) * (r0 + h_ * 1.6)], [sx + Math.cos(a + .1) * r0, sy + Math.sin(a + .1) * r0], 8, `rgba(255,${150 + 60 * hash(i)},60,.6)`); }
  if (t > ts - .4) { const p = eo(fly); g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 5; k++) { const r = 300 + p * 1250 - k * 60; if (r < 300) continue; g.beginPath(); g.arc(sx, sy, r, .55, 1.25); g.strokeStyle = `rgba(255,${160 - k * 20},${80 - k * 10},${(.7 - k * .12) * (1 - .4 * p)})`; g.lineWidth = 40 - k * 6; g.stroke(); } for (let k = 0; k < 60; k++) { const a = .55 + hash(k) * .7, r = 300 + (p * 1250) * hash(k * 3); circ(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 3 + 4 * hash(k + 1), 'rgba(255,200,120,.7)'); } g.restore(); }
  const ex = 760, ey = 1460, hit = t > th ? seg(t, th, th + 1.2) : 0;
  for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(ex - 40, ey, 160 + k * 46, 110 + k * 30, 0, Math.PI * .55, Math.PI * 1.45); g.strokeStyle = `rgba(${hit ? '255,120,160' : '120,170,255'},${.25 + .3 * hit})`; g.lineWidth = 4; g.stroke(); }
  circ(ex, ey, 130, rg(ex - 40, ey - 40, 10, 130, ['#8ac8ff', '#2a6ab0', '#0a2a5a'])); for (const [a, b, r] of [[-.4, -.3, .5], [.3, .2, .4], [-.1, .5, .3]]) { ell(ex + a * 130, ey + b * 130, r * 100, r * 60, a); g.fillStyle = 'rgba(80,160,90,.85)'; g.fill(); }
  g.save(); g.beginPath(); g.arc(ex, ey, 130, 0, TAU); g.clip(); g.fillStyle = 'rgba(0,0,10,.55)'; g.beginPath(); g.arc(ex + 80, ey + 40, 160, 0, TAU); g.fill(); g.restore();
  if (hit) glow(ex, ey, 380, C.aur, .5 * Math.sin(Math.PI * hit));
  reset(); tag(TX.storm, 540, 860, AMB, C.amb, back(seg(t, ts, ts + .3), 1.8) * (1 - ss(seg(t, th, th + .3))), 1);
};
// 6. day 1: candlelight; no internet; you can't reach your family
S.day1 = (t, u) => {
  const tp = wordT('l06', 'pamilya');
  cam(540, 920, lerp(1.0, 1.15, seg(u, 0, span('l06'))));
  const back_ = roomWall(t, { lit: 0 }); rr(120, 1180, 840, 40, 8); fs('#5a3a28', 4); const c1 = candle(220, 1180, 1.3, t);
  person(560, 1640, 1050, { t, arms: 'phone', eyes: t > tp ? 'wide' : 'open', look: -.3, sweat: .4, tired: .4, lx: -1, rim: 'rgba(255,170,90,.6)' });
  L(660, 560, 300, C.cyan, .5, .15);
  lightPass('#1c1a30'); back_(); c1();
  reset(); const pk = back(seg(u, .4, .7), 1.6); if (pk > 0) { g.save(); g.translate(800, 560); g.scale(pk, pk); glass(-180, -110, 360, 220, 30, t > tp ? 'rgba(255,49,80,.8)' : 'rgba(82,216,255,.7)', 4, t > tp ? 'rgba(255,49,80,.8)' : 'rgba(82,216,255,.7)'); circ(0, -45, 32, t > tp ? '#5a1a24' : '#2a4a6a'); text(TX.mom, 0, 18, 42, '#fff', 'Anton'); text(t > tp ? TX.fail : TX.calling, 0, 70, 32, t > tp ? '#ff6a7a' : '#9fe8ff', 'Anton'); g.restore(); }
};
// 7. the ATMs are dead
S.atm = (t, u) => {
  const tm = wordT('l07', 'mailabas');
  cam(540, 900, lerp(1.1, 1.0, eo(seg(u, 0, 1.4))));
  const back_ = keep(); g.drawImage(TEX.brick, -400, -300, 1900, 2300); g.fillStyle = 'rgba(10,8,20,.45)'; g.fillRect(-400, -300, 1900, 2300);
  g.fillStyle = '#1a1a22'; g.fillRect(-400, 1450, 1900, 600);
  rr(330, 420, 420, 760, 20); fs(lg(330, 0, 750, 0, ['#5a5e68', '#8a8e98', '#4a4e58']), 6); rr(380, 480, 320, 240, 10); fs('#0a0c10', 5); text(TX.atm, 540, 600, 56, '#ff5068', 'Anton');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rr(420 + c * 90, 790 + r * 70, 70, 50, 8); fs('#3a3e48', 3); }
  rr(400, 1080, 280, 20, 6); fs('#0a0a10', 2);
  for (let i = 0; i < 7; i++) { const x = -120 + i * 200 + (i > 2 ? 200 : 0), h = 760 + 120 * hash(i); if (x > 250 && x < 830) continue; runner(x, 1600 + 20 * hash(i), h, 0, { alpha: .9, dir: x < 540 ? 1 : -1, lean: 0, rim: 'rgba(255,170,90,.35)' }); }
  person(540, 1720, 980, { t, arms: 'reach', eyes: 'wide', look: 0, lookY: -.3, sweat: .6, tired: .3, lx: 1, rim: 'rgba(255,170,90,.5)' });
  L(200, 300, 500, C.amb, .6, .2); L(540, 600, 300, C.red, .5 + .2 * Math.sin(t * 4), .2);
  lightPass('#22202e'); back_();
};
// 8. day 2: the fridge drips in the dark; the shops roll their shutters down
S.day2 = (t, u) => {
  const tn = wordT('l08', 'Sarado'), shop = t > tn - .2;
  cam(540, 900, shop ? lerp(1.0, 1.06, seg(t, tn, tn + 3)) : lerp(1.15, 1.0, eo(seg(u, 0, 1.2))));
  const back_ = keep();
  if (!shop) {
    g.drawImage(TEX.tiles, -300, -300, 1700, 1300); g.fillStyle = '#2a2a30'; g.fillRect(-300, 1000, 1700, 1200);
    rr(230, 120, 620, 1300, 30); fs(lg(230, 0, 850, 0, ['#b8c0c6', '#e8ecef', '#9aa2a8']), 6); rr(260, 150, 560, 600, 16); fs('#20262c', 4);
    for (let k = 0; k < 3; k++) { rr(280, 280 + k * 160, 520, 12, 4); fs('#8a9298', 0); } rr(300, 420, 120, 100, 14); fs('#7a8a6a', 3); rr(470, 400, 90, 120, 10); fs('#e8d0a0', 3); rr(600, 430, 160, 90, 20); fs('#c06a5a', 3);
    for (let k = 0; k < 4; k++) { const p = ((t * .7 + k / 4) % 1); circ(400 + k * 90, 760 + p * 640, 9 * (1 - p * .3), `rgba(170,210,255,${.8 * (1 - p)})`); } ell(540, 1460, 360, 40); g.fillStyle = 'rgba(140,180,220,.35)'; g.fill();
    L(540, 450, 600, null, .5); L(820, 200, 500, C.moon, .5, .1);
  } else {
    g.drawImage(TEX.brick, -400, -300, 1900, 2300); g.fillStyle = 'rgba(10,8,20,.4)'; g.fillRect(-400, -300, 1900, 2300);
    rr(140, 240, 800, 120, 10); fs('#3a2a5a', 5); text(TX.closed, 540, 302, 80, '#ffb357', 'Anton');
    const sh = eo(seg(t, tn - .1, tn + 1.4)); rr(160, 400, 760, 1000, 6); fs('#141018', 4);
    g.save(); rr(160, 400, 760, 1000, 6); g.clip(); for (let k = 0; k < 40; k++) { const y = 400 - 1000 + sh * 1000 + k * 25; rr(160, y, 760, 22, 4); fs(lg(0, y, 0, y + 22, ['#8a8e98', '#5a5e68']), 0); } g.restore();
    g.fillStyle = '#1a1a22'; g.fillRect(-400, 1400, 1900, 700);
    L(540, 300, 700, C.amb, .7, .2); L(540, 900, 900, null, .4);
  }
  lightPass('#22222e'); back_();
};
// 9. no water either: the pumps run on electricity
S.faucet = (t, u) => {
  cam(540, 900, lerp(1.0, 1.1, seg(u, 0, span('l09'))));
  const back_ = keep(); g.drawImage(TEX.tiles, -300, -300, 1700, 2300); g.fillStyle = '#c8ccd0'; g.fillRect(-300, 1150, 1700, 80); rr(160, 1230, 760, 300, 30); fs('#e8ecef', 5); ell(540, 1280, 300, 60); fs('#9aa2a8', 4);
  rr(500, 640, 80, 220, 20); fs(lg(500, 0, 580, 0, ['#9aa2a8', '#f0f4f6', '#8a9298']), 5); rr(380, 600, 320, 70, 30); fs(lg(0, 600, 0, 670, ['#f0f4f6', '#9aa2a8']), 5); path([[540, 860], [540, 980], [620, 1000]]); g.strokeStyle = OL; g.lineWidth = 60; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#c8d0d6'; g.lineWidth = 46; g.stroke();
  const dry = seg(u, .2, 2.2), drops = Math.floor(u * 1.4);
  if (dry < 1) { const p = (u * 1.4) % 1; circ(620, 1010 + p * 260, 12, `rgba(170,210,255,${.9 * (1 - dry)})`); }
  person(260, 1900, 900, { t, arms: 'reach', eyes: 'open', look: .8, lookY: .5, tired: .4, lx: 1, rim: RIMC });
  L(820, 200, 700, C.moon, .7, .12); L(540, 900, 700, null, .4);
  lightPass('#262a40'); back_();
};
// 10. day 3: lines for water and fuel; signs say sold out
S.day3 = (t, u) => {
  cam(lerp(500, 620, seg(u, 0, span('l10'))), 900, 1.0);
  const back_ = keep(); g.fillStyle = lg(0, -400, 0, 1200, ['#0a0c1a', '#3a2a3a', '#6a4048']); g.fillRect(-500, -500, 2200, 1800);
  g.drawImage(TEX.city, 0, 0, 2400, 900, -600, 300, 2400, 800); g.fillStyle = 'rgba(6,6,14,.7)'; g.fillRect(-600, 300, 2400, 900);
  g.fillStyle = '#2a2830'; g.fillRect(-600, 1150, 2400, 1000);
  rr(780, 500, 300, 520, 14); fs('#4a1a24', 6); text(TX.fuel, 930, 580, 56, '#fff', 'Anton'); rr(810, 640, 240, 120, 10); fs('#0a0a10', 4); text(TX.sold, 930, 702, 52, '#ff5068', 'Anton'); line([[930, 1020], [930, 1300]], 20, '#3a3a40');
  for (let i = 0; i < 12; i++) { const x = 720 - i * 130 + 20 * Math.sin(i), h = 520 + 80 * hash(i); runner(x, 1300 + 40 * hash(i * 3), h, 0, { alpha: .95, dir: 1, lean: .05, rim: 'rgba(255,150,100,.35)' }); rr(x + 30, 1300 + 40 * hash(i * 3) - h * .32, 50, 70, 8); fs(['#3a6ab0', '#c8a040', '#5a8a5a'][i % 3], 2); }
  L(930, 650, 400, C.red, .7, .25); L(400, 600, 1300, '255,140,100', .5, .12);
  lightPass('#2a1e2c'); back_();
};
// 11. the hospitals run on their last generators
S.hospital = (t, u) => {
  const fuel = 1 - .9 * seg(u, 0, span('l11') + .5);
  cam(540, 900, lerp(1.05, 1.15, seg(u, 0, span('l11'))));
  const back_ = keep(); g.fillStyle = '#c8d0cc'; g.fillRect(-400, -400, 1900, 1500); g.drawImage(TEX.lino, -400, 1100, 1900, 900);
  for (let k = 0; k < 4; k++) { const z = 1 - k * .2; rr(540 - 520 * z, 300 + k * 60, 1040 * z, 860 - k * 120, 4); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 4; g.stroke(); }
  rr(120, 1100, 420, 120, 16); fs('#e8ecef', 4); rr(110, 1060, 140, 70, 20); fs('#f8f8f8', 3); rr(150, 1200, 20, 200, 4); fs('#8a9298', 2); rr(480, 1200, 20, 200, 4); fs('#8a9298', 2);
  rr(640, 820, 300, 220, 14); fs('#1a1e24', 5); g.save(); rr(660, 840, 260, 180, 8); g.clip(); g.fillStyle = '#04100a'; g.fillRect(660, 840, 260, 180); const ph = (t * .8) % 1; path(Array.from({ length: 27 }, (_, i) => { const x = 660 + i * 10, q = ((i / 26 + 1 - ph) % 1); return [x, 930 - (q > .45 && q < .5 ? 60 : q > .5 && q < .53 ? -30 : 0)]; })); g.strokeStyle = GRN; g.lineWidth = 4; g.stroke(); g.restore();
  rr(700, 1250, 300, 220, 16); fs('#c8a020', 5); text(TX.gen, 850, 1300, 40, '#2a2010', 'Anton'); rr(730, 1340, 240, 40, 10); fs('#2a2010', 3); rr(736, 1346, 228 * fuel, 28, 8); g.fillStyle = fuel < .3 ? '#ff5068' : '#7dffb0'; g.fill(); text(TX.fuel, 850, 1420, 32, '#2a2010', 'Anton');
  const em = .5 + .5 * Math.sin(t * 5);
  L(540, 160, 800, C.red, .6 + .3 * em, .3 * em); L(790, 930, 300, C.grn, .5, .15);
  lightPass('#2a1c26'); back_(); circ(540, 160, 30, `rgba(255,40,60,${.6 + .4 * em})`); glow(540, 160, 300, C.red, .5 * em);
};
// 12. day 7: a silent city... and every star
S.day7 = (t, u) => {
  cam(540, lerp(980, 820, ss(seg(u, 0, span('l12') + .5))), lerp(1.05, 1.0, seg(u, 0, 4)));
  const back_ = keep(); skyline(t, { dark: () => 1, stars: 1, moonA: 0 });
  g.fillStyle = '#5a5a62'; g.fillRect(-500, 1480, 2100, 600); g.fillStyle = '#8a8a92'; g.fillRect(-500, 1470, 2100, 20);
  person(540, 1760, 700, { t, sit: 1, arms: 'lap', eyes: 'open', lookY: -1, look: .2, tired: .3, lx: 1, rim: 'rgba(170,190,255,.6)' });
  L(540, 400, 1400, C.moon, .6, .1); lightPass('#262a4c'); back_();
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 500; i++) { const x = -300 + hash(i * 4.1) * 1700, y = -500 + hash(i * 2.7) * 1400, band = Math.exp(-((((x - 540) * .6 - (y - 200)) / 260) ** 2)); circ(x, y, .8 + 1.6 * hash(i), `rgba(255,255,255,${(.25 + .6 * band) * (.6 + .4 * Math.sin(t * 2 + i))})`); } g.fillStyle = 'rgba(140,120,220,.08)'; g.beginPath(); g.ellipse(540, 200, 1100, 160, -1.0, 0, TAU); g.fill(); g.restore();
};
// 13. the scary truth: an old radio crackles in the dark
S.radio = (t, u) => {
  cam(540, 960, lerp(1.15, 1.0, eo(seg(u, 0, 1.2))));
  const back_ = keep(); g.fillStyle = '#1a1210'; g.fillRect(-400, -400, 1900, 2800); rr(-200, 1300, 1500, 60, 10); fs('#4a3020', 4);
  rr(160, 820, 760, 500, 40); fs(lg(160, 0, 920, 0, ['#6a4028', '#9a6038', '#5a3420']), 8); rr(220, 880, 360, 380, 20); fs('#2a1c14', 5); for (let k = 0; k < 9; k++) line([[240, 900 + k * 40], [560, 900 + k * 40]], 8, '#4a3020');
  rr(620, 890, 250, 110, 12); fs('#e8c870', 5); for (let k = 0; k < 9; k++) line([[640 + k * 26, 910], [640 + k * 26, 930]], 3, '#5a4020'); const nd = 640 + ((Math.sin(t * .8) + 1) / 2) * 210; line([[nd, 900], [nd, 990]], 5, '#c82020');
  for (const kx of [680, 810]) { circ(kx, 1130, 50, '#3a2418'); circ(kx, 1130, 50, OL, 5); line([[kx, 1130], [kx + 30 * Math.cos(t + kx), 1130 + 30 * Math.sin(t + kx)]], 6, '#c8a060'); }
  L(745, 945, 420, C.amb, .9, .35); lightPass('#1e1418'); back_();
  g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 4; k++) { const p = (u * .9 + k / 4) % 1; g.beginPath(); g.arc(400, 1070, 120 + p * 600, -2.6, -.5); g.strokeStyle = `rgba(255,180,90,${.4 * (1 - p)})`; g.lineWidth = 5; g.stroke(); } g.restore();
  reset(); tag(TX.truth, 540, 520, RED, C.red, back(seg(u, .3, .6), 1.8), 1);
};
// 14. 1859: the Carrington Event: telegraph wires catch fire; the aurora reaches the Caribbean
S.carrington = (t, u) => {
  const tf = wordT('l14', 'Umapoy'), ta = wordT('l14', 'aurora');
  cam(540, 900, lerp(1.0, 1.08, seg(u, 0, span('l14'))));
  const back_ = keep(); const au = ss(seg(t, ta - .5, ta + .8));
  g.fillStyle = lg(0, -400, 0, 1300, ['#03050e', '#0a1424', '#1a2a3a']); g.fillRect(-400, -400, 1900, 1800);
  g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 7; k++) { const x0 = -200 + k * 220; g.beginPath(); for (let y = -300; y < 900; y += 30) g.lineTo(x0 + Math.sin(y * .006 + t * .6 + k) * 90, y); for (let y = 900; y > -300; y -= 30) g.lineTo(x0 + 120 + Math.sin(y * .006 + t * .6 + k + .5) * 90, y); g.closePath(); g.fillStyle = lg(0, -300, 0, 900, [`rgba(255,90,140,${.35 * au})`, `rgba(90,255,170,${.55 * au})`, 'rgba(90,255,170,0)']); g.fill(); } g.restore();
  g.fillStyle = '#2a1c14'; g.fillRect(-400, 900, 1900, 1400); for (let x = -400; x < 1500; x += 140) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, 900, 6, 1400); }
  for (const px of [120, 960]) { line([[px, 260], [px, 920]], 24, '#3a2414'); line([[px - 90, 300], [px + 90, 300]], 14, '#3a2414'); }
  for (let k = 0; k < 3; k++) curve([30, 300 + k * 10], [540, 380 + k * 14], [1050, 300 + k * 10], 4, '#141010');
  rr(260, 1040, 560, 60, 10); fs('#5a3a20', 4); rr(420, 960, 240, 80, 10); fs('#8a6a3a', 4); line([[540, 960], [640, 900]], 14, '#c8a060'); circ(640, 900, 22, '#2a1c14');
  text('1859', 540, 1260, 150, '#e8d8b0', 'Anton', 'center', 10, .9);
  L(540, 400, 1400, C.aur, .8 * au, .2 * au); L(540, 1100, 900, C.amb, .5, .1);
  if (t > tf) { const fl = .7 + .3 * Math.sin(t * 17); L(540, 360, 500, C.fire, fl, .35); L(640, 900, 300, C.fire, fl, .3); }
  lightPass('#1e2032'); back_();
  if (t > tf) { g.save(); g.globalCompositeOperation = 'screen'; for (let k = 0; k < 30; k++) { const p = ((t - tf) * 1.2 + hash(k)) % 1, x = 100 + hash(k * 3) * 880, y = 330 + Math.sin(x / 1080 * Math.PI) * 60 + p * 300; circ(x, y, 4 * (1 - p), `rgba(255,${180 + 60 * hash(k)},90,${1 - p})`); } for (let k = 0; k < 5; k++) { const x = 200 + k * 170, fh = 60 + 40 * Math.sin(t * 9 + k) ** 2, y = 330 + Math.sin(x / 1080 * Math.PI) * 60; path([[x - 20, y], [x + Math.sin(t * 7 + k) * 8, y - fh], [x + 20, y]]); g.closePath(); g.fillStyle = 'rgba(255,150,50,.85)'; g.fill(); } g.restore(); }
};
// 15. 1989: Quebec goes dark: six million people, nine hours
S.quebec = (t, u) => {
  const ts = wordT('l15', 'anim');
  cam(540, 900, lerp(1.0, 1.06, seg(u, 0, span('l15'))));
  const back_ = keep(); const mid = LN.l15.t0 + span('l15') * .3;
  skyline(t, { dark: k => ss(seg(t, mid + .05 * k, mid + .15 + .05 * k)), stars: .5 });
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 150; i++) { const p = (hash(i * 3) + t * .05 * (1 + hash(i))) % 1; circ(-300 + hash(i * 7.7) * 1700 + Math.sin(t + i) * 20, -300 + p * 2200, 2 + 3 * hash(i), 'rgba(255,255,255,.7)'); } g.restore();
  text('1989', 540, 1300, 150, '#e8f0ff', 'Anton', 'center', 10, .9);
  L(540, 1100, 1400, C.amb, .6 * (1 - seg(t, mid, mid + 1.2)) + .1, .12); lightPass('#26304e'); back_();
  if (t > ts) { reset(); const n = Math.min(60, Math.floor((t - ts) * 40)); for (let i = 0; i < 60; i++) { const x = 160 + (i % 12) * 68, y = 620 + Math.floor(i / 12) * 80, on = i < n; g.save(); g.globalAlpha = on ? 1 : .2; circ(x, y - 14, 11, on ? '#9fb8ff' : '#555'); rr(x - 13, y, 26, 30, 10); g.fillStyle = on ? '#9fb8ff' : '#555'; g.fill(); g.restore(); } }
};
// 16. 2012: a Carrington-class storm crossed Earth's orbit... nine days after we passed
S.miss = (t, u) => {
  const tm = wordT('l16', 'na-miss'), tn = wordT('l16', 'siyam');
  cam(540, 900, lerp(1.05, 1.0, eo(seg(u, 0, 1.2))));
  grad('#02020a', '#080418', -600, 2400); for (let i = 0; i < 160; i++) circ(-400 + hash(i * 3.3) * 1900, -500 + hash(i * 1.7) * 2700, 1 + 1.5 * hash(i), 'rgba(255,255,255,.5)');
  const ox = 540, oy = 1000, R = 420; glow(ox, oy, 360, C.sun, .5); circ(ox, oy, 70, rg(ox - 20, oy - 20, 5, 70, ['#fff6c8', '#ffb040', '#e85a10']));
  g.setLineDash([10, 12]); circ(ox, oy, R, 'rgba(140,180,255,.5)', 3); g.setLineDash([]);
  const ea = -Math.PI / 2 + seg(t, LN.l16.t0, tn + 1) * .9, hitA = ea - .9 * .155 * (t > tm ? 1 : 0) - .14;
  const cone = seg(t, LN.l16.t0 + .4, tm + .2);
  g.save(); g.globalCompositeOperation = 'screen'; g.beginPath(); g.moveTo(ox, oy); g.arc(ox, oy, R * 1.4 * cone + 70, hitA - .18, hitA + .18); g.closePath(); g.fillStyle = rg(ox, oy, 60, R * 1.4, ['rgba(255,170,80,.6)', 'rgba(255,90,60,0)']); g.fill(); g.restore();
  const ex = ox + Math.cos(ea) * R, ey = oy + Math.sin(ea) * R; circ(ex, ey, 34, rg(ex - 10, ey - 10, 3, 34, ['#8ac8ff', '#2a6ab0'])); text(TX.earth, ex + 80, ey - 30, 40, '#9fd0ff', 'Anton', 'left');
  if (t > tn - .2) { const k = back(seg(t, tn - .2, tn + .2), 1.7); g.beginPath(); g.arc(ox, oy, R + 60, hitA, ea); g.strokeStyle = YEL; g.lineWidth = 8; g.stroke(); g.save(); const mx = ox + Math.cos((hitA + ea) / 2) * (R + 150), my = oy + Math.sin((hitA + ea) / 2) * (R + 150); g.translate(mx, my); g.scale(k, k); text(TX.nine, 0, 0, 90, YEL, 'Anton', 'center', 12); g.restore(); }
};
// 17. about a 12% chance every ten years
S.chance = (t, u) => {
  const t12 = wordT('l17', 'walo');
  cam(540, 900, 1); grad('#06060e', '#141024', -600, 2400); reset();
  const p = .125 * eo(seg(t, t12 - .3, t12 + .9));
  for (let i = 0; i < 8; i++) { const k = back(seg(t, LN.l17.t0 + .2 + i * .1, LN.l17.t0 + .5 + i * .1), 1.7), x = 200 + (i % 4) * 227, y = 1380 + Math.floor(i / 4) * 170, red = i === 5 && t > t12; if (k <= 0) continue; g.save(); g.translate(x, y); g.scale(k, k); if (red) { g.shadowColor = 'rgba(255,49,80,1)'; g.shadowBlur = 30; } circ(0, -40, 30, red ? RED : '#6a6e80'); rr(-36, -2, 72, 90, 30); g.fillStyle = red ? RED : '#6a6e80'; g.fill(); g.restore(); }
  g.save(); g.translate(CX, 900); circ(0, 0, 300, 'rgba(255,255,255,.06)'); circ(0, 0, 300, 'rgba(255,255,255,.12)', 40);
  g.beginPath(); g.arc(0, 0, 300, -Math.PI / 2, -Math.PI / 2 + TAU * p); g.strokeStyle = RED; g.lineWidth = 40; g.lineCap = 'round'; g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 40; g.stroke(); g.shadowBlur = 0;
  text(t > t12 ? TX.one8 : `${Math.round(p * 100)}%`, 0, 10, t > t12 ? 150 : 200, '#fff', 'Anton'); text(TX.years, 0, 170, 52, '#c9cde0', 'Anton'); g.restore();
};
// 18. get ready: water, a flashlight, canned food, cash
const KITW = { tl: ['Tubig', 'flashlight', 'de-lata', 'cash'], en: ['Water', 'flashlight', 'canned', 'cash'] };
S.kit = (t, u) => {
  cam(540, 900, 1); const back_ = keep(); g.fillStyle = '#1e1814'; g.fillRect(-400, -400, 1900, 2800); for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? 'rgba(0,0,0,.12)' : 'rgba(255,230,200,.03)'; g.fillRect(-400, -400 + k * 300, 1900, 300); }
  const c1 = candle(140, 1600, 1.5, t); L(540, 900, 1400, null, .35);
  lightPass('#2a2028'); back_(); c1();
  (KITW[LANG] || KITW.en).forEach((w, i) => {
    const tw = wordT('l18', w), k = back(seg(t, tw - .15, tw + .2), 1.8); if (k <= 0) return;
    const x = 290 + (i % 2) * 500, y = 640 + Math.floor(i / 2) * 520; g.save(); g.translate(x, y); g.scale(k, k);
    glass(-210, -210, 420, 420, 40, AMB, 4, 'rgba(255,170,80,.6)');
    if (i === 0) { rr(-60, -150, 120, 240, 30); fs('rgba(120,190,255,.8)', 5); rr(-40, -190, 80, 50, 10); fs('#3a6ab0', 4); }
    if (i === 1) { g.save(); g.rotate(-.5); rr(-50, -150, 100, 220, 20); fs('#2a2a30', 5); rr(-70, -180, 140, 60, 16); fs('#4a4a50', 4); g.restore(); beam([[-40, -120], [40, -150], [200, -220], [60, -260]], 0, -130, 140, -240, C.warm, .6); }
    if (i === 2) { for (const dx of [-70, 70]) { rr(dx - 60, -100, 120, 170, 14); fs('#b8bcc4', 5); rr(dx - 60, -60, 120, 80, 4); fs(dx < 0 ? '#c8402a' : '#2a6a3a', 0); } }
    if (i === 3) { for (let k2 = 0; k2 < 3; k2++) { g.save(); g.rotate(-.2 + k2 * .15); rr(-130, -70 + k2 * 10, 260, 130, 10); fs('#7ab07a', 4); circ(0, k2 * 10, 36, '#5a8a5a'); g.restore(); } }
    text((TX.kit[i]), 0, 160, 48, '#fff', 'Anton', 'center', 8); g.restore();
  });
};
// 19. agree on where to meet when there's no signal
S.meet = (t, u) => {
  const tm = wordT('l19', 'magkikita'); cam(540, 900, lerp(1.06, 1.0, eo(seg(u, 0, 1)))); reset();
  g.fillStyle = '#d8ccae'; g.fillRect(0, 0, W, H); for (let i = 0; i < 9; i++) { line([[0, 200 + i * 200 + 30 * Math.sin(i)], [W, 260 + i * 190]], 26, '#f4ecd8'); line([[100 + i * 130, 0], [60 + i * 140, H]], 20, '#f4ecd8'); }
  for (let i = 0; i < 14; i++) { rr(hash(i * 3) * 900, hash(i * 7) * 1700, 90 + 60 * hash(i), 70 + 50 * hash(i + 1), 6); g.fillStyle = 'rgba(140,120,90,.3)'; g.fill(); }
  ell(780, 300, 220, 160); g.fillStyle = 'rgba(120,170,200,.6)'; g.fill();
  g.fillStyle = 'rgba(10,8,20,.35)'; g.fillRect(0, 0, W, H);
  const P = [540, 960], pk = back(seg(t, tm - .3, tm + .1), 1.7);
  [[180, 400], [900, 620], [260, 1500], [880, 1400]].forEach(([x, y], i) => { const p = eo(seg(t, LN.l19.t0 + .2 + i * .15, tm + .4)), cx = lerp(x, P[0] + (i - 1.5) * 50, p), cy = lerp(y, P[1] + 120, p); g.setLineDash([16, 14]); line([[x, y], [cx, cy]], 6, `rgba(${BCOLX[i]},.8)`); g.setLineDash([]); circ(cx, cy - 22, 18, `rgb(${BCOLX[i]})`); rr(cx - 20, cy - 2, 40, 46, 14); g.fillStyle = `rgb(${BCOLX[i]})`; g.fill(); });
  if (pk > 0) { g.save(); g.translate(P[0], P[1]); g.scale(pk, pk); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-70, -90, -70, -170, 0, -170); g.bezierCurveTo(70, -170, 70, -90, 0, 0); g.fillStyle = RED; g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 30; g.fill(); g.shadowBlur = 0; circ(0, -115, 26, '#fff'); g.restore(); tag(TX.meet, P[0], P[1] - 260, YEL, C.amb, pk, 1); }
};
const BCOLX = ['255,179,87', '82,216,255', '255,79,154', '109,255,168'];
// 20. POV: look at your battery
S.battery = (t, u) => {
  cam(540, 900, 1); grad('#05060e', '#0e1020', -600, 2400); reset();
  const lvl = lerp(.62, .23, eo(seg(u, .2, span('l20')))), pk = back(seg(u, 0, .3), 1.5);
  g.save(); g.translate(CX, 860); g.scale(pk, pk); rr(-240, -480, 480, 960, 60); fs('#101016', 8); rr(-222, -462, 444, 924, 46); g.fillStyle = '#0a0c14'; g.fill();
  rr(-140, -260, 260, 480, 40); g.strokeStyle = '#e8ecef'; g.lineWidth = 14; g.stroke(); rr(-40, -300, 60, 40, 10); g.fillStyle = '#e8ecef'; g.fill();
  const col = lvl < .3 ? RED : lvl < .5 ? YEL : GRN; rr(-120, -240 + 440 * (1 - lvl), 220, 440 * lvl, 26); g.save(); g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; g.fill(); g.restore();
  text(`${Math.round(lvl * 100)}%`, -10, 340, 110, '#fff', 'Anton'); g.restore();
  text(TX.battery, CX, 260, 72, '#fff', 'Anton', 'center', 12, ss(seg(u, .3, .6)));
};
// 21. how many days would you last?
S.comment = (t, u) => {
  cam(540, 920, lerp(1.0, 1.1, seg(u, 0, span('l21')))); const back_ = keep(); g.fillStyle = '#120e10'; g.fillRect(-400, -400, 1900, 2800); rr(-200, 1240, 1500, 60, 10); fs('#3a2418', 4);
  const c1 = candle(540, 1240, 2.2, t); lightPass('#1a1418'); back_(); c1();
  reset(); const k = back(seg(u, .2, .5), 1.7); g.save(); g.translate(CX, 380); g.scale(k, k); glass(-440, -150, 880, 300, 50, 'rgba(255,255,255,.7)', 4, 'rgba(255,255,255,.5)'); path([[-200, 148], [-260, 230], [-90, 148]]); g.closePath(); g.fillStyle = 'rgba(8,10,22,.8)'; g.fill();
  g.font = '64px Anton'; const sc = Math.min(1, 800 / g.measureText(TX.last).width); g.save(); g.scale(sc, sc); text(TX.last, 0, -40, 64, '#fff', 'Anton'); g.restore(); g.save(); g.shadowColor = 'rgba(255,170,80,1)'; g.shadowBlur = 24; text(`? ${TX.days}`, 0, 60, 100, YEL, 'Anton'); g.restore(); g.restore();
};
// 22. send it to your person; then the loop: the city lit again (= frame 1)
S.cta = (t, u) => {
  cam(540, 960, lerp(1.06, 1.0, eo(seg(u, 0, 1)))); const back_ = keep(); skyline(t, { dark: () => 1, stars: .9 });
  g.fillStyle = '#3a3a42'; g.fillRect(-500, 1460, 2100, 700);
  const c1 = candle(540, 1470, 1.4, t);
  person(380, 1700, 760, { t, arms: 'down', eyes: 'open', look: .8, lx: 1, rim: 'rgba(255,170,90,.6)' });
  person(700, 1700, 740, { t: t + 2, hood: REDHOOD, longHair: 1, arms: 'down', eyes: 'open', look: -.8, smile: 1, lx: -1, rim: 'rgba(255,170,90,.6)' });
  lightPass('#1c1c34'); back_(); c1();
  const k = back(seg(u, 0, .3), 1.8); reset(); g.save(); g.translate(CX, 420); g.scale(k, k); glass(-430, -150, 860, 300, 36, 'rgba(255,179,87,.6)', 3, 'rgba(255,179,87,.7)'); text(TX.share[0], 0, -50, 100, '#fff', 'Anton'); g.save(); g.shadowColor = 'rgba(255,170,80,.9)'; g.shadowBlur = 26; text(TX.share[1], 0, 62, 80, YEL, 'Anton'); g.restore(); g.restore();
};
S.loop = (t, u) => {
  cam(540, 900, 1.08); const back_ = keep(); skyline(t, { dark: () => 0 });
  L(540, 1100, 1400, C.amb, .65, .15); L(820, 140, 600, C.moon, .8, .12); lightPass('#2c2c5a'); back_();
};

function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .22; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }

// ---------- frame ----------
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
const NOPUNCH = ['hook', 'stamp', 'chance', 'battery', 'comment', 'cta', 'loop', 'kit', 'meet', 'miss'];
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  const ln = TL.lines.find(l => l.words && t >= l.t0 && t < l.t1 + .2);
  ZK = 1; BLACK = 0;
  if (ln && ln.t1 - ln.t0 > 2.4 && !NOPUNCH.includes(sh[2])) { const mid = ln.words[Math.floor(ln.words.length / 2)][1]; ZK = 1 + .08 * eo(seg(t, mid, mid + .35)); }
  S[sh[2]](t, u);
  bloom(); vignette(.55);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'hook') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .3, .6)));
  counter(t);
  if (!['cta', 'loop', 'chance'].includes(sh[2])) statCard(t);
  if (BLACK) { reset(); g.fillStyle = `rgba(0,0,0,${BLACK})`; g.fillRect(0, 0, W, H); }
  if (!['cta', 'loop'].includes(sh[2])) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

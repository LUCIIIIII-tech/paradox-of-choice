// Paano Kung Hindi Ka Namamatay? (a man who cannot die, from a fall in Makati to the end of the stars): a dark, painterly what-if reel, 1080x1920.
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
  tl: { tag: 'TOTOONG KWENTO', t1: 'ANG WHITE LADY NG', t2: 'BALETE DRIVE', place: ['QUEZON CITY', '2:00 AM · UMUULAN'], rules: [['BILIN #1', 'HUWAG MAGPASAKAY NG NAKAPUTI'], ['BILIN #2', 'HUWAG TUMINGIN SA SALAMIN']],
        cta: ['LILINGON KA BA?', 'O MAGDADASAL?', 'I-COMMENT MO'], count: ['IKA-14 NA DRIVER', 'NA KUMATOK SA GATE'], last: ['HUWAG KANG', 'HIHINTO.'], turns: ['DIRETSO', 'KALIWA', 'DIRETSO ULIT'] },
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
function limb(pts, w, cols, lx = -1) { line(pts, w + Math.max(2, w * .06), 'rgba(8,8,14,.75)'); line(pts, w, cols[1]); g.save(); g.translate(lx * w * .2, -w * .04); line(pts, w * .34, cols[0]); g.restore(); g.save(); g.translate(-lx * w * .3, 0); line(pts, w * .2, cols[2]); g.restore(); }
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
    if (outfit === 'shirt') path([[neck[0] - h * .014, neck[1] + h * .045], [neck[0] + h * .014, neck[1] + h * .045], [neck[0] + h * .022 + sway * h * .01, neck[1] + h * .2], [neck[0] + sway * h * .01, neck[1] + h * .23], [neck[0] - h * .022 + sway * h * .01, neck[1] + h * .2]]); if (outfit === 'shirt') { g.closePath(); fs(lg(neck[0] - h * .02, 0, neck[0] + h * .02, 0, ['#8a2a34', '#4a1018']), h * .004); } }
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
// ---------- captions: word by word, the current word pops, key words amber (red on the scary lines); her lines in a cold blue ----------
const REDCAP = ['fall', 'accidents', 'deathbed', 'graves', 'swallow', 'drift', 'stars', 'dark'];
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
      g.fillStyle = isKey ? kc : l.voice && l.voice !== 'narrator' ? '#ffe2b8' : '#ffffff'; g.fillText(up(w[0]), 0, 0);
      g.restore();
      x += (widths[i] + gap) * sc;
    });
  }
}



// ==================== Balete Drive: the 2.5D camera, rain and glass, the taxi, the balete, the white lady ====================
// Every shot is painted as flat layers at a depth (1 = the focal plane, bigger = farther, smaller = nearer). The camera pans, cranes,
// dollies and rolls; near layers move and grow more than far ones (parallax), and layers away from the focus are blurred (rack focus).
const PAL = { taxi: ['#f6f4ec', '#cfccc2', '#7a786e'], stripe: '#2c5cae', seat: ['#6a4a40', '#48302a', '#24140f'], dash: ['#34343c', '#1e1e24', '#0c0c10'] };
const DRV = { hood: ['#86a6c8', '#56789e', '#2a3e58'], legs: ['#3a3a44', '#24242c', '#121216'], skin: ['#c88e66', '#9c6644', '#5c3822'], hair: ['#141010', '#2a201a', '#3e342c'] };
const LADY = { skin: ['#e4e8ee', '#b0b8c4', '#646c7a'], dress: ['#f4f4f2', '#c8cad0', '#6c707c'], hair: ['#040406', '#0a0a0f', '#15151c'] };
const LOLA2 = { hood: ['#8a7a9a', '#62546e', '#342a3e'], legs: ['#4a4038', '#2e2822', '#16120e'], skin: ['#d4a684', '#aa7c5c', '#664430'], hair: ['#e8e6e2', '#b8b4ae', '#76726c'], glasses: 1 };
C.sodium = '255,150,60'; C.ice = '190,215,255'; C.dash = '120,200,255'; C.candle = '255,180,90';

const pat = c => g.createPattern(c, 'repeat');
// ---------- the camera ----------
const CAMV = {};
function setCam(o = {}) { Object.assign(CAMV, { x: 540, y: 900, z: 1, dz: 0, rot: 0, focus: 1, dof: 0, shake: 0, t: 0 }, o); }
setCam();
const LAYC = mk(W, H), FLARES = [];
function camT(d) {
  const k = d / Math.max(.12, d - CAMV.dz), s = CAMV.z * k;
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(CX, 900);
  if (CAMV.shake) { const t = CAMV.t, a = CAMV.shake / d; g.translate(Math.sin(t * 1.7) * a * 6 + Math.sin(t * 3.1) * a * 3, Math.cos(t * 1.3) * a * 5 + Math.sin(t * 2.3) * a * 2); }
  g.scale(s, s); if (CAMV.rot) g.rotate(CAMV.rot);
  g.translate(-(540 + (CAMV.x - 540) / d), -(900 + (CAMV.y - 900) / d));
}
// draw fn as one layer at depth d (blur = the depth of field unless given)
function layer(d, fn, o = {}) {
  const b = o.blur ?? CAMV.dof * Math.abs(1 / d - 1 / CAMV.focus);
  if (b < .5) { g.save(); camT(d); fn(); g.restore(); reset(); return; }
  const old = g; g = LAYC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); camT(d); fn(); reset(); g = old;
  reset(); g.filter = `blur(${Math.min(40, b).toFixed(1)}px)`; g.drawImage(LAYC, 0, 0); reset();
}
// atmospheric haze between layers
function haze(c, a) { reset(); g.fillStyle = `rgba(${c},${a})`; g.fillRect(0, 0, W, H); }
// a lens flare (horizontal anamorphic streak), drawn after the light pass
function F(x, y, len, c, a) { const m = g.getTransform(), s = Math.hypot(m.a, m.b); FLARES.push({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, len: len * s, c, a }); }
function flares() {
  reset(); g.globalCompositeOperation = 'screen';
  for (const f of FLARES) { if (f.a <= 0) continue;
    g.fillStyle = lg(f.x - f.len, 0, f.x + f.len, 0, [`rgba(${f.c},0)`, `rgba(${f.c},${f.a * .55})`, `rgba(${f.c},0)`]); g.fillRect(f.x - f.len, f.y - 2.5, 2 * f.len, 5);
    g.fillStyle = lg(f.x - f.len * .5, 0, f.x + f.len * .5, 0, [`rgba(${f.c},0)`, `rgba(${f.c},${f.a * .25})`, `rgba(${f.c},0)`]); g.fillRect(f.x - f.len * .5, f.y - 14, f.len, 28);
    glow(f.x, f.y, f.len * .12, f.c, f.a * .5); }
  FLARES.length = 0; reset();
}

// ---------- rain ----------
function rainFx(t, o = {}) {      // screen space, after the light pass: three depths of streaks
  const { n = 240, a = .3, ang = .1, sp = 1, c = '205,220,255', x0 = 0, y0 = 0, x1 = W, y1 = H, big = 1 } = o;
  reset(); g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip(); g.globalCompositeOperation = 'screen'; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const z = hash(i * 1.37), v = (1300 + 1900 * z) * sp, len = (26 + 110 * z * z) * sp, hh = y1 - y0 + 400;
    const y = y0 - 200 + ((hash(i * 7.7) * hh + t * v) % hh), x = x0 - 200 + hash(i * 3.11) * (x1 - x0 + 400) + (y - y0) * ang;
    g.strokeStyle = `rgba(${c},${a * (.2 + .8 * z)})`; g.lineWidth = .7 + 2.8 * z * z * big;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * ang, y - len); g.stroke();
  }
  g.restore(); reset();
}
function splashes(t, x0, x1, y0, y1, n = 50, a = .4) {   // little crowns on the wet ground (world space)
  for (let i = 0; i < n; i++) { const p = (t * 2.2 + hash(i * 1.9)) % 1, cyc = Math.floor(t * 2.2 + hash(i * 1.9)), x = lerp(x0, x1, hash(i * 3.7 + cyc * 1.3)), y = lerp(y0, y1, hash(i * 5.3 + cyc * 2.1)), sz = (y - y0) / (y1 - y0 + 1) * .7 + .3;
    ell(x, y, 22 * p * sz, 6 * p * sz); g.strokeStyle = `rgba(210,225,255,${a * (1 - p)})`; g.lineWidth = 2; g.stroke(); }
}
function puddleShine(x0, x1, y0, y1, c, a) { g.fillStyle = lg(0, y0, 0, y1, [`rgba(${c},${a})`, `rgba(${c},0)`]); g.fillRect(x0, y0, x1 - x0, y1 - y0); }
function reflect(x, y, gy, w, c, a) {     // a light's streak on the wet road: from the ground line down
  g.save(); g.globalCompositeOperation = 'screen'; const hgt = (gy - y) * 1.6 + 300;
  g.fillStyle = lg(0, gy, 0, gy + hgt, [`rgba(${c},${a})`, `rgba(${c},${a * .35})`, `rgba(${c},0)`]);
  g.beginPath(); g.moveTo(x - w, gy); g.lineTo(x + w, gy); g.lineTo(x + w * .45, gy + hgt); g.lineTo(x - w * .45, gy + hgt); g.closePath(); g.fill();
  for (let k = 0; k < 6; k++) { const yy = gy + 18 + k * hgt / 7; g.fillStyle = `rgba(${c},${a * .5 * (1 - k / 6)})`; g.fillRect(x - w * (1 - k * .08) + Math.sin(k * 3.1) * 10, yy, w * 2 * (1 - k * .08), 3); }
  g.restore();
}

// ---------- wet glass and the wipers (screen space) ----------
const WA0 = Math.PI * 1.0, WA1 = Math.PI * 1.6;
const wipeP = (t, per) => { const p = ((t % per) + per) % per / per; return p < .32 ? ss(p / .32) : p < .64 ? 1 - ss((p - .32) / .32) : 0; };
function windshield(t, o = {}) {
  const { per = 2.1, piv = [[230, 1790], [690, 1790]], len = 760, n = 150, a = 1, wipers = 1, x0 = 0, y0 = 0, x1 = W, y1 = H } = o;
  reset(); g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  const angAt = tt_ => lerp(WA0, WA1, wipeP(tt_, per));
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i * 2.13)), y = lerp(y0, y1, hash(i * 4.71)), r = 3 + 10 * hash(i * 9.1) ** 2;
    let vis = 1;
    if (wipers) for (const [px, py] of piv) {
      const d = Math.hypot(x - px, y - py); if (d > len) continue; let th = Math.atan2(y - py, x - px); if (th < 0) th += TAU; if (th < WA0 || th > WA1) continue;
      let last = -99; for (let s = 0; s < 44; s++) { const ta = t - s * per / 40, tb = ta - per / 40, da = angAt(ta) - th, db = angAt(tb) - th; if (da * db <= 0) { last = ta; break; } }
      vis = Math.min(vis, last < -90 ? 1 : seg(t - last, hash(i * 3.3) * per * .7, hash(i * 3.3) * per * .7 + .12));
    }
    if (vis <= 0) continue;
    g.globalAlpha = vis * a;
    g.fillStyle = rg(x - r * .3, y - r * .3, r * .1, r, ['rgba(220,232,255,.10)', 'rgba(120,140,180,.08)', 'rgba(0,0,0,.30)']); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    circ(x - r * .35, y - r * .4, r * .22, 'rgba(255,255,255,.55)'); g.beginPath(); g.arc(x, y, r, .3, 2.8); g.strokeStyle = 'rgba(200,220,255,.25)'; g.lineWidth = 1.2; g.stroke();
  }
  g.globalAlpha = a;
  for (let i = 0; i < 9; i++) {          // a few running drops with trails
    const sp = 70 + 110 * hash(i * 5.5), x = lerp(x0, x1, hash(i * 8.8)) + Math.sin(t * .7 + i) * 6, hh = y1 - y0 + 200, y = y0 - 100 + ((hash(i * 6.6) * hh + t * sp) % hh), r = 6 + 5 * hash(i);
    g.fillStyle = lg(0, y - 160, 0, y, ['rgba(200,220,255,0)', 'rgba(200,220,255,.12)']); g.fillRect(x - r * .4, y - 160, r * .8, 160);
    circ(x, y, r, 'rgba(0,0,0,.22)'); circ(x - r * .3, y - r * .35, r * .3, 'rgba(255,255,255,.6)');
  }
  g.globalAlpha = 1;
  if (wipers) for (const [px, py] of piv) { const an = angAt(t), ex = px + Math.cos(an) * len, ey = py + Math.sin(an) * len;
    line([[px, py], [px + Math.cos(an) * len * .55, py + Math.sin(an) * len * .55 - 14]], 22, '#050507'); line([[px, py], [ex, ey]], 16, '#0b0b0f'); g.save(); g.translate(-3, -3); line([[px, py], [ex, ey]], 4, 'rgba(190,205,240,.55)'); g.restore(); circ(px, py, 26, '#0a0a0e'); circ(px, py, 8, 'rgba(190,205,240,.4)'); }
  g.fillStyle = lg(x0, y0, x1, y1, ['rgba(255,255,255,0)', 'rgba(200,215,255,.05)', 'rgba(255,255,255,0)']); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.restore(); reset();
}
function frost(x0, y0, x1, y1, k, t) {      // cold glass: a white haze creeping in from the edges, with ice ferns
  if (k <= 0) return; g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
  g.fillStyle = rg(cx, cy, R * (1.05 - k * .9), R * 1.1, ['rgba(215,230,255,0)', `rgba(215,230,255,${.55 * k})`]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let i = 0; i < 26; i++) { const a = hash(i * 2.9) * TAU, sx = cx + Math.cos(a) * R, sy = cy + Math.sin(a) * R; let px = sx, py = sy, ang = a + Math.PI + (hash(i) - .5) * .8; const L_ = R * .9 * k * (.5 + .5 * hash(i * 4.1));
    for (let s = 0; s < 6; s++) { const nx = px + Math.cos(ang) * L_ / 6, ny = py + Math.sin(ang) * L_ / 6; line([[px, py], [nx, ny]], 2, `rgba(235,245,255,${.5 * k})`); for (const sg of [-1, 1]) line([[nx, ny], [nx + Math.cos(ang + sg * .9) * L_ * .07, ny + Math.sin(ang + sg * .9) * L_ * .07]], 1.4, `rgba(235,245,255,${.4 * k})`); px = nx; py = ny; ang += (hash(i * 7 + s) - .5) * .5; } }
  g.restore();
}
function breath(x, y, t, k, dir = 1) {     // a puff of cold breath, every few seconds
  if (k <= 0) return; const p = (t % 3.2) / 3.2; if (p > .6) return; const u = p / .6;
  for (let i = 0; i < 7; i++) { const q = u * (.6 + .4 * hash(i)); circ(x + dir * q * 170 + Math.sin(i * 2 + t) * 10, y - q * 40 + (hash(i * 3) - .5) * 40 * q, 14 + 50 * q, `rgba(225,235,255,${.16 * k * (1 - u)})`); }
}

// ---------- people seen from the side ----------
// a head in profile, facing right (dir -1 = left). eyes open | wide | shut. stache = the driver's moustache
function headSide(x, y, r, o = {}) {
  const { dir = 1, skin = DRV.skin, hair = DRV.hair, eyes = 'open', mouth = 0, sweat = 0, t = 0, rim = null, stache = 1, look = 0, tear = 0 } = o;
  g.save(); g.translate(x, y); g.scale(dir, 1);
  rr(-r * .42, r * .4, r * .64, r * .8, r * .2); g.fillStyle = lg(-r * .42, 0, r * .22, 0, ['#2a160e', skin[2], skin[1]]); g.fill(); g.fillStyle = lg(0, r * .45, 0, r * .8, ['rgba(20,8,6,.6)', 'rgba(20,8,6,0)']); g.fillRect(-r * .42, r * .45, r * .64, r * .35);
  const P = () => { g.beginPath(); g.moveTo(-r * .95, -r * .05); g.bezierCurveTo(-r * 1.02, -r * .95, r * .05, -r * 1.18, r * .6, -r * .66);
    g.quadraticCurveTo(r * .78, -r * .42, r * .74, -r * .22); g.quadraticCurveTo(r * .8, -r * .14, r * .76, -r * .06); g.lineTo(r * .99, r * .22);
    g.quadraticCurveTo(r * 1.02, r * .31, r * .8, r * .33); g.quadraticCurveTo(r * .85, r * .43, r * .8, r * .49); g.quadraticCurveTo(r * .83, r * .57, r * .76, r * .61);
    g.quadraticCurveTo(r * .8, r * .8, r * .6, r * .87); g.quadraticCurveTo(r * .18, r * .92, -r * .12, r * .64); g.quadraticCurveTo(-r * .62, r * .55, -r * .95, -r * .05); g.closePath(); };
  P(); g.fillStyle = rg(r * .45, -r * .2, r * .1, r * 1.35, [skin[0], skin[1], skin[2]]); g.fill();
  g.save(); P(); g.clip();
  g.fillStyle = rg(r * .45, r * .3, 0, r * .3, ['rgba(220,90,90,.18)', 'rgba(220,90,90,0)']); g.fillRect(0, 0, r, r * .7);
  g.fillStyle = lg(-r, 0, r * .3, 0, ['rgba(40,15,20,.45)', 'rgba(40,15,20,0)']); g.fillRect(-r, -r, r * 1.3, r * 2);
  curve([r * .2, r * .25], [r * .45, r * .55], [r * .62, r * .62], r * .03, 'rgba(70,30,30,.3)');
  if (rim) { g.translate(-r * .06, 0); P(); g.lineWidth = r * .09; g.strokeStyle = rim; g.stroke(); }
  g.restore();
  P(); g.strokeStyle = 'rgba(15,6,10,.6)'; g.lineWidth = r * .016; g.lineJoin = 'round'; g.stroke();
  g.save(); P(); g.clip(); for (let i = 0; i < 160; i++) { const px = r * (.05 + .7 * hash(i * 1.9)), py = r * (.45 + .45 * hash(i * 3.7)); if (px > r * .55 && py < r * .62) continue; g.fillStyle = 'rgba(30,22,26,.25)'; g.fillRect(px, py, 1.5, 1.5); }
    g.fillStyle = rg(r * .55, -r * .1, 0, r * .25, ['rgba(40,14,24,.35)', 'rgba(40,14,24,0)']); g.fillRect(r * .2, -r * .4, r * .7, r * .6); ell(r * .84, r * .28, r * .06, r * .025, .3); g.fillStyle = 'rgba(30,8,12,.7)'; g.fill(); curve([r * .7, r * .2], [r * .76, r * .3], [r * .86, r * .31], r * .02, 'rgba(70,25,25,.5)'); g.restore();
  ell(-r * .18, r * .06, r * .14, r * .21, .1); g.fillStyle = skin[1]; g.fill(); g.strokeStyle = 'rgba(40,15,15,.5)'; g.lineWidth = r * .01; g.stroke(); curve([-r * .16, -r * .06], [-r * .26, r * .06], [-r * .17, r * .16], r * .018, 'rgba(90,40,30,.5)'); curve([-r * .2, -r * .08], [-r * .08, r * .05], [-r * .2, r * .18], r * .03, 'rgba(80,35,30,.6)');
  const ex = r * .56, ey = -r * .1, ew = eyes === 'wide' ? 1.25 : 1;
  if (eyes === 'shut') { curve([ex - r * .13, ey], [ex, ey + r * .07], [ex + r * .12, ey - r * .01], r * .04, OL); for (let k = 0; k < 3; k++) line([[ex - r * .08 + k * r * .07, ey + r * .045], [ex - r * .1 + k * r * .07, ey + r * .1]], r * .02, OL); }
  else { g.beginPath(); g.moveTo(ex - r * .13, ey); g.quadraticCurveTo(ex, ey - r * .1 * ew, ex + r * .13, ey - r * .02); g.quadraticCurveTo(ex + r * .02, ey + r * .08 * ew, ex - r * .13, ey); g.closePath(); g.fillStyle = '#efe6dc'; g.fill();
    g.save(); g.clip(); circ(ex + r * (.06 + .04 * look), ey - r * .005, r * .065, '#2a1a10'); circ(ex + r * (.06 + .04 * look), ey - r * .005, r * (eyes === 'wide' ? .022 : .035), '#050305'); circ(ex + r * .045, ey - r * .03, r * .015, '#fff'); g.restore();
    g.beginPath(); g.moveTo(ex - r * .13, ey); g.quadraticCurveTo(ex, ey - r * .1 * ew, ex + r * .13, ey - r * .02); g.strokeStyle = OL; g.lineWidth = r * .035; g.stroke(); }
  curve([ex - r * .16, ey - r * .19 - (eyes === 'wide' ? r * .06 : 0)], [ex, ey - r * .26 - (eyes === 'wide' ? r * .06 : 0)], [ex + r * .17, ey - r * .17], r * .055, hair[0]);
  if (tear > 0) { const p = (t * .35) % 1; circ(ex + r * .05, ey + r * .1 + p * r * .5, r * .025, `rgba(170,210,255,${tear * (1 - p)})`); }
  if (stache) { g.beginPath(); g.moveTo(r * .62, r * .38); g.quadraticCurveTo(r * .82, r * .36, r * .84, r * .44); g.quadraticCurveTo(r * .74, r * .47, r * .6, r * .45); g.closePath(); g.fillStyle = hair[0]; g.fill(); }
  if (mouth > .05) { ell(r * .78, r * .53, r * .05, r * .03 + r * .06 * mouth); g.fillStyle = '#2a0812'; g.fill(); }
  else { g.beginPath(); g.moveTo(r * .8, r * .47); g.quadraticCurveTo(r * .74, r * .5, r * .7, r * .52); g.lineTo(r * .8, r * .52); g.closePath(); g.fillStyle = '#7a3e3a'; g.fill(); line([[r * .68, r * .525], [r * .8, r * .52]], r * .012, '#2a0c10'); g.beginPath(); g.moveTo(r * .79, r * .53); g.quadraticCurveTo(r * .76, r * .58, r * .7, r * .55); g.fillStyle = '#9a5650'; g.fill(); }
  const HP = () => { g.beginPath(); g.moveTo(r * .62, -r * .64); g.quadraticCurveTo(r * .5, -r * .92, -r * .05, -r * 1.0); g.bezierCurveTo(-r * .8, -r * 1.06, -r * 1.12, -r * .5, -r * 1.0, r * .02);
    g.quadraticCurveTo(-r * .86, r * .2, -r * .62, r * .25); g.quadraticCurveTo(-r * .62, -r * .2, -r * .32, -r * .3); g.quadraticCurveTo(r * .1, -r * .6, r * .62, -r * .64); g.closePath(); };
  HP(); g.fillStyle = rg(r * .1, -r * .9, r * .1, r * 1.2, [hair[2], hair[1], '#060505']); g.fill(); 
  g.save(); HP(); g.clip(); for (let i = 0; i < 120; i++) { const px = -r + 1.6 * r * hash(i * 2.3), py = -r * 1.05 + 1.2 * r * hash(i * 4.1); line([[px, py], [px - r * .06, py + r * .03]], r * .01, hash(i) > .5 ? 'rgba(220,210,200,.1)' : 'rgba(0,0,0,.35)'); } g.restore();
  if (sweat > 0) for (let i = 0; i < 2; i++) { const p = ((t * .4 + i * .5) % 1); g.save(); g.globalAlpha = sweat * (1 - p); const sx = r * (.42 - i * .25), sy = -r * .55 + p * r * .7; g.beginPath(); g.moveTo(sx, sy - r * .08); g.quadraticCurveTo(sx + r * .05, sy, sx, sy + r * .04); g.quadraticCurveTo(sx - r * .05, sy, sx, sy - r * .08); fs('#bfe2ff', r * .015); g.restore(); }
  g.restore();
}
// the driver from the side, at the wheel (x, y = the seat), polo shirt, a towel on his shoulder; arms to the wheel at (wx, wy)
function driverSide(x, y, s, t, o = {}) {
  const { dir = 1, wx = x + dir * .95 * s, wy = y - .6 * s, tremble = 0 } = o, tr = tremble * Math.sin(t * 31) * .006 * s, br = Math.sin(t * 1.9) * .006 * s, sh = DRV.hood;
  g.save(); g.translate(x, y); g.scale(dir, 1);
  rr(-.06 * s, -1.22 * s + br, .21 * s, .24 * s, .06 * s); g.fillStyle = lg(-.06 * s, 0, .15 * s, 0, ['#3a2216', DRV.skin[2], DRV.skin[1]]); g.fill();
  const P = () => { g.beginPath(); g.moveTo(-.24 * s, .05 * s); g.bezierCurveTo(-.34 * s, -.45 * s, -.3 * s, -.9 * s, -.12 * s, -1.04 * s + br); g.quadraticCurveTo(.02 * s, -1.12 * s + br, .16 * s, -1.03 * s + br); g.bezierCurveTo(.3 * s, -.9 * s, .3 * s, -.5 * s, .24 * s, -.2 * s); g.lineTo(.22 * s, .05 * s); g.closePath(); };
  P(); g.fillStyle = lg(-.3 * s, 0, .3 * s, 0, [sh[2], sh[1], sh[0]]); g.fill();
  g.save(); P(); g.clip(); for (let k = 0; k < 6; k++) curve([-.2 * s + k * .08 * s, -.95 * s], [-.22 * s + k * .09 * s, -.5 * s], [-.24 * s + k * .1 * s, .05 * s], .006 * s, 'rgba(8,10,20,.25)');
  g.fillStyle = lg(0, -1.05 * s, 0, -.7 * s, ['rgba(255,255,255,.15)', 'rgba(255,255,255,0)']); g.fillRect(-.4 * s, -1.1 * s, .8 * s, .4 * s); g.restore();
  P(); g.strokeStyle = 'rgba(8,8,14,.7)'; g.lineWidth = .005 * s; g.stroke();
  path([[0, -1.05 * s + br], [.2 * s, -1.0 * s + br], [.17 * s, -.88 * s + br], [.04 * s, -.95 * s + br]]); g.closePath(); g.fillStyle = sh[0]; g.fill(); g.strokeStyle = 'rgba(8,8,14,.5)'; g.lineWidth = .004 * s; g.stroke();
  for (let k = 0; k < 3; k++) circ(.2 * s, (-.86 + k * .1) * s, .012 * s, '#e8e4dc');
  g.restore();
  const s0 = [x + dir * .04 * s, y - .95 * s + br], el = [x + dir * .34 * s, y - .62 * s + tr];
  limb([s0, el, [wx, wy + tr]], .1 * s, sh, -dir); hand(wx + tr, wy + tr, .045 * s, dir > 0 ? -.4 : Math.PI + .4, { skin: DRV.skin, grip: .7 });
  headSide(x + dir * .07 * s, y - 1.3 * s + br, .19 * s, { ...o, dir, t });
}
// ---------- the white lady ----------
function hairCurtain(x, y, r, t, k = 1, part = 0, col = LADY.hair) {      // long hair falling from the crown over the face to the chest; part = a slit of face and one eye
  const len = r * 2.7 * k, sw = Math.sin(t * .8) * r * .05;
  const M = () => { g.beginPath(); g.moveTo(x - r * 1.05, y - r * .15); g.bezierCurveTo(x - r * 1.02, y - r * 1.3, x + r * 1.02, y - r * 1.3, x + r * 1.05, y - r * .15);
    g.quadraticCurveTo(x + r * 1.3 + sw, y + len * .5, x + r * 1.45 + sw, y + len);
    for (let i = 14; i >= 0; i--) { const u = i / 14; g.lineTo(x + lerp(-r * 1.45, r * 1.45, u) + sw * (1 + u), y + len - (i % 2 ? r * (.25 + .3 * hash(i * 3.3)) : 0) + Math.sin(t * 1.3 + i) * r * .04); }
    g.quadraticCurveTo(x - r * 1.3 + sw, y + len * .5, x - r * 1.05, y - r * .15); g.closePath(); };
  M(); g.fillStyle = lg(x - r, y - r, x + r * .6, y + len, [col[2], col[0], '#010102']); g.fill();
  g.save(); M(); g.clip();
  for (let i = 0; i < 46; i++) { const u = hash(i * 2.7) * 2 - 1; curve([x + u * r * .45, y - r * 1.05], [x + u * r * 1.2, y + r * .3], [x + u * r * 1.45 + sw * (1 + u) + Math.sin(t * .9 + i) * r * .05, y + len], r * (.012 + .02 * hash(i)), i % 3 ? 'rgba(130,140,175,.16)' : 'rgba(0,0,0,.5)'); }
  if (part > 0) { const pw = r * .26 * part; g.beginPath(); g.moveTo(x, y - r * .75); g.quadraticCurveTo(x + pw * 1.2, y - r * .1, x + pw * .2, y + r * .85); g.quadraticCurveTo(x - pw * .9, y - r * .1, x, y - r * .75); g.closePath();
    g.fillStyle = lg(x - pw, 0, x + pw, 0, [LADY.skin[2], LADY.skin[0], LADY.skin[1]]); g.fill();
    ell(x + pw * .15, y - r * .05, pw * .55, r * .11); g.fillStyle = '#060608'; g.fill(); circ(x + pw * .2, y - r * .05, Math.max(1, r * .03), `rgba(235,240,255,${part})`);
    for (let i = 0; i < 6; i++) curve([x + (i - 2.5) * pw * .2, y - r * .8], [x + (i - 2.5) * pw * .3, y], [x + (i - 2.5) * pw * .25, y + r * .9], r * .015, 'rgba(0,0,0,.7)'); }
  g.restore();
  for (let i = 0; i < 14; i++) { const u = hash(i * 9.1) * 2 - 1, ex = x + u * r * 1.5 + sw * 2 + Math.sin(t * 1.1 + i) * r * .08; curve([x + u * r * 1.2, y + len * .7], [ex, y + len * .9], [ex + Math.sin(t + i) * r * .1, y + len + r * (.2 + .4 * hash(i))], r * .02, col[0]); }
}
// standing, seen front or three-quarter (turn -1..1): the white dress, the hair over the face, a raised hand (arm 0..1)
function lady(x, y, h, t, o = {}) {
  const { arm = 0, turn = 0, glowA = .6, part = 0, hover = 1, lift = 0 } = o;
  const by = y - h * .02 * hover - lift, r = h * .058, hx = x + turn * h * .015, hy = by - h * .9, sway = Math.sin(t * .7) * h * .005, sh = by - h * .8, D = LADY.dress;
  if (hover) cshadow(x, y, h * .12, h * .016, .3);
  g.beginPath(); g.ellipse(hx + sway, hy, r * 1.2, r * 1.25, 0, Math.PI, TAU); g.quadraticCurveTo(hx + r * 1.5, hy + h * .2, hx + r * 1.7 + sway, by - h * .42); g.lineTo(hx - r * 1.7 + sway, by - h * .42); g.quadraticCurveTo(hx - r * 1.5, hy + h * .2, hx - r * 1.2, hy); g.closePath(); g.fillStyle = LADY.hair[0]; g.fill();
  rr(hx - r * .32, hy + r * .5, r * .64, r * 1.2, r * .2); g.fillStyle = LADY.skin[2]; g.fill();
  const P = () => { g.beginPath(); g.moveTo(hx - h * .082, sh + h * .016); g.quadraticCurveTo(hx, sh + h * .03, hx + h * .082, sh + h * .016);
    g.bezierCurveTo(x + h * .095, by - h * .66, x + h * .06, by - h * .55, x + h * .065, by - h * .5);
    g.bezierCurveTo(x + h * .09, by - h * .3, x + h * .14, by - h * .12, x + h * .17 + Math.sin(t * 1.1) * h * .01, by);
    for (let k = 12; k >= 0; k--) g.lineTo(x - h * .17 + k * h * .0283, by - (k % 2 ? h * .015 : 0) + Math.sin(t * 2 + k) * h * .006);
    g.bezierCurveTo(x - h * .14, by - h * .12, x - h * .09, by - h * .3, x - h * .065, by - h * .5);
    g.bezierCurveTo(x - h * .06, by - h * .55, x - h * .095, by - h * .66, hx - h * .082, sh + h * .016); g.closePath(); };
  P(); g.fillStyle = lg(x - h * .17, 0, x + h * .17, 0, turn > 0 ? [D[2], D[1], D[0], D[1]] : [D[1], D[0], D[1], D[2]]); g.fill();
  g.save(); P(); g.clip();
  for (let k = 0; k < 13; k++) { const u = k / 12 - .5, x0 = x + u * h * .09, x1 = x + u * h * .3 + Math.sin(t * .9 + k) * h * .008; g.fillStyle = lg(x1 - h * .02, 0, x1 + h * .02, 0, ['rgba(60,70,90,0)', `rgba(60,70,90,${.18 + .1 * hash(k)})`, 'rgba(255,255,255,.1)', 'rgba(60,70,90,0)']);
    g.beginPath(); g.moveTo(x0 - h * .006, by - h * .5); g.quadraticCurveTo((x0 + x1) / 2, by - h * .25, x1 - h * .02, by + h * .02); g.lineTo(x1 + h * .02, by + h * .02); g.quadraticCurveTo((x0 + x1) / 2 + h * .01, by - h * .25, x0 + h * .006, by - h * .5); g.closePath(); g.fill(); }
  for (let k = 0; k < 5; k++) curve([hx - h * .05 + k * h * .025, sh + h * .04], [hx - h * .055 + k * h * .027, by - h * .62], [x - h * .04 + k * h * .02, by - h * .5], h * .003, 'rgba(60,70,90,.25)');
  g.fillStyle = lg(0, by - h * .52, 0, by - h * .48, ['rgba(60,70,90,0)', 'rgba(60,70,90,.25)', 'rgba(60,70,90,0)']); g.fillRect(x - h * .2, by - h * .53, h * .4, h * .06);
  g.fillStyle = lg(0, by - h * .2, 0, by, ['rgba(200,215,240,0)', 'rgba(200,215,240,.35)']); g.fillRect(x - h * .25, by - h * .2, h * .5, h * .25);
  g.restore();
  for (const sg of [-1, 1]) {
    const s0 = [hx + sg * h * .075, sh + h * .03], up = sg > 0 ? arm : 0;
    const e = [lerp(s0[0] + sg * h * .035, s0[0] + sg * h * .11, up), lerp(s0[1] + h * .18, s0[1] - h * .07, up)], hd = [lerp(s0[0] + sg * h * .03, s0[0] + sg * h * .13, up), lerp(s0[1] + h * .35, s0[1] - h * .24, up)];
    limb([s0, e, hd], h * .03, D, -1);
    const dx = hd[0] - e[0], dy = hd[1] - e[1], dd = Math.hypot(dx, dy) || 1, wr = [hd[0] + dx / dd * h * .012, hd[1] + dy / dd * h * .012];
    line([hd, wr], h * .017, LADY.skin[1]);
    g.save(); g.translate(wr[0], wr[1]); g.rotate(Math.atan2(dy, dx)); ell(h * .018, 0, h * .022, h * .014); g.fillStyle = LADY.skin[1]; g.fill();
    for (let f = 0; f < 4; f++) { const fy = (f - 1.5) * h * .006; line([[h * .03, fy], [h * (.06 + .008 * (f === 1 || f === 2)), fy * 1.3]], h * .0055, LADY.skin[f % 2]); } line([[h * .01, sg * h * .01], [h * .035, sg * h * .022]], h * .006, LADY.skin[1]); g.restore();
  }
  ell(hx + sway, hy, r * .82, r); g.fillStyle = rg(hx, hy - r * .3, 0, r, [LADY.skin[0], LADY.skin[1]]); g.fill();
  hairCurtain(hx + sway, hy, r, t, 1.15, part);
  L(x, by - h * .5, h * .75, C.ice, .55 * glowA, .14 * glowA); L(hx, hy, h * .2, C.ice, .5 * glowA, .1 * glowA);
}
// her face, close: pale, hair parted down the middle, one eye in the dark of the hair; open = the eyes open (0..1)
function ladyFace(x, y, r, t, o = {}) {
  const { open = 1, tilt = 0, hide = .5, smile = 0 } = o;
  g.save(); g.translate(x, y); g.rotate(tilt);
  faceReal(0, 0, r, { t, skin: LADY.skin, hair: LADY.hair, female: 1, pale: 1, eyes: open > .5 ? 'dead' : 'shut', lx: 1, smile, hairStyle: 'long' });
  for (const sg of [-1, 1]) for (let i = 0; i < 26; i++) { const u = i / 25, xs = sg * r * (.06 + .15 * u), xe = sg * r * (lerp(.25, 1.0, u) + (1 - hide) * .6 * u) + Math.sin(t * .6 + i) * r * .03;
    curve([xs, -r * 1.02], [sg * r * (.5 + .5 * u), -r * .4], [xe + sg * r * .1, r * (1.9 + .6 * hash(i * 3 + sg))], r * (.025 + .035 * hash(i)), i % 4 ? LADY.hair[0] : LADY.hair[1]); }
  g.restore(); L(x, y, r * 2.4, C.ice, .6, .12);
}
// sitting in the back seat (front view, from the dashboard): only head, shoulders, hair, a white sleeve
function ladySeated(x, y, s, t, o = {}) {
  const { part = 0, a = 1 } = o; if (a <= 0) return; g.save(); g.globalAlpha *= a;
  g.beginPath(); g.moveTo(x - .55 * s, y + .9 * s); g.quadraticCurveTo(x - .5 * s, y + .2 * s, x - .2 * s, y + .1 * s); g.lineTo(x + .2 * s, y + .1 * s); g.quadraticCurveTo(x + .5 * s, y + .2 * s, x + .55 * s, y + .9 * s); g.closePath();
  g.fillStyle = lg(x - .5 * s, 0, x + .5 * s, 0, LADY.dress); g.fill();
  ell(x, y - .2 * s, .2 * s, .24 * s); g.fillStyle = LADY.skin[1]; g.fill();
  hairCurtain(x, y - .2 * s, .22 * s, t, 1.2, part); g.restore();
  L(x, y, 1.2 * s, C.ice, .5 * a, .12 * a);
}

// ---------- the taxi ----------
// side view; (x, y) = the ground under the middle, s = px per metre, dir 1 = nose to the right. door = the rear door open 0..1. inside(clip) = who sits there
function taxiSide(x, y, s, t, o = {}) {
  const { dir = 1, lights = 1, door = 0, inside = null, wheel = 0, sign = 1, old = 0 } = o, body = old ? ['#e8c84a', '#b89a2a', '#6a5614'] : PAL.taxi;
  g.save(); g.translate(x, y); g.scale(dir, 1);
  cshadow(0, 0, 2.5 * s, .14 * s, .7);
  const B = () => { g.beginPath(); g.moveTo(-2.25 * s, -.35 * s); g.quadraticCurveTo(-2.3 * s, -.8 * s, -2.1 * s, -.88 * s); g.lineTo(-1.25 * s, -.95 * s); g.lineTo(-.85 * s, -1.42 * s); g.quadraticCurveTo(-.2 * s, -1.5 * s, .55 * s, -1.42 * s); g.lineTo(1.1 * s, -.98 * s); g.lineTo(2.05 * s, -.86 * s); g.quadraticCurveTo(2.3 * s, -.78 * s, 2.28 * s, -.35 * s); g.lineTo(2.2 * s, -.25 * s); g.lineTo(-2.18 * s, -.25 * s); g.closePath(); };
  B(); g.fillStyle = lg(0, -1.5 * s, 0, -.25 * s, [body[0], body[1], body[2]]); g.fill();
  g.save(); B(); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-2.3 * s, -.9 * s, 4.6 * s, .05 * s); g.fillStyle = old ? '#2a2a2a' : PAL.stripe; g.fillRect(-2.3 * s, -.62 * s, 4.6 * s, .07 * s);
  for (const wx of [-1.45, 1.35]) { circ(wx * s, -.25 * s, .5 * s, 'rgba(0,0,0,.6)'); } g.restore();
  B(); g.strokeStyle = OL; g.lineWidth = .03 * s; g.stroke();
  const WIN = (a, b, c, d) => { g.beginPath(); g.moveTo(a * s, -.98 * s); g.lineTo(b * s, -1.36 * s); g.lineTo(c * s, -1.36 * s); g.lineTo(d * s, -.98 * s); g.closePath(); };
  const wins = [[-1.15, -.82, -.2, -.12], [-.05, -.02, .5, 1.0]];
  for (const w of wins) { WIN(...w); g.fillStyle = '#0a0d16'; g.fill(); }
  if (inside) { g.save(); g.beginPath(); for (const w of wins) { g.moveTo(w[0] * s, -.98 * s); g.lineTo(w[1] * s, -1.36 * s); g.lineTo(w[2] * s, -1.36 * s); g.lineTo(w[3] * s, -.98 * s); g.closePath(); } g.clip(); g.scale(dir, 1); inside(s, dir); g.restore(); }
  for (const w of wins) { WIN(...w); g.save(); g.clip(); g.fillStyle = lg(w[0] * s, -1.36 * s, w[3] * s, -.98 * s, ['rgba(160,180,230,.0)', 'rgba(160,180,230,.18)', 'rgba(160,180,230,0)']); g.fillRect(-3 * s, -2 * s, 6 * s, 2 * s); g.restore(); WIN(...w); g.strokeStyle = '#121218'; g.lineWidth = .05 * s; g.stroke(); }
  line([[-.12 * s, -.96 * s], [-.08 * s, -.3 * s]], .015 * s, 'rgba(0,0,0,.6)'); line([[1.05 * s, -.96 * s], [1.08 * s, -.3 * s]], .015 * s, 'rgba(0,0,0,.6)'); line([[-1.18 * s, -.95 * s], [-1.2 * s, -.3 * s]], .015 * s, 'rgba(0,0,0,.6)');
  rr(-.85 * s, -.78 * s, .22 * s, .05 * s, .02 * s); fs('#888', .01 * s); rr(.3 * s, -.78 * s, .22 * s, .05 * s, .02 * s); fs('#888', .01 * s);
  line([[-2.15 * s, -.42 * s], [2.2 * s, -.42 * s]], .025 * s, 'rgba(220,225,235,.55)');
  for (const wx of [-1.45, 1.35]) { g.beginPath(); g.arc(wx * s, -.3 * s, .44 * s, Math.PI, TAU); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = .05 * s; g.stroke(); }
  path([[1.0 * s, -.98 * s], [1.18 * s, -1.08 * s], [1.22 * s, -.98 * s]]); g.closePath(); g.fillStyle = '#16161a'; g.fill(); rr(1.1 * s, -1.13 * s, .16 * s, .1 * s, .03 * s); fs('#1c1c22', .01 * s);
  line([[-1.9 * s, -.9 * s], [-2.05 * s, -1.7 * s]], .012 * s, '#1a1a1e');
  rr(-1.75 * s, -.78 * s, .16 * s, .12 * s, .04 * s); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = .01 * s; g.stroke();
  g.save(); g.translate(-.2 * s, -.52 * s); g.scale(dir, 1); text(old ? 'MANILA' : 'BALETE TAXI', 0, 0, .1 * s, old ? '#2a2a2a' : '#1c3c7a', 'Anton'); g.restore();
  if (door > 0) { const k = Math.cos(door * 1.1); g.save(); g.translate(-1.2 * s, 0);
    g.fillStyle = '#05060a'; g.fillRect(0, -1.36 * s, 1.1 * s, 1.06 * s);
    g.beginPath(); g.moveTo(0, -.3 * s); g.lineTo(0, -.98 * s); g.lineTo(.35 * s * k, -1.36 * s - door * .1 * s); g.lineTo(1.08 * s * k, -1.36 * s - door * .12 * s); g.lineTo(1.08 * s * k, -.3 * s + door * .1 * s); g.closePath();
    g.fillStyle = lg(0, 0, 1.1 * s * k, 0, [body[1], body[0]]); g.fill(); g.strokeStyle = OL; g.lineWidth = .03 * s; g.stroke(); g.restore(); }
  if (sign) { rr(-.45 * s, -1.68 * s, .8 * s, .24 * s, .05 * s); fs(lights ? '#ffcf6a' : '#8a7a5a', .02 * s); g.save(); g.translate(-.05 * s, -1.56 * s); g.scale(dir, 1); text('TAXI', 0, 0, .17 * s, '#2a1a08', 'Anton'); g.restore(); if (lights) { L(-.05 * s, -1.56 * s, 1.4 * s, C.amb, .8 * lights, .3 * lights); F(-.05 * s, -1.56 * s, .8 * s, C.amb, .3 * lights); } }
  for (const wx of [-1.45, 1.35]) { g.save(); g.translate(wx * s, -.3 * s); circ(0, 0, .36 * s, '#0b0b0e'); circ(0, 0, .2 * s, '#8a8c94'); g.rotate(wheel); for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); line([[0, 0], [.16 * s, 0]], .035 * s, '#4a4c54'); } circ(0, 0, .06 * s, '#2a2c34'); g.restore(); }
  rr(2.08 * s, -.75 * s, .18 * s, .12 * s, .03 * s); fs(lights ? '#fff6dc' : '#aaa', .01 * s); rr(-2.28 * s, -.74 * s, .12 * s, .14 * s, .03 * s); fs(lights ? '#ff3a3a' : '#5a1a1a', .01 * s);
  if (lights) { L(2.2 * s, -.69 * s, 1.8 * s, C.warm, .95 * lights, .4 * lights); F(2.2 * s, -.69 * s, 1.6 * s, C.warm, .5 * lights);
    beam([[2.2 * s, -.78 * s], [9 * s, -1.5 * s], [9 * s, .6 * s], [2.2 * s, -.6 * s]], 2.2 * s, 0, 9 * s, 0, C.warm, .22 * lights); L(4.5 * s, -.3 * s, 3 * s, C.warm, .7 * lights, 0);
    L(-2.25 * s, -.67 * s, 1.1 * s, C.red, .9 * lights, .45 * lights); }
  g.restore();
}
// front view, coming at you; (x, y) = the ground, s = px per metre
function taxiFront(x, y, s, t, o = {}) {
  const { lights = 1, inside = null } = o;
  g.save(); g.translate(x, y); cshadow(0, 0, 1.2 * s, .12 * s, .7);
  for (const sg of [-1, 1]) { rr(sg * .78 * s - .17 * s, -.42 * s, .34 * s, .42 * s, .06 * s); fs('#0b0b0e', .02 * s); }
  const B = () => { g.beginPath(); g.moveTo(-.95 * s, -.3 * s); g.lineTo(-.98 * s, -.82 * s); g.lineTo(-.72 * s, -.95 * s); g.lineTo(-.6 * s, -1.4 * s); g.lineTo(.6 * s, -1.4 * s); g.lineTo(.72 * s, -.95 * s); g.lineTo(.98 * s, -.82 * s); g.lineTo(.95 * s, -.3 * s); g.closePath(); };
  B(); g.fillStyle = lg(-s, 0, s, 0, [PAL.taxi[1], PAL.taxi[0], PAL.taxi[2]]); g.fill(); B(); g.strokeStyle = OL; g.lineWidth = .025 * s; g.stroke();
  g.beginPath(); g.moveTo(-.66 * s, -.98 * s); g.lineTo(-.54 * s, -1.34 * s); g.lineTo(.54 * s, -1.34 * s); g.lineTo(.66 * s, -.98 * s); g.closePath(); g.fillStyle = '#0a0d16'; g.fill();
  if (inside) { g.save(); g.clip(); inside(s); g.restore(); }
  g.save(); g.clip(); g.fillStyle = lg(-.6 * s, -1.34 * s, .6 * s, -.98 * s, ['rgba(170,190,240,0)', 'rgba(170,190,240,.2)', 'rgba(170,190,240,0)']); g.fillRect(-s, -1.5 * s, 2 * s, .6 * s); g.restore();
  rr(-.42 * s, -.62 * s, .84 * s, .16 * s, .04 * s); fs('#1a1a20', .015 * s); for (let k = 0; k < 6; k++) line([[-.38 * s + k * .15 * s, -.6 * s], [-.38 * s + k * .15 * s, -.48 * s]], .01 * s, '#3a3a44');
  g.fillStyle = PAL.stripe; g.fillRect(-.97 * s, -.42 * s, 1.94 * s, .05 * s);
  rr(-.3 * s, -1.62 * s, .6 * s, .22 * s, .04 * s); fs(lights ? '#ffcf6a' : '#8a7a5a', .015 * s); text('TAXI', 0, -1.51 * s, .15 * s, '#2a1a08', 'Anton');
  rr(-.3 * s, -.3 * s, .6 * s, .14 * s, .02 * s); fs('#f2efe6', .01 * s); text('TXP 1987', 0, -.23 * s, .09 * s, '#1a1a22', 'Anton');
  for (const sg of [-1, 1]) { const lx = sg * .72 * s, ly = -.62 * s; ell(lx, ly, .15 * s, .09 * s); fs(lights ? '#fffbe8' : '#888', .015 * s);
    if (lights) { glow(lx, ly, .5 * s, C.warm, .8 * lights); L(lx, ly, 1.2 * s, C.warm, lights, .45 * lights); F(lx, ly, 2.6 * s, C.warm, .7 * lights); } }
  if (lights) L(0, -1.51 * s, .9 * s, C.amb, .7 * lights, .25 * lights);
  g.restore();
}
// a rear-view mirror (x, y = its centre, w x h, roll ang); refl() paints what it shows (clipped), then the glass sheen and the frame
function mirror(x, y, w, h, ang, refl, t, o = {}) {
  const { rosary_ = 1 } = o;
  g.save(); g.translate(x, y); g.rotate(ang);
  line([[0, -h * .5], [0, -h * 1.4]], w * .05, '#0e0e12');
  rr(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24, h * .5); fs('#121216', 4);
  g.save(); rr(-w / 2, -h / 2, w, h, h * .45); g.clip(); g.fillStyle = '#05060a'; g.fillRect(-w / 2, -h / 2, w, h); g.scale(-1, 1); refl(w, h); g.restore();
  g.save(); rr(-w / 2, -h / 2, w, h, h * .45); g.clip(); g.fillStyle = lg(-w / 2, -h / 2, w / 2, h / 2, ['rgba(200,215,255,.0)', 'rgba(200,215,255,.12)', 'rgba(200,215,255,0)', 'rgba(200,215,255,.06)']); g.fillRect(-w / 2, -h / 2, w, h); g.restore();
  rr(-w / 2, -h / 2, w, h, h * .45); g.strokeStyle = '#2a2a32'; g.lineWidth = 6; g.stroke();
  g.restore();
  if (rosary_) { const sw = Math.sin(t * 1.3) * .18 + Math.sin(t * .7) * .06, len = h * 1.9; g.save(); g.translate(x - w * .18, y + h * .45); g.rotate(sw);
    for (let k = 0; k < 22; k++) { const u = k / 21, bx = Math.sin(u * Math.PI) * w * .07, by = u * len; circ(bx, by, w * .011, '#d8cfc0'); circ(-bx, by, w * .011, '#d8cfc0'); }
    line([[0, len], [0, len + h * .45]], w * .01, '#d8cfc0'); line([[-w * .03, len + h * .22], [w * .03, len + h * .22]], w * .01, '#d8cfc0'); g.restore(); }
}
// the back seat, from the front: a bench, two headrests; sag = a dent where someone sits (0..1), at u (0..1 across)
function backSeat(x0, y0, w, h, o = {}) {
  const { sag = 0, u = .7, belt = 0, t = 0 } = o;
  g.fillStyle = lg(0, y0, 0, y0 + h, PAL.seat); g.fillRect(x0, y0, w, h);
  for (let k = 0; k < 6; k++) line([[x0 + w * (k + .5) / 6, y0 + h * .1], [x0 + w * (k + .5) / 6, y0 + h * .62]], 3, 'rgba(0,0,0,.35)');
  rr(x0 - 20, y0 + h * .6, w + 40, h * .45, 30); fs(lg(0, y0 + h * .6, 0, y0 + h, [PAL.seat[0], PAL.seat[2]]), 4);
  for (const hu of [.2, .8]) { rr(x0 + w * hu - w * .1, y0 - h * .28, w * .2, h * .3, 30); fs(lg(0, y0 - h * .28, 0, y0, [PAL.seat[0], PAL.seat[1]]), 4); line([[x0 + w * hu - w * .04, y0], [x0 + w * hu - w * .04, y0 + h * .05]], 6, '#888'); line([[x0 + w * hu + w * .04, y0], [x0 + w * hu + w * .04, y0 + h * .05]], 6, '#888'); }
  if (sag > 0) { const cx = x0 + w * u, cy = y0 + h * .72; g.fillStyle = rg(cx, cy, 0, w * .2, [`rgba(0,0,0,${.6 * sag})`, 'rgba(0,0,0,0)']); g.save(); g.translate(cx, cy); g.scale(1, .35); g.translate(-cx, -cy); g.fillRect(cx - w * .2, cy - w * .2, w * .4, w * .4); g.restore();
    for (let k = 0; k < 5; k++) curve([cx - w * .16 + k * w * .08, cy - h * .08], [cx - w * .12 + k * w * .06, cy + h * .02 * sag], [cx - w * .1 + k * w * .05, cy + h * .12], 2, `rgba(255,220,200,${.12 * sag})`);
    g.fillStyle = rg(cx, y0 + h * .35, 0, w * .16, [`rgba(0,0,0,${.4 * sag})`, 'rgba(0,0,0,0)']); g.fillRect(cx - w * .2, y0, w * .4, h * .6); }
  if (belt) { const sw = Math.sin(t * 2.2) * 12 * belt; line([[x0 + w * .95, y0 - h * .1], [x0 + w * .78 + sw, y0 + h * .5], [x0 + w * .6 + sw * .5, y0 + h * .75]], 16, '#16161a'); }
}
function meter(x, y, s, t, txt = '40.00') {        // the taxi meter, red digits
  rr(x - 1.1 * s, y - .4 * s, 2.2 * s, .8 * s, .1 * s); fs('#16161a', .04 * s); rr(x - .95 * s, y - .25 * s, 1.9 * s, .5 * s, .05 * s); fs('#1c0606', .02 * s);
  g.save(); g.shadowColor = 'rgba(255,40,40,.9)'; g.shadowBlur = .3 * s; text(txt, x, y + .02 * s, .42 * s, '#ff4038', 'Anton'); g.restore(); L(x, y, 2.4 * s, C.red, .9, .35); F(x, y, 1.2 * s, C.red, .2);
}

// ---------- the balete ----------
// a huge strangler fig: a trunk of braided strands, buttress roots, wide limbs, curtains of hanging aerial roots, dark leaf masses
function balete(x, y, s, t, o = {}) {
  const { col = ['#4a4038', '#2a241e', '#120e0a'], roots = 1, leaves = 1, lit = 0 } = o;
  if (leaves) for (let i = 0; i < 70; i++) { const a = hash(i * 2.7) * Math.PI, rr_ = s * (2.2 + 2.2 * hash(i * 5.1)), lx = x + Math.cos(a) * rr_ * 1.6 * (hash(i) > .5 ? 1 : -1), ly = y - s * 5.2 - Math.sin(a) * rr_ * .7, R = s * (.7 + .9 * hash(i * 3.3));
    g.fillStyle = rg(lx - R * .3, ly - R * .4, R * .1, R, [i % 5 ? '#1c2a1e' : '#2c3e2c', '#101a12', 'rgba(8,12,9,0)']); g.beginPath(); g.arc(lx + Math.sin(t * .4 + i) * s * .03, ly, R, 0, TAU); g.fill(); }
  for (const [sg, ang, len, yy] of [[-1, .55, 4.2, 4.0], [1, .5, 4.6, 3.7], [-1, .25, 3.0, 5.0], [1, .2, 3.4, 5.3], [-1, .9, 2.4, 3.2], [1, .95, 2.6, 2.9]]) {
    const sx = x + sg * s * .4, sy = y - s * yy, ex = sx + sg * Math.cos(ang) * len * s, ey = sy - Math.sin(ang) * len * s * .8;
    curve([sx, sy], [(sx + ex) / 2, sy - s * .8], [ex, ey], s * .42 * (1.2 - yy * .12), col[2]); curve([sx, sy - s * .08], [(sx + ex) / 2, sy - s * .88], [ex, ey], s * .18, col[1]);
    if (roots) for (let k = 0; k < 26; k++) { const u = .15 + .85 * hash(k * 1.3 + yy), px = lerp(sx, ex, u), py = lerp(sy, ey, u) - Math.sin(u * Math.PI) * s * .5, Lr = s * (2.2 + 3.6 * hash(k * 7.7 + sg)), sw_ = Math.sin(t * .5 + k + yy) * s * .08;
      curve([px, py], [px + sw_ * .5, py + Lr * .5], [px + sw_, py + Lr], s * (.025 + .03 * hash(k)), k % 3 ? col[2] : col[1]); }
  }
  for (let k = 0; k < 22; k++) { const u = k / 21 - .5, bx = x + u * s * 2.6, w = s * (.14 + .12 * hash(k * 3.1));
    const pts = []; for (let j = 0; j <= 10; j++) { const v = j / 10; pts.push([lerp(bx + u * s * 1.6 * (1 - v) ** 3, x + u * s * .9 + Math.sin(v * 7 + k) * s * .12, v), y - v * s * 5.6]); }
    line(pts, w + s * .05, '#060504'); line(pts, w, k % 2 ? col[1] : col[0]); g.save(); g.translate(-w * .25, 0); line(pts, w * .3, `rgba(200,190,170,${.12 + .1 * hash(k)})`); g.restore(); }
  for (let k = 0; k < 9; k++) { const sg = k % 2 ? 1 : -1, len = s * (1.4 + 1.6 * hash(k * 4.4)); curve([x + sg * s * .5, y - s * .9], [x + sg * (s * .8 + len * .4), y - s * .2], [x + sg * (s * .7 + len), y + s * .05], s * .22, col[1]); }
  if (lit) { L(x, y - s * 2, s * 4, C.warm, .6 * lit, .05 * lit); }
}
// a sodium street lamp: a pole, an arm, an orange head, a cone of light the rain falls through
function streetLamp(x, y, h, t, o = {}) {
  const { on = 1, side = 1 } = o, hx = x + side * h * .32, hy = y - h * .96;
  line([[x, y], [x, y - h]], h * .025, '#141418'); curve([x, y - h], [x + side * h * .05, y - h * 1.04], [hx, hy], h * .016, '#141418');
  rr(hx - h * .06, hy - h * .015, h * .12, h * .035, h * .012); fs('#202024', 2);
  if (on > 0) { ell(hx, hy + h * .02, h * .045, h * .012); g.fillStyle = '#ffd08a'; g.fill(); glow(hx, hy + h * .02, h * .12, C.sodium, .7 * on); L(hx, hy + h * .3, h * .75, C.sodium, .95 * on, .3 * on); F(hx, hy + h * .02, h * .4, C.sodium, .35 * on);
    beam([[hx - h * .04, hy + h * .02], [hx + h * .04, hy + h * .02], [hx + h * .32, y], [hx - h * .32, y]], hx, hy, hx, y, C.sodium, .2 * on); }
}
// a green street sign on a post
function streetSign(x, y, h, txt) { line([[x, y], [x, y - h]], h * .03, '#2a2e34'); rr(x - h * .42, y - h * 1.05, h * .84, h * .2, h * .02); fs('#1f6a3a', h * .01); rr(x - h * .4, y - h * 1.04, h * .8, h * .18, h * .015); g.strokeStyle = '#e8f0e8'; g.lineWidth = h * .008; g.stroke(); text(txt, x, y - h * .95, h * .12, '#f2f6f2', 'Anton'); }

TEX.asphalt = paint(mk(512, 512), (w, h) => { g.fillStyle = '#26272e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { const v = hash(i * 1.13); g.fillStyle = v > .7 ? 'rgba(200,205,220,.12)' : v > .35 ? 'rgba(0,0,0,.25)' : 'rgba(120,125,140,.1)'; g.fillRect(hash(i * 2.31) * w, hash(i * 3.77) * h, 1 + 2 * hash(i * 5.1), 1 + 2 * hash(i * 6.3)); }
  for (let i = 0; i < 14; i++) { const x = hash(i * 9.1) * w, y = hash(i * 4.7) * h, R = 30 + 60 * hash(i); g.fillStyle = rg(x, y, 0, R, ['rgba(120,140,190,.12)', 'rgba(120,140,190,0)']); g.save(); g.translate(x, y); g.scale(1.8, .5); g.translate(-x, -y); g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore(); }
  for (let i = 0; i < 6; i++) { let x = hash(i * 7.7) * w, y = hash(i * 8.8) * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (hash(i * 13 + k) - .5) * 40; y += 10 + 20 * hash(i + k); g.lineTo(x, y); } g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.stroke(); } });
function asphalt(fn, a = .9) { g.save(); fn(); g.clip(); g.globalAlpha = a; g.fillStyle = pat(TEX.asphalt); g.fillRect(-3000, -3000, 7000, 8000); g.restore(); }
// ---------- the old house on Balete Drive (bahay na bato) ----------
TEX.adobe = paint(mk(400, 300), (w, h) => { g.fillStyle = '#6a5e50'; g.fillRect(0, 0, w, h);
  for (let r = 0, y = 0; y < h; y += 50, r++) for (let x = (r % 2) * -50; x < w; x += 100) { const v = hash(x * 1.3 + y * 2.1); rr(x + 3, y + 3, 94, 44, 6); g.fillStyle = `rgb(${110 + 30 * v},${98 + 26 * v},${80 + 20 * v})`; g.fill(); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,240,220' : '0,0,0'},.07)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.9) * h, 2, 2); }
  for (let i = 0; i < 12; i++) { const x = hash(i * 7) * w; g.fillStyle = lg(0, 0, 0, h, ['rgba(20,40,20,.0)', 'rgba(20,40,20,.35)']); g.fillRect(x, 0, 20 + 30 * hash(i), h); } });
TEX.capiz = paint(mk(120, 120), (w, h) => { g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, w, h); for (let k = 0; k <= 4; k++) { g.fillStyle = '#3a2614'; g.fillRect(k * 30 - 2, 0, 4, h); g.fillRect(0, k * 30 - 2, w, 4); }
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = `rgba(255,250,230,${.1 + .2 * hash(r * 4 + c)})`; g.fillRect(c * 30 + 4, r * 30 + 4, 22, 22); } });
TEX.wood = paint(mk(300, 300), (w, h) => { g.fillStyle = '#4a3020'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 25) { g.fillStyle = `rgba(0,0,0,${.25 + .2 * hash(x)})`; g.fillRect(x, 0, 3, h); for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(255,220,180,.06)'; g.fillRect(x + 6 + k * 4, 0, 1, h); } } });
function bahay(x, y, s, t, o = {}) {      // (x, y) = ground under its middle, s = px per metre
  const { day = 0, glowWin = -1 } = o, w = 11 * s, x0 = x - w / 2;
  g.save(); g.translate(x0, y - 3.2 * s); g.fillStyle = pat(TEX.adobe); g.fillRect(0, 0, w, 3.2 * s); g.restore();
  for (const u of [.12, .5, .88]) { rr(x0 + u * w - .7 * s, y - 2.6 * s, 1.4 * s, 2.6 * s, [.7 * s, .7 * s, 0, 0]); fs('#0c0a08', .04 * s); }
  g.fillStyle = '#2a1a0e'; g.fillRect(x0 - .5 * s, y - 3.4 * s, w + s, .3 * s);
  g.save(); g.translate(x0 - .5 * s, y - 6.6 * s); g.fillStyle = pat(TEX.wood); g.fillRect(0, 0, w + s, 3.2 * s); g.restore();
  for (let k = 0; k < 5; k++) { const wx = x0 + (.2 + k * 2.15) * s, wy = y - 6.1 * s; rr(wx, wy, 1.7 * s, 1.8 * s, .05 * s); fs('#1a1008', .05 * s);
    g.save(); g.translate(wx + .1 * s, wy + .1 * s); g.fillStyle = pat(TEX.capiz); g.fillRect(0, 0, 1.5 * s, 1.6 * s); g.restore();
    g.fillStyle = k === glowWin ? 'rgba(255,190,110,.0)' : `rgba(8,8,14,${day ? .35 : .82})`; g.fillRect(wx + .1 * s, wy + .1 * s, 1.5 * s, 1.6 * s);
    if (k === glowWin) L(wx + .85 * s, wy + .9 * s, 2 * s, C.candle, .7, .3);
    for (let j = 0; j < 6; j++) line([[wx + .15 * s + j * .28 * s, wy + 1.95 * s], [wx + .15 * s + j * .28 * s, wy + 2.55 * s]], .06 * s, '#2a1a0e'); g.strokeStyle = '#2a1a0e'; g.lineWidth = .06 * s; g.strokeRect(wx, wy + 1.9 * s, 1.7 * s, .7 * s); }
  path([[x0 - 1.4 * s, y - 6.5 * s], [x0 + 1.5 * s, y - 9.2 * s], [x0 + w - 1.5 * s, y - 9.2 * s], [x0 + w + 1.4 * s, y - 6.5 * s]]); g.closePath(); g.fillStyle = lg(0, y - 9.2 * s, 0, y - 6.5 * s, ['#3a2420', '#5a3428']); g.fill(); g.strokeStyle = OL; g.lineWidth = .06 * s; g.stroke();
  for (let k = 0; k < 9; k++) { const v = k / 9; line([[lerp(x0 - 1.4 * s, x0 + 1.5 * s, v), lerp(y - 6.5 * s, y - 9.2 * s, v)], [lerp(x0 + w + 1.4 * s, x0 + w - 1.5 * s, v), lerp(y - 6.5 * s, y - 9.2 * s, v)]], .04 * s, 'rgba(0,0,0,.35)'); }
  for (let k = 0; k < 40; k++) { const v = hash(k * 2.2), sx = lerp(x0 - 1.2 * s, x0 + w + 1.2 * s, v); line([[sx, y - 6.6 * s], [sx + (hash(k) - .5) * .2 * s, y - 6.6 * s + .3 * s + 1.2 * s * hash(k * 3)]], .02 * s, '#1e2a1a'); }
}
function gate(x, y, s, t, o = {}) {     // stone posts and an iron gate; open = 0..1
  const { open = 0 } = o;
  for (const sg of [-1, 1]) { const px = x + sg * 2.1 * s; g.save(); g.translate(px - .35 * s, y - 2.6 * s); g.fillStyle = pat(TEX.adobe); g.fillRect(0, 0, .7 * s, 2.6 * s); g.restore(); rr(px - .45 * s, y - 2.8 * s, .9 * s, .25 * s, .05 * s); fs('#4a4238', .03 * s); circ(px, y - 2.95 * s, .18 * s, '#5a5246'); }
  for (const sg of [-1, 1]) { const k = 1 - open * .75, gx0 = x + sg * .05 * s, gx1 = x + sg * 1.75 * s * k;
    for (let j = 0; j <= 10; j++) { const bx = lerp(gx0, gx1, j / 10); line([[bx, y - .1 * s], [bx, y - 2.1 * s - Math.sin(j / 10 * Math.PI) * .3 * s]], .05 * s, '#121214'); circ(bx, y - 2.2 * s - Math.sin(j / 10 * Math.PI) * .3 * s, .06 * s, '#121214'); }
    for (const yy of [.4, 1.2, 1.9]) line([[gx0, y - yy * s], [gx1, y - yy * s]], .06 * s, '#121214'); }
}

// ---------- small things ----------
function sampaguita(x, y, s, t, o = {}) {        // a garland of jasmine: little white star flowers on a string
  const { n = 26, wet = 0 } = o;
  for (let k = 0; k < n; k++) { const a = k / n * TAU, fx = x + Math.cos(a) * s, fy = y + Math.sin(a) * s * .45;
    g.save(); g.translate(fx, fy); g.rotate(k); for (let p = 0; p < 5; p++) { g.rotate(TAU / 5); ell(s * .055, 0, s * .06, s * .03); g.fillStyle = '#f6f2e6'; g.fill(); } circ(0, 0, s * .025, '#e8d890'); g.restore(); }
  L(x, y, s * 2.2, C.white, .5, .12);
}
function candle(x, y, s, t, k = 1) {
  rr(x - .12 * s, y - s, .24 * s, s, .04 * s); fs(lg(x - .12 * s, 0, x + .12 * s, 0, ['#f4ead2', '#d8c8a4', '#a8987a']), .02 * s);
  for (let j = 0; j < 3; j++) curve([x - .1 * s + j * .1 * s, y - s], [x - .11 * s + j * .1 * s, y - s * .8], [x - .1 * s + j * .1 * s, y - s * (.6 - .2 * hash(j))], .03 * s, '#efe4c8');
  const f = flick(t + x), fh = .32 * s * f * k; g.beginPath(); g.moveTo(x, y - s - fh); g.quadraticCurveTo(x + .1 * s, y - s - fh * .3, x, y - s + .02 * s); g.quadraticCurveTo(x - .1 * s, y - s - fh * .3, x, y - s - fh); g.fillStyle = '#ffe2a0'; g.fill();
  glow(x, y - s - fh * .4, .5 * s, C.candle, .6 * k); L(x, y - s - .1 * s, 4 * s * f, C.candle, .9 * k, .3 * k);
}
function smoke(x, y, s, t, a = .3) {      // curls of candle smoke rising
  for (let i = 0; i < 14; i++) { const p = ((t * .18 + i / 14) % 1), sx = x + Math.sin(p * 6 + i) * s * .3 * p + Math.sin(t * .5 + i) * s * .05, sy = y - p * s * 3; circ(sx, sy, s * (.06 + .22 * p), `rgba(210,215,225,${a * Math.sin(Math.PI * p) * .5})`); }
}
function mistBand(t, y0, a = .2, c = '150,170,210') {
  reset(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) { const x = ((hash(i * 3.1) * 1600 + t * (14 + 10 * hash(i))) % 1900) - 400, y = y0 + (hash(i * 5.7) - .3) * 260, w = 500 + 400 * hash(i);
    g.fillStyle = rg(x, y, 0, w, [`rgba(${c},${a * (.5 + .5 * hash(i + 2))})`, `rgba(${c},0)`]); g.save(); g.translate(x, y); g.scale(1, .22); g.translate(-x, -y); g.fillRect(x - w, y - w, 2 * w, 2 * w); g.restore(); }
  reset();
}
function nightSky(t, o = {}) {      // heavy rain clouds lit faintly from the city below
  grad(o.top || '#05070f', o.bot || '#1a1e30', -600, 1800);
  for (let i = 0; i < 14; i++) { const x = ((hash(i * 4.1) * 1800 + t * 8 * (1 + hash(i))) % 2200) - 500, y = hash(i * 2.3) * 900 - 200, R = 300 + 300 * hash(i * 7);
    g.fillStyle = rg(x, y, 0, R, [`rgba(60,64,90,${.25 + .2 * hash(i)})`, 'rgba(60,64,90,0)']); g.save(); g.translate(x, y); g.scale(1, .45); g.translate(-x, -y); g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore(); }
}

// ==================== realistic people: adult proportions, painted shading, thin outlines ====================
// a face, front (turn -1..1 moves the features for a three-quarter look). r = half the head height.
// eyes open | wide | shut | dead. female, age (wrinkles), stache, hairStyle short | long | bun, glasses
function faceReal(x, y, r, o = {}) {
  const { skin = DRV.skin, hair = DRV.hair, eyes = 'open', look = 0, lookY = 0, mouth = 0, turn = 0, stache = 0, female = 0, sweat = 0, t = 0, rim = null, lx = -1, age = 0, glasses = 0, tear = 0, smile = 0, pale = 0, iris = '#3a2416' } = o;
  const hairStyle = o.hairStyle || (female ? 'long' : 'short');
  const w = r * (female ? .74 : .79), cx = x + turn * w * .2, dead = eyes === 'dead', sk = skin;
  if (hairStyle === 'long') { g.beginPath(); g.ellipse(x, y - r * .1, w * 1.25, r * 1.12, 0, Math.PI, TAU); g.lineTo(x + w * 1.45, y + r * 2.4); g.lineTo(x - w * 1.45, y + r * 2.4); g.closePath(); g.fillStyle = lg(x, y - r, x, y + r * 2.4, [hair[1], hair[0], '#020203']); g.fill(); }
  g.fillStyle = lg(x - w * .5, 0, x + w * .5, 0, [sk[2], sk[1], sk[2]]); g.fillRect(x - w * .48, y + r * .5, w * .96, r * 1.0);
  g.fillStyle = lg(0, y + r * .7, 0, y + r * 1.1, ['rgba(20,8,10,.55)', 'rgba(20,8,10,0)']); g.fillRect(x - w * .48, y + r * .7, w * .96, r * .4);
  for (const sg of [-1, 1]) { const ex = x + sg * w * .96 - turn * w * .1, ey = y + r * .05; ell(ex, ey, w * .13, r * .2, sg * .12); g.fillStyle = sg === lx ? sk[1] : sk[2]; g.fill(); curve([ex - sg * w * .02, ey - r * .12], [ex + sg * w * .07, ey], [ex - sg * w * .01, ey + r * .12], r * .018, 'rgba(70,25,25,.45)'); }
  const P = () => { g.beginPath(); g.moveTo(x, y - r); g.bezierCurveTo(x + w * .96, y - r, x + w * 1.03, y - r * .25, x + w * .96, y + r * .15); g.bezierCurveTo(x + w * .88, y + r * .6, x + w * .5, y + r * .97, cx, y + r); g.bezierCurveTo(x - w * .5, y + r * .97, x - w * .88, y + r * .6, x - w * .96, y + r * .15); g.bezierCurveTo(x - w * 1.03, y - r * .25, x - w * .96, y - r, x, y - r); g.closePath(); };
  P(); g.fillStyle = rg(x + lx * w * .35, y - r * .25, r * .1, r * 1.35, [sk[0], sk[1], sk[2]]); g.fill();
  const ey = y - r * .02, ew = w * .24, eh = r * (eyes === 'wide' ? .085 : .062), EX = sg => cx + sg * w * .42 * (1 - sg * turn * .18);
  g.save(); P(); g.clip();
  g.fillStyle = lg(x - lx * w, 0, x + lx * w * .2, 0, ['rgba(25,8,14,.5)', 'rgba(25,8,14,0)']); g.fillRect(x - w * 1.1, y - r * 1.1, w * 2.2, r * 2.2);
  g.fillStyle = lg(0, y + r * .55, 0, y + r, ['rgba(25,8,14,0)', 'rgba(25,8,14,.35)']); g.fillRect(x - w, y + r * .55, 2 * w, r * .5);
  for (const sg of [-1, 1]) { const ex = EX(sg); g.fillStyle = rg(ex, ey - eh * .3, 0, ew * 1.5, [`rgba(40,14,24,${.38 + .3 * dead + .2 * age})`, 'rgba(40,14,24,0)']); g.fillRect(ex - ew * 2, ey - ew * 2, ew * 4, ew * 4);
    g.fillStyle = rg(ex + sg * w * .08, y + r * .3, 0, w * .32, [pale ? 'rgba(200,210,230,.1)' : `rgba(230,110,100,${female ? .2 : .1})`, 'rgba(230,110,100,0)']); g.fillRect(ex - w * .4, y, w * .8, r * .6);
    g.fillStyle = rg(ex + sg * w * .12, y + r * .12, 0, w * .2, [`rgba(255,240,225,${sg === lx ? .18 : .05})`, 'rgba(255,240,225,0)']); g.fillRect(ex - w * .3, y - r * .1, w * .6, r * .5); }
  g.fillStyle = rg(cx, y + r * .42, 0, w * .25, ['rgba(30,10,15,.3)', 'rgba(30,10,15,0)']); g.fillRect(cx - w * .3, y + r * .3, w * .6, r * .3);
  g.fillStyle = rg(cx, y + r * .82, 0, w * .3, ['rgba(30,10,15,.25)', 'rgba(30,10,15,0)']); g.fillRect(cx - w * .4, y + r * .62, w * .8, r * .4);
  if (!female) for (let i = 0; i < 240; i++) { const a = hash(i * 1.7) * Math.PI, q = .55 + .42 * hash(i * 3.1), px = cx + Math.cos(a) * w * .9 * q, py = y + r * .2 + Math.sin(a) * r * .8 * q; if (Math.abs(px - cx) < w * .22 && py < y + r * .62 && py > y + r * .38) continue; g.fillStyle = 'rgba(30,22,26,.22)'; g.fillRect(px, py, 1.6, 1.6); }
  if (age > 0) { for (const sg of [-1, 1]) { const ex = EX(sg); for (let k = 0; k < 3; k++) curve([ex + sg * ew * 1.05, ey - eh + k * eh * .9], [ex + sg * ew * 1.35, ey + k * eh], [ex + sg * ew * 1.55, ey - eh * .4 + k * eh * 1.3], r * .008, `rgba(60,25,25,${.35 * age})`);
      curve([cx + sg * w * .2, y + r * .35], [cx + sg * w * .34, y + r * .55], [cx + sg * w * .3, y + r * .74], r * .012, `rgba(60,25,25,${.4 * age})`); }
    for (let k = 0; k < 3; k++) curve([cx - w * .45, y - r * .5 - k * r * .08], [cx, y - r * .53 - k * r * .08], [cx + w * .45, y - r * .5 - k * r * .08], r * .008, `rgba(60,25,25,${.25 * age})`); }
  if (rim) { g.globalAlpha = .75; g.translate(-lx * r * .035, 0); P(); g.lineWidth = r * .07; g.strokeStyle = rim; g.stroke(); }
  g.restore();
  P(); g.strokeStyle = 'rgba(15,6,10,.65)'; g.lineWidth = r * .012; g.stroke();
  for (const sg of [-1, 1]) {
    const ex = EX(sg), ix = ex + look * ew * .45, iy = ey + lookY * eh * .4;
    curve([ex - ew * 1.05, ey - eh * 1.75], [ex, ey - eh * 2.6], [ex + ew * 1.05, ey - eh * 1.6], r * .012, 'rgba(60,25,30,.45)');
    if (eyes === 'shut') { curve([ex - ew, ey], [ex, ey + eh * .8], [ex + ew, ey - eh * .1], r * .02, '#1a0c10'); for (let k = 0; k < 5; k++) line([[ex - ew * .7 + k * ew * .35, ey + eh * .55], [ex - ew * .75 + k * ew * .35, ey + eh * .95]], r * .007, '#1a0c10'); }
    else {
      const A = () => { g.beginPath(); g.moveTo(ex - ew, ey + eh * .1); g.bezierCurveTo(ex - ew * .45, ey - eh * 1.45, ex + ew * .5, ey - eh * 1.4, ex + ew, ey - eh * .05); g.bezierCurveTo(ex + ew * .45, ey + eh * 1.05, ex - ew * .45, ey + eh * 1.1, ex - ew, ey + eh * .1); g.closePath(); };
      A(); g.fillStyle = dead ? '#cfc8b8' : lg(0, ey - eh, 0, ey + eh, ['#b8aca2', '#ece4da']); g.fill();
      g.save(); A(); g.clip();
      if (dead) { g.strokeStyle = 'rgba(150,40,50,.6)'; g.lineWidth = r * .004; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(ex + (k % 2 ? ew : -ew), ey + (hash(k) - .5) * eh); g.lineTo(ex + (k % 2 ? ew * .4 : -ew * .4), ey + (hash(k + 3) - .5) * eh); g.stroke(); } }
      const ir = eh * (eyes === 'wide' ? .82 : 1.05);
      circ(ix, iy, ir, rg(ix, iy, ir * .1, ir, dead ? ['#f4f6f8', '#c8d0d6', '#8a949c'] : ['#7a5236', iris, '#120a06']));
      if (!dead) for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; line([[ix + Math.cos(a) * ir * .35, iy + Math.sin(a) * ir * .35], [ix + Math.cos(a) * ir * .85, iy + Math.sin(a) * ir * .85]], r * .004, 'rgba(255,220,170,.18)'); }
      circ(ix, iy, ir * (dead ? .18 : eyes === 'wide' ? .32 : .42), dead ? 'rgba(80,90,100,.7)' : '#050304');
      g.fillStyle = lg(0, ey - eh * 1.2, 0, ey, ['rgba(20,8,10,.6)', 'rgba(20,8,10,0)']); g.fillRect(ex - ew, ey - eh * 1.4, ew * 2, eh * 1.4);
      if (!dead) { circ(ix - ir * .35, iy - ir * .4, ir * .22, 'rgba(255,255,255,.9)'); circ(ix + ir * .3, iy + ir * .25, ir * .08, 'rgba(255,255,255,.5)'); }
      g.restore();
      g.beginPath(); g.moveTo(ex - ew * 1.05, ey + eh * .12); g.bezierCurveTo(ex - ew * .45, ey - eh * 1.5, ex + ew * .5, ey - eh * 1.45, ex + ew * 1.05, ey - eh * .05); g.strokeStyle = '#120608'; g.lineWidth = r * (female ? .024 : .017); g.stroke();
      curve([ex - ew * .9, ey + eh * .4], [ex, ey + eh * 1.25], [ex + ew * .9, ey + eh * .2], r * .008, 'rgba(90,40,40,.55)');
      if (dead || age) curve([ex - ew * .8, ey + eh * 1.5], [ex, ey + eh * 2.3], [ex + ew * .8, ey + eh * 1.4], r * .01, `rgba(60,20,40,${dead ? .6 : .3})`);
    }
    const by = ey - eh * (eyes === 'wide' ? 3.6 : 2.9), bw = female ? r * .022 : r * .042;
    g.beginPath(); g.moveTo(ex - sg * ew * 1.1, by + eh * (eyes === 'wide' ? -.4 : .3)); g.quadraticCurveTo(ex - sg * ew * .1, by - eh * .9, ex + sg * ew * 1.2, by + eh * .5); g.strokeStyle = hair[0]; g.lineWidth = bw; g.lineCap = 'round'; g.stroke();
    for (let k = 0; k < 8; k++) { const u = k / 7, bx = lerp(ex - sg * ew * 1.05, ex + sg * ew * 1.1, u), byy = by - eh * .45 * Math.sin(u * Math.PI) + eh * .2; line([[bx, byy + bw * .4], [bx + sg * ew * .12, byy - bw * .5]], r * .006, hair[0]); }
    if (tear > 0 && sg === 1) { const p = (t * .3) % 1; circ(ex + ew * .3, ey + eh * 1.6 + p * r * .5, r * .018, `rgba(190,220,255,${tear * (1 - p)})`); line([[ex + ew * .3, ey + eh * 1.3], [ex + ew * .3, ey + eh * 1.6 + p * r * .5]], r * .006, `rgba(190,220,255,${.4 * tear})`); }
  }
  g.beginPath(); g.moveTo(cx - lx * w * .05, ey - r * .02); g.quadraticCurveTo(cx - lx * w * .1, y + r * .2, cx - lx * w * .12, y + r * .33); g.strokeStyle = 'rgba(60,20,25,.3)'; g.lineWidth = r * .02; g.stroke();
  circ(cx + lx * w * .02, y + r * .3, w * .06, 'rgba(255,235,220,.25)');
  for (const sg of [-1, 1]) { curve([cx + sg * w * .1, y + r * .3], [cx + sg * w * .19, y + r * .36], [cx + sg * w * .1, y + r * .41], r * .016, 'rgba(70,25,25,.6)'); ell(cx + sg * w * .07, y + r * .405, w * .035, r * .015, sg * .3); g.fillStyle = 'rgba(30,8,12,.75)'; g.fill(); }
  const my = y + r * .58, mw = w * (.33 + .05 * smile);
  for (const sg of [-1, 1]) line([[cx + sg * w * .035, y + r * .44], [cx + sg * w * .04, my - r * .04]], r * .008, 'rgba(70,25,25,.25)');
  if (mouth > .05) { ell(cx, my + r * .03, mw * .6, r * (.02 + .07 * mouth)); g.fillStyle = '#1e060c'; g.fill(); }
  const lipc = pale ? '#8a8494' : female ? '#a8505a' : '#8a4a46';
  g.beginPath(); g.moveTo(cx - mw, my); g.quadraticCurveTo(cx - mw * .4, my - r * .055, cx, my - r * .025); g.quadraticCurveTo(cx + mw * .4, my - r * .055, cx + mw, my); g.quadraticCurveTo(cx, my + r * .01, cx - mw, my); g.fillStyle = lipc; g.fill();
  g.beginPath(); g.moveTo(cx - mw * .9, my + r * .005); g.quadraticCurveTo(cx, my + r * .075, cx + mw * .9, my + r * .005); g.quadraticCurveTo(cx, my + r * .02, cx - mw * .9, my + r * .005); g.fillStyle = mixHex(lipc, '#e8b0a0', .25); g.fill();
  circ(cx + lx * mw * .2, my + r * .04, r * .012, 'rgba(255,240,230,.35)');
  g.beginPath(); g.moveTo(cx - mw * 1.02, my + (smile ? -r * .02 : r * .005)); g.quadraticCurveTo(cx, my + r * .012 + smile * r * .03, cx + mw * 1.02, my + (smile ? -r * .02 : r * .005)); g.strokeStyle = '#2a0c10'; g.lineWidth = r * .01; g.stroke();
  if (stache) { g.beginPath(); g.moveTo(cx - mw * 1.15, my + r * .02); g.quadraticCurveTo(cx - mw * .5, my - r * .11, cx, my - r * .07); g.quadraticCurveTo(cx + mw * .5, my - r * .11, cx + mw * 1.15, my + r * .02); g.quadraticCurveTo(cx + mw * .5, my - r * .03, cx, my - r * .04); g.quadraticCurveTo(cx - mw * .5, my - r * .03, cx - mw * 1.15, my + r * .02); g.fillStyle = hair[0]; g.fill(); for (let k = 0; k < 16; k++) { const u = k / 15 - .5; line([[cx + u * mw * 1.8, my - r * .08 + Math.abs(u) * r * .05], [cx + u * mw * 2.0, my - r * .02 + Math.abs(u) * r * .06]], r * .005, hair[1]); } }
  if (hairStyle === 'short') {
    const HP = () => { g.beginPath(); g.moveTo(x - w * 1.0, y + r * .02); g.bezierCurveTo(x - w * 1.1, y - r * 1.42, x + w * 1.1, y - r * 1.42, x + w * 1.0, y + r * .02);
      g.lineTo(x + w * .9, y - r * .3); for (let i = 0; i <= 10; i++) { const u = 1 - i / 10; g.lineTo(x + lerp(-w * .9, w * .9, u), y - r * (.56 + .05 * Math.sin(u * Math.PI)) + (hash(i * 3.3) - .5) * r * .04); } g.lineTo(x - w * .9, y - r * .3); g.closePath(); };
    HP(); g.fillStyle = rg(x + lx * w * .3, y - r * .95, r * .05, r * 1.1, [hair[1], hair[0], '#050404']); g.fill();
    g.save(); HP(); g.clip(); for (let i = 0; i < 90; i++) { const px = x + (hash(i * 2.1) - .5) * w * 2, py = y - r * (.3 + .7 * hash(i * 4.3)); line([[px, py], [px + (px - x) * .05, py - r * .05]], r * .008, hash(i) > .5 ? 'rgba(200,190,180,.12)' : 'rgba(0,0,0,.35)'); } g.restore();
  } else if (hairStyle === 'bun') {
    circ(x, y - r * 1.1, r * .32, hair[1]); for (let k = 0; k < 10; k++) curve([x - r * .25, y - r * 1.02], [x, y - r * (1.25 - .04 * k)], [x + r * .25, y - r * 1.0], r * .01, 'rgba(90,90,96,.5)');
    g.beginPath(); g.moveTo(x - w * 1.0, y + r * .05); g.bezierCurveTo(x - w * 1.1, y - r * 1.42, x + w * 1.1, y - r * 1.42, x + w * 1.0, y + r * .05); g.quadraticCurveTo(x + w * .7, y - r * .55, x, y - r * .62); g.quadraticCurveTo(x - w * .7, y - r * .55, x - w * 1.0, y + r * .05); g.closePath(); g.fillStyle = lg(0, y - r, 0, y, [hair[0], hair[1]]); g.fill();
    for (let k = 0; k < 24; k++) { const u = k / 23 - .5; curve([x + u * w * .3, y - r * .62], [x + u * w * 1.6, y - r * .8], [x + u * w * 2, y - r * .05], r * .006, 'rgba(90,90,96,.45)'); }
  } else {
    for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(x + sg * w * .04, y - r * .98); g.bezierCurveTo(x + sg * w * .9, y - r * .9, x + sg * w * 1.05, y - r * .1, x + sg * w * 1.02, y + r * 1.4); g.lineTo(x + sg * w * 1.38, y + r * 1.9); g.bezierCurveTo(x + sg * w * 1.35, y + r * .3, x + sg * w * 1.25, y - r * 1.15, x + sg * w * .04, y - r * 1.05); g.closePath(); g.fillStyle = lg(x, y - r, x + sg * w * 1.4, y + r, [hair[1], hair[0]]); g.fill();
      for (let k = 0; k < 14; k++) { const u = k / 13; curve([x + sg * w * (.05 + .2 * u), y - r * 1.0], [x + sg * w * (.9 + .4 * u), y - r * (.4 - .2 * u)], [x + sg * w * (1.05 + .3 * u), y + r * (1.3 + .5 * u)], r * .008, k % 3 ? 'rgba(140,140,170,.15)' : 'rgba(0,0,0,.4)'); } }
  }
  if (glasses) for (const sg of [-1, 1]) { const ex = EX(sg); rr(ex - ew * 1.35, ey - eh * 2.2, ew * 2.7, eh * 3.8, eh); g.fillStyle = 'rgba(200,220,255,.08)'; g.fill(); g.strokeStyle = '#2a2622'; g.lineWidth = r * .014; g.stroke(); if (sg < 0) line([[ex + ew * 1.35, ey - eh * .6], [EX(1) - ew * 1.35, ey - eh * .6]], r * .012, '#2a2622'); }
  if (sweat > 0) for (let i = 0; i < 3; i++) { const p = ((t * .35 + i * .33) % 1), sx = x + (i - 1) * w * .5, sy = y - r * .5 + p * r * .6; g.save(); g.globalAlpha = sweat * (1 - p) * .9; g.beginPath(); g.moveTo(sx, sy - r * .05); g.quadraticCurveTo(sx + r * .03, sy, sx, sy + r * .025); g.quadraticCurveTo(sx - r * .03, sy, sx, sy - r * .05); g.fillStyle = 'rgba(210,235,255,.8)'; g.fill(); circ(sx - r * .008, sy - r * .005, r * .007, '#fff'); g.restore(); }
}
// head and shoulders, front: a polo shirt (collar, placket, buttons, folds) or a house dress; the head on top. s = shoulder width
function bust(x, y, s, o = {}) {
  const { shirt = DRV.hood, lx = -1, rim = null, t = 0, breathe = 1, collar = 1 } = o, br = Math.sin(t * 1.9) * s * .006 * breathe, r = s * .3, hy = y - s * .92 + br;
  const P = () => { g.beginPath(); g.moveTo(x - s * .16, y - s * .5 + br); g.quadraticCurveTo(x - s * .45, y - s * .5 + br, x - s * .52, y - s * .3 + br); g.quadraticCurveTo(x - s * .6, y + s * .1, x - s * .62, y + s * .8); g.lineTo(x + s * .62, y + s * .8); g.quadraticCurveTo(x + s * .6, y + s * .1, x + s * .52, y - s * .3 + br); g.quadraticCurveTo(x + s * .45, y - s * .5 + br, x + s * .16, y - s * .5 + br); g.closePath(); };
  P(); g.fillStyle = lg(x - s * .6, 0, x + s * .6, 0, lx < 0 ? [shirt[0], shirt[1], shirt[2]] : [shirt[2], shirt[1], shirt[0]]); g.fill();
  g.save(); P(); g.clip();
  for (let k = 0; k < 7; k++) curve([x + (k - 3) * s * .13, y - s * .35], [x + (k - 3) * s * .16 + Math.sin(k) * s * .03, y + s * .1], [x + (k - 3) * s * .18, y + s * .8], s * .006, 'rgba(10,12,24,.25)');
  for (const sg of [-1, 1]) { g.fillStyle = rg(x + sg * s * .42, y - s * .1, 0, s * .3, ['rgba(10,12,24,.35)', 'rgba(10,12,24,0)']); g.fillRect(x + sg * s * .42 - s * .3, y - s * .4, s * .6, s * .9); }
  g.fillStyle = lg(0, y - s * .5, 0, y - s * .2, ['rgba(255,255,255,.12)', 'rgba(255,255,255,0)']); g.fillRect(x - s, y - s * .5, 2 * s, s * .3);
  if (rim) { g.translate(-lx * s * .015, 0); P(); g.lineWidth = s * .02; g.strokeStyle = rim; g.stroke(); }
  g.restore(); P(); g.strokeStyle = 'rgba(10,8,14,.7)'; g.lineWidth = s * .005; g.stroke();
  if (collar) { rr(x - s * .03, y - s * .45, s * .06, s * .3, s * .01); g.fillStyle = 'rgba(0,0,0,.15)'; g.fill(); for (let k = 0; k < 3; k++) circ(x, y - s * (.4 - k * .09), s * .012, '#e8e4dc');
    for (const sg of [-1, 1]) { path([[x, y - s * .44 + br], [x + sg * s * .2, y - s * .53 + br], [x + sg * s * .22, y - s * .4 + br], [x + sg * s * .03, y - s * .32 + br]]); g.closePath(); g.fillStyle = lg(0, y - s * .55, 0, y - s * .3, [shirt[0], shirt[1]]); g.fill(); g.strokeStyle = 'rgba(10,8,14,.5)'; g.lineWidth = s * .004; g.stroke(); } }
  faceReal(x, hy, r, { ...o, t, lx, rim });
  return { head: [x, hy], r };
}
// a painted-canvas texture over every frame (brush strokes), for the painterly finish
TEX.brush = paint(mk(1080, 1920), (w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const x = hash(i * 1.31) * w, y = hash(i * 2.77) * h, a = (hash(i * 5.3) - .5) * .9 + .6, l = 10 + 40 * hash(i * 7.1); g.strokeStyle = hash(i * 9.7) > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; g.lineWidth = 2 + 5 * hash(i * 3.9); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } });

// a realistic hand, seen from the back: the palm, four jointed fingers (curl 0 open .. 1 gripping), the thumb, knuckles, veins, nails.
// (x, y) = the wrist, s = the hand length, ang = the direction the fingers point
function handReal(x, y, s, ang, o = {}) {
  const { skin = DRV.skin, curl = 0, sg = 1, spread = .12 } = o;
  g.save(); g.translate(x, y); g.rotate(ang); if (sg < 0) g.scale(1, -1);
  rr(-s * .25, -s * .17, s * .3, s * .34, s * .14); g.fillStyle = lg(0, -s * .17, 0, s * .17, [skin[1], skin[2]]); g.fill();
  const P = () => { g.beginPath(); g.moveTo(0, -s * .2); g.quadraticCurveTo(s * .25, -s * .26, s * .5, -s * .21); g.lineTo(s * .52, s * .2); g.quadraticCurveTo(s * .25, s * .26, 0, s * .2); g.quadraticCurveTo(-s * .06, 0, 0, -s * .2); g.closePath(); };
  const F = k => { const fy = lerp(-s * .17, s * .15, k / 3), L_ = s * [.42, .48, .45, .36][k], a0 = (k - 1.5) * spread * (1 - curl), seg_ = [L_ * .45, L_ * .32, L_ * .23], w = s * [.095, .1, .095, .08][k];
    let px = s * .5, py = fy, a = a0; const pts = [[px, py]];
    for (let j = 0; j < 3; j++) { px += Math.cos(a) * seg_[j]; py += Math.sin(a) * seg_[j]; pts.push([px, py]); a += curl * (j ? 1.1 : .7) * (k === 3 ? 1.1 : 1); }
    line(pts, w + 2, 'rgba(20,8,6,.6)'); line(pts, w, skin[1]); g.save(); g.translate(0, -w * .18); line(pts.slice(0, 3), w * .35, `rgba(255,230,210,.18)`); g.restore();
    for (let j = 1; j < 3; j++) { const [qx, qy] = pts[j]; curve([qx - w * .1, qy - w * .35], [qx + w * .05, qy], [qx - w * .1, qy + w * .35], s * .006, 'rgba(60,25,20,.45)'); }
    const [nx, ny] = pts[3], [mx, my] = pts[2], na = Math.atan2(ny - my, nx - mx); g.save(); g.translate(nx - Math.cos(na) * w * .35, ny - Math.sin(na) * w * .35); g.rotate(na); rr(-w * .3, -w * .3, w * .55, w * .6, w * .25); g.fillStyle = 'rgba(240,210,200,.55)'; g.fill(); g.restore(); };
  for (const k of [3, 2, 1, 0]) F(k);
  P(); g.fillStyle = lg(0, -s * .22, 0, s * .22, [skin[0], skin[1], skin[2]]); g.fill(); P(); g.strokeStyle = 'rgba(20,8,6,.6)'; g.lineWidth = s * .008; g.stroke();
  for (let k = 0; k < 4; k++) { const ky = lerp(-s * .17, s * .15, k / 3); circ(s * .47, ky, s * .045, 'rgba(255,230,210,.22)'); curve([s * .1, ky * .6], [s * .3, ky * .85], [s * .45, ky], s * .012, 'rgba(70,30,30,.25)'); }
  curve([s * .05, -s * .05], [s * .2, -s * .1], [s * .35, -s * .02], s * .01, 'rgba(90,60,120,.25)');
  const ta = -.9 + curl * .7; line([[s * .08, s * .17], [s * .08 + Math.cos(-ta) * s * .2, s * .17 + Math.sin(-ta) * s * .2 * -1 + s * .08], [s * .08 + Math.cos(-ta) * s * .33, s * .3 + curl * s * .02]], s * .11, skin[2]);
  line([[s * .08, s * .17], [s * .08 + Math.cos(-ta) * s * .2, s * .25], [s * .08 + Math.cos(-ta) * s * .33, s * .3 + curl * s * .02]], s * .085, skin[1]);
  g.restore();
}

// ==================== Paano Kung Hindi Ka Namamatay: people at full height, the city, fire, glass, water, the dying sun ====================
const YOU = { skin: ['#d6a07a', '#a8704c', '#62402a'], hair: ['#0e0b0a', '#1e1714', '#3a2e26'], shirt: ['#f0eee8', '#c8c4ba', '#7e7a72'], pants: ['#3a3e4a', '#262a34', '#12141a'] };
const WIFE = { skin: ['#e0b08c', '#b48262', '#6c4632'], hair: ['#120d0b', '#261c17', '#3e3028'], dress: ['#c0687a', '#8e4456', '#4e2230'] };
const KID = { skin: ['#e6b896', '#bc8a68', '#704a34'], hair: ['#100c0a', '#221a15', '#3a2e26'], dress: ['#f2d36a', '#c8a43c', '#7a6220'] };
const OLD = { skin: ['#dcb498', '#b08868', '#6a4c38'], hair: ['#eeece8', '#c4c0ba', '#86827c'] };
C.fire = '255,120,40'; C.ember = '255,170,80'; C.sun = '255,90,40'; C.gold = '255,200,120'; C.sea = '90,170,220';

// ---------- a person at full height, front view, real proportions (7.5 heads). pose: down | brush | reach | hold | hug | hands ----------
function manReal(x, y, h, o = {}) {
  const { t = 0, pose = 'down', look = 0, lx = -1, rim = null, cloth = YOU, female = 0, age = 0, walk = null, eyes = 'open', tear = 0, mouth = 0, sweat = 0, turn = 0, dust = 0 } = o;
  const sk = cloth.skin || YOU.skin, r = h * .066, br = Math.sin(t * 1.9) * h * .002, sw = walk === null ? 0 : Math.sin(walk);
  const hy = y - h + r * 1.05 + br, sh = y - h * .815 + br, hip = y - h * .5, sW = h * (female ? .105 : .125);
  cshadow(x, y, h * .16, h * .02, .55);
  const top = cloth.shirt || cloth.dress, bot = cloth.pants || cloth.dress;
  for (const sg of [-1, 1]) { const fx = x + sg * h * .055 + sg * sw * h * .05, kx = x + sg * h * .06 + sg * sw * h * .025;
    limb([[x + sg * h * .06, hip], [kx, y - h * .26], [fx, y - h * .03]], h * (female ? .05 : .062), bot, lx);
    g.save(); g.translate(fx, y - h * .015); ell(sg * h * .012, 0, h * .045, h * .018); g.fillStyle = '#16120f'; g.fill(); ell(sg * h * .006, -h * .006, h * .03, h * .008); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill(); g.restore(); }
  const P = () => { g.beginPath(); g.moveTo(x - h * .03, sh - h * .012); g.lineTo(x - sW, sh + h * .01); g.quadraticCurveTo(x - sW * 1.05, sh + h * .08, x - sW * .82, hip - h * .1);
    if (female) { g.quadraticCurveTo(x - sW * .7, hip, x - h * .16, y - h * .22); g.lineTo(x + h * .16, y - h * .22); g.quadraticCurveTo(x + sW * .7, hip, x + sW * .82, hip - h * .1); }
    else { g.lineTo(x - sW * .85, hip + h * .03); g.lineTo(x + sW * .85, hip + h * .03); g.lineTo(x + sW * .82, hip - h * .1); }
    g.quadraticCurveTo(x + sW * 1.05, sh + h * .08, x + sW, sh + h * .01); g.lineTo(x + h * .03, sh - h * .012); g.closePath(); };
  P(); g.fillStyle = lg(x - sW, 0, x + sW, 0, lx < 0 ? [top[0], top[1], top[2]] : [top[2], top[1], top[0]]); g.fill();
  g.save(); P(); g.clip();
  for (let k = 0; k < 7; k++) curve([x + (k - 3) * sW * .25, sh + h * .02], [x + (k - 3) * sW * .3 + Math.sin(k * 2) * h * .01, hip - h * .1], [x + (k - 3) * sW * .28, hip + h * .03], h * .002, 'rgba(10,10,20,.22)');
  g.fillStyle = lg(0, hip - h * .1, 0, hip + h * .03, ['rgba(10,10,20,0)', 'rgba(10,10,20,.3)']); g.fillRect(x - sW * 1.2, hip - h * .1, sW * 2.4, h * .14);
  if (dust > 0) for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,85,80,${.35 * dust})`; g.fillRect(x + (hash(i * 3.1) - .5) * sW * 2, sh + hash(i * 5.7) * h * .3, 3 + 6 * hash(i), 2 + 4 * hash(i * 2)); }
  if (rim) { g.translate(-lx * h * .004, 0); P(); g.lineWidth = h * .006; g.strokeStyle = rim; g.stroke(); }
  g.restore(); P(); g.strokeStyle = 'rgba(8,8,14,.6)'; g.lineWidth = h * .0025; g.stroke();
  if (!female) { line([[x, sh], [x, hip]], h * .002, 'rgba(0,0,0,.25)'); for (let k = 0; k < 5; k++) circ(x + h * .004, sh + h * .03 + k * h * .055, h * .004, 'rgba(255,255,255,.6)');
    for (const sg of [-1, 1]) { path([[x, sh - h * .005], [x + sg * h * .045, sh - h * .02], [x + sg * h * .05, sh + h * .02], [x + sg * h * .006, sh + h * .03]]); g.closePath(); g.fillStyle = top[0]; g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = h * .002; g.stroke(); } }
  rr(x - h * .022, sh - h * .05, h * .044, h * .06, h * .015); g.fillStyle = lg(x - h * .022, 0, x + h * .022, 0, [sk[2], sk[1], sk[2]]); g.fill();
  const arm = sg => { const s0 = [x + sg * sW * .92, sh + h * .025]; let e, hd, ha;
    if (pose === 'brush') { const k = Math.sin(t * 6 + sg) * h * .02; e = [s0[0] + sg * h * .05, s0[1] + h * .14]; hd = sg < 0 ? [x + h * .06 + k, sh + h * .08] : [s0[0] + sg * h * .04, s0[1] + h * .3]; }
    else if (pose === 'reach') { e = [s0[0] + sg * h * .1, s0[1] + h * .04]; hd = [s0[0] + sg * h * .2, s0[1] - h * .02]; }
    else if (pose === 'hold' && sg > 0) { e = [s0[0] + h * .05, s0[1] + h * .14]; hd = [x + h * .07, s0[1] + h * .16]; }
    else if (pose === 'hug') { e = [s0[0] + sg * h * .06, s0[1] + h * .12]; hd = [x - sg * h * .06, s0[1] + h * .17]; }
    else if (pose === 'hands') { e = [s0[0] + sg * h * .03, s0[1] + h * .14]; hd = [x + sg * h * .02, s0[1] + h * .2]; }
    else { const s2 = walk === null ? 0 : -sg * sw; e = [s0[0] + sg * h * .015 + s2 * h * .04, s0[1] + h * .15]; hd = [s0[0] + sg * h * .02 + s2 * h * .08, s0[1] + h * .3]; }
    limb([s0, e, hd], h * .045, top, lx); const dx = hd[0] - e[0], dy = hd[1] - e[1], d = Math.hypot(dx, dy) || 1;
    handReal(hd[0] - dx / d * h * .01, hd[1] - dy / d * h * .01, h * .085, Math.atan2(dy, dx), { skin: sk, curl: pose === 'reach' ? .15 : .45, sg: -sg }); };
  arm(-1); arm(1);
  faceReal(x + turn * h * .01, hy, r, { t, skin: sk, hair: cloth.hair || YOU.hair, female, age, look, lx, rim, eyes, tear, mouth, sweat, turn, glasses: o.glasses, hairStyle: o.hairStyle, smile: o.smile, stache: o.stache });
}
// a child's face: rounder, bigger eyes, two little pigtails
function kidFace(x, y, r, o = {}) {
  const { t = 0 } = o;
  for (const sg of [-1, 1]) { const px = x + sg * r * .95, py = y - r * .35 + Math.sin(t * 2 + sg) * r * .03; g.beginPath(); g.ellipse(px + sg * r * .2, py + r * .25, r * .22, r * .45, sg * .4, 0, TAU); g.fillStyle = KID.hair[1]; g.fill(); circ(px, py, r * .1, '#e85a7a'); }
  g.save(); g.translate(x, y); g.scale(1.08, .97); faceReal(0, 0, r, { t, female: 1, skin: KID.skin, hair: KID.hair, hairStyle: 'short', ...o, x: 0 }); g.restore();
}

// ---------- the city and the fire ----------
function towers(t, y0, n, seed, o = {}) {   // a skyline of office towers with lit windows
  const { col = ['#141824', '#0c0f18'], lit = .35, warm = 1 } = o;
  for (let i = 0; i < n; i++) { const w = 120 + 200 * hash(i * 3.1 + seed), x = -300 + i * (1700 / n) + hash(i + seed) * 60, hh = 500 + 900 * hash(i * 5.3 + seed), top = y0 - hh;
    g.fillStyle = lg(x, 0, x + w, 0, col); g.fillRect(x, top, w, hh + 600); g.fillStyle = 'rgba(160,180,255,.06)'; g.fillRect(x, top, 4, hh);
    for (let wy = top + 20; wy < y0; wy += 26) for (let wx = x + 10; wx < x + w - 14; wx += 18) { const r_ = hash(wx * 1.7 + wy * 3.3 + seed); if (r_ < lit) { g.fillStyle = r_ < lit * .2 ? 'rgba(180,220,255,.8)' : `rgba(255,${200 + 30 * hash(wx)},${130 * warm + 40},.75)`; g.fillRect(wx, wy, 9, 13); } } }
}
function fire(x, y, w, h, t, a = 1) {      // flames licking up out of a window: layered tongues, a hot core, sparks
  if (a <= 0) return; g.save(); g.globalCompositeOperation = 'screen';
  for (let k = 0; k < 9; k++) { const ph = t * (3 + k * .4) + k * 1.7, fx = x + (hash(k * 3.3) - .5) * w, fh = h * (.5 + .5 * hash(k * 7.1)) * (.8 + .2 * Math.sin(ph)), sway = Math.sin(ph * .7) * w * .15;
    g.beginPath(); g.moveTo(fx - w * .18, y); g.quadraticCurveTo(fx - w * .2 + sway, y - fh * .5, fx + sway * 1.6, y - fh); g.quadraticCurveTo(fx + w * .2 + sway, y - fh * .5, fx + w * .18, y); g.closePath();
    g.fillStyle = lg(0, y, 0, y - fh, [`rgba(255,240,180,${.8 * a})`, `rgba(255,140,40,${.6 * a})`, 'rgba(200,40,10,0)']); g.fill(); }
  g.restore(); glow(x, y - h * .3, h * 1.1, C.fire, .6 * a); L(x, y - h * .3, h * 3, C.fire, .95 * a, .3 * a);
}
function smokeCol(x, y, w, t, a = .6) {   // a column of smoke boiling up
  for (let i = 0; i < 26; i++) { const p = ((t * .08 + i / 26) % 1), sx = x + Math.sin(p * 5 + i) * w * .3 * p + p * w * .6, sy = y - p * w * 4, R = w * (.25 + .7 * p);
    g.fillStyle = rg(sx, sy, 0, R, [`rgba(40,36,40,${a * (1 - p) * .8})`, 'rgba(40,36,40,0)']); g.fillRect(sx - R, sy - R, 2 * R, 2 * R); }
}
function shards(t, cx, cy, n, spread, a = 1, seed = 0) {   // glass falling and turning, catching the light
  for (let i = 0; i < n; i++) { const ox = (hash(i * 2.3 + seed) - .5) * spread, oy = (hash(i * 4.1 + seed) - .5) * spread * 1.5 + ((t * (40 + 60 * hash(i)) + hash(i * 9) * 900) % 900) - 450, s = 8 + 26 * hash(i * 7.7 + seed), rot = t * (1 + 3 * hash(i)) + i;
    g.save(); g.translate(cx + ox, cy + oy); g.rotate(rot); g.scale(1, Math.abs(Math.cos(rot * 1.3)) * .8 + .2);
    path([[-s, -s * .3], [s * .6, -s * .8], [s, s * .4], [-s * .2, s * .7]]); g.closePath(); g.fillStyle = `rgba(190,215,255,${.25 * a})`; g.fill(); g.strokeStyle = `rgba(230,240,255,${.7 * a})`; g.lineWidth = 1.5; g.stroke(); g.restore();
    if (hash(i + Math.floor(t * 3)) > .85) glow(cx + ox, cy + oy, s * 2, '220,235,255', .5 * a); }
}
function embersUp(t, n, a = 1, sp = 1) {   // sparks rising (or rushing past when you fall)
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) { const v = (300 + 700 * hash(i * 1.3)) * sp, x = hash(i * 2.9) * 1300 - 110 + Math.sin(t * 2 + i) * 30, y = 2100 - ((hash(i * 5.1) * 2400 + t * v) % 2400), len = 6 + 30 * sp * hash(i);
    line([[x, y], [x, y + len]], 2 + 3 * hash(i * 3), `rgba(255,${150 + 80 * hash(i)},60,${a * (.4 + .6 * hash(i * 7))})`); }
  g.restore();
}
// someone falling, seen from above and a little to the side: limbs thrown up and out, the shirt flapping
function faller(x, y, s, t, o = {}) {
  const fl = Math.sin(t * 9), r = s * .13;
  g.save(); g.translate(x, y); g.rotate(o.rot || 0);
  for (const sg of [-1, 1]) { limb([[sg * s * .1, s * .3], [sg * s * .26, s * .55 + sg * fl * s * .03], [sg * s * .2, s * .82]], s * .11, YOU.pants, -1); ell(sg * s * .2, s * .86, s * .07, s * .04, sg * .3); g.fillStyle = '#16120f'; g.fill(); }
  const P = () => { g.beginPath(); g.moveTo(-s * .22, -s * .12); g.quadraticCurveTo(0, -s * .2, s * .22, -s * .12); g.lineTo(s * .17 + fl * s * .02, s * .34); g.lineTo(-s * .17 - fl * s * .02, s * .34); g.closePath(); };
  P(); g.fillStyle = lg(-s * .2, 0, s * .2, 0, YOU.shirt); g.fill(); g.save(); P(); g.clip(); for (let k = 0; k < 6; k++) curve([-s * .15 + k * s * .06, -s * .1], [-s * .17 + k * s * .07 + fl * s * .03, s * .1], [-s * .16 + k * s * .065, s * .34], s * .006, 'rgba(10,10,20,.3)'); g.restore();
  for (let k = 0; k < 4; k++) { const fx = -s * .18 + k * s * .12; path([[fx, s * .32], [fx + s * .05, s * .32], [fx + s * .03 + fl * s * .05, s * .42 + hash(k) * s * .05]]); g.closePath(); g.fillStyle = YOU.shirt[1]; g.fill(); }
  for (const sg of [-1, 1]) { const w = Math.sin(t * 7 + sg) * s * .06; limb([[sg * s * .2, -s * .1], [sg * s * .42, -s * .28 + w], [sg * s * .5 + w, -s * .52]], s * .085, YOU.shirt, -1); handReal(sg * s * .5 + w, -s * .52, s * .16, -Math.PI / 2 + sg * .35, { skin: YOU.skin, curl: .1, spread: .3, sg }); }
  faceReal(0, -s * .3, r, { t, skin: YOU.skin, hair: YOU.hair, eyes: 'wide', mouth: .5, lx: 1, rim: 'rgba(255,150,70,.55)' });
  g.restore();
}
// ---------- the phone ----------
function phone(x, y, w, h, ang, screen) {
  g.save(); g.translate(x, y); g.rotate(ang);
  rr(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 46); g.fillStyle = lg(-w / 2, 0, w / 2, 0, ['#2a2c32', '#4a4c54', '#1a1b20']); g.fill();
  rr(-w / 2, -h / 2, w, h, 38); g.fillStyle = '#05060a'; g.fill(); g.save(); rr(-w / 2, -h / 2, w, h, 38); g.clip(); g.translate(-w / 2, -h / 2); screen(w, h); g.restore();
  rr(-w * .12, -h / 2 + 14, w * .24, 22, 11); g.fillStyle = '#000'; g.fill();
  g.save(); rr(-w / 2, -h / 2, w, h, 38); g.clip(); g.fillStyle = lg(-w / 2, -h / 2, w / 2, h / 2, ['rgba(255,255,255,.08)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.04)']); g.fillRect(-w / 2, -h / 2, w, h); g.restore();
  g.restore(); L(x, y, Math.max(w, h) * .9, '170,200,255', .8, .12);
}
// ---------- the truck, the lightning, the rubble ----------
function truckFront(x, y, s, t, o = {}) {      // a big hauler, nose on, headlights blazing
  const { lights = 1, dent = 0 } = o; g.save(); g.translate(x, y);
  rr(-1.25 * s, -3.4 * s, 2.5 * s, 2.0 * s, .12 * s); g.fillStyle = lg(-1.25 * s, 0, 1.25 * s, 0, ['#5a1a1a', '#8a2a24', '#4a1212']); g.fill();
  rr(-1.1 * s, -3.2 * s, 2.2 * s, .9 * s, .08 * s); g.fillStyle = '#0a0c14'; g.fill(); g.fillStyle = 'rgba(170,190,230,.15)'; g.fillRect(-1.1 * s, -3.2 * s, 2.2 * s, .2 * s);
  rr(-1.3 * s, -1.5 * s, 2.6 * s, 1.1 * s, .08 * s); g.fillStyle = lg(0, -1.5 * s, 0, -.4 * s, ['#8a8c94', '#4a4c54']); g.fill();
  for (let k = 0; k < 9; k++) { const gy = -1.4 * s + k * .1 * s; g.fillStyle = k % 2 ? '#1a1a20' : '#a8aab4'; g.fillRect(-.8 * s, gy, 1.6 * s, .06 * s); }
  if (dent) { g.fillStyle = `rgba(0,0,0,${.5 * dent})`; ell(0, -1.0 * s, .35 * s, .25 * s); g.fill(); for (let k = 0; k < 6; k++) line([[0, -1 * s], [Math.cos(k) * .45 * s, -1 * s + Math.sin(k) * .3 * s]], .02 * s, `rgba(20,20,20,${.6 * dent})`); }
  for (const sg of [-1, 1]) { rr(sg * 1.0 * s - .2 * s, -1.25 * s, .4 * s, .25 * s, .05 * s); g.fillStyle = lights ? '#fffbe8' : '#888'; g.fill(); if (lights) { glow(sg * s, -1.12 * s, 1.4 * s, C.warm, .9 * lights); L(sg * s, -1.12 * s, 3 * s, C.warm, lights, .5 * lights); F(sg * s, -1.12 * s, 5 * s, C.warm, .8 * lights); } }
  for (const sg of [-1, 1]) { rr(sg * 1.05 * s - .28 * s, -.45 * s, .56 * s, .5 * s, .1 * s); fs('#0a0a0c', .02 * s); }
  g.restore();
}
function bolt(x0, y0, x1, y1, t, a, seed = 1) {    // a lightning bolt: a jagged main channel with branches, a soft glow (never a full-frame flash)
  if (a <= 0) return; const pts = [[x0, y0]]; let x = x0, y = y0; const n = 14;
  for (let i = 1; i <= n; i++) { const u = i / n; x = lerp(x0, x1, u) + (hash(i * 3.7 + seed) - .5) * 120 * (1 - u * .5); y = lerp(y0, y1, u); pts.push([x, y]); }
  g.save(); g.globalCompositeOperation = 'screen'; line(pts, 16, `rgba(150,170,255,${.25 * a})`); line(pts, 6, `rgba(210,220,255,${.7 * a})`); line(pts, 2.5, `rgba(255,255,255,${a})`);
  for (let b = 2; b < n - 2; b += 3) { let bx = pts[b][0], by = pts[b][1]; const br = [[bx, by]]; for (let k = 0; k < 4; k++) { bx += (hash(b * 7 + k + seed) - .3) * 90; by += 50 + 40 * hash(b + k); br.push([bx, by]); } line(br, 2, `rgba(220,230,255,${.6 * a})`); }
  g.restore(); L(x1, y1, 700, '200,215,255', .8 * a, .12 * a);
}
function rubble(x0, y0, x1, y1, t, seed = 0) {      // broken concrete slabs, rebar, dust
  for (let i = 0; i < 40; i++) { const x = lerp(x0, x1, hash(i * 2.1 + seed)), y = lerp(y0, y1, hash(i * 3.7 + seed)), w = 60 + 220 * hash(i * 5.3), hh = 30 + 90 * hash(i * 7.9), a = (hash(i) - .5) * .8;
    g.save(); g.translate(x, y); g.rotate(a); path([[-w / 2, -hh / 2], [w / 2, -hh / 2 + (hash(i) - .5) * 20], [w / 2 - 10, hh / 2], [-w / 2 + 14, hh / 2]]); g.closePath(); g.fillStyle = lg(0, -hh / 2, 0, hh / 2, ['#8a8682', '#5a5652', '#2e2c2a']); g.fill(); g.strokeStyle = 'rgba(20,18,16,.6)'; g.lineWidth = 2; g.stroke();
    for (let k = 0; k < 2; k++) line([[-w * .3 + k * w * .4, -hh / 2], [-w * .3 + k * w * .4 + (hash(i + k) - .5) * 40, -hh / 2 - 40 * hash(i * k + 1)]], 4, '#5a3a2a'); g.restore(); }
}
function dustCloud(t, x, y, w, a) { for (let i = 0; i < 16; i++) { const p = ((t * .1 + i / 16) % 1), sx = x + (hash(i * 3.3) - .5) * w * (1 + p), sy = y - p * w * .4, R = w * (.15 + .3 * p); g.fillStyle = rg(sx, sy, 0, R, [`rgba(150,140,125,${a * (1 - p) * .6})`, 'rgba(150,140,125,0)']); g.fillRect(sx - R, sy - R, 2 * R, 2 * R); } }

// ---------- home, graves, cards ----------
function homeRoom(t, o = {}) {       // a Filipino living room at night: wood panelling, a framed wedding photo, the Sto. Nino, a warm lamp
  g.fillStyle = lg(0, -600, 0, 2600, ['#5a3e2c', '#3a2618']); g.fillRect(-600, -600, 2300, 3200); g.save(); g.globalAlpha = .45; g.fillStyle = pat(TEX.wood); g.fillRect(-600, -600, 2300, 3200); g.restore();
  g.fillStyle = '#2a1a10'; g.fillRect(-600, 1350, 2300, 30);
  rr(150, 380, 260, 320, 6); fs('#c8a050', 8); rr(170, 400, 220, 280, 4); g.fillStyle = '#e8e2d6'; g.fill(); g.save(); rr(170, 400, 220, 280, 4); g.clip(); g.globalAlpha = .9; manReal(240, 690, 260, { t, cloth: YOU, lx: -1, smile: 1 }); manReal(320, 690, 245, { t, cloth: { ...WIFE, dress: ['#f6f4ee', '#d8d4c8', '#8a8478'] }, female: 1, lx: -1, smile: 1 }); g.restore();
  const sx = 840, sy = 760; rr(sx - 120, sy, 240, 20, 4); fs('#4a3020', 3); ell(sx, sy - 70, 40, 70); fs(lg(0, sy - 140, 0, sy, ['#c8283a', '#7a1020']), 3); circ(sx, sy - 150, 26, '#e8c8a0'); path([[sx - 26, sy - 172], [sx + 26, sy - 172], [sx, sy - 214]]); g.closePath(); fs('#e0b840', 3); candle(sx - 80, sy, 40, t); candle(sx + 80, sy, 40, t);
  if (o.lamp !== 0) { line([[980, -600], [980, 220]], 4, '#1a1410'); path([[900, 220], [1060, 220], [1020, 120], [940, 120]]); g.closePath(); fs('#e8d4a8', 3); L(980, 260, 1300, C.gold, .95, .3); }
}
function sofa(x, y, w, h) { rr(x, y, w, h * .55, 40); fs(lg(0, y, 0, y + h * .55, ['#6a4a3a', '#3a2418']), 4); rr(x - 30, y + h * .4, w + 60, h * .5, 40); fs(lg(0, y + h * .4, 0, y + h, ['#7a5644', '#40281c']), 4); for (const sg of [0, 1]) { rr(x - 60 + sg * (w + 40), y + h * .2, 80, h * .7, 30); fs('#5a3a2a', 4); } }
function tomb(x, y, s, name, yrs, t, o = {}) {      // a stone grave marker, with moss growing over time (moss 0..1)
  const { moss = 0, flowers = 1 } = o;
  rr(x - s * .5, y - s * 1.2, s, s * 1.2, [s * .45, s * .45, 4, 4]); g.fillStyle = lg(x - s * .5, 0, x + s * .5, 0, ['#a8a49c', '#8a867e', '#5a5650']); g.fill(); g.strokeStyle = 'rgba(30,28,24,.6)'; g.lineWidth = 2; g.stroke();
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,250' : '20,18,16'},.12)`; g.fillRect(x - s * .45 + hash(i * 2.3) * s * .9, y - s * 1.15 + hash(i * 3.7) * s * 1.1, 2, 2); }
  line([[x - s * .1, y - s * .95], [x + s * .1, y - s * .95]], s * .04, '#4a4640'); line([[x, y - s * 1.05], [x, y - s * .8]], s * .04, '#4a4640');
  text(name, x, y - s * .6, s * .16, '#2a2824', 'Anton'); text(yrs, x, y - s * .4, s * .1, '#3a3834', 'Anton');
  if (moss > 0) for (let i = 0; i < 80 * moss; i++) { const mx = x - s * .5 + hash(i * 4.4) * s, my = y - hash(i * 6.6) ** 2 * s * 1.1; circ(mx, my, s * (.02 + .04 * hash(i)), `rgba(${60 + 40 * hash(i)},${90 + 50 * hash(i * 2)},50,.75)`); }
  if (flowers) for (let k = 0; k < 7; k++) { const fx = x - s * .3 + k * s * .1; line([[fx, y], [fx + (hash(k) - .5) * 20, y - s * .3]], 3, '#3a6a2a'); for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; ell(fx + (hash(k) - .5) * 20 + Math.cos(a) * 8, y - s * .3 + Math.sin(a) * 8, 7, 4, a); g.fillStyle = '#f4f2ea'; g.fill(); } }
}
function idCard(x, y, w, ang, name, yr, t, o = {}) {      // a national ID: photo, name, year, a hologram stripe
  const h = w * .63; g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = 'rgba(0,0,0,.35)'; rr(-w / 2 + 10, -h / 2 + 14, w, h, 18); g.fill();
  rr(-w / 2, -h / 2, w, h, 18); g.fillStyle = lg(-w / 2, -h / 2, w / 2, h / 2, o.cols || ['#e8f0f4', '#c8dce6']); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = o.band || '#1c4a8a'; g.fillRect(-w / 2, -h / 2 + 16, w, h * .14); text('REPUBLIKA NG PILIPINAS', 0, -h / 2 + 16 + h * .07, h * .07, '#fff', 'Anton');
  rr(-w / 2 + 24, -h * .22, w * .3, h * .62, 6); g.fillStyle = '#d8dee4'; g.fill(); g.save(); rr(-w / 2 + 24, -h * .22, w * .3, h * .62, 6); g.clip(); bust(-w / 2 + 24 + w * .15, -h * .22 + h * .72, w * .26, { t, skin: YOU.skin, hair: YOU.hair, shirt: YOU.shirt, lx: -1 }); g.restore();
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#5a6a7a'; g.font = `${h * .06}px Anton`; g.fillText('PANGALAN', -w / 2 + w * .4, -h * .14); g.fillText('TAON NG ISYU', -w / 2 + w * .4, h * .1);
  g.fillStyle = '#16202a'; g.font = `${h * .1}px Anton`; g.fillText(name, -w / 2 + w * .4, -h * .03); g.fillText(String(yr), -w / 2 + w * .4, h * .21);
  g.save(); rr(-w / 2, -h / 2, w, h, 18); g.clip(); const sx = ((t * 120) % (w * 2)) - w; g.fillStyle = lg(sx - 60, 0, sx + 60, 0, ['rgba(255,255,255,0)', 'rgba(200,255,240,.35)', 'rgba(255,200,255,.25)', 'rgba(255,255,255,0)']); g.fillRect(sx - 60, -h / 2, 120, h); g.restore();
  g.restore();
}
function hourglass(x, y, s, t, k) {        // sand running the wrong way: up
  g.save(); g.translate(x, y);
  for (const sg of [-1, 1]) { rr(-s * .62, sg * s * 1.05 - s * .08, s * 1.24, s * .16, s * .04); fs(lg(-s * .6, 0, s * .6, 0, ['#5a3a20', '#8a6038', '#3a2410']), 2); }
  for (const sg of [-1, 1]) line([[sg * s * .55, -s * .97], [sg * s * .55, s * .97]], s * .05, '#6a4a28');
  const G = () => { g.beginPath(); g.moveTo(-s * .45, -s * .95); g.bezierCurveTo(-s * .45, -s * .3, -s * .06, -s * .15, -s * .05, 0); g.bezierCurveTo(-s * .06, s * .15, -s * .45, s * .3, -s * .45, s * .95); g.lineTo(s * .45, s * .95); g.bezierCurveTo(s * .45, s * .3, s * .06, s * .15, s * .05, 0); g.bezierCurveTo(s * .06, -s * .15, s * .45, -s * .3, s * .45, -s * .95); g.closePath(); };
  G(); g.fillStyle = 'rgba(200,220,255,.08)'; g.fill();
  g.save(); G(); g.clip(); const top = s * (.15 + .6 * k), bot = s * (.75 - .6 * k);
  g.fillStyle = lg(0, -s, 0, s, ['#e8c890', '#c89a58']); g.beginPath(); g.moveTo(-s * .5, -s * .95); g.lineTo(s * .5, -s * .95); g.lineTo(s * .5, -s * .95 + top); g.quadraticCurveTo(0, -s * .95 + top - s * .15, -s * .5, -s * .95 + top); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-s * .5, s * .95); g.lineTo(s * .5, s * .95); g.lineTo(s * .5, s * .95 - bot); g.quadraticCurveTo(0, s * .95 - bot - s * .2, -s * .5, s * .95 - bot); g.closePath(); g.fill();
  for (let i = 0; i < 30; i++) { const p = ((t * 1.5 + i / 30) % 1); circ((hash(i) - .5) * s * .03, s * .5 - p * s * 1.2, s * .012, `rgba(240,210,150,${.9 * Math.sin(Math.PI * p)})`); }
  g.restore(); G(); g.strokeStyle = 'rgba(220,235,255,.5)'; g.lineWidth = s * .015; g.stroke();
  line([[-s * .3, -s * .8], [-s * .25, -s * .4]], s * .03, 'rgba(255,255,255,.35)');
  g.restore(); L(x, y, s * 2.4, C.gold, .8, .2);
}
// ---------- water ----------
function sea(t, y0, o = {}) {        // open water to the horizon: swells, glints, a reflected sky colour
  const { c0 = '#1a3a58', c1 = '#08182a', glint = C.gold, ga = .6, sunX = 540 } = o;
  g.fillStyle = lg(0, y0, 0, y0 + 1400, [c0, c1]); g.fillRect(-900, y0, 2900, 2000);
  for (let r = 0; r < 60; r++) { const v = r / 60, y = y0 + v * v * 1400, amp = 2 + 26 * v; g.beginPath(); for (let x = -900; x <= 2000; x += 30) g.lineTo(x, y + Math.sin(x * (.012 / (v + .2)) + t * (1 + v) + r) * amp); g.strokeStyle = `rgba(255,255,255,${.04 + .06 * v})`; g.lineWidth = 1 + 3 * v; g.stroke(); }
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 180; i++) { const v = hash(i * 1.7), y = y0 + v * v * 1300, x = sunX + (hash(i * 3.3) - .5) * (100 + 900 * v) + Math.sin(t * 2 + i) * 10, a = Math.max(0, Math.sin(t * 3 + i * 1.3)); g.fillStyle = `rgba(${glint},${ga * a * (1 - v * .5)})`; g.fillRect(x - 8 - 20 * v, y, 16 + 40 * v, 2 + 3 * v); } g.restore();
}
function quiapo(x, y, s, t) {      // the church half drowned: the dome, the cross, a bell tower top, streaked with rust and birds
  g.fillStyle = lg(x - s, 0, x + s, 0, ['#d8ccb4', '#b8aa90', '#6a6050']); g.beginPath(); g.moveTo(x - s * .8, y); g.bezierCurveTo(x - s * .8, y - s * .95, x + s * .8, y - s * .95, x + s * .8, y); g.closePath(); g.fill();
  for (let k = 1; k < 8; k++) curve([x - s * .8 + k * s * .2, y], [x - s * .8 + k * s * .2, y - s * .6], [x, y - s * .72], s * .01, 'rgba(60,50,40,.35)');
  rr(x - s * .12, y - s * .95, s * .24, s * .25, s * .03); fs('#c8bca4', s * .01); line([[x, y - s * .95], [x, y - s * 1.4]], s * .05, '#8a7a5a'); line([[x - s * .13, y - s * 1.25], [x + s * .13, y - s * 1.25]], s * .05, '#8a7a5a');
  for (let i = 0; i < 20; i++) { const rx = x - s * .7 + hash(i * 3.1) * s * 1.4; g.fillStyle = lg(0, y - s * .7, 0, y, ['rgba(120,60,30,0)', 'rgba(120,60,30,.35)']); g.fillRect(rx, y - s * .5 * hash(i), s * .02, s * .5 * hash(i)); }
  rr(x + s * 1.3, y - s * .9, s * .4, s * .9, s * .02); fs(lg(0, y - s * .9, 0, y, ['#c8bca4', '#8a7e66']), s * .01); path([[x + s * 1.25, y - s * .9], [x + s * 1.75, y - s * .9], [x + s * 1.5, y - s * 1.3]]); g.closePath(); fs('#9a6a4a', s * .01);
  for (let k = 0; k < 3; k++) { rr(x + s * 1.38 + k * s * .1, y - s * .78, s * .06, s * .2, s * .03); g.fillStyle = '#1a1612'; g.fill(); }
  for (let i = 0; i < 6; i++) { const bx = x + s * (-1 + 2 * ((t * .05 + hash(i)) % 1)) * 1.5, by = y - s * (1.4 + .4 * hash(i * 2)) + Math.sin(t * 2 + i) * 10; curve([bx - 14, by], [bx, by - 8 * Math.abs(Math.sin(t * 6 + i))], [bx + 14, by], 3, '#1a1a1a'); }
}
function bangka(x, y, s, t) {     // an outrigger boat, rocking
  const rk = Math.sin(t * 1.1) * .04; g.save(); g.translate(x, y + Math.sin(t * 1.3) * s * .03); g.rotate(rk);
  for (const sg of [-1, 1]) { line([[sg * s * .3, -s * .05], [sg * s * 1.0, s * .02]], s * .03, '#3a2a1a'); line([[sg * s * 1.0 - s * .5, s * .06], [sg * s * 1.0 + s * .5, s * .06]], s * .05, '#5a4630'); }
  g.beginPath(); g.moveTo(-s * 1.1, -s * .15); g.quadraticCurveTo(0, s * .25, s * 1.1, -s * .15); g.lineTo(s * .9, -s * .02); g.quadraticCurveTo(0, s * .12, -s * .9, -s * .02); g.closePath(); g.fillStyle = lg(0, -s * .15, 0, s * .2, ['#c84a3a', '#6a2418']); g.fill(); line([[-s * 1.0, -s * .12], [s * 1.0, -s * .12]], s * .02, '#f2e2b8');
  g.restore();
}
// ---------- space ----------
function starfield(t, n, a = 1, seed = 0, die = 0) {      // stars of different colours twinkling; die = how many have gone out (0..1)
  for (let i = 0; i < n; i++) { const h_ = hash(i * 1.3 + seed); if (h_ < die) continue; const x = hash(i * 2.7 + seed) * 1400 - 160, y = hash(i * 4.1 + seed) * 2400 - 240, r = .6 + 2.2 * hash(i * 5.9) ** 3, tw = .7 + .3 * Math.sin(t * (1 + 2 * hash(i)) + i);
    const fade = die > 0 ? clamp((h_ - die) / .05) : 1, c = hash(i * 7.1) > .8 ? '255,200,170' : hash(i * 7.1) > .6 ? '180,200,255' : '255,255,255';
    circ(x, y, r, `rgba(${c},${a * tw * fade})`); if (r > 1.8) glow(x, y, r * 6, c, .3 * a * fade); }
}
function nebula(t, x, y, R, c1, c2, a = .4) { for (let i = 0; i < 12; i++) { const ox = x + Math.cos(i * 1.7) * R * .5 * hash(i), oy = y + Math.sin(i * 2.3) * R * .4 * hash(i * 2), rr_ = R * (.3 + .5 * hash(i * 3)); g.fillStyle = rg(ox, oy, 0, rr_, [`rgba(${i % 2 ? c1 : c2},${a * .5})`, `rgba(${i % 2 ? c1 : c2},0)`]); g.fillRect(ox - rr_, oy - rr_, 2 * rr_, 2 * rr_); } }
function redSun(x, y, R, t, a = 1) {     // a red giant: a churning surface, a dark limb, flares lifting off
  glow(x, y, R * 2.4, C.sun, .55 * a);
  g.save(); g.beginPath(); g.arc(x, y, R, 0, TAU); g.clip(); g.fillStyle = rg(x - R * .2, y - R * .2, R * .1, R, ['#fff0b0', '#ffb040', '#e04818', '#7a1806']); g.fillRect(x - R, y - R, 2 * R, 2 * R);
  for (let i = 0; i < 160; i++) { const a_ = hash(i * 2.1) * TAU, d = Math.sqrt(hash(i * 3.3)) * R, cx = x + Math.cos(a_ + t * .02) * d, cy = y + Math.sin(a_ + t * .02) * d, cr = R * (.03 + .05 * hash(i * 4.7)); g.fillStyle = `rgba(${hash(i) > .5 ? '255,220,120' : '120,20,0'},${.12 + .1 * Math.sin(t + i)})`; g.beginPath(); g.arc(cx, cy, cr, 0, TAU); g.fill(); }
  g.fillStyle = rg(x, y, R * .6, R, ['rgba(80,10,0,0)', 'rgba(80,10,0,.6)']); g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
  for (let k = 0; k < 6; k++) { const a_ = hash(k * 9.1) * TAU + t * .03, h_ = R * (.08 + .12 * (.5 + .5 * Math.sin(t * .7 + k))); const bx = x + Math.cos(a_) * R, by = y + Math.sin(a_) * R; curve([bx, by], [bx + Math.cos(a_) * h_ * 2 + Math.cos(a_ + 1.5) * h_, by + Math.sin(a_) * h_ * 2 + Math.sin(a_ + 1.5) * h_], [x + Math.cos(a_ + .12) * R, y + Math.sin(a_ + .12) * R], R * .015, `rgba(255,170,80,${.7 * a})`); }
  L(x, y, R * 3, C.sun, a, .25 * a);
}
function earth(x, y, R, t, o = {}) {     // the Earth from space: oceans, continents, cloud swirls, a thin blue limb; burn = scorched (0..1)
  const { burn = 0, lit = -1 } = o;
  glow(x, y, R * 1.3, burn > .5 ? C.sun : '120,170,255', .3);
  g.save(); g.beginPath(); g.arc(x, y, R, 0, TAU); g.clip();
  g.fillStyle = mixHex('#1e5a9a', '#6a2a14', burn); g.fillRect(x - R, y - R, 2 * R, 2 * R);
  for (let i = 0; i < 26; i++) { const cx = x + (hash(i * 2.1) - .5) * R * 1.8 + t * R * .01, cy = y + (hash(i * 3.3) - .5) * R * 1.8, cr = R * (.1 + .25 * hash(i * 5.5)); g.fillStyle = mixHex('#4a7a3a', '#2a1006', burn); g.beginPath(); g.ellipse(cx, cy, cr, cr * .6, hash(i) * 3, 0, TAU); g.fill(); }
  if (burn < .8) for (let i = 0; i < 30; i++) { const cx = x + (hash(i * 7.1) - .5) * R * 1.9 + t * R * .02, cy = y + (hash(i * 8.3) - .5) * R * 1.9; g.strokeStyle = `rgba(255,255,255,${.5 * (1 - burn)})`; g.lineWidth = R * .03; g.beginPath(); g.arc(cx, cy, R * (.06 + .12 * hash(i)), 0, 4); g.stroke(); }
  g.fillStyle = rg(x - lit * R * .4, y - R * .2, R * .2, R * 1.2, ['rgba(0,0,0,0)', 'rgba(0,0,0,.85)']); g.fillRect(x - R, y - R, 2 * R, 2 * R);
  g.restore(); g.beginPath(); g.arc(x, y, R, 0, TAU); g.strokeStyle = burn > .5 ? 'rgba(255,140,60,.6)' : 'rgba(140,190,255,.6)'; g.lineWidth = R * .02; g.stroke();
}
// heat shimmer: re-draw the frame in thin bands, each nudged sideways by a slow wave (screen space, after the light pass)
const SHIM = mk(W, H);
function shimmer(t, a = 1, y0 = 0, y1 = H) { if (a <= 0) return; const sc = SHIM.getContext('2d'); sc.globalCompositeOperation = 'copy'; sc.drawImage(cv, 0, 0); reset();
  for (let y = y0; y < y1; y += 6) { const dx = Math.sin(y * .03 + t * 5) * 4 * a + Math.sin(y * .011 - t * 3) * 3 * a; g.drawImage(SHIM, 0, y, W, 6, dx, y, W, 6); } }
// warm light leaks drifting at the edges of a memory
function leaks(t, a) { if (a <= 0) return; reset(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 4; i++) { const x = 540 + Math.cos(t * .3 + i * 1.6) * 600, y = 900 + Math.sin(t * .23 + i * 2.1) * 900; g.fillStyle = rg(x, y, 0, 700, [`rgba(255,${150 + 40 * i},80,${.22 * a})`, 'rgba(255,150,80,0)']); g.fillRect(x - 700, y - 700, 1400, 1400); } reset(); }
function palm(x, y, h, t, k = 0, col = '#03050b') {          // a coconut palm in silhouette
  const sw = Math.sin(t * .6 + k) * h * .012, tx = x + h * .13 + sw, ty = y - h;
  g.beginPath(); g.moveTo(x - h * .028, y); g.quadraticCurveTo(x + h * .015, y - h * .55, tx - h * .013, ty); g.lineTo(tx + h * .013, ty); g.quadraticCurveTo(x + h * .06, y - h * .55, x + h * .028, y); g.closePath(); g.fillStyle = col; g.fill();
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .4 + Math.sin(t * .9 + i + k) * .05, Lf = h * (.3 + .08 * hash(i + k)), ex = tx + Math.cos(a) * Lf, ey = ty + Math.sin(a) * Lf * .5 + Lf * .45 * Math.abs(Math.cos(a)), cx = tx + Math.cos(a) * Lf * .55, cy = ty + Math.sin(a) * Lf * .55 - Lf * .12;
    curve([tx, ty], [cx, cy], [ex, ey], h * .008, col);
    for (let j = 1; j < 13; j++) { const u = j / 13, px = (1 - u) * (1 - u) * tx + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * ty + 2 * (1 - u) * u * cy + u * u * ey; for (const sg of [-1, 1]) line([[px, py], [px + sg * h * .018 * (1 - u * .4), py + h * .055 * (1 - u * .5)]], h * .005, col); } }
  for (let i = 0; i < 3; i++) circ(tx + (i - 1) * h * .015, ty + h * .02, h * .014, col);
}

// ==================== the shots: every event time comes from a word in the script, so the picture follows the narrator ====================
function T(id) { return LN[id].t0; } function E(id) { return LN[id].t1; }
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
const flick = t => .86 + .09 * Math.sin(t * 13) + .05 * Math.sin(t * 31 + 1);
const W_PATAY = wordT('h2', 'patay'), W_TUMAYO = wordT('h3', 'tumayo'), W_SUMPA = wordT('h4', 'sumpa'), W_MILYON = wordT('s1', 'milyon'),
  W_TRUCK = wordT('s2', 'truck'), W_KIDLAT = wordT('s2', 'kidlat'), W_LINDOL = wordT('s2', 'lindol'), W_BUMANGON = wordT('s2', 'Bumangon'), W_LIGAYA = wordT('s3', 'Ligaya'),
  W_KULUBOT = wordT('s4', 'Kulubot'), W_IKAW4 = wordT('s4', 'Ikaw'), W_SUMUNOD = wordT('s5', 'Sumunod'), W_PUTI = wordT('s6', 'Puti'), W_KALIMUTAN = wordT('L2', 'kakalimutan'),
  W_QUIAPO = wordT('s9', 'Quiapo'), W_BAHAY = wordT('s10', 'bahay'), W_TAGALOG = wordT('s11', 'Tagalog'), W_KUMUKULO = wordT('s13', 'Kumukulo'), W_NILAMON = wordT('s14', 'Nilamon'),
  W_LUMUTANG = wordT('s14', 'lumutang'), W_ISAISA = wordT('s16', 'Isa-isang'), W_DILIM = wordT('s17', 'dilim'), W_LARO = wordT('L3', 'laro'), W_YAKAPIN = wordT('s20', 'yakapin'), W_OO = wordT('cta', 'OO');

const S = {};
// ---------- the hook: falling forty floors past a burning tower; the windows rush up, glass and sparks fall with you ----------
function fallScene(t, k) {
  const sp = 1 + .4 * ss(seg(k, 0, 5)), scroll = k * 900 * sp, rot = .25 * Math.sin(k * .7) - .1 * k;
  setCam({ x: 540, y: 900, z: 1.05, rot: rot * .4, focus: 1, dof: 22, shake: 1.2, t });
  layer(6, () => { g.fillStyle = lg(0, -600, 0, 2600, ['#05070e', '#2a1a20', '#ff8a40']); g.fillRect(-900, -900, 2900, 3800); towers(t, 2600, 9, 3, { lit: .4 }); glow(540, 2400, 1400, C.ember, .5); });
  layer(2.2, () => {      // the burning tower beside you, in steep perspective, its window rows rushing up
    const vx = 1500, vy = 4200;
    for (let r = -2; r < 26; r++) { const yy = ((r * 160 - scroll) % (28 * 160) + 28 * 160) % (28 * 160) - 600, u = (yy + 600) / 4200;
      const x0 = lerp(-500, vx, u * .2), x1 = lerp(360, vx, u * .35), y1 = yy + 150;
      g.fillStyle = '#1a1c24'; g.fillRect(x0, yy, x1 - x0, 160); g.fillStyle = 'rgba(160,180,220,.08)'; g.fillRect(x0, yy, x1 - x0, 6);
      for (let c = 0; c < 4; c++) { const wx = lerp(x0, x1, c / 4) + 14, ww = (x1 - x0) / 4 - 28, burn = hash(r * 7.3 + c) > .55 && r % 28 < 20;
        rr(wx, yy + 30, ww, 100, 4); g.fillStyle = burn ? '#ff9a3a' : hash(r + c * 3.1) > .5 ? '#2a3448' : '#0c0e14'; g.fill();
        if (burn) { fire(wx + ww / 2, yy + 130, ww * .8, 120, t + r, 1); smokeCol(wx + ww / 2, yy + 30, 60, t + r, .5); } } } });
  layer(1, () => { faller(540, 900, 520, t, { rot: Math.sin(k * 1.3) * .2 }); L(540, 900, 600, C.fire, .7, .05); L(540, 700, 500, C.ember, .5, 0); });
  layer(.6, () => { shards(t, 540, 900, 30, 1100, 1); });
  lightPass('#2a1a22'); embersUp(t, 70, .9, 2.2 * sp); flares();
  // speed streaks at the edges, the world rushing up past you
  reset(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 30; i++) { const x = (hash(i * 3.3) < .5 ? hash(i) * 260 : W - hash(i) * 260), y = H - ((hash(i * 7.1) * H + t * 2600) % H), len = 120 + 260 * hash(i * 2); line([[x, y], [x, y + len]], 2 + 3 * hash(i), `rgba(255,220,180,${.18 + .2 * hash(i * 5)})`); } reset();
}
S.fall = (t, u) => { fallScene(t, u); const imp = ss(seg(t, E('h2') - .35, E('h2') + .05)); if (imp > 0) { reset(); g.fillStyle = `rgba(0,0,0,${imp})`; g.fillRect(0, 0, W, H); } };
S.loop = (t, u) => fallScene(t, u + 1.5);
// ---------- he gets up: the crushed car roof, glass everywhere, the crowd with their phones up; the fire above; low angle, rising ----------
S.rise = (t, u) => { const up = ss(seg(t, W_TUMAYO - .3, W_TUMAYO + 1.6)), dark = 1 - ss(seg(u, 0, .9));
  setCam({ x: 540, y: lerp(1120, 900, up), z: lerp(1.3, 1.05, ss(seg(u, 0, 5))), rot: lerp(-.08, 0, up), focus: 1, dof: 20, t });
  layer(5, () => { g.fillStyle = lg(0, -600, 0, 2000, ['#0a0810', '#3a1c18']); g.fillRect(-900, -900, 2900, 3800); towers(t, 1500, 7, 9, { lit: .3 });
    g.fillStyle = '#16141c'; g.fillRect(600, -600, 500, 2200); for (let r = 0; r < 12; r++) for (let c = 0; c < 3; c++) { const burn = hash(r * 3 + c) > .6; g.fillStyle = burn ? '#ff8a30' : '#0c0e14'; g.fillRect(630 + c * 150, -500 + r * 160, 110, 100); if (burn) fire(685 + c * 150, -400 + r * 160, 90, 120, t + r, .8); } smokeCol(850, -400, 300, t, .7); });
  layer(2.2, () => { for (let i = 0; i < 16; i++) { const x = -200 + i * 95 + hash(i) * 40, y = 1500 + hash(i * 3) * 60, hh = 520 + 120 * hash(i * 5); ell(x, y - hh * .9, hh * .08, hh * .09); g.fillStyle = '#0a0a0e'; g.fill(); rr(x - hh * .14, y - hh * .8, hh * .28, hh * .8, hh * .1); g.fill();
      if (hash(i * 7) > .4) { const px = x + hh * .1, py = y - hh * .95; rr(px - 16, py - 28, 32, 56, 6); g.fillStyle = '#cfe0ff'; g.fill(); L(px, py, 120, '200,220,255', .9, .25); } }
    for (const [x, c] of [[-120, C.red], [1180, '80,120,255']]) { L(x, 1300, 900, c, .45 + .15 * Math.sin(t * 1.6 + x), .1); } });
  layer(1, () => {
    g.fillStyle = '#1a1a20'; g.fillRect(-900, 1720, 2900, 1000); asphalt(() => { g.beginPath(); g.rect(-900, 1720, 2900, 1000); }, .7);
    g.beginPath(); g.moveTo(80, 1800); g.quadraticCurveTo(160, 1560, 360, 1600); g.quadraticCurveTo(540, 1700, 720, 1580); g.quadraticCurveTo(920, 1560, 1000, 1800); g.closePath(); g.fillStyle = lg(0, 1550, 0, 1800, ['#d8d4cc', '#7a7870']); g.fill();
    for (let k = 0; k < 14; k++) line([[540 + (hash(k) - .5) * 600, 1650], [540 + (hash(k * 2) - .5) * 900, 1650 + (hash(k * 3) - .5) * 200]], 2, 'rgba(20,20,24,.6)');
    rr(40, 1790, 1000, 160, 20); fs(lg(0, 1790, 0, 1950, ['#a8a49c', '#3a3832']), 3); for (const wx of [200, 880]) { circ(wx, 1960, 90, '#0c0c0e'); circ(wx, 1960, 45, '#6a6c74'); }
    shards(t * .2, 540, 1750, 40, 1100, .8, 5);
    manReal(540, lerp(2400, 1660, up), 1050 * lerp(.9, 1, up), { t, pose: up > .6 ? 'brush' : 'down', eyes: up > .3 ? 'open' : 'shut', dust: 1, lx: 1, rim: 'rgba(255,140,70,.6)', look: -.2 });
    L(540, 1100, 700, C.fire, .55, .05); });
  lightPass('#2a1a20'); embersUp(t, 50, .7, .5); flares();
  if (dark > 0) { reset(); g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, W, H); }
};
// ---------- viral: a phone in a hand, the video of him on the car, the views rolling up to 40 million, comments flying ----------
const COMMENTS = ['PAANO???', 'FAKE YAN 😂', 'IMMORTAL PINOY', 'nanginig ako', 'CGI to sure', 'saan to? makati?', 'tumayo lang siya bro', 'hindi tao yan', 'SANA ALL'];
S.viral = (t, u) => { const vc = ss(seg(t, T('s1') + .2, W_MILYON + .3));
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.12, ss(seg(u, 0, 6))), rot: -.04, focus: 1, dof: 24, t });
  layer(3, () => { g.fillStyle = '#0a0c14'; g.fillRect(-600, -600, 2300, 3200); bokeh(t, 26, 0, 1900, 20, .6, 7); });
  layer(1, () => {
    phone(560, 880, 620, 1240, -.06, (w, h) => {
      g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h);
      g.save(); g.beginPath(); g.rect(0, 90, w, w * 1.1); g.clip(); g.fillStyle = lg(0, 90, 0, 90 + w * 1.1, ['#1a1018', '#4a2418']); g.fillRect(0, 90, w, w * 1.1);
      g.fillStyle = '#2a2830'; g.fillRect(0, 90 + w * .8, w, w * .3); rr(w * .15, 90 + w * .75, w * .7, w * .12, 12); fs('#8a8680', 2);
      manReal(w * .5, 90 + w * .8, w * .62, { t, pose: 'brush', dust: 1, lx: 1 }); for (let k = 0; k < 3; k++) fire(w * (.2 + k * .3), 90 + w * .25, 40, 60, t + k, .7); g.restore();
      const v = Math.round(40000000 * vc); text(`${v.toLocaleString('en-US')} views`, 30, 90 + w * 1.1 + 50, 38, '#fff', 'Anton', 'left');
      text('ANG LALAKING HINDI NAMAMATAY', 30, 90 + w * 1.1 + 105, 34, '#e8e8f0', 'Anton', 'left');
      for (let i = 0; i < 6; i++) { const ci = Math.floor(t * 1.6) + i, cy = h - 60 - i * 70 - ((t * 1.6) % 1) * 70; if (cy < 90 + w * 1.1 + 140) continue; circ(46, cy, 22, `hsl(${hash(ci) * 360},50%,55%)`); text(COMMENTS[ci % COMMENTS.length], 84, cy, 30, '#dfe2ea', 'sans-serif', 'left'); }
      text('❤', w - 60, h * .55, 50, '#ff3a5a', 'sans-serif'); text(`${(Math.round(2.4 * vc * 10) / 10).toFixed(1)}M`, w - 60, h * .55 + 50, 24, '#fff', 'Anton');
    });
    handReal(640, 1560, 420, -Math.PI / 2 - .25, { skin: YOU.skin, curl: .55, sg: 1 }); });
  lightPass('#1a1c28'); flares(); };
// ---------- accidents: the truck, the lightning, the earthquake; a death counter ticking up; he walks away from all three ----------
S.accidents = (t, u) => { const ph = t < W_KIDLAT - .2 ? 0 : t < W_LINDOL - .2 ? 1 : t < W_BUMANGON - .2 ? 2 : 3, p0 = [T('s2'), W_KIDLAT - .2, W_LINDOL - .2, W_BUMANGON - .2][ph], v = t - p0;
  if (ph === 0) { setCam({ x: 540, y: 900, z: lerp(1, 1.2, ss(seg(v, 0, 3))), focus: 1, dof: 16, shake: 2 * ss(seg(t, W_TRUCK - .3, W_TRUCK)), t });
    layer(4, () => { g.fillStyle = '#06070c'; g.fillRect(-600, -600, 2300, 3200); towers(t, 1300, 8, 21, { lit: .3 }); });
    layer(1.5, () => { g.fillStyle = '#16161c'; g.fillRect(-900, 1300, 2900, 1200); asphalt(() => { g.beginPath(); g.rect(-900, 1300, 2900, 1200); }, .6); const k = ss(seg(t, T('s2') + .2, W_TRUCK)); truckFront(540, lerp(1500, 2100, k), lerp(140, 380, k), t); });
    layer(1, () => { manReal(540, 1800, 900, { t, pose: 'reach', eyes: 'wide', mouth: .4, lx: 1, rim: 'rgba(255,240,200,.8)' }); });
    lightPass('#121420'); flares(); }
  else if (ph === 1) { const b = ss(seg(t, W_KIDLAT - .05, W_KIDLAT + .1)) * (1 - ss(seg(t, W_KIDLAT + .25, W_KIDLAT + .9)));
    setCam({ x: 540, y: 900, z: lerp(1.1, 1.0, ss(seg(v, 0, 2))), focus: 1, dof: 12, t });
    layer(4, () => { nightSky(t, { top: '#04050c', bot: '#1c1e2e' }); g.fillStyle = '#0a0b10'; g.fillRect(-600, 1350, 2300, 1300); });
    layer(1.2, () => { bolt(600, -300, 560, 1180, t, b, 3); manReal(560, 1500, 700, { t, pose: 'down', eyes: 'shut', dust: b, lx: 1, rim: `rgba(200,215,255,${.4 + .5 * b})` }); for (let i = 0; i < 10; i++) { const p = (t * .6 + i / 10) % 1; circ(560 + Math.sin(i * 3 + t) * 60 * p, 1050 - p * 300, 10 + 30 * p, `rgba(160,160,170,${.3 * (1 - p) * clamp((t - W_KIDLAT) * 2)})`); } });
    lightPass(mixHex('#12142a', '#5a6088', b * .6)); rainFx(t, { n: 220, a: .3 }); flares(); }
  else { const shake = ph === 2 ? 4 * (1 - ss(seg(v, 0, 1.6))) : 0, out = ph === 3 ? ss(seg(v, 0, 1.5)) : ss(seg(v, .9, 1.8)) * .35;
    setCam({ x: 540, y: 950, z: lerp(1.15, 1.0, ss(seg(t, W_LINDOL - .2, E('s2') + 1))), focus: 1, dof: 14, shake, t });
    layer(3, () => { g.fillStyle = lg(0, -600, 0, 2000, ['#3a3a40', '#6a6458']); g.fillRect(-600, -600, 2300, 3200); for (let i = 0; i < 6; i++) { g.fillStyle = '#4a4844'; g.save(); g.translate(-200 + i * 260, 1200); g.rotate((hash(i) - .5) * .4); g.fillRect(-90, -700, 180, 700); g.restore(); } dustCloud(t, 540, 1200, 900, .7); });
    layer(1, () => { rubble(-200, 1300, 1300, 2200, t, 4); manReal(540, lerp(1900, 1600, out), 820, { t, pose: out > .5 ? 'brush' : 'reach', dust: 1, eyes: out > .3 ? 'open' : 'shut', lx: -1, rim: 'rgba(255,230,190,.5)' }); rubble(-200, 1700, 1300, 2300, t, 9); });
    L(540, 800, 1600, C.white, .8, 0); lightPass('#5a5450'); reset(); dustCloud(t, 540, 1700, 1100, .4); flares(); }
  const n = ph === 0 ? (t > W_TRUCK + .2 ? 2 : 1) : ph === 1 ? 3 : 4, pop = back(seg(t, [W_TRUCK + .2, W_KIDLAT, W_LINDOL, W_BUMANGON][Math.min(ph, 3)], [W_TRUCK + .2, W_KIDLAT, W_LINDOL, W_BUMANGON][Math.min(ph, 3)] + .25), 2);
  reset(); g.save(); g.translate(CX, 380); g.scale(pop || 1, pop || 1); glass(-300, -80, 600, 160, 26, RED, 4, 'rgba(255,49,80,.8)'); text(`PATAY: ${n} BESES`, 0, 4, 76, '#fff', 'Anton'); g.restore();
};
// ---------- family: a warm living room; over his shoulder, his little girl on the sofa asks why he never gets old ----------
S.family = (t, u) => { const f = ss(seg(t, T('L1') - .4, T('L1') + .3));
  setCam({ x: lerp(560, 600, f), y: lerp(900, 860, f), z: lerp(1.0, 1.2, f), focus: lerp(1.3, 1.0, f), dof: 26, t });
  layer(2.6, () => { homeRoom(t); });
  layer(1.6, () => { sofa(-80, 1150, 1240, 520); manReal(260, 1620, 820, { t, cloth: WIFE, female: 1, pose: 'hands', smile: 1, look: .4, lx: 1, rim: 'rgba(255,200,140,.5)' }); });
  layer(1, () => { const kx = 680, ky = 1560; g.beginPath(); g.moveTo(kx - 150, ky + 500); g.quadraticCurveTo(kx - 160, ky - 40, kx - 60, ky - 80); g.lineTo(kx + 60, ky - 80); g.quadraticCurveTo(kx + 160, ky - 40, kx + 150, ky + 500); g.closePath(); g.fillStyle = lg(kx - 150, 0, kx + 150, 0, KID.dress); g.fill();
    kidFace(kx, ky - 220, 150, { t, eyes: 'open', look: -.6, lookY: -.3, mouth: t > T('L1') && t < E('L1') ? .15 + .15 * Math.abs(Math.sin(t * 9)) : 0, lx: 1 }); });
  layer(.6, () => { ell(-40, 1500, 420, 700); g.fillStyle = lg(-400, 900, 300, 2100, [YOU.shirt[1], YOU.shirt[2], '#2a2826']); g.fill(); ell(80, 820, 200, 240); g.fillStyle = YOU.hair[1]; g.fill(); });
  lightPass('#3a2a26'); flares(); };
// ---------- the mirror: thirty years go by in a few seconds; her face ages beside his, his doesn't; the calendar flips ----------
S.mirror = (t, u) => { const age = ss(seg(t, T('s4') + .2, W_IKAW4)), yr = Math.round(lerp(2034, 2064, age));
  setCam({ x: 540, y: 880, z: lerp(1.0, 1.1, ss(seg(u, 0, 6))), focus: 1, dof: 14, t });
  layer(2, () => { g.fillStyle = '#c8d0d4'; g.fillRect(-600, -600, 2300, 3200); for (let y = -600; y < 2600; y += 70) for (let x = -600; x < 1700; x += 70) { g.strokeStyle = 'rgba(80,90,100,.25)'; g.lineWidth = 2; g.strokeRect(x, y, 70, 70); }
    rr(840, 260, 200, 260, 6); fs('#f4f0e6', 3); g.fillStyle = '#b02a2a'; g.fillRect(840, 260, 200, 70); text(String(yr), 940, 296, 46, '#fff', 'Anton'); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { g.fillStyle = 'rgba(40,30,20,.5)'; g.fillRect(856 + c * 30, 350 + r * 38, 18, 18); } });
  layer(1, () => { rr(60, 200, 760, 1100, 20); fs('#8a8e94', 10); g.save(); rr(70, 210, 740, 1080, 14); g.clip(); g.fillStyle = '#5a5e64'; g.fillRect(70, 210, 740, 1080);
    const wifeHair = [mixHex('#120d0b', '#e8e6e2', age), mixHex('#261c17', '#c4c0ba', age), mixHex('#3e3028', '#86827c', age)];
    bust(560, 1500, 520, { t, skin: WIFE.skin, hair: wifeHair, shirt: WIFE.dress, collar: 0, female: 1, age, eyes: 'open', look: -.5, lx: 1, hairStyle: age > .6 ? 'bun' : 'long' });
    bust(290, 1520, 600, { t, skin: YOU.skin, hair: YOU.hair, shirt: YOU.shirt, eyes: 'open', look: .1, lx: 1, rim: 'rgba(255,240,220,.4)' });
    g.fillStyle = lg(70, 210, 810, 1290, ['rgba(255,255,255,.12)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.06)']); g.fillRect(70, 210, 740, 1080); g.restore();
    rr(0, 1360, 1080, 80, 6); fs('#e8e8e4', 3); });
  L(440, 300, 1300, C.white, .9, .05); lightPass('#7a7c80'); flares(); };
// ---------- the funerals: a slow dolly along the graves in the rain; first Nanay, then his wife; he never changes ----------
S.funeral = (t, u) => { const px = lerp(-80, 760, ss(seg(t, T('s5'), E('s5') + .6)));
  setCam({ x: 540 + px, y: 900, z: 1.05, focus: 1.2, dof: 14, t });
  layer(4, () => { grad('#5a6070', '#8a8e94', -600, 1800); for (let i = 0; i < 9; i++) { g.fillStyle = '#3a4440'; ell(-600 + i * 400, 1150, 260, 140); g.fill(); } });
  layer(1.6, () => { g.fillStyle = '#3e4a38'; g.fillRect(-900, 1250, 4400, 1400); for (let i = 0; i < 10; i++) tomb(-300 + i * 330, 1380, 170, '', '', t, { flowers: 0, moss: .3 }); });
  layer(1.2, () => { tomb(380, 1700, 300, 'NANAY', '1971 - 2066', t, {}); tomb(1220, 1700, 300, 'MARIA', '2001 - 2071', t, {});
    for (let i = 0; i < 5; i++) { const mx = 120 + i * 220 + px * .2, hh = 640; manReal(mx, 1780, hh, { t, cloth: { skin: OLD.skin, hair: OLD.hair, shirt: ['#2a2a2e', '#1a1a1e', '#0c0c0e'], pants: ['#1a1a1e', '#121214', '#08080a'] }, age: 1, lx: -1, eyes: 'shut' }); } });
  layer(1, () => { manReal(840 + px * .9, 1900, 900, { t, cloth: { ...YOU, shirt: ['#2a2a30', '#18181c', '#0a0a0c'] }, pose: 'hold', lx: -1, look: -.3, tear: 1, rim: 'rgba(220,230,255,.4)' });
    const ux = 840 + px * .9 + 70, uy = 1900 - 900 * .62; line([[ux, uy], [ux, uy - 420]], 8, '#16161a'); g.beginPath(); g.moveTo(ux - 320, uy - 400); g.quadraticCurveTo(ux, uy - 620, ux + 320, uy - 400); g.closePath(); g.fillStyle = '#0c0c10'; g.fill(); });
  L(540 + px, 600, 1700, C.white, .8, 0); lightPass('#4a4e58'); rainFx(t, { n: 200, a: .25, ang: .05 }); flares(); };
// ---------- the deathbed: an old, old hand in his young one; the focus pulls to her face, then to his ----------
S.deathbed = (t, u) => { const fh = ss(seg(t, T('L2') - .5, T('L2') + .2)), fm = ss(seg(t, E('L2') + .1, E('L2') + .9)), flat = ss(seg(t, E('L2') + .4, E('L2') + 1.4));
  setCam({ x: 540, y: lerp(lerp(1350, 760, fh), 720, fm), z: lerp(1.25, 1.05, fh), focus: fh > .5 && fm < .5 ? 1.4 : 1, dof: 26, t });
  layer(2.6, () => { g.fillStyle = lg(0, -600, 0, 2600, ['#2a3438', '#14181c']); g.fillRect(-600, -600, 2300, 3200); rr(760, 300, 260, 200, 10); fs('#0a0c0e', 4);
    const tr = []; for (let x = 0; x < 240; x += 4) { const p = (x / 240 + t * .5) % 1, beat = flat > .9 ? 0 : (1 - flat) * (Math.exp(-(((p - .5) / .02) ** 2)) * 60 - Math.exp(-(((p - .55) / .02) ** 2)) * 25); tr.push([770 + x, 420 - beat]); } line(tr, 4, `rgba(110,255,160,${.9})`); L(890, 400, 300, '110,255,160', .7, .15);
    rr(-200, 980, 1500, 600, 40); fs(lg(0, 980, 0, 1580, ['#e8eef0', '#a8b0b4']), 3); });
  layer(1.4, () => { g.save(); g.translate(500, 920); g.rotate(-.15); faceReal(0, 0, 210, { t, skin: OLD.skin, hair: OLD.hair, female: 1, age: 1, eyes: fm > .6 ? 'shut' : 'open', look: .4, tear: 1, lx: 1, hairStyle: 'long', mouth: t > T('L2') && t < E('L2') ? .1 + .1 * Math.abs(Math.sin(t * 8)) : 0 }); g.restore(); });
  layer(1, () => { const hx = 520, hy = 1420; handReal(hx - 240, hy + 40, 300, -.1, { skin: OLD.skin, curl: .45, sg: 1 }); for (let i = 0; i < 30; i++) curve([hx - 200 + hash(i) * 200, hy - 20 + hash(i * 2) * 100], [hx - 190 + hash(i) * 200, hy + hash(i * 3) * 100], [hx - 180 + hash(i) * 200, hy - 10 + hash(i * 2) * 100], 1.5, 'rgba(80,50,40,.35)');
    handReal(hx + 300, hy - 20, 330, Math.PI + .15, { skin: YOU.skin, curl: .5, sg: -1 });
    g.save(); g.globalAlpha = fm; faceReal(840, 760, 200, { t, skin: YOU.skin, hair: YOU.hair, eyes: 'open', look: -.5, lookY: .3, tear: 1, lx: -1, rim: 'rgba(200,220,255,.4)' }); g.restore(); });
  L(540, 900, 1300, '220,230,240', .75, .04); lightPass('#3a4246'); flares(); };
// ---------- the graves: him alone in a field of stones; the seasons and the days turn over him (slowly), moss climbs the stones ----------
S.graves = (t, u) => { const d = seg(u, 0, span('s7') + 1.2), day = .5 + .5 * Math.sin(u * 1.4);
  setCam({ x: 540, y: lerp(820, 900, d), z: lerp(1.0, 1.15, ss(d)), focus: 1, dof: 10, t });
  layer(5, () => { grad(mixHex('#0c1424', '#7a9ab8', day), mixHex('#1a2030', '#e8c8a0', day), -600, 1600); });
  layer(2, () => { g.fillStyle = mixHex('#1a2418', '#4a6a3a', day); g.fillRect(-900, 1200, 2900, 1500); for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) tomb(-100 + i * 200 + (r % 2) * 100, 1260 + r * 120, 70 + r * 25, '', '', t, { moss: d, flowers: 0 }); });
  layer(1, () => { manReal(540, 1900, 820, { t, cloth: { ...YOU, shirt: ['#3a3a40', '#26262c', '#121216'] }, lx: -1, look: 0, eyes: 'open', rim: 'rgba(255,220,180,.4)' }); for (let i = 0; i < 40; i++) { const x = hash(i * 2.2) * 1300 - 100; line([[x, 2000], [x + Math.sin(t + i) * 10, 2000 - 60 - 120 * d * hash(i)]], 4, mixHex('#1a2a14', '#5a8a3a', day)); } });
  L(540, 400, 1800, C.gold, .4 + .5 * day, .05); lightPass(mixHex('#1a2030', '#9a9a98', day)); flares(); };
// ---------- new names: his ID cards over two centuries, same face, different names, dropping onto the table ----------
const NAMES = [['JUAN DELA CRUZ', 2026], ['MIGUEL SANTOS', 2046], ['RAFAEL REYES', 2066], ['ANDRES BAUTISTA', 2086], ['LUIS MENDOZA', 2106], ['ELIAS RAMOS', 2126], ['CARLOS VILLANUEVA', 2146], ['NOEL AQUINO', 2166], ['TOMAS GARCIA', 2186]];
S.names = (t, u) => { const n = clamp(Math.floor(seg(u, 0, span('s8')) * 9.99), 0, 8);
  setCam({ x: 540, y: lerp(900, 1000, ss(seg(u, 0, 7))), z: lerp(1.0, 1.15, ss(seg(u, 0, 7))), rot: .04 - u * .01, focus: 1, dof: 12, t });
  layer(1.3, () => { g.save(); g.fillStyle = pat(TEX.wood); g.fillRect(-600, -600, 2300, 3200); g.restore(); g.fillStyle = 'rgba(30,20,10,.3)'; g.fillRect(-600, -600, 2300, 3200); });
  layer(1, () => { for (let i = 0; i <= n; i++) { const k = i === n ? eo(seg(u, i * span('s8') / 10, i * span('s8') / 10 + .3)) : 1; idCard(540 + (hash(i * 3.3) - .5) * 260, lerp(300, 950, k) + (hash(i * 5.1) - .5) * 300 + i * 20, 620, (hash(i * 7.7) - .5) * .5, NAMES[i][0], NAMES[i][1], t + i); } });
  L(540, 800, 1300, C.gold, .9, .05); lightPass('#3a2c22'); flares(); };
// ---------- the question: an hourglass, its sand running upward ----------
S.cta = (t, u) => { setCam({ x: 540, y: 900, z: lerp(1.0, 1.1, ss(seg(u, 0, 6))), focus: 1, dof: 18, t });
  layer(3, () => { g.fillStyle = '#0a0a10'; g.fillRect(-600, -600, 2300, 3200); starfield(t, 160, .6, 3); });
  layer(1, () => { hourglass(540, 1050, 420, t, seg(u, 0, 8)); });
  lightPass('#1a1820'); flares();
  const k1 = back(seg(t, T('cta') + .2, T('cta') + .5), 1.8), k2 = back(seg(t, W_OO - .1, W_OO + .2), 2); if (k1 > 0) { reset(); g.save(); g.translate(CX, 380); g.scale(k1, k1); glass(-460, -150, 920, 300, 40, 'rgba(255,255,255,.6)', 4, 'rgba(255,200,120,.5)'); text('GUGUSTUHIN MO PA BA', 0, -60, 70, '#fff', 'Anton', 'center', 10); text('NA HINDI MAMATAY?', 0, 30, 84, '#ffd27a', 'Anton', 'center', 10);
    if (k2 > 0) { g.save(); g.translate(0, 110); g.scale(k2, k2); text('COMMENT: OO o HINDI', 0, 0, 46, '#ff8a96', 'Anton'); g.restore(); } g.restore(); } };
// ---------- a thousand years: Manila under the sea; Quiapo's dome and cross above the water; a little boat; then down into the water to the old house ----------
S.flood = (t, u) => { const dive = ss(seg(t, W_BAHAY - 1.6, W_BAHAY + .4));
  setCam({ x: 540, y: lerp(880, 2700, dive), z: lerp(1.0, 1.1, ss(seg(u, 0, 4))), focus: 1, dof: 10, t });
  layer(5, () => { grad('#2a1a3a', '#ff9a5a', -600, 1300); glow(540, 1150, 500, C.sun, .7); circ(540, 1200, 140, '#ffd08a'); L(540, 1150, 1600, C.gold, .9, .2); });
  layer(2.4, () => { for (const [x, h] of [[-100, 380], [120, 520], [930, 460], [1140, 300]]) { g.fillStyle = '#2a2026'; g.fillRect(x - 60, 1250 - h, 120, h + 40); for (let k = 0; k < h / 40; k++) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 50, 1250 - h + 10 + k * 40, 100, 14); } g.fillStyle = 'rgba(140,70,40,.35)'; g.fillRect(x - 60, 1250 - h, 20, h); } quiapo(540, 1260, 230, t); });
  layer(1.6, () => { sea(t, 1250, { sunX: 540 }); bangka(380, 1420, 160, t); manReal(380, 1400, 260, { t, pose: 'reach', lx: 1, rim: 'rgba(255,190,120,.7)', look: -.5 });
    g.fillStyle = lg(0, 1700, 0, 4200, ['#0e3a52', '#062030', '#020a10']); g.fillRect(-900, 1700, 2900, 2600);
    g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 9; i++) { const x = 100 + i * 120 + Math.sin(t * .4 + i) * 40; beam([[x - 20, 1700], [x + 20, 1700], [x + 160, 3600], [x - 120, 3600]], x, 1700, x, 3600, C.sea, .12); } g.restore();
    const hx = 540, hy = 3300; g.fillStyle = '#2a3a3a'; g.fillRect(hx - 340, hy - 300, 680, 600); path([[hx - 400, hy - 300], [hx, hy - 560], [hx + 400, hy - 300]]); g.closePath(); g.fillStyle = '#3a2a24'; g.fill();
    rr(hx - 230, hy - 220, 460, 90, 8); fs('#c8a050', 3); text('SARI-SARI STORE', hx, hy - 175, 48, '#3a2a10', 'Anton'); for (const wx of [-180, 60]) { rr(hx + wx, hy - 90, 130, 150, 6); fs('#0a1418', 4); } rr(hx - 60, hy + 60, 120, 240, 6); fs('#1a1410', 3);
    for (let i = 0; i < 40; i++) { const c = ((t * .2 + hash(i)) % 1); circ(hx + (hash(i * 3) - .5) * 900, hy - 400 - c * 1100, 3 + 4 * hash(i), `rgba(200,240,255,${.4 * (1 - c)})`); }
    for (let i = 0; i < 6; i++) { const fx = ((t * 40 * (1 + hash(i)) + hash(i) * 1600) % 1600) - 300, fy = 2700 + hash(i * 2) * 500; ell(fx, fy, 22, 9); g.fillStyle = '#5a8aa0'; g.fill(); path([[fx - 22, fy], [fx - 38, fy - 10], [fx - 38, fy + 10]]); g.closePath(); g.fill(); }
    L(hx, hy - 300, 900, C.sea, .7 * dive, .05); });
  lightPass(mixHex('#3a2a40', '#0a2a3a', dive)); flares(); };
// ---------- a million years: tall, pale people of the far future in a strange city; they look at him; then him alone by a fire, a photo in his hand ----------
S.future = (t, u) => { const alone = ss(seg(t, T('s12') - .3, T('s12') + .5));
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.1, ss(seg(u, 0, 8))), focus: alone > .5 ? 1 : 1.5, dof: 14, t });
  if (alone < 1) { layer(5, () => { grad('#1a1440', '#6a4a8a', -600, 1800); nebula(t, 540, 300, 700, '180,120,255', '120,200,255', .4); for (let i = 0; i < 7; i++) { const x = -100 + i * 200, hh = 900 + 500 * hash(i); g.fillStyle = lg(0, 1300 - hh, 0, 1300, ['rgba(200,220,255,.5)', 'rgba(60,40,120,.8)']); g.beginPath(); g.moveTo(x - 50, 1300); g.quadraticCurveTo(x - 10, 1300 - hh * .6, x, 1300 - hh); g.quadraticCurveTo(x + 10, 1300 - hh * .6, x + 50, 1300); g.closePath(); g.fill(); circ(x, 1300 - hh, 20, '#e8f0ff'); L(x, 1300 - hh, 200, '200,220,255', .8, .3); } });
    layer(1.5, () => { g.fillStyle = '#2a2040'; g.fillRect(-900, 1300, 2900, 1300); for (let i = 0; i < 5; i++) { const x = 120 + i * 210, y = 1700, hh = 1050; g.save(); g.globalAlpha = 1 - alone; ell(x, y - hh * .92, hh * .045, hh * .07); g.fillStyle = '#c8d0e8'; g.fill(); for (const sg of [-1, 1]) { ell(x + sg * hh * .015, y - hh * .92, hh * .01, hh * .016); g.fillStyle = '#0a0a20'; g.fill(); circ(x + sg * hh * .015, y - hh * .92, 2, '#aaf'); } rr(x - hh * .05, y - hh * .85, hh * .1, hh * .85, hh * .04); g.fillStyle = lg(x - hh * .05, 0, x + hh * .05, 0, ['#e8ecf8', '#9aa0c0']); g.fill(); L(x, y - hh * .5, 300, '200,210,255', .6, .1); g.restore(); } });
    layer(1, () => { g.save(); g.globalAlpha = 1 - alone; manReal(560, 1900, 760, { t, cloth: { ...YOU, shirt: ['#6a5a4a', '#4a3e32', '#2a221a'] }, lx: 1, look: -.3, rim: 'rgba(200,180,255,.5)' }); g.restore(); }); }
  if (alone > 0) { g.save(); g.globalAlpha = alone; layer(3, () => { g.fillStyle = '#05060c'; g.fillRect(-600, -600, 2300, 3200); starfield(t, 300, 1, 9); });
    layer(1, () => { g.fillStyle = '#100c0a'; g.fillRect(-600, 1600, 2300, 1000); for (let k = 0; k < 5; k++) { g.save(); g.translate(700, 1640); g.rotate(-1 + k * .5); g.fillStyle = '#3a2618'; g.fillRect(-10, -80, 20, 100); g.restore(); } fire(700, 1640, 120, 220, t, 1);
      bust(400, 1900, 640, { t, skin: YOU.skin, hair: YOU.hair, shirt: ['#5a4a3a', '#3e3228', '#1e1814'], eyes: 'open', look: .6, lookY: .4, tear: 1, lx: 1, rim: 'rgba(255,150,70,.7)', mouth: .1 + .08 * Math.abs(Math.sin(t * 6)) });
      rr(520, 1640, 110, 140, 6); fs('#e8e2d0', 3); g.save(); rr(530, 1650, 90, 110, 4); g.clip(); kidFace(575, 1700, 40, { t, eyes: 'open', smile: 1, lx: -1 }); g.restore(); handReal(540, 1840, 160, -1.3, { skin: YOU.skin, curl: .5 }); });
    g.restore(); }
  lightPass(alone > .5 ? '#1a1214' : '#2a2240'); embersUp(t, alone > .5 ? 20 : 0, .6, .3); flares(); };
// ---------- a billion years: the sun fills the sky, the sea boils to steam, the ground cracks; the air shimmers; he is the last thing alive ----------
S.sun = (t, u) => { const boil = ss(seg(t, W_KUMUKULO - .3, W_KUMUKULO + 1.5));
  setCam({ x: 540, y: lerp(900, 980, ss(seg(u, 0, 7))), z: lerp(1.05, 1.0, ss(seg(u, 0, 7))), focus: 1.2, dof: 0, t });
  layer(6, () => { grad('#2a0604', '#ff6a20', -600, 1500); redSun(540, 760, lerp(420, 520, ss(seg(u, 0, 8))), t); });
  layer(2, () => { g.fillStyle = lg(0, 1300, 0, 2600, ['#6a2a14', '#2a0a04']); g.fillRect(-900, 1300, 2900, 1500); for (let i = 0; i < 40; i++) { const x = hash(i * 2.2) * 1800 - 400, y = 1350 + hash(i * 3.3) ** 2 * 1100; line([[x, y], [x + 40 + 80 * hash(i), y + (hash(i) - .5) * 30], [x + 70 + 140 * hash(i), y + (hash(i * 5) - .5) * 40]], 2 + 3 * hash(i), 'rgba(255,120,40,.5)'); }
    for (let i = 0; i < 18; i++) { const p = ((t * .15 + i / 18) % 1), x = hash(i * 7.1) * 1400 - 160; circ(x + Math.sin(p * 4 + i) * 40, 1320 - p * 600, 30 + 120 * p, `rgba(255,230,210,${.35 * boil * (1 - p)})`); } });
  layer(1, () => { manReal(540, 1950, 600, { t, cloth: { ...YOU, shirt: ['#4a3a30', '#2a2018', '#120c08'] }, lx: 0, rim: 'rgba(255,140,60,.8)', eyes: 'open', look: 0, lookY: -.6 }); });
  lightPass('#5a1a10'); shimmer(t, 1, 800, H); embersUp(t, 40, .6, .3); flares(); };
// ---------- five billion years: the swollen sun swallows the Earth; he floats in the foreground, alive ----------
S.swallow = (t, u) => { const k = ss(seg(t, W_NILAMON - .5, W_NILAMON + 1.6)), fl = ss(seg(t, W_LUMUTANG - .4, W_LUMUTANG + .8));
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.08, ss(seg(u, 0, 7))), focus: lerp(3, 1, fl), dof: 8, t });
  layer(8, () => { g.fillStyle = '#020206'; g.fillRect(-900, -900, 2900, 3800); starfield(t, 300, .9, 1); nebula(t, 900, 300, 600, '255,100,60', '120,60,200', .25); });
  layer(3, () => { redSun(lerp(-60, 160, k), 820, lerp(380, 640, k), t); const ex = lerp(760, 640, k); g.save(); g.globalAlpha = 1 - ss(seg(k, .75, 1)); earth(ex, 900, 120 * (1 - .3 * k), t, { burn: k, lit: -1 }); g.restore(); if (k > .7) glow(ex, 900, 300, C.ember, (k - .7) * 2); });
  layer(1, () => { g.save(); g.globalAlpha = fl; g.translate(700, 1450); g.rotate(-.4 + Math.sin(t * .3) * .1); manReal(0, 400, 820, { t, cloth: { ...YOU, shirt: ['#3a2e26', '#22201a', '#100c08'] }, pose: 'reach', lx: -1, rim: 'rgba(255,120,60,.8)', eyes: 'open', look: -.6 }); g.restore(); });
  lightPass('#1a0c10'); flares(); };
// ---------- drifting: his face close, eyes open, no breath, no sound; stars wheel slowly behind ----------
S.drift = (t, u) => { setCam({ x: 540, y: 900, z: lerp(1.0, 1.12, ss(seg(u, 0, 6))), rot: u * .03, focus: 1, dof: 14, t });
  layer(4, () => { g.fillStyle = '#010104'; g.fillRect(-900, -900, 2900, 3800); g.save(); g.translate(540, 900); g.rotate(t * .02); g.translate(-540, -900); starfield(t, 400, 1, 5); g.restore(); });
  layer(1, () => { bust(540, 1700, 760, { t, skin: YOU.skin, hair: YOU.hair, shirt: ['#2a2420', '#1a1612', '#0a0806'], eyes: 'open', look: .1, lookY: -.1, lx: 1, breathe: 0, rim: 'rgba(170,190,255,.5)' });
    for (let i = 0; i < 20; i++) circ(400 + hash(i * 2) * 280, 760 + hash(i * 3) * 120, 2 + 2 * hash(i), 'rgba(220,235,255,.6)'); });
  L(1000, 600, 1200, '170,190,255', .6, .05); lightPass('#0c0e18'); flares(); };
// ---------- a hundred trillion years: the stars go out one by one ----------
S.stars = (t, u) => { const die = ss(seg(t, W_ISAISA - .3, E('s16') + 1.5));
  setCam({ x: 540, y: 900, z: lerp(1.15, 1.0, ss(seg(u, 0, 6))), focus: 1, dof: 0, t });
  layer(1, () => { g.fillStyle = '#000003'; g.fillRect(-900, -900, 2900, 3800); nebula(t, 540, 900, 900, '120,90,200', '60,120,200', .35 * (1 - die)); starfield(t, 900, 1, 2, die * .97);
    g.save(); g.translate(540, 900); g.rotate(.4); for (let i = 0; i < 400; i++) { const a = i * .15, d = 20 + i * 1.4; circ(Math.cos(a) * d * 1.6, Math.sin(a) * d * .5, 1.5, `rgba(220,210,255,${.5 * (1 - die) * (1 - i / 400)})`); } g.restore(); });
  lightPass('#0c0c18'); flares(); };
// ---------- the dark: one last ember of light on his face, and then nothing; a slow drift of dust ----------
S.dark = (t, u) => { const k = ss(seg(t, W_DILIM - 1.2, W_DILIM + 1.2));
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.1, ss(seg(u, 0, 6))), focus: 1, dof: 10, t });
  layer(1, () => { g.fillStyle = '#000'; g.fillRect(-900, -900, 2900, 3800); g.save(); g.globalAlpha = 1 - k; bust(540, 1700, 700, { t, skin: YOU.skin, hair: YOU.hair, shirt: ['#1a1612', '#100c0a', '#060404'], eyes: 'open', look: 0, lx: 1, breathe: 0, rim: 'rgba(255,180,120,.6)' }); g.restore(); L(700, 900, 500, C.ember, .5 * (1 - k), .05 * (1 - k)); });
  lightPass('#000000'); reset(); for (let i = 0; i < 30; i++) circ(hash(i * 3.3) * W, ((hash(i) * H + t * 8) % H), 1.2, `rgba(140,140,160,${.25 * (1 - k * .5)})`); };
// ---------- a memory: out of the dark, a warm afternoon; his little girl running to him across the grass, laughing ----------
S.memory = (t, u) => { const k = ss(seg(t, T('L3') - 1.4, T('L3') + .2)), run = seg(t, T('L3') - 1.2, E('L3') + 1.2);
  setCam({ x: 540, y: 900, z: lerp(1.0, 1.1, ss(seg(u, 0, 6))), focus: 1, dof: 30, t });
  layer(1, () => { g.fillStyle = '#000'; g.fillRect(-900, -900, 2900, 3800); });
  g.save(); g.globalAlpha = k;
  layer(4, () => { grad('#ffd8a0', '#ffb070', -600, 1300); glow(820, 500, 600, C.gold, .8); for (let i = 0; i < 5; i++) palm(-100 + i * 300, 1350, 700 + 100 * hash(i), t, i, '#5a7a3a'); });
  layer(1.6, () => { g.fillStyle = lg(0, 1300, 0, 2600, ['#8ab060', '#4a7a30']); g.fillRect(-900, 1300, 2900, 1400); for (let i = 0; i < 120; i++) { const x = hash(i * 2.7) * 1400 - 160, y = 1320 + hash(i * 3.1) * 900; line([[x, y], [x + Math.sin(t + i) * 6, y - 20 - 30 * hash(i)]], 3, '#3a6a24'); } });
  layer(1, () => { const kx = lerp(900, 560, ss(run)), ky = 1700, bob = Math.abs(Math.sin(t * 8)) * 20; g.beginPath(); g.moveTo(kx - 110, ky - bob); g.quadraticCurveTo(kx - 120, ky - 300 - bob, kx - 40, ky - 330 - bob); g.lineTo(kx + 40, ky - 330 - bob); g.quadraticCurveTo(kx + 120, ky - 300 - bob, kx + 110, ky - bob); g.closePath(); g.fillStyle = lg(kx - 110, 0, kx + 110, 0, KID.dress); g.fill();
    for (const sg of [-1, 1]) limb([[kx + sg * 50, ky - bob], [kx + sg * 60 + Math.sin(t * 8 + sg) * 30, ky + 100], [kx + sg * 55 + Math.sin(t * 8 + sg) * 40, ky + 190]], 34, KID.skin);
    kidFace(kx, ky - 430 - bob, 110, { t, eyes: 'open', smile: 1, mouth: .35, look: -.5, lx: 1 }); });
  g.restore();
  lightPass(mixHex('#000000', '#c8a888', k)); leaks(t, k); };
// ---------- the end: back to the beginning of it all, the living room; he holds his little girl tight; YAKAPIN MO SILA NGAYON ----------
S.end = (t, u) => { const hug = ss(seg(t, T('s19'), T('s19') + 1.2));
  setCam({ x: 540, y: lerp(900, 840, ss(seg(u, 0, 9))), z: lerp(1.05, 1.25, ss(seg(u, 0, 9))), focus: 1, dof: 24, t });
  layer(2.4, () => { homeRoom(t); });
  layer(1, () => { const x = 540; bust(x - 120, 2100, 900, { t, skin: YOU.skin, hair: YOU.hair, shirt: YOU.shirt, eyes: 'shut', tear: 1, smile: 1, lx: 1, rim: 'rgba(255,200,140,.5)' });
    g.beginPath(); g.moveTo(x + 40, 2100); g.quadraticCurveTo(x + 30, 1600, x + 160, 1560); g.lineTo(x + 320, 1560); g.quadraticCurveTo(x + 440, 1600, x + 430, 2100); g.closePath(); g.fillStyle = lg(x, 0, x + 440, 0, KID.dress); g.fill();
    kidFace(x + 240, 1380, 140, { t, eyes: 'shut', smile: 1, lx: -1, turn: -.3 });
    for (const sg of [-1, 1]) { limb([[x - 120 + sg * 280, 1750], [x + 40 + sg * 40, 1820], [x + 230 + sg * 80, 1700]], 90, YOU.shirt, 1); } handReal(x + 330, 1690, 200, -.6, { skin: YOU.skin, curl: .5 }); });
  lightPass('#4a3428'); leaks(t, .6); flares();
  const a = back(seg(t, W_YAKAPIN - .1, W_YAKAPIN + .25), 1.6); if (a > 0) { reset(); g.save(); g.translate(CX, 420); g.scale(a, a); g.shadowColor = 'rgba(255,190,120,.9)'; g.shadowBlur = 36; text('YAKAPIN MO SILA', 0, -60, 100, '#fff', 'Anton', 'center', 12); text('NGAYON.', 0, 60, 150, '#ffd27a', 'Anton', 'center', 14); g.restore(); } };

// ---------- the year counter (an odometer: the digits roll up between shots) ----------
const YEAR = { fall: 1, rise: 1, viral: 1, accidents: 4, family: 9, mirror: 30, funeral: 62, deathbed: 91, graves: 92, names: 260, flood: 1000, future: 1e6, sun: 1e9, swallow: 5e9, drift: 5e9, stars: 1e14, dark: -1, loop: 1 };
function yearCounter(t, sh, u) {
  const v = YEAR[sh[2]]; if (v === undefined) return; const prevSh = SHOTS[SHOTS.indexOf(sh) - 1], pv = prevSh && YEAR[prevSh[2]] > 0 ? YEAR[prevSh[2]] : v;
  const k = ss(seg(u, .05, 1.1)), a = ss(seg(u, 0, .25));
  let s; if (v < 0) s = '∞'; else { const val = Math.exp(lerp(Math.log(pv + 1), Math.log(v + 1), k)) - 1; s = Math.round(val).toLocaleString('en-US'); }
  reset(); g.globalAlpha = a; g.save(); g.translate(CX, 200);
  g.font = '120px Anton'; const w = Math.min(980, g.measureText(s).width + 80), sc = Math.min(1, 900 / g.measureText(s).width);
  glass(-w / 2, -95, w, 190, 28, 'rgba(255,210,122,.5)', 3, 'rgba(255,170,80,.5)'); text('TAON', 0, -60, 34, '#ffd27a', 'Anton');
  g.save(); g.translate(0, 20); g.scale(sc, sc); if (k < 1 && k > 0) { g.filter = `blur(${(Math.sin(k * Math.PI) * 3).toFixed(1)}px)`; } g.shadowColor = 'rgba(255,170,80,.8)'; g.shadowBlur = 26; text(s, 0, 0, 120, '#fff', 'Anton', 'center', 10); g.restore();
  g.restore(); g.globalAlpha = 1;
}
function titleCard(t, a) {
  if (a <= 0) return; reset(); g.globalAlpha = a; g.save(); g.translate(CX, 470);
  glass(-480, -160, 960, 320, 36, 'rgba(255,120,60,.6)', 3, 'rgba(255,120,60,.6)');
  text('PAANO KUNG', 0, -80, 80, '#f4f1ea', 'Anton', 'center', 12);
  g.font = '130px Anton'; const s2 = Math.min(1, 900 / g.measureText('HINDI KA NAMAMATAY?').width); g.save(); g.translate(0, 45); g.scale(s2, s2); g.shadowColor = 'rgba(255,90,40,.9)'; g.shadowBlur = 34; text('HINDI KA NAMAMATAY?', 0, 0, 130, '#ff7a4a', 'Anton', 'center', 14); g.restore();
  g.restore(); g.globalAlpha = 1;
}
function grain(t) { reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .09; const f = Math.floor(t * 24), ox = -hash(f) * 300, oy = -hash(f * 1.7) * 300; g.drawImage(TEX.paper, ox, oy, W + 300, H + 300); reset(); }
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .28; g.filter = 'blur(18px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .2, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
function bokeh(t, n, y0, y1, sp = 30, a = .7, seed = 0) { for (let i = 0; i < n; i++) { const c = [C.sodium || '255,150,60', C.warm, C.red, C.cyan, C.mag, C.grn][Math.floor(hash(i * 3.3 + seed) * 6)], x = ((hash(i * 1.7 + seed) * 1600 + t * sp * (.5 + hash(i))) % 1600) - 260, y = lerp(y0, y1, hash(i * 5.9 + seed)), r = 20 + 60 * hash(i * 2.2 + seed); g.fillStyle = rg(x, y, r * .5, r, [`rgba(${c},${a * .5})`, `rgba(${c},${a * .35})`, `rgba(${c},0)`]); g.fillRect(x - r, y - r, 2 * r, 2 * r); L(x, y, r * 1.5, null, .5); } }

const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = []; FLARES.length = 0;
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  ZK = 1; S[sh[2]](t, u);
  bloom(); vignette(.6); grain(t); reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .5; g.drawImage(TEX.brush, 0, 0); reset();
  if (sh[0] > 0 && sh[2] !== 'rise') { const d = 1 - ss(seg(u, 0, .22)); if (d > 0) { reset(); g.fillStyle = `rgba(0,0,0,${.75 * d})`; g.fillRect(0, 0, W, H); } }
  const nx = SHOTS[SHOTS.indexOf(sh) + 1]; if (nx && sh[2] !== 'fall') { const d = ss(seg(t, sh[1] - .14, sh[1])); if (d > 0) { reset(); g.fillStyle = `rgba(0,0,0,${.6 * d})`; g.fillRect(0, 0, W, H); } }
  yearCounter(t, sh, u);
  if (sh[2] === 'rise') titleCard(t, ss(seg(t, W_SUMPA - .4, W_SUMPA + .1)) * (1 - ss(seg(t, sh[1] - .4, sh[1]))));
  if (sh[2] === 'loop') titleCard(t, ss(seg(u, .3, .8)));
  if (sh[2] !== 'loop' && sh[2] !== 'end') captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

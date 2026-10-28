// Super El Niño (imagine four months without rain in the Philippines, and you hold the key to your family's last water): a painterly Pinoy what-if reel, 1080x1920.
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
// Look and engine from ../presidente and ../aswang: every scene is drawn in its true colours, then darkened, and only the lights
// (the sun, the heat, lamps, phone screens, the clinic's tube) bring the colour back. Smooth camera, no glitches.
const W = 1080, H = 1920, CX = W / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'); let g = cv.getContext('2d');
const LANG = new URLSearchParams(location.search).get('lang') || 'tl';     // tl (default) | en
const SUF = LANG === 'tl' ? '' : '.' + LANG;
const TL = await (await fetch(`timeline${SUF}.json`)).json();
const ANCH = SUF ? await (await fetch(`anchors${SUF}.json`)).json() : {};
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
const TX = {
  tl: { t1: 'IMAGINE: SUPER EL NIÑO', t2: '4 BUWANG WALANG ULAN', rule: 'BUWAN ',
        months: [['m1', 'MAINIT LANG'], ['m2', 'NAGBITAK ANG LUPA'], ['m3', 'TAGTUYOT'], ['m4', 'ANG HULING TANGKE']],
        share: ['I-COMMENT MO', 'PAANO NAGHAHANDA ANG PAMILYA MO'], share2: ['I-SHARE MO', 'SA PAMILYA MO'], cal: '2026' },
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
const REDCAP = ['hook', 'key', 'knock', 'clinic', 'valve', 'truck'];
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
const mixHex = (a, b, u) => { const p = h => h[0] === '#' ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).map(Number), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };   // takes '#rrggbb' or 'rgb(r,g,b)', so mixes can nest
const pat = c => g.createPattern(c, 'repeat');
const YOU = { hood: ['#3a8ac8', '#2a6aa0', '#173a5a'], legs: JEANC, skin: ['#c48a64', '#9a6444', '#5a3624'], hair: HAIRC };
const MIA = { hood: ['#f2c430', '#c89a20', '#6a5010'], legs: ['#d86a8a', '#a84a66', '#5a2236'], skin: ['#d0a080', '#a87656', '#62402a'], hair: ['#2a1d14', '#1d1410', '#0b0807'], longHair: 1 };
const TATAY = { hood: ['#c8b48a', '#a08a64', '#5a4a30'], legs: ['#5a5040', '#3a3428', '#1e1a14'], skin: ['#a8724e', '#80523a', '#4a2e1e'], hair: ['#3a3430', '#2a2420', '#141010'] };
const NANAY = { hood: ['#d86a8a', '#a84a66', '#5a2236'], legs: ['#5a4a6a', '#3a2e46', '#1e1828'], skin: ['#c8946c', '#a06e4c', '#5e3e28'], hair: ['#2a1d14', '#1d1410', '#0b0807'], longHair: 1 };
// the facts on screen: [label, big, small] (drawn by statCard, up top)
const STATS = { s3: ['EL NIÑO', 'TUWING 2–7 TAON', 'umiinit ang gitna ng Pacific'], m2c: ['1 KILO NG BIGAS', 'LIBO-LIBONG LITRO', 'ng tubig ang kailangan'], m2e: ['ANG KATAWAN MO', '60% TUBIG', 'mawalan ng 2% = bumabagal ang isip'],
  m2g: ['ANGAT DAM', '~90%', 'ng tubig ng Metro Manila'], m4c: ['ANG KATAWAN NG BATA', 'MAS MABILIS', 'matuyuan kaysa sa matanda'],
  m4d: ['PAGTATAE', 'TUBIG + ORS', 'malinis na tubig, oral rehydration salts'], r1: ['PAKULUAN ANG TUBIG', '1 BUONG MINUTO', 'malakas na kulo'], f2: ['1 MM NA ULAN × 1 M² NA BUBONG', '1 LITRO', 'ang matematika ng balde'] };
TL.lines.forEach(l => { if (STATS[l.id]) l.stat = STATS[l.id]; });

// ---------- the land: sky, sun, mountains, paddies (green to cracked), the house, the tank, the fence and Mia's bottle ----------
function sky(t, o = {}) {
  const h = o.heat || 0, d = o.dusk || 0, n = o.night || 0;
  grad(mixHex(mixHex(mixHex('#4f94d0', '#e8c890', h), '#e0784a', d), '#0a1028', n), mixHex(mixHex(mixHex('#bfe0f0', '#ffe2a8', h), '#f6b060', d), '#1c2448', n), -400, 1300);
  if (o.sun) { const [sx, sy] = o.sun, r = o.sr || 90; glow(sx, sy, r * 7, '255,214,140', .55 + .25 * h); circ(sx, sy, r, '#fff6dc'); L(sx, sy, r * 16, C.warm, .95, .22); }
  if (n > .5) for (let i = 0; i < 120; i++) circ(hash(i * 3.7) * W, hash(i * 5.1) * 900 - 100, 1 + 1.5 * hash(i), `rgba(225,232,255,${.3 + .5 * hash(i + 1)})`);
  if (o.clouds) for (let i = 0; i < 6; i++) { const x = ((hash(i * 3) * 1500 + t * 12) % 1700) - 300, y = 180 + 300 * hash(i * 7); for (let k = 0; k < 4; k++) { ell(x + k * 60, y - 20 * Math.sin(k * 1.3), 90, 46); g.fillStyle = o.clouds; g.fill(); } }
}
function mountains(y, col = '#6a7a8a', col2 = '#8a98a8') {
  path([[-400, y], [-100, y - 170], [120, y - 90], [330, y - 230], [560, y - 120], [760, y - 260], [980, y - 140], [1200, y - 210], [1500, y], [1500, y + 40], [-400, y + 40]]); g.closePath(); g.fillStyle = col2; g.fill();
  path([[-400, y], [0, y - 90], [260, y - 50], [520, y - 140], [800, y - 70], [1100, y - 130], [1500, y], [1500, y + 40], [-400, y + 40]]); g.closePath(); g.fillStyle = col; g.fill();
}
function paddies(t, y0, dry = 0, o = {}) {      // rice fields from the horizon y0 to the bottom; dry 0 = green and wet, 1 = brown and cracked
  g.fillStyle = lg(0, y0, 0, 2000, [mixHex('#6a9a48', '#c8a070', dry), mixHex('#3a6a2a', '#8a6038', dry)]); g.fillRect(-400, y0, 1900, 2000 - y0);
  for (let r = 0; r < 26; r++) { const u = r / 25, y = y0 + Math.pow(u, 1.7) * (2000 - y0), sc = .15 + u * 1.2;
    if (dry < .9) { if (dry < .3 && r % 3 === 0) { g.fillStyle = `rgba(190,225,255,${.25 * (1 - dry * 3)})`; g.fillRect(-400, y, 1900, 4 + 6 * u); }
      for (let k = 0; k < 40; k++) { const x = -200 + (k + (r % 2) * .5) * 38 * (1 + u * 1.4) - u * 700 + 540 * (1 - (1 + u * 1.4)) * 0, hh = (14 + 30 * u) * (1 - dry) * (1 + .15 * Math.sin(t * 1.3 + k + r)); if (x < -60 || x > 1140) continue;
        for (const d of [-1, 0, 1]) line([[x, y], [x + d * 5 * sc + 3 * Math.sin(t + k), y - hh]], 1.5 + 2 * u, mixHex('#4a8a2a', '#a08040', dry)); } } }
  if (dry > .25) { g.save(); g.globalAlpha = clamp((dry - .25) * 1.6); for (let i = 0; i < 160; i++) { let x = hash(i * 3.1) * 1300 - 110, yb = y0 + Math.pow(hash(i * 5.3), 1.4) * (2000 - y0), u = (yb - y0) / (2000 - y0); const pts = [[x, yb]];
      for (let k = 0; k < 5; k++) { x += (hash(i * 7 + k) - .5) * 90 * (.3 + u); yb += (hash(i * 11 + k) - .3) * 40 * (.3 + u); pts.push([x, yb]); } line(pts, 1.5 + 4 * u, 'rgba(60,34,16,.7)'); } g.restore(); }
  if (o.heat) for (let k = 0; k < 6; k++) { const y = y0 - 10 - k * 14; g.strokeStyle = `rgba(255,240,210,${.06 * o.heat})`; g.lineWidth = 6; g.beginPath(); for (let x = -40; x < 1120; x += 20) g.lineTo(x, y + 6 * Math.sin(x * .03 + t * 5 + k)); g.stroke(); }
}
function house(x, y, s, t, o = {}) {           // a concrete-and-wood farmhouse with a red GI roof; (x, y) = the ground under its middle; s = px per metre
  const w = 7 * s, h = 3.2 * s; g.fillStyle = '#d8c8a0'; g.fillRect(x - w / 2, y - h, w, h); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - w / 2, y - h * .35, w, h * .35);
  path([[x - w / 2 - .5 * s, y - h], [x, y - h - 2.2 * s], [x + w / 2 + .5 * s, y - h]]); g.closePath(); g.fillStyle = '#8a3a2a'; g.fill(); for (let k = 0; k < 14; k++) line([[x - w / 2 + k * w / 13, y - h], [x + (k - 6.5) * w / 26, y - h - 2.1 * s]], 2, 'rgba(0,0,0,.2)');
  rr(x - w * .35, y - h * .75, w * .22, h * .35, 4); g.fillStyle = o.lit ? '#ffd890' : '#3a4a5a'; g.fill(); if (o.lit) L(x - w * .24, y - h * .57, w * .5, C.warm, .8, .2);
  rr(x + w * .1, y - h * .7, w * .16, h * .7, 3); g.fillStyle = '#5a3a22'; g.fill(); g.strokeStyle = '#3a2412'; g.lineWidth = 3; g.stroke();
}
function tank(x, y, s, level = .5, o = {}) {    // the blue water tank behind the paddies, with a level window
  const w = 1.6 * s, h = 2.0 * s; for (const dx of [-.6, .6]) { g.fillStyle = '#5a5048'; g.fillRect(x + dx * s - 6, y - .7 * s, 12, .7 * s); } g.fillStyle = '#4a4038'; g.fillRect(x - w * .6, y - .75 * s, w * 1.2, 12);
  const yb = y - .75 * s; rr(x - w / 2, yb - h, w, h, 14); g.fillStyle = lg(x - w / 2, 0, x + w / 2, 0, ['#1e5aa0', '#3a8ad8', '#1a4a88']); g.fill(); for (let k = 1; k < 5; k++) line([[x - w / 2, yb - h * k / 5], [x + w / 2, yb - h * k / 5]], 3, 'rgba(0,0,30,.25)');
  ell(x, yb - h, w / 2, w * .12); g.fillStyle = '#2a6ab8'; g.fill(); rr(x + w * .28, yb - h * .9, w * .1, h * .8, 4); g.fillStyle = 'rgba(200,230,255,.35)'; g.fill(); g.fillStyle = '#9ad0ff'; g.fillRect(x + w * .28, yb - h * .1 - h * .7 * level, w * .1, h * .7 * level);
  line([[x - w / 2, yb - h * .12], [x - w / 2 - .5 * s, yb - h * .12]], 10, '#8a8a8a'); circ(x - w / 2 - .5 * s, yb - h * .12, 14, '#c03030');
  if (o.lock) { rr(x - w / 2 - .5 * s - 18, yb - h * .12 + 10, 36, 32, 6); g.fillStyle = '#c8a050'; g.fill(); g.strokeStyle = '#8a6a2a'; g.lineWidth = 5; g.beginPath(); g.arc(x - w / 2 - .5 * s, yb - h * .12 + 10, 12, Math.PI, 0); g.stroke(); }
  return [x - w / 2 - .5 * s, yb - h * .12];
}
function bamboo(x0, x1, y, h = 150, col = '#7a5a2a') { for (let x = x0; x < x1; x += 46) { g.fillStyle = col; g.fillRect(x, y - h - 12 * hash(x), 16, h + 12 * hash(x)); } for (const yy of [y - h * .8, y - h * .4]) { g.fillStyle = col; g.fillRect(x0, yy, x1 - x0, 12); } }
function bottle(x, y, s, level = 0, t = 0) {     // Mia's rain gauge: a cut softdrink bottle, a strip of tape marked every centimetre
  const w = .5 * s, h = 1.4 * s;
  if (level > 0) { g.save(); rr(x - w / 2, y - h, w, h, w * .2); g.clip(); g.fillStyle = 'rgba(120,190,255,.55)'; g.fillRect(x - w / 2, y - h * .1 - level * h * .08, w, level * h * .08 + h * .1); g.restore(); }
  rr(x - w / 2, y - h, w, h, w * .2); g.fillStyle = 'rgba(210,240,230,.22)'; g.fill(); g.strokeStyle = 'rgba(230,250,245,.8)'; g.lineWidth = 3; g.stroke();
  line([[x - w * .3, y - h * .95], [x - w * .3, y - h * .1]], 3, 'rgba(255,255,255,.5)');
  g.fillStyle = '#e8dcb0'; g.fillRect(x + w * .08, y - h * .95, w * .26, h * .88); for (let k = 0; k < 12; k++) line([[x + w * .08, y - h * .1 - k * h * .08], [x + w * .2, y - h * .1 - k * h * .08]], 2, '#3a2a1a');
}
function sack(x, y, s) { rr(x - 90 * s, y - 170 * s, 180 * s, 170 * s, 30 * s); fs('#e8e4d8', 4 * s); g.fillStyle = '#2a4a8a'; g.fillRect(x - 60 * s, y - 120 * s, 120 * s, 50 * s); text('BIGAS', x, y - 95 * s, 34 * s, '#e8e4d8', 'Anton'); ell(x, y - 170 * s, 60 * s, 18 * s); fs('#d8d4c8', 3 * s); }
function salakot(x, y, h) { const hy = y - h * .855 - h * .14 * .38, r = h * .14; path([[x - 1.55 * r, hy - .42 * r], [x, hy - 1.6 * r], [x + 1.55 * r, hy - .42 * r]]); g.closePath(); g.fillStyle = '#c8a050'; g.fill(); g.strokeStyle = '#7a5a2a'; g.lineWidth = 3; g.stroke(); for (let k = 1; k < 5; k++) line([[x - 1.55 * r * (1 - k * .2), hy - .42 * r - k * .236 * r], [x + 1.55 * r * (1 - k * .2), hy - .42 * r - k * .236 * r]], 2, 'rgba(90,60,20,.6)'); }
function bucket(x, y, s, fill = 0, col = '#2a7ad8') { path([[x - .4 * s, y - .8 * s], [x + .4 * s, y - .8 * s], [x + .32 * s, y], [x - .32 * s, y]]); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 3; g.stroke();
  ell(x, y - .8 * s, .4 * s, .1 * s); g.fillStyle = fill > 0 ? mixHex('#1a2a3a', '#9ad0ff', fill) : '#141a22'; g.fill(); curve([x - .4 * s, y - .8 * s], [x, y - 1.3 * s], [x + .4 * s, y - .8 * s], 3, '#888'); }
function gallon(x, y, s, label = 0) { rr(x - .3 * s, y - .9 * s, .6 * s, .9 * s, .1 * s); g.fillStyle = 'rgba(170,220,240,.75)'; g.fill(); g.strokeStyle = 'rgba(80,120,140,.8)'; g.lineWidth = 3; g.stroke(); rr(x - .1 * s, y - 1.05 * s, .2 * s, .16 * s, 4); g.fillStyle = '#2a6ab8'; g.fill(); if (label) { g.fillStyle = '#f0f0f0'; g.fillRect(x - .25 * s, y - .6 * s, .5 * s, .25 * s); } }
function drop(x, y, s, a = 1) { g.save(); g.globalAlpha = a; g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x + s * .7, y, x, y + s * .5); g.quadraticCurveTo(x - s * .7, y, x, y - s); g.fillStyle = '#bfe6ff'; g.fill(); circ(x - s * .2, y - s * .1, s * .15, '#fff'); g.restore(); }
function steam(x, y, t, a = .3, n = 3, s = 1) { for (let k = 0; k < n; k++) { const p = ((t * .6) + k / n) % 1; curve([x + 20 * (k - 1) * s, y], [x + 30 * Math.sin(t * 2 + k) * s, y - 90 * p * s], [x + 20 * Math.sin(t * 1.4 + k * 2) * s, y - 180 * p * s], 7 * s, `rgba(240,240,250,${a * (1 - p)})`); } }
function room(t, o = {}) {                      // inside the house: a painted wall, a window, the wooden floor
  g.fillStyle = lg(0, 0, 0, 1400, [o.wall || '#c8b890', mixHex(o.wall || '#c8b890', '#5a4a30', .4)]); g.fillRect(-400, -400, 1900, 1800);
  if (o.win) { const [a, b, c, d] = o.win; g.save(); g.beginPath(); g.rect(a, b, c - a, d - b); g.clip(); (o.outside || (() => sky(t, { heat: .6 })))(a, b, c, d); g.restore(); g.strokeStyle = '#4a3020'; g.lineWidth = 22; g.strokeRect(a, b, c - a, d - b); line([[(a + c) / 2, b], [(a + c) / 2, d]], 10, '#4a3020'); }
  g.fillStyle = lg(0, 1400, 0, 2100, ['#7a5a3a', '#3a2814']); g.fillRect(-400, 1400, 1900, 800); for (let k = -10; k <= 10; k++) line([[540 + k * 60, 1400], [540 + k * 160, 2200]], 4, 'rgba(0,0,0,.3)');
}
function heatwave(a) { if (a <= 0) return; reset(); g.globalCompositeOperation = 'overlay'; g.fillStyle = `rgba(255,140,40,${a})`; g.fillRect(0, 0, W, H); reset(); }

// ---------- shots ----------
const S = {}, dim = { day: '#d8c0a0', hot: '#e8b890', dusk: '#a8786a', room: '#9a8070', night: '#1a2040' };
const W_SUSI = wx('h2', 'susi'), W_BUKAS = wx('h3', 'binuksan');
// the hook: cracked earth to the horizon, a white sun; one drop falls and turns to steam before it lands; on "susi" a key swings into the foreground
function hookScene(t, k) {
  cam(CX, lerp(900, 940, ss(seg(k, -2, 8))), lerp(1, 1.1, ss(seg(k, -2, 8))), 0, 0, t);
  sky(t, { heat: 1, sun: [540, 720], sr: 130 }); mountains(1000, '#b89a7a', '#d0b090'); paddies(t, 1000, 1, { heat: 1 });
  const dy = lerp(-100, 1150, ei(seg(k, .1, 1.6))); if (k < 1.65) drop(560, dy, 26, 1 - seg(k, 1.4, 1.6)); if (k > 1.45 && k < 3.2) steam(560, 1160, t, .5 * (1 - seg(k, 2.2, 3.2)), 3, 1.4);
  const key = ss(seg(k, W_SUSI - .4, W_SUSI + .3)); if (key > 0) { g.save(); g.translate(lerp(1300, 760, key), 1140); g.rotate(-.5 + .12 * Math.sin(t * 2.4)); line([[0, -400], [0, -60]], 8, '#3a2a1a');
    circ(0, 0, 70, '#c8a050', 22); line([[0, 70], [0, 330]], 26, '#c8a050'); for (const yy of [260, 310]) line([[0, yy], [60, yy]], 22, '#c8a050'); circ(0, 0, 70, 'rgba(255,240,200,.5)', 6); L(0, 0, 300, C.warm, .8 * key, .3 * key); g.restore(); }
  lightPass(dim.hot); heatwave(.12);
}
S.hook = (t, u) => hookScene(t, u);
// the flash-forward: the padlock on the tank, your hand and the key; on "binuksan" it turns and the water comes
function valveScene(t, t0, close = 0) {
  const op = ss(seg(t, t0, t0 + .6)); cam(CX, 900, lerp(1.0, 1.12, seg(t, t0 - 2, t0 + 3)), 0, 0, t);
  sky(t, { heat: .8, sun: [880, 380], sr: 70 }); mountains(1050, '#a89070', '#c0a888'); paddies(t, 1050, .9);
  const [vx, vy] = tank(720, 1500, 360, .5, { lock: op < .5 });
  if (op > 0) for (let k = 0; k < 30; k++) { const p = ((t * 1.4) + k / 30) % 1; circ(vx - 10 - p * 30, vy + 10 + p * p * 500, 16 * (1 - p * .4), `rgba(170,220,255,${.8 * op * (1 - p)})`); }
  hand(vx + 70, vy + 40, 60, Math.PI + .4 - .9 * op, { sg: -1, skin: YOU.skin }); g.save(); g.translate(vx + 30, vy + 30); g.rotate(-.9 * op); line([[0, 0], [40, 0]], 10, '#c8a050'); circ(50, 0, 14, '#c8a050', 6); g.restore();
  lightPass(dim.hot); heatwave(.08);
}
S.key = (t, u) => valveScene(t, W_BUKAS);
S.valve = (t, u) => valveScene(t, T('c3') + .3);
// Nueva Ecija: green paddies to the mountains at sunrise, the house, the tank
S.farm = (t, u) => { cam(lerp(500, 580, seg(u, 0, 6)), 900, lerp(1, 1.06, seg(u, 0, 6)), 0, 0, t);
  sky(t, { dusk: .55, sun: [760, 880], sr: 80, clouds: 'rgba(255,220,200,.35)' }); mountains(960, '#5a6a8a', '#7a88a8'); paddies(t, 960, 0); house(250, 1120, 60, t, { lit: 1 }); tank(900, 1130, 60, .9);
  for (const x of [80, 1000]) { line([[x, 1150], [x + 30, 760]], 14, '#2a2a1a'); for (let k = 0; k < 7; k++) curve([x + 30, 760], [x + 30 + 90 * Math.cos(k), 720 + 20 * Math.sin(k)], [x + 30 + 160 * Math.cos(k * .9), 780], 6, '#2a3a1a'); }
  lightPass(dim.dusk); };
// the family in front of the house: Tatay with his salakot, Nanay, Mia, you
S.family = (t, u) => { cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)), 0, 0, t); const on = id => ss(seg(t, wx('s2', id) - .2, wx('s2', id) + .2));
  sky(t, { heat: .3, sun: [900, 300], sr: 60 }); mountains(1000, '#7a8aa0', '#9aa8b8'); paddies(t, 1000, 0); house(540, 1300, 95, t);
  const P = [[200, 1880, 1000, TATAY, 'Tatay'], [430, 1900, 960, NANAY, 'Nanay'], [660, 1890, 620, MIA, 'Mia'], [880, 1900, 1020, YOU, null]];
  for (const [x, y, h, who, id] of P) { const a = id ? .45 + .55 * on(id) : 1; g.save(); g.globalAlpha = a; person(x, y, h, { t, ...who, eyes: 'open', smile: 1, look: id === 'Mia' ? -.3 : 0, lx: 1, rim: 'rgba(255,220,170,.5)' }); if (id === 'Tatay') salakot(x, y, h); g.restore(); }
  lightPass(dim.day); };
// the Pacific: the map, the warm water spreading across the middle, the rain clouds drifting away from the Philippines
S.pacific = (t, u) => { const warm = ss(seg(t, wx('s3', 'umiinit') - .2, wx('s3', 'umiinit') + 1.5)), sup = ss(seg(t, wx('s4', 'super') - .2, wx('s4', 'super') + .6)); cam(CX, 900, lerp(1, 1.1, seg(u, 0, 10)), 0, sup * 3, t);
  grad('#0a2a4a', '#0e3a5e', -400, 2300); for (let i = 0; i < 40; i++) line([[-400, 200 + i * 45], [1500, 200 + i * 45 + 20 * Math.sin(i)]], 2, 'rgba(120,180,230,.08)');
  const blob = (x, y, rx, ry, col) => { g.fillStyle = rg(x, y, 0, rx, [col, col.replace(/[\d.]+\)$/, '0)')]); g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillRect(x - rx, y - rx, 2 * rx, 2 * rx); g.restore(); };
  blob(700, 1100, 300 + 400 * warm + 200 * sup, 160 + 80 * sup, `rgba(255,${Math.round(120 - 60 * sup)},40,${.75 * warm})`);
  const isl = [[150, 840, 50, 120], [180, 990, 70, 60], [230, 1060, 40, 90], [140, 920, 30, 40]]; for (const [x, y, rx, ry] of isl) { ell(x, y, rx, ry, .3); g.fillStyle = '#5a8a4a'; g.fill(); g.strokeStyle = '#e8d8a0'; g.lineWidth = 3; g.stroke(); }
  text('PILIPINAS', 190, 760, 40, '#fff', 'Anton', 'center', 8); text('PACIFIC OCEAN', 760, 1300, 46, 'rgba(255,255,255,.85)', 'Anton', 'center', 8);
  for (let i = 0; i < 5; i++) { const away = ss(seg(t, wx('s3', 'lumalayo') - .3 + i * .1, wx('s3', 'lumalayo') + 1.5)); const x = 260 + i * 70 + 700 * away, y = 800 + 70 * Math.sin(i * 2); for (let k = 0; k < 4; k++) { ell(x + k * 30, y - 12 * Math.sin(k), 50, 26); g.fillStyle = 'rgba(230,236,245,.9)'; g.fill(); } for (let k = 0; k < 6; k++) line([[x + k * 16, y + 30], [x + k * 16 - 6, y + 60]], 3, 'rgba(160,200,255,.7)'); }
  L(540, 900, 1400, null, .9); L(700, 1100, 600, C.amb, .7 * warm, .2 * warm); lightPass('#30485a'); if (sup > 0) { reset(); g.globalAlpha = sup; text('SUPER EL NIÑO', 540, 1000, 130, '#ff5a3a', 'Anton', 'center', 16); reset(); } };
// you can't stop it: the sun huge over the paddies
S.sun = (t, u) => { cam(CX, 900, lerp(1.0, 1.15, ss(seg(u, 0, 5))), 0, 0, t); sky(t, { heat: .9, sun: [540, 760], sr: 220 }); mountains(1100, '#b0907a', '#c8a890'); paddies(t, 1100, .4, { heat: 1 });
  person(540, 2100, 1100, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(255,220,160,.7)' }); lightPass(dim.hot); heatwave(.15); };
// month one: the TV in the sala: the government asks everyone to store water; Tatay brings home three buckets, you laugh
S.tv = (t, u) => { const b = ss(seg(t, wx('m1b', 'bumili') - .2, wx('m1b', 'bumili') + .5)), laugh = ss(seg(t, wx('m1b', 'pinagtawanan') - .2, wx('m1b', 'pinagtawanan') + .3)); cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t);
  room(t, { win: [640, 300, 1000, 760] }); rr(120, 560, 420, 300, 14); fs('#0a0a0c', 6); g.save(); g.beginPath(); g.rect(140, 580, 380, 260); g.clip(); grad('#1e3a6a', '#0a1830', 580, 840); text('MAG-IPON', 330, 660, 54, '#fff', 'Anton'); text('NG TUBIG', 330, 730, 54, '#ffc94d', 'Anton'); g.fillStyle = '#c8202a'; g.fillRect(140, 790, 380, 40); text('ABISO NG GOBYERNO', 330, 810, 26, '#fff', 'Anton'); g.restore(); L(330, 710, 500, C.cyan, .8, .2);
  rr(100, 860, 460, 30, 6); fs('#5a3a22');
  person(lerp(1200, 760, b), 1950, 1050, { t, walk: b < 1 ? t * 5 : null, ...TATAY, arms: 'down', eyes: 'open', smile: 1, lx: -1 }); if (b > 0) for (const [dx, c] of [[-150, '#2a7ad8'], [-60, '#e04a3a'], [120, '#3ab86a']]) bucket(lerp(1200, 760, b) + dx, 1960, 150, 0, c);
  person(300, 2050, 1100, { t, ...YOU, eyes: laugh > .5 ? 'shut' : 'open', mouth: laugh > .5 ? .5 + .2 * Math.abs(Math.sin(t * 12)) : 0, smile: 1, look: .6, lx: 1 });
  lightPass(dim.room); };
// month two: the paddies cracked; Tatay standing in them for an hour, saying nothing
S.cracked = (t, u) => { cam(lerp(560, 520, seg(u, 0, 8)), 900, lerp(1, 1.1, seg(u, 0, 8)), 0, 0, t); sky(t, { heat: .85, sun: [880, 420], sr: 80 }); mountains(1020, '#a89070', '#c0a888'); paddies(t, 1020, ss(seg(t, T('m2'), wx('m2', 'nagbitak') + 1)) * .95, { heat: 1 });
  person(420, 1780, 820, { t, ...TATAY, eyes: 'open', tired: .7, lookY: .8, look: .2, arms: 'down', lx: 1, rim: 'rgba(255,220,160,.6)' }); salakot(420, 1780, 820); lightPass(dim.hot); heatwave(.1); };
// a kilo of rice needs thousands of litres; the irrigation canal, half empty
S.rice = (t, u) => { const half = ss(seg(t, wx('m2c', 'kalahati') - .3, wx('m2c', 'kalahati') + .6)); cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t);
  sky(t, { heat: .7, sun: [820, 520], sr: 70 }); mountains(900, '#a89a8a', '#c0b0a0'); paddies(t, 900, .6);
  path([[300, 900], [780, 900], [1300, 2000], [-220, 2000]]); g.closePath(); g.fillStyle = '#6a5a4a'; g.fill(); const wl = lerp(0, .5, half);
  path([[330 + 60 * wl, 900], [750 - 60 * wl, 900], [1180 - 400 * wl, 2000], [-100 + 400 * wl, 2000]]); g.closePath(); g.fillStyle = 'rgba(110,170,210,.85)'; g.fill(); for (let k = 0; k < 10; k++) line([[400 + 30 * k, 950 + k * 100], [600 + 20 * k, 950 + k * 100]], 3, 'rgba(255,255,255,.25)');
  sack(860, 1700, 1.4); lightPass(dim.hot); };
// heat index 46: a dial sweeping into DANGER; the classroom empty
S.heat = (t, u) => { const v = ss(seg(t, T('m2d'), wx('m2d', '46') + .5)); cam(CX, 900, 1 + .04 * seg(u, 0, 6), 0, v > .95 ? 1.5 : 0, t);
  grad('#3a1a10', '#1a0a06', -400, 2300); const cxx = 540, cyy = 1050, R = 360, a0 = Math.PI * .85, a1 = Math.PI * 2.15;
  const bands = [[27, 32, '#f0d040'], [33, 41, '#f09030'], [42, 51, '#e03a2a'], [52, 60, '#8a1a3a']], vmin = 27, vmax = 60, A = x => a0 + (a1 - a0) * (x - vmin) / (vmax - vmin);
  for (const [a, b, c] of bands) { g.beginPath(); g.arc(cxx, cyy, R, A(a), A(b + 1)); g.strokeStyle = c; g.lineWidth = 70; g.stroke(); }
  const val = lerp(30, 46, v), an = A(val); line([[cxx, cyy], [cxx + Math.cos(an) * (R - 20), cyy + Math.sin(an) * (R - 20)]], 14, '#fff'); circ(cxx, cyy, 30, '#fff');
  text(`${Math.round(val)}°C`, cxx, cyy + 170, 150, '#fff', 'Anton', 'center', 12); text('HEAT INDEX', cxx, cyy + 290, 54, '#ffc94d', 'Anton', 'center', 8);
  if (v > .9) { text('DANGER', cxx, cyy - 140, 90, '#ff3a3a', 'Anton', 'center', 12); L(cxx, cyy - 140, 500, C.red, .9, .4); }
  L(cxx, cyy, 900, C.warm, .9, .15); lightPass('#4a2a20'); };
// the body: 60 % water; lose 2 % and your mind slows: the water level in a silhouette drops a notch, the edges blur
S.body = (t, u) => { const drop2 = ss(seg(t, wx('m2e', 'dalawang') - .2, wx('m2e', 'dalawang') + .6)); cam(CX, 900, 1 + .05 * seg(u, 0, 7), 0, 0, t);
  grad('#2a1a12', '#140a06', -400, 2300); const lv = .6 - .06 * drop2;
  g.save(); g.translate(540, 1750); const P = () => { g.beginPath(); g.ellipse(0, -1000, 120, 140, 0, 0, TAU); g.moveTo(-150, -840); g.lineTo(150, -840); g.lineTo(210, -400); g.lineTo(130, -380); g.lineTo(110, 0); g.lineTo(20, 0); g.lineTo(0, -380); g.lineTo(-20, 0); g.lineTo(-110, 0); g.lineTo(-130, -380); g.lineTo(-210, -400); g.closePath(); };
  P(); g.fillStyle = 'rgba(255,230,200,.12)'; g.fill(); g.save(); P(); g.clip(); const wy = -1140 * lv; g.fillStyle = lg(0, wy, 0, 0, ['#6ac0ff', '#1a5aa8']); g.beginPath(); g.moveTo(-300, wy); for (let x = -300; x <= 300; x += 20) g.lineTo(x, wy + 10 * Math.sin(x * .03 + t * 3)); g.lineTo(300, 10); g.lineTo(-300, 10); g.closePath(); g.fill(); g.restore();
  P(); g.strokeStyle = '#ffe0c0'; g.lineWidth = 6; g.stroke(); g.restore();
  text(`${Math.round(lv * 100)}%`, 840, 1300, 120, '#9ad0ff', 'Anton', 'center', 10); if (drop2 > .5) { text('−2%', 840, 1150, 80, '#ff5a3a', 'Anton', 'center', 10); }
  L(540, 1200, 1000, C.cyan, .8, .15); lightPass('#40302a'); if (drop2 > 0) { reset(); g.filter = `blur(${4 * drop2}px)`; g.globalAlpha = .5 * drop2; g.drawImage(cv, 0, 0); reset(); } };
// brownout: the dam, the reservoir low, the bathtub ring on the concrete, the turbine slowing; then the lights in the town go out
S.dam = (t, u) => { const low = ss(seg(t, T('m2f'), E('m2g'))), out = t > wx('m2f', 'brownout') + .2 && t < E('m2f') + .5 ? 1 : 0; cam(lerp(560, 520, seg(u, 0, 12)), 900, lerp(1, 1.08, seg(u, 0, 12)), 0, 0, t);
  sky(t, { heat: .7, dusk: .4, sun: [900, 600], sr: 60 }); mountains(900, '#6a7a6a', '#8a9a8a');
  const wl = lerp(980, 1250, low); g.fillStyle = '#7a6a52'; g.fillRect(-400, 980, 1900, 600); g.fillStyle = '#3a6a8a'; g.fillRect(-400, wl, 1900, 1400 - wl); line([[-400, 990], [1500, 990]], 10, 'rgba(240,230,210,.6)');
  for (let k = 0; k < 6; k++) line([[-400, 1000 + k * (wl - 1000) / 6], [1500, 1000 + k * (wl - 1000) / 6]], 3, 'rgba(255,255,255,.18)');
  path([[-400, 1300], [1500, 1300], [1500, 2100], [-400, 2100]]); g.closePath(); g.fillStyle = lg(0, 1300, 0, 2100, ['#b8b0a0', '#7a7466']); g.fill(); for (let x = -400; x < 1500; x += 120) line([[x, 1300], [x, 2100]], 3, 'rgba(0,0,0,.2)'); g.fillStyle = '#5a5448'; g.fillRect(-400, 1290, 1900, 20);
  text('ANGAT DAM', 540, 1420, 70, '#3a3a3a', 'Anton');
  g.save(); g.translate(540, 1720); g.rotate(t * lerp(3, .4, low)); for (let k = 0; k < 6; k++) { g.rotate(TAU / 6); rr(-20, -200, 40, 180, 10); g.fillStyle = '#c8ccd2'; g.fill(); } g.restore(); circ(540, 1720, 50, '#8a8e94');
  for (let i = 0; i < 18; i++) { const x = 60 + i * 56, y = 900 - 30 * hash(i); circ(x, y, 5, out ? '#2a2a30' : '#ffd890'); if (!out) L(x, y, 60, C.warm, .7, .2); }
  L(540, 1700, 700, null, .7); lightPass(out ? '#5a4a4a' : dim.dusk); };
// month three: officially a drought: the calendar, three red crosses
S.drought = (t, u) => { cam(CX, 900, lerp(1, 1.08, seg(u, 0, 6)), 0, 0, t); sky(t, { heat: 1, sun: [540, 600], sr: 100 }); mountains(1000, '#b89a7a', '#d0b090'); paddies(t, 1000, 1, { heat: 1 });
  rr(250, 820, 580, 640, 14); fs('#f0e8d8', 6, '#5a4a3a'); g.fillStyle = '#b02a2a'; g.fillRect(250, 820, 580, 100); text('TAGTUYOT', 540, 872, 64, '#fff', 'Anton');
  for (let k = 0; k < 3; k++) { const x = 340 + k * 200, a = ss(seg(t, T('m3') + .4 + k * .5, T('m3') + .7 + k * .5)); text(['BUWAN 1', 'BUWAN 2', 'BUWAN 3'][k], x, 1000, 34, '#3a2a1a', 'Anton'); if (a > 0) { g.save(); g.globalAlpha = a; line([[x - 60, 1060], [x + 60, 1200]], 18, '#d02a2a'); line([[x + 60, 1060], [x - 60, 1200]], 18, '#d02a2a'); g.restore(); } }
  text('halos walang ulan', 540, 1330, 44, '#5a4a3a', 'Anton'); lightPass(dim.hot); heatwave(.12); };
// the market: Aling Nena's tomatoes, the price doubled on the cardboard
S.market = (t, u) => { const dbl = ss(seg(t, wx('m3b', 'doble') - .2, wx('m3b', 'doble') + .3)); cam(CX, 900, lerp(1, 1.06, seg(u, 0, 6)), 0, 0, t);
  grad('#4a3a2a', '#2a2018', -400, 1300); for (let k = 0; k < 6; k++) { path([[k * 220 - 160, 380], [k * 220 + 60, 380], [k * 220 - 50, 520]]); g.closePath(); g.fillStyle = k % 2 ? '#d84a3a' : '#f0e0c0'; g.fill(); }
  g.fillStyle = '#6a4a2a'; g.fillRect(-400, 1250, 1900, 80); g.fillStyle = '#4a3420'; g.fillRect(-400, 1330, 1900, 800);
  for (let k = 0; k < 40; k++) { const x = 120 + (k % 10) * 46 + (Math.floor(k / 10) % 2) * 20, y = 1240 - Math.floor(k / 10) * 34; circ(x, y, 26, '#d8302a'); circ(x - 8, y - 8, 7, 'rgba(255,255,255,.4)'); line([[x, y - 26], [x + 6, y - 34]], 4, '#3a6a2a'); }
  rr(640, 1080, 280, 170, 8); fs('#c8a878', 4); g.save(); g.font = '600 70px Caveat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a1a0a'; g.fillText(dbl > .5 ? '₱160/kg' : '₱80/kg', 780, 1150); g.restore(); if (dbl > .5) { line([[680, 1210], [880, 1210]], 4, '#c02020'); text('DOBLE', 780, 1050, 50, '#ff3a3a', 'Anton', 'center', 8); }
  person(780, 1900, 900, { t, skin: ['#c8946c', '#a06e4c', '#5e3e28'], hood: ['#6a9a4a', '#4a7a2e', '#24401a'], legs: JEANC, hair: ['#6a6460', '#4a4440', '#2a2420'], longHair: 1, eyes: 'open', tired: .5, lx: -1 });
  L(540, 400, 1400, C.warm, .7, .1); lightPass(dim.day); };
// the barangay pump, pumped dry: nothing comes out
S.poso = (t, u) => { cam(CX, 900, lerp(1.05, 1.15, seg(u, 0, 3)), 0, 0, t); sky(t, { heat: .9, sun: [880, 400], sr: 70 }); g.fillStyle = '#b89a70'; g.fillRect(-400, 1300, 1900, 900);
  const pump = Math.sin(t * 5); g.fillStyle = '#3a6a4a'; g.fillRect(470, 900, 120, 420); rr(430, 860, 200, 70, 14); fs('#2a5a3a'); line([[590, 950], [700, 970]], 26, '#2a5a3a'); line([[530, 880], [380, 880 - 120 * pump]], 18, '#2a5a3a');
  for (const [x, c] of [[300, '#e04a3a'], [700, '#2a7ad8'], [860, '#3ab86a']]) bucket(x, 1560, 120, 0, c); circ(705, 990, 10, 'rgba(160,200,230,.4)');
  person(250, 1900, 900, { t, ...NANAY, arms: 'out', eyes: 'open', tired: .7, lx: 1 }); lightPass(dim.hot); heatwave(.1); };
// the truck: "tubig-bundok", gallons with no label, three times the price; everyone buys, you don't
S.truck = (t, u) => { const no = ss(seg(t, wx('m3e', 'ikaw') - .1, wx('m3e', 'ikaw') + .4)); cam(lerp(560, 520, seg(u, 0, 10)), 900, lerp(1, 1.06, seg(u, 0, 10)), 0, 0, t);
  sky(t, { heat: .9, sun: [900, 320], sr: 60 }); g.fillStyle = '#b89a70'; g.fillRect(-400, 1350, 1900, 900);
  rr(100, 820, 760, 420, 20); fs('#2a2a30'); rr(860, 900, 220, 340, 20); fs('#1e1e24'); rr(890, 940, 150, 120, 10); g.fillStyle = '#5a7a9a'; g.fill(); for (const x of [260, 720, 960]) { circ(x, 1260, 80, '#141414'); circ(x, 1260, 34, '#5a5a5a'); }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) gallon(180 + c * 115, 1180 - r * 115, 120); rr(160, 760, 500, 80, 10); fs('#f0e0a0', 3); text('TUBIG-BUNDOK! MALINIS!', 410, 800, 44, '#b0201a', 'Anton');
  const buyers = [[120, 1880, 700], [300, 1900, 720], [480, 1890, 700], [640, 1900, 720]]; buyers.forEach(([x, y, h], i) => person(x, y, h, { t, back: 1, hood: [['#c86a3a', '#984a24', '#4a2410'], ['#3a8a5a', '#246a3e', '#103a1e'], ['#d8c8a8', '#b0a080', '#5a5040'], ['#8a5a8a', '#6a3a6a', '#3a1a3a']][i], legs: JEANC, skin: YOU.skin, lx: 1 }));
  person(900, 2000, 1000, { t, ...YOU, eyes: 'open', look: -.7, tired: .2, mouth: 0, lx: -1, rim: 'rgba(255,220,160,.5)', arms: no > .5 ? 'down' : 'down' });
  lightPass(dim.day); heatwave(.08); };
// the heat shortens tempers: Tatay and Nanay fighting over a peso at the kitchen table
S.fight = (t, u) => { const sh = Math.sin(t * 7) * 3; cam(CX, 900, lerp(1, 1.08, seg(u, 0, 6)), 0, 0, t);
  room(t, { wall: '#b8a07a', win: [700, 360, 1000, 760] }); person(300, 2000, 1050, { t, ...TATAY, arms: 'out', eyes: 'open', mouth: .4 + .3 * Math.abs(Math.sin(t * 9)), sweat: 1, look: .6, lx: 1 });
  person(800, 2000, 1000, { t, ...NANAY, arms: 'out', eyes: 'open', mouth: .4 + .3 * Math.abs(Math.sin(t * 8 + 1)), sweat: 1, look: -.6, lx: -1 });
  rr(160, 1500, 760, 50, 10); fs('#6a4a2a'); circ(540 + sh, 1490, 24, '#c8b070'); text('₱1', 540 + sh, 1490, 22, '#5a4a20', 'Anton');
  person(560, 2100, 640, { t, ...MIA, eyes: 'open', tired: .4, look: 0, lx: 1 }); lightPass(dim.room); heatwave(.12); };
// a knock at night: the neighbour holding a child bent over; then another, and another
S.knock = (t, u) => { const n2 = ss(seg(t, E('m3g') - 2.2, E('m3g') - 1.7)), n3 = ss(seg(t, E('m3g') - 1.0, E('m3g') - .5)), truck = t >= T('m3h') ? 1 : 0; cam(CX, 900, lerp(1, 1.1, seg(u, 0, 9)), 0, 0, t);
  sky(t, { night: 1 }); g.fillStyle = '#1a1a22'; g.fillRect(-400, 1350, 1900, 900); house(540, 1350, 150, t, { lit: 1 });
  rr(560, 870, 170, 480, 4); g.fillStyle = '#ffd890'; g.fill(); L(645, 1100, 700, C.warm, .95, .3);
  const sick = (x, h, a) => { if (a <= 0) return; g.save(); g.globalAlpha = a; person(x, 1880, h, { t, ...NANAY, hood: ['#7a7aa0', '#5a5a80', '#2a2a40'], eyes: 'wide', mouth: .3, lx: -1, rim: 'rgba(255,220,160,.6)' }); person(x + 120, 1900, h * .55, { t, ...MIA, hood: ['#c8c8c8', '#a0a0a0', '#5a5a5a'], eyes: 'shut', slump: .7, tired: .9, lx: -1 }); g.restore(); };
  sick(240, 920, 1); sick(-40, 860, n2); sick(820, 880, n3);
  if (truck) { reset(); g.globalAlpha = .9 * ss(seg(t, T('m3h'), T('m3h') + .4)); gallon(540, 1250, 360); reset(); }
  lightPass(dim.night); };
// Mia's bottle on the fence: tape, a mark every centimetre
S.bottle = (t, u) => { cam(CX, 900, lerp(1.1, 1.0, ss(seg(u, 0, 6))), 0, 0, t); sky(t, { heat: .6, dusk: .3, sun: [200, 500], sr: 60 }); mountains(1050, '#a89070', '#c0a888'); paddies(t, 1050, .9);
  g.fillStyle = '#7a5a2a'; g.fillRect(-400, 1330, 1900, 40); g.fillRect(470, 1330, 40, 700); bottle(490, 1330, 380, 0, t);
  person(860, 2000, 760, { t, ...MIA, eyes: 'open', look: -.8, lookY: -.3, arms: 'reach', lx: -1, rim: 'rgba(255,220,160,.6)' }); lightPass(dim.day); };
// her notebook: zero, zero, zero
S.notebook = (t, u) => { cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), -.03, 0, t); grad('#5a4a3a', '#3a2a1a', -400, 2300);
  rr(170, 420, 740, 980, 12); fs('#f6f0dc', 6, '#8a7a5a'); for (let k = 0; k < 16; k++) line([[200, 520 + k * 54], [880, 520 + k * 54]], 2, 'rgba(80,120,200,.3)'); line([[290, 440], [290, 1380]], 3, 'rgba(220,60,60,.5)');
  const n = Math.min(14, Math.floor(seg(t, T('mia2'), E('mia2')) * 14) + 1); g.save(); g.font = '600 52px Caveat'; g.textBaseline = 'middle'; g.fillStyle = '#2a2a6a';
  for (let k = 0; k < n; k++) { g.fillText(`Araw ${k + 46}:`, 310, 548 + k * 54); g.fillText('0 cm', 600, 548 + k * 54); } g.restore();
  hand(760 + 10 * Math.sin(t * 6), 560 + n * 54, 80, 2.4, { sg: 1, skin: MIA.skin }); line([[720, 520 + n * 54], [820, 640 + n * 54]], 12, '#e8c040'); lightPass(dim.room); };
// "who owns the rain? nobody": Mia, close, at dusk, the bottle behind her
S.mia = (t, u) => { const w = ss(seg(t, wx('mia3', 'wala') - .2, wx('mia3', 'wala') + .3)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t);
  sky(t, { dusk: .8, sun: [300, 980], sr: 90 }); mountains(1080, '#4a4a6a', '#6a6a8a'); paddies(t, 1080, .9); bottle(850, 1260, 220, 0, t);
  person(500, 2400, 1600, { t, ...MIA, eyes: 'open', smile: w > .5 ? 1 : 0, look: .4, lookY: -.2, mouth: Math.abs(Math.sin(t * 8)) * .2 * (1 - w), lx: -1, rim: 'rgba(255,190,140,.7)' }); lightPass(dim.dusk); };
// month four: the hottest day; the last tank behind the paddies, half full; Tatay's harvest
S.tank = (t, u) => { cam(lerp(600, 520, seg(u, 0, 12)), 900, lerp(1, 1.1, seg(u, 0, 12)), 0, 0, t); sky(t, { heat: 1, sun: [800, 420], sr: 120 }); mountains(1020, '#b89a7a', '#d0b090'); paddies(t, 1020, .75, { heat: 1 });
  tank(560, 1500, 320, .5); text('50%', 790, 1100, 64, '#fff', 'Anton', 'center', 10); lightPass(dim.hot); heatwave(.16); };
// the health center: children on the cots, the drip, the nurse with the empty tap
S.clinic = (t, u) => { cam(lerp(520, 560, seg(u, 0, 10)), 900, lerp(1, 1.08, seg(u, 0, 10)), 0, 0, t);
  g.fillStyle = lg(0, 0, 0, 1400, ['#d8e8e0', '#a8bab0']); g.fillRect(-400, -400, 1900, 1800); g.fillStyle = '#6a8a7a'; g.fillRect(-400, 1400, 1900, 800);
  rr(420, 360, 240, 120, 10); fs('#fff', 4, '#c02020'); line([[540, 380], [540, 460]], 24, '#d02020'); line([[500, 420], [580, 420]], 24, '#d02020'); text('HEALTH CENTER', 540, 520, 40, '#2a4a3a', 'Anton');
  for (const [x, y, s] of [[180, 1560, 1], [540, 1620, 1.1], [900, 1560, 1]]) { rr(x - 160 * s, y - 40, 320 * s, 60, 10); fs('#f0f0f0', 3); for (const dx of [-140, 140]) line([[x + dx * s, y + 20], [x + dx * s, y + 200]], 8, '#8a8a8a');
    g.save(); g.translate(x - 90 * s, y - 70); g.rotate(-Math.PI / 2 + .1); face(0, 0, 60 * s, { t, eyes: 'shut', tired: .9, skin: MIA.skin, hair: MIA.hair, lx: 1 }); g.restore(); rr(x - 40 * s, y - 90, 200 * s, 70, 30); fs('#8ac0e0'); }
  line([[700, 700], [700, 1500]], 6, '#9a9a9a'); rr(670, 700, 60, 110, 10); g.fillStyle = 'rgba(220,240,255,.8)'; g.fill();
  person(880, 1980, 1000, { t, hood: ['#f0f4f8', '#c8d0d8', '#7a8894'], legs: ['#e8ecf0', '#b8c0c8', '#6a7480'], skin: NANAY.skin, hair: HAIRC, eyes: 'open', tired: .6, look: -.4, lx: -1 });
  L(540, 300, 1400, C.fluo, .9, .15); lightPass('#a0b0a8'); };
// the share, before you see what you did: you on the porch at dusk, the key in your hand
S.cta = (t, u) => { cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)), 0, 0, t); sky(t, { dusk: .9, sun: [300, 1000], sr: 80 }); mountains(1100, '#3a3a5a', '#5a5a7a'); paddies(t, 1100, .9);
  person(540, 2300, 1450, { t, ...YOU, back: 1, lx: -1, rim: 'rgba(255,170,110,.7)' }); lightPass(dim.dusk); };
// Tatay looks at the paddies: "this is all we have"
S.tatay = (t, u) => { cam(CX, 900, lerp(1.0, 1.12, ss(seg(u, 0, 7))), 0, 0, t); sky(t, { heat: .9, sun: [860, 480], sr: 80 }); mountains(1100, '#a89070', '#c0a888'); paddies(t, 1100, .7);
  person(520, 2400, 1650, { t, ...TATAY, eyes: 'open', tired: .8, look: .5, lookY: .3, mouth: Math.abs(Math.sin(t * 7)) * .15 * (t > wx('c1', 'anak') ? 1 : 0), lx: 1, rim: 'rgba(255,220,160,.6)' }); salakot(520, 2400, 1650); lightPass(dim.hot); };
// Mia with the notebook; your hand with the key
S.keyhand = (t, u) => { const k = ss(seg(t, wx('c2', 'kamay') - .3, wx('c2', 'kamay') + .3)); cam(CX, 900, lerp(1, 1.1, ss(seg(u, 0, 7))), 0, 0, t);
  sky(t, { heat: .9, sun: [800, 400], sr: 70 }); mountains(1100, '#a89070', '#c0a888'); paddies(t, 1100, .9);
  g.save(); g.globalAlpha = 1 - .6 * k; person(540, 2200, 1350, { t, ...MIA, eyes: 'open', look: 0, lookY: -.3, arms: 'lap', lx: 1 }); rr(420, 1250, 240, 180, 8); fs('#f6f0dc', 4); g.restore();
  if (k > 0) { g.save(); g.globalAlpha = k; hand(560, 1250, 180, -Math.PI / 2, { sg: 1, grip: .5, skin: YOU.skin }); g.translate(560, 1100); g.rotate(-.3); circ(0, 0, 70, '#c8a050', 20); line([[0, 70], [0, 300]], 24, '#c8a050'); for (const yy of [240, 285]) line([[0, yy], [55, yy]], 20, '#c8a050'); L(0, 100, 400, C.warm, .8, .3); g.restore(); }
  lightPass(dim.hot); };
// boil it: the pot on the fire, a full rolling minute; buckets to the health center
S.boil = (t, u) => { const tb = t >= T('r1b'); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t);
  if (!tb) { room(t, { wall: '#9a8060' }); rr(240, 1300, 600, 140, 10); fs('#5a5a5a'); for (let k = 0; k < 8; k++) { const x = 340 + k * 50; g.beginPath(); g.moveTo(x, 1300); g.quadraticCurveTo(x + 10, 1260 - 30 * Math.abs(Math.sin(t * 9 + k)), x + 20, 1300); g.fillStyle = k % 2 ? '#ff8a2a' : '#ffd040'; g.fill(); } L(540, 1280, 700, C.fire, .95, .4);
    rr(330, 1020, 420, 280, 30); fs('#8a8e94', 6, '#3a3a3a'); ell(540, 1020, 210, 40); g.fillStyle = '#cfe8f8'; g.fill(); for (let k = 0; k < 20; k++) circ(400 + 280 * hash(k), 1015 + 12 * Math.sin(t * 12 + k), 6 + 6 * hash(k + 3), 'rgba(255,255,255,.7)'); steam(540, 990, t, .45, 4, 1.6);
    const sec = Math.min(60, Math.floor(seg(t, wx('r1', 'isang'), wx('r1', 'isang') + 2.4) * 60)); text(`0:${String(sec).padStart(2, '0')}`, 540, 780, 110, '#fff', 'Anton', 'center', 12); lightPass(dim.room); }
  else { sky(t, { heat: .6, sun: [880, 380], sr: 60 }); g.fillStyle = '#b89a70'; g.fillRect(-400, 1300, 1900, 900); house(800, 1300, 70, t);
    const walkx = lerp(-100, 700, seg(t, T('r1b'), E('r1b') + 1)); person(walkx, 1900, 1000, { t, walk: t * 5, ...YOU, arms: 'down', eyes: 'open', lx: 1 }); bucket(walkx + 150, 1640, 150, .8, '#2a7ad8'); bucket(walkx - 150, 1640, 150, .8, '#e04a3a');
    person(walkx - 380, 1900, 980, { t, walk: t * 5 + 1, ...TATAY, eyes: 'open', smile: 1, lx: 1 }); salakot(walkx - 380, 1900, 980); bucket(walkx - 230, 1640, 150, .8, '#3ab86a'); lightPass(dim.day); } };
// the photo: your phone on the unlabelled gallons, sent to the municipio; next morning the truck is gone
S.photo = (t, u) => { const gone = t > wx('r2', 'kinabukasan') - .1; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t);
  sky(t, { heat: .6, sun: [900, 320], sr: 60 }); g.fillStyle = '#b89a70'; g.fillRect(-400, 1350, 1900, 900);
  if (!gone) { for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) gallon(200 + c * 170, 1350 - r * 170, 170);
    rr(300, 500, 480, 860, 50); fs('#0a0a0e', 6); rr(320, 540, 440, 760, 30); g.fillStyle = 'rgba(160,200,230,.2)'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(380, 700, 320, 400);
    if (t > wx('r2', 'ipinadala') - .1) { rr(340, 1150, 400, 100, 20); g.fillStyle = '#2a8a4a'; g.fill(); text('NAIPADALA SA MUNISIPYO', 540, 1200, 30, '#fff', 'Anton'); }
    const fl = Math.exp(-Math.max(0, t - T('r2') - .6) * 8) * (t > T('r2') + .6 ? 1 : 0); L(540, 900, 900, C.cyan, .8, .2); lightPass(dim.day); if (fl > .05) { reset(); g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,255,255,${.6 * fl})`; g.fillRect(0, 0, W, H); reset(); } }
  else { for (const x of [260, 720]) { ell(x, 1380, 90, 16); g.fillStyle = 'rgba(60,40,20,.4)'; g.fill(); } for (let k = 0; k < 10; k++) line([[100 + k * 90, 1390], [140 + k * 90, 1400]], 6, 'rgba(60,40,20,.35)'); text('WALA NA ANG TRAK', 540, 1100, 70, '#fff', 'Anton', 'center', 12); lightPass(dim.day); } };
// the neighbours bring buckets: one from one house, two from another; the children well again
S.share = (t, u) => { const well = ss(seg(t, wx('r3', 'gumaling') - .2, wx('r3', 'gumaling') + .5)); cam(lerp(500, 580, seg(u, 0, 8)), 900, lerp(1, 1.05, seg(u, 0, 8)), 0, 0, t);
  sky(t, { heat: .4, sun: [880, 300], sr: 60 }); g.fillStyle = '#b89a70'; g.fillRect(-400, 1300, 1900, 900); house(180, 1300, 60, t); house(900, 1300, 60, t);
  const P = [[150, 1880, 860, NANAY, '#2a7ad8'], [380, 1900, 900, TATAY, '#e04a3a'], [620, 1890, 880, { ...YOU, hood: ['#c86a3a', '#984a24', '#4a2410'] }, '#3ab86a'], [860, 1900, 900, { ...NANAY, hood: ['#6a9a4a', '#4a7a2e', '#24401a'] }, '#f0c040']];
  P.forEach(([x, y, h, who, bc], i) => { person(x, y, h, { t, ...who, eyes: 'open', smile: 1, lx: 1 }); bucket(x + h * .3, y - 20, 130, .8, bc); });
  if (well > 0) { g.save(); g.globalAlpha = well; for (let k = 0; k < 3; k++) person(300 + k * 240, 2000, 560, { t, ...MIA, hood: [['#f2c430', '#c89a20', '#6a5010'], ['#5aa0d8', '#3a7ab0', '#1a4a70'], ['#e86ab0', '#b84a88', '#6a2448']][k], arms: 'up', eyes: 'open', smile: 1, lx: 1 }); g.restore(); }
  lightPass(dim.day); };
// the rain: one drop, another, then the downpour; the dust goes dark
function rainLines(t, a, n = 300) { reset(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < n; i++) { const sp = 1700 + 900 * hash(i), y = ((hash(i * 2.3) * 2300 + t * sp) % 2300) - 200, x = ((hash(i * 5.1) * 1400 + y * .12) % 1400) - 160, len = 40 + 60 * hash(i + 3); line([[x, y], [x + len * .12, y + len]], 1.5 + 1.8 * hash(i), `rgba(200,220,255,${a * (.35 + .65 * hash(i + 7))})`); } reset(); }
S.rain = (t, u) => { const d1 = wx('rain', 'isang'), pour = ss(seg(t, wx('rain', 'bumuhos') - .2, wx('rain', 'bumuhos') + .6)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 8)), 0, pour * 2, t);
  sky(t, { heat: .2 * (1 - pour), night: .45 * pour + .2 }); for (let i = 0; i < 8; i++) { ell(i * 160 - 100, 200 + 60 * Math.sin(i), 220, 100); g.fillStyle = `rgba(60,64,80,${.4 + .5 * pour})`; g.fill(); }
  mountains(1050, '#5a6070', '#7a8090'); paddies(t, 1050, lerp(.95, .7, pour));
  for (const [k, tt] of [[0, d1], [1, wx('rain', 'tapos') + .3]]) { const p = seg(t, tt - .9, tt); if (p > 0 && p < 1) drop(400 + 300 * k, lerp(-50, 1300, ei(p)), 22); if (t > tt && t < tt + 1) { const r = (t - tt) * 120; ell(400 + 300 * k, 1310, r, r * .25); g.strokeStyle = `rgba(200,230,255,${.8 * (1 - (t - tt))})`; g.lineWidth = 4; g.stroke(); } }
  L(540, 600, 1400, null, .6); lightPass(mixHex('#c8b098', '#5a6478', pour)); rainLines(t, .5 * pour); };
// "Kuya! not zero! three centimetres!": Mia running to the bottle in the rain
S.rainmia = (t, u) => { cam(lerp(600, 520, seg(u, 0, 6)), 900, lerp(1, 1.08, seg(u, 0, 6)), 0, 1, t); sky(t, { night: .55 }); mountains(1050, '#4a5060', '#6a7080'); paddies(t, 1050, .5);
  g.fillStyle = '#6a4a2a'; g.fillRect(-400, 1330, 1900, 40); g.fillRect(800, 1330, 40, 700); bottle(820, 1330, 380, 3 * ss(seg(t, T('rain2'), E('rain2'))), t);
  const run = ss(seg(t, T('rain2'), wx('rain2', 'kuya') + .2)); person(lerp(100, 560, run), 2000, 900, { t, walk: run < 1 ? t * 9 : null, ...MIA, arms: run >= 1 ? 'up' : 'down', eyes: 'open', smile: 1, mouth: run >= 1 ? .5 : 0, lx: 1, rim: 'rgba(200,220,255,.5)' });
  if (run >= 1) text('3 CM!', 820, 760, 110, '#9ad0ff', 'Anton', 'center', 12); lightPass('#5a6478'); rainLines(t, .55); };
// Tatay's three buckets under the gutter, filled in minutes; Tatay laughing, the first time in four months
S.rainbuckets = (t, u) => { const f = ss(seg(t, T('rain3'), wx('rain3', 'minuto') + .5)), laugh = t > wx('rain3', 'tumawa') - .1; cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t);
  g.fillStyle = '#8a8070'; g.fillRect(-400, -400, 1900, 2600); path([[-400, 300], [1500, 300], [1500, 420], [-400, 420]]); g.closePath(); g.fillStyle = '#8a3a2a'; g.fill(); line([[-400, 430], [1500, 430]], 26, '#6a6a6a');
  for (const x of [250, 540, 830]) { for (let k = 0; k < 8; k++) { const p = ((t * 2) + k / 8) % 1; circ(x + 4 * Math.sin(k), 450 + p * 1050, 10, `rgba(170,215,255,${.8 * (1 - p * .3)})`); } }
  for (const [x, c] of [[250, '#2a7ad8'], [540, '#e04a3a'], [830, '#3ab86a']]) bucket(x, 1700, 230, f, c);
  if (laugh) { person(540, 2400, 1200, { t, ...TATAY, eyes: 'shut', mouth: .5 + .2 * Math.abs(Math.sin(t * 12)), smile: 1, lx: 1 }); salakot(540, 2400, 1200); }
  lightPass('#7a8090'); rainLines(t, .45); };
// the true parts: El Niño will come back; boil for a minute; and the bucket arithmetic: 1 mm on 1 m² is 1 litre
S.math = (t, u) => { cam(CX, 900, 1 + .04 * seg(u, 0, 10), 0, 0, t); grad('#1a2430', '#0a1018', -400, 2300);
  const sq = 300, x0 = 540 - sq / 2, y0 = 760; g.save(); g.translate(540, y0); g.transform(1, 0, -.6, .5, 0, 0); g.translate(-540, -y0); rr(x0, y0 - sq / 2, sq, sq, 4); g.fillStyle = '#8a3a2a'; g.fill(); g.strokeStyle = '#ffc94d'; g.lineWidth = 6; g.stroke(); g.restore(); text('1 m²', 540, 640, 60, '#ffc94d', 'Anton', 'center', 8);
  for (let k = 0; k < 12; k++) { const p = ((t * 1.5) + k / 12) % 1; drop(400 + 25 * k, 380 + p * 300, 12, .8); } text('1 mm ULAN', 820, 420, 50, '#9ad0ff', 'Anton', 'center', 8);
  const fl = ss(seg(t, T('f2'), E('f2'))); rr(420, 1000, 240, 300, 20); fs('rgba(160,210,255,.2)', 6, '#9ad0ff'); g.fillStyle = '#6ab0f0'; g.fillRect(426, 1294 - 288 * fl, 228, 288 * fl); text('1 LITRO', 540, 1360, 70, '#fff', 'Anton', 'center', 10);
  L(540, 900, 1100, C.cyan, .8, .15); lightPass('#3a4a5a'); };
// the end: the bottle on the fence, wet ground, new green seedlings; the notebook: not zero; under it, in her hand: "walang may-ari ng ulan"
S.end = (t, u) => { const nb = t > wx('end', 'notebook') - .1, wr = ss(seg(t, wx('end', 'walang') - .2, wx('end', 'walang') + .6)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 9)), 0, 0, t);
  if (!nb) { sky(t, { dusk: .3, sun: [300, 600], sr: 70, clouds: 'rgba(255,255,255,.6)' }); mountains(1050, '#5a7a6a', '#7a9a8a'); paddies(t, 1050, .15); g.fillStyle = '#6a4a2a'; g.fillRect(-400, 1330, 1900, 40); g.fillRect(470, 1330, 40, 700); bottle(490, 1330, 380, 3, t); lightPass(dim.day); }
  else { grad('#5a4a3a', '#3a2a1a', -400, 2300); rr(170, 420, 740, 980, 12); fs('#f6f0dc', 6, '#8a7a5a'); for (let k = 0; k < 16; k++) line([[200, 520 + k * 54], [880, 520 + k * 54]], 2, 'rgba(80,120,200,.3)');
    g.save(); g.font = '600 52px Caveat'; g.textBaseline = 'middle'; g.fillStyle = '#2a2a6a'; for (let k = 0; k < 5; k++) { g.fillText(`Araw ${k + 118}:`, 310, 548 + k * 54); g.fillText('0 cm', 600, 548 + k * 54); } g.fillStyle = '#1a6a2a'; g.fillText('Araw 123:', 310, 548 + 5 * 54); g.fillText('3 cm!!', 600, 548 + 5 * 54);
    g.globalAlpha = wr; g.font = '600 80px Caveat'; g.textAlign = 'center'; g.fillStyle = '#2a2a6a'; g.fillText('Walang may-ari', 540, 1050); g.fillText('ng ulan.', 540, 1140); g.restore(); lightPass(dim.room); } };
S.endcard = (t, u) => { S.end(t, u); };

// ---------- overlays: the month cards (gold), the comment/share cards ----------
function monthCard(t, t0, t1, n, label) {
  const k = back(seg(t, t0, t0 + .28), 2.2) * (1 - ss(seg(t, t1 + .1, t1 + .35))); if (k <= 0) return;
  reset(); g.save(); g.translate(CX, 470); g.scale(k, k); glass(-420, -140, 840, 280, 34, YEL, 5, 'rgba(255,201,77,.8)');
  text(`${TX.rule}${n}`, 0, -70, 54, '#ffd98a', 'Anton'); g.font = '96px Anton'; const sc = Math.min(1, 760 / g.measureText(label).width);
  g.save(); g.translate(0, 34); g.scale(sc, sc); g.shadowColor = 'rgba(255,150,60,.9)'; g.shadowBlur = 30; text(label, 0, 0, 96, '#fff', 'Anton'); g.restore(); g.restore();
}
function bigCard(t, t0, top, bottom, col = YEL, glowc = 'rgba(255,170,80,1)') {
  const k = back(seg(t, t0, t0 + .3), 1.7); if (k <= 0) return; reset(); g.save(); g.translate(CX, 600); g.scale(k, k);
  glass(-440, -150, 880, 300, 44, 'rgba(255,255,255,.65)', 4, 'rgba(255,255,255,.45)');
  g.font = '86px Anton'; const s1 = Math.min(1, 800 / g.measureText(top).width); g.save(); g.translate(0, -44); g.scale(s1, s1); text(top, 0, 0, 86, '#fff', 'Anton'); g.restore();
  g.font = '70px Anton'; const s2 = Math.min(1, 800 / g.measureText(bottom).width); g.save(); g.translate(0, 62); g.scale(s2, s2); g.shadowColor = glowc; g.shadowBlur = 24; text(bottom, 0, 0, 70, col, 'Anton'); g.restore(); g.restore();
}
const W_COMMENT = wx('cta', 'icomment'), W_SHARE = wx('cta', 'ishare');
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .22; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  ZK = 1; S[sh[2]](t, u);
  bloom(); vignette(.5);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'hook') title(t, 1);
  TX.months.forEach(([id, label], i) => { if (t >= T(id) && t < E(id) + .5) monthCard(t, T(id), E(id), i + 1, label); });
  statCard(t);
  if (sh[2] === 'cta') { if (t < W_SHARE - .1) bigCard(t, W_COMMENT - .1, TX.share[0], TX.share[1]); else bigCard(t, W_SHARE - .1, TX.share2[0], TX.share2[1]); }
  if (sh[2] === 'endcard') { const k = ss(seg(t, T('tail'), T('tail') + .5)); reset(); g.globalAlpha = k * .85; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = k; text('WALANG MAY-ARI', 540, 860, 120, '#fff', 'Anton', 'center', 12); text('NG ULAN.', 540, 1000, 120, '#9ad0ff', 'Anton', 'center', 12); reset(); }
  if (sh[2] !== 'endcard') captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

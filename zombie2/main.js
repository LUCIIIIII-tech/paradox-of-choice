// Imagine Nasa Mall Ka (a zombie outbreak in a mall at night, played as 5 choices: one wrong move and you die): a dark, painterly survival "what if" reel, 1080x1920. Deterministic in t: window.renderAt(t).
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
  tl: { t1: 'IMAGINE NASA MALL KA', t2: 'ISANG MALI, PATAY KA', rule: 'CHOICE #', asks: ['SASABAY KA BA?', 'ENTRANCE O FIRE EXIT?', 'TATAKBO O TATAHIMIK?', 'BUBUKSAN ANG FLASHLIGHT?', 'ISASAMA MO PA BA?'],
        opts: [['HIHIWALAY', 'SASABAY'], ['ENTRANCE', 'FIRE EXIT'], ['TATAHIMIK', 'TATAKBO'], ['BUBUKSAN', 'HINDI'], ['ISASAMA', 'IIWAN']], ok: [0, 1, 0, 1, 1], dead: 'PATAY',
        where: 'ILAN ANG TAMA MO?', comment: 'COMMENT MO ANG SCORE', share: ['I-SHARE MO', 'SA UNANG MAMAMATAY'], here: 'IKAW AY NARITO', entrance: 'ENTRANCE',
        directory: 'MALL DIRECTORY', mall: 'GRAND ARCADIA MALL', sale: 'MEGA SALE', exit: 'EXIT',
        shops: ['BOTIKA', 'SAPATOS', 'LIBRO', 'RELO', 'KAPE', 'DAMIT', 'LARUAN', 'TINAPAY', 'ALAHAS', 'GADGET'] },
  en: { t1: "IMAGINE YOU'RE AT THE MALL", t2: 'ONE WRONG MOVE, YOU DIE', rule: 'CHOICE #', asks: ['FOLLOW THE CROWD?', 'ENTRANCE OR FIRE EXIT?', 'RUN OR STAY QUIET?', 'FLASHLIGHT ON?', 'TAKE THEM WITH YOU?'],
        opts: [['BREAK AWAY', 'FOLLOW'], ['ENTRANCE', 'FIRE EXIT'], ['STAY QUIET', 'RUN'], ['TURN IT ON', 'KEEP IT OFF'], ['TAKE THEM', 'LEAVE THEM']], ok: [0, 1, 0, 1, 1], dead: 'DEAD',
        where: 'HOW MANY DID YOU GET?', comment: 'COMMENT YOUR SCORE', share: ['SHARE THIS', 'WITH WHO DIES FIRST'], here: 'YOU ARE HERE', entrance: 'ENTRANCE',
        directory: 'MALL DIRECTORY', mall: 'GRAND ARCADIA MALL', sale: 'MEGA SALE', exit: 'EXIT',
        shops: ['PHARMACY', 'SHOES', 'BOOKS', 'WATCHES', 'COFFEE', 'FASHION', 'TOYS', 'BAKERY', 'JEWELRY', 'GADGETS'] },
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
const REDCAP = ['rush', 'scream', 'lunge', 'a1', 'noise', 'loop', 'bitten'];
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
const S_SCREAM = wordT('s1', 'sumigaw'), S_LUNGE = wordT('s2', 'sumunggab'), S_TURN2 = S_LUNGE + 1.2;     // the second attack happens off camera
const S_ALARM = T('c1q') - .12, S_FLEE = S_ALARM + .3, S_JAM = T('c1a');   // the alarm and the red strobes land just before choice 1
const lerpA = (a, b, u) => a + (b - a) * u;
const run_ = (v, dt) => dt <= 0 ? 0 : dt < .5 ? v * dt * dt : v * (dt - .25);     // distance with half a second of acceleration
const tone3 = h => { const c = parseInt(h.slice(1), 16), r = c >> 16, gg = (c >> 8) & 255, b = c & 255, f = (k) => `rgb(${Math.min(255, Math.round(r * k))},${Math.min(255, Math.round(gg * k))},${Math.min(255, Math.round(b * k))})`; return [f(1.35), f(1), f(.55)]; };
const pickH = (arr, k) => arr[Math.floor(hash(k) * arr.length) % arr.length];
const PAL = { shirt: ['#2f4f6f', '#7a2c2c', '#3f6a3a', '#9a8f6a', '#c9c3b5', '#3b3b46', '#6a4a7a', '#b0602d', '#1f4a5d', '#8a7a4f', '#e0dccf', '#8c2f4a', '#d9c27a', '#2a6a6a'],
  pants: ['#1f2a3a', '#2b2b2b', '#3d3328', '#55524a', '#16181d', '#4a3f35', '#2a3d5a'], skin: [SKIN, ['#e8b894', '#c08a68', '#7a5038'], ['#c48a64', '#9a6444', '#5a3624'], ['#a8714e', '#80523a', '#4a2c1c']],
  hair: [HAIRC, ['#2a1d14', '#1d1410', '#0b0807'], ['#3a2a1e', '#22170f', '#0e0906']] };
const ZSK = [['#b9c2a6', '#8d9a80', '#4f5a48'], ['#aab4a0', '#7f8b76', '#465042']], ZCL = ['#3a3530', '#2d3238', '#4a3d33', '#33302a'];
const HB = { hood: ['#ff9a4a', '#e0672a', '#7a3212'], legs: ['#4a5878', '#2c3652', '#161c30'], skin: PAL.skin[2], hair: HAIRC, h: 1.72, seed: 3, rim: 'rgba(255,190,120,.75)', hl: 1, keep: 1 };   // the hero: the orange hoodie

// ---------- the mall: a one-point perspective set (X across, Y up, Z into the picture, metres) ----------
const PC = { x: 0, y: 1.6, z: 0, F: 1000, hy: 960 };          // the camera: position, focal length (px), horizon height on screen
const prj = (X, Y, Z) => { const d = Math.max(.05, Z - PC.z), k = PC.F / d; return [CX + (X - PC.x) * k, PC.hy - (Y - PC.y) * k, k]; };
function poly(pts, fill, stroke = null, lw = 2) { g.beginPath(); pts.forEach(([X, Y, Z], i) => { const [x, y] = prj(X, Y, Z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
const HW = 9, GX = 6, LV = [4.6, 9.2], ROOF = 13, DZ = 22, EXZ = [4.2, 6.4];      // half-width, gallery edge, gallery floors, roof, the doors, the fire-exit opening (left wall)
const BEACONS = [[-3.8, 3.4, DZ - .1], [3.8, 3.4, DZ - .1], [-GX, 3.95, 14], [GX, 3.95, 14], [-GX, 3.95, 8], [GX, 3.95, 8]];   // the red emergency strobes
function hallSky(t) {
  grad('#05081a', '#1a2448', -900, 1300);
  for (let i = 0; i < 140; i++) { const x = hash(i * 3.7) * W, y = hash(i * 5.1) * 900; circ(x, y, .8 + 1.6 * hash(i), `rgba(220,230,255,${.25 + .5 * hash(i + 1) * (.6 + .4 * Math.sin(t * 1.3 + i))})`); }
  const [mx, my] = prj(-4, 30, 60); fullMoon(mx, my, 34); L(mx, my, 500, C.moon, .5, .15);
}
// the night street seen through the glass doors: lamps, a skyline, and (after the alarm) them, pressed against the glass
function street(t, o) {
  const p0 = prj(-3.2, 0, DZ), p1 = prj(3.2, 3.2, DZ); const x0 = p0[0], y0 = p1[1], x1 = p1[0], y1 = p0[1];
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  g.fillStyle = lg(0, y0, 0, y1, ['#1a2448', '#3a4672', '#2c3046']); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.drawImage(TEX.city, 0, 0, TEX.city.width, TEX.city.height, x0 - (x1 - x0) * .3, y0 + (y1 - y0) * .05, (x1 - x0) * 1.6, (y1 - y0) * .62);
  for (const sx of [-.2, .55]) { const lx = lerp(x0, x1, sx + .25), ly = lerp(y0, y1, .18); line([[lx, ly], [lx, y1]], 4, '#141418'); circ(lx, ly, 6, '#ffd08a'); L(lx, ly, 260, C.amb, .8, .35); }
  if (o.alarm > 0) for (let k = 0; k < 9; k++) {     // the infected outside, pressed to the glass
    const u = (k + .5) / 9, x = lerp(x0, x1, u) + 8 * Math.sin(t * 1.3 + k), h = (y1 - y0) * (.62 + .1 * hash(k)), a = clamp((o.alarm - .2 - k * .05) * 2) * o.zf;
    shambler(x, y1 + 4, h, t + k, { col: '#0b0c10', alpha: a, ph: k * 1.7, eyes: a, rim: `rgba(255,60,70,${.6 * o.alarm})` });
    for (const sg of [-1, 1]) { const px = x + sg * h * .15, py = y1 + 4 - h * (.66 + .03 * Math.sin(t * 2 + k + sg)); g.save(); g.globalAlpha = a * .85; ell(px, py, h * .03, h * .036); g.fillStyle = '#9aa294'; g.fill(); for (let f = 0; f < 4; f++) line([[px + (f - 1.5) * h * .014, py - h * .02], [px + (f - 1.5) * h * .018, py - h * .06]], h * .011, '#9aa294'); g.restore(); }   // palms on the glass
    if (a > .3) L(x, y1 + 4 - h * .87, h * .16, '230,240,220', .9 * a, .65 * a);
  }
  g.restore();
  // the glass: reflections, frames, the push bars
  g.fillStyle = 'rgba(160,190,220,.06)'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let k = 0; k <= 4; k++) { const [x] = prj(-3.2 + k * 1.6, 0, DZ); line([[x, y0], [x, y1]], 6, '#3a3226'); }
  line([[x0, y0], [x1, y0]], 8, '#4a3e2a'); for (let k = 0; k < 4; k++) { const [a, b] = prj(-2.9 + k * 1.6, 1.05, DZ - .02), [c] = prj(-1.9 + k * 1.6, 1.05, DZ - .02); line([[a, b], [c, b]], 4, '#b89a5a'); }
}
function shopFront(side, Z0, Z1, Y0, k, lit = 1) {      // a shop on a side wall: a glowing window with goods, a sign band, a dark frame
  const X = side * HW, Y1 = Y0 + 3.6, cols = ['#e8b878', '#f0c890', '#e0a868', '#ecc088'];
  poly([[X, Y0, Z0], [X, Y1 + .6, Z0], [X, Y1 + .6, Z1], [X, Y0, Z1]], '#1e1a1c');
  const w0 = Z0 + .25, w1 = Z1 - .25, wy0 = Y0 + .25, wy1 = Y0 + 2.7;
  poly([[X, wy0, w0], [X, wy1, w0], [X, wy1, w1], [X, wy0, w1]], cols[k % 4]);
  for (let j = 0; j < 4; j++) { const z = lerp(w0, w1, (j + .5) / 4), c = ['#b8432f', '#2f5d8a', '#c99a3e', '#3f6b45', '#8a3f6b', '#5a4030'][(k + j) % 6];
    if (k % 2) poly([[X - side * .01, wy0, z - .25], [X - side * .01, wy0 + 1.7 + .3 * hash(k + j), z - .25], [X - side * .01, wy0 + 1.7 + .3 * hash(k + j), z + .25], [X - side * .01, wy0, z + .25]], c);
    else { poly([[X - side * .01, wy0 + .2, z - .2], [X - side * .01, wy0 + 1.5, z - .25], [X - side * .01, wy0 + 1.5, z + .25], [X - side * .01, wy0 + .2, z + .2]], c); const [hx, hy, hk] = prj(X - side * .01, wy0 + 1.72, z); circ(hx, hy, .17 * hk, '#e9dcc8'); } }
  poly([[X, wy0, w0], [X, wy1, w0], [X, wy1, w1], [X, wy0, w1]], null, '#b89a5a', 3);
  poly([[X, Y1 - .55, w0], [X, Y1 - .05, w0], [X, Y1 - .05, w1], [X, Y1 - .55, w1]], '#120e0b', '#b89a5a', 2);
  const [sx, sy, sk] = prj(X, Y1 - .3, (w0 + w1) / 2); g.save(); g.translate(sx, sy); g.transform(1, side * .32 * (1 - Math.min(1, sk / 400)), 0, 1, 0, 0); text(TX.shops[k % TX.shops.length], 0, 0, Math.max(6, .34 * sk), '#f2d7a4', 'Anton'); g.restore();
  const [lx, ly, lk] = prj(X - side * .3, wy0 + 1.4, (w0 + w1) / 2); if (lit) L(lx, ly, 3 * lk, C.warm, .6 * lit, .25);
}
function backShop(x0, x1, Y, k) {         // a shop on the back wall: a sign band, a lit window with shelves of goods (or two mannequins)
  const Z = DZ - .03, [a, b] = prj(x0, Y + 2.9, Z), [c, d] = prj(x1, Y + .25, Z), w = c - a, h = d - b, wy = b + h * .2, wb = d - h * .03;
  g.fillStyle = '#15100d'; g.fillRect(a, b, w, h);
  g.fillStyle = lg(0, wy, 0, wb, ['#f0c48a', '#b88050', '#4a2e1a']); g.fillRect(a + w * .04, wy, w * .92, wb - wy);
  if (k % 3 === 1) for (let m = 0; m < 2; m++) { const mx = a + w * (.3 + m * .4), mh = (wb - wy) * .8, col = ['#8a2f4a', '#2f5d8a', '#c99a3e'][(k + m) % 3];
    line([[mx, wb - mh * .25], [mx, wb]], Math.max(1, w * .012), '#3a2a1a'); path([[mx - mh * .09, wb - mh * .78], [mx + mh * .09, wb - mh * .78], [mx + mh * .2, wb - mh * .25], [mx - mh * .2, wb - mh * .25]]); g.closePath(); g.fillStyle = col; g.fill(); circ(mx, wb - mh * .88, mh * .08, '#e8dcc8'); }
  else for (let j = 0; j < 3; j++) { const yy = lerp(wy, wb, .32 + j * .25); g.fillStyle = 'rgba(40,24,14,.75)'; g.fillRect(a + w * .04, yy, w * .92, h * .025);
    for (let m = 0; m < 7; m++) { const q = hash(k * 31 + j * 7 + m), gh = h * (.07 + .06 * q); g.fillStyle = ['#b8432f', '#2f5d8a', '#c99a3e', '#3f6b45', '#8a3f6b', '#e9dcc8', '#5a4030'][(k + j * 2 + m) % 7]; g.fillRect(a + w * (.07 + m * .125), yy - gh, w * .09, gh); } }
  g.strokeStyle = '#b89a5a'; g.lineWidth = Math.max(1, w * .012); g.strokeRect(a + w * .04, wy, w * .92, wb - wy);
  text(TX.shops[k % TX.shops.length], a + w / 2, b + h * .1, h * .11, '#f2d7a4', 'Anton');
  L(a + w / 2, lerp(wy, wb, .4), w * .75, C.warm, .42, .14);
}
function billboard(x0, x1, Y) {           // the red LED screen on the top floor
  const [a, b] = prj(x0, Y + 2.9, DZ - .04), [c, d] = prj(x1, Y + .35, DZ - .04), k = (c - a) / (x1 - x0);
  g.fillStyle = '#140808'; g.fillRect(a - .1 * k, b - .1 * k, c - a + .2 * k, d - b + .2 * k);
  g.fillStyle = lg(0, b, 0, d, ['#b0202c', '#5a0c14']); g.fillRect(a, b, c - a, d - b);
  for (let y = b; y < d; y += Math.max(3, .08 * k)) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(a, y, c - a, Math.max(1, .03 * k)); }
  text(TX.sale, (a + c) / 2, lerp(b, d, .36), .95 * k, '#fff1e0', 'Anton'); text('50% OFF', (a + c) / 2, lerp(b, d, .76), .62 * k, '#ffd36a', 'Anton');
  L((a + c) / 2, (b + d) / 2, (c - a) * .8, C.red, .65, .22);
}
// draw the hall. o: { alarm (0..1, red strobes), zf (the infected, 0..1), people: [...] }
function hall(t, o) {
  const al = o.alarm || 0, zf = o.zf ?? 1;
  hallSky(t);
  // the glass roof: ribs over the night sky
  for (let k = -3; k <= 3; k++) poly([[k * 2, ROOF, 1], [k * 2 + .06, ROOF, 1], [k * 2 + .06, ROOF, DZ], [k * 2, ROOF, DZ]], 'rgba(40,34,30,.9)');
  for (let z = 2; z <= DZ; z += 2.5) poly([[-GX, ROOF, z], [GX, ROOF, z], [GX, ROOF, z + .08], [-GX, ROOF, z + .08]], 'rgba(40,34,30,.9)');
  // the back wall: the doors, the shops beside them, the mall's name, two floors of shops and the red screen
  poly([[-HW, 0, DZ], [-HW, ROOF, DZ], [HW, ROOF, DZ], [HW, 0, DZ]], '#2a2420');
  street(t, { alarm: al, zf });
  for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { const x0 = sd * (3.8 + k * 2.6), x1 = x0 + sd * 2.2; backShop(Math.min(x0, x1), Math.max(x0, x1), -.25, k * 5 + (sd > 0 ? 2 : 0)); }
  { const [sx, sy, sk] = prj(0, 3.75, DZ - .05); g.save(); g.shadowColor = 'rgba(255,200,120,.9)'; g.shadowBlur = 20; text(TX.mall, sx, sy, .52 * sk, '#ffe2b0', 'Anton'); g.restore(); L(sx, sy, 3 * sk, C.warm, .7, .25); }
  for (const Y of LV) { poly([[-HW, Y - .5, DZ - .01], [-HW, Y, DZ - .01], [HW, Y, DZ - .01], [HW, Y - .5, DZ - .01]], '#3a3028'); poly([[-HW, Y + 1.0, DZ - .02], [HW, Y + 1.0, DZ - .02], [HW, Y + 1.06, DZ - .02], [-HW, Y + 1.06, DZ - .02]], '#c9a45e');
    for (let k = 0; k < 6; k++) { const x0 = -HW + .6 + k * 3; if (Y === LV[1] && k === 2) billboard(x0, x0 + 5.4, Y); else if (!(Y === LV[1] && k === 3)) backShop(x0, x0 + 2.4, Y, k + (Y === LV[0] ? 1 : 4)); } }
  // the floor: dark and pale marble, polished (the lit shop fronts and the doors shine in it)
  for (let z = DZ; z > PC.z + .4; z -= 1) for (let x = -HW; x < HW; x += 1) poly([[x, 0, z], [x + 1, 0, z], [x + 1, 0, Math.max(PC.z + .4, z - 1)], [x, 0, Math.max(PC.z + .4, z - 1)]], (Math.floor(x) + Math.floor(z)) % 2 === 0 ? '#1d1914' : '#8c8170');
  const zs = []; for (let z = DZ; z > PC.z + .6; z -= 3.6) zs.push(z);
  g.save(); g.globalCompositeOperation = 'screen';
  for (const side of [-1, 1]) for (let i = 0; i < zs.length; i++) { const z = zs[i] - 1.8; if (z < PC.z + 1) continue; const [x, y, k] = prj(side * (HW - .4), 0, z); g.fillStyle = lg(0, y, 0, y + 2.5 * k, ['rgba(255,200,130,.2)', 'rgba(255,200,130,0)']); g.fillRect(x - .9 * k, y, 1.8 * k, 2.5 * k); }
  { const [x0, y0] = prj(-3.2, 0, DZ), [x1, , k] = prj(3.2, 0, DZ); g.fillStyle = lg(0, y0, 0, y0 + 3 * k, [al > 0 ? `rgba(255,70,70,${.3 * al})` : 'rgba(120,150,220,.15)', 'rgba(0,0,0,0)']); g.fillRect(x0, y0, x1 - x0, 3 * k); }
  g.restore();
  // the side walls, far to near: shop fronts on three levels, the fire exit on the left
  const seg_ = i => [Math.max(PC.z + .6, zs[i] - 3.6), zs[i]];
  for (const side of [-1, 1]) for (let i = 0; i < zs.length; i++) { const [z0, z1] = seg_(i);
    if (side < 0 && z0 < EXZ[1] && z1 > EXZ[0]) {                      // the fire-exit opening and its green sign
      poly([[-HW, 0, EXZ[0]], [-HW, 3.4, EXZ[0]], [-HW, 3.4, EXZ[1]], [-HW, 0, EXZ[1]]], '#06070a');
      const [ex, ey, ek] = prj(-HW + .05, 3.75, (EXZ[0] + EXZ[1]) / 2); g.save(); g.translate(ex, ey); g.transform(1, -.3, 0, 1, 0, 0); rr(-ek * .55, -ek * .2, ek * 1.1, ek * .4, ek * .05); g.fillStyle = '#04140a'; g.fill(); g.shadowColor = 'rgba(80,255,150,.9)'; g.shadowBlur = 18; text(TX.exit, 0, 2, ek * .32, '#7dffae', 'Anton'); g.restore(); L(ex, ey, 2.5 * ek, C.grn, .8, .35);
    } else shopFront(side, z0, z1, 0, i * 3 + (side > 0 ? 7 : 0)); }
  if (PC.y > LV[0]) for (const side of [-1, 1]) poly([[side * GX, LV[0], DZ], [side * HW, LV[0], DZ], [side * HW, LV[0], PC.z + .6], [side * GX, LV[0], PC.z + .6]], '#2e2620');   // the first gallery's walkway, seen from above
  for (const side of [-1, 1]) for (let i = 0; i < zs.length; i++) { const [z0, z1] = seg_(i); for (const Y of LV) shopFront(side, z0, z1, Y + .1, i * 3 + (side > 0 ? 8 : 1), .8); }
  for (const side of [-1, 1]) for (const Y of LV) {          // the galleries: the slab edge, a warm cove under it, glass and a brass rail
    poly([[side * GX, Y - .5, DZ], [side * GX, Y, DZ], [side * GX, Y, PC.z + .6], [side * GX, Y - .5, PC.z + .6]], '#3a3028');
    poly([[side * GX, Y - .55, DZ], [side * GX, Y - .5, DZ], [side * GX, Y - .5, PC.z + .6], [side * GX, Y - .55, PC.z + .6]], '#ffd6a0');
    poly([[side * GX, Y, DZ], [side * GX, Y + 1.05, DZ], [side * GX, Y + 1.05, PC.z + .6], [side * GX, Y, PC.z + .6]], 'rgba(150,180,210,.08)');
    poly([[side * GX, Y + 1.0, DZ], [side * GX, Y + 1.07, DZ], [side * GX, Y + 1.07, PC.z + .6], [side * GX, Y + 1.0, PC.z + .6]], '#c9a45e');
    for (let z = DZ; z > PC.z + .8; z -= 2) { const [lx, ly, lk] = prj(side * GX, Y - .6, z); L(lx, ly, 1.5 * lk, C.warm, .45, .18); }
  }
  // columns, the red sale banners, the strobes (dark until the alarm)
  for (const z of [17, 12, 7]) if (z > PC.z + .5) for (const side of [-1, 1]) { const [x0, y0, k] = prj(side * GX - .3, ROOF, z), [x1, y1] = prj(side * GX + .3, 0, z);
    g.fillStyle = lg(x0, 0, x1, 0, ['#4a3e33', '#9a8a72', '#3a3028']); g.fillRect(x0, y0, x1 - x0, y1 - y0); for (const Y of [.4, ...LV.map(v => v - .3)]) { const [, yy] = prj(0, Y, z); g.fillStyle = '#c9a45e'; g.fillRect(x0 - 3, yy - .08 * k, x1 - x0 + 6, .16 * k); } }
  for (const [bx, bz] of [[-5.6, 15], [5.6, 10.5]]) { if (bz < PC.z + 1) continue; poly([[bx - .7, ROOF - .6, bz], [bx + .7, ROOF - .6, bz], [bx + .7, ROOF - 5, bz], [bx - .7, ROOF - 5, bz]], '#8e2a24'); const [sx, sy, sk] = prj(bx, ROOF - 2.8, bz); g.save(); g.translate(sx, sy); g.rotate(-Math.PI / 2); text(TX.sale, 0, 0, .7 * sk, '#fff1d6', 'Anton'); g.restore(); }
  const sv = k => .5 + .5 * Math.sin(t * 7.5 + k * Math.PI);
  BEACONS.forEach(([X, Y, Z], k) => { if (Z < PC.z + .6) return; const [x, y, kk] = prj(X, Y, Z); g.beginPath(); g.arc(x, y, .13 * kk, Math.PI, TAU); g.closePath(); g.fillStyle = al > 0 ? `rgb(255,${70 + 90 * sv(k)},${70 + 60 * sv(k)})` : '#4a1418'; g.fill(); g.fillStyle = '#1a1a1e'; g.fillRect(x - .17 * kk, y, .34 * kk, .05 * kk); });
  // the fountain (centre of the hall): water, rings, arcs from the spout
  if (12 > PC.z + 1.5) { const ring = (r, y) => { const pts = []; for (let a = 0; a <= TAU + .01; a += TAU / 40) pts.push([Math.sin(a) * r, y, 12 + Math.cos(a) * r]); return pts; };
    poly(ring(2.2, .55), '#cbbd9f', '#6a5a40', 2); poly(ring(1.95, .5), '#12263a');
    for (let k = 0; k < 3; k++) { const r_ = .3 + 1.6 * ((t * .3 + k / 3) % 1); poly(ring(r_, .5), null, `rgba(170,210,240,${.35 * (1 - r_ / 1.9)})`, 2); }
    const [fx, fy, fk] = prj(0, .55, 12); for (let k = 0; k < 6; k++) circ(fx + (k - 2.5) * .55 * fk, fy + .05 * fk, .05 * fk, '#ffd08a');
    const [sx, sy0] = prj(0, .5, 12), [, sy1, sk] = prj(0, 2.6, 12); g.fillStyle = lg(sx - .3 * sk, 0, sx + .3 * sk, 0, ['#6a5a40', '#d8cba8', '#5a4a34']); path([[sx - .35 * sk, sy0], [sx - .12 * sk, sy1], [sx + .12 * sk, sy1], [sx + .35 * sk, sy0]]); g.closePath(); g.fill();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, [p0x, p0y] = prj(0, 2.6, 12), [cx_, cy_] = prj(Math.sin(a) * .9, 3.4, 12 + Math.cos(a) * .9), [p1x, p1y, pk] = prj(Math.sin(a) * 1.5, .5, 12 + Math.cos(a) * 1.5); g.beginPath(); g.moveTo(p0x, p0y); g.quadraticCurveTo(cx_, cy_, p1x, p1y); g.strokeStyle = 'rgba(200,230,255,.45)'; g.lineWidth = Math.max(1, .035 * pk); g.stroke(); }
    L(fx, fy - 1.2 * fk, 2.6 * fk, C.amb, .5, .25); }
  if (o.dark) for (const l of LIGHTS) { l.a *= 1 - .85 * o.dark; l.ga *= 1 - .85 * o.dark; }      // the dark: the hall's own lights die down, the strobes, screens and eyes stay
  // the people, back to front; anyone right at the lens fades out (except the ones the shot is about)
  const NEAR = o.near ?? 1.5, ppl = (o.people || []).map(p => [p, p.Z - PC.z]).filter(([p, d]) => d > (p.keep ? .8 : NEAR)).sort((a, b) => b[1] - a[1]);
  for (const [p, d] of ppl) { const a = (p.keep ? 1 : clamp((d - NEAR) / .7)) * (p.fade ?? 1); if (a < .02) continue; g.globalAlpha = a; drawPerson(t, p); g.globalAlpha = 1; }
  // the light: the red strobes once the alarm goes; then darken everything but the lights
  if (al > 0) BEACONS.forEach(([X, Y, Z], k) => { if (Z < PC.z + .6) return; const [x, y, kk] = prj(X, Y, Z), s = sv(k); L(x, y, 7 * kk, C.red, al * (.4 + .6 * s) * (1 - .75 * (o.dark || 0)), .55 * al * s * (1 - .5 * (o.dark || 0))); });
  lightPass(o.dark ? '#1c1424' : al > 0 ? '#52283a' : '#3a3460');
}
// a person in the hall: p = { X, Z, h (m), face: 'front'|'back', walk, arms, colours, zombie, fallen, look, eyes, mouth, glow, hl (a soft light on them) }
function drawPerson(t, p) {
  const [x, y, k] = prj(p.X, 0, p.Z), h = (p.h || 1.7) * k; if (h < 6) return;
  const o = { t: t + (p.seed || 0), walk: p.walk ?? null, arms: p.arms || 'down', hood: p.hood, legs: p.legs, skin: p.skin, hair: p.hair, outfit: p.outfit || 'hoodie', back: p.face === 'back', cap: p.cap, glasses: p.glasses,
    eyes: p.eyes || 'open', bandage: p.bandage || 0, mouth: p.mouth || 0, look: p.look || 0, lookY: p.lookY || 0, lx: p.X < PC.x ? 1 : -1, rim: p.rim || (p.zombie ? 'rgba(170,230,200,.5)' : 'rgba(255,200,150,.5)'), zombie: p.zombie || 0, slump: p.slump || 0, sit: p.sit || 0, longHair: p.long || 0, sway: p.sway || 0, sweat: p.sweat || 0, twitch: p.twitch || 0, ground: 1 };
  if (p.fallen) { g.save(); g.translate(x, y - h * .05); g.rotate(p.fallen * Math.PI / 2 * (p.fallDir || 1)); person(0, 0, h, { ...o, walk: null, arms: 'out' }); g.restore(); return; }
  person(x, y, h, o);
  const gl = p.glow ?? 1;
  if (p.zombie && gl > 0 && !o.back) { const hy = y - h * .855 + (p.slump || 0) * h * .05; for (const sg of [-1, 1]) L(x + sg * h * .052, hy, h * .07, '200,255,230', .9 * gl, .55 * gl); }
  if (p.arms === 'phone' && !o.back) { const k = p.phoneL ?? 1; if (p.torch) L(x + h * .14, y - h * .8, h * 1.6, C.white, .95, .5); else if (k > 0) L(x + h * .12, y - h * .83, h * .5 * k, C.cyan, .7, .25 * k); }
  if (p.hl) L(x, y - h * .55, h * .85, C.amb, .5 * p.hl, .1 * p.hl);
}

// ---------- the people: shoppers who stroll, turn at the scream, then run for the doors or freeze; the guard; the infected; the hero ----------
const AG = [];
for (let k = 0; k < 64; k++) {
  const lane = -7.4 + 14.8 * hash(k * 2.3), z0 = 2 + 19 * hash(k * 4.1), dir = hash(k * 3.9) < .5 ? 1 : -1, v = .8 + .5 * hash(k * 5.3);
  const a = { i: k, lane, z0, dir, v, h: 1.55 + .3 * hash(k * 7.1), hood: tone3(pickH(PAL.shirt, k * 3.3)), legs: tone3(pickH(PAL.pants, k * 4.7)), skin: pickH(PAL.skin, k * 5.9), hair: pickH(PAL.hair, k * 6.1), long: hash(k * 8.3) < .4, outfit: hash(k * 9.7) < .35 ? 'shirt' : 'hoodie', phone: hash(k * 2.9) < .15,
    glasses: hash(k * 12.7) < .18, cap: hash(k * 13.9) < .1 ? tone3(pickH(PAL.shirt, k * 2.2)) : null };
  a.tS = S_SCREAM + .25 + .5 * hash(k * 13.1);                       // everyone stops and turns to the entrance at the scream
  a.tR = S_FLEE + .2 + 1.4 * hash(k * 8.8) + .05 * (DZ - z0);       // then runs (or freezes) once the alarm goes
  a.role = hash(k * 11.3) > .32 ? 'run' : 'freeze'; AG.push(a);
}
function calmPos(a, st) { const L_ = 19, p = (((a.z0 - 2) + a.dir * a.v * st) % (2 * L_) + 2 * L_) % (2 * L_), fwd = p < L_; return { X: a.lane, Z: 2 + (fwd ? p : 2 * L_ - p), toward: fwd ? 1 : -1 }; }   // toward +1 = walking into the picture (back to us)
{ const runners = AG.filter(a => a.role === 'run').sort((p, q) => p.tR - q.tR); runners.forEach((a, k) => { const row = Math.floor(k / 9), c = k % 9; a.slot = [-3.0 + c * .75 + (row % 2) * .35, DZ - .45 - row * .55]; a.fall = row >= 2 && row <= 4 && hash(a.i * 17.7) > .7 ? S_JAM + .3 + 2 * hash(a.i * 3.7) : null; }); }
const FREEZER = AG.filter(a => a.role === 'freeze' && Math.abs(a.lane) > 2.8).sort((p, q) => Math.abs(calmPos(p, p.tS).Z - 7) - Math.abs(calmPos(q, q.tS).Z - 7))[0];
function shopper(a, st) {
  const base = { hood: a.hood, legs: a.legs, skin: a.skin, hair: a.hair, long: a.long, outfit: a.outfit, glasses: a.glasses, cap: a.cap, h: a.h, seed: a.i };
  const c = calmPos(a, Math.min(st, a.tS));
  if (st < a.tS) return { ...base, X: c.X, Z: c.Z, face: c.toward > 0 ? 'back' : 'front', walk: st * 5 * a.v + a.i, arms: a.phone ? 'phone' : 'down' };
  if (st < a.tR) return { ...base, X: c.X, Z: c.Z, face: 'back', arms: a.phone ? 'phone' : 'down' };
  const dt = st - a.tR;
  if (a.role === 'freeze') return { ...base, X: c.X, Z: c.Z, face: 'front', arms: a === FREEZER || hash(a.i * 5.5) < .5 ? 'down' : 'rub', eyes: 'wide', look: (a === FREEZER ? .25 : .6) * Math.sin(st * .9 + a.i), mouth: .15 };
  const L_ = Math.hypot(a.slot[0] - c.X, a.slot[1] - c.Z), d = Math.min(L_, run_(3.6 + .8 * hash(a.i), dt)), u = d / L_;
  if (u < 1) return { ...base, X: lerpA(c.X, a.slot[0], u), Z: lerpA(c.Z, a.slot[1], u), face: 'back', walk: st * 11 + a.i, arms: 'out', sweat: 1 };
  const fallen = a.fall !== null && st > a.fall ? ss(seg(st, a.fall, a.fall + .4)) : 0;
  return { ...base, X: a.slot[0] + .06 * Math.sin(st * 3.1 + a.i), Z: a.slot[1] + .05 * Math.sin(st * 2.3 + a.i), face: 'back', arms: fallen ? 'out' : 'reach', fallen, fallDir: hash(a.i) < .5 ? -1 : 1, sway: .3 * Math.sin(st * 4 + a.i) };
}
const GUARD = { X: -4.6, Z: 21.2 }, SCR = { X: -1.2, Z: 20.0 }, Z0P = { X: -3.0, Z: 21.4 }, Z1P = { X: 2.9, Z: 21.3 }, V2 = { X: 4.4, Z: 20.8 };
// the guard by the doors, the woman who screams (on her phone; she looks up, screams, runs), the woman the second one goes for
function extras(st) {
  const gF = ss(seg(st, S_LUNGE + .15, S_LUNGE + .5)), vF = ss(seg(st, S_TURN2 + .1, S_TURN2 + .45));
  const out = [{ X: GUARD.X, Z: GUARD.Z, face: 'front', outfit: 'shirt', hood: ['#4a5a8a', '#2d3d66', '#141c36'], legs: tone3('#1c2233'), skin: PAL.skin[2], hair: HAIRC, cap: ['#3a4a78', '#25335a', '#121a33'], h: 1.76, seed: 70,
      eyes: st > S_SCREAM ? 'wide' : 'open', look: st > S_SCREAM ? .8 : 0, mouth: st > S_LUNGE ? .5 : 0, arms: st > S_LUNGE ? 'out' : 'down', fallen: gF, fallDir: 1 },
    { X: V2.X, Z: V2.Z, face: 'front', hood: tone3('#e0b040'), legs: tone3('#2a2d3a'), skin: PAL.skin[0], hair: PAL.hair[2], long: 1, h: 1.6, seed: 72, eyes: st > S_SCREAM ? 'wide' : 'open', look: st > S_LUNGE ? -.8 : 0, mouth: st > S_TURN2 ? .7 : 0, arms: st > S_TURN2 ? 'out' : 'down', fallen: vF, fallDir: 1 }];
  const sb = { hood: tone3('#c8507a'), legs: tone3('#2a2a3a'), skin: PAL.skin[1], hair: PAL.hair[1], long: 1, h: 1.62, seed: 71, keep: 1 };
  if (st < S_LUNGE + .3) out.push({ ...sb, X: SCR.X, Z: SCR.Z, face: 'front', arms: st < S_SCREAM - .1 ? 'phone' : 'up', eyes: st > S_SCREAM - .45 ? 'wide' : 'open', look: st > S_SCREAM - .45 ? -.9 : .2, lookY: st < S_SCREAM - .45 ? .6 : 0, mouth: st > S_SCREAM - .05 ? .95 : 0, sweat: st > S_SCREAM ? 1 : 0 });
  else { const d = run_(3.4, st - S_LUNGE - .3), L_ = Math.hypot(2.2, 5.5), u = Math.min(1, d / L_); out.push({ ...sb, keep: 0, X: lerpA(SCR.X, 1.0, u), Z: lerpA(SCR.Z, 14.5, u), face: 'front', walk: u < 1 ? st * 11 : null, arms: u < 1 ? 'out' : 'rub', eyes: 'wide', mouth: u < 1 ? .6 : .2, sweat: 1 }); }
  return out;
}
const ZSIDE = [[-8.3, 14], [8.3, 16], [-8.3, 18.5], [8.3, 11.5], [-8.3, 9.5], [8.3, 19]].map(([x, z], k) => ({ x, z, t0: S_FLEE + 1 + k * .9, tx: Math.sign(x) * (3.6 + .8 * hash(k)), tz: DZ - 4.6 - .8 * hash(k * 3), k }));
const ZQ = { x0: 3.4, z0: 12.4, x1: 1.4, z1: 18.4, t0: T('c3q') - 1.2 };      // the one we follow toward the noise
const zq = st => { const L_ = Math.hypot(ZQ.x1 - ZQ.x0, ZQ.z1 - ZQ.z0), u = clamp((st - ZQ.t0) * .8 / L_); return { X: lerpA(ZQ.x0, ZQ.x1, u), Z: lerpA(ZQ.z0, ZQ.z1, u), u }; };
function infected(st) {
  const out = [], zc = k => ({ zombie: 1, outfit: 'shirt', skin: ZSK[k % 2], hood: tone3(ZCL[k % 4]), legs: tone3('#22201c'), hair: ['#14110e', '#0b0907', '#050403'], eyes: 'dead', seed: 40 + k });
  // patient zero: hunched by the doors, twitching; his eyes light at the scream; then the lunge, and he stays bent over the guard
  if (st < S_LUNGE) out.push({ ...zc(0), X: Z0P.X, Z: Z0P.Z, face: 'front', slump: .35, arms: st > S_SCREAM - .3 ? 'reach' : 'down', twitch: 1, glow: ss(seg(st, S_SCREAM - .4, S_SCREAM)) });
  else { const u = ss(seg(st, S_LUNGE, S_LUNGE + .3)); out.push({ ...zc(0), X: lerpA(Z0P.X, GUARD.X + .9, u), Z: lerpA(Z0P.Z, GUARD.Z - .25, u), face: 'front', arms: 'reach', slump: .25 + .3 * ss(seg(st, S_LUNGE + .5, S_LUNGE + 1)) }); }
  // the second one: a man by the doors, twitching since the first attack; at "another" he lunges at the woman beside him
  const t2 = S_TURN2 - .1;
  if (st < t2) out.push({ X: Z1P.X, Z: Z1P.Z, face: 'front', outfit: 'shirt', hood: tone3('#45505a'), legs: tone3('#2b2b2b'), skin: PAL.skin[1], hair: HAIRC, seed: 41, slump: st > S_LUNGE ? .3 : 0, twitch: st > S_LUNGE ? 1 : 0, look: st > S_SCREAM ? -.6 : 0 });
  else { const u = ss(seg(st, t2, t2 + .3)); out.push({ ...zc(1), X: lerpA(Z1P.X, V2.X - .4, u), Z: lerpA(Z1P.Z, V2.Z - .2, u), face: 'front', arms: 'reach', glow: ss(seg(st, t2, t2 + .25)), slump: .25 + .3 * ss(seg(st, t2 + .5, t2 + 1)) }); }
  // more of them come out of the side shops, toward the noise at the doors
  for (const z of ZSIDE) { if (st < z.t0) continue; const d = (st - z.t0) * .85, L_ = Math.hypot(z.tx - z.x, z.tz - z.z), u = Math.min(1, d / L_);
    out.push({ ...zc(z.k + 2), X: lerpA(z.x, z.tx, u), Z: lerpA(z.z, z.tz, u), face: u < 1 && z.tz > z.z ? 'back' : 'front', arms: 'reach', walk: u < 1 ? st * 3 + z.k : null, slump: .25 }); }
  if (st > ZQ.t0 - 2) { const q = zq(st); out.push({ ...zc(7), X: q.X, Z: q.Z, face: 'back', arms: 'reach', walk: q.u < 1 ? st * 3 : null, slump: .2, keep: 1 }); }
  return out;
}
// the hero: walks in calm, stops at the scream, turns away from the stampede, walks off along the left side toward the fire exit
const H_STOP = S_SCREAM + .2, B0 = S_FLEE + .5, C0 = wordT('c1a', 'Humiwalay') - .1, D0 = T('c3a') - .1;
function hero(st) {
  if (st < H_STOP) { const z = 9.6 - Math.max(0, H_STOP - st) * 1.15; return { ...HB, X: -.4, Z: Math.max(2.2, z), face: 'back', walk: z > 2.2 ? st * 5.5 : null }; }
  if (st < B0) return { ...HB, X: -.4, Z: 9.6, face: 'back' };
  if (st < C0) { const d = Math.min(6.3, (st - B0) * 1.1), u = d / 6.3; return { ...HB, X: lerpA(-.4, -5.0, ss(u)), Z: lerpA(9.6, 10.8, ss(u)) - d * .2 * (1 - u), face: 'front', walk: u < 1 ? st * 5.5 : null, look: u < 1 ? 0 : .5 * Math.sin(st * .7), eyes: 'wide' }; }
  if (st < D0) { const d = run_(1.5, st - C0); return { ...HB, X: lerpA(-5.0, -6.6, clamp(d / 5)), Z: Math.max(5.6, 10.6 - d), face: 'front', walk: st * 6.5, eyes: 'wide' }; }
  return { ...HB, X: -7.6, Z: 5.3, face: 'back', walk: st * 3 };
}
const staged = (st, o = {}) => { const al = st >= S_ALARM ? ss(seg(st, S_ALARM, S_ALARM + .4)) : 0, zf = o.zf ?? 1;
  const ppl = [...AG.map(a => shopper(a, st)), ...extras(st), ...(o.noHero ? [] : [hero(st)])];
  if (zf > .02) for (const p of infected(st)) ppl.push({ ...p, glow: (p.glow ?? 1) * zf, fade: zf });
  return { alarm: al, people: ppl, zf }; };
const keepOnly = (s, f) => { s.people = s.people.filter(p => p.keep || f(p)); return s; };
const clearFront = (s, h) => keepOnly(s, p => !(p.Z < h.Z + .6 && Math.abs(p.X - h.X) < 1.1));     // nobody between the lens and the hero

// ---------- the fire-exit corridor: narrow, cold strip lights, the green EXIT sign over a steel door; the door opens onto white ----------
function corridor(t, st, o = {}) {
  const save = { ...PC }; PC.x = o.cx || 0; PC.y = 1.6; PC.z = o.cz || 0; PC.hy = 980; PC.F = 1000;
  fill('#08090c'); const CW = 1.5, CL = 9, CH = 3.2;
  poly([[-CW, 0, CL], [-CW, CH, CL], [CW, CH, CL], [CW, 0, CL]], '#2a2e34');
  const open = o.open || 0, [dx0, dy1] = prj(-.7, 2.3, CL - .02), [dx1, dy0] = prj(.7, 0, CL - .02);
  g.fillStyle = 'rgba(225,240,255,1)'; g.fillRect(dx0, dy1, dx1 - dx0, dy0 - dy1); if (open > 0) L((dx0 + dx1) / 2, (dy0 + dy1) / 2, 900 * open, C.white, .9 * open, .5 * open);
  g.save(); g.translate(dx0, 0); g.scale(Math.cos(open * 1.3), 1); g.fillStyle = lg(0, 0, dx1 - dx0, 0, ['#5d6166', '#7a7f86', '#4a4e54']); g.fillRect(0, dy1, dx1 - dx0, dy0 - dy1); g.fillStyle = '#c9a45e'; g.fillRect((dx1 - dx0) * .15, lerp(dy1, dy0, .55), (dx1 - dx0) * .7, 8); g.restore();
  const [sx, sy, sk] = prj(0, 2.75, CL - .05); rr(sx - sk * .6, sy - sk * .22, sk * 1.2, sk * .44, 6); g.fillStyle = '#04140a'; g.fill(); g.save(); g.shadowColor = 'rgba(80,255,150,1)'; g.shadowBlur = 24; text(TX.exit, sx, sy + 2, sk * .34, '#7dffae', 'Anton'); g.restore(); L(sx, sy, 3 * sk, C.grn, .9, .45);
  for (const side of [-1, 1]) { poly([[side * CW, 0, 0], [side * CW, CH, 0], [side * CW, CH, CL], [side * CW, 0, CL]], side < 0 ? '#3a3e46' : '#33373e'); for (let z = 1; z < CL; z += 2) { const [x, y, k] = prj(0, CH - .02, z); rr(x - .5 * k, y - .03 * k, k, .06 * k, 3); g.fillStyle = '#e8f2ff'; g.fill(); L(x, y, 2 * k, C.white, .45, .15); } }
  poly([[-CW, 0, 0], [CW, 0, 0], [CW, 0, CL], [-CW, 0, CL]], '#22252a'); for (let z = 0; z < CL; z += .6) poly([[-CW, 0, z], [CW, 0, z], [CW, 0, z + .02], [-CW, 0, z + .02]], 'rgba(0,0,0,.4)');
  poly([[-CW, CH, 0], [CW, CH, 0], [CW, CH, CL], [-CW, CH, CL]], '#15171b');
  for (const p of [...(o.people || []), ...(o.hero ? [o.hero] : [])].sort((a, b) => b.Z - a.Z)) drawPerson(t, p);
  lightPass('#2a3448'); Object.assign(PC, save);
}
// ---------- the mall directory: a lit standee with the floor plan; the crowd at the entrance (red), the orange dot is you, a green way to the exit ----------
function directory(t, u, noTitle = 0) {
  grad('#100c10', '#1e1620', -400, 2300); motes(0, 0, W, H, 40, t, C.amb, .3, 5);
  const k = lerp(1, noTitle ? 1.07 : 1.16, ss(u / 3.5)); g.save(); g.translate(CX, 900); g.scale(k, k); g.translate(-CX, -900);
  const x0 = 150, y0 = 250, w = 780, h = 1200;
  rr(x0 - 26, y0 - 26, w + 52, h + 52, 20); g.fillStyle = lg(x0, 0, x0 + w, 0, ['#7a5a2a', '#e0c07a', '#6a4a20']); g.fill(); rr(x0, y0, w, h, 10); g.fillStyle = lg(0, y0, 0, y0 + h, ['#2c2822', '#1a1712']); g.fill();
  if (!noTitle) text(TX.directory, CX, y0 + 95, 78, '#f6e2b8', 'Anton');
  const s = 34, toP = (X, Z) => [CX + X * s, (noTitle ? 990 : 930) + (Z - 12) * s];
  const [ax, ay] = toP(-HW, 2); g.fillStyle = 'rgba(216,200,160,.08)'; g.fillRect(ax, ay, 2 * HW * s, 20 * s); g.strokeStyle = '#e0d0a8'; g.lineWidth = 5; g.strokeRect(ax, ay, 2 * HW * s, 20 * s);
  for (let z = 2; z < DZ - .1; z += 3.6) for (const side of [-1, 1]) { const [a, b] = toP(side * HW, z); g.fillStyle = 'rgba(216,200,160,.16)'; g.fillRect(side < 0 ? a : a - 2.6 * s, b + 3, 2.6 * s, 3.6 * s - 6); g.strokeStyle = 'rgba(224,208,168,.6)'; g.lineWidth = 2; g.strokeRect(side < 0 ? a : a - 2.6 * s, b + 3, 2.6 * s, 3.6 * s - 6); }
  const [fx, fy] = toP(0, 12); circ(fx, fy, 2.2 * s, '#e0d0a8', 4); circ(fx, fy, 1.4 * s, 'rgba(110,170,230,.35)');
  const [nx, ny] = toP(0, DZ); for (let i = 0; i < 46; i++) circ(nx + (hash(i * 3.3) - .5) * 6.4 * s, ny - 10 - hash(i * 7.7) * 2.6 * s, 6, `rgba(255,70,80,${.6 + .4 * Math.sin(t * 6 + i)})`);
  rr(nx - 120, ny - 2, 240, 52, 8); g.fillStyle = '#e8d9b8'; g.fill(); text(TX.entrance, nx, ny + 25, 34, '#100d0b', 'Anton'); L(nx, ny - 40, 220, C.red, .8, .25);
  const [ex, ey] = toP(-HW, (EXZ[0] + EXZ[1]) / 2); circ(ex, ey, 36, '#3dd47a'); text('EXIT', ex, ey + 2, 26, '#04140a', 'Anton');
  const [hx, hy] = toP(-6.4, 7.5), pulse = 1 + .15 * Math.sin(t * 5);
  g.setLineDash([16, 12]); line([[hx, hy], [ex + 36, ey]], 7, 'rgba(61,212,122,.95)'); g.setLineDash([]);
  circ(hx, hy, 26 * pulse, '#ff7a35'); circ(hx, hy, 26 * pulse, '#fff', 5); L(hx, hy, 170, C.amb, .9, .5);
  text(TX.here, hx + 44, hy + 64, 50, '#ffa070', 'Anton', 'left');
  L(CX, y0 + h * .5, 900, C.warm, .85, .06); L(ex, ey, 220, C.grn, .9, .45); L(CX, y0 + 95, 300, C.warm, .7, .1);
  g.restore(); lightPass('#3a3048');
}

// ---------- overlays special to this reel: the clock since the scream, rule cards (danger red), the big end cards ----------
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

// ---------- the choice cards: CHOICE #n up top, A and B down low, a 3-2-1 ring between question and answer, then PATAY on the wrong one, a check on the right one ----------
const CH = [1, 2, 3, 4, 5].map(n => ({ n, q: `c${n}q`, a: `c${n}a`, ask: TX.asks[n - 1], opts: TX.opts[n - 1], ok: TX.ok[n - 1] }));
function choiceUI(t) {
  for (const c of CH) {
    const t0 = T(c.q), tq = E(c.q), ta = T(c.a), t1 = E(c.a); if (t < t0 || t > t1 + .4) continue;
    ruleCard(t, t0, t1, c.n, c.ask);
    const k = back(seg(t, t0 + .4, t0 + .7), 1.8) * (1 - ss(seg(t, t1 + .1, t1 + .4))); if (k <= 0) continue;
    const rv = t >= ta ? seg(t, ta, ta + .25) : 0, w = 450, h = 130;
    reset(); g.save(); g.translate(CX, 1300); g.scale(k, k);
    c.opts.forEach((lab, i) => {
      const x = (i ? 1 : -1) * 250, good = i === c.ok, col = rv > 0 ? (good ? GRN : RED) : 'rgba(255,255,255,.6)';
      g.save(); g.translate(x, 0); const pop = rv > 0 && good ? 1 + .1 * Math.sin(Math.PI * clamp(rv * 1.4)) : 1; g.scale(pop, pop); g.globalAlpha = rv > 0 && !good ? 1 - .4 * rv : 1;
      glass(-w / 2, -h / 2, w, h, 28, col, 4, rv > 0 ? (good ? 'rgba(109,255,168,.85)' : 'rgba(255,49,80,.85)') : 'rgba(255,255,255,.35)');
      text(i ? 'B' : 'A', -w / 2 + 36, -h / 2 + 30, 32, rv > 0 ? col : YEL, 'Anton');
      g.font = '62px Anton'; const sc = Math.min(1, (w - 90) / g.measureText(lab).width); g.save(); g.translate(0, 6); g.scale(sc, sc); text(lab, 0, 0, 62, '#fff', 'Anton'); g.restore();
      g.restore();
      if (rv > 0) { const sk = back(clamp(rv * 1.2), 2.5); g.save(); g.translate(x, 0);
        if (good) { g.translate(w / 2 - 14, -h / 2 + 6); g.scale(sk, sk); circ(0, 0, 36, GRN); circ(0, 0, 36, '#04140a', 4); line([[-15, 0], [-4, 12], [16, -12]], 9, '#04140a'); }
        else { g.rotate(-.16); g.scale(sk, sk); g.save(); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 24; rr(-140, -46, 280, 92, 12); g.fillStyle = 'rgba(40,4,10,.6)'; g.fill(); g.strokeStyle = RED; g.lineWidth = 8; g.stroke(); text(TX.dead, 0, 4, 72, '#ff5068', 'Anton'); g.restore(); }
        g.restore(); }
    });
    if (t > tq && t < ta) { const p = (t - tq) / (ta - tq), n = 3 - Math.min(2, Math.floor(p * 3)), pk = 1 + .12 * (1 - (p * 3) % 1);
      g.save(); g.translate(0, -1070); circ(0, 0, 60, 'rgba(8,10,22,.88)'); g.beginPath(); g.arc(0, 0, 60, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p)); g.strokeStyle = YEL; g.lineWidth = 9; g.lineCap = 'round'; g.stroke();
      g.scale(pk, pk); text(String(n), 0, 4, 74, '#fff', 'Anton'); g.restore(); }
    g.restore();
  }
}

// ---------- shots ----------
const S = {};
const setPC = (x, y, z, hy = 960, F = 1000) => { PC.x = x; PC.y = y; PC.z = z; PC.hy = hy; PC.F = F; };
// the hook: you, on your phone in the calm mall; behind you one of them, twitching, eyes lit, a step closer every second; on "patay" it lunges
const PATAY = wordT('h1', 'patay');
function hookShot(t, k) {          // k = seconds since frame 1 (negative in the loop's lead-in)
  const lunge = k > 0 ? ss(seg(k, PATAY - .15, PATAY + .15)) : 0, look = k > PATAY - .45, hx = -3.0, hz = 7.2;
  const dz = lerp(2.4 - .22 * (k + 1.6), .5, lunge);
  setPC(hx + .3, 1.45, hz - 2.5 + .15 * seg(k, -1.6, PATAY), 1000, 1000);
  const me = { ...HB, X: hx, Z: hz, face: 'front', arms: look ? 'out' : 'phone', phoneL: 1.4, eyes: look ? 'wide' : 'open', mouth: look ? .45 : 0, lookY: look ? 0 : .6, look: look ? .5 : 0, sweat: look ? 1 : 0 };
  const zb = { zombie: 1, outfit: 'shirt', skin: ZSK[0], hood: tone3('#3a3530'), legs: tone3('#22201c'), hair: ['#14110e', '#0b0907', '#050403'], eyes: 'dead', X: hx + .6 - .2 * lunge, Z: hz + dz, face: 'front',
    slump: .3 * (1 - lunge), twitch: 1, arms: 'reach', mouth: .3 + .5 * lunge, sway: .3 * Math.sin(t * 1.1), seed: 50, keep: 1, rim: 'rgba(170,230,200,.75)' };
  const s = keepOnly(staged(1 + k, { noHero: 1, zf: 0 }), p => !(p.Z < hz + dz + 1 && Math.abs(p.X - hx) < 1.7)); s.people.push(zb, me); hall(t, s); }
S.rush = (t, u) => { cam(CX, 900, 1 + .06 * eo(seg(u, PATAY - .1, PATAY + .25)), 0, u > PATAY ? 9 * Math.exp(-(u - PATAY) * 4) : 0, t); hookShot(t, u); };
S.loop = (t, u) => { const L_ = TL.dur - T('tail'); cam(CX, 900, 1); hookShot(t, u - L_); };
// by the doors: a woman on her phone looks up, and screams (behind her, by the glass, the hunched man)
S.scream = (t, u) => { cam(CX, 900, 1 + .07 * eo(seg(t, S_SCREAM, S_SCREAM + .35)), 0, t > S_SCREAM ? 3 * Math.exp(-(t - S_SCREAM) * 3) : 0, t); setPC(-1.7, 1.35, 18.0, 980, 1050);
  hall(t, keepOnly(staged(t), p => p.Z > 20.3)); };
// he lunges at the guard
S.lunge = (t, u) => { cam(CX, 900, 1, 0, t > S_LUNGE ? 6 * Math.exp(-(t - S_LUNGE) * 4) : 0, t); setPC(-3.4, 1.45, 17.2, 990, 1100);
  hall(t, keepOnly(staged(t), p => p.Z > 20.4 || (p.Z > 19.4 && Math.abs(p.X - PC.x) > 1.6))); };
// choice 1: high and wide, the alarm, everyone runs for the entrance
S.well = (t, u) => { cam(CX, 900, 1, 0, 2 * Math.exp(-u * 2), t); setPC(lerp(-.4, .3, seg(u, 0, 5)), 8.0, lerp(-3, -1.2, ss(seg(u, 0, 5))), 420, 900); hall(t, staged(t)); };
// answer 1: the crush at the doors (the wrong way); then "break away": the orange hoodie walking out of it
const BRK = wordT('c1a', 'Humiwalay');
S.r1 = (t, u) => { cam(CX, 900, 1); const h = hero(t); setPC(h.X + .3, 1.3, h.Z - 3.0, 1000, 1000); hall(t, clearFront(staged(t), h)); };
S.a1 = (t, u) => { if (t < BRK - .05) { cam(CX, 900, lerp(1, 1.04, seg(u, 0, 3)), 0, 4, t); setPC(.2, 2.3, 16.4, 1030, 1000); hall(t, staged(t, { noHero: 1 })); } else S.r1(t, u); };
// choice 2: the mall directory
S.map = (t, u) => { cam(CX, 960, 1); directory(t, u, 1); };
// answer 2: down the fire-exit corridor; then the entrance, them pressed against the glass
const KASI = wordT('c2a', 'Kasi');
S.a2 = (t, u) => { if (t < KASI - .05) { cam(CX, 900, lerp(1, 1.04, seg(u, 0, 1))); const cz = lerp(-1.2, -.7, seg(u, 0, 1)); corridor(t, t, { cz, hero: { ...HB, X: .3, Z: cz + 2.7, face: 'back', walk: t * 5.5, rim: 'rgba(120,255,170,.6)' } }); }
  else { cam(CX, 900, 1, 0, 3, t); setPC(.3, 1.75, 15.6, 940, 1000); hall(t, staged(t, { noHero: 1 })); } };
// choice 3: one of them right in front of you, coming
S.noise = (t, u) => { cam(CX, 900, 1, 0, 1.2, t); setPC(-4.4, 1.55, 4.0, 990, 1000); const s = keepOnly(staged(t, { noHero: 1 }), p => p.Z > 14);
  s.people.push({ zombie: 1, outfit: 'shirt', skin: ZSK[1], hood: tone3('#2d3238'), legs: tone3('#22201c'), hair: ['#14110e', '#0b0907', '#050403'], eyes: 'dead', X: -4.2, Z: 4.0 + Math.max(2.4, 3.6 - .2 * u), face: 'front',
    arms: 'reach', walk: t * 2.2, slump: .25, twitch: .6, look: .5 * Math.sin(t * .8), seed: 55, keep: 1, rim: 'rgba(170,230,200,.75)' }); hall(t, s); };
// answer 3: sneaking past one of them, a finger to the lips
const ZNpose = t => ({ zombie: 1, outfit: 'shirt', skin: ZSK[0], hood: tone3('#33302a'), legs: tone3('#22201c'), hair: ['#14110e', '#0b0907', '#050403'], eyes: 'dead', X: -3.4, Z: 8.0, face: 'front', look: .8 * Math.sin(t * .6), slump: .3, arms: 'reach', sway: .4 * Math.sin(t * .8), seed: 60, rim: 'rgba(170,230,200,.75)', keep: 1 });
const sneak = (t, u) => ({ ...HB, X: lerp(-4.3, -6.3, seg(u, 0, span('c3a') + .2)), Z: 5.4, h: 1.5, face: 'front', walk: t * 3.2, arms: 'shh', eyes: 'wide', look: .7, slump: .1, sweat: 1 });
S.r3 = (t, u) => { cam(CX, 900, 1); setPC(-5.0, 1.0, 2.6, 1200, 1000); const s = keepOnly(staged(t, { noHero: 1 }), p => p.Z > 13); s.people.push(ZNpose(t), sneak(t, u)); hall(t, s); };
// choice 4 and its answer, in the dark: you keep your phone dark; across the hall someone turns a flashlight on, and they all turn to it
const OTHER = { X: -1.4, Z: 15.6 }, HUNT = [[-1.0, 12.6], [-3.6, 18.8], [.4, 17.6]], TORCH = T('c4a') + .1;
S.dark = (t, u) => { cam(CX, 900, 1); const on = t > TORCH;
  setPC(-3.2, 1.45, lerp(7.6, 8.4, seg(t, T('c4q'), E('c4a'))), 1010, 1000); const s = keepOnly(staged(t, { noHero: 1 }), p => p.Z > 19.2);
  s.people.push({ ...HB, X: -4.2, Z: 10.6, face: 'front', arms: 'phone', phoneL: 0, eyes: 'wide', look: on ? .7 : .25 * Math.sin(t * 1.3), sweat: 1, hl: .3 },
    { X: OTHER.X, Z: OTHER.Z, face: 'front', arms: on ? 'phone' : 'down', torch: on, hood: tone3('#3f6a3a'), legs: tone3('#2b2b2b'), skin: PAL.skin[0], hair: PAL.hair[2], glasses: 1, seed: 90, keep: 1 });
  HUNT.forEach(([x, z], k) => { const d = Math.max(0, t - TORCH - .3 - .3 * k) * .9, L_ = Math.hypot(OTHER.X - x, OTHER.Z - z - .6), v = Math.min(1, d / L_);
    s.people.push({ zombie: 1, outfit: 'shirt', skin: ZSK[k % 2], hood: tone3(ZCL[k % 4]), legs: tone3('#22201c'), hair: ['#14110e', '#0b0907', '#050403'], eyes: 'dead', seed: 91 + k, keep: 1,
      X: lerpA(x, OTHER.X + (k - 1) * .5, v), Z: lerpA(z, OTHER.Z - .6, v), face: v > 0 && v < 1 && OTHER.Z > z ? 'back' : 'front', arms: 'reach', walk: v > 0 && v < 1 ? t * 3 + k : null, slump: .3, sway: .3 * Math.sin(t * .9 + k), look: .6 * Math.sin(t * .7 + k) }); });
  hall(t, { ...s, dark: 1 }); };
S.phone = S.dark;
// choice 5 and its answer, in the fire-exit corridor: your best friend holding a bitten hand; on "hindi" she turns
const FR = { hood: tone3('#7a4fb0'), legs: tone3('#2a2d3a'), hair: PAL.hair[1], long: 1, h: 1.62, seed: 80 };
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
const TURN = wordT('c5a', 'hindi') - .3;
S.friend = (t, u) => { const z = ss(seg(t, TURN, TURN + .5));
  cam(CX, 900, lerp(1, 1.05, seg(t, T('c5q'), TURN)) * (1 + .05 * eo(seg(t, TURN, TURN + .3))), 0, t > TURN ? 5 * Math.exp(-(t - TURN) * 3) : 0, t);
  const fr = { ...FR, X: .15, Z: lerp(4.1, 3.4, ss(seg(t, TURN + .2, TURN + 1.6))), face: 'front', skin: PAL.skin[1].map((c, i) => mixHex(c, ZSK[0][i], z)), zombie: z > .5 ? 1 : 0, bandage: 1,
    arms: z > .5 ? 'reach' : 'out', eyes: z > .3 ? 'dead' : 'wide', mouth: z > .5 ? .7 : .25, glow: ss(seg(t, TURN + .1, TURN + .5)), slump: .2 * z, twitch: z, sweat: 1 - z, look: z > .3 ? 0 : -.2, rim: 'rgba(200,230,255,.6)', keep: 1 };
  corridor(t, t, { cz: lerp(1.9, 1.5, seg(t, TURN, TURN + 2)), people: [fr] }); };
S.bitten = S.friend;
// 5 out of 5: the door nobody is looking at opens onto white
S.exit = (t, u) => { cam(CX, 900, lerp(1, 1.1, ss(seg(u, .6, span('o1'))))); const d = run_(2.2, u), open = ss(seg(u, span('o1') - 1.2, span('o1') - .4));
  corridor(t, t, { cz: lerp(1.5, 3.5, ss(seg(u, 0, span('o1')))), open, hero: { ...HB, X: .1, Z: Math.min(8.2, 4.0 + d), face: 'back', walk: d < 4.2 ? t * 9 : null, rim: 'rgba(225,240,255,.8)' } }); };
// the score: he turns back at the open door; then the share
const doorHero = () => ({ ...HB, X: 0, Z: 8.4, face: 'front', arms: 'offer', rim: 'rgba(235,245,255,.9)', hl: .6 });
S.think = (t, u) => { cam(CX, 900, lerp(1, 1.06, ss(seg(u, 0, 4)))); corridor(t, t, { cz: 5.3, open: 1, hero: doorHero() }); };
S.share = (t, u) => { cam(CX, 900, 1.06); corridor(t, t, { cz: 5.3, open: 1, hero: doorHero() }); };

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
  bloom(); vignette(.55);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'rush') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .2, .6)));
  choiceUI(t);
  if (sh[2] === 'think') bigCard(t, T('o2') + .1, TX.where, TX.comment);
  if (sh[2] === 'share') bigCard(t, T('o3'), TX.share[0], TX.share[1]);
  if (!['share', 'loop', 'think'].includes(sh[2])) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

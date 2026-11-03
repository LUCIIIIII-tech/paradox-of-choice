// The Wolf (sample): a 10-second 1940s black-and-white cartoon reel, 1080x1920.
// A smug wolf in a suit tells a nervous pig how a feeling was sold to everyone. The timeline comes from the voices (timeline.json),
// so every cut lands on a word.
// Drawing: shapes are smooth bezier silhouettes (Catmull-Rom through hand-placed points, sharp where fur spikes), filled flat, then
// airbrushed like a 1940s cel (a lit side, a shadow side, cast shadows clipped inside), fur flicks inside the silhouettes, and inked
// with tapered brush lines. The old-film pass (greyscale with a little sepia, lamp flicker, gate weave, grain, dust, a rounded dark
// vignette) and small lowercase captions go on last.
const W = 1080, H = 1920, TAU = Math.PI * 2;
const cv = document.getElementById('c'), out = cv.getContext('2d');
const TL = await (await fetch('timeline.json')).json();
const LIPS = await (await fetch('voices/lips.json')).json();
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
window.DUR = TL.dur;

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const wordT = (id, w) => { const x = LN[id].words.find(v => v[0].toLowerCase().startsWith(w.toLowerCase())); return x ? x[1] : LN[id].t0; };
const OL = '#161214';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const SC = mk(W, H); let g = SC.getContext('2d');     // the scene is drawn here, then filmed onto the page canvas
let LW = 1;                                             // ink width factor, so close-ups do not get fat lines

function reset() { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.shadowBlur = 0; }
function cam(cx, cy, z = 1, rot = 0) { reset(); g.translate(W / 2, H / 2); g.scale(z, z); if (rot) g.rotate(rot); g.translate(-cx, -cy); LW = 1 / Math.sqrt(z); }
function ell(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); return p; }
function poly(pts) { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; }
function lg(x0, y0, x1, y1, cols) { const gr = g.createLinearGradient(x0, y0, x1, y1); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); return gr; }
function rg(x, y, r0, r1, cols) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); return gr; }
function text(s, x, y, size, c, font = 'Gloock', align = 'center') { g.font = `${size}px ${font}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = c; g.fillText(s, x, y); }

// smooth path through points; a point [x, y, 1] is a sharp corner (fur spikes, collar tips)
function sp(pts, closed = true) {
  const p = new Path2D(), n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), k1 = p1[2] ? 0 : 1 / 6, k2 = p2[2] ? 0 : 1 / 6;
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k1, p1[1] + (p2[1] - p0[1]) * k1, p2[0] - (p3[0] - p1[0]) * k2, p2[1] - (p3[1] - p1[1]) * k2, p2[0], p2[1]);
  }
  if (closed) p.closePath(); return p;
}
// a right half drawn from the top centre to the bottom centre -> the whole symmetric outline
const sym = h => [...h, ...h.slice(1, -1).reverse().map(([x, y, s]) => [-x, y, s])];
const mir = pts => pts.map(([x, y, s]) => [-x, y, s]);
// sample a Catmull-Rom curve (open) into a polyline
function samp(pts, k = 10) {
  const o = [], n = pts.length, P = i => pts[clamp(i, 0, n - 1)];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < k; j++) {
    const t = j / k, t2 = t * t, t3 = t2 * t, p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    o.push([0, 1].map(d => .5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
  }
  o.push(pts[n - 1]); return o;
}
// a brush stroke: thick in the middle, tapering to points at both ends (or one end with tail = 1)
function taper(pts, w = 6, c = OL, tail = 0) {
  const q = samp(pts), n = q.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = q[Math.max(0, i - 1)], b = q[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, u = i / (n - 1);
    const ww = w * LW * .5 * (tail ? Math.pow(Math.sin(Math.PI * (.5 + .5 * u)), .6) * (1 - u * .85) + .08 : Math.pow(Math.sin(Math.PI * u), .55) + .06);
    L.push([q[i][0] - dy / d * ww, q[i][1] + dx / d * ww]); R.push([q[i][0] + dy / d * ww, q[i][1] - dx / d * ww]);
  }
  g.fillStyle = c; g.fill(poly([...L, ...R.reverse()]));
}
// fill a shape and airbrush it: lit from (lx, ly) toward the shadow side, plus an optional rim of light; then ink the outline
function form(p, base, o = {}) {
  const { lit = [0, -120], dark = [0, 120], sh = .45, hi = .2, lw = 6, ink = OL, rim = 0 } = o;
  g.fillStyle = base; g.fill(p);
  g.save(); g.clip(p);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = lg(lit[0], lit[1], dark[0], dark[1], ['#ffffff', '#ffffff', `rgba(${Math.round(255 * (1 - sh))},${Math.round(250 * (1 - sh))},${Math.round(255 * (1 - sh))},1)`]); g.fillRect(-3000, -3000, 6000, 6000);
  if (hi) { g.globalCompositeOperation = 'screen'; g.fillStyle = rg(lit[0], lit[1], 0, Math.hypot(dark[0] - lit[0], dark[1] - lit[1]) * .55, [`rgba(255,250,240,${hi})`, 'rgba(255,250,240,0)']); g.fillRect(-3000, -3000, 6000, 6000); }
  g.restore();
  if (rim) { g.save(); g.clip(p); g.lineWidth = rim * LW; g.strokeStyle = 'rgba(255,248,230,.28)'; g.translate(-2, -4); g.stroke(p); g.restore(); }
  if (lw) { g.lineWidth = lw * LW; g.strokeStyle = ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(p); }
}
function inside(p, fn) { g.save(); g.clip(p); fn(); g.restore(); }
function shade(clipP, shP, a = .35, blur = 0) { g.save(); g.clip(clipP); g.globalCompositeOperation = 'multiply'; if (blur) g.filter = `blur(${blur}px)`; g.fillStyle = `rgba(40,30,40,${a})`; g.fill(shP); g.restore(); }
function ink(p, w = 6, c = OL) { g.lineWidth = w * LW; g.strokeStyle = c; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(p); }
function fillP(p, c) { g.fillStyle = c; g.fill(p); }
// fur flicks: short tapered strokes scattered inside a box, flowing along dir(x, y)
function fur(x0, y0, x1, y1, n, seed, len, c, dir = () => [0, 1]) {
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i * 1.71 + seed)), y = lerp(y0, y1, hash(i * 2.39 + seed)), [dx, dy] = dir(x, y), l = len * (.6 + .6 * hash(i + seed * 3));
    taper([[x, y], [x + dx * l * .5 + dy * 3, y + dy * l * .5 - dx * 3], [x + dx * l, y + dy * l]], 2.6 + 1.6 * hash(i * 5 + seed), c);
  }
}
function sparkle(x, y, r, a) { if (a <= 0) return; g.save(); g.globalAlpha = clamp(a); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(x, y, 0, r * 1.4, ['rgba(255,250,235,.9)', 'rgba(255,250,235,0)']); g.fillRect(x - r * 1.4, y - r * 1.4, r * 2.8, r * 2.8);
  const p = new Path2D(); for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, q = i % 2 ? r * .1 : r; p.lineTo(x + Math.cos(ang) * q, y + Math.sin(ang) * q); } g.fillStyle = '#fffdf4'; g.fill(p); g.restore(); }

// mouth openness of whoever is talking, stepped at 12 fps like hand-drawn lip sync
function mouth(who, t) {
  const tq = Math.floor(t * 12) / 12;
  for (const l of TL.lines) if (l.who === who && tq >= l.t0 && tq < l.t1) { const a = LIPS[l.id]; return a ? a[Math.min(a.length - 1, Math.floor((tq - l.t0) * 24))] || 0 : .5; }
  return 0;
}
const blink = (t, seed) => { const k = Math.floor(t * 12) % 38; return hash(Math.floor(t * 12 / 38) + seed) > .3 && (k === 3 || k === 4); };

// ---------- textures painted once ----------
function paint(c, fn) { const old = g; g = c.getContext('2d'); fn(c.width, c.height); g = old; return c; }
const PAPER = paint(mk(900, 1500), (w, h) => {
  g.fillStyle = '#ece3cf'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,255' : '60,40,20'},.06)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.7) * h, 2, 2); }
  for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(120,90,50,.05)'; g.fill(ell(hash(i * 5) * w, hash(i * 9) * h, 60 + 120 * hash(i), 40 + 80 * hash(i + 2))); }
});
const PAPERED = paint(mk(600, 600), (w, h) => {          // damask wallpaper: stripes, a scrolled medallion, a fine paper grain
  g.fillStyle = '#7a7068'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 100) { g.fillStyle = 'rgba(255,245,230,.05)'; g.fillRect(x, 0, 36, h); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(x + 36, 0, 3, h); g.fillRect(x + 97, 0, 3, h); }
  for (const [cx, cy] of [[150, 150], [450, 450], [450, -150], [150, 750], [-150, 450], [750, 150]]) {
    g.save(); g.translate(cx, cy); g.strokeStyle = 'rgba(40,30,25,.22)'; g.fillStyle = 'rgba(40,30,25,.12)'; g.lineWidth = 4;
    for (const s of [-1, 1]) { g.save(); g.scale(s, 1);
      g.beginPath(); g.moveTo(0, -110); g.bezierCurveTo(60, -90, 70, -30, 26, -10); g.bezierCurveTo(70, 10, 80, 70, 0, 110); g.stroke();
      g.beginPath(); g.moveTo(10, -60); g.bezierCurveTo(40, -50, 40, -24, 16, -24); g.stroke();
      g.beginPath(); g.moveTo(26, -10); g.quadraticCurveTo(60, -4, 54, 30); g.stroke();
      g.beginPath(); g.ellipse(34, 60, 12, 22, -.5, 0, TAU); g.fill(); g.restore(); }
    g.beginPath(); g.ellipse(0, 0, 14, 30, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(0, -128, 8, 0, TAU); g.fill(); g.restore();
  }
  for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,250,240' : '0,0,0'},.05)`; g.fillRect(hash(i * 1.3) * w, hash(i * 2.7) * h, 2, 2); }
});
const GRAIN = [0, 1, 2, 3, 4, 5].map(s => paint(mk(540, 960), (w, h) => {
  const im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 128 + (hash(i * .713 + s * 17.3) - .5) * 200; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0);
}));

// ================= THE WOLF =================
// Grey fur with a pale mask, tall ears, a long snout, heavy smug lids; a double-breasted dark suit, a striped tie, a pocket square.
// Local units: head centre at (0, 0), the head is ~280 wide with its cheek ruff; the neck sits at y 150.
const WF = { fur: '#8c8b90', furD: '#5e5c63', mask: '#d3cec6', earIn: '#4c464a', nose: '#1b1819', suit: '#34313a', lap: '#3c3943', shirt: '#ece8e0', tie: '#5a3b40', brow: '#3c393f' };
const W_HEAD = sp(sym([[0, -108], [50, -104], [86, -80], [102, -42], [108, -6], [138, 22, 1], [112, 36, 1], [144, 64, 1], [108, 72, 1], [128, 102, 1], [86, 104, 1], [60, 126], [28, 140], [0, 146]]));
const W_MASK = sp(sym([[0, -12], [30, -4], [62, 8], [98, 28], [134, 24, 1], [112, 38, 1], [142, 64, 1], [106, 72, 1], [126, 100, 1], [84, 104, 1], [58, 124], [28, 138], [0, 144]]));
const W_STRIPE = sp([[0, -108], [26, -100], [16, -46], [0, -34], [-16, -46], [-26, -100]]);
const W_EAR = sp([[20, -92], [56, -150], [94, -236, 1], [108, -160], [100, -60]]);
const W_EARIN = sp([[40, -96], [68, -150], [91, -208, 1], [96, -150], [88, -78]]);
const W_MUZ = sp(sym([[0, -42], [18, -40], [26, -12], [34, 22], [58, 44], [80, 68], [78, 96], [54, 112], [26, 118], [0, 114]]));
const W_BRIDGE = sp([[18, -40], [26, -12], [34, 22], [56, 42], [30, 34], [16, -4]]);
const W_NOSE = sp(sym([[0, 6], [26, 4], [42, 16], [38, 34], [20, 50], [0, 54]]));
const W_CHIN = sp(sym([[0, 104], [28, 108], [34, 128], [0, 152]]));
const W_EYE = sp([[14, -16, 1], [24, -36], [46, -46], [68, -40], [80, -22, 1], [62, -8], [36, -5]]);

function wolfEye(s, look, lid, glow, browUp) {     // one eye, drawn in right-hand space and mirrored for the left
  g.save(); g.scale(s, 1);
  if (!glow) { shade(W_HEAD, ell(46, -32, 52, 30), .35, 6); taper([[18, -50], [46, -58 - 3 * browUp], [80, -44]], 4, 'rgba(22,18,22,.7)'); }
  if (glow) {
    const ly = lerp(-50, -6, lid), OPEN = sp([[4, ly + 6, 1], [30, ly + 2], [60, ly - 4], [92, ly - 8, 1], [92, 20, 1], [4, 20, 1]]);
    inside(W_EYE, () => inside(OPEN, () => { g.fillStyle = rg(47, -18, 0, 40, ['#fffbe6', '#ffe9a8', '#e8c060']); g.fillRect(0, -60, 100, 80); fillP(ell(47 + look[0] * s * 6, -18, 4, 12), '#2a200c'); }));
    g.restore(); return;
  }
  fillP(W_EYE, '#f3efe7');
  inside(W_EYE, () => {
    if (!glow) {
      g.fillStyle = lg(0, -46, 0, -10, ['rgba(60,50,60,.55)', 'rgba(60,50,60,0)']); g.fillRect(0, -60, 100, 60);
      const ix = 47 + look[0] * s * 12, iy = -22 + look[1] * 5;
      g.fillStyle = rg(ix - 3, iy - 3, 2, 15, ['#c8c4bc', '#8e8a84', '#4a4644']); g.fill(ell(ix, iy, 14, 14)); ink(ell(ix, iy, 14, 14), 2.5);
      fillP(ell(ix, iy, 7, 7.5), '#0e0c0e'); fillP(ell(ix - 5 * s, iy - 5, 3.6, 3.6), '#ffffff'); fillP(ell(ix + 4 * s, iy + 4, 1.6, 1.6), '#ffffff');
    } else { fillP(ell(47, -24, 4, 13), '#3a2e14'); g.fillStyle = rg(47, -24, 0, 30, ['rgba(255,255,255,.8)', 'rgba(255,255,255,0)']); g.fillRect(0, -60, 100, 60); }
    const ly = lerp(-50, -6, lid);                                   // the heavy upper lid
    const LID = sp([[4, -70, 1], [92, -70, 1], [92, ly - 8, 1], [60, ly - 4], [30, ly + 2], [4, ly + 6, 1]]);
    fillP(LID, glow ? '#040306' : '#77757c');
    if (!glow) { g.fillStyle = lg(0, ly - 14, 0, ly, ['rgba(255,255,255,0)', 'rgba(0,0,0,.25)']); g.fill(LID); }
    taper([[8, ly + 6], [30, ly + 2], [60, ly - 4], [90, ly - 8]], 9);
  });
  if (!glow) { ink(W_EYE, 3.5); taper([[30, -6], [52, -2], [74, -14]], 3, 'rgba(22,18,22,.6)'); taper([[78, lerp(-50, -6, lid) - 8], [90, lerp(-50, -6, lid) - 14], [96, lerp(-50, -6, lid) - 10]], 4, OL, 1); }
  g.restore();
}
function wolfHead(o) {
  const m = o.mouth ?? 0, lid = o.blink ? .96 : (o.lid ?? .5), grin = o.grin ?? 0, look = o.look || [-.4, .1], bu = o.brow ?? 1, t = o.t || 0;
  for (const s of [-1, 1]) {                                       // ears
    g.save(); g.scale(s, 1);
    form(W_EAR, WF.fur, { lit: [60, -230], dark: [100, -60], sh: .35, lw: 6 });
    form(W_EARIN, WF.earIn, { lit: [90, -200], dark: [70, -90], sh: .3, hi: .05, lw: 0 });
    inside(W_EARIN, () => { for (let k = 0; k < 7; k++) taper([[58 + k * 5, -84], [64 + k * 4, -112 - k * 3], [74 + k * 2, -138 - k * 4]], 5, 'rgba(220,214,206,.75)'); });
    taper([[52, -150], [74, -200], [92, -232]], 3, 'rgba(255,250,240,.3)');
    g.restore();
  }
  form(W_HEAD, WF.fur, { lit: [-30, -110], dark: [30, 150], sh: .5, hi: .22, lw: 0 });
  inside(W_HEAD, () => {
    g.fillStyle = 'rgba(80,78,86,.55)'; g.fill(W_STRIPE);
    form(W_MASK, WF.mask, { lit: [0, 0], dark: [0, 150], sh: .4, hi: .12, lw: 0 });
    fur(-100, -100, 100, -20, 40, 3, 20, 'rgba(60,58,66,.4)', (x, y) => [x * .006, 1]);
    fur(-130, 10, 130, 120, 46, 7, 22, 'rgba(120,112,108,.35)', (x, y) => [Math.sign(x) * .9, .5]);
    fur(-100, -100, 100, -30, 18, 11, 16, 'rgba(255,250,240,.18)', (x, y) => [x * .006, 1]);
  });
  ink(W_HEAD, 6.5);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) taper([[s * (112 + k * 6), 30 + k * 26], [s * (96 + k * 4), 40 + k * 26], [s * (84 + k * 2), 44 + k * 26]], 3.5, 'rgba(22,18,22,.55)');
  wolfEye(1, look, lid, false, bu); wolfEye(-1, look, lid * (1 + .05), false, 0);
  // brows: the left one low and level, the right one cocked up (the smug read)
  taper([[-16, -58], [-48, -66], [-90, -60]], 15, WF.brow);
  taper([[16, -64], [50, -82 - 10 * bu], [92, -78 - 14 * bu]], 15, WF.brow);
  // muzzle with the bridge in shadow, the whisker pads, the nose
  form(W_CHIN, WF.mask, { lit: [0, 100], dark: [0, 150], sh: .45, hi: 0, lw: 5 });
  form(W_MUZ, WF.mask, { lit: [-10, -30], dark: [0, 120], sh: .3, hi: .25, lw: 5.5 });
  inside(W_MUZ, () => { for (const s of [-1, 1]) { g.save(); g.scale(s, 1); g.fillStyle = 'rgba(70,64,72,.35)'; g.fill(W_BRIDGE); g.restore(); }
    fur(-70, 40, 70, 100, 18, 21, 10, 'rgba(120,112,108,.35)', (x, y) => [Math.sign(x), .2]); });
  for (const s of [-1, 1]) { for (const [x, y] of [[34, 70], [48, 76], [60, 84], [42, 88], [56, 96]]) fillP(ell(s * x, y, 2.6, 2.6), 'rgba(30,24,28,.7)');
    taper([[s * 22, 60], [s * 46, 54], [s * 70, 64]], 3, 'rgba(22,18,22,.4)'); }
  // the mouth: a long smug line that opens with the voice; canines show when it grins
  const gr = Math.max(grin, 0), mo = Math.max(m, gr * .22);
  const L = [-74, 84 - gr * 6], R = [78, 70 - gr * 22];
  const UP = [L, [-44, 94 + gr * 4], [-14, 82], [0, 78], [14, 82], [44, 92 + gr * 2], R];
  const LOW = [R, [44, 100 + 70 * mo], [0, 104 + 80 * mo], [-44, 102 + 70 * mo], L];
  if (mo > .04) {
    const MOUTH = sp([...UP.map((p, i) => [...p, i === 0 || i === UP.length - 1 ? 1 : 0]), ...LOW.slice(1, -1)]);
    fillP(MOUTH, '#1e1416');
    inside(MOUTH, () => {
      fillP(ell(0, 112 + 76 * mo, 44, 20 + 26 * mo), '#6e5052'); taper([[0, 98 + 70 * mo], [0, 120 + 76 * mo]], 3, 'rgba(0,0,0,.4)');
      const T1 = sp([...UP.map(([x, y]) => [x, y - 2]), ...UP.slice().reverse().map(([x, y]) => [x, y + 14 + 6 * gr])]);
      fillP(T1, '#f4f0e6'); for (let k = -3; k <= 3; k++) taper([[k * 18, 84 + Math.abs(k) * 2], [k * 18, 98 + Math.abs(k) * 2 + 6 * gr]], 2.2, 'rgba(40,30,30,.5)');
      for (const s of [-1, 1]) fillP(poly([[s * 30, 90], [s * 46, 92], [s * 39, 116 + 6 * gr]]), '#f8f4ea');             // upper canines
      for (const s of [-1, 1]) fillP(poly([[s * 26, 104 + 78 * mo], [s * 40, 102 + 72 * mo], [s * 32, 84 + 66 * mo]]), '#f0ece2');   // lower canines
    });
    ink(MOUTH, 5);
  }
  taper(UP, 7.5);
  taper([[R[0] - 10, R[1] - 10], [R[0] + 6, R[1] - 4], [R[0] + 6, R[1] + 12]], 5);
  taper([[L[0] + 8, L[1] - 8], [L[0] - 6, L[1] - 2], [L[0] - 4, L[1] + 10]], 4);
  taper([[0, 52], [0, 66], [0, 78]], 4.5);
  form(W_NOSE, WF.nose, { lit: [-10, 10], dark: [10, 54], sh: .2, hi: .25, lw: 4 });
  fillP(ell(-10, 16, 13, 6, -.15), 'rgba(255,255,255,.55)'); fillP(ell(12, 13, 5, 3), 'rgba(255,255,255,.35)');
  for (const s of [-1, 1]) fillP(ell(s * 17, 38, 7.5, 4.5, s * .45), '#000');
}
function wolfGlowEyes(o) {
  for (const s of [-1, 1]) {
    g.save(); g.scale(s, 1); g.globalCompositeOperation = 'screen'; g.fillStyle = rg(47, -24, 0, 120, ['rgba(255,236,170,.45)', 'rgba(255,236,170,0)']); g.fillRect(-80, -150, 260, 260); g.restore();
    wolfEye(s, [0, 0], o.lid ?? .55, true, 0);
  }
}
// suit, shirt, collar, tie, lapels: everything above the table
const W_SUIT = sp([[0, 150], [70, 148], [150, 170], [216, 194], [252, 238], [266, 320], [272, 680, 1], [-272, 680, 1], [-266, 320], [-252, 238], [-216, 194], [-150, 170], [-70, 148]]);
const W_V = sp([[-64, 150, 1], [64, 150, 1], [26, 410, 1], [0, 440, 1], [-26, 410, 1]]);
const W_NECK = sp([[-58, 92], [58, 92], [62, 176], [-62, 176]]);
const W_COLLAR = [[0, 178, 1], [60, 148, 1], [70, 136], [78, 150, 1], [42, 218, 1], [16, 196]];
const W_KNOT = sp([[-20, 170], [20, 170], [15, 204], [-15, 204]]);
const W_TIE = sp([[-15, 204, 1], [15, 204, 1], [36, 390], [0, 432, 1], [-36, 390]]);
const W_LAPEL = [[64, 150, 1], [108, 168, 1], [134, 154, 1], [128, 200, 1], [166, 236, 1], [104, 330], [30, 430, 1]];
function wolfBody(o) {
  form(W_SUIT, WF.suit, { lit: [-60, 150], dark: [60, 650], sh: .55, hi: .18 });
  inside(W_SUIT, () => {
    for (let x = -280; x < 280; x += 22) taper([[x, 170], [x + 4, 420], [x, 680]], 1.6, 'rgba(255,255,255,.05)');      // a faint chalk stripe
    for (const s of [-1, 1]) { g.save(); g.scale(s, 1);
      taper([[210, 236], [170, 330], [110, 440]], 4, 'rgba(10,8,12,.75)'); taper([[236, 300], [200, 420], [150, 520]], 3.5, 'rgba(10,8,12,.6)');
      taper([[150, 172], [222, 210], [256, 300]], 4, 'rgba(255,250,240,.16)');
      g.restore(); }
  });
  form(W_V, WF.shirt, { lit: [0, 150], dark: [0, 440], sh: .3, hi: .1, lw: 5 });
  form(W_NECK, WF.furD, { lit: [0, 100], dark: [0, 176], sh: .5, hi: 0, lw: 0 });
  inside(W_NECK, () => fur(-60, 100, 60, 170, 16, 31, 18, 'rgba(30,28,34,.45)', () => [0, 1]));
  form(W_TIE, WF.tie, { lit: [-20, 210], dark: [20, 430], sh: .4, hi: .12, lw: 5 });
  inside(W_TIE, () => { for (let y = 180; y < 460; y += 26) { g.save(); g.translate(0, y); g.rotate(-.6); g.fillStyle = 'rgba(230,220,210,.22)'; g.fillRect(-60, 0, 120, 7); g.restore(); } });
  taper([[0, 210], [3, 236], [0, 262]], 3.5, 'rgba(10,8,10,.6)');
  form(W_KNOT, WF.tie, { lit: [0, 170], dark: [0, 204], sh: .35, lw: 5 });
  for (const s of [-1, 1]) {
    form(sp(s > 0 ? W_COLLAR : mir(W_COLLAR)), WF.shirt, { lit: [s * 30, 150], dark: [s * 40, 220], sh: .3, hi: .1, lw: 5 });
    const LP = sp(s > 0 ? W_LAPEL : mir(W_LAPEL));
    form(LP, WF.lap, { lit: [s * 120, 160], dark: [s * 60, 420], sh: .5, hi: .2, lw: 5.5 });
    g.save(); g.scale(s, 1); taper([[132, 158], [126, 200], [162, 236], [100, 336], [36, 426]], 3, 'rgba(255,250,240,.25)'); g.restore();
  }
  // pocket square on the wolf's left breast
  form(sp([[118, 300, 1], [130, 262, 1], [146, 284, 1], [162, 256, 1], [180, 300, 1]]), WF.shirt, { lit: [150, 260], dark: [150, 300], sh: .3, lw: 4 });
  taper([[108, 302], [148, 300], [190, 296]], 6);
  for (const y of [470, 560]) for (const x of [-40, 40]) { form(ell(x, y, 11, 11), '#24222a', { lit: [x - 4, y - 4], dark: [x + 4, y + 6], sh: .3, hi: .4, lw: 3 }); }
}
// arms resting on the table (drawn after the table so the forearms lie on it)
const W_ARM = [[216, 194], [260, 232], [286, 320], [284, 392], [244, 424], [150, 418], [118, 394], [130, 360], [210, 352], [226, 296]];
const W_CUFF = [[106, 370], [128, 356], [146, 410], [122, 422]];
const W_PAW = [[112, 362], [86, 352], [56, 358], [34, 374], [26, 394], [38, 412], [74, 420], [112, 414]];
function wolfArms(o) {
  for (const s of [-1, 1]) {
    g.save(); g.scale(s, 1);
    const A = sp(W_ARM);
    form(A, WF.suit, { lit: [250, 220], dark: [180, 420], sh: .55, hi: .15, lw: 6 });
    inside(A, () => { taper([[262, 330], [236, 360], [200, 372]], 4, 'rgba(8,6,10,.8)'); taper([[252, 380], [224, 396], [190, 398]], 3.5, 'rgba(8,6,10,.7)'); taper([[226, 210], [272, 260], [284, 340]], 4, 'rgba(255,250,240,.15)'); });
    form(sp(W_CUFF), WF.shirt, { lit: [120, 360], dark: [130, 420], sh: .3, lw: 4.5 });
    const P = sp(W_PAW);
    form(P, WF.fur, { lit: [80, 350], dark: [60, 420], sh: .45, hi: .2, lw: 6 });
    inside(P, () => fur(30, 356, 110, 400, 10, 41, 12, 'rgba(50,48,56,.4)', () => [-.8, .4]));
    for (let k = 0; k < 4; k++) { const x = 40 + k * 18; taper([[x + 8, 384], [x + 4, 400], [x, 414]], 3.5); fillP(poly([[x - 6, 414], [x - 1, 414], [x - 10, 426]]), '#1a1618'); }
    g.restore();
  }
}
// the raised right arm with one finger up: "watch this"
function wolfFinger(u) {
  const e = eo(u), hx = lerp(150, 196, e), hy = lerp(390, 40, e), ex = 300, ey = 330;
  g.lineCap = 'round';
  for (const [w, c] of [[74 + 12 * LW, OL], [74, WF.suit]]) { g.beginPath(); g.moveTo(236, 220); g.quadraticCurveTo(300, 270, ex, ey); g.lineTo(hx + 8, hy + 70); g.lineWidth = w; g.strokeStyle = c; g.stroke(); }
  taper([[236, 230], [290, 280], [300, 330]], 5, 'rgba(255,250,240,.15)');
  taper([[288, 330], [250, 230 + 100 * (1 - e)], [hx + 30, hy + 110]], 4, 'rgba(8,6,10,.7)');
  g.save(); g.translate(hx, hy); g.rotate(lerp(-.9, -.08, e));
  form(sp([[-36, 60], [34, 56], [40, 84], [-34, 90]]), WF.shirt, { lit: [0, 60], dark: [0, 90], sh: .3, lw: 4.5 });
  const FIST = sp([[-36, -10], [-22, -32], [22, -32], [40, -8], [38, 26], [18, 46], [-20, 46], [-40, 22]]);
  const FING = sp([[-18, -28], [-16, -100], [-6, -114], [8, -104], [10, -30]]);
  form(FING, WF.fur, { lit: [-10, -110], dark: [6, -30], sh: .4, lw: 5.5 });
  fillP(poly([[-10, -110], [2, -110], [-4, -126]]), '#1a1618'); taper([[-12, -70], [-2, -66], [6, -70]], 3);
  form(FIST, WF.fur, { lit: [-20, -30], dark: [20, 46], sh: .45, hi: .2, lw: 6 });
  for (const y of [-6, 12, 30]) taper([[-34, y], [0, y + 4], [34, y]], 3.5);
  form(sp([[-40, -2], [-50, -26], [-32, -38], [-14, -26]]), WF.fur, { lit: [-40, -30], dark: [-20, 0], sh: .3, lw: 5 });
  g.restore();
}
function wolf(o) {
  g.save(); g.translate(o.x, o.y); g.scale(o.s, o.s);
  if (o.eyesOnly) { g.rotate(o.tilt || 0); wolfGlowEyes(o); g.restore(); return; }
  wolfBody(o);
  g.save(); g.rotate(o.tilt || 0); wolfHead(o); g.restore();
  if (o.finger) wolfFinger(o.finger);
  g.restore();
}
function wolfOnTable(o) { g.save(); g.translate(o.x, o.y); g.scale(o.s, o.s); wolfArms(o); g.restore(); }

// ================= THE PIG =================
// Round and soft, worried brows, a snout like a little drum, floppy ears; bowler hat, wing collar, bow tie, a pinstripe waistcoat and a watch chain.
const PG = { skin: '#dcc9c2', skinD: '#b49a94', snout: '#ecdcd5', ear: '#bfa29c', shirt: '#ebe7df', hat: '#2c282c', band: '#56505a', vest: '#6e6862', bow: '#2c282c' };
const P_HEAD = sp(sym([[0, -98], [54, -94], [90, -64], [104, -18], [108, 30], [98, 70], [72, 100], [36, 116], [0, 120]]));
const P_EAR = sp([[40, -80], [80, -108], [126, -100, 1], [116, -64], [96, -50]]);
const P_EARIN = sp([[56, -82], [84, -100], [114, -96, 1], [106, -68], [90, -60]]);
const P_FLAP = sp([[126, -100, 1], [140, -72], [134, -44, 1], [116, -64]]);
const P_TORSO = sp([[0, 106], [80, 104], [160, 140], [214, 220], [234, 330], [240, 640, 1], [-240, 640, 1], [-234, 330], [-214, 220], [-160, 140], [-80, 104]]);
const P_VEST = sp([[-80, 126, 1], [-30, 126], [0, 236, 1], [30, 126], [80, 126, 1], [170, 152], [214, 234], [232, 640, 1], [-232, 640, 1], [-214, 234], [-170, 152]]);
const P_BRIM = sp([[-122, -64, 1], [-104, -80], [0, -88], [104, -80], [122, -64, 1], [108, -56], [0, -62], [-108, -56]]);
const P_CROWN = sp([[-74, -78, 1], [-78, -120], [-58, -160], [0, -174], [58, -160], [78, -120], [74, -78, 1]]);
function pigHead(o) {
  const m = o.mouth ?? 0, lk = o.look || [.5, -.1], wr = o.worry ?? 1;
  for (const s of [-1, 1]) { g.save(); g.scale(s, 1);
    form(P_EAR, PG.skin, { lit: [70, -120], dark: [100, -60], sh: .35, lw: 6 });
    form(P_EARIN, PG.ear, { lit: [100, -120], dark: [70, -70], sh: .35, hi: .05, lw: 0 });
    form(P_FLAP, PG.skinD, { lit: [110, -130], dark: [120, -80], sh: .3, lw: 5 });
    g.restore(); }
  form(P_HEAD, PG.skin, { lit: [-30, -80], dark: [30, 120], sh: .45, hi: .28, lw: 6.5 });
  inside(P_HEAD, () => {
    for (const s of [-1, 1]) { g.fillStyle = rg(s * 64, 40, 0, 40, ['rgba(150,90,90,.3)', 'rgba(150,90,90,0)']); g.fillRect(s * 64 - 40, 0, 80, 80); }
    shade(P_HEAD, ell(-6, -66, 120, 30), .45, 8);                     // the hat brim's shadow on the forehead
  });
  taper([[-46, 106], [0, 118], [46, 106]], 3.5, 'rgba(40,24,28,.5)');
  for (const s of [-1, 1]) {                                          // eyes, wide and worried
    const ex = s * 40, ey = -30;
    form(ell(ex, ey, 21, o.blink ? 3 : 27), '#f4f1ea', { lit: [ex, ey - 20], dark: [ex, ey + 26], sh: .2, hi: 0, lw: 4 });
    if (!o.blink) inside(ell(ex, ey, 21, 27), () => {
      g.fillStyle = lg(0, ey - 27, 0, ey - 8, ['rgba(60,50,60,.4)', 'rgba(60,50,60,0)']); g.fillRect(ex - 30, ey - 30, 60, 30);
      const ix = ex + lk[0] * 9, iy = ey + 2 + lk[1] * 10;
      g.fillStyle = rg(ix - 3, iy - 3, 2, 12, ['#8a8282', '#5a5254', '#2e2a2c']); g.fill(ell(ix, iy, 11.5, 12.5)); ink(ell(ix, iy, 11.5, 12.5), 2);
      fillP(ell(ix, iy, 6, 6.5), '#0c0a0c'); fillP(ell(ix - 4, iy - 5, 3.4, 3.4), '#fff'); fillP(ell(ix + 4, iy + 4, 1.4, 1.4), '#fff');
    });
    taper([[ex - s * 22, ey - 12], [ex, ey - 30], [ex + s * 22, ey - 14]], 5);
    taper([[ex + s * 18, ey - 22], [ex + s * 26, ey - 30], [ex + s * 28, ey - 26]], 3, OL, 1);
    taper([[ex - s * 14, ey + 30], [ex, ey + 35], [ex + s * 16, ey + 30]], 2.6, 'rgba(40,24,28,.5)');
    taper([[s * 70, -70], [s * 44, -72 - 6 * wr], [s * 16, -66 - 16 * wr]], 10, '#5a4a4c');
  }
  taper([[-26, -6], [0, -12], [26, -6]], 3, 'rgba(40,24,28,.45)'); taper([[-20, 2], [0, -2], [20, 2]], 2.5, 'rgba(40,24,28,.35)');
  form(ell(0, 32, 50, 38), PG.skinD, { lit: [0, 10], dark: [0, 70], sh: .35, hi: 0, lw: 5 });   // the drum of the snout
  form(ell(0, 22, 44, 31), PG.snout, { lit: [-14, 4], dark: [10, 50], sh: .25, hi: .35, lw: 5 });
  for (const s of [-1, 1]) { form(ell(s * 15, 23, 7.5, 12, s * .25), '#3a2628', { lit: [s * 15, 14], dark: [s * 15, 34], sh: .2, hi: .1, lw: 2.5 }); }
  fillP(ell(-12, 8, 14, 5, -.2), 'rgba(255,255,255,.45)');
  if (m > .04) {
    const MO = ell(0, 86, 14 + 7 * m, 5 + 15 * m);
    fillP(MO, '#2a1618'); inside(MO, () => fillP(ell(0, 96 + 12 * m, 14, 8 + 6 * m), '#8a5a5c')); ink(MO, 4.5);
  } else taper([[-24, 84], [-10, 80], [6, 84], [22, 80]], 5);
  if (o.sweat) { const sy = -60 + 18 * (o.sweat % 1); form(sp([[96, sy - 22, 1], [106, sy], [96, sy + 10], [86, sy]]), '#f0f4f8', { lit: [92, sy - 8], dark: [100, sy + 8], sh: .25, hi: .5, lw: 3.5 }); }
  g.save(); g.rotate(-.08);                                           // the bowler
  form(P_CROWN, PG.hat, { lit: [-30, -160], dark: [40, -80], sh: .5, hi: .25, lw: 6 });
  inside(P_CROWN, () => { form(poly([[-90, -100], [90, -100], [90, -80], [-90, -80]]), PG.band, { lit: [0, -100], dark: [0, -80], sh: .3, lw: 0 });
    taper([[-50, -150], [-62, -128], [-60, -108]], 7, 'rgba(255,250,240,.3)'); });
  form(sp([[54, -96], [72, -106], [76, -92], [72, -82], [54, -88]]), PG.band, { lit: [60, -104], dark: [70, -84], sh: .3, lw: 3.5 });
  form(P_BRIM, PG.hat, { lit: [-40, -88], dark: [40, -56], sh: .45, hi: .2, lw: 6 });
  taper([[-100, -76], [0, -84], [100, -76]], 3, 'rgba(255,250,240,.2)');
  g.restore();
}
function pigBody(o) {
  form(P_TORSO, PG.shirt, { lit: [-40, 120], dark: [60, 600], sh: .45, hi: .15 });
  form(P_VEST, PG.vest, { lit: [-60, 140], dark: [60, 600], sh: .5, hi: .2 });
  inside(P_VEST, () => { for (let x = -240; x < 240; x += 18) taper([[x, 130], [x + 2, 400], [x, 640]], 1.6, 'rgba(255,250,240,.12)');
    taper([[-160, 170], [-120, 300], [-60, 420]], 3.5, 'rgba(10,8,10,.6)'); taper([[160, 170], [120, 300], [60, 420]], 3.5, 'rgba(10,8,10,.6)'); });
  for (const s of [-1, 1]) taper([[s * 150, 330], [s * 110, 334], [s * 70, 330]], 5);
  for (const y of [272, 324, 376]) form(ell(0, y, 9, 9), '#d8d2c6', { lit: [-3, y - 3], dark: [3, y + 4], sh: .3, hi: .4, lw: 3 });
  for (let k = 0; k <= 14; k++) { const u = k / 14, x = lerp(-120, 0, u), y = 332 + Math.sin(u * Math.PI) * 40; fillP(ell(x, y, 4, 3), k % 2 ? '#c8c0b4' : '#e8e2d6'); }
  for (const s of [-1, 1]) {                                           // wing collar and the bow tie
    form(sp(s > 0 ? [[0, 128, 1], [52, 104, 1], [66, 116], [30, 150, 1]] : [[0, 128, 1], [-52, 104, 1], [-66, 116], [-30, 150, 1]]), PG.shirt, { lit: [s * 30, 104], dark: [s * 30, 150], sh: .3, lw: 4.5 });
    const BW = sp(s > 0 ? [[6, 124, 1], [48, 100], [58, 126], [48, 152], [6, 132, 1]] : [[-6, 124, 1], [-48, 100], [-58, 126], [-48, 152], [-6, 132, 1]]);
    form(BW, PG.bow, { lit: [s * 30, 100], dark: [s * 30, 150], sh: .35, hi: .25, lw: 4.5 });
    taper([[s * 14, 124], [s * 32, 118], [s * 48, 110]], 2.5, 'rgba(255,250,240,.3)'); taper([[s * 14, 132], [s * 32, 138], [s * 46, 146]], 2.5, 'rgba(255,250,240,.2)');
  }
  form(ell(0, 128, 11, 13), PG.bow, { lit: [-3, 120], dark: [3, 138], sh: .3, hi: .3, lw: 4 });
}
const P_ARM = [[170, 262], [204, 290], [222, 340], [220, 384], [190, 410], [120, 412], [96, 388], [116, 360], [176, 352], [182, 300]];
const P_HAND = [[108, 360], [80, 352], [52, 360], [36, 380], [40, 404], [70, 418], [106, 412], [118, 390]];
function pigArms(o) {
  for (const s of [-1, 1]) { g.save(); g.scale(s, 1);
    const A = sp(P_ARM); form(A, PG.shirt, { lit: [200, 180], dark: [150, 410], sh: .4, hi: .15, lw: 6 });
    inside(A, () => { taper([[220, 300], [200, 340], [160, 356]], 3.5, 'rgba(20,16,20,.5)'); taper([[214, 360], [180, 386], [140, 392]], 3, 'rgba(20,16,20,.45)'); });
    const HND = sp(P_HAND); form(HND, PG.skin, { lit: [80, 350], dark: [80, 418], sh: .4, hi: .25, lw: 6 });
    for (let k = 0; k < 3; k++) taper([[50 + k * 18, 396], [48 + k * 18, 406], [46 + k * 18, 416]], 3.5);
    g.restore(); }
}
function pig(o) {
  g.save(); g.translate(o.x, o.y); g.scale(o.s, o.s);
  pigBody(o); g.save(); g.rotate(o.tilt || 0); pigHead(o); g.restore();
  g.restore();
}
function pigOnTable(o) { g.save(); g.translate(o.x, o.y + 6); g.scale(o.s, o.s); g.translate(0, -112); pigArms(o); g.restore(); }

// ================= THE ROOM =================
// Damask wallpaper over raised wainscot panels, a window with venetian blinds throwing moonlit bars, a dresser with a cathedral radio,
// an oval portrait, a lamp on a chain over a lace tablecloth with two cups of coffee, an ashtray and a burning cigarette.
function room(t, o = {}) {
  g.fillStyle = g.createPattern(PAPERED, 'repeat'); g.fillRect(-700, -900, W + 1400, 1700);
  g.fillStyle = lg(0, -900, 0, 790, ['rgba(0,0,0,.35)', 'rgba(0,0,0,0)']); g.fillRect(-700, -900, W + 1400, 1700);
  // the window on the left: frame, sill, blinds, moonlight
  const WIN = poly([[-260, 170], [140, 170], [140, 700], [-260, 700]]);
  fillP(WIN, '#2c3038'); inside(WIN, () => { g.fillStyle = rg(-60, 300, 20, 400, ['#9aa0aa', '#3a3e48']); g.fillRect(-260, 170, 400, 530);
    for (let y = 186; y < 700; y += 26) { form(poly([[-262, y], [142, y], [142, y + 16], [-262, y + 16]]), '#bdb8ae', { lit: [0, y], dark: [0, y + 16], sh: .35, hi: .2, lw: 2.5 }); } });
  form(poly([[-280, 150], [160, 150], [160, 170], [-280, 170]]), '#4a4038', { lit: [0, 150], dark: [0, 170], sh: .3, lw: 4 });
  form(poly([[-290, 700], [170, 700], [180, 726], [-300, 726]]), '#5a4e44', { lit: [0, 700], dark: [0, 726], sh: .35, hi: .2, lw: 4 });
  ink(WIN, 7); taper([[-60, 170], [-60, 700]], 8, '#2a2420');
  // moonlit bars from the blinds across the wall
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .16; g.beginPath(); g.rect(140, 110, 900, 660); g.clip();
  for (let i = 0; i < 10; i++) { g.save(); g.transform(1, .4, 0, 1, 0, 0); g.fillStyle = '#d0d8e8'; g.fillRect(150, 120 + i * 50 - 60, 620, 22); g.restore(); } g.restore();
  // the oval portrait
  form(ell(360, 440, 96, 124), '#3a3029', { lit: [320, 330], dark: [400, 560], sh: .45, hi: .25, lw: 6 });
  form(ell(360, 440, 74, 100), '#a8a094', { lit: [340, 380], dark: [380, 520], sh: .35, hi: .2, lw: 4 });
  inside(ell(360, 440, 74, 100), () => { form(sp([[300, 560], [310, 470], [340, 440], [334, 400], [350, 366], [380, 370], [392, 410], [384, 446], [412, 470], [424, 560]]), '#5a524c', { lit: [340, 380], dark: [380, 540], sh: .3, hi: .1, lw: 0 }); });
  // picture rail, chair rail, wainscot with raised panels
  form(poly([[-700, 92], [W + 700, 92], [W + 700, 108], [-700, 108]]), '#4e443c', { lit: [0, 92], dark: [0, 108], sh: .3, lw: 3 });
  form(poly([[-700, 770], [W + 700, 770], [W + 700, 800], [-700, 800]]), '#564a40', { lit: [0, 770], dark: [0, 800], sh: .4, hi: .25, lw: 4 });
  g.fillStyle = '#4a4038'; g.fillRect(-700, 800, W + 1400, 460);
  for (let x = -660; x < W + 660; x += 200) {
    const PN = poly([[x, 840], [x + 160, 840], [x + 160, 1210], [x, 1210]]);
    form(PN, '#52473e', { lit: [x, 840], dark: [x + 160, 1210], sh: .35, hi: .12, lw: 0 });
    taper([[x, 840], [x + 80, 840], [x + 160, 840]], 4, 'rgba(255,240,220,.18)'); taper([[x, 840], [x, 1020], [x, 1210]], 4, 'rgba(255,240,220,.12)');
    taper([[x + 160, 840], [x + 160, 1020], [x + 160, 1210]], 5, 'rgba(0,0,0,.45)'); taper([[x, 1210], [x + 80, 1210], [x + 160, 1210]], 5, 'rgba(0,0,0,.45)');
  }
  // dresser with a cathedral radio and a vase
  const DR = poly([[620, 760], [1180, 760], [1180, 1260], [620, 1260]]);
  form(DR, '#5c4e44', { lit: [700, 760], dark: [1100, 1260], sh: .45, hi: .18, lw: 6 });
  form(poly([[600, 730], [1200, 730], [1200, 764], [600, 764]]), '#6a5a4e', { lit: [0, 730], dark: [0, 764], sh: .35, hi: .3, lw: 5 });
  for (let k = 0; k < 3; k++) { const y = 790 + k * 150, D = poly([[650, y], [1150, y], [1150, y + 128], [650, y + 128]]);
    form(D, '#64554a', { lit: [700, y], dark: [1100, y + 128], sh: .35, hi: .15, lw: 4 });
    for (const x of [780, 1020]) { form(sp([[x - 30, y + 56], [x - 20, y + 48], [x + 20, y + 48], [x + 30, y + 56], [x + 20, y + 70], [x - 20, y + 70]]), '#c8b892', { lit: [x - 10, y + 48], dark: [x + 10, y + 70], sh: .35, hi: .5, lw: 3 }); } }
  const RAD = sp([[700, 730, 1], [700, 600], [730, 548], [790, 524], [850, 548], [880, 600], [880, 730, 1]]);
  form(RAD, '#6a5848', { lit: [740, 540], dark: [860, 730], sh: .45, hi: .3, lw: 5 });
  const GRL = sp([[730, 690, 1], [730, 612], [756, 572], [790, 560], [824, 572], [850, 612], [850, 690, 1]]);
  form(GRL, '#b8ab98', { lit: [770, 570], dark: [820, 690], sh: .35, lw: 3.5 });
  inside(GRL, () => { for (let x = 740; x < 850; x += 16) taper([[x, 560], [x, 630], [x, 700]], 3.5, 'rgba(60,46,36,.6)'); });
  for (const x of [756, 790, 824]) form(ell(x, 712, 8, 8), '#2a2420', { lit: [x - 3, 708], dark: [x + 3, 716], sh: .2, hi: .4, lw: 2 });
  form(sp([[1090, 730, 1], [1070, 690], [1080, 640], [1100, 610], [1120, 640], [1130, 690], [1110, 730, 1]]), '#d8d2c6', { lit: [1085, 640], dark: [1120, 720], sh: .4, hi: .35, lw: 4.5 });
  taper([[1100, 612], [1104, 560], [1096, 520]], 4); taper([[1100, 600], [1130, 560], [1150, 540]], 3.5);
  for (const [x, y, r] of [[1096, 506, 22], [1152, 530, 16]]) form(ell(x, y, r, r * .85), '#a49c90', { lit: [x - 6, y - 6], dark: [x + 6, y + 8], sh: .35, hi: .3, lw: 3.5 });
  // floor: checker board in perspective with a polish
  const fy = 1250, vy = 300;
  g.fillStyle = '#d8d2c6'; g.fillRect(-700, fy, W + 1400, 900);
  for (let r = 0; r < 9; r++) {
    const y0 = fy + Math.pow(r / 9, 1.6) * 760, y1 = fy + Math.pow((r + 1) / 9, 1.6) * 760;
    for (let c = -12; c < 12; c++) if ((r + c) % 2 === 0) { const X = (y, cc) => 540 + cc * 110 * (y - vy) / (fy - vy); fillP(poly([[X(y0, c), y0], [X(y0, c + 1), y0], [X(y1, c + 1), y1], [X(y1, c), y1]]), '#2e2a28'); }
  }
  g.fillStyle = lg(0, fy, 0, fy + 700, ['rgba(0,0,0,.5)', 'rgba(0,0,0,0)']); g.fillRect(-700, fy, W + 1400, 700);
  form(poly([[-700, 1236], [W + 700, 1236], [W + 700, 1256], [-700, 1256]]), '#3a322c', { lit: [0, 1236], dark: [0, 1256], sh: .3, lw: 3 });
}
// the characters' shadows thrown on the wall behind them by the lamp
function castShadows(t, chars) {
  g.save(); g.filter = `blur(${Math.round(14 * LW)}px)`; g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(30,24,28,.45)';
  for (const c of chars) { g.save(); g.translate(c.x + (c.x - lampAt(t)[0]) * .18, c.y - 30); g.scale(c.s * 1.12, c.s * 1.12);
    if (c.kind === 'wolf') { g.fill(W_HEAD); g.fill(W_EAR); g.save(); g.scale(-1, 1); g.fill(W_EAR); g.restore(); g.fill(W_SUIT); }
    else { g.fill(P_HEAD); g.fill(P_CROWN); g.fill(P_BRIM); g.fill(P_TORSO); }
    g.restore(); }
  g.restore();
}
function lampAt(t) { return [540 + Math.sin(t * 1.3) * 10, 250]; }
function lamp(t) {
  const [x, y] = lampAt(t);
  for (let k = 0; k < 30; k++) { const yy = lerp(-700, y - 92, k / 30), xx = lerp(540, x, k / 30); g.lineWidth = 4 * LW; g.strokeStyle = OL; g.stroke(ell(xx, yy, 5, 9)); }
  const SH = sp([[x - 40, y - 92, 1], [x + 40, y - 92, 1], [x + 64, y - 70], [x + 150, y, 1], [x - 150, y, 1], [x - 64, y - 70]]);
  form(SH, '#3e3834', { lit: [x - 60, y - 90], dark: [x + 80, y], sh: .5, hi: .35, lw: 6 });
  taper([[x - 50, y - 80], [x - 100, y - 40], [x - 136, y - 6]], 4, 'rgba(255,250,240,.35)');
  form(ell(x, y - 98, 20, 10), '#2a2420', { lit: [x, y - 104], dark: [x, y - 90], sh: .3, lw: 4 });
  fillP(ell(x, y, 150, 20), '#fbf3dc'); ink(ell(x, y, 150, 20), 6);
  fillP(ell(x, y + 12, 36, 24), '#fffcee');
}
function lampLight(t, k = 1) {                                  // the room goes dark except the warm cone; moonlit bars from the blinds
  const [x, y] = lampAt(t);
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = rg(x, y + 640, 120, 1300, ['rgba(255,255,255,1)', 'rgba(150,140,130,1)', 'rgba(36,32,32,1)']); g.fillRect(-2000, -2000, W + 4000, H + 4000);
  g.globalCompositeOperation = 'screen';
  g.globalAlpha = .12 * k; g.fillStyle = lg(0, y, 0, 1450, ['rgba(255,236,190,.9)', 'rgba(255,236,190,0)']); g.fill(poly([[x - 140, y], [x + 140, y], [x + 560, 1450], [x - 560, 1450]]));
  g.globalAlpha = .55 * k; g.fillStyle = rg(x, y + 10, 0, 280, ['rgba(255,240,200,.9)', 'rgba(255,240,200,0)']); g.fillRect(x - 300, y - 300, 600, 600);
  g.globalAlpha = 1; for (let i = 0; i < 24; i++) { const p = (hash(i * 3.1) + t * .03 * (1 + hash(i))) % 1, mx = x + (hash(i * 7.3) - .5) * 600 * p, my = lerp(y + 40, 1300, p);
    g.fillStyle = `rgba(255,240,210,${.5 * Math.sin(Math.PI * p) * (.5 + .5 * Math.sin(t * 2 + i))})`; g.fill(ell(mx, my, 2.2, 2.2)); }
  g.restore();
}
function table(t, mag = true) {
  const TOP = ell(540, 1180, 600, 64), DRAPE = sp([[-60, 1180, 1], [1140, 1180, 1], [1170, 1580, 1], [-90, 1580, 1]]);
  form(DRAPE, '#e8e2d6', { lit: [540, 1180], dark: [540, 1580], sh: .45, hi: .1, lw: 6 });
  inside(DRAPE, () => { for (let k = 0; k < 10; k++) { const x = -20 + k * 122; taper([[x, 1240], [x + 16, 1400], [x - 6, 1570]], 6, 'rgba(40,32,36,.35)'); taper([[x + 30, 1250], [x + 44, 1400], [x + 26, 1570]], 4, 'rgba(255,250,240,.35)'); }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-100, 1180, 1300, 70); });
  for (let x = -80; x < 1160; x += 44) { form(sp([[x, 1572], [x + 22, 1600], [x + 44, 1572]], false), '#f0ece2', { lit: [x + 22, 1572], dark: [x + 22, 1600], sh: .25, hi: 0, lw: 3 }); fillP(ell(x + 22, 1584, 5, 5), '#8a8478'); }
  form(TOP, '#f1ece2', { lit: [540, 1130], dark: [540, 1250], sh: .2, hi: .2, lw: 6 });
  inside(TOP, () => { taper([[0, 1180], [540, 1130], [1080, 1180]], 3, 'rgba(60,50,50,.2)'); });
  if (mag) {                                                     // the magazine with the ring ad, open on the table
    g.save(); g.translate(500, 1182); g.transform(1, 0, -.35, .3, 0, 0);
    form(poly([[-190, -150], [190, -150], [190, 150], [-190, 150]]), '#ece3cf', { lit: [0, -150], dark: [0, 150], sh: .2, lw: 5 });
    taper([[0, -150], [0, 0], [0, 150]], 3, 'rgba(0,0,0,.4)');
    g.fillStyle = '#3a3634'; g.fillRect(30, -120, 130, 22); g.fillRect(-160, -120, 140, 10); for (let k = 0; k < 8; k++) g.fillRect(-160, -90 + k * 26, 140, 6);
    g.lineWidth = 10; g.strokeStyle = '#8a8680'; g.stroke(ell(95, 20, 50, 50)); fillP(poly([[75, -40], [115, -40], [95, -10]]), '#f6f6f2');
    g.restore();
  }
  cup(330, 1156, t, 0); cup(840, 1160, t, 1.7);
  form(ell(600, 1200, 46, 13), '#bab4aa', { lit: [700, 1186], dark: [720, 1206], sh: .35, hi: .4, lw: 4 }); fillP(ell(600, 1198, 30, 7), '#4a4440');   // ashtray
  g.save(); g.translate(612, 1190); g.rotate(-.25); form(poly([[0, -5], [70, -5], [70, 5], [0, 5]]), '#f2eee6', { lit: [30, -5], dark: [30, 5], sh: .3, lw: 3 }); fillP(poly([[70, -5], [80, -5], [80, 5], [70, 5]]), '#5a4a44'); fillP(ell(81, 0, 3, 4), 'rgba(255,220,160,.9)'); g.restore();
  smoke(690, 1170, t);
}
function cup(x, y, t, seed) {
  form(sp([[x - 52, y + 18], [x + 52, y + 18], [x + 64, y + 28], [x, y + 36], [x - 64, y + 28]]), '#ece8e0', { lit: [x, y + 18], dark: [x, y + 36], sh: .3, lw: 4 });
  const C = sp([[x - 40, y - 34, 1], [x + 40, y - 34, 1], [x + 34, y + 6], [x + 20, y + 22], [x - 20, y + 22], [x - 34, y + 6]]);
  g.lineWidth = 11 * LW; g.strokeStyle = OL; g.stroke(ell(x + 44, y - 10, 15, 14)); g.lineWidth = 6 * LW; g.strokeStyle = '#ece8e0'; g.stroke(ell(x + 44, y - 10, 15, 14));
  form(C, '#ece8e0', { lit: [x - 20, y - 30], dark: [x + 30, y + 20], sh: .35, hi: .4, lw: 5 });
  fillP(ell(x, y - 34, 40, 9), '#2c2422'); ink(ell(x, y - 34, 40, 9), 4);
  for (let k = 0; k < 2; k++) { const ph = t * 1.4 + seed + k * 2; g.save(); g.globalAlpha = .35; taper([[x - 8 + k * 14, y - 44], [x + Math.sin(ph) * 14, y - 80], [x + Math.sin(ph + 1.5) * 18, y - 120], [x + Math.sin(ph + 3) * 12, y - 160]], 7, '#f8f4ec'); g.restore(); }
}
function smoke(x, y, t) {
  g.save(); g.globalAlpha = .35;
  const pts = []; for (let k = 0; k < 9; k++) pts.push([x + Math.sin(t * 1.1 + k * .7) * (6 + k * 5) + k * 6, y - k * 46]);
  taper(pts, 7, '#f0ece4'); g.globalAlpha = .2; taper(pts.map(([a, b], i) => [a + 10 + Math.sin(t + i) * 6, b - 20]), 12, '#f0ece4'); g.restore();
}

// ---------- the shots ----------
const P1 = LN.p1.t0 - .05, W2 = LN.w2.t0 - .05, AD = wordT('w2', 'a') - .02, W3 = LN.w3.t0 - .05, ECU = wordT('w3', 'ever') - .05, DARK = LN.w3.t1 + .05;
const FOUR = wordT('w2', 'four');
const SHOTS = [
  [0, P1, twoShot], [P1, W2, pigClose], [W2, AD, wolfFinger1947], [AD, W3, adPage], [W3, ECU, coinStacks], [ECU, DARK, wolfECU], [DARK, 99, eyesInDark],
];
function wolfAt(t, o = {}) { return { kind: 'wolf', x: 810, y: 690, s: 1.2, t, mouth: mouth('WOLF', t), blink: blink(t, 3), lid: .5, look: [-.6, .15], ...o }; }
function pigAt(t, o = {}) { return { kind: 'pig', x: 255, y: 900, s: 1.02, t, mouth: mouth('PIG', t), blink: blink(t, 9), look: [.7, -.25], ...o }; }
function scene(t, wo = {}, po = {}, opt = {}) {
  room(t); const W_ = wolfAt(t, wo), P_ = pigAt(t, po);
  castShadows(t, [W_, P_]); lamp(t);
  pig(P_); wolf(W_);
  table(t, opt.mag !== false); pigOnTable(P_); if (!W_.finger) wolfOnTable(W_);
  else { g.save(); g.translate(W_.x, W_.y); g.scale(W_.s, W_.s); g.scale(-1, 1); g.translate(0, 0); wolfArmsOne(); g.restore(); }
  lampLight(t);
}
function wolfArmsOne() { const s0 = 1; g.save(); g.scale(s0, 1); /* the left arm stays on the table */
  const A = sp(W_ARM); form(A, WF.suit, { lit: [250, 220], dark: [180, 420], sh: .55, hi: .15, lw: 6 }); form(sp(W_CUFF), WF.shirt, { lit: [120, 360], dark: [130, 420], sh: .3, lw: 4.5 });
  const P = sp(W_PAW); form(P, WF.fur, { lit: [80, 350], dark: [60, 420], sh: .45, hi: .2, lw: 6 });
  for (let k = 0; k < 4; k++) { const x = 40 + k * 18; taper([[x + 8, 384], [x + 4, 400], [x, 414]], 3.5); fillP(poly([[x - 6, 414], [x - 1, 414], [x - 10, 426]]), '#1a1618'); }
  g.restore(); }

function twoShot(t, u) {                                         // the two of them at the table, slow push-in toward the wolf
  cam(lerp(540, 590, ss(u)), lerp(930, 880, ss(u)), lerp(1.2, 1.3, ss(u)));
  scene(t, { tilt: Math.sin(t * 2) * .02 });
}
function pigClose(t, u) {                                        // over the wolf's shoulder onto the pig: "Says who?"
  cam(330, 900, lerp(2.0, 2.1, u));
  scene(t, {}, { worry: 1.4, look: [.9, -.3], tilt: -.05, sweat: u * 1.2 });
}
function wolfFinger1947(t, u) {                                  // the wolf raises one finger: "In 1947..."
  cam(lerp(780, 800, u), lerp(800, 760, u), lerp(1.6, 1.72, ss(u)));
  scene(t, { finger: eo(seg(t, W2, W2 + .45)), look: [-.2, -.4], brow: 1.5, lid: .42 });
}
function adPage(t, u) {                                          // the 1947 ad: a ring, then four words slam in
  reset(); g.fillStyle = '#1a1714'; g.fillRect(0, 0, W, H);
  cam(540, 960, lerp(1.0, 1.1, ss(u)), lerp(-.025, -.01, u));
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.drawImage(PAPER, 90, 210); g.restore();
  g.lineWidth = 5; g.strokeStyle = '#2a2622'; g.strokeRect(130, 250, 820, 1420); g.lineWidth = 2; g.strokeRect(146, 266, 788, 1388);
  for (const [cx, cy, sx, sy] of [[146, 266, 1, 1], [934, 266, -1, 1], [146, 1654, 1, -1], [934, 1654, -1, -1]]) {   // deco corners
    g.save(); g.translate(cx, cy); g.scale(sx, sy); for (let k = 0; k < 3; k++) taper([[10 + k * 12, 70 - k * 8], [10 + k * 12, 10 + k * 12], [70 - k * 8, 10 + k * 12]], 4, '#2a2622'); fillP(ell(20, 20, 6, 6), '#2a2622'); g.restore(); }
  text('THE WEEKLY  ·  MAY 1947  ·  TEN CENTS', 540, 320, 34, '#2a2622', 'Crimson');
  taper([[180, 350], [540, 350], [900, 350]], 4, '#2a2622');
  // a sunburst behind the stone
  g.save(); g.translate(540, 720); for (let k = 0; k < 36; k++) { g.rotate(TAU / 36); if (k % 2) fillP(poly([[0, 0], [-26, -460], [26, -460]]), 'rgba(60,50,40,.08)'); } g.restore();
  g.fillStyle = rg(540, 740, 0, 380, ['rgba(255,255,255,.9)', 'rgba(255,255,255,0)']); g.fillRect(140, 380, 800, 760);
  // the ring: band in perspective with a polished highlight, prongs, a cut stone
  g.lineWidth = 40; g.strokeStyle = OL; g.stroke(ell(540, 900, 190, 70)); g.lineWidth = 28; g.strokeStyle = lg(350, 0, 730, 0, ['#6a665e', '#d8d2c6', '#8a857c', '#f4f0e8', '#5a5650']); g.stroke(ell(540, 900, 190, 70));
  g.beginPath(); g.ellipse(540, 900, 190, 70, 0, .3, 2.8); g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,.8)'; g.stroke();
  form(sp([[470, 830, 1], [610, 830, 1], [588, 858], [492, 858]]), '#a8a29a', { lit: [500, 830], dark: [580, 858], sh: .4, hi: .4, lw: 5 });
  for (const x of [-56, -20, 20, 56]) form(sp([[540 + x - 8, 840, 1], [540 + x + 8, 840, 1], [540 + x * 1.2 + 4, 770, 1], [540 + x * 1.2 - 4, 770, 1]]), '#c8c2b8', { lit: [540 + x, 770], dark: [540 + x, 840], sh: .3, hi: .3, lw: 3.5 });
  const cx = 540, cy = 720, F = [[cx - 130, cy], [cx - 80, cy - 64], [cx - 26, cy - 64], [cx + 26, cy - 64], [cx + 80, cy - 64], [cx + 130, cy], [cx, cy + 140]];
  const facets = [[[cx - 130, cy], [cx - 80, cy - 64], [cx - 44, cy]], [[cx - 80, cy - 64], [cx - 26, cy - 64], [cx - 44, cy]], [[cx - 26, cy - 64], [cx + 26, cy - 64], [cx, cy]], [[cx - 26, cy - 64], [cx, cy], [cx - 44, cy]],
    [[cx + 26, cy - 64], [cx + 80, cy - 64], [cx + 44, cy]], [[cx + 26, cy - 64], [cx, cy], [cx + 44, cy]], [[cx + 80, cy - 64], [cx + 130, cy], [cx + 44, cy]],
    [[cx - 130, cy], [cx - 44, cy], [cx, cy + 140]], [[cx - 44, cy], [cx, cy], [cx, cy + 140]], [[cx, cy], [cx + 44, cy], [cx, cy + 140]], [[cx + 44, cy], [cx + 130, cy], [cx, cy + 140]]];
  const tones = ['#f8f8f4', '#d8d6d0', '#ffffff', '#c4c2bc', '#e8e6e0', '#b4b2ac', '#f0eee8', '#cfcdc6', '#9c9a94', '#efede6', '#b8b6b0'];
  facets.forEach((f, i) => { const sh = (Math.sin(t * 3 + i * 1.7) + 1) * .5; fillP(poly(f), tones[(i + Math.floor(t * 6)) % tones.length]); g.save(); g.globalAlpha = .25 * sh; fillP(poly(f), '#ffffff'); g.restore(); g.lineWidth = 2.5; g.strokeStyle = '#6a665e'; g.stroke(poly(f)); });
  ink(poly(F), 6);
  sparkle(cx + 70, cy - 50, 100, .6 + .4 * Math.sin(t * 9)); sparkle(cx - 90, cy + 6, 56, .5 + .5 * Math.sin(t * 7 + 2)); sparkle(cx + 10, cy + 110, 36, .5 + .5 * Math.sin(t * 11 + 4));
  // the four words
  g.font = '124px Gloock'; const wIS = g.measureText('IS ').width, wFO = g.measureText('FOREVER').width, x0 = 540 - (wIS + wFO) / 2;
  const WORDS = [['A DIAMOND', 540, 1110, 0], ['IS', x0 + g.measureText('IS').width / 2, 1240, 1], ['FOREVER', x0 + wIS + wFO / 2, 1240, 2]];
  const at = k => FOUR + k * .2;
  for (const [s, x, y, k] of WORDS) {
    const v = seg(t, at(k), at(k) + .16); if (v <= 0) continue;
    g.save(); g.translate(x, y); const z = lerp(1.6, 1, back(v, 2.2)); g.scale(z, z); g.globalAlpha = v; text(s, 0, 0, 124, '#1e1a18'); g.restore();
  }
  taper([[260, 1320], [540, 1314], [820, 1320]], 4, '#2a2622');
  for (let k = 0; k < 5; k++) { g.fillStyle = '#8a8378'; g.fillRect(200, 1450 + k * 30, k === 4 ? 380 : 680, 9); }
  text('— a gift of love, for always —', 540, 1620, 34, '#3a3632', 'Crimson');
}
function coinStack(x, y, r, h) {                                 // a cylinder of coins with milled edges, an embossed top and a glint
  const ry = r * .3;
  g.fillStyle = lg(x - r, 0, x + r, 0, ['#4a4640', '#cfc9be', '#f2eee6', '#8a857c', '#36322e']); g.fillRect(x - r, y - h, 2 * r, h);
  g.fillStyle = '#36322e'; g.fill(ell(x, y, r, ry));
  for (let k = 0; k < h; k += 12) { const P = new Path2D(); P.ellipse(x, y - k, r, ry, 0, 0, Math.PI); g.lineWidth = 2; g.strokeStyle = 'rgba(20,18,16,.5)'; g.stroke(P); }
  for (let k = 0; k < h; k += 36) { const P = new Path2D(); P.ellipse(x + (hash(k + x) - .5) * 3, y - k, r, ry, 0, 0, Math.PI); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.25)'; g.stroke(P); }
  g.lineWidth = 5 * LW; g.strokeStyle = OL; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x - r, y - h); g.moveTo(x + r, y); g.lineTo(x + r, y - h); g.stroke();
  form(ell(x, y - h, r, ry), '#ddd7cc', { lit: [x - r * .4, y - h - ry], dark: [x + r * .4, y - h + ry], sh: .35, hi: .4, lw: 5 });
  g.lineWidth = 3; g.strokeStyle = '#8a857c'; g.stroke(ell(x, y - h, r * .78, ry * .78)); g.strokeStyle = 'rgba(90,85,78,.6)'; g.lineWidth = 2; g.stroke(ell(x, y - h, r * .4, ry * .4));
  const P = new Path2D(); P.ellipse(x, y, r, ry, 0, 0, Math.PI); g.lineWidth = 5 * LW; g.strokeStyle = OL; g.stroke(P);
}
function coinStacks(t, u) {                                      // "...and you've been paying": coins pile up in front of the same ad, everywhere
  cam(540, lerp(1060, 900, ss(u)), lerp(1.0, 1.06, u));
  g.fillStyle = '#4a4440'; g.fillRect(-300, -300, W + 600, 1500);
  for (let r = 0; r < 5; r++) for (let c = -1; c < 7; c++) {     // a wall of the same ad, over and over
    const x = c * 170 + 40 + (r % 2) * 40, y = r * 220 + 60;
    form(poly([[x, y], [x + 130, y], [x + 130, y + 180], [x, y + 180]]), '#d8d0c0', { lit: [x, y], dark: [x + 130, y + 180], sh: .3, hi: .2, lw: 4 });
    g.lineWidth = 6; g.strokeStyle = '#7a746c'; g.stroke(ell(x + 65, y + 74, 34, 13));
    fillP(poly([[x + 50, y + 54], [x + 80, y + 54], [x + 65, y + 74]]), '#f4f4f0'); g.fillStyle = '#3a3632'; g.fillRect(x + 20, y + 120, 90, 12); g.fillRect(x + 34, y + 142, 62, 9);
  }
  g.fillStyle = lg(0, 1100, 0, 1900, ['#8a847a', '#3a3632']); g.fillRect(-300, 1100, W + 600, 1100);
  for (let k = 0; k < 12; k++) taper([[540 + (k - 6) * 40, 1100], [540 + (k - 6) * 150, 1600], [540 + (k - 6) * 260, 2100]], 3, 'rgba(0,0,0,.25)');
  const rows = [[1230, 46, 8, 120], [1420, 70, 6, 190], [1700, 108, 4, 300]];
  rows.forEach(([y, r, n, sp_], ri) => {
    for (let i = 0; i < n; i++) {
      const x = 540 + (i - (n - 1) / 2) * sp_ + (ri % 2 ? 40 : 0), seed = ri * 10 + i, start = W3 + hash(seed) * .5 + ri * .12;
      const hmax = (220 + 520 * hash(seed + 3)) * (r / 70), hgt = hmax * eo(seg(t, start, start + 1.1 + hash(seed + 5) * .5));
      g.save(); g.filter = 'blur(6px)'; fillP(ell(x + r * .4, y + 6, r * 1.3, r * .35), 'rgba(0,0,0,.45)'); g.restore();
      coinStack(x, y, r, Math.max(12, hgt));
      if (hgt > hmax * .9) sparkle(x - r * .5, y - hgt, r * .6, .5 + .5 * Math.sin(t * 8 + i));
    }
  });
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rg(540, 900, 300, 1300, ['#ffffff', '#5a5450']); g.fillRect(-300, -300, W + 600, H + 600); g.restore();
}
function wolfECU(t, u) {                                         // "...ever since." The grin widens, the lids drop.
  cam(lerp(790, 784, u), lerp(700, 712, u), lerp(2.9, 3.2, ss(u)));
  scene(t, { lid: lerp(.5, .6, u), grin: ss(seg(t, LN.w3.t1 - .1, LN.w3.t1 + .2)), look: [-.1, .2], brow: 1.3, tilt: -.04 });
}
function eyesInDark(t, u) {                                      // the lamp dies; only the wolf's eyes are left
  const d = t - DARK, on = d < .12 ? 1 - d / .12 * .5 : d < .2 ? .7 : Math.max(0, .3 - (d - .2) * 2);
  cam(784, 712, 3.2);
  scene(t, { lid: .6, grin: 1, look: [-.1, .2], brow: 1.3, tilt: -.04, mouth: 0 });
  reset(); g.fillStyle = `rgba(4,3,6,${1 - on})`; g.fillRect(0, 0, W, H);
  const ea = ss(seg(d, .15, .45)) * (1 - ss(seg(t, TL.dur - .25, TL.dur)));
  if (ea > 0) {
    cam(784, 712, 3.2); g.globalAlpha = ea;
    const bl = Math.abs(d - .75) < .05;                         // one slow blink
    wolf(wolfAt(t, { eyesOnly: 1, lid: bl ? .97 : .44, tilt: -.04 }));
  }
}

// ---------- the old-film pass: greyscale + a little sepia, lamp flicker, gate weave, grain, dust, rounded vignette ----------
function film(t) {
  const f = Math.floor(t * 24);
  out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over';
  out.fillStyle = '#000'; out.fillRect(0, 0, W, H);
  const flick = 1 + .035 * Math.sin(t * 31) + .03 * (hash(f) - .5);
  out.filter = `grayscale(1) sepia(.22) contrast(1.12) brightness(${flick.toFixed(3)})`;
  const wx = Math.sin(t * 7.3) * 2 + (hash(f * 3) - .5) * 2, wy = Math.sin(t * 5.1) * 3;
  out.drawImage(SC, -10 + wx, -10 + wy, W + 20, H + 20); out.filter = 'none';
  out.globalCompositeOperation = 'overlay'; out.globalAlpha = .3;
  out.drawImage(GRAIN[f % 6], (hash(f) - .5) * 40 - 20, (hash(f + 5) - .5) * 40 - 20, W + 40, H + 40);
  out.globalAlpha = 1; out.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 6; i++) if (hash(f * 13 + i) > .55) {       // dust and hairs
    const x = hash(f * 7 + i) * W, y = hash(f * 11 + i) * H, r = 1.5 + 4 * hash(f + i * 3);
    out.fillStyle = hash(f + i) > .5 ? 'rgba(0,0,0,.5)' : 'rgba(255,250,240,.45)'; out.beginPath(); out.arc(x, y, r, 0, TAU); out.fill();
  }
  if (hash(Math.floor(t * 4)) > .7) { const x = hash(Math.floor(t * 4) + 1) * W; out.fillStyle = 'rgba(255,250,240,.12)'; out.fillRect(x, 0, 2, H); }
  const vg = out.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.7, 'rgba(0,0,0,.35)'); vg.addColorStop(1, 'rgba(0,0,0,.85)'); out.fillStyle = vg; out.fillRect(0, 0, W, H);
  out.save(); out.filter = 'blur(18px)'; out.beginPath(); out.rect(-200, -200, W + 400, H + 400); out.roundRect(26, 26, W - 52, H - 52, 90); out.fillStyle = 'rgba(0,0,0,.9)'; out.fill('evenodd'); out.restore();
}

// ---------- captions: small, lowercase, two or three words at a time ----------
const CAPS = [];
for (const l of TL.lines) {
  const ws = l.words.flatMap(([w, a, b]) => w.split(' ').map((x, i, arr) => [x.toLowerCase().replace(/[^a-z0-9']/g, ''), a + (b - a) * i / arr.length]));
  for (let i = 0; i < ws.length; i += 3) { const chunk = ws.slice(i, i + 3); CAPS.push({ t0: chunk[0][1], s: chunk.map(c => c[0]).join(' ') }); }
}
CAPS.forEach((c, i) => { const nx = CAPS[i + 1]; const line = TL.lines.find(l => c.t0 >= l.t0 - .01 && c.t0 <= l.t1); c.t1 = nx && nx.t0 - c.t0 < 1.2 ? nx.t0 : Math.min(c.t0 + 1.4, (line ? line.t1 : c.t0) + .35); });
function captions(t) {
  const c = CAPS.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  out.save(); out.font = '46px Crimson'; out.textAlign = 'center'; out.textBaseline = 'middle';
  out.lineWidth = 7; out.strokeStyle = 'rgba(10,8,8,.85)'; out.lineJoin = 'round'; out.strokeText(c.s, W / 2, 1420);
  out.fillStyle = '#f6f2ea'; out.fillText(c.s, W / 2, 1420); out.restore();
}

window.renderAt = t => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const [a, b, fn] = SHOTS.find(([a, b]) => t >= a && t < b) || SHOTS[SHOTS.length - 1];
  fn(t, seg(t, a, Math.min(b, TL.dur)));
  film(t); captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('120px Gloock'), document.fonts.load('46px Crimson')]).then(() => true);

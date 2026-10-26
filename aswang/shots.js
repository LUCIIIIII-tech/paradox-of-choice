
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
  const ugly = ss(seg(t, wordT('r3', 'mata') - .3, wordT('r3', 'mata') + .3)); person(570, 1640, 1150, { t, hood: ['#efece6', '#c8c4bc', '#7a766e'], legs: ['#8a8680', '#5a5650', '#2a2622'], skin: PALE, hair: ['#08070a', '#050406', '#020203'], longHair: 1, arms: 'offer', eyes: ugly > .5 ? 'dead' : 'open', smile: 1, mouth: ugly > .5 ? .6 : 0, zombie: ugly > .5 ? 1 : 0, sway: .3 * ugly, lx: -1, rim: 'rgba(255,200,150,.7)' });
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
S.floor = (t, u) => { const e = ss(seg(t, W_NAKA - .2, W_NAKA + .4)); cam(540, lerp(900, 980, seg(u, 0, 6)), lerp(1, 1.25, ss(seg(u, 0, 6))));
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
S.dawn = (t, u) => { const d = ss(seg(t, T('dawn') + .8, E('dawn') + 1.2)), cr = ss(seg(t, W_TILA - .1, W_TILA + .3)) * (1 - ss(seg(t, W_TILA + 1.6, W_TILA + 2.2))); cam(CX, 900, 1);
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

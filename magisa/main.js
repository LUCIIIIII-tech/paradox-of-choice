// Mag-isa (The Last Human): stickman what-if reel, 1080x1920. Deterministic in t: window.renderAt(t).
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
// Drawing helpers, faces, the bedroom, the shadow and the captions come from ../bangungot (same series look).
const W = 1080, H = 1920, CX = W / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const LANG = new URLSearchParams(location.search).get('lang') || 'tl';     // tl (default) | en
const SUF = LANG === 'tl' ? '' : '.' + LANG;
const TL = await (await fetch(`timeline${SUF}.json`)).json();
const ANCH = SUF ? await (await fetch(`anchors${SUF}.json`)).json() : {};
const LN = Object.fromEntries(TL.lines.map(l => [l.id, l]));
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
const q = t => Math.floor(t * 12 + 1e-6) / 12;          // characters on twos
const fr = t => Math.floor(t * 24);
const INK = '#eeece4', RED = '#e3122b', BG = '#05070c';
const RIM = 'rgba(130,160,225,.75)';                     // moonlight rim glow on every stroke
const wordAt = (id, t) => { const l = LN[id]; if (!l || !l.words) return -1; let k = -1; l.words.forEach((w, i) => { if (t >= w[1] - .02) k = i; }); return k; };
const wordT = (id, w) => { w = ANCH[`${id}:${w}`] || w; const l = LN[id]; const x = l && l.words && l.words.find(v => v[0].toLowerCase().replace(/[^a-z']/g, '').startsWith(w.toLowerCase())); return x ? x[1] : (l ? l.t0 : 0); };

function reset() { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0; g.shadowColor = 'transparent'; g.filter = 'none'; g.setLineDash([]); }
function cam(cx, cy, z = 1, rot = 0, shake = 0, t = 0) {
  reset(); g.translate(CX, H / 2 - 230);   // compositions sit above the captions
  if (shake) { const f = fr(t); g.translate((hash(f) - .5) * shake * 2, (hash(f + 51) - .5) * shake * 2); }
  g.scale(z, z); if (rot) g.rotate(rot); g.translate(-cx, -cy);
}
function fill(c) { reset(); g.fillStyle = c; g.fillRect(0, 0, W, H); }
function path(pts) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); }
function line(pts, w = 10, c = INK, rim = 0) {
  path(pts); g.lineCap = 'round'; g.lineJoin = 'round';
  if (rim) { g.save(); g.shadowColor = RIM; g.shadowBlur = rim; g.strokeStyle = c; g.lineWidth = w; g.stroke(); g.restore(); }
  g.strokeStyle = c; g.lineWidth = w; g.stroke();
}
function curve(p0, c, p1, w, col = INK, rim = 0) { g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(...c, ...p1); g.lineCap = 'round'; if (rim) { g.save(); g.shadowColor = RIM; g.shadowBlur = rim; g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.restore(); } g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
function circ(x, y, r, c, stroke = 0, rim = 0) {
  g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, TAU);
  if (stroke) { if (rim) { g.save(); g.shadowColor = RIM; g.shadowBlur = rim; g.strokeStyle = c; g.lineWidth = stroke; g.stroke(); g.restore(); } g.strokeStyle = c; g.lineWidth = stroke; g.stroke(); }
  else { g.fillStyle = c; g.fill(); }
}
function ell(x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
function glow(x, y, r, c, a) { if (a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
function vignette(a = .75) { reset(); const gr = g.createRadialGradient(CX, H * .4, H * .2, CX, H * .45, H * .8); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function text(s, x, y, size, c = INK, font = 'Anton', align = 'center', stroke = 0, alpha = 1) {
  g.save(); g.globalAlpha *= alpha; g.font = `${size}px ${font}`; g.textAlign = align; g.textBaseline = 'middle';
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = '#000'; g.lineJoin = 'round'; g.strokeText(s, x, y); }
  g.fillStyle = c; g.fillText(s, x, y); g.restore();
}

// ---------- faces ----------
// the stickman's head: dark fill, moonlit rim, white outline. look: -1..1, eyes 'open'|'wide'|'shut'|'pinned', mouth 0..1, sweat 0..1
function head(x, y, r, o = {}) {
  const { look = 0, eyes = 'open', mouth = 0, sweat = 0, t = 0, brow = 1 } = o;
  const gr = g.createRadialGradient(x + r * .35, y - r * .3, r * .1, x, y, r * 1.05); gr.addColorStop(0, '#1b2238'); gr.addColorStop(1, '#070a12');
  circ(x, y, r, gr); circ(x, y, r, INK, r * .14, r * .35);
  g.save(); g.beginPath(); g.arc(x, y, r * .86, -1.2, .3); g.strokeStyle = 'rgba(150,180,240,.35)'; g.lineWidth = r * .08; g.lineCap = 'round'; g.stroke(); g.restore();
  for (const sg of [-1, 1]) {
    const ex = x + sg * r * .36, ey = y - r * .1, er = r * (eyes === 'wide' ? .23 : .19);
    if (eyes === 'shut') { curve([ex - er, ey], [ex, ey + er * .6], [ex + er, ey], r * .07); continue; }
    ell(ex, ey, er, er * (eyes === 'wide' ? 1.05 : .85)); g.fillStyle = '#f3f1ea'; g.fill();
    const pr = er * (eyes === 'pinned' ? .28 : eyes === 'wide' ? .42 : .5);
    circ(ex + look * er * .45, ey, pr, '#05070c'); circ(ex + look * er * .45 - pr * .35, ey - pr * .35, pr * .3, '#fff');
    curve([ex - er * 1.1, ey - er * (1.35 + .2 * sg * brow)], [ex, ey - er * (1.7 + .2 * brow)], [ex + er * 1.1, ey - er * (1.35 - .2 * sg * brow)], r * .06);
  }
  if (mouth > .05) { ell(x, y + r * .48, r * .14, r * (.06 + .22 * mouth)); g.fillStyle = '#000'; g.fill(); g.strokeStyle = INK; g.lineWidth = r * .06; g.stroke(); }
  else { const wv = Math.sin(t * 30) * r * .03; path([[x - r * .18, y + r * .5], [x - r * .06, y + r * .46 + wv], [x + r * .06, y + r * .5 - wv], [x + r * .18, y + r * .46]]); g.strokeStyle = INK; g.lineWidth = r * .06; g.lineCap = 'round'; g.stroke(); }
  if (sweat > 0) for (let i = 0; i < 2; i++) {
    const p = ((t * .35 + i * .5) % 1), sx = x + (i ? .78 : -.72) * r, sy = y - r * .35 + p * r * .7;
    g.save(); g.globalAlpha = sweat * (1 - p); g.beginPath(); g.moveTo(sx, sy - r * .1); g.quadraticCurveTo(sx + r * .06, sy, sx, sy + r * .04); g.quadraticCurveTo(sx - r * .06, sy, sx, sy - r * .1); g.fillStyle = '#bcd6ff'; g.fill(); g.restore();
  }
}
// close-up eye: veins, iris, pupil, lashes, catchlight; reflect = a tiny silhouette in the pupil
function bigEye(x, y, r, o = {}) {
  const { open = 1, look = 0, pupil = .45, reflect = 0, red = .6 } = o;
  if (open <= .02) { curve([x - r, y], [x, y + r * .35], [x + r, y], r * .09, INK, 14); for (let i = 0; i < 6; i++) { const u = .15 + i * .14; line([[x - r + 2 * r * u, y + r * .13 * Math.sin(Math.PI * u) * 1.6], [x - r + 2 * r * u - r * .05, y + r * .32]], r * .03); } return; }
  const hY = r * .72 * open;
  g.save(); g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y - hY * 1.6, x + r, y); g.quadraticCurveTo(x, y + hY * 1.4, x - r, y); g.closePath();
  const wg = g.createRadialGradient(x, y, r * .2, x, y, r * 1.1); wg.addColorStop(0, '#f6f3ec'); wg.addColorStop(.75, '#e2dcd0'); wg.addColorStop(1, '#b8a99a'); g.fillStyle = wg; g.fill(); g.clip();
  g.strokeStyle = `rgba(200,30,40,${.55 * red})`; g.lineWidth = r * .012;
  for (let i = 0; i < 10; i++) { const sd = i % 2 ? -1 : 1, a0 = (hash(i) - .5) * .9, L = r * (.35 + .3 * hash(i + 3)); g.beginPath(); let px = x + sd * r * .98, py = y + (hash(i + 7) - .5) * hY; g.moveTo(px, py); for (let k = 1; k <= 4; k++) { px -= sd * L / 4; py += Math.sin(a0 * 3 + k * 1.7) * r * .05; g.lineTo(px, py); } g.stroke(); }
  const ix = x + look * r * .35, ir = r * .42;
  const igr = g.createRadialGradient(ix, y, ir * .2, ix, y, ir); igr.addColorStop(0, '#2c3a52'); igr.addColorStop(.7, '#4a6188'); igr.addColorStop(1, '#141c2b'); circ(ix, y, ir, igr);
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; line([[ix + Math.cos(a) * ir * .55, y + Math.sin(a) * ir * .55], [ix + Math.cos(a) * ir * .95, y + Math.sin(a) * ir * .95]], r * .008, 'rgba(160,190,230,.35)'); }
  circ(ix, y, ir * pupil, '#020304');
  if (reflect > 0) {   // the window and a tall figure, reflected in the pupil
    g.save(); g.globalAlpha = reflect; g.translate(ix - ir * pupil * .2, y + ir * pupil * .55); const k = ir * pupil * .8;
    g.fillStyle = 'rgba(190,210,255,.5)'; g.fillRect(-k * .7, -k * 1.2, k * .5, k * .9);
    ell(k * .25, -k * .95, k * .12, k * .15); g.fillStyle = '#000'; g.fill(); g.fillRect(k * .14, -k * .82, k * .22, k * .8);
    circ(k * .2, -k * .97, k * .03, '#fff'); circ(k * .3, -k * .97, k * .03, '#fff'); g.restore();
  }
  circ(ix - ir * .35, y - ir * .35, ir * .16, 'rgba(255,255,255,.9)'); circ(ix + ir * .3, y + ir * .25, ir * .06, 'rgba(255,255,255,.6)');
  const sg = g.createLinearGradient(0, y - hY * 1.2, 0, y - hY * .2); sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(x - r, y - hY * 1.6, 2 * r, hY * 1.4);
  g.restore();
  g.save(); g.shadowColor = RIM; g.shadowBlur = 18;
  g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y - hY * 1.6, x + r, y); g.strokeStyle = INK; g.lineWidth = r * .07; g.lineCap = 'round'; g.stroke();
  g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + hY * 1.4, x + r, y); g.lineWidth = r * .04; g.stroke(); g.restore();
  for (let i = 1; i < 9; i++) { const u = i / 9, px = x - r + 2 * r * u, py = y - hY * 1.6 * 2 * u * (1 - u) * .98, a = -Math.PI / 2 + (u - .5) * 1.8; line([[px, py], [px + Math.cos(a) * r * .16, py + Math.sin(a) * r * .16]], r * .025); }
}

// ---------- the stickman lying in bed (side view) ----------
function sleeper(t, o = {}) {
  const { eyes = 'open', look = 0, mouth = 0, struggle = 0, sweat = 0, press = 0, arm = 0 } = o;
  const tr = struggle ? (hash(fr(t)) - .5) * 5 * struggle : 0;
  const breath = Math.sin(t * (2 + 3 * struggle)) * 3;
  const top = y => y + press * 18;
  // the blanket: folds, shading, a bump for the knees and feet
  g.beginPath(); g.moveTo(370, top(905)); g.bezierCurveTo(470, top(880 + breath), 620, top(890 + breath), 700, top(895)); g.bezierCurveTo(760, 870, 820, 880, 880, 900); g.lineTo(930, 990); g.lineTo(360, 990); g.closePath();
  const bgr = g.createLinearGradient(0, 860, 0, 990); bgr.addColorStop(0, '#2a3a63'); bgr.addColorStop(1, '#141d33'); g.fillStyle = bgr; g.fill();
  g.save(); g.shadowColor = RIM; g.shadowBlur = 10; g.strokeStyle = 'rgba(238,236,228,.85)'; g.lineWidth = 6; g.stroke(); g.restore();
  for (const [a, b] of [[[430, 930], [520, 965]], [[560, 925], [640, 975]], [[720, 915], [800, 960]], [[820, 905], [860, 950]]]) curve(a, [(a[0] + b[0]) / 2 + 20, (a[1] + b[1]) / 2 - 18], b, 3, 'rgba(160,185,235,.35)');
  // the arm on top of the blanket: shoulder, elbow, hand with fingers
  const sh = [395, 900 + press * 12], el = [470 + tr, 872 + breath - arm * 30], hd = [550 + tr * 1.5, 888 + breath - arm * 40];
  line([sh, el, hd], 10, INK, 14);
  for (let i = 0; i < 4; i++) { const a = -.5 + i * .3, tw = struggle ? Math.sin(t * 40 + i * 2) * .12 * struggle : 0; line([hd, [hd[0] + Math.cos(a + tw) * 30, hd[1] + Math.sin(a + tw) * 30]], 6, INK); }
  line([hd, [hd[0] - 6, hd[1] - 24]], 6, INK);
  line([[350, 905], [395, 900]], 10, INK, 10);           // neck
  head(300 + tr * .4, 860, 52, { eyes, look, mouth, sweat, t });
}
function bed() {
  g.fillStyle = '#0a0f1b'; g.fillRect(200, 975, 760, 60);
  line([[205, 780], [205, 1180]], 14, INK, 12); line([[955, 900], [955, 1180]], 14, INK, 12);
  curve([205, 800], [240, 760], [280, 790], 10, INK, 10);
  line([[205, 1035], [955, 1035]], 10, INK, 10); line([[205, 975], [955, 975]], 6, 'rgba(238,236,228,.6)');
  for (let x = 240; x < 940; x += 60) line([[x, 1040], [x, 1060]], 3, 'rgba(238,236,228,.15)');
  ell(300, 912, 105, 38); const pg = g.createLinearGradient(0, 874, 0, 950); pg.addColorStop(0, '#2b3657'); pg.addColorStop(1, '#151c30'); g.fillStyle = pg; g.fill();
  g.strokeStyle = 'rgba(238,236,228,.7)'; g.lineWidth = 5; g.stroke(); curve([230, 900], [260, 915], [250, 935], 3, 'rgba(160,185,235,.35)');
}
// the bedroom (side view) with everything in it
function room(t, o = {}) {
  const { lit = 0, flick = 0, bulb = 0 } = o;
  const wg = g.createLinearGradient(0, -100, 0, 1180); wg.addColorStop(0, '#060912'); wg.addColorStop(1, '#0d1424'); g.fillStyle = wg; g.fillRect(-300, -600, W + 600, 1780);
  for (let x = -280; x < W + 300; x += 46) { g.fillStyle = 'rgba(140,165,220,.035)'; g.fillRect(x, -600, 14, 1780); }
  for (let i = 0; i < 60; i++) circ(hash(i) * W, -200 + hash(i + 9) * 1300, 2, 'rgba(140,165,220,.08)');
  const fg = g.createLinearGradient(0, 1180, 0, 1900); fg.addColorStop(0, '#0c1120'); fg.addColorStop(1, '#020306'); g.fillStyle = fg; g.fillRect(-300, 1180, W + 600, 1200);
  for (let i = -8; i <= 8; i++) line([[CX + i * 70, 1180], [CX + i * 260, 1900]], 2, 'rgba(140,165,220,.08)');
  g.fillStyle = 'rgba(20,28,48,.9)'; g.fillRect(-300, 1150, W + 600, 30);
  line([[-300, 1180], [W + 300, 1180]], 6, 'rgba(238,236,228,.35)');
  // corner edge (left) and the darkness that lives there
  line([[150, -600], [150, 1150]], 4, 'rgba(238,236,228,.14)');
  const cg = g.createRadialGradient(70, 640, 0, 70, 640, 560); cg.addColorStop(0, 'rgba(0,0,0,.85)'); cg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = cg; g.fillRect(-500, 0, 1100, 1300);
  // hanging bulb
  line([[560, -600], [560, 120]], 3, 'rgba(238,236,228,.35)'); g.fillStyle = '#1a2033'; g.fillRect(546, 120, 28, 22);
  ell(560, 168, 26, 32); g.fillStyle = bulb ? '#fff3c4' : '#151b2b'; g.fill(); g.strokeStyle = 'rgba(238,236,228,.5)'; g.lineWidth = 3; g.stroke();
  if (bulb) glow(560, 168, 700, '255,226,150', .45 * bulb);
  // a faded poster above the bed
  g.save(); g.translate(400, 520); g.rotate(-.03); g.fillStyle = '#121a2d'; g.fillRect(-90, -120, 180, 240); g.strokeStyle = 'rgba(238,236,228,.4)'; g.lineWidth = 4; g.strokeRect(-90, -120, 180, 240);
  circ(0, -20, 50, 'rgba(238,236,228,.25)', 4); line([[-60, 70], [60, 70]], 6, 'rgba(238,236,228,.25)'); line([[-40, 90], [40, 90]], 4, 'rgba(238,236,228,.2)'); circ(-82, -112, 5, '#555'); g.restore();
  // window: night sky, stars, moon, rooftops, frame, sill, plant
  const wx = 760, wy = 420;
  const sky = g.createLinearGradient(0, wy - 200, 0, wy + 200); sky.addColorStop(0, '#0c1a38'); sky.addColorStop(1, '#1f3260'); g.fillStyle = sky; g.fillRect(wx - 150, wy - 200, 300, 400);
  for (let i = 0; i < 18; i++) circ(wx - 140 + hash(i * 3) * 280, wy - 190 + hash(i * 7) * 250, 1.6, `rgba(255,255,255,${.4 + .4 * Math.sin(t * 2 + i)})`);
  glow(wx + 60, wy - 100, 200, '200,215,255', .4); circ(wx + 60, wy - 100, 42, '#e9efff'); circ(wx + 72, wy - 108, 9, 'rgba(160,175,210,.6)'); circ(wx + 48, wy - 88, 6, 'rgba(160,175,210,.5)');
  g.fillStyle = '#05080f'; g.beginPath(); g.moveTo(wx - 150, wy + 200); for (let x = 0; x <= 300; x += 20) g.lineTo(wx - 150 + x, wy + 150 - 40 * hash(x) - (x > 160 && x < 220 ? 70 : 0)); g.lineTo(wx + 150, wy + 200); g.fill();
  for (const [a, b] of [[[wx - 150, wy - 200], [wx + 150, wy - 200]], [[wx + 150, wy - 200], [wx + 150, wy + 200]], [[wx - 150, wy + 200], [wx - 150, wy - 200]], [[wx, wy - 200], [wx, wy + 200]], [[wx - 150, wy], [wx + 150, wy]]]) line([a, b], 9, 'rgba(238,236,228,.75)', 10);
  g.fillStyle = '#141c30'; g.fillRect(wx - 180, wy + 200, 360, 22); line([[wx - 180, wy + 200], [wx + 180, wy + 200]], 5, 'rgba(238,236,228,.6)');
  g.fillStyle = '#1a2238'; g.beginPath(); g.moveTo(wx - 110, wy + 200); g.lineTo(wx - 60, wy + 200); g.lineTo(wx - 68, wy + 150); g.lineTo(wx - 102, wy + 150); g.fill();
  for (let i = 0; i < 5; i++) curve([wx - 85, wy + 150], [wx - 85 + (i - 2) * 25, wy + 100], [wx - 85 + (i - 2) * 38 + Math.sin(t + i) * 4, wy + 80 - (i % 2) * 30], 4, 'rgba(120,150,120,.7)');
  for (const sg of [-1, 1]) {   // curtains with folds, breathing
    const cx = wx + sg * 190, sw = Math.sin(t * 1.1 + sg) * 12;
    g.beginPath(); g.moveTo(cx - 45, wy - 250); g.bezierCurveTo(cx - 40 + sw, wy - 50, cx - 55 + sw, wy + 150, cx - 40 + sw * 2, wy + 280); g.lineTo(cx + 45 + sw * 2, wy + 280); g.bezierCurveTo(cx + 40 + sw, wy + 120, cx + 45, wy - 60, cx + 45, wy - 250); g.closePath();
    const cgd = g.createLinearGradient(cx - 45, 0, cx + 45, 0); cgd.addColorStop(0, '#0b1222'); cgd.addColorStop(.5, '#1a2540'); cgd.addColorStop(1, '#0b1222'); g.fillStyle = cgd; g.fill();
    for (let k = -1; k <= 1; k++) curve([cx + k * 22, wy - 240], [cx + k * 22 + sw, wy], [cx + k * 22 + sw * 2, wy + 270], 2, 'rgba(150,175,230,.25)');
  }
  line([[wx - 260, wy - 250], [wx + 260, wy - 250]], 8, 'rgba(238,236,228,.5)');
  // moonbeam + dust
  g.save(); g.globalCompositeOperation = 'lighter';
  const bg = g.createLinearGradient(wx, wy, 380, 1180); bg.addColorStop(0, 'rgba(157,179,220,.2)'); bg.addColorStop(1, 'rgba(157,179,220,0)');
  g.beginPath(); g.moveTo(wx - 150, wy - 200); g.lineTo(wx + 150, wy + 200); g.lineTo(640, 1180); g.lineTo(130, 1100); g.closePath(); g.fillStyle = bg; g.fill();
  for (let i = 0; i < 40; i++) { const p = (hash(i) + t * .02 * (1 + hash(i + 2))) % 1, x = lerp(wx - 60, 360, hash(i + 5)) + Math.sin(t * .7 + i) * 20, y = lerp(wy, 1100, p); circ(x, y, 1.5 + 2 * hash(i + 1), `rgba(220,230,255,${.5 * Math.sin(Math.PI * p)})`); }
  g.restore();
  // nightstand, red clock, a glass of water
  g.fillStyle = '#0b1120'; g.fillRect(830, 1000, 200, 160); line([[830, 1000], [1030, 1000]], 7, 'rgba(238,236,228,.6)'); line([[830, 1080], [1030, 1080]], 3, 'rgba(238,236,228,.25)'); circ(930, 1040, 6, 'rgba(238,236,228,.4)'); circ(930, 1120, 6, 'rgba(238,236,228,.4)');
  g.fillStyle = '#000'; g.fillRect(845, 925, 130, 75); line([[845, 925], [975, 925], [975, 1000], [845, 1000], [845, 925]], 3, 'rgba(238,236,228,.3)');
  text('3:00', 910, 963, 54, RED, 'Anton'); glow(910, 963, 150, '227,18,43', .22);
  g.fillStyle = 'rgba(160,190,240,.18)'; g.fillRect(990, 950, 30, 50); line([[990, 950], [990, 1000], [1020, 1000], [1020, 950]], 3, 'rgba(238,236,228,.45)');
  bed();
  if (lit) { g.save(); reset(); g.fillStyle = `rgba(255,232,180,${.2 * lit})`; g.fillRect(0, 0, W, H); g.restore(); }
  if (flick) { g.save(); reset(); g.fillStyle = `rgba(0,0,0,${flick})`; g.fillRect(0, 0, W, H); g.restore(); }
}

// ---------- the shadow: tall, thin, hunched; smoky edges; long fingers; two pin-eyes ----------
function shadow(x, y, h, o = {}) {
  const { t = 0, eyes = 1, alpha = 1, hunch = .25, arms = 0, fingers = 1, smoke = 1 } = o;
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); const s = h / 900; g.scale(s, s);
  const jt = q(t), sway = Math.sin(jt * 1.3) * 8, hx = sway + 60 * hunch, hy = -800;
  if (smoke) for (let i = 0; i < 18; i++) {
    const side = i % 2 ? 1 : -1, y0 = -760 + (i / 18) * 760, x0 = side * (70 - 10 * (y0 / -760)) + sway * (1 + y0 / 760);
    const wv = Math.sin(t * 2 + i) * 30, L = 60 + 60 * hash(i);
    g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo(x0 + side * L * .5, y0 - 20 + wv, x0 + side * L, y0 - 60, x0 + side * L * 1.3 + wv, y0 - 120);
    g.strokeStyle = `rgba(0,0,0,${.5 + .3 * hash(i + 4)})`; g.lineWidth = 10 + 10 * hash(i + 2); g.lineCap = 'round'; g.stroke();
  }
  g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = 50; g.fillStyle = '#000';
  ell(hx, hy, 72, 100, hunch * .6); g.fill();
  g.beginPath(); g.moveTo(-95 + sway, -700); g.quadraticCurveTo(sway, -770, 105 + sway + 40 * hunch, -690);
  g.quadraticCurveTo(80, -500, 66, -330); g.lineTo(58, 0); g.lineTo(16, 0); g.lineTo(0, -290); g.lineTo(-16, 0); g.lineTo(-58, 0); g.quadraticCurveTo(-80, -500, -95 + sway, -700); g.closePath(); g.fill();
  g.lineCap = 'round'; g.strokeStyle = '#000'; g.lineWidth = 32;
  for (const sg of [-1, 1]) {
    const ex = sg * (140 + arms * 120), ey = -440 - arms * 200, hx2 = sg * (120 + arms * 230), hy2 = -150 - arms * 400;
    g.beginPath(); g.moveTo(sg * 85 + sway, -680); g.quadraticCurveTo(ex, ey, hx2, hy2); g.stroke();
    if (fingers) { g.lineWidth = 9; for (let k = 0; k < 4; k++) { const a = Math.PI / 2 + sg * (-.35 + k * .22) - arms * sg * 1.2 + Math.sin(t * 3 + k) * .05; g.beginPath(); g.moveTo(hx2, hy2); g.quadraticCurveTo(hx2 + Math.cos(a) * 60, hy2 + Math.sin(a) * 60, hx2 + Math.cos(a + sg * .3) * 120, hy2 + Math.sin(a + sg * .3) * 120); g.stroke(); } g.lineWidth = 32; }
  }
  g.shadowBlur = 0;
  if (eyes > 0) for (const sg of [-1, 1]) { glow(hx + sg * 28, hy - 10, 70, '255,255,255', .4 * eyes); circ(hx + sg * 28, hy - 10, 8 * eyes + 3, '#fff'); }
  g.restore();
}

// ---------- captions: word by word, the current word pops, key words in red ----------
function captions(t) {
  for (const l of TL.lines) {
    if (!l.words || t < l.t0 - .02 || t > l.t1 + .25) continue;
    const k = wordAt(l.id, t); if (k < 0) continue;
    const a = Math.floor(k / 3) * 3, ws = l.words.slice(a, Math.min(l.words.length, a + 3));
    const keys = (l.key || []).map(x => x.toLowerCase().replace(/[^a-z':]/g, ''));
    const size = 96, gap = 44; reset();
    g.font = `${size}px Anton`;
    const up = w => w.toUpperCase();
    const widths = ws.map(w => g.measureText(up(w[0])).width);
    const total = widths.reduce((s, v) => s + v, 0) + gap * (ws.length - 1);
    const sc = Math.min(1, 980 / total);
    let x = CX - total * sc / 2; const y = 1470;
    ws.forEach((w, i) => {
      const idx = a + i; if (idx > k) { x += (widths[i] + gap) * sc; return; }
      const isKey = keys.some(kk => w[0].toLowerCase().replace(/[^a-z':]/g, '').startsWith(kk));
      const pop = idx === k ? back(seg(t, w[1], w[1] + .12), 2.2) : 1;
      const s = sc * (idx === k ? lerp(1.12, 1, seg(t, w[1], w[1] + .16)) : 1);
      g.save(); g.translate(x + widths[i] * sc / 2, y); g.scale(s, s); g.globalAlpha = clamp(pop * 1.2);
      g.font = `${size}px Anton`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 16; g.strokeStyle = '#000'; g.lineJoin = 'round'; g.strokeText(up(w[0]), 0, 0);
      if (isKey) { g.shadowColor = 'rgba(227,18,43,.8)'; g.shadowBlur = 24; }
      g.fillStyle = isKey ? RED : '#ffffff'; g.fillText(up(w[0]), 0, 0);
      g.restore();
      x += (widths[i] + gap) * sc;
    });
  }
}


// ================= MAG-ISA: the last human =================
// ---------- world pieces ----------
function sky(top, bot, y0 = -600, y1 = 1300) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-600, y0 - 400, W + 1200, y1 - y0 + 1600); }
function stars(n = 70, a = 1, t = 0) { for (let i = 0; i < n; i++) circ(-200 + hash(i * 3.1) * (W + 400), -500 + hash(i * 7.7) * 1100, 1 + 1.6 * hash(i), `rgba(255,255,255,${a * (.35 + .4 * Math.sin(t * 2 + i))})`); }
// standing / walking / sitting stick figure. (x, y) = feet. o: walk (phase, 0 = standing), arms 'down'|'open'|'talk'|'up'|'hug', sit, eyes, look, mouth, color
function stick(x, y, h, o = {}) {
  const { walk = null, arms = 'down', sit = 0, eyes = 'open', look = 0, mouth = 0, t = 0, col = INK, rim = 14, face = true, sweat = 0 } = o;
  const hr = h * .11, neck = [x, y - h * .78], hip = [x, y - h * .45 + sit * h * .2], hc = [x, y - h * .89];
  const sw = walk === null ? 0 : Math.sin(walk), lw = h * .03;
  // legs
  if (sit) {
    for (const sg of [-1, 1]) line([hip, [x + sg * h * .06 + h * .2, hip[1] + h * .02], [x + sg * h * .06 + h * .24 + Math.sin(t * 2 + sg) * h * .02, hip[1] + h * .3]], lw, col, rim);
  } else for (const sg of [-1, 1]) {
    const f = [x + sg * sw * h * .17 + (walk === null ? sg * h * .07 : 0), y], k = [(hip[0] + f[0]) / 2 + h * .03 * Math.abs(sw), (hip[1] + y) / 2 - (walk === null ? 0 : Math.max(0, sg * sw) * h * .05)];
    line([hip, k, f], lw, col, rim);
  }
  line([hip, neck], lw * 1.05, col, rim);
  // arms
  const sh = [x, neck[1] + h * .04];
  for (const sg of [-1, 1]) {
    let e, hd;
    if (arms === 'open') { e = [x + sg * h * .17, sh[1] - h * .06]; hd = [x + sg * h * .32, sh[1] - h * .16]; }
    else if (arms === 'up') { e = [x + sg * h * .1, sh[1] - h * .14]; hd = [x + sg * h * .14, sh[1] - h * .3]; }
    else if (arms === 'talk') { const wv = Math.sin(t * 6) * h * .04; e = [x + sg * h * .12, sh[1] + h * .12]; hd = [x + sg * h * .2 + (sg > 0 ? wv : 0), sh[1] + (sg > 0 ? -h * .02 : h * .22)]; }
    else if (arms === 'hug') { e = [x + sg * h * .12, sh[1] + h * .14]; hd = [x - sg * h * .04, sh[1] + h * .22]; }
    else { const s2 = walk === null ? 0 : -sg * sw; e = [x + sg * h * .1 + s2 * h * .06, sh[1] + h * .16]; hd = [x + sg * h * .12 + s2 * h * .12, sh[1] + h * .32]; }
    line([sh, e, hd], lw * .9, col, rim);
  }
  if (face) head(hc[0], hc[1], hr, { eyes, look, mouth, t, sweat });
  else circ(hc[0], hc[1], hr, col);
}
function skyline(t, o = {}) {
  const { lit = 1, baseY = 1000, seed = 1, ruin = 0, vines = 0, dark = '#070b16', rimA = .35, scale = 1, warm = 0, gap = 0 } = o;
  let x = -160, i = 0;
  while (x < W + 160) {
    const w = (90 + 110 * hash(seed + i * 1.7)) * scale, h = (260 + 560 * hash(seed + i * 3.3)) * scale;
    const top = baseY - h * (1 - ruin * .35 * hash(i + 9));
    if (gap && x + w > CX - gap && x < CX + gap) { x += w + 8; i++; continue; }
    g.fillStyle = dark; g.beginPath(); g.moveTo(x, baseY);
    if (ruin > 0) { g.lineTo(x, top + 20); for (let k = 0; k <= 5; k++) g.lineTo(x + w * k / 5, top + (hash(i * 5 + k) * 70) * ruin); g.lineTo(x + w, baseY); }
    else { g.lineTo(x, top); g.lineTo(x + w, top); g.lineTo(x + w, baseY); }
    g.closePath(); g.fill(); g.strokeStyle = `rgba(150,175,230,${rimA})`; g.lineWidth = 3; g.stroke();
    // windows: lit[0..1] says which fraction is still on (they go out in a fixed random order)
    for (let wy = top + 30; wy < baseY - 30; wy += 34 * scale) for (let wx = x + 14; wx < x + w - 18; wx += 26 * scale) {
      const hsh = hash(wx * .13 + wy * .71 + seed), on = hsh < lit * .7;
      if (on) { g.fillStyle = warm ? 'rgba(255,214,140,.85)' : 'rgba(255,226,160,.85)'; g.fillRect(wx, wy, 10 * scale, 14 * scale); }
      else if (hsh < .7) { g.fillStyle = 'rgba(120,140,190,.08)'; g.fillRect(wx, wy, 10 * scale, 14 * scale); }
    }
    if (vines > 0) for (let k = 0; k < 4; k++) { const vx = x + w * hash(i * 7 + k), L = (baseY - top) * vines * (.4 + .6 * hash(i + k)); curve([vx, baseY], [vx + 20 * Math.sin(i + k), baseY - L / 2], [vx + 10, baseY - L], 6, 'rgba(70,130,70,.85)'); }
    if (vines > .5) for (let k = 0; k < 3; k++) { circ(x + w * (k + .5) / 3, top - 10, 30 * vines, 'rgba(40,90,45,.95)'); }
    x += w + 8; i++;
  }
}
function trafficLight(x, y, t, on = 1) {
  line([[x, y], [x, y - 520]], 12, 'rgba(238,236,228,.6)', 8);
  g.fillStyle = '#0a0d16'; g.fillRect(x - 40, y - 700, 80, 200); g.strokeStyle = 'rgba(238,236,228,.6)'; g.lineWidth = 4; g.strokeRect(x - 40, y - 700, 80, 200);
  const k = Math.floor(t / 1.2) % 3, cols = ['227,18,43', '255,190,40', '40,220,120'];
  for (let i = 0; i < 3; i++) { const cy = y - 665 + i * 64; circ(x, cy, 24, '#151a26'); if (on && k === i) { glow(x, cy, 140, cols[i], .55); circ(x, cy, 24, `rgb(${cols[i]})`); } }
}
function car(x, y, s, o = {}) {
  const { rust = 0, vines = 0, dir = 1 } = o;
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  g.beginPath(); g.moveTo(-150, -20); g.lineTo(-150, -70); g.quadraticCurveTo(-140, -90, -100, -95); g.lineTo(-60, -150); g.lineTo(60, -150); g.lineTo(110, -95); g.quadraticCurveTo(150, -90, 155, -60); g.lineTo(155, -20); g.closePath();
  g.fillStyle = rust ? `rgb(${lerp(16, 90, rust)},${lerp(22, 45, rust)},${lerp(40, 25, rust)})` : '#121a2e'; g.fill(); g.save(); g.shadowColor = RIM; g.shadowBlur = 8; g.strokeStyle = 'rgba(238,236,228,.7)'; g.lineWidth = 5; g.stroke(); g.restore();
  g.fillStyle = rust ? 'rgba(20,20,20,.9)' : 'rgba(110,140,200,.25)'; g.beginPath(); g.moveTo(-52, -140); g.lineTo(-90, -98); g.lineTo(0, -98); g.lineTo(0, -140); g.fill(); g.beginPath(); g.moveTo(10, -140); g.lineTo(10, -98); g.lineTo(95, -98); g.lineTo(55, -140); g.fill();
  if (rust) for (let i = 0; i < 8; i++) circ(-130 + hash(i) * 270, -80 + hash(i + 3) * 55, 8 + 14 * hash(i + 5), `rgba(150,70,30,${.6 * rust})`);
  for (const wx of [-90, 95]) { circ(wx, -20, 34 * (rust > .6 ? .85 : 1), '#05060a'); circ(wx, -20, 34 * (rust > .6 ? .85 : 1), 'rgba(238,236,228,.6)', 5); circ(wx, -20, 10, 'rgba(238,236,228,.5)'); }
  if (vines) for (let i = 0; i < 6; i++) curve([-140 + i * 55, 0], [-120 + i * 55, -60 * vines], [-130 + i * 55 + 20, -110 * vines], 5, 'rgba(70,140,70,.9)');
  g.restore();
}
function dog(x, y, s, t, o = {}) {
  const { eyes = 1, dir = 1, phase = 0 } = o;
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  const w = t * 9 + phase, bob = Math.sin(w * 2) * 4;
  g.fillStyle = '#0a0c12'; ell(0, -110 + bob, 110, 42); g.fill(); g.save(); g.shadowColor = RIM; g.shadowBlur = 8; g.strokeStyle = 'rgba(238,236,228,.6)'; g.lineWidth = 4; g.stroke(); g.restore();
  for (const [lx, ph] of [[-70, 0], [-45, Math.PI], [60, Math.PI], [85, 0]]) { const a = Math.sin(w + ph) * .45; line([[lx, -90 + bob], [lx + Math.sin(a) * 35, -45], [lx + Math.sin(a) * 50, 0]], 9, 'rgba(238,236,228,.75)'); }
  line([[-105, -125 + bob], [-150, -170 + Math.sin(w) * 10], [-165, -200 + Math.sin(w) * 14]], 8, 'rgba(238,236,228,.7)');   // tail
  ell(125, -150 + bob, 48, 36, .2); g.fillStyle = '#0a0c12'; g.fill(); g.strokeStyle = 'rgba(238,236,228,.6)'; g.lineWidth = 4; g.stroke();
  g.beginPath(); g.moveTo(110, -180 + bob); g.lineTo(122, -220 + bob); g.lineTo(138, -182 + bob); g.closePath(); g.fillStyle = '#0a0c12'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(150, -150 + bob); g.lineTo(200, -138 + bob); g.lineTo(196, -122 + bob); g.lineTo(150, -128 + bob); g.closePath(); g.fill(); g.stroke();   // snout
  if (eyes) { glow(148, -160 + bob, 34, '255,240,200', .7 * eyes); circ(148, -160 + bob, 6, '#fff3d0'); }
  g.restore();
}
function deer(x, y, s, t, o = {}) {
  const { dir = 1, phase = 0 } = o;
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  const w = t * 3 + phase;
  g.fillStyle = '#121620'; ell(0, -200, 120, 50); g.fill(); g.strokeStyle = 'rgba(238,236,228,.6)'; g.lineWidth = 4; g.stroke();
  for (const [lx, ph] of [[-80, 0], [-55, Math.PI], [65, Math.PI], [90, 0]]) { const a = Math.sin(w + ph) * .25; line([[lx, -180], [lx + Math.sin(a) * 30, -90], [lx + Math.sin(a) * 34, 0]], 8, 'rgba(238,236,228,.75)'); }
  line([[100, -220], [150, -320]], 22, '#121620'); line([[100, -220], [150, -320]], 4, 'rgba(238,236,228,.4)');
  ell(170, -335, 42, 26, .4); g.fillStyle = '#121620'; g.fill(); g.stroke();
  for (const sg of [-1, 1]) { line([[160, -355], [150 + sg * 20, -420], [130 + sg * 40, -460]], 5, 'rgba(238,236,228,.8)'); line([[152 + sg * 18, -410], [180 + sg * 30, -430]], 4, 'rgba(238,236,228,.8)'); }
  circ(182, -342, 4, '#fff');
  g.restore();
}
function coolingTower(x, y, s, steam, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-170, 0); g.quadraticCurveTo(-90, -260, -120, -480); g.lineTo(120, -480); g.quadraticCurveTo(90, -260, 170, 0); g.closePath();
  const gr = g.createLinearGradient(-170, 0, 170, 0); gr.addColorStop(0, '#0b1020'); gr.addColorStop(.6, '#1a2440'); gr.addColorStop(1, '#0b1020'); g.fillStyle = gr; g.fill();
  g.save(); g.shadowColor = RIM; g.shadowBlur = 10; g.strokeStyle = 'rgba(238,236,228,.7)'; g.lineWidth = 5; g.stroke(); g.restore();
  for (let i = 0; i < 6; i++) { const py = -40 - i * 70; line([[-160 + i * 6, py], [160 - i * 6, py]], 2, 'rgba(160,185,235,.15)'); }
  for (let i = 0; i < 9; i++) { const p = ((t * .25 + i / 9) % 1), a = steam * (1 - p) * .55; circ(-60 + 120 * hash(i) + Math.sin(t + i) * 20, -500 - p * 420, 60 + 90 * p, `rgba(200,210,230,${a})`); }
  g.restore();
}
function pylon(x, y, h, lit) {
  const top = y - h;
  line([[x - h * .18, y], [x - h * .05, top], [x + h * .05, top], [x + h * .18, y]], 5, 'rgba(238,236,228,.55)');
  for (let k = 1; k < 6; k++) { const yy = y - h * k / 6, wd = h * .18 * (1 - k / 6) + h * .05; line([[x - wd, yy], [x + wd, yy - h / 6]], 2, 'rgba(238,236,228,.35)'); line([[x + wd, yy], [x - wd, yy - h / 6]], 2, 'rgba(238,236,228,.35)'); }
  line([[x - h * .22, top + h * .12], [x + h * .22, top + h * .12]], 5, 'rgba(238,236,228,.55)');
  if (lit) { glow(x, top, 40, '227,18,43', .8); circ(x, top, 7, RED); }
}
function globe(gx, gy, r, t, lights = 1) {
  glow(gx, gy, r * 1.5, '70,110,220', .25);
  g.save(); g.beginPath(); g.arc(gx, gy, r, 0, TAU); g.clip();
  const sea = g.createRadialGradient(gx - r * .4, gy - r * .4, r * .1, gx, gy, r); sea.addColorStop(0, '#0e2550'); sea.addColorStop(1, '#030914'); g.fillStyle = sea; g.fillRect(gx - r, gy - r, 2 * r, 2 * r);
  const rot = t * .08;
  for (let c = 0; c < 7; c++) {   // continents: soft blobs drifting with the rotation
    const cx = gx + ((hash(c * 3.3) * 2.4 - 1.2 + rot) % 2.4 + 2.4) % 2.4 * r - 1.2 * r, cy = gy + (hash(c * 5.1) - .5) * 1.3 * r;
    g.fillStyle = '#0b1a14'; g.beginPath();
    for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU, rr = r * (.18 + .12 * hash(c * 9 + k)); g.lineTo(cx + Math.cos(a) * rr * 1.4, cy + Math.sin(a) * rr); }
    g.fill();
    for (let k = 0; k < 40; k++) { const hs = hash(c * 100 + k); if (hs > lights) continue; const px = cx + (hash(c * 50 + k) - .5) * r * .5, py = cy + (hash(c * 70 + k) - .5) * r * .32; circ(px, py, 2.4, 'rgba(255,214,130,.95)'); glow(px, py, 10, '255,200,110', .35); }
  }
  const sh = g.createLinearGradient(gx - r, 0, gx + r, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.75, 'rgba(0,0,0,.25)'); sh.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = sh; g.fillRect(gx - r, gy - r, 2 * r, 2 * r);
  g.restore();
  circ(gx, gy, r, 'rgba(130,170,255,.6)', 4, 20);
}
function phoneUI(x, y, s, t, o = {}) {
  const { mode = 'nosignal', typed = '', sent = 0 } = o;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#05070c'; g.beginPath(); g.roundRect(-260, -520, 520, 1040, 60); g.fill(); g.save(); g.shadowColor = RIM; g.shadowBlur = 20; g.strokeStyle = INK; g.lineWidth = 10; g.stroke(); g.restore();
  g.fillStyle = mode === 'nosignal' ? '#0b0f1a' : '#0d1424'; g.beginPath(); g.roundRect(-230, -490, 460, 980, 40); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.roundRect(-60, -480, 120, 28, 14); g.fill();
  text('11:47', -170, -440, 30, '#fff', 'Anton');
  if (mode === 'nosignal') {
    text('No Service', 60, -440, 26, 'rgba(255,255,255,.75)', 'Anton');
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(150, -452, 46, 22); g.fillStyle = RED; g.fillRect(153, -449, 6, 16);
    for (let i = 0; i < 4; i++) g.fillRect(-60 + i * 12, -432 - i * 6, 8, 6 + i * 6);
    line([[-64, -455], [-10, -420]], 4, RED);
    // the message that will not send
    const blink = Math.floor(t * 2) % 2;
    g.fillStyle = '#1e5cff'; g.beginPath(); g.roundRect(-40, -300, 240, 90, 30); g.fill(); text('May tao ba?', 80, -255, 34, '#fff', 'Anton');
    circ(-75, -255, 22, RED); text('!', -75, -253, 32, '#fff', 'Anton');
    g.fillStyle = '#1e5cff'; g.beginPath(); g.roundRect(-70, -180, 270, 90, 30); g.fill(); text('Sumagot ka...', 65, -135, 34, '#fff', 'Anton');
    circ(-105, -135, 22, RED); text('!', -105, -133, 32, '#fff', 'Anton');
    text('Not Delivered', 90, -60, 26, `rgba(227,18,43,${blink ? 1 : .5})`, 'Anton');
    // wifi with a slash
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 260, 40 + i * 40, -2.4, -.75); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 12; g.stroke(); }
    circ(0, 260, 12, 'rgba(255,255,255,.35)'); line([[-110, 130], [110, 300]], 12, RED);
  } else {
    text('Ate', 0, -380, 44, '#fff', 'Anton'); circ(0, -440 + 0, 0, '#fff');
    if (sent) { g.fillStyle = '#1e5cff'; g.beginPath(); g.roundRect(-60, -200, 260, 120, 34); g.fill(); text('Kumusta ka?', 70, -165, 34, '#fff', 'Anton'); text('Miss na kita.', 70, -120, 34, '#fff', 'Anton'); text('Delivered', 120, -55, 24, 'rgba(255,255,255,.6)', 'Anton'); }
    g.fillStyle = '#1a2236'; g.beginPath(); g.roundRect(-210, 340, 420, 80, 40); g.fill();
    text(typed + (Math.floor(t * 3) % 2 && !sent ? '|' : ''), -180, 380, 32, '#fff', 'Anton', 'left');
    circ(160, 380, 30, sent ? '#1e5cff' : '#2b3550'); text('➤', 162, 380, 30, '#fff');
  }
  g.restore();
}
function road(t, o = {}) {   // a straight road to the horizon (one-point perspective)
  const { y0 = 820, grass = 0, cracks = 0, dash = 1 } = o;
  g.fillStyle = '#0a0d16'; g.beginPath(); g.moveTo(CX - 30, y0); g.lineTo(CX + 30, y0); g.lineTo(CX + 900, 1700); g.lineTo(CX - 900, 1700); g.closePath(); g.fill();
  line([[CX - 30, y0], [CX - 900, 1700]], 5, 'rgba(238,236,228,.55)', 8); line([[CX + 30, y0], [CX + 900, 1700]], 5, 'rgba(238,236,228,.55)', 8);
  if (dash) for (let i = 0; i < 9; i++) { const p0 = Math.pow((i + (t * .4 % 1) * 0) / 9, 1.8), p1 = Math.pow((i + .45) / 9, 1.8); line([[CX, lerp(y0, 1700, p0)], [CX, lerp(y0, 1700, p1)]], lerp(3, 18, p1), 'rgba(255,220,120,.6)'); }
  if (cracks) for (let i = 0; i < 12; i++) { const p = .2 + .8 * hash(i), y = lerp(y0, 1700, p), x = CX + (hash(i + 4) - .5) * lerp(60, 1400, p); line([[x, y], [x + 30, y + 20], [x + 10, y + 50]], 3, `rgba(0,0,0,${cracks})`); }
  if (grass) for (let i = 0; i < 70; i++) { const p = .1 + .9 * hash(i * 3), y = lerp(y0, 1700, p), x = CX + (hash(i * 7) - .5) * lerp(60, 1700, p), hh = lerp(10, 80, p) * grass; for (let k = -1; k <= 1; k++) curve([x, y], [x + k * hh * .3, y - hh * .6], [x + k * hh * .5 + Math.sin(t + i) * 5, y - hh], lerp(2, 6, p), 'rgba(80,150,80,.9)'); }
}
function tree(x, y, h, t) { line([[x, y], [x + Math.sin(t * .8 + x) * 4, y - h * .55]], h * .06, '#1b140e'); for (let k = 0; k < 4; k++) circ(x + (hash(x + k) - .5) * h * .4, y - h * (.55 + .12 * k), h * (.24 - .03 * k), k % 2 ? '#14331c' : '#1c4426'); }
function house(x, y, s, cave = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#0c1120'; g.fillRect(-150, -220, 300, 220); g.strokeStyle = 'rgba(238,236,228,.6)'; g.lineWidth = 5; g.strokeRect(-150, -220, 300, 220);
  g.beginPath(); g.moveTo(-180, -220); g.lineTo(0, -380 + cave * 140); g.lineTo(cave ? 40 : 0, -380 + cave * 160); g.lineTo(180, -220); g.closePath(); g.fillStyle = '#151c30'; g.fill(); g.stroke();
  if (cave) { g.fillStyle = '#000'; g.beginPath(); g.moveTo(-40, -300 + cave * 60); g.lineTo(60, -330 + cave * 120); g.lineTo(100, -230); g.lineTo(-60, -230); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(-110, -170, 70, 70); g.fillRect(40, -170, 70, 70); g.fillRect(-30, -120, 60, 120);
  g.restore();
}

// ---------- the counter: the time jump that keeps you watching ----------
function counter(t) {
  let cur = null, t0 = 0;
  for (const l of TL.lines) { if (l.t0 > t) break; if (l.counter) { cur = l.counter; t0 = l.t0; } }
  if (!cur || t > LN.l21.t0) return;
  const k = back(seg(t, t0, t0 + .25), 2.4), fl = t - t0 < .3 && fr(t) % 2 === 0;
  reset(); g.save(); g.translate(CX, 230); g.scale(k, k);
  g.font = '86px Anton'; const w = g.measureText(cur).width + 110;
  g.fillStyle = 'rgba(0,0,0,.65)'; g.beginPath(); g.roundRect(-w / 2, -62, w, 124, 30); g.fill();
  g.strokeStyle = RED; g.lineWidth = 6; g.shadowColor = RED; g.shadowBlur = 30; g.stroke(); g.shadowBlur = 0;
  circ(-w / 2 + 42, 0, 14, Math.floor(t * 2) % 2 ? RED : '#5a0710');
  text(cur, 20, 4, 86, fl ? RED : '#fff', 'Anton');
  g.restore();
}

// ---------- shots ----------
const S = {};
// 1. the hook: a busy crosswalk... and on "wala", everyone turns to dust at once. Only you are left.
const CROWD = []; for (let i = 0; i < 34; i++) { const d = .35 + .65 * hash(i * 2.3); CROWD.push({ x: (hash(i * 5.7) - .5) * 1300 * d + CX, d, dir: hash(i * 9.1) > .5 ? 1 : -1, sp: 40 + 60 * hash(i * 3.9), ph: hash(i) * 6 }); }
CROWD.sort((a, b) => a.d - b.d);
function crosswalk(t, o = {}) {
  const { vanish = 1e9, people = 1, flicker = 0 } = o;
  sky('#9fb8d8', '#f0d6b0', -600, 700); glow(820, 300, 350, '255,240,210', .5);
  skyline(t, { lit: .1, baseY: 700, seed: 71, dark: '#2c3448', rimA: .25, scale: .8, warm: 1 });
  g.fillStyle = '#2a2f3a'; g.fillRect(-600, 700, W + 1200, 1400);
  // lane lines running to the horizon, and one wide zebra crossing in front
  for (const lx of [-3, -1, 1, 3]) line([[CX + lx * 60, 700], [CX + lx * 520, 1900]], 6, 'rgba(238,236,228,.25)');
  g.fillStyle = 'rgba(238,236,228,.8)';
  for (let s2 = -9; s2 <= 9; s2++) { const xa = CX + s2 * 70, xb = CX + s2 * 140; g.beginPath(); g.moveTo(xa - 22, 1150); g.lineTo(xa + 22, 1150); g.lineTo(xb + 46, 1600); g.lineTo(xb - 46, 1600); g.closePath(); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-600, 1600, W + 1200, 400);
  line([[-600, 700], [W + 600, 700]], 5, 'rgba(238,236,228,.4)');
  trafficLight(980, 1100, t);
  if (!people) return;
  for (let i = 0; i < CROWD.length; i++) {
    const c = CROWD[i], y = 720 + c.d * 820, h = 120 + c.d * 330, x = ((c.x + c.dir * c.sp * t - CX + 900) % 1800 + 1800) % 1800 - 900 + CX;
    if (Math.abs(x - CX) < 90 && c.d > .7) continue;            // keep the centre clear for you
    const tv = vanish + hash(i * 4.4) * .18, p = seg(t, tv, tv + .28);
    let a = 1 - p; if (flicker) a *= (fr(t) + i) % 3 === 0 ? .9 : .25;
    if (a > .01) { g.save(); g.globalAlpha = a; stick(x, y, h, { t, walk: t * 6 + c.ph, col: '#e8e4da', rim: 6, eyes: 'open', look: c.dir * .6 }); g.restore(); }
    if (p > 0 && p < 1) for (let k = 0; k < 14; k++) {          // dust drifting up
      const px = x + (hash(i * 31 + k) - .5) * h * .4 + Math.sin(t * 3 + k) * 10, py = y - h * hash(i * 17 + k) - p * 160 * (1 + hash(k));
      circ(px, py, 2 + 4 * hash(k + i), `rgba(238,236,228,${(1 - p) * .9})`);
    }
    if (t > tv) {                                                // the phone they were holding drops and lands
      const ft = t - tv, py = Math.min(y, y - h * .5 + 900 * ft * ft); const bx = x + c.dir * 18;
      g.save(); g.translate(bx, py - 6); g.rotate(ft < .35 ? ft * 8 * c.dir : 1.4 * c.dir); g.fillStyle = '#111'; g.fillRect(-h * .03, -h * .05, h * .06, h * .1); g.strokeStyle = 'rgba(238,236,228,.7)'; g.lineWidth = 2; g.strokeRect(-h * .03, -h * .05, h * .06, h * .1);
      if (ft > .35 && Math.floor(t * 2 + i) % 2) { g.fillStyle = 'rgba(120,180,255,.9)'; g.fillRect(-h * .025, -h * .04, h * .05, h * .08); }
      g.restore();
    }
  }
}
S.wake = (t, u) => {
  const tv = wordT('l01', 'wala'), after = t > tv;
  cam(CX, 980, after ? lerp(1.0, 1.25, eo(seg(t, tv, tv + 1.5))) : lerp(1.08, 1.0, seg(t, 0, tv)), 0, after && t < tv + .35 ? 14 : 0, t);
  crosswalk(t, { vanish: tv });
  // you: the one in the middle who stays
  if (after) { g.save(); g.translate(CX, 1490); g.scale(1, .22); glow(0, 0, 260, '227,18,43', .55 * ss(seg(t, tv + .2, tv + .6))); g.restore(); circ(CX, 1490, 0, RED); }
  stick(CX, 1490, 440, { t, walk: after ? null : t * 6, eyes: after ? 'wide' : 'open', look: after ? Math.sin(t * 5) : 0, sweat: after ? .8 : 0 });
  if (t >= tv && t < tv + .06) { reset(); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(0, 0, W, H); }
  if (t >= tv && t < tv + .2) glitch(t, .6);
};

// 2. the open loop: you, tiny, in an endless empty dark; "what breaks you first?"
S.loop1 = (t, u) => {
  fill('#020306'); cam(CX, 760, lerp(1.3, 1, eo(seg(u, 0, 1.2))));
  glow(CX, 900, 500, '200,210,255', .12);
  g.save(); g.globalCompositeOperation = 'lighter'; const bg = g.createLinearGradient(CX, 0, CX, 1000); bg.addColorStop(0, 'rgba(200,210,255,.16)'); bg.addColorStop(1, 'rgba(200,210,255,0)'); g.beginPath(); g.moveTo(CX - 40, -300); g.lineTo(CX + 40, -300); g.lineTo(CX + 220, 1000); g.lineTo(CX - 220, 1000); g.fill(); g.restore();
  ell(CX, 1000, 220, 40); g.fillStyle = 'rgba(200,210,255,.12)'; g.fill();
  stick(CX, 1000, 300, { t, eyes: 'wide', look: Math.sin(t * 2), sweat: .4 });
  const tq = wordT('l02', 'hindi');
  if (t > tq) { reset(); g.save(); g.shadowColor = RED; g.shadowBlur = 40; text('?', CX, 470, 260 * back(seg(t, tq, tq + .2), 2), RED, 'Anton'); g.restore(); }
};
// 3. hour one: an empty street, a traffic light changing for no one
S.street = (t, u) => {
  cam(CX, 760, lerp(1, 1.08, seg(u, 0, 4)));
  sky('#1a2340', '#3a4a6a', -600, 900); skyline(t, { lit: .15, baseY: 860, seed: 3, rimA: .3 });
  g.fillStyle = '#0b0f1a'; g.fillRect(-600, 860, W + 1200, 1200); road(t, { y0: 860 });
  for (let i = 0; i < 4; i++) { const p = (t * .15 + i * .27) % 1; g.save(); g.translate(lerp(-100, W + 100, p), 1300 - 60 * Math.sin(p * 9 + i)); g.rotate(t * 2 + i); g.fillStyle = 'rgba(238,236,228,.55)'; g.fillRect(-26, -18, 52, 36); g.restore(); }   // newspaper blowing
  trafficLight(860, 1250, t);
  stick(CX - 40, 1180, 230, { t, eyes: 'wide', look: Math.sin(t * 2.4) });
};
// 4. at first it feels like freedom: walking down the middle of a highway at sunrise
S.free = (t, u) => {
  cam(CX, 760, lerp(1.05, 1, seg(u, 0, 2)));
  sky('#ff9a5a', '#3a2a50', -600, 860); glow(CX, 840, 500, '255,190,120', .6); circ(CX, 860, 120, '#ffd59a');
  skyline(t, { lit: 0, baseY: 880, seed: 7, dark: '#1a1424', rimA: .15, scale: .7 });
  g.fillStyle = '#120e1a'; g.fillRect(-600, 880, W + 1200, 1200); road(t, { y0: 880 });
  car(170, 1150, .7, {}); car(930, 1250, .8, { dir: -1 });
  stick(CX, 1350, 340, { t, walk: t * 5, arms: 'open', eyes: 'open', col: INK });
};
// 5. within a day the power plants shut down
S.grid = (t, u) => {
  cam(CX, 760, lerp(1, 1.1, seg(u, 0, 3)));
  const off = ss(seg(t, wordT('l05', 'nagsasara'), wordT('l05', 'nagsasara') + 1.5));
  sky('#04060e', '#121a33', -600, 1000); stars(60, 1, t);
  coolingTower(330, 1080, 1.0, 1 - off, t); coolingTower(700, 1080, .8, 1 - off, t + 3);
  g.fillStyle = '#05070c'; g.fillRect(-600, 1080, W + 1200, 1200); line([[-600, 1080], [W + 600, 1080]], 4, 'rgba(238,236,228,.3)');
  pylon(90, 1080, 600, fr(t) % 24 < 12 && off < .9); pylon(960, 1080, 520, fr(t) % 24 < 12 && off < .9);
  curve([90 + 132, 600], [520, 760], [960 - 114, 660], 2, 'rgba(238,236,228,.4)');
  g.fillStyle = `rgba(255,220,140,${.8 * (1 - off)})`; for (let i = 0; i < 12; i++) g.fillRect(470 + i * 14, 1040, 8, 10);
  if (off > .2 && off < .9 && fr(t) % 6 < 2) { reset(); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, 0, W, H); }
};
// 6. one by one, the lights go out
S.lights = (t, u) => {
  const t0 = LN.l06.t0, lit = 1 - ss(seg(t, t0 + .5, LN.l06.t1 + .2));
  cam(CX, 760, lerp(1.0, 1.1, seg(u, 0, 3)));
  sky('#04060d', '#0b1124', -600, 1000); stars(80, 1 - lit * .7, t);
  skyline(t, { lit, baseY: 1100, seed: 11, rimA: .25 + .1 * lit });
  g.fillStyle = '#020306'; g.fillRect(-600, 1100, W + 1200, 1200);
  glow(CX, 1100, 900, '255,200,120', .25 * lit);
};
// 7. Earth goes dark
S.earth = (t, u) => {
  fill('#000'); cam(CX, 760, lerp(.9, 1.1, seg(u, 0, 2.5)));
  stars(140, 1, t);
  globe(CX, 760, 400, t, 1 - ss(seg(t, LN.l07.t0, LN.l07.t1 + .2)));
};
// 8. day two: the subway tunnels flood
S.subway = (t, u) => {
  fill('#020306'); cam(CX, 760, lerp(1.0, 1.15, seg(u, 0, 4)));
  for (let i = 9; i >= 0; i--) { const s = Math.pow(.72, i), r = 620 * s, y = 760 + 200 * s; g.beginPath(); g.arc(CX, y, r, Math.PI, TAU); g.lineTo(CX + r, y + 500 * s); g.lineTo(CX - r, y + 500 * s); g.closePath(); g.strokeStyle = `rgba(150,175,230,${.08 + .4 * s})`; g.lineWidth = 6 * s + 1; g.stroke(); if (i % 3 === 0) { const ex = CX + r * .8, ey = y - r * .3; glow(ex, ey, 60 * s + 10, '227,18,43', .6 * (fr(t) % 20 < 14 ? 1 : .2)); circ(ex, ey, 6 * s + 2, RED); } }
  for (const sg of [-1, 1]) line([[CX + sg * 20, 900], [CX + sg * 420, 1500]], 8, 'rgba(238,236,228,.45)');
  const lv = lerp(1500, 1100, ss(seg(t, wordT('l08', 'Binabaha') - .3, LN.l08.t1)));
  const wg = g.createLinearGradient(0, lv, 0, 1700); wg.addColorStop(0, 'rgba(60,110,190,.55)'); wg.addColorStop(1, 'rgba(10,20,40,.95)'); g.fillStyle = wg; g.fillRect(-300, lv, W + 600, 1200);
  for (let i = 0; i < 7; i++) { const yy = lv + 10 + i * 40, ph = t * 2 + i; g.beginPath(); for (let x = -200; x <= W + 200; x += 40) g.lineTo(x, yy + Math.sin(x * .02 + ph) * 6); g.strokeStyle = `rgba(160,200,255,${.35 - i * .04})`; g.lineWidth = 3; g.stroke(); }
  for (let i = 0; i < 4; i++) { const p = (t * .1 + i * .25) % 1; g.save(); g.translate(lerp(200, 880, hash(i)), lv - 6 + Math.sin(t * 2 + i) * 6); g.rotate(Math.sin(t + i) * .3); g.fillStyle = 'rgba(238,236,228,.5)'; g.fillRect(-30, -8, 60, 16); g.restore(); }
};
// 9. day three: no signal
S.phone = (t, u) => {
  fill('#04060c'); cam(CX, 760, lerp(1.05, 1, eo(seg(u, 0, .4))), 0, u < .3 ? 6 : 0, t);
  glow(CX, 760, 700, '60,90,200', .18);
  phoneUI(CX, 820, .92, t, { mode: 'nosignal' });
  if (Math.floor(t * 8) % 13 === 0) glitch(t, .4);
};
// 10. week one: hungry dogs hunt in packs
S.dogs = (t, u) => {
  cam(CX, 760, lerp(1, 1.12, seg(u, 0, 4)));
  sky('#05070e', '#141c33', -600, 1000); stars(50, .8, t); skyline(t, { lit: 0, baseY: 960, seed: 21, rimA: .25 });
  g.fillStyle = '#06080f'; g.fillRect(-600, 960, W + 1200, 1200); road(t, { y0: 960, dash: 0, cracks: .5 });
  const p = seg(u, 0, LN.l10.t1 - LN.l10.t0 + .3);
  [[-200, 1240, .55, 0], [-60, 1300, .7, 1], [-320, 1330, .75, 2], [-140, 1420, .9, 3]].forEach(([x, y, s, i]) => dog(x + p * 900 + i * 40, y, s * 1.35, t, { phase: i * 1.3, eyes: ss(seg(t, wordT('l10', 'gutom'), wordT('l10', 'gutom') + .4)) }));
};
// 11. month one: talking to yourself on a rooftop
S.roof = (t, u) => {
  cam(CX, 760, lerp(1.0, 1.1, seg(u, 0, 4)));
  sky('#04060c', '#101830', -600, 1100); stars(90, 1, t); circ(820, 260, 60, '#e6ecff'); glow(820, 260, 260, '200,215,255', .3);
  skyline(t, { lit: 0, baseY: 1300, seed: 31, rimA: .2, scale: .8 });
  g.fillStyle = '#0a0e18'; g.fillRect(200, 1060, 700, 900); line([[200, 1060], [900, 1060]], 8, 'rgba(238,236,228,.6)', 10);
  const talking = wordAt('l11', t) >= 0;
  stick(540, 1060, 300, { t, sit: 1, arms: 'talk', eyes: 'open', look: .4, mouth: talking ? .3 + .3 * Math.abs(Math.sin(t * 14)) : 0 });
};
// 12. one night... something answers
S.night = (t, u) => {
  fill('#000'); cam(CX, 760, lerp(1, 1.3, ei(seg(u, 0, LN.l12.t1 - LN.l12.t0))));
  glow(CX, 900, 300, '120,140,200', .1);
  stick(CX + 120, 1150, 300, { t, eyes: 'wide', look: -1, sweat: 1, col: 'rgba(238,236,228,.8)', rim: 6 });
  const a = ss(seg(t, wordT('l12', 'sumagot') - .2, wordT('l12', 'sumagot') + .2));
  shadow(CX - 220, 1200, 900, { t, alpha: a, eyes: a });
};
// 13. the scare
S.scare = (t, u) => {
  const f = fr(t);
  if (u < .05) { fill('#fff'); return; }
  fill(f % 2 ? '#2a0006' : '#140003');
  reset(); const bg = g.createRadialGradient(CX, 900, 100, CX, 900, 1100); bg.addColorStop(0, 'rgba(120,10,20,.9)'); bg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  cam(CX, 900 - 230, lerp(1.7, 1.0, eo(seg(u, .05, .25))), (hash(f) - .5) * .08, 34, t);
  g.translate(0, 230);
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, wv = Math.sin(t * 9 + i) * 40; g.beginPath(); g.moveTo(CX + Math.cos(a) * 480, 950 + Math.sin(a) * 700); g.quadraticCurveTo(CX + Math.cos(a) * 600 + wv, 950 + Math.sin(a) * 820, CX + Math.cos(a + .2) * 700, 950 + Math.sin(a + .2) * 900); g.strokeStyle = '#000'; g.lineWidth = 40; g.lineCap = 'round'; g.stroke(); }
  g.fillStyle = '#000'; ell(CX, 950, 520, 760); g.fill(); ell(CX, 1750, 700, 400); g.fill();
  for (const sg of [-1, 1]) {
    const ex = CX + sg * 190, ey = 760;
    glow(ex, ey, 260, '255,255,255', .35); ell(ex, ey, 120, 80, sg * .25); g.fillStyle = '#fff'; g.fill();
    g.save(); g.clip(); g.strokeStyle = 'rgba(200,20,30,.7)'; g.lineWidth = 3; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(ex + sg * 120, ey + (hash(k) - .5) * 80); g.lineTo(ex + sg * 40, ey + (hash(k + 4) - .5) * 40); g.stroke(); } g.restore();
    circ(ex + (hash(f + sg) - .5) * 14, ey, 18, RED); circ(ex, ey, 7, '#000');
  }
  const mo = lerp(.5, 1.3, eo(seg(u, .05, .4))), my = 1180, mw = 230, mh = 200 * mo;
  ell(CX, my, mw, mh); g.fillStyle = '#1a0004'; g.fill(); g.fillStyle = '#f4efe6';
  for (const sg of [-1, 1]) for (let i = 0; i < 9; i++) { const x = CX - mw * .9 + i * mw * .225, yb = my + sg * mh * Math.sqrt(Math.max(0, 1 - ((x - CX) / mw) ** 2)) * .92; g.beginPath(); g.moveTo(x - 20, yb); g.lineTo(x + 20, yb); g.lineTo(x, yb - sg * (50 + 30 * hash(i + sg))); g.closePath(); g.fill(); }
  glitch(t, 1);
  if (u > .9) fill('#000');
};
// 14. the truth: the voice is your brain
S.truth = (t, u) => {
  fill('#000');
  const st = 1 - seg(u, 0, .35);
  cam(CX, 760, lerp(1.15, 1, eo(seg(u, .2, .8))));
  glow(CX, 700, 500, '242,167,181', .18);
  head(CX, 720, 330, { eyes: 'wide', t });
  g.save(); g.globalAlpha = .9; brain(CX, 500, .5, t); g.restore();
  for (let i = 0; i < 4; i++) { const p = (t * 1.2 + i / 4) % 1; g.save(); g.globalAlpha = (1 - p) * .7; g.beginPath(); g.arc(CX, 500, 120 + p * 360, -2.6, -.5); g.strokeStyle = '#f2a7b5'; g.lineWidth = 8; g.stroke(); g.restore(); }
  if (st > 0) { reset(); for (let i = 0; i < 1200; i++) { const v = hash(fr(t) * 13 + i) * 255; g.fillStyle = `rgba(${v},${v},${v},${st})`; g.fillRect(hash(i + fr(t)) * W, hash(i * 3.1 + fr(t)) * H, 26, 5); } }
};
// 15. the experiment: 15 minutes in total darkness
S.study = (t, u) => {
  fill('#010102'); cam(CX, 760, lerp(1, 1.12, seg(u, 0, 6)));
  const L = LN.l14, p = seg(t, L.t0, L.t1);
  // the chair and the person
  line([[CX - 90, 1250], [CX - 90, 1050], [CX + 70, 1050], [CX + 70, 1250]], 8, 'rgba(238,236,228,.35)'); line([[CX - 90, 1050], [CX - 90, 850]], 8, 'rgba(238,236,228,.35)');
  stick(CX, 1250, 330, { t, sit: 1, eyes: p > .55 ? 'wide' : 'open', look: Math.sin(t * 3) * (p > .55 ? 1 : .2), sweat: p > .55 ? 1 : 0, col: 'rgba(238,236,228,.75)', rim: 6 });
  // the clock
  const m = Math.max(0, 15 - Math.floor(p * 15)), sec = Math.floor((p * 15 * 60) % 60);
  reset(); text(`${String(m).padStart(2, '0')}:${String(59 - sec).padStart(2, '0')}`, CX, 420, 120, RED, 'Anton', 'center', 0, .9);
  cam(CX, 760, lerp(1, 1.12, seg(u, 0, 6)));
  // faces in the dark, one after another
  const tf = wordT('l14', 'mukha') - .8;
  for (let i = 0; i < 7; i++) { const a = ss(seg(t, tf + i * .15, tf + i * .15 + .4)) * (.4 + .3 * Math.sin(t * 3 + i)); if (a <= 0) continue; const fx = 140 + hash(i * 9) * 800, fy = 500 + hash(i * 4) * 500; g.save(); g.globalAlpha = a; circ(fx, fy, 60, 'rgba(238,236,228,.6)', 4); for (const sg of [-1, 1]) circ(fx + sg * 20, fy - 10, 7, '#fff'); curve([fx - 18, fy + 25], [fx, fy + 10 + 10 * Math.sin(i)], [fx + 18, fy + 25], 4, 'rgba(238,236,228,.6)'); g.restore(); }
};
// 16. when there is no one, your brain makes them
S.brain = (t, u) => {
  fill('#06080f'); cam(CX, 760, 1);
  glow(CX, 620, 500, '242,167,181', .25);
  brain(CX, 620, 1.1, t);
  const tg = wordT('l15', 'gumagawa');
  for (let i = 0; i < 6; i++) { const p = seg(t, tg + i * .12, tg + i * .12 + 1.2); if (p <= 0) continue; const a = -Math.PI / 2 + (i - 2.5) * .5, x = CX + Math.cos(a) * lerp(100, 420, eo(p)), y = 620 + Math.sin(a) * lerp(60, 200, eo(p)) + lerp(0, 600, eo(p)); g.save(); g.globalAlpha = .9 * (1 - p * .3); stick(x, y, 220, { t: t + i, col: 'rgba(242,167,181,.9)', face: false, rim: 12 }); g.restore(); }
};
// 17. what breaks you first: not hunger. loneliness.
S.lonely = (t, u) => {
  fill('#030407'); cam(CX, 760, lerp(1.2, 1, eo(seg(u, 0, 2))));
  glow(CX, 1100, 400, '200,210,255', .12);
  stick(CX, 1250, 280, { t, arms: 'hug', eyes: 'shut', col: 'rgba(238,236,228,.9)' });
  const th = wordT('l16', 'Hindi'), tp = wordT('l16', 'pag-iisa');
  reset();
  if (t > th) { const k = back(seg(t, th, th + .2), 2); g.save(); g.translate(CX, 420); g.scale(k, k); text('GUTOM', 0, 0, 110, 'rgba(238,236,228,.6)', 'Anton'); line([[-190, 10], [190, -10]], 14, RED); g.restore(); }
  if (t > tp) { const k = back(seg(t, tp, tp + .25), 2); g.save(); g.translate(CX, 640); g.scale(k, k); g.shadowColor = RED; g.shadowBlur = 50; text('PAG-IISA', 0, 0, 190, RED, 'Creepster', 'center', 12); g.restore(); if (t < tp + .2) glitch(t, .5); }
};
// 18. year one: grass and deer
S.y1 = (t, u) => {
  cam(CX, 760, lerp(1, 1.1, seg(u, 0, 5)));
  sky('#8fb3d9', '#e8d9b5', -600, 860); glow(850, 300, 300, '255,240,200', .5);
  skyline(t, { lit: 0, baseY: 880, seed: 41, dark: '#3a4252', rimA: .2, vines: .3, scale: .75 });
  g.fillStyle = '#4a5a3a'; g.fillRect(-600, 880, W + 1200, 1200); road(t, { y0: 880, dash: 0, grass: 1, cracks: .7 });
  deer(280 + seg(u, 0, 6) * 160, 1320, .7, t); deer(760 - seg(u, 0, 6) * 80, 1200, .5, t, { dir: -1, phase: 2 });
};
// 19. year ten: rust and fallen roofs
S.y10 = (t, u) => {
  cam(CX, 760, lerp(1.08, 1, seg(u, 0, 4)));
  sky('#6e7d8f', '#c9bfa5', -600, 900);
  house(260, 1100, 1.0, ss(seg(t, wordT('l18', 'lahat') - .6, wordT('l18', 'lahat')))); house(820, 1080, .8, 1);
  g.fillStyle = '#3e4a32'; g.fillRect(-600, 1100, W + 1200, 1200);
  for (let i = 0; i < 40; i++) { const x = hash(i) * W, hh = 30 + 60 * hash(i + 3); curve([x, 1100], [x + 10, 1100 - hh / 2], [x + Math.sin(t + i) * 6, 1100 - hh], 5, 'rgba(90,140,70,.9)'); }
  const r = ss(seg(t, wordT('l18', 'Kalawang') - .3, wordT('l18', 'Kalawang') + .8));
  car(330, 1350, 1.0, { rust: r, vines: r }); car(800, 1450, 1.1, { rust: r * .9, vines: r, dir: -1 });
};
// 20. year one hundred: the city is a forest
S.y100 = (t, u) => {
  cam(CX, 760, lerp(1, 1.12, seg(u, 0, 4)));
  sky('#5f7f73', '#d8d2a8', -600, 900);
  skyline(t, { lit: 0, baseY: 1000, seed: 51, dark: '#2b3530', rimA: .15, ruin: 1, vines: 1, scale: .9 });
  g.fillStyle = '#1d3322'; g.fillRect(-600, 1000, W + 1200, 1200);
  for (let i = 0; i < 9; i++) tree(-40 + i * 140 + hash(i) * 40, 1080 + hash(i + 2) * 200, 380 + 200 * hash(i + 5), t);
  for (let i = 0; i < 6; i++) { const p = (t * .07 + i / 6) % 1; circ(lerp(-50, W + 50, p), 500 + 40 * Math.sin(t + i), 4, 'rgba(30,30,30,.7)'); }   // birds
};
// 21. ten thousand years: almost no trace
S.y10k = (t, u) => {
  cam(CX, 760, lerp(1.15, 1, seg(u, 0, 4)));
  sky('#0b1430', '#3b3f6a', -600, 1000); stars(120, 1, t);
  for (let k = 0; k < 3; k++) { g.fillStyle = ['#151d38', '#111830', '#0b1022'][k]; g.beginPath(); g.moveTo(-200, 1000); for (let x = -200; x <= W + 200; x += 60) g.lineTo(x, 900 + k * 60 - 120 * Math.abs(Math.sin(x * .004 + k * 2)) * (1 - k * .2)); g.lineTo(W + 200, 1700); g.lineTo(-200, 1700); g.fill(); }
  // the last tip of a building, almost buried
  g.fillStyle = '#05070c'; g.beginPath(); g.moveTo(640, 1120); g.lineTo(660, 1040); g.lineTo(700, 1050); g.lineTo(712, 1120); g.fill(); line([[640, 1120], [660, 1040], [700, 1050], [712, 1120]], 3, 'rgba(238,236,228,.5)');
  for (let i = 0; i < 8; i++) tree(80 + i * 130, 1180 + hash(i) * 120, 220 + 120 * hash(i + 3), t);
};
// 22. you: the last one who remembers
S.last = (t, u) => {
  cam(CX, 760, lerp(1.0, 1.1, seg(u, 0, 4)));
  sky('#ff7a45', '#2a1838', -600, 900); glow(CX, 800, 650, '255,160,90', .75); circ(CX, 800, 170, '#ffcf8a');
  skyline(t, { lit: 0, baseY: 1000, seed: 61, dark: '#120a14', rimA: 0, ruin: 1, vines: .6, scale: .8, gap: 230 });
  g.fillStyle = '#0a060c'; g.fillRect(-600, 1000, W + 1200, 1200);
  g.beginPath(); g.moveTo(CX - 330, 1000); g.quadraticCurveTo(CX - 120, 900, CX, 905); g.quadraticCurveTo(CX + 140, 905, CX + 340, 1000); g.closePath(); g.fill();   // rubble mound
  stick(CX, 908, 280, { t, face: false, col: '#06030a', rim: 0 });
};
// 23. the twist: the world doesn't need us; we need each other
S.twist = (t, u) => {
  fill('#000'); reset();
  const tp = wordT('l22', 'Pero');
  const a1 = ss(seg(t, LN.l22.t0, LN.l22.t0 + .3)), a2 = ss(seg(t, tp, tp + .3));
  text('HINDI TAYO KAILANGAN', CX, 560, 92, `rgba(238,236,228,${a1 * (t > tp ? .45 : 1)})`, 'Anton'); text('NG MUNDO.', CX, 670, 92, `rgba(238,236,228,${a1 * (t > tp ? .45 : 1)})`, 'Anton');
  if (a2 > 0) { g.save(); g.shadowColor = RED; g.shadowBlur = 40; text('PERO KAILANGAN NATIN', CX, 880, 92, `rgba(227,18,43,${a2})`, 'Anton'); text('ANG ISA’T ISA.', CX, 990, 110, `rgba(227,18,43,${a2})`, 'Anton'); g.restore(); }
  cam(CX, 760, 1);
  stick(CX - 70, 1300, 240, { t, face: false, col: 'rgba(238,236,228,.8)', arms: 'down' }); stick(CX + 70, 1300, 240 * a2 + .1, { t, face: false, col: `rgba(238,236,228,${.8 * a2})` });
};
// 24. message someone you miss, now
S.text = (t, u) => {
  fill('#04060c'); cam(CX, 760, lerp(1.05, 1, eo(seg(u, 0, .4))));
  glow(CX, 760, 700, '60,110,255', .22);
  const msg = 'Kumusta ka? Miss na kita.', L = LN.l23, p = seg(t, L.t0, L.t1 - .3);
  phoneUI(CX, 820, .92, t, { mode: 'chat', typed: p < 1 ? msg.slice(0, Math.floor(p * msg.length)) : '', sent: p >= 1 ? 1 : 0 });
};
// 25. the comment question
S.cta = (t, u) => {
  fill('#000'); cam(CX, 760, 1); reset();
  const k = back(seg(u, 0, .25), 2);
  g.save(); g.translate(CX, 640); g.scale(k, k);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-420, -220, 840, 420, 50); g.fill(); g.beginPath(); g.moveTo(-260, 195); g.lineTo(-320, 300); g.lineTo(-150, 195); g.fill();
  text('ANO’NG UNANG', 0, -90, 110, '#000', 'Anton'); text('GAGAWIN MO?', 0, 40, 130, RED, 'Anton');
  g.restore();
  const b = Math.sin(t * 6) * 14; text('👇', CX, 1050 + b, 120, '#fff');
};
// 26. loop: the empty crossing... and the crowd flickers back in (= frame 1)
S.loop = (t, u) => {
  cam(CX, 980, 1.08);
  crosswalk(t, { people: u > .45 ? 1 : 0, flicker: u > .45 && u < .9 ? 1 : 0 });
  stick(CX, 1490, 440, { t, eyes: 'wide', look: Math.sin(t * 5) });
};
function brain(x, y, s, t, draw = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const pts = []; for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU, r = 170 + 16 * Math.sin(a * 9) + 9 * Math.sin(a * 5 + 1); pts.push([Math.cos(a) * r * 1.2, Math.sin(a) * r * .82]); }
  const n = Math.max(2, Math.floor(pts.length * draw));
  if (draw >= 1) { path(pts); const bg = g.createRadialGradient(-40, -60, 20, 0, 0, 230); bg.addColorStop(0, '#3a1c2c'); bg.addColorStop(1, '#12070d'); g.fillStyle = bg; g.fill(); }
  path(pts.slice(0, n)); g.save(); g.shadowColor = 'rgba(242,167,181,.8)'; g.shadowBlur = 20; g.strokeStyle = '#f2a7b5'; g.lineWidth = 11; g.lineJoin = 'round'; g.stroke(); g.restore();
  if (draw >= 1) {
    line([[0, -140], [12, -60], [-8, 20], [6, 120]], 7, '#f2a7b5');
    for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) curve([sg * (40 + k * 30), -120 + k * 60], [sg * (90 + k * 20), -90 + k * 60], [sg * (60 + k * 35), -40 + k * 55], 6, 'rgba(242,167,181,.85)');
    line([[60, 120], [90, 190], [70, 240]], 14, '#f2a7b5');
  }
  g.restore();
}
// a full stick body lying flat (diagram), the brain glowing in the head; locks on the limbs

function glitch(t, amt) {     // horizontal slice displacement + a colour split
  reset(); const f = fr(t);
  for (let i = 0; i < 9; i++) { const y = Math.floor(hash(f * 7 + i) * H), h = 20 + Math.floor(hash(f + i * 3) * 120), dx = (hash(f * 3 + i) - .5) * 160 * amt; g.drawImage(cv, 0, y, W, h, dx, y, W, h); }
  g.globalCompositeOperation = 'screen'; g.globalAlpha = .25 * amt; g.drawImage(cv, 12 * amt, 0); reset();
}
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .35; g.filter = 'blur(14px)'; g.drawImage(cv, 0, 0); reset(); }
function grain(t) {
  reset(); const f = fr(t); g.globalAlpha = .07;
  for (let i = 0; i < 700; i++) { g.fillStyle = i % 2 ? '#fff' : '#000'; g.fillRect(hash(f * 13.1 + i) * W, hash(f * 7.7 + i * 3.3) * H, 3, 3); }
  g.globalAlpha = 1;
}


// ---------- frame ----------
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) SHOTS.push([i ? SHOTS[i - 1][1] : 0, i < ls.length - 1 ? ls[i + 1].t0 : TL.dur, ls[i].shot]); }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  S[sh[2]](t, u);
  bloom();
  reset(); if (u < .07 && sh[2] !== 'scare') { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, 0, W, H); }
  vignette(.65);
  if (!['scare', 'loop1', 'truth', 'study', 'brain', 'lonely', 'last', 'twist', 'text', 'cta', 'loop'].includes(sh[2])) counter(t);
  if (!['scare', 'twist', 'cta'].includes(sh[2])) captions(t);
  grain(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('80px Creepster')]).then(() => true);

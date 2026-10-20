// Bangungot: dark stickman horror reel, 1080x1920. Deterministic in t: window.renderAt(t).
// The timeline (timeline.json) comes from the narrator: every shot starts when its line starts, so there is no dead air.
const W = 1080, H = 1920, CX = W / 2, TAU = Math.PI * 2;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const TL = await (await fetch('timeline.json')).json();
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
const wordT = (id, w) => { const l = LN[id]; const x = l && l.words && l.words.find(v => v[0].toLowerCase().replace(/[^a-z']/g, '').startsWith(w.toLowerCase())); return x ? x[1] : (l ? l.t0 : 0); };

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

// ---------- shots ----------
const S = {};
// 1. the hook: two eyes snap open, 3:00 AM
S.eyes = (t, u) => {
  fill('#000');
  const open = t < .06 ? 0 : back(seg(t, .06, .22), 2.5);
  cam(CX, 760, lerp(1.2, 1.02, eo(seg(t, 0, 3.3))), 0, t < .4 ? 10 : 0, t);
  glow(CX, 760, 760, '90,110,170', .18);
  for (const sg of [-1, 1]) curve([CX + sg * 380, 560], [CX + sg * 220, 470], [CX + sg * 60, 545], 10, INK, 12);
  const look = t > .6 && t < 2.6 ? Math.sin(t * 7) * .8 : 0;
  for (const sg of [-1, 1]) bigEye(CX + sg * 235, 760, 190, { open, look, pupil: lerp(.7, .35, seg(t, .1, .5)), red: .8 });
  for (let i = 0; i < 2; i++) { const p = (t * .4 + i * .5) % 1; g.save(); g.globalAlpha = 1 - p; ell(CX + (i ? 470 : -460), 600 + p * 300, 12, 20); g.fillStyle = '#bcd6ff'; g.fill(); g.restore(); }
  reset(); g.save(); g.shadowColor = 'rgba(227,18,43,.9)'; g.shadowBlur = 40; text('3:00 AM', CX, 250, 160, RED, 'Anton', 'center', 0, ss(seg(t, .15, .4)) * (fr(t) % 12 < 9 ? 1 : .55)); g.restore();
};
// 2. wide: in bed, cannot move
S.bed = (t, u) => { cam(560, 850, lerp(1.0, 1.15, ss(seg(u, 0, 1.4)))); room(t); sleeper(t, { eyes: 'wide', look: Math.sin(t * 8), sweat: .6 }); };
// 3. the hand that will not move, then the scream with no sound
S.struggle = (t, u) => {
  const L = LN.l03, half = L.words[6] ? L.words[6][1] : L.t0 + 1.8;
  if (t < half) {
    fill('#070a12'); cam(CX, 760, lerp(1.0, 1.08, seg(t, L.t0, half)), 0, 2, t);
    const bgr = g.createLinearGradient(0, 600, 0, 1300); bgr.addColorStop(0, '#22315a'); bgr.addColorStop(1, '#0c1222'); g.fillStyle = bgr; g.fillRect(-200, 600, W + 400, 900);
    for (let i = 0; i < 7; i++) curve([-100 + i * 200, 650], [i * 200, 800 + 40 * Math.sin(i)], [100 + i * 200, 1300], 4, 'rgba(160,185,235,.2)');
    glow(CX + 150, 500, 600, '157,179,220', .15);
    const px = CX, py = 820, tr = (hash(fr(t)) - .5) * 3;
    line([[px - 40, 1350], [px - 10, 900]], 22, INK, 16);
    ell(px, py, 120, 95, -.15); g.fillStyle = '#0b0f19'; g.fill(); g.save(); g.shadowColor = RIM; g.shadowBlur = 16; g.strokeStyle = INK; g.lineWidth = 12; g.stroke(); g.restore();
    for (let i = 0; i < 4; i++) {
      const bx = px - 90 + i * 60, by = py - 70 - (i === 1 || i === 2 ? 10 : 0), L1 = [70, 82, 78, 60][i];
      const j1 = [bx + tr, by - L1], j2 = [bx + tr * 1.5 + 6, by - L1 * 1.8];
      line([[bx, by], j1, j2], 14, INK, 10); circ(j1[0], j1[1], 9, INK); circ(bx, by, 10, INK);
    }
    line([[px + 110, py - 10], [px + 190 + tr, py - 70], [px + 240 + tr, py - 130]], 14, INK, 10);
    for (let i = 0; i < 6; i++) line([[px + 40 + i * 12, py + 20], [px + 46 + i * 12, py + 34]], 3, 'rgba(238,236,228,.3)');
    reset(); text('GALAW...', CX, 360, 120, 'rgba(238,236,228,.22)', 'Anton');
  } else {
    fill('#000'); cam(CX, 700, lerp(1.0, 1.12, seg(t, half, L.t1)), 0, 6, t);
    glow(CX, 700, 700, '90,110,170', .15);
    head(CX, 700, 420, { eyes: 'wide', look: 0, mouth: ss(seg(t, half, half + .3)), sweat: 1, t });
    for (let i = 0; i < 3; i++) { const p = ((t - half) * 1.5 + i / 3) % 1; g.save(); g.globalAlpha = (1 - p) * .5; g.beginPath(); g.arc(CX, 900, 120 + p * 300, .3 * Math.PI, .7 * Math.PI); g.strokeStyle = INK; g.lineWidth = 6; g.setLineDash([10, 18]); g.stroke(); g.restore(); }
  }
};
// 4. something is watching: the eye slides, a silhouette in the pupil
S.feel = (t, u) => {
  fill('#000'); const tk = wordT('l04', 'nakatingin');
  cam(CX, 760, lerp(1.0, 1.25, ss(seg(u, 0, 2))));
  glow(CX, 760, 760, '90,110,170', .14);
  bigEye(CX, 760, 330, { open: 1, look: -ss(seg(t, tk - .5, tk)), pupil: lerp(.4, .62, ss(seg(t, tk, tk + .5))), reflect: ss(seg(t, tk, tk + .4)), red: 1 });
  for (let i = 0; i < 2; i++) { const p = (t * .4 + i * .5) % 1; g.save(); g.globalAlpha = 1 - p; ell(CX + 380, 600 + p * 400, 14, 22); g.fillStyle = '#bcd6ff'; g.fill(); g.restore(); }
};
// 5. the corner: push in, it is standing there
S.corner = (t, u) => {
  const p = ss(seg(u, 0, 1.6));
  cam(lerp(560, 230, p), lerp(850, 640, p), lerp(1.0, 1.6, p));
  room(t);
  const app = ss(seg(t, wordT('l05', 'nakatayo') - .3, wordT('l05', 'nakatayo') + .2));
  shadow(150, 1170, 1100, { t, alpha: lerp(.2, 1, app), eyes: app });
  sleeper(t, { eyes: 'wide', look: -1, sweat: 1 });
};
// 6. it comes closer: one jump per word
S.approach = (t, u) => {
  const L = LN.l06, k = Math.max(0, wordAt('l06', t)), stage = k <= 1 ? 0 : k <= 2 ? 1 : 2;
  const pos = [[260, 1170, 1150], [440, 1240, 1450], [600, 1700, 2300]][stage];
  cam(560, 850, 1 + stage * .06, 0, 4 + stage * 4, t);
  room(t, { flick: stage === 2 && fr(t) % 4 === 0 ? .5 : 0 });
  sleeper(t, { eyes: 'wide', look: -1, struggle: 1, sweat: 1 });
  shadow(pos[0], pos[1], pos[2], { t, hunch: .3 + stage * .15, arms: stage * .25 });
  if (L.words.some(w => t >= w[1] && t < w[1] + .05)) { reset(); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, 0, W, H); }
};
// 7. it sits on your chest
S.chest = (t, u) => {
  const press = ss(seg(t, wordT('l07', 'umupo'), wordT('l07', 'umupo') + .5));
  cam(480, 850, lerp(1.35, 1.6, seg(u, 0, 2)), 0, 3 + 8 * press, t);
  room(t); sleeper(t, { eyes: 'wide', look: 0, struggle: 1, mouth: .35 * press, sweat: 1, press });
  const cx = lerp(1000, 520, ss(seg(t, LN.l07.t0, wordT('l07', 'umupo') + .3))), cy = 800 + press * 30;
  g.save(); g.shadowColor = '#000'; g.shadowBlur = 50; g.fillStyle = '#000';
  ell(cx, cy, 170, 140, -.2); g.fill(); ell(cx - 200, cy - 40 + Math.sin(t * 2) * 6, 70, 88, -.5); g.fill();
  g.lineCap = 'round'; g.strokeStyle = '#000';
  for (const sg of [-1, 1]) { g.lineWidth = 34; g.beginPath(); g.moveTo(cx - 70, cy + 40); g.quadraticCurveTo(cx - 180, cy + 100 + sg * 30, cx - 280 + sg * 50, cy + 110); g.stroke(); g.lineWidth = 9; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(cx - 280 + sg * 50, cy + 110); g.lineTo(cx - 330 + sg * 50 + k * 18, cy + 160 + Math.sin(t * 5 + k) * 6); g.stroke(); } }
  for (let i = 0; i < 10; i++) { const wv = Math.sin(t * 2 + i) * 20; g.beginPath(); g.moveTo(cx + (i - 5) * 30, cy - 120); g.quadraticCurveTo(cx + (i - 5) * 40 + wv, cy - 200, cx + (i - 5) * 50 + wv * 2, cy - 260); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 14; g.stroke(); }
  g.shadowBlur = 0; g.restore();
  for (const sg of [-1, 1]) { glow(cx - 212 + sg * 24, cy - 52, 50, '255,255,255', .45); circ(cx - 212 + sg * 24, cy - 52, 7, '#fff'); }
  vignette(.5 + .4 * press);
};
// 8. the choice: A = shut your eyes, B = look at it
S.choice = (t, u) => {
  fill('#000');
  const ta = wordT('l08', 'A'), tb = wordT('l08', 'B'), actA = t >= ta && t < tb, actB = t >= tb;
  for (const [i, act] of [[0, actA], [1, actB]]) {
    const y0 = i ? 760 : 0, hh = 740;
    reset(); g.save(); g.beginPath(); g.rect(0, y0, W, hh); g.clip();
    const bgc = g.createLinearGradient(0, y0, 0, y0 + hh); bgc.addColorStop(0, act ? (i ? '#2a0610' : '#101a33') : '#06080f'); bgc.addColorStop(1, '#020305'); g.fillStyle = bgc; g.fillRect(0, y0, W, hh);
    g.translate(0, y0);
    if (i) { shadow(200, 760, 700, { t, eyes: act ? 1 : .5 }); head(CX + 120, 420, 210, { eyes: 'wide', look: -1, sweat: 1, t }); }
    else head(CX, 420, 210, { eyes: 'shut', sweat: .6, t });
    g.restore(); reset();
    text(i ? 'B' : 'A', 110, y0 + 110, 170, act ? RED : 'rgba(238,236,228,.45)', 'Anton', 'center', 10);
    text(i ? 'TITINGNAN MO SIYA' : 'IPIPIKIT ANG MATA', CX + 60, y0 + 110, 72, act ? '#fff' : 'rgba(238,236,228,.45)', 'Anton', 'center', 8);
    if (act) { g.save(); g.shadowColor = RED; g.shadowBlur = 30; g.strokeStyle = RED; g.lineWidth = 10; g.strokeRect(14, y0 + 14, W - 28, hh - 28); g.restore(); }
  }
  reset(); g.fillStyle = '#000'; g.fillRect(0, 740, W, 20);
};
// 9. 3, 2, 1
S.count = (t, u) => {
  fill('#000'); const L = LN.count, k = Math.min(2, Math.floor((t - L.t0) / .6)), v = (t - L.t0) % .6;
  cam(CX, 760, lerp(1.25, 1, eo(v / .25)));
  glow(CX, 760, 520, '227,18,43', .3 * (1 - v / .6));
  g.save(); g.shadowColor = RED; g.shadowBlur = 60; text(String(3 - k), CX, 760, 560, RED, 'Anton'); g.restore();
  reset(); text('COMMENT  A  O  B', CX, 1470, 84, '#fff', 'Anton', 'center', 12);
};
// 10. only the eyes, closing in
S.dark = (t, u) => {
  fill('#000'); cam(CX, 700, lerp(1, 2.8, ei(seg(u, 0, 1.3))));
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t; g.beginPath(); g.moveTo(CX + Math.cos(a) * 160, 700 + Math.sin(a) * 160); g.quadraticCurveTo(CX + Math.cos(a + .4) * 260, 700 + Math.sin(a + .4) * 260, CX + Math.cos(a + .2) * 380, 700 + Math.sin(a + .2) * 380); g.strokeStyle = 'rgba(40,40,55,.6)'; g.lineWidth = 12; g.stroke(); }
  for (const sg of [-1, 1]) { glow(CX + sg * 40, 700, 140, '255,255,255', .45); circ(CX + sg * 40, 700, 12, '#fff'); }
};
// 11. the scare: the face, full frame, one second
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
  ell(CX, my, mw, mh); g.fillStyle = '#1a0004'; g.fill();
  g.fillStyle = '#f4efe6';
  for (const sg of [-1, 1]) for (let i = 0; i < 9; i++) {
    const x = CX - mw * .9 + i * mw * .225, yb = my + sg * mh * Math.sqrt(Math.max(0, 1 - ((x - CX) / mw) ** 2)) * .92;
    g.beginPath(); g.moveTo(x - 20, yb); g.lineTo(x + 20, yb); g.lineTo(x, yb - sg * (50 + 30 * hash(i + sg))); g.closePath(); g.fill();
  }
  glitch(t, 1);
  if (u > .9) fill('#000');
};
// 12. static, then the light comes on
S.hookback = (t, u) => {
  fill('#000');
  if (u > .35) { cam(560, 850, 1); room(t, { lit: ss(seg(u, .35, .7)) * (fr(t) % 7 === 0 ? .4 : 1), bulb: ss(seg(u, .35, .6)) }); sleeper(t, { eyes: 'open', look: 0 }); }
  const st = 1 - seg(u, 0, .45);
  if (st > 0) { reset(); for (let i = 0; i < 1400; i++) { const v = hash(fr(t) * 13 + i) * 255; g.fillStyle = `rgba(${v},${v},${v},${st})`; g.fillRect(hash(i + fr(t)) * W, hash(i * 3.1 + fr(t)) * H, 26, 5); } }
};
// 13. not a ghost: the shadow becomes a brain, the title
S.title = (t, u) => {
  fill('#000');
  const tt = wordT('l11', 'sleep'), m = ss(seg(t, LN.l11.t0, tt));
  cam(CX, 760, lerp(1.1, 1, eo(seg(t, tt, tt + .3))));
  shadow(CX, 1500, 1400, { t, alpha: 1 - m, eyes: 1 - m });
  g.globalAlpha = m; brain(CX, 640, 1.35, t, ss(seg(t, LN.l11.t0 + .3, tt))); g.globalAlpha = 1;
  if (t >= tt) {
    reset(); const k = back(seg(t, tt, tt + .25), 2);
    g.save(); g.translate(CX, 1130); g.scale(k, k); g.shadowColor = RED; g.shadowBlur = 40;
    text('SLEEP', 0, -90, 200, RED, 'Creepster', 'center', 12); text('PARALYSIS', 0, 100, 150, '#fff', 'Creepster', 'center', 12);
    g.restore();
    if (t < tt + .2) glitch(t, .6);
  }
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
function wiredBody(t, o = {}) {
  const { lock = 0, headWarm = 0, bodyCold = 0, zzz = 0 } = o;
  const hx = 230, hy = 760;
  if (headWarm) glow(hx, hy, 340, '255,180,80', .5 * headWarm);
  if (bodyCold) glow(660, 760, 520, '80,140,255', .38 * bodyCold);
  head(hx, hy, 120, { eyes: headWarm > .5 ? 'wide' : 'shut', t });
  g.save(); g.globalAlpha = .9; brain(hx, hy - 6, .4, t); g.restore();
  line([[350, 760], [760, 760]], 14, INK, 14);
  line([[430, 760], [540, 650], [640, 620]], 12, INK, 12); line([[430, 760], [540, 870], [640, 900]], 12, INK, 12);
  line([[760, 760], [880, 670], [1000, 690]], 12, INK, 12); line([[760, 760], [880, 850], [1000, 830]], 12, INK, 12);
  for (const [x, y] of [[640, 620], [640, 900]]) for (let k = 0; k < 4; k++) line([[x, y], [x + 26, y - 18 + k * 12]], 5);
  g.setLineDash([16, 14]); line([[hx + 70, hy], [740, hy - 50]], 6, 'rgba(242,167,181,.85)'); g.setLineDash([]);
  if (lock > 0) {
    for (const [x, y] of [[640, 620], [640, 900], [1000, 690], [1000, 830]]) {
      g.save(); g.globalAlpha = lock; g.shadowColor = RED; g.shadowBlur = 20; g.fillStyle = RED; g.fillRect(x - 26, y - 10, 52, 44); g.restore();
      g.save(); g.globalAlpha = lock; line([[x - 16, y - 10], [x - 16, y - 32], [x + 16, y - 32], [x + 16, y - 10]], 8, RED); circ(x, y + 10, 6, '#000'); g.restore();
    }
    g.save(); g.globalAlpha = lock; text('OFF', 520, 680, 84, RED, 'Anton', 'center', 8); g.restore();
  }
  if (zzz) for (let i = 0; i < 3; i++) { const p = (t * .8 + i / 3) % 1; text('z', 760 + p * 160, 660 - p * 260, 50 + p * 40, `rgba(120,170,255,${zzz * (1 - p)})`, 'Anton'); }
}
S.brain = (t, u) => {
  fill('#06080f'); cam(CX, 760, lerp(1.08, 1, eo(seg(u, 0, .4))));
  wiredBody(t, { lock: ss(seg(t, wordT('l12', 'pinaparalisa'), wordT('l12', 'pinaparalisa') + .4)) });
  reset(); text('REM SLEEP', CX, 330, 130, '#fff', 'Anton', 'center', 10);
  text('UTAK: “HUWAG KANG GAGALAW”', CX, 450, 56, '#f2a7b5', 'Anton', 'center', 6, ss(seg(t, wordT('l12', 'katawan'), wordT('l12', 'katawan') + .3)));
};
S.split = (t, u) => {
  fill('#06080f'); cam(CX, 760, 1);
  const wake = ss(seg(t, wordT('l13', 'nauunang'), wordT('l13', 'nauunang') + .4)), cold = ss(seg(t, wordT('l13', 'katawan'), wordT('l13', 'katawan') + .3));
  wiredBody(t, { lock: 1, headWarm: wake, bodyCold: cold, zzz: 1 });
  reset(); text('ISIP: GISING', 280, 360, 80, '#ffb84d', 'Anton', 'center', 8, wake); text('KATAWAN: TULOG', 740, 1150, 80, '#78aaff', 'Anton', 'center', 8, cold);
};
// 14. the dream leaks into the room
S.leak = (t, u) => {
  cam(560, 800, 1.05); room(t); sleeper(t, { eyes: 'wide', look: -1, sweat: .8 });
  const leak = ss(seg(t, wordT('l14', 'Kaya'), wordT('l14', 'anino') + .2));
  const bx = 330, by = 520, br = 210;
  const bub = g.createRadialGradient(bx, by, 20, bx, by, br); bub.addColorStop(0, '#1d2a52'); bub.addColorStop(1, '#0b1226');
  circ(bx, by, br, bub); circ(bx, by, br, INK, 7, 14);
  [[290, 800, 24], [310, 720, 36]].forEach(([x, y, r]) => { circ(x, y, r, '#0d1630'); circ(x, y, r, INK, 5, 10); });
  g.save(); g.beginPath(); g.arc(bx, by, br - 6, 0, TAU); g.clip(); shadow(bx, by + 190, 360, { t, alpha: 1 - leak * .8 }); g.restore();
  for (let i = 0; i < 9; i++) { const x = bx - 170 + i * 42, L = leak * (200 + 260 * hash(i)); g.beginPath(); g.moveTo(x, by + br * .7); g.quadraticCurveTo(x + Math.sin(t * 2 + i) * 20, by + br * .7 + L * .5, x, by + br * .7 + L); g.strokeStyle = 'rgba(0,0,0,.9)'; g.lineWidth = 16 + 8 * hash(i + 1); g.lineCap = 'round'; g.stroke(); circ(x, by + br * .7 + L, 10, '#000'); }
  shadow(150, 1170, 1100, { t, alpha: leak, eyes: leak });
};
// 15. the same shadow, all over the world
S.world = (t, u) => {
  fill('#04060c'); cam(CX, 700, 1);
  const r = 320, rot = t * .5, gx = CX, gy = 640;
  glow(gx, gy, 520, '80,110,200', .25);
  const gg = g.createRadialGradient(gx - 100, gy - 120, 40, gx, gy, r); gg.addColorStop(0, '#1b2b52'); gg.addColorStop(1, '#070c19'); circ(gx, gy, r, gg); circ(gx, gy, r, 'rgba(157,179,220,.9)', 6, 20);
  for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 8; ell(gx, gy, Math.abs(Math.cos(a)) * r, r); g.strokeStyle = 'rgba(157,179,220,.22)'; g.lineWidth = 3; g.stroke(); }
  for (let k = -2; k <= 2; k++) { ell(gx, gy + k * 110, Math.sqrt(r * r - (k * 110) ** 2), 24); g.strokeStyle = 'rgba(157,179,220,.18)'; g.stroke(); }
  const tk = wordT('l15', 'iisang');
  [[-.55, -.15], [.25, -.4], [.6, .1]].forEach(([px, py], i) => { const a = ss(seg(t, tk + i * .25, tk + i * .25 + .3)); if (a <= 0) return; const x = gx + px * r, y = gy + py * r; glow(x, y, 60, '227,18,43', .7 * a); circ(x, y, 10 * a, RED); line([[x, y], [gx + [-370, 0, 370][i], 1000]], 3, `rgba(227,18,43,${.5 * a})`); });
  [[-370, 1220], [0, 1260], [370, 1220]].forEach(([dx, y], i) => { const a = ss(seg(t, tk + i * .25, tk + i * .25 + .3)); shadow(CX + dx, y, 420, { t: t + i, alpha: a, eyes: a }); });
};
// 16. the names: batibat, kanashibari, old hag
S.names = (t, u) => {
  fill('#04060c'); cam(CX, 760, 1);
  const rows = [['PILIPINAS', 'BATIBAT', 'batibat'], ['JAPAN', 'KANASHIBARI', 'kanashibari'], ['CANADA', 'OLD HAG', 'Old']];
  rows.forEach(([c, n, w], i) => {
    const t0 = wordT('l16', w) - .5, a = eo(seg(t, t0, t0 + .25)); if (a <= 0) return;
    const y = 300 + i * 340;
    reset(); g.save(); g.translate(lerp(i % 2 ? 1200 : -1200, 0, a), 0);
    const pg = g.createLinearGradient(60, 0, W - 60, 0); pg.addColorStop(0, '#0d1528'); pg.addColorStop(1, '#05080f'); g.fillStyle = pg; g.fillRect(60, y - 140, W - 120, 280);
    g.strokeStyle = 'rgba(238,236,228,.35)'; g.lineWidth = 4; g.strokeRect(60, y - 140, W - 120, 280);
    text(c, 380, y - 55, 60, 'rgba(238,236,228,.75)', 'Anton', 'left'); g.save(); g.shadowColor = RED; g.shadowBlur = 24; text(n, 380, y + 40, 112, RED, 'Anton', 'left', 8); g.restore();
    g.save(); g.beginPath(); g.rect(64, y - 136, 290, 272); g.clip();
    if (i === 0) { g.fillStyle = '#000'; g.shadowColor = '#000'; g.shadowBlur = 20; ell(210, y + 60, 120, 90); g.fill(); ell(150, y - 30, 55, 50); g.fill(); g.shadowBlur = 0; for (const sg of [-1, 1]) circ(135 + sg * 18, y - 35, 5, '#fff'); }
    else if (i === 1) shadow(210, y + 150, 300, { t: t + i, hunch: .3, smoke: 0 });
    else { g.fillStyle = '#000'; g.shadowColor = '#000'; g.shadowBlur = 20; g.beginPath(); g.moveTo(210, y - 110); g.quadraticCurveTo(300, y - 60, 300, y + 140); g.lineTo(120, y + 140); g.quadraticCurveTo(120, y - 60, 210, y - 110); g.fill(); g.shadowBlur = 0; ell(205, y - 40, 34, 40); g.fillStyle = '#05080f'; g.fill(); for (const sg of [-1, 1]) circ(205 + sg * 12, y - 44, 4, '#fff'); line([[270, y + 20], [300, y + 140]], 5, '#3a3a3a'); }
    g.restore(); g.restore();
  });
};
// 17. 8 in 100
S.stat = (t, u) => {
  fill('#04060c'); cam(CX, 760, 1);
  const t0 = wordT('l17', 'walo'), lit = [12, 27, 35, 48, 51, 66, 73, 89];
  for (let i = 0; i < 100; i++) {
    const cx = 140 + (i % 10) * 89, cy = 230 + Math.floor(i / 10) * 92;
    const idx = lit.indexOf(i), on = idx >= 0 && t >= t0 + idx * .12, c = on ? RED : 'rgba(238,236,228,.3)';
    if (on) glow(cx, cy, 60, '227,18,43', .35);
    circ(cx, cy - 22, 12, c, 4); line([[cx, cy - 10], [cx, cy + 16]], 5, c); line([[cx - 14, cy + 2], [cx, cy - 4], [cx + 14, cy + 2]], 4, c); line([[cx - 12, cy + 34], [cx, cy + 16], [cx + 12, cy + 34]], 4, c);
  }
  const n = t >= t0 ? Math.min(8, Math.floor((t - t0) / .12) + 1) : 0;
  reset(); g.save(); g.shadowColor = RED; g.shadowBlur = 30; text(`${n} SA 100`, CX, 1240, 150, '#fff', 'Anton', 'center', 10); g.restore();
};
// 18. what to do
S.tips = (t, u) => {
  fill('#06080f'); cam(CX, 760, 1);
  const T2 = wordT('l18', 'Igalaw'), T3 = wordT('l18', 'huminga'), step = t >= T3 ? 2 : t >= T2 ? 1 : 0;
  reset(); text(['1. HUWAG LUMABAN', '2. IGALAW ANG DALIRI NG PAA', '3. HUMINGA NANG DAHAN-DAHAN'][step], CX, 300, step ? 66 : 84, '#fff', 'Anton', 'center', 8);
  cam(CX, 760, 1);
  if (step === 0) { head(CX, 700, 200, { eyes: 'shut', t }); for (const sg of [-1, 1]) line([[CX - 330, 700 - sg * 330], [CX + 330, 700 + sg * 330]], 20, RED); }
  if (step === 1) {
    line([[CX - 360, 700], [CX + 60, 700]], 16, INK, 14);
    g.beginPath(); g.moveTo(CX + 60, 640); g.quadraticCurveTo(CX + 260, 600, CX + 280, 700); g.quadraticCurveTo(CX + 260, 760, CX + 60, 760); g.closePath(); g.fillStyle = '#0b0f19'; g.fill(); g.save(); g.shadowColor = RIM; g.shadowBlur = 14; g.strokeStyle = INK; g.lineWidth = 10; g.stroke(); g.restore();
    for (let i = 0; i < 5; i++) { const x = CX + 200 + i * 22, y = 620 + i * 18, w = Math.sin(t * 14 + i * 1.3) * .5; line([[x, y], [x + Math.cos(-1.2 + w) * 50, y + Math.sin(-1.2 + w) * 50]], 11, INK, 10); }
    for (let i = 0; i < 3; i++) { const p = (t * 2 + i / 3) % 1; g.save(); g.globalAlpha = 1 - p; g.beginPath(); g.arc(CX + 280, 560, 60 + p * 80, -1.6, -.4); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); g.restore(); }
  }
  if (step === 2) { const b = .5 + .5 * Math.sin((t - T3) * 3); glow(CX, 700, 400, '120,170,255', .3 * b); circ(CX, 700, 130 + 110 * b, 'rgba(120,170,255,.18)'); circ(CX, 700, 130 + 110 * b, 'rgba(150,190,255,.95)', 8, 20); text(b > .5 ? 'HINGA...' : '...LABAS', CX, 700, 76, '#fff', 'Anton'); }
};
// 19. dawn: it passes
S.tips2 = (t, u) => {
  cam(560, 820, lerp(1.05, 1, seg(u, 0, 1))); room(t, { lit: ss(seg(u, 0, .8)) });
  shadow(150, 1170, 1100, { t, alpha: 1 - ss(seg(u, 0, .6)), eyes: 1 - ss(seg(u, 0, .4)) });
  sleeper(t, { eyes: 'open', look: 1 });
  reset(); g.save(); g.globalCompositeOperation = 'lighter'; glow(760, 420, 900, '255,190,120', .35 * ss(seg(u, 0, 1))); g.restore();
};
// 20. POV: the corner. empty... then not.
S.end = (t, u) => {
  const tk = wordT('l20', 'sulok'), p = ss(seg(u, 0, 2.6));
  cam(lerp(560, 200, p), lerp(850, 640, p), lerp(1, 1.9, p));
  room(t, { flick: t > tk - .3 && fr(t) % 3 === 0 ? .9 : 0 });
  if (t > tk) shadow(150, 1170, 1100, { t, eyes: 1, arms: .15 });
  sleeper(t, { eyes: 'wide', look: -1, sweat: 1 });
};
// 21. comment "OO"
S.cta = (t, u) => {
  fill('#000'); cam(CX, 760, 1);
  for (const sg of [-1, 1]) { glow(CX + sg * 40, 380, 140, '255,255,255', .45); circ(CX + sg * 40, 380, 12, '#fff'); }
  reset(); const k = back(seg(u, 0, .25), 2);
  g.save(); g.translate(CX, 760); g.scale(k, k);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-330, -150, 660, 260, 40); g.fill(); g.beginPath(); g.moveTo(-200, 100); g.lineTo(-250, 190); g.lineTo(-120, 100); g.fill();
  text('“OO”', 0, -20, 190, RED, 'Anton'); g.restore();
  text('KUNG NARANASAN MO NA', CX, 1000, 70, '#fff', 'Anton', 'center', 8, ss(seg(u, .2, .4)));
};
// 22. the eyes again (loops to frame 1)
S.loop = (t, u) => {
  fill('#000');
  if (u > .7) { cam(CX, 760, 1.2); const o = back(seg(u, .7, .95), 2.5); for (const sg of [-1, 1]) bigEye(CX + sg * 235, 760, 190, { open: o, pupil: .6, red: .8 }); }
  else { cam(CX, 760, 1); for (const sg of [-1, 1]) { glow(CX + sg * 40, 380, 140, '255,255,255', .45 * (1 - u / .7)); circ(CX + sg * 40, 380, 12, `rgba(255,255,255,${1 - u / .7})`); } }
};

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
  vignette(.7);
  if (!['scare', 'count', 'cta', 'choice'].includes(sh[2])) captions(t);
  grain(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('80px Creepster')]).then(() => true);

// chars.js: Mara (the protagonist, the only burgundy in the film), the guests, the staring eye, the T-shirt.
// Deco figure language: ~7 heads tall, streamlined, airbrushed hard-edged volumes with a gold rim on the lit side.
// Mara's local units: feet at (0,0), y down, head top at about -700.
import { C, TAU, clamp, lerp, mix, rgba, gline, airbrush, toPath, arcPts, glow, sparkle } from './engine/deco.js';

export const MC = { dress: '#8e1b2e', dressL: '#d4485c', dressD: '#35060f', skin: '#e9b98f', skinL: '#ffe0bd', skinD: '#a8684a', hair: '#0b0807', glove: '#f4ecdc', gloveD: '#b8a584', lip: '#b8243c' };
const LT = -2.3;   // light from upper left

function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
function capsule(x0, y0, r0, x1, y1, r1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || .001, a = Math.atan2(dy, dx);
  const s = clamp((r0 - r1) / L, -.99, .99), b = Math.acos(s);
  const p = new Path2D(); p.arc(x0, y0, r0, a + b, a - b + TAU, false); p.arc(x1, y1, r1, a - b, a + b, false); p.closePath(); return p;
}
// two-bone IK: shoulder S, hand target T, lengths a, b; bend = +1/-1 picks the elbow side
function ik(S, T, a, b, bend) {
  let dx = T[0] - S[0], dy = T[1] - S[1]; let d = Math.hypot(dx, dy);
  const dd = clamp(d, Math.abs(a - b) + 1, a + b - .5); const k = dd / (d || 1); dx *= k; dy *= k; d = dd;
  const ang = Math.atan2(dy, dx), cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), A = Math.acos(cosA) * bend;
  const E = [S[0] + Math.cos(ang + A) * a, S[1] + Math.sin(ang + A) * a];
  return { E, H: [S[0] + dx, S[1] + dy] };
}

// ---------- the head (used alone for close-ups) ----------
// face: 'neutral' | 'shock' | 'shut' | 'smile' | 'awake' | 'wince'; look: [-1..1, -1..1]; blink 0..1
export function maraHead(g, x, y, s, o = {}) {
  const { face = 'neutral', look = [0, 0], blink = 0, tilt = 0, blush = 0, light = 1 } = o;
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(tilt);
  // back hair (behind the neck)
  const hairBack = toPath([[-50, 40], [-60, -10], [-52, -62], [0, -84], [52, -62], [60, -10], [50, 40], [30, 30], [-30, 30]], true);
  airbrush(g, hairBack, { base: '#1a1310', dark: '#000000', light: '#3a2a20', dir: LT });
  // neck
  airbrush(g, toPath([[-10, 30], [10, 30], [12, 76], [-12, 76]], true), { base: MC.skinD, light: MC.skin, dir: LT });
  // face: an egg, lit plane on the upper left
  const facePath = new Path2D(); facePath.ellipse(0, 0, 37, 50, 0, 0, TAU);
  airbrush(g, facePath, { base: MC.skin, light: MC.skinL, dark: MC.skinD, dir: LT, rim: 1.4 });
  if (blush) { g.save(); g.clip(facePath); glow(g, -20, 16, 18, '#e0526a', .35 * blush); glow(g, 20, 16, 18, '#e0526a', .35 * blush); g.restore(); }
  // eyes (almond, heavy deco lids)
  const shut = face === 'shut' || face === 'wince' ? 1 : blink;
  for (const sg of [-1, 1]) {
    const ex = sg * 15, ey = -4, w = 11, open = face === 'shock' ? 1.45 : face === 'awake' ? 1.25 : face === 'smile' ? .0 : 1;
    if (face === 'smile') {         // happy arcs
      g.beginPath(); g.arc(ex, ey + 3, 8, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = '#1a0d08'; g.lineWidth = 2.6; g.lineCap = 'round'; g.stroke();
      continue;
    }
    const h = 6 * open * (1 - shut);
    if (h > .4) {
      g.beginPath(); g.moveTo(ex - w, ey); g.quadraticCurveTo(ex, ey - h * 1.6, ex + w, ey); g.quadraticCurveTo(ex, ey + h * 1.3, ex - w, ey); g.closePath();
      g.fillStyle = '#fbf3e4'; g.fill();
      g.save(); g.clip(); ell(g, ex + look[0] * 4, ey + look[1] * 2.5, 5.2, 5.2); g.fillStyle = '#2a1408'; g.fill();
      ell(g, ex + look[0] * 4 - 1.5, ey + look[1] * 2.5 - 1.8, 1.4, 1.4); g.fillStyle = '#fff'; g.fill(); g.restore();
      g.beginPath(); g.moveTo(ex - w - 2, ey + .5); g.quadraticCurveTo(ex, ey - h * 1.6 - 1, ex + w + 2, ey - 1.5); g.strokeStyle = '#140a06'; g.lineWidth = 2.4; g.stroke();
    } else {
      g.beginPath(); g.moveTo(ex - w, ey); g.quadraticCurveTo(ex, ey + (face === 'wince' ? -3 : 4), ex + w, ey); g.strokeStyle = '#140a06'; g.lineWidth = 2.4; g.lineCap = 'round'; g.stroke();
    }
    // brow: thin arc, raised in shock, angled in a wince
    const by = ey - (face === 'shock' ? 17 : face === 'awake' ? 15 : 13), tilt2 = face === 'wince' ? sg * -3 : face === 'awake' ? sg * 2 : 0;
    g.beginPath(); g.moveTo(ex - 10, by + 2 - tilt2); g.quadraticCurveTo(ex + sg * 2, by - 4, ex + 10, by + 2 + tilt2); g.strokeStyle = '#1a0f0a'; g.lineWidth = 2; g.stroke();
  }
  // nose: one stroke
  g.beginPath(); g.moveTo(-1, 2); g.lineTo(-4, 16); g.lineTo(1, 17); g.strokeStyle = MC.skinD; g.lineWidth = 1.8; g.stroke();
  // mouth
  g.fillStyle = MC.lip;
  if (face === 'shock') { ell(g, 0, 30, 6, 8); g.fill(); ell(g, 0, 31, 3.4, 5); g.fillStyle = '#3a0812'; g.fill(); }
  else if (face === 'smile') { g.beginPath(); g.moveTo(-11, 26); g.quadraticCurveTo(0, 38, 11, 26); g.quadraticCurveTo(0, 31, -11, 26); g.fill(); }
  else if (face === 'wince') { g.beginPath(); g.moveTo(-9, 31); g.lineTo(9, 29); g.lineTo(9, 32); g.lineTo(-9, 34); g.fill(); }
  else { g.beginPath(); g.moveTo(-8, 28); g.quadraticCurveTo(-3, 24, 0, 27); g.quadraticCurveTo(3, 24, 8, 28); g.quadraticCurveTo(0, 33, -8, 28); g.fill(); }
  // the bob: lacquer helmet, sharp points at the jaw, diagonal fringe (her silhouette mark)
  const bob = toPath([[-52, 34], [-54, -8], [-48, -48], [-26, -70], [6, -74], [36, -64], [52, -40], [56, -6], [52, 34], [38, 22], [40, -12], [34, -34], [18, -40], [-8, -46], [-30, -34], [-38, -10], [-38, 22]], true);
  airbrush(g, bob, { base: MC.hair, dark: '#000000', light: '#3d2c22', dir: LT, rim: 1.6 });
  gline(g, [[-30, -66], [-4, -50], [24, -44]], { w: 1.2, alpha: .7 });
  // gold headband with a fan
  gline(g, arcPts(0, -6, 52, Math.PI * 1.08, Math.PI * 1.92, 30, 64), { w: 3.2 });
  g.save(); g.translate(30, -66); g.rotate(.35);
  for (let i = -3; i <= 3; i++) gline(g, [[0, 0], [Math.sin(i * .22) * 22, -Math.cos(i * .22) * 22]], { w: 1.4 });
  g.restore();
  if (light < 1) { g.fillStyle = `rgba(6,10,26,${1 - light})`; g.fillRect(-70, -90, 140, 170); }
  g.restore();
}

// ---------- full figure ----------
// pose: { rot (whole-body tilt about the feet), hl, hr (hand targets in body units), tilt (head), face, look, blink, skirt (sway), knee (crouch 0..1) }
export function mara(g, x, y, s, P = {}) {
  const { rot = 0, hl = [-70, -380], hr = [70, -380], tilt = 0, face = 'neutral', look = [0, 0], blink = 0, skirt = 0, knee = 0, blush = 0, bow = 0 } = P;
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(rot);
  const drop = knee * 330;     // sitting: the torso sinks and the gown pools on the floor
  g.translate(0, drop);
  // shadow
  g.save(); g.translate(0, -drop); g.scale(1, .18); glow(g, 0, 0, 160 + knee * 60, '#000000', .55); g.restore();
  // the skirt: a streamlined column flaring to the hem (a pool when sitting), with gold chevrons
  const sw = skirt * 26, hem = lerp(96, 200, knee), midW = lerp(56, 120, knee), midY = lerp(-220, -drop - 60, knee);
  const skirtP = [[-28, -440], [28, -440], [midW + sw * .4, midY], [hem + sw, -drop], [-hem + sw, -drop], [-midW + sw * .4, midY]];
  airbrush(g, toPath(skirtP, true), { base: MC.dress, light: MC.dressL, dark: MC.dressD, dir: LT, rim: 2 });
  // one facet seam down the gown
  g.save(); g.clip(toPath(skirtP, true));
  airbrush(g, toPath([[0, -440], [28, -440], [hem + sw, -drop], [20 + sw, -drop]], true), { base: MC.dressD, light: MC.dress, dark: '#1e0308', dir: 0, alpha: .55 });
  for (let i = 0; i < 3; i++) { const yy = -drop - 22 - i * 16, hw = hem - 4 - i * 3; const pts = []; for (let k = 0; k <= 8; k++) pts.push([lerp(-hw, hw, k / 8) + sw, yy - (k % 2 ? 12 : 0)]); gline(g, pts, { w: 1.8 }); }
  g.restore();
  gline(g, [[-hem + sw, -drop], [hem + sw, -drop]], { w: 2.4 });
  // shoes peeking out
  ell(g, -30 + sw - knee * 120, -drop + 2, 18, 7); g.fillStyle = '#120d0a'; g.fill(); ell(g, 32 + sw + knee * 130, -drop + 2, 18, 7); g.fill();
  g.save();
  // bodice
  const bod = [[-50, -566], [50, -566], [42, -520], [28, -440], [-28, -440], [-42, -520]];
  airbrush(g, toPath(bod, true), { base: MC.dress, light: MC.dressL, dark: MC.dressD, dir: LT, rim: 2 });
  // bare shoulders + neckline
  airbrush(g, toPath([[-50, -566], [-20, -566], [0, -536], [20, -566], [50, -566], [44, -580], [-44, -580]], true), { base: MC.skin, light: MC.skinL, dark: MC.skinD, dir: LT });
  // gold belt with a stepped buckle
  gline(g, [[-30, -446], [30, -446]], { w: 4 }); gline(g, [[-10, -456], [10, -456], [10, -436], [-10, -436], [-10, -456]], { w: 1.6 });
  // arms (IK): upper arm skin, forearm in an ivory opera glove
  const arm = (sg, T) => {
    const S = [sg * 46, -560], A1 = ik(S, T, 125, 120, 1), A2 = ik(S, T, 125, 120, -1);
    const { E, H } = sg * A1.E[0] > sg * A2.E[0] ? A1 : A2;     // elbows always point outward
    airbrush(g, capsule(S[0], S[1], 13, E[0], E[1], 9.5), { base: MC.skin, light: MC.skinL, dark: MC.skinD, dir: LT, rim: 1 });
    airbrush(g, capsule(E[0], E[1], 10.5, H[0], H[1], 7.5), { base: MC.glove, light: '#ffffff', dark: MC.gloveD, dir: LT, rim: 1 });
    gline(g, [[E[0] - 10, E[1] + 2], [E[0] + 10, E[1] - 2]], { w: 1.4 });
    const ha = Math.atan2(H[1] - E[1], H[0] - E[0]);
    ell(g, H[0] + Math.cos(ha) * 10, H[1] + Math.sin(ha) * 10, 13, 9, ha); g.fillStyle = MC.glove; g.fill();
    g.strokeStyle = MC.gloveD; g.lineWidth = 1.2; g.stroke();
  };
  const handsUp = hl[1] < -560 || hr[1] < -560;
  if (!handsUp) { arm(-1, hl); arm(1, hr); }
  maraHead(g, 0, -640, 1, { face, look, blink, tilt, blush });
  if (handsUp) { arm(-1, hl); arm(1, hr); }
  g.restore();
  g.restore();
}

// ---------- a guest: a deco half-figure absorbed in their own worry ----------
// kind: 'mirror' | 'stain' | 'watch' | 'card'. (x,y) = waist centre; the figure reaches up ~ 520 units.
export function guest(g, x, y, s, kind, t = 0, o = {}) {
  const { tone = '#141218', alpha = 1, glance = 0 } = o;
  const fem = kind === 'mirror' || kind === 'card';
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= alpha;
  const sway = Math.sin(t * 2.4 + x) * .02; g.rotate(sway);
  // torso: lacquer with a gold rim; men in tuxedo with ivory shirt, women in a dark gown
  // streamlined torso: rounded shoulders, a narrow waist, a facet seam
  const body = new Path2D(); body.moveTo(-14, -350); body.lineTo(14, -350);
  body.bezierCurveTo(60, -350, 78, -330, 76, -296); body.lineTo(46, -130); body.lineTo(52, 0); body.lineTo(-52, 0); body.lineTo(-46, -130); body.lineTo(-76, -296);
  body.bezierCurveTo(-78, -330, -60, -350, -14, -350); body.closePath();
  airbrush(g, body, { base: tone, light: mix(tone, '#ffffff', .18), dark: '#000000', dir: LT, rim: 1.8, bbox: [-78, -350, 78, 0] });
  g.save(); g.clip(body); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(10, -350); g.lineTo(80, -350); g.lineTo(80, 0); g.lineTo(30, 0); g.closePath(); g.fill(); g.restore();
  if (!fem) {
    airbrush(g, toPath([[-24, -330], [24, -330], [0, -200]], true), { base: C.ivory, light: '#ffffff', dark: C.ivoryD, dir: LT });
    g.beginPath(); g.moveTo(-14, -326); g.lineTo(0, -316); g.lineTo(14, -326); g.lineTo(14, -306); g.lineTo(0, -316); g.lineTo(-14, -306); g.closePath(); g.fillStyle = '#050404'; g.fill();
    if (kind === 'stain') { ell(g, 8, -262, 13, 10, .4); g.fillStyle = '#5a3a1a'; g.fill(); ell(g, 18, -246, 5, 4); g.fill(); }
  } else gline(g, [[-40, -300], [0, -250], [40, -300]], { w: 2, alpha: .9 });
  // head looks down at the prop (no one looks at the camera)
  const hx = 0, hy = -392;
  airbrush(g, toPath([[-9, -360], [9, -360], [10, -330], [-10, -330]], true), { base: '#b98c68', light: '#e8c09a', dir: LT });
  const head = new Path2D(); head.ellipse(hx, hy, 32, 42, 0, 0, TAU);
  airbrush(g, head, { base: '#d9ab84', light: '#f6d3ae', dark: '#946247', dir: LT, rim: 1.2 });
  for (const sg of [-1, 1]) {
    if (glance > .5) {   // a nervous look straight at the viewer
      ell(g, hx + sg * 13, hy, 8, 5.5); g.fillStyle = '#fbf3e4'; g.fill(); ell(g, hx + sg * 13, hy, 3.6, 3.6); g.fillStyle = '#1a0d08'; g.fill();
      g.beginPath(); g.moveTo(hx + sg * 13 - 9, hy - 11 - sg * 2); g.lineTo(hx + sg * 13 + 9, hy - 11 + sg * 2); g.strokeStyle = '#1a0d08'; g.lineWidth = 2; g.stroke();
    } else { g.beginPath(); g.moveTo(hx + sg * 13 - 8, hy + 2); g.quadraticCurveTo(hx + sg * 13, hy + 7, hx + sg * 13 + 8, hy + 2); g.strokeStyle = '#1a0d08'; g.lineWidth = 2.2; g.stroke(); }
  }
  g.beginPath(); g.moveTo(hx - 6, hy + 26); g.quadraticCurveTo(hx, hy + (kind === 'stain' ? 22 : 29), hx + 6, hy + 26); g.strokeStyle = '#6a2a20'; g.lineWidth = 2; g.stroke();
  // hair / hat
  if (kind === 'mirror') {             // finger waves
    const p = toPath([[-40, hy + 20], [-42, hy - 22], [-24, hy - 46], [10, hy - 50], [38, hy - 30], [40, hy + 10], [30, hy - 10], [16, hy - 30], [-14, hy - 30], [-30, hy - 10]], true);
    airbrush(g, p, { base: '#3a2414', light: '#7a5030', dark: '#120a05', dir: LT, rim: 1.2 });
    for (let i = 0; i < 3; i++) gline(g, arcPts(-6 + i * 14, hy - 34, 10, Math.PI, TAU, 10), { w: 1, alpha: .7 });
  } else if (kind === 'card') {        // cloche hat
    const p = toPath([[-46, hy - 6], [-36, hy - 44], [0, hy - 56], [36, hy - 44], [46, hy - 6], [30, hy - 14], [-30, hy - 14]], true);
    airbrush(g, p, { base: '#1d4f45', light: '#3f9a7f', dark: '#08201b', dir: LT, rim: 1.4 });
    gline(g, [[-40, hy - 16], [40, hy - 16]], { w: 2 });
  } else if (kind === 'watch') {       // top hat
    airbrush(g, toPath([[-30, hy - 30], [-26, hy - 110], [26, hy - 110], [30, hy - 30]], true), { base: '#121014', light: '#3a3640', dark: '#000', dir: LT, rim: 1.4 });
    airbrush(g, toPath([[-52, hy - 26], [52, hy - 26], [46, hy - 38], [-46, hy - 38]], true), { base: '#121014', light: '#3a3640', dir: LT });
    gline(g, [[-28, hy - 48], [28, hy - 48]], { w: 3 });
  } else {                             // slicked hair
    airbrush(g, toPath([[-34, hy - 4], [-34, hy - 30], [-12, hy - 46], [24, hy - 44], [36, hy - 24], [34, hy - 4], [20, hy - 28], [-20, hy - 28]], true), { base: '#0e0a08', light: '#3a2c22', dir: LT, rim: 1.2 });
  }
  // the prop, held in front, catching their own light
  const pk = { mirror: [-70, -300], card: [50, -270], watch: [40, -260], stain: [-50, -250] }[kind];
  const arm = (x0, y0, x1, y1) => { airbrush(g, capsule(x0, y0, 14, x1, y1, 10), { base: tone, light: mix(tone, '#fff', .2), dark: '#000', dir: LT, rim: 1 }); ell(g, x1, y1, 11, 9); g.fillStyle = '#f2e8d5'; g.fill(); };
  if (kind === 'mirror') {
    arm(-62, -316, -76, -380);
    ell(g, -88, -438, 26, 34); g.fillStyle = '#9fb6c4'; g.fill(); gline(g, arcPts(-88, -438, 28, 0, TAU, 40, 36), { w: 2.4 }); gline(g, [[-80, -404], [-76, -380]], { w: 3 });
    sparkle(g, -96, -452, 10 + 4 * Math.sin(t * 6), { alpha: .8 });
  } else if (kind === 'card') {
    arm(56, -310, 46, -270); g.save(); g.translate(30, -290); g.rotate(-.15); g.fillStyle = '#f2e8d5'; g.fillRect(-40, -26, 80, 52);
    g.strokeStyle = '#6f5220'; g.lineWidth = 1.4; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-30, -14 + i * 10); g.lineTo(30 - (i % 2) * 18, -14 + i * 10); g.stroke(); } g.restore();
  } else if (kind === 'watch') {
    arm(58, -306, 40, -262); const wx = 26, wy = -272; ell(g, wx, wy, 20, 20); g.fillStyle = '#f2e8d5'; g.fill(); gline(g, arcPts(wx, wy, 21, 0, TAU, 30), { w: 2.6 });
    const a = t * 3; gline(g, [[wx, wy], [wx + Math.sin(a) * 14, wy - Math.cos(a) * 14]], { w: 1.4, color: '#2a1408' }); gline(g, [[60, -330], [wx, wy - 21]], { w: 1 });
  } else {
    arm(-58, -306, -10, -262); arm(58, -306, 22, -270);
  }
  g.restore();
}

// ---------- the staring eye (imagined) ----------
export function eye(g, x, y, r, open = 1, look = [0, 0], lit = 1) {
  if (open <= 0.01) { gline(g, [[x - r, y], [x + r, y]], { w: 2, alpha: lit }); return; }
  const h = r * .55 * open;
  const P = new Path2D(); P.moveTo(x - r, y); P.quadraticCurveTo(x, y - h * 2, x + r, y); P.quadraticCurveTo(x, y + h * 2, x - r, y); P.closePath();
  g.save(); g.globalAlpha *= lit;
  glow(g, x, y, r * 2, '#ffcf7a', .25 * lit);
  g.fillStyle = '#f6ecd6'; g.fill(P);
  g.save(); g.clip(P);
  const ix = x + look[0] * r * .3, iy = y + look[1] * r * .2;
  const ir = g.createRadialGradient(ix, iy, 0, ix, iy, r * .42); ir.addColorStop(0, '#000'); ir.addColorStop(.38, '#000'); ir.addColorStop(.42, '#6f5220'); ir.addColorStop(.9, '#c9a24b'); ir.addColorStop(1, '#3a2a10');
  ell(g, ix, iy, r * .42, r * .42); g.fillStyle = ir; g.fill();
  ell(g, ix - r * .12, iy - r * .12, r * .08, r * .08); g.fillStyle = '#fff'; g.fill();
  g.restore();
  g.restore();
  gline(g, [[x - r * 1.15, y], [x - r, y]], { w: 2, alpha: lit });
  gline(g, [[x + r, y], [x + r * 1.15, y]], { w: 2, alpha: lit });
  const top = []; for (let i = 0; i <= 24; i++) { const u = i / 24; top.push([lerp(x - r, x + r, u), y - h * 2 * 2 * u * (1 - u)]); }
  const bot = top.map(([a, b]) => [a, 2 * y - b]);
  gline(g, top, { w: 3, alpha: lit }); gline(g, bot, { w: 2, alpha: lit });
  // lashes: rays above the lid (a little sunburst)
  for (let i = 1; i < 8; i++) { const u = i / 8, px = lerp(x - r, x + r, u), py = y - h * 4 * u * (1 - u), a = -Math.PI / 2 + (u - .5) * 1.6; gline(g, [[px, py - 3], [px + Math.cos(a) * r * .22, py - 3 + Math.sin(a) * r * .22]], { w: 1.4, alpha: lit }); }
}

// ---------- the embarrassing T-shirt ----------
export function tshirt(g, x, y, s, t = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const P = [[-90, -180], [-40, -200], [-20, -186], [20, -186], [40, -200], [90, -180], [150, -110], [110, -70], [86, -100], [86, 170], [-86, 170], [-86, -100], [-110, -70], [-150, -110]];
  airbrush(g, toPath(P, true), { base: '#efe6d2', light: '#ffffff', dark: '#a89a7c', dir: LT, rim: 1.4 });
  gline(g, P, { w: 2.4, closed: true });
  gline(g, arcPts(0, -192, 22, .1, Math.PI - .1, 14), { w: 1.8 });
  // the print: a cheesy crooner face with a wink, in hot pink: the "embarrassing" part
  const pk = '#e0527a';
  g.save(); g.translate(0, 0);
  ell(g, 0, 10, 58, 66); g.fillStyle = pk; g.fill();
  ell(g, 0, 18, 40, 46); g.fillStyle = '#ffd9a8'; g.fill();
  g.fillStyle = '#5a2a10'; g.beginPath(); g.moveTo(-44, -10); g.quadraticCurveTo(-30, -70, 10, -56); g.quadraticCurveTo(44, -60, 46, -6); g.quadraticCurveTo(30, -40, -10, -34); g.quadraticCurveTo(-30, -30, -44, -10); g.fill();
  g.strokeStyle = '#2a1408'; g.lineWidth = 3.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-22, 6); g.lineTo(-8, 6); g.stroke();            // wink
  ell(g, 15, 6, 5, 6); g.fillStyle = '#2a1408'; g.fill();
  g.beginPath(); g.moveTo(-18, 34); g.quadraticCurveTo(0, 54, 18, 34); g.stroke();
  sparkle(g, 40, 30, 14 + 3 * Math.sin(t * 7), { color: '#ffffff', alpha: .95 });
  g.font = '700 30px Josefin'; g.textAlign = 'center'; g.fillStyle = pk; g.fillText('I ♥ BALLADS', 0, 120);
  g.restore();
  g.restore();
}

// ---------- overhead person (top-down head and shoulders) for the kaleidoscope ----------
export function overhead(g, x, y, r, rot, col, hero = false) {
  g.save(); g.translate(x, y); g.rotate(rot);
  ell(g, 0, 0, r * 1.25, r * .7); g.fillStyle = col; g.fill(); g.strokeStyle = hero ? C.gold2 : C.gold1; g.lineWidth = 1.6; g.stroke();
  ell(g, 0, 0, r * .55, r * .55); g.fillStyle = hero ? MC.hair : '#2a1d14'; g.fill();
  gline(g, arcPts(0, 0, r * .55, Math.PI * 1.1, Math.PI * 1.9, 10), { w: 1.2 });
  g.restore();
}

// ---------- a gloved hand (close-ups): palm + four fingers + thumb, fingers pointing up ----------
export function glovedHand(g, x, y, s, rot = 0, mirror = 1) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * mirror, s);
  const parts = [capsule(-6, 60, 46, 0, 260, 40)];
  const F = [[-30, -6, -40, -96, 12], [-10, -14, -12, -118, 12.5], [12, -12, 14, -112, 12], [32, -2, 38, -84, 10.5]];
  for (const [x0, y0, x1, y1, r] of F) parts.push(capsule(x0, y0, r, x1, y1, r * .9));
  parts.push(capsule(-40, 40, 13, -78, -10, 11));
  const palm = new Path2D(); palm.ellipse(0, 20, 48, 56, 0, 0, TAU); parts.push(palm);
  for (const p of parts) airbrush(g, p, { base: MC.glove, light: '#ffffff', dark: MC.gloveD, dir: LT, bbox: [-60, -120, 60, 260] });
  g.strokeStyle = 'rgba(120,100,70,.55)'; g.lineWidth = 2;
  for (const [x0, y0, x1, y1] of F) { g.beginPath(); g.moveTo(x0, y0 + 10); g.lineTo(lerp(x0, x1, .1), y0); g.stroke(); }
  gline(g, [[-40, 150], [40, 150]], { w: 2 }); gline(g, [[-38, 162], [38, 162]], { w: 1 });
  g.restore();
}

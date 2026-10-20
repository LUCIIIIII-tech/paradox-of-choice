// worlds.js — one function per world + the portal (the only thing that glows: cyan) + the title board
// World coordinates: about 1080 wide, floor near y = 1650 (the camera in main.js frames them).
import { clamp, lerp, hash, vnoise, TAU } from '/core/lib.js';
import { INK, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, dot, text, bands, noodle, quad } from './toon.js';
import { PAL, sandwich, miniSandwich } from './chars.js';

export const COL = {
  // home kitchen
  wall: '#b9a7c9', wallS: '#a593b8', plum: '#7e6a93', plumS: '#655279', fridge: '#e0b54a', fridgeS: '#b98f2c', inside: '#fff3d0', insideS: '#efdcae', tileA: '#c9775b', tileB: '#a85e47', counterTop: '#e9e0f0',
  // deli-verse 1: emerald + coral + cream
  em: '#1f6b57', emS: '#17513f', emD: '#123f31', coral: '#f06c5b', coralS: '#c94f40', cream: '#f6e3c0',
  // deli-verse 2: scarlet + bubblegum + off-white
  sc: '#d8263b', scS: '#a81a2b', pink: '#ff9fc4', pinkS: '#f07fab', ow: '#fff1ea',
  // fall bands
  navy: '#1d2a5c', gold: '#f2c14e', tang: '#ff8a2a', choc: '#3a2320', void: '#fbfaf7', voidS: '#e6e3dc',
  // gas station: beige + khaki + sick fluorescent
  beige: '#e9dcc0', beigeS: '#d9c9a6', khaki: '#a08a62', khakiS: '#7d6a49', fluo: '#f3f0a8', floorA: '#d8c8a6', floorB: '#cbb994',
  // portal (cyan belongs to the device only)
  pRim: '#38d9f5', pArmA: '#a6f6ff', pArmB: '#14a9cf', pCore: '#e8fdff', pWash: 'rgba(92,242,255,.13)',
};

// —— the portal ——
// ellipse portal (rx, ry) or a rounded-rect one (box = [w, h, r]) for the fridge
export function portal(cx, cy, rx, ry, t, { open = 1, spin = 1, box = null, wash = true } = {}) {
  if (open <= .001) return;
  push(); translate(cx, cy);
  const Rx = rx * open, Ry = ry * open;
  if (wash) { fillOnly(ell(0, 0, Rx * 1.5, Ry * 1.45, 48), COL.pWash, { boil: .6 }); fillOnly(ell(0, 0, Rx * 1.24, Ry * 1.2, 48), COL.pWash, { boil: .6 }); }
  let rimS;
  if (box) { const [w, h, r] = box; rimS = rr(-w / 2 * open, -h / 2 * open, w * open, h * open, r * open); }
  else {
    const rim = [], N = 24;
    for (let i = 0; i < N; i++) { const a = i / N * TAU, k = 1 + .07 * (vnoise(i * 1.9 + t * 3) - .5) * 2 + .04 * Math.sin(a * 6 + t * 5); rim.push([Math.cos(a) * Rx * k, Math.sin(a) * Ry * k]); }
    rimS = spline(rim);
  }
  const R = Math.max(Rx, Ry) * (box ? 1.3 : 1);
  shape(rimS, {
    fill: COL.pRim, lw: 8, shade: () => {
      fillOnly(box ? rr(-box[0] / 2 * open + 16, -box[1] / 2 * open + 16, box[0] * open - 32, box[1] * open - 32, box[2] * open) : ell(0, 0, Rx * .88, Ry * .88, 40), '#7eeaff', { boil: .3 });
      const arms = 6, sy = box ? 1 : Ry / Rx;
      for (let k = 0; k < arms; k++) {
        const p1 = [], p2 = [];
        for (let j = 0; j <= 22; j++) {
          const u = j / 22, r_ = R * (1 - u) * .95, a = k / arms * TAU + u * 3.4 - t * 2.8 * spin;
          p1.push([Math.cos(a) * r_, Math.sin(a) * r_ * sy]);
          const a2 = a + .5 * (1 - u * .7); p2.push([Math.cos(a2) * r_, Math.sin(a2) * r_ * sy]);
        }
        fillOnly([...p1, ...p2.reverse()], k % 2 ? COL.pArmA : COL.pArmB, { boil: .4 });
      }
      fillOnly(ell(0, 0, R * .28, R * .28 * sy, 24), COL.pCore, { boil: .5 });
      fillOnly(ell(0, 0, R * .12, R * .12 * sy, 16), '#ffffff', { boil: .5 });
    }
  });
  for (let i = 0; i < 12; i++) {
    const a = hash(i) * TAU + t * (1.4 + hash(i + 4) * 2), d = 1.06 + .22 * ((t * .8 + hash(i + 9)) % 1);
    dot(Math.cos(a) * Rx * d, Math.sin(a) * Ry * d, 5 + hash(i + 2) * 4, i % 3 ? COL.pArmA : '#ffffff');
  }
  pop();
}

// —— home kitchen ——
const CLOCK = (x, y, t, min) => {
  shape(ell(x, y, 62, 62, 40), { fill: '#fbf5ea', lw: 7 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; stroke([[x + Math.cos(a) * 46, y + Math.sin(a) * 46], [x + Math.cos(a) * 54, y + Math.sin(a) * 54]], 4); }
  const am = min / 60 * TAU - Math.PI / 2, ah = (1 + min / 60) / 12 * TAU - Math.PI / 2;
  stroke([[x, y], [x + Math.cos(ah) * 30, y + Math.sin(ah) * 30]], 7); stroke([[x, y], [x + Math.cos(am) * 46, y + Math.sin(am) * 46]], 5); dot(x, y, 6);
};
export function fridge(x, y, w, h, { open = 1, t = 0, portalOpen = 0, plate = true } = {}) {
  // body
  shape(rr(x, y, w, h, 26), { fill: COL.fridge, lw: 7, shade: () => fillOnly(rect(x + w * .72, y - 10, w, h + 20), COL.fridgeS, { boil: .3 }) });
  if (open <= 0) { stroke([[x + 6, y + h * .32], [x + w - 6, y + h * .32]], 6); shape(rr(x + w - 50, y + 80, 18, 120, 8), { fill: COL.fridgeS, lw: 5 }); return; }
  // open interior
  const ix = x + 26, iy = y + 26, iw = w - 52, ih = h - 52;
  shape(rr(ix, iy, iw, ih, 16), { fill: COL.inside, lw: 6, shade: () => { fillOnly(rect(ix - 10, iy - 10, iw * .18, ih + 20), COL.insideS, { boil: .3 }); fillOnly(rect(ix + iw * .82, iy - 10, iw, ih + 20), COL.insideS, { boil: .3 }); } });
  for (const k of [.3, .58, .8]) stroke([[ix + 6, iy + ih * k], [ix + iw - 6, iy + ih * k]], 6);
  if (plate && portalOpen <= .5) {
    const py = iy + ih * .58;
    shape(ell(ix + iw / 2, py - 6, iw * .4, 14, 30), { fill: '#ffffff', lw: 5 });
    sandwich(ix + iw * .32, py - 54, .55, 'ham'); sandwich(ix + iw * .7, py - 54, .55, 'turkey');
    // a milk carton and a jar, so the fridge reads as a fridge
    shape(rect(ix + iw * .18, iy + ih * .3 - 120, 60, 116), { fill: '#f7f7fb', lw: 5, shade: () => fillOnly(rect(ix + iw * .18, iy + ih * .3 - 70, 60, 26), '#6aa7e0', { boil: .3 }) });
    shape(rr(ix + iw * .62, iy + ih * .3 - 70, 70, 66, 12), { fill: '#e5503e', lw: 5, shade: () => fillOnly(rect(ix + iw * .62, iy + ih * .3 - 80, 70, 18), '#f3e7d1', { boil: .3 }) });
  }
  if (portalOpen > 0) portal(ix + iw / 2, iy + ih / 2, iw / 2, ih / 2, t, { open: portalOpen, box: [iw - 10, ih - 10, 18], wash: false });
  // door swung open to the left (narrow, seen edge-on)
  const dw = w * .26 * open;
  shape([[x - dw, y + 18], [x + 4, y], [x + 4, y + h], [x - dw, y + h - 18]], { fill: COL.fridge, lw: 7, shade: () => fillOnly(rect(x - dw - 10, y, dw * .45, h), COL.fridgeS, { boil: .3 }) });
  for (const k of [.2, .45, .7]) shape(rect(x - dw + 8, y + h * k, dw - 6, 16), { fill: COL.insideS, lw: 4 });
}
export function kitchen(t, { min = 40, open = 1, portalOpen = 0, wash = 0, plate = true } = {}) {
  fillOnly(rect(-1400, -1400, 4000, 2860), COL.wall, { boil: 0 });
  fillOnly(rect(-1400, 260, 4000, 22), COL.wallS, { boil: 0 });
  // upper cabinets, window, clock, framed sandwich picture
  shape(rr(560, 200, 520, 300, 14), { fill: COL.plum, lw: 7, shade: () => fillOnly(rect(830, 190, 300, 320), COL.plumS, { boil: .3 }) });
  stroke([[820, 214], [820, 486]], 6); dot(796, 400, 7); dot(844, 400, 7);
  CLOCK(290, 330, t, min);
  shape(rr(-240, 380, 200, 240, 10), { fill: '#f6efe2', lw: 7 }); sandwich(-140, 520, .7, 'deluxe');
  // floor checker (flat bands of tiles)
  fillOnly(rect(-1400, 1450, 4000, 4000), COL.tileA, { boil: 0 });
  for (let r = 0; r < 6; r++) for (let c = -12; c < 14; c++) if ((r + c) % 2 === 0) fillOnly([[c * 120 + r * 26, 1450 + r * 110], [c * 120 + 120 + r * 26, 1450 + r * 110], [c * 120 + 120 + (r + 1) * 26, 1560 + r * 110], [c * 120 + (r + 1) * 26, 1560 + r * 110]], COL.tileB, { boil: 0 });
  stroke([[-1400, 1452], [2600, 1452]], 7);
  // counter on the right
  shape(rect(620, 1150, 900, 300), { fill: COL.plum, lw: 7, shade: () => fillOnly(rect(620, 1260, 900, 200), COL.plumS, { boil: .3 }) });
  shape(rect(600, 1120, 940, 44), { fill: COL.counterTop, lw: 7 });
  stroke([[880, 1180], [880, 1440]], 6); dot(856, 1310, 7); dot(904, 1310, 7);
  // a cereal box on the counter
  shape(rect(960, 940, 130, 182), { fill: '#f2c14e', lw: 7, shade: () => { fillOnly(ell(1025, 1030, 44, 44, 20), '#e5503e', { boil: .3 }); } });
  text('O', 1025, 1032, { font: '400 56px "Lilita One"', fill: '#fff' });
  fridge(80, 470, 420, 980, { open, t, portalOpen, plate });
  if (wash > 0) fillOnly(rect(-1400, -1400, 4000, 4000), `rgba(92,242,255,${.12 * wash})`, { boil: 0 });
}
// inside-the-fridge POV frame (screen space, drawn over the shot)
export function fridgeFrame(W, H) {
  const m = 70;
  fillOnly([[-20, -20], [W + 20, -20], [W + 20, m], [-20, m]], COL.insideS, { boil: .3 });
  fillOnly([[-20, -20], [m, -20], [m, H + 20], [-20, H + 20]], COL.inside, { boil: .3 });
  fillOnly([[W - m, -20], [W + 20, -20], [W + 20, H + 20], [W - m, H + 20]], COL.insideS, { boil: .3 });
  shape([[m, m], [W - m, m], [W - m, H + 40], [m, H + 40]], { lw: 8 });
}

// —— deli-verse 1: 30 sandwiches ——
const KINDS = ['ham', 'turkey', 'egg', 'deluxe', 'plain'];
export function deli1(t) {
  fillOnly(rect(-1400, -1600, 4000, 3000), COL.em, { boil: 0 });
  for (let k = 0; k < 14; k++) fillOnly(rect(-1400 + k * 300, -1600, 26, 3000), COL.emS, { boil: 0 });   // wall panels
  // sign
  shape(rr(250, -60, 580, 150, 40), { fill: COL.cream, lw: 7, shade: () => fillOnly(rect(250, 40, 580, 60), '#e8cfa2', { boil: .3 }) });
  text('DELI', 540, 22, { font: '400 120px "Lilita One"', fill: COL.coral, outlineW: 12 });
  // the wall of 30
  shape(rr(70, 170, 940, 1000, 20), { fill: COL.emD, lw: 7 });
  for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
    const x = 110 + c * 176, y = 200 + r * 160;
    shape(rr(x, y, 154, 138, 14), { fill: COL.emS, lw: 5, boil: .6 });
    miniSandwich(x + 77, y + 64, .82, KINDS[(r * 5 + c * 3) % 5], .6);
    shape(rr(x + 44, y + 108, 66, 26, 6), { fill: COL.coral, lw: 4, boil: .5 });
    text(String(r * 5 + c + 1), x + 77, y + 122, { font: '800 22px "Baloo 2"', fill: '#fff' });
  }
  // counter
  shape(rect(-200, 1190, 1480, 260), { fill: COL.coral, lw: 7, shade: () => { fillOnly(rect(-200, 1330, 1480, 140), COL.coralS, { boil: .3 }); for (let k = 0; k < 8; k++) fillOnly(rect(-120 + k * 190, 1230, 18, 200), COL.coralS, { boil: .3 }); } });
  shape(rect(-220, 1170, 1520, 40), { fill: COL.cream, lw: 7 });
  // cream floor tiles
  fillOnly(rect(-1400, 1450, 4000, 4000), COL.cream, { boil: 0 });
  for (let r = 0; r < 6; r++) stroke([[-1400, 1520 + r * 110], [2600, 1520 + r * 110]], 4, { line: COL.em, boil: .4 });
  for (let c = -8; c < 12; c++) stroke([[c * 150, 1450], [c * 150 - 120, 2100]], 4, { line: COL.em, boil: .4 });
  stroke([[-1400, 1452], [2600, 1452]], 7);
}

// —— deli-verse 2: 3,000 sandwiches down one aisle ——
export const VP = [540, 820];
export function deli2(t, { special: sp = null } = {}) {
  fillOnly(rect(-1400, -1600, 4000, 4400), COL.ow, { boil: 0 });
  // floor (pink, stripes to the vanishing point)
  fillOnly([[-1400, 2600], [2600, 2600], [VP[0] + 40, VP[1]], [VP[0] - 40, VP[1]]], COL.pink, { boil: 0 });
  for (let k = -6; k <= 6; k++) stroke([[VP[0] + k * 6, VP[1] + 4], [VP[0] + k * 360, 2600]], 5, { line: COL.pinkS, boil: .4 });
  // ceiling lights
  for (let d = 0; d < 9; d++) { const p = 1 / (1 + d * .9), y = lerp(VP[1], -300, p), w = 420 * p; fillOnly(rr(VP[0] - w / 2, y, w, 26 * p + 4, 6), '#ffffff', { boil: .3 }); }
  // both shelf walls, near to far
  for (const side of [-1, 1]) {
    const near = side < 0 ? -40 : 1120;
    fillOnly([[near, -500], [VP[0] + side * 40, VP[1] - 50], [VP[0] + side * 40, VP[1] + 40], [near, 2000]], COL.sc, { boil: .3 });
    for (let row = 0; row < 7; row++) {
      const yN = 80 + row * 230;     // shelf height at the near edge
      // sandwiches along the shelf, far ones first
      for (let d = 34; d >= 0; d--) {
        const p = 1 / (1 + d * .32), x = lerp(VP[0] + side * 40, near - side * 70, p), y = lerp(VP[1], yN + 150, p), s = .95 * p;
        if (s < .045) continue;
        miniSandwich(x, y - 70 * p, s, KINDS[(row * 7 + d * 3 + (side > 0 ? 2 : 0)) % 5], s > .3 ? .4 : 0);
      }
      const p0 = 1, pF = 1 / (1 + 34 * .32);
      stroke([[near, yN + 150 * p0 + 10], [VP[0] + side * 40, VP[1] + 4]], 7, { line: COL.scS, boil: .3 });
    }
  }
  stroke([[-40, -500], [VP[0] - 40, VP[1] - 50]], 7); stroke([[1120, -500], [VP[0] + 40, VP[1] - 50]], 7);
  // hanging aisle sign
  stroke([[480, -300], [480, 400]], 5); stroke([[720, -300], [720, 400]], 5);
  shape(rr(390, 390, 420, 120, 18), { fill: COL.sc, lw: 7 });
  text('SANDWICHES', 600, 438, { font: '400 54px "Lilita One"', fill: COL.ow });
  text('1 – 3,000', 600, 486, { font: '800 34px "Baloo 2"', fill: COL.pink });
}

// —— the fall: a vertical shaft of worlds ——
// bands top to bottom: deli-verse 2 floor at Y0; 1M; 1B; ∞; then the gas station ceiling
export const FALL = { Y0: 0, BAND: 1700 };
const BANDS = [
  { bg: COL.navy, fg: COL.gold, label: '1,000,000' },
  { bg: COL.tang, fg: COL.choc, label: '1,000,000,000' },
  { bg: COL.void, fg: COL.voidS, label: '∞' },
];
export function fallShaft(t, camY) {
  const { Y0, BAND } = FALL;
  // deli-verse 2 floor above
  fillOnly(rect(-1400, Y0 - 3000, 4000, 3000), COL.pink, { boil: 0 });
  for (let k = 0; k < 8; k++) stroke([[-1400, Y0 - 120 - k * 200], [2600, Y0 - 120 - k * 200]], 5, { line: COL.pinkS, boil: .4 });
  BANDS.forEach((b, i) => {
    const y0 = Y0 + i * BAND, y1 = y0 + BAND;
    if (y1 < camY - 2500 || y0 > camY + 2500) return;
    fillOnly(rect(-1400, y0, 4000, BAND), b.bg, { boil: 0 });
    // sandwich walls on both sides, denser each band
    const n = [6, 10, 16][i], cs = BAND / n, cols = i + 1, sp = 230 / cols;
    for (const side of [-1, 1]) for (let r = 0; r < n; r++) for (let c = 0; c < cols; c++) {
      const x = side < 0 ? sp * (c + .5) : 1080 - sp * (c + .5), y = y0 + cs * (r + .5);
      miniSandwich(x, y, Math.min(cs, sp) / 150 * .95, KINDS[(r + c * 2 + i) % 5], 0);
    }
    // painted count on the back wall
    const fs = b.label.length > 9 ? 112 : b.label.length > 2 ? 150 : 700;
    text(b.label, 540, y0 + BAND * .62, { font: `400 ${fs}px "Lilita One"`, fill: i === 2 ? '#d9d4ca' : b.fg, rot: -.06, outlineW: 16, outlineCol: INK });
  });
  // floor slabs with their portal holes
  for (let i = 0; i <= 3; i++) {
    const y = Y0 + i * BAND;
    if (y < camY - 2500 || y > camY + 2500) continue;
    const slab = i === 0 ? COL.pinkS : i === 3 ? COL.beigeS : BANDS[i - 1].fg;
    fillOnly(rect(-1400, y - 30, 4000, 60), slab, { boil: 0 });
    stroke([[-1400, y - 30], [2600, y - 30]], 7); stroke([[-1400, y + 30], [2600, y + 30]], 7);
    portal(540, y, 400, 92, t + i, { open: 1, wash: false });
  }
}

// —— gas station: one option ——
export function gasStation(t, { ceilPortal = 0, buzz = 0, sandwichGone = false, top = -1600 } = {}) {
  fillOnly(rect(-1400, top, 4000, 1460 - top), COL.beige, { boil: 0 });
  fillOnly(rect(-1400, 1080, 4000, 380), COL.beigeS, { boil: 0 });
  // ceiling + fluorescent tubes (one flickers)
  fillOnly(rect(-1400, top, 4000, 200 - top), COL.beigeS, { boil: 0 });
  stroke([[-1400, 200], [2600, 200]], 7);
  for (const [x, k] of [[120, 0], [540, 1], [960, 2]]) {
    const fl = k === 2 && buzz > 0 && Math.floor(t * 12) % 7 === 0;
    shape(rr(x - 170, 150, 340, 40, 12), { fill: fl ? COL.beigeS : COL.fluo, lw: 6 });
  }
  if (ceilPortal > 0) portal(540, 196, 330, 70, t, { open: ceilPortal, wash: false });
  // empty khaki shelves on the left (price tags, nothing on them)
  for (let r = 0; r < 4; r++) {
    shape(rect(-140, 440 + r * 210, 520, 30), { fill: COL.khaki, lw: 6 });
    for (let c = 0; c < 4; c++) shape(rect(-100 + c * 120, 474 + r * 210, 46, 22), { fill: '#fbf6e8', lw: 3, boil: .5 });
  }
  shape(rect(-160, 400, 30, 900), { fill: COL.khakiS, lw: 6 }); shape(rect(370, 400, 30, 900), { fill: COL.khakiS, lw: 6 });
  // counter with the heat-lamp case
  shape(rect(560, 1060, 700, 400), { fill: COL.khaki, lw: 7, shade: () => fillOnly(rect(560, 1250, 700, 220), COL.khakiS, { boil: .3 }) });
  shape(rect(540, 1030, 740, 44), { fill: COL.beigeS, lw: 7 });
  shape(rr(640, 700, 380, 330, 12), { fill: 'rgba(255,255,240,.35)', lw: 7 });
  shape(rect(640, 690, 380, 54), { fill: COL.khakiS, lw: 7 });
  for (const x of [700, 830, 960]) shape(ell(x, 760, 34, 14, 16), { fill: COL.fluo, lw: 5 });
  text('HOT FOOD', 830, 718, { font: '800 30px "Baloo 2"', fill: COL.fluo });
  stroke([[650, 1000], [1010, 1000]], 5);
  if (!sandwichGone) sandwich(830, 930, .62, 'egg', { wrap: true });
  // floor
  fillOnly(rect(-1400, 1450, 4000, 4000), COL.floorA, { boil: 0 });
  for (let r = 0; r < 6; r++) for (let c = -12; c < 14; c++) if ((r + c) % 2 === 0) fillOnly(rect(c * 130, 1450 + r * 120, 130, 120), COL.floorB, { boil: 0 });
  stroke([[-1400, 1452], [2600, 1452]], 7);
}

// —— title board: a deli price board ——
export function titleBoard(t, pop_ = 1, letters = 99) {
  shape(rr(-440, -560, 880, 1040, 36), { fill: '#3b2346', lw: 9, shade: () => fillOnly(rr(-410, -530, 820, 980, 26), '#462a54', { boil: .3 }) });
  stroke([[-300, -640], [-260, -560]], 6); stroke([[300, -640], [260, -560]], 6);
  const words = ['PARADOX', 'OF', 'CHOICE'], ys = [-320, -130, 60], sz = [176, 120, 176];
  let n = 0;
  words.forEach((w, i) => {
    for (let k = 0; k < w.length; k++, n++) {
      if (n >= letters) return;
      g.font = `400 ${sz[i]}px "Lilita One"`;
      const full = g.measureText(w).width, x0 = -full / 2 + g.measureText(w.slice(0, k)).width + g.measureText(w[k]).width / 2;
      const jig = (hash(n * 3.1 + Math.floor(t * 12) % 3) - .5) * 4;
      text(w[k], x0 + 12, ys[i] + 12 + jig, { font: `400 ${sz[i]}px "Lilita One"`, fill: COL.coral, outlineW: 18 });
      text(w[k], x0, ys[i] + jig, { font: `400 ${sz[i]}px "Lilita One"`, fill: COL.cream, outlineW: 18 });
    }
  });
  stroke([[-340, 190], [340, 190]], 5, { line: '#7e5a8e' });
  if (letters > 15) text('MORE OPTIONS. LESS HAPPY.', 0, 262, { font: '400 54px VT323', fill: COL.fluo });
  if (letters > 15) { sandwich(-40, 380, .5, 'egg'); text('×1', 70, 384, { font: '400 64px "Lilita One"', fill: COL.cream, outlineW: 10 }); }
}

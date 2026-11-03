// Spotlight Effect: Art Deco reel, 1080x1920. Deterministic in t: window.renderAt(t) draws one frame.
import { C, TAU, clamp, lerp, seg, ss, eo, ei, eio, back, hash, mix, rgba, goldGrad, gline, airbrush, toPath, arcPts, rectPts, sunburst, stepArchPts, archFrame, fan, chevrons, sparkle, speedLines, glow, beam, vignette, fishScale } from './engine/deco.js';
import { FONTS, goldText, measure, titleBar, decoDigits, yearBadge, dial, clockFace } from './engine/type.js';
import { buildSign, drawSign, litSequence } from './engine/bulbs.js';
import { mara, maraHead, guest, eye, tshirt, overhead, glovedHand, MC } from './chars.js';
import { DUR, W, H, q, SHOTS, shotAt, DOORS, SUBS, EYE_T, MARQ, MARQ_T, BUBBLE_T, DIAL, END_T, HITS, src, OUT_DUR } from './story.js';

const cv = document.getElementById('c'), g = cv.getContext('2d');
const CX = W / 2;

// ---------- shared pieces ----------
function ground(top = '#120e0a', bot = '#040302') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-W, -H, W * 3, H * 3); }
function cam(cx, cy, z = 1, rot = 0, shake = 0, t = 0) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(CX, H / 2);
  if (shake) { const f = Math.floor(t * 24); g.translate((hash(f) - .5) * shake * 2, (hash(f + 91) - .5) * shake * 2); }
  g.scale(z, z); if (rot) g.rotate(rot); g.translate(-cx, -cy);
}
const reset = () => g.setTransform(1, 0, 0, 1, 0, 0);
// ignition: 0 before t0, flash overshoot ~1.6 settling to 1 in 0.18 s
const ign = (t, t0) => t < t0 ? 0 : t - t0 < .18 ? 1 + .6 * (1 - (t - t0) / .18) : 1;
const settle = (u) => { u = clamp(u); return 1 - Math.exp(-u * 7) * Math.cos(u * 14); };   // mechanical overshoot + settle

// The spotlight: an ivory cone from a lamp above to a pool on the floor
function spotlight(x0, y0, x1, y1, r, a = 1, color = '#fbf0d4') {
  if (a <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, rgba(color, .05 * a)); gr.addColorStop(1, rgba(color, .26 * a));
  g.beginPath(); g.moveTo(x0 - r * .06, y0); g.lineTo(x0 + r * .06, y0); g.lineTo(x1 + r, y1); g.lineTo(x1 - r, y1); g.closePath(); g.fillStyle = gr; g.fill();
  g.save(); g.translate(x1, y1); g.scale(1, .2);
  const pg = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.1); pg.addColorStop(0, rgba(color, .55 * a)); pg.addColorStop(.7, rgba(color, .22 * a)); pg.addColorStop(1, rgba(color, 0));
  g.fillStyle = pg; g.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4); g.restore();
  g.restore();
  // the lamp: a gold stepped can
  if (y0 > -200) { gline(g, [[x0 - 26, y0 - 30], [x0 + 26, y0 - 30], [x0 + 18, y0], [x0 - 18, y0], [x0 - 26, y0 - 30]], { w: 2.2, glow: .6 * a }); glow(g, x0, y0, 70, '#fff3cf', .6 * a); }
}
// The ballroom stage: sunburst wall, stepped arch, three gold-nosed steps, marble floor
function stage(t, { burst = 1, arch = 1, floorY = 1500, tint = 0 } = {}) {
  ground('#14100b', '#050403');
  sunburst(g, CX, floorY - 300, { rays: 40, r0: 120, r1: 1500, mode: 'wedges', colorA: `rgba(201,162,75,${.07 * burst})`, a0: Math.PI, a1: TAU });
  sunburst(g, CX, floorY - 300, { rays: 40, r0: 260, r1: 1300, mode: 'lines', w: 1.4, alpha: .35 * burst, a0: Math.PI, a1: TAU, sheen: .3 + .1 * Math.sin(t * .7) });
  if (arch) archFrame(g, CX, floorY - 150, 860, 1250, { rings: 3, gap: 16, steps: 3, burst: false, lw: 2.4, sheen: .4 });
  // pilasters with chevrons
  for (const sg of [-1, 1]) { const x = CX + sg * 470; gline(g, [[x, floorY - 1300], [x, floorY - 150]], { w: 2.4 }); gline(g, [[x + sg * 14, floorY - 1300], [x + sg * 14, floorY - 150]], { w: 1.2 }); }
  // steps
  for (let i = 0; i < 3; i++) {
    const y = floorY - 150 + i * 50, hw = 380 + i * 90;
    g.fillStyle = i % 2 ? '#0d0a07' : '#15110c'; g.fillRect(CX - hw, y, hw * 2, 50);
    gline(g, [[CX - hw, y], [CX + hw, y]], { w: 2.4 });
  }
  // marble floor (one-point lines)
  g.fillStyle = '#0a0806'; g.fillRect(-W, floorY, W * 3, H);
  for (let i = -8; i <= 8; i++) gline(g, [[CX + i * 40, floorY], [CX + i * 260, floorY + 700]], { w: 1, alpha: .25 });
  for (let k = 0; k < 6; k++) { const y = floorY + 30 * Math.pow(1.6, k); gline(g, [[-100, y], [W + 100, y]], { w: 1, alpha: .2 }); }
}
// door leaves: k = 0 open, 1 shut. Hinged at the frame edges, meeting on the centre seam.
function doors(k) {
  if (k <= 0) return;
  reset();
  const w = CX * k;
  for (const sg of [-1, 1]) {
    const x0 = sg < 0 ? 0 : W - w;
    g.save(); g.beginPath(); g.rect(x0, 0, w, H); g.clip();
    const gr = g.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, '#0b0907'); gr.addColorStop(.5, '#17120c'); gr.addColorStop(1, '#0b0907');
    g.fillStyle = gr; g.fillRect(x0, 0, w, H);
    const ex = sg < 0 ? w : W - w;     // the leading edge
    // half sunburst on each leaf, so the shut doors read as one emblem
    sunburst(g, ex, H / 2, { rays: 24, r0: 70, r1: 520, mode: 'lines', w: 1.6, a0: sg < 0 ? Math.PI / 2 : -Math.PI / 2, a1: sg < 0 ? Math.PI * 1.5 : Math.PI / 2, alpha: .8 });
    gline(g, rectPts(x0 + 30, 40, w - 60, H - 80), { w: 2.2 }); gline(g, rectPts(x0 + 44, 54, w - 88, H - 108), { w: 1 });
    chevrons(g, x0 + 50, x0 + w - 50, 160, { n: 6, h: 22, rows: 3, gap: 10, w: 1.4 });
    chevrons(g, x0 + 50, x0 + w - 50, H - 230, { n: 6, h: 22, rows: 3, gap: 10, w: 1.4 });
    g.restore();
    gline(g, [[ex, 0], [ex, H]], { w: 3, glow: .4 });
  }
  if (k > .98) { glow(g, CX, H / 2, 160, '#ffcf7a', .4); sparkle(g, CX, H / 2, 40, { alpha: .9 }); }
}
function grain(t) {
  const f = Math.floor(t * 24); g.save(); g.globalAlpha = .045;
  for (let i = 0; i < 260; i++) { const x = hash(f * 13.1 + i) * W, y = hash(f * 7.7 + i * 3.3) * H; g.fillStyle = i % 2 ? '#fff' : '#000'; g.fillRect(x, y, 2, 2); }
  g.restore();
}

// ---------- subtitle card: two lines, unfolding from the centre ----------
function plaque(cx, cy, w, h, step = .14) {
  const hw = w / 2, hh = h / 2, s = Math.min(h * step, 16);
  return [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy - hh + s], [cx + hw + s, cy - hh + s], [cx + hw + s, cy - hh + 2 * s], [cx + hw + 2 * s, cy - hh + 2 * s],
  [cx + hw + 2 * s, cy + hh - 2 * s], [cx + hw + s, cy + hh - 2 * s], [cx + hw + s, cy + hh - s], [cx + hw, cy + hh - s], [cx + hw, cy + hh],
  [cx - hw, cy + hh], [cx - hw, cy + hh - s], [cx - hw - s, cy + hh - s], [cx - hw - s, cy + hh - 2 * s], [cx - hw - 2 * s, cy + hh - 2 * s],
  [cx - hw - 2 * s, cy - hh + 2 * s], [cx - hw - s, cy - hh + 2 * s], [cx - hw - s, cy - hh + s], [cx - hw, cy - hh + s]];
}
function subCard(text, p, out, cy = 1430) {
  const k = eio(clamp(p)) * (1 - eio(clamp(out))); if (k <= 0) return;
  const lines = text.split('|'), size = 50;
  const tw = Math.max(...lines.map(l => measure(g, l, size, FONTS.sans, 1, 600)));
  const Wc = Math.min(960, tw + 90), Hc = size * (lines.length > 1 ? 3.2 : 1.95);
  const w = Wc * ss(seg(k, 0, .7)), hh = Hc / 2 * ss(seg(k, .15, .75));
  reset(); g.save();
  gline(g, [[CX - w / 2 - 20, cy], [CX + w / 2 + 20, cy]], { w: 1.4, alpha: 1 - ss(seg(k, .3, .8)) });
  if (hh > 1) {
    const pts = plaque(CX, cy, w, hh * 2);
    g.fillStyle = 'rgba(6,5,4,.9)'; g.fill(toPath(pts, true));
    gline(g, pts, { w: 2, closed: true, bb: [CX - Wc / 2, cy - Hc, CX + Wc / 2, cy + Hc], sheen: .35 });
    if (hh > 14) gline(g, plaque(CX, cy, w - 16, hh * 2 - 16), { w: .9, closed: true, bb: [CX - Wc / 2, cy - Hc, CX + Wc / 2, cy + Hc], sheen: .6 });
  }
  const ta = ss(seg(k, .6, 1));
  if (ta > 0) {
    g.globalAlpha = ta; g.font = `600 ${size}px ${FONTS.sans}`; if ('letterSpacing' in g) g.letterSpacing = '1px';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, i) => {
      const y = cy + (i - (lines.length - 1) / 2) * size * 1.22 + size * .08;
      // words in CAPS are the punchline: gold instead of ivory
      const words = l.split(' '); let x = CX - measure(g, l, size, FONTS.sans, 1, 600) / 2;
      g.textAlign = 'left';
      words.forEach((wd, j) => {
        const caps = wd.replace(/[^A-Za-z]/g, '').length > 2 && wd === wd.toUpperCase() && /[A-Z]/.test(wd);
        g.fillStyle = caps ? C.gold2 : C.ivory; g.fillText(wd, x, y);
        x += measure(g, wd + (j < words.length - 1 ? ' ' : ''), size, FONTS.sans, 1, 600);
      });
    });
  }
  g.restore();
}
function subtitles(t) {
  for (const [a, b, txt] of SUBS) if (t >= a - .05 && t < b + .3) subCard(txt, (t - a) / .35, (t - b) / .3);
}

// ---------- shots ----------
const SH = {};

// 0: spotlight slams on, Mara trips, the coupes fly
SH.hook = (t) => {
  const z = lerp(1, 1.14, eio(seg(t, 0, 3.5))), shk = t > 1 && t < 1.4 ? 14 * (1.4 - t) / .4 : 0;
  cam(CX, 1060, z, 0, shk, t); stage(t);
  const L = ign(t, .04), tq = q(t);
  spotlight(CX, 120, CX, 1520, 230, L);
  const fall = ss(seg(tq, .1, .95)), down = ss(seg(tq, .9, 1.25));
  const P = down > 0
    ? { rot: lerp(.42, .08, down), knee: down, hl: [-150, -330], hr: [150, -330], face: 'wince', tilt: .1 }
    : { rot: fall * .42, hl: [lerp(-70, -190, fall), lerp(-380, -760, fall)], hr: [lerp(90, 200, fall), lerp(-420, -700, fall)], face: 'shock', look: [.3, -.6], skirt: fall };
  mara(g, CX - fall * 40, 1500, 1.0, P);
  // the tray and three coupes, thrown up and smashed on the downbeat at 1.0
  const tt = tq - .15;
  if (tt > 0 && tt < .85) {
    for (let i = 0; i < 4; i++) {
      const vx = [-260, -90, 120, 300][i], vy = [-1500, -1800, -1700, -1400][i];
      const x = CX + 120 + vx * tt, y = 760 + vy * tt + 3600 * tt * tt;
      g.save(); g.translate(x, y); g.rotate(tt * (i % 2 ? 9 : -7));
      if (i === 3) { gline(g, arcPts(0, 0, 70, 0, TAU, 40, 14), { w: 3 }); }
      else { gline(g, [[-34, -20], [34, -20], [6, 6], [6, 40], [24, 48], [-24, 48], [-6, 40], [-6, 6], [-34, -20]], { w: 2.4 }); g.fillStyle = 'rgba(255,214,120,.45)'; g.beginPath(); g.moveTo(-28, -16); g.lineTo(28, -16); g.lineTo(4, 4); g.lineTo(-4, 4); g.fill(); }
      g.restore();
    }
  }
  if (t >= 1.0) {   // shards and fizz
    for (let i = 0; i < 26; i++) { const u = t - 1, a = -Math.PI * (.1 + .8 * hash(i)), sp = 300 + 500 * hash(i + 9); const x = CX + 150 + Math.cos(a) * sp * u, y = 1520 + Math.sin(a) * sp * u + 900 * u * u; if (y < 1560) sparkle(g, x, y, 10 * (1 - seg(u, .3, 1.6)), { alpha: 1 - seg(u, .4, 1.8), rot: i }); }
  }
};

// 1: close-up, hands rise to cover the face
SH.face = (t) => {
  const u = t - 3.5, tq = q(t);
  cam(CX, 960, 1, 0, u < .25 ? 6 : 0, t);
  ground('#1c0a0e', '#050203');
  sunburst(g, CX, 900, { rays: 36, r0: 0, r1: 1400, mode: 'wedges', colorA: 'rgba(142,27,46,.22)', rot: u * .05 });
  sunburst(g, CX, 900, { rays: 36, r0: 380, r1: 1400, mode: 'lines', w: 1.4, alpha: .4, rot: u * .05 });
  glow(g, CX, 820, 520, '#fbf0d4', .35);
  const cover = ss(seg(tq, 4.2, 4.8));
  maraHead(g, CX, 960, 5.2, { face: cover > .5 ? 'shut' : 'wince', blush: ss(seg(tq, 3.7, 5)), tilt: -.04 });
  // gloved hands sliding up over the cheeks
  for (const sg of [-1, 1]) glovedHand(g, CX + sg * lerp(300, 120, cover), lerp(1700, 1020, cover), 1.5, sg * lerp(.45, .12, cover), -sg);
};

// 2: the ring of eyes switches on, one per beat
SH.eyes = (t) => {
  const z = lerp(1.25, 1, eio(seg(t, 6, 9))), tq = q(t);
  cam(CX, 960, z); ground('#0d0a08', '#030202');
  const squeeze = ss(seg(t, 8.6, 9.4));
  const cy = 900, R = lerp(400, 330, squeeze);
  sunburst(g, CX, cy, { rays: 64, r0: 120, r1: 1600, mode: 'lines', w: 1, alpha: .25, rot: t * .02 });
  // the escalation: dozens of small eyes behind, from 10.5
  for (let i = 0; i < 30; i++) {
    const t0 = 8.7 + hash(i * 3.3) * .8; if (t < t0) continue;
    const a = hash(i) * TAU, rr = 560 + hash(i + 5) * 300;
    const x = CX + Math.cos(a) * rr * .9, y = cy + Math.sin(a) * rr * 1.15;
    eye(g, x, y, 34, ss(seg(t, t0, t0 + .12)), [(CX - x) / 600, (cy + 300 - y) / 600], .75);
  }
  EYE_T.forEach((t0, i) => {
    const a = -Math.PI / 2 + i * TAU / 8, x = CX + Math.cos(a) * R, y = cy + Math.sin(a) * R * 1.25;
    const open = back(seg(t, t0, t0 + .2), 1.4), lit = Math.min(1.3, ign(t, t0));
    if (t >= t0 - .01) { glow(g, x, y, 150, '#ffcf7a', .25 * lit); eye(g, x, y, 78, open, [(CX - x) / 400, (cy + 380 - y) / 500], Math.min(1, lit)); }
    else gline(g, [[x - 60, y], [x + 60, y]], { w: 1.4, alpha: .4 });
  });
  spotlight(CX, 380, CX, 1330, 150, 1);
  mara(g, CX, 1330, .55, { knee: 1, rot: .05, hl: [-150, -330], hr: [150, -330], face: 'wince', tilt: .1, blink: 0 });
};

// 3: NAKAKAHIYA spelled in bulbs, one letter per beat; Mara shrinks under it
let SIGN1 = null, SIGN2 = null;
SH.marquee = (t) => {
  const tq = q(t), z = lerp(1, 1.1, eio(seg(t, 12, 18)));
  cam(CX, 960, z); ground('#120c08', '#040302');
  sunburst(g, CX, 640, { rays: 48, r0: 0, r1: 1500, mode: 'wedges', colorA: 'rgba(201,162,75,.06)' });
  SIGN1 = SIGN1 || buildSign(MARQ, { font: 'Limelight', size: 220, spacing: 20, track: .06 });
  const s = 900 / SIGN1.w, x = CX - SIGN1.w * s / 2, y = 540;
  // the sign's frame
  gline(g, rectPts(x - 30, y - 30, SIGN1.w * s + 60, SIGN1.h * s + 40), { w: 2.4 });
  gline(g, rectPts(x - 42, y - 42, SIGN1.w * s + 84, SIGN1.h * s + 64), { w: 1 });
  drawSign(g, SIGN1, x, y, s, { lit: litSequence(t, MARQ_T, { chaseFrom: 15.4, chaseSpeed: 18 }), enamel: '#2a0a12' });
  const shrink = lerp(.6, .42, ss(seg(t, 12.5, 15.5)));
  spotlight(CX, 820, CX, 1300, 160 * shrink / .6, 1);
  mara(g, CX, 1300, shrink, { knee: 1, rot: .05, hl: [-60, -640], hr: [60, -640], face: 'shut', tilt: .12 });
};

// 4: 3 a.m. Silence, a clock, a face that can't sleep
SH.night = (t) => {
  const u = t - 18, tq = q(t);
  cam(CX, 960, lerp(1, 1.06, seg(t, 18, 24))); ground('#070a16', '#020308');
  sunburst(g, CX, 560, { rays: 60, r0: 300, r1: 1400, mode: 'lines', w: 1, alpha: .18 });
  const sweep = eio(seg(t, 18.2, 21.2)), hours = lerp(10, 15, sweep), hh = Math.floor(hours), mm = (hours - hh) * 60;
  clockFace(g, CX, 560, 250, { h: hh, m: mm, s: sweep < 1 ? null : Math.floor((t - 21.2) * 1) % 60 + 0, lit: .4, roman: true });
  // a replay flicker of the eyes at 22.5 and 23.0
  for (const f of [22.5, 23.0]) if (t >= f && t < f + .25) for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * TAU / 8; eye(g, CX + Math.cos(a) * 420, 1180 + Math.sin(a) * 520, 52, 1, [0, 0], .35); }
  glow(g, CX, 1180, 420, '#6c86c8', .25);
  const blink = tq > 21.6 && tq < 21.8 ? 1 : 0;
  maraHead(g, CX, 1150, 3.2, { face: 'awake', look: [0, -.8], blink, light: .78 });
  // the blanket edge
  airbrush(g, toPath([[-200, 1340], [W + 200, 1300], [W + 200, H + 200], [-200, H + 200]], true), { base: '#1c2140', light: '#3a4270', dark: '#05060f', dir: -2.3, rim: 1.6 });
  chevrons(g, 40, W - 40, 1380, { n: 10, h: 24, rows: 2, gap: 12, w: 1.2 });
};

// 5: "PERO ANG TOTOO…" on black, then the doors
SH.doorT = (t) => {
  cam(CX, 960); ground('#0c0907', '#030202');
  sunburst(g, CX, 960, { rays: 32, r0: 200, r1: 1300, mode: 'lines', w: 1.2, alpha: .3 * ss(seg(t, 24.2, 25)), rot: t * .03 });
  titleBar(g, 'PERO ANG TOTOO…', CX, 940, { p: seg(t, 24.05, 25.4), size: 62, track: 3, wings: false, pad: 48, sheen: .45 + .3 * Math.sin(t * 2) });
};

// 6: the real crowd: everyone under their own spotlight, busy with themselves
const CROWD = [   // [x, waist y, scale, kind, light-on time]
  [190, 1090, .42, 'card', 26.9], [890, 1090, .42, 'watch', 27.3], [360, 1060, .38, 'stain', 27.7], [720, 1060, .38, 'mirror', 28.1],
  [175, 1500, .72, 'stain', 28.6], [905, 1500, .72, 'card', 29.1],
  [250, 1990, 1.08, 'mirror', 29.6], [830, 1990, 1.08, 'watch', 30.1],
];
SH.crowd = (t) => {
  const tq = q(t), ty = lerp(900, 1020, eio(seg(t, 26.5, 34.5)));
  cam(CX, ty, 1); stage(t, { burst: .5, arch: 1, floorY: 1150 });
  // Mara, far back, small, the only burgundy
  spotlight(CX, 300, CX, 1150, 90, .9);
  mara(g, CX, 1150, .3, { knee: 1, rot: .05, hl: [-150, -330], hr: [150, -330], face: 'wince' });
  g.fillStyle = 'rgba(4,3,2,.35)'; g.fillRect(-W, 1150, W * 3, H);
  for (const [x, y, s, kind, t0] of CROWD) {
    const L = ign(t, t0);
    if (L > 0) spotlight(x, y - 760 * s - 260, x, y, 210 * s, Math.min(1.2, L) * .9);
    guest(g, x, y, s, kind, tq, { alpha: lerp(.55, 1, Math.min(1, L)) });
  }
};

// 7: four guests, four private worries
const WORRY = [['Ang buhok', 'ko!'], ['May mantsa', 'ba ako?'], ['Late na', 'ako!'], ['Ano’ng', 'sasabihin ko?']];
const KINDS = ['mirror', 'stain', 'watch', 'card'];
SH.bubbles = (t) => {
  const tq = q(t);
  cam(CX, 960, lerp(1.04, 1, eio(seg(t, 34.5, 36)))); ground('#110d09', '#040302');
  for (let i = 0; i < 4; i++) sunburst(g, 135 + i * 270, 1250, { rays: 18, r0: 60, r1: 900, a0: Math.PI * 1.15, a1: Math.PI * 1.85, mode: 'lines', w: 1, alpha: .18 });
  const glance = t >= 40.2 && t < 42.6;
  for (let i = 0; i < 4; i++) {
    const x = 135 + i * 270, y = 1280, s = .78, t0 = BUBBLE_T[i];
    spotlight(x, 360, x, y, 120, .85);
    const look = glance && hash(i + Math.floor((t - 40.2) * 2)) > .25;
    guest(g, x, y, s, KINDS[i], tq, { glance: look ? 1 : 0 });
    // the thought medallion
    if (t >= t0) {
      const k = back(seg(t, t0, t0 + .3), 1.6), by = i % 2 ? 790 : 560, br = 124 * k;
      for (let d = 0; d < 3; d++) { const p = seg(t, t0 - .15 + d * .05, t0 + d * .05); if (p > 0) { g.beginPath(); g.arc(lerp(x, x, d / 3), lerp(940, by + br, (d + 1) / 4), 6 + d * 4, 0, TAU); g.fillStyle = C.gold1; g.fill(); } }
      sunburst(g, x, by, { rays: 24, r0: br * 1.04, r1: br * 1.28, mode: 'lines', w: 1.2, alpha: .8 });
      g.beginPath(); g.arc(x, by, br, 0, TAU); g.fillStyle = '#0b0907'; g.fill();
      gline(g, arcPts(x, by, br, 0, TAU, 60), { w: 2.4, glow: .3 }); gline(g, arcPts(x, by, br * .9, 0, TAU, 60), { w: 1 });
      if (k > .7) {
        g.save(); g.globalAlpha = ss(seg(t, t0 + .15, t0 + .35));
        g.font = `600 35px ${FONTS.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.ivory;
        g.fillText(WORRY[i][0], x, by - 21); g.fillText(WORRY[i][1], x, by + 23); g.restore();
      }
    }
  }
};

// 8: the name of it
SH.title = (t) => {
  cam(CX, 960); ground('#140f09', '#040302');
  sunburst(g, CX, 900, { rays: 48, r0: 0, r1: 1600, mode: 'wedges', colorA: 'rgba(201,162,75,.08)', rot: (t - 44) * .03 });
  sunburst(g, CX, 900, { rays: 48, r0: 330, r1: 1600 * ss(seg(t, 44.1, 45)), mode: 'lines', w: 1.6, alpha: .5, rot: (t - 44) * .03 });
  spotlight(CX, 140, CX, 1240, 300, ign(t, 44.5) * .8);
  g.save(); g.globalAlpha = ss(seg(t, 44.2, 44.6));
  goldText(g, 'ANG TAWAG DITO', CX, 700, { size: 40, font: FONTS.sans, weight: 600, track: 14, shadow: false });
  g.restore();
  titleBar(g, 'SPOTLIGHT', CX, 860, { p: seg(t, 44.3, 45.6), size: 104, track: 6, sub: null, wings: false, pad: 56 });
  if (t > 45.2) {
    const k = ss(seg(t, 45.2, 45.7));
    goldText(g, 'E F F E C T', CX, 1060 + (1 - k) * 30, { size: 74, font: FONTS.title, track: 10, alpha: k, sheen: lerp(-.2, 1.2, seg(t, 45.4, 46.6)) });
    chevrons(g, CX - 200, CX + 200, 1110, { n: 8, h: 16, rows: 2, gap: 8, w: 1.2 });
  }
};

// 9: the experiment: one embarrassing T-shirt, Cornell, 2000
SH.shirt = (t) => {
  const tq = q(t);
  cam(CX, 960, lerp(1, 1.08, eio(seg(t, 48, 54)))); ground('#0f0b08', '#040302');
  archFrame(g, CX, 1150, 760, 1000, { rings: 2, gap: 16, steps: 3, burst: true, lw: 2.2 });
  spotlight(CX, 160, CX, 1140, 250, ign(t, 48.1));
  const sw = Math.sin(tq * 2.2) * .04 * (1 - seg(t, 48, 51)) + (t > 51.4 ? Math.sin((tq - 51.4) * 9) * .05 * (1 - seg(t, 51.4, 52.6)) : 0);
  g.save(); g.translate(CX, 470); g.rotate(sw);
  gline(g, [[0, -60], [0, -10]], { w: 2 }); gline(g, [[-150, 60], [0, -10], [150, 60], [-150, 60]], { w: 3 });
  tshirt(g, 0, 250, 1.55, tq);
  g.restore();
  yearBadge(g, '2000', CX - 250, 1250, 62, { p: seg(t, 48.4, 49.2) });
  g.save(); g.globalAlpha = ss(seg(t, 48.6, 49.2));
  goldText(g, 'CORNELL', CX + 90, 1262, { size: 52, font: FONTS.deco, sy: 1.3, track: 6 });
  goldText(g, 'PAG-AARAL', CX + 90, 1300, { size: 26, font: FONTS.sans, weight: 600, track: 8, shadow: false });
  g.restore();
};

// 10: the dial. The guess rises to half, the truth drops to 23 %, then 1 in 4
SH.dial = (t) => {
  const tq = q(t);
  const lift = eio(seg(t, 63.6, 64.4));
  cam(CX, lerp(960, 1010, lift), lerp(1, .96, lift), 0, t > DIAL.drop && t < DIAL.drop + .3 ? 9 : 0, t);
  ground('#110d09', '#040302');
  sunburst(g, CX, 760, { rays: 40, r0: 420, r1: 1500, a0: Math.PI, a1: TAU, mode: 'lines', w: 1.2, alpha: .3 });
  let v = 0;
  if (t < DIAL.up0) v = 0; else if (t < DIAL.drop) v = .5 * (seg(t, DIAL.up0, DIAL.up1) < 1 ? eio(seg(t, DIAL.up0, DIAL.up1)) : 1) + (t > DIAL.up1 ? .012 * Math.sin((t - DIAL.up1) * 30) * Math.exp(-(t - DIAL.up1) * 6) : 0);
  else v = .23 + .27 * Math.exp(-(t - DIAL.drop) * 9) * Math.cos((t - DIAL.drop) * 26);
  const truth = t >= DIAL.drop;
  dial(g, CX, 760, 400, clamp(v, 0, 1), { labels: ['0', '25', '50', '75', '100'], ticks: 20, lit: truth ? ign(t, DIAL.drop) * .8 : .3, needleColor: null });
  goldText(g, '%', CX + 330, 790, { size: 44, font: FONTS.deco, alpha: .8 });
  // readout plaque
  const py = 990;
  gline(g, plaque(CX, py, 560, 190), { w: 2.2, closed: true }); gline(g, plaque(CX, py, 540, 170), { w: .9, closed: true });
  const label = truth ? 'ANG TOTOO' : 'HULA NILA';
  goldText(g, label, CX, py - 46, { size: 30, font: FONTS.sans, weight: 600, track: 10, shadow: false, alpha: t > 54.4 ? 1 : 0 });
  const pct = Math.round(clamp(v, 0, 1) * 100);
  if (t > DIAL.up0) decoDigits(g, (truth ? 23 : pct) + '%', CX, py + 66, 92, { rules: false, sy: 1.2, alpha: 1 });
  // 1 in 4: four deco figures, one in a spotlight
  if (t >= 63.8) {
    for (let i = 0; i < 4; i++) {
      const x = CX + (i - 1.5) * 200, y = 1300, on = i === 1, k = ss(seg(t, 63.9 + i * .12, 64.3 + i * .12));
      if (on) spotlight(x, 1110, x, y + 10, 70, ign(t, DIAL.oneIn4));
      g.save(); g.globalAlpha = k * (on && t >= DIAL.oneIn4 ? 1 : .45);
      const col = on && t >= DIAL.oneIn4 ? C.gold2 : C.gold0;
      g.beginPath(); g.arc(x, y - 120, 22, 0, TAU); g.fillStyle = col; g.fill();
      g.beginPath(); g.moveTo(x - 34, y - 88); g.lineTo(x + 34, y - 88); g.lineTo(x + 22, y); g.lineTo(x - 22, y); g.closePath(); g.fill();
      g.restore();
    }
  }
};

// 11: Busby Berkeley overhead: everyone is the star of their own circle
SH.kaleido = (t) => {
  const u = t - 68, tq = q(t);
  cam(CX, 880, lerp(1.25, 1, eio(seg(t, 68, 71)))); ground('#0b0806', '#030202');
  const glowUp = ss(seg(t, 72.8, 73.6));
  sunburst(g, CX, 880, { rays: 72, r0: 140, r1: 1500, mode: 'lines', w: 1, alpha: .28 });
  const rings = [[6, 300, 78, 1], [12, 540, 66, -1], [18, 780, 58, 1]];
  rings.forEach(([n, R, r, dir], ri) => {
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n + dir * u * (.25 - ri * .05);
      const x = CX + Math.cos(a) * R, y = 880 + Math.sin(a) * R;
      const on = ign(t, 68.3 + ri * .5 + (i % 3) * .08);
      if (on <= 0) continue;
      const lv = Math.min(1, on) * lerp(.6, 1, glowUp);
      glow(g, x, y, r * 2.2, '#fbf0d4', .5 * lv);
      g.beginPath(); g.arc(x, y, r * 1.2, 0, TAU); g.fillStyle = `rgba(251,240,212,${.12 * lv})`; g.fill();
      gline(g, arcPts(x, y, r * 1.2, 0, TAU, 36), { w: 1.6, alpha: lv });
      guest(g, x, y + r * .95, r * .0042, ['mirror', 'watch', 'card', 'stain'][(i + ri) % 4], tq + i);
      if (glowUp > 0 && (i + ri) % 2 === 0) sparkle(g, x + r, y - r, 14 * glowUp * (.6 + .4 * Math.sin(t * 6 + i)), { alpha: .9 });
    }
  });
  // centre: Mara, burgundy, in hers
  glow(g, CX, 880, 260, '#fbf0d4', .6);
  gline(g, arcPts(CX, 880, 150, 0, TAU, 60), { w: 2.6, glow: .5 });
  sunburst(g, CX, 880, { rays: 24, r0: 160, r1: 210, mode: 'lines', w: 1.4, rot: -u * .2 });
  mara(g, CX, 880 + 130, .27, { face: 'neutral', hl: [-110, -400], hr: [110, -400], look: [0, .3] });
};

// 12: she gets up, bows, and dances
SH.rise = (t) => {
  const tq = q(t), u = t - 77;
  cam(CX, lerp(1080, 1020, eio(seg(t, 77, 82))), lerp(1.05, 1.0, eio(seg(t, 77, 82)))); stage(t, { burst: lerp(.6, 1.6, ss(seg(t, 80, 81))) });
  const warm = ss(seg(t, 80, 81));
  spotlight(CX, 120, CX, 1520, lerp(230, 320, warm), 1);
  if (warm > 0) sunburst(g, CX, 700, { rays: 32, r0: 300, r1: 1200 * warm, mode: 'lines', w: 2, alpha: .5 * warm, rot: tq * .3, glow: .4 });
  const stand = ss(seg(tq, 77.3, 78.3)), bow = Math.sin(Math.PI * seg(tq, 79.2, 80.1)) * 1;
  let P;
  if (tq < 80.2) {
    P = { knee: 1 - stand, rot: .08 * (1 - stand), hl: [lerp(-150, -110, stand), lerp(-330, -400, stand)], hr: [lerp(150, 110, stand), lerp(-330, -400, stand)], face: stand > .7 ? 'smile' : 'neutral', look: [0, bow * .8] };
    if (bow > .001) Object.assign(P, { knee: bow * .16, hl: [lerp(-110, -190, bow), lerp(-400, -300, bow)], hr: [lerp(110, 190, bow), lerp(-400, -300, bow)], face: bow > .4 ? 'shut' : 'smile', skirt: 0 });
  } else { const b = Math.floor((tq - 80.2) * 2) % 2; P = { face: 'smile', skirt: b ? .8 : -.8, rot: b ? .06 : -.06, hl: b ? [-200, -760] : [-170, -420], hr: b ? [170, -420] : [200, -760], tilt: b ? .08 : -.08 }; }
  mara(g, CX, 1500, 1.0, P);
  // the crowd in silhouette, foreground, watching nothing in particular
  for (let i = 0; i < 6; i++) {
    const x = 90 + i * 180, y = 1980 + (i % 2) * 40;
    g.save(); g.globalAlpha = .95; guest(g, x, y, .9, ['card', 'watch', 'mirror', 'stain', 'card', 'watch'][i], tq, { tone: '#050404' }); g.restore();
  }
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-W, 1600, W * 3, H);
};

// 13: the end sign, letter by letter; then the lights go out to one bulb
SH.end = (t) => {
  cam(CX, 960); ground('#0c0907', '#030202');
  sunburst(g, CX, 760, { rays: 48, r0: 380, r1: 1400, mode: 'lines', w: 1.2, alpha: .3 * ss(seg(t, 84.5, 85.5)) * (1 - seg(t, 89.0, 89.6)) });
  SIGN2 = SIGN2 || buildSign('SPOTLIGHT', { font: 'Limelight', size: 220, spacing: 20, track: .06 });
  const s = 960 / SIGN2.w, x = CX - SIGN2.w * s / 2, y = 600;
  const seq = litSequence(t, END_T, { chaseFrom: 84.2, chaseSpeed: 16, chaseDim: .25 });
  const off = (li, bi, gi) => { const tOff = 89.0 + (SIGN2.count - gi) / SIGN2.count * .6; return gi === 0 ? 1 : t > tOff ? 0 : 1; };
  drawSign(g, SIGN2, x, y, s, { lit: (li, bi, gi) => seq(li, bi, gi) * off(li, bi, gi) });
  const k = 1 - seg(t, 89.0, 89.5);
  if (t > 84.6) {
    titleBar(g, 'EFFECT', CX, 920, { p: seg(t, 84.6, 85.6) * k + (k < 1 ? 0 : 0), size: 70, track: 12, wings: true, pad: 50 });
    g.save(); g.globalAlpha = ss(seg(t, 85.4, 86)) * k;
    goldText(g, 'Gilovich, Medvec & Savitsky (2000)', CX, 1080, { size: 30, font: FONTS.sans, weight: 400, track: 2, shadow: false });
    g.restore();
  }
  if (t >= HITS.last && t < HITS.last + .5) sparkle(g, x + SIGN2.w * s - 30, y + 10, 60 * (1 - (t - HITS.last) / .5), { alpha: 1 });
};

// ---------- frame ----------
window.OUT_DUR = OUT_DUR;
window.renderAt = (tf) => {
  const t = src(tf);   // film time -> story time (dead air is cut out)
  reset(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const [, , name] = shotAt(t);
  SH[name](t);
  reset();
  vignette(g, W, H, .5);
  // doors close over the outgoing shot and split on the new one
  for (const [T, d] of DOORS) { if (t >= T - d && t < T + d) { const k = t < T ? eio(seg(t, T - d, T)) : 1 - eio(seg(t, T, T + d)); doors(k); } }
  subtitles(t);
  grain(t);
};
window.fontsReady = (async () => {
  await Promise.all(['Limelight', 'Poiret', 'Italiana'].map(f => document.fonts.load(`40px ${f}`)).concat([document.fonts.load('600 40px Josefin'), document.fonts.load('400 40px Josefin'), document.fonts.load('700 40px Josefin')]));
  return true;
})();

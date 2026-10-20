// Paradox of Choice — Sci-Fi Sitcom Toon, 1080x1920
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, monotone, TAU } from '/core/lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, screenRect, reset } from './toon.js';
import { benny, oona, special, sandwich, remote, PAL } from './chars.js';
import * as Wd from './worlds.js';
import { DUR, q, VO, SHOTS, shotAt, WIPES, TAGS, T, CUES } from './story.js';

init(document.getElementById('c'));
const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
const LINES = await J('lines.json'), DURS = (await J('voices/dur.json')) || {}, LIPS = (await J('voices/lips.json')) || {}, WORDS = (await J('voices/words.json')) || {};
const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));
const vdur = id => DURS[id] ?? LINE[id].text.length * .07;

// —— lip sync: the speaker's current line, stepped at 12 fps ——
function talk(who, t) {
  const tq = q(t);
  for (const [id, t0] of Object.entries(VO)) {
    if (LINE[id].who !== who) continue;
    if (tq >= t0 && tq < t0 + vdur(id)) {
      const k = Math.floor((tq - t0) * 24), lp = LIPS[id];
      const o = lp ? (lp.o[k] ?? 0) : .5, b = lp ? (lp.b[k] ?? .5) : .5;
      return { o, w: .8 + .45 * b - .2 * o, talking: true, id, u: tq - t0 };
    }
  }
  return { o: 0, w: 1, talking: false };
}
const blinkB = t => { const k = Math.floor(t * 12), c = Math.floor(k / 30); return hash(c * 7.1) > .35 && (k % 30 === 0 || k % 30 === 1); };
const blinkO = t => { const k = Math.floor(t * 12), c = Math.floor(k / 44); return hash(c * 3.7) > .3 && (k % 44 === 5 || k % 44 === 6 || k % 44 === 7); };
const popOpen = x => x <= 0 ? 0 : back(clamp(x / .3), 1.4);      // ~12 % overshoot, gentle
const landSq = (t, tl) => { const u = t - tl; if (u < 0 || u > .5) return 1; return 1 - .22 * Math.exp(-u * 9) * Math.cos(u * 30); };
const arcPos = (t, t0, t1, a, b, h) => { const u = clamp((t - t0) / (t1 - t0)); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * h]; };
const walk = (t, t0, t1, a, b) => lerp(a, b, ss(seg(t, t0, t1)));
const legsWalk = (tq, on, amp = 22) => on ? [[Math.sin(tq * 14) * amp, -Math.max(0, Math.cos(tq * 14)) * 16], [-Math.sin(tq * 14) * amp, -Math.max(0, -Math.cos(tq * 14)) * 16]] : [[0, 0], [0, 0]];

// —— camera: world point (cx, cy) at the centre of the frame ——
function cam(cx, cy, z, rot = 0, shake = 0, t = 0) {
  reset(); translate(W / 2, H / 2);
  if (shake) { const f = Math.floor(t * 24); translate((hash(f) - .5) * shake * 2, (hash(f + 77) - .5) * shake * 2); }
  scale(z); if (rot) rotate(rot); translate(-cx, -cy);
}

// —— default poses ——
const BREST = { L: { h: [-16, 150], bend: -18 }, R: { h: [16, 150], bend: 18 } };
const BWRING = { L: { h: [60, 96], bend: -24 }, R: { h: [-56, 100], bend: 24 } };        // hands wringing at the chest
const BUP = { L: { h: [-70, -150], bend: -30 }, R: { h: [70, -150], bend: 30 } };        // arms up, panic
const OCROSS = { L: { h: [92, 196], bend: -50 }, R: { h: [-84, 210], bend: 50 } };       // mitts crossed
function B(t, o = {}) {
  const m = talk('BENNY', t), tq = q(t);
  return { x: 430, y: 1560, s: 1, face: 1, t, nerv: .5, look: [.4, -.1], blink: blinkB(t), brow: 1, mouth: { o: m.o * 1.15, w: m.w, sm: -.5 },
    armL: BWRING.L, armR: BWRING.R, sq: 1 + .012 * Math.sin(tq * 3.1), headTilt: m.talking ? (m.o - .3) * .1 : Math.sin(tq * 1.7) * .03, ...o };
}
function O(t, o = {}) {
  const m = talk('OONA', t), tq = q(t);
  return { x: 880, y: 1600, s: .85, face: -1, t, lid: .54, look: [0, 0], blink: blinkO(t), mouth: { o: m.o, w: m.w, sm: -.15, skew: .15 },
    armL: OCROSS.L, armR: OCROSS.R, sq: 1 + .008 * Math.sin(tq * 2.3), lean: .1, headTilt: .06 + (m.talking ? (m.o - .3) * .06 : 0), ...o };
}
function sucked(P, t, t0, t1, px, py) {
  const u = ei(seg(t, t0, t1)); if (u <= 0) return P;
  return { ...P, x: lerp(P.x, px, u), y: lerp(P.y, py + 160, u), s: (P.s ?? 1) * (1 - u * .95), sq: 1 + u * .6, lean: (P.lean || 0) + u * .4 };
}
function spit(P, t, t0, tl, from, h = 160) {
  if (t < t0) return null;
  if (t < tl) { const [x, y] = arcPos(t, t0, tl, from, [P.x, P.y], h); const u = seg(t, t0, tl); return { ...P, x, y, sq: 1.25 - u * .25, lean: (P.lean || 0) + (1 - u) * .5 * (P.face || 1), s: (P.s ?? 1) * lerp(.4, 1, eo(u * 2)), armR: { h: [60, -150], bend: 30 }, armL: { h: [-60, -150], bend: -30 } }; }
  return { ...P, sq: (P.sq ?? 1) * landSq(t, tl) };
}
// Benny's eyes chase each word of line b1: ham = left, turkey = right
function hookLook(t) {
  const ws = WORDS.b1 || [], u = t - VO.b1; let lk = [0, .3];
  for (const [w, a] of ws) if (u >= a - .04) lk = /ham/i.test(w) ? [-.85, .55] : /turkey/i.test(w) ? [.85, .55] : [0, .2];
  return lk;
}
const speedLines = (t, dir = -1, a = .5, n = 16) => {
  reset(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.strokeStyle = '#ffffff'; g.lineCap = 'round';
  const f = Math.floor(t * 24);
  for (let i = 0; i < n; i++) { const x = hash(i * 9.1 + f) * W, y = hash(i * 3.3 + f * .7) * H, L = 160 + hash(i + f) * 340; g.lineWidth = 4 + hash(i * 1.3) * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + L * dir); g.stroke(); }
  g.globalAlpha = 1;
};

// ———————————————— shots ————————————————
const SH = {};
// 1. hook: inside the fridge looking out; whip tilt up from the sandwiches to Benny's face
SH.hook = (t, tq) => {
  // the lens whips from a close-up of the ham to the full face
  const u = eio(seg(t, T.whip[0], T.whip[1])), lx = lerp(250, 540, u), ly = lerp(1250, 960, u), lz = lerp(1.9, 1, u);
  const sh = t > T.turkey && t < T.turkey + .4 ? 16 * (1 - seg(t, T.turkey, T.turkey + .4)) : 0;
  cam(560 + (lx - 540) * .5, 640 + (ly - 960) * .5, 1.25 * Math.sqrt(lz), 0, sh, t); Wd.kitchen(t, { open: 0 });
  cam(lx, ly, lz, 0, sh, t);
  const scream = t > T.turkey - .05 && t < VO.b1 + vdur('b1');
  benny(B(t, { x: 540, y: 1700, s: 2.15, face: 1, look: hookLook(tq), nerv: scream ? 1.4 : .8, eyeS: scream ? 1.2 : 1, pupil: 3.6, sweat: t * 1.2, armL: { h: [-30, 150], bend: -10 }, armR: { h: [30, 150], bend: 10 },
    mouth: { ...talk('BENNY', t), o: talk('BENNY', t).o * (scream ? 1.7 : 1.1), sm: -.6 }, brow: scream ? 1.4 : 1.1 }));
  // foreground: the shelf and the two sandwiches, lit by the fridge
  fillOnly(rect(-200, 1380, 1500, 600), Wd.COL.inside, { boil: .3 });
  stroke([[-200, 1384], [1300, 1384]], 8);
  shape(ell(540, 1360, 470, 40, 40), { fill: '#ffffff', lw: 7 });
  sandwich(270, 1290, 2.0, 'ham'); sandwich(810, 1290, 2.0, 'turkey');
  for (const [x, lab] of [[270, 'HAM'], [810, 'TURKEY']]) { stroke([[x, 1176], [x + 14, 1040]], 7, { line: '#e9d3a3' }); const w = lab.length * 30 + 40; shape([[x + 14, 1036], [x + 14 + w, 1056], [x + 12, 1104]], { fill: '#fff', lw: 6 }); text(lab, x + 26 + w * .4, 1066, { font: '800 40px "Baloo 2"', fill: INK }); }
  reset(); Wd.fridgeFrame(W, H);
  if (t < T.whip[1]) speedLines(t, -1, .7 * (1 - u), 22);
};
SH.two = (t, tq) => {
  cam(lerp(560, 590, ss(seg(t, 2.5, 5.25))), 1180, lerp(.98, 1.04, ss(seg(t, 2.5, 5.25))));
  Wd.kitchen(t, { open: 1 });
  const turn = tq > 4.9;
  benny(B(t, { x: 420, face: turn ? 1 : -1, look: turn ? [.6, -.2] : [-.7, .2], nerv: .7, sweat: t, lid: 0 }));
  oona(O(t, { x: 880, look: [-.5, .2] }));
};
SH.bCU = (t, tq) => {
  cam(470, 1110, 1.9);
  Wd.kitchen(t, { open: 1 });
  benny(B(t, { x: 420, face: 1, look: [.8, -.3], nerv: 1.1, eyeS: 1.12, pupil: 3.4, brow: 1.3, sweat: t * 1.3, armL: { h: [40, -40], bend: -30 }, armR: { h: [-30, -50], bend: 30 } }));
};
SH.remote = (t, tq) => {
  // insert: the mitt lifts the colander-remote (dip, then rise), the thumb presses the button
  const dip = Math.sin(seg(tq, 7.05, 7.25) * Math.PI), up = ss(seg(tq, 7.2, 7.6));
  const press = tq >= T.press && tq < T.press + .25 ? 1 : 0;
  const P = O(t, { x: 880, look: [-.4, .4], holdR: 'remote', press, armR: { h: [lerp(-30, 40, up), lerp(250 + dip * 14, 40, up)], bend: lerp(40, 60, up), ra: lerp(.1, -.1, up) }, armL: OCROSS.L });
  const hx = 880 - (76 + P.armR.h[0]) * .85, hy = 1600 + (-700 + P.armR.h[1]) * .85;
  cam(lerp(hx + 40, hx + 30, up), lerp(hy + 60, hy - 40, up), 2.3);
  Wd.kitchen(t, { open: 1 });
  oona(P);
};
SH.open = (t, tq) => {
  const sh = t > T.burst && t < T.burst + .45 ? 18 * (1 - seg(t, T.burst, T.burst + .45)) : 0;
  cam(540, 1120, lerp(.82, .76, seg(t, 9, 10)), 0, sh, t);
  const po = popOpen(t - T.burst);
  Wd.kitchen(t, { open: 1, portalOpen: po, wash: clamp(po), plate: false });
  const hop = seg(tq, T.hop[0], T.hop[1]);
  benny(B(t, { x: 420 + eo(hop) * 170, y: 1560 - Math.sin(hop * Math.PI) * 120, face: -1, nerv: 1.3, look: [-.8, 0], eyeS: 1.2, pupil: 3, sweat: t * 1.4, ...(hop > 0 && hop < 1 ? { armL: BUP.L, armR: BUP.R } : { armL: BWRING.L, armR: BWRING.R }) }));
  // Oona walks into the fridge without a word
  const wk = tq > T.oonaIn[0] && tq < T.oonaIn[1];
  let op = O(t, { x: walk(tq, T.oonaIn[0], T.oonaIn[1] - .15, 880, 380), holdR: 'remote', armR: { h: [40, 160], bend: 40 }, look: [-.6, 0] });
  [op.legL, op.legR] = legsWalk(tq, wk, 20);
  op = sucked(op, t, T.oonaIn[1] - .2, T.oonaIn[1], 290, 960);
  if (tq < T.oonaIn[1]) oona(op);
};
SH.gulp = (t, tq) => {
  const yk = seg(t, T.yank, T.yank + .25), gl = seg(tq, T.gulp - .05, T.gulp + .25);
  cam(620, 1110, 1.85);
  Wd.kitchen(t, { open: 1, portalOpen: 1, wash: 1, plate: false });
  // the pillow is grabbed first, Benny follows
  benny(B(t, { x: 590 - ei(yk) * 900, face: 1, lean: -yk * .5, nerv: 1.5, look: [-.9, 0], eyeS: 1.25, pupil: 2.6, sweat: t * 1.5, yank: yk > 0 ? 1 : 0,
    mouth: { o: yk > 0 ? .7 : 0, w: gl > 0 && gl < 1 ? .45 : .8, sm: -.8 }, sq: 1 - Math.sin(gl * Math.PI) * .04, ...(yk > 0 ? { armL: BUP.L, armR: BUP.R } : {}) }));
};
SH.rush = (t) => {
  const u = ei(seg(t, 10.75, 11.0));
  cam(290, 960, lerp(.9, 6, u));
  Wd.kitchen(t, { open: 1, portalOpen: 1, wash: 1, plate: false });
};
// —— deli-verse 1 ——
SH.d1Wide = (t, tq) => {
  const tilt = ss(seg(t, 12.0, 13.45));
  cam(540, lerp(1330, 990, tilt), .95);
  Wd.deli1(t);
  const po = t < T.d1Close ? popOpen(t - 11.0) : 1 - ei(seg(t, T.d1Close, T.d1Close + .3));
  Wd.portal(240, 700, 150, 200, t, { open: po });
  const b = spit(B(t, { x: 380, y: 1680, face: 1, look: tq > 11.8 ? [.2, -.9] : [.6, -.2], nerv: 1, eyeS: 1.1, sweat: t, ...(tq > 11.85 ? { armL: { h: [-90, -60], bend: -20 }, armR: { h: [90, -70], bend: 20 } } : {}) }), tq, T.d1SpitB, T.d1LandB, [240, 700], 90);
  const o = spit(O(t, { x: 760, y: 1700, face: -1, holdR: 'remote', armR: { h: [30, 170], bend: 40 }, look: [-.5, .1] }), tq, T.d1SpitO, T.d1LandO, [240, 700], 140);
  if (o) oona(o); if (b) benny(b);
};
SH.oCU = (t, tq) => {
  cam(770, 1010, 1.75);
  Wd.deli1(t);
  oona(O(t, { x: 760, y: 1700, face: -1, holdR: 'remote', armR: { h: [30, 170], bend: 40 }, look: [-.7, .2], lid: .58 }));
};
SH.d1Panic = (t, tq) => {
  cam(420, 1200, 1.25);
  Wd.deli1(t);
  const po = t < T.d1Open ? 0 : popOpen(t - T.d1Open);
  Wd.portal(360, 980, 230, 300, t, { open: po });
  const pt = ss(seg(tq, 15.4, 15.7));
  benny(B(t, { x: 400, y: 1680, face: 1, look: pt > .5 ? [.6, -.8] : [.7, -.2], nerv: 1.2, eyeS: 1.1, sweat: t * 1.3, brow: 1.3,
    armR: { h: [lerp(-56, 110, pt), lerp(100, -170, pt)], bend: 20 }, armL: BWRING.L }));
  // the mitt with the remote leans into frame and presses
  const inn = ss(seg(tq, 16.25, 16.5)), press = tq >= T.d1Press && tq < T.d1Press + .2 ? 1 : 0;
  if (inn > 0) { reset(); cam(420, 1200, 1.25); push(); translate(lerp(1020, 760, inn), 1160); remote(0, -40, -.2, 1, { press }); pop(); }
};
// —— deli-verse 2 ——
SH.aisle = (t, tq) => {
  const p = seg(t, 17.0, 19.0);
  cam(540, lerp(1060, 980, p), lerp(.82, 1.0, p));
  Wd.deli2(t);
  const po = t < T.d2Close ? popOpen(t - 17.0) : 1 - ei(seg(t, T.d2Close, T.d2Close + .3));
  Wd.portal(540, 760, 150, 190, t, { open: po });
  const panic = tq > VO.b5;
  const b = spit(B(t, { x: 400, y: 1700, face: Math.floor(tq * 4) % 2 ? 1 : -1, look: [Math.floor(tq * 4) % 2 ? .8 : -.8, -.4], nerv: 1.4, eyeS: 1.2, pupil: 3, sweat: t * 1.6, brow: 1.4,
    mouth: { ...talk('BENNY', t), o: talk('BENNY', t).o * 1.5, sm: -.7 }, ...(panic ? { armL: BUP.L, armR: BUP.R } : {}) }), tq, T.d2SpitB, T.d2LandB, [540, 760], 120);
  const o = spit(O(t, { x: 720, y: 1720, face: -1, holdR: 'remote', armR: { h: [30, 170], bend: 40 }, look: [-.5, .1] }), tq, T.d2SpitO, T.d2LandO, [540, 760], 120);
  if (o) oona(o); if (b) benny(b);
};
SH.lick = (t, tq) => {
  cam(330, 1180, 1.4);
  Wd.deli2(t);
  const sl = eo(seg(tq, T.slideIn[0], T.slideIn[1])), lk = seg(tq, T.lick[0], T.lick[1]);
  const tw = tq >= T.twitch && Math.floor(tq * 12) % 2 === 0 && tq < T.twitch + .3;
  benny(B(t, { x: 420, y: 1700, face: -1, look: [-.6, 0], nerv: .2, eyeS: 1.15, pupil: 2.8, lid: tw ? .3 : 0, brow: .6, mouth: { o: 0, w: .6, sm: -.9 }, armL: BREST.L, armR: BREST.R, sq: 1 - .03 * Math.sin(lk * Math.PI) }));
  special(lerp(40, 170, sl), 1300, .95, t, { lick: lk > 0 && lk < 1 ? Math.sin(lk * Math.PI) : 0, look: [.8, .2] });
};
SH.oSpecial = (t, tq) => {
  cam(760, 1040, 1.7);
  Wd.deli2(t);
  const press = tq >= T.fallPress && tq < T.fallPress + .2 ? 1 : 0, lift = ss(seg(tq, 21.1, 21.4));
  oona(O(t, { x: 740, y: 1720, face: -1, holdR: 'remote', press, armR: { h: [lerp(30, 50, lift), lerp(170, 60, lift)], bend: 40 }, look: [-.8, .3], lid: .56 }));
};
// —— the fall: one continuous track down through the worlds (signature shot) ——
const FY = Wd.FALL.BAND, GASY = 3 * FY - 200;          // gas-station world sits under the third slab
const fallB = monotone([[21.75, 0], [21.95, 12], [22.95, FY], [23.5, 2 * FY], [23.9, 3 * FY], [24.3, GASY + 1560]]);
SH.fall = (t, tq) => {
  const yb = fallB(Math.min(t, T.landB)), landed = t >= T.landB;
  // camera: leads the fall from above, then settles into the gas-station two-shot and pushes in slowly
  const settle = ss(seg(t, T.landB, T.landB + .6));
  const fz = lerp(.7, .62, seg(t, 21.75, 24.0));
  const cy = lerp(yb - 120, GASY + 1130, settle), cz = lerp(fz, .9, settle) + ss(seg(t, 24.9, 26.75)) * .08;
  cam(540, cy, cz);
  Wd.fallShaft(t, cy);
  reset(); cam(540, cy, cz); translate(0, GASY);
  Wd.gasStation(t, { ceilPortal: t < T.ceilClose ? 1 : 1 - ei(seg(t, T.ceilClose, T.ceilClose + .3)), buzz: 1, top: 170 });
  translate(0, -GASY);
  // the deli-verse 2 floor portal opening under their feet
  if (t < 22.2) Wd.portal(540, 0, 400 * popOpen(t - 21.75), 92 * popOpen(t - 21.75), t, { wash: false });
  // Oona: upright, calm, slightly behind
  const yo = landed ? Math.min(fallB(Math.max(21.75, t - .12)), GASY + 1600) : fallB(Math.max(21.75, t - .12));
  const oLand = t >= T.landO;
  let op = O(t, { x: 690, y: oLand ? GASY + 1600 : yo + 40, face: -1, holdR: 'remote', armR: { h: [30, 170], bend: 40 }, look: [.2, .7], lid: .6 });
  if (oLand) op.sq = landSq(t, T.landO); else op.headTilt = .06 + Math.sin(t * 3) * .04;
  // Benny: flailing, screaming each floor, then a flat landing and a slow get-up
  let bp;
  if (!landed) {
    const fl = Math.sin(tq * 26);
    bp = B(t, { x: 400 + Math.sin(t * 5) * 30, y: yb, face: Math.floor(tq * 6) % 2 ? 1 : -1, nerv: 1.6, eyeS: 1.25, pupil: 2.6, brow: 1.5, look: [0, .9], lean: Math.sin(t * 7) * .25,
      mouth: { ...talk('BENNY', t), o: Math.max(.35, talk('BENNY', t).o * 1.8), sm: -.8 },
      armL: { h: [-90 + fl * 20, -150], bend: -30 }, armR: { h: [90 - fl * 20, -150], bend: 30 }, legL: [-20 + fl * 18, -30], legR: [20 - fl * 18, -20] });
  } else {
    const up = ss(seg(tq, 25.2, 25.8)), see = tq > 26.2;
    bp = B(t, { x: 420, y: GASY + 1560 - (1 - up) * 0, face: 1, sq: landSq(t, T.landB) * lerp(.72, 1, up), nerv: .2, eyeS: see ? 1.25 : 1, look: see ? [.9, .1] : [0, .3], brow: see ? -.2 : .8, lid: see ? 0 : .35,
      mouth: { o: see ? .25 : 0, w: .6, sm: see ? .2 : -.4 }, armL: BREST.L, armR: BREST.R, legL: [-(1 - up) * 50, -(1 - up) * 40], legR: [(1 - up) * 50, -(1 - up) * 40] });
  }
  oona(op); benny(bp);
  if (!landed && t > 21.95) speedLines(t, 1, .45, 18);
};
// —— gas station ——
const GB = { x: 470, y: 1560 }, GO = { x: 190, y: 1600 };
SH.insert = (t, tq) => {
  cam(830, 905, 2.5);
  Wd.gasStation(t, { sandwichGone: true });
  const h = ss(seg(tq, T.hand[0], T.hand[1])), lift = ss(seg(tq, 28.1, 28.5));
  sandwich(830 - h * 6, 930 - lift * 40, .62, 'egg', { wrap: true, a: -h * .05 });
  if (h > 0) { const hx = lerp(560, 770, h), hy = lerp(1080, 950, h) - lift * 40;
    push(); translate(hx, hy); rotate(-.5); shape(spline([[-170, -26], [-20, -30], [10, -14], [12, 16], [-20, 30], [-170, 28]]), { fill: PAL.card, lw: 7 }); stroke([[-150, -24], [-150, 26]], 5); pop();
    push(); translate(hx + 14, hy - 8); rotate(-.5); shape(spline([[-24, -24], [16, -30], [36, -8], [32, 16], [8, 28], [-24, 20]]), { fill: PAL.skinB, lw: 6 }); pop(); }
};
SH.oSalad = (t, tq) => {
  cam(250, 1000, 1.5);
  Wd.gasStation(t, { sandwichGone: true });
  benny(B(t, { ...GB, x: 520, face: -1, holdR: 'sandwich', armR: { h: [-30, 40], bend: 30 }, look: [-.4, -.4], nerv: 0, eyeS: 1.1, brow: -.3, mouth: { o: 0, sm: .6 } }));
  oona(O(t, { ...GO, face: 1, look: [.7, .4], lid: .6, armL: OCROSS.L, armR: OCROSS.R }));
};
SH.bite = (t, tq) => {
  cam(500, 1130, 1.6);
  Wd.gasStation(t, { sandwichGone: true });
  const raise = ss(seg(tq, 31.3, 31.45)), chewing = tq >= T.chew[0];
  const m = talk('BENNY', t);
  benny(B(t, { ...GB, face: 1, holdR: 'sandwich', unwrapped: tq > T.unwrap, bite: tq > T.bite ? .9 : 0,
    armR: { h: [lerp(-20, -60, raise), lerp(40, -90, raise) + (chewing ? 70 : 0)], bend: 30 }, nerv: 0, happy: chewing, brow: -.7,
    chew: chewing && !m.talking ? tq * 2 : 0, mouth: { o: m.o * .6, w: .7, sm: .9 } }));
};
SH.explain = (t, tq) => {
  const p = ss(seg(t, 34.6, 37.6));
  cam(lerp(240, 360, p), lerp(1030, 1110, p), lerp(1.2, .95, p));
  Wd.gasStation(t, { sandwichGone: true });
  benny(B(t, { ...GB, face: 1, holdR: 'sandwich', unwrapped: true, bite: .9, armR: { h: [-30, 40], bend: 30 }, nerv: 0, happy: true, brow: -.7, chew: tq * 2 }));
  const gest = ss(seg(tq, 34.4, 34.8)) * (1 - ss(seg(tq, 36.6, 37.0)));
  oona(O(t, { ...GO, face: 1, look: [.5, .1], armR: gest > 0 ? { h: [lerp(-84, 70, gest), lerp(210, 120, gest)], bend: 40 } : OCROSS.R, armL: OCROSS.L }));
};
SH.offer = (t, tq) => {
  cam(380, 1120, .9);
  Wd.gasStation(t, { sandwichGone: true });
  Wd.portal(150, 1180, 170, 270, t, { open: popOpen(t - T.reopen) });
  benny(B(t, { ...GB, face: -1, holdR: 'sandwich', unwrapped: true, bite: .9, armR: { h: [-30, 40], bend: 30 }, nerv: 0, happy: true, brow: -.7, chew: tq * 2 }));
  const th = ss(seg(tq, 38.7, 38.95)) * (1 - ss(seg(tq, 39.8, 40.1)));
  oona(O(t, { ...GO, x: 260, face: 1, holdR: 'remote', armR: { h: [30, 170], bend: 40 }, armL: th > 0 ? { h: [lerp(92, -40, th), lerp(196, 140, th)], bend: -30 } : OCROSS.L, look: [.6, .1] }));
};
SH.refuse = (t, tq) => {
  cam(500, 1120, 1.7);
  Wd.gasStation(t, { sandwichGone: true });
  const sk = seg(tq, T.shake[0], T.shake[1]);
  benny(B(t, { ...GB, face: -1, holdR: 'sandwich', unwrapped: true, bite: .9, armR: { h: [-30, 40], bend: 30 }, nerv: 0, happy: true, brow: -.8,
    headTilt: sk > 0 && sk < 1 ? Math.sin(sk * TAU * 2) * .16 : 0, chew: talk('BENNY', t).talking ? 0 : tq * 2, mouth: { o: talk('BENNY', t).o * .7, w: .8, sm: 1 } }));
};
SH.leave = (t, tq) => {
  const p = ss(seg(t, 43.4, 46.0));
  cam(lerp(380, 540, p), lerp(1120, 820, p), lerp(.9, .56, p));
  Wd.gasStation(t, { sandwichGone: true });
  const po = t < T.close ? 1 : 1 - ei(seg(t, T.close, T.close + .25));
  Wd.portal(150, 1180, 170, 270, t + 1, { open: po });
  const sh = seg(tq, T.shrug[0], T.shrug[1]), shr = Math.sin(sh * Math.PI);
  let op = O(t, { ...GO, x: 260, face: -1, shrug: shr * 1.6, look: [.3, -.2 * shr], lid: .54 + shr * .2, headTilt: .06 - shr * .18, holdR: 'remote', armR: { h: [30, 170], bend: 40 },
    armL: shr > 0 ? { h: [lerp(92, -150, shr), lerp(196, 60, shr)], bend: -40 } : OCROSS.L });
  if (tq > T.oonaWalk[0]) { op.x = walk(tq, T.oonaWalk[0], T.oonaWalk[1], 260, 170); [op.legL, op.legR] = legsWalk(tq, tq < T.oonaWalk[1], 18); op = sucked(op, t, T.oonaWalk[1] - .2, T.oonaWalk[1] + .05, 150, 1180); }
  if (tq < T.oonaWalk[1] + .05) oona(op);
  benny(B(t, { ...GB, face: -1, holdR: 'sandwich', unwrapped: true, bite: .9, armR: { h: [-30, 40], bend: 30 }, nerv: 0, happy: true, brow: -.8, chew: tq * 2, headTilt: Math.sin(tq * 2.2) * .05 }));
};
SH.title = (t, tq) => {
  cam(540, 820, .56);
  Wd.gasStation(t, { sandwichGone: true });
  benny(B(t, { ...GB, face: -1, holdR: 'sandwich', unwrapped: true, bite: .9, armR: { h: [-30, 40], bend: 30 }, nerv: 0, happy: true, brow: -.8, chew: tq * 2, headTilt: Math.sin(tq * 2.2) * .05 }));
  reset(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(36,20,44,.35)'; g.fillRect(0, 0, W, H);
  const u = q(t) - T.title, s = back(seg(u, 0, .25), 1.6);
  const letters = u < .25 ? 7 : u < .5 ? 9 : u < .9 ? 15 : 99;
  reset(); translate(540, 700); scale(s * .86); Wd.titleBoard(t, s, letters);
};

// ———————————————— screen layers ————————————————
function wipe(t) {
  for (const [tc, hw] of WIPES) {
    const d = Math.abs(t - tc); if (d > hw) continue;
    const u = 1 - d / hw, R = 1500 * Math.pow(u, .6);
    reset(); Wd.portal(540, 960, R * .8, R, t, { open: 1, spin: 2.2 });
  }
}
const tagText = r => `${r[2]} · ${r[3]}`;
function tag(t) {
  for (const [a, b, id, desc, bg, fg] of TAGS) {
    if (t < a || t >= b) continue;
    const u = t - a, n = Math.floor(u * 40), s1 = id.slice(0, n), s2 = desc.slice(0, Math.max(0, n - id.length));
    const pop_ = back(seg(t, a, a + .18), 2.2), out = 1 - seg(t, b - .12, b);
    reset(); push(); translate(48, 150); scale(pop_ * out || .001);
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '400 60px VT323'; const w1 = Math.max(g.measureText('▶ ' + id).width, g.measureText(desc).width * .8) + 56;
    shape(rr(0, 0, Math.max(330, w1), 124, 12), { fill: bg, lw: 7 });
    text('▶ ' + s1 + (n < id.length && Math.floor(t * 6) % 2 ? '█' : ''), 24, 40, { font: '400 60px VT323', fill: fg, align: 'left' });
    text(s2, 26, 92, { font: '400 46px VT323', fill: fg, align: 'left' });
    pop();
  }
}
// captions: heavy rounded white type, thick ink outline, a boiling speaker pill
const WHO_COL = { BENNY: '#d99a1c', OONA: '#2f7a4f' };
const CUTS = [11.0, 17.0, 21.75, 24.45, 42.45, 46.0];
const SUBS = Object.entries(VO).map(([id, t0]) => {
  const L = LINE[id], text_ = L.sub || L.text, d = vdur(id);
  let t1 = t0 + Math.max(d + .35, .9 + text_.length / 17);
  const nxt = Object.values(VO).filter(v => v > t0 + .05).sort((a, b) => a - b)[0];
  const cut = CUTS.find(c => c > t0 + .1); if (cut && t1 > cut) t1 = Math.max(cut - .02, t0 + d + .2);
  return { id, t0, t1, who: L.who, text: text_ };
});
const FONT = '800 58px "Baloo 2"';
function wrapSub(str, max) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = FONT;
  if (g.measureText(str).width < max) return [str];
  const mid = str.length / 2; let best = -1;
  for (let i = 0; i < str.length; i++) if (str[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return [str.slice(0, best), str.slice(best + 1)];
}
function subs(t) {
  const act = SUBS.filter(s => t >= s.t0 && t < s.t1).slice(-2);
  let y = 1600;
  for (let i = act.length - 1; i >= 0; i--) {
    const s = act[i], a = i === act.length - 1 ? 1 : .7;
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '800 28px "Baloo 2"'; const nw = g.measureText(s.who).width + 34;
    const lines = wrapSub(s.text, 900 - nw);
    g.font = FONT; const tw = Math.max(...lines.map(l => g.measureText(l).width));
    const pop_ = back(seg(t, s.t0, s.t0 + .12), 2);
    const total = nw + 20 + tw, x0 = (W - total) / 2, y0 = y - (lines.length - 1) * 70;
    reset(); g.globalAlpha = a;
    push(); translate(x0 + nw / 2, y0 - 4); scale(pop_); translate(-nw / 2, 0);
    shape(rr(0, -23, nw, 46, 15), { fill: WHO_COL[s.who], lw: 5 });
    text(s.who, nw / 2, 2, { font: '800 28px "Baloo 2"', fill: '#fff' });
    pop();
    lines.forEach((l, k) => text(l, x0 + nw + 20, y0 + k * 70, { font: FONT, fill: '#fff', align: 'left', outlineW: 11 }));
    g.globalAlpha = 1;
    y = y0 - 92;
  }
}
// every on-screen text (tags and title) for readcheck
window.TEXTS = t => {
  const out = [];
  for (const r of TAGS) if (t >= r[0] + .2 && t < r[1] - .12) out.push({ id: 'tag' + r[0], text: tagText(r), x0: 48, y0: 150, x1: 700, y1: 274 });
  if (t >= T.title + .5) out.push({ id: 'title', text: 'PARADOX OF CHOICE', x0: 200, y0: 380, x1: 880, y1: 800 });
  if (t >= T.title + .9) out.push({ id: 'tagline', text: 'MORE OPTIONS. LESS HAPPY.', x0: 240, y0: 900, x1: 840, y1: 950 });
  return out;
};

function render(t) {
  frame(t);
  screenRect('#000');
  const [, , name] = shotAt(t);
  SH[name](t, q(t));
  wipe(t);
  tag(t);
  subs(t);
}

// —— sound events (for mix.py / score.py) ——
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  for (const [id, t0] of Object.entries(VO)) add('vo', t0, { id });
  for (const c of CUES) add('cue', c.t0, c);
  let cur = null;
  for (const [a, b, , w] of SHOTS) { if (cur && cur.w === w && Math.abs(cur.b - a) < .01) cur.b = b; else { if (cur) add('amb', cur.a, { w: cur.w, d: +(cur.b - cur.a).toFixed(3) }); cur = { a, b, w }; } }
  add('amb', cur.a, { w: cur.w, d: +(cur.b - cur.a).toFixed(3) });
  // home
  add('impact', 0.0); add('whip', 0.0); add('fridgeHum', 0.0, { d: 9.0 });
  add('tic', 1.0, { v: .6 }); add('cloth', 7.15); add('click', T.press);
  add('portalOpen', T.burst); add('portalHum', T.burst + .1, { d: 11.0 - T.burst }); add('boing', T.hop[0], { v: .6 });
  [9.5, 9.66, 9.82].forEach(x => add('step', x, { v: .7 })); add('suck', T.oonaIn[1] - .2);
  add('gulp', T.gulp); add('stretch', T.yank); add('suck', T.yank + .05); add('whooshBig', 10.72);
  for (const [tc] of WIPES) add('portalWhoosh', tc - .16);
  // deli-verse 1
  add('portalOpen', 11.02, { v: .6 }); add('pop', T.d1SpitB); add('pop', T.d1SpitO); add('boing', T.d1LandB, { v: 1.1 }); add('thud', T.d1LandO, { v: .7 }); add('portalClose', T.d1Close + .25);
  add('click', T.d1Press); add('portalOpen', T.d1Open, { v: .7 });
  // deli-verse 2
  add('portalOpen', 17.02, { v: .6 }); add('pop', T.d2SpitB); add('pop', T.d2SpitO); add('boing', T.d2LandB); add('thud', T.d2LandO, { v: .7 }); add('portalClose', T.d2Close + .25);
  add('slide', T.slideIn[0]); add('glorp', T.lick[0]); add('lick', T.lick[0] + .08); add('squeak', T.twitch, { v: .6 });
  add('click', T.fallPress);
  // the fall
  add('portalOpen', 21.75, { v: .8 }); add('wind', 21.9, { d: T.landB - 21.9 });
  T.floors.forEach((x, i) => add('fwump', x, { v: .7 + i * .1 }));
  add('thud', T.landB, { v: 1.3 }); add('thud', T.landO, { v: .6 }); add('portalClose', T.ceilClose + .2, { v: .6 });
  // gas station
  add('crinkle', T.crinkle); add('crinkle', T.unwrap, { v: .8 }); add('chomp', T.bite);
  for (let x = T.chew[0] + .3; x < 46; x += .62) add('chew', x, { v: x < 33.5 ? .7 : .35 });
  add('portalOpen', T.reopen, { v: .55 }); add('portalHum', T.reopen + .1, { d: T.close - T.reopen, v: .7 });
  add('cloth', T.shrug[0], { v: .8 }); [43.05, 43.25, 43.45].forEach(x => add('step', x, { v: .6 })); add('suck', T.oonaWalk[1] - .2); add('portalClose', T.close + .1, { v: .9 });
  add('slam', T.title, { v: .6 });
  return ev.sort((a, b) => a.t - b.t);
}

window.render = render; window.DUR = DUR; window.EV = events(); window.SUBS = SUBS;
for (const f of [FONT, '800 28px "Baloo 2"', '400 60px "Lilita One"', '400 40px VT323']) await document.fonts.load(f);
render(parseFloat(new URLSearchParams(location.search).get('t') ?? '3'));
window.READY = true;

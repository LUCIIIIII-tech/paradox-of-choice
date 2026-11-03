// Gising Ka Habang Inooperahan (1080x1920, 2D feature-animation look on a 2.5D rig). You wake on the operating table, eyes taped,
// unable to move, and hear what the people above you are really doing. renderAt(t) builds the frame from t alone: the shot from
// timeline.json, the set painted in depth layers (with depth of field), the characters on their rigs at the angle the shot wants,
// the camera on a slow move, then bloom, grain, vignette, a soft dip at each cut, the title and captions. No flashes.
import { clamp, lerp, seg, ss, eio, hash, TAU } from './lib.js';
import { initG, g as G0, camera, useCam, camZoom, head, bust, person, hand, smooth, blob, glowAt, rgba, taper, bez, W, H } from './rig.js';
import * as RIG from './rig.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d'); initG(ctx); const g = () => RIG.g;
const TL = await (await fetch('timeline.json')).json(), LN = Object.fromEntries(TL.lines.map(l => [l.id, l])), DUR = TL.dur; window.DUR = DUR;
const T0 = id => LN[id] ? LN[id].t0 : 0, T1 = id => LN[id] ? LN[id].t1 : 0;
const wordT = (id, w) => { const l = LN[id]; const x = l && l.words && l.words.find(v => v[0].toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(w.toLowerCase())); return x ? x[1] : (l ? l.t0 : 0); };
const SHOTS = []; TL.lines.forEach((l, i) => { const prev = TL.lines[i - 1]; if (!prev || prev.shot !== l.shot) { const a = prev ? prev.t1 + (l.t0 - prev.t1) * .5 : 0; if (SHOTS.length) SHOTS[SHOTS.length - 1].b = a; SHOTS.push({ name: l.shot, a, b: DUR }); } });
const SH = Object.fromEntries(SHOTS.map(s => [s.name, s])); window.SHOTS = SHOTS;

// ---------- the cast ----------
const base = { seed: 1, female: 0, headW: .86, jaw: .66, chin: 1.12, chinOut: .18, cheek: .05, eyeX: .36, eyeTh: 1.6, eyeW: .2, brow: .5, mouthW: .17, mouthTh: 2.2, nose: .16,
  lineC: '#4a2a22', lineRGB: '74,42,34', hairD: 1.03, hairVol: .12, hairline: .98, hairHi: '200,180,170', iris: '#5a3418', irisHi: '#c08850' };
const YOU = { ...base, seed: 3, skin: ['#f2c29b', '#dca27b', '#b47a58'], shadeRGB: '150,80,70', coreRGB: '90,40,40', bloodRGB: '220,100,90', hair: ['#0f0a0a', '#24191a', '#4a3632'], hairStyle: 'short',
  locks: [[-.8, .25, .25], [-.65, .32, .3], [-.5, .38, .28], [-.36, .42, .32], [-.22, .4, .3], [-.08, .44, .34], [.06, .38, .3], [.2, .36, .28], [.34, .32, .26], [.48, .28, .22], [.62, .22, .2]], beard: .3, wear: ['#e9eef0', '#c2ccd2', '#8a979f'], wearShade: '60,80,100', neckline: 'v', lips: '190,110,100' };
const NANAY = { ...base, seed: 5, female: 1, headW: .84, jaw: .64, chin: 1.08, cheek: .09, eyeW: .175, brow: .38, mouthW: .18, nose: .14, age: .7,
  skin: ['#f4cfae', '#e0aa86', '#b9805e'], shadeRGB: '160,90,80', coreRGB: '100,45,50', bloodRGB: '230,110,105', hair: ['#3a3434', '#7a7270', '#b8b0aa'], hairHi: '235,228,220', hairStyle: 'bun', hairline: .92, hairVol: .04,
  locks: [[.55, .25, .2]], iris: '#4a2a14', wear: ['#e08a6e', '#c06850', '#8a4636'], wearShade: '110,40,40', neckline: 'round', print: '250,225,190', lips: '200,105,110' };
const DOC = { ...base, seed: 7, headW: .9, jaw: .82, chin: 1.08, chinOut: .2, eyeW: .155, brow: .62, iris: '#2a1810', irisHi: '#7a5434', skin: ['#d9a07a', '#be8460', '#93603f'], shadeRGB: '120,60,50', coreRGB: '70,30,30', bloodRGB: '200,90,80',
  hair: ['#0c0808', '#1c1414', '#3a2c2a'], cap: ['#7fb0c8', '#5a8ea8', '#2e5a72'], capDots: '40,80,110', mask: 1, wear: ['#7fb3c8', '#5a90a8', '#2f5c70'], wearShade: '20,50,70', neckline: 'v' };
const NURSE = { ...base, seed: 9, female: 1, headW: .82, jaw: .6, chin: 1.06, cheek: .08, eyeW: .185, brow: .36, iris: '#5a3418', irisHi: '#d0a060', skin: ['#f8d6bc', '#e9b394', '#c48a6c'], shadeRGB: '170,95,90', coreRGB: '110,50,55', bloodRGB: '240,120,120',
  hair: ['#1a0e0c', '#3a2420', '#6a4a40'], cap: ['#f2b8cc', '#d890aa', '#9a5470'], capDots: '255,255,255', mask: 1, wear: ['#8cc4b4', '#62a08e', '#336656'], wearShade: '20,60,50', neckline: 'v' };
const BUYER = { ...base, seed: 11, headW: .92, jaw: .86, chin: 1.04, chinOut: .22, eyeW: .145, brow: .7, iris: '#1e120a', irisHi: '#6a4a2a', skin: ['#d6a07c', '#b98260', '#8a5a40'], shadeRGB: '110,55,50', coreRGB: '60,25,25', bloodRGB: '190,90,80',
  hair: ['#1a1818', '#4a4646', '#8a8684'], hairHi: '220,220,225', hairStyle: 'short', hairline: 1.1, hairVol: .06, locks: [[-.3, .12, -.3], [.2, .1, .3]], beard: .7, age: .5, wear: ['#3a3a42', '#24242a', '#101014'], wearShade: '0,0,0', neckline: 'collar', chain: 1, lips: '160,90,80' };

// ---------- the room: painted in depth layers; far layers blur (depth of field) ----------
const LAYC = document.createElement('canvas'); LAYC.width = W; LAYC.height = H;
function plate(blurPx, fn) {           // draw fn on its own plate, blurred, then onto the frame
  if (blurPx < .6) { fn(); return; }
  const c = LAYC.getContext('2d'), old = RIG.g; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); RIG.initG(c); fn(); RIG.initG(old);
  old.save(); old.setTransform(1, 0, 0, 1, 0, 0); old.filter = `blur(${blurPx.toFixed(1)}px)`; old.drawImage(LAYC, 0, 0); old.restore();
}
function orWall(o = {}) {           // the OR seen across: glazed tiles in a warm-cold light, a steel cabinet, the door's round window, the monitor glow
  const c = g(); c.setTransform(1, 0, 0, 1, 0, 0);
  let gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2c4a4c'); gr.addColorStop(.5, '#1f3638'); gr.addColorStop(1, '#0e1a1c'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
  const ox = o.ox || 0, oy = o.oy || 0, s = o.s || 1;
  c.save(); c.translate(W / 2 + ox, H * .45 + oy); c.scale(s, s);
  for (let r = -12; r < 12; r++) for (let k = -8; k < 8; k++) { const x = k * 130, y = r * 130, v = hash(r * 13 + k * 7);
    c.fillStyle = `hsl(${168 + 10 * v},${18 + 8 * v}%,${24 + 6 * hash(r + k * 3)}%)`; c.fillRect(x + 3, y + 3, 124, 124);
    const tg = c.createLinearGradient(x, y, x + 130, y + 130); tg.addColorStop(0, 'rgba(255,255,255,.12)'); tg.addColorStop(1, 'rgba(0,0,0,.08)'); c.fillStyle = tg; c.fillRect(x + 3, y + 3, 124, 124); }
  if (o.door !== false) { c.fillStyle = '#4a5a5e'; c.fillRect(-160, -380, 320, 780); c.strokeStyle = '#1a2224'; c.lineWidth = 6; c.strokeRect(-160, -380, 320, 780); c.fillStyle = '#cfe6f0'; c.beginPath(); c.arc(0, -180, 60, 0, TAU); c.fill(); c.strokeStyle = '#8a9a9e'; c.lineWidth = 10; c.stroke(); }
  c.restore();
  glowAt(W / 2 + ox * .8, H * .45 - 180 * s + oy, 300, '190,225,255', .35);
  if (o.monitor) glowAt(o.monitor[0], o.monitor[1], 420, '90,255,170', .25);
}
function lampDisc(x, y, r, a = 1, tilt = 0) {     // the surgical light seen from below: housing, a ring of glowing lens cells
  const c = g(); c.save(); c.translate(x, y); c.scale(1, 1 - tilt);
  c.fillStyle = '#d8dee2'; c.beginPath(); c.arc(0, 0, r * 1.12, 0, TAU); c.fill(); c.strokeStyle = '#5a6268'; c.lineWidth = r * .03; c.stroke();
  c.fillStyle = '#2a3034'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  const cells = [[0, 0]]; for (let k = 0; k < 6; k++) cells.push([Math.cos(k / 6 * TAU) * r * .45, Math.sin(k / 6 * TAU) * r * .45]); for (let k = 0; k < 12; k++) cells.push([Math.cos((k + .5) / 12 * TAU) * r * .8, Math.sin((k + .5) / 12 * TAU) * r * .8]);
  for (const [cx_, cy_] of cells) { const cr = r * .17, gr = c.createRadialGradient(cx_, cy_, 0, cx_, cy_, cr); gr.addColorStop(0, `rgba(255,252,240,${a})`); gr.addColorStop(.7, `rgba(235,242,248,${a * .9})`); gr.addColorStop(1, 'rgba(120,130,140,1)'); c.fillStyle = gr; c.beginPath(); c.arc(cx_, cy_, cr, 0, TAU); c.fill(); }
  c.restore(); glowAt(x, y, r * 3.2, '255,250,236', .55 * a);
}
function sheet(c, x0, y0, x1, y1) { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#eef2f0'); gr.addColorStop(1, '#a9b4b2'); c.fillStyle = gr; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let k = 0; k < 8; k++) { c.strokeStyle = 'rgba(80,100,110,.18)'; c.lineWidth = 16; c.filter = 'blur(6px)'; c.beginPath(); c.moveTo(x0 + (x1 - x0) * hash(k), y0); c.quadraticCurveTo(x0 + (x1 - x0) * hash(k * 3), (y0 + y1) / 2, x0 + (x1 - x0) * hash(k * 5), y1); c.stroke(); c.filter = 'none'; } }

// ---------- the shots ----------
const S = {};
const L_LAMP = [0, .9, .45], L_KEYL = [-.65, .45, .6], L_WIN = [.7, .35, .6], L_BACK = [.15, .5, -.4];
// HOOK: straight down on your face on the table; the camera turns slowly as it pushes in; at "lahat" a tear escapes the tape
S.hook = (t, u, s) => {
  const lah = wordT('h1', 'lahat'), k = ss(seg(u, 0, s.b - s.a));
  const c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#d7dcda'; c.fillRect(0, 0, W, H);
  camera(0, 0, lerp(1.0, 1.25, k), lerp(-.18, -.08, k), W / 2, H * .5);
  plate(0, () => { sheet(g(), -900, -1400, 900, 1400); });
  person(YOU, { x: 0, y: -60, R: 330, yaw: 0, pitch: 0, roll: 0, light: [0, .3, 1], rim: '255,250,236', rimA: .2, t, e: { taped: 1, sweat: ss(seg(u, 1.5, 4)) * .8, tear: ss(seg(t, lah - .4, lah + .8)), tearSide: -1, tearP: ss(seg(t, lah - .2, lah + 3)) }, bodyPitch: 0 });
  useCam(); g().strokeStyle = 'rgba(220,235,240,.85)'; g().lineWidth = 70; g().lineCap = 'round'; g().beginPath(); g().moveTo(30, 150); g().quadraticCurveTo(220, 420, 600, 560); g().stroke(); g().strokeStyle = 'rgba(255,255,255,.6)'; g().lineWidth = 16; g().stroke();
  g().setTransform(1, 0, 0, 1, 0, 0); glowAt(W * .5, H * .1, 900, '255,250,236', .35);
};
// PRE-OP: Nanay in three-quarter from a little below, window light on her face, the curtain soft behind; her hand on yours at the bottom
S.preop = (t, u, s) => {
  const sp = seg(t, T0('n0'), T1('n0')), k = ss(seg(u, 0, s.b - s.a));
  plate(14, () => { const c = g(); c.setTransform(1, 0, 0, 1, 0, 0); const gr = c.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#5a6a6a'); gr.addColorStop(1, '#c9c2ae'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (let k2 = 0; k2 < 9; k2++) { c.fillStyle = k2 % 2 ? 'rgba(200,225,220,.35)' : 'rgba(120,150,150,.3)'; c.fillRect(-80 + k2 * 140, 0, 90, H); } glowAt(W * .95, H * .2, 900, '255,236,200', .7); });
  camera(0, 0, lerp(1.0, 1.08, k), 0, W / 2, H * .46);
  person(NANAY, { x: -30, y: -60, R: 300, yaw: -.55, pitch: -.12, light: L_WIN, rim: '255,236,200', rimA: .7, t, bodyYaw: -.35,
    e: { worry: .65 - .25 * sp, smile: .2 + .45 * sp, sad: .25 * (1 - sp), open: .95, look: [.35, .15], mouth: sp > 0 && sp < 1 ? .3 * Math.abs(Math.sin(t * 8)) : 0, tear: .8, tearSide: 1, wet: .8 } });
  hand(NANAY, 120, 1330, 230, -.25, { curl: [.4, .45, .5, .5, .55] }); hand(YOU, 330, 1460, 200, Math.PI + .15, { curl: [.3, .2, .2, .3, .3], flip: 1, sleeve: '#d8e0e4' });
};
// LAMP: from the table, looking up into the light; the doctor and the nurse lean into frame from top and bottom, faces in shadow, rims burning
S.lamp = (t, u, s) => {
  const lean = ss(seg(u, .2, 2.8)), c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#c9cfcf'; c.fillRect(0, 0, W, H);
  plate(10, () => { lampDisc(W / 2, H * .47, 300, 1); });
  camera(0, 0, 1, Math.sin(t * .2) * .02, W / 2, H / 2);
  person(DOC, { x: -40 + 40 * lean, y: -760 + 160 * lean, R: 300, yaw: .05, pitch: -.35, roll: Math.PI + .25, light: [0, -.6, .3], rim: '255,250,236', rimA: 1, t, e: { look: [-.1, -.5], frown: .3, open: .85 } });
  person(NURSE, { x: 60 - 40 * lean, y: 780 - 160 * lean, R: 290, yaw: -.1, pitch: -.35, roll: .2, light: [0, .7, .3], rim: '255,250,236', rimA: 1, t, e: { look: [.1, -.6], worry: .5, open: 1 } });
};
// TEAR: your face in profile on the table; the tear runs from under the tape to the ear; the monitor's green on the far edge
S.tear = (t, u, s) => {
  const k = ss(seg(u, 0, s.b - s.a));
  plate(16, () => orWall({ s: .8, ox: 200, oy: -100, monitor: [W * .85, H * .25] }));
  camera(0, 0, lerp(1.12, 1.25, k), 0, W / 2, H * .5);
  person(YOU, { x: 0, y: 0, R: 360, yaw: 1.45, pitch: 0, roll: 1.5, light: [0, .6, .5], rim: '90,255,170', rimA: .8, t, bodyYaw: 1.45, bodyRoll: 1.5, e: { taped: 1, tear: 1, tearSide: 1, tearP: ss(seg(u, .5, 5)) } });
  const c = g(); c.setTransform(1, 0, 0, 1, 0, 0); const gr = c.createLinearGradient(0, H * .62, 0, H); gr.addColorStop(0, 'rgba(230,236,234,0)'); gr.addColorStop(.2, '#dfe5e3'); gr.addColorStop(1, '#9aa6a4'); c.fillStyle = gr; c.fillRect(0, H * .62, W, H * .38);
};
// NURSE: over the doctor's shoulder (the back of his cap dark in the foreground) onto the nurse, worried; on "Normal 'yan" focus racks to him
S.nurse = (t, u, s) => {
  const r1 = seg(t, T0('r1'), T1('r1')), d2 = ss(seg(t, T0('d2') - .2, T0('d2') + .6));
  plate(18, () => orWall({ s: .9, ox: -150, oy: -200 }));
  camera(0, 0, 1, 0, W / 2, H / 2);
  const nb = 10 * d2, db = 10 * (1 - d2);
  plate(nb * 1.4, () => { camera(0, 0, 1, 0, W / 2, H / 2); person(NURSE, { x: 190, y: 160, R: 270, yaw: -.55, pitch: .15, light: [.4, .7, .5], rim: '170,210,255', rimA: .7, t, bodyYaw: -.5, e: { worry: .9, open: 1.15 + .1 * r1, look: [-.45 + .7 * d2, .25], squint: .05, wet: .5 } }); });
  plate(db * 1.6, () => { camera(0, 0, 1, 0, W / 2, H / 2); person(DOC, { x: -330, y: 520, R: 360, yaw: Math.PI - .35 - .4 * d2, pitch: .1, light: [.4, .7, .5], rim: '255,250,236', rimA: .8, t, bodyYaw: Math.PI - .3, e: { frown: .2, open: .7, look: [.3, .2] } }); });
};
// BUYER: from low, three-quarter, the cold light of the corridor behind him; he looks down at you
S.buyer = (t, u, s) => {
  const k = ss(seg(u, 0, s.b - s.a)), say = seg(t, T0('x1'), T1('x1'));
  plate(18, () => { orWall({ s: 1.1, ox: -260, oy: -350 }); glowAt(W * .2, H * .2, 900, '200,225,255', .5); });
  camera(0, 0, lerp(1.0, 1.1, k), 0, W / 2, H * .55);
  person(BUYER, { x: 60, y: -120, R: 330, yaw: -.6, pitch: -.32, light: [-.6, .2, .4], rim: '200,225,255', rimA: 1, t, bodyYaw: -.45, e: { look: [.4, .55], frown: .35, open: .75, mouth: say > 0 && say < 1 ? .25 * Math.abs(Math.sin(t * 9)) : 0, press: .3 } });
};
// ---------- props ----------
function monitor2D(c, x, y, w, h, t, hr = 74) {      // the patient monitor: ECG sweep, pleth, numbers
  c.save(); c.translate(x, y); c.fillStyle = '#2a3034'; c.beginPath(); c.roundRect(-14, -14, w + 28, h + 28, 18); c.fill(); c.fillStyle = '#03110c'; c.fillRect(0, 0, w, h);
  const per = 60 / hr, sw = (t / 3) % 1, ecg = u => { const p = (u / per) % 1; return p < .08 ? Math.sin(p / .08 * Math.PI) * .08 : p < .14 ? 0 : p < .16 ? -.12 : p < .19 ? 1 : p < .22 ? -.28 : p < .34 ? 0 : p < .46 ? Math.sin((p - .34) / .12 * Math.PI) * .18 : 0; };
  for (const [row, col, fn] of [[.32, '#6affb0', ecg], [.7, '#6ec8ff', u => { const p = (u / per) % 1; return Math.exp(-(((p - .3) * 6) ** 2)) * .8; }]]) { c.beginPath(); for (let i = 0; i <= 200; i++) { const uu = i / 200, age = (sw - uu + 1) % 1; if (age > .93) { c.moveTo(10 + uu * w * .66, h * row); continue; } c.lineTo(10 + uu * w * .66, h * row - fn(t - age * 3) * h * .22); } c.strokeStyle = col; c.lineWidth = 4; c.shadowColor = col; c.shadowBlur = 12; c.stroke(); c.shadowBlur = 0; }
  c.font = `${h * .28}px Anton`; c.textAlign = 'right'; c.fillStyle = '#6affb0'; c.fillText(Math.round(hr), w - 12, h * .38); c.font = `${h * .2}px Anton`; c.fillStyle = '#6ec8ff'; c.fillText('98', w - 12, h * .8);
  c.restore(); glowAt(x + w / 2, y + h / 2, w, '90,255,170', .25);
}
function syringe(c, x, y, s, ang, push, t) {         // a syringe into the IV port: barrel, markings, plunger, the liquid going in
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.strokeStyle = 'rgba(230,240,245,.6)'; c.lineWidth = .04; c.beginPath(); c.moveTo(-.2, 0); c.bezierCurveTo(-1.2, .3, -2.2, -.2, -3.2, .4); c.stroke();
  c.fillStyle = '#d9e4e8'; c.fillRect(-.25, -.06, .3, .12); c.fillStyle = '#c0ccd2'; c.fillRect(.05, -.02, .45, .04);
  const bx = .5, bw = 2.2, liq = 1 - push; c.fillStyle = 'rgba(220,240,250,.35)'; c.fillRect(bx, -.22, bw, .44); c.fillStyle = 'rgba(250,250,255,.75)'; c.fillRect(bx + .05, -.18, bw * liq * .9, .36);
  c.strokeStyle = 'rgba(80,100,110,.8)'; c.lineWidth = .02; c.strokeRect(bx, -.22, bw, .44); for (let k = 1; k < 10; k++) { c.beginPath(); c.moveTo(bx + k * bw / 10, -.22); c.lineTo(bx + k * bw / 10, -.22 + (k % 2 ? .08 : .14)); c.stroke(); }
  c.fillStyle = '#2b2b30'; c.fillRect(bx + .05 + bw * liq * .9, -.2, .12, .4); c.fillStyle = '#c8d0d4'; c.fillRect(bx + .17 + bw * liq * .9, -.04, 1.6, .08); c.fillRect(bx + 1.7 + bw * liq * .9, -.3, .1, .6);
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(bx, -.18, bw, .04); c.restore();
}
function hospitalWard(c, k = 0) {        // the ward in the morning: pale walls, a curtain, sunlight through the window
  c.setTransform(1, 0, 0, 1, 0, 0); let gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#efe4cc'); gr.addColorStop(1, '#a7a99c'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff6e0'; c.fillRect(W * .55, H * .08, W * .4, H * .32); c.strokeStyle = '#d8ccb4'; c.lineWidth = 16; c.strokeRect(W * .55, H * .08, W * .4, H * .32); c.beginPath(); c.moveTo(W * .75, H * .08); c.lineTo(W * .75, H * .4); c.moveTo(W * .55, H * .24); c.lineTo(W * .95, H * .24); c.stroke();
  for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? 'rgba(170,205,200,.55)' : 'rgba(140,180,176,.5)'; c.fillRect(-40 + i * 70, 0, 60, H); }
  glowAt(W * .75, H * .22, 900, '255,236,200', .6); c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(255,230,190,.12)'; c.beginPath(); c.moveTo(W * .55, H * .1); c.lineTo(W * .95, H * .1); c.lineTo(W * .4, H); c.lineTo(-W * .2, H); c.fill(); c.restore();
}
const NURSE_FACE = { ...NURSE, mask: 0, lips: '210,120,125' };
const L_COLD = [-.5, .4, .55];
// COUNT: the anaesthetist above you, upside down in your view; the clear mask comes down onto your face; the frame closes softly with each number
S.count = (t, u, s) => {
  const k = ss(seg(u, 0, s.b - s.a)), c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#c9cfcf'; c.fillRect(0, 0, W, H);
  plate(8 + 14 * k, () => lampDisc(W / 2, H * .62, 260, 1));
  plate(4 * k, () => { camera(0, 0, 1, 0, W / 2, H / 2); person(DOC, { x: 0, y: -620, R: 330, yaw: 0, pitch: -.3, roll: Math.PI, light: [0, -.6, .35], rim: '255,250,236', rimA: 1, t, e: { look: [0, -.45], open: .8, frown: .1 } }); });
  // the anaesthesia mask: a clear dome with a black rim, growing as it comes to your face
  const m = ss(seg(u, .4, 2.6)), r = lerp(160, 900, m); c.setTransform(1, 0, 0, 1, 0, 0); c.save(); c.translate(W / 2, lerp(H * .78, H * .62, m));
  c.fillStyle = `rgba(210,235,245,${.18 + .1 * m})`; c.beginPath(); c.ellipse(0, 0, r, r * .8, 0, 0, TAU); c.fill(); c.strokeStyle = '#1c2226'; c.lineWidth = 24 + 50 * m; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 6; c.beginPath(); c.ellipse(-r * .25, -r * .25, r * .45, r * .3, -.6, 3.6, 4.6); c.stroke(); c.restore();
  // the frame closing with each number (soft, breathing; never a flash)
  const nums = ['sampu', 'siyam', 'walo', 'pito'].map(w => wordT('s2', w)); let close = 0; nums.forEach((w, i) => { close = Math.max(close, (i + 1) / 4 * ss(seg(t, w, w + .6))); });
  const vg = c.createRadialGradient(W / 2, H / 2, lerp(H * .7, H * .08, close), W / 2, H / 2, lerp(H * .9, H * .35, close)); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.97)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
};
// DARK: behind your taped lids: black, a faint red glow of light through skin pulsing with your heart, the tape's edges
S.dark = (t, u, s) => {
  const c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#050203'; c.fillRect(0, 0, W, H);
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.25)), 6), a = ss(seg(u, .6, 2.5));
  glowAt(W / 2, H * .45, 900, '150,30,25', (.25 + .1 * beat) * a); glowAt(W / 2, H * .45, 500, '220,80,50', (.12 + .06 * beat) * a);
  c.strokeStyle = `rgba(255,220,200,${.08 * a})`; c.lineWidth = 6; c.strokeRect(W * .08, H * .36, W * .84, H * .2);
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,200,180,${.05 * a * hash(i)})`; c.beginPath(); c.arc(hash(i * 3.1) * W, hash(i * 1.7) * H, 2 + 6 * hash(i * 5), 0, TAU); c.fill(); }
};
// TEAR: so close the taped eye fills the frame; the tear finds its way out from under the tape
S.tear = (t, u, s) => {
  const k = ss(seg(u, 0, s.b - s.a)), c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#d7dcda'; c.fillRect(0, 0, W, H);
  camera(-95, 0, lerp(2.6, 2.9, k), -.1, W / 2, H * .44);
  person(YOU, { x: 0, y: 0, R: 330, light: [0, .3, 1], rim: '255,250,236', rimA: .2, t, e: { taped: 1, sweat: .9, tear: 1, tearSide: -1, tearP: ss(seg(t, wordT('s5', 'luha') - 1.2, wordT('s5', 'luha') + 2.2)) } });
  c.setTransform(1, 0, 0, 1, 0, 0); glowAt(W * .5, H * .05, 800, '255,250,236', .3);
};
// DOOR: low on the floor across the OR; the door swings, a cold corridor light spills across the tiles, a man in a dark jacket stands in it
S.door = (t, u, s) => {
  const op = ss(seg(t, wordT('s6', 'bumukas') - .2, wordT('s6', 'bumukas') + 1.4)), wk = ss(seg(t, wordT('s6', 'pumasok'), wordT('s6', 'pumasok') + 2)), c = g();
  orWall({ s: 1, ox: 0, oy: -120, door: false });
  c.setTransform(1, 0, 0, 1, 0, 0); const dx = W / 2, dy = H * .45 - 120, dw = 320, dh = 780;
  c.fillStyle = '#dfeeff'; c.fillRect(dx - dw / 2, dy - 380, dw, dh); glowAt(dx, dy, 700, '210,230,255', .6 * op);
  // his silhouette in the doorway, walking in
  c.save(); camera(0, 0, 1, 0, dx, dy + 40); person(BUYER, { x: 0, y: -150 + 40 * wk, R: lerp(72, 96, wk), yaw: 0, pitch: 0, light: [0, .2, -1], rim: '210,230,255', rimA: 1, t, bodyYaw: 0, e: { open: .7 } }); c.restore();
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(6,10,14,${.55 * (1 - .3 * op)})`; c.fillRect(dx - dw / 2, dy - 380, dw, dh);
  // the door leaf turning on its hinge, its round window
  c.save(); c.translate(dx - dw / 2, dy - 380); c.scale(Math.cos(op * 1.3), 1); c.fillStyle = '#4a5a5e'; c.fillRect(0, 0, dw, dh); c.strokeStyle = '#1a2224'; c.lineWidth = 6; c.strokeRect(0, 0, dw, dh); c.fillStyle = '#cfe6f0'; c.beginPath(); c.arc(dw / 2, 200, 60, 0, TAU); c.fill(); c.restore();
  // the floor, the spill of light reaching toward us
  const gr = c.createLinearGradient(0, H * .66, 0, H); gr.addColorStop(0, '#1a2a2c'); gr.addColorStop(1, '#0a1214'); c.fillStyle = gr; c.fillRect(0, H * .66, W, H);
  c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = `rgba(200,225,255,${.35 * op})`; c.beginPath(); c.moveTo(dx - dw / 2, H * .66); c.lineTo(dx + dw / 2, H * .66); c.lineTo(dx + 520, H); c.lineTo(dx - 520, H); c.fill(); c.restore();
};
// BUYER continues through s7: the push-in goes on while the narrator says what is happening
// FINGER: your hand on the blue drape; one finger shakes and lifts. On the nurse's line, her eyes go wide
S.finger = (t, u, s) => {
  const c = g(), r2 = T0('r2');
  if (t < r2 - .15) {
    c.setTransform(1, 0, 0, 1, 0, 0); let gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#5f93a8'); gr.addColorStop(1, '#2d5466'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 9; k++) { c.strokeStyle = k % 2 ? 'rgba(10,30,40,.3)' : 'rgba(200,235,250,.12)'; c.lineWidth = 40 + 30 * hash(k); c.filter = 'blur(14px)'; c.beginPath(); c.moveTo(hash(k) * W, 0); c.bezierCurveTo(hash(k * 2) * W, H * .4, hash(k * 3) * W, H * .6, hash(k * 4) * W, H); c.stroke(); c.filter = 'none'; }
    const lift = ss(seg(t, wordT('s8', 'daliri') - .2, wordT('s8', 'isa') + .6)) * (.55 + .08 * Math.sin(t * 19) + .04 * Math.sin(t * 31));
    camera(0, 0, 1, 0, W / 2, H / 2); hand(YOU, -300, 300, 420, -.5, { curl: [.25, .15 * (1 - lift), .2, .25, .3], lift, sleeve: '#d8e0e4' });
    glowAt(W * .3, H * .2, 700, '255,250,236', .35);
  } else {
    plate(16, () => orWall({ s: .9, ox: 140, oy: -260 }));
    camera(0, 0, 1.55, 0, W / 2, H * .45);
    person(NURSE, { x: 0, y: 0, R: 300, yaw: .2, pitch: .1, light: [.3, .7, .6], rim: '170,210,255', rimA: .7, t, e: { worry: .4, browUp: .9, open: 1.3, look: [-.1, .55], dilate: .4, wet: .6 } });
  }
};
// DOSE: the doctor's gloved thumb pushes the syringe into your line; then everything slides away (blur and dark, slowly)
S.dose = (t, u, s) => {
  const c = g(), d3 = T0('s9');
  if (t < d3 - .1) {
    plate(18, () => { orWall({ s: 1.2, ox: 300, oy: 200, monitor: [W * .2, H * .3] }); });
    c.setTransform(1, 0, 0, 1, 0, 0); syringe(c, W * .32, H * .55, 170, -.25, ss(seg(u, .6, 2.6)), t);
    hand({ ...DOC, skin: ['#b8d0dc', '#8eb0c2', '#5a7c8e'], lineC: '#2a4250', lineRGB: '42,66,80', shadeRGB: '40,70,90' }, W * .82, H * .5, 260, Math.PI - .25, { curl: [.1, .5, .55, .6, .6], flip: 1 });
    monitor2D(c, W * .08, H * .12, 380, 240, t, lerp(118, 96, ss(seg(u, 1, 3))));
  } else {
    const k = ss(seg(t, d3, s.b)), cc = c; cc.setTransform(1, 0, 0, 1, 0, 0); cc.fillStyle = '#c9cfcf'; cc.fillRect(0, 0, W, H);
    plate(10 + 50 * k, () => { lampDisc(W / 2, H * .5, 300 * (1 + .3 * k), 1 - .5 * k); camera(0, 0, 1, 0, W / 2, H / 2); person(DOC, { x: -60, y: -720, R: 320, yaw: .05, pitch: -.3, roll: Math.PI + .2, light: [0, -.6, .3], rim: '255,250,236', rimA: 1, t, e: { look: [0, -.5], frown: .3, open: .8 } }); });
    cc.setTransform(1, 0, 0, 1, 0, 0); cc.fillStyle = `rgba(0,0,0,${.85 * k})`; cc.fillRect(0, 0, W, H);
  }
};
// CTA: a held breath: the lamp far and blurred, the question on screen
S.cta = (t, u, s) => {
  const c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0c1214'; c.fillRect(0, 0, W, H);
  plate(30, () => lampDisc(W / 2, H * .38, 240, .6)); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
};
// WAKE: morning in the ward; Nanay leans in, smiling through tears, from your pillow's angle
S.wake = (t, u, s) => {
  const k = ss(seg(u, 0, 1.6)); hospitalWard(g());
  plate(lerp(30, 0, k), () => { camera(0, 0, 1.05, -.05, W / 2, H * .45); person(NANAY, { x: 40, y: -30, R: 310, yaw: .45, pitch: .22, light: [.7, .45, .6], rim: '255,236,200', rimA: .8, t, bodyYaw: .3, e: { smile: .85, worry: .35, open: .8, look: [-.3, .35], tear: .7, tearSide: -1, wet: .8 } }); });
  const c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(255,248,235,${.6 * (1 - k)})`; c.fillRect(0, 0, W, H);
};
// SCAR: looking down at your side as the gown lifts: a dressing on the left... the camera pans... and another on the right
function dressing(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.rotate(-.15); c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect(-s, -s * .45, s * 2, s * .9, s * .1); c.fill();
  c.strokeStyle = 'rgba(200,205,200,.9)'; c.lineWidth = 3; c.stroke(); c.fillStyle = 'rgba(235,238,240,.7)'; c.fillRect(-s * 1.25, -s * .55, s * .35, s * 1.1); c.fillRect(s * .9, -s * .55, s * .35, s * 1.1);
  c.strokeStyle = '#2a2a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-s * .7, 0); c.lineTo(s * .7, 0); c.stroke(); for (let k = 0; k < 7; k++) { const xx = -s * .6 + k * s * .2; c.beginPath(); c.moveTo(xx - 6, -12); c.lineTo(xx + 6, 12); c.stroke(); }
  c.fillStyle = 'rgba(190,120,110,.25)'; c.beginPath(); c.ellipse(0, 0, s * .8, s * .12, 0, 0, TAU); c.fill(); c.restore();
}
S.scar = (t, u, s) => {
  const c = g(), k = ss(seg(t, wordT('s11', 'magkabilang') - .4, wordT('s11', 'magkabilang') + 1.2)), lift = ss(seg(u, .2, 1.6));
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#20262a'; c.fillRect(0, 0, W, H);
  camera(lerp(-300, 300, k), 0, 1, 0, W / 2, H * .5);
  const gr = c.createLinearGradient(-900, 0, 900, 0); gr.addColorStop(0, YOU.skin[2]); gr.addColorStop(.5, YOU.skin[0]); gr.addColorStop(1, YOU.skin[2]); c.fillStyle = gr; c.beginPath(); c.roundRect(-760, -700, 1520, 1500, 300); c.fill();
  blob(0, -100, 260, 500, 0, '150,80,70', .25); blob(-560, 0, 200, 600, 0, '100,50,40', .35); blob(560, 0, 200, 600, 0, '100,50,40', .35);
  dressing(c, -430, 120, 150, t); dressing(c, 430, 140, 150, t);
  c.fillStyle = '#dfe6ea'; c.beginPath(); c.moveTo(-1200, -1000); c.lineTo(1200, -1000); c.lineTo(1200, lerp(800, -420, lift)); c.quadraticCurveTo(0, lerp(900, -300, lift), -1200, lerp(800, -420, lift)); c.fill();
  c.strokeStyle = '#9aa8b0'; c.lineWidth = 6; c.stroke(); for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(70,110,150,.35)'; c.fillRect(-1100 + hash(i) * 2200, -980 + hash(i * 3) * (lerp(1700, 500, lift)), 10, 10); }
  c.setTransform(1, 0, 0, 1, 0, 0); glowAt(W * .8, H * .1, 900, '255,236,200', .4);
};
// NOTE: the nurse in the doorway of the ward, her mask pulled down for the first time; she whispers and goes
S.note = (t, u, s) => {
  const k = ss(seg(u, 0, s.b - s.a)); hospitalWard(g());
  plate(4, () => { const c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(40,50,50,.35)'; c.fillRect(0, 0, W, H); });
  camera(0, 0, lerp(1.0, 1.12, k), 0, W / 2, H * .46);
  person(NURSE_FACE, { x: 0, y: -40, R: 300, yaw: -.35, pitch: .12, light: [.6, .4, .55], rim: '255,236,200', rimA: .8, t, bodyYaw: -.25, e: { worry: .8, sad: .5, open: .75, look: [.35, .3], mouth: seg(t, T0('r3'), T1('r3')) > 0 && t < T1('r3') ? .18 * Math.abs(Math.sin(t * 7)) : 0, wet: 1, tear: .9, tearSide: 1 } });
  // her mask hanging under the chin
  useCam(); const c = g(); c.fillStyle = 'rgba(200,225,232,.95)'; c.beginPath(); c.ellipse(-10, 320, 170, 60, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(60,90,100,.6)'; c.lineWidth = 4; c.stroke();
};
S.end = (t, u, s) => { const c = g(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); };

// ---------- post: bloom, grain, vignette; title and captions ----------
const GR = document.createElement('canvas'); GR.width = 540; GR.height = 960; { const x = GR.getContext('2d'), id = x.createImageData(540, 960); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (hash(i * .0731) - .5) * 60; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); }
const BL = document.createElement('canvas'); BL.width = W / 2; BL.height = H / 2;
function post(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none';
  const b = BL.getContext('2d'); b.filter = 'blur(14px) brightness(1.1)'; b.clearRect(0, 0, W / 2, H / 2); b.drawImage(cv, 0, 0, W / 2, H / 2); b.filter = 'none';
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .22; ctx.drawImage(BL, 0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const vg = ctx.createRadialGradient(W / 2, H * .45, H * .28, W / 2, H * .45, H * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(4,6,10,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .07; const f = Math.floor(t * 12); ctx.drawImage(GR, -hash(f) * 200, -hash(f * 1.7) * 200, W + 200, H + 200); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function textC(s, x, y, px, col, glow = null, stroke = 14) { ctx.font = `${px}px Anton`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = stroke; ctx.strokeStyle = '#05070a'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 16; ctx.strokeText(s, x, y); ctx.shadowBlur = 0; if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 28; } ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.shadowBlur = 0; }
function title(a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; textC('GISING KA', W / 2, 330, 150, '#f4f1ea'); textC('HABANG INOOPERAHAN', W / 2, 460, 76, '#a8f0de', 'rgba(110,230,200,.7)', 10); ctx.restore(); }
const VC = { nurse: '#ffd6e0', doktor: '#cfe6ff', lalaki: '#ffcf9a', nanay: '#ffe2b8' };
function captions(t) {
  let l = null; for (const x of TL.lines) { if (x.t0 - .02 > t) break; l = x; } if (!l || !l.words || t > l.t1 + .25) return;
  let k = -1; l.words.forEach((w, i) => { if (t >= w[1] - .02) k = i; }); if (k < 0) return;
  const a = Math.floor(k / 3) * 3, ws = l.words.slice(a, a + 3), keys = (l.key || []).map(s => s.toLowerCase());
  ctx.font = '92px Anton'; const wd = ws.map(w => ctx.measureText(w[0].toUpperCase()).width), gap = 40, tot = wd.reduce((s, v) => s + v, 0) + gap * (ws.length - 1), sc = Math.min(1, 980 / tot);
  let x = W / 2 - tot * sc / 2;
  ws.forEach((w, i) => { const idx = a + i; if (idx <= k) { const isKey = keys.includes(w[0].toLowerCase()), pop = idx === k ? 1 + .12 * (1 - ss(seg(t, w[1], w[1] + .16))) : 1;
      ctx.save(); ctx.translate(x + wd[i] * sc / 2, 1530); ctx.scale(sc * pop, sc * pop); textC(w[0].toUpperCase(), 0, 0, 92, isKey ? '#7ff0d0' : (VC[l.voice] || '#ffffff'), isKey ? 'rgba(80,230,190,.8)' : null, 16); ctx.restore(); }
    x += (wd[i] + gap) * sc; });
}
window.renderAt = t => {
  const s = SHOTS.find(x => t >= x.a && t < x.b) || SHOTS[SHOTS.length - 1], u = t - s.a;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  S[s.name](t, u, s); post(t);
  if (s.a > 0) { const d = 1 - ss(seg(u, 0, .35)); if (d > 0) { ctx.fillStyle = `rgba(0,0,0,${.85 * d})`; ctx.fillRect(0, 0, W, H); } }
  if (s.name === 'hook') title(ss(seg(u, .3, 1.0)) * (1 - ss(seg(t, s.b - .5, s.b))));
  if (s.name === 'cta') { const a = ss(seg(u, .3, 1)) * (1 - ss(seg(t, s.b - .5, s.b))); ctx.save(); ctx.globalAlpha = a; textC('IKAW,', W / 2, 520, 110, '#f4f1ea'); textC('ANO ANG GAGAWIN MO?', W / 2, 650, 84, '#a8f0de', 'rgba(110,230,200,.7)', 12); textC('I-COMMENT MO', W / 2, 1000, 70, '#ffd27a', 'rgba(255,200,90,.6)', 10); ctx.restore(); }
  if (s.name === 'end') { const a = ss(seg(u, .5, 1.3)) * (1 - ss(seg(t, DUR - .6, DUR))); ctx.save(); ctx.globalAlpha = a; textC('GISING KA', W / 2, H * .45, 130, '#d8d4cc'); textC('HABANG INOOPERAHAN', W / 2, H * .45 + 110, 62, '#8fd8c6', null, 10); ctx.restore(); }
  if (s.name !== 'end') captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton')]).then(() => true);

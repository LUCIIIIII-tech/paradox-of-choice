
// ---------- the story: event times come from words in the script, so the picture follows the narrator ----------
function T(id) { return LN[id].t0; } function E(id) { return LN[id].t1; }
const wx = (id, w) => wordT(id, w);
const mixHex = (a, b, u) => { const p = h => h[0] === '#' ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).map(Number), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };   // nests
const flick = t => .86 + .09 * Math.sin(t * 13) + .05 * Math.sin(t * 31 + 1);
const YOU = { hood: ['#4a6a9a', '#34507a', '#1c2c48'], legs: ['#3a3e4a', '#26282f', '#121318'], skin: ['#c48a64', '#9a6444', '#5a3624'], hair: HAIRC };
const NANAY = { hood: ['#c87a8a', '#a05a6a', '#5a2a3a'], legs: ['#7a5a6a', '#5a4050', '#2e2028'], skin: ['#d0a080', '#a87656', '#62402a'], hair: ['#d8d4d0', '#a8a4a0', '#6a6662'], glasses: 1 };
const KID = { hood: ['#f2c430', '#c89a20', '#6a5010'], legs: JEANC, skin: ['#d0a080', '#a87656', '#62402a'], hair: HAIRC };
// the days: which number hangs over Nanay in each scene (and in the counter up top)

// ---------- pieces ----------
function sky(t, o = {}) {
  const d = o.dusk || 0, n = o.night || 0;
  grad(mixHex(mixHex('#7ab0e0', '#e0784a', d), '#0a1028', n), mixHex(mixHex('#d8eaf4', '#f6b060', d), '#1c2448', n), -400, 1300);
  if (o.sun) { const [sx, sy] = o.sun, r = o.sr || 80; glow(sx, sy, r * 6, '255,200,140', .55); circ(sx, sy, r, '#fff0d0'); L(sx, sy, r * 14, C.warm, .95, .22); }
  if (n > .5) for (let i = 0; i < 140; i++) circ(hash(i * 3.7) * W, hash(i * 5.1) * 1000 - 100, 1 + 1.5 * hash(i), `rgba(225,232,255,${.3 + .5 * hash(i + 1)})`);
}
// the number over someone's head: a soft glowing figure with ARAW under it
function badge(x, y, n, k = 1, big = 1) { if (k <= 0) return; const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  big *= 1.3; y -= 60 * big; g.save(); g.globalAlpha *= k; g.translate(x, y - 10 * (1 - k)); g.scale(big, big); glow(0, 0, 140, '255,236,190', .5); g.shadowColor = 'rgba(255,220,160,.9)'; g.shadowBlur = 24;
  text(s, 0, 0, 70, '#fff6e0', 'Anton', 'center', 0); g.shadowBlur = 0; text('ARAW', 0, 46, 24, 'rgba(255,240,210,.85)', 'Anton'); g.restore(); L(x, y, 200 * big, C.warm, .6 * k, .3 * k); }
function headOf(x, y, h) { return [x, y - h * .855, h * .14]; }
function bun(x, y, h, col = NANAY.hair[1]) { const [hx, hy, r] = headOf(x, y, h); circ(hx + r * .1, hy - r * 1.02, r * .38, col); circ(hx + r * .1, hy - r * 1.02, r * .38, 'rgba(0,0,0,.25)', r * .04); }
function nanay(x, y, h, o = {}) { person(x, y, h, { ...NANAY, ...o }); if (!o.back) bun(x, y, h); else { const [hx, hy, r] = headOf(x, y, h); circ(hx, hy - r * .7, r * .42, NANAY.hair[1]); } }
function room(t, o = {}) {                      // inside the house: a painted wall, a window, the wooden floor
  g.fillStyle = lg(0, 0, 0, 1400, [o.wall || '#d8c8a0', mixHex(o.wall || '#d8c8a0', '#4a3a28', .45)]); g.fillRect(-400, -400, 1900, 1800);
  if (o.win) { const [a, b, c, d] = o.win; g.save(); g.beginPath(); g.rect(a, b, c - a, d - b); g.clip(); (o.outside || (() => sky(t, {})))(a, b, c, d); g.restore(); g.strokeStyle = '#5a3a22'; g.lineWidth = 22; g.strokeRect(a, b, c - a, d - b); line([[(a + c) / 2, b], [(a + c) / 2, d]], 10, '#5a3a22'); }
  g.fillStyle = lg(0, o.floor || 1400, 0, 2100, ['#8a6a46', '#3a2814']); g.fillRect(-400, o.floor || 1400, 1900, 900); for (let k = -10; k <= 10; k++) line([[540 + k * 60, o.floor || 1400], [540 + k * 160, 2300]], 4, 'rgba(0,0,0,.25)');
}
function kitchen(t, o = {}) {                   // Nanay's kitchen: the window, the shelf of jars, the two-burner stove, the pot
  room(t, { wall: o.wall || '#d6c49a', win: [620, 320, 980, 760], outside: o.outside });
  g.fillStyle = '#6a4a2a'; g.fillRect(120, 560, 400, 16); for (let k = 0; k < 5; k++) { rr(140 + k * 74, 470, 52, 90, 10); g.fillStyle = ['#c8a050', '#8ab060', '#d87a4a', '#c8c0a0', '#9a6a3a'][k]; g.fill(); }
  rr(80, 1180, 920, 60, 8); fs('#8a7a6a', 4); g.fillStyle = '#6a5a4a'; g.fillRect(80, 1240, 920, 300);
  if (o.pot !== 0) { rr(300, 1100, 240, 90, 10); fs('#3a3a40', 3); ell(420, 1102, 120, 22); g.fillStyle = o.cold ? '#4a4a50' : '#9a7a4a'; g.fill(); if (!o.cold) { for (let k = 0; k < 2; k++) { const p = ((t * .5) + k * .5) % 1; curve([400 + 30 * k, 1090], [400 + 30 * Math.sin(t + k), 1000 - 80 * p], [420 + 20 * Math.sin(t * .7 + k), 900 - 160 * p], 8, `rgba(240,240,250,${.3 * (1 - p)})`); } L(420, 1200, 300, C.fire, .7, .2); } }
  if (o.bulb !== 0) { line([[540, -400], [540, 200]], 4, '#222'); ell(540, 230, 24, 32); g.fillStyle = o.cold ? '#6a6a60' : '#fff4c8'; g.fill(); if (!o.cold) L(540, 260, 1400, C.warm, .95, .25); }
}
function bench(x, y, w) { rr(x - w / 2, y - 20, w, 30, 6); fs('#7a5232', 3); for (const dx of [-w / 2 + 30, w / 2 - 40]) { g.fillStyle = '#5a3a22'; g.fillRect(x + dx, y + 10, 14, 120); } }
function houseFront(t, x, y, s, lit = 1) { const w = 7 * s, h = 3.2 * s; g.fillStyle = '#d8c8a0'; g.fillRect(x - w / 2, y - h, w, h); path([[x - w / 2 - .5 * s, y - h], [x, y - h - 2 * s], [x + w / 2 + .5 * s, y - h]]); g.closePath(); g.fillStyle = '#7a3a2a'; g.fill();
  rr(x - w * .35, y - h * .75, w * .22, h * .35, 4); g.fillStyle = lit ? '#ffd890' : '#3a4a5a'; g.fill(); if (lit) L(x - w * .24, y - h * .57, w * .6, C.warm, .8 * lit, .25); rr(x + w * .1, y - h * .7, w * .16, h * .7, 3); g.fillStyle = '#5a3a22'; g.fill(); }
function town(t, o = {}) {                      // a Manila street at golden hour: buildings, a jeepney, wires
  sky(t, { dusk: o.dusk ?? .6, sun: [800, 860], sr: 70 });
  [[-60, 420, 300, '#6a5a6a'], [240, 520, 280, '#5a6a72'], [520, 460, 300, '#72604a'], [820, 500, 320, '#5e5a6c']].forEach(([x, top, w, col], i) => { g.fillStyle = col; g.fillRect(x, top, w, 1400 - top);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const lit = hash(i * 7 + r * 3 + c) > .45; rr(x + 30 + c * (w - 90) / 2, top + 50 + r * 190, 70, 110, 4); g.fillStyle = lit ? '#ffd890' : '#2a2a34'; g.fill(); if (lit) L(x + 65 + c * (w - 90) / 2, top + 105 + r * 190, 140, C.warm, .7, .12); } });
  for (let k = 0; k < 6; k++) curve([-60, 380 + k * 14], [540, 470 + k * 20], [1140, 380 + k * 16], 2.5, '#141418');
  g.fillStyle = lg(0, 1400, 0, 2100, ['#5a5450', '#2a2622']); g.fillRect(-400, 1400, 1900, 800);
  if (o.jeep !== 0) { const jx = ((t * 60) % 1700) - 400; rr(jx, 1200, 360, 200, 20); fs('#d8d8d0', 4); rr(jx + 20, 1220, 320, 70, 8); g.fillStyle = '#3a4a5a'; g.fill(); g.fillStyle = '#c8302a'; g.fillRect(jx, 1300, 360, 16); for (const dx of [70, 290]) circ(jx + dx, 1400, 36, '#141414'); text('CUBAO', jx + 180, 1200, 30, '#2a2a6a', 'Anton'); }
}
function heart(x, y, s, col) { g.beginPath(); g.moveTo(x, y + s * .3); g.bezierCurveTo(x - s, y - s * .4, x - s * .5, y - s * 1.1, x, y - s * .5); g.bezierCurveTo(x + s * .5, y - s * 1.1, x + s, y - s * .4, x, y + s * .3); g.fillStyle = col; g.fill(); }
function notes(t, x, y, a = 1) { for (let k = 0; k < 3; k++) { const p = ((t * .35) + k / 3) % 1; g.save(); g.globalAlpha = a * Math.sin(Math.PI * p); text('♪', x + 60 * Math.sin(t + k * 2) + k * 30, y - p * 260, 60, '#fff2d0', 'serif'); g.restore(); } }
function tears(x, y, r, t, a = 1) { for (const sg of [-1, 1]) { const p = ((t * .5) + (sg > 0 ? .5 : 0)) % 1; g.save(); g.globalAlpha = a * (1 - p * .5); g.beginPath(); const tx = x + sg * r * .36, ty = y + r * .2 + p * r * .7; g.moveTo(tx, ty - r * .08); g.quadraticCurveTo(tx + r * .06, ty + r * .04, tx, ty + r * .07); g.quadraticCurveTo(tx - r * .06, ty + r * .04, tx, ty - r * .08); g.fillStyle = '#bfe6ff'; g.fill(); g.restore(); } }


// ---------- the family ----------
const TATAY = { hood: ['#c8b48a', '#a08a64', '#5a4a30'], legs: ['#5a5040', '#3a3428', '#1e1a14'], skin: ['#a8724e', '#80523a', '#4a2e1e'], hair: ['#3a3430', '#2a2420', '#141010'] };
const ATE = { hood: ['#2a9a8a', '#1e7a6a', '#0e4038'], legs: ['#3a3e4a', '#26282f', '#121318'], skin: ['#d0a080', '#a87656', '#62402a'], hair: ['#1a1012', '#120a0c', '#060404'], longHair: 1 };
const LOLA = { hood: ['#8a6a9a', '#6a4a7a', '#3a2a4a'], legs: ['#5a4a6a', '#3a2e46', '#1e1828'], skin: ['#e0b090', '#b8866a', '#704a36'], hair: ['#e8e6e2', '#b8b4ae', '#76726c'], glasses: 1 };
const KIDS = [['#f2c430', '#c89a20', '#6a5010'], ['#d84a3a', '#a8302a', '#5a1a14'], ['#3ab86a', '#2a8a4a', '#144a26'], ['#9a6ad8', '#7a4ab0', '#3a2260']];
// the family at the table: Tatay, Nanay, Ate behind it, the table across the bottom
function familyAtTable(t, o = {}) {
  person(240, 1760, 900, { t, ...TATAY, eyes: 'open', mouth: o.mouth0 ?? .2 + .25 * Math.abs(Math.sin(t * 8)), smile: 1, look: .4, lx: 1, rim: 'rgba(255,220,170,.5)' });
  nanay(540, 1740, 880, { t, arms: o.nArms || 'offer', eyes: 'open', smile: 1, look: o.nLook ?? .3, lx: 1, rim: 'rgba(255,220,170,.5)' });
  person(840, 1760, 880, { t, ...ATE, eyes: o.ateEyes || 'shut', mouth: o.ateMouth ?? .5 + .2 * Math.abs(Math.sin(t * 11)), smile: 1, look: -.3, lx: -1, rim: 'rgba(255,220,170,.5)' });
}
function dinnerTable(y = 1380, o = {}) {
  rr(-60, y, 1200, 80, 10); fs('#7a5232'); g.fillStyle = '#5a3a22'; g.fillRect(-60, y + 80, 1200, 700);
  for (const [x, s] of [[200, 1], [540, 1.1], [880, 1]]) { ell(x, y + 12, 120 * s, 28 * s); fs('#f4f4f0', 3); ell(x, y + 4, 70 * s, 16 * s); fs(o.cold ? '#d8d0c0' : '#fff8e8'); }
  if (o.food !== 0) { ell(540, y - 30, 110, 60); fs('#f6f0e4', 3); for (let i = 0; i < 30; i++) circ(470 + 140 * hash(i), y - 60 + 50 * hash(i + 3), 4, '#fff'); ell(320, y - 10, 80, 26); fs('#8a3a22', 3); ell(760, y - 10, 80, 26); fs('#4a7a3a', 3); if (!o.cold) for (const x of [320, 760]) { const p = (t_ * .5) % 1; curve([x, y - 20], [x + 20 * Math.sin(t_ + x), y - 90 * p - 40], [x, y - 180 * p - 40], 6, `rgba(240,240,250,${.25 * (1 - p)})`); } }
}
let t_ = 0;
function phoneOnTable(x, y, s, lit = 0, buzz = 0) { const bz = buzz * Math.sin(t_ * 80) * 5; rr(x - 60 * s + bz, y - 110 * s, 120 * s, 220 * s, 16 * s); fs('#0c0c10', 4); rr(x - 50 * s + bz, y - 98 * s, 100 * s, 196 * s, 10 * s); g.fillStyle = lit ? '#bfe8ff' : '#1a1e2a'; g.fill(); if (lit) L(x, y, 420 * s, C.cyan, .9 * lit, .4 * lit); }
function bell(x, y, s, col = YEL) { g.beginPath(); g.moveTo(x - s, y + s * .6); g.quadraticCurveTo(x - s * .9, y - s * .9, x, y - s); g.quadraticCurveTo(x + s * .9, y - s * .9, x + s, y + s * .6); g.closePath(); g.fillStyle = col; g.fill(); circ(x, y + s * .8, s * .22, col); }
// the notification: a glass card with a bell, sliding down from the top, ringing as it lands
function notif(t, t0, t1, msg, label = 'NGAYON', y0 = 470) {
  const k = ss(seg(t, t0, t0 + .35)) * (1 - ss(seg(t, t1 + .1, t1 + .45))); if (k <= 0) return; reset(); g.save(); g.translate(CX, y0 - 80 * (1 - k)); g.globalAlpha = k;
  const w = 900, h = 250; glass(-w / 2, -h / 2, w, h, 34, 'rgba(255,201,77,.75)', 4, 'rgba(255,201,77,.6)');
  const sh = 1 + .12 * Math.sin(t * 30) * Math.exp(-(t - t0) * 3); g.save(); g.translate(-w / 2 + 80, -10); g.rotate(.25 * Math.sin(t * 25) * Math.exp(-(t - t0) * 3)); g.scale(sh, sh); bell(0, 0, 34); g.restore();
  text(label, -w / 2 + 150, -h / 2 + 52, 30, '#ffd98a', 'Anton', 'left'); g.font = '600 46px sans-serif'; g.fillStyle = '#f4f1ea'; g.textAlign = 'left'; g.textBaseline = 'middle';
  const words = msg.split(' '), lines = []; let cur = ''; for (const wd of words) { const tr = cur ? cur + ' ' + wd : wd; if (g.measureText(tr).width > w - 220) { lines.push(cur); cur = wd; } else cur = tr; } lines.push(cur);
  lines.slice(0, 3).forEach((l, i) => g.fillText(l, -w / 2 + 150, -h / 2 + 108 + i * 54)); g.restore();
}

// ---------- shots ----------
const S = {}, dim = { warm: '#a8886a', room: '#9a8070', night: '#1a2040', dusk: '#a8786a', cold: '#6a7484' };
const NOTE = { hook: ['h1', 'Ito na ang huling hapunan na buo kayo.'], jeep: ['n1', 'Huling beses kang binuhat ni Tatay.', 'MAY 2009'], kalye: ['n2', 'Huling beses kayong naglaro ng barkada sa kalye.', 'HUNYO 2011'], lola: ['n3', 'Huling beses kang tinawag ni Lola sa palayaw mo.', 'DISYEMBRE 2014'],
  payong: ['n4', 'Huling beses kang sinundo ni Nanay sa eskwela.', 'AGOSTO 2008'], barkada: ['n5', 'Huling litrato na kumpleto ang barkada.', 'MARSO 2017'] };
const W_VIB = wx('h1', 'nag-vibrate');
const nightOut = (a, b, c, d) => sky(t_, { night: 1 });
// the hook: dinner, the family laughing; your phone by the plate buzzes and lights up
S.hook = (t, u) => { t_ = t; const z = ss(seg(u, 0, 5)); cam(CX, lerp(900, 980, z), lerp(1, 1.08, z), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut }); familyAtTable(t); dinnerTable(1380);
  const lit = ss(seg(t, W_VIB - .05, W_VIB + .2)); phoneOnTable(860, 1660, 1.2, lit, t > W_VIB - .05 && t < W_VIB + 1.6 ? 1 : 0); lightPass(dim.warm); };
// the table, one by one: Tatay talking, Nanay serving, Ate laughing; then you, the only one who knows
S.table = (t, u) => { t_ = t; const f = id => ss(seg(t, wx('h2', id) - .2, wx('h2', id) + .3)), you = ss(seg(t, wx('h2', 'walang') - .2, wx('h2', 'walang') + .5));
  if (you < .5) { const fx = 540 + (f('tatay') * (1 - f('nanay'))) * (240 - 540) + (f('ate')) * (840 - 540); cam(fx, 1000, 1.25, 0, 0, t); kitchen(t, { pot: 0, outside: nightOut }); familyAtTable(t); dinnerTable(1380); lightPass(dim.warm); return; }
  cam(CX, 900, lerp(1.1, 1.0, you), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut }); person(540, 2250, 1450, { t, ...YOU, eyes: 'open', tired: .4, look: -.2, lookY: .3, lx: 1, rim: 'rgba(255,220,170,.5)' }); dinnerTable(1650, { food: 0 }); phoneOnTable(820, 1800, 1.3, .8); lightPass(dim.warm); };
// then they come, one after another
const FLOOD = ['Huling beses kang binuhat ni Tatay.', 'Huling laro sa kalye.', 'Huling tawag ni Lola sa palayaw mo.', 'Huling sundo ni Nanay.', 'Huling litratong kumpleto ang barkada.', 'Huling "Ingat ka, anak."', 'Huling Simbang Gabi na sabay-sabay.', 'Huling sakay sa balikat ni Tatay.'];
S.flood = (t, u) => { t_ = t; cam(CX, 900, 1 + .03 * seg(u, 0, 6), 0, 0, t); grad('#141828', '#06070c', 0, 1920);
  person(540, 2350, 1500, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(150,200,255,.5)' }); L(540, 900, 1300, C.cyan, .6, .1); lightPass('#30343e');
  FLOOD.forEach((m, i) => { const t0 = T('n0') + .2 + i * .45, p = t - t0; if (p < 0) return; const y = 300 + i * 150, x = 540 + (i % 2 ? 50 : -50), k = ss(seg(p, 0, .3)); reset(); g.save(); g.globalAlpha = k * (1 - .5 * seg(p, 2, 4)); g.translate(x, y - 40 * (1 - k));
    glass(-400, -55, 800, 110, 26, 'rgba(255,201,77,.6)', 3); bell(-350, 0, 22); g.font = '600 36px sans-serif'; g.fillStyle = '#f4f1ea'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(m, -310, 2); g.restore(); }); };
// a jeepney at night: Tatay holding you asleep on his lap, nine years old; the street lights sliding past
S.jeep = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 1.2, t); g.fillStyle = '#2a3038'; g.fillRect(-400, -400, 1900, 2600);
  for (let k = 0; k < 4; k++) { rr(80 + k * 240, 560, 200, 300, 14); g.fillStyle = '#0a1018'; g.fill(); for (let j = 0; j < 2; j++) { const lx = 80 + k * 240 + ((t * 300 + j * 110 + k * 50) % 200); circ(lx, 640 + j * 80, 10, '#ffd890'); L(lx, 640 + j * 80, 120, C.amb, .8, .3); } }
  g.fillStyle = '#c8302a'; g.fillRect(-400, 880, 1900, 24); text('BACLARAN • LIBERTAD', 540, 470, 40, '#ffc94d', 'Anton', 'center', 8); rr(-100, 1500, 1300, 80, 10); fs('#7a2a2a');
  person(560, 2000, 1150, { t, ...TATAY, eyes: 'open', lid: .4, smile: 1, lookY: .7, look: -.2, arms: 'lap', lx: 1, rim: 'rgba(255,210,150,.6)' });
  g.save(); g.translate(470, 1480); g.rotate(-1.2); person(0, 300, 560, { t, ...KID, ground: 0, eyes: 'shut', arms: 'down', lx: 1 }); g.restore(); L(540, 700, 900, C.amb, .55, .1); lightPass('#4a4a5a'); };
// the street at dusk: the barkada playing, a mother calling from a window
S.kalye = (t, u) => { t_ = t; const call = ss(seg(t, wx('n2', 'tinawag') - .2, wx('n2', 'tinawag') + .3)); cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t); town(t, { dusk: .9, jeep: 0 });
  if (call > 0) { reset(); } KIDS.forEach((hood, i) => person(160 + i * 250 + 30 * Math.sin(t * 2 + i), 1840, 620, { t, walk: t * 7 + i, hood, legs: JEANC, skin: YOU.skin, hair: HAIRC, arms: i % 2 ? 'up' : 'down', eyes: 'open', mouth: .4, smile: 1, lx: 1 }));
  lightPass(dim.dusk); if (call > 0) { reset(); g.globalAlpha = call; text('"KAKAIN NA!"', 300, 820, 60, '#fff', 'Anton', 'center', 10); reset(); } };
// Lola on the porch calling your nickname; you walking away, earphones in
S.lola = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.05, seg(u, 0, 7)), 0, 0, t); room(t, { wall: '#c8b48a', win: [100, 420, 480, 900], outside: (a, b, c, d) => sky(t, { dusk: .4 }), floor: 1450 });
  person(300, 1900, 960, { t, ...LOLA, longHair: 0, sit: .7, arms: 'out', eyes: 'open', mouth: t < wx('n3', 'hindi') ? .3 + .2 * Math.abs(Math.sin(t * 7)) : 0, tired: t > wx('n3', 'hindi') ? .5 : 0, look: .7, lx: 1 }); bun(300, 1900 + 960 * .16 * .7, 960, LOLA.hair[1]);
  person(lerp(760, 880, seg(u, 0, 8)), 2000, 1100, { t, ...YOU, back: 1, walk: t * 4, lx: -1 }); line([[790, 1150], [800, 1400]], 3, '#eee');
  lightPass(dim.room); reset(); text('"TOTOY!"', 300, 760, 64, '#ffc94d', 'Anton', 'center', 10); reset(); };
// the school gate in the rain: Nanay with the umbrella; you, small and embarrassed; the classmates laughing
S.payong = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t); sky(t, { night: .3 }); g.fillStyle = '#8a8a7a'; g.fillRect(-400, 700, 1900, 600); g.fillStyle = '#3a3a3a'; g.fillRect(-400, 1300, 1900, 900);
  rr(100, 520, 880, 120, 10); fs('#2a5a3a', 4); text('PAARALANG ELEMENTARYA', 540, 580, 44, '#fff', 'Anton'); for (const x of [140, 940]) { g.fillStyle = '#6a6a5a'; g.fillRect(x - 30, 640, 60, 700); }
  nanay(330, 1900, 980, { t, arms: 'up', eyes: 'open', smile: 1, look: .5, lx: 1 }); g.save(); g.translate(330, 820); path([[-260, 120], [0, -50], [260, 120]]); g.closePath(); g.fillStyle = '#c8302a'; g.fill(); for (let k = -3; k <= 3; k++) line([[0, -50], [k * 86, 120]], 2, 'rgba(0,0,0,.25)'); line([[0, -50], [0, 300]], 6, '#222'); g.restore();
  person(690, 1900, 640, { t, ...KID, eyes: 'open', lookY: .8, tired: .3, mouth: 0, lx: -1 }); KIDS.slice(1, 3).forEach((hood, i) => person(880 + i * 130, 1880, 600, { t, hood, legs: JEANC, skin: YOU.skin, hair: HAIRC, eyes: 'shut', mouth: .5, smile: 1, lx: -1 }));
  lightPass('#7a7a80'); reset(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 180; i++) { const y = ((hash(i) * 2000 + t * 1600) % 2100) - 100, x = hash(i * 3.3) * 1100; line([[x, y], [x - 8, y + 50]], 2, 'rgba(200,220,255,.35)'); } reset(); };
// the last photo with the whole barkada; half of them fade, a little plane over each
S.barkada = (t, u) => { t_ = t; const half = ss(seg(t, wx('n5', 'kalahati') - .2, wx('n5', 'kalahati') + .8)); cam(CX, 900, lerp(1, 1.05, seg(u, 0, 7)), -.02, 0, t); grad('#3a2a22', '#1a120c', -400, 2300);
  rr(140, 700, 800, 860, 10); fs('#f6efe0', 4); rr(180, 740, 720, 640, 4); g.fillStyle = lg(0, 740, 0, 1380, ['#f0b878', '#a8604a']); g.fill();
  g.save(); g.beginPath(); g.rect(180, 740, 720, 640); g.clip(); [[260, 1], [380, 0], [500, 1], [620, 0], [740, 1], [840, 0]].forEach(([x, gone], i) => { g.save(); if (gone) g.globalAlpha = 1 - .65 * half; person(x, 1720, 800, { t, hood: KIDS[i % 4], legs: JEANC, skin: YOU.skin, hair: HAIRC, longHair: i % 2, eyes: 'open', smile: 1, mouth: .3, arms: i === 2 ? 'up' : 'down', lx: 1 }); g.restore();
    if (gone && half > .5) { g.save(); g.globalAlpha = half; g.translate(x, 860); path([[-30, 0], [30, 0], [0, -14]]); g.closePath(); g.fillStyle = '#fff'; g.fill(); line([[-14, -4], [-24, -24]], 4, '#fff'); line([[14, -4], [24, -24]], 4, '#fff'); g.restore(); } }); g.restore();
  g.save(); g.font = '600 50px Caveat'; g.fillStyle = '#3a2a2a'; g.textAlign = 'center'; g.fillText('barkada 4ever, 2017', 540, 1460); g.restore(); L(540, 1000, 1000, C.warm, .8, .1); lightPass(dim.room); };
// ordinary: a hug, a dinner, a text: "sige, bukas na lang"
S.ordinary = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.04, seg(u, 0, 10)), 0, 0, t); grad('#1e2232', '#0a0c14', -400, 2300);
  [[200, 'yakap'], [540, 'hapunan'], [880, 'bukas']].forEach(([x, w], i) => { const k = t >= T('r2') ? ss(seg(t, wx('r2', w) - .2, wx('r2', w) + .2)) : .3; g.save(); g.globalAlpha = .35 + .65 * k;
    rr(x - 150, 640, 300, 740, 20); g.fillStyle = ['#7a4a3a', '#8a6a46', '#2a3a5a'][i]; g.fill(); g.strokeStyle = 'rgba(255,201,77,.7)'; g.lineWidth = 4; g.stroke(); g.save(); g.beginPath(); g.rect(x - 150, 640, 300, 740); g.clip();
    if (i === 0) { nanay(x - 30, 1400, 560, { t, arms: 'out', eyes: 'shut', smile: 1, lx: 1 }); person(x + 40, 1420, 600, { t, ...YOU, back: 1, arms: 'out', lx: 1 }); }
    if (i === 1) { person(x, 1380, 560, { t, ...TATAY, eyes: 'open', smile: 1, mouth: .3, lx: 1 }); g.fillStyle = '#7a5232'; g.fillRect(x - 150, 1200, 300, 200); }
    if (i === 2) { rr(x - 110, 900, 220, 300, 24); fs('#0c0c10', 4); rr(x - 96, 930, 192, 120, 16); g.fillStyle = '#2c6a8a'; g.fill(); g.font = '500 26px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('Sige, bukas', x, 975); g.fillText('na lang', x, 1010); L(x, 1000, 300, C.cyan, .8, .2); }
    g.restore(); g.restore(); }); L(540, 1000, 1100, C.warm, .7, .05); lightPass('#5a5a68'); };
// the share, before the ending: the house at night, one window lit, you outside
S.cta = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)), 0, 0, t); sky(t, { night: 1 }); g.fillStyle = '#141a14'; g.fillRect(-400, 1300, 1900, 900); houseFront(t, 540, 1500, 120, 1);
  person(540, 2350, 1300, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(255,220,170,.4)' }); lightPass(dim.night); };
// the twist: by the door, Ate's suitcase and the balikbayan box; the ticket: MNL → DXB
S.suitcase = (t, u) => { t_ = t; const tk = ss(seg(t, wx('e1', 'dubai') - .4, wx('e1', 'dubai') + .3)); cam(CX, lerp(900, 980, ss(seg(u, 0, 7))), lerp(1, 1.1, ss(seg(u, 0, 7))), 0, 0, t); room(t, { wall: '#b8a07a' });
  rr(620, 420, 340, 980, 6); fs('#5a3a22', 4); circ(900, 920, 14, '#c8a050');
  rr(200, 1000, 320, 460, 26); fs('#2a4a6a', 4); line([[260, 1000], [260, 1460]], 4, '#c8a050'); line([[460, 1000], [460, 1460]], 4, '#c8a050'); rr(310, 950, 100, 60, 14); fs('#141414'); circ(240, 1470, 20, '#141414'); circ(480, 1470, 20, '#141414');
  rr(560, 1200, 320, 280, 4); fs('#c8985a', 3); g.fillStyle = '#e8d090'; g.fillRect(560, 1300, 320, 30); text('BALIKBAYAN', 720, 1410, 34, '#4a2a12', 'Anton');
  if (tk > 0) { g.save(); g.globalAlpha = tk; g.translate(360, 860 - 30 * (1 - tk)); g.rotate(-.08); rr(-200, -70, 400, 140, 10); fs('#f4ecd8', 3, '#c8a050'); text('MNL  →  DXB', 0, -18, 52, '#7a1e2e', 'Anton'); text('BUKAS, 6:40 AM', 0, 38, 30, '#4a3a2a', 'Anton'); g.restore(); }
  L(540, 400, 1300, C.warm, .8, .15); lightPass(dim.room); };
// Nanay notices: "why are you crying?"; "nothing, 'Nay. more rice, please"
S.cry = (t, u) => { t_ = t; const kanin = t > wx('e2', 'pahingi') - .1; cam(CX, lerp(900, 1000, ss(seg(u, 0, 6))), lerp(1, 1.12, ss(seg(u, 0, 6))), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut });
  nanay(280, 1780, 960, { t, eyes: 'open', tired: .3, mouth: t < wx('e2', 'wala') ? .25 + .2 * Math.abs(Math.sin(t * 8)) : 0, smile: t > wx('e2', 'wala') ? 1 : 0, look: .6, lx: 1 });
  person(790, 1820, 1000, { t, ...YOU, eyes: kanin ? 'shut' : 'open', smile: kanin ? 1 : 0, mouth: 0, tired: .5, look: -.5, arms: kanin ? 'offer' : 'down', lx: -1 }); const [hx, hy, r] = headOf(790, 1820, 1000); tears(hx, hy, r, t, 1);
  dinnerTable(1380); lightPass(dim.warm); };
// midnight: the clock at twelve, the food gone cold, nobody's left the table
S.midnight = (t, u) => { t_ = t; cam(CX, 900, lerp(1.05, 1.0, ss(seg(u, 0, 8))), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut, bulb: 1 });
  circ(240, 380, 90, '#f4f4f0'); circ(240, 380, 90, '#3a2a1a', 8); line([[240, 380], [240, 310]], 8, '#222'); line([[240, 380], [244, 320]], 5, '#222');
  [[150, TATAY, .5], [400, null, .3], [660, ATE, .5], [910, YOU, .45]].forEach(([x, who, m], i) => { if (!who) nanay(x, 1740, 820, { t: t + i, eyes: 'open', smile: 1, mouth: m * Math.abs(Math.sin(t * 9 + i)), look: .5, lx: 1 }); else person(x, 1760, 820, { t: t + i, ...who, eyes: i % 2 ? 'shut' : 'open', smile: 1, mouth: m * Math.abs(Math.sin(t * 10 + i)), look: i < 2 ? .5 : -.5, lx: i < 2 ? 1 : -1 }); });
  dinnerTable(1380, { cold: 1 }); lightPass(dim.warm); };
// put the phone down: your hand turning it face down on the table; the family soft behind
S.phone = (t, u) => { t_ = t; const p = ss(seg(t, wx('end', 'ibaba') - .1, wx('end', 'ibaba') + .6)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t); kitchen(t, { pot: 0, outside: nightOut });
  familyAtTable(t); reset(); g.filter = 'blur(7px)'; g.drawImage(cv, 0, 0); reset(); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t); dinnerTable(1300, { food: 0 });   // blur the room once, as a picture
  g.save(); g.translate(540, 1680); g.scale(1, lerp(1, .3, p)); phoneOnTable(0, 0, 1.6, 1 - p); g.restore(); hand(540 + 140, 1700, 90, Math.PI + .3, { sg: -1, skin: YOU.skin }); lightPass(dim.warm); };
S.endcard = (t, u) => { grad('#000', '#050508', 0, 1920); };

// ---------- overlays ----------
function bigCard(t, t0, top, bottom, col = YEL, glowc = 'rgba(255,170,80,1)') {
  const k = back(seg(t, t0, t0 + .3), 1.7); if (k <= 0) return; reset(); g.save(); g.translate(CX, 600); g.scale(k, k);
  glass(-440, -150, 880, 300, 44, 'rgba(255,255,255,.65)', 4, 'rgba(255,255,255,.45)');
  g.font = '86px Anton'; const s1 = Math.min(1, 800 / g.measureText(top).width); g.save(); g.translate(0, -44); g.scale(s1, s1); text(top, 0, 0, 86, '#fff', 'Anton'); g.restore();
  g.font = '70px Anton'; const s2 = Math.min(1, 800 / g.measureText(bottom).width); g.save(); g.translate(0, 62); g.scale(s2, s2); g.shadowColor = glowc; g.shadowBlur = 24; text(bottom, 0, 0, 70, col, 'Anton'); g.restore(); g.restore();
}
const W_COMMENT = wx('cta', 'icomment'), W_SHARE = wx('cta', 'ishare');
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .24; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  ZK = 1; S[sh[2]](t, u);
  bloom(); vignette(.55);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'hook') { title(t, 1 - ss(seg(t, W_VIB - .3, W_VIB))); notif(t, W_VIB, E('h1') + .6, NOTE.hook[1]); }
  const n = NOTE[sh[2]]; if (n && sh[2] !== 'hook') notif(t, T(n[0]) - .05, E(n[0]), n[1], n[2]);
  if (sh[2] === 'cta') { if (t < W_SHARE - .1) bigCard(t, W_COMMENT - .1, TX.share[0], TX.share[1]); else bigCard(t, W_SHARE - .1, TX.share2[0], TX.share2[1]); }
  if (sh[2] === 'endcard') { const k = ss(seg(u, .2, .9)); reset(); g.globalAlpha = k; text('BAKA', 540, 900, 90, '#ffd98a', 'Anton', 'center', 10); g.shadowColor = 'rgba(255,200,140,.9)'; g.shadowBlur = 30; text("ITO NA 'YON.", 540, 1040, 130, '#fff', 'Anton', 'center', 12); reset(); }
  else captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

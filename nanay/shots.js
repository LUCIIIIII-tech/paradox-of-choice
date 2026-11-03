
// ---------- the story: event times come from words in the script, so the picture follows the narrator ----------
function T(id) { return LN[id].t0; } function E(id) { return LN[id].t1; }
const wx = (id, w) => wordT(id, w);
const mixHex = (a, b, u) => { const p = h => h[0] === '#' ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).map(Number), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };   // nests
const flick = t => .86 + .09 * Math.sin(t * 13) + .05 * Math.sin(t * 31 + 1);
const YOU = { hood: ['#4a6a9a', '#34507a', '#1c2c48'], legs: ['#3a3e4a', '#26282f', '#121318'], skin: ['#c48a64', '#9a6444', '#5a3624'], hair: HAIRC };
const NANAY = { hood: ['#c87a8a', '#a05a6a', '#5a2a3a'], legs: ['#7a5a6a', '#5a4050', '#2e2028'], skin: ['#d0a080', '#a87656', '#62402a'], hair: ['#d8d4d0', '#a8a4a0', '#6a6662'], glasses: 1 };
const KID = { hood: ['#f2c430', '#c89a20', '#6a5010'], legs: JEANC, skin: ['#d0a080', '#a87656', '#62402a'], hair: HAIRC };
TL.lines.forEach(l => { if (l.id === 'fact') l.stat = ['PAG-ALIS MO SA BAHAY', '~90%', 'ng oras na makakasama mo sila, nagamit mo na']; });
// the days: which number hangs over Nanay in each scene (and in the counter up top)
const DAYS = { home: 7, kitchen: 7, cook: 6, album: 5, walk: 4, hele: 3, stay: 2, cta: 2, dinner: 1, hug: 1, empty: 0, letter: 0, knew: 0 };

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

// ---------- shots ----------
const S = {}, dim = { warm: '#a8886a', room: '#9a8070', night: '#1a2040', dusk: '#a8786a', cold: '#6a7484' };
// the hook: a busy street, a number over every head; the camera finds the smallest one
S.hook = (t, u) => { cam(lerp(540, 600, ss(seg(u, 0, 5))), 900, lerp(1, 1.12, ss(seg(u, 0, 5))), 0, 0, t); town(t);
  const P = [[130, 1820, 840, 26077, 'a'], [400, 1760, 760, 9034, 'b'], [680, 1800, 820, 412, 'd'], [950, 1840, 860, 18412, 'c']];
  P.forEach(([x, y, h, n, s], i) => { const hood = [['#c86a3a', '#984a24', '#4a2410'], ['#3a8a5a', '#246a3e', '#103a1e'], ['#d8c8a8', '#b0a080', '#5a5040'], ['#8a5a8a', '#6a3a6a', '#3a1a3a'], ['#4a6a9a', '#34507a', '#1c2c48']][i];
    person(x, y, h, { t, walk: t * 4 + i, hood, legs: JEANC, skin: YOU.skin, hair: i === 3 ? NANAY.hair : HAIRC, eyes: 'open', lx: 1 }); badge(x, y - h * 1.0, n, ss(seg(u, .2 + i * .15, .6 + i * .15)), .75); });
  lightPass(dim.dusk); };
// home: you in the kitchen doorway; Nanay at the stove, her back to you; on "pito" the 7 lights up over her
S.home = (t, u) => { const p = ss(seg(t, wx('h2', 'pito') - .15, wx('h2', 'pito') + .4)); cam(CX, 900, lerp(1.0, 1.1, ss(seg(u, 0, 4))), 0, 0, t);
  kitchen(t, { outside: (a, b, c, d) => sky(t, { dusk: .8, sun: [c - 80, d - 60], sr: 40 }) }); nanay(560, 1640, 900, { t, back: 1, arms: 'reach', lx: 1, rim: 'rgba(255,220,170,.6)' });
  person(200, 2300, 1400, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(255,220,170,.5)' }); rr(-40, 1900, 260, 260, 20); fs('#5a4a3a', 4);
  badge(560, 1640 - 900 * 1.05, 7, p, 1.4); lightPass(dim.warm); };
// Manila, late: you at the office desk, the laptop's glow, the city outside
S.office = (t, u) => { cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)), 0, 0, t);
  g.fillStyle = '#1e2232'; g.fillRect(-400, -400, 1900, 2600); g.save(); g.beginPath(); g.rect(100, 200, 880, 900); g.clip(); sky(t, { night: 1 }); town(t, { dusk: 1, jeep: 0 }); g.restore(); g.strokeStyle = '#0a0a12'; g.lineWidth = 24; g.strokeRect(100, 200, 880, 900); line([[540, 200], [540, 1100]], 14, '#0a0a12');
  person(540, 2150, 1400, { t, ...YOU, arms: 'lap', eyes: 'open', tired: .8, look: 0, lookY: .4, lx: 1, rim: 'rgba(140,200,255,.5)' });
  rr(-100, 1560, 1300, 600, 0); fs('#3a3028'); rr(330, 1380, 420, 200, 10); fs('#1a1a20', 4); rr(345, 1395, 390, 170, 6); g.fillStyle = '#9ad0ff'; g.fill(); L(540, 1480, 700, C.cyan, .9, .3);
  for (let k = 0; k < 5; k++) { rr(800 + k * 8, 1530 - k * 12, 220, 30, 4); fs('#efe8d8', 2); } lightPass('#3a3a4a'); };
// the chat: Nanay's messages, unanswered; "Seen"
const MSG = [['Anak, uuwi ka ba sa Pasko?', 0], ['Ingat ka palagi diyan ha.', 1], ['Kumain ka na ba, anak?', 2]];
S.chat = (t, u) => { cam(CX, 900, lerp(1, 1.05, seg(u, 0, 6)), 0, 0, t); grad('#14141c', '#08080c', 0, 1920);
  rr(170, 190, 740, 1520, 70); fs('#0a0a0e', 6); rr(196, 216, 688, 1468, 52); g.fillStyle = '#f2f2f6'; g.fill(); rr(196, 216, 688, 160, [52, 52, 0, 0]); g.fillStyle = '#e4e6ec'; g.fill(); circ(290, 296, 46, '#c87a8a'); text('N', 290, 298, 48, '#fff', 'Anton'); text('Nanay', 420, 296, 50, '#1a1a22', 'Anton', 'left');
  MSG.forEach(([m, i]) => { const y = 470 + i * 230, k = i < 2 ? 1 : back(seg(t, wx('s2', 'kumain') - .2, wx('s2', 'kumain') + .1), 2); if (k <= 0) return; g.save(); g.translate(240, y); g.scale(k, k); g.font = '500 38px sans-serif'; const w = g.measureText(m).width + 60;
    rr(0, 0, w, 100, 40); g.fillStyle = '#e4e6ec'; g.fill(); g.fillStyle = '#1a1a22'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(m, 30, 52); g.font = '500 24px sans-serif'; g.fillStyle = '#8a8c96'; g.fillText(['Dis 3', 'Ene 15', 'Ngayon, 6:42 AM'][i], 10, 132); g.restore(); });
  if (t > wx('s2', 'seen') - .1) { g.font = '500 30px sans-serif'; g.fillStyle = '#6a6c76'; g.textAlign = 'right'; g.fillText('Seen', 850, 1150); }
  L(540, 900, 1300, C.white, .9, .1); lightPass('#3a3a46'); };
// the bus home: the window seat, the fields running past
S.bus = (t, u) => { cam(CX, 900, lerp(1, 1.05, seg(u, 0, 6)), 0, .6, t); g.fillStyle = '#3a3a44'; g.fillRect(-400, -400, 1900, 2600);
  g.save(); rr(140, 260, 800, 760, 60); g.clip(); sky(t, { dusk: .3, sun: [800, 420], sr: 50 }); g.fillStyle = '#5a7a8a'; g.fillRect(140, 700, 800, 40); for (let k = 0; k < 12; k++) { const x = ((k * 160 - t * 300) % 1400 + 1400) % 1400 - 200; line([[x, 760], [x + 10, 640]], 12, '#2a3a2a'); circ(x + 10, 630, 40, '#3a5a3a'); }
  g.fillStyle = '#6a9a48'; g.fillRect(140, 760, 800, 260); for (let k = 0; k < 30; k++) { const x = ((k * 60 - t * 700) % 1000 + 1000) % 1000 + 100; line([[x, 1020], [x + 4, 800 + 50 * hash(k)]], 3, 'rgba(40,80,30,.5)'); } g.restore(); g.strokeStyle = '#1a1a20'; g.lineWidth = 30; rr(140, 260, 800, 760, 60); g.stroke();
  person(560, 2250, 1450, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(255,220,170,.5)' }); lightPass('#8a8070'); };
// day 7: Nanay turns from the stove, surprised; you in the doorway, a bag on your shoulder
S.kitchen = (t, u) => { const turn = ss(seg(t, T('d7') + .4, T('d7') + 1.2)), sm = t > wx('d7', 'na-miss') - .2; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t);
  kitchen(t, {}); if (turn < .5) nanay(380, 1700, 940, { t, back: 1, lx: 1 }); else nanay(380, 1700, 940, { t, eyes: 'wide', mouth: sm ? 0 : .3, smile: sm ? 1 : 0, look: .6, lx: 1, rim: 'rgba(255,220,170,.5)' });
  badge(380, 1700 - 940 * 1.05, 7, 1, 1.1); person(850, 2050, 1150, { t, ...YOU, eyes: 'open', smile: 1, look: -.6, lx: -1 }); lightPass(dim.warm); };
// day 6: sinigang lessons; too sour; she laughs and laughs
S.cook = (t, u) => { const laugh = t > wx('d6', 'tawa') - .2; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t); kitchen(t, {});
  for (let k = 0; k < 6; k++) { ell(380 + k * 16, 1095, 22, 10, k); g.fillStyle = '#3a8a3a'; g.fill(); } for (let k = 0; k < 3; k++) circ(440 + k * 20, 1092, 12, '#d8302a');
  nanay(300, 1760, 960, { t, eyes: laugh ? 'shut' : 'open', mouth: laugh ? .5 + .2 * Math.abs(Math.sin(t * 11)) : 0, smile: 1, look: .6, lx: 1 }); badge(300, 1760 - 960 * 1.05, 6, 1, 1.05);
  person(760, 1900, 1100, { t, ...YOU, eyes: t > wx('d6', 'maasim') ? 'shut' : 'open', mouth: t > wx('d6', 'maasim') ? .35 : 0, look: -.4, arms: 'reach', lx: -1 }); lightPass(dim.warm); };
// day 5: the old album on the sofa: every photo of you, even the grade-2 report card
S.album = (t, u) => { const rc = ss(seg(t, wx('d5', 'report') - .3, wx('d5', 'report') + .3)); cam(CX, lerp(900, 980, ss(seg(u, 0, 7))), lerp(1, 1.12, ss(seg(u, 0, 7))), 0, 0, t);
  room(t, { wall: '#c8b48a' }); rr(-60, 1300, 1200, 500, 60); fs('#7a4a3a'); nanay(330, 2000, 1150, { t, arms: 'lap', eyes: 'open', smile: 1, look: .3, lookY: .5, lx: 1 }); badge(330, 2000 - 1150 * 1.05, 5, 1);
  person(780, 2000, 1200, { t, ...YOU, arms: 'lap', eyes: 'open', smile: 1, look: -.3, lookY: .5, lx: -1 });
  rr(300, 1500, 480, 300, 10); fs('#5a2a1a', 4); rr(320, 1515, 210, 270, 4); fs('#f4ecd8'); rr(550, 1515, 210, 270, 4); fs('#f4ecd8');
  for (const [x, y] of [[340, 1535], [440, 1535], [340, 1650], [440, 1650]]) { rr(x, y, 80, 100, 3); fs('#c8a070'); circ(x + 40, y + 40, 18, '#d0a080'); }
  g.save(); g.globalAlpha = rc; rr(570, 1540, 170, 220, 4); fs('#fff', 2, '#8a8a8a'); text('GRADE 2', 655, 1570, 26, '#2a2a6a', 'Anton'); star(615, 1640, 22, '#f0c030'); star(695, 1640, 22, '#f0c030'); text('VERY GOOD!', 655, 1720, 22, '#c02020', 'Anton'); g.restore();
  L(540, 400, 1400, C.warm, .8, .1); lightPass(dim.room); };
// day 4: walking to the palengke at her pace; you only now notice how slow she's become
S.walk = (t, u) => { const v = .55; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 9)), 0, 0, t); sky(t, { sun: [880, 300], sr: 50 });
  for (let k = 0; k < 6; k++) { path([[k * 220 - 160, 560], [k * 220 + 60, 560], [k * 220 - 50, 680]]); g.closePath(); g.fillStyle = k % 2 ? '#d84a3a' : '#f0e0c0'; g.fill(); } g.fillStyle = '#8a7a6a'; g.fillRect(-400, 680, 1900, 600); g.fillStyle = lg(0, 1280, 0, 2100, ['#a89070', '#6a5a46']); g.fillRect(-400, 1280, 1900, 900);
  nanay(380, 1900, 920, { t, walk: t * 2.4, eyes: 'open', smile: 1, look: .5, lx: 1 }); badge(380, 1900 - 920 * 1.05, 4, 1); rr(240, 1660, 120, 140, 20); fs('#c8a050', 4);
  person(700, 1920, 1080, { t, walk: t * 2.4 + 1, ...YOU, eyes: 'open', look: -.6, tired: t > wx('d4', 'napansin') ? .4 : 0, lx: -1 }); lightPass(dim.warm); };
// day 3: brownout: the gasera, you lying with your head on her lap, the pamaypay going, her old lullaby
S.hele = (t, u) => { cam(CX, lerp(900, 960, ss(seg(u, 0, 8))), lerp(1, 1.12, ss(seg(u, 0, 8))), 0, 0, t); room(t, { wall: '#8a7a6a' });
  nanay(620, 1900, 1100, { t, sit: .8, arms: 'lap', eyes: t > wx('d3', 'kinanta') ? 'shut' : 'open', smile: 1, mouth: t > wx('d3', 'kinanta') ? .12 + .06 * Math.sin(t * 4) : 0, lookY: .7, look: -.4, lx: -1, rim: 'rgba(255,190,120,.7)' }); badge(620, 1900 - 1100 * .95, 3, 1);
  g.save(); g.translate(430, 1560); g.rotate(-Math.PI / 2 + .2); face(0, 0, 120, { t, ...YOU, eyes: 'shut', lx: -1, rim: 'rgba(255,190,120,.5)' }); g.restore(); rr(470, 1560, 520, 160, 70); fs('#4a6a9a');
  g.save(); g.translate(420, 1380); g.rotate(-.4 + .35 * Math.sin(t * 3)); path([[0, 0], [-120, -200], [120, -200]]); g.closePath(); g.fillStyle = '#d8b878'; g.fill(); for (let k = -4; k <= 4; k++) line([[0, 0], [k * 28, -200]], 2, 'rgba(90,60,20,.6)'); line([[0, 0], [0, 60]], 10, '#8a6a3a'); g.restore();
  const f = flick(t); rr(880, 1440, 60, 90, 12); fs('#4a5a44', 3); circ(910, 1410, 16 * f, '#ffd27a'); L(910, 1410, 900 * f, C.amb, .95, .4); if (t > wx('d3', 'kinanta')) notes(t, 660, 760, .9);
  lightPass('#2a2028'); };
// day 2: nothing; side by side on the bench outside, the sun going down; enough
S.stay = (t, u) => { cam(CX, 900, lerp(1, 1.08, seg(u, 0, 9)), 0, 0, t); sky(t, { dusk: .9, sun: [540, 980], sr: 110 }); g.fillStyle = '#3a4a2a'; g.fillRect(-400, 1100, 1900, 1000);
  for (const x of [80, 1000]) { line([[x, 1150], [x + 20, 700]], 14, '#1a1a10'); for (let k = 0; k < 7; k++) curve([x + 20, 700], [x + 20 + 90 * Math.cos(k), 660], [x + 20 + 150 * Math.cos(k * .9), 720], 6, '#1a2a10'); }
  bench(540, 1720, 700); nanay(400, 1900, 980, { t, back: 1, sit: .7, lx: 1, rim: 'rgba(255,170,110,.8)' }); person(680, 1900, 1080, { t, ...YOU, back: 1, sit: .7, lx: -1, rim: 'rgba(255,170,110,.8)' }); badge(400, 1900 - 980 * .95, 2, 1); lightPass(dim.dusk); };
// the share, before the last day: the house at night, one window lit
S.cta = (t, u) => { cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)), 0, 0, t); sky(t, { night: 1 }); g.fillStyle = '#141a14'; g.fillRect(-400, 1300, 1900, 900); houseFront(t, 540, 1500, 120, 1);
  person(540, 2350, 1300, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(255,220,170,.4)' }); lightPass(dim.night); };
// day 1: dinner; she holds your hand across the table: "the happiest week of my life"
S.dinner = (t, u) => { cam(CX, lerp(900, 1000, ss(seg(u, 0, 8))), lerp(1, 1.14, ss(seg(u, 0, 8))), 0, 0, t); kitchen(t, { pot: 0 });
  nanay(300, 1900, 1000, { t, eyes: 'open', smile: 1, mouth: t > wx('d1', 'anak') ? .1 + .08 * Math.abs(Math.sin(t * 7)) : 0, look: .6, lx: 1, rim: 'rgba(255,220,170,.5)' }); badge(300, 1900 - 1000 * 1.05, 1, 1);
  person(800, 1920, 1050, { t, ...YOU, eyes: 'open', tired: .3, look: -.6, lx: -1 }); rr(-60, 1450, 1200, 70, 10); fs('#7a5232'); g.fillStyle = '#5a3a22'; g.fillRect(-60, 1520, 1200, 600);
  for (const x of [300, 780]) { ell(x, 1460, 110, 26); fs('#f4f4f0', 3); ell(x, 1452, 60, 18); fs('#fff8e8'); }
  const hk = ss(seg(t, wx('d1', 'kamay') - .2, wx('d1', 'kamay') + .4)); hand(lerp(470, 560, hk), 1470, 46, 0, { sg: 1, skin: YOU.skin }); hand(lerp(420, 540, hk), 1455, 44, 0, { sg: 1, skin: NANAY.skin });
  if (t > wx('d1', 'pinakamasayang')) { const [hx, hy, r] = headOf(300, 1900, 1000); tears(hx, hy, r, t, .9); } lightPass(dim.warm); };
// the hug: long, longer than before
S.hug = (t, u) => { cam(CX, lerp(900, 860, ss(seg(u, 0, 5))), lerp(1.05, 1.15, ss(seg(u, 0, 5))), 0, 0, t); kitchen(t, { pot: 0 });
  nanay(600, 1950, 1000, { t, arms: 'out', eyes: 'shut', smile: 1, lx: 1, rim: 'rgba(255,220,170,.6)' }); badge(600, 1950 - 1000 * 1.05, 1, 1);
  person(470, 2150, 1200, { t, ...YOU, back: 1, arms: 'out', lx: 1, rim: 'rgba(255,220,170,.5)' }); lightPass(dim.warm); };
// day 0: the morning after: the kitchen grey and still; the pot cold; her chair empty
S.empty = (t, u) => { cam(CX, 900, lerp(1.06, 1.0, ss(seg(u, 0, 8))), 0, 0, t); kitchen(t, { cold: 1, wall: '#a8a8a0', outside: (a, b, c, d) => { grad('#c8d0d8', '#e8ecf0', b, d); } });
  rr(240, 1500, 220, 30, 6); fs('#6a5a4a'); g.fillStyle = '#5a4a3a'; for (const dx of [250, 440]) g.fillRect(dx, 1530, 14, 260); g.fillRect(250, 1260, 14, 260); g.fillRect(440, 1260, 14, 260); g.fillRect(250, 1260, 204, 20);
  L(800, 540, 1000, C.white, .6, .05); lightPass(dim.cold); reset(); g.fillStyle = 'rgba(120,130,150,.25)'; g.globalCompositeOperation = 'saturation'; g.fillRect(0, 0, W, H); reset(); };
// the letter, in her hand, line by line
const LETTER = ['Anak,', 'salamat sa linggong ito.', 'Nakita ko kung paano', 'mo ako tingnan.', 'Hindi ako natakot,', 'kasi nandito ka.', 'Mahal kita.', '— Nanay'];
S.letter = (t, u) => { cam(CX, 900, lerp(1, 1.08, ss(seg(u, 0, 10))), -.03, 0, t); grad('#8a8a86', '#5a5a58', -400, 2300);
  rr(150, 380, 780, 1020, 8); fs('#f6f0dc', 4, '#a8a08a'); const n = 1 + Math.floor(seg(t, wx('letter', 'anak') - .1, E('letter')) * LETTER.length);
  g.save(); g.font = '600 64px Caveat'; g.fillStyle = '#2a2a5a'; g.textBaseline = 'middle'; LETTER.slice(0, n).forEach((s, i) => { g.textAlign = i === LETTER.length - 1 ? 'right' : 'left'; g.fillText(s, i === LETTER.length - 1 ? 860 : 210, 480 + i * 110); }); g.restore();
  if (n >= LETTER.length) heart(800, 1310, 40, '#d84a5a'); L(540, 600, 1200, C.white, .8, .08); lightPass('#8a8a90'); };
// she knew: you, the letter against your chest, crying
S.knew = (t, u) => { cam(CX, lerp(880, 820, ss(seg(u, 0, 6))), lerp(1.05, 1.2, ss(seg(u, 0, 6))), 0, 0, t); room(t, { wall: '#9a9a96' });
  person(540, 2300, 1550, { t, ...YOU, eyes: 'shut', tired: .7, mouth: .12, arms: 'rub', lx: 1, rim: 'rgba(200,210,230,.5)' }); const [hx, hy, r] = headOf(540, 2300, 1550); tears(hx, hy, r, t, 1);
  rr(400, 1550, 280, 200, 6); fs('#f6f0dc', 3); lightPass(dim.cold); };
// after: nights on the sofa with the album; her shape beside you, faint, humming
S.after = (t, u) => { const gh = ss(seg(t, wx('after', 'katabi') - .6, wx('after', 'katabi') + .6)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 9)), 0, 0, t); room(t, { wall: '#5a5a6a', win: [620, 300, 980, 760], outside: () => sky(t, { night: 1 }) });
  rr(-60, 1300, 1200, 500, 60); fs('#4a3a4a'); person(700, 2000, 1200, { t, ...YOU, arms: 'lap', eyes: 'open', lookY: .5, look: -.2, mouth: .08, lx: -1 }); notes(t, 760, 760, .7);
  if (gh > 0) { g.save(); g.globalAlpha = .35 * gh; nanay(320, 2000, 1150, { t, arms: 'lap', eyes: 'shut', smile: 1, lx: 1 }); g.restore(); glow(320, 1300, 500, '200,220,255', .25 * gh); }
  rr(480, 1500, 380, 240, 10); fs('#5a2a1a', 4); L(540, 1500, 700, C.warm, .7, .15); lightPass('#3a3a50'); };
// the arithmetic of time: a hundred dots; ninety of them already used
S.fact = (t, u) => { cam(CX, 900, 1 + .04 * seg(u, 0, 10), 0, 0, t); grad('#1a1820', '#0a0a10', -400, 2300); const used = Math.floor(90 * ss(seg(t, T('fact') + .5, wx('fact', 'nagamit') + .3)));
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) { const i = r * 10 + c, x = 270 + c * 60, y = 640 + r * 60; circ(x, y, 22, i < used ? 'rgba(120,120,130,.5)' : '#ffd890'); if (i >= used) L(x, y, 50, C.warm, .5, .2); }
  text('BUONG BUHAY MO KASAMA SILA', 540, 560, 40, '#d8d0c0', 'Anton'); text(`${used}% NAGAMIT NA`, 540, 1300, 70, used > 80 ? '#ff8a6a' : '#fff', 'Anton', 'center', 10); lightPass('#40404c'); };
// the street again: a number over everyone you love; then they go out
S.street = (t, u) => { cam(lerp(540, 520, seg(u, 0, 6)), 900, lerp(1.04, 1.0, seg(u, 0, 6)), 0, 0, t); town(t);
  const P = [[150, 1800, 820], [380, 1760, 760], [700, 1820, 860], [940, 1780, 780]], off = ss(seg(t, wx('truth', 'hindi') - .1, wx('truth', 'hindi') + .6));
  P.forEach(([x, y, h], i) => { person(x, y, h, { t, walk: t * 4 + i, hood: [['#c86a3a', '#984a24', '#4a2410'], ['#3a8a5a', '#246a3e', '#103a1e'], ['#d8c8a8', '#b0a080', '#5a5040'], ['#8a5a8a', '#6a3a6a', '#3a1a3a']][i], legs: JEANC, skin: YOU.skin, hair: i === 2 ? NANAY.hair : HAIRC, eyes: 'open', lx: 1 }); badge(x, y - h * 1.0, [3120, 845, 61, 12004][i], 1 - off, .7); });
  lightPass(dim.dusk); };
// years later: you, grey now, singing her lullaby to your child on the bench
S.coda = (t, u) => { cam(CX, 900, lerp(1, 1.08, seg(u, 0, 9)), 0, 0, t); sky(t, { dusk: .5, sun: [860, 900], sr: 80 }); g.fillStyle = '#4a5a3a'; g.fillRect(-400, 1150, 1900, 1000); houseFront(t, 300, 1260, 60, 1);
  bench(560, 1720, 700); person(450, 1900, 1100, { t, ...YOU, hair: ['#c8c4c0', '#9a9692', '#5a5652'], sit: .7, eyes: 'shut', smile: 1, mouth: .1 + .06 * Math.sin(t * 4), look: .4, lx: 1, rim: 'rgba(255,200,140,.6)' });
  person(720, 1900, 640, { t, ...KID, sit: .6, eyes: t > wx('coda', 'pagmamahal') ? 'shut' : 'open', smile: 1, look: -.5, lx: -1 }); notes(t, 520, 760, .9); lightPass(dim.dusk); };
// the call: your phone: "Nanay — calling..."
S.call = (t, u) => { const call = ss(seg(t, wx('end', 'tawagan') - .2, wx('end', 'tawagan') + .4)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 6)), 0, 0, t); grad('#1a1a24', '#0a0a10', 0, 1920);
  rr(240, 260, 600, 1240, 70); fs('#0a0a0e', 6); rr(262, 284, 556, 1192, 52); g.fillStyle = lg(0, 284, 0, 1476, ['#2a3a5a', '#141c2e']); g.fill();
  circ(540, 600, 110, '#c87a8a'); text('N', 540, 604, 110, '#fff', 'Anton'); text('Nanay', 540, 780, 80, '#fff', 'Anton'); g.font = '500 40px sans-serif'; g.fillStyle = '#a8c0e0'; g.textAlign = 'center'; g.fillText(call > .5 ? 'calling...' : '', 540, 850);
  const pul = call * (1 + .1 * Math.sin(t * 6)); circ(540, 1300, 70 * Math.max(.6, pul), call > .5 ? '#30c060' : '#3a3a4a'); text('☎', 540, 1300, 70, '#fff', 'serif');
  if (call > .5) for (let k = 0; k < 3; k++) { const p = ((t * .8) + k / 3) % 1; circ(540, 1300, 70 + 120 * p, `rgba(48,192,96,${.5 * (1 - p)})`, 4); }
  hand(560, 1560, 140, -Math.PI / 2, { sg: 1, grip: .4, skin: YOU.skin }); L(540, 800, 1100, C.cyan, .8, .15); lightPass('#30303e'); };
S.endcard = (t, u) => { grad('#000', '#050508', 0, 1920); };

// ---------- overlays: the countdown up top, the comment/share cards, the end card ----------
function hud(t, n, k) { if (k <= 0 || n === undefined) return; reset(); g.globalAlpha = k; text(TX.hud, CX, 150, 34, 'rgba(255,240,215,.85)', 'Anton', 'center', 6);
  g.shadowColor = n ? 'rgba(255,210,140,.9)' : 'rgba(160,170,190,.8)'; g.shadowBlur = 30; text(String(n), CX, 245, 120, n ? '#fff2d6' : '#b8bcc8', 'Anton', 'center', 10); reset(); }
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
  if (sh[2] === 'hook') title(t, 1);
  if (sh[2] !== 'home') hud(t, DAYS[sh[2]], ss(seg(u, .1, .5))); else hud(t, 7, ss(seg(t, wx('h2', 'pito') + .3, wx('h2', 'pito') + .8)));
  statCard(t);
  if (sh[2] === 'cta') { if (t < W_SHARE - .1) bigCard(t, W_COMMENT - .1, TX.share[0], TX.share[1]); else bigCard(t, W_SHARE - .1, TX.share2[0], TX.share2[1]); }
  if (sh[2] === 'endcard') { const k = ss(seg(u, .2, .9)); reset(); g.globalAlpha = k; text('TAWAGAN MO', 540, 860, 120, '#fff', 'Anton', 'center', 12); g.shadowColor = 'rgba(255,200,140,.9)'; g.shadowBlur = 30; text('SI NANAY.', 540, 1010, 140, '#ffd890', 'Anton', 'center', 12); reset(); }
  else captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

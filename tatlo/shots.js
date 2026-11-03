
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


// ---------- the map: the real outline of the Philippines (Natural Earth 1:10m, public domain), each island tagged Luzon / Visayas / Mindanao ----------
const PH = await (await fetch('ph.json')).json();
const LON0 = 116.85, LAT0 = 21.15, PXD = 99, pj = (lon, lat) => [60 + (lon - LON0) * PXD, 180 + (LAT0 - lat) * PXD];   // the same projection ph.json was made with
const RCOL = { L: ['#3a7ad0', '#24508e'], V: ['#2aa070', '#1a6a4a'], M: ['#d0603a', '#8e3a22'] }, OFF = { L: [-55, -75], V: [0, 0], M: [55, 85] };
const CITIES = [['Baguio', 120.6, 16.41], ['Maynila', 120.98, 14.6], ['Legazpi', 123.74, 13.14], ['Puerto Princesa', 118.74, 9.74], ['Iloilo', 122.56, 10.72], ['Cebu', 123.89, 10.32], ['Tacloban', 125.0, 11.24],
  ['Cagayan de Oro', 124.65, 8.48], ['Zamboanga', 122.08, 6.92], ['Davao', 125.61, 7.07]];
const RANGES = [[120.75, 121.25, 16.0, 18.4, 'L'], [121.6, 122.2, 15.2, 18.0, 'L'], [124.4, 125.4, 7.2, 8.6, 'M'], [122.1, 122.4, 10.6, 11.6, 'V'], [122.9, 123.2, 9.6, 10.6, 'V'], [125.8, 126.2, 7.0, 8.8, 'M']];
function sea(t) { grad('#12436a', '#061a30', -200, 2100);
  for (let lat = 6; lat <= 20; lat += 2) { const [, y] = pj(120, lat); line([[-200, y], [1300, y]], 1.5, 'rgba(180,220,255,.12)'); text(`${lat}°N`, 1040, y - 12, 18, 'rgba(200,230,255,.45)', 'Anton', 'right'); }
  for (let lon = 118; lon <= 126; lon += 2) { const [x] = pj(lon, 10); line([[x, -200], [x, 2100]], 1.5, 'rgba(180,220,255,.12)'); text(`${lon}°E`, x + 6, 1880, 18, 'rgba(200,230,255,.45)', 'Anton', 'left'); }
  for (let i = 0; i < 26; i++) { const y = 120 + i * 70, x = ((t * 16 + i * 131) % 1400) - 160; line([[x, y], [x + 70, y]], 2, 'rgba(170,215,255,.12)'); }
  g.save(); g.translate(150, 1690); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); path([[0, -70], [12, 0], [0, 12], [-12, 0]]); g.closePath(); g.fillStyle = k === 3 ? '#f4ecd0' : 'rgba(244,236,208,.55)'; g.fill(); } circ(0, 0, 80, 'rgba(244,236,208,.4)', 2); text('N', 0, -98, 26, '#f4ecd0', 'Anton'); g.restore(); }
function poly(p) { g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); }   // adds to the current path (path() starts a new one)
const ISLES = [['MINDORO', 121.0, 12.95, 'L'], ['PALAWAN', 118.3, 10.75, 'L'], ['BICOL', 123.25, 13.75, 'L'], ['SAMAR', 125.0, 11.95, 'V'], ['LEYTE', 124.8, 10.95, 'V'], ['BOHOL', 124.2, 9.95, 'V'], ['NEGROS', 122.95, 9.85, 'V'], ['PANAY', 122.35, 11.3, 'V'], ['SULU', 121.0, 5.75, 'M'], ['BUKIDNON', 125.0, 7.95, 'M']];
function islandsOf(r) { return PH.filter(o => o.r === r); }
function phMap(t, split, o = {}) {   // split 0 = one country, 1 = three countries pushed apart with borders on the sea
  const s = ss(split);
  for (const r of ['L', 'V', 'M']) { const [dx, dy] = OFF[r], isl = islandsOf(r), col = s > .5 ? RCOL[r] : ['#6aa860', '#3e7a3a']; g.save(); g.translate(dx * s, dy * s);
    for (const w of [34, 18]) { g.beginPath(); for (const i of isl) { poly(i.p); } g.strokeStyle = `rgba(130,215,230,${w > 20 ? .12 : .22})`; g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); }
    g.beginPath(); for (const i of isl) { poly(i.p); } g.fillStyle = lg(0, 150, 0, 1850, [mixHex(col[0], '#ffffff', .15), col[0], col[1]]); g.fill();
    g.save(); g.beginPath(); for (const i of isl) { poly(i.p); } g.clip();
    for (let k = 0; k < 900; k++) { const x = hash(k * 3.1 + r.charCodeAt(0)) * 1080, y = 150 + hash(k * 7.7 + r.charCodeAt(0)) * 1750; g.fillStyle = `rgba(${hash(k) > .5 ? '255,255,230' : '0,20,0'},.09)`; g.fillRect(x, y, 6, 6); }
    for (const [a, b, c, d, rr_] of RANGES) { if (rr_ !== r) continue; for (let k = 0; k < 26; k++) { const [x, y] = pj(a + (b - a) * hash(k * 1.7 + a), c + (d - c) * hash(k * 2.9 + c)), h = 9 + 6 * hash(k); path([[x - h, y + h * .6], [x, y - h], [x + h, y + h * .6]]); g.strokeStyle = 'rgba(30,20,10,.45)'; g.lineWidth = 2; g.stroke(); line([[x, y - h], [x + h * .5, y - h * .1]], 2, 'rgba(255,255,240,.35)'); } }
    g.restore();
    g.beginPath(); for (const i of isl) { poly(i.p); } g.strokeStyle = '#f4ecd0'; g.lineWidth = 2.2; g.stroke();
    if (o.cities !== 0) { g.font = 'italic 600 21px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,240,.55)'; for (const [nm, lon, lat, rg] of ISLES) { if (rg !== r) continue; const [x, y] = pj(lon, lat); g.fillText(nm.split('').join(' '), x, y); } }
    if (o.cities !== 0) for (const [nm, lon, lat] of CITIES) { const reg = lat >= 12.45 || lon < 120 ? 'L' : (lat < 9.15 ? 'M' : 'V'); if (reg !== r) continue; const [x, y] = pj(lon, lat); circ(x, y, 7, '#fff'); circ(x, y, 7, '#1a1a1a', 2); text(nm.toUpperCase(), x + (lon > 124.5 ? -14 : 14), y - 2, 20, '#fff', 'Anton', lon > 124.5 ? 'right' : 'left', 5, 1, 'rgba(0,0,0,.7)'); }
    g.restore(); }
  if (s > .1) { g.save(); g.globalAlpha = s; g.setLineDash([24, 16]); line([[40, 1080], [1040, 1040]], 6, '#ff4a4a'); line([[40, 1460], [1040, 1300]], 6, '#ff4a4a'); g.setLineDash([]); g.restore(); }
  if (o.labels) { const k = o.labels; g.save(); g.globalAlpha = k; text('REPUBLIKA NG LUZON', 460, 140, 44, '#fff', 'Anton', 'center', 8); text('REPUBLIKA NG VISAYAS', 780, 1000, 36, '#fff', 'Anton', 'center', 8); text('REPUBLIKA NG MINDANAO', 600, 1840, 44, '#fff', 'Anton', 'center', 8); g.restore(); }
}
function flag(x, y, w, kind, t, k = 1) { if (k <= 0) return; const h = w * .6; g.save(); g.globalAlpha *= k; g.translate(x, y); line([[0, 0], [0, h * 2.4]], 6, '#ddd');
  const wav = i => Math.sin(i * .5 - t * 4) * h * .05; for (let i = 0; i < 20; i++) { const u = i / 20, xx = u * w, c = kind === 'L' ? (u < .5 ? '#2a5ab8' : '#f4f0e0') : kind === 'V' ? '#1e8a5a' : '#c03a2a'; g.fillStyle = c; g.fillRect(xx, wav(i), w / 20 + 1, h); if (kind === 'V') { g.fillStyle = '#f4f0e0'; g.fillRect(xx, h * .45 + wav(i), w / 20 + 1, h * .12); } if (kind === 'M') { g.fillStyle = '#f2c430'; g.fillRect(xx, h * .8 + wav(i), w / 20 + 1, h * .2); } }
  if (kind === 'L') { circ(w * .25, h * .5, h * .18, '#f2c430'); } if (kind === 'V') star(w * .5, h * .28, h * .14, '#f2c430'); if (kind === 'M') { circ(w * .5, h * .4, h * .2, '#f4f0e0'); circ(w * .56, h * .36, h * .17, '#c03a2a'); } g.restore(); }
function passport(x, y, s, stamp = 0, label = 'PASAPORTE') { g.save(); g.translate(x, y); g.scale(s, s); rr(-90, -125, 180, 250, 10); fs('#7a1e2e', 3, '#3a0a14'); text(label, 0, -70, 26, '#e8c870', 'Anton'); circ(0, 10, 36, '#e8c870', 4); star(0, 10, 18, '#e8c870'); text('LUZON', 0, 90, 24, '#e8c870', 'Anton');
  if (stamp > 0) { g.globalAlpha = stamp; g.rotate(-.25); rr(-110, -40, 220, 80, 10); g.strokeStyle = '#d02a2a'; g.lineWidth = 8; g.stroke(); text(stamp > 1 ? 'VISA DENIED' : 'ENTRY', 0, 2, 40, '#d02a2a', 'Anton'); } g.restore(); }
function bigPhone(x, y, s, fill) { g.save(); g.translate(x, y); g.scale(s, s); rr(-260, -520, 520, 1040, 60); fs('#0a0a0e', 6); rr(-236, -490, 472, 980, 44); g.fillStyle = '#1a2230'; g.fill(); g.save(); rr(-236, -490, 472, 980, 44); g.clip(); fill(); g.restore(); g.restore(); }
function parol(x, y, s, t) { g.save(); g.translate(x, y); g.rotate(.05 * Math.sin(t)); star(0, 0, 90 * s, '#ff5a4a'); star(0, 0, 60 * s, '#ffd060'); for (let k = 0; k < 3; k++) line([[-30 * s + k * 30 * s, 80 * s], [-30 * s + k * 30 * s, 200 * s]], 6, '#ffd060'); g.restore(); L(x, y, 500 * s, C.warm, .9, .4); }

// ---------- shots ----------
const S = {}, dim = { warm: '#a8886a', room: '#9a8070', night: '#1a2040', dusk: '#a8786a', day: '#d8c0a0' };
const W_PASS = wx('h1', 'passport'), nightOut = (a, b, c, d) => sky(t_, { night: 1 });
// the hook: the map of the Philippines cracks into three and drifts apart; red borders on the sea; on "passport" a passport slams down
S.hook = (t, u) => { t_ = t; const sp = ss(seg(t, wx('h1', 'tatlong') - .2, wx('h1', 'tatlong') + 1.0)); cam(CX, 920, lerp(1.0, 1.05, ss(seg(u, 0, 6))), 0, sp > 0 && sp < 1 ? 3 : 0, t); sea(t); phMap(t, sp);
  if (sp > 0 && sp < 1) for (let k = 0; k < 6; k++) { const a = k; line([[540, 930 + 250 * (k > 2)], [540 + 300 * Math.cos(a), 930 + 250 * (k > 2) + 60 * Math.sin(a)]], 3, `rgba(255,240,200,${1 - sp})`); }
  const ps = back(seg(t, W_PASS - .1, W_PASS + .25), 2.2); if (ps > 0) passport(560, 1100, 2.4 * ps, ss(seg(t, W_PASS + .3, W_PASS + .5)));
  };
// three republics, three flags, three presidents
S.map = (t, u) => { t_ = t; const f = id => ss(seg(t, wx('h2', id) - .2, wx('h2', id) + .3)); cam(CX, 920, 1.0, 0, 0, t); sea(t); phMap(t, 1, { labels: 1 });
  flag(560, 300, 150, 'L', t, f('luzon')); flag(545, 1050, 150, 'V', t, f('visayas')); flag(590, 1490, 150, 'M', t, f('mindanao')); };
// the airport: three queues; you in the one for foreigners, to go home to your own province
S.airport = (t, u) => { t_ = t; cam(lerp(560, 760, ss(seg(t, wx('s1', 'pumila') - .3, wx('s1', 'pumila') + 1))), 900, lerp(1, 1.1, seg(u, 0, 8)), 0, 0, t);
  g.fillStyle = lg(0, 0, 0, 1400, ['#d8dce0', '#a8b0b8']); g.fillRect(-400, -400, 1900, 1800); g.fillStyle = '#7a8088'; g.fillRect(-400, 1400, 1900, 900);
  [[180, 'LUZON CITIZENS', '#3a7ad0'], [540, 'VISAYAS CITIZENS', '#2aa070'], [900, 'DAYUHAN / FOREIGNERS', '#c03a2a']].forEach(([x, s, c]) => { rr(x - 170, 520, 340, 110, 10); fs(c, 4, '#1a1a1a'); text(s, x, 575, s.length > 16 ? 30 : 38, '#fff', 'Anton'); line([[x - 150, 1500], [x - 150, 1900]], 6, '#c8a050'); line([[x + 150, 1500], [x + 150, 1900]], 6, '#c8a050'); });
  for (const [x, i] of [[180, 0], [540, 1]]) person(x, 1880, 860, { t, hood: KIDS[i], legs: JEANC, skin: YOU.skin, hair: HAIRC, back: 1, lx: 1 });
  person(900, 1900, 960, { t, ...YOU, eyes: 'open', tired: .4, look: -.5, lx: -1, rim: 'rgba(255,255,255,.4)' }); rr(980, 1640, 120, 200, 14); fs('#2a4a6a', 3);
  L(540, 400, 1500, C.fluo, .9, .15); lightPass('#a0a8b0'); };
// the teleserye with subtitles now
S.tv = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)), 0, 0, t); room(t, { wall: '#c8b48a' }); rr(120, 520, 840, 560, 16); fs('#0a0a0c', 8);
  g.save(); g.beginPath(); g.rect(140, 540, 800, 520); g.clip(); grad('#5a3a5a', '#2a1a2a', 540, 1060); person(380, 1300, 760, { t, ...ATE, eyes: 'open', tired: .4, look: .6, mouth: .2 * Math.abs(Math.sin(t * 7)), lx: 1 }); person(700, 1320, 800, { t, ...YOU, eyes: 'open', look: -.6, lx: -1 });
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(140, 960, 800, 90); g.font = '600 40px sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(t > wx('s2', 'subtitle') - .4 ? '"Gihigugma tika." (Mahal kita.)' : '"Gihigugma tika."', 540, 1008); g.restore(); L(540, 800, 900, C.cyan, .9, .25);
  person(540, 2350, 1300, { t, ...YOU, back: 1, lx: 1, rim: 'rgba(140,200,255,.5)' }); lightPass(dim.room); };
// the money changer: three currencies; lechon in the window
S.money = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t); g.fillStyle = '#2a2a34'; g.fillRect(-400, -400, 1900, 2600);
  rr(100, 360, 880, 600, 14); fs('#1a1a1e', 6, '#c8a050'); text('MONEY CHANGER', 540, 420, 50, '#ffc94d', 'Anton');
  [['1 PISO NG LUZON', '0.83 PISO NG VISAYAS'], ['1 PISO NG LUZON', '0.91 PISO NG MINDANAO'], ['1 PISO NG VISAYAS', '1.10 PISO NG MINDANAO']].forEach(([a, b], i) => { const y = 520 + i * 140; text(a, 300, y, 34, '#9ad0ff', 'Anton'); text('=', 540, y, 40, '#fff', 'Anton'); text(b, 790, y, 34, '#9ad0ff', 'Anton'); });
  rr(80, 1050, 920, 360, 14); fs('#c8a070', 4); text('LECHON CEBU', 540, 1100, 44, '#7a2a12', 'Anton'); ell(540, 1260, 260, 90); fs('#b8602a', 4, '#6a2a0a'); circ(330, 1250, 50, '#a0501a'); for (let k = 0; k < 6; k++) line([[400 + k * 50, 1200], [420 + k * 50, 1320]], 4, 'rgba(255,220,160,.5)');
  person(540, 2300, 1300, { t, ...YOU, back: 1, arms: 'offer', lx: 1, rim: 'rgba(255,220,160,.4)' }); L(540, 600, 900, C.cyan, .8, .15); L(540, 1250, 600, C.warm, .8, .2); lightPass('#5a5060'); };
// Lola on a video call: "INTERNATIONAL CALL", the meter running
S.call = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.05, seg(u, 0, 7)), 0, 0, t); grad('#1a1a22', '#0a0a10', 0, 1920);
  bigPhone(540, 920, 1.25, () => { grad('#5a4a3a', '#2a2018', 430, 1410); person(0, 700, 1000, { t, ...LOLA, eyes: 'open', smile: 1, mouth: .25 * Math.abs(Math.sin(t * 7)), look: 0, lx: 1 }); bun(0, 700, 1000, LOLA.hair[1]); });
  rr(330, 340, 420, 70, 20); fs('rgba(200,30,40,.9)'); text('INTERNATIONAL CALL', 540, 375, 34, '#fff', 'Anton'); const mins = Math.floor(seg(t, T('f1'), E('f1') + 1) * 8); text(`PHP ${(mins * 12.5).toFixed(2)}`, 540, 470, 60, '#ffc94d', 'Anton', 'center', 8);
  L(540, 900, 1100, C.warm, .9, .15); lightPass('#404050'); };
// the cousin in Davao: the passport, VISA DENIED, the parol in the window
S.cousin = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 7)), 0, 0, t); room(t, { wall: '#b8a07a', win: [600, 320, 980, 760], outside: nightOut }); parol(790, 540, .8, t);
  person(400, 2000, 1150, { t, ...YOU, hood: ['#3ab86a', '#2a8a4a', '#144a26'], eyes: 'open', tired: .7, lookY: .6, arms: 'offer', lx: -1 }); const st = t > wx('f2', 'visa') - .2 ? 2 : 0; passport(720, 1350, 1.5, st ? ss(seg(t, wx('f2', 'visa') - .2, wx('f2', 'visa'))) * 2 : 0);
  text('DAVAO', 200, 400, 50, '#fff', 'Anton', 'center', 8); lightPass(dim.room); };
// basketball: Luzon vs Visayas; you in the stands, not knowing who to cheer for
S.ball = (t, u) => { t_ = t; cam(lerp(540, 520, seg(u, 0, 8)), 900, lerp(1, 1.06, seg(u, 0, 8)), 0, 0, t); grad('#1a1a28', '#0a0a14', -400, 1100);
  rr(330, 170, 420, 170, 12); fs('#0a0a0c', 5, '#3a3a44'); text('LUZON  78', 540, 225, 46, '#5aa0ff', 'Anton'); text('VISAYAS  78', 540, 290, 46, '#5aff9a', 'Anton');
  for (let r = 0; r < 6; r++) { const y = 470 + r * 72; g.fillStyle = r % 2 ? '#24242e' : '#2c2c38'; g.fillRect(-400, y + 20, 1900, 72);
    for (let k = 0; k < 22; k++) { const x = -60 + k * 56 + (r % 2) * 28, side = x < 540, hop = Math.max(0, Math.sin(t * 7 + k * 1.3 + r)) * 8;
      g.fillStyle = side ? ['#3a7ad0', '#2a5aa8'][k % 2] : ['#2aa070', '#1e8058'][k % 2]; rr(x - 20, y + 30 - hop, 40, 50, 10); g.fill(); circ(x, y + 18 - hop, 15, ['#d5a385', '#93634e', '#f3d3b6'][(k + r) % 3]); circ(x, y + 10 - hop, 15, '#14111c'); circ(x, y + 22 - hop, 13, ['#d5a385', '#93634e', '#f3d3b6'][(k + r) % 3]);
      if (hash(k * 9 + r) > .8) line([[x + 16, y + 34 - hop], [x + 26, y - 8 - hop]], 7, side ? '#3a7ad0' : '#2aa070'); } }
  rr(40, 405, 300, 70, 8); fs('#3a7ad0', 3, '#fff'); text('GO LUZON!', 190, 440, 38, '#fff', 'Anton'); rr(740, 405, 300, 70, 8); fs('#2aa070', 3, '#fff'); text('GO VISAYAS!', 890, 440, 38, '#fff', 'Anton');
  g.fillStyle = lg(0, 900, 0, 1500, ['#d8a468', '#b07a44']); g.fillRect(-400, 900, 1900, 600); for (let k = 0; k < 14; k++) line([[-400 + k * 140, 900], [-400 + k * 140 - 60, 1500]], 2, 'rgba(90,50,20,.25)');
  line([[540, 900], [540, 1500]], 5, '#fff'); circ(540, 1180, 120, '#fff', 5); circ(540, 1180, 40, '#fff', 4);
  const P = [[200, 1240, 'L', 0], [390, 1330, 'L', 1], [300, 1120, 'L', 2], [700, 1150, 'V', 3], [860, 1300, 'V', 4], [980, 1180, 'V', 5]];
  for (const [x, y, side, i] of P.sort((p, q) => p[1] - q[1])) { const c = side === 'L' ? ['#3a7ad0', '#2a5aa8', '#163060'] : ['#2aa070', '#1e8058', '#0e402c']; person(x + 30 * Math.sin(t * 1.3 + i), y, 300, { t, walk: t * 7 + i, hood: c, legs: c, skin: SKIN, hair: HAIRC, eyes: 'open', lx: side === 'L' ? 1 : -1 }); }
  const bx = 540 + 220 * Math.sin(t * 1.6), by = 1180 - 160 * Math.abs(Math.sin(t * 5)); ell(bx, 1200, 30, 8); g.fillStyle = 'rgba(0,0,0,.25)'; g.fill(); circ(bx, by, 26, '#e8702a'); circ(bx, by, 26, '#5a2a0a', 3); line([[bx - 26, by], [bx + 26, by]], 2, '#5a2a0a');
  person(540, 2300, 1300, { t, ...YOU, eyes: 'open', look: Math.sin(t * 1.5) * .8, tired: .3, mouth: 0, lx: 1, rim: 'rgba(255,255,255,.4)' }); L(540, 300, 1500, C.white, .9, .1); L(540, 1100, 900, C.warm, .8, .15); lightPass('#606070'); };
// a year later: the pasalubong shelf, empty where the dried mangoes and the durian were
S.pasalubong = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.06, seg(u, 0, 9)), 0, 0, t); g.fillStyle = '#d8ccb0'; g.fillRect(-400, -400, 1900, 2600); text('PASALUBONG CENTER', 540, 380, 56, '#7a2a12', 'Anton');
  for (let r = 0; r < 3; r++) { const y = 640 + r * 260; g.fillStyle = '#6a4a2a'; g.fillRect(80, y, 920, 20); if (r === 1) { for (let k = 0; k < 7; k++) { rr(110 + k * 125, y - 140, 100, 140, 6); g.fillStyle = ['#e8402a', '#f2c430', '#2a7ad8'][k % 3]; g.fill(); } } }
  rr(130, 400 + 120, 380, 100, 8); fs('#fff', 3); text('DRIED MANGOES', 320, 545, 30, '#c8302a', 'Anton'); text('WALA', 320, 590, 34, '#c8302a', 'Anton');
  rr(570, 400 + 120 + 520, 380, 100, 8); fs('#fff', 3); text('DURIAN', 760, 1065, 30, '#c8302a', 'Anton'); text('WALA', 760, 1110, 34, '#c8302a', 'Anton');
  person(540, 2250, 1250, { t, ...YOU, eyes: 'open', tired: .5, look: .3, arms: 'offer', lx: 1 }); rr(780, 1600, 160, 180, 10); fs('rgba(240,240,235,.8)', 3); L(540, 300, 1500, C.warm, .8, .1); lightPass(dim.day); };
// the comment and share, before the ending: the map at night, three lights apart
S.cta = (t, u) => { t_ = t; cam(CX, 920, 1.0, 0, 0, t); sea(t); phMap(t, 1); };
// Lola, sick, on the call: "apo, come home"; the visa calendar: three weeks
S.sick = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.08, seg(u, 0, 8)), 0, 0, t); grad('#141420', '#06060a', 0, 1920);
  bigPhone(540, 860, 1.2, () => { grad('#3a3440', '#1a1620', 430, 1410); g.fillStyle = '#e8e4f0'; g.fillRect(-300, 200, 600, 400); person(0, 760, 900, { t, ...LOLA, eyes: t > wx('e1', 'apo') ? 'open' : 'shut', tired: .9, mouth: t > wx('e1', 'apo') && t < wx('e1', 'pero') ? .2 * Math.abs(Math.sin(t * 5)) : 0, look: 0, lx: 1 }); bun(0, 760, 900, LOLA.hair[1]); g.fillStyle = '#c8b8e0'; g.fillRect(-300, 330, 600, 300); });
  if (t > wx('e1', 'pero') - .2) { rr(250, 1500, 580, 150, 14); fs('#f4f0e6', 4, '#c02020'); text('VISA: 3 LINGGO PA', 540, 1575, 54, '#c02020', 'Anton'); }
  L(540, 860, 1000, C.cyan, .8, .15); lightPass('#303040'); };
// the sea at dusk: you on the shore, the lights of the other island across the water
S.sea = (t, u) => { t_ = t; cam(CX, 900, lerp(1, 1.08, seg(u, 0, 9)), 0, 0, t); sky(t, { dusk: .9, sun: [700, 960], sr: 90 }); g.fillStyle = '#2a4a6a'; g.fillRect(-400, 1000, 1900, 500);
  for (let i = 0; i < 12; i++) line([[i * 100 - 40 + 20 * Math.sin(t + i), 1040 + i * 30], [i * 100 + 60, 1040 + i * 30]], 3, 'rgba(255,200,150,.3)'); g.fillStyle = '#3a3a2a'; g.fillRect(-400, 980, 1900, 24);
  for (let k = 0; k < 14; k++) { const x = 80 + k * 70; circ(x, 990, 4, '#ffd890'); L(x, 990, 40, C.warm, .8, .3); } g.fillStyle = '#c8b08a'; g.fillRect(-400, 1500, 1900, 800);
  person(540, 2150, 1150, { t, ...YOU, back: 1, sit: .7, lx: 1, rim: 'rgba(255,170,110,.7)' }); lightPass(dim.dusk); };
// 7,641 islands: the three pieces drift back together into one
S.islands = (t, u) => { t_ = t; const j = ss(seg(t, T('e3'), wx('e3', 'isang') + .5)); cam(CX, 920, lerp(1.05, 1.0, j), 0, 0, t); sea(t); phMap(t, 1 - j);
  g.save(); g.globalAlpha = ss(seg(t, T('e3') + .2, T('e3') + .8)); text('7,641', 540, 1720, 130, '#fff', 'Anton', 'center', 12); text('NA ISLA. ISANG BANSA.', 540, 1820, 48, '#ffc94d', 'Anton', 'center', 8); g.restore();
  };
// home for Christmas: the parol, Lola at the door, arms open
S.home = (t, u) => { t_ = t; const hug = ss(seg(t, wx('end', 'umuwi') - .2, wx('end', 'umuwi') + .6)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 6)), 0, 0, t); sky(t, { night: 1 }); g.fillStyle = '#1e2418'; g.fillRect(-400, 1300, 1900, 900);
  houseFront(t, 540, 1500, 130, 1); parol(260, 760, .9, t); parol(830, 760, .9, t + 1);
  person(lerp(420, 470, hug), 1950, 940, { t, ...LOLA, arms: 'out', eyes: hug > .5 ? 'shut' : 'open', smile: 1, lx: 1, rim: 'rgba(255,220,170,.6)' }); bun(lerp(420, 470, hug), 1950, 940, LOLA.hair[1]);
  person(lerp(820, 640, hug), 2050, 1050, { t, ...YOU, back: 1, walk: hug < 1 ? t * 5 : null, arms: hug > .5 ? 'out' : 'down', lx: 1, rim: 'rgba(255,220,170,.5)' }); lightPass(dim.night); };
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
  bloom(); vignette(.5);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'hook') title(t, 1 - ss(seg(t, W_PASS - .3, W_PASS)));
  if (sh[2] === 'cta') { if (t < W_SHARE - .1) bigCard(t, W_COMMENT - .1, TX.share[0], TX.share[1]); else bigCard(t, W_SHARE - .1, TX.share2[0], TX.share2[1]); }
  if (sh[2] === 'endcard') { const k = ss(seg(u, .2, .9)); reset(); g.globalAlpha = k; text('UMUWI KA.', 540, 900, 130, '#fff', 'Anton', 'center', 12); g.shadowColor = 'rgba(255,200,140,.9)'; g.shadowBlur = 30; text('HABANG ISANG BANSA PA TAYO.', 540, 1040, 64, '#ffd98a', 'Anton', 'center', 10); reset(); }
  else captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

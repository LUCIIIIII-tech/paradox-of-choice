
// ---------- the story: event times come from words in the script, so the picture follows the narrator ----------
function T(id) { return LN[id].t0; } function E(id) { return LN[id].t1; }
const W_NAMATAY = wordT('h1', 'namatay'), W_IKAW = wordT('h1', 'ikaw'), W_TUNOG = wordT('s1', 'tumunog'), W_BOSES = wordT('s1', 'isang'), W_WALA = wordT('s1', 'wala'),
  W_KAMAY = wordT('s2', 'kamay'), W_PIRMA = wordT('s3', 'pirma'), W_D1 = wordT('d1', 'wala'), W_D2 = wordT('d2', 'wala'), W_ABOT = wordT('d3', 'abot'), W_HANAP = wordT('d4', 'hahanapin'),
  W_SHARE = wordT('cta', 'ishare'), W_SOBRE = wordT('d5', 'sobre'), W_HUWAG = wordT('d5', 'huwag'), W_DATING = wordT('d5b', 'dating'), W_NAGISING = wordT('d5b', 'nagising'), W_HUWAG2 = wordT('end', 'huwag');
const mixHex = (a, b, u) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
const flick = t => .86 + .09 * Math.sin(t * 13) + .05 * Math.sin(t * 31 + 1);       // a candle flame breathing
const YOU = { skin: ['#c48a64', '#9a6444', '#5a3624'], hair: HAIRC };
const SUITY = { ...YOU, hood: ['#3e4866', '#252c44', '#10131e'], legs: ['#3e4866', '#252c44', '#10131e'], outfit: 'shirt' };     // you, from the oath on: a dark navy suit
const TEE = { ...YOU, hood: ['#8a8a96', '#5a5a66', '#2a2a34'], legs: JEANC };                                                  // you, at 4 a.m.: a grey sleep shirt
const ring = (t, t0) => t > t0 && ((t - t0) % 1.6) < 1.0 ? 1 : 0;                                                              // the phone's ring pattern (score.py rings on the same beat)

// ---------- the flag: drawn once, waved in slices ----------
TEX.flag = paint(mk(600, 300), (w, h) => {
  g.fillStyle = '#0038a8'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#ce1126'; g.fillRect(0, h / 2, w, h / 2);
  path([[0, 0], [260, 150], [0, 300]]); g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  const sx = 87, sy = 150; for (let k = 0; k < 8; k++) { g.save(); g.translate(sx, sy); g.rotate(k / 8 * TAU); for (const d of [-.17, 0, .17]) { g.save(); g.rotate(d); path([[30, -3], [58, 0], [30, 3]]); g.closePath(); g.fillStyle = '#fcd116'; g.fill(); g.restore(); } g.restore(); }
  circ(sx, sy, 26, '#fcd116'); for (const [x, y] of [[24, 34], [24, 266], [222, 150]]) star(x, y, 15, '#fcd116');
});
function phFlag(x, y, w, h, t, amp = 1) {
  const N = 40, F = TEX.flag;
  for (let i = 0; i < N; i++) { const u = i / N, ph = u * 6 - t * 4, dy = Math.sin(ph) * h * .07 * u * amp, sh = Math.cos(ph) * u * amp;
    g.drawImage(F, u * F.width, 0, F.width / N + 1, F.height, x + u * w, y + dy, w / N + 1.5, h);
    g.fillStyle = sh > 0 ? `rgba(255,255,255,${.12 * sh})` : `rgba(0,0,10,${-.35 * sh})`; g.fillRect(x + u * w, y + dy, w / N + 1.5, h); }
}

// ---------- pieces ----------
function rain(t, a = .3, n = 240, slant = .16) {      // drawn after the light pass, in screen space
  reset(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) { const sp = 1700 + 900 * hash(i), y = ((hash(i * 2.3) * 2300 + t * sp) % 2300) - 200, x = ((hash(i * 5.1) * 1400 + y * slant) % 1400) - 160, len = 34 + 56 * hash(i + 3);
    line([[x, y], [x + len * slant, y + len]], 1.4 + 1.6 * hash(i), `rgba(190,205,255,${a * (.35 + .65 * hash(i + 7))})`); }
  reset();
}
function flashOver(a, c = '210,220,255') { if (a <= 0) return; reset(); g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(${c},${a})`; g.fillRect(0, 0, W, H); reset(); }
function sil(x, y, h, col = '#05060a', rim = null) {   // a person in silhouette, head and shoulders down to y
  const P = () => { g.beginPath(); g.moveTo(x - h * .2, y); g.lineTo(x - h * .19, y - h * .6); g.quadraticCurveTo(x - h * .18, y - h * .74, x - h * .06, y - h * .76); g.lineTo(x + h * .06, y - h * .76); g.quadraticCurveTo(x + h * .18, y - h * .74, x + h * .19, y - h * .6); g.lineTo(x + h * .2, y); g.closePath();
    g.moveTo(x + h * .085, y - h * .87); g.ellipse(x, y - h * .87, h * .085, h * .1, 0, 0, TAU); };
  if (rim) { g.save(); g.translate(0, -3); P(); g.fillStyle = rim; g.fill(); g.restore(); }
  P(); g.fillStyle = col; g.fill();
}
function candle(x, y, s, t, i = 0, lit = 1) {          // a white candle; (x, y) = its base
  rr(x - s * .12, y - s, s * .24, s, s * .04); g.fillStyle = '#efe8da'; g.fill();
  if (lit <= 0) return;
  const fh = s * .34 * flick(t + i * 1.7) * lit; g.beginPath(); g.moveTo(x, y - s - fh); g.quadraticCurveTo(x + s * .11, y - s - fh * .35, x, y - s + s * .02); g.quadraticCurveTo(x - s * .11, y - s - fh * .35, x, y - s - fh); g.fillStyle = '#ffd986'; g.fill();
  L(x, y - s - fh * .4, s * 3.4 * lit, C.amb, .85 * lit, .3 * lit);
}
function vigil(t, rows) {                               // mourners with candles, back row first: [y, h, n, gap at the centre]
  rows.forEach(([y, h, n, gap], r) => { for (let i = 0; i < n; i++) { const x = (i + .5 + (hash(r * 9 + i) - .5) * .5) * (W + 200) / n - 100; if (gap && Math.abs(x - CX) < gap) continue;
    const yy = y + (hash(i * 3 + r) - .5) * h * .08, hh = h * (.9 + .2 * hash(i + r * 5)); sil(x, yy, hh, '#06060c', 'rgba(255,190,120,.35)'); candle(x + hh * .12, yy - hh * .42, hh * .14, t, i + r * 13); } });
}
function palm(x, y, h, t, k = 0, col = '#03050b') {    // a royal palm in silhouette
  const sw = Math.sin(t * .6 + k) * h * .012, tx = x + h * .1 + sw, ty = y - h;
  g.beginPath(); g.moveTo(x - h * .028, y); g.quadraticCurveTo(x + h * .015, y - h * .55, tx - h * .013, ty); g.lineTo(tx + h * .013, ty); g.quadraticCurveTo(x + h * .06, y - h * .55, x + h * .028, y); g.closePath(); g.fillStyle = col; g.fill();
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .4 + Math.sin(t * .9 + i + k) * .05, Lf = h * (.3 + .08 * hash(i + k)), ex = tx + Math.cos(a) * Lf, ey = ty + Math.sin(a) * Lf * .5 + Lf * .45 * Math.abs(Math.cos(a)), cx = tx + Math.cos(a) * Lf * .55, cy = ty + Math.sin(a) * Lf * .55 - Lf * .12;
    curve([tx, ty], [cx, cy], [ex, ey], h * .008, col);
    for (let j = 1; j < 13; j++) { const u = j / 13, px = (1 - u) * (1 - u) * tx + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * ty + 2 * (1 - u) * u * cy + u * u * ey; for (const sg of [-1, 1]) line([[px, py], [px + sg * h * .018 * (1 - u * .4), py + h * .055 * (1 - u * .5)]], h * .005, col); } }
}
function storm(t, fl = 0) {
  grad(mixHex('#04050c', '#4a5070', fl), mixHex('#161a2c', '#6a7090', fl), -600, 1400);
  for (let i = 0; i < 9; i++) { const x = ((hash(i * 3.3) * 1600 + t * 9 * (1 + hash(i))) % 1800) - 360, y = 80 + hash(i * 7.7) * 600, r = 260 + 200 * hash(i);
    g.save(); g.translate(x, y); g.scale(1.8, .6); g.fillStyle = rg(0, 0, 0, r, ['rgba(6,7,14,.6)', 'rgba(6,7,14,0)']); g.fillRect(-r, -r, 2 * r, 2 * r); g.restore(); }
}
// the palace: a white colonial facade, two rows of arched windows, a columned portico draped in black, the doorway lit
function palace(cx, by, s, t) {
  const w = 960 * s, h = 430 * s, x0 = cx - w / 2, top = by - h, pw = w * .3, px0 = cx - pw / 2, ptop = top - 60 * s;
  g.fillStyle = '#e8e0cc'; g.fillRect(x0, top - 70 * s, w, 10 * s); for (let x = x0; x < x0 + w; x += 22 * s) g.fillRect(x, top - 62 * s, 10 * s, 32 * s);
  g.fillStyle = '#2a2a34'; g.fillRect(x0 - 20 * s, top - 30 * s, w + 40 * s, 34 * s);
  g.fillStyle = lg(0, top, 0, by, ['#efe8d8', '#cfc6b2', '#9a9080']); g.fillRect(x0, top, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0, top + h * .48, w, 10 * s);
  for (let row = 0; row < 2; row++) for (let c = 0; c < 12; c++) { const wx = x0 + (c + .5) * w / 12; if (Math.abs(wx - cx) < pw * .55) continue;
    const wy = top + h * (row ? .6 : .13), ww = 34 * s, wh = 110 * s, lit = hash(c * 7 + row) > .35; rr(wx - ww / 2, wy, ww, wh, [ww / 2, ww / 2, 2, 2]); g.fillStyle = lit ? '#ffd08a' : '#2a2230'; g.fill(); g.strokeStyle = '#8a8070'; g.lineWidth = 4 * s; g.stroke();
    if (lit) L(wx, wy + wh / 2, 120 * s, C.warm, .8, .14); }
  g.fillStyle = lg(0, ptop, 0, by, ['#f6f0e2', '#d8d0bc', '#a49a88']); g.fillRect(px0, ptop, pw, by - ptop);
  path([[px0 - 14 * s, ptop], [cx, ptop - 120 * s], [px0 + pw + 14 * s, ptop]]); g.closePath(); fs('#e8e0cc', 4 * s, '#6a6258');
  rr(cx - 45 * s, by - 210 * s, 90 * s, 210 * s, [45 * s, 45 * s, 0, 0]); g.fillStyle = '#ffcf8a'; g.fill(); L(cx, by - 100 * s, 320 * s, C.warm, .95, .25);
  for (let k = 0; k < 6; k++) { const x = px0 + (k + .5) * pw / 6; g.fillStyle = lg(x - 11 * s, 0, x + 11 * s, 0, ['#fffaf0', '#d8d0bc', '#8a8274']); g.fillRect(x - 11 * s, ptop + 20 * s, 22 * s, by - ptop - 30 * s); }
  for (let k = 0; k < 3; k++) { const a = px0 + k * pw / 3, b = a + pw / 3; curve([a, ptop + 24 * s], [(a + b) / 2, ptop + 90 * s], [b, ptop + 24 * s], 22 * s, '#0a0a10'); circ(a, ptop + 26 * s, 16 * s, '#2a1838'); }
  for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(200,192,176,${1 - k * .15})`; g.fillRect(px0 - k * 20 * s, by + k * 14 * s, pw + k * 40 * s, 14 * s); }
  L(cx, top + h * .5, w * .75, null, .22);
}
function blanket(t) { rr(-100, 1560, 1300, 520, 70); fs(lg(0, 1560, 0, 2080, ['#3a4a6a', '#1c2438']), 6); for (let k = 0; k < 6; k++) curve([60 + k * 190, 1580], [30 + k * 190 + 20 * Math.sin(t + k), 1760], [70 + k * 190, 1960], 8, 'rgba(10,14,30,.45)'); }
// the bedroom at 4 a.m.: the window (convoy strobes outside), the headboard, the nightstand with the red clock
function bedroom(t, o = {}) {
  const st = o.strobe || 0, sr = st * Math.max(0, Math.sin(t * 7.5)) ** 6, sb = st * Math.max(0, Math.sin(t * 7.5 + Math.PI)) ** 6;
  grad('#2a2a3a', '#16161f', 0, 1900);
  const a = 620, b = 230, c = 1010, d = 960;
  g.save(); g.beginPath(); g.rect(a, b, c - a, d - b); g.clip(); grad('#0a0c1a', '#1a1c34', b, d); g.drawImage(TEX.city, 0, 300, 1200, 600, a, d - 330, c - a, 330);
  g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,40,60,${.55 * sr})`; g.fillRect(a, b, c - a, d - b); g.fillStyle = `rgba(50,100,255,${.55 * sb})`; g.fillRect(a, b, c - a, d - b); g.restore();
  g.strokeStyle = '#121218'; g.lineWidth = 22; g.strokeRect(a, b, c - a, d - b); line([[(a + c) / 2, b], [(a + c) / 2, d]], 10, '#121218');
  for (const [x0, x1] of [[590, 700], [930, 1040]]) { g.fillStyle = 'rgba(210,210,230,.22)'; g.fillRect(x0, 200, x1 - x0, 820); for (let k = 0; k < 5; k++) line([[x0 + 12 + k * 22, 200], [x0 + 8 + k * 22, 1020]], 3, 'rgba(0,0,10,.25)'); }
  L(815, 600, 760, C.red, .9 * sr, .4 * sr); L(815, 600, 760, C.blue, .9 * sb, .4 * sb); L(815, 600, 900, C.moon, .45, .05);
  rr(120, 1020, 860, 330, 40); fs(lg(0, 1020, 0, 1350, ['#5a463a', '#3a2a22']), 6); rr(220, 1210, 420, 150, 70); fs('#d8d4cc', 4);
  g.fillStyle = '#3a2a20'; g.fillRect(-20, 1260, 260, 400); g.fillStyle = '#4a362a'; g.fillRect(-20, 1250, 270, 22); line([[10, 1420], [230, 1420]], 4, '#1a120c'); circ(120, 1350, 8, '#c8a060');
  rr(20, 1170, 130, 78, 10); fs('#0a0a0e', 3); text('4:00', 85, 1210, 54, '#ff3a3a', 'Anton'); L(85, 1210, 170, C.red, .9, .35);
  if (o.phone) { const rp = o.ring || 0, bz = rp * Math.sin(t * 80) * 3; rr(172 + bz, 1136, 62, 112, 12); fs('#0c0c10', 3); rr(177 + bz, 1144, 52, 94, 8); g.fillStyle = rp ? '#bfe8ff' : '#1a1e2a'; g.fill(); L(204, 1190, 300, C.cyan, .9 * rp + .2, .45 * rp); }
}
// the phone on its stand, close: PRIVATE NUMBER
function phoneClose(t, on, rp) {
  grad('#1a1a24', '#0a0a10', 0, 1300); g.fillStyle = lg(0, 1300, 0, 1920, ['#3a2a20', '#1a120c']); g.fillRect(-400, 1300, 1900, 900);
  rr(60, 1130, 330, 170, 16); fs('#0a0a0e', 4); text('4:00', 225, 1215, 120, '#ff3a3a', 'Anton'); L(225, 1215, 360, C.red, .95, .45); text('AM', 225, 1282, 26, '#a02030', 'Anton');
  const bz = rp * Math.sin(t * 80) * 5, x = 430 + bz;
  rr(560, 1250, 160, 70, 10); fs('#15151a', 4);
  rr(x, 420, 420, 840, 56); fs('#08080c', 6); rr(x + 18, 446, 384, 788, 40);
  if (!on) { g.fillStyle = '#0e1018'; g.fill(); return; }
  g.fillStyle = lg(0, 446, 0, 1234, ['#1d3a5a', '#0a1424']); g.fill();
  text('PRIVATE NUMBER', x + 210, 610, 46, '#ffffff', 'Anton'); g.font = '500 28px sans-serif'; g.fillStyle = '#a8c8e8'; g.textAlign = 'center'; g.fillText('incoming call...', x + 210, 664);
  circ(x + 210, 840, 92, '#3a5068'); text('?', x + 210, 846, 110, '#c8d8e8', 'Anton');
  circ(x + 110, 1130, 54, '#e03040'); circ(x + 310, 1130, 54 * (1 + .08 * rp * Math.sin(t * 12)), '#30c060');
  L(x + 210, 840, 1000, C.cyan, .95, .4);
  if (rp) for (let k = 0; k < 3; k++) { const p = ((t * 1.3) + k / 3) % 1; rr(x - 30 * p * 3, 420 - 30 * p * 3, 420 + 180 * p, 840 + 180 * p, 56 + 40 * p); g.strokeStyle = `rgba(150,220,255,${.5 * (1 - p)})`; g.lineWidth = 4; g.stroke(); }
}
// the oath hall: dark wood panels, the flag hung on the wall, chandeliers, a red carpet
function hall(t) {
  g.fillStyle = lg(0, 0, 0, 1900, ['#3a2416', '#24160c']); g.fillRect(-400, -400, 1900, 2600);
  for (let x = -60; x < 1200; x += 180) { rr(x + 14, 120, 152, 1100, 6); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 6; g.stroke(); }
  g.fillStyle = '#1a0e08'; g.fillRect(-400, 1230, 1900, 30);
  phFlag(250, 300, 580, 290, t * .3, .25); line([[240, 296], [840, 296]], 8, '#c8a050');
  for (const [x, y] of [[150, 120], [930, 120]]) { line([[x, -200], [x, y]], 4, '#2a1a10'); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; circ(x + Math.cos(a) * 60, y + 30 + Math.sin(a) * 18, 7, '#ffe8b0'); } L(x, y + 30, 700, C.warm, .9, .28); }
  g.fillStyle = lg(0, 1260, 0, 1920, ['#6a1a20', '#3a0a10']); g.fillRect(-400, 1260, 1900, 900);
}
const PRESS = [[90, 2060, 520], [300, 2110, 560], [560, 2140, 520], [790, 2100, 560], [1000, 2060, 520]];
function press() { for (const [x, y, h] of PRESS) { sil(x, y, h, '#07060a', 'rgba(255,200,150,.3)'); rr(x - 46, y - h * .98, 92, 60, 8); fs('#141418', 3); circ(x, y - h * .98 + 30, 20, '#2a3040'); circ(x - 6, y - h * .98 + 24, 6, 'rgba(200,220,255,.5)'); } }
function flashes(t, t0) {                               // camera flashes: one slot every 0.2 s, about half of them fire (score.py clicks on the same slots)
  if (t < t0) return; const n = Math.floor(t * 5), p = t * 5 - n; if (hash(n * 1.37) < .5) return;
  const [x, y, h] = PRESS[Math.floor(hash(n * 7.1) * PRESS.length)], a = Math.exp(-p * 6); reset(); glow(x, y - h * .98, 560, '255,255,255', .9 * a); flashOver(.13 * a, '255,255,255');
}
// the desk, from above: dark wood, a green leather pad
function desk() {
  g.fillStyle = lg(0, 0, 1080, 1920, ['#4a2c1a', '#2a180e']); g.fillRect(-400, -400, 1900, 2700);
  for (let i = 0; i < 40; i++) { const y = -300 + i * 60 + 20 * hash(i); curve([-400, y], [540, y + 30 * Math.sin(i)], [1500, y + 10], 2 + 2 * hash(i), `rgba(${hash(i + 2) > .5 ? '255,210,170' : '20,8,2'},.08)`); }
  rr(110, 360, 860, 1140, 22); fs('#1e2a22', 6, '#0e1410'); rr(130, 380, 820, 1100, 16); g.strokeStyle = 'rgba(200,180,120,.25)'; g.setLineDash([10, 8]); g.lineWidth = 3; g.stroke(); g.setLineDash([]);
}
function lamp(x, y) { ell(x, y + 30, 90, 24); fs('#1a1a14', 3); line([[x, y + 20], [x, y - 120]], 12, '#c8a050'); g.beginPath(); g.moveTo(x - 130, y - 110); g.quadraticCurveTo(x, y - 210, x + 130, y - 110); g.closePath(); fs('#1e5a3a', 4); L(x, y - 90, 900, C.warm, .95, .3); }
// your office at night: a window behind you with the city in the rain, the flag on its pole
function office(t) {
  g.fillStyle = lg(0, 0, 0, 1900, ['#1e2030', '#12121c']); g.fillRect(-400, -400, 1900, 2600);
  const a = 250, b = 230, c = 830, d = 1150; g.save(); g.beginPath(); g.rect(a, b, c - a, d - b); g.clip(); grad('#0a0c1a', '#22243a', b, d); g.drawImage(TEX.city, 600, 200, 1300, 700, a - 60, b + 300, c - a + 120, d - b - 280);
  for (let i = 0; i < 40; i++) { const x = a + hash(i * 3.3) * (c - a), y = b + ((hash(i * 1.7) * (d - b) + t * 60 * (1 + hash(i))) % (d - b)); line([[x, y], [x + 2, y + 30 + 30 * hash(i)]], 2, 'rgba(200,215,255,.35)'); } g.restore();
  g.strokeStyle = '#0a0a10'; g.lineWidth = 26; g.strokeRect(a, b, c - a, d - b); line([[(a + c) / 2, b], [(a + c) / 2, d]], 12, '#0a0a10'); L(540, 700, 700, C.moon, .5, .08);
  line([[110, 1500], [110, 300]], 12, '#c8a050'); circ(110, 292, 14, '#e8c870'); phFlag(116, 320, 170, 360, t * .2, .2);
}
function sack(x, y, s) { rr(x - 90 * s, y - 170 * s, 180 * s, 170 * s, 30 * s); fs('#e8e4d8', 4 * s); g.fillStyle = '#2a4a8a'; g.fillRect(x - 60 * s, y - 120 * s, 120 * s, 50 * s); text('RICE', x, y - 95 * s, 34 * s, '#e8e4d8', 'Anton'); ell(x, y - 170 * s, 60 * s, 18 * s); fs('#d8d4c8', 3 * s); }
// the street in the flood: shop fronts, the tangle of wires, the sodium street light
function street() {
  [[-60, 360, 300, '#4a4250'], [240, 470, 280, '#3a4a52'], [520, 410, 300, '#52443a'], [820, 440, 320, '#3e3a4c']].forEach(([x, top, w, col], i) => {
    g.fillStyle = col; g.fillRect(x, top, w, 1500 - top); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, top, 6, 1500 - top);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { const wx = x + 40 + c * (w - 170), wy = top + 60 + r * 230, lit = hash(i * 7 + r * 3 + c) > .4; rr(wx, wy, 90, 130, 6); g.fillStyle = lit ? '#ffcf8a' : '#1a1a22'; g.fill(); if (lit) L(wx + 45, wy + 65, 170, C.warm, .8, .15); line([[wx, wy + 65], [wx + 90, wy + 65]], 3, '#2a2016'); }
    g.fillStyle = '#2a2a30'; g.fillRect(x + 20, 1180, w - 40, 320); for (let k = 0; k < 13; k++) line([[x + 20, 1190 + k * 24], [x + w - 20, 1190 + k * 24]], 2, 'rgba(255,255,255,.08)'); });
  for (const px of [60, 1000]) { g.fillStyle = '#16161c'; g.fillRect(px - 12, 200, 24, 1400); g.fillRect(px - 70, 260, 140, 12); }
  for (let k = 0; k < 7; k++) curve([60, 270 + k * 14], [530, 360 + k * 22 + 20 * Math.sin(k)], [1000, 268 + k * 16], 2.5, '#08080c');
  line([[900, 1500], [900, 430], [800, 400]], 14, '#1e1e24'); rr(740, 390, 90, 26, 10); fs('#2a2a30'); ell(785, 418, 34, 10); g.fillStyle = '#ffd08a'; g.fill(); L(785, 440, 1200, C.amb, .95, .35);
}
// EDSA: a little projection (eye 1.5 m up), the cars, the lane dashes, the MRT viaduct, the green EDSA sign
const F_ = 800, HC = 1.5, HZ = 920, pj = (X, Y, Z) => [540 + X * F_ / Z, HZ + (HC - Y) * F_ / Z];
let GL = [];
function car(X, Z, o = {}) {
  const s = F_ / Z, [x, y] = pj(X, 0, Z), w = 1.8 * s, h = 1.45 * s, front = o.front, br = o.brake ?? 1;
  cshadow(x, y, w * .6, w * .08, .6);
  g.beginPath(); g.moveTo(x - w * .5, y - h * .12); g.lineTo(x - w * .5, y - h * .55); g.quadraticCurveTo(x - w * .48, y - h * .62, x - w * .36, y - h * .64); g.lineTo(x - w * .28, y - h); g.lineTo(x + w * .28, y - h); g.lineTo(x + w * .36, y - h * .64); g.quadraticCurveTo(x + w * .48, y - h * .62, x + w * .5, y - h * .55); g.lineTo(x + w * .5, y - h * .12); g.closePath(); g.fillStyle = o.col || '#15161e'; g.fill();
  rr(x - w * .26, y - h * .95, w * .52, h * .28, w * .03); g.fillStyle = front ? 'rgba(150,170,210,.25)' : 'rgba(110,120,150,.22)'; g.fill();
  for (const sg of [-1, 1]) { const lx = x + sg * w * .38, ly = y - h * .45;
    if (front) { circ(lx, ly, w * .07, '#fffbe8'); GL.push([lx, ly, w * .8, '255,245,220', .45]); if (Z < 16) L(lx, ly, w * 2.2, null, .9); }
    else { rr(lx - w * .09, ly - h * .05, w * .18, h * .09, w * .02); g.fillStyle = mixHex('#5a0a12', '#ff2a3a', .35 + .65 * br); g.fill(); GL.push([lx, ly, w * (.3 + .4 * br), '255,40,60', .25 + .4 * br]); if (Z < 16) L(lx, ly, w * 1.6, null, .8 * br + .2); } }
  if (!front) { rr(x - w * .12, y - h * .5, w * .24, h * .08, w * .01); g.fillStyle = '#c8c4b0'; g.fill(); }
}
function sign(Z) {
  const s = F_ / Z, [a, b] = pj(-5.2, 7, Z), [c, d] = pj(1.6, 5.2, Z), [p0, q0] = pj(-6.4, 0, Z), [p1] = pj(2.6, 0, Z);
  for (const px of [p0, p1]) { g.fillStyle = '#1a1c22'; g.fillRect(px - .12 * s, b - .3 * s, .24 * s, q0 - b + .3 * s); } g.fillStyle = '#1a1c22'; g.fillRect(p0, b - .2 * s, p1 - p0, .25 * s);
  rr(a, b, c - a, d - b, .15 * s); fs('#0e6a3a', .08 * s, '#e8f0e8'); text('EDSA', (a + c) / 2, (b + d) / 2, 1.05 * s, '#ffffff', 'Anton'); L((a + c) / 2, (b + d) / 2, 4 * s, C.grn, .5, .06);
}

// ---------- shots ----------
const S = {};
// the hook: the palace at night in the rain, the flag at half-mast, the vigil; lightning on "namatay"; on "ikaw" a light finds you in the crowd
function hookScene(t, k) {        // k = seconds since frame 1 (negative in the loop's lead-in)
  const fl = k > W_NAMATAY ? Math.exp(-(k - W_NAMATAY) * 4.5) : 0, spot = k > 0 ? ss(seg(k, W_IKAW - .2, W_IKAW + .5)) : 0;
  cam(540, lerp(900, 950, ss(seg(k, -2, 6))), lerp(1, 1.1, ss(seg(k, -2, 6))), 0, fl * 3, t);
  storm(t, fl * .6); palm(-40, 1300, 900, t, 1); palm(1100, 1300, 820, t, 2);
  palace(540, 1250, 1, t);
  g.fillStyle = lg(0, 1250, 0, 2100, ['#1c1c26', '#07070b']); g.fillRect(-400, 1250, 1900, 900);
  line([[190, 1300], [190, 520]], 10, '#c8ccd4'); circ(190, 512, 12, '#e8d8a0'); phFlag(196, 800, 250, 125, t, .8);
  vigil(t, [[1640, 420, 9, 0], [1820, 560, 7, 0], [2050, 760, 5, 170]]);
  person(540, 2080, 760, { t, ...SUITY, back: 1, lx: -1, rim: `rgba(255,200,140,${.3 + .5 * spot})` });
  L(540, 1600, 520, C.warm, .25 + .7 * spot, .12 * spot); L(540, 900, 1000, C.moon, .25 + .5 * fl, .1 * fl);
  lightPass(dim.night); rain(t, .3); flashOver(fl * .5);
}
const dim = { night: '#0e1226' };
S.hook = (t, u) => hookScene(t, u);
S.loop = (t, u) => hookScene(t, u - (TL.dur - T('tail')));
// 4 a.m.: the phone on its stand, PRIVATE NUMBER; then you, sitting up in bed with it at your ear, the convoy strobes in the window; on "wala" your eyes go wide
S.phone = (t, u) => {
  if (t < W_BOSES - .1) { cam(CX, 900, lerp(1, 1.12, seg(u, 0, 4)), 0, 0, t); phoneClose(t, t > W_TUNOG - .05, ring(t, W_TUNOG - .05)); lightPass('#1a1824'); return; }
  const shock = ss(seg(t, W_WALA - .1, W_WALA + .3)); cam(lerp(540, 520, seg(t, W_BOSES, E('s1'))), 900, lerp(1.02, 1.16, ss(seg(t, W_BOSES, E('s1') + 1))), 0, shock * 2.5, t);
  bedroom(t, { strobe: ss(seg(t, W_BOSES, W_BOSES + .6)) });
  person(520, 2250, 1500, { t, ...TEE, arms: 'phone', eyes: shock > .5 ? 'wide' : 'open', lid: .35 * (1 - shock), tired: .3, mouth: .2 * shock, look: shock > .5 ? 0 : .3, lx: 1, rim: 'rgba(160,190,255,.6)' });
  L(700, 1012, 260, C.cyan, .6, .2); blanket(t); lightPass('#1a1a2c'); };
// the oath, before sunrise: the flag on the wall, your right hand up, the Bible; the cameras flash
S.oath = (t, u) => { const up = ss(seg(t, W_KAMAY - .4, W_KAMAY + .2)); cam(CX, lerp(900, 880, seg(u, 0, 6)), lerp(1, 1.1, ss(seg(u, 0, 7))), 0, 0, t);
  hall(t);
  person(540, 2300, 1600, { t, ...SUITY, arms: up > .5 ? 'oath' : 'down', eyes: 'open', look: -.15, lx: -1, rim: 'rgba(255,210,160,.6)' });
  if (up > .5) { rr(590, 1662, 180, 52, 6); fs('#4a1810', 4); line([[680, 1670], [680, 1706]], 5, '#d8b050'); line([[668, 1682], [692, 1682]], 5, '#d8b050'); }
  sil(1020, 2250, 1500, '#0a0806', 'rgba(255,200,150,.3)'); press();
  L(540, 950, 900, C.warm, .7, .08); lightPass('#2a1c24'); flashes(t, W_KAMAY - .2); };
// one signature: the executive order on the desk, the pen; then you, behind the desk, looking at us: "so this is what you'll do"
const SIG = s => [360 + 380 * s, 1205 + 34 * Math.sin(s * TAU * 3.1) * (.6 + .4 * Math.cos(s * 7)) - 50 * Math.exp(-(((s - .12) / .06) ** 2))];
S.power = (t, u) => {
  if (t < T('s4') - .02) {
    cam(CX, 900, lerp(1.0, 1.1, ss(seg(u, 0, 5))), -.04, 0, t); desk();
    g.save(); g.translate(540, 910); g.rotate(.03); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-292, -442, 600, 900); rr(-300, -450, 600, 900, 6); g.fillStyle = '#f4f0e6'; g.fill(); g.restore();
    text('REPUBLIKA NG PILIPINAS', 540, 540, 36, '#2a2a30', 'Anton'); text('TANGGAPAN NG PANGULO', 540, 584, 24, '#5a5a62', 'Anton'); text('EXECUTIVE ORDER NO. 1', 540, 668, 54, '#14141a', 'Anton');
    for (let k = 0; k < 9; k++) { g.fillStyle = 'rgba(40,40,50,.32)'; g.fillRect(300, 750 + k * 40, 300 + 180 * hash(k * 3.1), 9); }
    line([[330, 1240], [750, 1240]], 3, '#2a2a30'); text('PANGULO NG PILIPINAS', 540, 1272, 24, '#2a2a30', 'Anton');
    const p = ss(seg(t, W_PIRMA - .1, W_PIRMA + 2.0)), pts = []; for (let s = 0; s <= p; s += .004) pts.push(SIG(s)); if (pts.length > 1) line(pts, 5, '#1a2a6a');
    const [tx, ty] = SIG(p); limb([[1250, 300], [tx + 250, ty - 260], [tx + 110, ty - 130]], 100, SUITY.hood); line([[tx, ty], [tx + 100, ty - 170]], 16, '#151515'); line([[tx + 70, ty - 120], [tx + 100, ty - 170]], 18, '#c8a050');
    hand(tx + 80, ty - 118, 70, 2.16, { sg: 1, grip: .6, skin: YOU.skin });
    L(250, 320, 1500, C.warm, .95, .2); lightPass('#2a1e1c'); return; }
  cam(CX, 900, lerp(1.0, 1.14, ss(seg(t, T('s4'), E('s4') + .6))), 0, 0, t);
  office(t); person(540, 2150, 1500, { t, ...SUITY, arms: 'lap', eyes: 'open', look: 0, lx: -1, rim: 'rgba(255,200,150,.55)' });
  g.fillStyle = lg(0, 1500, 0, 1920, ['#3a2214', '#1a0e06']); g.fillRect(-400, 1500, 1900, 600); line([[-400, 1502], [1500, 1502]], 6, 'rgba(255,200,150,.25)');
  lamp(200, 1480); lightPass('#1c1622'); };
// first: EDSA, red tail lights to the horizon in the rain; on "Wala" the jam opens up and the road starts to move
S.edsa = (t, u) => { const flow = ss(seg(t, W_D1 - .2, W_D1 + 1.4)), mv = Math.max(0, t - W_D1 - .3), dist = .4 * u + 14 * mv;
  cam(CX, 900, lerp(1, 1.08, seg(u, 0, 6)), 0, 0, t); GL = [];
  grad('#0a0c1c', '#2a2234', -400, HZ); g.drawImage(TEX.city, 0, 0, 2400, 900, -300, HZ - 520, 1680, 600);
  g.fillStyle = lg(0, HZ, 0, 1920, ['#1a1a22', '#0c0c10']); g.fillRect(-400, HZ, 1900, 1300);
  { const Q = (X, Y, Z) => pj(X, Y, Z); path([Q(-14, 7.2, 3), Q(-8, 7.2, 3), Q(-8, 7.2, 300), Q(-14, 7.2, 300)]); g.closePath(); g.fillStyle = '#101018'; g.fill(); path([Q(-8, 7.2, 3), Q(-8, 8.6, 3), Q(-8, 8.6, 300), Q(-8, 7.2, 300)]); g.closePath(); g.fillStyle = '#1e1e28'; g.fill();
    for (let z = 10; z < 300; z += 30) { const zz = z - (dist % 30), [a, b] = Q(-11.2, 7.2, zz), [c, d] = Q(-10, 0, zz); if (zz > 2) { g.fillStyle = '#16161e'; g.fillRect(a, b, c - a, d - b); L((a + c) / 2, b + 10, 4 * F_ / zz, C.amb, .5, .1); } }
    const za = 8 + ((t * 7) % 160); for (let k = 0; k < 24; k++) { const z0 = za + k * 2.6; const [a, b] = Q(-8, 9.4, z0), [c, d] = Q(-8, 8.8, z0 + 1.8); g.fillStyle = '#cfe8ff'; g.fillRect(a, b, Math.max(1, c - a), d - b); if (k % 3 === 0) GL.push([(a + c) / 2, (b + d) / 2, 3 * F_ / z0, '170,210,255', .25]); } }
  for (const X of [5.6, 6.2]) line([pj(X, 0, 250), pj(X, 0, 1.2)], 3, 'rgba(230,200,90,.55)');
  for (const X of [-5.25, -1.75, 1.75]) for (let k = 0; k < 30; k++) { const z0 = 2 + ((k * 9 - dist) % 270 + 270) % 270; if (z0 > 3.5) line([pj(X, 0, z0), pj(X, 0, z0 + 3)], Math.max(1, .14 * F_ / z0), 'rgba(235,235,240,.5)'); }
  const sp = lerp(6.2, 18, flow), cars = [];
  [-7, -3.5, 0, 3.5].forEach((X, li) => { for (let j = 0; j < 16; j++) cars.push([X, 4.5 + j * sp + [1.7, 3.1, 0, 2.4][li], 0, li * 31 + j]); });
  [8, 11.5].forEach((X, li) => { for (let j = 0; j < 14; j++) cars.push([X, 3 + ((j * 13 + li * 6 - t * lerp(1, 26, flow)) % 182 + 182) % 182, 1, li * 17 + j]); });
  const Zs = mv > 0 ? 22 - 14 * mv : 22; let signed = Zs < 3;
  cars.sort((a, b) => b[1] - a[1]).forEach(([X, Z, fr, id]) => { if (!signed && Z < Zs) { sign(Zs); signed = true; } if (Z > 2.2) car(X, Z, { front: fr, brake: lerp(1, .4, flow), col: mixHex('#1a1c26', '#3c3e4e', hash(id)) }); });
  if (!signed) sign(Zs);
  L(540, HZ + 350, 1300, C.amb, .55, .05); const back_ = keep(); lightPass('#2a2636'); back_(); g.globalCompositeOperation = 'screen';
  for (const [x, y, r, c, a] of GL) { glow(x, y, r, c, a); g.save(); g.translate(x, y + r * .9); g.scale(.22, 1.5); glow(0, 0, r * .8, c, a * .3); g.restore(); }
  reset(); rain(t, .32); };
// second: the flood: a boy in his school uniform wading to school, his bag over his head; on "Wala" the water drains away
S.baha = (t, u) => { const drain = ss(seg(t, W_D2 + .1, E('d2') + .4)), wy = lerp(1390, 1790, drain), kx = lerp(430, 590, seg(u, 0, 8));
  cam(CX, 900, lerp(1, 1.07, seg(u, 0, 6)), 0, 0, t); grad('#080a16', '#1c1e30', -400, 900); street();
  person(kx, 1880, 860, { t, walk: t * 2.4, ...YOU, hood: ['#f2f2ee', '#cfcfca', '#8a8a86'], legs: ['#2a3452', '#1c2238', '#0e1220'], outfit: 'shirt', arms: 'up', eyes: 'open', tired: .3 * (1 - drain), smile: drain > .6 ? 1 : 0, lx: 1, rim: 'rgba(255,200,140,.6)' });
  rr(kx - 95, 860, 190, 130, 26); fs('#2a5aa8', 5); rr(kx - 60, 890, 120, 60, 14); fs('#1e4488', 4);
  g.fillStyle = lg(0, wy, 0, 1920, ['rgba(70,60,44,.86)', 'rgba(22,20,16,.96)']); g.fillRect(-400, wy, 1900, 2000);
  for (let k = 0; k < 14; k++) { const y = wy + 12 + k * k * 4.5, x = ((hash(k) * 1300 + t * 30 * (k % 2 ? 1 : -1)) % 1300) - 110; line([[x, y], [x + 140 + 120 * hash(k + 1), y]], 2, 'rgba(255,200,130,.18)'); }
  ell(kx, wy + 6, 120 + 14 * Math.sin(t * 4), 16); g.strokeStyle = 'rgba(255,220,170,.35)'; g.lineWidth = 3; g.stroke();
  const back_ = keep(); lightPass('#141626'); back_(); g.save(); g.globalCompositeOperation = 'screen'; g.translate(785, wy + 160); g.scale(.25, 2.2); glow(0, 0, 160, '255,170,80', .5); g.restore(); reset(); rain(t, .34); };
// third: rice: the sari-sari store at night, the grille, the hanging sachets; a mother takes home a bag of rice; on "Abot-kaya" she smiles
S.bigas = (t, u) => { const ok = ss(seg(t, W_ABOT - .2, W_ABOT + .5)); cam(CX, 900, lerp(1, 1.07, seg(u, 0, 6)), 0, 0, t);
  grad('#3a342e', '#22201c', 0, 1920); g.fillStyle = '#1a1612'; g.fillRect(120, 640, 840, 680);
  const PK = ['#e8402a', '#f2c430', '#2a7ad8', '#3ab86a', '#e86ab0', '#f08a2a', '#9a5ad8'];
  for (let r = 0; r < 3; r++) { const y = 800 + r * 170; for (let k = 0; k < 17; k++) { const hh = 70 + 50 * hash(k * 3 + r); rr(150 + k * 46, y + 150 - hh, 38, hh, 5); g.fillStyle = PK[Math.floor(hash(k * 7 + r * 11) * PK.length)]; g.fill(); } g.fillStyle = '#4a3a2a'; g.fillRect(130, y + 150, 820, 12); }
  for (let s = 0; s < 7; s++) { const x = 170 + s * 112; for (let k = 0; k < 4; k++) { rr(x, 660 + k * 32, 76, 28, 4); g.fillStyle = PK[(s + k) % PK.length]; g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 6, 664 + k * 32, 30, 6); } }
  rr(300, 648, 480, 12, 6); g.fillStyle = '#effff8'; g.fill(); L(540, 820, 1100, C.fluo, .95, .3);
  for (let x = 120; x <= 960; x += 42) { if (x > 420 && x < 660) { line([[x, 640], [x, 1150]], 6, '#2a2a2e'); continue; } line([[x, 640], [x, 1320]], 6, '#2a2a2e'); }
  for (const y of [640, 980]) line([[120, y], [960, y]], 8, '#2a2a2e'); line([[420, 1150], [660, 1150]], 8, '#2a2a2e');
  rr(100, 1310, 880, 40, 6); fs('#5a4a3a', 3);
  for (const [x, y, s] of [[820, 1700, 1], [700, 1760, .9], [950, 1790, .95]]) sack(x, y, s);
  rr(740, 1430, 230, 120, 8); fs('#c8a878', 3); g.save(); g.font = '600 76px Caveat'; g.fillStyle = '#2a1a0a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Bigas', 855, 1490); g.restore();
  const MOM = { skin: ['#c8946c', '#a06e4c', '#5e3e28'], hair: ['#2a1d14', '#1d1410', '#0b0807'] };
  person(640, 2060, 720, { t, ...MOM, hood: ['#f2c430', '#c89a20', '#6a5010'], legs: JEANC, hair: HAIRC, eyes: 'open', look: -.6, lookY: -.5, smile: ok > .5 ? 1 : 0, lx: 1, rim: 'rgba(205,245,228,.5)' });
  person(360, 2120, 1200, { t, ...MOM, hood: ['#d86a8a', '#a84a66', '#5a2236'], legs: ['#5a4a6a', '#3a2e46', '#1e1828'], longHair: 1, arms: 'offer', smile: ok > .5 ? 1 : 0, tired: .5 * (1 - ok), eyes: 'open', look: .3, lx: 1, rim: 'rgba(205,245,228,.5)' });
  ell(822, 1470, 70, 86); g.fillStyle = 'rgba(240,240,235,.85)'; g.fill(); for (let k = 0; k < 40; k++) circ(790 + 64 * hash(k), 1430 + 110 * hash(k * 2.1), 3, '#fffdf4'); line([[790, 1390], [822, 1400], [850, 1390]], 4, 'rgba(240,240,235,.9)');
  L(540, 1300, 900, C.warm, .3 + .5 * ok, .1); lightPass('#2a2430'); };
// fourth: the people's money: the board with the papers and the faceless photos, red strings; on "hahanapin" the last string reaches the one in the middle
const DOCS = [[200, 760, -.05], [360, 1150, .04], [760, 760, .06], [880, 1120, -.03], [610, 1190, .02]], PICS = [[290, 960], [800, 950], [540, 780]];
S.pera = (t, u) => { const pin = ss(seg(t, W_HANAP - .1, W_HANAP + .5)); cam(lerp(540, 520, seg(u, 0, 6)), 900, lerp(1, 1.1, ss(seg(u, 0, 7))), 0, 0, t);
  g.fillStyle = '#1a1a22'; g.fillRect(-400, -400, 1900, 2600); rr(90, 640, 900, 660, 10); fs('#6a4a2e', 16, '#2a1a0e');
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,220,170' : '0,0,0'},.12)`; g.fillRect(100 + hash(i * 1.3) * 880, 650 + hash(i * 2.7) * 640, 3, 3); }
  for (const [x, y, r] of DOCS) { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-84, -104, 176, 216); g.fillStyle = '#ece6d4'; g.fillRect(-88, -110, 176, 216); for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(30,30,40,.35)'; g.fillRect(-70, -86 + k * 22, 100 + 40 * hash(x + k), 6); } g.fillStyle = 'rgba(200,20,30,.7)'; g.fillRect(-70, 60, 90, 22); g.restore(); }
  for (const [x, y] of PICS) { rr(x - 80, y - 100, 160, 200, 4); fs('#d8d4cc', 3); g.fillStyle = '#3a3a44'; g.fillRect(x - 66, y - 86, 132, 150); g.save(); g.beginPath(); g.rect(x - 66, y - 86, 132, 150); g.clip(); sil(x, y + 70, 150, '#0a0a10'); g.restore(); }
  const STR = [[[200, 760], [290, 960]], [[290, 960], [360, 1150]], [[760, 760], [800, 950]], [[800, 950], [880, 1120]], [[610, 1190], [800, 950]], [[360, 1150], [610, 1190]]];
  for (const [a, b] of STR) line([a, b], 3, 'rgba(210,20,30,.9)');
  if (pin > 0) for (const a of [[290, 960], [800, 950]]) line([a, [lerp(a[0], 540, pin), lerp(a[1], 780, pin)]], 4, 'rgba(230,30,40,.95)');
  for (const p of [...DOCS, ...PICS]) circ(p[0], p[1] - 100, 9, '#d02030');
  if (pin > .9) { circ(540, 780, 120, 'rgba(230,30,40,.95)', 8); text('?', 540, 790, 120, '#ff3a48', 'Anton', 'center', 8); }
  g.fillStyle = lg(0, 1520, 0, 1920, ['#2a2018', '#120c08']); g.fillRect(-400, 1520, 1900, 600);
  rr(80, 1450, 420, 200, 10); fs('#5a4630', 4); for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { rr(110 + k * 95, 1500 - j * 22 + 30, 80, 40, 4); g.fillStyle = ['#4a6aa8', '#d8b84a', '#8a6ab0'][(k + j) % 3]; g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; g.stroke(); }
  person(820, 2350, 1500, { t, ...SUITY, back: 1, lx: -1, rim: 'rgba(255,200,150,.5)' });
  L(540, 620, 1100, C.warm, .9, .2); lightPass('#1a1418'); };
// the share, before the last one: you at the office window, the city in the rain
S.cta = (t, u) => { cam(CX, 900, lerp(1, 1.06, seg(u, 0, 5)), 0, 0, t);
  g.fillStyle = '#14141c'; g.fillRect(-400, -400, 1900, 2600);
  const a = 80, b = 160, c = 1000, d = 1420; g.save(); g.beginPath(); g.rect(a, b, c - a, d - b); g.clip(); grad('#0a0c1a', '#262840', b, d); g.drawImage(TEX.city, 0, 0, 2400, 900, a - 200, d - 640, c - a + 400, 660);
  for (let i = 0; i < 70; i++) { const x = a + hash(i * 3.3) * (c - a), y = b + ((hash(i * 1.7) * (d - b) + t * 70 * (1 + hash(i))) % (d - b)); line([[x, y], [x + 2, y + 34 + 30 * hash(i)]], 2, 'rgba(200,215,255,.35)'); } g.restore();
  g.strokeStyle = '#08080c'; g.lineWidth = 30; g.strokeRect(a, b, c - a, d - b); for (const x of [387, 693]) line([[x, b], [x, d]], 14, '#08080c'); line([[a, 790], [c, 790]], 14, '#08080c');
  person(540, 2350, 1500, { t, ...SUITY, back: 1, lx: 1, rim: 'rgba(160,190,255,.6)' });
  L(540, 900, 1100, C.moon, .6, .1); lightPass('#14121c'); };
// a week in: an envelope slides onto the desk; no name; the note inside, in a stranger's hand; then a shadow falls across it from behind you
S.letter = (t, u) => { const inn = eo(seg(t, W_SOBRE - .4, W_SOBRE + .3)), op = ss(seg(t, W_HUWAG - .7, W_HUWAG)), sh = ss(seg(t, E('d5') - .5, E('d5') + .7));
  cam(CX, 900, lerp(1, 1.1, ss(seg(u, 0, 6))), .03, 0, t); desk();
  if (op < 1) { g.save(); g.translate(540, lerp(-400, 900, inn)); g.rotate(-.08); g.globalAlpha = 1 - op; g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-292, -182, 600, 380); rr(-300, -190, 600, 380, 10); fs('#e8dcc0', 3, '#8a7a5a'); line([[-300, -190], [0, 30], [300, -190]], 3, '#a8987a'); g.restore(); }
  if (op > 0) { g.save(); g.translate(540, 900); g.rotate(-.04); g.scale(1, op); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-322, -422, 660, 860); rr(-330, -430, 660, 860, 4); g.fillStyle = '#f4f0e6'; g.fill(); line([[-330, 0], [330, 0]], 2, 'rgba(0,0,0,.15)');
    g.font = '600 104px Caveat'; g.fillStyle = '#14141a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Huwag mong', 0, -80); g.fillText('gagalawin.', 0, 50); g.restore(); }
  if (sh > 0) { g.save(); g.globalAlpha = .78 * sh; sil(640, lerp(200, 1100, sh), 1400, '#000000'); g.restore(); }
  L(220, 300, 1500, C.warm, .95, .22); lightPass('#241a18'); };
// "that's when you understand why the last President never woke up": the portrait on the easel, black ribbon, the face lost in shadow; on "nagising" a candle goes out
S.portrait = (t, u) => { const out = t > E('d5b') + .02 ? 1 : 0; cam(CX, lerp(880, 820, ss(seg(u, 0, 6))), lerp(1, 1.16, ss(seg(t, W_DATING - .5, E('d5b') + 1))), 0, 0, t);
  g.fillStyle = lg(0, 0, 0, 1900, ['#1a1416', '#0c0809']); g.fillRect(-400, -400, 1900, 2600);
  for (let k = 0; k < 4; k++) curve([-100 + k * 330, 80], [65 + k * 330, 220], [230 + k * 330, 80], 44, '#0a0a10');
  for (const [a, b] of [[[380, 1720], [470, 600]], [[700, 1720], [610, 600]], [[540, 1720], [540, 1100]]]) line([a, b], 16, '#3a2414');
  rr(270, 370, 540, 720, 8); fs(lg(270, 370, 810, 1090, ['#e8c870', '#8a6a28', '#d8b860']), 4); g.fillStyle = lg(0, 400, 0, 1060, ['#2a2a34', '#0a0a10']); g.fillRect(300, 400, 480, 660);
  g.save(); g.beginPath(); g.rect(300, 400, 480, 660); g.clip(); sil(540, 1120, 760, '#040406', 'rgba(255,200,140,.28)'); g.restore();
  g.save(); g.translate(810, 370); g.rotate(Math.PI / 4); g.fillStyle = '#050507'; g.fillRect(-160, -26, 320, 52); g.restore(); circ(735, 445, 30, '#050507');
  for (const [x, i] of [[150, 0], [930, 1]]) { line([[x, 1650], [x, 1180]], 14, '#c8a050'); ell(x, 1180, 50, 12); fs('#c8a050'); candle(x, 1172, 130, t, i * 3, i === 0 ? 1 - out : 1); }
  if (out) for (let k = 0; k < 3; k++) { const p = clamp((t - E('d5b') - .02) * .5 - k * .15); if (p > 0 && p < 1) curve([150, 1040], [150 + 30 * Math.sin(t * 2 + k), 1040 - 140 * p], [150 + 50 * Math.sin(t + k), 1040 - 280 * p], 4, `rgba(180,180,190,${.35 * (1 - p)})`); }
  for (let k = 0; k < 26; k++) { const a = (k / 26) * Math.PI, x = 540 + Math.cos(a) * 300 * (.5 + .5 * hash(k)), y = 1330 - Math.sin(a) * 120 * hash(k + 3); if (k % 3 === 0) { ell(x, y + 30, 50, 16, a); fs('#1e3a22'); } ell(x, y, 34, 18, a + .6); fs('#efece4', 2, '#8a8a80'); circ(x, y, 5, '#e8c060'); }
  L(540, 720, 760, C.amb, .55, .05); lightPass('#140e12'); };
// "so next time your phone rings at 4 a.m. ... don't answer": the bedroom again, the phone ringing on the nightstand, you staring at it; the camera creeps toward it
S.end = (t, u) => { const z = ss(seg(t, W_HUWAG2 - .5, E('end') + .8)); cam(lerp(540, 330, z), lerp(900, 1110, z), lerp(1, 1.5, z), 0, 0, t);
  bedroom(t, { strobe: 1, phone: 1, ring: t < W_HUWAG2 - .25 ? ring(t, T('end')) : 0 });
  person(560, 2250, 1500, { t, ...TEE, arms: 'down', eyes: 'wide', look: -.9, sweat: 1, lx: -1, rim: 'rgba(160,210,255,.6)' }); blanket(t);
  lightPass('#1a1a2c'); };

// ---------- the scenes everyone knows ----------
const pat = c => g.createPattern(c, 'repeat');
const W_GC99 = wordT('gc', '99'), W_DASAL = wordT('tv', 'nagdarasal'), W_MURA = wordT('tv', 'nagmumura'), W_E1 = wordT('e1', 'wala'), W_E2 = wordT('e2', 'wala'), W_E3 = wordT('e3', 'sapat'), W_TAUHAN = wordT('d5c', 'tauhan');
const CHAT = [['TITA BABY', 'Congrats inaanak!!! Proud kami'], ['TITO BOY', 'Pa-utang muna 5k, sa Pasko bayad'], ['PINSAN JUN', 'Pa-shout out sa live mo'], ['TITA LORNA', 'Ipasok mo naman si Kevin'], ['LOLA', 'Ingat ka apo. Magdasal ka.']];
const chatAt = i => T('gc') + .35 + i * (span('gc') + .3) / CHAT.length;      // when each message lands (score.py pings on the same times)
// the family group chat: the unread count runs up to 99+, the messages pop in one by one
S.gc = (t, u) => { const last = CHAT.reduce((m, _, i) => t >= chatAt(i) ? i : m, -1), bz = last >= 0 ? Math.exp(-(t - chatAt(last)) * 12) * Math.sin(t * 90) * 5 : 0;
  cam(CX, 900, lerp(1, 1.06, seg(u, 0, 6)), 0, 0, t); grad('#14141c', '#08080c', 0, 1920);
  g.save(); g.translate(bz, 0);
  rr(170, 190, 740, 1520, 70); fs('#0a0a0e', 6); rr(196, 216, 688, 1468, 52); g.fillStyle = '#0e1220'; g.fill();
  rr(196, 216, 688, 170, [52, 52, 0, 0]); g.fillStyle = '#1a2234'; g.fill(); text('PAMILYA', 470, 290, 52, '#ffffff', 'Anton'); g.font = '500 26px sans-serif'; g.fillStyle = '#8aa0c0'; g.textAlign = 'center'; g.fillText('47 members', 470, 340);
  const n = Math.round(lerp(12, 99, ss(seg(t, T('gc'), W_GC99 + .3)))); circ(770, 300, 52, '#e8283a'); text(n >= 99 ? '99+' : String(n), 770, 302, n >= 99 ? 38 : 44, '#fff', 'Anton');
  CHAT.forEach(([who, msg], i) => { const k = back(seg(t, chatAt(i), chatAt(i) + .25), 2); if (k <= 0) return; const y = 440 + i * 200;
    g.save(); g.translate(240, y); g.scale(k, k); g.font = '500 34px sans-serif'; const w = Math.min(600, g.measureText(msg).width + 56);
    rr(0, 0, w, 130, 30); g.fillStyle = '#26324e'; g.fill(); text(who, 28, 34, 28, '#ffc94d', 'Anton', 'left'); g.font = '500 34px sans-serif'; g.fillStyle = '#eef2fa'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(msg, 28, 88, w - 50); g.restore(); });
  g.restore();
  L(540, 900, 1400, C.cyan, 1, .2); lightPass('#30303e'); };
// every carinderia is watching the TV; half of them pray, half of them swear
S.tv = (t, u) => { const da = ss(seg(t, W_DASAL - .1, W_DASAL + .3)), mu = ss(seg(t, W_MURA - .2, W_MURA + .3)); cam(lerp(560, 520, seg(u, 0, 7)), 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t);
  g.fillStyle = '#5a4a3a'; g.fillRect(-400, -400, 1900, 1500); g.save(); g.fillStyle = pat(TEX.tiles); g.fillRect(-400, 1000, 1900, 1200); g.restore(); g.fillStyle = 'rgba(30,20,10,.3)'; g.fillRect(-400, 1000, 1900, 1200);
  line([[540, 300], [540, 380]], 10, '#222'); rr(290, 370, 500, 320, 12); fs('#0a0a0c', 6);
  g.save(); g.beginPath(); g.rect(308, 388, 464, 284); g.clip(); grad('#1e3a6a', '#0a1830', 388, 672); phFlag(560, 400, 200, 100, t * .3, .2); person(450, 760, 420, { t, ...SUITY, eyes: 'open', mouth: .15 * Math.abs(Math.sin(t * 8)), ground: 0, lx: -1 });
  g.fillStyle = '#c8202a'; g.fillRect(308, 610, 464, 44); text('BREAKING: BAGONG PRESIDENTE', 540, 633, 28, '#fff', 'Anton'); g.restore(); L(540, 530, 900, C.cyan, .9, .25);
  rr(40, 760, 230, 300, 8); fs('#1e2a22', 8, '#5a4026'); g.save(); g.font = '600 44px Caveat'; g.fillStyle = '#efe8d8'; g.textAlign = 'center'; g.textBaseline = 'middle'; ['ULAM', 'Adobo', 'Sinigang', 'Menudo', 'Pinakbet'].forEach((s, i) => g.fillText(s, 155, 800 + i * 52)); g.restore();
  rr(60, 1160, 960, 140, 10); fs(lg(0, 1160, 0, 1300, ['#b8bcc2', '#6a6e74']), 4);
  for (const x of [200, 420, 640, 860]) { ell(x, 1160, 90, 26); fs('#9aa0a8', 4); ell(x, 1145, 70, 18); fs('#c8ccd2', 3); circ(x, 1128, 10, '#4a4a50'); for (let k = 0; k < 2; k++) { const p = ((t * .4) + k * .5 + x) % 1; curve([x + 10 * k, 1120], [x + 30 * Math.sin(t + k), 1060 - 80 * p], [x + 20 * Math.sin(t * .7 + k + x), 980 - 160 * p], 6, `rgba(230,230,240,${.2 * (1 - p)})`); } }
  const C1 = { t, back: 1, lx: 1, rim: 'rgba(130,200,255,.6)', hair: HAIRC };
  person(220, 2080, 950, { ...C1, hood: ['#c86a3a', '#984a24', '#4a2410'], legs: JEANC, skin: YOU.skin });
  person(870, 2080 - 60 * mu, 950, { ...C1, hood: ['#3a8a5a', '#246a3e', '#103a1e'], legs: JEANC, skin: YOU.skin, arms: mu > .5 ? 'up' : 'down' });
  person(545, 2140, 1000, { ...C1, hood: ['#d8c8a8', '#b0a080', '#5a5040'], legs: JEANC, skin: YOU.skin, longHair: 1 });
  for (const x of [220, 545, 870]) { rr(x - 120, 1880, 240, 30, 8); fs('#d0303a', 3); }
  L(540, 900, 1300, C.warm, .55, .06);
  lightPass('#2a2430');
  if (da > 0) { reset(); g.globalAlpha = da; g.font = '600 76px Caveat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = OL; g.strokeText('Amen...', 250, 1090); g.fillStyle = '#ffffff'; g.fillText('Amen...', 250, 1090); reset(); }
  if (mu > 0) { reset(); g.globalAlpha = mu; text('#@%&!!', 860, 960, 86, '#ff3a48', 'Anton', 'center', 12); reset(); } };
// the hospital at 4 a.m.: the line outside the OPD, Lola first; on "Wala" the line melts away and she smiles
const LINE_ = [[560, 760, { hood: ['#7a9ac8', '#5a7aa8', '#2a3a5a'], skin: ['#d8a888', '#b0805e', '#6a4630'], hair: ['#e8e6e2', '#b8b4ae', '#76726c'], glasses: 1, longHair: 1 }],
  [430, 760, { hood: ['#a86a4a', '#7a4a30', '#3a2014'] }], [300, 740, { hood: ['#5a6a7a', '#3a4a5a', '#1a2430'], longHair: 1 }], [170, 770, { hood: ['#8a5a8a', '#6a3a6a', '#3a1a3a'] }], [40, 750, { hood: ['#4a7a5a', '#2e5a3e', '#163020'] }], [-90, 760, { hood: ['#9a8a5a', '#7a6a3a', '#3a3018'] }]];
S.ospital = (t, u) => { const gone = ss(seg(t, W_E1 - .1, W_E1 + 1.8)); cam(lerp(500, 560, seg(u, 0, 7)), 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t);
  grad('#0e1430', '#3a3050', -400, 900); g.fillStyle = lg(0, 520, 0, 1500, ['#c8d0c8', '#9aa29a']); g.fillRect(-400, 520, 1900, 1000); g.fillStyle = '#3a3e44'; g.fillRect(-400, 1500, 1900, 700);
  rr(560, 622, 400, 110, 10); fs('#1e7a4a', 4, '#0e3a22'); text('OPD', 760, 668, 74, '#ffffff', 'Anton'); text('BUKAS 8:00 AM', 760, 760, 30, '#2a2e2a', 'Anton');
  rr(650, 800, 260, 700, 6); g.fillStyle = 'rgba(40,60,70,.9)'; g.fill(); line([[780, 800], [780, 1500]], 6, '#20262a'); L(780, 1100, 600, C.fluo, .7, .15);
  circ(300, 700, 70, '#f4f4f0'); circ(300, 700, 70, '#2a2a2e', 6); line([[300, 700], [300, 648]], 7, '#111'); line([[300, 700], [340, 700]], 9, '#111');
  for (let i = LINE_.length - 1; i >= 0; i--) { const [x, h, o] = LINE_[i], a = i ? 1 - clamp(gone * 7 - (LINE_.length - 1 - i)) : 1; if (a <= 0) continue;
    g.save(); g.globalAlpha = a; person(x, 1760, h, { t, ...o, legs: o.legs || JEANC, skin: o.skin || YOU.skin, hair: o.hair || HAIRC, eyes: i % 2 ? 'shut' : 'open', tired: i ? .8 : .7 * (1 - gone), smile: !i && gone > .8 ? 1 : 0, look: .6, lx: 1, rim: 'rgba(205,245,228,.45)' }); g.restore(); }
  L(320, 500, 900, C.amb, .55, .1); lightPass('#26283a'); };
// the airport: a mother leaving, her child, the balikbayan box; on "Wala" the suitcase rolls away and they hold each other
S.ofw = (t, u) => { const st = ss(seg(t, W_E2 - .1, W_E2 + .9)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 7)), 0, 0, t);
  grad('#0a0e20', '#1e2238', -400, 1300); for (let x = -60; x < 1200; x += 180) line([[x, 200], [x, 1300]], 10, '#2a2e3a'); line([[-400, 760], [1500, 760]], 8, '#2a2e3a');
  ell(760, 1120, 300, 46); fs('#c8ccd4'); path([[1000, 1110], [1060, 960], [1100, 960], [1060, 1110]]); g.closePath(); fs('#c8ccd4'); path([[700, 1130], [560, 1210], [640, 1210], [800, 1140]]); g.closePath(); fs('#a8acb4');
  for (let k = 0; k < 9; k++) circ(560 + k * 46, 1110, 8, '#2a3a5a'); const bl = (t % 1.2) < .15 ? 1 : 0; circ(1080, 960, 10, `rgba(255,60,60,${.3 + .7 * bl})`); L(1080, 960, 160, C.red, bl, .6 * bl);
  g.fillStyle = lg(0, 1300, 0, 1920, ['#6a6e78', '#2a2c34']); g.fillRect(-400, 1300, 1900, 700);
  rr(260, 640, 560, 90, 10); fs('#1a1a20', 4); text('DEPARTURES', 540, 686, 60, '#ffc94d', 'Anton');
  const sx = 120 - 600 * st; rr(sx, 1560, 150, 260, 18); fs('#3a4a6a', 4); line([[sx + 75, 1560], [sx + 75, 1460]], 8, '#1a1a20'); line([[sx + 45, 1460], [sx + 105, 1460]], 10, '#1a1a20');
  g.save(); g.globalAlpha = 1 - st; rr(820, 1660, 220, 200, 6); fs('#b88a52', 4); g.fillStyle = '#d8c070'; g.fillRect(820, 1740, 220, 26); text('BALIKBAYAN', 930, 1810, 30, '#5a3a1a', 'Anton'); g.restore();
  const MOM = { skin: ['#c8946c', '#a06e4c', '#5e3e28'], hair: ['#2a1d14', '#1d1410', '#0b0807'] };
  person(lerp(700, 610, st), 1980, 640, { t, ...MOM, hood: ['#f2c430', '#c89a20', '#6a5010'], legs: JEANC, hair: HAIRC, arms: st > .5 ? 'out' : 'reach', eyes: 'open', look: -.7, lookY: -.5, tired: .5 * (1 - st), mouth: st > .5 ? 0 : .2, smile: st > .6 ? 1 : 0, lx: -1, rim: 'rgba(205,245,228,.5)' });
  person(420, 1990, 1150, { t, ...MOM, hood: ['#2a6a8a', '#1e4e68', '#0e2636'], legs: ['#4a4a5a', '#2e2e3a', '#16161e'], longHair: 1, arms: st > .5 ? 'out' : 'down', eyes: 'open', look: .55, tired: .7 * (1 - st), smile: st > .6 ? 1 : 0, lx: -1, rim: 'rgba(205,245,228,.5)' });
  L(540, 400, 1400, C.fluo, .75, .1); lightPass('#262a3a'); };
// payday math at the kitchen table: bills, coins, the debt notebook; on "Sapat" the pile is enough and he can finally breathe
S.sahod = (t, u) => { const ok = ss(seg(t, W_E3 - .1, W_E3 + .7)); cam(CX, 900, lerp(1, 1.08, seg(u, 0, 6)), 0, 0, t);
  g.fillStyle = lg(0, 0, 0, 1300, ['#4a5a52', '#2e3a34']); g.fillRect(-400, -400, 1900, 1800);
  rr(720, 640, 200, 260, 6); fs('#ece4d4', 3); g.fillStyle = '#b02a2a'; g.fillRect(720, 640, 200, 60); text('KINSENAS', 820, 672, 34, '#fff', 'Anton');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const d = r * 5 + c + 1; text(String(d), 745 + c * 38, 730 + r * 42, 24, d === 15 ? '#b02a2a' : '#4a4038', 'Anton'); } circ(745 + 4 * 38, 730 + 2 * 42, 22, '#d0202a', 4);
  line([[540, -200], [540, 330]], 4, '#1a1a1a'); ell(540, 360, 26, 34); g.fillStyle = '#fff4c8'; g.fill(); L(540, 400, 1400, C.warm, .95, .3);
  person(440, 2150, 1300, { t, ...YOU, hood: ['#e8e4dc', '#c8c2b6', '#7a766c'], legs: JEANC, arms: 'lap', eyes: 'open', lookY: .7, look: .3, tired: .7 * (1 - ok), smile: ok > .6 ? 1 : 0, lx: -1, rim: 'rgba(255,210,160,.5)' });
  g.fillStyle = lg(0, 1300, 0, 1920, ['#6a4a30', '#3a2614']); g.fillRect(-400, 1300, 1900, 700); line([[-400, 1302], [1500, 1302]], 6, 'rgba(255,220,170,.3)');
  const nb = 3 + Math.round(9 * ok); for (let k = 0; k < nb; k++) { rr(560 + (k % 3) * 12, 1330 - k * 14, 230, 90, 6); g.fillStyle = ['#8a6ab0', '#d8b84a', '#4a6aa8'][k % 3]; g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.stroke(); }
  for (let k = 0; k < 6; k++) { ell(160 + k * 34, 1400 + 10 * hash(k), 22, 9); fs('#c8b070', 2, '#7a6a3a'); }
  g.save(); g.translate(300, 1520); g.rotate(-.06); g.globalAlpha = 1 - ok; rr(-150, -90, 300, 180, 6); fs('#efe8d0', 3); g.font = '600 52px Caveat'; g.fillStyle = '#b02a2a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Listahan ng utang', 0, -30); line([[-110, 30], [110, 30]], 3, 'rgba(0,0,0,.3)'); line([[-110, 62], [80, 62]], 3, 'rgba(0,0,0,.3)'); g.restore();
  lightPass('#2a2226'); };
// the next morning: the board is empty, torn corners and cut strings; in the doorway your staff look away
S.empty = (t, u) => { const a = ss(seg(t, W_TAUHAN - .3, W_TAUHAN + .4)); cam(lerp(540, 560, seg(u, 0, 6)), 900, lerp(1.04, 1.12, seg(u, 0, 6)), 0, 0, t);
  g.fillStyle = '#1a1a22'; g.fillRect(-400, -400, 1900, 2600); rr(90, 640, 900, 660, 10); fs('#6a4a2e', 16, '#2a1a0e');
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,220,170' : '0,0,0'},.12)`; g.fillRect(100 + hash(i * 1.3) * 880, 650 + hash(i * 2.7) * 640, 3, 3); }
  for (const p of [...DOCS, ...PICS]) { const [x, y] = p; path([[x - 18, y - 100], [x + 20, y - 100], [x, y - 70]]); g.closePath(); g.fillStyle = '#ece6d4'; g.fill(); circ(x, y - 100, 9, '#d02030'); curve([x, y - 100], [x + 10, y - 40], [x - 6 + 6 * Math.sin(t + x), y + 10], 3, 'rgba(210,20,30,.9)'); }
  g.fillStyle = lg(0, 1520, 0, 1920, ['#2a2018', '#120c08']); g.fillRect(-400, 1520, 1900, 600);
  person(400, 2350, 1500, { t, ...SUITY, back: 1, lx: 1, rim: 'rgba(255,200,150,.5)' });
  L(540, 620, 1000, C.warm, .75, .15); lightPass('#1a1418');
  if (a > 0) { reset(); g.globalAlpha = a; rr(840, 300, 260, 1300, 0); g.fillStyle = 'rgba(205,245,228,.18)'; g.fill(); sil(880, 1650, 900, '#030305'); sil(1000, 1680, 960, '#030305'); reset(); } };

// ---------- overlays: "GAGAWIN MO #n" (gold), the share card ----------
function doCard(t, t0, t1, n, label) {
  const k = back(seg(t, t0, t0 + .28), 2.2) * (1 - ss(seg(t, t1 + .1, t1 + .35))); if (k <= 0) return;
  reset(); g.save(); g.translate(CX, 470); g.scale(k, k); glass(-420, -140, 840, 280, 34, YEL, 5, 'rgba(255,201,77,.8)');
  text(`${TX.rule}${n}`, 0, -70, 54, '#ffd98a', 'Anton'); g.font = '96px Anton'; const sc = Math.min(1, 760 / g.measureText(label).width);
  g.save(); g.translate(0, 34); g.scale(sc, sc); g.shadowColor = 'rgba(255,190,60,.9)'; g.shadowBlur = 30; text(label, 0, 0, 96, '#fff', 'Anton'); g.restore(); g.restore();
}
function bigCard(t, t0, top, bottom, col = YEL, glowc = 'rgba(255,170,80,1)') {
  const k = back(seg(t, t0, t0 + .3), 1.7); if (k <= 0) return; reset(); g.save(); g.translate(CX, 600); g.scale(k, k);
  glass(-440, -150, 880, 300, 44, 'rgba(255,255,255,.65)', 4, 'rgba(255,255,255,.45)');
  g.font = '86px Anton'; const s1 = Math.min(1, 800 / g.measureText(top).width); g.save(); g.translate(0, -44); g.scale(s1, s1); text(top, 0, 0, 86, '#fff', 'Anton'); g.restore();
  g.font = '70px Anton'; const s2 = Math.min(1, 800 / g.measureText(bottom).width); g.save(); g.translate(0, 62); g.scale(s2, s2); g.shadowColor = glowc; g.shadowBlur = 24; text(bottom, 0, 0, 70, col, 'Anton'); g.restore(); g.restore();
}
const W_COMMENT = wordT('cta', 'icomment');
const DOS = ['d1', 'd2', 'd3', 'd4', 'e1', 'e2', 'e3'];
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .24; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  ZK = 1;
  S[sh[2]](t, u);
  bloom(); vignette(.6);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'hook') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .3, .8)));
  DOS.forEach((id, i) => { if (t >= T(id) && t < E(id) + .5) doCard(t, T(id), E(id), i + 1, TX.rules[i]); });
  if (sh[2] === 'cta') { if (t < W_SHARE - .1) bigCard(t, W_COMMENT - .1, TX.comment[0], TX.comment[1]); else bigCard(t, W_SHARE - .1, TX.share[0], TX.share[1]); }
  if (sh[2] !== 'loop') captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);

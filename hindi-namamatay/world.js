
// ==================== Paano Kung Hindi Ka Namamatay: people at full height, the city, fire, glass, water, the dying sun ====================
const YOU = { skin: ['#d6a07a', '#a8704c', '#62402a'], hair: ['#0e0b0a', '#1e1714', '#3a2e26'], shirt: ['#f0eee8', '#c8c4ba', '#7e7a72'], pants: ['#3a3e4a', '#262a34', '#12141a'] };
const WIFE = { skin: ['#e0b08c', '#b48262', '#6c4632'], hair: ['#120d0b', '#261c17', '#3e3028'], dress: ['#c0687a', '#8e4456', '#4e2230'] };
const KID = { skin: ['#e6b896', '#bc8a68', '#704a34'], hair: ['#100c0a', '#221a15', '#3a2e26'], dress: ['#f2d36a', '#c8a43c', '#7a6220'] };
const OLD = { skin: ['#dcb498', '#b08868', '#6a4c38'], hair: ['#eeece8', '#c4c0ba', '#86827c'] };
C.fire = '255,120,40'; C.ember = '255,170,80'; C.sun = '255,90,40'; C.gold = '255,200,120'; C.sea = '90,170,220';

// ---------- a person at full height, front view, real proportions (7.5 heads). pose: down | brush | reach | hold | hug | hands ----------
function manReal(x, y, h, o = {}) {
  const { t = 0, pose = 'down', look = 0, lx = -1, rim = null, cloth = YOU, female = 0, age = 0, walk = null, eyes = 'open', tear = 0, mouth = 0, sweat = 0, turn = 0, dust = 0 } = o;
  const sk = cloth.skin || YOU.skin, r = h * .066, br = Math.sin(t * 1.9) * h * .002, sw = walk === null ? 0 : Math.sin(walk);
  const hy = y - h + r * 1.05 + br, sh = y - h * .815 + br, hip = y - h * .5, sW = h * (female ? .105 : .125);
  cshadow(x, y, h * .16, h * .02, .55);
  const top = cloth.shirt || cloth.dress, bot = cloth.pants || cloth.dress;
  for (const sg of [-1, 1]) { const fx = x + sg * h * .055 + sg * sw * h * .05, kx = x + sg * h * .06 + sg * sw * h * .025;
    limb([[x + sg * h * .06, hip], [kx, y - h * .26], [fx, y - h * .03]], h * (female ? .05 : .062), bot, lx);
    g.save(); g.translate(fx, y - h * .015); ell(sg * h * .012, 0, h * .045, h * .018); g.fillStyle = '#16120f'; g.fill(); ell(sg * h * .006, -h * .006, h * .03, h * .008); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill(); g.restore(); }
  const P = () => { g.beginPath(); g.moveTo(x - h * .03, sh - h * .012); g.lineTo(x - sW, sh + h * .01); g.quadraticCurveTo(x - sW * 1.05, sh + h * .08, x - sW * .82, hip - h * .1);
    if (female) { g.quadraticCurveTo(x - sW * .7, hip, x - h * .16, y - h * .22); g.lineTo(x + h * .16, y - h * .22); g.quadraticCurveTo(x + sW * .7, hip, x + sW * .82, hip - h * .1); }
    else { g.lineTo(x - sW * .85, hip + h * .03); g.lineTo(x + sW * .85, hip + h * .03); g.lineTo(x + sW * .82, hip - h * .1); }
    g.quadraticCurveTo(x + sW * 1.05, sh + h * .08, x + sW, sh + h * .01); g.lineTo(x + h * .03, sh - h * .012); g.closePath(); };
  P(); g.fillStyle = lg(x - sW, 0, x + sW, 0, lx < 0 ? [top[0], top[1], top[2]] : [top[2], top[1], top[0]]); g.fill();
  g.save(); P(); g.clip();
  for (let k = 0; k < 7; k++) curve([x + (k - 3) * sW * .25, sh + h * .02], [x + (k - 3) * sW * .3 + Math.sin(k * 2) * h * .01, hip - h * .1], [x + (k - 3) * sW * .28, hip + h * .03], h * .002, 'rgba(10,10,20,.22)');
  g.fillStyle = lg(0, hip - h * .1, 0, hip + h * .03, ['rgba(10,10,20,0)', 'rgba(10,10,20,.3)']); g.fillRect(x - sW * 1.2, hip - h * .1, sW * 2.4, h * .14);
  if (dust > 0) for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,85,80,${.35 * dust})`; g.fillRect(x + (hash(i * 3.1) - .5) * sW * 2, sh + hash(i * 5.7) * h * .3, 3 + 6 * hash(i), 2 + 4 * hash(i * 2)); }
  if (rim) { g.translate(-lx * h * .004, 0); P(); g.lineWidth = h * .006; g.strokeStyle = rim; g.stroke(); }
  g.restore(); P(); g.strokeStyle = 'rgba(8,8,14,.6)'; g.lineWidth = h * .0025; g.stroke();
  if (!female) { line([[x, sh], [x, hip]], h * .002, 'rgba(0,0,0,.25)'); for (let k = 0; k < 5; k++) circ(x + h * .004, sh + h * .03 + k * h * .055, h * .004, 'rgba(255,255,255,.6)');
    for (const sg of [-1, 1]) { path([[x, sh - h * .005], [x + sg * h * .045, sh - h * .02], [x + sg * h * .05, sh + h * .02], [x + sg * h * .006, sh + h * .03]]); g.closePath(); g.fillStyle = top[0]; g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = h * .002; g.stroke(); } }
  rr(x - h * .022, sh - h * .05, h * .044, h * .06, h * .015); g.fillStyle = lg(x - h * .022, 0, x + h * .022, 0, [sk[2], sk[1], sk[2]]); g.fill();
  const arm = sg => { const s0 = [x + sg * sW * .92, sh + h * .025]; let e, hd, ha;
    if (pose === 'brush') { const k = Math.sin(t * 6 + sg) * h * .02; e = [s0[0] + sg * h * .05, s0[1] + h * .14]; hd = sg < 0 ? [x + h * .06 + k, sh + h * .08] : [s0[0] + sg * h * .04, s0[1] + h * .3]; }
    else if (pose === 'reach') { e = [s0[0] + sg * h * .1, s0[1] + h * .04]; hd = [s0[0] + sg * h * .2, s0[1] - h * .02]; }
    else if (pose === 'hold' && sg > 0) { e = [s0[0] + h * .05, s0[1] + h * .14]; hd = [x + h * .07, s0[1] + h * .16]; }
    else if (pose === 'hug') { e = [s0[0] + sg * h * .06, s0[1] + h * .12]; hd = [x - sg * h * .06, s0[1] + h * .17]; }
    else if (pose === 'hands') { e = [s0[0] + sg * h * .03, s0[1] + h * .14]; hd = [x + sg * h * .02, s0[1] + h * .2]; }
    else { const s2 = walk === null ? 0 : -sg * sw; e = [s0[0] + sg * h * .015 + s2 * h * .04, s0[1] + h * .15]; hd = [s0[0] + sg * h * .02 + s2 * h * .08, s0[1] + h * .3]; }
    limb([s0, e, hd], h * .045, top, lx); const dx = hd[0] - e[0], dy = hd[1] - e[1], d = Math.hypot(dx, dy) || 1;
    handReal(hd[0] - dx / d * h * .01, hd[1] - dy / d * h * .01, h * .085, Math.atan2(dy, dx), { skin: sk, curl: pose === 'reach' ? .15 : .45, sg: -sg }); };
  arm(-1); arm(1);
  faceReal(x + turn * h * .01, hy, r, { t, skin: sk, hair: cloth.hair || YOU.hair, female, age, look, lx, rim, eyes, tear, mouth, sweat, turn, glasses: o.glasses, hairStyle: o.hairStyle, smile: o.smile, stache: o.stache });
}
// a child's face: rounder, bigger eyes, two little pigtails
function kidFace(x, y, r, o = {}) {
  const { t = 0 } = o;
  for (const sg of [-1, 1]) { const px = x + sg * r * .95, py = y - r * .35 + Math.sin(t * 2 + sg) * r * .03; g.beginPath(); g.ellipse(px + sg * r * .2, py + r * .25, r * .22, r * .45, sg * .4, 0, TAU); g.fillStyle = KID.hair[1]; g.fill(); circ(px, py, r * .1, '#e85a7a'); }
  g.save(); g.translate(x, y); g.scale(1.08, .97); faceReal(0, 0, r, { t, female: 1, skin: KID.skin, hair: KID.hair, hairStyle: 'short', ...o, x: 0 }); g.restore();
}

// ---------- the city and the fire ----------
function towers(t, y0, n, seed, o = {}) {   // a skyline of office towers with lit windows
  const { col = ['#141824', '#0c0f18'], lit = .35, warm = 1 } = o;
  for (let i = 0; i < n; i++) { const w = 120 + 200 * hash(i * 3.1 + seed), x = -300 + i * (1700 / n) + hash(i + seed) * 60, hh = 500 + 900 * hash(i * 5.3 + seed), top = y0 - hh;
    g.fillStyle = lg(x, 0, x + w, 0, col); g.fillRect(x, top, w, hh + 600); g.fillStyle = 'rgba(160,180,255,.06)'; g.fillRect(x, top, 4, hh);
    for (let wy = top + 20; wy < y0; wy += 26) for (let wx = x + 10; wx < x + w - 14; wx += 18) { const r_ = hash(wx * 1.7 + wy * 3.3 + seed); if (r_ < lit) { g.fillStyle = r_ < lit * .2 ? 'rgba(180,220,255,.8)' : `rgba(255,${200 + 30 * hash(wx)},${130 * warm + 40},.75)`; g.fillRect(wx, wy, 9, 13); } } }
}
function fire(x, y, w, h, t, a = 1) {      // flames licking up out of a window: layered tongues, a hot core, sparks
  if (a <= 0) return; g.save(); g.globalCompositeOperation = 'screen';
  for (let k = 0; k < 9; k++) { const ph = t * (3 + k * .4) + k * 1.7, fx = x + (hash(k * 3.3) - .5) * w, fh = h * (.5 + .5 * hash(k * 7.1)) * (.8 + .2 * Math.sin(ph)), sway = Math.sin(ph * .7) * w * .15;
    g.beginPath(); g.moveTo(fx - w * .18, y); g.quadraticCurveTo(fx - w * .2 + sway, y - fh * .5, fx + sway * 1.6, y - fh); g.quadraticCurveTo(fx + w * .2 + sway, y - fh * .5, fx + w * .18, y); g.closePath();
    g.fillStyle = lg(0, y, 0, y - fh, [`rgba(255,240,180,${.8 * a})`, `rgba(255,140,40,${.6 * a})`, 'rgba(200,40,10,0)']); g.fill(); }
  g.restore(); glow(x, y - h * .3, h * 1.1, C.fire, .6 * a); L(x, y - h * .3, h * 3, C.fire, .95 * a, .3 * a);
}
function smokeCol(x, y, w, t, a = .6) {   // a column of smoke boiling up
  for (let i = 0; i < 26; i++) { const p = ((t * .08 + i / 26) % 1), sx = x + Math.sin(p * 5 + i) * w * .3 * p + p * w * .6, sy = y - p * w * 4, R = w * (.25 + .7 * p);
    g.fillStyle = rg(sx, sy, 0, R, [`rgba(40,36,40,${a * (1 - p) * .8})`, 'rgba(40,36,40,0)']); g.fillRect(sx - R, sy - R, 2 * R, 2 * R); }
}
function shards(t, cx, cy, n, spread, a = 1, seed = 0) {   // glass falling and turning, catching the light
  for (let i = 0; i < n; i++) { const ox = (hash(i * 2.3 + seed) - .5) * spread, oy = (hash(i * 4.1 + seed) - .5) * spread * 1.5 + ((t * (40 + 60 * hash(i)) + hash(i * 9) * 900) % 900) - 450, s = 8 + 26 * hash(i * 7.7 + seed), rot = t * (1 + 3 * hash(i)) + i;
    g.save(); g.translate(cx + ox, cy + oy); g.rotate(rot); g.scale(1, Math.abs(Math.cos(rot * 1.3)) * .8 + .2);
    path([[-s, -s * .3], [s * .6, -s * .8], [s, s * .4], [-s * .2, s * .7]]); g.closePath(); g.fillStyle = `rgba(190,215,255,${.25 * a})`; g.fill(); g.strokeStyle = `rgba(230,240,255,${.7 * a})`; g.lineWidth = 1.5; g.stroke(); g.restore();
    if (hash(i + Math.floor(t * 3)) > .85) glow(cx + ox, cy + oy, s * 2, '220,235,255', .5 * a); }
}
function embersUp(t, n, a = 1, sp = 1) {   // sparks rising (or rushing past when you fall)
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) { const v = (300 + 700 * hash(i * 1.3)) * sp, x = hash(i * 2.9) * 1300 - 110 + Math.sin(t * 2 + i) * 30, y = 2100 - ((hash(i * 5.1) * 2400 + t * v) % 2400), len = 6 + 30 * sp * hash(i);
    line([[x, y], [x, y + len]], 2 + 3 * hash(i * 3), `rgba(255,${150 + 80 * hash(i)},60,${a * (.4 + .6 * hash(i * 7))})`); }
  g.restore();
}
// someone falling, seen from above and a little to the side: limbs thrown up and out, the shirt flapping
function faller(x, y, s, t, o = {}) {
  const fl = Math.sin(t * 9), r = s * .13;
  g.save(); g.translate(x, y); g.rotate(o.rot || 0);
  for (const sg of [-1, 1]) { limb([[sg * s * .1, s * .3], [sg * s * .26, s * .55 + sg * fl * s * .03], [sg * s * .2, s * .82]], s * .11, YOU.pants, -1); ell(sg * s * .2, s * .86, s * .07, s * .04, sg * .3); g.fillStyle = '#16120f'; g.fill(); }
  const P = () => { g.beginPath(); g.moveTo(-s * .22, -s * .12); g.quadraticCurveTo(0, -s * .2, s * .22, -s * .12); g.lineTo(s * .17 + fl * s * .02, s * .34); g.lineTo(-s * .17 - fl * s * .02, s * .34); g.closePath(); };
  P(); g.fillStyle = lg(-s * .2, 0, s * .2, 0, YOU.shirt); g.fill(); g.save(); P(); g.clip(); for (let k = 0; k < 6; k++) curve([-s * .15 + k * s * .06, -s * .1], [-s * .17 + k * s * .07 + fl * s * .03, s * .1], [-s * .16 + k * s * .065, s * .34], s * .006, 'rgba(10,10,20,.3)'); g.restore();
  for (let k = 0; k < 4; k++) { const fx = -s * .18 + k * s * .12; path([[fx, s * .32], [fx + s * .05, s * .32], [fx + s * .03 + fl * s * .05, s * .42 + hash(k) * s * .05]]); g.closePath(); g.fillStyle = YOU.shirt[1]; g.fill(); }
  for (const sg of [-1, 1]) { const w = Math.sin(t * 7 + sg) * s * .06; limb([[sg * s * .2, -s * .1], [sg * s * .42, -s * .28 + w], [sg * s * .5 + w, -s * .52]], s * .085, YOU.shirt, -1); handReal(sg * s * .5 + w, -s * .52, s * .16, -Math.PI / 2 + sg * .35, { skin: YOU.skin, curl: .1, spread: .3, sg }); }
  faceReal(0, -s * .3, r, { t, skin: YOU.skin, hair: YOU.hair, eyes: 'wide', mouth: .5, lx: 1, rim: 'rgba(255,150,70,.55)' });
  g.restore();
}
// ---------- the phone ----------
function phone(x, y, w, h, ang, screen) {
  g.save(); g.translate(x, y); g.rotate(ang);
  rr(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 46); g.fillStyle = lg(-w / 2, 0, w / 2, 0, ['#2a2c32', '#4a4c54', '#1a1b20']); g.fill();
  rr(-w / 2, -h / 2, w, h, 38); g.fillStyle = '#05060a'; g.fill(); g.save(); rr(-w / 2, -h / 2, w, h, 38); g.clip(); g.translate(-w / 2, -h / 2); screen(w, h); g.restore();
  rr(-w * .12, -h / 2 + 14, w * .24, 22, 11); g.fillStyle = '#000'; g.fill();
  g.save(); rr(-w / 2, -h / 2, w, h, 38); g.clip(); g.fillStyle = lg(-w / 2, -h / 2, w / 2, h / 2, ['rgba(255,255,255,.08)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.04)']); g.fillRect(-w / 2, -h / 2, w, h); g.restore();
  g.restore(); L(x, y, Math.max(w, h) * .9, '170,200,255', .8, .12);
}
// ---------- the truck, the lightning, the rubble ----------
function truckFront(x, y, s, t, o = {}) {      // a big hauler, nose on, headlights blazing
  const { lights = 1, dent = 0 } = o; g.save(); g.translate(x, y);
  rr(-1.25 * s, -3.4 * s, 2.5 * s, 2.0 * s, .12 * s); g.fillStyle = lg(-1.25 * s, 0, 1.25 * s, 0, ['#5a1a1a', '#8a2a24', '#4a1212']); g.fill();
  rr(-1.1 * s, -3.2 * s, 2.2 * s, .9 * s, .08 * s); g.fillStyle = '#0a0c14'; g.fill(); g.fillStyle = 'rgba(170,190,230,.15)'; g.fillRect(-1.1 * s, -3.2 * s, 2.2 * s, .2 * s);
  rr(-1.3 * s, -1.5 * s, 2.6 * s, 1.1 * s, .08 * s); g.fillStyle = lg(0, -1.5 * s, 0, -.4 * s, ['#8a8c94', '#4a4c54']); g.fill();
  for (let k = 0; k < 9; k++) { const gy = -1.4 * s + k * .1 * s; g.fillStyle = k % 2 ? '#1a1a20' : '#a8aab4'; g.fillRect(-.8 * s, gy, 1.6 * s, .06 * s); }
  if (dent) { g.fillStyle = `rgba(0,0,0,${.5 * dent})`; ell(0, -1.0 * s, .35 * s, .25 * s); g.fill(); for (let k = 0; k < 6; k++) line([[0, -1 * s], [Math.cos(k) * .45 * s, -1 * s + Math.sin(k) * .3 * s]], .02 * s, `rgba(20,20,20,${.6 * dent})`); }
  for (const sg of [-1, 1]) { rr(sg * 1.0 * s - .2 * s, -1.25 * s, .4 * s, .25 * s, .05 * s); g.fillStyle = lights ? '#fffbe8' : '#888'; g.fill(); if (lights) { glow(sg * s, -1.12 * s, 1.4 * s, C.warm, .9 * lights); L(sg * s, -1.12 * s, 3 * s, C.warm, lights, .5 * lights); F(sg * s, -1.12 * s, 5 * s, C.warm, .8 * lights); } }
  for (const sg of [-1, 1]) { rr(sg * 1.05 * s - .28 * s, -.45 * s, .56 * s, .5 * s, .1 * s); fs('#0a0a0c', .02 * s); }
  g.restore();
}
function bolt(x0, y0, x1, y1, t, a, seed = 1) {    // a lightning bolt: a jagged main channel with branches, a soft glow (never a full-frame flash)
  if (a <= 0) return; const pts = [[x0, y0]]; let x = x0, y = y0; const n = 14;
  for (let i = 1; i <= n; i++) { const u = i / n; x = lerp(x0, x1, u) + (hash(i * 3.7 + seed) - .5) * 120 * (1 - u * .5); y = lerp(y0, y1, u); pts.push([x, y]); }
  g.save(); g.globalCompositeOperation = 'screen'; line(pts, 16, `rgba(150,170,255,${.25 * a})`); line(pts, 6, `rgba(210,220,255,${.7 * a})`); line(pts, 2.5, `rgba(255,255,255,${a})`);
  for (let b = 2; b < n - 2; b += 3) { let bx = pts[b][0], by = pts[b][1]; const br = [[bx, by]]; for (let k = 0; k < 4; k++) { bx += (hash(b * 7 + k + seed) - .3) * 90; by += 50 + 40 * hash(b + k); br.push([bx, by]); } line(br, 2, `rgba(220,230,255,${.6 * a})`); }
  g.restore(); L(x1, y1, 700, '200,215,255', .8 * a, .12 * a);
}
function rubble(x0, y0, x1, y1, t, seed = 0) {      // broken concrete slabs, rebar, dust
  for (let i = 0; i < 40; i++) { const x = lerp(x0, x1, hash(i * 2.1 + seed)), y = lerp(y0, y1, hash(i * 3.7 + seed)), w = 60 + 220 * hash(i * 5.3), hh = 30 + 90 * hash(i * 7.9), a = (hash(i) - .5) * .8;
    g.save(); g.translate(x, y); g.rotate(a); path([[-w / 2, -hh / 2], [w / 2, -hh / 2 + (hash(i) - .5) * 20], [w / 2 - 10, hh / 2], [-w / 2 + 14, hh / 2]]); g.closePath(); g.fillStyle = lg(0, -hh / 2, 0, hh / 2, ['#8a8682', '#5a5652', '#2e2c2a']); g.fill(); g.strokeStyle = 'rgba(20,18,16,.6)'; g.lineWidth = 2; g.stroke();
    for (let k = 0; k < 2; k++) line([[-w * .3 + k * w * .4, -hh / 2], [-w * .3 + k * w * .4 + (hash(i + k) - .5) * 40, -hh / 2 - 40 * hash(i * k + 1)]], 4, '#5a3a2a'); g.restore(); }
}
function dustCloud(t, x, y, w, a) { for (let i = 0; i < 16; i++) { const p = ((t * .1 + i / 16) % 1), sx = x + (hash(i * 3.3) - .5) * w * (1 + p), sy = y - p * w * .4, R = w * (.15 + .3 * p); g.fillStyle = rg(sx, sy, 0, R, [`rgba(150,140,125,${a * (1 - p) * .6})`, 'rgba(150,140,125,0)']); g.fillRect(sx - R, sy - R, 2 * R, 2 * R); } }

// ---------- home, graves, cards ----------
function homeRoom(t, o = {}) {       // a Filipino living room at night: wood panelling, a framed wedding photo, the Sto. Nino, a warm lamp
  g.fillStyle = lg(0, -600, 0, 2600, ['#5a3e2c', '#3a2618']); g.fillRect(-600, -600, 2300, 3200); g.save(); g.globalAlpha = .45; g.fillStyle = pat(TEX.wood); g.fillRect(-600, -600, 2300, 3200); g.restore();
  g.fillStyle = '#2a1a10'; g.fillRect(-600, 1350, 2300, 30);
  rr(150, 380, 260, 320, 6); fs('#c8a050', 8); rr(170, 400, 220, 280, 4); g.fillStyle = '#e8e2d6'; g.fill(); g.save(); rr(170, 400, 220, 280, 4); g.clip(); g.globalAlpha = .9; manReal(240, 690, 260, { t, cloth: YOU, lx: -1, smile: 1 }); manReal(320, 690, 245, { t, cloth: { ...WIFE, dress: ['#f6f4ee', '#d8d4c8', '#8a8478'] }, female: 1, lx: -1, smile: 1 }); g.restore();
  const sx = 840, sy = 760; rr(sx - 120, sy, 240, 20, 4); fs('#4a3020', 3); ell(sx, sy - 70, 40, 70); fs(lg(0, sy - 140, 0, sy, ['#c8283a', '#7a1020']), 3); circ(sx, sy - 150, 26, '#e8c8a0'); path([[sx - 26, sy - 172], [sx + 26, sy - 172], [sx, sy - 214]]); g.closePath(); fs('#e0b840', 3); candle(sx - 80, sy, 40, t); candle(sx + 80, sy, 40, t);
  if (o.lamp !== 0) { line([[980, -600], [980, 220]], 4, '#1a1410'); path([[900, 220], [1060, 220], [1020, 120], [940, 120]]); g.closePath(); fs('#e8d4a8', 3); L(980, 260, 1300, C.gold, .95, .3); }
}
function sofa(x, y, w, h) { rr(x, y, w, h * .55, 40); fs(lg(0, y, 0, y + h * .55, ['#6a4a3a', '#3a2418']), 4); rr(x - 30, y + h * .4, w + 60, h * .5, 40); fs(lg(0, y + h * .4, 0, y + h, ['#7a5644', '#40281c']), 4); for (const sg of [0, 1]) { rr(x - 60 + sg * (w + 40), y + h * .2, 80, h * .7, 30); fs('#5a3a2a', 4); } }
function tomb(x, y, s, name, yrs, t, o = {}) {      // a stone grave marker, with moss growing over time (moss 0..1)
  const { moss = 0, flowers = 1 } = o;
  rr(x - s * .5, y - s * 1.2, s, s * 1.2, [s * .45, s * .45, 4, 4]); g.fillStyle = lg(x - s * .5, 0, x + s * .5, 0, ['#a8a49c', '#8a867e', '#5a5650']); g.fill(); g.strokeStyle = 'rgba(30,28,24,.6)'; g.lineWidth = 2; g.stroke();
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${hash(i) > .5 ? '255,255,250' : '20,18,16'},.12)`; g.fillRect(x - s * .45 + hash(i * 2.3) * s * .9, y - s * 1.15 + hash(i * 3.7) * s * 1.1, 2, 2); }
  line([[x - s * .1, y - s * .95], [x + s * .1, y - s * .95]], s * .04, '#4a4640'); line([[x, y - s * 1.05], [x, y - s * .8]], s * .04, '#4a4640');
  text(name, x, y - s * .6, s * .16, '#2a2824', 'Anton'); text(yrs, x, y - s * .4, s * .1, '#3a3834', 'Anton');
  if (moss > 0) for (let i = 0; i < 80 * moss; i++) { const mx = x - s * .5 + hash(i * 4.4) * s, my = y - hash(i * 6.6) ** 2 * s * 1.1; circ(mx, my, s * (.02 + .04 * hash(i)), `rgba(${60 + 40 * hash(i)},${90 + 50 * hash(i * 2)},50,.75)`); }
  if (flowers) for (let k = 0; k < 7; k++) { const fx = x - s * .3 + k * s * .1; line([[fx, y], [fx + (hash(k) - .5) * 20, y - s * .3]], 3, '#3a6a2a'); for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; ell(fx + (hash(k) - .5) * 20 + Math.cos(a) * 8, y - s * .3 + Math.sin(a) * 8, 7, 4, a); g.fillStyle = '#f4f2ea'; g.fill(); } }
}
function idCard(x, y, w, ang, name, yr, t, o = {}) {      // a national ID: photo, name, year, a hologram stripe
  const h = w * .63; g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = 'rgba(0,0,0,.35)'; rr(-w / 2 + 10, -h / 2 + 14, w, h, 18); g.fill();
  rr(-w / 2, -h / 2, w, h, 18); g.fillStyle = lg(-w / 2, -h / 2, w / 2, h / 2, o.cols || ['#e8f0f4', '#c8dce6']); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = o.band || '#1c4a8a'; g.fillRect(-w / 2, -h / 2 + 16, w, h * .14); text('REPUBLIKA NG PILIPINAS', 0, -h / 2 + 16 + h * .07, h * .07, '#fff', 'Anton');
  rr(-w / 2 + 24, -h * .22, w * .3, h * .62, 6); g.fillStyle = '#d8dee4'; g.fill(); g.save(); rr(-w / 2 + 24, -h * .22, w * .3, h * .62, 6); g.clip(); bust(-w / 2 + 24 + w * .15, -h * .22 + h * .72, w * .26, { t, skin: YOU.skin, hair: YOU.hair, shirt: YOU.shirt, lx: -1 }); g.restore();
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#5a6a7a'; g.font = `${h * .06}px Anton`; g.fillText('PANGALAN', -w / 2 + w * .4, -h * .14); g.fillText('TAON NG ISYU', -w / 2 + w * .4, h * .1);
  g.fillStyle = '#16202a'; g.font = `${h * .1}px Anton`; g.fillText(name, -w / 2 + w * .4, -h * .03); g.fillText(String(yr), -w / 2 + w * .4, h * .21);
  g.save(); rr(-w / 2, -h / 2, w, h, 18); g.clip(); const sx = ((t * 120) % (w * 2)) - w; g.fillStyle = lg(sx - 60, 0, sx + 60, 0, ['rgba(255,255,255,0)', 'rgba(200,255,240,.35)', 'rgba(255,200,255,.25)', 'rgba(255,255,255,0)']); g.fillRect(sx - 60, -h / 2, 120, h); g.restore();
  g.restore();
}
function hourglass(x, y, s, t, k) {        // sand running the wrong way: up
  g.save(); g.translate(x, y);
  for (const sg of [-1, 1]) { rr(-s * .62, sg * s * 1.05 - s * .08, s * 1.24, s * .16, s * .04); fs(lg(-s * .6, 0, s * .6, 0, ['#5a3a20', '#8a6038', '#3a2410']), 2); }
  for (const sg of [-1, 1]) line([[sg * s * .55, -s * .97], [sg * s * .55, s * .97]], s * .05, '#6a4a28');
  const G = () => { g.beginPath(); g.moveTo(-s * .45, -s * .95); g.bezierCurveTo(-s * .45, -s * .3, -s * .06, -s * .15, -s * .05, 0); g.bezierCurveTo(-s * .06, s * .15, -s * .45, s * .3, -s * .45, s * .95); g.lineTo(s * .45, s * .95); g.bezierCurveTo(s * .45, s * .3, s * .06, s * .15, s * .05, 0); g.bezierCurveTo(s * .06, -s * .15, s * .45, -s * .3, s * .45, -s * .95); g.closePath(); };
  G(); g.fillStyle = 'rgba(200,220,255,.08)'; g.fill();
  g.save(); G(); g.clip(); const top = s * (.15 + .6 * k), bot = s * (.75 - .6 * k);
  g.fillStyle = lg(0, -s, 0, s, ['#e8c890', '#c89a58']); g.beginPath(); g.moveTo(-s * .5, -s * .95); g.lineTo(s * .5, -s * .95); g.lineTo(s * .5, -s * .95 + top); g.quadraticCurveTo(0, -s * .95 + top - s * .15, -s * .5, -s * .95 + top); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-s * .5, s * .95); g.lineTo(s * .5, s * .95); g.lineTo(s * .5, s * .95 - bot); g.quadraticCurveTo(0, s * .95 - bot - s * .2, -s * .5, s * .95 - bot); g.closePath(); g.fill();
  for (let i = 0; i < 30; i++) { const p = ((t * 1.5 + i / 30) % 1); circ((hash(i) - .5) * s * .03, s * .5 - p * s * 1.2, s * .012, `rgba(240,210,150,${.9 * Math.sin(Math.PI * p)})`); }
  g.restore(); G(); g.strokeStyle = 'rgba(220,235,255,.5)'; g.lineWidth = s * .015; g.stroke();
  line([[-s * .3, -s * .8], [-s * .25, -s * .4]], s * .03, 'rgba(255,255,255,.35)');
  g.restore(); L(x, y, s * 2.4, C.gold, .8, .2);
}
// ---------- water ----------
function sea(t, y0, o = {}) {        // open water to the horizon: swells, glints, a reflected sky colour
  const { c0 = '#1a3a58', c1 = '#08182a', glint = C.gold, ga = .6, sunX = 540 } = o;
  g.fillStyle = lg(0, y0, 0, y0 + 1400, [c0, c1]); g.fillRect(-900, y0, 2900, 2000);
  for (let r = 0; r < 60; r++) { const v = r / 60, y = y0 + v * v * 1400, amp = 2 + 26 * v; g.beginPath(); for (let x = -900; x <= 2000; x += 30) g.lineTo(x, y + Math.sin(x * (.012 / (v + .2)) + t * (1 + v) + r) * amp); g.strokeStyle = `rgba(255,255,255,${.04 + .06 * v})`; g.lineWidth = 1 + 3 * v; g.stroke(); }
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 180; i++) { const v = hash(i * 1.7), y = y0 + v * v * 1300, x = sunX + (hash(i * 3.3) - .5) * (100 + 900 * v) + Math.sin(t * 2 + i) * 10, a = Math.max(0, Math.sin(t * 3 + i * 1.3)); g.fillStyle = `rgba(${glint},${ga * a * (1 - v * .5)})`; g.fillRect(x - 8 - 20 * v, y, 16 + 40 * v, 2 + 3 * v); } g.restore();
}
function quiapo(x, y, s, t) {      // the church half drowned: the dome, the cross, a bell tower top, streaked with rust and birds
  g.fillStyle = lg(x - s, 0, x + s, 0, ['#d8ccb4', '#b8aa90', '#6a6050']); g.beginPath(); g.moveTo(x - s * .8, y); g.bezierCurveTo(x - s * .8, y - s * .95, x + s * .8, y - s * .95, x + s * .8, y); g.closePath(); g.fill();
  for (let k = 1; k < 8; k++) curve([x - s * .8 + k * s * .2, y], [x - s * .8 + k * s * .2, y - s * .6], [x, y - s * .72], s * .01, 'rgba(60,50,40,.35)');
  rr(x - s * .12, y - s * .95, s * .24, s * .25, s * .03); fs('#c8bca4', s * .01); line([[x, y - s * .95], [x, y - s * 1.4]], s * .05, '#8a7a5a'); line([[x - s * .13, y - s * 1.25], [x + s * .13, y - s * 1.25]], s * .05, '#8a7a5a');
  for (let i = 0; i < 20; i++) { const rx = x - s * .7 + hash(i * 3.1) * s * 1.4; g.fillStyle = lg(0, y - s * .7, 0, y, ['rgba(120,60,30,0)', 'rgba(120,60,30,.35)']); g.fillRect(rx, y - s * .5 * hash(i), s * .02, s * .5 * hash(i)); }
  rr(x + s * 1.3, y - s * .9, s * .4, s * .9, s * .02); fs(lg(0, y - s * .9, 0, y, ['#c8bca4', '#8a7e66']), s * .01); path([[x + s * 1.25, y - s * .9], [x + s * 1.75, y - s * .9], [x + s * 1.5, y - s * 1.3]]); g.closePath(); fs('#9a6a4a', s * .01);
  for (let k = 0; k < 3; k++) { rr(x + s * 1.38 + k * s * .1, y - s * .78, s * .06, s * .2, s * .03); g.fillStyle = '#1a1612'; g.fill(); }
  for (let i = 0; i < 6; i++) { const bx = x + s * (-1 + 2 * ((t * .05 + hash(i)) % 1)) * 1.5, by = y - s * (1.4 + .4 * hash(i * 2)) + Math.sin(t * 2 + i) * 10; curve([bx - 14, by], [bx, by - 8 * Math.abs(Math.sin(t * 6 + i))], [bx + 14, by], 3, '#1a1a1a'); }
}
function bangka(x, y, s, t) {     // an outrigger boat, rocking
  const rk = Math.sin(t * 1.1) * .04; g.save(); g.translate(x, y + Math.sin(t * 1.3) * s * .03); g.rotate(rk);
  for (const sg of [-1, 1]) { line([[sg * s * .3, -s * .05], [sg * s * 1.0, s * .02]], s * .03, '#3a2a1a'); line([[sg * s * 1.0 - s * .5, s * .06], [sg * s * 1.0 + s * .5, s * .06]], s * .05, '#5a4630'); }
  g.beginPath(); g.moveTo(-s * 1.1, -s * .15); g.quadraticCurveTo(0, s * .25, s * 1.1, -s * .15); g.lineTo(s * .9, -s * .02); g.quadraticCurveTo(0, s * .12, -s * .9, -s * .02); g.closePath(); g.fillStyle = lg(0, -s * .15, 0, s * .2, ['#c84a3a', '#6a2418']); g.fill(); line([[-s * 1.0, -s * .12], [s * 1.0, -s * .12]], s * .02, '#f2e2b8');
  g.restore();
}
// ---------- space ----------
function starfield(t, n, a = 1, seed = 0, die = 0) {      // stars of different colours twinkling; die = how many have gone out (0..1)
  for (let i = 0; i < n; i++) { const h_ = hash(i * 1.3 + seed); if (h_ < die) continue; const x = hash(i * 2.7 + seed) * 1400 - 160, y = hash(i * 4.1 + seed) * 2400 - 240, r = .6 + 2.2 * hash(i * 5.9) ** 3, tw = .7 + .3 * Math.sin(t * (1 + 2 * hash(i)) + i);
    const fade = die > 0 ? clamp((h_ - die) / .05) : 1, c = hash(i * 7.1) > .8 ? '255,200,170' : hash(i * 7.1) > .6 ? '180,200,255' : '255,255,255';
    circ(x, y, r, `rgba(${c},${a * tw * fade})`); if (r > 1.8) glow(x, y, r * 6, c, .3 * a * fade); }
}
function nebula(t, x, y, R, c1, c2, a = .4) { for (let i = 0; i < 12; i++) { const ox = x + Math.cos(i * 1.7) * R * .5 * hash(i), oy = y + Math.sin(i * 2.3) * R * .4 * hash(i * 2), rr_ = R * (.3 + .5 * hash(i * 3)); g.fillStyle = rg(ox, oy, 0, rr_, [`rgba(${i % 2 ? c1 : c2},${a * .5})`, `rgba(${i % 2 ? c1 : c2},0)`]); g.fillRect(ox - rr_, oy - rr_, 2 * rr_, 2 * rr_); } }
function redSun(x, y, R, t, a = 1) {     // a red giant: a churning surface, a dark limb, flares lifting off
  glow(x, y, R * 2.4, C.sun, .55 * a);
  g.save(); g.beginPath(); g.arc(x, y, R, 0, TAU); g.clip(); g.fillStyle = rg(x - R * .2, y - R * .2, R * .1, R, ['#fff0b0', '#ffb040', '#e04818', '#7a1806']); g.fillRect(x - R, y - R, 2 * R, 2 * R);
  for (let i = 0; i < 160; i++) { const a_ = hash(i * 2.1) * TAU, d = Math.sqrt(hash(i * 3.3)) * R, cx = x + Math.cos(a_ + t * .02) * d, cy = y + Math.sin(a_ + t * .02) * d, cr = R * (.03 + .05 * hash(i * 4.7)); g.fillStyle = `rgba(${hash(i) > .5 ? '255,220,120' : '120,20,0'},${.12 + .1 * Math.sin(t + i)})`; g.beginPath(); g.arc(cx, cy, cr, 0, TAU); g.fill(); }
  g.fillStyle = rg(x, y, R * .6, R, ['rgba(80,10,0,0)', 'rgba(80,10,0,.6)']); g.fillRect(x - R, y - R, 2 * R, 2 * R); g.restore();
  for (let k = 0; k < 6; k++) { const a_ = hash(k * 9.1) * TAU + t * .03, h_ = R * (.08 + .12 * (.5 + .5 * Math.sin(t * .7 + k))); const bx = x + Math.cos(a_) * R, by = y + Math.sin(a_) * R; curve([bx, by], [bx + Math.cos(a_) * h_ * 2 + Math.cos(a_ + 1.5) * h_, by + Math.sin(a_) * h_ * 2 + Math.sin(a_ + 1.5) * h_], [x + Math.cos(a_ + .12) * R, y + Math.sin(a_ + .12) * R], R * .015, `rgba(255,170,80,${.7 * a})`); }
  L(x, y, R * 3, C.sun, a, .25 * a);
}
function earth(x, y, R, t, o = {}) {     // the Earth from space: oceans, continents, cloud swirls, a thin blue limb; burn = scorched (0..1)
  const { burn = 0, lit = -1 } = o;
  glow(x, y, R * 1.3, burn > .5 ? C.sun : '120,170,255', .3);
  g.save(); g.beginPath(); g.arc(x, y, R, 0, TAU); g.clip();
  g.fillStyle = mixHex('#1e5a9a', '#6a2a14', burn); g.fillRect(x - R, y - R, 2 * R, 2 * R);
  for (let i = 0; i < 26; i++) { const cx = x + (hash(i * 2.1) - .5) * R * 1.8 + t * R * .01, cy = y + (hash(i * 3.3) - .5) * R * 1.8, cr = R * (.1 + .25 * hash(i * 5.5)); g.fillStyle = mixHex('#4a7a3a', '#2a1006', burn); g.beginPath(); g.ellipse(cx, cy, cr, cr * .6, hash(i) * 3, 0, TAU); g.fill(); }
  if (burn < .8) for (let i = 0; i < 30; i++) { const cx = x + (hash(i * 7.1) - .5) * R * 1.9 + t * R * .02, cy = y + (hash(i * 8.3) - .5) * R * 1.9; g.strokeStyle = `rgba(255,255,255,${.5 * (1 - burn)})`; g.lineWidth = R * .03; g.beginPath(); g.arc(cx, cy, R * (.06 + .12 * hash(i)), 0, 4); g.stroke(); }
  g.fillStyle = rg(x - lit * R * .4, y - R * .2, R * .2, R * 1.2, ['rgba(0,0,0,0)', 'rgba(0,0,0,.85)']); g.fillRect(x - R, y - R, 2 * R, 2 * R);
  g.restore(); g.beginPath(); g.arc(x, y, R, 0, TAU); g.strokeStyle = burn > .5 ? 'rgba(255,140,60,.6)' : 'rgba(140,190,255,.6)'; g.lineWidth = R * .02; g.stroke();
}
// heat shimmer: re-draw the frame in thin bands, each nudged sideways by a slow wave (screen space, after the light pass)
const SHIM = mk(W, H);
function shimmer(t, a = 1, y0 = 0, y1 = H) { if (a <= 0) return; const sc = SHIM.getContext('2d'); sc.globalCompositeOperation = 'copy'; sc.drawImage(cv, 0, 0); reset();
  for (let y = y0; y < y1; y += 6) { const dx = Math.sin(y * .03 + t * 5) * 4 * a + Math.sin(y * .011 - t * 3) * 3 * a; g.drawImage(SHIM, 0, y, W, 6, dx, y, W, 6); } }
// warm light leaks drifting at the edges of a memory
function leaks(t, a) { if (a <= 0) return; reset(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 4; i++) { const x = 540 + Math.cos(t * .3 + i * 1.6) * 600, y = 900 + Math.sin(t * .23 + i * 2.1) * 900; g.fillStyle = rg(x, y, 0, 700, [`rgba(255,${150 + 40 * i},80,${.22 * a})`, 'rgba(255,150,80,0)']); g.fillRect(x - 700, y - 700, 1400, 1400); } reset(); }
function palm(x, y, h, t, k = 0, col = '#03050b') {          // a coconut palm in silhouette
  const sw = Math.sin(t * .6 + k) * h * .012, tx = x + h * .13 + sw, ty = y - h;
  g.beginPath(); g.moveTo(x - h * .028, y); g.quadraticCurveTo(x + h * .015, y - h * .55, tx - h * .013, ty); g.lineTo(tx + h * .013, ty); g.quadraticCurveTo(x + h * .06, y - h * .55, x + h * .028, y); g.closePath(); g.fillStyle = col; g.fill();
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .4 + Math.sin(t * .9 + i + k) * .05, Lf = h * (.3 + .08 * hash(i + k)), ex = tx + Math.cos(a) * Lf, ey = ty + Math.sin(a) * Lf * .5 + Lf * .45 * Math.abs(Math.cos(a)), cx = tx + Math.cos(a) * Lf * .55, cy = ty + Math.sin(a) * Lf * .55 - Lf * .12;
    curve([tx, ty], [cx, cy], [ex, ey], h * .008, col);
    for (let j = 1; j < 13; j++) { const u = j / 13, px = (1 - u) * (1 - u) * tx + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * ty + 2 * (1 - u) * u * cy + u * u * ey; for (const sg of [-1, 1]) line([[px, py], [px + sg * h * .018 * (1 - u * .4), py + h * .055 * (1 - u * .5)]], h * .005, col); } }
  for (let i = 0; i < 3; i++) circ(tx + (i - 1) * h * .015, ty + h * .02, h * .014, col);
}

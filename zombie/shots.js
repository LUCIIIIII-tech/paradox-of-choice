
// ---------- the story: event times come from words in the script, so the picture follows the narrator ----------
function T(id) { return LN[id].t0; } function E(id) { return LN[id].t1; }
const S_SCREAM = wordT('l03', 'sumigaw'), S_LUNGE = wordT('l04', 'sumunggab'), S_TURN2 = wordTx('l04', 'isa');
const S_ALARM = T('l05') - .12, S_FLEE = S_ALARM + .3, S_JAM = T('l08'), S_HOOK = S_JAM + 1.4;   // the alarm and the red strobes land just before the cut to the wide; S_HOOK = the hook's moment (the jam)
const lerpA = (a, b, u) => a + (b - a) * u;
const run_ = (v, dt) => dt <= 0 ? 0 : dt < .5 ? v * dt * dt : v * (dt - .25);     // distance with half a second of acceleration
const tone3 = h => { const c = parseInt(h.slice(1), 16), r = c >> 16, gg = (c >> 8) & 255, b = c & 255, f = (k) => `rgb(${Math.min(255, Math.round(r * k))},${Math.min(255, Math.round(gg * k))},${Math.min(255, Math.round(b * k))})`; return [f(1.35), f(1), f(.55)]; };
const pickH = (arr, k) => arr[Math.floor(hash(k) * arr.length) % arr.length];
const PAL = { shirt: ['#2f4f6f', '#7a2c2c', '#3f6a3a', '#9a8f6a', '#c9c3b5', '#3b3b46', '#6a4a7a', '#b0602d', '#1f4a5d', '#8a7a4f', '#e0dccf', '#8c2f4a', '#d9c27a', '#2a6a6a'],
  pants: ['#1f2a3a', '#2b2b2b', '#3d3328', '#55524a', '#16181d', '#4a3f35', '#2a3d5a'], skin: [SKIN, ['#e8b894', '#c08a68', '#7a5038'], ['#c48a64', '#9a6444', '#5a3624'], ['#a8714e', '#80523a', '#4a2c1c']],
  hair: [HAIRC, ['#2a1d14', '#1d1410', '#0b0807'], ['#3a2a1e', '#22170f', '#0e0906']] };
const ZSK = [['#b9c2a6', '#8d9a80', '#4f5a48'], ['#aab4a0', '#7f8b76', '#465042']], ZCL = ['#3a3530', '#2d3238', '#4a3d33', '#33302a'];
const HB = { hood: ['#ff9a4a', '#e0672a', '#7a3212'], legs: ['#4a5878', '#2c3652', '#161c30'], skin: PAL.skin[2], hair: HAIRC, h: 1.72, seed: 3, rim: 'rgba(255,190,120,.75)', hl: 1, keep: 1 };   // the hero: the orange hoodie

// ---------- the mall: a one-point perspective set (X across, Y up, Z into the picture, metres) ----------
const PC = { x: 0, y: 1.6, z: 0, F: 1000, hy: 960 };          // the camera: position, focal length (px), horizon height on screen
const prj = (X, Y, Z) => { const d = Math.max(.05, Z - PC.z), k = PC.F / d; return [CX + (X - PC.x) * k, PC.hy - (Y - PC.y) * k, k]; };
function poly(pts, fill, stroke = null, lw = 2) { g.beginPath(); pts.forEach(([X, Y, Z], i) => { const [x, y] = prj(X, Y, Z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
const HW = 9, GX = 6, LV = [4.6, 9.2], ROOF = 13, DZ = 22, EXZ = [4.2, 6.4];      // half-width, gallery edge, gallery floors, roof, the doors, the fire-exit opening (left wall)
const BEACONS = [[-3.8, 3.4, DZ - .1], [3.8, 3.4, DZ - .1], [-GX, 3.95, 14], [GX, 3.95, 14], [-GX, 3.95, 8], [GX, 3.95, 8]];   // the red emergency strobes
function hallSky(t) {
  grad('#05081a', '#1a2448', -900, 1300);
  for (let i = 0; i < 140; i++) { const x = hash(i * 3.7) * W, y = hash(i * 5.1) * 900; circ(x, y, .8 + 1.6 * hash(i), `rgba(220,230,255,${.25 + .5 * hash(i + 1) * (.6 + .4 * Math.sin(t * 1.3 + i))})`); }
  const [mx, my] = prj(-4, 30, 60); fullMoon(mx, my, 34); L(mx, my, 500, C.moon, .5, .15);
}
// the night street seen through the glass doors: lamps, a skyline, and (after the alarm) them, pressed against the glass
function street(t, o) {
  const p0 = prj(-3.2, 0, DZ), p1 = prj(3.2, 3.2, DZ); const x0 = p0[0], y0 = p1[1], x1 = p1[0], y1 = p0[1];
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  g.fillStyle = lg(0, y0, 0, y1, ['#1a2448', '#3a4672', '#2c3046']); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.drawImage(TEX.city, 0, 0, TEX.city.width, TEX.city.height, x0 - (x1 - x0) * .3, y0 + (y1 - y0) * .05, (x1 - x0) * 1.6, (y1 - y0) * .62);
  for (const sx of [-.2, .55]) { const lx = lerp(x0, x1, sx + .25), ly = lerp(y0, y1, .18); line([[lx, ly], [lx, y1]], 4, '#141418'); circ(lx, ly, 6, '#ffd08a'); L(lx, ly, 260, C.amb, .8, .35); }
  if (o.alarm > 0) for (let k = 0; k < 9; k++) {     // the infected outside, pressed to the glass
    const u = (k + .5) / 9, x = lerp(x0, x1, u) + 8 * Math.sin(t * 1.3 + k), h = (y1 - y0) * (.62 + .1 * hash(k)), a = clamp((o.alarm - .2 - k * .05) * 2) * o.zf;
    shambler(x, y1 + 4, h, t + k, { col: '#0b0c10', alpha: a, ph: k * 1.7, eyes: a, rim: `rgba(255,60,70,${.6 * o.alarm})` });
    for (const sg of [-1, 1]) { const px = x + sg * h * .15, py = y1 + 4 - h * (.66 + .03 * Math.sin(t * 2 + k + sg)); g.save(); g.globalAlpha = a * .85; ell(px, py, h * .03, h * .036); g.fillStyle = '#9aa294'; g.fill(); for (let f = 0; f < 4; f++) line([[px + (f - 1.5) * h * .014, py - h * .02], [px + (f - 1.5) * h * .018, py - h * .06]], h * .011, '#9aa294'); g.restore(); }   // palms on the glass
    if (a > .3) L(x, y1 + 4 - h * .87, h * .16, '230,240,220', .9 * a, .65 * a);
  }
  g.restore();
  // the glass: reflections, frames, the push bars
  g.fillStyle = 'rgba(160,190,220,.06)'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let k = 0; k <= 4; k++) { const [x] = prj(-3.2 + k * 1.6, 0, DZ); line([[x, y0], [x, y1]], 6, '#3a3226'); }
  line([[x0, y0], [x1, y0]], 8, '#4a3e2a'); for (let k = 0; k < 4; k++) { const [a, b] = prj(-2.9 + k * 1.6, 1.05, DZ - .02), [c] = prj(-1.9 + k * 1.6, 1.05, DZ - .02); line([[a, b], [c, b]], 4, '#b89a5a'); }
}
function shopFront(side, Z0, Z1, Y0, k, lit = 1) {      // a shop on a side wall: a glowing window with goods, a sign band, a dark frame
  const X = side * HW, Y1 = Y0 + 3.6, cols = ['#e8b878', '#f0c890', '#e0a868', '#ecc088'];
  poly([[X, Y0, Z0], [X, Y1 + .6, Z0], [X, Y1 + .6, Z1], [X, Y0, Z1]], '#1e1a1c');
  const w0 = Z0 + .25, w1 = Z1 - .25, wy0 = Y0 + .25, wy1 = Y0 + 2.7;
  poly([[X, wy0, w0], [X, wy1, w0], [X, wy1, w1], [X, wy0, w1]], cols[k % 4]);
  for (let j = 0; j < 4; j++) { const z = lerp(w0, w1, (j + .5) / 4), c = ['#b8432f', '#2f5d8a', '#c99a3e', '#3f6b45', '#8a3f6b', '#5a4030'][(k + j) % 6];
    if (k % 2) poly([[X - side * .01, wy0, z - .25], [X - side * .01, wy0 + 1.7 + .3 * hash(k + j), z - .25], [X - side * .01, wy0 + 1.7 + .3 * hash(k + j), z + .25], [X - side * .01, wy0, z + .25]], c);
    else { poly([[X - side * .01, wy0 + .2, z - .2], [X - side * .01, wy0 + 1.5, z - .25], [X - side * .01, wy0 + 1.5, z + .25], [X - side * .01, wy0 + .2, z + .2]], c); const [hx, hy, hk] = prj(X - side * .01, wy0 + 1.72, z); circ(hx, hy, .17 * hk, '#e9dcc8'); } }
  poly([[X, wy0, w0], [X, wy1, w0], [X, wy1, w1], [X, wy0, w1]], null, '#b89a5a', 3);
  poly([[X, Y1 - .55, w0], [X, Y1 - .05, w0], [X, Y1 - .05, w1], [X, Y1 - .55, w1]], '#120e0b', '#b89a5a', 2);
  const [sx, sy, sk] = prj(X, Y1 - .3, (w0 + w1) / 2); g.save(); g.translate(sx, sy); g.transform(1, side * .32 * (1 - Math.min(1, sk / 400)), 0, 1, 0, 0); text(TX.shops[k % TX.shops.length], 0, 0, Math.max(6, .34 * sk), '#f2d7a4', 'Anton'); g.restore();
  const [lx, ly, lk] = prj(X - side * .3, wy0 + 1.4, (w0 + w1) / 2); if (lit) L(lx, ly, 3 * lk, C.warm, .6 * lit, .25);
}
function backShop(x0, x1, Y, k) {         // a shop on the back wall: a sign band, a lit window with shelves of goods (or two mannequins)
  const Z = DZ - .03, [a, b] = prj(x0, Y + 2.9, Z), [c, d] = prj(x1, Y + .25, Z), w = c - a, h = d - b, wy = b + h * .2, wb = d - h * .03;
  g.fillStyle = '#15100d'; g.fillRect(a, b, w, h);
  g.fillStyle = lg(0, wy, 0, wb, ['#f0c48a', '#b88050', '#4a2e1a']); g.fillRect(a + w * .04, wy, w * .92, wb - wy);
  if (k % 3 === 1) for (let m = 0; m < 2; m++) { const mx = a + w * (.3 + m * .4), mh = (wb - wy) * .8, col = ['#8a2f4a', '#2f5d8a', '#c99a3e'][(k + m) % 3];
    line([[mx, wb - mh * .25], [mx, wb]], Math.max(1, w * .012), '#3a2a1a'); path([[mx - mh * .09, wb - mh * .78], [mx + mh * .09, wb - mh * .78], [mx + mh * .2, wb - mh * .25], [mx - mh * .2, wb - mh * .25]]); g.closePath(); g.fillStyle = col; g.fill(); circ(mx, wb - mh * .88, mh * .08, '#e8dcc8'); }
  else for (let j = 0; j < 3; j++) { const yy = lerp(wy, wb, .32 + j * .25); g.fillStyle = 'rgba(40,24,14,.75)'; g.fillRect(a + w * .04, yy, w * .92, h * .025);
    for (let m = 0; m < 7; m++) { const q = hash(k * 31 + j * 7 + m), gh = h * (.07 + .06 * q); g.fillStyle = ['#b8432f', '#2f5d8a', '#c99a3e', '#3f6b45', '#8a3f6b', '#e9dcc8', '#5a4030'][(k + j * 2 + m) % 7]; g.fillRect(a + w * (.07 + m * .125), yy - gh, w * .09, gh); } }
  g.strokeStyle = '#b89a5a'; g.lineWidth = Math.max(1, w * .012); g.strokeRect(a + w * .04, wy, w * .92, wb - wy);
  text(TX.shops[k % TX.shops.length], a + w / 2, b + h * .1, h * .11, '#f2d7a4', 'Anton');
  L(a + w / 2, lerp(wy, wb, .4), w * .75, C.warm, .42, .14);
}
function billboard(x0, x1, Y) {           // the red LED screen on the top floor
  const [a, b] = prj(x0, Y + 2.9, DZ - .04), [c, d] = prj(x1, Y + .35, DZ - .04), k = (c - a) / (x1 - x0);
  g.fillStyle = '#140808'; g.fillRect(a - .1 * k, b - .1 * k, c - a + .2 * k, d - b + .2 * k);
  g.fillStyle = lg(0, b, 0, d, ['#b0202c', '#5a0c14']); g.fillRect(a, b, c - a, d - b);
  for (let y = b; y < d; y += Math.max(3, .08 * k)) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(a, y, c - a, Math.max(1, .03 * k)); }
  text(TX.sale, (a + c) / 2, lerp(b, d, .36), .95 * k, '#fff1e0', 'Anton'); text('50% OFF', (a + c) / 2, lerp(b, d, .76), .62 * k, '#ffd36a', 'Anton');
  L((a + c) / 2, (b + d) / 2, (c - a) * .8, C.red, .65, .22);
}
// draw the hall. o: { alarm (0..1, red strobes), zf (the infected, 0..1), people: [...] }
function hall(t, o) {
  const al = o.alarm || 0, zf = o.zf ?? 1;
  hallSky(t);
  // the glass roof: ribs over the night sky
  for (let k = -3; k <= 3; k++) poly([[k * 2, ROOF, 1], [k * 2 + .06, ROOF, 1], [k * 2 + .06, ROOF, DZ], [k * 2, ROOF, DZ]], 'rgba(40,34,30,.9)');
  for (let z = 2; z <= DZ; z += 2.5) poly([[-GX, ROOF, z], [GX, ROOF, z], [GX, ROOF, z + .08], [-GX, ROOF, z + .08]], 'rgba(40,34,30,.9)');
  // the back wall: the doors, the shops beside them, the mall's name, two floors of shops and the red screen
  poly([[-HW, 0, DZ], [-HW, ROOF, DZ], [HW, ROOF, DZ], [HW, 0, DZ]], '#2a2420');
  street(t, { alarm: al, zf });
  for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { const x0 = sd * (3.8 + k * 2.6), x1 = x0 + sd * 2.2; backShop(Math.min(x0, x1), Math.max(x0, x1), -.25, k * 5 + (sd > 0 ? 2 : 0)); }
  { const [sx, sy, sk] = prj(0, 3.75, DZ - .05); g.save(); g.shadowColor = 'rgba(255,200,120,.9)'; g.shadowBlur = 20; text(TX.mall, sx, sy, .52 * sk, '#ffe2b0', 'Anton'); g.restore(); L(sx, sy, 3 * sk, C.warm, .7, .25); }
  for (const Y of LV) { poly([[-HW, Y - .5, DZ - .01], [-HW, Y, DZ - .01], [HW, Y, DZ - .01], [HW, Y - .5, DZ - .01]], '#3a3028'); poly([[-HW, Y + 1.0, DZ - .02], [HW, Y + 1.0, DZ - .02], [HW, Y + 1.06, DZ - .02], [-HW, Y + 1.06, DZ - .02]], '#c9a45e');
    for (let k = 0; k < 6; k++) { const x0 = -HW + .6 + k * 3; if (Y === LV[1] && k === 2) billboard(x0, x0 + 5.4, Y); else if (!(Y === LV[1] && k === 3)) backShop(x0, x0 + 2.4, Y, k + (Y === LV[0] ? 1 : 4)); } }
  // the floor: dark and pale marble, polished (the lit shop fronts and the doors shine in it)
  for (let z = DZ; z > PC.z + .4; z -= 1) for (let x = -HW; x < HW; x += 1) poly([[x, 0, z], [x + 1, 0, z], [x + 1, 0, Math.max(PC.z + .4, z - 1)], [x, 0, Math.max(PC.z + .4, z - 1)]], (Math.floor(x) + Math.floor(z)) % 2 === 0 ? '#1d1914' : '#8c8170');
  const zs = []; for (let z = DZ; z > PC.z + .6; z -= 3.6) zs.push(z);
  g.save(); g.globalCompositeOperation = 'screen';
  for (const side of [-1, 1]) for (let i = 0; i < zs.length; i++) { const z = zs[i] - 1.8; if (z < PC.z + 1) continue; const [x, y, k] = prj(side * (HW - .4), 0, z); g.fillStyle = lg(0, y, 0, y + 2.5 * k, ['rgba(255,200,130,.2)', 'rgba(255,200,130,0)']); g.fillRect(x - .9 * k, y, 1.8 * k, 2.5 * k); }
  { const [x0, y0] = prj(-3.2, 0, DZ), [x1, , k] = prj(3.2, 0, DZ); g.fillStyle = lg(0, y0, 0, y0 + 3 * k, [al > 0 ? `rgba(255,70,70,${.3 * al})` : 'rgba(120,150,220,.15)', 'rgba(0,0,0,0)']); g.fillRect(x0, y0, x1 - x0, 3 * k); }
  g.restore();
  // the side walls, far to near: shop fronts on three levels, the fire exit on the left
  const seg_ = i => [Math.max(PC.z + .6, zs[i] - 3.6), zs[i]];
  for (const side of [-1, 1]) for (let i = 0; i < zs.length; i++) { const [z0, z1] = seg_(i);
    if (side < 0 && z0 < EXZ[1] && z1 > EXZ[0]) {                      // the fire-exit opening and its green sign
      poly([[-HW, 0, EXZ[0]], [-HW, 3.4, EXZ[0]], [-HW, 3.4, EXZ[1]], [-HW, 0, EXZ[1]]], '#06070a');
      const [ex, ey, ek] = prj(-HW + .05, 3.75, (EXZ[0] + EXZ[1]) / 2); g.save(); g.translate(ex, ey); g.transform(1, -.3, 0, 1, 0, 0); rr(-ek * .55, -ek * .2, ek * 1.1, ek * .4, ek * .05); g.fillStyle = '#04140a'; g.fill(); g.shadowColor = 'rgba(80,255,150,.9)'; g.shadowBlur = 18; text(TX.exit, 0, 2, ek * .32, '#7dffae', 'Anton'); g.restore(); L(ex, ey, 2.5 * ek, C.grn, .8, .35);
    } else shopFront(side, z0, z1, 0, i * 3 + (side > 0 ? 7 : 0)); }
  if (PC.y > LV[0]) for (const side of [-1, 1]) poly([[side * GX, LV[0], DZ], [side * HW, LV[0], DZ], [side * HW, LV[0], PC.z + .6], [side * GX, LV[0], PC.z + .6]], '#2e2620');   // the first gallery's walkway, seen from above
  for (const side of [-1, 1]) for (let i = 0; i < zs.length; i++) { const [z0, z1] = seg_(i); for (const Y of LV) shopFront(side, z0, z1, Y + .1, i * 3 + (side > 0 ? 8 : 1), .8); }
  for (const side of [-1, 1]) for (const Y of LV) {          // the galleries: the slab edge, a warm cove under it, glass and a brass rail
    poly([[side * GX, Y - .5, DZ], [side * GX, Y, DZ], [side * GX, Y, PC.z + .6], [side * GX, Y - .5, PC.z + .6]], '#3a3028');
    poly([[side * GX, Y - .55, DZ], [side * GX, Y - .5, DZ], [side * GX, Y - .5, PC.z + .6], [side * GX, Y - .55, PC.z + .6]], '#ffd6a0');
    poly([[side * GX, Y, DZ], [side * GX, Y + 1.05, DZ], [side * GX, Y + 1.05, PC.z + .6], [side * GX, Y, PC.z + .6]], 'rgba(150,180,210,.08)');
    poly([[side * GX, Y + 1.0, DZ], [side * GX, Y + 1.07, DZ], [side * GX, Y + 1.07, PC.z + .6], [side * GX, Y + 1.0, PC.z + .6]], '#c9a45e');
    for (let z = DZ; z > PC.z + .8; z -= 2) { const [lx, ly, lk] = prj(side * GX, Y - .6, z); L(lx, ly, 1.5 * lk, C.warm, .45, .18); }
  }
  // columns, the red sale banners, the strobes (dark until the alarm)
  for (const z of [17, 12, 7]) if (z > PC.z + .5) for (const side of [-1, 1]) { const [x0, y0, k] = prj(side * GX - .3, ROOF, z), [x1, y1] = prj(side * GX + .3, 0, z);
    g.fillStyle = lg(x0, 0, x1, 0, ['#4a3e33', '#9a8a72', '#3a3028']); g.fillRect(x0, y0, x1 - x0, y1 - y0); for (const Y of [.4, ...LV.map(v => v - .3)]) { const [, yy] = prj(0, Y, z); g.fillStyle = '#c9a45e'; g.fillRect(x0 - 3, yy - .08 * k, x1 - x0 + 6, .16 * k); } }
  for (const [bx, bz] of [[-5.6, 15], [5.6, 10.5]]) { if (bz < PC.z + 1) continue; poly([[bx - .7, ROOF - .6, bz], [bx + .7, ROOF - .6, bz], [bx + .7, ROOF - 5, bz], [bx - .7, ROOF - 5, bz]], '#8e2a24'); const [sx, sy, sk] = prj(bx, ROOF - 2.8, bz); g.save(); g.translate(sx, sy); g.rotate(-Math.PI / 2); text(TX.sale, 0, 0, .7 * sk, '#fff1d6', 'Anton'); g.restore(); }
  const sv = k => .5 + .5 * Math.sin(t * 7.5 + k * Math.PI);
  BEACONS.forEach(([X, Y, Z], k) => { if (Z < PC.z + .6) return; const [x, y, kk] = prj(X, Y, Z); g.beginPath(); g.arc(x, y, .13 * kk, Math.PI, TAU); g.closePath(); g.fillStyle = al > 0 ? `rgb(255,${70 + 90 * sv(k)},${70 + 60 * sv(k)})` : '#4a1418'; g.fill(); g.fillStyle = '#1a1a1e'; g.fillRect(x - .17 * kk, y, .34 * kk, .05 * kk); });
  // the fountain (centre of the hall): water, rings, arcs from the spout
  if (12 > PC.z + 1.5) { const ring = (r, y) => { const pts = []; for (let a = 0; a <= TAU + .01; a += TAU / 40) pts.push([Math.sin(a) * r, y, 12 + Math.cos(a) * r]); return pts; };
    poly(ring(2.2, .55), '#cbbd9f', '#6a5a40', 2); poly(ring(1.95, .5), '#12263a');
    for (let k = 0; k < 3; k++) { const r_ = .3 + 1.6 * ((t * .3 + k / 3) % 1); poly(ring(r_, .5), null, `rgba(170,210,240,${.35 * (1 - r_ / 1.9)})`, 2); }
    const [fx, fy, fk] = prj(0, .55, 12); for (let k = 0; k < 6; k++) circ(fx + (k - 2.5) * .55 * fk, fy + .05 * fk, .05 * fk, '#ffd08a');
    const [sx, sy0] = prj(0, .5, 12), [, sy1, sk] = prj(0, 2.6, 12); g.fillStyle = lg(sx - .3 * sk, 0, sx + .3 * sk, 0, ['#6a5a40', '#d8cba8', '#5a4a34']); path([[sx - .35 * sk, sy0], [sx - .12 * sk, sy1], [sx + .12 * sk, sy1], [sx + .35 * sk, sy0]]); g.closePath(); g.fill();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, [p0x, p0y] = prj(0, 2.6, 12), [cx_, cy_] = prj(Math.sin(a) * .9, 3.4, 12 + Math.cos(a) * .9), [p1x, p1y, pk] = prj(Math.sin(a) * 1.5, .5, 12 + Math.cos(a) * 1.5); g.beginPath(); g.moveTo(p0x, p0y); g.quadraticCurveTo(cx_, cy_, p1x, p1y); g.strokeStyle = 'rgba(200,230,255,.45)'; g.lineWidth = Math.max(1, .035 * pk); g.stroke(); }
    L(fx, fy - 1.2 * fk, 2.6 * fk, C.amb, .5, .25); }
  // the people, back to front; anyone right at the lens fades out (except the ones the shot is about)
  const NEAR = o.near ?? 1.5, ppl = (o.people || []).map(p => [p, p.Z - PC.z]).filter(([p, d]) => d > (p.keep ? .8 : NEAR)).sort((a, b) => b[1] - a[1]);
  for (const [p, d] of ppl) { const a = (p.keep ? 1 : clamp((d - NEAR) / .7)) * (p.fade ?? 1); if (a < .02) continue; g.globalAlpha = a; drawPerson(t, p); g.globalAlpha = 1; }
  // the light: the red strobes once the alarm goes; then darken everything but the lights
  if (al > 0) BEACONS.forEach(([X, Y, Z], k) => { if (Z < PC.z + .6) return; const [x, y, kk] = prj(X, Y, Z), s = sv(k); L(x, y, 7 * kk, C.red, al * (.4 + .6 * s), .55 * al * s); });
  lightPass(al > 0 ? '#52283a' : '#3a3460');
}
// a person in the hall: p = { X, Z, h (m), face: 'front'|'back', walk, arms, colours, zombie, fallen, look, eyes, mouth, glow, hl (a soft light on them) }
function drawPerson(t, p) {
  const [x, y, k] = prj(p.X, 0, p.Z), h = (p.h || 1.7) * k; if (h < 6) return;
  const o = { t: t + (p.seed || 0), walk: p.walk ?? null, arms: p.arms || 'down', hood: p.hood, legs: p.legs, skin: p.skin, hair: p.hair, outfit: p.outfit || 'hoodie', back: p.face === 'back', cap: p.cap, glasses: p.glasses,
    eyes: p.eyes || 'open', mouth: p.mouth || 0, look: p.look || 0, lookY: p.lookY || 0, lx: p.X < PC.x ? 1 : -1, rim: p.rim || (p.zombie ? 'rgba(170,230,200,.5)' : 'rgba(255,200,150,.5)'), zombie: p.zombie || 0, slump: p.slump || 0, sit: p.sit || 0, longHair: p.long || 0, sway: p.sway || 0, sweat: p.sweat || 0, twitch: p.twitch || 0, ground: 1 };
  if (p.fallen) { g.save(); g.translate(x, y - h * .05); g.rotate(p.fallen * Math.PI / 2 * (p.fallDir || 1)); person(0, 0, h, { ...o, walk: null, arms: 'out' }); g.restore(); return; }
  person(x, y, h, o);
  const gl = p.glow ?? 1;
  if (p.zombie && gl > 0 && !o.back) { const hy = y - h * .855 + (p.slump || 0) * h * .05; for (const sg of [-1, 1]) L(x + sg * h * .052, hy, h * .07, '200,255,230', .9 * gl, .55 * gl); }
  if (p.arms === 'phone' && !o.back) L(x + h * .12, y - h * .83, h * .5, C.cyan, .7, .25);
  if (p.hl) L(x, y - h * .55, h * .85, C.amb, .5 * p.hl, .1 * p.hl);
}

// ---------- the people: shoppers who stroll, turn at the scream, then run for the doors or freeze; the guard; the infected; the hero ----------
const AG = [];
for (let k = 0; k < 64; k++) {
  const lane = -7.4 + 14.8 * hash(k * 2.3), z0 = 2 + 19 * hash(k * 4.1), dir = hash(k * 3.9) < .5 ? 1 : -1, v = .8 + .5 * hash(k * 5.3);
  const a = { i: k, lane, z0, dir, v, h: 1.55 + .3 * hash(k * 7.1), hood: tone3(pickH(PAL.shirt, k * 3.3)), legs: tone3(pickH(PAL.pants, k * 4.7)), skin: pickH(PAL.skin, k * 5.9), hair: pickH(PAL.hair, k * 6.1), long: hash(k * 8.3) < .4, outfit: hash(k * 9.7) < .35 ? 'shirt' : 'hoodie', phone: hash(k * 2.9) < .15,
    glasses: hash(k * 12.7) < .18, cap: hash(k * 13.9) < .1 ? tone3(pickH(PAL.shirt, k * 2.2)) : null };
  a.tS = S_SCREAM + .25 + .5 * hash(k * 13.1);                       // everyone stops and turns to the entrance at the scream
  a.tR = S_FLEE + .2 + 1.4 * hash(k * 8.8) + .05 * (DZ - z0);       // then runs (or freezes) once the alarm goes
  a.role = hash(k * 11.3) > .32 ? 'run' : 'freeze'; AG.push(a);
}
function calmPos(a, st) { const L_ = 19, p = (((a.z0 - 2) + a.dir * a.v * st) % (2 * L_) + 2 * L_) % (2 * L_), fwd = p < L_; return { X: a.lane, Z: 2 + (fwd ? p : 2 * L_ - p), toward: fwd ? 1 : -1 }; }   // toward +1 = walking into the picture (back to us)
{ const runners = AG.filter(a => a.role === 'run').sort((p, q) => p.tR - q.tR); runners.forEach((a, k) => { const row = Math.floor(k / 9), c = k % 9; a.slot = [-3.0 + c * .75 + (row % 2) * .35, DZ - .45 - row * .55]; a.fall = row >= 2 && row <= 4 && hash(a.i * 17.7) > .7 ? S_JAM + .3 + 2 * hash(a.i * 3.7) : null; }); }
const FREEZER = AG.filter(a => a.role === 'freeze' && Math.abs(a.lane) > 2.8).sort((p, q) => Math.abs(calmPos(p, p.tS).Z - 7) - Math.abs(calmPos(q, q.tS).Z - 7))[0];
function shopper(a, st) {
  const base = { hood: a.hood, legs: a.legs, skin: a.skin, hair: a.hair, long: a.long, outfit: a.outfit, glasses: a.glasses, cap: a.cap, h: a.h, seed: a.i };
  const c = calmPos(a, Math.min(st, a.tS));
  if (st < a.tS) return { ...base, X: c.X, Z: c.Z, face: c.toward > 0 ? 'back' : 'front', walk: st * 5 * a.v + a.i, arms: a.phone ? 'phone' : 'down' };
  if (st < a.tR) return { ...base, X: c.X, Z: c.Z, face: 'back', arms: a.phone ? 'phone' : 'down' };
  const dt = st - a.tR;
  if (a.role === 'freeze') return { ...base, X: c.X, Z: c.Z, face: 'front', arms: a === FREEZER || hash(a.i * 5.5) < .5 ? 'down' : 'rub', eyes: 'wide', look: (a === FREEZER ? .25 : .6) * Math.sin(st * .9 + a.i), mouth: .15, keep: a === FREEZER };
  const L_ = Math.hypot(a.slot[0] - c.X, a.slot[1] - c.Z), d = Math.min(L_, run_(3.6 + .8 * hash(a.i), dt)), u = d / L_;
  if (u < 1) return { ...base, X: lerpA(c.X, a.slot[0], u), Z: lerpA(c.Z, a.slot[1], u), face: 'back', walk: st * 11 + a.i, arms: 'out', sweat: 1 };
  const fallen = a.fall !== null && st > a.fall ? ss(seg(st, a.fall, a.fall + .4)) : 0;
  return { ...base, X: a.slot[0] + .06 * Math.sin(st * 3.1 + a.i), Z: a.slot[1] + .05 * Math.sin(st * 2.3 + a.i), face: 'back', arms: fallen ? 'out' : 'reach', fallen, fallDir: hash(a.i) < .5 ? -1 : 1, sway: .3 * Math.sin(st * 4 + a.i) };
}
const GUARD = { X: -4.6, Z: 21.2 }, SCR = { X: -1.2, Z: 20.0 }, Z0P = { X: -3.0, Z: 21.4 }, Z1P = { X: 2.9, Z: 21.3 }, V2 = { X: 4.4, Z: 20.8 };
// the guard by the doors, the woman who screams (on her phone; she looks up, screams, runs), the woman the second one goes for
function extras(st) {
  const gF = ss(seg(st, S_LUNGE + .15, S_LUNGE + .5)), vF = ss(seg(st, S_TURN2 + .1, S_TURN2 + .45));
  const out = [{ X: GUARD.X, Z: GUARD.Z, face: 'front', outfit: 'shirt', hood: ['#4a5a8a', '#2d3d66', '#141c36'], legs: tone3('#1c2233'), skin: PAL.skin[2], hair: HAIRC, cap: ['#3a4a78', '#25335a', '#121a33'], h: 1.76, seed: 70,
      eyes: st > S_SCREAM ? 'wide' : 'open', look: st > S_SCREAM ? .8 : 0, mouth: st > S_LUNGE ? .5 : 0, arms: st > S_LUNGE ? 'out' : 'down', fallen: gF, fallDir: 1 },
    { X: V2.X, Z: V2.Z, face: 'front', hood: tone3('#e0b040'), legs: tone3('#2a2d3a'), skin: PAL.skin[0], hair: PAL.hair[2], long: 1, h: 1.6, seed: 72, eyes: st > S_SCREAM ? 'wide' : 'open', look: st > S_LUNGE ? -.8 : 0, mouth: st > S_TURN2 ? .7 : 0, arms: st > S_TURN2 ? 'out' : 'down', fallen: vF, fallDir: 1 }];
  const sb = { hood: tone3('#c8507a'), legs: tone3('#2a2a3a'), skin: PAL.skin[1], hair: PAL.hair[1], long: 1, h: 1.62, seed: 71, keep: 1 };
  if (st < S_LUNGE + .3) out.push({ ...sb, X: SCR.X, Z: SCR.Z, face: 'front', arms: st < S_SCREAM - .1 ? 'phone' : 'up', eyes: st > S_SCREAM - .45 ? 'wide' : 'open', look: st > S_SCREAM - .45 ? -.9 : .2, lookY: st < S_SCREAM - .45 ? .6 : 0, mouth: st > S_SCREAM - .05 ? .95 : 0, sweat: st > S_SCREAM ? 1 : 0 });
  else { const d = run_(3.4, st - S_LUNGE - .3), L_ = Math.hypot(2.2, 5.5), u = Math.min(1, d / L_); out.push({ ...sb, keep: 0, X: lerpA(SCR.X, 1.0, u), Z: lerpA(SCR.Z, 14.5, u), face: 'front', walk: u < 1 ? st * 11 : null, arms: u < 1 ? 'out' : 'rub', eyes: 'wide', mouth: u < 1 ? .6 : .2, sweat: 1 }); }
  return out;
}
const ZSIDE = [[-8.3, 14], [8.3, 16], [-8.3, 18.5], [8.3, 11.5], [-8.3, 9.5], [8.3, 19]].map(([x, z], k) => ({ x, z, t0: S_FLEE + 1 + k * .9, tx: Math.sign(x) * (3.6 + .8 * hash(k)), tz: DZ - 4.6 - .8 * hash(k * 3), k }));
const ZQ = { x0: 3.4, z0: 12.4, x1: 1.4, z1: 18.4, t0: T('l09') - 1.2 };      // the one we follow toward the noise
const zq = st => { const L_ = Math.hypot(ZQ.x1 - ZQ.x0, ZQ.z1 - ZQ.z0), u = clamp((st - ZQ.t0) * .8 / L_); return { X: lerpA(ZQ.x0, ZQ.x1, u), Z: lerpA(ZQ.z0, ZQ.z1, u), u }; };
function infected(st) {
  const out = [], zc = k => ({ zombie: 1, outfit: 'shirt', skin: ZSK[k % 2], hood: tone3(ZCL[k % 4]), legs: tone3('#22201c'), hair: ['#14110e', '#0b0907', '#050403'], eyes: 'dead', seed: 40 + k });
  // patient zero: hunched by the doors, twitching; his eyes light at the scream; then the lunge, and he stays bent over the guard
  if (st < S_LUNGE) out.push({ ...zc(0), X: Z0P.X, Z: Z0P.Z, face: 'front', slump: .35, arms: st > S_SCREAM - .3 ? 'reach' : 'down', twitch: 1, glow: ss(seg(st, S_SCREAM - .4, S_SCREAM)) });
  else { const u = ss(seg(st, S_LUNGE, S_LUNGE + .3)); out.push({ ...zc(0), X: lerpA(Z0P.X, GUARD.X + .9, u), Z: lerpA(Z0P.Z, GUARD.Z - .25, u), face: 'front', arms: 'reach', slump: .25 + .3 * ss(seg(st, S_LUNGE + .5, S_LUNGE + 1)) }); }
  // the second one: a man by the doors, twitching since the first attack; at "another" he lunges at the woman beside him
  const t2 = S_TURN2 - .1;
  if (st < t2) out.push({ X: Z1P.X, Z: Z1P.Z, face: 'front', outfit: 'shirt', hood: tone3('#45505a'), legs: tone3('#2b2b2b'), skin: PAL.skin[1], hair: HAIRC, seed: 41, slump: st > S_LUNGE ? .3 : 0, twitch: st > S_LUNGE ? 1 : 0, look: st > S_SCREAM ? -.6 : 0 });
  else { const u = ss(seg(st, t2, t2 + .3)); out.push({ ...zc(1), X: lerpA(Z1P.X, V2.X - .4, u), Z: lerpA(Z1P.Z, V2.Z - .2, u), face: 'front', arms: 'reach', glow: ss(seg(st, t2, t2 + .25)), slump: .25 + .3 * ss(seg(st, t2 + .5, t2 + 1)) }); }
  // more of them come out of the side shops, toward the noise at the doors
  for (const z of ZSIDE) { if (st < z.t0) continue; const d = (st - z.t0) * .85, L_ = Math.hypot(z.tx - z.x, z.tz - z.z), u = Math.min(1, d / L_);
    out.push({ ...zc(z.k + 2), X: lerpA(z.x, z.tx, u), Z: lerpA(z.z, z.tz, u), face: u < 1 && z.tz > z.z ? 'back' : 'front', arms: 'reach', walk: u < 1 ? st * 3 + z.k : null, slump: .25 }); }
  if (st > ZQ.t0 - 2) { const q = zq(st); out.push({ ...zc(7), X: q.X, Z: q.Z, face: 'back', arms: 'reach', walk: q.u < 1 ? st * 3 : null, slump: .2, keep: 1 }); }
  return out;
}
// the hero: walks in calm, stops at the scream, turns away from the stampede, walks off along the left side toward the fire exit
const H_STOP = S_SCREAM + .2, B0 = S_FLEE + .5, C0 = T('l10') - .1, D0 = T('l12') - .1;
function hero(st) {
  if (st < H_STOP) { const z = 9.6 - Math.max(0, H_STOP - st) * 1.15; return { ...HB, X: -.4, Z: Math.max(2.2, z), face: 'back', walk: z > 2.2 ? st * 5.5 : null }; }
  if (st < B0) return { ...HB, X: -.4, Z: 9.6, face: 'back' };
  if (st < C0) { const d = Math.min(6.3, (st - B0) * 1.1), u = d / 6.3; return { ...HB, X: lerpA(-.4, -5.0, ss(u)), Z: lerpA(9.6, 10.8, ss(u)) - d * .2 * (1 - u), face: 'front', walk: u < 1 ? st * 5.5 : null, look: u < 1 ? 0 : .5 * Math.sin(st * .7), eyes: 'wide' }; }
  if (st < D0) { const d = run_(1.5, st - C0); return { ...HB, X: lerpA(-5.0, -6.6, clamp(d / 5)), Z: Math.max(5.6, 10.6 - d), face: 'front', walk: st * 6.5, eyes: 'wide' }; }
  return { ...HB, X: -7.6, Z: 5.3, face: 'back', walk: st * 3 };
}
const staged = (st, o = {}) => { const al = st >= S_ALARM ? ss(seg(st, S_ALARM, S_ALARM + .4)) : 0, zf = o.zf ?? 1;
  const ppl = [...AG.map(a => shopper(a, st)), ...extras(st), ...(o.noHero ? [] : [hero(st)])];
  if (zf > .02) for (const p of infected(st)) ppl.push({ ...p, glow: (p.glow ?? 1) * zf, fade: zf });
  return { alarm: al, people: ppl, zf }; };
const keepOnly = (s, f) => { s.people = s.people.filter(p => p.keep || f(p)); return s; };
const clearFront = (s, h) => keepOnly(s, p => !(p.Z < h.Z + .6 && Math.abs(p.X - h.X) < 1.1));     // nobody between the lens and the hero

// ---------- the fire-exit corridor: narrow, cold strip lights, the green EXIT sign over a steel door; the door opens onto white ----------
function corridor(t, st, o = {}) {
  const save = { ...PC }; PC.x = o.cx || 0; PC.y = 1.6; PC.z = o.cz || 0; PC.hy = 980; PC.F = 1000;
  fill('#08090c'); const CW = 1.5, CL = 9, CH = 3.2;
  poly([[-CW, 0, CL], [-CW, CH, CL], [CW, CH, CL], [CW, 0, CL]], '#2a2e34');
  const open = o.open || 0, [dx0, dy1] = prj(-.7, 2.3, CL - .02), [dx1, dy0] = prj(.7, 0, CL - .02);
  g.fillStyle = 'rgba(225,240,255,1)'; g.fillRect(dx0, dy1, dx1 - dx0, dy0 - dy1); if (open > 0) L((dx0 + dx1) / 2, (dy0 + dy1) / 2, 900 * open, C.white, .9 * open, .5 * open);
  g.save(); g.translate(dx0, 0); g.scale(Math.cos(open * 1.3), 1); g.fillStyle = lg(0, 0, dx1 - dx0, 0, ['#5d6166', '#7a7f86', '#4a4e54']); g.fillRect(0, dy1, dx1 - dx0, dy0 - dy1); g.fillStyle = '#c9a45e'; g.fillRect((dx1 - dx0) * .15, lerp(dy1, dy0, .55), (dx1 - dx0) * .7, 8); g.restore();
  const [sx, sy, sk] = prj(0, 2.75, CL - .05); rr(sx - sk * .6, sy - sk * .22, sk * 1.2, sk * .44, 6); g.fillStyle = '#04140a'; g.fill(); g.save(); g.shadowColor = 'rgba(80,255,150,1)'; g.shadowBlur = 24; text(TX.exit, sx, sy + 2, sk * .34, '#7dffae', 'Anton'); g.restore(); L(sx, sy, 3 * sk, C.grn, .9, .45);
  for (const side of [-1, 1]) { poly([[side * CW, 0, 0], [side * CW, CH, 0], [side * CW, CH, CL], [side * CW, 0, CL]], side < 0 ? '#3a3e46' : '#33373e'); for (let z = 1; z < CL; z += 2) { const [x, y, k] = prj(0, CH - .02, z); rr(x - .5 * k, y - .03 * k, k, .06 * k, 3); g.fillStyle = '#e8f2ff'; g.fill(); L(x, y, 2 * k, C.white, .45, .15); } }
  poly([[-CW, 0, 0], [CW, 0, 0], [CW, 0, CL], [-CW, 0, CL]], '#22252a'); for (let z = 0; z < CL; z += .6) poly([[-CW, 0, z], [CW, 0, z], [CW, 0, z + .02], [-CW, 0, z + .02]], 'rgba(0,0,0,.4)');
  poly([[-CW, CH, 0], [CW, CH, 0], [CW, CH, CL], [-CW, CH, CL]], '#15171b');
  if (o.hero) drawPerson(t, o.hero);
  lightPass('#2a3448'); Object.assign(PC, save);
}
// ---------- the mall directory: a lit standee with the floor plan; the crowd at the entrance (red), the orange dot is you, a green way to the exit ----------
function directory(t, u) {
  grad('#100c10', '#1e1620', -400, 2300); motes(0, 0, W, H, 40, t, C.amb, .3, 5);
  const k = lerp(1, 1.16, ss(u / 3.5)); g.save(); g.translate(CX, 900); g.scale(k, k); g.translate(-CX, -900);
  const x0 = 150, y0 = 250, w = 780, h = 1200;
  rr(x0 - 26, y0 - 26, w + 52, h + 52, 20); g.fillStyle = lg(x0, 0, x0 + w, 0, ['#7a5a2a', '#e0c07a', '#6a4a20']); g.fill(); rr(x0, y0, w, h, 10); g.fillStyle = lg(0, y0, 0, y0 + h, ['#2c2822', '#1a1712']); g.fill();
  text(TX.directory, CX, y0 + 95, 78, '#f6e2b8', 'Anton');
  const s = 34, toP = (X, Z) => [CX + X * s, 930 + (Z - 12) * s];
  const [ax, ay] = toP(-HW, 2); g.fillStyle = 'rgba(216,200,160,.08)'; g.fillRect(ax, ay, 2 * HW * s, 20 * s); g.strokeStyle = '#e0d0a8'; g.lineWidth = 5; g.strokeRect(ax, ay, 2 * HW * s, 20 * s);
  for (let z = 2; z < DZ - .1; z += 3.6) for (const side of [-1, 1]) { const [a, b] = toP(side * HW, z); g.fillStyle = 'rgba(216,200,160,.16)'; g.fillRect(side < 0 ? a : a - 2.6 * s, b + 3, 2.6 * s, 3.6 * s - 6); g.strokeStyle = 'rgba(224,208,168,.6)'; g.lineWidth = 2; g.strokeRect(side < 0 ? a : a - 2.6 * s, b + 3, 2.6 * s, 3.6 * s - 6); }
  const [fx, fy] = toP(0, 12); circ(fx, fy, 2.2 * s, '#e0d0a8', 4); circ(fx, fy, 1.4 * s, 'rgba(110,170,230,.35)');
  const [nx, ny] = toP(0, DZ); for (let i = 0; i < 46; i++) circ(nx + (hash(i * 3.3) - .5) * 6.4 * s, ny - 10 - hash(i * 7.7) * 2.6 * s, 6, `rgba(255,70,80,${.6 + .4 * Math.sin(t * 6 + i)})`);
  rr(nx - 120, ny - 2, 240, 52, 8); g.fillStyle = '#e8d9b8'; g.fill(); text(TX.entrance, nx, ny + 25, 34, '#100d0b', 'Anton'); L(nx, ny - 40, 220, C.red, .8, .25);
  const [ex, ey] = toP(-HW, (EXZ[0] + EXZ[1]) / 2); circ(ex, ey, 36, '#3dd47a'); text('EXIT', ex, ey + 2, 26, '#04140a', 'Anton');
  const [hx, hy] = toP(-6.4, 7.5), pulse = 1 + .15 * Math.sin(t * 5);
  g.setLineDash([16, 12]); line([[hx, hy], [ex + 36, ey]], 7, 'rgba(61,212,122,.95)'); g.setLineDash([]);
  circ(hx, hy, 26 * pulse, '#ff7a35'); circ(hx, hy, 26 * pulse, '#fff', 5); L(hx, hy, 170, C.amb, .9, .5);
  text(TX.here, hx + 44, hy + 64, 50, '#ffa070', 'Anton', 'left');
  L(CX, y0 + h * .5, 900, C.warm, .85, .06); L(ex, ey, 220, C.grn, .9, .45); L(CX, y0 + 95, 300, C.warm, .7, .1);
  g.restore(); lightPass('#3a3048');
}

// ---------- overlays special to this reel: the clock since the scream, rule cards (danger red), the big end cards ----------
const CDK = [['l03', 0], ['l05', 10], ['l08', 45], ['l13', 90], ['l14', 96]].map(([id, s]) => [T(id), s]);
function clock(t, y = 165) {
  if (t < CDK[0][0] || t >= CDK[CDK.length - 1][0]) return;
  let s = 0; for (let i = 0; i < CDK.length - 1; i++) if (t >= CDK[i][0] && t < CDK[i + 1][0]) s = lerp(CDK[i][1], CDK[i + 1][1], (t - CDK[i][0]) / (CDK[i + 1][0] - CDK[i][0]));
  s = Math.floor(s); const red = t > S_ALARM, pulse = red ? .5 + .5 * Math.sin(t * 7.5) : 0, k = back(seg(t, CDK[0][0], CDK[0][0] + .3), 1.8), str = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  reset(); g.save(); g.translate(CX, y); g.scale(k * (1 + .03 * pulse), k * (1 + .03 * pulse)); glass(-210, -64, 420, 128, 64, red ? RED : AMB, 5, red ? 'rgba(255,49,80,.9)' : 'rgba(255,170,80,.8)');
  const cx = -140; circ(cx, 0, 32, 'rgba(255,255,255,.08)'); circ(cx, 0, 32, red ? RED : AMB, 4); const a = t * 8; line([[cx, 0], [cx + Math.sin(a) * 22, -Math.cos(a) * 22]], 4, red ? RED : AMB); line([[cx, 0], [cx, -15]], 4, '#fff');
  g.save(); g.shadowColor = red ? 'rgba(255,49,80,1)' : 'rgba(255,200,120,.8)'; g.shadowBlur = 20; text(str, 30, -2, 80, red ? '#ff6a7a' : '#fff', 'Anton'); g.restore();
  g.font = '500 22px sans-serif'; g.fillStyle = '#b9b0c8'; g.textAlign = 'center'; g.fillText(TX.since, 30, 46); g.restore();
}
function ruleCard(t, t0, t1, n, label) {
  const k = back(seg(t, t0, t0 + .28), 2.2) * (1 - ss(seg(t, t1 + .1, t1 + .35))); if (k <= 0) return;
  reset(); g.save(); g.translate(CX, 470); g.scale(k, k); glass(-420, -140, 840, 280, 34, RED, 5, 'rgba(255,49,80,.8)');
  text(`${TX.rule} ${n}`, 0, -70, 54, '#ff8a96', 'Anton'); g.font = '96px Anton'; const sc = Math.min(1, 760 / g.measureText(label).width);
  g.save(); g.translate(0, 34); g.scale(sc, sc); g.shadowColor = 'rgba(255,49,80,.9)'; g.shadowBlur = 30; text(label, 0, 0, 96, '#fff', 'Anton'); g.restore(); g.restore();
}
function bigCard(t, t0, top, bottom, col = YEL, glowc = 'rgba(255,170,80,1)') {
  const k = back(seg(t, t0, t0 + .3), 1.7); if (k <= 0) return; reset(); g.save(); g.translate(CX, 600); g.scale(k, k);
  glass(-440, -150, 880, 300, 44, 'rgba(255,255,255,.65)', 4, 'rgba(255,255,255,.45)');
  g.font = '86px Anton'; const s1 = Math.min(1, 800 / g.measureText(top).width); g.save(); g.translate(0, -44); g.scale(s1, s1); text(top, 0, 0, 86, '#fff', 'Anton'); g.restore();
  g.font = '70px Anton'; const s2 = Math.min(1, 800 / g.measureText(bottom).width); g.save(); g.translate(0, 62); g.scale(s2, s2); g.shadowColor = glowc; g.shadowBlur = 24; text(bottom, 0, 0, 70, col, 'Anton'); g.restore(); g.restore();
}

// ---------- shots ----------
const S = {};
const setPC = (x, y, z, hy = 960, F = 1000) => { PC.x = x; PC.y = y; PC.z = z; PC.hy = hy; PC.F = F; };
// 1. the hook: the crowd crushed against the doors in the red light, them behind the glass; the orange hoodie walks out of it, toward us
const hookHero = st => ({ ...HB, X: .3, Z: 18 - (st - S_HOOK), face: 'front', walk: st * 6.4, eyes: 'wide', mouth: .25, look: .3 * Math.sin(st * 1.7), sweat: 1 });
function rushShot(t, st) { const h = hookHero(st); setPC(.3, 1.75, h.Z - 2.9, 940, 1000);
  const s = clearFront(staged(st, { noHero: 1 }), h); s.people.push(h); hall(t, s); }
S.rush = (t, u) => { cam(CX, 900, 1, 0, 4, t); rushShot(t, S_HOOK + u); };
// 2. calm: 8 p.m., the hall full of people; then up on the first gallery ("thousands")
S.atrium = (t, u) => { cam(CX, 900, 1); const tw = wordT('l02', 'Libo');
  if (t < tw - .05) setPC(0, 1.6, lerp(-1.5, .5, ss(seg(u, 0, tw - T('l02')))), 960); else setPC(lerp(-.6, .6, seg(t, tw, E('l02'))), 6.6, -1.5, 760, 900);
  hall(t, staged(t)); };
// 3. by the doors: a woman on her phone looks up, and screams (behind her, by the glass, the hunched man)
S.scream = (t, u) => { cam(CX, 900, 1 + .07 * eo(seg(t, S_SCREAM, S_SCREAM + .35)), 0, t > S_SCREAM ? 3 * Math.exp(-(t - S_SCREAM) * 3) : 0, t); setPC(-1.7, 1.35, 18.0, 980, 1050);
  hall(t, keepOnly(staged(t), p => p.Z > 20.3)); };
// 4. he lunges at the guard; then "another": a man by the doors lunges at the woman beside him (a hard cut across)
S.lunge = (t, u) => { const hit = t > S_TURN2 - .1 ? S_TURN2 - .1 : S_LUNGE; cam(CX, 900, 1, 0, t > hit ? 6 * Math.exp(-(t - hit) * 4) : 0, t);
  if (t < S_TURN2 - .15) setPC(-3.4, 1.45, 17.2, 990, 1100); else setPC(3.8, 1.45, 17.4, 990, 1100);
  hall(t, keepOnly(staged(t), p => p.Z > 20.4 || (p.Z > 19.4 && Math.abs(p.X - PC.x) > 1.6))); };
// 5. the alarm: high and wide from the gallery, red strobes, everyone runs for the doors they came in by; one orange hoodie goes the other way
S.well = (t, u) => { cam(CX, 900, 1, 0, 2 * Math.exp(-u * 2), t); setPC(lerp(-.4, .3, seg(u, 0, span('l05'))), 8.0, lerp(-3, -1.2, ss(seg(u, 0, span('l05')))), 420, 900); hall(t, staged(t)); };
// 6. behind the runners, into the red light at the doors they came in by
S.brain = (t, u) => { cam(CX, 900, 1, 0, 2, t); setPC(2.8, 1.7, lerp(3.5, 7.5, seg(u, 0, span('l06'))), 980, 1000); hall(t, { ...staged(t, { noHero: 1 }), near: 2.6 }); };
// 7. 3 in 4 freeze: close on one of them, wide-eyed and still, while the others run past
S.freeze = (t, u) => { cam(CX, 900, 1); const c = calmPos(FREEZER, FREEZER.tS); setPC(c.X + lerp(.5, .15, seg(u, 0, 4)), 1.5, c.Z - 2.3, 960, 1050); hall(t, staged(t)); };
// 8. the doors jam: the crowd packed against the glass, the red light, some go down
S.crush = (t, u) => { cam(CX, 900, lerp(1, 1.04, seg(u, 0, 3)), 0, 4, t); setPC(.2, 2.3, 16.4, 1030, 1000); hall(t, staged(t, { noHero: 1 })); };
// 9. low, behind one of them, walking toward the noise
S.noise = (t, u) => { cam(CX, 900, 1); const q = zq(t); setPC(q.X + .7, .9, q.Z - 2.7, 1040, 1000); hall(t, staged(t, { noHero: 1 })); };
// 10-12. the rules. 1: walking away from it all; 2: the green EXIT sign down the corridor; 3: sneaking past one of them, a finger to the lips
S.r1 = (t, u) => { cam(CX, 900, 1); const h = hero(t); setPC(h.X + .3, 1.3, h.Z - 3.0, 1000, 1000); hall(t, clearFront(staged(t), h)); ruleCardQ.push([T('l10'), E('l10'), 1, TX.rules[0]]); };
S.r2 = (t, u) => { cam(CX, 900, lerp(1, 1.06, seg(u, 0, 3))); const cz = lerp(-1.5, .3, seg(u, 0, span('l11'))); corridor(t, t, { cz, hero: { ...HB, X: .3, Z: cz + 2.7, face: 'back', walk: t * 5.5, rim: 'rgba(120,255,170,.6)' } }); ruleCardQ.push([T('l11'), E('l11'), 2, TX.rules[1]]); };
const ZNpose = t => ({ zombie: 1, outfit: 'shirt', skin: ZSK[0], hood: tone3('#33302a'), legs: tone3('#22201c'), hair: ['#14110e', '#0b0907', '#050403'], eyes: 'dead', X: -3.4, Z: 8.0, face: 'front', look: .8 * Math.sin(t * .6), slump: .3, arms: 'reach', sway: .4 * Math.sin(t * .8), seed: 60, rim: 'rgba(170,230,200,.75)', keep: 1 });
const sneak = (t, u) => ({ ...HB, X: lerp(-4.3, -6.3, seg(u, 0, span('l12') + .2)), Z: 5.4, h: 1.5, face: 'front', walk: t * 3.2, arms: 'shh', eyes: 'wide', look: .7, slump: .1, sweat: 1 });
S.r3 = (t, u) => { cam(CX, 900, 1); setPC(-5.0, 1.0, 2.6, 1200, 1000); const s = keepOnly(staged(t, { noHero: 1 }), p => p.Z > 13); s.people.push(ZNpose(t), sneak(t, u)); hall(t, s); ruleCardQ.push([T('l12'), E('l12'), 3, TX.rules[2]]); };
// 13. the door nobody is looking at: down the corridor behind the hero; it opens onto white
S.exit = (t, u) => { cam(CX, 900, lerp(1, 1.1, ss(seg(u, 1.5, span('l13'))))); const d = run_(2.2, u), open = ss(seg(u, span('l13') - 1.2, span('l13') - .4));
  corridor(t, t, { cz: lerp(-.5, 2.5, ss(seg(u, 0, span('l13')))), open, hero: { ...HB, X: .1, Z: Math.min(8.2, 1.4 + d), face: 'back', walk: d < 6.8 ? t * 9 : null, rim: 'rgba(225,240,255,.8)' } }); };
// 14-15. zombies aren't real: the same jam, the infected fade away; then low, into it (a fire, a stampede: the same)
S.real = (t, u) => { cam(CX, 900, 1); setPC(0, 6.6, 6.0, 780, 950); hall(t, staged(t, { noHero: 1, zf: 1 - ss(seg(t, T('l14') + .3, T('l14') + 1.4)) })); };
S.truth = (t, u) => { cam(CX, 900, lerp(1, 1.06, seg(u, 0, 4)), 0, 2, t); setPC(.4, 1.5, lerp(12.5, 14.5, seg(u, 0, 4)), 990, 1000); hall(t, staged(t, { noHero: 1, zf: 0 })); };
// 16. the mall directory: the orange dot is you
S.tip = (t, u) => { cam(CX, 960, 1); directory(t, u); };
// 17-18. back to the calm night: comment (down the hall); share (from the gallery)
S.comment = (t, u) => { cam(CX, 900, 1); setPC(0, 1.6, lerp(-1.5, -.5, seg(u, 0, 4)), 960); hall(t, staged(3.2 + u)); };
S.cta = (t, u) => { cam(CX, 900, 1); setPC(lerp(.6, -.2, seg(u, 0, 3)), 6.6, -1.5, 760, 900); hall(t, staged(5.2 + u)); };
// the loop: the last frames run into frame 1
S.loop = (t, u) => { const L_ = TL.dur - T('tail'); cam(CX, 900, 1, 0, 4, t); rushShot(t, S_HOOK + u - L_); };

let ruleCardQ = [];
function bloom() { reset(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .24; g.filter = 'blur(16px)'; g.drawImage(cv, 0, 0); reset(); }
function vignette(a = .55) { reset(); g.fillStyle = rg(CX, H * .45, H * .22, H * .78, ['rgba(0,0,0,0)', `rgba(2,2,10,${a})`]); g.fillRect(0, 0, W, H); }
const SHOTS = []; { const ls = TL.lines; for (let i = 0; i < ls.length; i++) {
  const end = i < ls.length - 1 ? ls[i + 1].t0 : TL.dur;
  if (i && ls[i].shot === ls[i - 1].shot) { SHOTS[SHOTS.length - 1][1] = end; continue; }
  SHOTS.push([i ? SHOTS[SHOTS.length - 1][1] : 0, end, ls[i].shot]); } }
const NOPUNCH = ['rush', 'well', 'loop', 'cta', 'comment', 'tip', 'exit', 'r1', 'r2', 'r3', 'atrium', 'lunge', 'freeze', 'scream', 'noise'];
const NOCLOCK = ['rush', 'loop', 'real', 'truth', 'tip', 'comment', 'cta'];
window.renderAt = (t) => {
  reset(); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); LIGHTS = []; ruleCardQ = [];
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1], u = t - sh[0];
  const ln = TL.lines.find(l => l.words && t >= l.t0 && t < l.t1 + .2);
  ZK = 1;
  if (ln && ln.t1 - ln.t0 > 2.4 && !NOPUNCH.includes(sh[2])) { const mid = ln.words[Math.floor(ln.words.length / 2)][1]; ZK = 1 + .07 * eo(seg(t, mid, mid + .35)); }
  S[sh[2]](t, u);
  bloom(); vignette(.55);
  reset(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .07; g.drawImage(TEX.paper, 0, 0, W, H); reset();
  if (sh[2] === 'rush') title(t, 1); else if (sh[2] === 'loop') title(t, ss(seg(u, .2, .6)));
  if (!NOCLOCK.includes(sh[2])) clock(t);
  statCard(t);
  for (const q of ruleCardQ) ruleCard(t, ...q);
  if (sh[2] === 'comment') bigCard(t, T('l17') + .1, TX.where, TX.comment);
  if (sh[2] === 'cta') bigCard(t, T('l18'), TX.share[0], TX.share[1]);
  if (!['cta', 'loop', 'comment'].includes(sh[2])) captions(t);
};
window.fontsReady = Promise.all([document.fonts.load('80px Anton'), document.fonts.load('600 40px Caveat')]).then(() => true);
